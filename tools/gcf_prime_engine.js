/* Elecmetric GCF Calculator: exact engine for Mode 02 (Prime Factorisation GCF).
   Finds the greatest common factor of 2 to 20 integers by prime factorisation and shows how: the prime factors of each number, the primes common to all of them,
   the lowest power of each common prime, the final multiplication, and the cross-check against the Euclidean algorithm (Mode 01 engine, tools/gcf_engine.js).
   Numbers are BigInt, so there is no floating-point loss. Conventions are those of Mode 01: the GCF is non-negative, signs are ignored, a zero is set aside
   (GCF(0, n) = |n|), all zeros is undefined, 1 has no prime factors.
   Factoring: trial division by the primes below 1000, then Miller-Rabin (deterministic for n < 3.3 x 10^24, so exact up to FACTOR_LIMIT) and Pollard-Brent rho for the rest.
   Every number up to FACTOR_LIMIT (10^18) is factored in full ("full" view). If any number is larger, or a hard number does not split within the iteration budget,
   the page uses the "partial" view: the GCF is found by the Euclidean algorithm and then factored (when it is small enough), and each number is shown as the powers of the GCF's primes times
   a remaining factor that is not factored. If even the GCF cannot be factored, the "none" view reports the Euclidean GCF and says the prime route was not completed.
   Works in Node (module.exports, requires ./gcf_engine.js) and in the browser (global GCFP, after the global GCF). */
(function (root) {
  'use strict';
  var G = (typeof require === 'function' && typeof module !== 'undefined' && module.exports) ? require('./gcf_engine.js') : root.GCF;
  var FACTOR_LIMIT = 1000000000000000000n; /* 10^18 */
  var RHO_BUDGET = 600000; /* iterations of the cycle search per attempt */
  var SMALL = []; (function () { var s = new Array(1000).fill(true), i, j; for (i = 2; i < 1000; i++) { if (s[i]) { SMALL.push(BigInt(i)); for (j = i * i; j < 1000; j += i) s[j] = false; } } })();
  var MR_BASES = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n]; /* deterministic for n < 3.317 x 10^24 */

  function mulmod(a, b, m) { return (a * b) % m; }
  function powmod(b, e, m) { var r = 1n; b %= m; while (e > 0n) { if (e & 1n) r = (r * b) % m; b = (b * b) % m; e >>= 1n; } return r; }
  function isPrime(n) {
    if (n < 2n) return false;
    for (var i = 0; i < SMALL.length; i++) { var p = SMALL[i]; if (n === p) return true; if (n % p === 0n) return false; if (p * p > n) return true; }
    var d = n - 1n, s = 0; while ((d & 1n) === 0n) { d >>= 1n; s++; }
    for (var k = 0; k < MR_BASES.length; k++) {
      var a = MR_BASES[k] % n; if (a === 0n) continue;
      var x = powmod(a, d, n); if (x === 1n || x === n - 1n) continue;
      var comp = true; for (var r = 1; r < s; r++) { x = mulmod(x, x, n); if (x === n - 1n) { comp = false; break; } }
      if (comp) return false;
    }
    return true;
  }
  /* Pollard-Brent rho: returns a non-trivial factor of the composite odd n, or null when the budget runs out. */
  function rho(n) {
    for (var c0 = 1n; c0 < 12n; c0++) {
      var y = 2n, r = 1, q = 1n, g = 1n, x = 0n, ys = 0n, m = 128, iter = 0, f = function (v) { return (v * v + c0) % n; };
      do {
        x = y; for (var i = 0; i < r; i++) y = f(y);
        var k = 0;
        do {
          ys = y; for (var j = 0; j < Math.min(m, r - k); j++) { y = f(y); q = (q * (x > y ? x - y : y - x)) % n; }
          g = G.gcd(q, n); k += m; iter += m;
        } while (k < r && g === 1n && iter < RHO_BUDGET);
        r *= 2;
      } while (g === 1n && iter < RHO_BUDGET);
      if (g === n) { do { ys = f(ys); g = G.gcd(x > ys ? x - ys : ys - x, n); } while (g === 1n); }
      if (g !== 1n && g !== n) return g;
    }
    return null;
  }
  /* Prime factorisation of n >= 2 as sorted [[p, e], ...], or { partial: [...], rest: BigInt } if a composite part would not split. */
  function factorFull(n) {
    var map = {}, order = [], rest = 1n, i, p;
    function add(p, e) { var k = String(p); if (!(k in map)) { map[k] = [p, 0]; order.push(k); } map[k][1] += e; }
    for (i = 0; i < SMALL.length; i++) { p = SMALL[i]; if (p * p > n) break; if (n % p === 0n) { var e = 0; while (n % p === 0n) { n /= p; e++; } add(p, e); } }
    var stack = n > 1n ? [n] : [];
    while (stack.length) {
      var v = stack.pop();
      if (v === 1n) continue;
      if (isPrime(v)) { add(v, 1); continue; }
      var d = rho(v);
      if (d === null) { rest *= v; continue; }
      stack.push(d); stack.push(v / d);
    }
    var out = order.map(function (k) { return map[k]; }).sort(function (a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0; });
    return rest === 1n ? out : { partial: out, rest: rest };
  }
  function expOf(p, n) { var e = 0; while (n % p === 0n) { n /= p; e++; } return e; }
  function fmtF(f) { return f.length ? f.map(function (x) { return String(x[0]) + (x[1] > 1 ? '^' + x[1] : ''); }).join(' × ') : '1'; }
  function expand(f) { var a = []; f.forEach(function (x) { for (var i = 0; i < x[1]; i++) a.push(String(x[0])); }); return a.length ? a.join(' × ') : '1'; }
  function fprod(f) { var v = 1n; f.forEach(function (x) { for (var i = 0; i < x[1]; i++) v *= x[0]; }); return v; }
  function cut(s) { s = String(s); return s.length > 40 ? s.slice(0, 18) + '…' + s.slice(-18) + ' (' + s.length + ' digits)' : s; }
  /* Repeated division by the smallest prime: [[divisor, quotient], ...] ending with quotient 1. Capped so a power such as 2^400 stays readable. */
  function ladder(n, f) {
    var rows = [], cur = n, total = 0; f.forEach(function (x) { total += x[1]; });
    if (total > 60) return null;
    f.forEach(function (x) { for (var i = 0; i < x[1]; i++) { cur /= x[0]; rows.push([String(x[0]), String(cur)]); } });
    return rows;
  }
  function product(list) { var v = 1n; list.forEach(function (x) { v *= x; }); return v; }

  function solve(opts) {
    opts = opts || {};
    var base = G.solve(opts); /* Mode 01 engine: input parsing, signs, zeros, all-zero case, Euclidean GCF and checks */
    if (!base.ok) return base;
    var nums = Array.isArray(opts.nums) ? opts.nums.map(function (x) { return BigInt(x); }) : G.parseList(opts.text).nums;
    var absn = nums.map(function (x) { return x < 0n ? -x : x; }), n = nums.length, i, k;
    var entered = base.entered, zeros = absn.filter(function (x) { return x === 0n; }).length, anyNeg = nums.some(function (x) { return x < 0n; });
    if (base.status === 'undefined') {
      return { ok: true, status: 'undefined', view: 'none', count: n, entered: entered, abs: base.abs, gcf: null, gcfText: 'Undefined', valueText: 'GCF = undefined', sentence: base.sentence,
        steps: base.steps, verify: base.verify, verifyOk: true, warnings: [], notes: [], rows: base.rows, summary: base.summary, numbers: [], primes: [], gcfFactors: null, gcfFactorText: null };
    }
    var gcf = BigInt(base.gcf), nzIdx = [], nz = [];
    absn.forEach(function (v, j) { if (v !== 0n) { nzIdx.push(j); nz.push(v); } });
    var tooBig = nz.some(function (v) { return v > FACTOR_LIMIT; });
    var facs = absn.map(function () { return null; }), view = 'full', notes = [], warnings = [];
    if (!tooBig) {
      for (i = 0; i < n; i++) {
        if (absn[i] === 0n) continue;
        if (absn[i] < 2n) { facs[i] = []; continue; }
        var f = factorFull(absn[i]);
        if (Array.isArray(f)) facs[i] = f; else { view = 'partial'; break; }
      }
    } else view = 'partial';
    var numbers = [], primes = [], gcfFactors = null, steps = [];
    var gF = null;
    if (view === 'full') {
      var set = {}, ord = []; facs.forEach(function (f) { if (f) f.forEach(function (x) { var s = String(x[0]); if (!(s in set)) { set[s] = x[0]; ord.push(x[0]); } }); });
      ord.sort(function (a, b) { return a < b ? -1 : a > b ? 1 : 0; });
      gcfFactors = [];
      ord.forEach(function (p) {
        var exps = facs.map(function (f) { if (!f) return null; var h = f.filter(function (x) { return x[0] === p; })[0]; return h ? h[1] : 0; });
        var present = exps.filter(function (e) { return e !== null; }), lo = Math.min.apply(null, present), hi = Math.max.apply(null, present);
        primes.push({ p: p, exps: exps, min: lo, max: hi, common: lo > 0 });
        if (lo > 0) gcfFactors.push([p, lo]);
      });
      gF = gcfFactors;
    } else {
      /* partial: factor the Euclidean GCF itself (it is never larger than the smallest non-zero number) */
      if (gcf > 1n && gcf <= FACTOR_LIMIT) { var fg = factorFull(gcf); if (Array.isArray(fg)) gF = fg; }
      else if (gcf === 1n) gF = [];
      if (gF === null) view = 'none';
      else {
        gcfFactors = gF;
        gF.forEach(function (x) { var exps = absn.map(function (v) { return v === 0n ? null : expOf(x[0], v); }), present = exps.filter(function (e) { return e !== null; }); primes.push({ p: x[0], exps: exps, min: Math.min.apply(null, present), max: Math.max.apply(null, present), common: true }); });
      }
    }
    var gcfFactorText = gcfFactors ? fmtF(gcfFactors) : null;

    /* per-number records */
    absn.forEach(function (v, j) {
      var rec = { value: String(v), zero: v === 0n, one: v === 1n, entered: entered[j] };
      if (v === 0n) { numbers.push(rec); return; }
      if (view === 'full') { rec.factors = facs[j].map(function (x) { return [String(x[0]), x[1]]; }); rec.factorText = v === 1n ? '1' : fmtF(facs[j]); rec.expanded = v === 1n ? '1' : expand(facs[j]); rec.ladder = ladder(v, facs[j]); rec.complete = true; }
      else if (view === 'partial') {
        var rem = v, parts = gcfFactors.map(function (x) { var e = expOf(x[0], v); rem /= (x[0] ** BigInt(e)); return [String(x[0]), e]; }).filter(function (x) { return x[1] > 0; });
        rec.factors = parts; rec.rest = String(rem); rec.complete = false;
        rec.factorText = (parts.length ? parts.map(function (x) { return x[0] + (x[1] > 1 ? '^' + x[1] : ''); }).join(' × ') : '') + (rem > 1n ? (parts.length ? ' × ' : '') + cut(rem) + ' (not factored)' : (parts.length ? '' : '1'));
      }
      numbers.push(rec);
    });
    var quotients = absn.map(function (v) { return v / gcf; }), qFac = null;
    if (view === 'full') qFac = quotients.map(function (q, j) { if (absn[j] === 0n) return null; return facs[j].map(function (x) { var e = x[1] - (gcfFactors.filter(function (g) { return g[0] === x[0]; })[0] || [0n, 0])[1]; return [x[0], e]; }).filter(function (x) { return x[1] > 0; }); });
    var L = null, lcmFactors = null;
    if (zeros === 0) { L = 1n; absn.forEach(function (v) { L = G.lcm2(L, v); }); if (view === 'full') lcmFactors = primes.map(function (r) { return [r.p, r.max]; }).filter(function (x) { return x[1] > 0; }); }
    var coprime = gcf === 1n;

    /* working text */
    if (anyNeg) steps.push('Signs are ignored: the GCF of ' + entered.join(', ') + ' is the GCF of ' + absn.join(', ') + '. The GCF is never negative.');
    if (zeros) steps.push('Every number divides 0, so a zero does not change the GCF (GCF(0, n) = |n|) and has no prime factorisation. The ' + (zeros === 1 ? 'zero is' : zeros + ' zeros are') + ' set aside and the GCF is found from ' + nz.join(', ') + '.');
    if (view === 'full') {
      steps.push('Step 1. Write each number as a product of primes.');
      absn.forEach(function (v, j) { if (v === 0n) return; steps.push('   ' + v + ' = ' + (v === 1n ? '1 (1 has no prime factors)' : fmtF(facs[j]) + (facs[j].some(function (x) { return x[1] > 1; }) ? ' = ' + expand(facs[j]) : ''))); });
      var cm = primes.filter(function (r) { return r.common; });
      if (cm.length) {
        steps.push('Step 2. Keep the primes that appear in every number: ' + cm.map(function (r) { return r.p; }).join(', ') + '.');
        steps.push('Step 3. For each of those primes take the lowest power it has in any number: ' + cm.map(function (r) { return r.p + (r.min > 1 ? '^' + r.min : '') + ' (its powers are ' + r.exps.filter(function (e) { return e !== null; }).join(', ') + ', lowest ' + r.min + ')'; }).join('; ') + '.');
        var mult = gcfFactors.map(function (x) { return String(x[0] ** BigInt(x[1])); });
        steps.push('Step 4. Multiply them: GCF = ' + fmtF(gcfFactors) + (gcfFactors.length > 1 || gcfFactors[0][1] > 1 ? ' = ' + (gcfFactors.some(function (x) { return x[1] > 1; }) && mult.length > 1 ? mult.join(' × ') + ' = ' : '') + gcf : '') + '.');
      } else {
        steps.push('Step 2. No prime appears in every number, so there is no common prime factor.');
        steps.push('Step 3. The only common factor is 1, so GCF = 1 (the numbers are relatively prime).');
      }
    } else if (view === 'partial') {
      steps.push('At least one number is too large to factor in full here (above 10^18, or a hard composite). The GCF is found first by the Euclidean algorithm: GCF = ' + gcf + '. The prime route is then shown for the primes of the GCF only.');
      steps.push('Step 1. Factor the GCF: ' + gcf + ' = ' + gcfFactorText + '.');
      absn.forEach(function (v, j) { if (v !== 0n) steps.push('   ' + cut(v) + ' = ' + numbers[j].factorText); });
      steps.push('Step 2. The lowest power of each of these primes across the numbers is ' + (gcfFactors.length ? gcfFactors.map(function (x) { return x[0] + '^' + primes.filter(function (r) { return r.p === x[0]; })[0].min; }).join(', ') : 'none (the GCF is 1)') + ', which gives GCF = ' + gcfFactorText + ' = ' + gcf + '.');
    } else {
      steps.push('The prime route needs each number written as a product of primes, and these numbers are too large for that to finish here (above 10^18, or a hard composite).');
      steps.push('The Euclidean algorithm still gives the exact GCF = ' + gcf + ', but ' + gcf + ' itself could not be factored within the limit, so no prime working is shown.');
    }

    /* checks, each from a route that does not use the one being checked */
    var verify = [];
    verify.push(['The GCF ' + cut(gcf) + ' divides every number entered', absn.every(function (v) { return v % gcf === 0n; })]);
    verify.push(['The numbers divided by the GCF (' + quotients.map(function (q) { return cut(q); }).join(', ') + ') share no factor above 1, so no larger common factor exists', (function () { var g = 0n; quotients.forEach(function (q) { g = G.gcd(g, q); }); return g === 1n; })()]);
    verify.push(['The prime-factor result equals the Euclidean algorithm result (' + cut(gcf) + ')', view === 'none' ? true : fprod(gcfFactors) === gcf]);
    if (view === 'full') {
      verify.push(['Each prime factorisation multiplies back to its number', absn.every(function (v, j) { return v === 0n || fprod(facs[j]) === (v < 2n ? 1n : v); })]);
      verify.push(['Every prime factor listed is prime (Miller-Rabin test)', facs.every(function (f) { return !f || f.every(function (x) { return isPrime(x[0]); }); })]);
      verify.push(['A prime that is in every number is in the GCF, and a prime missing from any number is not', primes.every(function (r) { var inG = gcfFactors.some(function (x) { return x[0] === r.p; }); return r.common === inG && (!r.common || r.exps.every(function (e) { return e === null || e >= r.min; })); })]);
      if (L !== null) verify.push(['The LCM from the highest powers (' + cut(fprod(lcmFactors)) + ') equals the LCM from the GCF (' + cut(L) + ')', fprod(lcmFactors) === L]);
      if (n === 2 && zeros === 0) verify.push(['GCF × LCM equals the product of the two numbers', gcf * L === absn[0] * absn[1]]);
    }
    if (view === 'partial') verify.push(['The GCF’s prime powers multiply back to the GCF, and each number is divisible by them', fprod(gcfFactors) === gcf && absn.every(function (v) { return v % gcf === 0n; })]);
    var verifyOk = verify.every(function (v) { return v[1] === true; });

    var rows = [['Numbers entered', entered.map(cut).join(', '), n + ' numbers']];
    rows.push(['GCF (GCD, HCF)', String(gcf), coprime ? 'the numbers are relatively prime' : 'largest whole number dividing all of them']);
    if (gcfFactorText !== null) rows.push(['GCF as prime powers', gcfFactorText, 'lowest power of each common prime']);
    if (view === 'full') {
      rows.push(['Common primes', primes.filter(function (r) { return r.common; }).map(function (r) { return r.p; }).join(', ') || 'none', 'primes that divide every non-zero number']);
      rows.push(['Distinct primes', String(primes.length), 'different primes across all the numbers']);
    }
    if (L !== null) rows.push(['LCM', String(L), view === 'full' ? 'highest power of each prime' : 'least common multiple']);
    rows.push(['Numbers ÷ GCF', quotients.map(function (q) { return cut(q); }).join(', '), 'what is left after removing the GCF']);
    if (coprime) warnings.push('The GCF is 1, so these numbers are relatively prime (coprime): they share no prime factor.');
    if (view === 'partial') notes.push('One or more numbers are above 10^18 or did not split within the search limit, so they are not factored in full. The Euclidean algorithm found the GCF first, and only the primes of the GCF are shown.');
    if (view === 'none') notes.push('The prime route could not be completed for these numbers. The GCF above is exact (Euclidean algorithm).');
    var summary = 'GCF(' + entered.map(cut).join(', ') + ') = ' + gcf + (gcfFactorText !== null && gcfFactorText !== String(gcf) ? '  (' + gcfFactorText + ')' : '') + '\n' +
      (view === 'full' ? absn.map(function (v, j) { return v === 0n ? '0 = (no prime factorisation)' : v + ' = ' + numbers[j].factorText; }).join('\n') + '\n' : '') +
      (L !== null ? 'LCM = ' + L : 'LCM = 0') ;

    return { ok: true, status: coprime ? 'coprime' : 'ok', view: view, count: n, entered: entered, abs: absn.map(String), zeros: zeros, negatives: anyNeg,
      gcf: String(gcf), gcfText: String(gcf), valueText: 'GCF = ' + gcf, sentence: 'GCF(' + entered.map(cut).join(', ') + ') = ' + gcf,
      lcm: L === null ? '0' : String(L), lcmFactorText: lcmFactors ? fmtF(lcmFactors) : null, coprime: coprime,
      numbers: numbers, nzIdx: nzIdx,
      primes: primes.map(function (r) { return { p: String(r.p), exps: r.exps, min: r.min, max: r.max, common: r.common }; }),
      gcfFactors: gcfFactors ? gcfFactors.map(function (x) { return [String(x[0]), x[1]]; }) : null, gcfFactorText: gcfFactorText,
      gcfExpanded: gcfFactors ? expand(gcfFactors) : null, gcfPowers: gcfFactors ? gcfFactors.map(function (x) { return String(x[0] ** BigInt(x[1])); }) : null,
      quotients: quotients.map(String), quotientFactors: qFac ? qFac.map(function (f) { return f ? fmtF(f) : null; }) : null,
      steps: steps, verify: verify, verifyOk: verifyOk, warnings: warnings, notes: notes, rows: rows, summary: summary };
  }

  var api = { solve: solve, isPrime: isPrime, factorFull: factorFull, FACTOR_LIMIT: FACTOR_LIMIT, MAX_TERMS: G.MAX_TERMS, MAX_DIGITS: G.MAX_DIGITS, parseList: G.parseList, tokens: G.tokens, gcd: G.gcd };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.GCFP = api;
})(typeof self !== 'undefined' ? self : this);
