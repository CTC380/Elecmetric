/* Tests for tools/percent_eng_engine.js (Percentage Calculator, Mode 05, Engineering Percentage Analysis) against tests/percent_eng_vectors.json (independent:
   gen_percent_eng_vectors.py, Python fractions.Fraction and decimal.Decimal, from the definitions in the CEO note), the fixed cases below, and exact properties on
   BigInt arithmetic: identities between the eleven definitions, agreement with the Mode 02 and Mode 04 engines (separate code), and the reference-times-result check. */
const C = require('../tools/percent_eng_engine.js'), V = require('./percent_eng_vectors.json'), M2 = require('../tools/percent_change_engine.js'), M4 = require('../tools/percent_error_engine.js');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 15) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': ' + a + ' vs ' + b); };
const HEAD = { eff: 'Efficiency', load: 'Loading', vdrop: 'Voltage drop percentage', vdev: 'Voltage deviation', lf: 'Load factor', df: 'Demand factor', div: 'Diversity factor', derate: 'Derating', save: 'Energy saving', soc: 'State of charge', ploss: 'Power loss percentage' };
const REFX = { eff: 1, vdrop: 1, vdev: 1, derate: 1, save: 1 }, U = (k) => (k === 'div' ? '' : '%');
const fr = (r) => ({ n: BigInt(r.num), d: BigInt(r.den) }), same = (p, q) => p.n * q.d === q.n * p.d;
const common = (r, t) => {
  eq(r.ok, true, 'accepted ' + t); if (!r.ok) return false;
  eq(Array.isArray(r.steps) && r.steps.length >= 3 && r.steps.every((s) => typeof s === 'string' && s.length > 8), true, 'working present ' + t);
  eq(Array.isArray(r.rows) && r.rows.length >= 5 && r.rows.every((x) => x.length === 3), true, 'result rows ' + t);
  eq(typeof r.formula === 'string' && r.formula.length > 5 && typeof r.subst === 'string' && r.subst.length > 3 && typeof r.sentence === 'string' && r.sentence.length > 3, true, 'formula, substitution and sentence ' + t);
  eq(/undefined|NaN|\[object|@/.test(JSON.stringify([r.steps, r.rows, r.formula, r.subst, r.sentence, r.big])), false, 'no undefined, NaN or placeholder text ' + t);
  return true;
};
const chk = (row, tag) => {
  const [kind, x, y, places, num, den, text, exact, dir, rows, warn] = row, t = '[' + tag + ' ' + kind + ' ' + String(x).slice(0, 12) + ' ' + String(y).slice(0, 12) + ' @' + places + ']';
  const r = C.calc({ kind, x, y, places }); if (!common(r, t)) return;
  eq(r.num, num, 'numerator ' + t); eq(r.den, den, 'denominator ' + t); eq(r.text, text, 'text ' + t); eq(r.exact, exact, 'exactness ' + t); eq(r.unit, U(kind), 'unit ' + t);
  eq(r.big, (exact ? '' : '\u2248 ') + text + U(kind), 'big ' + t); eq(BigInt(r.den) > 0n, true, 'positive denominator ' + t); eq(r.dir, dir, 'direction ' + t);
  eq(new Set(r.rows.map((q) => q[0])).size, r.rows.length, 'every row label is unique ' + t);
  const head = r.rows.find((q) => q[0] === HEAD[kind]); eq(head && head[1], r.big, 'headline row ' + t);
  const refs = r.rows.filter((q) => /\(reference\)$/.test(q[0])); eq(refs.length, 1, 'exactly one row names the reference ' + t);
  const refVal = (REFX[kind] ? String(r.x) : String(r.y)); eq(refs[0] && refs[0][1], refVal, 'the reference row holds the reference value ' + t); eq(refs[0] && refs[0][0], C.DEFS[kind][REFX[kind] ? 'lx' : 'ly'] + ' (reference)', 'reference row names the right quantity ' + t);
  eq(r.reference, C.DEFS[kind][REFX[kind] ? 'lx' : 'ly'], 'reference named in the result ' + t);
  eq(r.rows.some((q) => q[0] === 'Direction'), dir !== '', 'direction row only for signed kinds ' + t);
  for (const [label, val] of rows) { const q = r.rows.find((z) => z[0] === label); eq(q && q[1], val, label + ' ' + t); }
  eq(r.warnings.length, warn ? 1 : 0, 'warning only when the definition is breached ' + t);
};
V.calc.forEach((row) => chk(row, 'calc')); V.big.forEach((row) => chk(row, 'big'));
for (const [kind, a, b] of V.err) { const t = '[' + kind + ' ' + String(a).slice(0, 10) + ' | ' + String(b).slice(0, 10) + ']', r = C.calc({ kind, x: a, y: b }); eq(r.ok, false, 'must be refused ' + t); eq(typeof r.error === 'string', true, 'error is text ' + t); eq(String(r.error || '').length > 10 || !!r.empty, true, 'message present ' + t); }
for (const [kind, a, b] of V.empty) { const r = C.calc({ kind, x: a, y: b }); eq(r.empty === true && r.ok === false && typeof r.hint === 'string' && r.hint.length > 5, true, 'empty input is flagged empty with a hint [' + kind + ' ' + a + ' ' + b + ']'); }
// the worked examples of the CEO note
const K = (k, x, y, p) => C.calc({ kind: k, x: String(x), y: String(y), places: p === undefined ? 'auto' : p }), row = (r, l) => (r.rows.find((q) => q[0] === l) || [])[1];
eq(K('eff', 100, 96).big, '96%', 'transformer efficiency'); eq(row(K('eff', 100, 96), 'Power loss'), '4', 'transformer loss'); eq(row(K('eff', 100, 96), 'Loss as a percentage of the input'), '4%', 'loss percentage of input');
eq(K('load', 150, 200).big, '75%', 'cable loading'); eq(K('vdrop', 230, 9.2).big, '4%', 'voltage drop'); eq(K('save', 1000, 750).big, '25%', 'energy saving'); eq(K('save', 1000, 750).dir, 'saving', 'saving direction');
eq(K('vdev', 230, 225).big, '\u2248 -2.173913%', 'voltage deviation against 230 V'); eq(K('vdev', 230, 225).text, '-2.173913', 'signed deviation'); eq(K('vdev', 230, 225, 3).text, '-2.174', 'the 2.174% in the note'); eq(K('vdev', 230, 225).dir, 'below', 'below nominal');
eq(K('div', 1200, 900).frac, '4/3', 'diversity factor is a ratio'); eq(K('div', 1200, 900).unit, '', 'diversity factor has no unit'); eq(K('div', 1200, 900).formula.indexOf('100'), -1, 'diversity formula has no 100');
eq(K('derate', 200, 170).big, '15%', 'derating'); eq(K('derate', 200, 170).dir, 'reduction', 'derating direction'); eq(K('save', 1000, 1200).dir, 'increase', 'consumption increase'); eq(K('save', 1000, 1200).big, '-20%', 'increase is negative');
eq(K('eff', 0, 5).ok, false, 'zero input power'); eq(/input power is 0/.test(K('eff', 0, 5).error), true, 'zero reference message names the reference'); eq(K('load', 5, 0).ok, false, 'zero capacity'); eq(K('load', 0, 200).big, '0%', 'zero load is allowed'); eq(K('ploss', 4, 0).ok, false, 'zero reference power');
eq(K('eff', 100, 104).warnings.length, 1, 'efficiency above 100%'); eq(K('load', 250, 200).warnings.length, 1, 'overload'); eq(K('load', 250, 200).big, '125%', 'overload value'); eq(K('eff', 100, 100).warnings.length, 0, 'exactly 100% needs no warning');
eq(K('eff', 1, 1, 13).ok, false, 'too many places'); eq(K('eff', 1, 1, -1).ok, false, 'negative places'); eq(C.calc(null).ok, false, 'null input'); eq(C.calc({ kind: 'err', x: '1', y: '1' }).ok, false, 'a Mode 04 kind is not a Mode 05 kind'); eq(K('eff', '1'.repeat(400), 2).ok, true, '400 digits'); eq(K('eff', '1'.repeat(401), 2).ok, false, '401 digits refused');
eq(C.KINDS.length, 11, 'eleven calculations'); eq(C.KINDS.every((k) => HEAD[k] && C.LABELS[k].length === 3), true, 'every kind has labels');
// properties on exact arithmetic, and agreement with the Mode 02 and Mode 04 engines (separate code for the same percentages)
let s = 551003; const rnd = (m) => { s = (s * 1103515245 + 12345) % 2147483648; return s % m; };
let ran = 0;
for (let i = 0; i < 1500; i++) {
  const a = (1 + rnd(100000)) + '.' + rnd(100), b = rnd(100000) + '.' + rnd(100), t = '[' + a + ' ' + b + ']';
  const vd = C.calc({ kind: 'vdev', x: a, y: b }), sv = C.calc({ kind: 'save', x: a, y: b }), dr = C.calc({ kind: 'derate', x: a, y: b }), ef = C.calc({ kind: 'eff', x: a, y: b });
  const m2 = M2.calc({ kind: 'chg', x: a, y: b }), m4 = M4.calc({ kind: 'err', x: a, y: b });
  eq(vd.ok && sv.ok && dr.ok && ef.ok && m2.ok && m4.ok, true, 'all engines accept ' + t); if (!(vd.ok && sv.ok && ef.ok && m2.ok && m4.ok)) continue;
  ran++;
  eq(same(fr(vd), fr(m2)), true, 'voltage deviation is the Mode 02 change from nominal to actual ' + t);
  eq(same({ n: fr(vd).n < 0n ? -fr(vd).n : fr(vd).n, d: fr(vd).d }, fr(m4)), true, 'size of the deviation is the Mode 04 percentage error ' + t);
  eq(same(fr(sv), { n: -fr(m2).n, d: fr(m2).d }), true, 'energy saving is the negative of the Mode 02 change ' + t);
  eq(same(fr(dr), fr(sv)), true, 'derating and saving share one definition ' + t);
}
eq(ran, 1500, 'every property case ran');
// complement identities: eff(x, y) + eff(x, x - y) = 100%, and soc(r, u) + soc(u - r, u) = 100%, with x - y built as an exact decimal text
let ident = 0;
for (let i = 0; i < 1000; i++) {
  const x = 100 + rnd(100000), yy = rnd(x * 100) / 100, y = String(yy), xs = String(x), other = String(Math.round((x - yy) * 100) / 100);
  if (Math.abs(Number(other) + yy - x) > 1e-9) continue;
  const e1 = C.calc({ kind: 'eff', x: xs, y }), e2 = C.calc({ kind: 'eff', x: xs, y: other }), s1 = C.calc({ kind: 'soc', x: y, y: xs }), s2 = C.calc({ kind: 'soc', x: other, y: xs });
  ident++; eq(fr(e1).n * fr(e2).d + fr(e2).n * fr(e1).d === 100n * fr(e1).d * fr(e2).d, true, 'efficiency and the complement add to 100% [' + xs + ' ' + y + ']'); eq(fr(s1).n * fr(s2).d + fr(s2).n * fr(s1).d === 100n * fr(s1).d * fr(s2).d, true, 'state of charge and depletion add to 100% [' + xs + ' ' + y + ']');
  eq(same(fr(e1), fr(s1)), true, 'efficiency and state of charge are the same ratio when the roles match [' + xs + ' ' + y + ']');
}
eq(ident > 900, true, 'the complement checks really ran (' + ident + ')');
// reference times result gives back the numerator, exactly, for every share kind
for (let i = 0; i < 600; i++) {
  const a = (1 + rnd(100000)) + '.' + rnd(100), b = rnd(100000) + '.' + rnd(100);
  for (const k of ['load', 'lf', 'df', 'soc', 'ploss']) { const r = C.calc({ kind: k, x: b, y: a }), A = a.split('.'), B = b.split('.'); const An = BigInt(A[0] + A[1].padEnd(2, '0').slice(0, 2)), Bn = BigInt(B[0] + B[1].padEnd(2, '0').slice(0, 2)); eq(fr(r).n * An === Bn * 100n * fr(r).d, true, k + ' result x reference gives back the numerator [' + a + ' ' + b + ']'); }
}
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
