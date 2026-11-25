/* Tests for tools/log_solver_engine.js (Log Calculator, Mode 03, Missing Value Solver) against tests/log_solver_vectors.json (independent: gen_log_solver_vectors.py, mpmath 110-digit exp and log, sympy integer_nthroot and Rational powers),
   the CEO note's three examples, the classification (unique, none, indeterminate), agreement with the Mode 01 and Mode 02 engines and their vectors, input handling, limits and the built page. */
const S = require('../tools/log_solver_engine.js'), L = require('../tools/log_engine.js'), A = require('../tools/antilog_engine.js'), V = require('./log_solver_vectors.json'), LV = require('./log_vectors.json'), AV = require('./antilog_vectors.json'), fs = require('fs'), path = require('path');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 25) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const ok = (c, m) => { n++; if (!c) bad(m); };
function agree(d1, E1, d2, E2) {
  const Em = Math.min(E1, E2); if (Math.max(E1, E2) - Em > 1) return false;
  const v1 = BigInt(d1.padEnd(30, '0')) * 10n ** BigInt(E1 - Em), v2 = BigInt(d2.padEnd(30, '0')) * 10n ** BigInt(E2 - Em), d = v1 > v2 ? v1 - v2 : v2 - v1;
  return d <= 2n;
}
const sciParts = (sci) => { const m = /^([0-9.]+)(?: \u00d7 10\^(-?\d+))?$/.exec(sci); const d = m[1].replace('.', ''); return [d, m[2] ? +m[2] : 0]; };

/* solving for the base against the independent vectors */
let exactCount = 0;
for (const [xt, yt, cls, ex, d30, E] of V.ok.concat(V.text)) {
  const t = '[x=' + xt + ', y=' + yt + ']', r = S.run({ b: '', x: xt, y: yt, sig: 30 });
  if (!r.ok) { bad(t + ' rejected: ' + r.error); continue; }
  eq(r.find, 'b', 'find ' + t); eq(r.cls, 'unique', 'class ' + t);
  if (ex === null) ok(r.status === 'irrational', 'status ' + t + ': ' + r.status + ' (expected irrational)');
  else if (ex === 'long') ok(r.status === 'rational' || r.status === 'rational-large', 'status long ' + t);
  else { eq(r.status, 'rational', 'status ' + t); eq(r.exact, ex, 'exact ' + t); exactCount++; }
  if (ex === null) eq(r.exact, null, 'no exact text for an irrational base ' + t);
  const [d, e] = sciParts(r.sci); ok(agree(d.slice(0, 30), r.dec.E, d30, E) || agree(d.padEnd(30, '0'), r.dec.E, d30, E), 'value ' + t + ': ' + r.sci + ' vs ' + d30 + ' E' + E);
  eq(r.verifyOk, true, 'checks ' + t); ok(r.verify.length >= 1, 'at least one check ' + t);
  ok(Array.isArray(r.steps) && r.steps.length >= 4 && r.steps.every((s) => typeof s === 'string' && s.length > 8), 'working ' + t);
}
ok(exactCount > 100, 'exact bases covered: ' + exactCount);
for (const e of V.err.x) { const r = S.run({ b: '', x: e, y: '2' }); eq(r.ok, false, 'must reject x [' + e + ']'); ok(typeof r.error === 'string' && r.error.length > 5, 'message x [' + e + ']'); }
for (const e of V.err.y) { const r = S.run({ b: '', x: '9', y: e }); eq(r.ok, false, 'must reject y [' + e + ']'); ok(typeof r.error === 'string' && r.error.length > 5, 'message y [' + e + ']'); }
for (const e of V.err.b) { const r = S.run({ b: e, x: '9', y: '' }); eq(r.ok, false, 'must reject b [' + e + ']'); ok(typeof r.error === 'string' && r.error.length > 5, 'message b [' + e + ']'); }

/* the CEO note */
const R = (b, x, y, sig) => S.run({ b, x, y, sig });
eq(R('2', '64', '').find, 'y', 'Example A solves y'); eq(R('2', '64', '').exact, '6', 'Example A: log2(64) = 6'); eq(R('2', '64', '').headline, 'y = 6', 'Example A headline');
eq(R('10', '', '3').find, 'x', 'Example B solves x'); eq(R('10', '', '3').exact, '1000', 'Example B: x = 10^3 = 1000'); eq(R('10', '', '3').headline, 'x = 1000', 'Example B headline');
eq(R('', '125', '3').find, 'b', 'Example C solves b'); eq(R('', '125', '3').exact, '5', 'Example C: b = 5'); eq(R('', '125', '3').headline, 'b = 5', 'Example C headline'); eq(R('', '125', '3').expEq, '5^3 = 125', 'Example C exponential form');
eq(R('2', '64', '').status, 'rational', 'exact y'); eq(R('e', '', '2').find, 'x', 'base e, solve x'); eq(R('e', '', '2').plain, '7.389056099', 'e^2'); eq(R('e', '8', '').find, 'y', 'base e, solve y');
eq(R('0.5', '8', '').exact, '-3', 'base below 1: log0.5(8) = -3'); eq(R('', '8', '-3').exact, '1/2', 'base below 1 found from x and y'); eq(R('', '8', '-3').headline, 'b = 1/2 = 0.5', 'headline for a fraction');
eq(R('', '9', '2').exact, '3', 'x=9, y=2: only the positive base 3'); ok(R('', '9', '2').steps.some((s) => /negative root is excluded/.test(s)), 'negative root explained for an even whole y');
eq(R('', '27', '3').steps.some((s) => /negative root/.test(s)), false, 'no negative-root note for an odd y'); eq(R('', '2', '1/2').exact, '4', 'x = 2, y = 1/2: b = 4'); eq(R('', '10', '1/2').exact, '100', 'x = 10, y = 1/2: b = 100');
eq(R('', '1/8', '-3').exact, '2', 'negative y, x below 1'); eq(R('', '8/27', '3').exact, '2/3', 'fraction base'); eq(R('', '1000', '-3').exact, '1/10', 'x = 1000, y = -3: b = 1/10');
eq(R('', 'e', '1').exact, 'e', 'log_b(e) = 1 gives b = e'); eq(R('', 'e', '1').headline, 'b = e', 'headline b = e'); eq(R('', 'e', '2').status, 'irrational', 'log_b(e) = 2: b = sqrt(e), irrational'); eq(R('', 'e', '2').plain, '1.648721271', 'sqrt e');
eq(R('', '2', '3').radical, '\u221b2', 'radical: cube root of 2'); eq(R('', '3', '2/3').radical, '3\u221a3', 'radical: 3 sqrt 3'); eq(R('', '4', '2').radical, null, 'no radical when exact');
eq(R('', '2', '1/1000000').status, 'rational-large', 'a huge exact base is not printed in full'); eq(R('', '2', '1/1000000').sci, '9.900656229 \u00d7 10^301029', '2^1000000');

/* classification: unique, none, indeterminate */
eq(R('', '1', '0').cls, 'indeterminate', 'log_b(1) = 0 for every base'); eq(R('', '5', '0').cls, 'none', 'log_b(5) = 0 has no base'); eq(R('', '1', '5').cls, 'none', 'log_b(1) = 5 has no valid base');
eq(R('', '1', '-1/2').cls, 'none', 'log_b(1) = -1/2 has no valid base'); ok(/cannot be a logarithm base/.test(R('', '1', '5').note), 'explains that b = 1 is excluded'); ok(R('', '1', '0').ok === true && R('', '1', '0').exact === null, 'no value for an indeterminate base');
eq(R('3', '1', '').exact, '0', 'log_3(1) = 0 is a unique y'); eq(R('3', '3', '').exact, '1', 'log_b(b) = 1'); eq(R('', '3', '1').exact, '3', 'log_b(3) = 1 gives b = 3'); eq(R('7', '', '0').exact, '1', 'any^0 = 1');

/* agreement with the Mode 01 and Mode 02 engines on their own vectors */
let c1 = 0;
for (const [b, x, st, ex] of LV.ok) { const a = S.run({ b, x, y: '', sig: 15 }), l = L.calc({ b, x, dp: 15 }); if (!a.ok || !l.ok) { bad('Mode 01 row ' + b + ',' + x); continue; } c1++; eq(a.headline, 'y = ' + l.yText, 'solver equals Mode 01 for ' + b + ',' + x); eq(a.status, l.status, 'status equals Mode 01 for ' + b + ',' + x); }
let c2 = 0;
for (const [b, y] of AV.ok.slice(0, 160)) { const a = S.run({ b, x: '', y, sig: 15 }), m = A.calc({ b, y, sig: 15 }); if (!a.ok || !m.ok) { bad('Mode 02 row ' + b + ',' + y); continue; } c2++; eq(a.sci, m.sci, 'solver equals Mode 02 for ' + b + ',' + y); eq(a.status, m.status, 'status equals Mode 02 for ' + b + ',' + y); }
ok(c1 > 150 && c2 === 160, 'agreement covered ' + c1 + ' and ' + c2 + ' rows');

/* round trip: solve b, then solve y with the b found, and x with b and y */
let rt = 0;
for (const [xt, yt, cls, ex] of V.ok) {
  if (ex === null || ex === 'long') continue;
  const rb = S.run({ b: '', x: xt, y: yt }), ry = S.run({ b: ex, x: xt, y: '' }); if (!ry.ok) { bad('round trip y ' + ex + ',' + xt); continue; }
  rt++; const yq = L.calc({ b: ex, x: xt, dp: 15 }); eq(yq.exact !== null ? yq.exact : yq.y.text, yt.indexOf('/') > 0 || /^-?\d+$/.test(yt) ? yt : yq.y.text, 'round trip log_b(x) = y for b=' + ex + ', x=' + xt);
  const rx = S.run({ b: ex, x: '', y: yt }); if (rx.ok) { rt++; ok(rx.exact === null || rx.exact === xt || rx.exact === L.calc({ b: '1', x: '1' }).exact || /^[0-9/]+$/.test(rx.exact), 'round trip x ' + ex + ',' + yt); }
}
ok(rt > 150, 'round trip covered ' + rt);

/* all three given: does the equation hold? */
eq(R('2', '8', '3').cls, 'check', 'three values: check'); eq(R('2', '8', '3').holds, true, '2^3 = 8 holds'); eq(R('2', '8', '4').holds, false, '2^4 = 8 does not hold'); eq(R('10', '1000', '3').holds, true, 'log10(1000) = 3'); eq(R('10', '100', '2.5').holds, false, 'log10(100) is not 2.5');
eq(R('4', '8', '3/2').holds, true, 'log4(8) = 3/2'); eq(R('4', '8', '1.5').holds, true, 'decimal y 1.5'); eq(R('2', '3', '1.5849625').holds, false, 'a rounded decimal of an irrational log does not hold exactly'); eq(R('e', 'e', '1').holds, true, 'ln e = 1'); eq(R('2', '1', '0').holds, true, 'log2(1) = 0');
eq(R('2', '8', '3').eq, 'log\u2082(8) = 3', 'true equation text'); ok(/is false/.test(R('2', '8', '4').headline), 'false headline'); eq(R('2', '8', '4').expEq, '', 'no exponential form for a false equation'); ok(R('2', '8', '4').rows.some((r) => r[0] === 'Actual log_b(x)' && r[1] === '3'), 'shows the actual logarithm');

/* input handling */
eq(R('', '', '').empty, true, 'all blank is an empty page'); eq(R('2', '', '').ok, false, 'one value is not enough'); eq(R('2', '', '').needMore, true, 'asks for a second value'); eq(R('', '', '3').needMore, true, 'asks for a second value (y only)');
eq(R(' 2 ', ' 64 ', '').exact, '6', 'spaces'); eq(R('2', '', '\u22123').exact, '1/8', 'unicode minus'); eq(R('E', '', '1').status, 'irrational', 'capital E as the base'); eq(R('', '1,000', '3').exact, '10', 'comma ignored'); eq(R('', '2 1/4', '2').exact, '3/2', 'mixed number x'); eq(R('', '0.125', '-3').exact, '2', 'decimal x');
eq(R('10', '', 'e').error, 'The logarithm y must be a number. Only the base b and the argument x can be e.', 'y = e is refused with a reason'); eq(R('1', '8', '').errors.b.indexOf('base 1') > 0, true, 'base 1 message'); eq(R('0', '8', '').errors.b, 'The base must be greater than zero.', 'base 0');
eq(R('2', '0', '').errors.x, 'Undefined: the logarithm of zero does not exist for any base.', 'x = 0'); ok(/not a real number/.test(R('2', '-8', '').errors.x), 'x negative'); eq(R('1', '8', '3').ok, false, 'base 1 is refused even when all three are given');
eq(R('', '2', '3', 5).plain, '1.2599', 'five significant digits'); eq(R('', '2', '3', 99).sig, 30, 'significant digits clamp high'); eq(R('', '2', '3', 1).sig, 3, 'significant digits clamp low');
eq(R('', '10', '1e-8').ok, true, 'tiny y gives a huge base'); ok(/Out of range/.test(R('', '10', '1e-10').error), 'a base beyond 10^(10^9) is refused (1e-10)'); ok(/Out of range/.test(R('', '10', '1e-12').error), 'a base beyond 10^(10^9) is refused'); eq(R('', '1e300', '1e-3').ok, true, 'large x'); eq(R('', '1/1e300', '3').ok, true, 'tiny x with y = 3');
eq(S.run({ b: '', x: '5', y: '1/0' }).ok, false, 'fraction with zero denominator');

/* the page */
const pg = path.join(__dirname, '..', 'calculators', 'log-solver', 'index.html');
if (fs.existsSync(pg)) {
  const html = fs.readFileSync(pg, 'utf8');
  ['<h1>Log Solver', 'id="nu-b"', 'id="nu-x"', 'id="nu-y"', 'Mode 03', 'aria-current="page"', 'Log Calculator modes', 'href="../logarithm/"', 'href="../antilog-calculator/"', 'href="../log-rules/"', 'Engineering Logarithmic (coming)'].forEach((s) => ok(html.indexOf(s) >= 0, 'page has ' + s));
  ok(/<title>[^<]{20,70}<\/title>/.test(html), 'title length'); ok(html.indexOf('Missing Value Solver (coming)') < 0, 'page does not call itself coming');
  const m1 = fs.readFileSync(path.join(__dirname, '..', 'calculators', 'logarithm', 'index.html'), 'utf8'), m2 = fs.readFileSync(path.join(__dirname, '..', 'calculators', 'antilog-calculator', 'index.html'), 'utf8');
  ok(m1.indexOf('href="../log-solver/"') >= 0 && m2.indexOf('href="../log-solver/"') >= 0, 'Modes 01 and 02 link to Mode 03'); ok(m1.indexOf('Missing Value Solver (coming)') < 0 && m2.indexOf('Missing Value Solver (coming)') < 0, 'Modes 01 and 02 no longer show Mode 03 as coming');
}
console.log('log_solver_test: ' + n + ' checks, ' + fail + ' failures'); process.exit(fail ? 1 : 0);
