/* Elecmetric Percent Error Calculator: page script for Mode 04 (Batch Measurement Analysis). Inlined by tools/pe_batch_page.js after the engines
   (tools/percent_engine.js and pe_batch_engine.js). The chart is drawn here as inline SVG from the exact values the engine returns (display only). */
(function () {
  var $ = function (id) { return document.getElementById(id); }, PC = PercentErrorMode04, X = $('ns-x'), Y = $('ns-y'), U = $('ns-u'), PL = $('ns-pl'), B = $('ns-basis'), T = $('ns-t'), err = $('ns-err'), out = $('ns-out'), stp = $('ns-steps'), hist = $('ns-hist'), KEY = 'elecmetric.pe.batch.history';
  var H = [], last = null, timer = 0, fileRows = null, fileHead = null;
  var DEF = { x: '229\n231\n230\n228\n232', y: '230', u: 'V', b: 'pct', t: '5' };
  var SVGNS = 'http://www.w3.org/2000/svg';
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function disp(s) { return String(s).replace(/-(?=[\d.(])/g, '\u2212'); }
  function note(t) { $('ns-note').textContent = t; }
  function copy(t) { var d = function () { note('Copied'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function cp(t, l, w) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="' + esc(l) + '">' + (w || 'Copy') + '</button>'; }
  function loadH() { try { var s = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(s)) H = s.filter(function (x) { return x && typeof x.e === 'string' && typeof x.r === 'string' && x.s && typeof x.s === 'object' && typeof x.s.x === 'string' && x.s.x.length <= 6000; }).slice(0, 10); } catch (e) { H = []; } }
  function saveH() { try { localStorage.setItem(KEY, JSON.stringify(H)); } catch (e) {} }
  function drawH() {
    if (!H.length) { hist.innerHTML = '<p class="note">Your last ten analyses appear here, with their readings. They are kept only in this browser.</p>'; return; }
    hist.innerHTML = '<ul class="fh">' + H.map(function (x, i) { return '<li><button type="button" class="chipb" data-h="' + i + '" aria-label="Use again: ' + esc(x.e) + '">' + esc(disp(x.e)) + '</button></li>'; }).join('') + '</ul><button type="button" class="btn2" data-act="clearh">Clear history</button>';
  }
  function push(e, r, s) { if (s.x.length > 6000) return; if (H.length && H[0].e === e && H[0].s.x === s.x) return; H.unshift({ e: e, r: r, s: s }); H = H.slice(0, 10); saveH(); drawH(); }
  function mark(which) { [X, Y, T, U].forEach(function (el) { var bad = el === which; el.classList.toggle('bad', bad); el.setAttribute('aria-invalid', String(bad)); }); }
  function table(head, rows, cls) { return '<div class="tw' + (cls ? ' ' + cls : '') + '" tabindex="0" role="region" aria-label="Scrollable table: ' + esc(head.join(', ')) + '"><table class="ns-t"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function withU(v, u) { return u ? v + (u === '%' || u.charAt(0) === '\u00b0' ? '' : ' ') + u : v; }
  function count() { return PC.tokens(X.value).length; }
  function question() { var u = U.value.trim().slice(0, 16), n = count(); return 'How far ' + (n === 1 ? 'is 1 reading' : n ? 'are ' + n + ' readings' : 'are the readings') + ' from a reference of ' + withU(Y.value.trim() || 'R', u) + ', and how much do they spread?'; }
  function run() { return PC.calc({ x: X.value, y: Y.value, unit: U.value, basis: B.value, t: T.value, places: PL.value }); }
  function state() { return { x: X.value, y: Y.value, u: U.value, p: PL.value, b: B.value, t: T.value }; }
  function layout() { $('ns-lt').textContent = B.value === 'pct' ? 'Tolerance, \u00b1 percent of the reference (optional)' : 'Tolerance, \u00b1 value in the unit (optional)'; T.placeholder = B.value === 'pct' ? '5' : '0.5'; $('ns-cnt').textContent = count() ? count() + (count() === 1 ? ' reading' : ' readings') : 'No readings yet'; }
  function fail(r) {
    err.textContent = r.empty ? (r.hint || '') : r.error; err.classList.toggle('ns-hint', !!r.empty);
    var m = r.empty ? null : /^The reference/.test(r.error) ? Y : /^The tolerance/.test(r.error) ? T : /^The unit/.test(r.error) ? U : X; mark(m);
    out.innerHTML = ''; last = null; stp.innerHTML = '<p class="note">Enter the readings to see the working.</p>'; $('ns-q').textContent = question();
  }
  /* ---------- chart: inline SVG, the signed deviation of every reading ---------- */
  function niceStep(range, target) { var raw = range / target, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag; return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag; }
  function chart(r) {
    var c = r.chart, v = c.values.map(parseFloat), n = v.length, band = c.band === null ? null : parseFloat(c.band), mean = parseFloat(c.mean), W = 680, Ht = 280, ml = 58, mr = 14, mt = 16, mb = 44, pw = W - ml - mr, ph = Ht - mt - mb;
    var lo = 0, hi = 0, i; for (i = 0; i < n; i++) { if (v[i] < lo) lo = v[i]; if (v[i] > hi) hi = v[i]; }
    if (band !== null) { lo = Math.min(lo, -band); hi = Math.max(hi, band); } lo = Math.min(lo, mean); hi = Math.max(hi, mean);
    if (lo === hi) { lo = -1; hi = 1; } var pad = (hi - lo) * 0.1; lo -= pad; hi += pad;
    var step = niceStep(hi - lo, 5), dp = Math.max(0, Math.min(8, -Math.floor(Math.log10(step) + 1e-9))), t0 = Math.ceil(lo / step) * step, y = function (val) { return mt + ph * (hi - val) / (hi - lo); };
    var unit = c.measure === 'pct' ? '%' : c.unit, g = '', k;
    for (k = t0; k <= hi + step * 1e-6; k += step) { var yy = y(k), lab = (Math.abs(k) < step * 1e-6 ? 0 : k).toFixed(dp); g += '<line x1="' + ml + '" x2="' + (W - mr) + '" y1="' + yy.toFixed(1) + '" y2="' + yy.toFixed(1) + '" stroke="var(--line)" stroke-width="1"/><text x="' + (ml - 6) + '" y="' + (yy + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="var(--muted)">' + esc(disp(lab)) + '</text>'; }
    var slot = pw / n, bw = Math.max(1, Math.min(48, slot * (n > 80 ? 0.9 : 0.62))), z = y(0), bars = '';
    for (i = 0; i < n; i++) {
      var x0 = ml + slot * i + (slot - bw) / 2, y1 = y(v[i]), out_ = c.status && c.status[i] !== 'within', top = Math.min(y1, z), h = Math.abs(y1 - z);
      bars += '<rect x="' + x0.toFixed(2) + '" y="' + top.toFixed(2) + '" width="' + bw.toFixed(2) + '" height="' + Math.max(h, v[i] === 0 ? 1 : 0.5).toFixed(2) + '" fill="' + (out_ ? 'url(#ns-hatch)' : 'var(--cyan)') + '" stroke="' + (out_ ? 'var(--err)' : 'none') + '" stroke-width="1.5"' + (out_ ? '' : ' fill-opacity=".85"') + '><title>' + esc(disp('Reading ' + (i + 1) + ': ' + c.values[i].replace(/\.?0+$/, '') + (unit === '%' ? '%' : ' ' + unit))) + '</title></rect>';
    }
    var kx = n <= 20 ? 1 : Math.ceil(n / 10), xl = '';
    for (i = 0; i < n; i++) if (i % kx === 0) xl += '<text x="' + (ml + slot * i + slot / 2).toFixed(1) + '" y="' + (mt + ph + 16) + '" text-anchor="middle" font-size="11" fill="var(--muted)">' + (i + 1) + '</text>';
    var lines = '<line x1="' + ml + '" x2="' + (W - mr) + '" y1="' + z.toFixed(1) + '" y2="' + z.toFixed(1) + '" stroke="var(--ink)" stroke-width="1.5"/>';
    if (band !== null) [band, -band].forEach(function (b, j) { lines += '<line x1="' + ml + '" x2="' + (W - mr) + '" y1="' + y(b).toFixed(1) + '" y2="' + y(b).toFixed(1) + '" stroke="var(--gold)" stroke-width="2" stroke-dasharray="7 4"/>'; });
    lines += '<line x1="' + ml + '" x2="' + (W - mr) + '" y1="' + y(mean).toFixed(1) + '" y2="' + y(mean).toFixed(1) + '" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="2 4"/>';
    var yl = c.measure === 'pct' ? 'Signed deviation (%)' : 'Signed error (' + (c.unit || 'unit') + ')';
    var desc = 'Bar chart of the ' + (c.measure === 'pct' ? 'signed percentage deviation' : 'signed error') + ' of ' + n + (n === 1 ? ' reading' : ' readings') + ' from the reference, from ' + disp(String(Math.min.apply(null, v))) + ' to ' + disp(String(Math.max.apply(null, v))) + ' ' + unit + '. The same values are in the table below.';
    var svg = '<svg viewBox="0 0 ' + W + ' ' + Ht + '" width="100%" role="img" aria-label="' + esc(desc) + '" style="max-width:' + W + 'px;height:auto;display:block"><defs><pattern id="ns-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--field)"/><line x1="0" y1="0" x2="0" y2="6" stroke="var(--err)" stroke-width="3"/></pattern></defs>' + g + bars + lines + xl +
      '<text x="' + (ml + pw / 2) + '" y="' + (Ht - 6) + '" text-anchor="middle" font-size="12" fill="var(--muted)">Reading number</text><text transform="translate(13 ' + (mt + ph / 2) + ') rotate(-90)" text-anchor="middle" font-size="12" fill="var(--muted)">' + esc(yl) + '</text></svg>';
    var key = '<p class="note ns-key">Bars: the signed ' + (c.measure === 'pct' ? 'percentage deviation' : 'error') + ' of each reading. Solid line: the reference (zero error). Dotted line: the mean signed error' + (band !== null ? '. Dashed lines: the entered tolerance. Hatched bars with a red outline are outside it' : '') + '.</p>';
    return '<h3>Deviation chart</h3><figure class="ns-fig">' + svg + '<figcaption class="sr-only">' + esc(desc) + '</figcaption></figure>' + key;
  }
  function readTable(r) {
    var ht = r.hasTol, head = ['Reading', 'Observed', 'Signed error', 'Absolute error', 'Signed deviation'].concat(ht ? ['Against the tolerance'] : []);
    var rows = r.reads.map(function (x) { return '<tr' + (ht && x.status !== 'within' ? ' class="cu"' : '') + '><td>' + x.i + '</td><td class="r">' + esc(disp(withU(x.obs, r.unit))) + '</td><td class="r">' + esc(disp(withU(x.err, r.unit))) + '</td><td class="r">' + esc(withU(x.abs, r.unit)) + '</td><td class="r">' + esc(disp(x.pct === null ? 'Not defined' : x.pct)) + '</td>' + (ht ? '<td>' + (x.status === 'within' ? 'Within' + (x.onLimit ? ' (on a limit)' : '') : 'Outside: ' + x.status + ' the ' + (x.status === 'above' ? 'upper' : 'lower') + ' limit') + '</td>' : '') + '</tr>'; });
    return '<h3>Individual readings</h3>' + table(head, rows, 'rd');
  }
  function plain(r) {
    var L = [$('ns-q').textContent, r.sentence, '', 'Formula: ' + r.formula, 'Substituted: ' + r.subst, '', 'Working:'];
    r.steps.forEach(function (s, i) { L.push((i + 1) + '. ' + s); });
    L.push('', 'Summary'); r.rows.forEach(function (x) { L.push(x[0] + ': ' + x[1]); });
    L.push('', 'Readings (number | observed | signed error | absolute error | signed deviation' + (r.hasTol ? ' | status' : '') + ')');
    r.reads.forEach(function (x) { L.push([x.i, x.obs, x.err, x.abs, x.pct === null ? 'not defined' : x.pct].concat(r.hasTol ? [x.status + (x.onLimit ? ' (on a limit)' : '')] : []).join(' | ')); });
    if (r.warnings.length) L.push('', 'Note: ' + r.warnings.join(' '));
    L.push('', 'The tolerance, if any, is the one entered above. It is not read from a standard or datasheet, and measurement uncertainty is not applied.', 'Calculated exactly in the browser by Elecmetric (' + location.href.split('#')[0] + ').');
    return disp(L.join('\n'));
  }
  function render() {
    var r = run(); $('ns-q').textContent = question(); layout();
    if (!r.ok) return fail(r);
    mark(null); err.textContent = ''; err.classList.remove('ns-hint');
    var flag = r.hasTol ? '<span class="ns-flag' + (r.pass ? '' : ' r') + '">' + (r.pass ? 'pass' : 'fail') + '</span>' : '';
    var rows = r.rows.map(function (x) { return '<tr><td>' + esc(disp(x[0])) + '</td><td class="r">' + esc(disp(x[1])) + '</td><td>' + esc(disp(x[2])) + '</td></tr>'; });
    out.innerHTML = '<div class="res"><div class="big">' + esc(disp(r.big)) + flag + cp(disp(r.big), 'Copy the result') + '</div><div class="sub">' + esc(disp(r.sentence)) + '</div></div>' +
      '<div class="pf"><div><span class="ns-l">Formula</span><div class="fp">' + esc(r.formula) + '</div></div><div><span class="ns-l">With your numbers</span><div class="fp">' + esc(disp(r.subst)) + '</div></div></div>' +
      (r.warnings.length ? '<p class="note ns-warn">' + r.warnings.map(function (w) { return esc(w); }).join(' ') + '</p>' : '') +
      '<h3>Summary</h3>' + table(['Parameter', 'Result', 'Note'], rows) + chart(r) + readTable(r) +
      '<div class="ns-act">' + cp(disp(r.sentence), 'Copy the sentence', 'Copy sentence') + cp(plain(r), 'Copy the whole analysis with working', 'Copy with working') + '<button type="button" class="btn2" data-act="csv">Save readings .csv</button><button type="button" class="btn2" data-act="csvs">Save summary .csv</button><button type="button" class="btn2" data-act="save">Save as .txt</button><button type="button" class="btn2" data-act="print">Print</button></div>';
    stp.innerHTML = '<ol class="steps">' + r.steps.map(function (s) { return '<li>' + esc(disp(s)) + '</li>'; }).join('') + '<li>Result: ' + esc(disp(r.hasTol ? r.verdict : r.big)) + '.</li></ol>';
    last = { e: r.n + (r.n === 1 ? ' reading' : ' readings') + ' vs ' + withU(r.reference, r.unit) + ': mean error ' + r.meanSigned + ', MAE ' + r.meanAbs, r: r.big, s: state(), t: plain(r), rows: r.rows, reads: r.reads, hasTol: r.hasTol };
    clearTimeout(timer); timer = setTimeout(function () { if (last) push(last.e, last.r, last.s); }, 1500);
  }
  function apply(s) { X.value = s.x == null ? '' : s.x; Y.value = s.y == null ? '' : s.y; U.value = s.u == null ? '' : s.u; B.value = s.b === 'abs' ? 'abs' : 'pct'; T.value = s.t == null ? '' : s.t; PL.value = s.p == null ? 'auto' : s.p; if (!PL.value) PL.value = 'auto'; hideCols(); render(); }
  function defaults() { X.value = DEF.x; Y.value = DEF.y; U.value = DEF.u; B.value = DEF.b; T.value = DEF.t; hideCols(); }
  function download(text, name, type) { var b = new Blob([text], { type: type }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(a.href); }, 500); note('Saved ' + name); }
  function csvCell(s) { s = disp(String(s)); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; }
  function saveCsv() { if (!last) return; var L = [['Reading', 'Observed', 'Signed error', 'Absolute error', 'Signed deviation'].concat(last.hasTol ? ['Status'] : []).join(',')]; last.reads.forEach(function (x) { L.push([x.i, x.obs, x.err, x.abs, x.pct === null ? 'Not defined' : x.pct].concat(last.hasTol ? [x.status + (x.onLimit ? ' (on a limit)' : '')] : []).map(csvCell).join(',')); }); download('\ufeff' + L.join('\r\n') + '\r\n', 'batch-measurement-readings.csv', 'text/csv;charset=utf-8'); }
  function saveSummary() { if (!last) return; var L = ['Parameter,Result,Note'].concat(last.rows.map(function (x) { return x.map(csvCell).join(','); })); download('\ufeff' + L.join('\r\n') + '\r\n', 'batch-measurement-summary.csv', 'text/csv;charset=utf-8'); }
  function saveTxt() { if (!last) return; download(last.t + '\n', 'batch-measurement-analysis.txt', 'text/plain;charset=utf-8'); }
  /* ---------- import a .csv or .txt file: one column of readings, or pick the column ---------- */
  var COL = $('ns-col'), COLG = $('ns-colg');
  function hideCols() { COLG.hidden = true; fileRows = null; fileHead = null; COL.innerHTML = ''; }
  function isNum(s) { return /^[+\-\u2212]?(\d+\.?\d*|\.\d+)$/.test(String(s).trim()); }
  function cells(line, d) { return line.split(d).map(function (c) { return c.trim().replace(/^"(.*)"$/, '$1').trim(); }); }
  function fillFromColumn(k) {
    var v = fileRows.map(function (r) { return r[k] === undefined ? '' : r[k]; }).filter(function (s) { return s !== ''; });
    X.value = v.join('\n'); render(); note('Loaded ' + v.length + ' values from ' + (fileHead ? 'the column ' + fileHead[k] : 'column ' + (k + 1)));
  }
  function loadText(t) {
    t = t.replace(/^\ufeff/, ''); var lines = t.split(/\r?\n/).filter(function (l) { return l.trim() !== ''; });
    if (!lines.length) { err.textContent = 'The file is empty.'; return; }
    var d = /\t/.test(lines[0]) ? '\t' : /;/.test(lines[0]) ? ';' : ',', rows = lines.map(function (l) { return cells(l, d); }), w = 0; rows.forEach(function (r) { w = Math.max(w, r.length); });
    if (w === 1) d = null;
    if (d === null) { var first = rows[0][0], head = !isNum(first) && rows.length > 1; fileRows = rows.slice(head ? 1 : 0); fileHead = null; hideColsKeep(); fillFromColumn(0); return; }
    var head2 = !rows[0].some(isNum) && rows.length > 1; fileHead = head2 ? rows[0] : null; fileRows = rows.slice(head2 ? 1 : 0);
    var def = w - 1; if (fileHead) { for (var k = 0; k < w; k++) if (/observ|read|measur|indicat|value|result/i.test(fileHead[k] || '')) { def = k; break; } }
    COL.innerHTML = ''; for (var j = 0; j < w; j++) { var o = document.createElement('option'); o.value = String(j); o.textContent = fileHead && fileHead[j] ? fileHead[j] : 'Column ' + (j + 1); COL.appendChild(o); }
    COL.value = String(def); COLG.hidden = false; fillFromColumn(def);
  }
  function hideColsKeep() { COLG.hidden = true; COL.innerHTML = ''; }
  $('ns-file').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0]; if (!f) return;
    if (f.size > 1048576) { err.textContent = 'That file is larger than 1 MB. Use a file with the readings only.'; e.target.value = ''; return; }
    var rd = new FileReader(); rd.onload = function () { loadText(String(rd.result)); }; rd.onerror = function () { err.textContent = 'The file could not be read.'; }; rd.readAsText(f); e.target.value = '';
  });
  COL.addEventListener('change', function () { if (fileRows) fillFromColumn(+COL.value); });
  $('ns').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.h) { var x = H[+b.dataset.h]; if (x) apply(x.s); return; }
    if (b.dataset.ex) { apply(JSON.parse(b.dataset.ex)); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'save') { saveTxt(); return; }
    if (b.dataset.act === 'csv') { saveCsv(); return; }
    if (b.dataset.act === 'csvs') { saveSummary(); return; }
    if (b.dataset.act === 'clearh') { H = []; saveH(); drawH(); return; }
    if (b.dataset.act === 'clearx') { X.value = ''; hideCols(); render(); X.focus(); return; }
    if (b.dataset.act === 'reset') { defaults(); PL.value = 'auto'; render(); X.focus(); }
  });
  var rt = 0; X.addEventListener('input', function () { clearTimeout(rt); if (X.value.length > 3000) { $('ns-cnt').textContent = count() + ' readings'; rt = setTimeout(render, 150); } else render(); });
  [Y, U, T].forEach(function (el) { el.addEventListener('input', render); });
  X.addEventListener('change', function () { clearTimeout(timer); if (last) push(last.e, last.r, last.s); });
  [Y, U, T].forEach(function (el) { el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { clearTimeout(timer); render(); if (last) push(last.e, last.r, last.s); } }); });
  PL.addEventListener('change', render); B.addEventListener('change', function () { render(); });
  loadH(); drawH(); defaults(); render();
})();
