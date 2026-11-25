/* Tests for mixedCalc in tools/fraction_engine.js against tests/fraction_mixed_vectors.json (independent: gen_fraction_mixed_vectors.py, Python
   fractions.Fraction on operands built from their parts) and the cases from the product note. */
const Fx = require('../tools/fraction_engine.js'), V = require('./fraction_mixed_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 15) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': ' + a + ' vs ' + b); };
const M = (e) => Fx.mixedCalc({ expr: e });
const norm = (s) => (s == null ? null : /\/1$/.test(s) ? s.slice(0, -2) : s);
const part = (x, c, t) => { eq(x.kind, c[0], 'operand kind ' + t); eq(x.sign, c[1], 'operand sign ' + t); eq(x.w, c[2], 'operand whole ' + t); eq(x.n, c[3], 'operand numerator ' + t); eq(x.d, c[4], 'operand denominator ' + t); };
// one row: [text, op, a value, b value, numerator, denominator, mixed, decimal, percent, result kind, a parts, b parts]
const chk = (row, mode) => {
  const t = '[' + row[0].slice(0, 60) + ']', r = M(row[0]);
  if (!r.ok) { bad(t + ' rejected: ' + r.error); return; }
  eq(r.mode, mode, 'mode ' + t); eq(r.op, row[1], 'operation ' + t);
  eq(r.value.n, row[4], 'numerator ' + t); eq(r.value.d, row[5], 'denominator ' + t); eq(r.mixed.text, row[6], 'mixed ' + t); eq(r.frac, row[5] === '1' ? row[4] : row[4] + '/' + row[5], 'fraction text ' + t);
  if (row[7] !== null) eq(r.decimal.text, row[7], 'decimal ' + t); if (row[8] !== null) eq(r.percent.text, row[8] + '%', 'percent ' + t);
  eq(r.resultKind, row[9], 'result kind ' + t); eq(r.value.d > 0n && Fx.gcd(r.value.n, r.value.d) === 1n, true, 'lowest terms ' + t);
  eq(r.isInteger, r.value.d === 1n, 'integer flag ' + t); eq(r.sign, r.value.n < 0n ? -1 : r.value.n === 0n ? 0 : 1, 'sign ' + t);
  eq(r.a.value, norm(row[2]), 'first value ' + t); part(r.a, row[10], 'first ' + t);
  if (mode === 'op') { eq(r.b.value, norm(row[3]), 'second value ' + t); part(r.b, row[11], 'second ' + t); } else eq(r.b, null, 'no second number ' + t);
  eq(r.steps.length >= 1 && r.steps.every((s) => typeof s === 'string' && s.length > 5), true, 'working present ' + t);
  // the last step explains the form of the result: an exact division for an improper fraction, otherwise a statement
  const last = r.steps[r.steps.length - 1];
  if (r.resultKind === 'improper') { const a = r.value.n < 0n ? -r.value.n : r.value.n, d = r.value.d; eq(last.indexOf(a + ' \u00f7 ' + d + ' = ' + (a / d) + ' remainder ' + (a % d)) >= 0, true, 'mixed-number division step ' + t); eq(last.indexOf(a / d + ' ' + a % d + '/' + d) >= 0, true, 'mixed number in the last step ' + t); }
  else if (r.resultKind === 'proper') eq(/proper fraction/.test(last), true, 'proper fraction step ' + t); else eq(/whole number/.test(last), true, 'whole number step ' + t);
  if (mode === 'op') { eq(r.steps.some((s) => /least common denominator|denominators are the same|reciprocal|multiply the numerators|cancel common/.test(s)), true, 'operation step ' + t); }
  // a mixed operand is converted: whole x denominator + numerator
  if (r.a.kind === 'mixed') eq(r.steps.some((s) => /as an improper fraction: whole \u00d7 denominator \+ numerator = /.test(s)), true, 'conversion step ' + t);
  if (r.a.kind === 'mixed' && BigInt(r.a.n) >= BigInt(r.a.d)) eq(r.steps.some((s) => /itself improper/.test(s)), true, 'improper fraction-part note ' + t);
};
for (const row of V.op) chk(row, 'op');
for (const row of V.conv) chk(row, 'convert');
for (const [txt, op, num, den, mx] of V.big) { const r = M(txt), t = '[' + txt.slice(0, 40) + '...]'; if (!r.ok) { bad(t + ' rejected: ' + r.error); continue; } eq(r.op, op, 'big op ' + t); eq(r.value.n, num, 'big numerator ' + t); eq(r.value.d, den, 'big denominator ' + t); eq(r.mixed.text, mx, 'big mixed ' + t); }
for (const e of V.err) { const r = M(e); eq(r.ok, false, 'must be rejected [' + e.slice(0, 30) + ']'); eq(r.empty === true, e.trim() === '', 'empty flag [' + e.slice(0, 30) + ']'); if (e.trim() !== '') eq(typeof r.error === 'string' && r.error.length > 5, true, 'message [' + e.slice(0, 30) + ']'); }
// fixed cases from the product note (Mode 04): 2 1/3 - 5/6 = 3/2 = 1 1/2, mixed to improper, improper to mixed, negatives
const f = M('2 1/3 - 5/6');
eq(f.frac, '3/2', '2 1/3 - 5/6'); eq(f.mixed.text, '1 1/2', '2 1/3 - 5/6 as a mixed number'); eq(f.steps[0], '2 1/3 as an improper fraction: whole \u00d7 denominator + numerator = 2 \u00d7 3 + 1 = 7, so 7/3.', 'convert the mixed number');
eq(f.steps[1], '7/3 \u2212 5/6: the least common denominator of 3 and 6 is 6. Rewrite as 14/6 \u2212 5/6 = 9/6 = 3/2 in lowest terms.', 'common denominator: 14/6 - 5/6 = 9/6'); eq(f.steps.length, 3, 'three steps'); eq(/1 1\/2\.$/.test(f.steps[2]), true, 'ends with 1 1/2');
eq(M('2 1/3').frac, '7/3', 'mixed to improper'); eq(M('2 1/3').mode, 'convert', 'one number converts'); eq(M('17/5').mixed.text, '3 2/5', 'improper to mixed'); eq(M('-17/5').mixed.text, '-3 2/5', 'negative improper to mixed'); eq(M('-1 3/4').frac, '-7/4', 'negative mixed to improper');
eq(M('-1 3/4 + 2/3').frac, '-13/12', 'negative mixed number added'); eq(M('-1 3/4 + 2/3').mixed.text, '-1 1/12', '-13/12 as a mixed number'); eq(M('-1 3/4').a.sign, '-', 'sign reported'); eq(M('-1 3/4').a.w, '1', 'whole part reported without its sign');
eq(M('-1 3/4').frac, M('\u22121 3/4').frac, 'unicode minus'); eq(M('-1 3/4').frac, M('- 1 3/4').frac, 'space after the sign'); eq(M('2_1/3').frac, '7/3', 'underscore');
eq(M('1 1/2 \u00f7 3/4').frac, '2', 'division giving a whole number'); eq(M('1 1/2 \u00f7 3/4').resultKind, 'whole', 'whole result kind'); eq(M('1/2 + 1/3').resultKind, 'proper', 'proper result kind'); eq(M('3/4 + 3/4').resultKind, 'improper', 'improper result kind');
eq(M('2 1/2 \u00d7 3 1/2').mixed.text, '8 3/4', 'product is not 6 1/4'); eq(M('4 1/6 - 1 5/6').mixed.text, '2 1/3', 'no borrowing needed'); eq(M('2 7/3').frac, '13/3', 'improper fraction part');
eq(M('1/2 - 1/2').frac, '0', 'zero'); eq(M('1/2 - 1/2').sign, 0, 'sign of zero'); eq(M('0').mixed.text, '0', 'zero converts'); eq(M('-0 1/2').frac, '-1/2', 'negative zero whole part');
eq(M('3 1/2 + -1 3/4').frac, '7/4', 'sign after the operation'); eq(M('3 1/2 - -1 3/4').frac, '21/4', 'minus a negative'); eq(M('3 1/2 \u00d7 -1').frac, '-7/2', 'times minus one');
eq(M('9999999999999999999999/3').frac, '3333333333333333333333', 'big integer'); eq(M('1 1/3').decimal.text, '1.(3)', 'repeating decimal'); eq(M('1 1/3').decimal.exact, false, 'repeating is not exact'); eq(M('5/6').percent.text, '83.(3)%', 'repeating percent');
eq(M('3 ' + '1/2').ok, true, 'plain'); eq(M(null).empty, true, 'null input is empty'); eq(M(undefined).empty, true, 'undefined input is empty'); eq(M('   ').empty, true, 'blank input is empty'); eq(M('1' + '0'.repeat(399)).ok, true, '400 digits are accepted'); eq(M('1' + '0'.repeat(400)).ok, false, '401 digits are refused'); eq(M('1 ' + '1'.repeat(400) + '/3').ok, true, '400 digits in the numerator are accepted'); eq(M('2 1/3 \u00f7 0 1/2').frac, '14/3', '0 1/2 is one half, not zero');
eq(/Mode 03/.test(M('2.5 + 1').error), true, 'decimals point to Mode 03'); eq(/Mode 01/.test(M('1 + 2 + 3').error), true, 'long expressions point to Mode 01'); eq(/Mode 01/.test(M('(1 + 2)').error), true, 'brackets point to Mode 01');
eq(/zero/i.test(M('2 1/3 + 5/0').error), true, 'zero denominator message'); eq(/division by zero/i.test(M('2 1/3 \u00f7 0').error), true, 'division by zero message'); eq(/minus sign at the front/.test(M('3/-4').error), true, 'sign after the bar message');
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
