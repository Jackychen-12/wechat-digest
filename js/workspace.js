import { WS_KEY } from "./config.js";
import * as S from "./state.js";
import { $, apiUrl, backendConfigured } from "./helpers.js";
import { renderAll } from "./render.js";

export function renderWsCode() {
  $("ws-code-label").textContent = S.wsCode;
  const cur = $("switch-current");
  if (cur) cur.textContent = S.wsCode;
}

export async function initSync() {
  if (!backendConfigured()) {
    S.setCloudMode("local");
    setSync("local", "未配置后端");
    return;
  }
  setSync("syncing", "同步中…");
  try {
    const res = await fetch(apiUrl(`/api/data?ws=${encodeURIComponent(S.wsCode)}`));
    if (res.status === 501) {
      S.setCloudMode("local");
      setSync("local", "本地模式");
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    S.setCloudMode("cloud");

    const merged = mergeArticles(S.articles, data.articles || []);
    const changed = merged.length !== S.articles.length || JSON.stringify(merged) !== JSON.stringify(S.articles);
    S.setArticles(merged);
    S.saveArticlesLocal();
    renderAll();

    if (changed && (data.articles || []).length !== merged.length) {
      await pushCloud();
    } else {
      setSync("ok", "已同步");
    }
  } catch (err) {
    S.setCloudMode(S.cloudMode === "cloud" ? "cloud" : "local");
    setSync("err", "离线（仅本地）");
  }
}

function mergeArticles(localArr, cloudArr) {
  const map = new Map();
  const keyOf = (a) => a.id || `${a.account}::${a.title}`;
  for (const a of cloudArr) map.set(keyOf(a), a);
  for (const a of localArr) {
    const k = keyOf(a);
    const existing = map.get(k);
    if (!existing) {
      map.set(k, a);
    } else {
      const score = (x) => (x.summary ? 2 : 0) + (x.analyzedAt ? 1 : 0);
      if (score(a) >= score(existing)) map.set(k, a);
    }
  }
  return [...map.values()].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
}

export function scheduleSync() {
  S.saveArticlesLocal();
  if (S.cloudMode !== "cloud") return;
  setSync("syncing", "同步中…");
  clearTimeout(S.syncTimer);
  S.setSyncTimer(setTimeout(pushCloud, 1100));
}

async function pushCloud() {
  if (S.cloudMode !== "cloud") return;
  try {
    const res = await fetch(apiUrl(`/api/data?ws=${encodeURIComponent(S.wsCode)}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articles: S.articles }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    S.setLocalUpdatedAt(data.updatedAt || new Date().toISOString());
    S.saveMetaLocal();
    setSync("ok", "已同步");
  } catch (err) {
    setSync("err", "同步失败");
  }
}

function setSync(state, text) {
  const pill = $("sync-status");
  pill.className = "sync-pill " + state;
  $("sync-text").textContent = text;
}

export async function loadWorkspace(code) {
  S.setWsCode(code);
  localStorage.setItem(WS_KEY, code);
  S.syncHash(code);
  S.setActiveId(null);
  S.setArticles(S.loadArticlesLocal(code));
  S.setLocalUpdatedAt(S.loadMetaLocal(code));
  renderWsCode();
  renderAll();
  await initSync();
}
