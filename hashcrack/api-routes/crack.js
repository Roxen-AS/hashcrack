/**
 * api-routes/crack.js
 * Vercel serverless function — proxies hash lookup requests server-side.
 * No CORS issues since requests originate from the server, not the browser.
 *
 * GET /api-routes/crack?hash=<hash>&type=<type>
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { hash, type } = req.query;

  if (!hash || !/^[0-9a-fA-F]{32,128}$/.test(hash)) {
    return res.status(400).json({ error: 'Invalid hash' });
  }

  const result = await crackHash(hash, type || 'MD5');
  return res.status(200).json(result);
}

async function crackHash(hash, type) {
  const endpoints = buildEndpoints(hash, type);

  for (const ep of endpoints) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(ep.url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*' }
      });
      clearTimeout(timer);

      const text = await response.text();
      const hit = ep.parse(text, hash);

      if (hit) return { hash, result: hit, source: ep.name, status: 'cracked' };
    } catch (_) {
      // try next
    }
  }

  return { hash, result: null, source: null, status: 'failed' };
}

function buildEndpoints(hash, type) {
  const all = [
    {
      name: 'nitrxgen.net',
      url: `https://www.nitrxgen.net/md5db/${hash}`,
      parse: (text) => {
        const t = text.trim();
        return t && t.length > 0 && t.length < 100 ? t : null;
      }
    },
    {
      name: 'md5decrypt.net',
      url: `https://md5decrypt.net/Api/api.php?hash=${hash}&hash_type=md5&email=test@test.com&code=code1`,
      parse: (text) => {
        const t = text.trim();
        return t && !t.toLowerCase().includes('error') && t !== hash && t.length < 100 ? t : null;
      }
    },
    {
      name: 'md5.gromweb.com',
      url: `https://md5.gromweb.com/api/?md5=${hash}`,
      parse: (text) => {
        try {
          const d = JSON.parse(text);
          return d && d.string ? d.string : null;
        } catch (_) { return null; }
      }
    },
    {
      name: 'hashtoolkit.com',
      url: `https://hashtoolkit.com/reverse-hash/?hash=${hash}`,
      parse: (text) => {
        const m = text.match(/class="[^"]*hash-value[^"]*"[^>]*>([^<]{1,80})</)
               || text.match(/Decrypted[^>]*>[^<]*<[^>]+>([^<]{1,60})</);
        return m && m[1].trim() ? m[1].trim() : null;
      }
    },
    {
      name: 'md5online.org',
      url: `https://www.md5online.org/md5-decrypt.html`,
      parse: () => null  // POST-only, skip
    }
  ];

  // For non-MD5 types, nitrxgen and md5decrypt won't work — skip them
  if (type !== 'MD5') {
    return all.filter(e => e.name === 'hashtoolkit.com');
  }

  return all.filter(e => e.name !== 'md5online.org');
}
