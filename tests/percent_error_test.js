/* Tests for tools/percent_error_engine.js (Percentage Calculator, Mode 04, Percentage Error) against tests/percent_error_vectors.json (independent:
   gen_percent_error_vectors.py, Python fractions.Fraction and decimal.Decimal), the fixed cases below, and exact properties on BigInt arithmetic:
   the three questions invert each other, the sign of the deviation, the tolerance band, and agreement with the Mode 02 and Mode 03 engines (separate code). */
const C = require('../tools/percent_error_engine.js'), V = require('./percent_error_vectors.json'), M2 = require('../tools/percent_change_engine.js'), M3 = require('../tools/percent_diff_engine.js');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 15) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': ' + a + ' vs ' + b); };
const U = { err: '%', val: '', ref: '' };
const ROW = { amt: /^Error \(measured/, rel: /^Relative error/, sdev: /^Signed deviation/, acc: /^Accuracy/, ofref: /^Measured as a percentage/, diffsym: /^Percentage difference/, vsM: /^Error as a share/, band: /^Permitted range/, within: /^Within tolerance/, margin: /^Margin to the limit/ };
const common = (r, t) => {
  eq(r.ok, true, 'accepted ' + t); if (!r.ok) return false;
  eq(Array.isArray(r.steps) && r.steps.length >= 3 && r.steps.every((s) => typeof s === 'string' && s.length > 8), true, 'working present ' + t);
  eq(Array.isArray(r.rows) && r.rows.length >= 4 && r.rows.every((x) => x.length === 3), true, 'result rows ' + t);
  eq(typeof r.formula === 'string' && r.formula.length > 5 && typeof r.subst === 'string' && typeof r.sentence === 'string' && r.sentence.length > 3, true, 'formula, substitution and sentence ' + t);
  eq(/undefined|NaN|\[object|@/.test(JSON.stringify([r.steps, r.rows, r.formula, r.subst, r.sentence, r.big])), false, 'no undefined, NaN or placeholder text ' + t);
  return true;
};
const chk = (row, tag) => {
  const [kind, x, y, z, places, num, den, text, exact, dir, ex] = row, t = '[' + tag + ' ' + kind + ' ' + String(x).slice(0, 12) + ' ' + String(y).slice(0, 12) + ' ' + z + ' @' + places + ']';
  const r = C.calc({ kind, x, y, z, places }); if (!common(r, t)) return;
  eq(r.num, num, 'numerator ' + t); eq(r.den, den, 'denominator ' + t); eq(r.text, text, 'text ' + t); eq(r.exact, exact, 'exactness ' + t);
  eq(r.unit, U[kind], 'unit ' + t); eq(r.big, (exact ? '' : '\u2248 ') + text + U[kind], 'big ' + t); eq(BigInt(r.den) > 0n, true, 'positive denominator ' + t);
  eq(r.dir, dir, 'direction ' + t); eq(r.rows.some((q) => q[0] === 'Direction' && q[1].toLowerCase() === dir), true, 'direction row ' + t);
  for (const k of Object.keys(ex)) { const row = r.rows.find((q) => ROW[k].test(q[0])); eq(row && row[1], ex[k], k + ' row ' + t); }
  if (kind === 'err') { const has = String(z).trim() !== ''; eq(r.rows.some((q) => /^Within tolerance/.test(q[0])), has, 'tolerance rows only with a tolerance ' + t); eq(typeof r.within, has ? 'boolean' : 'object', 'within flag type ' + t); if (!has) eq(r.within, null, 'no tolerance, no verdict ' + t); if (ex.within !== undefined) eq(r.within, ex.within === 'Yes', 'within flag ' + t); }
};
V.calc.forEach((row) => chk(row, 'calc')); V.big.forEach((row) => chk(row, 'big'));
for (const [kind, a, b, z] of V.err) {
  const t = '[' + kind + ' ' + [a, b, z].map((s) => String(s).slice(0, 10)).join(' | ') + ']', r = C.calc({ kind, x: a, y: b, z });
  eq(r.ok, false, 'must be refused ' + t); eq(typeof r.error === 'string', true, 'error is text ' + t); if (!r.empty) eq(String(r.error || '').length > 10, true, 'message present ' + t);
}
for (const [kind, a, b, z] of V.empty) { const r = C.calc({ kind, x: a, y: b, z }); eq(r.empty === true && r.ok === false && typeof r.hint === 'string' && r.hint.length > 5, true, 'empty input is flagged empty with a hint [' + kind + ' ' + a + ' ' + b + ']'); }
// fixed cases
const K = (k, x, y, z, p) => C.calc({ kind: k, x: String(x), y: String(y), z: z === undefined ? '' : String(z), places: p === undefined ? 'auto' : p });
const row = (r, re) => r.rows.find((q) => re.test(q[0]));
eq(K('err', 230, 225).big, '\u2248 2.173913%', '230 V reference, 225 V measured'); eq(K('err', 230, 225, '', 3).text, '2.174', 'the 2.174% in the note'); eq(K('err', 230, 225).dir, 'below', 'below the reference'); eq(K('err', 225, 230).dir, 'above', 'above the reference');
eq(K('err', 230, 225).sentence, 'A measured value of 225 against a reference of 230 is \u2248 2.173913% below the reference', 'err sentence'); eq(row(K('err', 230, 225), /^Error \(measured/)[1], '-5', 'error is measured minus reference');
eq(K('err', 100, 98.5).big, '1.5%', '98.5 against 100'); eq(row(K('err', 100, 98.5), /^Signed deviation/)[1], '-1.5%', 'signed deviation'); eq(K('err', 100, 100).big, '0%', 'no error'); eq(K('err', 100, 100).sentence, 'A measured value of 100 equals the reference 100 (0% error)', 'no error sentence');
eq(K('err', 100, 105, 5).tolFlag, 'within tolerance', 'on the limit is within'); eq(K('err', 100, 105, 4).tolFlag, 'outside tolerance', 'outside the limit'); eq(K('err', 100, 105).tolFlag, '', 'no tolerance, no flag');
eq(row(K('err', 100, 105, 5), /^Margin/)[1], '0 percentage points spare', 'margin zero'); eq(row(K('err', 100, 105, 5), /^Margin/)[2], 'Exactly on the limit', 'margin note'); eq(row(K('err', 100, 105, 4), /^Margin/)[1], '1 percentage points over', 'margin over');
eq(row(K('err', 100, 105, 5), /^Permitted range/)[1], '95 to 105', 'range'); eq(K('err', 100, 105, '5%').within, true, 'percent sign accepted in the tolerance'); eq(K('err', 100, 105, 0).within, false, 'zero tolerance');
eq(K('err', 100, 100, 0).within, true, 'zero tolerance, zero error'); eq(K('err', 100, 105, -1).ok, false, 'negative tolerance refused'); eq(/cannot be negative/.test(K('err', 100, 105, -1).error), true, 'negative tolerance message');
eq(K('err', 0, 5).ok, false, 'zero reference'); eq(/reference value is 0/.test(K('err', 0, 5).error), true, 'zero reference message'); eq(K('err', 50, 0).big, '100%', 'a zero reading is a 100% error'); eq(K('err', 50, 0).warnings.length, 1, 'zero reading explained');
eq(row(K('err', 50, 0), /^Error as a share/)[1], 'not defined', 'share of a zero reading'); eq(K('err', 5, -5).warnings.length, 1, 'opposite signs explained'); eq(K('err', 5, 500).warnings.length, 1, 'error above 100% explained'); eq(row(K('err', 5, 500), /^Accuracy/)[1], 'not meaningful', 'accuracy above 100%');
eq(K('err', -50, -45).big, '10%', 'negative reference'); eq(K('err', -50, -45).dir, 'above', 'a reading above a negative reference'); eq(K('err', -50, -45).warnings.length, 1, 'negative reference explained');
eq(row(K('err', 230, 225), /^Percentage difference/)[1], '\u2248 2.197802%', 'neighbour: percentage difference'); eq(row(K('err', 230, 225), /^Error as a share/)[1], '\u2248 2.222222%', 'neighbour: error against the reading');
eq(K('val', 230, -2.5).big, '224.25', '2.5% below 230'); eq(K('val', 230, 2.5).big, '235.75', '2.5% above 230'); eq(K('val', 230, '-2.5%').big, '224.25', 'percent sign accepted'); eq(K('val', 230, 0).sentence, 'A reading with no error equals the reference 230', 'val no error');
eq(K('val', 230, -2.5).sentence, 'A reading 2.5% below a reference of 230 is 224.25', 'val sentence'); eq(K('val', 230, -100).big, '0', 'a 100% low reading is 0'); eq(K('val', 230, -100).warnings.length, 1, 'zero explained'); eq(K('val', 230, -150).warnings.length, 1, 'other side of zero explained');
eq(K('val', -230, 2.5).big, '-224.25', 'a rise from a negative reference moves towards zero'); eq(K('val', 0, 5).ok, false, 'val zero reference');
eq(K('ref', 235.75, 2.5).big, '230', 'reference from 235.75 at +2.5%'); eq(K('ref', 224.25, -2.5).big, '230', 'reference from 224.25 at -2.5%'); eq(K('ref', 225, -2).big, '\u2248 229.591837', 'reference from 225 at -2%'); eq(K('ref', -235.75, -2.5).big, '-230', 'negative measured value');
eq(K('ref', 100, 0).big, '100', 'no error'); eq(K('ref', 100, -100).ok, false, 'bracket of zero refused'); eq(K('ref', 100, -150).ok, false, 'bracket below zero refused'); eq(K('ref', -100, 100).ok, false, 'bracket of zero refused, negative reading'); eq(K('ref', 0, 5).ok, false, 'zero measured value');
eq(K('ref', 1, 300).big, '0.25', 'reference from 1 at +300%'); eq(K('ref', 235.75, 2.5).warnings.length, 0, 'no warning for an ordinary reverse'); eq(K('ref', -235.75, -2.5).warnings.length, 1, 'negative measured value explained');
eq(K('err', 1, 1, undefined, 13).ok, false, 'too many places refused'); eq(K('err', 1, 1, '', -1).ok, false, 'negative places refused'); eq(K('err', 1, 1, '', 1.5).ok, false, 'fractional places refused');
eq(C.calc(null).ok, false, 'null input'); eq(C.calc({ kind: 'diff', x: '1', y: '1' }).ok, false, 'a Mode 03 kind is not a Mode 04 kind'); eq(C.calc({ kind: 'err', x: '5', y: '5', z: '1e2' }).ok, false, 'exponent notation refused in the tolerance');
eq(K('err', '1'.repeat(400), 2).ok, true, '400-digit value'); eq(K('err', '1'.repeat(401), 2).ok, false, '401 digits refused');
// properties on exact arithmetic, and agreement with the Mode 02 and Mode 03 engines (separate code for the same percentage)
let s = 777001; const rnd = (m) => { s = (s * 1103515245 + 12345) % 2147483648; return s % m; };
const sgn = () => (rnd(5) === 0 ? '-' : '');
const rat = (str) => { const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(str), f = m[3] || '', k = 10n ** BigInt(f.length); return { n: (m[1] ? -1n : 1n) * BigInt(m[2] + f), d: k }; }; // exact value of a decimal text
const same = (p, q) => p.n * q.d === q.n * p.d; // equal rationals
const fr = (r) => ({ n: BigInt(r.num), d: BigInt(r.den) });
const NICE = ['1', '2', '4', '5', '8', '10', '16', '20', '25', '32', '40', '50', '64', '80', '100', '125', '128', '200', '250', '256', '400', '500', '625', '800', '1000', '1250', '2000', '2500', '4000', '5000', '8000', '10000', '0.5', '0.25', '0.125', '2.5', '12.5', '6.25']; // references whose percentage error ends as a decimal
let exactCount = 0, revCount = 0, tolCount = 0;
for (let i = 0; i < 1500; i++) {
  const a = (i % 2 ? sgn() + NICE[rnd(NICE.length)] : sgn() + (1 + rnd(100000)) + '.' + rnd(100)), b = sgn() + rnd(100000) + '.' + rnd(100), t = '[' + a + ' ' + b + ']';
  const e = C.calc({ kind: 'err', x: a, y: b }), m2 = M2.calc({ kind: 'chg', x: a, y: b }), m3 = M3.calc({ kind: 'cmp', x: b, y: a });
  eq(e.ok && m2.ok && m3.ok, true, 'all three engines accept ' + t); if (!(e.ok && m2.ok && m3.ok)) continue;
  const q = fr(e), c2 = fr(m2), c3 = fr(m3), ab = (x) => ({ n: x.n < 0n ? -x.n : x.n, d: x.d });
  eq(q.n >= 0n, true, 'percentage error is never negative ' + t);
  eq(same(q, ab(c2)), true, 'percentage error is the size of the Mode 02 change from the reference to the reading ' + t);
  eq(same(c3, c2), true, 'Mode 03 comparison of the reading against the reference is the same signed number ' + t);
  eq(e.dir, c2.n < 0n ? 'below' : c2.n > 0n ? 'above' : 'equal', 'direction follows the sign ' + t);
  const sd = row(e, /^Signed deviation/)[1]; eq(sd, (m2.exact ? '' : '\u2248 ') + m2.text + '%', 'signed deviation text equals the Mode 02 text ' + t);
  // the three questions undo each other, exactly: when the percentage error ends as a decimal, entering it back must return the other value
  if (m2.exact) {
    exactCount++;
    const v = C.calc({ kind: 'val', x: a, y: m2.text }); eq(v.ok && same(fr(v), rat(b)), true, 'reference and signed percentage error give back the reading ' + t);
    const sameSign = (a[0] === '-') === (b[0] === '-') && Number(b) !== 0;
    if (sameSign) { revCount++; const rv = C.calc({ kind: 'ref', x: b, y: m2.text }); eq(rv.ok && same(fr(rv), rat(a)), true, 'reading and signed percentage error give back the reference ' + t); }
  }
  // tolerance: within exactly when |b - a| x 100 <= tolerance x |a|, computed here from the decimal texts
  const tl = String(rnd(300) / 10), tr = rat(tl), A = rat(a), B = rat(b), d = ((B.n * A.d - A.n * B.d) < 0n ? -1n : 1n) * (B.n * A.d - A.n * B.d), den = B.d * A.d; // |b - a| = d / den
  const lhs = d * 100n * tr.d * A.d, rhs = tr.n * (A.n < 0n ? -A.n : A.n) * den; // |b-a|*100 / |a| <= t  <=>  d*100*A.d*tr.d <= tr.n*|A.n|*den
  const w = C.calc({ kind: 'err', x: a, y: b, z: tl }); tolCount++; eq(w.within, lhs <= rhs, 'tolerance verdict agrees with exact arithmetic [' + a + ' ' + b + ' ' + tl + ']');
  eq(row(w, /^Within tolerance/)[1], lhs <= rhs ? 'Yes' : 'No', 'tolerance row [' + a + ' ' + b + ' ' + tl + ']');
}
eq(exactCount > 500 && revCount > 250 && tolCount === 1500, true, 'the inversion checks really ran (' + exactCount + ' forward, ' + revCount + ' reverse)');
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
