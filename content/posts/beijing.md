---
title: "背景"
date: 2023-08-29
description: "PostgreSQL是一个强类型数据库，因此你输入的变量、常量是什么类型，是强绑定的，例如"
categories: ["SQL 优化"]
tags: ["PostgreSQL"]
series: []
---

PostgreSQL是一个强类型数据库，因此你输入的变量、常量是什么类型，是强绑定的，例如

在调用操作符时，需要通过操作符边上的数据类型，选择对应的操作符。

在调用函数时，需要根据输入的类型，选择对应的函数。

如果类型不匹配，就会报操作符不存在，或者函数不存在的错误。

如果你发现有些类型转换没有内置，怎么办呢？我们可以自定义转换。

```sql
select '1'+'2';

test=# select '1'+'2';
ERROR:  operator is not unique: unknown + unknown
LINE 1: select '1'+'2';
                  ^
HINT:  Could not choose a best candidate operator. You might need to add explicit type casts.
test=# 
```



# 语法

```sql
CREATE CAST (source_type AS target_type)  
    WITH FUNCTION function_name [ (argument_type [, ...]) ]  
    [ AS ASSIGNMENT | AS IMPLICIT ]  
  
CREATE CAST (source_type AS target_type)  
    WITHOUT FUNCTION  
    [ AS ASSIGNMENT | AS IMPLICIT ]  
  
CREATE CAST (source_type AS target_type)  
    WITH INOUT  
    [ AS ASSIGNMENT | AS IMPLICIT ]  
```



> 
>
> 解释：
>
> 1、WITH FUNCTION，表示转换需要用到什么函数。
>
> 2、WITHOUT FUNCTION，表示被转换的两个类型，在数据库的存储中一致，即物理存储一致。例如text和varchar的物理存储一致。不需要转换函数。
>
> 3、WITH INOUT，表示使用内置的IO函数进行转换。每一种类型，都有INPUT 和OUTPUT函数。使用这种方法，好处是不需要重新写转换函数。
>
> 4、AS ASSIGNMENT，表示在赋值时，自动对类型进行转换。例如字段类型为TEXT，输入的类型为INT，那么可以创建一个 cast(int as text) as ASSIGNMENT。
>
> 5、AS IMPLICIT，表示在表达式中，或者在赋值操作中，都对类型进行自动转换。（包含了AS ASSIGNMENT，它只对赋值进行转换）
>
> 6、注意，AS IMPLICIT需要谨慎使用，为什么呢？因为操作符会涉及到多个算子，如果有多个转换，目前数据库并不知道应该选择哪个？
>
> 因此，建议谨慎使用AS IMPLICIT。建议使用AS IMPLICIT的CAST应该是非失真转换转换，例如从INT转换为TEXT，或者int转换为numeric。
>
> 而失真转换，不建议使用as implicit，例如numeric转换为int。



# 实例:

```sql
drop cast if exists (text as date);
select text '2017-01-01' + 1;

create or replace function text_to_date(text) returns date as $$          
  select to_date($1,'yyyy-mm-dd');  
$$ language sql strict;  
  
create cast (text as date) with function text_to_date(text) as implicit;  
select text '2017-01-01' + 1;

drop cast if exists (text as date);
create cast (text as date) with inout as implicit;
select text '2017-01-01' + 1;


test=# drop cast if exists (text as date);
DROP CAST
test=# select text '2017-01-01' + 1;
ERROR:  operator does not exist: text + integer
LINE 1: select text '2017-01-01' + 1;
                                 ^
HINT:  No operator matches the given name and argument types. You might need to add explicit type casts.
test=# 
test=# create or replace function text_to_date(text) returns date as $$          
test$#   select to_date($1,'yyyy-mm-dd');  
test$# $$ language sql strict;  
CREATE FUNCTION
test=#   
test=# create cast (text as date) with function text_to_date(text) as implicit;  
CREATE CAST
test=# select text '2017-01-01' + 1;
  ?column?  
------------
 2017-01-02
(1 row)

test=# 
test=# drop cast if exists (text as date);
DROP CAST
test=# create cast (text as date) with inout as implicit;
CREATE CAST
test=# select text '2017-01-01' + 1;
  ?column?  
------------
 2017-01-02
(1 row)
```

