/* Tests for tools/percent_diff_engine.js (Percentage Calculator, Mode 03, Percentage Difference & Change) against tests/percent_diff_vectors.json (independent:
   gen_percent_diff_vectors.py, Python fractions.Fraction and decimal.Decimal), the fixed cases below, cross-checks against the Mode 02 engine (a different code
   route for the same percentage change), and exact properties: symmetry, the 200% ceiling, swapping the roles of A and B, and points against relative change. */
const C = require('../tools/percent_diff_engine.js'), V = require('./percent_diff_vectors.json'), M2 = require('../tools/percent_change_engine.js');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 15) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': ' + a + ' vs ' + b); };
const U = { diff: '%', chg: '%', cmp: '%', pp: ' pp' };
const AMT = { diff: /^Difference \|A/, chg: /^Change \(new/, cmp: /^Difference \(A/, pp: /^Relative change in the percentage/ };
const common = (r, t) => {
  eq(r.ok, true, 'accepted ' + t); if (!r.ok) return false;
  eq(Array.isArray(r.steps) && r.steps.length >= 3 && r.steps.every((s) => typeof s === 'string' && s.length > 8), true, 'working present ' + t);
  eq(Array.isArray(r.rows) && r.rows.length >= 4 && r.rows.every((x) => x.length === 3), true, 'result rows ' + t);
  eq(typeof r.formula === 'string' && r.formula.length > 5 && typeof r.subst === 'string' && typeof r.sentence === 'string' && r.sentence.length > 3, true, 'formula, substitution and sentence ' + t);
  eq(/undefined|NaN|\[object|@/.test(JSON.stringify([r.steps, r.rows, r.formula, r.subst, r.sentence, r.big])), false, 'no undefined, NaN or placeholder text ' + t);
  return true;
};
const chk = (row, tag) => {
  const [kind, x, y, places, num, den, text, exact, dir, amt] = row, t = '[' + tag + ' ' + kind + ' ' + String(x).slice(0, 12) + ' ' + String(y).slice(0, 12) + ' @' + places + ']';
  const r = C.calc({ kind, x, y, places }); if (!common(r, t)) return;
  eq(r.num, num, 'numerator ' + t); eq(r.den, den, 'denominator ' + t); eq(r.text, text, 'text ' + t); eq(r.exact, exact, 'exactness ' + t);
  eq(r.unit, U[kind], 'unit ' + t); eq(r.big, (exact ? '' : '\u2248 ') + text + U[kind], 'big ' + t); eq(BigInt(r.den) > 0n, true, 'positive denominator ' + t);
  if (kind !== 'diff') { eq(r.dir, dir, 'direction ' + t); eq(r.rows.some((z) => z[0] === 'Direction' && z[1].toLowerCase() === dir), true, 'direction row ' + t); }
  if (amt !== null && amt !== undefined) { const row = r.rows.find((z) => AMT[kind].test(z[0])); eq(row && row[1], amt, 'second value row ' + t); }
};
V.calc.forEach((row) => chk(row, 'calc')); V.big.forEach((row) => chk(row, 'big'));
for (const [kind, a, b] of V.err) {
  const t = '[' + kind + ' ' + [a, b].map((s) => String(s).slice(0, 10)).join(' | ') + ']', r = C.calc({ kind, x: a, y: b });
  eq(r.ok, false, 'must be refused ' + t); eq(typeof r.error === 'string', true, 'error is text ' + t); if (!r.empty) eq(r.error.length > 10, true, 'message present ' + t);
}
for (const [kind, a, b] of V.empty) { const r = C.calc({ kind, x: a, y: b }); eq(r.empty === true && r.ok === false && typeof r.hint === 'string' && r.hint.length > 5, true, 'empty input is flagged empty with a hint [' + kind + ' ' + a + ' ' + b + ']'); }
// fixed cases
const K = (k, x, y, p) => C.calc({ kind: k, x: String(x), y: String(y), places: p === undefined ? 'auto' : p });
const row = (r, re) => r.rows.find((z) => re.test(z[0]));
eq(K('diff', 80, 100).big, '\u2248 22.222222%', '80 and 100'); eq(K('diff', 80, 100, 2).text, '22.22', 'two places'); eq(K('diff', 100, 80).frac, K('diff', 80, 100).frac, 'symmetric');
eq(K('diff', 50, 150).big, '100%', '50 and 150'); eq(K('diff', 230, 225).big, '\u2248 2.197802%', '230 V and 225 V'); eq(K('diff', 100, 120).big, '\u2248 18.181818%', '100 and 120');
eq(K('diff', 7, 7).big, '0%', 'equal values'); eq(K('diff', 0, 5).big, '200%', 'one value is 0'); eq(K('diff', 0, 5).warnings.length, 1, 'one zero explained'); eq(K('diff', -5, 5).big, '200%', 'opposite signs'); eq(K('diff', -5, 5).warnings.length, 1, 'opposite signs explained');
eq(K('diff', 0, 0).ok, false, 'both zero'); eq(/both values are 0/i.test(K('diff', 0, 0).error), true, 'both zero message');
eq(K('diff', 80, 100).sentence, 'The percentage difference between 80 and 100 is \u2248 22.222222%', 'diff sentence'); eq(row(K('diff', 80, 100), /^Percentage change from A/)[1], '25%', 'diff table: change A to B'); eq(row(K('diff', 80, 100), /^Percentage change from B/)[1], '-20%', 'diff table: change B to A');
eq(K('chg', 80, 100).big, '25%', '80 to 100'); eq(K('chg', 100, 80).big, '-20%', '100 to 80'); eq(K('chg', 80, 100).sentence, 'From 80 to 100 is an increase of 25%', 'chg sentence'); eq(K('chg', 5, 5).sentence, 'From 5 to 5 there is no change (0%)', 'chg no change');
eq(K('chg', 0, 5).ok, false, 'zero old value'); eq(/old value is 0/.test(K('chg', 0, 5).error), true, 'zero old value message'); eq(row(K('chg', 80, 100), /^Percentage difference/)[1], '\u2248 22.222222%', 'chg table shows the symmetric difference too');
eq(K('cmp', 80, 64).big, '25%', '80 against 64'); eq(K('cmp', 80, 64).sentence, '80 is 25% higher than 64', 'cmp sentence higher'); eq(K('cmp', 64, 80).sentence, '64 is 20% lower than 80', 'cmp sentence lower'); eq(K('cmp', 7, 7).sentence, '7 is equal to 7 (0% difference)', 'cmp equal');
eq(K('cmp', 5, 0).ok, false, 'zero reference'); eq(/reference value B is 0/.test(K('cmp', 5, 0).error), true, 'zero reference message'); eq(row(K('cmp', 80, 64), /^A as a percentage of B/)[1], '125%', '80 is 125% of 64'); eq(row(K('cmp', 80, 64), /^B compared with A/)[1], '-20%', '64 is 20% below 80');
eq(K('cmp', 5, -5).warnings.length, 2, 'negative reference and opposite signs are explained'); eq(K('chg', -50, -25).big, '50%', 'a rise from -50 to -25');
eq(K('pp', 12, 15).big, '3 pp', '12% to 15% is 3 points'); eq(K('pp', 12, 15).rel, '25%', 'and a 25% relative rise'); eq(K('pp', 12, 15).sentence, 'From 12% to 15% is an increase of 3 percentage points (a relative increase of 25%)', 'pp sentence');
eq(K('pp', '12%', '15%').big, '3 pp', 'percent signs accepted'); eq(K('pp', 92, 95).rel, '\u2248 3.260870%', 'efficiency 92% to 95%'); eq(K('pp', 15, 12).big, '-3 pp', 'a fall'); eq(K('pp', 15, 12).rel, '-20%', 'relative fall');
eq(K('pp', 0, 5).rel, 'not defined', 'zero first percentage'); eq(K('pp', 0, 5).ok, true, 'zero first percentage is accepted'); eq(K('pp', 0, 5).sentence, 'From 0% to 5% is an increase of 5 percentage points', 'pp from zero');
eq(K('pp', 50, 50).sentence, 'From 50% to 50% there is no change (0 percentage points)', 'pp no change'); eq(K('pp', 98, 102).warnings.length, 1, 'above 100 explained'); eq(K('pp', 1, 1, 13).ok, false, 'too many places refused'); eq(K('diff', 1, 1, -1).ok, false, 'negative places refused'); eq(K('diff', 1, 1, 1.5).ok, false, 'fractional places refused');
eq(C.calc(null).ok, false, 'null input'); eq(C.calc({ kind: 'inc', x: '1', y: '1' }).ok, false, 'a Mode 02 kind is not a Mode 03 kind');
eq(K('diff', '1'.repeat(400), 2).ok, true, '400-digit value'); eq(K('diff', '1'.repeat(401), 2).ok, false, '401 digits refused');
// properties on exact arithmetic, and agreement with the Mode 02 engine (separate code, same percentage change)
let s = 424242; const rnd = (m) => { s = (s * 1103515245 + 12345) % 2147483648; return s % m; };
const sgn = () => (rnd(5) === 0 ? '-' : '');
for (let i = 0; i < 1500; i++) {
  const a = sgn() + rnd(100000) + '.' + rnd(100), b = sgn() + (1 + rnd(100000)) + '.' + rnd(100), t = '[' + a + ' ' + b + ']';
  const d1 = C.calc({ kind: 'diff', x: a, y: b }), d2 = C.calc({ kind: 'diff', x: b, y: a });
  if (d1.ok) {
    eq(d2.ok && d1.frac === d2.frac, true, 'difference is symmetric ' + t); eq(BigInt(d1.num) * 1n <= 200n * BigInt(d1.den), true, 'never above 200% ' + t); eq(BigInt(d1.num) >= 0n, true, 'never negative ' + t);
  }
  const ch = C.calc({ kind: 'chg', x: a, y: b }), cm = C.calc({ kind: 'cmp', x: b, y: a }), m2 = M2.calc({ kind: 'chg', x: a, y: b });
  eq(ch.ok === m2.ok, true, 'acceptance agrees with Mode 02 ' + t); if (ch.ok) { eq(ch.frac, m2.frac, 'change agrees with Mode 02 ' + t); eq(cm.frac, ch.frac, 'B against A equals the change from A to B ' + t); eq(ch.text, m2.text, 'text agrees with Mode 02 ' + t); }
  const p = (rnd(1000) / 10).toFixed(1), q = (1 + rnd(1000) / 10).toFixed(1), pr = C.calc({ kind: 'pp', x: p, y: q }), c2 = M2.calc({ kind: 'chg', x: p, y: q });
  if (Number(p) !== 0) eq(pr.rel, (c2.exact ? '' : '\u2248 ') + c2.text + '%', 'relative change of two percentages agrees with Mode 02 [' + p + ' ' + q + ']'); else eq(pr.rel, 'not defined', 'zero first percentage [' + p + ']');
  { const u = C.calc({ kind: 'pp', x: p, y: q }), w = C.calc({ kind: 'pp', x: q, y: p }); eq(u.ok && w.ok && BigInt(u.num) * BigInt(w.den) === -BigInt(w.num) * BigInt(u.den), true, 'points from P1 to P2 are minus the points from P2 to P1 [' + p + ' ' + q + ']'); }
}
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
