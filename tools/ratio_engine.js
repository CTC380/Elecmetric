/* Elecmetric Ratio Calculator: exact engine for Mode 01 (Ratio Simplifier).
   A ratio is a list of two to twelve terms. Every term is read as an exact rational number (BigInt numerator and denominator): whole numbers, decimals,
   scientific notation, fractions a/b and mixed numbers such as 2 1/2. The terms are scaled to whole numbers with the lowest common multiple of their
   denominators, divided by their greatest common divisor, and the order of the terms is kept (2:3 and 3:2 are different ratios).
   Terms must be zero or positive. A term of 0 is allowed (0:5 simplifies to 0:1) but at least one term must be non-zero.
   Part-to-part (the ratio) and part-to-whole (share of the total) are always reported separately.
   Works in Node (module.exports) and in the browser (global Ratio, after Quad). */
(function (root) {
  'use strict';
  var Q = typeof require === 'function' && typeof module !== 'undefined' ? require('./quad_engine.js') : root.Quad;
  var R = Q.R, O = Q.ops, rs = Q.rs, mn = Q.mn, gcd = Q.gcd;
  var MAXTERMS = 12;

  function lcm(a, b) { return a / gcd(a, b) * b; }
  function ordinal(i) { return 'term ' + (i + 1); }
  function empty(hint) { return { ok: false, empty: true, error: hint, hint: hint }; }
  function fail(msg, idx) { return { ok: false, error: msg, termIndex: idx === undefined ? -1 : idx }; }

  /* rational -> decimal text. places: 'auto' (exact when it terminates within 40 places, else 6 places) or an integer 0..12 (rounded half away from zero). */
  function fixed(q, p) {
    var n = q.n, d = q.d, neg = n < 0n; if (neg) n = -n;
    var S = 10n ** BigInt(p);
    var sc = (n * S * 2n + d) / (d * 2n), ip = sc / S, fp = String(sc % S);
    fp = p ? '0'.repeat(Math.max(0, p - fp.length)) + fp : '';
    var zero = sc === 0n;
    return { text: (neg && !zero ? '-' : '') + String(ip) + (p ? '.' + fp : ''), exact: (n * S) % d === 0n };
  }
  function dec(q, places) {
    if (places === 'auto' || places === undefined) return Q.decOfRational(q, 6);
    return fixed(q, places);
  }
  function pct(q, places) { return dec(O.mul(q, O.ri(100)), places); }
  function lead(r) { return r.exact ? '' : '\u2248 '; }

  function parseTerms(text) {
    var s = String(text === undefined || text === null ? '' : text).replace(/\u2236|\uff1a/g, ':').trim();
    if (s === '') return empty('Enter the ratio with a colon between the terms, for example 12:18 or 2:3:4.');
    var parts = s.split(':');
    if (parts.length < 2) return empty('Add a colon and at least one more term, for example 12:18.');
    if (parts.length > MAXTERMS) return fail('A ratio can have at most ' + MAXTERMS + ' terms. You entered ' + parts.length + '.');
    var terms = [];
    for (var i = 0; i < parts.length; i++) {
      var t = parts[i].trim();
      if (t === '') return fail('The ' + ordinal(i) + ' is empty. Put a number on each side of every colon.', i);
      var p = Q.parseNum(t);
      if (p.error) return fail('The ' + ordinal(i) + ' \u201c' + t + '\u201d: ' + p.error.replace(/^Enter a value\.$/, 'Enter a number.'), i);
      if (O.sgn(p.v) < 0) return fail('Ratio terms cannot be negative: the ' + ordinal(i) + ' is ' + mn(t) + '. A ratio compares sizes of like quantities, so enter each size as a positive number (or 0).', i);
      terms.push({ text: t, q: p.v });
    }
    return { ok: true, terms: terms };
  }

  /* The trace of the Euclidean algorithm for two whole numbers, as text lines (kept short). */
  function euclid(a, b) {
    var lines = [], x = a, y = b, k = 0;
    if (x < y) { var t = x; x = y; y = t; }
    if (y === 0n) return [];
    while (y !== 0n && k < 12) { var qq = x / y, rr = x % y; lines.push(x + ' = ' + qq + ' \u00d7 ' + y + ' + ' + rr); x = y; y = rr; k++; }
    return y === 0n ? lines : [];
  }
  function list(arr, sep) { return arr.join(sep === undefined ? ' : ' : sep); }

  function simplify(input) {
    input = input || {};
    var places = input.places === undefined || input.places === '' || input.places === 'auto' ? 'auto' : Number(input.places);
    if (places !== 'auto' && (!isFinite(places) || places !== Math.floor(places) || places < 0 || places > 12)) return fail('Decimal places must be a whole number from 0 to 12, or Automatic.');
    var pt = parseTerms(input.ratio);
    if (!pt.ok) return pt;
    var T = pt.terms, n = T.length, i, j;
    var allZero = T.every(function (t) { return O.isZero(t.q); });
    if (allZero) return fail('At least one term must be greater than 0. A ratio of all zeros has no simplest form.');

    var allInt = T.every(function (t) { return t.q.d === 1n; });
    var L = 1n; T.forEach(function (t) { L = lcm(L, t.q.d); });
    var W = T.map(function (t) { return t.q.n * (L / t.q.d); });
    var g = 0n; W.forEach(function (w) { g = gcd(g, w); });
    var S = W.map(function (w) { return w / g; });
    var sum = 0n; S.forEach(function (s) { sum += s; });
    var k = R(g, L); /* every entered term = k x simplified term */
    var already = L === 1n && g === 1n;
    var ratioText = list(S.map(String)), enteredText = list(T.map(function (t) { return t.text; }));
    var equation = (already ? ratioText + ' (already in simplest form)' : enteredText + ' = ' + ratioText);
    var eqShort = already ? ratioText : enteredText + ' = ' + ratioText;

    /* ---------- working ---------- */
    var steps = [];
    steps.push('Read the ' + (n === 2 ? 'two' : n === 3 ? 'three' : String(n)) + ' terms in order: ' + enteredText + '.');
    if (!allInt) {
      steps.push('Write each term as an exact fraction: ' + T.map(function (t) { return t.text + ' = ' + rs(t.q); }).join('; ') + '.');
      steps.push('The lowest common multiple of the denominators is ' + L + '. Multiplying every term by ' + L + ' gives whole numbers: ' + list(W.map(String)) + '.');
    } else steps.push('All terms are whole numbers, so no scaling is needed.');
    var gl = [];
    if (n === 2) gl = euclid(W[0], W[1]);
    steps.push('The greatest common divisor is GCD(' + list(W.map(String), ', ') + ') = ' + g + '.' + (gl.length ? ' Euclidean algorithm: ' + gl.join('; ') + '.' : ''));
    if (g === 1n) steps.push('The GCD is 1, so the whole numbers ' + list(W.map(String)) + ' have no common factor to remove.');
    else steps.push('Divide every term by ' + g + ': ' + W.map(function (w, x) { return w + ' \u00f7 ' + g + ' = ' + S[x]; }).join('; ') + '.');
    steps.push('The simplest form is ' + ratioText + '. Check: GCD(' + list(S.map(String), ', ') + ') = 1.');
    var distinct = false; for (i = 1; i < n; i++) if (T[i].q.n * T[0].q.d !== T[0].q.n * T[i].q.d) distinct = true;
    if (distinct) steps.push('The order of the terms is kept: ' + ratioText + ' is not the same ratio as ' + list(S.slice().reverse().map(String)) + '.');

    /* ---------- representations ---------- */
    var shares = S.map(function (s) { return R(s, sum); });
    var rows = [];
    var two = n === 2;
    var fracAB = null, aOfB = null, bOfA = null;
    if (two) {
      if (S[1] !== 0n) { fracAB = R(S[0], S[1]); aOfB = fracAB; }
      if (S[0] !== 0n) bOfA = R(S[1], S[0]);
    }
    rows.push(['Ratio', ratioText, 'Simplest form, terms in the order entered']);
    if (!already) rows.push(['Scale factor', L === 1n ? '\u00f7 ' + g : g === 1n ? '\u00d7 ' + L : '\u00d7 ' + L + ', then \u00f7 ' + g, 'Every entered term is ' + rs(k) + ' times the simplified term']);
    if (two) {
      if (fracAB) { var dA = dec(fracAB, places), pA = pct(fracAB, places); rows.push(['Fraction A/B', rs(fracAB), 'First term over second term']); rows.push(['Decimal A/B', lead(dA) + dA.text, 'First term divided by second term']); rows.push(['A as a percentage of B', lead(pA) + pA.text + '%', 'Part to part: A compared with B, not with the total']); }
      else rows.push(['Fraction A/B', 'Undefined', 'The second term is 0, so A divided by B is undefined']);
      if (bOfA) { var dB = dec(bOfA, places), pB = pct(bOfA, places); rows.push(['Decimal B/A', lead(dB) + dB.text, 'Second term divided by first term']); rows.push(['B as a percentage of A', lead(pB) + pB.text + '%', 'Part to part: B compared with A']); }
    } else if (S[0] !== 0n) {
      var rel = S.map(function (s) { return R(s, S[0]); }), relTxt = rel.map(function (q) { var d = dec(q, places); return lead(d) + d.text; });
      rows.push(['First term as 1', list(relTxt), 'Each term divided by the first term']);
    }
    var shareRows = shares.map(function (q, x) {
      var d = dec(q, places), p = pct(q, places);
      return { term: 'Term ' + (x + 1), simplified: String(S[x]), fraction: rs(q), decimal: lead(d) + d.text, percent: lead(p) + p.text + '%', exactDec: d.exact, exactPct: p.exact };
    });
    var termRows = T.map(function (t, x) { return { term: 'Term ' + (x + 1), entered: t.text, asFraction: rs(t.q), whole: String(W[x]), simplified: String(S[x]) }; });

    /* ---------- exact checks ---------- */
    var verify = [], ok = true;
    function chk(label, v) { verify.push([label, !!v]); if (!v) ok = false; }
    var rebuilt = true; for (i = 0; i < n; i++) if (!O.eq(O.mul(k, O.ri(S[i])), T[i].q)) rebuilt = false;
    chk('Every entered term equals ' + rs(k) + ' times its simplified term', rebuilt);
    var cross = true; for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) if (T[i].q.n * T[j].q.d * S[j] !== T[j].q.n * T[i].q.d * S[i]) cross = false;
    chk('Cross-multiplying every pair of terms shows the entered and simplified ratios are equivalent', cross);
    var g2 = 0n; S.forEach(function (s) { g2 = gcd(g2, s); });
    chk('The simplified terms have no common factor (GCD = 1)', g2 === 1n);
    var zpos = true; for (i = 0; i < n; i++) if ((S[i] === 0n) !== O.isZero(T[i].q)) zpos = false;
    chk('Zero terms stay in the same positions and no term changed order', zpos);
    var tot = shares.reduce(function (a, q) { return O.add(a, q); }, O.ri(0));
    chk('The shares of the total add up to exactly 1 (100%)', O.eq(tot, O.ri(1)));

    var sumText = 'Total of the simplified terms: ' + list(S.map(String), ' + ') + ' = ' + sum;
    var notes = [];
    notes.push(two ? 'The ratio ' + ratioText + ' compares the two parts with each other (part to part). The percentage of B that A makes up is not the same as A\u2019s share of the total, which is in the table of shares below.' : 'The ratio compares the parts with each other (part to part). A term\u2019s share of the total is a different quantity and is given in its own table.');
    var warnings = [];
    if (T.some(function (t) { return O.isZero(t.q); })) warnings.push('A term of 0 stays 0 in the simplified ratio. Check that a zero term is what you meant.');
    if (!allInt) warnings.push('Decimals and fractions are read exactly, so 1.5 is held as 3/2 with no rounding.');

    var sentence = eqShort;
    var L2 = ['Ratio: ' + enteredText, 'Simplified: ' + ratioText, already ? 'Already in simplest form.' : 'Scale factor: each entered term = ' + rs(k) + ' x the simplified term'];
    L2.push('Greatest common divisor of the whole-number form: ' + g);
    L2.push('Shares of the total: ' + shareRows.map(function (r) { return r.fraction + ' (' + r.percent + ')'; }).join(', '));
    if (two && fracAB) { var da = dec(fracAB, places); L2.push('A/B = ' + rs(fracAB) + ' = ' + lead(da) + da.text); }
    var summary = L2.join('\n');

    return {
      ok: true, n: n, places: places, terms: termRows, shareRows: shareRows, ratioText: ratioText, enteredText: enteredText, equation: equation, sentence: sentence,
      simplified: S.map(String), whole: W.map(String), allInteger: allInt, lcm: String(L), gcd: String(g), already: already, scale: rs(k), total: String(sum), sumText: sumText,
      fraction: fracAB ? rs(fracAB) : null, rows: rows, steps: steps, verify: verify, verifyOk: ok, notes: notes, warnings: warnings, summary: summary
    };
  }

  /* eqText: the colon text for history and chips */
  function eqText(r) { return String(r || '').trim(); }

  var api = { simplify: simplify, parseTerms: parseTerms, eqText: eqText, MAXTERMS: MAXTERMS, dec: dec, fixed: fixed };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Ratio = api;
})(typeof self !== 'undefined' ? self : this);
