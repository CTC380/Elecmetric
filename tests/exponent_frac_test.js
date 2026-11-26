/* Tests for tools/exponent_frac_engine.js (Exponent Calculator, Mode 02: Negative & Fractional Exponents) against tests/exponent_frac_vectors.json
   (independent: gen_exponent_frac_vectors.py, sympy.factorint, Python Fraction, mpmath at 90 digits; the radical form is verified there by value, by
   index/radicand uniqueness rules and by a different route: least common multiple of the denominators). Also checks the built page. Run: node tests/exponent_frac_test.js */
const fs = require('fs'), path = require('path');
const F = require('../tools/exponent_frac_engine.js'), X = require('../tools/exponent_engine.js'), V = require('./exponent_frac_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 25) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const ok = (c, m) => { n++; if (!c) bad(m); };
const R = (a, nn, sig) => F.run({ a: a, n: nn, sig: sig || '10' });
const rad = (a, nn) => { const r = R(a, nn); return r.ok && r.radical && !r.radical.exactRoot ? r.radical.text : null; };

/* 1. independent vectors */
const tally = {};
for (const v of V) {
  const r = R(v.a, v.n, '15'), tag = v.a + '^' + v.n, o = v.out; tally[o.kind] = (tally[o.kind] || 0) + 1;
  if (o.kind === 'error') { ok(!r.ok && r.code === o.code, tag + ': expected ' + o.code); continue; }
  if (!r.ok) { bad(tag + ' errored: ' + r.error); continue; }
  eq(r.rawSign, o.sign, tag + ' sign');
  if (o.kind === 'exact') {
    ok(r.exact, tag + ' should be exact'); eq(r.exactN, o.coefN, tag + ' numerator'); eq(r.exactD, o.coefD, tag + ' denominator');
    ok(r.radical ? r.radical.exactRoot : r.exponent.q === 1n, tag + ' radical reports an exact root (or the exponent reduces to a whole number)'); ok(r.check.ok, tag + ' check');
  } else {
    ok(!r.exact, tag + ' should be approximate'); ok(r.radical && !r.radical.exactRoot, tag + ' has a radical form');
    eq(r.radical.coefN, o.coefN, tag + ' coefficient numerator'); eq(r.radical.coefD, o.coefD, tag + ' coefficient denominator'); eq(r.radical.radicand, o.R, tag + ' radicand'); eq(r.radical.index, o.idx, tag + ' index');
    const coef = Math.abs(Number(r.sol.sciCoef.replace('\u2212', '-'))), have = r.sol.sciExp + Math.log10(coef), want = Number(o.log10), keep = Math.min(15, r.sol.reliableDigits);
    ok(Math.abs(have - want) <= 0.4343 * 5 * Math.pow(10, -keep) + 1e-13 + 1.5e-15 * Math.abs(want), tag + ': log10|y| got ' + have + ', expected ' + want); ok(r.check.ok, tag + ' radical check');
    ok(r.radical.text.length > 0 && !/undefined|NaN/.test(r.radical.text), tag + ' radical text');
  }
}
ok(tally.exact > 150 && tally.radical > 250 && tally.error >= 10, 'vector mix: ' + JSON.stringify(tally));

/* 2. the textbook radical forms, written out */
const forms = [['12', '1/2', '2√3'], ['2', '-3/2', '√2 / 4'], ['2', '2/3', '∛4'], ['2/3', '1/2', '√6 / 3'], ['2', '7/3', '4∛2'], ['4', '6/9', '2∛2'], ['10', '-1/2', '√(10) / 10'], ['72', '5/4', '72∜(72)'],
  ['5', '0.75', '∜(125)'], ['50', '1/2', '5√2'], ['18', '3/2', '54√2'], ['-2', '1/3', '−∛2'], ['2', '1/2', '√2'], ['3', '-1/2', '√3 / 3'], ['8', '1/2', '2√2'], ['1/2', '1/2', '√2 / 2'], ['2', '5/2', '4√2'], ['2', '0.2', '⁵√2'], ['2', '1/6', '⁶√2'],
  ['4', '1/6', '∛2'], ['8', '1/6', '√2'], ['2', '-1/3', '∛4 / 2'], ['-12', '1/3', '−∛(12)']];
for (const [a, e, want] of forms) eq(rad(a, e), want, a + '^' + e + ' radical form');
eq(R('27', '2/3').radical.exactRoot, true, '27^(2/3) exact'); eq(F.valueText(R('27', '2/3')), '9', '27^(2/3) = 9'); eq(F.valueText(R('8', '-2/3')), '1/4 = 0.25', '8^(-2/3)');
eq(R('2', '5').radical, null, 'whole exponent: no radical'); eq(R('e', '1/2').radical, null, 'e: no radical');
const idxDown = R('4', '6/9'); ok(idxDown.steps.some((s) => /Outside and inside/.test(s.title)), 'steps for 4^(6/9)'); eq(R('4', '1/6').radical.index, 3, '4^(1/6) is a cube root');
eq(R('4', '6/9').exponent.p, 2n, 'exponent 6/9 reduced numerator'); eq(R('4', '6/9').exponent.q, 3n, 'exponent 6/9 reduced denominator'); eq(R('5', '0.75').exponent.q, 4n, 'exponent 0.75 is 3/4');

/* 3. domain: a negative base is judged by the reduced exponent */
['-8,1/2', '-4,0.5', '-2,0.25', '-8,2/4', '-1,1/2', '-16,3/4', '-5,-1/2', '-e,1/2'].forEach((t) => { const [a, e] = t.split(','); const r = R(a, e); ok(!r.ok && r.code === 'NOT_REAL' && /denominator/.test(r.error), a + '^' + e + ' has no real value'); });
eq(R('-8', '2/6').rawSign, -1, '(-8)^(2/6) = (-8)^(1/3) is real and negative'); eq(F.valueText(R('-8', '2/6')), '\u22122', '(-8)^(1/3) = -2'); eq(F.valueText(R('-8', '2/3')), '4', '(-8)^(2/3) = 4');
eq(F.valueText(R('-27', '-2/3')), '1/9 = 0.1111111111', '(-27)^(-2/3) = 1/9'); ok(R('-8', '1/3').steps.some((s) => /real value/.test(s.title)), 'negative base step');
eq(R('0', '0').code, 'ZERO_TO_ZERO', '0^0'); eq(R('0', '-1/2').code, 'ZERO_NEGATIVE', '0^(-1/2)'); eq(R('0', '1/2').rawSign, 0, '0^(1/2) = 0'); eq(R('0', '1/2').radical, null, '0^(1/2) has no radical form');

/* 4. negative exponents */
eq(F.valueText(R('2', '-3')), '1/8 = 0.125', '2^-3'); ok(R('2', '-3').forms.some((f) => f.label === 'Reciprocal form' && f.text === '1 / 2^3'), 'reciprocal form of 2^-3');
ok(R('2/3', '-2').steps.length >= 3, 'steps for (2/3)^-2'); eq(R('2/3', '-2').sol.fraction, '9/4', '(2/3)^-2 = 9/4'); ok(/flipping/.test(R('2/3', '-1/2').steps.map((s) => s.text).join('\n')), 'fraction base is flipped');
ok(/denominator rationalised/.test(R('2', '-3/2').steps.map((s) => s.text).join('\n')), 'rationalised wording'); eq(R('2', '-3/2').radical.coefD, '4', '2^(-3/2) coefficient denominator');

/* 5. forms and steps are clean */
const cases = [['12', '1/2'], ['2', '-3/2'], ['27', '2/3'], ['-8', '1/3'], ['5', '-1/3'], ['2', '-3'], ['2/3', '-1/2'], ['72', '-5/4'], ['e', '2/3'], ['0.25', '1.5'], ['1000000007', '1/2'], ['2', '1000/3']];
cases.forEach(([a, e]) => { const r = R(a, e); ok(r.ok, a + '^' + e + ' runs'); if (!r.ok) return; r.steps.concat(r.forms.map((f) => ({ title: f.label, text: f.text + ' ' + (f.note || '') }))).forEach((s) => ok(s.title && s.text && !/undefined|NaN|\[object|Infinity/.test(s.text), 'clean ' + a + '^' + e + ' ' + s.title)); ok(r.steps[0].title === 'The problem' && r.steps[r.steps.length - 1].title === 'Result', 'step order ' + a + '^' + e); });
ok(R('2', '1000/3').radical === null && /too large|too long|more than/.test(R('2', '1000/3').radicalNote || ''), 'large exponent: radical form declined with a reason');
ok(R('1000000007', '1/2').radical && R('1000000007', '1/2').radical.radicand === '1000000007', 'a large prime base is factored'); ok(R('1000000000039', '1/2').radical === null && /too large/.test(R('1000000000039', '1/2').radicalNote), 'a base above the factoring limit is declined with a reason');
ok(R('2', '1/2').forms.some((f) => f.label === 'Root, then power' && /square root of 2/.test(f.text)), 'root then power'); ok(R('2', '3/2').forms.some((f) => f.label === 'Power, then root' && /square root of \(2\^3\)/.test(f.text)), 'power then root');

/* 6. exports */
const r1 = R('12', '1/2'), tx = F.exportTxt(r1);
ok(/Mode 02/.test(tx) && /Simplified radical form: 2√3/.test(tx) && /EQUIVALENT FORMS/.test(tx) && /WORKING/.test(tx), 'txt content'); eq(F.exportCsv(r1).split('\n')[5], 'Simplified radical form,2√3', 'csv radical row');
const js = JSON.parse(F.exportJson(r1)); eq(js.radical.index, 2, 'json index'); eq(js.radical.radicand, '3', 'json radicand'); eq(js.radical.coefficient, '2/1', 'json coefficient'); ok(/2√3/.test(F.headline(r1)), 'headline');
/* Mode 01 and Mode 02 never disagree on the value */
for (const [a, e] of [['2', '0.5'], ['27', '2/3'], ['-8', '1/3'], ['10', '-3'], ['5', '-1/3'], ['3', '7/2']]) eq(F.valueText(R(a, e)), X.valueText(X.run({ a: a, n: e, sig: '10' })), 'Mode 01 and Mode 02 agree for ' + a + '^' + e);

/* 7. the built page */
const base = path.join(__dirname, '..', 'calculators'), page = path.join(base, 'negative-fractional-exponents-calculator', 'index.html');
if (fs.existsSync(page)) {
  const html = fs.readFileSync(page, 'utf8');
  eq((html.match(/<h1[ >]/g) || []).length, 1, 'page has one h1'); ok(!/<script[^>]+src="https?:/i.test(require('./approved_remote.js').stripApproved(html)), 'no external scripts'); ok(!/<link[^>]+href="https?:/i.test(html), 'no external stylesheets or fonts');
  ok(html.indexOf('Elecmetric Exponent Calculator, Mode 02') > 0 && html.indexOf('ExponentFrac') > 0 && html.indexOf('ExponentCalc') > 0, 'both engines and the script are inlined');
  ['a', 'n', 'sig', 'err', 'out', 'steps', 'hist', 'hclear', 'dl', 'note'].forEach((k) => ok(new RegExp('id="ex-' + k + '"').test(html), 'element ex-' + k));
  ok(/<title>Negative and Fractional Exponents Calculator/.test(html), 'title'); ok(/aria-current="page"[^>]*>Mode 02/.test(html), 'mode strip marks Mode 02 current'); ok(/href="\.\.\/exponent-calculator\/"[^>]*>Mode 01/.test(html), 'Mode 01 is linked'); ok(/href="\.\.\/exponent-solver\/"[^>]*>Mode 03/.test(html) && /href="\.\.\/exponent-laws-calculator\/"[^>]*>Mode 04/.test(html) && /href="\.\.\/engineering-powers-scientific-notation\/"[^>]*>Mode 05/.test(html), 'Modes 03 to 05 are linked; no mode is shown as coming');
  ['exponent-calculator', 'powers-roots', 'logarithm', 'scientific-calculator', 'fraction-arithmetic', 'engineering-mathematics'].forEach((d) => ok(fs.existsSync(path.join(base, d, 'index.html')) && html.indexOf('href="../' + d + '/"') > 0, 'related page ' + d));
  const mm = html.match(/data-ex="[^"]*"/g) || []; ok(mm.length >= 12, 'example chips present');
  mm.forEach((c) => { const d = JSON.parse(c.slice(9, -1).replace(/&quot;/g, '"').replace(/&amp;/g, '&')); const r = F.run({ a: d.a, n: d.n }); ok(r.ok || r.code === 'NOT_REAL' || r.code === 'ZERO_TO_ZERO', 'chip example is valid or an intended refusal: ' + c.slice(0, 60)); });
  ok((html.match(/<h3>/g) || []).length >= 10, 'ten questions'); ['examples', 'formulas', 'signs', 'method', 'rules', 'faq', 'related'].forEach((s) => ok(new RegExp('id="' + s + '"').test(html), 'section ' + s));
  ok(/data-dl="txt"/.test(html) && /data-dl="csv"/.test(html) && /data-dl="json"/.test(html) && /data-key="\/"/.test(html), 'downloads and keypad');
  ['sw.js', 'sitemap.xml'].forEach((f) => ok(fs.readFileSync(path.join(__dirname, '..', f), 'utf8').indexOf('negative-fractional-exponents-calculator') > 0, f + ' lists the page'));
  /* structured data is added by tools/build_pages.js with BASE_URL, from the page's own h1 and its faq section: check that the FAQ is in the shape it reads */
  ok((((html.match(/<section id="faq">[^]*?<\/section>/) || [''])[0]).match(/<h3>[^]*?<\/h3><p>[^]*?<\/p>/g) || []).length >= 10, 'faq section has at least 10 question and answer pairs for the FAQPage graph');
  /* every worked example on the page is the engine's own result */
  [['12', '1/2', '2√3'], ['2', '-3/2', '√2 / 4'], ['2', '2/3', '∛4']].forEach(([a, e, w]) => ok(html.indexOf(w) > 0, 'page shows ' + w));
} else console.log('(page not built yet: skipping page checks)');

console.log(n + ' checks, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
