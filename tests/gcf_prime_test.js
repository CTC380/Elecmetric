/* Tests for tools/gcf_prime_engine.js (GCF Calculator, Mode 02, Prime Factorisation GCF) against tests/gcf_prime_vectors.json (independent: gen_gcf_prime_vectors.py, Python math.gcd, sympy.factorint with
   the lowest common exponent of each prime, and a brute-force divisor search), the fixed cases from the GCF Calculator CEO decision note, and the built page
   calculators/gcf-prime-factorisation-calculator/index.html (plus the Mode 01 page, which must now link to it). */
const P = require('../tools/gcf_prime_engine.js'), V = require('./gcf_prime_vectors.json'), fs = require('fs'), path = require('path');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 20) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const ok = (c, m) => { n++; if (!c) bad(m); };
const S = (t) => P.solve({ text: t });
const clean = (r) => !/NaN|\[object|null|\bundefined\b/.test(JSON.stringify([r.steps, r.rows, r.sentence, r.summary, r.valueText, r.warnings, r.notes, r.numbers]).replace(/is undefined|GCF = undefined|Undefined/g, ''));
for (const [t, status, view, gcf, gft, facs, common, lcm, lft, mat] of V.solve) {
  const tag = '[' + t.replace(/\s+/g, ' ').slice(0, 50) + ']', r = S(t);
  if (!r.ok) { bad(tag + ' rejected: ' + r.error); continue; }
  eq(r.status === 'undefined' ? 'undefined' : 'ok', status, 'status ' + tag);
  if (status === 'undefined') { eq(r.gcf, null, 'no value ' + tag); eq(r.valueText, 'GCF = undefined', 'headline ' + tag); eq(r.view, 'none', 'view ' + tag); eq(r.verifyOk, true, 'checks ' + tag); continue; }
  eq(r.view, view, 'view ' + tag); eq(r.gcf, gcf, 'GCF ' + tag); eq(r.valueText, 'GCF = ' + gcf, 'headline ' + tag); eq(r.gcfFactorText, gft, 'GCF as prime powers ' + tag);
  if (lcm !== null) eq(r.lcm, lcm, 'LCM ' + tag); else eq(r.lcm, '0', 'LCM with a zero ' + tag);
  if (view === 'full') {
    r.numbers.forEach((x, i) => { if (facs[i] === null) eq(x.zero, true, 'zero flagged ' + tag); else eq(x.factorText, facs[i], 'factorisation of term ' + (i + 1) + ' ' + tag); });
    eq(r.primes.map((q) => q.p + ':' + q.exps.join('/')).join(' '), mat.map((m) => m[0] + ':' + m[1].join('/')).join(' '), 'exponent table ' + tag);
    eq(r.primes.filter((q) => q.common).map((q) => q.p).join(','), common.join(','), 'common primes ' + tag);
    if (lft !== null) eq(r.lcmFactorText, lft, 'LCM as prime powers ' + tag);
    eq(r.primes.every((q) => q.min === Math.min(...q.exps.filter((e) => e !== null)) && q.max === Math.max(...q.exps.filter((e) => e !== null))), true, 'lowest and highest power ' + tag);
  } else if (view === 'partial') {
    eq(r.primes.map((q) => q.p + ':' + q.exps.join('/')).join(' '), mat.map((m) => m[0] + ':' + m[1].join('/')).join(' '), 'partial exponent table ' + tag);
    eq(r.notes.length, 1, 'large-number note ' + tag);
  } else { eq(r.gcfFactorText, null, 'no prime powers ' + tag); eq(r.notes.length, 1, 'note ' + tag); }
  eq(r.verifyOk, true, 'checks ' + tag); eq(r.verify.every((x) => x[1] === true), true, 'every check passed ' + tag); eq(r.verify.length >= (view === 'full' ? 6 : 3), true, 'number of checks ' + tag);
  eq(Array.isArray(r.steps) && r.steps.length >= 2 && r.steps.every((s) => typeof s === 'string' && s.length >= 5), true, 'working ' + tag); eq(clean(r), true, 'no undefined or NaN text ' + tag);
  eq(r.sentence.indexOf('GCF(') === 0 && r.sentence.slice(-(' = ' + gcf).length) === ' = ' + gcf, true, 'sentence ' + tag);
  const arr = P.parseList(t).nums.slice().reverse(); eq(P.solve({ nums: arr }).gcf, gcf, 'reverse order ' + tag);
}
V.err.forEach((t) => { const r = S(t); eq(r.ok, false, 'must refuse [' + t.slice(0, 50) + ']'); eq(typeof r.error === 'string' && r.error.length > 5 && r.empty !== true, true, 'message for [' + t.slice(0, 50) + ']'); });
V.empty.forEach((t) => { const r = S(t); eq(r.ok === false && r.empty === true && typeof r.hint === 'string' && r.hint.length > 5, true, 'empty or one number flagged with a hint [' + t + ']'); });
// the CEO note, by exact text
[['12, 18', '6'], ['16, 88, 104', '8'], ['24, 36', '12'], ['48, 18', '6'], ['21, 14, 35', '7'], ['100, 250, 500', '50'], ['17, 19', '1'], ['-24, 36', '12'], ['0, 15', '15']].forEach(([t, g]) => eq(S(t).gcf, g, 'CEO note GCF(' + t + ')'));
eq(S('0, 0').status, 'undefined', 'GCF(0, 0) undefined');
const a = S('24, 36'); eq(a.numbers.map((x) => x.factorText).join(' | '), '2^3 × 3 | 2^2 × 3^2', 'note example 24 = 2^3 x 3, 36 = 2^2 x 3^2'); eq(a.gcfFactorText, '2^2 × 3', 'note example GCF = 2^2 x 3'); eq(a.gcf, '12', 'note example 12');
eq(a.steps.some((s) => /4 × 3 = 12/.test(s)), true, 'final multiplication shown (2^2 x 3 = 4 x 3 = 12)'); eq(a.numbers[0].expanded + ' | ' + a.numbers[1].expanded, '2 × 2 × 2 × 3 | 2 × 2 × 3 × 3', 'written-out factors'); eq(a.lcmFactorText + '=' + a.lcm, '2^3 × 3^2=72', 'LCM from highest powers');
const b = S('16, 88, 104'); eq(b.numbers.map((x) => x.factorText).join(' | '), '2^4 | 2^3 × 11 | 2^3 × 13', 'note 3-number example'); eq(b.gcfFactorText, '2^3', 'note GCF = 2^3'); eq(b.primes.filter((q) => q.common).length, 1, 'only 2 is common');
eq(S('600, 200').quotients.join(':'), '3:1', '600:200 = 3:1'); eq(S('600, 200').numbers.map((x) => x.factorText).join(' | '), '2^3 × 3 × 5^2 | 2^3 × 5^2', '600 and 200 factors');
eq(S('24, 36').numbers[0].ladder.map((d) => d.join('>')).join(' '), '2>12 2>6 2>3 3>1', 'division ladder of 24');
// primality and factoring routines
[[2n, true], [3n, true], [4n, false], [561n, false], [1000000007n, true], [999999937n * 999999929n, false], [2305843009213693951n, true], [999999999999999989n, true], [1n, false], [0n, false]].forEach(([v, p]) => eq(P.isPrime(v), p, 'isPrime(' + v + ')'));
const pf = P.factorFull(999999929n * 999999937n); eq(Array.isArray(pf) && pf.map((x) => x[0]).join(','), '999999929,999999937', 'rho splits a product of two primes near 10^9');
// large input, timing
const t0 = Date.now(); const big = S('999999866000004473, 999999937000000000'); ok(big.ok && big.verifyOk && Date.now() - t0 < 5000, 'worst-case 10^18 inputs finish in time'); eq(big.view, 'full', '10^18 range is factored in full');
const pv = S('1' + '0'.repeat(29) + '1, 77'); eq(pv.view, 'partial', 'above 10^18 uses the partial view'); ok(pv.verifyOk && pv.gcfFactorText !== null, 'partial view is verified and factors the GCF');
eq(S('2' + '0'.repeat(30) + ', 4' + '0'.repeat(29)).view, 'none', 'a GCF above 10^18 is not factored'); eq(S('2' + '0'.repeat(30) + ', 4' + '0'.repeat(29)).gcf, '4' + '0'.repeat(29), 'exact large GCF');
eq(S('9007199254740993, 18014398509481986').gcf, '9007199254740993', 'above 2^53 is exact');
// the built pages
const base = path.join(__dirname, '..', 'calculators'), hp = path.join(base, 'gcf-prime-factorisation-calculator', 'index.html');
if (fs.existsSync(hp)) {
  const html = fs.readFileSync(hp, 'utf8');
  ok(/<title>[^<]{20,60}<\/title>/.test(html), 'page title length'); const d = /name="description" content="([^"]*)"/.exec(html); ok(d && d[1].length >= 50 && d[1].length <= 160, 'meta description length');
  eq((html.match(/<h1>/g) || []).length, 1, 'one h1'); ok(/id="ns-in"/.test(html) && /id="ns-out"/.test(html) && /id="ns-steps"/.test(html) && /id="ns-verify"/.test(html), 'tool markup');
  ok(!/NaN|\[object/.test(html.replace(/<script[\s\S]*?<\/script>/g, '')) && !/undefined/.test(html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/(is |says |>)undefined|undefined, because/g, '')), 'no undefined or NaN in the page text');
  ok(/<nav class="fmodes"/.test(html) && /aria-current="page">Mode 02 · Prime Factorisation/.test(html) && /href="\.\.\/gcf-calculator\/"/.test(html), 'mode strip with Mode 02 current and a link to Mode 01');
  ok(/Mode 03 · Euclidean Algorithm \(coming\)/.test(html) && !/href="\.\.\/euclidean-algorithm-calculator\/"/.test(html), 'Modes 03 to 05 stay plain text');
  ok(/GCD/.test(html) && /HCF/.test(html) && /Euclidean algorithm/.test(html), 'page names GCD, HCF and the Euclidean algorithm');
  ['fraction-simplifier', 'ratio-calculator', 'fraction-ratio-tools', 'proportion-calculator', 'gcf-calculator'].forEach((s) => ok(html.indexOf('href="../' + s + '/"') >= 0 && fs.existsSync(path.join(base, s, 'index.html')), 'related link resolves: ' + s));
  ok(html.indexOf('2<sup>2</sup> × 3 = 4 × 3 = <b>12</b>') >= 0 && html.indexOf('<b>8</b>') >= 0, 'worked examples 12 and 8 on the page');
  ok(/<script>[\s\S]*window\.GCFP|root\.GCFP/.test(html) && /elecmetric\.gcf\.prime\.history/.test(html), 'engine and client are inlined');
}
const m1 = path.join(base, 'gcf-calculator', 'index.html');
if (fs.existsSync(m1)) { const h1 = fs.readFileSync(m1, 'utf8'); ok(/href="\.\.\/gcf-prime-factorisation-calculator\/"/.test(h1), 'Mode 01 page links to Mode 02'); ok(!/Mode 02 · Prime Factorisation \(coming\)/.test(h1), 'Mode 02 no longer marked coming on Mode 01'); }
console.log('gcf prime engine and page: ' + n + ' checks'); if (fail) { console.log(fail + ' FAILED'); process.exit(1); }
