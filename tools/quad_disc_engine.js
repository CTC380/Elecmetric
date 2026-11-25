/* Elecmetric Quadratic Formula Calculator: engine for Mode 02 (Discriminant & Root Analysis).
   Built on the exact engine of Mode 01 (tools/quad_engine.js): every coefficient is an exact rational, so the sign of the discriminant is decided exactly and no tolerance is used.
   analyse(): what the discriminant says about the roots (type, number of x-axis crossings, rational or not, factorisation, root signs, root separation, sum of squares, modulus of a complex pair).
   rangeFor(): with two of A, B, C given, the values of the third that give two distinct real roots, a repeated root or complex roots (exact boundary values).
   Works in Node (module.exports) and in the browser (global QuadDisc, after Quad). */
(function (root) {
  'use strict';
  var Q = typeof module !== 'undefined' && module.exports ? require('./quad_engine.js') : root.Quad;
  var O = Q.ops, R = Q.R, rs = Q.rs, mn = Q.mn, isqrt = Q.isqrt, sqrtSplit = Q.sqrtSplit, add = O.add, sub = O.sub, mul = O.mul, div = O.div, neg = O.neg, sgn = O.sgn, isZero = O.isZero, ri = O.ri;
  var ZERO = ri(0), ONE = ri(1);
  function absq(a) { return sgn(a) < 0 ? neg(a) : a; }

  /* sqrt of a non-negative rational t = p/q written exactly as (s/q) * sqrt(r), r squarefree. Returns {coef, r, text, dec(dp), zero}. */
  function radOf(t) {
    if (sgn(t) < 0) throw new Error('radOf of negative');
    if (isZero(t)) return { coef: ZERO, r: 1n, text: '0', zero: true, dec: function (dp) { return Q.decOfRational(ZERO, dp); }, rational: true };
    var sp = sqrtSplit(t.n * t.d), coef = R(sp.s, t.d), r = sp.r;
    var text;
    if (r === 1n) text = rs(coef);
    else text = (coef.n === 1n ? '' : String(coef.n)) + '√' + r + (coef.d === 1n ? '' : '/' + coef.d);
    return { coef: coef, r: r, text: text, zero: false, rational: r === 1n, full: sp.full, dec: function (dp) {
      if (r === 1n) return Q.decOfRational(coef, dp);
      var S = 10n ** BigInt(dp + 12), rt = isqrt(r * S * S);
      return Q.decOfRational(R(coef.n * rt, coef.d * S), dp);
    } };
  }
  function scaleRad(k, rd) { /* k rational >= 0 times a radOf result */
    if (rd.zero || isZero(k)) return radOf(ZERO);
    var c = mul(k, rd.coef), r = rd.r, text;
    if (r === 1n) text = rs(c); else text = (c.n === 1n ? '' : String(c.n)) + '√' + r + (c.d === 1n ? '' : '/' + c.d);
    return { coef: c, r: r, text: text, zero: false, rational: r === 1n, dec: function (dp) { if (r === 1n) return Q.decOfRational(c, dp); var S = 10n ** BigInt(dp + 12), rt = isqrt(r * S * S); return Q.decOfRational(R(c.n * rt, c.d * S), dp); } };
  }
  function sqr(x) { return mul(x, x); }

  /* const + coef * v as text, leaving out a zero term and a coefficient of 1 */
  function lin(cst, coef, v) {
    var t = isZero(cst) ? '' : mn(rs(cst)); if (isZero(coef)) return t || '0';
    var ab = absq(coef), body = (ab.n === 1n && ab.d === 1n ? '' : mn(rs(ab))) + v;
    return t ? t + (sgn(coef) < 0 ? ' \u2212 ' : ' + ') + body : (sgn(coef) < 0 ? '\u2212' : '') + body;
  }
  var LABEL = { distinct: 'Two distinct real roots', repeated: 'One repeated real root', complex: 'Two complex conjugate roots' };
  function kindOfSign(s) { return s > 0 ? 'distinct' : s === 0 ? 'repeated' : 'complex'; }

  /* ---------- analyse ---------- */
  function analyse(input) {
    var r = Q.solve(input);
    if (!r.ok || r.degree !== 2) return r;
    var A = r.A, B = r.B, C = r.C, D = r.D, dp = r.dp, s = sgn(D), an = { sign: s, kind: kindOfSign(s) }, steps = [];
    r.analysis = an; r.mode2Steps = steps;
    an.label = LABEL[an.kind];
    an.distinctReal = s > 0 ? 2 : s === 0 ? 1 : 0;
    an.xAxis = s > 0 ? 'The parabola crosses the x-axis at two points.' : s === 0 ? 'The parabola touches the x-axis at one point, its vertex.' : 'The parabola does not meet the x-axis.';
    an.rational = s >= 0 && (s === 0 || r.perfectSquare);
    an.factorsOverQ = an.rational;
    an.factorsOverR = s >= 0;
    an.S = r.sum; an.P = r.product;
    an.sumSquares = sub(sqr(r.sum), mul(ri(2), r.product));
    an.recip = isZero(C) ? null : neg(div(B, C));
    var A2 = sqr(A);
    an.sepSq = div(D, A2); /* (x1 - x2)^2 for real roots; negative for complex (then it is -(2 Im)^2) */
    if (s >= 0) an.diff = radOf(an.sepSq);
    else { an.imag = radOf(div(neg(D), mul(ri(4), A2))); an.modulus = radOf(div(C, A)); an.re = div(neg(B), mul(ri(2), A)); }
    /* root signs */
    var P = r.product, S = r.sum;
    if (s < 0) an.signs = 'No real roots, so no sign. The real part of the pair is ' + mn(rs(an.re)) + '.';
    else if (sgn(P) < 0) an.signs = 'One positive root and one negative root, because the product C/A is negative.';
    else if (sgn(P) > 0) an.signs = sgn(S) > 0 ? 'Both roots are positive: the product C/A is positive and the sum −B/A is positive.' : 'Both roots are negative: the product C/A is positive and the sum −B/A is negative.';
    else an.signs = sgn(S) > 0 ? 'One root is zero and the other is positive (C = 0 and −B/A > 0).' : sgn(S) < 0 ? 'One root is zero and the other is negative (C = 0 and −B/A < 0).' : 'Both roots are zero (B = C = 0).';
    /* closeness to a repeated root: documented policy, not a tolerance */
    var nearly = false; an.relDelta = null;
    if (s !== 0 && !isZero(B)) { var rel = absq(div(D, sqr(B))); an.relDelta = rel; nearly = sgn(sub(mul(rel, ri(1000000)), ONE)) < 0; }
    an.nearlyRepeated = nearly;
    /* independent identity: (sum)^2 - 4 product = delta / A^2 */
    an.identityOk = Q.ops.eq(sub(sqr(r.sum), mul(ri(4), r.product)), an.sepSq);
    an.checkOk = !!(r.verifyOk && an.identityOk);

    steps.push('Discriminant: Δ = B² − 4AC = ' + mn(r.discriminant) + (s > 0 ? ', which is positive.' : s === 0 ? ', which is exactly zero.' : ', which is negative.'));
    steps.push('Rule: Δ > 0 gives two distinct real roots, Δ = 0 one repeated real root, Δ < 0 two complex conjugate roots. Here: ' + an.label.toLowerCase() + '.');
    if (s > 0) steps.push(an.rational ? 'Δ = ' + mn(rs(D)) + ' is the square of a rational number (√Δ = ' + mn(radOf(D).text) + '), so the roots are rational and ' + Q.equationText(A, B, C).replace(' = 0', '') + ' factors over the rationals.' : 'Δ = ' + mn(rs(D)) + ' is not the square of a rational number (√Δ = ' + mn(radOf(D).text) + '), so the roots are irrational: they are real but cannot be written as fractions, and the quadratic does not factor over the rationals.');
    if (s === 0) steps.push('With Δ = 0 the two roots coincide at x = −B/(2A) = ' + mn(rs(r.roots[0].q)) + '. The quadratic is a perfect square: A(x − ' + mn(rs(r.roots[0].q)) + ')².');
    if (s < 0) steps.push('Δ < 0, so √Δ = i√(−Δ). The roots are −B/(2A) ± i·√(−Δ)/(2|A|): real part ' + mn(rs(an.re)) + ', imaginary part ±' + mn(an.imag.text) + '. Their modulus is √(C/A) = ' + mn(an.modulus.text) + '.');
    if (s >= 0) steps.push('Distance between the roots: |x₁ − x₂| = √Δ / |A| = ' + mn(an.diff.text) + '.');
    steps.push('Sum of roots −B/A = ' + mn(rs(r.sum)) + ', product C/A = ' + mn(rs(r.product)) + '. Sum of squares x₁² + x₂² = (sum)² − 2(product) = ' + mn(rs(an.sumSquares)) + (an.recip ? '. Sum of reciprocals 1/x₁ + 1/x₂ = −B/C = ' + mn(rs(an.recip)) : '') + '.');
    steps.push('Identity check: (sum)² − 4(product) = ' + mn(rs(sub(sqr(r.sum), mul(ri(4), r.product)))) + ' and Δ/A² = ' + mn(rs(an.sepSq)) + (an.identityOk ? ': they are equal.' : ': they DIFFER.'));
    if (nearly) steps.push('Note: |Δ| is less than one millionth of B² (Δ is not zero, but the roots are almost equal). Small changes in the coefficients would change the type of roots.');
    return r;
  }

  /* ---------- parameter ranges ---------- */
  /* An interval: lo / hi are null (unbounded) or {t: exact text, q: rational or null, rad: radOf or null}; li / hi_ inclusive flags. */
  function ep(q) { return { t: mn(rs(q)), q: q, val: Number(q.n) / Number(q.d) }; }
  function epRad(rd, negative) { return { t: (negative ? '−' : '') + mn(rd.text), q: rd.rational ? (negative ? neg(rd.coef) : rd.coef) : null, rad: rd, negative: !!negative, val: (negative ? -1 : 1) * Number(rd.coef.n) / Number(rd.coef.d) * Math.sqrt(Number(rd.r)) }; }
  function fmtIv(v, iv) {
    if (iv.point) return v + ' = ' + iv.lo.t;
    if (!iv.lo && !iv.hi) return 'every value of ' + v;
    if (!iv.lo) return v + (iv.hiI ? ' ≤ ' : ' < ') + iv.hi.t;
    if (!iv.hi) return v + (iv.loI ? ' ≥ ' : ' > ') + iv.lo.t;
    return iv.lo.t + (iv.loI ? ' ≤ ' : ' < ') + v + (iv.hiI ? ' ≤ ' : ' < ') + iv.hi.t;
  }
  function fmtUnion(v, ivs) {
    if (!ivs.length) return 'no value of ' + v;
    if (ivs.length === 2 && !ivs[0].lo && !ivs[1].hi && ivs[0].hi && ivs[1].lo && !ivs[0].hiI && !ivs[1].loI && ivs[0].hi.t === ivs[1].lo.t) return v + ' ≠ ' + ivs[0].hi.t;
    return ivs.map(function (iv) { return fmtIv(v, iv); }).join(' or ');
  }
  function removeZero(ivs) { /* A = 0 is not a quadratic */
    var out = [];
    ivs.forEach(function (iv) {
      var lo = iv.lo && iv.lo.q, hi = iv.hi && iv.hi.q;
      if (iv.point) { if (!isZero(iv.lo.q)) out.push(iv); return; }
      var loNeg = !iv.lo || sgn(lo) < 0 || (sgn(lo) === 0 && iv.loI), hiPos = !iv.hi || sgn(hi) > 0 || (sgn(hi) === 0 && iv.hiI);
      var inside = (!iv.lo || sgn(lo) < 0) && (!iv.hi || sgn(hi) > 0);
      if (inside) { out.push({ lo: iv.lo, loI: iv.loI, hi: ep(ZERO), hiI: false }, { lo: ep(ZERO), loI: false, hi: iv.hi, hiI: iv.hiI }); return; }
      if (iv.lo && sgn(lo) === 0 && iv.loI) { out.push({ lo: iv.lo, loI: false, hi: iv.hi, hiI: iv.hiI }); return; }
      if (iv.hi && sgn(hi) === 0 && iv.hiI) { out.push({ lo: iv.lo, loI: iv.loI, hi: iv.hi, hiI: false }); return; }
      void loNeg; void hiPos; out.push(iv);
    });
    return out;
  }
  function sampleOf(ivs, avoidZero) {
    var cand = [];
    ivs.forEach(function (iv) {
      var lo = iv.lo && iv.lo.q, hi = iv.hi && iv.hi.q;
      if (iv.point) { if (iv.lo.q) cand.push(iv.lo.q); return; }
      if (iv.sample) { cand.push(iv.sample); return; }
      if (!iv.lo && !iv.hi) cand.push(avoidZero ? ONE : ZERO);
      else if (!iv.lo && hi) cand.push(sub(hi, ONE));
      else if (!iv.hi && lo) cand.push(add(lo, ONE));
      else if (lo && hi) cand.push(div(add(lo, hi), ri(2)));
    });
    return cand.length ? cand[0] : null;
  }
  function sampleBoth(ivs) { return null; }
  function parseKnown(text, key, errs) { var p = Q.parseNum(text); if (p.error) errs[key] = p.error; else if (p.empty) errs[key] = 'Enter ' + key.toUpperCase() + ' (type 0 if it is absent).'; return p.v; }
  function rangeFor(input) {
    input = input || {};
    var u = String(input.unknown || 'c').toLowerCase(), dp = input.dp === undefined ? 6 : Math.max(2, Math.min(15, input.dp | 0));
    if (u !== 'a' && u !== 'b' && u !== 'c') return { ok: false, error: 'Choose A, B or C as the unknown.', errors: {} };
    var errs = {}, k = {}, names = ['a', 'b', 'c'].filter(function (x) { return x !== u; });
    var allEmpty = names.every(function (n) { var p = Q.parseNum(input[n]); return p.empty; });
    names.forEach(function (n) { k[n] = parseKnown(input[n], n, errs); });
    if (errs[names[0]] || errs[names[1]]) return { ok: false, empty: allEmpty, errors: errs, error: errs[names[0]] || errs[names[1]] };
    var V = u.toUpperCase(), cases = { distinct: [], repeated: [], complex: [] }, notes = [], formula, A = k.a, B = k.b, C = k.c, pts = [];
    if (u !== 'a' && isZero(A)) { var e1 = {}; e1.a = 'A must not be zero here: with A = 0 the equation is linear and has no discriminant.'; return { ok: false, errors: e1, error: e1.a }; }
    var explicitSamples = {};
    if (u === 'c') {
      var c0 = div(sqr(B), mul(ri(4), A)), up = sgn(A) > 0;
      formula = 'Δ = B² − 4AC = ' + lin(sqr(B), neg(mul(ri(4), A)), 'C');
      pts.push({ name: 'C₀ = B²/(4A)', text: mn(rs(c0)), q: c0 });
      var lowIv = { lo: null, hi: ep(c0), hiI: false }, highIv = { lo: ep(c0), loI: false, hi: null };
      cases[up ? 'distinct' : 'complex'].push(lowIv); cases[up ? 'complex' : 'distinct'].push(highIv);
      cases.repeated.push({ point: true, lo: ep(c0) });
      notes.push('Δ = 0 when C = B²/(4A) = ' + mn(rs(c0)) + '. On one side of this value Δ is positive and on the other it is negative' + (up ? ': A is positive, so a smaller C gives a larger Δ.' : ': A is negative, so a larger C gives a larger Δ.'));
    } else if (u === 'b') {
      var K = mul(ri(4), mul(A, C));
      formula = 'Δ = B² − 4AC = B²' + (isZero(K) ? '' : (sgn(K) < 0 ? ' + ' : ' − ') + mn(rs(absq(K))));
      if (sgn(K) < 0) { cases.distinct.push({ lo: null, hi: null }); notes.push('4AC = ' + mn(rs(K)) + ' is negative, so Δ = B² + ' + mn(rs(neg(K))) + ' is always positive: A and C have opposite signs, the parabola always crosses the x-axis, and no value of B gives complex roots.'); }
      else if (sgn(K) === 0) { cases.repeated.push({ point: true, lo: ep(ZERO) }); cases.distinct.push({ lo: null, hi: ep(ZERO), hiI: false }, { lo: ep(ZERO), loI: false, hi: null }); pts.push({ name: 'B₀', text: '0', q: ZERO }); notes.push('AC = 0, so Δ = B²: zero only at B = 0, and positive for every other B. Complex roots never occur.'); }
      else {
        var b0 = radOf(K), nb = epRad(b0, true), pb = epRad(b0, false), fl = isqrt(K.n * K.d) / K.d;
        pts.push({ name: '−√(4AC)', text: nb.t, rad: b0, neg: true }, { name: '+√(4AC)', text: pb.t, rad: b0 });
        cases.distinct.push({ lo: null, hi: nb, hiI: false, sample: ri(-(fl + 1n)) }, { lo: pb, loI: false, hi: null, sample: ri(fl + 1n) });
        cases.repeated.push({ point: true, lo: nb }, { point: true, lo: pb });
        cases.complex.push({ lo: nb, loI: false, hi: pb, hiI: false, sample: ZERO });
        notes.push('Δ = 0 when B² = 4AC = ' + mn(rs(K)) + ', that is B = ±' + mn(b0.text) + '. Between these two values Δ is negative.');
      }
    } else {
      formula = 'Δ = B² − 4AC = ' + lin(sqr(B), neg(mul(ri(4), C)), 'A');
      if (isZero(C)) {
        if (isZero(B)) { cases.repeated = removeZero([{ lo: null, hi: null }]); notes.push('B = C = 0, so the equation is Ax² = 0: the only root is x = 0, repeated, for every non-zero A.'); }
        else { cases.distinct = removeZero([{ lo: null, hi: null }]); notes.push('C = 0, so Δ = B² = ' + mn(rs(sqr(B))) + ' is positive for every A: one root is x = 0 and the other is −B/A.'); }
      } else {
        var a0 = div(sqr(B), mul(ri(4), C)), cp = sgn(C) > 0;
        pts.push({ name: 'A₀ = B²/(4C)', text: mn(rs(a0)), q: a0 });
        var lo2 = { lo: null, hi: ep(a0), hiI: false }, hi2 = { lo: ep(a0), loI: false, hi: null };
        cases[cp ? 'distinct' : 'complex'].push(lo2); cases[cp ? 'complex' : 'distinct'].push(hi2);
        cases.repeated.push({ point: true, lo: ep(a0) });
        cases.distinct = removeZero(cases.distinct); cases.complex = removeZero(cases.complex); cases.repeated = removeZero(cases.repeated);
        notes.push('Δ = 0 when A = B²/(4C) = ' + mn(rs(a0)) + (isZero(a0) ? ', which is not allowed because A = 0 is not a quadratic, so no value of A gives a repeated root.' : '.'));
      }
      notes.push('A = 0 is left out of every range: the equation is then linear and has no discriminant.');
    }
    void explicitSamples; void sampleBoth;
    var out = { ok: true, unknown: V, known: { a: rs(A || ZERO), b: rs(B || ZERO), c: rs(C || ZERO) }, formula: formula, notes: notes, breakpoints: [], cases: [], dp: dp };
    pts.forEach(function (p) {
      var dec = p.rad ? p.rad.dec(dp) : Q.decOfRational(p.q, dp);
      out.breakpoints.push({ name: p.name, exact: p.text, dec: (p.neg ? '-' : '') + dec.text.replace(/^-/, ''), approx: !dec.exact });
    });
    ['distinct', 'complex', 'repeated'].forEach(function (kd) {
      var ivs = cases[kd], c = { kind: kd, label: LABEL[kd], condition: fmtUnion(V, ivs), possible: ivs.length > 0, example: null, intervals: ivs.map(function (iv) { return { point: !!iv.point, lo: iv.lo ? iv.lo.val : null, hi: iv.hi ? iv.hi.val : null, loI: !!iv.loI, hiI: !!iv.hiI, loText: iv.lo ? iv.lo.t : null, hiText: iv.hi ? iv.hi.t : null }; }) };
      if (ivs.length) {
        var sm = sampleOf(ivs, u === 'a');
        if (sm) {
          var a2 = u === 'a' ? sm : A, b2 = u === 'b' ? sm : B, c2 = u === 'c' ? sm : C, an = analyse({ a: rs(a2), b: rs(b2), c: rs(c2), dp: dp });
          if (an.ok && an.degree === 2) c.example = { value: mn(rs(sm)), q: sm, equation: mn(an.equation), discriminant: mn(an.discriminant), kind: an.kind, matches: an.analysis.kind === kd, roots: an.roots.map(function (x) { return mn(x.exact); }).join(',  ') };
        }
      }
      out.cases.push(c);
    });
    return out;
  }

  function summary(r) {
    if (!r.ok || r.degree !== 2) return '';
    var an = r.analysis, L = ['Equation: ' + mn(r.equation), 'Discriminant: Δ = B² − 4AC = ' + mn(r.discriminant), 'Nature of the roots: ' + an.label + (an.rational && an.sign > 0 ? ' (rational)' : an.sign > 0 ? ' (irrational)' : '')];
    r.roots.forEach(function (x, i) { L.push('x' + (r.roots.length > 1 ? i + 1 : '') + ' = ' + mn(x.exact) + (mn(x.exact) !== mn(x.dec.text) ? (x.dec.exact ? ' = ' : '  ≈ ') + mn(x.dec.text) : '')); });
    L.push('Sum of roots: ' + mn(rs(r.sum)) + '; product of roots: ' + mn(rs(r.product)));
    L.push('x-axis: ' + an.xAxis); L.push('Root signs: ' + an.signs);
    L.push('Verified by exact substitution and by (sum)² − 4(product) = Δ/A²: ' + (an.checkOk ? 'yes' : 'NO'));
    return L.join('\n');
  }
  function rangeSummary(g) {
    if (!g.ok) return '';
    var L = ['Known: A = ' + (g.unknown === 'A' ? '?' : mn(g.known.a)) + ', B = ' + (g.unknown === 'B' ? '?' : mn(g.known.b)) + ', C = ' + (g.unknown === 'C' ? '?' : mn(g.known.c)), g.formula.replace(/^/, '')];
    g.cases.forEach(function (c) { L.push(c.label + ': ' + mn(c.condition)); });
    return L.join('\n');
  }

  var api = { analyse: analyse, rangeFor: rangeFor, summary: summary, rangeSummary: rangeSummary, radOf: radOf, LABEL: LABEL };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.QuadDisc = api;
})(typeof window !== 'undefined' ? window : this);
