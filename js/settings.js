import { PROVIDERS } from "./config.js";
import * as S from "./state.js";
import { $, openModal, closeAllModals, toast, hasKey } from "./helpers.js";

export function openSettings() {
  applySettingsToUI();
  openModal("settings-modal");
}

export function selectProviderTab(provider) {
  S.settings.provider = provider;
  $("provider-tabs")
    .querySelectorAll("button")
    .forEach((b) => b.classList.toggle("active", b.dataset.provider === provider));
  const cfg = PROVIDERS[provider];
  const sel = $("model-select");
  sel.innerHTML = cfg.models.map((m) => `<option value="${m}">${m}</option>`).join("");
  if (cfg.models.includes(S.settings.model)) sel.value = S.settings.model;
  else S.settings.model = cfg.models[0];
  $("api-key").value = S.settings.keys[provider] || "";
  $("key-note").textContent = `· ${cfg.note}`;
}

export function applySettingsToUI() {
  selectProviderTab(S.settings.provider);
  $("model-select").value = S.settings.model;
  $("api-base").value = S.settings.apiBase || "";
}

export function saveSettingsFromUI() {
  S.settings.provider = $("provider-tabs").querySelector("button.active").dataset.provider;
  S.settings.model = $("model-select").value;
  S.settings.keys[S.settings.provider] = $("api-key").value.trim();
  S.settings.apiBase = $("api-base").value.trim().replace(/\/+$/, "");
  S.saveSettings();
  updateProviderChip();
  closeAllModals();
  toast("设置已保存");
}

export function updateProviderChip() {
  const cfg = PROVIDERS[S.settings.provider];
  const chip = $("provider-chip");
  if (hasKey()) {
    chip.textContent = `${cfg.label} · ${S.settings.model}`;
    chip.classList.add("ok");
  } else {
    chip.textContent = `${cfg.label} · 未配置 Key`;
    chip.classList.remove("ok");
  }
}
