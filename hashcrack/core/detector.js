/**
 * core/detector.js
 * Hash type identification and entropy analysis.
 */

const Detector = (() => {

  const TYPES = [
    { name: 'MD5',     len: 32,  regex: /^[0-9a-f]{32}$/i },
    { name: 'SHA-1',   len: 40,  regex: /^[0-9a-f]{40}$/i },
    { name: 'SHA-224', len: 56,  regex: /^[0-9a-f]{56}$/i },
    { name: 'SHA-256', len: 64,  regex: /^[0-9a-f]{64}$/i },
    { name: 'SHA-384', len: 96,  regex: /^[0-9a-f]{96}$/i },
    { name: 'SHA-512', len: 128, regex: /^[0-9a-f]{128}$/i },
    { name: 'NTLM',    len: 32,  regex: /^[0-9a-f]{32}$/i },  // same length as MD5 — ambiguous
    { name: 'BCRYPT',  len: null, regex: /^\$2[aby]\$/ },
    { name: 'MD5-CRYPT', len: null, regex: /^\$1\$/ },
    { name: 'SHA512-CRYPT', len: null, regex: /^\$6\$/ },
  ];

  const TYPE_INFO = {
    'MD5': {
      algo: 'Message Digest 5',
      bits: 128,
      security: 'BROKEN — collision attacks exist. Do not use for security.',
      crackability: 'Very fast — massive precomputed rainbow tables available.',
      color: 'err'
    },
    'SHA-1': {
      algo: 'Secure Hash Algorithm 1',
      bits: 160,
      security: 'DEPRECATED — SHA-1 collision demonstrated. Avoid.',
      crackability: 'Lookup tables exist for common plaintexts.',
      color: 'warn'
    },
    'SHA-224': {
      algo: 'SHA-2 family (truncated)',
      bits: 224,
      security: 'ACCEPTABLE — truncation weakens slightly vs SHA-256.',
      crackability: 'Rarely cracked — limited lookup coverage.',
      color: 'ok'
    },
    'SHA-256': {
      algo: 'SHA-2 family',
      bits: 256,
      security: 'STRONG — no practical attacks known.',
      crackability: 'Difficult — only weak passwords in lookup databases.',
      color: 'ok'
    },
    'SHA-384': {
      algo: 'SHA-2 family (truncated SHA-512)',
      bits: 384,
      security: 'VERY STRONG — excellent security margin.',
      crackability: 'Extremely difficult — minimal lookup coverage.',
      color: 'ok'
    },
    'SHA-512': {
      algo: 'SHA-2 family',
      bits: 512,
      security: 'VERY STRONG — gold standard for integrity.',
      crackability: 'Practically infeasible without matched preimage.',
      color: 'ok'
    },
    'BCRYPT': {
      algo: 'Adaptive password hash (Blowfish)',
      bits: null,
      security: 'STRONG — designed for passwords, built-in cost factor.',
      crackability: 'Slow by design. GPU attacks possible on weak passwords.',
      color: 'ok'
    },
    'NTLM': {
      algo: 'NT LAN Manager (Windows)',
      bits: 128,
      security: 'BROKEN — unsalted MD4, extremely weak.',
      crackability: 'Instant with rainbow tables for common passwords.',
      color: 'err'
    },
    'UNKNOWN': {
      algo: 'Unrecognized',
      bits: null,
      security: 'Cannot assess — unrecognized format.',
      crackability: 'Cannot assess.',
      color: 'warn'
    }
  };

  /** Identify hash type from string */
  function identify(hash) {
    const h = hash.trim();
    for (const t of TYPES) {
      if (t.regex.test(h)) {
        // MD5 and NTLM share length 32 — default to MD5
        return t.name === 'NTLM' ? 'MD5' : t.name;
      }
    }
    return 'UNKNOWN';
  }

  /** Return detailed info object for a type */
  function info(type) {
    return TYPE_INFO[type] || TYPE_INFO['UNKNOWN'];
  }

  /** Shannon entropy of a string (bits per character) */
  function entropy(s) {
    const freq = {};
    for (const c of s) freq[c] = (freq[c] || 0) + 1;
    return Object.values(freq).reduce((e, f) => {
      const p = f / s.length;
      return e - p * Math.log2(p);
    }, 0);
  }

  /** Extract all plausible hashes from arbitrary text */
  function extractFromText(text) {
    const regex = /\b[0-9a-fA-F]{32,128}\b/g;
    const VALID_LENGTHS = new Set([32, 40, 56, 64, 96, 128]);
    const matches = text.match(regex) || [];
    return [...new Set(matches.filter(h => VALID_LENGTHS.has(h.length)))];
  }

  /** Parse input textarea — handles raw hashes, colon-separated, JSON blobs */
  function parseInput(raw) {
    return extractFromText(raw);
  }

  return { identify, info, entropy, extractFromText, parseInput };

})();
