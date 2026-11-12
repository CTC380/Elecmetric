/* Elecmetric Scientific Calculator engine.
   One file, no dependencies, no DOM. It is required by the tests in Node and inlined, unchanged, into
   calculators/scientific-calculator/index.html by tools/scicalc_page.js, so the page runs exactly the code the tests run.
   Safe by construction: a hand-written tokenizer and recursive-descent parser. Nothing the user types is ever run as code.
   Values are complex numbers {re, im}. In Standard mode a result that leaves the real numbers is a domain error;
   in Engineering mode the same operation returns the complex result. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SciCalc = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var PI = Math.PI;
  var MINUS = '\u2212';

  function C(re, im) { return { re: re, im: im || 0 }; }
  function err(msg) { return { sciError: msg }; }

  /* ---------- complex arithmetic ---------- */
  function fin(z) {
    if (!isFinite(z.re) || !isFinite(z.im)) throw err('Overflow: the result is too large to show');
    return z;
  }
  function add(a, b) { return C(a.re + b.re, a.im + b.im); }
  function sub(a, b) { return C(a.re - b.re, a.im - b.im); }
  function mul(a, b) { return C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re); }
  function div(a, b) {
    if (b.re === 0 && b.im === 0) throw err('Division by zero');
    if (b.im === 0) return C(a.re / b.re, a.im / b.re);
    var d = b.re * b.re + b.im * b.im;
    return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
  }
  function cabs(z) { return z.im === 0 ? Math.abs(z.re) : Math.hypot(z.re, z.im); }
  function carg(z) { return Math.atan2(z.im, z.re); }
  function cexp(z) { var m = Math.exp(z.re); return C(m * Math.cos(z.im), z.im === 0 ? 0 : m * Math.sin(z.im)); }
  function cln(z) {
    if (z.re === 0 && z.im === 0) throw err('Domain error: ln(0) is undefined');
    return C(Math.log(cabs(z)), carg(z));
  }
  function csqrt(z) {
    var r = cabs(z);
    var re = Math.sqrt((r + z.re) / 2), im = Math.sqrt(Math.max(0, (r - z.re) / 2));
    return C(re, z.im < 0 ? -im : im);
  }
  function cpowGen(a, b) {
    if (a.re === 0 && a.im === 0) {
      if (b.im === 0 && b.re > 0) return C(0);
      throw err('Division by zero: zero to a negative or complex power');
    }
    return cexp(mul(b, cln(a)));
  }
  function cpowInt(a, n) {
    var neg = n < 0, k = Math.abs(n), r = C(1), p = a;
    while (k > 0) { if (k & 1) r = mul(r, p); p = mul(p, p); k = Math.floor(k / 2); }
    return neg ? div(C(1), r) : r;
  }
  function csin(z) { return C(Math.sin(z.re) * Math.cosh(z.im), Math.cos(z.re) * Math.sinh(z.im)); }
  function ccos(z) { return C(Math.cos(z.re) * Math.cosh(z.im), -Math.sin(z.re) * Math.sinh(z.im)); }
  function csinh(z) { return C(Math.sinh(z.re) * Math.cos(z.im), Math.cosh(z.re) * Math.sin(z.im)); }
  function ccosh(z) { return C(Math.cosh(z.re) * Math.cos(z.im), Math.sinh(z.re) * Math.sin(z.im)); }
  var J = C(0, 1);
  function casin(z) { return mul(C(0, -1), cln(add(mul(J, z), csqrt(sub(C(1), mul(z, z)))))); }
  function cacos(z) { return sub(C(PI / 2), casin(z)); }
  function catan(z) { return mul(C(0, 0.5), sub(cln(sub(C(1), mul(J, z))), cln(add(C(1), mul(J, z))))); }
  function casinh(z) { return cln(add(z, csqrt(add(mul(z, z), C(1))))); }
  function cacosh(z) { return cln(add(z, mul(csqrt(add(z, C(1))), csqrt(sub(z, C(1)))))); }
  function catanh(z) { return mul(C(0.5), sub(cln(add(C(1), z)), cln(sub(C(1), z)))); }

  /* ---------- angle handling ---------- */
  function angleFactor(mode) { return mode === 'RAD' ? 1 : mode === 'GRAD' ? PI / 200 : PI / 180; }
  function degOf(x, c) { return c.angle === 'DEG' ? x : c.angle === 'GRAD' ? x * 9 / 10 : null; }
  function norm360(d) { return ((d % 360) + 360) % 360; }
  var SIN_EXACT = { 0: 0, 30: 0.5, 45: Math.SQRT1_2, 60: Math.sqrt(3) / 2, 90: 1 };
  /* Exact values at multiples of 30 and 45 degrees, so sin(30) is 0.5 and cos(90) is 0 and not 1e-16. */
  function exactSin(r) {
    var sgn = 1, a = r;
    if (a >= 180) { a -= 180; sgn = -1; }
    if (a > 90) a = 180 - a;
    var v = SIN_EXACT[a];
    return v === undefined || !Object.prototype.hasOwnProperty.call(SIN_EXACT, a) ? null : sgn * v;
  }
  function snap(v, rad) { return Math.abs(rad) > 1e-3 && Math.abs(v) < 1e-15 ? 0 : v; }
  function sinR(x, c) {
    var d = degOf(x, c);
    if (d !== null && isFinite(d)) { var e = exactSin(norm360(d)); if (e !== null) return e; }
    var r = x * c.k; return snap(Math.sin(r), r);
  }
  function cosR(x, c) {
    var d = degOf(x, c);
    if (d !== null && isFinite(d)) { var e = exactSin(norm360(d + 90)); if (e !== null) return e; }
    var r = x * c.k; return snap(Math.cos(r), r);
  }
  function tanR(x, c) {
    var co = cosR(x, c);
    if (co === 0) throw err('Domain error: tan is undefined at this angle');
    return sinR(x, c) / co;
  }

  /* ---------- tokenizer ---------- */
  function normalize(s) {
    return String(s)
      .replace(/\*\*/g, '^')
      .replace(/[\u00d7\u00b7\u22c5]/g, '*')
      .replace(/\u00f7/g, '/')
      .replace(/[\u2212\u2013\u2014]/g, '-')
      .replace(/\u03c0/g, ' pi ')
      .replace(/\u221a/g, ' sqrt ')
      .replace(/\u221b/g, ' cbrt ')
      .replace(/\u00b2/g, '^2').replace(/\u00b3/g, '^3')
      .replace(/(sinh|cosh|tanh|sin|cos|tan)\u207b\u00b9/gi, 'a$1')
      .replace(/\u207b\u00b9/g, '^-1')
      .replace(/\u2220/g, '@')
      .replace(/[\u00a0\u2009\u202f]/g, ' ');
  }
  var PREFIX = { k: 1e3, M: 1e6, G: 1e9, T: 1e12, m: 1e-3, u: 1e-6, '\u00b5': 1e-6, '\u03bc': 1e-6, n: 1e-9, p: 1e-12 };
  var NUM_RE = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/;

  function tokenize(src, c) {
    var s = normalize(src), i = 0, out = [], m, ch;
    while (i < s.length) {
      ch = s.charAt(i);
      if (ch === ' ' || ch === '\t' || ch === '\n') { i++; continue; }
      if (c.complex && (ch === 'j' || ch === 'J' || ch === 'i' || ch === 'I')) {
        m = NUM_RE.exec(s.slice(i + 1));
        if (m && !/^[A-Za-z]/.test(s.slice(i + 1 + m[0].length))) {
          out.push({ t: 'num', v: C(0, parseFloat(m[0])), cx: true }); i += 1 + m[0].length; continue;
        }
      }
      m = NUM_RE.exec(s.slice(i));
      if (m) {
        var val = parseFloat(m[0]), rest = s.slice(i + m[0].length), used = m[0].length, cx = false, nx;
        if (c.complex && rest.length && PREFIX.hasOwnProperty(rest.charAt(0))) {
          nx = rest.charAt(1);
          if (!/[A-Za-z0-9_]/.test(nx || '')) { val *= PREFIX[rest.charAt(0)]; used++; rest = rest.slice(1); }
        }
        if (c.complex && /^[jJiI]/.test(rest) && !/^[A-Za-z0-9_]/.test(rest.charAt(1) || '')) {
          out.push({ t: 'num', v: C(0, val), cx: true }); used++;
        } else out.push({ t: 'num', v: C(val) });
        i += used; continue;
      }
      if (/[A-Za-z]/.test(ch)) {
        m = /^[A-Za-z]+/.exec(s.slice(i));
        var name = m[0].toLowerCase(), after = s.slice(i + m[0].length);
        if (name === 'atan' && /^2\(/.test(after)) { name = 'atan2'; i += m[0].length + 1; }
        else if (name === 'log' && /^(2|10)\(/.test(after)) { name = 'log' + /^(2|10)/.exec(after)[0]; i += m[0].length + /^(2|10)/.exec(after)[0].length; }
        else i += m[0].length;
        out.push({ t: 'id', v: name }); continue;
      }
      if ('+-*/^(),!%@\u00b0'.indexOf(ch) >= 0) { out.push({ t: ch === '\u00b0' ? '\u00b0' : ch }); i++; continue; }
      if (ch === '<') { out.push({ t: '@' }); i++; continue; }
      if (ch === '=') { i++; continue; }
      throw err("Unexpected character '" + ch + "'");
    }
    return out;
  }

  /* ---------- functions ---------- */
  function hint(c) { return c.complex ? '' : ' (switch to Engineering mode for complex results)'; }
  function dom(msg, c) { return err('Domain error: ' + msg + hint(c)); }
  function isReal(z) { return z.im === 0; }
  function needReal(name, z) { if (!isReal(z)) throw err(name + ' needs a real number'); return z.re; }
  function fromRad(z, c) { return C(z.re / c.k, z.im / c.k); }

  function factorial(x) {
    if (!Number.isInteger(x) || x < 0) throw err('Factorial needs a whole number from 0 to 170');
    if (x > 170) throw err('Overflow: factorial is limited to 170!');
    var r = 1; for (var i = 2; i <= x; i++) r *= i; return r;
  }
  function ncr(n, r) {
    if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n) throw err('nCr needs whole numbers with 0 <= r <= n');
    if (n > 1000) throw err('Overflow: nCr is limited to n <= 1000');
    var k = Math.min(r, n - r), v = 1;
    for (var i = 1; i <= k; i++) v = v * (n - k + i) / i;
    return Math.round(v);
  }
  function npr(n, r) {
    if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n) throw err('nPr needs whole numbers with 0 <= r <= n');
    var v = 1; for (var i = 0; i < r; i++) { v *= (n - i); if (!isFinite(v)) throw err('Overflow: the result is too large to show'); } return v;
  }

  function real1(f) { return function (a, c) { return C(f(needReal('This function', a[0]), c)); }; }
  /* A function that has a real formula with a domain check and a complex formula used in Engineering mode. */
  function dual(realOk, realF, cplxF, msg) {
    return function (a, c) {
      var z = a[0];
      if (c.complex && !isReal(z)) return cplxF(z, c);
      var x = needReal('This function', z);
      if (realOk(x)) return C(realF(x, c));
      if (c.complex) return cplxF(z, c);
      throw dom(msg(x), c);
    };
  }
  function trig(realF, cplxF) {
    return function (a, c) {
      var z = a[0];
      if (!isReal(z)) { if (!c.complex) throw err('Complex input needs Engineering mode'); return cplxF(C(z.re * c.k, z.im * c.k)); }
      return C(realF(z.re, c));
    };
  }
  function inv(realOk, realF, cplxF, msg) {
    return function (a, c) {
      var z = a[0];
      if (!isReal(z)) { if (!c.complex) throw err('Complex input needs Engineering mode'); return fromRad(cplxF(z), c); }
      if (realOk(z.re)) return C(realF(z.re) / c.k);
      if (c.complex) return fromRad(cplxF(z), c);
      throw dom(msg(z.re), c);
    };
  }
  function hyp(realF, cplxF) {
    return function (a, c) {
      var z = a[0];
      if (!isReal(z)) { if (!c.complex) throw err('Complex input needs Engineering mode'); return cplxF(z); }
      return C(realF(z.re));
    };
  }
  function powC(a, b, c) {
    if (isReal(a) && isReal(b)) {
      var x = a.re, y = b.re;
      if (x === 0) {
        if (y < 0) throw err('Division by zero: zero to a negative power');
        return C(y === 0 ? 1 : 0);
      }
      if (x > 0 || Number.isInteger(y)) return C(Math.pow(x, y));
      if (!c.complex) throw dom('a negative number to a non-integer power is not real', c);
      return cpowGen(a, b);
    }
    if (!c.complex) throw err('Complex numbers need Engineering mode');
    if (isReal(b) && Number.isInteger(b.re) && Math.abs(b.re) <= 1024) return cpowInt(a, b.re);
    return cpowGen(a, b);
  }
  function rootC(a, n, c) {
    var x = needReal('root', n);
    if (x === 0) throw err('Division by zero: the 0th root is undefined');
    if (isReal(a)) {
      if (a.re >= 0) return C(Math.pow(a.re, 1 / x));
      if (Number.isInteger(x) && Math.abs(x) % 2 === 1) return C(-Math.pow(-a.re, 1 / x));
      if (!c.complex) throw dom('an even root of a negative number is not real', c);
    }
    if (!c.complex) throw err('Complex numbers need Engineering mode');
    return cpowGen(a, C(1 / x));
  }
  var FN = {
    sin: [1, 1, trig(sinR, csin)],
    cos: [1, 1, trig(cosR, ccos)],
    tan: [1, 1, trig(tanR, function (z) { return div(csin(z), ccos(z)); })],
    sec: [1, 1, function (a, c) { var v = cosR(needReal('sec', a[0]), c); if (v === 0) throw err('Domain error: sec is undefined at this angle'); return C(1 / v); }],
    csc: [1, 1, function (a, c) { var v = sinR(needReal('csc', a[0]), c); if (v === 0) throw err('Domain error: csc is undefined at this angle'); return C(1 / v); }],
    cot: [1, 1, function (a, c) { var s = sinR(needReal('cot', a[0]), c); if (s === 0) throw err('Domain error: cot is undefined at this angle'); return C(cosR(a[0].re, c) / s); }],
    asin: [1, 1, inv(function (x) { return Math.abs(x) <= 1; }, Math.asin, casin, function () { return 'asin needs a value from -1 to 1'; })],
    acos: [1, 1, inv(function (x) { return Math.abs(x) <= 1; }, Math.acos, cacos, function () { return 'acos needs a value from -1 to 1'; })],
    atan2: [2, 2, function (a, c) {
      var y = needReal('atan2', a[0]), x = needReal('atan2', a[1]);
      if (x === 0 && y === 0) throw err('Domain error: atan2(0, 0) is undefined');
      return C(Math.atan2(y, x) / c.k);
    }],
    atan: [1, 1, inv(function () { return true; }, Math.atan, catan, function () { return ''; })],
    sinh: [1, 1, hyp(Math.sinh, csinh)],
    cosh: [1, 1, hyp(Math.cosh, ccosh)],
    tanh: [1, 1, hyp(Math.tanh, function (z) { return div(csinh(z), ccosh(z)); })],
    asinh: [1, 1, hyp(Math.asinh, casinh)],
    acosh: [1, 1, dual(function (x) { return x >= 1; }, Math.acosh, cacosh, function () { return 'acosh needs a value of 1 or more'; })],
    atanh: [1, 1, dual(function (x) { return Math.abs(x) < 1; }, Math.atanh, catanh, function (x) { return Math.abs(x) === 1 ? 'atanh is infinite at 1 and -1' : 'atanh needs a value between -1 and 1'; })],
    ln: [1, 1, dual(function (x) { return x > 0; }, Math.log, cln, function (x) { return x === 0 ? 'ln(0) is undefined' : 'ln of a negative number is not real'; })],
    log: [1, 2, function (a, c) {
      if (a.length === 2) return FN.logb[2](a, c);
      return dual(function (x) { return x > 0; }, Math.log10, function (z) { return div(cln(z), C(Math.LN10)); }, function (x) { return x === 0 ? 'log(0) is undefined' : 'log of a negative number is not real'; })(a, c);
    }],
    log10: [1, 1, function (a, c) { return FN.log[2]([a[0]], c); }],
    log2: [1, 1, dual(function (x) { return x > 0; }, Math.log2, function (z) { return div(cln(z), C(Math.LN2)); }, function (x) { return x === 0 ? 'log2(0) is undefined' : 'log2 of a negative number is not real'; })],
    logb: [2, 2, function (a, c) {
      var x = a[0], b = a[1];
      if (isReal(x) && isReal(b)) {
        if (b.re <= 0 || b.re === 1) throw err('Domain error: the base must be positive and not 1');
        if (x.re > 0) return C(Math.log(x.re) / Math.log(b.re));
        if (!c.complex) throw dom('the logarithm of a number that is not positive is not real', c);
      }
      if (!c.complex) throw err('Complex numbers need Engineering mode');
      return div(cln(x), cln(b));
    }],
    exp: [1, 1, function (a, c) { return fin(isReal(a[0]) ? C(Math.exp(a[0].re)) : cexp(a[0])); }],
    sqrt: [1, 1, function (a, c) {
      var z = a[0];
      if (isReal(z)) { if (z.re >= 0) return C(Math.sqrt(z.re)); if (!c.complex) throw dom('the square root of a negative number is not real', c); return C(0, Math.sqrt(-z.re)); }
      if (!c.complex) throw err('Complex numbers need Engineering mode');
      return csqrt(z);
    }],
    cbrt: [1, 1, function (a, c) {
      var z = a[0];
      if (isReal(z)) return C(Math.cbrt(z.re));
      if (!c.complex) throw err('Complex numbers need Engineering mode');
      return cpowGen(z, C(1 / 3));
    }],
    root: [2, 2, function (a, c) { return rootC(a[0], a[1], c); }],
    pow: [2, 2, function (a, c) { return powC(a[0], a[1], c); }],
    abs: [1, 1, function (a) { return C(cabs(a[0])); }],
    mag: [1, 1, function (a) { return C(cabs(a[0])); }],
    arg: [1, 1, function (a, c) { return C(carg(a[0]) / c.k); }],
    re: [1, 1, function (a) { return C(a[0].re); }],
    im: [1, 1, function (a) { return C(a[0].im); }],
    conj: [1, 1, function (a) { return C(a[0].re, a[0].im === 0 ? 0 : -a[0].im); }],
    par: [2, 8, function (a) {
      if (a.some(function (z) { return z.re === 0 && z.im === 0; })) return C(0);
      var s = C(0); a.forEach(function (z) { s = add(s, div(C(1), z)); });
      if (s.re === 0 && s.im === 0) throw err('Open circuit: these impedances cancel, so the parallel combination is infinite');
      return div(C(1), s);
    }],
    fact: [1, 1, function (a) { return C(factorial(needReal('Factorial', a[0]))); }],
    ncr: [2, 2, function (a) { return C(ncr(needReal('nCr', a[0]), needReal('nCr', a[1]))); }],
    npr: [2, 2, function (a) { return C(npr(needReal('nPr', a[0]), needReal('nPr', a[1]))); }],
    inv: [1, 1, function (a) { return div(C(1), a[0]); }],
    floor: [1, 1, function (a) { return C(Math.floor(needReal('floor', a[0]))); }],
    ceil: [1, 1, function (a) { return C(Math.ceil(needReal('ceil', a[0]))); }],
    round: [1, 1, function (a) { var x = needReal('round', a[0]); return C(x < 0 ? -Math.round(-x) : Math.round(x)); }],
    trunc: [1, 1, function (a) { return C(Math.trunc(needReal('trunc', a[0]))); }],
    mod: [2, 2, function (a) {
      var x = needReal('mod', a[0]), y = needReal('mod', a[1]);
      if (y === 0) throw err('Division by zero');
      return C(x - y * Math.floor(x / y));
    }]
  };
  var UNITLESS = ['arg', 'asin', 'acos', 'atan', 'atan2', 'ncr', 'npr'];
  var ALIAS = { arcsin: 'asin', arccos: 'acos', arctan: 'atan', arcsinh: 'asinh', arccosh: 'acosh', arctanh: 'atanh', sqr: 'sqrt', factorial: 'fact', phase: 'arg', angle: 'arg', real: 're', imag: 'im', modulus: 'mag', conjugate: 'conj', parallel: 'par' };
  var FNLIST = Object.keys(FN);
  /* Names a variable may not take: constants, the previous answer, memory, the imaginary unit, functions and their aliases. */
  var RESERVED = { pi: 1, e: 1, ans: 1, mem: 1, rnd: 1, rand: 1, j: 1, i: 1 };
  FNLIST.concat(Object.keys(ALIAS)).forEach(function (n) { RESERVED[n] = 1; });
  function reserved(name) { return Object.prototype.hasOwnProperty.call(RESERVED, String(name).toLowerCase()); }

  /* ---------- parser / evaluator ---------- */
  function evaluate(expr, opts) {
    opts = opts || {};
    var c = { angle: opts.angle === 'RAD' || opts.angle === 'GRAD' ? opts.angle : 'DEG', complex: !!opts.complex, ans: opts.ans || C(0), mem: opts.mem || C(0), rand: opts.random || Math.random, volatile: false, usedComplex: false, tight: opts.implicit === 'tight', vars: opts.vars || null };
    c.k = angleFactor(c.angle);
    var toks, pos = 0;
    function peek() { return toks[pos]; }
    function eat(t) { var k = toks[pos]; if (k && k.t === t) { pos++; return k; } return null; }
    function startsPrimary(k) { return !!k && (k.t === 'num' || k.t === 'id' || k.t === '('); }

    function parseExpr() {
      var v = parseTerm(), k;
      while ((k = peek()) && (k.t === '+' || k.t === '-')) { pos++; var r = parseTerm(); v = fin(k.t === '+' ? add(v, r) : sub(v, r)); }
      return v;
    }
    /* A product written without a sign (2pi, 3(4+5), 2sin(30)). */
    function juxtapose(v) {
      var k = peek();
      if (k.t === 'num' && !k.cx && toks[pos - 1] && toks[pos - 1].t === 'num' && !toks[pos - 1].cx) throw err('Add an operator between the numbers (for example 1000 * 3)');
      return fin(mul(v, parsePolar()));
    }
    /* Implicit multiplication setting. Equal (default): a product with the sign left out ranks with * and /, so 1/2pi is (1/2)*pi.
       Tight: it binds before / so 1/2pi is 1/(2*pi). */
    function parseOperand() {
      var v = parsePolar();
      if (c.tight) while (startsPrimary(peek())) v = juxtapose(v);
      return v;
    }
    function parseTerm() {
      var v = parseOperand(), k;
      for (;;) {
        k = peek();
        if (k && (k.t === '*' || k.t === '/')) { pos++; var r = parseOperand(); v = fin(k.t === '*' ? mul(v, r) : div(v, r)); }
        else if (!c.tight && startsPrimary(k)) v = juxtapose(v);
        else break;
      }
      return v;
    }
    function parsePolar() {
      var v = parseUnary();
      if (peek() && peek().t === '@') {
        if (!c.complex) throw err('Polar input (\u2220) needs Engineering mode');
        pos++; var a = parseUnary();
        if (!isReal(v) || !isReal(a)) throw err('Polar form needs a real magnitude and a real angle');
        c.usedComplex = true;
        return C(v.re * cosR(a.re, c), v.re * sinR(a.re, c));
      }
      return v;
    }
    function parseUnary() {
      var k = peek();
      if (k && k.t === '-') { pos++; var v = parseUnary(); return C(-v.re || 0, -v.im || 0); }
      if (k && k.t === '+') { pos++; return parseUnary(); }
      return parsePower();
    }
    function parsePower() {
      var b = parsePostfix();
      if (eat('^')) { var e = parseUnary(); return fin(powC(b, e, c)); }
      return b;
    }
    function parsePostfix() {
      var v = parsePrimary(), k;
      while ((k = peek()) && (k.t === '!' || k.t === '%' || k.t === '\u00b0')) {
        pos++;
        if (k.t === '!') v = C(factorial(needReal('Factorial', v)));
        else if (k.t === '%') v = C(v.re / 100, v.im / 100);
        else v = C(v.re * (c.angle === 'DEG' ? 1 : c.angle === 'GRAD' ? 10 / 9 : PI / 180), v.im * (c.angle === 'DEG' ? 1 : c.angle === 'GRAD' ? 10 / 9 : PI / 180));
      }
      return v;
    }
    function parsePrimary() {
      var k = peek();
      if (!k) throw err('The expression is incomplete');
      if (k.t === 'num') { pos++; if (k.cx) c.usedComplex = true; return k.v; }
      if (k.t === '(') {
        pos++; var v = parseExpr();
        if (!eat(')')) throw err('Missing closing bracket )');
        return v;
      }
      if (k.t === 'id') {
        pos++;
        var name = ALIAS[k.v] || k.v;
        if (name === 'pi') return C(PI);
        if (name === 'e') return C(Math.E);
        var held = null, heldName = '';
        if (name === 'ans') { held = c.ans; heldName = 'answer'; }
        else if (name === 'mem') { held = c.mem; heldName = 'memory value'; }
        else if (c.vars && Object.prototype.hasOwnProperty.call(c.vars, name) && !RESERVED[name]) { held = c.vars[name]; heldName = "variable '" + name + "'"; }
        if (held) {
          if (!c.complex && held.im !== 0) throw err('The stored ' + heldName + ' is a complex number: switch to Engineering mode to use it');
          return held;
        }
        if (name === 'rnd' || name === 'rand') { c.volatile = true; if (eat('(')) { if (!eat(')')) throw err('rnd takes no arguments'); } return C(c.rand()); }
        if ((name === 'j' || name === 'i') && c.complex) { c.usedComplex = true; return J; }
        if (!FN.hasOwnProperty(name)) throw err("Unknown name '" + k.v + "'" + ((name === 'j' || name === 'i') ? ' (use Engineering mode for the imaginary unit)' : (name.length === 1 && 'kmgtunp'.indexOf(name) >= 0) ? (c.complex ? ' (an SI prefix must come straight after a number and end it, as in 4.7k or 100u)' : ' (SI prefixes such as k and u work in Engineering mode)') : ''));
        var spec = FN[name], args = [], callStart = pos - 1;
        if (eat('(')) {
          if (!eat(')')) {
            args.push(parseExpr());
            while (eat(',')) args.push(parseExpr());
            if (!eat(')')) throw err('Missing closing bracket )');
          }
        } else {
          if (!startsPrimary(peek()) && !(peek() && (peek().t === '-' || peek().t === '+'))) throw err("'" + k.v + "' needs a value");
          args.push(parseUnary());
        }
        if (args.length < spec[0] || args.length > spec[1]) throw err("'" + k.v + "' takes " + (spec[0] === spec[1] ? spec[0] : spec[0] + ' to ' + spec[1]) + ' value' + (spec[1] === 1 ? '' : 's'));
        var r = fin(spec[2](args, c));
        if (!isReal(r)) c.usedComplex = true;
        c.lastCall = { name: name, start: callStart, end: pos };
        return r;
      }
      if (k.t === ')') throw err("Unexpected closing bracket )");
      throw err("Unexpected '" + (k.t === '@' ? '\u2220' : k.t) + "'");
    }

    try {
      toks = tokenize(expr, c);
      if (!toks.length) return { ok: false, empty: true, error: '' };
      var v = parseExpr();
      if (pos < toks.length) {
        var k = toks[pos];
        throw err(k.t === ')' ? 'Unexpected closing bracket )' : "Unexpected '" + (k.t === 'num' ? 'number' : k.t === 'id' ? k.v : k.t === '@' ? '\u2220' : k.t) + "'");
      }
      v = fin(v);
      if (v.im !== 0) c.usedComplex = true;
      /* A result that is a single call to an angle or counting function is not in the unit the user chose for the result (arg(3+j4) is an angle, not ohms). */
      var lc = c.lastCall, unitless = !!lc && lc.start === 0 && lc.end === toks.length && UNITLESS.indexOf(lc.name) >= 0;
      return { ok: true, value: v, complex: c.usedComplex, volatile: c.volatile, unitless: unitless };
    } catch (e) {
      if (e && e.sciError) return { ok: false, error: e.sciError };
      return { ok: false, error: 'This expression could not be calculated', internal: true };
    }
  }

  /* ---------- output formatting ---------- */
  var SUP = { '-': '\u207b', '0': '\u2070', '1': '\u00b9', '2': '\u00b2', '3': '\u00b3', '4': '\u2074', '5': '\u2075', '6': '\u2076', '7': '\u2077', '8': '\u2078', '9': '\u2079' };
  function sup(n) { return String(n).split('').map(function (ch) { return SUP[ch]; }).join(''); }
  function stripZeros(s) { return s.indexOf('.') >= 0 ? s.replace(/0+$/, '').replace(/\.$/, '') : s; }
  function digitsOf(o) { var d = o && o.digits ? Math.round(o.digits) : 10; return Math.min(15, Math.max(3, d)); }
  var PFX_SYM = { 12: 'T', 9: 'G', 6: 'M', 3: 'k', 0: '', '-3': 'm', '-6': '\u00b5', '-9': 'n', '-12': 'p' };

  function expParts(v, d) {
    var s = Math.abs(v).toExponential(d - 1), m = /^(\d(?:\.\d+)?)e([+-]\d+)$/.exec(s);
    return { mant: stripZeros(m[1]), exp: parseInt(m[2], 10) };
  }
  function engParts(v, d) {
    var p = expParts(v, d), ee = Math.floor(p.exp / 3) * 3;
    var mant = Number((Math.abs(v) / Math.pow(10, ee)).toPrecision(d));
    if (mant >= 1000) { ee += 3; mant = Number((Math.abs(v) / Math.pow(10, ee)).toPrecision(d)); }
    return { mant: stripZeros(String(mant)), exp: ee };
  }
  function toFraction(x, maxDen) {
    var v = Math.abs(x), h1 = 1, h0 = 0, k1 = 0, k0 = 1, b = v;
    for (var i = 0; i < 40; i++) {
      var a = Math.floor(b), h2 = a * h1 + h0, k2 = a * k1 + k0;
      if (k2 > maxDen) break;
      h0 = h1; h1 = h2; k0 = k1; k1 = k2;
      if (h1 !== 0 && Math.abs(v - h1 / k1) <= 1e-10 * v) return { n: x < 0 ? -h1 : h1, d: k1 };
      var fr = b - a; if (fr < 1e-14) break; b = 1 / fr;
    }
    return null;
  }
  /* A real number as text. kind: auto, sci, eng, fraction. Returns the shown text. */
  function fmtReal(x, o) {
    o = o || {};
    if (x === 0 || Object.is(x, -0)) return '0';
    var d = digitsOf(o), kind = o.fmt || 'auto', neg = x < 0, body, v = Number(Math.abs(x).toPrecision(d));
    if (kind === 'fraction') {
      var f = toFraction(x, 9999);
      if (f) {
        if (f.d === 1) return String(f.n);
        var ab = Math.abs(f.n), whole = Math.floor(ab / f.d), rem = ab % f.d;
        return (f.n < 0 ? '-' : '') + ab + '/' + f.d + (whole > 0 ? ' (' + (f.n < 0 ? '-' : '') + whole + ' ' + rem + '/' + f.d + ')' : '');
      }
      kind = 'auto';
    }
    if (kind === 'sci') { var s = expParts(v, d); body = s.mant + '\u00d710' + sup(s.exp); }
    else if (kind === 'eng') { var e = engParts(v, d); body = e.mant + '\u00d710' + sup(e.exp); }
    else if (v >= 1e-6 && v < 1e12) body = String(v);
    else { var a = expParts(v, d); body = a.mant + '\u00d710' + sup(a.exp); }
    return (neg ? '-' : '') + body;
  }
  /* Plain machine-readable text for copying: 4.7e-5 style, no unicode. */
  function plainReal(x, o) {
    if (x === 0 || Object.is(x, -0)) return '0';
    return String(Number(x.toPrecision(digitsOf(o))));
  }
  /* 4700 -> "4.7 k". Null when the exponent is outside T..p. */
  function prefixed(x, o) {
    if (!isFinite(x) || x === 0) return null;
    var p = engParts(Number(Math.abs(x).toPrecision(digitsOf(o))), digitsOf(o));
    if (!PFX_SYM.hasOwnProperty(p.exp)) return null;
    return (x < 0 ? '-' : '') + p.mant + (PFX_SYM[p.exp] ? ' ' + PFX_SYM[p.exp] : '');
  }
  /* Remove rounding noise from a complex value before showing it: 1e-17 beside 5 is zero. */
  function clean(z) {
    var m = Math.max(Math.abs(z.re), Math.abs(z.im)), t = m * 1e-13;
    return C(Math.abs(z.re) <= t && z.re !== 0 ? 0 : z.re, Math.abs(z.im) <= t && z.im !== 0 ? 0 : z.im);
  }
  var ANG_SYM = { DEG: '\u00b0', RAD: ' rad', GRAD: ' grad' };
  function polarOf(z, o) {
    var k = angleFactor(o && o.angle), mag = cabs(z), ang = mag === 0 ? 0 : carg(z) / k;
    return { mag: mag, ang: ang, sym: ANG_SYM[o && (o.angle === 'RAD' || o.angle === 'GRAD') ? o.angle : 'DEG'] };
  }
  function unitTxt(o) { return o && o.unit ? ' ' + o.unit : ''; }
  function fmtRect(z, o) {
    var re = fmtReal(z.re, o), im = fmtReal(Math.abs(z.im), o);
    if (z.im === 0) return re;
    return re + ' ' + (z.im < 0 ? '-' : '+') + ' j' + im;
  }
  function fmtPolar(z, o) {
    var p = polarOf(z, o);
    return fmtReal(p.mag, o) + ' \u2220 ' + fmtReal(p.ang, o) + p.sym;
  }
  /* The main result text. form: 'rect' or 'polar' for complex values. */
  function format(z, o) {
    o = o || {};
    z = clean(z);
    if (z.im === 0) {
      var t = fmtReal(z.re, o), pre = o.fmt === 'eng' ? prefixed(z.re, o) : null;
      return { text: t + unitTxt(o), real: true, copy: plainReal(z.re, o), prefix: pre ? pre + (o.unit ? o.unit : '') : '' };
    }
    var rect = fmtRect(z, o) + unitTxt(o), polar = fmtPolar(z, o) + unitTxt(o), p = polarOf(z, o);
    return { text: o.form === 'polar' ? polar : rect, real: false, rect: rect, polar: polar,
      copy: plainReal(z.re, o) + (z.im < 0 ? '-' : '+') + 'j' + plainReal(Math.abs(z.im), o), copyPolar: plainReal(p.mag, o) + '\u2220' + plainReal(p.ang, o) + (o.angle === 'RAD' ? 'rad' : o.angle === 'GRAD' ? 'grad' : '\u00b0'), prefix: '' };
  }
  /* Rows, steps and drawing data for the phasor panel. Angles in the table follow the angle mode. */
  function describe(z, o) {
    o = o || {}; z = clean(z);
    var p = polarOf(z, o), u = o.unit ? ' ' + o.unit : '', sgn = z.im < 0 ? '-' : '+', d = digitsOf(o);
    var a = fmtReal(Math.abs(z.re), o), b = fmtReal(Math.abs(z.im), o), m = fmtReal(p.mag, o), th = fmtReal(p.ang, o);
    var rows = [
      ['Real component', fmtReal(z.re, o) + u],
      ['Imaginary component', (z.im < 0 ? '-' : '+') + fmtReal(Math.abs(z.im), o) + u],
      ['Magnitude', m + u],
      ['Phase angle', th + p.sym],
      ['Representation', m + ' \u2220 ' + th + p.sym]
    ];
    var steps = ['Rectangular form: Z = ' + fmtReal(z.re, o) + ' ' + sgn + ' j' + b + u];
    if (z.re !== 0 || z.im !== 0) {
      steps.push('Magnitude: |Z| = \u221a(' + a + '\u00b2 + ' + b + '\u00b2) = ' + m + u);
      steps.push('Phase angle: \u03b8 = atan2(' + fmtReal(z.im, o) + ', ' + fmtReal(z.re, o) + ')' + (z.re > 0 ? ' = tan\u207b\u00b9(' + b + '/' + a + ')' : '') + ' = ' + th + p.sym + (z.re < 0 ? ' (the real part is negative, so the angle is in the second or third quadrant)' : ''));
      steps.push('Polar form: Z = ' + m + ' \u2220 ' + th + p.sym + u);
    } else steps.push('Both parts are zero, so the magnitude is 0 and the angle is not defined (shown as 0).');
    return { rows: rows, steps: steps, re: z.re, im: z.im, mag: p.mag, angDeg: p.mag === 0 ? 0 : carg(z) * 180 / PI, digits: d };
  }

  function xml(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  /* Phasor diagram as an SVG string (equal scale on both axes). d comes from describe(). Colours are the site's CSS variables. */
  function phasorSvg(d, o) {
    o = o || {};
    var W = 320, H = 260, L = 36, R = 284, T = 20, B = 226;
    var re = d.re, im = d.im, xmin = Math.min(0, re), xmax = Math.max(0, re), ymin = Math.min(0, im), ymax = Math.max(0, im);
    var spanX = xmax - xmin, spanY = ymax - ymin, m = Math.max(spanX, spanY);
    if (!(m > 0)) { m = 1; spanX = spanY = 0; }
    var pad = 0.3 * m, s = Math.min((R - L) / (spanX + pad), (B - T) / (spanY + pad));
    var ox = L + (-xmin + pad / 2) * s + ((R - L) - (spanX + pad) * s) / 2;
    var oy = B - ((-ymin + pad / 2) * s + ((B - T) - (spanY + pad) * s) / 2);
    var px = ox + re * s, py = oy - im * s, f = function (n) { return n.toFixed(1); };
    var u = o.unit ? ' ' + o.unit : '', mag = d.mag, th = d.angDeg;
    var out = '<svg class="sc-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Phasor diagram: ' + xml(fmtReal(re, o) + (im < 0 ? ' - j' : ' + j') + fmtReal(Math.abs(im), o) + ', magnitude ' + fmtReal(mag, o) + u + ', angle ' + fmtReal(th, { digits: digitsOf(o) }) + ' degrees') + '" xmlns="http://www.w3.org/2000/svg" font-family="var(--body)" font-size="11">';
    out += '<rect x="' + L + '" y="' + T + '" width="' + (R - L) + '" height="' + (B - T) + '" fill="none" stroke="var(--line)"/>';
    out += '<line x1="' + L + '" y1="' + f(oy) + '" x2="' + R + '" y2="' + f(oy) + '" stroke="var(--muted)" stroke-width="1"/><line x1="' + f(ox) + '" y1="' + T + '" x2="' + f(ox) + '" y2="' + B + '" stroke="var(--muted)" stroke-width="1"/>';
    out += '<text x="' + (R - 4) + '" y="' + f(oy - 5) + '" text-anchor="end" fill="var(--muted)">Re</text><text x="' + f(ox + 5) + '" y="' + (T + 11) + '" fill="var(--muted)">Im (j)</text>';
    if (mag > 0) {
      if (re !== 0) out += '<line x1="' + f(px) + '" y1="' + f(py) + '" x2="' + f(px) + '" y2="' + f(oy) + '" stroke="var(--muted)" stroke-dasharray="3 3"/>';
      if (im !== 0) out += '<line x1="' + f(px) + '" y1="' + f(py) + '" x2="' + f(ox) + '" y2="' + f(py) + '" stroke="var(--muted)" stroke-dasharray="3 3"/>';
      var a = Math.atan2(-(py - oy), px - ox), hx = 9, hy = 4, ca = Math.cos(a), sa = Math.sin(a);
      var bx = px - hx * ca, by = py + hx * sa, lx = bx - hy * sa, ly = by - hy * ca, rx = bx + hy * sa, ry = by + hy * ca;
      out += '<line x1="' + f(ox) + '" y1="' + f(oy) + '" x2="' + f(bx) + '" y2="' + f(by) + '" stroke="var(--cyan)" stroke-width="2.5"/><polygon points="' + f(px) + ',' + f(py) + ' ' + f(lx) + ',' + f(ly) + ' ' + f(rx) + ',' + f(ry) + '" fill="var(--cyan)"/>';
      var ra = Math.min(30, 0.45 * mag * s), ang = Math.atan2(im, re);
      if (im !== 0 && ra > 8) {
        out += '<path d="M ' + f(ox + ra) + ' ' + f(oy) + ' A ' + f(ra) + ' ' + f(ra) + ' 0 0 ' + (ang > 0 ? 0 : 1) + ' ' + f(ox + ra * Math.cos(ang)) + ' ' + f(oy - ra * Math.sin(ang)) + '" fill="none" stroke="var(--gold)" stroke-width="2"/>';
        var tx = ox + (ra + 8) * Math.cos(ang / 2), ty = oy - (ra + 8) * Math.sin(ang / 2);
        out += '<text x="' + f(tx) + '" y="' + f(ty + 4) + '" fill="var(--ink)" text-anchor="' + (Math.cos(ang / 2) >= 0 ? 'start' : 'end') + '">\u03b8 = ' + xml(fmtReal(th, { digits: Math.min(digitsOf(o), 6) })) + '\u00b0</text>';
      }
      var lx2 = (ox + px) / 2, ly2 = (oy + py) / 2, off = im >= 0 ? 16 : -8;
      out += '<text x="' + f(lx2 + (re >= 0 ? 9 : -9)) + '" y="' + f(ly2 + off) + '" fill="var(--ink)" font-weight="600" text-anchor="' + (re >= 0 ? 'start' : 'end') + '">|Z| = ' + xml(fmtReal(mag, { digits: Math.min(digitsOf(o), 6) }) + u) + '</text>';
      out += '<circle cx="' + f(px) + '" cy="' + f(py) + '" r="3" fill="var(--cyan)"/>';
    } else out += '<circle cx="' + f(ox) + '" cy="' + f(oy) + '" r="3" fill="var(--cyan)"/>';
    return out + '</svg>';
  }

  return { evaluate: evaluate, format: format, describe: describe, phasorSvg: phasorSvg, fmtReal: fmtReal, prefixed: prefixed, functions: FNLIST, reserved: reserved, version: 2 };
});
