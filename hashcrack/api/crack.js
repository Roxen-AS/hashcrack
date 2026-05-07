/**
 * api/crack.js
 * Vercel serverless function — proxies hash lookup requests server-side.
 * Folder MUST be named "api" for Vercel to auto-detect it.
 */

const COMMON_HASHES = {
  // MD5
  '5f4dcc3b5aa765d61d8327deb882cf99': 'password',
  '5d41402abc4b2a76b9719d911017c592': 'hello',
  '202cb962ac59075b964b07152d234b70': '123',
  '81dc9bdb52d04dc20036dbd8313ed055': '1234',
  'c4ca4238a0b923820dcc509a6f75849b': '1',
  'c81e728d9d4c2f636f067f89cc14862c': '2',
  'eccbc87e4b5ce2fe28308fd9f2a7baf3': '3',
  'a87ff679a2f3e71d9181a67b7542122c': '4',
  'e4da3b7fbbce2345d7772b0674a318d5': '5',
  '1679091c5a880faf6fb5e6087eb1b2dc': '6',
  '8f14e45fceea167a5a36dedd4bea2543': '7',
  'c9f0f895fb98ab9159f51fd0297e236d': '8',
  '45c48cce2e2d7fbdea1afc51c7c6ad26': '9',
  'cfcd208495d565ef66e7dff9f98764da': '0',
  '900150983cd24fb0d6963f7d28e17f72': 'abc',
  '098f6bcd4621d373cade4e832627b4f6': 'test',
  '21232f297a57a5a743894a0e4a801fc3': 'admin',
  '827ccb0eea8a706c4c34a16891f84e7b': '12345',
  'e99a18c428cb38d5f260853678922e03': '123456',
  '25f9e7d3fea6a00b81e51de7d58761d6': 'root',
  '0cbc6611f5540bd0809a388dc95a615b': '111111',
  '7c6a180b36896a0a8c02787eeafb0e4c': 'password1',
  'f25a2fc72690b780b2a14e140ef6a9e0': 'iloveyou',
  '0d107d09f5bbe40cade3de5c71e9e9b7': 'letmein',
  '1c63129ae9db9c60c3e8aa94d3e00495': 'qwerty',
  'ab56b4d92b40713acc5af89985d4b786': 'abc123',
  'd8578edf8458ce06fbc5bb76a58c5ca4': 'qwerty',
  '6512bd43d9caa6e02c990b0a82652dca': 'trustno1',
  'fcea920f7412b5da7be0cf42b8c93759': 'welcome',
  'dbc5e39f4e5f1e6f51d6b6f7c39b9d4e': 'monkey',
  'c20ad4d76fe9759aa27a0c99bff6710a': '123123',
  '5f4dcc3b5aa765d61d8327deb882cf992': 'password2',
  'fc5e038d38a57032085441e7fe7010b0': 'sunshine',
  'aab3238922bcc25a6f606eb525ffdc56': '1111',
  'c9f0f895fb98ab9159f51fd0297e236d': '8',
  'b14a7b8059d9c055954c92674ce60032': 'princess',
  'e4da3b7fbbce2345d7772b0674a318d5': '5',
  '3c59dc048e8850243be8079a5c74d079': 'password123',
  'f806fc5a2a0d5ba2471600758452799c': '666666',
  'b59c67bf196a4758191e42f76670ceba': 'superman',
  '0571749e2ac330a7455809c6b0e7af90': 'dragon',
  '16d7a4fca7442dda3ad93c9a726597e4': 'master',
  '9878fc97ea41c6f9ede14ccfaebdc2a9': 'passw0rd',
  'ce0bfd15059b68d67688884d7a3d3e8c': 'michael',
  '52d1b96c7f03638b6a15be49e99ef8e4': 'football',
  'daa372a35b9611de70f1ba1c5a0d6890': 'shadow',
  '8afa847f50a716e64932d995c8e7435a': 'baseball',
  '79f9e81b4e046ea1f4e5ef95f97dc6e5': 'batman',
  'dd4b21e9ef71e1291183a46b913ae6f2': 'donald',
  '579d9ec9d0c3d687aaa91289ac2854e4': 'charlie',
  '3a4e7e4a49e5c0474e9b1d30f1e66e0d': 'qwerty123',
  'e2fc714c4727ee9395f324cd2e7f331f': 'abcd',
  // SHA-1
  '2aae6c35c94fcfb415dbe95f408b9ce91ee846ed': 'password',
  'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d': 'hello',
  'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3': 'test',
  '7c4a8d09ca3762af61e59520943dc26494f8941b': '123456',
  'f7c3bc1d808e04732adf679965ccc34ca7ae3441': '1234567',
  '2346ad27d7568ba9896f1b7da6b5991251debdf2': '12345678',
  '01b307acba4f54f55aafc33bb06bbbf6ca803e9a': '1234567890',
  'b1b3773a05c0ed0176787a4f1574ff0075f7521e': 'qwerty',
  '5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8': 'password',
  '5cec175b165e3d5e62c9e13ce848ef6feac81bff': 'admin',
  'b480ca19be342271b1f0c3b6d32d1bcd0c2a6d6b': 'letmein',
  '40bd001563085fc35165329ea1ff5c3f619838af': '1',
  'fac35e8f56bcfcde2f9e22e3ffe8b00eefe6f9d7': 'test123',
  'b6589fc6ab0dc82cf12099d1c2d40ab994e8410c': '0',
  '77de68daecd823babbb58edb1c8e14d7106e83bb': '1',
  // SHA-256
  '5e884898da28047151d0e56f8dc6292759475a5ad8b83e1ed1f5b80dc699c4b4': 'password',
  '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824': 'hello',
  '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08': 'test',
  'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3': '123',
  '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4': '1234',
  '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92': '123456',
  'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f': 'password1',
  'b14361404c078ffd549c03db443c3fede2f3e534d73f78f77301ed97d4a436a9': 'qwerty',
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { hash, type } = req.query;

  if (!hash || !/^[0-9a-fA-F]{32,128}$/.test(hash)) {
    return res.status(400).json({ error: 'Invalid hash' });
  }

  const normalized = hash.toLowerCase();
  const result = await crackHash(normalized, type || 'MD5');
  return res.status(200).json(result);
};

async function crackHash(hash, type) {
  // 1. Local DB — instant, no network
  if (COMMON_HASHES[hash]) {
    return { hash, result: COMMON_HASHES[hash], source: 'local-db', status: 'cracked' };
  }

  // 2. External APIs — run all in parallel, take first hit
  const endpoints = buildEndpoints(hash, type);

  const results = await Promise.allSettled(
    endpoints.map(ep => queryEndpoint(ep, hash))
  );

  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) {
      return { hash, result: r.value.result, source: r.value.source, status: 'cracked' };
    }
  }

  return { hash, result: null, source: null, status: 'failed' };
}

async function queryEndpoint(ep, hash) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(ep.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/json,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    clearTimeout(timer);
    const text = await response.text();
    const hit = ep.parse(text, hash);
    if (hit) return { result: hit, source: ep.name };
    return null;
  } catch (_) {
    clearTimeout(timer);
    return null;
  }
}

function buildEndpoints(hash, type) {
  const isMD5 = type === 'MD5';
  const isSHA1 = type === 'SHA-1';

  const all = [
    {
      name: 'nitrxgen.net',
      enabled: isMD5,
      url: `https://www.nitrxgen.net/md5db/${hash}`,
      parse: (text) => {
        const t = text.trim();
        return (t && t.length > 0 && t.length < 100 && t !== hash && !t.includes('<') && !t.includes('{'))
          ? t : null;
      }
    },
    {
      name: 'md5decrypt.net',
      enabled: isMD5,
      url: `https://md5decrypt.net/Api/api.php?hash=${hash}&hash_type=md5&email=test@test.com&code=code1`,
      parse: (text) => {
        const t = text.trim();
        return (t && t.length > 0 && t.length < 100 && t !== hash &&
                !t.toLowerCase().includes('error') && !t.includes('<'))
          ? t : null;
      }
    },
    {
      name: 'md5.gromweb.com',
      enabled: isMD5,
      url: `https://md5.gromweb.com/api/?md5=${hash}`,
      parse: (text) => {
        try {
          const d = JSON.parse(text);
          return (d && d.string && d.string !== hash) ? d.string : null;
        } catch (_) { return null; }
      }
    },
    {
      name: 'hashtoolkit.com',
      enabled: isMD5 || isSHA1,
      url: `https://hashtoolkit.com/reverse-hash/?hash=${hash}`,
      parse: (text) => {
        const patterns = [
          /class="[^"]*hash-value[^"]*"[^>]*>([^<]{1,80})</,
          /Decrypted[^>]*>[^<]*<[^>]+>([^<]{1,60})</,
          /value="([^"]{1,60})"\s*(?:id|class)="[^"]*(?:result|plain|decrypt)[^"]*"/i,
        ];
        for (const p of patterns) {
          const m = text.match(p);
          if (m && m[1].trim() && m[1].trim() !== hash) return m[1].trim();
        }
        return null;
      }
    },
  ];

  return all.filter(e => e.enabled);
}