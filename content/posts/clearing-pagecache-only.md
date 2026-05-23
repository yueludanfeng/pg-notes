---
title: "Clearing Pagecache Only"
date: 2024-01-28
description: "```bash"
categories: ["PostgreSQL 笔记"]
tags: ["PostgreSQL"]
series: []
---

[How to Clear Ram Memory Cache, Swap Space, and Buffer on Linux Systems? - Scaler Topics](https://www.scaler.com/topics/how-to-clear-cache-in-linux/)

# Clearing Pagecache Only
```bash
sync; echo 1 > /proc/sys/vm/drop_caches
```

# Clearing Inodes and Dentries
```bash
sync; echo 2 > /proc/sys/vm/drop_caches'
```

```bash
Dentries (short for “directory entries”) cache stores information about the directory structure, while the inodes cache stores metadata about files, such as file permissions, ownership, and size. These caches help speed up file system operations and reduce the overhead associated with frequent file access. Clearing the dentries and inodes caches can help resolve file system-related issues and improve system performance.
```
# Clearing Inodes, Dentries, and Pagecaches
```bash
sync; echo 3 > /proc/sys/vm/drop_caches
```

参考: [How to Clear Linux Cache (Memory, Swap and Buffer) (tecadmin.net)](https://tecadmin.net/clear-linux-cache/)
