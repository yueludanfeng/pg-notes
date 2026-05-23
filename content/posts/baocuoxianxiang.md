---
title: "报错现象"
date: 2023-06-29
description: "```bash"
categories: ["锁与并发"]
tags: ["VACUUM", "参数配置", "备份恢复", "流复制", "逻辑复制", "锁"]
series: []
---

# 报错现象
```bash
ERROR:  canceling statement due to conflict with recovery 
```


# 什么情况下 query 会堵塞、或与恢复冲突

1. 主库的访问排它锁，与备库对应的锁产生冲突
例如主库 truncate a 表, 备库查询 a 表。

2. 主库删除表空间，备库使用这个表空间产生临时文件。例如主库删除 TBS，备库的一个大的查询需要写临时文件，并且这个临时文件是写到这个表空间的
	这种情况非常少见，也很容易规避，新建一个临时表空间不要删除即可。

3. 主库删除数据库，备库刚好连在这个数据库上。
	这种情况也非常的少见。

4. 主库回收 dead tuple 的 REDO，同时备库当前的 query snapshot 需要看到这些记录。
	这种情况可以通过参数控制，恢复优先，或查询优先。可以配置时间窗口。
	而且这种冲突出现的概率也非常的小，除非用户在备库使用 repeatable read，同时是非常大的事务。
	而通常用户用的都是 read committed.

  同上，但是当 query 访问的页就是要清理垃圾的页时，也是有冲突的。
> 这是物理复制与逻辑复制唯一有差别的地方，但是对现实场景来说，这种情况出现的概率也不大。

#  # 如何解决

1、在主库配置Vacuum_defer_cleanup_age

2、在备库配置recovery延迟来解决以上所有冲突，给备库的Query设置一个执行窗口。

max_standby_achive_delay

max_standby_streaming_delay

3、在备库配置hot_standby_feedback， 备考会将备库的xmin反馈给上游，从而主库知道备库还需要哪些记录，在cleanup dead tuple时，会考虑备库的情况，防止冲突。

