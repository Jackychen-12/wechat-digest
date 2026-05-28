# 公众号推送整理与总结助手

整理微信公众号推送文章，按公众号 / 日期 / 关键词筛选，使用 AI（OpenAI GPT）或本地算法一键总结。

## 功能

- **文章录入**：手动添加公众号文章（标题、正文、日期、原文链接）
- **批量导入**：支持 JSON 格式批量导入文章
- **示例数据**：一键加载 5 篇示例文章，即刻体验
- **筛选过滤**：按关键词、日期、公众号名称快速检索
- **AI 智能总结**：接入 OpenAI GPT API，对选定文章进行流式总结
- **本地摘要兜底**：未配置 API Key 时自动使用本地词频算法生成摘要
- **自定义指令**：自由输入总结需求（如"提炼核心观点"、"输出 120 字摘要"）
- **数据持久化**：文章和设置存储在浏览器 localStorage

## 使用方式

### 在线访问

部署在 GitHub Pages：`https://<用户名>.github.io/wechat-digest/`

### 本地运行

```bash
# 方式一：直接打开
open index.html

# 方式二：启动本地服务器（避免浏览器安全限制）
python3 -m http.server 4173
# 访问 http://127.0.0.1:4173/
```

## 配置 OpenAI API

1. 打开页面顶部「API 设置」面板
2. 输入你的 OpenAI API Key（`sk-...`）
3. 选择模型（推荐 `gpt-4o-mini`，性价比最高）
4. 点击「保存设置」

> API Key 仅存储在浏览器本地 localStorage，不会上传到任何服务器。

## 批量导入格式

支持导入 JSON 文件，格式如下：

```json
[
  {
    "account": "公众号名称",
    "publishDate": "2025-03-18",
    "title": "文章标题",
    "url": "https://mp.weixin.qq.com/...",
    "content": "文章正文内容..."
  }
]
```

其中 `title` 和 `content` 为必填字段。

## 技术栈

- 纯 HTML + CSS + JavaScript，无框架依赖
- OpenAI Chat Completions API（流式 SSE）
- GitHub Pages 静态托管

## License

MIT
