---
title: "Pass array to IN conditional(将 数组 转换为 IN 条件)"
date: 2023-07-28
description: "```sql"
categories: ["PostgreSQL 笔记"]
tags: ["PostgreSQL"]
series: []
---

[(1) PostgreSQL (reddit.com)](https://www.reddit.com/r/PostgreSQL/comments/15b405d/pass_array_to_in_conditional/)

```sql
test=# SELECT unnest(string_to_array('hello,world,how,are,you,doing', ','));
 unnest 
--------
 hello
 world
 how
 are
 you
 doing
(6 rows)



SELECT officeaddress FROM ofices WHERE country = $1 AND posstalcode IN (SELECT unnest(string_to_array($2, ',')));

If $2 is an array, then just do `posstalcode = any( $2 )`
```