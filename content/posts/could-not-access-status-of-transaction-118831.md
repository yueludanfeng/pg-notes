---
title: "could not access status of transaction 118831"
date: 2023-07-14
description: ">  参考: [PostgreSQL学习随笔2 clog(xact)损坏 - 墨天轮 (modb.pro)](https://www.modb.pro/db/85220)"
categories: ["备份恢复与高可用"]
tags: ["备份恢复"]
series: []
---

>  参考: [PostgreSQL学习随笔2 clog(xact)损坏 - 墨天轮 (modb.pro)](https://www.modb.pro/db/85220)


 * ERROR: could not access status of transaction 118831
 
 * 通过 dd 命令伪造文件数据:
```bash
  dd if=/dev/zero of=<data directory location>/pg_clog/0001 bs=256 K count=1
```
 
 * 全量备份数据库, 并重新初始化一个实例, 然后进行恢复数据库操作
 
