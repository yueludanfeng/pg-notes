---
title: "pg windows 环境注册成服务"
date: 2024-09-28
description: "```bash"
categories: ["索引"]
tags: ["PostgreSQL"]
series: []
---

```bash
pg_ctl.exe register -N "PostgreSQL" -U "NT AUTHORITY\NetworkService" -D "C:/Program Files/postgresql/pgsql/bin/pgsql/data" -w
```