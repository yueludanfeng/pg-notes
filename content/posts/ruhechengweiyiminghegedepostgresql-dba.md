---
title: "如何成为一名合格的PostgreSQL DBA"
date: 2025-07-26
description: "- PostgreSQL的安装：[https://www.postgresql.org/download/](https://www.postgresql.org/download/) 安装PostgreSQL数据库。"
categories: ["PostgreSQL 笔记"]
tags: ["PostgreSQL", "VACUUM", "WAL", "分区表", "参数配置", "备份恢复", "安装部署", "流复制", "监控", "索引", "连接池", "逻辑复制", "高可用"]
series: []
---

## 门学习

- PostgreSQL的安装：[https://www.postgresql.org/download/](https://www.postgresql.org/download/) 安装PostgreSQL数据库。
- 熟悉数据库的启停，熟悉pg_ctl命令的使用
- 熟悉配置文件pg_hba.conf和postgresql.conf文件。
- psql的使用技巧：\l \d \x \c等命令，自动补全，如何查看配置参数？pg_settings
- PostgreSQL数据库的安装和配置。回答几个问题：a. 是否可以在一台机器上创建多套PG。同一个操作系统用户下是否可以创建出多套PG。
- PostgreSQL SQL技能：数据类型、函数、表、视图、触发器、分区表
- 主备库搭建：通过冷备份搭建的方法，通过pg_basebackup搭建的方法。如果让一个数据库变成只读？如何配置同步流复制？级联备库如何搭建？延迟备库如何搭建。

## 进阶学习：

- 数据库配置参数中每一项配置项的意义
- Gist、Gin、Brin索引
- 表的fillfactor
- mvcc原理
- wal日志原理
- pg_controldata
- pg_waldump
- VACUUM的原理和实践
- 逻辑复制的使用
- 物理备份与逻辑备份
- 数据库的升级
- 数据库的性能调优
- SQL的调优
- 常用插件：pg_stat_statements、pg_store_plans、pg_show_plans、oracle_fdw。
- 配套的软件：pgbouncer、plproxy、slony。
- 部分架构能力，如PostgreSQL中的读写分离的方案、数据路由的方案、高可用的方案。
- 常用的一些数据迁移工具的使用，如datax、ora2pg。
- 常用压测工具的使用：如pgbench、sysbench、benchmarksql
- Citus分布式数据库的学习
- Greenplum

## 其它的知识

### Linux的基本技能

如下：

- CentOS等常用发行版本的安装
- 常用命令： ls、ps、mv、rename、cp、mkdir、ln、less、grep
- 熟练使用vim
- 熟练使用ssh scp命令, /etc/ssh/sshd_config的配置，免密登录的方法
- 了解/etc/sysctl.conf的配置
- 增加组和用户，删除组用户 useradd userdel, groupadd groupdel, /etc/passwd, /etc/group
- 性能查看命令：top、iostat、sar (sar -n DEV 1)、vmstat
- LVM卷管理: pvs、lvs、vgs、pvcreate、vgcreate、lvcreate
- 分区命令: parted
- rsync的使用
- 网络命令：ifconfig、ip、route 、netstat, rourte print、netstat -an，如何查看某个端口被那个进程占用了？ /etc/sysconfig/network-scripts/ifcfg-eth0配置文件
- 查看时区: date -R
- 查看主机名和修改主机名：hostname、hostnamectl，文件/etc/hosts
- 包管理命令：yum、rpm, /etc/yum.repos.d/XXX
- 文件系统的命令：df -h， mount，umount, /etc/fstab

### 其它技能

如下：

- 网络的基本知识：子网、掩码、路由、网关，arp协议、arp攻击的原理。
- shell脚本的学习
- python的学习
- 常用高可用软件如keepalive、haproxy
- 监控软件Zabbix、prometheus+grafa

来源: [文章：如何成为一名合格的PostgreSQL DBA (csudata.com)](https://www.csudata.com/csu_article/10111)