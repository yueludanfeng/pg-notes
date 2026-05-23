---
title: "事务状态宏定义 :"
date: 2023-07-15
description: "```bash"
categories: ["体系结构"]
tags: ["PostgreSQL"]
series: []
---

# 事务状态宏定义 :
```bash
#define TRANSACTION_STATUS_IN_PROGRESS    0x00

#define TRANSACTION_STATUS_COMMITTED      0x01

#define TRANSACTION_STATUS_ABORTED        0x02

#define TRANSACTION_STATUS_SUB_COMMITTED  0x03
```


>