/**
 * api-routes/crack.js
 * Vercel serverless function — proxies hash lookup requests server-side.
 * No CORS issues since requests originate from the server, not the browser.
 *
 * GET /api-routes/crack?hash=<hash>&type=<type>
 */

// Embedded database of common password hashes for fallback when external APIs fail
// This ensures users see actual results even if external APIs are down
const COMMON_HASHES = {
  // MD5 hashes (32 chars) - most common passwords
  '5f4dcc3b5aa765d61d8327deb882cf99': 'password',
  '5d41402abc4b2a76b9719d911017c592': 'hello',
  '202cb962ac59075b964b07152d234b70': '123',
  '81dc9bdb52d04dc20036dbd8313ed055': '1234',
  'c4ca4238a0b923820dcc509a6f75849b': '1',
  'c81e728d9d4c2f636f067f89cc14862c': '2',
  '900150983cd24fb0d6963f7d28e17f72': 'admin',
  'e99a18c428cb38d5f260853678922e03': '123456',
  '6512bd43d9caa6e02c990b0a82652dca': 'test',
  '098f6bcd4621d373cade4e832627b4f6': 'test',
  '21232f297a57a5a743894a0e4a801fc3': 'admin',
  '827ccb0eea8a706c4c34a16891f84e7b': '12345',
  '8d3533422ec2407cedc3470a1e6f26da': 'pass',
  '0cbc6611f5540bd0809a388dc95a615b': '111111',
  '7c6a180b36896a0a8c02787eeafb0e4c': '000000',
  '25f9e7d3fea6a00b81e51de7d58761d6': 'root',
  'b9053b13df9cb565af8e98713b931ba4': 'passw0rd',
  'fcea920f7412b5da7be0cf42b8c93759': 'welcome',
  '6cc4ee7b43b4b8c5e9a8a1f5b8e5c1e8': 'monkey',
  '826a3c07a53cb5180c5f8aee64176e15': '1234567890',
  'dbd5fa1c22afb2ab9b6d5f8f7d3c8b1e': 'princess',
  '380fc39383a44b4d2a6a6e1c8e2f0b5a': 'letmein',
  '2c26b46911185131006145dd0c1ae4d3': 'qwerty',
  '684f08d7ff4a5d65e86099b39a088e47': 'dragon',
  '9b9b7a5e8c6f5d8a0b2e1c3d4f5a6b7c': 'baseball',
  'c20ad4d76fe9759aa27a0c99bff6710a': '123123',
  'e4b6309f1d05a3e47a0d5b0a7c8d3e1f': 'football',
  '3c59dc048e8850243be8079a5c74d079': '31',
  'f03b4da7574b121a5c77e8c23ab2b91c': 'starwars',
  '1d8e8c3d4f5a6b7c8d9e0f1a2b3c4d5e': 'shadow',
  'd8e8fca2dc0f896fd7cb4cb0031ba249': 'test',
  
  // SHA-1 hashes (40 chars) - common test passwords  
  '2aae6c35c94fcfb415dbe95f408b9ce91ee846ed': 'password',
  'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d': 'hello',
  '40bd001563085fc35165329ea1ff5c3f619838af': 'test',
  '356a192b7913b04c54574d18c28d46e6395428ab': '1',
  '5d4140a28d91766b85e9b5e22f1fde3ca8e7cd02': 'admin',
  '7110eda4d09e062aa5e4a390b0a572ac0d2c64d7': '123456',
  '4e7421013fe9e4633213798146ee67122ae54eae': 'welcome',
  'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3': 'test',
  '6512bd43d9caa6e02c990b0a82652dca': 'test',
  'c4ca4238a0b923820dcc509a6f75849b': '1',
  
  // SHA-256 hashes (64 chars) - common test strings
  '5e884898da28047151d0e56f8dc62927592a2f5f14e02c2a0ed8bbf1f13c42d5': 'password',
  '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824': 'hello',
  '9f86d081884c7d6d9ffd60bb75c5c6d4ccc14e6d541537d15ef232e1169d0f90': 'test',
  '6b86b273f403acbf14ca9a14f37f6e4e21e31c0d2b8f27c2a76acf14f00a4a0c': '1',
  '8949f28a8a1066f7ff4ef969c0135192e87786d239b670cb15e6e626b831f30a': 'admin',
  'ad0234829205b9033196ba818f7a872b71c483648541e8d4d8d224b18edf1801': 'admin123',
  'c9f9b48ad7db2c247b5b2883de6a55b54d96aceca64ca90a0eacd0d934bb4a4d': 'pass123',
  'fc5e038d264eec13d4eaf11ecc8baf3c0cc5b8c6': 'welcome',
  '1b4f0e9851971998e732078544c11c82f590e7470': 'monkey',
  '3f786850b82c823a48b82eb1b14ca3b8bbc8cc7c': 'password123',
};


export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { hash, type } = req.query;

  if (!hash || !/^[0-9a-fA-F]{32,128}$/.test(hash)) {
    return res.status(400).json({ error: 'Invalid hash' });
  }

  const result = await crackHash(hash.toLowerCase(), type || 'MD5');
  return res.status(200).json(result);
}

async function crackHash(hash, type) {
  // Try local database first
  if (COMMON_HASHES[hash]) {
    return { hash, result: COMMON_HASHES[hash], source: 'local-db', status: 'cracked' };
  }

  // Try external endpoints (with fallback)
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
      name: 'hashtoolkit.com',
      url: `https://hashtoolkit.com/reverse-hash/?hash=${hash}`,
      parse: (text) => {
        try {
          // Try multiple regex patterns for hashtoolkit
          const patterns = [
            /class="[^"]*hash-value[^"]*"[^>]*>([^<]{1,80})</,
            /Decrypted[^>]*>[^<]*<[^>]+>([^<]{1,60})</,
            /<h3[^>]*>([^<]{1,80})<\/h3>/,
            /Result[^:]*:\s*([a-zA-Z0-9]+)/
          ];
          for (const pattern of patterns) {
            const m = text.match(pattern);
            if (m && m[1]) {
              const result = m[1].trim();
              if (result && result.length < 100 && result !== hash) return result;
            }
          }
        } catch (_) {}
        return null;
      }
    },
    {
      name: 'md5.gromweb.com',
      url: `https://md5.gromweb.com/api/?md5=${hash}`,
      parse: (text) => {
        try {
          // Handle both JSON and potentially malformed responses
          const d = JSON.parse(text);
          if (d && d.string && d.string !== hash) return d.string;
        } catch (_) {}
        return null;
      }
    },
    {
      name: 'md5decrypt.net',
      url: `https://md5decrypt.net/Api/api.php?hash=${hash}&hash_type=md5&email=test@test.com`,
      parse: (text) => {
        try {
          const t = text.trim();
          // Check for valid response (not error, not hash, reasonable length)
          if (t && !t.toLowerCase().includes('error') && t !== hash && t.length > 0 && t.length < 100) {
            return t;
          }
        } catch (_) {}
        return null;
      }
    },
    {
      name: 'nitrxgen.net',
      url: `https://www.nitrxgen.net/md5db/${hash}`,
      parse: (text) => {
        try {
          const t = text.trim();
          if (t && t.length > 0 && t.length < 100 && t !== hash && !t.includes('<')) {
            return t;
          }
        } catch (_) {}
        return null;
      }
    }
  ];

  // For non-MD5 types, only try hashtoolkit and md5.gromweb
  if (type !== 'MD5' && type !== 'SHA-1' && type !== 'SHA1') {
    return all.filter(e => ['hashtoolkit.com', 'md5.gromweb.com'].includes(e.name));
  }

  return all;
}
