/* Elecmetric Percent Error Calculator: page script for Mode 02 (Signed Error Analysis). Inlined by tools/pe_page.js after the three engines
   (tools/percent_engine.js, percent_error_engine.js, pe_engine.js and pe_signed_engine.js). */
(function () {
  var $ = function (id) { return document.getElementById(id); }, PC = PercentErrorMode02, X = $('ns-x'), Y = $('ns-y'), U = $('ns-u'), PL = $('ns-pl'), err = $('ns-err'), out = $('ns-out'), stp = $('ns-steps'), hist = $('ns-hist'), KEY = 'elecmetric.pe.signed.history';
  var H = [], last = null, timer = 0;
  var DEF = { x: '225', y: '230', u: 'V' };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function disp(s) { return String(s).replace(/-(?=[\d.(])/g, '\u2212'); }
  function note(t) { $('ns-note').textContent = t; }
  function copy(t) { var d = function () { note('Copied'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function cp(t, l, w) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="' + esc(l) + '">' + (w || 'Copy') + '</button>'; }
  function loadH() { try { var s = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(s)) H = s.filter(function (x) { return x && typeof x.e === 'string' && typeof x.r === 'string' && x.s && typeof x.s === 'object'; }).slice(0, 10); } catch (e) { H = []; } }
  function saveH() { try { localStorage.setItem(KEY, JSON.stringify(H)); } catch (e) {} }
  function drawH() {
    if (!H.length) { hist.innerHTML = '<p class="note">Your last ten calculations appear here. They are kept only in this browser.</p>'; return; }
    hist.innerHTML = '<ul class="fh">' + H.map(function (x, i) { return '<li><button type="button" class="chipb" data-h="' + i + '" aria-label="Use again: ' + esc(x.e) + '">' + esc(disp(x.e)) + '</button></li>'; }).join('') + '</ul><button type="button" class="btn2" data-act="clearh">Clear history</button>';
  }
  function push(e, r, s) { if (H.length && H[0].e === e) return; H.unshift({ e: e, r: r, s: s }); H = H.slice(0, 10); saveH(); drawH(); }
  function mark(bad, ubad) { [X, Y].forEach(function (el) { el.classList.toggle('bad', bad && !ubad); el.setAttribute('aria-invalid', String(bad && !ubad)); }); U.classList.toggle('bad', !!ubad); U.setAttribute('aria-invalid', String(!!ubad)); }
  function table(head, rows) { return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + esc(head.join(', ')) + '"><table class="ns-t"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function withU(v, u) { return u ? v + (u === '%' || u.charAt(0) === '\u00b0' ? '' : ' ') + u : v; }
  function question() { var u = U.value.trim().slice(0, 16); return 'What is the signed deviation of an observed value of ' + withU(X.value.trim() || 'O', u) + ' against a reference of ' + withU(Y.value.trim() || 'R', u) + '?'; }
  function run() { return PC.calc({ x: X.value, y: Y.value, unit: U.value, places: PL.value }); }
  function state() { return { x: X.value, y: Y.value, u: U.value, p: PL.value }; }
  function fail(r) { err.textContent = r.empty ? (r.hint || '') : r.error; err.classList.toggle('ns-hint', !!r.empty); mark(!r.empty, !r.empty && /^The unit label/.test(r.error)); out.innerHTML = ''; last = null; stp.innerHTML = '<p class="note">Enter the values to see the working.</p>'; $('ns-q').textContent = question(); }
  function plain(r) {
    var L = [$('ns-q').textContent, r.sentence, '', 'Formula: ' + r.formula, 'Substituted: ' + r.subst, '', 'Working:'];
    r.steps.forEach(function (s, i) { L.push((i + 1) + '. ' + s); });
    if (r.warnings.length) { L.push('', 'Note: ' + r.warnings.join(' ')); }
    L.push('', 'Exact value: ' + r.frac + '%' + (r.exact ? '' : ' (the displayed value is rounded)'), 'Calculated exactly in the browser by Elecmetric (' + location.href.split('#')[0] + ').');
    return disp(L.join('\n'));
  }
  function render() {
    var r = run(); $('ns-q').textContent = question();
    if (!r.ok) return fail(r);
    mark(false, false); err.textContent = ''; err.classList.remove('ns-hint');
    var flag = r.exact ? '<span class="ns-flag">exact</span>' : '<span class="ns-flag r">rounded</span>';
    var dirFlag = '<span class="ns-flag' + (r.dir === 'below' ? ' r' : '') + '">' + esc(r.dir === 'equal' ? 'equal' : r.dir + ' reference') + '</span>';
    var rows = r.rows.map(function (x) { return '<tr><td>' + esc(disp(x[0])) + '</td><td class="r">' + esc(disp(x[1])) + '</td><td>' + esc(disp(x[2])) + '</td></tr>'; });
    out.innerHTML = '<div class="res"><div class="big">' + esc(disp(r.big)) + flag + dirFlag + cp(disp(r.big.replace(/^\u2248 /, '')), 'Copy the result') + '</div><div class="sub">' + esc(disp(r.sentence)) + '</div></div>' +
      '<div class="pf"><div><span class="ns-l">Formula</span><div class="fp">' + esc(r.formula) + '</div></div><div><span class="ns-l">With your numbers</span><div class="fp">' + esc(disp(r.subst)) + '</div></div></div>' +
      (r.warnings.length ? '<p class="note ns-warn">' + r.warnings.map(function (w) { return esc(w); }).join(' ') + '</p>' : '') +
      table(['Parameter', 'Result', 'Note'], rows) +
      '<div class="ns-act">' + cp(disp(r.sentence), 'Copy the sentence', 'Copy sentence') + cp(plain(r), 'Copy the whole calculation with working', 'Copy with working') + '<button type="button" class="btn2" data-act="csv">Save as .csv</button><button type="button" class="btn2" data-act="save">Save as .txt</button><button type="button" class="btn2" data-act="print">Print</button></div>';
    stp.innerHTML = '<ol class="steps">' + r.steps.map(function (s) { return '<li>' + esc(disp(s)) + '</li>'; }).join('') + '<li>Result: ' + esc(disp(r.big)) + '.</li></ol>';
    last = { e: r.sentence, r: r.big, s: state(), t: plain(r), rows: r.rows };
    clearTimeout(timer); timer = setTimeout(function () { if (last) push(last.e, last.r, last.s); }, 1500);
  }
  function apply(s) { X.value = s.x == null ? '' : s.x; Y.value = s.y == null ? '' : s.y; U.value = s.u == null ? '' : s.u; PL.value = s.p == null ? 'auto' : s.p; if (!PL.value) PL.value = 'auto'; render(); }
  function defaults() { X.value = DEF.x; Y.value = DEF.y; U.value = DEF.u; }
  function download(text, name, type) { var b = new Blob([text], { type: type }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(a.href); }, 500); note('Saved ' + name); }
  function csvCell(s) { s = disp(String(s)); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; }
  function saveCsv() { if (!last) return; var L = ['Parameter,Result,Note'].concat(last.rows.map(function (x) { return x.map(csvCell).join(','); })); download('\ufeff' + L.join('\r\n') + '\r\n', 'signed-error-analysis.csv', 'text/csv;charset=utf-8'); }
  function saveTxt() { if (!last) return; download(last.t + '\n', 'signed-error-analysis.txt', 'text/plain;charset=utf-8'); }
  $('ns').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.h) { var x = H[+b.dataset.h]; if (x) apply(x.s); return; }
    if (b.dataset.ex) { apply(JSON.parse(b.dataset.ex)); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'save') { saveTxt(); return; }
    if (b.dataset.act === 'csv') { saveCsv(); return; }
    if (b.dataset.act === 'clearh') { H = []; saveH(); drawH(); return; }
    if (b.dataset.act === 'reset') { defaults(); PL.value = 'auto'; render(); X.focus(); }
  });
  [X, Y, U].forEach(function (el) { el.addEventListener('input', render); el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { clearTimeout(timer); render(); if (last) push(last.e, last.r, last.s); } }); });
  PL.addEventListener('change', render);
  loadH(); drawH(); defaults(); render();
})();
