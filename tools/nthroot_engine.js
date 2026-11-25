/* Elecmetric Root Calculator: exact engine for Mode 03 (General nth Root Calculator).
   The radicand is an exact rational number n/d (BigInt numerator and denominator) read by the Quadratic parser: whole numbers, decimals, scientific notation,
   fractions a/b and mixed numbers such as 2 1/2. The root index k is a whole number from 1 to 1000. The real (principal real) k-th root is returned in four forms:
   (1) exact rational, when n and d are both perfect k-th powers (detected with an integer k-th root, never with a decimal);
   (2) simplified radical a * root_j(m): a rational, m an integer with no prime repeated j or more times, the denominator rationalised, and the index reduced
       when every exponent under the root shares a factor with it (root_4(9) = root_2(3));
   (3) a decimal to a chosen number of places, computed with an integer k-th root so that no floating-point value is ever used (marked approximate when it is);
   (4) the equivalent exponent form x^(1/k).
   Odd index: every real number has one real root, with the sign of the radicand (the root of -32 for k = 5 is -2). Even index: a negative radicand has no real root;
   the answer is "no real result" and the principal complex root is named. Index 0 is undefined, a negative index is not an n-th root (it is a reciprocal power),
   and a fractional index belongs to the exponent calculator. The result is checked by raising it back to the index exactly (radical and rational forms) and by raising
   the rounded decimal back against a documented rounding bound. Works in Node (module.exports) and in the browser (global NthRoot, after Quad). */
(function (root) {
  'use strict';
  var Q = typeof require === 'function' && typeof module !== 'undefined' ? require('./quad_engine.js') : root.Quad;
  var R = Q.R, O = Q.ops, rs = Q.rs, gcd = Q.gcd, isqrt = Q.isqrt;
  var MAXPLACES = 50, DEFPLACES = 8, TRIAL = 200000, MAXTERM = 100, MAXINDEX = 1000, MAXNEWTON = 12;
  var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };

  function fail(msg, extra) { var r = { ok: false, error: msg, termIndex: -1 }; if (extra) for (var k in extra) r[k] = extra[k]; return r; }
  function hint(msg) { return { ok: false, empty: true, error: msg, hint: msg }; }
  function isBlank(s) { return String(s === undefined || s === null ? '' : s).trim() === ''; }
  function sup(n) { return String(n).split('').map(function (c) { return SUP[c]; }).join(''); }
  function pw(base, e) { return e === 1 ? String(base) : base + sup(e); }
  /* typographic minus for text meant to be copied or saved: a hyphen that starts a number, a root or a bracket becomes U+2212 */
  function U(s) { return String(s).replace(/(^|[^A-Za-z0-9])-(?=[\d∛√(⁰¹²³⁴⁵⁶⁷⁸⁹])/g, '$1\u2212'); }
  function sym(k) { return k === 2 ? '√' : k === 3 ? '∛' : sup(k) + '√'; }
  function ord(k) {
    var nm = { 1: 'first', 2: 'square', 3: 'cube', 4: 'fourth', 5: 'fifth', 6: 'sixth', 7: 'seventh', 8: 'eighth', 9: 'ninth', 10: 'tenth' };
    if (nm[k]) return nm[k] + ' root';
    var t = k % 100, s = t >= 11 && t <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[k % 10] || 'th');
    return k + s + ' root';
  }
  function pk(k) {
    if (k === 2) return 'square'; if (k === 3) return 'cube';
    var t = k % 100, sf = t >= 11 && t <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[k % 10] || 'th');
    return k + sf + ' power';
  }

  /* integer k-th root: floor(n^(1/k)) for n >= 0, k >= 1. Newton's iteration from a start that is never below the root (a double-precision estimate with a safety margin),
     then an exact correction so that the result is right even if the estimate were not. */
  function iroot(n, k) {
    if (n < 0n) throw new Error('iroot of negative');
    if (k === 1 || n < 2n) return n;
    if (k === 2) return isqrt(n);
    var bits = n.toString(2).length;
    if (bits <= k) return 1n;
    var K = BigInt(k), K1 = BigInt(k - 1), sh = bits > 53 ? bits - 53 : 0, top = Number(n >> BigInt(sh));
    var est = (Math.log2(top) + sh) / k, ip = Math.floor(est), mant = Math.pow(2, est - ip) * (1 + 1e-9), x;
    if (ip < 30) x = BigInt(Math.ceil(mant * Math.pow(2, ip))) + 1n;
    else x = (BigInt(Math.ceil(mant * 1073741824)) << BigInt(ip - 30)) + 1n;
    for (;;) { var y = (K1 * x + n / (x ** K1)) / K; if (y >= x) break; x = y; }
    while (x ** K > n) x -= 1n;
    while ((x + 1n) ** K <= n) x += 1n;
    return x;
  }
  function perfectPow(n, k) { var s = iroot(n, k); return s ** BigInt(k) === n; }

  /* n >= 1 BigInt -> {atoms: [[t, e], ...], full}: n = prod t^e. Trial division up to TRIAL. A leftover cofactor is a prime when no trial divisor could have missed a smaller factor;
     otherwise it is split as t^j when it is a perfect power, or kept as one unfactored atom, and full = false. */
  function factorAtoms(n) {
    var atoms = [], rest = n, p = 2n, lim = BigInt(TRIAL);
    if (n === 1n) return { atoms: atoms, full: true };
    while (p * p <= rest && p <= lim) {
      var e = 0; while (rest % p === 0n) { rest /= p; e++; }
      if (e) atoms.push([p, e]);
      p += p === 2n ? 1n : 2n;
    }
    var full = true;
    if (rest > 1n) {
      if (p * p > rest) atoms.push([rest, 1]);
      else {
        var found = false, jmax = rest.toString(2).length - 1;
        for (var j = jmax; j >= 2; j--) { var t = iroot(rest, j); if (t ** BigInt(j) === rest) { atoms.push([t, j]); found = true; full = p * p > t; break; } }
        if (!found) { atoms.push([rest, 1]); full = false; }
      }
    }
    return { atoms: atoms, full: full };
  }
  function factText(f) { return f.map(function (x) { return pw(x[0], x[1]); }).join(' × '); }
  function floorDiv(a, b) { var q = Math.floor(a / b); return q; }
  function bigTxt(s) { s = String(s); return s.length > 24 ? s.slice(0, 10) + '…' + s.slice(-4) + ' (' + s.length + ' digits)' : s; }

  /* coefficient a (rational >= 0), index j >= 2 and radicand m (integer >= 1) -> text such as 3∛2, 2·⁴√3, √3/2, 12 */
  function radText(a, m, j) {
    if (m === 1n) return rs(a);
    var core = sym(j) + m, dot = j >= 4 && a.n !== 1n ? '·' : '';
    var num = a.n === 1n ? core : a.n + dot + core;
    return a.d === 1n ? num : num + '/' + a.d;
  }

  function scaledText(v, pp) { var s = String(v); if (pp) { s = '0'.repeat(Math.max(0, pp + 1 - s.length)) + s; s = s.slice(0, s.length - pp) + '.' + s.slice(s.length - pp); } return s; }
  function digitsOf(x) { return String(x).length; }
  /* decimal text of the real k-th root of x = n/d > 0, rounded half up to p places with an integer root. At least 10 significant digits:
     if p places would show too few for a tiny value, more places are used and `extended` is set. */
  function rootDecimal(q, k, p) {
    var n = q.n, d = q.d, extended = false, pp = p, K = BigInt(k);
    function at(pl) { var S = 10n ** BigInt(k * (pl + 1)), u = iroot(n * S / d, k); return (u + 5n) / 10n; }
    var v = at(pp);
    if (v === 0n) {
      extended = true;
      var mag = Math.floor((digitsOf(n) - digitsOf(d)) / k);
      pp = Math.max(pp + 1, 12 - mag); v = at(pp);
      while (v < 1000000000n && pp < 4000) { pp += 1 + Math.floor(pp / 8); v = at(pp); }
    }
    return { text: scaledText(v, pp), places: pp, scaled: v, extended: extended };
  }
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

  /* Newton's iteration for the k-th root of x > 0 in fixed point (40 digits): g' = ((k-1) g + x / g^(k-1)) / k, started from the whole number above the root. */
  var FD = 40, FS = 10n ** 40n;
  function fpow(G, e) { var r = FS; for (var i = 0; i < e; i++) r = r * G / FS; return r; }
  function fshow(V) {
    var s = String(V), neg = false; if (s.length <= FD) s = '0'.repeat(FD + 1 - s.length) + s;
    var ip = s.slice(0, s.length - FD), fp = s.slice(s.length - FD);
    if (ip.length > 15) return ip[0] + '.' + ip.slice(1, 6) + '×10' + sup(ip.length - 1);
    var r = (BigInt(fp.slice(0, 10)) * 10n + BigInt(fp[10])) ; r = (r + 5n) / 10n; if (r >= 10n ** 10n) { ip = String(BigInt(ip) + 1n); r -= 10n ** 10n; }
    return ip + '.' + String(r).padStart(10, '0');
  }
  function newtonFixed(q, k, iterations) {
    iterations = iterations === undefined ? 5 : iterations;
    var X = q.n * FS / q.d, K = BigInt(k), g0 = iroot(q.n / q.d, k) + 1n, G = g0 * FS, out = [];
    for (var i = 0; i <= iterations; i++) {
      out.push({ i: i, guess: fshow(G), power: fshow(fpow(G, k)), g: G });
      var P1 = fpow(G, k - 1); G = ((K - 1n) * G + X * FS / P1) / K;
    }
    return out;
  }

  function parsePlaces(v) {
    if (v === undefined || v === null || v === '' || v === 'auto') return DEFPLACES;
    var p = Number(v);
    if (!isFinite(p) || p !== Math.floor(p) || p < 0 || p > MAXPLACES) return null;
    return p;
  }
  /* the root index: a whole number 1..MAXINDEX; a clear message for 0, a negative index, a fraction or text */
  function parseIndex(v) {
    if (v === undefined || v === null || String(v).trim() === '') return { hint: 'Enter the root index n, a whole number from 1 to ' + MAXINDEX + ': 2 for a square root, 3 for a cube root, 4 for a fourth root.' };
    var t = String(v).trim().replace(/,/g, ''), m = /^[+-]?\d+$/.exec(t);
    if (!m) {
      if (/^[+-]?(\d+\.\d*|\.\d+)$/.test(t) || /^[+-]?\d+\s*\/\s*\d+$/.test(t)) return { error: 'The root index must be a whole number. A fractional index such as ' + t + ' is a fractional power: use the Negative and Fractional Exponents Calculator for x^(1/' + t + ').' };
      return { error: 'The root index must be a whole number from 1 to ' + MAXINDEX + '.' };
    }
    if (t.replace(/^[+-]?0*/, '').length > 6) return { error: 'The root index must be a whole number from 1 to ' + MAXINDEX + '.' };
    var k = parseInt(t, 10);
    if (k === 0) return { error: 'A root index of 0 is undefined: the zeroth root of a number has no meaning. Use a whole number from 1 to ' + MAXINDEX + '.' };
    if (k < 0) return { error: 'A negative root index is not an n-th root. The root of index −n is the reciprocal of the root of index n: enter ' + (-k) + ' and take 1 ÷ result, or use the Negative and Fractional Exponents Calculator for x^(−1/' + (-k) + ').' };
    if (k > MAXINDEX) return { error: 'The root index is limited to ' + MAXINDEX + ' here. Use the Exponent Calculator for a larger index.' };
    return { k: k };
  }

  function solve(input) {
    input = input || {};
    var places = parsePlaces(input.places);
    if (places === null) return fail('Decimal places must be a whole number from 0 to ' + MAXPLACES + '.');
    var blankR = isBlank(input.radicand), pi = parseIndex(input.index);
    if (blankR) return hint('Enter the number under the root (the radicand), for example 81, −32, 0.0625 or 27/64.');
    if (pi.hint) return hint(pi.hint);
    var text = String(input.radicand).trim();
    var p = Q.parseNum(text);
    if (p.error) return fail(p.error.replace(/^Enter a value\.$/, 'Enter a number.'));
    if (pi.error) return fail(pi.error, { badIndex: true });
    var k = pi.k, K = BigInt(k), q = p.v, sg = O.sgn(q), negIn = sg < 0, aq = negIn ? O.neg(q) : q;
    var entered = text.replace(/,/g, '');
    var plain = /^\d+$/.test(entered) || /^\d*\.\d+$/.test(entered);
    var title = sym(k) + (plain ? entered : '(' + Q.mn(entered) + ')');
    if (k === 1) title = '¹√' + (plain ? entered : '(' + Q.mn(entered) + ')');

    if (negIn && k % 2 === 0) {
      var inner = solve({ radicand: rs(aq), index: k, places: places });
      var cx = null;
      if (inner.ok) cx = k === 2 ? (inner.perfect ? (inner.exact === '1' ? 'i' : inner.exact + ' i') : 'i × ' + inner.radical) : 'modulus ' + inner.exact + (inner.perfect ? '' : ' ≈ ' + inner.decimal) + ' at angle 180°/' + k;
      return fail(title + ' has no real result: an even power of a real number is never negative, so with the even index ' + k + ' only zero and positive numbers have a real root. A negative number has a real root only for an odd index.' + (cx ? ' In complex numbers the principal root is ' + cx + ' (a complex mode is planned).' : ''), { noReal: true, complex: cx, title: title, index: k });
    }

    var n = aq.n, d = aq.d, intIn = d === 1n;
    var steps = [], warnings = [], verify = [], ok = true;
    function chk(label, v) { verify.push([label, !!v]); if (!v) ok = false; }
    var isNeg = negIn && n !== 0n, absStr = rs(aq), sgnT = isNeg ? '-' : '';

    /* ---------- the exact value (of the absolute value, then the sign) ---------- */
    var perfect = perfectPow(n, k) && perfectPow(d, k);
    var fn = factorAtoms(n === 0n ? 1n : n), fd = factorAtoms(d), full = fn.full && fd.full;
    var rootQ = null, a, m = 1n, jIdx = k, tab = [];
    if (n === 0n) { rootQ = R(0n); a = R(0n); perfect = true; full = true; }
    else if (perfect) { rootQ = R(iroot(n, k), iroot(d, k)); a = rootQ; }
    else {
      /* every prime (or unfactored atom) t has a signed exponent x in n/d: x = e in the numerator, -f in the denominator. Write x = q k + r with 0 <= r < k:
         t^q comes out of the root (a negative q is a denominator: the denominator is rationalised) and t^r stays under it. */
      var an = 1n, ad = 1n, rem = [];
      fn.atoms.concat(fd.atoms.map(function (x) { return [x[0], -x[1]]; })).forEach(function (x) {
        var t = x[0], e = x[1], qq = floorDiv(e, k), r = e - qq * k;
        tab.push({ t: t, x: e, q: qq, r: r });
        if (qq > 0) an *= t ** BigInt(qq); else if (qq < 0) ad *= t ** BigInt(-qq);
        if (r > 0) rem.push([t, r]);
      });
      var g = k; rem.forEach(function (x) { g = Number(gcd(BigInt(g), BigInt(x[1]))); });
      jIdx = k / g;
      rem.forEach(function (x) { m *= x[0] ** BigInt(x[1] / g); });
      a = R(an, ad);
    }
    var radical = perfect ? null : radText(a, m, jIdx), exactAbs = perfect ? rs(rootQ) : radical;
    var exact = (isNeg ? '-' : '') + exactAbs, radicalS = perfect ? null : (isNeg ? '-' : '') + radical;
    var irrational = !perfect;
    var dec;
    if (perfect) { var de = ratDecimal(rootQ, places); dec = { text: de.text, exact: de.exact, places: de.places, extended: de.extended, scaled: de.scaled }; }
    else { var cd = rootDecimal(aq, k, places); dec = { text: cd.text, exact: false, places: cd.places, extended: cd.extended, scaled: cd.scaled }; }
    var decText = (isNeg ? '-' : '') + dec.text;
    var reduced = !perfect && jIdx !== k;

    /* ---------- working ---------- */
    var kn = sym(k), xName = intIn ? absStr : '(' + absStr + ')';
    steps.push('Read the radicand: x = ' + entered + (rs(q) !== entered ? ' = ' + rs(q) + ' (held as an exact fraction)' : '') + ' and the root index n = ' + k + (k === 2 ? ' (a square root)' : k === 3 ? ' (a cube root)' : '') + '.');
    if (k === 1) steps.push('Index 1: the first root of a number is the number itself, because y¹ = x gives y = x.');
    else steps.push('The real ' + ord(k) + ' ' + kn + 'x is the number y with y' + sup(k) + ' = x, that is y multiplied by itself ' + k + ' times gives x.' + (k % 2 === 1 ? ' With an odd index it exists for every real number and has the same sign as x.' : ' With an even index it exists only for x ≥ 0, and the principal root is the non-negative one.'));
    if (isNeg) steps.push('The radicand is negative and the index ' + k + ' is odd. Because (−y)' + sup(k) + ' = −y' + sup(k) + ', ' + kn + '(−x) = −' + kn + 'x: take the root of ' + absStr + ' first, then give the result a minus sign.');
    function factLine(label, v, f) {
      if (v === 1n) return label + ' 1 = 1 (no prime factors).';
      var s = label + ' ' + v + ' = ' + factText(f.atoms);
      if (!f.full) s += ' (the last factor is what remains after trial division up to ' + TRIAL.toLocaleString('en-US') + ' and may not be prime)';
      return s + '.';
    }
    function tabLines(rows) {
      return rows.map(function (x) {
        var t = bigTxt(x.t), s = (x.x < 0 ? 'The factor ' + t + ' is in the denominator, so its exponent counts as ' + String(x.x).replace('-', '−') + '. ' : '') + t + ' with exponent ' + String(x.x).replace('-', '−') + ': ' + String(x.x).replace('-', '−') + ' = ' + (x.q < 0 ? '(' + String(x.q).replace('-', '−') + ')' : x.q) + ' × ' + k + ' + ' + x.r + '. ';
        s += x.q === 0 ? 'Nothing comes out' : x.q > 0 ? t + (x.q > 1 ? sup(x.q) : '') + ' comes out' : t + ' comes out as a denominator' + (x.q < -1 ? ' (' + t + sup(-x.q) + ')' : '');
        s += x.r === 0 ? '.' : ' and ' + t + (x.r > 1 ? sup(x.r) : '') + ' stays under the root.';
        return s;
      });
    }
    if (n === 0n) steps.push('Zero is its own root of every index: 0' + sup(k) + ' = 0.');
    else if (k === 1) { /* nothing to factorise */ }
    else {
      if (intIn) steps.push(factLine('Factorise ' + (isNeg ? 'the size of the radicand:' : 'the radicand:'), n, fn));
      else { steps.push('Factorise the numerator and the denominator separately, because n/d is in lowest terms and they share no prime.'); steps.push(factLine('Numerator', n, fn)); steps.push(factLine('Denominator', d, fd)); }
      if (perfect) {
        steps.push('Every exponent is a multiple of ' + k + ', so ' + (intIn ? n + ' is a perfect ' + pk(k) : 'the numerator and the denominator are both perfect ' + pk(k) + 's') + ': ' + (intIn ? n + ' = ' + rootQ.n + sup(k) : n + ' = ' + rootQ.n + sup(k) + ' and ' + d + ' = ' + rootQ.d + sup(k)) + '.');
        steps.push('So ' + kn + (intIn ? n : '(' + n + '/' + d + ')') + ' = ' + (intIn ? rootQ.n : rootQ.n + '/' + rootQ.d) + ', because ' + (intIn ? rootQ.n : '(' + rootQ.n + '/' + rootQ.d + ')') + sup(k) + ' = ' + (intIn ? n : n + '/' + d) + (isNeg ? ', and therefore ' + kn + '(−' + absStr + ') = −' + rs(rootQ) + '.' : '.'));
      } else {
        steps.push('Divide each exponent by the index ' + k + ': the whole part is how many groups of ' + k + ' equal factors come out of the root, and the remainder stays under it. ' + (intIn ? '' : 'A prime from the denominator counts with a negative exponent, which also rationalises the denominator.'));
        tabLines(tab.slice(0, 14)).forEach(function (s) { steps.push(s); });
        if (tab.length > 14) steps.push('The remaining ' + (tab.length - 14) + ' factors are treated the same way.');
        if (reduced) steps.push('Every exponent under the root (' + tab.filter(function (x) { return x.r > 0; }).map(function (x) { return x.r; }).join(', ') + ') and the index ' + k + ' share the factor ' + (k / jIdx) + ', so the index and the exponents are divided by ' + (k / jIdx) + ': the root index falls from ' + k + ' to ' + jIdx + '.');
        steps.push('Therefore ' + kn + (intIn ? n : '(' + n + '/' + d + ')') + ' = ' + radical + ' (' + (a.n === 1n && a.d === 1n ? 'no factor comes out' : 'in simplest radical form') + (isNeg ? '), so the real root of the negative number is ' + radicalS + '.' : ').'));
        steps.push('The radicand ' + m + ' is not a perfect ' + pk(jIdx) + ', so ' + kn + (intIn ? absStr : '(' + absStr + ')') + ' is irrational: its decimal never ends and never repeats. The decimal is an approximation.');
      }
    }
    steps.push('Decimal' + (perfect ? '' : ' (rounded to ' + dec.places + ' place' + (dec.places === 1 ? '' : 's') + ')') + ': ' + kn + (isNeg || !intIn ? '(' + rs(q) + ')' : rs(q)) + (perfect && dec.exact ? ' = ' : ' ≈ ') + decText + '.');
    if (dec.extended) steps.push('More than ' + places + ' places are shown because the value is so small that ' + places + ' places would round it to 0.');

    /* ---------- warnings ---------- */
    if (!full) warnings.push('The radicand is too large to factor completely here. The radical is simplified as far as factors up to ' + TRIAL.toLocaleString('en-US') + ' reach, so it may still contain a larger repeated factor. The decimal and the checks are not affected.');

    /* ---------- exact checks ----------
       Whole-number (BigInt) cross-multiplication throughout, with no gcd on the large powers: a 1000th power of a 50-digit number has 50,000 digits. */
    var signedRoot = perfect ? (isNeg ? O.neg(rootQ) : rootQ) : (isNeg ? O.neg(a) : a);
    var bn = signedRoot.n ** K, bd = signedRoot.d ** K;
    if (!perfect) bn *= m ** BigInt(k / jIdx);
    var backOk = bn * q.d === q.n * bd, backTxt = backOk ? rs(q) : bigTxt(String(bn) + '/' + String(bd));
    chk('Raising the exact result to the power ' + k + ' gives back the radicand exactly: ' + (perfect ? '(' + rs(signedRoot) + ')' + sup(k) : '(' + radicalS + ')' + sup(k)) + ' = ' + backTxt, backOk);
    var fl = n === 0n ? 0n : iroot(n / d, k), flK = fl ** K, flK1 = (fl + 1n) ** K;
    chk(isNeg
      ? 'The root lies between the whole numbers −' + (fl + 1n) + ' and −' + fl + ': (−' + (fl + 1n) + ')' + sup(k) + ' < ' + Q.mn(bigTxt(rs(q))) + ' ≤ (−' + fl + ')' + sup(k)
      : 'The root lies between the whole numbers ' + fl + ' and ' + (fl + 1n) + ': ' + fl + sup(k) + ' ≤ ' + bigTxt(rs(q)) + ' < ' + (fl + 1n) + sup(k), n === 0n ? true : (flK * d <= n && n < flK1 * d));
    if (!perfect) {
      var s2 = 2n * dec.scaled, P2 = 2n * 10n ** BigInt(dec.places), s2k = s2 ** K, P2k = P2 ** K, hi = (s2 + 1n) ** K, lo = (s2 - 1n) ** K;
      var diffN = s2k * d - n * P2k, absN = diffN < 0n ? -diffN : diffN, boundN = (hi - s2k) * d, den = P2k * d;
      chk('Raising the rounded decimal ' + (isNeg ? '(−' + dec.text + ')' : dec.text) + ' to the power ' + k + ' gives ' + (isNeg ? '−' : '') + fixedRaw(s2k, P2k, Math.min(dec.places + 4, 60)) + ', which differs from the radicand by ' + sciRaw(absN, den) + ', within the rounding bound ' + sciRaw(boundN, den), absN <= boundN);
      chk('The decimal is the correctly rounded value: the true root is between ' + (isNeg ? '−' + fixedRaw(dec.scaled * 2n + 1n, 2n * 10n ** BigInt(dec.places), dec.places + 1) + ' and −' + fixedRaw(dec.scaled * 2n - 1n, 2n * 10n ** BigInt(dec.places), dec.places + 1) : fixedRaw(dec.scaled * 2n - 1n, 2n * 10n ** BigInt(dec.places), dec.places + 1) + ' and ' + fixedRaw(dec.scaled * 2n + 1n, 2n * 10n ** BigInt(dec.places), dec.places + 1)) + ' (half a unit either side of the last place)',
        lo * d <= n * P2k && n * P2k <= hi * d);
      var fm = factorAtoms(m), noRep = fm.atoms.every(function (x) { return x[1] < jIdx; }), irr = fm.atoms.reduce(function (gg, x) { return Number(gcd(BigInt(gg), BigInt(x[1]))); }, jIdx) === 1;
      chk('The radicand ' + bigTxt(m) + ' has no prime factor repeated ' + jIdx + ' times' + (full ? '' : ' up to ' + TRIAL.toLocaleString('en-US')) + ', so the radical is in simplest form' + (full ? '' : ' as far as checked'), noRep);
      chk('The index ' + jIdx + ' cannot be reduced: the exponents under the root do not all share a factor with it' + (full ? '' : ' (as far as the factoring reaches)'), irr);
      chk('The coefficient ' + rs(a) + ' is in lowest terms', gcd(a.n, a.d) === 1n);
    } else {
      chk('The decimal ' + decText + ' ' + (dec.exact ? 'is the exact value of ' + (isNeg ? '−' : '') + rs(rootQ) : 'is rounded from ' + (isNeg ? '−' : '') + rs(rootQ)), dec.exact ? dec.scaled * rootQ.d === rootQ.n * 10n ** BigInt(dec.places) : true);
    }
    chk(isNeg ? 'The real root of a negative number with an odd index is negative, as the radicand is' : n === 0n ? 'The root of zero is zero' : 'The real root of a positive number is positive, as the radicand is', O.sgn(signedRoot) === sg);

    /* ---------- rows ---------- */
    var rows = [];
    rows.push(['Radicand', rs(q), intIn ? 'The number under the root sign' : 'Held as an exact fraction']);
    rows.push(['Index', String(k), 'The ' + ord(k) + (k % 2 === 0 ? ' (even index)' : ' (odd index)')]);
    rows.push(['Root', exact, perfect ? 'Exact: the radicand is a perfect ' + pk(k) + '' + (intIn ? '' : ' (numerator and denominator both are)') : 'Exact value as a simplified radical']);
    if (!perfect) rows.push(['Decimal', '≈ ' + decText, 'Rounded to ' + dec.places + ' place' + (dec.places === 1 ? '' : 's') + '; an irrational number never ends']);
    else rows.push(['Decimal', (dec.exact ? '' : '≈ ') + decText, dec.exact ? 'Exact, it ends' : 'Rounded to ' + places + ' places; the exact value is the fraction']);
    rows.push(['Type', perfect ? (n === 0n ? 'Zero' : (rootQ.d === 1n ? 'Perfect ' + pk(k) + ', whole-number root' : 'Perfect ' + pk(k) + ' of a fraction, rational root')) : 'Irrational', perfect ? 'Both numerator and denominator are perfect ' + pk(k) + 's' : 'Not a perfect ' + pk(k) + ', so the root cannot be written as a fraction']);
    if (reduced) rows.push(['Index reduced', k + ' → ' + jIdx, 'Every exponent under the root shares the factor ' + (k / jIdx) + ' with the index']);
    rows.push(['Sign', n === 0n ? 'Zero' : isNeg ? 'Negative' : 'Positive', isNeg ? 'The real root of a negative number is negative (odd index)' : n === 0n ? 'Zero has no sign' : 'A positive number has a positive principal root']);
    if (isNeg) rows.push(['Exponent form', '−(' + (aq.d === 1n ? absStr : '(' + absStr + ')') + '^(1/' + k + ')) = ' + exact, 'Take the power 1/' + k + ' of the positive number, then restore the minus sign']);
    else rows.push(['Exponent form', (q.d === 1n ? rs(q) : '(' + rs(q) + ')') + '^(1/' + k + ') = ' + exact, 'The ' + ord(k) + ' is the power 1/' + k]);
    if (n !== 0n) rows.push(['Between', isNeg ? '-' + (fl + 1n) + ' and -' + fl : fl + ' and ' + (fl + 1n), 'Whole numbers either side of the root']);
    if (intIn && n !== 0n && !perfect) rows.push(['Nearest perfect powers', (isNeg ? '(−' + (fl + 1n) + ')' + sup(k) + ' = −' + bigTxt(flK1) + ' and (−' + fl + ')' + sup(k) + ' = −' + bigTxt(flK) : fl + sup(k) + ' = ' + bigTxt(flK) + ' and ' + (fl + 1n) + sup(k) + ' = ' + bigTxt(flK1)), 'Either side of ' + rs(q)]);
    rows.push(['Power-back', '(' + exact + ')' + sup(k) + ' = ' + backTxt, 'Raising the exact result to the index returns the radicand']);

    /* ---------- Newton's method estimate (for the page's estimation table; for a negative radicand it is the estimate for |x|; only for small indices) ---------- */
    var est = [];
    if (n !== 0n && k >= 2 && k <= MAXNEWTON) est = newtonFixed(aq, k, 5).map(function (e) { return { i: e.i, guess: e.guess, power: e.power }; });

    var sentence = title + ' = ' + exact + (perfect ? '' : ' ≈ ' + decText);
    var lines = [ord(k).replace(/^./, function (c) { return c.toUpperCase(); }) + ' of ' + rs(q), title + ' = ' + exact, (perfect && dec.exact ? 'Decimal: ' : 'Decimal (' + dec.places + ' places, rounded): ') + (perfect && dec.exact ? '' : '≈ ') + decText, perfect ? 'Perfect ' + pk(k) + ': yes' : 'Irrational: yes (not a perfect ' + pk(k) + ')', 'Check: (' + exact + ')' + sup(k) + ' = ' + backTxt];
    return {
      ok: true, radicand: rs(q), radicandText: entered, index: k, title: title, places: places, perfect: perfect, irrational: irrational, zero: n === 0n, negative: isNeg, full: full, reduced: reduced,
      exact: exact, radical: radicalS, coeff: perfect ? null : rs(isNeg ? O.neg(a) : a), under: perfect ? null : String(m), radIndex: perfect ? null : jIdx, rational: perfect ? rs(signedRoot) : null,
      decimal: decText, decimalExact: perfect && dec.exact, decimalPlaces: dec.places, extended: dec.extended,
      floor: String(fl), valueText: exact, valueSub: perfect ? (dec.exact ? 'exact' : '≈ ' + decText) : '≈ ' + decText, sentence: sentence,
      rows: rows, steps: steps, verify: verify, verifyOk: ok, warnings: warnings, estimate: est, summary: U(lines.join('\n')),
      notes: [perfect ? 'The radicand is a perfect ' + pk(k) + ', so the root is exact.' : 'The radicand is not a perfect ' + pk(k) + ', so the exact answer is the radical ' + radicalS + ' and the decimal is an approximation.'].concat(n === 0n ? [] : ['Every nonzero number has ' + k + ' complex ' + k + '-th roots. This calculator gives the principal real root' + (k % 2 === 1 ? ', which exists for every real number when the index is odd.' : ' of a non-negative number, the one used in measurement and engineering.')])
    };
  }

  /* helpers used by the checks (BigInt only, no gcd) */
  function fixedRaw(num, den, p) {
    var neg = num < 0n; if (neg) num = -num;
    var S = 10n ** BigInt(p), sc = (num * S * 2n + den) / (den * 2n), ip = sc / S, fp = String(sc % S);
    fp = p ? '0'.repeat(Math.max(0, p - fp.length)) + fp : '';
    var ips = String(ip); if (ips.length > 40) ips = ips.slice(0, 12) + '…(' + ips.length + ' digits)';
    return (neg && sc !== 0n ? '-' : '') + ips + (p ? '.' + fp : '');
  }
  function sciRaw(num, den) {
    if (num === 0n) return '0';
    if (num < 0n) num = -num;
    var e = num.toString().length - den.toString().length, i;
    function sc(ee) { return ee >= 0 ? [num, den * 10n ** BigInt(ee)] : [num * 10n ** BigInt(-ee), den]; }
    for (i = 0; i < 4; i++) { var r = sc(e); if (r[0] >= r[1] * 10n) e++; else if (r[0] < r[1]) e--; else break; }
    var mt = sc(e), P = 1000n, v = (mt[0] * P * 2n + mt[1]) / (mt[1] * 2n);
    if (v >= P * 10n) { v /= 10n; e++; }
    var t = String(v); return t[0] + '.' + t.slice(1) + '×10' + (e < 0 ? '⁻' : '') + sup(Math.abs(e));
  }

  var api = { solve: solve, parseIndex: parseIndex, iroot: iroot, isBlank: isBlank, factorAtoms: factorAtoms, radText: radText, rootDecimal: rootDecimal, newtonFixed: newtonFixed, MAXPLACES: MAXPLACES, DEFPLACES: DEFPLACES, MAXINDEX: MAXINDEX, MAXNEWTON: MAXNEWTON };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.NthRoot = api;
})(typeof self !== 'undefined' ? self : this);
