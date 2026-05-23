---
title: "作用"
date: 2026-03-06
description: "@[TOC]"
categories: ["锁与并发"]
tags: ["VACUUM", "内存管理", "参数配置", "安装部署", "索引", "统计信息", "锁"]
series: []
---

@[TOC]
# 作用
云数据库 PostgreSQL 版支持通过插件 pg_repack 提供在线 Vacuum Full 的能力，有效解决因为频繁 Update、Delete 等操作引起的表和索引等对象所占据的物理磁盘空间膨胀的问题。相较于 Cluster 和 Vacuum Full，pg_repack 在执行过程中，不会阻塞对目标表的 DML 操作。

# 约束限制
* 默认只有超级管理员用户才能使用pg_repack。//可以通过参数 -k 或 --no-superuser-check 允许非超级用户执行
* 目标表必须存在主键，或在非空列上存在唯一索引。//注意1: 绝大部分表是有主键或者唯一键的, 可以排查下不满足此条件的表
* 至少需要两倍于目标表（及索引）的磁盘空间。 // 注意2: 清理之前需要检查空闲空间
* 无法在temp表和存在gist索引的表上操作。 //无影响
* 在pg_repack运行期间，目标表上不能执行除vacuum和analyze之外的任何DDL指令。
* 需要在本地部署客户端才能使用pg_repack，详见官方文档： [https://reorg.github.io/pg_repack](https://reorg.github.io/pg_repack)
* 其他参考:[https://support.huaweicloud.com/intl/zh-cn/usermanual-rds-pg/rds_09_0057.html](https://support.huaweicloud.com/intl/zh-cn/usermanual-rds-pg/rds_09_0057.html)

# 原理
## 对全表进行 repack 的实现原理如下：
* 创建日志表记录对原表的变更。
* 在原表创建触发器，将原表的 INSERT、UPDATE 和 DELETE 操作记录到日志表中。
* 创建新表，与原表的行列相同。
* 对新表执行 INSERT INTO SELECT，将原表数据导入新表。
* 在新表中创建和原表一一对应的索引。
* 将日志表里的变更应用到新表。
* 将新表及其索引和 repack 的原表及其索引进行物理文件交换。
* 删除新表和新索引。
* 对目标表执行 ANALYZE，更新统计信息。
> 在上述步骤中的 1、2、6、7和 8，pg_repack 会短暂持有 ACCESS EXCLUSIVE 锁；在其他步骤中，pg_repack 只需要持有原表的 ACCESS SHARE 锁，不影响原表的 INSERT、UPDATE 和DELETE。

## 对索引进行 repack 的实现原理如下：
以 CONCURRENTLY 方式创建新索引。
将新索引和 repack 的目标索引进行物理文件交换。
删除旧索引文件。

# 与其他方案功能比较
![image-20260306201937842](https://gitee.com/yueludanfeng/images_hub/raw/master/PicGO-updata-img/20260306201938143.png)
# 编译安装
```bash
wget https://github.com/reorg/pg_repack/archive/refs/tags/ver_1.4.6.tar.gz
tar zxvf ver_1.4.6.tar.gz
cd pg_repack-ver_1.4.6
make && make install
```

# 安装删除插件
```bash
-- 安装插件
CREATE EXTENSION pg_repack;

-- 删除插件
DROP EXTENSION pg_repack;
```



# pg_repack 参数说明
```bash
pg_repack [options]
pg_repack re-organizes a PostgreSQL database.

Usage:
  pg_repack [OPTION]... [DBNAME]
Options:
  -a, --all                 repack all databases
  -t, --table=TABLE         repack specific table only
  -I, --parent-table=TABLE  repack specific parent table and its inheritors
  -c, --schema=SCHEMA       repack tables in specific schema only
  -s, --tablespace=TBLSPC   move repacked tables to a new tablespace
  -S, --moveidx             move repacked indexes to TBLSPC too
  -o, --order-by=COLUMNS    order by columns instead of cluster keys
  -n, --no-order            do vacuum full instead of cluster
  -N, --dry-run             print what would have been repacked
  -j, --jobs=NUM            Use this many parallel jobs for each table
  -i, --index=INDEX         move only the specified index
  -x, --only-indexes        move only indexes of the specified table
  -T, --wait-timeout=SECS   timeout to cancel other backends on conflict
  -D, --no-kill-backend     dont kill other backends when timed out
  -Z, --no-analyze          dont analyze at end
  -k, --no-superuser-check  skip superuser checks in client
  -C, --exclude-extension   dont repack tables which belong to specific extension

Connection options:
  -d, --dbname=DBNAME       database to connect
  -h, --host=HOSTNAME       database server host or socket directory
  -p, --port=PORT           database server port
  -U, --username=USERNAME   user name to connect as
  -w, --no-password         never prompt for password
  -W, --password            force password prompt

Generic options:
  -e, --echo                echo queries
  -E, --elevel=LEVEL        set output message level
  --help                    show this help, then exit
  --version                 output version information, then exit

Read the website for details: <https://reorg.github.io/pg_repack/>.
Report bugs to <https://github.com/reorg/pg_repack/issues>.
```

# 最佳实践
```bash
PGOPTIONS="-c maintenance_work_mem=256MB" \
pg_repack -U postgres -d postgres -h 127.0.0.1 -p 5432 --table public.test -k -D -n -T5 -j2

其中 maintenance_work_mem 与 -j 可以酌情调整
```

* 对于 windows 平台, 没有 pg_repack, 只能使用 vacuum 

```bash
vacuum (verbose, skip_locked, index_cleanup auto) test;

verbose: 打印详情
skip_locked: 如果有锁冲突直接跳过,老版本没有该功能
index_cleanup: 索引清理 

lxm=# \h vacuum
Command:     VACUUM
Description: garbage-collect and optionally analyze a database
Syntax:
VACUUM [ ( option [, ...] ) ] [ table_and_columns [, ...] ]
VACUUM [ FULL ] [ FREEZE ] [ VERBOSE ] [ ANALYZE ] [ table_and_columns [, ...] ]

where option can be one of:

    FULL [ boolean ]
    FREEZE [ boolean ]
    VERBOSE [ boolean ]
    ANALYZE [ boolean ]
    DISABLE_PAGE_SKIPPING [ boolean ]
    SKIP_LOCKED [ boolean ]
    INDEX_CLEANUP { AUTO | ON | OFF }
    PROCESS_TOAST [ boolean ]
    TRUNCATE [ boolean ]
    PARALLEL integer

and table_and_columns is:

    table_name [ ( column_name [, ...] ) ]

URL: https://www.postgresql.org/docs/14/sql-vacuum.html
```



# 常见问题

Q：报错“ERROR: pg_repack failed with error: You must be a superuser to use pg_repack”。
A：请使用-k或--no-superuser-check，避免没有权限。

# 示例
```bash
-> % PGOPTIONS="-c maintenance_work_mem=1GB" psql
Pager usage is off.
psql (14.5)
Type "help" for help.

postgres=# show maintenance_work_mem ;
 maintenance_work_mem
----------------------
 1GB
(1 row)

postgres=# \q
postgres@postgres [19:56:13] [~/codes]
```

# 大表优化策略

| 表大小    | 推荐策略                                                           |
| ------ | -------------------------------------------------------------- |
| ≤10GB  | 使用 Seq Scan (`-n`)，无需强制 Index Scan                             |
| 100GB+ | 优先 Index Scan，配合 `maintenance_work_mem` 和 `enable_seqscan=off` |
| 200GB+ | Index Scan + 内存调整 + 高阶并行优化（大表加速技巧）                             |



# 参考

[RDS PostgreSQL表格儲存體空間縮容 - ApsaraDB RDS - 阿里雲 (alibabacloud.com)](https://www.alibabacloud.com/help/tc/rds/apsaradb-rds-for-postgresql/reduce-the-storage-space-of-apsaradb-rds-for-postgresql-tables)

[清理空间（pg_repack）--云数据库 PostgreSQL 版-火山引擎 (volcengine.com)](https://www.volcengine.com/docs/6438/907280?lang=zh)

[使用pg_repack插件_插件管理_用户指南_云数据库 RDS_云数据库 RDS for PostgreSQL-华为云 (huaweicloud.com)](https://support.huaweicloud.com/intl/zh-cn/usermanual-rds-pg/rds_09_0057.html)

[使用pg_repack在线清理表空间解决表膨胀-云数据库 RDS-阿里云 (aliyun.com)](https://help.aliyun.com/zh/rds/apsaradb-rds-for-postgresql/use-the-pg-repack-extension-to-clear-tablespaces)

