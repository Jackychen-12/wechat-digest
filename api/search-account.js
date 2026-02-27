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

async function fetchText(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    if (!resp.ok) throw new Error(`status ${resp.status}`);
    return await resp.text();
  } finally {
    clearTimeout(timer);
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const name = (req.query.name || '').trim();
  if (!name) return res.status(400).json({ error: 'invalid name' });

  const q = encodeURIComponent(name);
  const candidates = [
    `https://r.jina.ai/http://weixin.sogou.com/weixin?type=2&query=${q}`,
    `https://r.jina.ai/https://weixin.sogou.com/weixin?type=2&query=${q}`,
    `https://r.jina.ai/http://weixin.sogou.com/weixin?query=${q}&type=2&ie=utf8`,
    `https://r.jina.ai/http://www.sogou.com/web?query=site%3Amp.weixin.qq.com%20${q}`
  ];

  try {
    const results = await Promise.allSettled(candidates.map((url) => fetchText(url)));
    let all = [];
    for (const r of results) {
      if (r.status === 'fulfilled') all = all.concat(parseEntries(r.value));
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
      return res.status(502).json({ error: 'no entries found', entries: [] });
    }

    return res.status(200).json({ entries: uniq.slice(0, 12) });
  } catch (error) {
    return res.status(500).json({ error: error.message, entries: [] });
  }
};
