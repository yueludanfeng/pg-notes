---
title: "查看当前持续时间超过 1h 的活跃长事务"
date: 2023-08-16
description: "```sql"
categories: ["PostgreSQL 笔记"]
tags: ["PostgreSQL"]
series: []
---

```sql
-- 查看当前持续时间超过 1h 的活跃长事务

select

sum(

case when

state<>'idle'

and (backend_xid is not null or backend_xmin is not null )

and (now()-xact_start between '1 hour'::interval and '3 hours'::interval )

then 1

else 0

end

) as long_xact_1h

from pg_stat_activity;
```