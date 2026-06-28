# wechat-digest skill · 微信公众号采集 → 知识库 → 离线 HTML

对标 redbook（rednote）skill，面向**微信公众号**：以「微信公众平台后台」Cookie+Token 接口为核心，
按名称稳定拉**全文**；去重合并进**持续累积的本地知识库**；由本地 agent 做逐篇五段式精析 +
主题/标签/交叉引用结构化 + 收藏夹拆解；再生成一个**自包含、可双击打开的离线 HTML 工作台**
（总览 / 文章库 / 知识库 / 收藏夹），并预留 `/api/chat` 接口做可选的按需 AI 拆解。

详细用法见 [SKILL.md](./SKILL.md)。下面是 30 秒上手：

```bash
cd skill
pip install -r requirements.txt          # requests + openpyxl

cp credentials.example.json credentials.json
#  ↑ 登录 https://mp.weixin.qq.com 取 token（地址栏 URL 里的 token=数字）
#    + cookie（F12 → Network → 任一请求的 Request Headers → Cookie 整串），填进去
python3 wechat_collector.py whoami        # 校验登录态

# ① 采集（默认抓正文 + 自动入知识库）
python3 wechat_collector.py collect 晚点LatePost --since 2025-01-01 --count 10

# ② 让本地 agent 拆解：取批次 → 写回（详见 SKILL.md「知识库分析工作流」）
python3 kb.py list --unanalyzed --content --json     # 取待分析批次
python3 kb.py apply --file batch.json                # agent 写回五段式 + 主题/标签/交叉引用
python3 kb.py stats                                  # 看进度

# ③ 生成离线 HTML 工作台
python3 kb.py export-html        # → output/digest.html（双击打开即可；收藏夹仅存本浏览器）
python3 kb.py serve             # 推荐：本地服务，收藏夹自动存回 knowledge_base.json（清缓存不丢）
#                                  → 浏览器开 http://127.0.0.1:8765/digest.html
```

产物在 `output/`（均已 `.gitignore`）：

- `articles_YYYYMMDD.json` —— 原始采集（可被 Web 应用「导入 JSON」）
- `index_YYYYMMDD.xlsx` —— Excel 索引表
- `knowledge_base.json` —— 持续累积知识库（去重合并 + agent 分析载体）
- `digest.html` —— 自包含离线工作台（建收藏夹 / 看知识库 / 读逐篇·收藏夹拆解）

> ⚠️ `credentials.json` 与 `output/` 已 `.gitignore`，请勿提交。token/cookie 会过期，采集失败优先重新获取。
> ⚠️ API Key 只存浏览器 `localStorage`，绝不写入文件或知识库。
> ⚠️ 阅读数/在看/点赞需微信客户端签名参数，后台接口拿不到，故不含互动量。
