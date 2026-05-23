---
title: "cache lookup failed for type 75083631"
date: 2023-07-14
description: "```sql"
categories: ["内存管理"]
tags: ["索引"]
series: []
---

[Re: ERROR: XX000: cache lookup failed for type 75083631 — Postgresql General Discussion (spinics.net)](https://www.spinics.net/lists/pgsql/msg211097.html)

```sql
select * from pg_type where oid = 75083631;
select * from pg_depend where objid = 75083631;  
select * from pg_depend where refobjid = 75083631;

```

1. Verify that the type OID is wrong:  
        select * from pg_type where oid = 75083631;  
If that finds a row then we've got a whole other set of issues.  
(BTW, if you want to be really sure, forcing a seqscan for this  
query or reindexing pg_type could be advisable.)  
  
2. Check for bogus entries in pg_depend:  
        select * from pg_depend where objid = 75083631;  
        select * from pg_depend where refobjid = 75083631;  
  
3. If there's just one hit in pg_depend then it's probably  
safe to delete that row.