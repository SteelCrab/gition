# Gition Roadmap

> **Tech Stack**: React 19 + TypeScript + Vite | FastAPI (Python) | MySQL | Node.js Terminal | Docker
> **Current**: v0.1 (~70% complete) | **Next**: v0.2 | **Future**: v0.3

---

## v0.1 - Core Platform 🟡 (In Progress)

### 🔐 Authentication
- [x] GitHub OAuth integration
  - OAuth 2.0 authorization code flow
  - Secure token exchange via backend (`/auth/github/callback`)
  - HttpOnly cookie storage (not localStorage — migrated for security)
- [x] Login/Logout flow
  - `LoginPage.tsx` → GitHub redirect → `AuthCallback.tsx` → Dashboard
  - Server-side session verification via GitHub API (`/api/auth/verify`)
  - Protected route wrapper with auth retry logic in `App.tsx`
- [x] Token persistence (HttpOnly cookies)
  - Secure, SameSite cookie attributes
  - Automatic session restoration on page reload

### 📁 Repository Management
- [x] Repository listing from GitHub API
  - Fetch all repos (public + private) for authenticated user
  - Display owner, name, clone status in `Dashboard.tsx`
- [x] Repository cloning to server
  - `POST /api/repos/{user_id}/{repo_name}/clone`
  - Server-side clone to `/repos/{user_id}/{repo_name}/`
  - Re-clone support (`/reclone`) for corrupted workspaces
- [x] Branch listing and switching
  - `BranchSelector.tsx` component with local + remote branches
  - `POST /api/repos/{user_id}/{repo_name}/checkout` for branch switching
- [x] Git fetch for remote branch sync
  - Automatic fetch on repository load
  - Remote tracking branch detection
- [x] Show hidden branch list (local + remote)
  - Combined view of all available branches
  - Visual indicator for current/active branch
- [x] File browser with directory navigation
  - `FileBrowser.tsx` with recursive directory tree
  - File type detection (binary vs text)
  - Breadcrumb navigation support
- [x] Auto-pull on branch checkout (uses tracking branch)
  - `POST /api/repos/{user_id}/{repo_name}/pull`
  - Automatic pull when switching to a branch with upstream tracking

### ✏️ Editor
- [x] Notion-style block editor
  - `BranchPage.tsx` (387 lines) — core page editor
  - Block-based architecture with type-specific rendering
  - Auto-save with 1.5s debounce (`useEffect` + `setTimeout`)
  - Save status indicator (Saving... / Saved / Error)
- [ ] Code blocks with syntax highlighting
  - `CodeBlock.tsx` exists with copy-to-clipboard, language/filename metadata
  - **TODO**: Integrate `highlight.js` or `Prism.js` for live syntax coloring in editor mode
  - **TODO**: Language auto-detection from filename extension
  - **TODO**: Line numbers in code editor view
  - **TODO**: Tab size / indent configuration per language
- [x] Text blocks with inline editing
  - `TextBlock.tsx` with `contentEditable` for WYSIWYG editing
  - Whitespace preservation
  - Block update callback propagation to parent
- [x] `.gition` local page storage (branch-specific, git-ignored)
  - Pages stored per branch in server filesystem
  - Automatically ignored by Git
- [x] Markdown rendering (MarkdownRenderer component)
  - `MarkdownRenderer.tsx` with GFM support (`remark-gfm`)
  - Syntax highlighting via `rehype-highlight`
  - XSS protection via `rehype-sanitize`
  - Table wrapping for overflow handling
- [ ] Slash command menu (`/` to insert blocks)
  - **TODO**: `SlashMenu.tsx` — floating menu on `/` keystroke
  - **TODO**: Filter block types by search query
  - **TODO**: Keyboard navigation (arrow keys + Enter)
  - **TODO**: Block type categories (Text, Media, Integrations, Advanced)
- [ ] Block drag & drop reordering
  - **TODO**: Drag handle on hover (left side of block)
  - **TODO**: Drop zone indicators between blocks
  - **TODO**: Persist new block order to database
- [ ] Inline formatting toolbar
  - **TODO**: Floating toolbar on text selection (Bold, Italic, Code, Link, Strikethrough)
  - **TODO**: Markdown shortcut support (`**bold**`, `*italic*`, `` `code` ``)
  - **TODO**: Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+K)

### 🔄 Git Operations
- [x] Commit history viewer (branch-aware)
  - `CommitHistory.tsx` — date, author, SHA, insertions/deletions
  - Branch-specific commit filtering
  - Overflow fix to prevent panel overlap
- [x] File content viewer/editor
  - `FileEditor.tsx` — textarea editor for non-binary files
  - Binary file detection and warning
  - Read-only mode by default
- [x] Search within repository (code search)
  - `SearchPanel.tsx` — filename + content search
  - `POST /api/repos/{user_id}/{repo_name}/search`
  - Result highlighting and file navigation
- [x] Automatic commit fetch for current repository
  - Triggered on repository/branch selection change
- [x] Fix: Commit history overflow hides repo/search panels
  - CSS overflow containment fix
- [ ] Automatic commit for workspaces with pending changes
  - **TODO**: Detect `git status` changes (modified, untracked, deleted)
  - **TODO**: Staging UI — checkbox per file for selective staging
  - **TODO**: Commit message input with conventional commit suggestions
  - **TODO**: Auto-commit toggle (opt-in, configurable interval)
  - **TODO**: `POST /api/repos/{user_id}/{repo_name}/commit` endpoint
- [ ] Diff viewer
  - **TODO**: Side-by-side diff view for file changes
  - **TODO**: Unified diff view (toggle between modes)
  - **TODO**: Syntax-highlighted diff with line-level additions/deletions
  - **TODO**: Diff for staged vs unstaged vs committed changes

### 🔗 Integrations
- [x] GitHub Issues display
  - `IssuesPRs.tsx` — open issues with labels, assignment
  - External link to GitHub issue page
- [x] Pull Requests display
  - PR list with draft status indicator
  - Merge status and review state
- [ ] GitHub Webhooks listener
  - **TODO**: `POST /api/webhooks/github` endpoint
  - **TODO**: Handle push, issue, PR, and review events
  - **TODO**: Real-time UI update on webhook receipt
  - **TODO**: Webhook secret verification (HMAC-SHA256)

### 🧱 Blocks

#### GitHub Integration Blocks
- [ ] Issue block — Display GitHub issues inline
  - **TODO**: Render issue title, status (open/closed), labels, assignees
  - **TODO**: Fetch issue data via `GET /api/repos/{owner}/{repo}/issues/{number}`
  - **TODO**: Live status badge (green=open, purple=closed)
  - **TODO**: Click to expand — show issue body, comments count, timeline
  - **TODO**: Link to GitHub issue page
- [ ] PR block — Display Pull Requests inline
  - **TODO**: Render PR title, status (open/merged/closed), reviewers, CI status
  - **TODO**: Fetch PR data via `GET /api/repos/{owner}/{repo}/pulls/{number}`
  - **TODO**: Merge conflict indicator
  - **TODO**: Review approval status (approved/changes requested/pending)
  - **TODO**: Files changed count + diff stat (+/- lines)
- [ ] Commit block — Display GitHub commits inline
  - **TODO**: Render commit SHA (short), message, author, date
  - **TODO**: Fetch commit data via `GET /api/repos/{owner}/{repo}/commits/{sha}`
  - **TODO**: Diff stat summary (files changed, insertions, deletions)
  - **TODO**: Click to expand — show full commit message + changed files list
- [ ] Commit link block — Display Git commits inline
  - **TODO**: Parse commit reference from local Git repository
  - **TODO**: Render as compact inline chip (SHA + first line of message)
  - **TODO**: Hover tooltip with full commit details

#### Text Formatting Blocks
- [ ] Heading block — H1/H2/H3 inline
  - **TODO**: Heading level selector (H1, H2, H3)
  - **TODO**: Auto-detect `#`, `##`, `###` markdown prefix on input
  - **TODO**: Font size and weight mapping per level
  - **TODO**: Anchor ID generation for table of contents linking
- [ ] List block — Bulleted/Numbered list inline
  - **TODO**: Toggle between bullet (`-`) and numbered (`1.`) styles
  - **TODO**: Nested list support (Tab to indent, Shift+Tab to outdent)
  - **TODO**: Auto-continue list on Enter (new item)
  - **TODO**: Empty Enter to exit list mode
  - **TODO**: Checkbox/todo list variant (`- [ ]` / `- [x]`)
- [ ] Quote block — Blockquote inline
  - **TODO**: Left border accent style (Notion-like)
  - **TODO**: `>` markdown prefix auto-detection
  - **TODO**: Nested quote support
- [ ] Callout block — Highlighted callout inline
  - **TODO**: Icon selector (info, warning, error, tip, note)
  - **TODO**: Background color per type (blue, yellow, red, green, gray)
  - **TODO**: Editable callout body text
  - **TODO**: Collapsible option
- [ ] Divider block — Horizontal divider inline
  - **TODO**: Thin line separator (`<hr>` style)
  - **TODO**: `---` markdown shortcut auto-conversion
  - **TODO**: Drag-to-reposition support
- [ ] Toggle block — Collapsible toggle inline
  - **TODO**: Expandable/collapsible header
  - **TODO**: Nested block support inside toggle body
  - **TODO**: Default state setting (open/closed)
  - **TODO**: Smooth animation on expand/collapse
- [ ] Table block — Table inline
  - **TODO**: Dynamic row/column add/remove
  - **TODO**: Cell-level inline editing
  - **TODO**: Column resize (drag handle)
  - **TODO**: Header row toggle (bold + background)
  - **TODO**: Markdown table syntax import/export
  - **TODO**: Sort by column (click header)

#### Media Blocks (future v0.1 stretch)
- [ ] Image block — Display images inline
  - **TODO**: Drag & drop or paste image upload
  - **TODO**: Image resize handles
  - **TODO**: Caption text below image
  - **TODO**: Alignment options (left, center, full-width)
- [ ] Embed block — Embed external content
  - **TODO**: URL input → oEmbed resolution
  - **TODO**: Support YouTube, CodePen, Figma, Loom
  - **TODO**: Fallback to link preview card

### 📄 Pages
- [ ] Landing/Promotion page
  - **TODO**: Public-facing `/` route (unauthenticated)
  - **TODO**: Hero section — product tagline + screenshot/demo GIF
  - **TODO**: Feature highlights grid (3-4 key features with icons)
  - **TODO**: GitHub OAuth "Get Started" CTA button
  - **TODO**: Footer with GitHub repo link, documentation, license
- [x] Branch page auto-creation on checkout
  - Auto-creates `BranchPage` record on branch switch
  - Metadata: `{"created_from_branch": true, "branch_exists": true}`
- [x] Branch page navigation (tabbed UI: Notes / README)
  - Tab UI in `RepoPage.tsx` switching between editor and README view
  - README fetched from repository root and rendered via MarkdownRenderer
- [ ] Page templates
  - **TODO**: Pre-built templates (Sprint Planning, Bug Report, Feature Spec, Meeting Notes)
  - **TODO**: Template selector on new page creation
  - **TODO**: Custom template save/load
- [ ] Page history / version tracking
  - **TODO**: Save page snapshots on each save
  - **TODO**: Version diff viewer
  - **TODO**: Restore to previous version

### 🗄️ Database
- [x] MySQL + Branch Pages DB architecture
  - Read/Write connection pool separation (`database.py`, 244 lines)
  - Async database layer via `aiomysql`
- [x] **MySQL Schema**: User/Repository/Pages tables defined
  - `Users` (id, github_id, login, name, email, avatar_url, access_token, created_at, updated_at)
  - `Repositories` (id, user_id, name, owner, clone_url, default_branch, created_at, updated_at)
  - `Sessions` (user_id, token_hash, expires_at)
  - `Documents` (user_id, repo_id, title, content) — schema defined, not yet active
  - `Pipelines` (user_id, repo_id, name, config, status) — schema defined, not yet active
  - `BranchPages` (id:uuid, user_id, repo_id, branch_name, title, content:longtext, metadata:json, created_at, updated_at)
- [x] **MySQL Operations**: Async database layer
  - `database.py`: Connection pool management (read/write split)
  - `user_ops.py`: User CRUD operations (GitHub user sync)
  - `repo_ops.py`: Repository sync + auto-registration from filesystem
  - `page_ops.py`: Branch page CRUD with login-based API
- [ ] **PipeSQL**: Page/Block data management (future)
  - `Pages` (id, repo_id, branch, title, created_at)
  - `Blocks` (id, page_id, type, content:json, order:int, parent_block_id:nullable)
  - `BlockLinks` (block_id, target_type, target_id)
  - **TODO**: Migration script from current `BranchPages.content` (longtext) → normalized Blocks table
  - **TODO**: Block CRUD API endpoints
    - `POST /api/pages/{page_id}/blocks` — create block
    - `PUT /api/blocks/{block_id}` — update block
    - `DELETE /api/blocks/{block_id}` — delete block
    - `PATCH /api/pages/{page_id}/blocks/reorder` — reorder blocks
  - **TODO**: Block type registry (validate type field against known block types)
  - **TODO**: Transaction-safe batch block operations (create/update/delete multiple blocks atomically)

### 📊 Graph
- [ ] Graph visualization
  - **TODO**: D3.js or `vis-network` integration for node-link diagram
  - **TODO**: Data model — pages as nodes, `[[link]]` references as edges
  - **TODO**: Interactive zoom/pan canvas
  - **TODO**: Click node to navigate to page
  - **TODO**: Color coding by branch / repository

### 🔒 Security (ongoing)
- [x] Path traversal protection (reject `..`, `/`, `\` in path components)
- [x] SQL parameterized queries (prevent SQL injection)
- [x] Markdown sanitization (`rehype-sanitize`)
- [x] Terminal WebSocket authentication (GitHub token verification)
- [x] CORS origin validation
- [x] PTY resize bounds validation (prevent DoS)
- [ ] Rate limiting
  - **TODO**: Per-user API rate limiting (e.g., 100 req/min)
  - **TODO**: Clone/pull operation throttling
- [ ] Audit logging
  - **TODO**: Expand `POST /api/audit/log` for all write operations
  - **TODO**: Audit log viewer in admin panel

---

## v0.2 - Visualization & Features 🔵

### 🔄 Git Operations
- [ ] Commit/Push from UI
  - [ ] `git status` display — modified, staged, untracked files with color coding
  - [ ] File staging UI — checkbox per file, "Stage All" / "Unstage All" buttons
  - [ ] Commit message editor with conventional commit prefix selector (feat, fix, docs, refactor, etc.)
  - [ ] `POST /api/repos/{user_id}/{repo_name}/stage` — stage files
  - [ ] `POST /api/repos/{user_id}/{repo_name}/commit` — create commit
  - [ ] `POST /api/repos/{user_id}/{repo_name}/push` — push to remote
  - [ ] Push confirmation dialog (show branch, remote, commit count)
  - [ ] Force push protection (require explicit opt-in)
  - [ ] Commit signing support (GPG key configuration)
- [ ] Branch management from UI
  - [ ] Create new branch (from current HEAD or specific commit)
  - [ ] Delete branch (with protection for default branch)
  - [ ] Rename branch
  - [ ] Merge branch (fast-forward vs merge commit selection)
  - [ ] Cherry-pick commit to another branch

### 📊 Graph View
- [ ] Commit graph visualization (tree structure)
  - [ ] SVG-based commit graph renderer (D3.js)
  - [ ] Branch lanes with distinct colors per branch
  - [ ] Commit nodes with SHA, message preview, author avatar
  - [ ] Time axis (vertical) with date grouping
  - [ ] Horizontal layout option (toggle)
- [ ] Branch merge visualization
  - [ ] Merge commit detection and rendering (two parent edges)
  - [ ] Branch fork/merge points highlighted
  - [ ] Rebase detection (linear history indicator)
- [ ] Interactive node selection
  - [ ] Click commit → show details panel (full message, author, date, stats)
  - [ ] Hover preview tooltip
  - [ ] Multi-select commits for range diff
  - [ ] Right-click context menu (checkout, cherry-pick, revert, create branch)
- [ ] Diff viewer from graph
  - [ ] Click commit → side-by-side diff of all changed files
  - [ ] Click edge (between commits) → range diff
  - [ ] Syntax-highlighted diff with line annotations
  - [ ] File tree in diff (collapsible file list)

### 🔗 Integrations
- [ ] Issue/PR creation from UI
  - [ ] "New Issue" form — title, body (markdown editor), labels, assignees
  - [ ] `POST /api/repos/{owner}/{repo}/issues` → GitHub API
  - [ ] "New PR" form — source branch, target branch, title, body, reviewers
  - [ ] `POST /api/repos/{owner}/{repo}/pulls` → GitHub API
  - [ ] Template support (issue/PR templates from `.github/`)
- [ ] GitHub Actions status display (#2)
  - [ ] `GET /api/repos/{owner}/{repo}/actions/runs` — fetch workflow runs
  - [ ] Status badge per branch (passing/failing/pending)
  - [ ] Workflow run list — name, status, duration, trigger event
  - [ ] Click to expand — job steps with logs
  - [ ] Re-run workflow button
- [ ] Bi-directional sync (GitHub ↔ Gition) (#9)
  - [ ] GitHub Webhooks integration for real-time sync
  - [ ] Push events → auto-pull on server
  - [ ] Issue/PR events → update local cache
  - [ ] Conflict resolution strategy (server-side merge)
  - [ ] Sync status indicator per repository

### 🎨 UI/UX Enhancements
- [ ] Dark mode toggle
  - [ ] CSS variables for color tokens (light/dark themes)
  - [ ] Tailwind `dark:` variant support
  - [ ] User preference persistence (localStorage + system preference detection)
  - [ ] Smooth transition animation between themes
  - [ ] Theme-aware syntax highlighting (light/dark highlight.js themes)
- [ ] Responsive mobile layout improvements
  - [ ] Collapsible sidebar (hamburger menu on mobile)
  - [ ] Swipe gesture for panel switching
  - [ ] Touch-friendly block editing (larger tap targets)
  - [ ] Mobile-optimized file browser (full-screen overlay)
  - [ ] Responsive commit history (compact card view)
- [ ] Keyboard shortcuts
  - [ ] Global shortcut system (`useHotkeys` hook)
  - [ ] `Ctrl+K` — Command palette (search pages, repos, branches, commands)
  - [ ] `Ctrl+S` — Force save current page
  - [ ] `Ctrl+/` — Toggle sidebar
  - [ ] `Ctrl+P` — Quick file search
  - [ ] `Ctrl+Shift+P` — Command palette
  - [ ] `/` — Open slash command menu (in editor)
  - [ ] Shortcut cheat sheet modal (`?` key)
- [ ] Command palette
  - [ ] Fuzzy search across repos, branches, pages, files
  - [ ] Recent items section
  - [ ] Action commands (create page, switch branch, open terminal, etc.)
  - [ ] Keyboard-only navigation

### 💻 Web Terminal
- [x] Terminal server infrastructure (`terminal/server.js`, 213 lines)
  - Node.js + `node-pty` + `ws` WebSocket server
  - GitHub token authentication
  - Path traversal protection
  - PTY resize bounds validation
- [ ] Branch-specific terminal access (checkout & execute)
  - [ ] Auto-`cd` to repository workspace on terminal open
  - [ ] Branch context indicator in terminal header
  - [ ] Multiple terminal tabs per repository
  - [ ] Terminal split view (horizontal/vertical)
- [ ] Script blocks → Click to run in terminal
  - [ ] "Run" button on CodeBlock components
  - [ ] Send code content to active terminal session
  - [ ] Output capture and display inline (below code block)
  - [ ] Environment variable injection (per repository settings)
- [ ] Real-time output streaming (xterm.js + WebSocket)
  - [ ] `xterm.js` integration in React (`@xterm/xterm` + `@xterm/addon-fit`)
  - [ ] WebSocket reconnection with exponential backoff
  - [ ] Terminal buffer scrollback (configurable limit)
  - [ ] Copy/paste support in terminal
  - [ ] Search within terminal output (`@xterm/addon-search`)
- [ ] Recording feature (GIF for ≤5s, MP4 for >5s)
  - [ ] Terminal session recording start/stop controls
  - [ ] Server-side recording via `script` / `ttyrec` format
  - [ ] Post-processing: short recordings → GIF (via `gifencoder`), long → MP4 (via `ffmpeg`)
  - [ ] Playback viewer (embedded in page as block)
  - [ ] Share recording via URL

### 🧱 Blocks
- [ ] Pipeline blocks execution
  - [ ] Connect `PipelineBlock.tsx` to real CI/CD backend
  - [ ] Step-by-step execution with real-time log streaming
  - [ ] Step status transitions (pending → running → success/failure)
  - [ ] Retry individual failed steps
  - [ ] Pipeline execution history

### ⚡ Real-time Features
- [ ] Real-time document editing
  - [ ] WebSocket-based operational transform (OT) or CRDT engine
  - [ ] Cursor position broadcasting between users
  - [ ] Conflict-free concurrent block editing
  - [ ] Change highlighting (colored by user)
  - [ ] Edit history with user attribution
- [ ] Presence indicators (who's viewing)
  - [ ] User avatar stack on page header (who's currently viewing)
  - [ ] Colored cursor indicators per user
  - [ ] "User X is editing..." typing indicator
  - [ ] Active page tracking (`/api/presence/{page_id}`)
- [ ] Comments on code blocks
  - [ ] Inline comment thread on any block
  - [ ] `Comments` table (id, block_id, user_id, content, parent_comment_id, created_at)
  - [ ] Resolve/unresolve comment threads
  - [ ] `@mention` support with user autocomplete
  - [ ] Email/notification on mention

### 🚀 CI/CD
- [x] GitLab CI/CD pipeline (`.gitlab-ci.example.yml`)
  - Path-based Docker build (frontend/backend)
  - Manual deploy trigger
- [ ] Custom pipeline configuration
  - [ ] Pipeline YAML editor in Gition UI
  - [ ] Step definition: name, image, commands, environment, dependencies
  - [ ] Pipeline template library (Node.js, Python, Docker, etc.)
  - [ ] `Pipelines` table activation (currently schema-only)
  - [ ] Validation and dry-run
- [ ] Pipeline execution logs
  - [ ] Real-time log streaming (WebSocket)
  - [ ] Step-level log isolation
  - [ ] Log search and filtering
  - [ ] ANSI color rendering in log viewer
  - [ ] Log download (raw text)
- [ ] Deployment status tracking
  - [ ] Deployment environments (dev/staging/prod)
  - [ ] Deployment history with rollback capability
  - [ ] Health check integration (HTTP probe)
  - [ ] Deployment approval gates (manual approval step)

### ☸️ Kubernetes

#### 🏗️ Basic Setup
- [ ] Docker Compose dev environment
  - [ ] `docker-compose.dev.yml` — frontend (hot reload) + backend + MySQL + terminal
  - [ ] Volume mounts for live code editing
  - [ ] Environment variable management (`.env.example`)
  - [ ] Health check definitions for all services
- [ ] Basic Kubernetes manifests (Deployment, Service)
  - [ ] `k8s/base/` — Kustomize base manifests
  - [ ] Frontend Deployment + Service (ClusterIP)
  - [ ] Backend Deployment + Service (ClusterIP)
  - [ ] MySQL Deployment + Service + PVC
  - [ ] Terminal server Deployment + Service
  - [ ] ConfigMap for application configuration
  - [ ] Secret for database credentials, GitHub OAuth secrets
- [ ] Single namespace deployment
  - [ ] `gition` namespace with resource quotas
  - [ ] Network policies (frontend → backend, backend → MySQL)
  - [ ] `kubectl apply -k k8s/base/` deployment script

#### 🏗️ Infrastructure (Advanced)
- [ ] Helm chart structure (`k8s/charts/gition/`)
  - [ ] `Chart.yaml`, `values.yaml`, `values-dev.yaml`, `values-prod.yaml`
  - [ ] Templates: deployment, service, ingress, configmap, secret, hpa, pdb
  - [ ] Subchart for MySQL (Bitnami MySQL chart dependency)
  - [ ] `helm install gition ./k8s/charts/gition/ -f values-prod.yaml`
- [ ] Namespace configuration (dev/staging/prod)
  - [ ] Resource quotas per environment (CPU/memory limits)
  - [ ] Separate database instances per environment
  - [ ] Environment-specific ingress domains
- [ ] Ingress with TLS (cert-manager)
  - [ ] Nginx Ingress Controller configuration
  - [ ] `ClusterIssuer` for Let's Encrypt (staging + production)
  - [ ] Auto-TLS certificate provisioning
  - [ ] Domain routing: `app.gition.dev` → frontend, `api.gition.dev` → backend

#### ⚙️ Workloads
- [ ] Frontend Deployment (replicas: 2+)
  - [ ] Multi-stage Dockerfile (build → Nginx serve)
  - [ ] Liveness/readiness probes (`/health`)
  - [ ] Resource requests/limits (128Mi-256Mi RAM, 100m-200m CPU)
  - [ ] Pod disruption budget (minAvailable: 1)
- [ ] API Deployment (replicas: 3+)
  - [ ] Gunicorn/Uvicorn worker configuration
  - [ ] Liveness probe (`/health`) + readiness probe (`/api/auth/verify`)
  - [ ] Resource requests/limits (256Mi-512Mi RAM, 200m-500m CPU)
  - [ ] Graceful shutdown handling (SIGTERM)
  - [ ] Pod affinity/anti-affinity rules
- [ ] MySQL StatefulSet (Primary-Replica)
  - [ ] Primary-Replica topology (1 primary + N replicas)
  - [ ] PVC per pod (data persistence across restarts)
  - [ ] Automated backup CronJob (mysqldump → S3/GCS)
  - [ ] Replication lag monitoring
  - [ ] Connection pooling via ProxySQL or MySQL Router

#### 💾 Storage
- [ ] Multi-PVC sharding strategy
  - [ ] Repository workspace distribution across PVCs
  - [ ] Consistent hashing for repo → PVC assignment
  - [ ] Rebalancing strategy for new PVC additions
- [ ] Hash-based workspace routing
  - [ ] `hash(user_id, repo_name) % shard_count` → PVC index
  - [ ] API middleware to resolve PVC path before Git operations
  - [ ] Cache PVC mapping in Redis/ConfigMap
- [ ] PVC per shard (`repos-pvc-1`, `repos-pvc-2`, ...)
  - [ ] StorageClass: SSD-backed (`gp3` / `pd-ssd`)
  - [ ] Dynamic provisioning with size limits
  - [ ] Monitoring: PVC usage alerts at 80% capacity

#### 📈 Scaling
- [ ] Frontend HPA (CPU 70%)
  - [ ] `HorizontalPodAutoscaler` — min 2, max 10 replicas
  - [ ] Scale-down stabilization window (300s)
- [ ] API HPA (CPU 70%, Memory 80%)
  - [ ] `HorizontalPodAutoscaler` — min 3, max 20 replicas
  - [ ] Custom metrics: active WebSocket connections, Git operation queue depth
  - [ ] Vertical Pod Autoscaler (VPA) for right-sizing

#### 🔄 GitOps
- [ ] ArgoCD application configuration
  - [ ] `argocd/application.yaml` — Gition app definition
  - [ ] Auto-sync from `main` branch `k8s/` directory
  - [ ] Sync waves (infra → database → backend → frontend)
  - [ ] Health checks integration
- [ ] GitHub Actions → Registry → ArgoCD pipeline
  - [ ] `.github/workflows/ci.yml` — lint, test, build
  - [ ] `.github/workflows/cd.yml` — Docker build → push to GHCR/ECR
  - [ ] Image tag strategy: `sha-{commit}` for traceability
  - [ ] ArgoCD image updater for automatic deployment on new image

### 📚 Gition Docs (.gition/)
- [ ] `.gition/` folder structure
  - [ ] `.gition/pages/` — exported page markdown files
  - [ ] `.gition/config.json` — workspace configuration
  - [ ] `.gition/templates/` — page templates
  - [ ] Auto-add `.gition/` to `.gitignore` (or optionally commit)
- [ ] Docs API (`/api/docs/{repo}/*`)
  - [ ] `GET /api/docs/{user_id}/{repo_name}/` — list all docs
  - [ ] `GET /api/docs/{user_id}/{repo_name}/{path}` — read doc
  - [ ] `PUT /api/docs/{user_id}/{repo_name}/{path}` — write doc
  - [ ] `DELETE /api/docs/{user_id}/{repo_name}/{path}` — delete doc
- [ ] Block → Markdown conversion
  - [ ] Serializer: Block JSON → Markdown string
  - [ ] Parser: Markdown string → Block JSON
  - [ ] Round-trip fidelity tests
  - [ ] Export page as `.md` file
- [ ] .gitignore integration
  - [ ] Auto-check if `.gition/` is in `.gitignore`
  - [ ] Prompt user to add if missing
  - [ ] Option to commit `.gition/` for shared documentation

### 🕸️ Graph View (Advanced)
- [ ] `[[link]]` syntax parser
  - [ ] Regex parser for `[[page-name]]` references in block content
  - [ ] Auto-complete dropdown when typing `[[`
  - [ ] Link resolution (page name → page ID)
  - [ ] Broken link detection and warning
- [ ] `doc_links` table schema
  - [ ] `DocLinks` (id, source_page_id, target_page_id, source_block_id, link_text, created_at)
  - [ ] Trigger: update links on page save
  - [ ] Cascade delete on page removal
- [ ] Link API (`/api/links/*`)
  - [ ] `GET /api/links/{page_id}/outgoing` — pages this page links to
  - [ ] `GET /api/links/{page_id}/incoming` — pages linking to this page (backlinks)
  - [ ] `GET /api/links/graph/{repo_id}` — full link graph for repository
- [ ] D3.js graph visualization
  - [ ] Force-directed layout with page nodes and link edges
  - [ ] Node size proportional to link count
  - [ ] Cluster by branch or tag
  - [ ] Zoom/pan with minimap
  - [ ] Search and highlight nodes
- [ ] Backlinks support
  - [ ] "Linked References" section at bottom of each page
  - [ ] Preview snippet of linking context
  - [ ] Click to navigate to source page

---

## v0.3 - Enterprise & Scale 🟣 (Future)

### 🏢 Multi-user & Teams
- [ ] Organization support (GitHub org → Gition team)
- [ ] Role-based access control (owner, admin, member, viewer)
- [ ] Shared workspaces with permission inheritance
- [ ] Team activity feed

### 🔌 Plugin System
- [ ] Custom block type SDK
- [ ] Plugin marketplace
- [ ] Third-party integration framework (Slack, Jira, Linear, etc.)

### 📱 Desktop & Mobile
- [ ] Electron desktop app (offline support)
- [ ] PWA for mobile access
- [ ] Offline page editing with sync on reconnect

### 🌐 Self-Hosting
- [ ] One-click deploy (DigitalOcean, Railway, Render)
- [ ] Helm chart for self-hosted Kubernetes
- [ ] Admin panel (user management, system settings, backup/restore)

### 📈 Analytics
- [ ] Repository activity dashboard
- [ ] Contribution heatmap
- [ ] Page view analytics
- [ ] API usage metrics

---

## Legend
- ✅ Completed milestone
- 🟡 In progress
- 🔵 Planned milestone
- 🟣 Future milestone
- [x] Completed task
- [ ] Pending task
