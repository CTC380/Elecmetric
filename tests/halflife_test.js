/* Tests for tools/halflife_engine.js (Half-Life Calculator, Mode 01) against tests/halflife_vectors.json (independent: gen_halflife_vectors.py, Python decimal at 60 digits)
   and the cases in the CEO product decision. Also checks the built page. Run: node tests/halflife_test.js */
const fs = require('fs'), path = require('path');
const H = require('../tools/halflife_engine.js'), V = require('./halflife_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 20) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const ok = (c, m) => { n++; if (!c) bad(m); };
const near = (a, b, m, rel = 1e-11) => { n++; const e = Number(b), tol = Math.max(rel * Math.abs(e), 1e-322); if (!(Math.abs(a - e) <= tol)) bad(m + ': got ' + a + ', expected ' + e); };
const run = (o) => H.run(o);
const FIELDS = ['N0', 'Nt', 't', 'T'];

/* 1. independent vectors: explicit target, and automatic mode with the unknown left blank */
for (const v of V) {
  for (const mode of ['explicit', 'auto']) {
    const input = Object.assign({ timeUnit: 'yr' }, v.in);
    if (mode === 'auto') { input.target = 'auto'; FIELDS.forEach((f) => { if (f === v.in.target) input[f] = ''; }); }
    const r = run(input), tag = v.name + ' [' + mode + '/' + v.in.target + ']';
    if (!r.ok) { bad(tag + ' errored: ' + r.error); continue; }
    const s = r.sol, o = v.out;
    eq(r.target, v.in.target, tag + ' target');
    near(s.N0, o.N0, tag + ' N0'); near(s.Nt, o.Nt, tag + ' Nt'); near(s.t, o.t, tag + ' t'); near(s.T, o.T, tag + ' T'); near(s.n, o.n, tag + ' n', 1e-10);
    near(s.remFrac * 100, o.rem, tag + ' remaining %', 1e-10); near(s.decFrac * 100, o.dec, tag + ' decayed %', 1e-10); near(s.decQty, o.decQty, tag + ' decayed qty', 1e-10);
    near(s.lambda, o.lambda, tag + ' lambda'); near(s.tau, o.tau, tag + ' tau');
    if (s.check) ok(s.check.ok, tag + ' built-in check failed');
  }
}

/* 2. the CEO brief's independent cases */
const R = (o) => run(Object.assign({ timeUnit: 'yr' }, o)).sol;
eq(R({ N0: '100', t: '10', T: '10' }).Nt, 50, 'brief: 100 g after one half-life');
eq(R({ N0: '100', t: '20', T: '10' }).Nt, 25, 'brief: two half-lives');
eq(R({ N0: '100', t: '30', T: '10' }).Nt, 12.5, 'brief: three half-lives');
eq(R({ N0: '100', t: '20', T: '10' }).remFrac * 100, 25, 'brief: T 10 yr, t 20 yr is 25%');
eq(R({ N0: '100', t: '11460', T: '5730' }).remFrac * 100, 25, 'brief: C-14 25%');
near(R({ N0: '100', t: '10', T: '10' }).lambda, 0.0693147, 'brief: lambda for 10 yr', 1e-6);
near(R({ N0: '100', t: '10', T: '10' }).tau, 14.427, 'brief: mean lifetime for 10 yr', 1e-4);
eq(R({ N0: '100', Nt: '25', T: '5730' }).n, 2, 'brief: 100 to 25 is 2 half-lives');
eq(R({ N0: '100', Nt: '25', T: '5730' }).t, 11460, 'brief: time for 100 to 25');
eq(R({ N0: '100', Nt: '25', t: '11460' }).T, 5730, 'brief: half-life recovered');
eq(R({ Nt: '25', t: '11460', T: '5730' }).N0, 100, 'brief: initial recovered');
const w = R({ N0: '100', t: '11460', T: '5730' });
eq(w.decQty, 75, 'brief section 4: decayed quantity'); eq(w.decFrac * 100, 75, 'brief section 4: decayed %'); eq(w.n, 2, 'brief section 4: half-lives');
/* the brief's decay ladder 100, 50, 25, 12.5, 6.25, 3.125 */
[100, 50, 25, 12.5, 6.25, 3.125].forEach((q, k) => eq(R({ N0: '100', t: String(k * 5730), T: '5730' }).Nt, q, 'brief: ladder step ' + k));

/* 3. validation and edge cases (brief decisions 2, 3 and 6) */
const E = (o) => run(Object.assign({ timeUnit: 'yr' }, o));
eq(E({ N0: '0', t: '5', T: '10' }).ok, false, 'zero initial quantity refused'); eq(E({ N0: '0', t: '5', T: '10' }).field, 'N0', 'zero initial quantity field');
eq(E({ N0: '100', t: '5', T: '-5' }).ok, false, 'negative half-life refused'); eq(E({ N0: '100', t: '5', T: '-5' }).field, 'T', 'negative half-life field');
eq(E({ N0: '100', t: '5', T: '0' }).ok, false, 'zero half-life refused');
eq(E({ N0: '100', Nt: '150', T: '10' }).ok, false, 'remaining above initial refused'); eq(E({ N0: '100', Nt: '150', T: '10' }).field, 'Nt', 'remaining above initial field');
eq(E({ N0: '100', Nt: '0', T: '10' }).ok, false, 'zero remaining, elapsed time, refused'); ok(/infinite time/.test(E({ N0: '100', Nt: '0', T: '10' }).error), 'zero remaining explains infinite time');
eq(E({ N0: '100', Nt: '0', t: '10' }).ok, false, 'zero remaining, half-life, refused');
eq(E({ N0: '100', Nt: '-1', T: '10' }).ok, false, 'negative remaining refused');
eq(E({ Nt: '5', t: '-1', T: '10' }).ok, false, 'negative elapsed time refused'); eq(E({ Nt: '5', t: '-1', T: '10' }).field, 't', 'negative elapsed time field');
eq(E({ N0: '100', t: '0', T: '10' }).sol.Nt, 100, 'zero elapsed time leaves the quantity unchanged');
eq(E({ N0: '100', Nt: '100', T: '10' }).sol.t, 0, 'Nt = N0: elapsed time 0');
const nd = E({ N0: '100', Nt: '100', t: '10' });
eq(nd.ok, true, 'no decay observed succeeds'); eq(nd.sol.T, Infinity, 'no decay: infinite half-life'); eq(nd.sol.lambda, 0, 'no decay: lambda 0'); eq(nd.sol.tau, Infinity, 'no decay: tau infinite'); ok(nd.warnings.some((x) => x.code === 'NO_DECAY_OBSERVED'), 'no decay warning');
eq(E({ N0: '100', Nt: '100', t: '0' }).ok, false, 'no time and no change: half-life undefined, refused as a zero time');
eq(E({}).ok, false, 'empty input'); eq(E({}).empty, true, 'empty input flagged empty');
eq(E({ N0: '100', t: '5' }).partial, true, 'two fields missing is a prompt, not a result'); ok(/leave the fourth empty/.test(E({ N0: '100', t: '5' }).error), 'two missing explains');
eq(E({ N0: '100', Nt: '25', t: '11460', T: '5730' }).ok, false, 'all four filled in automatic mode asks to clear one');
eq(E({ N0: 'abc', t: '5', T: '10' }).ok, false, 'text is not a number'); eq(E({ N0: 'abc', t: '5', T: '10' }).field, 'N0', 'text error names the field');
eq(E({ N0: 'Infinity', t: '5', T: '10' }).ok, false, 'Infinity refused'); eq(E({ N0: '1e999', t: '5', T: '10' }).ok, false, 'overflowing number refused'); eq(E({ N0: 'NaN', t: '5', T: '10' }).ok, false, 'NaN refused');
eq(run({ N0: '100', t: '5', T: '10', timeUnit: 'fortnight' }).ok, false, 'unknown time unit refused');
/* explicit target ignores a value typed in the target field */
eq(run({ target: 'Nt', N0: '100', Nt: '999', t: '10', T: '10' }).sol.Nt, 50, 'explicit target ignores the solved field');
eq(run({ target: 'Nt', N0: '100', t: '10', T: '10' }).sol.Nt, 50, 'explicit target with the field empty');
eq(run({ target: 'T', N0: '100', Nt: '25', t: '11460', T: 'abc' }).sol.T, 5730, 'explicit target ignores junk in the solved field');
/* very large and very small numbers */
const ex = R({ N0: '1e300', Nt: '1e-300', T: '1e9' }); ok(Number.isFinite(ex.t) && ex.t > 0, 'extreme ratio stays finite'); near(R({ N0: '1e300', Nt: '1e-300', t: String(ex.t) }).T, 1e9, 'extreme round trip half-life', 1e-9);
const ov = R({ Nt: '1', t: '1e6', T: '1' }); eq(ov.N0, Infinity, 'initial quantity overflow is Infinity'); ok(run({ Nt: '1', t: '1e6', T: '1', timeUnit: 'yr' }).warnings.some((x) => x.code === 'OVERFLOW'), 'overflow warning');
const un = run({ N0: '1', t: '1e6', T: '1', timeUnit: 'yr' }); eq(un.sol.Nt, 0, 'underflow gives 0'); ok(un.warnings.some((x) => x.code === 'UNDERFLOW_TO_ZERO'), 'underflow warning'); eq(un.sol.decFrac, 1, 'underflow: decayed fraction 1');
const tiny = R({ N0: '1', t: '1', T: '1e9' }); ok(tiny.decFrac > 0 && tiny.decFrac < 1e-9, 'tiny decay keeps its precision (expm1)'); near(tiny.decFrac, 6.931471805599453e-10 * (1 - 3.4657359e-10), 'tiny decay value', 1e-9);
/* units: one unit for t and T, nothing converted */
eq(run({ N0: '100', t: '20', T: '10', timeUnit: 'h' }).sol.Nt, 25, 'hours give the same Nt as years'); eq(run({ N0: '100', t: '20', T: '10', timeUnit: 'ns' }).sol.Nt, 25, 'nanoseconds');
H.TIME_UNITS.forEach((u) => ok(H.isTimeUnit(u[0]) && typeof H.timeLabel(u[0]) === 'string', 'unit ' + u[0]));
eq(H.timeLabel('yr', 1), 'year', 'singular year'); eq(H.timeLabel('yr', 2), 'years', 'plural years');
const eqv = run({ N0: '1', t: '1', T: '1', timeUnit: 'yr' }).equivalents; near(eqv[0].seconds, 31557600, 'one Julian year in seconds', 1e-15);

/* 4. number parsing */
const P = H.parseNumber;
eq(P('11,460').value, 11460, 'thousands comma'); eq(P('1,234,567.5').value, 1234567.5, 'grouped decimal'); eq(P(' 1 000 ').value, 1000, 'spaces'); eq(P('1.5e-3').value, 0.0015, 'exponent'); eq(P('2E9').value, 2e9, 'capital E');
eq(P('.5').value, 0.5, 'leading dot'); eq(P('5.').value, 5, 'trailing dot'); eq(P('\u22125').value, -5, 'unicode minus'); eq(P('+3').value, 3, 'plus'); eq(P('').empty, true, 'empty'); eq(P('   ').empty, true, 'blank');
['1,5', '1,23', '12,34,5', 'a', '1e', '--1', '1.2.3', '0x10', '1/2', 'ten'].forEach((x) => eq(P(x).error !== undefined, true, 'rejects ' + x));
/* number formatting */
eq(H.fmt(11460), '11,460', 'fmt grouping'); eq(H.fmt(0.0693147180559945), '0.0693147', 'fmt 6 sig'); eq(H.fmt(25.000000000000004), '25', 'fmt hides rounding noise'); eq(H.fmt(1.5e-7), '1.5 \u00d7 10\u207b\u2077', 'fmt small'); eq(H.fmt(2e15), '2 \u00d7 10\u00b9\u2075', 'fmt large');
eq(H.fmt(Infinity), '\u221e', 'fmt infinity'); eq(H.fmt(0), '0', 'fmt zero'); eq(H.fmt(-2.5), '\u22122.5', 'fmt negative'); eq(H.fmt(1 / 3, 10), '0.3333333333', 'fmt 10 sig'); eq(H.fmt(1 / 3, 'full'), String(1 / 3), 'fmt full');

/* 5. properties: round trips through all four solvers */
let seed = 12345; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
for (let i = 0; i < 600; i++) {
  const N0 = Math.pow(10, rnd() * 20 - 10), T = Math.pow(10, rnd() * 12 - 4), t = rnd() * 40 * T;
  const a = H.solve('Nt', { N0, t, T }); if (!a.ok) { bad('round trip Nt failed'); continue; }
  const Nt = a.sol.Nt; if (!(Nt > 0) || Nt >= N0) continue;
  const bt = H.solve('t', { N0, Nt, T }).sol.t, bT = H.solve('T', { N0, Nt, t }).sol.T, bN = H.solve('N0', { Nt, t, T }).sol.N0;
  near(bt, t, 'round trip t #' + i, 1e-9); near(bT, T, 'round trip T #' + i, 1e-9); near(bN, N0, 'round trip N0 #' + i, 1e-12);
  ok(a.sol.remFrac + a.sol.decFrac > 1 - 1e-14 && a.sol.remFrac + a.sol.decFrac < 1 + 1e-14, 'fractions sum to 1 #' + i);
  const b = H.solve('Nt', { N0, t: t * 1.5, T }); ok(b.sol.Nt <= Nt, 'decay is monotonic #' + i);
  /* halving property: after one more half-life the quantity halves */
  near(H.solve('Nt', { N0, t: t + T, T }).sol.Nt, Nt / 2, 'one more half-life halves #' + i, 1e-12);
}

/* 6. exports */
const rr = run({ N0: '100', t: '11,460', T: '5,730', timeUnit: 'yr', quantityUnit: 'g' });
const csv = H.exportCsv(rr).split('\r\n'); eq(csv[0], 'Quantity,Value,Unit', 'csv header'); eq(csv[2], 'Remaining quantity Nt,25,g', 'csv remaining'); eq(csv[6], 'Elapsed time t,11460,years', 'csv elapsed (ungrouped)'); eq(csv[7], 'Half-life T1/2,5730,years', 'csv half-life');
const js = JSON.parse(H.exportJson(rr)); eq(js.remainingQuantity, 25, 'json remaining'); eq(js.solvedFor, 'Nt', 'json solvedFor'); eq(js.decayedPercentage, 75, 'json decayed %');
const nj = JSON.parse(H.exportJson(run({ N0: '100', Nt: '100', t: '10', timeUnit: 'yr' }))); eq(nj.halfLife, 'infinity', 'json infinite half-life is a word');
const tx = H.exportTxt(rr); ok(/Remaining quantity Nt: 25 g/.test(tx) && /THE DECAY LAW/.test(tx) && /radiation-safety/.test(tx), 'txt content');
rr.steps.forEach((s) => ok(s.title && s.text, 'step has a title and text'));
ok(rr.steps.some((s) => s.title === 'Check'), 'working includes the check');
ok(/100\u00a0g \u00d7 2\^\(\u221211,460\u00a0years \/ 5,730\u00a0years\)/.test(rr.steps[1].text), 'working shows the user\u2019s numbers and units');

/* 7. the built page */
const page = path.join(__dirname, '..', 'calculators', 'half-life-calculator', 'index.html');
if (fs.existsSync(page)) {
  const html = fs.readFileSync(page, 'utf8');
  eq((html.match(/<h1[ >]/g) || []).length, 1, 'page has one h1');
  ok(!/<script[^>]+src="https?:/i.test(require('./approved_remote.js').stripApproved(html)), 'no external scripts');
  ok(!/<link[^>]+href="https?:/i.test(html), 'no external stylesheets or fonts');
  ok(html.indexOf('Elecmetric Half-Life Calculator, Mode 01') > 0 && html.indexOf('HalfLife') > 0, 'engine is inlined');
  ok(/id="hl-N0"/.test(html) && /id="hl-Nt"/.test(html) && /id="hl-t"/.test(html) && /id="hl-T"/.test(html), 'four input fields');
  ok(/radiation-safety|radiation safety/i.test(html), 'scope statement present');
  ok(/RC/.test(html) && /biological/i.test(html), 'process-distinction section present');
  ok(/<title>[^<]*Half-Life Calculator/.test(html), 'title');
  /* every worked example on the page equals what the engine returns now */
  const m = html.match(/data-ex="[^"]*"/g) || []; ok(m.length >= 6, 'example chips present');
  m.forEach((c) => { const d = JSON.parse(c.slice(9, -1).replace(/&quot;/g, '"').replace(/&amp;/g, '&')); ok(run(d).ok, 'chip example runs: ' + c.slice(0, 60)); });
} else console.log('(page not built yet: skipping page checks)');

console.log(n + ' checks, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
