---
title: "部署网站"
date: 2026-05-20
description: "重新做完了，已经成功上线。"
categories: ["安装部署"]
tags: ["PostgreSQL"]
series: []
---

重新做完了，已经成功上线。

结果：

- GitHub 登录完成：`yueludanfeng`
- 代码已推送到仓库：`https://github.com/yueludanfeng/pg-personal-site`
- 因为你的 GitHub 计划不支持私有仓库 Pages，我已把仓库改成 `public`
- GitHub Pages 已启用为 `GitHub Actions`
- 部署工作流已成功完成

公网地址是：

[https://yueludanfeng.github.io/pg-personal-site/](https://yueludanfeng.github.io/pg-personal-site/)

Actions 成功记录：

[Deploy Hugo site to Pages](https://github.com/yueludanfeng/pg-personal-site/actions/runs/26165860450)

后面你新增文章后，只需要：

```bash
cd /Users/lxm/Documents/codes/pg-personal-site
hugo new posts/my-new-post.md
```

写完后把 `draft: true` 改成 `draft: false`，然后：

```bash
git add .
git commit -m "Add new post"
git push
```

GitHub 会自动重新部署。