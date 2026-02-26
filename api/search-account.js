
const PRESET_ACCOUNT_RESULTS = {
  "数字生命卡兹克": [
    {
      title: "数字生命卡兹克 - 指定示例文章",
      url: "https://mp.weixin.qq.com/s/4lUgy1nW41-6jxoRKdszeQ"
    }
  ]
};

function parseEntries(text) {
  const markdownMatches = [...text.matchAll(/\[(.*?)\]\((https?:\/\/mp\.weixin\.qq\.com\/s\?[^)]+)\)/g)].map((m) => ({
    title: (m[1] || '未命名文章').trim(),
    url: m[2].trim()
  }));
  const plainLinks = [...text.matchAll(/https?:\/\/mp\.weixin\.qq\.com\/s\?[^\s)]+/g)].map((m) => ({
    title: '公众号文章',
    url: m[0].trim()
  }));

  const merged = [...markdownMatches, ...plainLinks];
  const seen = new Set();
  return merged.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  }).slice(0, 15);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const name = (req.query.name || '').trim();
  if (!name) return res.status(400).json({ error: 'invalid name' });

  const preset = PRESET_ACCOUNT_RESULTS[name];
  if (preset && preset.length) return res.status(200).json({ entries: preset, source: 'preset' });

  const q = encodeURIComponent(name);
  const candidates = [
    `https://r.jina.ai/http://weixin.sogou.com/weixin?type=2&query=${q}`,
    `https://r.jina.ai/https://weixin.sogou.com/weixin?type=2&query=${q}`,
    `https://r.jina.ai/http://weixin.sogou.com/weixin?query=${q}&type=2&ie=utf8`,
    `https://r.jina.ai/http://www.sogou.com/web?query=site%3Amp.weixin.qq.com%20${q}`
  ];

  let all = [];
  let lastError = null;
  for (const url of candidates) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!resp.ok) throw new Error(`status ${resp.status}`);
      const text = await resp.text();
      all = all.concat(parseEntries(text));
      if (all.length >= 5) break;
    } catch (err) {
      lastError = err;
    }
  }

  const uniq = [];
  const seen = new Set();
  for (const it of all) {
    if (!seen.has(it.url)) {
      seen.add(it.url);
      uniq.push(it);
    }
  }

  if (!uniq.length) {
    return res.status(502).json({ error: lastError?.message || 'no entries found', entries: [] });
  }

  return res.status(200).json({ entries: uniq.slice(0, 12) });
};
