import * as S from "./state.js";
import { $, openModal, closeAllModals, toast } from "./helpers.js";
import { renderWsCode, loadWorkspace, scheduleSync, initSync } from "./workspace.js";
import { openSettings, selectProviderTab, saveSettingsFromUI } from "./settings.js";
import { renderAll, renderList, selectArticle } from "./render.js";
import { crawl, importSelected, parseLink } from "./crawl.js";
import { addArticle, loadDemo, importJson, clearAll } from "./data.js";
import { runAllPending, getActiveSkillId } from "./skills/registry.js";

export function bindEvents() {
  $("hero-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = $("hero-account").value.trim();
    if (!v) return;
    $("account-input").value = v;
    $("workspace").scrollIntoView({ behavior: "smooth" });
    crawl(v);
  });

  $("crawl-btn").addEventListener("click", () => crawl($("account-input").value.trim()));
  $("account-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") crawl($("account-input").value.trim());
  });

  $("parse-link-btn").addEventListener("click", () => parseLink($("link-input").value.trim()));
  $("link-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") parseLink($("link-input").value.trim());
  });

  [$("keyword"), $("filter-account"), $("filter-date")].forEach((el) =>
    el.addEventListener("input", renderList)
  );
  $("clear-filters").addEventListener("click", () => {
    $("keyword").value = "";
    $("filter-account").value = "";
    $("filter-date").value = "";
    renderList();
  });

  $("analyze-all-btn").addEventListener("click", () => runAllPending(getActiveSkillId()));
  $("add-article-btn").addEventListener("click", () => openModal("add-modal"));
  $("open-settings").addEventListener("click", openSettings);
  $("load-demo-empty").addEventListener("click", loadDemo);

  $("copy-code-btn").addEventListener("click", copyCode);
  $("switch-ws-btn").addEventListener("click", () => {
    $("switch-code-input").value = "";
    renderWsCode();
    openModal("switch-modal");
  });
  $("copy-code-btn2").addEventListener("click", copyCode);
  $("switch-confirm-btn").addEventListener("click", confirmSwitch);
  $("new-ws-btn").addEventListener("click", newWorkspace);

  document.querySelectorAll("[data-close]").forEach((b) =>
    b.addEventListener("click", () => closeAllModals())
  );
  document.querySelectorAll(".modal-overlay").forEach((ov) =>
    ov.addEventListener("click", (e) => {
      if (e.target === ov) closeAllModals();
    })
  );

  $("results-select-all").addEventListener("change", (e) => {
    document.querySelectorAll(".result-check").forEach((c) => (c.checked = e.target.checked));
  });
  $("import-selected-btn").addEventListener("click", importSelected);

  $("provider-tabs").querySelectorAll("button").forEach((b) =>
    b.addEventListener("click", () => selectProviderTab(b.dataset.provider))
  );
  $("save-settings").addEventListener("click", saveSettingsFromUI);
  $("load-demo-btn").addEventListener("click", loadDemo);
  $("import-json-btn").addEventListener("click", () => $("import-file").click());
  $("import-file").addEventListener("change", importJson);
  $("clear-all-btn").addEventListener("click", clearAll);

  $("article-form").addEventListener("submit", addArticle);
}

function copyCode() {
  navigator.clipboard?.writeText(S.wsCode).then(
    () => toast("工作区码已复制，妥善保存即可换设备同步"),
    () => toast("复制失败，请手动选择复制", true)
  );
}

async function confirmSwitch() {
  const code = $("switch-code-input").value.trim().toLowerCase();
  if (!S.isValidCode(code)) {
    toast("工作区码格式不正确", true);
    return;
  }
  if (code === S.wsCode) {
    toast("已在该工作区");
    closeAllModals();
    return;
  }
  closeAllModals();
  await loadWorkspace(code);
  toast("已切换工作区");
}

async function newWorkspace() {
  closeAllModals();
  await loadWorkspace(S.genCode());
  toast("已新建空白工作区，记得复制保存新码");
}
