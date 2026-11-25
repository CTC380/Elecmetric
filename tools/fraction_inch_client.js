/* Elecmetric Fraction Calculator: page script for Mode 06 (Fractional Inch and Millimetre Converter). Inlined by tools/fraction_inch_page.js after the engine. */
(function () {
  var $ = function (id) { return document.getElementById(id); }, FR = Fraction, E = $('ns-e'), DN = $('ns-d'), RD = $('ns-r'), PL = $('ns-p'), err = $('ns-err'), out = $('ns-out'), stp = $('ns-steps'), hist = $('ns-hist'), KEY = 'elecmetric.fraction.inch.history', H = [], last = null, timer = 0;
  var TOOLS = {
    in2mm: { label: 'Inch to mm', field: 'Length in inches: a fraction, mixed number or decimal', ph: 'e.g. 3/4, 1 3/16, 0.3125', def: '3/4', pdef: '3', hint: 'Type 3/4, a mixed number such as 1 3/16 (or 1-3/16, as on drawings), or a decimal such as 0.3125. An in or \u2033 after the number is fine. One inch is exactly 25.4 mm, so the result is exact; it is only rounded for display.' },
    mm2in: { label: 'mm to inch', field: 'Length in millimetres: a decimal, fraction or mixed number', ph: 'e.g. 12.7, 20, 6.35', def: '12.7', pdef: '5', hint: 'Type a length in millimetres, such as 12.7 or 20. You get the exact inches and the closest mark on an inch rule at the graduation you choose, with the error in millimetres.' }
  }, ORDER = ['in2mm', 'mm2in'], tool = 'in2mm', V = {};
  ORDER.forEach(function (k) { V[k] = TOOLS[k].def; });
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function disp(s) { return String(s).replace(/-(?=\d)/g, '\u2212'); }
  function note(t) { $('ns-note').textContent = t; }
  function copy(t) { var d = function () { note('Copied'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function cp(t, l) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="' + l + '">Copy</button>'; }
  function loadH() { try { var s = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(s)) H = s.filter(function (x) { return x && ORDER.indexOf(x.t) >= 0 && typeof x.e === 'string' && typeof x.r === 'string'; }).slice(0, 10); } catch (e) { H = []; } }
  function saveH() { try { localStorage.setItem(KEY, JSON.stringify(H)); } catch (e) {} }
  function drawH() {
    if (!H.length) { hist.innerHTML = '<p class="note">Your last ten conversions appear here. They are kept only in this browser.</p>'; return; }
    hist.innerHTML = '<ul class="fh">' + H.map(function (x, i) { return '<li><button type="button" class="chipb" data-h="' + i + '" aria-label="Use again: ' + esc(TOOLS[x.t].label + ' ' + x.e) + '">' + esc(disp(x.e) + (x.t === 'in2mm' ? ' in' : ' mm') + ' \u2192 ') + '<b>' + esc(disp(x.r)) + '</b></button></li>'; }).join('') + '</ul><button type="button" class="btn2" data-act="clearh">Clear history</button>';
  }
  function push(t, e, r) { if (H.length && H[0].t === t && H[0].e === e && H[0].r === r) return; H.unshift({ t: t, e: e, r: r }); H = H.slice(0, 10); saveH(); drawH(); }
  function mark(el, bad) { el.classList.toggle('bad', bad); el.setAttribute('aria-invalid', String(bad)); }
  function table(head, rows) { return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + esc(head.join(', ')) + '"><table class="ns-t"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function fail(r) {
    err.textContent = r.empty ? '' : r.error; mark(E, !r.empty && !r.field); mark(PL, r.field === 'places'); mark(DN, r.field === 'maxDen'); mark(RD, r.field === 'round');
    out.innerHTML = ''; last = null; stp.innerHTML = '<p class="note">Enter a length above to see the working.</p>';
  }
  function setTool(k, keep) {
    if (!keep) V[tool] = E.value; tool = k; var c = TOOLS[k];
    Array.prototype.forEach.call(document.querySelectorAll('#ns .advt button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.tool === k)); });
    $('ns-lab').textContent = c.field; E.placeholder = c.ph; E.value = V[k]; $('ns-hint').textContent = c.hint; PL.placeholder = c.pdef; $('ns-pl').textContent = k === 'in2mm' ? 'Millimetre decimal places' : 'Inch decimal places';
    $('ns-grad').hidden = k !== 'mm2in'; $('ns-rnd').hidden = k !== 'mm2in';
    Array.prototype.forEach.call(document.querySelectorAll('#ns .ns-try'), function (g) { g.hidden = g.dataset.tool !== k; });
    render();
  }
  function render() {
    var r = FR.inchCalc({ dir: tool, expr: E.value, maxDen: DN.value, round: RD.value, places: PL.value });
    if (!r.ok) return fail(r);
    mark(E, false); mark(PL, false); mark(DN, false); mark(RD, false); err.textContent = '';
    var rows = r.results.map(function (x) { return '<tr><td>' + esc(x[0]) + '</td><td class="r">' + esc(disp(x[1])) + (x[2] ? '<div class="fflag"><span class="ns-flag">' + esc(disp(x[2])) + '</span></div>' : '') + '</td></tr>'; });
    var line = E.value.trim() + (tool === 'in2mm' ? ' in' : ' mm') + ' \u2192 ' + r.big;
    out.innerHTML = '<div class="res"><div class="big">' + esc(disp(r.big)) + cp(r.big, 'Copy result') + '</div></div>' + table(['Result', 'Value'], rows) +
      r.tables.map(function (t) { return '<h3 class="advh">' + esc(t.title) + '</h3>' + table(t.head, t.rows.map(function (row) { return '<tr>' + row.map(function (c) { return '<td class="r">' + esc(disp(c)) + '</td>'; }).join('') + '</tr>'; })); }).join('') +
      '<div class="ns-act">' + cp(line, 'Copy the whole result').replace('>Copy<', '>Copy result line<') + '<button type="button" class="btn2" data-act="print">Print</button></div>';
    last = { t: tool, e: E.value.trim(), r: r.big };
    stp.innerHTML = '<ol class="steps">' + r.steps.map(function (s) { return '<li>' + esc(disp(s)) + '</li>'; }).join('') + '</ol>';
    clearTimeout(timer); timer = setTimeout(function () { if (last) push(last.t, last.e, last.r); }, 1500);
  }
  function commit() { clearTimeout(timer); render(); if (last) push(last.t, last.e, last.r); }
  $('ns').addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.tool) { if (b.dataset.tool !== tool) setTool(b.dataset.tool); return; }
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.h) { var x = H[+b.dataset.h]; if (x) { if (x.t !== tool) V[tool] = E.value; V[x.t] = x.e; if (x.t !== tool) setTool(x.t, true); else { E.value = x.e; render(); } } return; }
    if (b.dataset.ex) { E.value = JSON.parse(b.dataset.ex).v; render(); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'clearh') { H = []; saveH(); drawH(); return; }
    if (b.dataset.act === 'reset') { ORDER.forEach(function (k) { V[k] = TOOLS[k].def; }); E.value = TOOLS[tool].def; PL.value = ''; DN.value = '64'; RD.value = 'nearest'; render(); E.focus(); }
  });
  E.addEventListener('input', render); PL.addEventListener('input', render); DN.addEventListener('change', render); RD.addEventListener('change', render);
  [E, PL].forEach(function (el) { el.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') commit(); }); });
  loadH(); drawH();
  var h = (location.hash || '').replace('#', ''); if (TOOLS[h]) tool = h;
  setTool(tool, true);
})();
