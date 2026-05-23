---
title: "参考:"
date: 2024-01-27
description: "https://severalnines.com/blog/architecture-and-tuning-memory-postgresql-databases/"
categories: ["PostgreSQL 运维"]
tags: ["VACUUM", "WAL", "内存管理", "分区表", "参数配置", "执行计划", "索引", "统计信息", "连接池"]
series: []
---

# 参考: 
[PostgreSQL Memory Management - Stormatics](https://stormatics.tech/blogs/postgresql-memory-management)

https://severalnines.com/blog/architecture-and-tuning-memory-postgresql-databases/

# PG 内存架构

![img](/images/image1-20240127214357280.png)

# 全局的

## shared_buffers
缓存频繁使用的数据

## **wal_buffers**
默认值是-1, 相当于设置为 1/32 的 shared_buffers的值
wal buffers 满了会通过fsync写入到磁盘中, commit 的时候会将 wal_buffers 写入到磁盘中

## Commit Log

保存事务的状态,  是并发控制机制的一部分;

clog 被分配到共享内存，并在整个事务处理过程中使用。

事务状态有如下四种:

```bash
IN_PROGRESS
COMMITTED
ABORTED
SUB-COMMITTED
```

## **effective_cache_size**

effective_cache_size 向查询规划器提供关于 PostgreSQL 实例的操作系统可用于磁盘缓存的内存量的估计
规划器使用此信息根据各种计划的预期成本选择最佳查询计划;
例如：如果 effective_cache_size 内存足够高，它会更喜欢索引扫描而不是顺序扫描。

合理的值在总操作系统内存的60-75%之间（需要重新启动）。如果设置得太高，查询规划器可能会选择过于昂贵的计划，导致查询性能变慢。另一方面，如果参数设置得太低，查询规划器可能会低估可用内存并选择不是最优的计划

# 局部的

## **work_mem**

distinct;sort;union;merge join; hash join;hash aggregation  操作 都会使用到该内存

注意: 对于复杂查询，多个排序或哈希操作可能并行执行, 在开始将数据写入临时文件之前，将允许每个操作使用此值指定的内存。比如多个会话同时执行此类操作, 因此, 使用的总内存可能是 work_mem 参数值的数倍

例如：如果 work_mem 设置为 32MB，并且查询包含大约 10 个排序/散列/order by/group by/distinct 操作，则该特定查询的总内存使用量约为 32*10=320MB。如果某个操作占用的空间超过了可用的 work_mem（在上例中超过 32MB），它将开始在磁盘上创建临时文件。

参数 log_temp_files 可用于记录排序、哈希和临时文件，这有助于确定排序是否溢出到磁盘而不是适合内存。您可以使用 EXPLAIN ANALYZE 计划检查溢出到磁盘的排序。例如，在 EXPLAIN ANALYZE 的输出中，如果看到类似“**Sort Method： external merge Disk： 7528kB**”的行，则至少 8MB 的work_mem将把中间数据保留在内存中并缩短查询响应时间。

### How much memory is used by Hash Operations?

The maximum memory a hash table can use is controlled by the following parameters:

- **work_mem:** This setting specifies the memory allocated for sorting and hash tables. Increasing work_mem allows for the creation of larger hash tables, which can improve the performance of hash joins.
- **hash_mem_multiplier:** This parameter calculates the maximum memory that hash-based operations are allowed to use, in relation to work_mem. The formula is:
    
    **  
    Total memory = work_mem * hash_mem_multiplier**
    [Understanding Hash aggregates and Hash Joins in PostgreSQL - Stormatics](https://stormatics.tech/alis-planet-postgresql/understanding-hash-aggregates-and-hash-joins-in-postgresql)
## SQL语句使用多少内存？

这个问题并不容易回答。从理论上讲，执行计划的每个步骤都应该受到`work_mem`的限制，但这通常不足以估计内存使用量：

- 单个语句可能具有许多占用大量内存的执行步骤，因此它可以多次分配`work_mem`
- 如果该语句使用[并行查询](https://www.postgresql.org/docs/current/parallel-query.html)，则可以创建不受 `work_mem` 限制的动态共享内存段
- 在 PostgreSQL v13 之前，如果优化器低估了条目数，哈希值可能会大大大于 `work_mem`
- 大型数据值（例如 `bytea` 二进制数据或大型 PostGIS 几何图形）将驻留在内存中，不受`work_mem`限制


## **maintenance_work_mem**

控制维护性操作的内存使用量,例如
`VACUUM, ANALYZE, CREATE INDEX, REINDEX; ALTER TABLE, ADD FOREIGN KEY, and MERGE JOIN `
可以在 系统级别或者会话级别进行设置

## temp_buffers
执行器(executor) 使用这个区域存储临时表
但是临时表也可能会用到 work_mem, 尤其是涉及排序与聚集的时候

需要注意: pgsql_tmp 与 temp_buffers 没有关系; pgsql_tmp 用于存储 大 hash 或者 sort排序操作的数据, 因为这种操作不是适合在  work_mem 中进
行的操作

如果 temp_buffers 设置 1GB, 临时表的数据占用 5GB, 那么 temp_buffers 会保存 1GB, 剩下的 4GB 会保存在磁盘中

# 其他问题
## Q1：PostgreSQL 如何使用内存进行读取操作？

当读取请求来自客户端时，PostgreSQL 首先检查请求的数据是否已经在缓冲区缓存中（shared_buffers）。如果不可用，PostgreSQL 会检查操作系统缓存中的数据。如果它仍然不存在，则它会从磁盘读取并将其存储在缓冲区缓存中。

PostgreSQL 使用“最近最少使用”（LRU） 算法来确定在需要为新数据腾出空间时从缓存中逐出哪些缓冲区。这意味着，将首先逐出未使用时间最长的缓冲区。但是，PostgreSQL 会尽量避免逐出可能很快再次使用的缓冲区

## Q2：PostgreSQL 如何使用内存进行写入操作？

在执行写入操作时，PostgreSQL首先将数据写入wal缓冲区，以确保数据的一致性和持久性。当事务提交或wal_buffers已满时，PostgreSQL 会发送 fsync 信号以将 wal 更改保存在 pg_xlog/pg_wal 文件夹中。WAL 包含对数据库所做的所有更改的顺序日志，用于确保数据的一致性和持久性。

将更改写入 WAL 后，PostgreSQL 会更新内存 （shared_buffers） 中的相应数据页。更改不会立即写入磁盘，而是在内存中保留一段时间。这称为“后写缓存”或“延迟写入”。

PostgreSQL使用“检查点”定期将脏数据（即尚未写入磁盘的更改）从内存刷新到磁盘。在检查点期间，PostgreSQL 将所有脏数据写入磁盘并更新 WAL 以反映更改。这确保了即使在系统发生故障时数据也是持久的。

## Q3: Vacuum 操作是如何使用 PG 内存的

首先 PG 扫描目标表, 构建一个 dead tuple 列表,并且尽可能地 freeze old tuples
这个列表存储在 maintence_work_mem 中
扫描完成之后, PG 会删除 指向 dead tuple 的索引元组

第二步，Vacuum 删除死元组，重新排序（排序）对齐剩余元组，并逐页更新 FSM（自由空间图）和 VM（可见性图）。
然后，Postgresql 会更新与每个目标表的 Vacuum 处理相关的统计信息和系统目录。


## Q4：索引创建和maintenance_work_mem有什么关系？
maintenance_work_mem 参数控制用于整个维护操作的内存量，包括索引创建、排序和其他维护操作。

PostgreSQL 读取正在索引的表数据，并使用 maintenance_work_mem 在内存中对其进行排序。如果排序所需的内存量超过maintenance_work_mem值，PostgreSQL 将使用基于磁盘的排序并在磁盘上创建临时文件。

## Q5:  PostgreSQL 中内存管理的其他准则是什么？

- 确保您的查询经过良好优化，并使用适当的索引。优化不当的查询可能会导致内存使用率过高，从而导致将大量数据加载到内存中。
- 确保正确分析和清理。因此，计划者将始终朝着更好的执行计划前进
- 如果查询在大型数据集上运行并应用了筛选器，请尝试对数据进行分区，因为这将减少内存使用量。
- 尝试使用连接池，例如 **pgbouncer**，它通过重用现有连接而不是创建新连接来减少内存占用。
- 如果数据集无法容纳在可用shared_buffers中，使用 SSD 也有助于提高性能。
- 尽可能使用高效的数据类型来减少内存使用量。此外，请确保设置列对齐方式以减少空间开销。
- 尝试**将temp_tablespace**参数更改为更快的磁盘或中间操作会加快速度。请点击此链接了解更多信息： [https://dev.to/bolajiwahab/postgresql-temp-files-usage-1gb9/](https://dev.to/bolajiwahab/postgresql-temp-files-usage-1gb9/)
- 使用以下链接调整 PostgreSQL 服务器参数
![](/images/Pasted%20image%2020250301134637.png)