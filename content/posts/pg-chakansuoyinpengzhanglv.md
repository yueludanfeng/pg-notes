---
title: "PG 查看索引膨胀率"
date: 2024-08-30
description: "> 参考: [How to check and resolve Bloat in PostgreSQL - Highgo Software Inc.](https://www.highgo.ca/2021/03/20/how-to-chec"
categories: ["PostgreSQL 笔记"]
tags: ["VACUUM", "索引", "膨胀"]
series: []
---

# PG 查看索引膨胀率
> 参考: [How to check and resolve Bloat in PostgreSQL - Highgo Software Inc.](https://www.highgo.ca/2021/03/20/how-to-check-and-resolve-bloat-in-postgresql/)


```sql
postgres=# SELECT pg_relation_size('test') as table_size, 
postgres-#       pg_relation_size('test_x_idx') as index_size,
postgres-#       100-(pgstatindex('test_x_idx')).avg_leaf_density as bloat_ratio;
 table_size | index_size |    bloat_ratio    
------------+------------+-------------------
   68272128 |   22487040 | 9.939999999999998
(1 row)

postgres=# UPDATE test SET x = x + 2 WHERE x % 2 = 0;
UPDATE 333334
postgres=# SELECT pg_relation_size('test') as table_size, 
postgres-#       pg_relation_size('test_x_idx') as index_size,
postgres-#       100-(pgstatindex('test_x_idx')).avg_leaf_density as bloat_ratio;
 table_size | index_size | bloat_ratio 
------------+------------+-------------
   69976064 |   44941312 |       41.08
(1 row)
```

# 估算表和索引膨胀工具
* *[ioguix/pgsql-bloat-estimation: Queries to mesure statistical bloat in indexes and tables for PostgreSQL (github.com)](https://github.com/ioguix/pgsql-bloat-estimation)

* 应该更有名下: *[pgx_scripts/bloat/index_bloat_check.sql at master · pgexperts/pgx_scripts (github.com)](https://github.com/pgexperts/pgx_scripts/blob/master/bloat/index_bloat_check.sql)


[🔥萧炎承诺七阶天毒蝎龙兽魔核帮助小医仙控制厄难毒体，一人之力击退慕兰三老！【斗破苍穹 Battle Through the Heavens】 - YouTube](https://www.youtube.com/watch?v=BkbglBZtZJc&ab_channel=%E7%83%AD%E8%A1%80%E5%8A%A8%E6%BC%AB%E7%A4%BE)
```embed
title: "🔥萧炎承诺七阶天毒蝎龙兽魔核帮助小医仙控制厄难毒体，一人之力击退慕兰三老！【斗破苍穹 Battle Through the Heavens】"
image: "https://img.youtube.com/vi/BkbglBZtZJc/maxresdefault.jpg"
description: "Drama Name:《斗破苍穹 Battle Through the Heavens》#fightsbreaksphere #萧炎 #chineseanime#btth #热血动漫社#中国动漫#薰儿#天蚕土豆#热血#国漫#​小说改编#出色中国电视剧​#好看中国电视剧​#动漫 #大陆剧#玄幻小说 #chine…"
url: "https://www.youtube.com/watch?v=BkbglBZtZJc&ab_channel=%E7%83%AD%E8%A1%80%E5%8A%A8%E6%BC%AB%E7%A4%BE"
```


≤