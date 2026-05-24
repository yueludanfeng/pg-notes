---
title: "使用 pg_stat_all_tables 理解表的统计信息"
date: 2026-05-24
description: "pg_stat_all_tables视图详解：表扫描统计、DML活动、HOT更新、死元组与VACUUM状态等核心指标的解读与实战查询"
categories: ["PostgreSQL 案例"]
tags: ["PostgreSQL", "pg_stat_all_tables", "统计信息", "性能调优", "VACUUM", "监控"]
series: []
---

> 原文：[Understand Table Statistics Using pg_stat_all_tables](https://stormatics.tech/blogs/understand-table-statistics-using-pg_stat_all_tables)
> 作者：Admin，发布于 2023年12月6日

数据库监控、性能调优和查询优化是维护高效数据库系统的关键操作。在 PostgreSQL 中，`pg_stat_all_tables` 视图是达成这些目标的核心组件。

`pg_stat_all_tables` 提供表活动的实时统计信息，例如表上执行的顺序扫描和索引扫描次数、更新、删除、插入操作等。它还提供关于死元组（dead tuples）以及 VACUUM 和 ANALYZE 统计信息，使数据库管理员能够做出数据驱动的决策。

以下是 `pg_stat_all_tables` 中列的详细说明：

| 列名 | 描述 |
|------|------|
| relid | 表的对象标识符（OID） |
| schemaname | 表所在的 schema 名称 |
| relname | 表名 |
| seq_scan | 对该表执行顺序扫描的总次数 |
| last_seq_scan（PG16） | 该表最后一次顺序扫描的时间（基于最近事务的停止时间） |
| seq_tup_read | 顺序扫描读取的元组总数 |
| idx_scan | 该表上发起的索引扫描次数 |
| last_idx_scan（PG16） | 该表最后一次索引扫描的时间（基于最近事务的停止时间。不提供上次扫描使用了哪个索引的信息） |
| idx_tup_fetch | 索引扫描获取的元组总数 |
| n_tup_ins | 插入该表的元组总数 |
| n_tup_upd | 该表中更新的元组总数 |
| n_tup_del | 该表中删除的元组总数 |
| n_tup_hot_upd | HOT 更新的元组数量（Heap-Only Tuples） |
| n_live_tup | 表中活跃元组的估计数量 |
| n_dead_tup | 表中死元组的估计数量 |
| n_mod_since_analyze | 自上次 ANALYZE 操作以来修改的元组数量 |
| n_ins_since_vacuum | 自上次 VACUUM 以来插入的估计行数 |
| last_vacuum | 该表上最后一次手动 VACUUM 操作的时间戳 |
| last_autovacuum | 该表上最后一次自动 VACUUM 操作的时间戳 |
| last_analyze | 该表上最后一次手动 ANALYZE 操作的时间戳 |
| last_autoanalyze | 该表上最后一次自动 ANALYZE 操作的时间戳 |
| vacuum_count | 该表被手动 VACUUM 的次数 |
| autovacuum_count | 该表被自动 VACUUM 的次数 |
| analyze_count | 该表被手动 ANALYZE 的次数 |
| autoanalyze_count | 该表被自动 ANALYZE 的次数 |

> 更详细的信息可参考 PostgreSQL 官方文档：[Monitoring Stats Views](https://www.postgresql.org/docs/current/monitoring-stats.html)

---

## 查询示例 1：如何识别顺序扫描频率最高的表

```sql
SELECT
    schemaname,
    relname,
    seq_scan,
    idx_scan,
    seq_tup_read,
    seq_tup_read / seq_scan AS avg_seq_read
FROM
    pg_stat_all_tables
WHERE
    seq_scan > 0
    AND schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY
    avg_seq_read DESC
LIMIT 10;
```

**说明**：此查询列出平均每次顺序扫描读取元组数最多的前 10 张表。高顺序扫描数且低索引扫描数可能表示该表需要创建索引，特别是当查询频繁使用 `WHERE` 子句时。

---

## 查询示例 2：如何识别未使用或不常访问的表

```sql
SELECT
    schemaname,
    relname,
    seq_scan,
    idx_scan,
    (COALESCE(seq_scan, 0) + COALESCE(idx_scan, 0)) AS total_scans_performed
FROM
    pg_stat_all_tables
WHERE
    (COALESCE(seq_scan, 0) + COALESCE(idx_scan, 0)) < 10
    AND schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY
    5 DESC;
```

**说明**：找出总扫描次数小于 10 的表（阈值可按需调整）。在 PG16 中，还可通过 `last_seq_scan` 和 `last_idx_scan` 列确定最后访问时间。

---

## 查询示例 3：如何检查表的写入活动

```sql
SELECT
    st.schemaname,
    st.relname,
    pg_size_pretty(pg_total_relation_size(st.relid)) AS Total_Size,
    st.seq_scan,
    st.idx_scan,
    st.n_tup_ins,
    st.n_tup_upd,
    st.n_tup_del,
    st.n_tup_hot_upd,
    st.n_tup_hot_upd * 100 / (CASE WHEN st.n_tup_upd > 0 THEN st.n_tup_upd ELSE 1 END) AS hot_percentage
FROM
    pg_stat_all_tables st
WHERE
    st.schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY
    Total_Size DESC;
```

**说明**：展示表的 DML 活动情况，计算 HOT 更新百分比。对于 HOT 比例低且写入频繁的表，应重点关注并分析其更新模式。

---

## 查询示例 4：如何查看活跃/死元组数量及 VACUUM 状态

```sql
SELECT
    schemaname,
    relname,
    n_live_tup,
    n_dead_tup,
    n_dead_tup * 100 / (CASE WHEN n_live_tup > 0 THEN n_live_tup ELSE 1 END) AS dead_rows_percent,
    last_autovacuum,
    last_autoanalyze
FROM
    pg_stat_all_tables
WHERE
    schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY
    n_dead_tup DESC;
```

**说明**：死元组过多会导致查询计划不准、性能下降。监控 `last_autovacuum` 和 `last_autoanalyze` 时间有助于调整 autovacuum 配置及规划日常维护。

---

## 总结

`pg_stat_all_tables` 视图是 PostgreSQL 数据库管理员的宝贵资源。通过有效分析和解读该视图中的数据，管理员可以识别需要维护或清理以回收存储空间的表，以及通过调优查询来显著提升性能。

---

## 常见问题

**Q: 如何使用 pg_stat_all_tables 识别缺少索引的表？**

应该关注 `seq_scan` 高而 `idx_scan` 低的表。这种模式表明查询正在执行耗费资源的全表扫描，而不是利用索引进行高效数据检索。

**Q: 如何检测存储膨胀和低效的 VACUUM 处理？**

监控 `n_dead_tup`（死行）与 `n_live_tup` 的比例来计算空间浪费百分比。持续偏高的死元组数量表明 autovacuum 滞后，需要调整以有效回收存储空间。

**Q: 什么情况下表明 schema 中某些表已过时或未被使用？**

`seq_scan` 和 `idx_scan` 总和接近零的表很可能没有活跃的业务用途。在 PostgreSQL 16+ 中，还可通过检查 `last_seq_scan` 和 `last_idx_scan` 的具体时间戳来进一步确认不活跃状态。

**Q: 如何衡量 UPDATE 操作的效率和索引维护开销？**

比较 `n_tup_upd` 和 `n_tup_hot_upd` 来确定 HOT（Heap-Only Tuple）比例。HOT 比例低意味着 UPDATE 正在触发昂贵的索引修改，通常可以通过调整表的 `FILLFACTOR` 来解决。

**Q: 哪些指标可用于量化 DML 强度以进行容量规划？**

通过汇总 `n_tup_ins`、`n_tup_upd` 和 `n_tup_del` 来衡量写入吞吐量。分析这些具体计数器有助于隔离写入密集型表，这些表可能需要专门的 I/O 资源配置或定制化的维护计划。
