# 📦 GitBackup

> A secure, cross-platform desktop application for scheduling and managing local backups of your GitHub repositories.

<div align="center">

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-orange)
![License](https://img.shields.io/badge/license-MIT-blue)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Usage](#-usage)
- [Configuration](#-configuration)
- [Project Structure](#-project-structure)
- [Development Guidelines](#-development-guidelines)
- [Contributing](#-contributing)
- [License](#-license)

## 🎯 Overview

**GitBackup** solves the problem of data ownership and disaster recovery for your GitHub repositories. Rather than relying solely on the cloud, GitBackup allows you to automatically pull, compress, and store your repositories on your local disk.

Your GitHub personal access token is encrypted securely via AES-256 and never leaves your machine.

## ✨ Features

- 🔒 **Secure Token Storage**: Your GitHub Personal Access Token is AES-256 encrypted and stored locally.
- ⏱️ **Automated Scheduling**: Set up background cron jobs to run backups at intervals (hourly, daily, weekly, monthly).
- 🧹 **Retention Policies**: Automatically prune old `.tar.gz` archives by defining how many backups to keep per repository (defaults to 10).
- 🛡️ **Atomic Operations**: Git operations are fully atomic. Clones happen in a temporary directory and are safely renamed upon success, preventing corrupted backups.
- ⚡ **Concurrent Processing**: Clone and compress multiple repositories simultaneously for maximum speed.
- 🗂️ **Advanced Filtering**: Choose exactly what to backup (owned, organizations, starred, forks, or collaborator repos).
- 🎨 **Modern Interface**: A sleek, responsive, dark-themed UI built with React and TailwindCSS.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS v4
- **Backend**: Rust, Tauri v2
- **Testing**: Vitest, JS-DOM, Cargo Tests
- **Scheduling**: `tokio-cron-scheduler`
- **Git & GitHub APIs**: `octocrab`, native `git` bindings

## 🚀 Installation

### Requirements

- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [Node.js](https://nodejs.org/) (v18+)
- [Bun](https://bun.sh/) (Primary package manager)
- [Git](https://git-scm.com/downloads) (must be available in your system's PATH)

### Steps

1. **Clone the repository:**

   ```bash
   git clone https://github.com/ItzKairoX27/gitbackup.git
   cd gitbackup
   ```

2. **Install frontend dependencies:**

   ```bash
   bun install
   ```

3. **Run the application in development mode:**

   ```bash
   bun run dev
   ```

4. **Build the production binary:**
   ```bash
   bun run build
   ```
   _(To build for a specific OS, you can use `bun run package:win`, `bun run package:mac`, or `bun run package:linux`)._

## 💡 Usage

1. Launch the application.
2. Enter your **GitHub Personal Access Token (Classic)** in the Setup view.
3. Select an output directory on your local disk where you want the backups stored.
4. Go to the **Backup** tab and select the repositories you want to backup from the interactive list.
5. Hit **Start Backup** or configure a **Schedule** in the Settings tab.

## ⚙️ Configuration

### GitHub Token

You will need a GitHub Personal Access Token (Classic).
Ensure the token has the `repo` scope so it can read and clone private repositories, and `read:org` to fetch organization repositories.

### Settings

Settings such as concurrency limits, schedule configurations, and retention limits are managed directly within the application's UI. They are securely encrypted (AES-256) and stored in your operating system's native `AppData/Config` directory.

## 📂 Project Structure

```text
gitbackup/
├── src/                          # React Frontend (UI, components, styles)
│   ├── components/               # Reusable React components (RepoList, RepoFilters, etc.)
│   ├── hooks/                    # Custom React hooks (useSettings, useBackupProgress)
│   ├── pages/                    # Full page views (Setup, Backup, Settings)
│   ├── styles/                   # Tailwind CSS configurations (globals.css)
│   └── types/                    # Frontend TypeScript interfaces
├── src-tauri/                    # Rust Backend (Tauri v2)
│   ├── capabilities/             # Tauri security boundaries and capability definitions
│   ├── src/
│   │   ├── services/             # Core business logic
│   │   │   ├── backup_orchestrator.rs  # Concurrency, state, & retention policies
│   │   │   ├── git_service.rs          # Atomic Git CLI operations
│   │   │   ├── github_service.rs       # Octocrab API integration (with retries)
│   │   │   └── scheduler_service.rs    # Background cron jobs execution
│   │   ├── commands.rs           # Tauri IPC command endpoints
│   │   ├── store.rs              # AES-256 encrypted settings store
│   │   ├── types.rs              # Backend data structures
│   │   └── lib.rs / main.rs      # Application entry points and plugin initialization
│   └── Cargo.toml                # Rust dependencies
├── eslint.config.js              # ESLint 9+ Configuration
├── vite.config.ts                # Vite & Vitest Configuration
└── package.json                  # Project manifest and task scripts
```

## 🧪 Development Guidelines

To maintain code quality, the repository uses ESLint and Prettier for the frontend, and standard Rust cargo checks for the backend.

Before pushing code, ensure all checks pass:

1. **Format Check:** `bun run format:check`
2. **Lint:** `bun run lint`
3. **Typecheck:** `bun run typecheck`
4. **Tests:** `bun run test` (Frontend Vitest) and `cd src-tauri && cargo test` (Backend)

_Note: You can auto-format your code locally using `bun run format`._

## 🤝 Contributing

Contributions are welcome! If you'd like to improve GitBackup, please feel free to fork the repository and open a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.
