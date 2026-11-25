/* Elecmetric Half-Life Calculator, Mode 01: four-variable solver. Engine: one file, no dependencies, no DOM.
   Required by tests/halflife_test.js and inlined into calculators/half-life-calculator/index.html by tools/halflife_page.js.

   Governing law (one model for the standard calculator, CEO decision 1):   Nt = N0 x 2^(-t / T) = N0 x exp(-lambda t),   lambda = ln 2 / T,   tau = T / ln 2.
   Any three of N0 (initial quantity), Nt (remaining quantity), t (elapsed time) and T (half-life) give the fourth. Time uses ONE unit for t and T, so the
   consistency of time units is structural (CEO decision 4). The quantity unit is a label only; nothing is converted.

   Numerical policy:
   - powers of two use Math.pow(2, x) and logarithms use Math.log2, so the textbook cases are exact (100 g after three half-lives is exactly 12.5 g, not
     12.500000000000004);
   - elapsed time and half-life are found from log2(N0 / Nt), computed with log1p when N0 and Nt are close and as a difference of logs when the plain ratio
     would overflow or underflow, so a ratio such as 1e300 / 1e-300 neither overflows nor loses precision;
   - the number of half-lives n is taken from the quantities when t or T is the unknown (n = ln(N0/Nt) / ln 2), so it is exact for the numbers the user typed;
   - when Nt is an input it is reported exactly as typed (never recomputed), and the decayed fraction is (N0 - Nt) / N0, which keeps full precision near Nt = N0;
   - when Nt is the unknown the decayed fraction is -expm1(-ln2 n), which keeps full precision for a small amount of decay;
   - a result below the smallest double (2^-1074) underflows to exactly 0 and is reported as an underflow warning, never as an exact zero.
   Errors are returned, never thrown, with the field that caused them.

   SCOPE: mathematical decay only. This is not a radiation-safety, dosimetry or exposure assessment (CEO decision 8). */
(function (root) {
  'use strict';
  var LN2 = Math.LN2, YEAR_S = 365.25 * 86400;

  /* time units: seconds per unit is kept for the "equivalent time" display only; the calculation never converts */
  var TIME_UNITS = [
    ['ns', 'ns', 'nanoseconds', 1e-9, 'ns'], ['us', '\u00b5s', 'microseconds', 1e-6, '\u00b5s'], ['ms', 'ms', 'milliseconds', 1e-3, 'ms'], ['s', 's', 'seconds', 1, 's'],
    ['min', 'min', 'minutes', 60, 'min'], ['h', 'h', 'hours', 3600, 'h'], ['d', 'days', 'days', 86400, 'day'], ['wk', 'weeks', 'weeks', 604800, 'week'],
    ['yr', 'years', 'years', YEAR_S, 'year'], ['kyr', 'thousand years', 'thousand years', 1e3 * YEAR_S, 'thousand years'], ['Myr', 'million years', 'million years', 1e6 * YEAR_S, 'million years'], ['Gyr', 'billion years', 'billion years', 1e9 * YEAR_S, 'billion years']
  ];
  var TARGETS = [['auto', 'Automatic (leave one empty)'], ['Nt', 'Remaining quantity (Nt)'], ['N0', 'Initial quantity (N0)'], ['t', 'Elapsed time (t)'], ['T', 'Half-life (T\u00bd)']];
  var FIELDS = ['N0', 'Nt', 't', 'T'], NAMES = { N0: 'Initial quantity', Nt: 'Remaining quantity', t: 'Elapsed time', T: 'Half-life' }, FIELD_LABEL = { N0: 'Initial quantity N\u2080', Nt: 'Remaining quantity N\u209c', t: 'Elapsed time t', T: 'Half-life T\u00bd' };
  function unitDef(u) { for (var i = 0; i < TIME_UNITS.length; i++) if (TIME_UNITS[i][0] === u) return TIME_UNITS[i]; return null; }
  function isTimeUnit(u) { return !!unitDef(u); }
  function timeLabel(u, v) { var d = unitDef(u); return d ? (v === 1 ? d[4] : d[1]) : String(u); }
  function perUnit(u) { var d = unitDef(u); return d ? d[4] : String(u); }

  /* ---------- numbers in and out ---------- */
  /* Accepts 100, 5730, 11,460, 11 460, 1.5e-3, 2E9, .5, +3, a minus sign and a Unicode minus. Rejects words, Infinity and NaN. */
  function parseNumber(s) {
    var raw = String(s === undefined || s === null ? '' : s).trim();
    if (raw === '') return { empty: true };
    var t = raw.replace(/\u2212/g, '-').replace(/[\s_]/g, '');
    if (/^[+-]?\d{1,3}(,\d{3})+(\.\d*)?([eE][+-]?\d+)?$/.test(t)) t = t.replace(/,/g, '');
    if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t)) return { error: '\u201c' + raw + '\u201d is not a number. Use digits such as 11460, 11,460 or 1.5e-3.' };
    var v = Number(t);
    if (!isFinite(v)) return { error: '\u201c' + raw + '\u201d is outside the range of a double-precision number.' };
    return { value: v };
  }
  function group(intStr) { return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  /* sig: significant figures (default 6); 0 or 'full' = shortest exact representation */
  function fmt(v, sig) {
    if (v === Infinity) return '\u221e'; if (v === -Infinity) return '\u2212\u221e'; if (v !== v) return 'undefined';
    if (v === 0) return '0';
    var s = (sig === 0 || sig === 'full') ? null : (sig || 6), a = Math.abs(v), neg = v < 0 ? '\u2212' : '';
    if (a < 1e-4 || a >= 1e12) {
      var e = s === null ? a.toExponential() : a.toExponential(s - 1), m = e.split('e'), mant = m[0].indexOf('.') >= 0 ? m[0].replace(/0+$/, '').replace(/\.$/, '') : m[0], ex = parseInt(m[1], 10);
      return neg + mant + ' \u00d7 10' + supDigits(ex);
    }
    var txt = s === null ? String(a) : String(Number(a.toPrecision(s)));
    if (/e/i.test(txt)) { txt = a.toFixed(Math.max(0, Math.min(20, s === null ? 12 : s + 4))).replace(/0+$/, '').replace(/\.$/, ''); }
    var p = txt.split('.');
    return neg + group(p[0]) + (p[1] ? '.' + p[1] : '');
  }
  function supDigits(n) { var m = { '-': '\u207b', '0': '\u2070', '1': '\u00b9', '2': '\u00b2', '3': '\u00b3', '4': '\u2074', '5': '\u2075', '6': '\u2076', '7': '\u2077', '8': '\u2078', '9': '\u2079' }; return String(n).split('').map(function (c) { return m[c]; }).join(''); }
  function pct(f, sig) { return fmt(f * 100, sig) + '%'; }

  /* ---------- numerical core (mirrors the supplied exponentialDecay.ts; powers of two and log2 instead of exp and ln so exact cases stay exact) ---------- */
  function pow2neg(n) { return n >= 1075 ? 0 : Math.pow(2, -n); }
  /* log2(a / b) for finite a, b > 0 */
  function log2Ratio(a, b) {
    var rel = (a - b) / b;
    if (Math.abs(rel) < 1e-3) return Math.log1p(rel) / LN2;
    var r = a / b;
    if (isFinite(r) && r > 1e-290 && r < 1e290) return Math.log2(r);
    return Math.log2(a) - Math.log2(b);
  }
  function lnRatio(a, b) { return log2Ratio(a, b) * LN2; }
  function remainingQuantity(N0, T, t) { return N0 * pow2neg(t / T); }
  function initialQuantity(Nt, T, t) { var n = t / T; return n >= 1024 ? Infinity : Nt * Math.pow(2, n); }
  function elapsedTime(N0, Nt, T) { return Nt >= N0 ? 0 : log2Ratio(N0, Nt) * T; }
  function halfLife(N0, Nt, t) { return Nt >= N0 ? (t === 0 ? NaN : Infinity) : t / log2Ratio(N0, Nt); }

  /* ---------- validation ---------- */
  function need(v, key, kind) {
    var name = NAMES[key];
    if (v === undefined) return { field: key, error: name + ' is required.' };
    if (kind === 'pos' && !(v > 0)) return { field: key, error: name + ' must be greater than zero.' };
    if (kind === 'nonneg' && v < 0) return { field: key, error: name + ' cannot be negative.' };
    return null;
  }
  function checkRemaining(Nt, N0) {
    if (Nt === undefined) return { field: 'Nt', error: 'Remaining quantity is required.' };
    if (Nt < 0) return { field: 'Nt', error: 'Remaining quantity cannot be negative.' };
    if (Nt === 0) return { field: 'Nt', error: 'A remaining quantity of exactly zero is reached only at infinite time, so no finite elapsed time or half-life exists. Enter a small positive amount instead.' };
    if (Nt > N0) return { field: 'Nt', error: 'Remaining quantity cannot exceed the initial quantity in ordinary decay.' };
    return null;
  }

  /* ---------- the solver ---------- */
  /* vals: numbers for N0, Nt, t, T (undefined for the unknown). Returns { ok, sol, warnings } or { ok:false, error, field }. */
  function solve(target, vals) {
    var N0 = vals.N0, Nt = vals.Nt, t = vals.t, T = vals.T, e = null, warnings = [], n;
    if (target === 'Nt') e = need(N0, 'N0', 'pos') || need(T, 'T', 'pos') || need(t, 't', 'nonneg');
    else if (target === 'N0') e = need(Nt, 'Nt', 'pos') || need(T, 'T', 'pos') || need(t, 't', 'nonneg');
    else if (target === 't') e = need(N0, 'N0', 'pos') || need(T, 'T', 'pos') || checkRemaining(Nt, N0 === undefined ? 0 : N0);
    else if (target === 'T') e = need(N0, 'N0', 'pos') || need(t, 't', 'pos') || checkRemaining(Nt, N0 === undefined ? 0 : N0);
    else return { ok: false, error: 'Unknown calculation target.' };
    if (e) return { ok: false, error: e.error, field: e.field };

    if (target === 'Nt') { n = t / T; Nt = remainingQuantity(N0, T, t); }
    else if (target === 'N0') {
      n = t / T; N0 = initialQuantity(Nt, T, t);
      if (!isFinite(N0)) warnings.push({ code: 'OVERFLOW', message: 'The initial quantity is too large to represent as a double-precision number for this many half-lives.' });
    } else if (target === 't') { t = elapsedTime(N0, Nt, T); n = Nt >= N0 ? 0 : log2Ratio(N0, Nt); }
    else {
      if (Nt === N0) { T = Infinity; n = 0; warnings.push({ code: 'NO_DECAY_OBSERVED', message: 'The remaining quantity equals the initial quantity over a non-zero time, so no decay was observed and the half-life is not finite.' }); }
      else { T = halfLife(N0, Nt, t); n = log2Ratio(N0, Nt); }
    }

    /* fractions: when Nt is the unknown they come from n; when Nt was typed they come from the typed numbers, which keeps full precision near Nt = N0 */
    var remFromN = pow2neg(n), decFromN = n < 0.5 ? -Math.expm1(-LN2 * n) : 1 - remFromN, remFrac, decFrac;
    if (target === 'Nt' || !isFinite(N0) || !isFinite(Nt / N0) || Nt / N0 === 0) { remFrac = remFromN; decFrac = decFromN; }
    else { remFrac = Nt / N0; decFrac = (N0 - Nt) / N0; }
    var decQty = isFinite(N0) ? (target === 'Nt' ? N0 * decFrac : N0 - Nt) : Infinity, under = remFrac === 0;
    if (target === 'Nt' && Nt === 0) warnings.push({ code: 'UNDERFLOW_TO_ZERO', message: 'The remaining quantity is smaller than the smallest number a double can hold (about 5 \u00d7 10\u207b\u00b3\u00b2\u2074), so it shows as 0. It is not exactly zero.' });
    else if (under) warnings.push({ code: 'UNDERFLOW_TO_ZERO', message: 'The remaining fraction is smaller than the smallest number a double can hold (about 5 \u00d7 10\u207b\u00b3\u00b2\u2074), so its percentage shows as 0%. It is not exactly zero.' });
    var lambda = T === Infinity ? 0 : LN2 / T, tau = T === Infinity ? Infinity : T / LN2;
    var sol = { N0: N0, Nt: Nt, t: t, T: T, n: n, remFrac: remFrac, decFrac: decFrac, decQty: decQty, lambda: lambda, tau: tau, target: target, underflow: under };
    /* independent check: put the four values back through the model by a different route (exp, not 2^x) */
    if (isFinite(N0) && isFinite(T) && T > 0 && n < 700 && Nt > 1e-300) {
      var back = N0 * Math.exp(-LN2 * (t / T)), d = Math.abs(back - Nt) / Math.max(Math.abs(Nt), 1e-300);
      sol.check = { value: back, relDiff: d, ok: d <= 1e-9 };
    }
    return { ok: true, sol: sol, warnings: warnings };
  }

  /* ---------- the written working (plain Unicode text; no external renderer is needed) ---------- */
  function working(sol, u, qu, sig) {
    var Q = qu ? '\u00a0' + qu : '', F = function (v) { return fmt(v, sig); }, FT = function (v) { return fmt(v, sig) + '\u00a0' + timeLabel(u, v); }, steps = [];
    steps.push({ title: 'The decay law', text: 'N\u209c = N\u2080 \u00d7 2^(\u2212t / T\u00bd) = N\u2080 \u00d7 e^(\u2212\u03bbt)\nwhere \u03bb = ln 2 / T\u00bd and \u03c4 = 1 / \u03bb = T\u00bd / ln 2' });
    if (sol.target === 'Nt') steps.push({ title: 'Remaining quantity', text: 'N\u209c = N\u2080 \u00d7 2^(\u2212t / T\u00bd)\n   = ' + F(sol.N0) + Q + ' \u00d7 2^(\u2212' + FT(sol.t) + ' / ' + FT(sol.T) + ')\n   = ' + F(sol.N0) + Q + ' \u00d7 2^(\u2212' + F(sol.n) + ')\n   = ' + F(sol.Nt) + Q });
    else if (sol.target === 'N0') steps.push({ title: 'Initial quantity', text: 'N\u2080 = N\u209c \u00d7 2^(t / T\u00bd)\n   = ' + F(sol.Nt) + Q + ' \u00d7 2^(' + FT(sol.t) + ' / ' + FT(sol.T) + ')\n   = ' + F(sol.Nt) + Q + ' \u00d7 2^' + F(sol.n) + '\n   = ' + F(sol.N0) + Q });
    else if (sol.target === 't') steps.push({ title: 'Elapsed time', text: 't = T\u00bd \u00d7 ln(N\u2080 / N\u209c) / ln 2\n  = ' + FT(sol.T) + ' \u00d7 ln(' + F(sol.N0) + ' / ' + F(sol.Nt) + ') / ln 2\n  = ' + FT(sol.T) + ' \u00d7 ' + F(sol.n) + '\n  = ' + FT(sol.t) });
    else if (sol.T === Infinity) steps.push({ title: 'Half-life', text: 'N\u209c equals N\u2080, so ln(N\u2080 / N\u209c) = 0 and T\u00bd = t \u00d7 ln 2 / 0 is not finite.\nNo decay was observed in ' + FT(sol.t) + '.' });
    else steps.push({ title: 'Half-life', text: 'T\u00bd = t \u00d7 ln 2 / ln(N\u2080 / N\u209c)\n   = ' + FT(sol.t) + ' \u00d7 ln 2 / ln(' + F(sol.N0) + ' / ' + F(sol.Nt) + ')\n   = ' + FT(sol.t) + ' / ' + F(sol.n) + '\n   = ' + FT(sol.T) });
    steps.push({ title: 'Half-lives elapsed', text: 'n = t / T\u00bd = ' + F(sol.n) + (sol.n === Math.round(sol.n) && sol.n > 0 && sol.n <= 64 ? '   (the quantity has been halved ' + F(sol.n) + (sol.n === 1 ? ' time)' : ' times)') : '') });
    steps.push({ title: 'Percentages', text: 'Remaining = N\u209c / N\u2080 \u00d7 100 = ' + (sol.remFrac === 0 ? '\u2248 0% (below the smallest double)' : pct(sol.remFrac, sig)) + '\nDecayed   = 100% \u2212 remaining = ' + pct(sol.decFrac, sig) + (isFinite(sol.decQty) ? '\nDecayed quantity = N\u2080 \u2212 N\u209c = ' + F(sol.decQty) + Q : '') });
    steps.push({ title: 'Decay constant and mean lifetime', text: sol.T === Infinity ? '\u03bb = 0 and \u03c4 is not finite (no decay observed).' : '\u03bb = ln 2 / T\u00bd = 0.693147 / ' + FT(sol.T) + ' = ' + F(sol.lambda) + ' per ' + perUnit(u) + '\n\u03c4 = 1 / \u03bb = T\u00bd / ln 2 = ' + FT(sol.tau) });
    if (sol.check) steps.push({ title: 'Check', text: 'Putting the four values back into N\u2080 \u00d7 2^(\u2212t / T\u00bd) gives ' + F(sol.check.value) + Q + '; ' + (sol.check.ok ? 'it agrees with N\u209c (relative difference ' + (sol.check.relDiff === 0 ? '0' : sol.check.relDiff.toExponential(1)) + ').' : 'it differs from N\u209c by a relative ' + sol.check.relDiff.toExponential(2) + '. Report this.') });
    return steps;
  }

  /* ---------- the public run() used by the page and the tests ---------- */
  /* input: { target:'auto'|'Nt'|'N0'|'t'|'T', N0, Nt, t, T (strings or numbers), timeUnit, quantityUnit, sig } */
  function run(input) {
    input = input || {};
    var u = input.timeUnit === undefined || input.timeUnit === '' ? 'yr' : input.timeUnit, qu = String(input.quantityUnit || '').trim().slice(0, 16), sig = input.sig === undefined ? 6 : input.sig;
    if (!isTimeUnit(u)) return { ok: false, error: 'Unknown time unit \u201c' + u + '\u201d.' };
    var vals = {}, blanks = [], i, p, target = input.target || 'auto';
    if (target !== 'auto' && FIELDS.indexOf(target) < 0) return { ok: false, error: 'Unknown calculation target.' };
    for (i = 0; i < FIELDS.length; i++) {
      if (FIELDS[i] === target) continue; /* the field being solved is ignored, whatever it holds */
      p = parseNumber(input[FIELDS[i]]);
      if (p.error) return { ok: false, error: NAMES[FIELDS[i]] + ': ' + p.error, field: FIELDS[i] };
      if (p.empty) blanks.push(FIELDS[i]); else vals[FIELDS[i]] = p.value;
    }
    if (target === 'auto') {
      if (blanks.length === FIELDS.length) return { ok: false, empty: true, error: '' };
      if (blanks.length === 0) return { ok: false, error: 'All four fields are filled in. Clear the one you want to find, or choose it in \u201cFind\u201d.', field: 'T' };
      if (blanks.length > 1) return { ok: false, error: 'Enter any three values and leave the fourth empty (still empty: ' + blanks.map(function (b) { return NAMES[b]; }).join(', ') + ').', field: blanks[0], partial: true };
      target = blanks[0];
    } else if (blanks.length === FIELDS.length - 1) {
      return { ok: false, empty: true, error: '' };
    }
    var s = solve(target, vals);
    if (!s.ok) return { ok: false, error: s.error, field: s.field };
    var sol = s.sol;
    return { ok: true, sol: sol, target: target, timeUnit: u, quantityUnit: qu, sig: sig, warnings: s.warnings, steps: working(sol, u, qu, sig), equivalents: equivalents(sol, u) };
  }
  /* t and T in seconds and Julian years, for orientation only */
  function equivalents(sol, u) {
    var d = unitDef(u), s = d[3], out = [];
    [['Elapsed time', sol.t], ['Half-life', sol.T]].forEach(function (r) { if (isFinite(r[1])) out.push({ label: r[0], seconds: r[1] * s, years: r[1] * s / YEAR_S }); });
    return out;
  }

  /* ---------- exports ---------- */
  function rows(r) {
    var s = r.sol, Q = r.quantityUnit, F = function (v) { return fmt(v, r.sig); }, P = function (f) { return f === 0 ? '\u2248 0%' : pct(f, r.sig); }, tl = function (v) { return timeLabel(r.timeUnit, v); }, per = 'per ' + perUnit(r.timeUnit);
    return [
      ['Initial quantity N0', F(s.N0), Q, s.N0], ['Remaining quantity Nt', F(s.Nt), Q, s.Nt], ['Decayed quantity', F(s.decQty), Q, s.decQty],
      ['Remaining percentage', P(s.remFrac), '', s.remFrac * 100], ['Decayed percentage', pct(s.decFrac, r.sig), '', s.decFrac * 100],
      ['Elapsed time t', F(s.t), tl(s.t), s.t], ['Half-life T1/2', F(s.T), tl(s.T), s.T], ['Half-lives elapsed n', F(s.n), '', s.n],
      ['Decay constant lambda', F(s.lambda), per, s.lambda], ['Mean lifetime tau', F(s.tau), tl(s.tau), s.tau]
    ];
  }
  function exportTxt(r) {
    var o = ['Elecmetric Half-Life Calculator, Mode 01 (solved for ' + { Nt: 'remaining quantity', N0: 'initial quantity', t: 'elapsed time', T: 'half-life' }[r.target] + ')', ''];
    rows(r).forEach(function (x) { o.push(x[0] + ': ' + x[1] + (x[2] ? ' ' + x[2] : '')); });
    o.push('');
    r.steps.forEach(function (s) { o.push(s.title.toUpperCase()); o.push(s.text); o.push(''); });
    r.warnings.forEach(function (w) { o.push('Note: ' + w.message); });
    o.push('Mathematical decay only. Not a radiation-safety, dosimetry or exposure assessment.');
    return o.join('\n');
  }
  function csvq(v) { v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  /* CSV carries full-precision numbers (no grouping, no rounding) so it can be read by a spreadsheet; an infinite value is written as the word infinity */
  function exportCsv(r) { return ['Quantity,Value,Unit'].concat(rows(r).map(function (x) { return [x[0], x[3] === Infinity ? 'infinity' : String(x[3]), x[2]].map(csvq).join(','); })).join('\r\n') + '\r\n'; }
  function exportJson(r) {
    var s = r.sol, inf = function (v) { return v === Infinity ? 'infinity' : v; };
    return JSON.stringify({ tool: 'Elecmetric Half-Life Calculator, Mode 01', solvedFor: r.target, timeUnit: r.timeUnit, quantityUnit: r.quantityUnit, initialQuantity: inf(s.N0), remainingQuantity: s.Nt, decayedQuantity: inf(s.decQty), remainingPercentage: s.remFrac * 100, decayedPercentage: s.decFrac * 100, elapsedTime: s.t, halfLife: inf(s.T), halfLivesElapsed: s.n, decayConstant: s.lambda, meanLifetime: inf(s.tau), warnings: r.warnings.map(function (w) { return w.code; }) }, null, 2);
  }

  var api = { LN2: LN2, TIME_UNITS: TIME_UNITS, TARGETS: TARGETS, FIELDS: FIELDS, isTimeUnit: isTimeUnit, timeLabel: timeLabel, parseNumber: parseNumber, fmt: fmt, lnRatio: lnRatio, remainingQuantity: remainingQuantity, initialQuantity: initialQuantity, elapsedTime: elapsedTime, halfLife: halfLife, solve: solve, run: run, exportTxt: exportTxt, exportCsv: exportCsv, exportJson: exportJson };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.HalfLife = api;
})(typeof window !== 'undefined' ? window : this);
