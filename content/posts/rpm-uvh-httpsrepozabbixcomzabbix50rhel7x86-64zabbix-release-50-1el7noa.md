---
title: "rpm -Uvh https://repo.zabbix.com/zabbix/5.0/rhel/7/x86_64/zabbix-release-5.0-1.el7.noarch.rpm"
date: 2023-08-14
description: "> **参考:**"
categories: ["监控"]
tags: ["WAL", "参数配置", "安装部署", "监控"]
series: []
---

> **参考:** 
>
> [Zabbix 5.0 监控 PostgreSQL 数据库 | canghai (cactifans.com)](https://blog.cactifans.com/2020/07/18/Zabbix-5.0-监控-PostgreSQL-数据库/)
>
> [云原生丨手把手教你使用zabbix监控postgresql数据库（超详细讲解）！ - 墨天轮 (modb.pro)](https://www.modb.pro/db/605238)
>
> 

 # zabbix

* 简介

```bash
zabbix是一个基于WEB界面的提供分布式系统监视以及网络监视功能的企业级的开源解决方案。
zabbix能监视各种网络参数，保证服务器系统的安全运营；并提供灵活的通知机制以让系统管理员快速定位/解决存在的各种问题。
zabbix由两部分构成，zabbix server与可选组件zabbix agent。
zabbix server，可以通过SNMP，zabbix agent，ping，端口监视等方法提供对远程服务器/网络状态的监视，数据收集等功能，它可以运行在Linux，Solaris，HP-UX，AIX，Free BSD，Open BSD，OS X等平台上。
```

![](/images/modb_20230106_cc6f55ca-8db3-11ed-b060-fa163eb4f6be.png)

* 安装依赖

```
yum install -y postgresql-devel mysql-devel libcurl libevent libevent-devel fping curl-devel libxml2  libxml2-devel snmpd net-snmp-devel net-snmp
```

* 下载:

https://www.zabbix.com/cn/download

![image-20230814140552401](/images/image-20230814140552401.png)





1. ##### a. Install Zabbix repository

   [产品手册](https://www.zabbix.com/documentation/5.0/manual/installation/install_from_packages)

```
# rpm -Uvh https://repo.zabbix.com/zabbix/5.0/rhel/7/x86_64/zabbix-release-5.0-1.el7.noarch.rpm
# yum clean all
```

   ##### b. 安装Zabbix server，Web前端，agent

```bash
yum install -y zabbix-server-pgsql zabbix-agent
```

   ##### c. Install Zabbix frontend

   Enable Red Hat Software Collections

  ````
  yum install -y centos-release-scl
  ````



   编辑配置文件 /etc/yum.repos.d/zabbix.repo and enable zabbix-frontend repository.

```
[zabbix-frontend]
...
enabled=1
...
```

   Install Zabbix frontend packages.

```bash
yum install zabbix-web-pgsql-scl zabbix-apache-conf-scl
```



   ##### d. 创建初始数据库

   [产品手册](https://www.zabbix.com/documentation/5.0/manual/appendix/install/db_scripts)

   Make sure you have database server up and running.

   在数据库主机上运行以下代码。

```bash
createuser --pwprompt zabbix
createdb -O zabbix zabbix
```



   导入初始架构和数据，系统将提示您输入新创建的密码。

   `# zcat /usr/share/doc/zabbix-server-pgsql*/create.sql.gz | sudo -u zabbix psql zabbix`

   ##### e. 为Zabbix server配置数据库

   编辑配置文件 /etc/zabbix/zabbix_server.conf

   `DBPassword=password`

   ##### f. 为Zabbix前端配置PHP

   编辑配置文件 /etc/opt/rh/rh-php72/php-fpm.d/zabbix.conf uncomment and set the right timezone for you.

   `; php_value[date.timezone] = Europe/Riga`

   ##### g. 启动Zabbix server和agent进程

   启动Zabbix server和agent进程，并为它们设置开机自启：

   `# systemctl restart zabbix-server zabbix-agent httpd rh-php72-php-fpm# systemctl enable zabbix-server zabbix-agent httpd rh-php72-php-fpm`

   





# PG 服务配置

* 建用户

```sql
CREATE USER zbx_monitor WITH PASSWORD 'zabbix_monitor123456' INHERIT;
GRANT pg_monitor TO zbx_monitor;
```

* 如果是 9.6 及以下

```sql
CREATE USER zbx_monitor WITH PASSWORD 'zbx_monitorpwd123';
GRANT SELECT ON pg_stat_database TO zbx_monitor;
ALTER USER zbx_monitor WITH SUPERUSER;
```



* 修改配置

```bash
host all zbx_monitor 127.0.0.1/32 trust
host all zbx_monitor 0.0.0.0/0 md5
host all zbx_monitor ::0/0 md5
```

  

>  如果 Zabbix agent 和 PostgreSQL 在不同机器，需要配置密码文件，需要创建.pgpass 文件，并存放在 zabbix 用户的家目录下，内容如下：

```
<REMOTE_HOST1>:5432:postgres:zbx_monitor:<PASSWORD>
```

配置好之后记得重启 PostgreSQL 服务

* 测试连接 PG

```
psql -U zbx_monitor 
```



# Zabbix 配置

* 下载安装

```bash
wget https://cdn.zabbix.com/zabbix/sources/stable/4.0/zabbix-4.0.47.tar.gz
tar xf zabbix-4.0.47.tar.gz
cd zabbix-4.0.47
./configure --enable-agent
make 
make install
```

> 如果报错, 可能缺少依赖
>
> yum install -y postgresql-devel mysql-devel libcurl libevent libevent-devel fping curl-devel libxml2  libxml2-devel snmpd net-snmp-devel net-snmp

* 修改 zabbix_agent.conf 配置文件 /usr/local/etc/zabbix_agentd.conf

  * 修改之前

    ```
    LogFile=/tmp/zabbix_agentd.log
    Server=127.0.0.1
    ServerActive=127.0.0.1
    Hostname=Zabbix server
    ```

  * 修改之后

    ```
    LogFile=/tmp/zabbix_agentd.log
    Server=127.0.0.1
    ServerActive=127.0.0.1
    Hostname=Zabbix server
    ```

* 创建以下必需目录。
  ```bash
  mkdir /usr/local/etc/zabbix_agentd.conf.d -p
  mkdir /var/lib/zabbix -p
  ```

* 拷贝配置文件与对应目录
  
  ```
  cp zabbix/templates/db/postgresql/tempate_db_postgresql.conf /usr/local/etc/zabbix_agentd.conf.d
  cp -R zabbix/templates/db/postgresql/postgresql /var/lib/zabbix
  ```
  
  

> 对应主机关联系统自带的 Template DB PostgreSQL 模版，配置如下主机宏：

|                                |             |      |
| :----------------------------: | :---------: | :--: |
|               宏               |     值      | 描述 |
| {$PG.CHECKPOINTS_REQ.MAX.WARN} |      5      |      |
|            {$PG.DB}            |  postgres   |      |
|           {$PG.HOST}           |  127.0.0.1  |      |
|    {$PG.LLD.FILTER.DBNAME}     |    (.*)     |      |
|           {$PG.PORT}           |    5432     |      |
|           {$PG.USER}           | zbx_monitor |      |

# Zabbix-agent 配置

```
[root@svvl-p136 packages]# mkdir -p /var/lib/zabbix/
[root@svvl-p136 packages]# wget https://www.ponfey.com/files/.../.../.../zabbix-monitor/packages/postgresql.tar.gz # 获取PostgreSQL脚本文件，系自建文件服务器，不对外
[root@svvl-p136 packages]# tar zxvf postgresql.tar.gz 
[root@svvl-p136 packages]# cp -r postgresql/postgresql/ /var/lib/zabbix/
[root@svvl-p136 packages]# cp -r postgresql/template_db_postgresql.conf /etc/zabbix/zabbix_agentd.d/ # 添加 UserParameter 文件到 Agent 的 zabbix_agentd.d 目录k
```



# 
