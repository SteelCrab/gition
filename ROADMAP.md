# Gition Roadmap

## v0.1 - Core Platform 🟡 (In Progress)

### 🔐 Authentication
- [x] GitHub OAuth integration
- [x] Login/Logout flow
- [x] Token persistence (localStorage)

### 📁 Repository Management
- [x] Repository listing from GitHub API
- [x] Repository cloning to server
- [x] Branch listing and switching
- [x] Git fetch for remote branch sync
- [x] Show hidden branch list (local + remote)
- [x] File browser with directory navigation
- [x] Auto-pull on branch checkout (uses tracking branch)

### ✏️ Editor
- [x] Notion-style block editor
- [ ] Code blocks with syntax highlighting
- [x] Text blocks with inline editing
- [x] `.gition` local page storage (branch-specific, git-ignored)
- [x] Markdown rendering (MarkdownRenderer component)

### 🔄 Git Operations
- [x] Commit history viewer (branch-aware)
- [x] File content viewer/editor
- [x] Search within repository (code search)
- [ ] Commit/Push from UI
- [ ] Automatic commit fetch for current repository
- [x] Fix: Commit history overflow hides repo/search panels
- [ ] Automatic commit for workspaces with pending changes

### 🔗 Integrations
- [x] GitHub Issues display
- [x] Pull Requests display
- [ ] Issue/PR creation from UI
- [ ] GitHub Actions status display (#2)
- [ ] Bi-directional sync (GitHub ↔ Gition) (#9)

### 🧱 Blocks
- [ ] Issue block - Display GitHub issues inline
- [ ] PR block - Display Pull Requests inline
- [ ] Commit block - Display GitHub commits inline
- [ ] Commit link block - Display Git commits inline
- [ ] Heading block - H1/H2/H3 inline
- [ ] List block - Bulleted/Numbered list inline
- [ ] Quote block - Blockquote inline
- [ ] Callout block - Highlighted callout inline
- [ ] Divider block - Horizontal divider inline
- [ ] Toggle block - Collapsible toggle inline
- [ ] Table block - Table inline

### 📄 Pages
- [ ] Landing/Promotion page
- [x] Branch page auto-creation on checkout
- [x] Branch page navigation (tabbed UI: Notes / README)

### 🗄️ Database
- [x] MySQL + Branch Pages DB architecture
- [x] **MySQL Schema**: User/Repository/Pages tables defined
  - Users (id, login, email, avatar_url, access_token)
  - Repositories (id, name, owner, clone_url, default_branch)
  - Sessions (user_id, token_hash, expires_at)
  - Documents (user_id, repo_id, title, content)
  - Pipelines (user_id, repo_id, name, config, status)
  - BranchPages (user_id, repo_id, branch_name, title, content)
- [x] **MySQL Operations**: Async database layer
  - database.py: Connection pool management
  - user_ops.py: User CRUD operations
  - repo_ops.py: Repository sync + auto-registration
  - page_ops.py: Branch page CRUD with login-based API
- [ ] **PipeSQL**: Page/Block data management (future)
  - Pages (id, repo_id, branch, title, created_at)
  - Blocks (id, page_id, type, content, order)
  - BlockLinks (block_id, target_type, target_id)

### 📊 Graph
- [ ] Graph visualization

### ☸️ Kubernetes (Basic)
- [ ] Docker Compose dev environment
- [ ] Basic Kubernetes manifests (Deployment, Service)
- [ ] Single namespace deployment

---

## v0.2 - Visualization 🔵

### 📊 Graph View
- [ ] Commit graph visualization (tree structure)
- [ ] Branch merge visualization
- [ ] Interactive node selection
- [ ] Diff viewer from graph

### 🎨 UI/UX Enhancements
- [ ] Dark mode toggle
- [ ] Responsive mobile layout improvements
- [ ] Keyboard shortcuts

### 💻 Web Terminal
- [ ] Branch-specific terminal access (checkout & execute)
- [ ] Script blocks → Click to run in terminal
- [ ] Real-time output streaming (xterm.js + WebSocket)
- [ ] Recording feature (GIF for ≤5s, MP4 for >5s)

### 🧱 Blocks
- [ ] Pipeline blocks execution

### ⚡ Real-time Features
- [ ] Real-time document editing
- [ ] Presence indicators (who's viewing)
- [ ] Comments on code blocks

### 🚀 CI/CD
- [ ] Custom pipeline configuration
- [ ] Pipeline execution logs
- [ ] Deployment status tracking

### ☸️ Kubernetes (Advanced)

#### 🏗️ Infrastructure
- [ ] Helm chart structure (`k8s/charts/gition/`)
- [ ] Namespace configuration (dev/staging/prod)
- [ ] Ingress with TLS (cert-manager)

#### ⚙️ Workloads
- [ ] Frontend Deployment (replicas: 2+)
- [ ] API Deployment (replicas: 3+)
- [ ] MySQL StatefulSet (Primary-Replica)

#### 💾 Storage
- [ ] Multi-PVC sharding strategy
- [ ] Hash-based workspace routing
- [ ] PVC per shard (`repos-pvc-1`, `repos-pvc-2`, ...)

#### 📈 Scaling
- [ ] Frontend HPA (CPU 70%)
- [ ] API HPA (CPU 70%, Memory 80%)

#### 🔄 GitOps
- [ ] ArgoCD application configuration
- [ ] GitHub Actions → Registry → ArgoCD pipeline

### 📚 Gition Docs (.gition/)
- [ ] `.gition/` folder structure
- [ ] Docs API (`/api/docs/{repo}/*`)
- [ ] Block → Markdown conversion
- [ ] .gitignore integration

### 🕸️ Graph View (Advanced)
- [ ] `[[link]]` syntax parser
- [ ] `doc_links` table schema
- [ ] Link API (`/api/links/*`)
- [ ] D3.js graph visualization
- [ ] Backlinks support

---

## Legend
- ✅ Completed milestone
- 🟡 In progress
- 🔵 Planned milestone
- [x] Completed task
- [ ] Pending task
