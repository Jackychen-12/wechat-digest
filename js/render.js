import * as S from "./state.js";
import { $, byId, esc, formatMarkdown, hasKey } from "./helpers.js";
import { runSkill } from "./skills/registry.js";
import { scheduleSync } from "./workspace.js";
import { updateProviderChip } from "./settings.js";

export function renderAll() {
  renderList();
  updateStats();
  updateProviderChip();
  if (S.activeId && S.articles.find((a) => a.id === S.activeId)) renderDetail(byId(S.activeId));
  else showEmpty();
}

export function updateStats() {
  const analyzed = S.articles.filter((a) => a.summary).length;
  $("stat-articles").textContent = S.articles.length;
  $("stat-analyzed").textContent = analyzed;
  $("article-count").textContent = S.articles.length;
  $("analyzed-count").textContent = analyzed;
}

function getFiltered() {
  const kw = $("keyword").value.trim().toLowerCase();
  const acc = $("filter-account").value.trim().toLowerCase();
  const date = $("filter-date").value;
  return S.articles.filter((a) => {
    const mk = !kw || a.title.toLowerCase().includes(kw) || a.content.toLowerCase().includes(kw);
    const ma = !acc || (a.account || "").toLowerCase().includes(acc);
    const md = !date || a.publishDate === date;
    return mk && ma && md;
  });
}

export function renderList() {
  const filtered = getFiltered();
  const el = $("article-list");
  el.innerHTML = "";
  if (!filtered.length) {
    el.innerHTML = `<li class="list-empty">${
      S.articles.length ? "没有符合条件的文章" : "本工作区暂无文章<br/>在上方抓取，或加载示例数据"
    }</li>`;
    return;
  }
  const tpl = $("tpl-article-item");
  filtered.forEach((a, i) => {
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.style.animationDelay = `${i * 0.03}s`;
    if (a.id === S.activeId) node.classList.add("active");
    node.querySelector(".ai-meta").textContent = `${a.account || "未知"} · ${a.publishDate || ""}`;
    const badge = node.querySelector(".ai-badge");
    badge.textContent = a.summary ? "已分析" : "待分析";
    badge.classList.add(a.summary ? "done" : "todo");
    node.querySelector(".ai-title").textContent = a.title;
    node.querySelector(".ai-preview").textContent = a.content.slice(0, 80);
    node.addEventListener("click", () => selectArticle(a.id));
    el.appendChild(node);
  });
}

export function selectArticle(id) {
  S.setActiveId(id);
  renderList();
  renderDetail(byId(id));
}

export function showEmpty() {
  $("detail-empty").style.display = "flex";
  $("detail-content").style.display = "none";
}

export function renderDetail(a) {
  if (!a) return showEmpty();
  $("detail-empty").style.display = "none";
  $("detail-content").style.display = "block";
  const analyzed = !!a.summary;

  $("detail-content").innerHTML = `
    <div class="detail-head">
      <div class="detail-meta">
        <span>${esc(a.account || "未知公众号")}</span><span>·</span><span>${esc(a.publishDate || "")}</span>
        ${a.url ? `<span>·</span><a href="${esc(a.url)}" target="_blank" rel="noopener">查看原文 ↗</a>` : ""}
      </div>
      <div class="detail-title">${esc(a.title)}</div>
      <div class="detail-bar">
        <button class="btn-solid sm" id="d-analyze">${analyzed ? "重新分析" : "AI 分析"}</button>
        <button class="btn-danger" id="d-delete">删除</button>
      </div>
    </div>

    <div class="analysis-block">
      <div class="analysis-label">AI 结构化分析</div>
      <div class="analysis-out" id="analysis-out">${
        analyzed
          ? formatMarkdown(a.summary)
          : '<span class="placeholder">尚未分析。点击「AI 分析」自动生成一句话总结、核心观点、关键数据与标签。</span>'
      }</div>
      <div class="prompt-row">
        <input id="d-prompt" placeholder="自定义分析指令（可选），如：侧重投资视角、提炼可执行清单" />
        <button class="btn-line sm" id="d-gen">生成</button>
      </div>
    </div>

    <div class="analysis-block">
      <div class="analysis-label">原文正文</div>
      <button class="content-toggle" id="d-toggle">展开全文（${a.content.length} 字）</button>
      <div class="content-full" id="d-content" style="display:none">${esc(a.content)}</div>
    </div>
  `;

  const run = () => runSkill("digest", a, $("analysis-out"), $("d-prompt").value.trim());
  $("d-analyze").addEventListener("click", run);
  $("d-gen").addEventListener("click", run);
  $("d-delete").addEventListener("click", () => deleteArticle(a.id));
  $("d-toggle").addEventListener("click", () => {
    const c = $("d-content");
    const open = c.style.display !== "none";
    c.style.display = open ? "none" : "block";
    $("d-toggle").textContent = open ? `展开全文（${a.content.length} 字）` : "收起正文";
  });
}

export function deleteArticle(id) {
  S.setArticles(S.articles.filter((a) => a.id !== id));
  scheduleSync();
  if (S.activeId === id) {
    S.setActiveId(null);
    showEmpty();
  }
  renderList();
  updateStats();
}
