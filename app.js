const STORAGE_KEY = "wechat_digest_articles";
const API_KEY_STORAGE = "wechat_digest_api_key";
const API_MODEL_STORAGE = "wechat_digest_api_model";

const articleForm = document.getElementById("article-form");
const articleList = document.getElementById("article-list");
const template = document.getElementById("article-item-template");
const summaryOutput = document.getElementById("summary-output");
const articleCountBadge = document.getElementById("article-count");

const keywordInput = document.getElementById("keyword");
const filterDateInput = document.getElementById("filter-date");
const filterAccountInput = document.getElementById("filter-account");
const clearFiltersBtn = document.getElementById("clear-filters");
const summarizeBtn = document.getElementById("summarize-btn");
const promptInput = document.getElementById("prompt");

const apiToggleBtn = document.getElementById("api-toggle-btn");
const apiBody = document.getElementById("api-body");
const apiKeyInput = document.getElementById("api-key");
const apiModelSelect = document.getElementById("api-model");
const saveApiBtn = document.getElementById("save-api");
const clearApiBtn = document.getElementById("clear-api");
const apiStatus = document.getElementById("api-status");

const loadDemoBtn = document.getElementById("load-demo");
const importBtn = document.getElementById("import-btn");
const importFile = document.getElementById("import-file");

/* ── Demo Data ── */

const DEMO_ARTICLES = [
  {
    id: "demo-1",
    account: "泽平宏观",
    publishDate: "2025-03-18",
    title: "2025年中国经济展望：新旧动能转换加速",
    url: "",
    content: "2025年中国经济正处于新旧动能转换的关键阶段。传统房地产和基建投资增速放缓，但新能源、人工智能、高端制造等新兴产业正在快速崛起。从宏观数据来看，一季度GDP增速预计在5%左右，消费端呈现温和复苏态势。值得关注的是，出口结构持续优化，新能源汽车、锂电池、光伏组件'新三样'出口占比持续提升。货币政策方面，央行维持稳健偏宽松的基调，LPR有进一步下调空间。财政政策预计更加积极，专项债规模有望扩大。对于投资者而言，建议关注三个方向：一是受益于AI算力需求的半导体和云计算产业链；二是具备全球竞争力的新能源车企；三是受益于消费复苏的品牌消费品。风险方面需要警惕海外利率维持高位对全球资本流动的影响，以及地缘政治不确定性。",
    createdAt: "2025-03-18T08:00:00.000Z"
  },
  {
    id: "demo-2",
    account: "晚点LatePost",
    publishDate: "2025-03-17",
    title: "大模型价格战背后：谁在亏钱，谁在布局",
    url: "",
    content: "2025年初，国内大模型市场掀起新一轮价格战。多家头部厂商将API调用价格下调50%-90%，部分模型甚至推出免费版本。这场价格战背后的逻辑并不简单。首先，模型推理成本确实在快速下降。得益于模型蒸馏、量化压缩和推理芯片迭代，同等性能的推理成本在过去一年下降了约70%。其次，各厂商的战略目的不同：头部玩家希望通过低价快速占领开发者生态；中小厂商则被迫跟进以保住市场份额。从商业模式看，单纯的API调用收入很难支撑大模型公司的估值。真正的盈利点在于：企业级定制部署（利润率30%+）、垂直行业解决方案（如金融风控、医疗辅助诊断）、以及基于模型能力构建的SaaS产品。值得注意的是，价格战正在加速行业洗牌，预计2025年底将有30%-40%的大模型创业公司面临资金链断裂或被收购的命运。",
    createdAt: "2025-03-17T10:30:00.000Z"
  },
  {
    id: "demo-3",
    account: "半佛仙人",
    publishDate: "2025-03-16",
    title: "为什么你存不下钱？从行为经济学说起",
    url: "",
    content: "很多人月薪一万五却存不下一分钱，月薪八千反而能攒下不少。这不是简单的'克制力'问题，而是行为经济学中的几个经典陷阱在起作用。第一个陷阱是'心理账户'。人们会无意识地把收入分成不同的'账户'：工资是辛苦钱要省着花，但年终奖是'额外收入'可以大手大脚——实际上钱就是钱，没有区别。第二个陷阱是'锚定效应'。当你每天打开购物App看到'原价899现价299'，你觉得自己赚了600块，实际上你花了299。商家设定的'原价'就是那个锚点。第三个陷阱是'即时满足偏好'。大脑天生偏好现在的快乐而非未来的收益。一杯30块的奶茶带来的即时愉悦感，远比'30年后多了30块退休金'来得真实。解决方案其实很简单：发工资当天自动转20%到不方便取出的账户（对抗即时满足）；设定24小时冷静期再下单（打破锚定效应）；把存款目标具象化，比如具体到'明年去日本旅行的机票钱'而非模糊的'存钱'。",
    createdAt: "2025-03-16T14:00:00.000Z"
  },
  {
    id: "demo-4",
    account: "虎嗅APP",
    publishDate: "2025-03-15",
    title: "Sora之后：AI视频生成的技术路线之争",
    url: "",
    content: "OpenAI的Sora发布后，AI视频生成赛道迅速升温。目前主要存在三条技术路线的竞争。第一条是Sora采用的Diffusion Transformer（DiT）路线，通过在视频潜空间中进行去噪生成。优势是生成质量高、物理一致性好，但计算成本极高，生成一段60秒视频需要消耗大量GPU算力。第二条是以Runway Gen-3为代表的图像到视频（I2V）路线。先生成关键帧，再通过插帧和运动估计生成中间帧。速度快，但容易出现运动不连贯的问题。第三条是国内可灵、智谱等采用的端到端路线，试图通过大规模视频数据训练一步到位。目前来看，没有哪条路线取得压倒性优势。实际落地场景中，短视频平台和广告行业是最先买单的。一条15秒的产品广告视频，传统制作成本约3-5万元，使用AI工具后成本降至几百元，但仍需人工审核和精修。预计2025年底，AI视频生成市场规模将达到50亿美元。",
    createdAt: "2025-03-15T09:00:00.000Z"
  },
  {
    id: "demo-5",
    account: "国务院政策发布",
    publishDate: "2025-03-14",
    title: "国务院印发促进民营经济发展若干措施",
    url: "",
    content: "国务院近日印发《关于促进民营经济高质量发展的若干措施》，从市场准入、融资支持、法治保障等六个方面提出28条具体措施。重点内容包括：一、市场准入方面，全面清理对民营企业设置的不合理准入门槛，电信、医疗、教育等领域将进一步放宽民间资本准入限制。二、融资支持方面，引导金融机构加大对民营企业贷款投放力度，鼓励银行设立民营企业专项信贷产品，降低综合融资成本。三、税费优惠方面，延续并优化小微企业税收减免政策，研发费用加计扣除比例提高至120%。四、法治保障方面，严格规范涉企执法行为，建立涉企案件经济影响评估制度，防止和纠正以刑事手段干预经济纠纷。五、创新支持方面，支持民营企业参与国家重大科技项目，在人工智能、量子信息、生物技术等前沿领域对民营企业同等开放。六、人才支持方面，畅通民营企业人才职称评审渠道，将民营企业急需紧缺人才纳入各地人才引进计划。",
    createdAt: "2025-03-14T16:00:00.000Z"
  }
];

/* ── Init ── */

let articles = loadArticles();
initApiSettings();
renderArticles();

/* ── Event Listeners ── */

articleForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const article = {
    id: crypto.randomUUID(),
    account: document.getElementById("account").value.trim(),
    publishDate: document.getElementById("publish-date").value,
    title: document.getElementById("title").value.trim(),
    url: document.getElementById("url").value.trim(),
    content: document.getElementById("content").value.trim(),
    createdAt: new Date().toISOString()
  };
  if (!article.account || !article.publishDate || !article.title || !article.content) return;
  articles.unshift(article);
  persistArticles();
  articleForm.reset();
  renderArticles();
  summaryOutput.textContent = "文章已保存。";
});

[keywordInput, filterDateInput, filterAccountInput].forEach((el) =>
  el.addEventListener("input", renderArticles)
);

clearFiltersBtn.addEventListener("click", () => {
  keywordInput.value = "";
  filterDateInput.value = "";
  filterAccountInput.value = "";
  renderArticles();
});

summarizeBtn.addEventListener("click", handleSummarize);

apiToggleBtn.addEventListener("click", () => {
  const open = apiBody.style.display !== "none";
  apiBody.style.display = open ? "none" : "block";
  apiToggleBtn.textContent = open ? "展开" : "收起";
});

saveApiBtn.addEventListener("click", () => {
  const key = apiKeyInput.value.trim();
  const model = apiModelSelect.value;
  if (!key) { alert("请输入 API Key"); return; }
  localStorage.setItem(API_KEY_STORAGE, key);
  localStorage.setItem(API_MODEL_STORAGE, model);
  updateApiStatus();
  apiBody.style.display = "none";
  apiToggleBtn.textContent = "展开";
});

clearApiBtn.addEventListener("click", () => {
  localStorage.removeItem(API_KEY_STORAGE);
  localStorage.removeItem(API_MODEL_STORAGE);
  apiKeyInput.value = "";
  updateApiStatus();
});

loadDemoBtn.addEventListener("click", () => {
  const existing = new Set(articles.map((a) => a.id));
  const newOnes = DEMO_ARTICLES.filter((d) => !existing.has(d.id));
  if (!newOnes.length) { alert("示例数据已存在"); return; }
  articles = [...newOnes, ...articles];
  persistArticles();
  renderArticles();
  summaryOutput.textContent = `已加载 ${newOnes.length} 篇示例文章。`;
});

importBtn.addEventListener("click", () => importFile.click());

importFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      const arr = Array.isArray(data) ? data : [data];
      let count = 0;
      arr.forEach((item) => {
        if (item.title && item.content) {
          articles.unshift({
            id: crypto.randomUUID(),
            account: item.account || "未知公众号",
            publishDate: item.publishDate || new Date().toISOString().slice(0, 10),
            title: item.title,
            url: item.url || "",
            content: item.content,
            createdAt: new Date().toISOString()
          });
          count++;
        }
      });
      persistArticles();
      renderArticles();
      summaryOutput.textContent = `成功导入 ${count} 篇文章。`;
    } catch {
      alert("JSON 格式错误，请检查文件内容。");
    }
    importFile.value = "";
  };
  reader.readAsText(file);
});

/* ── API Settings ── */

function initApiSettings() {
  const savedKey = localStorage.getItem(API_KEY_STORAGE);
  const savedModel = localStorage.getItem(API_MODEL_STORAGE);
  if (savedKey) apiKeyInput.value = savedKey;
  if (savedModel) apiModelSelect.value = savedModel;
  updateApiStatus();
}

function updateApiStatus() {
  const key = localStorage.getItem(API_KEY_STORAGE);
  if (key) {
    const model = localStorage.getItem(API_MODEL_STORAGE) || "gpt-4o-mini";
    apiStatus.textContent = `已配置 — ${model}`;
    apiStatus.classList.add("connected");
  } else {
    apiStatus.textContent = "未配置 — 使用本地摘要";
    apiStatus.classList.remove("connected");
  }
}

function getApiConfig() {
  const key = localStorage.getItem(API_KEY_STORAGE);
  const model = localStorage.getItem(API_MODEL_STORAGE) || "gpt-4o-mini";
  return key ? { key, model } : null;
}

/* ── Storage ── */

function loadArticles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function persistArticles() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
}

/* ── Render Articles ── */

function getFilteredArticles() {
  const keyword = keywordInput.value.trim().toLowerCase();
  const date = filterDateInput.value;
  const account = filterAccountInput.value.trim().toLowerCase();
  return articles.filter((a) => {
    const matchK = !keyword || a.title.toLowerCase().includes(keyword) || a.content.toLowerCase().includes(keyword);
    const matchD = !date || a.publishDate === date;
    const matchA = !account || a.account.toLowerCase().includes(account);
    return matchK && matchD && matchA;
  });
}

function renderArticles() {
  articleList.innerHTML = "";
  const filtered = getFilteredArticles();
  articleCountBadge.textContent = articles.length;

  if (!filtered.length) {
    articleList.innerHTML = articles.length
      ? "<li class='empty'>没有符合筛选条件的文章。</li>"
      : "<li class='empty'>暂无文章，请添加或点击「加载示例数据」体验。</li>";
    return;
  }

  filtered.forEach((article, index) => {
    const node = template.content.firstElementChild.cloneNode(true);
    const radio = node.querySelector("input[type='radio']");
    radio.value = article.id;
    radio.checked = index === 0;

    node.querySelector(".meta").textContent = `${article.account} · ${article.publishDate}`;
    node.querySelector(".title").textContent = article.title;
    node.querySelector(".preview").textContent = article.content.slice(0, 120) + (article.content.length > 120 ? "..." : "");

    const fullContent = node.querySelector(".full-content");
    fullContent.textContent = article.content;

    const expandBtn = node.querySelector(".expand-btn");
    expandBtn.addEventListener("click", () => {
      const open = fullContent.style.display !== "none";
      fullContent.style.display = open ? "none" : "block";
      expandBtn.textContent = open ? "展开全文" : "收起";
      if (!open) node.querySelector(".preview").style.display = "none";
      else node.querySelector(".preview").style.display = "";
    });

    const urlEl = node.querySelector(".url");
    if (article.url) {
      urlEl.href = article.url;
    } else {
      urlEl.textContent = "无原文链接";
      urlEl.removeAttribute("href");
      urlEl.style.pointerEvents = "none";
      urlEl.style.color = "#94a3b8";
    }

    node.querySelector(".delete-btn").addEventListener("click", () => {
      articles = articles.filter((a) => a.id !== article.id);
      persistArticles();
      renderArticles();
    });

    articleList.appendChild(node);
  });
}

function getSelectedArticleId() {
  const el = document.querySelector("input[name='selected-article']:checked");
  return el ? el.value : null;
}

/* ── Summarize ── */

async function handleSummarize() {
  const selectedId = getSelectedArticleId();
  if (!selectedId) {
    summaryOutput.textContent = "请先在文章库中选择一篇文章。";
    return;
  }
  const article = articles.find((a) => a.id === selectedId);
  if (!article) {
    summaryOutput.textContent = "未找到所选文章。";
    return;
  }

  const prompt = promptInput.value.trim() || "请总结这篇文章的核心观点，列出要点。";
  const api = getApiConfig();

  if (api) {
    await summarizeWithGPT(article, prompt, api);
  } else {
    summaryOutput.innerHTML = summarizeLocal(article, prompt);
  }
}

/* ── GPT Summarization (streaming) ── */

async function summarizeWithGPT(article, prompt, api) {
  summaryOutput.innerHTML = '<div class="loading"><span></span><span></span><span></span></div>';
  summarizeBtn.disabled = true;

  const systemMsg = "你是一个专业的内容分析助手。用户会提供公众号文章内容和分析指令，请按指令要求进行分析或总结。输出使用中文，条理清晰。";
  const userMsg = `文章标题：《${article.title}》\n公众号：${article.account}\n发布日期：${article.publishDate}\n\n文章内容：\n${article.content}\n\n---\n用户指令：${prompt}`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${api.key}`
      },
      body: JSON.stringify({
        model: api.model,
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: userMsg }
        ],
        stream: true
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    summaryOutput.innerHTML = "";
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let result = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") break;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            result += delta;
            summaryOutput.innerHTML = formatMarkdown(result);
            summaryOutput.scrollTop = summaryOutput.scrollHeight;
          }
        } catch {}
      }
    }

    if (!result) summaryOutput.textContent = "未生成任何内容。";
  } catch (err) {
    summaryOutput.innerHTML = `<div class="error">API 调用失败：${err.message}</div>`;
  } finally {
    summarizeBtn.disabled = false;
  }
}

/* ── Local Summarization (enhanced) ── */

function summarizeLocal(article, prompt) {
  const sentences = article.content
    .replace(/([。！？])/g, "$1\n")
    .split(/\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  if (!sentences.length) return "文章内容过短，无法生成摘要。";

  const frequency = new Map();
  sentences.forEach((s) => {
    s.replace(/[，。！？、""''；：,.!?;:()（）\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1)
      .forEach((w) => frequency.set(w, (frequency.get(w) || 0) + 1));
  });

  const scored = sentences.map((sentence, idx) => {
    let score = sentence
      .replace(/[，。！？、""''；：,.!?;:()（）\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1)
      .reduce((sum, w) => sum + (frequency.get(w) || 0), 0);
    if (idx === 0) score *= 1.5;
    if (idx === sentences.length - 1) score *= 1.3;
    if (/建议|关注|总结|核心|关键|重点|值得/.test(sentence)) score *= 1.4;
    return { sentence, idx, score };
  });

  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(5, Math.ceil(sentences.length * 0.3)))
    .sort((a, b) => a.idx - b.idx)
    .map((item) => item.sentence);

  const lines = [
    `<strong>指令：</strong>${prompt}`,
    `<strong>文章：</strong>《${article.title}》（${article.account} · ${article.publishDate}）`,
    "",
    "<strong>摘要：</strong>",
    ...top.map((s, i) => `${i + 1}. ${s}`),
    "",
    '<span class="local-note">📌 当前为本地摘要算法。配置 OpenAI API Key 后可获得 GPT 智能总结。</span>'
  ];
  return lines.join("<br>");
}

/* ── Markdown-like Formatting ── */

function formatMarkdown(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}
