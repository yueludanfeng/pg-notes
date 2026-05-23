---
title: "PG等待事件清单（建议收藏）"
date: 2023-07-07
description: "最近发现 PG 的等待事件的名称发生了一些变化，因此需要重新对相关的知识图谱进行更新。我们的知识图谱中，把 PG 以及衍生的数据库产品中的等待事件是作为相同的一类知识梳理的，因此在梳理过程中，合并了 PG 及其衍生数据库产品的等待事件，包括"
categories: ["PostgreSQL 笔记"]
tags: ["PG等待事件", "VACUUM", "WAL", "内存管理", "分区表", "参数配置", "备份恢复", "流复制", "索引", "统计信息", "逻辑复制", "锁"]
series: []
---

[PG等待事件清单（建议收藏） (qq.com)](https://mp.weixin.qq.com/s/B6Fw1B61b4ZSTe63TRcFaQ)
最近发现 PG 的等待事件的名称发生了一些变化，因此需要重新对相关的知识图谱进行更新。我们的知识图谱中，把 PG 以及衍生的数据库产品中的等待事件是作为相同的一类知识梳理的，因此在梳理过程中，合并了 PG 及其衍生数据库产品的等待事件，包括了近期大热的 Gaussdb。Gaussdb 对 PG 的等待事件扩展了很多，不过因为缺少实际案例和文档，很多 Gaussdb 的等待事件的定义我们还没有厘清，有些能够通过 openGauss 的源码来做辅助分析，有些就只能根据字面意思去望文生义，其质量也就要打折扣了。对于 PG 的等待事件，因为从 PG 13开始，LWLOCK 的很多等待事件名称发生了变化，因此在这个表格里会有重复的定义。

今天我把这张清单发出和大家共享，如果有朋友对这项工作有兴趣，也可以和我联系，有关于这方面的知识也可以告诉我，我会不断的把我们对这方面的理解和认知发出来和大家分享。下面的表格建议大家收藏一下，以供未来不时之需。

        

         

|   |   |   |   |
|---|---|---|---|
|分类|名称|描述|关联根因|
|Activity|ArchiverMain|归档进程的主循环等待|后台进程，一般可忽略|
|Activity|AutoVacuumMain|autovacuum启动进程的主循环等待|后台进程，一般可忽略|
|Activity|BgWriterHibernate|后台写入进程等待，正在休眠|后台进程，一般可忽略|
|Activity|BgWriterMain|bgwriter进程的主循环等待|后台进程，一般可忽略|
|Activity|CheckpointerMain|CKPT进程主循环等待|后台进程，一般可忽略|
|Activity|LogicalApplyMain|逻辑应用进程主循环等待|后台进程，一般可忽略|
|Activity|LogicalLauncherMain|逻辑启动进程主循环等待|后台进程，一般可忽略|
|Activity|PgStatMain|统计信息采集进程主循环等待|后台进程，一般可忽略|
|Activity|RecoveryWalAll|实例恢复时等待WAL数据流到达|等待新的WAL数据|
|Activity|RecoveryWalStream|在恢复时再次尝试检索 WAL 数据之前，等待任何类型的源（本地、存档或流）中的 WAL 数据不可用时|等待新的WAL数据|
|Activity|SysLoggerMain|syslogger进程主循环等待|后台进程，一般可忽略|
|Activity|WalReceiverMain|WAL接收进程主循环等待|后台进程，一般可忽略|
|Activity|WalSenderMain|WAL发送进程主循环等待|后台进程，一般可忽略|
|Activity|WalWriterMain|WAL写进程主循环等待|后台进程，一般可忽略|
|BufferPin|BufferPin|等待获得BUFFER的PIN锁|热块、DBCACHE|
|Client|ClientRead|等待读取客户端输入|未提交事务，空闲等待|
|Client|ClientWrite|等待向客户端发送数据|网络、TOPSQL|
|Client|LibPQWalReceiverConnect|在 WAL 接收器中等待建立与远程服务器的连接。||
|Client|LibPQWalReceiverReceive|等待 WAL 接收器接收来自远程服务器的数据。||
|Client|SSLOpenServer|等待SSL连接||
|Client|WalReceiverWaitStart|等待启动进程发送初始化复制数据流||
|Client|WalSenderWaitForWAL|在WAL发送进程中等待WAL刷新||
|Client|WalSenderWriteData|在 WAL 发送者进程中处理来自 WAL 接收者的回复时等待任何活动||
|Extension|Extension|等待和extension交换数据或消息|和扩展插件有关|
|IO|BaseBackupRead|等待基础备份读取文件|磁盘IO|
|IO|BaseBackupSync|等待基础备份数据写入持久化存错|磁盘IO|
|IO|BaseBackupWrite|等待基础备份数据写入文件|磁盘IO|
|IO|BufFileRead|bffered文件读等待|磁盘IO，热块，DBCACHE|
|IO|BufFileWrite|buffered文件写等待|DBCACHE,磁盘IO|
|IO|BufHashTableSearch|缓冲区HASH 表查询|缓冲区hash表查询|
|IO|ControlFileRead|等待控制文件读|磁盘IO|
|IO|ControlFileSync|等待控制文件写入持久化存储|磁盘IO|
|IO|ControlFileSyncUpdate|等待控制文件修改到达持久化存储|磁盘IO|
|IO|ControlFileWrite|等待写入控制文件|磁盘IO|
|IO|ControlFileWriteUpdate|等待一个修改控制文件的写操作|磁盘IO|
|IO|CopyFileRead|COPY命令中的读等待|磁盘IO|
|IO|CopyFileWrite|COPY命令中的写等待|磁盘IO|
|IO|DataFileExtend|等待 relation数据文件扩展|磁盘IO，磁盘容量|
|IO|DataFileFlush|等待 relation数据文件写入持久存储|磁盘IO|
|IO|DataFileImmediateSync|等待一个立即同步 relation 数据文件写入持久存储|磁盘IO|
|IO|DataFilePrefetch|等待从Relation数据文件异步预读数据|磁盘IO|
|IO|DataFileRead|等待从relation数据文件读数据|磁盘IO|
|IO|DataFileSync|等待 relation 数据文件的变化写入持久存储|磁盘IO|
|IO|DataFileTruncate|等待relation 数据文件截断|磁盘IO|
|IO|DataFileWrite|等待 relation数据文件写|磁盘IO|
|IO|DisableConnectFileRead|HA锁分片逻辑文件读取||
|IO|DisableConnectFileSync|HA锁分片逻辑文件强制刷盘||
|IO|DisableConnectFileWrite|HA锁分片逻辑文件写入||
|IO|DoubleWriteFileRead|双写文件读，和双写区IO有关的读||
|IO|DoubleWriteFileWrite|双写文件写，与脏快写盘有关|并发DML、写操作|
|IO|DSMFillZeroWrite|等待向一个动态共享内存文件写入字节0|内存|
|IO|DWSingleFlushGetPos|刷新日志数据到永久存储|磁盘IO，事务并发|
|IO|DWSingleFlushWrite|刷新日志数据到永久存储|磁盘IO，事务并发|
|IO|LockFileAddToDataDirRead|向数据字典锁文件添加一行时等待读操作|磁盘IO，并发DDL|
|IO|LockFileAddToDataDirSync|向数据字典锁文件添加一行时等待数据写入持久存储|磁盘IO，并发DDL|
|IO|LockFileAddToDataDirWrite|向数据字典锁文件添加一行时等待写操作|磁盘IO，并发DDL|
|IO|LockFileCreateRead|创建数据字典锁文件时等待读操作|磁盘IO|
|IO|LockFileCreateSync|创建数据字典锁文件时等待数据写入持久存储|磁盘IO|
|IO|LockFileCreateWRITE|创建数据字典锁文件时等待写操作|磁盘IO|
|IO|LockFileCreateWrite|创建数据字典锁文件时等待写操作|磁盘IO|
|IO|LockFileReCheckDataDirRead|在重新检查数据字典锁文件期间等待读操作|磁盘IO|
|IO|LOGCTRL_SLEEP|在等待一个用于日志控制的事件类型，发生在执行需要管理日志的操作时|磁盘IO，并发事务|
|IO|LogicalRewriteCheckpointSync|CKPT时等待逻辑重写映射到达持久化存储|磁盘IO，检查点,逻辑复制|
|IO|LogicalRewriteMappingSync|逻辑重写时等待映射数据达到持久化存储|磁盘IO、逻辑复制|
|IO|LogicalRewriteMappingWrite|逻辑重写时等待写映射数据达到持久化存储|磁盘IO、逻辑复制|
|IO|LogicalRewriteSync|等待逻辑重写映射到达持久化存储|磁盘IO、逻辑复制|
|IO|LogicalRewriteTruncate|等待映射数据截断到达持久化存储|磁盘IO、逻辑复制|
|IO|LogicalRewriteWrite|等待一个逻辑重写映射写操作|磁盘IO、逻辑复制|
|IO|MPFL_INIT|等待初始化或者销毁内存池||
|IO|MPFL_READ|等待读取内存池||
|IO|MPFL_WRITE|等待写入内存池||
|IO|OBSList|对象存储相关||
|IO|OBSRead|对象存储相关||
|IO|OBSWrite|对象存储相关||
|IO|PredoApply|并行日志回放中等待当前工作线程等待其他线程回                    <br>放至本线程LSN|并行日志恢复|
|IO|PredoProcessPending|并行日志回放中当前记录回放等待其它记录回放完                    <br>成|并行日志恢复|
|IO|RelationMapRead|等待Relation Map文件读|磁盘IO、逻辑复制|
|IO|RelationMapSync|等待Relation Map文件写入持久存储|磁盘IO|
|IO|RelationMapWrite|等待Relation Map文件写|磁盘IO|
|IO|ReorderBufferRead|RecorderBuffer管理中等待读操作（逻辑复制）|磁盘IO、逻辑复制|
|IO|ReorderBufferWrite|RecorderBuffer管理中等待写操作（逻辑复制）|磁盘IO、逻辑复制|
|IO|ReorderLogicalMappingRead|RecorderBuffer管理中等待逻辑映射文件读操作|磁盘IO、逻辑复制|
|IO|ReplicationSlotRead|等待复制槽控制文件的读操作|磁盘IO、复制|
|IO|ReplicationSlotRestoreSync|当复制槽控制文件从内存中复制时等待该文件写入持久存储|磁盘IO、复制|
|IO|ReplicationSlotSync|等待复制槽控制文件写入持久存储|磁盘IO、复制|
|IO|ReplicationSlotWrite|等待一个复制槽控制文件写操作|磁盘IO、复制|
|IO|SLRUFlushSync|检查点或者数据库关闭的时候，等待 SLRU数据写入持久存储|磁盘IO、检查点、数据库关闭|
|IO|SLRURead|等待SLRU页读取|磁盘IO|
|IO|SLRUSync|页写入后等待SLRU数据写入持久存储|磁盘IO|
|IO|SLRUWrite|等待 SLRU 页写操作|磁盘IO|
|IO|SnapbuildRead|等待读取序列化的历史目录快照|磁盘IO|
|IO|SnapbuildSync|等待序列化的历史目录快照写入持久存储|磁盘IO|
|IO|SnapbuildWrite|等待写入序列化的历史目录快照|磁盘IO|
|IO|StrategyGetBuffer|||
|IO|TimelineHistoryFileSync|等待通过流式复制接收到的时间线历史文件写入持久存储|磁盘IO|
|IO|TimelineHistoryFileWrite|流式复制时等待时间线文件上的一个写操作被收到|磁盘IO|
|IO|TimelineHistoryRead|等待时间线历史文件上的读操作|磁盘IO|
|IO|TimelineHistorySync|等待新创建的时间线历史文件写入持久存储|磁盘IO|
|IO|TimelineHistoryWrite|等待新创建的时间线历史文件上的写操作|磁盘IO|
|IO|TwophaseFileRead|等待两阶段状态文件读操作|磁盘IO、分布式事务|
|IO|TwophaseFileSync|等待两阶段状态文件写入持久存储|磁盘IO、分布式事务|
|IO|TwophaseFileWrite|等待两阶段状态文件写操作|磁盘IO、分布式事务|
|IO|UndoFileExtend|UNDO文件扩展|UNDO量增加|
|IO|UndoFileFlush|UNDO文件刷盘|并发事务|
|IO|UndoFilePrefetch|UNDO文件预读|一致性读|
|IO|UndoFileRead|UNDO文件读|一致性读|
|IO|UndoFileSync|UNDO文件同步|并发事务|
|IO|UndoFileWrite|UNDO文件写|并发事务|
|IO|VersionFileWrite|创建数据库时写入VERSION文件产生的等待|磁盘IO|
|IO|WALBootstrapSync|bootstrap的时候等待WAL文件写入持久存储|磁盘IO、启动|
|IO|WALBootstrapWrite|bootstrap的时候等待WAL页写操作|磁盘IO、启动|
|IO|WALBufferAccess|WAL BUFFER访问|并发事务|
|IO|WALBufferFull|WAL缓冲区满|WAL并发、并发修改、IO性能|
|IO|WALCopyRead|当使用拷贝一个现有的WAL 段创建一个新WAL段的时候等待读操作|磁盘IO、复制|
|IO|WALCopySync|当使用拷贝一个现有的WAL 段创建一个新WAL段的时候等待写入持久存储|磁盘IO、复制|
|IO|WALCopyWrite|当使用拷贝一个现有的WAL 段创建一个新WAL段的时候等待写操作|磁盘IO、复制|
|IO|WALInitSync|等待一个新初始化的WAL文件写入持久存储|磁盘IO、检查点|
|IO|WALInitWrite|初始化新的WAL文件的时候等待写操作|磁盘IO、检查点|
|IO|WALRead|等待WAL文件读|磁盘IO|
|IO|WALSenderTimelineHistoryRead|在 walsender 时间线命令期间等待从时间线历史文件中读取|磁盘IO、复制|
|IO|WALSync|等待 WAL 文件到达持久的存储空间|磁盘IO、WAL量|
|IO|WALSyncMethodAssign|WAL 同步模式时等待数据写入持久存储|磁盘IO、WAL量|
|IO|WALWrite|等待WAL文件写|磁盘IO、WAL量|
|IPC|BgWorkerShutdown|等待后台worker关闭||
|IPC|BgWorkerStartup|等待后台worker启动||
|IPC|BtreePage|等待继续并行 B 树扫描所需的页可用（并行索引扫描）|并行执行|
|IPC|ExecuteGather|执行Gather时等待子进程的活动|表分析|
|IPC|Hash/Batch/Allocating|HASH JOIN 相关|HASH JOIN|
|IPC|Hash/Batch/Electing|HASH JOIN 相关|HASH JOIN|
|IPC|Hash/Batch/Loading|HASH JOIN 相关|HASH JOIN|
|IPC|Hash/Build/Allocating|HASH JOIN 相关|HASH JOIN|
|IPC|Hash/Build/Electing|HASH JOIN 相关|HASH JOIN|
|IPC|Hash/Build/HashingInner|HASH JOIN 相关|HASH JOIN|
|IPC|Hash/Build/HashingOuter|HASH JOIN 相关|HASH JOIN|
|IPC|Hash/GrowBatches/Allocating|HASH JOIN 相关|HASH JOIN|
|IPC|Hash/GrowBatches/Deciding|HASH JOIN 相关|HASH JOIN|
|IPC|Hash/GrowBatches/Electing|HASH JOIN 相关|HASH JOIN|
|IPC|Hash/GrowBatches/Finishing|HASH JOIN 相关|HASH JOIN|
|IPC|Hash/GrowBatches/Repartitioning|HASH JOIN 相关|HASH JOIN|
|IPC|Hash/GrowBuckets/Allocating|HASH JOIN 相关|HASH JOIN|
|IPC|Hash/GrowBuckets/Electing|HASH JOIN 相关|HASH JOIN|
|IPC|Hash/GrowBuckets/Reinserting|HASH JOIN 相关|HASH JOIN|
|IPC|LogicalSyncData|等待逻辑复制远程服务发送数据，用于初始表同步|逻辑复制|
|IPC|LogicalSyncData|等待逻辑复制的远程服务器发送用于初始表                    <br>同步的数据||
|IPC|LogicalSyncStateChange|等待逻辑复制远程服务改变状态|逻辑复制|
|IPC|LogicalSyncStateChange|等待逻辑复制的远程服务器更改状态||
|IPC|MessageQueueInternal|等待其他进程连接到共享消息队列中||
|IPC|MessageQueueInternal|等待其他进程被挂接到共享消息队列||
|IPC|MessageQueuePutMessage|等待写一条协议消息到共享消息队列中||
|IPC|MessageQueuePutMessage|等待把一个协议消息写到一个共享消息队列||
|IPC|MessageQueueReceive|等待从共享消息队列中接收字节||
|IPC|MessageQueueReceive|等待从一个共享消息队列接收字节||
|IPC|MessageQueueSend|等待向共享消息队列发送字节||
|IPC|MessageQueueSend|等待向一个共享消息队列中发送字节||
|IPC|ParallelBitmapScan|等待并行位图索引扫描初始化|并行执行|
|IPC|ParallelCreateIndexScan|等待并行 CREATE INDEX 工作者完成堆扫描||
|IPC|ParallelFinish|等待并行查询worker结束计算|并行执行|
|IPC|ParallelFinish|等待并行工作者完成计算||
|IPC|ProcArrayGroupUpdate|当事务结束时等待组leader清除transaction id|长事务|
|IPC|ProcArrayGroupUpdate|等待组领袖在事务结束时清除事务 ID||
|IPC|Promote|等待备用节点升级||
|IPC|ReplicationOriginDrop|等待复制源变为非活动状态以被删除|复制槽|
|IPC|ReplicationOriginDrop|等待一个复制源头变得不活跃以便被删除||
|IPC|ReplicationSlotDrop|等待复制槽变为非活动状态以被删除|复制槽|
|IPC|ReplicationSlotDrop|等待一个复制槽变得不活跃以便被删除||
|IPC|SafeSnapshot|一个READ ONLY DEFERRABLE 事务等待snapshot|事务快照|
|IPC|SafeSnapshot|等 待 一 个 用 于 READ ONLY DEFERRABLE 事务的快照||
|IPC|SyncRep|同步复制时等待远程服务确认|同步复制|
|IPC|SyncRep|在同步复制期间等待来自远程服务器的确认。||
|Lock|advisory|等待获取建议用户锁||
|Lock|cstore_freespace|||
|Lock|extend|等待扩展 relation结束|EXTEND|
|Lock|filenode|||
|Lock|frozenid|等待修改 pg_database.datfrozenxid和 pg_database.datminmxid.|VACUUM、磁盘IO性能、数据库配置|
|Lock|object|除了relation外的其他数据库对象（DB,SCHEMA等）|DDL操作|
|Lock|page|等待获取relation中的一个页面的锁|热块、SHARED BUFFERS|
|Lock|partition|保护分区元数据一致性的串行化等待||
|Lock|partition_seq|||
|Lock|relation|等待获得一个关系上的锁|并发执行|
|Lock|speculative token|等待获取推测插入锁|热块、事务并发、热表|
|Lock|subtransactionid|||
|Lock|transactionid|等待一个事务结束|事务并发|
|Lock|tuple|等待获取元组（tuple）锁|热块、事务并发|
|Lock|userlock|等待获取用户锁||
|Lock|virtualxid|等待获取虚拟XID锁|并发执行、活跃会话|
|LWLock|AddinShmemInit|等待共享内存中的内存空间管理|共享内存初始化|
|LWLock|AddinShmemInitLock|等待共享内存中的内存空间管理|共享内存初始化|
|LWLock|AlterPortLock|||
|LWLock|ASPMappingLock|||
|LWLock|async|等待async (notify) buffer IO完成|活跃会话、磁盘IO性能|
|LWLock|Async Ctl|||
|LWLock|AsyncCtlLock|等待读取或者修改共享通知状态|会话数，并发执行，并发事务|
|LWLock|AsyncQueueLock|等待读取或者修改通知消息|会话数，并发执行，并发事务|
|LWLock|AutoanalyzeLock|||
|LWLock|AutoFile|等待修改postgresql.auto.conf 文件|参数文件修改|
|LWLock|AutoFileLock|等待修改postgresql.auto.conf 文件|参数文件修改|
|LWLock|Autovacuum|等待Autovacuum worker 或者launcher等待读取或者修改 autovacuum worker的当前状态|VACUUM|
|LWLock|AutovacuumLock|等待Autovacuum worker 或者launcher等待读取或者修改 autovacuum worker的当前状态|VACUUM|
|LWLock|AutovacuumSchedule|等待被选择做vacuum 的表仍然需要 vacuuming的确认信息|VACUUM|
|LWLock|AutovacuumScheduleLock|等待被选择做vacuum 的表仍然需要 vacuuming的确认信息|VACUUM|
|LWLock|BackendRandomLock|等待生成随机数|随机数生成|
|LWLock|BackgroundWorker|等待读取后者修改后台worker进程的状态|并行执行，后台进程启动，后台进程关闭|
|LWLock|BackgroundWorkerLock|等待读取后者修改后台worker进程的状态|并行执行，后台进程启动，后台进程关闭|
|LWLock|BadBlockStatHashLock|访问坏块统计信息内存数据产生的等待||
|LWLock|BarrierLock|确保主备节点达到一致性的屏障机制||
|LWLock|BlockchainVersionLock|在不同节点间传递区块链同步信息||
|LWLock|BtreeVacuum|等待读取或者修改vacuum相关的B树索引信息|VACUUM,索引|
|LWLock|BtreeVacuumLock|等待读取或者修改vacuum相关的B树索引信息|VACUUM,索引|
|LWLock|buffer_content|等待在DB CACHE中读写数据页|磁盘IO性能、热块、DBCACHE|
|LWLock|buffer_io|等待数据页IO完成|磁盘IO性能、检查点、热块|
|LWLock|buffer_mapping|等待将数据块与缓冲池中的缓冲区关联|DBCACHE，热块冲突|
|LWLock|BufferContent|等待在DB CACHE中读写数据页|磁盘IO性能、热块、DBCACHE|
|LWLock|BufferContent|等待访问内存中的PAGE|DBCACHE，热块冲突|
|LWLock|BufferContentLock|等待访问内存中的PAGE|DBCACHE，热块冲突|
|LWLock|BufferIOLock|类似于Oracle的BBW的read by other session|DBCACHE，热块冲突|
|LWLock|BufferMapping|等待将数据块与缓冲池中的缓冲区关联|DBCACHE，热块冲突|
|LWLock|BufFreelistLock|会话试图从缓冲区中分配或者释放缓冲区产生的等待|DBCACHE，热块冲突|
|LWLock|BufMapping|大量会话并发房屋shared buffer的HASH表产生的等待|DBCACHE，热块冲突|
|LWLock|BufMappingLock|大量会话并发房屋shared buffer的HASH表产生的等待|DBCACHE，热块冲突|
|LWLock|CacheSlotMappingLock|||
|LWLock|CaptureViewFileHashLock|||
|LWLock|CBMParseXlogLock|||
|LWLock|CheckpointerComm|等待管理fsync 请求|磁盘IO性能，并发写入|
|LWLock|CheckpointerCommLock|等待管理fsync 请求|磁盘IO性能，并发写入|
|LWLock|CheckpointLock|等待执行CKPT|并发事务|
|LWLock|clog|等待CLOG缓冲区的IO操作|事务并发、磁盘IO性能|
|LWLock|CLOG Ctl|||
|LWLock|CLogBufMappingLock|||
|LWLock|CLogControlLock|等待读取或者修改事务状态|并发事务|
|LWLock|CLogTruncationLock|等待执行txid_status 或者将可获得的最老的transaction id赋给它|事务并发、磁盘IO性能、检查点配置|
|LWLock|ClusterRPLock|||
|LWLock|commit_timestamp|等待 commit timestamp buffer IO操作完成|事务并发、参数配置、磁盘IO性能|
|LWLock|CommitTs|等待 commit timestamp buffer IO操作完成|事务并发、参数配置、磁盘IO性能|
|LWLock|CommitTsBuffer|为一个commit timestamp SLRU BUFFER等待IO完成|事务并发、参数配置、磁盘IO性能|
|LWLock|CommitTsControlLock|等待读取或者修改事务提交时间戳|事务提交，页控制相关，DB CACHE,并发事务，|
|LWLock|CommitTsLock|等待读取或者修改事务时间戳的最后值集合|事务提交，并发事务，|
|LWLock|CommitTsSLRU|等待访问commit timestamp SLRU CACHE|事务并发、参数配置、磁盘IO性能|
|LWLock|ConsumerStateLock|||
|LWLock|ControlFile|等待读取或者修改控制文件，或者创建一个新的WAL文件|DML,并发写入，磁盘IO性能|
|LWLock|ControlFileLock|等待读取或者修改控制文件，或者创建一个新的WAL文件|DML,并发写入，磁盘IO性能|
|LWLock|CSNBufMappingLock|||
|LWLock|CSNLOG Ctl|||
|LWLock|CsnMinLock|||
|LWLock|CStoreColspaceCacheLock|||
|LWLock|CStoreCUCacheSweepLock|||
|LWLock|CUSlotListLock|||
|LWLock|DataCacheLock|||
|LWLock|DataFileIdCacheLock|||
|LWLock|DataSyncRepLock|||
|LWLock|DelayDDLLock|||
|LWLock|DeleteCompactionLock|||
|LWLock|DeleteConsumerLock|||
|LWLock|DfsConnectorCacheLock|||
|LWLock|DfsSpaceCacheLock|||
|LWLock|DfsUserLoginLock|||
|LWLock|DnUsedSpaceHashLock|||
|LWLock|DoubleWriteLock|||
|LWLock|dummyServerInfoCacheLock|||
|LWLock|DWSingleFlushFirstLock|CKPT增量刷脏块|CKPT增量刷脏块|
|LWLock|DWSingleFlushPosLock|||
|LWLock|DWSingleFlushWriteLock|||
|LWLock|DynamicSharedMemoryControl|等待读取或者修改动态共享内存状态|动态共享内存分配、释放|
|LWLock|DynamicSharedMemoryControlLock|等待读取或者修改动态共享内存状态|动态共享内存分配、释放|
|LWLock|ExtensionConnectorLibLock|||
|LWLock|FdwPartitionCacheLock|||
|LWLock|FileStatLock|||
|LWLock|FullBuildXlogCopyStartPtrLock|||
|LWLock|GeneralExtendedLock|||
|LWLock|GlobalPrevHashLock|||
|LWLock|GlobalSeqLock|||
|LWLock|GlobalWorkloadLock|||
|LWLock|GPCClearLock|||
|LWLock|GPCCommitLock|||
|LWLock|GPCMappingLock|||
|LWLock|GPCTimelineLock|||
|LWLock|GTMHostInfoLock|||
|LWLock|gtt_shared_ctl|||
|LWLock|HadrSwitchoverLock|||
|LWLock|HypoIndexLock|||
|LWLock|InstanceRealTLock|||
|LWLock|InstanceTimeLock|||
|LWLock|InstrUserLockId|||
|LWLock|InstrWorkloadLock|||
|LWLock|IOStatLock|||
|LWLock|JobShmemLock|||
|LWLock|LLVMDumpIRLock|||
|LWLock|LLVMParseIRLock|||
|LWLock|lock_manager|在并行执行中，等待为后端添加或检查锁，或者等待加入或退出锁组|事务并发|
|LWLock|LockFastPath|等待更新进程的FAST PATH LOCK信息|事务并发|
|LWLock|LockManager|在并行执行中，等待为后端添加或检查锁，或者等待加入或退出锁组|事务并发|
|LWLock|LockMgrLock|在并行执行中，等待为后端添加或检查锁，或者等待加入或退出锁组|事务并发|
|LWLock|LogicalReplicationSlotPersistentDataLock|||
|LWLock|LogicalRepWorkerLock|等待逻辑复制的WORKER结束任务|流复制|
|LWLock|LsnXlogChkFileLock|||
|LWLock|LWTRANCHE_ACCOUNT_TABLE|||
|LWLock|MatviewSeqnoLock|物化视图序号锁等待|物化视图操作相关|
|LWLock|MaxPageFlushLsnFileLock|||
|LWLock|MetaCacheLock|||
|LWLock|MetaCacheSweepLock|||
|LWLock|MPFLLOCK|||
|LWLock|multixact_member|等待 multixact_member buffer IO操作完成|事务并发，磁盘IO性能|
|LWLock|multixact_offset|等待 multixact offset buffer IO操作完成|事务并发，磁盘IO性能|
|LWLock|MultiXactGen|等待读取或者修改共享组合事务( multixact)状态|并发事务|
|LWLock|MultiXactGenLock|等待读取或者修改共享组合事务( multixact)状态|并发事务|
|LWLock|MultiXactMember Ctl|||
|LWLock|MultiXactMemberBuffer|为一个multixact SLRU buffer等待IO|并发事务|
|LWLock|MultiXactMemberControlLock|等待读取或者修改组合事务(multixact) 成员映射信息|并发事务|
|LWLock|MultiXactMemberSLRU|等待访问multixact SLRU CACHE|并发事务|
|LWLock|MultiXactOffset Ctl|||
|LWLock|MultiXactOffsetBuffer|为一个multixact offset SLRU buffer等待IO|并发事务|
|LWLock|MultiXactOffsetControlLock|等待读取或者修改组合事务(multixact) 偏移映射信息|并发事务|
|LWLock|MultiXactOffsetSLRU|等待访问multixact offset SLRU CACHE|并发事务|
|LWLock|MultiXactTruncation|等待清空multixact 信息|并发事务|
|LWLock|MultiXactTruncationLock|等待读取或者截断 multixact 信息|事务并发，大事务|
|LWLock|NGroupMappingLock|||
|LWLock|NodeTableLock|||
|LWLock|NormalizedSqlLock|||
|LWLock|NotifyBuffer|等待Notify buffer的SLRU缓冲区上的IO||
|LWLock|NotifyQueue|等待读取或者修改Notify消息||
|LWLock|NotifyQueueTail|等待修改通知消息存储限制||
|LWLock|NotifyQueueTailLock|等待修改通知消息存储限制||
|LWLock|NotifySLRU|等待访问Notify SLRU缓冲||
|LWLock|OBSGetPathLock|||
|LWLock|OBSRuntimeLock|||
|LWLock|OidGen|等待分配或者赋予一个 OID|并发DDL|
|LWLock|OidGenLock|等待分配或者赋予一个 OID|并发DDL|
|LWLock|oldserxid|等待oldserxid buffer IO完成|磁盘IO性能，事务并发|
|LWLock|OldSerXid SLRU Ctl|||
|LWLock|OldSerXidLock|等待读取或记录冲突的可序列化事务|事务隔离级别，并发事务|
|LWLock|OldSnapshotTimeMap|等待读取或者修改旧的snapshot控制信息|事务并发，SAVEPOINT|
|LWLock|OldSnapshotTimeMapLock|等待读取或者修改旧的snapshot控制信息|事务并发，SAVEPOINT|
|LWLock|OperatorHistLock|||
|LWLock|OperatorRealTLock|||
|LWLock|parallel_append|在 Parallel Append 计划执行期间等待选择下一个子计划|并发APPEND写入|
|LWLock|parallel_hash_join|在 Parallel Hash 计划执行期间等待分配或交换一块内存或者更新计数器|并发HASH JOIN|
|LWLock|parallel_query_dsa|等待并行查询动态共享内存分配锁||
|LWLock|ParallelAppend|在 Parallel Append 计划执行期间等待选择下一个子计划|并发APPEND写入|
|LWLock|ParallelHashJoin|在 Parallel Hash 计划执行期间等待分配或交换一块内存或者更新计数器|并发HASH JOIN|
|LWLock|ParallelQueryDSA|等待并行查询动态共享内存分配锁||
|LWLock|PartIdCacheLock|分区表的数量过多或者被访问得过于频繁||
|LWLock|PartOidCacheLock|分区表的数量过多或者被访问得过于频繁||
|LWLock|PercentileLock|全局百分位缓冲区争用||
|LWLock|PerSessionDSA|等待并行查询动态共享内存分配锁||
|LWLock|PerSessionRecordType|并行查询中等待复合类型的相关信息||
|LWLock|PerSessionRecordType|并行查询中等待匿名记录类型的相关信息（比如CTE）||
|LWLock|PerXactPredicateList|并行查询中等待可序列化的对象的谓词锁定产生的等待||
|LWLock|PgfdwLock|外部访问引发的等待||
|LWLock|PGPROCLock|访问进程数组产生的等待||
|LWLock|PgStatsData|访问统计信息区域的等待||
|LWLock|PgStatsDSA|访问统计信息区域的等待||
|LWLock|PgStatsHash|访问统计信息区域的等待||
|LWLock|PLdebugger|PL/PGSQL跟踪|PL/PGSQL跟踪|
|LWLock|PldebugLock|PL/PGSQL跟踪|PL/PGSQL跟踪|
|LWLock|PoolerLock|试图从数据库连接处中获取或者释放一个连接引发的等待||
|LWLock|predicate_lock_manager|等待添加或检查谓词锁信息|并发执行|
|LWLock|PredicateLockManager|等待添加或检查谓词锁信息|并发执行|
|LWLock|PredicateLockMgrLock|当一个进程试图访问可序列化事务使用的谓词锁定信息时产生的，为了保护谓词锁定管理器的数据结构|并发执行|
|LWLock|proc|等待读取或者修改快速路径锁的信息|并发锁|
|LWLock|ProcArray|等待获得snapshot或者在会话结束时清理XID,或者查询XID|并发事务|
|LWLock|ProcArrayLock|等待获得snapshot或者在会话结束时清理XID,或者查询XID|并发事务|
|LWLock|ProcXactMappingLock|访问进程数组与事务数组之间的关系产生的等待|并发事务|
|LWLock|PruneDirtyQueueLock|清理脏页队列产生的等待||
|LWLock|RcvWriteLock|||
|LWLock|RelationMapping|等待更新用于存储目录到文件节点映射的关系映射文件|DDL操作|
|LWLock|RelationMappingLock|等待更新用于存储目录到文件节点映射的关系映射文件|DDL操作|
|LWLock|RelCacheInit|等待读写 relation cache初始化文件（pg_internal.init）|磁盘IO性能，数据库中表的数量过多|
|LWLock|RelCacheInitLock|等待读写 relation cache初始化文件（pg_internal.init）|磁盘IO性能，数据库中表的数量过多|
|LWLock|RelfilenodeReuseLock|避免错误地取消已重用的列属性文件的链接||
|LWLock|replication_origin|等待读取或者修改复制进度|数据库复制|
|LWLock|replication_slot_io|等待复制槽上的IO|数据库复制、磁盘IO性能|
|LWLock|ReplicationOrigin|等待设置、删除或使用复制源|流复制|
|LWLock|ReplicationOriginLock|等待设置、删除或使用复制源|流复制|
|LWLock|ReplicationSlotAllocation|等待分配或者始放一个复制槽|流复制，复制槽|
|LWLock|ReplicationSlotAllocationLock|等待分配或者始放一个复制槽|流复制，复制槽|
|LWLock|ReplicationSlotControl|等待读取或者修改复制槽状态|流复制，复制槽|
|LWLock|ReplicationSlotControlLock|等待读取或者修改复制槽状态|流复制，复制槽|
|LWLock|ReplicationSlotIO|等待复制SLOT上的IO|流复制，复制槽|
|LWLock|ReplicationSlotLock|并发访问复制槽|流复制，复制槽|
|LWLock|ResourcePoolHashLock|等待资源池HASH数据结构，一般是在分配池中连接||
|LWLock|RestartPointQueueLock|备机恢复性能存在问题||
|LWLock|RoleIdLock|||
|LWLock|RoleIdPartLock|||
|LWLock|RollbackReqHashLock|||
|LWLock|RowPageReplicationLock|||
|LWLock|RPNumberLock|||
|LWLock|SearchServerLibLock|||
|LWLock|SegmentHeadPartitionLock|||
|LWLock|SerialBuffer|等待一个用于存储可串行化事务冲突信息的SLRU缓冲区上的IO||
|LWLock|SerializableFinishedList|等待访问serializable 事务完成清单|事务隔离级别，并发事务|
|LWLock|SerializableFinishedListLock|等待访问serializable 事务完成清单|事务隔离级别，并发事务|
|LWLock|SerializablePredicateLockList|等待在一个被serializable事务锁锁定的清单上做操作|事务隔离级别，并发事务|
|LWLock|SerializablePredicateLockListLock|等待在一个被serializable事务锁锁定的清单上做操作|事务隔离级别，并发事务|
|LWLock|SerializableXactHashLock|等待检索或者存储serializable事务相关的信息|事务隔离级别，并发事务|
|LWLock|SerialSLRU|等待一个用于存储可串行化事务冲突信息的SLRU缓冲区||
|LWLock|SessionHistLock|||
|LWLock|SessionRealTLock|||
|LWLock|SharedTidBitmap|并行BITMAP INDEX SCAN时等待共享TID的访问闩锁||
|LWLock|SharedTupleStore|并行查询时等待访问数据块||
|LWLock|ShmemIndex|等待在共享内存中查找或者分配空间|共享内存操作，并发|
|LWLock|ShmemIndexLock|等待在共享内存中查找或者分配空间|共享内存操作，并发|
|LWLock|SInvalRead|等待从共享失效队列中检索或删除消息|并发SQL|
|LWLock|SInvalReadLock|等待从共享失效队列中检索或删除消息|并发SQL|
|LWLock|SInvalWrite|等待在共享失效队列中添加消息|并发SQL|
|LWLock|SInvalWriteLock|等待在共享失效队列中添加消息|并发SQL|
|LWLock|StartBlockMappingLock|||
|LWLock|StreamingEngineConnLock|||
|LWLock|StreamingEngineExecLock|||
|LWLock|subtrans|等待 subtransaction buffer IO操作完成|事务并发，磁盘IO性能|
|LWLock|SubtransBuffer|等待 subtransaction buffer IO操作完成|事务并发，磁盘IO性能|
|LWLock|SubtransControlLock|等待读取或者修改子事务信息|并发事务，子事务，SAVEPOINT|
|LWLock|SubtransSLRU|等待 subtransaction buffer并发访问|事务并发，磁盘IO性能|
|LWLock|SyncPaxosLock|||
|LWLock|SyncRep|等待读取或更新有关同步复制的信息|流复制，同步复制|
|LWLock|SyncRepLock|等待读取或更新有关同步复制的信息|流复制，同步复制|
|LWLock|SyncScan|等待获取表上扫描的开始位置以便于进行同步扫描|表或索引扫描操作|
|LWLock|SyncScanLock|等待获取表上扫描的开始位置以便于进行同步扫描|表或索引扫描操作|
|LWLock|TablespaceCreate|等待创建或者删除表空间|表空间操作，磁盘IO性能，文件系统|
|LWLock|TablespaceCreateLock|等待创建或者删除表空间|表空间操作，磁盘IO性能，文件系统|
|LWLock|tbm|等待 TBM 共享迭代器锁，一般发生在并行bitmap扫描中，等待TID BITMAP|并发执行、索引扫描|
|LWLock|TDEKeyCacheLock|||
|LWLock|TsTagsCacheLock|||
|LWLock|TwoPhaseState|等待读取或者修改prepared transaction的状态|分布式事务|
|LWLock|TwoPhaseStateLock|等待读取或者修改prepared transaction的状态|分布式事务|
|LWLock|TwoPhaseStatePartLock|两阶段提交相关的轻量级锁等待|两阶段提交相关的轻量级锁等待|
|LWLock|UHeapStatLock|||
|LWLock|UndoPerZoneLock|||
|LWLock|UndoSpaceLock|||
|LWLock|UndoZoneLock|||
|LWLock|UniqueSqlEvictLock|||
|LWLock|UniqueSQLMappingLock|||
|LWLock|UnlinkRelHashTblLock|||
|LWLock|UspagrpMappingLock|||
|LWLock|WaitCountHashLock|||
|LWLock|wal_insert|等待将WAL插入缓冲区|事务并发、WALBUFFER|
|LWLock|WALBufferInitWait|初始化WAL BUFFER|初始化WAL BUFFER|
|LWLock|WALBufMapping|等待替换 WAL 缓冲区中的页面|WAL BUFFER,DML，并发写入|
|LWLock|WALBufMappingLock|等待替换 WAL 缓冲区中的页面|WAL BUFFER,DML，并发写入|
|LWLock|WALFlushWait|等待WAL文件强制刷盘|等待WAL强制刷盘|
|LWLock|WALInitSegment|初始化WAL文件|初始化WAL文件|
|LWLock|WALInsert|||
|LWLock|WALInsertLock|||
|LWLock|WALWrite|等待从WAL缓冲区中写数据到磁盘|DML,并发写入，磁盘IO性能|
|LWLock|WALWriteLock|等待从WAL缓冲区中写数据到磁盘|DML,并发写入，磁盘IO性能|
|LWLock|WALWritePaxosLock|||
|LWLock|WorkloadCGroupHashLock|||
|LWLock|WorkloadIoStatHashLock|||
|LWLock|WorkloadIOUtilLock|||
|LWLock|WorkloadNodeGroupLock|||
|LWLock|WorkloadRecordLock|||
|LWLock|WorkloadSessionInfoLock|||
|LWLock|WorkloadStatHashLock|||
|LWLock|WorkloadUserInfoLock|||
|LWLock|WrapLimitsVacuum|等待修改multixact消耗和transaction id的限制|事务并发，磁盘IO性能，VACUUM、维护WORKER配置|
|LWLock|WrapLimitsVacuumLock|等待修改multixact消耗和transaction id的限制|事务并发，磁盘IO性能，VACUUM、维护WORKER配置|
|LWLock|XactBuffer|等待更改事务状态数据，事务状态管理器性能有问题或者IO有问题时会出现该等待||
|LWLock|XactSLRU|等待更改事务状态数据，事务状态管理器性能有问题时会出现该等待||
|LWLock|XactTruncation|更新事务状态时的等待，出现在清理过期XID，CKPT等||
|LWLock|XidGen|等待生成事务XID|并发事务|
|LWLock|XidGenLock|等待生成事务XID|并发事务|
|LWLock|XlogRemoveSegLock|||
|STATUS|acquire lock|申请锁|申请锁|
|STATUS|acquire lwlock|申请轻量级锁|申请轻量级锁|
|STATUS|analyze|分析操作|表分析操作|
|STATUS|cancel query|取消某连接上正在执行的SQL语句|取消某连接上正在执行的SQL语句|
|STATUS|create index|索引创建|索引创建|
|STATUS|flush data|||
|STATUS|get conn|获取到其他节点的连接|获取到其他节点的连接|
|STATUS|HashAgg - build hash|HASH JOIN|HASH JOIN|
|STATUS|HashAgg - write file|HASH JOIN|HASH JOIN|
|STATUS|HashJoin - build hash|HASH JOIN|HASH JOIN|
|STATUS|HashJoin - write file|HASH JOIN|HASH JOIN|
|STATUS|HashSetop - build hash|HASH JOIN|HASH JOIN|
|STATUS|HashSetop - write file|HASH JOIN|HASH JOIN|
|STATUS|Material|物化视图操作|物化视图操作|
|STATUS|Material - write file|物化视图操作|物化视图操作|
|STATUS|NestLoop|NESTED LOOP表连接|NESTED LOOP表连接|
|STATUS|pooler create conn|等待pooler建立连接，当前正在与nodename                    <br>指定节点建立连接，且仍有N个连接等待建                    <br>立|等待pooler建立连接|
|STATUS|reset cmd|||
|STATUS|set cmd|当前节点上执行SET命令|在连接上执行SET/RESET/TRANSACTION                    <br>BLOCK LEVEL PARA SET/SESSION LEVEL                    <br>PARA SET，当前正在nodename指定节点上执                    <br>行。|
|STATUS|Sort|排序操作|排序操作|
|STATUS|Sort - write file|物理排序操作中的文件写入|物理排序操作中的文件写入|
|STATUS|stop query|停止某连接上正在执行的查询|停止某连接上正在执行的查询|
|STATUS|stream get conn|||
|STATUS|synchronize quit|||
|STATUS|vacuum|VACUUM操作|VACUUM操作|
|STATUS|vacuum full|全量VACUUM操作|全量VACUUM|
|STATUS|wait active statement|||
|STATUS|wait cmd|等待完成读取网络通信包|等待完成读取网络通信包|
|STATUS|wait data sync|||
|STATUS|wait data sync queue|||
|STATUS|wait io|等待IO|等待IO|
|STATUS|wait memory|||
|STATUS|wait node|||
|STATUS|wait pooler abort conn|等待pooler完成终止连接|等待pooler完成终止连接|
|STATUS|wait pooler clean conn|等待pooler完成清理连接|等待pooler完成清理连接|
|STATUS|wait pooler get conn|等待pooler完成获取连接|等待pooler完成获取连接|
|STATUS|wait producer ready|||
|STATUS|wait reserve td|ustore itl等待|ustore itl等待|
|STATUS|wait stream group destroy|||
|STATUS|wait sync consumer next step|||
|STATUS|wait sync producer next step|||
|STATUS|wait transaction sync|||
|STATUS|wait wal sync|||
|Timeout|BaseBackupThrottle|在基础备份时等待限流|备份|
|Timeout|PgSleep|进程处于 pg_sleep等待||
|Timeout|RecoveryApplyDelay|在恢复时因为WAL延迟到达产生的等待|实例恢复|
