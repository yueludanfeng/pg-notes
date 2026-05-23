---
title: "简介"
date: 2023-06-29
description: "JSON 代表 JavaScript Object Notation。它是一种开放标准格式，将数据组织成 [RFC 7159](https://tools.ietf.org/html/rfc7159) 中详述的键/值对和数组"
categories: ["索引"]
tags: ["Docker", "执行计划", "索引"]
series: []
---

JSON 代表 JavaScript Object Notation。它是一种开放标准格式，将数据组织成 [RFC 7159](https://tools.ietf.org/html/rfc7159) 中详述的键/值对和数组

# 为什么要在PostgreSQL中存储JSON


1. #### 架构灵活性
   
    使用 JSON 格式存储数据的主要原因之一是架构灵活性。当架构不稳定且频繁更改时，将数据存储在 JSON 中非常有用。如果将每个键存储为列，则会导致频繁的 DML 操作 - 当您的数据集很大时，这可能很困难 - 例如，事件跟踪、分析、标签等。注意：如果文档中始终存在特定键，则将其存储为第一类列可能是有意义的。我们将在下面的“JSON 模式和反模式”部分中讨论有关此方法的更多信息。
    
2. #### 嵌套对象
   
    如果您的数据集具有嵌套对象（单级或多级），在某些情况下，在 JSON 中处理它们比将数据非规范化为列或多个表更容易。
    
3. #### 与外部数据源同步
   
    通常，外部系统以 JSON 形式提供数据，因此在将数据摄取到系统的其他部分之前，它可能是临时存储。例如，条纹交易。

# PostgreSQL 中对 JSON 支持的时间点
#### 1. PostgreSQL 9.2 （2012） 添加了对 JSON 数据类型的支持

#### 2. PostgreSQL 9.4 （2014） 添加了对 JSONB 数据类型的支持
JSONB 支持为 JSON 数据编制索引，并且在解析和查询 JSON 数据方面非常高效。在大多数情况下，当你在 PostgreSQL 中使用 JSON 时，你应该使用 JSONB。

#### 3. PostgreSQL 12（2019 年）增加了对 SQL/JSON 标准和 JSONPATH 查询的支持
JSONPath 为 PostgreSQL 带来了强大的 JSON 查询引擎。

#  什么时候应该使用 JSON 而不是 JSONB？

在大多数情况下，JSONB 是您应该使用的。但是，在某些特定情况下，JSON 效果更好：

- JSON 保留原始格式（也称为空格）和键的顺序。
- JSON 保留重复的键。
- 与 JSONB 相比，JSON 的摄取速度更快 - 但是，如果您进行任何进一步的处理，JSONB 将更快。
例如，如果您只是摄取 JSON 日志而不以任何方式查询它们，那么 JSON 可能是更好的选择

# JSONB 运算符和函数

PostgreSQL提供了各种运算符来处理JSONB。从[文档中](https://www.postgresql.org/docs/12/functions-json.html#FUNCTIONS-JSON-PROCESSING):

|**算子**|**描述**|
|---|---|
|->|获取 JSON 数组元素（从零开始索引，从末尾开始计数负整数）|
|->|按键获取 JSON 对象字段|
|->>|以文本形式获取 JSON 数组元素|
|->>|以文本形式获取 JSON 对象字段|
|#>|获取指定路径中的 JSON 对象|
|#>>|以文本形式获取指定路径处的 JSON 对象|
|@>|左侧 JSON 值是否在顶层包含正确的 JSON 路径/值条目？|
|<@|左侧 JSON 路径/值条目是否包含在右侧 JSON 值中的顶层？|
|?|_字符串_是否作为 JSON 值中的顶级键存在？|
|?\||这些数组_字符串_中的任何一个是否作为顶级键存在？|
|?&|所有这些数组_字符串_是否都作为顶级键存在？|
|\||将两个 jsonb 值连接成一个新的 jsonb 值|
|–|从左侧操作数中删除键/值对或_字符串_元素。键/值对根据其键值进行匹配。|
|–|从左侧操作数中删除多个键/值对或_字符串_元素。键/值对根据其键值进行匹配。|
|–|删除具有指定索引的数组元素（从末尾开始计算负整数）。如果顶级容器不是数组，则引发错误。|
|#-|删除具有指定路径的字段或元素（对于 JSON 数组，负整数从末尾开始计数）|
|@?|JSON 路径是否返回指定 JSON 值的任何项目？|
|@@|返回指定 JSON 值的 JSON 路径谓词检查结果。仅考虑结果的第一项。如果结果不是布尔值，则返回 null。|

# JSONB 相关的索引

我们主要讨论 GIN;BTREE 与 HASH

## GIN 索引

> 支持两种操作类型

- jsonb_ops (default)   [索引 JSONB 中的每个键与值]

   ?, ?|, ?&, @>, @@, @?    

- jsonb_pathops [只是索引 JSONB 中 的值]]

  @>, @@, @?    


### 实例

### 准备数据

```sql
drop table if exists  test cascade;
CREATE TABLE test(id bigserial, data JSONB, PRIMARY KEY (id));
CREATE INDEX idx_test_data ON test USING gin (data);

insert into test(data) values('{"name":"lxm", "age":10, "nick_name":["xiaoming","baobao"], "phone_list":["1111","2222"]}'::jsonb);
```

### 查询 顶层 关键词是否存在(可以使用到 gin 索引)

```sql
set enable_seqscan = off;
select * from test where data ? 'id';  -- 查询一个关键词
explain (verbose, analyse, costs, buffers) select * from test where data ? 'id';  

select * from test where data ?| array['id','name']; --查询多个关键词
explain (verbose, analyse, costs, buffers) select * from test where data ?| array['id','name']; --查询多个关键词


lxm=# set enable_seqscan = off;
SET
lxm=# select * from test where data ? 'id';  -- 查询一个关键词
 id | data
----+------
(0 rows)

lxm=# explain (verbose, analyse, costs, buffers) select * from test where data ? 'id';
                                                       QUERY PLAN
------------------------------------------------------------------------------------------------------------------------
 Bitmap Heap Scan on public.test  (cost=12.09..22.78 rows=12 width=40) (actual time=0.004..0.004 rows=0 loops=1)
   Output: id, data
   Recheck Cond: (test.data ? 'id'::text)
   Buffers: shared hit=3
   ->  Bitmap Index Scan on idx_test_data  (cost=0.00..12.09 rows=12 width=0) (actual time=0.003..0.003 rows=0 loops=1)
         Index Cond: (test.data ? 'id'::text)
         Buffers: shared hit=3
 Planning:
   Buffers: shared hit=1
 Planning Time: 0.020 ms
 Execution Time: 0.014 ms
(11 rows)

lxm=#
lxm=# select * from test where data ?| array['id','name']; --查询多个关键词
 id |                                              data
----+-------------------------------------------------------------------------------------------------
  1 | {"age": 10, "name": "lxm", "nick_name": ["xiaoming", "baobao"], "phone_list": ["1111", "2222"]}
(1 row)

lxm=# explain (verbose, analyse, costs, buffers) select * from test where data ?| array['id','name']; --查询多个关键词
                                                       QUERY PLAN
------------------------------------------------------------------------------------------------------------------------
 Bitmap Heap Scan on public.test  (cost=16.09..26.78 rows=12 width=40) (actual time=0.017..0.018 rows=1 loops=1)
   Output: id, data
   Recheck Cond: (test.data ?| '{id,name}'::text[])
   Heap Blocks: exact=1
   Buffers: shared hit=5
   ->  Bitmap Index Scan on idx_test_data  (cost=0.00..16.09 rows=12 width=0) (actual time=0.010..0.011 rows=1 loops=1)
         Index Cond: (test.data ?| '{id,name}'::text[])
         Buffers: shared hit=4
 Planning:
   Buffers: shared hit=1
 Planning Time: 0.082 ms
 Execution Time: 0.034 ms
(12 rows)

```

### 查询 非顶层 关键词是否存在(无法使用到 gin 索引)

```sql
set enable_seqscan = off;
select * from test where data->'name' ? 'lxm';  
explain (verbose, analyse, costs, buffers) select * from test where data->'name' ? 'lxm';  

lxm=# set enable_seqscan = off;
SET
lxm=# select * from test where data->'name' ? 'lxm';  
 id |                                              data
----+-------------------------------------------------------------------------------------------------
  1 | {"age": 10, "name": "lxm", "nick_name": ["xiaoming", "baobao"], "phone_list": ["1111", "2222"]}
(1 row)

lxm=# explain (verbose, analyse, costs, buffers) select * from test where data->'name' ? 'lxm';  
                                                        QUERY PLAN
---------------------------------------------------------------------------------------------------------------------------
 Seq Scan on public.test  (cost=10000000000.00..10000000028.00 rows=12 width=40) (actual time=0.021..0.023 rows=1 loops=1)
   Output: id, data
   Filter: ((test.data -> 'name'::text) ? 'lxm'::text)
   Buffers: shared hit=1
 Planning Time: 0.097 ms
 Execution Time: 0.043 ms
(6 rows)
```

>  可以看到无法使用到索引, 那如何解决, 可以使用下面 方法

### 非顶层关键词 使用索引的 方法

```sql
-- 千万注意 gin 后面有两个括号,用单个括号会语法报错
drop index if exists idx_test_data_nick_name;
create index idx_test_data_nick_name on test using gin((data->'nick_name'));  
set enable_seqscan = off;
select * from test where data->'nick_name' ? 'xiaoming';  
explain (verbose, analyse, costs, buffers) select * from test where data->'nick_name' ? 'xiaoming';  

lxm=# drop index if exists idx_test_data_nick_name;
DROP INDEX
lxm=# create index idx_test_data_nick_name on test using gin((data->'nick_name'));
CREATE INDEX
lxm=# set enable_seqscan = off;
SET
lxm=# select * from test where data->'nick_name' ? 'xiaoming';
 id |                                              data
----+-------------------------------------------------------------------------------------------------
  1 | {"age": 10, "name": "lxm", "nick_name": ["xiaoming", "baobao"], "phone_list": ["1111", "2222"]}
(1 row)

lxm=# explain (verbose, analyse, costs, buffers) select * from test where data->'nick_name' ? 'xiaoming';
                                                        QUERY PLAN
---------------------------------------------------------------------------------------------------------------------------
 Bitmap Heap Scan on public.test  (cost=8.00..12.02 rows=1 width=40) (actual time=0.018..0.019 rows=1 loops=1)
   Output: id, data
   Recheck Cond: ((test.data -> 'nick_name'::text) ? 'xiaoming'::text)
   Heap Blocks: exact=1
   Buffers: shared hit=3
   ->  Bitmap Index Scan on idx_test_data_name  (cost=0.00..8.00 rows=1 width=0) (actual time=0.009..0.010 rows=1 loops=1)
         Index Cond: ((test.data -> 'nick_name'::text) ? 'xiaoming'::text)
         Buffers: shared hit=2
 Planning:
   Buffers: shared hit=1
 Planning Time: 0.080 ms
 Execution Time: 0.040 ms
(12 rows)
```

### @> 的使用:表示是否包含子json对象



```sql
lxm=# select * from test;
 id |                                              data
----+-------------------------------------------------------------------------------------------------
  1 | {"age": 10, "name": "lxm", "nick_name": ["xiaoming", "baobao"], "phone_list": ["1111", "2222"]}
(1 row)

lxm=# select * from test where data @> '{"age":10}';
 id |                                              data
----+-------------------------------------------------------------------------------------------------
  1 | {"age": 10, "name": "lxm", "nick_name": ["xiaoming", "baobao"], "phone_list": ["1111", "2222"]}
(1 row)

lxm=#
lxm=# select * from test where data @> '{"age":11}';
 id | data
----+------
(0 rows)

lxm=# select * from test where data @> '{"age":10, "nick_name":["xiaoming"]}';
 id |                                              data
----+-------------------------------------------------------------------------------------------------
  1 | {"age": 10, "name": "lxm", "nick_name": ["xiaoming", "baobao"], "phone_list": ["1111", "2222"]}
(1 row)

lxm=#
lxm=# select * from test where data @> '{"age":10, "nick_name":["xiaomi"]}';
 id | data
----+------
(0 rows)
```

### path_ops 支持

GIN 还支持“pathops”选项来减小 GIN 索引的大小。使用 pathops 选项时, 只支持 @> 这一个运算符

[文档中](https://www.postgresql.org/docs/12/datatype-json.html#DATATYPE-JSONPATH):

 jsonb_ops : 数据中的每个键和值创建独立的索引项

 jsonb_path_ops :只给数据中的每值创建独立的索引项

## BTREE 索引

B 树索引是关系数据库中最常见的索引类型。但是，如果使用 B 树索引索引整个 JSONB 列，则唯一有用的运算符是“=”、<、<=、>、>=。从本质上讲，这只能用于整个对象比较，其用例非常有限。

### 普通查询

* 代码

  ```sql
  set enable_seqscan = 0;
  select * from test where (data->>'age')::int>1;
  
  explain (verbose, analyse, costs, buffers) select * from test where (data->>'age')::int>1;
  ```

  

* 演示

```sql
lxm=#
lxm=# set enable_seqscan = 0;
SET
lxm=# select * from test where (data->>'age')::int>1;
 id |                                              data
----+-------------------------------------------------------------------------------------------------
  1 | {"age": 10, "name": "lxm", "nick_name": ["xiaoming", "baobao"], "phone_list": ["1111", "2222"]}
(1 row)

lxm=#
lxm=# explain (verbose, analyse, costs, buffers) select * from test where (data->>'age')::int>1;
                                                        QUERY PLAN
--------------------------------------------------------------------------------------------------------------------------
 Seq Scan on public.test  (cost=10000000000.00..10000000001.02 rows=1 width=40) (actual time=0.013..0.014 rows=1 loops=1)
   Output: id, data
   Filter: (((test.data ->> 'age'::text))::integer > 1)
   Buffers: shared hit=1
 Planning Time: 0.071 ms
 Execution Time: 0.028 ms
(6 rows)
```



### 函数索引

* 代码

```sql
 -- 注意这里最外层有两个括号, 否则会报错
create index idx_test_data_age on test using btree(((data->>'age')::int)); 
set enable_seqscan = 0;
select * from test where (data->>'age')::int>1;
explain (verbose, analyse, costs, buffers) select * from test where (data->>'age')::int>1;

```

* 演示

```sql
lxm=# create index idx_test_data_age on test using btree(((data->>'age')::int));
CREATE INDEX
lxm=# set enable_seqscan = 0;
SET
lxm=# select * from test where (data->>'age')::int>1;
 id |                                              data
----+-------------------------------------------------------------------------------------------------
  1 | {"age": 10, "name": "lxm", "nick_name": ["xiaoming", "baobao"], "phone_list": ["1111", "2222"]}
(1 row)

lxm=# explain (verbose, analyse, costs, buffers) select * from test where (data->>'age')::int>1;
                                                           QUERY PLAN
--------------------------------------------------------------------------------------------------------------------------------
 Index Scan using idx_test_data_age on public.test  (cost=0.12..8.14 rows=1 width=40) (actual time=0.017..0.019 rows=1 loops=1)
   Output: id, data
   Index Cond: (((test.data ->> 'age'::text))::integer > 1)
   Buffers: shared hit=2
 Planning Time: 0.145 ms
 Execution Time: 0.044 ms
(6 rows)
```

## HASH 索引

哈希索引适用于等值查询

```
drop index if exists  idx_test_age;
-- 注意下面有三个括号, 否则会报语法错误
create index idx_test_age on test using hash(((data->>'age')::int));
set enable_seqscan=0;
select * from test where (((data->>'age')::int))=10;
explain (verbose, analyse, costs, buffers) select * from test where (((data->>'age')::int))=10;

```

* 演示

  ```
  lxm=# drop index if exists  idx_test_age;
  DROP INDEX
  lxm=# create index idx_test_age on test using hash(((data->>'age')::int));
  explain (verbose, analyse, costs, buffers) select * from test where (((data->>'age')::int))=10;
  
  CREATE INDEX
  lxm=# set enable_seqscan=0;
  SET
  lxm=# select * from test where (((data->>'age')::int))=10;
   id |                                              data                                               
  ----+-------------------------------------------------------------------------------------------------
    1 | {"age": 10, "name": "lxm", "nick_name": ["xiaoming", "baobao"], "phone_list": ["1111", "2222"]}
  (1 row)
  
  lxm=# explain (verbose, analyse, costs, buffers) select * from test where (((data->>'age')::int))=10;
                                                          QUERY PLAN                                                         
  ---------------------------------------------------------------------------------------------------------------------------
   Index Scan using idx_test_age on public.test  (cost=0.00..8.02 rows=1 width=40) (actual time=0.010..0.011 rows=1 loops=1)
     Output: id, data
     Index Cond: (((test.data ->> 'age'::text))::integer = 10)
     Buffers: shared hit=2
   Query Identifier: 1710720936157136870
   Planning Time: 0.047 ms
   Execution Time: 0.021 ms
  (7 rows)
  
  ```

  

> 参考: 
> [JSONB PostgreSQL: How To Store & Index JSON Data (scalegrid.io)](https://scalegrid.io/blog/using-jsonb-in-postgresql-how-to-effectively-store-index-json-data-in-postgresql/)
> [pgsql jsonb的索引 - 简书 (jianshu.com)](https://www.jianshu.com/p/96f78afb5a34)
> 

