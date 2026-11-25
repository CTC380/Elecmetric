/* Elecmetric Exponent Calculator, Mode 04: Exponent Laws. Engine: one file, no DOM.
   Required by tests/exponent_laws_test.js and inlined (after the Mode 01, 02 and 03 engines) into calculators/exponent-laws-calculator/index.html
   by tools/exponent_laws_page.js.

   Numerical evaluation and the standard exponent rules (CEO brief, Mode 04), not symbolic algebra:
     product of powers      a^m x a^n = a^(m+n)         power of a product    (ab)^n = a^n b^n
     quotient of powers     a^m / a^n = a^(m-n)         power of a quotient   (a/b)^n = a^n / b^n
     power of a power       (a^m)^n = a^(mn)            zero exponent         a^0 = 1  (a not 0)
     negative exponent      a^(-n) = 1 / a^n            fractional exponent   a^(1/n) = n-th root of a
   For the numbers the user enters, BOTH sides of the rule are worked out separately and compared, with the exponent arithmetic done exactly
   (m + n, m - n and m n as exact fractions). Every power is taken from the Mode 02 engine (ExponentFrac), so the modes can never disagree; exact results stay
   exact (BigInt fractions), irrational ones are carried as a sign and a base-10 logarithm and labelled approximate.
   The rules have conditions, and the calculator says so instead of claiming equality:
     holds       both sides are real, defined and equal
     undefined   one side or both has no real value (0^0, 0 to a negative power, a negative base with an even-denominator exponent, division by zero)
     mismatch    both sides are real but different. This is the classic trap with a negative base and fractional exponents: ((-1)^2)^(1/2) = 1 but (-1)^1 = -1.
   Errors in the inputs are returned, never thrown, with the field that caused them. Nothing is rounded internally. */
(function (root) {
  'use strict';
  var X = (typeof module !== 'undefined' && module.exports) ? require('./exponent_engine.js') : root.ExponentCalc;
  var F = (typeof module !== 'undefined' && module.exports) ? require('./exponent_frac_engine.js') : root.ExponentFrac;
  var S = (typeof module !== 'undefined' && module.exports) ? require('./exponent_solver_engine.js') : root.ExponentSolver;
  var MINUS = '\u2212', TIMES = '\u00d7', DIV = '\u00f7';

  var RULES = [
    { key: 'product', name: 'Product of powers', formula: 'a^m \u00d7 a^n = a^(m+n)', fields: ['a', 'm', 'n'], cond: 'same base; a \u2260 0 if an exponent is zero or negative' },
    { key: 'quotient', name: 'Quotient of powers', formula: 'a^m \u00f7 a^n = a^(m\u2212n)', fields: ['a', 'm', 'n'], cond: 'same base; a \u2260 0' },
    { key: 'power', name: 'Power of a power', formula: '(a^m)^n = a^(mn)', fields: ['a', 'm', 'n'], cond: 'a \u2260 0 for a zero or negative exponent; with a negative base the rule can fail for fractional exponents' },
    { key: 'prodbase', name: 'Power of a product', formula: '(ab)^n = a^n \u00d7 b^n', fields: ['a', 'b', 'n'], cond: 'a and b not zero when n is zero or negative; a negative base needs a whole-number or odd-denominator n' },
    { key: 'quotbase', name: 'Power of a quotient', formula: '(a/b)^n = a^n \u00f7 b^n', fields: ['a', 'b', 'n'], cond: 'b \u2260 0' },
    { key: 'zero', name: 'Zero exponent', formula: 'a^0 = 1', fields: ['a'], cond: 'a \u2260 0 (0^0 is undefined)' },
    { key: 'negative', name: 'Negative exponent', formula: 'a^(\u2212n) = 1 \u00f7 a^n', fields: ['a', 'n'], cond: 'a \u2260 0' },
    { key: 'fraction', name: 'Fractional exponent', formula: 'a^(1/n) = n-th root of a', fields: ['a', 'n'], cond: 'n a positive whole number; a \u2265 0, or a < 0 with n odd' }
  ];
  var LABEL = { a: 'Base (a)', b: 'Second base (b)', m: 'Exponent (m)', n: 'Exponent (n)' };

  /* ---------- exact fractions ---------- */
  function babs(x) { return x < 0n ? -x : x; }
  function gcd(a, b) { a = babs(a); b = babs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function rat(n, d) { if (d < 0n) { n = -n; d = -d; } var g = gcd(n, d); if (g > 1n) { n /= g; d /= g; } return { n: n, d: d }; }
  function add(a, b) { return rat(a.n * b.d + b.n * a.d, a.d * b.d); }
  function sub(a, b) { return rat(a.n * b.d - b.n * a.d, a.d * b.d); }
  function mul(a, b) { return rat(a.n * b.n, a.d * b.d); }
  function rt(r) { return r.d === 1n ? r.n.toString() : r.n + '/' + r.d; }
  function dt(r) { return rt(r).replace(/^-/, MINUS); }
  function bigLog10(x) { var s = x.toString(); return s.length <= 300 ? Math.log10(Number(s)) : Math.log10(Number(s.slice(0, 17))) + (s.length - 17); }

  /* ---------- values: an exact fraction, or a sign and a base-10 logarithm ---------- */
  var ZERO = { rat: { n: 0n, d: 1n }, sign: 0, log10: -Infinity, radical: null };
  function fromRat(r) { return r.n === 0n ? ZERO : { rat: r, sign: r.n < 0n ? -1 : 1, log10: bigLog10(babs(r.n)) - bigLog10(r.d), radical: null }; }
  function toV(r) {
    if (r.exact) return fromRat(rat(BigInt(r.exactN) * (r.rawSign < 0 ? -1n : 1n), BigInt(r.exactD)));
    var v = r.mode1 && r.mode1.value, l10 = typeof v === 'number' && isFinite(v) && v !== 0 ? Math.log10(Math.abs(v)) : Math.log10(Math.abs(Number(r.sol.sciCoef))) + r.sol.sciExp;
    return { rat: null, sign: r.rawSign < 0 ? -1 : 1, log10: l10, radical: r.radical && !r.radical.exactRoot ? r.radical.text : null };
  }
  function err(msg, code) { return { error: msg, code: code }; }
  function pwRat(base, n) { /* base: exact fraction, n: exact fraction */
    var r = F.run({ a: rt(base), n: rt(n), sig: 'full' });
    return r.ok ? toV(r) : err(r.error, r.code);
  }
  function powV(v, n) {
    if (v.error) return v;
    if (v.rat) return pwRat(v.rat, n);
    var q = n.d, p = n.n, ev = q % 2n === 0n;
    if (v.sign < 0 && ev) return err('No real value: a negative number to a power with an even denominator (' + q + ') is not a real number.', 'NOT_REAL');
    return { rat: null, sign: v.sign < 0 && p % 2n !== 0n ? -1 : 1, log10: v.log10 * Number(p) / Number(q), radical: null };
  }
  function mulV(a, b) {
    if (a.error) return a; if (b.error) return b;
    if (a.sign === 0 || b.sign === 0) return ZERO;
    if (a.rat && b.rat) return fromRat(mul(a.rat, b.rat));
    return { rat: null, sign: a.sign * b.sign, log10: a.log10 + b.log10, radical: null };
  }
  function divV(a, b) {
    if (a.error) return a; if (b.error) return b;
    if (b.sign === 0) return err('Division by zero: the denominator is 0, so the expression is undefined.', 'DIV_ZERO');
    if (a.sign === 0) return ZERO;
    if (a.rat && b.rat) return fromRat(rat(a.rat.n * b.rat.d, a.rat.d * b.rat.n));
    return { rat: null, sign: a.sign * b.sign, log10: a.log10 - b.log10, radical: null };
  }
  function same(a, b) {
    if (a.sign !== b.sign) return false;
    if (a.sign === 0) return true;
    if (a.rat && b.rat) return a.rat.n === b.rat.n && a.rat.d === b.rat.d;
    return Math.abs(a.log10 - b.log10) <= 1e-12 * Math.max(1, Math.abs(a.log10));
  }

  /* ---------- display ---------- */
  function sciText(v, sig) {
    var e = Math.floor(v.log10 + 1e-12), m = Math.pow(10, v.log10 - e);
    if (m >= 10) { m /= 10; e += 1; }
    return S.fmt(m, sig) + ' \u00d7 10' + X.sup(e);
  }
  function decText(v, sig) {
    var f = Math.pow(10, v.log10);
    if (isFinite(f) && f >= 1e-6 && f < 1e15) return S.fmt(f, sig);
    return sciText(v, sig);
  }
  function terminating(d) { while (d % 2n === 0n) d /= 2n; while (d % 5n === 0n) d /= 5n; return d === 1n; }
  function fmtV(v, sig) {
    if (v.error) return 'undefined';
    var sg = v.sign < 0 ? MINUS : '';
    if (v.sign === 0) return '0';
    if (v.rat) {
      var n = babs(v.rat.n), d = v.rat.d;
      if (d === 1n) { var s = n.toString(); return sg + (s.length <= 40 ? X.groupInt(s) : s[0] + '.' + s.slice(1, 15).replace(/0+$/, '').replace(/\.$/, '') + ' \u00d7 10' + X.sup(s.length - 1)); }
      var frac = n.toString().length <= 30 && d.toString().length <= 30 ? sg + n + '/' + d : null;
      if (!frac) return (sg ? MINUS : '') + sciText(v, sig);
      var dec = decText(v, sig);
      return frac + (terminating(d) && dec.indexOf('\u00d7') < 0 ? ' = ' + (sg ? MINUS : '') + dec.replace(/^\u2212/, '') : ' \u2248 ' + (sg ? MINUS : '') + dec.replace(/^\u2212/, ''));
    }
    return (v.radical ? (sg + v.radical + '  \u2248 ') : '\u2248 ') + (sg ? MINUS : '') + decText(v, sig);
  }
  function B(r) { return r.d !== 1n || r.n < 0n ? '(' + dt(r) + ')' : dt(r); }
  function E(r) { return r.d === 1n && r.n >= 0n ? dt(r) : '(' + dt(r) + ')'; }
  function pe(base, e) { return B(base) + '^' + E(e); }
  function pw(base, e) { return pwRat(base, e); }

  /* ---------- the rules ---------- */
  function side(expr, v, sig) { return { expr: expr, v: v, text: fmtV(v, sig), ok: !v.error, error: v.error || null, code: v.code || null }; }
  var ONE = { n: 1n, d: 1n }, ZEROR = { n: 0n, d: 1n };
  function build(rule, o, sig) {
    var a = o.a, b = o.b, m = o.m, n = o.n, L, R, simp, steps = [], s;
    if (rule === 'product') {
      s = add(m, n); L = side(pe(a, m) + ' ' + TIMES + ' ' + pe(a, n), mulV(pw(a, m), pw(a, n)), sig); R = side(pe(a, s), pw(a, s), sig); simp = pe(a, s);
      steps.push({ title: 'Add the exponents', text: 'm + n = ' + dt(m) + ' + ' + dt(n) + ' = ' + dt(s) + '\na^m \u00d7 a^n = a^(m+n) = ' + pe(a, s) });
    } else if (rule === 'quotient') {
      s = sub(m, n); L = side(pe(a, m) + ' ' + DIV + ' ' + pe(a, n), divV(pw(a, m), pw(a, n)), sig); R = side(pe(a, s), pw(a, s), sig); simp = pe(a, s);
      steps.push({ title: 'Subtract the exponents', text: 'm \u2212 n = ' + dt(m) + ' \u2212 ' + B(n) + ' = ' + dt(s) + '\na^m \u00f7 a^n = a^(m\u2212n) = ' + pe(a, s) });
    } else if (rule === 'power') {
      s = mul(m, n); L = side('(' + pe(a, m) + ')^' + E(n), powV(pw(a, m), n), sig); R = side(pe(a, s), pw(a, s), sig); simp = pe(a, s);
      steps.push({ title: 'Multiply the exponents', text: 'm \u00d7 n = ' + dt(m) + ' \u00d7 ' + B(n) + ' = ' + dt(s) + '\n(a^m)^n = a^(mn) = ' + pe(a, s) });
    } else if (rule === 'prodbase') {
      var ab = mul(a, b);
      L = side(pe(ab, n), pw(ab, n), sig); R = side(pe(a, n) + ' ' + TIMES + ' ' + pe(b, n), mulV(pw(a, n), pw(b, n)), sig); simp = pe(a, n) + ' ' + TIMES + ' ' + pe(b, n);
      steps.push({ title: 'Share the exponent', text: 'a \u00d7 b = ' + dt(a) + ' \u00d7 ' + B(b) + ' = ' + dt(ab) + '\n(ab)^n = a^n \u00d7 b^n = ' + simp });
    } else if (rule === 'quotbase') {
      var q = rat(a.n * b.d, a.d * b.n);
      L = side(pe(q, n), pw(q, n), sig); R = side(pe(a, n) + ' ' + DIV + ' ' + pe(b, n), divV(pw(a, n), pw(b, n)), sig); simp = pe(a, n) + ' ' + DIV + ' ' + pe(b, n);
      steps.push({ title: 'Share the exponent', text: 'a \u00f7 b = ' + dt(a) + ' \u00f7 ' + B(b) + ' = ' + dt(q) + '\n(a/b)^n = a^n \u00f7 b^n = ' + simp });
    } else if (rule === 'zero') {
      L = side(pe(a, ZEROR), pw(a, ZEROR), sig); R = side('1', fromRat(ONE), sig); simp = '1';
      steps.push({ title: 'Any non-zero base to the power 0', text: 'a^0 = 1 for every a \u2260 0, so ' + pe(a, ZEROR) + ' = 1' });
    } else if (rule === 'negative') {
      var mn = rat(-n.n, n.d);
      L = side(pe(a, mn), pw(a, mn), sig); R = side('1 ' + DIV + ' ' + pe(a, n), divV(fromRat(ONE), pw(a, n)), sig); simp = '1 ' + DIV + ' ' + pe(a, n);
      steps.push({ title: 'Take the reciprocal', text: 'a^(\u2212n) = 1 \u00f7 a^n\n' + pe(a, mn) + ' = ' + simp });
    } else {
      var inv = rat(1n, n.n), nm = n.n === 1n ? 'first' : n.n === 2n ? 'square' : n.n === 3n ? 'cube' : n.n + '-th';
      L = side(pe(a, inv), pw(a, inv), sig);
      /* the right side is the n-th root; it is proved by raising the left side to the power n: it must give back a */
      var back = powV(L.v, rat(n.n, 1n)), aV = fromRat(a);
      R = side(nm + ' root of ' + B(a) + (back.error ? '' : '  (its ' + n.n + (n.n === 1n ? 'st' : n.n === 2n ? 'nd' : n.n === 3n ? 'rd' : 'th') + ' power is ' + fmtV(back, sig) + ')'), L.v.error ? L.v : (same(back, aV) ? L.v : err('The n-th root does not give back a.', 'ROOT')), sig); simp = nm + ' root of ' + B(a);
      steps.push({ title: 'A power of 1/n is a root', text: 'a^(1/n) = n-th root of a\n' + pe(a, inv) + ' = ' + simp });
    }
    return { left: L, right: R, simplified: simp, steps: steps };
  }

  function run(o) {
    o = o || {};
    var rule = RULES.filter(function (r) { return r.key === o.rule; })[0] || RULES[0], sig = X.SIG_CHOICES.indexOf(String(o.sig)) >= 0 ? String(o.sig) : '6', vals = {}, empties = [], i, k, p;
    for (i = 0; i < rule.fields.length; i++) {
      k = rule.fields[i]; p = X.parseOperand(o[k], false);
      if (p.empty) { empties.push(k); continue; }
      if (p.error) return { ok: false, error: p.error, field: k };
      vals[k] = rat(p.n, p.d);
    }
    if (empties.length === rule.fields.length) return { ok: false, empty: true, error: '' };
    if (empties.length) return { ok: false, partial: true, field: empties[0], error: 'Enter ' + LABEL[empties[0]].toLowerCase().replace(/ \(.\)$/, '') + ' (' + empties[0] + ').' };
    if (rule.key === 'quotbase' && vals.b.n === 0n) return { ok: false, error: 'The second base b must not be zero: a/b would divide by zero.', field: 'b' };
    if (rule.key === 'fraction' && (vals.n.d !== 1n || vals.n.n < 1n)) return { ok: false, error: 'The root index n must be a positive whole number, such as 2 for a square root or 3 for a cube root.', field: 'n' };
    var r = build(rule.key, vals, sig), st, msg;
    if (r.left.ok && r.right.ok) {
      if (same(r.left.v, r.right.v)) { st = 'holds'; msg = 'Both sides are equal: the rule holds for these values.'; }
      else { st = 'mismatch'; msg = 'The two sides are both real but different, so the rule does not hold for these values. This happens when a negative base is combined with fractional exponents: the rule needs the base to be positive, or the exponents to be whole numbers.'; }
    } else {
      st = 'undefined';
      msg = !r.left.ok && !r.right.ok ? 'Both sides are undefined or not real, so there is nothing to compare. ' + r.left.error
        : (!r.left.ok ? 'The left side has no real value (' + r.left.error + ') but the right side does, so the rule cannot be used here.' : 'The right side has no real value (' + r.right.error + ') but the left side does, so the rule cannot be used here.');
    }
    var out = { ok: true, mode: 4, rule: rule.key, ruleName: rule.name, formula: rule.formula, condition: rule.cond, sig: sig, inputs: {}, status: st, message: msg, left: r.left, right: r.right, simplified: r.simplified, steps: [], check: null, warnings: [] };
    rule.fields.forEach(function (f) { out.inputs[f] = dt(vals[f]); });
    out.steps.push({ title: 'The rule', text: rule.formula + '\nValid when: ' + rule.cond });
    out.steps.push({ title: 'The values', text: rule.fields.map(function (f) { return f + ' = ' + dt(vals[f]); }).join('\n') });
    out.steps = out.steps.concat(r.steps);
    out.steps.push({ title: 'Left side', text: r.left.expr + ' = ' + r.left.text });
    out.steps.push({ title: 'Right side', text: r.right.expr + ' = ' + r.right.text });
    out.steps.push({ title: st === 'holds' ? 'Result: the rule holds' : st === 'mismatch' ? 'Result: the rule does not hold' : 'Result: undefined', text: st === 'holds' ? r.left.text + ' = ' + r.right.text + '\nSimplified form: ' + r.simplified : msg });
    out.check = st === 'holds' ? { ok: true, detail: r.left.v.rat && r.right.v.rat ? 'both sides are the same exact fraction' : 'both sides agree to 12 digits (carried as a sign and a logarithm)' } : null;
    out.value = r.left.ok ? r.left.v : null;
    return out;
  }

  /* ---------- text, CSV, JSON ---------- */
  var STAT = { holds: 'rule holds', mismatch: 'rule does not hold', undefined: 'undefined' };
  function headline(r) {
    if (r.status !== 'holds') return r.left.expr + ' vs ' + r.right.expr + ': ' + STAT[r.status];
    var best = r.right.v.rat || !r.left.v.rat ? r.right : r.left, parts = [r.left.expr, r.simplified, best.text];
    return parts.filter(function (x, k) { return k === 0 || x !== parts[k - 1]; }).join(' = ');
  }
  function exportTxt(r) {
    var o = ['Elecmetric Exponent Calculator: Exponent Laws', '', 'Rule: ' + r.ruleName + '  (' + r.formula + ')', 'Values: ' + Object.keys(r.inputs).map(function (k) { return k + ' = ' + r.inputs[k]; }).join(', '), 'Status: ' + STAT[r.status], 'Left side: ' + r.left.expr + ' = ' + r.left.text, 'Right side: ' + r.right.expr + ' = ' + r.right.text, 'Simplified form: ' + r.simplified, '', 'Working', ''];
    r.steps.forEach(function (s) { o.push(s.title, s.text, ''); });
    if (r.check) o.push('Check: passed. ' + r.check.detail);
    return o.join('\n');
  }
  function csvq(s) { s = String(s); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function exportCsv(r) {
    return [['rule', 'formula', 'values', 'status', 'left_expression', 'left_value', 'right_expression', 'right_value', 'simplified'], [r.ruleName, r.formula, Object.keys(r.inputs).map(function (k) { return k + '=' + r.inputs[k]; }).join(' '), r.status, r.left.expr, r.left.text, r.right.expr, r.right.text, r.simplified]].map(function (x) { return x.map(csvq).join(','); }).join('\n');
  }
  function exportJson(r) {
    return JSON.stringify({ tool: 'Elecmetric Exponent Calculator, Mode 04: Exponent Laws', rule: r.ruleName, formula: r.formula, values: r.inputs, status: r.status, message: r.message, left: { expression: r.left.expr, value: r.left.text }, right: { expression: r.right.expr, value: r.right.text }, simplified: r.simplified, check: r.check, steps: r.steps }, null, 2);
  }

  var api = { run: run, headline: headline, exportTxt: exportTxt, exportCsv: exportCsv, exportJson: exportJson, RULES: RULES, LABEL: LABEL, STATUS: STAT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ExponentLaws = api;
})(typeof self !== 'undefined' ? self : this);
