# 公众号推送整理与总结助手

一个轻量级静态网页工具，帮助你：

- 按公众号、日期整理每日推送文章；
- 对文章做关键词/日期筛选；
- 用自然语言输入总结需求，快速得到摘要结果。

## 在线部署（别人可直接点开）

你说得对：本地 `index.html` 只能你自己看。下面给你 **3 种云部署方式**，都可以得到公网链接。

### 方案 A（推荐，最快）：Cloudflare Pages（拖拽上传）

1. 打开：https://dash.cloudflare.com/
2. 进入 **Workers & Pages** → **Create application** → **Pages** → **Upload assets**。
3. 上传当前项目目录下文件：
   - `index.html`
   - `app.js`
   - `styles.css`
4. 部署完成后会得到类似：`https://xxx.pages.dev` 的公网链接。

### 方案 B：Vercel（拖拽上传）

1. 打开：https://vercel.com/new
2. 选择 **Deploy without Git**（或导入 Git 仓库）。
3. 上传本项目目录，点击 Deploy。
4. 会得到类似：`https://xxx.vercel.app` 的公网链接。

> 本仓库已提供 `vercel.json`，可直接用于静态托管。

### 方案 C：GitHub Pages（长期稳定，适合持续更新）

本仓库已新增 GitHub Pages 自动部署工作流：`.github/workflows/deploy-pages.yml`。

你只需要：

1. 把代码推送到你的 GitHub 仓库 `main` 分支；
2. 在仓库 `Settings -> Pages` 中将 Source 设为 **GitHub Actions**；
3. 等待 Actions 跑完，就会生成公开链接：
   `https://<你的用户名>.github.io/<仓库名>/`

## 本地使用方式

1. 直接点击 [`index.html`](./index.html) 打开网页；
2. 若浏览器限制本地脚本，可在项目目录运行：`python3 -m http.server 4173`
3. 然后访问：[http://127.0.0.1:4173/](http://127.0.0.1:4173/)

## 备注

- 当前版本采用本地摘要算法，无需后端即可使用；
- 后续可在 `app.js` 中替换 `summarizeText` 逻辑为任意大模型 API 调用；
- 我在当前执行环境尝试过直接创建公网隧道，但受网络限制无法直连外网 SSH 隧道，所以给你补齐了可落地的云部署方案（上面三种都能“别人直接点开”）。
