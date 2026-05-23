---
title: "作用:"
date: 2024-08-30
description: "决定 pg_stat_activity.query 的长度"
categories: ["PostgreSQL 运维"]
tags: ["安装部署", "索引"]
series: []
---

决定 pg_stat_activity.query 的长度

>  期望能控制 pg_stat_statements.query 的长度, 实际测试并不能影响其长度


```sql
test=# select * from pg_settings where  name='track_activity_query_size';
-[ RECORD 1 ]---+-------------------------------------------------------------
name            | track_activity_query_size
setting         | 1024
unit            | B
category        | Statistics / Query and Index Statistics Collector
short_desc      | Sets the size reserved for pg_stat_activity.query, in bytes.
extra_desc      |
context         | postmaster
vartype         | integer
source          | default
min_val         | 100
max_val         | 1048576
enumvals        |
boot_val        | 1024
reset_val       | 1024
sourcefile      |
sourceline      |
pending_restart | f

test=# alter system set track_activity_query_size to '10';
ERROR:  10 B is outside the valid range for parameter "track_activity_query_size" (100 .. 1048576)
test=# alter system set track_activity_query_size to '100';
ALTER SYSTEM

test=# \q
postgres@d8b3cfb2eab2:~/14/pgdata$ pg_ctl restart
waiting for server to shut down.... done
server stopped
waiting for server to start....2023-12-30 10:48:38.794 UTC [135] LOG:  redirecting log output to logging collector process
2023-12-30 10:48:38.794 UTC [135] HINT:  Future log output will appear in directory "log".
 done
server started
postgres@d8b3cfb2eab2:~/14/pgdata$ psql
psql (14.10 (Debian 14.10-1.pgdg110+1))
Type "help" for help.

postgres=# show track_activity_query_size ;
 track_activity_query_size
---------------------------
 100B
(1 row)
```
提前安装了 pg_stat_statements 插件

# 会话 1

````sql
create table test(id bigserial primary key, name text);

test=# begin;
BEGIN
test=*# insert into test (name ) values('name'),('name'),('name'),('name'),('name'),('name'),('name'),('name'),('name'),('name'),('name'),('name'),('name'),('name'),('name'),('name'),('name'),('name'),('name'),('name'),('name'),('name'),('name'),('name'),('name');
INSERT 0 25

````

# 会话 2

```sql
postgres=# select length(query) , * from pg_stat_activity where query like 'insert%';
-[ RECORD 1 ]----+----------------------------------------------------------------------------------------------------
length           | 99
datid            | 16384
datname          | test
pid              | 148
leader_pid       |
usesysid         | 10
usename          | postgres
application_name | psql
client_addr      |
client_hostname  |
client_port      | -1
backend_start    | 2023-12-30 10:48:59.788431+00
xact_start       | 2023-12-30 10:55:39.935999+00
query_start      | 2023-12-30 10:55:44.180545+00
state_change     | 2023-12-30 10:55:44.181013+00
wait_event_type  | Client
wait_event       | ClientRead
state            | idle in transaction
backend_xid      | 741
backend_xmin     |
query_id         | -4687908949149066856
query            | insert into test (name ) values('name'),('name'),('name'),('name'),('name'),('name'),('name'),('nam
backend_type     | client backend
```

# 会话 1

```sql
test=# \x
Expanded display is on.
test=# select length(query),query from pg_stat_statements where query like 'insert%';
-[ RECORD 1 ]-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
length | 171
query  | insert into test (name ) values($1),($2),($3),($4),($5),($6),($7),($8),($9),($10),($11),($12),($13),($14),($15),($16),($17),($18),($19),($20),($21),($22),($23),($24),($25)
```

> 可以看到 即使修改了 track_activity_query_size 并不会影响到 pg_stat_statements.query 的长度