---
title: "应急处理"
date: 2023-08-28
description: "![](/images/attachments/PostgreSQL应急流程.png)"
categories: ["VACUUM与膨胀"]
tags: ["WAL", "流复制", "逻辑复制"]
series: []
---

![](/images/attachments/PostgreSQL应急流程_1.png)
逻辑复制下: 大事务
流复制下: 备库
wal_log_hint 会导致写放大

cannot freeze committed xmax 
ø