/* Tests for tools/gcf_engine.js (GCF Calculator, Mode 01, Multiple Number GCF) against tests/gcf_vectors.json (independent: gen_gcf_vectors.py, Python math.gcd, sympy.factorint and a
   brute-force divisor search), the fixed cases from the GCF Calculator CEO decision note, and the built page calculators/gcf-calculator/index.html. */
const G = require('../tools/gcf_engine.js'), V = require('./gcf_vectors.json'), fs = require('fs'), path = require('path');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 20) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const ok = (c, m) => { n++; if (!c) bad(m); };
const S = (t) => G.solve({ text: t });
const clean = (r) => !/undefined|NaN|\[object|null/.test(JSON.stringify([r.steps, r.primeSteps, r.rows, r.sentence, r.summary, r.valueText, r.warnings, r.notes]).replace(/is undefined|GCF = undefined|\bundefined\b: every|Undefined/g, ''));
for (const [t, status, gcf, lcm, quo, facs, gft, cop] of V.solve) {
  const tag = '[' + t.replace(/\s+/g, ' ').slice(0, 60) + ']', r = S(t);
  if (!r.ok) { bad(tag + ' rejected: ' + r.error); continue; }
  eq(r.status === 'undefined' ? 'undefined' : 'ok', status, 'status ' + tag);
  if (status === 'undefined') { eq(r.gcf, null, 'no value ' + tag); eq(r.valueText, 'GCF = undefined', 'headline ' + tag); eq(r.verifyOk, true, 'checks ' + tag); eq(r.steps.length >= 3, true, 'working ' + tag); continue; }
  eq(r.gcf, gcf, 'GCF ' + tag); eq(r.valueText, 'GCF = ' + gcf, 'headline ' + tag); eq(r.lcm, lcm, 'LCM ' + tag); eq(r.quotients.join(','), quo.join(','), 'numbers / GCF ' + tag); eq(r.coprime, cop, 'coprime ' + tag);
  if (facs === null) { eq(r.factors, null, 'not factorised ' + tag); eq(r.gcfFactorText, null, 'no prime powers ' + tag); eq(r.notes.length, 1, 'large-number note ' + tag); }
  else {
    eq(r.factors.length, facs.length, 'factor list length ' + tag); eq(r.gcfFactorText, gft, 'GCF as prime powers ' + tag);
    r.factors.forEach((f, i) => { if (facs[i] === null) eq(f, null, 'zero is not factorised ' + tag); else eq(f.length ? f.map((x) => x[0] + (x[1] > 1 ? '^' + x[1] : '')).join(' \u00d7 ') : '1', facs[i], 'factorisation of term ' + (i + 1) + ' ' + tag); });
  }
  eq(r.verifyOk, true, 'checks ' + tag); eq(r.verify.every((x) => x[1] === true), true, 'every check passed ' + tag); eq(r.verify.length >= (facs === null ? 4 : 6), true, 'number of checks ' + tag);
  eq(Array.isArray(r.steps) && r.steps.length >= 2 && r.steps.every((s) => typeof s === 'string' && s.length > 8), true, 'working ' + tag); eq(clean(r), true, 'no undefined or NaN text ' + tag);
  eq(r.euclid.length, r.count, 'one Euclid record per number ' + tag);
  eq(r.sentence.indexOf('GCF(') === 0 && r.sentence.slice(-(' = ' + gcf).length) === ' = ' + gcf, true, 'sentence ' + tag);
  // the order of the numbers never changes the answer
  const arr = G.parseList(t).nums.slice().reverse(); eq(G.solve({ nums: arr }).gcf, gcf, 'reverse order ' + tag);
}
V.err.forEach((t) => { const r = S(t); eq(r.ok, false, 'must refuse [' + t.slice(0, 50) + ']'); eq(typeof r.error === 'string' && r.error.length > 5 && r.empty !== true, true, 'message for [' + t.slice(0, 50) + ']'); });
V.empty.forEach((t) => { const r = S(t); eq(r.ok === false && r.empty === true && typeof r.hint === 'string' && r.hint.length > 5, true, 'empty or one number flagged with a hint [' + t + ']'); });
// the CEO note, by exact text
const exp = [['12, 18', '6'], ['16, 88, 104', '8'], ['24, 36', '12'], ['48, 18', '6'], ['21, 14, 35', '7'], ['100, 250, 500', '50'], ['17, 19', '1'], ['-24, 36', '12'], ['0, 15', '15']];
exp.forEach(([t, g]) => eq(S(t).gcf, g, 'CEO note GCF(' + t + ')'));
eq(S('0, 0').status, 'undefined', 'GCF(0, 0) is undefined'); eq(S('0, 0').gcfText, 'Undefined', 'GCF(0, 0) text'); eq(S('0, 0, 0').gcf, null, 'GCF(0, 0, 0) has no value');
eq(S('12, 18').lcm, '36', 'LCM(12, 18)'); eq(S('12, 18').rows.filter((x) => x[0] === 'GCF \u00d7 LCM = product')[0][1], '6 \u00d7 36 = 216 = 12 \u00d7 18', 'GCF x LCM identity row');
eq(S('600, 200').quotients.join(':'), '3:1', '600:200 reduces to 3:1');
const c1 = S('16, 88, 104'); eq(c1.factors.map((f) => f.map((x) => x[0] + '^' + x[1]).join(' ')).join(' | '), '2^4 | 2^3 11^1 | 2^3 13^1', 'note example factorisations'); eq(c1.gcfFactorText, '2^3', 'note example 2^3');
eq(S('24, 36').gcfFactorText, '2^2 \u00d7 3', 'note example 2^2 x 3'); eq(S('48, 18').euclid[1].divs.map((d) => d.join(',')).join(' | '), '48,18,2,12 | 18,12,1,6 | 12,6,2,0', 'note Euclid table 48 = 18 x 2 + 12');
// the Euclidean working is modulo based (a handful of lines for a 300 digit pair), not repeated subtraction
const big = S('1' + '0'.repeat(299) + '7, ' + '9'.repeat(300)); ok(big.ok && big.euclid[1].divs.length < 3000, 'modulo Euclid on 300 digits is short');
eq(S('2' + '0'.repeat(30) + ', 4' + '0'.repeat(29)).gcf, '4' + '0'.repeat(29), '30 digit exact value, no floating-point loss');
eq(S('9007199254740993, 9007199254740995').gcf, '1', 'above 2^53 is exact'); eq(S('9007199254740993, 18014398509481986').gcf, '9007199254740993', 'above 2^53 multiples are exact');
// limits
eq(S(Array.from({ length: 20 }, (_, i) => 6 * (i + 1)).join(',')).gcf, '6', 'twenty numbers'); eq(S(Array.from({ length: 21 }, (_, i) => i + 2).join(',')).ok, false, 'twenty-one numbers refused');
eq(S('1' + '0'.repeat(499) + ', 5').ok, true, '500 digits accepted'); eq(S('1' + '0'.repeat(500) + ', 5').ok, false, '501 digits refused');
// the built page
const hp = path.join(__dirname, '..', 'calculators', 'gcf-calculator', 'index.html');
if (fs.existsSync(hp)) {
  const html = fs.readFileSync(hp, 'utf8');
  ok(/<title>[^<]{20,60}<\/title>/.test(html), 'page title length'); const d = /name="description" content="([^"]*)"/.exec(html); ok(d && d[1].length >= 50 && d[1].length <= 160, 'meta description length');
  eq((html.match(/<h1>/g) || []).length, 1, 'one h1'); ok(/id="ns-in"/.test(html) && /id="ns-out"/.test(html) && /id="ns-steps"/.test(html) && /id="ns-verify"/.test(html), 'tool markup');
  ok(!/undefined|NaN|\[object/.test(html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/(all zeros: |is |says |>)undefined/g, '$1')), 'no undefined or NaN in the page text (the word is used only for GCF of all zeros)');
  ok(/<nav class="fmodes"/.test(html) && /GCF Calculator/.test(html), 'mode strip');
  ok(/GCD/.test(html) && /HCF/.test(html), 'page names GCD and HCF'); ok(/href="\.\.\/fraction-simplifier\/"/.test(html) && /href="\.\.\/ratio-calculator\/"/.test(html), 'related links');
  // the example table on the page is calculated by the engine
  ok(html.indexOf('GCF = 8') >= 0 || html.indexOf('>8<') >= 0, 'worked example result 8 on the page');
}
console.log('gcf engine and page: ' + n + ' checks'); if (fail) { console.log(fail + ' FAILED'); process.exit(1); }
