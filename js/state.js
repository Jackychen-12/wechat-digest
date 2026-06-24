import { WS_KEY, SETTINGS_KEY, artKey, metaKey, BACKEND_BASE } from "./config.js";

export let wsCode = "";
export let settings = {};
export let articles = [];
export let activeId = null;
export let crawlResults = [];
export let cloudMode = "unknown";
export let localUpdatedAt = null;
export let syncTimer = null;

export function setWsCode(v) { wsCode = v; }
export function setSettings(v) { settings = v; }
export function setArticles(v) { articles = v; }
export function setActiveId(v) { activeId = v; }
export function setCrawlResults(v) { crawlResults = v; }
export function setCloudMode(v) { cloudMode = v; }
export function setLocalUpdatedAt(v) { localUpdatedAt = v; }
export function setSyncTimer(v) { syncTimer = v; }

export function loadArticlesLocal(code) {
  try {
    return JSON.parse(localStorage.getItem(artKey(code))) || [];
  } catch {
    return [];
  }
}

export function saveArticlesLocal() {
  localStorage.setItem(artKey(wsCode), JSON.stringify(articles));
}

export function loadMetaLocal(code) {
  return localStorage.getItem(metaKey(code)) || null;
}

export function saveMetaLocal() {
  if (localUpdatedAt) localStorage.setItem(metaKey(wsCode), localUpdatedAt);
}

export function loadSettings() {
  const def = {
    provider: "openai",
    model: "gpt-4o-mini",
    apiBase: "",
    keys: { openai: "", deepseek: "", dashscope: "" },
  };
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    return s ? { ...def, ...s, keys: { ...def.keys, ...(s.keys || {}) } } : def;
  } catch {
    return def;
  }
}

export function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function initState() {
  wsCode = resolveWsCode();
  settings = loadSettings();
  articles = loadArticlesLocal(wsCode);
  activeId = null;
  crawlResults = [];
  cloudMode = "unknown";
  localUpdatedAt = loadMetaLocal(wsCode);
  syncTimer = null;
}

function resolveWsCode() {
  const fromHash = (location.hash.match(/ws=([a-z0-9-]+)/i) || [])[1];
  if (fromHash && isValidCode(fromHash)) {
    localStorage.setItem(WS_KEY, fromHash.toLowerCase());
    return fromHash.toLowerCase();
  }
  const stored = localStorage.getItem(WS_KEY);
  if (stored && isValidCode(stored)) {
    syncHash(stored);
    return stored;
  }
  const fresh = genCode();
  localStorage.setItem(WS_KEY, fresh);
  syncHash(fresh);
  return fresh;
}

export function isValidCode(c) {
  return /^[a-z0-9]{4,8}(-[a-z0-9]{4,8}){1,5}$/i.test((c || "").trim());
}

export function genCode() {
  const buf = new Uint8Array(9);
  crypto.getRandomValues(buf);
  const hex = [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}

export function syncHash(code) {
  const url = `${location.pathname}${location.search}#ws=${code}`;
  history.replaceState(null, "", url);
}
