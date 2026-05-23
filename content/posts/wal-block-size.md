---
title: "wal_block_size"
date: 2023-08-28
description: "查询：'wal_block_size'"
categories: ["PostgreSQL 笔记"]
tags: ["WAL", "内存管理", "参数配置", "备份恢复"]
series: []
---

查询："wal_block_size"

回答：

"wal_block_size" 是一个与数据库系统中的 WAL（Write-Ahead Logging）机制相关的参数。WAL是一种用于确保数据持久性的技术，常用于数据库管理系统中。在 PostgreSQL 这样的数据库系统中，WAL 被用于记录数据的变更，以便在发生故障时能够恢复数据。

"wаl_block_size" 参数用于指定 WAL 写入的块大小。每次进行 WAL 写入时，会以块为单位进行操作。更大的块大小可以在某些情况下提高性能，但也会增加内存和磁盘的使用。通常情况下，块大小设置为合理的默认值就可以满足大多数工作负载。

在 PostgreSQL 中，可以通过修改配置文件中的参数来调整 "wаl_block_size"。然后，需要重新启动数据库实例才能使设置生效。

请注意，不同的数据库管理系统可能具有类似但不完全相同的参数和配置方式，具体信息可能会因所使用的数据库系统而异。

# wal_segment_size

查询："wal_segment_size"

回答：

"wal_segment_size" 是与 PostgreSQL 数据库系统中的 WAL（Write-Ahead Logging）机制相关的一个参数。WAL 是一种用于保证数据库事务持久性和恢复能力的技术，它将数据库中的修改操作记录到一个称为 WAL 日志的特殊文件中，从而在数据库发生崩溃或故障时可以通过重放 WAL 日志来恢复未完成的事务和数据更改。

"wal_segment_size" 参数定义了 WAL 日志文件的大小，以字节为单位。每个 WAL 日志文件都被分割成一个个连续的段，每个段的大小由该参数决定。较大的 WAL 日志段大小可以降低写入日志的频率，从而在某种程度上提高性能，但可能会导致崩溃恢复时需要重放更多的日志数据，因此需要更长的恢复时间。

在配置 PostgreSQL 数据库时，可以根据系统的硬件性能和需求来调整 "wal_segment_size" 参数的值。需要注意的是，一旦数据库开始使用某个特定大小的 WAL 日志段，就不太容易更改此参数，因为它涉及到数据库的持久性和恢复机制。

总之，“wal_segment_size” 是一个影响 PostgreSQL 数据库性能和恢复特性的重要参数，需要根据具体情况进行权衡和配置。


## 如何修改该参数:
1. initdb 
```bash
[pgsql@mysql01 ~]$ initdb --help| grep size
      --wal-segsize=SIZE    size of WAL segments, in megabytes
[pgsql@mysql01 ~]$ 

```

2. pg_resetwal
```bash
[pgsql@mysql01 ~]$ pg_resetwal --help 
pg_resetwal resets the PostgreSQL write-ahead log.

Usage:
  pg_resetwal [OPTION]... DATADIR

Options:
  -c, --commit-timestamp-ids=XID,XID
                                   set oldest and newest transactions bearing
                                   commit timestamp (zero means no change)
 [-D, --pgdata=]DATADIR            data directory
  -e, --epoch=XIDEPOCH             set next transaction ID epoch
  -f, --force                      force update to be done
  -l, --next-wal-file=WALFILE      set minimum starting location for new WAL
  -m, --multixact-ids=MXID,MXID    set next and oldest multitransaction ID
  -n, --dry-run                    no update, just show what would be done
  -o, --next-oid=OID               set next OID
  -O, --multixact-offset=OFFSET    set next multitransaction offset
  -u, --oldest-transaction-id=XID  set oldest transaction ID
  -V, --version                    output version information, then exit
  -x, --next-transaction-id=XID    set next transaction ID
      --wal-segsize=SIZE           size of WAL segments, in megabytes
  -?, --help                       show this help, then exit

Report bugs to <pgsql-bugs@lists.postgresql.org>.
PostgreSQL home page: <https://www.postgresql.org/>


pg_resetwal --wal-segsize=64 -D /database/pg11/pg_root
```