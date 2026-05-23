---
title: "盘古云"
date: 2023-06-26
description: "https://mp.weixin.qq.com/s/5EtPl_OaCFpTyxNHKTnCiA"
categories: ["锁与并发"]
tags: ["VACUUM", "WAL", "内存管理", "分区表", "备份恢复", "执行计划", "流复制", "监控", "索引", "统计信息", "逻辑复制", "锁", "面试", "高可用"]
series: []
---

https://mp.weixin.qq.com/s/5EtPl_OaCFpTyxNHKTnCiA

- postgres 的 MVCC 实现原理，跟 oracle 对比的差异，优缺点
    
- autovacuum进程的作用，进程都会负责哪些任务
    
- vacuum freeze的作用，为什么要freeze
    
- analyze更新统计信息，统计信息都包含哪些信息，有什么作用
    
- 数据库是如何防止事务id回卷的
    
- wal的作用
    
- commit log的作用
    
- full_page_write是做什么的
    
- 高并发数据库wal量太大，如何优化
    
- 检查点的优化思路
    
- 解释hot update的实现思路和意义
    
- 如何监控和提高hot update的比例
    
- 生产系统SQL慢，如何分析
    
- 查询走索引一定会快么
    
- 数据库如何判断是否走索引
    
- 连接时的几种连接路径，比如嵌套循环连接，还有哪些
    
- 几种连接路径的适用场景，通过实现原理解释一下
    
- 某绑定变量SQL在java程序中执行速度慢，在数据库中执行速度快，如何进行分析
    
- 按存储结构划分，postgresql支持哪些索引类型，都分别适合在什么应用场景下使用
    
- 简单说一下gin索引的存储结构
    
- gin索引的fast update是如何实现的，什么情况下会导致性能问题
    
- 简述vm和fsm文件都是做什么的，文件丢失有什么影响，如何恢复
    
- 新增字段并设置已有数据这个字段的值为1，在pg13下怎么操作最适合，是哪个版本增加的特性，
    
- pg9.6版本下同样的命令数据库会怎么执行
    
- 通过增加concurrent关键字创建索引，好处是什么，缺点是什么
    
- 自定义函数创建函数索引时有什么要求，简单描述 VOLATILE 函数和 IMMUTABLE 函数的区别，
    
- now()和clock_timestamp()两个函数分别属于哪种函数
    
- 物化视图和普通视图的区别，postgres支持的刷新方式
    
- 物化视图的适用场景
    
- 解释软解析的概念，针对SQL访问非均衡数据时执行计划不准确的问题，你们是怎么解决的
    
- 流复制和逻辑复制的区别，以及各自的适用场景
    
- wal_level有哪些级别，区别是什么
    
- 同步流复制和异步流复制的区别
    
- 复制槽的作用
    
- 简述synchronous_commit的不同级别的区别，各自适合的应用场景
    
- 备机如何进行日志归档
    
- 流复制备库如何提升为主库，提升后如何重新作为备库加回集群
    
- 常用的postgresql高可用架构，你们之前用的哪种
    
- 如何记录和分析数据库的慢SQL，你们之前公司是如何做的
    
- 如何定位锁等待问题是哪个进程导致的
    
- 解释一下死锁的概念，死锁怎么处理
    
- postgresql如何跨库访问、如何访问外部文件
    
- random_page_cost，一般优化时有什么建议，从原理层
- 
- 面给出原因
# cc
https://mp.weixin.qq.com/s/DCmO1E31JAbec1M05y2_UQ


PostgreSQL 15 如约和各位正式见面啦！包括改进的排序性能，流行的 MERGE 命令，更多的压缩算法支持，以及更多用于观察/调整数据库状态的功能，PGer 又可以过年了。随着 PostgreSQL 热度的不断提升，市场上岗位也在随之增多，相较于笔者 18 年辞职的时候，那简直是一个天上一个地下，赶着金九银十的尾巴，在此也整理一些常见的面试题（以我的角度，我会关心的点，可以了解一个人对 PostgreSQL 的掌握程度），让各位能在 PG 的面试中如鱼得水，一起头脑风暴一下吧！

- MVCC 实现机制以及和 Oracle 的差异
    
- 为什么会有表膨胀及表膨胀的危害
    
- 长事务的危害以及如何溯源长事务
    
- 子事务的危害和注意事项
    
- 表结构变更哪些操作是非 online 的
    
- 物理备份需要注意什么（pg_start_backup）
    
- 逻辑备份是如何确保一致性的
    
- WAL 堆积的原因有哪些
    
- 长连接的危害是什么
    
- infomask 标志位的作用是什么
    
- 空值是如何存储的以及索引是否存储空值
    
- 为什么需要有全页写（full_page_write）
    
- 索引失效的各种原因
    
- commit log 的作用
    
- 数据库的连接方式以及各自适用的场景
    
- 各种索引的适用场景（HASH/GIN/BTREE/GIST/BLOOM/BRIN）
    
- 行锁是如何实现的，行锁是否会存储在共享内存中
    
- 流复制和逻辑复制的区别以及各自适用的场景
    
- 流复制冲突是什么以及为什么会产生复制冲突
    
- 简述 PostgreSQL 中的权限体系
    
- 常见的高可用方案以及高可用选型及优缺点
    
- synchronous_commit 五种级别的区别，为什么备库的查询不能立马看到主库插入的数据
    
- 事务 ID 回卷的原因以及如何维护优化
    
- vacuum / autovacuum 的作用以及如何调优
    
- 函数三态以及函数为什么需要有 execute
    
- 为什么要使用 create index concurrently 以及 CIC 的危害
    
- HOT 原理
    
- PostgreSQL中是否有锁升级
    
- 复制槽的作用以及复制槽的危害
    
- 为什么会有死锁以及死锁检测机制
    
- SQL 慢能从哪些方面入手排查
    
- 为什么需要使用分区表以及分区表的优势和劣势
    
- 软硬解析的概念
    
- vm / fsm / init 文件是什么
    

这些是关于数据库自身的一些比较典型的问题和原理，需要掌握。另外由于数据库和操作系统息息相关，关于操作系统相关的知识也得多多了解，比如

- 内存回收机制：kswapd/direct memory reclaim/pdflush
    
- 进程调度，D进程的危害和形成原因
    
- 抓包解包，分析 PostgreSQL 协议
    
- 存储，SAN/NAS/DAS
    
- 一条 IO 请求的生命周期
# CSDN 博主总结答案
[(21条消息) 《PostgreSQL面试题集锦》学习与回答_postgresql 面试题_Hehuyi_In的博客-CSDN博客](https://blog.csdn.net/Hehuyi_In/article/details/128885660)
