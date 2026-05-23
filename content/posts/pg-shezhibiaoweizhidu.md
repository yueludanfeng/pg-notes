---
title: "PG 设置表为只读"
date: 2023-08-11
description: "```sql"
categories: ["安全与权限"]
tags: ["只读"]
series: []
---

```sql
ALTER TABLE t1 ENABLE TRIGGER ALL;

ALTER TABLE t1 ENABLE RULE ALL;

REVOKE ALL ON TABLE t1 FROM PUBLIC;

REVOKE ALL ON TABLE t1 FROM username;

GRANT SELECT ON TABLE t1 TO PUBLIC;

你可以根据需要对特定用户或用户组设置只读权限，而不仅仅是 "PUBLIC" 用户组。此外，当您将表设置为只读后，只有具有适当权限的用户才能执行写操作，其他用户只能进行查询操作。
```