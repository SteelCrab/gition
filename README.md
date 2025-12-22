# Gition

> Git + Notion = **Gition**  
> All-in-One Collaboration Platform for Developers

An open-source development platform that integrates Git repositories, block-based documentation, and CI/CD pipelines.



## Why Gition?

| Feature | GitHub/GitLab | Notion | Confluence | **Gition** |
|---------|:-------------:|:------:|:----------:|:----------:|
| Git Repository | ✅ | ❌ | ❌ | ✅ |
| Block Editor | ❌ | ✅ | ✅ | ✅ |
| Built-in CI/CD | ✅ | ❌ | ❌ | ✅ |
| Git-based Doc Versioning | ❌ | ❌ | ❌ | ✅ |
| Code↔Doc Links | ❌ | ❌ | 🔺 | ✅ |
| Self-hosted | ✅ | ❌ | ✅ | ✅ |
| Open Source | 🔺 | ❌ | ❌ | ✅ |
| Context Switching | When writing docs | When checking code | Always | **None** |

## Project Milestones

### 🟢 Milestone 1: Core Identity & Authentication
*Complete*
- **GitHub OAuth 2.0 Integration**: Secure user authentication and session management.
- **Repository Management**: Dynamic listing, filtering, and local cloning of public/private repositories.
- **Clone Status Tracking**: Real-time persistence of repository sync status.

### 🟢 Milestone 2: Advanced File Navigation
*Complete*
- **Recursive File Tree**: High-performance navigation through complex directory structures.
- **Notion-style Editor**: Dark-themed, VS Code-inspired code editing environment.
- **Binary Detection**: Automated identification of non-text assets.

### 🟡 Milestone 3: Repository Insights
*Active*
- **Interactive Commit History**: Detailed SHA, author, and insertion/deletion statistics.
- **Branch Strategy**: Seamless visualization and switching between local/remote branches.
- **Intelligent Search**: Global filename and content search with highlighted results.
- **GitHub Sync**: Integrated view for repository Issues and Pull Requests.

### 🔵 Milestone 4: DevOps & Assurance
*In Progress*
- **CI/CD Automation**: Automated build and test pipelines via GitHub Actions.
- **Security Scanning**: Native Gitleaks integration for secret and password detection.
- **Dockerization**: Containerized multi-service architecture with Nginx reverse proxy.
- **Quality Gates**: Automated backend API testing with 70%+ coverage enforcement.

### 🔜 Future Roadmap
- **Markdown Rendering**: Rich preview for README and project documentation.
- **Bi-directional Integration**: Create and edit GitHub Issues directly from Gition.
- **Pipeline Monitoring**: Real-time visualization of GitHub Actions workflow status.
- **Performance Engine**: Transformation of backend to Rust (Axum) with `gitoxide` integration.


## Tech Stack

### MVP (Current)

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Python FastAPI + GitPython |
| Database | MySQL |
| Auth | GitHub OAuth 2.0 |
| Infra | Docker Compose + Nginx |

### Production (Future)

| Layer | Technology |
|-------|------------|
| Backend | Rust (Axum) + Python (FastAPI) |
| Git Engine | gitoxide / libgit2 |
| Infra | Kubernetes + Helm + ArgoCD |

## Quick Start

### Prerequisites

- Docker & Docker Compose
- GitHub OAuth App

### 1. GitHub OAuth Setup

1. GitHub Settings → Developer settings → OAuth Apps → New
2. Configure:
   - **Homepage URL**: `http://localhost`
   - **Callback URL**: `http://localhost/api/auth/github/callback`
3. Copy Client ID & Secret

### 2. Environment

```bash
# .env
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
MYSQL_ROOT_PASSWORD=your_password
```

### 3. Run

```bash
git clone https://github.com/your-username/gition.git
cd gition
docker-compose up --build -d
open http://localhost
```

## API Reference

### Auth
```
GET  /api/auth/github          # OAuth URL
GET  /api/auth/github/callback # OAuth callback
```

### Repositories
```
GET  /api/repos                # List repositories
```

### Git Operations
```
POST   /api/git/clone          # Clone repo
POST   /api/git/pull           # Pull changes
GET    /api/git/files          # List files
GET    /api/git/file           # Get file content
GET    /api/git/status         # Clone status
DELETE /api/git/repo           # Delete repo
GET    /api/git/search         # Search files
GET    /api/git/commits        # Commit history
GET    /api/git/branches       # List branches
POST   /api/git/checkout       # Switch branch
```

### GitHub API
```
GET  /api/github/issues        # Get issues
GET  /api/github/pulls         # Get PRs
```

## Project Structure

```
gition/
├── frontend/           # React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── lib/
│   └── package.json
├── backend/            # Python FastAPI
│   ├── api/
│   ├── services/
│   ├── models/
│   └── main.py
├── docker-compose.yml
├── nginx.conf
└── README.md
```

## Contributing

1. Fork this repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[MIT License](LICENSE)