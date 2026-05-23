---
title: "-2. 小 case"
date: 2023-06-27
description: "pg_start_backup ()  完成之后, 需要执行 pg_stop_backup ()"
categories: ["PostgreSQL 笔记"]
tags: ["VACUUM", "WAL", "内存管理", "分区表", "参数配置", "备份恢复", "执行计划", "流复制", "监控", "索引", "统计信息", "逻辑复制", "锁", "高可用"]
series: []
---

[TOC]†



# -2. 小 case

### 物理备份需要注意什么

pg_start_backup ()  完成之后, 需要执行 pg_stop_backup ()
或者直接使用 pg_basebackup 工具

### 存储，SAN/NAS/DAS

### 长连接危害

### 一条 IO 请求的生命周期

### 抓包解包，分析 PostgreSQL 协议

### 常见高可用方案以及选型

## -1: 之前公司的情况

```bash
第一家公司: 三四次周六加班, 我没去, 领导对我批评很严厉, 说我不合群 我一气之下离职了
第二家公司: 干了 5 个月, 招我进去是因为我的导师要离职了, 结果过完年之后, 导师又不想走了
公司就与我协商, 让我在职期间找工作, 然后我就找到了浙江宇视科技 然后离职了
第三家公司: 浙江宇视科技 离职原因 温水煮青蛙 你干得多你就只能越干越多, 五年期 走了 8 个人, 数据组 4 个人感到只剩下我一个
第四家公司: 公司总体来说, 从福利待遇来将相对最好的,公司是比较体面的, 但是工作内容不是很体面; 
今年有很多主机过保的年头, 很多主机过保,上面的实例需要迁移; 对于云数据库还相对方便些;对于一些老的传统库, 需要迁移入云;
另外一些版本比较低的老库, 公司也有 KPI ,推动用户升级并迁移入云, 这个活很难推动,因为子公司也在降本, 如果没有必要尽量不期望花费人力成本来投入升级数据库软件版本, 只要业务没有影响就行,所以推动起来比较难, 另外即使有些用户愿意升级, 但是这个需求会持续1 至2 个月, 无法连续的投入, 比较费心,事情干起来比较难受.

```



# **==0.遇到的常见问题, 以及如何解决的==**

```bash
# 数据库无法正常连接
telnet IP 端口是否有反应 如果 ping 的通过, 但是 telnet 不通过, 说明防火墙不通过; 如果 telnet 通过, 但是还是连接不上去,大概率是 pg_hba.conf 没有开白名单 或者 postgresql.conf 没有设置 listen_address='*'

# postgres 用户无登录权限
解决方法: 以单用户模式登录到数据库中, 然后授予postgres用户登录权限解决, 同时在新的版本中新增一个隐藏的超级用户(对于业务层无感知), 后面遇到同样问题,我们可以使用新的超级管理员用户来给 postgres 授权限


# 数据库无法正常工作日志提示 wrap arround
1. 可以查询, 无法写入
查询是哪些表年龄过大, 单独对其进行 vacuum  freeze

2. 无法增删改查
停库, 单用户模式 vacuum  freeze
或者 通过已有的备份进行恢复

# 数据库无法启动
1. 磁盘空间满了
大表
pg_wal 过大

2. 文件权限问题
日志目录权限
数据目录权限
软件目录相关权限
/tmp 权限异常

# 定时任务没有生效
a. 定时任务对应的脚本有问题 --> 将定时任务日志重定向到某个文件中
b. 定时任务配置的有问题  , 检查语法或者整个配置文件层面是否有问题(比如多余的字符)
c. 还遇到过, 即使做了这个重定向配置, 日志文件还是没有生成
一种是由于定时任务配置有问题, 没有生效
d. /var/log/cron中没有出现定时任务执行的记录
定位是由于环境是 Ubuntu 系统,  cron 使用的是 /var/log/cron.log 并且当前环境中将 这个配置给注释了, 所以没有看到 /var/log/cron相关文件生成

# 定时任务重复执行
添加文件锁, 避免多实例运行

# xlog 日志文件损坏
重置 xlog 日志

# Data 目录下文件损坏导致PG启动失败, 报错 INPUT/OUTPUT errror
初始化空库, 重新恢复数据库

# 表损坏导致数据无法写入
ERROR:  could not read block 24418 in file "base/16384/25811": read only 0 of 8192 bytes
根据 oid 确定是索引还是表, 如果是索引, 则考虑重建索引; 如果是表, 则 设置erro_damaged_pages为 true ,尽可能多的查询数据出来

#clog 损坏:  ERROR: could not access status of transaction 118831
* 通过 dd 命令伪造文件数据:
dd if=/dev/zero of=<data directory location>/pg_clog/0001 bs=256K count=1
* 全量备份数据库, 并重新初始化一个实例,然后进行恢复数据库操作

# 删除复合索引中的字段, 导致复合索引自动删除 最后导致查询变为慢 SQL 
(a,b) 删除字段 b, 导致 a 也无法走索引了

# pg_restore Fd 方式备份出来的文件, 在恢复之后, 发现表中的索引缺失
需要人为指定 pg_restore -i ,否则恢复的时候不会恢复索引

# 只希望导出库中的所有函数
* pg_dump -s 导出表结构
/home/postgres/pgsql/bin/pg_dump   -Upostgres  test -Fc -v -s -f test.dmp 
* pg_restore -l 过滤出 FUNCTION
/home/postgres/pgsql/bin/pg_restore -l test.dmp | grep FUNCTION > funcion_list
* pg_restore -L 获取 FUNCTION 函数实现
/home/postgres/pgsql/bin/pg_restore -L ./funcion_list  test.dmp > function_list.sql


# ERROR: cache lookup failed for relation 49197 
postgres=# select * from pg_depend where refobjid ='49197';
 classid | objid | objsubid | refclassid | refobjid | refobjsubid | deptype 
---------+-------+----------+------------+----------+-------------+---------
    1247 | 49199 |        0 |       1259 |    49197 |           0 | i
(1 row)
postgres=# delete from pg_depend where refobjid ='49197';
postgres=# drop type xxx;


# 备库 长 SQL 报错: ERROR: canceling statement due to conflict with recovery
Detail: User query might have needed to see row versions that must be removed
解决方法: 设置 hot_standby_feedback=on, 但是会导致 表膨胀, 所以我们一般还会设置 old_snapshot_threshold
或者设置max_standby_streaming_delay=-1 ,这样可以避免冲突, 但是会导致备库慢 SQL 消耗主机资源
max_standby_archive_delay = 900s
max_standby_streaming_delay = 900s

# snapshot too old错误
* snapshot too old报错通常出现在非常大的SQL，同时读取的数据块在不断的变化。
• snapshot too old也可能出现在pg_dump备份数据库时，因为pg_dump使用的是repeatable read隔离级别，快照是在事务启动后的第一条SQL创建的，备份时间长的话，极有可能在备份过程中读取到LSN大于快照LSN的数据块，导致snapshot too old报错。

1.当开启了old_snapshot_threshold的时候，假如在创建索引之前存在长事务，该索引需要等待长事务结束才可使用，所以创建索引的时候务必先看看库里是否有长事务，不管是普通的create index还是create index concurrently，否则现象会让你多走很多弯路
2.开启了old_snapshot_threshold之后，会设置indcheckxmin为true，设置indcheckxmin的目的是告诉其他事务，本索引可能是unsafe的。对应的事务在生成执行计划的时候，如果发现索引的indcheckxmin标记为true，则需要比较创建索引的事务和当前事务的先后顺序，决定是否能使用索引。
3.在CIC的时候，不需要设置indcheckxmin，但是也要控制长事务，即使不是同一个对象，也会阻塞索引的创建，主要是需要预防HOT unsafe的问题
4.存在HOT Broken chain的时候，会设置indcheckxmin为true
5.reindex的时候，不需要设置indcheckxmin

长事务是DBkiller，在PostgreSQL中，危害更加显眼，因为MVCC的独特实现机制。在此列举一下暂时能想到的长事务罪证

1.会阻止vacuum的清理，导致表膨胀
2.阻塞索引的使用，会让问题现象变得十分费解
3.假如还有子事务，搭配长事务，很容易使性能急剧下降，参考之前的文章
4.年龄只能降到系统存在的最早的长事务即 min (pg_stat_activity.(backend_xid, backend_xmin))，因此也需要密切关注长事务。
5.logical decoding下，长事务会阻塞复制槽的创建，其实是为了推到一个一致性的位点开始解析，所以会阻塞逻辑复制、CDC等
6.logical decoding下，大事务会导致WAL日志堆积
7.长事务会导致流复制的备库WAL日志部分堆积

索引失效相关文章: https://mp.weixin.qq.com/s?__biz=MzUyOTAyMzMyNg==&mid=2247486460&idx=1&sn=e8f741f27c89175d60791f40f8b997b6&chksm=fa6623cdcd11aadbc9891efaab690ef04fcda53f7336432bed317ed4477ad3359ddffa07a722&token=472580641&lang=zh_CN&scene=21#wechat_redirect
````



# 0.2 MySQL 两阶段提交的理解

## 为什么需要两阶段提交？

**如果在将 redo log 刷入到磁盘之后， MySQL 突然宕机了，而 binlog 还没有来得及写入**。

**如果在将 binlog 刷入到磁盘之后， MySQL 突然宕机了，而 redo log 还没有来得及写入**

**MySQL 为了避免出现两份日志之间的逻辑不一致的问题，使用了「两阶段提交」来解决**

## 进一步解释

![image-20230715203740902](/images/image-20230715203740902.png)

* undo log; redo log; bin log 作用
* undo log: 实现事务的原子性; 实现 MVCC的关键技术
* redo log:  实现事务的持久性; 用于掉电等异常恢复
* MVCC : 实现事务的隔离性; 
* 原子性;持久性;隔离性是为了保障事务的一致性
* bin log: 用于 主从复制以及备份恢复



# 0.3 ==体系结构==

[体系结构](obsidian://open?vault=%E5%9D%9A%E6%9E%9C%E4%BA%91_note01&file=002_%E5%AD%A6%E4%B9%A0%2F%E6%95%B0%E6%8D%AE%E5%BA%93%2FPG%2FPG%20%E4%BD%93%E7%B3%BB%E7%BB%93%E6%9E%84)



# ==1.PG MVCC 原理与 Oracle 的区别==

Oracle 在更新的时候, 会将 老的 tuple 放到 回滚段中

PG 则不然, 老的 tuple 还在, 直接插入新的 tuple ,然后通过修改 tuple header 中的 xmin, xmax, cid, ctid, infomask 等字段值结合 clog 与 snapshot  通过一定的规则, 来进行可见性判断

插入数据: 修改 xmin 为当前事务 id, xmax 为 0

删除数据: 将 xmax 改为当前事务 id

更新数据: 相当于是 先删除数据,然后再插入数据

* 优势:

由于不用写undo 回滚段, 所以 DML 效率比较高

不会出现 undo 表空间不够的情况

* 缺点:

出现表膨胀, 需要及时清理, 因此相对其他库多了 vacuum 机制

事务 ID 递增，需要处理事务回卷问题，因此又要引入 freeze 机制

* 事务回卷优化:

  ![image-20230712102015183](/images/image-20230712102015183.png)

# ==2.为什么会有表膨胀及表膨胀的危害==

**原因**: 老的数据在删除的时候只是标记为删除, 这些老数据如果不能及时被清理掉, 表就会越来越大, 导致膨胀

**那些场景为导致表膨胀**:

autovacuum 没有开启

autovacuum 清理过慢< 比如 IO 问题、触发阈值(autovacuum_vacuum_scale_factor; autovacuum_vacuum_threshold)不合理、执行周期不合理 (autovacuum_naptime)、配置了延迟触发(autovacuum_vacuum_cost_delay)等>

更新或删除等 DML 操作过快, dead tuple 产生速度快于清理速度

慢查询导致 vacuum 的 dead tuple 变少

复制槽 + hot_standby_feedback + 备库大查询，会导致主库可以 vacuum 的 dead tuple 变少

**危害**: 

表对应数据文件占用空间越来越大

查询表的时候需要扫描的数据块要更多, 导致查询速度变慢

需要通过 vacuum full 或者 pg_repack 等工具来进行即使清理

# ==3. vacuum / autovacuum 的作用以及如何调优==

* 作用

  - 死元组清理

  - 统计信息收集

  - 冻结事务ID，删除不必要的clog文件

  - 更新vm与fsm文件

  - 重写表、释放空闲磁盘空间（vacuum full） 

    - 注意: 使用 old_snapshot_threshold配置后, vacuum 无法释放表末尾空闲 page 的空间 -- (使用该参数避免 hot_standby_feedback 配置导致 WAL 堆积)

      当这个特性被启用时，关系末尾的被清出的空间不能被释放给操作系统，因为那可能会移除用于检测"snapshot too old"情况所需的信息。所有分配给关系的空间还将与该关系关联在一起便于重用，除非它们被显式地释放（例如，用VACUUM FULL）。

  - autovacuum自8.3版本引入，根据一定规则自动定期触发vacuum操作，减少手动运维。

* 优化

![image-20230712101851090](/images/image-20230712101851090.png)

# 4.子事务危害以及注意事项

**如何产生子事务**

- savepoint
- pl/pgsql 中的BEGIN / EXCEPTION WHEN .. / END代码块
- PL/Python 代码中的 plpy.subtransaction()

**子事务的危害**

* 加速事务id消耗，增加事务id回卷风险：每个savepoint都会消耗一个事务id
* 增加内存占用：每个savepoint消耗8K的会话本地内存（CurTransactionContext）
* 子事务SLRU溢出（Subtrans SLRU overflow）：本质上这是由于子事务嵌套过深、或者子事务日志过大，SLRU缓存中不再能放下，这会导致大量缓存miss，进而导致大量磁盘IO，因为pg需要从磁盘去读取子事务信息。典型特征是出现SubtransControlLock等待事件（13版本开始重命名为SubtransSLRU）。



# ==5.事务 ID 回卷的原因以及如何维护优化==

**原因**

由于目前事务 id 只有32位，业务量大的情况下可能会导致事务 id 用完，触发事务 id 回卷（循环使用）。

如果新事务使用了旧id，旧事务将可以看到新事务数据，新事务又看不到旧事务数据，打破数据一致性。

所以引入 freeze 机制 ,对旧事务进行 "冻结" 

**如何维护优化**

对数据库, 表事务年龄做好监控

设置好表的 冻结 阈值

对于大表建议分区

避免长事务,大事务: 比如: 业务层打开的游标要及时关闭, 设置 idle_in_transaction_session_timeout 关闭空闲长事务

设置 old_snapshot_threshold , 强制删除为长事务保留的 dead tuple





# 6.长事务危害以及如何查询长事务

### 长事务的危害

**小事务但长期不提交**

如果前面执行过DML语句，会锁定相关数据，阻塞后面语句
阻塞create index（也包括 concurrently）
==大量死元组无法vacuum，导致表膨胀==
大量事务id无法冻结
==WAL无法及时清理，占用空间大==
占用连接数
==开启old_snapshot_threshold后，长事务可能导致索引失效==
搭配子事务容易使性能急剧下降
逻辑复制下会阻塞复制槽的创建
**大事务：除上面外可能还有**

出现较大范围锁表
WAL大量增加
主从出现延迟

**什么样的事务才会是有危害的长事务？**

​    pg_stat_activity视图中 backend_xid或backend_xmin字段非空的事务。单纯begin transaction; 不提交并不会有问题，因为它并没有真正申请事务id和获取快照。

# 7.infomask 与  infomask 2 的作用

infomask:  标志该 tuple 对于事务的状态(commited;rollback;abort,等等), 避免在判断 tuple 可见性时频繁查询 clog 文件

infomask 2: HOT 相关, 标志该 tuple 是 HOT 之前的还是之后的(HEAP_HOT_UPDATED 与 HEAP_ONLY_TUPLE )



# 8. 谈谈对 commit log(clog) 的认识

表达事务的最终状态

物理上: 是一个 pg_xact 目录下的文件

逻辑上: 是一个数组, 数组的序号索引对应的是事务的标志,数组的内容对应的事务状态



# ==9.谈谈对 HOT 的理解==

* 没有 HOT 时候

如果更新一条记录, 由于 tuple 物理位置变更, 需要新增一个索引项, 指向新插入的 tuple , 当 update 的数据量较大时, 会导致索引膨胀, 增加额外的索引清理成本

* 有了 HOT 机制之后

不需要新增索引项, 只需要将 老的 tuple 指向新的 tuple , 借助剪枝机制, 可以进一步优化, 老的 line pointer 直接重定向到 新的 line pointer , 后面老的 tuple 会被自动清理掉

* index only scan: 

  当 select 的所有目标列都到索引列中, 为了简减少 IO, 仅索引扫描会直接使用索引中的键值

  但是 PG 有点特殊的时, 当前这个值是否可见, 需要借助 VM 来判断,如果当前键值所在 page 是可见的则直接返回不用去磁盘中查询 tuple

  如果当前值所在 page 不是可见的 , 则需要去磁盘中查询 tuple 并判断tuple是否可见

# ==10.WAL 文件堆积的原因==

失效的复制槽
逻辑复制有长事务
过大的wal_keep_size
过小的archive_timeout。强制切换wal并归档，相当于pg_switch_xlog()切换日志+归档
归档失败会生成.ready文件
单进程归档，归档速度跟不上
FPI全页写（应检查checkpoint是否过于频繁、UUID等离散写行为）


                            无版权，随便玩儿

原文链接：https://blog.csdn.net/qq_40687433/article/details/136173893



# 11.流复制和逻辑复制的区别以及各自适用的场景

![image-20230627152126772](/images/image-20230627152126772-7850489.png)



## 使用场景

流复制：

- 提供可靠的数据库高可用
- 提供较低延迟的只读备库

逻辑复制：

* 备库需要支持写操作

- PG 大版本升级

- 仅需同步数据库中部分表

- 跨平台迁移（例如windows -> linux）

- 多对一、多对多的数据同步

- 仅部分表需要设置为同步模式，其余可为异步模式

  

# ==12. synchronous_commit 五种级别的区别==

**为什么备库的查询不能立马看到主库插入的数据****

![image-20240404095109980](/images/image-20240404095109980.png)

### 单节点环境

off: 未写入 wal file

local/on: 写入 wal file

### 主从复制环境

off: master wal 还没写入 wal file 就返回

local: master wal 写入了 wal 文件即返回

remote_write: master 写入 wal file 了, 备库的WAL还在备库操作系统缓存中, 

on: 本地与远程 变动都写入 wal file 了

remote_apply: 本地 已经写入 wal file, 远程也是, 并且远程已经将该变动 应用了



###  为啥备库查询不能里面看到主库插入的数据

WAL日志的发送、接收、write、flush、replay阶段都可能有延迟，除非同步级别设为remote_apply，否则主库提交不意味从库已经应用完日志，可以查到对应数据。

# ==13.流复制冲突是什么以及为什么会产生复制冲突==

[postgresql源码学习（48）—— 流复制冲突（备库锁阻塞与Vacuum冲突）_Hehuyi_In的博客-CSDN博客](https://blog.csdn.net/Hehuyi_In/article/details/127481887)

## 锁复制冲突

备库长查询, 主库 drop, 备库没有查完, 不能应用 drop 操作

## 快照复制冲突

备库长查询, 主库 vacumm , 备库没有查完, 不能应用清理操作

## 如何解决

设置 hot_standby_feedback 为 on, 比较好地解决了获取备库最小 xmin 的问题, 比 xmin 更旧的事务(对应的 dead tuple)可以被清理了

另外问题, 如果备库宕机了, 主库就无法知道备库的日志接收以及应用情况了

这种情况, 我们可以通过在主库创建物理复制槽, 

```sql
select pg_create_physical_replication_slot('node1');
select * from pg_replication_slots;
```

在备库做相应配置

```sql

-- pg 12开始设置在postgresql.conf文件，之前则在recovey.conf文件
echo "primary_slot_name = 'node1' " >> postgresql.conf
 
pg_ctl -D ./ restart
 
postgres=# select * from pg_stat_wal_receiver;
原文链接：https://blog.csdn.net/Hehuyi_In/article/details/127481887
```

​	

# ==14.函数的三态==

* volatile 函数在同一个事务中即使是相同的参数,返回的结果也会不同; 比如 clock_timestamp()

* stable函数在同一个事务中对于相同的参数,返回的结果也会相同; 比如 now()

* immutable函数却是只要给定相同参数,永远返回相同的结果. 比如 ceil



# ==15.表结构变更那些操作是非 online (不能在线变更的)的==

PG 11 之前新增带有 default 值的列 需要全表 rewrite ,但是从 11 开始,  不用全表重写
修改字段类型
减少字段长度

cluster
vacuum full



### PostgreSQL 之 alter table add column 会锁表吗

[PostgreSQL之alter table add column会锁表吗 - 墨天轮 (modb.pro)](https://www.modb.pro/db/84224)

首先答案是: 会锁表，且获得的是 ACCESS EXCLUSIVE 锁，但是不同情况下，锁的持有时间会不同。

当列的默认值为NULL时，该列的添加应该非常快，因为它不需要重写表:它只是系统表中的更新。

当列具有非NULL的默认值时，它取决于PostgreSQL版本: 在11.0及之后的版本，不会立即重写所有的行，所以它应该和NULL的情况一样快。但是对于版本10或更早的表，它是完全重写的，因此根据表的大小，它可能非常昂贵。



# 16.为什么要使用 create index concurrently 以及 CIC 的危害

![image-20230630184312946](/images/image-20230630184312946.png)

## 为什么要用 CIC

       降低锁级别，提升业务并发度。create index需要持有5级锁，会阻塞对表的DML操作；而CIC只需要持有4级锁，与DML操作兼容，基本可以做到不影响业务。
## 注意事项

有一些算不上危害这么严重，但需要注意：

*  如果CIC语句异常结束（被取消、被kill等），会在DB中留下一个invalid索引。该索引无法被使用，但每次DML操作还需要更新它，降低效率
*  pg 14中，14.4版本前CIC有重大bug，有概率导致索引损坏、数据丢失。

* CIC 需要扫描两遍表，耗时更长，资源消耗更多
* 当有长事务时，创建语句会持续被阻塞
* CIC是自阻塞的，不能在一个表同时执行
* 分区表不支持在主表CIC创建索引（单独在各子表可以）

# 17.vm / fsm / init 文件是什么

vm文件，可见性映射文件：如果一个页中的所有元组都是可见的（或者均已冻结），vm文件中会将两个对应标志位设为1。后续可以跳过对这些页的vacuum,freeze操作，提升性能，另外在执行计划中也可以使用  index-only scans，更加高效。只用于表不用于索引。
fsm文件，空闲空间映射文件：保存页中可用空间的映射，在新数据插入时快速定位可用位置。既用于表也用于索引。由于索引需要按顺序插入、不能像普通数据可以插入任意页，因此索引的fsm文件记录所有page的free space意义不大，它只记录完全为空以及可以重用的页
init文件，初始文件：仅对unlogged table可用

# ==18.逻辑备份如何保障一致性的==

**原子性保障**:

* 在备份前会开启一个事务，隔离级别为可重复读 (9.1版本开始默认隔离级别为 REPEATABLE READ,之前为 SERIALIZABLE），整个备份期间使用相同的快照，导出的所有对象都是基于该时间点的快照下的数据另
* 逻辑备份会对表加1级锁，避免备份过程中表结构被改变或者表被drop、truncate等



# 19.简述 PostgreSQL 中的权限体系
> [PostgreSQL 角色和权限详解 - 墨天轮 (modb.pro)](https://www.modb.pro/db/653010)



最常用的如下：

instance级：pg_hba.conf，哪些服务器可以连接到数据库、认证方式
DB级：连接、创建等
schema级：usage、创建
table级：增删改查、reference、truncate、trigger
列级：增改查、reference
行级：创建行策略，只允许用户看某些行

# ==20.数据库的表连接方式以及各自的使用场景==

![image-20230703185720250](/images/image-20230703185720250.png)

# ==21.各种索引使用场景==

![image-20230627172037085](/images/image-20230627172037085.png)

# ==22.索引失效的原因==

异常 invalid : 比如创建到一半, 被取消了

人为设置成 invalid

where 条件中对索引字段使用了运算: 包括使用了函数, 表达式操作,以及类型转换

使用了 like %xxx, 无法正常走索引, 可以通过 pg_trgm 插件以及 gin 索引来解决

开启了 old_snapshot_threshold 参数, 在创建索引之前存在长事务没有, 那么该创建的索引无法生效

优化器人为全表扫描比走索引更快, 比如表数据量很小或者表很大但是返回的数据量也很大

统计信息过旧

索引重复,走的其他索引

通过 pg_hint_plan  固定了索引

[生产案例 | 费解的索引失效 (qq.com)](https://mp.weixin.qq.com/s?__biz=MzUyOTAyMzMyNg==&mid=2247486460&idx=1&sn=e8f741f27c89175d60791f40f8b997b6&chksm=fa6623cdcd11aadbc9891efaab690ef04fcda53f7336432bed317ed4477ad3359ddffa07a722&token=472580641&lang=zh_CN&scene=21#wechat_redirect)

![image-20230627184232462](/images/image-20230627184232462-7862554.png)

# 23.空值是如何存储的以及索引中是否会存储空值

* 索引如何存储空值
PG 中 BTree 索引存储空值（SQL Server 也存，Oracle 不存），在官方文档也有提到

> Also,an IS NULL or IS NOT NULL condition on an index column can be used with a B-Tree index。

* tuple(数据) 中如何存储空值

  在pg元组头数据中，有一个t_bits 的数组，用于存储空值位图。当元组中没有null值的时候，t_bits可以被认为是空的，当元组有null值的列时，t_bits使用一个bit来表示列是否为null




# ==24.为什么需要有全页写（full_page_write）==

避免两种场景下的“部分写”（数据块不一致）问题：

由于DB page与 OS page默认大小不一致，在pg异常宕机（或出现磁盘错误）时，数据文件中的页有可能只写入了一部分。
使用操作系统命令备份正在写入的数据库时，备份文件中的数据块可能不一致。
无论是崩溃恢复还是备份还原的恢复，都无法基于不一致的数据块进行。

# ==25.慢 SQL 如何排查==

**如何获取慢 SQL**

打开日志开关 log_min_duration_statement

**如何定位 SQL 慢的原因**

* **整体排查**

  - 系统负载：CPU、内存、IO资源使用率，是否为数据库造成的

  - IO延迟：未达到IO瓶颈时，10ms以上通常有问题，联系硬件组排查

* 偶尔慢

  ==执行计划是否有变动==

  ==是否统计信息不够新==

  ==数据量可能临时剧增==

* 一直慢

  查看执行计划, 是慢在哪个过程中, 是解析慢还是返回结果慢

  * 如果是解析阶段, 考虑是否可以简化 SQL 写法, 是否可以使用绑定变量

  * 如果是数据返回阶段, 考虑减少与客户端的交互或减少返回数据量

  条件过滤高的字段是否有索引

  索引是否失效了

  SQL 能否改写

  能否开启并行 (max_parrallel_xxx)

  是否有等待事件,具体是等待啥

# ==26. 死锁产生原因以及检测机制==

**死锁产生必要条件**

互斥、占有且等待、不可抢占、循环等待

**原因:**

事务间出现了相互等待，使得其中的每个事务都无法进行下一步动作。

此时需要有死锁检测机制发现死锁，并终止其中一个事务，打破循环等待

**死锁检测机制**

- 对于常规锁（也包括行锁），deadlock_timeout参数默认为1s，及锁等待出现一秒后进行死锁检测。
- 如果事务只通过本地锁表和 fast path 就能获得锁，则它不受死锁检测的影响。
- 对于自旋锁和轻量锁，pg 没有死锁检测机制



# ==27.复制槽的作用以及危害==

**复制槽的作用**

逻辑复制槽用于逻辑同步的机制

物理复制槽用于避免 主库可能将备库中尚且需要的wal删除的风险

>  启用 hot_standby_feedback后，备库会将WAL接收的位置告知主库，创建复制槽后这个信息会保存在复制槽。对于物理复制，可以保证主库不提前删除备库尚未使用的日志，避免主从同步中断，不过物理复制并不是必须的。对逻辑复制而言，逻辑复制槽是必须的。

**复制槽的危害**

如果备库接收 WAL 过慢，主库会堆积大量 WAL 导致磁盘空间暴增。

可能造成主库vacuum可以清理的元组非常少，加剧表膨胀问题。




# ==28.进程调度, D 进程的危害以及形成原因==

**D 进程危害:**

大量 D 进程出现, 说明服务器遇到 IO 问题，可能导致服务器性能急剧下降甚至卡死。

**可能的形成原因:**

- 存储、虚拟化层等异常导致 IO 性能急剧下降，通常可以看到磁盘延迟飙高

  ```bash
  002_学习/数据库/PG/Linux如何判断硬盘延迟飙升.md
  ```

- 大量的IO操作，例如备份、大量慢SQL或者统计分析类语句执行

- 内存使用过多，触发了swap、直接内存回收、碎片整理等操作，出现大量IO

# ==29.为啥要使用分区表以及分区表的优缺点==

**使用分区表原因**

① 管理优势

冷热数据分层

快速删除数据
快速归档及加载数据

② 性能优势

分区裁剪，加速数据访问
分区子表可以并发执行vacuum
分区可以放至不同目录，打散IO（通过条带化或底层存储raid等技术会更好）

**分区表劣势**

低版本分区类型较少，实现复杂，性能优化也较少
为充分发挥优势，需要合理设计分区键及查询，增加了应用设计复杂度
hash分区数过多时，性能有可能反而下降，需要合理设置数量



# 30.软硬解析的概念

**硬解析**

       对于一个SQL语句，优化器首先需要进行词法分析、语法分析，将其转换为pg能识别的查询树，再对其解析重写和优化，生成执行计划树，执行器才能知道如何执行该语句，这种完整的解析叫做硬解析。

**软解析**
       显然，如果每个语句每次都执行如此复杂的步骤，效率会很低，因此pg会将SQL解析出来的执行计划缓存在进程内存中，符合一定条件时可以直接使用，提高效率，这种解析叫做软解析。

PG绑定变量SQL解析的 五次机制

五次机制是为了防止数据倾斜，导致使用低效的执行计划。

前5次执行的SQL：都根据实际传入变量生成执行计划（叫做custom plan），属于硬解析。
第6次执行的SQL：生成一个通用的执行计划（generic plan），并与前5次执行计划比较。
       如果不差于前5次：固定第6次的执行计划，后续即使参数再发生变化，该SQL的执行计划也不会再变，属于软解析。
       如果差于前5次中任何一个执行计划，以后每次都重新生成执行计划，即都是硬解析。
强制使用软/硬解析

> PG 12 中引入了 force_custom_plan 参数，有以下可选值: 

auto：默认，即按照五次机制处理
force_custom_plan：永远进行硬解析，适用于有数据倾斜且性能和稳定性要求高的 SQL
force_generic_plan：永远使用generic plan，适用于没有数据倾斜或者性能和稳定性要求不高的 SQL (强制使用通用执行计划)

# 31.内存回收机制

# 32.回收对象

# 33.行锁是如何实现的,是否会存储到共享内存中

**PG 通常有两种方式会用到行锁：**

常见的是对行的 update 与 delete 操作

select for share/for key share/for update / for no key update

# ==34.配置参数优化==

参考: [PostgreSQL数据库优化一优化概述及操作系统调优 - 墨天轮 (modb.pro)](https://www.modb.pro/db/330950)

```bash
# 德哥总结的公式
## 内存相关
shared_buffers = 16GB                  # 对于数据库专用服务器, IF use hugepage: 主机内存*(1/4)   ELSE: min(32GB, 主机内存*(1/4)) ; 如果非数据库专用,得酌情减少该值
work_mem = 16MB                        # max(min(物理内存/4096, 64MB), 4MB)             
maintenance_work_mem = 1GB             # min( 8G, (主机内存*1/8)/max_parallel_maintenance_workers )       # 维护性操作会用到: 如 CREATE INDEX 、ALTER TABLE ADD FOREIGN KEY , VACUUM 、等操作需要的内存



### vacuum 参数优化
autovacuum_max_workers = 8             # max(min( 8 , CPU核数/2 ) , 5) 
autovacuum_vacuum_cost_delay 默认值 20ms 太大, 建议改为 2ms
autovacuum_vacuum_cost_limit 默认值 200 太小,  SSD 建议改为 10000 ; HDD 建议改为 1000~2000


### 并发读优化
max_parallel_workers_per_gather = 12   # min( max(2, CPU核数-4) , 24 )   # 并行查询
max_parallel_workers = 12              # max(2, CPU核数-4)               # 设置数据库允许的最大并行度

max_parallel_maintenance_workers = 8   # min( max(2, CPU核数/2) , 16 )   # 并行维护:比如创建索引

## wal 清理
max_wal_size = 32GB                    # shared_buffers*2  
min_wal_size = 8GB                     # shared_buffers/2  

## 清理相关
### 释放长时间空闲的事务
idle_in_transaction_session_timeout = 1800s  # 可以根据实际业务酌情修改, 比如 5 分钟或者10 分钟等

### 释放已无法继续通讯的空闲连接
tcp_keepalives_idle = 60
tcp_keepalives_count = 10
tcp_keepalives_interval = 5

## bgwriter 参数优化
| 参数                        | 默认值     | 优化建议                 |
| ------------------------- | ------- | -------------------- |
| `bgwriter_delay`          | `200ms` | 降低到 `100ms` 提高响应频率   |
| `bgwriter_lru_maxpages`   | `100`   | 增加到 `200~500`，提升写出上限 |
| `bgwriter_lru_multiplier` | `2.0`   | 提高到 `3.0`，增加清理比例     |



### wal 优化
wal_compression = on: 节省磁盘空间

### wal_bufferes 优化 
https://postgresqlco.nf/doc/zh/param/wal_buffers/
On very busy, high-core machines it can be useful to raise this to as much as 128MB.
缓冲区的默认大小由wal_buffers设置设置―最初为16MB。
如果要调优的系统有大量并发连接,那么wal_buffers的值越高,性能越好
经验值 shared_buffers的 1/32 的尺寸（大约3%）

max_prepared_transactions=max_connections       # max_prepared_transactions=max_connections   
max_sync_workers_per_subscription = 12 # min ( 32 , max(2, CPU核数-4) )  


# 成本相关
# random_page_cost
hdd default is 4
ssd recommend to 1

# effective_cache_size 优化
effecve_cache_size 用来估计索引的成本用的
值太低,查询规划器可能会决定不使用某些索引,即使它们可以极大地提高查询速度。
保守值是系统上可用内存总量的 1/2
最常见的情况是,该值被设置为专用DB服务器上系统总内存的75%,


# Linux 层面
## 避免 OOM killer
如果不想 PostgreSQL 被 OOM killer , 需要将该参数设置为 2
* 查看
[root@node100 pgsql]# sysctl -a |grep overcommit_memory
vm.overcommit_memory = 0

* 设置
vm.overcommit_memory = 2

## 写缓存优化
在大内存服务器上, 可以将如下两者值调整更低
[root@node100 pgsql]# sysctl -a |grep "dirty.*ratio" 
vm.dirty_background_ratio = 3
vm.dirty_ratio = 10

比如改为
vm.dirty_background_ratio = 1
vm.dirty_ratio = 2

## IO 预读优化
[root@node100 pgsql]# df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda5       114G   59G   49G  55% /
devtmpfs         16G     0   16G   0% /dev
tmpfs            16G   72M   16G   1% /dev/shm
tmpfs            16G   41M   16G   1% /run
tmpfs            16G     0   16G   0% /sys/fs/cgroup
/dev/sda2       788G  420G  328G  57% /home
/dev/sda1       488M  122M  331M  27% /boot
tmpfs           3.2G     0  3.2G   0% /run/user/0


[root@node100 pgsql]# blockdev --getra /dev/sda5
256
[root@node100 pgsql]# 
[root@node100 pgsql]# blockdev --setra 4096 /dev/sda5
[root@node100 pgsql]# blockdev --getra /dev/sda5
4096
[root@node100 pgsql]# 
上面设置, 只是临时生效, 需要放到/etc/rc.local 中, 
如果想让全表扫描更快, 可以将预读参数调整更大些,比如改为 2MB (4096个扇区,表示2MB)

fs.aio-max-nr = 1048576
fs.file-max = 6815744
kernel.shmall = 33554432
kernel.shmmax = 137438953472
kernel.shmmni = 4096
kernel.sem = 500 64000 200 256
kernel.panic_on_oops = 1
net.ipv4.ip_local_port_range = 9000 65500
net.core.rmem_default = 262144
net.core.rmem_max = 4194304
net.core.wmem_default = 262144
net.core.wmem_max = 1048576
vm.swappiness = 0
vm.dirty_background_ratio = 3
vm.dirty_ratio = 80
vm.dirty_expire_centisecs = 500
vm.dirty_writeback_centisecs = 100


PostgreSQL中的一些vacuum参数是按照原先的机械硬盘配置的，这些参数都有一些保守，如vacuum_cost_limit默认值为200，通常太小了，对于有cache的raid卡，这个值应该设置成1000左右，对于ssd，应该设置成10000。很多一些用户就是因为这个参数设置的太小，导致一些用户旧版本数据没有得到及时清理，导致数据库的年龄不断增加，当离20亿还有100万时，PostgreSQL为了安全，就会主动宕下来。
autovacuum_vacuum_cost_delay的值也应该设置成10ms或更低，因为为了让系统更平稳，整理完2000个数据块后休眠20ms，不如设置成整理完1000个数据块后就休眠10ms，这样会让系统更平稳。所以正确的配置是把autovacuum_vacuum_cost_delay配置成10ms或5ms后，如果觉得vacuum影响大，应该把vacuum_cost_limit调小，而不是调整autovacuum_vacuum_cost_delay这个值。
另对于一些事务繁忙的数据库autovacuum_max_workers为3也小了，这个参数表示可以同发做vacuum的数目为3，我们可以把这个参数设置成10，这样vacuum整理就更及时了。
```

# PostgreSQL：如何合理设置 `checkpoint_completion_target` 和分析 `pg_stat_bgwriter` 以优化 `bgwriter` 参数

合理设置 `checkpoint_completion_target` 和 `bgwriter` 系列参数，可以平滑磁盘 I/O，减少 checkpoint 瞬时压力，提升整体性能。以下是详细说明和实践分析方法。

---

## 🎯 一、如何设置合适的 `checkpoint_completion_target`

### ✅ 含义回顾：

* 该参数控制 checkpoint 在整个间隔周期中完成的比例（0\~1）。
* 越大表示写入越分散和平滑，减轻 I/O 峰值。

### 🧠 设置原则：

| 系统特性                 | 推荐值       | 说明          |
| -------------------- | --------- | ----------- |
| I/O 资源充足、追求快速完成      | `0.5~0.6` | 默认值即可       |
| 有明显的 checkpoint 写入峰值 | `0.7~0.9` | 增大，分摊写入压力   |
| SSD、写延迟低的系统          | `0.8`     | 写入快速，仍可平滑处理 |
| 机械硬盘、写入延迟高           | `0.9~1.0` | 更需要最大限度平滑写入 |

### 🔍 判断依据：

使用 `pg_stat_bgwriter` 中以下字段评估 checkpoint 是否造成性能波动：

```sql
SELECT * FROM pg_stat_bgwriter;
```

| 字段                      | 含义                       | 说明 |
| ----------------------- | ------------------------ | -- |
| `checkpoints_timed`     | 定时触发的 checkpoint 数量      |    |
| `checkpoints_req`       | WAL 写入量触发的 checkpoint 数量 |    |
| `checkpoint_write_time` | checkpoint 写入耗时（毫秒）      |    |
| `checkpoint_sync_time`  | fsync 同步磁盘耗时（毫秒）         |    |

> 如果 `checkpoint_write_time` 或 `checkpoint_sync_time` 非常大（如秒级），建议调高 `checkpoint_completion_target`，以减轻一次性 I/O 峰值。

---

## 🧠 二、如何根据 `pg_stat_bgwriter` 优化 `bgwriter` 参数

### ✅ 作用回顾

后台写进程 `bgwriter` 会预先将脏页写入磁盘，降低 checkpoint 时的写入压力。

### 📊 关键指标解读：

```sql
SELECT * FROM pg_stat_bgwriter;
```

重点关注字段如下：

| 字段                      | 含义               | 优化建议                  |
| ----------------------- | ---------------- | --------------------- |
| `buffers_clean`         | bgwriter 写入的缓冲页数 | 越高表示其作用大              |
| `maxwritten_clean`      | 达到写入上限的次数        | 若频繁增加，说明参数太保守         |
| `buffers_backend`       | 用户进程自行写入的页数      | 较高表示 bgwriter 未及时工作   |
| `buffers_backend_fsync` | 用户进程 fsync 的次数   | 应尽量由 bgwriter 执行，越低越好 |

---

### 🔧 `bgwriter` 参数优化建议

| 参数                        | 默认值     | 优化建议                 |
| ------------------------- | ------- | -------------------- |
| `bgwriter_delay`          | `200ms` | 降低到 `100ms` 提高响应频率   |
| `bgwriter_lru_maxpages`   | `100`   | 增加到 `200~500`，提升写出上限 |
| `bgwriter_lru_multiplier` | `2.0`   | 提高到 `3.0`，增加清理比例     |

#### 示例配置（适用于高写入系统）：

```conf
bgwriter_delay = 100ms
bgwriter_lru_maxpages = 400
bgwriter_lru_multiplier = 3.0
```

---

## 📌 诊断逻辑小结

| 观察字段                       | 现象                     | 优化建议                                            |
| -------------------------- | ---------------------- | ----------------------------------------------- |
| `maxwritten_clean` 很高      | 达到写出上限                 | 增加 `bgwriter_lru_maxpages`                      |
| `buffers_backend` 很高       | 后台写不及时                 | 增加 `bgwriter_lru_maxpages`，或调低 `bgwriter_delay` |
| `checkpoint_write_time` 很高 | checkpoint 写入造成 I/O 峰值 | 提高 `checkpoint_completion_target`，优化 bgwriter   |

---

## 🛠️ 实战流程建议

1. 运行以下 SQL 每小时抓取一次：

   ```sql
   SELECT now(), * FROM pg_stat_bgwriter;
   ```

2. 分析过去数小时数据差值：

   * 计算每小时 `buffers_clean`、`buffers_backend`、`maxwritten_clean` 增长量
   * 如 `buffers_backend` 高于 `buffers_clean`，说明 bgwriter 工作不足

3. 逐步调整参数，观察 `buffers_backend` 是否下降、`maxwritten_clean` 是否减少

---

## ✅ 最佳实践建议组合（中大型实例）：

```conf
checkpoint_timeout = 15min
checkpoint_completion_target = 0.9
max_wal_size = 2GB
bgwriter_delay = 100ms
bgwriter_lru_maxpages = 400
bgwriter_lru_multiplier = 3.0
```

如你能提供实际运行的 `pg_stat_bgwriter` 输出或 WAL 写入速度，我可以进一步帮你诊断是否可以继续优化这些参数。是否要继续分析？

# ==35. SQL 优化==

![image-20230630153919942](/images/image-20230630153919942.png)



# ==36.索引优化==

![image-20230630153453262](/images/image-20230630153453262-8110495.png)

* include 索引

  [PostgreSQL 11 新特性解读 : Indexs With Include Columns-阿里云开发者社区 (aliyun.com)](https://developer.aliyun.com/article/680214)

  

# 37. 监控项

- [ ] ![image-20230630173447989](/images/image-20230630173447989.png)



# 38. postgresql repmgr 选举原理

* 参考: 

[工具 | PG 集群复制管理工具 repmgr - 掘金 (juejin.cn)](https://juejin.cn/post/7036925433396494367)

* repmgr 与 PG 兼容矩阵

  ## ![image-20230630185154364](/images/image-20230630185154364.png)

repmgr 选举候选备节点按照以下顺序选举：LSN > Priority > Node_ID 

系统将优先选举一个 LSN 较大的节点，作为候选备节点
若 LSN 一样，会根据 Priority 优先级进行比较

（该优先级是在配置文件中进行参数配置，如果 Priority 为 0，则代表该节点被禁止提升为主节点）；
若优先级也一样，会比较节点的 Node ID，小者会优先选举)
