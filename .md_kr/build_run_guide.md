# 빌드 및 실행 가이드 (Build & Run Guide)

이 문서는 `gition` 프로젝트의 프론트엔드와 백엔드를 빌드하고 실행하는 방법을 설명함.

## 1. 전체 실행 (Docker Compose 권장)

가장 간편하게 프로젝트 전체(Frontend, Backend, Database)를 실행하는 방법임.

### 실행 방법
프로젝트 루트 디렉토리에서 아래 명령어를 실행함.

```bash
docker-compose up --build
```

- **Frontend**: `http://localhost:80` (또는 `http://localhost`) 접속
- **Backend**: `http://localhost:3001` (프론트엔드를 통해 내부적으로 통신)
- **Database**: `3306` 포트

### 종료 방법
```bash
docker-compose down
```

---

## 2. Backend 개별 실행 (Python/FastAPI)

백엔드만 별도로 개발하거나 실행할 때의 방법임.
*(사전 요구사항: Python 3.10+ 설치, MySQL 데이터베이스 실행 중)*

### 환경 설정 및 실행
1. **backend 디렉토리로 이동**
   ```bash
   cd backend
   ```

2. **가상환경 생성 및 활성화**
   ```bash
   # 가상환경 생성
   python -m venv venv

   # 가상환경 활성화 (Windows)
   venv\Scripts\activate

   # 가상환경 활성화 (Mac/Linux)
   source venv/bin/activate
   ```

3. **의존성 패키지 설치**
   ```bash
   pip install -r requirements.txt
   ```

4. **서버 실행**
   ```bash
   # .env 파일이 프로젝트 루트에 있다면 로드되는지 확인 필요함.
   # 개발 모드(hot reload)로 실행
   uvicorn main:app --host 0.0.0.0 --port 3001 --reload
   ```

---

## 3. Frontend 개별 실행 (React/Vite)

프론트엔드만 별도로 개발하거나 실행할 때의 방법임.
*(사전 요구사항: Node.js 18+ 설치)*

### 실행 방법
1. **프로젝트 루트(또는 frontend 패키지가 있는 곳)에서 의존성 설치**
   ```bash
   npm install
   ```

2. **개발 서버 실행**
   ```bash
   npm run dev
   ```
   - 실행 주소: `http://localhost:5173`

> **주의사항 (개발 모드 API 통신)**:
> 프론트엔드 코드(`App.tsx` 등)는 API 요청을 `/api/...` 형태의 상대 경로로 보냄.
> `npm run dev`로 실행 시, 별도의 프록시 설정이 없다면 백엔드(3001 포트)로 요청이 전달되지 않아 API 호출이 실패할 수 있음.
> 
> 원활한 개발을 위해 **Docker Compose 실행**을 권장하거나, `vite.config.ts`에 백엔드 포트(3001)로의 프록시 설정을 추가해야 함.

### 프로덕션 빌드
배포를 위한 정적 파일을 생성함.

```bash
npm run build
```
- 빌드 결과물은 `dist/` 디렉토리에 생성됨.
- 생성된 파일은 Nginx나 기타 웹 서버를 통해 서빙할 수 있음.
