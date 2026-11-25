/* Elecmetric Fraction Calculator: page script for Mode 05 (Advanced Fraction & Ratio Tools). Inlined by tools/fraction_adv_page.js after the engine. */
(function () {
  var $ = function (id) { return document.getElementById(id); }, FR = Fraction, E = $('ns-e'), T = $('ns-t'), err = $('ns-err'), out = $('ns-out'), stp = $('ns-steps'), hist = $('ns-hist'), KEY = 'elecmetric.fraction.adv.history', H = [], last = null, timer = 0;
  var TOOLS = {
    gcdlcm: { label: 'GCD & LCM', field: 'Whole numbers, separated by commas or spaces', ph: 'e.g. 48, 18, 30', def: '48, 18, 30', hint: 'Two to 20 whole numbers of 1 or more. You get the greatest common divisor and the least common multiple, the Euclidean algorithm and, for numbers that are small enough, the prime factors.' },
    lcd: { label: 'LCD', field: 'Fractions, separated by commas', ph: 'e.g. 1/6, 3/4, 5/9', def: '1/6, 3/4, 5/9', hint: 'Two to 20 values separated by commas: fractions, mixed numbers such as 1 1/3, whole numbers or decimals. Each is reduced first, then the least common denominator is found.' },
    compare: { label: 'Compare', field: 'Fractions to compare, separated by commas', ph: 'e.g. 3/4, 5/7', def: '3/4, 5/7', hint: 'Two to 12 values separated by commas: fractions, mixed numbers, decimals or percentages. They are put in order from smallest to largest and compared exactly.' },
    ratio: { label: 'Ratio', field: 'Ratio, terms separated by a colon', ph: 'e.g. 18 : 24', def: '18 : 24', hint: 'Two to 8 terms separated by colons (or the word to). Fractions and decimals are allowed. Fill in the total to share a quantity in this ratio.' },
    continued: { label: 'Continued fraction', field: 'A number, or a continued fraction in square brackets', ph: 'e.g. 355/113 or [3; 7, 15, 1]', def: '355/113', hint: 'Type a fraction, mixed number or decimal to get its continued fraction and every convergent, or type a continued fraction such as [3; 7, 15, 1] to get its value. Decimals are read exactly, so 3.14159 is 314159/100000, not pi.' },
    proportion: { label: 'Proportion', field: 'Proportion with one unknown x', ph: 'e.g. 3 : 4 = 9 : x', def: '3 : 4 = 9 : x', hint: 'Two ratios with an equals sign and exactly one x, in any of the four places, as in 3 : 4 = 9 : x or x : 5 = 2 : 3.' }
  }, ORDER = ['gcdlcm', 'lcd', 'compare', 'ratio', 'proportion', 'continued'], tool = 'gcdlcm', V = {}, TOT = '';
  ORDER.forEach(function (k) { V[k] = TOOLS[k].def; });
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function disp(s) { return String(s).replace(/-(?=\d)/g, '\u2212'); }
  function note(t) { $('ns-note').textContent = t; }
  function copy(t) { var d = function () { note('Copied'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function cp(t, l) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="' + l + '">Copy</button>'; }
  function loadH() { try { var s = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(s)) H = s.filter(function (x) { return x && ORDER.indexOf(x.t) >= 0 && typeof x.e === 'string' && typeof x.r === 'string'; }).slice(0, 10); } catch (e) { H = []; } }
  function saveH() { try { localStorage.setItem(KEY, JSON.stringify(H)); } catch (e) {} }
  function drawH() {
    if (!H.length) { hist.innerHTML = '<p class="note">Your last ten calculations appear here. They are kept only in this browser.</p>'; return; }
    hist.innerHTML = '<ul class="fh">' + H.map(function (x, i) { return '<li><button type="button" class="chipb" data-h="' + i + '" aria-label="Use again: ' + esc(TOOLS[x.t].label + ' ' + x.e) + '">' + esc(TOOLS[x.t].label + ': ' + disp(x.e) + ' \u2192 ') + '<b>' + esc(disp(x.r)) + '</b></button></li>'; }).join('') + '</ul><button type="button" class="btn2" data-act="clearh">Clear history</button>';
  }
  function push(t, e, tot, r) { if (H.length && H[0].t === t && H[0].e === e && (H[0].tot || '') === tot) return; H.unshift({ t: t, e: e, tot: tot, r: r }); H = H.slice(0, 10); saveH(); drawH(); }
  function mark(el, bad) { el.classList.toggle('bad', bad); el.setAttribute('aria-invalid', String(bad)); }
  function table(head, rows) { return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + esc(head.join(', ')) + '"><table class="ns-t"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function fail(r) {
    err.textContent = r.empty ? '' : r.error; mark(E, !r.empty && r.field !== 'total'); mark(T, r.field === 'total');
    out.innerHTML = ''; last = null; stp.innerHTML = '<p class="note">Enter values above to see the working.</p>';
  }
  function setTool(k, keep) {
    if (!keep) V[tool] = E.value; tool = k; var c = TOOLS[k];
    Array.prototype.forEach.call(document.querySelectorAll('#ns .advt button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.tool === k)); });
    $('ns-lab').textContent = c.field; E.placeholder = c.ph; E.value = V[k]; $('ns-hint').textContent = c.hint; $('ns-tot').hidden = k !== 'ratio';
    Array.prototype.forEach.call(document.querySelectorAll('#ns .ns-try'), function (g) { g.hidden = g.dataset.tool !== k; });
    render();
  }
  function render() {
    var r = FR.advCalc({ tool: tool, expr: E.value, total: tool === 'ratio' ? T.value : '' });
    if (!r.ok) return fail(r);
    mark(E, false); mark(T, false); err.textContent = '';
    var rows = r.results.map(function (x, i) { return '<tr><td>' + esc(x[0]) + '</td><td class="r">' + esc(disp(x[1])) + (x[2] ? '<div class="fflag"><span class="ns-flag">' + esc(disp(x[2])) + '</span></div>' : '') + '</td></tr>'; });
    var line = TOOLS[tool].label + ': ' + E.value.trim() + (tool === 'ratio' && T.value.trim() ? ' (total ' + T.value.trim() + ')' : '') + ' \u2192 ' + r.big;
    out.innerHTML = '<div class="res"><div class="big">' + esc(disp(r.big)) + cp(r.big, 'Copy result') + '</div></div>' + table(['Result', 'Value'], rows) +
      r.tables.map(function (t) { return '<h3 class="advh">' + esc(t.title) + '</h3>' + table(t.head, t.rows.map(function (row) { return '<tr>' + row.map(function (c) { return '<td class="r">' + esc(disp(c)) + '</td>'; }).join('') + '</tr>'; })); }).join('') +
      '<div class="ns-act">' + cp(line, 'Copy the whole result').replace('>Copy<', '>Copy result line<') + '<button type="button" class="btn2" data-act="print">Print</button></div>';
    last = { t: tool, e: E.value.trim(), tot: tool === 'ratio' ? T.value.trim() : '', r: r.big };
    stp.innerHTML = '<ol class="steps">' + r.steps.map(function (s) { return '<li>' + esc(disp(s)) + '</li>'; }).join('') + '</ol>';
    clearTimeout(timer); timer = setTimeout(function () { if (last) push(last.t, last.e, last.tot, last.r); }, 1500);
  }
  function commit() { clearTimeout(timer); render(); if (last) push(last.t, last.e, last.tot, last.r); }
  $('ns').addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.tool) { if (b.dataset.tool !== tool) setTool(b.dataset.tool); return; }
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.h) { var x = H[+b.dataset.h]; if (x) { if (x.t !== tool) V[tool] = E.value; V[x.t] = x.e; T.value = x.tot || ''; if (x.t !== tool) setTool(x.t, true); else { E.value = x.e; render(); } } return; }
    if (b.dataset.ex) { var o = JSON.parse(b.dataset.ex); E.value = o.v; T.value = o.tot || ''; render(); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'clearh') { H = []; saveH(); drawH(); return; }
    if (b.dataset.act === 'reset') { ORDER.forEach(function (k) { V[k] = TOOLS[k].def; }); E.value = TOOLS[tool].def; T.value = ''; render(); E.focus(); }
  });
  E.addEventListener('input', render); T.addEventListener('input', render);
  [E, T].forEach(function (el) { el.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') commit(); }); });
  loadH(); drawH();
  var h = (location.hash || '').replace('#', ''); if (TOOLS[h]) tool = h;
  setTool(tool, true);
})();
