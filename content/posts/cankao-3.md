---
title: "参考"
date: 2023-07-31
description: "```bash"
categories: ["备份恢复与高可用"]
tags: ["Docker", "HA", "WAL", "参数配置", "备份恢复", "安装部署", "流复制", "高可用"]
series: []
---

# 参考
[倾情打造PostgreSQL高可用系列（一）：pg_auto_failover搭建 - 墨天轮 (modb.pro)](https://www.modb.pro/db/48135)
[倾情打造PostgreSQL高可用系列（二）：客户端的故障转移 - 墨天轮 (modb.pro)](https://www.modb.pro/db/48136)
[倾情打造PostgreSQL高可用系列（三）：理解PAF中的故障转移状态机(上) - 墨天轮 (modb.pro)](https://www.modb.pro/db/48137)
[倾情打造PostgreSQL高可用系列（四）：理解PAF中的故障转移状态机(下) - 墨天轮 (modb.pro)](https://www.modb.pro/db/48138)
[倾情打造PostgreSQL高可用系列（五）：多节点架构 - 墨天轮 (modb.pro)](https://www.modb.pro/db/48139)
[倾情打造PostgreSQL高可用系列（六）：switchover和脑裂情况测试 - 墨天轮 (modb.pro)](https://www.modb.pro/db/48140)


# 宿主机
```bash
docker rm -f paf 01
docker run -d --name paf 01 -h paf 01 -p 5277:22 -p 5278:3306 -p 5279:5432 -p 5280:23389 --net=my_network --ip=192.168.1.93 --privileged=true lxm_centos76:1.0 /usr/sbin/init
docker rm -f paf 02
docker run -d --name paf 02 -h paf 02 -p 5281:22 -p 5282:3306 -p 5283:5432 -p 5284:23389 --net=my_network --ip=192.168.1.94 --privileged=true lxm_centos76:1.0 /usr/sbin/init
docker rm -f paf 03
docker run -d --name paf 03 -h paf 03 -p 5285:22 -p 5286:3306 -p 5287:5432 -p 5288:23389 --net=my_network --ip=192.168.1.95 --privileged=true lxm_centos76:1.0 /usr/sbin/init

```

# [all]
```bash
echo '192.168.1.93 paf 01' >> /etc/hosts
echo '192.168.1.94 paf 02' >> /etc/hosts
echo '192.168.1.95 paf 03' >> /etc/hosts

su - pgsql
cat >> ~/. bash_profile <<EOF
export PGHOME=/usr/local/pgsql
export PATH=$PGHOME/bin:$PATH
export PGUSER=pgsql
export PGPORT=5432
export PGDATA=$PGHOME/data
export PGDATABASE=postgres
EOF

. ~/. bash_profile

```

# [all]
* 编译安装 PG 
```bash
yum -y install gcc  wget readline-devel  gcc-c++ openssl  epel-release ncurses-devel zlib* bzip 2
```

* 软件路径如下
```bash
/usr/local/pgsql
```

* 都不要 initdb

# [all]
* 修改配置文件
```bash
echo 'host   all autoctl_node 0.0.0.0/0 trust ' >> pg_hba. conf
echo 'host  all  all  0.0.0.0/0 scram-sha-256' >> pg_hba. conf
pg_ctl reload
```


* 编译安装 pg_auto_failover
```bash
make clean
make -j 8 all
make install
pg_autoctl create monitor --pgdata /usr/local/pgsql/data --pgport 5432 --hostname paf01 --auth trust --ssl-self-signed
或者 pg_autoctl create monitor  --hostname paf01 --auth trust --ssl-self-signed

nohup pg_autoctl create monitor --pgdata /usr/local/pgsql/data --pgport 5432 --hostname paf01 --auth trust --ssl-self-signed --run  &  

```

* 查看 monitor 节点以及集群状态
```bash
pg_autoctl config check
pg_autoctl show uri
```

# [paf02]
```bash

pg_autoctl create postgres  --hostname paf02 --auth trust --ssl-self-signed --monitor 'postgres://autoctl_node@paf01:5432/pg_auto_failover?sslmode=require' --run & 
```


# [paf03]
```bash
pg_autoctl create postgres  --hostname paf03 --auth trust --ssl-self-signed --monitor 'postgres://autoctl_node@paf01:5432/pg_auto_failover?sslmode=require' --run & 
```



>  如果节点没有弄好, 可以删除, 然后重新处理
# 在 monitor 节点上
* 移除  monitor  HA 软件
```bash
 pg_autoctl  drop monitor 
```

* 删除 HA 软件同时删除 PG 数据库数据
```bash
 pg_autoctl  drop monitor --destroy
```

# 在非 monitory 节点
* 删除 HA 软件
```bash
 pg_autoctl  drop monitor 
```

* 删除 HA 软件并删除 PG 数据库数据
```bash
 pg_autoctl drop node --destroy 
```


# 在 monitor 中测试 psql 连接 `paf02` 与 `paf03`
```
psql 'postgres://pgautofailover_monitor@192.168.1.94:5432,192.168.1.95:5432/postgres?target_session_attrs=read-write' -c "select inet_server_addr()"


[pgsql@paf01 data]$  psql 'postgres://pgautofailover_monitor@192.168.1.94:5432,192.168.1.95:5432/postgres?target_session_attrs=read-write' -c "select inet_server_addr()"
 inet_server_addr 
------------------
 192.168.1.94
(1 row)
```


# 生成自动启动服务脚本
* monitor
```bash
pg_autoctl -q show systemd  > $PGDATA/monitor.service

切换到 root 下
mv /usr/local/pgsql/data/monitor.service /usr/lib/systemd/system
systemctl daemon-reload
systemctl enable monitor
```

* paf02
```bash
pg_autoctl -q show systemd  | tee -a $PGDATA/pg_auto_failover.service
切换到 root 下
mv /usr/local/pgsql/data/pg_auto_failover.service /usr/lib/systemd/system
systemctl daemon-reload
systemctl enable pg_auto_failover

```

* paf03
```bash
pg_autoctl -q show systemd  | tee -a $PGDATA/pg_auto_failover.service
切换到 root 下
mv /usr/local/pgsql/data/pg_auto_failover.service /usr/lib/systemd/system
systemctl daemon-reload
systemctl enable pg_auto_failover

```

# 测试自动故障转移

比如在 paf02 上执行  
```bash
pg_autoctl stop

过一会, paf03 会变为 primary 节点
```

# 测试手动 failover
```bash
pg_autoctl perform switchover
pg_autoctl show state


[pgsql@paf02 data]$ pg_autoctl show state
  Name |  Node |  Host:Port |       TLI: LSN |   Connection |      Reported State |      Assigned State
-------+-------+------------+----------------+--------------+---------------------+--------------------
node_1 |     1 | paf02:5432 |   2: 0/306BD78 |    read-only |           secondary |           secondary
node_2 |     2 | paf03:5432 |   2: 0/306BD78 |   read-write |             primary |             primary

[pgsql@paf02 data]$ 
[pgsql@paf02 data]$ pg_autoctl perform switchover
18:40:52 19281 INFO  Targetting group 0 in formation "default"
18:40:52 19004 INFO  New state for node 2 "node_2" (paf03:5432): primary ➜ draining
18:40:52 19004 INFO  New state for this node (node 1, "node_1") (paf02:5432): secondary ➜ prepare_promotion
18:40:52 19281 INFO  Listening monitor notifications about state changes in formation "default" and group 0
18:40:52 19281 INFO  Following table displays times when notifications are received
    Time |   Name |  Node |  Host:Port |       Current State |      Assigned State
---------+--------+-------+------------+---------------------+--------------------
18:40:52 19004 INFO  Monitor assigned new state "prepare_promotion"
18:40:52 19004 INFO  FSM transition from "secondary" to "prepare_promotion": Stop traffic to primary, wait for it to finish draining.
18:40:52 19004 INFO  Transition complete: current state is now "prepare_promotion"
18:40:52 | node_2 |     2 | paf03:5432 |             primary |            draining
18:40:52 | node_1 |     1 | paf02:5432 |           secondary |   prepare_promotion
18:40:52 | node_1 |     1 | paf02:5432 |   prepare_promotion |   prepare_promotion
18:40:52 | node_1 |     1 | paf02:5432 |   prepare_promotion |    stop_replication
18:40:52 | node_2 |     2 | paf03:5432 |             primary |      demote_timeout
18:40:52 19004 INFO  Monitor assigned new state "stop_replication"
18:40:52 19004 INFO  FSM transition from "prepare_promotion" to "stop_replication": Prevent against split-brain situations.
18:40:52 19004 INFO  Prevent writes to the promoted standby while the primary is not demoted yet, by making the service incompatible with target_session_attrs = read-write
18:40:52 19004 INFO  Setting default_transaction_read_only to on
18:40:52 19004 INFO  Reloading Postgres configuration and HBA rules
18:40:52 19004 INFO  Promoting postgres
18:40:52 19004 INFO  Waiting for postgres to promote
18:40:53 | node_2 |     2 | paf03:5432 |            draining |      demote_timeout
18:40:53 | node_2 |     2 | paf03:5432 |      demote_timeout |      demote_timeout
18:40:53 19004 INFO  Waiting for postgres to promote
18:40:54 19004 INFO  Waiting for postgres to promote
18:40:55 19004 INFO  Waiting for postgres to promote
18:40:56 19004 INFO  Waiting for postgres to promote
18:40:57 19004 INFO  Waiting for postgres to promote
18:40:58 19004 INFO  Cleaning-up Postgres replication settings
18:40:58 19004 INFO  Disabling synchronous replication
18:40:58 19004 INFO  Reloading Postgres configuration and HBA rules
18:40:59 19004 INFO  Transition complete: current state is now "stop_replication"
18:40:59 | node_1 |     1 | paf02:5432 |    stop_replication |    stop_replication
18:40:59 | node_1 |     1 | paf02:5432 |    stop_replication |        wait_primary
18:40:59 | node_2 |     2 | paf03:5432 |      demote_timeout |             demoted
18:40:59 19004 INFO  Monitor assigned new state "wait_primary"
18:40:59 19004 INFO  FSM transition from "stop_replication" to "wait_primary": Confirmed promotion with the monitor
18:40:59 19004 INFO  Setting default_transaction_read_only to off
18:40:59 19004 INFO  Reloading Postgres configuration and HBA rules
18:40:59 19004 INFO  Fetched current list of 1 other nodes from the monitor to update HBA rules, including 1 changes.
18:40:59 19004 INFO  Ensuring HBA rules for node 2 "node_2" (paf03:5432)
18:40:59 19004 INFO  Reloading Postgres configuration and HBA rules
18:40:59 19004 INFO  Transition complete: current state is now "wait_primary"
18:40:59 | node_2 |     2 | paf03:5432 |             demoted |             demoted
18:40:59 | node_1 |     1 | paf02:5432 |        wait_primary |        wait_primary
18:40:59 | node_2 |     2 | paf03:5432 |             demoted |          catchingup
18:40:59 19004 INFO  New state for this node (node 1, "node_1") (paf02:5432): prepare_promotion ➜ prepare_promotion
18:40:59 19004 INFO  New state for this node (node 1, "node_1") (paf02:5432): prepare_promotion ➜ stop_replication
18:40:59 19004 INFO  New state for node 2 "node_2" (paf03:5432): primary ➜ demote_timeout
18:40:59 19004 INFO  New state for node 2 "node_2" (paf03:5432): draining ➜ demote_timeout
18:40:59 19004 INFO  New state for node 2 "node_2" (paf03:5432): demote_timeout ➜ demote_timeout
18:40:59 19004 INFO  New state for this node (node 1, "node_1") (paf02:5432): stop_replication ➜ stop_replication
18:40:59 19004 INFO  New state for this node (node 1, "node_1") (paf02:5432): stop_replication ➜ wait_primary
18:40:59 19004 INFO  New state for node 2 "node_2" (paf03:5432): demote_timeout ➜ demoted
18:40:59 19004 INFO  New state for node 2 "node_2" (paf03:5432): demoted ➜ demoted
18:40:59 19004 INFO  New state for this node (node 1, "node_1") (paf02:5432): wait_primary ➜ wait_primary
18:40:59 19004 INFO  New state for node 2 "node_2" (paf03:5432): demoted ➜ catchingup
18:40:59 | node_2 |     2 | paf03:5432 |          catchingup |          catchingup
18:40:59 19004 INFO  New state for node 2 "node_2" (paf03:5432): catchingup ➜ catchingup
18:40:59 | node_2 |     2 | paf03:5432 |          catchingup |           secondary
18:40:59 19004 INFO  New state for node 2 "node_2" (paf03:5432): catchingup ➜ secondary
18:40:59 | node_2 |     2 | paf03:5432 |           secondary |           secondary
18:40:59 19004 INFO  New state for node 2 "node_2" (paf03:5432): secondary ➜ secondary
18:40:59 | node_1 |     1 | paf02:5432 |        wait_primary |             primary
18:40:59 19004 INFO  Monitor assigned new state "primary"
18:40:59 19004 INFO  FSM transition from "wait_primary" to "primary": A healthy secondary appeared
18:40:59 19004 INFO  Setting synchronous_standby_names to 'ANY 1 (pgautofailover_standby_2)'
18:40:59 19004 INFO  Reloading Postgres configuration and HBA rules
18:40:59 19004 INFO  Waiting until standby node has caught-up to LSN 0/306D908
18:41:00 19004 INFO  Standby reached LSN 0/306D9B8, thus advanced past LSN 0/306D908
18:41:00 19004 INFO  Transition complete: current state is now "primary"
18:41:00 | node_1 |     1 | paf02:5432 |             primary |             primary
[pgsql@paf02 data]$ 18:41:00 19004 INFO  New state for this node (node 1, "node_1") (paf02:5432): wait_primary ➜ primary
18:41:00 19004 INFO  New state for this node (node 1, "node_1") (paf02:5432): primary ➜ primary
18:41:00 19004 INFO  New state for node 2 "node_2" (paf03:5432): secondary ➜ secondary
18:41:00 19004 INFO  New state for node 2 "node_2" (paf03:5432): secondary ➜ secondary

[pgsql@paf02 data]$ 
[pgsql@paf02 data]$ 
[pgsql@paf02 data]$ pg_autoctl show state
  Name |  Node |  Host:Port |       TLI: LSN |   Connection |      Reported State |      Assigned State
-------+-------+------------+----------------+--------------+---------------------+--------------------
node_1 |     1 | paf02:5432 |   3: 0/306DD90 |   read-write |             primary |             primary
node_2 |     2 | paf03:5432 |   3: 0/306DD90 |    read-only |           secondary |           secondary


[pgsql@paf02 data]$ pg_autoctl perform switchover
18:43:00 19588 INFO  Targetting group 0 in formation "default"
18:43:00 19588 INFO  Listening monitor notifications about state changes in formation "default" and group 0
18:43:00 19588 INFO  Following table displays times when notifications are received
    Time |   Name |  Node |  Host:Port |       Current State |      Assigned State
---------+--------+-------+------------+---------------------+--------------------
18:43:00 | node_1 |     1 | paf02:5432 |             primary |            draining
18:43:00 | node_2 |     2 | paf03:5432 |           secondary |   prepare_promotion
18:43:00 | node_2 |     2 | paf03:5432 |   prepare_promotion |   prepare_promotion
18:43:00 | node_2 |     2 | paf03:5432 |   prepare_promotion |    stop_replication
18:43:00 | node_1 |     1 | paf02:5432 |             primary |      demote_timeout
18:43:00 19004 INFO  New state for node 2 "node_2" (paf03:5432): prepare_promotion ➜ prepare_promotion
18:43:00 19004 INFO  New state for node 2 "node_2" (paf03:5432): prepare_promotion ➜ stop_replication
18:43:00 19004 INFO  New state for this node (node 1, "node_1") (paf02:5432): primary ➜ demote_timeout
18:43:00 19004 INFO  Monitor assigned new state "demote_timeout"
18:43:00 19004 INFO  FSM transition from "primary" to "demote_timeout": A failover occurred, no longer primary
18:43:00 19003 INFO  Stopping pg_autoctl postgres service
18:43:00 19003 INFO  /usr/local/pgsql/bin/pg_ctl --pgdata /usr/local/pgsql/data --wait stop --mode fast
18:43:00 19004 INFO  Transition complete: current state is now "demote_timeout"
18:43:00 | node_1 |     1 | paf02:5432 |      demote_timeout |      demote_timeout
18:43:00 19004 INFO  New state for this node (node 1, "node_1") (paf02:5432): demote_timeout ➜ demote_timeout
18:43:01 | node_2 |     2 | paf03:5432 |    stop_replication |    stop_replication
18:43:01 | node_2 |     2 | paf03:5432 |    stop_replication |        wait_primary
18:43:01 | node_1 |     1 | paf02:5432 |      demote_timeout |             demoted
18:43:01 19004 INFO  New state for node 2 "node_2" (paf03:5432): stop_replication ➜ stop_replication
18:43:01 19004 INFO  New state for node 2 "node_2" (paf03:5432): stop_replication ➜ wait_primary
18:43:01 19004 INFO  New state for this node (node 1, "node_1") (paf02:5432): demote_timeout ➜ demoted
18:43:01 19004 INFO  Monitor assigned new state "demoted"
18:43:01 19004 INFO  FSM transition from "demote_timeout" to "demoted": Demote timeout expired
18:43:01 19004 INFO  Transition complete: current state is now "demoted"
18:43:01 | node_1 |     1 | paf02:5432 |             demoted |             demoted
18:43:01 | node_2 |     2 | paf03:5432 |        wait_primary |        wait_primary
18:43:01 | node_1 |     1 | paf02:5432 |             demoted |          catchingup
18:43:01 19004 INFO  Monitor assigned new state "catchingup"
18:43:01 19004 INFO  FSM transition from "demoted" to "catchingup": A new primary is available. First, try to rewind. If that fails, do a pg_basebackup.
18:43:01 19004 INFO  Rewinding PostgreSQL to follow new primary node 2 "node_2" (paf03:5432)
18:43:01 19004 INFO   /usr/local/pgsql/bin/pg_rewind --target-pgdata /usr/local/pgsql/data --source-server 'application_name=pgautofailover_standby_1 host=paf03 port=5432 user=pgautofailover_replicator dbname=postgres sslmode=require' --progress
18:43:01 19004 INFO  pg_rewind:
18:43:01 19004 INFO   
18:43:01 19004 INFO  connected to server
18:43:01 19004 INFO  pg_rewind:
18:43:01 19004 INFO   
18:43:01 19004 INFO  servers diverged at WAL location 0/306DD90 on timeline 3
18:43:01 19004 INFO  pg_rewind:
18:43:01 19004 INFO   
18:43:01 19004 INFO  rewinding from last common checkpoint at 0/306D940 on timeline 3
18:43:01 19004 INFO  pg_rewind:
18:43:01 19004 INFO   
18:43:01 19004 INFO  reading source file list
18:43:01 19004 INFO  pg_rewind:
18:43:01 19004 INFO   
18:43:01 19004 INFO  reading target file list
18:43:01 19004 INFO  pg_rewind:
18:43:01 19004 INFO   
18:43:01 19004 INFO  reading WAL in target
18:43:01 19004 INFO  pg_rewind:
18:43:01 19004 INFO   
18:43:01 19004 INFO  need to copy 85 MB (total source directory size is 112 MB)
18:43:02 19004 INFO      0/87132 kB (0%) copied
18:43:02 19004 INFO  87132/87132 kB (100%) copied
18:43:02 19004 INFO  pg_rewind:
18:43:02 19004 INFO   
18:43:02 19004 INFO  creating backup label and updating control file
18:43:02 19004 INFO  pg_rewind:
18:43:02 19004 INFO   
18:43:02 19004 INFO  syncing target data directory
18:43:02 19004 INFO  pg_rewind: Done!
18:43:02 19004 INFO  Creating the standby signal file at "/usr/local/pgsql/data/standby.signal", and replication setup at "/usr/local/pgsql/data/postgresql-auto-failover-standby.conf"
18:43:02 19004 INFO  Contents of "/usr/local/pgsql/data/postgresql-auto-failover-standby.conf" have changed, overwriting
18:43:02 19601 INFO   /usr/local/pgsql/bin/postgres -D /usr/local/pgsql/data -p 5432 -h *
18:43:03 19003 WARN  PostgreSQL was not running, restarted with pid 19601
18:43:03 19004 INFO  Dropping replication slots (to reset their xmin)
18:43:03 19004 INFO  Transition complete: current state is now "catchingup"
18:43:03 | node_1 |     1 | paf02:5432 |          catchingup |          catchingup
18:43:03 19004 INFO  New state for this node (node 1, "node_1") (paf02:5432): demoted ➜ demoted
18:43:03 19004 INFO  New state for node 2 "node_2" (paf03:5432): wait_primary ➜ wait_primary
18:43:03 19004 INFO  New state for this node (node 1, "node_1") (paf02:5432): demoted ➜ catchingup
18:43:03 19004 INFO  New state for this node (node 1, "node_1") (paf02:5432): catchingup ➜ catchingup
18:43:04 | node_1 |     1 | paf02:5432 |          catchingup |           secondary
18:43:04 19004 INFO  Monitor assigned new state "secondary"
18:43:04 19004 INFO  FSM transition from "catchingup" to "secondary": Convinced the monitor that I'm up and running, and eligible for promotion again
18:43:04 19004 INFO  Reached timeline 4, same as upstream node 2 "node_2" (paf03:5432)
18:43:04 19004 INFO  Creating replication slot "pgautofailover_standby_2"
18:43:04 19004 INFO  Transition complete: current state is now "secondary"
18:43:04 | node_1 |     1 | paf02:5432 |           secondary |           secondary
18:43:04 | node_2 |     2 | paf03:5432 |        wait_primary |             primary
18:43:05 19004 INFO  New state for node 2 "node_2" (paf03:5432): primary ➜ primary
18:43:05 | node_2 |     2 | paf03:5432 |             primary |             primary
[pgsql@paf02 data]$ 
[pgsql@paf02 data]$ pg_autoctl show state
  Name |  Node |  Host:Port |       TLI: LSN |   Connection |      Reported State |      Assigned State
-------+-------+------------+----------------+--------------+---------------------+--------------------
node_1 |     1 | paf02:5432 |   4: 0/306E020 |    read-only |           secondary |           secondary
node_2 |     2 | paf03:5432 |   4: 0/306E020 |   read-write |             primary |             primary



```
