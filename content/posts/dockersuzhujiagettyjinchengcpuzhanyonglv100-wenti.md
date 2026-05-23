---
title: "Docker宿主机agetty进程cpu占用率100% 问题"
date: 2023-07-30
description: "在容器与宿主机上都执行如下命令"
categories: ["PostgreSQL 笔记"]
tags: ["CPU", "Docker"]
series: []
---

[(7条消息) Docker宿主机agetty进程cpu占用率100% 问题_docker info 宿主机cpu数量_bobpen的博客-CSDN博客](https://blog.csdn.net/bobpen/article/details/78559263)

在容器与宿主机上都执行如下命令

```bash
systemctl stop getty@tty1.service
systemctl mask getty@tty1.service
```

