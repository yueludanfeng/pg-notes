---
title: "调整统计信息线程数与收集频率"
date: 2023-03-31
description: "> 参考: [Deep dive into PostgreSQL statistics. (slideshare.net)](https://www.slideshare.net/alexeylesovsky/deep-dive-into-"
categories: ["PostgreSQL 运维"]
tags: ["VACUUM", "统计信息"]
series: []
---

 > 参考: [Deep dive into PostgreSQL statistics. (slideshare.net)](https://www.slideshare.net/alexeylesovsky/deep-dive-into-postgresql-statistics-60849690?from_search=1)


![[../../../附件/Pasted image 20230305220236.png]]

![[../../../附件/Pasted image 20230305220319.png]]

![[../../../附件/Pasted image 20230305220327.png]]

![[../../../附件/Pasted image 20230305220333.png]]

![[../../../附件/Pasted image 20230305220341.png]]


[PG统计信息_pg_statistic_三思呐三思的博客-CSDN博客](https://blog.csdn.net/weixin_37692493/article/details/109281142)

[PostgreSQL 统计信息 - 墨天轮 (modb.pro)](https://www.modb.pro/db/581216?0206)


# 调整统计信息线程数与收集频率
* 线程数: autovacuum_max_workers
* 收集频率: autovacuum_analyze_threshold; autovacuum_vacuum_threshold; 等
