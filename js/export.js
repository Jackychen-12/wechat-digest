import * as S from "./state.js";
import { today, toast } from "./helpers.js";
import { listSkills } from "./skills/registry.js";

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

export function exportJSON() {
  if (!S.articles.length) { toast("没有文章可导出", true); return; }
  const blob = new Blob([JSON.stringify(S.articles, null, 2)], { type: "application/json" });
  downloadBlob(blob, `wechat-digest_${today()}.json`);
  toast(`已导出 ${S.articles.length} 篇文章 (JSON)`);
}

export function exportCSV() {
  if (!S.articles.length) { toast("没有文章可导出", true); return; }

  const skills = listSkills();
  const headers = ["公众号", "标题", "发布日期", "链接", "字数"];
  skills.forEach((s) => headers.push(`${s.name}（摘要）`));
  headers.push("创建时间");

  const rows = S.articles.map((a) => {
    const row = [
      a.account || "",
      a.title || "",
      a.publishDate || "",
      a.url || "",
      String(a.content?.length || 0),
    ];
    skills.forEach((s) => {
      const r = a.skills?.[s.id]?.result || "";
      row.push(r.replace(/\n/g, " ").slice(0, 200));
    });
    row.push(a.createdAt || "");
    return row;
  });

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, `wechat-digest_${today()}.csv`);
  toast(`已导出 ${S.articles.length} 篇文章 (CSV)`);
}
