/* Tests for tools/halflife_const_engine.js (Half-Life Calculator, Mode 02: decay constant and mean lifetime converter) against tests/halflife_const_vectors.json
   (independent: gen_halflife_const_vectors.py, Python decimal at 60 digits) and the cases in the CEO product decision. Also checks the built page. Run: node tests/halflife_const_test.js */
const fs = require('fs'), path = require('path');
const C = require('../tools/halflife_const_engine.js'), H = require('../tools/halflife_engine.js'), V = require('./halflife_const_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 20) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const ok = (c, m) => { n++; if (!c) bad(m); };
const near = (a, b, m, rel = 1e-14) => { n++; const e = Number(b), tol = Math.max(rel * Math.abs(e), 1e-322); if (!(Math.abs(a - e) <= tol)) bad(m + ': got ' + a + ', expected ' + e); };
const run = (o) => C.run(o);
const R = (o) => run(Object.assign({ timeUnit: 'yr' }, o));
const FIELDS = ['T', 'lambda', 'tau'];

/* 1. independent vectors: explicit start (other fields hold junk), and automatic mode with only the start typed */
for (const v of V) {
  for (const mode of ['explicit', 'auto']) {
    const input = Object.assign({}, v.in);
    if (mode === 'auto') input.known = 'auto'; else FIELDS.forEach((f) => { if (f !== v.in.known) input[f] = 'junk'; });
    const r = run(input), tag = v.name + ' [' + mode + '/' + v.in.known + ']';
    if (!r.ok) { bad(tag + ' errored: ' + r.error); continue; }
    const o = v.out;
    eq(r.source, v.in.known, tag + ' source');
    near(r.sol.T, o.T, tag + ' T'); near(r.sol.lambda, o.lambda, tag + ' lambda'); near(r.sol.tau, o.tau, tag + ' tau');
    near(r.perUnit.remaining, o.perUnitRemaining, tag + ' per-unit remaining', 1e-12); near(r.perUnit.decayed, o.perUnitDecayed, tag + ' per-unit decayed', 1e-12);
    if (o.conv) { ok(!!r.conv, tag + ' conversion present'); if (r.conv) { near(r.conv.T, o.conv.T, tag + ' converted T'); near(r.conv.lambda, o.conv.lambda, tag + ' converted lambda'); near(r.conv.tau, o.conv.tau, tag + ' converted tau'); } }
    else ok(!r.conv, tag + ' no conversion');
    ok(r.check.ok, tag + ' built-in check failed');
  }
}

/* 2. the CEO brief's cases */
near(R({ known: 'T', T: '10' }).sol.lambda, 0.0693147, 'brief: lambda for a 10 yr half-life', 1e-6);
near(R({ known: 'T', T: '10' }).sol.tau, 14.427, 'brief: mean lifetime for a 10 yr half-life', 1e-4);
near(R({ known: 'lambda', lambda: '0.0693147' }).sol.T, 10, 'brief: half-life from lambda', 1e-6);
near(R({ known: 'tau', tau: '14.427' }).sol.T, 10, 'brief: half-life from tau', 1e-5);
near(R({ known: 'tau', tau: '14.427' }).sol.lambda, 0.0693147, 'brief: decay constant from tau', 1e-5);
eq(R({ T: '5730' }).sol.lambda, Math.LN2 / 5730, 'C-14 lambda is ln 2 / T'); eq(R({ T: '5730' }).sol.tau, 5730 / Math.LN2, 'C-14 tau is T / ln 2');
/* the six named conversions */
eq(C.decayConstantFromHalfLife(10), Math.LN2 / 10, 'lambda from T'); eq(C.halfLifeFromDecayConstant(0.5), Math.LN2 / 0.5, 'T from lambda'); eq(C.meanLifetimeFromDecayConstant(4), 0.25, 'tau from lambda');
eq(C.decayConstantFromMeanLifetime(4), 0.25, 'lambda from tau'); eq(C.meanLifetimeFromHalfLife(10), 10 / Math.LN2, 'tau from T'); eq(C.halfLifeFromMeanLifetime(10), 10 * Math.LN2, 'T from tau');
/* what the numbers mean */
near(C.afterMeanLifetimes(1), Math.exp(-1), '1/e after one mean lifetime'); near(R({ T: '1' }).perUnit.remaining, 0.5, 'one half-life per unit leaves 50%', 1e-15); eq(R({ T: '1' }).perUnit.remaining, 0.5, 'exactly half after one half-life');
near(R({ T: '2' }).perUnit.remaining, Math.SQRT1_2, 'half-life 2 leaves 1/sqrt 2 per unit', 1e-15);

/* 3. validation and edge cases */
const E = (o) => R(o);
eq(E({ T: '0' }).ok, false, 'zero half-life refused'); eq(E({ T: '0' }).field, 'T', 'zero half-life field');
eq(E({ T: '-5' }).ok, false, 'negative half-life refused'); eq(E({ lambda: '-0.1' }).field, 'lambda', 'negative decay constant field'); eq(E({ tau: '0' }).field, 'tau', 'zero mean lifetime field');
eq(E({}).ok, false, 'empty input'); eq(E({}).empty, true, 'empty input flagged empty'); eq(E({ T: '  ', lambda: '' }).empty, true, 'blank fields are empty');
eq(E({ T: 'abc' }).ok, false, 'text is not a number'); eq(E({ T: 'abc' }).field, 'T', 'text error names the field');
['Infinity', 'NaN', '1e999', '1/2', ''].forEach((x) => { if (x !== '') eq(E({ T: x }).ok, false, 'refuses ' + x); });
eq(run({ T: '10', timeUnit: 'fortnight' }).ok, false, 'unknown time unit refused'); eq(run({ T: '10', outUnit: 'fortnight' }).ok, false, 'unknown output unit refused'); eq(run({ T: '10', known: 'mass' }).ok, false, 'unknown starting value refused');
/* the fields being found are ignored in explicit mode, whatever they hold */
eq(R({ known: 'T', T: '10', lambda: '-1', tau: 'abc' }).ok, true, 'explicit start ignores junk in the other fields');
eq(R({ known: 'lambda', T: 'abc', lambda: '2', tau: '' }).sol.T, Math.LN2 / 2, 'explicit lambda ignores a bad half-life');
eq(R({ known: 'T', T: '' , lambda: '2' }).empty, true, 'explicit start with its field empty is empty');
/* automatic mode: one value, or several that agree, or several that do not */
eq(R({ lambda: '0.5' }).source, 'lambda', 'auto: single lambda is the source'); eq(R({ tau: '3' }).source, 'tau', 'auto: single tau is the source');
eq(R({ T: '10', lambda: String(Math.LN2 / 10), tau: String(10 / Math.LN2) }).warnings.length, 0, 'auto: three agreeing values give no warning');
eq(R({ T: '10', lambda: String(Math.LN2 / 10) }).source, 'T', 'auto: half-life has priority');
eq(R({ lambda: '0.5', tau: String(1 / 0.5) }).source, 'lambda', 'auto: decay constant has priority over mean lifetime');
const inc = R({ T: '10', lambda: '0.07' }); eq(inc.ok, true, 'auto: inconsistent values still give a result'); eq(inc.source, 'T', 'auto: inconsistent, half-life used'); ok(inc.warnings.some((w) => w.code === 'INCONSISTENT_INPUTS'), 'auto: inconsistent warning');
ok(R({ T: '10', tau: '14' }).warnings.some((w) => w.code === 'INCONSISTENT_INPUTS'), 'auto: inconsistent mean lifetime warning'); ok(R({ lambda: '0.5', tau: '3' }).warnings.some((w) => w.code === 'INCONSISTENT_INPUTS'), 'auto: lambda and tau inconsistent');
eq(R({ T: '10', lambda: '0.07' }).sol.T, 10, 'auto: inconsistent, the used value is not changed');
eq(R({ T: '10', lambda: '-1' }).ok, false, 'auto: a bad second value is refused, not ignored'); eq(R({ T: '10', lambda: '-1' }).field, 'lambda', 'auto: bad second value field');
/* range limits */
const ov = R({ T: '1e-323' }); eq(ov.ok, false, 'decay constant overflow refused'); ok(/outside the range/.test(ov.error), 'overflow explained');
eq(R({ lambda: '1e-320' }).ok, false, 'mean lifetime overflow refused'); eq(R({ T: '1e308', outUnit: 'ns', timeUnit: 'Gyr' }).ok, false, 'conversion overflow refused');
const sub = R({ lambda: '1e308' }); eq(sub.ok, true, 'a subnormal result is allowed'); ok(sub.warnings.some((w) => w.code === 'SUBNORMAL'), 'subnormal result warned');
ok(R({ T: '1e-300' }).warnings.length === 0, 'normal tiny values give no warning');
/* conversion: unit changes rescale all three together */
const k = R({ T: '1', outUnit: 'd' }); near(k.conv.T, 365.25, 'one Julian year is 365.25 days'); near(k.conv.lambda, Math.LN2 / 365.25, 'lambda per day', 1e-15); near(k.conv.tau, 365.25 / Math.LN2, 'tau in days', 1e-15);
eq(R({ T: '1', outUnit: 'yr' }).conv, null, 'same output unit gives no conversion'); eq(R({ T: '1', outUnit: 'same' }).conv, null, '"same" gives no conversion'); eq(R({ T: '1', outUnit: '' }).conv, null, 'empty output unit gives no conversion');
eq(run({ T: '60', timeUnit: 's', outUnit: 'min' }).conv.T, 1, 'sixty seconds is one minute'); near(run({ lambda: '1', timeUnit: 's', outUnit: 'min' }).conv.lambda, 60, 'lambda 1 per second is 60 per minute');
H.TIME_UNITS.forEach((u) => ok(run({ T: '3', timeUnit: u[0] }).ok && run({ T: '3', timeUnit: 'yr', outUnit: u[0] }).ok, 'unit ' + u[0]));
const eqv = R({ T: '1' }).equivalents; near(eqv[0].seconds, 31557600, 'one Julian year in seconds', 1e-15); near(eqv[2].perSecond, Math.LN2 / 31557600, 'lambda per second', 1e-15);

/* 4. properties */
let seed = 54321; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
for (let i = 0; i < 600; i++) {
  const x = Math.pow(10, rnd() * 24 - 12), src = FIELDS[i % 3], u = H.TIME_UNITS[Math.floor(rnd() * H.TIME_UNITS.length)][0];
  const a = R({ known: src, [src]: String(x), timeUnit: u }); if (!a.ok) { bad('property case failed ' + src + ' ' + x); continue; }
  const s = a.sol;
  near(s.lambda * s.tau, 1, 'lambda x tau = 1 #' + i, 1e-15); near(s.lambda * s.T, Math.LN2, 'lambda x T = ln 2 #' + i, 1e-15); near(s.tau / s.T, 1 / Math.LN2, 'tau / T = 1 / ln 2 #' + i, 1e-15);
  /* round trips through the other two starting values */
  const t1 = R({ known: 'T', T: String(s.T), timeUnit: u }).sol, t2 = R({ known: 'lambda', lambda: String(s.lambda), timeUnit: u }).sol, t3 = R({ known: 'tau', tau: String(s.tau), timeUnit: u }).sol;
  FIELDS.forEach((f) => { near(t1[f], s[f], 'round trip from T, ' + f + ' #' + i, 1e-14); near(t2[f], s[f], 'round trip from lambda, ' + f + ' #' + i, 1e-14); near(t3[f], s[f], 'round trip from tau, ' + f + ' #' + i, 1e-14); });
  ok(s.T < s.tau, 'half-life is shorter than the mean lifetime #' + i);
  /* a longer half-life means a smaller decay constant */
  const b = R({ known: 'T', T: String(s.T * 2), timeUnit: u }); if (b.ok) ok(b.sol.lambda < s.lambda, 'monotonic #' + i);
  /* a unit change and back is the identity */
  const o = H.TIME_UNITS[Math.floor(rnd() * H.TIME_UNITS.length)][0], c = R({ known: src, [src]: String(x), timeUnit: u, outUnit: o });
  if (c.ok && c.conv) { const back = run({ known: 'T', T: String(c.conv.T), timeUnit: o, outUnit: u }); if (back.ok) near(back.conv.T, s.T, 'unit round trip #' + i, 1e-13); }
}
/* consistency with Mode 01: the same lambda and tau for the same half-life */
[10, 5730, 0.003, 1e9].forEach((T) => { const m1 = H.run({ N0: '100', t: '1', T: String(T), timeUnit: 'yr' }).sol, m2 = R({ T: String(T) }).sol; eq(m2.lambda, m1.lambda, 'agrees with Mode 01 lambda, T=' + T); eq(m2.tau, m1.tau, 'agrees with Mode 01 tau, T=' + T); });

/* 5. exports */
const rr = run({ T: '5,730', timeUnit: 'yr', sig: 6 });
const csv = C.exportCsv(rr).split('\r\n'); eq(csv[0], 'Quantity,Value,Unit', 'csv header'); eq(csv[1], 'Half-life T1/2,5730,years', 'csv half-life (ungrouped)'); eq(csv[2], 'Decay constant lambda,' + (Math.LN2 / 5730) + ',per year', 'csv decay constant full precision'); eq(csv.length, 5, 'csv has three rows and a final newline');
const js = JSON.parse(C.exportJson(rr)); eq(js.halfLife, 5730, 'json half-life'); eq(js.startedFrom, 'T', 'json startedFrom'); near(js.meanLifetime, 5730 / Math.LN2, 'json mean lifetime'); eq(js.converted, undefined, 'json has no converted block without a conversion');
const rc = run({ T: '5730', timeUnit: 'yr', outUnit: 's' }); eq(C.exportCsv(rc).split('\r\n').length, 8, 'csv with conversion has six rows'); eq(JSON.parse(C.exportJson(rc)).converted.timeUnit, 's', 'json converted block');
const tx = C.exportTxt(rr); ok(/Half-life T1\/2: 5,730 years/.test(tx) && /THE RELATIONSHIPS/.test(tx) && /radiation-safety/.test(tx), 'txt content');
rr.steps.forEach((s) => ok(s.title && s.text, 'step has a title and text')); ok(rr.steps.some((s) => s.title === 'Check'), 'working includes the check'); ok(/0\.693147 \/ 5,730\u00a0years = 0\.000120968 per year/.test(rr.steps[1].text), 'working shows the user\u2019s numbers and units');
eq(run({ T: '10', timeUnit: 'yr', outUnit: 'd' }).steps.filter((s) => /^Converted to days/.test(s.title)).length, 1, 'working explains the conversion');

/* 6. the built page and the mode strip */
const page = path.join(__dirname, '..', 'calculators', 'decay-constant-calculator', 'index.html');
if (fs.existsSync(page)) {
  const html = fs.readFileSync(page, 'utf8');
  eq((html.match(/<h1[ >]/g) || []).length, 1, 'page has one h1');
  ok(!/<script[^>]+src=\"https?:/i.test(require('./approved_remote.js').stripApproved(html)), 'no external scripts'); ok(!/<link[^>]+href=\"https?:/i.test(html), 'no external stylesheets or fonts');
  ok(html.indexOf('Elecmetric Half-Life Calculator, Mode 02') > 0 && html.indexOf('HalfLifeConst') > 0 && html.indexOf('Elecmetric Half-Life Calculator, Mode 01') > 0, 'both engines are inlined');
  ok(/id=\"dc-T\"/.test(html) && /id=\"dc-lambda\"/.test(html) && /id=\"dc-tau\"/.test(html), 'three input fields');
  ok(/radiation-safety|radiation safety/i.test(html), 'scope statement present'); ok(/<title>[^<]*Decay Constant/.test(html), 'title');
  ok(/href=\"\.\.\/half-life-calculator\/\"/.test(html), 'links back to Mode 01'); ok(/aria-current=\"page\"[^>]*>Mode 02/.test(html), 'mode strip marks Mode 02 current');
  const m = html.match(/data-ex=\"[^\"]*\"/g) || []; ok(m.length >= 6, 'example chips present');
  m.forEach((c) => { const d = JSON.parse(c.slice(9, -1).replace(/&quot;/g, '"').replace(/&amp;/g, '&')); ok(run({ known: d.known, T: d.T, lambda: d.lambda, tau: d.tau, timeUnit: d.tu, outUnit: d.ou }).ok, 'chip example runs: ' + c.slice(0, 60)); });
  const h1 = fs.readFileSync(path.join(__dirname, '..', 'calculators', 'half-life-calculator', 'index.html'), 'utf8');
  ok(/href=\"\.\.\/decay-constant-calculator\/\"/.test(h1), 'Mode 01 page links to Mode 02'); ok(/href=\"\.\.\/decay-percentage-calculator\/\"/.test(h1), 'Mode 01 page links to Mode 03'); ok(/href=\"\.\.\/decay-table-calculator\/\"/.test(h1), 'Mode 01 page links to Mode 04');
} else console.log('(page not built yet: skipping page checks)');

console.log(n + ' checks, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
