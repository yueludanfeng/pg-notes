---
title: "PostgreSQL 并行查询相关参数"
date: 2023-06-19
description: "在 PostgreSQL 中，有几个参数与并行查询相关。以下是一些常用的参数："
categories: ["PostgreSQL 笔记"]
tags: ["PostgreSQL", "VACUUM", "参数配置", "索引"]
series: []
---

在 PostgreSQL 中，有几个参数与并行查询相关。以下是一些常用的参数：

1. `max_parallel_workers`: 这是一个整数参数，用于设置在并行查询期间可用的最大并行工作者数。默认值为 8。可以根据系统的性能和资源进行调整。

2. `max_parallel_workers_per_gather`: 这是一个整数参数，用于设置单个并行 Gather 操作中的最大并行工作者数。默认值为 2。这个参数可以根据系统的性能和资源进行调整。

3. `max_parallel_maintenance_workers`: 这是一个整数参数，用于设置在并行维护操作（例如 VACUUM 或 REINDEX）期间可用的最大并行工作者数。默认值为 2。根据系统的性能和资源进行调整。

4. `parallel_leader_participation`: 这是一个布尔参数，用于控制是否允许并行查询中的主进程参与并行查询的执行。默认值为 `on`，表示允许主进程参与。如果设置为 `off`，主进程将不会执行并行查询的任何工作，只负责协调。

5. `min_parallel_table_scan_size`: 这是一个整数参数，用于设置触发并行表扫描的最小表大小。默认值为 8 MB。当表的大小超过该值时，PostgreSQL 可能会选择使用并行扫描来加速查询。

6. `min_parallel_index_scan_size`: 这是一个整数参数，用于设置触发并行索引扫描的最小索引大小。默认值为 512 kB。当索引的大小超过该值时，PostgreSQL 可能会选择使用并行扫描来加速查询。

这些参数可以通过修改 PostgreSQL 配置文件（通常是 `postgresql.conf`）或使用 `ALTER SYSTEM` 命令进行动态修改。请注意，在修改这些参数之前，请确保了解系统的硬件资源和性能需求，并进行适当的测试和调整。


*  parallel_setup_cost(floating point)
设置优化器启动并行进程的成本，默认为1000

* parallel_tuple_cost(floating point)
设置优化器通过并行进程处理一行数据的成本，默认为0.1

* force_parallel_mode(enum)  
强制开启并行，一般作为测试目的