/* Tests for tools/fraction_engine.js against tests/fraction_vectors.json (independent: gen_fraction_vectors.py, Python fractions.Fraction) and fixed cases. */
const Fx = require('../tools/fraction_engine.js'), V = require('./fraction_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 15) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': ' + a + ' vs ' + b); };
for (const [expr, num, den, mixed, dec, pct] of V.ok) {
  const r = Fx.calc({ expr }), t = '[' + expr + ']';
  if (!r.ok) { bad(t + ' rejected: ' + r.error); continue; }
  eq(r.value.n, num, 'numerator ' + t); eq(r.value.d, den, 'denominator ' + t); eq(r.mixed.text, mixed, 'mixed ' + t);
  if (dec !== null) eq(r.decimal.text, dec, 'decimal ' + t);
  if (pct !== null) eq(r.percent.text, pct + '%', 'percent ' + t);
  eq(r.value.d > 0n && Fx.gcd(r.value.n, r.value.d) === 1n, true, 'reduced and positive denominator ' + t);
}
for (const [expr, num, den, mixed] of V.big) {
  const r = Fx.calc({ expr }), t = '[' + expr.slice(0, 40) + '...]';
  if (!r.ok) { bad(t + ' rejected: ' + r.error); continue; }
  eq(r.value.n, num, 'big numerator ' + t); eq(r.value.d, den, 'big denominator ' + t); eq(r.mixed.text, mixed, 'big mixed ' + t);
}
for (const expr of V.err) { const r = Fx.calc({ expr }); eq(r.ok, false, 'must be rejected [' + expr + ']'); eq(r.empty === true, expr === '', 'empty flag [' + expr + ']'); if (expr !== '') eq(typeof r.error === 'string' && r.error.length > 5, true, 'message [' + expr + ']'); }
// fixed cases from the product note
const f = (e) => Fx.calc({ expr: e });
eq(f('1/2 + 3/4').frac, '5/4', '1/2+3/4'); eq(f('3/4 - 1/6').frac, '7/12', '3/4-1/6'); eq(f('3/5 x 10/9').frac, '2/3', 'x as times'); eq(f('7/8 : 1/4').frac, '7/2', 'colon divides');
eq(f('1/3').decimal.repeating, true, '1/3 repeats'); eq(f('1/3').decimal.exact, false, '1/3 not exact'); eq(f('1/8').decimal.exact, true, '1/8 exact'); eq(f('1/3').decimal.period, 1, 'period of 1/3'); eq(f('1/7').decimal.period, 6, 'period of 1/7');
eq(f('2 1/3 - 5/6').steps.length, 2, 'steps for the mixed example'); eq(/least common denominator of 3 and 6 is 6/.test(f('2 1/3 - 5/6').steps[1]), true, 'LCD step text');
eq(f('7/8 \u00f7 1/4').steps.some((s) => /reciprocal/.test(s)), true, 'reciprocal step'); eq(f('3/5 * 10/9').steps.some((s) => /cancel/.test(s)), true, 'cross-cancel step');
eq(f('1/2 - 1/2').frac, '0', 'zero'); eq(f('1/2 - 1/2').sign, 0, 'sign zero'); eq(f('-1/2').sign, -1, 'sign negative'); eq(f('4/2').isInteger, true, 'integer');
eq(f('9999999999999999999999/3').frac, '3333333333333333333333', 'big integer division'); eq(f('1/2 + 1/3').decimal.text, '0.8(3)', '5/6 decimal');
eq(f('0.1 + 0.2').frac, '3/10', '0.1 + 0.2 is exactly 3/10 (no floating-point error)'); eq(f('1' + '0'.repeat(500)).ok, false, 'literal over 400 digits rejected'); eq(f('1/2 + '.repeat(300) + '1').ok, false, 'over 200 parts rejected');
eq(f('1/2'.repeat(1000)).ok, false, 'over 2000 characters rejected'); eq(f(null).empty, true, 'null input is empty'); eq(f('   ').empty, true, 'blank input is empty');
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
