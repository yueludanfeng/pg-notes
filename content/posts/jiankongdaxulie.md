---
title: "监控大序列"
date: 2023-08-21
description: "```sql"
categories: ["索引"]
tags: ["参数配置", "监控"]
series: []
---

```sql

drop type if exists large_sequece cascade;

create type large_sequece as

(

schemaname text,

tablename text,

current_value bigint,

owned_by_table text,

column_name text,

data_type text,

table_size text

);



-- 参数:seq_size_limit 序列当前值限制
CREATE OR REPLACE FUNCTION func_monitor_large_sequences(seq_size_limit bigint default 100000)

RETURNS setof large_sequece

AS

$BODY$

DECLARE

BEGIN

return query

with t1 as (

select schemaname, sequencename ,last_value

--, schemaname||'.' || split_part(sequencename,'_',1) as owned_by_table, split_part(sequencename,'_',2) column_name

from pg_sequences where last_value>seq_size_limit

) , t as (

select

t1.schemaname, t1.sequencename ,t1.last_value,

t2.table_schema||'.'||t2.table_name as owned_by_table, t2.column_name

from t1 join

(

SELECT table_schema,table_name, column_name, column_default, split_part(column_default::text,$$'$$,2) as sequence_name

FROM information_schema.columns

) t2 on (t2.table_schema||'.'||sequence_name = t1.schemaname||'.'||t1.sequencename)

)

select

t.schemaname::text,

t.sequencename::text,

t.last_value::bigint,

t.owned_by_table::text,

t.column_name::text,

t2.data_type::text,

pg_size_pretty(pg_total_relation_size(t.owned_by_table))::TEXT

from t

left join information_schema.columns t2 on (t2.table_schema||'.'||t2.table_name=t.owned_by_table and t2.data_type='integer')

order by last_value desc, pg_total_relation_size(owned_by_table) desc;

  

END;

$BODY$ LANGUAGE plpgsql;

  

select * from func_monitor_large_sequences();


-- 使用示例: 查询当前序列值超过 10w 的序列以及表字段信息

select * from func_monitor_large_sequences(100000);

```

  
  

# 监控大表

```sql

drop type if exists large_table cascade;

create type large_table as (schemaname text, tablename text, table_record_num bigint, table_size text);

  

CREATE OR REPLACE FUNCTION func_monitor_large_tables(table_size_limit bigint default 10000000,table_num_limit bigint DEFAUlt 100000)

RETURNS setof large_table

AS

$BODY$

DECLARE

rec record;

table_list text:='';

str_cmd text:='';

arry_table_list text[];

BEGIN

  

for rec in select schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size

from pg_tables where pg_total_relation_size(schemaname||'.'||tablename) > table_size_limit -- 大于 10M 的表

and schemaname<>'pg_catalog'

loop

str_cmd='analyse ' || rec.schemaname||'.'||rec.tablename;

-- raise notice 'str_cmd=%',str_cmd;

execute str_cmd;

table_list:= table_list || ','|| rec.schemaname||'.'||rec.tablename;

end loop;

-- raise notice 'table_list=%',table_list;

table_list=ltrim(table_list,',');

-- raise notice 'table_list=%',table_list;

arry_table_list=string_to_array(table_list,',');

  

return query

with t as (

select schemaname::text, relname::text, n_live_tup, schemaname||'.'||relname as table_name from pg_stat_user_tables where schemaname||'.'||relname =any(arry_table_list)

) select schemaname , relname, n_live_tup, pg_size_pretty(pg_total_relation_size(table_name))::text as size

from t ;

END;

$BODY$ LANGUAGE plpgsql;

  

--使用示例:查看大于 10M 并且条数大于 10w 条的表信息

select * from func_monitor_large_tables(10000000, 100000);

```