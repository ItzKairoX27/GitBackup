use flate2::write::GzEncoder;
use flate2::Compression;
use std::fs::{self, File};
use std::path::Path;

pub struct CompressService;

impl CompressService {
    pub fn new() -> Self {
        Self
    }

    pub fn compress_repo(&self, repo_path: &str, output_dir: &str) -> Result<String, String> {
        let out_dir = Path::new(output_dir);
        if !out_dir.exists() {
            fs::create_dir_all(out_dir)
                .map_err(|e| format!("Failed to create output dir: {}", e))?;
        }

        let r_path = Path::new(repo_path);
        let repo_name = r_path.file_name().unwrap_or_default().to_string_lossy();
        let parent_name = r_path
            .parent()
            .and_then(|p| p.file_name())
            .unwrap_or_default()
            .to_string_lossy();

        let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
        let archive_name = format!("{}__{}_{}.tar.gz", parent_name, repo_name, timestamp);
        let temp_path = out_dir.join(format!("{}.tmp", archive_name));
        let final_path = out_dir.join(&archive_name);

        let tar_gz = File::create(&temp_path)
            .map_err(|e| format!("Failed to create temp archive: {}", e))?;
        let enc = GzEncoder::new(tar_gz, Compression::default());
        let mut tar = tar::Builder::new(enc);

        tar.append_dir_all(&*repo_name, r_path)
            .map_err(|e| format!("Failed to append to tar: {}", e))?;
        tar.into_inner()
            .map_err(|e| format!("Failed to finish tar: {}", e))?
            .finish()
            .map_err(|e| format!("Failed to finish gzip: {}", e))?;

        fs::rename(&temp_path, &final_path)
            .map_err(|e| format!("Failed to rename archive: {}", e))?;

        Ok(final_path.to_string_lossy().into_owned())
    }

    pub fn get_archive_path(&self, output_dir: &str, owner: &str, repo_name: &str) -> String {
        Path::new(output_dir)
            .join(format!("{}__{}.tar.gz", owner, repo_name))
            .to_string_lossy()
            .into_owned()
    }

    pub fn archive_exists(&self, archive_path: &str) -> bool {
        Path::new(archive_path).exists()
    }
}
