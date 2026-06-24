import * as S from "./state.js";
import { $, apiUrl, backendConfigured, makeArticle, today, toast, hasKey, openModal, closeAllModals } from "./helpers.js";
import { openSettings } from "./settings.js";
import { scheduleSync } from "./workspace.js";
import { renderAll, selectArticle } from "./render.js";
import { runSkill } from "./skills/registry.js";

export async function crawl(input) {
  if (!input) {
    toast("请输入公众号名称", true);
    return;
  }
  if (!backendConfigured()) {
    toast("自动抓取需要后端：请在「设置 → 后端 API 地址」填入你的 Deno Deploy 地址", true);
    openSettings();
    return;
  }

  const accounts = input.split(/[,，\n]+/).map((s) => s.trim()).filter(Boolean);
  if (!accounts.length) { toast("请输入公众号名称", true); return; }

  const btn = $("crawl-btn");
  const old = btn.textContent;
  btn.disabled = true;

  const allResults = [];
  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    btn.textContent = accounts.length > 1 ? `抓取中 ${i + 1}/${accounts.length}` : "抓取中…";
    try {
      const res = await fetch(apiUrl(`/api/search?account=${encodeURIComponent(account)}`));
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const articles = (data.articles || []).map((a) => ({ ...a, _source: account }));
      allResults.push(...articles);
    } catch (err) {
      toast(`「${account}」抓取失败：${err.message}`, true);
    }
  }

  S.setCrawlResults(allResults);
  btn.disabled = false;
  btn.textContent = old;

  if (allResults.length) {
    openResults(accounts.length > 1 ? accounts.join("、") : accounts[0], allResults);
  } else {
    toast("未找到任何文章", true);
  }
}

export async function loadMoreResults(account) {
  const currentPage = S.crawlResults._page || 1;
  const nextPage = currentPage + 1;
  try {
    toast(`加载第 ${nextPage} 页…`);
    const res = await fetch(apiUrl(`/api/search?account=${encodeURIComponent(account)}&page=${nextPage}`));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    const newArticles = data.articles || [];
    if (!newArticles.length) {
      toast("没有更多结果了");
      return;
    }
    S.crawlResults.push(...newArticles);
    S.crawlResults._page = nextPage;
    openResults(account, S.crawlResults);
    toast(`已加载第 ${nextPage} 页，共 ${S.crawlResults.length} 条`);
  } catch (err) {
    toast(`加载失败：${err.message}`, true);
  }
}

function openResults(account, list) {
  $("results-account").textContent = account;
  $("results-select-all").checked = false;
  const ul = $("results-list");
  ul.innerHTML = "";
  if (!list.length) {
    ul.innerHTML =
      '<li class="results-empty">未找到文章。可能是名称不精确，或搜狗暂时限制了访问。可改用「粘贴文章链接」。</li>';
  } else {
    const tpl = $("tpl-result-item");
    list.forEach((item, i) => {
      const node = tpl.content.firstElementChild.cloneNode(true);
      const check = node.querySelector(".result-check");
      check.value = i;
      const source = item._source ? `${item._source} · ` : "";
      node.querySelector(".result-meta").textContent =
        `${source}${item.account || "未知"} · ${item.publishDate || "日期未知"}`;
      node.querySelector(".result-title").textContent = item.title;
      node.querySelector(".result-summary").textContent = item.summary || "";
      ul.appendChild(node);
    });
  }
  openModal("results-modal");
}

export async function importSelected() {
  const checked = [...document.querySelectorAll(".result-check:checked")];
  if (!checked.length) {
    toast("请先勾选要导入的文章", true);
    return;
  }
  const autoAnalyze = $("results-auto-analyze").checked;
  const btn = $("import-selected-btn");
  btn.disabled = true;

  const picked = checked.map((c) => S.crawlResults[+c.value]);
  closeAllModals();
  let imported = 0;
  let skipped = 0;
  const added = [];
  const existingKeys = new Set(S.articles.map((a) => `${a.account}::${a.title}`));

  for (let i = 0; i < picked.length; i++) {
    const item = picked[i];
    btn.textContent = `导入中 ${i + 1}/${picked.length}`;
    toast(`正在解析正文 ${i + 1}/${picked.length}…`);
    try {
      const res = await fetch(apiUrl(`/api/article?url=${encodeURIComponent(item.sogouLink)}`));
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.content) throw new Error(data.error || "解析失败");
      const title = data.title || item.title;
      const account = data.account || item.account || "未知公众号";
      const key = `${account}::${title}`;
      if (existingKeys.has(key)) {
        skipped++;
        continue;
      }
      existingKeys.add(key);
      const article = makeArticle({
        account,
        publishDate: data.publishDate || item.publishDate || today(),
        title,
        url: data.url || "",
        content: data.content,
      });
      S.articles.unshift(article);
      added.push(article);
      imported++;
    } catch (err) {
      toast(`「${item.title.slice(0, 12)}…」导入失败：${err.message}`, true);
    }
  }

  scheduleSync();
  renderAll();
  btn.disabled = false;
  btn.textContent = "导入选中";
  if (imported) {
    const msg = skipped ? `成功导入 ${imported} 篇，跳过 ${skipped} 篇重复` : `成功导入 ${imported} 篇`;
    toast(msg);
    selectArticle(added[0].id);
    if (autoAnalyze && hasKey()) {
      for (const a of added) await runSkill("digest", a, a.id === S.activeId ? $("analysis-out") : null);
      toast("全部分析完成");
    } else if (autoAnalyze && !hasKey()) {
      toast("已导入，但未配置 API Key，跳过自动分析", true);
    }
  } else if (skipped) {
    toast(`${skipped} 篇文章已存在，全部跳过`);
  }
}

export async function parseLink(url) {
  if (!url) {
    toast("请输入文章链接", true);
    return;
  }
  if (!backendConfigured()) {
    toast("解析链接需要后端：请在「设置 → 后端 API 地址」填入你的 Deno Deploy 地址", true);
    openSettings();
    return;
  }
  const btn = $("parse-link-btn");
  const old = btn.textContent;
  btn.disabled = true;
  btn.textContent = "解析中…";
  try {
    const res = await fetch(apiUrl(`/api/article?url=${encodeURIComponent(url)}`));
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.content) throw new Error(data.error || `HTTP ${res.status}`);
    const article = makeArticle({
      account: data.account || "未知公众号",
      publishDate: data.publishDate || today(),
      title: data.title || "未命名文章",
      url: data.url || url,
      content: data.content,
    });
    S.articles.unshift(article);
    scheduleSync();
    renderAll();
    selectArticle(article.id);
    $("link-input").value = "";
    toast("解析成功");
  } catch (err) {
    toast(`解析失败：${err.message}`, true);
  } finally {
    btn.disabled = false;
    btn.textContent = old;
  }
}
