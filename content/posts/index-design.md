---
title: "索引不是越多越好"
date: 2026-05-03
description: "梳理 B-tree、组合索引、覆盖索引、写入放大和索引维护成本，建立可落地的索引评审清单。"
categories: ["SQL 优化"]
tags: ["PostgreSQL", "索引", "SQL 优化"]
series: ["SQL 优化笔记"]
---

索引可以加速查询，也会拖慢写入。一个好的索引应该服务于稳定、高频、收益明确的访问路径。

## 评审问题

创建索引前可以先问四个问题：

1. 这个查询是否足够高频或足够关键？
2. where 条件、排序和分页是否稳定？
3. 现有索引是否已经覆盖类似场景？
4. 写入成本和存储成本是否可以接受？

## 组合索引

组合索引不是把所有字段都塞进去。常见思路是把等值过滤字段放前面，再考虑范围条件和排序字段。

```sql
create index concurrently idx_orders_user_created
on orders (user_id, created_at desc);
```

上线前建议使用 `explain (analyze, buffers)` 对比收益，并观察写入延迟。
