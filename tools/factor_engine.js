/* Elecmetric Factor Calculator: exact engine for Mode 01 (All Factors Finder).
   Finds every positive factor (divisor) of one nonzero integer, in ascending order, with the factor pairs, the prime factorisation the list is built from, the number of
   factors, prime / composite / neither, and a set of exact checks. Numbers are BigInt, so there is no floating-point loss.
   Conventions (CEO note, "Factor Calculator: CEO Product Decision"):
   - The input is one nonzero integer. The positive factors of a negative integer are those of its absolute value; signed factor pairs (product = n) are a separate output.
   - Zero has no finite factor list: every nonzero integer divides 0. It is explained, not listed.
   - 1 has the single factor 1 and is neither prime nor composite.
   - Method: prime factorisation (trial division, Miller-Rabin, Pollard-Brent rho, from tools/gcf_prime_engine.js), then every combination of the prime powers gives a factor,
     so no factor is missed and none is tested by guesswork. The list is then checked (every entry divides n, the count equals (e1+1)(e2+1)..., the pairs multiply to |n|,
     the sum equals the divisor-sum formula and, up to 10^12, an independent trial-division count agrees).
   - Limit: |n| up to 10^18 (19 digits). Every such number is factored in full in well under a second; the most factors any of them has is 103,680.
   Works in Node (module.exports, requires ./gcf_prime_engine.js) and in the browser (global FACT, after the globals GCF and GCFP). */
(function (root) {
  'use strict';
  var P = (typeof require === 'function' && typeof module !== 'undefined' && module.exports) ? require('./gcf_prime_engine.js') : root.GCFP;
  var LIMIT = 1000000000000000000n; /* 10^18 */
  var BRUTE_LIMIT = 1000000000000n; /* independent trial-division count is run up to 10^12 */
  var TH = ['\u2212', '\u2013', '\u2014', '\u2012'];

  function fail(msg) { return { ok: false, error: msg }; }
  function hint(msg) { return { ok: false, empty: true, error: msg, hint: msg }; }
  function abs(x) { return x < 0n ? -x : x; }
  function cut(s) { s = String(s); return s.length > 40 ? s.slice(0, 18) + '\u2026' + s.slice(-18) + ' (' + s.length + ' digits)' : s; }
  function plain(f) { return f.length ? f.map(function (x) { return String(x[0]) + (x[1] > 1 ? '^' + x[1] : ''); }).join(' \u00d7 ') : '1'; }
  function written(f) { var a = []; f.forEach(function (x) { for (var i = 0; i < x[1]; i++) a.push(String(x[0])); }); return a.length ? a.join(' \u00d7 ') : '1'; }
  function group(s) { s = String(s); var neg = s[0] === '-'; if (neg) s = s.slice(1); return (neg ? '-' : '') + s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  /* One integer. Accepts a sign, spaces or underscores or commas as digit-group separators (only when they form proper groups of three), and 12.0 for 12. */
  function parseInteger(text) {
    var s = String(text === undefined || text === null ? '' : text);
    TH.forEach(function (c) { s = s.split(c).join('-'); });
    s = s.replace(/\u00a0/g, ' ').trim();
    if (s === '') return hint('Type a whole number, for example 36.');
    var t = s;
    if (/^[+-]?\d{1,3}(,\d{3})+$/.test(t)) t = t.replace(/,/g, '');
    else if (/^[+-]?\d{1,3}( \d{3})+$/.test(t)) t = t.replace(/ /g, '');
    else if (/^[+-]?\d+(_\d+)+$/.test(t)) t = t.replace(/_/g, '');
    if (/[,;\s]/.test(t) && /\d/.test(t)) return fail('Enter one whole number. To find what several numbers have in common, use the GCF Calculator.');
    if (/^[+-]?\d+\.0*$/.test(t)) t = t.replace(/\.0*$/, '');
    if (!/^[+-]?\d+$/.test(t)) {
      if (/^[+-]?(\d+\.\d*|\.\d+)$/.test(t)) return fail('\u201c' + s.slice(0, 30) + '\u201d is not a whole number. Factors are defined for integers. To reduce a decimal or a fraction, use the Fraction Simplifier.');
      if (/^[+-]?\d+\/\d+$/.test(t)) return fail('\u201c' + s.slice(0, 30) + '\u201d is a fraction. Enter one whole number, or use the Fraction Simplifier to reduce a fraction.');
      if (/^[+-]?\d+(\.\d+)?e[+-]?\d+$/i.test(t)) return fail('Scientific notation is not read here. Type all the digits of the whole number.');
      return fail('\u201c' + s.slice(0, 30) + '\u201d is not a whole number. Use digits only, with an optional + or - sign.');
    }
    var digits = t.replace(/^[+-]/, '').replace(/^0+(?=\d)/, '');
    if (digits.length > 19) return fail('This calculator finds the factors of numbers up to 10^18 (19 digits). \u201c' + cut(s) + '\u201d has ' + digits.length + ' digits. Larger numbers can have far more factors than a page can list, and factoring them can take very long.');
    var v = BigInt(t);
    if (abs(v) > LIMIT) return fail('This calculator finds the factors of numbers up to 10^18 in size. ' + group(String(abs(v))) + ' is larger.');
    return { ok: true, n: v };
  }

  /* All positive divisors from [[p, e], ...], ascending. */
  function divisorsFrom(f) {
    var d = [1n];
    f.forEach(function (x) {
      var p = x[0], e = x[1], cur = d.length, mult = 1n, out = d.slice();
      for (var k = 1; k <= e; k++) { mult *= p; for (var i = 0; i < cur; i++) out.push(d[i] * mult); }
      d = out;
    });
    d.sort(function (a, b) { return a < b ? -1 : a > b ? 1 : 0; });
    return d;
  }
  function tau(f) { var t = 1n; f.forEach(function (x) { t *= BigInt(x[1] + 1); }); return t; }
  function sigma(f) { var s = 1n; f.forEach(function (x) { var p = x[0], pe = 1n, sum = 1n; for (var i = 0; i < x[1]; i++) { pe *= p; sum += pe; } s *= sum; }); return s; }
  function isqrt(n) { if (n < 2n) return n; var x = BigInt(Math.floor(Math.sqrt(Number(n)))); while (x * x > n) x--; while ((x + 1n) * (x + 1n) <= n) x++; return x; }
  /* Independent count of the divisors of a, by trial division of 1..sqrt(a) (a <= 10^12 so all arithmetic is exact in Number). */
  function bruteCount(a) {
    var n = Number(a), c = 0;
    for (var i = 1; i * i <= n; i++) { if (n % i === 0) c += (i * i === n) ? 1 : 2; }
    return c;
  }

  function checkCandidate(text, n, a) {
    var p = parseInteger(text);
    if (!p.ok) return p.empty ? null : { ok: false, error: p.error };
    var k = p.n, ak = abs(k);
    if (k === 0n) return { ok: true, factor: false, text: '0 is never a factor: dividing by 0 is undefined.', value: '0' };
    if (n === 0n) return null;
    var q = a / ak, r = a % ak;
    if (r === 0n) return { ok: true, factor: true, value: String(k), quotient: String(q), text: group(String(a)) + ' \u00f7 ' + group(String(ak)) + ' = ' + group(String(q)) + ' exactly, with remainder 0, so ' + group(String(ak)) + ' is a factor of ' + group(String(a)) + (ak === a ? ' (every number is a factor of itself)' : ak === 1n ? ' (1 is a factor of every integer)' : '') + '. Its partner is ' + group(String(q)) + ', because ' + group(String(ak)) + ' \u00d7 ' + group(String(q)) + ' = ' + group(String(a)) + '.' };
    if (ak > a) return { ok: true, factor: false, value: String(k), text: group(String(ak)) + ' is larger than ' + group(String(a)) + ', and a factor of a positive number cannot be larger than the number, so ' + group(String(ak)) + ' is not a factor.' };
    return { ok: true, factor: false, value: String(k), quotient: String(q), remainder: String(r), text: group(String(a)) + ' \u00f7 ' + group(String(ak)) + ' = ' + group(String(q)) + ' remainder ' + group(String(r)) + ', so ' + group(String(ak)) + ' is not a factor of ' + group(String(a)) + '.' };
  }

  function solve(opts) {
    opts = opts || {};
    var pr = parseInteger(opts.text);
    if (!pr.ok) return pr;
    var n = pr.n, a = abs(n), neg = n < 0n, signed = !!opts.signed, steps = [], verify = [], warnings = [], notes = [];
    var entered = String(n);

    if (n === 0n) {
      var zs = ['Every nonzero integer divides 0, because 0 = k \u00d7 0 for any k, so 0 has no finite list of factors.',
        'The list would be 1, 2, 3, 4, 5, \u2026 without end, so there is nothing to find.',
        'Zero is also not a factor of any other number, since dividing by 0 is undefined.'];
      return { ok: true, status: 'zero', n: '0', abs: '0', negative: false, entered: entered, factors: [], count: 0, pairs: [], signedPairs: [], primeFactors: [], factorText: '', expanded: '',
        classification: 'Not applicable', kind: 'zero', verify: [], verifyOk: true, steps: zs, warnings: warnings, notes: [], rows: [['Number', '0', 'Zero has no finite factor list']],
        sentence: 'Factors of 0: undefined (infinite)', valueText: 'Undefined', summary: 'Factors of 0\n\nZero has no finite list of factors. ' + zs.join(' '), listText: '', csv: '', candidate: opts.check ? checkCandidate(opts.check, n, a) : null };
    }

    /* factorise |n| */
    var f;
    if (a === 1n) f = []; else {
      f = P.factorFull(a);
      if (!Array.isArray(f)) return fail('The number could not be factored completely within the time allowed, so its factors cannot be listed. Please report it.');
    }
    var prod = 1n; f.forEach(function (x) { for (var i = 0; i < x[1]; i++) prod *= x[0]; });
    var d = divisorsFrom(f), cnt = d.length, T = tau(f);
    var one = a === 1n, prime = cnt === 2, composite = cnt > 2;
    var kind = one ? 'neither' : prime ? 'prime' : 'composite';
    var classification = one ? 'Neither prime nor composite (1 has only one factor)' : prime ? 'Prime (exactly two positive factors: 1 and itself)' : 'Composite (more than two positive factors)';

    /* factor pairs: d[i] x d[cnt-1-i] for d[i] <= sqrt */
    var pairs = [], i;
    for (i = 0; i < cnt; i++) { var lo = d[i], hi = a / lo; if (lo > hi) break; pairs.push([String(lo), String(hi)]); }
    var square = (pairs.length && pairs[pairs.length - 1][0] === pairs[pairs.length - 1][1]);
    var signedPairs = [];
    pairs.forEach(function (pp) {
      var x = pp[0], y = pp[1], eq = x === y;
      if (!neg) { signedPairs.push([x, y]); signedPairs.push(['-' + x, '-' + y]); }
      else { signedPairs.push([x, '-' + y]); if (!eq) signedPairs.push(['-' + x, y]); }
    });
    var showSigned = neg || signed;
    var powerTable = f.map(function (x) { var row = [], pw = 1n; for (var k = 0; k <= x[1]; k++) { row.push(String(pw)); pw *= x[0]; } return { p: String(x[0]), e: x[1], powers: row }; });

    /* steps */
    var s = 1;
    if (neg) steps.push('Sign. ' + group(entered) + ' is negative. A factor of a negative number is found from its absolute value, so the positive factors below are the factors of ' + group(String(a)) + '. The signed pairs whose product is ' + group(entered) + ' are listed separately.');
    if (one) steps.push('1 has no prime factors and a single positive factor, 1. It is neither prime nor composite.');
    else {
      steps.push('Prime factorisation. ' + group(String(a)) + ' = ' + plain(f) + (f.some(function (x) { return x[1] > 1; }) ? ' = ' + written(f) : '') + '.');
      steps.push('Count the factors. Each prime p with exponent e can appear 0 to e times, which is e + 1 choices. The number of positive factors is ' + f.map(function (x) { return '(' + x[1] + ' + 1)'; }).join(' \u00d7 ') + ' = ' + f.map(function (x) { return String(x[1] + 1); }).join(' \u00d7 ') + (f.length > 1 ? ' = ' + cnt : '') + '.');
      steps.push('Build the list. Multiply one power of each prime in every possible way (' + powerTable.map(function (r) { return r.p + ': ' + (r.powers.length > 6 ? r.powers.slice(0, 5).join(', ') + ', \u2026, ' + r.powers[r.powers.length - 1] : r.powers.join(', ')); }).join('; ') + '), then sort the ' + cnt + ' products from smallest to largest.');
    }
    steps.push('Pair them. The smallest factor goes with the largest (' + (pairs.length ? pairs[0][0] + ' \u00d7 ' + pairs[0][1] : '1 \u00d7 1') + ' = ' + group(String(a)) + '), the second smallest with the second largest, and so on, giving ' + pairs.length + ' positive factor pair' + (pairs.length === 1 ? '' : 's') + (square ? ', the last one being the equal pair ' + pairs[pairs.length - 1][0] + ' \u00d7 ' + pairs[pairs.length - 1][1] + ' because ' + group(String(a)) + ' is a perfect square' : '') + '.');
    steps.push('Verify. ' + group(String(a)) + ' is divided by every factor in the list and the remainder is 0 each time (the table below shows each division).');

    /* checks */
    var allDivide = true; for (i = 0; i < cnt; i++) { if (a % d[i] !== 0n) { allDivide = false; break; } }
    verify.push(['Every one of the ' + cnt + ' factors divides ' + cut(a) + ' with remainder 0', allDivide]);
    var asc = true; for (i = 1; i < cnt; i++) { if (!(d[i - 1] < d[i])) { asc = false; break; } }
    verify.push(['The list is in strictly ascending order with no repeats', asc]);
    verify.push(['The first factor is 1 and the last is ' + cut(a), d[0] === 1n && d[cnt - 1] === a]);
    verify.push(['The prime factorisation multiplies back to ' + cut(a), prod === a]);
    var allPrime = f.every(function (x) { return P.isPrime(x[0]); });
    verify.push(['Every prime in the factorisation passes the Miller\u2013Rabin primality test', allPrime]);
    verify.push(['The count ' + cnt + ' equals (e\u2081 + 1)(e\u2082 + 1)\u2026 = ' + String(T), BigInt(cnt) === T]);
    var pairsOk = pairs.every(function (pp) { return BigInt(pp[0]) * BigInt(pp[1]) === a; }) && (pairs.length * 2 - (square ? 1 : 0) === cnt);
    verify.push(['Every factor pair multiplies to ' + cut(a) + ', and the pairs use each factor exactly once', pairsOk]);
    var sum = 0n; d.forEach(function (x) { sum += x; });
    verify.push(['The factors add up to ' + cut(String(sum)) + ', which equals the divisor-sum formula \u03c3(n) from the primes', sum === sigma(f)]);
    if (a <= BRUTE_LIMIT) verify.push(['A separate trial division of every whole number from 1 to \u221a' + cut(a) + ' finds the same ' + cnt + ' factors', bruteCount(a) === cnt]);
    else notes.push('The separate trial-division recount is run for numbers up to 10^12 only; larger numbers rely on the other checks.');
    var verifyOk = verify.every(function (v) { return v[1]; });

    var list = d.map(String), listText = list.join(', ');
    var csv = 'Factor,Quotient (|n| / factor),Remainder\r\n' + list.map(function (x) { return x + ',' + String(a / BigInt(x)) + ',0'; }).join('\r\n') + '\r\n';
    var status = one ? 'one' : prime ? 'prime' : 'ok';
    var rows = [['Number', group(entered), neg ? 'Factors are found from the absolute value ' + group(String(a)) : 'Nonzero integer'],
      ['Positive factors', String(cnt), 'Listed in ascending order'],
      ['Prime factorisation', plain(f), one ? '1 is the empty product' : written(f) === plain(f) ? 'Each prime appears once' : written(f)],
      ['Positive factor pairs', String(pairs.length), square ? 'Includes the equal pair ' + pairs[pairs.length - 1][0] + ' \u00d7 ' + pairs[pairs.length - 1][1] : 'No equal pair (not a perfect square)'],
      ['Classification', kind === 'one' ? 'Neither' : kind === 'prime' ? 'Prime' : kind === 'composite' ? 'Composite' : kind, classification]];
    var sentence = 'Factors of ' + group(entered) + ': ' + cnt + ' positive factor' + (cnt === 1 ? '' : 's');
    var valueText = cnt <= 40 ? listText : list.slice(0, 12).join(', ') + ', \u2026, ' + list.slice(-12).join(', ');
    var summary = 'Factors of ' + group(entered) + (neg ? ' (positive factors of ' + group(String(a)) + ')' : '') + '\n\nPositive factors (' + cnt + '): ' + listText + '\n\nPrime factorisation: ' + group(String(a)) + ' = ' + plain(f) +
      '\nNumber of positive factors: ' + cnt + '\nClassification: ' + classification + '\n\nPositive factor pairs (' + pairs.length + '):\n' + pairs.map(function (pp) { return pp[0] + ' \u00d7 ' + pp[1] + ' = ' + a; }).join('\n') +
      (showSigned ? '\n\nSigned factor pairs (product ' + entered + '):\n' + signedPairs.map(function (pp) { return pp[0] + ' \u00d7 ' + pp[1] + ' = ' + entered; }).join('\n') : '') +
      '\n\nChecks: ' + (verifyOk ? 'all ' + verify.length + ' passed' : 'A CHECK FAILED');
    return { ok: true, status: status, kind: kind, n: entered, abs: String(a), negative: neg, one: one, prime: prime, composite: composite, square: square, entered: entered,
      factors: list, count: cnt, pairs: pairs, signedPairs: signedPairs, showSigned: showSigned, primeFactors: f.map(function (x) { return [String(x[0]), x[1]]; }), factorText: plain(f), expanded: written(f),
      powerTable: powerTable, classification: classification, verify: verify, verifyOk: verifyOk, steps: steps, warnings: warnings, notes: notes, rows: rows,
      sentence: sentence, valueText: valueText, listText: listText, csv: csv, summary: summary, candidate: opts.check ? checkCandidate(opts.check, n, a) : null };
  }

  var api = { solve: solve, parseInteger: parseInteger, divisorsFrom: divisorsFrom, tau: tau, sigma: sigma, isqrt: isqrt, bruteCount: bruteCount, group: group, LIMIT: LIMIT, isPrime: P.isPrime, factorFull: P.factorFull };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FACT = api;
})(typeof window !== 'undefined' ? window : this);
