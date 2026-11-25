/* Elecmetric Half-Life Calculator, Mode 04: decay table and graph. Engine: one file, no DOM.
   Required by tests/halflife_table_test.js and inlined (after tools/halflife_engine.js) into calculators/decay-table-calculator/index.html by tools/halflife_table_page.js.

   For a half-life T (scenario A) it lists the fraction remaining 2^(-n) at evenly spaced times, with an optional initial quantity N0, and compares up to two more
   half-lives (scenarios B and C) at the same times. The table is spaced either in half-lives of A ("hl": row i is at n = i x step, exact for whole numbers) or in
   time ("time": row i is at t = i x step in the table unit). Every scenario may have its own time unit; times are converted by the exact ratio of the units
   (Julian year = 365.25 days), which is exactly 1 for equal units.

   Graph: graph(result, opts) returns a self-contained SVG string (explicit colours, white background, so it can be saved as SVG or PNG), linear or logarithmic
   in the remaining percentage. The logarithmic axis is computed as 2 - n log10(2), never from the fraction, so it does not underflow. at(result, t) is the probe
   used by the page's readout slider and by the tests: the same numbers as a table row at any time t.

   Numerical policy as Mode 03: 2^(-n) is Math.pow(2, -n); the decayed fraction is -expm1(-ln 2 n) for n < 0.5 and 1 - f otherwise; a fraction below the smallest
   double is 0 with a warning, never an exact zero; a value that cannot be represented is refused with the field named. Errors are returned, never thrown.
   SCOPE: mathematical decay only. Not a radiation-safety, dosimetry or exposure assessment (CEO decision 8). */
(function (root) {
  'use strict';
  var H = (typeof module !== 'undefined' && module.exports) ? require('./halflife_engine.js') : root.HalfLife;
  var LN2 = Math.LN2, LOG10_2 = Math.LOG10E * Math.LN2, fmt = H.fmt, timeLabel = H.timeLabel;
  var MAX_ROWS = 200, SCEN = ['A', 'B', 'C'], MARKS = ['#b8860b', '#1f4e8c', '#2a7f62'], DASH = ['', '8 4', '2 4'];
  function unitDef(u) { for (var i = 0; i < H.TIME_UNITS.length; i++) if (H.TIME_UNITS[i][0] === u) return H.TIME_UNITS[i]; return null; }
  function perUnit(u) { var d = unitDef(u); return d ? d[4] : String(u); }
  function unitRatio(a, b) { return a === b ? 1 : unitDef(a)[3] / unitDef(b)[3]; }
  function pow2neg(n) { return n >= 1075 ? 0 : Math.pow(2, -n); }
  function decayedFraction(n, rem) { return n < 0.5 ? -Math.expm1(-LN2 * n) : 1 - rem; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function pct(fr, sg) { return fr === 0 ? '\u2248 0%' : fmt(fr * 100, sg) + '%'; }

  /* ---------- one point on one scenario ---------- */
  /* t is in the table unit; scenario s = { T, unit } ; nOverride (A in half-life spacing) keeps whole numbers exact */
  function point(sc, t, tu, nOverride) {
    var n = nOverride !== undefined ? nOverride : (tu === sc.unit ? t : t * unitRatio(tu, sc.unit)) / sc.T, rem = pow2neg(n);
    return { n: n, frac: rem, dec: decayedFraction(n, rem) };
  }

  /* ---------- the public run() ---------- */
  /* input: { T, halfLifeUnit, N0 (optional), quantityUnit, basis: 'hl' | 'time', step, rows, tableUnit ('same' or a unit; time basis only), TB, unitB, TC, unitC (optional), sig } */
  function run(input) {
    input = input || {};
    var hu = input.halfLifeUnit === undefined || input.halfLifeUnit === '' ? 'yr' : input.halfLifeUnit, basis = input.basis === 'time' ? 'time' : 'hl';
    var tu = input.tableUnit === undefined || input.tableUnit === '' || input.tableUnit === 'same' ? hu : input.tableUnit, sig = input.sig === undefined ? 6 : input.sig;
    var qu = String(input.quantityUnit || '').trim().slice(0, 16), warnings = [], i, j, p;
    if (!H.isTimeUnit(hu)) return { ok: false, error: 'Unknown half-life unit \u201c' + hu + '\u201d.' };
    if (!H.isTimeUnit(tu)) return { ok: false, error: 'Unknown table unit \u201c' + tu + '\u201d.' };
    var pT = H.parseNumber(input.T);
    if (pT.error) return { ok: false, error: 'Half-life: ' + pT.error, field: 'T' };
    if (pT.empty) return { ok: false, empty: true, error: '' };
    if (!(pT.value > 0)) return { ok: false, error: 'Half-life must be greater than zero.', field: 'T' };
    var pQ = H.parseNumber(input.N0), hasQty = !pQ.empty;
    if (pQ.error) return { ok: false, error: 'Initial quantity: ' + pQ.error, field: 'N0' };
    if (hasQty && !(pQ.value > 0)) return { ok: false, error: pQ.value === 0 ? 'Initial quantity must be greater than zero: a percentage of nothing is undefined. Leave it empty to see percentages only.' : 'Initial quantity must be greater than zero.', field: 'N0' };
    var pS = H.parseNumber(input.step === undefined || input.step === '' ? '1' : input.step);
    if (pS.error || pS.empty) return { ok: false, error: 'Step: ' + (pS.error || 'enter a number.'), field: 'step' };
    if (!(pS.value > 0)) return { ok: false, error: 'Step must be greater than zero.', field: 'step' };
    var pR = H.parseNumber(input.rows === undefined || input.rows === '' ? '10' : input.rows);
    if (pR.error || pR.empty) return { ok: false, error: 'Number of steps: ' + (pR.error || 'enter a whole number.'), field: 'rows' };
    if (pR.value !== Math.floor(pR.value) || pR.value < 1 || pR.value > MAX_ROWS) return { ok: false, error: 'Number of steps must be a whole number from 1 to ' + MAX_ROWS + '.', field: 'rows' };
    var rows = pR.value, step = pS.value, sc = [{ id: 'A', T: pT.value, unit: hu }], scErr = null;
    [['B', input.TB, input.unitB], ['C', input.TC, input.unitC]].forEach(function (x) {
      if (x[1] === undefined || String(x[1]).trim() === '') return;
      var q = H.parseNumber(x[1]), u = x[2] === undefined || x[2] === '' || x[2] === 'same' ? hu : x[2];
      if (q.error) { scErr = { error: 'Half-life ' + x[0] + ': ' + q.error, field: 'T' + x[0] }; return; }
      if (q.empty) return;
      if (!H.isTimeUnit(u)) { scErr = { error: 'Unknown time unit \u201c' + u + '\u201d for half-life ' + x[0] + '.', field: 'T' + x[0] }; return; }
      if (!(q.value > 0)) { scErr = { error: 'Half-life ' + x[0] + ' must be greater than zero.', field: 'T' + x[0] }; return; }
      sc.push({ id: x[0], T: q.value, unit: u });
    });
    if (scErr) return { ok: false, error: scErr.error, field: scErr.field };
    var N0 = hasQty ? pQ.value : undefined, out = [];
    /* time of row i in the table unit */
    var kA = unitRatio(hu, tu);
    for (i = 0; i <= rows; i++) {
      var t, nA;
      if (basis === 'hl') { nA = i * step; t = nA * sc[0].T * kA; } else { t = i * step; }
      if (!isFinite(t)) return { ok: false, error: 'A time in the table is outside the range of a double-precision number. Use a smaller step or a closer unit.', field: 'step' };
      var row = { i: i, t: t, p: [] };
      for (j = 0; j < sc.length; j++) {
        var pt = point(sc[j], t, tu, j === 0 && basis === 'hl' ? nA : undefined);
        if (!isFinite(pt.n)) return { ok: false, error: 'The number of half-lives for scenario ' + sc[j].id + ' is outside the range of a double-precision number. Use a closer unit or a larger half-life.', field: j === 0 ? 'T' : 'T' + sc[j].id };
        if (hasQty) { pt.qty = N0 * pt.frac; pt.decQty = N0 * pt.dec; }
        row.p.push(pt);
      }
      out.push(row);
    }
    var last = out[rows], tmax = last.t;
    if (sc.some(function (s, j) { return last.p[j].frac === 0; })) warnings = [{ code: 'UNDERFLOW_TO_ZERO', message: 'At the end of the table the remaining fraction of at least one scenario is smaller than the smallest number a double can hold (about 5 \u00d7 10\u207b\u00b3\u00b2\u2074), so it shows as 0%. It is not exactly zero.' }]; else warnings = [];
    var r = { ok: true, scen: sc, basis: basis, step: step, rows: rows, tableUnit: tu, halfLifeUnit: hu, quantityUnit: qu, hasQty: hasQty, N0: N0, table: out, tmax: tmax, sig: sig, warnings: warnings };
    r.check = check(r);
    r.steps = working(r);
    return r;
  }
  /* independent check: every row against exp(-n ln 2) (a different route from 2^(-n)), and the fractions summing to 1 */
  function check(r) {
    var worst = 0, i, j, e;
    for (i = 0; i < r.table.length; i++) for (j = 0; j < r.scen.length; j++) {
      var q = r.table[i].p[j];
      e = Math.abs(q.frac + q.dec - 1); if (e > worst) worst = e;
      if (q.n < 700 && q.frac > 1e-300) { e = Math.abs(Math.exp(-LN2 * q.n) - q.frac) / q.frac; if (e > worst) worst = e; }
    }
    return { err: worst, ok: worst <= 1e-12 };
  }
  /* the probe: the same numbers as a table row, at any time t (in the table unit) */
  function at(r, t) {
    return r.scen.map(function (sc) { var pt = point(sc, t, r.tableUnit), o = { id: sc.id, n: pt.n, frac: pt.frac, dec: pt.dec }; if (r.hasQty) { o.qty = r.N0 * pt.frac; o.decQty = r.N0 * pt.dec; } return o; });
  }

  /* ---------- the graph ---------- */
  function niceTicks(lo, hi, want) {
    var span = hi - lo, raw = span / want, mag = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / mag, st = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * mag, a = Math.ceil(lo / st - 1e-9) * st, o = [];
    for (var v = a; v <= hi + st * 1e-9; v += st) o.push(Math.abs(v) < st * 1e-9 ? 0 : v);
    return o;
  }
  function tickText(v) { var a = Math.abs(v); return a !== 0 && (a >= 1e6 || a < 1e-3) ? v.toExponential(1).replace('e+', 'e') : String(Math.round(v * 1e6) / 1e6); }
  /* opts: { log: bool, probe: t or undefined, width, height, markers: bool } */
  function graph(r, opts) {
    opts = opts || {};
    var W = opts.width || 760, Hh = opts.height || 420, L = 64, R = 18, Tp = 38, B = 58, pw = W - L - R, ph = Hh - Tp - B, log = !!opts.log, tmax = r.tmax, tu = r.tableUnit, j, i, s = [];
    var xs = function (t) { return L + (tmax > 0 ? t / tmax : 0) * pw; };
    /* y range: linear 0 to 100%; log from 100% down to the lowest value drawn, in whole decades */
    var ymin = 0;
    if (log) { var lo = 2; r.scen.forEach(function (sc) { var n = (tu === sc.unit ? tmax : tmax * unitRatio(tu, sc.unit)) / sc.T; if (2 - n * LOG10_2 < lo) lo = 2 - n * LOG10_2; }); ymin = Math.min(0, Math.floor(lo)); if (!isFinite(ymin) || ymin < -300) ymin = -300; if (ymin > -1) ymin = -1; }
    var ys = function (lg, fr) { var v = log ? lg : fr * 100; return Tp + ph - (log ? (v - ymin) / (2 - ymin) : v / 100) * ph; };
    var title = 'Decay curve' + (r.scen.length > 1 ? 's' : '') + ': percentage remaining against time' + (log ? ' (logarithmic scale)' : '');
    var desc = r.scen.map(function (sc) { return 'Scenario ' + sc.id + ': half-life ' + fmt(sc.T, 6) + ' ' + timeLabel(sc.unit, sc.T); }).join('; ') + '. Time runs from 0 to ' + fmt(tmax, 6) + ' ' + timeLabel(tu, tmax) + '.';
    s.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + Hh + '" width="' + W + '" height="' + Hh + '" role="img" aria-labelledby="dt-gt dt-gd" font-family="Arial, Helvetica, sans-serif">');
    s.push('<title id="dt-gt">' + esc(title) + '</title><desc id="dt-gd">' + esc(desc) + '</desc><defs><clipPath id="dt-clip"><rect x="' + L + '" y="' + Tp + '" width="' + pw + '" height="' + ph + '"/></clipPath></defs><rect width="' + W + '" height="' + Hh + '" fill="#ffffff"/>');
    s.push('<text x="' + L + '" y="22" font-size="15" font-weight="700" fill="#1a1a1a">Percentage remaining against time</text>');
    /* y grid */
    var yt = [];
    if (log) { var stp = Math.max(1, Math.ceil((2 - ymin) / 8)); for (var d = 2; d >= ymin; d -= stp) yt.push(d); yt.forEach(function (d) { var y = ys(d); s.push('<line x1="' + L + '" y1="' + y.toFixed(1) + '" x2="' + (L + pw) + '" y2="' + y.toFixed(1) + '" stroke="#d9d9d9"/><text x="' + (L - 8) + '" y="' + (y + 4).toFixed(1) + '" font-size="11" text-anchor="end" fill="#333">' + (d === 2 ? '100%' : d === 1 ? '10%' : d === 0 ? '1%' : '10' + String(d - 2).replace('-', '\u207b').replace(/\d/g, function (c) { return '\u2070\u00b9\u00b2\u00b3\u2074\u2075\u2076\u2077\u2078\u2079'[c]; }) + '%') + '</text>'); }); }
    else niceTicks(0, 100, 5).forEach(function (v) { var y = ys(0, v / 100); s.push('<line x1="' + L + '" y1="' + y.toFixed(1) + '" x2="' + (L + pw) + '" y2="' + y.toFixed(1) + '" stroke="#d9d9d9"/><text x="' + (L - 8) + '" y="' + (y + 4).toFixed(1) + '" font-size="11" text-anchor="end" fill="#333">' + v + '%</text>'); });
    /* x ticks */
    niceTicks(0, tmax, 6).forEach(function (v) { var x = xs(v); s.push('<line x1="' + x.toFixed(1) + '" y1="' + Tp + '" x2="' + x.toFixed(1) + '" y2="' + (Tp + ph) + '" stroke="#ececec"/><text x="' + x.toFixed(1) + '" y="' + (Tp + ph + 16) + '" font-size="11" text-anchor="middle" fill="#333">' + esc(tickText(v)) + '</text>'); });
    s.push('<rect x="' + L + '" y="' + Tp + '" width="' + pw + '" height="' + ph + '" fill="none" stroke="#6b6b6b"/>');
    s.push('<text x="' + (L + pw / 2) + '" y="' + (Hh - 26) + '" font-size="12" text-anchor="middle" fill="#1a1a1a">Time (' + esc(timeLabel(tu)) + ')</text>');
    s.push('<text transform="translate(16 ' + (Tp + ph / 2) + ') rotate(-90)" font-size="12" text-anchor="middle" fill="#1a1a1a">Remaining' + (log ? ' (log scale)' : '') + '</text>');
    /* automatic half-life markers of scenario A: a faint vertical line at every whole half-life (up to 12 in view) */
    var tA = r.scen[0].T * unitRatio(r.scen[0].unit, tu), nEnd = tmax / tA;
    if (isFinite(nEnd) && nEnd >= 1 && nEnd <= 12.0000001) for (i = 1; i <= Math.floor(nEnd + 1e-9); i++) { var hx = xs(i * tA); s.push('<line class="hlm" x1="' + hx.toFixed(1) + '" y1="' + Tp + '" x2="' + hx.toFixed(1) + '" y2="' + (Tp + ph) + '" stroke="#b8860b" stroke-opacity="0.55" stroke-dasharray="1 3"/><text x="' + hx.toFixed(1) + '" y="' + (Tp + ph - 6) + '" font-size="10" text-anchor="middle" fill="#7a5a00">' + i + ' T\u00bd</text>'); }
    /* curves: 240 points from the model itself, not joined table rows */
    r.scen.forEach(function (sc, k) {
      var pts = [], N = 240;
      for (i = 0; i <= N; i++) { var t = tmax * i / N, n = (tu === sc.unit ? t : t * unitRatio(tu, sc.unit)) / sc.T; pts.push(xs(t).toFixed(1) + ',' + ys(2 - n * LOG10_2, pow2neg(n)).toFixed(1)); }
      s.push('<polyline clip-path="url(#dt-clip)" fill="none" stroke="' + MARKS[k] + '" stroke-width="2.5"' + (DASH[k] ? ' stroke-dasharray="' + DASH[k] + '"' : '') + ' points="' + pts.join(' ') + '"/>');
    });
    /* markers at the table rows of scenario A and others */
    if (opts.markers !== false && r.rows <= 60) r.table.forEach(function (row) { row.p.forEach(function (q, k) { var x = xs(row.t), y = ys(2 - q.n * LOG10_2, q.frac); if (y < Tp - 1 || y > Tp + ph + 1) return; s.push(k === 0 ? '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3.2" fill="' + MARKS[0] + '"/>' : k === 1 ? '<rect x="' + (x - 3).toFixed(1) + '" y="' + (y - 3).toFixed(1) + '" width="6" height="6" fill="' + MARKS[1] + '"/>' : '<path d="M' + x.toFixed(1) + ' ' + (y - 4).toFixed(1) + 'L' + (x + 4).toFixed(1) + ' ' + (y + 3).toFixed(1) + 'L' + (x - 4).toFixed(1) + ' ' + (y + 3).toFixed(1) + 'Z" fill="' + MARKS[2] + '"/>'); }); });
    /* the probe */
    if (opts.probe !== undefined && opts.probe >= 0 && opts.probe <= tmax) {
      var px = xs(opts.probe); s.push('<line x1="' + px.toFixed(1) + '" y1="' + Tp + '" x2="' + px.toFixed(1) + '" y2="' + (Tp + ph) + '" stroke="#1a1a1a" stroke-width="1.5" stroke-dasharray="3 3"/>');
      at(r, opts.probe).forEach(function (q, k) { s.push('<circle cx="' + px.toFixed(1) + '" cy="' + ys(2 - q.n * LOG10_2, q.frac).toFixed(1) + '" r="5" fill="#ffffff" stroke="' + MARKS[k] + '" stroke-width="2.5"/>'); });
    }
    /* legend */
    var lx = L + 10; r.scen.forEach(function (sc, k) { var y = Tp + 16 + k * 18; s.push('<rect x="' + (lx - 4) + '" y="' + (y - 12) + '" width="190" height="17" fill="#ffffff" fill-opacity="0.85"/><line x1="' + lx + '" y1="' + (y - 3) + '" x2="' + (lx + 30) + '" y2="' + (y - 3) + '" stroke="' + MARKS[k] + '" stroke-width="2.5"' + (DASH[k] ? ' stroke-dasharray="' + DASH[k] + '"' : '') + '/><text x="' + (lx + 38) + '" y="' + y + '" font-size="12" fill="#1a1a1a">' + esc(sc.id + ': T\u00bd ' + fmt(sc.T, 4) + ' ' + timeLabel(sc.unit, sc.T)) + '</text>'); });
    s.push('</svg>');
    return s.join('');
  }

  /* ---------- the written working ---------- */
  function working(r) {
    var sg = r.sig, F = function (v) { return fmt(v, sg); }, a = r.scen[0], Q = r.quantityUnit ? '\u00a0' + r.quantityUnit : '', st = [];
    st.push({ title: 'The decay law', text: 'N\u209c = N\u2080 \u00d7 2^(\u2212t / T\u00bd)\nfraction remaining f = 2^(\u2212n), where n = t / T\u00bd is the number of half-lives elapsed\nfraction decayed = 1 \u2212 f' });
    var spacing = r.basis === 'hl' ? 'Rows are spaced ' + F(r.step) + ' half-life' + (r.step === 1 ? '' : 's') + ' of scenario A apart: n = i \u00d7 ' + F(r.step) + ', and the time is t = n \u00d7 ' + F(a.T) + '\u00a0' + timeLabel(a.unit, a.T) + (r.tableUnit !== a.unit ? ' = n \u00d7 ' + F(a.T * unitRatio(a.unit, r.tableUnit)) + '\u00a0' + timeLabel(r.tableUnit, 2) : '') + '.' : 'Rows are spaced ' + F(r.step) + '\u00a0' + timeLabel(r.tableUnit, r.step) + ' apart: t = i \u00d7 ' + F(r.step) + ', and n = t / T\u00bd.';
    st.push({ title: 'The table', text: spacing + '\n' + (r.rows + 1) + ' rows, from t = 0 to t = ' + F(r.tmax) + '\u00a0' + timeLabel(r.tableUnit, r.tmax) + '.' });
    var q = r.table[Math.min(1, r.rows)], p0 = q.p[0];
    st.push({ title: 'A sample row', text: 'Row ' + q.i + ': t = ' + F(q.t) + '\u00a0' + timeLabel(r.tableUnit, q.t) + '\nn = t / T\u00bd = ' + F(p0.n) + '\nf = 2^(\u2212' + F(p0.n) + ') = ' + (p0.frac === 0 ? '\u2248 0' : F(p0.frac)) + ' = ' + pct(p0.frac, sg) + (r.hasQty ? '\nN\u209c = ' + F(r.N0) + Q + ' \u00d7 ' + (p0.frac === 0 ? '0' : F(p0.frac)) + ' = ' + F(p0.qty) + Q : '') });
    if (r.scen.length > 1) st.push({ title: 'Scenarios', text: r.scen.map(function (sc) { return sc.id + ': T\u00bd = ' + F(sc.T) + '\u00a0' + timeLabel(sc.unit, sc.T) + ', \u03bb = ln 2 / T\u00bd = ' + F(LN2 / sc.T) + ' per ' + perUnit(sc.unit); }).join('\n') + '\nAll scenarios are read at the same times t. A scenario whose half-life is in another unit has t converted to its own unit first.' });
    st.push({ title: 'Check', text: 'Every row was checked: remaining + decayed = 1, and f agrees with e^(\u2212n ln 2); ' + (r.check.ok ? 'worst disagreement ' + r.check.err.toExponential(1) + ' (better than 1 part in 10\u00b9\u00b2).' : 'they differ by a relative ' + r.check.err.toExponential(2) + '. Report this.') });
    return st;
  }

  /* ---------- exports ---------- */
  function header(r) {
    var h = ['Row', 'Time (' + timeLabel(r.tableUnit) + ')'];
    r.scen.forEach(function (sc) { var t = r.scen.length > 1 ? ' ' + sc.id : ''; h.push('Half-lives' + t, 'Remaining %' + t, 'Decayed %' + t); if (r.hasQty) h.push('Remaining quantity' + t + (r.quantityUnit ? ' (' + r.quantityUnit + ')' : '')); });
    return h;
  }
  function exportCsv(r) {
    var csvq = function (v) { v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }, o = [header(r).map(csvq).join(',')];
    r.table.forEach(function (row) { var c = [row.i, row.t]; row.p.forEach(function (q) { c.push(q.n, q.frac * 100, q.dec * 100); if (r.hasQty) c.push(q.qty); }); o.push(c.map(csvq).join(',')); });
    return o.join('\r\n') + '\r\n';
  }
  function exportTxt(r) {
    var sg = r.sig, o = ['Elecmetric Half-Life Calculator, Mode 04 (decay table and graph)', ''];
    r.scen.forEach(function (sc) { o.push('Scenario ' + sc.id + ': half-life ' + fmt(sc.T, sg) + ' ' + timeLabel(sc.unit, sc.T)); });
    if (r.hasQty) o.push('Initial quantity: ' + fmt(r.N0, sg) + (r.quantityUnit ? ' ' + r.quantityUnit : ''));
    o.push('', header(r).join('\t'));
    r.table.forEach(function (row) { var c = [row.i, fmt(row.t, sg)]; row.p.forEach(function (q) { c.push(fmt(q.n, sg), pct(q.frac, sg), pct(q.dec, sg)); if (r.hasQty) c.push(fmt(q.qty, sg)); }); o.push(c.join('\t')); });
    o.push(''); r.steps.forEach(function (s) { o.push(s.title.toUpperCase()); o.push(s.text); o.push(''); });
    r.warnings.forEach(function (w) { o.push('Note: ' + w.message); });
    o.push('Mathematical decay only. Not a radiation-safety, dosimetry or exposure assessment.');
    return o.join('\n');
  }
  function exportJson(r) {
    var j = { tool: 'Elecmetric Half-Life Calculator, Mode 04', spacing: r.basis === 'hl' ? 'half-lives of scenario A' : 'time', step: r.step, tableUnit: r.tableUnit, scenarios: r.scen.map(function (sc) { return { id: sc.id, halfLife: sc.T, halfLifeUnit: sc.unit }; }), warnings: r.warnings.map(function (w) { return w.code; }) };
    if (r.hasQty) { j.initialQuantity = r.N0; j.quantityUnit = r.quantityUnit; }
    j.rows = r.table.map(function (row) { return { row: row.i, time: row.t, values: row.p.map(function (q, k) { var o = { scenario: r.scen[k].id, halfLives: q.n, remainingPercentage: q.frac * 100, decayedPercentage: q.dec * 100 }; if (r.hasQty) { o.remainingQuantity = q.qty; o.decayedQuantity = q.decQty; } return o; }) }; });
    return JSON.stringify(j, null, 2);
  }

  var api = { LN2: LN2, MAX_ROWS: MAX_ROWS, SCEN: SCEN, MARKS: MARKS, unitRatio: unitRatio, pow2neg: pow2neg, decayedFraction: decayedFraction, run: run, at: at, graph: graph, exportTxt: exportTxt, exportCsv: exportCsv, exportJson: exportJson };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.HalfLifeTable = api;
})(typeof window !== 'undefined' ? window : this);
