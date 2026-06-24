import { registerSkill } from "./registry.js";

registerSkill({
  id: "sentiment",
  name: "情感与立场",
  icon: "🎭",
  description: "判断文章情感倾向、立场和可信度",
  multi: false,
  buildPrompt(article, instruction) {
    return {
      system: "你是一名舆情分析专家，擅长判断文章的情感倾向、作者立场和信息可信度。输出必须为简洁、结构化的 Markdown。",
      user: `分析以下公众号文章的情感与立场：
【标题】${article.title}
【公众号】${article.account || "未知"}
【正文】${article.content}

请按以下结构输出，每个小标题用「## 」开头，要点用「- 」列表：
## 情感倾向
正面 / 中性 / 负面，程度（强/中/弱），并说明判断依据
## 核心立场
作者在关键议题上持什么态度，支持什么、反对什么
## 修辞手法
使用了哪些说服技巧（如数据支撑、情感诉求、权威引用、类比论证等）
## 潜在偏见
可能存在的信息偏差、遗漏的重要视角、利益相关方
## 可信度评估
给出 1-10 分评分，从论据充分性、信源质量、逻辑严谨度三个维度说明

补充指令：${instruction || "无"}`,
    };
  },
});
