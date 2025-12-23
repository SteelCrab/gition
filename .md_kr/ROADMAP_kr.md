# Gition 로드맵

## v0.1 - 코어 플랫폼 🟡 (진행 중)

### 인증
- [x] GitHub OAuth 연동
- [x] 로그인/로그아웃 플로우
- [x] 토큰 저장 (localStorage)

### 저장소 관리
- [x] GitHub API에서 저장소 목록 조회
- [x] 서버에 저장소 클론
- [x] 브랜치 목록 조회 및 전환
- [x] 디렉토리 탐색 파일 브라우저

### 에디터
- [x] Notion 스타일 블록 에디터
- [ ] 코드 블록 신택스 하이라이팅
- [x] 텍스트 블록 인라인 편집
- [ ] 파이프라인 블록 실행
- [x] `.gition` 로컬 페이지 저장 (브랜치별, Git 무시)
- [ ] 마크다운 렌더링 (#8)

### Git 작업
- [x] 커밋 히스토리 뷰어
- [x] 파일 내용 뷰어/에디터
- [ ] 저장소 내 검색 (코드 검색)
- [ ] UI에서 커밋/푸시

### 연동
- [x] GitHub Issues 표시
- [x] Pull Requests 표시
- [ ] UI에서 Issue/PR 생성
- [ ] GitHub Actions 상태 표시 (#2)
- [ ] 양방향 동기화 (GitHub ↔ Gition) (#9)

### 웹 터미널
- [ ] 브랜치별 터미널 접속 (체크아웃 & 실행)
- [ ] 스크립트 블록 → 클릭하면 터미널에서 실행
- [ ] 실시간 출력 스트리밍 (xterm.js + WebSocket)

---

## v0.2 - 시각화 🔵

### Graph View
- [ ] 커밋 그래프 시각화 (트리 구조)
- [ ] 브랜치 머지 시각화
- [ ] 인터랙티브 노드 선택
- [ ] 그래프에서 Diff 뷰어

### UI/UX 개선
- [ ] 다크 모드 토글
- [ ] 반응형 모바일 레이아웃 개선
- [ ] 키보드 단축키

---

## v0.3 - 협업 🔵

### 실시간 기능
- [ ] 실시간 문서 편집
- [ ] 접속자 표시 (누가 보고 있는지)
- [ ] 코드 블록 댓글

### CI/CD
- [ ] 커스텀 파이프라인 설정
- [ ] 파이프라인 실행 로그
- [ ] 배포 상태 추적

---

## v1.0 - Kubernetes 배포 🔵

### 인프라
- [ ] Helm 차트 구조 (`k8s/charts/gition/`)
- [ ] 네임스페이스 설정 (dev/staging/prod)
- [ ] TLS 포함 Ingress (cert-manager)

### 워크로드
- [ ] Frontend Deployment (replicas: 2+)
- [ ] API Deployment (replicas: 3+)
- [ ] MySQL StatefulSet (Primary-Replica)

### 스토리지
- [ ] Multi-PVC 샤딩 전략
- [ ] Hash 기반 워크스페이스 라우팅
- [ ] 샤드별 PVC (`repos-pvc-1`, `repos-pvc-2`, ...)

### 스케일링
- [ ] Frontend HPA (CPU 70%)
- [ ] API HPA (CPU 70%, Memory 80%)

### GitOps
- [ ] ArgoCD 애플리케이션 설정
- [ ] GitHub Actions → Registry → ArgoCD 파이프라인

### Gition Docs (.gition/)
- [ ] `.gition/` 폴더 구조
- [ ] Docs API (`/api/docs/{repo}/*`)
- [ ] Block → Markdown 변환
- [ ] .gitignore 연동

### Graph View
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
