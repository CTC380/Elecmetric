/* Elecmetric Log Calculator: engine for Mode 02 (Antilog Calculator).
   antilog_b(y) = b^y, the inverse of log_b(x) = y. The base b and the logarithm y are read as exact rationals (BigInt); the base may also be the constant e.
   Exactness is decided without factorisation: with y = p/q in lowest terms, b^y is rational exactly when the numerator and the denominator of b are both perfect q-th powers
   (b^(p/q) rational and gcd(p, q) = 1 force b^(1/q) rational). For base e and y not 0 the result is irrational (Lindemann-Weierstrass), so the decision never stays open.
   The decimal is x = 10^t with t = y * log10(b), found in 90-digit fixed point (tools/log_engine.js supplies ln b): x = M * 10^E with M in [1, 10), so results as large as 10^(10^9) or as small
   as 10^(-10^9) are kept as a mantissa and an exponent and never overflow. Exact results are printed from exact integer arithmetic.
   The reverse logarithm of the result is checked with the Mode 01 engine (exactly, for exact results) and in 90-digit arithmetic (for all results), plus a double-precision cross-check.
   Works in Node (module.exports) and in the browser (global Antilog, after Quad, Lg, ExponentCalc and ExponentFrac). */
(function (root) {
  'use strict';
  var isNode = typeof require === 'function' && typeof module !== 'undefined';
  var Q = isNode ? require('./quad_engine.js') : root.Quad, L = isNode ? require('./log_engine.js') : root.Lg, F = isNode ? require('./exponent_frac_engine.js') : root.ExponentFrac;
  var R = Q.R, O = Q.ops, rs = Q.rs, mn = Q.mn, S = L.S, LN10 = L.LN10, LN2 = L.LN2;
  var LIMIT_T = 1000000000n * S, EXACT_BITS = 100000, PLAIN_LO = -6, PLAIN_HI = 14, MAXE_CHECK = 5000;

  function floorDiv(a, b) { var q = a / b; if ((a % b !== 0n) && ((a < 0n) !== (b < 0n))) q -= 1n; return q; }
  function babs(a) { return a < 0n ? -a : a; }
  function bitlen(n) { return n.toString(2).length; }
  var SUP = { '0': '\u2070', '1': '\u00b9', '2': '\u00b2', '3': '\u00b3', '4': '\u2074', '5': '\u2075', '6': '\u2076', '7': '\u2077', '8': '\u2078', '9': '\u2079', '-': '\u207b' };
  function sup(n) { return String(n).split('').map(function (c) { return SUP[c]; }).join(''); }
  function sub(bs) { return /^[0-9]+$/.test(bs) ? bs.split('').map(function (c) { return String.fromCharCode(0x2080 + +c); }).join('') : '_(' + bs + ')'; }

  /* ---------- fixed-point exponential: S * exp(z / S) for 0 <= z <= 3 S ---------- */
  function expS(z) {
    var GUARD = 10n ** 10n, G = S * GUARD, zz = z * GUARD, k = 12, r = zz >> BigInt(k), term = G, sum = G, n = 1n, i;
    for (;;) { term = term * r / G / n; if (term === 0n) break; sum += term; n += 1n; }
    for (i = 0; i < k; i++) sum = sum * sum / G;
    return sum / GUARD;
  }

  /* ---------- exact integer root: n^(1/k) as a BigInt, or null when n is not a perfect k-th power ---------- */
  function iroot(n, k) {
    if (n <= 1n) return n;
    var bl = bitlen(n); if (k > BigInt(bl)) return null;
    var kn = Number(k), lo = 1n, hi = 1n << BigInt(Math.ceil(bl / kn) + 1), kb = BigInt(kn), mid;
    while (lo < hi) { mid = (lo + hi + 1n) >> 1n; if (mid ** kb <= n) lo = mid; else hi = mid - 1n; }
    return lo ** kb === n ? lo : null;
  }

  /* ---------- digits of a positive rational: { d: digit string of length nd, E: exponent of the first digit, term: nothing left over } ---------- */
  function ratDigits(n, d, nd) {
    var E = n.toString().length - d.toString().length, k, num, den, sc, tries = 0;
    for (;;) {
      k = nd - 1 - E; num = k >= 0 ? n * 10n ** BigInt(k) : n; den = k >= 0 ? d : d * 10n ** BigInt(-k); sc = num / den;
      var len = sc.toString().length;
      if (len === nd) return { d: sc.toString(), E: E, term: num % den === 0n };
      E += len < nd ? -1 : 1; if (++tries > 4) throw new Error('digit search failed');
    }
  }
  function roundDigits(D, E, sig) {
    if (D.length <= sig) return { d: D + '0'.repeat(sig - D.length), E: E };
    var head = D.slice(0, sig);
    if (D.charCodeAt(sig) >= 53) { var v = (BigInt(head) + 1n).toString(); if (v.length > sig) { v = v.slice(0, sig); E += 1; } head = v; }
    return { d: head, E: E };
  }
  function trimZ(s) { return s.replace(/0+$/, '') || '0'; }
  function plainOf(d, E) {
    var s;
    if (E >= 0) s = d.length <= E + 1 ? d + '0'.repeat(E + 1 - d.length) : d.slice(0, E + 1) + '.' + d.slice(E + 1);
    else s = '0.' + '0'.repeat(-E - 1) + d;
    return s.indexOf('.') >= 0 ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
  }
  function sciOf(d, E) { var t = d.length > 1 ? trimZ(d.slice(1)) : '0'; return d[0] + (t === '0' ? '' : '.' + t) + ' \u00d7 10^' + E; }
  /* value D[0].D[1..] * 10^E (D truncated, not rounded) -> { plain, sci, E, rounded } at sig significant digits; full: show every digit of D as it is */
  function render(D, E, sig, full) {
    var rd = full ? { d: trimZ(D), E: E } : roundDigits(D, E, sig), plain = null;
    if (!full && rd.E >= 0 && rd.E + 1 > sig && rd.E <= PLAIN_HI) { var r2 = roundDigits(D, E, rd.E + 1); rd = r2; }
    if (rd.E >= PLAIN_LO && rd.E <= PLAIN_HI) plain = plainOf(rd.d, rd.E);
    return { plain: plain, sci: sciOf(trimZ(rd.d), rd.E), E: rd.E, d: rd.d };
  }
  function fixDigits(M, E) { if (M >= 10n * S) { M /= 10n; E += 1; } else if (M < S) { M *= 10n; E -= 1; } return { M: M, E: E }; }

  /* ---------- reading the base and the logarithm ---------- */
  function readB(text) {
    var s = String(text === undefined || text === null ? '' : text).trim();
    if (s === '') return { empty: true, error: 'Enter the base b.' };
    if (s === 'e' || s === 'E') return { e: true };
    var r = Q.parseNum(s); if (r.error) return { error: r.error };
    return { q: r.v };
  }
  function readY(text) {
    var s = String(text === undefined || text === null ? '' : text).trim();
    if (s === '') return { empty: true, error: 'Enter the logarithm y.' };
    if (/^[eE]$/.test(s)) return { error: 'The logarithm y must be a number. Only the base can be e.' };
    var r = Q.parseNum(s); if (r.error) return { error: r.error };
    return { q: r.v };
  }
  /* a rational as text: a terminating decimal when there is one (0.5, 0.4771), otherwise the fraction (2/3) */
  function show(q) { var d = Q.decOfRational(q, 15); return d.exact ? d.text : rs(q); }
  function eqText(bs, ys, xt) {
    var name = bs === '10' ? 'antilog(' + ys + ')' : bs === 'e' ? 'exp(' + ys + ')' : 'antilog' + sub(bs) + '(' + ys + ')';
    return xt === undefined ? name : name + (/^\u2248/.test(xt) ? ' ' + xt : ' = ' + xt);
  }
  function powText(bs, ys) { return bs + '^' + (/^-?\d+$/.test(ys) ? ys : '(' + ys + ')'); }

  /* ---------- the calculation ---------- */
  function calc(input) {
    input = input || {};
    var sig = input.sig === undefined ? 10 : Math.max(3, Math.min(30, input.sig | 0)), errs = {};
    var b = readB(input.b), y = readY(input.y);
    if (b.error) errs.b = b.error; if (y.error) errs.y = y.error;
    if (!errs.b && b.q) {
      if (O.sgn(b.q) <= 0) errs.b = 'The base must be greater than zero.';
      else if (O.eq(b.q, O.ri(1))) errs.b = 'Error: a logarithm to base 1 does not exist, because 1 raised to any power is 1.';
    }
    if (errs.b || errs.y) return { ok: false, empty: !!(b.empty && y.empty), errors: errs, error: errs.b || errs.y };

    var bs = b.e ? 'e' : show(b.q), ys = show(y.q), p = y.q.n, q = y.q.d, lnb = b.e ? S : L.lnRatS(b.q.n, b.q.d);
    var tS = floorDiv(p * lnb * S, q * LN10);
    if (babs(tS) > LIMIT_T) {
      var msg = 'Out of range: b^y would be about 10^' + L.fmtS(tS, 0).replace(/-/, '\u2212') + ', but results are limited to a size of 10^1,000,000,000.';
      return { ok: false, errors: { y: msg }, error: msg };
    }
    var E0 = Number(floorDiv(tS, S)), f = tS - BigInt(E0) * S, fx = fixDigits(expS(f * LN10 / S), E0), M = fx.M, E = fx.E;
    var res = { ok: true, sig: sig, b: bs, y: ys, bq: b.q || null, yq: y.q, p: p, q: q, bIsE: !!b.e }, steps = [], verify = [];

    /* exactness */
    var status, xq = null, rn = null, rd = null;
    if (p === 0n) { status = 'rational'; xq = R(1n, 1n); }
    else if (b.e) status = 'irrational';
    else {
      if (q === 1n) { rn = b.q.n; rd = b.q.d; } else { rn = iroot(b.q.n, q); rd = rn === null ? null : iroot(b.q.d, q); }
      if (rn === null || rd === null) status = 'irrational';
      else {
        var bits = (bitlen(rn) + bitlen(rd)) * Number(babs(p));
        if (bits > EXACT_BITS) status = 'rational-large';
        else { status = 'rational'; var ap = babs(p), nn = rn ** ap, dd = rd ** ap; xq = p < 0n ? R(dd, nn) : R(nn, dd); }
      }
    }
    res.status = status; res.xq = xq;

    /* the value as text */
    var dec, exactDigits = null;
    if (xq) {
      exactDigits = ratDigits(xq.n, xq.d, 91);
      var tz = trimZ(exactDigits.d), full = exactDigits.term && tz.length <= Math.max(sig, 40);
      dec = render(exactDigits.d, exactDigits.E, sig, full); dec.exactDecimal = full;
    } else { dec = render(M.toString(), E, sig, false); dec.exactDecimal = false; }
    res.dec = dec; res.E = dec.E; res.plain = dec.plain; res.sci = dec.sci;
    var exactStr = xq ? rs(xq) : null; if (exactStr !== null && exactStr.length > 120) exactStr = null;
    res.exact = exactStr; res.exactDigits = xq ? (xq.n.toString().length > xq.d.toString().length ? xq.n.toString().length : xq.d.toString().length) : null;
    var approxText = dec.plain !== null ? dec.plain : dec.sci, sureEq = !!xq && (exactStr !== null || dec.exactDecimal);
    if (!xq) res.xText = '\u2248 ' + approxText;
    else if (exactStr !== null) res.xText = xq.d === 1n ? exactStr : exactStr + (dec.exactDecimal ? ' = ' : ' \u2248 ') + approxText;
    else res.xText = (dec.exactDecimal ? '' : '\u2248 ') + approxText;
    res.label = status === 'rational' ? 'Exact result (a rational number)' : status === 'irrational' ? 'Irrational result (decimal approximation)' : 'Rational result too long to print in full (leading digits shown)';
    res.digitsBefore = E >= 0 ? E + 1 : null;
    var rhs = !xq ? '\u2248 ' + approxText : exactStr !== null ? ((xq.d !== 1n && dec.exactDecimal && dec.plain !== null) ? dec.plain : exactStr) : (dec.exactDecimal ? approxText : '\u2248 ' + approxText);
    res.equation = eqText(bs, ys, rhs);
    res.expEq = powText(bs, ys) + (sureEq ? ' = ' : ' \u2248 ') + (exactStr !== null && exactStr.length <= 60 ? exactStr : approxText);
    var shortExact = exactStr !== null && exactStr.length <= 60;
    res.reverseEq = L.eqText(bs, shortExact ? exactStr : approxText, sureEq ? ys : '\u2248 ' + ys);
    var dpL = Math.max(4, Math.min(sig, 20));
    res.log10 = L.fmtS(tS, dpL); res.ln = L.fmtS(tS * LN10 / S, dpL); res.log2 = L.fmtS(tS * LN10 / LN2, dpL);
    res.t = L.fmtS(tS, 12);

    /* radical form for a fractional exponent of a rational base */
    res.radical = null; res.radicalNote = null;
    if (!b.e && q > 1n && status !== 'rational') {
      var rf = F.radicalForm(b.q, p, q);
      if (rf.ok && !rf.exactRoot) res.radical = rf.textNoSign; else if (!rf.ok) res.radicalNote = rf.reason;
    }

    /* characteristic and mantissa (base 10 only) */
    res.cm = null;
    if (!b.e && O.eq(b.q, O.ri(10))) {
      var c = floorDiv(p, q), m = O.sub(y.q, R(c, 1n));
      var mdig = roundDigits(fixDigits(expS(m.n * S / m.d * LN10 / S), 0).M.toString(), 0, sig);
      res.cm = { c: String(c), m: show(m), mText: rs(m), antilogM: plainOf(mdig.d, mdig.E) , exactM: m.n === 0n };
    }

    /* working */
    steps.push('The antilogarithm undoes the logarithm. If log base b of x equals y, then x = b^y, so antilog base b of y is b^y.');
    steps.push('Domain check: the base b = ' + bs + ' is greater than zero and is not 1, and y = ' + ys + ' can be any real number, so b^y exists and is always positive.');
    if (p === 0n) steps.push('Any valid base raised to the power 0 gives 1, so ' + eqText(bs, '0') + ' = 1.');
    else if (b.e) steps.push('With base e the antilogarithm is the natural exponential: x = e^(' + ys + '). The number e^y is irrational for every non-zero rational y, so only a decimal can be given.');
    else if (q === 1n) {
      steps.push(p > 0n ? 'y is the whole number ' + ys + ', so x = b^y = ' + bs + ' multiplied by itself ' + (p === 1n ? 'once' : p + ' times') + (status === 'rational' && res.exact !== null ? ' = ' + res.exact + '.' : '.')
        : 'y is the negative whole number ' + ys + '. A negative power is the reciprocal of the positive power: b^(\u2212' + babs(p) + ') = 1 / b^' + babs(p) + (status === 'rational' && res.exact !== null ? ' = ' + res.exact + '.' : '.'));
    } else {
      steps.push('y = ' + rs(y.q) + ' is a fraction, so x = b^(p/q) with p = ' + p + ' and q = ' + q + '. This is the ' + q + '-th root of b, raised to the power p' + (p < 0n ? ' (a negative p means the reciprocal)' : '') + '.');
      if (status === 'irrational') steps.push('For x to be rational, the numerator' + (b.q.d === 1n ? '' : ' and the denominator') + ' of b would have to be perfect ' + q + '-th powers, and ' + (rn === null ? b.q.n : b.q.d) + ' is not. So the ' + q + '-th root of b is irrational, and so is x.' + (res.radical ? ' In simplest radical form x = ' + res.radical + '.' : ''));
      else steps.push('The ' + q + '-th root of ' + b.q.n + ' is ' + rn + (b.q.d === 1n ? '' : ' and of ' + b.q.d + ' is ' + rd) + ', so the ' + q + '-th root of b is ' + rs(R(rn, rd)) + '. Raised to the power ' + p + ' this gives x' + (status === 'rational' && res.exact !== null ? ' = ' + res.exact + '.' : '.'));
    }
    steps.push('For the decimal, write x = 10^t with t = y \u00d7 log\u2081\u2080(b) = y \u00d7 ln(b) / ln(10) = ' + res.t + '. Split t into a whole part E = ' + E0 + ' and a fractional part f = ' + L.fmtS(f, 12) + ', so x = 10^f \u00d7 10^E = ' + res.dec.sci + (xq ? ' (the exact value above agrees).' : '.'));
    if (res.cm) steps.push('Base 10 uses the table form: log x = ' + ys + ' has characteristic ' + res.cm.c + ' (the whole part, which sets the power of ten) and mantissa ' + res.cm.m + ' (the fractional part). The antilog of the mantissa is 10^' + res.cm.m + ' = ' + res.cm.antilogM + ', so x = ' + res.cm.antilogM + ' \u00d7 10^' + res.cm.c + '.');
    steps.push('Reverse check: ' + res.reverseEq + '.');
    res.steps = steps;

    /* checks */
    if (xq && !b.e) {
      var lr = L.calc({ b: rs(b.q), x: rs(xq), dp: 4 });
      if (lr.ok) verify.push({ text: 'Mode 01 gives ' + mn(res.reverseEq.replace(/\u2248 /, '')) + ': the logarithm of the result is exactly y.', ok: lr.status === 'rational' && lr.exact === rs(y.q), exact: true });
    }
    if (xq && exactDigits) {
      var a1 = BigInt(exactDigits.d.padEnd(91, '0').slice(0, 91)), n1 = M, e1 = exactDigits.E, e2 = E;
      if (e2 === e1 - 1) n1 = M / 10n; else if (e2 === e1 + 1) a1 = a1 / 10n;
      verify.push({ text: 'The 80-digit decimal from 10^(y log b) agrees with the exact value to 78 digits.', ok: (e2 === e1 || Math.abs(e2 - e1) === 1) && babs(a1 - n1) <= 10n ** 12n, exact: false });
    }
    var lnM = L.lnRatS(M, S), sumS = lnM * S / LN10 + BigInt(E) * S;
    verify.push({ text: 'log\u2081\u2080 of the mantissa plus the exponent equals y \u00d7 log\u2081\u2080(b) to better than 10^\u221260.', ok: babs(sumS - tS) <= 10n ** 25n, exact: false });
    if (Math.abs(E) <= MAXE_CHECK) {
      var nn2 = E >= 0 ? M * 10n ** BigInt(E) : M, dd2 = E >= 0 ? S : S * 10n ** BigInt(-E), lnx = L.lnRatS(nn2, dd2);
      var yBack = lnb === 0n ? 0n : lnx * S / lnb, yWant = p * S / q, tol = 10n ** 25n * (babs(lnb) < S ? S / (babs(lnb) || 1n) : 1n);
      verify.push({ text: 'ln(result) / ln(b) recomputed in 90-digit arithmetic equals y to better than 10^\u221260.', ok: babs(yBack - yWant) <= tol, exact: false });
    }
    var nb = b.e ? Math.E : Number(b.q.n) / Number(b.q.d), ny = Number(p) / Number(q), dv = Math.exp(ny * Math.log(nb)), xv = parseFloat(dec.sci.replace(/ \u00d7 10\^/, 'e'));
    if (isFinite(nb) && isFinite(ny) && isFinite(dv) && dv > 1e-300 && dv < 1e300 && isFinite(xv)) {
      verify.push({ text: 'Double-precision exp(y \u00d7 ln b) = ' + String(dv) + ', which agrees with the result above.', ok: Math.abs(dv - xv) <= 1e-9 * Math.abs(xv) * (1 + Math.abs(ny * Math.log(nb))) , exact: false });
    }
    res.verify = verify; res.verifyOk = verify.every(function (v) { return v.ok; });
    res.summary = [res.equation, 'Result: ' + res.xText, res.label, 'Scientific notation: ' + res.sci, 'Equivalent exponential equation: ' + res.expEq, (res.radical ? 'Radical form: ' + res.radical + '\n' : '') + 'Reverse: ' + res.reverseEq,
      'Common logarithm log10 x = ' + res.log10, 'Natural logarithm ln x = ' + res.ln, 'Binary logarithm log2 x = ' + res.log2].join('\n');
    return res;
  }

  var api = { calc: calc, iroot: iroot, ratDigits: ratDigits, eqText: eqText, expS: expS, render: render, fixDigits: fixDigits, floorDiv: floorDiv, trimZ: trimZ, roundDigits: roundDigits };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Antilog = api;
})(typeof window !== 'undefined' ? window : globalThis);
