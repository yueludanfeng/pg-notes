---
title: "一次慢查询引发的执行计划排查"
date: 2026-05-19
description: "从业务反馈到 pg_stat_statements、索引选择、统计信息与执行计划变化，复盘一次慢查询定位过程。"
categories: ["PostgreSQL 案例"]
tags: ["PostgreSQL", "慢查询", "执行计划", "索引"]
series: ["PostgreSQL 运维案例"]
---

慢查询排查不要一上来就加索引。更稳的顺序是先确认现象，再收集证据，最后决定改 SQL、改索引还是改统计信息。

## 现象确认

先确认问题是否稳定复现：

```sql
select query, calls, mean_exec_time, rows
from pg_stat_statements
order by mean_exec_time desc
limit 10;
```

如果只有个别时间段变慢，还需要继续检查连接数、锁等待、IO 延迟和 autovacuum 活动。

## 执行计划

对目标 SQL 使用：

```sql
explain (analyze, buffers, verbose)
select *
from orders
where user_id = 10086
order by created_at desc
limit 20;
```

重点看：

- 估算行数和实际行数是否偏差很大
- 是否出现不合理的 Seq Scan
- 排序是否落盘
- buffer 命中和读取是否异常

## 处理思路

如果估算偏差明显，先考虑更新统计信息；如果访问模式稳定，再评估组合索引。索引设计要匹配过滤条件、排序字段和返回行数，而不是只看 where 条件。
