---
title: "PostgreSQL 进程架构"
date: 2025-01-12
description: "![image-20230629202257522](/images/image-20230629202257522.png)"
categories: ["PostgreSQL 笔记"]
tags: ["PostgreSQL", "VACUUM", "WAL", "内存管理", "参数配置", "备份恢复", "流复制", "索引", "统计信息", "逻辑复制"]
series: []
---

![image-20230629202257522](/images/image-20230629202257522_1.png)



```bash
[pgsql@mysql01 ~]$ ps -ef | grep postgres | grep -v grep 
pgsql     87353      0  0 Jun27 ?        00:00:05 /usr/local/pgsql/bin/postgres
pgsql     87354  87353  0 Jun27 ?        00:00:00 postgres: logger 
pgsql     87356  87353  0 Jun27 ?        00:00:00 postgres: checkpointer 
pgsql     87357  87353  0 Jun27 ?        00:00:01 postgres: background writer 
pgsql     87358  87353  0 Jun27 ?        00:00:01 postgres: walwriter 
pgsql     87359  87353  0 Jun27 ?        00:00:04 postgres: autovacuum launcher
pgsql     87360  87353  0 Jun27 ?        00:00:09 postgres: stats collector 
pgsql     87361  87353  0 Jun27 ?        00:00:00 postgres: logical replication launcher
pgsql     87363  87353  0 Jun27 ?        00:00:00 postgres: pgsql test [local] idle
pgsql     94257  87353  0 Jun29 ?        00:00:00 postgres: pgsql test [local] idle
[pgsql@mysql01 ~]$ 
```



## 各进程作用

### postmaster

postmaster进程的主要职责有：

*  数据库的启停。

*  监听客户端连接。

*  为每个客户端连接fork单独的postgres服务进程。

*  当服务进程出错时进行修复。

*  管理数据文件。

* 管理与数据库运行相关的辅助进程。

### 会话服务进程

新的客户端连接请求到来, postmaster 接受到该请求之后, 会 fork 一个子进程(会话服务进程)来服务该客户端

### 后台辅助进程 

* logger 进程: 

  系统服务运行日志, 需要在 PG 配置文件中将 logging_collection 参数设置为 on

* archiver 进程:

  负责将日志文件进行归档

* stat collector 进程:

  包括一个表和索引进行了多少次的插入、更新、删除操作，磁盘块读写的次数、行的读次数。pg_statistic 中存储了PgStat 收集的各类信息

* wal writer 进程: 由于WAL 机制 , 需要将 wal record 写入 WAL FILE 中

* autovacuum进程: 

  **根据一定阈值条件来触发**

  * vacuum: 清理(移除) dead tuple 以及对应的索引元组
  * analyze: 更新相关统计信息
  * 更新 pg_class与 pg_statistics 表
  * freeze: 冻结老元组的事务标志

* checkpointer 进程:
  [ Postgresql之checkpooint_PostgreSQL运维技术的博客-CSDN博客](https://blog.csdn.net/qq_35462323/article/details/115323089)
```bash
- 将共享内存中的脏页刷出到磁盘。    
- 生成checkpoint记录到xlog中（注意看这里，Checkpoint 本身也会被记录到XLOG）
- **更新pg_control文件**，其中有checkpoint的lsn信息（后期恢复可以从这个文件读取checkpoint的lsn)


# 触发时机
checkpoint的触发时机是什么？

- 超级用户（其他用户不可）执行CHECKPOINT命令    
- 数据库shutdown    
- XLOG日志量达到了触发checkpoint阈值    
- 周期性地进行checkpoint    
- pg_basebackup 时候
- 数据库recovery完成
- 需要刷新所有脏页
```


* bgwriter 进程:
1. 将脏数据刷入磁盘
2. 与 checkpoint 区别
	1. checkpoint 是会在特定时间间隔刷新所有脏页, 并创建检查点, 用于后面做数据库的恢复
	2. 而 bgwriter 刷脏是在两个检查点事件之间批量刷, 提高了 IO 速度 (频繁刷肯定不行), 同时提供了更干净的页面以便于使用
	二者目的与执行频率不相同

# PG 内存架构
![image-20230629202820530](/images/image-20230629202820530.png)

## Local memory area 本地内存区域

由每个后端进程分配供自己使用。

* work_mem: 

  用于排序(比如 `ORDER BY`, `DISTINCT`, and merge join ) 与 hash 表( hash join 会用到)

* maintence_work_mem: 用于数据库维护操作(比如:  `VACUUM`, `CREATE INDEX`, and `ALTER TABLE ADD FOREIGN KEY`)

* temp_buffers: 执行器使用此区域存储临时表,  这个配置是会话级别的 ,而且只有在本会话中第一次使用临时表之前才能修改生效,  在会话随后的改变是没有效果的

## Shared memory area 共享内存区域

由 PostgreSQL 服务器的所有进程使用。

* shared buffer :	PostgreSQL 将表和索引中的页面从持久存储加载到这里，并直接操作它们。
* WAL buffer:	为了保证数据不因服务器故障而丢失，PostgreSQL支持WAL机制。WAL data(也称XLOG records)是PostgreSQL中的事务日志;WAL buffer是WAL数据写入持久存储之前的缓冲区域。
* commit log:	提交日志(CLOG)保存所有事务(如in_progress,committed,aborted)的状态，用于并发控制(CC)机制。
  

# 逻辑结构

![image-20230630134501966](/images/image-20230630134501966-8103904.png)

# 物理结构

![image-20230630135040767](/images/image-20230630135040767.png)

## **文件和目录相关作用描述**

| **files**                         | **description**                                              |
| --------------------------------- | ------------------------------------------------------------ |
| PG_VERSION                        | 包含postgresql主版本号的文件                                 |
| pg_hba.conf                       | 控制postgresql客户端验证的文件 控制PG客户端认证文件 主机 数据库 用户 ip地址 认证方式 |
| pg_ident.conf                     | 控制postgresql用户名映射的文件, 配置操作系统用户和数据库服务器上的用户映射 |
| postgresql.conf                   | 配置参数文件                                                 |
| postgresql.auto.conf              | 用于存储在ALTER SYSTEM（版本9.4或更高版本）中设置的配置参数的文件 |
| postmaster.opts                   | 记录服务端上一次启动的命令行选项                             |
| **subdirectories**                | **description**                                              |
| base/                             | 包含每个数据库子目录的子目录                                 |
| global/                           | 包含群集范围表的子目录，例如pg_database和pg_control          |
| pg_commit_ts/                     | 包含事务提交时间戳数据的子目录。 9.5版本以后                 |
| pg_clog/ (Version 9.6 or earlier) | 包含事务提交状态数据的子目录。它在版本10中重命名为pg_xact. CLOG将在5.4章节中详解。. |
| pg_dynshmem/                      | 包含动态共享内存子系统使用的文件的子目录。9.4版本以后        |
| pg_logical/                       | 包含逻辑解码的状态数据的子目录。9.4版本以后                  |
| pg_multixact/                     | 包含多事务状态数据的子目录（用于 shared row locks）          |
| pg_notify/                        | 包含LISTEN / NOTIFY状态数据的子目录                          |
| pg_repslot/                       | 包含复制槽数据的子目录（9.1版本以后）                        |
| pg_serial/                        | 包含有关已提交的序列化事务（9.1版本以后）信息的子目录        |
| pg_snapshots/                     | 包含导出快照的子目录（9.2版本以后）。 PostgreSQL的函数pg_export_snapshot在此子目录中创建快照信息文件 |
| pg_stat/                          | 包含统计子系统永久文件的子目录                               |
| pg_stat_tmp/                      | 包含统计子系统临时文件的子目录                               |
| pg_subtrans/                      | 包含子事物状态数据的子目录                                   |
| pg_tblspc/                        | 表空间符号链接目录                                           |
| pg_twophase/                      | 包含prepare事务的状态文件                                    |
| pg_wal/ (Version 10 or later)     | 包含WAL（Write Ahead Logging）段文件的子目录。在版本10中从pg_xlog重命名而来. |
| pg_xact/ (Version 10 or later)    | 包含事务提交状态数据的子目录。在版本10中从pg_clog重命名而来.CLOG将在5.4章节中详解 |
| pg_xlog/ (Version 9.6 or earlier) | 包含WAL（Write Ahead Logging）段文件的子目录。在版本10中重命名为pg_wal |



## **表空间跟数据库关系**

### Oracle 与 PG 的对比

在Oracle数据库中；一个表空间只属于一个数据库使用；而一个数据库可以拥有多个表空间。属于"一对多"的关系
在PostgreSQL集群中；一个表空间可以让多个数据库使用；而一个数据库可以使用多个表空间。属于"多对多"的关系。

### PG 系统自带表空间

表空间pg_default是用来存储系统目录对象、用户表、用户表index、和临时表、临时表index、内部临时表的默认空间。对应存储目录``$PADATA/base/``
表空间pg_global用来存放系统字典表；对应存储目录`$PADATA/global/`
