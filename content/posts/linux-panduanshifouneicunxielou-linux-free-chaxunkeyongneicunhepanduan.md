---
title: "Linux 判断是否内存泄漏_Linux free 查询可用内存和判断是否有内存泄漏"
date: 2023-07-14
description: "![](https://img-blog.csdnimg.cn/img_convert/1c20c087dfc0bbbee70da0676c25846d.png)"
categories: ["PostgreSQL 笔记"]
tags: ["内存管理", "监控"]
series: []
---

[(2条消息) 【转载】Linux free 查询可用内存和判断是否有内存泄漏_可以通过查看free内存判断内存泄漏吗_疯狂的兔子Philip的博客-CSDN博客](https://blog.csdn.net/weixin_39506322/article/details/108779738)


[centos7](https://so.csdn.net/so/search?q=centos7&spm=1001.2101.3001.7020) 使用 free -h 查看内存使用情况：

![](https://img-blog.csdnimg.cn/img_convert/1c20c087dfc0bbbee70da0676c25846d.png)

used 表示 操作系统已经分配出去的内存

free 表示 还没分配出去的内存

**判断内存是否泄漏的计算方法：**

**Centos6计算方法**：used - buffers - cached 的值 跟 used 的值作比较

**Cento7计算方法：** available - free 的值 跟 buff/cache 的值作比较

**比较两者的差距,如果两者相差很大,说明有很大的可能是内存泄漏.**

**下面我们通过案例来分析是否存在内存泄漏的可能：**

**一、Centos6下的案例：**

**案例1：**

![](https://img-blog.csdnimg.cn/img_convert/36075ab071e7f3442063d7f99e1e8977.png)

buffers + cached =  0.1  + 10  = 10.1G

操作系统系统已经分配出去的内存（used）：61G

61-10.1= 51G， 已经分配出去的内存跟实际可用的内存相差51G(（1- 10.1 / 61） * 100% = 84%)，说明84%的内存没有被使用到，99%的可能存在内存泄漏。

案例2：

![](https://img-blog.csdnimg.cn/img_convert/24f1fe262efbc87f05297eac0d1c5c92.png)

Buffers +　cached = 0.21  + 0.13 = 0.34G

操作系统系统已经分配出去的内存（used）：3.2G

3.2 - 0.34G = 2.86G， 已经分配出去的内存跟实际可用的内存相差2.86G((1 - 0.34 / 3.2) * 100% = 89%)，说明89%的内存没有被用到， 99%的可能存在内存泄漏。

**二、Centos7下的案例：**

**案例1：**

![](https://img-blog.csdnimg.cn/img_convert/c1c2071ad9ad9b0b097ceb50198ba510.png)

已分配出去的，并且可再被重用的内存: available - free = 926（总）- 770（free）=156G

buff + cache = 161G

161G跟156G相差不大,  (1 - 156 / 161) * 100% = 3%)，说明只有3%的内存没有被用到， 内存泄漏的可能非常低。

**案例2：**

![](https://img-blog.csdnimg.cn/img_convert/723de2a16340975abe007b5538a37bc2.png)

已分配出去的，并且可再被重用的内存: available - free = 17（总）-0.5（free）=16.5G

Buff + cache = 18G

16.5G跟18G相差不大, (( 1 - 16.5 / 18) * 100% = 8%)，说明只有8%的内存没有被用到，内存泄漏的可能非常低。

总结:  对于大内存的服务器，php 设置为静态分配内存，也占用大部分内存的情况。判断内存泄露的计算方法在 centos6和 centos7下是不一样的， free 工具可以用来监控内存的使用情况和判断是否有内存泄露。

