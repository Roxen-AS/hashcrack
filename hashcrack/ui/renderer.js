/**
 * ui/renderer.js
 * DOM rendering utilities — results table, badges, identify panel.
 */

const Renderer = (() => {

  /* ── Badge HTML ── */
  function badge(type) {
    const cls = (type || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, '');
    return `<span class="badge badge-${cls}">${type}</span>`;
  }

  /* ── Single result row ── */
  function resultRow(hash, result, index) {
    const r   = result || { hash, type: Detector.identify(hash), status: 'pending', result: null };
    const cls = r.status;

    let plainHtml;
    switch (r.status) {
      case 'cracked': plainHtml = `<span class="plaintext-cell">${escHtml(r.result)}</span>`; break;
      case 'loading': plainHtml = `<span class="spinner"></span>`; break;
      case 'failed':  plainHtml = `<span class="err-color" style="font-size:10px">NOT FOUND</span>`; break;
      default:        plainHtml = '—';
    }

    const actionHtml = r.status === 'cracked'
      ? `<button class="copy-btn" data-copy="${escAttr(r.result)}">COPY</button>`
      : `<button class="copy-btn" data-copy="${escAttr(hash)}">HASH</button>`;

    return `
      <div class="result-row ${cls}" data-hash="${escAttr(hash)}">
        <span class="dim" style="font-size:10px">${index + 1}</span>
        <span class="hash-cell" title="${escAttr(hash)}" data-copy="${escAttr(hash)}">${hash.substring(0, 28)}${hash.length > 28 ? '…' : ''}</span>
        ${badge(r.type || Detector.identify(hash))}
        <span>${plainHtml}</span>
        <span>${actionHtml}</span>
      </div>`;
  }

  /* ── Render full results list ── */
  function renderResults(containerId, hashes) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = hashes.map((h, i) => resultRow(h, Engine.getResult(h), i)).join('');
  }

  /* ── Identify panel ── */
  function renderIdentify(hash) {
    const el = document.getElementById('identify-output');
    if (!el) return;

    if (!hash) {
      el.innerHTML = '<span class="dim">Awaiting input — type or paste a hash above...</span>';
      return;
    }

    const type = Detector.identify(hash);
    const inf  = Detector.info(type);
    const ent  = Detector.entropy(hash).toFixed(2);
    const secColor = (type === 'MD5' || type === 'SHA-1' || type === 'NTLM')
      ? 'var(--err)' : (type === 'UNKNOWN' ? 'var(--warn)' : 'var(--g)');

    el.innerHTML = `
      <div class="identify-grid">
        <span class="dim">HASH</span>
        <span style="word-break:break-all;font-size:11px">${escHtml(hash)}</span>
        <span class="dim">TYPE</span>
        ${badge(type)}
        <span class="dim">LENGTH</span>
        <span>${hash.length} chars / ${hash.length * 4} bits output</span>
        <span class="dim">ALGORITHM</span>
        <span>${inf.algo}</span>
        <span class="dim">SECURITY</span>
        <span style="color:${secColor}">${inf.security}</span>
        <span class="dim">CRACKABILITY</span>
        <span>${inf.crackability}</span>
        <span class="dim">ENTROPY</span>
        <span>${ent} bits/char</span>
      </div>`;
  }

  /* ── Stats ── */
  function updateStats(stats) {
    setText('stat-total',   stats.total);
    setText('stat-cracked', stats.cracked);
    setText('stat-failed',  stats.failed);
    setText('stat-rate',    stats.rate + '%');
    const fill = document.getElementById('progress-fill');
    if (fill && stats.total > 0) {
      fill.style.width = ((stats.cracked + stats.failed) / stats.total * 100) + '%';
    }
  }

  /* ── Log ── */
  function log(msg, cls = 'log-info') {
    const el = document.getElementById('log-panel');
    if (!el) return;
    const ts = new Date().toLocaleTimeString('en-GB');
    el.innerHTML += `<div class="${cls}">[${ts}] ${msg}</div>`;
    el.scrollTop = el.scrollHeight;
  }

  /* ── Utilities ── */
  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function escAttr(s) {
    return String(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  return { renderResults, renderIdentify, updateStats, log, badge };

})();
