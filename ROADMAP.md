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
- [x] Show hidden branch list
- [x] File browser with directory navigation

### ✏️ Editor
- [x] Notion-style block editor
- [ ] Code blocks with syntax highlighting
- [x] Text blocks with inline editing
- [ ] Pipeline blocks execution
- [x] `.gition` local page storage (branch-specific, git-ignored)
- [ ] Markdown rendering (#8)

### 🔄 Git Operations
- [x] Commit history viewer
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

### 📄 Pages
- [ ] Landing/Promotion page
- [ ] Branch page navigation (click branch → new page)



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
---

## v0.3 - Collaboration 🔵

### ⚡ Real-time Features
- [ ] Real-time document editing
- [ ] Presence indicators (who's viewing)
- [ ] Comments on code blocks

### 🚀 CI/CD
- [ ] Custom pipeline configuration
- [ ] Pipeline execution logs
- [ ] Deployment status tracking

---

## v1.0 - Kubernetes Deployment 🔵

### 🏗️ Infrastructure
- [ ] Helm chart structure (`k8s/charts/gition/`)
- [ ] Namespace configuration (dev/staging/prod)
- [ ] Ingress with TLS (cert-manager)

### ⚙️ Workloads
- [ ] Frontend Deployment (replicas: 2+)
- [ ] API Deployment (replicas: 3+)
- [ ] MySQL StatefulSet (Primary-Replica)

### 💾 Storage
- [ ] Multi-PVC sharding strategy
- [ ] Hash-based workspace routing
- [ ] PVC per shard (`repos-pvc-1`, `repos-pvc-2`, ...)

### 📈 Scaling
- [ ] HPA for Frontend (CPU 70%)
- [ ] HPA for API (CPU 70%, Memory 80%)

### 🔄 GitOps
- [ ] ArgoCD application configuration
- [ ] GitHub Actions → Registry → ArgoCD pipeline

### 📚 Gition Docs (.gition/)
- [ ] `.gition/` folder structure
- [ ] Docs API (`/api/docs/{repo}/*`)
- [ ] Block → Markdown conversion
- [ ] .gitignore integration

### 🕸️ Graph View
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
