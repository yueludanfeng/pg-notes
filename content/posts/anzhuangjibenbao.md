---
title: "安装基本包"
date: 2024-08-30
description: "```bash"
categories: ["流复制"]
tags: ["WAL", "参数配置", "备份恢复", "安装部署", "流复制"]
series: []
---

```bash
yum -y install readline-devel zlib-devel openssl-devel

# yum -y install coreutils glib2 lrzsz mpstat dstat sysstat e4fsprogs xfsprogs ntp readline-devel zlib-devel openssl-devel pam-devel libxml2-devel libxslt-devel python-devel tcl-devel gcc make smartmontools flex bison perl-devel perl-Ext Utils* openldap-devel jadetex openjade bzip2 wget
```

# 编译安装

```bash
useradd pgsql
mkdir -p /postgresql/{app,data,arch_log,soft,script,tmp,backup}
chown -R pgsql.pgsql /postgresql

su - pgsql
cd /postgresql/soft
tar zxvf postgresql-12.16.tar.gz
cd postgresql-12.16
./configure --prefix=/postgresql/app && make -j8 world && make install-world
```



# 配置环境变量

```bash
cat >>  ~/.bash_profile <<"EOF"
export LANG=en_US.UTF-8
export PS1="[\u@\h \W]\$ "
export PGDATA=/postgresql/data
export PGHOME=/postgresql/app
export LD_LIBRARY_PATH=$PGHOME/lib:$LD_LIBRARY_PATH
export PATH=$PGHOME/bin:$PATH:.
export DATE=`date +"%Y%m%d%H%M"`
export PGUSER=postgres
export PGDATABASE=postgres
export PGPORT=5432
export PGHOST=/postgresql/tmp
EOF
source  ~/.bash_profile

```

# 初始化数据库

```bash
initdb -D $PGDATA -E UTF8 --lc-collate=C --lc-ctype=C -U postgres
```



# 修改 PG 配置

```bash
cat >> $PGDATA/postgresql.auto.conf <<"EOF"
listen_addresses = '*'
port=5432
logging_collector = on
log_destination = 'csvlog'  
log_filename = 'postgresql-%a.csv'
log_truncate_on_rotation = on
unix_socket_directories='/postgresql/tmp'
EOF

cat   >> $PGDATA/pg_hba.conf << EOF
host      all       all    0.0.0.0/0        md5
host   replication  all    0.0.0.0/0        md5
EOF

```

# 启动 PG

```bash
pg_ctl start
```



# 连接 PG

```bash
psql -c "select version()"
```



# 安装 pg_rman

参考: [PG物理备份恢复之 pg_rman 使用-CSDN博客](https://blog.csdn.net/yueludanfeng/article/details/111147141?ops_request_misc=%7B%22request%5Fid%22%3A%22169979001016800222899889%22%2C%22scm%22%3A%2220140713.130102334.pc%5Fblog.%22%7D&request_id=169979001016800222899889&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~blog~first_rank_ecpm_v1~rank_v31_ecpm-1-111147141-null-null.nonecase&utm_term=pg_rman&spm=1018.2226.3001.4450)

> ==经过测试, 基于 pg12.16 环境, pg_rman_v1.3.13到 1.3.15 都编译失败==



# 测试

* 准备数据

```sql
create table test(id bigserial primary key ,name text);
insert into test(name) select n||'name' from generate_series(1,10000)n;
```

* 全备

```bash
pg_rman -B /postgresql/backup  init
echo 'ARCLOG_PATH=/postgresql/arch_log' >> /postgresql/backup/pg_rman.ini
pg_rman -B /postgresql/backup  backup -bf 
pg_rman -B /postgresql/backup  show
pg_rman -B /postgresql/backup  show detail
pg_rman -B /postgresql/backup  validate

sbtest=# Select count(*) from test;
 count 
-------
 10000
(1 row)

sbtest=# select now();
              now              
-------------------------------
 2023-11-12 20:36:12.924732+08
(1 row)

sbtest=# insert into test(name) values('10001name')
sbtest-# ;
INSERT 0 1
sbtest=# 
sbtest=# \q


pg_rman -B /postgresql/backup  backup -bi
pg_rman -B /postgresql/backup  show
pg_rman -B /postgresql/backup  show detail

[pgsql@redis10 backup]$ pg_rman -B /postgresql/backup  show detail
======================================================================================================================
 StartTime           EndTime              Mode    Data  ArcLog  SrvLog   Total  Compressed  CurTLI  ParentTLI  Status 
======================================================================================================================
2023-11-12 20:36:59  2023-11-12 20:37:01  INCR  1073kB    33MB    ----    33MB       false       1          0  DONE
2023-11-12 20:35:28  2023-11-12 20:35:30  FULL   235MB   419MB    ----   639MB       false       1          0  OK
2023-11-12 20:27:23  2023-11-12 20:29:19  FULL      0B    ----    ----      0B       false       1          0  ERROR


pg_rman -B /postgresql/backup  validate

pg_ctl stop
pg_rman -B /postgresql/backup  restore --recovery-target-time='2023-11-12 20:36:12'
pg_rman -B /postgresql/backup  validate --recovery-target-time='2023-11-12 20:36:12'




[pgsql@redis10 data]$ pg_rman -B /postgresql/backup  show detail
======================================================================================================================
 StartTime           EndTime              Mode    Data  ArcLog  SrvLog   Total  Compressed  CurTLI  ParentTLI  Status 
======================================================================================================================
2023-11-12 20:42:53  2023-11-12 20:42:55  FULL   235MB   520MB    ----   740MB       false       2          1  OK
2023-11-12 20:42:41  2023-11-12 20:42:41  INCR      0B    ----    ----      0B       false       2          1  ERROR
2023-11-12 20:36:59  2023-11-12 20:37:01  INCR  1073kB    33MB    ----    33MB       false       1          0  OK
2023-11-12 20:35:28  2023-11-12 20:35:30  FULL   235MB   419MB    ----   639MB       false       1          0  OK
2023-11-12 20:27:23  2023-11-12 20:29:19  FULL      0B    ----    ----      0B       false       1          0  ERROR
[pgsql@redis10 data]$ 
[pgsql@redis10 data]$ pg_rman --help
pg_rman manage backup/recovery of PostgreSQL database.

Usage:
  pg_rman OPTION init
  pg_rman OPTION backup
  pg_rman OPTION restore
  pg_rman OPTION show [DATE]
  pg_rman OPTION show detail [DATE]
  pg_rman OPTION validate [DATE]
  pg_rman OPTION delete DATE
  pg_rman OPTION purge

Common Options:
  -D, --pgdata=PATH         location of the database storage area
  -A, --arclog-path=PATH    location of archive WAL storage area
  -S, --srvlog-path=PATH    location of server log storage area
  -B, --backup-path=PATH    location of the backup storage area
  -c, --check               show what would have been done
  -v, --verbose             show what detail messages
  -P, --progress            show progress of processed files

Backup options:
  -b, --backup-mode=MODE    full, incremental, or archive
  -s, --with-serverlog      also backup server log files
  -Z, --compress-data       compress data backup with zlib
  -C, --smooth-checkpoint   do smooth checkpoint before backup
  -F, --full-backup-on-error   switch to full backup mode
                               if pg_rman cannot find validate full backup
                               on current timeline
      NOTE: this option is only used in --backup-mode=incremental or archive.
  --keep-data-generations=NUM keep NUM generations of full data backup
  --keep-data-days=NUM        keep enough data backup to recover to N days ago
  --keep-arclog-files=NUM   keep NUM of archived WAL
  --keep-arclog-days=DAY    keep archived WAL modified in DAY days
  --keep-srvlog-files=NUM   keep NUM of serverlogs
  --keep-srvlog-days=DAY    keep serverlog modified in DAY days
  --standby-host=HOSTNAME   standby host when taking backup from standby
  --standby-port=PORT       standby port when taking backup from standby

Restore options:
  --recovery-target-time    time stamp up to which recovery will proceed
  --recovery-target-xid     transaction ID up to which recovery will proceed
  --recovery-target-inclusive whether we stop just after the recovery target
  --recovery-target-timeline  recovering into a particular timeline
  --hard-copy                 copying archivelog not symbolic link

Catalog options:
  -a, --show-all            show deleted backup too

Delete options:
  -f, --force               forcibly delete backup older than given DATE

Connection options:
  -d, --dbname=DBNAME       database to connect
  -h, --host=HOSTNAME       database server host or socket directory
  -p, --port=PORT           database server port
  -U, --username=USERNAME   user name to connect as
  -w, --no-password         never prompt for password
  -W, --password            force password prompt

Generic options:
  -q, --quiet               don't show any INFO or DEBUG messages
  --debug                   show DEBUG messages
  --help                    show this help, then exit
  --version                 output version information, then exit

Read the website for details. <http://github.com/ossc-db/pg_rman>
Report bugs to <http://github.com/ossc-db/pg_rman/issues>.
[pgsql@redis10 data]$ pg_rman -B /postgresql/backup  delete 2023-11-12 20:42:41
INFO: delete the backup with start time: "2023-11-12 20:42:41"
WARNING: cannot delete backup with start time "2023-11-12 20:36:59"
DETAIL: This is the incremental backup necessary for successful recovery.
WARNING: cannot delete backup with start time "2023-11-12 20:35:28"
DETAIL: This is the latest full backup necessary for successful recovery.
INFO: delete the backup with start time: "2023-11-12 20:27:23"
[pgsql@redis10 data]$ pg_rman -B /postgresql/backup  show detail
======================================================================================================================
 StartTime           EndTime              Mode    Data  ArcLog  SrvLog   Total  Compressed  CurTLI  ParentTLI  Status 
======================================================================================================================
2023-11-12 20:42:53  2023-11-12 20:42:55  FULL   235MB   520MB    ----   740MB       false       2          1  OK
2023-11-12 20:36:59  2023-11-12 20:37:01  INCR  1073kB    33MB    ----    33MB       false       1          0  OK
2023-11-12 20:35:28  2023-11-12 20:35:30  FULL   235MB   419MB    ----   639MB       false       1          0  OK
[pgsql@redis10 data]$ ll /postgresql/backup/
total 8
drwx------. 7 pgsql pgsql 76 Nov 12 20:42 20231112
drwx------. 4 pgsql pgsql 34 Nov 12 20:25 backup
-rw-rw-r--. 1 pgsql pgsql 69 Nov 12 20:27 pg_rman.ini
-rw-rw-r--. 1 pgsql pgsql 40 Nov 12 20:25 system_identifier
drwx------. 2 pgsql pgsql 30 Nov 12 20:42 timeline_history
[pgsql@redis10 data]$ ll /postgresql/backup//backup/
total 0
drwx------. 2 pgsql pgsql  6 Nov 12 20:42 pg_wal
drwx------. 2 pgsql pgsql 62 Nov 12 20:38 srvlog
[pgsql@redis10 data]$ ll /postgresql/backup/20231112/
total 0
drwx------. 2 pgsql pgsql  41 Nov 12 20:44 202723
drwx------. 5 pgsql pgsql 133 Nov 12 20:35 203528
drwx------. 5 pgsql pgsql 133 Nov 12 20:37 203659
drwx------. 2 pgsql pgsql  41 Nov 12 20:44 204241
drwx------. 5 pgsql pgsql 133 Nov 12 20:42 204253
[pgsql@redis10 data]$ pg_rman -B /postgresql/backup  purge
INFO: DELETED backup "2023-11-12 20:42:41" is purged
INFO: DELETED backup "2023-11-12 20:27:23" is purged
[pgsql@redis10 data]$ ll /postgresql/backup//backup/
total 0
drwx------. 2 pgsql pgsql  6 Nov 12 20:42 pg_wal
drwx------. 2 pgsql pgsql 62 Nov 12 20:38 srvlog
[pgsql@redis10 data]$ ll /postgresql/backup/20231112/
total 0
drwx------. 5 pgsql pgsql 133 Nov 12 20:35 203528
drwx------. 5 pgsql pgsql 133 Nov 12 20:37 203659

```

# 打包备份集合

```bash
cd /postgresql/
tar xcf backup.tar.gz backup
```



#  在其他机器上恢复

```bash
在另外机器上
su - pgsql
mkdir -p /postgresql/data2
chmod 700 /postgresql/data2

mkdir -p pg_rman_back_set/
将 backup.tar.gz 解压到此处
pg_rman -B /postgresql/pg_rman_back_set/backup  restore -D /postgresql/data2 
pg_cl start -D /postgresql/data2

[pgsql@redis11 backup]$ psql
psql (12.16)
Type "help" for help.

postgres=# \c sbtest 
You are now connected to database "sbtest" as user "postgres".
sbtest=# Select count(*) from test;
 count 
-------
 10001
(1 row)

sbtest=# \q
```
