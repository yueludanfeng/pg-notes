---
title: "申请服务器"
date: 2023-08-14
description: "* 创建以下必需目录。"
categories: ["PostgreSQL 笔记"]
tags: ["Docker", "WAL", "参数配置", "安装部署", "监控"]
series: []
---

[centos7安装zabbix5.0LTS教程_install zabbix repository_——永远少年的博客-CSDN博客](https://blog.csdn.net/qq_58702517/article/details/124880176?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522169200472516800211521848%2522%252C%2522scm%2522%253A%252220140713.130102334..%2522%257D&request_id=169200472516800211521848&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~blog~sobaiduend~default-2-124880176-null-null.268^v1^control&utm_term=centos7%20%E5%AE%89%E8%A3%85%20zabbix5&spm=1018.2226.3001.4450)



* 创建以下必需目录。
mkdir /usr/local/etc/zabbix_agentd. conf. d -p
mkdir /var/lib/zabbix -p


setenforce 0
sed -ri '/^SELINUX=/cSELINUX=disabled' /etc/sysconfig/selinux 
systemctl stop firewalld ; systemctl disable firewalld



# 申请服务器
docker run -d --name zabbix_test -h zabbix_test -p 6281:22 -p 6282:3306 -p 6283:5432 -p 6284:23389 -p 6285:80 -p 6286:10051 --net=my_network --ip=192.168.1.78 --privileged=true mysql01:1.0 /usr/sbin/init

# 进入服务器
docker exec -it zabbix_test bash

# 卸载 mariadb
rpm -qa |grep maria | xargs -I {} rpm -e {}

# 安装 zabbix 相关组件
rpm -Uvh https://repo.zabbix.com/zabbix/5.0/rhel/7/x86_64/zabbix-release-5.0-1.el7.noarch.rpm 
yum clean all
yum -y install zabbix-server-mysql zabbix-agent  # 实际测试, 发现安装之后有文件确实, 解决方法是先下载到本地, 再手工 rpm -Uvh 安装 zabbix-server-mysqlxxx. rpm 包
yum -y install centos-release-scl
yum -y install zabbix-web-mysql-scl zabbix-apache-conf-scl


# 下载 MySQL yum 源
wget https://dev.mysql.com/get/mysql80-community-release-el7-6.noarch.rpm

rpm -Uvh *rpm

yum repolist all | grep mysql


注：这里显示 8.0 是开启的 5.7 是关闭的所以要去关掉 8.0 开启 5.7 的 yum 源。 
7.3、安装 5.7 要去 zabbix 的 yum 源里面关闭掉 8.0的源
vi /etc/yum. repos. d/mysql-community. repo

yum repolist all | grep mysql

# 安装 MySQL
yum -y install mysql-community-server

* MySQL 启停
systemctl start mysqld
systemctl status mysqld
systemctl stop mysqld
systemctl restart mysqld
systemctl status mysqld

* 连接 MySQL 创建用户
[ root@zabbix_test core 5]# grep temp /data/mysql 3306/data/zabbix_test. err
2023-08-14 T09:29:26.620297 Z 0 [Note] InnoDB: Removed temporary tablespace data file: "ibtmp 1"
2023-08-14 T09:29:26.620314 Z 0 [Note] InnoDB: Creating shared tablespace for temporary tables

mysql -u root -p 
create database zabbix character set utf 8 collate utf 8_bin;
create user zabbix@localhost identified by 'password';
grant all privileges on zabbix.* to zabbix@localhost ; 
quit;


* 导入表结构
zcat /usr/share/doc/zabbix-server-mysql*/create. sql. gz | /usr/local/mysql/bin/mysql -uzabbix -p zabbix

zcat /usr/share/doc/zabbix-server-mysql*/create. sql. gz

如果此处发现没有这个 create. sql. gz 文件,  可以先手动下载 zabbix-server-mysql rpm 包, 然后再 yum install zabbix-server-mysql

* 修改 zabbix 相关配置
```bash
vim /etc/zabbix/zabbix_agentd.conf
Server=192.168.1.78 #被动模式下必填，将zabbix-server端的ip填入
Hostname=192.168.1.78_5432
ServerActive = 
```



vi /etc/zabbix/zabbix_server. conf
DBPassword=password

vi  /etc/opt/rh/rh-php 72/php-fpm. d/zabbix. conf
; php_value[date. timezone] = Europe/Riga
换成亚洲上海
php_value[date. timezone] = Asia/Shanghai


* 重启服务
systemctl status zabbix-server zabbix-agent httpd rh-php 72-php-fpm
systemctl restart zabbix-server zabbix-agent httpd rh-php 72-php-fpm
systemctl status zabbix-server zabbix-agent httpd rh-php 72-php-fpm



# 登录 zabbix
http: ip/zabbix  --> http: ip/zabbix

http://1.15.141.249:6285/zabbix
用户名：Admin
密码：zabbix

http://1.15.141.249:6285/zabbix/setup.php


![](/images/Pasted%20image%2020230814190554.png)

![](/images/Pasted%20image%2020230814190629.png)


![](/images/Pasted%20image%2020230814190643.png)


![](/images/Pasted%20image%2020230814190703.png)
**默认账号如下:** 
用户名：Admin
密码：zabbix



# 安装模板文件
```bash
mkdir -p /var/lib/zabbix/

git clone https://git.zabbix.com/projects/ZBX/repos/zabbix/browse/templates/db/postgresql
cd zabbixxx/template/postgresql
cp -r postgresql/ /var/lib/zabbix/
cp -r template_db_postgresql.conf  /etc/zabbix/zabbix_agentd.d/
重启zabbix agent 主机。
```

# 配置免密
```bash
mkdir -p /var/lib/zabbix
echo "*:*:*:pgsql: passwd" > /var/lib/zabbix/.pgpass
chmod 0600 /var/lib/zabbix/.pgpass
chown zabbix:zabbix /var/lib/zabbix/.pgpass
```

# 配置
Configuration--> Hosts --> 

![](/images/Pasted%20image%2020230814194248.png)


![](/images/Pasted%20image%2020230814194504.png)

