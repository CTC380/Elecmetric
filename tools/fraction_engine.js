/* Elecmetric Fraction Calculator: exact rational engine for Modes 01 to 06 (Fraction Arithmetic to Fractional Inch and Millimetre Converter). One file, no dependencies, no DOM.
   A fraction is a pair of BigInt (numerator, denominator), the denominator always positive and the pair always reduced by the greatest
   common divisor. No floating-point number is used anywhere, so results stay exact for any size of numerator and denominator.
   Required by tests/fraction_test.js and inlined into the Fraction Arithmetic page by tools/fraction_page.js. */
(function (root) {
  'use strict';
  var MAX_INPUT = 2000, MAX_DIGITS = 400, MAX_NODES = 200;
  function abs(x) { return x < 0n ? -x : x; }
  function gcd(a, b) { a = abs(a); b = abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function lcm(a, b) { return a === 0n || b === 0n ? 0n : abs(a) / gcd(a, b) * abs(b); }
  function make(n, d) { if (d === 0n) throw new Err('Denominator is zero.'); if (d < 0n) { n = -n; d = -d; } var g = gcd(n, d); if (g > 1n) { n /= g; d /= g; } return { n: n, d: d }; }
  function Err(m) { this.message = m; }
  function F(q) { return q.d === 1n ? String(q.n) : q.n + '/' + q.d; }
  function raw(n, d) { return d === 1n ? String(n) : n + '/' + d; }
  function add(a, b) { return make(a.n * b.d + b.n * a.d, a.d * b.d); }
  function sub(a, b) { return make(a.n * b.d - b.n * a.d, a.d * b.d); }
  function mul(a, b) { return make(a.n * b.n, a.d * b.d); }
  function div(a, b) { if (b.n === 0n) throw new Err('Division by zero: you cannot divide by 0.'); return make(a.n * b.d, a.d * b.n); }
  function cmp(a, b) { var x = a.n * b.d, y = b.n * a.d; return x < y ? -1 : x > y ? 1 : 0; }

  /* ---------- output forms ---------- */
  function mixed(q) {
    if (q.d === 1n || abs(q.n) < q.d) return { whole: 0n, n: q.n, d: q.d, text: F(q), isMixed: false };
    var neg = q.n < 0n, a = abs(q.n), w = a / q.d, r = a % q.d;
    if (r === 0n) return { whole: neg ? -w : w, n: 0n, d: 1n, text: String(neg ? -w : w), isMixed: false };
    return { whole: neg ? -w : w, n: r, d: q.d, text: (neg ? '-' : '') + w + ' ' + r + '/' + q.d, isMixed: true };
  }
  /* Decimal expansion by long division. exact: finite expansion; otherwise the repeating block is found by following remainders. */
  function decimal(q, maxDigits) {
    maxDigits = maxDigits || 40;
    var neg = q.n < 0n, a = abs(q.n), d = q.d, ip = a / d, rem = a % d, s = (neg && a !== 0n ? '-' : '') + ip;
    if (rem === 0n) return { text: s, exact: true, repeating: false, period: 0, digits: 0 };
    var t = d, twos = 0, fives = 0; while (t % 2n === 0n) { t /= 2n; twos++; } while (t % 5n === 0n) { t /= 5n; fives++; }
    var digs = [], seen = new Map(), at = -1, LIMIT = 5000;
    if (t === 1n) { while (rem !== 0n) { rem *= 10n; digs.push(String(rem / d)); rem %= d; } return { text: s + '.' + digs.join(''), exact: true, repeating: false, period: 0, digits: digs.length }; }
    while (rem !== 0n && digs.length < LIMIT) {
      var key = String(rem); if (seen.has(key)) { at = seen.get(key); break; }
      seen.set(key, digs.length); rem *= 10n; digs.push(String(rem / d)); rem %= d;
    }
    if (at >= 0) {
      var pre = digs.slice(0, at).join(''), per = digs.slice(at).join('');
      return { text: s + '.' + pre + '(' + per + ')', exact: false, repeating: true, period: per.length, preperiod: at, rounded: s + '.' + (pre + per.repeat(Math.ceil(maxDigits / per.length))).slice(0, maxDigits) + '\u2026', digits: digs.length };
    }
    return { text: s + '.' + digs.slice(0, maxDigits).join('') + '\u2026', exact: false, repeating: true, period: 0, longPeriod: true, digits: maxDigits };
  }
  function percent(q) { var p = make(q.n * 100n, q.d), r = decimal(p, 20); return { text: r.text + '%', exact: r.exact, repeating: r.repeating, period: r.period }; }

  /* ---------- parser ---------- */
  function tokenize(src) {
    var s = src.replace(/(\d)_(?=\d)/g, '$1 ').replace(/[\u2212\u2013\u2014]/g, '-').replace(/[\u00d7\u00b7*xX]/g, '*').replace(/[\u00f7:]/g, '\u00f7').replace(/[\u2044\u2215]/g, '/').replace(/\u00a0/g, ' ');
    var toks = [], i = 0, sp = false, m;
    while (i < s.length) {
      var c = s[i];
      if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { sp = true; i++; continue; }
      if ((m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i)))) {
        if (m[1].replace('.', '').length > MAX_DIGITS) throw new Err('A number has more than ' + MAX_DIGITS + ' digits. Use a shorter number.');
        toks.push({ t: 'num', v: m[1], dec: m[1].indexOf('.') >= 0, sp: sp, pos: i }); i += m[1].length; sp = false; continue;
      }
      if ('+-*\u00f7/()'.indexOf(c) >= 0) { toks.push({ t: c, sp: sp, pos: i }); i++; sp = false; continue; }
      if (c === ',') throw new Err('Commas are not used here. Write 1000 instead of 1,000, and a decimal point for decimals.');
      if (c === '^') throw new Err('Powers are not supported in this mode.');
      throw new Err('Unexpected character \u2018' + c + '\u2019 at position ' + (i + 1) + '. Use digits, / for the fraction bar, + \u2212 \u00d7 \u00f7 and brackets.');
    }
    return toks;
  }
  function lit(v, dec) { // exact value of an integer or decimal token
    if (!dec) return { n: BigInt(v), d: 1n };
    var p = v.split('.'), f = p[1] || '', digits = (p[0] || '0') + f; return make(BigInt(digits), 10n ** BigInt(f.length));
  }
  function parse(src) {
    var toks = tokenize(src), p = 0, nodes = 0;
    function peek() { return toks[p]; }
    function node(o) { if (++nodes > MAX_NODES) throw new Err('The expression is too long. Split it into smaller parts.'); return o; }
    function expect(t, msg) { if (!peek() || peek().t !== t) throw new Err(msg); return toks[p++]; }
    function number() {
      var tk = peek();
      if (!tk) throw new Err('The expression ends too early: a number is missing at the end.');
      if (tk.t !== 'num') throw new Err('Expected a number at position ' + (tk.pos + 1) + ' but found \u2018' + (tk.t === '\u00f7' ? '\u00f7' : tk.t) + '\u2019.');
      p++;
      var nx = peek();
      // mixed number: whole  numerator/denominator, the numerator separated from the whole by a space (or underscore)
      if (!tk.dec && nx && nx.t === 'num' && !nx.dec && nx.sp && toks[p + 1] && toks[p + 1].t === '/') {
        p++; p++; var sg = ''; if (peek() && (peek().t === '-' || peek().t === '+')) { sg = toks[p++].t === '-' ? '-' : ''; }
        var dn = peek(); if (!dn || dn.t !== 'num' || dn.dec) throw new Err('A mixed number needs a whole-number denominator, as in 2 1/3.');
        p++; var den = BigInt(dn.v); if (sg) den = -den; if (den === 0n) throw new Err('Denominator is zero in ' + tk.v + ' ' + nx.v + '/0.');
        var num = BigInt(nx.v); if (den < 0n) { den = -den; }
        var q = make(BigInt(tk.v) * den + num, den);
        return node({ t: 'lit', q: q, kind: 'mixed', src: tk.v + ' ' + nx.v + '/' + den, w: BigInt(tk.v), pn: num, pd: den });
      }
      if (nx && nx.t === '/') {
        p++; var s2 = false; if (peek() && (peek().t === '-' || peek().t === '+')) { s2 = toks[p++].t === '-'; }
        var dt = peek(); if (!dt || dt.t !== 'num') throw new Err('A denominator is missing after the fraction bar /.');
        p++; var a = lit(tk.v, tk.dec), b = lit(dt.v, dt.dec); if (s2) b = { n: -b.n, d: b.d };
        if (b.n === 0n) throw new Err('Denominator is zero in ' + tk.v + '/' + dt.v + '. A fraction cannot have 0 as its denominator.');
        var nxt = peek(); if (nxt && nxt.t === '/') throw new Err('Use \u00f7 (or a colon) to divide fractions, for example 1/2 \u00f7 1/4. A second / after a fraction is not read as division.');
        var qq = div(a, b), plain = !tk.dec && !dt.dec;
        return node({ t: 'lit', q: qq, kind: plain ? 'frac' : 'dec', src: tk.v + '/' + (s2 ? '-' : '') + dt.v, rn: plain ? BigInt(tk.v) : null, rd: plain ? (s2 ? -BigInt(dt.v) : BigInt(dt.v)) : null });
      }
      if (nx && nx.t === 'num' && nx.sp && !nx.dec && !tk.dec) throw new Err('Two numbers in a row at position ' + (nx.pos + 1) + '. For a mixed number write 2 1/3; otherwise put an operator between them.');
      return node({ t: 'lit', q: lit(tk.v, tk.dec), kind: tk.dec ? 'dec' : 'int', src: tk.v });
    }
    function atom() {
      var tk = peek();
      if (tk && tk.t === '(') { p++; var e = expr(); expect(')', 'A closing bracket ) is missing.'); return e; }
      return number();
    }
    function unary() {
      var tk = peek();
      if (tk && (tk.t === '-' || tk.t === '+')) {
        p++; var a = unary();
        if (tk.t === '+') return a;
        if (a.t === 'lit') { var q = { n: -a.q.n, d: a.q.d }; var o = {}; for (var k in a) o[k] = a[k]; o.q = q; o.neg = !a.neg; o.src = (a.neg ? a.src.replace(/^-/, '') : '-' + a.src); return o; }
        return node({ t: 'neg', a: a });
      }
      return atom();
    }
    function term() {
      var l = unary();
      while (peek() && (peek().t === '*' || peek().t === '\u00f7')) { var op = toks[p++].t; l = node({ t: 'op', op: op, a: l, b: unary() }); }
      return l;
    }
    function expr() {
      var l = term();
      while (peek() && (peek().t === '+' || peek().t === '-')) { var op = toks[p++].t; l = node({ t: 'op', op: op, a: l, b: term() }); }
      return l;
    }
    if (!toks.length) return null;
    var tree = expr();
    if (peek()) { var tk = peek(); throw new Err(tk.t === ')' ? 'A closing bracket ) has no matching opening bracket.' : 'Unexpected \u2018' + (tk.t === 'num' ? tk.v : tk.t) + '\u2019 at position ' + (tk.pos + 1) + '. Put an operator (+ \u2212 \u00d7 \u00f7) between the parts.'); }
    return tree;
  }

  /* ---------- evaluation with working ---------- */
  function sg(q) { return q.n < 0n ? '(' + F(q) + ')' : F(q); }
  function litSteps(nd, st) {
    var q = nd.q;
    if (nd.kind === 'mixed') {
      var imp = nd.w * nd.pd + nd.pn, sgn = nd.neg ? '-' : '';
      st.push(sgn + nd.w + ' ' + nd.pn + '/' + nd.pd + ' as an improper fraction: whole \u00d7 denominator + numerator = ' + nd.w + ' \u00d7 ' + nd.pd + ' + ' + nd.pn + ' = ' + imp + ', so ' + sgn + imp + '/' + nd.pd + (gcd(imp, nd.pd) > 1n ? ' = ' + F(q) + ' in lowest terms' : '') + '.');
    } else if (nd.kind === 'dec') {
      var m = /^-?(\d*)\.?(\d*)$/.exec(nd.src.replace(/\s/g, ''));
      if (m && nd.src.indexOf('/') < 0) { var f = m[2] || '', un = BigInt((m[1] || '0') + f), dn = 10n ** BigInt(f.length); st.push(nd.src + ' = ' + (nd.neg ? '-' : '') + un + '/' + dn + (gcd(un, dn) > 1n ? ' = ' + F(q) + ' in lowest terms' : '') + ' (a decimal is a fraction over a power of 10).'); }
      else st.push(nd.src + ' = ' + F(q) + ' (decimal parts converted to exact fractions).');
    } else if (nd.kind === 'frac') {
      var g = gcd(nd.rn, nd.rd);
      if (g > 1n) st.push(nd.src + ' is not in lowest terms: the greatest common divisor of ' + nd.rn + ' and ' + abs(nd.rd) + ' is ' + g + ', so it equals ' + F(q) + '.');
    }
  }
  function evalNode(nd, st) {
    if (nd.t === 'lit') { litSteps(nd, st); return nd.q; }
    if (nd.t === 'neg') { var v = evalNode(nd.a, st), r = { n: -v.n, d: v.d }; st.push('Negate: \u2212(' + F(v) + ') = ' + F(r) + '.'); return r; }
    var a = evalNode(nd.a, st), b = evalNode(nd.b, st), r2, A = F(a), B = sg(b);
    if (nd.op === '+' || nd.op === '-') {
      var L = lcm(a.d, b.d), x = a.n * (L / a.d), y = b.n * (L / b.d), tot = nd.op === '+' ? x + y : x - y; r2 = make(tot, L);
      var head = A + (nd.op === '+' ? ' + ' : ' \u2212 ') + B + ': ';
      if (a.d === b.d) st.push(head + 'the denominators are the same (' + a.d + '), so ' + (nd.op === '+' ? 'add' : 'subtract') + ' the numerators: ' + a.n + (nd.op === '+' ? ' + ' : ' \u2212 ') + sg({ n: b.n, d: 1n }) + ' = ' + tot + ', giving ' + raw(tot, L) + (gcd(tot, L) > 1n ? ' = ' + F(r2) + ' in lowest terms' : '') + '.');
      else st.push(head + 'the least common denominator of ' + a.d + ' and ' + b.d + ' is ' + L + '. Rewrite as ' + raw(x, L) + (nd.op === '+' ? ' + ' : ' \u2212 ') + (b.n < 0n ? '(' + raw(y, L) + ')' : raw(y, L)) + ' = ' + raw(tot, L) + (gcd(tot, L) > 1n ? ' = ' + F(r2) + ' in lowest terms' : '') + '.');
      return r2;
    }
    if (nd.op === '*') {
      var g1 = gcd(a.n, b.d), g2 = gcd(b.n, a.d); if (a.n === 0n || b.n === 0n) { g1 = 1n; g2 = 1n; }
      r2 = mul(a, b);
      var h = A + ' \u00d7 ' + B + ': ';
      if (g1 > 1n || g2 > 1n) {
        var n1 = a.n / g1, d2 = b.d / g1, n2 = b.n / g2, d1 = a.d / g2;
        st.push(h + 'cancel common factors first' + (g1 > 1n ? ' (' + g1 + ' between ' + a.n + ' and ' + b.d + ')' : '') + (g2 > 1n ? (g1 > 1n ? ' and' : '') + ' (' + g2 + ' between ' + b.n + ' and ' + a.d + ')' : '') + ', then multiply: (' + n1 + ' \u00d7 ' + sg({ n: n2, d: 1n }) + ') / (' + d1 + ' \u00d7 ' + d2 + ') = ' + F(r2) + '.');
      } else st.push(h + 'multiply the numerators and the denominators: (' + a.n + ' \u00d7 ' + sg({ n: b.n, d: 1n }) + ') / (' + a.d + ' \u00d7 ' + b.d + ') = ' + raw(a.n * b.n, a.d * b.d) + (r2.d === 1n && a.d * b.d !== 1n ? ' = ' + F(r2) : '') + '.');
      return r2;
    }
    // division
    if (b.n === 0n) throw new Err('Division by zero: ' + A + ' \u00f7 0 is undefined.');
    var rc = make(b.d, b.n); r2 = mul(a, rc);
    st.push(A + ' \u00f7 ' + B + ': dividing by a fraction is multiplying by its reciprocal. The reciprocal of ' + F(b) + ' is ' + F(rc) + ', so ' + A + ' \u00d7 ' + sg(rc) + ' = ' + F(r2) + '.');
    return r2;
  }


  /* ---------- Mode 02: simplifier ---------- */
  /* Euclid's algorithm with every division recorded: [a, b, q, r] meaning a = b x q + r. */
  function euclid(a, b) {
    a = abs(a); b = abs(b); var rows = [];
    if (a < b) { var t = a; a = b; b = t; }
    if (b === 0n) return { g: a, rows: rows };
    while (b !== 0n) { var q = a / b, r = a % b; rows.push([a, b, q, r]); a = b; b = r; }
    return { g: a, rows: rows };
  }
  /* Prime factorisation by trial division, only while the work stays small. Returns null when the number is too large to factor here. */
  function factor(n, budget) {
    n = abs(n); budget = budget || 2000000; if (n < 2n) return n === 1n ? [] : null;
    var out = [], p = 2n, steps = 0;
    function put(x) { if (out.length && out[out.length - 1][0] === x) out[out.length - 1][1]++; else out.push([x, 1]); }
    while (n % 2n === 0n) { put(2n); n /= 2n; }
    p = 3n;
    while (p * p <= n) {
      if (++steps > budget) return null;
      while (n % p === 0n) { put(p); n /= p; }
      p += 2n;
    }
    if (n > 1n) put(n);
    return out;
  }
  function fstr(f) { return f.map(function (x) { return x[1] > 1 ? x[0] + '^' + x[1] : String(x[0]); }).join(' \u00d7 '); }
  function dstr(s) { return s; }
  function intOf(s, name) { // an integer, or a plain decimal, from a text field: returns { n, k } meaning n / 10^k
    s = String(s == null ? '' : s).trim().replace(/[\u2212\u2013\u2014]/g, '-').replace(/\u00a0/g, ' ');
    if (!s) throw new Err('The ' + name + ' is empty.');
    if (/,/.test(s)) throw new Err('Commas are not used here. Write 1000 instead of 1,000, and a decimal point for decimals.');
    var m = /^([+-]?)(\d*)\.?(\d*)$/.exec(s); if (!m || (m[2] + m[3]).length === 0) throw new Err('The ' + name + ' \u2018' + s.slice(0, 30) + '\u2019 is not a number. Use digits, with a point for a decimal.');
    if ((m[2] + m[3]).length > MAX_DIGITS) throw new Err('The ' + name + ' has more than ' + MAX_DIGITS + ' digits.');
    var f = m[3] || '', v = BigInt((m[2] || '0') + f); if (m[1] === '-') v = -v;
    return { n: v, k: f.length, dec: f.length > 0 };
  }
  /* simplify({ num, den }) or simplify({ expr: '18/24' }) -> lowest terms with the working */
  function simplify(o) {
    o = o || {}; var N, D, ns, ds;
    try {
      if (o.expr != null && o.num == null && o.den == null) {
        var src = String(o.expr).trim(); if (!src) return { ok: false, empty: true, error: '' };
        if (src.length > MAX_INPUT) return { ok: false, error: 'The input is longer than ' + MAX_INPUT + ' characters.' };
        var s2 = src.replace(/[\u2044\u2215]/g, '/'), parts = s2.split('/');
        if (parts.length === 1) { ns = parts[0]; ds = '1'; } else if (parts.length === 2) { ns = parts[0]; ds = parts[1]; }
        else throw new Err('Enter one fraction such as 18/24. To work with several fractions use the Fraction Arithmetic mode.');
        if (/\s/.test(ns.trim())) { // a mixed number such as 2 6/8
          if (parts.length === 1) throw new Err('Two numbers with a space between them need a fraction bar. A mixed number is written like 2 6/8.');
          var mm = /^\s*([-+]?)\s*(\d+)\s+(\d+)\s*$/.exec(ns.replace(/\u2212/g, '-'));
          if (!mm || /\./.test(ns) || /\./.test(ds)) throw new Err('A mixed number is written like 2 6/8, whole numbers only.');
          var den0 = BigInt(ds.trim() || '0'); if (den0 === 0n) throw new Err('A fraction cannot have 0 as its denominator.');
          var t0 = BigInt(mm[2]) * den0 + BigInt(mm[3]); if (mm[1] === '-') t0 = -t0;
          return finish(t0, den0, 0, 0, { mixedFrom: (mm[1] === '-' ? '-' : '') + mm[2] + ' ' + mm[3] + '/' + ds.trim(), whole: BigInt(mm[2]), pn: BigInt(mm[3]), neg: mm[1] === '-' });
        }
      } else { ns = o.num; ds = o.den; }
      N = intOf(ns, 'numerator'); D = intOf(ds, 'denominator');
    } catch (e) { if (e instanceof Err) return { ok: false, error: e.message }; throw e; }
    if (D.n === 0n) return { ok: false, error: 'The denominator is 0. A fraction cannot have 0 as its denominator, so it cannot be simplified.' };
    return finish(N.n, D.n, N.k, D.k, null);
  }
  function finish(n, d, kn, kd, mx) {
    var st = [], n0 = n, d0 = d, scaled = null;
    if (mx) st.push(mx.mixedFrom + ' as an improper fraction: whole \u00d7 denominator + numerator = ' + mx.whole + ' \u00d7 ' + d + ' + ' + mx.pn + ' = ' + abs(n) + ', so ' + raw(n, d) + '.');
    if (kn || kd) { // decimals: multiply top and bottom by the same power of 10
      var k = Math.max(kn, kd), sn = n * 10n ** BigInt(k - kn), sd = d * 10n ** BigInt(k - kd);
      st.push('The numerator or denominator is a decimal. Multiply both by 10^' + k + ' (' + (10n ** BigInt(k)) + ') to get whole numbers: ' + raw(sn, sd) + '. The value does not change.'); scaled = { k: k }; n = sn; d = sd;
    }
    if (d < 0n) { st.push('The denominator ' + d + ' is negative. Move the sign to the numerator: ' + raw(n, d) + ' = ' + raw(-n, -d) + '.'); n = -n; d = -d; }
    var neg = n < 0n, a = abs(n), ex = euclid(a, d), g = ex.g, res;
    if (a === 0n) {
      st.push('The numerator is 0, so the value is 0. Every number divides 0, and gcd(0, ' + d + ') = ' + d + ', which gives 0/' + d + ' = 0/1.');
      return pack(0n, 1n, n0, d0, d, [], null, null, st, scaled, mx);
    }
    var gStep = 'Greatest common divisor by the Euclidean algorithm (divide, then repeat with the divisor and the remainder until the remainder is 0):';
    var rows = ex.rows;
    st.push(gStep + ' ' + rows.slice(0, 40).map(function (r) { return r[0] + ' = ' + r[1] + ' \u00d7 ' + r[2] + ' + ' + r[3]; }).join('; ') + (rows.length > 40 ? '; \u2026 (' + (rows.length - 40) + ' more divisions)' : '') + '. The remainder reaches 0, and the last divisor, ' + g + ', is the greatest common divisor.');
    var fa = factor(a), fb = factor(d), fg = null;
    var common = null;
    if (fa && fb) {
      st.push(abs(n) + ' = ' + (a === 1n ? '1' : fstr(fa)) + '; ' + d + ' = ' + (d === 1n ? '1' : fstr(fb)) + '. The common prime factors give the greatest common divisor.');
      common = []; fa.forEach(function (x) { fb.forEach(function (y) { if (x[0] === y[0]) common.push([x[0], Math.min(x[1], y[1])]); }); });
    } else st.push('The numbers are too large to factor quickly here, so the Euclidean working above is used. It is exact for any size.');
    if (g === 1n) st.push('gcd(' + a + ', ' + d + ') = 1: the numerator and denominator share no common factor, so ' + raw(n, d) + ' is already in lowest terms.');
    else {
      st.push('gcd(' + a + ', ' + d + ') = ' + g + '. Divide the numerator and the denominator by ' + g + ': ' + n + ' \u00f7 ' + g + ' = ' + (n / g) + ' and ' + d + ' \u00f7 ' + g + ' = ' + (d / g) + '.');
    }
    var rn = n / g, rd = d / g;
    st.push('Check: ' + n + ' \u00d7 ' + rd + ' = ' + (n * rd) + ' and ' + rn + ' \u00d7 ' + d + ' = ' + (rn * d) + '. The cross products are equal, so ' + raw(rn, rd) + ' has the same value as ' + raw(n, d) + '.');
    return pack(rn, rd, n0, d0, d, rows, fa && fb ? { fa: fa, fb: fb, common: common, n: a, d: d } : null, g, st, scaled, mx, n);
  }
  function pack(rn, rd, n0, d0, dd, rows, fac, g, st, scaled, mx, nn) {
    var q = make(rn, rd), m = mixed(q), eucl = rows || [];
    return { ok: true, n0: n0, d0: d0, g: g === null || g === undefined ? (rn === 0n ? dd : 1n) : g, num: q.n, den: q.d, value: q, frac: F(q), mixed: m, decimal: decimal(q), percent: percent(q), euclid: eucl, factors: fac, steps: st, already: (n0 === q.n && d0 === q.d && !scaled && !mx), changed: !(n0 === q.n && d0 === q.d && !scaled && !mx), wasMixed: !!mx, scaled: !!scaled };
  }

  /* calc({ expr }) -> { ok, empty, error, value:{n,d}, frac, mixed, decimal, percent, steps, ... } */
  function calc(o) {
    var src = String((o && o.expr) == null ? '' : o.expr);
    if (!src.trim()) return { ok: false, empty: true, error: '' };
    if (src.length > MAX_INPUT) return { ok: false, error: 'The input is longer than ' + MAX_INPUT + ' characters.' };
    try {
      var tree = parse(src); if (!tree) return { ok: false, empty: true, error: '' };
      var st = [], q = evalNode(tree, st), m = mixed(q);
      return { ok: true, value: q, frac: F(q), mixed: m, decimal: decimal(q), percent: percent(q), steps: st, isInteger: q.d === 1n, sign: q.n < 0n ? -1 : q.n === 0n ? 0 : 1, single: tree.t === 'lit' };
    } catch (e) {
      if (e instanceof Err) return { ok: false, error: e.message };
      throw e;
    }
  }
  /* ---------- Mode 03: decimal and fraction converter ---------- */
  function P10(k) { return 10n ** BigInt(k); }
  function floorDiv(n, d) { var q = n / d; if (n % d !== 0n && (n < 0n) !== (d < 0n)) q -= 1n; return q; }
  function ceilDiv(n, d) { return -floorDiv(-n, d); }
  /* Round to p decimal places, halves away from zero. exact: nothing was cut off. A result that rounds to zero carries no minus sign. */
  function roundDec(q, p) {
    var a = abs(q.n), v = a * P10(p), fl = (2n * v + q.d) / (2n * q.d), s = String(fl);
    if (p > 0) { while (s.length < p + 1) s = '0' + s; s = s.slice(0, s.length - p) + '.' + s.slice(s.length - p); }
    return { text: (q.n < 0n && fl !== 0n ? '-' : '') + s, exact: v % q.d === 0n };
  }
  /* Scientific notation with sig significant digits (round half up), trailing zeros dropped: 1.756e-13. */
  function sci(q, sig) {
    if (q.n === 0n) return '0';
    var a = abs(q.n), d = q.d, e = String(a).length - String(d).length;
    if (e >= 0 ? a < d * P10(e) : a * P10(-e) < d) e--;
    var sh = sig - 1 - e, num = sh >= 0 ? a * P10(sh) : a, den = sh >= 0 ? d : d * P10(-sh), m = (2n * num + den) / (2n * den);
    if (m >= P10(sig)) { m /= 10n; e++; }
    var ds = String(m).replace(/0+$/, '') || '0';
    return (q.n < 0n ? '-' : '') + ds[0] + (ds.length > 1 ? '.' + ds.slice(1) : '') + 'e' + e;
  }
  /* Closest fraction whose denominator is at most M (continued-fraction convergents and the best semiconvergent), the same rule as Python's Fraction.limit_denominator. */
  function limitDen(q, M) {
    var neg = q.n < 0n, n = abs(q.n), d = q.d; if (d <= M) return q;
    var p0 = 0n, q0 = 1n, p1 = 1n, q1 = 0n, N = n, D = d;
    for (;;) {
      var a = N / D, q2 = q0 + a * q1; if (q2 > M) break;
      var np = p0 + a * p1; p0 = p1; q0 = q1; p1 = np; q1 = q2; var t = N - a * D; N = D; D = t;
    }
    var k = (M - q0) / q1, b1 = make(p0 + k * p1, q0 + k * q1), b2 = make(p1, q1), x = make(n, d), e1 = sub(b1, x), e2 = sub(b2, x);
    var r = cmp({ n: abs(e2.n), d: e2.d }, { n: abs(e1.n), d: e1.d }) <= 0 ? b2 : b1;
    return make(neg ? -r.n : r.n, r.d);
  }
  /* Fraction with the smallest denominator inside the closed interval [lo, hi] (lo <= hi), by continued fractions. */
  function simplestIn(lo, hi) {
    var terms = [], a = lo, b = hi;
    for (;;) {
      var c = ceilDiv(a.n, a.d);
      if (cmp({ n: c, d: 1n }, b) <= 0) { terms.push(c); break; }
      var f = c - 1n; terms.push(f);
      var na = make(b.d, b.n - f * b.d), nb = make(a.d, a.n - f * a.d); a = na; b = nb;
    }
    var r = { n: terms[terms.length - 1], d: 1n };
    for (var i = terms.length - 2; i >= 0; i--) r = make(terms[i] * r.n + r.d, r.n);
    return r;
  }
  /* A typed decimal with k >= 3 places may be a rounded repeating decimal. Returns the fraction with the smallest denominator that rounds to it at k places
     (denominator squared times 100 at most 10^k, so the match is not a coincidence), or null. */
  function approxFor(x, k) {
    if (k < 3 || x.n === 0n) return null;
    var neg = x.n < 0n, ax = { n: abs(x.n), d: x.d }, h = make(1n, 2n * P10(k)), eps = make(1n, 4n * P10(2 * k));
    var r = simplestIn(sub(ax, h), sub(add(ax, h), eps));
    if (r.d * r.d * 100n > P10(k) || cmp(r, ax) === 0) return null;
    return make(neg ? -r.n : r.n, r.d);
  }
  function digitsOk(s) { if (s.length > MAX_DIGITS) throw new Err('A number has more than ' + MAX_DIGITS + ' digits. Use a shorter number.'); }
  var BAD = 'Type a decimal such as 0.125, a repeating decimal such as 0.(3), a fraction such as 3/8, a mixed number such as 2 1/3, or a percentage such as 37.5%.';
  var DENZ = 'The denominator is 0. A fraction cannot have 0 as its denominator.';
  /* One number in any of the accepted forms -> { q, kind, pct, base, ... } */
  function parseConv(src) {
    var s = src.replace(/[−–—]/g, '-').replace(/[⁄∕]/g, '/').replace(/ /g, ' ').trim(), pct = false, info = {}, q, kind, i;
    if (/,/.test(s)) throw new Err('Commas are not used here. Write 1000 instead of 1,000, and a decimal point for decimals.');
    if (/\.\.|…/.test(s)) throw new Err('Dots after the digits are not read as a repeating decimal. Put the repeating digits in brackets instead, as in 0.(3).');
    if ((i = s.indexOf('%')) >= 0) {
      if (i !== s.length - 1) throw new Err('A percent sign % is written once, after the number, as in 37.5%.');
      s = s.slice(0, i).trim(); if (!s) throw new Err('A number is missing before the percent sign.'); pct = true;
    }
    var neg = false, sm = /^([+-])\s*([\s\S]*)$/.exec(s); if (sm) { neg = sm[1] === '-'; s = sm[2]; }
    s = s.replace(/\s*\/\s*/g, '/');
    if (!s) throw new Err('A number is missing after the sign.');
    if (/[()]/.test(s)) {
      if (s.indexOf('/') >= 0) throw new Err('Brackets are only used for a repeating block, as in 0.(3). They cannot enclose a fraction here.');
      var rm = /^(\d*)\.(\d*)\((\d+)\)$/.exec(s);
      if (!rm) throw new Err(s.indexOf('.') < 0 && s.indexOf('(') >= 0 ? 'A repeating decimal needs a decimal point before the bracket, as in 0.(3).' : 'Write the repeating digits in one pair of brackets at the end, as in 0.(3) or 0.58(3).');
      var ip = rm[1], fp = rm[2], rp = rm[3]; digitsOk(ip + fp + rp);
      var a = fp.length, b = rp.length, big = BigInt('0' + ip + fp + rp), small = BigInt('0' + ip + fp);
      q = make(big - small, P10(a + b) - P10(a)); kind = 'repeating'; info.rep = { ip: ip, fp: fp, rp: rp, a: a, b: b, big: big, small: small };
    } else if (s.indexOf('/') >= 0) {
      var parts = s.split('/'); if (parts.length !== 2) throw new Err('Enter one fraction such as 3/8. Several operations belong in the Fraction Arithmetic mode.');
      var top = parts[0], bot = parts[1], bneg = false; if (/^[+-]/.test(bot)) { bneg = bot[0] === '-'; bot = bot.slice(1); }
      var mx = /^(\d+)\s+(\d+)$/.exec(top);
      if (mx) {
        if (!/^\d+$/.test(bot)) throw new Err(bot === '' ? 'A denominator is missing after the fraction bar /.' : 'A mixed number is written like 2 1/3, with whole numbers only.');
        digitsOk(mx[1]); digitsOk(mx[2]); digitsOk(bot);
        var den = BigInt(bot); if (den === 0n) throw new Err(DENZ);
        if (bneg) den = -den;
        var w = BigInt(mx[1]), nn = BigInt(mx[2]);
        q = make(w * abs(den) + nn, den); kind = 'mixed'; info.mx = { w: w, n: nn, d: abs(den) };
      } else {
        if (/\s/.test(top) || /\s/.test(bot)) throw new Err('A mixed number is written like 2 1/3, with whole numbers only. Two numbers with a space between them need a fraction bar.');
        if (!/\d/.test(top) || !/^\d*\.?\d*$/.test(top)) throw new Err(top === '' ? 'A numerator is missing before the fraction bar /.' : 'The numerator ‘' + top.slice(0, 30) + '’ is not a number. Use digits, with a point for a decimal.');
        if (!/\d/.test(bot) || !/^\d*\.?\d*$/.test(bot)) throw new Err(bot === '' ? 'A denominator is missing after the fraction bar /.' : 'The denominator ‘' + bot.slice(0, 30) + '’ is not a number. Use digits, with a point for a decimal.');
        digitsOk(top.replace('.', '')); digitsOk(bot.replace('.', ''));
        var A = lit(top, top.indexOf('.') >= 0), B = lit(bot, bot.indexOf('.') >= 0);
        if (B.n === 0n) throw new Err(DENZ);
        if (bneg) B = { n: -B.n, d: B.d };
        q = div(A, B); kind = 'fraction'; info.fr = { top: top, bot: (bneg ? '-' : '') + bot, plain: top.indexOf('.') < 0 && bot.indexOf('.') < 0, A: A, B: B };
      }
    } else {
      if (/\s/.test(s)) throw new Err(/^\d+\s+\d+$/.test(s) ? 'Two numbers with a space between them need a fraction bar. A mixed number is written like 2 1/3.' : 'There is a space inside a number. ' + BAD);
      var em = /^(\d*)(?:\.(\d*))?[eE]([+-]?\d+)$/.exec(s), pm = /^(\d*)(?:\.(\d*))?$/.exec(s), m = em || pm;
      if (!m || !/\d/.test((m[1] || '') + (m[2] || ''))) throw new Err(/^[+-]/.test(s) ? 'Use one sign only, at the start.' : 'Unexpected input ‘' + s.slice(0, 30) + '’. ' + BAD);
      var i2 = m[1] || '', f2 = m[2] || ''; digitsOk(i2 + f2);
      var base = make(BigInt('0' + i2 + f2), P10(f2.length));
      if (em) {
        var es = em[3].replace(/^[+-]/, '').replace(/^0+/, ''); if (es.length > 3 || +es > 300) throw new Err('The exponent must be between −300 and 300.');
        var ex = (em[3][0] === '-' ? -1 : 1) * (+es || 0);
        q = ex >= 0 ? make(base.n * P10(ex), base.d) : make(base.n, base.d * P10(-ex)); kind = q.d === 1n ? 'integer' : 'decimal'; info.sci = { ip: i2, fp: f2, ex: ex };
      } else { q = base; kind = f2.length ? 'decimal' : 'integer'; info.dec = { ip: i2, fp: f2, k: f2.length }; }
    }
    if (neg) q = { n: -q.n, d: q.d };
    var out = { q: q, base: q, kind: kind, pct: pct, info: info, neg: neg };
    if (pct) out.q = make(q.n, q.d * 100n);
    return out;
  }
  /* Long division of |n| by d, every row recorded: [remainder, remainder x 10, digit, new remainder]. Stops when the remainder is 0, when a remainder comes back (cycleAt = the row where the block starts), or after CAP rows. */
  function longDiv(q) {
    var a = abs(q.n), d = q.d, rem = a % d, rows = [], seen = new Map(), CAP = 60, cycleAt = -1, done = false, cut = false;
    for (;;) {
      if (rem === 0n) { done = true; break; }
      var key = String(rem); if (seen.has(key)) { cycleAt = seen.get(key); break; }
      if (rows.length >= CAP) { cut = true; break; }
      seen.set(key, rows.length); var r10 = rem * 10n; rows.push([rem, r10, r10 / d, r10 % d]); rem = r10 % d;
    }
    return { whole: a / d, rows: rows, cycleAt: cycleAt, done: done, cut: cut };
  }
  function pow10name(k) { return k === 1 ? '10' : k === 2 ? '100' : k === 3 ? '1000' : '10^' + k; }
  function convSteps(P, r) {
    var st = [], q = P.q, b = P.base, I = P.info, dig = function (x) { return F(x); }, nm = function (x) { return x.n < 0n ? '−' + F({ n: -x.n, d: x.d }) : F(x); };
    var sgn = P.neg ? '-' : '';
    if (I.dec) {
      var k = I.dec.k, digs = (I.dec.ip + I.dec.fp).replace(/^0+(?=\d)/, ''), nn = BigInt('0' + I.dec.ip + I.dec.fp), dd = P10(k);
      if (k === 0) st.push('The whole number ' + sgn + I.dec.ip + ' is itself a fraction with denominator 1: ' + sgn + nn + '/1.');
      else {
        st.push('The decimal ' + sgn + (I.dec.ip || '0') + '.' + I.dec.fp + ' has ' + k + (k === 1 ? ' digit' : ' digits') + ' after the decimal point, so write the digits as a whole number over ' + pow10name(k) + ': ' + sgn + nn + '/' + dd + '.');
        var g = gcd(nn, dd);
        if (nn === 0n) st.push('The numerator is 0, so the value is 0.');
        else if (g > 1n) st.push('The greatest common divisor of ' + nn + ' and ' + dd + ' is ' + g + '. Divide the top and the bottom by ' + g + ': ' + sgn + nn / g + '/' + dd / g + '.');
        else st.push('The greatest common divisor of ' + nn + ' and ' + dd + ' is 1, so ' + sgn + nn + '/' + dd + ' is already in lowest terms.');
      }
    } else if (I.sci) {
      st.push('Scientific notation: ' + sgn + (I.sci.ip || '0') + (I.sci.fp ? '.' + I.sci.fp : '') + ' × 10^' + I.sci.ex + ' moves the decimal point ' + Math.abs(I.sci.ex) + (Math.abs(I.sci.ex) === 1 ? ' place ' : ' places ') + (I.sci.ex >= 0 ? 'to the right' : 'to the left') + '.');
      st.push('As an exact fraction in lowest terms: ' + F(b) + '.');
    } else if (I.rep) {
      var R = I.rep, a = R.a, bl = R.b;
      st.push('Let x = ' + sgn + (R.ip || '0') + '.' + R.fp + '(' + R.rp + '). There are ' + a + (a === 1 ? ' digit' : ' digits') + ' before the repeating block and the block ' + R.rp + ' has ' + bl + (bl === 1 ? ' digit' : ' digits') + '.');
      st.push('Multiply x by 10^' + (a + bl) + ' = ' + P10(a + bl) + ' to move one full block to the left of the point: ' + P10(a + bl) + 'x = ' + R.big + '.(' + R.rp + '). ' + (a === 0 ? 'The block already starts right after the point, so x = ' + R.small + '.(' + R.rp + ') is used as it is.' : 'Multiply x by 10^' + a + ' = ' + P10(a) + ' to move only the digits before the block: ' + P10(a) + 'x = ' + R.small + '.(' + R.rp + ').'));
      var coef = P10(a + bl) - P10(a), dif = R.big - R.small;
      st.push('Subtract. The repeating parts cancel: (' + P10(a + bl) + ' − ' + P10(a) + ')x = ' + R.big + ' − ' + R.small + ', so ' + coef + 'x = ' + dif + ', x = ' + raw(dif, coef) + (gcd(dif, coef) > 1n ? ' = ' + F(b.n < 0n ? { n: -b.n, d: b.d } : b) + ' in lowest terms' : '') + '.' + (/^9+$/.test(R.rp) ? ' A block of nines is exactly the next whole step up: 0.(9) is exactly 1, not just close to it.' : '') + (/^0+$/.test(R.rp) ? ' A block of zeros adds nothing, so the decimal ends.' : ''));
      if (P.neg) st.push('The number was negative, so the fraction is ' + nm(b) + '.');
    } else if (I.mx) {
      var imp = I.mx.w * I.mx.d + I.mx.n;
      st.push(sgn + I.mx.w + ' ' + I.mx.n + '/' + I.mx.d + ' as an improper fraction: whole × denominator + numerator = ' + I.mx.w + ' × ' + I.mx.d + ' + ' + I.mx.n + ' = ' + imp + ', so ' + sgn + imp + '/' + I.mx.d + (gcd(imp, I.mx.d) > 1n ? ' = ' + nm(b) + ' in lowest terms' : '') + '.');
    } else if (I.fr) {
      var f = I.fr;
      if (!f.plain) st.push('Decimals in a fraction are first made exact: ' + f.top + '/' + f.bot.replace(/^-/, '') + ' = ' + F(I.fr.A) + ' ÷ ' + F(I.fr.B.n < 0n ? { n: -I.fr.B.n, d: I.fr.B.d } : I.fr.B) + ' = ' + nm(b) + '.');
      var g2 = gcd(b.n, b.d), tn = BigInt(f.top.replace('.', '') || '0');
      if (f.plain) {
        var den0 = BigInt(f.bot), gg = gcd(tn, den0);
        if (f.bot[0] === '-') st.push('The denominator is negative. Move the sign to the numerator: ' + sgn + tn + '/' + f.bot + ' = ' + nm(make(P.neg ? -tn : tn, den0)) + '.');
        if (gg > 1n && tn !== 0n) st.push(f.top + '/' + f.bot.replace(/^-/, '') + ' is not in lowest terms: the greatest common divisor of ' + tn + ' and ' + abs(den0) + ' is ' + gg + ', so it equals ' + nm(b) + '.');
        else if (!f.bot.startsWith('-')) st.push(f.top + '/' + f.bot + ' is already a fraction' + (tn === 0n ? ': 0 over anything is 0.' : ' in lowest terms.'));
      }
    } else st.push('A whole number is a fraction with denominator 1: ' + sgn + b.n + '/1.');
    if (P.pct) st.push('A percentage means "per 100": ' + (I.dec || I.sci || I.rep ? '' : '') + nm(b) + ' ÷ 100 = ' + nm(q) + '.');
    /* decimal form */
    var d = r.decimal;
    if (q.d === 1n) st.push('The value is a whole number, so the decimal is ' + d.text + '.');
    else {
      var t = q.d, v2 = 0, v5 = 0; while (t % 2n === 0n) { t /= 2n; v2++; } while (t % 5n === 0n) { t /= 5n; v5++; }
      var fac = factor(q.d, 200000), fs = fac && !(fac.length === 1 && fac[0][1] === 1) ? q.d + ' = ' + fstr(fac) : null, prime = fac && fac.length === 1 && fac[0][1] === 1, base2 = (v2 ? '2' + (v2 > 1 ? '^' + v2 : '') : '') + (v2 && v5 ? ' × ' : '') + (v5 ? '5' + (v5 > 1 ? '^' + v5 : '') : '');
      if (d.exact) st.push('Decimal: divide ' + abs(q.n) + ' by ' + q.d + '. The denominator ' + (fs ? fs : q.d) + ' has no prime factor except 2 and 5, so the decimal ends after ' + Math.max(v2, v5) + (Math.max(v2, v5) === 1 ? ' digit' : ' digits') + ': ' + d.text + '.');
      else st.push('Decimal: divide ' + abs(q.n) + ' by ' + q.d + '. The denominator ' + (fs ? fs : q.d) + (fs || prime ? '' : ' (after taking out ' + (base2 || 'no factors of 2 or 5') + ', what is left is ' + t + ')') + ' has a prime factor other than 2 and 5, so the decimal never ends; it repeats: ' + d.text + (d.period ? ' (' + (d.preperiod || 0) + (d.preperiod === 1 ? ' digit' : ' digits') + ' before the block, block length ' + d.period + ')' : ' (the block is longer than the digits shown)') + '.');
    }
    st.push('Percentage: multiply by 100. ' + F(q) + ' × 100 = ' + r.percent.text + (r.percent.exact ? '.' : ', a repeating percentage.'));
    if (!r.rounded.exact) st.push('Rounded to ' + r.places + (r.places === 1 ? ' decimal place' : ' decimal places') + ' the decimal is ' + r.rounded.text + '. This is an approximation; the exact value is ' + (d.repeating ? d.text : F(q)) + '.');
    return st;
  }
  /* convert({ expr, places, maxDen }) -> one value in every form, with the working. */
  function convert(o) {
    o = o || {}; var src = String(o.expr == null ? '' : o.expr);
    if (!src.trim()) return { ok: false, empty: true, error: '' };
    if (src.length > MAX_INPUT) return { ok: false, error: 'The input is longer than ' + MAX_INPUT + ' characters.' };
    var pl = 6, M = null, ps = o.places == null ? '' : String(o.places).trim(), ms = o.maxDen == null ? '' : String(o.maxDen).trim();
    if (ps !== '') { if (!/^\d{1,2}$/.test(ps) || +ps > 50) return { ok: false, field: 'places', error: 'Decimal places must be a whole number from 0 to 50.' }; pl = +ps; }
    if (ms !== '') { if (!/^\d{1,15}$/.test(ms) || /^0+$/.test(ms)) return { ok: false, field: 'maxDen', error: 'The largest denominator must be a whole number of 1 or more, with up to 15 digits.' }; M = BigInt(ms); }
    var P;
    try { P = parseConv(src); } catch (e) { if (e instanceof Err) return { ok: false, error: e.message }; throw e; }
    var q = P.q, r = { ok: true, src: src.trim(), kind: P.kind, pct: P.pct, headline: !P.pct && (P.kind === 'fraction' || P.kind === 'mixed') ? 'decimal' : 'fraction', value: q, frac: F(q), isInteger: q.d === 1n, sign: q.n < 0n ? -1 : q.n === 0n ? 0 : 1, mixed: mixed(q), decimal: decimal(q), percent: percent(q), places: pl };
    r.rounded = roundDec(q, pl); r.roundedPct = roundDec(make(q.n * 100n, q.d), pl);
    var ap = !P.pct && P.info.dec ? approxFor(q, P.info.dec.k) : null; r.approx = ap ? { frac: F(ap), n: ap.n, d: ap.d } : null;
    r.limit = null;
    if (M !== null) { var lm = limitDen(q, M), df = sub(q, lm); r.limit = { max: String(M), n: lm.n, d: lm.d, frac: F(lm), exact: df.n === 0n, diff: sci(df, 4), diffSign: df.n < 0n ? -1 : df.n === 0n ? 0 : 1 }; }
    r.division = r.headline === 'decimal' && q.d > 1n ? longDiv(q) : null;
    r.steps = convSteps(P, r);
    return r;
  }
  /* ---------- Mode 04: mixed numbers ---------- */
  /* One or two numbers, each a whole number, a fraction or a mixed number (sign at the front only), and one operation. Decimals and percentages
     belong to Mode 03, longer expressions and brackets to Mode 01. The working reuses the Mode 01 text for the improper-fraction conversion and the
     operation, then adds the improper-to-mixed division. */
  function mxClean(src) {
    return src.replace(/(\d)_(?=\d)/g, '$1 ').replace(/[\u2212\u2013\u2014]/g, '-').replace(/[\u00d7\u00b7*xX]/g, '*').replace(/[\u00f7:]/g, '\u00f7').replace(/[\u2044\u2215]/g, '/').replace(/\u00a0/g, ' ');
  }
  function mxOperand(txt, which) {
    var s = txt.trim(), HOW = 'Use a whole number, a fraction such as 3/4 or a mixed number such as 2 1/3.';
    if (!s) throw new Err('The ' + which + ' number is empty. ' + HOW);
    if (s.indexOf('.') >= 0) throw new Err('Decimals are not used in this mode. Convert the decimal to a fraction with the Decimal & Fraction Converter (Mode 03) and enter the fraction here.');
    if (s.indexOf(',') >= 0) throw new Err('Commas are not used here. Write 1000 instead of 1,000.');
    if (s.indexOf('%') >= 0) throw new Err('Percentages are not used in this mode. Convert the percentage with the Decimal & Fraction Converter (Mode 03).');
    var m = /^([+-])?\s*(?:(\d+)\s+(\d+)\s*\/\s*(\d+)|(\d+)\s*\/\s*(\d+)|(\d+))$/.exec(s);
    if (!m) {
      if (/\/\s*[+-]/.test(s)) throw new Err('Put the minus sign at the front of the number, as in \u22123/4, not after the fraction bar.');
      if (/^[+-]?\s*\d+\s+\d+$/.test(s)) throw new Err('Two numbers with a space between them need a fraction bar. A mixed number is written like 2 1/3.');
      if ((s.match(/\//g) || []).length > 1) throw new Err('A number can have only one fraction bar. Use \u00f7 or a colon to divide, and put one operation between two numbers.');
      throw new Err('Cannot read \u2018' + s.slice(0, 30) + '\u2019 as a number. ' + HOW);
    }
    for (var k = 2; k <= 7; k++) if (m[k] !== undefined && m[k].length > MAX_DIGITS) throw new Err('A number has more than ' + MAX_DIGITS + ' digits. Use a shorter number.');
    var neg = m[1] === '-', w = null, n, d, kind, text;
    if (m[2] !== undefined) { w = BigInt(m[2]); n = BigInt(m[3]); d = BigInt(m[4]); kind = 'mixed'; text = w + ' ' + n + '/' + d; }
    else if (m[5] !== undefined) { n = BigInt(m[5]); d = BigInt(m[6]); text = n + '/' + d; }
    else { n = BigInt(m[7]); d = 1n; kind = 'whole'; text = String(n); }
    if (d === 0n) throw new Err('Denominator is zero in ' + (neg ? '-' : '') + text + '. A fraction cannot have 0 as its denominator.');
    if (!kind) kind = n >= d ? 'improper' : 'proper';
    var top = w !== null ? w * d + n : n;
    return { q: make(neg ? -top : top, d), neg: neg, w: w, n: n, d: d, kind: kind, text: (neg ? '-' : '') + text, oddFrac: kind === 'mixed' && n >= d };
  }
  function mxNode(o) {
    var b = { t: 'lit', q: o.q, neg: o.neg, src: o.text };
    if (o.kind === 'mixed') { b.kind = 'mixed'; b.w = o.w; b.pn = o.n; b.pd = o.d; }
    else if (o.kind === 'whole') b.kind = 'int';
    else { b.kind = 'frac'; b.rn = o.n; b.rd = o.d; }
    return b;
  }
  function mxPub(o) {
    return { text: o.text, kind: o.kind, sign: o.neg ? '-' : '', w: o.kind === 'whole' ? String(o.n) : o.w === null ? '' : String(o.w), n: o.kind === 'whole' ? '' : String(o.n), d: o.kind === 'whole' ? '' : String(o.d), value: F(o.q) };
  }
  function mixedCalc(o) {
    var src = String((o && o.expr) == null ? '' : o.expr);
    if (!src.trim()) return { ok: false, empty: true, error: '' };
    if (src.length > MAX_INPUT) return { ok: false, error: 'The input is longer than ' + MAX_INPUT + ' characters.' };
    try {
      var s = mxClean(src);
      if (/\/\s*[+-]/.test(s)) throw new Err('Put the minus sign at the front of the number, as in \u22123/4, not after the fraction bar.');
      if (/[()]/.test(s)) throw new Err('Brackets are not used in this mode. For longer expressions and brackets use Fraction Arithmetic (Mode 01).');
      var i0 = -1, seen = false, c;
      for (var i = 0; i < s.length; i++) { c = s.charAt(i); if (/\d/.test(c)) seen = true; else if (seen && '+-*\u00f7'.indexOf(c) >= 0) { i0 = i; break; } }
      var A, B = null, op = null;
      if (i0 < 0) A = mxOperand(s, 'first');
      else {
        op = s.charAt(i0); var rest = s.slice(i0 + 1);
        if (!rest.trim()) throw new Err('A number is missing after the ' + (op === '-' ? '\u2212' : op === '*' ? '\u00d7' : op) + ' sign.');
        if (/[+\-*\u00f7]/.test(rest.replace(/^\s*[+-]/, ''))) throw new Err('Only one operation at a time here: two numbers and one operation sign. For longer expressions use Fraction Arithmetic (Mode 01).');
        A = mxOperand(s.slice(0, i0), 'first'); B = mxOperand(rest, 'second');
      }
      var st = [];
      [A, B].forEach(function (x) { if (x && x.oddFrac) st.push(x.text + ': the fraction part ' + x.n + '/' + x.d + ' is itself improper (the numerator is not smaller than the denominator). The number still means ' + x.w + ' + ' + x.n + '/' + x.d + '.'); });
      var q;
      if (B) q = evalNode({ t: 'op', op: op, a: mxNode(A), b: mxNode(B) }, st); else { q = A.q; litSteps(mxNode(A), st); }
      var m = mixed(q), neg = q.n < 0n, a = abs(q.n), kind = q.d === 1n ? 'whole' : a < q.d ? 'proper' : 'improper';
      if (kind === 'whole') st.push(B || A.kind !== 'whole' ? 'The result reduces to the whole number ' + F(q) + ': the numerator divides exactly by the denominator, so there is no fraction part.' : 'A whole number has no fraction part. As a fraction it is ' + F(q) + '/1.');
      else if (kind === 'proper') st.push('The result ' + F(q) + ' is a proper fraction: the numerator is smaller than the denominator, so there is no whole part and the mixed form is the fraction itself.');
      else st.push('Improper fraction to mixed number: divide the numerator by the denominator. ' + a + ' \u00f7 ' + q.d + ' = ' + (a / q.d) + ' remainder ' + (a % q.d) + ', so ' + a + '/' + q.d + ' = ' + (a / q.d) + ' ' + (a % q.d) + '/' + q.d + '.' + (neg ? ' The value is negative, so the minus sign goes in front of the whole mixed number: ' + m.text + '.' : ''));
      return { ok: true, mode: B ? 'op' : 'convert', op: op, a: mxPub(A), b: B ? mxPub(B) : null, value: q, frac: F(q), mixed: m, decimal: decimal(q), percent: percent(q), steps: st, isInteger: q.d === 1n, resultKind: kind, sign: q.n < 0n ? -1 : q.n === 0n ? 0 : 1 };
    } catch (e) {
      if (e instanceof Err) return { ok: false, error: e.message };
      throw e;
    }
  }

  /* ---------- Mode 05: advanced fraction and ratio tools ---------- */
  /* advCalc({ tool, expr, total }) with tool one of gcdlcm, lcd, compare, ratio, proportion. Whole-number lists are split on commas, semicolons and
     spaces; fractions on commas and semicolons only (a space belongs to a mixed number); ratio terms on colons or the word "to". Every value is
     read by the Mode 03 reader (parseConv), so decimals, mixed numbers and percentages work wherever a fraction does. */
  var AD_MAX = 20, AD_CMP = 12, AD_RATIO = 8;
  function adQ(item, idx) {
    try { return parseConv(item).q; } catch (e) { if (e instanceof Err) throw new Err('Item ' + idx + ' (\u2018' + item.slice(0, 30) + '\u2019): ' + e.message); throw e; }
  }
  function adList(src, min, max, what) {
    var parts = src.replace(/([,;])\s*\n\s*/g, '$1').replace(/\s*\n\s*/g, ',').split(/[,;]/).map(function (x) { return x.trim(); });
    while (parts.length > 1 && parts[parts.length - 1] === '') parts.pop();
    if (parts.some(function (x) { return x === ''; })) throw new Err('An item is empty. Separate the ' + what + ' with commas and leave nothing between two commas.');
    if (parts.length < min) throw new Err('Enter at least ' + min + ' ' + what + ', separated by commas.');
    if (parts.length > max) throw new Err('Enter at most ' + max + ' ' + what + '.');
    return parts;
  }
  function adEuclidText(a, b) {
    var r = euclid(a, b), rows = r.rows, t = rows.map(function (x) { return x[0] + ' = ' + x[2] + ' \u00d7 ' + x[1] + ' + ' + x[3]; });
    if (t.length > 8) t = t.slice(0, 3).concat(['\u2026 (' + t.length + ' divisions in all)', t[t.length - 1]]);
    return { g: r.g, text: t.join('; ') };
  }
  function adFactorMaps(nums) {
    if (nums.some(function (n) { return String(n).length > 15; })) return null;
    var fs = [];
    for (var i = 0; i < nums.length; i++) { var f = factor(nums[i], 300000); if (f === null) return null; fs.push(f); }
    return fs;
  }
  function adFactStr(map) {
    var ps = Object.keys(map).map(function (k) { return BigInt(k); }).sort(function (a, b) { return a < b ? -1 : a > b ? 1 : 0; });
    return ps.length ? ps.map(function (p) { var e = map[String(p)]; return e > 1 ? p + '^' + e : String(p); }).join(' \u00d7 ') : '1';
  }
  function adGcdLcm(src) {
    var items = src.trim().split(/[,;\s]+/).filter(Boolean), nums = [], neg = false;
    if (items.length < 2) throw new Err('Enter at least 2 whole numbers, separated by commas or spaces.');
    if (items.length > AD_MAX) throw new Err('Enter at most ' + AD_MAX + ' numbers.');
    items.forEach(function (s, i) {
      s = s.replace(/[\u2212\u2013\u2014]/g, '-');
      if (/^[+-]?\d*\.\d*$/.test(s) || s.indexOf('/') >= 0 || s.indexOf('%') >= 0) throw new Err('\u2018' + s.slice(0, 30) + '\u2019 is not a whole number. GCD and LCM need whole numbers. For fractions use the LCD tool.');
      if (!/^[+-]?\d+$/.test(s)) throw new Err('Cannot read \u2018' + s.slice(0, 30) + '\u2019 as a whole number.');
      if (s.replace(/^[+-]/, '').length > MAX_DIGITS) throw new Err('A number has more than ' + MAX_DIGITS + ' digits. Use a shorter number.');
      var v = BigInt(s);
      if (v === 0n) throw new Err('Zero is not allowed here: every number divides 0, so it has no useful GCD, and the LCM with 0 is 0 by convention. Enter whole numbers of 1 or more.');
      if (v < 0n) { neg = true; v = -v; }
      nums.push(v);
    });
    var st = [], n = nums.length, g = nums[0], l = nums[0], i;
    if (neg) st.push('Signs are ignored: the GCD and the LCM are taken of the absolute values, ' + nums.join(', ') + '.');
    for (i = 1; i < n; i++) {
      var e = adEuclidText(g, nums[i]);
      st.push((n === 2 ? 'Euclidean algorithm for gcd(' + g + ', ' + nums[i] + '): ' : 'gcd(' + g + ', ' + nums[i] + ') by the Euclidean algorithm: ') + e.text + '. The last non-zero remainder is ' + e.g + ', so gcd(' + g + ', ' + nums[i] + ') = ' + e.g + '.');
      g = e.g;
    }
    for (i = 1; i < n; i++) { var g2 = gcd(l, nums[i]), l2 = l / g2 * nums[i]; st.push('lcm(' + l + ', ' + nums[i] + ') = ' + l + ' \u00f7 gcd(' + l + ', ' + nums[i] + ') \u00d7 ' + nums[i] + ' = ' + l + ' \u00f7 ' + g2 + ' \u00d7 ' + nums[i] + ' = ' + l2 + '.'); l = l2; }
    if (n === 2) st.push('Check: GCD \u00d7 LCM = ' + g + ' \u00d7 ' + l + ' = ' + (g * l) + ' and ' + nums[0] + ' \u00d7 ' + nums[1] + ' = ' + (nums[0] * nums[1]) + '. For two numbers the two always agree.');
    st.push(g === 1n ? (n === 2 ? 'The GCD is 1, so the two numbers are coprime (relatively prime): they share no factor except 1, and their LCM is their product.' : 'The GCD is 1: no factor greater than 1 divides all of the numbers.') : 'Every number is divisible by ' + g + ', and ' + g + ' is the largest such number.');
    var fm = adFactorMaps(nums), table = null, fg = null, fl = null;
    if (fm) {
      var maps = fm.map(function (f) { var m = {}; f.forEach(function (x) { m[String(x[0])] = x[1]; }); return m; }), all = {};
      maps.forEach(function (m) { Object.keys(m).forEach(function (k) { all[k] = 1; }); });
      var mg = {}, ml = {};
      Object.keys(all).forEach(function (k) { var lo = Infinity, hi = 0; maps.forEach(function (m) { var e = m[k] || 0; if (e < lo) lo = e; if (e > hi) hi = e; }); if (lo > 0) mg[k] = lo; ml[k] = hi; });
      fg = adFactStr(mg); fl = adFactStr(ml);
      table = { title: 'Prime factorisation', head: ['Number', 'Prime factors'], rows: nums.map(function (x, j) { return [String(x), adFactStr(maps[j])]; }).concat([['GCD (lowest power of each shared prime)', fg + ' = ' + g], ['LCM (highest power of every prime)', fl + ' = ' + l]]) };
      st.push('Prime factors: the GCD takes the lowest power of each prime that all the numbers share (' + fg + ' = ' + g + ') and the LCM takes the highest power of every prime that appears (' + fl + ' = ' + l + ').');
    }
    return { ok: true, tool: 'gcdlcm', nums: nums.map(String), gcd: String(g), lcm: String(l), coprime: n === 2 && g === 1n, primes: fm ? { gcd: fg, lcm: fl } : null, big: 'GCD = ' + g + '   \u00b7   LCM = ' + l, results: [['Greatest common divisor (GCD)', String(g), ''], ['Least common multiple (LCM)', String(l), ''], ['How many numbers', String(n), '']], tables: table ? [table] : [], steps: st };
  }
  function adLcd(src) {
    var items = adList(src, 2, AD_MAX, 'fractions'), qs = items.map(function (s, i) { return adQ(s, i + 1); }), st = [], i;
    var ch = []; qs.forEach(function (q, j) { if (items[j] !== F(q)) ch.push(items[j] + ' = ' + F(q)); });
    st.push(ch.length ? 'Write every value as a fraction in lowest terms first: ' + ch.join('; ') + (ch.length < qs.length ? '; the others are already in lowest terms.' : '.') : 'Every fraction is already in lowest terms.');
    var dens = qs.map(function (q) { return q.d; });
    st.push('The denominators are ' + dens.join(', ') + '.');
    var L = dens[0];
    if (dens.every(function (d) { return d === 1n; })) st.push('Every value is a whole number, so the least common denominator is 1.');
    else {
      var parts = []; for (i = 1; i < dens.length; i++) { var l2 = lcm(L, dens[i]); parts.push('lcm(' + L + ', ' + dens[i] + ') = ' + l2); L = l2; }
      st.push('The least common denominator is the least common multiple of the denominators: ' + parts.join('; ') + '. So the LCD is ' + L + '.');
    }
    var rows = qs.map(function (q, j) { var m = L / q.d; st.push(F(q) + ': ' + L + ' \u00f7 ' + q.d + ' = ' + m + (m === 1n ? ', so it already has the denominator ' + L + '.' : ', so multiply the top and the bottom by ' + m + ': ' + q.n + ' \u00d7 ' + m + ' = ' + (q.n * m) + ' and ' + q.d + ' \u00d7 ' + m + ' = ' + L + ', giving ' + (q.n * m) + '/' + L + '.')); return [items[j], F(q), String(m), (q.n * m) + '/' + L]; });
    return { ok: true, tool: 'lcd', lcd: String(L), count: qs.length, rows: rows.map(function (r) { return { src: r[0], lowest: r[1], mult: r[2], equiv: r[3] }; }), big: 'LCD = ' + L, results: [['Least common denominator (LCD)', String(L), ''], ['How many fractions', String(qs.length), '']], tables: [{ title: 'Equivalent fractions over the LCD', head: ['Fraction', 'Lowest terms', 'Multiply top and bottom by', 'Over the LCD'], rows: rows }], steps: st };
  }
  function adDecText(q) { var d = decimal(q, 12); return d.text.length <= 40 ? d.text : roundDec(q, 10).text + '\u2026'; }
  function adCompare(src) {
    var items = adList(src, 2, AD_CMP, 'values'), qs = items.map(function (s, i) { return adQ(s, i + 1); }), n = qs.length, i, j;
    var idx = qs.map(function (q, k) { return k; }).sort(function (a, b) { return cmp(qs[a], qs[b]) || a - b; });
    var rank = qs.map(function (q) { var r = 1; qs.forEach(function (o) { if (cmp(o, q) < 0) r++; }); return r; });
    var chain = items[idx[0]]; for (i = 1; i < n; i++) chain += (cmp(qs[idx[i - 1]], qs[idx[i]]) === 0 ? ' = ' : ' < ') + items[idx[i]];
    var lo = qs[idx[0]], hi = qs[idx[n - 1]], diff = sub(hi, lo), allEq = cmp(lo, hi) === 0, L = qs.reduce(function (a, q) { return lcm(a, q.d); }, 1n), st = [];
    var ch = []; qs.forEach(function (q, k) { if (items[k] !== F(q)) ch.push(items[k] + ' = ' + F(q)); });
    if (ch.length) st.push('Write every value as a fraction in lowest terms: ' + ch.join('; ') + '.');
    if (n === 2) {
      var a = qs[0], b = qs[1], x = a.n * b.d, y = b.n * a.d, sym = x < y ? '<' : x > y ? '>' : '=';
      st.push('Cross-multiplication: compare ' + F(a) + ' and ' + F(b) + ' by multiplying each numerator by the other denominator (both denominators are positive). ' + a.n + ' \u00d7 ' + b.d + ' = ' + x + ' and ' + b.n + ' \u00d7 ' + a.d + ' = ' + y + '.');
      st.push(x < y ? x + ' is less than ' + y + ', so ' + F(a) + ' < ' + F(b) + '.' : x > y ? x + ' is greater than ' + y + ', so ' + F(a) + ' > ' + F(b) + '.' : 'The two products are equal, so ' + F(a) + ' = ' + F(b) + ': they are the same value.');
      chain = items[0] + ' ' + sym + ' ' + items[1];
    }
    if (n > 2 || L > 1n) st.push('Over the common denominator ' + L + ' the values are ' + qs.map(function (q) { return (q.n * (L / q.d)) + '/' + L; }).join(', ') + '. With the same denominator, the larger numerator is the larger fraction.');
    st.push(allEq ? 'All the values are equal.' : 'In order from smallest to largest: ' + chain + '.');
    if (!allEq) st.push('The difference between the largest (' + F(hi) + ') and the smallest (' + F(lo) + ') is ' + F(diff) + (diff.d > 1n ? ', or ' + mixed(diff).text + ' as a mixed number' : '') + '.');
    var rows = idx.map(function (k) { var q = qs[k]; return [String(rank[k]), items[k], F(q), adDecText(q), (q.n * (L / q.d)) + '/' + L]; });
    return { ok: true, tool: 'compare', order: idx.map(function (k) { return k; }), ranks: rank, sorted: idx.map(function (k) { return F(qs[k]); }), smallest: F(lo), largest: F(hi), allEqual: allEq, diff: F(diff), lcd: String(L), relation: n === 2 ? (cmp(qs[0], qs[1]) < 0 ? '<' : cmp(qs[0], qs[1]) > 0 ? '>' : '=') : null, big: chain, results: [['Smallest', F(lo), ''], ['Largest', F(hi), ''], ['Difference (largest \u2212 smallest)', F(diff), ''], ['Common denominator used', String(L), '']], tables: [{ title: 'Values in order, smallest first', head: ['Rank', 'You entered', 'Lowest terms', 'Decimal', 'Over the LCD'], rows: rows }], steps: st };
  }
  /* integers a : b : c in lowest terms from non-negative rational terms */
  function adTerms(qs) {
    var L = qs.reduce(function (a, q) { return lcm(a, q.d); }, 1n), ints = qs.map(function (q) { return q.n * (L / q.d); }), g = ints.reduce(function (a, x) { return gcd(a, x); }, 0n);
    return { L: L, scaled: ints, g: g, ints: ints.map(function (x) { return x / g; }) };
  }
  function adRatio(src, totalSrc) {
    var s = src.replace(/\s+to\s+/gi, ':'), items = s.split(':').map(function (x) { return x.trim(); }), i;
    if (items.length < 2) throw new Err('A ratio needs at least two terms separated by a colon, as in 18 : 24.');
    if (items.length > AD_RATIO) throw new Err('Enter at most ' + AD_RATIO + ' terms in a ratio.');
    if (items.some(function (x) { return x === ''; })) throw new Err('A term is missing: write every term between the colons, as in 3 : 4 : 5.');
    var qs = items.map(function (x, k) { var q = adQ(x, k + 1); if (q.n < 0n) throw new Err('Item ' + (k + 1) + ' (\u2018' + x.slice(0, 30) + '\u2019): ratio terms cannot be negative.'); return q; });
    if (qs.every(function (q) { return q.n === 0n; })) throw new Err('At least one term must be greater than 0.');
    var total = null, tt = (totalSrc == null ? '' : String(totalSrc)).trim();
    if (tt) { try { total = parseConv(tt).q; } catch (e) { if (e instanceof Err) return { ok: false, field: 'total', error: 'The total \u2018' + tt.slice(0, 30) + '\u2019: ' + e.message }; throw e; } if (total.n <= 0n) return { ok: false, field: 'total', error: 'The total to share must be greater than 0.' }; }
    var T = adTerms(qs), st = [], txt = T.ints.join(' : '), ch = [];
    qs.forEach(function (q, k) { if (items[k] !== F(q)) ch.push(items[k] + ' = ' + F(q)); });
    st.push('The ratio is ' + items.join(' : ') + '.' + (ch.length ? ' As fractions: ' + ch.join('; ') + '.' : ''));
    if (T.L > 1n) st.push('Clear the fractions: multiply every term by ' + T.L + ', the least common multiple of the denominators ' + qs.map(function (q) { return q.d; }).join(', ') + '. This gives ' + T.scaled.join(' : ') + '.');
    else st.push('Every term is already a whole number.');
    st.push('Divide every term by the greatest common divisor of ' + T.scaled.join(', ') + ', which is ' + T.g + (T.g === 1n ? '. The ratio is already in lowest terms: ' : ': ') + txt + '.');
    var sum = T.ints.reduce(function (a, x) { return a + x; }, 0n), shares = T.ints.map(function (x) { return make(x, sum); });
    st.push('The parts add up to ' + T.ints.join(' + ') + ' = ' + sum + ', so each term is a share of the whole: ' + shares.map(function (q, k) { return T.ints[k] + '/' + sum + (F(q) !== T.ints[k] + '/' + sum ? ' = ' + F(q) : ''); }).join(', ') + '.');
    var rows = shares.map(function (q, k) { var p = percent(q), r = [String(T.ints[k]), F(q), p.text + (p.exact ? '' : ' (repeating)')]; if (total) { var sh = mul(total, q); r.push(F(sh), adDecText(sh)); } return r; });
    var head = ['Term', 'Share of the whole', 'Percentage'].concat(total ? ['Share of the total', 'Decimal'] : []);
    if (total) st.push('Share ' + F(total) + ' in this ratio: each term gets (term \u00f7 ' + sum + ') \u00d7 ' + F(total) + '. ' + shares.map(function (q, k) { return T.ints[k] + '/' + sum + ' \u00d7 ' + F(total) + ' = ' + F(mul(total, q)); }).join('; ') + '. The shares add up to ' + F(total) + '.');
    var res = [['Simplest ratio', txt, 'lowest terms'], ['Sum of the parts', String(sum), '']], unit = null;
    if (qs[0].n !== 0n) { unit = qs.map(function (q) { return div(q, qs[0]); }); res.push(['Scaled so the first term is 1', unit.map(F).join(' : '), unit.map(function (q) { return adDecText(q); }).join(' : ')]); }
    if (items.length === 2 && qs[1].n !== 0n) { var f = div(qs[0], qs[1]); res.push(['First term \u00f7 second term (the ratio as a fraction)', F(f), adDecText(f)]); }
    return { ok: true, tool: 'ratio', ints: T.ints.map(String), ratio: txt, g: String(T.g), L: String(T.L), sum: String(sum), shares: shares.map(F), unit: unit ? unit.map(F) : null, totalShares: total ? shares.map(function (q) { return F(mul(total, q)); }) : null, big: txt, results: res, tables: [{ title: total ? 'Shares of ' + F(total) : 'Each term as a share of the whole', head: head, rows: rows }], steps: st };
  }
  function adProportion(src) {
    var s = src.replace(/\s+to\s+/gi, ':'), sides = s.split('=');
    if (sides.length !== 2) throw new Err('Write a proportion with one equals sign, as in 3 : 4 = 9 : x.');
    var terms = sides[0].split(':').concat(sides[1].split(':')).map(function (x) { return x.trim(); });
    if (sides[0].split(':').length !== 2 || sides[1].split(':').length !== 2) throw new Err('Each side of a proportion has exactly two terms, as in 3 : 4 = 9 : x.');
    if (terms.some(function (x) { return x === ''; })) throw new Err('A term is missing: write all four terms, one of them x, as in 3 : 4 = 9 : x.');
    var unk = -1, k;
    for (k = 0; k < 4; k++) if (/^[xX?]$/.test(terms[k])) { if (unk >= 0) throw new Err('Only one term can be unknown. Use x for exactly one of the four terms.'); unk = k; }
    if (unk < 0) throw new Err('Use x (or ?) for the unknown term, as in 3 : 4 = 9 : x.');
    var q = [null, null, null, null];
    for (k = 0; k < 4; k++) if (k !== unk) { q[k] = adQ(terms[k], k + 1); if (q[k].n === 0n) throw new Err('Item ' + (k + 1) + ' (\u2018' + terms[k] + '\u2019): a term of 0 cannot be used here, because x would not be determined.'); }
    var a = q[0], b = q[1], c = q[2], d = q[3], x, formula, nm = ['a', 'b', 'c', 'd'];
    if (unk === 3) { x = div(mul(b, c), a); formula = 'x = (b \u00d7 c) \u00f7 a'; }
    else if (unk === 2) { x = div(mul(a, d), b); formula = 'x = (a \u00d7 d) \u00f7 b'; }
    else if (unk === 1) { x = div(mul(a, d), c); formula = 'x = (a \u00d7 d) \u00f7 c'; }
    else { x = div(mul(b, c), d); formula = 'x = (b \u00d7 c) \u00f7 d'; }
    var full = q.slice(); full[unk] = x; var A = full[0], B = full[1], C = full[2], D = full[3], st = [], f = function (t) { return t === unk ? 'x' : F(q[t]); };
    st.push('The proportion is ' + f(0) + ' : ' + f(1) + ' = ' + f(2) + ' : ' + f(3) + ', which means ' + f(0) + '/' + f(1) + ' = ' + f(2) + '/' + f(3) + '. Name the terms a : b = c : d.');
    st.push('Cross-multiplication: a \u00d7 d = b \u00d7 c.');
    var known = full.map(function (v, t) { return t === unk ? 'x' : F(v); });
    st.push('Substitute: ' + known[0] + ' \u00d7 ' + known[3] + ' = ' + known[1] + ' \u00d7 ' + known[2] + '. Solve for the unknown (term ' + nm[unk] + '): ' + formula + '.');
    var ls = unk === 3 ? [b, c, a] : unk === 2 ? [a, d, b] : unk === 1 ? [a, d, c] : [b, c, d];
    st.push('x = (' + F(ls[0]) + ' \u00d7 ' + F(ls[1]) + ') \u00f7 ' + F(ls[2]) + ' = ' + F(mul(ls[0], ls[1])) + ' \u00f7 ' + F(ls[2]) + ' = ' + F(x) + (x.d > 1n ? ' (' + mixed(x).text + ', or ' + decimal(x).text + ' as a decimal)' : '') + '.');
    var qa = A.n >= 0n && B.n >= 0n && C.n >= 0n && D.n >= 0n;
    var left = qa ? adTerms([A, B]).ints.join(' : ') : F(div(A, B)) + ' (as a ratio value)', right = qa ? adTerms([C, D]).ints.join(' : ') : F(div(C, D));
    st.push('Check: a \u00d7 d = ' + F(mul(A, D)) + ' and b \u00d7 c = ' + F(mul(B, C)) + (cmp(mul(A, D), mul(B, C)) === 0 ? ', which are equal. ' : ', which differ. ') + 'The left side simplifies to ' + left + ' and the right side to ' + right + '.');
    return { ok: true, tool: 'proportion', unknown: nm[unk], value: x, x: F(x), mixed: mixed(x), decimal: decimal(x), percent: percent(x), terms: full.map(F), check: cmp(mul(A, D), mul(B, C)) === 0, big: 'x = ' + F(x), results: [['x (the unknown term ' + nm[unk] + ')', F(x), ''], ['As a mixed number', mixed(x).text, ''], ['As a decimal', decimal(x).text, decimal(x).exact ? 'exact' : 'repeating'], ['Completed proportion', F(A) + ' : ' + F(B) + ' = ' + F(C) + ' : ' + F(D), '']], tables: [], steps: st };
  }

  /* ---------- Continued fractions (Mode 05 tool): a number to [a0; a1, a2, ...] and back, with every convergent ---------- */
  var CF_MAX = 3000, CF_SHOW = 30, CF_BUILD = 60;
  function cfText(a) { return '[' + a[0] + (a.length > 1 ? '; ' + a.slice(1).join(', ') : '') + ']'; }
  function cfConv(a) { // convergents h/k as BigInt pairs, by h(i) = a(i) h(i-1) + h(i-2)
    var h1 = 1n, h2 = 0n, k1 = 0n, k2 = 1n, out = [];
    a.forEach(function (x) { var h = x * h1 + h2, k = x * k1 + k2; out.push([h, k]); h2 = h1; h1 = h; k2 = k1; k1 = k; });
    return out;
  }
  function cfExpand(q) {
    var n = q.n, d = q.d, a = [], rows = [], k = 0;
    while (true) {
      var f = floorDiv(n, d), r = n - f * d; a.push(f); rows.push([n, d, f, r]);
      if (r === 0n) break; n = d; d = r; k++;
      if (a.length > CF_MAX) throw new Err('This number needs more than ' + CF_MAX + ' continued fraction terms. Use a shorter number.');
    }
    return { a: a, rows: rows };
  }
  function adContinued(src) {
    var s = src.trim().replace(/[\u2212\u2013\u2014]/g, '-'), st = [], q, a, rows, build = false, i;
    if (s.indexOf('[') >= 0 || s.indexOf(';') >= 0) {
      build = true;
      var m = /^\[\s*([^\]]*?)\s*\]$/.exec(s); if (!m) throw new Err('Write a continued fraction in square brackets, as in [3; 7, 15, 1]: the whole part, a semicolon, then the other terms separated by commas.');
      var body = m[1], semi = body.indexOf(';'), head = semi >= 0 ? body.slice(0, semi) : body, rest = semi >= 0 ? body.slice(semi + 1) : '';
      var parts = [head.trim()].concat(rest.trim() === '' ? [] : rest.split(',').map(function (x) { return x.trim(); }));
      if (semi < 0 && parts[0].indexOf(',') >= 0) throw new Err('Put a semicolon after the first term, as in [3; 7, 15, 1].');
      if (parts.length > CF_BUILD) throw new Err('Enter at most ' + CF_BUILD + ' terms.');
      a = parts.map(function (x, j) {
        if (!/^[+-]?\d+$/.test(x)) throw new Err('Term ' + (j + 1) + ' (\u2018' + x.slice(0, 30) + '\u2019) is not a whole number. Every term of a continued fraction is a whole number.');
        if (x.replace(/^[+-]/, '').length > MAX_DIGITS) throw new Err('A term has more than ' + MAX_DIGITS + ' digits. Use a shorter number.');
        var v = BigInt(x); if (j > 0 && v < 1n) throw new Err('Term ' + (j + 1) + ' (' + x + ') must be 1 or more. Only the first term can be zero or negative.'); return v;
      });
      var cv = cfConv(a), last = cv[cv.length - 1]; q = make(last[0], last[1]);
      st.push('The continued fraction is ' + cfText(a) + '. Its value is a0 + 1/(a1 + 1/(a2 + \u2026)), which is built from the right.');
      var acc = { n: a[a.length - 1], d: 1n }, lines = [];
      if (a.length === 1) st.push('There is only one term, so the value is the whole number ' + a[0] + '.');
      else {
        lines.push('start with the last term ' + a[a.length - 1]);
        for (i = a.length - 2; i >= 0; i--) { var inv = make(acc.d, acc.n); acc = add({ n: a[i], d: 1n }, inv); lines.push('add ' + a[i] + ' to the reciprocal: ' + a[i] + ' + ' + F(inv) + ' = ' + F(acc)); }
        if (lines.length > 9) lines = lines.slice(0, 3).concat(['\u2026 (' + (a.length - 1) + ' steps in all)'], lines.slice(-2));
        st.push('Working from the right: ' + lines.join('; ') + '.');
      }
      st.push('The value is ' + F(q) + (q.d > 1n ? ' (' + mixed(q).text + ', or ' + adDecText(q) + ' as a decimal).' : '.'));
      var ex = cfExpand(q).a;
      if (ex.length !== a.length || ex.some(function (x, j) { return x !== a[j]; })) st.push('Every rational number has two continued fractions, one ending in a term of 1 and one not. The standard form is the one whose last term is greater than 1: ' + cfText(ex) + '.');
      a = ex; rows = cfExpand(q).rows;
    } else {
      q = adQ(s, 1); var E = cfExpand(q); a = E.a; rows = E.rows;
      var ch = s !== F(q); st.push('Write ' + (ch ? s + ' as the fraction ' : '') + F(q) + (ch ? ' (read exactly).' : '.') + ' A continued fraction comes from the Euclidean algorithm: take the whole part, then invert what is left over and repeat until nothing is left.');
      if (q.n < 0n) st.push('For a negative number the whole part is rounded down (towards \u2212\u221e), so the remainder is always positive and every later term is positive.');
      var ln = rows.map(function (r) { return r[0] + ' \u00f7 ' + r[1] + ' = ' + r[2] + (r[3] === 0n ? ', no remainder' : ' remainder ' + r[3]); });
      if (ln.length > 8) ln = ln.slice(0, 3).concat(['\u2026 (' + ln.length + ' divisions in all)'], ln.slice(-2));
      st.push('Divide: ' + ln.join('; ') + '.');
      st.push('The quotients are the terms: ' + cfText(a) + '.');
    }
    var C = cfConv(a), shown = Math.min(C.length, CF_SHOW), tr = [];
    for (i = 0; i < shown; i++) { var c = make(C[i][0], C[i][1]), df = sub(q, c); tr.push([String(i), String(a[i]), F(c), adDecText(c), df.n === 0n ? '0 (exact)' : (df.n > 0n ? '+' : '\u2212') + sci({ n: df.n < 0n ? -df.n : df.n, d: df.d }, 3).replace('e', ' \u00d7 10^')]); }
    st.push('Convergents are the fractions got by stopping after each term. They follow h(k) = a(k) \u00d7 h(k\u22121) + h(k\u22122) and the same rule for the denominators, starting from 1/0 and 0/1. ' + C.slice(0, Math.min(C.length, 6)).map(function (x, j) { return 'after term ' + j + ': ' + F(make(x[0], x[1])); }).join('; ') + (C.length > 6 ? '; \u2026' : '') + '.');
    st.push('The convergents are the best rational approximations: no fraction with a smaller denominator gets closer in the sense of the smallest |denominator \u00d7 number \u2212 numerator|. They alternate below and above the number. The last one, ' + F(make(C[C.length - 1][0], C[C.length - 1][1])) + ', is the number itself.');
    var res = [['Continued fraction', cfText(a), a.length === 1 ? 'a whole number' : (a.length - 1) + ' division' + (a.length === 2 ? '' : 's')], ['Value as a fraction', F(q), q.d > 1n ? mixed(q).text : ''], ['Decimal', adDecText(q), inFlag(q)], ['Number of terms', String(a.length), '']];
    if (C.length > shown) st.push('Only the first ' + shown + ' of the ' + C.length + ' convergents are listed.');
    return { ok: true, tool: 'continued', build: build, cf: cfText(a), terms: a.map(String), convergents: C.map(function (x) { return F(make(x[0], x[1])); }), value: F(q), big: cfText(a) + ' = ' + F(q), results: res, tables: [{ title: 'Convergents', head: ['k', 'Term', 'Convergent', 'Decimal', 'Number minus convergent'], rows: tr }], steps: st };
  }
  function advCalc(o) {
    o = o || {}; var src = String(o.expr == null ? '' : o.expr), tool = String(o.tool || '');
    if (!src.trim()) return { ok: false, empty: true, error: '' };
    if (src.length > MAX_INPUT) return { ok: false, error: 'The input is longer than ' + MAX_INPUT + ' characters.' };
    try {
      if (tool === 'gcdlcm') return adGcdLcm(src);
      if (tool === 'lcd') return adLcd(src);
      if (tool === 'compare') return adCompare(src);
      if (tool === 'ratio') return adRatio(src, o.total);
      if (tool === 'proportion') return adProportion(src);
      if (tool === 'continued') return adContinued(src);
      return { ok: false, error: 'Unknown tool.' };
    } catch (e) { if (e instanceof Err) return { ok: false, error: e.message }; throw e; }
  }

  /* ---------- Mode 06: fractional inches and millimetres ---------- */
  /* One inch is exactly 25.4 mm = 127/5 mm (international inch, 1959), so inch to mm is an exact rational product and mm to inch is exact too, 5/127 of the
     millimetre value. Only the final choice of a graduation (nearest 1/D inch, or the next one down or up) is a rounding, and its error is reported. */
  var MMIN = { n: 127n, d: 5n }, IN_DENS = [2, 4, 8, 16, 32, 64, 128, 256], IN_PLACES = 20;
  var RX_IN = /\s*(?:inches|inch|in|")$/i, RX_MM = /\s*(?:millimetres|millimeters|millimetre|millimeter|mm)$/i;
  function inRead(src, dir) {
    var s = src.replace(/[\u2212\u2013\u2014]/g, '-').replace(/[\u2033\u201d\u201c]/g, '"').replace(/\u00a0/g, ' ').trim(), mine = dir === 'in2mm' ? RX_IN : RX_MM, other = dir === 'in2mm' ? RX_MM : RX_IN;
    if (other.test(s) && !mine.test(s)) throw new Err(dir === 'in2mm' ? 'This tab converts inches to millimetres. Remove the unit or switch to the millimetre to inch tab.' : 'This tab converts millimetres to inches. Remove the unit or switch to the inch to millimetre tab.');
    s = s.replace(mine, '').trim();
    var hm = /^([+-]?)\s*(\d+)\s*-\s*(\d+\s*\/\s*\d+)$/.exec(s); if (hm) s = hm[1] + hm[2] + ' ' + hm[3]; // drawing style 1-3/16
    var P = parseConv(s);
    if (P.pct) throw new Err('A percentage is not a length. Type a decimal, a fraction or a mixed number, such as 0.75, 3/4 or 1 3/16.');
    return P;
  }
  function inShort(q) { var d = decimal(q, 12); return d.text.length <= 40 ? d.text : roundDec(q, 10).text + '\u2026'; }
  function inFlag(q) { var d = decimal(q, 12); return d.exact ? 'Exact' : d.repeating && d.period ? 'Repeating decimal, so shown rounded and approximate' : 'Shown rounded and approximate'; }
  /* Round to p places but keep a terminating decimal that already fits, without padding zeros: { text, exact } */
  function trimRound(q, p) { var d = decimal(q, 12); if (d.exact && d.digits <= p) return { text: d.text, exact: true }; return roundDec(q, p); }
  function sgn(q, t) { return q.n > 0n ? '+' + t : t; }
  function inchCalc(o) {
    o = o || {}; var src = String(o.expr == null ? '' : o.expr), dir = o.dir === 'mm2in' ? 'mm2in' : 'in2mm';
    if (!src.trim()) return { ok: false, empty: true, error: '' };
    if (src.length > MAX_INPUT) return { ok: false, error: 'The input is longer than ' + MAX_INPUT + ' characters.' };
    var ps = o.places == null ? '' : String(o.places).trim(), pl = dir === 'in2mm' ? 3 : 5, ds = o.maxDen == null ? '64' : String(o.maxDen).trim() || '64', mode = o.round == null || o.round === '' ? 'nearest' : String(o.round);
    if (ps !== '') { if (!/^\d{1,2}$/.test(ps) || +ps > IN_PLACES) return { ok: false, field: 'places', error: 'Decimal places must be a whole number from 0 to ' + IN_PLACES + '.' }; pl = +ps; }
    if (!/^\d+$/.test(ds) || IN_DENS.indexOf(+ds) < 0) return { ok: false, field: 'maxDen', error: 'Choose a graduation of 1/2, 1/4, 1/8, 1/16, 1/32, 1/64, 1/128 or 1/256 inch.' };
    if (['nearest', 'down', 'up'].indexOf(mode) < 0) return { ok: false, field: 'round', error: 'Rounding must be nearest, down or up.' };
    var P; try { P = inRead(src, dir); } catch (e) { if (e instanceof Err) return { ok: false, error: e.message }; throw e; }
    var q = P.q, D = +ds, st = [], res = [], tabs = [], r;
    var intxt = F(q) + (q.d === 1n ? '' : ' (' + mixed(q).text + ')');
    if (dir === 'in2mm') {
      var mm = mul(q, MMIN), md = decimal(mm, 40), mr = trimRound(mm, pl), cm = div(mm, make(10n, 1n)), mil = mul(q, make(1000n, 1n)), pow2 = q.d <= 256n && (q.d & (q.d - 1n)) === 0n;
      st.push('Read the length as ' + F(q) + ' in' + (P.kind === 'mixed' ? ', the improper fraction for ' + mixed(q).text + ' in' : '') + (P.kind === 'decimal' ? ' (a decimal, read exactly)' : '') + '.');
      st.push('One inch is exactly 25.4 mm, which is 127/5 mm. Multiply: ' + F(q) + ' \u00d7 127/5 = ' + F(make(q.n * 127n, q.d * 5n)) + ' mm.');
      st.push('Divide to get the decimal: ' + F(mm) + ' mm = ' + md.text + ' mm' + (md.exact ? ' (exact, the expansion ends).' : ' (the expansion repeats, so it is never exact in decimals).'));
      st.push(mr.exact ? 'Rounded to ' + pl + ' decimal places the value is unchanged: ' + mr.text + ' mm.' : 'Rounded to ' + pl + ' decimal places (halves away from zero): ' + mr.text + ' mm. This is approximate; the exact value is ' + F(mm) + ' mm.');
      st.push('Check: centimetres are mm \u00f7 10 = ' + decimal(cm).text + ' cm; thousandths of an inch (thou) are inches \u00d7 1000 = ' + decimal(mil).text + '.');
      res.push(['Millimetres' + (mr.exact ? '' : ' (rounded to ' + pl + ' places)'), mr.text + ' mm', mr.exact ? 'Exact' : 'Rounded and approximate. Exact value: ' + (md.exact ? md.text : F(mm)) + ' mm']);
      res.push(['Exact value', F(mm) + ' mm', md.exact ? 'Equals ' + md.text + ' mm, exact' : 'Repeating decimal: ' + inShort(mm) + ' mm']);
      res.push(['Centimetres', inShort(cm) + ' cm', inFlag(cm)]);
      res.push(['Inches as a decimal', inShort(q) + ' in', inFlag(q)]);
      res.push(['Inches as a fraction', mixed(q).text + ' in', pow2 || q.d === 1n ? 'A standard rule graduation (denominator ' + q.d + ')' : 'Denominator ' + q.d + ' is not a power of 2, so it is not a mark on an inch rule']);
      res.push(['Thousandths of an inch (thou)', inShort(mil), inFlag(mil)]);
      r = { ok: true, dir: dir, kind: P.kind, inches: F(q), inchesMixed: mixed(q).text, mmExact: F(mm), mmDecimal: md.text, mmExactDecimal: md.exact, mmRounded: mr.text, mmRoundedExact: mr.exact, places: pl, cm: decimal(cm).text, thou: decimal(mil).text, standard: pow2 || q.d === 1n, value: mm,
        big: mixed(q).text + ' in ' + (mr.exact ? '=' : '\u2248') + ' ' + mr.text + ' mm', results: res, tables: tabs, steps: st };
      return r;
    }
    var inn = mul(q, make(5n, 127n)), idr = trimRound(inn, pl), id = decimal(inn, 12), Dq = make(BigInt(D), 1n), sc = mul(inn, Dq), k;
    if (mode === 'nearest') { var a = abs(sc.n), kk = (2n * a + sc.d) / (2n * sc.d); k = sc.n < 0n ? -kk : kk; } else if (mode === 'down') k = floorDiv(sc.n, sc.d); else k = ceilDiv(sc.n, sc.d);
    var fr = make(k, BigInt(D)), fmm = mul(fr, MMIN), em = sub(fmm, q), ei = sub(fr, inn), epl = Math.max(pl, 4), emr = trimRound(em, epl), eir = trimRound(ei, Math.max(pl, 5)), exact = em.n === 0n;
    var mname = mode === 'nearest' ? 'nearest' : mode === 'down' ? 'next one not above the value' : 'next one not below the value';
    st.push('Read the length as ' + F(q) + ' mm' + (P.kind === 'decimal' ? ' (a decimal, read exactly)' : '') + '.');
    st.push('One inch is exactly 25.4 mm, so inches = mm \u00f7 25.4 = mm \u00d7 5/127. Multiply: ' + F(q) + ' \u00d7 5/127 = ' + F(inn) + ' in.');
    st.push('As a decimal: ' + (id.exact ? id.text + ' in (exact).' : 'about ' + idr.text + ' in, rounded to ' + pl + ' places and approximate; the expansion repeats, so ' + F(inn) + ' is the exact value.'));
    st.push('Rule graduation: 1/' + D + ' in. Multiply the inches by ' + D + ': ' + F(inn) + ' \u00d7 ' + D + ' = ' + F(sc) + ' (about ' + roundDec(sc, 4).text + '). Take the ' + mname + (mode === 'nearest' ? ' (halves away from zero)' : '') + ': ' + k + '.');
    st.push(k + '/' + D + (fr.d === BigInt(D) ? ' is already in lowest terms.' : ' reduces to ' + F(fr) + ' (divide the top and the bottom by ' + (BigInt(D) / fr.d) + ').') + (mixed(fr).isMixed ? ' As a mixed number: ' + mixed(fr).text + ' in.' : ''));
    st.push('Convert back to check: ' + F(fr) + ' \u00d7 25.4 = ' + decimal(fmm).text + ' mm. The difference from your value is ' + decimal(fmm).text + ' \u2212 ' + decimal(q, 12).text + ' = ' + (exact ? '0, so the fraction is exact.' : emr.text + ' mm' + (emr.exact ? '' : ' (rounded)') + ' (' + (em.n > 0n ? 'the fraction is longer' : 'the fraction is shorter') + ' than the value).'));
    res.push(['Inches as a decimal' + (id.exact ? '' : ' (rounded to ' + pl + ' places)'), (id.exact ? id.text : idr.text) + ' in', id.exact ? 'Exact' : 'Rounded and approximate. Exact value: ' + F(inn) + ' in']);
    res.push(['Fractional inch (1/' + D + ' graduation, ' + mode + ')', mixed(fr).text + ' in', exact ? 'Exact: no rounding was needed' : 'Rounded to a graduation, approximate']);
    res.push(['Error of the fraction', exact ? '0 mm' : sgn(em, emr.text) + ' mm', exact ? 'The fraction equals the value exactly' : (em.n > 0n ? 'Fraction is larger than the value' : 'Fraction is smaller than the value') + ' (' + sgn(ei, eir.text) + ' in)']);
    res.push(['Fraction converted back', decimal(fmm).text + ' mm', 'Exact: ' + F(fmm) + ' mm']);
    res.push(['Exact value in inches', F(inn) + ' in', inShort(inn) + ' in']);
    var rows = []; IN_DENS.forEach(function (d) {
      if (d > D) return; var sd = mul(inn, make(BigInt(d), 1n)), kd; if (mode === 'nearest') { var ad = abs(sd.n), kn = (2n * ad + sd.d) / (2n * sd.d); kd = sd.n < 0n ? -kn : kn; } else if (mode === 'down') kd = floorDiv(sd.n, sd.d); else kd = ceilDiv(sd.n, sd.d);
      var f = make(kd, BigInt(d)), m2 = mul(f, MMIN), e2 = sub(m2, q); rows.push([ '1/' + d, mixed(f).text, decimal(m2).text, e2.n === 0n ? '0' : sgn(e2, trimRound(e2, epl).text) ]);
    });
    tabs.push({ title: 'Same length at each graduation (' + mode + ')', head: ['Graduation', 'Fraction (in)', 'That fraction in mm', 'Difference from your value (mm)'], rows: rows });
    r = { ok: true, dir: dir, kind: P.kind, mm: F(q), inches: F(inn), inchesDecimal: id.text, inchesExact: id.exact, inchesRounded: idr.text, places: pl, maxDen: D, round: mode, k: String(k), fraction: F(fr), fractionMixed: mixed(fr).text, fractionBack: F(fmm), fractionBackDecimal: decimal(fmm).text, errorMm: F(em), errorIn: F(ei), exact: exact, errorSign: em.n < 0n ? -1 : em.n === 0n ? 0 : 1, value: inn,
      table: rows, big: decimal(q, 12).text.length > 40 ? mixed(fr).text + ' in' : (q.d === 1n || P.kind !== 'fraction' ? decimal(q).text.length <= 40 ? decimal(q).text : roundDec(q, 6).text : F(q)) + ' mm ' + (exact ? '=' : '\u2248') + ' ' + mixed(fr).text + ' in', results: res, tables: tabs, steps: st };
    return r;
  }

  var api = { simplify: simplify, euclid: euclid, factor: factor, calc: calc, parse: parse, make: make, add: add, sub: sub, mul: mul, div: div, cmp: cmp, gcd: gcd, lcm: lcm, mixed: mixed, decimal: decimal, percent: percent, fmt: F, MAX_INPUT: MAX_INPUT, convert: convert, roundDec: roundDec, sci: sci, mixedCalc: mixedCalc, inchCalc: inchCalc, MM_PER_INCH: '127/5', limitDen: limitDen, advCalc: advCalc };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Fraction = api;
})(typeof window !== 'undefined' ? window : this);
