---
title: "PostgreSQL 15（取消了stats collector进程）对统计信息收集的改进（译）"
date: 2024-12-08
description: "tats collector进程是PostgreSQL数据库的统计信息收集器，用来收集数据库运行期间的统计信息，如表的增删改次数，数据块的个数，索引的变化等等。收集统计信息主要是为了让优化器做出正确的判断，选择最佳的执行计划。"
categories: ["PostgreSQL 运维"]
tags: ["PostgreSQL", "VACUUM", "WAL", "内存管理", "参数配置", "安装部署", "执行计划", "流复制", "监控", "索引", "统计信息", "逻辑复制"]
series: []
---

[PostgreSQL 15（取消了stats collector进程）对统计信息收集的改进（译） - MSSQL123 - 博客园 (cnblogs.com)](https://www.cnblogs.com/wy123/p/18515635)

tats collector进程是PostgreSQL数据库的统计信息收集器，用来收集数据库运行期间的统计信息，如表的增删改次数，数据块的个数，索引的变化等等。收集统计信息主要是为了让优化器做出正确的判断，选择最佳的执行计划。  
PostgreSQL 15之前的版本中，有一个stats collector后台进程，PostgreSQL 15开始取消了这个进程，那么为什么要取消这个进程，这个进程原本的工作由又如何完成？  
原文地址：[https://www.postgresql.fastware.com/blog/how-postgresql-improved-statistics-collector-in-the-latest-version](https://www.postgresql.fastware.com/blog/how-postgresql-improved-statistics-collector-in-the-latest-version "https://www.postgresql.fastware.com/blog/how-postgresql-improved-statistics-collector-in-the-latest-version")

以下为译文

流行的开源数据库管理系统 PostgreSQL 的最新版本——PostgreSQL 15，对其统计信息收集器（statistics collector）进行了重大改进。这些新变化旨在提高其准确性和效率，从而使数据库管理员更容易监控和优化他们的 PostgreSQL 数据库。

统计信息收集器是一个关键模块，负责收集和报告有关数据库性能和使用的各种统计数据。在本文中，我将概述PostgreSQL 15中所做的更改，以及这些更改如何能够帮助数据库管理员。

在PostgreSQL 14及之前的版本中，统计信息收集器通过UDP套接字接收统计信息更新，并定期将这些接收到的统计信息写入临时文件。这些文件可能会非常大，并且经常在极短的时间内被频繁写入。当添加更多有用的统计信息时，这可能会成为瓶颈。

## What is the Stats Collector doing in PostgreSQL?

统计信息收集器是一个后台进程，负责收集本地服务器上活动的信息，如表和索引的访问情况以及vacuum和analyze活动，它还跟踪每个表中的总行数。此外，它还可以统计用户定义函数的调用次数以及每个函数所花费的总时间。统计信息收集器收集的信息可以通过各种pg_stat_和pg_statio_视图来获取。

以下是与统计信息收集器相关的参数：

- track_activities
- track_activity_query_size
- track_counts
- track_functions
- track_io_timing
- track_wal_io_timing
- stats_temp_directory
- stats_fetch_consistency (from PostgreSQL 15 onwards)

如果我们比较PostgreSQL 14和15的默认后台进程列表，可以很容易地发现统计信息收集器后台进程并未出现在PostgreSQL 15的列表中。  

On PostgreSQL-15  

![复制代码](https://assets.cnblogs.com/images/copycode.gif)

[root@localhost opt]# ps -ef | grep postgres
postgres 4942       0 08:43 ?      00:00:00 /usr/pgsg1-15/bin/postgres -D /opt/PGSQL15
postgres 4943  4942 0 08:43 ?      00:00:00 postgres: logger
postgres 4944  4942 0 08:43 ?      00:00:00 postgres: checkpointer
postgros 4945  4942 0 08:43 ?      00:00:00 postgres: background writer
postgres 4947  4942 0 08:43 ?      00:00:00 postgres: walwriter
postgros 4948  4942 0 08:43 ?      00:00:00 postgres: autovacuum launcher
postgres 4949  4942 0 08:43 ?      00:00:00 postgres: logical replication launcher
root    14523 13927 0 21:59 pts/2  00:00:00 grep --color=auto postgres
[root@localhost opt]#

![复制代码](https://assets.cnblogs.com/images/copycode.gif)

On PostgreSQL-14  

![复制代码](https://assets.cnblogs.com/images/copycode.gif)

[root@localhost opt]# ps -ef | grep postgres
postgres 14641 1 0 22:01 ?      00:00:00 /usr/pgsg1-14/bin/postgres -D /opt/PGSQL14
postgres 14642 14641 0 22:01 ?      00:00:00 postgres: logger
postgres 14644 14641 0 22:01 ?      00:00:00 postgres: checkpointer
postgros 14645 14641 0 22:01 ?      00:00:00 postgres: background writer
postgres 14646 14641 0 22:01 ?      00:00:00 postgres: walwriter
postgros 14647 14641 0 22:01 ?      00:00:00 postgres: autovacuum launcher
postgres 14648 14641 0 22:01 ?      00:00:00 postgres: stats collector
postgres 14649 14641 0 22:01 ?      00:00:00 postgres: logical replication launcher
root     14678 13927 0 22:01 pts/2  00:00:00 grep --color=auto postgres
[root@localhost opt]#

![复制代码](https://assets.cnblogs.com/images/copycode.gif)

## Challenges for statistics collection up to PostgreSQL 14

众所周知，PostgreSQL采用简单的“每用户一进程”的客户端/服务器模型。因此，PostgreSQL中会话的每个后端都是一个独立的进程。想象一下，如果每个后端会话都要收集统计信息并将其传输出去，这可不是一项简单的任务，因为每个后端都需要向单个统计信息收集器进程发送它们所执行活动的信息（每个后台进程将他们的活动信息发送给单独的“stats collector”进程。通过UDP包进行通信）。正如我上面提到的，PostgreSQL会使用UDP套接字来进行这种通信。

很自然地，我们可以感觉到这种方法存在很多问题。我相信你们中的很多人都遇到过类似这样的问题：

- LOG: 使用过时的统计数据而不是当前的统计数据，因为统计数据收集器没有响应
- Autovacuum 工作效率降低
- 高I/O行为

如果你设置了适当的日志级别，你可以在PostgreSQL 14日志中看到如下消息：

![复制代码](https://assets.cnblogs.com/images/copycode.gif)

2022-12-19 23:22:03.338 +08 [14641] LOG: parameter "log_min_messages" changed to "debug3"
2022-12-19 23:22:03.341 +08 [14644] DEBUG: checkpointer updated shared memory configuration values
2022-12-19 23:22:03.343 +08 [14648] DEBUG: received inquiry for database 0
2022-12-19 23:22:03.343 +08 [14648] DEBUG: writing stats file "pg_stat_tmp/global.stat"
2022-12-19 23:22:03.344 +08 [14648] DEBUG: writing stats file "pg_stat_tmp/db_0.stat"
2022-12-19 23:23:03.406 +08 [14648] DEBUG: received inquiry for database 0
2022-12-19 23:23:03.406 +08 [14648] DEBUG: writing stats file "pg_stat_tmp/global.stat"
2022-12-19 23:23:03.406 +08 [14648] DEBUG: writing stats file "pg_stat_tmp/db_0.stat"
2022-12-19 23:23:03.418 +08 [16112] DEBUG: InitPostgres
2022-12-19 23:23:03.419 +08 [16112] DEBUG: autovacuum: processing database "postgres"
2022-12-19 23:23:03.419 +08 [14648] DEBUG: received inquiry for database 14486
2022-12-19 23:23:03.419 +08 [14648] DEBUG: writing stats file "pg_stat_tmp/global.stat"
2022-12-19 23:23:03.419 +08 [14648] DEBUG: writing stats file "pg_stat_tmp/db_14486.stat"
2022-12-19 23:23:03.419 +08 [14648] DEBUG: writing stats file "pg_stat_tmp/db_0.stat"

![复制代码](https://assets.cnblogs.com/images/copycode.gif)

上述消息表明，统计信息收集器进程将统计数据写入临时文件，由于需要频繁收集信息（stats collector通过UDP接收统计更新，并通过定期将统计数据写入临时文件来共享统计数据。这些文件可以达到数十兆字节，并且每秒最多写入2次），这会导致大量的I/O操作。在高负载期间，这可能会导致出现“**LOG: using stale statistics instead of current ones because stats collector is not responding**”的消息。为了解决这个问题，强烈建议将pg_stat_tmp挂载到基于RAM的文件系统上。为此，需要有效配置stats_temp_directory参数，将其设置为基于RAM的文件系统路径。

在大多数系统上，stats_temp_directory的默认位置仅在数据目录内。

##   
Statistics collection improvement in PostgreSQL 15

让我们看看社区在PostgreSQL 15中做出了哪些更改。

如前所述，在PostgreSQL 14及之前的版本中，统计信息收集器使用文件系统来写入统计数据，但从PostgreSQL 15开始，社区转而使用动态共享内存。现在，采用这种方法后，就不再需要设置stats_temp_directory了，但为了支持像pg_stat_statements这样的扩展功能，仍然会保留一个空的pg_stat_tmp目录。

在PostgreSQL 15的新改进中，所有统计数据的更改最初都会在每个进程中以“待处理”状态本地收集。这里的“待处理”意味着统计数据已经被收集，但尚未被输入到共享统计系统中。稍后，在提交后不久或通过超时机制，它们将被刷新到共享内存中。现在就出现了如何管理这些统计数据的检索的问题。因此，社区引入了一个名为stats_fetch_consistency的新选项来解答这个问题。

当在事务中多次检索累积统计数据时，stats_fetch_consistency选项将控制行为方式。该参数有三个可能的选项：none、cache和snapshot。

- If the value is set to "none," shared memory counts are re-fetched with each access；

       译者注：每次检索统计信息时，都会返回当前可用的最新数据。这可能会导致在事务期间检索到的数据不一致，因为统计信息可能会在事务执行期间被更新。

- When set to "cache," an object's first access to its statistics is stored there until the transaction is complete, unless pg_stat_clear_snapshot() is performed. This is the default option.

       PostgreSQL会在事务开始时缓存统计信息，并在整个事务期间返回该缓存的数据。这可以确保在事务期间检索到的数据是一致的，但可能会牺牲一些实时性，因为缓存的数据可能不是最新的。

- If the option is set to "snapshot," all statistics available in the current database are cached at initial access until the transaction is complete, unless pg_stat_clear_snapshot() is performed.

       PostgreSQL会在事务开始时获取一个统计信息的快照，并在整个事务期间返回该快照的数据。这与`cache`模式类似，但快照提供了更强的一致性保证。快照是在事务开始时创建的，因此它反映了事务开始时的数据库状态。

## What happens at restart?

既然你已经阅读了以上内容，一个显而易见的问题是：“如果PostgreSQL重启，会发生什么？”

在这种情况下，PostgreSQL会将统计数据保存在磁盘上pg_stat目录中的一个名为pgstat.stat的文件中。由于检查点进程（checkpointer process）会在关闭之前控制整个统计数据的写入过程，因此在PostgreSQL的启动过程中，这些数据将再次被加载。  
译者注：如果是PostgreSQL非正常关闭，也就是checkpoint没来得及将统计信息写入磁盘，重启后统计信息将丢失，参考 https://www.percona.com/blog/postgresql-15-stats-collector-gone-whats-new/

![复制代码](https://assets.cnblogs.com/images/copycode.gif)

PostgreSQL log entries during the Stop event

2022-12-21 10:39:54.260 +08 [6967] DEBUG: postmaster received signal 2
2022-12-21 10:39:54.260 +08 [6967] LOG: received fast shutdown request
2022-12-21 10:39:54.262 +08 [6967] LOG: aborting any active transactions
2022-12-21 10:39:54.262 +08 [6974] DEBUG: logical replication launcher shutting down
2022-12-21 10:39:54.263 +08 [6973] DEBUG: autovacuum launcher shutting down
2022-12-21 10:39:54.267 +08 [6967] LOG: background worker "logical replication launcher" (PID 6974) exited with exit code 1
2022-12-21 10:39:54.267 +08 [6969] LOG: shutting down
2022-12-21 10:39:54.270 +08 [6969] LOG: checkpoint starting: shutdown immediate
2022-12-21 10:39:54.270 +08 [6969] DEBUG: performing replication slot checkpoint
2022-12-21 10:39:54.276 +08 [6969] DEBUG: checkpoint sync: number=1 file=pg_multixact/offsets/0000 time=0.715 ms
2022-12-21 10:39:54.276 +08 [6969] DEBUG: checkpoint sync: number=2 file=pg_xact/0000 time=0.582 ms
2022-12-21 10:39:54.279 +08 [6969] DEBUG: attempting to remove WAL segments older than log file 000000000000000000000002
2022-12-21 10:39:54.279 +08 [6969] DEBUG: SlruScanDirectory invoking callback on pg_subtrans/0000
2022-12-21 10:39:54.279 +08 [6969] LOG: checkpoint complete: wrote 3 buffers (0.0%); 0 WAL file(s) added, 0 removed, 0 recycled; write
=0.001 s, sync=0.002 s, total=0.011 s; sync files=2, longest=0.001 s, average=0.001 s; distance=0 kB, estimate=0 kB
2022-12-21 10:39:54.279 +08 [6969] DEBUG: writing stats file "pg_stat/pgstat.stat"
2022-12-21 10:39:54.281 +08 [6967] DEBUG: cleaning up orphaned dynamic shared memory with ID 3552075372
2022-12-21 10:39:54.281 +08 [6967] DEBUG: cleaning up dynamic shared memory control segment with ID 2802447064
2022-12-21 10:39:54.283 +08 [6967] LOG: database system is shut down
2022-12-21 10:39:54.288 +08 [6968] DEBUG: logger shutting down

![复制代码](https://assets.cnblogs.com/images/copycode.gif)

PostgreSQL log entries during the Start event  

![复制代码](https://assets.cnblogs.com/images/copycode.gif)

2022-12-21 10:39:54.409 +08 (6994) LOG: starting PostgreSQL 15.1 on x86_64-pc-linux-gnu, compiled by gcc (GCC) 4.8.5 20150623 (Red Hat
4.8.5 4.8.5-44), 64-bit
2022-12-21 10:39:54.410 +08 (6994) LOG: listening on IPv6 address "::1", port 5432
2022-12-21 10:39:54.410 +08 (6994) LOG: listening on IPv4 address "127.0.0.1", port 5432
2022-12-21 10:39:54.412 +08 [6994) LOG: listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
2022-12-21 10:39:54.415 +08 [6994] LOG: listening on Unix socket "/tmp/.s.PGSQL.5432"
2022-12-21 10:39:54.418 +08 (6996) DEBUG: checkpointer updated shared memory configuration values
2022-12-21 10:39:54.420 +08 (6998) LOG: database system was shut down at 2022-12-21 10:39:54 +08
2022-12-21 10:39:54.420 +08 (6998) DEBUG: checkpoint record is at 0/30E1708
2022-12-21 10:39:54.420 +08 (6998] DEBUG: redo record is at 0/30E1708; shutdown true
2022-12-21 10:39:54.420 +08 [6998] DEBUG: next transaction ID: 4667; next DID: 16414
2022-12-21 10:39:54.420 +08 (6998) DEBUG: next MultiXactId: 1; next MultiXactOffset: 0
2022-12-21 10:39:54.420 +08 (6998) DEBUG: oldest unfrozen transaction ID: 717, in database 1
2022-12-21 10:39:54.420 +08 (6998) DEBUG: oldest MultiXactId: 1, in database 1
2022-12-21 10:39:54.420 +08 (6998] DEBUG: commit timestamp Xid oldest/newest: 0/0
2022-12-21 10:39:54.420 +08 [6998] DEBUG: transaction ID wrap limit is 2147484364, limited by database with OID 1
2022-12-21 10:39:54.420 +08 [6998] DEBUG: MultiXactld wrap limit is 2147483648, limited by database with OID 1
2022-12-21 10:39:54.420 +08 (6998] DEBUG: starting up replication slots
2022-12-21 10:39:54.420 +08 (6998) DEBUG: starting up replication origin progress state
2022-12-21 10:39:54.421 +08 (6998) DEBUG: reading stats file "pg_stat/pgstat.stat"
2022-12-21 10:39:54.421 +08 (6998] DEBUG: removing permanent stats file "pg_stat/pgstat.stat"
2022-12-21 10:39:54.422 +08 [6998] DEBUG: MultiXactId Wrap limit is 2147483648, limited by database with OID 1
2022-12-21 10:39:54.422 +08 (6998] DEBUG: MultiXact member stop limit is now 4294914944 based on MultiXact 1
2022-12-21 10:39:54.425 +08 (6994) DEBUG: starting background worker process "logical replication launcher"
2022-12-21 10:39:54.425 +08 (6994) LOG: database system is ready to accept connections
2022-12-21 10:39:54.426 +08 (7001] DEBUG: logical replication launcher started
2022-12-21 10:39:54.428 +08 [7000] DEBUG: autovacuum launcher started

![复制代码](https://assets.cnblogs.com/images/copycode.gif)

## Before you go

最终，这些新功能通过降低收集统计信息的开销来提高性能。这些增强功能有助于确保随着数据库规模和工作负载的增长，PostgreSQL将继续保持良好的可扩展性和性能。
