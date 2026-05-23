---
title: "介绍"
date: 2023-07-29
description: "*#PostgreSQL  #wal_log_hints #事业编"
categories: ["PostgreSQL 培训"]
tags: ["WAL", "wal_log_hints", "参数配置"]
series: []
---

*#PostgreSQL  #wal_log_hints #事业编 

[PostgreSQL: wal_log_hints benchmarked (portavita.github.io)](https://portavita.github.io/2019-06-14-blog_PostgreSQL_wal_log_hints_benchmarked/)



# 介绍
我发现“pg_rewind”是一个很酷的功能，出现在 Postgres 9.5 的主副本环境中。它是管理主副本数据库的好盟友。

手册是这样定义的：synchronize a PostgreSQL data directory with another data directory that was forked from the first one.

我认为该功能在某些情况下非常方便，但我改天再谈，因为今天我想谈谈与之相关的东西：wal_log_hints。

Wal_log_hints 是一个 Postgres 配置参数，需要启用该参数才能使用 pg_rewind。当想要使用数据校验和时，也需要它。

它被定义为：

wal_log_hints (boolean)

    When this parameter is on, the PostgreSQL server writes the entire content of each disk page to WAL during the first modification of that page after a checkpoint, even for non-critical modifications of so-called hint bits.

    If data checksums are enabled, hint bit updates are always WAL-logged and this setting is ignored. You can use this setting to test how much extra WAL-logging would occur if your database had data checksums enabled.

    This parameter can only be set at server start. The default value is off.
基本上，为了能够使用数据校验和或 pg_rewind 功能，需要在 WAL 文件中记录更多信息，这通常在性能和资源方面是有代价的。

像往常一样，在 Portavita，我们喜欢做出明智的决定，所以我花时间得到了一些数字。

它可能不代表生产负载，但它应该为我们提供一些方向。

# 测试内容
我使用我们心爱的 pgbench 工具来运行测试。我首先运行它来初始化数据，然后再次运行它进行查询。这里没什么特别的。

我计算了每次运行后生成的 WAL 文件的数量。

作为旁注，我应该提到检查点在每次运行时都会调用几次，我没有注意到测试中的 CPU 使用率有太大差异。

设置的设置
配置文件的相关部分：

checkpoint_completion_target = 0.9
max_wal_size =  1536 MB
wal_log_hints = 关闭
第一个测试作为基线运行。

pgbench -i -s 100

它产生 76 个 WAL 文件

pgbench -c 4 -s 100 -j 1 -M prepared -b tpcb-like -T 60

使生成的文件总数达到 162 个

wal_log_hints = 打开
pgbench -i -s 100

它产生 176 个 WAL 文件

pgbench -c 4 -s 100 -j 1 -M prepared -b tpcb-like -T 60

使生成的文件总数达到 272 个

Comparing wal_log_hints

这意味着当远程存档 WAL 文件时，wal_log_hints 花费的空间、磁盘工作负载和最终网络成本增加了 67%。

这是很多。这可能是一个好的事业，但仍然很多。

还有更多..
但。。。等。

在上一篇文章中，我们谈到了 wal_compression，以及这有多酷。以及使用它我们可以节省多少。

所以我尝试在启用 wal_compression 时重复测试。

wal_log_hints = 关闭

产生了 82 个 WAL 文件

wal_log_hints = 打开

生产了其中的 85 个

With_wal_compression_enabled

# 结论
如果您已经在使用 wal_compression 那么启用 wal_log_hints 就会很便宜，这为 pg_rewind 和数据校验和铺平了道路，两者都值得探索。

如果您改为使用默认设置 wal_compression（关闭），那么启用 wal_log_hints 将是有代价的，我建议您密切关注性能和磁盘空间。

想法或意见？你可以在 LinkedIn 上找到我