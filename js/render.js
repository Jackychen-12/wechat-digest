import * as S from "./state.js";
import { $, byId, esc, formatMarkdown } from "./helpers.js";
import {
  listSkills, getActiveSkillId, setActiveSkillId,
  runSkill, getSkillResult, hasSkillResult, countSkillsDone,
} from "./skills/registry.js";
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
  const total = S.articles.length;
  const analyzed = S.articles.filter((a) => countSkillsDone(a) > 0).length;
  $("stat-articles").textContent = total;
  $("stat-analyzed").textContent = analyzed;
  $("article-count").textContent = total;
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
  const allSkills = listSkills();
  const tpl = $("tpl-article-item");
  filtered.forEach((a, i) => {
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.style.animationDelay = `${i * 0.03}s`;
    if (a.id === S.activeId) node.classList.add("active");
    node.querySelector(".ai-meta").textContent = `${a.account || "未知"} · ${a.publishDate || ""}`;
    const badge = node.querySelector(".ai-badge");
    const done = countSkillsDone(a);
    if (done >= allSkills.length) {
      badge.textContent = "全部完成";
      badge.classList.add("done");
    } else if (done > 0) {
      badge.textContent = `${done}/${allSkills.length}`;
      badge.classList.add("partial");
    } else {
      badge.textContent = "待分析";
      badge.classList.add("todo");
    }
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

  const allSkills = listSkills();
  const activeSkill = getActiveSkillId();
  const cached = getSkillResult(a, activeSkill);

  const skillTabs = allSkills.map((s) => {
    const done = hasSkillResult(a, s.id);
    const active = s.id === activeSkill;
    return `<button class="skill-tab${active ? " active" : ""}${done ? " done" : ""}" data-skill="${s.id}">${s.icon} ${s.name}</button>`;
  }).join("");

  $("detail-content").innerHTML = `
    <div class="detail-head">
      <div class="detail-meta">
        <span>${esc(a.account || "未知公众号")}</span><span>·</span><span>${esc(a.publishDate || "")}</span>
        ${a.url ? `<span>·</span><a href="${esc(a.url)}" target="_blank" rel="noopener">查看原文 ↗</a>` : ""}
      </div>
      <div class="detail-title">${esc(a.title)}</div>
    </div>

    <div class="analysis-block">
      <div class="skill-tabs">${skillTabs}</div>
      <div class="analysis-out" id="analysis-out">${
        cached
          ? formatMarkdown(cached)
          : `<span class="placeholder">尚未运行「${allSkills.find(s => s.id === activeSkill)?.name || activeSkill}」分析。点击下方「生成」开始。</span>`
      }</div>
      <div class="prompt-row">
        <input id="d-prompt" placeholder="自定义指令（可选），如：侧重投资视角、提炼可执行清单" />
        <button class="btn-solid sm" id="d-gen">生成</button>
        <button class="btn-danger sm" id="d-delete">删除文章</button>
      </div>
    </div>

    <div class="analysis-block">
      <div class="analysis-label">原文正文</div>
      <button class="content-toggle" id="d-toggle">展开全文（${a.content.length} 字）</button>
      <div class="content-full" id="d-content" style="display:none">${esc(a.content)}</div>
    </div>
  `;

  $("d-gen").addEventListener("click", () => {
    runSkill(getActiveSkillId(), a, $("analysis-out"), $("d-prompt").value.trim());
  });
  $("d-delete").addEventListener("click", () => deleteArticle(a.id));
  $("d-toggle").addEventListener("click", () => {
    const c = $("d-content");
    const open = c.style.display !== "none";
    c.style.display = open ? "none" : "block";
    $("d-toggle").textContent = open ? `展开全文（${a.content.length} 字）` : "收起正文";
  });

  $("detail-content").querySelectorAll(".skill-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      setActiveSkillId(tab.dataset.skill);
      renderDetail(a);
    });
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
