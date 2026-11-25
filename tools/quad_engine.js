/* Elecmetric Quadratic Formula Calculator: exact engine for Mode 01 (Quadratic Equation Solver).
   Every coefficient is held as an exact rational number (BigInt numerator and denominator), so the discriminant, its sign and the roots are decided exactly.
   Roots come out as (u +/- v*sqrt(r))/w with r squarefree; they are verified by exact substitution in the field Q(sqrt(d)).
   Works in Node (module.exports) and in the browser (global Quad). */
(function (root) {
  'use strict';
  var MAXDIG = 60, MAXEXP = 300, TRIAL = 200000;
  function babs(x) { return x < 0n ? -x : x; }
  function gcd(a, b) { a = babs(a); b = babs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function isqrt(n) { if (n < 0n) throw new Error('isqrt of negative'); if (n < 2n) return n; var x = 1n << BigInt((n.toString(2).length + 1) >> 1); for (;;) { var y = (x + n / x) >> 1n; if (y >= x) return x; x = y; } }
  function R(n, d) { if (d === undefined) d = 1n; if (d === 0n) throw new Error('zero denominator'); if (d < 0n) { n = -n; d = -d; } var g = gcd(n, d); if (g > 1n) { n /= g; d /= g; } return { n: n, d: d }; }
  var ZERO = R(0n), ONE = R(1n);
  function add(a, b) { return R(a.n * b.d + b.n * a.d, a.d * b.d); }
  function sub(a, b) { return R(a.n * b.d - b.n * a.d, a.d * b.d); }
  function mul(a, b) { return R(a.n * b.n, a.d * b.d); }
  function div(a, b) { return R(a.n * b.d, a.d * b.n); }
  function neg(a) { return { n: -a.n, d: a.d }; }
  function isZero(a) { return a.n === 0n; }
  function sgn(a) { return a.n === 0n ? 0 : a.n < 0n ? -1 : 1; }
  function eq(a, b) { return a.n === b.n && a.d === b.d; }
  function ri(n) { return R(BigInt(n), 1n); }
  function rs(a) { return a.d === 1n ? String(a.n) : a.n + '/' + a.d; }

  /* ---------- input parsing ---------- */
  function parseDec(s) {
    var m = /^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(s);
    if (!m || (m[2] === '' && (m[3] === undefined || m[3] === ''))) return null;
    var ip = m[2] || '', fp = m[3] || '', ex = m[4] ? parseInt(m[4], 10) : 0;
    if (ip.length + fp.length > MAXDIG) return { err: 'Too many digits: use at most ' + MAXDIG + '.' };
    if (Math.abs(ex) > MAXEXP) return { err: 'Exponent too large: use between \u2212' + MAXEXP + ' and ' + MAXEXP + '.' };
    var n = BigInt((ip + fp) || '0'), e = ex - fp.length;
    var v = e >= 0 ? R(n * 10n ** BigInt(e), 1n) : R(n, 10n ** BigInt(-e));
    return { v: m[1] === '-' ? neg(v) : v };
  }
  /* A coefficient: integer, decimal, scientific, fraction a/b (a and b may be decimals) or mixed number "2 1/3". */
  function parseNum(text) {
    var s = String(text === undefined || text === null ? '' : text).replace(/\u2212|\u2013|\u2014/g, '-').replace(/\u2044|\u2215/g, '/').replace(/,/g, '').trim();
    if (s === '') return { empty: true, error: 'Enter a value.' };
    var m = /^([+-]?)\s*(\d+)[ _]+(\d+)\s*\/\s*(\d+)$/.exec(s);
    if (m) { var w = BigInt(m[2]), nn = BigInt(m[3]), dd = BigInt(m[4]); if (dd === 0n) return { error: 'The denominator cannot be zero.' }; var mv = R(w * dd + nn, dd); return { v: m[1] === '-' ? neg(mv) : mv }; }
    if (s.indexOf('/') >= 0) {
      var parts = s.split('/'); if (parts.length !== 2) return { error: 'Use one fraction bar, for example 3/4.' };
      var a = parseDec(parts[0].trim()), b = parseDec(parts[1].trim());
      if (!a || !b) return { error: 'Cannot read \u201c' + s + '\u201d. Use a number, a decimal or a fraction such as 3/4.' };
      if (a.err || b.err) return { error: a.err || b.err };
      if (isZero(b.v)) return { error: 'The denominator cannot be zero.' };
      return { v: div(a.v, b.v) };
    }
    var d = parseDec(s);
    if (!d) return { error: 'Cannot read \u201c' + s + '\u201d. Use a number, a decimal or a fraction such as 3/4.' };
    if (d.err) return { error: d.err };
    return { v: d.v };
  }

  /* ---------- radicals ---------- */
  /* n >= 0 BigInt -> {s, r, full} with n = s^2 * r and r squarefree as far as trial division up to TRIAL reaches (full=false if a large unfactored part remains). */
  function sqrtSplit(n) {
    if (n === 0n) return { s: 0n, r: 0n, full: true };
    var s = 1n, r = 1n, rest = n, p = 2n, lim = BigInt(TRIAL);
    while (p * p <= rest && p <= lim) {
      var e = 0; while (rest % p === 0n) { rest /= p; e++; }
      if (e) { s *= p ** BigInt(e >> 1); if (e & 1) r *= p; }
      p += p === 2n ? 1n : 2n;
    }
    var full = rest === 1n || p * p > rest;
    if (rest > 1n) { var q = isqrt(rest); if (q * q === rest) { s *= q; full = true; } else r *= rest; }
    return { s: s, r: r, full: full };
  }

  /* ---------- number field Q(sqrt(d)), d an integer that is not a perfect square: a + b*sqrt(d) ---------- */
  function Fm(a, b, d) { return { a: a, b: b, d: d }; }
  function fmul(x, y) { return Fm(add(mul(x.a, y.a), mul(mul(x.b, y.b), x.d)), add(mul(x.a, y.b), mul(x.b, y.a)), x.d); }
  function fadd(x, y) { return Fm(add(x.a, y.a), add(x.b, y.b), x.d); }
  function fscale(k, x) { return Fm(mul(k, x.a), mul(k, x.b), x.d); }

  /* ---------- formatting ---------- */
  function mn(s) { return String(s).replace(/-/g, '\u2212'); }
  function coefTerm(c, pow, first) { /* c rational non-zero -> text of one term of a polynomial */
    var neg_ = c.n < 0n, ab = neg_ ? { n: -c.n, d: c.d } : c, body;
    var isOne = ab.n === 1n && ab.d === 1n, v = pow === 0 ? 'x'.slice(0, 0) : pow === 1 ? 'x' : 'x\u00b2';
    if (pow === 0) body = rs(ab).indexOf('/') >= 0 ? '(' + rs(ab) + ')' : rs(ab);
    else body = (isOne ? '' : (ab.d === 1n ? rs(ab) : '(' + rs(ab) + ')')) + v;
    if (first) return (neg_ ? '\u2212' : '') + body;
    return (neg_ ? ' \u2212 ' : ' + ') + body;
  }
  function equationText(A, B, C) {
    var out = '', first = true;
    [[A, 2], [B, 1], [C, 0]].forEach(function (t) { if (isZero(t[0])) return; out += coefTerm(t[0], t[1], first); first = false; });
    if (first) out = '0';
    return out + ' = 0';
  }
  function sciOf(q, sig) {
    var n = q.n < 0n ? -q.n : q.n, d = q.d, e = n.toString().length - d.toString().length;
    for (var tries = 0; tries < 4; tries++) {
      var sc = e >= 0 ? R(n, d * 10n ** BigInt(e)) : R(n * 10n ** BigInt(-e), d);
      if (sc.n >= sc.d * 10n) e++; else if (sc.n < sc.d) e--; else break;
    }
    var m = e >= 0 ? R(n, d * 10n ** BigInt(e)) : R(n * 10n ** BigInt(-e), d), P = 10n ** BigInt(sig - 1), v = (m.n * P * 2n + m.d) / (m.d * 2n);
    if (v >= P * 10n) { v /= 10n; e++; }
    var t = String(v), mant = t[0] + (t.length > 1 ? '.' + t.slice(1) : ''); mant = mant.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    return (q.n < 0n ? '-' : '') + mant + 'e' + (e < 0 ? '\u2212' : '') + Math.abs(e);
  }
  /* Exact decimal of a rational: returns {text, exact}; terminating expansions are shown in full (up to 40 places), others are rounded to dp places. */
  function decOfRational(q, dp) {
    var n = q.n, d = q.d, neg_ = n < 0n; if (neg_) n = -n;
    var t = d, twos = 0, fives = 0; while (t % 2n === 0n) { t /= 2n; twos++; } while (t % 5n === 0n) { t /= 5n; fives++; }
    var terminating = t === 1n, places = Math.max(twos, fives);
    var use = terminating && places <= 40 ? places : dp, S = 10n ** BigInt(use);
    var scaled = (n * S * 2n + d) / (d * 2n);
    var ip = scaled / S, fp = scaled % S, fs = String(fp); fs = use ? '0'.repeat(Math.max(0, use - fs.length)) + fs : '';
    var text = String(ip) + (use ? '.' + fs : '');
    if (terminating && places <= 40) text = text.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    var isZero_ = /^0(\.0*)?$/.test(text);
    if (isZero_ && n !== 0n) return { text: sciOf(q, 10), exact: false };
    return { text: (neg_ && !isZero_ ? '-' : '') + text, exact: terminating && places <= 40 };
  }
  /* (u + sg*v*sqrt(r))/w, r > 0 integer -> decimal rounded to dp places. u, v, w BigInt; sg = +1 or -1. */
  function decOfRadical(u, v, r, w, sg, dp) {
    var G = dp + 12, S = 10n ** BigInt(G), root = isqrt(r * S * S); /* sqrt(r)*S, floor */
    var num = u * S + BigInt(sg) * v * root, q = R(num, w * S);
    var res = decOfRational(q, dp);
    if (res.exact && !/\./.test(res.text) ) return { text: res.text, exact: false };
    /* force fixed dp places for irrational values */
    var qq = R(num, w * S), n = qq.n, d = qq.d, ng = n < 0n; if (ng) n = -n;
    var P = 10n ** BigInt(dp), sc = (n * P * 2n + d) / (d * 2n), ip = sc / P, fp = String(sc % P); fp = '0'.repeat(Math.max(0, dp - fp.length)) + fp;
    var tx = String(ip) + (dp ? '.' + fp : ''); if (/^0(\.0*)?$/.test(tx)) return { text: sciOf(R(num * (ng ? -1n : 1n) * (ng ? -1n : 1n) * (ng ? -1n : 1n), w * S), 10), exact: false }; if (ng) tx = '-' + tx;
    return { text: tx, exact: false };
  }
  function radText(r) { return '\u221a' + r; }
  /* exact text of (u + sg*v*sqrt(r)*[i])/w with w > 0 and gcd(u, v, w) = 1. imag: use i. */
  function exactText(u, v, r, w, sg, imag) {
    var rad = (imag ? 'i' : '') + (r === 1n ? '' : radText(r)), vs = v === 1n ? '' : String(v);
    var core = vs + rad;
    if (u === 0n) { var t0 = (sg < 0 ? '\u2212' : '') + core; return w === 1n ? t0 : (sg < 0 ? '\u2212' + core + '/' + w : core + '/' + w); }
    var us = mn(String(u)), op = sg < 0 ? ' \u2212 ' : ' + ';
    if (w === 1n) return us + op + core;
    return '(' + us + op + core + ')/' + w;
  }
  function imagUnit(core) { return core; }

  /* ---------- the solver ---------- */
  function classify(D, perfect) {
    if (D.n > 0n) return perfect ? 'Two distinct real roots (rational)' : 'Two distinct real roots (irrational)';
    if (D.n === 0n) return 'One repeated real root (double root)';
    return 'Two complex conjugate roots';
  }
  function solve(input) {
    input = input || {};
    var dp = input.dp === undefined ? 8 : Math.max(2, Math.min(15, input.dp | 0));
    var pa = parseNum(input.a), pb = parseNum(input.b), pc = parseNum(input.c);
    var errs = {}, anyEmpty = pa.empty && pb.empty && pc.empty;
    if (pa.error) errs.a = pa.error; if (pb.error) errs.b = pb.error; if (pc.error) errs.c = pc.error;
    if (pa.empty && !pa.error) errs.a = 'Enter A (type 0 if the x\u00b2 term is absent).';
    if (pb.empty && !pb.error) errs.b = 'Enter B (type 0 if the x term is absent).';
    if (pc.empty && !pc.error) errs.c = 'Enter C (type 0 if there is no constant).';
    if (errs.a || errs.b || errs.c) return { ok: false, empty: anyEmpty, errors: errs, error: errs.a || errs.b || errs.c };
    var A = pa.v, B = pb.v, C = pc.v, eqn = equationText(A, B, C), steps = [];
    var res = { ok: true, A: A, B: B, C: C, a: rs(A), b: rs(B), c: rs(C), equation: eqn, dp: dp, steps: steps };
    steps.push('Equation: ' + eqn + '. Coefficients: A = ' + rs(A) + ', B = ' + rs(B) + ', C = ' + rs(C) + '.');

    /* degenerate cases */
    if (isZero(A) && isZero(B)) {
      if (isZero(C)) { res.kind = 'indeterminate'; res.label = 'Every real number is a solution'; res.degree = -1; steps.push('A = B = C = 0, so the equation reads 0 = 0, which is true for every x. It is an identity, not an equation to solve.'); res.roots = []; return res; }
      res.kind = 'none'; res.label = 'No solution'; res.degree = 0; res.roots = []; steps.push('A = B = 0 leaves ' + rs(C) + ' = 0, which is never true because C is not zero. There is no value of x that satisfies the equation.'); return res;
    }
    if (isZero(A)) {
      var x = neg(div(C, B));
      res.kind = 'linear'; res.degree = 1; res.label = 'A = 0: the equation is linear, with one root';
      res.roots = [{ exact: rs(x), dec: decOfRational(x, dp), q: x, real: true, field: null }];
      steps.push('A = 0, so this is the linear equation ' + rs(B) + 'x + ' + rs(C) + ' = 0, not a quadratic. There is one root: x = \u2212C/B = \u2212(' + rs(C) + ')/(' + rs(B) + ') = ' + rs(x) + '.');
      res.verify = [verifyRational(A, B, C, x)]; res.verifyOk = res.verify.every(function (v) { return v.ok; });
      steps.push('Check: A\u00b7x\u00b2 + B\u00b7x + C at x = ' + rs(x) + ' gives ' + res.verify[0].value + '.');
      return res;
    }

    /* quadratic */
    res.degree = 2;
    var B2 = mul(B, B), fAC = mul(ri(4), mul(A, C)), D = sub(B2, fAC);
    res.D = D; res.discriminant = rs(D);
    steps.push('Discriminant: \u0394 = B\u00b2 \u2212 4AC = (' + rs(B) + ')\u00b2 \u2212 4\u00b7(' + rs(A) + ')\u00b7(' + rs(C) + ') = ' + rs(B2) + ' \u2212 (' + rs(fAC) + ') = ' + rs(D) + '.');
    var twoA = mul(ri(2), A), h = neg(div(B, twoA)), k = neg(div(D, mul(ri(4), A)));
    res.vertex = { x: h, y: k }; res.axis = h; res.yint = C; res.sum = neg(div(B, A)); res.product = div(C, A);
    res.opens = sgn(A) > 0 ? 'up' : 'down'; res.extremum = sgn(A) > 0 ? 'minimum' : 'maximum'; res.extremumValue = k;
    var perfectSq = false, sq = null;
    if (D.n >= 0n) { var pn = isqrt(D.n), qd = isqrt(D.d); perfectSq = pn * pn === D.n && qd * qd === D.d; if (perfectSq) sq = R(pn, qd); }
    res.perfectSquare = perfectSq;
    res.label = classify(D, perfectSq); res.rootCount = D.n < 0n ? 2 : D.n === 0n ? 1 : 2;
    steps.push(D.n > 0n ? '\u0394 > 0: two distinct real roots' + (perfectSq ? '. \u0394 is a perfect square, so both roots are rational.' : '. \u0394 is not a perfect square, so the roots are irrational.') : D.n === 0n ? '\u0394 = 0: one repeated real root, the parabola just touches the x-axis.' : '\u0394 < 0: no real roots; the roots are a complex conjugate pair, shown below as a \u00b1 bi.');
    steps.push('Quadratic formula: x = (\u2212B \u00b1 \u221a\u0394) / (2A) = (' + mn(rs(neg(B))) + ' \u00b1 \u221a(' + rs(D) + ')) / ' + rs(twoA) + '.');
    var roots = [];
    if (D.n === 0n) {
      roots.push({ exact: rs(h), dec: decOfRational(h, dp), q: h, real: true });
      res.kind = 'repeated'; steps.push('x = \u2212B/(2A) = ' + rs(h) + ' (repeated).');
      res.roots = roots;
    } else if (perfectSq) {
      var r1 = div(sub(neg(B), sq), twoA), r2 = div(add(neg(B), sq), twoA);
      var lo = sgn(sub(r1, r2)) <= 0 ? r1 : r2, hi = lo === r1 ? r2 : r1;
      roots.push({ exact: rs(lo), dec: decOfRational(lo, dp), q: lo, real: true }, { exact: rs(hi), dec: decOfRational(hi, dp), q: hi, real: true });
      res.kind = 'rational'; steps.push('\u221a\u0394 = \u221a(' + rs(D) + ') = ' + rs(sq) + ', so x = (' + mn(rs(neg(B))) + ' \u00b1 ' + rs(sq) + ') / ' + rs(twoA) + ', which gives x = ' + rs(lo) + ' and x = ' + rs(hi) + '.');
      res.roots = roots;
    } else {
      /* radical: sqrt(|D|) = sqrt(p*q)/q for D = p/q  =>  x = (u +/- v*sqrt(r))/w */
      var absD = D.n < 0n ? { n: -D.n, d: D.d } : D, m = absD.n * absD.d, sp = sqrtSplit(m);
      var s = sp.s, r = sp.r, qd2 = absD.d;
      /* x = (-B +/- (s*sqrt(r)/qd2)) / (2A), with B = Bn/Bd, 2A = An2/Ad2 */
      var Bn = B.n, Bd = B.d, An = twoA.n, Ad = twoA.d;
      /* x = [(-Bn/Bd) +/- s*sqrt(r)/qd2] * Ad/An = [(-Bn*qd2 +/- s*Bd*sqrt(r)) / (Bd*qd2)] * Ad/An */
      var uu = -Bn * qd2 * Ad, vv = s * Bd * Ad, ww = Bd * qd2 * An;
      if (ww < 0n) { ww = -ww; uu = -uu; vv = -vv; }
      var gg = gcd(gcd(uu, vv), ww); if (gg > 1n) { uu /= gg; vv /= gg; ww /= gg; }
      var vpos = vv < 0n ? -vv : vv; /* the two signs cover both roots, so v can be taken positive */
      var imag = D.n < 0n;
      res.radicand = r; res.radicandFull = sp.full; res.form = { u: uu, v: vpos, r: r, w: ww, imag: imag };
      steps.push('Simplify the radical: ' + (imag ? '\u221a(\u2212\u0394) ' : '\u221a\u0394 ') + '= \u221a(' + rs(absD) + ') = ' + (function () { var sq2 = R(s, qd2); return (sq2.n === 1n && sq2.d === 1n ? '' : rs(sq2)) + '\u221a' + r; })() + (sp.full ? '' : ' (the radicand has a large factor that could not be tested for square parts)') + '.');
      var mk = function (sg) {
        var ex = exactText(uu, vpos, r, ww, sg, imag), re_, im_;
        if (!imag) { var dc = decOfRadical(uu, vpos, r, ww, sg, dp); return { exact: ex, dec: dc, real: true, sg: sg }; }
        var reQ = R(uu, ww), imQ = decOfRadical(0n, vpos, r, ww, 1, dp);
        var reD = decOfRational(reQ, dp), reT = reD.exact ? reD.text : reD.text;
        var imN = imQ.text.replace(/^-/, ''), imT = imN === '1' ? '' : imN, sign = sg < 0 ? '\u2212' : '+';
        var dtext = (isZero(reQ) ? '' : reT + ' ') + (isZero(reQ) ? (sg < 0 ? '-' : '') : sign + ' ') + imT + 'i';
        return { exact: ex, dec: { text: dtext, exact: false }, re: reD, im: { text: (sg < 0 ? '-' : '') + imN, exact: false }, real: false, sg: sg };
      };
      var m1 = mk(-1), m2 = mk(1);
      if (!imag) { /* order: smaller root first. sign of 2A decides: x = (u + sg v sqrt r)/w with w > 0, so sg=-1 is smaller */ roots.push(m1, m2); }
      else roots.push(m2, m1);
      res.kind = imag ? 'complex' : 'irrational';
      steps.push('x = ' + roots[0].exact + '  and  x = ' + roots[1].exact + '.');
      res.roots = roots;
      /* exact verification in Q(sqrt(d)) */
      var dField = imag ? -r : r, Ft = function (sg) { return Fm(R(uu, ww), R(BigInt(sg) * vpos, ww), ri(dField)); };
      var verify = [-1, 1].map(function (sg) {
        var x = Ft(sg), t2 = fscale(A, fmul(x, x)), t1 = fscale(B, x), tot = fadd(fadd(t2, t1), Fm(C, ZERO, ri(dField)));
        var ok = isZero(tot.a) && isZero(tot.b);
        return { ok: ok, value: ok ? '0' : (rs(tot.a) + (isZero(tot.b) ? '' : ' + ' + rs(tot.b) + '\u221a' + dField)), root: roots[sg < 0 ? 0 : 1].exact };
      });
      res.verify = verify; res.verifyOk = verify.every(function (v) { return v.ok; });
      steps.push('Check by substitution in exact arithmetic: A\u00b7x\u00b2 + B\u00b7x + C = ' + (res.verifyOk ? '0 for both roots.' : 'NOT zero (' + verify.map(function (v) { return v.value; }).join(' and ') + ').'));
      return res;
    }
    res.verify = roots.map(function (rt) { return verifyRational(A, B, C, rt.q); });
    res.verifyOk = res.verify.every(function (v) { return v.ok; });
    res.verify.forEach(function (v, i) { v.root = roots[i].exact; });
    steps.push('Check by substitution in exact arithmetic: A\u00b7x\u00b2 + B\u00b7x + C = ' + (res.verifyOk ? '0 for ' + (roots.length > 1 ? 'both roots.' : 'the root.') : 'NOT zero.'));
    return res;
  }
  function verifyRational(A, B, C, x) {
    var t = add(add(mul(A, mul(x, x)), mul(B, x)), C);
    return { ok: isZero(t), value: rs(t), root: rs(x), parts: [rs(mul(A, mul(x, x))), rs(mul(B, x)), rs(C)] };
  }

  /* ---------- plain-text summary (copy / report) ---------- */
  function summary(r) {
    if (!r.ok) return '';
    var L = ['Equation: ' + mn(r.equation), 'Result: ' + r.label];
    if (r.degree === 2) { L.push('Discriminant: ' + mn(r.discriminant)); }
    (r.roots || []).forEach(function (x, i) { L.push('x' + (r.roots.length > 1 ? (i + 1) : '') + ' = ' + mn(x.exact) + (x.exact !== x.dec.text && !(x.dec.exact) ? '  \u2248 ' + mn(x.dec.text) : (x.exact !== x.dec.text ? '  = ' + mn(x.dec.text) : ''))); });
    if (r.degree === 2) { L.push('Vertex: (' + mn(rs(r.vertex.x)) + ', ' + mn(rs(r.vertex.y)) + ')'); L.push('Sum of roots: ' + mn(rs(r.sum)) + '; product of roots: ' + mn(rs(r.product))); }
    if (r.verify) L.push('Verified by exact substitution: ' + (r.verifyOk ? 'yes' : 'NO'));
    return L.join('\n');
  }

  var api = { parseNum: parseNum, solve: solve, summary: summary, equationText: equationText, rs: rs, mn: mn, gcd: gcd, isqrt: isqrt, sqrtSplit: sqrtSplit, decOfRational: decOfRational, R: R, ops: { add: add, sub: sub, mul: mul, div: div, neg: neg, sgn: sgn, isZero: isZero, eq: eq, ri: ri } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Quad = api;
})(typeof window !== 'undefined' ? window : this);
