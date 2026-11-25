/* Elecmetric Half-Life Calculator, Mode 02: decay constant and mean lifetime converter. Engine: one file, no DOM.
   Required by tests/halflife_const_test.js and inlined (after tools/halflife_engine.js) into calculators/decay-constant-calculator/index.html by tools/halflife_const_page.js.

   The three numbers that describe one exponential decay are tied together by
       lambda = ln 2 / T          (decay constant, per unit time)
       tau    = 1 / lambda = T / ln 2   (mean lifetime)
       T      = tau x ln 2 = ln 2 / lambda   (half-life)
   Any one of them gives the other two. T and tau share ONE time unit and lambda is per that unit, so the consistency of units is structural (CEO decision 4).
   An optional "convert to" unit rescales all three together (T and tau multiply by the ratio of the units, lambda divides by it).

   Numerical policy: every value is one division or one multiplication from the value the user typed, so the result is correct to double precision; tau is taken
   from T / ln 2 and lambda from ln 2 / T directly (not by chaining 1 / lambda), so no result carries two roundings. A result that would overflow, or that is
   smaller than the smallest normal double (2.2250738585072014e-308), is refused or flagged, never shown as a silent wrong number.
   Errors are returned, never thrown, with the field that caused them. SCOPE: mathematical decay only (CEO decision 8). */
(function (root) {
  'use strict';
  var H = (typeof module !== 'undefined' && module.exports) ? require('./halflife_engine.js') : root.HalfLife;
  var LN2 = Math.LN2, MIN_NORMAL = 2.2250738585072014e-308;
  var FIELDS = ['T', 'lambda', 'tau'];
  var NAMES = { T: 'Half-life', lambda: 'Decay constant', tau: 'Mean lifetime' };
  var SYMS = { T: 'T\u00bd', lambda: '\u03bb', tau: '\u03c4' };
  var KNOWN = [['auto', 'Automatic (type one value)'], ['T', 'Half-life (T\u00bd)'], ['lambda', 'Decay constant (\u03bb)'], ['tau', 'Mean lifetime (\u03c4)']];
  var fmt = H.fmt, timeLabel = H.timeLabel;
  function unitDef(u) { for (var i = 0; i < H.TIME_UNITS.length; i++) if (H.TIME_UNITS[i][0] === u) return H.TIME_UNITS[i]; return null; }
  function perUnit(u) { var d = unitDef(u); return d ? d[4] : String(u); }
  function isClose(a, b, tol) { if (a === b) return true; if (!isFinite(a) || !isFinite(b)) return false; return Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b)) <= tol; }

  /* ---------- the six conversions ---------- */
  function decayConstantFromHalfLife(T) { return LN2 / T; }
  function halfLifeFromDecayConstant(l) { return LN2 / l; }
  function meanLifetimeFromDecayConstant(l) { return 1 / l; }
  function decayConstantFromMeanLifetime(tau) { return 1 / tau; }
  function meanLifetimeFromHalfLife(T) { return T / LN2; }
  function halfLifeFromMeanLifetime(tau) { return tau * LN2; }

  /* all three from one known value; returns { T, lambda, tau } */
  function from(src, v) {
    if (src === 'T') return { T: v, lambda: decayConstantFromHalfLife(v), tau: meanLifetimeFromHalfLife(v) };
    if (src === 'lambda') return { T: halfLifeFromDecayConstant(v), lambda: v, tau: meanLifetimeFromDecayConstant(v) };
    return { T: halfLifeFromMeanLifetime(v), lambda: decayConstantFromMeanLifetime(v), tau: v };
  }

  /* what the decay does over one unit of time, from the half-life (n = 1 / T half-lives per unit) */
  function perUnitFractions(T) {
    var n = 1 / T, rem = n >= 1075 ? 0 : Math.pow(2, -n), dec = n < 0.5 ? -Math.expm1(-LN2 * n) : 1 - rem;
    return { remaining: rem, decayed: dec };
  }
  /* fraction left after k mean lifetimes: e^(-k) */
  function afterMeanLifetimes(k) { return Math.exp(-k); }

  /* ---------- the public run() used by the page and the tests ---------- */
  /* input: { known:'auto'|'T'|'lambda'|'tau', T, lambda, tau (strings or numbers), timeUnit, outUnit ('same' or a unit), sig } */
  function run(input) {
    input = input || {};
    var u = input.timeUnit === undefined || input.timeUnit === '' ? 'yr' : input.timeUnit, sig = input.sig === undefined ? 6 : input.sig;
    if (!H.isTimeUnit(u)) return { ok: false, error: 'Unknown time unit \u201c' + u + '\u201d.' };
    var outU = input.outUnit === undefined || input.outUnit === '' || input.outUnit === 'same' ? u : input.outUnit;
    if (!H.isTimeUnit(outU)) return { ok: false, error: 'Unknown time unit \u201c' + outU + '\u201d.' };
    var known = input.known || 'auto', vals = {}, filled = [], i, p, f;
    if (known !== 'auto' && FIELDS.indexOf(known) < 0) return { ok: false, error: 'Unknown starting value.' };
    for (i = 0; i < FIELDS.length; i++) {
      f = FIELDS[i];
      if (known !== 'auto' && f !== known) continue; /* the fields being found are ignored, whatever they hold */
      p = H.parseNumber(input[f]);
      if (p.error) return { ok: false, error: NAMES[f] + ': ' + p.error, field: f };
      if (!p.empty) { vals[f] = p.value; filled.push(f); }
    }
    var src;
    if (known === 'auto') {
      if (filled.length === 0) return { ok: false, error: '', empty: true };
      src = filled[0]; /* priority: half-life, decay constant, mean lifetime */
    } else {
      if (filled.length === 0) return { ok: false, error: '', empty: true };
      src = known;
    }
    /* validation of every value that is used or compared */
    for (i = 0; i < filled.length; i++) {
      f = filled[i];
      if (!(vals[f] > 0)) return { ok: false, error: NAMES[f] + ' must be greater than zero.', field: f };
    }
    var sol = from(src, vals[src]), warnings = [];
    for (i = 0; i < FIELDS.length; i++) {
      f = FIELDS[i];
      if (!isFinite(sol[f]) || sol[f] <= 0) return { ok: false, error: 'The ' + NAMES[f].toLowerCase() + ' that follows from this ' + NAMES[src].toLowerCase() + ' is outside the range of a double-precision number. Use a different time unit.', field: src };
      if (sol[f] < MIN_NORMAL && sol[f] !== vals[f]) warnings.push({ code: 'SUBNORMAL', message: 'The ' + NAMES[f].toLowerCase() + ' is smaller than the smallest normal double-precision number (about 2.2 \u00d7 10\u207b\u00b3\u2070\u2078), so it carries fewer significant digits. Use a different time unit.' });
    }
    /* values typed alongside the one that is used must agree with it */
    if (known === 'auto') {
      filled.forEach(function (g) {
        if (g !== src && !isClose(sol[g], vals[g], 1e-9)) warnings.push({ code: 'INCONSISTENT_INPUTS', message: 'The ' + NAMES[g].toLowerCase() + ' you typed (' + fmt(vals[g], 10) + ') does not agree with the ' + NAMES[src].toLowerCase() + ' (it should be ' + fmt(sol[g], 10) + '); the ' + NAMES[src].toLowerCase() + ' was used.' });
      });
    }
    /* optional conversion of all three to another time unit */
    var conv = null;
    if (outU !== u) {
      var k = unitDef(u)[3] / unitDef(outU)[3];
      conv = { unit: outU, T: sol.T * k, lambda: sol.lambda / k, tau: sol.tau * k, factor: k };
      for (i = 0; i < FIELDS.length; i++) {
        f = FIELDS[i];
        if (!isFinite(conv[f]) || !(conv[f] > 0)) return { ok: false, error: 'The ' + NAMES[f].toLowerCase() + ' in ' + timeLabel(outU) + ' is outside the range of a double-precision number. Choose a closer time unit.', field: src };
        if (conv[f] < MIN_NORMAL) warnings.push({ code: 'SUBNORMAL', message: 'The ' + NAMES[f].toLowerCase() + ' in ' + timeLabel(outU) + ' is below the smallest normal double-precision number, so it carries fewer significant digits.' });
      }
    }
    var out = { ok: true, sol: sol, source: src, known: known, timeUnit: u, outUnit: outU, conv: conv, sig: sig, warnings: warnings, perUnit: perUnitFractions(sol.T), equivalents: equivalents(sol, u) };
    /* independent check: lambda x tau = 1 and lambda x T = ln 2, by a different route from the conversions above */
    var c1 = Math.abs(sol.lambda * sol.tau - 1), c2 = Math.abs(sol.lambda * sol.T - LN2) / LN2;
    out.check = { lt: sol.lambda * sol.tau, lT: sol.lambda * sol.T, err: Math.max(c1, c2), ok: Math.max(c1, c2) <= 1e-12 };
    out.steps = working(out);
    return out;
  }
  /* T, tau and lambda in seconds and Julian years, for orientation only */
  function equivalents(sol, u) {
    var s = unitDef(u)[3], YEAR_S = 365.25 * 86400, o = [];
    [['Half-life', sol.T], ['Mean lifetime', sol.tau]].forEach(function (r) { var sec = r[1] * s; if (isFinite(sec) && sec > 0) o.push({ label: r[0], seconds: sec, years: sec / YEAR_S }); });
    var ls = sol.lambda / s; if (isFinite(ls) && ls > 0) o.push({ label: 'Decay constant', perSecond: ls });
    return o;
  }

  /* ---------- the written working (plain Unicode text) ---------- */
  function working(r) {
    var s = r.sol, u = r.timeUnit, sig = r.sig, F = function (v) { return fmt(v, sig); }, FT = function (v) { return fmt(v, sig) + '\u00a0' + timeLabel(u, v); }, per = perUnit(u), steps = [];
    steps.push({ title: 'The relationships', text: '\u03bb = ln 2 / T\u00bd\n\u03c4 = 1 / \u03bb = T\u00bd / ln 2\nT\u00bd = \u03c4 \u00d7 ln 2 = ln 2 / \u03bb\nwhere ln 2 = 0.693147\u2026' });
    if (r.source === 'T') steps.push({ title: 'From the half-life', text: '\u03bb = ln 2 / T\u00bd = 0.693147 / ' + FT(s.T) + ' = ' + F(s.lambda) + ' per ' + per + '\n\u03c4 = T\u00bd / ln 2 = ' + FT(s.T) + ' / 0.693147 = ' + FT(s.tau) });
    else if (r.source === 'lambda') steps.push({ title: 'From the decay constant', text: 'T\u00bd = ln 2 / \u03bb = 0.693147 / ' + F(s.lambda) + ' per ' + per + ' = ' + FT(s.T) + '\n\u03c4 = 1 / \u03bb = 1 / ' + F(s.lambda) + ' per ' + per + ' = ' + FT(s.tau) });
    else steps.push({ title: 'From the mean lifetime', text: '\u03bb = 1 / \u03c4 = 1 / ' + FT(s.tau) + ' = ' + F(s.lambda) + ' per ' + per + '\nT\u00bd = \u03c4 \u00d7 ln 2 = ' + FT(s.tau) + ' \u00d7 0.693147 = ' + FT(s.T) });
    steps.push({ title: 'What the three numbers mean', text: 'After one half-life (' + FT(s.T) + ') 50% of the quantity is left.\nAfter one mean lifetime (' + FT(s.tau) + ') 1/e = ' + fmt(afterMeanLifetimes(1) * 100, sig) + '% is left.\nThe mean lifetime is ' + fmt(1 / LN2, sig) + ' half-lives long (\u03c4 / T\u00bd = 1 / ln 2).\nIn one ' + per + ' the quantity falls to ' + fmt(r.perUnit.remaining * 100, sig) + '% (' + fmt(r.perUnit.decayed * 100, sig) + '% decays).' });
    if (r.conv) steps.push({ title: 'Converted to ' + unitDef(r.conv.unit)[2], text: '1 ' + perUnit(u) + ' = ' + F(r.conv.factor) + ' ' + timeLabel(r.conv.unit, r.conv.factor) + '\nT\u00bd = ' + F(r.conv.T) + '\u00a0' + timeLabel(r.conv.unit, r.conv.T) + '\n\u03c4 = ' + F(r.conv.tau) + '\u00a0' + timeLabel(r.conv.unit, r.conv.tau) + '\n\u03bb = ' + F(r.conv.lambda) + ' per ' + perUnit(r.conv.unit) });
    steps.push({ title: 'Check', text: '\u03bb \u00d7 \u03c4 = ' + fmt(r.check.lt, 12) + ' (should be 1) and \u03bb \u00d7 T\u00bd = ' + fmt(r.check.lT, 12) + ' (should be ln 2 = 0.693147); ' + (r.check.ok ? 'they agree to better than 1 part in 10\u00b9\u00b2.' : 'they differ by a relative ' + r.check.err.toExponential(2) + '. Report this.') });
    return steps;
  }

  /* ---------- exports ---------- */
  function rows(r) {
    var s = r.sol, F = function (v) { return fmt(v, r.sig); }, tl = function (v) { return timeLabel(r.timeUnit, v); }, per = 'per ' + perUnit(r.timeUnit);
    var o = [['Half-life T1/2', F(s.T), tl(s.T), s.T], ['Decay constant lambda', F(s.lambda), per, s.lambda], ['Mean lifetime tau', F(s.tau), tl(s.tau), s.tau]];
    if (r.conv) { var c = r.conv, tc = function (v) { return timeLabel(c.unit, v); }; o.push(['Half-life T1/2 (converted)', F(c.T), tc(c.T), c.T], ['Decay constant lambda (converted)', F(c.lambda), 'per ' + perUnit(c.unit), c.lambda], ['Mean lifetime tau (converted)', F(c.tau), tc(c.tau), c.tau]); }
    return o;
  }
  function exportTxt(r) {
    var o = ['Elecmetric Half-Life Calculator, Mode 02 (decay constant and mean lifetime, from the ' + NAMES[r.source].toLowerCase() + ')', ''];
    rows(r).forEach(function (x) { o.push(x[0] + ': ' + x[1] + (x[2] ? ' ' + x[2] : '')); });
    o.push('');
    r.steps.forEach(function (s) { o.push(s.title.toUpperCase()); o.push(s.text); o.push(''); });
    r.warnings.forEach(function (w) { o.push('Note: ' + w.message); });
    o.push('Mathematical decay only. Not a radiation-safety, dosimetry or exposure assessment.');
    return o.join('\n');
  }
  function csvq(v) { v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function exportCsv(r) { return ['Quantity,Value,Unit'].concat(rows(r).map(function (x) { return [x[0], String(x[3]), x[2]].map(csvq).join(','); })).join('\r\n') + '\r\n'; }
  function exportJson(r) {
    var s = r.sol, j = { tool: 'Elecmetric Half-Life Calculator, Mode 02', startedFrom: r.source, timeUnit: r.timeUnit, halfLife: s.T, decayConstant: s.lambda, meanLifetime: s.tau, warnings: r.warnings.map(function (w) { return w.code; }) };
    if (r.conv) j.converted = { timeUnit: r.conv.unit, halfLife: r.conv.T, decayConstant: r.conv.lambda, meanLifetime: r.conv.tau };
    return JSON.stringify(j, null, 2);
  }

  var api = { LN2: LN2, FIELDS: FIELDS, NAMES: NAMES, SYMS: SYMS, KNOWN: KNOWN, decayConstantFromHalfLife: decayConstantFromHalfLife, halfLifeFromDecayConstant: halfLifeFromDecayConstant, meanLifetimeFromDecayConstant: meanLifetimeFromDecayConstant, decayConstantFromMeanLifetime: decayConstantFromMeanLifetime, meanLifetimeFromHalfLife: meanLifetimeFromHalfLife, halfLifeFromMeanLifetime: halfLifeFromMeanLifetime, from: from, perUnitFractions: perUnitFractions, afterMeanLifetimes: afterMeanLifetimes, run: run, exportTxt: exportTxt, exportCsv: exportCsv, exportJson: exportJson };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.HalfLifeConst = api;
})(typeof window !== 'undefined' ? window : this);
