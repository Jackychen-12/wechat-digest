export const BACKEND_BASE = "";

export const WS_KEY = "wcd_ws";
export const SETTINGS_KEY = "wcd_settings_v2";
export const artKey = (code) => `wcd_art_${code}`;
export const metaKey = (code) => `wcd_meta_${code}`;

export const PROVIDERS = {
  openai: { label: "OpenAI", models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"], note: "需国外网络访问" },
  deepseek: { label: "DeepSeek", models: ["deepseek-chat", "deepseek-reasoner"], note: "国内可直连，性价比高" },
  dashscope: { label: "通义千问", models: ["qwen-plus", "qwen-turbo", "qwen-max"], note: "阿里云百炼控制台获取" },
};

export const SYS_PROMPT =
  "你是一名资深的中文内容分析师，擅长从公众号文章中快速提炼结构化要点。输出必须为简洁、信息密度高的 Markdown。";
