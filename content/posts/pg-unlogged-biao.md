---
title: "PG unlogged 表"
date: 2023-07-26
description: "```sql"
categories: ["PostgreSQL 培训"]
tags: ["VACUUM", "WAL", "流复制", "统计信息", "逻辑复制"]
series: []
---

```sql
[pgsql@mysql01 pgsql]$ psql test
psql (14.5)
Type "help" for help.

test=# \q
[pgsql@mysql01 pgsql]$ psql 
psql (14.5)
Type "help" for help.

test=# create unlogged table test_unlogged (id int);
CREATE TABLE
test=# insert into test_unlogged values(1),(2);
INSERT 0 2
test=# select * from test_unlogged ;
 id 
----
  1
  2
(2 rows)

test=# \q
[pgsql@mysql01 pgsql]$ pg_ctl restart
waiting for server to shut down.... done
server stopped
waiting for server to start....2023-07-26 10:42:43 CST [64142]: LOG:  redirecting log output to logging collector process
2023-07-26 10:42:43 CST [64142]: HINT:  Future log output will appear in directory "log".
 done
server started
[pgsql@mysql01 pgsql]$ psql 
psql (14.5)
Type "help" for help.

test=# select * from test_unlogged ;
 id 
----
  1
  2
(2 rows)

test=# 
test=# \q
[pgsql@mysql01 pgsql]$ ps  -ef | grep post
pgsql      5778   5729  0 Jul25 pts/59   00:00:00 /usr/local/pgsql/bin/postmaster -p 5433 -D ./data_slave/
pgsql      5779   5778  0 Jul25 ?        00:00:00 postgres: logger 
pgsql      5780   5778  0 Jul25 ?        00:00:00 postgres: startup recovering 0000000100000000000000F4
pgsql      5781   5778  0 Jul25 ?        00:00:00 postgres: checkpointer 
pgsql      5782   5778  0 Jul25 ?        00:00:00 postgres: background writer 
pgsql      5783   5778  0 Jul25 ?        00:00:00 postgres: stats collector 
pgsql     64142      0  0 10:42 ?        00:00:00 /usr/local/pgsql/bin/postgres
pgsql     64143  64142  0 10:42 ?        00:00:00 postgres: logger 
pgsql     64145  64142  0 10:42 ?        00:00:00 postgres: checkpointer 
pgsql     64146  64142  0 10:42 ?        00:00:00 postgres: background writer 
pgsql     64147  64142  0 10:42 ?        00:00:00 postgres: walwriter 
pgsql     64148  64142  0 10:42 ?        00:00:00 postgres: autovacuum launcher
pgsql     64149  64142  0 10:42 ?        00:00:00 postgres: stats collector 
pgsql     64150  64142  0 10:42 ?        00:00:00 postgres: logical replication launcher
pgsql     64157   5778  0 10:42 ?        00:00:00 postgres: walreceiver streaming 0/F4030E10
pgsql     64158  64142  0 10:42 ?        00:00:00 postgres: walsender repl [local] streaming 0/F4030E10
pgsql     64326  54742  0 10:45 pts/60   00:00:00 grep --color=auto post
[pgsql@mysql01 pgsql]$ pg_ctl stop -m fast -D /usr/local/pgsql/data_slave/
waiting for server to shut down.... done
server stopped
[pgsql@mysql01 pgsql]$ ps  -ef | grep post                                
pgsql     64142      0  0 10:42 ?        00:00:00 /usr/local/pgsql/bin/postgres
pgsql     64143  64142  0 10:42 ?        00:00:00 postgres: logger 
pgsql     64145  64142  0 10:42 ?        00:00:00 postgres: checkpointer 
pgsql     64146  64142  0 10:42 ?        00:00:00 postgres: background writer 
pgsql     64147  64142  0 10:42 ?        00:00:00 postgres: walwriter 
pgsql     64148  64142  0 10:42 ?        00:00:00 postgres: autovacuum launcher
pgsql     64149  64142  0 10:42 ?        00:00:00 postgres: stats collector 
pgsql     64150  64142  0 10:42 ?        00:00:00 postgres: logical replication launcher
pgsql     64352  54742  0 10:46 pts/60   00:00:00 grep --color=auto post
[pgsql@mysql01 pgsql]$ kill -9 64142
[pgsql@mysql01 pgsql]$ ps  -ef | grep post
pgsql     64367  54742  0 10:46 pts/60   00:00:00 grep --color=auto post
[pgsql@mysql01 pgsql]$ pg_ctl start
pg_ctl: another server might be running; trying to start server anyway
waiting for server to start....2023-07-26 10:46:36 CST [64372]: LOG:  redirecting log output to logging collector process
2023-07-26 10:46:36 CST [64372]: HINT:  Future log output will appear in directory "log".
 done
server started
[pgsql@mysql01 pgsql]$ psql 
psql (14.5)
Type "help" for help.

test=# select * from test_unlogged ;
 id 
----
(0 rows)

test=# 
```