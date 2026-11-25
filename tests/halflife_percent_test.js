/* Tests for tools/halflife_percent_engine.js (Half-Life Calculator, Mode 03: remaining and decayed percentage) against tests/halflife_percent_vectors.json
   (independent: gen_halflife_percent_vectors.py, Python decimal, the decayed fraction at 450 digits) and the cases in the CEO product decision. Also checks the built pages.
   Run: node tests/halflife_percent_test.js */
const fs = require('fs'), path = require('path');
const P = require('../tools/halflife_percent_engine.js'), H = require('../tools/halflife_engine.js'), V = require('./halflife_percent_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 20) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const ok = (c, m) => { n++; if (!c) bad(m); };
/* the tolerance grows with the number of half-lives: n carries one rounding of 1.1e-16, and 2^(-n) multiplies that by n ln 2 */
const near = (a, b, m, nn = 0, base = 2e-14) => { n++; const e = Number(b), tol = Math.max((base + 2.5e-16 * nn) * Math.abs(e), 1e-322); if (!(Math.abs(a - e) <= tol)) bad(m + ': got ' + a + ', expected ' + e); };
const run = (o) => P.run(o);
const R = (o) => run(Object.assign({ timeUnit: 'yr' }, o));

/* 1. independent vectors (the quantity is absent from some, which gives percentages only) */
for (const v of V) {
  const r = run(v.in), tag = v.name, o = v.out, en = Number(o.n);
  if (!r.ok) { bad(tag + ' errored: ' + r.error); continue; }
  near(r.sol.n, o.n, tag + ' n', 0, 1e-15 * 4);
  near(r.sol.remFrac, o.rem, tag + ' remaining fraction', en); near(r.sol.decFrac, o.dec, tag + ' decayed fraction', en);
  if (o.remQty !== undefined) { ok(r.sol.hasQty, tag + ' has quantity'); near(r.sol.remQty, o.remQty, tag + ' remaining quantity', en); near(r.sol.decQty, o.decQty, tag + ' decayed quantity', en); }
  else ok(!r.sol.hasQty && r.sol.remQty === undefined, tag + ' has no quantity');
  ok(r.check.ok, tag + ' built-in check failed');
  if (en >= 1075) ok(r.warnings.some((w) => w.code === 'UNDERFLOW_TO_ZERO') && r.sol.remFrac === 0, tag + ' underflow reported');
}

/* 2. the CEO brief's cases */
const b1 = R({ N0: '100', t: '30', T: '10' }); eq(b1.sol.remQty, 12.5, 'brief: 100 g after three half-lives is exactly 12.5'); eq(b1.sol.remFrac, 0.125, 'brief: 12.5%'); eq(b1.sol.decQty, 87.5, 'brief: 87.5 decayed');
eq(R({ N0: '100', t: '10', T: '10' }).sol.remQty, 50, 'brief: 100 g after one half-life is 50 g'); eq(R({ N0: '100', t: '20', T: '10' }).sol.remQty, 25, 'brief: 100 g after two half-lives is 25 g');
eq(R({ t: '20', T: '10' }).sol.remFrac, 0.25, 'brief: half-life 10 years, time 20 years is 25% remaining'); eq(R({ t: '11460', T: '5730' }).sol.remFrac, 0.25, 'brief: 5,730 yr half-life, 11,460 yr is 25% remaining');
const ex = R({ N0: '100', t: '11460', T: '5730', quantityUnit: 'g' }).sol;
eq(ex.n, 2, 'brief example: 2 half-lives'); eq(ex.remQty, 25, 'brief example: remaining quantity 25 g'); eq(ex.remFrac, 0.25, 'brief example: remaining 25%'); eq(ex.decQty, 75, 'brief example: decayed 75 g'); eq(ex.decFrac, 0.75, 'brief example: decayed 75%');
near(ex.lambda, 0.0000120968 * 10, 'brief example: lambda is ln 2 / 5730', 0, 1e-4); eq(ex.lambda, Math.LN2 / 5730, 'lambda is ln 2 / T'); eq(ex.tau, 5730 / Math.LN2, 'tau is T / ln 2');
near(R({ t: '1', T: '10' }).sol.remFrac, 0.933032991536807, 'one year of a ten-year half-life', 0.1); eq(R({ t: '10', T: '10' }).sol.decFrac, 0.5, 'half decayed after one half-life');
/* the halving ladder is exact for whole numbers of half-lives */
for (let k = 0; k <= 60; k++) { eq(R({ t: String(k), T: '1' }).sol.remFrac, Math.pow(2, -k), 'exact 2^-' + k); eq(R({ N0: '1024', t: String(k), T: '1' }).sol.remQty, 1024 * Math.pow(2, -k), 'exact quantity at ' + k); }
eq(R({ N0: '100', t: '0', T: '10' }).sol.remFrac, 1, 'time zero leaves 100%'); eq(R({ N0: '100', t: '0', T: '10' }).sol.decFrac, 0, 'time zero decays nothing'); eq(R({ N0: '100', t: '0', T: '10' }).sol.remQty, 100, 'time zero leaves all of the quantity');
/* mixed units */
const mx = run({ t: '3', timeUnit: 'd', T: '12', halfLifeUnit: 'h' }); eq(mx.sol.n, 6, '3 days with a 12 h half-life is 6 half-lives'); eq(mx.sol.remFrac, 1 / 64, 'one 64th left'); eq(mx.halfLifeUnit, 'h', 'half-life unit kept'); eq(mx.sol.tInH, 72, 't converted to hours');
eq(run({ t: '1', timeUnit: 'yr', T: '365.25', halfLifeUnit: 'd' }).sol.n, 1, 'a Julian year is 365.25 days'); eq(run({ t: '60', timeUnit: 's', T: '1', halfLifeUnit: 'min' }).sol.n, 1, '60 s is one minute'); eq(run({ t: '1000', timeUnit: 'ms', T: '1', halfLifeUnit: 's' }).sol.n, 1, '1000 ms is one second');
eq(run({ t: '5', timeUnit: 'd', T: '5', halfLifeUnit: 'same' }).sol.n, 1, '"same" uses the elapsed-time unit'); eq(run({ t: '5', timeUnit: 'd', T: '5' }).halfLifeUnit, 'd', 'omitted half-life unit follows the elapsed time unit'); eq(run({ t: '5', timeUnit: 'd', T: '5', halfLifeUnit: '' }).halfLifeUnit, 'd', 'empty half-life unit follows the elapsed time unit');
eq(P.unitRatio('yr', 'yr'), 1, 'same-unit ratio is exactly 1'); near(P.unitRatio('d', 'h'), 24, 'a day is 24 hours', 0, 1e-15); eq(P.halfLivesElapsed(72, 12, 'h', 'h'), 6, 'half-lives elapsed, same unit');
/* default time unit is years */
eq(run({ t: '10', T: '10' }).timeUnit, 'yr', 'default time unit'); eq(run({ t: '10', T: '10', timeUnit: '' }).timeUnit, 'yr', 'empty time unit defaults to years');

/* 3. validation and edge cases */
eq(run({}).empty, true, 'empty input is flagged empty'); eq(run({ N0: '', t: '  ', T: '' }).empty, true, 'blank fields are empty'); eq(run({}).ok, false, 'empty input is not a result');
const pt = R({ T: '10' }); eq(pt.ok, false, 'half-life alone is not enough'); eq(pt.partial, true, 'half-life alone is flagged partial'); eq(pt.field, 't', 'asks for the elapsed time'); eq(R({ t: '5' }).field, 'T', 'asks for the half-life'); eq(R({ N0: '5' }).partial, true, 'quantity alone is partial'); ok(/elapsed time and the half-life/.test(R({ N0: '5' }).error), 'asks for both');
eq(R({ t: '5', T: '0' }).ok, false, 'zero half-life refused'); eq(R({ t: '5', T: '0' }).field, 'T', 'zero half-life field'); eq(R({ t: '5', T: '-3' }).ok, false, 'negative half-life refused');
eq(R({ t: '-1', T: '10' }).ok, false, 'negative elapsed time refused'); eq(R({ t: '-1', T: '10' }).field, 't', 'negative elapsed time field');
eq(R({ N0: '0', t: '5', T: '10' }).ok, false, 'zero initial quantity refused'); eq(R({ N0: '0', t: '5', T: '10' }).field, 'N0', 'zero initial quantity field'); ok(/percentage of nothing/.test(R({ N0: '0', t: '5', T: '10' }).error), 'zero quantity explained');
eq(R({ N0: '-4', t: '5', T: '10' }).ok, false, 'negative initial quantity refused'); eq(R({ N0: '-4', t: '5', T: '10' }).field, 'N0', 'negative initial quantity field');
['abc', 'Infinity', 'NaN', '1e999', '1/2', '5 g'].forEach((x) => { ['N0', 't', 'T'].forEach((f) => { const r = R(Object.assign({ t: '5', T: '10' }, { [f]: x })); eq(r.ok, false, 'refuses ' + x + ' in ' + f); eq(r.field, f, x + ' names ' + f); }); });
eq(run({ t: '5', T: '10', timeUnit: 'fortnight' }).ok, false, 'unknown time unit refused'); eq(run({ t: '5', T: '10', halfLifeUnit: 'fortnight' }).ok, false, 'unknown half-life unit refused');
eq(R({ t: '11,460', T: '5 730', N0: '1e2' }).sol.remQty, 25, 'accepts 11,460, 5 730 and 1e2');
/* the quantity does not change the percentages */
[1e-9, 1, 37, 1e9].forEach((q) => eq(R({ N0: String(q), t: '7', T: '3' }).sol.remFrac, R({ t: '7', T: '3' }).sol.remFrac, 'percentage independent of the quantity ' + q));
/* range limits */
const big = R({ t: '1e300', timeUnit: 'Gyr', T: '1e-300', halfLifeUnit: 'ns' }); eq(big.ok, false, 'a ratio that cannot be represented is refused'); ok(/outside the range/.test(big.error), 'range error explained');
eq(R({ t: '1e308', T: '1e-10' }).ok, false, 'n overflow refused'); const un = R({ t: '1e-300', T: '1e300' }); eq(un.ok, true, 'n underflow is allowed'); ok(un.warnings.some((w) => w.code === 'TIME_UNDERFLOW'), 'n underflow warned'); eq(un.sol.decFrac, 0, 'decay of zero half-lives');
ok(R({ t: '1070', T: '1' }).warnings.some((w) => w.code === 'SUBNORMAL'), 'subnormal fraction warned'); ok(R({ t: '1070', T: '1' }).sol.remFrac > 0, 'subnormal fraction is not zero');
const zz = R({ t: '1100', T: '1', N0: '5' }); ok(zz.warnings.some((w) => w.code === 'UNDERFLOW_TO_ZERO'), 'underflow to zero warned'); eq(zz.sol.remFrac, 0, 'underflow fraction is zero'); eq(zz.sol.decFrac, 1, 'underflow decayed fraction is one'); ok(/\u2248 0%/.test(P.exportTxt(zz)), 'underflow shows as about 0%');
const qz = R({ t: '1070', T: '1', N0: '1e-300' }); ok(qz.warnings.some((w) => w.code === 'QUANTITY_UNDERFLOW'), 'quantity underflow warned'); eq(qz.sol.remQty, 0, 'quantity underflow is zero');
ok(R({ t: '5', T: '10' }).warnings.length === 0 && R({ N0: '100', t: '20', T: '10' }).warnings.length === 0, 'ordinary cases give no warnings');
/* a tiny time keeps its decay */
near(R({ t: '1e-9', T: '1' }).sol.decFrac, Math.LN2 * 1e-9, 'tiny decay is not rounded to zero', 0, 1e-9); ok(R({ t: '1e-9', T: '1' }).sol.decFrac > 0, 'tiny decay is positive'); near(R({ t: '1e-250', T: '1' }).sol.decFrac, Math.LN2 * 1e-250, 'extreme tiny decay', 0, 1e-12);

/* 4. milestones and the ladder */
const m = R({ t: '1', T: '10' }).milestones; eq(m.length, 8, 'eight milestones'); eq(m[2].percent, 50, '50% milestone'); eq(m[2].time, 10, 'half the quantity at one half-life'); eq(m[3].time, 20, 'a quarter at two half-lives'); eq(m[2].halfLives, 1, '50% is one half-life');
near(m[0].halfLives, Math.log2(100 / 90), '90% milestone'); near(m[4].time, 10 * Math.log2(10), '10% milestone'); near(m[6].time, 10 * Math.log2(100), '1% milestone'); near(m[7].time, 10 * Math.log2(1000), '0.1% milestone');
m.forEach((x) => near(P.remainingFraction(x.halfLives), x.percent / 100, 'milestone ' + x.percent + '% round trip', x.halfLives, 1e-13)); eq(P.timeToFraction(10, 0.25), 20, 'time to a quarter');
const l2 = R({ t: '20', T: '10' }).ladder; eq(l2.length, 6, 'ladder has 0 to 5 for small n'); eq(l2[2].current, true, 'ladder marks the current whole half-life'); eq(l2.filter((x) => x.current).length, 1, 'only one ladder row is current'); eq(l2[3].frac, 0.125, 'ladder fraction'); eq(l2[3].time, 30, 'ladder time');
eq(R({ t: '25', T: '10' }).ladder.filter((x) => x.current).length, 0, 'no ladder row is current for a fractional n'); eq(R({ t: '120', T: '10' }).ladder.length, 11, 'ladder stops at 10'); eq(R({ t: '70', T: '10' }).ladder.length, 8, 'ladder reaches the next whole half-life'); eq(R({ N0: '100', t: '10', T: '10' }).ladder[3].qty, 12.5, 'ladder quantity'); eq(R({ t: '10', T: '10' }).ladder[3].qty, undefined, 'ladder has no quantity without N0');
eq(R({ t: '25', T: '10' }).sol.whole, 2, 'whole half-lives in 2.5'); eq(R({ t: '20', T: '10' }).sol.wholeIsN, true, 'a whole n is flagged'); eq(R({ t: '25', T: '10' }).sol.wholeIsN, false, 'a fractional n is not flagged');

/* 5. properties */
let seed = 98765; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
for (let i = 0; i < 600; i++) {
  const T = Math.pow(10, rnd() * 12 - 6), nn = Math.pow(10, rnd() * 3 - 3), u = H.TIME_UNITS[Math.floor(rnd() * H.TIME_UNITS.length)][0], t = nn * T, N0 = Math.pow(10, rnd() * 12 - 6);
  const a = R({ N0: String(N0), t: String(t), T: String(T), timeUnit: u }); if (!a.ok) { bad('property case failed ' + t + ' ' + T); continue; }
  const s = a.sol;
  near(s.remFrac + s.decFrac, 1, 'remaining + decayed = 1 #' + i, 0, 1e-15); near(s.remQty + s.decQty, N0, 'remaining + decayed quantity = N0 #' + i, 0, 1e-15); ok(s.remFrac > 0 && s.remFrac <= 1 && s.decFrac >= 0 && s.decFrac < 1, 'fractions in range #' + i);
  near(s.remFrac, Math.exp(-Math.LN2 * s.n), 'matches exp(-n ln 2) #' + i, s.n, 1e-14);
  /* monotonic: more time leaves less */
  const b = R({ N0: String(N0), t: String(t * 2), T: String(T), timeUnit: u }); if (b.ok) ok(b.sol.remFrac < s.remFrac && b.sol.decFrac > s.decFrac, 'monotonic #' + i);
  /* multiplicative: f(a + b) = f(a) f(b) */
  near(b.sol.remFrac, s.remFrac * s.remFrac, 'f(2t) = f(t)^2 #' + i, 2 * s.n, 1e-14);
  /* the time to reach the remaining fraction is the time given */
  near(P.timeToFraction(T, s.remFrac), t, 'time to fraction round trip #' + i, 0, 1e-12);
  /* the same physical ratio in another pair of units gives the same answer */
  const o = H.TIME_UNITS[Math.floor(rnd() * H.TIME_UNITS.length)][0], k = H.TIME_UNITS.filter((x) => x[0] === u)[0][3] / H.TIME_UNITS.filter((x) => x[0] === o)[0][3], c = run({ t: String(t), timeUnit: u, T: String(T * k), halfLifeUnit: o });
  if (c.ok && isFinite(T * k) && T * k > 0) near(c.sol.remFrac, s.remFrac, 'unit invariance #' + i, s.n, 1e-12);
}
/* consistency with Mode 01: the same fractions, quantities, lambda and tau for the same numbers */
[[100, 11460, 5730], [100, 30, 10], [1e6, 3, 10], [50, 30, 8.02], [7, 1e-6, 1], [3, 0.5, 1], [100, 1000, 10]].forEach((c) => {
  const m1 = H.run({ N0: String(c[0]), t: String(c[1]), T: String(c[2]), timeUnit: 'yr' }), m3 = R({ N0: String(c[0]), t: String(c[1]), T: String(c[2]) });
  eq(m3.sol.n, m1.sol.n, 'agrees with Mode 01: n ' + c); eq(m3.sol.remFrac, m1.sol.remFrac, 'agrees with Mode 01: fraction remaining ' + c); eq(m3.sol.decFrac, m1.sol.decFrac, 'agrees with Mode 01: fraction decayed ' + c); eq(m3.sol.remQty, m1.sol.Nt, 'agrees with Mode 01: remaining quantity ' + c); eq(m3.sol.decQty, m1.sol.decQty, 'agrees with Mode 01: decayed quantity ' + c); eq(m3.sol.lambda, m1.sol.lambda, 'agrees with Mode 01: lambda ' + c); eq(m3.sol.tau, m1.sol.tau, 'agrees with Mode 01: tau ' + c);
  const back = H.run({ N0: String(c[0]), Nt: String(m3.sol.remQty), T: String(c[2]), timeUnit: 'yr' }); if (back.ok && m3.sol.decFrac > 1e-3 && m3.sol.remFrac > 1e-300 && m3.sol.remFrac < 1) near(back.sol.t, c[1], 'Mode 01 recovers the elapsed time from the remaining quantity ' + c, 0, 1e-11);
});

/* 6. exports and working */
const rr = run({ N0: '100', t: '11,460', T: '5,730', timeUnit: 'yr', quantityUnit: 'g', sig: 6 });
const csv = P.exportCsv(rr).split('\r\n'); eq(csv[0], 'Quantity,Value,Unit', 'csv header'); eq(csv[1], 'Initial quantity N0,100,g', 'csv initial quantity'); eq(csv[2], 'Remaining quantity Nt,25,g', 'csv remaining quantity'); eq(csv[3], 'Decayed quantity,75,g', 'csv decayed quantity'); eq(csv[4], 'Remaining percentage,25,percent', 'csv remaining percentage'); eq(csv[5], 'Decayed percentage,75,percent', 'csv decayed percentage'); eq(csv[6], 'Half-lives elapsed n,2,', 'csv half-lives'); eq(csv[7], 'Elapsed time t,11460,years', 'csv elapsed time ungrouped'); eq(csv.length, 12, 'csv has ten rows and a header');
eq(P.exportCsv(run({ t: '20', T: '10' })).split('\r\n').length, 9, 'csv without a quantity has seven rows');
const js = JSON.parse(P.exportJson(rr)); eq(js.remainingPercentage, 25, 'json remaining percentage'); eq(js.decayedPercentage, 75, 'json decayed percentage'); eq(js.initialQuantity, 100, 'json initial quantity'); eq(js.remainingQuantity, 25, 'json remaining quantity'); eq(js.quantityUnit, 'g', 'json quantity unit'); eq(js.halfLivesElapsed, 2, 'json half-lives'); eq(js.elapsedTimeUnit, 'yr', 'json elapsed unit'); eq(js.halfLifeUnit, 'yr', 'json half-life unit');
eq(JSON.parse(P.exportJson(run({ t: '20', T: '10' }))).initialQuantity, undefined, 'json has no quantity without N0');
const tx = P.exportTxt(rr); ok(/Remaining percentage: 25%/.test(tx) && /Decayed percentage: 75%/.test(tx) && /THE DECAY LAW/.test(tx) && /radiation-safety/.test(tx), 'txt content'); ok(/Elapsed time t: 11,460 years/.test(tx), 'txt elapsed time grouped');
rr.steps.forEach((s) => ok(s.title && s.text, 'step has a title and text')); ok(rr.steps.some((s) => s.title === 'Check'), 'working includes the check'); ok(/n = t \/ T\u00bd = 11,460\u00a0years \/ 5,730\u00a0years = 2 {3}\(the quantity has been halved 2 times\)/.test(rr.steps[1].text), 'working shows the user\u2019s numbers and units'); ok(/N\u209c = N\u2080 \u00d7 f = 100\u00a0g \u00d7 0\.25 = 25\u00a0g/.test(rr.steps.filter((s) => s.title === 'Quantities')[0].text), 'working shows the quantity step');
ok(/1 \/ 4 of the original/.test(rr.steps[2].text), 'working shows the fraction'); ok(/No initial quantity was entered/.test(run({ t: '20', T: '10' }).steps.filter((s) => s.title === 'Quantities')[0].text), 'working explains a missing quantity');
ok(/1 day = 24 h/.test(mx.steps[1].text) && /t = 3\u00a0days \u00d7 24 = 72\u00a0h/.test(mx.steps[1].text), 'working explains the unit conversion'); ok(!/different units/.test(rr.steps[1].text), 'no conversion text for equal units'); ok(/3 whole half-lives|2 whole half-lives|whole half-life/.test(run({ t: '25', T: '10' }).steps[2].text), 'working names the whole half-lives of a fractional n');

/* 7. the built pages and the mode strip */
const base = path.join(__dirname, '..', 'calculators'), page = path.join(base, 'decay-percentage-calculator', 'index.html');
if (fs.existsSync(page)) {
  const html = fs.readFileSync(page, 'utf8');
  eq((html.match(/<h1[ >]/g) || []).length, 1, 'page has one h1');
  ok(!/<script[^>]+src=\"https?:/i.test(html), 'no external scripts'); ok(!/<link[^>]+href=\"https?:/i.test(html), 'no external stylesheets or fonts');
  ok(html.indexOf('Elecmetric Half-Life Calculator, Mode 03') > 0 && html.indexOf('HalfLifePercent') > 0 && html.indexOf('Elecmetric Half-Life Calculator, Mode 01') > 0, 'both engines are inlined');
  ok(/id=\"dp-N0\"/.test(html) && /id=\"dp-t\"/.test(html) && /id=\"dp-T\"/.test(html) && /id=\"dp-tu\"/.test(html) && /id=\"dp-hu\"/.test(html), 'input fields and unit selectors');
  ok(/radiation-safety|radiation safety/i.test(html), 'scope statement present'); ok(/<title>[^<]*Decay Percentage/.test(html), 'title');
  ok(/href=\"\.\.\/half-life-calculator\/\"/.test(html) && /href=\"\.\.\/decay-constant-calculator\/\"/.test(html), 'links to Modes 01 and 02'); ok(/aria-current=\"page\"[^>]*>Mode 03/.test(html), 'mode strip marks Mode 03 current');
  ok(/href=\"\.\.\/decay-table-calculator\/\"/.test(html), 'Mode 04 is now a link');
  const mm = html.match(/data-ex=\"[^\"]*\"/g) || []; ok(mm.length >= 8, 'example chips present');
  mm.forEach((c) => { const d = JSON.parse(c.slice(9, -1).replace(/&quot;/g, '"').replace(/&amp;/g, '&')); ok(run({ N0: d.N0, t: d.t, T: d.T, timeUnit: d.tu, halfLifeUnit: d.hu, quantityUnit: d.qu }).ok, 'chip example runs: ' + c.slice(0, 60)); });
  ok((html.match(/<h3>/g) || []).length >= 12, 'twelve questions'); ok(/id=\"ladder\"/.test(html) && /id=\"formulas\"/.test(html) && /id=\"examples\"/.test(html) && /id=\"rules\"/.test(html), 'page sections');
  ['half-life-calculator', 'decay-constant-calculator'].forEach((d) => { const h = fs.readFileSync(path.join(base, d, 'index.html'), 'utf8'); ok(/href=\"\.\.\/decay-percentage-calculator\/\"/.test(h), d + ' page links to Mode 03'); ok(!/Mode 03 \u00b7 Decay Percentage Calculator \(coming\)/.test(h), d + ' page no longer marks Mode 03 as coming'); ok(/href=\"\.\.\/decay-table-calculator\/\"/.test(h), d + ' page links to Mode 04'); });
} else console.log('(page not built yet: skipping page checks)');

console.log(n + ' checks, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
