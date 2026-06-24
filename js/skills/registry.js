import { PROVIDERS } from "../config.js";
import * as S from "../state.js";
import { $, apiUrl, backendConfigured, hasKey, formatMarkdown, esc, toast } from "../helpers.js";
import { openSettings } from "../settings.js";
import { scheduleSync } from "../workspace.js";
import { renderList, updateStats } from "../render.js";

const skills = new Map();

export function registerSkill(skill) {
  skills.set(skill.id, skill);
}

export function getSkill(id) {
  return skills.get(id);
}

export function listSkills() {
  return [...skills.values()];
}

export async function runSkill(skillId, article, outEl, instruction) {
  const skill = skills.get(skillId);
  if (!skill) {
    toast(`未知技能: ${skillId}`, true);
    return false;
  }

  const cfg = PROVIDERS[S.settings.provider];
  const key = S.settings.keys[S.settings.provider];
  if (!backendConfigured()) {
    toast("AI 分析需要后端代理：请在「设置 → 后端 API 地址」填入你的 Deno Deploy 地址", true);
    openSettings();
    return false;
  }
  if (!key) {
    toast(`请先在设置中配置 ${cfg.label} 的 API Key`, true);
    openSettings();
    return false;
  }

  const { system, user } = skill.buildPrompt(article, instruction);

  if (outEl) outEl.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';
  let result = "";

  try {
    const res = await fetch(apiUrl("/api/chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: S.settings.provider,
        model: S.settings.model,
        key,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.error || `HTTP ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop();
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith("data:")) continue;
        const d = t.slice(5).trim();
        if (d === "[DONE]") continue;
        try {
          const delta = JSON.parse(d).choices?.[0]?.delta?.content;
          if (delta) {
            result += delta;
            if (outEl) {
              outEl.innerHTML = formatMarkdown(result) + '<span class="typing-cursor"></span>';
            }
          }
        } catch {}
      }
    }

    if (!result.trim()) throw new Error("模型未返回内容");
    article.summary = result;
    article.analyzedAt = new Date().toISOString();
    scheduleSync();
    if (outEl) outEl.innerHTML = formatMarkdown(result);
    renderList();
    updateStats();
    return true;
  } catch (err) {
    if (outEl) outEl.innerHTML = `<div class="err">分析失败：${esc(err.message)}</div>`;
    toast(`分析失败：${err.message}`, true);
    return false;
  }
}

export async function runAllPending(skillId) {
  if (!hasKey()) {
    toast("请先在设置中配置 API Key", true);
    openSettings();
    return;
  }
  const pending = S.articles.filter((a) => !a.summary);
  if (!pending.length) {
    toast("没有待分析的文章");
    return;
  }
  const btn = $("analyze-all-btn");
  btn.disabled = true;
  for (let i = 0; i < pending.length; i++) {
    btn.textContent = `分析中 ${i + 1}/${pending.length}`;
    const a = pending[i];
    await runSkill(skillId, a, a.id === S.activeId ? $("analysis-out") : null);
  }
  btn.disabled = false;
  btn.textContent = "⚡ 一键分析未分析";
  toast(`完成 ${pending.length} 篇分析`);
}
