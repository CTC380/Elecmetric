/* Tests for tools/hex_engine.js (Hex Calculator, five modes) against tests/hex_vectors.json (independent: gen_hex_vectors.py, plain Python integers, zlib, binascii),
   the reference vector cases supplied with the TypeScript engine, and the examples in the CEO product decision. Run: node tests/hex_test.js */
const X = require('../tools/hex_engine.js'), V = require('./hex_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 15) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const ar = (op, ops, pad) => X.arith({ op, operands: ops, pad });
/* ---- independent vectors ---- */
for (const v of V.arith) {
  const tag = v.op + ' ' + v.ops.join(' | ').slice(0, 70), r = ar(v.op, v.ops);
  n++;
  if (v.err) { if (r.ok || r.field !== 1) bad(tag + ': division by zero should be refused on the divisor'); continue; }
  if (!r.ok) { bad(tag + ' errored: ' + r.error); continue; }
  eq(r.result.dec, v.r, tag + ' decimal'); eq(r.result.hex, v.hex, tag + ' hex');
  if (v.rem !== undefined) { eq(r.remainder.dec, v.rem, tag + ' remainder'); eq(r.remainder.hex, v.remHex, tag + ' remainder hex'); }
  const neg = v.hex[0] === '-', big = BigInt('0x' + (neg ? v.hex.slice(1) : v.hex));
  eq(r.result.bin, (neg ? '-' : '') + big.toString(2), tag + ' binary'); eq(r.result.oct, (neg ? '-' : '') + big.toString(8), tag + ' octal');
  if (r.steps.length < 1) bad(tag + ' has no working');
}
for (const v of V.convert) {
  if (v.v !== undefined) {
    const r = X.convert({ input: v.v, from: 10 }); n++;
    if (!r.ok) { bad('convert ' + v.v + ': ' + r.error); continue; }
    eq(r.out[16].text, v.hex, 'dec→hex ' + v.v.slice(0, 40)); eq(r.out[2].text, v.bin, 'dec→bin ' + v.v.slice(0, 40)); eq(r.out[8].text, v.oct, 'dec→oct ' + v.v.slice(0, 40));
    const back = X.convert({ input: v.hex, from: 16 }); eq(back.out[10].text, v.v, 'hex→dec ' + v.hex.slice(0, 40));
    eq(X.convert({ input: v.bin, from: 2 }).out[16].text, v.hex, 'bin→hex'); eq(X.convert({ input: v.oct, from: 8 }).out[16].text, v.hex, 'oct→hex');
  } else { const r = X.convert({ input: v.frac, from: 16, maxFraction: 64 }); eq(r.out[10].text, v.dec, 'fraction ' + v.frac); eq(r.exact, true, 'fraction exact ' + v.frac); }
}
for (const v of V.signed) {
  const tag = 'signed ' + v.w + ' ' + (v.pat || v.val);
  if (v.val === undefined) {
    const r = X.signed({ mode: 'pattern', text: v.pat, width: v.w }); n++; if (!r.ok) { bad(tag + ' ' + r.error); continue; }
    eq(r.info.unsigned, v.u, tag + ' unsigned'); eq(r.info.signed, v.s, tag + ' signed'); eq(r.info.isNegative, v.neg, tag + ' sign'); eq(r.info.twosComplement, v.twos, tag + ' two\'s complement'); eq(r.info.onesComplement, v.ones, tag + ' one\'s complement');
  } else {
    const r = X.signed({ mode: 'value', text: v.val, width: v.w }); n++; if (!r.ok) { bad(tag + ' ' + r.error); continue; }
    eq(r.fits, v.fits, tag + ' fits'); eq(r.overflow, v.over, tag + ' overflow'); eq(r.underflow, v.under, tag + ' underflow'); eq(r.info.hex, v.pat, tag + ' wrapped pattern');
  }
}
for (const v of V.bitwise) {
  for (const op of ['and', 'or', 'xor', 'nand', 'nor', 'xnor']) eq(X.bitwise({ op, a: v.a, b: v.b, width: v.w }).resultHex, v[op], op + ' ' + v.w + ' ' + v.a + ',' + v.b);
  for (const op of ['not', 'shl', 'shr', 'sar', 'rol', 'ror']) eq(X.bitwise({ op, a: v.a, width: v.w, shift: v.n }).resultHex, v[op], op + ' ' + v.w + ' ' + v.a + ' by ' + v.n);
}
for (const v of V.crc) {
  const r = X.tool('checksum', { kind: 'hex', text: v.hex || '' }), t = 'checksum ' + v.hex.slice(0, 20);
  if (!v.hex) { eq(X.tool('checksum', { kind: 'hex', text: '' }).ok, false, 'empty checksum input'); continue; }
  eq(r.values['CRC-16/IBM (ARC)'], v.ibm, t + ' IBM'); eq(r.values['CRC-16/MODBUS'], v.modbus, t + ' MODBUS'); eq(r.values['CRC-16/CCITT-FALSE'], v.ccitt, t + ' CCITT'); eq(r.values['CRC-32'], v.crc32, t + ' CRC-32');
  eq(r.values['Sum-8 (not a CRC)'], v.sum8, t + ' sum8'); eq(r.values['Two’s-complement sum-8 (LRC)'], v.lrc, t + ' LRC');
}
/* ---- reference vector cases from the TypeScript engine ---- */
const hexOf = (op, ops) => ar(op, ops).result.hex;
eq(hexOf('add', ['A', 'F']), '19', 'A + F'); eq(hexOf('sub', ['1A', 'B']), 'F', '1A - B'); eq(hexOf('mul', ['A', '5']), '32', 'A x 5');
eq(ar('div', ['64', '8']).result.hex, 'C', '64 / 8 quotient'); eq(ar('div', ['64', '8']).remainder.hex, '4', '64 / 8 remainder');
eq(hexOf('add', ['1A3', '2F']), '1D2', '1A3 + 2F'); eq(hexOf('sub', ['1A3', '2F']), '174', '1A3 - 2F'); eq(hexOf('add', ['A', 'B', 'C']), '21', 'A + B + C');
eq(/carry 1/.test(ar('add', ['A', 'F']).steps[0].text), true, 'carry step shown'); eq(/borrow 1/.test(ar('sub', ['1A', 'B']).steps[0].text), true, 'borrow step shown');
eq(/A × F = 96|digit 5/.test(ar('mul', ['A', '5']).steps[0].text), true, 'partial products shown');
eq(ar('div', ['A', '0']).ok, false, 'division by zero refused'); eq(ar('div', ['A', '0']).error, 'Cannot divide by zero.', 'division by zero message');
eq(ar('add', ['G1', '1']).ok, false, 'G1 is not hex'); eq(ar('add', ['G1', '1']).field, 0, 'error points at the first operand');
const cv = (input, from, to, m) => X.convert({ input, from, maxFraction: m }).out[to].text;
eq(cv('AA', 16, 10), '170', 'AA to decimal'); eq(cv('255', 10, 16), 'FF', '255 to hex'); eq(cv('AA', 16, 2), '10101010', 'AA to binary'); eq(cv('FF', 16, 8), '377', 'FF to octal');
eq(cv('377', 8, 16), 'FF', '377 octal to hex'); eq(cv('0.8', 16, 10), '0.5', '0.8 hex'); eq(X.convert({ input: '0.8', from: 16 }).exact, true, '0.8 hex is exact');
eq(X.convert({ input: '0.1', from: 10, maxFraction: 8 }).exact, false, '0.1 decimal cut'); eq(/^0\./.test(cv('0.1', 10, 16, 8)), true, '0.1 decimal has a fraction'); eq(cv('0.1', 10, 16, 8), '0.19999999', '0.1 decimal is cut, not rounded');
eq(cv('-A', 16, 10), '-10', '-A'); eq(cv('0xFF', 'auto', 10), '255', '0xFF auto'); eq(cv('0b101', 'auto', 16), '5', '0b101 auto');
eq(X.detect('0xFF').base, 16, 'detect 0xFF'); eq(X.detect('0xFF').ambiguous, false, 'detect 0xFF unambiguous'); eq(X.detect('AA').base, 16, 'detect AA'); eq(X.detect('AA').ambiguous, false, 'detect AA unambiguous');
eq(X.detect('11').base, 2, 'detect 11 default'); eq(X.detect('11').ambiguous, true, 'detect 11 ambiguous'); eq(X.detect('89').ambiguous, true, 'detect 89 could still be hex'); eq(X.detect('').empty, true, 'detect empty');
const sg = (t, w) => X.signed({ mode: 'pattern', text: t, width: w });
eq(sg('FF', 8).info.unsigned, '255', 'FF unsigned'); eq(sg('FF', 8).info.signed, '-1', 'FF signed'); eq(sg('7F', 8).info.signed, '127', '7F'); eq(sg('80', 8).info.signed, '-128', '80'); eq(sg('FFFF', 16).info.signed, '-1', 'FFFF');
eq(sg('AA', 8).info.signBit, 1, 'AA sign bit'); eq(sg('AA', 8).info.isNegative, true, 'AA negative'); eq(sg('-1', 8).ok, false, 'negative pattern refused'); eq(sg('FFFF', 8).ok, false, 'oversized pattern refused');
eq(X.signed({ mode: 'pattern', text: 'FFFF', width: 8, truncate: true }).info.hex, 'FF', 'truncate opt-in'); eq(X.signed({ mode: 'pattern', text: 'FFFF', width: 8, truncate: true }).truncated, true, 'truncation reported');
const sv = (t, w) => X.signed({ mode: 'value', text: t, width: w });
eq(sv('127', 8).fits, true, '127 fits'); eq(sv('127', 8).info.hex, '7F', '127 pattern'); eq(sv('128', 8).overflow, true, '128 overflows'); eq(sv('-128', 8).fits, true, '-128 fits'); eq(sv('-128', 8).info.hex, '80', '-128 pattern'); eq(sv('-129', 8).underflow, true, '-129 underflows'); eq(sv('-1', 8).info.hex, 'FF', '-1 is FF');
const bw = (op, a, b, w, s) => X.bitwise({ op, a, b, width: w, shift: s });
eq(bw('and', 'AA', '0F').resultHex.replace(/^0+/, '') || '0', 'A', 'AA AND 0F'); eq(bw('and', 'AA', '0F').resultHex, '0A', 'AA AND 0F keeps the width'); eq(bw('or', 'AA', '0F').resultHex, 'AF', 'OR'); eq(bw('xor', 'AA', '0F').resultHex, 'A5', 'XOR');
eq(bw('not', 'AA', undefined, 8).resultHex, '55', 'NOT'); eq(bw('nand', 'AA', '0F', 8).resultHex, 'F5', 'NAND'); eq(bw('nor', 'AA', '0F', 8).resultHex, '50', 'NOR'); eq(bw('xnor', 'AA', '0F', 8).resultHex, '5A', 'XNOR');
eq(bw('shl', 'AA', undefined, 8, 1).resultHex, '54', 'SHL'); eq(bw('shr', 'AA', undefined, 8, 1).resultHex, '55', 'SHR'); eq(bw('sar', 'AA', undefined, 8, 1).resultHex, 'D5', 'SAR keeps the sign'); eq(bw('xor', 'AA', '0F', 8).view.bitrows[0].bits.length, 8, 'bit-level rows');
eq(bw('or', 'AA', '01', 8).resultHex, 'AB', 'spec example: AA OR 01 = AB');
const reg = (e, i, w) => X.tool('register', { value: 'AA', width: w || 8, fields: 'high 7:4\nlow 3:0', edit: e, index: i });
eq(reg('set', 0).afterHex, 'AB', 'set bit 0'); eq(reg('clear', 1).afterHex, 'A8', 'clear bit 1'); eq(reg('toggle', 0).afterHex, 'AB', 'toggle bit 0');
eq(reg('none').fields[0][2], 'A', 'high nibble'); eq(reg('none').fields[1][2], 'A', 'low nibble');
eq(X.tool('bytes', { value: 'AABBCCDD' }).littleEndianHex, 'DDCCBBAA', 'endianness'); eq(X.tool('bytes', { value: 'FF', bytes: '4' }).bytes.length, 4, 'fixed byte count');
eq(X.tool('ascii', { dir: 'text', text: 'Hello' }).hex, '48 65 6C 6C 6F', 'ascii to hex'); eq(X.tool('ascii', { dir: 'hex', text: '48 65 6C 6C 6F' }).text, 'Hello', 'hex to ascii');
eq(X.tool('rgb', { dir: 'rgb', text: '170 187 204' }).hex, '#AABBCC', 'rgb to hex'); eq(X.tool('rgb', { dir: 'hex', text: '#AABBCC' }).g, 187, 'hex to rgb'); eq(X.tool('rgb', { dir: 'hex', text: '#GG0000' }).ok, false, 'bad colour');
const cs = X.tool('checksum', { kind: 'text', text: '123456789' }).values;
eq(cs['CRC-16/IBM (ARC)'], 'BB3D', 'CRC-16/IBM'); eq(cs['CRC-16/MODBUS'], '4B37', 'CRC-16/MODBUS'); eq(cs['CRC-16/CCITT-FALSE'], '29B1', 'CRC-16/CCITT-FALSE'); eq(cs['CRC-32'], 'CBF43926', 'CRC-32');
eq(X.tool('checksum', { kind: 'hex', text: '01 02 03' }).values['Sum-8 (not a CRC)'], '06', 'Sum-8 is one byte (the TypeScript source padded it to 0006)');
eq(X.tool('groups', {}).ok, false, 'unknown tool');
eq(X.tool('memory', { base: '1000', index: 3, stride: 4 }).addressHex, '100C', '0x1000 + 3 x 4'); eq(X.tool('memory', { base: 'FFF0', offset: '20', addrWidth: 16 }).ok, false, '16-bit address overflow refused');
/* ---- parsing: the 0B and 0D bytes ---- */
eq(hexOf('add', ['0D', '1']), 'E', '0D is a hex number, not the decimal prefix'); eq(hexOf('add', ['0B', '0B']), '16', '0B is a hex number, not the binary prefix'); eq(hexOf('add', ['0Bx1'.replace('x', ''), '0']), 'B1', '0B1 is hex B1');
eq(hexOf('add', ['0xAA', '1']), 'AB', '0x prefix'); eq(hexOf('add', ['0XAA', '1']), 'AB', '0X prefix'); eq(hexOf('add', ['aa', '1']), 'AB', 'lowercase input'); eq(hexOf('add', ['AA_BB', '1']), 'AABC', 'underscore grouping'); eq(hexOf('add', ['AA BB', '1']), 'AABC', 'space grouping');
eq(hexOf('add', ['−A', '1']), '-9', 'typographic minus'); eq(hexOf('add', ['+A', '1']), 'B', 'plus sign'); eq(hexOf('add', ['-0', '0']), '0', 'negative zero is zero'); eq(ar('add', ['A.8', '1']).ok, false, 'fraction refused in arithmetic');
eq(ar('add', ['A', '']).empty, true, 'empty operand flagged as empty'); eq(ar('add', ['A']).ok, false, 'one operand is not enough'); eq(ar('add', ['-', '1']).ok, false, 'sign with no digits'); eq(ar('add', ['0x', '1']).ok, false, 'prefix with no digits');
eq(ar('div', ['1', '1', '1']).ok, false, 'division takes two'); eq(ar('add', ['1', '1'], 'bogus').ok, false, 'unknown padding'); eq(ar('pow', ['1', '1']).ok, false, 'unknown operation');
/* ---- display options ---- */
eq(ar('add', ['A', 'F'], '4').result.hexPadded, '0019', 'pad to 4 digits'); eq(ar('add', ['FFFF', '1'], '2').result.hexPadded, '10000', 'padding never truncates'); eq(ar('add', ['FFFF', '1'], '2').notes.some((t) => /Nothing is truncated/.test(t)), true, 'padding note');
eq(ar('sub', ['1', '5'], '4').result.hexPadded, '-0004', 'negative padded'); eq(ar('add', ['0F', '1'], 'match').result.hexPadded, '10', 'match keeps at least the typed width'); eq(ar('add', ['00F', '1'], 'match').result.hexPadded, '010', 'match widest operand');
eq(X.arith({ op: 'add', operands: ['AA', '1'], hexCase: 'lower', prefix: true }).result.hexPadded, '0xab', 'lowercase with prefix'); eq(X.arith({ op: 'add', operands: ['AAAA', '1'], group: 2 }).result.hexPadded, 'AA AB', 'byte grouping');
eq(X.convert({ input: 'FF', from: 16, prefix: true }).out[16].text, '0xFF', 'convert prefix'); eq(X.bitwise({ op: 'or', a: 'AA', b: '01', width: 8, hexCase: 'lower' }).resultHex, 'ab', 'bitwise lowercase');
/* ---- fixed width is never silently narrowed ---- */
eq(bw('and', '1FF', '0F', 8).ok, false, 'operand wider than the width is refused'); eq(bw('and', 'AA', '1FF', 8).field, 'b', 'error points at B'); eq(bw('shl', 'AA', undefined, 8, 9).ok, false, 'shift larger than the width'); eq(bw('shl', 'AA', undefined, 8, 8).resultHex, '00', 'shift by the full width');
eq(bw('not', '0F').resultHex, 'F0', 'auto width keeps leading zeros'); eq(bw('and', 'A', 'F').resultHex, 'A', 'auto width of one digit is 4 bits'); eq(bw('and', 'AA', '0F', 'x').ok, false, 'bad width'); eq(bw('and', '-AA', '0F').ok, false, 'negative bit pattern refused');
eq(X.tool('register', { value: 'AA', width: 4 }).ok, false, 'value wider than the register'); eq(X.tool('register', { value: 'AA', width: 8, fields: 'x 9:2' }).ok, false, 'field outside the register'); eq(X.tool('register', { value: 'AA', width: 8, edit: 'set', index: 8 }).ok, false, 'bit index out of range');
/* ---- arbitrary precision ---- */
const big = 'F'.repeat(300); eq(hexOf('add', [big, '1']), '1' + '0'.repeat(300), '300-digit carry ripple'); eq(ar('mul', [big, big]).result.dec, ((1n << 1200n) - 1n) * ((1n << 1200n) - 1n), '300-digit product');
eq(ar('add', ['F'.repeat(1025), '1']).ok, false, 'over the digit limit'); eq(ar('add', Array(21).fill('1')).ok, false, 'too many operands'); eq(ar('add', Array(20).fill('1')).result.dec, '20', '20 operands');
eq(ar('sub', ['A', '3', '2']).result.dec, '5', 'chained subtraction'); eq(ar('mul', ['2', '3', '4']).result.dec, '24', 'chained multiplication');
/* ---- exports ---- */
const r1 = ar('div', ['64', '8'], 'min');
eq(X.exportCsv(r1).split('\n')[0], 'item,value', 'csv header'); eq(JSON.parse(X.exportJson(r1)).results['Remainder (hex)'], '4', 'json remainder'); eq(/Quotient/.test(X.exportTxt(r1)), true, 'txt quotient');
eq(ar('add', ['1A3', '1']).operands[0].placeValue, '256 + 10×16 + 3', 'place value expansion'); eq(ar('add', ['01A3', '1']).operands[0].leadingZeros, 1, 'leading zero count');
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
