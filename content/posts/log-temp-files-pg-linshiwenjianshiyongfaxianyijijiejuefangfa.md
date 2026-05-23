---
title: "log_temp_files PG 临时文件使用发现以及解决方法"
date: 2023-08-26
description: "Work_mem is the memory area used by queries for operations such as JOINS, ORDER BY, DISTINCT etc . Default value is 4 MB"
categories: ["PostgreSQL 笔记"]
tags: ["PG临时文件", "参数配置", "执行计划", "统计信息"]
series: []
---

Work_mem is the memory area used by queries for operations such as JOINS, ORDER BY, DISTINCT etc . Default value is 4 MB which is not sufficient for large sort operations. When work_mem is not sufficient the sort gets spilled to disk and temporary files are created during query execution. These files are automatically removed by postgres after the completion of query

By default, temp files are created in data directory($PGDATA/base/pgsql_tmp) and if you have huge temp file(s) it could fill up the data directory. Apart from space issues, usage of temp files frequently could impact app performance

### How can we identify the queries using temp files?

1) You can identify them in **postgres logs.** Please ensure that log_tmp_files is enabled so that temp file usage will be tracked. A value of zero logs all temporary file information, while positive values log only files whose size is greater than or equal to the specified number of kilobytes. For e.g in below screenshot you can see the entries for temp file usage in postgres log (underlined in red color)

![](https://klouddb.io/wp-content/uploads/2022/03/postgress_logs.jpg)

2) **Using Pgbadger** : You can get a quick visual summary using Pgbadger: 1) Queries generating most temp files – In below example you can see that Rank#1 query generated 70 temp files for the specified time range

![](https://klouddb.io/wp-content/uploads/2022/03/pgbadger.jpg)

Queries ordered by size of temp file – In below example you can see that Rank#1 query generated temp file with a size of 25 MB roughly

![](https://klouddb.io/wp-content/uploads/2022/03/generated_tmp.jpg)

3) In **Pg_stat_statements** – Below query will give you the queries triggering temp files. We are ordering by tmp_blks_written here

SELECT interval '1 millisecond' * total_time AS total_exec_time,

total_time / calls AS avg_exec_time_ms,

temp_blks_written,

query AS query

FROM pg_stat_statements

WHERE temp_blks_written > 0

ORDER BY temp_blks_written DESC

LIMIT 20;

4) Using **pg_stat_database** -This gives db level stats. You can use something like below

select datname, temp_files , pg_size_pretty(temp_bytes) as temp_file_size FROM pg_stat_database order by temp_bytes desc;

Please note that above is global value for the entire database. You can use something like pg_stat_reset() to refresh these stats

### How can we identify this problem in an explain plan?

When you run EXPLAIN ANALYZE you would see something like below in explain plan

E.g **Sort Method: external merge Disk: 727960kB** (In below example you can see entries for temp file usage inside the red circle)

![](https://klouddb.io/wp-content/uploads/2022/03/sort_method.jpg)

You can compare your work_mem size with this value and see why it is spilling to disk and take corrective action

### We identified the queries causing temp files. Now how can we resolve this issue?

1. First and foremost, set **temp_file_limit**. By default, this has a value of -1 which means there is no limit on the size of the temp file. Let’s say you set it to 10GB, any session using temp files more than 10GB will be canceled. This is a good control to have to limit the usage and thereby avoid major issues
2. **Tune queries**: Ensure that proper indices are being used, rewrite the queries to tune them as needed
3. **Tuning work_mem**: This is a tricky operation and could cause adverse effects. If you change work_mem globally it could increase overall memory usage. Be very cautious and test it thoroughly before making changes in production. Most of the time it is better to change this locally to apply to a specific query  
    
    Cluster level :
    
    ALTER SYSTEM SET work_mem TO ‘128MB';
    
    Database level :
    
    ALTER DATABASE database_name SET work_mem TO ‘128MB';
    
    User level :
    
    ALTER ROLE user_name SET work_mem TO '64MB';
    
    Transaction level:
    
    BEGIN;
    
    SET LOCAL work_mem TO '64MB';
    
4. Set **statement_timeout** to control long-running queries

Please set statement_timeout to an optimal value. If there is a huge query doing sorts, this config should help in preventing the long-running queries


[Temporary files in PostgreSQL – Steps to identify and fix temp file issues - Kloud DB](https://klouddb.io/temporary-files-in-postgresql-steps-to-identify-and-fix-temp-file-issues/)

