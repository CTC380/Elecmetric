/* Tests for tools/antilog_engine.js (Log Calculator, Mode 02, Antilog) against tests/antilog_vectors.json (independent: gen_antilog_vectors.py, mpmath 110-digit exp and log, sympy integer_nthroot and Rational powers)
   plus the CEO note's cases, a round trip against the Mode 01 engine (tests/log_vectors.json), input handling, limits and the built page. */
const A = require('../tools/antilog_engine.js'), L = require('../tools/log_engine.js'), V = require('./antilog_vectors.json'), LV = require('./log_vectors.json'), fs = require('fs'), path = require('path');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 25) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const ok = (c, m) => { n++; if (!c) bad(m); };
/* two (digits, exponent) values agree to 2 units in the 30th digit; the exponents may differ by one at a 9.99.. / 1.00.. boundary */
function agree(d1, E1, d2, E2) {
  const Em = Math.min(E1, E2); if (Math.max(E1, E2) - Em > 1) return false;
  const v1 = BigInt(d1.padEnd(30, '0')) * 10n ** BigInt(E1 - Em), v2 = BigInt(d2.padEnd(30, '0')) * 10n ** BigInt(E2 - Em), d = v1 > v2 ? v1 - v2 : v2 - v1;
  return d <= 2n;
}
for (const [b, y, st, ex, d30, E] of V.ok) {
  const t = '[' + b + ', ' + y + ']', r = A.calc({ b, y, sig: 30 });
  if (!r.ok) { bad(t + ' rejected: ' + r.error); continue; }
  if (st === 'rational') { ok(r.status === 'rational' || r.status === 'rational-large', 'status ' + t + ': ' + r.status + ' (expected rational)'); }
  else eq(r.status, 'irrational', 'status ' + t);
  if (st === 'rational' && r.status === 'rational') {
    if (ex === 'long' || ex.length > 120) eq(r.exact, null, 'long exact text hidden ' + t); else eq(r.exact, ex, 'exact ' + t);
  } else eq(r.exact, null, 'no exact text for an irrational result ' + t);
  ok(agree(r.dec.d.slice(0, 30), r.E, d30, E), 'value ' + t + ': ' + r.dec.d + ' E' + r.E + ' vs ' + d30 + ' E' + E);
  eq(r.verifyOk, true, 'checks ' + t); ok(r.verify.length >= 1, 'at least one check ' + t);
  ok(Array.isArray(r.steps) && r.steps.length >= 4 && r.steps.every((s) => typeof s === 'string' && s.length > 8), 'working ' + t);
  ok(/10\^/.test(r.sci), 'scientific notation ' + t + ': ' + r.sci);
}
for (const [b, y, st, ex, d30, E] of V.big) { const r = A.calc({ b, y, sig: 30 }); eq(r.status, 'rational-large', 'rational too long to print ' + b + ',' + y); ok(agree(r.dec.d, r.E, d30, E), 'big value'); eq(r.exact, null, 'big exact hidden'); }
for (const e of V.err.b) { const r = A.calc({ b: e, y: '3' }); eq(r.ok, false, 'must reject base [' + e + ']'); ok(typeof r.error === 'string' && r.error.length > 5, 'message base [' + e + ']'); }
for (const e of V.err.y) { const r = A.calc({ b: '10', y: e }); eq(r.ok, false, 'must reject y [' + e + ']'); ok(typeof r.error === 'string' && r.error.length > 5, 'message y [' + e + ']'); }

// the CEO note, by exact text
const C = (b, y, sig) => A.calc({ b, y, sig });
[['10', '3', '1000'], ['2', '5', '32'], ['3', '4', '81']].forEach(([b, y, x]) => eq(C(b, y).exact, x, 'CEO antilog ' + b + ',' + y));
eq(C('e', '2').plain, '7.389056099', 'CEO antilog base e (2) is 7.389'); eq(C('e', '2', 4).plain, '7.389', 'CEO 7.389 at 4 significant digits'); eq(C('e', '2').status, 'irrational', 'e^2 irrational');
eq(C('10', '3').equation, 'antilog(3) = 1000', 'equation text base 10'); eq(C('2', '5').equation, 'antilog\u2082(5) = 32', 'equation text base 2'); eq(C('e', '2').equation, 'exp(2) \u2248 7.389056099', 'equation text base e');
eq(C('10', '-2').exact, '1/100', 'negative exponent exact'); eq(C('10', '-2').plain, '0.01', 'negative exponent decimal'); eq(C('2', '-3').plain, '0.125', '2^-3');
eq(C('4', '1/2').exact, '2', 'fractional exponent: square root of 4'); eq(C('8', '2/3').exact, '4', '8^(2/3)'); eq(C('27', '-2/3').exact, '1/9', '27^(-2/3)'); eq(C('4', '-3/2').exact, '1/8', '4^(-3/2)');
eq(C('0.5', '3').exact, '1/8', 'base below 1'); eq(C('0.5', '-3').exact, '8', 'base below 1, negative y');
eq(C('10', '0').exact, '1', 'anything^0 = 1'); eq(C('e', '0').exact, '1', 'e^0 = 1'); eq(C('1/4', '1/2').exact, '1/2', 'fraction base root');
eq(C('1', '5').errors.b.indexOf('base 1') > 0, true, 'base 1 message'); eq(C('0', '5').errors.b, 'The base must be greater than zero.', 'base 0'); eq(C('-2', '5').ok, false, 'negative base');
eq(C('10', 'e').error, 'The logarithm y must be a number. Only the base can be e.', 'y = e is refused with a reason');
// radical form and characteristic / mantissa
eq(C('2', '1/2').radical, '\u221a2', 'radical sqrt 2'); eq(C('2', '3/2').radical, '2\u221a2', 'radical 2 sqrt 2'); eq(C('2', '1/3').radical, '\u221b2', 'cube root of 2'); eq(C('2', '2/3').radical, '\u221b4', '2^(2/3)');
eq(C('4', '1/2').radical, null, 'no radical when exact'); eq(C('e', '1/2').radical, null, 'no radical for base e');
const cm = C('10', '2.8451').cm; eq(cm.c, '2', 'characteristic'); eq(cm.m, '0.8451', 'mantissa'); eq(C('10', '-2.5').cm.c, '-3', 'negative characteristic'); eq(C('10', '-2.5').cm.m, '0.5', 'negative log mantissa'); eq(C('2', '3').cm, null, 'no characteristic for base 2');
eq(C('10', '2.8451').plain, '700.0031591', 'antilog of 2.8451');
// extremes
eq(C('10', '300').sci, '1 \u00d7 10^300', '10^300'); eq(C('10', '-300').sci, '1 \u00d7 10^-300', '10^-300'); eq(C('10', '300').status, 'rational', '10^300 exact'); eq(C('10', '300').plain, null, '10^300 has no plain form');
eq(C('10', '1000000000').E, 1000000000, '10^(10^9) is the largest size'); eq(C('10', '10000000000').ok, false, 'beyond 10^(10^9) is refused'); ok(/Out of range/.test(C('10', '10000000000').error), 'out of range message');
eq(C('10', '1e9').status, 'rational-large', 'huge exact result is not printed in full'); eq(C('2', '100').exact, '1267650600228229401496703205376', '2^100 exact');
// input handling
eq(C(' 2 ', ' 5 ').exact, '32', 'spaces'); eq(C('2', '\u22123').exact, '1/8', 'unicode minus'); eq(C('E', '1').status, 'irrational', 'capital E as the base'); eq(C('10', '1,000').E, 1000, 'comma ignored'); eq(C('4', '1 1/2').exact, '8', 'mixed number y'); eq(C('4', '3/2').exact, '8', 'fraction y');
eq(C('10', '').empty, false, 'empty y alone is an error, not an empty page'); eq(C('', '').empty, true, 'both empty'); eq(C('2', '5', 1).sig, 3, 'significant digits clamp low'); eq(C('2', '5', 99).sig, 30, 'significant digits clamp high');
eq(C('2', '1/3', 5).plain, '1.2599', '5 significant digits'); eq(C('2', '-1/3', 5).plain, '0.7937', 'below 1: five significant digits, trailing zero dropped'); eq(C('e', '40').sci, '2.353852668 \u00d7 10^17', 'e^40 scientific'); eq(C('e', '40').plain, null, 'e^40 beyond plain range');
// integer root
eq(A.iroot(2n ** 100n, 100n), 2n, 'iroot exact'); eq(A.iroot(2n ** 100n + 1n, 100n), null, 'iroot inexact'); eq(A.iroot(10n, 10000n), null, 'iroot index above bit length'); eq(A.iroot(1n, 12345n), 1n, 'iroot of 1'); eq(A.iroot(3n ** 7n, 7n), 3n, 'iroot 3^7');
// round trip with the Mode 01 engine: antilog_b(log_b(x)) = x
let rt = 0;
for (const [b, x, st, ex, y15] of LV.ok) {
  if (st === 'rational') {
    const r = A.calc({ b, y: ex, sig: 15 }); if (!r.ok) { bad('round trip rejected ' + b + ',' + x + ',' + ex + ': ' + r.error); continue; }
    rt++; const xs = x.indexOf('e') >= 0 ? null : x;
    if (xs !== null && r.exact !== null && /^[0-9/]+$/.test(xs)) eq(r.exact, xs, 'round trip exact b=' + b + ' y=' + ex);
    ok(r.verifyOk, 'round trip checks b=' + b + ' y=' + ex);
  } else {
    const r = A.calc({ b, y: y15, sig: 15 }); if (!r.ok) { bad('round trip (decimal y) rejected ' + b + ',' + x + ': ' + r.error); continue; }
    const xv = x.indexOf('/') > 0 ? Number(x.split('/')[0]) / Number(x.split('/')[1]) : Number(x), gv = parseFloat(r.sci.replace(/ \u00d7 10\^/, 'e'));
    if (isFinite(xv) && xv > 1e-300 && xv < 1e300 && isFinite(gv)) { rt++; ok(Math.abs(gv - xv) <= 3e-13 * Math.abs(xv) * Math.max(1, Math.abs(Number(y15))), 'round trip value b=' + b + ' x=' + x + ': ' + gv + ' vs ' + xv); }
  }
}
ok(rt > 150, 'round trip covered ' + rt + ' pairs');
// the reverse check really uses Mode 01: a wrong exact answer is caught
const r1 = A.calc({ b: '2', y: '5' }); ok(r1.verify.some((v) => /Mode 01/.test(v.text) && v.ok), 'Mode 01 check present'); ok(L.calc({ b: '2', x: '32' }).exact === '5', 'Mode 01 agrees');
// the page
const html = fs.readFileSync(path.join(__dirname, '..', 'calculators', 'antilog-calculator', 'index.html'), 'utf8');
['<h1>Antilog Calculator</h1>', 'id="nu-b"', 'id="nu-y"', 'data-base="10"', 'data-base="e"', 'data-base="2"', 'Mode 02', 'Mode 01', 'aria-current="page"', 'Log Calculator modes', 'href="../log-rules/"'].forEach((s) => ok(html.indexOf(s) >= 0, 'page has ' + s));
ok(html.indexOf('../logarithm/') >= 0, 'page links to Mode 01'); ok(/<title>[^<]{20,70}<\/title>/.test(html), 'title length'); ok(html.indexOf('Antilog Calculator (coming)') < 0, 'page does not call itself coming');
const m1 = fs.readFileSync(path.join(__dirname, '..', 'calculators', 'logarithm', 'index.html'), 'utf8');
ok(m1.indexOf('href="../antilog-calculator/"') >= 0, 'Mode 01 page links to Mode 02'); ok(m1.indexOf('Antilog Calculator (coming)') < 0, 'Mode 01 page no longer shows Mode 02 as coming');
console.log('antilog_test: ' + n + ' checks, ' + fail + ' failures'); process.exit(fail ? 1 : 0);
