/* Elecmetric Big Number Calculator: exact engine for Mode 01 (Big Integer Arithmetic).
   Seven operations on arbitrary-length integers in BigInt, so there is no floating-point loss anywhere: add, subtract, multiply, divide (quotient and remainder),
   modulo, power and square. The ordinary JavaScript Number is never used to hold a value or a result.
   Input: whole numbers of up to MAX_DIGITS digits, with an optional sign, grouping commas (1,234,567) and E-notation that is a whole number (23E18, 3.5e19, 1.2e3).
   A number with a fractional part is refused with a pointer to the decimal mode (Mode 02), which is not built yet.
   Limits (documented on the page): inputs of MAX_DIGITS digits, results of MAX_RESULT digits, exponents up to MAX_EXP. A power whose result would be longer than MAX_RESULT is refused before it is computed.
   Division and MOD: three conventions for a negative operand, selected by the caller (default "euclid": the remainder is never negative).
     euclid: a = q*b + r with 0 <= r < |b|.  floor: the quotient is rounded toward minus infinity, r has the sign of b (Python %).  trunc: the quotient is cut toward zero, r has the sign of a (JavaScript, C).
   Zero: A / 0 and A MOD 0 are errors; 0^0 is taken as 1.
   Every result is cross-checked by a second route (inverse operation, casting out nines and elevens, modular reduction with a modular power that does not build the big power, repeated multiplication for small exponents).
   Works in Node (module.exports) and in the browser (global BIGN). */
(function (root) {
  'use strict';
  var MAX_DIGITS = 5000, MAX_RESULT = 20000, MAX_EXP = 1000000;
  var MINUS = '\u2212', TIMES = '\u00d7', DIVS = '\u00f7';
  var DASHES = ['\u2212', '\u2013', '\u2014', '\u2012'];
  var OPS = { add: '+', sub: MINUS, mul: TIMES, div: DIVS, mod: 'MOD', pow: '^', sq: 'square' };
  var OPNAME = { add: 'Addition', sub: 'Subtraction', mul: 'Multiplication', div: 'Division with remainder', mod: 'Modulo (MOD)', pow: 'Power', sq: 'Square' };
  var CONVS = { euclid: 'Euclidean (remainder is never negative)', floor: 'Floored (remainder has the sign of B)', trunc: 'Truncated (remainder has the sign of A)' };

  function abs(x) { return x < 0n ? -x : x; }
  function sgn(x) { return x < 0n ? -1 : x > 0n ? 1 : 0; }
  function cut(s) { s = String(s); var neg = s.charAt(0) === '-', d = neg ? s.slice(1) : s; return d.length > 40 ? (neg ? '-' : '') + d.slice(0, 18) + '\u2026' + d.slice(-18) + ' (' + d.length + ' digits)' : s; }
  function digitsOf(x) { return abs(x).toString().length; }
  function group(s, sep) { s = String(s); var neg = s.charAt(0) === '-'; if (neg) s = s.slice(1); if (!/^\d+$/.test(s)) return (neg ? '-' : '') + s; var out = '', i = s.length; while (i > 3) { out = sep + s.slice(i - 3, i) + out; i -= 3; } return (neg ? '-' : '') + s.slice(0, i) + out; }
  function pm(x, m) { var r = x % m; return r < 0n ? r + m : r; }
  function modPow(b, e, m) { var r = 1n % m; b = pm(b, m); while (e > 0n) { if (e & 1n) r = r * b % m; b = b * b % m; e >>= 1n; } return r; }

  /* ---- parsing ---- */
  function fail(msg) { return { ok: false, error: msg }; }
  function hint(msg) { return { ok: false, empty: true, error: msg, hint: msg }; }
  function parseInteger(text, label) {
    var s = String(text === undefined || text === null ? '' : text);
    DASHES.forEach(function (c) { s = s.split(c).join('-'); });
    s = s.replace(/[\u00a0\u2009\u202f\s_]+/g, '');
    if (s === '') return { ok: false, empty: true };
    if (s.indexOf(',') >= 0) {
      if (!/^[+-]?\d{1,3}(,\d{3})+(\.\d*)?([eE][+-]?\d+)?$/.test(s)) return fail(label + ': commas must group digits in threes, as in 1,234,567. Remove the commas or fix the grouping.');
      s = s.split(',').join('');
    }
    var m = /^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(s);
    if (!m || (m[2] === '' && (m[3] === undefined || m[3] === ''))) return fail(label + ': \u201c' + String(text).trim().slice(0, 30) + '\u201d is not a whole number. Use digits with an optional + or - sign, grouping commas, or E-notation such as 23E18.');
    var ex = 0;
    if (m[4] !== undefined) { if (m[4].replace(/^[+-]/, '').replace(/^0+/, '').length > 7) return fail(label + ': the exponent in \u201c' + String(text).trim().slice(0, 30) + '\u201d is too large.'); ex = parseInt(m[4], 10); }
    var frac = m[3] || '', digits = ((m[2] || '') + frac).replace(/^0+/, ''), shift = ex - frac.length, mag;
    if (digits === '') mag = '0';
    else if (shift >= 0) {
      if (digits.length + shift > MAX_DIGITS) return fail(label + ' would have ' + (digits.length + shift).toLocaleString('en-US') + ' digits. A number can have at most ' + MAX_DIGITS.toLocaleString('en-US') + '.');
      mag = digits + new Array(shift + 1).join('0');
    } else {
      var tz = digits.length - digits.replace(/0+$/, '').length;
      if (tz < -shift) return fail(label + ': \u201c' + String(text).trim().slice(0, 30) + '\u201d has a fractional part. This mode works on whole numbers. Decimal numbers are for the Big Decimal mode (Mode 02, coming).');
      mag = digits.slice(0, digits.length + shift);
      if (mag === '') mag = '0';
    }
    if (mag.length > MAX_DIGITS) return fail(label + ' has ' + mag.length.toLocaleString('en-US') + ' digits. A number can have at most ' + MAX_DIGITS.toLocaleString('en-US') + '.');
    var neg = m[1] === '-' && mag !== '0', v = BigInt(mag);
    return { ok: true, value: neg ? -v : v, text: (neg ? '-' : '') + mag, usedE: m[4] !== undefined || m[3] !== undefined };
  }

  /* ---- division in the three conventions ---- */
  function divmod(a, b, conv) {
    var q = a / b, r = a % b;
    if (conv === 'trunc' || r === 0n) return { q: q, r: r };
    if (conv === 'floor') { if ((r < 0n) !== (b < 0n)) { q -= 1n; r += b; } return { q: q, r: r }; }
    if (r < 0n) { if (b > 0n) { q -= 1n; r += b; } else { q += 1n; r -= b; } }
    return { q: q, r: r };
  }
  function remOk(a, b, q, r, conv) {
    if (q * b + r !== a || abs(r) >= abs(b)) return false;
    if (r === 0n) return true;
    if (conv === 'euclid') return r > 0n;
    if (conv === 'floor') return (r < 0n) === (b < 0n);
    return (r < 0n) === (a < 0n);
  }

  /* ---- scientific and engineering notation of an integer, rounded half up to SIG significant digits ---- */
  var SIG = 10;
  function sigParts(s, sig) { /* s: digits without sign, no leading zeros, not "0". Returns {m: sig digit string, e: power of ten, exact} */
    var e = s.length - 1, exact = true, m;
    if (s.length <= sig) { m = s + new Array(sig - s.length + 1).join('0'); }
    else {
      var head = BigInt(s.slice(0, sig)); exact = /^0*$/.test(s.slice(sig));
      if (s.charCodeAt(sig) >= 53) head += 1n; /* '5' is code 53: round half up */
      m = head.toString(); if (m.length > sig) { m = m.slice(0, sig); e += 1; }
    }
    return { m: m, e: e, exact: exact };
  }
  function stripZ(t) { return t.replace(/\.?0+$/, ''); }
  function notation(x) {
    if (x === 0n) return { sci: '0', eng: '0', exact: true };
    var s = abs(x).toString(), p = sigParts(s, SIG), neg = x < 0n ? '-' : '';
    var sci = neg + p.m.charAt(0) + stripZ('.' + p.m.slice(1)) + '\u00d710^' + p.e;
    var e3 = p.e - (((p.e % 3) + 3) % 3), lead = p.e - e3 + 1;
    var eng = neg + p.m.slice(0, lead) + stripZ('.' + p.m.slice(lead)) + '\u00d710^' + e3;
    return { sci: sci, eng: eng, exact: p.exact };
  }
  function analyse(x, extras) {
    var s = abs(x).toString(), d = s.length, sum = 0, i;
    for (i = 0; i < d; i++) sum += s.charCodeAt(i) - 48;
    var tz = x === 0n ? 0 : s.length - s.replace(/0+$/, '').length, nt = notation(x), bits = x === 0n ? 1 : abs(x).toString(2).length;
    var a = { digits: d, sign: x < 0n ? 'negative' : x > 0n ? 'positive' : 'zero', parity: (x & 1n) === 0n ? 'even' : 'odd', digitSum: sum, first: s.slice(0, 10), last: s.slice(-10), trailingZeros: tz, bits: bits, sci: nt.sci, eng: nt.eng, sciExact: nt.exact };
    if (extras) { a.bin = (x < 0n ? '-' : '') + abs(x).toString(2); a.hex = (x < 0n ? '-' : '') + abs(x).toString(16).toUpperCase(); }
    return a;
  }

  /* ---- working ---- */
  function colTable(da, db, sub) { /* column addition or subtraction of two non-negative digit strings, left to right by place value */
    var L = Math.max(da.length, db.length), A = da, B = db;
    while (A.length < L) A = '0' + A; while (B.length < L) B = '0' + B;
    var carry = 0, cr = [], res = [], k, x, y, t;
    for (k = L - 1; k >= 0; k--) {
      x = A.charCodeAt(k) - 48; y = B.charCodeAt(k) - 48; cr[k] = carry;
      if (!sub) { t = x + y + carry; res[k] = t % 10; carry = t >= 10 ? 1 : 0; }
      else { t = x - y - carry; if (t < 0) { t += 10; carry = 1; } else carry = 0; res[k] = t; }
    }
    var head = ['Place'], ro1 = [sub ? 'Borrow into this place' : 'Carry into this place'], ro2 = ['First number'], ro3 = ['Second number'], ro4 = [sub ? 'Difference digit' : 'Sum digit'];
    for (k = 0; k < L; k++) { head.push('10^' + (L - 1 - k)); ro1.push(String(cr[k])); ro2.push(A.charAt(k)); ro3.push(B.charAt(k)); ro4.push(String(res[k])); }
    var last = !sub && carry ? ' A final carry of 1 becomes a new leading digit.' : '';
    return { head: head, rows: [ro1, ro2, ro3, ro4], note: 'Work from the right (10^0) to the left.' + last };
  }
  function addSteps(a, b, r, isSub) {
    var steps = [], bb = isSub ? -b : b, same = sgn(a) === sgn(bb) || a === 0n || bb === 0n;
    var title = isSub ? 'Step 1. Turn the subtraction into an addition' : 'Step 1. Look at the signs';
    var lines = [];
    if (isSub) lines.push('A ' + MINUS + ' B = A + (' + MINUS + 'B). Here that is ' + cut(a) + ' + (' + cut(bb) + ').');
    if (a === 0n || bb === 0n) lines.push('One of the numbers is 0, so the result is the other number.');
    else if (same) lines.push('Both numbers are ' + (a < 0n ? 'negative' : 'positive') + ', so add the sizes (absolute values) and keep the ' + (a < 0n ? 'negative' : 'positive') + ' sign.');
    else lines.push('The signs differ, so subtract the smaller size from the larger size. The result takes the sign of the number with the larger size' + (abs(a) === abs(bb) ? ' (equal sizes give 0).' : ': ' + (abs(a) > abs(bb) ? 'A' : (isSub ? MINUS + 'B' : 'B')) + '.'));
    steps.push({ title: title, lines: lines });
    var ma = abs(a).toString(), mb = abs(bb).toString();
    if (a !== 0n && bb !== 0n) {
      var op = same ? 'add' : 'subtract', big = abs(a) >= abs(bb) ? ma : mb, small = abs(a) >= abs(bb) ? mb : ma;
      if (Math.max(ma.length, mb.length) <= 25) { var ct = colTable(same ? ma : big, same ? mb : small, !same); steps.push({ title: 'Step 2. ' + (same ? 'Add' : 'Subtract') + ' column by column', lines: [ct.note], table: { head: ct.head, rows: ct.rows } }); }
      else steps.push({ title: 'Step 2. ' + (same ? 'Add' : 'Subtract') + ' the sizes', lines: ['The numbers have ' + ma.length + ' and ' + mb.length + ' digits, too long to list column by column. The sizes are ' + op + 'ed exactly with BigInt.'] });
    }
    steps.push({ title: 'Step 3. Result', lines: [cut(a) + (isSub ? ' ' + MINUS + ' ' : ' + ') + (b < 0n ? '(' + cut(b) + ')' : cut(b)) + ' = ' + cut(r)] });
    return steps;
  }
  function mulSteps(a, b, r, isSq) {
    var steps = [], neg = sgn(a) * sgn(b) < 0;
    steps.push({ title: 'Step 1. Sign', lines: [isSq ? 'A square is never negative.' : (a === 0n || b === 0n ? 'One factor is 0, so the product is 0.' : 'Same signs give a positive product, different signs a negative one. Here the product is ' + (neg ? 'negative' : 'positive') + '.')] });
    var ma = abs(a).toString(), mb = abs(b).toString();
    if (a !== 0n && b !== 0n && mb.length <= 8 && ma.length <= 60 && mb.length > 1) {
      var rows = [], pp = [], k, d;
      for (k = mb.length - 1; k >= 0; k--) { d = mb.charCodeAt(k) - 48; var place = mb.length - 1 - k; if (d === 0) { rows.push([String(d), '10^' + place, '0']); continue; } var v = BigInt(d) * abs(a) * (10n ** BigInt(place)); pp.push(v); rows.push([String(d), '10^' + place, v.toString()]); }
      steps.push({ title: 'Step 2. Multiply the first number by each digit of the second', lines: ['Each digit of ' + cut(abs(b)) + ' times ' + cut(abs(a)) + ', shifted left by its place. A digit 0 gives 0.'], table: { head: ['Digit', 'Place', 'Partial product'], rows: rows } });
      steps.push({ title: 'Step 3. Add the partial products', lines: [pp.map(function (x) { return cut(x); }).join(' + ') + ' = ' + cut(abs(r))] });
    } else steps.push({ title: 'Step 2. Multiply the sizes', lines: [ma.length + '-digit \u00d7 ' + mb.length + '-digit: the product has ' + (a === 0n || b === 0n ? '1 digit' : (ma.length + mb.length - 1) + ' or ' + (ma.length + mb.length) + ' digits') + '. It is computed exactly with BigInt; too long to list every partial product.'] });
    steps.push({ title: 'Result', lines: [(isSq && a < 0n ? '(' + cut(a) + ')' : cut(a)) + (isSq ? '^2' : ' ' + TIMES + ' ' + (b < 0n ? '(' + cut(b) + ')' : cut(b))) + ' = ' + cut(r)] });
    return steps;
  }
  function divSteps(a, b, dm, conv, isMod) {
    var steps = [], ma = abs(a).toString(), mb = abs(b), t = { q: abs(a) / mb, r: abs(a) % mb };
    if (ma.length <= 60 && mb.toString().length <= 30) {
      var rem = 0n, rows = [], i, cur, qd, started = false;
      for (i = 0; i < ma.length; i++) { cur = rem * 10n + BigInt(ma.charCodeAt(i) - 48); qd = cur / mb; rem = cur % mb; if (qd !== 0n) started = true; rows.push([String(i + 1), ma.charAt(i), cur.toString(), started || qd !== 0n ? qd.toString() : '0', rem.toString()]); }
      steps.push({ title: 'Step 1. Long division of the sizes', lines: ['Work on ' + ma + ' \u00f7 ' + mb + ' (signs are handled in Step 2). Bring down one digit at a time, divide by ' + mb + ' and keep the remainder.'], table: { head: ['Step', 'Bring down', 'Current number', 'Quotient digit', 'Remainder'], rows: rows } });
    } else steps.push({ title: 'Step 1. Divide the sizes', lines: ['The numbers are too long to list digit by digit. The size quotient and remainder are computed exactly: ' + cut(t.q) + ' remainder ' + cut(t.r) + '.'] });
    var l2 = ['Sizes: ' + cut(abs(a)) + ' = ' + cut(mb) + ' \u00d7 ' + cut(t.q) + ' + ' + cut(t.r) + '.'];
    if (a >= 0n && b > 0n) l2.push('Both numbers are positive, so every convention gives the same answer.');
    else l2.push('Convention used: ' + CONVS[conv] + '.');
    l2.push(cut(a) + ' = ' + cut(b) + ' \u00d7 ' + cut(dm.q) + ' + ' + cut(dm.r) + ', so the quotient is ' + cut(dm.q) + ' and the remainder is ' + cut(dm.r) + '.');
    var st = { title: 'Step 2. Signs and the remainder', lines: l2 };
    if (a < 0n || b < 0n) { var c3 = ['euclid', 'floor', 'trunc'].map(function (c) { var x = divmod(a, b, c); return [CONVS[c].split(' (')[0], x.q.toString(), x.r.toString()]; }); st.table = { head: ['Convention', 'Quotient', 'Remainder'], rows: c3 }; st.lines.push('With a negative number the three conventions can differ. They are listed below.'); }
    steps.push(st);
    return steps;
  }
  function powSteps(a, e, r) {
    var steps = [], bin = e.toString(2), n = Number(e);
    steps.push({ title: 'Step 1. Sign and size', lines: [a < 0n ? (e % 2n === 0n ? 'A negative base with an even exponent gives a positive result.' : 'A negative base with an odd exponent gives a negative result.') : 'The result is not negative.', 'The result has ' + digitsOf(r) + ' digits.'] });
    if (a === 0n || a === 1n || a === -1n || e === 0n || e === 1n) steps.push({ title: 'Step 2. Special case', lines: [e === 0n ? 'Any number to the power 0 is 1 (0^0 is taken as 1).' : e === 1n ? 'A number to the power 1 is itself.' : a === 0n ? '0 to a positive power is 0.' : a === 1n ? '1 to any power is 1.' : '(-1) to an even power is 1 and to an odd power is -1.'] });
    else {
      var pop = bin.split('').filter(function (c) { return c === '1'; }).length;
      var ls = ['Exponent ' + e + ' in binary is ' + bin + '. Power by repeated squaring needs ' + (bin.length - 1) + ' squarings and ' + (pop - 1) + ' extra multiplications, not ' + (n - 1) + ' multiplications one after another.'];
      var st = { title: 'Step 2. Square and multiply', lines: ls };
      if (bin.length <= 20 && digitsOf(a) * n <= 400) {
        var run = a, rows = [['1', 'start with A', cut(run)], ], i; /* the leading 1 bit */
        for (i = 1; i < bin.length; i++) { run = run * run; var act = 'square'; if (bin.charAt(i) === '1') { run = run * a; act = 'square, then multiply by A'; } rows.push([bin.charAt(i), act, cut(run)]); }
        st.table = { head: ['Next bit', 'Action', 'Running value'], rows: rows };
      } else st.lines.push('The running values are too long to list. The final power is computed exactly.');
      steps.push(st);
    }
    steps.push({ title: 'Result', lines: [(a < 0n ? '(' + cut(a) + ')' : cut(a)) + '^' + e + ' = ' + cut(r)] });
    return steps;
  }

  /* ---- verification ---- */
  var PRIMES = [1000003n, 998244353n, 2305843009213693951n];
  function checkMods(r, f) { return [9n, 11n, 1000003n].every(function (m) { return pm(r, m) === pm(f(m), m); }); }
  function textOk(r) { var s = abs(r).toString(); return BigInt((r < 0n ? '-' : '') + s) === r && (s === '0' || s.charAt(0) !== '0') && analyse(r).digits === s.length; }

  /* ---- solve ---- */
  function solve(o) {
    o = o || {}; var op = o.op || 'add', conv = o.conv || 'euclid';
    if (!OPS[op]) return fail('Unknown operation.');
    if (!CONVS[conv]) conv = 'euclid';
    var pa = parseInteger(o.a, 'Number A');
    if (pa.ok === false && !pa.empty) return pa;
    var needB = op !== 'sq', pb = needB ? parseInteger(o.b, op === 'pow' ? 'Exponent' : 'Number B') : { ok: true, value: 0n, text: '0' };
    if (pb.ok === false && !pb.empty) return pb;
    if (pa.empty) return hint('Type a whole number in Number A, for example 123456789.');
    if (pb.empty) return hint(op === 'pow' ? 'Type a whole number in Exponent, for example 256.' : 'Type a whole number in Number B.');
    var a = pa.value, b = pb.value, warn = [], notes = [], steps, verify = [], r, an, rows = [], sentence, headline, q = null, rem = null, exactFrac = null, ov = [];
    var OPSYM = OPS[op];
    if (op === 'add') { r = a + b; sentence = cut(a) + ' + ' + (b < 0n ? '(' + cut(b) + ')' : cut(b)) + ' = ' + cut(r); steps = addSteps(a, b, r, false);
      verify.push(['(A + B) ' + MINUS + ' B equals A', r - b === a], ['Casting out nines, elevens and a seven-digit prime agree', checkMods(r, function (m) { return pm(a, m) + pm(b, m); })]); }
    else if (op === 'sub') { r = a - b; sentence = cut(a) + ' ' + MINUS + ' ' + (b < 0n ? '(' + cut(b) + ')' : cut(b)) + ' = ' + cut(r); steps = addSteps(a, b, r, true);
      verify.push(['(A ' + MINUS + ' B) + B equals A', r + b === a], ['Casting out nines, elevens and a seven-digit prime agree', checkMods(r, function (m) { return pm(a, m) - pm(b, m); })]); }
    else if (op === 'mul' || op === 'sq') { var bb = op === 'sq' ? a : b; r = a * bb; sentence = op === 'sq' ? (a < 0n ? '(' + cut(a) + ')' : cut(a)) + '^2 = ' + cut(r) : cut(a) + ' ' + TIMES + ' ' + (b < 0n ? '(' + cut(b) + ')' : cut(b)) + ' = ' + cut(r); steps = mulSteps(a, bb, r, op === 'sq');
      verify.push(['Casting out nines, elevens and a seven-digit prime agree', checkMods(r, function (m) { return pm(a, m) * pm(bb, m); })]);
      verify.push(['Dividing the product by A gives B back' + (a === 0n ? ' (skipped, A is 0)' : ''), a === 0n ? r === 0n : (r % a === 0n && r / a === bb)]);
      var da = digitsOf(a), db = digitsOf(bb); verify.push(['The digit count is within the bounds ' + (da + db - 1) + ' to ' + (da + db), a === 0n || bb === 0n ? r === 0n : (digitsOf(r) >= da + db - 1 && digitsOf(r) <= da + db)]);
      if (op === 'sq') verify.push(['The square is not negative', r >= 0n]); }
    else if (op === 'div' || op === 'mod') {
      if (b === 0n) return fail(op === 'div' ? 'Division by zero is undefined. Enter a Number B that is not 0.' : 'A MOD 0 is undefined. Enter a Number B that is not 0.');
      var dm = divmod(a, b, conv); q = dm.q; rem = dm.r; r = op === 'div' ? q : rem;
      var g = abs(a) === 0n ? abs(b) : (function (x, y) { while (y !== 0n) { var t = x % y; x = y; y = t; } return x; })(abs(a), abs(b));
      var fn = a / g, fd = b / g; if (fd < 0n) { fn = -fn; fd = -fd; }
      exactFrac = fd === 1n ? fn.toString() : fn + '/' + fd;
      sentence = op === 'div' ? cut(a) + ' ' + DIVS + ' ' + (b < 0n ? '(' + cut(b) + ')' : cut(b)) + ' = ' + cut(q) + ' remainder ' + cut(rem) : cut(a) + ' MOD ' + (b < 0n ? '(' + cut(b) + ')' : cut(b)) + ' = ' + cut(rem);
      steps = divSteps(a, b, dm, conv, op === 'mod');
      verify.push(['Quotient \u00d7 B + remainder equals A', q * b + rem === a], ['The remainder is smaller than |B| and follows the ' + conv + ' convention', remOk(a, b, q, rem, conv)], ['(A ' + MINUS + ' remainder) \u00f7 B is exactly the quotient', (a - rem) % b === 0n && (a - rem) / b === q]);
      var dm2 = { q: abs(a) / abs(b), r: abs(a) % abs(b) }; verify.push(['The quotient and remainder of the sizes rebuild |A|', abs(b) * dm2.q + dm2.r === abs(a)]); }
    else if (op === 'pow') {
      if (b < 0n) return fail('The exponent is negative, so the answer is a fraction, not a whole number. This mode keeps whole-number results. Use a non-negative exponent.');
      if (b > BigInt(MAX_EXP)) return fail('The exponent is ' + b.toString() + '. The largest exponent allowed is ' + MAX_EXP.toLocaleString('en-US') + '.');
      var e = b, base = abs(a), est;
      if (base <= 1n || e === 0n) est = 1; else { var s = base.toString(), k = Math.min(15, s.length), lg = (s.length - k) + Math.log10(Number(s.slice(0, k))) - (k - 1); est = Math.floor(Number(e) * lg) + 1; if (est > 0 && est < 1) est = 1; }
      if (est > MAX_RESULT + 2) return fail(cut(a) + '^' + e + ' would have about ' + est.toLocaleString('en-US') + ' digits. This calculator limits results to ' + MAX_RESULT.toLocaleString('en-US') + ' digits so the page stays responsive. Use a smaller base or exponent.');
      r = a ** e;
      if (digitsOf(r) > MAX_RESULT) return fail(cut(a) + '^' + e + ' has ' + digitsOf(r).toLocaleString('en-US') + ' digits. This calculator limits results to ' + MAX_RESULT.toLocaleString('en-US') + ' digits so the page stays responsive. Use a smaller base or exponent.');
      sentence = (a < 0n ? '(' + cut(a) + ')' : cut(a)) + '^' + e + ' = ' + cut(r); steps = powSteps(a, e, r);
      if (a === 0n && e === 0n) notes.push('0^0 is taken as 1, the usual convention for whole-number powers.');
      verify.push(['The result reduced modulo three primes equals a modular power that never builds the big number', PRIMES.every(function (p) { return pm(r, p) === modPow(a, e, p); })]);
      if (e <= 64n) { var rr = 1n, i; for (i = 0n; i < e; i++) rr *= a; verify.push(['Repeated multiplication gives the same value', rr === r]); }
      var dd = digitsOf(r), ds = digitsOf(a); verify.push(['The digit count is possible for this base and exponent', e === 0n || base <= 1n ? dd === 1 : (dd >= (ds - 1) * Number(e) + 1 && dd <= ds * Number(e))]);
      verify.push(['The sign is right (negative only for a negative base and an odd exponent)', r === 0n || (r < 0n) === (a < 0n && (e & 1n) === 1n)]);
    }
    verify.push(['The result written out has no leading zeros and its digit count matches', textOk(r)]);
    var verifyOk = verify.every(function (v) { return v[1] === true; });
    var focus = r; an = analyse(focus, !!o.extras);
    var ex = (pa.usedE || pb.usedE) ? 'E-notation inputs were read as whole numbers: A = ' + cut(a) + (needB ? ', B = ' + cut(b) : '') + '.' : '';
    if (ex) notes.push(ex);
    headline = op === 'div' ? 'Quotient ' + cut(q) + ', remainder ' + cut(rem) : cut(r);
    rows.push(['Number A', cut(a), analyse(a).digits + ' digits']);
    rows.push(['Operation', OPNAME[op] + (op === 'sq' ? '' : ' (' + OPSYM + ')'), op === 'div' || op === 'mod' ? CONVS[conv] : '']);
    if (needB) rows.push([op === 'pow' ? 'Exponent' : 'Number B', cut(b), analyse(b).digits + ' digits']);
    if (op === 'div') { rows.push(['Quotient', cut(q), '']); rows.push(['Remainder', cut(rem), '']); rows.push(['Exact value as a fraction', cut(exactFrac), 'reduced; a decimal expansion is for the Big Decimal mode (Mode 02, coming)']); }
    else if (op === 'mod') rows.push(['Remainder (A MOD B)', cut(r), CONVS[conv].split(' (')[0]]);
    else rows.push(['Result', cut(r), '']);
    rows.push(['Number of digits', String(an.digits), op === 'div' ? 'of the quotient' : op === 'mod' ? 'of the remainder' : '']);
    rows.push(['Sign', an.sign, ''], ['Even or odd', an.parity, ''], ['Scientific notation', an.sci, an.sciExact ? 'exact' : 'rounded to ' + SIG + ' significant digits (half up); the full value is exact'], ['Engineering notation', an.eng, 'exponent in multiples of three'],
      ['Digit sum', String(an.digitSum), ''], ['First digits', an.first, ''], ['Last digits', an.last, ''], ['Trailing zeros', String(an.trailingZeros), ''], ['Size in bits', String(an.bits), 'without the sign']);
    rows.push(['Exactness', 'Exact integer', 'no rounding was used']);
    if (o.extras) { rows.push(['Binary', an.bin.length > 400 ? an.bin.slice(0, 200) + '\u2026' + an.bin.slice(-150) + ' (' + an.bits + ' bits)' : an.bin, 'sign and size, not two\u2019s complement'], ['Hexadecimal', an.hex.length > 400 ? an.hex.slice(0, 200) + '\u2026' + an.hex.slice(-150) : an.hex, 'sign and size']); }
    var lines = ['Elecmetric Big Number Calculator, Big Integer Arithmetic', 'Operation: ' + OPNAME[op] + (op === 'div' || op === 'mod' ? ' (' + CONVS[conv] + ')' : ''), 'Number A = ' + a.toString()];
    if (needB) lines.push((op === 'pow' ? 'Exponent' : 'Number B') + ' = ' + b.toString());
    if (op === 'div') lines.push('Quotient = ' + q.toString(), 'Remainder = ' + rem.toString(), 'Exact fraction = ' + exactFrac); else lines.push((op === 'mod' ? 'Remainder = ' : 'Result = ') + r.toString());
    lines.push('Digits = ' + an.digits, 'Scientific notation = ' + an.sci, 'Engineering notation = ' + an.eng, 'Digit sum = ' + an.digitSum, 'Exactness = exact integer');
    var csv = [['Quantity', 'Value']].concat([['Operation', OPNAME[op]], ['Number A', a.toString()]]).concat(needB ? [[op === 'pow' ? 'Exponent' : 'Number B', b.toString()]] : []).concat(op === 'div' ? [['Quotient', q.toString()], ['Remainder', rem.toString()], ['Exact fraction', exactFrac]] : [[op === 'mod' ? 'Remainder' : 'Result', r.toString()]]).concat([['Digits', String(an.digits)], ['Scientific notation', an.sci], ['Engineering notation', an.eng], ['Digit sum', String(an.digitSum)], ['Exactness', 'Exact integer']]);
    return { ok: true, op: op, conv: conv, a: a.toString(), b: needB ? b.toString() : null, result: r.toString(), quotient: q === null ? null : q.toString(), remainder: rem === null ? null : rem.toString(), exactFraction: exactFrac,
      sentence: sentence, headline: headline, analysis: an, rows: rows, steps: steps, verify: verify, verifyOk: verifyOk, notes: notes, warnings: warn, summary: lines.join('\n'),
      csv: csv.map(function (rw) { return rw.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n') };
  }

  var api = { solve: solve, parseInteger: parseInteger, divmod: divmod, notation: notation, analyse: analyse, group: group, cut: cut, modPow: modPow, OPS: OPS, OPNAME: OPNAME, CONVS: CONVS, MAX_DIGITS: MAX_DIGITS, MAX_RESULT: MAX_RESULT, MAX_EXP: MAX_EXP, SIG: SIG };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.BIGN = api;
})(typeof self !== 'undefined' ? self : this);
