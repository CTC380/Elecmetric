/* Elecmetric LCM Calculator: exact engine for Mode 01 (Multiple Number LCM).
   Input is a list of one to fifty whole numbers (comma, semicolon, space or new line between them). Every number is read exactly as a BigInt: signed
   integers, and decimals or scientific notation only when the value is a whole number (12.0 and 1.2e1 are 12). A number with a fractional part is refused
   with a message, because the LCM is defined for integers (fractions belong to Mode 04). At most 100 digits per number.
   Conventions, all stated on the page:
     - the sign is ignored: LCM(-4, 6) = LCM(4, 6) = 12;
     - if any number is 0 the LCM is 0 (the only multiple of 0 is 0), and the LCM of the other numbers is reported beside it;
     - a repeated number is used once, because it cannot change the LCM; a single number is its own LCM.
   Production method: the Euclidean algorithm with divide-before-multiply, LCM(a, b) = a / GCD(a, b) * b, folded over the list in BigInt, so nothing is rounded
   and nothing grows faster than the answer. Two other ways of showing the working are offered (prime factorisation up to 10^12, listing multiples for small
   answers) and the result is always checked by routes that do not use the fold: divisibility, the quotients having GCD 1, the reverse order, and primes.
   Works in Node (module.exports) and in the browser (global Lcm). */
(function (root) {
  'use strict';
  var MAXTERMS = 50, MAXDIGITS = 100, PRIME_LIMIT = 1e12, LIST_ROWS = 40, LIST_LIMIT = 1e12;
  var SUP = { '0': '\u2070', '1': '\u00b9', '2': '\u00b2', '3': '\u00b3', '4': '\u2074', '5': '\u2075', '6': '\u2076', '7': '\u2077', '8': '\u2078', '9': '\u2079' };

  function abs(n) { return n < 0n ? -n : n; }
  function gcd(a, b) { a = abs(a); b = abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function lcm2(a, b) { a = abs(a); b = abs(b); if (a === 0n || b === 0n) return 0n; return a / gcd(a, b) * b; }
  function sup(e) { return String(e).split('').map(function (c) { return SUP[c]; }).join(''); }
  function show(n) { var s = n.toString(); return s.length <= 40 ? s : s.slice(0, 10) + '\u2026' + s.slice(-6) + ' (' + s.length + ' digits)'; }
  function empty(hint) { return { ok: false, empty: true, error: hint, hint: hint }; }
  function fail(msg, idx) { return { ok: false, error: msg, termIndex: idx === undefined ? -1 : idx }; }
  function isBlank(s) { return s === undefined || s === null || String(s).replace(/[\s,;]+/g, '') === ''; }

  /* Euclid's algorithm as text: lines such as "18 = 1 x 12 + 6". Long chains are cut in the middle. */
  function euclid(a, b) {
    var x = a >= b ? a : b, y = a >= b ? b : a, lines = [];
    while (y !== 0n) { var q = x / y, r = x % y; lines.push(show(x) + ' = ' + show(q) + ' \u00d7 ' + show(y) + ' + ' + show(r)); x = y; y = r; }
    var all = lines.length;
    if (all > 10) lines = lines.slice(0, 4).concat(['\u2026 (' + all + ' divisions in all) \u2026']).concat(lines.slice(-2));
    return { g: x, lines: lines, count: all };
  }

  /* prime factorisation of a Number up to PRIME_LIMIT by trial division: [[p, e], ...] */
  function factor(n) {
    var out = [], p = 2, e;
    while (p * p <= n) {
      if (n % p === 0) { e = 0; while (n % p === 0) { n = n / p; e++; } out.push([p, e]); }
      p += p === 2 ? 1 : 2;
    }
    if (n > 1) out.push([n, 1]);
    return out;
  }
  function facText(f) { return f.length ? f.map(function (x) { return x[1] > 1 ? x[0] + sup(x[1]) : String(x[0]); }).join(' \u00d7 ') : '1 (no prime factors)'; }

  /* One entered number -> BigInt, or an error string. */
  var RE = /^([+\-])?(\d*)(?:\.(\d*))?(?:[eE]([+\-]?\d+))?$/;
  function readInt(tok) {
    var t = tok.replace(/\u2212/g, '-');
    if (t.indexOf('/') >= 0) return { err: '\u201c' + tok + '\u201d is a fraction. The LCM is defined for whole numbers. Enter integers here; a common denominator for fractions is the Fraction LCM mode.' };
    var m = RE.exec(t);
    if (!m || (m[2] === '' && (m[3] === undefined || m[3] === ''))) return { err: '\u201c' + tok + '\u201d is not a number. Enter whole numbers separated by commas, spaces or new lines.' };
    var neg = m[1] === '-', ds = (m[2] + (m[3] || '')).replace(/^0+/, ''), ex = (m[4] ? parseInt(m[4], 10) : 0) - (m[3] ? m[3].length : 0);
    if (ds === '') return { n: 0n };
    var s;
    if (ex >= 0) {
      if (ds.length + ex > MAXDIGITS) return { err: '\u201c' + (tok.length > 24 ? tok.slice(0, 24) + '\u2026' : tok) + '\u201d has more than ' + MAXDIGITS + ' digits. The limit is ' + MAXDIGITS + ' digits for each number.' };
      s = ds + '0'.repeat(ex);
    } else {
      var k = -ex;
      if (ds.length <= k || /[1-9]/.test(ds.slice(ds.length - k))) return { err: '\u201c' + tok + '\u201d is not a whole number. The LCM is defined for integers. For fractions and decimals use the Fraction LCM mode.' };
      s = ds.slice(0, ds.length - k);
      if (s.length > MAXDIGITS) return { err: '\u201c' + (tok.length > 24 ? tok.slice(0, 24) + '\u2026' : tok) + '\u201d has more than ' + MAXDIGITS + ' digits. The limit is ' + MAXDIGITS + ' digits for each number.' };
    }
    var v = BigInt(s); return { n: neg ? -v : v };
  }

  function parse(text) {
    var toks = String(text === undefined || text === null ? '' : text).split(/[\s,;]+/).filter(function (x) { return x !== ''; });
    if (!toks.length) return empty('Enter two or more whole numbers, separated by commas or spaces, for example 12, 18, 24.');
    if (toks.length > MAXTERMS) return fail('At most ' + MAXTERMS + ' numbers can be used at once; you entered ' + toks.length + '.', MAXTERMS);
    var vals = [];
    for (var i = 0; i < toks.length; i++) { var r = readInt(toks[i]); if (r.err) return fail(r.err, i); vals.push(r.n); }
    return { ok: true, vals: vals, tokens: toks };
  }

  function foldLcm(list) { var L = 1n; for (var i = 0; i < list.length; i++) L = lcm2(L, list[i]); return L; }
  function foldGcd(list) { var g = 0n; for (var i = 0; i < list.length; i++) g = gcd(g, list[i]); return g; }

  /* distinct absolute values in order of first appearance */
  function distinct(list) { var seen = {}, out = []; list.forEach(function (v) { var a = abs(v), k = a.toString(); if (!seen[k]) { seen[k] = 1; out.push(a); } }); return out; }

  /* the checks, by routes that are not the fold used for the answer. list = distinct positive values. */
  function checks(list, L, G) {
    var v = [], i, ok;
    ok = list.every(function (n) { return L % n === 0n; }); v.push(['The LCM ' + show(L) + ' is divisible by every number (remainder 0 each time)', ok]);
    var q = list.map(function (n) { return L / n; });
    v.push(['The quotients LCM \u00f7 number have GCD 1, so no smaller common multiple exists (a smaller one would be LCM \u00f7 their GCD)', foldGcd(q) === 1n]);
    var rev = list.slice().reverse(); v.push(['Folding the numbers in the reverse order gives the same LCM', foldLcm(rev) === L]);
    var prod = list.reduce(function (a, b) { return a * b; }, 1n), mx = list.reduce(function (a, b) { return b > a ? b : a; }, 1n);
    v.push(['The LCM is at least the largest number and divides the product of the numbers', L >= mx && prod % L === 0n]);
    v.push(['The GCD ' + show(G) + ' divides every number and the quotients number \u00f7 GCD have GCD 1', list.every(function (n) { return n % G === 0n; }) && foldGcd(list.map(function (n) { return n / G; })) === 1n]);
    if (list.length === 2) v.push(['GCD \u00d7 LCM equals the product of the two numbers (' + show(G) + ' \u00d7 ' + show(L) + ' = ' + show(list[0] * list[1]) + ')', G * L === list[0] * list[1]]);
    if (list.every(function (n) { return n <= BigInt(PRIME_LIMIT); })) {
      var mxp = {}; list.forEach(function (n) { factor(Number(n)).forEach(function (f) { if (!mxp[f[0]] || mxp[f[0]] < f[1]) mxp[f[0]] = f[1]; }); });
      var P = 1n; Object.keys(mxp).forEach(function (p) { P *= BigInt(p) ** BigInt(mxp[p]); });
      v.push(['Multiplying the highest power of every prime found in the numbers gives the same LCM', P === L]);
    }
    return v;
  }

  function stepsGcd(list, steps) {
    if (list.length === 1) { steps.push('Only one distinct number is left, ' + show(list[0]) + ', so its least common multiple is the number itself.'); return list[0]; }
    steps.push('Use LCM(a, b) = a \u00f7 GCD(a, b) \u00d7 b (dividing first keeps the numbers small), and fold it over the list: the LCM of the first two numbers, then that result with the third, and so on.');
    var r = list[0];
    for (var i = 1; i < list.length; i++) {
      var e = euclid(r, list[i]), nl = r / e.g * list[i];
      steps.push('Step ' + i + ': LCM(' + show(r) + ', ' + show(list[i]) + '). Euclidean algorithm: ' + e.lines.join('; ') + '. GCD = ' + show(e.g) + '. LCM = ' + show(r) + ' \u00f7 ' + show(e.g) + ' \u00d7 ' + show(list[i]) + ' = ' + show(nl) + '.');
      r = nl;
    }
    return r;
  }
  function stepsPrime(list, L, steps) {
    var mx = {}, from = {}, ps;
    list.forEach(function (n) {
      var f = factor(Number(n)); steps.push(show(n) + ' = ' + facText(f) + '.');
      f.forEach(function (x) { if (!mx[x[0]] || mx[x[0]] < x[1]) { mx[x[0]] = x[1]; from[x[0]] = n; } });
    });
    ps = Object.keys(mx).map(Number).sort(function (a, b) { return a - b; });
    if (!ps.length) { steps.push('Every number is 1, which has no prime factors.'); steps.push('LCM = empty product = 1.'); return; }
    steps.push('Take the highest power of each prime that appears in any number: ' + ps.map(function (p) { return (mx[p] > 1 ? p + sup(mx[p]) : p) + ' (from ' + show(from[p]) + ')'; }).join(', ') + '.');
    steps.push('LCM = ' + ps.map(function (p) { return mx[p] > 1 ? p + sup(mx[p]) : String(p); }).join(' \u00d7 ') + ' = ' + show(L) + '.');
  }
  function stepsList(list, L, steps) {
    list.forEach(function (n) {
      var k = Number(L / n), parts = [], i; for (i = 1; i <= k; i++) parts.push(String(Number(n) * i));
      steps.push('Multiples of ' + n + ': ' + parts.join(', ') + '.');
    });
    steps.push(L + ' is the first number that appears in every list, so the LCM is ' + L + '. A smaller number that is in every list does not exist, because every common multiple is a multiple of the LCM.');
  }

  /* opts: { text, method: 'gcd' | 'prime' | 'list' }. Returns the result object used by the page. */
  function calc(opts) {
    opts = opts || {};
    var method = opts.method || 'gcd';
    if (['gcd', 'prime', 'list'].indexOf(method) < 0) return fail('Unknown method ' + method + '.');
    var pr = parse(opts.text); if (!pr.ok) return pr;
    var vals = pr.vals, n = vals.length, absAll = vals.map(abs), steps = [], warnings = [], notes = [], hasZero = absAll.some(function (x) { return x === 0n; });
    var neg = vals.some(function (x) { return x < 0n; });
    var posAll = absAll.filter(function (x) { return x !== 0n; }), used = distinct(posAll), L, G = foldGcd(absAll), methodUsed = method, nz = null;
    var shownList = vals.length <= 8 ? vals.map(show).join(', ') : vals.slice(0, 6).map(show).join(', ') + ', \u2026 (' + n + ' numbers)';
    var sentence = 'LCM(' + shownList + ') = ';

    if (neg) steps.push('The sign does not matter for a least common multiple, so negative numbers are replaced by their absolute values: ' + vals.map(function (v, i) { return v < 0n ? '|' + show(v) + '| = ' + show(absAll[i]) : null; }).filter(Boolean).join(', ') + '.');
    if (hasZero) {
      L = 0n;
      steps.push('At least one number is 0. The only multiple of 0 is 0, so the only number that every input divides is 0. By the usual convention LCM = 0 whenever any input is 0.');
      if (used.length) {
        nz = calc({ text: used.join(' '), method: 'gcd' });
        steps.push('If you leave the zero out, the LCM of the other ' + (used.length === 1 ? 'number, ' + show(used[0]) + ',' : used.length + ' distinct numbers') + ' is ' + show(BigInt(nz.lcm)) + '.');
      }
      methodUsed = 'gcd';
      if (method !== 'gcd') warnings.push('The working by ' + (method === 'prime' ? 'prime factorisation' : 'listing multiples') + ' is not shown when an input is 0.');
    } else {
      var dup = n - used.length - 0;
      if (dup > 0) steps.push('Repeated values are used once, because a repeated number cannot change the LCM. ' + n + ' numbers were entered and ' + used.length + ' distinct value' + (used.length === 1 ? ' is' : 's are') + ' left: ' + used.map(show).join(', ') + '.');
      if (method === 'prime') {
        if (used.every(function (x) { return x <= BigInt(PRIME_LIMIT); })) { L = foldLcm(used); stepsPrime(used, L, steps); }
        else { methodUsed = 'gcd'; warnings.push('Prime factorisation is shown only when every number is at most 1,000,000,000,000 (13 digits). The working below uses the GCD method instead; the result is the same.'); }
      } else if (method === 'list') {
        var okList = false;
        if (used.every(function (x) { return x <= BigInt(LIST_LIMIT); })) {
          var L0 = foldLcm(used), mn = used.reduce(function (a, b) { return b < a ? b : a; }, used[0]);
          if (L0 <= BigInt(LIST_LIMIT) && L0 / mn <= BigInt(LIST_ROWS)) { okList = true; L = L0; stepsList(used, L, steps); }
        }
        if (!okList) { methodUsed = 'gcd'; warnings.push('Listing multiples is shown only when the answer is reached within ' + LIST_ROWS + ' multiples of the smallest number. The working below uses the GCD method instead; the result is the same.'); }
      }
      if (methodUsed === 'gcd') L = stepsGcd(used, steps);
    }

    /* the numbers on the page */
    var Ltext = L.toString(), Gtext = G.toString(), rows = [], quotients = [], multiples = [], verify = [];
    sentence += show(L);
    rows.push(['LCM', Ltext, hasZero ? 'By convention, because an input is 0' : 'Least common multiple of ' + (used.length === 1 ? 'the number ' + show(used[0]) : 'the ' + used.length + ' distinct number' + (used.length === 1 ? '' : 's'))]);
    rows.push(['GCD', Gtext, hasZero ? 'Greatest common divisor of the numbers (GCD(0, n) = |n|' + (G === 0n ? ', GCD(0, 0) = 0 by convention' : '') + ')' : 'Greatest common divisor of the numbers']);
    rows.push(['Numbers read', String(n), n === 1 ? 'A single number' : (used.length === (hasZero ? used.length : n) && !hasZero ? 'Entered in this order' : used.length + ' distinct non-zero value' + (used.length === 1 ? '' : 's'))]);
    if (hasZero && nz) rows.push(['LCM without the zeros', nz.lcm, 'LCM of ' + used.map(show).join(', ')]);
    if (L !== 0n) { rows.push(['Digits in the LCM', String(Ltext.length), Ltext.length > 60 ? 'Shortened in the working, complete here and when copied' : '']); }
    if (!hasZero && used.length === 2) rows.push(['Product of the two numbers', (used[0] * used[1]).toString(), 'GCD \u00d7 LCM = ' + (G * L).toString()]);
    if (!hasZero) {
      used.forEach(function (x) { quotients.push({ n: x.toString(), q: (L / x).toString() }); });
      for (var k = 1; k <= 5; k++) multiples.push((L * BigInt(k)).toString());
      verify = checks(used, L, G);
      if (used.length >= 2 && used.length <= 6) rows.push(['Where it is used', 'Repeating events and fractions', 'Events that repeat every ' + used.map(show).join(', ') + ' units, all starting together, next coincide after ' + show(L) + ' units. ' + show(L) + ' is also a common denominator for fractions with denominators ' + used.map(show).join(', ') + '.']);
    } else {
      verify.push(['0 is a multiple of every input (0 = number \u00d7 0)', true]);
      verify.push(['Convention applied: the LCM of numbers that include 0 is 0', L === 0n]);
      verify.push(['Every non-zero input divides 0 (0 \u00f7 number = 0, remainder 0)', absAll.every(function (x) { return x === 0n || 0n % x === 0n; })]);
      if (nz) { verify.push(['The LCM of the non-zero numbers, ' + show(BigInt(nz.lcm)) + ', passes its own checks', nz.verifyOk === true]); }
      else verify.push(['Every input is 0, so 0 is the only possible answer', absAll.every(function (x) { return x === 0n; })]);
    }
    if (!hasZero && used.length === 1) notes.push('A single number is its own least common multiple. Add a second number to compare.');
    if (neg) notes.push('Signs are ignored: the LCM of numbers that include negatives is the LCM of their absolute values, and it is never negative.');
    notes.push('A comma separates numbers, so type 1000, not 1,000.');
    var verifyOk = verify.every(function (x) { return x[1] === true; });
    var methodName = { gcd: 'GCD method: LCM(a, b) = a \u00f7 GCD(a, b) \u00d7 b, repeated', prime: 'Prime factorisation: highest power of each prime', list: 'Listing multiples' }[methodUsed];
    var summary = ['LCM Calculator (Elecmetric)', 'Numbers: ' + vals.map(String).join(', '), 'LCM = ' + Ltext, 'GCD = ' + Gtext, 'Method: ' + methodName, '', 'Working:'].concat(steps.map(function (s, i) { return (i + 1) + '. ' + s; })).concat(['', 'Checks: ' + (verifyOk ? 'all ' + verify.length + ' passed' : 'a check failed')]).join('\n');
    return { ok: true, n: n, values: vals.map(String), tokens: pr.tokens, distinct: used.map(String), lcm: Ltext, gcd: Gtext, zero: hasZero, negative: neg, lcmDigits: L === 0n ? 1 : Ltext.length,
      methodRequested: method, methodUsed: methodUsed, methodName: methodName, steps: steps, rows: rows, quotients: quotients, multiples: multiples, verify: verify, verifyOk: verifyOk,
      warnings: warnings, notes: notes, sentence: sentence, summary: summary, withoutZero: nz ? nz.lcm : null };
  }

  var api = { calc: calc, parse: parse, readInt: readInt, gcd: gcd, lcm2: lcm2, foldLcm: foldLcm, foldGcd: foldGcd, factor: factor, euclid: euclid, isBlank: isBlank, MAXTERMS: MAXTERMS, MAXDIGITS: MAXDIGITS, PRIME_LIMIT: PRIME_LIMIT, LIST_ROWS: LIST_ROWS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Lcm = api;
})(typeof window !== 'undefined' ? window : this);
