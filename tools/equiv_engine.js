/* Elecmetric Ratio Calculator: exact engine for Mode 03 (Equivalent Ratio Generator).
   Takes a ratio of two to twelve terms (read exactly by the Mode 01 parser: whole numbers, decimals, scientific notation, fractions, mixed numbers) and
   produces equivalent ratios by one common scale factor m > 0: every term is multiplied by m, so the order of the terms and every zero term are kept.
   Four operations:
     table     a list of multipliers (default 1, 2, 3, 4, 5, 10; any positive numbers, fractions and decimals allowed, or a whole-number range such as 1-10)
     multiply  one custom factor, result = m x ratio
     divide    one custom divisor, result = ratio / m
     target    scale so that a chosen term becomes a target value: m = target / that term (the chosen term must not be 0)
   Alongside every operation the engine lists the whole-number equivalents of the ratio (scaling down): W / d for every divisor d of the greatest common divisor
   of the whole-number form W, ending in the simplest form. Divisors are found by trial division only when that divisor total is within 10^12.
   Arithmetic is exact (BigInt numerator and denominator). Works in Node (module.exports) and in the browser (global Equiv, after Quad and Ratio). */
(function (root) {
  'use strict';
  var Q = typeof require === 'function' && typeof module !== 'undefined' ? require('./quad_engine.js') : root.Quad;
  var Rt = typeof require === 'function' && typeof module !== 'undefined' ? require('./ratio_engine.js') : root.Ratio;
  var R = Q.R, O = Q.ops, rs = Q.rs, gcd = Q.gcd;
  var MAXROWS = 60, MAXDOWN = 48, DIVLIMIT = 1000000000000n;
  var DEFAULT_MULTS = '1, 2, 3, 4, 5, 10';

  function fail(msg, field) { return { ok: false, error: msg, field: field || 'ratio' }; }
  function hint(msg, field) { return { ok: false, empty: true, error: msg, hint: msg, field: field || 'ratio' }; }
  function lcm(a, b) { return a / gcd(a, b) * b; }
  function list(a, sep) { return a.join(sep === undefined ? ' : ' : sep); }

  /* A term as text: whole number, an exact decimal when it ends within 12 places, otherwise the exact fraction. */
  function tt(q) {
    if (q.d === 1n) return String(q.n);
    var d = q.d, a = 0, b = 0;
    while (d % 2n === 0n) { d /= 2n; a++; }
    while (d % 5n === 0n) { d /= 5n; b++; }
    if (d === 1n && Math.max(a, b) <= 12) return Rt.fixed(q, Math.max(a, b)).text;
    return rs(q);
  }
  /* simplest whole-number form of a list of non-negative rationals */
  function simplest(qs) {
    var L = 1n, g = 0n;
    qs.forEach(function (q) { L = lcm(L, q.d); });
    var W = qs.map(function (q) { return q.n * (L / q.d); });
    W.forEach(function (w) { g = gcd(g, w); });
    return { W: W, L: L, g: g, S: W.map(function (w) { return w / g; }) };
  }
  function sameList(a, b) { if (a.length !== b.length) return false; for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; }
  function factorLabel(m) {
    if (m.d === 1n) return '\u00d7 ' + m.n;
    if (m.n === 1n) return '\u00f7 ' + m.d;
    return '\u00d7 ' + m.n + '/' + m.d;
  }

  /* multipliers text -> list of exact positive rationals */
  function parseMults(text) {
    var s = String(text === undefined || text === null ? '' : text).replace(/\u2013|\u2014/g, '-').trim();
    if (s === '') return hint('Enter one or more multipliers separated by commas, for example 1, 2, 3, 4, 5, 10, or a range such as 1-10.', 'mults');
    var parts = s.split(/[,;\n]+/), out = [], i;
    for (i = 0; i < parts.length; i++) {
      var t = parts[i].trim();
      if (t === '') continue;
      var rg = /^(\d+)\s*(?:-|\.\.|to)\s*(\d+)$/i.exec(t);
      if (rg) {
        var lo = BigInt(rg[1]), hi = BigInt(rg[2]);
        if (hi < lo) return fail('The range \u201c' + t + '\u201d runs backwards. Write the smaller whole number first, for example 1-10.', 'mults');
        if (lo === 0n) return fail('A multiplier of 0 would turn every term into 0, which is not a ratio. Start the range at 1 or higher.', 'mults');
        if (hi - lo + 1n > BigInt(MAXROWS)) return fail('A range can have at most ' + MAXROWS + ' multipliers.', 'mults');
        for (var k = lo; k <= hi; k++) out.push({ text: String(k), q: R(k, 1n) });
        continue;
      }
      var p = Q.parseNum(t);
      if (p.error) return fail('The multiplier \u201c' + t + '\u201d: ' + String(p.error).replace(/^Enter a value\.$/, 'Enter a number.'), 'mults');
      if (O.sgn(p.v) < 0) return fail('A multiplier cannot be negative: ' + Q.mn(t) + '. Scaling a ratio by a negative number would give negative terms.', 'mults');
      if (O.isZero(p.v)) return fail('A multiplier of 0 would turn every term into 0, which is not a ratio. Use a value above 0.', 'mults');
      out.push({ text: t, q: p.v });
    }
    if (!out.length) return hint('Enter one or more multipliers separated by commas, for example 1, 2, 3, 4, 5, 10.', 'mults');
    if (out.length > MAXROWS) return fail('At most ' + MAXROWS + ' multipliers can be listed. You entered ' + out.length + '.', 'mults');
    return { ok: true, list: out };
  }
  function parseFactor(text, what, field) {
    var s = String(text === undefined || text === null ? '' : text).trim();
    if (s === '') return hint('Enter the ' + what + ', for example 2 or 1/2 or 2.5.', field);
    var p = Q.parseNum(s);
    if (p.error) return fail('The ' + what + ' \u201c' + s + '\u201d: ' + String(p.error).replace(/^Enter a value\.$/, 'Enter a number.'), field);
    if (O.sgn(p.v) < 0) return fail('The ' + what + ' cannot be negative: ' + Q.mn(s) + '.', field);
    if (O.isZero(p.v)) return fail(field === 'divisor' ? 'The divisor cannot be 0: dividing by zero is undefined.' : 'The ' + what + ' cannot be 0: it would turn every term into 0, which is not a ratio.', field);
    return { ok: true, text: s, q: p.v };
  }
  /* all divisors of g (a BigInt up to 10^12), ascending; null when too large */
  function divisors(g) {
    if (g > DIVLIMIT) return null;
    var small = [], big = [], n = Number(g), i;
    for (i = 1; i * i <= n; i++) if (n % i === 0) { small.push(BigInt(i)); if (i * i !== n) big.push(BigInt(n / i)); }
    return small.concat(big.reverse());
  }

  function generate(input) {
    input = input || {};
    var op = input.op === undefined || input.op === '' ? 'table' : String(input.op);
    if (['table', 'multiply', 'divide', 'target'].indexOf(op) < 0) return fail('Choose table, multiply, divide or target as the operation.', 'op');
    var pt = Rt.parseTerms(input.ratio);
    if (!pt.ok) { pt.field = 'ratio'; return pt; }
    var T = pt.terms, n = T.length, i, j;
    if (T.every(function (t) { return O.isZero(t.q); })) return fail('At least one term must be greater than 0. A ratio of all zeros cannot be scaled.');
    var Tq = T.map(function (t) { return t.q; });
    var base = simplest(Tq), S = base.S, W = base.W, L = base.L, g = base.g;
    var allInt = Tq.every(function (q) { return q.d === 1n; });
    var enteredText = list(T.map(function (t) { return t.text; })), ratioText = list(S.map(String));

    /* ---------- the multipliers ---------- */
    var mults = [], ti = -1, tv = null, fx = null;
    if (op === 'table') {
      var pm = parseMults(input.mults === undefined ? DEFAULT_MULTS : input.mults);
      if (!pm.ok) return pm;
      mults = pm.list.map(function (m) { return { label: m.text, q: m.q, lab: '\u00d7 ' + m.text }; });
    } else if (op === 'multiply' || op === 'divide') {
      fx = parseFactor(input.factor, op === 'divide' ? 'divisor' : 'scale factor', op === 'divide' ? 'divisor' : 'factor');
      if (!fx.ok) return fx;
      var mq = op === 'divide' ? O.div(O.ri(1), fx.q) : fx.q;
      mults = [{ label: fx.text, q: mq, lab: (op === 'divide' ? '\u00f7 ' : '\u00d7 ') + fx.text }];
    } else {
      var idx = Number(input.term === undefined || input.term === '' ? 1 : input.term);
      if (!isFinite(idx) || idx !== Math.floor(idx) || idx < 1 || idx > n) return fail('Choose which term to set: a whole number from 1 to ' + n + '.', 'term');
      ti = idx - 1;
      var pv = parseFactor(input.target, 'target value', 'target');
      if (!pv.ok) return pv;
      if (O.isZero(Tq[ti])) return fail('Term ' + idx + ' is 0, so no scale factor can turn it into ' + pv.text + '. Choose a term that is not 0.', 'term');
      tv = pv;
      var mt = O.div(pv.q, Tq[ti]);
      mults = [{ label: rs(mt), q: mt, lab: factorLabel(mt) }];
    }

    /* ---------- the rows ---------- */
    var rows = mults.map(function (m) {
      var q = Tq.map(function (t) { return O.mul(m.q, t); });
      return { label: m.label, lab: m.lab, factor: m.q, factorText: rs(m.q), q: q, terms: q.map(tt), ratio: list(q.map(tt)), whole: q.every(function (x) { return x.d === 1n; }) };
    });

    /* ---------- scaling down: whole-number equivalents ---------- */
    var down = null, downNote = '';
    var dv = divisors(g);
    if (dv === null) downNote = 'The greatest common divisor of the whole-number form is too large to list its divisors here, so only the simplest form (' + ratioText + ') is given.';
    else {
      down = dv.map(function (d) {
        var terms = W.map(function (w) { return w / d; }), m = R(L, d); /* entered term x (L/d) = W/d */
        return { d: d, lab: factorLabel(m), factor: m, terms: terms.map(String), ratio: list(terms.map(String)), simplest: d === g };
      }); /* d = 1 (the whole-number form) first, the simplest form last */
      if (down.length > MAXDOWN) { downNote = 'This ratio has ' + down.length + ' whole-number equivalents; the first ' + (MAXDOWN - 1) + ' and the simplest are listed.'; down = down.slice(0, MAXDOWN - 1).concat([down[down.length - 1]]); }
    }

    /* ---------- working ---------- */
    var steps = [];
    steps.push('Read the ' + (n === 2 ? 'two' : n === 3 ? 'three' : String(n)) + ' terms in order: ' + enteredText + '. Their simplest form is ' + ratioText + '.');
    if (!allInt) steps.push('Each term is held as an exact fraction: ' + T.map(function (t) { return t.text + ' = ' + rs(t.q); }).join('; ') + '. Nothing is rounded.');
    steps.push('A ratio keeps its value when every term is multiplied (or divided) by the same non-zero number. The terms never change order.');
    var r0 = rows[0];
    if (op === 'table') {
      steps.push('Multiply every term by each multiplier you listed (' + rows.length + (rows.length === 1 ? ' multiplier' : ' multipliers') + ').');
      steps.push('For the multiplier ' + r0.label + ': ' + T.map(function (t, x) { return r0.label + ' \u00d7 ' + t.text + ' = ' + r0.terms[x]; }).join('; ') + ', so ' + enteredText + ' = ' + r0.ratio + '.');
      if (rows.length > 1) { var rl = rows[rows.length - 1]; steps.push('For the multiplier ' + rl.label + ': ' + T.map(function (t, x) { return rl.label + ' \u00d7 ' + t.text + ' = ' + rl.terms[x]; }).join('; ') + ', so ' + enteredText + ' = ' + rl.ratio + '.'); }
    } else if (op === 'multiply') {
      steps.push('Multiply every term by ' + fx.text + ': ' + T.map(function (t, x) { return fx.text + ' \u00d7 ' + t.text + ' = ' + r0.terms[x]; }).join('; ') + '.');
      steps.push('The equivalent ratio is ' + r0.ratio + '.');
    } else if (op === 'divide') {
      steps.push('Divide every term by ' + fx.text + ' (the same as multiplying by ' + rs(r0.factor) + '): ' + T.map(function (t, x) { return t.text + ' \u00f7 ' + fx.text + ' = ' + r0.terms[x]; }).join('; ') + '.');
      steps.push('The equivalent ratio is ' + r0.ratio + (r0.whole ? '.' : '. Not every term is a whole number; a ratio does not have to be written in whole numbers, but you can use the whole-number list below.'));
    } else {
      steps.push('To make term ' + (ti + 1) + ' equal ' + tv.text + ', the scale factor is target \u00f7 term = ' + tv.text + ' \u00f7 ' + T[ti].text + ' = ' + rs(r0.factor) + '.');
      steps.push('Multiply every term by ' + rs(r0.factor) + ': ' + T.map(function (t, x) { return rs(r0.factor) + ' \u00d7 ' + t.text + ' = ' + r0.terms[x]; }).join('; ') + '.');
      steps.push('The equivalent ratio is ' + r0.ratio + ', with term ' + (ti + 1) + ' equal to ' + tt(r0.q[ti]) + '.');
    }
    if (down) steps.push('Scaling down: the whole-number form is ' + list(W.map(String)) + ' with GCD ' + g + '. Dividing by each divisor of ' + g + ' gives every equivalent ratio in whole numbers, ending at the simplest form ' + ratioText + '.');

    /* ---------- exact checks ---------- */
    var verify = [], ok = true;
    function chk(label, v) { verify.push([label, !!v]); if (!v) ok = false; }
    var rebuilt = rows.every(function (r) { return r.q.every(function (q, x) { return O.eq(q, O.mul(r.factor, Tq[x])); }); });
    chk('Every term of every result equals its scale factor times the entered term', rebuilt);
    var cross = rows.every(function (r) { for (var a = 0; a < n; a++) for (var b = a + 1; b < n; b++) if (r.q[a].n * Tq[b].n * r.q[b].d * Tq[a].d !== r.q[b].n * Tq[a].n * r.q[a].d * Tq[b].d) return false; return true; });
    chk('Cross-multiplying every pair of terms shows each result is equivalent to the entered ratio', cross);
    var same = rows.every(function (r) { return sameList(simplest(r.q).S, S); });
    chk('Every result reduces to the same simplest form, ' + ratioText, same);
    var zeros = rows.every(function (r) { return r.q.every(function (q, x) { return O.isZero(q) === O.isZero(Tq[x]); }); });
    chk('Zero terms stay in the same positions and no term changed order', zeros);
    if (op === 'target') chk('Term ' + (ti + 1) + ' of the result equals the target ' + tv.text + ' exactly', O.eq(r0.q[ti], tv.q));
    if (op === 'divide') chk('Multiplying the result back by ' + fx.text + ' gives the entered ratio', r0.q.every(function (q, x) { return O.eq(O.mul(fx.q, q), Tq[x]); }));
    if (down) {
      chk('Every scaled-down result is in whole numbers and multiplies back to the whole-number form', down.every(function (r) { return r.terms.every(function (t, x) { return BigInt(t) * r.d === W[x]; }); }));
      chk('The last scaled-down result is the simplest form (GCD 1)', sameList(down[down.length - 1].terms.map(BigInt), S));
    }

    var notes = [];
    notes.push('Equivalent ratios all have the same value, so ' + enteredText + ' and ' + r0.ratio + ' describe the same proportion. Scaling a ratio does not change what it means, only the size of the numbers.');
    var warnings = [];
    if (T.some(function (t) { return O.isZero(t.q); })) warnings.push('A term of 0 stays 0 in every equivalent ratio.');
    if (!allInt) warnings.push('Decimals and fractions are read exactly, so 1.5 is held as 3/2 with no rounding.');
    var frac = rows.filter(function (r) { return !r.whole; }).length;
    if (frac && rows.length > 1) warnings.push(frac + ' of the ' + rows.length + ' results have a term that is not a whole number; those rows are marked.');
    else if (frac && op === 'multiply') warnings.push('The result has a term that is not a whole number.');

    var L2 = ['Ratio: ' + enteredText, 'Simplest form: ' + ratioText];
    if (op === 'table') { L2.push('Equivalent ratios:'); rows.forEach(function (r) { L2.push('  ' + r.lab + ' : ' + r.ratio); }); }
    else if (op === 'target') L2.push('Scale factor ' + rs(r0.factor) + ' makes term ' + (ti + 1) + ' = ' + tv.text + ': ' + r0.ratio);
    else L2.push((op === 'divide' ? 'Divided by ' : 'Multiplied by ') + fx.text + ': ' + r0.ratio);
    if (down) L2.push('Whole-number equivalents: ' + down.map(function (r) { return r.ratio; }).join('; '));
    var summary = L2.join('\n');

    var headline = op === 'table' ? rows.length + (rows.length === 1 ? ' equivalent ratio' : ' equivalent ratios') : r0.ratio;
    var sentence = op === 'table' ? enteredText + ' : ' + rows.length + ' multiples' : enteredText + ' ' + (op === 'divide' ? '\u00f7 ' + fx.text : op === 'multiply' ? '\u00d7 ' + fx.text : '\u2192 ' + tv.text + ' (term ' + (ti + 1) + ')') + ' = ' + r0.ratio;

    return {
      ok: true, op: op, n: n, enteredText: enteredText, ratioText: ratioText, simplified: S.map(String), whole: W.map(String), gcd: String(g), lcm: String(L), allInteger: allInt,
      terms: T.map(function (t, x) { return { term: 'Term ' + (x + 1), entered: t.text, asFraction: rs(t.q) }; }),
      rows: rows.map(function (r) { return { label: r.label, lab: r.lab, factor: r.factorText, ratio: r.ratio, terms: r.terms, whole: r.whole }; }),
      first: { ratio: r0.ratio, terms: r0.terms, factor: r0.factorText, lab: r0.lab }, targetTerm: ti >= 0 ? ti + 1 : null,
      down: down ? down.map(function (r) { return { lab: r.lab, factor: rs(r.factor), ratio: r.ratio, terms: r.terms, simplest: r.simplest }; }) : null, downNote: downNote, downCount: dv ? dv.length : null,
      headline: headline, sentence: sentence, steps: steps, verify: verify, verifyOk: ok, notes: notes, warnings: warnings, summary: summary
    };
  }

  var api = { generate: generate, parseMults: parseMults, tt: tt, factorLabel: factorLabel, DEFAULT_MULTS: DEFAULT_MULTS, MAXROWS: MAXROWS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Equiv = api;
})(typeof self !== 'undefined' ? self : this);
