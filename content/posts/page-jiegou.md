---
title: "page 结构"
date: 2023-07-08
description: ""
categories: ["PostgreSQL 笔记"]
tags: ["内存管理"]
series: []
---

# tuple 结构
![image-20230708183001901](/images/image-20230708183001901.png)





字段说明：

1、t_choice是具有两个成员的联合类型：

  t_heap：用于记录对元组执行插入/删除操作的事务ID和命令ID，这些信息主要用于并发控制时检查元组对事务的可见性。

  t_datum：当一个新元组在内存中形成的时候，我们并不关心其事务可见性，因此在t_choice中只需用DatumTupleFields结构来记录元组的长度等信息。但在把该元组插入到表文件时，需要在元组头信息中记录插入该元组的事务和命令ID，故此时会把t_choice所占用的内存转换为HeapTupleFields结构并填充相应数据后再进行元组的插入。

2、t_ctid用于记录当前元组或者新元组的物理位置（block号及块内偏移量），若元组被更新（PostgreSQL对元组的更新采用的是标记删除旧版本元组并插入新版本元组的方式），则记录的是新版本元组的物理位置。PostgreSQL中对于元组采用多版本技术存储，对元组的每个更新操作都会产生一个新版本，版本之间从老到新形成一条版本链（将旧版本的t_ctid字段指向下一个版本的位置即可）。

3、t_infomask2使用其低11位表示当前元组的属性个数，其他位则用于包括用于HOT技术及元组可见性的标志位。

4、t_infomask用于标识元组当前的状态，比如元组是否具有OID、是否有空属性等，t_infomask的每一位对应不同的状态，共16种状态。

5、t_hoff表示该元组头的大小。

6、_bits［］数组用于标识该元组哪些字段为空。



```bash
/*
 ``* information stored in t_infomask:
 ``*/
#define HEAP_HASNULL      0x0001 /* has null attribute(s) */
#define HEAP_HASVARWIDTH    0x0002 /* has variable-width attribute(s) */
#define HEAP_HASEXTERNAL    0x0004 /* has external stored attribute(s) */
#define HEAP_HASOID        0x0008 /* has an object-id field */
#define HEAP_XMAX_KEYSHR_LOCK 0x0010 /* xmax is a key-shared locker */
#define HEAP_COMBOCID     0x0020 /* t_cid is a combo cid */
#define HEAP_XMAX_EXCL_LOCK    0x0040 /* xmax is exclusive locker */
#define HEAP_XMAX_LOCK_ONLY    0x0080 /* xmax, if valid, is only a locker */
```
