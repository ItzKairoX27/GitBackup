use std::fs;
use std::path::Path;
use tokio::process::Command;

pub struct GitService;

impl GitService {
    pub fn new() -> Self {
        Self
    }

    fn sanitize_url(&self, url: &str, token: &str) -> String {
        url.replace("https://", &format!("https://{}@", token))
    }

    pub fn repo_exists(&self, repo_path: &str) -> bool {
        let path = Path::new(repo_path);
        path.exists() && path.join(".git").exists()
    }

    async fn exec_git(&self, args: &[&str], cwd: Option<&str>) -> Result<String, String> {
        let mut cmd = Command::new("git");
        cmd.args(args);
        if let Some(dir) = cwd {
            cmd.current_dir(dir);
        }
        let output = cmd
            .output()
            .await
            .map_err(|e| format!("Failed to execute git: {}", e))?;
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Git error: {}", stderr));
        }
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    }

    pub async fn clone_repo<F>(
        &self,
        clone_url: &str,
        dest_path: &str,
        token: &str,
        on_progress: Option<F>,
    ) -> Result<(), String>
    where
        F: Fn(&str),
    {
        let parent = Path::new(dest_path).parent();
        if let Some(p) = parent {
            if !p.exists() {
                fs::create_dir_all(p).map_err(|e| e.to_string())?;
            }
        }

        let tmp_path = format!("{}.tmp", dest_path);
        if Path::new(&tmp_path).exists() {
            let _ = fs::remove_dir_all(&tmp_path);
        }

        let auth_url = self.sanitize_url(clone_url, token);

        if let Some(ref cb) = on_progress {
            cb("cloning");
        }

        if let Err(e) = self.exec_git(&["clone", &auth_url, &tmp_path, "--progress"], None).await {
            let _ = fs::remove_dir_all(&tmp_path);
            return Err(e);
        }

        let out = match self.exec_git(&["branch", "-r"], Some(&tmp_path)).await {
            Ok(o) => o,
            Err(e) => {
                let _ = fs::remove_dir_all(&tmp_path);
                return Err(e);
            }
        };
        
        let branches: Vec<&str> = out.lines().map(|l| l.trim()).collect();

        for branch in &branches {
            if branch.contains("HEAD") {
                continue;
            }
            if let Some(local_name) = branch.strip_prefix("origin/") {
                let _ = self
                    .exec_git(&["checkout", "-b", local_name, branch], Some(&tmp_path))
                    .await;
            }
        }

        if branches
            .iter()
            .any(|&b| b == "origin/main" || b == "origin/master")
        {
            let default = if branches.iter().any(|&b| b == "origin/main") {
                "main"
            } else {
                "master"
            };
            let _ = self.exec_git(&["checkout", default], Some(&tmp_path)).await;
        }

        let _ = self
            .exec_git(&["remote", "set-url", "origin", clone_url], Some(&tmp_path))
            .await;

        if let Err(e) = fs::rename(&tmp_path, dest_path) {
            let _ = fs::remove_dir_all(&tmp_path);
            return Err(format!("Failed to finalize clone: {}", e));
        }

        Ok(())
    }

    pub async fn update_repo<F>(
        &self,
        repo_path: &str,
        token: &str,
        clone_url: &str,
        on_progress: Option<F>,
    ) -> Result<(), String>
    where
        F: Fn(&str),
    {
        if let Some(ref cb) = on_progress {
            cb("updating");
        }

        let auth_url = self.sanitize_url(clone_url, token);
        self.exec_git(&["remote", "set-url", "origin", &auth_url], Some(repo_path))
            .await?;

        self.exec_git(
            &["fetch", "--all", "--prune", "--progress"],
            Some(repo_path),
        )
        .await?;

        let current_branch_out = self
            .exec_git(&["branch", "--show-current"], Some(repo_path))
            .await?;
        let current_branch = current_branch_out.trim();

        if !current_branch.is_empty() {
            let _ = self
                .exec_git(
                    &["pull", "origin", current_branch, "--ff-only"],
                    Some(repo_path),
                )
                .await;
        }

        let branches_out = self.exec_git(&["branch", "-r"], Some(repo_path)).await?;
        let local_out = self.exec_git(&["branch"], Some(repo_path)).await?;

        let local_branches: Vec<&str> = local_out
            .lines()
            .map(|l| l.trim_start_matches('*').trim())
            .collect();

        for branch in branches_out.lines().map(|l| l.trim()) {
            if branch.contains("HEAD") {
                continue;
            }
            if let Some(local_name) = branch.strip_prefix("origin/") {
                if !local_branches.contains(&local_name) {
                    let _ = self
                        .exec_git(&["checkout", "-b", local_name, branch], Some(repo_path))
                        .await;
                }
            }
        }

        if !current_branch.is_empty() {
            let _ = self
                .exec_git(&["checkout", current_branch], Some(repo_path))
                .await;
        }

        self.exec_git(&["remote", "set-url", "origin", clone_url], Some(repo_path))
            .await?;

        Ok(())
    }

    pub async fn clone_or_update<F>(
        &self,
        clone_url: &str,
        repo_path: &str,
        token: &str,
        on_progress: Option<F>,
    ) -> Result<&'static str, String>
    where
        F: Fn(&str),
    {
        if self.repo_exists(repo_path) {
            self.update_repo(repo_path, token, clone_url, on_progress)
                .await?;
            Ok("updated")
        } else {
            self.clone_repo(clone_url, repo_path, token, on_progress)
                .await?;
            Ok("cloned")
        }
    }
}
