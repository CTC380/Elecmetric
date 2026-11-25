/* Tests for tools/log_rules_engine.js (Log Calculator, Mode 04, Logarithm Rules) against tests/log_rules_vectors.json (independent: gen_log_rules_vectors.py, mpmath 110-digit logs and sympy factorint),
   the CEO note's rule table, domain errors, input forms, agreement with the Mode 01 engine, and the built page and mode strips. */
const R = require('../tools/log_rules_engine.js'), L = require('../tools/log_engine.js'), V = require('./log_rules_vectors.json'), fs = require('fs'), path = require('path');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 25) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const ok = (c, m) => { n++; if (!c) bad(m); };
/* decimal text (plain, mpmath e-notation, or "m × 10^e") -> BigInt scaled by 10^30 */
function sc(t) {
  t = String(t).replace(/\u2212/g, '-').replace(/ /g, '').replace(/\u00d710\^/, 'e'); const m = /^(-?)(\d*)\.?(\d*)(?:e([+-]?\d+))?$/.exec(t); if (!m) return null;
  let d = m[2] + m[3], e = (m[4] ? +m[4] : 0) - m[3].length + 30; let v = BigInt(d || '0'); v = e >= 0 ? v * 10n ** BigInt(e) : v / 10n ** BigInt(-e); return m[1] ? -v : v;
}
const near = (got, want, dp) => { const a = sc(got), b = sc(want); if (a === null || b === null) return false; const d = a > b ? a - b : b - a; return d <= 10n ** BigInt(30 - dp) / 2n + 10n ** 14n; };
const DP = 12;

for (const r0 of V.expr.concat(V.text)) {
  const t = '[' + r0.text + ']', r = R.run({ mode: 'expr', text: r0.text, dp: DP });
  if (!r.ok) { bad(t + ' rejected: ' + r.error); continue; }
  eq(r.status, r0.status, 'status ' + t); eq(r.exact, r0.exact, 'exact ' + t);
  ok(near(r.valueText, r0.value, DP), 'value ' + t + ': ' + r.valueText + ' vs ' + r0.value);
  if (r0.groups !== undefined) eq(r.nClasses, r0.groups, 'groups ' + t);
  eq(r.verifyOk, true, 'checks ' + t); ok(r.steps.length >= 2 && r.steps.every((s) => typeof s === 'string' && s.length > 8), 'working ' + t);
}
for (const r0 of V.expand) {
  const t = '[log_' + r0.b + '(' + r0.x + ')]', r = R.run({ mode: 'expand', b: r0.b, x: r0.x, dp: DP });
  if (!r.ok) { bad(t + ' rejected: ' + r.error); continue; }
  const got = {}; r.primeItems.forEach((it) => { const k = /\(([^()]+)\)$/.exec(it.term)[1]; got[k] = it.coef; });
  const want = r0.primes; eq(JSON.stringify(Object.keys(got).sort()), JSON.stringify(Object.keys(want).sort()), 'primes ' + t);
  Object.keys(want).forEach((k) => eq(String(got[k]).replace(/\u2212/g, '-'), want[k], 'coefficient of ' + k + ' ' + t));
  eq(r.exact, r0.exact, 'exact ' + t); ok(near(r.valueText, r0.value, DP), 'value ' + t); eq(r.verifyOk, true, 'checks ' + t);
  eq(r.b, r0.b === 'e' ? 'e' : r.b, 'base read');
}
for (const r0 of V.verify) {
  const t = '[' + r0.rule + ' b=' + r0.b + ' x=' + r0.x + ' y=' + r0.y + ' n=' + r0.n + ' c=' + r0.c + ']', r = R.run({ mode: 'verify', rule: r0.rule, b: r0.b, x: r0.x, y: r0.y, n: r0.n, c: r0.c, dp: DP });
  if (!r.ok) { bad(t + ' rejected: ' + r.error); continue; }
  eq(r.holds, true, 'rule holds ' + t); eq(r.verifyOk, true, 'checks ' + t); eq(r.status === 'rational', r0.rational, 'rational ' + t);
  ok(near(r.valueText, r0.value, DP), 'value ' + t + ': ' + r.valueText + ' vs ' + r0.value);
}
/* the CEO note */
const E = (t) => R.run({ mode: 'expr', text: t, dp: 8 });
eq(E('log2(8)').exact, '3', 'log2(8)'); eq(E('log10(1000)').exact, '3', 'log10(1000)'); eq(E('ln(e)').exact, '1', 'ln(e)'); eq(E('log2(0.125)').exact, '-3', 'log2(0.125)'); eq(E('log_0.5(8)').exact, '-3', 'log0.5(8)');
eq(E('log4(1/8)').exact, '-3/2', 'log4(1/8)'); eq(E('log5(125)').exact, '3', 'log5(125)'); eq(E('10*log10(100)').exact, '20', '10 log10(100) = 20'); eq(E('log2(32)').exact, '5', 'log2(32)');
eq(E('2*log2(3) - log2(9) + log2(12)').condensed, 'log\u2082(12)', 'condense to log2(12)'); eq(E('log2(3) + log4(1/9)').exact, '0', 'bases 2 and 4 combine');
/* agreement with Mode 01 */
for (const [b, x] of [['2', '3'], ['7', '1/5'], ['10', '12345'], ['1/3', '5']]) { const a = E('log_(' + b + ')(' + x + ')'), m = L.calc({ b, x, dp: 8 }); eq(a.exact, m.exact, 'Mode 01 exact ' + b + ',' + x); ok(near(a.valueText, m.y.text, 8), 'Mode 01 value ' + b + ',' + x); }
/* domain and input errors */
for (const e of V.err.expr) { const r = R.run({ mode: 'expr', text: e }); eq(r.ok, false, 'must reject [' + e + ']'); ok(typeof r.error === 'string' && (r.error.length > 5 || r.empty), 'message [' + e + ']'); }
for (const e of V.err.expandB) { const r = R.run({ mode: 'expand', b: e, x: '8' }); eq(r.ok, false, 'must reject base [' + e + ']'); ok(r.errors && r.errors.b, 'base message [' + e + ']'); }
for (const e of V.err.expandX) { const r = R.run({ mode: 'expand', b: '2', x: e }); eq(r.ok, false, 'must reject argument [' + e + ']'); ok(r.errors && r.errors.x || r.error, 'argument message [' + e + ']'); }
for (const e of V.err.verifyB) { const r = R.run({ mode: 'verify', rule: 'product', b: e, x: '2', y: '3' }); eq(r.ok, false, 'must reject verify base [' + e + ']'); }
eq(R.run({ mode: 'verify', rule: 'reciprocal', b: '2', x: '1' }).ok, false, 'reciprocal with x = 1');
eq(R.run({ mode: 'verify', rule: 'nope', b: '2' }).ok, false, 'unknown rule');
eq(E('log2(0)').error.slice(0, 9), 'Undefined', 'log(0) is undefined'); eq(E('log2(-4)').error.slice(0, 7), 'No real', 'log of a negative'); eq(E('log_1(5)').error.slice(0, 6), 'Error:', 'base 1');
eq(R.run({ mode: 'expr', text: 'log2(3)'.repeat(30) }).ok, false, 'too long');
eq(E('log2(3)'.concat(' + log2(5)'.repeat(40))).ok, false, 'more than 40 terms');
/* expansions */
const X = (b, x) => R.run({ mode: 'expand', b, x, dp: 8 });
eq(X('2', '36*5/7^2').typed, 'log\u2082(36) + log\u2082(5) - 2\u00b7log\u2082(7)', 'expand as typed'); eq(X('2', '36*5/7^2').primes, '2\u00b7log\u2082(2) + 2\u00b7log\u2082(3) + log\u2082(5) - 2\u00b7log\u2082(7)', 'expand to primes');
eq(X('2', '8').nothing, true, 'a plain number has nothing to expand as typed'); eq(X('3', '81/(2+7)').exact, '2', 'a sum is worked out first'); ok(X('3', '81/(2+7)').steps.some((s) => /no rule for the logarithm of a sum/.test(s)), 'sum explained');
eq(X('2', '1/8').typed, '-log\u2082(8)', 'quotient with numerator 1');
/* page */
const root = path.join(__dirname, '..'), pg = path.join(root, 'calculators', 'log-rules', 'index.html');
if (fs.existsSync(pg)) {
  const html = fs.readFileSync(pg, 'utf8');
  ['<h1>Logarithm Rules Calculator', 'id="nu-t"', 'id="nu-eb"', 'id="nu-ex"', 'id="nu-rule"', 'Mode 04', 'aria-current="page"', 'Log Calculator modes', 'href="../logarithm/"', 'href="../antilog-calculator/"', 'href="../log-solver/"', 'Engineering Logarithmic (coming)', 'role="tablist"'].forEach((s) => ok(html.indexOf(s) >= 0, 'page has ' + s));
  ok(/<title>[^<]{20,70}<\/title>/.test(html), 'title length'); ok(html.indexOf('Logarithm Rules (coming)') < 0, 'page does not call itself coming');
  for (const d of ['logarithm', 'antilog-calculator', 'log-solver']) { const h = fs.readFileSync(path.join(root, 'calculators', d, 'index.html'), 'utf8'); ok(h.indexOf('href="../log-rules/"') >= 0 && h.indexOf('Logarithm Rules (coming)') < 0, d + ' links to Mode 04'); }
}
console.log('log_rules_test: ' + n + ' checks, ' + fail + ' failures'); process.exit(fail ? 1 : 0);
