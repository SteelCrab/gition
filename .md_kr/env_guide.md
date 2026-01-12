# 환경 변수 설정 가이드 (Environment Operations)

이 문서는 `gition` 프로젝트의 백엔드와 데이터베이스 설정에 필요한 환경 변수(`.env`) 작성 방법을 설명함.

프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 아래의 변수들을 설정해야 함.

## 1. 기본 설정 (Required)

`.env` 파일에 반드시 포함되어야 하는 설정들임.

```ini
# --- GitHub OAuth 설정 ---
# GitHub Developer Settings > OAuth Apps에서 생성한 Client ID와 Secret을 입력.
# 또한, 'Authorization callback URL'에 'FRONTEND_URL/auth/github/callback'을 추가해야 함.
# 예: http://localhost
# 예: http://localhost/auth/github/callback
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# --- 데이터베이스 연결 설정 ---
# MySQL 데이터베이스 접속 정보임.
# Docker Compose 사용 시 서비스명인 'mysql'을 호스트로 사용함.
MYSQL_USER=user
MYSQL_PASSWORD=password
MYSQL_DATABASE=password
MYSQL_PORT=3306

# MySQL Connection Pool을 위한 호스트 설정 (Read/Write 분리 가능)
# 기본적으로 Docker Compose의 'mysql' 서비스를 바라봄.
MYSQL_READ_HOST=mysql
MYSQL_WRITE_HOST=mysql
```

## 2. 선택적 설정 (Optional)

개발 환경이나 특정 요구사항에 따라 변경할 수 있는 설정들임.

```ini
# --- 애플리케이션 설정 ---
# 클론된 리포지토리가 저장될 경로 (기본값: /repos)
REPOS_PATH=/repos

# 인증 후 리다이렉트될 프론트엔드 URL (기본값: http://localhost)
# 배포 환경에서는 실제 도메인 주소로 변경해야 함.
FRONTEND_URL=http://localhost

# CORS 허용 오리진 (콤마로 구분)
# 프론트엔드 개발 서버 주소를 포함해야 함.
ALLOWED_ORIGINS=http://localhost,http://localhost:80,http://localhost:5173
```

## 3. Docker Compose 전용 설정

`docker-compose.yml` 파일에서 MySQL 컨테이너 초기화에 사용되는 변수임. `.env` 파일에 함께 정의하면 자동으로 적용됨.

```ini
# MySQL 초기 루트 비밀번호 (보안상 변경 권장)
MYSQL_ROOT_PASSWORD=your_root_password
```

## .env 파일 예시 (종합)

```ini
GITHUB_CLIENT_ID=Ov23liz...
GITHUB_CLIENT_SECRET=8e0a...
MYSQL_USER=user
MYSQL_PASSWORD=password
MYSQL_DATABASE=password
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_READ_HOST=mysql
MYSQL_WRITE_HOST=mysql
FRONTEND_URL=http://localhost
ALLOWED_ORIGINS=http://localhost,http://localhost:5173
```
