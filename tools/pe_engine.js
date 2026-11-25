/* Elecmetric Percent Error Calculator, Mode 01 (Absolute Percent Error). One file, no DOM, no floating point.
   A thin layer over tools/percent_error_engine.js (exact rational arithmetic, kind 'err'), which stays unchanged. This layer adds what the standalone
   measurement tool needs: the observed value comes first, an optional unit label, the result table in the order of the product brief
   (observed, reference, signed error, absolute error, relative error magnitude, percentage error, measurement direction), and observed-value wording.
   calc({ x: observed, y: reference, unit, places }) -> { ok, ... } | { ok: false, error } | { ok: false, empty: true, hint }
   The unit is a label only: nothing is converted, and both values are taken to be in the same unit. A reference of 0 is refused.
   Required by tests/pe_test.js and inlined into calculators/percent-error-calculator/ by tools/pe_page.js. */
(function (root) {
  'use strict';
  var isNode = typeof module !== 'undefined' && module.exports;
  var PE = isNode ? require('./percent_error_engine.js') : root.PercentError, P = isNode ? require('./percent_engine.js') : root.Percent;
  var HINT = 'Enter the observed (measured) value and the reference (accepted) value.';
  function ren(s) { return String(s).replace(/Measured/g, 'Observed').replace(/measured/g, 'observed'); }
  function unitOf(u) {
    if (u === undefined || u === null) return { ok: true, text: '' };
    var t = String(u).trim();
    if (t.length > 16) return { ok: false, error: 'The unit label can be at most 16 characters, for example V, A, kW, \u03a9 or lx.' };
    if (/[\u0000-\u001f\u007f<>]/.test(t)) return { ok: false, error: 'The unit label can contain letters, digits and symbols such as \u03a9, \u00b5, \u00b0, % and /, but not control characters, < or >.' };
    return { ok: true, text: t };
  }
  function withUnit(v, u) { return u ? v + (u === '%' || u.charAt(0) === '\u00b0' ? '' : ' ') + u : v; }
  function stripSign(t) { return String(t).replace(/^[-\u2212]/, ''); }
  function termDigits(d) { var t = d, a = 0, b = 0; while (t % 2n === 0n) { t /= 2n; a++; } while (t % 5n === 0n) { t /= 5n; b++; } return t === 1n ? Math.max(a, b) : -1; }
  /* The relative error magnitude as a plain ratio: the percentage divided by 100. Exact decimal when it ends (up to 40 places), otherwise 8 places with an approximate sign. */
  function ratio(num, den) {
    var q = P.make(BigInt(num), BigInt(den) * 100n), k = termDigits(q.d);
    return k >= 0 && k <= 40 ? P.roundText(q, k) : '\u2248 ' + P.roundText(q, 8);
  }
  function find(rows, re) { for (var i = 0; i < rows.length; i++) if (re.test(rows[i][0])) return rows[i]; return null; }
  function calc(o) {
    o = o || {};
    var un = unitOf(o.unit); if (!un.ok) return { ok: false, error: un.error, empty: false };
    var u = un.text;
    var r = PE.calc({ kind: 'err', x: o.y, y: o.x, z: '', places: o.places });
    if (!r.ok) { if (r.empty) return { ok: false, empty: true, error: '', hint: HINT }; return { ok: false, empty: false, error: ren(r.error) }; }
    var rows = r.rows, eRow = find(rows, /^Error \(measured/), aRow = find(rows, /^Absolute error/), rRow = find(rows, /^Relative error/), sRow = find(rows, /^Signed deviation/);
    var obs = r.y, ref = r.x, signed = eRow[1], abs = aRow[1], rel = ratio(r.num, r.den);
    var dirWord = r.dir === 'equal' ? 'Equal to reference' : r.dir === 'above' ? 'Above reference' : 'Below reference';
    var out = {
      ok: true, kind: 'abs', unit: u, observed: obs, reference: ref, signed: signed, abs: abs, rel: rel, pct: r.text, pctUnit: '%',
      num: r.num, den: r.den, exact: r.exact, text: r.text, frac: r.frac, dir: r.dir, places: r.places,
      big: r.big, x: obs, y: ref
    };
    out.formula = ren(r.formula); out.subst = ren(r.subst);
    var shown = (r.exact ? '' : '\u2248 ') + r.text + '%';
    out.sentence = r.dir === 'equal' ? 'An observed value of ' + withUnit(obs, u) + ' equals the reference ' + withUnit(ref, u) + ' (0% error)'
      : 'An observed value of ' + withUnit(obs, u) + ' against a reference of ' + withUnit(ref, u) + ' is ' + shown + ' ' + r.dir + ' the reference';
    out.steps = r.steps.map(ren);
    out.steps.push('The error is ' + withUnit(abs, u) + ' ' + r.dir + ' the reference ' + withUnit(ref, u) + (r.dir === 'equal' ? '' : ', which is ' + shown + ' of the size of the reference') + '.');
    out.rows = [
      ['Observed value', withUnit(obs, u), 'The reading, test result or calculated value being checked'],
      ['Reference value', withUnit(ref, u), 'The accepted, rated, nominal or true value. The base of the percentage'],
      ['Signed error', withUnit(signed, u), 'Observed \u2212 reference. Positive above the reference, negative below it'],
      ['Absolute error', withUnit(abs, u), 'The size of the error, in the unit of the values'],
      ['Relative error magnitude', rel, 'The absolute error divided by the size of the reference: a plain ratio'],
      ['Percentage error', r.big, r.exact ? 'Exact. The relative error magnitude \u00d7 100' : 'Rounded: the exact value is ' + r.frac + '%'],
      ['Measurement direction', dirWord, r.dir === 'equal' ? 'No error' : 'Signed deviation ' + sRow[1] + ' (negative below the reference)']
    ];
    if (!r.exact) out.rows.splice(6, 0, ['Exact value as a fraction', r.frac + '%', '']);
    out.warnings = r.warnings.map(ren);
    return out;
  }
  var api = { calc: calc, HINT: HINT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PercentErrorMode01 = api;
})(typeof window !== 'undefined' ? window : this);
