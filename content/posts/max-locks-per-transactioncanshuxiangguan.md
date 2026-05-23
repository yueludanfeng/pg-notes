---
title: "max_locks_per_transaction参数相关"
date: 2025-11-16
description: "我们可以在共享内存中保留的锁的数量为max_connections x max_locks_per_transaction。请记住，行级锁与此不相关"
categories: ["PostgreSQL 运维"]
tags: ["内存管理", "参数配置", "锁"]
series: []
---

[数据库 - PostgreSQL：您可能需要增加MAX_LOCKS_PER_TRANSACTION - 个人文章 - SegmentFault 思否](https://segmentfault.com/a/1190000038589099)

我们可以在共享内存中保留的锁的数量为max_connections x max_locks_per_transaction。请记住，行级锁与此不相关

4. 常见的DDL会和所有的锁冲突，所以建议在执行DDL之前加上lock_timeout，防止雪崩，在pg_locks里面可以存放的最大锁的数量是

max_locks_per_transactions * max_connections，超过了就会提示out of shared memory。

5 锁的大小是有上限的，默认大小是如下两个参数的乘积，max_locks_per_transaction * max_connections，超过就会out of shared memory


