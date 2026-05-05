/**
 * api/lookup.js
 * Calls the Vercel serverless proxy at /api/crack which does the
 * actual lookup server-side — no CORS issues.
 */

const Lookup = (() => {

  const UNCRACKABLE = new Set(['BCRYPT', 'MD5-CRYPT', 'SHA512-CRYPT', 'UNKNOWN']);

  async function crack(hash) {
    const type = Detector.identify(hash);

    if (UNCRACKABLE.has(type)) {
      return { hash, type, result: null, status: 'failed', source: null };
    }

    try {
      const res = await fetch(`/api/crack?hash=${encodeURIComponent(hash)}&type=${encodeURIComponent(type)}`, {
        signal: AbortSignal.timeout(15000)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      return {
        hash,
        type,
        result: data.result || null,
        status: data.status || 'failed',
        source: data.source || null
      };
    } catch (err) {
      console.warn('Lookup proxy error:', err.message);
      return { hash, type, result: null, status: 'failed', source: null };
    }
  }

  return { crack };

})();
