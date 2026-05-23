---
title: "对于 cache lookup failed for relation 49197 这个报错"
date: 2023-07-15
description: "```sql"
categories: ["PostgreSQL 笔记"]
tags: ["PostgreSQL"]
series: []
---

[PostgreSQL运维案例：建表报错，提示type already exists - 墨天轮 (modb.pro)](https://www.modb.pro/db/658272)

# 对于 cache lookup failed for relation 49197 这个报错
```sql
postgres=# select * from pg_depend where refobjid ='49197';
 classid | objid | objsubid | refclassid | refobjid | refobjsubid | deptype 
---------+-------+----------+------------+----------+-------------+---------
    1247 | 49199 |        0 |       1259 |    49197 |           0 | i
(1 row)
postgres=# delete from pg_depend where refobjid ='49197';

postgres=# drop type xxx;

```