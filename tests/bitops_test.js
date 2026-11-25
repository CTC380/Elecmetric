/* Tests for tools/bitops_engine.js (Binary Calculator, Mode 03: Bitwise Operations) against tests/bitops_vectors.json (independent: gen_bitops_vectors.py, Python ints and masks)
   and the cases in the CEO product decision. Run: node tests/bitops_test.js */
const B = require('../tools/bitops_engine.js'), V = require('./bitops_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 15) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
for (const v of V) {
  const tag = v.op + ' ' + v.base + ' w' + v.w + ' a=' + String(v.a).slice(0, 20) + ' b=' + String(v.b).slice(0, 20) + ' n=' + v.n;
  const r = B.run({ op: v.op, base: v.base, a: v.a, b: v.b, n: v.n, width: v.w }); n++;
  if (v.k === 'x') { if (r.ok) bad(tag + ': should be refused'); continue; }
  if (!r.ok) { bad(tag + ' errored: ' + r.error); continue; }
  const x = v.x;
  eq(r.result.bin, x.bin, tag + ' result bits'); eq(r.result.hex, x.hex, tag + ' hex'); eq(r.result.uns, x.uns, tag + ' unsigned'); eq(r.result.sgn, x.sgn, tag + ' signed'); eq(r.a.sgn, x.a_sgn, tag + ' A signed');
  eq(r.lost, x.lost, tag + ' bits shifted out'); eq(r.changedCount, x.changed, tag + ' columns changed'); eq(r.rows.length, r.width, tag + ' one column per bit');
  if (x.width) eq(r.width, x.width, tag + ' automatic width');
  if (x.diff) eq(r.diff.positions.join(','), x.diff.join(','), tag + ' differing positions');
  if (x.bit !== undefined) eq(r.bit.value, x.bit, tag + ' tested bit');
  if (v.op === 'shl') { eq(r.shift.unsignedOverflow, x.uov, tag + ' unsigned overflow'); eq(r.shift.signedOverflow, x.sov, tag + ' signed overflow'); }
  eq(r.rows.map((c) => c.r).join(''), x.bin, tag + ' column results spell the result');
}
const run = (o) => B.run(Object.assign({ base: 'bin', width: '8' }, o)), bits = (o) => run(o).result.bin;
/* CEO brief examples */
eq(bits({ op: 'and', a: '00001111', b: '11110000', width: 'auto' }), '00000000', 'brief 00001111 AND 11110000'); eq(bits({ op: 'or', a: '1010', b: '0101', width: 'auto' }), '1111', 'brief 1010 OR 0101');
eq(bits({ op: 'xor', a: '1010', b: '1100', width: 'auto' }), '0110', 'brief 1010 XOR 1100'); eq(bits({ op: 'not', a: '00001111' }), '11110000', 'brief 8-bit NOT 00001111');
eq(bits({ op: 'shl', a: '1010', n: '2', width: '8' }), '00101000', 'brief 1010 << 2 (8 bits)'); eq(bits({ op: 'shl', a: '1010', n: '2', width: '4' }), '1000', 'brief 1010 << 2 (4 bits, a 1 is lost)');
eq(bits({ op: 'shr', a: '1010', n: '1', width: '4' }), '0101', 'brief 1010 >> 1'); eq(bits({ op: 'and', a: '10101010', b: '00001111', width: 'auto' }), '00001010', 'brief 10101010 AND 00001111');
eq(bits({ op: 'or', a: '10101010', b: '00000001', width: 'auto' }), '10101011', 'brief register: set bit 0 by OR 00000001');
/* width rules */
eq(run({ op: 'not', a: '1', width: 'auto' }).ok, false, 'NOT needs a width'); eq(run({ op: 'shl', a: '1', n: '1', width: 'auto' }).ok, false, 'shift needs a width');
eq(bits({ op: 'not', a: '00001111', width: '16' }), '1111111111110000', 'NOT depends on the width');
eq(run({ op: 'and', a: '100000000', b: '1', width: '8' }).ok, false, 'a wide pattern is refused, not truncated');
eq(run({ op: 'and', a: '0000 1111', b: '1111_0000', width: 'auto' }).result.bin, '00000000', 'spaces and underscores');
/* the two right shifts differ for a negative value */
eq(bits({ op: 'shr', a: '10110000', n: '2' }), '00101100', 'logical right shift fills zeros'); eq(bits({ op: 'sar', a: '10110000', n: '2' }), '11101100', 'arithmetic right shift copies the sign');
eq(bits({ op: 'sar', a: '01110000', n: '2' }), '00011100', 'arithmetic shift of a positive value'); eq(bits({ op: 'sar', a: '10000000', n: '8' }), '11111111', 'arithmetic shift by the full width gives all sign bits'); eq(bits({ op: 'shr', a: '10000000', n: '8' }), '00000000', 'logical shift by the full width gives zero');
eq(run({ op: 'sar', a: '10110000', n: '2' }).notes.some((t) => /different operations/.test(t)), true, 'the note says the right shifts differ'); eq(run({ op: 'sar', a: '01110000', n: '2' }).notes.some((t) => /same result/.test(t)), true, 'the note says when they agree');
eq(run({ op: 'shl', a: '11000001', n: '2' }).notes.some((t) => /Unsigned overflow/.test(t)), true, 'shift left reports a lost 1'); eq(run({ op: 'shl', a: '00000001', n: '7' }).shift.signedOverflow, true, '1 << 7 overflows a signed 8-bit value'); eq(run({ op: 'shl', a: '00000001', n: '7' }).shift.unsignedOverflow, false, '1 << 7 fits unsigned');
eq(run({ op: 'shl', a: '1', n: '0' }).result.bin, '00000001', 'shift by zero'); eq(run({ op: 'shl', a: '1', n: '8' }).result.bin, '00000000', 'shift left by the width');
/* register tools */
eq(bits({ op: 'setbit', a: '10101010', n: '0' }), '10101011', 'set bit 0'); eq(bits({ op: 'clearbit', a: '10101010', n: '7' }), '00101010', 'clear bit 7'); eq(bits({ op: 'togglebit', a: '10101010', n: '1' }), '10101000', 'toggle bit 1');
eq(run({ op: 'testbit', a: '10101010', n: '1' }).bit.value, 1, 'test a set bit'); eq(run({ op: 'testbit', a: '10101010', n: '0' }).bit.value, 0, 'test a clear bit'); eq(bits({ op: 'testbit', a: '10101010', n: '0' }), '10101010', 'testing does not change the register');
eq(run({ op: 'setbit', a: '10101010', n: '8' }).ok, false, 'bit 8 is outside an 8-bit register'); eq(run({ op: 'setbit', a: '10101010', n: '7' }).result.bin, '10101010', 'setting a set bit changes nothing'); eq(run({ op: 'setbit', a: '10101010', n: '7' }).notes.some((t) => /already/.test(t)), true, 'note for an unchanged bit');
const d = run({ op: 'diff', a: '10101010', b: '10100110' }); eq(d.diff.positions.join(','), '3,2', 'compare: differing positions'); eq(d.diff.count, 2, 'compare: Hamming distance');
eq(run({ op: 'diff', a: '1111', b: '1111' }).diff.count, 0, 'compare identical values');
/* number systems and sign handling */
eq(run({ op: 'and', base: 'hex', a: 'FF', b: '0F' }).result.hex, '0F', 'hex operands'); eq(run({ op: 'and', base: 'dec', a: '-1', b: '15' }).result.bin, '00001111', 'a negative decimal is encoded as two’s complement');
eq(run({ op: 'and', base: 'dec', a: '-129', b: '1' }).ok, false, '-129 does not fit 8 bits'); eq(run({ op: 'and', base: 'bin', a: '-1', b: '1' }).ok, false, 'a sign on a bit pattern is refused'); eq(run({ op: 'and', base: 'oct', a: '377', b: '17' }).result.bin, '00001111', 'octal operands');
eq(run({ op: 'and', base: 'bin', a: '102', b: '1' }).error.indexOf('‘2’') === 0, true, 'the error names the bad digit'); eq(run({ op: 'and', base: 'bin', a: '102', b: '1' }).field, 'a', 'the error names the field');
eq(run({ op: 'and', base: 'bin', a: '', b: '1' }).empty, true, 'empty input is flagged'); eq(run({ op: 'and', base: 'bin', a: '1', b: '1', width: '7' }).ok, false, 'unknown width'); eq(run({ op: 'bogus', a: '1' }).ok, false, 'unknown operation');
eq(run({ op: 'and', base: 'bin', a: '1'.repeat(65), b: '1', width: 'auto' }).ok, false, 'wider than 64 bits'); eq(run({ op: 'and', base: 'bin', a: '1'.repeat(64), b: '1', width: 'auto' }).width, 64, '64-bit automatic width');
eq(run({ op: 'not', a: '0'.repeat(64), width: '64' }).result.hex, 'FFFFFFFFFFFFFFFF', '64-bit NOT');
/* working, notes and exports */
const w = run({ op: 'and', a: '10101010', b: '00001111' }); eq(/A           : 1010 1010/.test(w.steps.map((s) => s.text).join('\n')), true, 'bit-by-bit working written'); eq(w.rows.filter((c) => c.changed).length, 2, 'two columns change (bits 7 and 5)');
eq(B.exportCsv(w).split('\n')[0], 'item,binary,hex,octal,unsigned,signed_twos_complement', 'csv header'); eq(JSON.parse(B.exportJson(w)).result.binary, '00001010', 'json result'); eq(JSON.parse(B.exportJson(w)).bits.length, 8, 'json bit rows'); eq(/Bitwise Operations/.test(B.exportTxt(w)), true, 'txt title');
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
