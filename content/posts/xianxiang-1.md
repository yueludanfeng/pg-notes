---
title: "现象"
date: 2024-12-08
description: "【研发】广州金碧华府VMS-U500 局点环境 服务异常停止"
categories: ["PostgreSQL 案例"]
tags: ["PostgreSQL"]
series: []
---

【研发】广州金碧华府VMS-U500 局点环境 服务异常停止

# 分析定位过程

● 查看 PG 数据库日志

查看数据库日志是 UTC 时间 02:41:18 也就是北京时间 10:41:18 数据库接受到了停止命令

● 查看系统 messages 日志

查看 /var/log/messages 日志, 可以看到也是 10:41:18 这个时刻 pts4 终端上 root 用户切换到了 postgres 用户, 在同一秒 切换用户并停库, 大概率是脚本中调用停库命令停止的, 比如 server.sh stop
![](/images/Pasted%20image%2020241208154339.png)

* 查看server.sh 日志

查看 /var/log/cluster/imos.log 10:41:18附近日志 发现是 10:41:02 左右执行过 server.sh stop
![](/images/Pasted%20image%2020241208154412.png)

* 查看 server.sh 脚本
![](/images/Pasted%20image%2020241208154437.png)

先停止 daemon 再停止 vm, 接着停 pg; 与日志打印是一致的

●

查看定时任务日志

查看定时任务没有 10:41附近的日志, 说明应该不是定时任务导致的 server.sh stop

  
* 查看终端信息

查看命令行历史命令, 找到 pts4 终端
![](/images/Pasted%20image%2020241208154512.png)

●

查看 history 历史命令

发现可以命令 2024-12-05 10:41:02 cli
![](/images/Pasted%20image%2020241208154533.png)


cli 命令看全路径应该是与驱动相关

与相关开发沟通确认, 是执行 cli 会自动执行 server.sh stop

后面与一线沟通, 是一线有人查询序列号(通过 cli) 执行了 cli



