import { registerSkill } from "./registry.js";
import { SYS_PROMPT } from "../config.js";

function buildUserMsg(article, instruction) {
  return (
    `【文章标题】${article.title}\n【公众号】${article.account || "未知"}\n【发布日期】${article.publishDate || "未知"}\n\n` +
    `【正文】\n${article.content}\n\n---\n` +
    `请按以下结构输出分析，每个小标题用「## 」开头，要点用「- 」列表：\n` +
    `## 一句话总结\n## 核心观点\n## 关键数据 / 事实\n## 关键词标签\n## 价值与适用人群\n\n` +
    `补充指令：${instruction || "无"}`
  );
}

registerSkill({
  id: "digest",
  name: "结构化摘要",
  icon: "📋",
  description: "提炼核心观点、关键数据、标签",
  multi: false,
  buildPrompt(article, instruction) {
    return { system: SYS_PROMPT, user: buildUserMsg(article, instruction) };
  },
});
