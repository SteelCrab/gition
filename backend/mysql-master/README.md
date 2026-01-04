# MySQL Master (Docker Compose)

## 📌 개요
VM에서 Docker Compose로 실행되는 MySQL Master (쓰기 전용)

## 📁 구조
```
mysql-master/
├── docker-compose.yml
├── .env.example      # 환경변수 템플릿
├── config/
│   └── my.cnf        # MySQL 설정 (GTID 복제)
└── initdb.d/
    └── init.sql      # 초기 계정 생성
```

## ⚙️ 설정
```bash
# 1. 환경변수 파일 복사 및 수정
cp .env.example .env
vim .env

# 2. 데이터 디렉토리 생성
mkdir -p data logs
sudo chown -R 999:999 data logs

# 3. 컨테이너 실행
docker compose up -d
```

## ✅ 확인
```bash
docker exec -it mysql-master mysql -u root -p -e "SELECT user FROM mysql.user;"
```
