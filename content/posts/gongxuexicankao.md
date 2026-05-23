---
title: "供学习参考 :"
date: 2023-07-20
description: "> CentOS 7.9 安装 PG 13 + repmgr +pgpool 实现负载均衡读写分离"
categories: ["流复制"]
tags: ["WAL", "参数配置", "备份恢复", "安装部署", "流复制", "监控", "连接池", "高可用"]
series: []
---

[How to Automate PostgreSQL 12 Replication and Failover with repmgr - Part 1 - 2ndQuadrant | PostgreSQL](https://www.2ndquadrant.com/en/blog/how-to-automate-postgresql-12-replication-and-failover-with-repmgr-part-1/)



> CentOS 7.9 安装 PG 13 + repmgr +pgpool 实现负载均衡读写分离

# 环境规划

```
[内网IP] node110  master
[内网IP] node111  slave1
[内网IP] node112  slave2
[内网IP] node113  witness
[内网IP] node114  pgpool

```

# Linux 安装

- 最小话安装–\> 调试工具
    
- GUI 服务器硬件监控 java 平台 KDE 桌面大系统性能主框架访问性能工具兼容性程序库开发工具系统管理工具
    

# 设置开机启动级别（字符界面而不是 GUI 界面）

```
systemctl get-default 
systemctl set-default multi-user.target
systemctl get-default 
```

# 关闭防火墙与 selinux

```
systemctl stop firewalld #临时关闭
systemctl disable firewalld #永久关闭,即设置开机的时候不自动启动
getenforce  
setenforce 0 
sed -i 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/selinux/config
```

# 配置 IP 与 DNS

```
 vim /etc/sysconfig/network-scripts/ifcfg-ens32
DNS1="114.114.114.114"
DNS2="8.8.8.8"

service  network restart

```

# linux 系统参数配置

```
cat >> /etc/sysctl.conf <<"EOF"
kernel.shmall = 4294967296  
kernel.shmmax=135497418752  
kernel.shmmni = 4096  
kernel.sem = 50100 64128000 50100 1280  
fs.file-max = 7672460  
fs.aio-max-nr = 1048576  
net.ipv4.ip_local_port_range = 9000 65000  
net.core.rmem_default = 262144  
net.core.rmem_max = 4194304  
net.core.wmem_default = 262144  
net.core.wmem_max = 4194304  
net.ipv4.tcp_max_syn_backlog = 4096  
net.core.netdev_max_backlog = 10000  
net.ipv4.netfilter.ip_conntrack_max = 655360  
net.ipv4.tcp_timestamps = 0  
net.ipv4.tcp_tw_recycle=1  
net.ipv4.tcp_timestamps=1  
net.ipv4.tcp_keepalive_time = 72   
net.ipv4.tcp_keepalive_probes = 9   
net.ipv4.tcp_keepalive_intvl = 7  
vm.zone_reclaim_mode=0  
vm.dirty_background_bytes = 40960000  
vm.dirty_ratio = 80  
vm.dirty_expire_centisecs = 6000  
vm.dirty_writeback_centisecs = 50  
vm.swappiness=0  
vm.overcommit_memory = 0  
vm.overcommit_ratio = 90  
EOF
    
sysctl -p

cat >> /etc/security/limits.conf   <<"EOF"
* soft    nofile  131072  
* hard    nofile  131072  
* soft    nproc   131072  
* hard    nproc   131072  
* soft    core    unlimited  
* hard    core    unlimited  
* soft    memlock 500000000  
* hard    memlock 500000000  
EOF

rm -f /etc/security/limits.d/*  
```

# 上传 iso 包

# 挂载

# 临时挂载

```
# mount -o loop,defaults,ro /mnt/iso/CentOS-7-x86_64-Everything-2009.iso /iso
```

#　永久挂载

```
echo "/mnt/iso/CentOS-7-x86_64-Everything-2009.iso /iso iso9660 defaults 0 0" >> /etc/fstab
```

# 测试挂载是否 OK

```
mount -a

```

# 备份原有 yum 源

cd /etc/yum. repos. d/
mkdir /bak mv * /bak

# 新增 YUM 配置文件

```
cd /etc/yum.repos.d/  
cat > local.repo  <<"EOF"
[local-yum]  
name=Local Repository  
baseurl=file:///iso
enabled=1  
gpgcheck=0  
EOF
```

# 刷新 YUM 缓存

```
yum clean all  
```

#yum源更新命令

```
yum clean all
yum makecache
yum update
```

# 安装相关包

```
yum install -y zlib-devel numactl
```

# 准备工作

```
useradd pgsql
echo "passwd" | passwd --stdin pgsql
mkdir -p /postgresql/{pgdata,pgsql,archive,soft}
chown -R pgsql.pgsql /postgresql
su - pgsql
cd /postgresql/soft
wget https://ftp.postgresql.org/pub/source/v13.3/postgresql-13.3.tar.gz
tar zxvf postgresql-13.3.tar.gz
cd postgresql-13.3
./configure --prefix=/postgresql/pgsql
make world -j 8  
make install-world  
```

# 环境变量配置

```
cat >> ~/.bash_profile <<"EOF"
export PS1="$USER@`/bin/hostname -s`-> "  
export PGPORT=5432
export PGDATA=/postgresql/pgdata
export LANG=en_US.utf8  
export PGHOME=/postgresql/pgsql
export LD_LIBRARY_PATH=$PGHOME/lib:/lib64:/usr/lib64:/usr/local/lib64:/lib:/usr/lib:/usr/local/lib:$LD_LIBRARY_PATH  
export PATH=$PGHOME/bin:$PATH:.  
export DATE=`date +"%Y%m%d%H%M"`  
export PGUSER=postgres  
export PGDATABASE=postgres  
EOF

source ~/.bash_profile

initdb -D $PGDATA -E UTF8 --locale=C -U postgres  

cat >> $PGDATA/postgresql.conf <<"EOF"
listen_addresses = '*'  
port = 5432 
logging_collector = on  
log_filename = 'postgresql-%u.log' 
log_truncate_on_rotation = on
EOF

cat >> $PGDATA/pg_hba.conf <<"EOF"
host all all 0.0.0.0/0 md5  
EOF

pg_ctl start
psql -h localhost -c "alter user postgres with password 'passwd';"
```

# 关闭透明大页

```
vim /etc/default/grub
修改之前：GRUB_CMDLINE_LINUX="rhgb quiet"
修改之后：GRUB_CMDLINE_LINUX="rhgb quiet transparent_hugepage=never"

grub2-mkconfig -o /boot/grub2/grub.cfg
numactl --show
numactl --hardware
reboot
```

# 克隆虚拟机之后

- 修改主机名 vim /etc/hostname
- 修改 IP 地址 vim /etc/sysconfig/network-scripts/ifcfg-ensxx 删除 uuid
- 删除/etc/udev/rules. d 下的网络相关文件/

# 下载 repmgr \[ALL\]

```
wget  https://repmgr.org/download/repmgr-5.2.1.tar.gz
```

# 配置 ip 别名 \[ALL\]

```
cat >> /etc/hosts <<EOF
[内网IP] node110
[内网IP] node111
[内网IP] node112
[内网IP] node113
[内网IP] node114
EOF
```

# 编译安装 repmgr \[ALL\]

```
tar zxvf repmgr-5.2.1.tar.gz 
cd repmgr-5.2.1/
./configure && make -j8 &&  make install
```

# 配置 pgsql 互信 5 台机器 \[node 110\]

```
上传文件 sshUserSetup.sh
以 root 用户执行
./sshUserSetup.sh -user pgsql  -hosts "node110 node111 node112 node113 node114" -advanced exverify -confirm
su - pgsql
chmod 600 /home/pgsql/.ssh/config
```

# 测试

```
su - pgsql
ssh node111 
hostname
ssh node112
hostname

ssh node113
hostname

ssh node114
hostname
```

# 配置防火墙 \[ALL\]

```
cat >> $PGDATA/pg_hba.conf <<"EOF"
local repmgr repmgr md5
host repmgr repmgr 127.0.0.1/32 md5
host repmgr repmgr [内网IP]/24 md5
local replication repmgr md5
host replication repmgr 127.0.0.1/32 md5
host replication repmgr [内网IP]/24 md5
EOF
```

# 配置归档等参数 \[ALL\]

```
cat >> $PGDATA/postgresql.conf <<"EOF"
# 归档参数
wal_level='replica'
archive_mode='on'
archive_command='test ! -f /postgresql/archive/%f && cp %p /postgresql/archive/%f'
restore_command='cp /postgresql/archive/%f %p'

# 主从流复制
hot_standby=on
max_wal_senders=10
wal_sender_timeout=60s
wal_keep_size=16MB

# 主从切换参数，启用PG数据库的复制槽，PG12不需要"use_replication_slots=true"这个参数了。
max_replication_slots=10
wal_log_hints=on

# 自动切换
shared_preload_libraries ='repmgr'

EOF
```

# 启动数据库 \[ALL\]

pg_ctl restart

# 创建相关用户 \[ALL\]

```
createuser -s repmgr
createdb repmgr -O repmgr
psql -c "alter user repmgr  with  password 'repmgr';"
psql -c "alter user repmgr set search_path to repmgr, \"\$user\",public;"
```

# 所有节点执行以 pgsql 用户执行

```
> ~/.pgpass
echo "*:*:*:repmgr:repmgr" > ~/.pgpass
# 必须授予权限
chmod 600 ~/.pgpass
```

# 测试配置是否 OK

```
psql 'host=node110 user=repmgr dbname=repmgr connect_timeout=2'
psql 'host=node111 user=repmgr dbname=repmgr connect_timeout=2'
psql 'host=node112 user=repmgr dbname=repmgr connect_timeout=2'
psql 'host=node113 user=repmgr dbname=repmgr connect_timeout=2'
```

# 所有个节点分别修改 repmgr. conf

```
以 pgsql 用户执行如下命令

cat > $PGHOME/repmgr.conf << "EOF"
node_id=1
node_name=node110
conninfo='host=[内网IP] user=repmgr password=[已隐藏] dbname=repmgr connect_timeout=2'
data_directory='/postgresql/pgdata'
pg_bindir='/postgresql/pgsql/bin'

monitoring_history=yes
monitor_interval_secs=5
failover=automatic
reconnect_attempts=6
reconnect_interval=5
promote_command='repmgr standby promote -f /postgresql/pgsql/repmgr.conf --log-to-file'
follow-command='repmgr standby follow -f /postgresql/pgsql/repmgr.conf --log-to-file --upstream-node-id=%n'
log_level=INFO
log_status_interval=10
log_file=/postgresql/pgsql/repmgr.log
EOF


-- 从库1
cat > $PGHOME/repmgr.conf << "EOF"
node_id=2
node_name=node111
conninfo='host=[内网IP] user=repmgr password=[已隐藏] dbname=repmgr connect_timeout=2'
data_directory='/postgresql/pgdata'
pg_bindir='/postgresql/pgsql/bin'

monitoring_history=yes
monitor_interval_secs=5
failover=automatic
reconnect_attempts=6
reconnect_interval=5
promote_command='repmgr standby promote -f /postgresql/pgsql/repmgr.conf --log-to-file'
follow-command='repmgr standby follow -f /postgresql/pgsql/repmgr.conf --log-to-file --upstream-node-id=%n'
log_level=INFO
log_status_interval=10
log_file=/postgresql/pgsql/repmgr.log
EOF

-- 从库2
cat > $PGHOME/repmgr.conf << "EOF"
node_id=3
node_name=node112
conninfo='host=[内网IP] user=repmgr password=[已隐藏] dbname=repmgr connect_timeout=2'
data_directory='/postgresql/pgdata'
pg_bindir='/postgresql/pgsql/bin'

monitoring_history=yes
monitor_interval_secs=5
failover=automatic
reconnect_attempts=6
reconnect_interval=5
promote_command='repmgr standby promote -f /postgresql/pgsql/repmgr.conf --log-to-file'
follow-command='repmgr standby follow -f /postgresql/pgsql/repmgr.conf --log-to-file --upstream-node-id=%n'
log_level=INFO
log_status_interval=10
log_file=/postgresql/pgsql/repmgr.log
EOF


-- witness节点
cat > $PGHOME/repmgr.conf << "EOF"
node_id=4
node_name=node113
conninfo='host=[内网IP] user=repmgr password=[已隐藏] dbname=repmgr connect_timeout=2'
data_directory='/postgresql/pgdata'
pg_bindir='/postgresql/pgsql/bin'

monitoring_history=yes
monitor_interval_secs=5
failover=automatic
reconnect_attempts=6
reconnect_interval=5
promote_command='repmgr standby promote -f /postgresql/pgsql/repmgr.conf --log-to-file'
follow-command='repmgr standby follow -f /postgresql/pgsql/repmgr.conf --log-to-file --upstream-node-id=%n'
log_level=INFO
log_status_interval=10
log_file=/postgresql/pgsql/repmgr.log
EOF
```

# 主库注册 \[node 110\]

```
repmgr -f /postgresql/pgsql/repmgr.conf  primary register --dry-run
repmgr -f /postgresql/pgsql/repmgr.conf  primary register
repmgr -f /postgresql/pgsql/repmgr.conf  cluster show
```

# 备库克隆与注册 \[node 111; node 112\]

```
pg_ctl stop
rm -rf /postgresql/pgdata
```

- 测试克隆

```
repmgr -h node110 -U repmgr -d repmgr -f /postgresql/pgsql/repmgr.conf standby clone --dry-run
```

- 真实执行

```
repmgr -h node110 -U repmgr -d repmgr -f /postgresql/pgsql/repmgr.conf standby clone --force
```

- 启动 PG `pg_ctl start`
- 注册从库

```
repmgr -f /postgresql/pgsql/repmgr.conf standby register
```

- witness 节点注册 \[node 113\]

```
repmgr -f /postgresql/pgsql/repmgr.conf  -h node110 -U repmgr -d repmgr witness register --dry-run
repmgr -f /postgresql/pgsql/repmgr.conf  -h node110 -U repmgr -d repmgr witness register
```

# 正常 switchover \[在 node 111\]

- 测试

```
repmgr -f /postgresql/pgsql/repmgr.conf standby switchover --siblings-follow --force-rewind --dry-run 
```

- 真实执行

```
repmgr -f /postgresql/pgsql/repmgr.conf standby switchover --siblings-follow --force-rewind --log-level DEBUG --verbose
```

– 可以 debug 打印详细的切换过程

```
# repmgr -f /postgresql/pgsql/repmgr.conf standby switchover --siblings-follow --force-rewind --log-level DEBUG --verbose
```

# 配置自动 fail over

- 在所有节点都配置文件 $PGHOME/repmgr. conf，增加内容包括：

```
cat >> $PGHOME/repmgr.conf << "EOF"
monitoring_history=yes
monitor_interval_secs=5
failover=automatic
reconnect_attempts=6
reconnect_interval=5
promote_command='repmgr standby promote -f /postgresql/pgsql/repmgr.conf --log-to-file'
follow_command='repmgr standby follow -f /postgresql/pgsql/repmgr.conf --log-to-file --upstream-node-id=%n'
log_level=INFO
log_status_interval=10
log_file='/postgresql/pgsql/repmgr.log'
EOF

```

root 用户下执行

```
cat >> /etc/logrotate.conf <<"EOF"
/postgresql/pgsql/repmgr.log
{
missingok
compress
rotate 30
daily
dateext
create 0600 pg13 pg13
}
EOF
```

*在所有节点都启动 repmgrd 进程

- 启动

```
repmgrd -f  /postgresql/pgsql/repmgr.conf  --pid-file /tmp/repmgrd.pid  --daemonize
```

– 建议加到开机自动启动:/etc/rc. local

```
echo "repmgrd -f  /postgresql/pgsql/repmgr.conf --pid-file /tmp/repmgrd.pid --daemonize" >> /etc/rc.local
chmod +x /etc/rc.d/rc.local
```

- 停止

```
kill -9 `cat /tmp/repmgrd.pid`
```

- 查看日志 `tailf /postgresql/pgsql/repmgr.log`

# 测试自动切换

模拟主机宕机\[node 110\]

```
pg_ctl stop

node 111:提升为主库
HINT: execute with --verbose option to see connection error messages
pgsql@node111-> repmgr -f /postgresql/pgsql/repmgr.conf  cluster show --verbose
NOTICE: using provided configuration file "/postgresql/pgsql/repmgr.conf"
INFO: connecting to database
ERROR: connection to database failed
DETAIL: 
could not connect to server: Connection refused
    Is the server running on host "[内网IP]" and accepting
    TCP/IP connections on port 5432?

DETAIL: attempted to connect using:
  user=repmgr password=[已隐藏] connect_timeout=2 dbname=repmgr host=[内网IP] fallback_application_name=repmgr options=-csearch_path=
 ID | Name    | Role    | Status    | Upstream | Location | Priority | Timeline | Connection string                                                             
----+---------+---------+-----------+----------+----------+----------+----------+--------------------------------------------------------------------------------
 1  | node110 | primary | - failed  | ?        | default  | 100      |          | host=[内网IP] user=repmgr password=[已隐藏] dbname=repmgr connect_timeout=2
 2  | node111 | primary | * running |          | default  | 100      | 4        | host=[内网IP] user=repmgr password=[已隐藏] dbname=repmgr connect_timeout=2
 3  | node112 | standby |   running | node111  | default  | 100      | 3        | host=[内网IP] user=repmgr password=[已隐藏] dbname=repmgr connect_timeout=2
 4  | node113 | witness | * running | node111  | default  | 0        | n/a      | host=[内网IP] user=repmgr password=[已隐藏] dbname=repmgr connect_timeout=2

WARNING: following issues were detected
  - when attempting to connect to node "node110" (ID: 1), following error encountered :
"could not connect to server: Connection refused
    Is the server running on host "[内网IP]" and accepting
    TCP/IP connections on port 5432?"
```

# 等 node 110 修复之后, 重新加入集群

```
repmgr -f  /postgresql/pgsql/repmgr.conf node rejoin -d 'host=node111 user=repmgr dbname=repmgr connect_timeout=2' 
```

# 加入集群之后, 在通过 swtichover 手动切换回主库

```
repmgr -f /postgresql/pgsql/repmgr.conf standby switchover --siblings-follow --force-rewind --dry-run 


pgsql@node110-> repmgr -f /postgresql/pgsql/repmgr.conf standby switchover --siblings-follow --force-rewind --dry-run 
NOTICE: checking switchover on node "node110" (ID: 1) in --dry-run mode
INFO: prerequisites for using pg_rewind are met
INFO: SSH connection to host "[内网IP]" succeeded
INFO: able to execute "repmgr" on remote host "[内网IP]"
INFO: all sibling nodes are reachable via SSH
INFO: 3 walsenders required, 10 available
INFO: demotion candidate is able to make replication connection to promotion candidate
INFO: 0 pending archive files
INFO: replication lag on this standby is 0 seconds
INFO: would pause repmgrd on node "node110" (ID 1)
INFO: would pause repmgrd on node "node111" (ID 2)
INFO: would pause repmgrd on node "node112" (ID 3)
INFO: would pause repmgrd on node "node113" (ID 4)
NOTICE: local node "node110" (ID: 1) would be promoted to primary; current primary "node111" (ID: 2) would be demoted to standby
INFO: following shutdown command would be run on node "node111":
  "/postgresql/pgsql/bin/pg_ctl  -D '/postgresql/pgdata' -W -m fast stop"
INFO: parameter "shutdown_check_timeout" is set to 60 seconds
INFO: prerequisites for executing STANDBY SWITCHOVER are met
pgsql@node110-> 
pgsql@node110-> 
pgsql@node110-> repmgr -f /postgresql/pgsql/repmgr.conf standby switchover --siblings-follow --force-rewind 
NOTICE: executing switchover on node "node110" (ID: 1)
NOTICE: local node "node110" (ID: 1) will be promoted to primary; current primary "node111" (ID: 2) will be demoted to standby
NOTICE: stopping current primary node "node 111" (ID: 2)
NOTICE: issuing CHECKPOINT on node "node111" (ID: 2) 
DETAIL: executing server command "/postgresql/pgsql/bin/pg_ctl  -D '/postgresql/pgdata' -W -m fast stop"
INFO: checking for primary shutdown; 1 of 60 attempts ("shutdown_check_timeout")
INFO: checking for primary shutdown; 2 of 60 attempts ("shutdown_check_timeout")
NOTICE: current primary has been cleanly shut down at location 0/C000028
NOTICE: promoting standby to primary
DETAIL: promoting server "node110" (ID: 1) using pg_promote()
NOTICE: waiting up to 60 seconds (parameter "promote_check_timeout") for promotion to complete
NOTICE: STANDBY PROMOTE successful
DETAIL: server "node110" (ID: 1) was successfully promoted to primary
NOTICE: issuing CHECKPOINT on node "node110" (ID: 1) 
ERROR: unable to execute CHECKPOINT
INFO: local node 2 can attach to rejoin target node 1
DETAIL: local node's recovery point: 0/C000028; rejoin target node's fork point: 0/C0000A0
NOTICE: setting node 2\'s upstream to node 1
WARNING: unable to ping "host=[内网IP] user=repmgr password=[已隐藏] dbname=repmgr connect_timeout=2"
DETAIL: PQping() returned "PQPING_NO_RESPONSE"
NOTICE: starting server using "/postgresql/pgsql/bin/pg_ctl  -w -D '/postgresql/pgdata' start"
WARNING: node "node111" attached in state "startup"
NOTICE: NODE REJOIN successful
DETAIL: node 2 is now attached to node 1
WARNING: node "node111" attached in state "startup"
INFO: waiting for node "node111" (ID: 2) to connect to new primary; 1 of max 60 attempts (parameter "node_rejoin_timeout")
DETAIL: node "node 110" (ID: 2) is currrently attached to its upstream node in state "startup"
NOTICE: node  "node110" (ID: 1) promoted to primary, node "node111" (ID: 2) demoted to standby
NOTICE: executing STANDBY FOLLOW on 2 of 2 siblings
INFO:  node 4 received notification to follow node 1
INFO: STANDBY FOLLOW successfully executed on all reachable sibling nodes
NOTICE: switchover was successful
DETAIL: node "node110" is now primary and node "node111" is attached as standby
NOTICE: STANDBY SWITCHOVER has completed successfully
pgsql@node110-> repmgr -f /postgresql/pgsql/repmgr.conf  cluster show
 ID | Name    | Role    | Status    | Upstream | Location | Priority | Timeline | Connection string                                                             
----+---------+---------+-----------+----------+----------+----------+----------+--------------------------------------------------------------------------------
 1  | node110 | primary | * running |          | default  | 100      | 5        | host=[内网IP] user=repmgr password=[已隐藏] dbname=repmgr connect_timeout=2
 2  | node111 | standby |   running | node110  | default  | 100      | 4        | host=[内网IP] user=repmgr password=[已隐藏] dbname=repmgr connect_timeout=2
 3  | node112 | standby |   running | node110  | default  | 100      | 4        | host=[内网IP] user=repmgr password=[已隐藏] dbname=repmgr connect_timeout=2
 4  | node113 | witness | * running | node110  | default  | 0        | n/a      | host=[内网IP] user=repmgr password=[已隐藏] dbname=repmgr connect_timeout=2
pgsql@node110-> 
```

# 下载安装 pgpool 2

```
mkdir -p /postgresql/pgpool
wget https://www.pgpool.net/mediawiki/images/pgpool-II-4.2.2.tar.gz
tar -zxvf pgpool-II-4.2.2.tar.gz
cd pgpool-II-4.2.2/
./configure --prefix=/postgresql/pgpool --with-pgsql=/postgresql/pgsql
make -j 8 && make install
```

# 环境变量配置

```
echo 'export PATH=/postgresql/pgpool/bin:$PATH' >> /home/pgsql/.bash_profile
source /home/pgsql/.bash_profile
```

# 拷贝参数

```
cp /postgresql/pgpool/etc/pgpool.conf.sample /postgresql/pgpool/etc/pgpool.conf
cp /postgresql/pgpool/etc/pool_hba.conf.sample /postgresql/pgpool/etc/pool_hba.conf
cp /postgresql/pgpool/etc/pcp.conf.sample /postgresql/pgpool/etc/pcp.conf
```

# 修改 pgpool. conf

```
cat >> /postgresql/pgpool/etc/pgpool.conf <<"EOF"
# - pgpool Connection Settings -
listen_addresses = '*'


# - Backend Connection Settings -
backend_hostname0 = '[内网IP]'
backend_port0 = 5432
backend_weight0 = 1
backend_data_directory0 = '/postgresql/pgdata'
backend_flag0 = 'ALLOW_TO_FAILOVER'
backend_application_name0 = 'node110'
backend_hostname1 = '[内网IP]'
backend_port1 = 5432
backend_weight1 = 1
backend_data_directory1 = '/postgresql/pgdata'
backend_flag1 = 'ALLOW_TO_FAILOVER'
backend_application_name1 = 'node111'


backend_hostname2 = '[内网IP]'
backend_port2 = 5432
backend_weight2 = 1
backend_data_directory2 = '/postgresql/pgdata'
backend_flag2 = 'ALLOW_TO_FAILOVER'
backend_application_name2 = 'node112'



# - Authentication -
enable_pool_hba = on


# - Where to log -
log_destination = 'syslog'
log_connections = on

#------------------------------------------------------------------------------
# FILE LOCATIONS
#------------------------------------------------------------------------------
pid_file_name = '/postgresql/pgpool/pgpool.pid'
logdir = '/tmp'


#------------------------------------------------------------------------------
# LOAD BALANCING MODE
#------------------------------------------------------------------------------
load_balance_mode = on

EOF
```

# 配置 pool_hba. conf

```
echo "host all all 0.0.0.0/0 md5" >> /postgresql/pgpool/etc/pool_hba.conf
```

# 生成 pool_passwd 文件

```
pg_md5 --md5auth --username=nobody "passwd"
pg_md5 --md5auth --username=pgpool "passwd"
pg_md5 --md5auth --username=postgres "passwd"

pgsql@node114-> cat pool_passwd 
nobody:md5979f0636f5188c5c037fa6eddf977684
pgpool:md592a6043af66f8da8ff9dda6320b95889
postgres:md55305adaac499dbbc6865a44e4aa5d8b4
```

# 配置 pcp. conf

```
pg_md5  -u=pgpool "passwd"
76a2173be6393254e72ffa4d6df1030a
echo  "pgpool:76a2173be6393254e72ffa4d6df1030a" >> /postgresql/pgpool/etc/pcp.conf
```

# 在主库中创建用户

```
psql -U postgres 
create role nobody login encrypted password 'passwd';
create role pgpool login encrypted password 'passwd';
grant postgres to nobody,pgpool;
```

# node 114

设置开机自动启动

```
cat >> /lib/systemd/system/pgpool.service <<"EOF"
[Unit]
Description=Pgpool-II
After=syslog.target network.target

[Service]
User=pgsql
Group=pgsql
EnvironmentFile=-/etc/sysconfig/pgpool
ExecStart=/postgresql/pgpool/bin/pgpool -f /postgresql/pgpool/etc/pgpool.conf -n
ExecStop=/postgresql/pgpool/bin/pgpool -f /postgresql/pgpool/etc/pgpool.conf -m fast stop
ExecReload=/postgresql/pgpool/bin/pgpool -f /postgresql/pgpool/etc/pgpool.conf reload
LimitNOFILE=65536
KillMode=process
KillSignal=SIGINT
Restart=on-abnormal
RestartSec=30s
TimeoutSec=0

[Install]
WantedBy=multi-user.target
EOF

chmod +x /lib/systemd/system/pgpool.service
systemctl status pgpool
systemctl start pgpool
systemctl enable pgpool
systemctl restart pgpool
```

# 实际操作

```
[root@node114 ~]# 
[root@node114 ~]# systemctl status pgpool
● pgpool.service - Pgpool-II
   Loaded: loaded (/usr/lib/systemd/system/pgpool.service; disabled; vendor preset: disabled)
   Active: inactive (dead)
[root@node114 ~]# systemctl start pgpool
[root@node114 ~]# systemctl enable pgpool
Created symlink from /etc/systemd/system/multi-user.target.wants/pgpool.service to /usr/lib/systemd/system/pgpool.service.
[root@node114 ~]# systemctl status pgpool
● pgpool.service - Pgpool-II
   Loaded: loaded (/usr/lib/systemd/system/pgpool.service; enabled; vendor preset: disabled)
   Active: active (running) since Sun 2021-07-11 20:02:18 CST; 5s ago
 Main PID: 68556 (pgpool)
   CGroup: /system.slice/pgpool.service
           ├─68556 /postgresql/pgpool/bin/pgpool -f /postgresql/pgpool/etc/pgpool.conf -n
           ├─68558 pgpool: wait for connection request
           ├─68559 pgpool: wait for connection request
           ├─68560 pgpool: wait for connection request
           ├─68561 pgpool: wait for connection request
           ├─68562 pgpool: wait for connection request
           ├─68563 pgpool: wait for connection request
           ├─68564 pgpool: wait for connection request
           ├─68565 pgpool: wait for connection request
           ├─68566 pgpool: wait for connection request
           ├─68567 pgpool: wait for connection request
           ├─68568 pgpool: wait for connection request
           ├─68569 pgpool: wait for connection request
           ├─68570 pgpool: wait for connection request
           ├─68571 pgpool: wait for connection request
           ├─68572 pgpool: wait for connection request
           ├─68573 pgpool: wait for connection request
           ├─68574 pgpool: wait for connection request
           ├─68575 pgpool: wait for connection request
           ├─68576 pgpool: wait for connection request
           ├─68577 pgpool: wait for connection request
           ├─68578 pgpool: wait for connection request
           ├─68579 pgpool: wait for connection request
           ├─68580 pgpool: wait for connection request
           ├─68581 pgpool: wait for connection request
           ├─68582 pgpool: wait for connection request
           ├─68583 pgpool: wait for connection request
           ├─68584 pgpool: wait for connection request
           ├─68585 pgpool: wait for connection request
           ├─68586 pgpool: wait for connection request
           ├─68587 pgpool: wait for connection request
           ├─68588 pgpool: wait for connection request
           ├─68589 pgpool: wait for connection request
           ├─68590 pgpool: PCP: wait for connection request
           ├─68591 pgpool: worker process
           └─68592 pgpool: health check process (0)

Jul 11 20:02:18 node 114 pgpool[68556]: [9-1] 2021-07-11 20:02:18: pid 68556: LOG:  pool_discard_o... maps
Jul 11 20:02:18 node114 pgpool[68556]: [10-1] 2021-07-11 20:02:18: pid 68556: LOG:  Setting up so...9999
Jul 11 20:02:18 node114 pgpool[68556]: [11-1] 2021-07-11 20:02:18: pid 68556: LOG:  Setting up so...9999
Jul 11 20:02:18 node114 pgpool[68556]: [12-1] 2021-07-11 20:02:18: pid 68556: LOG:  find_primary_...node
Jul 11 20:02:18 node114 pgpool[68556]: [13-1] 2021-07-11 20:02:18: pid 68556: LOG:  find_primary_...is 0
Jul 11 20:02:18 node114 pgpool[68590]: [14-1] 2021-07-11 20:02:18: pid 68590: LOG:  PCP process: ...rted
Jul 11 20:02:18 node114 pgpool[68591]: [14-1] 2021-07-11 20:02:18: pid 68591: LOG:  process started
Jul 11 20:02:18 node114 pgpool[68556]: [14-1] 2021-07-11 20:02:18: pid 68556: LOG:  pgpool-II suc...shi)
Jul 11 20:02:18 node114 pgpool[68556]: [15-1] 2021-07-11 20:02:18: pid 68556: LOG:  node status[0]: 1
Jul 11 20:02:18 node114 pgpool[68592]: [14-1] 2021-07-11 20:02:18: pid 68592: LOG:  process started
Hint: Some lines were ellipsized, use -l to show in full.
[root@node114 ~]# 
```

# 连接 pgpool

```
[root@node114 ~]# 
[root@node114 ~]# su - pgsql
Last login: Sun Jul 11 20:02:49 CST 2021 on pts/0
pgsql@node114-> psql -Upostgres -p 9999
psql (13.3)
Type "help" for help.

postgres=# show pool_nodes;
 node_id |   hostname    | port | status | lb_weight |  role   | select_cnt | load_balance_node | replic
ation_delay | replication_state | replication_sync_state | last_status_change  
---------+---------------+------+--------+-----------+---------+------------+-------------------+-------
------------+-------------------+------------------------+---------------------
 0       | [内网IP] | 5432 | up     | 0.333333  | primary | 0          | true              | 0     
            |                   |                        | 2021-07-11 20:06:33
 1       | [内网IP] | 5432 | unused | 0.333333  | standby | 0          | false             | 0     
            |                   |                        | 2021-07-11 20:06:33
 2       | [内网IP] | 5432 | unused | 0.333333  | standby | 0          | false             | 0     
            |                   |                        | 2021-07-11 20:06:33
(3 rows)
```

# 查看 pgpool 后端状态

```
pcp_node_info -U pgpool -h localhost -p 9898 -n 0 -v
pcp_node_info -U pgpool -h localhost -p 9898 -n 1 -v
pcp_node_info -U pgpool -h localhost -p 9898 -n 2 -v

pgsql@node114-> pcp_node_info -U pgpool -h localhost -p 9898 -n 0 -v
Password: 
[已隐藏]               : [内网IP]
Port                   : 5432
Status                 : 2
Weight                 : 0.333333
Status Name            : up
Role                   : primary
Replication Delay      : 0
Replication State      : 
Replication Sync State : 
Last Status Change     : 2021-07-11 20:06:33
pgsql@node114-> 
pgsql@node114-> pcp_node_info -U pgpool -h localhost -p 9898 -n 1 -v
Password: 
[已隐藏]               : [内网IP]
Port                   : 5432
Status                 : 0
Weight                 : 0.333333
Status Name            : unused
Role                   : standby
Replication Delay      : 0
Replication State      : 
Replication Sync State : 
Last Status Change     : 2021-07-11 20:06:33
pgsql@node114-> 
pgsql@node114-> pcp_node_info -U pgpool -h localhost -p 9898 -n 2 -v
Password: 
[已隐藏]               : [内网IP]
Port                   : 5432
Status                 : 0
Weight                 : 0.333333
Status Name            : unused
Role                   : standby
Replication Delay      : 0
Replication State      : 
Replication Sync State : 
Last Status Change     : 2021-07-11 20:06:33
pgsql@node114-> 
```

> 可以看到两个备库为 unused pgpool -m fast stop pgpool -C -D 可能需要多尝试几次

## 测试读写分离+负载均衡

测试之前，可以考虑修改文件 pgpool. conf 中的如下参数：

```
cat >> /postgresql/pgpool/etc/pgpool.conf << "EOF"
log_statement=all
log_per_node_statement =on
client_min_messages =log
log_min_messages = info
EOF
pgpool reload
```

测试完成后，修改回原值：

```
log_statement=off
log_per_node_statement = off
# client_min_messages =notice
# log_min_messages = warning
```

# 测试, 开三个窗口

```
窗口1:
Last Status Change     : 2021-07-11 20:29:00
pgsql@node114-> psql -Upostgres -p 9999
psql (13.3)
Type "help" for help.

postgres=# \c test
You are now connected to database "test" as user "postgres".
test=# select * from test_pgpool;
LOG:  statement: select * from test_pgpool;
LOG:  DB node id: 0 backend pid: 73212 statement: SELECT version()
LOG:  DB node id: 0 backend pid: 73212 statement: SELECT count(*) FROM pg_class AS c, pg_namespace AS n WHERE c.oid = pg_catalog.to_regclass('"test_pgpool"') AND c.relnamespace = n.oid AND n.nspname = 'pg_catalog'
LOG:  DB node id: 0 backend pid: 73212 statement: SELECT count(*) FROM pg_catalog.pg_class AS c, pg_namespace AS n WHERE c.relname = 'test_pgpool' AND c.relnamespace = n.oid AND n.nspname ~ '^pg_temp_'
LOG:  DB node id: 0 backend pid: 73212 statement: SELECT count(*) FROM pg_catalog.pg_class AS c WHERE c.oid = pg_catalog.to_regclass('"test_pgpool"') AND c.relpersistence = 'u'
LOG:  DB node id: 0 backend pid: 73212 statement: select * from test_pgpool;
 id 
----
  1
  2
  3
(3 rows)

test=# select * from test_pgpool;


窗口 2:
test=# \q
pgsql@node114-> psql -Upostgres -h [内网IP] -p 9999 -d test
Password for user postgres: 
psql (13.3)
Type "help" for help.

test=# select * from test_pgpool;
LOG:  statement: select * from test_pgpool;
LOG:  DB node id: 0 backend pid: 73232 statement: SELECT count(*) FROM pg_class AS c, pg_namespace AS n WHERE c.oid = pg_catalog.to_regclass('"test_pgpool"') AND c.relnamespace = n.oid AND n.nspname = 'pg_catalog'
LOG:  DB node id: 0 backend pid: 73232 statement: SELECT count(*) FROM pg_catalog.pg_class AS c, pg_namespace AS n WHERE c.relname = 'test_pgpool' AND c.relnamespace = n.oid AND n.nspname ~ '^pg_temp_'
LOG:  DB node id: 0 backend pid: 73232 statement: SELECT count(*) FROM pg_catalog.pg_class AS c WHERE c.oid = pg_catalog.to_regclass('"test_pgpool"') AND c.relpersistence = 'u'
LOG:  DB node id: 1 backend pid: 67106 statement: select * from test_pgpool;
 id 
----
  1
  2
  3
(3 rows)


窗口3:
pgsql@node114->  psql -Upostgres -h [内网IP] -p 9999 -d test
Password for user postgres: 
psql (13.3)
Type "help" for help.

test=# show pool_nodes;
LOG:  statement: show pool_nodes;
LOG:  DB node id: 0 backend pid: 73272 statement: SELECT version()
 node_id |   hostname    | port | status | lb_weight |  role   | select_cnt | load_balance_node | replic
ation_delay | replication_state | replication_sync_state | last_status_change  
---------+---------------+------+--------+-----------+---------+------------+-------------------+-------
------------+-------------------+------------------------+---------------------
 0       | [内网IP] | 5432 | up     | 0.333333  | primary | 11         | false             | 0     
            |                   |                        | 2021-07-11 20:29:20
 1       | [内网IP] | 5432 | up     | 0.333333  | standby | 2          | false             | 0     
            |                   |                        | 2021-07-11 20:29:20
 2       | [内网IP] | 5432 | up     | 0.333333  | standby | 0          | true              | 0     
            |                   |                        | 2021-07-11 20:29:20
(3 rows)

test=# select * from test_pgpool;
LOG:  statement: select * from test_pgpool;
LOG:  DB node id: 0 backend pid: 73272 statement: SELECT count (*) FROM pg_class AS c, pg_namespace AS n WHERE c.oid = pg_catalog. to_regclass ('"test_pgpool"') AND c.relnamespace = n.oid AND n.nspname = 'pg_catalog'
LOG:  DB node id: 0 backend pid: 73272 statement: SELECT count(*) FROM pg_catalog.pg_class AS c, pg_namespace AS n WHERE c.relname = 'test_pgpool' AND c.relnamespace = n.oid AND n.nspname ~ '^pg_temp_'
LOG:  DB node id: 0 backend pid: 73272 statement: SELECT count(*) FROM pg_catalog.pg_class AS c WHERE c.oid = pg_catalog.to_regclass('"test_pgpool"') AND c.relpersistence = 'u'
LOG:  DB node id: 2 backend pid: 67873 statement: select * from test_pgpool;
 id 
----
  1
  2
  3
(3 rows)
```

# 关闭客户端日志打印

将之前修改的客户端日志打印配置删除相当于

```
log_statement=off
log_per_node_statement = off
# client_min_messages =notice
# log_min_messages = warning
```

# 额外可以参考

https://www.douyin.com/video/7079256107465706782

<!-- [图片: 592699b6bb64553d2b16604d937ff96a.png] -->