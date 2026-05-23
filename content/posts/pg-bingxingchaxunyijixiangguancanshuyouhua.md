---
title: "PG 并行查询以及相关参数优化"
date: 2023-07-25
description: "5.worker 设置多大为好："
categories: ["PostgreSQL 培训"]
tags: ["参数配置", "索引"]
series: []
---

[PG的并行查询生产案例 - 青空如璃 - 博客园 (cnblogs.com)](https://www.cnblogs.com/chinaops/p/16401094.html)


5.worker 设置多大为好：

这个问题可以参考percona https://www.percona.com/blog/2019/02/21/parallel-queries-in-postgresql/

首先，`max_parallel_workers_per_gather`参数是worker数量的最小限制。其次，查询执行程序从`max_parallel_workers`大小限制的池中获取worker。最后，最顶层的限制是`max_worker_processes`，它用来限制后台进程的总数。 工作分配失败会导致单进程执行。 查询计划可以根据表或索引大小减少worker数。`min_parallel_table_scan_size`和`min_parallel_index_scan_size`控制这一行为。

```sql
set min_parallel_table_scan_size='8MB'
8MB table => 1 worker
24MB table => 2 workers
72MB table => 3 workers
x => log(x / min_parallel_table_scan_size) / log(3) + 1 worker
```

每次表比`minparallel(index | table)scansize`大3倍时，postgres会添加一个worker。worker数量不是以cost为基础的！循环依赖使得复杂的实现变得困难。相反，查询规划使用简单的规则。

实际上，这些规则在生产中并不总是可以接受，您可以使用 `ALTER TABLE ... SET(parallel_workers = N)` 覆盖特定表的 worker 数量