/**
 * ui/app.js
 * Application controller — wires Engine, Renderer, Detector, Lookup together.
 * Handles all UI events: tabs, crack, identify, file drop, AI analysis, export.
 */

(function () {

  /* ═══════════════════════════════════════
     TAB SWITCHING
  ═══════════════════════════════════════ */
  function initTabs() {
    document.querySelectorAll('.hb-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.tab;
        document.querySelectorAll('.hb-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('panel-' + id).classList.add('active');
      });
    });
  }

  /* ═══════════════════════════════════════
     CLOCK
  ═══════════════════════════════════════ */
  function initClock() {
    const tick = () => {
      const el = document.getElementById('sys-time');
      if (el) el.textContent = new Date().toLocaleTimeString('en-GB');
    };
    tick();
    setInterval(tick, 1000);

    // mark API ready after short delay
    setTimeout(() => {
      const s = document.getElementById('api-status');
      if (s) { s.textContent = 'API: READY'; s.className = 'status-ok'; }
    }, 800);
  }

  /* ═══════════════════════════════════════
     CRACK PANEL
  ═══════════════════════════════════════ */
  function initCrack() {
    const crackBtn  = document.getElementById('crack-btn');
    const clearBtn  = document.getElementById('clear-btn');
    const exportBtn = document.getElementById('export-btn');
    const threadEl  = document.getElementById('thread-count');
    const tcVal     = document.getElementById('tc-val');

    // thread slider
    threadEl.addEventListener('input', () => { tcVal.textContent = threadEl.value; });

    // crack button
    crackBtn.addEventListener('click', async () => {
      if (Engine.isRunning()) return;
      const raw = document.getElementById('hash-input').value.trim();
      if (!raw) { Renderer.log('No input provided.', 'log-warn'); return; }
      await Engine.run(raw, parseInt(threadEl.value));
    });

    // clear
    clearBtn.addEventListener('click', () => {
      document.getElementById('hash-input').value = '';
      document.getElementById('results-container').innerHTML = '';
      document.getElementById('progress-fill').style.width = '0%';
      Engine.reset();
      Renderer.updateStats({ total: 0, cracked: 0, failed: 0, rate: 0 });
      Renderer.log('Cleared all results.', 'log-dim');
    });

    // export
    exportBtn.addEventListener('click', () => {
      const tsv = Engine.exportTSV();
      if (!tsv) { Renderer.log('No results to export.', 'log-warn'); return; }
      const blob = new Blob([tsv], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'hashcrack_results.txt';
      a.click();
      Renderer.log('Results exported.', 'log-dim');
    });

    // delegate copy clicks in results
    document.getElementById('results-container').addEventListener('click', e => {
      const btn = e.target.closest('[data-copy]');
      if (btn) copyToClipboard(btn.dataset.copy);
    });

    // wire Engine events
    Engine.on('start', ({ total }) => {
      crackBtn.disabled = true;
      crackBtn.textContent = '⟳ RUNNING...';
      Renderer.log(`Queued ${total} hash(es) for cracking.`);
      Renderer.renderResults('results-container', Engine.getHashes());
      Renderer.updateStats(Engine.getStats());
    });

    Engine.on('update', ({ hash, result, stats }) => {
      Renderer.renderResults('results-container', Engine.getHashes());
      Renderer.updateStats(stats);
      if (result.status === 'cracked') {
        Renderer.log(`✓ CRACKED [${result.type}] ${hash.substring(0,16)}… → "${result.result}"`, 'log-info');
      } else if (result.status === 'failed') {
        Renderer.log(`✗ NOT FOUND [${result.type}] ${hash.substring(0,16)}…`, 'log-warn');
      }
    });

    Engine.on('done', ({ stats }) => {
      crackBtn.disabled = false;
      crackBtn.textContent = '▶ RUN CRACK';
      Renderer.log(
        `Done. ${stats.cracked}/${stats.total} cracked. Success rate: ${stats.rate}%`,
        stats.cracked > 0 ? 'log-info' : 'log-warn'
      );
    });

    Engine.on('error', (msg) => {
      Renderer.log(msg, 'log-err');
    });

    Engine.on('reset', () => {});
  }

  /* ═══════════════════════════════════════
     IDENTIFY PANEL
  ═══════════════════════════════════════ */
  function initIdentify() {
    const input = document.getElementById('identify-input');
    input.addEventListener('input', () => Renderer.renderIdentify(input.value.trim()));
  }

  /* ═══════════════════════════════════════
     FILE PANEL
  ═══════════════════════════════════════ */
  let fileHashes = [];

  function initFile() {
    const zone        = document.getElementById('drop-zone');
    const fileInput   = document.getElementById('file-input');
    const crackBtn    = document.getElementById('file-crack-btn');

    zone.addEventListener('click', () => fileInput.click());
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const f = e.dataTransfer.files[0];
      if (f) readFile(f);
    });

    fileInput.addEventListener('change', e => {
      if (e.target.files[0]) readFile(e.target.files[0]);
    });

    crackBtn.addEventListener('click', async () => {
      if (!fileHashes.length) return;
      document.getElementById('hash-input').value = fileHashes.join('\n');
      // switch to crack tab
      document.querySelectorAll('.hb-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === 'crack');
      });
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      document.getElementById('panel-crack').classList.add('active');
      await Engine.run(fileHashes.join('\n'), parseInt(document.getElementById('thread-count').value));
    });
  }

  function readFile(file) {
    const reader = new FileReader();
    reader.onload = e => {
      fileHashes = Detector.extractFromText(e.target.result);
      renderFilePreview(file, fileHashes);
      document.getElementById('file-crack-btn').disabled = fileHashes.length === 0;
    };
    reader.readAsText(file);
  }

  function renderFilePreview(file, hashes) {
    document.getElementById('file-preview').innerHTML =
      `<span style="color:var(--g)">✓ ${file.name}</span> — ${(file.size / 1024).toFixed(1)} KB — ` +
      `<span class="warn">${hashes.length} hash(es) extracted</span>`;

    const container = document.getElementById('file-results');
    if (hashes.length === 0) {
      container.innerHTML = '<div class="err-color small" style="padding:8px">No hashes found in file.</div>';
      return;
    }

    let html = `<div class="small dim" style="padding:4px 0 6px">EXTRACTED HASHES (${hashes.length} total):</div>`;
    hashes.slice(0, 30).forEach((h, i) => {
      html += `
        <div style="font-size:11px;padding:3px 0;border-bottom:1px solid #00ff8808;display:flex;gap:8px;align-items:center">
          <span class="dim" style="font-size:10px;min-width:22px">${i + 1}</span>
          ${Renderer.badge(Detector.identify(h))}
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">${h}</span>
        </div>`;
    });
    if (hashes.length > 30) html += `<div class="small dim" style="padding:4px">… and ${hashes.length - 30} more</div>`;
    container.innerHTML = html;
  }

  /* ═══════════════════════════════════════
     AI ANALYSIS PANEL
  ═══════════════════════════════════════ */
  function initAI() {
    document.getElementById('ai-btn').addEventListener('click', runAIAnalysis);
    document.getElementById('ai-clear-btn').addEventListener('click', () => {
      document.getElementById('ai-output').innerHTML = '<span class="dim">Cleared.</span>';
    });
  }

  async function runAIAnalysis() {
    const btn = document.getElementById('ai-btn');
    const out = document.getElementById('ai-output');
    const all = Engine.getAllResults();
    const allArr = Object.values(all);

    if (allArr.length === 0) {
      out.innerHTML = '<span class="warn">No hashes to analyze. Run the CRACK tab first.</span>';
      return;
    }

    btn.disabled = true;
    btn.textContent = '⟳ ANALYZING...';
    out.innerHTML = '<span class="spinner"></span> Consulting AI SRE engine...';

    const cracked   = allArr.filter(r => r.status === 'cracked');
    const uncracked = allArr.filter(r => r.status === 'failed');

    const prompt = `You are a senior security engineer analyzing hash cracking results.

CRACKED (${cracked.length}): ${cracked.slice(0, 10).map(r => `${r.type}:${r.result}`).join(', ')}
UNCRACKED (${uncracked.length}): ${uncracked.slice(0, 15).map(r => `${r.type}:${r.hash.substring(0, 16)}...`).join(', ')}
TOTAL HASHES: ${allArr.length}

Provide a concise security analysis:
1. Password strength assessment of cracked plaintexts (patterns, weaknesses)
2. Hash algorithm security rating for each type found
3. Attack recommendations for uncracked hashes (wordlist, rules, GPU time estimate)
4. Overall security posture and remediation advice

Be direct, technical, use bullet points. Under 300 words.`;

    try {
      const res  = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await res.json();
      const text = (data.content || []).map(b => b.text || '').join('');
      out.textContent = text || 'No response from AI.';
    } catch (err) {
      out.innerHTML = `<span class="err-color">API error: ${err.message}</span>`;
    }

    btn.disabled = false;
    btn.textContent = '⚡ ANALYZE HASHES';
  }

  /* ═══════════════════════════════════════
     CLIPBOARD
  ═══════════════════════════════════════ */
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      Renderer.log(`Copied: ${text.substring(0, 40)}`, 'log-dim');
    });
  }

  /* ═══════════════════════════════════════
     INIT
  ═══════════════════════════════════════ */
  function init() {
    initClock();
    initTabs();
    initCrack();
    initIdentify();
    initFile();
    initAI();

    Renderer.log('HashCrack v4.0-BOSS initialized. Multi-API cascade ready.');
    Renderer.log('Supported: MD5, SHA-1, SHA-224, SHA-256, SHA-384, SHA-512, NTLM', 'log-dim');
    Renderer.updateStats({ total: 0, cracked: 0, failed: 0, rate: 0 });
  }

  document.addEventListener('DOMContentLoaded', init);

})();
