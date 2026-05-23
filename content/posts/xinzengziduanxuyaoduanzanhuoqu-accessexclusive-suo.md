---
title: "新增字段需要短暂获取 AccessExclusive 锁"
date: 2023-07-26
description: "https://mp.weixin.qq.com/s/_pGDRgR56wE5678m_raNaw"
categories: ["PostgreSQL 培训"]
tags: ["锁"]
series: []
---

https://mp.weixin.qq.com/s/_pGDRgR56wE5678m_raNaw

```bash
加列操作属于 DDL，因此也要获取 8 级锁，从 11 版本以后，添加字段就变得 easy 多了，**新增带默认值的字段可以不用重写表**，通过 pg_attribute 中的 atthasmissing 和 attmissingval 来标识，当然也需要分情况：

- 新增的默认值假如是一个常量，不需要重写，比如 alter table test add column info text default 'hello' not null;
    
- 新增的默认值假如是 stable 或者 immutable 类型的函数，不需要重写表，比如 alter table test add column t_time timestamp default now() not null;
    
- 新增的默认值假如是 volatile 类型的函数，需要重写表，比如 alter table test add column id int default random() not null;

```

# 新增字段需要短暂获取 AccessExclusive 锁

# session 1:
drop table if exists test cascade;
create table test (id int);

begin;
alter table test add name varchar default 'info';


#session2 :
```sql
test=# select * from pg_locks where relation = (select oid from pg_class where relname='test');
-[ RECORD 1 ]------+--------------------
locktype           | relation
database           | 16406
relation           | 16723
page               | 
tuple              | 
virtualxid         | 
transactionid      | 
classid            | 
objid              | 
objsubid           | 
virtualtransaction | 3/12
pid                | 64386
mode               | AccessExclusiveLock
granted            | t
fastpath           | f
waitstart          | 
```

# session 1:
drop table if exists test cascade;
create table test (id int);
begin;
alter table test add create_time timestamp default now ();

# session 2:
select * from pg_locks where relation = (select oid from pg_class where relname='test');

```sql
test=# select * from pg_locks where relation = (select oid from pg_class where relname='test');
-[ RECORD 1 ]------+--------------------
locktype           | relation
database           | 16406
relation           | 16736
page               | 
tuple              | 
virtualxid         | 
transactionid      | 
classid            | 
objid              | 
objsubid           | 
virtualtransaction | 3/24
pid                | 78526
mode               | AccessExclusiveLock
granted            | t
fastpath           | f
waitstart          | 
```

#session1 :
drop table if exists test cascade;
create table test (id int);
begin;
alter table test add r_id int default random ();

select * from pg_locks where relation = (select oid from pg_class where relname='test');

```sql
test=# select * from pg_locks where relation = (select oid from pg_class where relname='test');
-[ RECORD 1 ]------+--------------------
locktype           | relation
database           | 16406
relation           | 16750
page               | 
tuple              | 
virtualxid         | 
transactionid      | 
classid            | 
objid              | 
objsubid           | 
virtualtransaction | 3/33
pid                | 78526
mode               | ShareLock
granted            | t
fastpath           | f
waitstart          | 
-[ RECORD 2 ]------+--------------------
locktype           | relation
database           | 16406
relation           | 16750
page               | 
tuple              | 
virtualxid         | 
transactionid      | 
classid            | 
objid              | 
objsubid           | 
virtualtransaction | 3/33
pid                | 78526
mode               | AccessExclusiveLock
granted            | t
fastpath           | f
waitstart          | 
```