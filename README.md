# Yorick Space · 内容维护

网站：https://yaokuku123.github.io/

本仓库是可以独立构建的个人网站。首次迁移启用后，日常在 GitHub 修改 `content/` 即可：提交到 main → Actions 测试与构建 → GitHub Pages 更新。无需修改页面代码，也无需在本机运行发布命令。

## 日常操作

打开仓库的 `content` 文件夹，使用 **Add file → Upload files** 上传，或点击文件右上角铅笔编辑；完成后 Commit changes。只修改普通内容时，不需要修改 `src/`、`tools/` 或工作流。

| 要更新什么 | 放在哪里 | 网站行为 |
|---|---|---|
| 文章、心得、学习笔记 | `content/posts/英文短名.md` | 自动生成 Writing 列表、分类、摘要、阅读时间、目录、详情页 |
| 简短想法 | `content/ideas/英文短名.md` | 自动进入 Ideas 时间线与分类 |
| PDF、Word、Excel、PPT、文本、CSV、ZIP | `content/files/`，可建子目录 | 自动进入 Writing 的「资料」分类，提供打开/下载入口 |
| 配图 | `content/media/` | 正文引用 `/media/文件名` |
| 工作简历 | `content/resume.md` | 更新完整简历，章节目录自动生成 |
| 校园与科研经历 | `content/student-years.md` | 更新简历后半部分 |
| About 正文 | `content/about.md` | 更新关于我 |
| 首页简介、联系方式、关注方向 | `content/profile.json` | 首页及 About 同步读取 |
| GitHub 项目 | `content/projects/repos.txt` 每行一个链接 | 自动添加项目；同目录 Markdown 可补充说明 |

已有页面视觉保持不变。附件原文件名可以使用中文；上传原件会公开可下载，Word/PDF 不会自动改写成文章或解析合并到网页简历。希望网页可阅读全文时请使用 Markdown；更新网页简历请编辑上述两个简历文件。二进制文件不参与全文搜索，按文件名搜索；无日期附件置于现有文章后。

## 最小文章

新建 `content/posts/my-first-note.md`：

```markdown
---
title: 最近的一点体会
date: "2026-10-31"
category: 心得
---

## 我遇到的问题

在这里写正文。

![配图](/media/my-picture.png)

[相关文档](/files/my-document.pdf)
```

新分类自动出现。日期必须是真实的 `YYYY-MM-DD`；文件名用英文小写和连字符，发布后尽量不改名，避免原有分享链接失效。Ideas 使用同样的元信息。项目 Markdown 参考 `content/README.md`。

本地未准备好的文章可加 `draft: true`；它不会进入网页构建，首次导出也会排除。**公开 GitHub 仓库里的草稿源文件及历史仍然公开**；私密材料只留本地，撤下页面不会消除 Git 历史。`files/` 和 `media/` 里的上传文件均为公开附件，不能用文章的 draft 隐藏它们。

模板在 `content/templates/`，复制后改名为 `.md` 放入相应集合；模板本身不会生成页面。

## 检查是否发布成功

提交后打开仓库 **Actions → Validate and publish website**。成功后访问网站并刷新即可。失败时打开红色步骤，日志会指出有问题的文件与字段；修正并再次提交。失败构建不会替换当前线上版本。Pull request 只校验与构建，合并 main 后才发布。也可在 Actions 手动 Run workflow。

## 本地预览与维护来源

```bash
npm ci
npm run dev
npm test
npm run build
```

需要本地编辑时，从本站独立 GitHub 仓库 clone / pull 最新源文件，再改、提交、推送，避免覆盖网页端新增内容。原工作区保留迁移时的源文件；迁移后以**站点独立仓库**为日常内容的权威来源。原工作区的 `npm run deploy` 仅用于首次迁移，检测到远程已有工程源码会拒绝覆盖。不要把整个个人工作区推到站点仓库。

构建只发布 `dist/`，不发布测试、研究文档和工程配置；整个公开源码仓库仍可被直接浏览。普通构建不联网读取 GitHub 项目 API，想刷新项目快照可本地运行 `npm run sync:github` 并提交更新的 JSON。

## 文章标签

文章 front matter 支持 `tags: [创业 0 到 1, 融资, 股权]`，一篇可有多个标签。Writing 默认按日期倒序，同日按 order 升序，再按文件名排序。标签可与分类、搜索同时使用，点击「全部标签」取消标签筛选。标签显示在文章列表和详情页；省略 tags 时仍正常显示。
