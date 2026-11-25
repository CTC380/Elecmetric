/* Elecmetric Percentage Calculator: page script for Mode 05 (Engineering Percentage Analysis). Inlined by tools/percent_eng_page.js after the two engines
   (tools/percent_engine.js and tools/percent_eng_engine.js). */
(function () {
  var $ = function (id) { return document.getElementById(id); }, PC = PercentEng, X = $('ns-x'), Y = $('ns-y'), PL = $('ns-pl'), err = $('ns-err'), out = $('ns-out'), stp = $('ns-steps'), hist = $('ns-hist'), KEY = 'elecmetric.percent.eng.history';
  var H = [], last = null, timer = 0, kind = 'eff';
  var DEF = { eff: ['100', '96'], load: ['150', '200'], vdrop: ['230', '9.2'], vdev: ['230', '225'], lf: ['62', '100'], df: ['350', '500'], div: ['1200', '900'], derate: ['200', '170'], save: ['1000', '750'], soc: ['38', '50'], ploss: ['4', '100'] };
  var Q = {
    eff: function (x, y) { return 'What is the efficiency for an input power of ' + x + ' and an output power of ' + y + '?'; },
    load: function (x, y) { return 'What is the loading for an actual ' + x + ' on a rated capacity of ' + y + '?'; },
    vdrop: function (x, y) { return 'What is the voltage drop percentage for a source voltage of ' + x + ' and a drop of ' + y + '?'; },
    vdev: function (x, y) { return 'What is the deviation of an actual voltage of ' + y + ' from a nominal voltage of ' + x + '?'; },
    lf: function (x, y) { return 'What is the load factor for an average load of ' + x + ' and a peak load of ' + y + '?'; },
    df: function (x, y) { return 'What is the demand factor for a maximum demand of ' + x + ' and a connected load of ' + y + '?'; },
    div: function (x, y) { return 'What is the diversity factor for individual maxima summing to ' + x + ' and a group maximum of ' + y + '?'; },
    derate: function (x, y) { return 'What is the derating for a rated capacity of ' + x + ' and a usable capacity of ' + y + '?'; },
    save: function (x, y) { return 'What is the energy saving from a previous consumption of ' + x + ' to a new consumption of ' + y + '?'; },
    soc: function (x, y) { return 'What is the state of charge for ' + x + ' remaining of a usable ' + y + '?'; },
    ploss: function (x, y) { return 'What percentage is a loss of ' + x + ' of a reference power of ' + y + '?'; }
  };
  var LAB = {}; PC.KINDS.forEach(function (k) { LAB[k] = [PC.LABELS[k][0] + (PC.DEFS[k].ref === 'x' ? ' (reference)' : ''), PC.LABELS[k][1] + (PC.DEFS[k].ref === 'y' ? ' (reference)' : ''), function (x, y) { return Q[k](x || '?', y || '?'); }]; });
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function disp(s) { return String(s).replace(/-(?=[\d.(])/g, '\u2212'); }
  function note(t) { $('ns-note').textContent = t; }
  function copy(t) { var d = function () { note('Copied'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function cp(t, l, w) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="' + esc(l) + '">' + (w || 'Copy') + '</button>'; }
  function loadH() { try { var s = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(s)) H = s.filter(function (x) { return x && typeof x.e === 'string' && typeof x.r === 'string' && x.s && typeof x.s === 'object' && LAB[x.s.k]; }).slice(0, 10); } catch (e) { H = []; } }
  function saveH() { try { localStorage.setItem(KEY, JSON.stringify(H)); } catch (e) {} }
  function drawH() {
    if (!H.length) { hist.innerHTML = '<p class="note">Your last ten calculations appear here. They are kept only in this browser.</p>'; return; }
    hist.innerHTML = '<ul class="fh">' + H.map(function (x, i) { return '<li><button type="button" class="chipb" data-h="' + i + '" aria-label="Use again: ' + esc(x.e) + '">' + esc(disp(x.e)) + '</button></li>'; }).join('') + '</ul><button type="button" class="btn2" data-act="clearh">Clear history</button>';
  }
  function push(e, r, s) { if (H.length && H[0].e === e) return; H.unshift({ e: e, r: r, s: s }); H = H.slice(0, 10); saveH(); drawH(); }
  function mark(bad) { [X, Y].forEach(function (el) { el.classList.toggle('bad', bad); el.setAttribute('aria-invalid', String(bad)); }); }
  function table(head, rows) { return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + esc(head.join(', ')) + '"><table class="ns-t"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function setMode() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-k]'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.k === kind)); b.classList.toggle('on', b.dataset.k === kind); });
    $('ns-lx').textContent = LAB[kind][0]; $('ns-ly').textContent = LAB[kind][1]; X.placeholder = DEF[kind][0]; Y.placeholder = DEF[kind][1];
  }
  function question() { return LAB[kind][2](X.value.trim(), Y.value.trim()); }
  function run() { return PC.calc({ kind: kind, x: X.value, y: Y.value, places: PL.value }); }
  function state() { return { k: kind, x: X.value, y: Y.value, p: PL.value }; }
  function fail(r) { err.textContent = r.empty ? (r.hint || '') : r.error; err.classList.toggle('ns-hint', !!r.empty); mark(!r.empty); out.innerHTML = ''; last = null; stp.innerHTML = '<p class="note">Enter the values to see the working.</p>'; $('ns-q').textContent = question(); }
  function plain(r) {
    var L = [$('ns-q').textContent, r.sentence, 'Reference quantity: ' + r.reference, '', 'Formula: ' + r.formula, 'Substituted: ' + r.subst, '', 'Working:'];
    r.steps.forEach(function (s, i) { L.push((i + 1) + '. ' + s); });
    if (r.warnings.length) { L.push('', 'Note: ' + r.warnings.join(' ')); }
    L.push('', 'Exact value: ' + r.frac + r.unit + (r.exact ? '' : ' (the displayed value is rounded)'), 'Calculated exactly in the browser by Elecmetric (' + location.href.split('#')[0] + ').');
    return disp(L.join('\n'));
  }
  function render() {
    var r = run(); $('ns-q').textContent = question();
    if (!r.ok) return fail(r);
    mark(false); err.textContent = ''; err.classList.remove('ns-hint');
    var flag = r.exact ? '<span class="ns-flag">exact</span>' : '<span class="ns-flag r">rounded</span>';
    var dirFlag = r.dir ? '<span class="ns-flag' + (r.dir === 'below' || r.dir === 'increase' ? ' r' : '') + '">' + esc(r.dir) + '</span>' : '', tolFlag = '';
    var rows = r.rows.map(function (x) { return '<tr><td>' + esc(disp(x[0])) + '</td><td class="r">' + esc(disp(x[1])) + '</td><td>' + esc(disp(x[2])) + '</td></tr>'; });
    out.innerHTML = '<div class="res"><div class="big">' + esc(disp(r.big)) + flag + dirFlag + tolFlag + cp(disp(r.big.replace(/^\u2248 /, '')), 'Copy the result') + '</div><div class="sub">' + esc(disp(r.sentence)) + '</div><div class="sub">Reference quantity: ' + esc(r.reference.toLowerCase()) + (r.unit ? ' (the 100%)' : ' (the denominator)') + '</div></div>' +
      '<div class="pf"><div><span class="ns-l">Formula</span><div class="fp">' + esc(r.formula) + '</div></div><div><span class="ns-l">With your numbers</span><div class="fp">' + esc(disp(r.subst)) + '</div></div></div>' +
      (r.warnings.length ? '<p class="note ns-warn">' + r.warnings.map(function (w) { return esc(w); }).join(' ') + '</p>' : '') +
      table(['Parameter', 'Result', 'Note'], rows) +
      '<div class="ns-act">' + cp(disp(r.sentence), 'Copy the sentence', 'Copy sentence') + cp(plain(r), 'Copy the whole calculation with working', 'Copy with working') + '<button type="button" class="btn2" data-act="save">Save as .txt</button><button type="button" class="btn2" data-act="print">Print</button></div>';
    stp.innerHTML = '<ol class="steps">' + r.steps.map(function (s) { return '<li>' + esc(disp(s)) + '</li>'; }).join('') + '<li>Result: ' + esc(disp(r.big)) + '.</li></ol>';
    last = { e: r.sentence, r: r.big, s: state(), t: plain(r) };
    clearTimeout(timer); timer = setTimeout(function () { if (last) push(last.e, last.r, last.s); }, 1500);
  }
  function apply(s) { if (!LAB[s.k]) return; kind = s.k; X.value = s.x == null ? '' : s.x; Y.value = s.y == null ? '' : s.y; PL.value = s.p == null ? 'auto' : s.p; if (!PL.value) PL.value = 'auto'; setMode(); render(); }
  function defaults() { X.value = DEF[kind][0]; Y.value = DEF[kind][1]; }
  function saveTxt() { if (!last) return; var b = new Blob([last.t + '\n'], { type: 'text/plain;charset=utf-8' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'engineering-percentage-calculation.txt'; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(a.href); }, 500); note('Saved percentage-error-calculation.txt'); }
  $('ns').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.k) { kind = b.dataset.k; defaults(); setMode(); render(); return; }
    if (b.dataset.h) { var x = H[+b.dataset.h]; if (x) apply(x.s); return; }
    if (b.dataset.ex) { apply(JSON.parse(b.dataset.ex)); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'save') { saveTxt(); return; }
    if (b.dataset.act === 'clearh') { H = []; saveH(); drawH(); return; }
    if (b.dataset.act === 'reset') { defaults(); PL.value = 'auto'; render(); X.focus(); }
  });
  [X, Y].forEach(function (el) { el.addEventListener('input', render); el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { clearTimeout(timer); render(); if (last) push(last.e, last.r, last.s); } }); });
  PL.addEventListener('change', render);
  loadH(); drawH(); defaults(); setMode(); render();
})();
