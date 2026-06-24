/* ════════════════════════════════════════════════════════════════
   墨摘 WeChat Digest — Deno backend (single file)
   Deploy free on Deno Deploy. Implements:
     GET  /api/search?account=    搜狗微信搜索 → 文章列表 (KV 缓存)
     GET  /api/article?url=       解析搜狗跳转 → 抓取清洗正文 (KV 缓存)
     POST /api/chat               OpenAI 兼容流式代理 (多 provider)
     GET/PUT /api/data?ws=        匿名工作区读写 (Deno KV, 分块存储)
   Storage: Deno KV (built-in on Deno Deploy, zero config).
   ════════════════════════════════════════════════════════════════ */

const PROVIDERS: Record<string, { label: string; endpoint: string; models: string[] }> = {
  openai: {
    label: "OpenAI",
    endpoint: "https://api.openai.com/v1/chat/completions",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"],
  },
  deepseek: {
    label: "DeepSeek",
    endpoint: "https://api.deepseek.com/v1/chat/completions",
    models: ["deepseek-chat", "deepseek-reasoner"],
  },
  dashscope: {
    label: "通义千问",
    endpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    models: ["qwen-plus", "qwen-turbo", "qwen-max"],
  },
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

let kvPromise: Promise<Deno.Kv> | null = null;
function getKv() {
  if (!kvPromise) kvPromise = Deno.openKv();
  return kvPromise;
}

/* ──────────────── helpers ──────────────── */

function json(body: unknown, status = 200, extra: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS, ...extra },
  });
}

const UA_POOL = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
];
const pickUA = () => UA_POOL[Math.floor(Math.random() * UA_POOL.length)];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function baseHeaders(ua?: string): Record<string, string> {
  return {
    "User-Agent": ua || pickUA(),
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Cache-Control": "no-cache",
  };
}

async function fetchHtml(url: string, extra: Record<string, string> = {}, ua?: string) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 15000);
  try {
    const r = await fetch(url, {
      headers: { ...baseHeaders(ua), ...extra },
      redirect: "follow",
      signal: ctl.signal,
    });
    const html = await r.text();
    return { ok: r.ok, status: r.status, html, finalUrl: r.url, setCookie: r.headers.get("set-cookie") || "" };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchHtmlRetry(
  url: string,
  extra: Record<string, string> = {},
  tries = 3,
  shouldRetry?: (r: { ok: boolean; html: string }) => boolean,
) {
  let last: Awaited<ReturnType<typeof fetchHtml>> | { ok: boolean; status: number; html: string; finalUrl?: string } = {
    ok: false, status: 0, html: "",
  };
  for (let i = 0; i < tries; i++) {
    try {
      last = await fetchHtml(url, extra, pickUA());
      const blocked = shouldRetry ? shouldRetry(last) : false;
      if (last.ok && !blocked) return last;
    } catch (_e) {
      last = { ok: false, status: 0, html: "" };
    }
    if (i < tries - 1) await sleep(400 * 2 ** i + Math.random() * 300);
  }
  return last;
}

async function sogouCookie(): Promise<string> {
  try {
    const r = await fetchHtml("https://weixin.sogou.com/", { Referer: "https://www.sogou.com/" });
    const jar: string[] = [];
    for (const part of (r.setCookie || "").split(/,(?=\s*[A-Za-z0-9_-]+=)/)) {
      const kv = part.split(";")[0].trim();
      if (/^(SUV|SNUID|SUID|IPLOC|ABTEST)=/.test(kv)) jar.push(kv);
    }
    if (!jar.some((c) => c.startsWith("SUV="))) jar.push("SUV=" + Date.now() + Math.floor(Math.random() * 1e6));
    return jar.join("; ");
  } catch {
    return "SUV=" + Date.now() + Math.floor(Math.random() * 1e6);
  }
}

function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>(?=)/gi, "\n")
    .replace(/<\/(p|div|section|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_m, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_m, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodeEntities(s: string) {
  return (s || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/* ──────────────── chunked KV blob (works around 64KiB value limit) ──────────────── */

const CHUNK = 40_000; // bytes per chunk, safely under Deno KV 64KiB limit

async function kvSetBlob(prefix: Deno.KvKey, obj: unknown, expireInMs?: number) {
  const kv = await getKv();
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  const n = Math.max(1, Math.ceil(bytes.length / CHUNK));
  const opts = expireInMs ? { expireIn: expireInMs } : undefined;

  // Read old chunk count to clean up stale chunks if data shrank.
  const oldMan = await kv.get<{ chunks: number }>([...prefix, "manifest"]);
  const oldN = oldMan.value?.chunks ?? 0;

  await kv.set([...prefix, "manifest"], { chunks: n, updatedAt: new Date().toISOString() }, opts);
  for (let i = 0; i < n; i++) {
    await kv.set([...prefix, "chunk", i], bytes.slice(i * CHUNK, (i + 1) * CHUNK), opts);
  }
  for (let i = n; i < oldN; i++) {
    await kv.delete([...prefix, "chunk", i]);
  }
  return { updatedAt: new Date().toISOString() };
}

async function kvGetBlob<T>(prefix: Deno.KvKey): Promise<{ data: T; updatedAt: string | null } | null> {
  const kv = await getKv();
  const man = await kv.get<{ chunks: number; updatedAt: string }>([...prefix, "manifest"]);
  if (!man.value) return null;
  const parts: Uint8Array[] = [];
  for (let i = 0; i < man.value.chunks; i++) {
    const c = await kv.get<Uint8Array>([...prefix, "chunk", i]);
    if (!c.value) return null; // a chunk expired/missing → treat as gone
    parts.push(c.value);
  }
  const total = parts.reduce((s, p) => s + p.length, 0);
  const merged = new Uint8Array(total);
  let off = 0;
  for (const p of parts) { merged.set(p, off); off += p.length; }
  try {
    return { data: JSON.parse(new TextDecoder().decode(merged)) as T, updatedAt: man.value.updatedAt };
  } catch {
    return null;
  }
}

/* ──────────────── /api/search ──────────────── */

function isSearchBlocked(html: string) {
  if (!html) return false;
  return /请输入验证码|antispider|访问过于频繁|系统检测到您网络中存在异常|请输入下方验证码/.test(html) &&
    !/news-list/.test(html);
}

function stripTags(s: string) {
  return (s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function parseArticles(html: string) {
  const results: unknown[] = [];
  const blocks = html.split(/<li[\s>]/).slice(1);
  for (const block of blocks) {
    const linkM = block.match(/<h3>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    if (!linkM) continue;
    let href = decodeEntities(linkM[1]).replace(/&amp;/g, "&");
    if (href.startsWith("/")) href = "https://weixin.sogou.com" + href;
    const title = decodeEntities(stripTags(linkM[2]));
    if (!title) continue;
    const summaryM = block.match(/<p class="txt-info"[^>]*>([\s\S]*?)<\/p>/);
    const summary = summaryM ? decodeEntities(stripTags(summaryM[1])) : "";
    const accountM = block.match(/class="account"[^>]*>([\s\S]*?)<\/a>/);
    const accountName = accountM ? decodeEntities(stripTags(accountM[1])) : "";
    const tsM = block.match(/<div class="s-p"[^>]*\bt="(\d+)"/);
    const publishDate = tsM ? new Date(parseInt(tsM[1], 10) * 1000).toISOString().slice(0, 10) : "";
    results.push({ title, summary, account: accountName, publishDate, sogouLink: href });
  }
  return results;
}

async function handleSearch(url: URL) {
  const account = (url.searchParams.get("account") || "").trim();
  if (!account) return json({ error: "缺少 account 参数" }, 400);
  const skipCache = url.searchParams.get("fresh") === "1";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const tsn = url.searchParams.get("tsn") || "";
  const prefix = ["search", account.toLowerCase(), `p${page}`, tsn || "all"];

  if (!skipCache) {
    const cached = await kvGetBlob<{ articles: unknown[]; count: number }>(prefix);
    if (cached?.data?.articles) return json({ ...cached.data, account, cached: true, page });
  }

  let searchUrl = `https://weixin.sogou.com/weixin?type=2&ie=utf8&query=${encodeURIComponent(account)}&page=${page}`;
  if (tsn && ["1", "2", "3", "4"].includes(tsn)) searchUrl += `&tsn=${tsn}`;
  try {
    const cookie = await sogouCookie();
    const result = await fetchHtmlRetry(
      searchUrl,
      { Referer: "https://weixin.sogou.com/", Cookie: cookie },
      3,
      (r) => isSearchBlocked(r.html),
    );
    const html = result.html || "";
    if (isSearchBlocked(html)) {
      return json({ error: "搜狗微信触发了反爬验证（访问过于频繁或需要验证码）。已自动重试仍失败，请稍后再试，或改用「粘贴文章链接」抓取单篇。", blocked: true }, 429);
    }
    if (!result.ok) return json({ error: `搜狗返回 ${result.status || "无响应"}，请稍后重试` }, result.status || 502);

    const items = parseArticles(html);
    const payload = { account, count: items.length, articles: items, page };
    if (items.length) await kvSetBlob(prefix, payload, 600_000);
    return json(payload);
  } catch (err) {
    return json({ error: (err as Error)?.message || "搜索失败" }, 500);
  }
}

/* ──────────────── /api/article ──────────────── */

function pick(html: string, re: RegExp) {
  const m = html.match(re);
  return m ? cleanInline(m[1]) : "";
}
function cleanInline(s: string) {
  return decodeEntities((s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ")).trim();
}
function sliceBetween(html: string, startRe: RegExp, endRe: RegExp) {
  const startM = html.match(startRe);
  if (!startM) return "";
  const startIdx = (startM.index ?? 0) + startM[0].length;
  const rest = html.slice(startIdx);
  const endM = rest.match(endRe);
  const endIdx = endM ? (endM.index ?? rest.length) : rest.length;
  return rest.slice(0, endIdx);
}
function isArticleBlocked(html: string) {
  if (!html) return false;
  return /请输入验证码|antispider|环境异常|访问过于频繁/.test(html) && !/js_content/.test(html);
}

async function resolveSogouLink(linkUrl: string) {
  try {
    const cookie = await sogouCookie();
    const { html, finalUrl } = await fetchHtml(linkUrl, { Referer: "https://weixin.sogou.com/", Cookie: cookie });
    if (/mp\.weixin\.qq\.com/.test(finalUrl)) return finalUrl;
    const parts = [...html.matchAll(/url\s*\+=\s*'([^']*)'/g)].map((m) => m[1]);
    if (parts.length) {
      const u = parts.join("").replace(/@/g, "").replace(/&amp;/g, "&");
      if (/^https?:\/\//.test(u)) return u;
    }
    const m = html.match(/https?:\/\/mp\.weixin\.qq\.com\/s[^"'\\<>\s]+/);
    if (m) return m[0].replace(/&amp;/g, "&");
    return "";
  } catch {
    return "";
  }
}

function canonicalKey(url: string) {
  const sn = url.match(/[?&]sn=([0-9a-f]+)/i);
  if (sn) return sn[1];
  const m = url.match(/mp\.weixin\.qq\.com\/s[\/?]([^#]*)/);
  return m ? encodeURIComponent(m[1]).slice(0, 120) : "";
}

async function handleArticle(url: URL) {
  const input = (url.searchParams.get("url") || "").trim();
  if (!input) return json({ error: "缺少 url 参数" }, 400);
  if (!/^https?:\/\//.test(input)) return json({ error: "url 格式不正确" }, 400);

  try {
    let target = input;
    if (/weixin\.sogou\.com\/link/.test(input)) {
      const resolved = await resolveSogouLink(input);
      if (resolved) target = resolved;
    }
    const mpKey = canonicalKey(target);
    if (mpKey) {
      const cached = await kvGetBlob<{ content?: string }>(["art", mpKey]);
      if (cached?.data?.content) return json({ ...cached.data, cached: true });
    }

    const result = await fetchHtmlRetry(target, { Referer: "https://mp.weixin.qq.com/" }, 3, (r) => isArticleBlocked(r.html));
    const html = result.html || "";
    const finalUrl = (result as { finalUrl?: string }).finalUrl || target;

    if (isArticleBlocked(html)) {
      return json({ error: "目标页触发了验证（链接可能已过期或被风控），请直接粘贴文章正文。", blocked: true }, 429);
    }
    if (!result.ok) return json({ error: `目标页返回 ${result.status || "无响应"}` }, result.status || 502);

    const title =
      pick(html, /<h1[^>]*class="rich_media_title"[^>]*>([\s\S]*?)<\/h1>/) ||
      pick(html, /<meta property="og:title" content="([^"]*)"/) ||
      pick(html, /<title>([\s\S]*?)<\/title>/);
    const account =
      pick(html, /<a[^>]*id="js_name"[^>]*>([\s\S]*?)<\/a>/) ||
      pick(html, /<strong[^>]*class="profile_nickname"[^>]*>([\s\S]*?)<\/strong>/) ||
      pick(html, /var nickname\s*=\s*"([^"]*)"/) ||
      pick(html, /var user_name\s*=\s*"([^"]*)"/) || "";
    let publishDate =
      pick(html, /<em[^>]*id="publish_time"[^>]*>([\s\S]*?)<\/em>/) ||
      pick(html, /var ct\s*=\s*"(\d+)"/) ||
      pick(html, /"createTime"\s*:\s*"?(\d{10})"?/);
    if (/^\d+$/.test(publishDate)) publishDate = new Date(parseInt(publishDate, 10) * 1000).toISOString().slice(0, 10);

    const contentHtml =
      sliceBetween(html, /<div[^>]*id="js_content"[^>]*>/, /<\/div>\s*(?:<script|<div[^>]*id="js_tags")/) ||
      sliceBetween(html, /<div[^>]*id="js_content"[^>]*>/, /<\/div>/) ||
      sliceBetween(html, /<div[^>]*class="rich_media_content"[^>]*>/, /<\/div>\s*<script/);
    const content = contentHtml ? htmlToText(contentHtml) : "";

    if (!content || content.length < 20) {
      return json({ error: "未能解析到正文（可能是图片/视频类推送或页面结构特殊），请尝试粘贴正文。", title, account }, 422);
    }

    const payload = { title, account, publishDate, url: finalUrl, content };
    if (mpKey) await kvSetBlob(["art", mpKey], payload, 86_400_000);
    return json(payload);
  } catch (err) {
    return json({ error: (err as Error)?.message || "抓取失败" }, 500);
  }
}

/* ──────────────── /api/chat (streaming proxy) ──────────────── */

async function handleChat(req: Request) {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let body: { provider?: string; model?: string; key?: string; messages?: unknown[] };
  try {
    body = await req.json();
  } catch {
    return json({ error: "请求体不是合法 JSON" }, 400);
  }
  const { provider = "openai", model, key, messages } = body;
  const cfg = PROVIDERS[provider];
  if (!cfg) return json({ error: `未知的 provider: ${provider}` }, 400);
  if (!key) return json({ error: "缺少 API Key" }, 400);
  if (!Array.isArray(messages) || !messages.length) return json({ error: "messages 不能为空" }, 400);

  let upstream: Response;
  try {
    upstream = await fetch(cfg.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: model || cfg.models[0], messages, stream: true, temperature: 0.4 }),
    });
  } catch (err) {
    return json({ error: (err as Error)?.message || "代理请求失败" }, 502);
  }

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => "");
    let msg = `上游 ${cfg.label} 返回 ${upstream.status}`;
    try {
      msg = JSON.parse(errText).error?.message || msg;
    } catch { /* keep default */ }
    return json({ error: msg }, upstream.status || 502);
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      ...CORS,
    },
  });
}

/* ──────────────── /api/data (workspace) ──────────────── */

const CODE_RE = /^[a-z0-9]{4,8}(-[a-z0-9]{4,8}){1,5}$/i;
const MAX_ARTICLES = 500;
const MAX_BYTES = 2_000_000;

type Article = {
  id: string; account: string; publishDate: string; title: string;
  url: string; content: string; summary: string; analyzedAt: string | null; createdAt: string | null;
};

function sanitize(a: Record<string, unknown>): Article {
  return {
    id: String(a.id ?? ""),
    account: String(a.account ?? ""),
    publishDate: String(a.publishDate ?? ""),
    title: String(a.title ?? ""),
    url: String(a.url ?? ""),
    content: String(a.content ?? ""),
    summary: String(a.summary ?? ""),
    analyzedAt: (a.analyzedAt as string) ?? null,
    createdAt: (a.createdAt as string) ?? null,
  };
}

async function handleData(req: Request, url: URL) {
  const ws = (url.searchParams.get("ws") || "").trim().toLowerCase();
  if (!CODE_RE.test(ws)) return json({ error: "工作区码格式不正确" }, 400);
  const prefix = ["ws", ws];

  if (req.method === "GET") {
    const got = await kvGetBlob<{ articles: Article[] }>(prefix);
    if (!got) return json({ articles: [], updatedAt: null, fresh: true });
    return json({ articles: got.data.articles || [], updatedAt: got.updatedAt });
  }

  if (req.method === "PUT" || req.method === "POST") {
    let body: { articles?: unknown };
    try {
      body = await req.json();
    } catch {
      return json({ error: "请求体不是合法 JSON" }, 400);
    }
    if (!Array.isArray(body.articles)) return json({ error: "缺少 articles 数组" }, 400);
    let articles = (body.articles as Record<string, unknown>[]).map(sanitize);
    if (articles.length > MAX_ARTICLES) articles = articles.slice(0, MAX_ARTICLES);
    const payload = { articles, updatedAt: new Date().toISOString() };
    if (new TextEncoder().encode(JSON.stringify(payload)).length > MAX_BYTES) {
      return json({ error: "工作区数据超出上限（约 2MB），请清理后再试" }, 413);
    }
    const { updatedAt } = await kvSetBlob(prefix, payload);
    return json({ ok: true, updatedAt });
  }

  return json({ error: "Method not allowed" }, 405);
}

/* ──────────────── router ──────────────── */

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const url = new URL(req.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  try {
    if (path === "/api/search") return await handleSearch(url);
    if (path === "/api/article") return await handleArticle(url);
    if (path === "/api/chat") return await handleChat(req);
    if (path === "/api/data") return await handleData(req, url);
    if (path === "/" || path === "/api") {
      return json({ ok: true, service: "wechat-digest-backend", endpoints: ["/api/search", "/api/article", "/api/chat", "/api/data"] });
    }
    return json({ error: "Not found" }, 404);
  } catch (err) {
    return json({ error: (err as Error)?.message || "服务器错误" }, 500);
  }
});
