---
title: "yum install zabbix-web-pgsql-scl zabbix-apache-conf-scl"
date: 2023-08-14
description: "```bash"
categories: ["PostgreSQL 笔记"]
tags: ["Docker", "WAL", "参数配置", "安装部署", "监控"]
series: []
---

```bash
docker rm -f zabbix5
docker run -d --name zabbix5 -h zabbix5 \
  -p 225:22 -p 23306:3306 -p 2800:80 -p 20051:10051 -p 20052:5432 \
  -v /sys/fs/cgroup:/sys/fs/cgroup \
  --net=my_network --ip=192.168.1.77 \
  --privileged=true \
  lxm_centos76:1.0 /usr/sbin/init
docker exec -it zabbix5 bash


setenforce 0
sed -ri '/^SELINUX=/cSELINUX=disabled' /etc/sysconfig/selinux 
systemctl stop firewalld ; systemctl disable firewalld


添加 源
https://www.zabbix.com/cn/download?zabbix=5.0&os_distribution=centos&os_version=7&db=mysql&ws=apache

rpm -Uvh https://repo.zabbix.com/zabbix/5.0/rhel/7/x86_64/zabbix-release-5.0-1.el7.noarch.rpm  
yum clean all
yum -y install zabbix-server-pgsql zabbix-agent
yum -y install centos-release-scl
编辑配置文件 /etc/yum.repos.d/zabbix.repo and enable zabbix-frontend repository.
[zabbix-frontend]  
...  
enabled=1  
...
# yum install zabbix-web-pgsql-scl zabbix-apache-conf-scl




cat > /zabbix_aliyun.sh <<"EOF"

#!/bin/bash

echo -e "请给出要安装的zabbix版本号  \033[31musage：./zabbix_aliyun.sh 4.0|4.4|4.5|5.0 \033[0m"

echo "例如要安装5.0版本，则使用命令： sh zabbix_aliyun.sh 5.0"

if [ -z $1 ];then

    exit

fi

VERSION=$1

if [ -f /etc/yum.repos.d/zabbix.repo ];then

    rm -rf /etc/repos.d/zabbix.repo

fi

rpm -qa | grep zabbix-release && rpm -e zabbix-release

rpm -Uvh https://mirrors.aliyun.com/zabbix/zabbix/$VERSION/rhel/7/x86_64/zabbix-release-$VERSION-1.el7.noarch.rpm

sed -i "s@zabbix/.*/rhel@zabbix/$VERSION/rhel@g" /etc/yum.repos.d/zabbix.repo

sed -i 's@repo.zabbix.com@mirrors.aliyun.com/zabbix@g' /etc/yum.repos.d/zabbix.repo

[ $? -eq 0 ] && echo "阿里云的zabbix源替换成功" || exit 1

yum clean all

yum makecache fast

EOF

chmod +x /zabbix_aliyun.sh
```