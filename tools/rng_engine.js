/* Elecmetric Random Number Generator: engine for Modes 01 (Random Integers), 02 (Random Decimals), 03 (Unique Numbers), 04 (Statistical Sampling) and 05 (Engineering Test Data). One file, no dependencies, no DOM.
   Integers are BigInt, so ranges of up to 1,000 digits are exact. Required by tests/rng_test.js and inlined into the page by tools/rng_page.js.
   Unseeded numbers come from the Web Crypto API (crypto.getRandomValues). A value is drawn from an inclusive range by rejection sampling, so every
   value is equally likely (no modulo bias). Unique numbers are drawn without replacement by a sparse Fisher-Yates shuffle.
   Seeded numbers come from a documented, reproducible pseudorandom generator: cyrb128 turns the seed text into four 32-bit words, sfc32 (after 12 discarded outputs)
   supplies 32-bit words, and each word is split into 4 bytes, big-endian. A seed is NOT secure: use it only for repeatable simulations and tests. */
(function (root) {
  'use strict';
  var MAX_COUNT = 10000, MAX_DIGITS = 1000, MAX_SEED = 200, ZERO = BigInt(0), ONE = BigInt(1), EIGHT = BigInt(8);

  /* ---------- byte sources ---------- */
  function cryptoObj() {
    var g = typeof globalThis !== 'undefined' ? globalThis : root;
    if (g && g.crypto && typeof g.crypto.getRandomValues === 'function') return g.crypto;
    if (typeof require !== 'undefined') { try { return require('crypto').webcrypto; } catch (e) { /* fall through */ } }
    return null;
  }
  function cryptoSource() {
    var c = cryptoObj(); if (!c) throw new Error('Web Crypto is not available in this browser.');
    return function (n) { var b = new Uint8Array(n), i; for (i = 0; i < n; i += 65536) c.getRandomValues(b.subarray(i, Math.min(n, i + 65536))); return b; };
  }
  function cyrb128(str) {
    var h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762, i, k;
    for (i = 0; i < str.length; i++) {
      k = str.charCodeAt(i);
      h1 = h2 ^ Math.imul(h1 ^ k, 597399067); h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
      h3 = h4 ^ Math.imul(h3 ^ k, 951274213); h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067); h2 = Math.imul(h4 ^ (h2 >>> 19), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213); h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    h1 ^= (h2 ^ h3 ^ h4); h2 ^= h1; h3 ^= h1; h4 ^= h1;
    return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
  }
  function sfc32(s) {
    var a = s[0] | 0, b = s[1] | 0, c = s[2] | 0, d = s[3] | 0;
    return function () {
      var t = (a + b) | 0; a = b ^ (b >>> 9); b = (c + (c << 3)) | 0; c = (c << 21) | (c >>> 11); d = (d + 1) | 0; t = (t + d) | 0; c = (c + t) | 0;
      return t >>> 0;
    };
  }
  function seededSource(seed) {
    var next = sfc32(cyrb128(String(seed))), i;
    for (i = 0; i < 12; i++) next();
    return function (n) {
      var b = new Uint8Array(n), j = 0, w;
      while (j < n) { w = next(); b[j++] = w >>> 24; if (j < n) b[j++] = (w >>> 16) & 255; if (j < n) b[j++] = (w >>> 8) & 255; if (j < n) b[j++] = w & 255; }
      return b;
    };
  }

  /* ---------- uniform BigInt below n (rejection sampling) ---------- */
  function below(n, src) {
    if (n <= ONE) return ZERO;
    var bits = (n - ONE).toString(2).length, nb = Math.ceil(bits / 8), mask = 255 >> (nb * 8 - bits), v, i, b;
    for (;;) {
      b = src(nb); b[0] &= mask; v = ZERO;
      for (i = 0; i < nb; i++) v = (v << EIGHT) | BigInt(b[i]);
      if (v < n) return v;
    }
  }


  /* ---------- exact descriptive statistics for whole numbers and decimal grids (Modes 01 to 03) ----------
     Values are scaled to integers (BigInt), so the mean, median and sample standard deviation stay exact however large the numbers are.
     They are rounded half away from zero to `places + 4` decimal places and shown without trailing zeros. */
  var TWO = BigInt(2), TEN_ = BigInt(10);
  function isqrt(n) { if (n < TWO) return n; var x = ONE << BigInt(Math.ceil(n.toString(2).length / 2)), y; for (;;) { y = (x + n / x) >> ONE; if (y >= x) return x; x = y; } }
  function ratStr(num, den, scale, outP) {
    var neg = num < ZERO, D = den * TEN_ ** BigInt(scale), T = TEN_ ** BigInt(outP), q, t, ip, fp;
    if (neg) num = -num;
    q = (TWO * num * T + D) / (TWO * D); t = q.toString(); while (t.length < outP + 1) t = '0' + t;
    ip = t.slice(0, t.length - outP); fp = t.slice(t.length - outP).replace(/0+$/, '');
    return (neg && q > ZERO ? '-' : '') + ip + (fp ? '.' + fp : '');
  }
  function describe(strs, places) {
    var n = strs.length, X = strs.map(function (v) { return BigInt(v.replace('.', '')); }), S = ZERO, Q = ZERO, outP = places + 4, e = outP + 1, m, sorted, med, mean, sd = null, R, last, t;
    X.forEach(function (x) { S += x; Q += x * x; });
    sorted = X.slice().sort(function (a, b) { return a < b ? -1 : a > b ? 1 : 0; });
    m = n >> 1; med = n % 2 ? ratStr(sorted[m], ONE, places, outP) : ratStr(sorted[m - 1] + sorted[m], TWO, places, outP);
    mean = ratStr(S, BigInt(n), places, outP);
    if (n > 1) {
      R = isqrt((BigInt(n) * Q - S * S) * TEN_ ** BigInt(2 * e) / (BigInt(n) * BigInt(n - 1) * TEN_ ** BigInt(2 * places)));
      last = R % TEN_; R = R / TEN_ + (last >= BigInt(5) ? ONE : ZERO); t = R.toString(); while (t.length < outP + 1) t = '0' + t;
      sd = t.slice(0, t.length - outP) + (t.slice(t.length - outP).replace(/0+$/, '') ? '.' + t.slice(t.length - outP).replace(/0+$/, '') : '');
    }
    return { mean: mean, median: med, sd: sd };
  }

  /* ---------- input parsing ---------- */
  function parseInt_(txt, label) {
    var s = String(txt == null ? '' : txt).trim().replace(/^\+/, '');
    if (!s) return { error: 'Enter the ' + label + '.' };
    if (/^-?\d+[.,]\d*$/.test(s) || /^-?\.\d+$/.test(s)) return { error: 'The ' + label + ' must be a whole number. This mode generates integers.' };
    if (!/^-?\d+$/.test(s)) return { error: 'The ' + label + ' \u2018' + String(txt).trim().slice(0, 30) + '\u2019 is not a whole number. Use digits only, with an optional minus sign.' };
    if (s.replace('-', '').replace(/^0+(?=\d)/, '').length > MAX_DIGITS) return { error: 'The ' + label + ' is longer than ' + MAX_DIGITS + ' digits.' };
    return { v: BigInt(s) };
  }
  function parseCount(txt) {
    var s = String(txt == null ? '' : txt).trim();
    if (!s) return { error: 'Enter how many numbers to generate.' };
    if (!/^\d+$/.test(s)) return { error: 'The quantity must be a whole number from 1 to ' + MAX_COUNT + '.' };
    var n = Number(s); if (n < 1 || n > MAX_COUNT) return { error: 'The quantity must be from 1 to ' + MAX_COUNT + '.' };
    return { v: n };
  }

  /* ---------- generator ---------- */
  function integers(o) {
    o = o || {};
    var lo = parseInt_(o.min, 'minimum'); if (lo.error) return { ok: false, error: lo.error };
    var hi = parseInt_(o.max, 'maximum'); if (hi.error) return { ok: false, error: hi.error };
    var ct = parseCount(o.count); if (ct.error) return { ok: false, error: ct.error };
    if (lo.v > hi.v) return { ok: false, error: 'The minimum must not be greater than the maximum.' };
    var sort = o.sort === 'asc' || o.sort === 'desc' ? o.sort : 'none', unique = !!o.unique, seed = o.seed == null ? '' : String(o.seed);
    if (seed.length > MAX_SEED) return { ok: false, error: 'The seed is limited to ' + MAX_SEED + ' characters.' };
    var span = hi.v - lo.v + ONE, count = ct.v;
    if (unique && BigInt(count) > span) return { ok: false, error: 'You asked for ' + count + ' unique numbers, but there are only ' + span.toString() + ' whole number' + (span === ONE ? '' : 's') + ' from ' + lo.v + ' to ' + hi.v + '. Lower the quantity, widen the range or allow duplicates.' };
    var seeded = seed !== '', src;
    try { src = o.source || (seeded ? seededSource(seed) : cryptoSource()); } catch (e) { return { ok: false, error: e.message }; }
    var vals = [], i;
    if (!unique) {
      for (i = 0; i < count; i++) vals.push(lo.v + below(span, src));
    } else {
      var map = new Map(), I, J, vi, vj;
      for (i = 0; i < count; i++) {
        I = BigInt(i); J = I + below(span - I, src);
        vi = map.has(I) ? map.get(I) : I; vj = map.has(J) ? map.get(J) : J;
        map.set(J, vi); vals.push(lo.v + vj);
      }
    }
    var orig = vals.slice();
    if (sort !== 'none') vals.sort(function (a, b) { return a < b ? (sort === 'asc' ? -1 : 1) : a > b ? (sort === 'asc' ? 1 : -1) : 0; });
    var mn = vals[0], mx = vals[0], sum = ZERO;
    vals.forEach(function (v) { if (v < mn) mn = v; if (v > mx) mx = v; sum += v; });
    var bits = span <= ONE ? 0 : (span - ONE).toString(2).length;
    return {
      ok: true, values: vals.map(String), original: orig.map(String), count: count, min: lo.v.toString(), max: hi.v.toString(), span: span.toString(), bits: bits,
      unique: unique, sort: sort, seed: seeded ? seed : '', seeded: seeded, source: seeded ? 'Seeded sfc32 (reproducible, not secure)' : 'Web Crypto (crypto.getRandomValues)',
      stats: Object.assign({ n: count, min: mn.toString(), max: mx.toString(), sum: sum.toString() }, describe(vals.map(String), 0))
    };
  }


  /* ---------- Mode 02: decimals on a fixed grid ----------
     Decimals are drawn from the grid of numbers with exactly `places` decimal places between the minimum and maximum (ends included when they lie on the grid).
     The grid is mapped to consecutive integers, one is chosen uniformly by the integer engine above, then it is written back with `places` places.
     No floating-point values are generated, so every grid value is equally likely and the digits are exact. */
  var TEN = BigInt(10);
  function parseDec(txt, label) {
    var s = String(txt == null ? '' : txt).trim().replace(/^\+/, '');
    if (!s) return { error: 'Enter the ' + label + '.' };
    var m = /^(-?)(\d*)(?:\.(\d*))?$/.exec(s);
    if (!m || (m[2] === '' && (m[3] === undefined || m[3] === ''))) return { error: 'The ' + label + ' \u2018' + String(txt).trim().slice(0, 30) + '\u2019 is not a number. Use digits with an optional minus sign and decimal point.' };
    var ip = m[2] || '0', fp = m[3] || '';
    if ((ip.replace(/^0+(?=\d)/, '') + fp).length > MAX_DIGITS) return { error: 'The ' + label + ' is longer than ' + MAX_DIGITS + ' digits.' };
    var n = BigInt(ip + fp); return { n: m[1] ? -n : n, f: fp.length };
  }
  function floorDiv(a, b) { var q = a / b; return (a % b !== ZERO && (a < ZERO) !== (b < ZERO)) ? q - ONE : q; }
  function fmt(v, d) {
    var neg = v < ZERO, a = (neg ? -v : v).toString();
    if (d > 0) { while (a.length <= d) a = '0' + a; a = a.slice(0, a.length - d) + '.' + a.slice(a.length - d); }
    return (neg && /[1-9]/.test(a) ? '-' : '') + a;
  }
  function decimals(o) {
    o = o || {};
    var pl = String(o.places == null ? '' : o.places).trim();
    if (!/^\d+$/.test(pl) || Number(pl) > 15) return { ok: false, error: 'Decimal places must be a whole number from 0 to 15.' };
    var d = Number(pl), lo = parseDec(o.min, 'minimum'); if (lo.error) return { ok: false, error: lo.error };
    var hi = parseDec(o.max, 'maximum'); if (hi.error) return { ok: false, error: hi.error };
    var ct = parseCount(o.count); if (ct.error) return { ok: false, error: ct.error };
    var D = BigInt(d), sc = function (x, up) { if (x.f <= d) return x.n * TEN ** BigInt(d - x.f); var p = TEN ** BigInt(x.f - d); return up ? -floorDiv(-x.n, p) : floorDiv(x.n, p); };
    var a = sc(lo, true), b = sc(hi, false);
    if (lo.n * TEN ** BigInt(Math.max(hi.f - lo.f, 0)) > hi.n * TEN ** BigInt(Math.max(lo.f - hi.f, 0))) return { ok: false, error: 'The minimum must not be greater than the maximum.' };
    if (a > b) return { ok: false, error: 'No number with ' + d + ' decimal place' + (d === 1 ? '' : 's') + ' lies between the minimum and maximum. Use more decimal places or widen the range.' };
    var span = b - a + ONE;
    if (o.unique && BigInt(ct.v) > span) return { ok: false, error: 'You asked for ' + ct.v + ' unique numbers, but only ' + span.toString() + ' different number' + (span === ONE ? '' : 's') + ' with ' + d + ' decimal place' + (d === 1 ? '' : 's') + ' lie from ' + fmt(a, d) + ' to ' + fmt(b, d) + '. Lower the quantity, add decimal places or allow duplicates.' };
    var r = integers({ min: a.toString(), max: b.toString(), count: o.count, unique: o.unique, sort: o.sort, seed: o.seed, source: o.source });
    if (!r.ok) return r;
    var f = function (x) { return fmt(BigInt(x), d); };
    r.values = r.values.map(f); r.original = r.original.map(f); r.min = fmt(a, d); r.max = fmt(b, d); r.places = d; r.decimal = true; r.grid = r.span;
    r.stats = Object.assign({ n: r.stats.n, min: f(r.stats.min), max: f(r.stats.max), sum: f(r.stats.sum) }, describe(r.values, d));
    r.adjusted = lo.n * TEN ** BigInt(Math.max(d - lo.f, 0)) !== a * TEN ** BigInt(Math.max(lo.f - d, 0)) || hi.n * TEN ** BigInt(Math.max(d - hi.f, 0)) !== b * TEN ** BigInt(Math.max(hi.f - d, 0));
    return r;
  }

  /* ---------- Mode 03: unique numbers ----------
     Always drawn without replacement, from integers or from a decimal grid, with an optional list of numbers to leave out.
     The pool is the range minus the excluded numbers. A partial Fisher-Yates shuffle (the integer engine above) picks `count` distinct positions 0..pool-1,
     and each position is mapped back to a value by skipping the excluded ones. With no exclusions the draw is identical to integers({unique:true}). */
  var MAX_EXCL = 10000;
  function fact(n, k) { var r = ONE, i; for (i = 0; i < k; i++) r *= (n - BigInt(i)); return r; } /* n (n-1) ... (n-k+1) */
  function hint(hasEx, dec) {
    var l = ['lower the quantity'], t; if (hasEx) l.push('shorten the exclude list'); l.push('widen the range'); if (dec) l.push('add decimal places');
    t = l.pop(); return (l.join(', ') + ' or ' + t + '.').replace(/^./, function (c) { return c.toUpperCase(); });
  }
  function uniques(o) {
    o = o || {};
    var dec = o.type === 'dec', d = 0, lo, hi, a, b, D;
    if (dec) {
      var pl = String(o.places == null ? '' : o.places).trim();
      if (!/^\d+$/.test(pl) || Number(pl) > 15) return { ok: false, error: 'Decimal places must be a whole number from 0 to 15.' };
      d = Number(pl);
    }
    var pm = dec ? parseDec : parseInt_;
    lo = pm(o.min, 'minimum'); if (lo.error) return { ok: false, error: lo.error };
    hi = pm(o.max, 'maximum'); if (hi.error) return { ok: false, error: hi.error };
    var ct = parseCount(o.count); if (ct.error) return { ok: false, error: ct.error };
    D = BigInt(d);
    var scale = function (x, up) { if (!dec) return x.v; if (x.f <= d) return x.n * TEN ** BigInt(d - x.f); var p = TEN ** BigInt(x.f - d); return up ? -floorDiv(-x.n, p) : floorDiv(x.n, p); };
    if (dec) { if (lo.n * TEN ** BigInt(Math.max(hi.f - lo.f, 0)) > hi.n * TEN ** BigInt(Math.max(lo.f - hi.f, 0))) return { ok: false, error: 'The minimum must not be greater than the maximum.' }; }
    else if (lo.v > hi.v) return { ok: false, error: 'The minimum must not be greater than the maximum.' };
    a = scale(lo, true); b = scale(hi, false);
    if (a > b) return { ok: false, error: 'No number with ' + d + ' decimal place' + (d === 1 ? '' : 's') + ' lies between the minimum and maximum. Use more decimal places or widen the range.' };
    var seed = o.seed == null ? '' : String(o.seed);
    if (seed.length > MAX_SEED) return { ok: false, error: 'The seed is limited to ' + MAX_SEED + ' characters.' };
    var span = b - a + ONE;
    /* numbers to leave out */
    var toks = String(o.exclude == null ? '' : o.exclude).split(/[\s,;]+/).filter(function (t) { return t !== ''; }), ex = new Map(), ignored = [], i, t, pv, q;
    if (toks.length > MAX_EXCL) return { ok: false, error: 'The exclude list is limited to ' + MAX_EXCL + ' numbers.' };
    for (i = 0; i < toks.length; i++) {
      t = toks[i]; pv = pm(t, 'excluded number');
      if (pv.error) return { ok: false, error: 'The excluded number \u2018' + t.slice(0, 30) + '\u2019 is not ' + (dec ? 'a number' : 'a whole number') + '. Separate excluded numbers with commas, spaces or new lines.' };
      if (dec) {
        if (pv.f > d) { q = TEN ** BigInt(pv.f - d); if (pv.n % q !== ZERO) { ignored.push(t); continue; } q = pv.n / q; } else q = pv.n * TEN ** BigInt(d - pv.f);
      } else q = pv.v;
      if (q < a || q > b) { ignored.push(t); continue; }
      ex.set((q - a).toString(), q - a);
    }
    var exs = Array.from(ex.values()).sort(function (x, y) { return x < y ? -1 : x > y ? 1 : 0; }), pool = span - BigInt(exs.length), count = ct.v;
    if (pool <= ZERO) return { ok: false, error: 'Every number in the range is excluded, so there is nothing to draw from.' };
    if (BigInt(count) > pool) return { ok: false, error: 'You asked for ' + count + ' unique numbers, but only ' + pool.toString() + ' ' + (pool === ONE ? 'number is' : 'numbers are') + ' available' + (exs.length ? ' after leaving out ' + exs.length + ' excluded number' + (exs.length === 1 ? '' : 's') : '') + '. ' + hint(exs.length > 0, dec) };
    var r = integers({ min: '0', max: (pool - ONE).toString(), count: count, unique: true, seed: seed, source: o.source });
    if (!r.ok) return r;
    var toVal = function (x) { var p = BigInt(x), j; for (j = 0; j < exs.length; j++) { if (exs[j] <= p) p += ONE; else break; } return a + p; };
    var vals = r.original.map(toVal), orig = vals.slice(), sort = o.sort === 'asc' || o.sort === 'desc' ? o.sort : 'none';
    if (sort !== 'none') vals.sort(function (x, y) { return x < y ? (sort === 'asc' ? -1 : 1) : x > y ? (sort === 'asc' ? 1 : -1) : 0; });
    var mn = vals[0], mx = vals[0], sum = ZERO;
    vals.forEach(function (v) { if (v < mn) mn = v; if (v > mx) mx = v; sum += v; });
    var f = function (x) { return dec ? fmt(x, d) : x.toString(); }, exact = pool < TEN ** BigInt(40) && count <= 2000, perms = null, combos = null, k;
    if (exact) { perms = fact(pool, count); k = ONE; for (i = 2; i <= count; i++) k *= BigInt(i); combos = perms / k; perms = perms.toString(); combos = combos.toString(); }
    return {
      ok: true, mode: 'unique', values: vals.map(f), original: orig.map(f), count: count, min: f(a), max: f(b), span: span.toString(), pool: pool.toString(),
      excluded: exs.length, excludedList: exs.map(function (x) { return f(a + x); }), ignored: ignored, combos: combos, perms: perms,
      unique: true, sort: sort, seed: r.seed, seeded: r.seeded, source: r.source, decimal: dec, places: d, grid: dec ? span.toString() : null, full: BigInt(count) === pool,
      stats: Object.assign({ n: count, min: f(mn), max: f(mx), sum: f(sum) }, describe(vals.map(f), dec ? d : 0))
    };
  }

  /* ---------- Mode 04: statistical sampling ----------
     Every distribution is sampled from uniform numbers u strictly between 0 and 1. A uniform number is built from 53 random bits:
     u = (k + 0.5) / 2^53 with k taken from 7 bytes (the top 3 bits of the first byte are dropped), so u is never 0 or 1 and log(u) is always defined.
       Uniform(a, b):        x = a + (b - a) u
       Normal(mu, sigma):    Box-Muller, z0 = sqrt(-2 ln u1) cos(2 pi u2) and z1 = sqrt(-2 ln u1) sin(2 pi u2) used in turn, x = mu + sigma z
       Exponential(rate):    x = -ln(u) / rate
       Triangular(a, c, b):  inverse CDF, with Fc = (c - a) / (b - a)
       Poisson(lambda):      inversion by sequential search of the cumulative probabilities (lambda up to 700)
       Binomial(n, p):       inversion by sequential search (n up to 1000; for p above 1/2 the count of failures is searched and subtracted from n)
     Continuous values are rounded to the chosen decimal places and the statistics and histogram describe the rounded values that are listed. */
  var TWO53 = 9007199254740992, MAX_PAR = 1e15;
  function unif(src) {
    var b = src(7);
    return ((b[0] & 31) * 281474976710656 + b[1] * 1099511627776 + b[2] * 4294967296 + b[3] * 16777216 + b[4] * 65536 + b[5] * 256 + b[6] + 0.5) / TWO53;
  }
  function poissonInv(lam, u) { var x = 0, p = Math.exp(-lam), s = p, lim = Math.ceil(lam + 40 * Math.sqrt(lam) + 100); while (u > s && x < lim) { x++; p *= lam / x; s += p; } return x; }
  function binomInv(n, pr, u) {
    if (pr === 0) return 0; if (pr === 1) return n;
    var flip = pr > 0.5, q = flip ? 1 - pr : pr, r = q / (1 - q), pk = Math.pow(1 - q, n), s = pk, k = 0;
    while (u > s && k < n) { pk *= (n - k) / (k + 1) * r; k++; s += pk; }
    return flip ? n - k : k;
  }
  var DISTS = {
    uniform: { name: 'Uniform', discrete: false }, normal: { name: 'Normal', discrete: false }, exponential: { name: 'Exponential', discrete: false },
    triangular: { name: 'Triangular', discrete: false }, poisson: { name: 'Poisson', discrete: true }, binomial: { name: 'Binomial', discrete: true }
  };
  function num(txt, label, field) {
    var s = String(txt == null ? '' : txt).trim().replace(/^\+/, '');
    if (!s) return { error: 'Enter the ' + label + '.', field: field };
    if (!/^-?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s)) return { error: 'The ' + label + ' \u2018' + String(txt).trim().slice(0, 30) + '\u2019 is not a number.', field: field };
    var v = Number(s); if (!isFinite(v) || Math.abs(v) > MAX_PAR) return { error: 'The ' + label + ' must be between \u22121e15 and 1e15.', field: field };
    return { v: v };
  }
  function nsum(a) { var s = 0, c = 0, i, t; for (i = 0; i < a.length; i++) { t = s + a[i]; c += Math.abs(s) >= Math.abs(a[i]) ? (s - t) + a[i] : (a[i] - t) + s; s = t; } return s + c; }
  function histogram(vals, bins, discrete) {
    var n = vals.length, mn = vals[0], mx = vals[0], i, k, w, out = [], b;
    for (i = 1; i < n; i++) { if (vals[i] < mn) mn = vals[i]; if (vals[i] > mx) mx = vals[i]; }
    if (discrete) {
      var rng = mx - mn + 1; w = 1;
      if (bins) { k = Math.min(bins, rng); w = Math.ceil(rng / k); } else if (rng > 60) { w = Math.ceil(rng / 40); }
      k = Math.ceil(rng / w);
      for (i = 0; i < k; i++) { b = { lo: mn + i * w, hi: Math.min(mx, mn + (i + 1) * w - 1), count: 0 }; b.label = b.lo === b.hi ? String(b.lo) : b.lo + '\u2013' + b.hi; out.push(b); }
      for (i = 0; i < n; i++) out[Math.floor((vals[i] - mn) / w)].count++;
      return { bins: out, k: k, width: w, discrete: true, min: mn, max: mx };
    }
    k = bins || (n < 2 ? 1 : Math.min(30, Math.max(5, Math.ceil(Math.log(n) / Math.LN2) + 1)));
    if (mn === mx) k = 1;
    w = k === 1 ? 0 : (mx - mn) / k;
    for (i = 0; i < k; i++) out.push({ lo: mn + i * w, hi: i === k - 1 ? mx : mn + (i + 1) * w, count: 0 });
    for (i = 0; i < n; i++) out[k === 1 ? 0 : Math.min(k - 1, Math.floor((vals[i] - mn) / w))].count++;
    return { bins: out, k: k, width: w, discrete: false, min: mn, max: mx };
  }
  function sample(o) {
    o = o || {};
    var key = String(o.dist || ''), D = DISTS[key], p = {}, t, e;
    if (!D) return { ok: false, error: 'Choose a distribution.', field: 'dist' };
    var ct = parseCount(o.count); if (ct.error) return { ok: false, error: ct.error, field: 'count' };
    var P = function (f, label) { t = num(o[f], label, f); if (t.error) { e = t; return false; } p[f] = t.v; return true; };
    e = null;
    if (key === 'uniform') {
      if (!P('p1', 'minimum') || !P('p2', 'maximum')) return { ok: false, error: e.error, field: e.field };
      if (!(p.p1 < p.p2)) return { ok: false, error: 'The minimum must be less than the maximum.', field: 'p1' };
    } else if (key === 'normal') {
      if (!P('p1', 'mean') || !P('p2', 'standard deviation')) return { ok: false, error: e.error, field: e.field };
      if (!(p.p2 > 0)) return { ok: false, error: 'The standard deviation must be greater than 0.', field: 'p2' };
    } else if (key === 'exponential') {
      if (!P('p1', 'rate')) return { ok: false, error: e.error, field: e.field };
      if (!(p.p1 > 0)) return { ok: false, error: 'The rate must be greater than 0.', field: 'p1' };
    } else if (key === 'triangular') {
      if (!P('p1', 'minimum') || !P('p2', 'mode (most likely value)') || !P('p3', 'maximum')) return { ok: false, error: e.error, field: e.field };
      if (!(p.p1 < p.p3)) return { ok: false, error: 'The minimum must be less than the maximum.', field: 'p1' };
      if (p.p2 < p.p1 || p.p2 > p.p3) return { ok: false, error: 'The mode must lie between the minimum and the maximum.', field: 'p2' };
    } else if (key === 'poisson') {
      if (!P('p1', 'mean')) return { ok: false, error: e.error, field: e.field };
      if (!(p.p1 > 0) || p.p1 > 700) return { ok: false, error: 'The Poisson mean must be greater than 0 and at most 700.', field: 'p1' };
    } else {
      if (!P('p1', 'number of trials') || !P('p2', 'success probability')) return { ok: false, error: e.error, field: e.field };
      if (p.p1 !== Math.floor(p.p1) || p.p1 < 1 || p.p1 > 1000) return { ok: false, error: 'The number of trials must be a whole number from 1 to 1000.', field: 'p1' };
      if (p.p2 < 0 || p.p2 > 1) return { ok: false, error: 'The success probability must be from 0 to 1.', field: 'p2' };
    }
    var d = 0;
    if (!D.discrete) {
      var pl = String(o.places == null ? '' : o.places).trim();
      if (!/^\d+$/.test(pl) || Number(pl) > 15) return { ok: false, error: 'Decimal places must be a whole number from 0 to 15.', field: 'places' };
      d = Number(pl);
    }
    var bs = String(o.bins == null ? '' : o.bins).trim().toLowerCase(), bins = 0;
    if (bs !== '' && bs !== 'auto') { if (!/^\d+$/.test(bs) || Number(bs) < 2 || Number(bs) > 100) return { ok: false, error: 'Histogram bins must be \u201cauto\u201d or a whole number from 2 to 100.', field: 'bins' }; bins = Number(bs); }
    var sort = o.sort === 'asc' || o.sort === 'desc' ? o.sort : 'none', seed = o.seed == null ? '' : String(o.seed), seeded = seed !== '';
    if (seed.length > MAX_SEED) return { ok: false, error: 'The seed is limited to ' + MAX_SEED + ' characters.', field: 'seed' };
    var src; try { src = o.source || (seeded ? seededSource(seed) : cryptoSource()); } catch (ex) { return { ok: false, error: ex.message }; }
    var nums = [], i, u, c, z1 = null, x, R2PI = 2 * Math.PI, a, b, m, fc;
    for (i = 0; i < ct.v; i++) {
      if (key === 'uniform') x = p.p1 + (p.p2 - p.p1) * unif(src);
      else if (key === 'normal') { if (z1 !== null) { x = z1; z1 = null; } else { u = unif(src); c = unif(src); a = Math.sqrt(-2 * Math.log(u)); x = a * Math.cos(R2PI * c); z1 = a * Math.sin(R2PI * c); } x = p.p1 + p.p2 * x; }
      else if (key === 'exponential') x = -Math.log(unif(src)) / p.p1;
      else if (key === 'triangular') { a = p.p1; m = p.p2; b = p.p3; u = unif(src); fc = (m - a) / (b - a); x = u < fc ? a + Math.sqrt(u * (b - a) * (m - a)) : b - Math.sqrt((1 - u) * (b - a) * (b - m)); }
      else if (key === 'poisson') x = poissonInv(p.p1, unif(src));
      else x = binomInv(p.p1, p.p2, unif(src));
      nums.push(x);
    }
    var strs = nums.map(function (v) { if (D.discrete) return String(v); var s = v.toFixed(d); return /^-0(\.0+)?$/.test(s) ? s.slice(1) : s; });
    var vals = D.discrete ? nums.slice() : strs.map(Number), orig = strs.slice(), n = vals.length;
    var order = vals.map(function (v, j) { return j; });
    if (sort !== 'none') order.sort(function (x1, y1) { return vals[x1] === vals[y1] ? x1 - y1 : (vals[x1] < vals[y1] ? -1 : 1) * (sort === 'asc' ? 1 : -1); });
    var sorted = vals.slice().sort(function (x1, y1) { return x1 - y1; }), mean = nsum(vals) / n, ss = 0, mn = sorted[0], mx = sorted[n - 1];
    vals.forEach(function (v) { ss += (v - mean) * (v - mean); });
    var med = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2, th, label;
    if (key === 'uniform') { th = { mean: (p.p1 + p.p2) / 2, sd: (p.p2 - p.p1) / Math.sqrt(12) }; label = 'Uniform distribution from ' + p.p1 + ' to ' + p.p2; }
    else if (key === 'normal') { th = { mean: p.p1, sd: p.p2 }; label = 'Normal distribution with mean ' + p.p1 + ' and standard deviation ' + p.p2; }
    else if (key === 'exponential') { th = { mean: 1 / p.p1, sd: 1 / p.p1 }; label = 'Exponential distribution with rate ' + p.p1; }
    else if (key === 'triangular') { th = { mean: (p.p1 + p.p2 + p.p3) / 3, sd: Math.sqrt((p.p1 * p.p1 + p.p2 * p.p2 + p.p3 * p.p3 - p.p1 * p.p2 - p.p1 * p.p3 - p.p2 * p.p3) / 18) }; label = 'Triangular distribution from ' + p.p1 + ' to ' + p.p3 + ' with mode ' + p.p2; }
    else if (key === 'poisson') { th = { mean: p.p1, sd: Math.sqrt(p.p1) }; label = 'Poisson distribution with mean ' + p.p1; }
    else { th = { mean: p.p1 * p.p2, sd: Math.sqrt(p.p1 * p.p2 * (1 - p.p2)) }; label = 'Binomial distribution with ' + p.p1 + ' trials and success probability ' + p.p2; }
    return {
      ok: true, mode: 'stat', dist: key, distName: D.name, label: label, params: p, discrete: D.discrete, places: d, count: n,
      values: order.map(function (j) { return strs[j]; }), original: orig, sort: sort, seed: seeded ? seed : '', seeded: seeded,
      source: seeded ? 'Seeded sfc32 (reproducible, not secure)' : 'Web Crypto (crypto.getRandomValues)', unique: false,
      stats: { n: n, mean: mean, median: med, sd: n > 1 ? Math.sqrt(ss / (n - 1)) : null, min: mn, max: mx, sum: nsum(vals) }, theory: th, hist: histogram(vals, bins, D.discrete)
    };
  }

  /* ---------- Mode 05: engineering test data ----------
     A dataset of up to 8 parameters (columns) with a shared number of observations (rows). Each parameter has a name, an optional unit, a minimum and a maximum,
     a distribution, a number of decimal places and an optional measurement tolerance. Every value stays inside [minimum, maximum] and is written on the grid of
     numbers with exactly `places` decimal places (a bound between grid points is moved inward, as in Mode 02; the check against the bounds is exact, in BigInt).
       Uniform:      x = min + (max - min) u
       Normal:       centre = typical value (default: middle of the range), sd = (max - min) / 6, so the limits sit at 3 sd for a centred value.
                     A draw outside [min, max] is thrown away and drawn again (a truncated normal); Box-Muller as in Mode 04.
       Triangular:   minimum, mode = typical value (default: middle), maximum; inverse CDF as in Mode 04.
       Log-uniform:  x = exp(ln(min) + (ln(max) - ln(min)) u), equal chance per decade; needs min > 0 (for resistances and insulation readings spanning decades).
     Seeded runs give each parameter its own stream: the seed text + "|p" + n for the values and + "|e" for the measurement error, so changing one parameter,
     or switching tolerance on, never changes another column.
     Optional tolerance (an absolute amount in the unit, or "x%" of the value): a second column "measured" = value + e, with e uniform over [-tol, +tol]
     (instrument error that stays inside the stated band), rounded to the same places. Measured values may therefore lie slightly outside [min, max].
     Everything is SYNTHETIC: every export carries that label. */
  var MAX_PARAMS = 8, MAX_NAME = 40, MAX_UNIT = 12, MAX_TITLE = 80, MAX_TRIES = 10000;
  var ENG = { uniform: 'Uniform', normal: 'Normal (cut at the limits)', triangular: 'Triangular', loguniform: 'Log-uniform' };
  var SYN_LABEL = 'SYNTHETIC', SYN_NOTE = 'SYNTHETIC / SIMULATED DATA generated from random-number models. Not field measurements, not equipment test results and not compliance evidence. The models are not validated physical models. Pseudorandom numbers, not for passwords, keys or any security purpose.';
  function fixZero(s) { return /^-0(\.0+)?$/.test(s) ? s.slice(1) : s; }
  function engineering(o) {
    o = o || {};
    var title = String(o.name == null ? '' : o.name).trim() || 'Synthetic engineering dataset';
    if (title.length > MAX_TITLE || /[\u0000-\u001f]/.test(title)) return { ok: false, error: 'The dataset name must be ' + MAX_TITLE + ' characters or fewer, on one line.', field: 'dsname' };
    var ct = parseCount(o.count); if (ct.error) return { ok: false, error: ct.error.replace('numbers', 'observations').replace('quantity', 'number of observations'), field: 'count' };
    var seed = o.seed == null ? '' : String(o.seed), seeded = seed !== '';
    if (seed.length > MAX_SEED) return { ok: false, error: 'The seed is limited to ' + MAX_SEED + ' characters.', field: 'seed' };
    var list = o.params;
    if (!Array.isArray(list) || list.length < 1) return { ok: false, error: 'Add at least one parameter.', field: 'count' };
    if (list.length > MAX_PARAMS) return { ok: false, error: 'A dataset can hold at most ' + MAX_PARAMS + ' parameters.', field: 'count' };
    var P = [], seen = {}, i, k, x, row;
    for (i = 0; i < list.length; i++) {
      row = list[i] || {};
      var nm = String(row.name == null ? '' : row.name).trim(), un = String(row.unit == null ? '' : row.unit).trim(), who = 'Parameter ' + (i + 1) + (nm ? ' (' + nm.slice(0, 20) + ')' : '') + ': ';
      var E = function (msg, f) { return { ok: false, error: who + msg, field: f, row: i }; }, t;
      if (!nm) return E('enter a name, for example Voltage.', 'name');
      if (nm.length > MAX_NAME) return E('the name is limited to ' + MAX_NAME + ' characters.', 'name');
      if (/[\u0000-\u001f]/.test(nm) || /[\u0000-\u001f]/.test(un)) return E('names and units must be on one line.', 'name');
      if (/^[=+\-@]/.test(nm)) return E('start the name with a letter or a digit (a leading = + - or @ can be read as a formula by spreadsheet programs).', 'name');
      if (un.length > MAX_UNIT) return E('the unit is limited to ' + MAX_UNIT + ' characters.', 'unit');
      if (/^[=+\-@]/.test(un)) return E('start the unit with a letter or symbol other than = + - or @.', 'unit');
      var pl = String(row.places == null ? '' : row.places).trim();
      if (!/^\d+$/.test(pl) || Number(pl) > 15) return E('decimal places must be a whole number from 0 to 15.', 'places');
      var d = Number(pl), dist = String(row.dist || ''); if (!ENG[dist]) return E('choose a distribution.', 'dist');
      var lo = parseDec(row.min, 'minimum'); if (lo.error) return E(lo.error.charAt(0).toLowerCase() + lo.error.slice(1), 'min');
      var hi = parseDec(row.max, 'maximum'); if (hi.error) return E(hi.error.charAt(0).toLowerCase() + hi.error.slice(1), 'max');
      var loS = String(row.min).trim().replace(/^\+/, ''), hiS = String(row.max).trim().replace(/^\+/, ''), lof = Number(loS), hif = Number(hiS);
      if (Math.abs(lof) > MAX_PAR) return E('the minimum must be between \u22121e15 and 1e15.', 'min');
      if (Math.abs(hif) > MAX_PAR) return E('the maximum must be between \u22121e15 and 1e15.', 'max');
      if (!(lof < hif)) return E('the minimum must be less than the maximum.', 'min');
      var sc = function (v, up) { if (v.f <= d) return v.n * TEN ** BigInt(d - v.f); var p = TEN ** BigInt(v.f - d); return up ? -floorDiv(-v.n, p) : floorDiv(v.n, p); };
      var a = sc(lo, true), b = sc(hi, false);
      if (a > b) return E('no number with ' + d + ' decimal place' + (d === 1 ? '' : 's') + ' lies between the minimum and the maximum. Use more decimal places or widen the range.', 'places');
      if (dist === 'loguniform' && !(lof > 0)) return E('a log-uniform distribution needs a minimum above 0.', 'min');
      var typ = null, typIgnored = false, ts = String(row.typ == null ? '' : row.typ).trim();
      if (dist === 'normal' || dist === 'triangular') {
        if (ts === '') typ = (lof + hif) / 2;
        else { t = num(ts, 'typical value', 'typ'); if (t.error) return E(t.error.charAt(0).toLowerCase() + t.error.slice(1), 'typ'); typ = t.v; if (typ < lof || typ > hif) return E('the typical value must lie between the minimum and the maximum.', 'typ'); }
      } else if (ts !== '') typIgnored = true;
      var tol = null, tolPct = false, tr = String(row.tol == null ? '' : row.tol).trim();
      if (tr !== '') {
        tolPct = /%$/.test(tr); t = num(tolPct ? tr.slice(0, -1) : tr, 'tolerance', 'tol'); if (t.error) return E(t.error.charAt(0).toLowerCase() + t.error.slice(1), 'tol');
        if (t.v < 0) return E('the tolerance must not be negative.', 'tol'); if (tolPct && t.v > 100) return E('a percentage tolerance must be from 0% to 100%.', 'tol');
        if (t.v > 0) tol = t.v;
      }
      var label = nm + (un ? ' (' + un + ')' : ''), mlabel = tol === null ? null : nm + ' measured' + (un ? ' (' + un + ')' : '');
      var cols = mlabel ? [label, mlabel] : [label];
      for (k = 0; k < cols.length; k++) { if (seen[cols[k]] || cols[k] === 'Observation' || cols[k] === 'Data label') return E('the column heading \u2018' + cols[k].slice(0, 30) + '\u2019 is already used. Give each parameter a different name.', 'name'); seen[cols[k]] = true; }
      P.push({ name: nm, unit: un, label: label, mlabel: mlabel, dist: dist, distName: ENG[dist], lof: lof, hif: hif, a: a, b: b, d: d, typ: typ, typIgnored: typIgnored, tol: tol, tolPct: tolPct, tolText: tr, minText: fmt(a, d), maxText: fmt(b, d), adjusted: lo.n * TEN ** BigInt(d) !== a * TEN ** BigInt(lo.f) || hi.n * TEN ** BigInt(d) !== b * TEN ** BigInt(hi.f) });
    }
    var shared = null; if (!o.source && !seeded) { try { shared = cryptoSource(); } catch (ex) { return { ok: false, error: ex.message }; } }
    var n = ct.v, outP = [], j, u, c, z1, tries, xv, s, pv, nn, base, e;
    for (i = 0; i < P.length; i++) {
      var q = P[i], vs = o.source || shared || seededSource(seed + '|p' + (i + 1)), es = o.source || shared || seededSource(seed + '|p' + (i + 1) + '|e');
      var vals = [], strs = [], ms = q.tol === null ? null : [];
      z1 = null; var sd = (q.hif - q.lof) / 6, cmin = null, cmax = null;
      for (j = 0; j < n; j++) {
        if (q.dist === 'uniform') xv = q.lof + (q.hif - q.lof) * unif(vs);
        else if (q.dist === 'loguniform') xv = Math.exp(Math.log(q.lof) + (Math.log(q.hif) - Math.log(q.lof)) * unif(vs));
        else if (q.dist === 'triangular') { u = unif(vs); var fc = (q.typ - q.lof) / (q.hif - q.lof); xv = u < fc ? q.lof + Math.sqrt(u * (q.hif - q.lof) * (q.typ - q.lof)) : q.hif - Math.sqrt((1 - u) * (q.hif - q.lof) * (q.hif - q.typ)); }
        else {
          tries = 0;
          for (;;) {
            if (z1 !== null) { x = z1; z1 = null; } else { u = unif(vs); c = unif(vs); var ra = Math.sqrt(-2 * Math.log(u)); x = ra * Math.cos(2 * Math.PI * c); z1 = ra * Math.sin(2 * Math.PI * c); }
            xv = q.typ + sd * x; if (xv >= q.lof && xv <= q.hif) break;
            if (++tries > MAX_TRIES) return { ok: false, error: 'Parameter ' + (i + 1) + ' (' + q.name.slice(0, 20) + '): too many draws fell outside the limits. Move the typical value towards the middle of the range.', field: 'typ', row: i };
          }
        }
        if (xv < q.lof) xv = q.lof; if (xv > q.hif) xv = q.hif;
        s = xv.toFixed(q.d); pv = parseDec(s, 'value'); nn = pv.n; if (nn < q.a) nn = q.a; if (nn > q.b) nn = q.b; s = fmt(nn, q.d);
        strs.push(s); vals.push(Number(s));
        if (ms) { base = Number(s); e = (q.tolPct ? Math.abs(base) * q.tol / 100 : q.tol) * (2 * unif(es) - 1); ms.push(fixZero((base + e).toFixed(q.d))); }
      }
      var sorted = vals.slice().sort(function (p1, p2) { return p1 - p2; }), mean = nsum(vals) / n, ss = 0;
      vals.forEach(function (v) { ss += (v - mean) * (v - mean); });
      var st = { n: n, mean: mean, median: n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2, sd: n > 1 ? Math.sqrt(ss / (n - 1)) : null, min: sorted[0], max: sorted[n - 1] }, mst = null;
      if (ms) {
        var errs = ms.map(function (v, m) { return Number(v) - vals[m]; }), mv = ms.map(Number), out = 0, mx = 0;
        mv.forEach(function (v) { if (v < q.lof || v > q.hif) out++; }); errs.forEach(function (v) { if (Math.abs(v) > mx) mx = Math.abs(v); });
        mst = { meanErr: nsum(errs) / n, maxAbsErr: mx, outside: out, mean: nsum(mv) / n, min: Math.min.apply(null, mv), max: Math.max.apply(null, mv) };
      }
      outP.push({ name: q.name, unit: q.unit, label: q.label, mlabel: q.mlabel, dist: q.dist, distName: q.distName, min: q.minText, max: q.maxText, places: q.d, typical: (q.dist === 'normal' || q.dist === 'triangular') ? q.typ : null, typIgnored: q.typIgnored,
        sdUsed: q.dist === 'normal' ? sd : null, adjusted: q.adjusted, tol: q.tol, tolPct: q.tolPct, tolText: q.tolText, values: strs, measured: ms, stats: st, mstats: mst, hist: histogram(vals, 0, false) });
    }
    return { ok: true, mode: 'eng', synthetic: true, title: title, count: n, params: outP, seed: seeded ? seed : '', seeded: seeded, source: seeded ? 'Seeded sfc32 (reproducible, not secure)' : 'Web Crypto (crypto.getRandomValues)' };
  }
  function engColumns(r) { var cols = []; r.params.forEach(function (q) { cols.push({ label: q.label, vals: q.values }); if (q.measured) cols.push({ label: q.mlabel, vals: q.measured }); }); return cols; }
  function csvq(s) { return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function engTable(r, sep, quote) {
    var cols = engColumns(r), q = quote ? csvq : function (s) { return s; }, lines = [['Observation'].concat(cols.map(function (c) { return q(c.label); }), ['Data label']).join(sep)], i;
    for (i = 0; i < r.count; i++) lines.push([String(i + 1)].concat(cols.map(function (c) { return c.vals[i]; }), [SYN_LABEL]).join(sep));
    return lines.join('\n') + '\n';
  }
  function engJson(r, when) {
    var cols = engColumns(r), recs = [], i;
    for (i = 0; i < r.count; i++) { var rec = { observation: i + 1 }; cols.forEach(function (c) { rec[c.label] = Number(c.vals[i]); }); rec.data_label = SYN_LABEL; recs.push(rec); }
    return JSON.stringify({
      generator: 'Elecmetric Random Number Generator, Engineering Test Data', data_label: SYN_LABEL, note: SYN_NOTE, dataset: r.title, source: r.source, seeded: r.seeded, seed: r.seeded ? r.seed : null,
      seed_streams: r.seeded ? 'Parameter n uses the seed text followed by |pn for its values and |pn|e for its measurement error.' : null, observations: r.count, generated: when || null,
      parameters: r.params.map(function (q) { return {
        name: q.name, unit: q.unit || null, minimum: q.min, maximum: q.max, distribution: q.distName, typical_value: q.typical, normal_standard_deviation: q.sdUsed, decimal_places: q.places,
        measurement_tolerance: q.tol === null ? null : q.tolText, tolerance_basis: q.tol === null ? null : (q.tolPct ? 'percent of the value' : 'absolute, in the unit'),
        tolerance_model: q.tol === null ? null : 'measured = value + e, e uniform over the tolerance band, rounded to the same decimal places', measured_column: q.mlabel }; }),
      statistics: r.params.map(function (q) { return { parameter: q.label, mean: q.stats.mean, median: q.stats.median, standard_deviation: q.stats.sd, minimum: q.stats.min, maximum: q.stats.max,
        measured: q.mstats ? { mean: q.mstats.mean, mean_error: q.mstats.meanErr, largest_absolute_error: q.mstats.maxAbsErr, readings_outside_limits: q.mstats.outside } : null }; }),
      records: recs
    }, null, 2) + '\n';
  }


  /* ---------- multiple independent sets ----------
     Runs any generator n times. Unseeded, every set draws fresh Web Crypto bits, so the sets are independent. Seeded, set 1 uses the seed exactly as typed (so one set
     matches a normal run) and set k (k from 2) uses the seed followed by "|set k", an independent stream that does not change when more sets are added. */
  var MAX_SETS = 50, MAX_TOTAL = 100000;
  function setSeed(seed, k) { return seed === '' || k === 1 ? seed : seed + '|set ' + k; }
  function multiple(o) {
    o = o || {};
    var txt = o.sets == null ? '1' : String(o.sets).trim(), n, fn = { int: integers, dec: decimals, uniq: uniques, stat: sample, eng: engineering }[o.kind];
    if (!/^\d+$/.test(txt) || (n = Number(txt)) < 1 || n > MAX_SETS) return { ok: false, error: 'The number of sets must be a whole number from 1 to ' + MAX_SETS + '.', field: 'sets' };
    if (!fn) return { ok: false, error: 'Unknown generator.' };
    var seed = o.seed == null ? '' : String(o.seed), sets = [], k, r, per;
    if (n > 1 && seed.length > MAX_SEED - 10) return { ok: false, error: 'With several sets the seed is limited to ' + (MAX_SEED - 10) + ' characters.', field: 'seed' };
    for (k = 1; k <= n; k++) {
      r = fn(Object.assign({}, o, { seed: setSeed(seed, k) }));
      if (!r.ok) return r;
      if (k === 1) {
        per = r.count * (r.mode === 'eng' ? r.params.length : 1);
        if (per * n > MAX_TOTAL) return { ok: false, error: 'That is ' + per * n + ' values in total (' + n + ' sets of ' + per + '). The limit is ' + MAX_TOTAL + ' across all sets, so lower the number of sets or the quantity.', field: 'sets' };
      }
      sets.push(r);
    }
    return { ok: true, mode: 'multi', kind: o.kind, inner: sets[0].mode || 'any', n: n, count: sets[0].count, total: per * n, sets: sets, seed: seed, seeded: seed !== '', source: sets[0].source, synthetic: !!sets[0].synthetic || sets[0].mode === 'stat' };
  }
  function engMulti(m, sep, quote) {
    var q = quote ? csvq : function (x) { return x; }, cols = engColumns(m.sets[0]), lines = [['Set', 'Observation'].concat(cols.map(function (c) { return q(c.label); }), ['Data label']).join(sep)];
    m.sets.forEach(function (r, k) { var cs = engColumns(r), i; for (i = 0; i < r.count; i++) lines.push([String(k + 1), String(i + 1)].concat(cs.map(function (c) { return c.vals[i]; }), [SYN_LABEL]).join(sep)); });
    return lines.join('\n') + '\n';
  }
  function multiText(m, sep) {
    if (m.inner === 'eng') return SYN_LABEL + ': ' + SYN_NOTE + '\n\n' + m.sets.map(function (r, k) { return 'Set ' + (k + 1) + '\n' + engTable(r, '\t', false); }).join('\n');
    if (sep === '\n') return m.sets.map(function (r, k) { return 'Set ' + (k + 1) + '\n' + r.values.join('\n'); }).join('\n\n');
    return m.sets.map(function (r, k) { return 'Set ' + (k + 1) + ': ' + r.values.join(sep == null ? ', ' : sep); }).join('\n');
  }
  function multiCsv(m) {
    if (m.inner === 'eng') return engMulti(m, ',', true);
    return 'set,n,value\n' + m.sets.map(function (r, k) { return r.values.map(function (v, i) { return (k + 1) + ',' + (i + 1) + ',' + v; }).join('\n'); }).join('\n') + '\n';
  }
  function multiJson(m, when) {
    var parsed = m.sets.map(function (r) { return JSON.parse(toJson(r, when)); }), first = parsed[0], drop = ['generator', 'source', 'seeded', 'seed', 'note', 'data_label', 'generated'], top = {
      generator: first.generator + ', Multiple Sets', sets_requested: m.n, seeded: m.seeded, seed: m.seeded ? m.seed : null,
      seed_rule: m.seeded ? 'Set 1 uses the seed as typed. Set k, for k from 2, uses the seed followed by "|set k".' : null, source: first.source, generated: when || null };
    if (first.data_label) top.data_label = first.data_label;
    top.note = first.note;
    top.sets = parsed.map(function (p, i) { var o = { set: i + 1, seed_used: m.sets[i].seeded ? m.sets[i].seed : null }; Object.keys(p).forEach(function (k) { if (drop.indexOf(k) < 0) o[k] = p[k]; }); return o; });
    return JSON.stringify(top, null, 2) + '\n';
  }

  /* ---------- export ---------- */
  function toText(r, sep) { if (r.mode === 'multi') return multiText(r, sep); if (r.mode === 'eng') return SYN_LABEL + ': ' + SYN_NOTE + '\n\n' + engTable(r, '\t', false); return r.values.join(sep == null ? '\n' : sep); }
  function toTsv(r) { if (r.mode === 'multi') return engMulti(r, '\t', false); return engTable(r, '\t', false); }
  function toCsv(r) { if (r.mode === 'multi') return multiCsv(r); if (r.mode === 'eng') return engTable(r, ',', true); return 'n,value\n' + r.values.map(function (v, i) { return (i + 1) + ',' + v; }).join('\n') + '\n'; }
  function toJson(r, when) {
    if (r.mode === 'multi') return multiJson(r, when);
    if (r.mode === 'eng') return engJson(r, when);
    if (r.mode === 'stat') return JSON.stringify({
      generator: 'Elecmetric Random Number Generator, Statistical Sampling', source: r.source, seeded: r.seeded, seed: r.seeded ? r.seed : null,
      distribution: r.distName, parameters: r.params, description: r.label, quantity: r.count, sort: r.sort, decimal_places: r.discrete ? null : r.places,
      statistics: { count: r.stats.n, mean: r.stats.mean, median: r.stats.median, standard_deviation: r.stats.sd, minimum: r.stats.min, maximum: r.stats.max, sum: r.stats.sum },
      theoretical: r.theory, generated: when || null,
      note: 'SYNTHETIC DATA from a simulated distribution. Not measured data and not a validated physical model. Pseudorandom numbers for general use, not for passwords, keys or any security purpose.', values: r.values.map(Number)
    }, null, 2) + '\n';
    return JSON.stringify({
      generator: 'Elecmetric Random Number Generator, ' + (r.mode === 'stat' ? 'Statistical Sampling' : r.mode === 'unique' ? 'Unique Numbers' : r.decimal ? 'Random Decimals' : 'Random Integers'), source: r.source, seeded: r.seeded, seed: r.seeded ? r.seed : null,
      minimum: r.min, maximum: r.max, quantity: r.count, unique: r.unique, sort: r.sort, decimal_places: r.decimal ? r.places : null, excluded: r.mode === 'unique' ? r.excludedList : undefined, pool_size: r.mode === 'unique' ? r.pool : undefined, generated: when || null,
      statistics: { count: r.stats.n, minimum: r.stats.min, maximum: r.stats.max, sum: r.stats.sum, mean: r.stats.mean, median: r.stats.median, standard_deviation: r.stats.sd },
      note: 'Pseudorandom numbers for general use. Not for passwords, keys or any security purpose. Values are strings so large numbers and decimals stay exact.', values: r.values
    }, null, 2) + '\n';
  }

  var api = { multiple: multiple, describe: describe, MAX_SETS: MAX_SETS, MAX_TOTAL: MAX_TOTAL, integers: integers, decimals: decimals, uniques: uniques, sample: sample, engineering: engineering, histogram: histogram, fmt: fmt, below: below, seededSource: seededSource, cryptoSource: cryptoSource, cyrb128: cyrb128, toText: toText, toTsv: toTsv, toCsv: toCsv, toJson: toJson, MAX_COUNT: MAX_COUNT, MAX_DIGITS: MAX_DIGITS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Rng = api;
})(typeof window !== 'undefined' ? window : this);
