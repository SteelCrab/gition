# Gition 로드맵

> **기술 스택**: React 19 + TypeScript + Vite | FastAPI (Python) | MySQL | Node.js Terminal | Docker
> **현재**: v0.1 (~70% 완료) | **다음**: v0.2 | **향후**: v0.3

---

## v0.1 - 코어 플랫폼 🟡 (진행 중)

### 🔐 인증
- [x] GitHub OAuth 연동
  - OAuth 2.0 인가 코드 플로우
  - 백엔드를 통한 안전한 토큰 교환 (`/auth/github/callback`)
  - HttpOnly 쿠키 저장 (localStorage에서 보안 마이그레이션 완료)
- [x] 로그인/로그아웃 플로우
  - `LoginPage.tsx` → GitHub 리다이렉트 → `AuthCallback.tsx` → Dashboard
  - GitHub API를 통한 서버 측 세션 검증 (`/api/auth/verify`)
  - `App.tsx`에서 인증 재시도 로직을 포함한 보호된 라우트 래퍼
- [x] 토큰 저장 (HttpOnly 쿠키)
  - Secure, SameSite 쿠키 속성
  - 페이지 새로고침 시 자동 세션 복원

### 📁 저장소 관리
- [x] GitHub API에서 저장소 목록 조회
  - 인증된 사용자의 모든 저장소 (public + private) 가져오기
  - `Dashboard.tsx`에서 소유자, 이름, 클론 상태 표시
- [x] 서버에 저장소 클론
  - `POST /api/repos/{user_id}/{repo_name}/clone`
  - 서버 측 클론: `/repos/{user_id}/{repo_name}/`
  - 손상된 워크스페이스를 위한 재클론 지원 (`/reclone`)
- [x] 브랜치 목록 조회 및 전환
  - `BranchSelector.tsx` 컴포넌트: 로컬 + 리모트 브랜치
  - `POST /api/repos/{user_id}/{repo_name}/checkout`으로 브랜치 전환
- [x] 원격 브랜치 동기화 (git fetch)
  - 저장소 로드 시 자동 fetch
  - 원격 트래킹 브랜치 감지
- [x] 숨겨진 브랜치 목록 보기
  - 모든 사용 가능한 브랜치의 통합 뷰
  - 현재/활성 브랜치 시각적 표시
- [x] 디렉토리 탐색 파일 브라우저
  - `FileBrowser.tsx` — 재귀적 디렉토리 트리
  - 파일 타입 감지 (바이너리 vs 텍스트)
  - 브레드크럼 네비게이션 지원
- [x] 브랜치 체크아웃 시 자동 풀 (tracking branch 사용)
  - `POST /api/repos/{user_id}/{repo_name}/pull`
  - 업스트림 트래킹이 있는 브랜치로 전환 시 자동 풀

### ✏️ 에디터
- [x] Notion 스타일 블록 에디터
  - `BranchPage.tsx` (387줄) — 핵심 페이지 에디터
  - 타입별 렌더링이 있는 블록 기반 아키텍처
  - 1.5초 디바운스 자동 저장 (`useEffect` + `setTimeout`)
  - 저장 상태 표시기 (저장 중... / 저장됨 / 오류)
- [ ] 코드 블록 신택스 하이라이팅
  - `CodeBlock.tsx` 존재: 클립보드 복사, 언어/파일명 메타데이터
  - **TODO**: 에디터 모드에서 실시간 구문 색상 표시 (`highlight.js` 또는 `Prism.js` 통합)
  - **TODO**: 파일 확장자 기반 언어 자동 감지
  - **TODO**: 코드 에디터 뷰에 줄 번호 표시
  - **TODO**: 언어별 탭 크기 / 들여쓰기 설정
- [x] 텍스트 블록 인라인 편집
  - `TextBlock.tsx` — `contentEditable` WYSIWYG 편집
  - 공백 유지
  - 부모 컴포넌트로 블록 업데이트 콜백 전파
- [x] `.gition` 로컬 페이지 저장 (브랜치별, Git 무시)
  - 서버 파일시스템에 브랜치별 페이지 저장
  - Git에서 자동 무시
- [x] 마크다운 렌더링 (MarkdownRenderer 컴포넌트)
  - `MarkdownRenderer.tsx` — GFM 지원 (`remark-gfm`)
  - `rehype-highlight`를 통한 구문 강조
  - `rehype-sanitize`를 통한 XSS 방지
  - 오버플로우 처리를 위한 테이블 래핑
- [ ] 슬래시 커맨드 메뉴 (`/`로 블록 삽입)
  - **TODO**: `SlashMenu.tsx` — `/` 키 입력 시 플로팅 메뉴
  - **TODO**: 검색어로 블록 타입 필터링
  - **TODO**: 키보드 네비게이션 (화살표 키 + Enter)
  - **TODO**: 블록 타입 카테고리 (텍스트, 미디어, 연동, 고급)
- [ ] 블록 드래그 앤 드롭 재정렬
  - **TODO**: 호버 시 드래그 핸들 (블록 왼쪽)
  - **TODO**: 블록 사이 드롭 존 표시기
  - **TODO**: 새로운 블록 순서 데이터베이스에 저장
- [ ] 인라인 서식 툴바
  - **TODO**: 텍스트 선택 시 플로팅 툴바 (굵게, 기울임, 코드, 링크, 취소선)
  - **TODO**: 마크다운 단축키 지원 (`**굵게**`, `*기울임*`, `` `코드` ``)
  - **TODO**: 키보드 단축키 (Ctrl+B, Ctrl+I, Ctrl+K)

### 🔄 Git 작업
- [x] 커밋 히스토리 뷰어
  - `CommitHistory.tsx` — 날짜, 작성자, SHA, 추가/삭제 수
  - 브랜치별 커밋 필터링
  - 패널 겹침 방지를 위한 오버플로우 수정
- [x] 파일 내용 뷰어/에디터
  - `FileEditor.tsx` — 비바이너리 파일용 textarea 에디터
  - 바이너리 파일 감지 및 경고
  - 기본 읽기 전용 모드
- [x] 저장소 내 검색 (코드 검색)
  - `SearchPanel.tsx` — 파일명 + 내용 검색
  - `POST /api/repos/{user_id}/{repo_name}/search`
  - 결과 하이라이팅 및 파일 네비게이션
- [x] 현재 저장소의 커밋 자동 불러오기
  - 저장소/브랜치 선택 변경 시 트리거
- [x] 버그 수정: 커밋 히스토리 오버플로우로 레포/검색 패널 가림
  - CSS 오버플로우 격리 수정
- [ ] 변경 사항이 있는 워크스페이스 자동 커밋
  - **TODO**: `git status` 변경 감지 (수정됨, 미추적, 삭제됨)
  - **TODO**: 스테이징 UI — 파일별 체크박스로 선택적 스테이징
  - **TODO**: 컨벤셔널 커밋 제안이 포함된 커밋 메시지 입력
  - **TODO**: 자동 커밋 토글 (선택적, 설정 가능한 간격)
  - **TODO**: `POST /api/repos/{user_id}/{repo_name}/commit` 엔드포인트
- [ ] Diff 뷰어
  - **TODO**: 파일 변경 사항 나란히 보기 (side-by-side)
  - **TODO**: 통합 diff 뷰 (모드 전환)
  - **TODO**: 줄 수준 추가/삭제의 구문 강조 diff
  - **TODO**: 스테이지 vs 언스테이지 vs 커밋된 변경 사항 diff

### 🔗 연동
- [x] GitHub Issues 표시
  - `IssuesPRs.tsx` — 라벨, 할당자가 포함된 오픈 이슈
  - GitHub 이슈 페이지로의 외부 링크
- [x] Pull Requests 표시
  - 드래프트 상태 표시기가 있는 PR 목록
  - 머지 상태 및 리뷰 상태
- [ ] GitHub Webhooks 리스너
  - **TODO**: `POST /api/webhooks/github` 엔드포인트
  - **TODO**: push, issue, PR, review 이벤트 처리
  - **TODO**: 웹훅 수신 시 실시간 UI 업데이트
  - **TODO**: 웹훅 시크릿 검증 (HMAC-SHA256)

### 🧱 블록

#### GitHub 연동 블록
- [ ] 이슈 블록 (Issue block) — GitHub 이슈를 인라인으로 표시
  - **TODO**: 이슈 제목, 상태 (열림/닫힘), 라벨, 할당자 렌더링
  - **TODO**: `GET /api/repos/{owner}/{repo}/issues/{number}`로 이슈 데이터 가져오기
  - **TODO**: 실시간 상태 배지 (초록=열림, 보라=닫힘)
  - **TODO**: 클릭하여 확장 — 이슈 본문, 댓글 수, 타임라인 표시
  - **TODO**: GitHub 이슈 페이지 링크
- [ ] PR 블록 (PR block) — Pull Request를 인라인으로 표시
  - **TODO**: PR 제목, 상태 (열림/머지됨/닫힘), 리뷰어, CI 상태 렌더링
  - **TODO**: `GET /api/repos/{owner}/{repo}/pulls/{number}`로 PR 데이터 가져오기
  - **TODO**: 머지 충돌 표시기
  - **TODO**: 리뷰 승인 상태 (승인/변경 요청/대기 중)
  - **TODO**: 변경된 파일 수 + diff 통계 (+/- 줄)
- [ ] 커밋 블록 (Commit block) — GitHub 커밋을 인라인으로 표시
  - **TODO**: 커밋 SHA (축약), 메시지, 작성자, 날짜 렌더링
  - **TODO**: `GET /api/repos/{owner}/{repo}/commits/{sha}`로 커밋 데이터 가져오기
  - **TODO**: diff 통계 요약 (변경된 파일, 추가, 삭제)
  - **TODO**: 클릭하여 확장 — 전체 커밋 메시지 + 변경된 파일 목록
- [ ] 커밋 링크 블록 (Commit link block) — Git 커밋을 인라인으로 표시
  - **TODO**: 로컬 Git 저장소에서 커밋 참조 파싱
  - **TODO**: 컴팩트 인라인 칩으로 렌더링 (SHA + 메시지 첫 줄)
  - **TODO**: 호버 시 전체 커밋 상세 툴팁

#### 텍스트 서식 블록
- [ ] 헤딩 블록 (Heading block) — H1/H2/H3 인라인
  - **TODO**: 헤딩 레벨 선택기 (H1, H2, H3)
  - **TODO**: 입력 시 `#`, `##`, `###` 마크다운 접두사 자동 감지
  - **TODO**: 레벨별 폰트 크기 및 굵기 매핑
  - **TODO**: 목차 링킹을 위한 앵커 ID 생성
- [ ] 리스트 블록 (List block) — 불릿/번호 리스트 인라인
  - **TODO**: 불릿 (`-`)과 번호 (`1.`) 스타일 전환
  - **TODO**: 중첩 리스트 지원 (Tab으로 들여쓰기, Shift+Tab으로 내어쓰기)
  - **TODO**: Enter 시 리스트 자동 연속 (새 항목)
  - **TODO**: 빈 Enter로 리스트 모드 종료
  - **TODO**: 체크박스/할일 리스트 변형 (`- [ ]` / `- [x]`)
- [ ] 인용 블록 (Quote block) — 인용구 인라인
  - **TODO**: 왼쪽 테두리 강조 스타일 (Notion 스타일)
  - **TODO**: `>` 마크다운 접두사 자동 감지
  - **TODO**: 중첩 인용 지원
- [ ] 콜아웃 블록 (Callout block) — 강조 콜아웃 인라인
  - **TODO**: 아이콘 선택기 (정보, 경고, 오류, 팁, 노트)
  - **TODO**: 타입별 배경색 (파랑, 노랑, 빨강, 초록, 회색)
  - **TODO**: 편집 가능한 콜아웃 본문 텍스트
  - **TODO**: 접기 옵션
- [ ] 구분선 블록 (Divider block) — 수평 구분선 인라인
  - **TODO**: 얇은 선 구분자 (`<hr>` 스타일)
  - **TODO**: `---` 마크다운 단축키 자동 변환
  - **TODO**: 드래그하여 위치 변경 지원
- [ ] 토글 블록 (Toggle block) — 접기/펼치기 인라인
  - **TODO**: 확장/축소 가능한 헤더
  - **TODO**: 토글 본문 내 중첩 블록 지원
  - **TODO**: 기본 상태 설정 (열림/닫힘)
  - **TODO**: 확장/축소 시 부드러운 애니메이션
- [ ] 테이블 블록 (Table block) — 테이블 인라인
  - **TODO**: 동적 행/열 추가/삭제
  - **TODO**: 셀 수준 인라인 편집
  - **TODO**: 열 크기 조절 (드래그 핸들)
  - **TODO**: 헤더 행 토글 (굵게 + 배경색)
  - **TODO**: 마크다운 테이블 구문 가져오기/내보내기
  - **TODO**: 열 기준 정렬 (헤더 클릭)

#### 미디어 블록 (v0.1 확장 목표)
- [ ] 이미지 블록 (Image block) — 이미지 인라인 표시
  - **TODO**: 드래그 앤 드롭 또는 붙여넣기 이미지 업로드
  - **TODO**: 이미지 크기 조절 핸들
  - **TODO**: 이미지 아래 캡션 텍스트
  - **TODO**: 정렬 옵션 (왼쪽, 가운데, 전체 너비)
- [ ] 임베드 블록 (Embed block) — 외부 콘텐츠 임베드
  - **TODO**: URL 입력 → oEmbed 해석
  - **TODO**: YouTube, CodePen, Figma, Loom 지원
  - **TODO**: 링크 미리보기 카드 폴백

### 📄 페이지
- [ ] 랜딩/프로모션 페이지
  - **TODO**: 공개 `/` 라우트 (인증 불필요)
  - **TODO**: 히어로 섹션 — 제품 태그라인 + 스크린샷/데모 GIF
  - **TODO**: 기능 하이라이트 그리드 (3-4개 주요 기능 + 아이콘)
  - **TODO**: GitHub OAuth "시작하기" CTA 버튼
  - **TODO**: 푸터 — GitHub 저장소 링크, 문서, 라이선스
- [x] 브랜치 체크아웃 시 페이지 자동 생성
  - 브랜치 전환 시 `BranchPage` 레코드 자동 생성
  - 메타데이터: `{"created_from_branch": true, "branch_exists": true}`
- [x] 브랜치 페이지 네비게이션 (탭 UI: Notes / README)
  - `RepoPage.tsx`에서 에디터와 README 뷰 간 탭 UI 전환
  - 저장소 루트에서 README를 가져와 MarkdownRenderer로 렌더링
- [ ] 페이지 템플릿
  - **TODO**: 사전 구축 템플릿 (스프린트 계획, 버그 리포트, 기능 명세, 회의록)
  - **TODO**: 새 페이지 생성 시 템플릿 선택기
  - **TODO**: 커스텀 템플릿 저장/불러오기
- [ ] 페이지 히스토리 / 버전 추적
  - **TODO**: 저장 시마다 페이지 스냅샷 저장
  - **TODO**: 버전 diff 뷰어
  - **TODO**: 이전 버전으로 복원

### 🗄️ 데이터베이스
- [x] MySQL + Branch Pages DB 구조
  - 읽기/쓰기 커넥션 풀 분리 (`database.py`, 244줄)
  - `aiomysql`을 통한 비동기 데이터베이스 레이어
- [x] **MySQL 스키마**: 사용자/저장소/페이지 테이블 정의
  - `Users` (id, github_id, login, name, email, avatar_url, access_token, created_at, updated_at)
  - `Repositories` (id, user_id, name, owner, clone_url, default_branch, created_at, updated_at)
  - `Sessions` (user_id, token_hash, expires_at)
  - `Documents` (user_id, repo_id, title, content) — 스키마 정의됨, 아직 미사용
  - `Pipelines` (user_id, repo_id, name, config, status) — 스키마 정의됨, 아직 미사용
  - `BranchPages` (id:uuid, user_id, repo_id, branch_name, title, content:longtext, metadata:json, created_at, updated_at)
- [x] **MySQL 운영**: 비동기 데이터베이스 레이어
  - `database.py`: 커넥션 풀 관리 (읽기/쓰기 분리)
  - `user_ops.py`: 사용자 CRUD 작업 (GitHub 사용자 동기화)
  - `repo_ops.py`: 저장소 동기화 + 파일시스템에서 자동 등록
  - `page_ops.py`: 로그인 기반 API를 사용한 브랜치 페이지 CRUD
- [ ] **PipeSQL**: 페이지/블록 데이터 관리 (향후)
  - `Pages` (id, repo_id, branch, title, created_at)
  - `Blocks` (id, page_id, type, content:json, order:int, parent_block_id:nullable)
  - `BlockLinks` (block_id, target_type, target_id)
  - **TODO**: 현재 `BranchPages.content` (longtext) → 정규화된 Blocks 테이블로 마이그레이션 스크립트
  - **TODO**: 블록 CRUD API 엔드포인트
    - `POST /api/pages/{page_id}/blocks` — 블록 생성
    - `PUT /api/blocks/{block_id}` — 블록 수정
    - `DELETE /api/blocks/{block_id}` — 블록 삭제
    - `PATCH /api/pages/{page_id}/blocks/reorder` — 블록 재정렬
  - **TODO**: 블록 타입 레지스트리 (알려진 블록 타입에 대한 type 필드 검증)
  - **TODO**: 트랜잭션 안전 일괄 블록 작업 (다수 블록 원자적 생성/수정/삭제)

### 📊 그래프
- [ ] 그래프 시각화
  - **TODO**: D3.js 또는 `vis-network` 노드-링크 다이어그램 통합
  - **TODO**: 데이터 모델 — 페이지를 노드로, `[[link]]` 참조를 엣지로
  - **TODO**: 인터랙티브 줌/팬 캔버스
  - **TODO**: 노드 클릭으로 페이지 이동
  - **TODO**: 브랜치/저장소별 색상 구분

### 🔒 보안 (지속)
- [x] 경로 순회 방지 (`..`, `/`, `\`를 경로 구성요소에서 거부)
- [x] SQL 파라미터화 쿼리 (SQL 인젝션 방지)
- [x] 마크다운 살균 처리 (`rehype-sanitize`)
- [x] 터미널 WebSocket 인증 (GitHub 토큰 검증)
- [x] CORS 출처 검증
- [x] PTY 리사이즈 범위 검증 (DoS 방지)
- [ ] 속도 제한
  - **TODO**: 사용자별 API 속도 제한 (예: 100 req/min)
  - **TODO**: 클론/풀 작업 스로틀링
- [ ] 감사 로깅
  - **TODO**: 모든 쓰기 작업에 대한 `POST /api/audit/log` 확장
  - **TODO**: 관리자 패널에서 감사 로그 뷰어

---

## v0.2 - 시각화 및 기능 개선 🔵

### 🔄 Git 작업
- [ ] UI에서 커밋/푸시
  - [ ] `git status` 표시 — 수정, 스테이지, 미추적 파일 색상 구분
  - [ ] 파일 스테이징 UI — 파일별 체크박스, "모두 스테이지" / "모두 언스테이지" 버튼
  - [ ] 컨벤셔널 커밋 접두사 선택기가 있는 커밋 메시지 에디터 (feat, fix, docs, refactor 등)
  - [ ] `POST /api/repos/{user_id}/{repo_name}/stage` — 파일 스테이지
  - [ ] `POST /api/repos/{user_id}/{repo_name}/commit` — 커밋 생성
  - [ ] `POST /api/repos/{user_id}/{repo_name}/push` — 리모트에 푸시
  - [ ] 푸시 확인 다이얼로그 (브랜치, 리모트, 커밋 수 표시)
  - [ ] 강제 푸시 방지 (명시적 동의 필요)
  - [ ] 커밋 서명 지원 (GPG 키 설정)
- [ ] UI에서 브랜치 관리
  - [ ] 새 브랜치 생성 (현재 HEAD 또는 특정 커밋에서)
  - [ ] 브랜치 삭제 (기본 브랜치 보호 포함)
  - [ ] 브랜치 이름 변경
  - [ ] 브랜치 머지 (fast-forward vs merge commit 선택)
  - [ ] 다른 브랜치로 커밋 체리픽

### 🔗 연동
- [ ] UI에서 Issue/PR 생성
  - [ ] "새 이슈" 폼 — 제목, 본문 (마크다운 에디터), 라벨, 할당자
  - [ ] `POST /api/repos/{owner}/{repo}/issues` → GitHub API
  - [ ] "새 PR" 폼 — 소스 브랜치, 타겟 브랜치, 제목, 본문, 리뷰어
  - [ ] `POST /api/repos/{owner}/{repo}/pulls` → GitHub API
  - [ ] 템플릿 지원 (`.github/`의 이슈/PR 템플릿)
- [ ] GitHub Actions 상태 표시 (#2)
  - [ ] `GET /api/repos/{owner}/{repo}/actions/runs` — 워크플로우 실행 가져오기
  - [ ] 브랜치별 상태 배지 (통과/실패/대기)
  - [ ] 워크플로우 실행 목록 — 이름, 상태, 소요 시간, 트리거 이벤트
  - [ ] 클릭하여 확장 — 작업 단계 및 로그
  - [ ] 워크플로우 재실행 버튼
- [ ] 양방향 동기화 (GitHub ↔ Gition) (#9)
  - [ ] 실시간 동기화를 위한 GitHub Webhooks 통합
  - [ ] Push 이벤트 → 서버에서 자동 풀
  - [ ] Issue/PR 이벤트 → 로컬 캐시 업데이트
  - [ ] 충돌 해결 전략 (서버 측 머지)
  - [ ] 저장소별 동기화 상태 표시기

### 📊 Graph View
- [ ] 커밋 그래프 시각화 (트리 구조)
  - [ ] SVG 기반 커밋 그래프 렌더러 (D3.js)
  - [ ] 브랜치별 고유 색상의 브랜치 레인
  - [ ] SHA, 메시지 미리보기, 작성자 아바타가 있는 커밋 노드
  - [ ] 날짜 그룹화가 있는 시간 축 (세로)
  - [ ] 가로 레이아웃 옵션 (토글)
- [ ] 브랜치 머지 시각화
  - [ ] 머지 커밋 감지 및 렌더링 (두 부모 엣지)
  - [ ] 브랜치 분기/머지 지점 하이라이트
  - [ ] 리베이스 감지 (선형 히스토리 표시기)
- [ ] 인터랙티브 노드 선택
  - [ ] 커밋 클릭 → 상세 패널 표시 (전체 메시지, 작성자, 날짜, 통계)
  - [ ] 호버 시 미리보기 툴팁
  - [ ] 다중 선택으로 범위 diff
  - [ ] 우클릭 컨텍스트 메뉴 (체크아웃, 체리픽, 리버트, 브랜치 생성)
- [ ] 그래프에서 Diff 뷰어
  - [ ] 커밋 클릭 → 모든 변경된 파일의 나란히 diff
  - [ ] 엣지 클릭 (커밋 사이) → 범위 diff
  - [ ] 줄 주석이 있는 구문 강조 diff
  - [ ] diff 내 파일 트리 (접을 수 있는 파일 목록)

### 🎨 UI/UX 개선
- [ ] 다크 모드 토글
  - [ ] 색상 토큰용 CSS 변수 (라이트/다크 테마)
  - [ ] Tailwind `dark:` 변형 지원
  - [ ] 사용자 선호도 저장 (localStorage + 시스템 선호도 감지)
  - [ ] 테마 전환 시 부드러운 전환 애니메이션
  - [ ] 테마 인식 구문 강조 (라이트/다크 highlight.js 테마)
- [ ] 반응형 모바일 레이아웃 개선
  - [ ] 접을 수 있는 사이드바 (모바일에서 햄버거 메뉴)
  - [ ] 패널 전환을 위한 스와이프 제스처
  - [ ] 터치 친화적 블록 편집 (더 큰 탭 타겟)
  - [ ] 모바일 최적화 파일 브라우저 (전체 화면 오버레이)
  - [ ] 반응형 커밋 히스토리 (컴팩트 카드 뷰)
- [ ] 키보드 단축키
  - [ ] 글로벌 단축키 시스템 (`useHotkeys` 훅)
  - [ ] `Ctrl+K` — 커맨드 팔레트 (페이지, 저장소, 브랜치, 명령 검색)
  - [ ] `Ctrl+S` — 현재 페이지 강제 저장
  - [ ] `Ctrl+/` — 사이드바 토글
  - [ ] `Ctrl+P` — 빠른 파일 검색
  - [ ] `Ctrl+Shift+P` — 커맨드 팔레트
  - [ ] `/` — 슬래시 커맨드 메뉴 열기 (에디터에서)
  - [ ] 단축키 치트시트 모달 (`?` 키)
- [ ] 커맨드 팔레트
  - [ ] 저장소, 브랜치, 페이지, 파일에 걸친 퍼지 검색
  - [ ] 최근 항목 섹션
  - [ ] 액션 명령 (페이지 생성, 브랜치 전환, 터미널 열기 등)
  - [ ] 키보드 전용 네비게이션

### 💻 웹 터미널
- [x] 터미널 서버 인프라 (`terminal/server.js`, 213줄)
  - Node.js + `node-pty` + `ws` WebSocket 서버
  - GitHub 토큰 인증
  - 경로 순회 방지
  - PTY 리사이즈 범위 검증
- [ ] 브랜치별 터미널 접속 (체크아웃 & 실행)
  - [ ] 터미널 열 때 저장소 워크스페이스로 자동 `cd`
  - [ ] 터미널 헤더에 브랜치 컨텍스트 표시기
  - [ ] 저장소당 다중 터미널 탭
  - [ ] 터미널 분할 뷰 (가로/세로)
- [ ] 스크립트 블록 → 클릭하면 터미널에서 실행
  - [ ] CodeBlock 컴포넌트에 "실행" 버튼
  - [ ] 코드 내용을 활성 터미널 세션으로 전송
  - [ ] 인라인 출력 캡처 및 표시 (코드 블록 아래)
  - [ ] 환경 변수 주입 (저장소별 설정)
- [ ] 실시간 출력 스트리밍 (xterm.js + WebSocket)
  - [ ] React에서 `xterm.js` 통합 (`@xterm/xterm` + `@xterm/addon-fit`)
  - [ ] 지수 백오프를 사용한 WebSocket 재연결
  - [ ] 터미널 버퍼 스크롤백 (설정 가능한 제한)
  - [ ] 터미널에서 복사/붙여넣기 지원
  - [ ] 터미널 출력 내 검색 (`@xterm/addon-search`)
- [ ] 녹화 기능 (≤5초: GIF, >5초: MP4)
  - [ ] 터미널 세션 녹화 시작/중지 컨트롤
  - [ ] `script` / `ttyrec` 형식을 통한 서버 측 녹화
  - [ ] 후처리: 짧은 녹화 → GIF (`gifencoder`), 긴 녹화 → MP4 (`ffmpeg`)
  - [ ] 재생 뷰어 (페이지에 블록으로 임베드)
  - [ ] URL을 통한 녹화 공유

### 🧱 블록
- [ ] 파이프라인 블록 실행
  - [ ] `PipelineBlock.tsx`를 실제 CI/CD 백엔드에 연결
  - [ ] 실시간 로그 스트리밍이 있는 단계별 실행
  - [ ] 단계 상태 전환 (대기 → 실행 중 → 성공/실패)
  - [ ] 실패한 개별 단계 재시도
  - [ ] 파이프라인 실행 이력

### ⚡ 실시간 기능
- [ ] 실시간 문서 편집
  - [ ] WebSocket 기반 운영 변환 (OT) 또는 CRDT 엔진
  - [ ] 사용자 간 커서 위치 브로드캐스팅
  - [ ] 충돌 없는 동시 블록 편집
  - [ ] 사용자별 색상의 변경 하이라이팅
  - [ ] 사용자 귀속이 있는 편집 이력
- [ ] 접속자 표시 (누가 보고 있는지)
  - [ ] 페이지 헤더에 사용자 아바타 스택 (현재 보고 있는 사용자)
  - [ ] 사용자별 색상 커서 표시기
  - [ ] "사용자 X가 편집 중..." 타이핑 표시기
  - [ ] 활성 페이지 추적 (`/api/presence/{page_id}`)
- [ ] 코드 블록 댓글
  - [ ] 모든 블록에 인라인 댓글 스레드
  - [ ] `Comments` 테이블 (id, block_id, user_id, content, parent_comment_id, created_at)
  - [ ] 댓글 스레드 해결/미해결
  - [ ] 사용자 자동완성이 있는 `@멘션` 지원
  - [ ] 멘션 시 이메일/알림

### 🚀 CI/CD
- [x] GitLab CI/CD 파이프라인 (`.gitlab-ci.example.yml`)
  - Path 기반 Docker 빌드 (frontend/backend)
  - 수동 배포 트리거
- [ ] 커스텀 파이프라인 설정
  - [ ] Gition UI에서 파이프라인 YAML 에디터
  - [ ] 단계 정의: 이름, 이미지, 명령어, 환경, 의존성
  - [ ] 파이프라인 템플릿 라이브러리 (Node.js, Python, Docker 등)
  - [ ] `Pipelines` 테이블 활성화 (현재 스키마만 존재)
  - [ ] 검증 및 드라이런
- [ ] 파이프라인 실행 로그
  - [ ] 실시간 로그 스트리밍 (WebSocket)
  - [ ] 단계 수준 로그 격리
  - [ ] 로그 검색 및 필터링
  - [ ] 로그 뷰어에서 ANSI 색상 렌더링
  - [ ] 로그 다운로드 (원시 텍스트)
- [ ] 배포 상태 추적
  - [ ] 배포 환경 (dev/staging/prod)
  - [ ] 롤백 기능이 있는 배포 이력
  - [ ] 헬스 체크 통합 (HTTP 프로브)
  - [ ] 배포 승인 게이트 (수동 승인 단계)

### ☸️ Kubernetes

#### 🏗️ 기본 설정
- [ ] Docker Compose 개발 환경
  - [ ] `docker-compose.dev.yml` — frontend (핫 리로드) + backend + MySQL + terminal
  - [ ] 실시간 코드 편집을 위한 볼륨 마운트
  - [ ] 환경 변수 관리 (`.env.example`)
  - [ ] 모든 서비스의 헬스 체크 정의
- [ ] 기본 Kubernetes 매니페스트 (Deployment, Service)
  - [ ] `k8s/base/` — Kustomize 기본 매니페스트
  - [ ] Frontend Deployment + Service (ClusterIP)
  - [ ] Backend Deployment + Service (ClusterIP)
  - [ ] MySQL Deployment + Service + PVC
  - [ ] Terminal 서버 Deployment + Service
  - [ ] 애플리케이션 설정을 위한 ConfigMap
  - [ ] 데이터베이스 자격증명, GitHub OAuth 시크릿용 Secret
- [ ] 단일 네임스페이스 배포
  - [ ] 리소스 쿼터가 있는 `gition` 네임스페이스
  - [ ] 네트워크 정책 (frontend → backend, backend → MySQL)
  - [ ] `kubectl apply -k k8s/base/` 배포 스크립트

#### 🏗️ 인프라 (확장)
- [ ] Helm 차트 구조 (`k8s/charts/gition/`)
  - [ ] `Chart.yaml`, `values.yaml`, `values-dev.yaml`, `values-prod.yaml`
  - [ ] 템플릿: deployment, service, ingress, configmap, secret, hpa, pdb
  - [ ] MySQL 서브차트 (Bitnami MySQL 차트 의존성)
  - [ ] `helm install gition ./k8s/charts/gition/ -f values-prod.yaml`
- [ ] 네임스페이스 설정 (dev/staging/prod)
  - [ ] 환경별 리소스 쿼터 (CPU/메모리 제한)
  - [ ] 환경별 분리된 데이터베이스 인스턴스
  - [ ] 환경별 인그레스 도메인
- [ ] TLS 포함 Ingress (cert-manager)
  - [ ] Nginx Ingress Controller 설정
  - [ ] Let's Encrypt용 `ClusterIssuer` (스테이징 + 프로덕션)
  - [ ] 자동 TLS 인증서 프로비저닝
  - [ ] 도메인 라우팅: `app.gition.dev` → frontend, `api.gition.dev` → backend

#### ⚙️ 워크로드
- [ ] Frontend Deployment (replicas: 2+)
  - [ ] 멀티 스테이지 Dockerfile (빌드 → Nginx 서빙)
  - [ ] Liveness/Readiness 프로브 (`/health`)
  - [ ] 리소스 requests/limits (128Mi-256Mi RAM, 100m-200m CPU)
  - [ ] Pod Disruption Budget (minAvailable: 1)
- [ ] API Deployment (replicas: 3+)
  - [ ] Gunicorn/Uvicorn 워커 설정
  - [ ] Liveness 프로브 (`/health`) + Readiness 프로브 (`/api/auth/verify`)
  - [ ] 리소스 requests/limits (256Mi-512Mi RAM, 200m-500m CPU)
  - [ ] 그레이스풀 셧다운 처리 (SIGTERM)
  - [ ] Pod 어피니티/안티어피니티 규칙
- [ ] MySQL StatefulSet (Primary-Replica)
  - [ ] Primary-Replica 토폴로지 (1 primary + N replicas)
  - [ ] Pod별 PVC (재시작 간 데이터 지속)
  - [ ] 자동 백업 CronJob (mysqldump → S3/GCS)
  - [ ] 복제 지연 모니터링
  - [ ] ProxySQL 또는 MySQL Router를 통한 커넥션 풀링

#### 💾 스토리지
- [ ] Multi-PVC 샤딩 전략
  - [ ] PVC 간 저장소 워크스페이스 분배
  - [ ] 저장소 → PVC 할당을 위한 일관된 해싱
  - [ ] 새 PVC 추가 시 리밸런싱 전략
- [ ] Hash 기반 워크스페이스 라우팅
  - [ ] `hash(user_id, repo_name) % shard_count` → PVC 인덱스
  - [ ] Git 작업 전 PVC 경로 해석을 위한 API 미들웨어
  - [ ] Redis/ConfigMap에 PVC 매핑 캐시
- [ ] 샤드별 PVC (`repos-pvc-1`, `repos-pvc-2`, ...)
  - [ ] StorageClass: SSD 기반 (`gp3` / `pd-ssd`)
  - [ ] 크기 제한이 있는 동적 프로비저닝
  - [ ] 모니터링: 80% 용량에서 PVC 사용량 알림

#### 📈 스케일링
- [ ] Frontend HPA (CPU 70%)
  - [ ] `HorizontalPodAutoscaler` — 최소 2, 최대 10 레플리카
  - [ ] 스케일 다운 안정화 윈도우 (300s)
- [ ] API HPA (CPU 70%, Memory 80%)
  - [ ] `HorizontalPodAutoscaler` — 최소 3, 최대 20 레플리카
  - [ ] 커스텀 메트릭: 활성 WebSocket 연결, Git 작업 큐 깊이
  - [ ] Vertical Pod Autoscaler (VPA) — 적정 크기 설정

#### 🔄 GitOps
- [ ] ArgoCD 애플리케이션 설정
  - [ ] `argocd/application.yaml` — Gition 앱 정의
  - [ ] `main` 브랜치 `k8s/` 디렉토리에서 자동 동기화
  - [ ] 동기화 웨이브 (인프라 → 데이터베이스 → 백엔드 → 프론트엔드)
  - [ ] 헬스 체크 통합
- [ ] GitHub Actions → Registry → ArgoCD 파이프라인
  - [ ] `.github/workflows/ci.yml` — lint, test, build
  - [ ] `.github/workflows/cd.yml` — Docker 빌드 → GHCR/ECR에 푸시
  - [ ] 이미지 태그 전략: 추적성을 위한 `sha-{commit}`
  - [ ] 새 이미지 시 자동 배포를 위한 ArgoCD 이미지 업데이터

### 📚 Gition Docs (.gition/)
- [ ] `.gition/` 폴더 구조
  - [ ] `.gition/pages/` — 내보낸 페이지 마크다운 파일
  - [ ] `.gition/config.json` — 워크스페이스 설정
  - [ ] `.gition/templates/` — 페이지 템플릿
  - [ ] `.gition/`을 `.gitignore`에 자동 추가 (또는 선택적으로 커밋)
- [ ] Docs API (`/api/docs/{repo}/*`)
  - [ ] `GET /api/docs/{user_id}/{repo_name}/` — 모든 문서 목록
  - [ ] `GET /api/docs/{user_id}/{repo_name}/{path}` — 문서 읽기
  - [ ] `PUT /api/docs/{user_id}/{repo_name}/{path}` — 문서 쓰기
  - [ ] `DELETE /api/docs/{user_id}/{repo_name}/{path}` — 문서 삭제
- [ ] Block → Markdown 변환
  - [ ] 직렬화기: Block JSON → Markdown 문자열
  - [ ] 파서: Markdown 문자열 → Block JSON
  - [ ] 왕복 충실도 테스트
  - [ ] 페이지를 `.md` 파일로 내보내기
- [ ] .gitignore 연동
  - [ ] `.gition/`이 `.gitignore`에 있는지 자동 확인
  - [ ] 없으면 사용자에게 추가 프롬프트
  - [ ] 공유 문서화를 위한 `.gition/` 커밋 옵션

### 🕸️ Graph View (확장)
- [ ] `[[link]]` 문법 파서
  - [ ] 블록 내용에서 `[[페이지이름]]` 참조를 위한 정규식 파서
  - [ ] `[[` 입력 시 자동완성 드롭다운
  - [ ] 링크 해석 (페이지 이름 → 페이지 ID)
  - [ ] 깨진 링크 감지 및 경고
- [ ] `doc_links` 테이블 스키마
  - [ ] `DocLinks` (id, source_page_id, target_page_id, source_block_id, link_text, created_at)
  - [ ] 트리거: 페이지 저장 시 링크 업데이트
  - [ ] 페이지 삭제 시 연쇄 삭제
- [ ] Link API (`/api/links/*`)
  - [ ] `GET /api/links/{page_id}/outgoing` — 이 페이지가 링크하는 페이지들
  - [ ] `GET /api/links/{page_id}/incoming` — 이 페이지를 링크하는 페이지들 (백링크)
  - [ ] `GET /api/links/graph/{repo_id}` — 저장소의 전체 링크 그래프
- [ ] D3.js 그래프 시각화
  - [ ] 페이지 노드와 링크 엣지의 힘 기반 레이아웃
  - [ ] 링크 수에 비례하는 노드 크기
  - [ ] 브랜치 또는 태그별 클러스터
  - [ ] 미니맵이 있는 줌/팬
  - [ ] 노드 검색 및 하이라이트
- [ ] Backlinks 지원
  - [ ] 각 페이지 하단의 "링크된 참조" 섹션
  - [ ] 링크 컨텍스트의 미리보기 스니펫
  - [ ] 소스 페이지로 이동 클릭

---

## v0.3 - 엔터프라이즈 & 스케일 🟣 (향후)

### 🏢 다중 사용자 & 팀
- [ ] 조직 지원 (GitHub org → Gition 팀)
- [ ] 역할 기반 접근 제어 (소유자, 관리자, 멤버, 뷰어)
- [ ] 권한 상속이 있는 공유 워크스페이스
- [ ] 팀 활동 피드

### 🔌 플러그인 시스템
- [ ] 커스텀 블록 타입 SDK
- [ ] 플러그인 마켓플레이스
- [ ] 서드파티 통합 프레임워크 (Slack, Jira, Linear 등)

### 📱 데스크톱 & 모바일
- [ ] Electron 데스크톱 앱 (오프라인 지원)
- [ ] 모바일 접근을 위한 PWA
- [ ] 재연결 시 동기화가 가능한 오프라인 페이지 편집

### 🌐 셀프 호스팅
- [ ] 원클릭 배포 (DigitalOcean, Railway, Render)
- [ ] 셀프 호스팅 Kubernetes용 Helm 차트
- [ ] 관리자 패널 (사용자 관리, 시스템 설정, 백업/복원)

### 📈 분석
- [ ] 저장소 활동 대시보드
- [ ] 기여 히트맵
- [ ] 페이지 조회 분석
- [ ] API 사용량 메트릭

---

## 범례
- ✅ 완료된 마일스톤
- 🟡 진행 중
- 🔵 계획된 마일스톤
- 🟣 향후 마일스톤
- [x] 완료된 작업
- [ ] 대기 중인 작업
