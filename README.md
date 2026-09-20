# cleste 的个人学术主页

这是 [cleste](https://github.com/cleste-pome) 的个人学术主页源码。

- 🌐 线上地址：**https://cleste-pome.github.io/**
- 📦 仓库地址：https://github.com/cleste-pome/cleste-pome.github.io

---

## 模板来源与致谢

本网站**不是从零编写**，而是基于开源项目 **AcadHomepage** 搭建的。在此向原作者致谢：

| 项目 | 作者 | 原始链接 | 许可证 |
| --- | --- | --- | --- |
| **AcadHomepage** | [Yi Ren (RayeRen)](https://github.com/RayeRen) | https://github.com/RayeRen/acad-homepage.github.io | MIT |

- 本仓库的页面结构、样式、Jekyll 模板与构建配置**均来自 AcadHomepage**；
- 本仓库在此基础上**仅修改了个人配置与内容**（`_config.yml`、`_pages/about.md`、`_data/navigation.yml` 以及后续的个人图片素材）；
- 原项目的 MIT 许可证已按许可证要求**完整保留**于本仓库的 [`LICENSE`](./LICENSE) 文件中，版权归 Yi Ren 所有；
- 原作者的个人主页：https://rayeren.github.io/
- 原始模板的演示页：https://rayeren.github.io/acad-homepage.github.io/

AcadHomepage 还受到以下项目影响，一并致谢：
- [mmistakes/minimal-mistakes](https://github.com/mmistakes/minimal-mistakes) (MIT)
- [academicpages/academicpages.github.io](https://github.com/academicpages/academicpages.github.io) (MIT)

> 如果你也想用这个模板，请直接去[原始仓库](https://github.com/RayeRen/acad-homepage.github.io)自行 fork，
> 并保留原作者的版权声明。本项目中的个人内容（姓名、学校、论文等）请勿直接搬运。

---

## 技术栈

- **Jekyll** 静态站点生成器
- **GitHub Pages** 托管（从 `main` 分支根目录直接构建）
- **GitHub Actions** 可选：自动抓取 Google Scholar 引用数据

## 目录结构

```
_config.yml              站点主配置（标题、作者、社交链接等）
_data/navigation.yml     顶部导航栏栏目
_pages/about.md          主页全部内容（个人简介、论文、教育经历等）
_layouts/                页面布局模板
_includes/               页面组件
_sass/                   样式源码
assets/                  静态资源（CSS / JS / 字体）
images/                  图片素材（头像、favicon、论文配图）
google_scholar_crawler/  可选：Google Scholar 引用数抓取脚本
docs/                    模板自带文档与截图
LICENSE                  原模板 MIT 许可证（请勿删除）
```

## 日常维护：怎么改内容

绝大多数修改只需要动两个文件：

**1. 改个人信息 / 社交链接** → `_config.yml`

```yaml
title       : "cleste"                                    # 浏览器标签页标题
description : "..."                                       # SEO 描述
repository  : "cleste-pome/cleste-pome.github.io"         # 必须是 用户名/仓库名
author:
  name      : "cleste"                                    # 页面显示的名字
  avatar    : "images/android-chrome-512x512.png"         # 头像
  bio       : "..."                                       # 一句话身份
  location  : "Wuhan, China"
  googlescholar : "https://scholar.google.com/citations?user=XXXX"  # 填上就显示图标
  email     : "you@example.com"
  github    : "cleste-pome"
```

**2. 改主页正文** → `_pages/about.md`

用 Markdown 直接写即可。各板块的标题前带 emoji（`# 🔥 News`、`# 📝 Publications` …），
如果改动了标题文字，记得同步更新 `_data/navigation.yml` 里的跳转锚点。

论文条目用模板提供的卡片样式：

```html
<div class='paper-box'><div class='paper-box-image'><div><div class="badge">NeurIPS 2025</div><img src='images/你的论文配图.png' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

[论文标题](论文链接)

**作者1**, 作者2, 作者3

[**Paper**](链接) [**Code**](链接)
- 一句话说明这篇论文做了什么。
</div>
</div>
```

> 配图放到 `images/` 目录下，建议尺寸 500×300。

## 本地预览（可选）

需要 Ruby 环境，然后：

```bash
bundle install
bash run_server.sh
```

浏览器打开 http://127.0.0.1:4000 即可实时预览。

## 发布流程

本站由 GitHub Pages 从 `main` 分支自动构建，**推送即发布**：

```bash
git add -A
git commit -m "更新主页内容"
git push
```

推送后约 1 分钟生效，可在仓库的 **Actions** 页面查看构建进度。

## 可选：自动更新 Google Scholar 引用数

1. 在 Google Scholar 主页网址里找到你的 ID：`https://scholar.google.com/citations?user=<SCHOLAR_ID>`
2. 在仓库 `Settings → Secrets and variables → Actions` 中新建 secret：
   `name=GOOGLE_SCHOLAR_ID`，`value=<SCHOLAR_ID>`
3. 打开仓库 **Actions** 页面，启用 workflows
4. 在工作流生成 `google-scholar-stats` 分支后，即可在主页用下面的写法显示引用数：

```html
<span class='show_paper_citations' data='论文的SCHOLAR_ID'></span>
```

## 许可证

本项目沿用原模板的 **MIT License**，版权归原作者 **Yi Ren (RayeRen)** 所有，详见 [`LICENSE`](./LICENSE)。

个人内容（个人信息、论文、图片等）版权归 cleste 所有。
