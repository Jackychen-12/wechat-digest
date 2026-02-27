async function fetchText(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    if (!resp.ok) throw new Error(`status ${resp.status}`);
    const text = await resp.text();
    if (!text || text.length < 50) throw new Error('empty content');
    return text;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const target = req.query.url;
  if (!target || !/^https?:\/\//i.test(target)) {
    return res.status(400).json({ error: 'invalid url' });
  }

  const clean = target.trim();
  const withoutProtocol = clean.replace(/^https?:\/\//i, '');
  const candidates = [
    `https://r.jina.ai/http://${withoutProtocol}`,
    `https://r.jina.ai/https://${withoutProtocol}`,
    clean
  ];

  try {
    const attempts = await Promise.allSettled(candidates.map((url) => fetchText(url)));
    const ok = attempts.find((r) => r.status === 'fulfilled');
    if (ok) {
      const idx = attempts.indexOf(ok);
      return res.status(200).json({ source: candidates[idx], text: ok.value });
    }

    return res.status(502).json({ error: 'fetch failed' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
