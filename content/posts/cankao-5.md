---
title: "参考 :"
date: 2023-07-20
description: "https://www.bbsmax.com/A/QW5YkQoOzm/"
categories: ["PostgreSQL 笔记"]
tags: ["参数配置", "备份恢复", "流复制"]
series: []
---

https://www.bbsmax.com/A/QW5YkQoOzm/

# 参数检查
```bash
listen_addresses = '*'
port =
log_destination = 'csvlog'
logging_collector = on
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
max_connections =
max_connections =
max_connections = hot_standby
```

# 主库创建账号 (在主库操作)
```bash
$ psql -p  -U postgres postgres
psql (9.6.)
Type "help" for help.
postgres=# CREATE DATABASE pocdb;
CREATE DATABASE
postgres=# \c pocdb
You are now connected to database "pocdb" as user "postgres".
pocdb=#
pocdb=# CREATE USER repl ENCRYPTED PASSWORD '' REPLICATION;
CREATE ROLE
```

# 修改配置文件 pg_hba. conf
```bash
host    replication     repl     192.168.1.61/                 md5
host    replication     repl     192.168.1.62/                 md5
```

# 创建同步备库 (在备库上操作)
```bash
pg_basebackup -h 192.168.1.61 -U repl -W -Fp -Pv -Xs -R -D /postgres/pgdata
```

/pgsql/{soft, app, data, backup, log, archive, rman_backup}
