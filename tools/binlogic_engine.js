/* Elecmetric Universal Number System Converter: engine for Mode 03 (Binary Arithmetic & Logic).
   One file, no dependencies, no DOM. Required by tests/binlogic_test.js and inlined into
   calculators/binary-logic-calculator/index.html by tools/binlogic_page.js.

   All operations work on w-bit patterns (BigInt, w = 2..128, the page offers 4, 8, 16, 32, 64). A pattern has an unsigned value 0..2^w-1
   and a two's complement signed value. The result is always the w-bit pattern; the full, unwrapped result is reported separately,
   and both overflow kinds are reported explicitly:
   - unsigned overflow: the unwrapped result needs more than w bits (carry out of an addition, borrow in a subtraction, a 1 shifted out)
   - signed overflow: the true signed result is outside -2^(w-1) .. 2^(w-1)-1
   Division truncates toward zero (remainder takes the sign of the dividend). Arithmetic right shift rounds toward minus infinity. */
(function (root) {
  'use strict';
  var OPS = [['add', 'A + B', 2], ['sub', 'A \u2212 B', 2], ['mul', 'A \u00d7 B', 2], ['div', 'A \u00f7 B', 2], ['and', 'A AND B', 2], ['or', 'A OR B', 2], ['xor', 'A XOR B', 2], ['nand', 'A NAND B', 2], ['nor', 'A NOR B', 2], ['xnor', 'A XNOR B', 2], ['not', 'NOT A', 1], ['shl', 'A << n (shift left)', 2], ['shrl', 'A >> n (logical shift right)', 2], ['shra', 'A >>> n (arithmetic shift right)', 2]];
  function validWidth(w) { return typeof w === 'number' && Math.floor(w) === w && w >= 2 && w <= 128; }
  function mask(w) { return (1n << BigInt(w)) - 1n; }
  function toS(u, w) { return u >= (1n << BigInt(w - 1)) ? u - (1n << BigInt(w)) : u; }
  function fromS(s, w) { return ((s % (1n << BigInt(w))) + (1n << BigInt(w))) % (1n << BigInt(w)); }
  function pad(b, w) { while (b.length < w) b = '0' + b; return b; }
  function bin(u, w) { return pad(u.toString(2), w); }
  function hex(u, w) { var h = u.toString(16).toUpperCase(), d = Math.ceil(w / 4); while (h.length < d) h = '0' + h; return h; }
  function g4(b) { var o = [], i; for (i = b.length; i > 0; i -= 4) o.unshift(b.slice(Math.max(0, i - 4), i)); return o.join(' '); }
  function inSRange(s, w) { return s >= -(1n << BigInt(w - 1)) && s <= (1n << BigInt(w - 1)) - 1n; }

  /* parseOperand(text, kind, w, signed): kind 'bin' | 'hex' | 'dec'. Returns { ok, u } (u = the w-bit pattern as an unsigned BigInt). */
  function parseOperand(text, kind, w, signed) {
    var s = String(text == null ? '' : text).trim().replace(/[\s_]/g, '');
    if (!s) return { ok: false, empty: true, error: 'Enter a number.' };
    if (kind === 'bin') {
      s = s.replace(/^0b/i, ''); var b = s.match(/[^01]/);
      if (b) return { ok: false, error: '\u2018' + b[0] + '\u2019 is not a binary digit. Use 0 or 1.' };
      if (s.length > w) return { ok: false, error: 'The pattern has ' + s.length + ' bits but the width is ' + w + '.' };
      return { ok: true, u: BigInt('0b' + s) };
    }
    if (kind === 'hex') {
      s = s.replace(/^0x/i, ''); var h = s.match(/[^0-9a-fA-F]/);
      if (h) return { ok: false, error: '\u2018' + h[0] + '\u2019 is not a hexadecimal digit.' };
      var v = BigInt('0x' + s); if (v > mask(w)) return { ok: false, error: 'That value does not fit in ' + w + ' bits.' };
      return { ok: true, u: v };
    }
    if (!/^[+\-\u2212]?\d+$/.test(s)) return { ok: false, error: '\u2018' + text.trim() + '\u2019 is not a whole decimal number.' };
    if (s.replace(/^[+\-\u2212]/, '').length > 60) return { ok: false, error: 'The number has more than 60 digits.' };
    var neg = /^[\-\u2212]/.test(s), n = BigInt(s.replace(/^[+\-\u2212]/, '')), val = neg ? -n : n;
    if (signed) { if (!inSRange(val, w)) return { ok: false, error: val + ' does not fit in ' + w + ' bits signed (' + (-(1n << BigInt(w - 1))) + ' to ' + ((1n << BigInt(w - 1)) - 1n) + ').' }; return { ok: true, u: fromS(val, w) }; }
    if (val < 0n || val > mask(w)) return { ok: false, error: val + ' does not fit in ' + w + ' bits unsigned (0 to ' + mask(w) + ').' };
    return { ok: true, u: val };
  }
  function parseCount(text) {
    var s = String(text == null ? '' : text).trim();
    if (!s) return { ok: false, empty: true, error: 'Enter a shift count.' };
    if (!/^\d+$/.test(s) || s.length > 6) return { ok: false, error: 'The shift count must be a whole number, 0 or more.' };
    return { ok: true, n: Number(s) };
  }

  /* compute(op, a, b, w, signed): a, b are unsigned pattern values (b is the shift count for shifts, as a Number or BigInt). */
  function compute(op, a, b, w, signed) {
    var M = mask(w), sa = toS(a, w), sb = typeof b === 'bigint' && op.indexOf('sh') !== 0 ? toS(b, w) : 0n, r, ovU = null, ovS = null, full = null, rem = null, notes = [], steps = [], lines = null;
    var res = { op: op, w: w };
    switch (op) {
      case 'add': {
        var fu = a + b, fs = sa + sb; r = fu & M; ovU = fu > M; ovS = !inSRange(fs, w);
        full = { u: fu.toString(2), s: fs.toString() };
        steps.push('Add column by column from the right, carrying 1 when a column sums to 2 or more.');
        steps.push('Unsigned: ' + a + ' + ' + b + ' = ' + fu + (ovU ? ', which needs more than ' + w + ' bits: carry out of the top bit (unsigned overflow).' : ', which fits.'));
        steps.push('Signed: ' + sa + ' + ' + sb + ' = ' + fs + (ovS ? ', outside the signed range: signed overflow.' : ', inside the signed range.'));
        var c = 0, car = [], i; for (i = 0; i < w; i++) { var x = Number((a >> BigInt(i)) & 1n), y = Number((b >> BigInt(i)) & 1n), t = x + y + c; car[i] = c; c = t > 1 ? 1 : 0; }
        lines = { carry: car.reverse().join('') };
        break; }
      case 'sub': {
        var du = a - b, ds = sa - sb; r = fromS(du, w); ovU = a < b; ovS = !inSRange(ds, w);
        full = { u: du.toString(), s: ds.toString() };
        steps.push('A \u2212 B is the same as A + (NOT B) + 1 in w bits: NOT B = ' + bin((~b) & M, w) + ', plus 1 gives the two\u2019s complement of B.');
        steps.push('Unsigned: ' + a + ' \u2212 ' + b + ' = ' + du + (ovU ? ': B is larger than A, so there is a borrow (unsigned underflow).' : ': no borrow.'));
        steps.push('Signed: ' + sa + ' \u2212 ' + sb + ' = ' + ds + (ovS ? ', outside the signed range: signed overflow.' : ', inside the signed range.'));
        break; }
      case 'mul': {
        var pu = a * b, ps = sa * sb; r = pu & M; ovU = pu > M; ovS = !inSRange(ps, w);
        full = { u: pu.toString(2), s: ps.toString() };
        steps.push('Shift-and-add: for every 1 bit of B, add A shifted left by that bit position.');
        var parts = [], j; for (j = 0; j < w && parts.length < 16; j++) if ((b >> BigInt(j)) & 1n) parts.push('A << ' + j + ' = ' + bin(a << BigInt(j), 2 * w).replace(/^0+(?=.)/, ''));
        parts.forEach(function (p) { steps.push(p); });
        steps.push('Full product: ' + a + ' \u00d7 ' + b + ' = ' + pu + ' (unsigned), ' + sa + ' \u00d7 ' + sb + ' = ' + ps + ' (signed). The low ' + w + ' bits are kept.');
        break; }
      case 'div': {
        if (b === 0n) return { ok: false, error: 'Division by zero.' };
        var q, rm;
        if (signed) { q = sa / sb; rm = sa % sb; ovS = sa === -(1n << BigInt(w - 1)) && sb === -1n; ovU = false; steps.push('Signed: ' + sa + ' \u00f7 ' + sb + ' = ' + q + ' remainder ' + rm + ' (truncated toward zero; the remainder has the sign of A).'); steps.push('Check: ' + q + ' \u00d7 ' + sb + ' + ' + rm + ' = ' + (q * sb + rm) + '.'); if (ovS) notes.push('Most negative value divided by \u22121 is +' + (1n << BigInt(w - 1)) + ', which does not fit: signed overflow.'); }
        else { q = a / b; rm = a % b; ovS = null; ovU = false; steps.push('Unsigned: ' + a + ' \u00f7 ' + b + ' = ' + q + ' remainder ' + rm + '.'); steps.push('Check: ' + q + ' \u00d7 ' + b + ' + ' + rm + ' = ' + (q * b + rm) + '.'); }
        r = fromS(q, w); rem = fromS(rm, w); full = { u: q.toString(2), s: q.toString() };
        break; }
      case 'and': r = a & b; steps.push('Each result bit is 1 only where both A and B have a 1.'); break;
      case 'or': r = a | b; steps.push('Each result bit is 1 where A or B (or both) has a 1.'); break;
      case 'xor': r = a ^ b; steps.push('Each result bit is 1 where A and B differ.'); break;
      case 'nand': r = ~(a & b) & M; steps.push('AND, then invert every bit within the ' + w + '-bit width.'); break;
      case 'nor': r = ~(a | b) & M; steps.push('OR, then invert every bit within the ' + w + '-bit width.'); break;
      case 'xnor': r = ~(a ^ b) & M; steps.push('XOR, then invert every bit within the ' + w + '-bit width. A result bit is 1 where A and B are equal.'); break;
      case 'not': r = ~a & M; steps.push('Invert every bit within the ' + w + '-bit width. This is the one\u2019s complement of A. NOT A + 1 is the two\u2019s complement.'); break;
      case 'shl': {
        var n = Number(b), N = BigInt(n);
        r = n >= w ? 0n : (a << N) & M;
        var lost = n >= w ? a : (a >> BigInt(w - n));
        ovU = lost !== 0n; ovS = n >= w ? sa !== 0n : (toS(r, w) !== sa * (1n << N));
        full = { u: (a << N).toString(2), s: (sa * (1n << N)).toString() };
        steps.push('Move every bit ' + n + ' place' + (n === 1 ? '' : 's') + ' to the left and fill the right with zeros. For small values this multiplies by 2^' + n + '.');
        if (n >= w) notes.push('The shift count is ' + w + ' or more, so every bit is shifted out and the result is 0. (In C this is undefined behaviour; here it is defined as 0.)');
        steps.push(ovU ? 'Bits shifted out of the top contain a 1: unsigned overflow.' : 'Only zeros were shifted out.');
        steps.push(ovS ? 'The result is not A \u00d7 2^' + n + ' as a signed number: signed overflow.' : 'The signed result equals A \u00d7 2^' + n + '.');
        break; }
      case 'shrl': { var n1 = Number(b); r = n1 >= w ? 0n : a >> BigInt(n1); steps.push('Move every bit ' + n1 + ' place' + (n1 === 1 ? '' : 's') + ' to the right and fill the left with zeros, whatever the sign bit was.'); if (n1 >= w) notes.push('The shift count is ' + w + ' or more, so the result is 0.'); break; }
      case 'shra': { var n2 = Number(b), sh = n2 >= w ? w - 1 : n2; r = fromS(sa >> BigInt(sh), w); steps.push('Move every bit ' + n2 + ' place' + (n2 === 1 ? '' : 's') + ' to the right and copy the sign bit (' + (a >> BigInt(w - 1)) + ') into the vacated places.'); steps.push('This divides by 2^' + n2 + ' rounding toward minus infinity: ' + sa + ' >>> ' + n2 + ' = ' + toS(r, w) + '. Integer division truncates toward zero instead, so the two can differ for negative values.'); if (n2 >= w) notes.push('The shift count is ' + w + ' or more, so the result is all sign bits.'); break; }
      default: return { ok: false, error: 'Unknown operation.' };
    }
    res.ok = true; res.u = r; res.bits = bin(r, w); res.grouped = g4(res.bits); res.hex = hex(r, w); res.unsigned = r.toString(); res.signed = toS(r, w).toString();
    res.zero = r === 0n; res.negative = ((r >> BigInt(w - 1)) & 1n) === 1n; res.ovU = ovU; res.ovS = ovS; res.full = full; res.notes = notes; res.steps = steps; res.lines = lines;
    if (rem !== null) { res.rem = { bits: bin(rem, w), hex: hex(rem, w), unsigned: rem.toString(), signed: toS(rem, w).toString() }; }
    if (op === 'shrl' || op === 'shra') { var nn = Number(b), c1 = nn >= w ? 0n : a >> BigInt(nn), c2 = fromS(sa >> BigInt(nn >= w ? w - 1 : nn), w); res.shiftCompare = { logical: bin(c1, w), arithmetic: bin(c2, w), logicalSigned: toS(c1, w).toString(), arithmeticSigned: toS(c2, w).toString() }; }
    return res;
  }

  /* run(opts): parse both operands and compute. opts: { op, a, b, kind, w, signed } */
  function run(o) {
    if (!validWidth(o.w)) return { ok: false, error: 'The width must be 2 to 128 bits.' };
    var def = OPS.filter(function (x) { return x[0] === o.op; })[0]; if (!def) return { ok: false, error: 'Unknown operation.' };
    var pa = parseOperand(o.a, o.kind, o.w, o.signed); if (!pa.ok) { pa.field = 'a'; return pa; }
    var bv;
    if (def[2] === 1) bv = 0n;
    else if (o.op.indexOf('sh') === 0) { var pc = parseCount(o.b); if (!pc.ok) { pc.field = 'b'; return pc; } bv = BigInt(pc.n); }
    else { var pb = parseOperand(o.b, o.kind, o.w, o.signed); if (!pb.ok) { pb.field = 'b'; return pb; } bv = pb.u; }
    var r = compute(o.op, pa.u, bv, o.w, o.signed); if (!r.ok) return r;
    r.a = { bits: bin(pa.u, o.w), signed: toS(pa.u, o.w).toString(), unsigned: pa.u.toString() };
    r.b = def[2] === 1 ? null : (o.op.indexOf('sh') === 0 ? { count: Number(bv) } : { bits: bin(bv, o.w), signed: toS(bv, o.w).toString(), unsigned: bv.toString() });
    return r;
  }
  var api = { OPS: OPS, validWidth: validWidth, parseOperand: parseOperand, parseCount: parseCount, compute: compute, run: run, toS: toS, fromS: fromS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.BinLogic = api;
})(typeof window !== 'undefined' ? window : this);
