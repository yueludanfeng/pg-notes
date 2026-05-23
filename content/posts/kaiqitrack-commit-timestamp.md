---
title: "开启`track_commit_timestamp`"
date: 2023-09-10
description: "```sql"
categories: ["PostgreSQL 笔记"]
tags: ["PostgreSQL"]
series: []
---

[PostgreSQL | 查LAST DDL TIME，PG的三种方法 - 墨天轮 (modb.pro)](https://www.modb.pro/db/48190)

# 开启`track_commit_timestamp`
```sql
postgres=# create table t(id numeric);  
CREATE TABLE  
postgres=# select pg_xact_commit_timestamp(xmin), oid, relname from pg_class where relname ='t';  
   pg_xact_commit_timestamp    |  oid  | relname   
-------------------------------+-------+---------  
 2021-03-02 04:24:35.582231+08 | 16428 | t  
(1 row)
```

