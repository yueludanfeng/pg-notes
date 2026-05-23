---
title: "参考 :"
date: 2023-06-27
description: "t_infomask 标识位用于加快元组的可见性判断，其实现原理为：当查询一条数据时，需要判断所涉及元组的可见性，也就需要知道该元组的提交状态（ 查看 CLOG） ，如果同一条数据经常被查询或被访问，就需要多次去查看 CLOG 文件，会涉及"
categories: ["PostgreSQL 笔记"]
tags: ["VACUUM"]
series: []
---

[pg中通过t_infomask2来判断表是否是hot更新，对应的原理是啥？ - 墨天轮问答 (modb.pro)](https://www.modb.pro/issue/17656)


# 具体解释
t_infomask 标识位用于加快元组的可见性判断，其实现原理为：当查询一条数据时，需要判断所涉及元组的可见性，也就需要知道该元组的提交状态（ 查看 CLOG） ，如果同一条数据经常被查询或被访问，就需要多次去查看 CLOG 文件，会涉及较高代价的 I/O 操作。而将可见性标识位 t_infomask 直接写入把事务状态直接记录在元组头中（HeapTupleHeaderData），避免频繁访问 CLOG 影响从而加快可见性判断。

2.3 t_infomask的计算

```
postgres=# insert into test values(1);
postgres=# insert into test values(2);
postgres=# select *, t_xmin,t_xmax, t_infomask,t_infomask2 from heap_page_items(get_raw_page('test',0));
 lp | lp_off | lp_flags | lp_len | t_xmin | t_xmax | t_field3 | t_ctid | t_infomask2 | t_infomask | t_hoff | t_bits | t_oid |   t_data   | t_xmin | t_xmax | t_infomask | t_infomask2 
----+--------+----------+--------+--------+--------+----------+--------+-------------+------------+--------+--------+-------+------------+--------+--------+------------+-------------
  1 |  16352 |        1 |     28 |    824 |      0 |        0 | (0,1)  |           1 |       2048 |     24 |        |       | \x01000000 |    824 |      0 |       2048 |           1
  2 |  16320 |        1 |     28 |    825 |      0 |        0 | (0,2)  |           1 |       2048 |     24 |        |       | \x02000000 |    825 |      0 |       2048 |           1
(2 rows)
```

可以看出插入 1 的事务id 为824， 插入 2 的事务id 为825。两者的标志位 t_infomask = 2048, 换算成16进制为0x0800；根据上述t_infomask的宏定义可知 t_xmax invalid/aborted，这是因为插入数据t_xmax不发生变化，为0；并不知道t_xmin是否提交，也就是说下次查询的时候并不能直接判断该元组的可见性，需要从CLOG读取事务的提交状态。

问题来了，那怎么才能避免后续重读读取CLOG文件，加快元组可见性判断和数据的读取呢？见下：

```
postgres=# select * from test;
 id 
----
  1
  2
(2 rows)
```

```
postgres=# select *, t_xmin,t_xmax, t_infomask,t_infomask2 from heap_page_items(get_raw_page('test',0));
 lp | lp_off | lp_flags | lp_len | t_xmin | t_xmax | t_field3 | t_ctid | t_infomask2 | t_infomask | t_hoff | t_bits | t_oid |   t_data   | t_xmin | t_xmax | t_infomask | t_infomask2 
----+--------+----------+--------+--------+--------+----------+--------+-------------+------------+--------+--------+-------+------------+--------+--------+------------+-------------
  1 |  16352 |        1 |     28 |    824 |      0 |        0 | (0,1)  |           1 |       2304 |     24 |        |       | \x01000000 |    824 |      0 |       2304 |           1
  2 |  16320 |        1 |     28 |    825 |      0 |        0 | (0,2)  |           1 |       2304 |     24 |        |       | \x02000000 |    825 |      0 |       2304 |           1
(2 rows)
```

从上述例子看出，执行select 语句后发现t_infomask从2048转变成2304，换算成16进制为0x0900；即  
0x0800 | 0x0100 = 0x0900，表明设置了HEAP_XMIN_COMMITTED（0x0100）这个标志位，该元组插入成功并已提交，对后续事务均可见。

等到第一次访问（可能是VACUUM，DML或SELECT）该元组并进行可见性判断时：

如果Hint Bits已设置，直接读取Hint Bits的值。  
如果 Hint Bits 未设置，则调用函数从 CLOG 中读取事务状态。如果事务状态为 COMMITTED 或 ABORTED，则将 Hint Bits 设置到元组的 t_informask 字段。如果事务状态为 INPROCESS，由于其状态还未到达终态，无需设置

Hint Bits。