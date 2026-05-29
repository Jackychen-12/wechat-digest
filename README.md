# 墨摘 WeChat Digest · AI 公众号抓取与结构化分析

> 输入公众号名称，自动抓取最新文章，AI 一键完成总结与结构化分析。
> **匿名工作区码** 即开即用、跨设备同步、人人数据隔离；支持 **OpenAI / DeepSeek / 通义千问**。

![stack](https://img.shields.io/badge/frontend-GitHub_Pages-222) ![stack](https://img.shields.io/badge/backend-Deno_Deploy-000) ![store](https://img.shields.io/badge/sync-Deno_KV-00c389) ![ai](https://img.shields.io/badge/AI-OpenAI%20%7C%20DeepSeek%20%7C%20Qwen-10b981)

---

## ✨ 能做什么

| 能力 | 说明 |
| --- | --- |
| **按名称自动抓取** | 输入公众号名称 → 后端代理搜狗微信搜索（带 cookie 预热 / UA 轮换 / 重试 / 缓存）→ 拉取文章列表并解析正文 |
| **粘贴链接解析** | 直接粘贴 `mp.weixin.qq.com` 文章链接（或搜狗跳转链接），自动解析并清洗为纯净正文 |
| **AI 结构化分析** | 自动输出「一句话总结 / 核心观点 / 关键数据 / 关键词标签 / 适用人群」，流式输出 |
| **批量自动化** | 导入后可自动分析，或一键批量分析全部未分析文章 |
| **多模型切换** | OpenAI、DeepSeek、通义千问任意切换；国产模型经后端代理转发，绕过浏览器 CORS |
| **工作区码同步** | 每个访客自动获得专属工作区码，文章与分析存云端、按码隔离、互不重叠；换设备输入同码即可恢复 |
| **Key 仅本地** | API Key 只存浏览器 `localStorage`，**绝不写入云端工作区**，可随时清除 |

---

## 👥 多用户：匿名工作区码

无需注册登录。首次进入应用会自动生成一串高熵 **工作区码**（形如 `a1b2-c3d4-e5f6-7890`）：

- 工作区码写入浏览器与地址栏 `#ws=...`，可收藏/复制保存；
- 文章与分析结果按工作区码存于云端 KV，**不同码之间完全隔离、内容不重叠**；
- 在任意设备的工作台「切换」处输入同一串码，即可同步同一份数据；
- ⚠️ 工作区码即数据钥匙，**持有者可读写该工作区**，请妥善保存、勿公开分享；
- 若后端未配置 KV，应用自动降级为「纯本地模式」（仅存当前浏览器），功能照常可用。

---

## 🏗 架构

```
GitHub Pages（静态前端，零构建）
  ├─ index.html / styles.css / app.js
  │   工作区码生成 + 云同步（防抖上传 / 合并下载）+ Key 本地存储
  └─ 跨域调用 ↓
Deno Deploy（后端，单文件 backend/main.ts）
  ├─ GET  /api/search?account=名称      搜狗微信搜索 → 文章列表（KV 缓存 10min）
  ├─ GET  /api/article?url=链接         解析搜狗跳转 → 抓取清洗正文（KV 缓存 1d）
  ├─ GET/PUT /api/data?ws=工作区码       读取 / 保存某工作区的文章
  └─ POST /api/chat                     OpenAI 兼容流式代理（多 provider）
        ↓
Deno KV（内置，零配置）  按 ws:<码> 存数据；search:* / art:* 做抓取缓存（大值自动分块）
```

> 为什么需要后端：微信公众号无公开官方 API，浏览器直连会被 **CORS** 拦截且有强反爬；
> DeepSeek / 通义千问的 API 也未对浏览器开放跨域。抓取、AI 调用、跨设备同步都经由后端完成。
> 后端与 Vercel 解耦，**前端纯静态托管在 GitHub Pages，后端免费跑在 Deno Deploy**。

---

## 🚀 部署（GitHub Pages 前端 + Deno Deploy 后端）

### ① 部署后端到 Deno Deploy（免费、内置 KV、无需信用卡）

1. 登录 [dash.deno.com](https://dash.deno.com) → **New Project** → 关联本 GitHub 仓库
2. **Entrypoint** 选 `backend/main.ts`
3. 部署完成后会得到一个地址，例如 `https://wechat-digest.deno.dev`
4. Deno KV 在 Deno Deploy 上**自动可用**，无需任何配置或环境变量

> 本地调试后端：`deno run --allow-net --allow-env --unstable-kv backend/main.ts`（默认监听 8000）

### ② 部署前端到 GitHub Pages

1. 把上一步拿到的后端地址填进 `app.js` 顶部的常量：
   ```js
   const BACKEND_BASE = "https://wechat-digest.deno.dev"; // ← 改成你的
   ```
   （填进去后，所有访客无需任何配置即可使用；也可不填，让每个用户在「设置 → 后端 API 地址」自行填写。）
2. 仓库 **Settings → Pages → Source** 选 **GitHub Actions**。推送到 `main` 后，已内置的工作流会自动把站点发布到 `https://<用户名>.github.io/<仓库名>/`

> 未配置后端时：自动抓取 / AI 分析 / 云同步都会提示「需要后端」，并降级为纯本地模式（数据仅存当前浏览器）。

---

## 🔑 配置模型

进入「工作台 → 设置」：

| 模型 | Key 获取 | 备注 |
| --- | --- | --- |
| OpenAI | platform.openai.com | 需国外网络 |
| DeepSeek | platform.deepseek.com | 国内可直连，性价比高 |
| 通义千问 | 阿里云百炼控制台 | OpenAI 兼容模式 |

Key 仅保存在浏览器本地，调用时随请求发送给你自己部署的后端代理，再转发给模型厂商。

---

## 🧭 使用流程

1. 首页或工作台输入**公众号名称** → 「抓取文章」
2. 在结果弹窗勾选要导入的文章（可勾选「导入后自动 AI 分析」）
3. 左侧文章库点击任意文章 → 右侧查看 AI 结构化分析
4. 可在分析框填写**自定义指令**（如「侧重投资视角」）重新生成
5. 「一键分析未分析」批量处理整个文章库

---

## ⚠️ 关于抓取的现实说明

- 后端已做加固：**cookie 预热、UA 轮换、指数退避重试、KV 结果缓存**，可显著提高成功率并降低反爬触发。
- 但搜狗微信搜索仍存在反爬（高频访问会触发验证码），抓取**不保证 100% 成功**；触发时应用会提示，可改用「粘贴链接」。
- 搜狗搜索结果是 JS 跳转链接，后端会自动解析出真实 `mp.weixin.qq.com` 地址再抓取。
- 部分图片/视频类推送无法解析正文，会提示手动粘贴。
- 本项目仅供个人学习与研究，请遵守目标站点的 robots 与服务条款，控制访问频率。

---

## 📄 License

MIT
