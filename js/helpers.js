import { BACKEND_BASE } from "./config.js";
import * as S from "./state.js";

export const $ = (id) => document.getElementById(id);

export function makeArticle(o) {
  return {
    id: crypto.randomUUID(),
    account: o.account || "",
    publishDate: o.publishDate || today(),
    title: o.title || "",
    url: o.url || "",
    content: o.content || "",
    summary: o.summary || "",
    analyzedAt: o.summary ? new Date().toISOString() : null,
    createdAt: new Date().toISOString(),
  };
}

export function byId(id) {
  return S.articles.find((a) => a.id === id);
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function apiUrl(path) {
  const base = (S.settings.apiBase || BACKEND_BASE || "").replace(/\/+$/, "");
  return base + path;
}

export function backendConfigured() {
  return !!(S.settings.apiBase || BACKEND_BASE);
}

export function openModal(id) {
  $(id).style.display = "flex";
}

export function closeAllModals() {
  document.querySelectorAll(".modal-overlay").forEach((m) => (m.style.display = "none"));
}

let toastTimer;
export function toast(msg, isErr) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.toggle("err", !!isErr);
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
}

export function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function formatMarkdown(md) {
  const lines = String(md).split("\n");
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  let html = "";
  let inList = false;
  const closeList = () => {
    if (inList) { html += "</ul>"; inList = false; }
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (/^#{1,6}\s+/.test(line)) {
      closeList();
      html += `<h2>${inline(line.replace(/^#{1,6}\s+/, ""))}</h2>`;
    } else if (/^[-*]\s+/.test(line)) {
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`;
    } else if (!line) {
      closeList();
    } else {
      closeList();
      html += `<p>${inline(line)}</p>`;
    }
  }
  closeList();
  return html;
}

export function hasKey() {
  return !!S.settings.keys[S.settings.provider];
}
