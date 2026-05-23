---
title: "节点 ip 信息"
date: 2023-08-23
description: "> 远程备份处理步骤"
categories: ["PostgreSQL 运维"]
tags: ["WAL", "参数配置", "备份恢复"]
series: []
---

> 远程备份处理步骤
# 节点 ip 信息
local  节点: 124.70.209.222
remote 节点: 120.27.250.75

# 互信配置
## 在远程备份实例主机上
```bash
# su - postgres
$ ssh-keygen            
$ ssh-copy-id postgres@${备份机_ip}
```

## 在备份机上
```bash
# su - postgres
$ ssh-keygen            
$ ssh-copy-id postgres@${备份实例主机_ip}
```

## 测试互信
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