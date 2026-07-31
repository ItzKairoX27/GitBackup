use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RepoFilterSet {
    pub owned: bool,
    pub organization: bool,
    pub starred: bool,
    pub forked: bool,
    pub collaborator: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScheduleConfig {
    pub enabled: bool,
    pub frequency: String, // 'interval' | 'daily' | 'weekly' | 'monthly'
    pub time: String,
    pub day_of_week: Option<u32>,
    pub day_of_month: Option<u32>,
    pub interval_hours: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub github_token: String,
    pub backup_path: String,
    pub repo_filters: RepoFilterSet,
    pub selected_repo_ids: Vec<u64>,
    pub schedule: ScheduleConfig,
    pub concurrency_limit: u32,
    #[serde(default = "default_retention_limit")]
    pub retention_limit: u32,
}

fn default_retention_limit() -> u32 {
    10
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RepoInfo {
    pub id: u64,
    pub name: String,
    pub full_name: String,
    pub clone_url: String,
    pub is_private: bool,
    pub is_fork: bool,
    pub owner: String,
    pub description: Option<String>,
    pub updated_at: String,
    pub size: u64,
    pub source: String, // 'owned' | 'org' | 'starred' | 'forked' | 'collaborator'
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RepoBackupStatus {
    pub repo_id: u64,
    pub repo_name: String,
    pub stage: String,
    pub progress: f64,
    pub error: Option<String>,
    pub started_at: Option<u64>,
    pub completed_at: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BackupProgress {
    pub total_repos: usize,
    pub completed: usize,
    pub failed: usize,
    pub skipped: usize,
    pub current_batch: Vec<RepoBackupStatus>,
    pub overall_percent: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LogEntry {
    pub timestamp: u64,
    pub level: String, // 'info' | 'warn' | 'error'
    pub message: String,
    pub repo_name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BackupSummaryError {
    pub repo_name: String,
    pub error: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BackupSummary {
    pub total_repos: usize,
    pub succeeded: usize,
    pub failed: usize,
    pub skipped: usize,
    pub duration: u64,
    pub errors: Vec<BackupSummaryError>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct BackupState {
    pub running: bool,
    pub statuses: std::collections::HashMap<u64, RepoBackupStatus>,
    pub logs: Vec<LogEntry>,
    pub summary: Option<BackupSummary>,
}
