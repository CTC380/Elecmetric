/* Tests for the simplifier in tools/fraction_engine.js against tests/fraction_simplify_vectors.json (independent: gen_fraction_simplify_vectors.py,
   Python math.gcd and fractions.Fraction) and fixed cases from the product note. */
const Fx = require('../tools/fraction_engine.js'), V = require('./fraction_simplify_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 15) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': ' + a + ' vs ' + b); };
const chk = (r, row, t) => {
  if (!r.ok) { bad(t + ' rejected: ' + r.error); return; }
  eq(r.num, row[2], 'numerator ' + t); eq(r.den, row[3], 'denominator ' + t); eq(r.g, row[4], 'gcd ' + t); eq(r.mixed.text, row[5], 'mixed ' + t);
  eq(r.den > 0n && Fx.gcd(r.num, r.den) === 1n, true, 'lowest terms and positive denominator ' + t);
  // every Euclid row must be an exact division, and the chain must end in remainder 0
  let okE = true, prev = null; for (const [a, b, q, rem] of r.euclid) { if (a !== b * q + rem || rem >= b) okE = false; if (prev !== null && a !== prev) okE = false; prev = b; }
  if (r.euclid.length) { eq(okE && r.euclid[r.euclid.length - 1][3] === 0n, true, 'euclid rows ' + t); eq(r.euclid[r.euclid.length - 1][1], row[4], 'last divisor is the gcd ' + t); }
  eq(r.steps.length >= 1 && r.steps.every((s) => typeof s === 'string' && s.length > 5), true, 'working present ' + t);
};
for (const row of V.ok) { chk(Fx.simplify({ num: row[0], den: row[1] }), row, '[' + row[0] + '/' + row[1] + ']'); chk(Fx.simplify({ expr: row[0] + '/' + row[1] }), row, '[expr ' + row[0] + '/' + row[1] + ']'); }
for (const row of V.dec) chk(Fx.simplify({ num: row[0], den: row[1] }), row, '[decimal ' + row[0] + '/' + row[1] + ']');
for (const row of V.big) chk(Fx.simplify({ num: row[0], den: row[1] }), row, '[big ' + row[0].slice(0, 20) + '...]');
for (const [txt, num, den, g, mx] of V.mixed) { const r = Fx.simplify({ expr: txt.replace(/ (\d+\/\d+)$/, ' $1') }); chk(r, [null, null, num, den, g, mx], '[mixed ' + txt + ']'); }
// the mixed-number cases above are typed as "w n/d" in one field: the denominator after the slash belongs to the whole mixed number
for (const [num, f] of V.factors) { const r = Fx.factor(BigInt(num)); eq(r.map((x) => x[0] + '^' + x[1]).join(','), f.map((x) => x[0] + '^' + x[1]).join(','), 'prime factors of ' + num); }
for (const e of V.err) { const r = Fx.simplify({ expr: e }); eq(r.ok, false, 'must be rejected [' + e + ']'); eq(r.empty === true, e.trim() === '', 'empty flag [' + e + ']'); if (e.trim() !== '') eq(typeof r.error === 'string' && r.error.length > 5, true, 'message [' + e + ']'); }
for (const [a, b] of V.nd_err) { const r = Fx.simplify({ num: a, den: b }); eq(r.ok, false, 'fields must be rejected [' + a + ' / ' + b + ']'); eq(typeof r.error === 'string' && r.error.length > 5, true, 'field message [' + a + ' / ' + b + ']'); }
// fixed cases from the product note
const S = (a, b) => Fx.simplify({ num: String(a), den: String(b) });
eq(S(18, 24).frac, '3/4', '18/24'); eq(S(18, 24).g, 6n, 'gcd 6'); eq(S(18, 24).num, 3n, 'simplified numerator'); eq(S(18, 24).den, 4n, 'simplified denominator');
eq(S(18, 24).euclid.length, 2, 'Euclid rows of 18, 24'); eq(S(18, 24).factors.fa.map((x) => x[0] + '^' + x[1]).join(' '), '2^1 3^2', '18 = 2 x 3^2');
eq(S(17, 5).already, true, '17/5 already lowest'); eq(S(17, 5).changed, false, '17/5 not changed'); eq(S(18, 24).changed, true, '18/24 changed'); eq(S(0, 7).frac, '0', '0/7'); eq(S(0, 7).g, 7n, 'gcd(0, 7) = 7');
eq(S(-6, -8).frac, '3/4', 'both negative'); eq(S(6, -8).frac, '-3/4', 'negative denominator'); eq(S(7, 1).frac, '7', 'denominator 1'); eq(S(4, 2).frac, '2', 'whole number result');
eq(S(100, 8).mixed.text, '12 1/2', '100/8 mixed'); eq(S(5, 0).ok, false, 'zero denominator'); eq(/denominator is 0/i.test(S(5, 0).error), true, 'zero denominator message');
eq(Fx.simplify({ expr: '2 6/8' }).frac, '11/4', 'mixed number 2 6/8'); eq(Fx.simplify({ expr: '48' }).frac, '48', 'a lone integer');
eq(Fx.simplify({ num: '1.5', den: '2.5' }).frac, '3/5', '1.5/2.5'); eq(Fx.simplify({ num: '1.5', den: '2.5' }).scaled, true, 'decimal flagged as scaled');
eq(Fx.simplify({ num: '1' + '0'.repeat(399), den: '1' + '0'.repeat(399) }).frac, '1', 'two 400-digit numbers'); eq(Fx.simplify({ num: '1' + '0'.repeat(400), den: '2' }).ok, false, '401 digits rejected');
eq(Fx.simplify({ num: '', den: '' }).ok, false, 'empty fields'); eq(Fx.simplify(null).ok, false, 'null input'); eq(Fx.factor(2n ** 89n - 1n, 1000) === null, true, 'a large prime is left unfactored, not looped on');
eq(Fx.simplify({ num: String(2n ** 89n - 1n), den: String((2n ** 89n - 1n) * 6n) }).frac, '1/6', 'Euclid still exact when factoring is skipped');
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
