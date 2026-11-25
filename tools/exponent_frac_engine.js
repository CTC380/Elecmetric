/* Elecmetric Exponent Calculator, Mode 02: Negative & Fractional Exponents. Engine: one file, no DOM.
   Required by tests/exponent_frac_test.js and inlined (after tools/exponent_engine.js) into
   calculators/negative-fractional-exponents-calculator/index.html by tools/exponent_frac_page.js.

   The VALUE of a^(p/q) comes from the Mode 01 engine (ExponentCalc.run), so the two modes can never disagree. This module adds what Mode 02 is for:
   - the exponent as an exact reduced fraction p/q (0.75 is 3/4), with its whole and fractional parts;
   - the negative exponent as a reciprocal (a fraction base is flipped);
   - the root and power forms:  a^(p/q) = (q-th root of a)^p = q-th root of (a^p);
   - the SIMPLIFIED RADICAL FORM, exact, with the denominator rationalised:  12^(1/2) = 2√3,  2^(-3/2) = √2/4,  2^(2/3) = ∛4,  (2/3)^(1/2) = √6/3.
     Method: factor the base into primes, multiply each prime's exponent by p/q, move the whole part out of the root and keep the fractional part inside it,
     then divide the root index and the radicand's exponents by their common factor. The result is unique: the radicand has no prime with exponent >= the index,
     and the index and the radicand's exponents have no common factor;
   - a negative base is judged by the reduced exponent (odd denominator: real; even denominator: no real value), as in Mode 01.
   The radical form needs the base's prime factors; bases above 1e12 (numerator or denominator) are not factored and the page says so instead of guessing.
   Errors are returned, never thrown. */
(function (root) {
  'use strict';
  var X = (typeof module !== 'undefined' && module.exports) ? require('./exponent_engine.js') : root.ExponentCalc;
  var FACTOR_LIMIT = 1e12, MAX_FORM_DIGITS = 60, MAX_INDEX = 1000, MAX_NUM = 1000;
  var sup = X.sup;
  function babs(x) { return x < 0n ? -x : x; }
  function gcd(a, b) { a = babs(a); b = babs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function floorDiv(a, b) { var q = a / b; if ((a % b !== 0n) && ((a < 0n) !== (b < 0n))) q -= 1n; return q; }
  function ms(s) { return String(s).replace(/-/g, '\u2212'); }
  function bs(b) { return ms(b.toString()); }

  /* ---------- factoring (trial division, bounded) ---------- */
  function factor(nBig) { /* returns { primes: [[p, k], ...] } or null when above the limit */
    if (nBig > BigInt(FACTOR_LIMIT)) return null;
    var n = Number(nBig), out = [], p = 2, k;
    if (n === 1) return [];
    for (p = 2; p * p <= n; p += (p === 2 ? 1 : 2)) { if (n % p === 0) { k = 0; while (n % p === 0) { n /= p; k++; } out.push([p, k]); } }
    if (n > 1) out.push([n, 1]);
    return out;
  }
  function powBig(base, k) { return BigInt(base) ** BigInt(k); }

  /* ---------- text helpers ---------- */
  function rad(idx, R) { /* the radical sign with its index; R is a BigInt radicand */
    var s = R.toString(), body = s.length > 1 ? '(' + s + ')' : s;
    var ch = idx === 2 ? '√' : idx === 3 ? '∛' : idx === 4 ? '∜' : sup(String(idx)) + '√';
    return ch + body;
  }
  function radTextPlain(idx, R) { return idx === 2 ? 'sqrt(' + R + ')' : 'root(' + idx + ', ' + R + ')'; }
  function fracText(n, d) { return d === 1n ? n.toString() : n.toString() + '/' + d.toString(); }

  /* ---------- the simplified radical form ---------- */
  /* base: { n, d } positive coprime BigInt; p, q: reduced exponent with q > 1 (p may be negative). */
  function radicalForm(base, p, q) {
    var fn = factor(base.n), fd = factor(base.d);
    if (fn === null || fd === null) return { ok: false, reason: 'The base has a factor that is too large to find here (the limit is 1,000,000,000,000), so the simplified radical form is not given. The value above is still exact or labelled approximate.' };
    if (q > BigInt(MAX_INDEX) || babs(p) > BigInt(MAX_NUM)) return { ok: false, reason: 'The exponent is too large for the radical form to be written out (the limit is a denominator of ' + MAX_INDEX + ' and a numerator of ' + MAX_NUM + ').' };
    var primes = {}, rows = [], i;
    fn.forEach(function (t) { primes[t[0]] = (primes[t[0]] || 0) + t[1]; });
    fd.forEach(function (t) { primes[t[0]] = (primes[t[0]] || 0) - t[1]; });
    var keys = Object.keys(primes).map(Number).sort(function (a, b) { return a - b; });
    var N = 1n, D = 1n, R = 1n, remGcd = q, anyRem = false, est = 0;
    keys.forEach(function (pr) {
      var k = BigInt(primes[pr]), t = k * p, w = floorDiv(t, q), r = t - w * q; /* exponent t/q = w + r/q, 0 <= r < q */
      rows.push({ prime: pr, k: primes[pr], t: t, w: w, r: r });
      est += Math.abs(Number(w)) * Math.log10(pr) + Number(r) * Math.log10(pr);
    });
    if (est > MAX_FORM_DIGITS) return { ok: false, reason: 'The simplified radical form would have more than ' + MAX_FORM_DIGITS + ' digits, so it is not written out. Use the decimal value.' };
    rows.forEach(function (x) {
      if (x.w > 0n) N *= powBig(x.prime, x.w); else if (x.w < 0n) D *= powBig(x.prime, -x.w);
      if (x.r > 0n) { R *= powBig(x.prime, x.r); remGcd = gcd(remGcd, x.r); anyRem = true; }
    });
    var idx = Number(q), rr = rows.map(function (x) { return { prime: x.prime, k: x.k, t: x.t, w: x.w, r: x.r }; });
    if (!anyRem) return { ok: true, exactRoot: true, N: N, D: D, R: 1n, idx: 1, rows: rr, q: q };
    var g = remGcd; /* divide the index and the radicand's exponents by g */
    var idx2 = Number(q / g), R2 = 1n;
    rows.forEach(function (x) { if (x.r > 0n) R2 *= powBig(x.prime, x.r / g); });
    var g2 = gcd(N, D); N /= g2; D /= g2;
    var text = (N === 1n ? '' : N.toString()) + rad(idx2, R2), plain = (N === 1n ? '' : N.toString() + '*') + radTextPlain(idx2, R2);
    if (D !== 1n) { text = text + ' / ' + D.toString(); plain = '(' + plain + ')/' + D.toString(); }
    return { ok: true, exactRoot: false, N: N, D: D, R: R2, idx: idx2, rows: rr, q: q, reduced: g > 1n, g: g, textNoSign: text, plain: plain, unreducedR: R };
  }

  /* ---------- exponent facts ---------- */
  function expFacts(p, q) {
    var ap = babs(p), w = ap / q, r = ap % q, neg = p < 0n;
    return { p: p, q: q, neg: neg, whole: w, rem: r, mixed: q !== 1n && w > 0n && r > 0n };
  }

  /* ---------- the working ---------- */
  function primeProduct(rows, which) { /* "2² × 3" for the base */
    return rows.map(function (x) { var k = which === 'abs' ? Math.abs(x.k) : x.k; return x.prime + (Math.abs(k) === 1 ? '' : sup(String(k))); }).join(' × ');
  }
  function fracPart(num, den) { var g = gcd(num, den); num /= g; den /= g; return den === 1n ? num.toString() : num.toString() + '/' + den.toString(); }
  function pwr(b, e) { return b + '^(' + e + ')'; }

  function buildSteps(r1, F, rf, sigIn, base, e) {
    var st = [], p = e.p, q = e.q, B = base.show, En = fracText(p, q).replace(/-/g, '\u2212'), AbsE = fracText(babs(p), q);
    var intro = 'a = ' + base.intro + '\nn = ' + En + (e.src && e.src.isDecimal ? '   (the decimal ' + e.src.text + ' as an exact fraction)' : e.src && e.src.isFraction && e.src.text.replace(/^-/, '') !== AbsE ? '   (reduced from ' + ms(e.src.text) + ')' : '');
    st.push({ title: 'The problem', text: intro });
    /* negative base */
    if (base.negative) st.push({ title: 'Is there a real value?', text: 'The base is negative. The exponent ' + En + ' has the odd denominator ' + q.toString() + ', so a real value exists: the odd root of a negative number is real.\nThe sign is ' + (r1.rawSign < 0 ? 'negative, because the numerator ' + bs(babs(p)) + ' is odd.' : 'positive, because the numerator ' + bs(babs(p)) + ' is even.') + '\nCalculate with the magnitude ' + base.absText + ' and apply the sign at the end.' });
    /* negative exponent */
    if (F.neg) {
      var flip = base.absRat && base.absRat.d !== 1n ? '\nThe base is a fraction, so flipping it gives the same result:  (' + fracText(base.absRat.n, base.absRat.d) + ')^(' + ms(En) + ') = (' + fracText(base.absRat.d, base.absRat.n) + ')^(' + AbsE + ')' : '';
      st.push({ title: 'Negative exponent: take the reciprocal', text: 'a^(−n) = 1 / a^n\n' + B + '^(' + En + ') = 1 / ' + (base.negative ? '(' + base.absText + ')' : B) + '^(' + AbsE + ')' + flip });
    }
    /* mixed split */
    if (q !== 1n) {
      var aq = q.toString(), ap = bs(babs(p));
      st.push({ title: 'Fractional exponent: a root and a power', text: 'a^(p/q) = (' + ordinal(Number(q)) + ' root of a)^p = ' + ordinal(Number(q)) + ' root of (a^p)\nHere p = ' + ap + ' and q = ' + aq + ': the denominator q is the root, the numerator p is the power.' + (F.mixed ? '\nThe exponent is greater than 1: ' + AbsE + ' = ' + F.whole + ' + ' + fracPart(F.rem, q) + ', so a^(' + AbsE + ') = a^' + F.whole + ' × a^(' + fracPart(F.rem, q) + ').' : '') });
      if (rf && rf.ok && base.kind === 'rat') {
        var rt = r1.rootForm;
        if (rt) st.push({ title: 'The root, then the power', text: rt });
        if (rf.exactRoot) st.push({ title: 'Exact root', text: 'Every prime in the base has an exponent that the root divides evenly, so the root is a ratio of whole numbers and the result is exact:\n' + primeProduct(rf.rows) + (rf.rows.length ? '' : '1') });
        else {
          var lines = rf.rows.map(function (x) {
            var e1 = fracPart(x.t, q);
            return x.prime + sup(String(x.k)).replace(/^¹$/, '') + '  →  exponent ' + ms(String(x.k)) + ' × ' + ms(En) + ' = ' + ms(e1) + (x.w !== 0n || x.r !== 0n ? '  =  ' + ms(x.w.toString()) + (x.r > 0n ? ' + ' + fracPart(x.r, q) : '') : '');
          });
          st.push({ title: 'Factor the base into primes', text: 'The magnitude ' + base.absText + ' = ' + primeProduct(rf.rows) + (rf.rows.some(function (x) { return x.k < 0; }) ? '   (negative exponents: those primes are in the denominator)' : '') });
          st.push({ title: 'Multiply each prime’s exponent by n', text: lines.join('\n') + '\nThe whole part comes out of the root. The fractional part stays inside it.' });
          var outside = [], inside = [];
          rf.rows.forEach(function (x) { if (x.w !== 0n) outside.push(x.prime + (x.w === 1n ? '' : '^(' + ms(x.w.toString()) + ')')); if (x.r > 0n) inside.push(x.prime + (x.r === 1n ? '' : sup(String(x.r)))); });
          st.push({ title: 'Outside and inside the root', text: 'Outside: ' + (outside.length ? outside.join(' × ') : '1') + ' = ' + fracText(rf.N, rf.D) + '\nInside the ' + ordinal(Number(q)) + ' root: ' + (inside.length ? inside.join(' × ') : '1') + ' = ' + rf.unreducedR.toString() + (rf.reduced ? '\nThe index ' + q + ' and every exponent inside share the factor ' + rf.g + ', so divide them by it: the root is now a ' + ordinal(rf.idx) + ' root of ' + rf.R.toString() + '.' : '') });
        }
      }
    }
    st.push({ title: 'Result', text: 'y = ' + r1.valueLine + (rf && rf.ok && !rf.exactRoot ? '\nSimplified radical form: ' + (r1.rawSign < 0 ? '−' : '') + rf.textNoSign + (F.neg ? '   (denominator rationalised)' : '') : '') + '\nScientific notation: ' + r1.sol.sciText });
    return st;
  }
  function ordinal(k) { return k === 2 ? 'square' : k === 3 ? 'cube' : k + (k % 100 >= 11 && k % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][k % 10 > 3 ? 0 : k % 10] || 'th'); }

  /* ---------- the public run() ---------- */
  function run(input) {
    input = input || {};
    var r = X.run(input);
    if (!r.ok) return r;
    var a = r.base, e = r.exponent, p = e.p, q = e.q, F = expFacts(p, q), neg = a.kind === 'rat' && a.n < 0n, absRat = a.kind === 'rat' ? { n: babs(a.n), d: a.d } : null;
    var out = { ok: true, mode: 2, base: a, exponent: { text: e.text, p: p, q: q, neg: F.neg, whole: F.whole, rem: F.rem, mixed: F.mixed, isInteger: q === 1n }, exprText: r.exprText, exact: r.exact, sol: r.sol, rawSign: r.rawSign, how: r.how, warnings: r.warnings.slice(), check: r.check, exactN: r.exactN, exactD: r.exactD, steps: null, forms: [], radical: null, mode1: r };
    var valueLine = X.valueText(r), sg = r.rawSign < 0 ? '\u2212' : '';
    var baseTxt = a.kind === 'e' ? (a.sign < 0 ? '(\u2212e)' : 'e') : null;
    var aShow = a.kind === 'e' ? baseTxt : (neg || a.d !== 1n ? '(' + ms(fracText(a.n, a.d)) + ')' : a.n.toString());
    var absText = a.kind === 'rat' ? fracText(absRat.n, absRat.d) : 'e';
    var Eshow = q === 1n ? ms(p.toString()) : '(' + ms(fracText(p, q)) + ')';
    var aPos = a.kind === 'rat' ? (absRat.d !== 1n ? '(' + absText + ')' : absText) : 'e';
    var rf = null;
    /* radical form (positive-base magnitude) */
    if (q !== 1n && a.kind === 'rat' && a.n !== 0n) {
      rf = radicalForm(absRat, p, q);
      if (rf.ok && !rf.exactRoot) { out.radical = { text: (r.rawSign < 0 ? '\u2212' : '') + rf.textNoSign, plain: (r.rawSign < 0 ? '-' : '') + rf.plain, index: rf.idx, radicand: rf.R.toString(), coefN: rf.N.toString(), coefD: rf.D.toString() }; }
      else if (rf.ok && rf.exactRoot) out.radical = { exactRoot: true, text: valueLine };
      else out.radicalNote = rf.reason;
    }
    /* the equivalent forms */
    var Fm = out.forms;
    if (q !== 1n && a.kind === 'rat' && a.n !== 0n) {
      var ap = babs(p).toString(), qi = Number(q);
      var rootVal = X.run({ a: a.n.toString() + '/' + a.d.toString(), n: '1/' + q.toString(), sig: input.sig || '6' });
      var rootShow = rootVal.ok ? X.valueText(rootVal) : '';
      var apIsOne = babs(p) === 1n;
      Fm.push({ label: 'Exponent form', text: aShow + '^' + Eshow });
      if (F.neg) Fm.push({ label: 'Reciprocal form', text: '1 / ' + (neg ? '(' + ms(fracText(a.n, a.d)) + ')' : aPos) + '^(' + ms(fracText(babs(p), q)) + ')' });
      Fm.push({ label: 'Root, then power', text: (F.neg ? '1 / ' : '') + (apIsOne ? '' : '(') + ordinal(qi) + ' root of ' + (neg ? '(' + ms(fracText(a.n, a.d)) + ')' : aPos) + (apIsOne ? '' : ')^' + ap), note: rootVal.ok ? 'the ' + ordinal(qi) + ' root is ' + rootShow : '' });
      Fm.push({ label: 'Power, then root', text: (F.neg ? '1 / ' : '') + ordinal(qi) + ' root of (' + (neg ? '(' + ms(fracText(a.n, a.d)) + ')' : aPos) + (apIsOne ? '' : '^' + ap) + ')' });
      if (out.radical && !out.radical.exactRoot) Fm.push({ label: 'Simplified radical form', text: out.radical.text, note: 'exact' + (F.neg ? ', denominator rationalised' : '') });
      Fm.push({ label: r.exact ? 'Exact value' : 'Value', text: valueLine, note: r.exact ? 'exact' : 'approximate' });
      out.rootText = rootShow; r.rootForm = rootVal.ok ? 'The ' + ordinal(qi) + ' root of ' + (neg ? ms(fracText(a.n, a.d)) : absText) + ' is ' + rootShow + (rootVal.exact ? '' : '   (not a ratio of whole numbers)') + '\nRaise it to the power ' + ap + (rootVal.exact ? ':  ' + valueLine : '') + (F.neg ? '\nThen take the reciprocal.' : '') : null;
    } else if (q === 1n && a.kind === 'rat' && a.n !== 0n) {
      Fm.push({ label: 'Exponent form', text: aShow + '^' + Eshow });
      if (F.neg) Fm.push({ label: 'Reciprocal form', text: '1 / ' + (neg ? '(' + ms(fracText(a.n, a.d)) + ')' : aPos) + '^' + babs(p).toString() });
      Fm.push({ label: r.exact ? 'Exact value' : 'Value', text: valueLine, note: r.exact ? 'exact' : 'approximate' });
    } else if (a.kind === 'e') {
      Fm.push({ label: 'Exponent form', text: aShow + '^' + Eshow });
      if (q !== 1n) Fm.push({ label: 'Root, then power', text: '(' + ordinal(Number(q)) + ' root of e)^' + bs(p), note: 'e is irrational: approximate' });
      Fm.push({ label: 'Value', text: valueLine, note: 'approximate' });
    }
    /* steps */
    var baseInfo = { kind: a.kind, show: aShow, absText: absText, negative: neg, absRat: absRat, intro: a.kind === 'e' ? (a.sign < 0 ? '−e ≈ −2.718281828459045' : 'e ≈ 2.718281828459045') : ms(fracText(a.n, a.d)) + (a.d !== 1n && /[.eE]/.test(a.text) && !/\//.test(a.text) ? '   (the decimal ' + ms(a.text) + ' as an exact fraction)' : '') };
    var eInfo = { p: p, q: q, src: { text: e.text, isDecimal: /[.eE]/.test(e.text) && !/\//.test(e.text), isFraction: /\//.test(e.text) } };
    r.valueLine = valueLine;
    if (q === 1n) {
      out.steps = r.steps.slice(); out.steps.splice(1, 0, { title: 'Whole-number exponent', text: 'The exponent ' + ms(p.toString()) + ' is a whole number, so no root is involved. Mode 01 (Power Calculator) shows the full working; the negative-exponent rule is applied below.' + (F.neg ? '\na^(−n) = 1 / a^n' : '') });
    } else out.steps = buildSteps(r, F, rf, input.sig, baseInfo, eInfo);
    /* independent check on the radical form: log10|y| = log10(N/D) + log10(R)/idx  against  n log10|a| */
    var chk = { ok: true, detail: r.check && r.check.detail ? r.check.detail : '' };
    if (out.radical && !out.radical.exactRoot) {
      var rr = rf, lg = function (b) { var s = b.toString(), head = s.slice(0, 17); return s.length <= 15 ? Math.log10(Number(b)) : (s.length - head.length) + Math.log10(Number(head)); };
      var have = lg(rr.N) - lg(rr.D) + lg(rr.R) / rr.idx, want = (Number(p) / Number(q)) * (lg(absRat.n) - lg(absRat.d));
      chk.ok = Math.abs(have - want) <= 1e-9 * Math.max(1, Math.abs(want));
      chk.detail = 'radical form: log10|y| = ' + have.toPrecision(12) + ' and n log10|a| = ' + want.toPrecision(12);
    }
    out.check = chk;
    return out;
  }

  /* ---------- exports ---------- */
  function exportTxt(r) {
    var s = r.sol, L = ['ELECMETRIC EXPONENT CALCULATOR (Mode 02: Negative & Fractional Exponents)', '', 'Expression: ' + r.exprText, 'Result: ' + X.valueText(r.mode1), 'Scientific notation: ' + s.sciText, 'Exact: ' + (r.exact ? 'yes' : 'no, double-precision approximation')];
    if (r.radical && !r.radical.exactRoot) L.push('Simplified radical form: ' + r.radical.text);
    L.push('', 'EQUIVALENT FORMS'); r.forms.forEach(function (f) { L.push(f.label + ': ' + f.text + (f.note ? '   (' + f.note + ')' : '')); });
    L.push('', 'WORKING'); r.steps.forEach(function (x) { L.push('', x.title, x.text); });
    if (r.warnings.length) { L.push('', 'NOTES'); r.warnings.forEach(function (w) { L.push(w.message); }); }
    L.push('', 'Generated by Elecmetric. Calculate. Convert. Understand.'); return L.join('\n');
  }
  function csvq(v) { v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function exportCsv(r) {
    var s = r.sol, rows = [['Quantity', 'Value'], ['Base a', r.base.text], ['Exponent n', r.exponent.text], ['Exponent as a fraction', r.exponent.q === 1n ? r.exponent.p.toString() : r.exponent.p.toString() + '/' + r.exponent.q.toString()], ['Result', (s.sign < 0 ? '\u2212' : '') + (s.isInteger && s.integerString ? s.integerString : (s.fraction || s.standard || s.sciText))], ['Simplified radical form', r.radical && !r.radical.exactRoot ? r.radical.text : ''], ['Decimal', s.standard || ''], ['Scientific notation', s.eText], ['Exact', r.exact ? 'yes' : 'no']];
    return rows.map(function (x) { return x.map(csvq).join(','); }).join('\n');
  }
  function exportJson(r) {
    var s = r.sol; return JSON.stringify({ calculator: 'Elecmetric Exponent Calculator, Mode 02 (Negative & Fractional Exponents)', base: r.base.text, exponent: r.exponent.text, exponentFraction: { numerator: r.exponent.p.toString(), denominator: r.exponent.q.toString() }, exact: r.exact, result: { sign: s.sign, fraction: s.fraction, decimal: s.standard, integer: s.isInteger ? s.integerString : null, scientific: s.eText }, radical: r.radical && !r.radical.exactRoot ? { text: r.radical.text, index: r.radical.index, radicand: r.radical.radicand, coefficient: r.radical.coefN + '/' + r.radical.coefD } : null, forms: r.forms }, null, 2);
  }
  function headline(r) { return r.exprText + (r.exact ? ' = ' : ' ') + X.valueText(r.mode1) + (r.radical && !r.radical.exactRoot ? '   (' + r.radical.text + ')' : ''); }

  var api = { run: run, radicalForm: radicalForm, factor: factor, exportTxt: exportTxt, exportCsv: exportCsv, exportJson: exportJson, headline: headline, valueText: function (r) { return X.valueText(r.mode1); }, groupInt: X.groupInt, sup: X.sup, FACTOR_LIMIT: FACTOR_LIMIT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ExponentFrac = api;
})(typeof self !== 'undefined' ? self : this);
