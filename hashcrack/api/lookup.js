/**
 * api/lookup.js
 * Multi-API hash lookup — browser-safe endpoints with real CORS headers.
 */

const Lookup = (() => {

  const TIMEOUT_MS = 8000;

  const UNCRACKABLE = new Set(['BCRYPT', 'MD5-CRYPT', 'SHA512-CRYPT', 'UNKNOWN']);

  async function fetchWithTimeout(url, ms, opts = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      const res = await fetch(url, { signal: controller.signal, ...opts });
      return res;
    } finally {
      clearTimeout(timer);
    }
  }

  // Endpoint 1: nitrxgen.net — public CORS-enabled MD5 rainbow table
  async function tryNitrxgen(hash) {
    try {
      const res = await fetchWithTimeout(`https://www.nitrxgen.net/md5db/${hash}`, TIMEOUT_MS);
      const text = (await res.text()).trim();
      if (text && text.length > 0 && text.length < 100) return { result: text, source: 'nitrxgen.net' };
    } catch (_) {}
    return null;
  }

  // Endpoint 2: md5decrypt.net — free API with CORS
  async function tryMd5decrypt(hash) {
    try {
      const res = await fetchWithTimeout(
        `https://md5decrypt.net/Api/api.php?hash=${hash}&hash_type=md5&email=test@test.com&code=code1`,
        TIMEOUT_MS
      );
      const text = (await res.text()).trim();
      if (text && !text.toLowerCase().includes('error') && text !== hash && text.length < 100) {
        return { result: text, source: 'md5decrypt.net' };
      }
    } catch (_) {}
    return null;
  }

  // Endpoint 3: md5.gromweb.com — JSON API
  async function tryGromweb(hash) {
    try {
      const res = await fetchWithTimeout(`https://md5.gromweb.com/api/?md5=${hash}`, TIMEOUT_MS);
      const data = await res.json();
      if (data && data.string) return { result: data.string, source: 'md5.gromweb.com' };
    } catch (_) {}
    return null;
  }

  // Endpoint 4: hashtoolkit via corsproxy.io
  async function tryHashtoolkit(hash) {
    try {
      const res = await fetchWithTimeout(
        `https://corsproxy.io/?url=https://hashtoolkit.com/reverse-hash/?hash=${hash}`,
        TIMEOUT_MS
      );
      const text = await res.text();
      const m = text.match(/class="[^"]*hash-value[^"]*"[^>]*>([^<]{1,80})</);
      if (m && m[1].trim()) return { result: m[1].trim(), source: 'hashtoolkit.com' };
    } catch (_) {}
    return null;
  }

  async function crack(hash) {
    const type = Detector.identify(hash);

    if (UNCRACKABLE.has(type)) {
      return { hash, type, result: null, status: 'failed', source: null };
    }

    const attempts = type === 'MD5'
      ? [tryNitrxgen(hash), tryMd5decrypt(hash), tryGromweb(hash), tryHashtoolkit(hash)]
      : [tryHashtoolkit(hash)];

    const hit = await Promise.any(
      attempts.map(p => p.then(r => r ? Promise.resolve(r) : Promise.reject()).catch(() => Promise.reject()))
    ).catch(() => null);

    if (hit) return { hash, type, result: hit.result, status: 'cracked', source: hit.source };
    return { hash, type, result: null, status: 'failed', source: null };
  }

  return { crack };

})();
