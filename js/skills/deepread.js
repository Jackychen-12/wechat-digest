import { registerSkill } from "./registry.js";

registerSkill({
  id: "deepread",
  name: "深度追问",
  icon: "🔍",
  description: "批判性追问、反面论据、延伸阅读",
  multi: false,
  buildPrompt(article, instruction) {
    return {
      system: "你是一名批判性思维专家，擅长对公众号文章提出深度追问，帮助读者更全面、更批判地理解内容。输出必须为简洁、结构化的 Markdown。",
      user: `针对以下公众号文章进行深度追问分析：
【标题】${article.title}
【公众号】${article.account || "未知"}
【正文】${article.content}

请按以下结构输出，每个小标题用「## 」开头，要点用「- 」列表：
## 文章未回答的关键问题
列出 3-5 个文章没有解答但读者应该关心的问题
## 反面论据
如果要反驳文章核心观点，最有力的 2-3 个论据是什么
## 延伸阅读方向
要更全面理解这个话题，还应该了解哪些领域或视角
## 数据验证
文章中的关键数据和结论哪些有待验证，如何验证
## 行动建议
基于文章内容，读者可以采取的具体下一步行动

补充指令：${instruction || "无"}`,
    };
  },
});
