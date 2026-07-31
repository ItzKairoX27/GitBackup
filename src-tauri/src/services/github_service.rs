use crate::types::{RepoFilterSet, RepoInfo};
use octocrab::{models::Repository, Octocrab};
use serde::Serialize;
use std::collections::HashMap;
use tokio::time::{sleep, Duration};

macro_rules! retry_octo {
    ($op:expr) => {{
        let mut retries = 3;
        let mut wait = Duration::from_secs(2);
        loop {
            let fut = $op;
            match fut.await {
                Ok(val) => break Ok(val),
                Err(e) => {
                    if retries > 0 {
                        let err_str = e.to_string();
                        if err_str.contains("rate limit")
                            || err_str.contains("429")
                            || err_str.contains("timeout")
                        {
                            sleep(wait).await;
                            retries -= 1;
                            wait *= 2;
                            continue;
                        }
                    }
                    break Err(e);
                }
            }
        }
    }};
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenValidationResult {
    pub valid: bool,
    pub user: Option<String>,
    pub name: Option<String>,
    pub avatar_url: Option<String>,
    pub profile_url: Option<String>,
    pub public_repos: Option<u64>,
    pub private_repos: Option<u64>,
    pub scopes: Option<Vec<String>>,
    pub error: Option<String>,
}

pub struct GitHubService {
    client: Octocrab,
}

impl GitHubService {
    pub fn new(token: &str) -> Result<Self, String> {
        let client = Octocrab::builder()
            .personal_token(token.to_string())
            .build()
            .map_err(|e| e.to_string())?;
        Ok(Self { client })
    }

    pub async fn validate_token(&self) -> TokenValidationResult {
        match self.client.current().user().await {
            Ok(user) => TokenValidationResult {
                valid: true,
                user: Some(user.login),
                name: Some(user.name.unwrap_or_default()),
                avatar_url: Some(user.avatar_url.to_string()),
                profile_url: Some(user.html_url.to_string()),
                public_repos: None,
                private_repos: None,
                scopes: Some(vec!["repo".to_string(), "read:org".to_string()]),
                error: None,
            },
            Err(e) => {
                let error_msg = match e {
                    octocrab::Error::GitHub { source, .. } => {
                        if source.message == "Bad credentials" {
                            "Invalid or expired GitHub token.".to_string()
                        } else {
                            source.message
                        }
                    }
                    _ => "Invalid or expired GitHub token.".to_string(),
                };
                
                TokenValidationResult {
                    valid: false,
                    user: None,
                    name: None,
                    avatar_url: None,
                    profile_url: None,
                    public_repos: None,
                    private_repos: None,
                    scopes: None,
                    error: Some(error_msg),
                }
            }
        }
    }

    pub async fn fetch_repos(&self, filters: &RepoFilterSet) -> Result<Vec<RepoInfo>, String> {
        let mut repo_map = HashMap::new();

        if filters.owned || filters.forked {
            let mut page = retry_octo!(self
                .client
                .current()
                .list_repos_for_authenticated_user()
                .type_("owner")
                .per_page(100)
                .send())
                .map_err(|e| e.to_string())?;

            loop {
                for repo in &page.items {
                    let is_fork = repo.fork.unwrap_or(false);
                    if filters.owned && !is_fork {
                        repo_map.insert(repo.id.0, self.map_repo(repo, "owned"));
                    }
                    if filters.forked && is_fork && !repo_map.contains_key(&repo.id.0) {
                        repo_map.insert(repo.id.0, self.map_repo(repo, "forked"));
                    }
                }
                page = match retry_octo!(self
                    .client
                    .get_page(&page.next))
                    .map_err(|e| e.to_string())?
                {
                    Some(p) => p,
                    None => break,
                };
            }
        }

        if filters.organization {
            let mut page = retry_octo!(self
                .client
                .current()
                .list_repos_for_authenticated_user()
                .type_("all")
                .per_page(100)
                .send())
                .map_err(|e| e.to_string())?;

            loop {
                for repo in &page.items {
                    if let Some(owner) = &repo.owner {
                        if owner.r#type == "Organization" && !repo_map.contains_key(&repo.id.0) {
                            repo_map.insert(repo.id.0, self.map_repo(repo, "org"));
                        }
                    }
                }
                page = match retry_octo!(self
                    .client
                    .get_page(&page.next))
                    .map_err(|e| e.to_string())?
                {
                    Some(p) => p,
                    None => break,
                };
            }
        }

        if filters.collaborator {
            let mut page = retry_octo!(self
                .client
                .current()
                .list_repos_for_authenticated_user()
                .type_("member")
                .per_page(100)
                .send())
                .map_err(|e| e.to_string())?;

            loop {
                for repo in &page.items {
                    if !repo_map.contains_key(&repo.id.0) {
                        repo_map.insert(repo.id.0, self.map_repo(repo, "collaborator"));
                    }
                }
                page = match retry_octo!(self
                    .client
                    .get_page(&page.next))
                    .map_err(|e| e.to_string())?
                {
                    Some(p) => p,
                    None => break,
                };
            }
        }

        if filters.starred {
            let mut page = retry_octo!(self
                .client
                .current()
                .list_repos_starred_by_authenticated_user()
                .per_page(100)
                .send())
                .map_err(|e| e.to_string())?;

            loop {
                for repo in &page.items {
                    if !repo_map.contains_key(&repo.id.0) {
                        repo_map.insert(repo.id.0, self.map_repo(repo, "starred"));
                    }
                }
                page = match retry_octo!(self
                    .client
                    .get_page(&page.next))
                    .map_err(|e| e.to_string())?
                {
                    Some(p) => p,
                    None => break,
                };
            }
        }

        let mut repos: Vec<RepoInfo> = repo_map.into_values().collect();
        repos.sort_by(|a, b| a.full_name.cmp(&b.full_name));
        Ok(repos)
    }

    fn map_repo(&self, repo: &Repository, source: &str) -> RepoInfo {
        RepoInfo {
            id: repo.id.0,
            name: repo.name.clone(),
            full_name: repo.full_name.clone().unwrap_or_default(),
            clone_url: repo
                .clone_url
                .clone()
                .map(|u| u.to_string())
                .unwrap_or_default(),
            is_private: repo.private.unwrap_or(false),
            is_fork: repo.fork.unwrap_or(false),
            owner: repo
                .owner
                .as_ref()
                .map(|o| o.login.clone())
                .unwrap_or_default(),
            description: repo.description.clone(),
            updated_at: repo.updated_at.map(|d| d.to_rfc3339()).unwrap_or_default(),
            size: repo.size.unwrap_or(0) as u64,
            source: source.to_string(),
        }
    }
}
