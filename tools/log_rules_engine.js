/* Elecmetric Log Calculator: engine for Mode 04 (Logarithm Rules Calculator).
   Three jobs, all on numerical expressions (no symbols; the CEO note puts full symbolic algebra in a later extension):
     expr    simplify, condense and evaluate a sum of logarithms, e.g.  2*log2(3) - log2(9) + log2(12)   ->  log2(12) = 3.5849625007
     expand  split log_b(36*5/7^2) with the product, quotient and power rules, as typed and down to primes
     verify  check one rule for chosen numbers: product, quotient, power, change of base, reciprocal base, log_b(b) = 1, log_b(1) = 0, b^(log_b x) = x, log_b(b^n) = n
   Every positive number is held as a vector of rational exponents over the primes (and the constant e): 36/49 = 2^2 * 3^2 * 7^(-2).
   ln of a vector is a sum of exponent * ln(prime) in 90-digit fixed point (tools/log_engine.js), so a value never passes through floating point.
   log_b(x) is the ratio of two such sums. The numbers ln 2, ln 3, ln 5, ... and 1 (= ln e) are linearly independent over the rationals (unique factorisation,
   Baker's theorem), so a ratio of two vectors is a rational number exactly when the vectors are proportional. That decides exactness; irrational results are never called exact.
   Terms whose bases are powers of one another (log_2 and log_4, or log_2 and log_(1/2)) are brought to one base by change of base and condensed together.
   Terms in unrelated bases (log_2 and log_3) are evaluated separately. Their sum is not claimed to be exact unless every group is rational.
   Works in Node (module.exports) and in the browser (global LogRules, after Quad and Lg). Errors are returned, never thrown. */
(function (root) {
  'use strict';
  var isNode = typeof require === 'function' && typeof module !== 'undefined';
  var Q = isNode ? require('./quad_engine.js') : root.Quad, L = isNode ? require('./log_engine.js') : root.Lg;
  var R = Q.R, O = Q.ops, rs = Q.rs, S = L.S;
  var MAXLEN = 400, MAXTERMS = 40, MAXEXP = 1000000n, ZERO = O.ri(0), ONE = O.ri(1);
  var MSG_B0 = 'The base must be greater than zero.', MSG_B1 = 'Error: a logarithm to base 1 does not exist, because 1 raised to any power is 1.';
  var MSG_X0 = 'Undefined: the logarithm of zero does not exist for any base.', MSG_XN = 'No real result: the logarithm of a negative number is not a real number.';
  function E_(msg, field) { var e = new Error(msg); e.field = field; e.user = true; return e; }

  /* ---------- exponent vectors over the primes and e ---------- */
  function vClean(v) { var o = {}; Object.keys(v).forEach(function (k) { if (!O.isZero(v[k])) o[k] = v[k]; }); return o; }
  function vAdd(a, b) { var o = {}; Object.keys(a).forEach(function (k) { o[k] = a[k]; }); Object.keys(b).forEach(function (k) { o[k] = o[k] ? O.add(o[k], b[k]) : b[k]; }); return vClean(o); }
  function vScale(a, r) { var o = {}; Object.keys(a).forEach(function (k) { o[k] = O.mul(a[k], r); }); return vClean(o); }
  function vEmpty(a) { return Object.keys(a).length === 0; }
  function vIsRat(v) { return Object.keys(v).every(function (k) { return k !== 'e' && v[k].d === 1n; }); }
  function vKeys(v) { return Object.keys(v).sort(function (a, b) { if (a === 'e') return 1; if (b === 'e') return -1; var x = BigInt(a), y = BigInt(b); return x < y ? -1 : x > y ? 1 : 0; }); }
  /* a = mu * b for a rational mu, else null. b must not be empty. */
  function prop(a, b) {
    var kb = vKeys(b), ka = vKeys(a); if (!kb.length) return null;
    if (!a[kb[0]]) return ka.length ? null : ZERO;
    var mu = O.div(a[kb[0]], b[kb[0]]);
    if (ka.length !== kb.length) return null;
    for (var i = 0; i < kb.length; i++) { if (!a[kb[i]] || !O.eq(a[kb[i]], O.mul(mu, b[kb[i]]))) return null; }
    return mu;
  }
  /* rational vector -> rational number, null if it would be longer than about 6,000 digits */
  function vToRat(v) {
    if (!vIsRat(v)) return null;
    var bits = 0; vKeys(v).forEach(function (k) { bits += Math.abs(Number(v[k].n)) * BigInt(k).toString(2).length; }); if (bits > 20000) return null;
    var n = 1n, d = 1n; vKeys(v).forEach(function (k) { var e = v[k].n, P = BigInt(k); if (e > 0n) n *= P ** e; else d *= P ** (-e); });
    return R(n, d);
  }
  function vFromRat(q) { /* q > 0, null when a prime factor is too large to find */
    var fn = L.factor(q.n), fd = L.factor(q.d); if (fn.rest !== 1n || fd.rest !== 1n) return null;
    var o = {}; Object.keys(fn.m).forEach(function (k) { o[k] = R(BigInt(fn.m[k])); }); Object.keys(fd.m).forEach(function (k) { o[k] = o[k] ? O.sub(o[k], R(BigInt(fd.m[k]))) : R(-BigInt(fd.m[k])); });
    return vClean(o);
  }
  var lnCache = {};
  function lnKey(k) { if (k === 'e') return S; if (!lnCache[k]) lnCache[k] = L.lnRatS(BigInt(k), 1n); return lnCache[k]; }
  function lnVec(v) { var s = 0n; Object.keys(v).forEach(function (k) { s += v[k].n * lnKey(k) / v[k].d; }); return s; }
  /* the same logarithm by an independent route: when the value is a plain rational, the atanh series is run on the number itself */
  function lnVal(val) { var q = vToRat(val.vec); return q ? L.lnRatS(q.n, q.d) : lnVec(val.vec); }
  function ratS(q) { return q.n * S / q.d; }
  function numOf(val) { if (val.sgn <= 0) return NaN; var t = 0; Object.keys(val.vec).forEach(function (k) { t += Number(val.vec[k].n) / Number(val.vec[k].d) * (k === 'e' ? 1 : Math.log(Number(k))); }); return Math.exp(t); }

  /* ---------- numbers as text ---------- */
  var SUBS = '\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089';
  function subs(t) { return t.split('').map(function (c) { return SUBS[+c]; }).join(''); }
  function show(q) { var d = Q.decOfRational(q, 15); return d.exact && d.text.length <= 24 ? d.text : rs(q); }
  function vecText(v) {
    var ks = vKeys(v); if (!ks.length) return '1';
    return ks.map(function (k) { var e = v[k]; return e.n === 1n && e.d === 1n ? k : k + '^' + (e.d === 1n && e.n > 0n ? e.n : '(' + rs(e) + ')'); }).join('\u00b7');
  }
  function valText(val) {
    if (!val.sgn) return '0'; var q = vToRat(val.vec), s = q && rs(q).length <= 40 ? show(q) : vecText(val.vec);
    return (val.sgn < 0 ? '-' : '') + s;
  }
  function lg(bt, at) { return bt === 'e' ? 'ln(' + at + ')' : /^[0-9]+$/.test(bt) ? 'log' + subs(bt) + '(' + at + ')' : 'log_(' + bt + ')(' + at + ')'; }
  function coefText(c, body) {
    var a = c.n < 0n ? O.neg(c) : c; if (O.eq(a, ONE)) return body;
    return (a.d === 1n ? a.n + '\u00b7' : '(' + rs(a) + ')\u00b7') + body;
  }
  function joinTerms(items) { /* [{c, body}] */
    var out = ''; items.forEach(function (it, i) { var neg = it.c.n < 0n; out += (i === 0 ? (neg ? '-' : '') : (neg ? ' - ' : ' + ')) + coefText(it.c, it.body); });
    return out || '0';
  }
  function fixed(v, dp) { return v === 0n ? '0' : L.fmtS(v, dp); }

  /* ---------- values: a sign and a vector (absolute value) ---------- */
  function mkVal(sgn, vec) { return { sgn: sgn, vec: sgn === 0 ? {} : vec }; }
  function valFromRat(q) { var s = O.sgn(q); if (s === 0) return mkVal(0, {}); var a = s < 0 ? O.neg(q) : q, v = vFromRat(a); if (!v) throw E_('A prime factor of ' + rs(a) + ' is above one million, so the rules cannot be applied. Use the Log Calculator (Mode 01) for a single logarithm of such a number.'); return mkVal(s, v); }
  function valRat(val) { if (!val.sgn) return ZERO; var q = vToRat(val.vec); return q ? (val.sgn < 0 ? O.neg(q) : q) : null; }
  function valMul(a, b) { return mkVal(a.sgn * b.sgn, vAdd(a.vec, b.vec)); }
  function valDiv(a, b) { if (!b.sgn) throw E_('Division by zero.'); return mkVal(a.sgn * b.sgn, vAdd(a.vec, vScale(b.vec, O.ri(-1)))); }
  function valPow(a, r) {
    if (!a.sgn) { if (O.sgn(r) > 0) return mkVal(0, {}); throw E_('Zero cannot be raised to a power that is not positive.'); }
    if (a.sgn < 0) { if (r.d !== 1n) throw E_('No real result: a negative number cannot be raised to a fractional power.'); return mkVal(r.n % 2n === 0n ? 1 : -1, vScale(a.vec, r)); }
    return mkVal(1, vScale(a.vec, r));
  }
  function valAdd(a, b, minus) {
    var qa = valRat(a), qb = valRat(b);
    if (!qa || !qb) throw E_('Only whole numbers, decimals and fractions can be added or subtracted inside a logarithm. There is no rule for the logarithm of a sum, so work out a sum such as 2+3 first.');
    return valFromRat(minus ? O.sub(qa, qb) : O.add(qa, qb));
  }

  /* ---------- the parser (character level) ---------- */
  function normalise(s) {
    s = String(s === undefined || s === null ? '' : s);
    s = s.replace(/[\u2212\u2013\u2014]/g, '-').replace(/[\u00d7\u00b7\u22c5\u2217]/g, '*').replace(/[\u00f7\u2215\u2044]/g, '/');
    s = s.replace(/[\u2080-\u2089]/g, function (c) { return String(c.charCodeAt(0) - 0x2080); });
    var SUPM = { '\u2070': '0', '\u00b9': '1', '\u00b2': '2', '\u00b3': '3', '\u2074': '4', '\u2075': '5', '\u2076': '6', '\u2077': '7', '\u2078': '8', '\u2079': '9', '\u207b': '-' };
    s = s.replace(/[\u2070\u00b9\u00b2\u00b3\u2074-\u2079\u207b]+/g, function (m) { return '^(' + m.split('').map(function (c) { return SUPM[c]; }).join('') + ')'; });
    return s.replace(/(\d),(?=\d)/g, '$1');
  }
  function Parser(src) { this.s = src; this.i = 0; }
  Parser.prototype.ws = function () { while (this.i < this.s.length && /\s/.test(this.s[this.i])) this.i++; };
  Parser.prototype.peek = function () { this.ws(); return this.s[this.i]; };
  Parser.prototype.eat = function (c) { if (this.peek() === c) { this.i++; return true; } return false; };
  Parser.prototype.expect = function (c, why) { if (!this.eat(c)) throw E_(why || 'Expected ' + c + ' at position ' + (this.i + 1) + '.'); };
  Parser.prototype.number = function () {
    this.ws(); var m = /^(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?/.exec(this.s.slice(this.i)); if (!m) return null;
    this.i += m[0].length; var r = Q.parseNum(m[0]); if (r.error) throw E_(r.error); return { q: r.v, text: m[0] };
  };

  /* argument expressions: positive or negative numbers, e, + - * / ^ and brackets. Result: { val, tree, pos } */
  function leaf(val, text) { return { t: 'leaf', val: val, text: text, pos: val.sgn > 0 }; }
  Parser.prototype.aExpr = function () {
    var a = this.aTerm();
    for (;;) {
      var c = this.peek();
      if (c === '+' || c === '-') { this.i++; var b = this.aTerm(), v = valAdd(a.val, b.val, c === '-'); a = leaf(v, valText(v)); a.sum = true; } else break;
    }
    return a;
  };
  Parser.prototype.aTerm = function () {
    var a = this.aUnary();
    for (;;) {
      var c = this.peek();
      if (c === '*') { this.i++; var b = this.aUnary(); a = { t: 'mul', a: a, b: b, val: valMul(a.val, b.val), pos: a.pos && b.pos }; if (!a.pos) a = leaf(a.val, valText(a.val)); }
      else if (c === '/') { this.i++; var d = this.aUnary(); a = { t: 'div', a: a, b: d, val: valDiv(a.val, d.val), pos: a.pos && d.pos }; if (!a.pos) a = leaf(a.val, valText(a.val)); }
      else break;
    }
    return a;
  };
  Parser.prototype.aUnary = function () {
    var c = this.peek();
    if (c === '-') { this.i++; var u = this.aUnary(); return leaf(mkVal(-u.val.sgn, u.val.vec), '-' + valText(u.val)); }
    if (c === '+') { this.i++; return this.aUnary(); }
    return this.aPow();
  };
  Parser.prototype.aPow = function () {
    var a = this.aAtom();
    if (this.peek() === '^') {
      this.i++; var ex = this.aExponent(), r = valRat(ex.val);
      if (!r) throw E_('An exponent must be a whole number, a decimal or a fraction.');
      if (r.n > MAXEXP || -r.n > MAXEXP || r.d > MAXEXP) throw E_('The exponent is too large.');
      var v = valPow(a.val, r); a = { t: 'pow', a: a, r: r, val: v, pos: a.pos }; if (!a.pos) a = leaf(v, valText(v));
    }
    return a;
  };
  Parser.prototype.aExponent = function () { /* ^ binds to the next unary item: 2^-3, 2^(1/2), 2^0.5 */
    var c = this.peek(); if (c === '-') { this.i++; var u = this.aExponent(); return leaf(mkVal(-u.val.sgn, u.val.vec), ''); } if (c === '+') { this.i++; return this.aExponent(); }
    return this.aAtom();
  };
  Parser.prototype.aAtom = function () {
    var c = this.peek();
    if (c === undefined) throw E_('The expression ends too early. Enter a number after the operator.');
    if (c === '(') { this.i++; var a = this.aExpr(); this.expect(')', 'A closing bracket is missing.'); return a; }
    var n = this.number(); if (n) { var v = valFromRat(n.q); return leaf(v, n.text); }
    if (/^[eE]/.test(this.s.slice(this.i)) && !/^[eE][a-zA-Z]/.test(this.s.slice(this.i))) { this.i++; return leaf(mkVal(1, { e: ONE }), 'e'); }
    var w = /^[A-Za-z]+/.exec(this.s.slice(this.i));
    if (w) throw E_('\u201c' + w[0] + '\u201d is not understood inside a logarithm. Use numbers, e, + - * / ^ and brackets.');
    throw E_('Unexpected \u201c' + c + '\u201d at position ' + (this.i + 1) + '.');
  };

  /* log calls: log_2(8)  log2(8)  log10(100)  log(100)  ln(5)  log_e(5)  log_(1/2)(8)  log_{1/2}(8)  log_0.5(8) */
  function checkBase(val) { if (val.sgn <= 0) throw E_(MSG_B0, 'b'); if (vEmpty(val.vec)) throw E_(MSG_B1, 'b'); }
  function checkArg(val) { if (val.sgn === 0) throw E_(MSG_X0, 'x'); if (val.sgn < 0) throw E_(MSG_XN, 'x'); }
  Parser.prototype.logCall = function () {
    this.ws(); var rest = this.s.slice(this.i), m = /^(ln|log)/i.exec(rest); if (!m) return null;
    if (/^[A-Za-z]/.test(rest.slice(m[1].length)) && !/^log[eE]\(/.test(rest)) return null;
    var isLn = m[1].toLowerCase() === 'ln', base = null, bt = null; this.i += m[1].length;
    if (isLn) { base = mkVal(1, { e: ONE }); bt = 'e'; }
    else {
      var under = false; if (this.s[this.i] === '_') { under = true; this.i++; }
      var ch = this.s[this.i];
      if (ch === '{') { this.i++; var b1 = this.aExpr(); this.expect('}', 'A closing } is missing after the base.'); base = b1.val; bt = valText(b1.val); }
      else if (under && ch === '(') { this.i++; var b2 = this.aExpr(); this.expect(')', 'A closing bracket is missing after the base.'); base = b2.val; bt = valText(b2.val); }
      else if (/[0-9.]/.test(ch || '')) { var n = this.number(); base = valFromRat(n.q); bt = valText(base); }
      else if (/[eE]/.test(ch || '') && (under || /^[eE]\(/.test(this.s.slice(this.i)))) { this.i++; base = mkVal(1, { e: ONE }); bt = 'e'; }
      else if (!under && (ch === '(' || /\s/.test(ch || ''))) { base = mkVal(1, { 2: ONE, 5: ONE }); bt = '10'; }
      else throw E_('Write the base after log, for example log_2(8), log2(8), log_(1/2)(8) or ln(5).');
      checkBase(base);
    }
    this.ws(); if (this.s[this.i] !== '(') throw E_('Write the argument of the logarithm in brackets, for example log_2(8).');
    this.i++; var arg = this.aExpr(); this.expect(')', 'A closing bracket is missing after the argument of the logarithm.');
    checkArg(arg.val);
    return { base: base, bt: bt, arg: arg, argText: treeText(arg) };
  };
  function treeText(nd) {
    if (nd.t === 'leaf') return nd.text;
    if (nd.t === 'mul') return treeText(nd.a) + '*' + treeText(nd.b);
    if (nd.t === 'div') return treeText(nd.a) + '/' + treeText(nd.b);
    return treeText(nd.a) + '^' + (nd.r.d === 1n && nd.r.n >= 0n ? nd.r.n : '(' + rs(nd.r) + ')');
  }

  /* linear forms: a rational constant plus rational multiples of logarithms */
  function lfConst(q) { return { c: q, terms: [] }; }
  function lfAdd(a, b, minus) {
    var ts = a.terms.slice(); b.terms.forEach(function (t) { ts.push({ coef: minus ? O.neg(t.coef) : t.coef, base: t.base, bt: t.bt, arg: t.arg, argText: t.argText }); });
    if (ts.length > MAXTERMS) throw E_('At most ' + MAXTERMS + ' logarithms are allowed in one expression.');
    return { c: minus ? O.sub(a.c, b.c) : O.add(a.c, b.c), terms: ts };
  }
  function lfScale(a, k) { return { c: O.mul(a.c, k), terms: a.terms.map(function (t) { return { coef: O.mul(t.coef, k), base: t.base, bt: t.bt, arg: t.arg, argText: t.argText }; }) }; }
  function lfMul(a, b) {
    if (a.terms.length && b.terms.length) throw E_('A product of two logarithms has no rule. Each term may contain one logarithm, multiplied by a number.');
    return a.terms.length ? lfScale(a, b.c) : lfScale(b, a.c);
  }
  function lfDiv(a, b) {
    if (b.terms.length) throw E_('Dividing by a logarithm has no rule here. For log_b(x) \u00f7 log_b(y), use the change-of-base check on the \u201cCheck a rule\u201d tab.');
    if (O.isZero(b.c)) throw E_('Division by zero.');
    return lfScale(a, O.div(ONE, b.c));
  }
  Parser.prototype.lExpr = function () {
    var a = this.lTerm();
    for (;;) { var c = this.peek(); if (c === '+' || c === '-') { this.i++; a = lfAdd(a, this.lTerm(), c === '-'); } else break; }
    return a;
  };
  Parser.prototype.lTerm = function () {
    var a = this.lUnary();
    for (;;) { var c = this.peek(); if (c === '*') { this.i++; a = lfMul(a, this.lUnary()); } else if (c === '/') { this.i++; a = lfDiv(a, this.lUnary()); } else break; }
    return a;
  };
  Parser.prototype.lUnary = function () {
    var c = this.peek();
    if (c === '-') { this.i++; return lfScale(this.lUnary(), O.ri(-1)); } if (c === '+') { this.i++; return this.lUnary(); }
    return this.lPow();
  };
  Parser.prototype.lPow = function () {
    var a = this.lAtom();
    if (this.peek() === '^') {
      this.i++; if (a.terms.length) throw E_('A logarithm cannot be raised to a power here. Use the power rule inside the logarithm: log_b(x^n).');
      var ex = this.lExponent(); if (ex.terms.length || ex.c.d !== 1n || ex.c.n > 1000n || ex.c.n < -1000n) throw E_('Outside a logarithm, powers must have a whole-number exponent between \u22121000 and 1000.');
      var k = ex.c.n, r = ONE, base = a.c; if (O.isZero(base) && k <= 0n) throw E_('Zero cannot be raised to a power that is not positive.');
      var p = k < 0n ? -k : k, x = base; while (p > 0n) { if (p & 1n) r = O.mul(r, x); x = O.mul(x, x); p >>= 1n; }
      a = lfConst(k < 0n ? O.div(ONE, r) : r);
    }
    return a;
  };
  Parser.prototype.lExponent = function () {
    var c = this.peek(); if (c === '-') { this.i++; return lfScale(this.lExponent(), O.ri(-1)); } if (c === '+') { this.i++; return this.lExponent(); }
    return this.lAtom();
  };
  Parser.prototype.lAtom = function () {
    var c = this.peek();
    if (c === undefined) throw E_('The expression ends too early.');
    if (c === '(') { this.i++; var a = this.lExpr(); this.expect(')', 'A closing bracket is missing.'); return a; }
    var lc = this.logCall();
    if (lc) return { c: ZERO, terms: [{ coef: ONE, base: lc.base, bt: lc.bt, arg: lc.arg, argText: lc.argText }] };
    var n = this.number(); if (n) return lfConst(n.q);
    var w = /^[A-Za-z]+/.exec(this.s.slice(this.i));
    if (w && /^[eE]$/.test(w[0])) throw E_('The constant e can only be a base or appear inside a logarithm, as in ln(e^2) or log_e(5).');
    if (w) throw E_('\u201c' + w[0] + '\u201d is not understood. Write logarithms as log_2(8), log2(8), log(100) (base 10) or ln(5).');
    throw E_('Unexpected \u201c' + c + '\u201d at position ' + (this.i + 1) + '.');
  };

  function parseExpression(text) {
    var s = normalise(text); if (s.trim() === '') return { empty: true, error: 'Enter an expression, for example log2(8) + log2(4).' };
    if (s.length > MAXLEN) return { error: 'The expression is too long (the limit is ' + MAXLEN + ' characters).' };
    try { var p = new Parser(s), lf = p.lExpr(); p.ws(); if (p.i < s.length) throw E_('Unexpected \u201c' + s[p.i] + '\u201d at position ' + (p.i + 1) + '. Join terms with + or \u2212, and multiply with *.'); return { lf: lf }; }
    catch (e) { if (e.user) return { error: e.message, field: e.field }; throw e; }
  }
  function parseValue(text, name) { /* a number or expression: a base, an argument, an exponent */
    var s = normalise(text); if (s.trim() === '') return { empty: true, error: 'Enter ' + name + '.' };
    if (s.length > MAXLEN) return { error: 'The input is too long.' };
    try { var p = new Parser(s), a = p.aExpr(); p.ws(); if (p.i < s.length) throw E_('Unexpected \u201c' + s[p.i] + '\u201d at position ' + (p.i + 1) + '.'); return { node: a }; }
    catch (e) { if (e.user) return { error: e.message }; throw e; }
  }

  /* ---------- analysis of a linear form ---------- */
  function analyse(lf, dp) {
    var classes = [];
    lf.terms.forEach(function (t) {
      var D = t.base.vec, cl = null, i;
      for (i = 0; i < classes.length; i++) { var mu = prop(D, classes[i].D); if (mu !== null && !O.isZero(mu)) { cl = classes[i]; t.mu = mu; break; } }
      if (!cl) { cl = { D: D, base: t.base, bt: t.bt, terms: [], V: {} }; classes.push(cl); t.mu = ONE; }
      cl.terms.push(t); t.eff = O.div(t.coef, t.mu); cl.V = vAdd(cl.V, vScale(t.arg.val.vec, t.eff));
    });
    var allRat = true, rationalSum = lf.c, irr = 0, totalS = ratS(lf.c);
    classes.forEach(function (cl) {
      cl.bt = valText(cl.base); cl.lam = vEmpty(cl.V) ? ZERO : prop(cl.V, cl.D);
      var lnD = lnVec(cl.D); cl.valueS = vEmpty(cl.V) ? 0n : lnVec(cl.V) * S / lnD; cl.lnD = lnD;
      cl.XRat = vIsRat(cl.V); cl.XText = cl.XRat ? (function () { var q = vToRat(cl.V); return q && rs(q).length <= 60 ? rs(q) : vecText(cl.V); })() : vecText(cl.V);
      cl.rational = cl.lam !== null; if (cl.rational) rationalSum = O.add(rationalSum, cl.lam); else { allRat = false; irr++; }
      totalS += cl.valueS;
    });
    var status = allRat ? 'rational' : irr === 1 ? 'irrational' : 'undetermined';
    return { classes: classes, status: status, exact: allRat ? rationalSum : null, valueS: totalS, c: lf.c };
  }

  function condensedText(an) {
    var items = []; an.classes.forEach(function (cl) { if (!vEmpty(cl.V)) items.push({ c: ONE, body: lg(cl.bt, cl.XText) }); });
    var parts = items.length ? joinTerms(items) : ''; var c = an.c;
    if (!O.isZero(c)) parts = parts ? parts + (c.n < 0n ? ' - ' : ' + ') + rs(c.n < 0n ? O.neg(c) : c) : rs(c);
    return parts || '0';
  }
  function exprText(lf) {
    var items = lf.terms.map(function (t) { return { c: t.coef, body: lg(t.bt, t.argText) }; });
    var s = items.length ? joinTerms(items) : ''; if (!O.isZero(lf.c)) s = s ? s + (lf.c.n < 0n ? ' - ' : ' + ') + rs(lf.c.n < 0n ? O.neg(lf.c) : lf.c) : rs(lf.c);
    return s || '0';
  }

  function combineText(cl) { /* the product and quotient of the powered arguments, as written */
    var num = [], den = [];
    cl.terms.forEach(function (t) {
      if (O.isZero(t.eff)) return; var neg = t.eff.n < 0n, e = neg ? O.neg(t.eff) : t.eff, a = /[*\/+\-^]/.test(t.argText) ? '(' + t.argText + ')' : t.argText;
      (neg ? den : num).push(O.eq(e, ONE) ? a : a + '^' + (e.d === 1n ? e.n : '(' + rs(e) + ')'));
    });
    var n = num.length ? num.join('\u00b7') : '1'; if (!den.length) return n;
    return (num.length > 1 ? '(' + n + ')' : n) + ' \u00f7 ' + (den.length > 1 ? '(' + den.join('\u00b7') + ')' : den[0]);
  }
  /* ---------- mode: expr ---------- */
  function runExpr(input, dp) {
    var pr = parseExpression(input.text); if (pr.error) return { ok: false, empty: !!pr.empty, errors: { t: pr.error }, error: pr.error };
    var lf = pr.lf; if (!lf.terms.length) return { ok: false, errors: { t: 'There is no logarithm in this expression. Write at least one, for example log2(8) + 1.' }, error: 'There is no logarithm in this expression. Write at least one, for example log2(8) + 1.' };
    var an = analyse(lf, dp), res = { ok: true, mode: 'expr', dp: dp, status: an.status, steps: [], verify: [] }, st = res.steps, cls = an.classes;
    res.readAs = exprText(lf); res.condensed = condensedText(an); res.nTerms = lf.terms.length; res.nClasses = cls.length;
    if (an.exact) { var dec = Q.decOfRational(an.exact, dp); res.exact = rs(an.exact); res.valueText = dec.text; res.exactDecimal = dec.exact; res.yText = res.exact !== dec.text ? res.exact + ' = ' + dec.text : dec.text; res.label = 'Exact result (a rational number)'; }
    else { res.exact = null; res.valueText = fixed(an.valueS, dp); res.yText = res.valueText; res.label = an.status === 'irrational' ? 'Irrational result (decimal approximation)' : 'Decimal approximation (exactness not decided)'; }
    res.headline = res.exact !== null && res.yText.indexOf(res.exact) === 0 ? res.yText : res.valueText;
    /* single logarithm form */
    res.single = null; if (cls.length === 1) { var cl0 = cls[0], c0 = an.c; if (O.isZero(c0)) res.single = vEmpty(cl0.V) ? '0' : lg(cl0.bt, cl0.XText); else { var V2 = vAdd(cl0.V, vScale(cl0.D, c0)), t2 = vIsRat(V2) ? (function () { var q = vToRat(V2); return q && rs(q).length <= 60 ? rs(q) : vecText(V2); })() : vecText(V2); res.single = vEmpty(V2) ? '0' : lg(cl0.bt, t2); } }
    res.classes = cls.map(function (c) { return { base: c.bt, argument: c.XText, rational: c.rational, lam: c.lam ? rs(c.lam) : null, value: c.lam ? Q.decOfRational(c.lam, dp).text : fixed(c.valueS, dp), terms: c.terms.length }; });

    /* working */
    st.push('Read as: ' + res.readAs + '. Every logarithm needs a positive argument and a positive base other than 1; all ' + lf.terms.length + ' term' + (lf.terms.length === 1 ? '' : 's') + (lf.terms.length === 1 ? ' meets' : ' meet') + ' that.');
    cls.forEach(function (cl, ci) {
      var tag = cls.length > 1 ? 'Base ' + cl.bt + ': ' : '', ts = cl.terms, b0 = cl.bt;
      if (cls.length > 1 && ci === 0) st.push('The terms use bases that are powers of different numbers, so they are collected into ' + cls.length + ' groups. Terms with bases such as 2, 4 and 1/2 can be combined; terms with unrelated bases (2 and 3) cannot.');
      var conv = ts.filter(function (t) { return !O.eq(t.mu, ONE); });
      if (conv.length) st.push(tag + 'Change of base: log_c(x) = log_b(x) \u00f7 log_b(c). ' + conv.map(function (t) { return lg(t.bt, t.argText) + ' = ' + lg(b0, t.argText) + ' \u00f7 ' + rs(t.mu) + (O.eq(t.mu, ONE) ? '' : ' (because ' + b0 + (t.mu.d === 1n ? '^' + t.mu.n : '^(' + rs(t.mu) + ')') + ' = ' + t.bt + ')'); }).join('; ') + '.');
      var pw = ts.filter(function (t) { return !O.eq(t.eff, ONE) && !O.eq(t.eff, O.ri(-1)); });
      if (pw.length) st.push(tag + 'Power rule, n\u00b7log_b(x) = log_b(x^n), moves each coefficient into its logarithm: ' + pw.map(function (t) { return coefText(t.eff, lg(b0, t.argText)) + ' = ' + lg(b0, t.argText + '^' + (t.eff.d === 1n && t.eff.n > 0n ? t.eff.n : '(' + rs(t.eff) + ')')); }).join('; ') + '.');
      if (ts.length > 1) {
        var cmb = combineText(cl), same = cmb === cl.XText || cl.XText.length > 80;
        st.push(tag + 'Product rule, log_b(x) + log_b(y) = log_b(xy), for a sum, and quotient rule, log_b(x) \u2212 log_b(y) = log_b(x/y), for a difference, combine the terms into one logarithm: ' + (cmb.length > 160 ? lg(b0, 'the combined argument') : lg(b0, cmb)) + (same || cmb.length > 160 ? '' : ' = ' + lg(b0, cl.XText)) + '.');
      } else if (ts.length === 1 && !O.eq(ts[0].eff, ONE) && ts[0].eff.n !== 0n) st.push(tag + 'The single term becomes ' + lg(b0, cl.XText) + '.');
      if (vEmpty(cl.V)) st.push(tag + 'The combined argument is 1, and log_b(1) = 0 for every base.');
      else if (cl.rational) st.push(tag + 'The prime exponents of ' + cl.XText + ' are ' + rs(cl.lam) + ' times those of ' + b0 + ', so ' + b0 + '^' + (cl.lam.d === 1n ? cl.lam.n : '(' + rs(cl.lam) + ')') + ' = ' + cl.XText + ' and ' + lg(b0, cl.XText) + ' = ' + rs(cl.lam) + '.');
      else st.push(tag + 'The prime exponents of ' + cl.XText + ' are not a fixed multiple of those of ' + b0 + ', so the value is irrational. By change of base, ' + lg(b0, cl.XText) + ' = ln(' + cl.XText + ') \u00f7 ln(' + b0 + ') = ' + fixed(lnVec(cl.V), dp) + ' \u00f7 ' + fixed(cl.lnD, dp) + ' = ' + fixed(cl.valueS, dp) + '.');
    });
    if (!O.isZero(an.c)) st.push('The constant ' + rs(an.c) + ' is added.' + (cls.length === 1 ? ' It can also go inside the logarithm, because ' + rs(an.c) + ' = ' + lg(cls[0].bt, cls[0].bt + '^' + (an.c.d === 1n && an.c.n > 0n ? an.c.n : '(' + rs(an.c) + ')')) + '.' : ''));
    if (cls.length > 1) st.push(an.status === 'rational' ? 'Every group is a rational number, so the sum is exact: ' + rs(an.exact) + '.' : an.status === 'irrational' ? 'One group is irrational and the others are rational, so the sum is irrational.' : 'More than one group is irrational. A sum of logarithms in unrelated bases could be rational only by a coincidence the calculator cannot rule in or out, so it gives the decimal and does not claim exactness.');
    st.push('Result: ' + (res.exact !== null ? res.yText : '\u2248 ' + res.valueText) + '.');

    /* checks */
    var sumS = ratS(lf.c); lf.terms.forEach(function (t) { sumS += O.sgn(t.coef) === 0 ? 0n : lnVal(t.arg.val) * S / lnVal(t.base) * t.coef.n / t.coef.d; });
    var diff = sumS - an.valueS; if (diff < 0n) diff = -diff;
    res.verify.push({ text: 'Term by term in 90-digit arithmetic (each logarithm as ln x \u00f7 ln b, each argument computed as one number), the expression is ' + fixed(sumS, 12) + ', the same as the condensed form to better than 10^\u221270.', ok: diff <= 10n ** 22n * BigInt(lf.terms.length + 1), exact: false });
    cls.forEach(function (cl) {
      if (cl.rational && !vEmpty(cl.V)) { var ok = vEmpty(vAdd(cl.V, vScale(cl.D, O.neg(cl.lam)))); res.verify.push({ text: 'Exact: ' + cl.bt + '^' + (cl.lam.d === 1n ? cl.lam.n : '(' + rs(cl.lam) + ')') + ' gives the combined argument ' + cl.XText + ' (prime exponents compared).', ok: ok, exact: true }); }
    });
    var dv = Number(lf.c.n) / Number(lf.c.d), okD = true;
    lf.terms.forEach(function (t) { var nb = numOf(t.base), nx = numOf(t.arg.val); if (!isFinite(nb) || !isFinite(nx) || nb <= 0 || nx <= 0 || nb === 1) okD = false; else dv += Number(t.coef.n) / Number(t.coef.d) * Math.log(nx) / Math.log(nb); });
    if (okD && isFinite(dv)) { var yv = parseFloat(res.valueText.replace(/\u00d7 10\^/, 'e').replace(/ /g, '')); res.verify.push({ text: 'Double-precision cross-check: ' + String(dv) + ', which agrees with the result above.', ok: Math.abs(dv - yv) <= 1e-9 * Math.max(1, Math.abs(dv)) + (res.exact !== null && res.exactDecimal ? 0 : Math.pow(10, -dp)), exact: false }); }
    res.verifyOk = res.verify.every(function (v) { return v.ok; });
    res.rows = [['Read as', res.readAs], ['Condensed', res.condensed]]; if (res.single && res.single !== res.condensed) res.rows.push(['As one logarithm', res.single]);
    res.summary = ['Expression: ' + res.readAs, 'Condensed: ' + res.condensed, 'Value: ' + (res.exact !== null ? res.yText : '\u2248 ' + res.valueText), res.label].join('\n');
    return res;
  }

  /* ---------- mode: expand ---------- */
  function flatten(nd, coef, out) {
    if (nd.t === 'leaf') out.push({ val: nd.val, text: nd.text, coef: coef, sum: !!nd.sum });
    else if (nd.t === 'mul') { flatten(nd.a, coef, out); flatten(nd.b, coef, out); }
    else if (nd.t === 'div') { flatten(nd.a, coef, out); flatten(nd.b, O.neg(coef), out); }
    else flatten(nd.a, O.mul(coef, nd.r), out);
  }
  function termValue(baseVal, v, dp) { /* log_b of a vector value: { exact rational or null, text } */
    var D = baseVal.vec, lam = vEmpty(v.vec) ? ZERO : prop(v.vec, D), vS = vEmpty(v.vec) ? 0n : lnVal(v) * S / lnVal(baseVal);
    return { lam: lam, text: lam ? Q.decOfRational(lam, dp).text : fixed(vS, dp), S: vS };
  }
  function runExpand(input, dp) {
    var errs = {}, pb = parseValue(input.b, 'the base b'), px = parseValue(input.x, 'the argument x');
    if (pb.error) errs.b = pb.error; if (px.error) errs.x = px.error;
    if (!errs.b) { if (pb.node.val.sgn <= 0) errs.b = MSG_B0; else if (vEmpty(pb.node.val.vec)) errs.b = MSG_B1; }
    if (!errs.x && !px.error) { if (px.node.val.sgn === 0) errs.x = MSG_X0; else if (px.node.val.sgn < 0) errs.x = MSG_XN; }
    if (errs.b || errs.x) return { ok: false, empty: !!(pb.empty && px.empty), errors: errs, error: errs.b || errs.x };
    var B = pb.node.val, bt = valText(B), tree = px.node, X = tree.val, xt = treeText(tree), res = { ok: true, mode: 'expand', dp: dp, steps: [], verify: [], b: bt, x: xt }, st = res.steps;
    var lead = lg(bt, xt); res.lead = lead;
    /* as typed */
    var fl = []; flatten(tree, ONE, fl); var merged = [], keyOf = function (f) { return (f.val.sgn) + ':' + vecText(f.val.vec); };
    fl.forEach(function (f) { var k = keyOf(f), m = null; merged.forEach(function (x) { if (x.k === k) m = x; }); if (m) m.coef = O.add(m.coef, f.coef); else merged.push({ k: k, val: f.val, text: f.sum ? valText(f.val) : f.text, coef: f.coef, sum: f.sum }); });
    var ones = merged.filter(function (m) { return vEmpty(m.val.vec); }), live = merged.filter(function (m) { return !vEmpty(m.val.vec) && !O.isZero(m.coef); });
    var typed = live.map(function (m) { return { c: m.coef, body: lg(bt, m.text), m: m }; });
    res.typed = typed.length ? joinTerms(typed) : '0'; res.typedItems = typed.map(function (t) { var v = termValue(B, t.m.val, dp); return { coef: rs(t.c), term: lg(bt, t.m.text), value: v.text, exact: v.lam !== null }; });
    /* to primes */
    var prim = vKeys(X.vec).map(function (k) { return { c: X.vec[k], body: lg(bt, k), key: k }; });
    res.primes = prim.length ? joinTerms(prim) : '0';
    res.primeItems = prim.map(function (t) { var v = termValue(B, mkVal(1, (function () { var o = {}; o[t.key] = ONE; return o; })()), dp); return { coef: rs(t.c), term: lg(bt, t.key), value: v.text, exact: v.lam !== null }; });
    var total = termValue(B, X, dp); res.total = total.text; res.exact = total.lam ? rs(total.lam) : null; res.status = total.lam ? 'rational' : 'irrational';
    res.label = total.lam ? 'Exact result (a rational number)' : 'Irrational result (decimal approximation)';
    res.valueText = total.text; res.headline = res.exact !== null && res.exact !== total.text ? res.exact + ' = ' + total.text : total.text;
    res.nothing = live.length <= 1 && ones.length === 0 && live.length === 1 && O.eq(live[0].coef, ONE);
    /* working */
    st.push('Domain check: the argument ' + xt + (xt !== valText(X) ? ' = ' + valText(X) : '') + ' is positive, and the base ' + bt + ' is positive and not 1.');
    if (res.nothing) st.push('The argument is a single positive number with no product, quotient or power to split, so the rules give nothing new as typed. The prime expansion below splits it into prime factors.');
    else {
      st.push('Product rule log_b(xy) = log_b(x) + log_b(y) splits a product, quotient rule log_b(x/y) = log_b(x) \u2212 log_b(y) splits a quotient, and power rule log_b(x^n) = n\u00b7log_b(x) brings an exponent down.');
      st.push('Applied to ' + lead + ': ' + res.typed + (ones.length ? ' (a factor 1 is dropped, because log_b(1) = 0)' : '') + '.');
      if (merged.length < fl.length) st.push('Equal factors are collected, so their coefficients are added.');
      fl.filter(function (f) { return f.sum; }).forEach(function (f) { st.push('There is no rule for the logarithm of a sum, so ' + f.text + ' was worked out first and treated as the number ' + valText(f.val) + '.'); });
    }
    st.push('Splitting every factor into primes: ' + (vecText(X.vec) === '1' ? 'the argument is 1, so the logarithm is 0.' : valText(X) + ' = ' + vecText(X.vec) + ', so ' + lead + ' = ' + res.primes + '.'));
    st.push('Each term is evaluated by change of base. Together they give ' + (res.exact !== null ? res.exact + ' = ' : '') + total.text + '.');
    /* checks */
    var sumS = 0n; vKeys(X.vec).forEach(function (k) { var o = {}; o[k] = ONE; sumS += X.vec[k].n * (lnVal(mkVal(1, o)) * S / lnVal(B)) / X.vec[k].d; });
    var lnx = lnVal(X) * S / lnVal(B), d1 = sumS - lnx; if (d1 < 0n) d1 = -d1;
    res.verify.push({ text: 'The prime expansion, evaluated term by term in 90-digit arithmetic, equals ' + lead + ' computed directly (' + fixed(lnx, 12) + ') to better than 10^\u221270.', ok: d1 <= 10n ** 22n * BigInt(prim.length + 1), exact: false });
    var sumT = 0n; live.forEach(function (m) { sumT += (O.sgn(m.coef) === 0 ? 0n : lnVal(m.val) * S / lnVal(B) * m.coef.n / m.coef.d); }); var d2 = sumT - lnx; if (d2 < 0n) d2 = -d2;
    res.verify.push({ text: 'The expansion as typed gives the same value (' + fixed(sumT, 12) + ').', ok: d2 <= 10n ** 22n * BigInt(live.length + 1), exact: false });
    if (total.lam) res.verify.push({ text: 'Exact: ' + bt + '^' + (total.lam.d === 1n ? total.lam.n : '(' + rs(total.lam) + ')') + ' = ' + valText(X) + ' (prime exponents compared).', ok: vEmpty(vAdd(X.vec, vScale(B.vec, O.neg(total.lam)))), exact: true });
    res.verifyOk = res.verify.every(function (v) { return v.ok; });
    res.summary = [lead, 'As typed: ' + res.typed, 'To primes: ' + res.primes, 'Value: ' + (res.exact !== null ? res.headline : '\u2248 ' + res.valueText), res.label].join('\n');
    return res;
  }

  /* ---------- mode: verify one rule ---------- */
  var RULES = {
    product: { name: 'Product rule', formula: 'log_b(xy) = log_b(x) + log_b(y)', need: ['b', 'x', 'y'] },
    quotient: { name: 'Quotient rule', formula: 'log_b(x/y) = log_b(x) \u2212 log_b(y)', need: ['b', 'x', 'y'] },
    power: { name: 'Power rule', formula: 'log_b(x^n) = n\u00b7log_b(x)', need: ['b', 'x', 'n'] },
    change: { name: 'Change of base', formula: 'log_b(x) = log_c(x) \u00f7 log_c(b)', need: ['b', 'x', 'c'] },
    reciprocal: { name: 'Reciprocal base', formula: 'log_b(x) = 1 \u00f7 log_x(b)', need: ['b', 'x'] },
    identity: { name: 'Base identity', formula: 'log_b(b) = 1', need: ['b'] },
    zero: { name: 'Logarithm of 1', formula: 'log_b(1) = 0', need: ['b'] },
    inverse: { name: 'Inverse property', formula: 'b^(log_b(x)) = x', need: ['b', 'x'] },
    power2: { name: 'Logarithm of a power of the base', formula: 'log_b(b^n) = n', need: ['b', 'n'] }
  };
  function runVerify(input, dp) {
    var rule = RULES[input.rule]; if (!rule) return { ok: false, errors: { rule: 'Choose a rule.' }, error: 'Choose a rule.' };
    var errs = {}, V = {}, names = { b: 'the base b', x: 'the argument x', y: 'the second argument y', n: 'the exponent n', c: 'the new base c' };
    rule.need.forEach(function (f) {
      var p = parseValue(input[f], names[f]); if (p.error) { errs[f] = p.error; return; } V[f] = p.node.val;
      if (f === 'b' || f === 'c') { if (V[f].sgn <= 0) errs[f] = MSG_B0; else if (vEmpty(V[f].vec)) errs[f] = MSG_B1; }
      else if (f === 'x' || f === 'y') { if (V[f].sgn === 0) errs[f] = MSG_X0; else if (V[f].sgn < 0) errs[f] = MSG_XN; }
    });
    if (input.rule === 'reciprocal' && !errs.x && V.x && vEmpty(V.x.vec)) errs.x = 'x = 1 cannot be a base. The reciprocal rule needs x greater than zero and not 1, because log_x(b) uses x as a base.';
    if (Object.keys(errs).length) { var allEmpty = rule.need.every(function (f) { return !String(input[f] === undefined ? '' : input[f]).trim(); }); return { ok: false, empty: allEmpty, errors: errs, error: errs[rule.need[0]] || errs[Object.keys(errs)[0]] }; }
    var B = V.b, bt = valText(B), res = { ok: true, mode: 'verify', dp: dp, rule: input.rule, ruleName: rule.name, formula: rule.formula, steps: [], verify: [] }, st = res.steps;
    var one = function (v) { return lnVal(v) * S / lnVal(B); }, L1 = function (v) { return lg(bt, valText(v)); };
    var lhsS, rhsS, lhsT, rhsT, lhsX = null, rhsX = null, note = null;
    var rat = function (val) { return termValue(B, val, dp); };
    if (input.rule === 'product' || input.rule === 'quotient') {
      var prod = input.rule === 'product', XY = prod ? valMul(V.x, V.y) : valDiv(V.x, V.y);
      lhsS = one(XY); rhsS = prod ? one(V.x) + one(V.y) : one(V.x) - one(V.y);
      lhsT = lg(bt, valText(XY)); rhsT = L1(V.x) + (prod ? ' + ' : ' \u2212 ') + L1(V.y);
      var lx = rat(V.x), ly = rat(V.y), lxy = rat(XY); lhsX = lxy.lam; rhsX = lx.lam && ly.lam ? (prod ? O.add(lx.lam, ly.lam) : O.sub(lx.lam, ly.lam)) : lhsX; /* two irrational terms can still add up to a rational number, which the argument of the left side decides */
      st.push((prod ? 'x \u00d7 y = ' : 'x \u00f7 y = ') + valText(XY) + '. Left side: ' + lhsT + ' = ' + (lxy.lam ? rs(lxy.lam) + ' = ' : '') + lxy.text + '.');
      st.push('Right side: ' + L1(V.x) + ' = ' + lx.text + ' and ' + L1(V.y) + ' = ' + ly.text + (prod ? ', which add to ' : ', which subtract to ') + fixed(rhsS, dp) + '.');
    } else if (input.rule === 'power') {
      var n = valRat(V.n); if (!n) { return { ok: false, errors: { n: 'The exponent n must be a whole number, a decimal or a fraction.' }, error: 'The exponent n must be a whole number, a decimal or a fraction.' }; }
      if (n.n > MAXEXP || -n.n > MAXEXP || n.d > MAXEXP) return { ok: false, errors: { n: 'The exponent is too large.' }, error: 'The exponent is too large.' };
      var XN = valPow(V.x, n), lx2 = rat(V.x), lxn = rat(XN);
      lhsS = one(XN); rhsS = lx2.S * n.n / n.d; lhsT = lg(bt, valText(XN)); rhsT = coefText(n, L1(V.x)); if (O.isZero(n)) rhsT = '0\u00b7' + L1(V.x);
      lhsX = lxn.lam; rhsX = lx2.lam ? O.mul(n, lx2.lam) : lhsX;
      st.push('x^n = ' + valText(V.x) + '^' + (n.d === 1n && n.n >= 0n ? n.n : '(' + rs(n) + ')') + (valText(XN) === valText(V.x) + '^' + (n.d === 1n && n.n >= 0n ? n.n : '(' + rs(n) + ')') ? '' : ' = ' + valText(XN)) + '. Left side: ' + lhsT + ' = ' + lxn.text + '.');
      st.push('Right side: n \u00d7 ' + L1(V.x) + ' = ' + rs(n) + ' \u00d7 ' + lx2.text + ' = ' + fixed(rhsS, dp) + '.');
    } else if (input.rule === 'change') {
      var C = V.c, lc = lnVal(C), lnx = lnVal(V.x), lnb = lnVal(B);
      lhsS = lnx * S / lnb; rhsS = (lnx * S / lc) * S / (lnb * S / lc); lhsT = L1(V.x); rhsT = lg(valText(C), valText(V.x)) + ' \u00f7 ' + lg(valText(C), bt);
      lhsX = rat(V.x).lam; var cx = termValue(C, V.x, dp), cb = termValue(C, B, dp); rhsX = cx.lam && cb.lam && !O.isZero(cb.lam) ? O.div(cx.lam, cb.lam) : lhsX; /* log_c(x) / log_c(b) = ln x / ln b, so the quotient is rational exactly when x and b are proportional, even if both parts are irrational */
      st.push('Left side: ' + lhsT + ' = ' + rat(V.x).text + '. Right side: ' + lg(valText(C), valText(V.x)) + ' = ' + cx.text + ' and ' + lg(valText(C), bt) + ' = ' + cb.text + ', so the quotient is ' + fixed(rhsS, dp) + '.');
      if (C.vec && vEmpty(vAdd(C.vec, vScale(V.x.vec, O.neg(ONE))))) note = 'The new base c equals x, so the right side is 1 \u00f7 log_x(b): the reciprocal rule is the special case c = x.';
    } else if (input.rule === 'reciprocal') {
      var lnx3 = lnVal(V.x), lnb3 = lnVal(B); lhsS = lnx3 * S / lnb3; var inner = lnb3 * S / lnx3; rhsS = S * S / inner;
      lhsT = L1(V.x); rhsT = '1 \u00f7 ' + lg(valText(V.x), bt); lhsX = rat(V.x).lam; var bx = termValue(V.x, B, dp); rhsX = bx.lam && !O.isZero(bx.lam) ? O.div(ONE, bx.lam) : lhsX;
      st.push('Left side: ' + lhsT + ' = ' + rat(V.x).text + '. Right side: ' + lg(valText(V.x), bt) + ' = ' + bx.text + ', and 1 \u00f7 ' + bx.text + ' = ' + fixed(rhsS, dp) + '.');
    } else if (input.rule === 'identity') {
      lhsS = one(B); rhsS = S; lhsT = lg(bt, bt); rhsT = '1'; lhsX = rat(B).lam; rhsX = ONE;
      st.push('A base raised to the power 1 is itself, so ' + lhsT + ' = 1 whatever the base is.');
    } else if (input.rule === 'zero') {
      lhsS = 0n; rhsS = 0n; lhsT = lg(bt, '1'); rhsT = '0'; lhsX = ZERO; rhsX = ZERO;
      st.push('A base raised to the power 0 is 1, so ' + lhsT + ' = 0 whatever the base is.');
    } else if (input.rule === 'inverse') {
      var y1 = one(V.x), yexact = rat(V.x);
      lhsS = lnVal(B) * y1 / S; rhsS = lnVal(V.x); lhsT = bt + '^(' + lg(bt, valText(V.x)) + ')'; rhsT = valText(V.x); lhsX = yexact.lam ? (function () { var vv = vAdd({}, vScale(B.vec, yexact.lam)); return vEmpty(vAdd(vv, vScale(V.x.vec, O.neg(ONE)))) ? ONE : null; })() : null; rhsX = lhsX;
      note = 'Compared as natural logarithms: ln(b^(log_b x)) = log_b(x) \u00b7 ln(b) against ln(x).';
      st.push(lg(bt, valText(V.x)) + ' = ' + yexact.text + ', so b^(log_b x) = ' + bt + '^(' + yexact.text + '). Taking natural logarithms: ' + fixed(y1, dp) + ' \u00d7 ln(' + bt + ') = ' + fixed(lhsS, dp) + ' and ln(' + valText(V.x) + ') = ' + fixed(rhsS, dp) + '.');
    } else if (input.rule === 'power2') {
      var n2 = valRat(V.n); if (!n2) return { ok: false, errors: { n: 'The exponent n must be a whole number, a decimal or a fraction.' }, error: 'The exponent n must be a whole number, a decimal or a fraction.' };
      if (n2.n > MAXEXP || -n2.n > MAXEXP || n2.d > MAXEXP) return { ok: false, errors: { n: 'The exponent is too large.' }, error: 'The exponent is too large.' };
      var BN = valPow(B, n2); lhsS = one(BN); rhsS = ratS(n2); lhsT = lg(bt, valText(BN)); rhsT = rs(n2); lhsX = rat(BN).lam; rhsX = n2;
      st.push('b^n = ' + bt + '^' + (n2.d === 1n && n2.n >= 0n ? n2.n : '(' + rs(n2) + ')') + ' = ' + valText(BN) + '. By the definition of a logarithm, ' + lhsT + ' = n = ' + rs(n2) + '.');
    }
    var dd = lhsS - rhsS; if (dd < 0n) dd = -dd; var tol = 10n ** 20n;
    res.lhsText = lhsT; res.rhsText = rhsT; res.lhsValue = lhsX ? rs(lhsX) + (lhsX.d !== 1n ? ' = ' + Q.decOfRational(lhsX, dp).text : '') : fixed(lhsS, dp); res.rhsValue = rhsX ? rs(rhsX) + (rhsX.d !== 1n ? ' = ' + Q.decOfRational(rhsX, dp).text : '') : fixed(rhsS, dp);
    res.holds = dd <= tol; res.exactBoth = !!(lhsX && rhsX); res.exactEqual = res.exactBoth && O.eq(lhsX, rhsX); res.diffText = dd === 0n ? '0' : dd <= tol ? 'below 10^\u221270' : L.fmtS(dd, 3);
    res.status = res.exactBoth ? 'rational' : 'irrational'; res.exact = res.exactBoth ? rs(lhsX) : null;
    res.label = res.holds ? (res.exactBoth ? 'The rule holds exactly (both sides are the same rational number)' : 'The rule holds (both sides agree to better than 10^\u221270; the value is irrational)') : 'The two sides differ';
    res.valueText = fixed(lhsS, dp); res.headline = lhsT + ' = ' + rhsT;
    if (note) st.push(note);
    st.push('Both sides are computed separately in 90-digit arithmetic. Their difference is ' + (res.diffText === '0' ? '0' : res.diffText) + ', so ' + (res.holds ? 'they agree.' : 'they do not agree.'));
    res.verify.push({ text: 'Left side ' + res.lhsValue + ' and right side ' + res.rhsValue + (res.exactBoth ? ' are compared as exact fractions.' : ' are compared in 90-digit arithmetic.'), ok: res.holds && (!res.exactBoth || res.exactEqual), exact: res.exactBoth });
    var dbl = null;
    try {
      var nb = numOf(B), nx = V.x ? numOf(V.x) : 1, ny = V.y ? numOf(V.y) : 1, nn = V.n ? (valRat(V.n) ? Number(valRat(V.n).n) / Number(valRat(V.n).d) : NaN) : 0, nc = V.c ? numOf(V.c) : 1, lb = function (a, b) { return Math.log(a) / Math.log(b); };
      if (isFinite(nb) && isFinite(nx) && isFinite(ny) && nb > 0 && nb !== 1) {
        if (input.rule === 'product') dbl = [lb(nx * ny, nb), lb(nx, nb) + lb(ny, nb)]; else if (input.rule === 'quotient') dbl = [lb(nx / ny, nb), lb(nx, nb) - lb(ny, nb)];
        else if (input.rule === 'power') dbl = [lb(Math.pow(nx, nn), nb), nn * lb(nx, nb)]; else if (input.rule === 'change' && isFinite(nc) && nc > 0 && nc !== 1) dbl = [lb(nx, nb), lb(nx, nc) / lb(nb, nc)];
        else if (input.rule === 'reciprocal' && nx !== 1) dbl = [lb(nx, nb), 1 / lb(nb, nx)]; else if (input.rule === 'identity') dbl = [lb(nb, nb), 1]; else if (input.rule === 'zero') dbl = [lb(1, nb), 0];
        else if (input.rule === 'inverse') dbl = [Math.pow(nb, lb(nx, nb)), nx]; else if (input.rule === 'power2') dbl = [lb(Math.pow(nb, nn), nb), nn];
      }
    } catch (e) { dbl = null; }
    if (dbl && isFinite(dbl[0]) && isFinite(dbl[1])) res.verify.push({ text: 'Double-precision cross-check: left ' + String(dbl[0]) + ', right ' + String(dbl[1]) + '.', ok: Math.abs(dbl[0] - dbl[1]) <= 1e-9 * Math.max(1, Math.abs(dbl[0])), exact: false });
    res.verifyOk = res.verify.every(function (v) { return v.ok; });
    res.summary = [rule.name + ': ' + rule.formula, 'Left side: ' + lhsT + ' = ' + res.lhsValue, 'Right side: ' + rhsT + ' = ' + res.rhsValue, res.label].join('\n');
    return res;
  }

  function run(input) {
    input = input || {}; var dp = input.dp === undefined ? 8 : Math.max(2, Math.min(15, input.dp | 0));
    try {
      if (input.mode === 'expand') return runExpand(input, dp);
      if (input.mode === 'verify') return runVerify(input, dp);
      return runExpr(input, dp);
    } catch (e) { if (e.user) return { ok: false, errors: { t: e.message }, error: e.message }; if (typeof process !== 'undefined' && process.env && process.env.LOGRULES_DEBUG) throw e; return { ok: false, errors: { t: 'This input could not be calculated.' }, error: 'This input could not be calculated.' }; }
  }

  var api = { run: run, parse: parseExpression, RULES: RULES, normalise: normalise };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.LogRules = api;
})(typeof window !== 'undefined' ? window : globalThis);
