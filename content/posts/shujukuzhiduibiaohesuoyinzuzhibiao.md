---
title: "数据库之堆表和索引组织表"
date: 2023-07-03
description: "堆表(heap table）和索引组织表（Index Oragnization Table，简称 IOT)是两种数据表的存储结构。pg 中的表是堆表。mysql Innodb 引擎中的表是索引组织表。oracle 中既支持堆表，也支持索引组"
categories: ["PostgreSQL 笔记"]
tags: ["索引"]
series: []
---

[数据库之堆表和索引组织表 - 墨天轮 (modb.pro)](https://www.modb.pro/db/107906)


堆表(heap table）和索引组织表（Index Oragnization Table，简称 IOT)是两种数据表的存储结构。pg 中的表是堆表。mysql Innodb 引擎中的表是索引组织表。oracle 中既支持堆表，也支持索引组织表。

在具体介绍堆表和索引组织表之前，我们先看下pg中index scan和index only scan。

Index Scan: 也即普通索引扫描，对于给定的查询，我们先扫描一遍索引，从索引中找到符合要求的记录的位置(指针)，再定位到表中具体的Page去取。等于是两次I/O，先走索引，再取表记录。

Index only scan: 建立index时，所包含的字段集合，囊括了我们需要查询的字段，这样就只需在索引中取数据，就不必访
问表了。
![](/images/Pasted%20image%2020230703174854.png)

图片来源： https://www.interdb.jp/pg/pgsql01.html

从两者的定义我们看出，pg中索引和表数据是分开存储的，索引中存储了数据行的指针，当使用普通索引查找数据时，需要先扫描索引树，找到对应的行指针，再去表中找到相应的tuple。

而index only scan可以极大的提高性能。因为不需要再去表中查找数据了。

这里我们思考一个问题：

Index only scan依靠存储在索引中的冗余数据，消除了去访问堆表的操作。如果我们将这个概念进一步扩大，并将所有列放在索引中，我们还需要堆表吗？

其实这也就引出了索引组织表的概念，索引组织表的数据是按照主键顺序被存储到一个 B+树索引中的，索引就是数据，数据就是索引，二者合二为一。当使用主键去查询一个索引组织表时，不需要再访问表，能从索引中获取到表的全部数据。这也是 mysql 中的聚簇索引的概念，数据行存储在索引的叶子节点中。在 mysql 中除了聚簇索引外，还有非聚簇索引(也叫二级索引）。非聚簇索引索引它的叶子节点存的是键值和主键值

。