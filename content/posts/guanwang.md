---
title: "官网"
date: 2024-08-30
description: "```bash"
categories: ["PostgreSQL 培训"]
tags: ["参数配置", "备份恢复", "安装部署", "流复制", "索引"]
series: []
---

[Download | Redis](https://redis.io/download/)

# 中文网站

[Redis中文网](https://www.redis.net.cn/)



# 历史版本下载

[Index of /releases/ (redis.io)](http://download.redis.io/releases/)




# 单机环境
## 目录规划与编译安装
```bash
mkdir -p /redis/{soft,app,data,log}
mkdir -p /redis/{data,log}/6379
groupadd -g 60001 redis
useradd -g redis -u 6001 redis
chmod -R 755 /redis
chown -R redis.redis /redis
id redis
echo "redis" | passwd --stdin redis


cd /redis/soft
上传软件 redis-7.0.5.tar.gz



su - redis
cd /redis/soft
tar zxvf redis-**.tar.gz
cd redis-*
make
cd src
make PREFIX=/redis/app install

```

## 配置文件
注意下面IP 需要网段
```bash
cat > /redis/data/6379/redis.conf <<"EOF"
bind 192.168.42.11
port 6379
logfile "/redis/log/6379/redis.log"
pidfile "/redis/data/6379/redis.pid"
dir /redis/data/6379
maxclients 10000
daemonize yes
requirepass passwd
maxmemory 512MB
appendonly yes
appendfilename "appendonly-6379.aof"
appendfsync everysec
no-appendfsync-on-rewrite yes
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 1024mb

EOF
```

## 启停管理与连接
```bash
* 启动
## 在 redis 用户下
cat >> ~/.bash_profile <<"EOF"
export PATH=/redis/app/bin:$PATH
EOF
. ~/.bash_profile

redis-server /redis/data/6379/redis.conf

* 连接
redis-cli -a passwd -h 192.168.42.11 -p 6379

# 获取配置文件路径
redis-cli -a passwd -h 192.168.42.11 -p 6379 info |grep config_file
或者进入redis 之后, 执行 info config_file

* 停止
pkill redis-server
redis-cli -a passwd -h 192.168.42.11 -p 6379 shutdown
```

# 多实例
```bash
su - redis
mkdir -p /redis/data/{6389,6399}
mkdir -p /redis/log/{6389,6399}
cp /redis/data/6379/redis.conf  /redis/data/6389/redis.conf
cp /redis/data/6379/redis.conf  /redis/data/6399/redis.conf

sed -i.bak 's/6379/6389/g' /redis/data/6389/redis.conf 
sed -i.bak 's/6379/6399/g' /redis/data/6399/redis.conf 


* 启动
redis-server /redis/data/6389/redis.conf
redis-server /redis/data/6399/redis.conf

* 查看多实例并进行连接
[redis@redis11 6389]$ ps -ef | grep redis-server
redis      7597      1  0 14:56 ?        00:00:12 redis-server 192.168.42.11:6379
redis     61246      1  0 16:43 ?        00:00:00 redis-server 192.168.42.11:6389
redis     61252      1  0 16:43 ?        00:00:00 redis-server 192.168.42.11:6399
redis     61278  61147  0 16:44 pts/4    00:00:00 grep --color=auto redis-server
[redis@redis11 6389]$ 
[redis@redis11 6389]$ 
[redis@redis11 6389]$ redis-cli -h 192.168.42.11 -a passwd -p 6389 info server |grep redis_version
Warning: Using a password with '-a' or '-u' option on the command line interface may not be safe.
redis_version:7.0.5
[redis@redis11 6389]$ redis-cli -h 192.168.42.11 -a passwd -p 6399 info server |grep redis_version
Warning: Using a password with '-a' or '-u' option on the command line interface may not be safe.
redis_version:7.0.5
[redis@redis11 6389]$ 
```


# 一主两从
## 编译安装与前面单实例相同
## 配置环境变量
```bash
su - redis
echo "export PATH=/redis/app/bin:$PATH " >> ~/.bash_profile
. ~/.bash_profile
```

## master
```bash
cat > /redis/data/redis.conf << EOF

bind 192.168.42.11

port 16379

logfile "/redis/log/redis.log"

pidfile /redis/data/redis.pid

dir /redis/data

maxclients 10000

daemonize yes

timeout 300

requirepass passwd

masterauth passwd

maxmemory 512MB

min-slaves-to-write 1

min-slaves-max-lag 15

appendonly yes

appendfilename "appendonly-16379.aof"

appendfsync everysec

no-appendfsync-on-rewrite yes

auto-aof-rewrite-percentage 100

auto-aof-rewrite-min-size 1024mb

EOF
```
## slave1
```bash
cat > /redis/data/redis.conf << EOF

bind 192.168.42.12

port 16379

slaveof 192.168.42.11 16379

logfile "/redis/log/redis.log"

pidfile /redis/data/redis.pid

timeout 300

dir /redis/data

maxclients 10000

daemonize yes

requirepass passwd

masterauth passwd

slave-read-only yes

maxmemory 512MB

appendonly yes

appendfilename "appendonly-16379.aof"

appendfsync everysec

no-appendfsync-on-rewrite yes

auto-aof-rewrite-percentage 100

auto-aof-rewrite-min-size 1024mb

EOF
```

## slave2
```bash
cat > /redis/data/redis.conf << EOF

bind 192.168.42.13

port 16379

slaveof 192.168.42.11 16379

logfile "/redis/log/redis.log"

pidfile /redis/data/redis.pid

timeout 300

dir /redis/data

maxclients 10000

daemonize yes

requirepass passwd

masterauth passwd

slave-read-only yes

maxmemory 512MB

appendonly yes

appendfilename "appendonly-16379.aof"

appendfsync everysec

no-appendfsync-on-rewrite yes

auto-aof-rewrite-percentage 100

auto-aof-rewrite-min-size 1024mb

EOF
```

## 启动
```bash
* master
redis-server /redis/data/redis.conf

* slave1
redis-server /redis/data/redis.conf


* slave2
redis-server /redis/data/redis.conf
```

## 连接
```bash
* master
redis-cli -h 192.168.42.11 -p 16379 -a passwd 

# Replication
role:master
connected_slaves:2
min_slaves_good_slaves:2
slave0:ip=192.168.42.12,port=16379,state=online,offset=238,lag=1
slave1:ip=192.168.42.13,port=16379,state=online,offset=238,lag=0
master_failover_state:no-failover
master_replid:9edce6f216f479fa9bfd175e9e2e94ce87a75523
master_replid2:0000000000000000000000000000000000000000
master_repl_offset:238
second_repl_offset:-1
repl_backlog_active:1


* slave1
# Replication
role:slave
master_host:192.168.42.11
master_port:16379
master_link_status:up
master_last_io_seconds_ago:6
master_sync_in_progress:0
slave_read_repl_offset:224
slave_repl_offset:224
slave_priority:100
slave_read_only:1
replica_announced:1


* slave2
# Replication
role:slave
master_host:192.168.42.11
master_port:16379
master_link_status:up
master_last_io_seconds_ago:4
master_sync_in_progress:0
slave_read_repl_offset:252
slave_repl_offset:252
slave_priority:100
slave_read_only:1
replica_announced:1
connected_slaves:0
master_failover_state:no-failover
```

## 测试读写

* master
```bash
192.168.42.11:16379> set name lxm
OK
192.168.42.11:16379> get name
"lxm"
```
```
* slave1
```bash
192.168.42.12:16379> get name
"lxm"
192.168.42.12:16379> set name2 lxm2
(error) READONLY You can't write against a read only replica.
192.168.42.12:16379> 
```

* slave2
```bash
192.168.42.13:16379> get name
"lxm"
192.168.42.13:16379> 
```

# 一主两从 + 哨兵





# 日常维护

## 数据类型之字符串

```bash
192.168.42.10:6379> set name1 lxm1
OK
192.168.42.10:6379> set name2 lxm2
OK
192.168.42.10:6379> mget name1 name2  # 批量获取
1) "lxm1"
2) "lxm2"
192.168.42.10:6379> 
192.168.42.10:6379> get name1
"lxm1"
192.168.42.10:6379> 
192.168.42.10:6379> expire name1 2
(integer) 1
192.168.42.10:6379> get name1
"lxm1"
192.168.42.10:6379> get name1
(nil)
192.168.42.10:6379> 
192.168.42.10:6379> set user:id:01:name lxm01
OK
192.168.42.10:6379> get user:id:01:name
"lxm01"
192.168.42.10:6379> del  user:id:01:name
(integer) 1
192.168.42.10:6379> get user:id:01:name
(nil)
192.168.42.10:6379> 
192.168.42.10:6379> set user:id:01:name lxm01
OK
192.168.42.10:6379> strlen user:id:01:name
(integer) 5
192.168.42.10:6379> get user:id:01:name 
"lxm01"

192.168.42.10:6379> 
192.168.42.10:6379> set name1 "hello world hello wworld hello world hello world hello world"
OK
192.168.42.10:6379> object encoding name1
"raw"
192.168.42.10:6379> 
192.168.42.10:6379> set name2 "hello world"
OK
192.168.42.10:6379> object encoding name2
"embstr"
192.168.42.10:6379> 
192.168.42.10:6379> expire name2 60
(integer) 1
192.168.42.10:6379> ttl name2
(integer) 58
192.168.42.10:6379> PERSIST name2   # 设置永不过期
(integer) 1
192.168.42.10:6379> PERSIST name2
(integer) 0
192.168.42.10:6379> ttl name2
(integer) -1

192.168.42.10:6379> get name2
"hello world"
192.168.42.10:6379> ttl name2
(integer) -1
192.168.42.10:6379> rename name2 nm2
OK
192.168.42.10:6379> get nm2
"hello world"
192.168.42.10:6379> get name2
(nil)
192.168.42.10:6379> rename nm2 name2
OK
192.168.42.10:6379> get name2
"hello world"
192.168.42.10:6379> 

192.168.42.10:6379> get name
(nil)
192.168.42.10:6379> set name lxm
OK
192.168.42.10:6379> get name
"lxm"
192.168.42.10:6379> append name 001
(integer) 6
192.168.42.10:6379> get name
"lxm001"
192.168.42.10:6379> 
192.168.42.10:6379> del name
(integer) 1
192.168.42.10:6379> mset name1 lxm1 name2 lxm2
OK
192.168.42.10:6379> mget name1 name2
1) "lxm1"
2) "lxm2"
```



## 配置文件

```bash
192.168.42.10:6379> config get *  # 获取所有配置参数
192.168.42.10:6379> config get log* # 获取 log 开头的配置参数
1) "logfile"
2) "/redis/log/6379/redis.log"
3) "loglevel"
4) "notice"
192.168.42.10
```

## 持久化

![image-20231006190446465](/images/image-20231006190446465.png)

## 备份与恢复

你好<mark style="background: #FF5582A6;">赛飞赛发</mark>

