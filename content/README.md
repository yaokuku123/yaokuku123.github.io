# 日常上传与自动发布

完整操作见 [内容维护指南](../docs/content-publishing.md)。`files/` 支持直接上传 PDF / DOCX / XLSX / PPTX / TXT / CSV / ZIP，自动生成 Writing 资料入口；配图放 `media/`；首页简介与关注方向改 `profile.json`，关于我正文改 `about.md`。文件上传不会自动解析更新网页简历，请编辑 resume.md / student-years.md。迁移启用后提交 main 即自动发布，详见 [部署状态](../docs/deployment.md)。

# 内容资产入口

**日常更新只改这里，不需要改 `src/`。** 所有笔记、Ideas、项目和简历都以内容文件维护，网页负责统一展示。

| 内容 | 放在哪里 | 页面自动处理什么 |
|---|---|---|
| 长笔记 | `posts/*.md`（也支持子目录） | 列表、详情、摘要、分类、搜索、阅读时间、章节目录 |
| 一条 Ideas | `ideas/*.md` | 时间线、日期筛选、分类计数、展开正文 |
| GitHub 仓库链接 | `projects/repos.txt`，每行一个链接 | 项目列表、名称、详情入口和 GitHub 按钮 |
| 更完整的项目介绍 | `projects/*.md` | 用自定义名称、简介、标签和正文丰富项目展示 |
| 图片 | `media/` | 在 Markdown 中用 `![说明](/media/文件名.png)` 插入 |
| 工作简历 / 校园经历 | `resume.md` / `student-years.md` | 简历正文、章节目录、表格、打印样式 |
| 课程源目录 | `course-index.json` | 课程列表及已归档笔记的关联 |

文件名用英文小写加连字符，例如 `redis-cache-consistency.md`；文件名就是文章地址，发布后尽量不改名。

## 日常使用

首次运行先 `npm ci`，再 `npm run dev`。预览地址为 http://localhost:4173 。

**开发预览启动后，新增或修改内容，保存即可自动生成并刷新页面。** 不用额外修改代码或手动重启。写错日期或字段时，会显示具体文件错误并保留上一次可用的网站。

准备交付静态网站时执行 `npm run build`；需要部署的是生成的 `dist/`。静态托管上的网站不会直接读取本机文件，线上更新仍需重新构建和部署。

## 新增一篇笔记

在 `posts/` 新建文件：

```markdown
---
title: 缓存失效后，发生了什么？
date: "2026-10-17"
category: 系统架构
---

## 从一个例子开始

正文……

## 通用思路

正文……
```

标题、日期、分类和正文就够了。摘要、阅读时间和二级标题目录会自动生成。新分类也会自动出现。

可选字段：

- `description`：手写文章摘要；也兼容现有 `desc`。
- `label`：例如 `路人 · LESSON 022`；`type`：例如 `学习笔记`。
- `lesson: 22`：关联对应课程；一节课只能关联一篇正式笔记。重复编号专题使用课程索引中的 key，如 `lesson: "64-ranking"`。
- `draft: true`：暂不出现在网页。完成后改为 `false` 或删掉这一行。
- `example: true`：标记示例素材；正式笔记省略或设为 `false`。
- `order`：同一天内容的排列顺序，数字小的在前。

支持标题、列表、引用、表格、代码块、链接和图片。原始 HTML 不会作为可执行页面插入。特别提醒使用：

```markdown
> [!NOTE] 这里是一条补充说明。
```

现有互动实验已做成可复用组件，需要时可在正文放置：

````markdown
```component
upload-demo
```
````

普通文章不需要开发组件。新增一种全新的交互实验时，才需要扩展组件代码。

## 新增一条 Ideas

在 `ideas/` 新建文件：

```markdown
---
title: 先把问题讲清楚。
date: "2026-10-17"
category: 学习
---

一段当时的想法。也可以分段、放链接或图片。
```

日期和分类下拉项由文件自动生成，无需改页面。

## 新增项目：给一个链接即可

在 `projects/repos.txt` 追加：

```text
https://github.com/你的用户名/仓库名
```

网站会从链接提取仓库名称，并生成 GitHub 入口；构建时不访问 GitHub，不依赖网络、登录或 API Key。

想进一步介绍项目，再新增一个 Markdown：

```markdown
---
github: https://github.com/你的用户名/仓库名
title: 自定义项目名称
description: 一句话介绍这个项目。
tags: [Python, Agent]
---

## 为什么做

正文……

## 如何使用

正文……
```

同一仓库在链接清单和 Markdown 中同时出现时只展示一次，以 Markdown 介绍为准。不自动抓取仓库的 README、Star 数或最新动态。

## 同步 GitHub 账号

已同步 yaokuku123 账号当前全部公开仓库（包括 Fork），快照保存在 projects/github.json。更新时运行 npm run sync:github：会分页读取 GitHub 公开 API，保留名称、简介、语言、Fork 与归档标记。Fork 在网页独立分组，没有简介时不编造说明。

同步完成后开发预览自动刷新；正式网站在迁移启用后由 GitHub Actions 自动构建部署。普通构建只读本地快照，不需要联网。GitHub 不可用时同步报错并保留原快照。自定义项目 Markdown 优先于快照；repos.txt 仍可添加其他仓库。

## 联系方式

GitHub、邮箱和微信展示名在 profile.json；微信二维码原图在 media/wechat-contact.jpg。首页与 About 共用这些资产，替换二维码无需修改页面代码。截图中的 yorick_jun 仅作为微信展示名，不假定为微信号。

## 文章标签

文章 front matter 支持 `tags: [创业 0 到 1, 融资, 股权]`，一篇可有多个标签。Writing 默认按日期倒序，同日按 order 升序，再按文件名排序。标签可与分类、搜索同时使用，点击「全部标签」取消标签筛选。标签显示在文章列表和详情页；省略 tags 时仍正常显示。
