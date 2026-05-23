---
title: "集群环境"
date: 2023-07-30
description: "pgBackRest旨在成为一个可靠、易于使用的备份和恢复解决方案，通过利用针对特定数据库要求优化的算法，可以无缝扩展到最大的数据库和工作负载。"
categories: ["PostgreSQL 运维"]
tags: ["WAL", "pgbackrest", "参数配置", "备份恢复", "安装部署", "流复制", "监控", "连接池", "高可用"]
series: []
---

[PostgreSQL数据库逻辑备份与恢复 (kingdee.com)](https://vip.kingdee.com/article/378526762739114752?productLineId=29&isKnowledge=2)
[PostgreSQL单机环境备份与恢复 (kingdee.com)](https://vip.kingdee.com/article/355319090380443904?productLineId=29&isKnowledge=2)
[PostgreSQL高可用pgbackrest物理备份 (kingdee.com)](https://vip.kingdee.com/article/414452996877974528?productLineId=29&isKnowledge=2)

#  集群环境
[PostgreSQL高可用pgbackrest物理备份 (kingdee.com)](https://vip.kingdee.com/article/414452996877974528?productLineId=29&isKnowledge=2)

## 1 pgbackrest 简介  

pgBackRest旨在成为一个可靠、易于使用的备份和恢复解决方案，通过利用针对特定数据库要求优化的算法，可以无缝扩展到最大的数据库和工作负载。

**主要的功能**

并行备份和恢复

本地或远程备份

完整、增量和差异备份

备份轮换和存档过期策略

支持压缩和完整性校验

![](/images/Pasted%20image%2020230730114234.png)

  

## 2 PAF简介  

苍穹标准采用的postgreSQL数据库的高可用方式是pg_auto_failover，pg_auto_failover是PostgreSQL的一个扩展，用于监控和管理Postgres集群，自动触发故障转移，pg_auto_failover相比于Patroni、repmgr、Stolon和pgPool-II配置更简单，运维更方便。

  

## ![](https://vip-admin.kingdee.com/download/010996b203fa5f61425eb5d9871cb81ce200.png)

## 3 环境信息

下文以此环境信息为例

|   |   |   |
|---|---|---|
|地址|主机名|描述|
|[内网IP]|kd-app-01|PG高可用计算节点|
|[内网IP]|kd-app-02|PG高可用计算节点|
|[内网IP]|kd-app-03|备份节点（也是pgmonitor节点），需要注意磁盘空间|

## 4 创建必要目录  

### 4.1 创建日志目录（所有节点执行）

 sudo mkdir -p -m 770 /var/log/pgbackrest

 sudo chown postgres.postgres /var/log/pgbackrest/

### 4.2 创建配置目录（所有节点执行）

 sudo mkdir -p /etc/pgbackrest

 sudo mkdir -p /etc/pgbackrest/conf.d

 sudo touch /etc/pgbackrest/pgbackrest.conf

 sudo chmod 640 /etc/pgbackrest/pgbackrest.conf

 sudo chown postgres.postgres -R /etc/pgbackrest/

### 4.3创建命令和主目录（所有节点执行）

 sudo mkdir /usr/bin/pgbackrest

 sudo chown postgres.postgres /usr/bin/pgbackrest/

 sudo chmod 755 /usr/bin/pgbackrest/

 sudo mkdir -p /var/postgresql/pgbackrest/repos

 sudo chmod 750 /var/postgresql/pgbackrest/ -R

 sudo chown postgres.postgres /var/postgresql/pgbackrest/  -R

## 5 安装

工具已经安装好，在$PGHOME的直接确认配置就可以,无需安装

$PGHOME/bin/pgbackrest version

_Tips：如果缺少libxxx.so文件，可以从$PGHOME/lib 下找到对应的libxxx.so.x文件，将其拷贝到 /usr/lib64目录下。 如缺少 libpq.so.5 文件，就将 $PGHOME/lib/libpq.so.5.12 拷贝并重命名为 /usr/lib64/libpq.so.5_

## 6 配置ssh互信  

### 6.1 创建身份验证密钥（所有节点执行）

设置postgres用户的密码，用于传输公钥文件

# echo "Cosmic@2023"|passwd postgres --stdin

# su - postgres

$ ssh-keygen -f /home/postgres/.ssh/id_rsa -t rsa -b 4096 -N ""

### 6.2 交换公钥

**PG节点1执行:**  $ cat /home/postgres/.ssh/id_rsa.pub | ssh postgres@[内网IP] "cat >> /home/postgres/.ssh/authorized_keys"

**PG节点2**执行**:**  $ cat /home/postgres/.ssh/id_rsa.pub | ssh postgres@[内网IP] "cat >> /home/postgres/.ssh/authorized_keys"

**备份节点**执行**:** $ cat /home/postgres/.ssh/id_rsa.pub | ssh postgres@[内网IP] "cat >> /home/postgres/.ssh/authorized_keys"

**备份节点**执行**:** $ cat /home/postgres/.ssh/id_rsa.pub | ssh postgres@[内网IP] "cat >> /home/postgres/.ssh/authorized_keys"

**所有节点**执行**:** # chmod 600 /home/postgres/.ssh/authorized_keys

验证是否能免密ssh远程postgres用户登录

# su - postgres

$ ssh postgres@主机地址

  

## 7 配置文件

### 7.1 编辑配置文件

**PG节点1和PG节点2执行**：

```bash
# su - postgres

$ cat > /etc/pgbackrest/pgbackrest.conf <<EOF

[paf]

pg1-path=/var/kingdee/cosmic/postgres/pg_data

[global]

log-level-file=detail

repo1-host=[内网IP]

repo1-host-user=postgres

log-path=/var/log/pgbackrest

EOF

**备份节点**：

$ cat >/etc/pgbackrest/pgbackrest.conf <<EOF

[paf]

#pg节点1的地址

pg1-host=[内网IP]

#pg节点1的数据路径

pg1-path=/var/kingdee/cosmic/postgres/pg_data

pg1-port=5432

pg1-user=postgres

#pg节点2的地址

pg2-host=[内网IP]

#pg节点2的数据路径

pg2-path=/var/kingdee/cosmic/postgres/pg_data

pg2-port=5432

pg2-user=postgres

[global]

repo1-path=/var/postgresql/pgbackrest/repos

log-path=/var/log/pgbackrest

start-fast=y

repo1-retention-full=2

EOF
```

_注意修改pg的地址、数据路径_

## 7.2 修改归档命令

修改归档参数，利用pgbackrest管理和归档wal日志

# su - postgres

$ vi $PGDATA/postgresql.conf

archive_command = '/var/postgresql/soft/pg12.8/bin/pgbackrest --stanza=paf archive-push %p'

归档命令生效方式：$ pg_ctl reload

检查生效： $ psql  -c "select name,setting from pg_settings where name='archive_command';"

  

![](/images//download/0109bc31a2c0c8f740919cb579125fc74347.png)

## 8 初始化和备份

### 8.1 初始化（实例名paf）

备份节点： $ pgbackrest --stanza=paf --log-level-console=info  stanza-create

### 8.2 检测

备份节点： $ pgbackrest --stanza=paf --log-level-console=info check

### 8.3 全量备份

备份节点： pgbackrest --stanza=paf --log-level-console=info --type=full backup --exclude=log/ --process-max=16

_注：--exclude 排除某个目录或文件，此处排除了log日志目录_

### 8.4 增量备份

备份节点： pgbackrest --stanza=paf --log-level-console=info --type=incr backup --exclude=log/ --process-max=16

### 8.5 恢复

Tips：恢复备份只能在具体pg节点进行恢复，需要将备份文件从备份机拷贝到需要恢复的节点上

需要恢复节点： pgbackrest --stanza=paf --log-level-console=info restore --pg1-path=PG数据库数据路径 --process-max=16

## 9 备份恢复测试

### 9.1 全量备份

**91.1 全量备份**

$ pgbackrest --stanza=paf --log-level-console=info backup --process-max=16

  

![](/images//download/01098596b93c3d2c4de8b3539c233b7d83fe.png)

  

**9.1.2 查看备份状态**

$ pgbackrest --stanza=paf info

  

![](/images//download/0109ab847b1f51b142f9ad81f64789f39132.png)

### 9.2 增量备份

**9.2.1 增量备份**

$ pgbackrest --stanza=paf --log-level-console=info --type=incr backup --exclude=log/ --process-max=16

  

![](/images//download/0109cc88924b48c54df8a11c2c7288e870b5.png)

  

**9.2.2 查看备份状态**

$ pgbackrest --stanza=paf info

  

![](/images//download/0109ae9bf49e9c794c6f84dccb9899e40452.png)

### 9.3 恢复测试  

**9.3.1 恢复机的环境准备**  

（1）需要提前安装PostgreSQL数据库

（2）需要提前安装好pgbackrest命令，并配置好目录和配置文件，pgbackrest.conf配置文件参考postgres数据库的配置文件即可

_注：下面以其中从库为例进行恢复数据。paf高可用的修复方式本身能够自动修复，无需用pgbackrest恢复。此处是取消了paf高可用，以从库为例来测试恢复数据。_

  

**9.3.2 备份文件拷贝**

由于还原备份时不能通过远程方式，所以需要将备份文件拷贝到目标还原机上进行还原

# 打包备份文件，传到还原目标服务器上

$ cd /var/postgresql/pgbackrest/

$ tar -czf pgbackrest-202302151240.tar.gz *

$ scp pgbackrest-202302151240.tar.gz postgres@目标还原机: /var/postgresql/pgbackrest/

检查备份文件状态：

  

![](/images//download/010947dc4d2b9092436fae99f2bb1c71c69e.png)

  

**9.3.3 开始恢复**  

$ pgbackrest --stanza=paf  --log-level-console=info restore --pg1-path=/var/kingdee/cosmic/postgres/pg_data --process-max=16

  

![](/images//download/01095cdad45eacb44d91b36653caf92891a9.png)

  

**9.3.4 结果检查**

启动数据库，并登录数据库检查数据

$ pg_ctl -D $PGDATA start

$ psql

  

**![](/images//download/010928d68c12b3a54ebc8991297c7e398807.png)**  

  

### **9.4 基于时间点恢复（Point-in-Time Recovery）**  

9.4.1 选择指定恢复的时间点

查看时间戳： $  psql -Atc "select current_timestamp"

  

9.4.2 指定恢复  

$ pgbackrest --stanza=paf  --log-level-console=info --type=time "--target=2023-02-17 10:28:11.286883+08" --target-action=promote restore --pg1-path=/var/kingdee/cosmic/postgres/pg_data --process-max=16

  

![](/images//download/0109294d394091de45308f68ba321b1728a4.png)

  

## 10 定时备份任务

在备份机上创建备份脚本，脚本路径以实际为准：

```bash
# su - postgres

$ mkdir -p  /data/pgbackup/

  

创建全备脚本：

$ cat > /data/pgbackup/pgbak-full.sh <<EOF

source ~/.bashrc

/var/postgresql/soft/pg12.8/bin/pgbackrest --stanza=paf --log-level-console=info --type=full --exclude=log/  backup --process-max=8

EOF

  

创建增量备份脚本：

$ cat > /data/pgbackup/pgbak-incr.sh <<EOF

source ~/.bashrc

/var/postgresql/soft/pg12.8/bin/pgbackrest --stanza=paf --log-level-console=info --type=incr --exclude=log/  backup --process-max=8

EOF

  

创建定时任务：

$ crontab -e

# 每周六做一次全备
0 1 * * 6 sh /data/pgbackup/pgbak-full.sh >> /var/postgresql/pgbackrest/log/pgbak-full.log
# 每天做增量备份（增量备份频率以实际情况为准）
0 3 * * * sh /data/pgbackup/pgbak-incr.sh >> /var/postgresql/pgbackrest/log/pgbak-incr.log

```
  


# 单机环境

[PostgreSQL备份与恢复 (kingdee.com)](https://vip.kingdee.com/article/355319090380443904?productLineId=29&isKnowledge=2)

## 1 常用备份工具

  

|   |   |   |   |   |   |
|---|---|---|---|---|---|
|备份工具|**安装方式**|备份类型|压缩备份|远程备份|**备份特点**|
|pg_dump|自带|逻辑|不支持|支持|可备份指定库|
|pg_dumpall|自带|逻辑|不支持|支持|只能全库备份|
|pg_basebackup|自带|物理|不支持|支持|全库物理备份，不清理归档，常用于搭建流复制|
|pgbackrest|独立安装|物理|支持|支持|可指定库物理备份，可清理归档|

_注：推荐使用pgbackrest工具备份_

  

## 2 pg_dump工具

### 2.1 备份单个数据库

pg_dump只能备份单个数据库，不会导出角色和表空间相关的信息，便于迁移或异机恢复。常用参数如下：

# pg_dump --help            可以查看用法

-U, --username=NAME    以指定的数据库用户联接

-v, --verbose                     详细输出模式

-F, --format=c|d|t|p          导出文件的格式,-Fc备份为二进制格式, 压缩存储. 并且可被 pg_restore 用于精细还原。-Fp备份为文本, 大库不推荐

-d, --dbname=DBNAME  指定数据库名

-O, --no-owner                 在明文格式中, 忽略恢复对象所属者

-f, --file=FILENAME          导出后保存的文件名

 -j, --jobs=NUM               指定备份的并行度，指定备份路径而非备份文件，会生成很多小文件，还原时指定该目录即可

--insert                             导出成sql语句类型，虽然方便查看数据内容，但是导出耗时长

  

备份命令：pg_dump -U postgres -v -Fc -d 备份的库名 --no-owner -f 备份的dump文件

如：pg_dump -U postgres -v -Fc -d cosmic_fi --no-owner -f /data/backup/cosmic_fi.dump

  

![](/images//download/01093e044fa57fff477298779799e36f7f9d.png)

  

备份命令：pg_dump -h 主机 -U 用户名 -p 端口 -d 库名 --inserts > 备份文件名.sql

如：pg_dump -h 127.0.0.1 -U cosmic -p 5432 -d ierp_sys --inserts > ierp_sys.sql

  

![](/images//download/0109d8c4ec0a9bd74afebe090363b55d6339.png)

  

tips：--insert方式备份的sql文件可以直接用输入重定向进行还原：

psql 库名 -U 用户名 <备份文件名.sql

如： psql ierp_sys -U cosmic < /data/ierp_sys.sql

  

### 2.1 还原单个数据库（需指定数据库）

pg_restore  可以从pg_dump创建的存档中恢复一个PostgreSQL数据库。常用参数如下：

# pg_restore --help           可以查看用法

-U, --username=NAME     以指定的数据库用户联接

-O, --no-owner                  跳过对象所有权的恢复

-d, --dbname=DBNAME   指定数据库名

-v, --verbose                      详细信息模式

--role=ROLENAME            在恢复之前执行SET ROLE命令

  

恢复命令：pg_restore -U postgres --no-owner --role 还原目标的用户名 -d 还原目标的库名 -v 备份dump文件名

如：pg_restore -U postgres --no-owner --role mypg -d cosmic_fi -v /pgsql12/backup/cosmic_fi.dump

  

![](/images//download/0109a9135a8dcf7c4c4c8730bf1490539092.png)

  

_Tips：还原前需要提前建库，参考以下语句：_

_create database 库名 with owner=用户名 encoding='UTF8' tablespace=pg_default LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8' CONNECTION LIMIT=-1 TEMPLATE template0;_

## 3 pg_dumpall工具

pg_dumpall  只能备份整库，常用参数如下：

# pg_dumpall --help 可以查看用法

-a, --data-only               仅转储数据，而不转储schema

-c, --clean                      重新创建数据库之前清除（删除）数据库

-g, --globals-only          仅转储全局对象，而不转储数据库

-r, --roles-only               仅转储角色，而不转储数据库和表空间

-s, --schema-only          仅转储schema，而不转储数据

-O, --no-owner              以纯文本格式跳过对象所有权的恢复

--inserts                         以INSERT命令（而非COPY命令）的形式转储数据

### 3.1 备份整个数据库

备份命令：pg_dumpall -h 主机 -U 用户名 -p 端口 --inserts > 备份文件.sql

如： pg_dumpall -h 127.0.0.1 -U cosmic -p 5432 --inserts|gzip > /data/alldatabase1.sql.gz

  

![](/images//download/0109cee60fc043474ad6a71a82dcfb274454.png)

### 3.2 还原整个数据库

还原命令：psql -U 用户名 <备份文件名.sql

如： psql -U cosmic < /data/alldatabase1.sql.gz

_注：如果从生产环境备份恢复数据到其它环境(开发、测试等),只需要备份恢复苍穹的分库，mc库不需要做恢复，注意同步修改苍穹关于多维数据库的连接信息_

  

### 3.3 配置定时任务备份数据库

说明：红字部分根据实际的更换

备份全库脚本

准备备份脚本: /var/kingdee/script/pgbak.sh备份脚本：

#!/bin/sh
export DB_PORT=5432
export DB_IP='127.0.0.1'
export PGBinDir=/var/postgresql/soft/pg12.8/bin
export RemoteBackDir=/var/kingdee/pg_backup
export BackFileDir=/var/kingdee/pg_backup
export BackFileName=pgbak_${DB_IP}_${DB_PORT}_`date +%Y%m%d`.sql.gz
mkdir -p ${BackFileDir}
chown -R postgres. ${BackFileDir}
#备份数据库
su - postgres <<EOF
${PGBinDir}/pg_dumpall -U postgres -h ${DB_IP} -p ${DB_PORT} --inserts|gzip > ${BackFileDir}/${BackFileName}
EOF
#如果需要保存到异机，需要将备份文件传到远程存储中
sshpass -p"password" scp /${BackFileDir}/${BackFileName} root@ 数据备份服务器 IP:${RemoteBackDir}/

说明：sshpass传密码需要提前安装 sshpass，password 需要替换为root的实际密码。

**定时备份任务配置**  

进行crontab设置，增加以下定时任务：

#备份 每天凌晨1点备份

0 1 * * * /bin/sh /var/kingdee/script/pgbak.sh >>/var/kingdee/script/log/pgbak.log 2>&1

#备份 每天凌晨5点清理15天前的备份

0 5 * * * find /var/kingdee/pg_backup/ -name 'pgbak_*.sql.gz' -mtime +15 -exec rm {} \;

  

## 4 pgbackrest工具

### 4.1 pgbackrest介绍

主要的功能：

支持并行备份和恢复 ，解决了压缩操作中的瓶颈

支持本地或远程操作， 需配置TLS/SSH 在本地或远程备份、恢复和存档

支持完整、增量和差异备份，增量恢复

支持多个存储库

支持备份轮换和存档过期， 备份完整性检查，页面校验

支持断点备份

支持并行、异步 WAL 推送和获取

支持表空间和链接支持

支持加密

支持S3、Azure 和 GCS 兼容的对象存储

![](/images//download/0109d1ec683140c848589abb75c670bb32a5.png)

_注: （1）备份和还原的pgbaskrest版本必须一致_

_（2）数据库编译的block_size大小只能是8k，官方默认pg是16k_

  

### 4.2 pgbackrest配置

pgbackrest命令在工具安装pg数据库时就已经添加进去了，可以直接使用

下文以单机PostgreSQL数据库为例，高可用PostgreSQL请参考：[PostgreSQL高可用的物理备份方法](https://developer.kingdee.com/article/414452996877974528 "PostgreSQL高可用的物理备份方法")

  

**4.2.1 创建必要目录（路径以实际为准）**

- 1.1、创建日志目录
    

# mkdir -p -m 770 /var/log/pgbackrest

# chown postgres.postgres /var/log/pgbackrest/

  

- 1.2、创建配置目录
    

# mkdir -p /etc/pgbackrest/conf.d

# touch /etc/pgbackrest/pgbackrest.conf

# chmod 640 /etc/pgbackrest/pgbackrest.conf 

# chown postgres.postgres -R /etc/pgbackrest/

  

- 1.3、创建命令和主目录
    

# mkdir -p /var/postgresql/pgbackrest/repos

# chmod 750 /var/postgresql/pgbackrest/ -R

# chown postgres.postgres /var/postgresql/pgbackrest/  -R

  

**4.2.2 编辑pgbackrest配置文件**

- 2.1、编辑配置文件
    

# su - postgres
$ cat >/etc/pgbackrest/pgbackrest.conf <<EOF
[demo]
# 需要备份PG实例的数据路径
pg1-path=/var/kingdee/cosmic/postgres/pg_data
# 需要备份PG实例的端口
pg1-port=5432
# 需要备份PG实例的用户名
pg1-user=postgres

[global]
# 备份路径
repo1-path=/var/postgresql/pgbackrest/repos
# 备份的日志
log-path=/var/postgresql/pgbackrest/log
# 保留2份全量备份，会自动清理过期的归档日志
repo1-retention-full=2
EOF

  

- 2.2、修改postgresql.conf
    

修改归档参数，利用pgbackrest管理和归档wal日志

archive_command = 'source /home/postgres/.bashrc && /var/postgresql/soft/pg12.8/bin/pgbackrest --stanza=demo archive-push %p'

  

![](/images//download/0109ec7a2eb1fa0f4cb78790173f6d34c683.png)

_注：stanza为demo，需要与配置文件中[demo]对应_

  

修改参数后，配置生效方式：

$ pg_ctl reload

或者通过postgres用户登录pg命令行执行： select pg_reload_conf();

**4.2.3 初始化和备份**

- 3.1、初始化（实例名demo）
    

$ pgbackrest --stanza=demo --log-level-console=info  stanza-create

  

![](/images//download/0109258f4cd05f6a4d929e2743bb2725c38d.png)

  

- 3.2、检测  
    

$ pgbackrest --stanza=demo --log-level-console=info check

  

![](/images//download/0109f7d1b86f9ff643b8a404ae984782f57c.png)

  

- **3.3、全量备份（最大并行8）**
    

$ pgbackrest --stanza=demo --log-level-console=info --type=full --exclude=log/  backup --process-max=8 >demo_full_` date +%F_%T `.log &

  

![](/images//download/0109aa57e5cd5a0f49d092cc98b114c93e63.png)

  

##查看备份信息

$ pgbackrest info

  

![](/images//download/0109fe5b1a55f8664749ada9d0014ffd00f6.png)

  

- **3.4、增量备份（并行8）**
    

$ pgbackrest --stanza=demo --log-level-console=info --type=incr --exclude=log/ backup --process-max=8 >demo_incr_` date +%F_%T `.log &

  

![](/images//download/01099776ae4376aa4cceb5cf971016e1ea06.png)

  

**4.2.4 备份恢复**

- 4.1、全库恢复（并行16）
    

先停止postgresql数据库

# systemctl stop postgresql

  

清空数据目录（**确保是在需要还原的库上执行**）

$ rm -rf $PGDATA/*

  

开始还原全库

$ pgbackrest --stanza=demo  --log-level-console=info restore --pg1-path=$PGDATA --process-max=8  > demo_restore_` date +%F_%T `.log &

  

启动数据库

# pg_ctl -D $PGDATA start

  

![](https://vip-admin.kingdee.com/download/0109fb807e3e30f14406a6b6da7716eb3c92.png)

  

- 4.2、基于时间点还原（最大并行8）
    

查看时间戳

psql -Atc "select current_timestamp;"

  

先停止postgresql数据库

# systemctl stop postgresql

  

清空数据目录（**确保是在需要还原的库上执行**）

$ rm -rf $PGDATA/*

  

从全备中恢复至指定时间点

$ pgbackrest --stanza=demo  --log-level-console=info --type=time "--target=2022-09-19 15:54:01.322792+08" --target-action=promote restore --pg1-path=/var/kingdee/cosmic/postgres/pg_data --process-max=8  > demo_restore_` date +%F_%T `.log &

  

![](/images//download/0109546c96648b51468696e947dc25607a6e.png)

![](/images//download/0109707c5127664c4ef78e7587ca09feffa2.png)

  

启动数据库

# pg_ctl -D $PGDATA start

  

### 4.3 配置pgbackrest定时备份任务

使用postgres用户创建备份脚本，脚本路径以实际为准：

$ mkdir -p  /data/pgbackup/

  

创建全备脚本：

$ cat > /data/pgbackup/pgbak-full.sh <<EOF

source ~/.bashrc

/var/postgresql/soft/pg12.8/bin/pgbackrest --stanza=demo --log-level-console=info --type=full --exclude=log/ backup --process-max=8

EOF

  

创建增量备份脚本：

$ cat > /data/pgbackup/pgbak-incr.sh <<EOF

source ~/.bashrc

pgbackrest --stanza=demo --log-level-console=info --type=incr --exclude=log/ backup --process-max=8

EOF

  

创建定时任务：

$ crontab -e

# 每周六做一次全备
0 1 * * 6 sh /data/pgbackup/pgbak-full.sh >> /var/postgresql/pgbackrest/log/pgbak-full.log
# 每天做增量备份（增量备份频率以实际情况为准）
0 3 * * * sh /data/pgbackup/pgbak-incr.sh >> /var/postgresql/pgbackrest/log/pgbak-incr.log

  

作者：唐涛_8727

来源：金蝶云社区

原文链接：https://vip.kingdee.com/article/355319090380443904?productLineId=29&isKnowledge=2

著作权归作者所有。未经允许禁止转载，如需转载请联系作者获得授权。

