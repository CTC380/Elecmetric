/* Elecmetric Half-Life Calculator, Mode 04: page script. Inlined by tools/halflife_table_page.js after the engines (HalfLife, HalfLifeTable). */
(function () {
  var $ = function (id) { return document.getElementById(id); }, HL = HalfLife, DT = HalfLifeTable;
  var ids = ['T', 'N0', 'qu', 'step', 'rows', 'TB', 'TC'], inp = {}; ids.forEach(function (k) { inp[k] = $('dt-' + k); });
  var hu = $('dt-hu'), basis = $('dt-basis'), tbu = $('dt-tbu'), uB = $('dt-uB'), uC = $('dt-uC'), sigS = $('dt-sig'), logC = $('dt-log'), probe = $('dt-probe'), err = $('dt-err'), out = $('dt-out'), stp = $('dt-steps');
  var DEF = { T: '5730', hu: 'yr', N0: '100', qu: 'g', basis: 'hl', step: '1', rows: '10', tbu: 'same', TB: '', uB: 'same', TC: '', uC: 'same', sig: '6', log: false }, HKEY = 'em-halflife-table-history', hist = [], last = null, probeT = null;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function say(t) { $('dt-note').textContent = t; }
  function copy(t) { var d = function () { say('Copied'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function sigVal() { return sigS.value === 'full' ? 'full' : Number(sigS.value); }
  function state() { return { T: inp.T.value, hu: hu.value, N0: inp.N0.value, qu: inp.qu.value, basis: basis.value, step: inp.step.value, rows: inp.rows.value, tbu: tbu.value, TB: inp.TB.value, uB: uB.value, TC: inp.TC.value, uC: uC.value, sig: sigS.value, log: logC.checked }; }
  function setState(d) {
    ids.forEach(function (k) { inp[k].value = d[k] === undefined ? '' : d[k]; }); hu.value = d.hu || 'yr'; basis.value = d.basis || 'hl'; tbu.value = d.tbu || 'same'; uB.value = d.uB || 'same'; uC.value = d.uC || 'same'; sigS.value = d.sig || '6'; logC.checked = !!d.log; probeT = null; render();
  }
  function mark(field) { ids.forEach(function (k) { var bad = k === field; inp[k].classList.toggle('bad', bad); inp[k].setAttribute('aria-invalid', String(bad)); }); }
  function unitOf(v) { return v === 'same' ? hu.value : v; }
  function labels() {
    $('dt-lT').textContent = 'Half-life T\u00bd of A (' + HL.timeLabel(hu.value) + ')';
    $('dt-lstep').textContent = basis.value === 'hl' ? 'Step (half-lives of A)' : 'Step (' + HL.timeLabel(tbu.value === 'same' ? hu.value : tbu.value) + ')';
    $('dt-tbw').hidden = basis.value === 'hl';
  }
  function run() { return DT.run({ T: inp.T.value, halfLifeUnit: hu.value, N0: inp.N0.value, quantityUnit: inp.qu.value, basis: basis.value, step: inp.step.value, rows: inp.rows.value, tableUnit: basis.value === 'time' ? tbu.value : 'same', TB: inp.TB.value, unitB: uB.value, TC: inp.TC.value, unitC: uC.value, sig: sigVal() }); }
  function pc(fr, sg) { return fr === 0 ? '\u2248 0%' : HL.fmt(fr * 100, sg) + '%'; }
  function table(r, sg) {
    var f = function (v) { return HL.fmt(v, sg); }, multi = r.scen.length > 1, Q = r.quantityUnit ? ' (' + r.quantityUnit + ')' : '';
    var h1 = '<th scope="col" rowspan="' + (multi ? 2 : 1) + '">Row</th><th scope="col" rowspan="' + (multi ? 2 : 1) + '">Time (' + esc(HL.timeLabel(r.tableUnit)) + ')</th>', h2 = '';
    r.scen.forEach(function (sc) { var cols = r.hasQty ? 4 : 3, nm = ['Half-lives', 'Remaining', 'Decayed'].concat(r.hasQty ? ['Quantity' + Q] : []); if (multi) { h1 += '<th scope="colgroup" colspan="' + cols + '">Scenario ' + sc.id + ': T\u00bd ' + esc(f(sc.T) + ' ' + HL.timeLabel(sc.unit, sc.T)) + '</th>'; h2 += nm.map(function (x) { return '<th scope="col">' + esc(x) + '</th>'; }).join(''); } else h1 += nm.map(function (x) { return '<th scope="col">' + esc(x) + '</th>'; }).join(''); });
    var body = r.table.map(function (row) { return '<tr><th scope="row">' + row.i + '</th><td class="r">' + esc(f(row.t)) + '</td>' + row.p.map(function (q) { return '<td class="r">' + esc(f(q.n)) + '</td><td class="r">' + esc(pc(q.frac, sg)) + '</td><td class="r">' + esc(pc(q.dec, sg)) + '</td>' + (r.hasQty ? '<td class="r">' + esc(f(q.qty)) + '</td>' : ''); }).join('') + '</tr>'; }).join('');
    return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: decay table"><table class="ns-t"><thead><tr>' + h1 + '</tr>' + (multi ? '<tr>' + h2 + '</tr>' : '') + '</thead><tbody>' + body + '</tbody></table></div>';
  }
  function readout(r, sg) {
    var f = function (v) { return HL.fmt(v, sg); }, t = probeT === null ? r.tmax / 2 : probeT, Q = r.quantityUnit ? '\u00a0' + r.quantityUnit : '';
    return '<p class="dt-rd"><b>t = ' + esc(f(t) + '\u00a0' + HL.timeLabel(r.tableUnit, t)) + '</b></p><ul class="dt-rl">' + DT.at(r, t).map(function (q, k) { return '<li><span class="dt-sw" style="background:' + DT.MARKS[k] + '"></span><b>' + q.id + '</b>: ' + esc(f(q.n)) + ' half-lives, ' + esc(pc(q.frac, sg)) + ' left, ' + esc(pc(q.dec, sg)) + ' decayed' + (r.hasQty ? ', ' + esc(f(q.qty) + Q) + ' left' : '') + '</li>'; }).join('') + '</ul>';
  }
  function drawGraph() {
    if (!last) return; var r = last.r, t = probeT === null ? r.tmax / 2 : probeT;
    $('dt-graph').innerHTML = DT.graph(r, { log: logC.checked, probe: t }); $('dt-rd').innerHTML = readout(r, sigVal()); probe.value = String(r.tmax > 0 ? Math.round(t / r.tmax * 1000) : 0);
  }
  function render() {
    labels(); var r = run(); last = null; $('dt-dl').hidden = true; $('dt-gwrap').hidden = true;
    if (!r.ok) { err.textContent = r.empty ? '' : r.error; err.classList.toggle('hint', !!r.empty); mark(r.empty ? null : r.field); out.innerHTML = ''; stp.innerHTML = '<p class="note">Enter a half-life to see the table, the graph and the working.</p>'; return; }
    err.textContent = ''; err.classList.remove('hint'); mark(null);
    last = { r: r, text: line(r) };
    out.innerHTML = r.warnings.map(function (w) { return '<p class="note warn">' + esc(w.message) + '</p>'; }).join('') + table(r, sigVal());
    stp.innerHTML = r.steps.map(function (x) { return '<h3>' + esc(x.title) + '</h3><pre class="al" tabindex="0">' + esc(x.text) + '</pre>'; }).join('');
    $('dt-gwrap').hidden = false; $('dt-dl').hidden = false; drawGraph();
  }
  function line(r) { var f = function (v) { return HL.fmt(v, sigVal()); }; return 'T\u00bd ' + f(r.scen[0].T) + '\u00a0' + HL.timeLabel(r.scen[0].unit, r.scen[0].T) + (r.scen.length > 1 ? ' vs ' + r.scen.slice(1).map(function (s) { return f(s.T) + '\u00a0' + HL.timeLabel(s.unit, s.T); }).join(', ') : '') + ': ' + (r.rows + 1) + ' rows, step ' + f(r.step) + (r.basis === 'hl' ? ' half-lives' : '\u00a0' + HL.timeLabel(r.tableUnit, r.step)); }
  function download(name, mime, blob) { var a = document.createElement('a'), u = URL.createObjectURL(blob); a.href = u; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(u); }, 500); say('Downloaded ' + name); }
  function svgText() { return DT.graph(last.r, { log: logC.checked, probe: probeT === null ? undefined : probeT }); }
  function savePng() {
    var svg = svgText(), img = new Image(), u = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    img.onload = function () { var c = document.createElement('canvas'); c.width = 1520; c.height = 840; var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); if (c.toBlob) c.toBlob(function (b) { if (b) download('decay-graph.png', 'image/png', b); else say('This browser could not make a PNG. Use the SVG.'); }, 'image/png'); else say('This browser could not make a PNG. Use the SVG.'); };
    img.onerror = function () { URL.revokeObjectURL(u); say('This browser could not make a PNG. Use the SVG.'); }; img.src = u;
  }
  function loadHist() { try { var x = JSON.parse(localStorage.getItem(HKEY) || '[]'); hist = Array.isArray(x) ? x.filter(function (h) { return h && typeof h.text === 'string' && h.s && typeof h.s === 'object'; }).slice(0, 10) : []; } catch (e) { hist = []; } }
  function saveHist() { try { localStorage.setItem(HKEY, JSON.stringify(hist.slice(0, 10))); } catch (e) {} }
  function drawHist() { $('dt-hist').innerHTML = hist.length ? hist.map(function (h, k) { return '<li><button type="button" class="chipb" data-h="' + k + '" aria-label="Use again: ' + esc(h.text) + '">' + esc(h.text) + '</button></li>'; }).join('') : '<li class="note">No saved calculations yet. Press Enter or Save to history.</li>'; $('dt-hclear').hidden = !hist.length; }
  function keep() { if (!last) return; var t = last.text; hist = hist.filter(function (h) { return h.text !== t; }); hist.unshift({ text: t, s: state() }); hist = hist.slice(0, 10); saveHist(); drawHist(); say('Saved to history'); }
  $('dt').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.ex) { setState(Object.assign({}, DEF, JSON.parse(b.dataset.ex))); return; }
    if (b.dataset.h !== undefined) { var h = hist[Number(b.dataset.h)]; if (h) setState(h.s); return; }
    if (b.dataset.act === 'reset') { setState(DEF); return; }
    if (b.dataset.act === 'save') { keep(); return; }
    if (b.dataset.act === 'clear') { ids.forEach(function (k) { if (k !== 'qu' && k !== 'step' && k !== 'rows') inp[k].value = ''; }); render(); inp.T.focus(); return; }
    if (b.dataset.act === 'hclear') { hist = []; saveHist(); drawHist(); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'copyall' && last) { copy(DT.exportTxt(last.r)); return; }
    if (!last) return;
    if (b.dataset.dl === 'txt') download('decay-table.txt', 'text/plain', new Blob([DT.exportTxt(last.r)], { type: 'text/plain' }));
    if (b.dataset.dl === 'csv') download('decay-table.csv', 'text/csv', new Blob([DT.exportCsv(last.r)], { type: 'text/csv' }));
    if (b.dataset.dl === 'json') download('decay-table.json', 'application/json', new Blob([DT.exportJson(last.r)], { type: 'application/json' }));
    if (b.dataset.dl === 'svg') download('decay-graph.svg', 'image/svg+xml', new Blob([svgText()], { type: 'image/svg+xml' }));
    if (b.dataset.dl === 'png') savePng();
  });
  ids.forEach(function (k) { inp[k].addEventListener('input', render); inp[k].addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); keep(); } }); });
  [hu, basis, tbu, uB, uC, sigS].forEach(function (el) { el.addEventListener('change', render); el.addEventListener('input', render); });
  logC.addEventListener('change', drawGraph);
  probe.addEventListener('input', function () { if (!last) return; probeT = Number(probe.value) / 1000 * last.r.tmax; drawGraph(); });
  $('dt-graph').addEventListener('pointermove', function (e) { if (!last || false) return; var svg = $('dt-graph').firstChild; if (!svg || !svg.getBoundingClientRect) return; var bb = svg.getBoundingClientRect(), W = 760, L = 64, R = 18, x = (e.clientX - bb.left) / bb.width * W; if (x < L || x > W - R) return; probeT = (x - L) / (W - L - R) * last.r.tmax; drawGraph(); });
  loadHist(); drawHist(); setState(DEF);
})();
