/* Elecmetric Exponent Calculator, Mode 03: page script. Inlined by tools/exponent_solver_page.js after the three engines (ExponentCalc, ExponentFrac, ExponentSolver). */
(function () {
  var $ = function (id) { return document.getElementById(id); }, X = ExponentSolver;
  var inp = { a: $('ex-a'), n: $('ex-n'), y: $('ex-y') }, sigS = $('ex-sig'), err = $('ex-err'), out = $('ex-out'), stp = $('ex-steps'), focus = inp.a;
  var DEF = { solve: 'n', a: '2', n: '', y: '32', sig: '6' }, HKEY = 'em-exponent-solver-history', hist = [], last = null, solve = 'n', vals = { a: '2', n: '', y: '32' };
  var LAB = { a: 'Base (a)', n: 'Exponent (n)', y: 'Result (y)' }, WHAT = { a: 'the base a', n: 'the exponent n', y: 'the result y' };
  var CLSL = { unique: 'Unique real solution', multiple: 'Multiple real solutions', none: 'No real solution', indeterminate: 'Indeterminate' };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function say(t) { $('ex-note').textContent = t; }
  function copy(t) { var d = function () { say('Copied ' + (t.length > 60 ? 'the text' : t)); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function copyBtn(t, label) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="Copy ' + esc(label) + '">Copy</button>'; }
  function state() { return { solve: solve, a: vals.a, n: vals.n, y: vals.y, sig: sigS.value }; }
  function setState(d) { solve = d.solve === 'a' || d.solve === 'y' ? d.solve : 'n'; vals = { a: d.a || '', n: d.n || '', y: d.y || '' }; sigS.value = d.sig || '6'; render(); }
  function mark(field) { ['a', 'n', 'y'].forEach(function (k) { var bad = k === field; inp[k].classList.toggle('bad', bad); inp[k].setAttribute('aria-invalid', String(bad)); }); }
  function solvedText(r) {
    if (!r || !r.solutions || !r.solutions.length) return '';
    var s = r.solutions[0];
    if (r.solutions.length > 1) return '\u00b1' + (s.exactText || s.decimal);
    return s.text;
  }
  function sync(r) {
    ['a', 'n', 'y'].forEach(function (k) {
      var el = inp[k], unk = k === solve, lab = $('ex-l' + k), v = unk ? solvedText(r) : vals[k];
      el.readOnly = unk; el.classList.toggle('solved', unk && !!v); el.setAttribute('aria-readonly', String(unk));
      el.placeholder = unk ? 'solved here' : (k === 'a' ? 'e.g. 2, \u22128, 1/2, e' : k === 'n' ? 'e.g. 3, \u22122, 1/2, 0.75' : 'e.g. 32, 125, \u22128, 0.001');
      if (el.value !== v) el.value = v;
      if (lab) lab.textContent = LAB[k] + (unk ? ': solved' : '');
    });
    var btns = $('ex-unk').children;
    for (var i = 0; i < (btns ? btns.length : 0); i++) { var b = btns[i]; if (b.dataset && b.dataset.solve) b.setAttribute('aria-pressed', String(b.dataset.solve === solve)); }
  }
  function card(label, big, copyText, sub) { return '<div class="dp-c"><span class="ns-l">' + esc(label) + '</span><div class="big">' + esc(big) + (copyText ? copyBtn(copyText, label) : '') + '</div><div class="sub">' + esc(sub || '') + '</div></div>'; }
  function plain(t) { return String(t).replace(/^\u2248\s*/, '').replace(/\u2212/g, '-'); }
  function render() {
    var r = X.run({ solve: solve, a: vals.a, n: vals.n, y: vals.y, sig: sigS.value });
    last = null; $('ex-dl').hidden = true;
    if (!r.ok) {
      sync(null);
      err.textContent = r.empty ? '' : r.error; err.classList.toggle('hint', !!(r.empty || r.partial)); mark(r.empty || r.partial ? null : r.field);
      out.innerHTML = ''; stp.innerHTML = '<p class="note">Enter the two known values to see the answer and the working.</p>'; return;
    }
    err.textContent = ''; err.classList.remove('hint'); mark(null); sync(r);
    var html = '<p class="ex-cls c-' + r.cls + '"><b>' + esc(CLSL[r.cls]) + '.</b> ' + esc(r.message) + '</p>', cards = '', rows = [['Equation', r.equation, ''], ['Solving for', WHAT[r.solve], ''], ['Classification', CLSL[r.cls], '']];
    var multi = r.solutions.length > 1;
    r.solutions.forEach(function (s, k) {
      var name = r.solve === 'a' && multi ? 'a' + (k === 0 ? '\u2081' : '\u2082') : r.solve, label = (r.solve === 'a' ? 'Base ' : r.solve === 'n' ? 'Exponent ' : 'Result ') + name;
      cards += card(label, s.text, plain(s.exactText || s.decimal), s.exact ? 'exact' : s.exactText ? 'exact radical form' : 'approximate (about 15 reliable digits)');
      if (s.exactText && s.decimal !== s.exactText) cards += card('Decimal', (s.decimalApprox ? '\u2248 ' : '') + s.decimal, plain(s.decimal), s.decimalApprox ? 'rounded for display' : 'exact');
      rows.push([name, s.text, s.exact ? 'exact' : s.exactText ? 'exact radical form' : 'approximate']); rows.push(['Scientific notation of ' + name, s.sci, '']);
    });
    var tbl = '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: result summary"><table class="ns-t"><thead><tr><th scope="col">Item</th><th scope="col">Value</th><th scope="col">Note</th></tr></thead><tbody>' + rows.map(function (x) { return '<tr><th scope="row">' + esc(x[0]) + '</th><td class="r">' + esc(x[1]) + '</td><td>' + esc(x[2]) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    var warn = (r.warnings || []).map(function (w) { return '<p class="note warn">' + esc(w.message) + '</p>'; }).join('') + (r.radicalNote ? '<p class="note warn">' + esc(r.radicalNote) + '</p>' : '');
    out.innerHTML = html + (cards ? '<div class="dp-cards">' + cards + '</div>' : '') + tbl + warn;
    stp.innerHTML = r.steps.map(function (x) { return '<h3>' + esc(x.title) + '</h3><pre class="al" tabindex="0">' + esc(x.text) + '</pre>'; }).join('') + (r.check ? '<h3>Check</h3><pre class="al" tabindex="0">' + esc(r.check.ok ? (r.check.detail ? 'Passed: ' + r.check.detail + '.' : 'Passed.') : 'FAILED: ' + r.check.detail) + '</pre>' : '');
    last = { r: r, text: X.headline(r) }; $('ex-dl').hidden = false;
  }
  function download(name, mime, text) { var a = document.createElement('a'), u = URL.createObjectURL(new Blob([text], { type: mime })); a.href = u; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(u); }, 500); say('Downloaded ' + name); }
  function loadHist() { try { var x = JSON.parse(localStorage.getItem(HKEY) || '[]'); hist = Array.isArray(x) ? x.filter(function (h) { return h && typeof h.text === 'string' && h.s && typeof h.s === 'object'; }).slice(0, 10) : []; } catch (e) { hist = []; } }
  function saveHist() { try { localStorage.setItem(HKEY, JSON.stringify(hist.slice(0, 10))); } catch (e) {} }
  function drawHist() {
    $('ex-hist').innerHTML = hist.length ? hist.map(function (h, k) { return '<li><button type="button" class="chipb" data-h="' + k + '" aria-label="Use again: ' + esc(h.text) + '">' + esc(h.text) + '</button></li>'; }).join('') : '<li class="note">No saved calculations yet. Press Save to history or Enter.</li>';
    $('ex-hclear').hidden = !hist.length;
  }
  function keep() { if (!last) return; var t = last.text.length > 90 ? last.text.slice(0, 87) + '\u2026' : last.text; hist = hist.filter(function (h) { return h.text !== t; }); hist.unshift({ text: t, s: state() }); hist = hist.slice(0, 10); saveHist(); drawHist(); say('Saved to history'); }
  function target() { var el = focus; if (!el || el.readOnly) el = ['a', 'n', 'y'].map(function (k) { return inp[k]; }).filter(function (e) { return !e.readOnly; })[0]; return el; }
  function insert(k) {
    var el = target(), key = Object.keys(inp).filter(function (x) { return inp[x] === el; })[0], v = el.value, s = el.selectionStart, e = el.selectionEnd;
    if (typeof s !== 'number') { s = e = v.length; }
    if (k === 'back') { if (s !== e) { el.value = v.slice(0, s) + v.slice(e); e = s; } else if (s > 0) { el.value = v.slice(0, s - 1) + v.slice(s); s = e = s - 1; } }
    else { el.value = v.slice(0, s) + (k === '-' ? '\u2212' : k) + v.slice(e); s = e = s + 1; }
    vals[key] = el.value; el.focus(); try { el.setSelectionRange(s, e); } catch (x) {} render();
  }
  ['a', 'n', 'y'].forEach(function (k) {
    var el = inp[k];
    el.addEventListener('focus', function () { focus = el; });
    el.addEventListener('input', function () { if (!el.readOnly) { vals[k] = el.value; render(); } });
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); keep(); } });
  });
  $('ex').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.solve) { solve = b.dataset.solve; render(); return; }
    if (b.dataset.key) { insert(b.dataset.key); return; }
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.ex) { setState(JSON.parse(b.dataset.ex)); return; }
    if (b.dataset.h !== undefined) { var h = hist[Number(b.dataset.h)]; if (h) setState(h.s); return; }
    if (b.dataset.act === 'reset') { setState(DEF); return; }
    if (b.dataset.act === 'save') { keep(); return; }
    if (b.dataset.act === 'clear') { vals = { a: '', n: '', y: '' }; render(); var t = target(); if (t) t.focus(); return; }
    if (b.dataset.act === 'hclear') { hist = []; saveHist(); drawHist(); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'copyall' && last) { copy(X.exportTxt(last.r)); return; }
    if (b.dataset.dl && last) { var n = 'exponent-missing-value'; if (b.dataset.dl === 'txt') download(n + '.txt', 'text/plain', X.exportTxt(last.r)); if (b.dataset.dl === 'csv') download(n + '.csv', 'text/csv', X.exportCsv(last.r)); if (b.dataset.dl === 'json') download(n + '.json', 'application/json', X.exportJson(last.r)); }
  });
  sigS.addEventListener('change', render); sigS.addEventListener('input', render);
  loadHist(); drawHist(); setState(DEF);
})();
