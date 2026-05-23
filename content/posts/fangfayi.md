---
title: "方法一"
date: 2023-06-28
description: "* grep 进程名"
categories: ["PostgreSQL 运维"]
tags: ["PostgreSQL"]
series: []
---

* grep 进程名

```
[root@iZ25p102vo3Z ~]# ps -eo pid,lstart,etime,cmd | grep nginx
16968 Fri Mar  4 16:04:27 2016 41-21:14:04 nginx: master process /usr/sbin/nginx
17826 Fri Mar  4 22:53:51 2016 41-14:24:40 nginx: worker process
18312 Fri Apr 15 13:18:31 2016       00:00 grep --color=auto nginx

```
# 方法二
* 指定进程号
```
ps -p PID -o lstart,etime 
```
> 参考：
> https://jaminzhang.github.io/linux/using-ps-to-view-process-started-and-elapsed-time-in-linux/
> https://blog.51cto.com/leomars/1888213