---
title: "春季大扫除时间"
date: 2023-07-29
description: "冲刺胜过冲刺 我总是忙着做很多事情，就像你们大多数人一样。"
categories: ["PostgreSQL 培训"]
tags: ["PostgreSQL", "WAL", "分区表", "参数配置", "备份恢复", "流复制"]
series: []
---

[About wal_compression on PostgreSQL (portavita.github.io)](https://portavita.github.io/2019-05-13-blog_about_wal_compression/)


# 春季大扫除时间

冲刺胜过冲刺 我总是忙着做很多事情，就像你们大多数人一样。

在专业上，但在生活中也是如此，我认为时不时停下来看看后面是一种很好的做法。

我在哪里？是什么把我带到这里来的？我的方向是否正确？

作为定期评估的一部分，我还从头开始审查我心爱的数据库的配置。

因此，将逐行解析配置文件，以查看设置是否与当前工作负载和需求匹配。我还尝试了我过去没有考虑的参数，或者我认为“不适合我们”或“现在不适合”的参数。

一点一点地回顾所有内容听起来可能很无聊，但我可以告诉你这是一个有益的过程，人们可以从中学到很多东西。

今天我想和大家谈谈我是如何通过打开一个参数来节省 50% 的空间和带宽，并提高性能的。

# 魔力

它有时会被提及，大多被低估并经常被忽视。它是PostgreSQL 9.5中引入的一项功能，称为“wal_compression”。

PostgreSQL官方文档将其称为：

```
wal_compression (boolean)

When this parameter is on, the PostgreSQL server compresses a full page image written to WAL when full_page_writes is on or during a base backup. A compressed page image will be decompressed during WAL replay. The default value is off. Only superusers can change this setting.

Turning this parameter on can reduce the WAL volume without increasing the risk of unrecoverable data corruption, but at the cost of some extra CPU spent on the compression during WAL logging and on the decompression during WAL replay.
```

我很感兴趣，我决定试一试。

幸运的是，我的朋友詹金斯先生每天晚上都会进行一些pgbench测试，所以我已经准备好了一些基线，可以进行比较。

在打开wal_compression并运行 Jenkins 反对它之后，我立即被这个收获吓了一跳......

# 基准测试结果

## 介绍

在[Portavita](https://www.portavita.com/)，我们处理医疗数据，并且可能碰巧加密了磁盘或分区。

特别是某些在虚拟机上运行的数据库主机，在虚拟CPU上没有“aes”标志（阅读：加密缓慢而痛苦），并且也在HDD上运行。更糟糕的是，WAL并没有与Data分开（这让我哭了，但是......”要么接受，要么离开'）

## 结果

### 测试环境中的虚拟机

将此计算机视为最糟糕的情况，即 DBA 噩梦设置。

这是启用wal_compression时发生的情况。

减轻磁盘压力。

我们的业绩净增长100%。

还值得注意的是，CPU实际上不太忙，因为真正让CPU在此设置上忙碌的是加密。

![VM on HDD - encryption - no AES - no separate disks](https://raw.githubusercontent.com/Portavita/portavita.github.io/master/img/pgbench_dev.jpeg)

无需告诉您在哪个时间点启用了wal_compression！

### 固态硬盘上的生产主机

相反，您可以在这里看到主从设置的好处，该设置由本书配置并在SSD上运行。

由于我有它们可用，我可以向您展示现实生活中的数据。

如您所见，从启用wal_compression的那一刻起，我们的网络活动就减少了。

创建的 WAL 文件更少，从而减少磁盘活动以及随之而来的 WAL 存档相关网络流量。

所有这些都是以某些 CPU 周期为代价的。

![Bandwidth usage](https://raw.githubusercontent.com/Portavita/portavita.github.io/master/img/bandwidth_slave_prod.jpeg)

wal_compression已于9日上午11点左右打开。考虑到通过该链接，流和 WAL 复制都会发生。

![CPU impact](https://raw.githubusercontent.com/Portavita/portavita.github.io/master/img/cpu_prod_master.jpeg)

打开wal_compression时 CPU 使用率略高。

### 沃尔文件制作

在所有生产主机上，WAL 文件产量下降了 50%。

# 结论

只需一个设置，我们就可以节省磁盘空间、带宽和磁盘 IO。因此，我们可以更好地利用我们的宝贵资源。

每个数据库都值得考虑！

想法或意见？你可以在[LinkedIn](https://www.linkedin.com/in/fabiopardi/)上找到我

- [← 上篇文章](https://portavita.github.io/2018-10-31-blog_A_JSON_use_case_comparison_between_PostgreSQL_and_MongoDB/ "A JSON use case comparison between PostgreSQL and MongoDB")
- [下一篇文章 →](https://portavita.github.io/2019-06-14-blog_PostgreSQL_wal_log_hints_benchmarked/ "PostgreSQL: wal_log_hints benchmarked")

- [](https://github.com/portavita "GitHub")
 - [](https://twitter.com/portavita "Twitter")
 - [](mailto:f.pardi@portavita.eu "Email me")
 - [](https://linkedin.com/company/397468 "LinkedIn")

波塔维塔 BV • 2023

[主题：美丽杰基尔](http://deanattali.com/beautiful-jekyll/)

我们将此页面翻译为

切换为英语

ORIGINAL

About wal_compression on PostgreSQL