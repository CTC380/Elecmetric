/* Elecmetric Percent Error Calculator, Mode 02 (Signed Error Analysis). One file, no DOM, no floating point.
   A thin layer over tools/pe_engine.js (Mode 01), which stays unchanged, so the two modes can never disagree on the size of the error.
   Convention (BIPM VIM: measurement error = measured value minus reference value):
     signed error e = observed - reference;  signed percentage deviation = e / |reference| x 100  (the denominator is the SIZE of the reference)
   A reading above the reference is always positive and one below it negative, also when the reference is negative. A reference of 0 is refused.
   Adds: explicit + and - signs, the signed relative error, the correction (reference - observed) and the sign convention in the result.
   calc({ x: observed, y: reference, unit, places }) -> { ok, ... } | { ok: false, error } | { ok: false, empty: true, hint }
   Required by tests/pe_signed_test.js and inlined into calculators/signed-error-analysis/ by tools/pe_signed_page.js. */
(function (root) {
  'use strict';
  var isNode = typeof module !== 'undefined' && module.exports;
  var M1 = isNode ? require('./pe_engine.js') : root.PercentErrorMode01;
  var M = '\u2212';
  function zeroText(t) { return /^[0.]*$/.test(String(t).replace(/^\u2248 /, '')); }
  function plus(t) { return t.charAt(0) === '-' || t === '0' ? t : '+' + t; }
  function neg(t) { return t === '0' ? t : t.charAt(0) === '-' ? t.slice(1) : '-' + t; }
  function sg(t) { return t.charAt(0) === '-' ? '(' + t + ')' : t; }
  function withUnit(v, u) { return u ? v + (u === '%' || u.charAt(0) === '\u00b0' ? '' : ' ') + u : v; }
  function calc(o) {
    var r = M1.calc(o); if (!r.ok) return r;
    var u = r.unit, dir = r.dir, below = dir === 'below', sign = dir === 'equal' ? 0 : below ? -1 : 1;
    var se = plus(r.signed), ce = plus(neg(r.signed)), neg0 = below && !zeroText(r.text) ? '-' : dir === 'above' && !zeroText(r.text) ? '+' : '';
    var pctS = neg0 + r.text, shown = (r.exact ? '' : '\u2248 ') + pctS + '%';
    var relMag = r.rel.replace(/^\u2248 /, ''), relS = (zeroText(relMag) ? '' : below ? '-' : dir === 'above' ? '+' : '') + relMag; if (r.rel.charAt(0) === '\u2248') relS = '\u2248 ' + relS;
    var refNeg = r.reference.charAt(0) === '-', rd = refNeg ? '|' + r.reference.slice(1) + '|' : r.reference;
    var out = { ok: true, kind: 'signed', unit: u, observed: r.observed, reference: r.reference, signed: se, abs: r.abs, rel: relS, correction: ce, pct: pctS, absPct: r.text,
      num: r.num, den: r.den, sign: sign, exact: r.exact, text: r.text, dir: dir, places: r.places, x: r.observed, y: r.reference, big: shown,
      frac: (below ? '-' : '') + r.frac };
    out.formula = 'Signed deviation = (Observed ' + M + ' Reference) \u00f7 ' + (refNeg ? '|Reference|' : 'Reference') + ' \u00d7 100';
    out.subst = '(' + r.observed + ' ' + M + ' ' + sg(r.reference) + ') \u00f7 ' + rd + ' \u00d7 100 = ' + shown;
    out.sentence = dir === 'equal' ? 'An observed value of ' + withUnit(r.observed, u) + ' equals the reference ' + withUnit(r.reference, u) + ' (signed deviation 0%)'
      : 'An observed value of ' + withUnit(r.observed, u) + ' against a reference of ' + withUnit(r.reference, u) + ' has a signed deviation of ' + shown + ' (' + dir + ' the reference)';
    out.steps = [r.steps[0].replace(/\.$/, '') + ', keeping the sign. The signed error is ' + withUnit(se, u) + '.',
      dir === 'equal' ? 'The sign is zero: the observed value equals the reference.' : 'The sign gives the direction: ' + (below ? 'negative, so the observed value is below the reference.' : 'positive, so the observed value is above the reference.'),
      r.steps[2].replace('. This is the relative error; it is negative when the reading is below the reference.', '. This is the signed relative error.'),
      r.steps[3].split('%. ')[0] + '%. The signed percentage deviation is ' + shown + '.',
      r.steps[4]];
    out.steps.push(dir === 'equal' ? 'The observed value equals the reference, so no correction is needed.' : 'The observed value is ' + withUnit(r.abs, u) + ' ' + dir + ' the reference, a deviation of ' + shown + '. To bring it back to the reference, apply a correction of ' + withUnit(ce, u) + '.');
    out.rows = [
      ['Observed value', withUnit(r.observed, u), 'The reading, test result or calculated value being checked'],
      ['Reference value', withUnit(r.reference, u), 'The accepted, rated, nominal or true value. The base of the percentage'],
      ['Signed error', withUnit(se, u), 'Observed ' + M + ' reference. Positive above the reference, negative below it'],
      ['Absolute error', withUnit(r.abs, u), 'The size of the signed error'],
      ['Signed relative error', relS, 'Signed error \u00f7 |reference|: a plain ratio that keeps the sign'],
      ['Signed percentage deviation', shown, r.exact ? 'Exact. The signed relative error \u00d7 100' : 'Rounded: the exact value is ' + out.frac + '%'],
      ['Measurement direction', dir === 'equal' ? 'Equal to reference' : dir === 'above' ? 'Above reference' : 'Below reference', 'Set by the sign of the signed error'],
      ['Correction (reference ' + M + ' observed)', withUnit(ce, u), 'The opposite sign to the signed error: what to add to the observed value to reach the reference'],
      ['Sign convention', 'Observed ' + M + ' reference', 'Divided by the size of the reference, so a reading above the reference is always positive']];
    if (!r.exact) out.rows.splice(6, 0, ['Exact value as a fraction', out.frac + '%', '']);
    out.warnings = r.warnings.slice();
    return out;
  }
  var api = { calc: calc, HINT: M1.HINT };
  if (isNode) module.exports = api; else root.PercentErrorMode02 = api;
})(typeof window !== 'undefined' ? window : this);
