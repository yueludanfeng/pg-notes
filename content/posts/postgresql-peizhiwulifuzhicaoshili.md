---
title: "postgresql 配置物理复制槽示例"
date: 2023-06-27
description: "以下是一个示例，演示如何在 PostgreSQL 中配置物理复制槽："
categories: ["PostgreSQL 笔记"]
tags: ["PostgreSQL", "WAL", "参数配置", "备份恢复", "复制槽", "流复制"]
series: []
---

以下是一个示例，演示如何在 PostgreSQL 中配置物理复制槽：

1. 首先，确保你的 PostgreSQL 版本是 9.4 或更高版本，因为物理复制槽功能在 9.4 版本中引入。

2. 打开你的主服务器的 PostgreSQL 配置文件（通常是 `postgresql.conf`），并确保以下设置已启用：

   ```
   wal_level = replica
   max_wal_senders = 10
   wal_keep_segments = 32
   ```

   `wal_level` 设置为 `replica` 以启用归档日志复制。

   `max_wal_senders` 设置为允许的最大归档发送者的数量。

   `wal_keep_segments` 设置为保留的 WAL 段数。这将影响从备份服务器拉取 WAL 日志的时间范围。

   修改完配置文件后，重新启动 PostgreSQL 服务。

3. 在主服务器上创建一个复制槽。打开主服务器的 PostgreSQL 控制台或使用 `psql` 命令行工具，并执行以下命令：

   ```sql
   SELECT * FROM pg_create_physical_replication_slot('replication_slot_name');
   ```

   这将创建一个名为 `replication_slot_name` 的物理复制槽。你可以将其替换为你自己的槽名称。

4. 在备份服务器上的 PostgreSQL 配置文件中，添加以下设置：

   ```
   primary_conninfo = 'host=主服务器IP地址 port=主服务器端口 user=复制用户名称 password=复制用户密码 application_name=备份服务器名称'
   primary_slot_name = 'replication_slot_name'
   ```

   修改上述设置中的值以匹配你的主服务器和复制槽的信息。

5. 保存并关闭备份服务器上的配置文件，并重新启动 PostgreSQL 服务。

6. 在备份服务器上的 PostgreSQL 控制台或使用 `psql` 命令行工具，执行以下命令来启动物理复制：

   ```sql
   SELECT pg_start_replication('replication_slot_name');
   ```

   这将启动与主服务器的物理复制连接，并将 WAL 日志传输到备份服务器。

现在，你已成功配置了 PostgreSQL 中的物理复制槽。主服务器将持续发送 WAL 日志到备份服务器，以保持备份服务器与主服务器的数据同步。

