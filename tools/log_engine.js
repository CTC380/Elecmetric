/* Elecmetric Log Calculator: engine for Mode 01 (Universal Log Calculator).
   log_b(x) = y means b^y = x. The base b and the argument x are read as exact rational numbers (BigInt), or as the constant e.
   Logarithms are evaluated in 90-digit fixed point from the atanh series (no floating point), so any size of input that the parser accepts gives a correct decimal.
   Whether y is a rational number is decided from the prime factors of b and x: y is rational exactly when the prime exponents of x are a fixed multiple of those of b.
   If a number has a prime factor too large to find by trial division, the page says the exactness is not decided and gives the decimal only.
   Works in Node (module.exports) and in the browser (global Lg, after Quad). */
(function (root) {
  'use strict';
  var Q = typeof require === 'function' && typeof module !== 'undefined' ? require('./quad_engine.js') : root.Quad;
  var R = Q.R, O = Q.ops, rs = Q.rs, mn = Q.mn;
  var DIG = 90, S = 10n ** 90n, TRIAL = 1000000;

  /* ---------- fixed-point natural logarithm ---------- */
  /* S * atanh(num / den) for |num| < den */
  function atanhS(num, den) {
    var t = S * num / den, z2n = num * num, z2d = den * den, sum = t, k = 1n;
    while (t !== 0n) { t = t * z2n / z2d; k += 2n; var term = t / k; if (term === 0n) break; sum += term; }
    return sum;
  }
  var LN2 = 2n * atanhS(1n, 3n);
  function lnIntS(n) { /* n >= 1 */
    if (n === 1n) return 0n;
    var k = n.toString(2).length, p = 1n << BigInt(k); /* n / p lies in [1/2, 1) */
    return BigInt(k) * LN2 + 2n * atanhS(n - p, n + p);
  }
  function lnRatS(n, d) { /* ln(n / d), n and d positive */
    if (n === d) return 0n;
    if (2n * n >= d && n <= 2n * d) return 2n * atanhS(n - d, n + d);
    return lnIntS(n) - lnIntS(d);
  }
  var LN10 = lnIntS(10n);

  /* scaled value (times S) -> text with dp places; scientific form for tiny or huge values */
  function fmtS(v, dp) {
    var neg = v < 0n, a = neg ? -v : v;
    if (a === 0n) return '0';
    var sci = a >= 10n ** BigInt(DIG + 15), r = (a * 10n ** BigInt(dp) + S / 2n) / S;
    if (!sci && r > 0n) {
      var s = r.toString(); while (s.length <= dp) s = '0' + s;
      return (neg ? '-' : '') + (dp ? s.slice(0, s.length - dp) + '.' + s.slice(s.length - dp) : s);
    }
    var ds = a.toString(), sig = dp + 1, e10 = ds.length - 1 - DIG, m;
    if (ds.length > sig) m = BigInt(ds.slice(0, sig)) + (ds.charCodeAt(sig) >= 53 ? 1n : 0n); else m = BigInt(ds) * 10n ** BigInt(sig - ds.length);
    var ms = m.toString(); if (ms.length > sig) { ms = ms.slice(0, sig); e10 += 1; }
    return (neg ? '-' : '') + ms[0] + (dp ? '.' + ms.slice(1) : '') + ' \u00d7 10^' + e10;
  }

  /* ---------- factorisation by trial division ---------- */
  var PR = null;
  function primes() {
    if (PR) return PR;
    var s = new Uint8Array(TRIAL + 1); PR = [];
    for (var i = 2; i <= TRIAL; i++) { if (!s[i]) { PR.push(i); for (var j = i * i; j <= TRIAL; j += i) s[j] = 1; } }
    return PR;
  }
  /* n >= 1 BigInt -> { m: {prime string: exponent}, rest: BigInt (1 when fully factored) } */
  function factor(n) {
    var m = {}, rest = n, ps = primes(), broke = false;
    for (var i = 0; i < ps.length; i++) {
      var P = BigInt(ps[i]); if (P * P > rest) { broke = true; break; }
      if (rest % P === 0n) { var e = 0; while (rest % P === 0n) { rest /= P; e++; } m[ps[i]] = e; }
    }
    if (broke || rest < 1000000000000n) { if (rest > 1n) m[rest.toString()] = (m[rest.toString()] || 0) + 1; rest = 1n; }
    return { m: m, rest: rest };
  }
  function factorQ(q) {
    var a = factor(q.n), b = factor(q.d), m = {};
    Object.keys(a.m).forEach(function (k) { m[k] = a.m[k]; });
    Object.keys(b.m).forEach(function (k) { m[k] = (m[k] || 0) - b.m[k]; });
    return { m: m, restOne: a.rest === 1n && b.rest === 1n };
  }
  var SUP = { '0': '\u2070', '1': '\u00b9', '2': '\u00b2', '3': '\u00b3', '4': '\u2074', '5': '\u2075', '6': '\u2076', '7': '\u2077', '8': '\u2078', '9': '\u2079', '-': '\u207b' };
  function sup(n) { return String(n).split('').map(function (c) { return SUP[c]; }).join(''); }
  function factText(f) {
    var ks = Object.keys(f.m).filter(function (k) { return f.m[k] !== 0; }).sort(function (a, b) { var x = BigInt(a), y = BigInt(b); return x < y ? -1 : x > y ? 1 : 0; });
    if (!ks.length) return '1';
    return ks.map(function (k) { return k + sup(f.m[k]); }).join(' \u00b7 ');
  }
  /* y rational? status: 'rational' (lam), 'irrational', 'undetermined' */
  function exactLog(bq, xq) {
    var fb = factorQ(bq), fx = factorQ(xq), keys = {}, lam = null, bad = false;
    Object.keys(fb.m).concat(Object.keys(fx.m)).forEach(function (k) { keys[k] = 1; });
    Object.keys(keys).forEach(function (k) {
      var eb = fb.m[k] || 0, ex = fx.m[k] || 0;
      if (eb !== 0) { var l = R(BigInt(ex), BigInt(eb)); if (lam === null) lam = l; else if (!O.eq(lam, l)) bad = true; }
      else if (ex !== 0) bad = true;
    });
    var undecided = false;
    if (fb.restOne !== fx.restOne) bad = true; else if (!fb.restOne) undecided = true;
    var st = bad ? 'irrational' : (undecided || lam === null) ? 'undetermined' : 'rational';
    return { status: st, lam: st === 'rational' ? lam : null, fb: fb, fx: fx, complete: fb.restOne && fx.restOne };
  }
  function powQ(q, k) { /* q rational > 0, k BigInt */
    var a = k < 0n ? -k : k, n = q.n ** a, d = q.d ** a; return k < 0n ? R(d, n) : R(n, d);
  }

  /* ---------- reading the base and the argument ---------- */
  function readVal(text, name) {
    var s = String(text === undefined || text === null ? '' : text).trim();
    if (s === '') return { empty: true, error: 'Enter ' + name + '.' };
    if (s === 'e' || s === 'E') return { e: true };
    var r = Q.parseNum(s); if (r.error) return { error: r.error };
    return { q: r.v };
  }
  var lnOf = function (v) { return v.e ? S : lnRatS(v.q.n, v.q.d); };
  var showOf = function (v) { return v.e ? 'e' : rs(v.q); };
  function sub(bs) { return /^[0-9]+$/.test(bs) ? bs.split('').map(function (c) { return String.fromCharCode(0x2080 + +c); }).join('') : '_(' + bs + ')'; }
  function eqText(bs, xs, ys) { return (bs === 'e' ? 'ln(' + xs + ')' : 'log' + sub(bs) + '(' + xs + ')') + (ys === undefined ? '' : /^\u2248/.test(ys) ? ' ' + ys : ' = ' + ys); }

  /* ---------- the calculation ---------- */
  function calc(input) {
    input = input || {};
    var dp = input.dp === undefined ? 8 : Math.max(2, Math.min(15, input.dp | 0)), errs = {};
    var b = readVal(input.b, 'the base b'), x = readVal(input.x, 'the number x');
    if (b.error) errs.b = b.error; if (x.error) errs.x = x.error;
    if (!errs.b && b.q) {
      if (O.sgn(b.q) <= 0) errs.b = 'The base must be greater than zero.';
      else if (O.eq(b.q, O.ri(1))) errs.b = 'Error: a logarithm to base 1 does not exist, because 1 raised to any power is 1.';
    }
    if (!errs.x && x.q) {
      if (O.sgn(x.q) === 0) errs.x = 'Undefined: the logarithm of zero does not exist for any base.';
      else if (O.sgn(x.q) < 0) errs.x = 'No real result: the logarithm of a negative number is not a real number.';
    }
    if (errs.b || errs.x) return { ok: false, empty: !!(b.empty && x.empty), errors: errs, error: errs.b || errs.x };

    var bs = showOf(b), xs = showOf(x), lnx = lnOf(x), lnb = lnOf(b), yS = lnx === 0n ? 0n : lnx * S / lnb;
    var res = { ok: true, dp: dp, b: bs, x: xs, bq: b.q || null, xq: x.q || null, bIsE: !!b.e, xIsE: !!x.e }, steps = [], verify = [];
    var xIsOne = !x.e && O.eq(x.q, O.ri(1)), same = (b.e && x.e) || (!b.e && !x.e && O.eq(b.q, x.q));

    /* exactness */
    var ex = null;
    if (xIsOne) ex = { status: 'rational', lam: O.ri(0) };
    else if (same) ex = { status: 'rational', lam: O.ri(1) };
    else if (!b.e && !x.e) ex = exactLog(b.q, x.q);
    else ex = { status: 'irrational' };
    res.status = ex.status;

    if (ex.status === 'rational') {
      var lam = ex.lam, dec = Q.decOfRational(lam, dp);
      res.exact = rs(lam); res.y = { text: dec.text, exact: dec.exact, rational: true };
      res.label = 'Exact result (a rational number)';
    } else {
      res.exact = null; res.y = { text: fmtS(yS, dp), exact: false, rational: false };
      res.label = ex.status === 'irrational' ? 'Irrational result (decimal approximation)' : 'Decimal approximation (exactness not decided)';
    }
    res.yText = res.exact !== null && res.y.text !== res.exact ? res.exact + ' = ' + res.y.text : res.y.text;
    res.equation = eqText(bs, xs, res.exact !== null ? res.exact : '\u2248 ' + res.y.text);
    res.expEq = bs + (res.exact !== null && /^-?\d+$/.test(res.exact) ? '^' + res.exact : '^(' + (res.exact !== null ? res.exact : res.y.text) + ')') + ' = ' + xs;
    res.common = { text: lnx === 0n ? '0' : fmtS(lnx * S / LN10, dp) }; res.natural = { text: fmtS(lnx, dp) }; res.binary = { text: lnx === 0n ? '0' : fmtS(lnx * S / LN2, dp) };
    res.lnb = { text: fmtS(lnb, dp) };
    res.changeOfBase = 'ln(' + xs + ') / ln(' + bs + ') = ' + res.natural.text + ' / ' + res.lnb.text;

    /* working */
    steps.push('log base b of x is the power y that b must be raised to in order to give x: log_b(x) = y means b^y = x.');
    steps.push('Domain check: x = ' + xs + ' is greater than zero, and b = ' + bs + ' is greater than zero and is not 1, so a real logarithm exists.');
    if (xIsOne) steps.push('Any valid base raised to the power 0 gives 1, so ' + eqText(bs, '1') + ' = 0.');
    else if (same) steps.push('A base raised to the power 1 is itself, so ' + eqText(bs, bs) + ' = 1.');
    else if (ex.status === 'rational') {
      steps.push('Write b and x as products of primes. b = ' + factText(ex.fb) + ' and x = ' + factText(ex.fx) + '.');
      var ks = Object.keys(ex.fb.m).filter(function (k) { return ex.fb.m[k] !== 0; });
      steps.push('For every prime, (exponent in x) \u00f7 (exponent in b) is the same number' + (ks.length ? ', ' + ex.fx.m[ks[0]] + ' \u00f7 ' + ex.fb.m[ks[0]] : '') + '. So x = b^y with y = ' + res.exact + (res.y.text !== res.exact ? ' = ' + res.y.text : '') + '.');
    } else if (ex.status === 'irrational') {
      if (!b.e && !x.e) steps.push('The prime exponents of x are not a fixed multiple of those of b (b = ' + factText(ex.fb) + ', x = ' + factText(ex.fx) + '), so no fraction p/q satisfies b^(p/q) = x. y is irrational.');
      else steps.push('The natural logarithm of any positive rational number other than 1 is irrational (and so is its reciprocal), so y is irrational.');
      steps.push('Use change of base: y = ln x \u00f7 ln b = ' + res.natural.text + ' \u00f7 ' + res.lnb.text + ' = ' + res.y.text + ' (rounded to ' + dp + ' places).');
    } else {
      steps.push('b or x has a prime factor above one million that was not tested, so the calculator does not claim that y is exact or irrational.');
      steps.push('Use change of base: y = ln x \u00f7 ln b = ' + res.natural.text + ' \u00f7 ' + res.lnb.text + ' = ' + res.y.text + ' (rounded to ' + dp + ' places).');
    }
    steps.push('The same value from common logarithms: y = log\u2081\u2080 x \u00f7 log\u2081\u2080 b = ' + res.common.text + ' \u00f7 ' + (lnb === 0n ? '0' : fmtS(lnb * S / LN10, dp)) + '.');
    res.steps = steps;

    /* checks */
    if (ex.status === 'rational' && !b.e && !x.e) {
      var p = ex.lam.n, qd = ex.lam.d, lhs = powQ(x.q, qd), rhs = powQ(b.q, p), ok = O.eq(lhs, rhs);
      verify.push({ text: qd === 1n ? 'b^y = ' + bs + '^' + mn(String(p)) + ' = ' + rs(rhs) + ' and x = ' + xs : 'x^' + qd + ' = ' + rs(lhs) + ' and b^' + mn(String(p)) + ' = ' + rs(rhs), ok: ok, exact: true });
    } else if (ex.status === 'rational') verify.push({ text: eqText(bs, xs) + ' = ' + res.exact + ' follows from the definition.', ok: true, exact: true });
    var nb = b.e ? Math.E : Number(b.q.n) / Number(b.q.d), nx = x.e ? Math.E : Number(x.q.n) / Number(x.q.d);
    if (isFinite(nb) && isFinite(nx) && nb > 0 && nx > 0 && Math.abs(nb - 1) > 1e-6 && Math.abs(nx - 1) > 1e-6) {
      var dv = Math.log(nx) / Math.log(nb), yv = parseFloat(res.y.text.replace(/\u00d7 10\^/, 'e').replace(/ /g, ''));
      var okd = Math.abs(dv - yv) <= 1e-9 * Math.max(1e-12, Math.abs(dv)) + (res.y.exact ? 0 : Math.pow(10, -dp));
      verify.push({ text: 'Double-precision ln x / ln b = ' + String(dv) + ', which agrees with the result above.', ok: okd, exact: false });
    }
    res.verify = verify; res.verifyOk = verify.every(function (v) { return v.ok; });
    res.summary = [res.equation, 'Result: ' + res.yText, res.label, 'Equivalent exponential equation: ' + res.expEq, 'Common logarithm log10 x = ' + res.common.text, 'Natural logarithm ln x = ' + res.natural.text, 'Binary logarithm log2 x = ' + res.binary.text, 'Change of base: ' + res.changeOfBase].join('\n');
    return res;
  }

  var api = { calc: calc, exactLog: exactLog, fmtS: fmtS, lnRatS: lnRatS, factor: factor, factText: factText, eqText: eqText, S: S, LN10: LN10, LN2: LN2 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Lg = api;
})(typeof window !== 'undefined' ? window : globalThis);
