/**
 * api/lookup.js
 * Multi-API hash lookup with CORS proxy cascade and fallback chain.
 */

const Lookup = (() => {

  const TIMEOUT_MS = 7000;

  /**
   * CORS proxy endpoints — tried in order until one resolves.
   * Each entry: { buildUrl(hash) → string, parse(text, hash) → string|null }
   */
  const ENDPOINTS = [
    {
      name: 'corsproxy → md5decrypt',
      buildUrl: (hash) =>
        `https://corsproxy.io/?url=${encodeURIComponent(
          `https://md5decrypt.net/Api/api.php?hash=${hash}&hash_type=md5&email=a@b.com&code=x`
        )}`,
      parse: (text, hash) => {
        const t = (text || '').trim();
        if (!t || t.toLowerCase().includes('error') ||
            t.toLowerCase().includes('not found') || t === hash) return null;
        return t.length > 0 && t.length <= 100 ? t : null;
      }
    },
    {
      name: 'allorigins → hashtoolkit',
      buildUrl: (hash) =>
        `https://api.allorigins.win/raw?url=${encodeURIComponent(
          `https://hashtoolkit.com/reverse-hash/?hash=${hash}`
        )}`,
      parse: (text) => {
        if (!text) return null;
        const patterns = [
          /class="[^"]*hash-value[^"]*"[^>]*>([^<]{1,80})</,
          /Decrypted Text[^>]*>[^<]*<[^>]+>([^<]{1,60})</,
          /value="([^"]{1,60})"\s*class="form-control"/
        ];
        for (const p of patterns) {
          const m = text.match(p);
          if (m && m[1].trim()) return m[1].trim();
        }
        return null;
      }
    },
    {
      name: 'corsproxy → md5.gromweb',
      buildUrl: (hash) =>
        `https://corsproxy.io/?url=${encodeURIComponent(
          `https://md5.gromweb.com/?md5=${hash}`
        )}`,
      parse: (text) => {
        if (!text) return null;
        const m = text.match(/class="string">([^<]{1,80})<\/em>/);
        return m ? m[1].trim() : null;
      }
    }
  ];

  /** Types that cannot be looked up via rainbow table APIs */
  const UNCRACKABLE = new Set(['BCRYPT', 'MD5-CRYPT', 'SHA512-CRYPT', 'UNKNOWN']);

  /** Fetch with timeout */
  async function fetchWithTimeout(url, ms) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      const res = await fetch(url, { signal: controller.signal });
      return await res.text();
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Attempt to crack a single hash.
   * Returns { hash, type, result, status, source }
   */
  async function crack(hash) {
    const type = Detector.identify(hash);

    if (UNCRACKABLE.has(type)) {
      return { hash, type, result: null, status: 'failed', source: null };
    }

    for (const endpoint of ENDPOINTS) {
      try {
        const url  = endpoint.buildUrl(hash);
        const text = await fetchWithTimeout(url, TIMEOUT_MS);
        const hit  = endpoint.parse(text, hash);
        if (hit) {
          return { hash, type, result: hit, status: 'cracked', source: endpoint.name };
        }
      } catch (_) {
        // network/timeout — try next endpoint
      }
    }

    return { hash, type, result: null, status: 'failed', source: null };
  }

  return { crack };

})();
