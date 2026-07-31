use crate::services::backup_orchestrator::BackupOrchestrator;
use crate::services::github_service::{GitHubService, TokenValidationResult};
use crate::services::scheduler_service::SchedulerService;
use crate::store::ConfigStore;
use crate::types::{AppSettings, BackupSummary, RepoFilterSet, RepoInfo};
use serde::Serialize;
use serde_json::Value;
use tauri::{AppHandle, State};
use tauri_plugin_dialog::DialogExt;
use tauri::Manager;

pub struct AppState {
    pub orchestrator: BackupOrchestrator,
    pub scheduler: SchedulerService,
}

#[tauri::command(rename = "github:validate-token")]
pub async fn validate_token(token: String) -> Result<TokenValidationResult, String> {
    let service = GitHubService::new(&token)?;
    Ok(service.validate_token().await)
}

#[tauri::command(rename = "github:fetch-repos")]
pub async fn fetch_repos(token: String, filters: RepoFilterSet) -> Result<Vec<RepoInfo>, String> {
    let service = GitHubService::new(&token)?;
    service.fetch_repos(&filters).await
}

#[tauri::command(rename = "settings:get")]
pub fn get_settings(app: AppHandle) -> Result<AppSettings, String> {
    let store = ConfigStore::new(&app);
    store.read()
}

#[tauri::command(rename = "backup:get-state")]
pub async fn get_backup_state(state: State<'_, AppState>) -> Result<crate::types::BackupState, String> {
    let s = state.orchestrator.state.read().await;
    Ok(s.clone())
}

#[tauri::command(rename = "settings:set")]
pub fn set_settings(
    app: AppHandle,
    partial: Value,
    _state: State<'_, AppState>,
) -> Result<(), String> {
    let store = ConfigStore::new(&app);
    let mut current = store.read()?;

    let mut schedule_changed = false;
    let mut current_val = serde_json::to_value(&current).map_err(|e| e.to_string())?;
    if let Value::Object(ref mut map) = current_val {
        if let Value::Object(partial_map) = partial {
            if partial_map.contains_key("schedule") {
                schedule_changed = true;
            }
            for (k, v) in partial_map {
                map.insert(k, v);
            }
        }
    }
    current = serde_json::from_value(current_val).map_err(|e| e.to_string())?;

    store.write(&current)?;
    
    if schedule_changed {
        start_scheduler_job(&app, &_state);
    }

    Ok(())
}

pub fn start_scheduler_job(app: &AppHandle, state: &State<'_, AppState>) {
    let store = ConfigStore::new(app);
    if let Ok(settings) = store.read() {
        let app_clone = app.clone();
        let scheduler = state.scheduler.clone();
        tauri::async_runtime::spawn(async move {
            let _ = scheduler.start(&settings.schedule, move || {
                let app_inner = app_clone.clone();
                tauri::async_runtime::spawn(async move {
                    let store_inner = ConfigStore::new(&app_inner);
                    if let Ok(set) = store_inner.read() {
                        if set.github_token.is_empty() {
                            return;
                        }
                        if let Ok(service) = GitHubService::new(&set.github_token) {
                            if let Ok(repos) = service.fetch_repos(&set.repo_filters).await {
                                let selected: Vec<RepoInfo> = repos
                                    .into_iter()
                                    .filter(|r| set.selected_repo_ids.contains(&r.id))
                                    .collect();
                                if !selected.is_empty() {
                                    let state_inner = app_inner.state::<AppState>();
                                    let _ = state_inner
                                        .orchestrator
                                        .run(app_inner.clone(), selected, set)
                                        .await;
                                }
                            }
                        }
                    }
                });
            }).await;
        });
    }
}

#[tauri::command(rename = "backup:start")]
pub async fn start_backup(
    app: AppHandle,
    repos: Vec<RepoInfo>,
    state: State<'_, AppState>,
) -> Result<BackupSummary, String> {
    let store = ConfigStore::new(&app);
    let settings = store.read()?;
    state.orchestrator.run(app, repos, settings).await
}

#[tauri::command(rename = "backup:cancel")]
pub async fn cancel_backup(state: State<'_, AppState>) -> Result<(), String> {
    state.orchestrator.cancel();
    Ok(())
}

#[tauri::command(rename = "dialog:select-folder")]
pub fn select_folder(app: AppHandle) -> Option<String> {
    app.dialog()
        .file()
        .blocking_pick_folder()
        .map(|p| p.to_string())
}

#[derive(Serialize)]
pub struct BackupArchive {
    pub name: String,
    pub size: u64,
    pub modified_at: u64,
    pub path: String,
}

#[tauri::command(rename = "backup:history")]
pub fn get_backup_history(app: AppHandle) -> Result<Vec<BackupArchive>, String> {
    let store = ConfigStore::new(&app);
    let settings = store.read()?;
    let archives_dir = std::path::Path::new(&settings.backup_path).join(".archives");
    
    let mut history = Vec::new();
    if archives_dir.exists() {
        if let Ok(entries) = std::fs::read_dir(archives_dir) {
            for entry in entries.flatten() {
                if let Ok(meta) = entry.metadata() {
                    if meta.is_file() {
                        let name = entry.file_name().to_string_lossy().into_owned();
                        if name.ends_with(".tar.gz") {
                            let size = meta.len();
                            let modified_at = meta.modified()
                                .unwrap_or(std::time::SystemTime::UNIX_EPOCH)
                                .duration_since(std::time::UNIX_EPOCH)
                                .unwrap_or_default()
                                .as_millis() as u64;
                            let path = entry.path().to_string_lossy().into_owned();
                            
                            history.push(BackupArchive {
                                name,
                                size,
                                modified_at,
                                path,
                            });
                        }
                    }
                }
            }
        }
    }
    
    history.sort_by(|a, b| b.modified_at.cmp(&a.modified_at));
    Ok(history)
}

#[tauri::command(rename = "backup:open-folder")]
pub fn open_folder(path: String) -> Result<(), String> {
    opener::open(&path).map_err(|e| e.to_string())
}
