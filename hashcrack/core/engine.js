/**
 * core/engine.js
 * Crack engine — manages job queue, concurrency, state, and events.
 */

const Engine = (() => {

  /* ── State ── */
  let state = {
    hashes:    [],   // string[]
    results:   {},   // hash → result object
    running:   false,
    threads:   5,
  };

  /* ── Event bus ── */
  const listeners = {};

  function on(event, fn) {
    (listeners[event] = listeners[event] || []).push(fn);
  }

  function emit(event, data) {
    (listeners[event] || []).forEach(fn => fn(data));
  }

  /* ── Helpers ── */
  function getStats() {
    const total   = state.hashes.length;
    const cracked = Object.values(state.results).filter(r => r.status === 'cracked').length;
    const failed  = Object.values(state.results).filter(r => r.status === 'failed').length;
    const rate    = total > 0 ? Math.round((cracked / total) * 100) : 0;
    return { total, cracked, failed, rate };
  }

  function getResult(hash) {
    return state.results[hash] || null;
  }

  function getAllResults() {
    return { ...state.results };
  }

  function getHashes() {
    return [...state.hashes];
  }

  function isRunning() {
    return state.running;
  }

  /* ── Core: chunk-based parallel runner ── */
  async function run(rawInput, threads) {
    if (state.running) return;

    const hashes = Detector.parseInput(rawInput);
    if (hashes.length === 0) {
      emit('error', 'No valid hashes detected in input.');
      return;
    }

    state.hashes  = hashes;
    state.results = {};
    state.running = true;
    state.threads = threads || 5;

    emit('start', { total: hashes.length });

    // chunk into batches of `threads`
    const chunks = [];
    for (let i = 0; i < hashes.length; i += state.threads) {
      chunks.push(hashes.slice(i, i + state.threads));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(async (hash) => {
        // mark loading
        state.results[hash] = {
          hash, type: Detector.identify(hash), result: null, status: 'loading', source: null
        };
        emit('update', { hash, result: state.results[hash], stats: getStats() });

        const res = await Lookup.crack(hash);
        state.results[hash] = res;
        emit('update', { hash, result: res, stats: getStats() });
      });

      await Promise.all(promises);
    }

    state.running = false;
    emit('done', { stats: getStats() });
  }

  function reset() {
    state.hashes  = [];
    state.results = {};
    state.running = false;
    emit('reset', {});
  }

  /** Export results as TSV string */
  function exportTSV() {
    const lines = ['HASH\tTYPE\tPLAINTEXT\tSOURCE'];
    for (const hash of state.hashes) {
      const r = state.results[hash];
      if (!r) continue;
      lines.push([hash, r.type, r.result || 'NOT_FOUND', r.source || '—'].join('\t'));
    }
    return lines.join('\n');
  }

  return { on, run, reset, getStats, getResult, getAllResults, getHashes, isRunning, exportTSV };

})();
