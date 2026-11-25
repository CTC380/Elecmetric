/* Elecmetric Percentage Calculator: exact rational engine for Mode 04 (Percentage Error). One file, no DOM, no floating point.
   Built only on the public API of tools/percent_engine.js (parseNum, make, fmt, roundText), so Modes 01 to 03 are untouched. Three questions:
     err  percentage error of a measured value M against a reference R = |M - R| / |R| x 100            (R = 0 refused)
          also the signed deviation (M - R) / |R| x 100, the relative error, the accuracy, and an optional tolerance (+/- % of R)
     val  the measured value for a reference R and a signed percentage error p: M = R + |R| x p / 100    (R = 0 refused)
     ref  the reference for a measured value M and a signed percentage error p: R = M / (1 + p / 100) for M > 0, M / (1 - p / 100) for M < 0
          (the reference is taken to have the same sign as M; M = 0 refused)
   Required by tests/percent_error_test.js and inlined into calculators/percentage-error-calculator/ by tools/percent_error_page.js. */
(function (root) {
  'use strict';
  var P = (typeof module !== 'undefined' && module.exports) ? require('./percent_engine.js') : root.Percent;
  var mk = P.make;
  function Err(m) { this.message = m; }
  function abs(x) { return x < 0n ? -x : x; }
  function add(a, b) { return mk(a.n * b.d + b.n * a.d, a.d * b.d); }
  function sub(a, b) { return mk(a.n * b.d - b.n * a.d, a.d * b.d); }
  function mul(a, b) { return mk(a.n * b.n, a.d * b.d); }
  function div(a, b) { return mk(a.n * b.d, a.d * b.n); }
  function qa(a) { return { n: abs(a.n), d: a.d }; }
  var HUNDRED = { n: 100n, d: 1n }, TWO = { n: 2n, d: 1n }, ONE = { n: 1n, d: 1n };
  function termDigits(d) { var t = d, a = 0, b = 0; while (t % 2n === 0n) { t /= 2n; a++; } while (t % 5n === 0n) { t /= 5n; b++; } return t === 1n ? Math.max(a, b) : -1; }
  function F(q) { return q.d === 1n ? String(q.n) : q.n + '/' + q.d; }
  function dv(q) { var k = termDigits(q.d); return k >= 0 && k <= 40 ? P.roundText(q, k) : F(q); }
  function sg(t) { return t.charAt(0) === '-' ? '(' + t + ')' : t; }
  function pc(t) { return t + '%'; }
  function dvp(q) { var k = termDigits(q.d); return k >= 0 && k <= 40 ? P.roundText(q, k) + '%' : '\u2248 ' + P.roundText(q, 6) + '%'; }
  function dvm(q) { var k = termDigits(q.d); return k >= 0 && k <= 40 ? P.roundText(q, k) : '\u2248 ' + P.roundText(q, 6); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function opt(places) { if (places === undefined || places === null || places === '' || places === 'auto') return 'auto'; var p = Number(places); if (!(p >= 0 && p <= P.MAX_PLACES && Math.floor(p) === p)) throw new Err('Decimal places must be a whole number from 0 to ' + P.MAX_PLACES + ', or auto.'); return p; }
  function fail(e) { if (e && typeof e.message === 'string' && !(e instanceof Error)) return { ok: false, error: e.message, empty: false }; throw e; }
  function emptyR(hint) { return { ok: false, empty: true, error: '', hint: hint }; }
  function finish(base, q, places, unit) {
    var f = P.fmt(q, places);
    base.ok = true; base.num = String(q.n); base.den = String(q.d); base.exact = f.exact; base.text = f.text; base.unit = unit || ''; base.frac = F(q); base.places = places;
    base.big = (f.exact ? '' : '\u2248 ') + f.text + (unit || '');
    return base;
  }
  function shownPct(q, places) { var f = P.fmt(q, places); return (f.exact ? '' : '\u2248 ') + f.text + '%'; }
  var KINDS = ['err', 'val', 'ref'];
  var LAB = { err: ['The reference value', 'The measured value', 'The tolerance'], val: ['The reference value', 'The percentage error'], ref: ['The measured value', 'The percentage error'] };
  var HINT = { err: 'Enter the reference value and the measured value.', val: 'Enter the reference value and the percentage error, for example -2.5 for a reading 2.5% low.', ref: 'Enter the measured value and the percentage error, for example 2.5 for a reading 2.5% high.' };
  var UNIT = { err: '%', val: '', ref: '' };

  function calc(o) {
    try {
      o = o || {}; var kind = o.kind, places = opt(o.places);
      if (KINDS.indexOf(kind) < 0) throw new Err('Choose one of the three questions.');
      var X = P.parseNum(o.x, LAB[kind][0], {}), Y = P.parseNum(o.y, LAB[kind][1], { pct: kind !== 'err' });
      if (X.empty || Y.empty) return emptyR(HINT[kind]);
      var x = X.q, y = Y.q, xt = X.text, yt = Y.text, steps = [], rows = [], warn = [], res, r;
      if (kind === 'err') {
        var Z = P.parseNum(o.z, LAB.err[2], { pct: true }), t = Z.empty ? null : Z.q;
        var R = x, M = y, aR = qa(R), rneg = R.n < 0n;
        if (R.n === 0n) throw new Err('The reference value is 0, so a percentage error is not defined: the error is a share of the reference, and nothing is a share of 0. Enter the reference value, or use the amount of the error instead.');
        if (t && t.n < 0n) throw new Err('The tolerance cannot be negative. Enter its size, for example 2 for a tolerance of \u00b12%.');
        var e = sub(M, R), ae = qa(e), rel = div(e, aR), pe = mul(rel, HUNDRED), ape = qa(pe), up = e.n > 0n, zero = e.n === 0n;
        var dir = zero ? 'equal' : up ? 'above' : 'below', rd = rneg ? '|' + xt.replace('-', '') + '|' : xt;
        steps.push('Find the error: measured \u2212 reference = ' + sg(yt) + ' \u2212 ' + sg(xt) + ' = ' + dv(e) + '.');
        steps.push('Take its size, the absolute error: |' + dv(e) + '| = ' + dv(ae) + '.');
        steps.push('Divide the error by the ' + (rneg ? 'size of the reference' : 'reference') + ': ' + sg(dv(e)) + ' \u00f7 ' + rd + ' = ' + dv(rel) + '. This is the relative error; it is negative when the reading is below the reference.');
        steps.push('Multiply by 100: ' + sg(dv(rel)) + ' \u00d7 100 = ' + dv(pe) + '%. ' + (zero ? 'The measured value equals the reference.' : 'The measured value is ' + dv(ape) + '% ' + dir + ' the reference, so the percentage error is ' + dv(ape) + '%.'));
        steps.push('Check: reference + ' + sg(dv(pe)) + '% of ' + (rneg ? 'its size ' : '') + rd + ' = ' + dv(add(R, mul(aR, div(pe, HUNDRED)))) + ', the measured value you entered.');
        var within = null, lo = null, hi = null;
        if (t) {
          lo = sub(R, mul(aR, div(t, HUNDRED))); hi = add(R, mul(aR, div(t, HUNDRED))); within = ape.n * t.d <= t.n * ape.d;
          steps.push('Tolerance: \u00b1' + dv(t) + '% of ' + (rneg ? 'the size of ' : '') + 'the reference allows ' + dv(lo) + ' to ' + dv(hi) + '. The error of ' + dv(ape) + '% is ' + (within ? 'within' : 'outside') + ' the tolerance of ' + dv(t) + '%.');
        }
        res = finish({ kind: kind, formula: rneg ? 'Percentage error = |Measured \u2212 Reference| \u00f7 |Reference| \u00d7 100' : 'Percentage error = |Measured \u2212 Reference| \u00f7 Reference \u00d7 100', subst: '|' + yt + ' \u2212 ' + sg(xt) + '| \u00f7 ' + rd + ' \u00d7 100 = ' + dv(ape) + '%' }, ape, places, '%');
        res.dir = dir; res.within = within; res.tolFlag = within === null ? '' : within ? 'within tolerance' : 'outside tolerance';
        var shown = shownPct(ape, places), tolS = t ? ', ' + (within ? 'within' : 'outside') + ' the \u00b1' + dv(t) + '% tolerance' : '';
        res.sentence = zero ? 'A measured value of ' + yt + ' equals the reference ' + xt + ' (0% error)' + tolS : 'A measured value of ' + yt + ' against a reference of ' + xt + ' is ' + shown + ' ' + (up ? 'above' : 'below') + ' the reference' + tolS;
        rows.push(['Reference value', xt, '']); rows.push(['Measured value', yt, '']);
        rows.push(['Error (measured \u2212 reference)', dv(e), up ? 'Positive: the reading is above the reference' : zero ? 'No error' : 'Negative: the reading is below the reference']);
        rows.push(['Absolute error', dv(ae), 'The size of the error, in the unit of the values']);
        rows.push(['Relative error (error \u00f7 |reference|)', dv(rel), 'A plain ratio, not yet a percentage']);
        rows.push(['Percentage error', res.big, res.exact ? 'Exact. The size of the error as a percentage of the reference' : 'Rounded: the exact value is ' + F(ape) + '%']);
        if (ape.d !== 1n) rows.push(['Exact value as a fraction', F(ape) + '%', '']);
        rows.push(['Signed deviation', dvp(pe), 'Positive above the reference, negative below it']);
        rows.push(['Direction', cap(dir), '']);
        rows.push(['Accuracy (100% \u2212 percentage error)', ape.n <= 100n * ape.d ? dvp(sub(HUNDRED, ape)) : 'not meaningful', ape.n <= 100n * ape.d ? 'Only meaningful while the error is 100% or less' : 'The error is more than 100% of the reference']);
        if (t) {
          rows.push(['Tolerance (\u00b1% of the reference)', pc(dv(t)), '']); rows.push(['Permitted range', dv(lo) + ' to ' + dv(hi), 'Reference \u00b1 tolerance']);
          rows.push(['Within tolerance', within ? 'Yes' : 'No', '']);
          rows.push(['Margin to the limit', dvm(qa(sub(t, ape))) + ' percentage points ' + (within ? 'spare' : 'over'), within ? (ape.n * t.d === t.n * ape.d ? 'Exactly on the limit' : 'Room left before the limit') : 'By how much the error passes the limit']);
        }
        rows.push(['Measured as a percentage of the reference', dvp(mul(div(M, R), HUNDRED)), 'Measured \u00f7 reference \u00d7 100']);
        rows.push(['Percentage difference (no reference)', dvp(mul(div(ae, div(add(qa(M), aR), TWO)), HUNDRED)), 'Treats the two values equally. This is the Mode 03 question, a different one']);
        rows.push(['Error as a share of the measured value', M.n === 0n ? 'not defined' : dvp(mul(div(ae, qa(M)), HUNDRED)), 'Divides by the reading instead of the reference, so it is not the percentage error']);
        if (rneg) warn.push('The reference value is negative, so the error is divided by its size. That way a reading above the reference always has a positive deviation. Check that this suits your data.');
        if ((R.n > 0n && M.n < 0n) || (R.n < 0n && M.n > 0n)) warn.push('The reference and the measured value have opposite signs, so the error is larger than the reference itself.');
        else if (M.n === 0n) warn.push('The measured value is 0, so the error is the whole reference: 100% below it.');
        else if (ape.n > 100n * ape.d) warn.push('The error is larger than the reference value itself. Check that the reference is the value you meant.');
      } else if (kind === 'val') {
        var Rv = x, p = y, aRv = qa(Rv), rneg2 = Rv.n < 0n, rd2 = rneg2 ? '|' + xt.replace('-', '') + '|' : xt;
        if (Rv.n === 0n) throw new Err('The reference value is 0, so a percentage error from it is not defined: any error would be an infinite percentage of 0. Enter the reference value, or work with the amount of error instead.');
        var ev = mul(aRv, div(p, HUNDRED)), Mv = add(Rv, ev), upv = p.n > 0n, zv = p.n === 0n, dirv = zv ? 'equal' : upv ? 'above' : 'below';
        steps.push('Find the error as a share of the ' + (rneg2 ? 'size of the reference' : 'reference') + ': ' + sg(yt) + '% of ' + rd2 + ' = ' + sg(yt) + ' \u00f7 100 \u00d7 ' + rd2 + ' = ' + dv(ev) + '.');
        steps.push('Add the error to the reference (a negative percentage error lowers it): ' + sg(xt) + ' + ' + sg(dv(ev)) + ' = ' + dv(Mv) + '.');
        steps.push('Check: (' + dv(Mv) + ' \u2212 ' + sg(xt) + ') \u00f7 ' + rd2 + ' \u00d7 100 = ' + dv(mul(div(sub(Mv, Rv), aRv), HUNDRED)) + '%, the percentage error you entered.');
        res = finish({ kind: kind, formula: 'Measured = Reference + (Percentage error \u00f7 100) \u00d7 ' + (rneg2 ? '|Reference|' : 'Reference'), subst: sg(xt) + ' + (' + sg(yt) + ' \u00f7 100) \u00d7 ' + rd2 + ' = ' + dv(Mv) }, Mv, places, '');
        res.dir = dirv; res.within = null; res.tolFlag = '';
        res.sentence = zv ? 'A reading with no error equals the reference ' + xt : 'A reading ' + dv(qa(p)) + '% ' + dirv + ' a reference of ' + xt + ' is ' + (res.exact ? '' : '\u2248 ') + res.text;
        rows.push(['Reference value', xt, '']); rows.push(['Percentage error (signed)', pc(yt), 'Positive above the reference, negative below it']);
        rows.push(['Error (measured \u2212 reference)', dv(ev), zv ? 'No error' : upv ? 'Positive: the reading is above the reference' : 'Negative: the reading is below the reference']);
        rows.push(['Absolute error', dv(qa(ev)), 'The size of the error']);
        rows.push(['Measured value', res.big, res.exact ? 'Exact' : 'Rounded: the exact value is ' + F(Mv)]);
        rows.push(['Direction', cap(dirv), '']);
        rows.push(['Measured as a percentage of the reference', dvp(mul(div(Mv, Rv), HUNDRED)), 'Measured \u00f7 reference \u00d7 100']);
        if (rneg2) warn.push('The reference value is negative, so the error is taken from its size: a positive percentage error moves the reading up, towards zero.');
        if (Mv.n === 0n) warn.push('This percentage error makes the measured value exactly 0.');
        else if ((Rv.n > 0n && Mv.n < 0n) || (Rv.n < 0n && Mv.n > 0n)) warn.push('This percentage error puts the measured value on the other side of zero from the reference. Check the size and the sign of the percentage error.');
      } else {
        var Mr = x, pr = y, sM = Mr.n > 0n ? 1n : -1n;
        if (Mr.n === 0n) throw new Err('The measured value is 0, so the reference cannot be found from a percentage error: the reference would have to be a value whose error is exactly the whole of it. Enter a measured value that is not 0.');
        var den = add(ONE, mul(div(pr, HUNDRED), { n: sM, d: 1n }));
        if (den.n <= 0n) throw new Err('A percentage error of ' + yt + '% would put the measured value at 0 or on the opposite side of zero from its reference, which does not fit this measured value. Check the sign of the percentage error: negative means the reading is below the reference.');
        var Rr = div(Mr, den), er = sub(Mr, Rr), upr = er.n > 0n, zr = er.n === 0n, dirr = zr ? 'equal' : upr ? 'above' : 'below', mneg = sM < 0n, aRr = qa(Rr);
        var pm = mneg ? ' \u2212 ' : ' + ';
        steps.push('Write the measured value as the reference plus its error: measured = reference ' + (mneg ? '\u2212' : '+') + ' (percentage error \u00f7 100) \u00d7 reference, so measured = reference \u00d7 (1' + pm + sg(yt) + ' \u00f7 100).');
        steps.push('Work out the bracket: 1' + pm + sg(yt) + ' \u00f7 100 = ' + dv(den) + '.');
        steps.push('Divide the measured value by the bracket: ' + xt.replace(/^-/, '\u2212') + ' \u00f7 ' + dv(den) + ' = ' + dv(Rr) + '. The reference is taken to have the same sign as the measured value.');
        steps.push('Check: (' + sg(xt) + ' \u2212 ' + sg(dv(Rr)) + ') \u00f7 ' + (mneg ? '|' + dv(Rr).replace('-', '') + '|' : dv(Rr)) + ' \u00d7 100 = ' + dv(mul(div(er, aRr), HUNDRED)) + '%, the percentage error you entered.');
        res = finish({ kind: kind, formula: mneg ? 'Reference = Measured \u00f7 (1 \u2212 Percentage error \u00f7 100)   (measured value below zero)' : 'Reference = Measured \u00f7 (1 + Percentage error \u00f7 100)', subst: sg(xt) + ' \u00f7 (1' + pm + sg(yt) + ' \u00f7 100) = ' + dv(Rr) }, Rr, places, '');
        res.dir = dirr; res.within = null; res.tolFlag = '';
        res.sentence = zr ? 'A reading of ' + xt + ' with no error has the reference ' + xt : 'A reading of ' + xt + ' that is ' + dv(qa(pr)) + '% ' + dirr + ' its reference means the reference is ' + (res.exact ? '' : '\u2248 ') + res.text;
        rows.push(['Measured value', xt, '']); rows.push(['Percentage error (signed)', pc(yt), 'Positive above the reference, negative below it']);
        rows.push(['Reference value', res.big, (res.exact ? 'Exact' : 'Rounded: the exact value is ' + F(Rr)) + '. Taken to have the same sign as the measured value']);
        rows.push(['Error (measured \u2212 reference)', dv(er), zr ? 'No error' : upr ? 'Positive: the reading is above the reference' : 'Negative: the reading is below the reference']);
        rows.push(['Absolute error', dv(qa(er)), 'The size of the error']);
        rows.push(['Direction', cap(dirr), '']);
        rows.push(['Measured as a percentage of the reference', dvp(mul(div(Mr, Rr), HUNDRED)), 'Measured \u00f7 reference \u00d7 100']);
        if (mneg) warn.push('The measured value is negative, so the reference is taken to be negative too and the percentage error is measured from its size.');
      }
      res.steps = steps; res.rows = rows; res.warnings = warn; res.x = xt; res.y = yt;
      return res;
    } catch (e) { return fail(e); }
  }

  var api = { calc: calc, KINDS: KINDS, LABELS: LAB, UNITS: UNIT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PercentError = api;
})(typeof window !== 'undefined' ? window : this);
