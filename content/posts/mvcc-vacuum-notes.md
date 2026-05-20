---
title: "MVCC 与 Vacuum 的实践理解"
date: 2026-05-12
description: "用可观测指标串起事务可见性、死元组、autovacuum 参数和表膨胀治理。"
categories: ["PostgreSQL 内功修炼"]
tags: ["PostgreSQL", "MVCC", "Vacuum", "Autovacuum"]
series: ["PostgreSQL 内功"]
---

PostgreSQL 的 MVCC 让读写可以并发，但代价是更新和删除会留下旧版本。Vacuum 的核心任务，就是在安全的时候清理这些旧版本。

## 为什么会有死元组

一条记录被更新时，PostgreSQL 会写入一个新版本，旧版本暂时保留。只要还有事务可能看到旧版本，它就不能被清理。

这也是为什么长事务很危险：它会拖住全局可清理边界，让死元组越积越多。

## 日常观察指标

```sql
select relname, n_live_tup, n_dead_tup, last_autovacuum
from pg_stat_user_tables
order by n_dead_tup desc
limit 20;
```

需要结合表大小、更新频率、查询延迟和 autovacuum 日志一起看，不能只凭 `n_dead_tup` 判断。

## 参数不是越激进越好

调小 autovacuum 触发阈值可以更快清理，但也可能增加 IO 压力。更好的做法是给高更新表设置单表参数，并配合业务低峰期观察。
