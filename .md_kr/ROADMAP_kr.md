# Gition 로드맵

## v0.1 - 코어 플랫폼 🟡 (진행 중)

### 🔐 인증
- [x] GitHub OAuth 연동
- [x] 로그인/로그아웃 플로우
- [x] 토큰 저장 (localStorage)

### 📁 저장소 관리
- [x] GitHub API에서 저장소 목록 조회
- [x] 서버에 저장소 클론
- [x] 브랜치 목록 조회 및 전환
- [x] 원격 브랜치 동기화 (git fetch)
- [x] 숨겨진 브랜치 목록 보기
- [x] 디렉토리 탐색 파일 브라우저
- [x] 브랜치 체크아웃 시 자동 풀 (tracking branch 사용)

### ✏️ 에디터
- [x] Notion 스타일 블록 에디터
- [ ] 코드 블록 신택스 하이라이팅
- [x] 텍스트 블록 인라인 편집
- [x] `.gition` 로컬 페이지 저장 (브랜치별, Git 무시)
- [x] 마크다운 렌더링 (MarkdownRenderer 컴포넌트)

### 🔄 Git 작업
- [x] 커밋 히스토리 뷰어
- [x] 파일 내용 뷰어/에디터
- [x] 저장소 내 검색 (코드 검색)
- [ ] UI에서 커밋/푸시
- [ ] 현재 저장소의 커밋 자동 불러오기
- [x] 버그 수정: 커밋 히스토리 오버플로우로 레포/검색 패널 가림
- [ ] 변경 사항이 있는 작업 공간 자동 커밋

### 🔗 연동
- [x] GitHub Issues 표시
- [x] Pull Requests 표시
- [ ] UI에서 Issue/PR 생성
- [ ] GitHub Actions 상태 표시 (#2)
- [ ] 양방향 동기화 (GitHub ↔ Gition) (#9)

### 🧱 블록
- [ ] 이슈 블록 (Issue block) - GitHub 이슈를 인라인으로 표시
- [ ] PR 블록 (PR block) - Pull Request를 인라인으로 표시
- [ ] 커밋 블록 (Commit block) - GitHub 커밋을 인라인으로 표시
- [ ] 커밋 링크 블록 (Commit link block) - Git 커밋을 인라인으로 표시
- [ ] 헤딩 블록 (Heading block) - H1/H2/H3 인라인
- [ ] 리스트 블록 (List block) - 불릿/번호 리스트 인라인
- [ ] 인용 블록 (Quote block) - 인용구 인라인
- [ ] 콜아웃 블록 (Callout block) - 강조 콜아웃 인라인
- [ ] 구분선 블록 (Divider block) - 수평 구분선 인라인
- [ ] 토글 블록 (Toggle block) - 접기/펼치기 인라인
- [ ] 테이블 블록 (Table block) - 테이블 인라인

### 📄 페이지
- [ ] 랜딩/프로모션 페이지
- [x] 브랜치 체크아웃 시 페이지 자동 생성
- [x] 브랜치 페이지 네비게이션 (탭 UI: Notes / README)

### 🗄️ 데이터베이스
- [x] MySQL + Branch Pages DB 구조
- [x] **MySQL 스키마**: 사용자/저장소/페이지 테이블 정의
  - Users (id, login, email, avatar_url, access_token)
  - Repositories (id, name, owner, clone_url, default_branch)
  - Sessions (user_id, token_hash, expires_at)
  - Documents (user_id, repo_id, title, content)
  - Pipelines (user_id, repo_id, name, config, status)
  - BranchPages (user_id, repo_id, branch_name, title, content)
- [x] **MySQL 운영**: 비동기 데이터베이스 레이어
  - database.py: 커넥션 풀 관리
  - user_ops.py: 사용자 CRUD 작업
  - repo_ops.py: 저장소 동기화 + 자동 등록
  - page_ops.py: 브랜치 페이지 CRUD (로그인 기반 API)
- [ ] **PipeSQL**: 페이지/블록 데이터 관리 (향후)
  - Pages (id, repo_id, branch, title, created_at)
  - Blocks (id, page_id, type, content, order)
  - BlockLinks (block_id, target_type, target_id)

### 📊 그래프
- [ ] 그래프 시각화

### ☸️ Kubernetes (기본)
- [ ] Docker Compose 개발 환경
- [ ] 기본 Kubernetes 매니페스트 (Deployment, Service)
- [ ] 단일 네임스페이스 배포

---

## v0.2 - 시각화 🔵

### 📊 Graph View
- [ ] 커밋 그래프 시각화 (트리 구조)
- [ ] 브랜치 머지 시각화
- [ ] 인터랙티브 노드 선택
- [ ] 그래프에서 Diff 뷰어

### 🎨 UI/UX 개선
- [ ] 다크 모드 토글
- [ ] 반응형 모바일 레이아웃 개선
- [ ] 키보드 단축키

### 💻 웹 터미널
- [ ] 브랜치별 터미널 접속 (체크아웃 & 실행)
- [ ] 스크립트 블록 → 클릭하면 터미널에서 실행
- [ ] 실시간 출력 스트리밍 (xterm.js + WebSocket)
- [ ] 녹화 기능 (≤5초: GIF, >5초: MP4)

### 🧱 블록
- [ ] 파이프라인 블록 실행

### ⚡ 실시간 기능
- [ ] 실시간 문서 편집
- [ ] 접속자 표시 (누가 보고 있는지)
- [ ] 코드 블록 댓글

### 🚀 CI/CD
- [ ] 커스텀 파이프라인 설정
- [ ] 파이프라인 실행 로그
- [ ] 배포 상태 추적

### ☸️ Kubernetes (확장)

#### 🏗️ 인프라
- [ ] Helm 차트 구조 (`k8s/charts/gition/`)
- [ ] 네임스페이스 설정 (dev/staging/prod)
- [ ] TLS 포함 Ingress (cert-manager)

#### ⚙️ 워크로드
- [ ] Frontend Deployment (replicas: 2+)
- [ ] API Deployment (replicas: 3+)
- [ ] MySQL StatefulSet (Primary-Replica)

#### 💾 스토리지
- [ ] Multi-PVC 샤딩 전략
- [ ] Hash 기반 워크스페이스 라우팅
- [ ] 샤드별 PVC (`repos-pvc-1`, `repos-pvc-2`, ...)

#### 📈 스케일링
- [ ] Frontend HPA (CPU 70%)
- [ ] API HPA (CPU 70%, Memory 80%)

#### 🔄 GitOps
- [ ] ArgoCD 애플리케이션 설정
- [ ] GitHub Actions → Registry → ArgoCD 파이프라인

### 📚 Gition Docs (.gition/)
- [ ] `.gition/` 폴더 구조
- [ ] Docs API (`/api/docs/{repo}/*`)
- [ ] Block → Markdown 변환
- [ ] .gitignore 연동

### 🕸️ Graph View (확장)
- [ ] `[[link]]` 문법 파서
- [ ] `doc_links` 테이블 스키마
- [ ] Link API (`/api/links/*`)
- [ ] D3.js 그래프 시각화
- [ ] Backlinks 지원

---

## 범례
- ✅ 완료된 마일스톤
- 🟡 진행 중
- 🔵 계획된 마일스톤
- [x] 완료된 작업
- [ ] 대기 중인 작업
