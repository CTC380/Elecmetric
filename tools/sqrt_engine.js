/* Elecmetric Root Calculator: exact engine for Mode 01 (Square Root Calculator).
   The radicand is an exact rational number n/d (BigInt numerator and denominator) read by the Quadratic parser: whole numbers, decimals, scientific notation,
   fractions a/b and mixed numbers such as 2 1/2. The principal (non-negative) real square root is returned in four forms:
   (1) exact rational, when n and d are both perfect squares (detected with an integer square root, not with a decimal);
   (2) simplified radical a * sqrt(m), with a rational and m a square-free integer (the denominator is rationalised: sqrt(1/2) = sqrt(2)/2);
   (3) a decimal to a chosen number of places, computed with an integer square root so that no floating-point value is ever used (marked approximate when it is);
   (4) the equivalent exponent form x^(1/2).
   Zero gives 0. A negative radicand has no real square root: it is refused with a message (the imaginary result is named, not computed as a real value).
   The result is checked by squaring it back exactly (radical and rational forms) and by squaring the rounded decimal against a documented rounding bound.
   Works in Node (module.exports) and in the browser (global SquareRoot, after Quad and Ratio). */
(function (root) {
  'use strict';
  var Q = typeof require === 'function' && typeof module !== 'undefined' ? require('./quad_engine.js') : root.Quad;
  var R = Q.R, O = Q.ops, rs = Q.rs, isqrt = Q.isqrt, gcd = Q.gcd, split = Q.sqrtSplit;
  var MAXPLACES = 50, DEFPLACES = 8, TRIAL = 200000;
  var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };

  function fail(msg, extra) { var r = { ok: false, error: msg, termIndex: -1 }; if (extra) for (var k in extra) r[k] = extra[k]; return r; }
  function hint(msg) { return { ok: false, empty: true, error: msg, hint: msg }; }
  function isBlank(s) { return String(s === undefined || s === null ? '' : s).trim() === ''; }
  function sup(n) { return String(n).split('').map(function (c) { return SUP[c]; }).join(''); }
  function pw(base, e) { return e === 1 ? String(base) : base + sup(e); }
  function perfectSq(n) { var s = isqrt(n); return s * s === n; }

  /* prime factorisation of a whole number up to 1e12 with Number arithmetic; null when larger (the working then names the square factor instead) */
  function factorise(nb) {
    if (nb < 2n || nb > 1000000000000n) return null;
    var n = Number(nb), out = [], p = 2;
    while (p * p <= n) { var e = 0; while (n % p === 0) { n /= p; e++; } if (e) out.push([p, e]); p += p === 2 ? 1 : 2; }
    if (n > 1) out.push([n, 1]);
    return out;
  }
  function factText(f) { return f.map(function (x) { return pw(x[0], x[1]); }).join(' × '); }

  /* coefficient a (rational >= 0) and radicand m (integer >= 1) -> text such as 6√2, √2/2, 3√2/4, 12 */
  function radText(a, m) {
    if (m === 1n) return rs(a);
    var core = '√' + m;
    var num = a.n === 1n ? core : a.n + core;
    return a.d === 1n ? num : num + '/' + a.d;
  }

  /* decimal text of the real number sqrt(x), x = n/d > 0, rounded half up to p places with an integer square root. Always at least 10 significant digits:
     if p places would show 0 (or fewer than 10 significant digits for a tiny value), more places are used and `extended` is set. */
  function sqrtDecimal(q, p) {
    var n = q.n, d = q.d, extended = false, pp = p;
    function at(pl) { var S2 = 10n ** BigInt(2 * (pl + 1)), u = isqrt(n * S2 / d); return (u + 5n) / 10n; }
    var v = at(pp);
    if (v === 0n) {
      extended = true;
      while (v < 1000000000n && pp < 4000) { pp += 1 + Math.floor(pp / 8); v = at(pp); }
    }
    var s = String(v); if (pp) { s = '0'.repeat(Math.max(0, pp + 1 - s.length)) + s; s = s.slice(0, s.length - pp) + '.' + s.slice(s.length - pp); }
    return { text: s, places: pp, scaled: v, extended: extended };
  }
  function floorSqrtRational(q) { return isqrt(q.n / q.d); }
  function fixedText(q, p) { var r = Q.decOfRational(q, p); return r; }

  /* Heron's (Babylonian, Newton) iteration for sqrt(x), x > 0, in exact rationals: g' = (g + x/g)/2. Returns the iterates. */
  function heron(q, iterations) {
    iterations = iterations === undefined ? 5 : iterations;
    var g = R(floorSqrtRational(q) + 1n), out = [g], x = q;
    for (var i = 0; i < iterations; i++) { g = O.div(O.add(g, O.div(x, g)), O.ri(2)); out.push(g); }
    return out;
  }

  function parsePlaces(v) {
    if (v === undefined || v === null || v === '' || v === 'auto') return DEFPLACES;
    var p = Number(v);
    if (!isFinite(p) || p !== Math.floor(p) || p < 0 || p > MAXPLACES) return null;
    return p;
  }

  function solve(input) {
    input = input || {};
    var places = parsePlaces(input.places);
    if (places === null) return fail('Decimal places must be a whole number from 0 to ' + MAXPLACES + '.');
    if (isBlank(input.radicand)) return hint('Enter a number to take the square root of, for example 144, 72, 0.25 or 3/4.');
    var text = String(input.radicand).trim();
    var p = Q.parseNum(text);
    if (p.error) return fail(p.error.replace(/^Enter a value\.$/, 'Enter a number.'));
    var q = p.v, sgn = O.sgn(q);
    if (sgn < 0) {
      var pos = O.neg(q), inner = solve({ radicand: rs(pos), places: places });
      var cx = !inner.ok ? null : inner.perfect ? (inner.exact === '1' ? 'i' : inner.exact + ' i') : 'i \u00d7 ' + inner.radical;
      return fail('\u221a(' + Q.mn(text) + ') has no real result: a real number multiplied by itself is never negative, so only zero and positive numbers have a real square root.' + (cx ? ' In complex numbers the principal square root is ' + cx + ' (a complex mode is planned).' : ''), { noReal: true, complex: cx });
    }

    var n = q.n, d = q.d, intIn = d === 1n, entered = text.replace(/,/g, '');
    var steps = [], warnings = [], verify = [], ok = true;
    function chk(label, v) { verify.push([label, !!v]); if (!v) ok = false; }

    /* ---------- the exact value ---------- */
    var nSq = perfectSq(n), dSq = perfectSq(d), perfect = nSq && dSq;
    var sn = split(n), sd = split(d);
    var full = sn.full && sd.full;
    var a, m, rootQ = null;
    if (n === 0n) { a = R(0n); m = 1n; rootQ = R(0n); perfect = true; full = true; }
    else if (perfect) { rootQ = R(isqrt(n), isqrt(d)); a = rootQ; m = 1n; }
    else {
      /* sqrt(n/d) = (sn.s * sqrt(sn.r)) / (sd.s * sqrt(sd.r)); multiply top and bottom by sqrt(sd.r): sn.s * sqrt(sn.r * sd.r) / (sd.s * sd.r) */
      m = sn.r * sd.r; a = R(sn.s, sd.s * sd.r);
    }
    var radical = radText(a, m), exact = perfect ? rs(rootQ) : radical;
    var irrational = !perfect;
    var dec = null, decText, decApprox;
    if (perfect) { var de = fixedText(rootQ, places); dec = { text: de.text, exact: de.exact, places: places, extended: false }; decText = de.text; decApprox = !de.exact; }
    else { var sd_ = sqrtDecimal(q, places); dec = { text: sd_.text, exact: false, places: sd_.places, extended: sd_.extended, scaled: sd_.scaled }; decText = sd_.text; decApprox = true; }

    var title = '√' + (/^[0-9.]+$/.test(entered) || perfect ? entered : '(' + entered + ')');
    title = '√' + (intIn && /^\d+$/.test(entered) ? entered : '(' + Q.mn(entered) + ')');
    if (/^\d+$/.test(entered) || /^\d*\.\d+$/.test(entered)) title = '√' + entered;

    /* ---------- working ---------- */
    steps.push('Read the radicand: x = ' + entered + (rs(q) !== entered ? ' = ' + rs(q) + ' (held as an exact fraction)' : '') + '.');
    steps.push('The principal square root √x is the non-negative number y with y × y = x.');
    function partText(label, v, sp, nm) {
      var f = factorise(v), t = label + ' ' + v;
      if (v === 1n) return label + ' 1 is a perfect square (1 = 1²).';
      if (f) {
        var evens = f.every(function (x) { return x[1] % 2 === 0; });
        t += ' = ' + factText(f);
        if (evens) return t + '. Every exponent is even, so ' + v + ' is a perfect square: ' + v + ' = ' + sp.s + '².';
        return t + '. Take out pairs of equal factors: ' + v + ' = ' + sp.s + '² × ' + sp.r + (sp.s === 1n ? ' (no square factor)' : '') + '.';
      }
      return t + ': ' + (perfectSq(v) ? v + ' = ' + sp.s + '², a perfect square (found with an integer square root).' : v + ' = ' + sp.s + '² × ' + sp.r + (sp.s === 1n ? ' (no square factor found)' : '') + '.');
    }
    if (n === 0n) steps.push('Zero is its own square root: 0 × 0 = 0.');
    else if (intIn) {
      steps.push(partText('Factorise the radicand:', n, sn));
      if (perfect) steps.push('So √' + n + ' = ' + rootQ.n + ', because ' + rootQ.n + ' × ' + rootQ.n + ' = ' + n + '.');
      else steps.push('Then √' + n + ' = √(' + sn.s + '² × ' + sn.r + ') = ' + (sn.s === 1n ? '' : sn.s + ' × ') + '√' + sn.r + (sn.s === 1n ? ' (already in simplest radical form)' : ' = ' + radical) + '.');
    } else {
      steps.push('Split the fraction: √(' + n + '/' + d + ') = √' + n + ' / √' + d + '.');
      steps.push(partText('Numerator', n, sn)); steps.push(partText('Denominator', d, sd));
      if (perfect) steps.push('Both are perfect squares, so √(' + n + '/' + d + ') = ' + isqrt(n) + '/' + isqrt(d) + ' = ' + rs(rootQ) + '.');
      else {
        steps.push('So √(' + n + '/' + d + ') = ' + (sn.s === 1n ? '' : sn.s) + (sn.r === 1n ? '' : '√' + sn.r) + ' / ' + (sd.s === 1n ? '' : sd.s) + (sd.r === 1n ? '' : '√' + sd.r) + '.');
        if (sd.r !== 1n) steps.push('Rationalise the denominator: multiply top and bottom by √' + sd.r + ', which gives ' + (sn.s === 1n ? '' : sn.s + ' × ') + '√' + m + ' / ' + (sd.s * sd.r) + (m === sn.r * sd.r ? '' : '') + '.');
        steps.push('Reduce the coefficient to lowest terms: the simplified radical is ' + radical + '.');
      }
    }
    if (!perfect) steps.push('The radicand ' + m + ' is not a perfect square, so √' + rs(q) + ' is irrational: its decimal never ends and never repeats. The decimal is an approximation.');
    steps.push('Decimal' + (perfect ? '' : ' (rounded to ' + dec.places + ' place' + (dec.places === 1 ? '' : 's') + ')') + ': √' + rs(q) + (perfect && dec.exact ? ' = ' : ' ≈ ') + decText + '.');
    if (dec.extended) steps.push('More than ' + places + ' places are shown because the value is so small that ' + places + ' places would round it to 0.');

    /* ---------- warnings ---------- */
    if (!full) warnings.push('The radicand is too large to factor completely here. The radical is simplified as far as factors up to ' + TRIAL.toLocaleString('en-US') + ' reach, so it may still contain a larger square factor. The decimal and the checks are not affected.');
    if (!intIn && !perfect) warnings.push('The denominator was rationalised, so ' + radical + ' is the same number as √' + rs(q) + ' written without a root in the denominator.');

    /* ---------- exact checks ---------- */
    var back = perfect ? O.mul(rootQ, rootQ) : O.mul(O.mul(a, a), O.ri(m));
    chk('Squaring the exact result gives back the radicand exactly: ' + (perfect ? '(' + rs(rootQ) + ')² = ' + rs(back) : '(' + radical + ')² = ' + rs(back)), O.eq(back, q));
    var fl = n === 0n ? 0n : floorSqrtRational(q);
    var lo = O.mul(R(fl), R(fl)), hi = O.mul(R(fl + 1n), R(fl + 1n));
    chk('The root lies between the whole numbers ' + fl + ' and ' + (fl + 1n) + ': ' + fl + '\u00b2 \u2264 ' + Q.mn(rs(q)) + ' < ' + (fl + 1n) + '\u00b2', n === 0n ? true : (O.sgn(O.sub(q, lo)) >= 0 && O.sgn(O.sub(hi, q)) > 0));
    if (!perfect) {
      var P = 10n ** BigInt(dec.places), rp = R(dec.scaled, P), sq = O.mul(rp, rp), diff = O.sub(sq, q);
      var half = R(1n, 2n * P), bound = O.add(O.mul(rp, R(1n, P)), O.mul(R(1n, 4n), R(1n, P * P)));
      var absd = O.sgn(diff) < 0 ? O.neg(diff) : diff;
      chk('Squaring the rounded decimal gives ' + fixedApprox(sq, Math.min(dec.places + 4, 60)) + ', which differs from the radicand by ' + sci(absd) + ', within the rounding bound ' + sci(bound), O.sgn(O.sub(bound, absd)) >= 0);
      var lowQ = R(dec.scaled * 2n - 1n, 2n * P), highQ = R(dec.scaled * 2n + 1n, 2n * P);
      chk('The decimal is the correctly rounded value: the true root is between ' + fixedApprox(lowQ, dec.places + 1) + ' and ' + fixedApprox(highQ, dec.places + 1) + ' (half a unit either side of the last place)', O.sgn(O.sub(O.mul(lowQ, lowQ), q)) <= 0 && O.sgn(O.sub(O.mul(highQ, highQ), q)) >= 0);
      chk('The radicand ' + m + ' has no repeated prime factor' + (full ? '' : ' up to ' + TRIAL.toLocaleString('en-US')) + ', so the radical is in simplest form' + (full ? '' : ' as far as checked'), sqrtSplit1(m));
      chk('The coefficient ' + rs(a) + ' is in lowest terms', gcd(a.n, a.d) === 1n);
    } else {
      chk('The decimal ' + decText + ' ' + (dec.exact ? 'is the exact value of ' + rs(rootQ) : 'is rounded from ' + rs(rootQ)), dec.exact ? O.eq(readDec(decText), rootQ) : true);
    }
    chk('A root is never negative: the principal square root of a non-negative number is non-negative', O.sgn(perfect ? rootQ : a) >= 0);

    /* ---------- rows ---------- */
    var rows = [];
    rows.push(['Radicand', rs(q), intIn ? 'The number under the root sign' : 'Held as an exact fraction']);
    rows.push(['Square root', exact, perfect ? 'Exact: the radicand is a perfect square' + (intIn ? '' : ' (numerator and denominator both are)') : 'Exact value as a simplified radical']);
    if (!perfect) rows.push(['Decimal', '≈ ' + decText, 'Rounded to ' + dec.places + ' place' + (dec.places === 1 ? '' : 's') + '; an irrational number never ends']);
    else rows.push(['Decimal', (dec.exact ? '' : '≈ ') + decText, dec.exact ? 'Exact, it ends' : 'Rounded to ' + places + ' places; the exact value is the fraction']);
    rows.push(['Type', perfect ? (rootQ.d === 1n ? 'Perfect square, whole-number root' : 'Perfect square of a fraction, rational root') : 'Irrational', perfect ? 'Both numerator and denominator are perfect squares' : (n === 0n ? '' : 'Not a perfect square, so the root cannot be written as a fraction')]);
    rows.push(['Exponent form', Q.mn(rs(q)).replace(/^(.*\/.*)$/, '($1)') + '^(1/2) = ' + exact, 'Square root is the power 1/2']);
    if (n !== 0n) rows.push(['Between', fl + ' and ' + (fl + 1n), 'Whole numbers either side of the root']);
    if (intIn && n !== 0n && !perfect) rows.push(['Nearest perfect squares', fl * fl + ' and ' + (fl + 1n) * (fl + 1n), fl + '² and ' + (fl + 1n) + '² either side of ' + n]);
    rows.push(['Power-back', '(' + exact + ')² = ' + rs(back), 'Squaring the exact result returns the radicand']);

    /* ---------- Newton's method estimate (for the page's estimation table) ---------- */
    var est = [];
    if (n !== 0n) { var hs = heron(q, 5); est = hs.map(function (g, i) { var sqg = O.mul(g, g); return { i: i, guess: fixedApprox(g, 10), square: fixedApprox(sqg, 10) }; }); }

    var sentence = title + ' = ' + exact + (perfect ? '' : ' ≈ ' + decText);
    var lines = ['Square root of ' + rs(q), title + ' = ' + exact, (perfect && dec.exact ? 'Decimal: ' : 'Decimal (' + dec.places + ' places, rounded): ') + (perfect && dec.exact ? '' : '≈ ') + decText, perfect ? 'Perfect square: yes' : 'Irrational: yes (not a perfect square)', 'Check: (' + exact + ')² = ' + rs(back)];
    return {
      ok: true, radicand: rs(q), radicandText: entered, title: title, places: places, perfect: perfect, irrational: irrational, zero: n === 0n, full: full,
      exact: exact, radical: radical, coeff: rs(a), under: String(m), rational: perfect ? rs(rootQ) : null,
      decimal: decText, decimalExact: perfect && dec.exact, decimalPlaces: dec.places, extended: dec.extended,
      floor: String(fl), valueText: exact, valueSub: perfect ? (dec.exact ? 'exact' : '≈ ' + decText) : '≈ ' + decText, sentence: sentence,
      rows: rows, steps: steps, verify: verify, verifyOk: ok, warnings: warnings, estimate: est, summary: lines.join('\n'),
      notes: [perfect ? 'The radicand is a perfect square, so the root is exact.' : 'The radicand is not a perfect square, so the exact answer is the radical ' + radical + ' and the decimal is an approximation.']
    };
  }

  /* helpers used by the checks */
  function sqrtSplit1(m) { var s = split(m); return s.s === 1n; }
  function readDec(t) { var r = Q.parseNum(t); return r.v; }
  function fixedApprox(q, p) {
    var n = q.n, dd = q.d, neg = n < 0n; if (neg) n = -n;
    var S = 10n ** BigInt(p), sc = (n * S * 2n + dd) / (dd * 2n), ip = sc / S, fp = String(sc % S);
    fp = p ? '0'.repeat(Math.max(0, p - fp.length)) + fp : '';
    return (neg && sc !== 0n ? '-' : '') + String(ip) + (p ? '.' + fp : '');
  }
  function sci(q) {
    if (O.isZero(q)) return '0';
    var n = q.n < 0n ? -q.n : q.n, e = n.toString().length - q.d.toString().length, i;
    for (i = 0; i < 4; i++) { var sc = e >= 0 ? R(n, q.d * 10n ** BigInt(e)) : R(n * 10n ** BigInt(-e), q.d); if (sc.n >= sc.d * 10n) e++; else if (sc.n < sc.d) e--; else break; }
    var mant = e >= 0 ? R(n, q.d * 10n ** BigInt(e)) : R(n * 10n ** BigInt(-e), q.d), P = 10n ** 3n, v = (mant.n * P * 2n + mant.d) / (mant.d * 2n);
    if (v >= P * 10n) { v /= 10n; e++; }
    var t = String(v); return t[0] + '.' + t.slice(1) + '×10' + (e < 0 ? '⁻' : '') + sup(Math.abs(e));
  }

  var api = { solve: solve, heron: heron, isBlank: isBlank, factorise: factorise, radText: radText, sqrtDecimal: sqrtDecimal, MAXPLACES: MAXPLACES, DEFPLACES: DEFPLACES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.SquareRoot = api;
})(typeof self !== 'undefined' ? self : this);
