/* Elecmetric Hex Calculator: engine for all five modes. One file, no dependencies, no DOM.
   Required by tests/hex_test.js and inlined into calculators/hex-calculator/index.html by tools/hex_page.js.
   Ported from the TypeScript hex engine (constants, notation, bases, arithmetic, signed, bitwise, engineering) into this repository's single-file pattern.

   Mode 01 arith()      Hexadecimal arithmetic. BigInt, arbitrary precision, 2 to 20 operands (divide takes two), sign and magnitude, carry and borrow rows,
                        partial products, long division with quotient and remainder. Never narrowed: padding only ever widens the shown pattern.
   Mode 02 convert()    Binary, octal, decimal and hexadecimal at once, integers and fractions, base detection that reports when it is ambiguous.
   Mode 03 signed()     Fixed-width signed and unsigned reading of a bit pattern, or encoding of a decimal value, with overflow and underflow flags.
                        Two's complement is applied only here, where a width is chosen (technical decision: automatic width and fixed width are separate).
   Mode 04 bitwise()    AND, OR, XOR, NOT, NAND, NOR, XNOR, shifts (logical and arithmetic) and rotates, with per-bit rows.
   Mode 05 tool()       Register decoder with set, clear and toggle, memory address, byte grouping and endianness, ASCII, RGB, named checksums.

   Differences from the TypeScript source, all deliberate:
   - Only the 0x prefix is a prefix in a hexadecimal field. In the source, 0B and 0D (common bytes) were read as the binary and decimal prefixes and refused.
   - Negative results keep their sign in every base (the source dropped it from the hex, binary and octal strings).
   - A bitwise operand wider than the chosen width is refused, not silently masked.
   - Sum-8 is shown as 2 hex digits (the source padded it to 4). CRC-16/MODBUS and the two's-complement sum (LRC) are added.
   - Base detection and conversion share one rule, and the page asks the user to confirm when it is ambiguous. */
(function (root) {
  'use strict';
  var MAXD = 1024, MAXN = 20, PP_ROWS = 64, DIV_ROWS = 128, HEXD = '0123456789ABCDEF';
  var OPS = [['add', '+', 'Addition'], ['sub', '-', 'Subtraction'], ['mul', '×', 'Multiplication'], ['div', '÷', 'Division']];
  var PADS = ['min', 'match', '2', '4', '8', '16'];
  var BN = { 2: 'binary', 8: 'octal', 10: 'decimal', 16: 'hexadecimal' }, PFX = { 2: '0b', 8: '0o', 10: '0d', 16: '0x' };
  var DIG = { 2: '01', 8: '01234567', 10: '0123456789', 16: HEXD };
  var HINT = { 2: 'Binary uses 0 and 1.', 8: 'Octal uses 0 to 7.', 10: 'Decimal uses 0 to 9.', 16: 'Hexadecimal uses 0 to 9 and A to F.' };

  function lpad(s, n, c) { s = String(s); c = c || '0'; while (s.length < n) s = c + s; return s; }
  function rpad(s, n) { s = String(s); while (s.length < n) s += ' '; return s; }
  function absB(v) { return v < 0n ? -v : v; }
  function up(s) { return String(s).toUpperCase(); }
  function mask(w) { return (1n << BigInt(w)) - 1n; }
  function blank(s) { var i = 0; while (i < s.length - 1 && s.charAt(i) === '0') i++; return lpad('', i, ' ') + s.slice(i); }
  function popcount(s) { var n = 0, i; for (i = 0; i < s.length; i++) if (s.charAt(i) === '1') n++; return n; }
  function fromDigits(s, b) { if (!s) return 0n; return b === 10 ? BigInt(s) : BigInt((b === 16 ? '0x' : b === 8 ? '0o' : '0b') + s); }
  function toB(m, b) { return up(absB(m).toString(b)); }
  function group(s, n) { if (!n || n >= s.length) return s; var o = [], e; for (e = s.length; e > 0; e -= n) o.unshift(s.slice(Math.max(0, e - n), e)); return o.join(' '); }
  /* Hex text of a signed BigInt. o: { lower, prefix, group }. min: minimum digits. */
  function H(m, o, min) {
    o = o || {}; var s = toB(m, 16); if (min) s = lpad(s, min, '0'); s = group(s, o.group); if (o.lower) s = s.toLowerCase();
    return (m < 0n ? '-' : '') + (o.prefix ? '0x' : '') + s;
  }
  function bin(m, w) { var s = absB(m).toString(2); return (m < 0n ? '-' : '') + (w ? lpad(s, w, '0') : s); }
  function fmtOpts(o) { o = o || {}; return { lower: o.lower === true || o.hexCase === 'lower', prefix: !!o.prefix, group: Number(o.group) || 0 }; }
  function fail(error, extra) { var r = { ok: false, error: error }; if (extra) for (var k in extra) r[k] = extra[k]; return r; }

  /* ---------- parsing ---------- */
  /* parseNum(text, base, { frac }): sign, only this base's own prefix, grouping characters, digits checked against the base.
     Returns { ok, neg, int, frac, v (signed BigInt of the integer part), width } or { ok:false, empty?, error }. */
  function parseNum(text, base, o) {
    o = o || {};
    var s = String(text == null ? '' : text).trim().replace(/[\s_,]/g, '');
    if (!s) return { ok: false, empty: true, error: 'Enter a ' + BN[base] + ' number.' };
    var neg = false, m = s.match(/^[+\-−]/);
    if (m) { neg = m[0] !== '+'; s = s.slice(1); }
    if (s.slice(0, 2).toLowerCase() === PFX[base]) s = s.slice(2);
    if (!s) return { ok: false, error: 'Add ' + BN[base] + ' digits after the sign or prefix.' };
    var ip = s, fp = '', d = s.indexOf('.');
    if (d !== -1) {
      if (!o.frac) return { ok: false, error: 'A point is not allowed here: this works on whole numbers.' };
      if (s.indexOf('.', d + 1) !== -1) return { ok: false, error: 'Only one point is allowed.' };
      ip = s.slice(0, d); fp = s.slice(d + 1);
      if (!ip && !fp) return { ok: false, error: 'The number has no digits.' };
    }
    var all = up(ip + fp), i;
    for (i = 0; i < all.length; i++) if (DIG[base].indexOf(all.charAt(i)) < 0) return { ok: false, error: '‘' + (ip + fp).charAt(i) + '’ is not a ' + BN[base] + ' digit. ' + HINT[base] };
    if (all.length > MAXD) return { ok: false, error: 'The number has ' + all.length + ' digits. The limit is ' + MAXD + '.' };
    ip = up(ip) || '0'; fp = up(fp).replace(/0+$/, '');
    var mag = fromDigits(ip, base);
    if (mag === 0n && !fp) neg = false;
    return { ok: true, neg: neg, int: ip, frac: fp, v: neg ? -mag : mag, width: ip.length, base: base };
  }
  function parseHexU(text, what) {
    var p = parseNum(text, 16);
    if (!p.ok) return p;
    if (p.neg) return { ok: false, error: (what || 'This value') + ' is a raw bit pattern, so it cannot be negative. Use the decimal-value input for negative numbers.' };
    return p;
  }

  /* ---------- Mode 01: arithmetic ---------- */
  function colAdd(a, b) {
    var n = Math.max(a.length, b.length), x = lpad(a, n), y = lpad(b, n), c = 0, out = '', carry = '', cols = [], i;
    for (i = n - 1; i >= 0; i--) {
      carry = c + carry;
      var va = HEXD.indexOf(x.charAt(i)), vb = HEXD.indexOf(y.charAt(i)), t = va + vb + c, d = t % 16, co = (t - d) / 16;
      cols.push(x.charAt(i) + ' + ' + y.charAt(i) + ' + ' + c + ' = ' + t + ' → digit ' + HEXD.charAt(d) + ', carry ' + co);
      out = HEXD.charAt(d) + out; c = co;
    }
    return { sum: c + out, carry: c + carry, n: n, x: x, y: y, cols: cols.reverse() };
  }
  function colSub(a, b) {
    var n = a.length, x = a, y = lpad(b, n), bw = 0, out = '', row = '', cols = [], i;
    for (i = n - 1; i >= 0; i--) {
      row = bw + row;
      var va = HEXD.indexOf(x.charAt(i)), vb = HEXD.indexOf(y.charAt(i)), t = va - vb - bw, nb = 0;
      if (t < 0) { cols.push(x.charAt(i) + ' − ' + y.charAt(i) + ' − ' + bw + ': ' + va + ' < ' + (vb + bw) + ', borrow 1 → (16 + ' + va + ') − ' + (vb + bw) + ' = ' + (t + 16) + ' → digit ' + HEXD.charAt(t + 16)); t += 16; nb = 1; }
      else cols.push(x.charAt(i) + ' − ' + y.charAt(i) + ' − ' + bw + ' = ' + t + ' → digit ' + HEXD.charAt(t));
      out = HEXD.charAt(t) + out; bw = nb;
    }
    return { diff: out, borrow: row, n: n, x: x, y: y, final: bw, cols: cols.reverse() };
  }
  var PRE = '        ';
  function row(label, s) { return lpad(label, PRE.length - 1, ' ') + ' ' + s; }
  function check(got, want, what) { if (BigInt('0x' + got) !== want) throw new Error('internal check failed in ' + what); }

  /* One signed pair, x + y. Same signs: add the magnitudes. Different signs: subtract the smaller magnitude from the larger and keep the larger one's sign. */
  function pairSum(x, y, title, head) {
    var ax = absB(x), ay = absB(y), sx = x < 0n, sy = y < 0n, a = toB(ax, 16), b = toB(ay, 16), t = [], res = x + y, W, rule;
    if (head) t.push(head);
    if (sx === sy) {
      var r = colAdd(a, b); W = r.n + 1; rule = lpad('', W, '-'); check(r.sum, ax + ay, 'addition');
      t.push(row('carry', r.carry), row('', blank(lpad(r.x, W))), row('+', blank(lpad(r.y, W))), row('', rule), row('=', blank(r.sum)));
      if (sx) t.push('Both numbers are negative: add the magnitudes and keep the minus sign.');
      t.push('', 'Column by column, right to left:'); r.cols.slice().reverse().forEach(function (c, k) { t.push('  16^' + k + ': ' + c); });
    } else {
      var big = ax >= ay ? a : b, small = ax >= ay ? b : a, s = colSub(big, small); W = s.n; rule = lpad('', W, '-'); check(s.diff, absB(ax - ay), 'subtraction');
      t.push(row('borrow', s.borrow), row('', blank(s.x)), row('−', blank(s.y)), row('', rule), row('=', blank(s.diff)));
      t.push('The signs differ: subtract the smaller magnitude from the larger' + (res < 0n ? ' and put a minus sign in front (the larger number is negative).' : '.'), '', 'Column by column, right to left:');
      s.cols.slice().reverse().forEach(function (c, k) { t.push('  16^' + k + ': ' + c); });
    }
    return { title: title, text: t.join('\n'), val: res };
  }
  function pairMul(x, y, title) {
    var ax = absB(x), ay = absB(y), a = toB(ax, 16), b = toB(ay, 16), t = [], prod = ax * ay, rows = [], i, k;
    for (i = b.length - 1, k = 0; i >= 0; i--, k++) { var d = HEXD.indexOf(b.charAt(i)), raw = ax * BigInt(d); rows.push({ d: b.charAt(i), dv: d, shift: k, raw: toB(raw, 16), shifted: toB(raw * (16n ** BigInt(k)), 16) }); }
    var W = Math.max(a.length, b.length + 2, toB(prod, 16).length, rows.length ? rows[rows.length - 1].shifted.length : 1) + 1;
    t.push(row('', blank(lpad(a, W))), row('×', blank(lpad(b, W))), row('', lpad('', W, '-')));
    rows.slice(0, PP_ROWS).forEach(function (r) { t.push(row('', blank(lpad(r.shifted, W)))); });
    t.push(row('', lpad('', W, '-')), row('=', blank(lpad(toB(prod, 16), W))));
    if (rows.length > PP_ROWS) t.push('Only the first ' + PP_ROWS + ' partial products are shown; the product is exact.');
    t.push('', 'One partial product per digit of the multiplier, right to left:');
    rows.slice(0, PP_ROWS).forEach(function (r) { t.push('  digit ' + r.d + ' (16^' + r.shift + '): ' + a + ' × ' + r.d + ' = ' + r.raw + (r.shift ? ', shifted left ' + r.shift + ' → ' + r.shifted : '')); });
    if ((x < 0n) !== (y < 0n) && prod !== 0n) t.push('', 'The signs differ, so the product is negative.');
    return { title: title, text: t.join('\n'), val: x * y, rows: rows.length };
  }
  function pairDiv(x, y, title) {
    var ax = absB(x), ay = absB(y), a = toB(ax, 16), d = toB(ay, 16), t = [], q = x / y, r = x % y, rem = 0n, qs = '', i;
    t.push(a + ' ÷ ' + d, '');
    for (i = 0; i < a.length; i++) {
      var part = rem * 16n + BigInt(HEXD.indexOf(a.charAt(i))), qd = part / ay; rem = part % ay; qs += HEXD.charAt(Number(qd));
      if (i < DIV_ROWS) t.push('  bring down ' + a.charAt(i) + ': ' + toB(part, 16) + ' ÷ ' + d + ' = ' + HEXD.charAt(Number(qd)) + ' remainder ' + toB(rem, 16));
    }
    if (a.length > DIV_ROWS) t.push('  (only the first ' + DIV_ROWS + ' steps are shown)');
    check(qs.replace(/^0+(?=.)/, ''), absB(q), 'division'); if (rem !== absB(r)) throw new Error('internal check failed in division remainder');
    t.push('', 'Quotient ' + (q < 0n ? '−' : '') + toB(q, 16) + ', remainder ' + (r < 0n ? '−' : '') + toB(r, 16) + '.', 'Check: Q × B + R = ' + H(q) + ' × ' + H(y) + ' + ' + H(r) + ' = ' + H(q * y + r) + (q * y + r === x ? ' (matches the dividend).' : ' (mismatch).'));
    if (x < 0n || y < 0n) t.push('Division truncates toward zero and the remainder takes the sign of the dividend, so A = Q × B + R always holds.');
    return { title: title, text: t.join('\n'), q: q, r: r };
  }
  function num(m, o, w) { /* number record for a BigInt */
    var a = absB(m), hx = toB(a, 16), bits = a.toString(2);
    return { v: m, neg: m < 0n, zero: m === 0n, dec: m.toString(10), hex: H(m, o), hexPadded: H(m, o, w || 0), bin: bin(m), binGrouped: (m < 0n ? '-' : '') + group(lpad(bits, Math.ceil(bits.length / 4) * 4, '0'), 4), oct: (m < 0n ? '-' : '') + a.toString(8), bitLength: m === 0n ? 0 : bits.length, ones: popcount(bits), zeros: m === 0n ? 0 : bits.length - popcount(bits), digits: hx.length };
  }
  function placeValue(digits) {
    if (digits.length < 2 || digits.length > 8) return '';
    var parts = [], n = digits.length, i;
    for (i = 0; i < n; i++) { var c = digits.charAt(i); if (c === '0') continue; var w = 16 ** (n - 1 - i); parts.push(w === 1 ? String(HEXD.indexOf(c)) : (c === '1' ? '' : HEXD.indexOf(c) + '×') + w); }
    return parts.join(' + ');
  }
  function arith(inp) {
    var op = inp.op, pad = inp.pad == null ? 'min' : String(inp.pad), raw = inp.operands || [], fo = fmtOpts(inp), def = OPS.filter(function (d) { return d[0] === op; })[0], p = [], i;
    if (!def) return fail('Unknown operation.');
    if (PADS.indexOf(pad) < 0) return fail('Unknown padding option.');
    for (i = 0; i < raw.length; i++) {
      var q = parseNum(raw[i], 16);
      if (!q.ok) return fail(raw.length > 1 ? 'Number ' + 'ABCDEFGHIJKLMNOPQRST'.charAt(i) + ': ' + q.error : q.error, { field: i, empty: !!q.empty });
      p.push(q);
    }
    if (p.length < 2) return fail('Enter at least two numbers.', { field: p.length, empty: true });
    if (op === 'div' && p.length !== 2) return fail('Division takes exactly two numbers: dividend and divisor.');
    if (p.length > MAXN) return fail('At most ' + MAXN + ' numbers can be used at once.');
    if (p.some(function (q) { return q.frac; })) return fail('Arithmetic works on whole numbers. Use the converter for a fractional part.');
    var v = p.map(function (q) { return q.v; }), steps = [], notes = [], total, rem = null, k, run;
    var symbol = def[1] === '-' ? '−' : def[1];
    if (op === 'div' && v[1] === 0n) return fail('Cannot divide by zero.', { field: 1 });
    if (op === 'add' || op === 'sub') {
      run = v[0]; total = v[0];
      for (k = 1; k < v.length; k++) {
        var y = op === 'add' ? v[k] : -v[k], head = op === 'sub' ? H(run) + ' − ' + H(v[k]) + ' = ' + H(run) + ' + (' + H(-v[k]) + ')' : H(run) + ' + ' + H(v[k]);
        var st = pairSum(run, y, v.length > 2 ? 'Step ' + k + ': ' + head : def[2], v.length > 2 ? '' : (op === 'sub' ? head : ''));
        steps.push({ title: st.title, text: st.text }); run = st.val;
      }
      total = run;
    } else if (op === 'mul') {
      run = v[0];
      for (k = 1; k < v.length; k++) { var pm = pairMul(run, v[k], v.length > 2 ? 'Step ' + k + ': ' + H(run) + ' × ' + H(v[k]) : def[2]); steps.push({ title: pm.title, text: pm.text }); run = pm.val; }
      total = run;
    } else {
      var dv = pairDiv(v[0], v[1], def[2]); steps.push({ title: dv.title, text: dv.text }); total = dv.q; rem = dv.r;
      if (v[0] < 0n || v[1] < 0n) notes.push('Division truncates toward zero; the remainder takes the sign of the dividend.');
    }
    var longest = Math.max.apply(null, p.map(function (q) { return q.int.length; })), want = pad === 'min' ? 0 : pad === 'match' ? longest : Number(pad);
    var wd = Math.max(want, 0), result = num(total, fo, wd), remainder = rem === null ? null : num(rem, fo, wd);
    if (wd && absB(total).toString(16).length > wd) notes.push('The result needs more than ' + wd + ' hex digits, so it is shown in full. Nothing is truncated; for wrap-around at a fixed width use the Signed Hex mode.');
    var operands = p.map(function (q, n) { var r = num(q.v, fo, q.int.length); r.typed = (q.neg ? '-' : '') + (fo.prefix ? '0x' : '') + q.int; r.leadingZeros = q.int.length - toB(q.v, 16).length; r.placeValue = placeValue(toB(q.v, 16)); r.hexPadded = (q.neg ? '-' : '') + (fo.prefix ? '0x' : '') + group(q.int, fo.group); if (fo.lower) r.hexPadded = r.hexPadded.toLowerCase(); return r; });
    var res = { ok: true, mode: 'arith', op: op, symbol: symbol, operands: operands, result: result, remainder: remainder, steps: steps, notes: notes, pad: pad };
    res.view = arithView(res, fo);
    return res;
  }
  var LETS = 'ABCDEFGHIJKLMNOPQRST';
  function arithView(r, fo) {
    var rem = r.remainder, res = r.result, expr = r.operands.map(function (x) { return x.hexPadded; }).join(' ' + r.symbol + ' ');
    var head = ['', 'Hexadecimal', 'Decimal', 'Binary', 'Octal'], rows = [];
    r.operands.forEach(function (x, k) { rows.push([r.op === 'div' ? (k === 0 ? 'Dividend' : 'Divisor') : LETS.charAt(k), x.hexPadded + (x.placeValue && !x.zero ? ' (' + x.placeValue + ')' : ''), x.dec, x.binGrouped, x.oct]); });
    rows.push([rem ? 'Quotient' : 'Result', res.hexPadded, res.dec, res.binGrouped, res.oct]);
    if (rem) rows.push(['Remainder', rem.hexPadded, rem.dec, rem.binGrouped, rem.oct]);
    var big = [{ label: rem ? 'Quotient (hex)' : 'Result (hex)', value: res.hexPadded }];
    if (rem) big.push({ label: 'Remainder (hex)', value: rem.hexPadded });
    var bitrows = res.bitLength && res.bitLength <= 64 ? [{ label: 'Result', bits: lpad(absB(res.v).toString(2), Math.ceil(res.bitLength / 4) * 4, '0'), neg: res.neg }] : [];
    return {
      title: 'Hexadecimal arithmetic', expr: expr, big: big,
      sub: [{ label: 'Decimal', value: res.dec }, { label: 'Binary', value: res.binGrouped }, { label: 'Octal', value: res.oct }],
      facts: [['Bit length', String(res.bitLength)], ['Hex digits', String(res.digits)], ['Ones', String(res.ones)], ['Zeros', String(res.zeros)], ['Sign', res.zero ? 'zero' : res.neg ? 'negative' : 'positive']],
      bitrows: bitrows, tables: [{ title: 'Operands and result in four number systems', head: head, rows: rows, cur: rem ? [rows.length - 2, rows.length - 1] : [rows.length - 1] }], notes: r.notes, steps: r.steps
    };
  }

  /* ---------- Mode 02: converter ---------- */
  function detect(text) {
    var s = String(text == null ? '' : text).trim().replace(/[\s_,]/g, '').replace(/^[+\-−]/, '');
    if (!s) return { ok: false, empty: true, error: 'Enter a number.' };
    var p = s.slice(0, 2).toLowerCase(), b;
    for (b in PFX) if (PFX[b] === p) return { ok: true, base: Number(b), ambiguous: false, reason: 'The ' + PFX[b] + ' prefix names the base.', options: [Number(b)] };
    var body = up(s.split('.').join(''));
    if (/[A-F]/.test(body)) return { ok: true, base: 16, ambiguous: false, reason: 'Contains letters A to F, so it must be hexadecimal.', options: [16] };
    var opts = [2, 8, 10, 16].filter(function (x) { return body.split('').every(function (c) { return DIG[x].indexOf(c) >= 0; }); });
    return { ok: true, base: /^[01]*$/.test(body) ? 2 : 10, ambiguous: opts.length > 1, reason: 'Only digits ' + (/^[01]*$/.test(body) ? '0 and 1' : '0 to 9') + ': it could be ' + opts.map(function (x) { return BN[x]; }).join(', ') + '. Confirm the base.', options: opts };
  }
  function fracDigits(n, d, base, max) {
    var out = '', i = 0, bb = BigInt(base);
    for (; i < max && n !== 0n; i++) { var sc = n * bb; out += HEXD.charAt(Number(sc / d)); n = sc % d; }
    return { digits: out, exact: n === 0n };
  }
  function fmtBase(intV, fr, base, o) {
    var s = toB(intV, base); if (base === 16) { s = group(s, o.group); if (o.lower) s = s.toLowerCase(); } else if (o.group && base === 2) s = group(lpad(s, Math.ceil(s.length / 4) * 4, '0'), 4);
    return s + (fr ? '.' + (base === 16 && o.lower ? fr.toLowerCase() : fr) : '');
  }
  function convert(inp) {
    var fo = fmtOpts(inp), from = inp.from === undefined || inp.from === 'auto' ? 'auto' : Number(inp.from), det = null, maxF = Math.max(1, Math.min(64, Number(inp.maxFraction) || 16));
    if (from === 'auto') { det = detect(inp.input); if (!det.ok) return fail(det.error, { empty: !!det.empty }); from = det.base; }
    else if (!BN[from]) return fail('Unknown source base.');
    var p = parseNum(inp.input, from, { frac: true });
    if (!p.ok) return fail(p.error, { empty: !!p.empty });
    var mag = absB(p.v), fn = fromDigits(p.frac, from), fd = p.frac ? BigInt(from) ** BigInt(p.frac.length) : 1n, sign = p.neg ? '-' : '', exact = true, rows = [], out = {}, notes = [];
    [16, 10, 2, 8].forEach(function (b) {
      var fr = fn === 0n ? { digits: '', exact: true } : fracDigits(fn, fd, b, maxF);
      if (!fr.exact) exact = false;
      var t = sign + (fo.prefix ? PFX[b] : '') + fmtBase(mag, fr.digits, b, fo);
      out[b] = { text: t, exact: fr.exact, fraction: fr.digits };
      rows.push([BN[b].charAt(0).toUpperCase() + BN[b].slice(1), t, fr.exact ? (fn === 0n ? '' : 'exact') : 'cut at ' + maxF + ' digits']);
    });
    if (!exact) notes.push('A fraction that does not end in the target base is cut at ' + maxF + ' fractional digits (not rounded). It is exact in the source base only.');
    if (det) notes.unshift('Base detected: ' + BN[from] + '. ' + det.reason);
    if (p.neg) notes.push('Negative numbers are shown as sign and magnitude. For a fixed-width two’s complement pattern use the Signed Hex mode.');
    var steps = [], hx = toB(mag, 16), k;
    if (from !== 10 && p.int.length <= 32) {
      var terms = [], n = p.int.length;
      for (k = 0; k < n; k++) terms.push(HEXD.indexOf(p.int.charAt(k)) + '×' + from + (n - 1 - k === 0 ? '⁰' : '^' + (n - 1 - k)));
      steps.push({ title: 'Place values (' + BN[from] + ' to decimal)', text: p.int + ' = ' + terms.join(' + ') + ' = ' + mag.toString(10) });
    }
    if (from !== 16 && mag > 0n) {
      var lines = [], q = mag;
      for (k = 0; q > 0n && k < 40; k++) { lines.push(q.toString(10) + ' ÷ 16 = ' + (q / 16n).toString(10) + ' remainder ' + (q % 16n) + ' (' + HEXD.charAt(Number(q % 16n)) + ')'); q = q / 16n; }
      if (q > 0n) lines.push('… (first 40 divisions shown)'); else lines.push('Read the remainders from the bottom up: ' + hx);
      steps.push({ title: 'Divide by 16 (whole part to hexadecimal)', text: lines.join('\n') });
    }
    if (hx.length <= 32 || out[16].fraction) {
      var hf = out[16].fraction.toUpperCase(), ml = [], seq = hx.split('').concat(hf ? ['.'].concat(hf.split('')) : []);
      seq.slice(0, 40).forEach(function (c) { ml.push(c === '.' ? '. (point)' : c + '₁₆ = ' + lpad(HEXD.indexOf(c).toString(2), 4, '0') + '₂'); });
      steps.push({ title: 'Each hex digit is exactly four bits', text: ml.join('\n') + '\n\nSo ' + hx + '₁₆ = ' + group(lpad(mag.toString(2), Math.ceil((mag.toString(2).length || 1) / 4) * 4, '0'), 4) + '₂' + (p.neg ? ' (magnitude)' : '') });
    }
    if (fn > 0n && from !== 16) {
      var fl = [], nn = fn, mm;
      for (k = 0; k < Math.min(16, maxF) && nn !== 0n; k++) { mm = nn * 16n; fl.push(nn + '/' + fd + ' × 16 = ' + mm + '/' + fd + ' → digit ' + HEXD.charAt(Number(mm / fd)) + ', fraction ' + (mm % fd) + '/' + fd); nn = mm % fd; }
      steps.push({ title: 'Multiply by 16 (fraction to hexadecimal)', text: fl.join('\n') });
    }
    var res = { ok: true, mode: 'convert', from: from, detected: det, parsed: p, out: out, exact: exact, notes: notes, steps: steps };
    res.view = {
      title: 'Number system converter', expr: (fo.prefix ? PFX[from] : '') + (sign + p.int + (p.frac ? '.' + p.frac : '')) + ' (' + BN[from] + ')',
      big: [{ label: 'Hexadecimal', value: out[16].text }], sub: [{ label: 'Decimal', value: out[10].text }, { label: 'Binary', value: out[2].text }, { label: 'Octal', value: out[8].text }],
      facts: [['Source base', String(from)], ['Bit length (whole part)', String(mag === 0n ? 0 : mag.toString(2).length)], ['Hex digits (whole part)', String(hx.length)]],
      bitrows: [], tables: [{ title: 'All four number systems', head: ['Base', 'Value', 'Fraction'], rows: rows, cur: [0] }], notes: notes, steps: steps, ambiguous: det && det.ambiguous ? det : null
    };
    return res;
  }

  /* ---------- Mode 03: signed hexadecimal ---------- */
  function intWidth(w) { w = Number(w); return Number.isInteger(w) && w >= 2 && w <= 128 ? w : 0; }
  function signedView(w, bits, fo, extra) {
    var m = mask(w), neg = ((bits >> BigInt(w - 1)) & 1n) === 1n, sv = neg ? bits - (1n << BigInt(w)) : bits, hexW = Math.ceil(w / 4), bstr = lpad(bits.toString(2), w, '0');
    var ones = (~bits) & m, twos = ((~bits) + 1n) & m, smin = -(1n << BigInt(w - 1)), smax = (1n << BigInt(w - 1)) - 1n, steps = [];
    var info = { width: w, bits: bits, bitPattern: bstr, hex: H(bits, fo, hexW), oct: lpad(bits.toString(8), Math.ceil(w / 3), '0'), unsigned: bits.toString(10), signed: sv.toString(10), isNegative: neg, signBit: neg ? 1 : 0, onesComplement: H(ones, fo, hexW), twosComplement: H(twos, fo, hexW), minSigned: smin.toString(10), maxSigned: smax.toString(10), minUnsigned: '0', maxUnsigned: m.toString(10) };
    if (neg) steps.push({ title: 'Two’s complement reading', text: 'Sign bit (bit ' + (w - 1) + ') is 1, so the value is negative.\nPattern     ' + bstr + '  (' + H(bits, {}, hexW) + ')\nInvert      ' + lpad(ones.toString(2), w, '0') + '  (' + H(ones, {}, hexW) + ')\nAdd 1       ' + lpad(twos.toString(2), w, '0') + '  (' + H(twos, {}, hexW) + ')\nMagnitude ' + twos.toString(10) + ', so the signed value is −' + twos.toString(10) + '.\nCheck: ' + bits.toString(10) + ' − 2^' + w + ' = ' + sv.toString(10) + '.' });
    else steps.push({ title: 'Reading the pattern', text: 'Sign bit (bit ' + (w - 1) + ') is 0, so the signed and unsigned values agree: ' + sv.toString(10) + '.\nTo write the negative of this value, invert the bits and add 1: ' + H(twos, {}, hexW) + ' is ' + (bits === 0n ? '0' : '−' + bits.toString(10)) + '.' });
    var wrows = [], k, ws = [8, 16, 32, 64];
    ws.forEach(function (x) { if (bits >> BigInt(x) === 0n) { var sgn = ((bits >> BigInt(x - 1)) & 1n) === 1n ? bits - (1n << BigInt(x)) : bits; wrows.push([x + '-bit', H(bits, fo, x / 4), bits.toString(10), sgn.toString(10)]); } });
    var tables = [{ title: 'Range at ' + w + ' bits', head: ['', 'Minimum', 'Maximum'], rows: [['Signed (two’s complement)', info.minSigned, info.maxSigned], ['Unsigned', '0', info.maxUnsigned]], cur: [] }];
    if (wrows.length) tables.push({ title: 'The same pattern at other widths (zero-extended)', head: ['Width', 'Hex', 'Unsigned', 'Signed'], rows: wrows, cur: [] });
    var v = {
      title: 'Signed hexadecimal', expr: info.hex + ' as ' + w + '-bit', big: [{ label: 'Hex pattern (' + w + '-bit)', value: info.hex }, { label: 'Signed decimal', value: info.signed }], sub: [{ label: 'Unsigned', value: info.unsigned }, { label: 'Binary', value: group(bstr, 4) }, { label: 'Octal', value: info.oct }],
      facts: [['Width', w + ' bits'], ['Sign bit', String(info.signBit)], ['One’s complement', info.onesComplement], ['Two’s complement (negated)', info.twosComplement]],
      bitrows: w <= 64 ? [{ label: 'Bits', bits: bstr, sign: true }] : [], tables: tables, notes: [], steps: steps
    };
    return { info: info, view: v };
  }
  function signed(inp) {
    var fo = fmtOpts(inp), w = intWidth(inp.width), mode = inp.mode === 'value' ? 'value' : 'pattern';
    if (!w) return fail('Width must be a whole number of bits from 2 to 128.', { field: 'width' });
    if (mode === 'pattern') {
      var p = parseHexU(inp.text, 'A hex pattern');
      if (!p.ok) return fail(p.error, { empty: !!p.empty });
      var bits = p.v, mk = mask(w), notes = [];
      if (bits > mk) {
        if (!inp.truncate) return fail('The pattern ' + H(bits) + ' needs ' + bits.toString(2).length + ' bits but the width is ' + w + '. Choose a wider width, or tick “truncate to the width”.');
        bits = bits & mk; notes.push('Truncated to the low ' + w + ' bits: ' + H(p.v) + ' → ' + H(bits, {}, Math.ceil(w / 4)) + '.');
      }
      var s = signedView(w, bits, fo); s.view.notes = notes.concat(s.view.notes);
      return { ok: true, mode: 'signed', input: 'pattern', width: w, info: s.info, truncated: notes.length > 0, view: s.view, notes: notes, steps: s.view.steps };
    }
    var d = parseNum(inp.text, 10);
    if (!d.ok) return fail(d.error, { empty: !!d.empty });
    var val = d.v, smin = -(1n << BigInt(w - 1)), smax = (1n << BigInt(w - 1)) - 1n, over = val > smax, under = val < smin, mod = 1n << BigInt(w), pat = ((val % mod) + mod) % mod;
    var sv = signedView(w, pat, fo), warn = [];
    if (over) warn.push('Overflow: ' + val + ' is above the ' + w + '-bit signed maximum ' + smax + (val <= mask(w) ? ' (it fits as an unsigned value: ' + H(val, fo) + ').' : '.') + ' The pattern shown is the wrapped value and reads as ' + sv.info.signed + ' when signed.');
    if (under) warn.push('Underflow: ' + val + ' is below the ' + w + '-bit signed minimum ' + smin + '. The pattern shown is the wrapped value and reads as ' + sv.info.signed + '.');
    sv.view.notes = warn.concat(sv.view.notes); sv.view.expr = val + ' as ' + w + '-bit signed';
    if (!over && !under) sv.view.steps.unshift({ title: 'Encoding the value', text: val >= 0n ? val + ' is non-negative: write it in binary and pad to ' + w + ' bits.' : val + ' is negative: ' + w + ' bits wrap modulo 2^' + w + ', so the pattern is 2^' + w + ' − ' + (-val) + ' = ' + pat + ' = ' + H(pat, {}, Math.ceil(w / 4)) + '.' });
    return { ok: true, mode: 'signed', input: 'value', width: w, info: sv.info, overflow: over, underflow: under, fits: !over && !under, view: sv.view, notes: warn, steps: sv.view.steps };
  }

  /* ---------- Mode 04: bitwise ---------- */
  var BOPS = [['and', 'AND', 2], ['or', 'OR', 2], ['xor', 'XOR', 2], ['nand', 'NAND', 2], ['nor', 'NOR', 2], ['xnor', 'XNOR', 2], ['not', 'NOT', 1], ['shl', 'Shift left (SHL)', 1], ['shr', 'Logical shift right (SHR)', 1], ['sar', 'Arithmetic shift right (SAR)', 1], ['rol', 'Rotate left (ROL)', 1], ['ror', 'Rotate right (ROR)', 1]];
  function bitwise(inp) {
    var fo = fmtOpts(inp), op = inp.op, def = BOPS.filter(function (d) { return d[0] === op; })[0];
    if (!def) return fail('Unknown operation.');
    var a = parseHexU(inp.a, 'A'); if (!a.ok) return fail(a.error, { field: 'a', empty: !!a.empty });
    var b = null; if (def[2] === 2) { b = parseHexU(inp.b, 'B'); if (!b.ok) return fail(b.error, { field: 'b', empty: !!b.empty }); }
    var w, auto = inp.width === undefined || inp.width === 'auto' || inp.width === '';
    if (auto) { var nib = function (q) { return Math.max(q.int.length * 4, Math.ceil(Math.max(q.v.toString(2).length, 1) / 4) * 4); }; w = Math.max(nib(a), b ? nib(b) : 0); }
    else { w = Number(inp.width); if (!Number.isInteger(w) || w < 1 || w > 256) return fail('Width must be a whole number of bits from 1 to 256.', { field: 'width' }); }
    var m = mask(w);
    if (a.v > m) return fail('A needs ' + a.v.toString(2).length + ' bits but the width is ' + w + '. Choose a wider width; operands are never silently cut.', { field: 'a' });
    if (b && b.v > m) return fail('B needs ' + b.v.toString(2).length + ' bits but the width is ' + w + '. Choose a wider width; operands are never silently cut.', { field: 'b' });
    var A = a.v, B = b ? b.v : 0n, R, n = 0, sh = def[0].match(/^(shl|shr|sar|rol|ror)$/);
    if (sh) { n = inp.shift === undefined || inp.shift === '' ? 1 : Number(inp.shift); if (!Number.isInteger(n) || n < 0 || n > w) return fail('Shift amount must be a whole number from 0 to ' + w + '.', { field: 'shift' }); }
    var bn = BigInt(n), sgn = ((A >> BigInt(w - 1)) & 1n) === 1n ? A - (1n << BigInt(w)) : A;
    switch (op) {
      case 'and': R = A & B; break; case 'or': R = A | B; break; case 'xor': R = A ^ B; break;
      case 'nand': R = ~(A & B) & m; break; case 'nor': R = ~(A | B) & m; break; case 'xnor': R = ~(A ^ B) & m; break;
      case 'not': R = ~A & m; break; case 'shl': R = (A << bn) & m; break; case 'shr': R = A >> bn; break; case 'sar': R = (sgn >> bn) & m; break;
      case 'rol': R = ((A << bn) | (A >> (BigInt(w) - bn))) & m; break; case 'ror': R = ((A >> bn) | (A << (BigInt(w) - bn))) & m; break;
    }
    R &= m;
    var hw = Math.ceil(w / 4), sr = ((R >> BigInt(w - 1)) & 1n) === 1n ? R - (1n << BigInt(w)) : R, bs = function (x) { return lpad(x.toString(2), w, '0'); };
    var rows = [{ label: 'A', bits: bs(A) }]; if (b) rows.push({ label: 'B', bits: bs(B) }); rows.push({ label: 'Result', bits: bs(R), ref: bs(A) });
    var sym = { and: 'AND', or: 'OR', xor: 'XOR', nand: 'NAND', nor: 'NOR', xnor: 'XNOR' }[op], hx = function (x) { return H(x, fo, hw); };
    var expr = b ? hx(A) + ' ' + sym + ' ' + hx(B) : def[1].split(' ')[0] === 'NOT' ? 'NOT ' + hx(A) : hx(A) + ' ' + op.toUpperCase() + ' ' + n;
    var notes = []; if (auto) notes.push('Width ' + w + ' bits chosen automatically from the longest operand (leading zeros count). Pick a fixed width to model a register.');
    if (op === 'sar') notes.push('Arithmetic shift right copies the sign bit (bit ' + (w - 1) + ') in, so A is read as ' + sgn + ' and ' + sgn + ' >> ' + n + ' = ' + (sgn >> bn) + '.');
    if (op === 'shr') notes.push('Logical shift right brings in zeros whatever the sign bit is.');
    if (op === 'shl' && ((A << bn) & ~m) !== 0n) notes.push('Bits shifted out of the left end are lost (the result is cut to ' + w + ' bits, as in a register).');
    var fx = [['Width', w + ' bits'], ['Result decimal (unsigned)', R.toString(10)], ['Result decimal (signed)', sr.toString(10)], ['Ones in result', String(popcount(bs(R)))]];
    var res = { ok: true, mode: 'bitwise', op: op, width: w, shift: sh ? n : undefined, aHex: hx(A), bHex: b ? hx(B) : undefined, resultHex: hx(R), aBinary: bs(A), bBinary: b ? bs(B) : undefined, resultBinary: bs(R), resultDecimalUnsigned: R.toString(10), resultDecimalSigned: sr.toString(10), notes: notes };
    res.view = { title: 'Hexadecimal bitwise', expr: expr, big: [{ label: 'Result (hex)', value: hx(R) }], sub: [{ label: 'Decimal', value: R.toString(10) }, { label: 'Signed', value: sr.toString(10) }, { label: 'Binary', value: group(bs(R), 4) }], facts: fx, bitrows: w <= 64 ? rows : [], tables: [], notes: notes, steps: [{ title: 'Bit by bit', text: bitText(rows, def, n) }] };
    return res;
  }
  function bitText(rows, def, n) {
    var t = rows.map(function (r) { return rpad(r.label, 7) + group(r.bits, 4); }); return t.join('\n') + (def[2] === 2 ? '\n\nEach result bit comes from the two bits above it in the same column (' + def[1] + ').' : '\n\nChanged bits are marked in the grid above.');
  }

  /* ---------- Mode 05: digital electronics and memory ---------- */
  function mkView(title, expr, big, facts, tables, notes, steps, extra) { var v = { title: title, expr: expr, big: big, sub: [], facts: facts || [], bitrows: [], tables: tables || [], notes: notes || [], steps: steps || [] }; if (extra) for (var k in extra) v[k] = extra[k]; return v; }
  function parseFields(text, width) {
    var out = [], lines = String(text || '').split(/\r?\n/), i;
    for (i = 0; i < lines.length; i++) {
      var ln = lines[i].trim(); if (!ln) continue;
      var m = ln.match(/^(.*?)[\s,=]*\[?\s*(\d+)\s*(?::\s*(\d+))?\s*\]?$/);
      if (!m || !m[1].trim()) return { error: 'Line ' + (i + 1) + ': write a name and bits, for example “mode 7:4” or “enable 0”.' };
      var msb = Number(m[2]), lsb = m[3] === undefined ? msb : Number(m[3]);
      if (msb < lsb || msb >= width) return { error: 'Field “' + m[1].trim() + '” bits ' + msb + ':' + lsb + ' do not fit in ' + width + ' bits (msb must be ≥ lsb and below the width).' };
      out.push({ name: m[1].trim(), msb: msb, lsb: lsb });
    }
    return { fields: out };
  }
  function register(v) {
    var fo = fmtOpts(v), w = intWidth(v.width); if (!w) return fail('Width must be a whole number of bits from 2 to 128.');
    var p = parseHexU(v.value, 'A register value'); if (!p.ok) return fail(p.error, { empty: !!p.empty });
    if (p.v > mask(w)) return fail('The value needs ' + p.v.toString(2).length + ' bits but the width is ' + w + '. Choose a wider width.');
    var pf = parseFields(v.fields, w); if (pf.error) return fail(pf.error);
    var val = p.v, hw = Math.ceil(w / 4), ft = [], k;
    pf.fields.forEach(function (f) { var fw = f.msb - f.lsb + 1, x = (val >> BigInt(f.lsb)) & mask(fw); ft.push([f.name, f.msb === f.lsb ? '[' + f.msb + ']' : '[' + f.msb + ':' + f.lsb + ']', H(x, fo), lpad(x.toString(2), fw, '0'), x.toString(10)]); });
    var tables = []; if (ft.length) tables.push({ title: 'Bit fields', head: ['Field', 'Bits', 'Hex', 'Binary', 'Decimal'], rows: ft, cur: [] });
    var notes = [], after = val, editRow = null;
    if (v.edit && v.edit !== 'none') {
      var ix = Number(v.index); if (!Number.isInteger(ix) || ix < 0 || ix >= w) return fail('Bit index must be a whole number from 0 to ' + (w - 1) + '.');
      var mk = 1n << BigInt(ix);
      after = v.edit === 'set' ? val | mk : v.edit === 'clear' ? val & ~mk & mask(w) : val ^ mk;
      var opn = v.edit === 'set' ? 'OR ' + H(mk, {}, hw) : v.edit === 'clear' ? 'AND NOT ' + H(mk, {}, hw) + ' = AND ' + H(~mk & mask(w), {}, hw) : 'XOR ' + H(mk, {}, hw);
      tables.push({ title: v.edit.charAt(0).toUpperCase() + v.edit.slice(1) + ' bit ' + ix, head: ['', 'Hex', 'Binary'], rows: [['Before', H(val, fo, hw), group(lpad(val.toString(2), w, '0'), 4)], ['Mask', H(mk, fo, hw), group(lpad(mk.toString(2), w, '0'), 4)], ['After', H(after, fo, hw), group(lpad(after.toString(2), w, '0'), 4)]], cur: [2] });
      notes.push('Operation: ' + H(val, {}, hw) + ' ' + opn + ' = ' + H(after, {}, hw) + '.'); editRow = { label: 'After', bits: lpad(after.toString(2), w, '0'), ref: lpad(val.toString(2), w, '0') };
    }
    var rows = [{ label: 'Value', bits: lpad(val.toString(2), w, '0'), clickable: true }]; if (editRow) rows.push(editRow);
    var res = { ok: true, mode: 'register', width: w, valueHex: H(val, fo, hw), afterHex: H(after, fo, hw), fields: ft, view: mkView('Register value decoder', H(val, fo, hw) + ' (' + w + '-bit)', [{ label: editRow ? 'After (hex)' : 'Value (hex)', value: H(after, fo, hw) }], [['Decimal (unsigned)', val.toString(10)], ['Ones', String(popcount(val.toString(2)))], ['Width', w + ' bits']], tables, notes, []) };
    res.view.bitrows = w <= 64 ? rows : []; res.view.sub = [{ label: 'Decimal', value: after.toString(10) }, { label: 'Binary', value: group(lpad(after.toString(2), w, '0'), 4) }];
    return res;
  }
  function memory(v) {
    var fo = fmtOpts(v), b = parseHexU(v.base, 'The base address'); if (!b.ok) return fail(b.error, { empty: !!b.empty });
    var off = 0n; if (String(v.offset || '').trim()) { var o = parseHexU(v.offset, 'The offset'); if (!o.ok) return fail(o.error); off = o.v; }
    var ix = String(v.index == null || v.index === '' ? 0 : v.index).trim(), st = String(v.stride == null || v.stride === '' ? 1 : v.stride).trim();
    if (!/^\d+$/.test(ix) || !/^\d+$/.test(st)) return fail('Index and stride must be whole numbers of 0 or more (decimal).');
    var addr = b.v + off + BigInt(ix) * BigInt(st), aw = Number(v.addrWidth) || 0, notes = [];
    if (aw && addr > mask(aw)) return fail('Address ' + H(addr) + ' does not fit in a ' + aw + '-bit address space (maximum ' + H(mask(aw)) + ').');
    var hw = aw ? aw / 4 : 0, bytes = toB(addr, 16); if (bytes.length % 2) bytes = '0' + bytes; bytes = bytes.match(/../g);
    var res = { ok: true, mode: 'memory', addressHex: toB(addr, 16), addressDecimal: addr.toString(10), addressBinary: addr.toString(2), bytes: bytes };
    res.view = mkView('Memory address calculator', H(b.v, fo) + ' + ' + H(off, fo) + ' + ' + ix + ' × ' + st, [{ label: 'Address (hex)', value: H(addr, fo, hw) }], [['Decimal', addr.toString(10)], ['Binary', group(lpad(addr.toString(2), hw * 4, '0'), 4)], ['Bytes (big-endian)', bytes.join(' ')], ['Bytes (little-endian)', bytes.slice().reverse().join(' ')]], [], notes, [{ title: 'Working', text: 'address = base + offset + index × stride\n        = ' + H(b.v) + ' + ' + H(off) + ' + ' + ix + ' × ' + st + '\n        = ' + H(b.v) + ' + ' + H(off) + ' + ' + H(BigInt(ix) * BigInt(st)) + '\n        = ' + H(addr) }]);
    return res;
  }
  function bytesTool(v) {
    var fo = fmtOpts(v), p = parseHexU(v.value, 'The value'); if (!p.ok) return fail(p.error, { empty: !!p.empty });
    var hx = toB(p.v, 16); if (hx.length % 2) hx = '0' + hx;
    var nb = Number(v.bytes) || 0; if (nb) { if (hx.length > nb * 2) return fail('The value does not fit in ' + nb + ' bytes.'); hx = lpad(hx, nb * 2, '0'); }
    var by = hx.match(/../g), tn = by.length, sizes = [['Byte', 1], ['Word', 2], ['Double word', 4], ['Quad word', 8]], rows = [];
    sizes.forEach(function (s) { var pad = lpad(hx, Math.ceil(tn / s[1]) * s[1] * 2, '0'), gs = pad.match(new RegExp('.{' + s[1] * 2 + '}', 'g')); rows.push([s[0] + ' (' + s[1] + ')', gs.map(function (g) { return fo.lower ? g.toLowerCase() : g; }).join(' '), gs.map(function (g) { return BigInt('0x' + g).toString(10); }).join(' ')]); });
    var le = by.slice().reverse().join(''), res = { ok: true, mode: 'bytes', bigEndianHex: by.join(''), littleEndianHex: le, bytes: by, groups: rows };
    var L = function (s) { return fo.lower ? s.toLowerCase() : s; };
    res.view = mkView('Byte grouping and endianness', L(by.join('')) + ' (' + tn + ' bytes)', [{ label: 'Big-endian (as written)', value: (fo.prefix ? '0x' : '') + L(by.join('')) }, { label: 'Little-endian (bytes swapped)', value: (fo.prefix ? '0x' : '') + L(le) }], [['Byte count', String(tn)], ['Memory order, big-endian', L(by.join(' '))], ['Memory order, little-endian', L(by.slice().reverse().join(' '))], ['Decimal (big-endian)', p.v.toString(10)], ['Decimal (little-endian)', BigInt('0x' + le).toString(10)]], [{ title: 'Grouping (most significant first)', head: ['Size', 'Hex groups', 'Decimal'], rows: rows, cur: [] }], tn > 1 ? [] : ['A single byte is the same in both byte orders.'], []);
    return res;
  }
  function asciiTool(v) {
    var enc = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
    if (v.dir === 'hex') {
      var c = String(v.text || '').replace(/0x/gi, '').replace(/[\s,_]/g, ''); if (!c) return fail('Enter hex bytes.', { empty: true });
      if (!/^[0-9A-Fa-f]+$/.test(c)) return fail('Hex bytes use 0 to 9 and A to F only.'); if (c.length % 2) return fail('Hex bytes need an even number of digits (two per byte).');
      var arr = c.match(/../g).map(function (x) { return parseInt(x, 16); }), s, notes = [];
      try { s = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(arr)); } catch (e) { s = arr.map(function (x) { return String.fromCharCode(x); }).join(''); notes.push('The bytes are not valid UTF-8, so each byte is shown as one Latin-1 character.'); }
      var dump = arr.map(function (x) { return x >= 32 && x < 127 ? String.fromCharCode(x) : '.'; }).join('');
      return { ok: true, mode: 'ascii', text: s, view: mkView('Hex to ASCII', arr.length + ' bytes', [{ label: 'Text', value: s }], [['Printable view', dump], ['Bytes', String(arr.length)], ['Decimal', arr.join(' ')]], [], notes, []) };
    }
    if (!String(v.text || '').length) return fail('Enter some text.', { empty: true });
    var bytes = Array.from(enc.encode(String(v.text))), fo = fmtOpts(v), hx = bytes.map(function (b) { var s2 = lpad(b.toString(16).toUpperCase(), 2, '0'); return fo.lower ? s2.toLowerCase() : s2; }).join(' ');
    return { ok: true, mode: 'ascii', hex: hx, bytes: bytes, view: mkView('ASCII to hex', bytes.length + ' bytes (UTF-8)', [{ label: 'Hex bytes', value: hx }], [['Decimal', bytes.join(' ')], ['Binary', bytes.map(function (b) { return lpad(b.toString(2), 8, '0'); }).join(' ')], ['Bytes', String(bytes.length)]], [], bytes.some(function (b) { return b > 127; }) ? ['Characters outside ASCII are written as their UTF-8 bytes.'] : [], []) };
  }
  function rgbTool(v) {
    var fo = fmtOpts(v);
    if (v.dir === 'rgb') {
      var vals = String(v.text || '').trim().split(/[\s,]+/).filter(Boolean); if (!vals.length) return fail('Enter red, green and blue (0 to 255).', { empty: true });
      if (vals.length !== 3 || !vals.every(function (x) { return /^\d+$/.test(x) && Number(x) <= 255; })) return fail('Enter three whole numbers from 0 to 255, for example 170 187 204.');
      var h = '#' + vals.map(function (x) { var s = lpad(Number(x).toString(16).toUpperCase(), 2, '0'); return fo.lower ? s.toLowerCase() : s; }).join('');
      return { ok: true, mode: 'rgb', hex: h, view: mkView('RGB to hex', 'rgb(' + vals.map(Number).join(', ') + ')', [{ label: 'Hex colour', value: h }], [['Decimal', vals.join(', ')]], [], [], [], { swatch: h }) };
    }
    var c = String(v.text || '').trim().replace(/^#/, '').replace(/^0x/i, ''); if (!c) return fail('Enter a 3 or 6 digit hex colour.', { empty: true });
    if (!/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(c)) return fail('Expected a 3 or 6 digit hex colour such as #AABBCC or ABC.');
    if (c.length === 3) c = c.split('').map(function (x) { return x + x; }).join('');
    var r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16), hh = '#' + up(c);
    return { ok: true, mode: 'rgb', r: r, g: g, b: b, view: mkView('Hex to RGB', hh, [{ label: 'RGB', value: r + ', ' + g + ', ' + b }], [['Hex colour', hh], ['Red', r + ' (' + lpad(r.toString(16).toUpperCase(), 2, '0') + ')'], ['Green', g + ' (' + lpad(g.toString(16).toUpperCase(), 2, '0') + ')'], ['Blue', b + ' (' + lpad(b.toString(16).toUpperCase(), 2, '0') + ')']], [], [], [], { swatch: hh }) };
  }
  /* Named checksums. Each states its polynomial, initial value, final XOR and reflection, so the result can be reproduced. */
  function crc16Reflected(bytes, init, poly) { var crc = init, i, j; for (i = 0; i < bytes.length; i++) { crc ^= bytes[i]; for (j = 0; j < 8; j++) crc = crc & 1 ? (crc >>> 1) ^ poly : crc >>> 1; } return crc & 0xffff; }
  function crc16Ccitt(bytes) { var crc = 0xffff, i, j; for (i = 0; i < bytes.length; i++) { crc ^= bytes[i] << 8; for (j = 0; j < 8; j++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff; } return crc; }
  function crc32(bytes) { var crc = 0xffffffff, i, j; for (i = 0; i < bytes.length; i++) { crc ^= bytes[i]; for (j = 0; j < 8; j++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1; } return (crc ^ 0xffffffff) >>> 0; }
  function sum8(bytes) { var s = 0, i; for (i = 0; i < bytes.length; i++) s = (s + bytes[i]) & 0xff; return s; }
  var CRCS = [
    ['CRC-16/IBM (ARC)', 2, function (b) { return crc16Reflected(b, 0, 0xa001); }, 'Poly 0x8005 (reflected 0xA001), init 0x0000, reflected, final XOR 0x0000'],
    ['CRC-16/MODBUS', 2, function (b) { return crc16Reflected(b, 0xffff, 0xa001); }, 'Poly 0x8005 (reflected 0xA001), init 0xFFFF, reflected, final XOR 0x0000. On a Modbus RTU frame the low byte is sent first.'],
    ['CRC-16/CCITT-FALSE', 2, crc16Ccitt, 'Poly 0x1021, init 0xFFFF, not reflected, final XOR 0x0000'],
    ['CRC-32', 4, crc32, 'Poly 0x04C11DB7 (reflected 0xEDB88320), init 0xFFFFFFFF, reflected, final XOR 0xFFFFFFFF'],
    ['Sum-8 (not a CRC)', 1, sum8, 'Plain additive checksum: the sum of all bytes modulo 256'],
    ['Two’s-complement sum-8 (LRC)', 1, function (b) { return (256 - sum8(b)) & 0xff; }, 'Negated sum of all bytes modulo 256, as in Intel HEX records and Modbus ASCII; adding it to the byte sum gives 00']
  ];
  function checksumTool(v) {
    var bytes, fo = fmtOpts(v);
    if (v.kind === 'hex') {
      var c = String(v.text || '').replace(/0x/gi, '').replace(/[\s,_]/g, ''); if (!c) return fail('Enter hex bytes.', { empty: true });
      if (!/^[0-9A-Fa-f]+$/.test(c)) return fail('Hex bytes use 0 to 9 and A to F only.'); if (c.length % 2) return fail('Hex bytes need an even number of digits (two per byte).');
      bytes = c.match(/../g).map(function (x) { return parseInt(x, 16); });
    } else { if (!String(v.text || '').length) return fail('Enter some text.', { empty: true }); bytes = Array.from(new TextEncoder().encode(String(v.text))); }
    var rows = [], out = {}; CRCS.forEach(function (d) { var x = d[2](bytes), s = lpad(x.toString(16).toUpperCase(), d[1] * 2, '0'); if (fo.lower) s = s.toLowerCase(); out[d[0]] = s; rows.push([d[0], (fo.prefix ? '0x' : '') + s, String(x), d[3]]); });
    return { ok: true, mode: 'checksum', values: out, bytes: bytes.length, view: mkView('Checksums', bytes.length + ' bytes', [{ label: rows[0][0], value: rows[0][1] }, { label: rows[3][0], value: rows[3][1] }], [['Bytes', String(bytes.length)]], [{ title: 'Named algorithms and their parameters', head: ['Algorithm', 'Hex', 'Decimal', 'Parameters'], rows: rows, cur: [] }], ['Check value: the ASCII text 123456789 gives CRC-16/IBM BB3D, CRC-16/MODBUS 4B37, CRC-16/CCITT-FALSE 29B1 and CRC-32 CBF43926. A simple sum is not a CRC and is labelled as such.'], []) };
  }
  var TOOLS = { register: register, memory: memory, bytes: bytesTool, ascii: asciiTool, rgb: rgbTool, checksum: checksumTool };
  function tool(name, vals) { var f = TOOLS[name]; if (!f) return fail('Unknown tool.'); try { return f(vals || {}); } catch (e) { return fail('That input could not be processed: ' + e.message); } }

  /* ---------- exports ---------- */
  function flat(res) { var v = res.view, o = []; (v.big || []).concat(v.sub || []).forEach(function (x) { o.push([x.label, x.value]); }); (v.facts || []).forEach(function (f) { o.push([f[0], f[1]]); }); return o; }
  function exportTxt(res) {
    var v = res.view, t = ['Elecmetric Hex Calculator: ' + v.title, v.expr, ''];
    flat(res).forEach(function (x) { t.push(x[0] + ': ' + x[1]); });
    (v.tables || []).forEach(function (tb) { t.push('', tb.title); t.push(tb.head.join(' | ')); tb.rows.forEach(function (r) { t.push(r.join(' | ')); }); });
    (v.notes || []).forEach(function (n) { t.push('', n); });
    (v.steps || []).forEach(function (s) { t.push('', s.title, s.text); });
    return t.join('\n') + '\n';
  }
  function csvCell(c) { c = String(c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }
  function exportCsv(res) {
    var v = res.view, t = [['item', 'value']].concat(flat(res));
    (v.tables || []).forEach(function (tb) { t.push([]); t.push([tb.title]); t.push(tb.head); tb.rows.forEach(function (r) { t.push(r); }); });
    return t.map(function (r) { return r.map(csvCell).join(','); }).join('\n') + '\n';
  }
  function exportJson(res) {
    var v = res.view, results = {}; flat(res).forEach(function (x) { results[x[0]] = x[1]; });
    return JSON.stringify({ calculator: 'Elecmetric Hex Calculator', mode: v.title, expression: v.expr, results: results, tables: (v.tables || []).map(function (tb) { return { title: tb.title, columns: tb.head, rows: tb.rows }; }), notes: v.notes || [], steps: (v.steps || []).map(function (s) { return { title: s.title, text: s.text }; }) }, null, 2);
  }

  root.HexCalc = { OPS: OPS, BOPS: BOPS, PADS: PADS, MAXD: MAXD, MAXN: MAXN, arith: arith, convert: convert, detect: detect, signed: signed, bitwise: bitwise, tool: tool, parseNum: parseNum, exportTxt: exportTxt, exportCsv: exportCsv, exportJson: exportJson };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.HexCalc;
})(typeof globalThis !== 'undefined' ? globalThis : this);
