/* Elecmetric Binary Calculator, Mode 01: Binary Arithmetic. Engine: one file, no dependencies, no DOM.
   Required by tests/binarith_test.js and inlined into calculators/binary-arithmetic-calculator/index.html by tools/binarith_page.js.

   Arbitrary precision (BigInt): no width limit and no overflow. Operands are binary text with an optional sign (+, -, or the minus sign), an optional 0b prefix,
   leading zeros and grouping spaces or underscores. Operations: add, subtract and multiply take 2 to 20 operands (evaluated left to right); divide takes exactly two.
   Division truncates toward zero and always reports the quotient and the remainder; the remainder takes the sign of the dividend (so A = Q x B + R always holds).
   The result is never silently narrowed: leading-zero padding only ever widens the displayed pattern.
   The written working (carry and borrow rows, partial products, long division) is produced by the column algorithms below, and every step is checked against
   exact BigInt arithmetic; a mismatch is an engine error, not a wrong answer shown to the user. Fixed-width, wrap-around and overflow behaviour belong to the
   Binary Calculator and Logic Gates page and the signed binary mode, not here. */
(function (root) {
  'use strict';
  var MAXD = 4096, MAXN = 20, TABLE_BITS = 256, PP_ROWS = 64;
  var OPS = [['add', '+', 'Addition'], ['sub', '-', 'Subtraction'], ['mul', '×', 'Multiplication'], ['div', '÷', 'Division']];
  var PADS = ['min', 'match', '4', '8', '16', '32', '64'];

  function lpad(s, n, c) { s = String(s); c = c || '0'; while (s.length < n) s = c + s; return s; }
  function rpad(s, n) { s = String(s); while (s.length < n) s += ' '; return s; }
  function absB(v) { return v < 0n ? -v : v; }
  function bits(m) { return m.toString(2); }
  function popcount(s) { var n = 0, i; for (i = 0; i < s.length; i++) if (s.charAt(i) === '1') n++; return n; }
  function blank(s) { var i = 0; while (i < s.length - 1 && s.charAt(i) === '0') i++; return lpad('', i, ' ') + s.slice(i); }

  /* parseBinary(text): { ok, v (BigInt), neg, digits (as typed, signs and separators removed), width } or { ok:false, empty?, error } */
  function parseBinary(text) {
    var s = String(text == null ? '' : text).trim().replace(/[\s_,]/g, '');
    if (!s) return { ok: false, empty: true, error: 'Enter a binary number.' };
    var neg = false, m = s.match(/^[+\-−]/);
    if (m) { neg = m[0] !== '+'; s = s.slice(1); }
    s = s.replace(/^0b/i, '');
    if (!s) return { ok: false, error: 'Add binary digits after the sign or prefix.' };
    var bad = s.match(/[^01]/);
    if (bad) return { ok: false, error: '‘' + bad[0] + '’ is not a binary digit. Binary numbers use only 0 and 1.' };
    if (s.length > MAXD) return { ok: false, error: 'The number has ' + s.length + ' digits. The limit is ' + MAXD + '.' };
    var mag = BigInt('0b' + s);
    if (mag === 0n) neg = false;
    return { ok: true, v: neg ? -mag : mag, neg: neg, digits: s, width: s.length };
  }

  /* Column addition of two magnitudes (minimal binary strings). The carry row has n+1 characters: character k from the right is the carry INTO column k. */
  function colAdd(a, b) {
    var n = Math.max(a.length, b.length), x = lpad(a, n), y = lpad(b, n), c = 0, out = '', carry = '', i;
    for (i = n - 1; i >= 0; i--) { carry = c + carry; var t = Number(x.charAt(i)) + Number(y.charAt(i)) + c; out = (t & 1) + out; c = t >> 1; }
    return { sum: c + out, carry: c + carry, n: n, x: x, y: y };
  }
  /* Column subtraction, a >= b. The borrow row has n characters: character k from the right is the borrow INTO column k. */
  function colSub(a, b) {
    var n = a.length, x = a, y = lpad(b, n), bw = 0, out = '', row = '', i;
    for (i = n - 1; i >= 0; i--) { row = bw + row; var t = Number(x.charAt(i)) - Number(y.charAt(i)) - bw; if (t < 0) { t += 2; bw = 1; } else bw = 0; out = t + out; }
    return { diff: out, borrow: row, n: n, x: x, y: y, final: bw };
  }
  var PRE = '        ';
  function row(label, s) { return lpad(label, PRE.length - 1, ' ') + ' ' + s; }

  function addLayout(a, b) {
    var r = colAdd(a, b), W = r.n + 1, rule = lpad('', W, '-');
    return { r: r, text: [row('carry', r.carry), row('', blank(lpad(r.x, W))), row('+', blank(lpad(r.y, W))), row('', rule), row('=', blank(r.sum))].join('\n') };
  }
  function subLayout(a, b) {
    var r = colSub(a, b), W = r.n, rule = lpad('', W, '-');
    return { r: r, text: [row('borrow', r.borrow), row('', blank(r.x)), row('-', blank(r.y)), row('', rule), row('=', blank(r.diff))].join('\n') };
  }
  function mulLayout(a, b, product) {
    if (b.length > PP_ROWS || a.length + b.length > TABLE_BITS) return null;
    var W = a.length + b.length, lines = [row('', lpad(a, W, ' ') ), row('×', lpad(b, W, ' ')), row('', lpad('', W, '-'))], j;
    for (j = 0; j < b.length; j++) {
      var bit = b.charAt(b.length - 1 - j), pp = (bit === '1' ? a : lpad('', a.length, '0')) + lpad('', j, ' ');
      lines.push(row(j === 0 ? 'bit ' + j : 'bit ' + j, lpad(pp, W, ' ')));
    }
    lines.push(row('', lpad('', W, '-'))); lines.push(row('=', blank(lpad(product, W))));
    return lines.join('\n');
  }
  function longDiv(a, d) {
    var rem = 0n, q = '', rows = [], i;
    for (i = 0; i < a.length; i++) {
      rem = (rem << 1n) | BigInt(a.charAt(i)); var before = rem, qb = rem >= d ? 1 : 0; if (qb) rem -= d;
      rows.push([String(i + 1), a.charAt(i), bits(before), qb ? 'yes' : 'no', String(qb), bits(rem)]); q += qb;
    }
    return { q: q, rem: rem, rows: rows };
  }
  function divTable(rows) {
    var head = ['#', 'Bit down', 'Partial remainder', '>= divisor?', 'Quotient bit', 'Remainder after'], w = head.map(function (h, c) { return Math.max(h.length, rows.reduce(function (m, r) { return Math.max(m, r[c].length); }, 0)); });
    var line = function (r) { return r.map(function (v, c) { return lpad(v, w[c], ' '); }).join('  '); };
    return [line(head), w.map(function (n) { return lpad('', n, '-'); }).join('  ')].concat(rows.map(line)).join('\n');
  }

  function describe(v, padW) {
    var neg = v < 0n, m = absB(v), b = bits(m), p = lpad(b, padW);
    return { neg: neg, zero: v === 0n, bits: (neg ? '-' : '') + b, padded: (neg ? '-' : '') + p, dec: v.toString(), hex: (neg ? '-' : '') + m.toString(16).toUpperCase(), oct: (neg ? '-' : '') + m.toString(8), bitLength: v === 0n ? 0 : b.length, ones: popcount(b), zeros: v === 0n ? 0 : b.length - popcount(b) };
  }
  function placeValue(digits) {
    if (digits.length > 16) return '';
    var terms = [], i, n = digits.length; for (i = 0; i < n; i++) if (digits.charAt(i) === '1') terms.push(String(Math.pow(2, n - 1 - i)));
    return terms.length ? terms.join(' + ') : '0';
  }
  var sgn = function (v) { return v < 0n ? '-' : ''; };
  var show = function (v) { return (v < 0n ? '-' : '') + bits(absB(v)); };

  /* One pair of numbers as a signed addition, written with column working. Returns { value, text, data }. y is already negated for subtraction. */
  function addPair(x, y, subtracting, bLabel) {
    var ax = bits(absB(x)), ay = bits(absB(y)), val = x + y, text, data, why;
    var sameOrZero = x === 0n || y === 0n || (x < 0n) === (y < 0n);
    if (sameOrZero) {
      var L = addLayout(ax, ay); data = { kind: 'add', x: ax, y: ay, row: L.r.carry, sum: L.r.sum.replace(/^0+(?=.)/, '') };
      why = (x === 0n || y === 0n) && (x < 0n) !== (y < 0n) ? 'One value is zero, so add the magnitudes.' : (x < 0n ? 'Both are negative: add the magnitudes and keep the minus sign.' : 'Add the columns from the right.');
      text = why + '\n' + L.text + (x < 0n || y < 0n ? '\n' + row('', 'sign of result: ' + (val < 0n ? 'negative' : 'positive')) : '');
      if (BigInt('0b' + data.sum) !== absB(val)) throw new Error('internal check failed: addition');
    } else {
      var big = absB(x) >= absB(y) ? ax : ay, small = absB(x) >= absB(y) ? ay : ax;
      var S = subLayout(big, small); data = { kind: 'sub', x: big, y: small, row: S.r.borrow, sum: S.r.diff.replace(/^0+(?=.)/, '') };
      why = (subtracting ? 'Subtracting a number is the same as adding its negative. ' : '') + 'The signs differ, so subtract the smaller magnitude from the larger and keep the sign of the larger: ' + big + ' - ' + small + '.';
      text = why + '\n' + S.text + '\n' + row('', 'sign of result: ' + (val < 0n ? 'negative' : val === 0n ? 'zero' : 'positive'));
      if (S.r.final !== 0 || BigInt('0b' + data.sum) !== absB(val)) throw new Error('internal check failed: subtraction');
    }
    return { value: val, text: text, data: data };
  }

  function run(o) {
    o = o || {};
    var def = OPS.filter(function (d) { return d[0] === o.op; })[0];
    if (!def) return { ok: false, error: 'Unknown operation.' };
    var inp = o.operands;
    if (!Array.isArray(inp) || inp.length < 2) return { ok: false, error: 'Enter at least two numbers.' };
    if (inp.length > MAXN) return { ok: false, error: 'At most ' + MAXN + ' numbers.' };
    if (o.op === 'div' && inp.length !== 2) return { ok: false, error: 'Division takes exactly two numbers (dividend and divisor).' };
    var pad = o.pad == null ? 'min' : String(o.pad);
    if (PADS.indexOf(pad) < 0) return { ok: false, error: 'Unknown padding option.' };
    var P = [], i;
    for (i = 0; i < inp.length; i++) { var p = parseBinary(inp[i]); if (!p.ok) { p.field = i; return p; } P.push(p); }
    var padW = pad === 'min' ? 0 : pad === 'match' ? Math.max.apply(null, P.map(function (q) { return q.width; })) : Number(pad);
    var steps = [], stepData = [], notes = [], res = { ok: true, op: o.op, symbol: def[1], name: def[2], count: P.length, padWidth: padW };
    res.operands = P.map(function (q, k) {
      var d = describe(q.v, 0), pv = placeValue(bits(absB(q.v)));
      return { index: k, typed: q.digits, neg: q.neg, width: q.width, bits: d.bits, dec: d.dec, hex: d.hex, oct: d.oct, bitLength: d.bitLength, placeValue: pv, leadingZeros: q.width - (q.v === 0n ? 1 : bits(absB(q.v)).length) };
    });
    var expect, t;
    if (o.op === 'add' || o.op === 'sub') {
      var acc = P[0].v;
      for (i = 1; i < P.length; i++) {
        var y = o.op === 'add' ? P[i].v : -P[i].v, pr = addPair(acc, y, o.op === 'sub', i);
        var shownY = P[i].v, lbl = P.length > 2 ? 'Step ' + i + ' of ' + (P.length - 1) + ': ' : '';
        steps.push({ title: lbl + show(acc) + ' ' + def[1] + ' ' + (shownY < 0n ? '(' + show(shownY) + ')' : show(shownY)) + ' = ' + show(pr.value), text: pr.text, decimal: acc + ' ' + def[1] + ' ' + (shownY < 0n ? '(' + shownY + ')' : shownY) + ' = ' + pr.value });
        stepData.push(pr.data); acc = pr.value;
      }
      expect = P.slice(1).reduce(function (s, q) { return o.op === 'add' ? s + q.v : s - q.v; }, P[0].v);
      if (acc !== expect) throw new Error('internal check failed: ' + o.op);
      res.value = acc;
      steps.unshift({ title: o.op === 'add' ? 'How binary addition works' : 'How binary subtraction works', text: o.op === 'add' ? 'Work from the right, one column at a time: 0+0 = 0, 0+1 = 1, 1+1 = 10 (write 0, carry 1) and 1+1+1 = 11 (write 1, carry 1).' + (P.length > 2 ? '\nWith more than two numbers, they are added left to right, keeping a running total.' : '') : 'Work from the right, one column at a time: 1-1 = 0, 1-0 = 1, 0-0 = 0 and 0-1 needs a borrow (write 1, borrow 1 from the next column).' + (P.length > 2 ? '\nWith more than two numbers, each is subtracted from the running total in turn, left to right.' : '') });
    } else if (o.op === 'mul') {
      var prod = P[0].v;
      for (i = 1; i < P.length; i++) {
        var nxt = prod * P[i].v, am = bits(absB(prod)), bm = bits(absB(P[i].v)), lay = mulLayout(am, bm, bits(absB(nxt)));
        var neg = nxt < 0n, lb = P.length > 2 ? 'Step ' + i + ' of ' + (P.length - 1) + ': ' : '';
        var body = lay ? lay + '\n' + row('', 'sign of result: ' + (neg ? 'negative (the signs differ)' : nxt === 0n ? 'zero' : 'positive')) : 'The partial-product layout is shown for up to ' + PP_ROWS + ' multiplier bits and ' + TABLE_BITS + ' product bits. This product is larger, so only the exact result is given: ' + show(nxt) + '.';
        steps.push({ title: lb + show(prod) + ' × ' + (P[i].v < 0n ? '(' + show(P[i].v) + ')' : show(P[i].v)) + ' = ' + show(nxt), text: body, decimal: prod + ' × ' + (P[i].v < 0n ? '(' + P[i].v + ')' : P[i].v) + ' = ' + nxt });
        stepData.push({ kind: 'mul', x: am, y: bm, rows: lay ? bm.length : 0, product: bits(absB(nxt)) });
        if (nxt !== prod * P[i].v) throw new Error('internal check failed: mul'); prod = nxt;
      }
      res.value = prod;
      steps.unshift({ title: 'How binary multiplication works', text: 'For each bit of the multiplier, starting at the right, write the multiplicand if the bit is 1 or zero if it is 0, shifted one place further left each time. Then add the partial products. The product is negative when exactly one number is negative.' + (P.length > 2 ? '\nWith more than two numbers, they are multiplied left to right.' : '') });
    } else {
      var A = P[0].v, B = P[1].v;
      if (B === 0n) return { ok: false, field: 1, error: 'Division by zero is undefined.' };
      var q = A / B, r = A % B;
      if (q * B + r !== A) throw new Error('internal check failed: div');
      var am2 = bits(absB(A)), bm2 = bits(absB(B)), tabNote;
      if (am2.length <= TABLE_BITS) {
        var L2 = longDiv(am2, absB(B)); if (BigInt('0b' + L2.q) !== absB(q) || L2.rem !== absB(r)) throw new Error('internal check failed: long division');
        tabNote = 'Divisor |B| = ' + bm2 + '. For each bit of |A| = ' + am2 + ' brought down, subtract the divisor when the partial remainder is at least as large.\n' + divTable(L2.rows) + '\nQuotient |Q| = ' + L2.q.replace(/^0+(?=.)/, '') + ', remainder |R| = ' + bits(L2.rem) + '.';
        stepData.push({ kind: 'div', x: am2, y: bm2, rows: L2.rows.length, quotient: L2.q.replace(/^0+(?=.)/, ''), remainder: bits(L2.rem) });
      } else { tabNote = 'The long-division table is shown for dividends up to ' + TABLE_BITS + ' bits. This one is longer, so only the exact quotient and remainder are given.'; stepData.push({ kind: 'div', x: am2, y: bm2, rows: 0, quotient: bits(absB(q)), remainder: bits(absB(r)) }); }
      steps.push({ title: 'How binary long division works', text: 'Bring down one bit at a time. Whenever the partial remainder is at least the divisor, write 1 in the quotient and subtract the divisor; otherwise write 0. What is left at the end is the remainder, so nothing is rounded away.' });
      steps.push({ title: show(A) + ' ÷ ' + (B < 0n ? '(' + show(B) + ')' : show(B)) + ': quotient ' + show(q) + ', remainder ' + show(r), text: tabNote + '\n\nSigns: the quotient is negative when A and B have different signs, and the remainder takes the sign of A (division truncates toward zero). ' + (A < 0n || B < 0n ? 'Applied here: Q = ' + show(q) + ', R = ' + show(r) + '.' : 'Both numbers are positive here.') });
      steps.push({ title: 'Check: Q × B + R = A', text: show(q) + ' × ' + (B < 0n ? '(' + show(B) + ')' : show(B)) + ' + ' + (r < 0n ? '(' + show(r) + ')' : show(r)) + ' = ' + show(q * B + r) + '\nIn decimal: ' + q + ' × ' + B + ' + ' + r + ' = ' + (q * B + r) });
      res.value = q; res.remainder = describe(r, padW); res.remainder.value = r.toString();
    }
    res.result = describe(res.value, padW);
    res.signedValue = res.value.toString();
    if (res.remainder) { res.quotient = res.result; }
    res.steps = steps; res.stepData = stepData;
    if (P.some(function (q, k) { return res.operands[k].leadingZeros > 0; })) notes.push('Leading zeros do not change a value, so 0101 is the same number as 101.');
    if (res.value < 0n) notes.push('Negative results are written with a minus sign (sign and magnitude), not as a fixed-width two’s complement pattern. Use the signed binary mode for two’s complement.');
    if (padW > 0 && res.result.bitLength > padW) notes.push('The result needs ' + res.result.bitLength + ' bits, more than the ' + padW + ' selected, so it is shown in full. Nothing is truncated.');
    if (o.op === 'div') notes.push('The remainder is reported, never discarded: A = Q × B + R. For fixed-width integer division in a register, use the Binary Calculator and Logic Gates page.');
    res.notes = notes;
    return res;
  }

  /* Plain-text, CSV and JSON exports of a run() result. */
  function exportTxt(r) {
    var L = ['Elecmetric Binary Calculator: Binary Arithmetic (' + r.name + ')', ''];
    L.push('Expression: ' + r.operands.map(function (x) { return x.bits; }).join(' ' + r.symbol + ' '));
    L.push('Decimal   : ' + r.operands.map(function (x) { return x.dec; }).join(' ' + r.symbol + ' '));
    L.push(''); L.push(r.quotient ? 'Quotient  : ' + r.result.padded + '  (decimal ' + r.result.dec + ', hex ' + r.result.hex + ', octal ' + r.result.oct + ')' : 'Result    : ' + r.result.padded + '  (decimal ' + r.result.dec + ', hex ' + r.result.hex + ', octal ' + r.result.oct + ')');
    if (r.remainder) L.push('Remainder : ' + r.remainder.padded + '  (decimal ' + r.remainder.dec + ', hex ' + r.remainder.hex + ', octal ' + r.remainder.oct + ')');
    L.push(''); L.push('Working'); r.steps.forEach(function (s) { L.push(''); L.push(s.title); L.push(s.text); });
    return L.join('\n') + '\n';
  }
  function csvq(s) { s = String(s); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function exportCsv(r) {
    var rows = [['item', 'binary', 'decimal', 'hexadecimal', 'octal']];
    r.operands.forEach(function (x, k) { rows.push(['operand ' + (k + 1), x.bits, x.dec, x.hex, x.oct]); });
    rows.push([r.quotient ? 'quotient' : 'result', r.result.padded, r.result.dec, r.result.hex, r.result.oct]);
    if (r.remainder) rows.push(['remainder', r.remainder.padded, r.remainder.dec, r.remainder.hex, r.remainder.oct]);
    return rows.map(function (x) { return x.map(csvq).join(','); }).join('\n') + '\n';
  }
  function exportJson(r) {
    return JSON.stringify({ tool: 'Elecmetric Binary Calculator, Mode 01 Binary Arithmetic', operation: r.name, operands: r.operands.map(function (x) { return { binary: x.bits, decimal: x.dec, hex: x.hex, octal: x.oct }; }), result: { binary: r.result.padded, decimal: r.result.dec, hex: r.result.hex, octal: r.result.oct, bitLength: r.result.bitLength }, remainder: r.remainder ? { binary: r.remainder.padded, decimal: r.remainder.dec, hex: r.remainder.hex, octal: r.remainder.oct } : null }, null, 2) + '\n';
  }

  var api = { OPS: OPS, PADS: PADS, MAXD: MAXD, MAXN: MAXN, parseBinary: parseBinary, colAdd: colAdd, colSub: colSub, run: run, exportTxt: exportTxt, exportCsv: exportCsv, exportJson: exportJson };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.BinArith = api;
})(typeof window !== 'undefined' ? window : this);
