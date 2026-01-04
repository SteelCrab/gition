-- 일반 사용자 계정 생성
CREATE USER 'pista'@'%' IDENTIFIED WITH mysql_native_password BY '${MYSQL_USER_PASSWORD}';
GRANT ALL PRIVILEGES ON *.* TO 'pista'@'%' WITH GRANT OPTION;

-- 복제용 계정 생성
CREATE USER 'repl_pista'@'%' IDENTIFIED WITH mysql_native_password BY '${MYSQL_REPL_PASSWORD}';
GRANT REPLICATION SLAVE ON *.* TO 'repl_pista'@'%';

FLUSH PRIVILEGES;
