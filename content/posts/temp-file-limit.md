---
title: "temp_file_limit"
date: 2024-01-27
description: "`temp_file_limit` 是 PostgreSQL 中的一个配置参数，用于限制临时文件的大小。这个参数指定了在执行排序、合并或其他需要使用临时文件的操作时，每个查询可以使用的最大临时文件大小。如果查询尝试使用超过这个限制的临时空间"
categories: ["PostgreSQL 笔记"]
tags: ["参数配置"]
series: []
---

# temp_file_limit


`temp_file_limit` 是 PostgreSQL 中的一个配置参数，用于限制临时文件的大小。这个参数指定了在执行排序、合并或其他需要使用临时文件的操作时，每个查询可以使用的最大临时文件大小。如果查询尝试使用超过这个限制的临时空间，PostgreSQL 将抛出一个错误。

要设置 `temp_file_limit`，可以在 PostgreSQL 的配置文件中进行配置，通常是 `postgresql.conf` 文件。在配置文件中找到并修改 `temp_file_limit` 的值，以满足你的需求。请确保重启 PostgreSQL 以使更改生效。

请注意，设置合理的 `temp_file_limit` 值对于数据库性能和系统资源的有效管理非常重要，特别是在处理大型数据集时。

# log_temp_files
**Log the use of temporary files larger than this number of kilobytes**

控制记录临时文件名和尺寸。临时文件可以被创建用来排序、哈希和存储临时查询结果。 如果启用这个设置，当每一个临时文件被删除时都会产生一个日志项。 一个零值记录所有临时文件信息，而正值只记录尺寸大于或等于指定数据量的文件。如果指定值时没有单位，则以千字节为单位。默认设置为 -1，它禁用这种记录。只有超级用户可以更改这个设置。


该记录器用于对溢出到磁盘的排序和其他活动进行故障排除。如果您确实使用它，最好将其设置为 1kB 之类的低值，以便您知道溢出到磁盘的每个查询，因为任何磁盘溢出都会导致查询急剧减慢。可用于查看是否需要更多work_mem、temp_mem 或maintenance_work_mem。

