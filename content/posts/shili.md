---
title: "实例"
date: 2023-06-29
description: "@[toc]"
categories: ["PostgreSQL 笔记"]
tags: ["格式转换"]
series: []
---

@[toc]
> 在遇到人眼无法识别的乱码情况下比较有用
# 实例
```sql
drop table if exists t;

create table t (info text);

insert into t values('hello '),('hello');

select encode('hello','hex') , info, encode(info::bytea,'hex') from t;

```
# 演示
```sql
lxm=# drop table if exists t;
DROP TABLE
lxm=#
lxm=# create table t (info text);
CREATE TABLE
lxm=#
lxm=# insert into t values('hello '),('hello');
INSERT 0 2
lxm=#
lxm=# select encode('hello','hex') , info, encode(info::bytea,'hex') from t;
   encode   |  info  |    encode
------------+--------+--------------
 68656c6c6f | hello  | 68656c6c6f20
 68656c6c6f | hello  | 68656c6c6f
(2 rows)
```