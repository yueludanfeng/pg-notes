---
title: "https://repmgr.org/docs/repmgr.html"
date: 2023-07-11
description: "repmgr --help"
categories: ["流复制"]
tags: ["WAL", "参数配置", "备份恢复", "安装部署", "流复制", "高可用"]
series: []
---

# https://www.modb.pro/db/460024
# https://www.modb.pro/db/15358    PostgreSQL高可用之Repmgr两节点搭建及switchover操作
# https://www.modb.pro/db/15359    PostgreSQL高可用之Repmgr自动failover
# https://www.modb.pro/db/15360    PostgreSQL高可用之Repmgr见证服务器搭建
# https://www.modb.pro/doc/7259    PG11 PostGis25 Repmgr5 VIP 2节点-yum
# https://www.modb.pro/doc/64348   PostgreSQL repmgr搭建（PostgreSQL 14.2）
# https://www.modb.pro/db/37658    Repmgr高可用环境搭建（PostgreSQL11.4）

# 帮助文档
repmgr --help
repmgr [OPTIONS] primary {register|unregister}
repmgr [OPTIONS] standby {register|unregister|clone|promote|follow|switchover}
repmgr [OPTIONS] node    {status|check|rejoin|service}
repmgr [OPTIONS] cluster {show|event|matrix|crosscheck|cleanup}
repmgr [OPTIONS] witness {register|unregister}
repmgr [OPTIONS] service {status|pause|unpause}
repmgr [OPTIONS] daemon  {start|stop}


# 服务器列表：
节点名	IP	操作系统	安装软件	备注
node1	[内网IP]	CentOS 7.6	PostgreSQL 14.6/repmgr-5.3.3	初始主节点
node2	[内网IP]	CentOS 7.6	PostgreSQL 14.6/repmgr-5.3.3	初始备节点
node3	[内网IP]	CentOS 7.6	PostgreSQL 14.6/repmgr-5.3.3	初始备节点

# 磁盘
fdisk /dev/vda
partprobe
mkfs.ext4 /dev/vda3
mkdir /data
blkid /dev/vda3
vi /etc/fstab
UUID=fe8751f6-c740-455c-b7a2-72f178bd2858 /data              ext4     defaults        0 0
mount -a

# 主机配置（所有节点）
hostnamectl set-hostname node1

cat >> /etc/hosts << EOF
[内网IP]   node0
[内网IP]   node1
[内网IP]   node2
[内网IP]   node3
EOF


# 关闭selinux
sed -i 's/SELINUX=.*/SELINUX=disabled/g' /etc/selinux/config
setenforce 0
getenforce

# 配置防火墙 防火墙需要开放postgres，etcd和patroni的端口。
firewall-cmd --add-port=5432/tcp --permanent
firewall-cmd --add-port=8008/tcp --permanent
firewall-cmd --add-port=2379/tcp --permanent
firewall-cmd --add-port=2380/tcp --permanent
firewall-cmd --reload
firewall-cmd --list-all
# 或者直接关闭防火墙
systemctl stop firewalld
systemctl disable firewalld

# 配置主机时区
timedatectl set-timezone Asia/Shanghai

# 配置主机同步时间
yum -y install chrony
sed '/^server/d' /etc/chrony.conf
echo 'server s1a.time.edu.cn iburst' >> /etc/chrony.conf
systemctl start chronyd
systemctl enable chronyd

# 编辑vi /etc/sysctl.conf文件,内核参数
cat >> /etc/sysctl.conf << EOF
fs.aio-max-nr = 1048576
fs.file-max = 6815744
kernel.shmall = 33554432
kernel.shmmax = 137438953472
kernel.shmmni = 4096
kernel.sem = 500 64000 200 256
kernel.panic_on_oops = 1
net.ipv4.ip_local_port_range = 9000 65500
net.core.rmem_default = 262144
net.core.rmem_max = 4194304
net.core.wmem_default = 262144
net.core.wmem_max = 1048576
vm.swappiness = 0
vm.dirty_background_ratio = 3
vm.dirty_ratio = 80
vm.dirty_expire_centisecs = 500
vm.dirty_writeback_centisecs = 100
EOF

sysctl -p

cat >> /etc/security/limits.conf << EOF
* soft    nofile  1048576
* hard    nofile  1048576
* soft    nproc   unlimited
* hard    nproc   unlimited
* soft    core    unlimited
* hard    core    unlimited
* soft    memlock unlimited
* hard    memlock unlimited
EOF

cat >> /etc/pam.d/login << EOF
session    required     pam_limits.so
EOF


# 安装需要的包
yum -y install gcc  wget readline-devel  gcc-c++ openssl  epel-release ncurses-devel zlib* bzip2 python-pip python-psycopg2 python-devel lrzsz jq pam-devel 
reboot

# 创建安装用户
groupadd -g 5432 postgres
useradd -u 5432 -g postgres postgres
echo 'sunwaypg' | passwd -f --stdin postgres

# 安装pg
wget https://ftp.postgresql.org/pub/source/v14.6/postgresql-14.6.tar.bz2 --no-check-certificate
tar xjvf postgresql-14.6.tar.bz2
scp postgresql-14.6.tar.bz2 root@[内网IP]:/root
scp postgresql-14.6.tar.bz2 root@[内网IP]:/root
mkdir -p -m 700 /opt/PostgreSQL/14/data
chown -R postgres:postgres /opt/PostgreSQL/14/data
cd postgresql-14.6
./configure --prefix=/opt/PostgreSQL/14 --with-pgport=5432 --with-python --with-openssl
gmake -j 8 world
make install
make install-docs
make install-world

# 操作系统免密 postgres
ssh-keygen -t rsa
ssh-copy-id -i .ssh/id_rsa.pub postgres@[内网IP]
ssh-copy-id -i .ssh/id_rsa.pub postgres@[内网IP]
ssh-copy-id -i .ssh/id_rsa.pub postgres@[内网IP]
ssh node1 date;ssh node2 date;ssh node3 date

# 安装repmgr
sudo yum groupinstall "Development Tools"
sudo yum install flex libselinux-devel libxml2-devel libxslt-devel openssl-devel pam-devel readline-devel
sudo yum install yum-utils openjade docbook-dtds docbook-style-dsssl docbook-style-xsl	   
wget https://repmgr.org/download/repmgr-5.3.3.tar.gz --no-check-certificate
tar -xzf repmgr-5.3.3.tar.gz
scp repmgr-5.3.3.tar.gz root@[内网IP]:/root
scp repmgr-5.3.3.tar.gz root@[内网IP]:/root
cd repmgr-5.3.3
./configure
make install

# 环境变量
vi /etc/profile
PATH=/opt/PostgreSQL/14/bin:$PATH

# 初始化数据库
su - postgres
which initdb
initdb -D /opt/PostgreSQL/14/data -W

# 创建归档目录
mkdir -p /opt/PostgreSQL/14/data/pg_arch

# 主库修改参数
vi /opt/PostgreSQL/14/data/postgresql.conf
listen_addresses = '*'
port = 5432
max_connections = 2000
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /opt/PostgreSQL/14/data/pg_arch/%f && cp %p /opt/PostgreSQL/14/data/pg_arch/%f'
restore_command='cp /opt/PostgreSQL/14/data/pg_arch/%f %p'
max_wal_senders = 10
wal_keep_size = 512
hot_standby = on
shared_preload_libraries = 'repmgr'

vi /opt/PostgreSQL/14/data/pg_hba.conf
local   replication     repmgr                              trust
host    replication     repmgr      127.0.0.1/32            trust
host    replication     repmgr      [内网IP]/32             trust
host    replication     repmgr      [内网IP]/32             trust
host    replication     repmgr      [内网IP]/32             trust
local   repmgr          repmgr                              trust
host    repmgr          repmgr      127.0.0.1/32            trust
host    repmgr          repmgr      [内网IP]/32             trust
host    repmgr          repmgr      [内网IP]/32             trust
host    repmgr          repmgr      [内网IP]/32             trust

# 启动主库并创建用户
pg_ctl -D /opt/PostgreSQL/14/data/ -l logfile start
psql
sql>create user repmgr superuser  password 'repmgr';
sql>ALTER USER repmgr SET search_path TO repmgr, "$user", public;
sql>create database repmgr owner repmgr;

# 主库 配置repmgr 并注册primary
vi /opt/PostgreSQL/14/data/repmgr.conf
node_id=1
node_name=pg101
conninfo='host=[内网IP] port=5432 user=repmgr password=[已隐藏] dbname=repmgr connect_timeout=5'
data_directory='/opt/PostgreSQL/14/data'
pg_bindir='/opt/PostgreSQL/14/bin'

repmgr -f /opt/PostgreSQL/14/data/repmgr.conf primary register
repmgr -f /opt/PostgreSQL/14/data/repmgr.conf cluster show

# 2个从节点 配置repmgr
# 从节点 clone
repmgr -h [内网IP] -U repmgr -p 5432 -d repmgr -f /opt/PostgreSQL/14/data/repmgr.conf standby clone --dry-run
repmgr -h [内网IP] -U repmgr -p 5432 -d repmgr -f /opt/PostgreSQL/14/data/repmgr.conf standby clone
repmgr -h [内网IP] -U repmgr -p 5432 -d repmgr -f /opt/PostgreSQL/14/data/repmgr.conf -F standby clone
# 节点2
vi /opt/PostgreSQL/14/data/repmgr.conf
node_id=2
node_name=pg102
conninfo='host=[内网IP] port=5432 user=repmgr password=[已隐藏] dbname=repmgr connect_timeout=5'
data_directory='/opt/PostgreSQL/14/data'
pg_bindir='/opt/PostgreSQL/14/bin'
# 节点3
vi /opt/PostgreSQL/14/data/repmgr.conf
node_id=3
node_name=pg103
conninfo='host=[内网IP] port=5432 user=repmgr password=[已隐藏] dbname=repmgr connect_timeout=5'
data_directory='/opt/PostgreSQL/14/data'
pg_bindir='/opt/PostgreSQL/14/bin'

# 启动数据库 并注册standby
pg_ctl -D /opt/PostgreSQL/14/data start
repmgr -f /opt/PostgreSQL/14/data/repmgr.conf standby register
repmgr -f /opt/PostgreSQL/14/data/repmgr.conf cluster show

# 所有节点正常 switchover
repmgr -f /opt/PostgreSQL/14/data/repmgr.conf standby switchover -U repmgr --verbose




# 手动 failover
# 模拟主节点数据关闭 promote
pg_ctl -D '/opt/PostgreSQL/14/data' -W -m fast stop
# promote 命令从任意从节点提升为主节点
repmgr -f /opt/PostgreSQL/14/data/repmgr.conf  standby promote --siblings-follow
# 再把主节点加入进来
repmgr -f /opt/PostgreSQL/14/data/repmgr.conf node rejoin -d 'host=[内网IP] dbname=repmgr user=repmgr password=[已隐藏] port=5432'





# 自动failover
# 修改配置文件
# vi /opt/PostgreSQL/14/data/repmgr.conf
failover='automatic'
connection_check_type=ping
reconnect_attempts=6
reconnect_interval=10 
#如果主节点失败，则要进行切换的工作，并记录到日志
promote_command='/opt/PostgreSQL/14/bin/repmgr standby promote -f /opt/PostgreSQL/14/data/repmgr.conf --log-to-file'
#如果有连接到主节点的其他从节点，会根据命令连接到新主的节点
follow_command='/opt/PostgreSQL/14/bin/repmgr standby follow -f /opt/PostgreSQL/14/data/repmgr.conf --log-to-file --upstream-node-id=%n'
location='default'
monitoring_history=true
monitor_interval_secs=5
priority=10

# 重新注册 （node_id,node_name,data_directory,location,priority 修改后必须重新注册）
repmgr primary register -f /opt/PostgreSQL/14/data/repmgr.conf --force
repmgr standby register -f /opt/PostgreSQL/14/data/repmgr.conf --force

# 启动repmgrd
repmgrd -d -f /opt/PostgreSQL/14/data/repmgr.conf

# 模拟主节点数据关闭
pg_ctl -D /opt/PostgreSQL/14/data stop -l logfile

# 查看节点3 promote成功
repmgr -f /opt/PostgreSQL/14/data/repmgr.conf cluster show

# 修复后 未启动数据库 重新加入集群
repmgr -f /opt/PostgreSQL/14/data/repmgr.conf node rejoin -d'host=[内网IP] port=5432 user=repmgr dbname=repmgr connect_timeout=2'

# 修复后 未启动数据库 重新加入集群，如果有事务就会导致两边不一致，不能加入集群
# 必须通过参数参能rewind
vi /opt/PostgreSQL/14/data/postgresql.conf
wal_log_hints=on
pg_ctl -D /opt/PostgreSQL/14/data start -l logfile
......
pg_ctl -D /opt/PostgreSQL/14/data stop -l logfile
repmgr -f /opt/PostgreSQL/14/data/repmgr.conf node rejoin -d 'host=[内网IP] port=5432 user=repmgr dbname=repmgr connect_timeout=2' --force-rewind

# 定期维护时不希望切换
repmgr -f /opt/PostgreSQL/14/data/repmgr.conf service pause 
repmgr -f /opt/PostgreSQL/14/data/repmgr.conf service status
repmgr -f /opt/PostgreSQL/14/data/repmgr.conf service unpause  
