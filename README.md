# Gition

> Git + Notion = **Gition**  
> All-in-One Collaboration Platform for Developers

An open-source development platform that integrates Git repositories, block-based documentation, and CI/CD pipelines.

## Why Gition?

Problems with existing tools:
- **GitLab/GitHub**: Documentation is limited to Markdown
- **Notion**: Separated from code repositories, causing context switching
- **Confluence**: Disconnected from development workflow

Gition connects everything in one place.

### Comparison

| Feature | GitHub/GitLab | Notion | Confluence | **Gition** |
|---------|:-------------:|:------:|:----------:|:----------:|
| Git Repository | ✅ | ❌ | ❌ | ✅ |
| Block Editor | ❌ | ✅ | ✅ | ✅ |
| Built-in CI/CD | ✅ | ❌ | ❌ | ✅ |
| Git-based Doc Versioning | ❌ | ❌ | ❌ | ✅ |
| Code↔Doc Bidirectional Links | ❌ | ❌ | 🔺 | ✅ |
| Real-time Collaboration | ❌ | ✅ | ✅ | ❌ (Git versioning) |
| Pipeline Results Embed | ❌ | ❌ | ❌ | ✅ |
| Self-hosted | ✅ | ❌ | ✅ | ✅ |
| Open Source | 🔺 | ❌ | ❌ | ✅ |
| Context Switching | When writing docs | When checking code | Always | **None** |

## Features

### ✅ Implemented Features

#### 🔐 GitHub OAuth Authentication
- Secure login with GitHub OAuth 2.0
- Access token management for API calls
- User session persistence

#### 📂 Repository Management
- Fetch all repositories (public & private)
- Clone repositories to local storage
- Repository filtering (All/Public/Private)
- Clone status tracking across page refreshes

#### 📁 File Browser
- Browse files and directories in cloned repos
- File tree navigation with back button
- Display file sizes
- File type icons

#### 📝 Code Editor
- Dark-themed text editor (VS Code style)
- View and edit file contents
- Binary file detection

#### 🌿 Branch Management
- View all branches (local & remote)
- Switch between branches
- Current branch indicator
- Branch dropdown selector in header

#### 📜 Commit History
- View recent commits
- Commit SHA, author, date
- Insertion/deletion statistics
- File change count per commit

#### 📖 README Display
- Auto-load README.md when opening repo
- Repository header with name and description
- Fallback for repos without README

#### 🔍 File Search
- Search filenames within repository
- Search file contents
- Highlighted search results
- Navigate to file from search results

#### 🐛 Issues & Pull Requests
- View open GitHub Issues
- View open Pull Requests
- Issue labels with colors
- PR branch information (head → base)
- Link to GitHub for details

### 🔜 Upcoming Features

- [ ] Markdown rendering for README
- [ ] Create/edit Issues from Gition
- [ ] Create Pull Requests
- [ ] CI/CD Pipeline visualization
- [ ] Real-time collaboration

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React + Vite |
| UI Framework | Tailwind CSS (custom) |
| Icons | Lucide React |
| Backend | Python FastAPI |
| Git Operations | GitPython |
| Database | MySQL |
| Auth | GitHub OAuth 2.0 |
| Container | Docker + Docker Compose |
| Web Server | Nginx (reverse proxy) |

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/github` | Get GitHub OAuth URL |
| GET | `/api/auth/github/callback` | OAuth callback handler |

### Repositories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/repos` | List user's repositories |

### Git Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/git/clone` | Clone a repository |
| POST | `/api/git/pull` | Pull latest changes |
| GET | `/api/git/files` | List files in repo |
| GET | `/api/git/file` | Get file content |
| GET | `/api/git/status` | Check clone status |
| DELETE | `/api/git/repo` | Delete cloned repo |
| GET | `/api/git/search` | Search files/content |
| GET | `/api/git/commits` | Get commit history |
| GET | `/api/git/branches` | List all branches |
| POST | `/api/git/checkout` | Switch branch |

### GitHub API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/github/issues` | Get repository issues |
| GET | `/api/github/pulls` | Get pull requests |

## Project Structure

```
gition/
├── src/                    # Frontend (React)
│   ├── components/
│   │   ├── AuthCallback.jsx
│   │   ├── BranchSelector.jsx
│   │   ├── CommitHistory.jsx
│   │   ├── FileBrowser.jsx
│   │   ├── FileEditor.jsx
│   │   ├── IssuesPRs.jsx
│   │   ├── LoginPage.jsx
│   │   ├── RepoList.jsx
│   │   ├── SearchPanel.jsx
│   │   └── ...
│   ├── lib/
│   │   └── git.js          # Git utilities
│   ├── App.jsx
│   └── main.jsx
├── backend/                # Python FastAPI
│   ├── main.py             # API routes
│   ├── git_ops.py          # Git operations
│   ├── requirements.txt
│   └── Dockerfile
├── mysql/
│   └── init.sql
├── docker-compose.yml
├── nginx.conf
├── Dockerfile
└── README.md
```

## Getting Started

### Prerequisites
- Docker & Docker Compose
- GitHub OAuth App (for authentication)

### Environment Variables

Create a `.env` file:
```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
MYSQL_ROOT_PASSWORD=your_mysql_password
```

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/gition.git
cd gition

# Start with Docker Compose
docker-compose up --build -d

# Access the application
open http://localhost
```

### GitHub OAuth Setup

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create a new OAuth App:
   - **Application name**: Gition
   - **Homepage URL**: `http://localhost`
   - **Authorization callback URL**: `http://localhost/api/auth/github/callback`
3. Copy Client ID and Client Secret to `.env`

## Screenshots

| Repository List | File Browser | Code Editor |
|-----------------|--------------|-------------|
| Clone & manage repos | Navigate file tree | Edit with dark theme |

| Branch Selector | Commit History | Issues & PRs |
|-----------------|----------------|--------------|
| Switch branches | View commits | Track issues |

## Contributing

Contributions are welcome!

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the [MIT License](LICENSE).