/* Tests for advCalc (Mode 05: GCD and LCM, LCD, comparison, ratio, proportion) in tools/fraction_engine.js against tests/fraction_adv_vectors.json
   (independent: gen_fraction_adv_vectors.py, prime exponents, Python fractions.Fraction and planted proportions), property checks on every result,
   and the fixed cases from the product note. */
const Fx = require('../tools/fraction_engine.js'), V = require('./fraction_adv_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 15) console.log('FAIL ' + m); };
const J = (x) => JSON.stringify(x, (k, v) => typeof v === 'bigint' ? v + 'n' : v);
const eq = (a, b, m) => { n++; if (J(a) !== J(b)) bad(m + ': ' + J(a) + ' vs ' + J(b)); };
const A = (tool, expr, total) => Fx.advCalc({ tool, expr, total });
const ok = (r, t) => { if (!r.ok) { bad(t + ' rejected: ' + r.error); return false; } eq(r.steps.length >= 1 && r.steps.every((s) => typeof s === 'string' && s.length > 5), true, 'working present ' + t); eq(typeof r.big === 'string' && r.big.length > 0, true, 'headline ' + t); eq(Array.isArray(r.results) && r.results.length >= 1, true, 'results ' + t); return true; };
const frac = (s) => { const m = /^(-?\d+)(?:\/(\d+))?$/.exec(s); return [BigInt(m[1]), BigInt(m[2] || 1)]; };
const same = (a, b) => { const x = frac(a), y = frac(b); return x[0] * y[1] === y[0] * x[1]; };
// ---- gcd and lcm
for (const [txt, nums, G, L, pr] of V.gcd) {
  const t = '[gcd ' + txt + ']', r = A('gcdlcm', txt); if (!ok(r, t)) continue;
  eq(r.nums, nums, 'numbers ' + t); eq(r.gcd, G, 'gcd ' + t); eq(r.lcm, L, 'lcm ' + t); eq(r.coprime, nums.length === 2 && G === '1', 'coprime ' + t);
  if (r.primes) { eq(r.primes.gcd, pr[0], 'gcd primes ' + t); eq(r.primes.lcm, pr[1], 'lcm primes ' + t); }
  nums.forEach((x) => { eq(BigInt(x) % BigInt(r.gcd), 0n, 'gcd divides ' + t); eq(BigInt(r.lcm) % BigInt(x), 0n, 'lcm is a multiple ' + t); });
  eq(r.steps.filter((s) => /Euclidean/.test(s)).length, nums.length - 1, 'one Euclid step per extra number ' + t); eq(r.steps.filter((s) => /^lcm\(/.test(s)).length, nums.length - 1, 'one lcm step per extra number ' + t);
  if (nums.length === 2) eq(r.steps.some((s) => s.indexOf('Check: GCD \u00d7 LCM = ' + G + ' \u00d7 ' + L) === 0), true, 'gcd x lcm check ' + t);
  eq(r.steps.some((s) => /Signs are ignored/.test(s)), /\u2212/.test(txt), 'sign note ' + t);
}
for (const [txt, G, L] of V.big) { const r = A('gcdlcm', txt), t = '[big gcd ' + txt.slice(0, 30) + '...]'; if (!ok(r, t)) continue; eq(r.gcd, G, 'big gcd ' + t); eq(r.lcm, L, 'big lcm ' + t); eq(r.primes === null || r.primes === undefined || typeof r.primes === 'object', true, 'primes shape ' + t); }
// ---- lcd
for (const [txt, lows, L, eqv, mult] of V.lcd) {
  const t = '[lcd ' + txt + ']', r = A('lcd', txt); if (!ok(r, t)) continue;
  eq(r.lcd, L, 'lcd ' + t); eq(r.rows.map((x) => x.lowest), lows, 'lowest terms ' + t); eq(r.rows.map((x) => x.equiv), eqv, 'equivalent ' + t); eq(r.rows.map((x) => x.mult), mult, 'multipliers ' + t); eq(r.count, lows.length, 'count ' + t);
  r.rows.forEach((x) => { eq(same(x.lowest, x.equiv), true, 'same value ' + t); eq(x.equiv.split('/')[1], L, 'common denominator ' + t); });
  eq(r.steps.some((s) => /least common (denominator|multiple)|whole number, so the least/.test(s)), true, 'lcd step ' + t);
}
// ---- compare
for (const [txt, order, rank, sorted, lo, hi, diff, L, rel, allEq] of V.cmp) {
  const t = '[compare ' + txt + ']', r = A('compare', txt); if (!ok(r, t)) continue;
  eq(r.order, order, 'order ' + t); eq(r.ranks, rank, 'ranks ' + t); eq(r.sorted, sorted, 'sorted values ' + t); eq(r.smallest, lo, 'smallest ' + t); eq(r.largest, hi, 'largest ' + t); eq(r.diff, diff, 'difference ' + t); eq(r.lcd, L, 'lcd ' + t); eq(r.relation, rel, 'relation ' + t); eq(r.allEqual, allEq, 'all equal ' + t);
  eq(r.tables[0].rows.map((x) => x[0]), order.map((i) => String(rank[i])), 'rank column ' + t);
  if (rel) eq(r.big.indexOf(' ' + rel + ' ') > 0, true, 'relation in the headline ' + t);
}
// ---- ratio
for (const [txt, tot, ints, sum, shares, ts, unit] of V.ratio) {
  const t = '[ratio ' + txt + '|' + tot + ']', r = A('ratio', txt, tot); if (!ok(r, t)) continue;
  eq(r.ints, ints, 'terms ' + t); eq(r.ratio, ints.join(' : '), 'ratio text ' + t); eq(r.sum, sum, 'sum ' + t); eq(r.shares, shares, 'shares ' + t); eq(r.totalShares, ts, 'shares of the total ' + t); eq(r.unit, unit, 'first term as 1 ' + t);
  eq(r.ints.map(BigInt).reduce((a, x) => Fx.gcd(a, x), 0n), 1n, 'lowest terms ' + t);
}
// ---- proportion
for (const [txt, x, which, terms] of V.prop) {
  const t = '[prop ' + txt + ']', r = A('proportion', txt); if (!ok(r, t)) continue;
  eq(r.x, x, 'x ' + t); eq(r.unknown, which, 'unknown term ' + t); eq(r.terms, terms, 'completed proportion ' + t); eq(r.check, true, 'cross products agree ' + t);
  eq(r.steps.some((s) => /^Cross-multiplication/.test(s)), true, 'cross-multiplication step ' + t); eq(r.steps.some((s) => /^Check: a \u00d7 d = /.test(s) && /, which are equal\./.test(s)), true, 'check step ' + t);
}
// ---- continued fractions
for (const [txt, terms, conv, val] of V.cf) {
  const t = '[cf ' + txt.slice(0, 40) + ']', r = A('continued', txt); if (!ok(r, t)) continue;
  eq(r.terms, terms, 'terms ' + t); eq(r.convergents.slice(0, r.convergents.length), conv, 'convergents ' + t); eq(r.value, val, 'value ' + t); eq(r.build, false, 'expand mode ' + t);
  eq(r.cf, '[' + terms[0] + (terms.length > 1 ? '; ' + terms.slice(1).join(', ') : '') + ']', 'bracket text ' + t);
  eq(same(r.convergents[r.convergents.length - 1], val), true, 'last convergent is the value ' + t);
  eq(terms.slice(1).every((x) => BigInt(x) >= 1n), true, 'later terms are positive ' + t); if (terms.length > 1) eq(BigInt(terms[terms.length - 1]) >= 2n, true, 'last term is 2 or more ' + t);
  eq(r.tables[0].rows.length, Math.min(terms.length, 30), 'convergent rows ' + t);
}
for (const [txt, val, canon, flag] of V.cfb) {
  const t = '[cf build ' + txt + ']', r = A('continued', txt); if (!ok(r, t)) continue;
  eq(r.build, true, 'build mode ' + t); eq(r.value, val, 'value ' + t); eq(r.terms, canon, 'standard form ' + t);
  eq(r.steps.some((s) => /^Every rational number has two continued fractions/.test(s)), flag, 'two-forms note ' + t);
}
// ---- errors
for (const [tool, e] of V.err) { const r = A(tool, e); eq(r.ok, false, 'must be rejected [' + tool + ' ' + e.slice(0, 30) + ']'); eq(r.empty === true, e.trim() === '', 'empty flag [' + tool + ' ' + e.slice(0, 20) + ']'); if (e.trim() !== '') eq(typeof r.error === 'string' && r.error.length > 5, true, 'message [' + tool + ' ' + e.slice(0, 30) + ']'); }
for (const [e, tot] of V.errtotal) { const r = A('ratio', e, tot); eq(r.ok, false, 'total must be rejected [' + tot + ']'); eq(r.field, 'total', 'total field flag [' + tot + ']'); }
// ---- fixed cases from the product note and the usual textbook examples
eq(A('gcdlcm', '48, 18').gcd, '6', 'gcd(48, 18)'); eq(A('gcdlcm', '48, 18').lcm, '144', 'lcm(48, 18)'); eq(A('gcdlcm', '4 6 10').lcm, '60', 'lcm of three'); eq(A('gcdlcm', '7, 13').coprime, true, 'coprime'); eq(A('gcdlcm', '12, 12').gcd, '12', 'equal numbers');
eq(A('gcdlcm', '5').ok, false, 'one number is refused'); eq(/LCD tool/.test(A('gcdlcm', '1/2, 3').error), true, 'fractions point to the LCD tool'); eq(/Zero/.test(A('gcdlcm', '0, 5').error), true, 'zero message');
eq(A('lcd', '1/2, 1/3').lcd, '6', 'LCD of 1/2 and 1/3'); eq(A('lcd', '1/6, 3/4, 5/9').lcd, '36', 'LCD of three'); eq(A('lcd', '2/4, 1/3').lcd, '6', 'LCD uses lowest terms, so 6 not 12'); eq(A('lcd', '3, 5').lcd, '1', 'whole numbers'); eq(A('lcd', '1/2, 3/4').rows[0].equiv, '2/4', '1/2 over 4'); eq(A('lcd', '0.2, 1/3').lcd, '15', 'decimals are fractions');
eq(A('compare', '3/4, 5/7').relation, '>', '3/4 > 5/7'); eq(A('compare', '1/2, 2/4').relation, '=', 'equal fractions'); eq(A('compare', '1/3, 0.333').relation, '>', '1/3 > 0.333'); eq(A('compare', '-1/2, -1/3').relation, '<', 'negatives'); eq(A('compare', '1/3, 3/8, 0.4').big, '1/3 < 3/8 < 0.4', 'chain keeps what was typed');
eq(A('ratio', '18 : 24').ratio, '3 : 4', '18:24'); eq(A('ratio', '240 : 12').ratio, '20 : 1', 'transformer ratio 240:12 = 20:1'); eq(A('ratio', '1/2 : 1/3').ratio, '3 : 2', 'fraction terms'); eq(A('ratio', '0.5 : 0.25 : 0.75').ratio, '2 : 1 : 3', 'decimal terms'); eq(A('ratio', '0 : 5').ratio, '0 : 1', 'zero term'); eq(A('ratio', '3 to 4').ratio, '3 : 4', 'the word to'); eq(A('ratio', '2 : 3', '100').totalShares, ['40', '60'], 'share 100 in 2:3'); eq(A('ratio', '1 : 1', '1').totalShares, ['1/2', '1/2'], 'share 1 in 1:1');
eq(A('proportion', '3 : 4 = 9 : x').x, '12', '3:4 = 9:x'); eq(A('proportion', '2 : 5 = x : 20').x, '8', 'x in the third place'); eq(A('proportion', 'x : 5 = 2 : 3').x, '10/3', 'fractional x'); eq(A('proportion', '1/2 : 3 = 1 : x').x, '6', 'fractions in a proportion'); eq(A('proportion', '3 : 4 = 9 : x').steps[1], 'Cross-multiplication: a \u00d7 d = b \u00d7 c.', 'cross multiplication step');
eq(A('continued', '355/113').cf, '[3; 7, 16]', '355/113'); eq(A('continued', '[3; 7, 15, 1]').value, '355/113', 'build 355/113'); eq(A('continued', '[3; 7, 15, 1]').cf, '[3; 7, 16]', 'standard form'); eq(A('continued', '-415/93').cf, '[-5; 1, 1, 6, 7]', 'negative number rounds down'); eq(A('continued', '0.75').cf, '[0; 1, 3]', 'decimal read exactly'); eq(A('continued', '2 1/3').cf, '[2; 3]', 'mixed number'); eq(A('continued', '[2; 1, 2, 1, 1, 4, 1, 1, 6]').value, '1264/465', 'e approximant'); eq(A('continued', '[1; 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]').value, '144/89', 'golden ratio approximant'); eq(A('continued', '5').cf, '[5]', 'whole number'); eq(A('continued', '4/0').ok, false, 'zero denominator');
eq(A('nothing', '1, 2').ok, false, 'unknown tool'); eq(A('gcdlcm', null).empty, true, 'null is empty'); eq(A('lcd', '   ').empty, true, 'blank is empty'); eq(A('gcdlcm', '1' + '0'.repeat(399) + ' 5').ok, true, '400 digits are accepted'); eq(A('gcdlcm', '1' + '0'.repeat(400) + ' 5').ok, false, '401 digits are refused');
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
