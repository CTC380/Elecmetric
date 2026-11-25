/* Elecmetric Half-Life Calculator, Mode 03: remaining and decayed percentage calculator. Engine: one file, no DOM.
   Required by tests/halflife_percent_test.js and inlined (after tools/halflife_engine.js) into calculators/decay-percentage-calculator/index.html by tools/halflife_percent_page.js.

   From an elapsed time t and a half-life T (and, optionally, an initial quantity N0) it gives
       n = t / T                      half-lives elapsed
       remaining fraction  f = 2^(-n)           remaining quantity  Nt = N0 f
       decayed fraction    1 - f                decayed quantity    N0 - Nt = N0 (1 - f)
   t and T may be given in different time units; t is converted to the unit of T by the exact ratio of the two units (Julian year = 365.25 days), and
   the ratio is exactly 1 when both units are the same, so the textbook cases stay exact (100 g after three half-lives is exactly 12.5 g).
   The initial quantity is optional: without it the page gives percentages only. The quantity unit is a label; nothing is converted.

   Numerical policy: 2^(-n) is Math.pow(2, -n) (exact for whole n); the decayed fraction is -expm1(-ln 2 n) for n < 0.5, which keeps full precision for a
   tiny decay (1e-300 of a half-life decays 6.9e-301, not 0), and 1 - f otherwise; a remaining fraction below the smallest double underflows to exactly 0 and
   is reported as an underflow warning, never as an exact zero; a value that cannot be represented is refused with the field named. Errors are returned, never thrown.
   SCOPE: mathematical decay only. Not a radiation-safety, dosimetry or exposure assessment (CEO decision 8). */
(function (root) {
  'use strict';
  var H = (typeof module !== 'undefined' && module.exports) ? require('./halflife_engine.js') : root.HalfLife;
  var LN2 = Math.LN2, MIN_NORMAL = 2.2250738585072014e-308, fmt = H.fmt, timeLabel = H.timeLabel;
  var FIELDS = ['N0', 't', 'T'], NAMES = { N0: 'Initial quantity', t: 'Elapsed time', T: 'Half-life' };
  /* the cut-offs shown in the milestone table: the percentage left, and the whole-number halvings in the ladder */
  var MILESTONES = [90, 75, 50, 25, 10, 5, 1, 0.1];
  function unitDef(u) { for (var i = 0; i < H.TIME_UNITS.length; i++) if (H.TIME_UNITS[i][0] === u) return H.TIME_UNITS[i]; return null; }
  function perUnit(u) { var d = unitDef(u); return d ? d[4] : String(u); }
  function pow2neg(n) { return n >= 1075 ? 0 : Math.pow(2, -n); }
  function decayedFraction(n, rem) { return n < 0.5 ? -Math.expm1(-LN2 * n) : 1 - rem; }

  /* the exact ratio (seconds in unit a) / (seconds in unit b); 1 when the units are the same */
  function unitRatio(a, b) { return a === b ? 1 : unitDef(a)[3] / unitDef(b)[3]; }
  /* the number of half-lives in t, with t and T in different units allowed */
  function halfLivesElapsed(t, T, tUnit, hUnit) { return (tUnit === hUnit ? t : t * unitRatio(tUnit, hUnit)) / T; }
  function remainingFraction(n) { return pow2neg(n); }

  /* time to fall to a given fraction left, in the unit of T: T x log2(1 / fraction) */
  function timeToFraction(T, fraction) { return T * Math.log2(1 / fraction); }

  /* ---------- the public run() used by the page and the tests ---------- */
  /* input: { N0 (optional), t, T (strings or numbers), timeUnit (of t), halfLifeUnit ('same' or a unit, of T), quantityUnit, sig } */
  function run(input) {
    input = input || {};
    var tu = input.timeUnit === undefined || input.timeUnit === '' ? 'yr' : input.timeUnit, hu = input.halfLifeUnit === undefined || input.halfLifeUnit === '' || input.halfLifeUnit === 'same' ? tu : input.halfLifeUnit;
    var qu = String(input.quantityUnit || '').trim().slice(0, 16), sig = input.sig === undefined ? 6 : input.sig, i, p, f, vals = {}, blanks = [];
    if (!H.isTimeUnit(tu)) return { ok: false, error: 'Unknown time unit \u201c' + tu + '\u201d.' };
    if (!H.isTimeUnit(hu)) return { ok: false, error: 'Unknown time unit \u201c' + hu + '\u201d.' };
    for (i = 0; i < FIELDS.length; i++) {
      f = FIELDS[i]; p = H.parseNumber(input[f]);
      if (p.error) return { ok: false, error: NAMES[f] + ': ' + p.error, field: f };
      if (p.empty) blanks.push(f); else vals[f] = p.value;
    }
    if (blanks.length === FIELDS.length) return { ok: false, empty: true, error: '' };
    if (vals.t === undefined || vals.T === undefined) return { ok: false, partial: true, error: 'Enter the ' + (vals.t === undefined && vals.T === undefined ? 'elapsed time and the half-life' : vals.t === undefined ? 'elapsed time' : 'half-life') + ' to see the percentages.', field: vals.t === undefined ? 't' : 'T' };
    var hasQty = vals.N0 !== undefined, N0 = vals.N0, t = vals.t, T = vals.T;
    if (hasQty && !(N0 > 0)) return { ok: false, error: N0 === 0 ? 'Initial quantity must be greater than zero: a percentage of nothing is undefined. Leave it empty to see percentages only.' : 'Initial quantity must be greater than zero.', field: 'N0' };
    if (t < 0) return { ok: false, error: 'Elapsed time cannot be negative.', field: 't' };
    if (!(T > 0)) return { ok: false, error: 'Half-life must be greater than zero.', field: 'T' };
    var k = unitRatio(tu, hu), tInH = tu === hu ? t : t * k, n = tInH / T;
    if (!isFinite(tInH) || !isFinite(n)) return { ok: false, error: 'The number of half-lives is outside the range of a double-precision number. Use a closer time unit or a larger half-life.', field: 't' };
    var warnings = [], rem = remainingFraction(n), dec = decayedFraction(n, rem);
    if (t > 0 && n === 0) warnings.push({ code: 'TIME_UNDERFLOW', message: 'The elapsed time is so small next to the half-life that it rounds to zero half-lives, so the decayed fraction shows as 0. It is not exactly zero.' });
    if (rem === 0) warnings.push({ code: 'UNDERFLOW_TO_ZERO', message: 'The remaining fraction is smaller than the smallest number a double can hold (about 5 \u00d7 10\u207b\u00b3\u00b2\u2074), so it shows as 0%. It is not exactly zero.' });
    else if (rem < MIN_NORMAL) warnings.push({ code: 'SUBNORMAL', message: 'The remaining fraction is smaller than the smallest normal double-precision number (about 2.2 \u00d7 10\u207b\u00b3\u2070\u2078), so it carries fewer significant digits.' });
    var remQty = hasQty ? N0 * rem : undefined, decQty = hasQty ? N0 * dec : undefined;
    if (hasQty && rem > 0 && remQty === 0) warnings.push({ code: 'QUANTITY_UNDERFLOW', message: 'The remaining quantity is smaller than the smallest number a double can hold, so it shows as 0. It is not exactly zero.' });
    if (hasQty && !isFinite(decQty)) return { ok: false, error: 'The decayed quantity is outside the range of a double-precision number.', field: 'N0' };
    var whole = n < 1075 ? Math.floor(n) : null, lambda = LN2 / T, tau = T / LN2;
    var sol = { N0: N0, t: t, T: T, hasQty: hasQty, n: n, tInH: tInH, k: k, remFrac: rem, decFrac: dec, remQty: remQty, decQty: decQty, whole: whole, wholeIsN: whole !== null && whole === n, lambda: lambda, tau: tau };
    /* independent check: the fractions add to 1, and f agrees with exp(-ln 2 n), a different route from 2^(-n) */
    var c1 = Math.abs(rem + dec - 1), c2 = n < 700 && rem > 1e-300 ? Math.abs(Math.exp(-LN2 * n) - rem) / rem : 0;
    var check = { sum: rem + dec, err: Math.max(c1, c2), ok: Math.max(c1, c2) <= 1e-12 };
    var out = { ok: true, sol: sol, timeUnit: tu, halfLifeUnit: hu, quantityUnit: qu, sig: sig, warnings: warnings, check: check, milestones: milestones(T), ladder: ladder(sol, n) };
    out.equivalents = equivalents(sol, tu, hu);
    out.steps = working(out);
    return out;
  }
  /* elapsed time and half-life in seconds and Julian years, for orientation only */
  function equivalents(sol, tu, hu) {
    var YEAR_S = 365.25 * 86400, o = [];
    [['Elapsed time', sol.t, tu], ['Half-life', sol.T, hu]].forEach(function (r) { var sec = r[1] * unitDef(r[2])[3]; if (isFinite(sec)) o.push({ label: r[0], seconds: sec, years: sec / YEAR_S }); });
    return o;
  }
  /* when the quantity has fallen to 90%, 75%, 50% ... of its start, in the unit of T (does not depend on t) */
  function milestones(T) {
    var o = []; MILESTONES.forEach(function (pc) { var h = Math.log2(100 / pc), tm = T * h; if (isFinite(tm)) o.push({ percent: pc, halfLives: h, time: tm }); });
    return o;
  }
  /* the halving ladder: 0 to max(5, ceil(n)) half-lives, at most 10 */
  function ladder(sol, n) {
    var top = Math.min(10, Math.max(5, Math.ceil(isFinite(n) ? n : 5))), o = [], j;
    for (j = 0; j <= top; j++) { var fr = pow2neg(j); o.push({ k: j, frac: fr, qty: sol.hasQty ? sol.N0 * fr : undefined, time: sol.T * j, current: j === n }); }
    return o;
  }

  /* ---------- the written working (plain Unicode text) ---------- */
  function working(r) {
    var s = r.sol, sig = r.sig, Q = r.quantityUnit ? '\u00a0' + r.quantityUnit : '', F = function (v) { return fmt(v, sig); }, P = function (fr) { return fr === 0 ? '\u2248 0%' : fmt(fr * 100, sig) + '%'; };
    var tt = F(s.t) + '\u00a0' + timeLabel(r.timeUnit, s.t), TT = F(s.T) + '\u00a0' + timeLabel(r.halfLifeUnit, s.T), steps = [];
    steps.push({ title: 'The decay law', text: 'N\u209c = N\u2080 \u00d7 2^(\u2212t / T\u00bd)\nfraction remaining f = N\u209c / N\u2080 = 2^(\u2212n), where n = t / T\u00bd is the number of half-lives elapsed\nfraction decayed = 1 \u2212 f' });
    var conv = '';
    if (r.timeUnit !== r.halfLifeUnit) conv = 'The elapsed time and the half-life are in different units, so t is first put into the unit of the half-life:\n1 ' + perUnit(r.timeUnit) + ' = ' + F(s.k) + ' ' + timeLabel(r.halfLifeUnit, s.k) + '\nt = ' + tt + ' \u00d7 ' + F(s.k) + ' = ' + F(s.tInH) + '\u00a0' + timeLabel(r.halfLifeUnit, s.tInH) + '\n';
    steps.push({ title: 'Half-lives elapsed', text: conv + 'n = t / T\u00bd = ' + F(s.tInH) + '\u00a0' + timeLabel(r.halfLifeUnit, s.tInH) + ' / ' + TT + ' = ' + F(s.n) + (s.wholeIsN && s.n > 0 && s.n <= 64 ? '   (the quantity has been halved ' + F(s.n) + (s.n === 1 ? ' time)' : ' times)') : '') });
    steps.push({ title: 'Fraction remaining', text: 'f = 2^(\u2212n) = 2^(\u2212' + F(s.n) + ') = ' + (s.remFrac === 0 ? '\u2248 0 (below the smallest double)' : F(s.remFrac)) + ' = ' + P(s.remFrac) + (s.wholeIsN && s.n >= 1 && s.n <= 53 ? '\n= 1 / ' + fmt(Math.pow(2, s.n), 12) + ' of the original' : (s.whole !== null && s.whole >= 1 && s.whole <= 53 ? '\n(' + F(s.whole) + ' whole half-life' + (s.whole === 1 ? '' : 's') + ' and ' + F(s.n - s.whole) + ' of the next)' : '')) });
    steps.push({ title: 'Fraction decayed', text: 'decayed = 1 \u2212 f = 1 \u2212 ' + (s.remFrac === 0 ? '0' : F(s.remFrac)) + ' = ' + P(s.decFrac) });
    if (s.hasQty) steps.push({ title: 'Quantities', text: 'N\u209c = N\u2080 \u00d7 f = ' + F(s.N0) + Q + ' \u00d7 ' + (s.remFrac === 0 ? '0' : F(s.remFrac)) + ' = ' + F(s.remQty) + Q + '\ndecayed quantity = N\u2080 \u00d7 (1 \u2212 f) = ' + F(s.N0) + Q + ' \u00d7 ' + F(s.decFrac) + ' = ' + F(s.decQty) + Q });
    else steps.push({ title: 'Quantities', text: 'No initial quantity was entered, so only percentages are given. Enter N\u2080 to see the remaining and decayed quantities.' });
    steps.push({ title: 'Decay constant and mean lifetime', text: '\u03bb = ln 2 / T\u00bd = 0.693147 / ' + TT + ' = ' + F(s.lambda) + ' per ' + perUnit(r.halfLifeUnit) + '\n\u03c4 = 1 / \u03bb = T\u00bd / ln 2 = ' + F(s.tau) + '\u00a0' + timeLabel(r.halfLifeUnit, s.tau) });
    steps.push({ title: 'Check', text: 'remaining + decayed = ' + fmt(r.check.sum, 15) + ' (should be 1), and f agrees with e^(\u2212n ln 2); ' + (r.check.ok ? 'they agree to better than 1 part in 10\u00b9\u00b2.' : 'they differ by a relative ' + r.check.err.toExponential(2) + '. Report this.') });
    return steps;
  }

  /* ---------- exports ---------- */
  function rows(r) {
    var s = r.sol, Q = r.quantityUnit, F = function (v) { return fmt(v, r.sig); }, P = function (fr) { return fr === 0 ? '\u2248 0%' : fmt(fr * 100, r.sig) + '%'; }, tl = function (v, u) { return timeLabel(u, v); };
    var o = [];
    if (s.hasQty) o.push(['Initial quantity N0', F(s.N0), Q, s.N0], ['Remaining quantity Nt', F(s.remQty), Q, s.remQty], ['Decayed quantity', F(s.decQty), Q, s.decQty]);
    o.push(['Remaining percentage', P(s.remFrac), '', s.remFrac * 100], ['Decayed percentage', P(s.decFrac), '', s.decFrac * 100], ['Half-lives elapsed n', F(s.n), '', s.n], ['Elapsed time t', F(s.t), tl(s.t, r.timeUnit), s.t], ['Half-life T1/2', F(s.T), tl(s.T, r.halfLifeUnit), s.T], ['Decay constant lambda', F(s.lambda), 'per ' + perUnit(r.halfLifeUnit), s.lambda], ['Mean lifetime tau', F(s.tau), tl(s.tau, r.halfLifeUnit), s.tau]);
    return o;
  }
  function exportTxt(r) {
    var o = ['Elecmetric Half-Life Calculator, Mode 03 (remaining and decayed percentage)', ''];
    rows(r).forEach(function (x) { o.push(x[0] + ': ' + x[1] + (x[2] ? ' ' + x[2] : '')); });
    o.push('');
    r.steps.forEach(function (s) { o.push(s.title.toUpperCase()); o.push(s.text); o.push(''); });
    r.warnings.forEach(function (w) { o.push('Note: ' + w.message); });
    o.push('Mathematical decay only. Not a radiation-safety, dosimetry or exposure assessment.');
    return o.join('\n');
  }
  function csvq(v) { v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function exportCsv(r) { return ['Quantity,Value,Unit'].concat(rows(r).map(function (x) { return [x[0], String(x[3]), x[2] === '' && /percentage/.test(x[0]) ? 'percent' : x[2]].map(csvq).join(','); })).join('\r\n') + '\r\n'; }
  function exportJson(r) {
    var s = r.sol, j = { tool: 'Elecmetric Half-Life Calculator, Mode 03', elapsedTime: s.t, elapsedTimeUnit: r.timeUnit, halfLife: s.T, halfLifeUnit: r.halfLifeUnit, halfLivesElapsed: s.n, remainingPercentage: s.remFrac * 100, decayedPercentage: s.decFrac * 100, decayConstant: s.lambda, meanLifetime: s.tau, warnings: r.warnings.map(function (w) { return w.code; }) };
    if (s.hasQty) { j.quantityUnit = r.quantityUnit; j.initialQuantity = s.N0; j.remainingQuantity = s.remQty; j.decayedQuantity = s.decQty; }
    return JSON.stringify(j, null, 2);
  }

  var api = { LN2: LN2, FIELDS: FIELDS, NAMES: NAMES, MILESTONES: MILESTONES, unitRatio: unitRatio, halfLivesElapsed: halfLivesElapsed, remainingFraction: remainingFraction, decayedFraction: decayedFraction, timeToFraction: timeToFraction, run: run, exportTxt: exportTxt, exportCsv: exportCsv, exportJson: exportJson };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.HalfLifePercent = api;
})(typeof window !== 'undefined' ? window : this);
