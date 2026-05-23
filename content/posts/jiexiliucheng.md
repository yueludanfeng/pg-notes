---
title: "解析流程"
date: 2024-08-30
description: "```bash"
categories: ["SQL 优化"]
tags: ["执行计划"]
series: []
---

[PostgreSQL “绑定变量窥视” |作者：弗兰克·帕肖特 |中等 (medium.com)](https://franckpachot.medium.com/postgresql-bind-variable-peeking-fb4be4942252)


# 解析流程
```bash
The use of bind variables eliminates the parse step for every bound query after the first. This step is not represented in the explain plan. However, the planning and query execution occur after the bind step, which is why your explain plan doesn't work.

Here is the basic flow of building a query in PostgreSQL (at least the last time I used it, which has been a few years):

Receive -> Parse -> Bind -> Plan -> Execute -> Return
```
[sql - How to Explain a query in PostgreSQL 8.3 that has bind variables - Server Fault](https://serverfault.com/questions/61409/how-to-explain-a-query-in-postgresql-8-3-that-has-bind-variables)


@空扥赛发@(2023) @2023-11-04

(@)

