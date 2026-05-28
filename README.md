<p align="center">
  <img src="https://em-content.zobj.net/source/apple/391/newspaper_1f4f0.png" width="64" height="64" alt="WeChat Digest" />
</p>

<h1 align="center">WeChat Digest</h1>

<p align="center">
  <strong>AI-Powered WeChat Article Summarizer</strong><br/>
  <sub>公众号文章整理与 AI 智能总结工具 — 录入、筛选、一键 GPT 摘要</sub>
</p>

<p align="center">
  <a href="https://keyuchen-del.github.io/wechat-digest/">Live Demo</a> &nbsp;|&nbsp;
  <a href="#features">Features</a> &nbsp;|&nbsp;
  <a href="#architecture">Architecture</a> &nbsp;|&nbsp;
  <a href="#getting-started">Getting Started</a> &nbsp;|&nbsp;
  <a href="#roadmap">Roadmap</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vanilla_JS-ES2022-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/OpenAI_API-Streaming-412991?logo=openai&logoColor=white" alt="OpenAI" />
  <img src="https://img.shields.io/badge/SSE-Streaming-0F766E" alt="SSE" />
  <img src="https://github.com/keyuchen-del/wechat-digest/actions/workflows/deploy-pages.yml/badge.svg" alt="Deploy" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
</p>

---

## What is WeChat Digest?

WeChat Digest is a lightweight, privacy-first tool for organizing WeChat Official Account (公众号) articles and generating AI-powered summaries. It runs entirely in the browser — no backend, no database, no login required.

> **Demo:** The [live demo](https://keyuchen-del.github.io/wechat-digest/) ships with 5 pre-loaded articles and pre-generated AI summaries. Click "生成总结" to see the typing animation in action — no API key needed.

## Features

| Module | Description |
|--------|-------------|
| **Smart Article Management** | Add, organize, and browse articles by account name, publish date, and keyword search |
| **AI Summary (GPT)** | Streaming summarization via OpenAI Chat Completions API (gpt-4o-mini / gpt-4o / gpt-3.5-turbo) |
| **Custom Analysis Prompts** | Free-form instructions — "extract key points", "120-word abstract", "compare viewpoints", etc. |
| **Local Fallback** | Enhanced extractive summarization when no API key is configured — position weighting + keyword boosting |
| **Typing Animation** | Character-by-character output with cursor, simulating real AI streaming response |
| **Batch Import** | JSON file import for bulk article loading |
| **Privacy-First** | All data stored in browser localStorage; API key never leaves the client |

### Demo Experience

```
Landing Page
├── Product Info (left)          ← Feature cards + tech badges
└── Browser Window Frame (right) ← Live interactive demo
    ├── Tab: 文章库              ← 5 pre-loaded articles with filters
    ├── Tab: AI 总结             ← Select article → generate summary
    └── Tab: 设置               ← API key config + data management
```

## Architecture

```
wechat-digest/
├── index.html          # Landing showcase + browser window frame + tab UI
├── styles.css          # Dark theme landing + window chrome + responsive
├── app.js              # Core logic (single file, ~450 lines)
│   ├── DEMO_ARTICLES   # 5 pre-loaded Chinese articles (finance/tech/policy)
│   ├── DEMO_SUMMARY    # Pre-written summaries for all demo articles
│   ├── initTabs()      # Tab switching controller
│   ├── renderArticles()        # Article list rendering with filters
│   ├── summarizeWithGPT()      # OpenAI streaming via fetch + SSE parsing
│   ├── summarizeWithTyping()   # Typing animation for demo mode
│   ├── generateLocalSummary()  # Extractive fallback algorithm
│   └── formatMarkdown()        # Lightweight markdown → HTML
├── .github/workflows/
│   └── deploy-pages.yml        # GitHub Pages auto-deploy on push to main
├── LICENSE             # MIT
└── README.md
```

### Design Decisions

- **Zero dependencies** — No framework, no build step, no node_modules. Pure HTML + CSS + JS
- **Browser window frame** — macOS-style chrome (red/yellow/green dots + URL bar) gives showcase polish
- **Tab-based layout** — Compact UI fits inside the demo window without scrolling through long forms
- **Dual summarization** — Real GPT when API key is set; typing-animated demo summaries when not
- **Auto-demo on first visit** — Articles load automatically, summary is pre-rendered, zero-click experience
- **SSE streaming** — GPT responses stream character-by-character via Server-Sent Events, matching ChatGPT UX

## Getting Started

```bash
# Clone
git clone https://github.com/keyuchen-del/wechat-digest.git
cd wechat-digest

# Option 1: Open directly
open index.html

# Option 2: Local server (recommended)
python3 -m http.server 4173
# Visit http://127.0.0.1:4173/
```

### Configure OpenAI API (Optional)

1. Open the **设置** tab in the demo window
2. Enter your OpenAI API Key (`sk-...`)
3. Select a model (default: `gpt-4o-mini`)
4. Click **保存设置**

> The key is stored in `localStorage` only. It is sent directly from your browser to OpenAI's API — no proxy, no backend.

### Batch Import Format

```json
[
  {
    "account": "公众号名称",
    "publishDate": "2025-03-18",
    "title": "文章标题",
    "url": "https://mp.weixin.qq.com/...",
    "content": "文章正文..."
  }
]
```

`title` and `content` are required; other fields are optional.

## Roadmap

- [ ] Multi-article comparison summary (select 2+ articles → cross-analysis)
- [ ] Claude API support (Anthropic)
- [ ] RSS feed auto-import (WeChat article RSS bridges)
- [ ] Export summaries as Markdown / PDF
- [ ] Article tagging and categorization
- [ ] Summary history and caching
- [ ] Dark mode for in-app UI
- [ ] PWA support (offline access)
- [ ] Chrome extension for one-click article capture
- [ ] Collaborative sharing (shareable summary links)

## License

[MIT](LICENSE)
