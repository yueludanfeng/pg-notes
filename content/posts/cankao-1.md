---
title: "参考"
date: 2023-08-01
description: "* [Auto_explain Intro: Auto-Log Slow Postgres Query Plans (scalegrid.io)](https://scalegrid.io/blog/introduction-to-auto"
categories: ["PostgreSQL 笔记"]
tags: ["参数配置", "执行计划", "统计信息"]
series: []
---

* [Auto_explain Intro: Auto-Log Slow Postgres Query Plans (scalegrid.io)](https://scalegrid.io/blog/introduction-to-auto-explain-postgres/#2)
* [PostgreSQL Auto Explain - Vlad Mihalcea](https://vladmihalcea.com/postgresql-auto-explain/)

# 使用方法
修改配置文件 postgresql. auto. conf
```bash
session_preload_libraries = auto_explain
auto_explain.log_min_duration = 100  # 单位为 ms, 比如期望大于 100ms 就记录日志 那么可以这样配置
auto_explain.log_analyze = true
auto_explain.log_buffers = true
# auto_explain.log_format = JSON    # 使用 json 格式并不太好看, 建议不用这个选项

```

