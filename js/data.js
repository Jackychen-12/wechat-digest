import * as S from "./state.js";
import { $, makeArticle, today, backendConfigured, closeAllModals, toast } from "./helpers.js";
import { scheduleSync } from "./workspace.js";
import { renderAll, selectArticle } from "./render.js";

export function maybeSeedDemo() {
  if (backendConfigured()) return;
  if (localStorage.getItem("wcd_seeded")) return;
  if (S.articles.length) return;
  S.setArticles(demoArticles());
  S.saveArticlesLocal();
  localStorage.setItem("wcd_seeded", "1");
}

export function addArticle(e) {
  e.preventDefault();
  const a = makeArticle({
    account: $("f-account").value.trim(),
    publishDate: $("f-date").value,
    title: $("f-title").value.trim(),
    url: $("f-url").value.trim(),
    content: $("f-content").value.trim(),
  });
  if (!a.account || !a.title || !a.content) return;
  S.articles.unshift(a);
  scheduleSync();
  e.target.reset();
  closeAllModals();
  renderAll();
  selectArticle(a.id);
  toast("已添加");
}

export function loadDemo() {
  const existing = new Set(S.articles.map((a) => a.title));
  const fresh = demoArticles().filter((d) => !existing.has(d.title));
  if (!fresh.length) {
    toast("示例数据已存在");
    return;
  }
  S.setArticles([...fresh, ...S.articles]);
  scheduleSync();
  closeAllModals();
  renderAll();
  toast(`已加载 ${fresh.length} 篇示例`);
}

export function importJson(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      const arr = Array.isArray(data) ? data : [data];
      let n = 0;
      arr.forEach((it) => {
        if (it.title && it.content) {
          S.articles.unshift(
            makeArticle({
              account: it.account || "未知公众号",
              publishDate: it.publishDate || today(),
              title: it.title,
              url: it.url || "",
              content: it.content,
              summary: it.summary || "",
            })
          );
          n++;
        }
      });
      scheduleSync();
      renderAll();
      toast(`成功导入 ${n} 篇`);
    } catch {
      toast("JSON 格式错误", true);
    }
    e.target.value = "";
  };
  reader.readAsText(file);
}

export function clearAll() {
  if (!confirm("确定清空本工作区的全部文章与分析结果？此操作不可恢复。")) return;
  S.setArticles([]);
  S.setActiveId(null);
  scheduleSync();
  closeAllModals();
  renderAll();
  toast("已清空本工作区");
}

function demoArticles() {
  return [
    {
      id: crypto.randomUUID(),
      account: "晚点LatePost",
      publishDate: "2025-03-17",
      title: "大模型价格战背后：谁在亏钱，谁在布局",
      url: "",
      content: "2025年初，国内大模型市场掀起新一轮价格战。多家头部厂商将API调用价格下调50%-90%，部分模型甚至推出免费版本。这场价格战背后的逻辑并不简单。首先，模型推理成本确实在快速下降，得益于模型蒸馏、量化压缩和推理芯片迭代，同等性能的推理成本在过去一年下降了约70%。其次，各厂商战略目的不同：头部玩家希望通过低价快速占领开发者生态；中小厂商则被迫跟进以保住市场份额。从商业模式看，单纯的API调用收入很难支撑大模型公司的估值，真正的盈利点在于企业级定制部署、垂直行业解决方案以及基于模型能力构建的SaaS产品。值得注意的是，价格战正在加速行业洗牌，预计2025年底将有30%-40%的大模型创业公司面临资金链断裂或被收购。",
      summary: "## 一句话总结\n国内大模型价格战的核心驱动是推理成本一年降约 70%，而非单纯补贴，正加速行业洗牌。\n\n## 核心观点\n- 价格下调 50%-90% 背后是成本结构性下降（蒸馏+量化+芯片）\n- 头部用低价抢生态，中小厂被动跟进保份额\n- 单纯 API 收入难撑估值，盈利靠定制部署/垂直方案/SaaS\n\n## 关键数据 / 事实\n- 推理成本一年下降约 70%\n- API 价格下调 50%-90%\n- 预计 2025 年底 30%-40% 创业公司出局\n\n## 关键词标签\n- 大模型 推理成本 价格战 商业模式 行业洗牌\n\n## 价值与适用人群\n适合 AI 从业者、投资人快速把握大模型商业化拐点与竞争格局。",
      analyzedAt: "2025-03-17T11:00:00.000Z",
      createdAt: "2025-03-17T10:30:00.000Z",
    },
    {
      id: crypto.randomUUID(),
      account: "半佛仙人",
      publishDate: "2025-03-16",
      title: "为什么你存不下钱？从行为经济学说起",
      url: "",
      content: "很多人月薪一万五却存不下一分钱，月薪八千反而能攒下不少。这不是简单的克制力问题，而是行为经济学中的几个经典陷阱在起作用。第一个陷阱是心理账户：人们会无意识地把收入分成不同账户，工资要省着花，年终奖可以大手大脚，实际上钱就是钱。第二个陷阱是锚定效应：当你看到原价899现价299，你觉得自己赚了600块，实际上你花了299，商家设定的原价就是锚点。第三个陷阱是即时满足偏好：大脑天生偏好现在的快乐，一杯30块奶茶的即时愉悦远比30年后多30块退休金真实。解决方案其实很简单：发工资当天自动转20%到不方便取出的账户；设定24小时冷静期再下单；把存款目标具象化，比如明年去日本旅行的机票钱。",
      summary: "",
      analyzedAt: null,
      createdAt: "2025-03-16T14:00:00.000Z",
    },
    {
      id: crypto.randomUUID(),
      account: "虎嗅APP",
      publishDate: "2025-03-15",
      title: "Sora之后：AI视频生成的技术路线之争",
      url: "",
      content: "OpenAI的Sora发布后，AI视频生成赛道迅速升温，目前主要存在三条技术路线的竞争。第一条是Sora采用的Diffusion Transformer路线，通过在视频潜空间中进行去噪生成，优势是生成质量高、物理一致性好，但计算成本极高。第二条是以Runway Gen-3为代表的图像到视频路线，先生成关键帧再插帧，速度快但容易出现运动不连贯。第三条是国内可灵、智谱等采用的端到端路线，试图通过大规模视频数据训练一步到位。实际落地场景中，短视频平台和广告行业最先买单，一条15秒产品广告视频传统制作成本约3-5万元，使用AI工具后降至几百元，但仍需人工审核和精修。预计2025年底AI视频生成市场规模将达到50亿美元。",
      summary: "",
      analyzedAt: null,
      createdAt: "2025-03-15T09:00:00.000Z",
    },
  ];
}
