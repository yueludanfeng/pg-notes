---
title: "创建测试数据"
date: 2023-08-20
description: "```sql"
categories: ["PostgreSQL 笔记"]
tags: ["参数配置", "备份恢复"]
series: []
---

```sql
drop database if exists test;
create database test ;
\c test
create table t1(id int primary key);
create table t2(id serial primary key, name varchar);
create table t3(id bigserial primary key, name varchar, age int);

CREATE FUNCTION func_test()
RETURNS int 
AS 
$$
BEGIN
    RETURN 0;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION func_test2()
RETURNS int 
AS 
$$
BEGIN
    RETURN 0;
END;
$$ LANGUAGE plpgsql;
```
# pg_dump 备份
* pg_dump test -f test. sql 
* pg_dump test -f test 2. sql -C -c --if-exists

* pg_dump test -Fc -f test. dmp 
* pg_restore test. dmp -f test_dump. sql
```
[pgsql@mysql01 test]$ diff test_dump.sql test.sql
[pgsql@mysql01 test]$ diff test_dump.sql test2.sql
18a19,41
> DROP DATABASE IF EXISTS test;
> --
> -- Name: test; Type: DATABASE; Schema: -; Owner: pgsql
> --
> 
> CREATE DATABASE test WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE = 'en_US.utf8';
> 
> 
> ALTER DATABASE test OWNER TO pgsql;
> 
> \connect test
> 
> SET statement_timeout = 0;
> SET lock_timeout = 0;
> SET idle_in_transaction_session_timeout = 0;
> SET client_encoding = 'UTF8';
> SET standard_conforming_strings = on;
> SELECT pg_catalog.set_config('search_path', '', false);
> SET check_function_bodies = false;
> SET xmloption = content;
> SET client_min_messages = warning;
> SET row_security = off;
> 
```

* pg_dump test -Fc -f test 2. dump -C -c --if-exists

* pg_restore test 2. dump -f test 2_dump. sql
```
[pgsql@mysql01 test]$ diff test2_dump.sql test2.sql
18a19,41
> DROP DATABASE IF EXISTS test;
> --
> -- Name: test; Type: DATABASE; Schema: -; Owner: pgsql
> --
> 
> CREATE DATABASE test WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE = 'en_US.utf8';
> 
> 
> ALTER DATABASE test OWNER TO pgsql;
> 
> \connect test
> 
> SET statement_timeout = 0;
> SET lock_timeout = 0;
> SET idle_in_transaction_session_timeout = 0;
> SET client_encoding = 'UTF8';
> SET standard_conforming_strings = on;
> SELECT pg_catalog.set_config('search_path', '', false);
> SET check_function_bodies = false;
> SET xmloption = content;
> SET client_min_messages = warning;
> SET row_security = off;
```
可见, 即使使用了 -C -c --if-exists 生成的 dmp 文件中还是不包含库的创建信息

因此, 我们在通过 pg_restore 恢复 dmp 文件的时候, 记得一定要先创建好数据库, 再恢复

* pg_dump test -Fd -f test_dir -j 3   # 并行逻辑备份
```bash
[pgsql@mysql01 test]$ ll test_dir
total 20
-rw-rw-r-- 1 pgsql pgsql   25 Aug 20 21:13 2541.dat.gz
-rw-rw-r-- 1 pgsql pgsql   25 Aug 20 21:13 2543.dat.gz
-rw-rw-r-- 1 pgsql pgsql   25 Aug 20 21:13 2545.dat.gz
-rw-rw-r-- 1 pgsql pgsql 5198 Aug 20 21:13 toc.dat
```

# pg_restore 恢复
```bash
[pgsql@mysql01 test]$ dropdb test
[pgsql@mysql01 test]$ psql -c "\l test"
psql: error: connection to server on socket "/usr/local/pgsql/data/.s.PGSQL.5432" failed: FATAL:  database "test" does not exist
[pgsql@mysql01 test]$ pg_restore test.dmp -d test          
pg_restore: error: connection to server on socket "/usr/local/pgsql/data/.s.PGSQL.5432" failed: FATAL:  database "test" does not exist
[pgsql@mysql01 test]$ 
[pgsql@mysql01 test]$ createdb  test
[pgsql@mysql01 test]$ pg_restore test.dmp -d test
[pgsql@mysql01 test]$ psql -d test
psql (14.5)
Type "help" for help.

test=# \dt
       List of relations
 Schema | Name | Type  | Owner 
--------+------+-------+-------
 public | t1   | table | pgsql
 public | t2   | table | pgsql
 public | t3   | table | pgsql
(3 rows)

test=# \df
                          List of functions
 Schema |    Name    | Result data type | Argument data types | Type 
--------+------------+------------------+---------------------+------
 public | func_test  | integer          |                     | func
 public | func_test2 | integer          |                     | func
(2 rows)
test=# \ds
           List of relations
 Schema |   Name    |   Type   | Owner 
--------+-----------+----------+-------
 public | t2_id_seq | sequence | pgsql
 public | t3_id_seq | sequence | pgsql
(2 rows)
```

# PG 只导出指定函数
```bash
[pgsql@mysql01 test2]$ pg_dump  test -Fc  -s -f test.dmp 
[pgsql@mysql01 test2]$ pg_restore -l test.dmp | grep FUNCTION > function.list
[pgsql@mysql01 test2]$ more function.list 
214; 1255 25865 FUNCTION public func_test() pgsql
215; 1255 25866 FUNCTION public func_test2() pgsql
[pgsql@mysql01 test2]$ 
[pgsql@mysql01 test2]$ 
[pgsql@mysql01 test2]$ pg_restore -L function.list test.dmp > function_list.sql
pg_restore: error: one of -d/--dbname and -f/--file must be specified
[pgsql@mysql01 test2]$ pg_restore -L function.list test.dmp -f function_list.sql
[pgsql@mysql01 test2]$ 
[pgsql@mysql01 test2]$ more function_list.sql 
--
-- PostgreSQL database dump
--

-- Dumped from database version 14.5
-- Dumped by pg_dump version 14.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: func_test(); Type: FUNCTION; Schema: public; Owner: pgsql
--

CREATE FUNCTION public.func_test() RETURNS integer
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN 0;
END;
$$;


ALTER FUNCTION public.func_test() OWNER TO pgsql;

--
-- Name: func_test2(); Type: FUNCTION; Schema: public; Owner: pgsql
--

CREATE FUNCTION public.func_test2() RETURNS integer
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN 0;
END;
$$;


ALTER FUNCTION public.func_test2() OWNER TO pgsql;

--
-- PostgreSQL database dump complete
--

```

