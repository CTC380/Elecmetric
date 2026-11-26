/* Tests for tools/halflife_table_engine.js (Half-Life Calculator, Mode 04: decay table and graph) against tests/halflife_table_vectors.json
   (independent: gen_halflife_table_vectors.py, Python decimal at 450 digits), the cases in the CEO product decision, the graph and the probe. Also checks the built pages.
   Run: node tests/halflife_table_test.js */
const fs = require('fs'), path = require('path');
const T = require('../tools/halflife_table_engine.js'), H = require('../tools/halflife_engine.js'), P = require('../tools/halflife_percent_engine.js'), V = require('./halflife_table_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 20) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const ok = (c, m) => { n++; if (!c) bad(m); };
/* the tolerance grows with the number of half-lives: n carries one rounding of 1.1e-16, and 2^(-n) multiplies that by n ln 2 */
const near = (a, b, m, nn = 0, base = 2e-14) => { n++; const e = Number(b), tol = Math.max((base + 2.5e-16 * nn) * Math.abs(e), 1e-322); if (!(Math.abs(a - e) <= tol)) bad(m + ': got ' + a + ', expected ' + e); };
const run = (o) => T.run(o), R = (o) => run(Object.assign({ halfLifeUnit: 'yr' }, o));

/* 1. independent vectors: every row, every scenario */
for (const v of V) {
  const r = run(v.in), tag = v.name;
  if (!r.ok) { bad(tag + ' errored: ' + r.error); continue; }
  eq(r.table.length, v.rows.length, tag + ' row count'); ok(r.check.ok, tag + ' built-in check failed');
  v.rows.forEach((x, i) => {
    const row = r.table[i]; near(row.t, x.t, tag + ' time row ' + i, 0, 1e-15 * 4);
    x.p.forEach((e, j) => {
      const q = row.p[j], en = Number(e.n), t2 = tag + ' row ' + i + ' scenario ' + j;
      near(q.n, e.n, t2 + ' n', 0, 1e-15 * 6); near(q.frac, e.rem, t2 + ' fraction', en, 4e-14); near(q.dec, e.dec, t2 + ' decayed', en, 4e-14);
      if (e.qty !== undefined) near(q.qty, e.qty, t2 + ' quantity', en, 4e-14); else ok(q.qty === undefined, t2 + ' has no quantity');
    });
  });
}

/* 2. the brief's cases and exactness */
const a = R({ T: '5730', N0: '100', basis: 'hl', step: '1', rows: '5' });
eq(a.table.map((x) => x.p[0].frac * 100).join(','), '100,50,25,12.5,6.25,3.125', 'the halving ladder 100, 50, 25, 12.5 ...'); eq(a.table[3].p[0].qty, 12.5, '100 g after three half-lives is exactly 12.5'); eq(a.table[5].t, 28650, 'time of row 5 is 5 x 5730'); eq(a.tmax, 28650, 'tmax');
for (let k = 0; k <= 60; k++) eq(R({ T: '7', basis: 'hl', step: '1', rows: '60' }).table[k].p[0].frac, Math.pow(2, -k), 'exact 2^-' + k);
const q = R({ T: '10', basis: 'hl', step: '0.25', rows: '16' }); eq(q.table[4].p[0].frac, 0.5, 'four quarter-steps is exactly one half-life'); eq(q.table[8].p[0].frac, 0.25, 'eight quarter-steps is two half-lives'); eq(q.table[4].t, 10, 'quarter-steps: row 4 is at T');
const tm = R({ T: '3', basis: 'time', step: '1', rows: '10', N0: '1000' }); eq(tm.table[3].p[0].frac, 0.5, 'T 3 yr: 50% at 3 yr'); eq(tm.table[3].p[0].qty, 500, 'T 3 yr: 500 left at 3 yr'); eq(tm.table[6].p[0].frac, 0.25, 'T 3 yr: 25% at 6 yr'); eq(tm.table[0].p[0].frac, 1, 'row 0 is 100%'); eq(tm.table[0].p[0].dec, 0, 'row 0 decays nothing'); eq(tm.table[0].t, 0, 'row 0 is at t = 0');
const cmp = R({ T: '5', TB: '10', basis: 'time', step: '5', rows: '4' }); eq(cmp.scen.length, 2, 'two scenarios'); eq(cmp.table.map((x) => x.p[0].frac).join(','), '1,0.5,0.25,0.125,0.0625', 'A halves every 5 yr'); eq(cmp.table[2].p[1].frac, 0.5, 'B: 50% at 10 yr'); eq(cmp.table[4].p[1].frac, 0.25, 'B: 25% at 20 yr'); near(cmp.table[1].p[1].frac, Math.SQRT1_2, 'B at half a half-life is 1/sqrt 2', 0.5);
const tri = R({ T: '2', TB: '4', TC: '8', basis: 'time', step: '2', rows: '4' }); eq(tri.scen.map((x) => x.id).join(''), 'ABC', 'three scenarios A B C'); eq(tri.table[4].p.map((x) => x.frac).join(','), '0.0625,0.25,0.5', 'A, B, C at 8 yr leave 1/16, 1/4, 1/2');
/* mixed units */
const mu = R({ T: '12', halfLifeUnit: 'h', TB: '1', unitB: 'd', basis: 'time', step: '1', tableUnit: 'd', rows: '3' }); eq(mu.tableUnit, 'd', 'table unit kept'); eq(mu.table[1].p[0].n, 2, 'a day is two half-lives of 12 h'); eq(mu.table[1].p[0].frac, 0.25, '12 h half-life leaves 25% after a day'); eq(mu.table[1].p[1].frac, 0.5, 'a 1-day half-life leaves 50% after a day'); eq(mu.table[2].p[1].frac, 0.25, 'B after 2 days');
const hl = R({ T: '1', basis: 'hl', step: '1', tableUnit: 'd', rows: '3' }); eq(hl.table[2].t, 730.5, 'half-life spacing shown in days: 2 years = 730.5 days'); eq(hl.table[2].p[0].frac, 0.25, 'half-life spacing is unaffected by the table unit');
eq(R({ T: '60', halfLifeUnit: 's', TB: '1', unitB: 'min', basis: 'time', step: '60', rows: '2' }).table[1].p[1].frac, 0.5, '60 s is one minute: B leaves 50%'); eq(run({ T: '5' }).halfLifeUnit, 'yr', 'default half-life unit is years'); eq(run({ T: '5', halfLifeUnit: '' }).halfLifeUnit, 'yr', 'empty half-life unit is years'); eq(run({ T: '5', rows: '', step: '' }).rows, 10, 'default 10 rows'); eq(run({ T: '5' }).step, 1, 'default step 1'); eq(run({ T: '5' }).basis, 'hl', 'default spacing is half-lives');
eq(run({ T: '5', TB: '10', unitB: 'same' }).scen[1].unit, 'yr', '\"same\" follows A'); eq(run({ T: '5', halfLifeUnit: 'd', TB: '10' }).scen[1].unit, 'd', 'omitted unit follows A');

/* 3. validation and limits */
eq(run({}).empty, true, 'empty input is flagged empty'); eq(run({ T: '  ' }).empty, true, 'blank half-life is empty'); eq(run({}).ok, false, 'empty is not a result');
eq(R({ T: '0' }).ok, false, 'zero half-life refused'); eq(R({ T: '0' }).field, 'T', 'zero half-life field'); eq(R({ T: '-3' }).ok, false, 'negative half-life refused');
eq(R({ T: '5', N0: '0' }).ok, false, 'zero quantity refused'); eq(R({ T: '5', N0: '0' }).field, 'N0', 'zero quantity field'); ok(/percentage of nothing/.test(R({ T: '5', N0: '0' }).error), 'zero quantity explained'); eq(R({ T: '5', N0: '-1' }).field, 'N0', 'negative quantity field'); eq(R({ T: '5' }).hasQty, false, 'no quantity is allowed'); eq(R({ T: '5' }).table[1].p[0].qty, undefined, 'no quantity, no quantity column');
['0', '-1'].forEach((x) => { eq(R({ T: '5', step: x }).ok, false, 'step ' + x + ' refused'); eq(R({ T: '5', step: x }).field, 'step', 'step ' + x + ' field'); });
['0', '-2', '201', '2.5', '1e3'].forEach((x) => { eq(R({ T: '5', rows: x }).ok, false, 'rows ' + x + ' refused'); eq(R({ T: '5', rows: x }).field, 'rows', 'rows ' + x + ' field'); }); eq(R({ T: '5', rows: '1' }).table.length, 2, 'one step is two rows'); eq(R({ T: '5', rows: '200' }).table.length, 201, '200 steps is 201 rows'); eq(R({ T: '5', rows: '2e1' }).ok, true, 'rows in exponent notation is a whole number');
['abc', 'Infinity', 'NaN', '1e999', '1/2', '5 g'].forEach((x) => { ['T', 'N0', 'step', 'rows', 'TB', 'TC'].forEach((f) => { const r = R(Object.assign({ T: '5', TB: '', TC: '' }, { [f]: x })); eq(r.ok, false, 'refuses ' + x + ' in ' + f); eq(r.field, f, x + ' names ' + f); }); });
eq(R({ T: '5', TB: '0' }).ok, false, 'zero half-life B refused'); eq(R({ T: '5', TB: '0' }).field, 'TB', 'zero half-life B field'); eq(R({ T: '5', TC: '-1' }).field, 'TC', 'negative half-life C field'); eq(R({ T: '5', TB: '', TC: '10' }).scen.length, 2, 'C without B still adds a scenario'); eq(R({ T: '5', TB: '  ' }).scen.length, 1, 'blank B is no scenario');
eq(run({ T: '5', halfLifeUnit: 'fortnight' }).ok, false, 'unknown half-life unit refused'); eq(run({ T: '5', tableUnit: 'fortnight', basis: 'time' }).ok, false, 'unknown table unit refused'); eq(R({ T: '5', TB: '1', unitB: 'fortnight' }).field, 'TB', 'unknown unit B names B');
eq(R({ T: '1e-300', basis: 'time', step: '1e300', rows: '5' }).ok, false, 'a ratio that cannot be represented is refused'); ok(/outside the range/.test(R({ T: '1e-300', basis: 'time', step: '1e300', rows: '5' }).error), 'range error explained'); eq(R({ T: '1e300', basis: 'hl', step: '1e10', rows: '200' }).ok, false, 'a time that overflows is refused'); eq(R({ T: '1e-300', TB: '1e300', unitB: 'Gyr', basis: 'time', step: '1e300', rows: '2', halfLifeUnit: 'ns', tableUnit: 'Gyr' }).ok, false, 'an overflowing B is refused');
eq(R({ T: '11,460', N0: '1e2', step: '1 ', rows: ' 4' }).ok, true, 'accepts grouped digits, exponent notation and spaces');
const un = R({ T: '1', basis: 'hl', step: '10', rows: '200' }); eq(un.ok, true, 'underflow is allowed'); ok(un.warnings.some((w) => w.code === 'UNDERFLOW_TO_ZERO'), 'underflow warned'); eq(un.table[200].p[0].frac, 0, 'underflow fraction is zero'); eq(un.table[200].p[0].dec, 1, 'underflow decayed is one'); ok(/\u2248 0%/.test(T.exportTxt(un)), 'underflow shown as about 0%');
ok(R({ T: '1', basis: 'hl', step: '1', rows: '40' }).warnings.length === 0 && R({ T: '5' }).warnings.length === 0, 'ordinary cases give no warnings');
near(R({ T: '1', basis: 'time', step: '1e-9', rows: '1' }).table[1].p[0].dec, Math.LN2 * 1e-9, 'tiny decay is not rounded to zero', 0, 1e-9); ok(R({ T: '1', basis: 'time', step: '1e-9', rows: '1' }).table[1].p[0].dec > 0, 'tiny decay is positive');

/* 4. the probe agrees with the table, and with Mode 03 */
const pr = R({ T: '5', TB: '8', halfLifeUnit: 'yr', unitB: 'd', basis: 'time', step: '2.5', rows: '8', N0: '300' });
pr.table.forEach((row) => { const at = T.at(pr, row.t); row.p.forEach((e, j) => { eq(at[j].frac, e.frac, 'probe equals table, row ' + row.i + ' scenario ' + j); eq(at[j].qty, e.qty, 'probe quantity equals table'); eq(at[j].n, e.n, 'probe n equals table'); }); });
eq(T.at(a, 0)[0].frac, 1, 'probe at zero'); eq(T.at(a, 5730)[0].frac, 0.5, 'probe at one half-life'); eq(T.at(a, 2865)[0].n, 0.5, 'probe at half a half-life'); eq(T.at(R({ T: '5' }), 7).length, 1, 'probe gives one entry per scenario'); eq(T.at(R({ T: '5' }), 7)[0].qty, undefined, 'probe has no quantity without N0');
[[100, 11460, 5730], [100, 30, 10], [1e6, 3, 10], [50, 30, 8.02], [7, 1e-6, 1], [100, 1000, 10]].forEach((c) => {
  const m3 = P.run({ N0: String(c[0]), t: String(c[1]), T: String(c[2]), timeUnit: 'yr' }), at = T.at(R({ T: String(c[2]), N0: String(c[0]), basis: 'time', step: '1', rows: '1' }), c[1])[0];
  eq(at.n, m3.sol.n, 'agrees with Mode 03: n ' + c); eq(at.frac, m3.sol.remFrac, 'agrees with Mode 03: fraction ' + c); eq(at.dec, m3.sol.decFrac, 'agrees with Mode 03: decayed ' + c); eq(at.qty, m3.sol.remQty, 'agrees with Mode 03: quantity ' + c);
});

/* 5. the graph */
const svgOk = (s, m) => { ok(/^<svg [^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(s) && /<\/svg>$/.test(s), m + ' is a closed svg'); ok(!/NaN|Infinity|undefined/.test(s), m + ' has no NaN, Infinity or undefined'); ok(!/var\(--/.test(s) && !/<script|onload=|href="http/i.test(s), m + ' is self-contained'); const tags = (s.match(/<(?!\/|!)[a-zA-Z]+/g) || []).length, closes = (s.match(/<\/[a-zA-Z]+>/g) || []).length + (s.match(/\/>/g) || []).length; eq(tags, closes, m + ' tags balance'); };
const g1 = T.graph(a, {}), g2 = T.graph(a, { log: true }), g3 = T.graph(tri, { probe: 4 }), g4 = T.graph(un, { log: true });
svgOk(g1, 'linear graph'); svgOk(g2, 'log graph'); svgOk(g3, 'three-scenario graph with a probe'); svgOk(g4, 'underflow log graph');
eq((g1.match(/<polyline/g) || []).length, 1, 'one curve per scenario (1)'); eq((g3.match(/<polyline/g) || []).length, 3, 'one curve per scenario (3)'); ok(/stroke-dasharray="8 4"/.test(g3) && /stroke-dasharray="2 4"/.test(g3), 'scenarios B and C are dashed and dotted'); ok(/<title id="dt-gt">/.test(g1) && /<desc id="dt-gd">/.test(g1) && /role="img"/.test(g1), 'graph has a title, description and role');
ok(/100%/.test(g1) && />0%</.test(g1) && /Time \(years\)/.test(g1), 'linear axis labels'); ok(/log scale/.test(g2) && />100%</.test(g2) && />1%</.test(g2), 'log axis labels'); ok(!/stroke-dasharray="3 3"/.test(g1) && /stroke-dasharray="3 3"/.test(g3), 'the probe line is drawn only when asked'); eq((g3.match(/r="5"/g) || []).length, 3, 'one probe dot per scenario'); ok((g1.match(/<circle/g) || []).length === 6, 'markers at the six table rows');
ok(T.graph(R({ T: '5', rows: '100' }), {}).indexOf('<circle') < 0, 'no row markers beyond 60 rows'); eq(T.graph(a, { probe: -1 }).indexOf('r="5"'), -1, 'a probe outside the range is not drawn'); eq(T.graph(a, { probe: 1e9 }).indexOf('r="5"'), -1, 'a probe beyond the end is not drawn');
const pts = (g) => g.match(/points="([^"]*)"/)[1].split(' ').map((x) => x.split(',').map(Number)); const lp = pts(g1); eq(lp.length, 241, 'curve has 241 points'); ok(lp.every((x) => x[1] >= 38 - 0.1 && x[1] <= 38 + 324 + 0.1), 'linear curve stays inside the plot'); ok(lp.every((x, i) => i === 0 || x[1] >= lp[i - 1][1]), 'linear curve never rises'); ok(lp.every((x, i) => i === 0 || x[0] > lp[i - 1][0]), 'curve moves right');
const lg = pts(g2), x0 = lg[0], x1 = lg[lg.length - 1], dev = Math.max.apply(null, lg.map((x) => Math.abs(x[1] - (x0[1] + (x1[1] - x0[1]) * (x[0] - x0[0]) / (x1[0] - x0[0]))))); ok(dev < 0.11, 'on the log axis the decay is a straight line (largest deviation ' + dev.toFixed(3) + ' px, the rounding of the coordinates)'); const un1 = pts(g4); ok(un1.every((x) => x[1] >= 38 - 0.1 && x[1] <= 38 + 324 + 0.1 || x[1] > 0), 'underflow curve is finite'); ok(T.graph(R({ T: '1', basis: 'hl', step: '300', rows: '200' }), { log: true }).indexOf('NaN') < 0, 'a 60,000-half-life log graph has no NaN');
const e1 = T.graph(R({ T: '<b>&' + '5' }).ok ? a : a, {}); ok(!/<b>/.test(e1), 'no raw markup in the graph');
eq(T.graph(a, { width: 400, height: 300 }).indexOf('viewBox="0 0 400 300"') > 0, true, 'custom size');

eq((g1.match(/class=\"hlm\"/g) || []).length, 5, 'half-life markers: one per whole half-life of A (5 rows)'); eq((T.graph(R({ T: '1', rows: '40' }), {}).match(/class=\"hlm\"/g) || []).length, 0, 'no markers when more than 12 half-lives are in view'); eq((T.graph(R({ T: '3', basis: 'time', step: '1', rows: '10' }), {}).match(/class=\"hlm\"/g) || []).length, 3, 'markers at 3, 6 and 9 yr for T 3 yr'); ok(/>3 T\u00bd</.test(g1), 'marker label');
/* 6. properties */
let seed = 4321; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
for (let i = 0; i < 600; i++) {
  const Tv = Math.pow(10, rnd() * 8 - 4), u = H.TIME_UNITS[Math.floor(rnd() * H.TIME_UNITS.length)][0], N0 = Math.pow(10, rnd() * 10 - 5), st = Math.pow(10, rnd() * 2 - 1), rows = 1 + Math.floor(rnd() * 40), bs = rnd() < .5 ? 'hl' : 'time';
  const B = Tv * Math.pow(10, rnd() * 2 - 1), r = run({ T: String(Tv), halfLifeUnit: u, N0: String(N0), basis: bs, step: String(bs === 'hl' ? st : st * Tv), rows: String(rows), TB: String(B), unitB: u });
  if (!r.ok) { bad('property case failed ' + Tv + ' ' + r.error); continue; }
  ok(r.check.ok, 'built-in check #' + i); eq(r.table.length, rows + 1, 'row count #' + i);
  r.table.forEach((row, k) => {
    row.p.forEach((e, j) => {
      near(e.frac + e.dec, 1, 'remaining + decayed = 1 #' + i + ',' + k, 0, 1e-15); near(e.qty + e.decQty, N0, 'quantities add up #' + i + ',' + k, 0, 1e-15); ok(e.frac >= 0 && e.frac <= 1 && e.dec >= 0 && e.dec <= 1, 'fractions in range #' + i);
      if (k > 0) { const pv = r.table[k - 1].p[j]; ok(e.frac < pv.frac || e.frac === 0, 'strictly falling #' + i + ',' + k); ok(row.t > r.table[k - 1].t, 'time rises #' + i); }
    });
    if (k > 0) ok(row.p[1].frac <= row.p[0].frac * (B >= Tv ? 1e300 : 1) || B >= Tv, 'a shorter half-life leaves less #' + i);
  });
  /* evenly spaced rows multiply: f(row 2) = f(row 1)^2 */
  if (rows >= 2) near(r.table[2].p[0].frac, r.table[1].p[0].frac * r.table[1].p[0].frac, 'f(2 steps) = f(1 step)^2 #' + i, r.table[2].p[0].n, 1e-13);
}

/* 7. exports and working */
const rr = run({ T: '5730', halfLifeUnit: 'yr', N0: '100', quantityUnit: 'g', basis: 'hl', step: '1', rows: '3', sig: 6 });
const csv = T.exportCsv(rr).split('\r\n'); eq(csv[0], 'Row,Time (years),Half-lives,Remaining %,Decayed %,Remaining quantity (g)', 'csv header'); eq(csv[1], '0,0,0,100,0,100', 'csv row 0'); eq(csv[2], '1,5730,1,50,50,50', 'csv row 1'); eq(csv[4], '3,17190,3,12.5,87.5,12.5', 'csv row 3'); eq(csv.length, 6, 'csv has header, four rows and a trailing newline');
eq(T.exportCsv(R({ T: '5', TB: '10', rows: '2' })).split('\r\n')[0], 'Row,Time (years),Half-lives A,Remaining % A,Decayed % A,Half-lives B,Remaining % B,Decayed % B', 'csv header with two scenarios and no quantity'); eq(T.exportCsv(R({ T: '5', rows: '2' })).split('\r\n')[0], 'Row,Time (years),Half-lives,Remaining %,Decayed %', 'csv header without a quantity');
const js = JSON.parse(T.exportJson(rr)); eq(js.rows.length, 4, 'json rows'); eq(js.rows[3].values[0].remainingPercentage, 12.5, 'json remaining percentage'); eq(js.rows[3].values[0].remainingQuantity, 12.5, 'json remaining quantity'); eq(js.initialQuantity, 100, 'json initial quantity'); eq(js.scenarios[0].halfLife, 5730, 'json half-life'); eq(JSON.parse(T.exportJson(R({ T: '5', rows: '2' }))).initialQuantity, undefined, 'json has no quantity without N0'); eq(js.spacing, 'half-lives of scenario A', 'json spacing');
const tx = T.exportTxt(rr); ok(/Scenario A: half-life 5,730 years/.test(tx) && /12\.5%/.test(tx) && /THE DECAY LAW/.test(tx) && /radiation-safety/.test(tx), 'txt content'); ok(/Initial quantity: 100 g/.test(tx), 'txt quantity');
rr.steps.forEach((s) => ok(s.title && s.text, 'step has a title and text')); ok(rr.steps.some((s) => s.title === 'Check'), 'working includes the check'); ok(/n = i \u00d7 1/.test(rr.steps[1].text), 'working explains half-life spacing'); ok(/N\u209c = 100\u00a0g \u00d7 0\.5 = 50\u00a0g/.test(rr.steps[2].text), 'working shows the sample row with the user\u2019s numbers');
ok(/t = i \u00d7 1/.test(tm.steps[1].text) && /n = t \/ T\u00bd/.test(tm.steps[1].text), 'working explains time spacing'); ok(cmp.steps.some((s) => s.title === 'Scenarios' && /B: T\u00bd = 10/.test(s.text)), 'working lists the scenarios'); ok(!rr.steps.some((s) => s.title === 'Scenarios'), 'no scenario step for one scenario');

/* 8. the built pages and the mode strip */
const base = path.join(__dirname, '..', 'calculators'), page = path.join(base, 'decay-table-calculator', 'index.html');
if (fs.existsSync(page)) {
  const html = fs.readFileSync(page, 'utf8');
  eq((html.match(/<h1[ >]/g) || []).length, 1, 'page has one h1'); ok(!/<script[^>]+src=\"https?:/i.test(require('./approved_remote.js').stripApproved(html)), 'no external scripts'); ok(!/<link[^>]+href=\"https?:/i.test(html), 'no external stylesheets or fonts');
  ok(html.indexOf('Elecmetric Half-Life Calculator, Mode 04') > 0 && html.indexOf('HalfLifeTable') > 0 && html.indexOf('Elecmetric Half-Life Calculator, Mode 01') > 0, 'both engines are inlined');
  ['T', 'hu', 'N0', 'qu', 'basis', 'step', 'rows', 'tbu', 'TB', 'uB', 'TC', 'uC', 'sig', 'log', 'probe', 'graph', 'rd', 'out', 'steps', 'hist', 'err'].forEach((k) => ok(new RegExp('id=\"dt-' + k + '\"').test(html), 'element dt-' + k));
  ok(/radiation-safety|radiation safety/i.test(html), 'scope statement present'); ok(/<title>[^<]*Decay Table and Graph/.test(html), 'title');
  ok(/href=\"\.\.\/half-life-calculator\/\"/.test(html) && /href=\"\.\.\/decay-constant-calculator\/\"/.test(html) && /href=\"\.\.\/decay-percentage-calculator\/\"/.test(html), 'links to Modes 01 to 03'); ok(/aria-current=\"page\"[^>]*>Mode 04/.test(html), 'mode strip marks Mode 04 current'); ok(/href=\"\.\.\/engineering-exponential-decay-calculator\/\"[^>]*>Mode 05/.test(html) && !/Mode 05 \u00b7 Engineering Exponential Decay \(coming\)/.test(html), 'Mode 05 is now a link'); ok(!/Mode 04 \u00b7 Decay Table &amp; Graph \(coming\)|Mode 04 \u00b7 Decay Table & Graph \(coming\)/.test(html), 'Mode 04 is not marked as coming');
  const mm = html.match(/data-ex=\"[^\"]*\"/g) || []; ok(mm.length >= 9, 'example chips present');
  mm.forEach((c) => { const d = JSON.parse(c.slice(9, -1).replace(/&quot;/g, '"').replace(/&amp;/g, '&')); ok(run({ T: d.T, halfLifeUnit: d.hu, N0: d.N0, quantityUnit: d.qu, basis: d.basis, step: d.step, rows: d.rows, tableUnit: d.basis === 'time' ? d.tbu : 'same', TB: d.TB, unitB: d.uB, TC: d.TC, unitC: d.uC }).ok, 'chip example runs: ' + c.slice(0, 60)); });
  ok((html.match(/<h3>/g) || []).length >= 10, 'ten questions'); ok(/id=\"ladder\"/.test(html) && /id=\"formulas\"/.test(html) && /id=\"examples\"/.test(html) && /id=\"rules\"/.test(html) && /id=\"reading\"/.test(html), 'page sections');
  ok(/type=\"range\"/.test(html) && /type=\"checkbox\" id=\"dt-log\"/.test(html), 'probe slider and log switch'); ok(/data-dl=\"svg\"/.test(html) && /data-dl=\"png\"/.test(html) && /data-dl=\"csv\"/.test(html), 'graph and table downloads');
  ['half-life-calculator', 'decay-constant-calculator', 'decay-percentage-calculator'].forEach((d) => { const h = fs.readFileSync(path.join(base, d, 'index.html'), 'utf8'); ok(/href=\"\.\.\/decay-table-calculator\/\"/.test(h), d + ' page links to Mode 04'); ok(!/Mode 04 \u00b7 Decay Table &amp; Graph \(coming\)|Mode 04 \u00b7 Decay Table & Graph \(coming\)/.test(h), d + ' page no longer marks Mode 04 as coming'); ok(/href=\"\.\.\/engineering-exponential-decay-calculator\/\"/.test(h), d + ' page links to Mode 05'); });
  ['sw.js', 'sitemap.xml'].forEach((f) => ok(fs.readFileSync(path.join(__dirname, '..', f), 'utf8').indexOf('decay-table-calculator') > 0, f + ' lists the page'));
} else console.log('(page not built yet: skipping page checks)');

console.log(n + ' checks, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
