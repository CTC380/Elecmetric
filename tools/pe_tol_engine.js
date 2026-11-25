/* Elecmetric Percent Error Calculator, Mode 03 (Tolerance Verification). One file, no DOM, no floating point (exact BigInt rational arithmetic).
   Built on the public API of tools/percent_engine.js (reading numbers, rounding) and on Mode 02 (tools/pe_signed_engine.js, unchanged) for the signed deviation,
   so Modes 02 and 03 can never disagree on the size or sign of a deviation.
   Question: is an observed value within a tolerance that the user has entered around a reference value?
     basis 'pct': tolerance is a percentage of the SIZE of the reference (|reference|); basis 'abs': tolerance is a value in the unit of the readings.
     shape 'sym': one tolerance, plus and minus; shape 'asym': a lower tolerance (below the reference) and an upper tolerance (above it). Tolerances are entered as sizes, without a sign.
     lower limit L = reference - lower tolerance;  upper limit U = reference + upper tolerance;  the reading is accepted when L <= observed <= U (limits included).
     margin to the lower limit = observed - L;  margin to the upper limit = U - observed  (positive inside the limit, negative beyond it).
     tolerance used = |signed error| / (tolerance on that side of the reference) x 100.
   The tolerance is whatever the user entered. The engine does not know any standard, datasheet or acceptance criterion, ignores measurement uncertainty, and never says "compliant".
   A percentage tolerance needs a reference that is not 0; an absolute tolerance accepts a reference of 0 (the percentage deviation is then not defined and is not shown).
   calc({ x: observed, y: reference, unit, basis, shape, t, tl, tu, places }) -> { ok, ... } | { ok: false, error } | { ok: false, empty: true, hint }
   Required by tests/pe_tol_test.js and inlined into calculators/tolerance-verification/ by tools/pe_tol_page.js. */
(function (root) {
  'use strict';
  var isNode = typeof module !== 'undefined' && module.exports;
  var P = isNode ? require('./percent_engine.js') : root.Percent, M2 = isNode ? require('./pe_signed_engine.js') : root.PercentErrorMode02;
  var MN = '\u2212', HINT = 'Enter the observed value, the reference value and the tolerance.', HUNDRED = { n: 100n, d: 1n };
  function Err(m) { this.message = m; }
  var mk = P.make;
  function add(a, b) { return mk(a.n * b.d + b.n * a.d, a.d * b.d); }
  function sub(a, b) { return mk(a.n * b.d - b.n * a.d, a.d * b.d); }
  function mul(a, b) { return mk(a.n * b.n, a.d * b.d); }
  function div(a, b) { return mk(a.n * b.d, a.d * b.n); }
  function cmp(a, b) { var x = a.n * b.d, y = b.n * a.d; return x < y ? -1 : x > y ? 1 : 0; }
  function abs(a) { return a.n < 0n ? mk(-a.n, a.d) : a; }
  function zero(a) { return a.n === 0n; }
  function termDigits(d) { var t = d, a = 0, b = 0; while (t % 2n === 0n) { t /= 2n; a++; } while (t % 5n === 0n) { t /= 5n; b++; } return t === 1n ? Math.max(a, b) : -1; }
  function dec(q) { var k = termDigits(q.d); return k >= 0 ? P.roundText(q, k) : '\u2248 ' + P.roundText(q, 8); } // an exact decimal (every value built from decimals ends); the guard is for safety only
  function plus(t) { return t.charAt(0) === '-' || /^[0.]*$/.test(t) ? t : '+' + t; }
  function sg(t) { return t.charAt(0) === '-' ? '(' + t + ')' : t; }
  function withUnit(v, u) { return u ? v + (u === '%' || u.charAt(0) === '\u00b0' ? '' : ' ') + u : v; }
  function unitOf(u) {
    if (u === undefined || u === null) return '';
    var t = String(u).trim();
    if (t.length > 16) throw new Err('The unit label can be at most 16 characters, for example V, A, kW, \u03a9 or lx.');
    if (/[\u0000-\u001f\u007f<>]/.test(t)) throw new Err('The unit label can contain letters, digits and symbols such as \u03a9, \u00b5, \u00b0, % and /, but not control characters, < or >.');
    return t;
  }
  function pctText(q, places) { var f = P.fmt(q, places); return { text: f.text, exact: f.exact, shown: (f.exact ? '' : '\u2248 ') + f.text + '%' }; }
  function tolIn(src, label, pctOk) {
    var r = P.parseNum(src, label, { pct: pctOk });
    if (r.empty) return r;
    if (r.q.n < 0n) throw new Err(label + ' is the size of the permitted band, so enter it without a minus sign (for a lower tolerance of 3, enter 3 and not -3).');
    return r;
  }
  function run(o) {
    var u = unitOf(o.unit);
    var basis = o.basis === undefined || o.basis === null || o.basis === '' ? 'pct' : o.basis, shape = o.shape === undefined || o.shape === null || o.shape === '' ? 'sym' : o.shape;
    if (basis !== 'pct' && basis !== 'abs') throw new Err('The tolerance basis must be pct (percentage of the reference) or abs (absolute value).');
    if (shape !== 'sym' && shape !== 'asym') throw new Err('The tolerance shape must be sym (plus and minus the same) or asym (a lower and an upper tolerance).');
    P.fmt(mk(0n, 1n), o.places); // validates the decimal places
    var places = o.places === undefined || o.places === null || o.places === '' || o.places === 'auto' ? 'auto' : Number(o.places);
    var pc = basis === 'pct', obs = P.parseNum(o.x, 'The observed value'), ref = P.parseNum(o.y, 'The reference value'), tl, tu;
    if (shape === 'sym') { tl = tu = tolIn(o.t, 'The tolerance', pc); } else { tl = tolIn(o.tl, 'The lower tolerance', pc); tu = tolIn(o.tu, 'The upper tolerance', pc); }
    if (obs.empty || ref.empty || tl.empty || tu.empty) return { ok: false, empty: true, error: '', hint: HINT };
    var O = obs.q, R = ref.q, aR = abs(R), refZero = zero(R);
    if (pc && refZero) throw new Err('The reference value is 0, so a percentage tolerance has no size. Enter an absolute tolerance instead.');
    var TL = pc ? mul(mk(tl.q.n, tl.q.d * 100n), aR) : tl.q, TU = pc ? mul(mk(tu.q.n, tu.q.d * 100n), aR) : tu.q;
    var L = sub(R, TL), U = add(R, TU), e = sub(O, R), cl = cmp(O, L), cu = cmp(O, U);
    var status = cl < 0 ? 'below' : cu > 0 ? 'above' : 'within', pass = status === 'within', onLimit = pass && (cl === 0 || cu === 0);
    var mL = sub(O, L), mU = sub(U, O), side = cmp(mL, mU), nearest = side <= 0 ? mL : mU;
    var eSide = e.n > 0n ? TU : e.n < 0n ? TL : null, usedQ = null, used = null, usedExact = true;
    if (e.n === 0n) { used = '0%'; } else if (!zero(eSide)) { usedQ = mul(div(abs(e), eSide), HUNDRED); var ut = pctText(usedQ, places); used = ut.shown; usedExact = ut.exact; }
    var dev = null, devPct = null, devFrac = null, devExact = true, warnings = [];
    if (!refZero) {
      var d = M2.calc({ x: obs.text, y: ref.text, unit: u, places: places });
      if (!d.ok) throw new Err(d.error);
      dev = d.big; devPct = d.pct; devFrac = d.frac; devExact = d.exact; warnings = d.warnings.slice();
    }
    // wording of the tolerance and of the permitted deviation
    var sym = shape === 'sym', TLs = dec(TL), TUs = dec(TU), unitTol = function (t) { return withUnit(t, u); };
    var tolText = pc ? (sym ? '\u00b1' + tl.text + '%' : '-' + tl.text + '% / +' + tu.text + '%') : (sym ? '\u00b1' + unitTol(tl.text) : '-' + unitTol(tl.text) + ' / +' + unitTol(tu.text));
    var permitted = tolText;
    if (pc) permitted = tolText + ' of the reference';
    else if (!refZero) {
      var pl = pctText(mul(div(TL, aR), HUNDRED), places), pu = pctText(mul(div(TU, aR), HUNDRED), places), sd = function (x, s) { return (x.exact ? '' : '\u2248 ') + s + x.text + '%'; };
      permitted = (sym ? sd(pl, '\u00b1') : sd(pl, '-') + ' / ' + sd(pu, '+')) + ' of the reference';
    }
    var Ls = dec(L), Us = dec(U), es = plus(dec(e)), mLs = plus(dec(mL)), mUs = plus(dec(mU)), nearS = plus(dec(nearest));
    var label = status === 'within' ? 'Within the entered tolerance' + (onLimit ? ' (on a limit)' : '') : 'Outside the entered tolerance: ' + status + ' the ' + (status === 'above' ? 'upper' : 'lower') + ' limit';
    var nearWhich = side === 0 ? 'Equally close to both limits' : side < 0 ? 'Lower limit' : 'Upper limit';
    var range = withUnit(Ls, u) + ' to ' + withUnit(Us, u);
    var beyond = status === 'above' ? withUnit(dec(sub(O, U)), u) + ' above the upper limit ' + withUnit(Us, u) : status === 'below' ? withUnit(dec(sub(L, O)), u) + ' below the lower limit ' + withUnit(Ls, u) : '';
    var out = { ok: true, kind: 'tol', unit: u, observed: obs.text, reference: ref.text, basis: basis, shape: shape, lower: Ls, upper: Us, tolLower: TLs, tolUpper: TUs, signed: es, status: status, pass: pass, onLimit: onLimit,
      marginLower: mLs, marginUpper: mUs, nearest: nearS, used: used, usedExact: usedExact, usedNum: usedQ ? String(usedQ.n) : null, usedDen: usedQ ? String(usedQ.d) : null,
      dev: dev, devPct: devPct, devFrac: devFrac, devExact: devExact, exact: devExact && usedExact, places: places, x: obs.text, y: ref.text, big: label, label: label, tolText: tolText, permitted: permitted, range: range };
    var refTerm = R.n < 0n ? '|Reference|' : 'Reference';
    out.formula = pc ? (sym ? 'Limits = Reference \u00b1 ' + refTerm + ' \u00d7 Tolerance% \u00f7 100' : 'Lower limit = Reference ' + MN + ' ' + refTerm + ' \u00d7 Lower% \u00f7 100; upper limit = Reference + ' + refTerm + ' \u00d7 Upper% \u00f7 100')
      : (sym ? 'Limits = Reference \u00b1 Tolerance' : 'Lower limit = Reference ' + MN + ' Lower tolerance; upper limit = Reference + Upper tolerance');
    var rd = R.n < 0n ? '|' + ref.text.slice(1) + '|' : ref.text;
    out.subst = (pc ? (sym ? sg(ref.text) + ' \u00b1 ' + rd + ' \u00d7 ' + tl.text + ' \u00f7 100' : sg(ref.text) + ' ' + MN + ' ' + rd + ' \u00d7 ' + tl.text + ' \u00f7 100; ' + sg(ref.text) + ' + ' + rd + ' \u00d7 ' + tu.text + ' \u00f7 100')
      : (sym ? sg(ref.text) + ' \u00b1 ' + tl.text : sg(ref.text) + ' ' + MN + ' ' + tl.text + '; ' + sg(ref.text) + ' + ' + tu.text)) + ' = ' + range + '; ' + obs.text + (pass ? ' is inside' : ' is outside');
    out.sentence = 'An observed value of ' + withUnit(obs.text, u) + ' against a reference of ' + withUnit(ref.text, u) + ' with an entered tolerance of ' + tolText + ' (permitted range ' + range + ') is ' +
      (pass ? 'within the entered tolerance' + (onLimit ? ', on a limit' : '') : 'outside the entered tolerance: ' + beyond);
    var s2 = pc ? (sym ? 'The tolerance is ' + tl.text + '% of the ' + (R.n < 0n ? 'size of the reference' : 'reference') + ': ' + rd + ' \u00d7 ' + tl.text + ' \u00f7 100 = ' + withUnit(TLs, u) + ', in both directions.'
        : 'The lower tolerance is ' + rd + ' \u00d7 ' + tl.text + ' \u00f7 100 = ' + withUnit(TLs, u) + ' and the upper tolerance is ' + rd + ' \u00d7 ' + tu.text + ' \u00f7 100 = ' + withUnit(TUs, u) + '.')
      : (sym ? 'The tolerance is entered as an absolute value: ' + withUnit(TLs, u) + ' in both directions.' : 'The tolerances are entered as absolute values: ' + withUnit(TLs, u) + ' below the reference and ' + withUnit(TUs, u) + ' above it.');
    out.steps = ['The signed error is the observed value minus the reference: ' + sg(obs.text) + ' ' + MN + ' ' + sg(ref.text) + ' = ' + withUnit(es, u) + '.', s2,
      'The lower limit is ' + sg(ref.text) + ' ' + MN + ' ' + sg(TLs) + ' = ' + withUnit(Ls, u) + ' and the upper limit is ' + sg(ref.text) + ' + ' + sg(TUs) + ' = ' + withUnit(Us, u) + '. The permitted range is ' + range + '.',
      'Compare: ' + withUnit(Ls, u) + ' \u2264 ' + withUnit(obs.text, u) + ' \u2264 ' + withUnit(Us, u) + ' is ' + (pass ? 'true' : 'false') + ' (the limits are included), so the observed value is ' + (pass ? 'within the entered tolerance' + (onLimit ? ', on a limit' : '') + '.' : 'outside it: ' + beyond + '.'),
      refZero ? 'A percentage deviation is not defined because the reference is 0, so only the values in ' + (u || 'the unit of the readings') + ' are compared.' : 'The measured deviation is ' + sg(es) + ' \u00f7 ' + (R.n < 0n ? '|' + ref.text.slice(1) + '|' : ref.text) + ' \u00d7 100 = ' + dev + ' against a permitted deviation of ' + permitted + '.',
      'The margin to the lower limit is ' + withUnit(mLs, u) + ' and to the upper limit ' + withUnit(mUs, u) + ' (positive is inside the limit, negative is beyond it). ' +
        (e.n === 0n ? 'The observed value equals the reference, so none of the tolerance is used.' : used === null ? 'The tolerance on that side of the reference is 0, so any error on that side is beyond it.' : 'The error uses ' + used + ' of the tolerance on its side of the reference.')];
    out.rows = [
      ['Observed value', withUnit(obs.text, u), 'The reading, test result or calculated value being checked'],
      ['Reference value', withUnit(ref.text, u), 'The accepted, rated, nominal or true value the tolerance is set around'],
      ['Tolerance entered', (pc ? 'Percentage of reference: ' : 'Absolute: ') + tolText, 'A limit that you entered. It is not read from any standard or datasheet'],
      ['Permitted deviation', permitted, pc ? 'The percentage as entered' : 'The absolute tolerance expressed against the size of the reference'],
      ['Lower limit', withUnit(Ls, u), 'Reference ' + MN + ' lower tolerance'],
      ['Upper limit', withUnit(Us, u), 'Reference + upper tolerance'],
      ['Permitted range', range, 'Limits included: a value on a limit is accepted'],
      ['Signed error', withUnit(es, u), 'Observed ' + MN + ' reference. Positive above the reference, negative below it'],
      ['Measured deviation', dev === null ? 'Not defined' : dev, dev === null ? 'The reference is 0, so there is no percentage' : 'Signed error \u00f7 |reference| \u00d7 100, as in Mode 02'],
      ['Assessment', label, 'Against the tolerance entered above and nothing else'],
      ['Margin to lower limit', withUnit(mLs, u), 'Observed ' + MN + ' lower limit. Negative: below the lower limit'],
      ['Margin to upper limit', withUnit(mUs, u), 'Upper limit ' + MN + ' observed. Negative: above the upper limit'],
      ['Nearest limit', nearWhich + ', margin ' + withUnit(nearS, u), 'The smaller of the two margins'],
      ['Tolerance used', used === null ? 'Not defined' : used, used === null ? 'The tolerance on that side of the reference is 0' : 'Size of the error \u00f7 the tolerance on its side of the reference. Over 100% is outside'],
      ['Scope of this result', 'Entered tolerance only', 'Measurement uncertainty is not applied and no standard is checked']];
    if (!devExact) out.rows.splice(9, 0, ['Exact deviation as a fraction', devFrac + '%', '']);
    var extra = [];
    if (!refZero && cmp(L, mk(0n, 1n)) < 0 && cmp(U, mk(0n, 1n)) > 0) extra.push('The permitted range crosses zero, so readings with the opposite sign to the reference are also accepted.');
    if (zero(TL) || zero(TU)) extra.push('A tolerance of 0 accepts only a value equal to the reference on that side.');
    out.warnings = warnings.concat(extra);
    return out;
  }
  function calc(o) {
    try { return run(o || {}); } catch (e) { if (e && typeof e.message === 'string' && !(e instanceof Error)) return { ok: false, error: e.message, empty: false }; throw e; }
  }
  var api = { calc: calc, HINT: HINT };
  if (isNode) module.exports = api; else root.PercentErrorMode03 = api;
})(typeof window !== 'undefined' ? window : this);
