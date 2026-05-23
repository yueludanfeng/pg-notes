---
title: "简介"
date: 2024-08-30
description: "pg_probackup 是用于管理 PostgreSQL 数据库集群的备份和恢复的实用程序。它旨在执行 PostgreSQL 实例的定期备份，使您能够在发生故障时还原服务器。pg_probackup支持PostgreSQL 9.5或更高版"
categories: ["PostgreSQL 笔记"]
tags: ["WAL", "参数配置", "备份恢复", "安装部署", "流复制"]
series: []
---

pg_probackup 是用于管理 PostgreSQL 数据库集群的备份和恢复的实用程序。它旨在执行 PostgreSQL 实例的定期备份，使您能够在发生故障时还原服务器。pg_probackup支持PostgreSQL 9.5或更高版本。

# 特点
与其他备份解决方案相比，pg_probackup 具有以下优势，可帮助您实施不同的备份策略并处理大量数据：

增量备份：通过三种不同的增量模式，您可以根据数据流规划备份策略。与进行完整备份相比，增量备份允许您节省磁盘空间并加快备份速度。通过应用增量备份来还原群集也比重播 WAL 文件更快。

增量恢复：通过重用 PGDATA 中可用的有效未更改页，加快从备份恢复的速度。

验证：自动数据一致性检查和按需备份验证，无需实际数据恢复。

验证：使用 checkdb 命令按需验证 PostgreSQL 实例。

保留：根据保留策略管理 WAL 存档和备份。可以根据恢复时间或要保留的备份数配置保留策略，并为特定备份指定生存时间 （TTL）。过期的备份可以合并或删除。

并行化：在多个并行线程上运行备份、恢复、合并、删除、验证和检查数据库进程。

压缩：以压缩状态存储备份数据以节省磁盘空间。

重复数据删除：如果非数据文件（如 _vm 或 _fsm）在复制到此增量链中的先前备份之一后未发生更改，则通过从增量备份中排除这些文件来节省磁盘空间。

远程操作：备份位于远程系统上的 PostgreSQL 实例或远程恢复备份。

从备用服务器备份：通过从备用服务器进行备份来避免主服务器上的额外负载。

外部目录：备份位于 PostgreSQL 数据目录 （PGDATA 之外的文件和目录，例如脚本、配置文件、日志或 SQL 转储文件。

备份目录：获取纯文本或JSON格式的备份列表和相应的元信息。

存档目录：获取所有 WAL 时间线的列表以及纯文本或 JSON 格式的相应元信息。

部分还原：仅还原指定的数据库。

追赶：克隆一个 PostgreSQL 实例，用于一个落后的备用服务器，以“赶上”主服务器。

若要管理备份数据，pg_probackup会创建备份目录。这是一个目录，用于存储所有备份文件和其他元信息，以及时间点恢复所需的WAL存档。您可以将不同实例的备份存储在单个备份目录的单独子目录中。

使用 pg_probackup，您可以进行完整或增量备份:

FULL 备份包含还原数据库集群所需的所有数据文件。

增量备份在页面级别运行，仅存储自上次备份以来已更改的数据。与进行完整备份相比，它使您可以节省磁盘空间并加快备份过程。通过应用增量备份来还原群集也比重播 WAL 文件更快。pg_probackup支持以下增量备份模式：

增量备份。在此模式下，pg_probackup读取数据目录中的所有数据文件，并仅复制自上次备份以来已更改的那些页。此模式可以施加等于完整备份的只读 I/O 压力。

页面备份。在此模式下，pg_probackup从进行上一次完整或增量备份的那一刻起扫描存档中的所有 WAL 文件。新创建的备份仅包含 WAL 记录中提到的页面。这要求自上次备份以来的所有 WAL 文件都存在于 WAL 存档中。如果这些文件的大小与数据库集群文件的总大小相当，则 speedup 较小，但备份仍然占用更少的空间。您必须按照设置连续 WAL 存档以进行 PAGE 备份中所述配置 WAL 存档。

PTRACK备份。在这种模式下，PostgreSQL会动态跟踪页面更改。连续存档对于它的运行不是必需的。每次更新关系页时，都会在特殊的 PTRACK 位图中标记此页。跟踪意味着数据库服务器操作上的一些小开销，但会显著加快增量备份的速度。

pg_probackup只能进行物理联机备份，联机备份需要 WAL 才能进行一致的恢复。因此，无论选择哪种备份模式（完整、页面或增量），使用 pg_probackup 进行的任何备份都必须使用以下 WAL 交付模式之一:

* 存档。此类备份依赖于连续存档来确保一致的恢复。这是默认的 WAL 交付模式。

* 流。此类备份包括将群集还原到执行备份时的一致状态所需的所有文件。无论是否设置了连续存档，一致恢复所需的 WAL 段都会在备份期间通过复制协议进行流式传输，并包含在备份文件中。这就是为什么这种备份被称为自主备份或独立备份的原因。.

# 下载与安装
```bash
cd <path_to_PostgreSQL_source_tree>/contrib 
git clone https://github.com/postgrespro/pg_probackup 

切换到 pgsql 用户
cd pg_probackup 
export PG_CONFIG=/usr/local/pgsql/bin/pg_config
make
# make install 
然后将 /usr/local/pgsql/bin/pg_probackup 文件拷贝到同版本 PG 的 bin 目录下
```

# 局限性
1. 只支持 9.5 及其以上版本
2. remote 模式不支持 windows 环境
3. 在Unix系统上，对于PostgreSQL 10或更低版本，备份只能由启动PostgreSQL服务器的同一操作系统用户进行。例如，如果 PostgreSQL 服务器由用户 postgres 启动，则backup命令也必须由用户 postgres 运行。postgres要使用 SSH 在远程模式下进行备份时满足此要求，必须将 --remote-user 选项设置为 postgres
4. 对于 PostgreSQL 9.5，函数 pg_create_restore_point(text)） 和 pg_switch_xlog() 只有在备份角色是超级用户时才能执行，因此非超级用户角色备份具有少量 WAL 流量的集群可能比超级用户角色备份同一集群花费更长的时间
5. 从中进行备份的 PostgreSQL 服务器和还原的服务器必须与block_size和wal_block_size参数兼容，并且具有相同的主版本号。根据集群配置，PostgreSQL 本身可能会应用其他限制，例如 CPU 架构或 libc/icu 版本


# 安装和配置
> 安装 pg_probackup 后, 请完成以下设置:
* 初始化备份目录
* 将新的备份实例添加到备份目录
* 配置数据库集群以启用 pg_probackup 备份
*（可选）配置 SSH 以在远程模式下运行 pg_probackup 操作

# 初始化备份目录
```bash
pg_probackup init -B backup_dir
实例: 
```bash
pg_probackup init -B /usr/local/pgsql/pro_backup
```
其中backup_dir是备份目录的路径。如果backup_dir已存在，则它必须为空。否则，pg_probackup返回错误。
启动pg_probackup的用户必须具有对backup_dir目录的完全访问权限
```

## 添加新的备份实例
pg_probackup可以将多个数据库集群的备份存储在单个备份目录中。要设置所需的子目录，必须将备份实例添加到要备份的每个数据库集群的备份目录中。
要添加新的备份实例，请运行以下命令：
```bash
pg_probackup add-instance -B backup_dir -D data_dir --instance instance_name [remote_options]
```
* data_dir 是要备份的群集的数据目录, 要设置和使用pg_probackup, 需要对此目录具有写入权限
* instance_name是将存储此群集的 WAL 和备份文件的子目录的名称
* remote_options 是可选参数, 仅当data_dir位于远程系统上时才需要指定

pg_probackup 在备份目录的 backups// 和 wal/ 目录下创建instance_name子目录。backups/instance_name 目录包含控制此备份实例pg_probackup设置的 pg_probackup.conf 配置文件。如果使用 remote_options 运行此命令，则指定的参数将添加到 pg_probackup.conf.

* 实例: 
```bash
pg_probackup add-instance -B backup_dir -D data_dir --instance instance_name [remote_options]
```
本地添加备份instance 示例
```bash
    pg_probackup add-instance -B /usr/local/pgsql/pro_backup -D /usr/local/pgsql/data --instance local_5432
```

# 配置数据库集群
如果是非超级管理员用户, 需要使用如下配置

```bash
For PostgreSQL 10 or higher:
$ psql -p 5432 -U postgres
BEGIN;
CREATE ROLE backup WITH LOGIN REPLICATION;
GRANT USAGE ON SCHEMA pg_catalog TO backup;
GRANT EXECUTE ON FUNCTION pg_catalog.current_setting(text) TO backup;
GRANT EXECUTE ON FUNCTION pg_catalog.pg_is_in_recovery() TO backup;
GRANT EXECUTE ON FUNCTION pg_catalog.pg_start_backup(text, boolean, boolean) TO backup;
GRANT EXECUTE ON FUNCTION pg_catalog.pg_stop_backup(boolean, boolean) TO backup;
GRANT EXECUTE ON FUNCTION pg_catalog.pg_create_restore_point(text) TO backup;
GRANT EXECUTE ON FUNCTION pg_catalog.pg_switch_wal() TO backup;
GRANT EXECUTE ON FUNCTION pg_catalog.pg_last_wal_replay_lsn() TO backup;
GRANT EXECUTE ON FUNCTION pg_catalog.txid_current() TO backup;
GRANT EXECUTE ON FUNCTION pg_catalog.txid_current_snapshot() TO backup;
GRANT EXECUTE ON FUNCTION pg_catalog.txid_snapshot_xmax(txid_snapshot) TO backup;
GRANT EXECUTE ON FUNCTION pg_catalog.pg_control_checkpoint() TO backup;
COMMIT;
```

# 配置 postgresql.conf
– 确保 wal_level 参数高于 minimal
– 如果要在 primary 上配置存档，则 archive_mode 必须设置为“on”或“always”。要在standby下执行存档，请将此参数设置为“always’
– 设置archive_命令参数，如下所示：

```bash
archive_command ='install_dir/pg_probackup archive-push -B backup_dir --instance instance_name --wal-file-name=%f [remote_options]'
-- 示例
alter system set archive_mode='always';
alter system set archive_command='/usr/local/pgsql/bin/pg_probackup archive-push -B /usr/local/pgsql/pro_backup --instance local_5432 --wal-file-path=%p --wal-file-name=%f';
pg_ctl restart -m fast 
```

# 创建全量备份

```bash
pg_probackup backup -B backup_dir --instance instance_name -b backup_mode

示例:
pg_probackup backup -B /usr/local/pgsql/pro_backup --instance local_5432 -b full
```
# 打数据

```bash
pgbench -U pgsql  -r -T 10 -c 90 -j 8  -P1 -n  -h 127.0.0.1 pb_test
```

# 创建增量备份 delta

```bash
pg_probackup backup -B /usr/local/pgsql/pro_backup --instance local_5432 -b delta
```

# 打数据

```bash
pgbench -U pgsql  -r -T 10 -c 90 -j 8  -P1 -n  -h 127.0.0.1 pb_test
```

# 创建增量备份 page

```bash
pg_probackup backup -B /usr/local/pgsql/pro_backup --instance local_5432 -b page
```

#  查看备份集以及相关配置信息

```bash
-- 查看备份集
[pgsql@mysql01 backups]$ pg_probackup show -B /usr/local/pgsql/pro_backup/

BACKUP INSTANCE 'local_5432'
======================================================================================================================================
 Instance    Version  ID      Recovery Time           Mode   WAL Mode  TLI  Time   Data   WAL  Zratio  Start LSN   Stop LSN    Status 
======================================================================================================================================
 local_5432  14       RZQHCC  2023-08-21 17:07:27+08  PAGE   ARCHIVE   2/2    4s   62MB  16MB    1.00  1/7E000028  1/7F01F040  OK     
 local_5432  14       RZQH9H  2023-08-21 17:05:49+08  DELTA  ARCHIVE   2/2    9s   48MB  16MB    1.00  1/78000028  1/790000F0  OK     
 local_5432  14       RZQGFC  2023-08-21 16:47:45+08  FULL   ARCHIVE   2/0   10s  443MB  16MB    1.00  1/720000D8  1/730000F0  OK     
[pgsql@mysql01 backups]$ 

-- 查看单个实例配置信息
[pgsql@mysql01 backups]$ pg_probackup show -B /usr/local/pgsql/pro_backup/ --instance local_5432 -i RZQGFC
#Configuration
backup-mode = FULL
stream = false
compress-alg = none
compress-level = 1
from-replica = false

#Compatibility
block-size = 8192
xlog-block-size = 8192
checksum-version = 0
program-version = 2.5.12
server-version = 14

#Result backup info
timelineid = 2
start-lsn = 1/720000D8
stop-lsn = 1/730000F0
start-time = '2023-08-21 16:47:36+08'
end-time = '2023-08-21 16:47:46+08'
recovery-xid = 302617
recovery-time = '2023-08-21 16:47:45+08'
data-bytes = 464586905
wal-bytes = 16777216
uncompressed-bytes = 464148217
pgdata-bytes = 464147669
status = OK
primary_conninfo = 'user=pgsql channel_binding=disable host=/usr/local/pgsql/data port=5432 sslmode=disable sslcompression=0 sslsni=1 ssl_min_protocol_version=TLSv1.2 gssencmode=disable krbsrvname=postgres target_session_attrs=any'
content-crc = 1314083191

-- 查看归档详情
pg_probackup show -B /usr/local/pgsql/pro_backup --instance local_5432 --archive
[pgsql@mysql01 ~]$ pg_probackup show -B /usr/local/pgsql/pro_backup --instance local_5432 --archive

ARCHIVE INSTANCE 'local_5432'
================================================================================================================================
 TLI  Parent TLI  Switchpoint  Min Segno                 Max Segno                 N segments  Size   Zratio  N backups  Status 
================================================================================================================================
 4    2           1/8AB37018   00000004000000010000008A  00000004000000010000008A  1           16MB   1.00    0          OK     
 3    2           1/8AB37018   00000003000000010000008A  00000003000000010000008A  1           16MB   1.00    0          OK     
 2    0           0/0          00000002000000010000006B  00000002000000010000008B  33          528MB  1.00    3          OK 


```



# 配置保留策略

```bash
–retention-redundancy=redundancy : 保留备份多少天 FULL
–retention-window=window : 可恢复多少天之前备份
pg_probackup set-config -B ${backup_dir} --instance ${instance_name} --retention-redundancy 7 --retention-window 7

$ /usr/local/pg_probackup-2.4.2/pg_probackup show-config -B /data/pgdata_probackup/ --instance local_5432
# Backup instance information
pgdata = /data/pgsql12/data
system-identifier = 6870373621203487994
xlog-seg-size = 16777216
# Connection parameters
pgdatabase = postgres
# Replica parameters
replica-timeout = 5min
# Archive parameters
archive-timeout = 5min
# Logging parameters
log-level-console = INFO
log-level-file = OFF
log-filename = pg_probackup.log
log-rotation-size = 0TB
log-rotation-age = 0d
# Retention parameters
retention-redundancy = 7
retention-window = 7
wal-depth = 0
# Compression parameters
compress-algorithm = none
compress-level = 1
# Remote access parameters
remote-proto = ssh

-- 删除过期数据
pg_probackup delete -B ${backup_dir} --instance ${instance_name} --delete-expired

-- 同时删除过期数据与过期WAL
pg_probackup delete -B ${backup_dir} --instance ${instance_name} --delete-expired --delete-wal

-- 使用新策略覆盖当前策略, 并删除过期数据与过期 WAL 
pg_probackup delete -B ${backup_dir} --instance ${instance_name} --delete-expired --delete-wal --retention-window=1 --retention-redundancy=1
dd
```



# 模拟新增2 张表, 然后 误将两张表 drop

```bash
\c test2
create table test_pg_probackup1(id bigserial primary key, name varchar);
create table test_pg_probackup2(id bigserial primary key, name varchar);
insert into test_pg_probackup1 (name) select n from generate_series(1,100000)n;
insert into test_pg_probackup2 (name) select n from generate_series(1,100000)n;
test2=# 
test2=# select now();
              now              
-------------------------------
 2023-08-23 14:24:59.143435+08
(1 row)

drop table test_pg_probackup1;
drop table test_pg_probackup2;

-- 基于时间点恢复到新的 data 目录
pg_ctl stop
pg_probackup restore -B /usr/local/pgsql/pro_backup --instance local_5432 -D /usr/local/pgsql/data_new --recovery-target-time='2023-08-23 14:24:59'

或者

pg_probackup restore -B /usr/local/pgsql/pro_backup --instance local_5432 -D /usr/local/pgsql/data_new --recovery-target-time='2023-08-23 14:24:59+08'
*注意 -D 后面的 data 目录必须是空的, 否则会执行报错

-- 基于时间点恢复到老的 data 目录
rm -rf /usr/local/pgsql/data
pg_probackup restore -B /usr/local/pgsql/pro_backup --instance local_5432 -D /usr/local/pgsql/data --recovery-target-time='2023-08-23 14:24:59+08'

数据库恢复之后, 需要连接上去, 执行如下命令, 将 PG 设置为 可读写状态, 有可能得执行多次, 才能将数据库状态设置为 可读写状态

test=# select * from pg_wal_replay_resume();                   
 pg_wal_replay_resume 
----------------------
 
(1 row)



test2=# select pg_is_in_recovery();                 
 pg_is_in_recovery 
-------------------
 t
(1 row)

test2=# select * from pg_wal_replay_resume();
 pg_wal_replay_resume 
----------------------
 
(1 row)

test2=# select pg_is_in_recovery();          
 pg_is_in_recovery 
-------------------
 f
(1 row)


test=# \c test2
You are now connected to database "test2" as user "pgsql".
test2=# \dt
              List of relations
 Schema |        Name        | Type  | Owner 
--------+--------------------+-------+-------
 public | student            | table | pgsql
 public | test               | table | pgsql
 public | test2              | table | pgsql
 public | test3              | table | pgsql
 public | test4              | table | pgsql
 public | test5              | table | pgsql
 public | test_pg_probackup1 | table | pgsql
 public | test_pg_probackup2 | table | pgsql
(8 rows)

test2=# Select count(*) from test_pg_probackup1;                   
 count  
--------
 100000
(1 row)

test2=# Select count(*) from test_pg_probackup2;
 count  
--------
 100000
(1 row)
```



#  基于PITR备份与恢复

```bash
-- 备份
pg_probackup backup -B /data/postgres/probackup --instance local_6000 -b full
--恢复之前需要先停库；在清理PGDATA目录以及外在的表空间目录
pg_ctl stop;
rm -rf $PGDATA/*

--恢复到新的PGDATA目录
pg_probackup restore -B /data/postgres/probackup --instance local_6000 -D /data/postgres/data6000 --recovery-target-time='2021-07-11 11:05:17'
 11:05:17'
-- 恢复到原目录
pg_probackup restore -B /data/postgres/probackup --instance local_6000 --recovery-target-time='2021-07-11 11:05:17'



## 根据备份集恢复
pg_probackup restore -B ${backup_dir} --instance ${instance_name} -i ${backup_id}

## 不完整恢复，恢复部分database
pg_probackup restore -B ${backup_dir} --instance ${instance_name} --db-include=${database_name1} --db-include=${database_name2}

## 按时间点恢复
pg_probackup restore -B ${backup_dir} --instance ${instance_name} --recovery-target-time='2020-09-22 22:49:34'
pg_probackup restore -B ${backup_dir} --instance ${instance_name} --recovery-target-xid='687'
pg_probackup restore -B ${backup_dir} --instance ${instance_name} --recovery-target-lsn='16/B374D848'
pg_probackup restore -B ${backup_dir} --instance ${instance_name} --recovery-target-name='before_app_upgrade'
pg_probackup restore -B ${backup_dir} --instance ${instance_name} --recovery-target='latest'
pg_probackup restore -B ${backup_dir} --instance ${instance_name} -recovery-target='immediate'

```

# 远程备份

> 远程备份处理步骤
## 节点 ip 信息
local  节点: 124.70.209.222
remote 节点: 120.27.250.75

## 互信配置
### 在远程备份实例主机上
```bash
# su - postgres
$ ssh-keygen            
$ ssh-copy-id postgres@${备份机_ip}
```

### 在备份机上
```bash
# su - postgres
$ ssh-keygen            
$ ssh-copy-id postgres@${备份实例主机_ip}
```

### 测试互信
```bash
$ ssh postgres@${对方IP}
```


## 在 local node 上, 添加远程实例
```bash
$ /usr/local/pg_probackup-2.4.2/pg_probackup  add-instance -B /data/pgdata_probackup/ -D /data/pgsql/data --instance zijie_5432 --remote-proto=ssh --remote-host=120.27.250.75 --remote-port=22 --remote-user=postgres --remote-path=/usr/local/pg_probackup-2.4.2/
INFO: Instance 'zijie_5432' successfully inited
```

## 在 remote node 上, 进行远程备份实例做配置
```bash
max_wal_senders=10   #     设置合理值
wal_level = 'replica'
archive_mode = 'on'
archive_command = '/usr/local/pg_probackup-2.4.2/pg_probackup archive-push -B /data/pgdata_probackup --instance zijie_5432 --wal-file-path=%p --wal-file-name=%f --remote-proto=ssh --remote-host=124.70.209.222 --remote-port=22 --remote-user=postgres --remote-path=/usr/local/pg_probackup-2.4.2/'
```

## 在 local node 上,  全量备份远程实例的数据库
```bash
$ /usr/local/pg_probackup-2.4.2/pg_probackup backup -B /data/pgdata_probackup/ --instance zijie_5432 --remote-user=postgres --remote-host=120.27.250.75 --remote-port=22 -b full
INFO: Backup start, pg_probackup version: 2.4.2, instance: zijie_5432, backup ID: QH3V3Y, backup mode: FULL, wal mode: ARCHIVE, remote: true, compress-algorithm: none, compress-level: 1
Password:
WARNING: This PostgreSQL instance was initialized without data block checksums. pg_probackup have no way to detect data block corruption without them. Reinitialize PGDATA with option '--data-checksums'.
WARNING: Current PostgreSQL role is superuser. It is not recommended to run backup or checkdb as superuser.
INFO: Wait for WAL segment /data/pgdata_probackup/wal/zijie_5432/0000000100000000000000E7 to be archived
WARNING: By default pg_probackup assume WAL delivery method to be ARCHIVE. If continuous archiving is not set up, use '--stream' option to make autonomous backup. Otherwise check that continuous archiving works correctly.
INFO: PGDATA size: 59MB
INFO: Start transferring data files
INFO: Data files are transferred, time elapsed: 7m:41s
INFO: wait for pg_stop_backup()
INFO: pg_stop backup() successfully executed
INFO: Wait for LSN 0/E80001D8 in archived WAL segment /data/pgdata_probackup/wal/zijie_5432/0000000100000000000000E8
INFO: Syncing backup files to disk
INFO: Backup files are synced, time elapsed: 0
INFO: Validating backup QH3V3Y
INFO: Backup QH3V3Y data files are valid
INFO: Backup QH3V3Y resident size: 43MB
INFO: Backup QH3V3Y completed
```

## 查看备份信息
```bash
$ /usr/local/pg_probackup-2.4.2/pg_probackup show -B /data/pgdata_probackup/ --instance zijie_5432
=======================================================================================================================================
 Instance    Version  ID      Recovery Time           Mode  WAL Mode  TLI     Time  Data   WAL  Zratio  Start LSN   Stop LSN    Status
=======================================================================================================================================
 zijie_5432  12       QH3V3Y  2020-09-23 17:57:28+08  FULL  ARCHIVE   1/0  13m:59s  43MB  16MB    1.00  0/E7000028  0/E80001D8  OK
 zijie_5432  12       QH3U2S  ----                    FULL  ARCHIVE   1/0  17m:12s  54MB     0    1.00  0/E4000028  0/0         ERROR
 zijie_5432  ----     QH3U2J  ----                    FULL  ARCHIVE   0/0       4s     0     0    1.00  0/0         0/0         ERROR
 zijie_5432  12       QH3U20  ----                    FULL  ARCHIVE   0/0       5s     0     0    1.00  0/0         0/0         ERROR
```



## 



