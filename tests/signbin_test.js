/* Tests for tools/signbin_engine.js (Binary Calculator, Mode 04: Signed Binary Representations) against tests/signbin_vectors.json (independent: gen_signbin_vectors.py,
   string-built patterns, Python ints and hardware-style simulation) and the cases in the CEO product decision. Run: node tests/signbin_test.js */
const S = require('../tools/signbin_engine.js'), V = require('./signbin_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 15) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const REPS = ['unsigned', 'signmag', 'ones', 'twos'];
for (const v of V) {
  const tag = v.k + ' ' + (v.op || '') + ' ' + v.rep + ' w' + v.w + ' ' + v.base + ' a=' + String(v.a).slice(0, 24) + ' b=' + String(v.b).slice(0, 24) + (v.policy ? ' ' + v.policy : '');
  const o = { op: v.k === 'a' ? 'analyze' : v.k === 'z' ? 'resize' : v.op, rep: v.rep, width: v.w, base: v.base, a: v.a, b: v.b, to: v.to, policy: v.policy };
  let r; try { r = S.run(o); } catch (e) { bad(tag + ' threw ' + e.message); continue; } n++;
  if (v.k === 'x') { if (r.ok) bad(tag + ': should be refused'); else if (!new RegExp(v.why).test(r.error)) bad(tag + ': error should say ' + v.why + ': ' + r.error); continue; }
  if (!r.ok) { bad(tag + ' errored: ' + r.error); continue; }
  const x = v.x;
  if (v.k === 'a') {
    const d = r.result;
    eq(d.bin, x.bin, tag + ' bits'); eq(d.hex, x.hex, tag + ' hex'); eq(d.uns, x.uns, tag + ' unsigned'); eq(d.value, x.value, tag + ' value'); eq(d.sign, x.sign, tag + ' sign bit');
    eq(d.onesComp, x.ones, tag + ' one’s complement of the bits'); eq(d.twosComp, x.twos, tag + ' two’s complement of the bits'); eq(r.range.min, x.min, tag + ' min'); eq(r.range.max, x.max, tag + ' max');
    d.reads.forEach((q) => eq(q.value, x.reads[q.rep], tag + ' reading as ' + q.rep));
    if (x.writes) { eq(r.writes.length, 4, tag + ' four representations written'); r.writes.forEach((q) => eq(q.bin, x.writes[q.rep], tag + ' writing as ' + q.rep)); }
    eq(d.negZero, /^-0$/.test(x.value), tag + ' negative zero flag');
  } else if (v.k === 'z') { eq(r.result.bin, x.bin, tag + ' resized bits'); eq(r.result.value, x.value, tag + ' resized value'); eq(r.result.bin.length, Number(v.to), tag + ' new width'); }
  else {
    eq(r.calc.exact, x.exact, tag + ' true result'); eq(r.calc.flag, x.flag, tag + ' flag');
    if (x.flag === null) { eq(r.result.bin, x.stored, tag + ' stored bits'); eq(r.result.value, x.value, tag + ' stored value'); eq(r.warnings.filter((w) => /verflow|nderflow/.test(w.kind)).length, 0, tag + ' no warning'); }
    else {
      eq(r.calc.wrap.bin, x.wrap, tag + ' wrap-around bits'); eq(r.calc.wrap.value, x.wrapValue, tag + ' wrap-around value'); eq(r.calc.sat.bin, x.sat, tag + ' saturated bits'); eq(r.calc.sat.value, x.satValue, tag + ' saturated value');
      if (x.stored === null) eq(r.result, null, tag + ' nothing stored'); else { eq(r.result.bin, x.stored, tag + ' stored bits'); eq(r.result.value, x.value, tag + ' stored value'); }
      eq(r.warnings.some((w) => w.kind === x.flag), true, tag + ' warning shown');
    }
  }
}
const run = (o) => S.run(Object.assign({ base: 'dec', width: '8', rep: 'twos' }, o)), bits = (o) => run(o).result.bin;
/* CEO brief examples */
eq(bits({ op: 'analyze', a: '5' }), '00000101', 'brief +5 = 00000101'); eq(bits({ op: 'analyze', a: '-5' }), '11111011', 'brief -5 = 11111011 in 8-bit two’s complement');
eq(run({ op: 'analyze', a: '-5' }).steps[0].text.indexOf('1111 1010') > 0, true, 'working shows the inverted bits 11111010'); eq(run({ op: 'analyze', base: 'bin', a: '11111111' }).result.value, '-1', '11111111 is -1 in 8-bit two’s complement');
eq(run({ op: 'analyze', base: 'bin', rep: 'unsigned', a: '11111111' }).result.value, '255', '11111111 is 255 unsigned'); eq(run({ op: 'analyze', base: 'bin', a: '11111111' }).result.reads.map((q) => q.value).join(','), '-1,-0,-127,255', 'same bits in each representation (two’s, one’s, sign-magnitude, unsigned)');
eq(run({ op: 'analyze', a: '-128' }).result.bin, '10000000', '-128 fits 8-bit two’s complement'); eq(run({ op: 'analyze', a: '128' }).ok, false, '128 overflows 8-bit two’s complement'); eq(run({ op: 'analyze', a: '-129' }).error.indexOf('underflow') > 0, true, '-129 underflows');
eq(run({ op: 'analyze', a: '127' }).range.max, '127', 'range max'); eq(run({ op: 'analyze', a: '127' }).range.min, '-128', 'range min');
/* representations */
eq(bits({ op: 'analyze', rep: 'signmag', a: '-5' }), '10000101', 'sign-magnitude -5'); eq(bits({ op: 'analyze', rep: 'ones', a: '-5' }), '11111010', 'one’s complement -5'); eq(run({ op: 'analyze', rep: 'unsigned', a: '-1' }).ok, false, 'unsigned refuses a negative');
eq(run({ op: 'analyze', rep: 'ones', base: 'bin', a: '11111111' }).warnings.some((w) => w.kind === 'negzero'), true, 'negative zero warned (one’s complement)'); eq(run({ op: 'analyze', rep: 'signmag', base: 'bin', a: '10000000' }).result.value, '-0', 'sign-magnitude -0');
eq(run({ op: 'analyze', base: 'bin', a: '10000000' }).warnings.some((w) => w.kind === 'min'), true, 'minimum two’s complement value warned');
eq(run({ op: 'analyze', rep: 'ones', a: '-128' }).ok, false, 'one’s complement minimum is -127'); eq(run({ op: 'analyze', rep: 'signmag', a: '-127' }).result.bin, '11111111', 'sign-magnitude -127');
eq(run({ op: 'analyze', base: 'bin', a: '101' }).result.bin, '00000101', 'a short pattern is zero-padded, not sign-extended'); eq(run({ op: 'analyze', base: 'bin', a: '101' }).notes[0].indexOf('padded') > 0, true, 'note about padding');
eq(run({ op: 'analyze', base: 'bin', a: '-101' }).ok, false, 'a sign on a pattern is refused'); eq(run({ op: 'analyze', base: 'bin', a: '102' }).error.indexOf('‘2’') === 0, true, 'names the bad digit'); eq(run({ op: 'analyze', base: 'bin', a: '100000000' }).ok, false, 'a wide pattern is refused, not truncated');
eq(run({ op: 'analyze', base: 'hex', a: 'FF' }).result.value, '-1', 'hex pattern'); eq(run({ op: 'analyze', base: 'oct', a: '377' }).result.value, '-1', 'octal pattern'); eq(run({ op: 'analyze', a: '' }).empty, true, 'empty flagged');
eq(run({ op: 'analyze', a: '5', width: '7' }).ok, false, 'unknown width'); eq(run({ op: 'analyze', a: '5', rep: 'x' }).ok, false, 'unknown representation'); eq(run({ op: 'bogus', a: '5' }).ok, false, 'unknown operation');
/* overflow and underflow */
eq(run({ op: 'add', a: '100', b: '50' }).calc.flag, 'overflow', '100 + 50 overflows'); eq(run({ op: 'add', a: '100', b: '50' }).result, null, 'report policy stores nothing'); eq(run({ op: 'add', a: '100', b: '50', policy: 'wrap' }).result.value, '-106', 'wrap 150 to -106');
eq(run({ op: 'add', a: '100', b: '50', policy: 'sat' }).result.value, '127', 'saturate at 127'); eq(run({ op: 'add', a: '-100', b: '-50' }).calc.flag, 'underflow', '-100 + -50 underflows'); eq(run({ op: 'add', a: '-100', b: '-50', policy: 'sat' }).result.value, '-128', 'saturate at -128');
eq(run({ op: 'sub', a: '-100', b: '50', policy: 'wrap' }).result.value, '106', 'wrap -150 to 106'); eq(run({ op: 'sub', a: '5', b: '3' }).result.bin, '00000010', '5 - 3'); eq(run({ op: 'sub', a: '0', b: '-128' }).calc.flag, 'overflow', '0 - (-128) overflows');
eq(run({ op: 'neg', a: '-128' }).calc.flag, 'overflow', 'negating the minimum overflows'); eq(run({ op: 'neg', a: '-128', policy: 'wrap' }).result.bin, '10000000', 'the minimum negates to itself'); eq(run({ op: 'neg', a: '5' }).result.bin, '11111011', 'negate 5');
eq(run({ op: 'neg', rep: 'unsigned', a: '5' }).calc.flag, 'underflow', 'unsigned cannot be negated'); eq(run({ op: 'neg', rep: 'unsigned', a: '0' }).calc.flag, null, 'unsigned zero negates to zero');
eq(run({ op: 'sub', rep: 'unsigned', a: '3', b: '5' }).calc.flag, 'underflow', 'unsigned 3 - 5 underflows'); eq(run({ op: 'sub', rep: 'unsigned', a: '3', b: '5', policy: 'wrap' }).result.value, '254', 'unsigned wrap 3 - 5 = 254');
eq(run({ op: 'add', rep: 'ones', a: '5', b: '-5' }).result.value, '0', 'one’s complement 5 + -5 = 0'); eq(run({ op: 'add', rep: 'ones', a: '5', b: '-5' }).notes.some((t) => /negative zero/.test(t)), true, 'note about the -0 hardware sum');
eq(run({ op: 'add', rep: 'signmag', a: '100', b: '27' }).result.value, '127', 'sign-magnitude add'); eq(run({ op: 'add', rep: 'signmag', a: '-100', b: '-100', policy: 'wrap' }).result.value, '-72', 'sign-magnitude wrap keeps the sign');
eq(run({ op: 'add', rep: 'signmag', a: '5', b: '-8' }).result.bin, '10000011', 'sign-magnitude different signs'); eq(run({ op: 'add', width: '4', a: '7', b: '1' }).calc.flag, 'overflow', '4-bit: 7 + 1 overflows'); eq(run({ op: 'add', width: '4', a: '7', b: '1', policy: 'wrap' }).result.bin, '1000', '4-bit wrap 7 + 1 = 1000');
/* width change */
eq(run({ op: 'resize', a: '-5', to: '16' }).result.bin, '1111111111111011', 'sign-extend -5 to 16 bits'); eq(run({ op: 'resize', a: '5', to: '16' }).result.bin, '0000000000000101', 'sign-extend +5'); eq(run({ op: 'resize', a: '-5', to: '16' }).notes.some((t) => t.indexOf('0000 0000 1111 1011') > 0), true, 'zero-extension mistake shown');
eq(run({ op: 'resize', rep: 'signmag', a: '-5', to: '16' }).result.bin, '1000000000000101', 'sign-magnitude widening moves the sign bit'); eq(run({ op: 'resize', a: '200', rep: 'unsigned', to: '16' }).result.bin, '0000000011001000', 'unsigned widening');
eq(run({ op: 'resize', a: '-5', width: '16', to: '8' }).result.bin, '11111011', 'narrow -5 to 8 bits'); eq(run({ op: 'resize', a: '300', width: '16', to: '8' }).ok, false, 'narrowing that changes the value is refused'); eq(run({ op: 'resize', a: '-300', width: '16', to: '8' }).error.indexOf('underflow') > 0, true, 'narrowing underflow named');
eq(run({ op: 'resize', rep: 'ones', base: 'bin', a: '11111111', to: '16' }).result.value, '-0', 'negative zero stays negative zero');
/* working, notes and exports */
const w = run({ op: 'add', a: '100', b: '50', policy: 'wrap' }); eq(w.steps.map((s) => s.title).join('|'), 'The operands|The exact result|How the hardware does it|Range check|If the result is squeezed into 8 bits|Selected overflow policy|The stored result', 'working steps for an overflow');
eq(/carry into MSB/.test(w.steps[2].text), true, 'carry into the sign bit shown'); eq(S.exportCsv(w).split('\n')[0], 'item,binary,hex,unsigned,value_in_twos', 'csv header'); eq(JSON.parse(S.exportJson(w)).trueResult, '150', 'json true result'); eq(JSON.parse(S.exportJson(w)).flag, 'overflow', 'json flag'); eq(/Signed Binary/.test(S.exportTxt(w)), true, 'txt title');
const a64 = run({ op: 'analyze', width: '64', a: '-9223372036854775808' }); eq(a64.result.hex, '8000000000000000', '64-bit minimum'); eq(run({ op: 'analyze', width: '64', a: '9223372036854775808' }).ok, false, '64-bit overflow');
REPS.forEach((rep) => { eq(run({ op: 'analyze', rep, a: '0' }).result.bin, '00000000', rep + ' zero'); });
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
