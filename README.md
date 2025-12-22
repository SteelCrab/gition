# Gition

> Git + Notion = **Gition**  
> All-in-One Collaboration Platform for Developers.

Gition integrates Git repositories, block-based documentation, and CI/CD pipelines into a single, seamless workflow.

## 🪴 Key Features

| Category | Highlights | Status |
| :--- | :--- | :--- |
| **Repo** | Listing, Fast Cloning, Branch Switching, Commits | 🟢 |
| **Editor** | Notion-style Block Editor, Dark Theme, Search | 🟢 |
| **DevOps** | Actions CI/CD, Gitleaks Security, API Coverage | 🟡 |
| **Sync** | GitHub Issues & PR Integration | 🔵 |

## 🛠️ Quick Start

### 1. Configure Environment
Create a `.env` file:
```env
GITHUB_CLIENT_ID=your_id
GITHUB_CLIENT_SECRET=your_secret
MYSQL_ROOT_PASSWORD=your_pass
```

### 2. Launch Services
```bash
docker-compose up --build -d
```

### 3. Open
Go to [http://localhost](http://localhost)

## 🤖 GitHub Workflows
- **CI/CD Pipeline**: Automated testing, linting (flake8), and Docker image builds.
- **PR Semantic Lint**: Enforces conventional PR titles (e.g., `feat:`, `fix:`) for clean history.
- **Auto Labeler**: Automatically assigns `frontend` or `backend` labels based on file changes.
- **Dependabot**: Automated dependency updates with patch/minor auto-merge support.

## 🏗️ Project Structure
```text
gition/
├── frontend/  # React + Vite
├── backend/   # Python FastAPI
├── .github/   # CI/CD Pipelines
└── mysql/     # DB Initialization
```

## 🔋 Tech Stack
- **Frontend**: React, Tailwind CSS
- **Backend**: FastAPI, GitPython
- **Infra**: Docker, Nginx, MySQL

[MIT License](LICENSE)
