use crate::services::compress_service::CompressService;
use crate::services::git_service::GitService;
use crate::types::{
    AppSettings, BackupSummary, BackupSummaryError, LogEntry, RepoBackupStatus, RepoInfo,
};
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter};
use tauri_plugin_notification::NotificationExt;
use tokio::sync::{Semaphore, RwLock};

pub struct BackupOrchestrator {
    cancelled: Arc<AtomicBool>,
    pub state: Arc<RwLock<crate::types::BackupState>>,
}

impl BackupOrchestrator {
    pub fn new() -> Self {
        Self {
            cancelled: Arc::new(AtomicBool::new(false)),
            state: Arc::new(RwLock::new(Default::default())),
        }
    }

    pub fn cancel(&self) {
        self.cancelled.store(true, Ordering::SeqCst);
    }

    async fn log(app: &AppHandle, state: &Arc<RwLock<crate::types::BackupState>>, level: &str, message: &str, repo_name: Option<String>) {
        let sanitized = message.replace("https://", "https://***@");
        let entry = LogEntry {
            timestamp: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64,
            level: level.to_string(),
            message: sanitized,
            repo_name,
        };
        {
            let mut s = state.write().await;
            s.logs.push(entry.clone());
        }
        let _ = app.emit("backup:log", entry);
    }

    async fn emit_progress(app: &AppHandle, state: &Arc<RwLock<crate::types::BackupState>>, status: &RepoBackupStatus) {
        {
            let mut s = state.write().await;
            s.statuses.insert(status.repo_id, status.clone());
        }
        let _ = app.emit("backup:progress", status);
    }

    pub async fn run(
        &self,
        app: AppHandle,
        repos: Vec<RepoInfo>,
        settings: AppSettings,
    ) -> Result<BackupSummary, String> {
        let start_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64;
        self.cancelled.store(false, Ordering::SeqCst);
        
        {
            let mut s = self.state.write().await;
            s.running = true;
            s.statuses.clear();
            s.logs.clear();
            s.summary = None;
        }

        let archives_dir = Path::new(&settings.backup_path).join(".archives");
        let archives_dir_str = archives_dir.to_string_lossy().into_owned();

        Self::log(
            &app,
            &self.state,
            "info",
            &format!(
                "Starting backup of {} repositories (concurrency: {})",
                repos.len(),
                settings.concurrency_limit
            ),
            None,
        ).await;

        let semaphore = Arc::new(Semaphore::new(settings.concurrency_limit as usize));
        let mut handles = Vec::new();

        let git_service = Arc::new(GitService::new());
        let compress_service = Arc::new(CompressService::new());

        for repo in repos.clone() {
            let permit = semaphore.clone().acquire_owned().await.unwrap();
            let app_clone = app.clone();
            let cancelled = self.cancelled.clone();
            let settings_clone = settings.clone();
            let archives_dir_str = archives_dir_str.clone();

            let git_service = git_service.clone();
            let compress_service = compress_service.clone();
            let state_clone = self.state.clone();

            let handle = tokio::spawn(async move {
                let _permit = permit;

                if cancelled.load(Ordering::SeqCst) {
                    let status = RepoBackupStatus {
                        repo_id: repo.id,
                        repo_name: repo.full_name.clone(),
                        stage: "skipped".to_string(),
                        progress: 0.0,
                        error: None,
                        started_at: None,
                        completed_at: None,
                    };
                    BackupOrchestrator::emit_progress(&app_clone, &state_clone, &status).await;
                    return (repo, false, Some("Cancelled".to_string()));
                }

                let mut status = RepoBackupStatus {
                    repo_id: repo.id,
                    repo_name: repo.full_name.clone(),
                    stage: "pending".to_string(),
                    progress: 0.0,
                    error: None,
                    started_at: Some(
                        SystemTime::now()
                            .duration_since(UNIX_EPOCH)
                            .unwrap()
                            .as_millis() as u64,
                    ),
                    completed_at: None,
                };

                let repo_dir = Path::new(&settings_clone.backup_path)
                    .join(&repo.owner)
                    .join(&repo.name)
                    .to_string_lossy()
                    .into_owned();

                let action = if git_service.repo_exists(&repo_dir) {
                    "updating"
                } else {
                    "cloning"
                };
                status.stage = action.to_string();
                status.progress = 10.0;
                BackupOrchestrator::emit_progress(&app_clone, &state_clone, &status).await;
                BackupOrchestrator::log(
                    &app_clone,
                    &state_clone,
                    "info",
                    &format!(
                        "{} {}",
                        if action == "cloning" {
                            "Cloning"
                        } else {
                            "Updating"
                        },
                        repo.full_name
                    ),
                    Some(repo.full_name.clone()),
                ).await;

                let result = git_service
                    .clone_or_update(
                        &repo.clone_url,
                        &repo_dir,
                        &settings_clone.github_token,
                        None::<fn(&str)>,
                    )
                    .await;
                if let Err(e) = result {
                    status.stage = "failed".to_string();
                    status.error = Some(e.clone());
                    status.completed_at = Some(
                        SystemTime::now()
                            .duration_since(UNIX_EPOCH)
                            .unwrap()
                            .as_millis() as u64,
                    );
                    BackupOrchestrator::emit_progress(&app_clone, &state_clone, &status).await;
                    BackupOrchestrator::log(
                        &app_clone,
                        &state_clone,
                        "error",
                        &format!("Failed {}: {}", repo.full_name, e),
                        Some(repo.full_name.clone()),
                    ).await;
                    return (repo, false, Some(e));
                }

                if cancelled.load(Ordering::SeqCst) {
                    return (repo, false, Some("Cancelled".to_string()));
                }

                status.progress = 40.0;
                BackupOrchestrator::emit_progress(&app_clone, &state_clone, &status).await;

                status.stage = "compressing".to_string();
                status.progress = 50.0;
                BackupOrchestrator::emit_progress(&app_clone, &state_clone, &status).await;
                BackupOrchestrator::log(
                    &app_clone,
                    &state_clone,
                    "info",
                    &format!("Compressing {}", repo.full_name),
                    Some(repo.full_name.clone()),
                ).await;

                let archive_res = compress_service.compress_repo(&repo_dir, &archives_dir_str);
                if let Err(e) = archive_res {
                    status.stage = "failed".to_string();
                    status.error = Some(e.clone());
                    status.completed_at = Some(
                        SystemTime::now()
                            .duration_since(UNIX_EPOCH)
                            .unwrap()
                            .as_millis() as u64,
                    );
                    BackupOrchestrator::emit_progress(&app_clone, &state_clone, &status).await;
                    BackupOrchestrator::log(
                        &app_clone,
                        &state_clone,
                        "error",
                        &format!("Failed to compress {}: {}", repo.full_name, e),
                        Some(repo.full_name.clone()),
                    ).await;
                    return (repo, false, Some(e));
                }
                let _archive_path = archive_res.unwrap();

                if settings_clone.retention_limit > 0 {
                    let repo_prefix = format!("{}__{}_", repo.owner, repo.name);
                    BackupOrchestrator::apply_retention_policy(&archives_dir_str, &repo_prefix, settings_clone.retention_limit as usize);
                }

                status.stage = "done".to_string();
                status.progress = 100.0;
                status.completed_at = Some(
                    SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap()
                        .as_millis() as u64,
                );
                BackupOrchestrator::emit_progress(&app_clone, &state_clone, &status).await;
                BackupOrchestrator::log(
                    &app_clone,
                    &state_clone,
                    "info",
                    &format!("Completed {}", repo.full_name),
                    Some(repo.full_name.clone()),
                ).await;

                (repo, true, None)
            });
            handles.push(handle);
        }

        let mut results = Vec::new();
        for handle in handles {
            let res = handle.await.unwrap();
            results.push(res);
        }

        let mut succeeded = 0;
        let mut failed = 0;
        let mut skipped = 0;
        let mut errors = Vec::new();

        for (repo, success, err) in results {
            if success {
                succeeded += 1;
            } else if let Some(e) = err {
                if e == "Cancelled" {
                    skipped += 1;
                } else {
                    failed += 1;
                    errors.push(BackupSummaryError {
                        repo_name: repo.full_name,
                        error: e,
                    });
                }
            }
        }

        let duration = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64
            - start_time;

        let summary = BackupSummary {
            total_repos: repos.len(),
            succeeded,
            failed,
            skipped,
            duration,
            errors,
        };

        Self::log(
            &app,
            &self.state,
            "info",
            &format!(
                "Backup complete: {} succeeded, {} failed, {} skipped ({:.1}s)",
                summary.succeeded,
                summary.failed,
                summary.skipped,
                (summary.duration as f64) / 1000.0
            ),
            None,
        ).await;
        
        {
            let mut s = self.state.write().await;
            s.running = false;
            s.summary = Some(summary.clone());
        }

        let _ = app.emit("backup:complete", &summary);

        let msg = format!(
            "Backup complete: {} succeeded, {} failed, {} skipped",
            summary.succeeded, summary.failed, summary.skipped
        );
        let _ = app
            .notification()
            .builder()
            .title("Backup Complete")
            .body(msg)
            .show();

        Ok(summary)
    }

    pub fn apply_retention_policy(archives_dir_str: &str, prefix: &str, limit: usize) {
        let exact_old_name = format!("{}__old_placeholder.tar.gz", prefix); // rough match for old logic if needed
        let mut existing_archives = Vec::new();
        if let Ok(entries) = std::fs::read_dir(archives_dir_str) {
            for entry in entries.flatten() {
                if let Ok(meta) = entry.metadata() {
                    if meta.is_file() {
                        let fname = entry.file_name().to_string_lossy().into_owned();
                        if (fname == exact_old_name || fname.starts_with(prefix)) && fname.ends_with(".tar.gz") {
                            existing_archives.push((
                                entry.path(),
                                meta.modified().unwrap_or(std::time::SystemTime::UNIX_EPOCH)
                            ));
                        }
                    }
                }
            }
        }
        existing_archives.sort_by(|a, b| b.1.cmp(&a.1));
        if existing_archives.len() > limit {
            for (path, _) in existing_archives.into_iter().skip(limit) {
                let _ = std::fs::remove_file(path);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env::temp_dir;
    use std::fs::{self, File};

    #[test]
    fn test_retention_policy() {
        let dir = temp_dir().join("gitbackup_test_archives");
        let _ = fs::create_dir_all(&dir);

        let prefix = "test_owner__test_repo_";
        for i in 0..5 {
            let path = dir.join(format!("{}{}.tar.gz", prefix, i));
            File::create(&path).unwrap();
            std::thread::sleep(std::time::Duration::from_millis(10)); // Ensure different modified times
        }

        BackupOrchestrator::apply_retention_policy(dir.to_str().unwrap(), prefix, 3);

        let mut remaining = 0;
        if let Ok(entries) = fs::read_dir(&dir) {
            for _ in entries {
                remaining += 1;
            }
        }
        
        assert_eq!(remaining, 3);
        let _ = fs::remove_dir_all(&dir);
    }
}
