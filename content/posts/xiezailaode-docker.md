---
title: "卸载老的 docker"
date: 2026-04-15
description: "```bash"
categories: ["索引"]
tags: ["Docker", "参数配置", "安装部署"]
series: []
---

```bash
yum remove -y docker \
              docker-client \
              docker-client-latest \
              docker-common \
              docker-latest \
              docker-latest-logrotate \
              docker-logrotate \
              docker-engine
```
# 安装依赖工具
```bash
yum remove -y docker \
              docker-client \
              docker-client-latest \
              docker-common \
              docker-latest \
              docker-latest-logrotate \
              docker-logrotate \
              docker-engine
```
# 配置官方镜像
```bash
yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
```