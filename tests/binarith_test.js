/* Tests for tools/binarith_engine.js (Binary Calculator, Mode 01) against tests/binarith_vectors.json (independent: gen_binarith_vectors.py, plain Python integers)
   and the cases in the CEO product decision. Run: node tests/binarith_test.js */
const B = require('../tools/binarith_engine.js'), V = require('./binarith_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 15) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
for (const v of V) {
  const tag = v.op + ' ' + v.ops.join(' | ').slice(0, 80);
  const r = B.run({ op: v.op, operands: v.ops });
  n++;
  if (v.err) { if (r.ok || r.field !== 1) bad(tag + ': division by zero should be refused on the divisor'); continue; }
  if (!r.ok) { bad(tag + ' errored: ' + r.error); continue; }
  eq(r.result.dec, v.r, tag + ' decimal'); eq(r.result.bits, v.bits, tag + ' binary');
  if (v.rem !== undefined) { eq(r.remainder.dec, v.rem, tag + ' remainder'); eq(r.remainder.bits, v.remBits, tag + ' remainder bits'); }
  if (v.step) { const d = r.stepData[0]; eq(d.kind, v.step.kind, tag + ' step kind'); eq(d.x, v.step.x, tag + ' step x'); eq(d.y, v.step.y, tag + ' step y'); eq(d.row, v.step.row, tag + ' carry/borrow row'); }
  if (v.pprows !== undefined) eq(r.stepData[0].rows, v.pprows, tag + ' partial product rows');
  if (v.divrows !== undefined) eq(r.stepData[0].rows, v.divrows, tag + ' long division rows');
  /* the three representations of the result agree */
  const neg = v.bits[0] === '-', m = neg ? v.bits.slice(1) : v.bits, big = BigInt('0b' + m);
  eq(r.result.hex, (neg ? '-' : '') + big.toString(16).toUpperCase(), tag + ' hex'); eq(r.result.oct, (neg ? '-' : '') + big.toString(8), tag + ' octal');
}
const run = (op, ops, pad) => B.run({ op, operands: ops, pad });
/* CEO brief: arithmetic examples, shown at the width of the operands */
eq(run('add', ['1010', '0101'], 'match').result.padded, '1111', 'brief 1010 + 0101');
eq(run('sub', ['1100', '0101'], 'match').result.padded, '0111', 'brief 1100 - 0101');
eq(run('mul', ['101', '11'], 'match').result.padded, '1111', 'brief 101 x 11');
eq(run('div', ['1100', '0011'], 'match').result.padded, '0100', 'brief 1100 / 0011 quotient');
eq(run('div', ['1100', '0011'], 'match').remainder.padded, '0000', 'brief 1100 / 0011 remainder');
eq(run('add', ['10', '11', '100']).result.bits, '1001', 'brief 10 + 11 + 100');
eq(run('add', ['10201', '1']).ok, false, 'brief 10201 is not binary');
eq(run('add', ['10201', '1']).field, 0, 'error points at the first operand');
eq(run('add', ['1', '10201']).field, 1, 'error points at the second operand');
/* beyond the brief */
eq(run('sub', ['101', '1100']).result.bits, '-111', 'negative result');
eq(run('sub', ['101', '101']).result.bits, '0', 'zero has no sign');
eq(run('add', ['-0', '0']).result.dec, '0', 'negative zero is zero');
eq(run('add', ['-101', '11']).result.dec, '-2', 'mixed signs');
eq(run('mul', ['-11', '-11']).result.dec, '9', 'negative times negative');
eq(run('div', ['-111', '10']).result.dec, '-3', 'division truncates toward zero');
eq(run('div', ['-111', '10']).remainder.dec, '-1', 'remainder takes the sign of the dividend');
eq(run('div', ['111', '-10']).remainder.dec, '1', 'remainder with a negative divisor');
eq(run('div', ['0', '101']).result.dec, '0', 'zero dividend');
eq(run('div', ['101', '0']).ok, false, 'division by zero refused');
eq(run('div', ['1', '1', '1']).ok, false, 'division takes two numbers');
eq(run('add', ['1']).ok, false, 'one operand is not enough');
eq(run('add', ['']).ok, false, 'empty input');
eq(run('add', ['', '1']).empty, true, 'empty operand is flagged as empty, not as an error');
eq(run('add', ['1', '1'], 'bogus').ok, false, 'unknown padding');
eq(run('add', ['-', '1']).ok, false, 'sign with no digits');
eq(run('add', ['0b101', '+11']).result.bits, '1000', '0b prefix and plus sign');
eq(run('add', ['1 0 1', '1_1']).result.bits, '1000', 'grouping characters are ignored');
eq(run('add', ['−101', '1']).result.dec, '-4', 'typographic minus sign');
eq(run('add', ['0000101', '1']).result.bits, '110', 'leading zeros');
eq(run('add', ['101', '1'], '8').result.padded, '00000110', 'pad to 8 bits');
eq(run('add', ['1111', '1'], '4').result.padded, '10000', 'padding never truncates');
eq(run('add', ['1111', '1'], '4').notes.some((t) => /Nothing is truncated/.test(t)), true, 'padding note');
eq(run('sub', ['1', '101'], '8').result.padded, '-00000100', 'negative padded result');
/* arbitrary precision */
const big = '1'.repeat(300); eq(run('add', [big, '1']).result.bits, '1' + '0'.repeat(300), '300-bit carry ripple');
eq(run('mul', [big, big]).result.dec, ((1n << 300n) - 1n) * ((1n << 300n) - 1n), '300-bit product');
eq(run('add', ['1'.repeat(4097), '1']).ok, false, 'over the digit limit');
eq(run('add', Array(21).fill('1')).ok, false, 'too many operands');
eq(run('add', Array(20).fill('1')).result.dec, '20', '20 operands');
/* multi-operand evaluation order */
eq(run('sub', ['1010', '11', '10']).result.dec, '5', 'chained subtraction');
eq(run('mul', ['10', '11', '100']).result.dec, '24', 'chained multiplication');
/* exports and place values */
const r = run('div', ['1100', '11'], 'match');
eq(B.exportCsv(r).split('\n')[0], 'item,binary,decimal,hexadecimal,octal', 'csv header');
eq(JSON.parse(B.exportJson(r)).remainder.binary, '0000', 'json remainder'); eq(/Quotient/.test(B.exportTxt(r)), true, 'txt quotient');
eq(run('add', ['1010', '1']).operands[0].placeValue, '8 + 2', 'place value expansion');
eq(run('add', ['0101', '1']).operands[0].leadingZeros, 1, 'leading zero count');
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
