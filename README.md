# PG Notes

一个基于 Hugo + Blowfish 的 PostgreSQL 个人技术博客。

## 本地预览

```bash
hugo server
```

访问 `http://localhost:1313/`。

## 新建文章

```bash
hugo new posts/my-post.md
```

文章文件会生成在 `content/posts/`。把 `draft: true` 改成 `draft: false` 或删除这一行后，正式构建才会发布。

常用 front matter：

```yaml
---
title: "文章标题"
date: 2026-05-19
description: "文章摘要"
categories: ["PostgreSQL 案例"]
tags: ["PostgreSQL", "SQL 优化"]
series: ["PostgreSQL 运维案例"]
---
```

## 构建

```bash
hugo --gc --minify
```

生成结果在 `public/`。

## 部署到 GitHub Pages

推送到 GitHub 后，进入仓库 `Settings -> Pages`，将 Source 选择为 `GitHub Actions`。本项目已包含自动部署工作流。

如果使用项目页地址，例如 `https://你的用户名.github.io/pg-personal-site/`，请把 `config/_default/hugo.toml` 里的 `baseURL` 改成这个完整地址。
