/* Elecmetric GCF Calculator: exact engine for Mode 01 (Multiple Number GCF).
   Greatest common factor (GCD, HCF) of 2 to 20 integers, in BigInt, so there is no floating-point precision loss.
   Production algorithm: the modulo-based Euclidean algorithm, applied one number at a time (GCF(a, b, c) = GCF(GCF(a, b), c)).
   Conventions (CEO note): the GCF is non-negative; signs are ignored (GCF(-24, 36) = 12); zeros are allowed (GCF(0, n) = |n|);
   GCF(0, 0, ..., 0) is undefined, because every integer divides 0 and so there is no greatest common divisor.
   Prime factorisation is used for the explanation only, and only when every number is small enough to factor at once (trial division up to FACTOR_LIMIT);
   larger numbers are handled by the Euclidean algorithm alone. The LCM is divided before it is multiplied: LCM = a / GCF x b.
   Works in Node (module.exports) and in the browser (global GCF). */
(function (root) {
  'use strict';
  var MAX_TERMS = 20, MAX_DIGITS = 500, FACTOR_LIMIT = 1000000000000n; /* 10^12: trial division stops at 10^6 */
  var TH = ['\u2212', '\u2013', '\u2014', '\u2012'];

  function fail(msg, idx) { return { ok: false, error: msg, termIndex: idx === undefined ? -1 : idx }; }
  function hint(msg) { return { ok: false, empty: true, error: msg, hint: msg }; }
  function abs(x) { return x < 0n ? -x : x; }
  function gcd(a, b) { a = abs(a); b = abs(b); while (b !== 0n) { var t = a % b; a = b; b = t; } return a; }
  function lcm2(a, b) { a = abs(a); b = abs(b); if (a === 0n || b === 0n) return 0n; return a / gcd(a, b) * b; }
  function cut(s) { s = String(s); return s.length > 40 ? s.slice(0, 18) + '\u2026' + s.slice(-18) + ' (' + s.length + ' digits)' : s; }

  /* Split the text into tokens: commas, semicolons, spaces, tabs and line breaks all separate numbers. */
  function tokens(text) {
    var s = String(text === undefined || text === null ? '' : text);
    TH.forEach(function (c) { s = s.split(c).join('-'); });
    s = s.replace(/\u00a0/g, ' ').replace(/\band\b/gi, ' ');
    return s.split(/[\s,;]+/).filter(function (t) { return t !== ''; });
  }
  function parseList(text) {
    var tk = tokens(text), out = [];
    if (tk.length === 0) return hint('Type two or more whole numbers, separated by commas, for example 16, 88, 104.');
    for (var i = 0; i < tk.length; i++) {
      var t = tk[i];
      if (/^[+-]?\d+\.0*$/.test(t)) t = t.replace(/\.0*$/, ''); /* 12.0 is the integer 12 */
      if (!/^[+-]?\d+$/.test(t)) {
        if (/^[+-]?(\d+\.\d*|\.\d+)$/.test(t)) return fail('\u201c' + tk[i] + '\u201d is not a whole number. The GCF is defined for integers. To reduce a decimal or a fraction, use the Fraction Simplifier.', i);
        if (/^[+-]?\d+\/\d+$/.test(t)) return fail('\u201c' + tk[i] + '\u201d is a fraction. Enter whole numbers only, or use the Fraction Simplifier to reduce a fraction.', i);
        return fail('\u201c' + tk[i].slice(0, 30) + '\u201d is not a whole number. Use digits only, with an optional + or - sign, and separate numbers with commas.', i);
      }
      var digits = t.replace(/^[+-]/, '').replace(/^0+(?=\d)/, '');
      if (digits.length > MAX_DIGITS) return fail('A number can have at most ' + MAX_DIGITS + ' digits. \u201c' + cut(tk[i]) + '\u201d has ' + digits.length + '.', i);
      out.push(BigInt(t));
    }
    if (out.length < 2) return hint('Enter at least two whole numbers, separated by commas. One number has no common factor to find.');
    if (out.length > MAX_TERMS) return fail('Enter at most ' + MAX_TERMS + ' numbers. You entered ' + out.length + '.', MAX_TERMS);
    return { ok: true, nums: out };
  }

  /* Prime factorisation by trial division (2, 3, then 6k +/- 1). Returns [[p, e], ...] or null when n is too large to factor here. n >= 2. */
  function factor(n) {
    n = abs(n); if (n < 2n) return []; if (n > FACTOR_LIMIT) return null;
    var m = Number(n), out = [], p, e;
    function take(p) { e = 0; while (m % p === 0) { m = m / p; e++; } if (e) out.push([BigInt(p), e]); }
    take(2); take(3);
    for (p = 5; p * p <= m; p += 6) { take(p); take(p + 2); }
    if (m > 1) out.push([BigInt(m), 1]);
    return out;
  }
  function fmtF(f, sup) {
    if (!f.length) return '1';
    return f.map(function (x) { return String(x[0]) + (x[1] > 1 ? (sup ? '^' + x[1] : '^' + x[1]) : ''); }).join(' \u00d7 ');
  }
  function fprod(f) { var v = 1n; f.forEach(function (x) { for (var i = 0; i < x[1]; i++) v *= x[0]; }); return v; }

  function divides(g, n) { return g === 0n ? n === 0n : n % g === 0n; }

  function solve(opts) {
    opts = opts || {};
    var list = Array.isArray(opts.nums) ? { ok: true, nums: opts.nums.map(function (x) { return BigInt(x); }) } : parseList(opts.text);
    if (!list.ok) return list;
    var nums = list.nums, n = nums.length, absn = nums.map(abs), i;
    var warnings = [], notes = [];
    var anyNeg = nums.some(function (x) { return x < 0n; }), zeros = nums.filter(function (x) { return x === 0n; }).length;
    var nz = absn.filter(function (x) { return x !== 0n; });
    var entered = nums.map(String);

    if (nz.length === 0) {
      return { ok: true, status: 'undefined', count: n, entered: entered, abs: absn.map(String), gcf: null, gcfText: 'Undefined', valueText: 'GCF = undefined',
        sentence: 'GCF(' + entered.join(', ') + ') is undefined',
        steps: ['Every number you entered is 0.', 'Every integer divides 0, so the common divisors of 0, 0, \u2026 are all the integers and there is no greatest one.', 'The greatest common factor of only zeros is therefore undefined. Enter at least one number that is not 0.'],
        verify: [['Every entered number is 0', true], ['0 has no greatest divisor, so the GCF is left undefined rather than shown as 0', true]], verifyOk: true, warnings: [],
        rows: [['Numbers entered', entered.join(', '), 'all zero'], ['GCF', 'undefined', 'no greatest common divisor']],
        summary: 'GCF(' + entered.join(', ') + ') is undefined: every integer divides 0, so there is no greatest common divisor.', notes: [] };
    }

    /* --- Euclidean algorithm, one number at a time (zeros do not change the running value, because GCF(0, x) = |x|) --- */
    var euclid = [], g = null, run = [];
    absn.forEach(function (v, k) {
      if (g === null) { g = v; run.push({ idx: k, before: null, value: v, divs: [] }); return; }
      var a = g, b = v, divs = [];
      if (b === 0n) { run.push({ idx: k, before: a, value: a, divs: [], zero: true }); return; }
      if (a === 0n) { g = b; run.push({ idx: k, before: a, value: b, divs: [], fromZero: true }); return; }
      var x = a, y = b;
      if (x < y) { var t0 = x; x = y; y = t0; } /* larger first */
      while (y !== 0n) { var q = x / y, r = x % y; divs.push({ a: x, b: y, q: q, r: r }); x = y; y = r; }
      g = x; run.push({ idx: k, before: a, value: g, divs: divs, swapped: a < b });
    });
    var gcf = g;
    var rev = 0n; for (i = n - 1; i >= 0; i--) rev = gcd(rev, absn[i]);

    /* --- Prime factorisation of each non-zero number, when all are small enough --- */
    var fac = null, factorNote = '';
    var tooBig = nz.some(function (x) { return x > FACTOR_LIMIT; });
    if (!tooBig) {
      fac = absn.map(function (x) { return x === 0n ? null : factor(x); });
    } else factorNote = 'At least one number is above 10^12, so it is not factorised here. The Euclidean algorithm does not need the prime factors, which is why it is the method used for large numbers.';

    var common = null, gcfFactors = null;
    if (fac) {
      var primes = {}, order = [];
      fac.forEach(function (f) { if (f) f.forEach(function (x) { var k = String(x[0]); if (!(k in primes)) { primes[k] = x[0]; order.push(x[0]); } }); });
      order.sort(function (a, b) { return a < b ? -1 : a > b ? 1 : 0; });
      common = []; gcfFactors = [];
      order.forEach(function (p) {
        var exps = fac.map(function (f) { if (!f) return null; var hit = f.filter(function (x) { return x[0] === p; })[0]; return hit ? hit[1] : 0; });
        var present = exps.filter(function (e) { return e !== null; });
        var lo = Math.min.apply(null, present);
        common.push({ p: p, exps: exps, min: lo });
        if (lo > 0) gcfFactors.push([p, lo]);
      });
    }

    var quotients = absn.map(function (v) { return v / gcf; });
    var qg = 0n; quotients.forEach(function (q) { qg = gcd(qg, q); });
    var L = 0n; if (zeros === 0) { L = 1n; absn.forEach(function (v) { L = lcm2(L, v); }); }
    var coprime = gcf === 1n;
    var pairwise = null;
    if (n === 2 && zeros === 0) pairwise = (absn[0] * absn[1] === gcf * L);

    /* --- Working text --- */
    var steps = [];
    if (anyNeg) steps.push('Signs are ignored: the GCF of ' + entered.join(', ') + ' is the GCF of ' + absn.join(', ') + '. The GCF is never negative.');
    if (zeros) steps.push('A zero divides by every number and does not change the GCF, because GCF(0, n) = |n|. The ' + (zeros === 1 ? 'zero' : zeros + ' zeros') + ' can be set aside. The GCF is found from ' + nz.join(', ') + '.');
    run.forEach(function (st, k) {
      if (k === 0) return;
      var label = 'Take GCF(' + st.before + ', ' + absn[st.idx] + ')';
      if (st.zero) { steps.push(label + ' = ' + st.before + ' (the other number is 0).'); return; }
      if (st.fromZero) { steps.push(label + ' = ' + st.value + ' (GCF(0, n) = |n|).'); return; }
      steps.push(label + ' by the Euclidean algorithm, dividing the larger by the smaller and repeating on the remainder until it is 0:');
      st.divs.forEach(function (d, j) { steps.push('   ' + d.a + ' = ' + d.b + ' \u00d7 ' + d.q + ' + ' + d.r + (d.r === 0n ? '   (remainder 0, stop; the last divisor ' + d.b + ' is the GCF)' : '')); });
    });
    var euclidFirst = run.length ? run[0].value : gcf;
    if (n > 2 || zeros) steps.push('The GCF of all the numbers is ' + gcf + '. It is found one number at a time, GCF(GCF(a, b), c), and does not depend on the order.');
    else steps.push('So GCF(' + absn[0] + ', ' + absn[1] + ') = ' + gcf + '.');

    var primeSteps = [];
    if (fac) {
      absn.forEach(function (v, k) { primeSteps.push(v === 0n ? '0 has no prime factorisation (every prime divides 0), so it does not limit the GCF.' : (v === 1n ? '1 has no prime factors: 1 = 1.' : v + ' = ' + fmtF(fac[k]))); });
      if (gcfFactors.length) {
        primeSteps.push('Keep each prime that is a factor of every non-zero number, with its lowest power: ' + gcfFactors.map(function (x) { return x[0] + (x[1] > 1 ? '^' + x[1] : ''); }).join(', ') + '.');
        primeSteps.push('Multiply them: GCF = ' + fmtF(gcfFactors) + ' = ' + gcf + '.');
      } else primeSteps.push('No prime is a factor of every non-zero number, so the only common factor is 1 and GCF = 1.');
    }

    /* --- Checks --- */
    var verify = [];
    verify.push(['The GCF ' + gcf + ' divides every number entered', absn.every(function (v) { return divides(gcf, v); })]);
    verify.push(['The numbers divided by the GCF (' + quotients.map(String).map(cut).join(', ') + ') share no factor above 1, so no larger common factor exists', qg === 1n]);
    verify.push(['The result is the same when the numbers are taken in reverse order', rev === gcf]);
    verify.push(['The GCF is not negative and is at most the smallest non-zero number', gcf > 0n && nz.every(function (v) { return gcf <= v; })]);
    if (fac) {
      var back = true; absn.forEach(function (v, k) { if (fac[k] && fprod(fac[k]) !== (v < 2n ? 1n : v)) back = false; });
      verify.push(['Each prime factorisation multiplies back to its number', back]);
      verify.push(['The product of the common prime powers equals the Euclidean result', fprod(gcfFactors) === gcf]);
    }
    if (zeros === 0) verify.push(['The LCM ' + cut(L) + ' is a multiple of every number entered', absn.every(function (v) { return L % v === 0n; })]);
    if (pairwise !== null) verify.push(['For two numbers, GCF \u00d7 LCM equals the product of the two numbers', pairwise]);
    var verifyOk = verify.every(function (v) { return v[1] === true; });

    /* --- Rows, warnings, summary --- */
    var rows = [
      ['Numbers entered', entered.map(cut).join(', '), n + ' numbers'],
      ['GCF (GCD, HCF)', String(gcf), coprime ? 'the numbers are relatively prime' : 'largest whole number dividing all of them']
    ];
    if (fac) rows.push(['GCF as prime powers', gcfFactors.length ? fmtF(gcfFactors) : '1', 'lowest power of each common prime']);
    rows.push(['LCM', zeros === 0 ? String(L) : '0', zeros === 0 ? 'least common multiple, divided before multiplied' : 'the LCM with a zero is 0']);
    rows.push(['Numbers \u00f7 GCF', quotients.map(String).map(cut).join(', '), 'the numbers in lowest terms']);
    if (pairwise !== null) rows.push(['GCF \u00d7 LCM = product', gcf + ' \u00d7 ' + L + ' = ' + (gcf * L) + (pairwise ? ' = ' + absn[0] + ' \u00d7 ' + absn[1] : ''), 'holds for two numbers']);
    if (coprime) warnings.push('The GCF is 1, so these numbers are relatively prime (coprime): they share no common factor above 1.');
    if (factorNote) notes.push(factorNote);
    var summary = 'GCF(' + entered.map(cut).join(', ') + ') = ' + gcf + (fac && gcfFactors.length ? '  (' + fmtF(gcfFactors) + ')' : '') + '\nLCM = ' + (zeros === 0 ? L : 0) + '\nNumbers divided by the GCF: ' + quotients.map(String).map(cut).join(', ');

    return { ok: true, status: coprime ? 'coprime' : 'ok', count: n, entered: entered, abs: absn.map(String), zeros: zeros, negatives: anyNeg,
      gcf: String(gcf), gcfText: String(gcf), valueText: 'GCF = ' + String(gcf), sentence: 'GCF(' + entered.map(cut).join(', ') + ') = ' + gcf,
      lcm: zeros === 0 ? String(L) : '0', quotients: quotients.map(String), coprime: coprime,
      euclid: run.map(function (s) { return { idx: s.idx, before: s.before === null ? null : String(s.before), value: String(s.value), divs: s.divs.map(function (d) { return [String(d.a), String(d.b), String(d.q), String(d.r)]; }) }; }),
      factors: fac ? fac.map(function (f) { return f ? f.map(function (x) { return [String(x[0]), x[1]]; }) : null; }) : null,
      common: common ? common.map(function (c) { return { p: String(c.p), exps: c.exps, min: c.min }; }) : null,
      gcfFactors: gcfFactors ? gcfFactors.map(function (x) { return [String(x[0]), x[1]]; }) : null,
      gcfFactorText: gcfFactors ? (gcfFactors.length ? fmtF(gcfFactors) : '1') : null,
      steps: steps, primeSteps: primeSteps, verify: verify, verifyOk: verifyOk, warnings: warnings, notes: notes, rows: rows, summary: summary };
  }

  var api = { solve: solve, parseList: parseList, gcd: gcd, lcm2: lcm2, factor: factor, tokens: tokens, MAX_TERMS: MAX_TERMS, MAX_DIGITS: MAX_DIGITS, FACTOR_LIMIT: FACTOR_LIMIT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.GCF = api;
})(typeof self !== 'undefined' ? self : this);
