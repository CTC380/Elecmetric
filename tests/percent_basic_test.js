/* Tests for tools/percent_engine.js (Percentage Calculator, Mode 01) against tests/percent_basic_vectors.json (independent: gen_percent_basic_vectors.py,
   Python fractions.Fraction and decimal.Decimal) and the fixed cases from the Percentage Calculator CEO decision note. */
const P = require('../tools/percent_engine.js'), V = require('./percent_basic_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 15) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': ' + a + ' vs ' + b); };
const common = (r, t) => {
  eq(r.ok, true, 'accepted ' + t); if (!r.ok) return false;
  eq(Array.isArray(r.steps) && r.steps.length >= 1 && r.steps.every((s) => typeof s === 'string' && s.length > 8), true, 'working present ' + t);
  eq(Array.isArray(r.rows) && r.rows.length >= 3 && r.rows.every((x) => x.length === 3), true, 'result rows ' + t);
  eq(typeof r.formula === 'string' && r.formula.length > 5 && typeof r.subst === 'string' && typeof r.sentence === 'string' && r.sentence.length > 3, true, 'formula, substitution and sentence ' + t);
  eq(/undefined|NaN|\[object/.test(JSON.stringify([r.steps, r.rows, r.formula, r.subst, r.sentence, r.big])), false, 'no undefined or NaN text ' + t);
  return true;
};
const chkCalc = (row, tag) => {
  const [kind, x, y, places, num, den, text, exact] = row, t = '[' + tag + ' ' + kind + ' ' + String(x).slice(0, 12) + ' ' + String(y).slice(0, 12) + ' @' + places + ']';
  const r = P.calc({ kind, x, y, places }); if (!common(r, t)) return;
  eq(r.num, num, 'numerator ' + t); eq(r.den, den, 'denominator ' + t); eq(r.text, text, 'text ' + t); eq(r.exact, exact, 'exactness ' + t);
  eq(r.unit, kind === 'what' ? '%' : '', 'unit ' + t); eq(r.big, (exact ? '' : '\u2248 ') + text + (kind === 'what' ? '%' : ''), 'big ' + t);
  eq(BigInt(r.den) > 0n, true, 'positive denominator ' + t);
};
V.calc.forEach((row) => chkCalc(row, 'calc')); V.big.forEach((row) => chkCalc(row, 'big'));
for (const [dir, v, places, num, den, text, exact] of V.conv) {
  const t = '[conv ' + dir + ' ' + v + ' @' + places + ']', r = P.convert({ dir, v, places }); if (!common(r, t)) continue;
  eq(r.num, num, 'numerator ' + t); eq(r.den, den, 'denominator ' + t);
  if (dir === 'p2f') { eq(r.text, den === '1' ? num : num + '/' + den, 'fraction text ' + t); eq(r.exact, true, 'fraction is exact ' + t); }
  else { eq(r.text, text, 'text ' + t); eq(r.exact, exact, 'exactness ' + t); eq(r.unit, dir === 'p2d' ? '' : '%', 'unit ' + t); }
}
for (const [fn, a, b, c] of V.err) {
  const t = '[' + fn + ' ' + [a, b, c].map((s) => String(s).slice(0, 10)).join(' | ') + ']';
  const r = fn === 'calc' ? P.calc({ kind: a, x: b, y: c }) : P.convert({ dir: a, v: b });
  eq(r.ok, false, 'must be refused ' + t); eq(typeof r.error === 'string', true, 'error is text ' + t);
  if (!r.empty) eq(r.error.length > 10, true, 'message present ' + t);
}
for (const [fn, a, b, c] of V.empty) { const r = fn === 'calc' ? P.calc({ kind: a, x: b, y: c }) : P.convert({ dir: a, v: b }); eq(r.empty === true && r.ok === false && typeof r.hint === 'string' && r.hint.length > 5, true, 'empty input is flagged empty with a hint [' + fn + ' ' + a + ' ' + b + ' ' + c + ']'); }
// fixed cases from the product note (tables of examples and of independent test cases)
const C = (k, x, y, p) => P.calc({ kind: k, x: String(x), y: String(y), places: p });
eq(C('of', 20, 150).big, '30', '20% of 150'); eq(C('what', 45, 180).big, '25%', '45 is what % of 180'); eq(C('whole', 45, 25).big, '180', '45 is 25% of what');
eq(P.convert({ dir: 'p2d', v: '25' }).big, '0.25', '25% = 0.25'); eq(P.convert({ dir: 'd2p', v: '0.75' }).big, '75%', '0.75 = 75%'); eq(P.convert({ dir: 'f2p', v: '3/4' }).big, '75%', '3/4 = 75%');
eq(C('what', 225, 230, 3).big, '\u2248 97.826%', '225 is 97.826% of 230 (rounded, so approximate)'); eq(C('whole', 920, 80).big, '1150', 'original of 920 which is 80%'); eq(C('what', 9.2, 230).big, '4%', 'voltage drop 9.2 V of 230 V');
eq(C('what', 150, 200).big, '75%', 'cable loading 150 A of 200 A'); eq(C('what', 96, 100).big, '96%', 'efficiency 96 kW of 100 kW'); eq(C('what', 4, 100).big, '4%', 'loss 4 kW of 100 kW');
eq(C('what', 1, 3).exact, false, '1 is 33.33...% of 3 is not exact'); eq(C('what', 1, 3).big, '\u2248 33.333333%', 'auto rounds to 6 places and says approximate'); eq(C('what', 1, 3, 2).text, '33.33', 'two places');
eq(C('of', 0.5, 0.5).big, '0.0025', '0.5% of 0.5'); eq(C('of', 1, 0.5, 0).text, '0', 'rounds to 0 without a minus sign'); eq(C('of', -1, 0.5, 0).text, '0', 'no negative zero'); eq(C('of', 5, 10, 0).text, '1', 'half rounds away from zero: 0.5 to 1'); eq(C('of', -5, 10, 0).text, '-1', 'and -0.5 to -1'); eq(C('of', 5, 10, 0).exact, false, 'a rounded value is flagged not exact');
eq(C('what', 45, 180).sentence, '45 is 25% of 180', 'sentence'); eq(C('of', 20, 150).sentence, '20% of 150 = 30', 'sentence of'); eq(C('whole', 45, 25).sentence, '45 is 25% of 180', 'sentence whole');
eq(C('what', 5, 0).ok, false, 'Y is 0'); eq(/Y is 0/.test(C('what', 5, 0).error), true, 'zero message'); eq(C('whole', 5, 0).ok, false, 'Y% is 0'); eq(C('what', 90, 60).warnings.length, 1, 'above 100% is explained'); eq(C('what', -3, 6).warnings.length, 1, 'opposite signs are explained');
eq(C('of', 20, 150, 'auto').places, 'auto', 'places echoed'); eq(C('of', 20, 150, 13).ok, false, 'too many places refused'); eq(C('of', 20, 150, -1).ok, false, 'negative places refused'); eq(C('of', 20, 150, 1.5).ok, false, 'fractional places refused'); eq(P.calc({ kind: 'nope', x: '1', y: '1' }).ok, false, 'unknown kind'); eq(P.calc(null).ok, false, 'null input'); eq(P.convert(null).ok, false, 'null conversion');
eq(C('of', '1'.repeat(400), '1'.repeat(400)).ok, true, 'two 400-digit numbers'); eq(C('of', '1'.repeat(401), 1).ok, false, '401 digits refused');
eq(P.convert({ dir: 'p2f', v: '12.5' }).big, '1/8', '12.5% = 1/8'); eq(P.convert({ dir: 'p2f', v: '100' }).big, '1', '100% = 1'); eq(P.convert({ dir: 'f2p', v: '7/0' }).ok, false, 'fraction with 0 denominator');
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
