use aes::cipher::{block_padding::Pkcs7, BlockDecryptMut, BlockEncryptMut, KeyIvInit};
use aes::Aes256;
use cbc::{Decryptor, Encryptor};
use hmac::Hmac;
use pbkdf2::pbkdf2;
use rand::RngCore;
use sha2::Sha512;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

use crate::types::AppSettings;

type Aes256CbcEnc = Encryptor<Aes256>;
type Aes256CbcDec = Decryptor<Aes256>;

pub struct ConfigStore {
    path: PathBuf,
    key: String,
}

impl ConfigStore {
    pub fn new(app: &AppHandle) -> Self {
        let app_dir = app
            .path()
            .app_config_dir()
            .expect("Failed to get app config dir");
        let path = app_dir.join("gitbackup-config.json");
        Self {
            path,
            key: "gitbackup-v1-enc".to_string(),
        }
    }

    pub fn read(&self) -> Result<AppSettings, String> {
        if !self.path.exists() {
            return Ok(self.default_settings());
        }

        let data =
            fs::read(&self.path).map_err(|e| format!("Failed to read config file: {}", e))?;
        if data.len() < 17 || data[16] != b':' {
            let content = String::from_utf8_lossy(&data).into_owned();
            return serde_json::from_str(&content).map_err(|e| format!("Invalid JSON: {}", e));
        }

        let iv = &data[0..16];
        let encrypted = &data[17..];

        let iv_str = String::from_utf8_lossy(iv);
        let mut password = [0u8; 32];
        let _ =
            pbkdf2::<Hmac<Sha512>>(self.key.as_bytes(), iv_str.as_bytes(), 10000, &mut password);

        let decryptor = Aes256CbcDec::new(&password.into(), iv.into());
        let mut buf = encrypted.to_vec();
        let decrypted = decryptor
            .decrypt_padded_mut::<Pkcs7>(&mut buf)
            .map_err(|e| format!("Decryption failed: {}", e))?;

        let content = String::from_utf8(decrypted.to_vec())
            .map_err(|e| format!("Invalid UTF8 in decrypted file: {}", e))?;

        serde_json::from_str(&content).map_err(|e| format!("Invalid JSON after decryption: {}", e))
    }

    pub fn write(&self, settings: &AppSettings) -> Result<(), String> {
        let content = serde_json::to_string_pretty(settings)
            .map_err(|e| format!("Failed to serialize settings: {}", e))?;

        let mut iv = [0u8; 16];
        rand::rng().fill_bytes(&mut iv);

        let iv_str = String::from_utf8_lossy(&iv);
        let mut password = [0u8; 32];
        let _ =
            pbkdf2::<Hmac<Sha512>>(self.key.as_bytes(), iv_str.as_bytes(), 10000, &mut password);

        let encryptor = Aes256CbcEnc::new(&password.into(), &iv.into());

        let mut buf = vec![0u8; content.len() + 16];
        buf[..content.len()].copy_from_slice(content.as_bytes());
        let encrypted = encryptor
            .encrypt_padded_mut::<Pkcs7>(&mut buf, content.len())
            .map_err(|e| format!("Encryption failed: {}", e))?;

        let mut out = Vec::new();
        out.extend_from_slice(&iv);
        out.push(b':');
        out.extend_from_slice(encrypted);

        if let Some(parent) = self.path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create config dir: {}", e))?;
        }

        fs::write(&self.path, out).map_err(|e| format!("Failed to write config file: {}", e))?;
        Ok(())
    }

    fn default_settings(&self) -> AppSettings {
        serde_json::from_str(
            r#"{
            "githubToken": "",
            "backupPath": "",

            "repoFilters": {
                "owned": true,
                "organization": false,
                "starred": false,
                "forked": false,
                "collaborator": false
            },
            "selectedRepoIds": [],
            "schedule": {
                "enabled": false,
                "frequency": "daily",
                "time": "02:00"
            },
            "concurrencyLimit": 5,
            "retentionLimit": 10
        }"#,
        )
        .unwrap()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env::temp_dir;
    use std::fs;

    impl ConfigStore {
        pub fn new_for_test(path: PathBuf) -> Self {
            Self {
                path,
                key: "test-key".to_string(),
            }
        }
    }

    #[test]
    fn test_encrypt_decrypt() {
        let test_path = temp_dir().join("test_config.json");
        let store = ConfigStore::new_for_test(test_path.clone());
        
        let mut settings = store.default_settings();
        settings.github_token = "test_token_123".to_string();
        
        // Write (encrypt)
        store.write(&settings).unwrap();
        
        // Read (decrypt)
        let read_settings = store.read().unwrap();
        assert_eq!(read_settings.github_token, "test_token_123");
        
        // Cleanup
        let _ = fs::remove_file(test_path);
    }
}
