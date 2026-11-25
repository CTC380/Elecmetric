/* Elecmetric Percentage Calculator: page script for Mode 01 (Basic Percentage). Inlined by tools/percent_basic_page.js after the engine (tools/percent_engine.js). */
(function () {
  var $ = function (id) { return document.getElementById(id); }, PC = Percent, X = $('ns-x'), Y = $('ns-y'), Vv = $('ns-v'), PL = $('ns-pl'), err = $('ns-err'), out = $('ns-out'), stp = $('ns-steps'), hist = $('ns-hist'), KEY = 'elecmetric.percent.basic.history';
  var H = [], last = null, timer = 0, kind = 'of', dir = 'p2d';
  var DEF = { of: ['20', '150'], what: ['45', '180'], whole: ['45', '25'], p2d: '25', d2p: '0.75', f2p: '3/4', p2f: '12.5' };
  var LAB = {
    of: ['Percentage (X)', 'Number (Y)', function (x, y) { return 'What is ' + (x || 'X') + '% of ' + (y || 'Y') + '?'; }],
    what: ['First number (X)', 'Second number (Y)', function (x, y) { return (x || 'X') + ' is what percentage of ' + (y || 'Y') + '?'; }],
    whole: ['Number (X)', 'Percentage (Y)', function (x, y) { return (x || 'X') + ' is ' + (y || 'Y') + '% of what number?'; }]
  };
  var CONV = { p2d: ['Percentage', 'Percentage to decimal', '25 or 25%'], d2p: ['Decimal', 'Decimal to percentage', '0.75'], f2p: ['Fraction', 'Fraction to percentage', '3/4'], p2f: ['Percentage', 'Percentage to fraction', '12.5 or 12.5%'] };
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
  function mark(els, bad) { els.forEach(function (el) { el.classList.toggle('bad', bad); el.setAttribute('aria-invalid', String(bad)); }); }
  function table(head, rows) { return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + esc(head.join(', ')) + '"><table class="ns-t"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function places() { return PL.value; }
  function fieldsFor() { return kind === 'conv' ? [Vv] : [X, Y]; }
  function setMode() {
    var conv = kind === 'conv';
    $('ns-pair').hidden = conv; $('ns-single').hidden = !conv; $('ns-dirs').hidden = !conv;
    Array.prototype.forEach.call(document.querySelectorAll('[data-k]'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.k === kind)); b.classList.toggle('on', b.dataset.k === kind); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-d]'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.d === dir)); b.classList.toggle('on', b.dataset.d === dir); });
    if (conv) { $('ns-lv').textContent = CONV[dir][0]; Vv.placeholder = CONV[dir][2]; Vv.setAttribute('inputmode', dir === 'f2p' ? 'text' : 'decimal'); }
    else { $('ns-lx').textContent = LAB[kind][0]; $('ns-ly').textContent = LAB[kind][1]; X.placeholder = DEF[kind][0]; Y.placeholder = DEF[kind][1]; }
  }
  function question() { return kind === 'conv' ? CONV[dir][1] : LAB[kind][2](X.value.trim().replace(/%$/, ''), Y.value.trim().replace(/%$/, '')); }
  function run() { return kind === 'conv' ? PC.convert({ dir: dir, v: Vv.value, places: places() }) : PC.calc({ kind: kind, x: X.value, y: Y.value, places: places() }); }
  function state() { return { k: kind, d: dir, x: X.value, y: Y.value, v: Vv.value, p: places() }; }
  function fail(r) { err.textContent = r.empty ? (r.hint || '') : r.error; err.classList.toggle('ns-hint', !!r.empty); mark(fieldsFor(), !r.empty); out.innerHTML = ''; last = null; stp.innerHTML = '<p class="note">Enter the values to see the working.</p>'; $('ns-q').textContent = question(); }
  function plain(r) {
    var L = [$('ns-q').textContent, r.sentence, '', 'Formula: ' + r.formula, 'Substituted: ' + r.subst, '', 'Working:'];
    r.steps.forEach(function (s, i) { L.push((i + 1) + '. ' + s); });
    if (r.warnings.length) { L.push('', 'Note: ' + r.warnings.join(' ')); }
    L.push('', 'Exact value: ' + r.frac + r.unit + (r.exact ? '' : ' (the displayed value is rounded)'), 'Calculated exactly in the browser by Elecmetric (' + location.href.split('#')[0] + ').');
    return disp(L.join('\n'));
  }
  function render() {
    var r = run(); $('ns-q').textContent = question();
    if (!r.ok) return fail(r);
    mark([X, Y, Vv], false); err.textContent = ''; err.classList.remove('ns-hint');
    var flag = r.exact ? '<span class="ns-flag">exact</span>' : '<span class="ns-flag r">rounded</span>';
    var rows = r.rows.map(function (x) { return '<tr><td>' + esc(disp(x[0])) + '</td><td class="r">' + esc(disp(x[1])) + '</td><td>' + esc(disp(x[2])) + '</td></tr>'; });
    out.innerHTML = '<div class="res"><div class="big">' + esc(disp(r.big)) + flag + cp(disp(r.big.replace(/^\u2248 /, '')), 'Copy the result') + '</div><div class="sub">' + esc(disp(r.sentence)) + '</div></div>' +
      '<div class="pf"><div><span class="ns-l">Formula</span><div class="fp">' + esc(r.formula) + '</div></div><div><span class="ns-l">With your numbers</span><div class="fp">' + esc(disp(r.subst)) + '</div></div></div>' +
      (r.warnings.length ? '<p class="note ns-warn">' + r.warnings.map(function (w) { return esc(w); }).join(' ') + '</p>' : '') +
      table(['Parameter', 'Result', 'Note'], rows) +
      '<div class="ns-act">' + cp(disp(r.sentence), 'Copy the sentence', 'Copy sentence') + cp(plain(r), 'Copy the whole calculation with working', 'Copy with working') + '<button type="button" class="btn2" data-act="save">Save as .txt</button><button type="button" class="btn2" data-act="print">Print</button></div>';
    stp.innerHTML = '<ol class="steps">' + r.steps.map(function (s) { return '<li>' + esc(disp(s)) + '</li>'; }).join('') + '<li>Result: ' + esc(disp(r.big)) + '.</li></ol>';
    last = { e: r.sentence, r: r.big, s: state(), t: plain(r) };
    clearTimeout(timer); timer = setTimeout(function () { if (last) push(last.e, last.r, last.s); }, 1500);
  }
  function apply(s) { kind = s.k; dir = s.d || dir; X.value = s.x == null ? '' : s.x; Y.value = s.y == null ? '' : s.y; Vv.value = s.v == null ? '' : s.v; PL.value = s.p == null ? 'auto' : s.p; if (!PL.value) PL.value = 'auto'; setMode(); render(); }
  function defaults() { if (kind === 'conv') Vv.value = DEF[dir]; else { X.value = DEF[kind][0]; Y.value = DEF[kind][1]; } }
  function saveTxt() { if (!last) return; var b = new Blob([last.t + '\n'], { type: 'text/plain;charset=utf-8' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'percentage-calculation.txt'; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(a.href); }, 500); note('Saved percentage-calculation.txt'); }
  $('ns').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.k) { kind = b.dataset.k; defaults(); setMode(); render(); return; }
    if (b.dataset.d) { dir = b.dataset.d; defaults(); setMode(); render(); return; }
    if (b.dataset.h) { var x = H[+b.dataset.h]; if (x) apply(x.s); return; }
    if (b.dataset.ex) { apply(JSON.parse(b.dataset.ex)); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'save') { saveTxt(); return; }
    if (b.dataset.act === 'clearh') { H = []; saveH(); drawH(); return; }
    if (b.dataset.act === 'reset') { defaults(); PL.value = 'auto'; render(); (kind === 'conv' ? Vv : X).focus(); }
  });
  [X, Y, Vv].forEach(function (el) { el.addEventListener('input', render); el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { clearTimeout(timer); render(); if (last) push(last.e, last.r, last.s); } }); });
  PL.addEventListener('change', render);
  loadH(); drawH(); defaults(); setMode(); render();
})();
