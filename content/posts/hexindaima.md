---
title: "核心代码"
date: 2023-07-07
description: "> 将 fpp_xxx_pkey 替换为实际的索引名称即可"
categories: ["PostgreSQL 笔记"]
tags: ["索引"]
series: []
---

> 将 fpp_xxx_pkey 替换为实际的索引名称即可
```sql
SELECT bt_index_check(index => c.oid, heapallindexed => i.indisunique),  
               c.relname,  
               c.relpages  
FROM pg_index i  
JOIN pg_opclass op ON i.indclass[0] = op.oid  
JOIN pg_am am ON op.opcmethod = am.oid  
JOIN pg_class c ON i.indexrelid = c.oid  
JOIN pg_namespace n ON c.relnamespace = n.oid  
WHERE am.amname = 'btree' AND n.nspname = 'public'  
-- Don't check temp tables, which may be from another session:  
AND c.relpersistence != 't'  
AND c.relname = 'fpp_xxx_pkey'  -- 这里替换为 具体的索引名称
-- Function may throw an error when this is omitted:  
AND c.relkind = 'i' AND i.indisready AND i.indisvalid  
ORDER BY c.relpages DESC LIMIT 10;
```
# 参考 :
https://mp.weixin.qq.com/s/kLoqJIsozTp-Qz5H6bcxXw
[Using amcheck to check PostgreSQL 10 indexes for corruption (integrity checking) - Discourse / Discourse System Administration - Unix Linux Community](https://community.unix.com/t/using-amcheck-to-check-postgresql-10-indexes-for-corruption-integrity-checking/378659)






