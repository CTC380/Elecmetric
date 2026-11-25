/* Elecmetric Quadratic Formula Calculator: engine for Mode 04 (Exact Root & Factorisation).
   Built on the exact engine of Mode 01 (tools/quad_engine.js): every coefficient is an exact rational, so the factorisation is decided exactly, with no tolerance.
   forms(): for A x^2 + B x + C, the factored form (over the rationals when the roots are rational, otherwise over the reals or the complex numbers with simplified radicals),
            the vertex form A(x - h)^2 + k, completing the square, the rational root theorem, the sum and product of the roots, and exact checks.
   fromRoots(): A(x - r1)(x - r2) expanded. fromVertex(): A(x - h)^2 + k expanded. Both then give the same forms.
   Works in Node (module.exports) and in the browser (global QuadExact, after Quad). */
(function (root) {
  'use strict';
  var Q = typeof module !== 'undefined' && module.exports ? require('./quad_engine.js') : root.Quad;
  var O = Q.ops, R = Q.R, rs = Q.rs, mn = Q.mn, gcd = Q.gcd, sqrtSplit = Q.sqrtSplit, add = O.add, sub = O.sub, mul = O.mul, div = O.div, neg = O.neg, sgn = O.sgn, isZero = O.isZero, eq = O.eq, ri = O.ri;
  var ZERO = ri(0), ONE = ri(1), MINUS = '\u2212';
  var MAXCAND = 20000, MAXDIV = 1000000000000n;
  function absq(a) { return sgn(a) < 0 ? neg(a) : a; }
  function babs(x) { return x < 0n ? -x : x; }
  function lcm(a, b) { return a / gcd(a, b) * b; }
  function T(s) { return mn(s); }
  /* a prefix for a leading coefficient: 1 -> nothing, -1 -> minus sign, an integer -> the integer, a fraction -> (p/q) */
  function pre(k) { if (eq(k, ONE)) return ''; if (eq(k, ri(-1))) return MINUS; return T(k.d === 1n ? rs(k) : '(' + rs(k) + ')'); }
  function polyText(a, b, c) { return Q.equationText(a, b, c).replace(/ = 0$/, ''); }
  function lin(q, p) { var lead = q === 1n ? 'x' : q + 'x'; return T(p === 0n ? lead : p > 0n ? lead + ' ' + MINUS + ' ' + p : lead + ' + ' + (-p)); }
  function fw(q, p) { return q === 1n && p === 0n ? 'x' : '(' + lin(q, p) + ')'; }
  function evalQ(A, B, C, x) { return add(add(mul(A, mul(x, x)), mul(B, x)), C); }

  /* sqrt of a rational t >= 0 as coef * sqrt(r), r squarefree. */
  function radOf(t) {
    if (isZero(t)) return { coef: ZERO, r: 1n, zero: true, full: true };
    var m = t.n * t.d, sp = sqrtSplit(m);
    return { coef: R(sp.s, t.d), r: sp.r, zero: false, full: sp.full };
  }
  function radTerm(coef, r, imag) {
    var core = (coef.n === 1n && (r !== 1n || imag) ? '' : String(coef.n)) + (imag ? 'i' : '') + (r === 1n ? '' : '\u221a' + r);
    return coef.d === 1n ? core : core + '/' + coef.d;
  }
  function vertexText(A, h, k) {
    var a = pre(A), sq = isZero(h) ? 'x\u00b2' : '(x ' + (sgn(h) > 0 ? MINUS + ' ' : '+ ') + rs(absq(h)) + ')\u00b2';
    return T(a + sq + (isZero(k) ? '' : (sgn(k) > 0 ? ' + ' : ' ' + MINUS + ' ') + rs(absq(k))));
  }
  function shift(h, sg, sText) { var t = 'x'; if (!isZero(h)) t += (sgn(h) > 0 ? ' ' + MINUS + ' ' : ' + ') + rs(absq(h)); t += (sg < 0 ? ' ' + MINUS + ' ' : ' + ') + sText; return T('(' + t + ')'); }

  /* ---------- divisors and the rational root theorem ---------- */
  function divisors(n) {
    n = babs(n); if (n === 0n || n > MAXDIV) return null;
    var N = Number(n), small = [], big = [];
    for (var i = 1; i * i <= N; i++) if (N % i === 0) { small.push(BigInt(i)); if (i * i !== N) big.push(BigInt(N / i)); }
    return small.concat(big.reverse());
  }
  function candidates(a, c) { /* a, c whole numbers, c nonzero: all p/q in lowest terms with p | c, q | a, both signs */
    var dc = divisors(c), da = divisors(a);
    if (!dc || !da || dc.length * da.length > MAXCAND) return null;
    var out = [];
    dc.forEach(function (p) { da.forEach(function (q) { if (gcd(p, q) === 1n) { out.push(R(p, q)); out.push(R(-p, q)); } }); });
    out.sort(function (x, y) { return sgn(sub(x, y)); });
    return out;
  }

  /* ---------- the forms of one quadratic with exact rational A, B, C ---------- */
  function core(A, B, C, dp, source, lead) {
    var solved = Q.solve({ a: rs(A), b: rs(B), c: rs(C), dp: dp });
    if (!solved.ok) return solved;
    var res = { ok: true, source: source, A: A, B: B, C: C, a: rs(A), b: rs(B), c: rs(C), equation: T(Q.equationText(A, B, C)), dp: dp, solve: solved, buildSteps: lead || [] };
    if (solved.degree !== 2) { res.degree = solved.degree; res.kind = solved.kind; res.label = solved.label; res.roots = solved.roots; res.steps = solved.steps; res.noQuadratic = true; return res; }
    res.degree = 2; res.kind = solved.kind; res.label = solved.label; res.roots = solved.roots; res.D = solved.D; res.discriminant = solved.discriminant;
    var twoA = mul(ri(2), A), h = neg(div(B, twoA)), k = sub(C, div(mul(B, B), mul(ri(4), A))), tt = div(neg(k), A); /* t = -k/A = D/(4A^2) */
    var imag = sgn(tt) < 0, rad = radOf(absq(tt)), s2 = absq(tt);
    res.vertex = { h: h, k: k, text: vertexText(A, h, k), hText: T(rs(h)), kText: T(rs(k)), hDec: Q.decOfRational(h, dp).text, kDec: Q.decOfRational(k, dp).text };
    res.sum = neg(div(B, A)); res.product = div(C, A);

    /* whole-number form and content */
    var l = 1n; [A, B, C].forEach(function (x) { l = lcm(l, x.d); });
    var ia = A.n * (l / A.d), ib = B.n * (l / B.d), ic = C.n * (l / C.d), g = gcd(gcd(ia, ib), ic);
    ia /= g; ib /= g; ic /= g; if (ia < 0n) { ia = -ia; ib = -ib; ic = -ic; }
    var kc = div(A, ri(ia));
    res.content = { k: kc, kText: T(rs(kc)), a: ia, b: ib, c: ic, text: T(polyText(R(ia), R(ib), R(ic))), same: eq(kc, ONE) };
    res.integerForm = eq(kc, ONE) ? null : T(polyText(R(ia), R(ib), R(ic)) + ' = 0');

    /* completing the square */
    var cs = [];
    cs.push(T('Divide by A = ' + rs(A) + ': x\u00b2 + (' + rs(div(B, A)) + ')x + (' + rs(div(C, A)) + ') = 0.'));
    cs.push(T('Half of the x coefficient is B/(2A) = ' + rs(div(B, twoA)) + '. Add and subtract its square, (' + rs(div(B, twoA)) + ')\u00b2 = ' + rs(mul(div(B, twoA), div(B, twoA))) + '.'));
    cs.push(T('The first three terms are a perfect square: (x ' + (sgn(h) > 0 ? MINUS : '+') + ' ' + rs(absq(h)) + ')\u00b2 when h = \u2212B/(2A) = ' + rs(h) + '.'));
    cs.push(T('The leftover constant is k = C \u2212 B\u00b2/(4A) = ' + rs(k) + ', so A x\u00b2 + B x + C = ' + res.vertex.text + '. This is the vertex form, and the vertex is (' + rs(h) + ', ' + rs(k) + ').'));
    var sText = rad.zero ? '0' : (rad.r === 1n && !imag ? rs(rad.coef) : radTerm(rad.coef, rad.r, imag));
    cs.push(T('Set it equal to zero and isolate the square: (x \u2212 h)\u00b2 = \u2212k/A = ' + rs(tt) + '. Taking square roots gives x = h ' + (rad.zero ? '' : '\u00b1 ' + sText + ' ') + '= ' + (rad.zero ? rs(h) : 'the roots below') + '.'));
    res.completeSquare = cs;
    res.s = { text: T(sText), coef: rad.coef, r: rad.r, imag: imag, zero: rad.zero };

    /* the factored form */
    var checks = [], fsteps = [], F = { };
    var perfect = solved.perfectSquare || solved.kind === 'repeated';
    var nonzeroRoots = solved.roots;
    if (solved.kind === 'rational' || solved.kind === 'repeated') {
      var rt = solved.roots.map(function (x) { return x.q; }), r1 = rt[0], r2 = rt.length > 1 ? rt[1] : rt[0];
      var f1 = fw(r1.d, r1.n), f2 = fw(r2.d, r2.n), rep = solved.kind === 'repeated';
      F.kind = rep ? 'repeated' : 'rational'; F.overQ = true;
      F.text = rep ? (pre(kc) + (r1.d === 1n && r1.n === 0n ? 'x\u00b2' : f1 + '\u00b2')) : pre(kc) + f1 + f2;
      F.text = T(F.text); F.integerText = rep ? T(r1.d === 1n && r1.n === 0n ? 'x\u00b2' : f1 + '\u00b2') : T(f1 + f2);
      F.label = rep ? 'Perfect square' : 'Two rational linear factors';
      F.q = [{ q: r1.d, p: r1.n }, { q: r2.d, p: r2.n }];
      F.m = -r1.d * r2.n; F.n = -r2.d * r1.n;
      fsteps.push(T('Whole-number form: multiply by ' + l + ' and divide by ' + g + ' to get ' + res.content.text + ' = 0' + (res.integerForm ? ', with the common factor ' + rs(kc) + ' taken out.' : '.')));
      if (!isZero(R(ic))) fsteps.push(T('Rational root theorem: a rational root p/q has p dividing c = ' + ic + ' and q dividing a = ' + ia + '.'));
      else fsteps.push(T('c = 0, so x = 0 is a root, and the other factor comes from ' + ia + 'x + (' + ib + ') = 0.'));
      fsteps.push(T('\u0394 = ' + rs(solved.D) + ' is ' + (rep ? 'zero' : 'a perfect square') + ', so the roots are rational: ' + (rep ? 'x = ' + rs(r1) + ' (twice)' : 'x = ' + rs(r1) + ' and x = ' + rs(r2)) + '.'));
      if (!rep) fsteps.push(T('Split the middle term: two whole numbers with sum b = ' + ib + ' and product a\u00b7c = ' + (ia * ic) + ' are ' + F.m + ' and ' + F.n + ', so ' + polyText(R(ia), R(ib), R(ic)) + ' = ' + ia + 'x\u00b2 + (' + F.m + ')x + (' + F.n + ')x + (' + ic + ') = ' + F.integerText + '.'));
      else fsteps.push(T('A repeated root makes the whole-number form a perfect square: ' + polyText(R(ia), R(ib), R(ic)) + ' = ' + F.integerText + '.'));
      fsteps.push(T('Restore the common factor: A x\u00b2 + B x + C = ' + F.text + '.'));
      /* checks */
      var cA = mul(kc, R(r1.d * r2.d)), cB = neg(mul(kc, R(r1.d * r2.n + r2.d * r1.n))), cC = mul(kc, R(r1.n * r2.n));
      checks.push(['The factored form expands to A\u00b7x\u00b2 + B\u00b7x + C exactly', eq(cA, A) && eq(cB, B) && eq(cC, C)]);
      checks.push(['The whole-number leading coefficient equals q\u2081\u00b7q\u2082 (Gauss\u2019s lemma)', ia === r1.d * r2.d]);
      checks.push(['The split-the-middle-term integers have sum b and product a\u00b7c', F.m + F.n === ib && F.m * F.n === ia * ic]);
      F.evalAt = function (x) { return mul(kc, mul(sub(mul(R(r1.d), x), R(r1.n)), sub(mul(R(r2.d), x), R(r2.n)))); };
    } else {
      F.overQ = false; F.q = null;
      var hh = h, sTxt = T(sText);
      F.kind = imag ? 'complex' : 'radical';
      F.text = T(pre(A) + shift(hh, -1, sTxt) + shift(hh, 1, sTxt));
      F.label = imag ? 'Two complex linear factors (conjugates)' : 'Two real linear factors with radicals';
      if (imag) F.realForm = T(pre(A) + '[' + (isZero(h) ? 'x\u00b2' : '(x ' + (sgn(h) > 0 ? MINUS + ' ' : '+ ') + rs(absq(h)) + ')\u00b2') + ' + ' + rs(s2) + ']');
      fsteps.push(T('\u0394 = ' + rs(solved.D) + (imag ? ' is negative' : ' is positive but not the square of a rational number') + ', so ' + res.content.text + ' has no rational root and does not factor over the rationals (it is irreducible there).'));
      fsteps.push(T('The roots are h \u00b1 s, with h = \u2212B/(2A) = ' + rs(h) + ' and s = \u221a(\u2212k/A) = \u221a(' + rs(tt) + ') = ' + sTxt + '.'));
      fsteps.push(T('So A x\u00b2 + B x + C = A(x \u2212 h \u2212 s)(x \u2212 h + s) = ' + F.text + (imag ? ' over the complex numbers.' : ' over the real numbers.')));
      if (imag) fsteps.push(T('Over the real numbers the quadratic stays in one piece: ' + F.realForm + ', with a positive second term, so it never crosses zero.'));
      var s2v = mul(mul(rad.coef, rad.coef), R(rad.r)); if (imag) s2v = neg(s2v);
      var cA2 = A, cB2 = neg(mul(mul(ri(2), A), hh)), cC2 = mul(A, sub(mul(hh, hh), s2v));
      checks.push(['The factored form expands to A\u00b7x\u00b2 + B\u00b7x + C exactly', eq(cA2, A) && eq(cB2, B) && eq(cC2, C)]);
      checks.push(['The simplified radical squares back to \u2212k/A (s\u00b2 = ' + rs(tt) + ')', eq(s2v, tt)]);
      F.evalAt = function (x) { var d = sub(x, hh); return mul(A, sub(mul(d, d), s2v)); };
    }
    res.factored = F; res.factorSteps = fsteps;

    /* rational root theorem */
    var rr = { whole: res.content.text, a: ia, b: ib, c: ic, zeroRoot: ic === 0n, count: null, list: null, found: [], enumerated: false };
    var truth = (solved.kind === 'rational' || solved.kind === 'repeated') ? solved.roots.map(function (x) { return x.q; }) : [];
    if (ic !== 0n) {
      var cand = candidates(ia, ic);
      if (cand) {
        rr.enumerated = true; rr.count = cand.length; rr.list = cand.map(function (x) { return { text: T(rs(x)), root: ia * x.n * x.n + ib * x.n * x.d + ic * x.d * x.d === 0n }; });
        rr.found = cand.filter(function (x) { return ia * x.n * x.n + ib * x.n * x.d + ic * x.d * x.d === 0n; });
        var want = truth.map(rs).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(), got = rr.found.map(rs).sort();
        checks.push(['The rational root theorem finds exactly the rational roots (' + (want.length ? want.map(T).join(', ') : 'none') + ')', want.join('|') === got.join('|')]);
      }
    } else rr.found = truth;
    if (!rr.enumerated) rr.found = truth;
    res.rational = rr;

    /* vertex form, sums and values */
    checks.push(['The vertex form expands to A\u00b7x\u00b2 + B\u00b7x + C exactly', eq(neg(mul(mul(ri(2), A), h)), B) && eq(add(mul(A, mul(h, h)), k), C)]);
    var pts = ['-3', '-2', '-1', '0', '1', '2', '3', '1/2', '-7/3'].map(function (t) { return Q.R(BigInt(t.split('/')[0]), BigInt(t.split('/')[1] || '1')); });
    var agree = pts.every(function (x) { var f = evalQ(A, B, C, x), v = add(mul(A, mul(sub(x, h), sub(x, h))), k); return eq(f, v) && eq(f, F.evalAt(x)); });
    checks.push(['The original, factored and vertex forms agree at 9 test values of x', agree]);
    var sumOk, prodOk;
    if (solved.form) { var f = solved.form, d = f.imag ? -f.r : f.r; sumOk = eq(R(2n * f.u, f.w), res.sum); prodOk = eq(R(f.u * f.u - f.v * f.v * d, f.w * f.w), res.product); }
    else { var q1 = solved.roots[0].q, q2 = solved.roots.length > 1 ? solved.roots[1].q : q1; sumOk = eq(add(q1, q2), res.sum); prodOk = eq(mul(q1, q2), res.product); }
    checks.push(['Sum of the roots equals \u2212B/A = ' + T(rs(res.sum)), sumOk]); checks.push(['Product of the roots equals C/A = ' + T(rs(res.product)), prodOk]);
    var match;
    if (solved.form) { var g2 = solved.form; match = eq(R(g2.u, g2.w), h) && (!rad.full || (g2.r === rad.r && eq(R(g2.v, g2.w), rad.coef))); }
    else match = true;
    checks.push(['The roots h \u00b1 s from the vertex form match the roots of Mode 01', match]);
    checks.push(['Every root gives exactly zero when substituted (exact arithmetic)', solved.verifyOk === true]);
    res.checks = checks.map(function (c) { return { label: T(c[0]), ok: !!c[1] }; }); res.checkOk = checks.every(function (c) { return !!c[1]; });
    res.steps = (lead || []).concat(['Equation: ' + res.equation + '.']).concat(fsteps).concat(cs);
    return res;
  }

  function forms(input) {
    input = input || {};
    var dp = input.dp === undefined ? 8 : Math.max(2, Math.min(15, input.dp | 0));
    var pa = Q.parseNum(input.a), pb = Q.parseNum(input.b), pc = Q.parseNum(input.c), errs = {}, anyEmpty = pa.empty && pb.empty && pc.empty;
    if (pa.error) errs.a = pa.error; if (pb.error) errs.b = pb.error; if (pc.error) errs.c = pc.error;
    if (pa.empty && !pa.error) errs.a = 'Enter A (type 0 if the x\u00b2 term is absent).';
    if (pb.empty && !pb.error) errs.b = 'Enter B (type 0 if the x term is absent).';
    if (pc.empty && !pc.error) errs.c = 'Enter C (type 0 if there is no constant).';
    if (errs.a || errs.b || errs.c) return { ok: false, empty: anyEmpty, errors: errs, error: errs.a || errs.b || errs.c };
    return core(pa.v, pb.v, pc.v, dp, 'equation', []);
  }
  function fromRoots(input) {
    input = input || {};
    var dp = input.dp === undefined ? 8 : Math.max(2, Math.min(15, input.dp | 0));
    var pa = Q.parseNum(input.a), p1 = Q.parseNum(input.r1), p2 = Q.parseNum(input.r2), errs = {}, anyEmpty = pa.empty && p1.empty && p2.empty;
    if (pa.error) errs.a = pa.error; if (p1.error) errs.r1 = p1.error; if (p2.error) errs.r2 = p2.error;
    if (pa.empty && !pa.error) errs.a = 'Enter A, the leading coefficient (use 1 for x\u00b2 + \u2026).';
    if (p1.empty && !p1.error) errs.r1 = 'Enter the first root.';
    if (p2.empty && !p2.error) errs.r2 = 'Enter the second root (the same value again for a repeated root).';
    if (!errs.a && !pa.error && pa.v && isZero(pa.v)) errs.a = 'A cannot be zero: the equation would not be quadratic.';
    if (errs.a || errs.r1 || errs.r2) return { ok: false, empty: anyEmpty, errors: errs, error: errs.a || errs.r1 || errs.r2 };
    var A = pa.v, r1 = p1.v, r2 = p2.v, B = neg(mul(A, add(r1, r2))), C = mul(A, mul(r1, r2));
    var lead = [T('Roots x = ' + rs(r1) + ' and x = ' + rs(r2) + ' with leading coefficient A = ' + rs(A) + ': A(x \u2212 r\u2081)(x \u2212 r\u2082) = A x\u00b2 \u2212 A(r\u2081 + r\u2082)x + A r\u2081 r\u2082.'), T('B = \u2212A(r\u2081 + r\u2082) = ' + rs(B) + ' and C = A r\u2081 r\u2082 = ' + rs(C) + ', so the equation is ' + Q.equationText(A, B, C) + '.')];
    var res = core(A, B, C, dp, 'roots', lead); if (res.ok) { res.input = { a: A, r1: r1, r2: r2 }; var back = res.roots.map(function (x) { return x.q; }); res.rootsRecovered = back.length === 2 ? (eq(back[0], sgn(sub(r1, r2)) <= 0 ? r1 : r2) && eq(back[1], sgn(sub(r1, r2)) <= 0 ? r2 : r1)) : eq(back[0], r1) && eq(r1, r2); res.checks.push({ label: T('The equation solves back to the roots you entered'), ok: res.rootsRecovered }); res.checkOk = res.checkOk && res.rootsRecovered; }
    return res;
  }
  function fromVertex(input) {
    input = input || {};
    var dp = input.dp === undefined ? 8 : Math.max(2, Math.min(15, input.dp | 0));
    var pa = Q.parseNum(input.a), ph = Q.parseNum(input.h), pk = Q.parseNum(input.k), errs = {}, anyEmpty = pa.empty && ph.empty && pk.empty;
    if (pa.error) errs.a = pa.error; if (ph.error) errs.h = ph.error; if (pk.error) errs.k = pk.error;
    if (pa.empty && !pa.error) errs.a = 'Enter A, the leading coefficient (use 1 if there is none).';
    if (ph.empty && !ph.error) errs.h = 'Enter h, the x coordinate of the vertex.';
    if (pk.empty && !pk.error) errs.k = 'Enter k, the y coordinate of the vertex.';
    if (!errs.a && pa.v && isZero(pa.v)) errs.a = 'A cannot be zero: the curve would be a straight line.';
    if (errs.a || errs.h || errs.k) return { ok: false, empty: anyEmpty, errors: errs, error: errs.a || errs.h || errs.k };
    var A = pa.v, h = ph.v, k = pk.v, B = neg(mul(mul(ri(2), A), h)), C = add(mul(A, mul(h, h)), k);
    var lead = [T('Vertex form A(x \u2212 h)\u00b2 + k with A = ' + rs(A) + ', h = ' + rs(h) + ', k = ' + rs(k) + ': ' + vertexText(A, h, k) + '.'), T('Expand: A x\u00b2 \u2212 2Ah x + (A h\u00b2 + k), so B = ' + rs(B) + ' and C = ' + rs(C) + ', and the equation is ' + Q.equationText(A, B, C) + '.')];
    var res = core(A, B, C, dp, 'vertex', lead); if (res.ok) { res.input = { a: A, h: h, k: k }; var okv = eq(res.vertex.h, h) && eq(res.vertex.k, k); res.checks.push({ label: T('The equation\u2019s vertex is the one you entered'), ok: okv }); res.checkOk = res.checkOk && okv; }
    return res;
  }

  function summary(r) {
    if (!r || !r.ok) return '';
    var L = ['Equation: ' + r.equation];
    if (r.degree !== 2) { L.push('Result: ' + r.label); (r.roots || []).forEach(function (x) { L.push('x = ' + mn(x.exact)); }); return L.join('\n'); }
    if (r.integerForm) L.push('Whole-number form: ' + r.integerForm);
    L.push('Factored form: ' + r.factored.text + ' = 0' + (r.factored.overQ ? '' : (r.factored.kind === 'complex' ? '  (over the complex numbers)' : '  (over the real numbers)')));
    if (r.factored.realForm) L.push('Real form: ' + r.factored.realForm + ' = 0');
    L.push('Vertex form: ' + r.vertex.text + ' = 0', 'Vertex: (' + r.vertex.hText + ', ' + r.vertex.kText + ')');
    r.roots.forEach(function (x, i) { L.push('x' + (r.roots.length > 1 ? (i + 1) : '') + ' = ' + mn(x.exact) + (x.exact !== x.dec.text ? '  ' + (x.dec.exact ? '= ' : '\u2248 ') + mn(x.dec.text) : '')); });
    L.push('Sum of roots: ' + T(rs(r.sum)) + '; product of roots: ' + T(rs(r.product)), 'Verified by exact checks: ' + (r.checkOk ? 'yes' : 'NO'));
    return L.join('\n');
  }

  var api = { forms: forms, fromRoots: fromRoots, fromVertex: fromVertex, summary: summary, radOf: radOf, vertexText: vertexText, divisors: divisors };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.QuadExact = api;
})(typeof window !== 'undefined' ? window : this);
