/* Tests for tools/dlogic_engine.js (Binary Calculator, Mode 05: Digital Electronics and Logic) against tests/dlogic_vectors.json (independent: gen_dlogic_vectors.py)
   and the cases in the CEO product decision. Run: node tests/dlogic_test.js */
const D = require('../tools/dlogic_engine.js'), V = require('./dlogic_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 15) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (JSON.stringify(a) !== JSON.stringify(b)) bad(m + ': got ' + JSON.stringify(a) + ', expected ' + JSON.stringify(b)); };
const cov = (cube, i, k) => cube.split('').every((c, j) => c === '-' || Number(c) === ((i >> (k - 1 - j)) & 1));
for (const v of V) {
  const tag = v.k + ' ' + String(v.expr || v.value).slice(0, 60) + ' ' + (v.mask || '') + ' ' + (v.action || v.pmode || '');
  let r; try { r = D.run(Object.assign({ op: { b: 'bool', r: 'reg', p: 'parity', g: 'group' }[v.k] }, v)); } catch (e) { bad(tag + ' threw ' + e.message); continue; } n++;
  if (!r.ok) { bad(tag + ' errored: ' + r.error); continue; }
  const x = v.x;
  if (v.k === 'b') {
    eq(r.vars, x.vars, tag + ' variables'); eq(r.rows.map((q) => q.out).join(''), x.vec, tag + ' truth vector'); eq(r.minterms, x.on, tag + ' minterms'); eq(r.maxterms, x.off, tag + ' maxterms');
    eq(r.canonSop, x.sop, tag + ' canonical SOP'); eq(r.canonPos, x.pos, tag + ' canonical POS'); eq(r.constant, x.dc && x.dc.length ? null : x.const, tag + ' constant');
    if (x.cost) { eq([r.minSop.terms, r.minSop.lits], x.cost, tag + ' minimal SOP cost'); eq([r.minPos.terms, r.minPos.lits], x.poscost, tag + ' minimal POS cost'); }
    const k = r.n, vec = x.vec; r.minSop.cubes.length; for (let i = 0; i < (1 << k); i++) { if (vec[i] === 'X') continue; eq(r.minSop.cubes.some((c) => cov(c, i, k)) ? '1' : '0', vec[i], tag + ' SOP row ' + i); eq(r.minPos.cubes.some((c) => cov(c, i, k)) ? '0' : '1', vec[i], tag + ' POS row ' + i); }
    eq(r.exact, true, tag + ' exact search');
    if (x.equiv) { eq(r.equiv.equal, x.equiv.equal, tag + ' equivalence'); eq(r.equiv.diffCount, x.equiv.diff, tag + ' differing rows'); }
    if (r.mode === 'expr') { const again = D.run({ op: 'bool', expr: r.normalized }); eq(again.rows.map((q) => q.out).join(''), x.vec, tag + ' normalized text re-reads the same'); eq(r.trace.out, r.rows[r.trace.row].out, tag + ' trace'); }
  } else if (v.k === 'r') {
    eq(r.a.bin, x.bin, tag + ' binary'); eq(r.a.hex, x.hex, tag + ' hex'); eq(r.a.oct, x.oct, tag + ' octal'); eq(r.a.dec, x.dec, tag + ' decimal'); eq(r.a.msb, x.msb, tag + ' MSB'); eq(r.a.lsb, x.lsb, tag + ' LSB'); eq(r.a.ones, x.ones, tag + ' set bits');
    eq(r.setPos.slice().sort((a, b) => b - a), x.set, tag + ' set positions'); eq(r.clearPos.slice().sort((a, b) => b - a), x.clear, tag + ' clear positions');
    eq(r.fields.map((f) => ({ name: f.name, bin: f.bin, dec: f.dec })), x.fields, tag + ' fields');
    if (x.result) { eq(r.result.bin, x.result, tag + ' result'); eq(r.mask.bin, x.maskbin, tag + ' mask'); eq(r.changed.slice().sort((a, b) => b - a), x.changed, tag + ' changed bits'); } else eq(r.result, undefined, tag + ' no result without an action');
  } else if (v.k === 'p') {
    if (v.pmode === 'generate') { eq(r.ones, x.ones, tag + ' ones'); eq(r.bit, x.bit, tag + ' parity bit'); eq(r.word.bin, x.word, tag + ' word'); }
    else { eq(r.pass, x.pass, tag + ' verdict'); eq(r.total, x.total, tag + ' total ones'); eq(r.bit, x.bit, tag + ' received bit'); eq(r.data.bin, x.data, tag + ' data'); }
  } else {
    eq(r.a.bin, x.bin, tag + ' binary'); eq(r.nibbles.map((q) => q.bin), x.nib, tag + ' nibbles'); eq(r.bytes.map((q) => q.bin), x.bytes, tag + ' bytes'); eq(r.big, x.big, tag + ' big-endian'); eq(r.little, x.little, tag + ' little-endian');
  }
}
const B = (e, o) => D.run(Object.assign({ op: 'bool', expr: e }, o || {}));
/* brief cases */
eq(B('A AND (B OR NOT C)').minterms, [4, 6, 7], 'A AND (B OR NOT C)'); eq(B('A AND B').rows.map((q) => q.out).join(''), '0001', 'AND table'); eq(B('A XOR B').rows.map((q) => q.out).join(''), '0110', 'XOR table'); eq(B('A NAND B').rows.map((q) => q.out).join(''), '1110', 'NAND table');
eq(B("AB + A'C + BC").minSop.terms, 2, 'consensus term removed'); eq(B("A + A'B").minSop.expr, 'A + B', 'absorption'); eq(B('NOT (A AND B)', { expr2: "A' + B'" }).equiv.equal, true, 'De Morgan');
eq(B('A OR NOT A').constant, 'tautology', 'tautology'); eq(B('A AND NOT A').constant, 'contradiction', 'contradiction'); eq(B('A XOR B', { expr2: 'A OR B' }).equiv.diffCount, 1, 'XOR differs from OR in one row');
eq(B('m(1,3,5,7)', { vars: '3' }).minSop.expr, 'C', 'minterms 1,3,5,7 = C'); eq(B('m(0,1,2,5,6,7,8,9,10,14)', { vars: '4' }).minSop.terms, 3, 'textbook 4-variable function (3 terms, confirmed by the independent search)');
eq(B('a b + c').vars, ['A', 'B', 'C'], 'lowercase and juxtaposition'); eq(B('A&B|!C^D').ok, true, 'symbols'); eq(B('A B C D E F').rowsTotal, 64, 'six variables'); eq(B('A B C D E F G').ok, false, 'seven variables refused');
eq(B('A AND AND B').ok, false, 'double operator'); eq(B('(A OR B').error.indexOf('closing bracket') > 0, true, 'missing bracket'); eq(B('A OR B)').ok, false, 'stray bracket'); eq(B('A $ B').error.indexOf('‘$’') === 0 || B('A $ B').error.indexOf('‘$’') > 0, true, 'bad character named'); eq(B('').empty, true, 'empty'); eq(B('m(9)', { vars: '3' }).ok, false, 'minterm too large');
eq(B('m(1,2) d(2)').ok, false, 'minterm and don’t-care overlap'); eq(B('A', { assign: '10' }).ok, false, 'wrong number of trace inputs'); eq(B('A B', { assign: 'A=1, B=1' }).trace.out, 1, 'trace by name'); eq(B('A B', { assign: '11' }).trace.out, 1, 'trace by bits');
eq(B('A XOR B XOR C XOR D').minSop.terms, 8, 'parity function needs 8 terms'); eq(B('A B').steps.map((s) => s.title).slice(0, 3), ['Read the expression', 'Truth table', 'Minterms and maxterms'], 'working order');
eq(B('A OR (B AND C)').cols.map((c) => c.label), ['B AND C'], 'intermediate columns');
const R = (o) => D.run(Object.assign({ op: 'reg', base: 'bin', width: '8' }, o));
/* register example from the brief */
const reg = R({ value: '10101010' }); eq([reg.a.bin, reg.a.dec, reg.a.oct, reg.a.hex, reg.width, reg.a.msb, reg.a.lsb], ['10101010', '170', '252', 'AA', 8, '1', '0'], 'brief register 10101010');
eq(R({ value: '10101010', mask: '0', action: 'set' }).result.bin, '10101011', 'brief: OR 00000001'); eq(R({ value: '10101010', mask: '1,3,5,7', action: 'clear' }).result.bin, '00000000', 'clear the set bits');
eq(R({ value: '10101010', mask: '0xF0', action: 'keep' }).result.bin, '10100000', 'keep the high nibble'); eq(R({ value: '10101010', mask: '3:0', action: 'toggle' }).result.bin, '10100101', 'toggle a range');
eq(R({ value: '10101010', mask: '4' , action: 'set' }).changed, [4], 'changed bit list'); eq(R({ value: '10101010', mask: '1', action: 'set' }).notes.some((t) => /Nothing changed/.test(t)), true, 'nothing changed note');
eq(R({ value: '10101010', mask: '8', action: 'set' }).ok, false, 'bit outside the register'); eq(R({ value: '101010101' }).ok, false, 'value wider than the register'); eq(R({ value: '-1', base: 'dec' }).ok, false, 'sign refused'); eq(R({ value: '102' }).error.indexOf('‘2’') === 0, true, 'bad digit named');
eq(R({ value: 'AA', base: 'hex', width: 'auto' }).width, 8, 'auto width'); eq(R({ value: '1FF', base: 'hex', width: 'auto' }).width, 16, 'auto width grows by bytes'); eq(R({ value: '10101010', fields: 'MODE:7:6, EN:5, PS:3:0' }).fields.map((f) => f.dec), ['2', '1', '10'], 'named fields');
eq(R({ value: '10101010', fields: 'X:9:8' }).ok, false, 'field outside register'); eq(R({ value: '10101010', fields: 'X:2:5' }).ok, false, 'field written low to high'); eq(R({ value: '10101010', fields: 'A:7:4, B:5:2' }).warnings.length, 1, 'overlap warned'); eq(R({ value: '10101010', action: 'set' }).ok, false, 'action needs a mask');
const P = (o) => D.run(Object.assign({ op: 'parity', base: 'bin', width: '8', pmode: 'generate', parity: 'even', ppos: 'msb' }, o));
eq(P({ value: '1011001' }).word.bin, '001011001', 'even parity, MSB'); eq(P({ value: '01011001', parity: 'odd' }).bit, 1, 'odd parity bit'); eq(P({ value: '01011001', ppos: 'lsb' }).word.bin, '010110010', 'parity at LSB');
eq(P({ pmode: 'check', value: '001011001' }).pass, true, 'check passes'); eq(P({ pmode: 'check', value: '001011000' }).pass, false, 'check fails'); eq(P({ pmode: 'check', value: '001011000' }).warnings.length, 1, 'failure warned'); eq(P({ value: '111111111' }).ok, false, 'data wider than width');
const G = (o) => D.run(Object.assign({ op: 'group', base: 'hex', width: 'auto' }, o));
eq(G({ value: 'DEADBEEF' }).little, ['EF', 'BE', 'AD', 'DE'], 'little-endian bytes'); eq(G({ value: 'DEADBEEF' }).width, 32, 'auto width 32'); eq(G({ value: 'A', width: '16' }).bytes.map((b) => b.hex), ['00', '0A'], 'padded to 16 bits'); eq(G({ value: '1FF', width: '8' }).ok, false, 'too wide');
/* exports */
const w = B('A AND (B OR NOT C)'); eq(D.exportCsv(w).split('\n')[0], 'A,B,C,F,NOT C,B OR NOT C', 'csv header with intermediate column'); eq(JSON.parse(D.exportJson(w)).minimalSop, 'AB + AC\'', 'json minimal SOP'); eq(/Boolean expression/.test(D.exportTxt(w)), true, 'txt title');
eq(JSON.parse(D.exportJson(R({ value: '10101010', mask: '0', action: 'set' }))).result.hex, 'AB', 'register json'); eq(D.run({ op: 'nope' }).ok, false, 'unknown tool');
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
