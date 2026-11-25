/* Tests for tools/exponent_engine.js (Exponent Calculator, Mode 01: Power Calculator) against tests/exponent_vectors.json
   (independent: gen_exponent_vectors.py, Python Fraction for exact results and Python decimal at 90 digits for approximations) and the cases in the CEO product decision.
   Also checks the built page. Run: node tests/exponent_test.js */
const fs = require('fs'), path = require('path');
const X = require('../tools/exponent_engine.js'), V = require('./exponent_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 25) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const ok = (c, m) => { n++; if (!c) bad(m); };
const R = (a, nn, sig) => X.run({ a: a, n: nn, sig: sig });

/* 1. independent vectors */
const tally = {};
for (const v of V) {
  const r = R(v.a, v.n, '15'), tag = v.tag + ' ' + v.a + '^' + v.n, o = v.out; tally[o.kind] = (tally[o.kind] || 0) + 1;
  if (o.kind === 'error') { ok(!r.ok && r.code === o.code, tag + ': expected error ' + o.code + ', got ' + (r.ok ? 'a result ' + X.valueText(r) : r.code)); continue; }
  if (!r.ok) { bad(tag + ' errored: ' + r.error); continue; }
  if (o.kind === 'exact') {
    ok(r.exact, tag + ' should be exact'); eq(r.rawSign, o.sign, tag + ' sign'); eq(r.exactN, o.n, tag + ' numerator'); eq(r.exactD, o.d, tag + ' denominator'); ok(r.check.ok, tag + ' built-in check');
    if (o.d === '1' && o.sign !== 0) eq(r.sol.digitCount, o.n.length, tag + ' digit count');
  } else {
    ok(!r.exact, tag + ' should be approximate'); eq(r.rawSign, o.sign, tag + ' sign');
    const coef = Math.abs(Number(r.sol.sciCoef.replace('\u2212', '-'))), keep = Math.min(15, r.sol.reliableDigits), have = r.sol.sciExp + Math.log10(coef), want = Number(o.x), ev = Number(r.exponent.p) / Number(r.exponent.q);
    const tol = 0.4343 * 5 * Math.pow(10, -keep) + 6e-15 + 1.5e-15 * Math.abs(ev) + 6e-16 * Math.abs(want);
    ok(Math.abs(have - want) <= tol, tag + ': log10|y| got ' + have + ', expected ' + want + ' (tolerance ' + tol + ')');
    ok(r.sol.reliableDigits >= 1 && r.sol.reliableDigits <= 15, tag + ' reliable digits');
    if (v.tag === 'huge') ok(r.how === 'huge' || Math.abs(want) < 300, tag + ' uses the logarithm route');
  }
}
ok(tally.exact > 300 && tally.approx > 200 && tally.error > 20, 'vector mix: ' + JSON.stringify(tally));

/* 2. the CEO brief's independent cases, exactly */
const brief = [['2', '10', '1,024'], ['2', '-3', '1/8'], ['5', '-2', '1/25'], ['8', '2/3', '4'], ['27', '2/3', '9'], ['16', '3/4', '8'], ['-2', '3', '−8'], ['-2', '4', '16'], ['-8', '1/3', '−2'], ['10', '-3', '1/1000']];
for (const [a, e, want] of brief) { const r = R(a, e); ok(r.ok && r.exact, a + '^' + e + ' exact'); eq((r.sol.fraction || (r.sol.sign < 0 ? '−' : '') + X.groupInt(r.sol.integerString)), want, a + '^' + e); }
eq(R('10', '-3').sol.standard, '0.001', '10^-3 as a decimal'); eq(R('2', '10').sol.integerString, '1024', '2^10 digits'); eq(R('2', '0').sol.integerString, '1', '2^0');
eq(R('2', '100').sol.integerString, '1267650600228229401496703205376', '2^100 digit for digit (BigInt, not floating point)');
eq(R('3', '200').sol.integerString, '265613988875874769338781322035779626829233452653394495974574961739092490901302182994384699044001', '3^200 digit for digit');
eq(R('7', '77').sol.digitCount, 66, '7^77 has 66 digits');

/* 3. rational exponents: fractions and decimals are the same exact exponent */
eq(R('27', '0.6666666666666666').ok && R('27', '0.6666666666666666').exact, false, '27^0.6666666666666666 is not exactly 9 (it is not 2/3)');
eq(R('4', '0.5').sol.integerString, '2', '4^0.5 is exactly 2'); eq(R('4', '1/2').sol.integerString, '2', '4^(1/2)'); eq(R('8', '0.3333333333333333').exact, false, '0.3333333333333333 is not 1/3');
eq(R('1/8', '1/3').sol.fraction, '1/2', '(1/8)^(1/3) = 1/2'); eq(R('0.125', '1/3').sol.fraction, '1/2', '0.125^(1/3) = 1/2'); eq(R('1/4', '-1/2').sol.integerString, '2', '(1/4)^(-1/2) = 2');
eq(R('-8', '2/6').sol.sign, -1, '(-8)^(2/6) reduces to 1/3 so it is real and negative'); eq(R('-8', '2/6').sol.integerString, '2', '(-8)^(1/3) magnitude 2');
eq(R('-8', '2/3').sol.integerString, '4', '(-8)^(2/3) = 4'); eq(R('-8', '2/3').sol.sign, 1, '(-8)^(2/3) positive'); eq(R('-32', '3/5').sol.integerString, '8', '(-32)^(3/5) magnitude 8'); eq(R('-32', '3/5').sol.sign, -1, '(-32)^(3/5) negative');
eq(R('-4', '0.5').ok, false, '(-4)^0.5 has no real value'); eq(R('-4', '0.5').code, 'NOT_REAL', 'code NOT_REAL'); ok(/odd denominator/.test(R('-4', '0.5').error), 'message explains the odd denominator'); eq(R('-8', '1/2').ok, false, '(-8)^(1/2)');
eq(R('-8', '2/4').ok, false, '(-8)^(2/4) reduces to 1/2: no real value'); eq(R('-2', '0.25').ok, false, '(-2)^0.25');

/* 4. zero, one, minus one, e */
eq(R('0', '0').code, 'ZERO_TO_ZERO', '0^0'); eq(R('0', '-1').code, 'ZERO_NEGATIVE', '0^-1'); eq(R('0', '-1/2').code, 'ZERO_NEGATIVE', '0^(-1/2)'); eq(R('0', '5').sol.standard, '0', '0^5'); eq(R('0', '1/2').exactN, '0', '0^(1/2)'); eq(R('0', '0.5').rawSign, 0, '0^0.5 sign');
eq(R('1', '1000000').exactN, '1', '1^1000000'); eq(R('-1', '1000001').rawSign, -1, '(-1)^odd'); eq(R('-1', '1000000').rawSign, 1, '(-1)^even'); eq(R('-1', '1/3').rawSign, -1, '(-1)^(1/3)'); eq(R('-1', '1/2').ok, false, '(-1)^(1/2)');
eq(R('5', '0').exactN, '1', '5^0'); eq(R('-5', '0').exactN, '1', '(-5)^0'); eq(R('0.001', '0').exactN, '1', '0.001^0');
const e1 = R('e', '1'); ok(!e1.exact && Math.abs(Number(e1.sol.sciCoef) - 2.71828) < 1e-5, 'e^1'); eq(R('e', '1', '15').sol.sciCoef, '2.71828182845905', 'e^1 to 15 digits (the double 2.718281828459045)'); eq(R('e', '0').exactN, '1', 'e^0'); eq(R('e', '-1').rawSign, 1, 'e^-1 positive');
eq(R('-e', '3').rawSign, -1, '(-e)^3 negative'); eq(R('-e', '1/2').ok, false, '(-e)^(1/2)'); eq(R('e', '1000').sol.sciExp, 434, 'e^1000 is about 1.97e434, beyond a double');

/* 5. large and tiny results */
const big = R('2', '1000000'); ok(!big.exact && big.how === 'huge', '2^1,000,000 uses the logarithm route'); eq(big.sol.digitCount, 301030, '2^1,000,000 has 301030 digits'); eq(big.sol.sciExp, 301029, 'exponent of ten'); ok(big.warnings.some((w) => w.code === 'HUGE'), 'huge warning');
const mid = R('2', '100000'); ok(mid.exact && mid.sol.digitCount === 30103, '2^100,000 is exact with 30103 digits'); eq(mid.exactN.slice(0, 12), '999002093014', '2^100000 leading digits');
const tiny = R('10', '-400'); eq(tiny.sol.fraction.slice(0, 3), '1/1', '10^-400 is exact'); eq(tiny.sol.sciText, '1 × 10⁻⁴⁰⁰', '10^-400 scientific notation'); eq(tiny.sol.standard, null, 'no 400-zero decimal on screen');
eq(R('2', '1e9').ok, true, 'exponent 1e9 is the limit'); eq(R('2', '1.5e9').ok, false, 'exponent above 1e9 is refused'); eq(R('2', '1.5e9').code, 'RANGE', 'RANGE code'); eq(R('1', '1e15').exactN, '1', '1^1e15 is trivial');
eq(R('1e10000', '1').ok, true, 'power of ten up to 10000 allowed'); eq(R('1e10001', '1').ok, false, 'power of ten beyond 10000 refused');

/* 6. input reading */
eq(R('1,000', '2').exactN, '1000000', 'thousands separator'); eq(R('1 000', '2').exactN, '1000000', 'space separator'); eq(R('−2', '3').rawSign, -1, 'Unicode minus'); eq(R('(-2)', '3').rawSign, -1, 'brackets'); eq(R('.5', '2').sol.fraction, '1/4', '.5 squared'); eq(R('+2', '3').exactN, '8', 'plus sign');
eq(R('1.5', '2').sol.fraction, '9/4', '1.5^2 = 9/4'); eq(R('1.5', '2').sol.standard, '2.25', '1.5^2 decimal'); eq(R('3/4', '2').sol.fraction, '9/16', '(3/4)^2'); eq(R('1e-3', '2').sol.fraction, '1/1000000', '1e-3 squared'); eq(R('2', '1e1').exactN, '1024', 'exponent 1e1');
eq(R('2', '3/1').exactN, '8', 'exponent 3/1'); eq(R('2', '6/3').exactN, '4', 'exponent 6/3 reduces to 2'); eq(R('2', '-6/-3').ok, false, 'a sign inside the denominator is refused');
['abc', '2..3', '1/0', '1/2/3', '--2', '1e', 'Infinity', 'NaN', '2^3'].forEach((t) => { const r = R(t, '2'); ok(!r.ok && r.field === 'a' && r.error, 'rejects base ' + t); const q = R('2', t); ok(!q.ok && q.field === 'n' && q.error, 'rejects exponent ' + t); });
ok(R('', '').empty === true && R('', '').ok === false, 'both empty'); ok(R('2', '').partial && /exponent/.test(R('2', '').error), 'exponent missing'); ok(R('', '2').partial && /base/.test(R('', '2').error), 'base missing'); ok(!R('2', 'e').ok, 'e is not allowed as an exponent');

/* 7. display precision and rounding */
eq(R('2', '0.5', '6').sol.sciCoef, '1.41421', '6 significant figures'); eq(R('2', '0.5', '10').sol.sciCoef, '1.414213562', '10 significant figures'); eq(R('2', '0.5', '15').sol.sciCoef, '1.4142135623731', '15 significant figures (trailing zero dropped)'); eq(R('2', '0.5', '4').sol.standard, '1.414', '4 significant figures');
eq(R('1', '1').sol.sciText, '1 × 10⁰', '1^1'); eq(R('9.99999999', '1', '4').sol.sciText, '1 × 10¹', 'rounding carries into the exponent'); eq(R('3', '-1', '6').sol.standard, '0.333333', '3^-1 to 6 figures'); ok(R('3', '-1', '6').warnings.some((w) => w.code === 'ROUNDED'), 'rounded warning'); eq(R('3', '-1', 'full').sol.fraction, '1/3', '3^-1 fraction');
eq(R('2', '-3', 'full').sol.standard, '0.125', 'full precision terminating decimal'); eq(R('2', '-10', 'full').sol.standard, '0.0009765625', '2^-10 exact decimal');
eq(R('2', '10').sol.eText, '1.024e+3', 'e-text'); eq(R('2', '-3').sol.eText, '1.25e-1', 'e-text negative'); eq(R('-2', '3').sol.eText, '-8e+0', 'e-text sign');
const p1 = R('2', '0.5', '15'); ok(p1.warnings.some((w) => w.code === 'APPROXIMATE'), 'approximate warning'); eq(p1.exact, false, '2^0.5 is not exact'); ok(R('4', '0.5').warnings.length === 0, 'exact result has no warnings');

/* 8. working and exports */
const st = R('2', '-3').steps; ok(st.length >= 4 && st[0].title === 'The problem' && st.some((s) => /Negative exponent/.test(s.title)) && st[st.length - 1].title === 'Result', 'steps for a negative exponent'); ok(/2 × 2 × 2 = 8/.test(st.map((s) => s.text).join('\n')), 'repeated multiplication shown');
ok(/Exact root/.test(R('27', '2/3').steps.map((s) => s.title).join()), 'exact root step'); ok(/cube root of 27 is exactly 3/.test(R('27', '2/3').steps.map((s) => s.text).join('\n')), 'cube root wording'); ok(/Sign of the result/.test(R('-8', '1/3').steps.map((s) => s.title).join()), 'sign step');
ok(/Zero exponent/.test(R('7', '0').steps.map((s) => s.title).join()), 'zero exponent step'); ok(/logarithm|log₁₀/.test(R('2', '1000000').steps.map((s) => s.text).join('\n')), 'huge result working');
R('2', '10').steps.concat(R('27', '2/3').steps, R('-8', '1/3').steps, R('0.1', '-3').steps).forEach((s) => ok(s.title && s.text && !/undefined|NaN|\[object/.test(s.text), 'step is clean: ' + s.title));
const r10 = R('2', '10'), tx = X.exportTxt(r10); ok(/Expression: 2\^10/.test(tx) && /Result: 1,024/.test(tx) && /Scientific notation: 1\.024 × 10³/.test(tx) && /WORKING/.test(tx), 'txt content');
eq(X.exportCsv(r10).split('\n')[3], 'Result,1024', 'csv result row'); const js = JSON.parse(X.exportJson(r10)); eq(js.result.integer, '1024', 'json integer'); eq(js.exact, true, 'json exact'); eq(js.result.scientific, '1.024e+3', 'json scientific');
ok(/≈/.test(X.headline(R('2', '0.5'))) && !/= ≈/.test(X.headline(R('2', '0.5'))), 'headline uses one relation sign');

/* 9. the built page */
const base = path.join(__dirname, '..', 'calculators'), page = path.join(base, 'exponent-calculator', 'index.html');
if (fs.existsSync(page)) {
  const html = fs.readFileSync(page, 'utf8');
  eq((html.match(/<h1[ >]/g) || []).length, 1, 'page has one h1'); ok(!/<script[^>]+src="https?:/i.test(html), 'no external scripts'); ok(!/<link[^>]+href="https?:/i.test(html), 'no external stylesheets or fonts');
  ok(html.indexOf('Elecmetric Exponent Calculator, Mode 01') > 0 && html.indexOf('ExponentCalc') > 0, 'engine and script are inlined');
  ['a', 'n', 'sig', 'err', 'out', 'steps', 'hist', 'hclear', 'dl', 'note'].forEach((k) => ok(new RegExp('id="ex-' + k + '"').test(html), 'element ex-' + k));
  ok(/<title>Exponent Calculator/.test(html), 'title'); ok(/aria-current="page"[^>]*>Mode 01/.test(html), 'mode strip marks Mode 01 current'); ok(/href="\.\.\/negative-fractional-exponents-calculator\/"[^>]*>Mode 02/.test(html) && /href="\.\.\/exponent-solver\/"[^>]*>Mode 03/.test(html) && /href="\.\.\/exponent-laws-calculator\/"[^>]*>Mode 04/.test(html) && /href="\.\.\/engineering-powers-scientific-notation\/"[^>]*>Mode 05/.test(html), 'Modes 02 to 05 are linked; no mode is shown as coming');
  ['powers-roots', 'logarithm', 'scientific-calculator', 'half-life-calculator', 'engineering-exponential-decay-calculator', 'rc-time-constant', 'rc-rl-transient', 'fraction-arithmetic', 'engineering-mathematics'].forEach((d) => ok(fs.existsSync(path.join(base, d, 'index.html')) && html.indexOf('href="../' + d + '/"') > 0, 'related page ' + d + ' exists and is linked'));
  ['scientific-notation-converter', 'si-prefix-converter'].forEach((d) => ok(fs.existsSync(path.join(__dirname, '..', 'converters', d + '.html')) && html.indexOf(d + '.html') > 0, 'converter ' + d));
  const mm = html.match(/data-ex="[^"]*"/g) || []; ok(mm.length >= 12, 'example chips present');
  mm.forEach((c) => { const d = JSON.parse(c.slice(9, -1).replace(/&quot;/g, '"').replace(/&amp;/g, '&')); const r = X.run({ a: d.a, n: d.n }); ok(r.ok || r.code === 'NOT_REAL' || r.code === 'ZERO_TO_ZERO', 'chip example is valid or an intended refusal: ' + c.slice(0, 60)); });
  ok((html.match(/<h3>/g) || []).length >= 12, 'twelve questions'); ['examples', 'formulas', 'signs', 'rules', 'faq', 'related'].forEach((s) => ok(new RegExp('id="' + s + '"').test(html), 'section ' + s));
  ok(/data-dl="txt"/.test(html) && /data-dl="csv"/.test(html) && /data-dl="json"/.test(html) && /data-key="\/"/.test(html), 'downloads and keypad');
  ['sw.js', 'sitemap.xml'].forEach((f) => ok(fs.readFileSync(path.join(__dirname, '..', f), 'utf8').indexOf('exponent-calculator') > 0, f + ' lists the page'));
} else console.log('(page not built yet: skipping page checks)');

console.log(n + ' checks, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
