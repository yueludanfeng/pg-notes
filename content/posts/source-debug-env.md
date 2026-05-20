---
title: "读源码前先搭一个可调试环境"
date: 2026-04-16
description: "用最小步骤准备 PostgreSQL 编译、启动、断点和日志观察。"
categories: ["读书笔记"]
tags: ["PostgreSQL", "源码", "调试"]
series: ["源码阅读"]
---

源码阅读最怕只读不跑。先搭一个能编译、能启动、能打日志的环境，理解会快很多。

## 基本流程

```bash
./configure --enable-debug --enable-cassert
make -j
make install
```

然后初始化一个独立的数据目录，避免影响本机已有数据库。

## 阅读建议

先围绕一个具体问题读源码，例如一次查询如何进入 executor，或者一条 update 如何生成新版本。问题越具体，越容易形成闭环。
