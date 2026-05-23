---
title: "查看进程内存占用"
date: 2023-07-14
description: "```bash"
categories: ["安装部署"]
tags: ["内存管理", "安装部署"]
series: []
---

```bash
yum -y install smem
或者直接下载
wget https://gh.api.99988866.xyz/https://github.com/kwkroeger/smem/archive/refs/tags/v1.6.tar.gz
smem -tku  # 看用户级别内存占用
smem -tkw   # 看系统内核与非内核内存占用
smem -tkU postgres用户 # 看指定用户内存占用
```
> 参考: 
> [(3条消息) Linux 环境查看进程或者用户使用内存情况_岳麓丹枫001的博客-CSDN博客](https://blog.csdn.net/yueludanfeng/article/details/123075344?ops_request_misc=&request_id=565607a0decb4676aa37ac8d9a0d9700&biz_id=&utm_medium=distribute.pc_search_result.none-task-blog-2~blog~koosearch~default-1-123075344-null-null.268^v1^control&utm_term=smem&spm=1018.2226.3001.4450)


