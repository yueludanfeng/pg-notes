---
title: "zabbix 服务器对应的主机"
date: 2023-08-15
description: "```bash"
categories: ["监控"]
tags: ["Docker", "WAL", "参数配置", "安装部署", "监控"]
series: []
---

# zabbix 服务器对应的主机
```bash
docker rm -f lxmzabbix5_2
docker run -d --name lxmzabbix5_2 -h lxmzabbix5_2     -p 6293:22 -p 6294:3306 -p 6295:80 -p 6296:10051     -v /sys/fs/cgroup:/sys/fs/cgroup     --privileged=true     lxm_centos76:1.0 /usr/sbin/init
docker exec -it lxmzabbix5_2 bash
[内网IP]

yum -y install wget
rm -rf /etc/yum.repos.d/* 
```
# 关闭防火墙
```bash
setenforce 0 
sed -i "/^SELINUX=/s #enforcing #disabled #" /etc/selinux/config 
cat /etc/selinux/config

systemctl stop firewalld 
systemctl disable firewalld 
systemctl status firewalld

```

# 安装 httpd 等组件
```bash

yum install -y httpd
systemctl enable httpd 
systemctl start httpd 
systemctl status httpd

rpm -Uvh https://mirrors.aliyun.com/zabbix/zabbix/5.0/rhel/7/x86_64/zabbix-release-5.0-1.el7.noarch.rpm
yum install centos-release-scl -y
yum install -y zabbix-server-mysql zabbix-web-mysql-scl zabbix-apache-conf-scl zabbix-agent
```


# 安装配置 MySQL

```bash
yum install -y mariadb-server

systemctl status mariadb 
systemctl enable mariadb 
systemctl start  mariadb 
systemctl status mariadb 
systemctl stop   mariadb
systemctl status mariadb 
systemctl restart  mariadb 
systemctl status mariadb 


mysql_secure_installation
root 密码设置为 passwd


create database zabbix character set utf 8 collate utf 8_bin; 
create user zabbix@localhost identified by '123'; 
grant all privileges on zabbix.* to zabbix@localhost ; 
flush privileges; 
quit;
```

# 修改 zabbix_server. conf 配置文件
```bash
vim /etc/zabbix/zabbix_server.conf
DBHost=localhost 
DBName=zabbix 
DBUser=zabbix 
DBPassword=[已隐藏] 
### 查看修改是否成功 grep '^DB' /etc/zabbix/zabbix_server.conf


vim /etc/opt/rh/rh-php 72/php-fpm.d/zabbix.conf 
### 最后一行改成 
php_value[date.timezone] = Asia/Shanghai 
### 重启生效 
systemctl restart httpd



systemctl restart zabbix-server httpd rh-php 72-php-fpm zabbix-agent 
systemctl start zabbix-server httpd rh-php 72-php-fpm zabbix-agent 
systemctl enable zabbix-server httpd rh-php 72-php-fpm zabbix-agent 
systemctl status zabbix-server httpd rh-php 72-php-fpm zabbix-agent 
systemctl stop zabbix-server httpd rh-php 72-php-fpm zabbix-agent

netstat -lntup
```

# 申请 MySQL 服务器对应的主机
```bash

docker rm -f mysql
docker run -d --name mysql -h mysql     -p 6393:22 -p 6394:3306 -p 6395:80 -p 6396:10051     -v /sys/fs/cgroup:/sys/fs/cgroup     --privileged=true     lxm_centos76:1.0 /usr/sbin/init
docker exec -it mysql bash
[内网IP] 
```

# 安装配置 zabbix-agent
```bash

cd /etc/yum.repos.d
mkdir bak
mv *repo bak
mv bak /

rpm -Uvh https://mirrors.aliyun.com/zabbix/zabbix/5.0/rhel/7/x86_64/zabbix-release-5.0-1.el7.noarch.rpm
# yum install centos-release-scl -y
# 注意如果直接通过  yum 安装, /usr/share/doc/zabbix-agent-5.0.36/userparameter_mysql.conf 等文件不会生成, 
# 所以建议先下载 rpm 包, 然后手动安装 rpm , 则会生成这些文件
yum install --downloadonly --downloaddir=. zabbix-agent
rpm -ivh zabbix-agent-5.0.36-1.el7.x86_64.rpm
systemctl restart zabbix-agent
systemctl enable zabbix-agent
systemctl status zabbix-agent

cat /etc/zabbix/zabbix_agentd.conf|grep '^[Host|Server]'

vi /etc/zabbix/zabbix_agentd.conf
修改为:
Server=[内网IP]
Hostname=[内网IP]

systemctl restart zabbix-agent
systemctl enable zabbix-agent
systemctl status zabbix-agent

# 检查
cat /etc/zabbix/zabbix_agentd.conf|grep '^[Host|Server]'
```

# 监控 MySQL
```bash
cp /usr/share/doc/zabbix-agent-5.0.36/userparameter_mysql.conf  /etc/zabbix/zabbix_agentd.d/
chown -R zabbix:zabbix /etc/zabbix/zabbix_agentd.d/userparameter_mysql.conf
```

## 安装 MySQL
* 安装 MySQL,  参考: [MySQL 安装](MySQL%20安装.md)  root 密码设置为 lxm

* 修改 MySQL 访问配置文件
```bash
mkdir -p /var/lib/zabbix

vi /var/lib/zabbix/.my.cnf
[mysql]
host=localhost
user=root
password=[已隐藏]
socket=/data/mysql3306/tmp/mysql.sock

[mysqladmin]
host=localhost
user=root
password=[已隐藏]
socket=/data/mysql3306/tmp/mysql.sock
```

```bash
创建用户
create database zabbix character set utf 8 collate utf 8_bin; 
create user zabbix_monitor@localhost identified by '123'; 
grant all privileges on zabbix.* to zabbix_monitor@localhost ; 
flush privileges; 
```


# 登录 zabbix web 服务, 新增一个 host 用户监控主机与 MySQL
```bash

http://1.15.141.249:6295/zabbix
默认账号:
Admin/zabbix
```

![](/images/Pasted%20image%2020230815163512.png)

![](/images/Pasted%20image%2020230815180902.png)

![](/images/Pasted%20image%2020230815180940.png)


# 监控 PG
* 修改配置文件用于访问 PG
```bash
mkdir -p /var/lib/zabbix
echo 'hostname:port:database:username:password' > /var/lib/zabbix/.pgpass
echo "*:*:*:postgres:passwd" >> /var/lib/zabbix/.pgpass 
chmod 0600 /var/lib/zabbix/.pgpass
chown zabbix:zabbix /var/lib/zabbix/.pgpass


ln -s /usr/local/pgsql/bin/psql /usr/bin/psql
```

* 下载并替换 agent 脚本
```bash
-- 下载监控模板
https://git.zabbix.com/projects/ZBX/repos/zabbix/browse/templates/db/postgresql

-- 或者找github: 
https://github.com/zabbix/zabbix/tags


mkdir -p /var/lib/zabbix/
cp -r postgresql/postgresql/ /var/lib/zabbix/
cp -r postgresql/template_db_postgresql.conf /etc/zabbix/zabbix_agentd.d/

```

* 重启 zabbix-agent
```bash
systemctl status zabbix-agent
systemctl restart zabbix-agent
systemctl status zabbix-agent

```

* 新增一个 HOST 用于监控 PG
![](/images/Pasted%20image%2020230815180624.png)

![](/images/Pasted%20image%2020230815180632.png)

![](/images/Pasted%20image%2020230815180638.png)


![](/images/Pasted%20image%2020230815181010.png)

![](/images/Pasted%20image%2020230815181027.png)

![](/images/Pasted%20image%2020230815181048.png)

