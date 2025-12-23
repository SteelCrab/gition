# Gition

> Git + Notion = **Gition**  
> 개발자를 위한 올인원 협업 플랫폼

Git 저장소, 블록 기반 문서, CI/CD를 하나로 통합한 오픈소스 개발 플랫폼

![Gition 목업](../docs/images/mockup.png)

<div style="display: flex; gap: 10px;">
  <img src="../docs/images/mockup_branch.png" width="48%" />
  <img src="../docs/images/mockup_ci.png" width="48%" />
</div>

## Why Gition?

개발자는 **코드 작성 → 문서화 → 배포**를 위해 여러 도구를 오가며 컨텍스트 스위칭을 겪습니다.  
Gition은 이 모든 것을 **하나의 플랫폼**에서 해결합니다.

| 문제 | 기존 방식 | Gition |
|------|----------|--------|
| 코드와 문서가 분리됨 | GitHub + Notion 별도 사용 | 하나의 워크스페이스 |
| 문서 버전 관리 어려움 | 수동 백업 또는 없음 | Git 기반 자동 버전 관리 |
| CI/CD 상태 확인 | 탭 전환 필요 | 문서 내 실시간 표시 |

## 기능

### ✅ 구현 완료

| 카테고리 | 기능 |
|----------|------|
| **인증** | GitHub OAuth 2.0, 세션 관리 |
| **저장소** | 전체 레포 목록, 클론, 필터 (Public/Private), 상태 추적 |
| **파일 브라우저** | 디렉토리 탐색, 파일 트리, 크기 표시, 타입 아이콘 |
| **에디터** | 다크 테마 (VS Code 스타일), 바이너리 파일 감지 |
| **브랜치** | 전체 브랜치 보기, 브랜치 전환, 현재 브랜치 표시 |
| **커밋** | 히스토리 보기, SHA/작성자/날짜, 추가/삭제 통계 |
| **검색** | 파일명 검색, 내용 검색, 하이라이트 결과 |
| **Issues & PRs** | 오픈 이슈/PR 보기, 라벨, 브랜치 정보 |
| **Pages** | `.gition` 로컬 저장, 브랜치별 페이지, Git 무시 |

### 🔜 예정

- [ ] 마크다운 렌더링 (#8)
- [ ] 이슈 생성/수정
- [ ] Pull Request 생성
- [ ] GitHub Actions 상태 표시 (#2)
- [ ] 양방향 동기화 (GitHub ↔ Gition) (#9)
- [ ] 웹 터미널 (브랜치별 터미널 접속)
- [ ] 스크립트 블록 클릭 → 터미널 실행

## 로드맵

상세 진행 상황은 [ROADMAP_kr.md](ROADMAP_kr.md)를 참고하세요.

### 마일스톤 진행률

| 마일스톤 | 상태 | 진행률 |
|----------|------|--------|
| **v0.1** | 🔄 진행 중 | ████████░░░░ 70% |
| **v0.2** | ⏳ 계획됨 | ░░░░░░░░░░░░ 0% |
| **v0.3** | ⏳ 계획됨 | ░░░░░░░░░░░░ 0% |

## 기술 스택

### MVP (현재)

| 레이어 | 기술 |
|--------|------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Python FastAPI + GitPython |
| Database | MySQL |
| Auth | GitHub OAuth 2.0 |
| Infra | Docker Compose + Nginx |

### Production (예정)

| 레이어 | 기술 |
|--------|------|
| Backend | Rust (Axum) + Python (FastAPI) |
| Git Engine | gitoxide / libgit2 |
| Infra | Kubernetes + Helm + ArgoCD |

## 빠른 시작

### 사전 요구사항

- Docker & Docker Compose
- GitHub OAuth App

### 1. GitHub OAuth 설정

1. GitHub Settings → Developer settings → OAuth Apps → New
2. 설정:
   - **Homepage URL**: `http://localhost`
   - **Callback URL**: `http://localhost/api/auth/github/callback`
3. Client ID & Secret 복사

### 2. 환경 변수

```bash
# .env
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
MYSQL_ROOT_PASSWORD=your_password
```

### 3. 실행

```bash
git clone https://github.com/your-username/gition.git
cd gition
docker-compose up --build -d
open http://localhost
```

## 기여하기

1. 이 저장소를 Fork
2. Feature 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 Push (`git push origin feature/amazing-feature`)
5. Pull Request 열기

## 라이선스

[MIT License](LICENSE)
