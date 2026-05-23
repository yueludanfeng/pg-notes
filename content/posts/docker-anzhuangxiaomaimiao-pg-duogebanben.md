---
title: "Docker 安装小麦苗 PG (多个版本)"
date: 2023-09-17
description: "```bash"
categories: ["安装部署"]
tags: ["Docker", "安装部署"]
series: []
---

[使用源码编译来安装PostgreSQL数据库（从PG9.4到PG16各个版本通用） (qq.com)](https://mp.weixin.qq.com/s/nqee3Sy3B4H-JHnQRmGaYQ)


```bash
docker rm -f lhrpgall

docker run -itd --name lhrpgall -h lhrpgall \
-p 25432-25445:5432-5445 -p 122:22 -p 189:3389 \
-v /sys/fs/cgroup:/sys/fs/cgroup \
--restart=always \
--privileged=true lhrbest/lhrpgall:3.0 \
/usr/sbin/init

docker exec -it lhrpgall bash


systemctl status pg94 pg96 pg10 pg11 pg12 pg13 pg14 pg15
systemctl status postgresql-13.service
```