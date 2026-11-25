/* Elecmetric Binary Calculator, Mode 03: Bitwise Operations. Engine: one file, no dependencies, no DOM.
   Required by tests/bitops_test.js and inlined into calculators/bitwise-operations-calculator/index.html by tools/bitops_page.js.

   Fixed-width semantics only. Every operand is a W-bit pattern (W = 4, 8, 16, 32 or 64, BigInt). NOT and the shifts need an explicit width; the other operations
   may use "auto" (the typed width rounded up to a whole nibble). A pattern wider than W is refused, never truncated. A negative decimal operand is encoded as
   two's complement and must fit the width.
   Operations: AND, OR, XOR, NAND, NOR, XNOR, NOT, shift left, logical shift right (zeros in), arithmetic shift right (sign bit copied in), and the register tools
   set bit, clear bit, toggle bit, test bit and compare (XOR with the differing positions).
   Logical and arithmetic right shifts are different operations and are never conflated. Bits shifted out are reported, not dropped silently.
   Every result is computed with BigInt masks and then re-derived column by column from the gate rule; a mismatch throws, so a wrong answer is never shown. */
(function (root) {
  'use strict';
  var WIDTHS = [4, 8, 16, 32, 64];
  var OPS = [['and', 'AND', 2, 'A AND B'], ['or', 'OR', 2, 'A OR B'], ['xor', 'XOR', 2, 'A XOR B'], ['nand', 'NAND', 2, 'A NAND B'], ['nor', 'NOR', 2, 'A NOR B'], ['xnor', 'XNOR', 2, 'A XNOR B'],
    ['not', 'NOT', 1, 'NOT A'], ['shl', 'Shift left', 1, 'A << n'], ['shr', 'Logical shift right', 1, 'A >> n (zeros in)'], ['sar', 'Arithmetic shift right', 1, 'A >>> n (sign bit in)'],
    ['setbit', 'Set bit', 1, 'A OR (1 << n)'], ['clearbit', 'Clear bit', 1, 'A AND NOT (1 << n)'], ['togglebit', 'Toggle bit', 1, 'A XOR (1 << n)'], ['testbit', 'Test bit', 1, 'bit n of A'], ['diff', 'Compare', 2, 'A XOR B (which bits differ)']];
  var NEEDW = { not: 1, shl: 1, shr: 1, sar: 1 }, NEEDB = { and: 1, or: 1, xor: 1, nand: 1, nor: 1, xnor: 1, diff: 1 }, NEEDN = { shl: 1, shr: 1, sar: 1, setbit: 1, clearbit: 1, togglebit: 1, testbit: 1 };
  var BASES = [['bin', 2, 'binary'], ['oct', 8, 'octal'], ['dec', 10, 'decimal'], ['hex', 16, 'hexadecimal']], BITS = { 2: 1, 8: 3, 16: 4 };
  var RULE = {
    and: 'AND gives 1 only when both bits are 1.', or: 'OR gives 1 when at least one bit is 1.', xor: 'XOR gives 1 when the two bits are different.', nand: 'NAND is the inverse of AND: 0 only when both bits are 1.',
    nor: 'NOR is the inverse of OR: 1 only when both bits are 0.', xnor: 'XNOR is the inverse of XOR: 1 when the two bits are the same.', diff: 'XOR gives 1 where the two values differ, so the 1 bits mark the differing positions.'
  };
  var GATE = { and: function (x, y) { return x & y; }, or: function (x, y) { return x | y; }, xor: function (x, y) { return x ^ y; }, nand: function (x, y) { return 1 - (x & y); }, nor: function (x, y) { return 1 - (x | y); }, xnor: function (x, y) { return 1 - (x ^ y); }, diff: function (x, y) { return x ^ y; } };

  function mask(w) { return (1n << BigInt(w)) - 1n; }
  function lpad(s, n) { s = String(s); while (s.length < n) s = '0' + s; return s; }
  function bin(u, w) { return lpad(u.toString(2), w); }
  function g4(b) { var o = [], i; for (i = b.length; i > 0; i -= 4) o.unshift(b.slice(Math.max(0, i - 4), i)); return o.join(' '); }
  function toS(u, w) { return u >= (1n << BigInt(w - 1)) ? u - (1n << BigInt(w)) : u; }
  function pc(s) { var n = 0, i; for (i = 0; i < s.length; i++) if (s.charAt(i) === '1') n++; return n; }
  function opdef(id) { return OPS.filter(function (d) { return d[0] === id; })[0]; }

  /* parseOperand(text, baseId): { ok, base, v (BigInt, signed for a negative decimal), neg, typedBits } or { ok:false, empty?, error } */
  function parseOperand(text, baseId, label) {
    var bd = BASES.filter(function (d) { return d[0] === baseId; })[0]; if (!bd) return { ok: false, error: 'Unknown number system.' };
    var base = bd[1], s = String(text == null ? '' : text).trim().replace(/[\s_,]/g, '');
    if (!s) return { ok: false, empty: true, error: 'Enter ' + label + '.' };
    var neg = false, m = s.match(/^[+\-−]/);
    if (m) { if (base !== 10) return { ok: false, error: label.charAt(0).toUpperCase() + label.slice(1) + ': a sign is only allowed on a decimal value. Enter a bit pattern without a sign.' }; neg = m[0] !== '+'; s = s.slice(1); }
    var pre = base === 2 ? /^0b/i : base === 8 ? /^0o/i : base === 16 ? /^0x/i : null; if (pre) s = s.replace(pre, '');
    if (!s) return { ok: false, error: 'Add digits after the sign or prefix.' };
    var bad = s.match(base === 2 ? /[^01]/ : base === 8 ? /[^0-7]/ : base === 10 ? /[^0-9]/ : /[^0-9A-Fa-f]/);
    if (bad) return { ok: false, error: '‘' + bad[0] + '’ is not a ' + bd[2] + ' digit. ' + (base === 2 ? 'Binary numbers use only 0 and 1.' : base === 8 ? 'Octal numbers use only 0 to 7.' : base === 10 ? 'Decimal numbers use only 0 to 9.' : 'Hexadecimal numbers use 0 to 9 and A to F.') };
    if (s.length > 80) return { ok: false, error: 'The number has ' + s.length + ' digits. The widest pattern here is 64 bits.' };
    var mag = BigInt((base === 2 ? '0b' : base === 8 ? '0o' : base === 16 ? '0x' : '') + s), v = neg ? -mag : mag;
    var tb = base === 10 ? (mag === 0n ? 1 : mag.toString(2).length) : s.length * BITS[base];
    return { ok: true, base: base, v: v, neg: neg && mag !== 0n, typedBits: tb };
  }
  /* put a parsed operand into a W-bit pattern, or explain why it does not fit */
  function toPattern(p, W, label) {
    if (p.v < 0n) { if (p.v < -(1n << BigInt(W - 1))) return { ok: false, error: label + ': ' + p.v + ' does not fit in ' + W + ' bits as two’s complement (the minimum is ' + (-(1n << BigInt(W - 1))) + ').' }; return { ok: true, u: p.v + (1n << BigInt(W)) }; }
    if (p.v > mask(W)) return { ok: false, error: label + ' needs ' + p.v.toString(2).length + ' bits, but the selected width is ' + W + ' bits. Choose a wider width; nothing is truncated.' };
    return { ok: true, u: p.v };
  }
  function describe(u, W) {
    var b = bin(u, W), s = toS(u, W);
    return { bin: b, grouped: g4(b), hex: lpad(u.toString(16).toUpperCase(), Math.ceil(W / 4)), oct: lpad(u.toString(8), Math.ceil(W / 3)), uns: u.toString(), sgn: s.toString(), ones: pc(b), zeros: W - pc(b), msb: b.charAt(0), lsb: b.charAt(W - 1) };
  }
  /* column-by-column re-derivation of a two-operand or one-operand result from the gate rule */
  function viaGate(id, A, B, W) {
    var out = '', i; for (i = 0; i < W; i++) { var x = Number(A.charAt(i)), y = B ? Number(B.charAt(i)) : 0; out += id === 'not' ? String(1 - x) : String(GATE[id](x, y)); } return out;
  }

  function run(o) {
    o = o || {};
    var def = opdef(o.op); if (!def) return { ok: false, error: 'Unknown operation.' };
    var op = def[0], wIn = o.width == null ? '8' : String(o.width), baseId = o.base || 'bin';
    if (wIn !== 'auto' && WIDTHS.indexOf(Number(wIn)) < 0) return { ok: false, error: 'Unknown bit width.' };
    if (wIn === 'auto' && NEEDW[op]) return { ok: false, error: def[1] + ' needs an explicit bit width. Choose 4, 8, 16, 32 or 64 bits: the result depends on how many bits the register has.' };
    var pa = parseOperand(o.a, baseId, 'A'); if (!pa.ok) { pa.field = 'a'; return pa; }
    var pb = null; if (NEEDB[op]) { pb = parseOperand(o.b, baseId, 'B'); if (!pb.ok) { pb.field = 'b'; return pb; } }
    var W, auto = wIn === 'auto';
    if (auto) { var t = Math.max(pa.typedBits, pb ? pb.typedBits : 0); if (pa.v < 0n || (pb && pb.v < 0n)) return { ok: false, field: 'a', error: 'A negative decimal value needs an explicit bit width.' }; W = Math.max(4, Math.ceil(t / 4) * 4); if (W > 64) return { ok: false, field: 'a', error: 'The values need ' + t + ' bits. The widest register here is 64 bits.' }; }
    else W = Number(wIn);
    var ta = toPattern(pa, W, 'A'); if (!ta.ok) { ta.field = 'a'; return ta; }
    var tb = null; if (pb) { tb = toPattern(pb, W, 'B'); if (!tb.ok) { tb.field = 'b'; return tb; } }
    var n = 0;
    if (NEEDN[op]) {
      var ns = String(o.n == null ? '' : o.n).trim();
      if (!/^\d+$/.test(ns)) return { ok: false, field: 'n', empty: ns === '', error: ns === '' ? 'Enter ' + (op.slice(-3) === 'bit' ? 'a bit position.' : 'a shift amount.') : (op.slice(-3) === 'bit' ? 'The bit position must be a whole number from 0 to ' + (W - 1) + '.' : 'The shift amount must be a whole number from 0 to ' + W + '.') };
      n = Number(ns);
      if (op.slice(-3) === 'bit') { if (n > W - 1) return { ok: false, field: 'n', error: 'Bit position ' + n + ' is outside a ' + W + '-bit register. Use 0 (the least significant bit) to ' + (W - 1) + ' (the most significant).' }; }
      else if (n > W) return { ok: false, field: 'n', error: 'A shift of ' + n + ' is more than the ' + W + '-bit width. Use 0 to ' + W + '.' };
    }
    var M = mask(W), a = ta.u, b = tb ? tb.u : 0n, r, lost = '', fill = null, bitVal = null, maskBit = null;
    switch (op) {
      case 'and': r = a & b; break; case 'or': r = a | b; break; case 'xor': case 'diff': r = a ^ b; break;
      case 'nand': r = ~(a & b) & M; break; case 'nor': r = ~(a | b) & M; break; case 'xnor': r = ~(a ^ b) & M; break;
      case 'not': r = ~a & M; break;
      case 'shl': r = (a << BigInt(n)) & M; lost = n ? bin(a, W).slice(0, n) : ''; fill = 'zero'; break;
      case 'shr': r = a >> BigInt(n); lost = n ? bin(a, W).slice(W - n) : ''; fill = 'zero'; break;
      case 'sar': r = (toS(a, W) >> BigInt(n)) & M; lost = n ? bin(a, W).slice(W - n) : ''; fill = 'sign'; break;
      case 'setbit': maskBit = 1n << BigInt(n); r = a | maskBit; break;
      case 'clearbit': maskBit = 1n << BigInt(n); r = a & ~maskBit & M; break;
      case 'togglebit': maskBit = 1n << BigInt(n); r = a ^ maskBit; break;
      case 'testbit': maskBit = 1n << BigInt(n); r = a; bitVal = Number((a >> BigInt(n)) & 1n); break;
    }
    var A = bin(a, W), Bs = tb ? bin(b, W) : null, R = bin(r, W);
    /* re-derive the result a different way and compare */
    if (GATE[op] || op === 'not') { if (viaGate(op, A, Bs, W) !== R) throw new Error('internal check failed: ' + op); }
    else if (op === 'shl' || op === 'shr' || op === 'sar') {
      var re = '', i, sb = A.charAt(0); for (i = 0; i < W; i++) { var src = op === 'shl' ? i + n : i - n; re += (src >= 0 && src < W) ? A.charAt(src) : (op === 'sar' && i - n < 0 ? sb : '0'); }
      if (re !== R) throw new Error('internal check failed: ' + op);
      if (op === 'shl' && !/1/.test(lost) && a * (1n << BigInt(n)) !== r) throw new Error('internal check failed: shift left is a multiplication by 2^n');
      if (op === 'shr' && a / (1n << BigInt(n)) !== r) throw new Error('internal check failed: logical shift right is a division by 2^n');
      if (op === 'sar') { var fl = toS(a, W) / (1n << BigInt(n)); if (toS(a, W) % (1n << BigInt(n)) !== 0n && toS(a, W) < 0n) fl -= 1n; if (toS(r, W) !== fl) throw new Error('internal check failed: arithmetic shift right rounds toward minus infinity'); }
    } else { var cc = A.split(''); if (maskBit !== null && op !== 'testbit') { cc[W - 1 - n] = op === 'setbit' ? '1' : op === 'clearbit' ? '0' : (cc[W - 1 - n] === '1' ? '0' : '1'); if (cc.join('') !== R) throw new Error('internal check failed: ' + op); } }
    /* columns, most significant first */
    var rows = [], i2; for (i2 = W - 1; i2 >= 0; i2--) {
      var k = W - 1 - i2, ab = Number(A.charAt(k)), bb = Bs ? Number(Bs.charAt(k)) : null, rb = Number(R.charAt(k)), src2 = null, fk = null;
      if (op === 'shl') { src2 = i2 - n; if (src2 < 0) { src2 = null; fk = 'zero'; } } else if (op === 'shr' || op === 'sar') { src2 = i2 + n; if (src2 > W - 1) { src2 = null; fk = op === 'sar' ? 'sign' : 'zero'; } }
      rows.push({ i: i2, a: ab, b: bb, r: rb, changed: ab !== rb, src: src2, fill: fk, target: maskBit !== null && i2 === n });
    }
    var res = { ok: true, op: op, opName: def[1], expr: def[3], width: W, auto: auto, base: baseId, n: n, a: describe(a, W), b: tb ? describe(b, W) : null, result: describe(r, W), rows: rows, lost: lost, fill: fill, changedCount: rows.filter(function (x) { return x.changed; }).length };
    var steps = [], notes = [];
    var line = function (l, s) { var p = '            '; return (l + p).slice(0, 12) + ': ' + s; };
    if (GATE[op]) {
      steps.push({ title: 'The rule', text: RULE[op] + '\nThe operation is applied to each pair of bits in the same column, independently.' });
      steps.push({ title: 'Bit by bit', text: [line('A', g4(A)), line('B', g4(Bs)), line(def[1], g4(R))].join('\n') + '\n' + line('decimal', a + ' ' + def[1] + ' ' + b + ' = ' + r + ' (unsigned)') });
      if (op === 'diff') { var pos = rows.filter(function (x) { return x.r === 1; }).map(function (x) { return x.i; }); res.diff = { positions: pos, count: pos.length }; steps.push({ title: 'Differing bits', text: pos.length ? 'The values differ in ' + pos.length + ' bit' + (pos.length === 1 ? '' : 's') + ': position' + (pos.length === 1 ? ' ' : 's ') + pos.join(', ') + ' (0 is the least significant bit).\nThe number of differing bits is the Hamming distance, ' + pos.length + '.' : 'The two values are identical: no bit differs (Hamming distance 0).' }); }
    } else if (op === 'not') {
      steps.push({ title: 'The rule', text: 'NOT inverts every bit of the ' + W + '-bit register: 0 becomes 1 and 1 becomes 0. The width matters: NOT 00001111 is 11110000 in 8 bits but 1111111111110000 in 16 bits.' });
      steps.push({ title: 'Bit by bit', text: [line('A', g4(A)), line('NOT A', g4(R))].join('\n') + '\n' + line('check', 'A + NOT A = ' + (a + r) + ' = 2^' + W + ' - 1 (every bit set)') });
      if (a + r !== M) throw new Error('internal check failed: not');
      notes.push('NOT is the one’s complement of the pattern at this width. For the negative of a two’s complement number, add 1 to it (the Signed Binary mode).');
    } else if (op === 'shl' || op === 'shr' || op === 'sar') {
      var nm = op === 'shl' ? 'Shift left by ' + n : op === 'shr' ? 'Logical shift right by ' + n : 'Arithmetic shift right by ' + n;
      var rule = op === 'shl' ? 'Every bit moves ' + n + ' place' + (n === 1 ? '' : 's') + ' to the left. The ' + n + ' leftmost bit' + (n === 1 ? ' is' : 's are') + ' shifted out and ' + n + ' zero' + (n === 1 ? ' is' : 's are') + ' shifted in on the right.'
        : op === 'shr' ? 'Every bit moves ' + n + ' place' + (n === 1 ? '' : 's') + ' to the right. The ' + n + ' rightmost bit' + (n === 1 ? ' is' : 's are') + ' shifted out and zeros are shifted in on the left, whatever the sign bit was.'
          : 'Every bit moves ' + n + ' place' + (n === 1 ? '' : 's') + ' to the right. The ' + n + ' rightmost bit' + (n === 1 ? ' is' : 's are') + ' shifted out and copies of the sign bit (' + A.charAt(0) + ') are shifted in on the left, so the sign is preserved.';
      steps.push({ title: nm, text: rule });
      steps.push({ title: 'Bit by bit', text: [line('A', g4(A)), line('result', g4(R))].join('\n') + '\n' + line('shifted out', lost || 'none') + '\n' + line('shifted in', n ? (fill === 'sign' ? n + ' × ' + A.charAt(0) + ' (the sign bit)' : n + ' × 0') : 'none') });
      if (op === 'shl') { var lostOnes = /1/.test(lost), tS = toS(a, W) * (1n << BigInt(n)), sOv = tS < -(1n << BigInt(W - 1)) || tS > (1n << BigInt(W - 1)) - 1n; res.shift = { unsignedOverflow: lostOnes, signedOverflow: sOv }; steps.push({ title: 'As arithmetic', text: lostOnes ? 'A × 2^' + n + ' = ' + (a * (1n << BigInt(n))) + ' needs more than ' + W + ' bits, so the result ' + r + ' has lost its high bit' + (pc(lost) === 1 ? '' : 's') + ' (' + lost + ').' : 'No 1 bit was shifted out, so the result is exactly A × 2^' + n + ' = ' + r + '.' }); if (lostOnes) notes.push('Unsigned overflow: a 1 bit was shifted out, so the ' + W + '-bit result is not A × 2^' + n + '.'); if (sOv) notes.push('Signed overflow: read as two’s complement the true result ' + tS + ' is outside ' + (-(1n << BigInt(W - 1))) + ' to ' + ((1n << BigInt(W - 1)) - 1n) + '.'); }
      else if (op === 'shr') steps.push({ title: 'As arithmetic', text: 'A ÷ 2^' + n + ' rounded down = ' + r + ' (unsigned). The bits shifted out are the remainder' + (lost ? ' (' + lost + ' = ' + BigInt('0b' + lost) + ')' : '') + '.' });
      else steps.push({ title: 'As arithmetic', text: 'Read as two’s complement, A = ' + toS(a, W) + ' and the result is ' + toS(r, W) + ': A ÷ 2^' + n + ' rounded toward minus infinity.' });
      if (op !== 'shl') { var other = op === 'shr' ? ((toS(a, W) >> BigInt(n)) & M) : (a >> BigInt(n)); if (other !== r) notes.push((op === 'shr' ? 'The arithmetic shift right of the same value gives ' + bin(other, W) : 'The logical shift right of the same value gives ' + bin(other, W)) + ', because the sign bit is 1. The two right shifts are different operations.'); else notes.push('The sign bit is 0, so here the logical and arithmetic right shifts give the same result. They differ for a negative two’s complement value.'); }
      if (lost && /1/.test(lost) && op !== 'shl') notes.push('Bits shifted out: ' + lost + '. They are not part of the result.');
    } else {
      var mb = bin(maskBit, W), act = op === 'setbit' ? 'OR with the mask sets the bit to 1.' : op === 'clearbit' ? 'AND with the inverted mask clears the bit to 0 and leaves the others alone.' : op === 'togglebit' ? 'XOR with the mask flips the bit and leaves the others alone.' : 'AND with the mask keeps only that bit, so the result is non-zero exactly when the bit is set.';
      steps.push({ title: def[1] + ' ' + n, text: 'Bit ' + n + ' counts from 0 at the right (the least significant bit) up to ' + (W - 1) + ' (the most significant). The mask has a single 1 in position ' + n + ': ' + g4(mb) + '.\n' + act });
      if (op === 'testbit') { var tm = a & maskBit; steps.push({ title: 'Bit by bit', text: [line('A', g4(A)), line('mask', g4(mb)), line('A AND mask', g4(bin(tm, W)))].join('\n') + '\nBit ' + n + ' of A is ' + bitVal + ': it is ' + (bitVal ? 'set' : 'clear') + '.' }); res.bit = { index: n, value: bitVal }; notes.push('Testing does not change the register: the result is A.'); }
      else { var ex = op === 'setbit' ? 'OR' : op === 'clearbit' ? 'AND NOT' : 'XOR', m2 = op === 'clearbit' ? bin(~maskBit & M, W) : mb; steps.push({ title: 'Bit by bit', text: [line('A', g4(A)), line(op === 'clearbit' ? 'NOT mask' : 'mask', g4(m2)), line(ex, g4(R))].join('\n') + (a === r ? '\nBit ' + n + ' already had that value, so the register does not change.' : '') }); if (a === r) notes.push('Bit ' + n + ' was already ' + (op === 'setbit' ? 'set' : 'clear') + ', so nothing changed.'); }
      res.bit = res.bit || { index: n, value: Number((r >> BigInt(n)) & 1n) };
    }
    steps.push({ title: 'The same patterns as numbers', text: [line('A', res.a.bin + '  = ' + res.a.hex + ' hex = ' + res.a.uns + ' unsigned, ' + res.a.sgn + ' two’s complement')].concat(res.b ? [line('B', res.b.bin + '  = ' + res.b.hex + ' hex = ' + res.b.uns + ' unsigned, ' + res.b.sgn + ' two’s complement')] : [], [line('result', res.result.bin + '  = ' + res.result.hex + ' hex = ' + res.result.uns + ' unsigned, ' + res.result.sgn + ' two’s complement')]).join('\n') });
    if (auto) notes.push('Width chosen automatically: ' + W + ' bits (the longest value typed, rounded up to a whole nibble). Choose a width yourself to change it.');
    notes.push('Unsigned and two’s complement readings are both shown, because the same bits mean different numbers in different representations (11111111 is 255 unsigned and -1 in 8-bit two’s complement).');
    res.steps = steps; res.notes = notes;
    return res;
  }

  function exportTxt(r) {
    var L = ['Elecmetric Binary Calculator: Bitwise Operations (' + r.opName + ', ' + r.width + ' bits)', '', 'Expression: ' + r.expr + (NEEDN[r.op] ? '   n = ' + r.n : ''), ''];
    L.push('A       : ' + r.a.grouped + '  (hex ' + r.a.hex + ', unsigned ' + r.a.uns + ', signed ' + r.a.sgn + ')'); if (r.b) L.push('B       : ' + r.b.grouped + '  (hex ' + r.b.hex + ', unsigned ' + r.b.uns + ', signed ' + r.b.sgn + ')');
    L.push('Result  : ' + r.result.grouped + '  (hex ' + r.result.hex + ', octal ' + r.result.oct + ', unsigned ' + r.result.uns + ', signed ' + r.result.sgn + ')'); if (r.lost) L.push('Shifted out: ' + r.lost);
    L.push(''); L.push('Working'); r.steps.forEach(function (s) { L.push(''); L.push(s.title); L.push(s.text); });
    return L.join('\n') + '\n';
  }
  function csvq(s) { s = String(s); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function exportCsv(r) {
    var rows = [['item', 'binary', 'hex', 'octal', 'unsigned', 'signed_twos_complement']], f = function (n, d) { rows.push([n, d.bin, d.hex, d.oct, d.uns, d.sgn]); };
    f('A', r.a); if (r.b) f('B', r.b); f('result', r.result);
    rows.push([]); rows.push(['bit', 'A', 'B', 'result', 'changed']); r.rows.forEach(function (x) { rows.push([x.i, x.a, x.b === null ? '' : x.b, x.r, x.changed ? 'yes' : 'no']); });
    return rows.map(function (x) { return x.map(csvq).join(','); }).join('\n') + '\n';
  }
  function exportJson(r) {
    var d = function (x) { return { binary: x.bin, hex: x.hex, octal: x.oct, unsigned: x.uns, signedTwosComplement: x.sgn }; };
    return JSON.stringify({ tool: 'Elecmetric Binary Calculator, Mode 03 Bitwise Operations', operation: r.opName, expression: r.expr, bitWidth: r.width, n: NEEDN[r.op] ? r.n : undefined, a: d(r.a), b: r.b ? d(r.b) : undefined, result: d(r.result), shiftedOut: r.lost || undefined, differingBits: r.diff ? r.diff.positions : undefined, bits: r.rows.map(function (x) { return { index: x.i, a: x.a, b: x.b === null ? undefined : x.b, result: x.r }; }) }, null, 2) + '\n';
  }

  var api = { OPS: OPS, WIDTHS: WIDTHS, BASES: BASES, NEEDW: NEEDW, NEEDB: NEEDB, NEEDN: NEEDN, parseOperand: parseOperand, run: run, exportTxt: exportTxt, exportCsv: exportCsv, exportJson: exportJson };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.BitOps = api;
})(typeof window !== 'undefined' ? window : this);
