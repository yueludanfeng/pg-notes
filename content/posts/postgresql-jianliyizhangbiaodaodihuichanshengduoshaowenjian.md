---
title: "PostgreSQL 建立一张表到底会产生多少文件"
date: 2023-09-28
description: "开头还是介绍一下群，如果感兴趣PolarDB ,MongoDB ,MySQL ,PostgreSQL ,Redis, Oceanbase, 等有问题，有需求都可以加群群内有各大数据库行业大咖，CTO，可以解决你的问题。加群请联系 liuau"
categories: ["PostgreSQL 笔记"]
tags: ["PostgreSQL", "体系结构", "安装部署", "索引"]
series: []
---

[PostgreSQL 建立一张表到底会产生多少文件 (qq.com)](https://mp.weixin.qq.com/s/7epCryNowt2B7Pn0pBqs8Q)

开头还是介绍一下群，如果感兴趣PolarDB ,MongoDB ,MySQL ,PostgreSQL ,Redis, Oceanbase, 等有问题，有需求都可以加群群内有各大数据库行业大咖，CTO，可以解决你的问题。加群请联系 liuaustin3 ，在新加的朋友会分到2群（共1350人左右 1 + 2 + 3 + 4） 3群 430 已关闭自由申请，新人会进4群,另欢迎 OpenGauss 的技术人员加入。  

每日感悟  

`理解一件事情，了解，理解，拆解，是三个层次，大部分情况了解即可，如果要达到理解就需要花一定的时间和力气了，如果是拆解就需要将与这件事有关的里里外外，都梳理形成系统知识   `

如果你问我PostgreSQL 在普通的情况下，一个表有几个文件，这个问题不好回答，PostgreSQL对于表数据的存储和复杂的原理下，到底一个表需要多少文件，或者说有多少文件的可能性需要一个梳理。  

PostgreSQL 每一个表通常的情况下，表和索引是分开存储的，在建立表和表的主键后会产生表文件和索引文件，而与此产生的是一个每个表和索引记录其空间的fsm文件 （free space map）方便系统对于文件中有多少空余的空间进行搜寻和记录。针对数据表中死元组需要 进行标记这里也有一个文件vm (visibility map),同时PG中的无日志表本身需要有一个初始化的文件，后缀名为init.  

问题1  在建立一个带有主键的数据表后，存储数据的文件一开始会有几个  

我们产生一张表,并灌入5000万行数据  

 `create table testdata(id serial primary key,name varchar(20),course int,grade numeric(4,2),testtime date,note text,note1 text);` 

![Image](https://mmbiz.qpic.cn/mmbiz_png/iaLVtuJPjjw6JMz7GiaiatFe4YaN5DLDy5PzriaibrGoOXXicYPxTcyVdah0WBuRItoK9WQibXU2pVpnJm8NibWCF5vW5Q/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

`    test=# select oid,relname,relfilenode from pg_class where relname = 'testdata';   -[ RECORD 1 ]---------   oid         | 16724   relname     | testdata   relfilenode | 16724      test=# select oid,relname,relfilenode from pg_class where relname = 'testdata_pkey';   -[ RECORD 1 ]--------------   oid         | 16730   relname     | testdata_pkey   relfilenode | 16730      test=# SELECT oid::regclass AS Table,          reltoastrelid::regclass As TOAST_Table,          pg_relation_size(reltoastrelid) AS toast_size   FROM pg_class WHERE relkind = 'r' AND reltoastrelid <> 0 and relname = 'testdata';   -[ RECORD 1 ]------------------------   table       | testdata   toast_table | pg_toast.pg_toast_16724   toast_size  | 0       `

从上面的的例子可以看出一个简单的表，在有数据的情况下，有三个文件（toast存在的情况下），数据文件，索引文件和toast文件，这里我们的表本身没有二级索引，我们建立二级索引，查看二级索引文件默认存储的位置。  

我们通过下面的例子来看一下，testdata ，由主数据文件 16724， 主键文件 16730， toast 文件 16728 ,以及二级索引文件 16734 组成。然后我们又建立了一个二级索引，结果是我们又多了一个文件16735.

```
create index idx_note on testdata (note);
```

`test=# select oid,relname,relfilenode from pg_class where relname = 'testdata';         select oid,relname,relfilenode from pg_class where relname = 'testdata_pkey';         SELECT oid::regclass AS Table,          reltoastrelid::regclass As TOAST_Table,          pg_relation_size(reltoastrelid) AS toast_size   FROM pg_class WHERE relkind = 'r' AND reltoastrelid <> 0 and relname = 'testdata';       select oid,relname,relfilenode from pg_class where relname = 'pg_toast_16724';         select oid,relname,relfilenode from pg_class where relname = 'idx_note1';   -[ RECORD 1 ]---------   oid         | 16724   relname     | testdata   relfilenode | 16724      -[ RECORD 1 ]--------------   oid         | 16730   relname     | testdata_pkey   relfilenode | 16730      -[ RECORD 1 ]------------------------   table       | testdata   toast_table | pg_toast.pg_toast_16724   toast_size  | 0      -[ RECORD 1 ]---------------   oid         | 16728   relname     | pg_toast_16724   relfilenode | 16728      -[ RECORD 1 ]----------   oid         | 16734   relname     | idx_note1   relfilenode | 16734` 

![Image](https://mmbiz.qpic.cn/mmbiz_png/iaLVtuJPjjw6JMz7GiaiatFe4YaN5DLDy5Pia5TuKeNKGuFJZdQNnUhUW87z7BJJY6uUibCcVk7ia7NaIy14Q6cWz5FA/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

`test=# create index idx_note on testdata (note);   CREATE INDEX   test=# select oid,relname,relfilenode from pg_class where relname = 'testdata';         select oid,relname,relfilenode from pg_class where relname = 'testdata_pkey';         SELECT oid::regclass AS Table,          reltoastrelid::regclass As TOAST_Table,          pg_relation_size(reltoastrelid) AS toast_size   FROM pg_class WHERE relkind = 'r' AND reltoastrelid <> 0 and relname = 'testdata';       select oid,relname,relfilenode from pg_class where relname = 'pg_toast_16724';         select oid,relname,relfilenode from pg_class where relname = 'idx_note';   -[ RECORD 1 ]---------   oid         | 16724   relname     | testdata   relfilenode | 16724      -[ RECORD 1 ]--------------   oid         | 16730   relname     | testdata_pkey   relfilenode | 16730      -[ RECORD 1 ]------------------------   table       | testdata   toast_table | pg_toast.pg_toast_16724   toast_size  | 0      -[ RECORD 1 ]---------------   oid         | 16728   relname     | pg_toast_16724   relfilenode | 16728      -[ RECORD 1 ]---------   oid         | 16735   relname     | idx_note   relfilenode | 16735         `

![Image](https://mmbiz.qpic.cn/mmbiz_png/iaLVtuJPjjw6JMz7GiaiatFe4YaN5DLDy5PTXJ3ZyTKLibc22icjm0TgJA6WdQY28QCTucP6wibdYn49L0443IyOanIA/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

同时需要注意这里默认的数据文件大小为1G ，建议在安装时将数据文件的大小进行扩展，尽力减少大表文件最大SIZE的限制。  

最后将无日志表的部分也做了，这里情况类似就不进行展示了，最后总结了一下普通的情形下，不同单表有的会产生的数据文件。  

![Image](https://mmbiz.qpic.cn/mmbiz_png/iaLVtuJPjjw7dbuMX1zEIddMmLVMvkUB8wXvLMJUZ9l2EJoyrqr8FQLHzDawv6fusvRgu5rj4loWqtvy4OxBicCA/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)