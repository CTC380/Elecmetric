/* Tests for tools/numconv_engine.js (Binary Calculator, Mode 02: Number System Conversion) against tests/numconv_vectors.json
   (independent: gen_numconv_vectors.py, Python integers and Fractions, digits by one big-integer division, not the engine's repeated multiplication)
   and the cases in the CEO product decision. Run: node tests/numconv_test.js */
const C = require('../tools/numconv_engine.js'), V = require('./numconv_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 15) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const ID = ['bin', 'oct', 'dec', 'hex'];
for (const v of V) {
  const tag = v.k + ' ' + v.f + ' ' + String(v.t).slice(0, 60) + (v.rep ? ' ' + v.rep + ' ' + v.w : '');
  if (v.k === 'x') { const r = C.run({ from: v.f, text: v.t }); n++; if (r.ok) bad(tag + ': should be refused'); continue; }
  if (v.k === 's') {
    const r = C.run({ from: v.f, text: v.t, fracDigits: v.n, pad: v.p }); n++;
    if (!r.ok) { bad(tag + ' errored: ' + r.error); continue; }
    for (const id of ID) {
      const x = r.outputs[id], e = v.e[id];
      eq(x.text, e[0], tag + ' ' + id + ' text'); eq(x.approx, e[1], tag + ' ' + id + ' cut-off flag');
      if (e[1]) eq(x.repeat, e[2], tag + ' ' + id + ' repeating form');
    }
    continue;
  }
  const r = C.run({ from: v.f, text: v.t, rep: v.rep, width: v.w }); n++;
  if (v.err) { if (r.ok) bad(tag + ': should be refused (' + v.err + ')'); continue; }
  if (!r.ok) { bad(tag + ' errored: ' + r.error); continue; }
  for (const id of ID) eq(r.outputs[id].text, v.e[id], tag + ' ' + id);
  eq(r.fixed.unsigned, v.e.uns, tag + ' unsigned value');
  eq(r.fixed.compare.map((c) => c.value).join(','), v.e.cmp.join(','), tag + ' same bits in every representation');
  eq(r.fixed.compare.filter((c) => c.selected).length, 1, tag + ' one representation is marked as selected');
}
const run = (o) => C.run(o), out = (o, id) => run(o).outputs[id].text;
/* CEO brief: the six conversions */
eq(out({ from: 'bin', text: '10101010' }, 'dec'), '170', 'brief binary to decimal');
eq(out({ from: 'dec', text: '170' }, 'bin'), '10101010', 'brief decimal to binary');
eq(out({ from: 'bin', text: '10101010' }, 'oct'), '252', 'brief binary to octal');
eq(out({ from: 'bin', text: '10101010' }, 'hex'), 'AA', 'brief binary to hexadecimal');
eq(out({ from: 'hex', text: 'FF' }, 'bin'), '11111111', 'brief hexadecimal to binary');
eq(out({ from: 'oct', text: '77' }, 'bin'), '111111', 'brief octal to binary');
/* CEO brief: the same bits, two readings */
eq(run({ from: 'bin', text: '11111111', rep: 'unsigned', width: 8 }).outputs.dec.text, '255', 'brief 11111111 unsigned');
eq(run({ from: 'bin', text: '11111111', rep: 'twos', width: 8 }).outputs.dec.text, '-1', 'brief 11111111 as 8-bit two’s complement');
eq(run({ from: 'dec', text: '-5', rep: 'twos', width: 8 }).outputs.bin.text, '11111011', 'brief -5 in 8-bit two’s complement');
eq(run({ from: 'dec', text: '5', rep: 'twos', width: 8 }).outputs.bin.text, '00000101', 'brief +5 in 8-bit two’s complement');
eq(run({ from: 'bin', text: '10201' }).ok, false, 'brief 10201 is not binary');
eq(run({ from: 'bin', text: '10201' }).error.indexOf('‘2’') === 0, true, 'the error names the bad digit');
/* register example from the brief: 10101010 */
const reg = run({ from: 'bin', text: '10101010', rep: 'unsigned', width: 8 }).fixed;
eq(reg.msb, '1', 'register MSB'); eq(reg.lsb, '0', 'register LSB'); eq(reg.setBits, 4, 'register set bits'); eq(reg.clearBits, 4, 'register clear bits');
/* fractions */
eq(out({ from: 'bin', text: '101.101' }, 'dec'), '5.625', 'binary fraction to decimal'); eq(out({ from: 'bin', text: '101.101' }, 'oct'), '5.5', 'binary fraction to octal'); eq(out({ from: 'bin', text: '101.101' }, 'hex'), '5.A', 'binary fraction to hex');
eq(out({ from: 'dec', text: '0.5' }, 'bin'), '0.1', 'decimal 0.5 is exact in binary'); eq(run({ from: 'dec', text: '0.5' }).outputs.bin.approx, false, '0.5 is not marked as cut off');
const tenth = run({ from: 'dec', text: '0.1', fracDigits: 16 }).outputs.bin;
eq(tenth.text, '0.0001100110011001', '0.1 in binary, cut off at 16 digits'); eq(tenth.approx, true, '0.1 in binary is marked as cut off'); eq(tenth.repeat, '0.0(0011)', '0.1 repeating block');
eq(run({ from: 'dec', text: '0.1', fracDigits: 8 }).outputs.bin.text, '0.00011001', 'truncated, not rounded (the next digit is 1)');
eq(out({ from: 'dec', text: '255.5' }, 'hex'), 'FF.8', 'decimal fraction to hex');
eq(out({ from: 'hex', text: '1F.8' }, 'oct'), '37.4', 'hex to octal through the bits');
eq(out({ from: 'dec', text: '-255.375' }, 'bin'), '-11111111.011', 'negative fraction');
eq(out({ from: 'dec', text: '.5' }, 'dec'), '0.5', 'leading radix point'); eq(out({ from: 'dec', text: '5.' }, 'bin'), '101', 'trailing radix point');
eq(out({ from: 'dec', text: '1.500' }, 'dec'), '1.5', 'trailing fraction zeros dropped');
eq(out({ from: 'dec', text: '-0' }, 'bin'), '0', 'negative zero is zero (minus-sign mode)'); eq(out({ from: 'dec', text: '-0.0' }, 'hex'), '0', 'negative zero fraction');
/* large integers and limits */
const bigDec = '9'.repeat(300); eq(out({ from: 'dec', text: bigDec }, 'hex'), BigInt(bigDec).toString(16).toUpperCase(), '300-digit decimal to hex');
eq(run({ from: 'dec', text: '1'.repeat(4097) }).ok, false, 'over the digit limit'); eq(run({ from: 'dec', text: '0.' + '1'.repeat(513) }).ok, false, 'over the fraction digit limit');
eq(run({ from: 'dec', text: '0.' + '1'.repeat(512) }).ok, true, 'at the fraction digit limit');
/* padding only widens */
eq(out({ from: 'bin', text: '1111', pad: '8' }, 'hex'), '0F', 'pad to 8 bits (hex)'); eq(out({ from: 'bin', text: '1111', pad: '8' }, 'oct'), '017', 'pad to 8 bits (octal)');
eq(out({ from: 'bin', text: '0000 1111', pad: 'match' }, 'hex'), '0F', 'match the typed width'); eq(out({ from: 'hex', text: '00FF', pad: 'match' }, 'bin'), '0000000011111111', 'match the typed width (hex)');
eq(out({ from: 'bin', text: '1111111111', pad: '8' }, 'bin'), '1111111111', 'padding never truncates');
eq(run({ from: 'bin', text: '1111111111', pad: '8' }).notes.some((t) => /Nothing is truncated/.test(t)), true, 'padding note');
/* fixed width: every representation at 8 bits */
const cmp8 = (t) => run({ from: 'bin', text: t, rep: 'twos', width: 8 }).fixed.compare.map((c) => c.value).join(' ');
eq(cmp8('11111111'), '255 -127 -0 -1', '11111111 in every representation'); eq(cmp8('10000000'), '128 -0 -127 -128', '10000000 in every representation'); eq(cmp8('01111111'), '127 127 127 127', '01111111');
eq(run({ from: 'dec', text: '-128', rep: 'twos', width: 8 }).outputs.hex.text, '80', 'two’s complement minimum'); eq(run({ from: 'dec', text: '127', rep: 'twos', width: 8 }).outputs.hex.text, '7F', 'two’s complement maximum');
eq(run({ from: 'dec', text: '128', rep: 'twos', width: 8 }).ok, false, 'one above the maximum is refused, not wrapped'); eq(run({ from: 'dec', text: '-129', rep: 'twos', width: 8 }).ok, false, 'one below the minimum is refused');
eq(run({ from: 'dec', text: '-128', rep: 'signmag', width: 8 }).ok, false, 'sign-magnitude has no -128'); eq(run({ from: 'dec', text: '-0', rep: 'ones', width: 8 }).outputs.bin.text, '00000000', '-0 is encoded as all zeros');
eq(run({ from: 'bin', text: '11111111', rep: 'ones', width: 8 }).fixed.negZero, true, 'one’s complement negative zero'); eq(run({ from: 'bin', text: '10000000', rep: 'signmag', width: 8 }).outputs.dec.text, '-0', 'sign-magnitude negative zero');
eq(run({ from: 'dec', text: '-1', rep: 'twos', width: 64 }).outputs.hex.text, 'FFFFFFFFFFFFFFFF', '64-bit -1'); eq(run({ from: 'dec', text: '-9223372036854775808', rep: 'twos', width: 64 }).outputs.hex.text, '8000000000000000', '64-bit minimum');
eq(run({ from: 'dec', text: '18446744073709551615', rep: 'unsigned', width: 64 }).outputs.hex.text, 'FFFFFFFFFFFFFFFF', '64-bit unsigned maximum');
eq(run({ from: 'dec', text: '-1', rep: 'unsigned', width: 8 }).ok, false, 'negative unsigned refused'); eq(run({ from: 'bin', text: '-1', rep: 'twos', width: 8 }).ok, false, 'sign on a pattern refused');
eq(run({ from: 'dec', text: '1.5', rep: 'twos', width: 8 }).ok, false, 'fraction in a fixed width mode refused'); eq(run({ from: 'dec', text: '5.0', rep: 'twos', width: 8 }).ok, true, '5.0 is a whole number');
eq(run({ from: 'bin', text: '100000000', rep: 'unsigned', width: 8 }).ok, false, 'a 9-bit pattern does not fit in 8 bits'); eq(run({ from: 'bin', text: '000000101', rep: 'unsigned', width: 8 }).ok, true, 'extra leading zeros fit');
eq(run({ from: 'dec', text: '5', rep: 'twos', width: 4 }).outputs.oct.text, '05', '4-bit octal pattern has 2 digits');
/* option checks */
['bogus'].forEach((b) => { eq(run({ from: b, text: '1' }).ok, false, 'unknown system'); eq(run({ from: 'bin', text: '1', to: b }).ok, false, 'unknown target'); eq(run({ from: 'bin', text: '1', rep: b }).ok, false, 'unknown representation'); eq(run({ from: 'bin', text: '1', pad: b }).ok, false, 'unknown padding'); });
eq(run({ from: 'bin', text: '1', width: 7, rep: 'twos' }).ok, false, 'unknown width'); eq(run({ from: 'bin', text: '1', fracDigits: 9 }).ok, false, 'unknown fraction digit setting');
eq(run({ from: 'bin', text: '' }).empty, true, 'empty input is flagged as empty, not as an error'); eq(run({ from: 'bin', text: '0b101' }).outputs.dec.text, '5', '0b prefix'); eq(run({ from: 'hex', text: '0xff' }).outputs.dec.text, '255', '0x prefix'); eq(run({ from: 'oct', text: '0o17' }).outputs.dec.text, '15', '0o prefix');
eq(run({ from: 'hex', text: '0b1' }).outputs.dec.text, '177', '0b is hex digits in hexadecimal'); eq(run({ from: 'hex', text: 'ff' }).outputs.hex.text, 'FF', 'lower case hex'); eq(run({ from: 'dec', text: '1 000 000' }).outputs.dec.text, '1000000', 'grouping spaces'); eq(run({ from: 'dec', text: '−5' }).outputs.dec.text, '-5', 'typographic minus');
/* round trip: every exact result read back in its own system gives the same value */
let rt = 0;
for (const v of V) { if (v.k !== 's' || rt > 300) continue; const r = run({ from: v.f, text: v.t, fracDigits: v.n }); for (const id of ID) { const x = r.outputs[id]; if (x.approx) continue; const back = run({ from: id, text: x.text }); rt++; eq(back.outputs.dec.text, r.outputs.dec.text, 'round trip ' + v.f + ' -> ' + id + ' ' + String(v.t).slice(0, 30)); } }
/* working is written, and the exports parse */
const w = run({ from: 'dec', text: '170', to: 'bin' }); eq(w.steps.some((s) => /Divide by 2/.test(s.text)), true, 'division table written'); eq(/Read the remainders upward: 10101010/.test(w.steps.map((s) => s.text).join('\n')), true, 'remainders read upward');
const g = run({ from: 'bin', text: '10101010', to: 'hex' }); eq(/1010 1010/.test(g.steps.map((s) => s.text).join('\n')), true, 'grouping written');
const m = run({ from: 'dec', text: '0.1', to: 'bin' }); eq(/Multiply the fraction by 2/.test(m.steps.map((s) => s.text).join('\n')), true, 'multiplication table written');
const t8 = run({ from: 'dec', text: '-5', rep: 'twos', width: 8 }); eq(/invert every bit/.test(t8.steps.map((s) => s.text).join('\n')), true, 'two’s complement working written');
eq(C.exportCsv(m).split('\n')[0], 'system,value,exact,repeating', 'csv header'); eq(JSON.parse(C.exportJson(t8)).bitWidth, 8, 'json bit width'); eq(JSON.parse(C.exportJson(m)).results.binary.repeating, '0.0(0011)', 'json repeating form'); eq(/Elecmetric Binary Calculator: Number System Conversion/.test(C.exportTxt(w)), true, 'txt title');
eq(JSON.parse(C.exportJson(t8)).sameBits.length, 4, 'json lists every representation');
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
