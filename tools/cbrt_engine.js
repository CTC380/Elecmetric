/* Elecmetric Root Calculator: exact engine for Mode 02 (Cube Root Calculator).
   The radicand is an exact rational number n/d (BigInt numerator and denominator) read by the Quadratic parser: whole numbers, decimals, scientific notation,
   fractions a/b and mixed numbers such as 2 1/2. Unlike a square root, a cube root exists for every real number, and it has the sign of the radicand:
   the real cube root of -8 is -2 because (-2)^3 = -8. The real (principal real) cube root is returned in four forms:
   (1) exact rational, when n and d are both perfect cubes (detected with an integer cube root, not with a decimal);
   (2) simplified radical a * cbrt(m), with a rational and m a cube-free integer (the denominator is rationalised: cbrt(1/2) = cbrt(4)/2);
   (3) a decimal to a chosen number of places, computed with an integer cube root so that no floating-point value is ever used (marked approximate when it is);
   (4) the equivalent exponent form x^(1/3) (for a negative x the root of |x| is taken first and the sign is restored).
   Zero gives 0. The result is checked by cubing it back exactly (radical and rational forms) and by cubing the rounded decimal against a documented rounding bound.
   Every nonzero number also has two complex cube roots; they are named in the notes, not computed as real values.
   Works in Node (module.exports) and in the browser (global CubeRoot, after Quad). */
(function (root) {
  'use strict';
  var Q = typeof require === 'function' && typeof module !== 'undefined' ? require('./quad_engine.js') : root.Quad;
  var R = Q.R, O = Q.ops, rs = Q.rs, gcd = Q.gcd, isqrt = Q.isqrt;
  var MAXPLACES = 50, DEFPLACES = 8, TRIAL = 200000, MAXTERM = 100;
  var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };

  function fail(msg, extra) { var r = { ok: false, error: msg, termIndex: -1 }; if (extra) for (var k in extra) r[k] = extra[k]; return r; }
  function hint(msg) { return { ok: false, empty: true, error: msg, hint: msg }; }
  function isBlank(s) { return String(s === undefined || s === null ? '' : s).trim() === ''; }
  function sup(n) { return String(n).split('').map(function (c) { return SUP[c]; }).join(''); }
  function pw(base, e) { return e === 1 ? String(base) : base + sup(e); }
  /* typographic minus for text meant to be copied or saved: a hyphen that starts a number, a root or a bracket becomes U+2212 */
  function U(s) { return String(s).replace(/(^|[^A-Za-z0-9])-(?=[\d∛√(])/g, '$1\u2212'); }

  /* integer cube root: floor(cbrt(n)) for n >= 0, by Newton's iteration from a start that is never below the root */
  function icbrt(n) {
    if (n < 0n) throw new Error('icbrt of negative');
    if (n < 2n) return n;
    var x = 1n << BigInt(Math.ceil(n.toString(2).length / 3));
    for (;;) { var y = (2n * x + n / (x * x)) / 3n; if (y >= x) return x; x = y; }
  }
  function perfectCube(n) { var s = icbrt(n); return s * s * s === n; }

  /* n >= 0 BigInt -> {s, a, b, r, full}: n = s^3 * r with r = a * b^2 cube-free (a, b square-free and coprime), as far as trial division up to TRIAL reaches.
     full = false when a large unfactored part may still hide a cube. */
  function cubeSplit(n) {
    if (n === 0n) return { s: 0n, a: 0n, b: 1n, r: 0n, full: true };
    var s = 1n, a = 1n, b = 1n, rest = n, p = 2n, lim = BigInt(TRIAL);
    while (p * p * p <= rest && p <= lim) {
      var e = 0; while (rest % p === 0n) { rest /= p; e++; }
      if (e) { s *= p ** BigInt(Math.floor(e / 3)); if (e % 3 === 1) a *= p; else if (e % 3 === 2) b *= p; }
      p += p === 2n ? 1n : 2n;
    }
    var full = rest === 1n || p * p * p > rest;
    if (rest > 1n) {
      var q = icbrt(rest);
      if (q * q * q === rest) { s *= q; full = true; }
      else { var h = isqrt(rest); if (h * h === rest) b *= h; else a *= rest; }
    }
    return { s: s, a: a, b: b, r: a * b * b, full: full };
  }

  /* prime factorisation of a whole number up to 1e12 with Number arithmetic; null when larger */
  function factorise(nb) {
    if (nb < 2n || nb > 1000000000000n) return null;
    var n = Number(nb), out = [], p = 2;
    while (p * p <= n) { var e = 0; while (n % p === 0) { n /= p; e++; } if (e) out.push([p, e]); p += p === 2 ? 1 : 2; }
    if (n > 1) out.push([n, 1]);
    return out;
  }
  function factText(f) { return f.map(function (x) { return pw(x[0], x[1]); }).join(' × '); }

  /* coefficient a (rational >= 0) and radicand m (integer >= 1) -> text such as 3∛2, ∛4/2, 5∛6/3, 12 */
  function radText(a, m) {
    if (m === 1n) return rs(a);
    var core = '∛' + m;
    var num = a.n === 1n ? core : a.n + core;
    return a.d === 1n ? num : num + '/' + a.d;
  }

  /* decimal text of the real number cbrt(x), x = n/d > 0, rounded half up to p places with an integer cube root. Always at least 10 significant digits:
     if p places would show 0 (or fewer than 10 significant digits for a tiny value), more places are used and `extended` is set. */
  function cbrtDecimal(q, p) {
    var n = q.n, d = q.d, extended = false, pp = p;
    function at(pl) { var S3 = 10n ** BigInt(3 * (pl + 1)), u = icbrt(n * S3 / d); return (u + 5n) / 10n; }
    var v = at(pp);
    if (v === 0n) {
      extended = true;
      while (v < 1000000000n && pp < 4000) { pp += 1 + Math.floor(pp / 8); v = at(pp); }
    }
    return { text: scaledText(v, pp), places: pp, scaled: v, extended: extended };
  }
  function scaledText(v, pp) { var s = String(v); if (pp) { s = '0'.repeat(Math.max(0, pp + 1 - s.length)) + s; s = s.slice(0, s.length - pp) + '.' + s.slice(s.length - pp); } return s; }
  /* decimal of an exact rational q > 0: the whole decimal when it ends (up to MAXTERM places), otherwise rounded half up to p places (more if that would show 0) */
  function ratDecimal(q, p) {
    var n = q.n, d = q.d, t = d, a = 0, b = 0;
    while (t % 2n === 0n) { t /= 2n; a++; } while (t % 5n === 0n) { t /= 5n; b++; }
    if (t === 1n && Math.max(a, b) <= MAXTERM) { var pl = Math.max(a, b), v0 = n * 10n ** BigInt(pl) / d; return { text: scaledText(v0, pl), exact: true, places: pl, scaled: v0, extended: false }; }
    function at(pl) { var S = 10n ** BigInt(pl); return (n * S * 2n + d) / (d * 2n); }
    var pp = p, v = at(pp), ext = false;
    if (v === 0n) { ext = true; while (v < 1000000000n && pp < 4000) { pp += 1 + Math.floor(pp / 8); v = at(pp); } }
    return { text: scaledText(v, pp), exact: false, places: pp, scaled: v, extended: ext };
  }
  function floorCbrtRational(q) { return icbrt(q.n / q.d); }

  /* Newton's iteration for cbrt(x), x > 0, in exact rationals: g' = (2g + x/g^2)/3. Returns the iterates. */
  function newton(q, iterations) {
    iterations = iterations === undefined ? 5 : iterations;
    var g = R(floorCbrtRational(q) + 1n), out = [g], x = q;
    for (var i = 0; i < iterations; i++) { g = O.div(O.add(O.mul(O.ri(2), g), O.div(x, O.mul(g, g))), O.ri(3)); out.push(g); }
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
    if (isBlank(input.radicand)) return hint('Enter a number to take the cube root of, for example 27, −8, 0.125 or 3/8.');
    var text = String(input.radicand).trim();
    var p = Q.parseNum(text);
    if (p.error) return fail(p.error.replace(/^Enter a value\.$/, 'Enter a number.'));
    var q = p.v, sg = O.sgn(q), negIn = sg < 0, aq = negIn ? O.neg(q) : q;

    var n = aq.n, d = aq.d, intIn = d === 1n, entered = text.replace(/,/g, '');
    var steps = [], warnings = [], verify = [], ok = true;
    function chk(label, v) { verify.push([label, !!v]); if (!v) ok = false; }
    var sgnT = negIn ? '-' : '';

    /* ---------- the exact value (of the absolute value, then the sign) ---------- */
    var perfect = perfectCube(n) && perfectCube(d);
    var sn = cubeSplit(n), sd = cubeSplit(d);
    var full = sn.full && sd.full;
    var a, m, rootQ = null;
    if (n === 0n) { a = R(0n); m = 1n; rootQ = R(0n); perfect = true; full = true; }
    else if (perfect) { rootQ = R(icbrt(n), icbrt(d)); a = rootQ; m = 1n; }
    else {
      /* cbrt(n/d) = s1*cbrt(r1) / (s2*cbrt(r2)) with r1 = a1*b1^2 and r2 = a2*b2^2 cube-free and, because n/d is in lowest terms, with no prime in common.
         Multiplying top and bottom by cbrt(a2^2 * b2) turns cbrt(r2) into a2*b2, so  cbrt(n/d) = s1 * cbrt(r1 * a2^2 * b2) / (s2 * a2 * b2); the radicand is still cube-free. */
      m = sn.r * sd.a * sd.a * sd.b; a = R(sn.s, sd.s * sd.a * sd.b);
    }
    var absRoot = perfect ? rootQ : a;
    var radical = radText(a, m), exactAbs = perfect ? rs(rootQ) : radical;
    var exact = (negIn && n !== 0n ? '-' : '') + exactAbs, radicalS = (negIn && n !== 0n ? '-' : '') + radical;
    var irrational = !perfect, isNeg = negIn && n !== 0n;
    var dec, decAbs, decApprox;
    if (perfect) { var de = ratDecimal(rootQ, places); dec = { text: de.text, exact: de.exact, places: de.exact ? de.places : de.places, extended: de.extended, scaled: de.scaled }; }
    else { var cd = cbrtDecimal(aq, places); dec = { text: cd.text, exact: false, places: cd.places, extended: cd.extended, scaled: cd.scaled }; }
    decAbs = dec.text; decApprox = !dec.exact;
    var decText = (isNeg ? '-' : '') + decAbs;

    var plain = /^\d+$/.test(entered) || /^\d*\.\d+$/.test(entered);
    var title = '∛' + (plain ? entered : '(' + Q.mn(entered) + ')');
    var absStr = rs(aq);

    /* ---------- working ---------- */
    steps.push('Read the radicand: x = ' + entered + (rs(q) !== entered ? ' = ' + rs(q) + ' (held as an exact fraction)' : '') + '.');
    steps.push('The real cube root ∛x is the number y with y × y × y = x. Unlike a square root it exists for every real number, and it has the same sign as x.');
    if (isNeg) steps.push('The radicand is negative. Because (−y)³ = −y³, ∛(−x) = −∛x: take the cube root of ' + absStr + ' first, then give the result a minus sign.');
    function partText(label, v, sp) {
      var f = factorise(v), t = label + ' ' + v;
      if (v === 1n) return label + ' 1 is a perfect cube (1 = 1³).';
      if (f) {
        var all3 = f.every(function (x) { return x[1] % 3 === 0; });
        if (f.length === 1 && f[0][1] === 1) return t + ' is a prime number, so it has no cube factor: ' + v + ' = 1³ × ' + v + '.';
        t += ' = ' + factText(f);
        if (all3) return t + '. Every exponent is a multiple of 3, so ' + v + ' is a perfect cube: ' + v + ' = ' + sp.s + '³.';
        return t + '. Take out triples of equal factors: ' + v + ' = ' + sp.s + '³ × ' + sp.r + (sp.s === 1n ? ' (no cube factor)' : '') + '.';
      }
      return t + ': ' + (perfectCube(v) ? v + ' = ' + sp.s + '³, a perfect cube (found with an integer cube root).' : v + ' = ' + sp.s + '³ × ' + sp.r + (sp.s === 1n ? ' (no cube factor found)' : '') + '.');
    }
    if (n === 0n) steps.push('Zero is its own cube root: 0 × 0 × 0 = 0.');
    else if (intIn) {
      steps.push(partText('Factorise ' + (isNeg ? 'the size of the radicand:' : 'the radicand:'), n, sn));
      if (perfect) steps.push('So ∛' + n + ' = ' + rootQ.n + ', because ' + rootQ.n + ' × ' + rootQ.n + ' × ' + rootQ.n + ' = ' + n + (isNeg ? ', and therefore ∛(−' + n + ') = −' + rootQ.n + '.' : '.'));
      else steps.push('Then ∛' + n + ' = ∛(' + sn.s + '³ × ' + sn.r + ') = ' + (sn.s === 1n ? '' : sn.s + ' × ') + '∛' + sn.r + (sn.s === 1n ? ' (already in simplest radical form)' : ' = ' + radical) + (isNeg ? ', so the real cube root of the negative number is ' + radicalS + '.' : '.'));
    } else {
      steps.push('Split the fraction: ∛(' + n + '/' + d + ') = ∛' + n + ' / ∛' + d + '.');
      steps.push(partText('Numerator', n, sn)); steps.push(partText('Denominator', d, sd));
      if (perfect) steps.push('Both are perfect cubes, so ∛(' + n + '/' + d + ') = ' + icbrt(n) + '/' + icbrt(d) + ' = ' + rs(rootQ) + (isNeg ? ', and the real cube root of the negative number is −' + rs(rootQ) + '.' : '.'));
      else {
        steps.push('So ∛(' + n + '/' + d + ') = ' + (sn.s === 1n ? '' : sn.s) + (sn.r === 1n ? '' : '∛' + sn.r) + ' / ' + (sd.s === 1n ? '' : sd.s) + (sd.r === 1n ? '' : '∛' + sd.r) + (sn.r === 1n ? ' (the top is a whole number)' : '') + '.');
        if (sd.r !== 1n) steps.push('Rationalise the denominator: multiply top and bottom by ∛(' + (sd.a * sd.a * sd.b) + '), because ∛' + sd.r + ' × ∛' + (sd.a * sd.a * sd.b) + ' = ∛' + (sd.r * sd.a * sd.a * sd.b) + ' = ' + (sd.a * sd.b) + '. The top becomes ' + (sn.s === 1n ? '' : sn.s + ' × ') + '∛' + m + ' and the bottom ' + (sd.s * sd.a * sd.b) + '.');
        steps.push('Reduce the coefficient to lowest terms: the simplified radical is ' + radical + (isNeg ? ', so the real cube root of the negative number is ' + radicalS + '.' : '.'));
      }
    }
    if (!perfect) steps.push('The radicand ' + m + ' is not a perfect cube, so ∛' + (intIn ? absStr : '(' + absStr + ')') + ' is irrational: its decimal never ends and never repeats. The decimal is an approximation.');
    steps.push('Decimal' + (perfect ? '' : ' (rounded to ' + dec.places + ' place' + (dec.places === 1 ? '' : 's') + ')') + ': ∛' + (isNeg || !intIn ? '(' + rs(q) + ')' : rs(q)) + (perfect && dec.exact ? ' = ' : ' ≈ ') + decText + '.');
    if (dec.extended) steps.push('More than ' + places + ' places are shown because the value is so small that ' + places + ' places would round it to 0.');

    /* ---------- warnings ---------- */
    if (!full) warnings.push('The radicand is too large to factor completely here. The radical is simplified as far as factors up to ' + TRIAL.toLocaleString('en-US') + ' reach, so it may still contain a larger cube factor. The decimal and the checks are not affected.');
    if (!intIn && !perfect) warnings.push('The denominator was rationalised, so ' + radicalS + ' is the same number as ∛(' + rs(q) + ') written without a root in the denominator.');

    /* ---------- exact checks ---------- */
    var signedRoot = perfect ? (isNeg ? O.neg(rootQ) : rootQ) : (isNeg ? O.neg(a) : a);
    var back = perfect ? O.mul(O.mul(signedRoot, signedRoot), signedRoot) : O.mul(O.mul(O.mul(signedRoot, signedRoot), signedRoot), O.ri(m));
    chk('Cubing the exact result gives back the radicand exactly: ' + (perfect ? '(' + rs(signedRoot) + ')³ = ' + rs(back) : '(' + radicalS + ')³ = ' + rs(back)), O.eq(back, q));
    var fl = n === 0n ? 0n : floorCbrtRational(aq);
    var lo = O.mul(O.mul(R(fl), R(fl)), R(fl)), hi = O.mul(O.mul(R(fl + 1n), R(fl + 1n)), R(fl + 1n));
    chk(isNeg
      ? 'The root lies between the whole numbers −' + (fl + 1n) + ' and −' + fl + ': −' + (fl + 1n) + '³ < ' + Q.mn(rs(q)) + ' ≤ −' + fl + '³'
      : 'The root lies between the whole numbers ' + fl + ' and ' + (fl + 1n) + ': ' + fl + '³ ≤ ' + rs(q) + ' < ' + (fl + 1n) + '³', n === 0n ? true : (O.sgn(O.sub(aq, lo)) >= 0 && O.sgn(O.sub(hi, aq)) > 0));
    if (!perfect) {
      var P = 10n ** BigInt(dec.places), rp = R(dec.scaled, P), cu = O.mul(O.mul(rp, rp), rp), diff = O.sub(cu, aq);
      var h = R(1n, 2n * P), bound = O.mul(h, O.add(O.add(O.mul(O.ri(3), O.mul(rp, rp)), O.mul(O.ri(3), O.mul(rp, h))), O.mul(h, h)));
      var absd = O.sgn(diff) < 0 ? O.neg(diff) : diff;
      chk('Cubing the rounded decimal ' + (isNeg ? '(−' + decAbs + ')' : decAbs) + ' gives ' + (isNeg ? '−' : '') + fixedApprox(cu, Math.min(dec.places + 4, 60)) + ', which differs from the radicand by ' + sci(absd) + ', within the rounding bound ' + sci(bound), O.sgn(O.sub(bound, absd)) >= 0);
      var lowQ = R(dec.scaled * 2n - 1n, 2n * P), highQ = R(dec.scaled * 2n + 1n, 2n * P);
      chk('The decimal is the correctly rounded value: the true root is between ' + (isNeg ? '−' + fixedApprox(highQ, dec.places + 1) + ' and −' + fixedApprox(lowQ, dec.places + 1) : fixedApprox(lowQ, dec.places + 1) + ' and ' + fixedApprox(highQ, dec.places + 1)) + ' (half a unit either side of the last place)',
        O.sgn(O.sub(cube(lowQ), aq)) <= 0 && O.sgn(O.sub(cube(highQ), aq)) >= 0);
      chk('The radicand ' + m + ' has no prime factor repeated three times' + (full ? '' : ' up to ' + TRIAL.toLocaleString('en-US')) + ', so the radical is in simplest form' + (full ? '' : ' as far as checked'), cubeFreeSmall(m));
      chk('The coefficient ' + rs(a) + ' is in lowest terms', gcd(a.n, a.d) === 1n);
    } else {
      chk('The decimal ' + decText + ' ' + (dec.exact ? 'is the exact value of ' + (isNeg ? '−' : '') + rs(rootQ) : 'is rounded from ' + (isNeg ? '−' : '') + rs(rootQ)), dec.exact ? O.eq(R(dec.scaled, 10n ** BigInt(dec.places)), rootQ) : true);
    }
    chk(isNeg ? 'The real cube root of a negative number is negative, as the radicand is' : n === 0n ? 'The cube root of zero is zero' : 'The real cube root of a positive number is positive, as the radicand is', O.sgn(signedRoot) === sg);

    /* ---------- rows ---------- */
    var rows = [], aRootT = exactAbs;
    rows.push(['Radicand', rs(q), intIn ? 'The number under the root sign' : 'Held as an exact fraction']);
    rows.push(['Cube root', exact, perfect ? 'Exact: the radicand is a perfect cube' + (intIn ? '' : ' (numerator and denominator both are)') : 'Exact value as a simplified radical']);
    if (!perfect) rows.push(['Decimal', '≈ ' + decText, 'Rounded to ' + dec.places + ' place' + (dec.places === 1 ? '' : 's') + '; an irrational number never ends']);
    else rows.push(['Decimal', (dec.exact ? '' : '≈ ') + decText, dec.exact ? 'Exact, it ends' : 'Rounded to ' + places + ' places; the exact value is the fraction']);
    rows.push(['Type', perfect ? (n === 0n ? 'Zero' : (rootQ.d === 1n ? 'Perfect cube, whole-number root' : 'Perfect cube of a fraction, rational root')) : 'Irrational', perfect ? 'Both numerator and denominator are perfect cubes' : 'Not a perfect cube, so the root cannot be written as a fraction']);
    rows.push(['Sign', n === 0n ? 'Zero' : isNeg ? 'Negative' : 'Positive', isNeg ? 'The real cube root of a negative number is negative' : n === 0n ? 'Zero has no sign' : 'A positive number has a positive cube root']);
    if (isNeg) rows.push(['Exponent form', '−(' + (aq.d === 1n ? absStr : '(' + absStr + ')') + '^(1/3)) = ' + exact, 'Take the power 1/3 of the positive number, then restore the minus sign']);
    else rows.push(['Exponent form', (q.d === 1n ? rs(q) : '(' + rs(q) + ')') + '^(1/3) = ' + exact, 'Cube root is the power 1/3']);
    if (n !== 0n) rows.push(['Between', isNeg ? '-' + (fl + 1n) + ' and -' + fl : fl + ' and ' + (fl + 1n), 'Whole numbers either side of the root']);
    if (intIn && n !== 0n && !perfect) rows.push(['Nearest perfect cubes', isNeg ? '-' + (fl + 1n) ** 3n + ' and -' + fl * fl * fl : fl * fl * fl + ' and ' + (fl + 1n) ** 3n, (isNeg ? '(−' + (fl + 1n) + ')³ and (−' + fl + ')³ either side of ' : fl + '³ and ' + (fl + 1n) + '³ either side of ') + rs(q)]);
    rows.push(['Power-back', '(' + exact + ')³ = ' + rs(back), 'Cubing the exact result returns the radicand']);

    /* ---------- Newton's method estimate (for the page's estimation table; for a negative radicand it is the estimate for |x|) ---------- */
    var est = [];
    if (n !== 0n) { var hs = newton(aq, 5); est = hs.map(function (g, i) { var cg = cube(g); return { i: i, guess: fixedApprox(g, 10), cube: fixedApprox(cg, 10) }; }); }

    var sentence = title + ' = ' + exact + (perfect ? '' : ' ≈ ' + decText);
    var lines = ['Cube root of ' + rs(q), title + ' = ' + exact, (perfect && dec.exact ? 'Decimal: ' : 'Decimal (' + dec.places + ' places, rounded): ') + (perfect && dec.exact ? '' : '≈ ') + decText, perfect ? 'Perfect cube: yes' : 'Irrational: yes (not a perfect cube)', 'Check: (' + exact + ')³ = ' + rs(back)];
    return {
      ok: true, radicand: rs(q), radicandText: entered, title: title, places: places, perfect: perfect, irrational: irrational, zero: n === 0n, negative: isNeg, full: full,
      exact: exact, radical: radicalS, coeff: rs(isNeg ? O.neg(a) : a), under: String(m), rational: perfect ? rs(signedRoot) : null,
      decimal: decText, decimalExact: perfect && dec.exact, decimalPlaces: dec.places, extended: dec.extended,
      floor: String(fl), valueText: exact, valueSub: perfect ? (dec.exact ? 'exact' : '≈ ' + decText) : '≈ ' + decText, sentence: sentence,
      rows: rows, steps: steps, verify: verify, verifyOk: ok, warnings: warnings, estimate: est, summary: U(lines.join('\n')),
      notes: [perfect ? 'The radicand is a perfect cube, so the root is exact.' : 'The radicand is not a perfect cube, so the exact answer is the radical ' + radicalS + ' and the decimal is an approximation.'].concat(n === 0n ? [] : ['Every nonzero number has three cube roots: one real and two complex. This calculator gives the real cube root, which is the one used in measurement and engineering.'])
    };
  }

  /* helpers used by the checks */
  function cube(x) { return O.mul(O.mul(x, x), x); }
  function cubeFreeSmall(mm) { var s = cubeSplit(mm); return s.s === 1n; }
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

  var api = { solve: solve, newton: newton, isBlank: isBlank, factorise: factorise, radText: radText, icbrt: icbrt, cubeSplit: cubeSplit, cbrtDecimal: cbrtDecimal, MAXPLACES: MAXPLACES, DEFPLACES: DEFPLACES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.CubeRoot = api;
})(typeof self !== 'undefined' ? self : this);
