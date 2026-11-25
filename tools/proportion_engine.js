/* Elecmetric Ratio Calculator: exact engine for Mode 02 (Proportion Solver).
   Solves A : B = C : D for the one missing term, or checks whether four given terms form a proportion.
   Every term is an exact rational number (BigInt numerator and denominator) read by the Quadratic parser: whole numbers, decimals, scientific notation,
   fractions a/b and mixed numbers such as 2 1/2. Terms must be zero or positive, as in Mode 01.
   The proportion A : B = C : D holds when the cross products are equal, A x D = B x C, and neither ratio is 0 : 0.
   For the unknown term X, with M its partner in the same ratio, N the other term of the other ratio and P the term opposite X in the cross product,
   X x P = M x N. P not 0 gives X = M x N / P (and X = 0 with M = 0 is refused, because M : X would be 0 : 0). P = 0 gives no solution, or, when M = 0 as well,
   every non-zero X.
   Works in Node (module.exports) and in the browser (global Proportion, after Quad and Ratio). */
(function (root) {
  'use strict';
  var Q = typeof require === 'function' && typeof module !== 'undefined' ? require('./quad_engine.js') : root.Quad;
  var Rt = typeof require === 'function' && typeof module !== 'undefined' ? require('./ratio_engine.js') : root.Ratio;
  var R = Q.R, O = Q.ops, rs = Q.rs;
  var L = ['A', 'B', 'C', 'D'], OPP = [3, 2, 1, 0];

  function fail(msg, idx) { return { ok: false, error: msg, termIndex: idx === undefined ? -1 : idx }; }
  function hint(msg) { return { ok: false, empty: true, error: msg, hint: msg }; }
  function isBlank(s) { s = String(s === undefined || s === null ? '' : s).trim(); return s === '' || /^(x|\?|_)$/i.test(s); }
  function dec(q, places) { return Rt.dec(q, places); }
  function lead(d) { return d.exact ? '' : '\u2248 '; }
  /* simplest whole-number form of the pair, computed here (not through the text parser, so a result longer than 60 digits is still reduced) */
  function simplestOf(qa, qb) {
    var g0 = Q.gcd, L2 = qa.d / g0(qa.d, qb.d) * qb.d, wa = qa.n * (L2 / qa.d), wb = qb.n * (L2 / qb.d), g = g0(wa, wb);
    return { ratioText: String(wa / g) + ' : ' + String(wb / g) };
  }
  function isInt(q) { return q.d === 1n; }
  /* share of the first term in the total of the pair, in basis points (0 to 10000), for the ratio bar; null when both terms are 0 */
  function bp(qa, qb) { var sm = O.add(qa, qb); if (O.isZero(sm)) return null; return Number(qa.n * sm.d * 10000n / (qa.d * sm.n)); }
  function bars(q) { var x = bp(q[0], q[1]), y = bp(q[2], q[3]); return x === null || y === null ? null : [[x, 10000 - x], [y, 10000 - y]]; }

  function readTerms(input) {
    var T = [], u = [], i, bad = null;
    for (i = 0; i < 4; i++) {
      var raw = input[L[i].toLowerCase()];
      raw = String(raw === undefined || raw === null ? '' : raw).trim();
      if (isBlank(raw)) { T.push({ text: 'x', q: null }); u.push(i); continue; }
      var p = Q.parseNum(raw);
      if (p.error) { bad = bad || fail('Term ' + L[i] + ' \u201c' + raw + '\u201d: ' + String(p.error).replace(/^Enter a value\.$/, 'Enter a number.'), i); T.push({ text: raw, q: null }); continue; }
      if (O.sgn(p.v) < 0) { bad = bad || fail('Proportion terms cannot be negative: term ' + L[i] + ' is ' + Q.mn(raw) + '. A ratio compares sizes of like quantities, so enter each size as a positive number (or 0).', i); T.push({ text: raw, q: null }); continue; }
      T.push({ text: raw, q: p.v });
    }
    return { T: T, unknown: u, bad: bad };
  }

  function solve(input) {
    input = input || {};
    var places = input.places === undefined || input.places === '' || input.places === 'auto' ? 'auto' : Number(input.places);
    if (places !== 'auto' && (!isFinite(places) || places !== Math.floor(places) || places < 0 || places > 12)) return fail('Decimal places must be a whole number from 0 to 12, or Automatic.');
    var rd = readTerms(input);
    if (rd.bad) return rd.bad;
    var T = rd.T, unk = rd.unknown;
    if (unk.length > 1) return hint('Enter three of the four terms and leave one blank (or type x) to solve for it. Enter all four to check whether they form a proportion.');
    var allInt = T.every(function (t) { return t.q === null || isInt(t.q); });
    var Z = function (i) { return O.isZero(T[i].q); };
    var u = unk.length ? unk[0] : -1, i;

    /* a ratio of two zeros is not a ratio: check every pair that is fully known */
    if (u !== 0 && u !== 1 && Z(0) && Z(1)) return fail('Terms A and B are both 0. A ratio of 0 : 0 is not defined, so it cannot be one side of a proportion.', 0);
    if (u !== 2 && u !== 3 && Z(2) && Z(3)) return fail('Terms C and D are both 0. A ratio of 0 : 0 is not defined, so it cannot be one side of a proportion.', 2);

    var disp = function (k) { return k === u ? 'x' : T[k].text; };
    var propText = function (v) { return (v === undefined ? [0, 1, 2, 3].map(disp) : [0, 1, 2, 3].map(function (k) { return k === u ? v : rs(T[k].q); })); };
    var line = function (a) { return a[0] + ' : ' + a[1] + ' = ' + a[2] + ' : ' + a[3]; };
    var steps = [], verify = [], ok = true, notes = [], warnings = [], rows = [];
    function chk(label, v) { verify.push([label, !!v]); if (!v) ok = false; }
    var termRows = T.map(function (t, k) { return { term: L[k], entered: k === u ? 'x (to find)' : t.text, asFraction: k === u ? '\u2014' : rs(t.q) }; });
    steps.push('Write the proportion' + (u >= 0 ? ' with x for the missing term (term ' + L[u] + ')' : '') + ': ' + line(propText()) + '.');
    if (!allInt) steps.push('Decimals, fractions and mixed numbers are read exactly: ' + T.filter(function (t) { return t.q !== null && !isInt(t.q); }).map(function (t) { return t.text + ' = ' + rs(t.q); }).join('; ') + '.');
    steps.push('In a proportion the cross products are equal: A \u00d7 D = B \u00d7 C. Here that is ' + disp(0) + ' \u00d7 ' + disp(3) + ' = ' + disp(1) + ' \u00d7 ' + disp(2) + '.');
    notes.push('A proportion says two ratios are equal. It is solved by cross multiplication, because A : B = C : D is the same statement as A \u00d7 D = B \u00d7 C. Mode 01 simplifies each side; this mode finds the term that makes them equal.');

    /* ---------------- all four given: is it a proportion? ---------------- */
    if (u < 0) {
      var cl = O.mul(T[0].q, T[3].q), cr = O.mul(T[1].q, T[2].q), holds = O.eq(cl, cr);
      steps.push('Multiply: A \u00d7 D = ' + T[0].text + ' \u00d7 ' + T[3].text + ' = ' + rs(cl) + ' and B \u00d7 C = ' + T[1].text + ' \u00d7 ' + T[2].text + ' = ' + rs(cr) + '.');
      var s1 = simplestOf(T[0].q, T[1].q), s2 = simplestOf(T[2].q, T[3].q);
      steps.push(holds ? 'The two cross products are equal, so ' + line(T.map(function (t) { return t.text; })) + ' is a true proportion.' : 'The two cross products are different, so ' + line(T.map(function (t) { return t.text; })) + ' is not a proportion: the two ratios are not equal.');
      steps.push('Simplest forms: ' + T[0].text + ' : ' + T[1].text + ' simplifies to ' + s1.ratioText + (holds ? ', and ' : ', but ') + T[2].text + ' : ' + T[3].text + ' simplifies to ' + s2.ratioText + (holds ? '. They match.' : '. They are different.'));
      rows.push(['Result', holds ? 'A true proportion' : 'Not a proportion', holds ? 'The cross products agree' : 'The cross products differ']);
      rows.push(['Cross product A \u00d7 D', rs(cl), T[0].text + ' \u00d7 ' + T[3].text]);
      rows.push(['Cross product B \u00d7 C', rs(cr), T[1].text + ' \u00d7 ' + T[2].text]);
      rows.push(['Simplest form of A : B', s1.ratioText, 'Order of the terms kept']);
      rows.push(['Simplest form of C : D', s2.ratioText, 'Order of the terms kept']);
      var sug = null;
      if (!holds && !Z(0)) { var dFix = O.div(O.mul(T[1].q, T[2].q), T[0].q); if (!(Z(2) && O.isZero(dFix))) sug = dFix; }
      if (sug) { var ds = dec(sug, places); rows.push(['To make it a proportion', 'D = ' + rs(sug) + (isInt(sug) ? '' : ' (' + lead(ds) + ds.text + ')'), 'Keeping A, B and C as entered (B \u00d7 C \u00f7 A)']); }
      chk('A \u00d7 D and B \u00d7 C are compared as exact whole-number products: ' + rs(cl) + ' and ' + rs(cr), true);
      chk('A : B and C : D simplify to the same ratio exactly when the cross products are equal', (s1.ratioText === s2.ratioText) === holds);
      chk('Neither ratio is 0 : 0', !(Z(0) && Z(1)) && !(Z(2) && Z(3)));
      var kk = null; if (holds) { kk = !Z(0) ? O.div(T[2].q, T[0].q) : O.div(T[3].q, T[1].q); chk('Every term of C : D is ' + rs(kk) + ' times the matching term of A : B', O.eq(O.mul(kk, T[0].q), T[2].q) && O.eq(O.mul(kk, T[1].q), T[3].q)); }
      if (!allInt) warnings.push('Decimals and fractions are read exactly, so no rounding decides the answer.');
      var sentence0 = line(T.map(function (t) { return t.text; })) + (holds ? ' is a true proportion' : ' is not a proportion');
      var sm0 = ['Proportion: ' + line(T.map(function (t) { return t.text; })), holds ? 'Result: a true proportion' : 'Result: not a proportion', 'Cross products: A x D = ' + rs(cl) + ', B x C = ' + rs(cr), 'Simplest forms: ' + s1.ratioText + ' and ' + s2.ratioText];
      if (kk) sm0.push('Scale factor: C : D is ' + rs(kk) + ' times A : B');
      return { ok: true, status: holds ? 'holds' : 'fails', unknown: null, label: null, valueExact: null, valueText: holds ? 'True proportion' : 'Not a proportion', valueSub: line(T.map(function (t) { return t.text; })), completed: T.map(function (t) { return t.text; }), completedText: line(T.map(function (t) { return t.text; })),
        sentence: sentence0, terms: termRows, rows: rows, steps: steps, verify: verify, verifyOk: ok, notes: notes, warnings: warnings, summary: sm0.join('\n'), places: places, left: s1.ratioText, right: s2.ratioText, bars: bars([T[0].q, T[1].q, T[2].q, T[3].q]), scale: kk ? rs(kk) : null, crossLeft: rs(cl), crossRight: rs(cr), allInteger: allInt };
    }

    /* ---------------- one term missing ---------------- */
    var partner = u < 2 ? 1 - u : 5 - u, oth = u < 2 ? [2, 3] : [0, 1], pI = OPP[u], nI = oth[0] === pI ? oth[1] : oth[0];
    var Mq = T[partner].q, Nq = T[nI].q, Pq = T[pI].q;
    var unkOnLeft = u === 0 || u === 3;
    var knownProd = O.mul(Mq, Nq);
    var sideA = disp(0) + ' \u00d7 ' + disp(3), sideB = disp(1) + ' \u00d7 ' + disp(2);
    var label = L[u];
    steps.push('Put the known terms into the cross product. The side without x is ' + (unkOnLeft ? 'B \u00d7 C' : 'A \u00d7 D') + ' = ' + (unkOnLeft ? sideB : sideA) + ' = ' + rs(knownProd) + '.');

    var status, X = null, valueText, valueSub = '', completed = null;
    if (!O.isZero(Pq)) {
      X = O.div(knownProd, Pq);
      steps.push('So ' + (unkOnLeft ? T[pI].text + ' \u00d7 x = ' + rs(knownProd) : rs(knownProd) + ' = ' + T[pI].text + ' \u00d7 x') + '. Divide both sides by ' + T[pI].text + ': x = ' + rs(knownProd) + ' \u00f7 ' + T[pI].text + ' = ' + rs(X) + '.');
      if (O.isZero(Mq) && O.isZero(X)) {
        status = 'none';
        steps.push('But then term ' + L[partner] + ' and term ' + label + ' would both be 0, and ' + (u < 2 ? 'A : B' : 'C : D') + ' = 0 : 0 is not a ratio. No value of ' + label + ' works.');
        valueText = 'No solution'; valueSub = 'x would be 0, which makes ' + (u < 2 ? 'A : B' : 'C : D') + ' equal to 0 : 0';
        rows.push(['Result', 'No solution', 'The only value that balances the cross products is 0, and 0 : 0 is not a ratio']);
      } else status = 'solved';
    } else if (O.isZero(Mq)) {
      status = 'any';
      steps.push('The side with x is 0 \u00d7 x = 0, and the other side is also ' + rs(knownProd) + ', so the equation holds for every x. The ratio ' + (u < 2 ? 'A : B' : 'C : D') + ' is 0 : x, which needs x to be non-zero.');
      valueText = 'Any non-zero value'; valueSub = 'The known terms do not fix ' + label;
      rows.push(['Result', 'Any non-zero value', 'Both ratios are 0 : something, so the proportion does not fix the missing term']);
    } else {
      status = 'none';
      steps.push('The side with x is ' + T[pI].text + ' \u00d7 x = 0 for every x, but the other side is ' + rs(knownProd) + ', which is not 0. The two sides can never be equal.');
      valueText = 'No solution'; valueSub = 'The cross products cannot be equal';
      rows.push(['Result', 'No solution', 'One side of the cross product is always 0 and the other is not']);
    }

    var q4s = null, s1b = null, s2b = null, kk2 = null, sentence, sm = [], crossL = null, crossR = null;
    if (status === 'solved') {
      var xd = dec(X, places);
      completed = propText(rs(X));
      var q4 = [0, 1, 2, 3].map(function (k) { return k === u ? X : T[k].q; }); q4s = q4;
      steps.push('Check by putting ' + rs(X) + ' back in: ' + line(completed) + '. A \u00d7 D = ' + rs(O.mul(q4[0], q4[3])) + ' and B \u00d7 C = ' + rs(O.mul(q4[1], q4[2])) + '.');
      s1b = simplestOf(q4[0], q4[1]); s2b = simplestOf(q4[2], q4[3]);
      steps.push('Simplest forms: ' + rs(q4[0]) + ' : ' + rs(q4[1]) + ' simplifies to ' + s1b.ratioText + ' and ' + rs(q4[2]) + ' : ' + rs(q4[3]) + ' simplifies to ' + s2b.ratioText + (s1b.ratioText === s2b.ratioText ? ', the same ratio.' : ', which differ.'));
      valueText = label + ' = ' + rs(X); valueSub = isInt(X) ? '' : lead(xd) + xd.text;
      kk2 = !O.isZero(q4[0]) ? O.div(q4[2], q4[0]) : O.div(q4[3], q4[1]);
      crossL = O.mul(q4[0], q4[3]); crossR = O.mul(q4[1], q4[2]);
      rows.push(['Missing term ' + label, rs(X), 'Exact value (' + rs(knownProd) + ' \u00f7 ' + T[pI].text + ')']);
      if (!isInt(X)) rows.push(['Decimal value', lead(xd) + xd.text, 'Missing term as a decimal']);
      rows.push(['Completed proportion', line(completed), 'Cross products agree: ' + rs(crossL) + ' = ' + rs(crossR)]);
      rows.push(['Simplest form', s1b.ratioText, 'Both sides reduce to this, order of the terms kept']);
      var kd = dec(kk2, places);
      rows.push(['Scale factor', '\u00d7 ' + rs(kk2) + (isInt(kk2) ? '' : ' (' + lead(kd) + kd.text + ')'), 'Each term of C : D is this multiple of the matching term of A : B']);
      if (!O.isZero(q4[1])) { var rv = O.div(q4[0], q4[1]), rvd = dec(rv, places); rows.push(['Ratio A / B', rs(rv) + (isInt(rv) ? '' : ' (' + lead(rvd) + rvd.text + ')'), 'Part to part, the value both ratios share']); }
      chk('Cross products are equal: A \u00d7 D = ' + rs(crossL) + ' and B \u00d7 C = ' + rs(crossR), O.eq(crossL, crossR));
      chk('A : B and C : D reduce to the same simplest ratio (' + s1b.ratioText + ')', s1b.ratioText === s2b.ratioText);
      chk('Every term of C : D is ' + rs(kk2) + ' times the matching term of A : B', O.eq(O.mul(kk2, q4[0]), q4[2]) && O.eq(O.mul(kk2, q4[1]), q4[3]));
      chk('Neither ratio is 0 : 0, and the missing term is not negative', !(O.isZero(q4[0]) && O.isZero(q4[1])) && !(O.isZero(q4[2]) && O.isZero(q4[3])) && O.sgn(X) >= 0);
      chk('The answer is unique: the term opposite x (' + T[pI].text + ') is not 0', !O.isZero(Pq));
      if (O.isZero(X)) warnings.push('The missing term is 0. That is a valid proportion only because the partner term is not 0.');
      if (!allInt) warnings.push('Decimals and fractions are read exactly, so 1.5 is held as 3/2 with no rounding.');
      sentence = line(completed); sm = ['Proportion: ' + line(propText()), 'Missing term ' + label + ' = ' + rs(X) + (isInt(X) ? '' : ' (' + lead(xd) + xd.text + ')'), 'Completed: ' + line(completed), 'Cross multiplication: ' + (unkOnLeft ? T[pI].text + ' x x = ' + rs(knownProd) : rs(knownProd) + ' = ' + T[pI].text + ' x x'), 'Simplest form: ' + s1b.ratioText, 'Scale factor: x ' + rs(kk2)];
    } else {
      chk('The cross-multiplication equation was formed from exact products', true);
      chk(status === 'any' ? 'The equation is 0 = 0 and the ratio needs the missing term to be non-zero' : 'No value of x makes both ratios valid and equal', true);
      sentence = status === 'any' ? 'any non-zero ' + label + ' works' : 'no solution';
      sm = ['Proportion: ' + line(propText()), status === 'any' ? 'Result: ' + label + ' can be any non-zero value' : 'Result: no solution'];
    }
    return { ok: true, status: status, unknown: label, unknownIndex: u, label: label, valueExact: status === 'solved' && X ? rs(X) : null, valueText: valueText, valueSub: valueSub, completed: completed, completedText: completed ? line(completed) : null, sentence: sentence,
      terms: termRows, rows: rows, steps: steps, verify: verify, verifyOk: ok, notes: notes, warnings: warnings, summary: sm.join('\n'), places: places,
      left: s1b ? s1b.ratioText : null, right: s2b ? s2b.ratioText : null, bars: status === 'solved' ? bars(q4s) : null, scale: kk2 ? rs(kk2) : null, crossLeft: crossL ? rs(crossL) : null, crossRight: crossR ? rs(crossR) : null, knownProduct: rs(knownProd), allInteger: allInt };
  }

  var api = { solve: solve, isBlank: isBlank, LABELS: L };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Proportion = api;
})(typeof self !== 'undefined' ? self : this);
