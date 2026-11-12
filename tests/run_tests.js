#!/usr/bin/env node
/* Elecmetric test runner for CI.  Usage: node tests/run_tests.js   (exit code 1 on any failure)
   1. built-in self-tests of every calculator
   2. independent reference vectors (tests/gen_vectors.py, written from textbook formulas)
   3. property tests: round trips, monotonicity, unit invariance, scaling laws */
const path = require('path'), fs = require('fs');
const E = require(path.join(__dirname, '..', 'engine.js'));
let fails = 0, total = 0;
const ok = (cond, msg) => { total++; if (!cond) { fails++; console.log('  FAIL', msg); } };
/* The site-wide footer nav (footer.mf) links to many pages; its links are checked by their own test ("footer navigation"), so the per-page link scans below skip it. */
const noFoot = (h) => String(h).replace(/<footer class="mf">[\s\S]*?<\/footer>/g, '');
const close = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(Math.abs(b), 1e-300);

console.log('Engine', E.VERSION, '·', E.CALCS.length, 'calculators');

/* 1 */
let t1 = 0, p1 = 0;
E.CALCS.forEach((c) => { const r = E.runTests(c); t1 += r.total; p1 += r.passed; r.failures.forEach((f) => console.log('  FAIL self-test', c.id, f.name, f.detail || '')); });
total += t1; fails += t1 - p1; console.log('1. built-in self-tests:', p1 + '/' + t1);

/* 2 */
const vec = JSON.parse(fs.readFileSync(path.join(__dirname, 'reference_vectors.json'), 'utf8'));
let n2 = 0, bad2 = 0;
vec.forEach((v, n) => {
  const r = E.api(v.id, v.in); n2++;
  if (!r.ok) { bad2++; console.log('  FAIL vector', n, v.id, 'rejected', JSON.stringify(r.errors)); return; }
  Object.keys(v.out).forEach((k) => { if (!r.outputs[k] || !close(r.outputs[k].value, v.out[k], v.tol)) { bad2++; console.log('  FAIL vector', n, v.id, k, 'engine', r.outputs[k] && r.outputs[k].value, 'reference', v.out[k], 'in', JSON.stringify(v.in)); } });
});
total += n2; fails += bad2; console.log('2. independent reference vectors:', (n2 - bad2) + '/' + n2, '(' + new Set(vec.map((v) => v.id)).size + ' calculators)');

/* 3 properties */
const out = (id, p, k) => E.api(id, p).outputs[k].value;
let pt = 0; const P = (c, m) => { pt++; ok(c, m); };
for (let i = 1; i <= 40; i++) {
  const Pw = 5 * i, V = 230 + 10 * i, pf = 0.5 + i / 100;
  const I = out('three-phase-current', { P: Pw, V, pf, phase: 3, eff: 1 }, 'I');
  P(close(out('amps-to-kw', { I, V, pf, phase: 3 }, 'P'), Pw, 1e-9), 'kW→A→kW round trip ' + i);
  P(out('three-phase-current', { P: Pw * 2, V, pf, phase: 3, eff: 1 }, 'I') > I, 'current rises with power ' + i);
  P(out('three-phase-current', { P: Pw, V: V * 2, pf, phase: 3, eff: 1 }, 'I') < I, 'current falls with voltage ' + i);
  P(close(out('three-phase-current', { P: Pw, V: V, pf, phase: 3, eff: 1 }, 'I'), out('three-phase-current', { P: Pw * 1000, PUnit: 'W', V: V / 1000, VUnit: 'kV', pf, phase: 3, eff: 1 }, 'I'), 1e-9), 'unit invariance W/kV ' + i);
  P(close(out('three-phase-current', { P: Pw, V, pf, phase: 1, eff: 1 }, 'I') / I, Math.sqrt(3), 1e-9), 'single/three phase ratio is √3 ' + i);
  const L = 20 + 10 * i, a = { I: 100, L, R: 0.3, X: 0.08, V: 400, pf: 0.9, phase: 3 }, b = Object.assign({}, a, { L: L * 2 });
  P(close(out('voltage-drop', b, 'Vd'), 2 * out('voltage-drop', a, 'Vd'), 1e-9), 'voltage drop is linear in length ' + i);
  P(out('voltage-drop', Object.assign({}, a, { R: 0.6 }), 'Vd') > out('voltage-drop', a, 'Vd'), 'voltage drop rises with resistance ' + i);
  const S = 100 + 20 * i, Z = 3 + i / 10;
  P(out('fault-current', { S, V: 415, Z }, 'Isc') > out('fault-current', { S, V: 415, Z: Z + 1 }, 'Isc'), 'fault current falls as impedance rises ' + i);
  P(close(out('fault-current', { S: S * 2, V: 415, Z }, 'Isc'), 2 * out('fault-current', { S, V: 415, Z }, 'Isc'), 1e-9), 'fault current scales with kVA ' + i);
  const R1 = 10 + i, R2 = 20 + i;
  P(out('resistance-parallel', { R1, R2, R3: 50 }, 'Rt') < Math.min(R1, R2, 50), 'parallel resistance is below the smallest branch ' + i);
  P(close(out('resistance-series', { R1, R2, R3: 50 }, 'Rt'), R1 + R2 + 50, 1e-12), 'series resistance adds ' + i);
  const a1 = E.api('pf-correction-kvar', { P: 100, pf1: 0.7, pf2: 0.8 }).outputs.Qc.value, a2 = E.api('pf-correction-kvar', { P: 100, pf1: 0.7, pf2: 0.95 }).outputs.Qc.value;
  P(a2 > a1 && a1 > 0, 'correction kVAR grows with target PF ' + i);
}
total += pt; console.log('3. property tests:', pt + '/' + pt, 'checked');

/* Every calculator: defaults compute, outputs finite, every "next" link resolves, ids unique */
const ids = new Set();
E.CALCS.forEach((c) => {
  ok(!ids.has(c.id), 'duplicate id ' + c.id); ids.add(c.id);
  const r = E.calculate(c, E.defaultsRaw(c));
  ok(r.ok && r.outputs.every((o) => isFinite(o.value) || c.allowNaN), c.id + ' defaults produce finite outputs');
  c.next.forEach((n) => ok(E.BY_ID[n], c.id + ' links to unknown calculator ' + n));
  ok(c.formula && c.assumptions && c.assumptions.length && c.tests.length >= 1, c.id + ' has formula, assumptions and a reference test');
});
console.log('4. registry integrity: ' + E.CALCS.length + ' calculators checked');

/* 5. calculation bases: Feeder Designer must follow the chosen basis (table ambient, rule, limits) */
let b5 = 0; const B = (c, m) => { b5++; ok(c, m); };
const feeder = (basis, extra) => E.runFeeder(Object.assign({ basis, P: [250, 'kW'], V: [400, 'V'], pf: 0.9, L: [180, 'm'], R: [0.0601, 'Ω/km'], X: [0.08, 'Ω/km'], limit: 3, S: [1000, 'kVA'], Z: 5, pf2: 0.97, A: [300, 'mm²'], Itab: [750, 'A'], Ta: 40, kg: 0.8, mat: 2, t: [0.5, 's'] }, extra || {}));
const izStep = (r) => r.steps.find((s) => s.id === 'cable-derating').value;
const tref = { 1: 30, 4: 40, 5: 30, 6: 40, 2: 30 };
[1, 4, 5, 6, 2].forEach((bs) => {
  const r = feeder(bs); B(r.ok, 'feeder runs under basis ' + bs);
  const kt = Math.sqrt((90 - 40) / (90 - tref[bs]));
  B(close(izStep(r), 750 * kt * 0.8, 1e-9), 'feeder derating uses table ambient ' + tref[bs] + ' °C under basis ' + bs);
  B(r.report.indexOf(E.BASES[bs].name) >= 0 && r.report.indexOf('table reference ambient ' + tref[bs]) >= 0, 'feeder sheet states basis constants for basis ' + bs);
});
B(E.runFeeder({ basis: 3 }).ok === false, 'feeder rejects the user-defined basis');
/* Issue 1: breaker interrupting capacity must be compared with the fault level; nothing may claim ALL CHECKS PASS while checks are pending */
const stp = (r, id) => r.steps.find((x) => x.id === id);
const f0 = feeder(1), f36 = feeder(1, { Icu: [36, 'kA'] }), f25 = feeder(1, { Icu: [25, 'kA'] });
B(f0.ok && !f0.failed && f0.statusText === 'MODELED CHECKS PASSED | BREAKER INTERRUPTING CAPACITY NOT VERIFIED | LET-THROUGH ENERGY NOT VERIFIED | PICK-UP NOT VERIFIED | EARTH FAULT LOOP NOT VERIFIED | TRIP CHARACTERISTICS AND SELECTIVITY NOT CHECKED', 'no Icu entered: modeled checks pass but interrupting capacity is NOT VERIFIED');
B(stp(f0, 'breaker-icu').status === 'pending' && /not verified/.test(stp(f0, 'breaker-icu').badge), 'no Icu entered: breaker step is pending, not pass');
B(f36.ok && !f36.failed && stp(f36, 'breaker-icu').status === 'pass' && f36.statusText === 'MODELED CHECKS PASSED | LET-THROUGH ENERGY NOT VERIFIED | PICK-UP NOT VERIFIED | EARTH FAULT LOOP NOT VERIFIED | TRIP CHARACTERISTICS AND SELECTIVITY NOT CHECKED', '36 kA breaker above the 28.87 kA fault passes the Icu check');
B(f25.failed && stp(f25, 'breaker-icu').status === 'fail' && f25.statusText === 'ONE OR MORE CHECKS FAIL', '25 kA breaker below the 28.87 kA fault fails the whole feeder');
B(feeder(1, { Icu: [28.9, 'kA'] }).failed === false && feeder(1, { Icu: [28.8, 'kA'] }).failed === true, 'Icu check switches between 28.8 kA and 28.9 kA around the 28.87 kA fault');
B(feeder(1, { Icu: [36, 'kA'], A: [95, 'mm²'] }).failed === true, 'a good breaker does not hide a failing cable check');
B([f0, f36, f25].every((r) => stp(r, 'breaker-trip').status === 'pending' && stp(r, 'breaker-selectivity').status === 'pending'), 'trip characteristics and selectivity are always marked not checked');
B(E.runFeeder(Object.assign({}, { basis: 1, Icu: [0, 'kA'] })).ok === false, 'zero breaking capacity is rejected');
B([f0, f36, f25].every((r) => r.report.indexOf('ALL CHECKS PASS') < 0) && /\[NOT VERIFIED\]/.test(f0.report) && /\[NOT CHECKED\]/.test(f0.report) && /Checks not performed/.test(f0.report), 'calculation sheet marks pending checks and never says ALL CHECKS PASS');
B(/Icu\/Ics 36 kA/.test(f36.report) && /not entered/.test(f0.report), 'calculation sheet records the breaker Icu input');
B(feeder(2).steps.find((s) => s.id === 'breaker-size').headline !== feeder(1).steps.find((s) => s.id === 'breaker-size').headline, 'NEC-style continuous-load factor still changes the breaker');
B(feeder(5, { limit: 6 }).steps.find((s) => s.id === 'voltage-drop').check.indexOf('5%') >= 0, 'BS 7671 flags a voltage-drop limit above 5%');
B(feeder(1, { limit: 6 }).steps.find((s) => s.id === 'voltage-drop').check.indexOf('commonly used') < 0, 'General basis adds no voltage-drop advisory');
const w = (bs, Tr) => E.calculate(E.BY_ID['cable-derating'], Object.assign(E.defaultsRaw(E.BY_ID['cable-derating']), { basis: bs, Tref: [Tr, ''] })).warnings.join('|');
B(/usually refer to 40/.test(w(6, 30)), 'AS/NZS warns when table ambient is 30 °C');
B(w(6, 40) === '', 'AS/NZS no table-ambient warning at 40 °C');
B(!/usually refer/.test(w(3, 55)), 'user-defined basis never gets a table-ambient warning');
total += b5; console.log('5. calculation bases:', b5 + '/' + b5, 'checked');
/* 6. number input reader (F6) and digit grouping (F7) */
let n6 = 0; const N = (c, m) => { n6++; ok(c, m); };
const rd = (x) => E.readNumber(x);
[['5e3', 5000], ['1.5e-3', 0.0015], ['-2.5', -2.5], ['.5', 0.5], ['5.', 5], ['  42  ', 42], ['1,000', 1000], ['1,234,567.89', 1234567.89], ['1,00,000', 100000], ['12,34,567', 1234567], ['1 000', 1000], ['+7', 7]]
  .forEach(([i, o]) => N(rd(i).v === o, 'reads "' + i + '" as ' + o));
['0x10', '0b101', '0o17', '-0x1F', '1,5', '1,50', '12,34', '1,00', '1,,000', ',5', '1.2.3', 'abc', '1e', 'Infinity', '1e999', '--5', '5-', '1_000']
  .forEach((i) => N(!!rd(i).err, 'rejects "' + i + '"'));
N(rd('').empty === true && rd('   ').empty === true, 'blank input is reported as empty, not 0');
N(/decimal point/.test(rd('1,5').err), 'decimal-comma message tells the user what to do');
N(/hexadecimal/.test(rd('0x10').err), 'hex message names the problem');
const pr = (v) => E.api('amps-to-kw', { I: v, V: 400, pf: 0.9, phase: 3 });
N(pr('0x10').ok === false && /Current/i.test(pr('0x10').errors[0].msg), 'engine rejects hex through parse()');
N(pr('1,000').ok === true && Math.abs(pr('1,000').outputs.P.value - pr(1000).outputs.P.value) < 1e-9, 'engine accepts 1,000 same as 1000');
N(pr('   ').ok === false && /required/.test(pr('   ').errors[0].msg), 'whitespace-only input is "required", not zero');
E.setGrouping('indian'); N(E.fmt(1732050000, 0) === '1,73,20,50,000', 'Indian grouping');
E.setGrouping('intl'); N(E.fmt(1732050000, 0) === '1,732,050,000', 'International grouping');
N(E.fmt(1234.5, 2) === '1,234.5' && E.fmt(0.5, 2) === '0.5', 'point is always the decimal separator');
N(E.fmt(1e16, 2) === '1.000e16', 'scientific notation unchanged by grouping');
N(E.getGrouping() === 'intl', 'getGrouping reflects the setting');
N(E.detectGrouping('en-IN') === 'indian' && E.detectGrouping('hi-IN') === 'indian' && E.detectGrouping('en-US') === 'intl' && E.detectGrouping('de-DE') === 'intl' && E.detectGrouping('') === 'intl', 'browser-locale detection');
E.setGrouping('bogus'); N(E.getGrouping() === 'indian', 'unknown value falls back to indian');
E.setGrouping('indian');
total += n6; console.log('6. number reader and grouping:', n6 + '/' + n6, 'checked');
/* 7. AWG chart and size-to-AWG lookup. Anchors are published AWG table values (from the definition d = 0.127 mm x 92^((36-n)/39)), not read from engine.js. */
let n7 = 0; const G = (c, m) => { n7++; ok(c, m); };
const chart = E.awgChart(), row = (n) => chart.find((r) => r.n === n);
G(chart.length === 44 && chart[0].n === -3 && chart[43].n === 40, 'chart lists 44 sizes, AWG 0000 to 40');
G(['0000', '000', '00', '0', '1'].join() === chart.slice(0, 5).map((r) => r.label).join(), 'labels: 0000, 000, 00, 0, 1');
[[-3, 11.684, 0.4600, 107.2, 211.6], [0, 8.2515, 0.3249, 53.48, 105.6], [10, 2.5882, 0.1019, 5.261, 10.38], [20, 0.8118, 0.0320, 0.5176, 1.022], [30, 0.2546, 0.0100, 0.0509, 0.1005], [36, 0.1270, 0.0050, 0.01267, 0.025], [40, 0.0799, 0.0031, 0.005011, 0.009888]]
  .forEach(([n, dm, di, a, k]) => {
    const r = row(n), rel = (x, y) => Math.abs(x - y) / y;
    G(rel(r.dMm, dm) < 6e-4 && rel(r.dIn, di) < 2e-2 && rel(r.AMm2, a) < 2e-3 && rel(r.kcmil, k) < 6e-3, 'AWG ' + r.label + ' matches the published table');
  });
chart.forEach((r) => { G(Math.abs(r.dIn - r.dMm / 25.4) < 1e-12 && Math.abs(r.kcmil - (r.dIn * 1000) ** 2 / 1000) < 1e-9 * r.kcmil && Math.abs(r.AMm2 - r.kcmil * 0.5067075) < 1e-6 * r.AMm2, 'AWG ' + r.label + ' diameter, kcmil and mm² agree with each other'); });
const ratio = 92 ** (1 / 39);
G(chart.slice(1).every((r, i) => Math.abs(chart[i].dMm / r.dMm - ratio) < 1e-9), 'diameter steps by 92^(1/39) per gauge');
G(Math.abs(row(10).AMm2 / row(13).AMm2 - 2.0050) < 1e-3 && Math.abs(row(4).dMm / row(10).dMm - 2.0050) < 1e-3, 'three gauges roughly halve the area, six roughly halve the diameter');
G(Math.abs(row(10).ohmPerKm - 3.2770) < 1e-3 && Math.abs(row(10).ohmPerKm * row(10).AMm2 - 17.241) < 1e-9, 'copper resistance is rho/A (17.241 ohm·mm²/km)');
chart.forEach((r) => { const f = E.awgFromArea(r.AMm2); G(f.ok && f.nearest.n === r.n && f.nextLarger.n === r.n, 'area of AWG ' + r.label + ' looks up to itself'); });
G(E.awgFromArea(5.2612).nextLarger.n === 10 && E.awgFromArea(5.27).nextLarger.n === 9 && E.awgFromArea(5.27).nearest.n === 10, 'size typed to 4 digits maps to its AWG; slightly larger needs the next size up');
G(E.awgFromArea(6).nearest.n === 9 && E.awgFromArea(6).nextLarger.n === 9 && E.awgFromArea(4).nextLarger.n === 11, 'lookup: 6 mm² -> AWG 9; 4 mm² -> smallest sufficient AWG 11 (4.17 mm²)');
G(E.awgFromArea(107.3).ok === true && E.awgFromArea(107.3).nextLarger === null, 'just above AWG 0000: nearest exists, no sufficient size');
['0', '-1', 'abc', 200, 0.004, NaN, Infinity].forEach((x) => G(E.awgFromArea(x).ok === false, 'lookup rejects ' + String(x)));
total += n7; console.log('7. AWG chart:', n7 + '/' + n7, 'checked');

/* 8. Landing pages (F8). Expected values are textbook formulas written here, not read from engine.js or the generator. */
let n8 = 0; const L = (c, m) => { n8++; ok(c, m); };
const { build: buildPages } = require('../tools/build_pages.js');
const built = buildPages({ base: '' }), PG = built.pages;   /* base '' so a BASE_URL in the environment cannot change what is compared with the committed files */
const SLUGS = ['amps-to-kw','amps-to-kva','amps-to-va','amps-to-volts','amps-to-watts','electricity-bill','energy-consumption','energy-cost','ev-to-volts','joules-to-watts','joules-to-volts','kva-to-amps','kva-to-watts','kva-to-kw','kva-to-va','kw-to-amps','kw-to-volts','kw-to-kwh','kw-to-va','kw-to-kva','kwh-to-kw','kwh-to-watts','mah-to-wh','ohms-law','power-calculator','power-factor','va-to-amps','va-to-watts','va-to-kw','va-to-kva','voltage-divider','voltage-drop','volts-to-amps','volts-to-watts','volts-to-kw','volts-to-joules','volts-to-ev','watts-volts-amps-ohms','watts-to-amps','watts-to-joules','watts-to-kwh','watts-to-volts','watts-to-va','watts-to-kva','wh-to-mah','wire-gauge','amps-to-ohms','ohms-to-amps','volts-to-ohms','ohms-to-volts','kw-to-wh','wh-to-kw','kw-to-joules','joules-to-kw','kj-to-watts','watts-to-kj','kw-to-kj','kj-to-kw','watts-to-wh','wh-to-watts','lumens-to-lux','lux-to-lumens','candela-to-lux','lux-to-candela','lumens-to-candela','candela-to-lumens','lumens-to-watts','watts-to-lumens','lux-to-watts','watts-to-lux','lumens-to-millicandela','millicandela-to-lumens','ah-to-wh','wh-to-ah','ah-to-kwh','kwh-to-ah','hp-to-amps','amps-to-hp'];
L(SLUGS.length === 78 && new Set(SLUGS).size === 78, 'the 78 conversion intents (72 earlier ones and the 6 added in v1.44.0: Ah, Wh and kWh, and HP and amps) are listed once each');
L(SLUGS.every((s) => PG[s + '.html']) && Object.keys(PG).filter((f) => /\.html$/.test(f)).length === 79, 'one page per intent plus the hub, nothing else');
const sq3 = Math.sqrt(3);
const EXPECT = { 'amps-to-kw': sq3 * 400 * 100 * 0.9 / 1000, 'kw-to-amps': 100000 / (sq3 * 400 * 0.9), 'amps-to-kva': sq3 * 415 * 100 / 1000, 'kva-to-amps': 500000 / (sq3 * 415), 'amps-to-va': 2300, 'va-to-amps': 10,
  'amps-to-volts': 2070 / (10 * 0.9), 'volts-to-amps': 2070 / (230 * 0.9), 'amps-to-watts': 10 * 230 * 0.9, 'watts-to-amps': 2070 / (230 * 0.9), 'kva-to-watts': 100000 * 0.8, 'watts-to-kva': 80000 / 0.8 / 1000,
  'kva-to-kw': 100 * 0.8, 'kw-to-kva': 80 / 0.8, 'kva-to-va': 5000, 'va-to-kva': 5, 'kw-to-volts': 2070 / (10 * 0.9), 'volts-to-kw': 230 * 10 * 0.9 / 1000, 'kw-to-kwh': 2 * 5, 'kwh-to-kw': 12 / 4,
  'kw-to-va': 1000 / 0.8, 'va-to-kw': 10000 * 0.8 / 1000, 'kwh-to-watts': 12 / 4 * 1000, 'watts-to-kwh': 0.5 * 6, 'mah-to-wh': 5 * 3.7, 'wh-to-mah': 18.5 / 3.7 * 1000, 'va-to-watts': 800, 'watts-to-va': 1000,
  'volts-to-watts': 230 * 5, 'watts-to-volts': 1150 / 5, 'joules-to-watts': 3600 / 60, 'watts-to-joules': 100 * 10, 'joules-to-volts': 24 / 2, 'volts-to-joules': 12 * 2, 'ev-to-volts': 5, 'volts-to-ev': 5,
  'electricity-bill': (100 * 4 + 200 * 6 + (480 - 300) * 8 + 100) * 1.05, 'energy-consumption': 2 * 8 * 30, 'energy-cost': 2 * 8 * 30, 'ohms-law': 230 / 5, 'power-calculator': 230 * 5, 'power-factor': 80 / 100, 'voltage-divider': 12 * 10 / (10 + 10),
  'voltage-drop': 2 * 50 * 1.7241e-8 * 50 / 10e-6, 'watts-volts-amps-ohms': 12 / 6, 'wire-gauge': 0.127 * 92 ** ((36 - 10) / 39) };
const om = 2 * Math.PI * (1 - Math.cos(30 * Math.PI / 180));
const om30 = 2 * Math.PI * (1 - Math.cos(15 * Math.PI / 180));   /* solid angle of a 30° full-angle cone, sr */   /* solid angle of a 60° full-angle cone, sr */
Object.assign(EXPECT, { 'amps-to-ohms': 12 / 2, 'ohms-to-amps': 12 / 6, 'volts-to-ohms': 230 / 5, 'ohms-to-volts': 5 * 46, 'kw-to-wh': 1.5 * 2 * 1000, 'wh-to-kw': 3000 / 2 / 1000, 'kw-to-joules': 2 * 1000 * 60, 'joules-to-kw': 360000 / 60 / 1000, 'kj-to-watts': 36 * 1000 / 60, 'watts-to-kj': 250 * 60 / 1000, 'kw-to-kj': 2 * 60, 'kj-to-kw': 360 / 60, 'watts-to-wh': 250 * 2, 'wh-to-watts': 3000 / 2,
  'lumens-to-lux': 3000 / 20, 'lux-to-lumens': 300 * 50, 'candela-to-lux': 1000 / 5 ** 2, 'lux-to-candela': 25 * 4 ** 2, 'lumens-to-candela': 1000 / om, 'candela-to-lumens': 1000 * om, 'lumens-to-watts': 800 / 80, 'watts-to-lumens': 10 * 100,
  /* textbook formulas written here: flux = E A / (UF MF), W = flux / efficacy; E = P eta UF MF / A; mcd = 1000 flux / omega; flux = omega mcd / 1000, omega = 2 pi (1 - cos(15 deg)) */
  'lux-to-watts': 300 * 50 / (0.6 * 0.8) / 100, 'watts-to-lux': 100 * 100 * 0.6 * 0.8 / 20, 'lumens-to-millicandela': 1000 * 1 / om30, 'millicandela-to-lumens': 5000 / 1000 * om30 });
/* v1.44.0, written from textbook formulas: Wh = Ah V; Ah = Wh / V; kWh = Ah V / 1000; Ah = kWh 1000 / V; motor input = shaft power / eta, I = input / (sqrt3 V pf) with 1 HP = 745.7 W; shaft power = sqrt3 V I pf eta. The HP to amps page shows one decimal, so the value is rounded the same way. */
Object.assign(EXPECT, { 'ah-to-wh': 100 * 12, 'wh-to-ah': 1200 / 12, 'ah-to-kwh': 100 * 48 / 1000, 'kwh-to-ah': 4.8 * 1000 / 48, 'hp-to-amps': Math.round(10 * 745.7 / 0.9 / (sq3 * 415 * 0.85) * 10) / 10, 'amps-to-hp': sq3 * 415 * 15 * 0.85 * 0.9 / 745.7 });
const bigNum = (h) => { const m = /<div class="big">([^<]*)<\/div>/.exec(h); const n = m && /-?\d[\d,]*\.?\d*/.exec(m[1]); return n ? Number(n[0].replace(/,/g, '')) : NaN; };
SLUGS.forEach((s) => { const g = bigNum(PG[s + '.html']), x = EXPECT[s]; L(Math.abs(g - x) <= 1.5e-3 * Math.abs(x), s + ': headline ' + g + ' matches the textbook value ' + x); });
const titles = [], descs = [];
SLUGS.concat(['index']).forEach((s) => {
  const h = PG[s + '.html'], ti = /<title>([^<]*)<\/title>/.exec(h)[1], de = /<meta name="description" content="([^"]*)"/.exec(h)[1];
  titles.push(ti); descs.push(de);
  L(ti.length <= 60 && de.length >= 50 && de.length <= 160, s + ': title ' + ti.length + ' and description ' + de.length + ' characters are within search limits');
  L((h.match(/<h1>/g) || []).length === 1 && /<h2>Formula<\/h2>/.test(h) !== (s === 'index'), s + ': one h1, formula section on every calculator page');
  L(!/NaN|undefined|Infinity|\[object/.test(h.replace(/<style>.*?<\/style>/s, '')), s + ': no NaN, undefined or Infinity in the text');
  L(s === 'index' || /<table>/.test(h), s + ': has a table of values');
});
L(new Set(titles).size === titles.length && new Set(descs).size === descs.length, 'titles and descriptions are unique across pages');
/* links: every href resolves; every opposite-direction link is reciprocal; every app link is a real calculator whose prefilled values reproduce the page */
const hrefs = (h) => [...noFoot(h).matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
let badLinks = [];
Object.keys(PG).filter((f) => /\.html$/.test(f)).forEach((f) => hrefs(PG[f]).forEach((u) => {
  if (/^(index|[a-z0-9-]+)\.html$/.test(u)) { if (!PG[u]) badLinks.push(f + ' -> ' + u); }
  else if (u === '../') { /* home page root */ }
  else if (/^\.\.\/index\.html(#.*)?$/.test(u)) { const id = (u.split('#')[1] || '').split('?')[0]; if (id && !E.BY_ID[id] && id !== 'awg-chart' && id !== 'verification') badLinks.push(f + ' -> ' + u); }
  else if (/^\.\.\/converters\/[a-z0-9-]+\.html$/.test(u)) { /* links into the Conversion Centre (every page there is checked in section 18) */ }
  else if (u === '../converters/index.html') { /* conversions hub links to the Conversion Centre (checked in section 18) */ }
  else if (u === '../calculators/index.html' || u === '../calculators/') { /* conversions hub links to the engineering hub (checked in section 12) */ }
  else if (/^\.\.\/calculators\/[a-z0-9-]+\/$/.test(u)) { if (!require('fs').existsSync(require('path').join(__dirname, '..', u.slice(3), 'index.html'))) badLinks.push(f + ' -> ' + u); }
  else if (!/^\.\.\/(icon\.svg|apple-touch-icon\.png|manifest\.webmanifest|privacy\.html|terms\.html)$/.test(u)) badLinks.push(f + ' -> ' + u);
}));
L(badLinks.length === 0, 'every link on every page resolves' + (badLinks.length ? ': ' + badLinks.slice(0, 3).join('; ') : ''));
const revOf = {}; built.meta.forEach((m) => { revOf[m.slug] = m.rev; });
L(built.meta.filter((m) => m.rev).every((m) => revOf[m.rev] === m.slug), 'every opposite-direction link points back (68 conversions, 34 pairs)');
L(built.meta.filter((m) => m.rev).length === 68 && SLUGS.filter((s) => /-to-/.test(s)).length === 68, 'all 68 "X to Y" pages have an opposite-direction link');
let n8b = 0;
SLUGS.forEach((s) => {
  const m = /class="btn" href="\.\.\/index\.html#([^"?]+)(?:\?([^"]*))?"/.exec(PG[s + '.html']); if (!m || m[1] === 'awg-chart') return;
  const def = E.BY_ID[m[1]]; if (!def) return L(false, s + ': app link names a real calculator');
  const raw = E.defaultsRaw(def);
  (m[2] ? m[2].replace(/&amp;/g, '&').split('&') : []).forEach((pair) => {
    const i = pair.indexOf('='), k = pair.slice(0, i), rest = pair.slice(i + 1), spec = def.inputs.find((x) => x.key === k);
    if (spec.type === 'enum') raw[k] = Number(rest); else { const j = rest.indexOf(':'); raw[k] = [decodeURIComponent(j < 0 ? rest : rest.slice(0, j)), j < 0 ? spec.unit : decodeURIComponent(rest.slice(j + 1))]; }
  });
  const r = E.calculate(def, raw); n8b++;
  L(r.ok && PG[s + '.html'].indexOf(r.steps[r.steps.length - 1].split(' = ').pop().replace(/ .*$/, '')) >= 0 || s === 'kva-to-va' || s === 'va-to-kva', s + ': the app link, opened as a share link, reproduces the example');
});
L(n8b >= 40, 'app links checked for ' + n8b + ' pages');
/* F1: every landing page has a working form. Expected values are textbook formulas written here. */
const { llCompute } = require('../tools/build_pages.js');
const dflt = (slug) => { const v = {}; built.forms[slug].fields.forEach((f) => { v[f.key] = f.val; if (!f.opts) v[f.key + '_u'] = f.unitSel || f.unit; }); return v; };
const num = (r, i) => Number(r.items[i || 0].text.replace(/[, ]/g, '').match(/^-?[\d.]+(e-?\d+)?/i)[0]);
const near = (a, b) => Math.abs(a - b) <= 1e-4 * Math.max(1, Math.abs(b));
SLUGS.forEach((s) => {
  const h = PG[s + '.html'], r = llCompute(E, built.forms[s], dflt(s));
  L(/id="try-form"/.test(h) && (h.match(/<input /g) || []).length >= 1 && h.indexOf('<script defer src="../engine.js">') > 0, s + ': page has a form, at least one input, and loads engine.js');
  L(r.ok && r.items.length >= 1 && r.items.every((it) => h.indexOf(it.text) >= 0), s + ': the form, left at its defaults, shows the same figures as the worked example');
});
L(PG['index.html'].indexOf('try-form') < 0, 'the hub page has no form');
{
  const f = (slug, over) => llCompute(E, built.forms[slug], Object.assign(dflt(slug), over));
  let r = f('ohms-law', { V: '12', I: '2' });
  L(r.ok && near(num(r, 0), 12 / 2) && near(num(r, 1), 12 * 2), 'ohms-law form: 12 V and 2 A give 6 Ω and 24 W');
  r = f('ohms-law', { V: '12', I: '500', I_u: 'mA' });
  L(r.ok && near(num(r, 0), 24), 'ohms-law form: 500 mA is read as 0.5 A (R = 24 Ω)');
  r = f('amps-to-kw', { I: '50', V: '400', pf: '0.8' });
  L(r.ok && near(num(r), Math.sqrt(3) * 400 * 50 * 0.8 / 1000), 'amps-to-kw form: 50 A, 400 V, pf 0.8 three-phase = √3·V·I·pf');
  r = f('amps-to-kw', { phase: '1', V: '230', I: '10', pf: '1' });
  L(r.ok && near(num(r), 2.3), 'amps-to-kw form: the circuit selector switches to single-phase (2.3 kW)');
  r = f('kva-to-va', { v: '2.5' });
  L(r.ok && r.items[0].text === '2,500 VA', 'kva-to-va form: 2.5 kVA = 2,500 VA');
  r = f('voltage-divider', { Vin: '9', R1: '10', R2: '20' });
  L(r.ok && near(num(r), 9 * 20 / (10 + 20)), 'voltage-divider form: 9 V across 10 kΩ and 20 kΩ gives 6 V');
  r = f('wire-gauge', { n: '4' });
  L(r.ok && near(num(r, 0), 0.127 * Math.pow(92, (36 - 4) / 39)), 'wire-gauge form: AWG 4 diameter = 0.127 × 92^((36−n)/39) mm');
  r = f('power-factor', { P: '60', S: '100' });
  L(r.ok && near(num(r, 0), 0.6) && /°$/.test(r.items[1].text) && near(num(r, 1), Math.acos(0.6) * 180 / Math.PI), 'power-factor form: 60 kW over 100 kVA gives 0.6 and 53.13°');
  r = f('amps-to-volts', {});
  L(r.ok && near(num(r), 2070 / (10 * 0.9)), 'amps-to-volts form: the blank voltage field is solved (2.07 kW, 10 A, pf 0.9 gives 230 V)');
  r = f('amps-to-volts', { I: '20' });
  L(r.ok && near(num(r), 2070 / (20 * 0.9)), 'amps-to-volts form: changing the current re-solves (20 A gives 115 V)');
  /* v1.13.0 formula-based direction pages: the form re-solves with textbook formulas written here */
  r = f('amps-to-ohms', { V: '24', I: '3' }); L(r.ok && near(num(r), 24 / 3), 'amps-to-ohms form: 24 V and 3 A give 8 Ω');
  r = f('ohms-to-amps', { V: '230', R: '46' }); L(r.ok && near(num(r), 5), 'ohms-to-amps form: 230 V across 46 Ω gives 5 A');
  r = f('volts-to-ohms', { V: '12', I: '250', I_u: 'mA' }); L(r.ok && near(num(r), 12 / 0.25), 'volts-to-ohms form: 12 V and 250 mA give 48 Ω');
  r = f('ohms-to-volts', { I: '2', R: '1.5', R_u: 'kΩ' }); L(r.ok && near(num(r), 2 * 1500), 'ohms-to-volts form: 2 A through 1.5 kΩ gives 3,000 V');
  r = f('kw-to-wh', { P: '500', P_u: 'W', t: '30', t_u: 'min' }); L(r.ok && near(num(r), 250), 'kw-to-wh form: 500 W for 30 minutes is 250 Wh');
  r = f('wh-to-kw', { E: '1', E_u: 'kWh', t: '30', t_u: 'min' }); L(r.ok && near(num(r), 2), 'wh-to-kw form: 1 kWh in 30 minutes is 2 kW');
  r = f('kw-to-joules', { P: '1', t: '1' }); L(r.ok && near(num(r), 1000), 'kw-to-joules form: 1 kW for 1 s is 1,000 J');
  r = f('joules-to-kw', { E: '3.6', E_u: 'MJ', t: '1', t_u: 'h' }); L(r.ok && near(num(r), 1), 'joules-to-kw form: 3.6 MJ in 1 hour is 1 kW');
  r = f('kj-to-watts', { E: '3.6', E_u: 'MJ', t: '1', t_u: 'h' }); L(r.ok && near(num(r), 1000), 'kj-to-watts form: 3.6 MJ in 1 hour is 1,000 W');
  r = f('watts-to-kj', { P: '1', P_u: 'kW', t: '1', t_u: 'h' }); L(r.ok && near(num(r), 3600), 'watts-to-kj form: 1 kW for 1 hour is 3,600 kJ');
  r = f('lumens-to-lux', { phi: '800', A: '4' }); L(r.ok && near(num(r), 200) && /lux$/.test(r.items[0].text), 'lumens-to-lux form: 800 lm over 4 m² is 200 lux, with the unit');
  r = f('lumens-to-lux', { phi: '800', A: '4', u: '0.5' }); L(r.ok && near(num(r), 100), 'lumens-to-lux form: half the lumens reaching the surface halves the lux');
  r = f('lux-to-lumens', { E: '500', A: '12' }); L(r.ok && near(num(r), 6000) && /lm$/.test(r.items[0].text), 'lux-to-lumens form: 500 lux over 12 m² is 6,000 lm, with the unit');
  r = f('candela-to-lux', { I: '900', d: '3' }); L(r.ok && near(num(r), 100), 'candela-to-lux form: 900 cd at 3 m is 100 lux (inverse square)');
  r = f('candela-to-lux', { I: '1000', d: '5', th: '60' }); L(r.ok && near(num(r), 1000 * Math.cos(Math.PI / 3) / 25), 'candela-to-lux form: a surface tilted 60° gets cos 60° = half the lux');
  r = f('lux-to-candela', { E: '10', d: '100', d_u: 'cm' }); L(r.ok && near(num(r), 10 * 1 ** 2) && /cd$/.test(r.items[0].text), 'lux-to-candela form: 10 lux at 100 cm (1 m) is 10 cd');
  r = f('lumens-to-candela', { phi: '4 * 1' }); L(!r.ok, 'lumens-to-candela form: text that is not a number is rejected');
  r = f('lumens-to-candela', { phi: '1256.6371', th: '360' }); L(r.ok && near(num(r), 1256.6371 / (4 * Math.PI)), 'lumens-to-candela form: 1,256.6371 lm (400π) over a full sphere (4π sr) is 100 cd');
  r = f('candela-to-lumens', { I: '100', th: '360' }); L(r.ok && near(num(r), 100 * 4 * Math.PI), 'candela-to-lumens form: 100 cd over a full sphere is 400π lm');
  r = f('lumens-to-watts', { phi: '1600', eta: '100' }); L(r.ok && near(num(r), 16), 'lumens-to-watts form: 1,600 lm at 100 lm/W is 16 W');
  r = f('watts-to-lumens', { P: '0.02', P_u: 'kW', eta: '90' }); L(r.ok && near(num(r), 1800), 'watts-to-lumens form: 20 W at 90 lm/W is 1,800 lm');
  r = f('ohms-law', { I: 'abc' });
  L(!r.ok && r.errors.length === 1, 'a non-numeric entry returns an error message, not a result');
  r = f('energy-cost', { cap: '50' });
  L(r.ok && near(num(r, 0), 2 * 0.5 * 8 * 30), 'energy-cost form: running at 50 % halves the energy (2 kW, 8 h, 30 d gives 240 kWh)');
  r = f('energy-cost', { cap: '50', per: '1', h: '56' });
  L(r.ok && near(num(r, 0), 2 * 0.5 * 56 / 7 * 30), 'energy-cost form: 56 h a week is 8 h a day (240 kWh over 30 days at 50 %)');
  r = f('energy-cost', { cur: '1' });
  L(r.ok && /^₹3,840/.test(r.items[1].text) && /^480/.test(r.items[0].text), 'energy-cost form: the rupee symbol prefixes the cost and not the energy');
  r = f('energy-cost', { per: '1', h: '200' });
  L(!r.ok && /168/.test(r.errors.join(' ')), 'energy-cost form: more than 168 h a week returns an error that names the limit');
  r = f('energy-cost', { P: '1', P_u: 'TR', h: '10', d: '1' });
  L(r.ok && near(num(r, 0), Math.round(12000 * 1055.05585 / 3600 * 10 / 1000 * 10) / 10), 'energy-cost form: 1 TR for 10 h is 12,000 BTU/h × 0.29307 W × 10 h = 35.2 kWh (shown to one decimal)');
  L(/<select id="f-P-pre" data-fill="P"/.test(PG['energy-cost.html']) && /indicative/.test(PG['energy-cost.html']) && !/f-P-pre/.test(PG['ohms-law.html']), 'energy-cost page has the appliance picker labelled indicative; other pages do not');
  r = f('energy-cost', { P: '' });
  L(!r.ok, 'a blank required field returns an error');
  r = f('kva-to-va', { v: '' });
  L(!r.ok, 'the unit-conversion form rejects an empty value');
  r = f('voltage-drop', { L: '100' });
  L(r.ok && num(r, 0) > 0 && !built.forms['voltage-drop'].fields.some((x) => ['sz', 'awg', 'D', 'rhoC', 'aC'].indexOf(x.key) >= 0), 'voltage-drop form works and offers area only, with no hidden size mode or custom resistivity');
}
/* F4: FAQ, head tags and structured data */
{
  const SITE = 'https://example.com/elecmetric', dep = buildPages({ base: SITE });
  const ld = (h) => { const m = h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/); return m ? JSON.parse(m[1].replace(/\\u003c/g, '<')) : null; };
  SLUGS.forEach((s) => {
    const h = PG[s + '.html'], f = built.faqs[s], d = dep.pages[s + '.html'], g = ld(d);
    L(f.length >= 3 && new Set(f.map((x) => x[0])).size === f.length && f.every((x) => x[0].length > 8 && x[1].length > 30) && h.indexOf('Frequently asked questions') > 0 && (h.match(/<h3>/g) || []).length === f.length, s + ': visible FAQ with ' + f.length + ' distinct questions, each answered');
    L(h.indexOf('twitter:card') > 0 && h.indexOf('rel="canonical"') < 0 && h.indexOf('ld+json') < 0, s + ': without BASE_URL the page has twitter tags and no canonical or structured data');
    L(d.indexOf('<link rel="canonical" href="' + SITE + '/pages/' + s + '.html">') > 0 && d.indexOf('<meta property="og:url" content="' + SITE + '/pages/' + s + '.html">') > 0, s + ': with BASE_URL the page has its own canonical and og:url');
    const types = g && g['@graph'].map((x) => x['@type']);
    L(g && types.join() === 'BreadcrumbList,WebApplication,FAQPage' && g['@graph'][0].itemListElement.length === 3 && g['@graph'][0].itemListElement[2].item === SITE + '/pages/' + s + '.html' && g['@graph'][1].url === SITE + '/pages/' + s + '.html', s + ': JSON-LD parses, with a 3-level BreadcrumbList and a WebApplication for this URL');
  });
  const gh = ld(dep.pages['index.html']);
  L(gh && gh['@graph'].length === 1 && gh['@graph'][0].itemListElement.length === 2, 'hub page: BreadcrumbList with 2 levels');
  const idxSrc = require('fs').readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8');
  const strip0 = (h) => h.replace(/<link rel="canonical" href="[^"]*">/g, '').replace(/<meta property="og:url" content="[^"]*">/g, '').replace(/<meta property="og:image[^"]*" content="[^"]*">/g, '').replace(/<meta name="twitter:image" content="[^"]*">/g, '').replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
  L(built.root['index.html'] === strip0(idxSrc), 'index.html equals a build without BASE_URL, ignoring only the deploy-time canonical, og:url and JSON-LD');
  L(dep.root['index.html'].indexOf('<link rel="canonical" href="' + SITE + '/">') > 0 && ld(dep.root['index.html']) && ld(dep.root['index.html'])['@graph'][0]['@type'] === 'WebApplication', 'index.html built with BASE_URL has a canonical and WebApplication JSON-LD');
  L(/<noscript>[\s\S]*pages\/index\.html[\s\S]*<\/noscript>/.test(idxSrc), 'index.html has a no-JavaScript fallback that links to the conversion pages');
  L(dep.root['sitemap.xml'].split('<loc>').length - 1 === 225 + dep.conv.slugs.length && dep.root['robots.txt'].indexOf('Sitemap: ' + SITE + '/sitemap.xml') >= 0 && built.root['sitemap.xml'] === undefined && built.root['robots.txt'].indexOf('Sitemap') < 0, 'sitemap lists index.html, the conversion hub and 78 pages, the engineering hub, 128 calculator pages, the Basic Calculator, the Scientific Calculator, 12 category hubs and the Conversion Centre, and only when BASE_URL is set');
  /* Reader-facing facts the FAQ states, checked against textbook values */
  const fq = (s) => built.faqs[s].map((x) => x.join(' ')).join(' ');
  L(/Multiply by 1,000/.test(fq('kva-to-va')) && /Divide by 1,000/.test(fq('va-to-kva')), 'kVA to VA and VA to kVA FAQs state the right direction of the factor 1,000');
  L(Math.abs(Math.pow(92, 6 / 39) - 2) < 0.01 && /roughly halves/.test(fq('wire-gauge')), 'wire-gauge FAQ: six AWG steps halve the diameter (92^(6/39) ≈ 2.005)');
  L(/1 kW load running for 1 hour uses 1 kWh/.test(fq('kw-to-kwh')) && /one joule per second/.test(fq('watts-to-joules')), 'energy FAQs: kW vs kWh and watts vs joules');
  L(!/\bkwh\b/.test(PG['energy-cost.html'].replace(/href="[^"]*"/g, '')) && /tariff per kWh/.test(PG['energy-cost.html']), 'worked-example text keeps unit capitalisation (kWh, not kwh)');
}
const fsx = require('fs'), pth = require('path'), dir = pth.join(__dirname, '..', 'pages');
/* A deploy build (BASE_URL set) adds a canonical, og:url and JSON-LD to files on disk. Strip exactly those, so the test passes before and after a deploy build and still catches any other drift. */
const STRIP = (h) => h.replace(/<link rel="canonical" href="[^"]*">/g, '').replace(/<meta property="og:url" content="[^"]*">/g, '').replace(/<meta property="og:image[^"]*" content="[^"]*">/g, '').replace(/<meta name="twitter:image" content="[^"]*">/g, '').replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
L(Object.keys(PG).filter((f) => /\.html$/.test(f)).every((f) => fsx.existsSync(pth.join(dir, f)) && STRIP(fsx.readFileSync(pth.join(dir, f), 'utf8')) === PG[f]), 'committed pages/ equals what the generator produces, ignoring only the deploy-time canonical, og:url and JSON-LD (run: node tools/build_pages.js)');
total += n8; console.log('8. landing pages:', n8 + '/' + n8, 'checked');
/* 9. service worker: an empty or stale sw.js silently breaks offline use, so check it */
{
  const swSrc = fsx.readFileSync(pth.join(__dirname, '..', 'sw.js'), 'utf8'); let n9 = 0;
  const S = (c, m) => { n9++; ok(c, m); };
  S(swSrc.trim().length > 200, 'sw.js is not empty');
  let parses = true; try { new Function(swSrc); } catch (e) { parses = false; }
  S(parses, 'sw.js parses');
  const ver = /CACHE_VERSION = '([^']+)'/.exec(swSrc);
  S(!!ver && ver[1] === E.VERSION, 'sw.js CACHE_VERSION matches engine VERSION ' + E.VERSION);
  ['install', 'activate', 'fetch'].forEach((ev) => S(swSrc.indexOf("addEventListener('" + ev + "'") >= 0, 'sw.js handles ' + ev));
  const shell = [...(/const SHELL = \[([\s\S]*?)\];/.exec(swSrc) || [, ''])[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  S(shell.length > 0, 'sw.js lists files to cache');
  const missing = shell.filter((f) => f !== './' && !fsx.existsSync(pth.join(__dirname, '..', f)));
  S(missing.length === 0, 'every file in the sw.js list exists' + (missing.length ? ': ' + missing.join(', ') : ''));
  const cdir = pth.join(__dirname, '..', 'calculators'), cslugs = fsx.readdirSync(cdir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  const unlistedC = cslugs.filter((x) => shell.indexOf('./calculators/' + x + '/index.html') < 0).concat(shell.indexOf('./calculators/index.html') < 0 ? ['(hub)'] : []);
  S(cslugs.length === 144 && unlistedC.length === 0, 'every page in calculators/ (129 calculator pages, the Basic Calculator, the Scientific Calculator and 13 category hubs) is cached by sw.js' + (unlistedC.length ? ': ' + unlistedC.join(', ') : ''));
  const unlisted = fsx.readdirSync(dir).filter((f) => /\.html$/.test(f) && shell.indexOf('./pages/' + f) < 0);
  S(unlisted.length === 0, 'every page in pages/ is cached by sw.js' + (unlisted.length ? ': ' + unlisted.join(', ') : ''));
  ['./index.html', './engine.js', './manifest.webmanifest', './icon.svg'].forEach((f) => S(shell.indexOf(f) >= 0, 'sw.js caches ' + f));
  total += n9; console.log('9. service worker:', n9 + '/' + n9, 'checked');
}
/* 10. page structure: head metadata must sit inside <head>, language declared, version not hard-coded, robots.txt present */
{
  const idx = fsx.readFileSync(pth.join(__dirname, '..', 'index.html'), 'utf8'); let n10 = 0;
  const H = (c, m) => { n10++; ok(c, m); };
  const headEnd = idx.indexOf('</head>'), head = idx.slice(0, headEnd);
  H(/<html lang="en"/.test(idx), 'index.html declares lang="en"');
  H(headEnd > 0 && idx.indexOf('<body') > headEnd, 'the body starts after </head>');
  ['<title>', 'name="description"', 'rel="manifest"', 'name="theme-color"'].forEach((t) => H(head.indexOf(t) >= 0, 'index.html head contains ' + t));
  H(!/(src|href)="https?:\/\/(?!elecmetric\.com)[^"]*"/.test(head) && !/googleapis|gstatic/.test(idx), 'index.html loads no fonts or scripts from other hosts');
  { const lg = require('../tools/build_pages.js').legalPages(), pr = lg['privacy.html'], tm = lg['terms.html']; H(/Privacy notice/.test(pr) && /Terms of use/.test(tm) && /no accounts/.test(pr) && /not professional advice/.test(tm) && /as is/.test(tm), 'privacy and terms pages exist with their key statements'); H(/privacy\.html/.test(idx) && /terms\.html/.test(idx) && fsx.existsSync(pth.join(__dirname, '..', 'privacy.html')) && fsx.existsSync(pth.join(__dirname, '..', 'terms.html')), 'index.html links to privacy and terms and the files exist'); H(['pages/ohms-law.html', 'calculators/cable-size/index.html', 'calculators/index.html'].every((f) => { const h = fsx.readFileSync(pth.join(__dirname, '..', f), 'utf8'), m = h.match(/href="([^"]*privacy\.html)"/); return m && fsx.existsSync(pth.resolve(pth.dirname(pth.join(__dirname, '..', f)), m[1])); }), 'footer privacy links on conversion, calculator and hub pages resolve to the file'); }
  { const lg2 = require('../tools/build_pages.js').legalPages(); H(['privacy.html', 'terms.html'].every((f) => { const hs = lg2[f].match(/<link rel="(?:icon|apple-touch-icon|manifest)" href="[^"]*"/g) || []; return hs.length === 3 && hs.every((x) => !/href="\.\./.test(x) && fsx.existsSync(pth.join(__dirname, '..', x.match(/href="([^"]*)"/)[1]))); }), 'privacy and terms sit at the site root: icon, apple-touch-icon and manifest links are root-relative (no ../) and the files exist'); }
  { const root = pth.join(__dirname, '..'), walk = (d) => fsx.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? (['tests', 'tools', 'docs', '.github', 'node_modules'].includes(e.name) ? [] : walk(pth.join(d, e.name))) : (e.name.endsWith('.html') ? [pth.join(d, e.name)] : [])), all = walk(root);
    const bad = all.filter((f) => { const h = fsx.readFileSync(f, 'utf8'), m2 = h.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)"/); return !m2 || !/default-src 'self'/.test(m2[1]) || !/connect-src 'self'/.test(m2[1]) || !/object-src 'none'/.test(m2[1]) || /https?:\/\//.test(m2[1]) || /<script[^>]+src="https?:\/\/(?!elecmetric\.com)/.test(h); });
    H(all.length >= 138 && bad.length === 0, 'every html page carries a same-origin Content-Security-Policy (no remote script, style, font, image or request) and loads no remote script' + (bad.length ? ': ' + bad.slice(0, 3).join(', ') : '')); }
  { const c = E.BY_ID['ohms-law'], raw = E.defaultsRaw(c); raw.R = [1e-308, 'Ω']; const r = E.calculate(c, raw), d = E.calculate(c, E.defaultsRaw(c));
    H(r.ok && r.outputs.some((o) => !isFinite(o.value)) && r.warnings.some((x) => /outside the range this calculator can show/.test(x)) && !d.warnings.some((x) => /outside the range/.test(x)), 'a result that overflows to infinity gets an out-of-range warning, and a normal result does not'); }
  { const si = JSON.parse(fsx.readFileSync(pth.join(__dirname, '..', 'tools', 'site_info.json'), 'utf8')), pg = fsx.readFileSync(pth.join(__dirname, '..', 'pages', 'ohms-law.html'), 'utf8'); H(!si.contact_email || (pg.indexOf('Tell us how to improve this page') > 0 && pg.indexOf(si.contact_email) > 0 && idx.indexOf('id="fbk"') > 0 && /mailto:/.test(idx) && !/action=/.test(pg.slice(pg.indexOf('Write how to improve')))), 'feedback box is on pages and the app, opens the email app and posts nothing to a server'); }
  H(/id="tb-ver"/.test(idx) && !/<b>Engine<\/b>v\d/.test(idx), 'engine version in the header is filled from E.VERSION, not typed in');
  const rob = fsx.readFileSync(pth.join(__dirname, '..', 'robots.txt'), 'utf8');
  H(/User-agent: \*/.test(rob), 'robots.txt exists at the site root');
  const bt = require('../tools/build_pages.js');
  H(Object.keys(bt.build().root).indexOf('robots.txt') >= 0 && !Object.keys(bt.build().pages).some((f) => /sitemap|robots/.test(f)), 'sitemap and robots go to the root, not pages/');
  /* Issue 2: the 1,392-test suite runs once at start-up, never inside an input handler */
  const uf = idx.indexOf('function updateFeeder()'), ufBody = idx.slice(uf, idx.indexOf('\n  }\n', uf));
  H(uf > 0 && ufBody.length > 200, 'updateFeeder body located');
  H((idx.match(/\.runTests\(/g) || []).length === 1, 'index.html calls runTests exactly once (at start-up)');
  H(ufBody.indexOf('runTests') < 0 && /tp = pas, tt = tot/.test(ufBody), 'updateFeeder reuses the start-up totals instead of re-running the tests');
  H(/id="cp-link">Copy link<\/button><button class="btn" id="sh-link">Share<\/button>/.test(idx), 'app view has a Share button beside Copy link');
  H(/\$\('#sh-link'\)\.onclick = function \(e\) \{ var u = shareUrl\(def\)[^\n]*navigator\.share\(\{ title: document\.title, url: u \}\)[^\n]*copy\(u, btn\)/.test(idx), 'Share uses the same link as Copy link, opens navigator.share and falls back to copy');
  total += n10; console.log('10. page structure:', n10 + '/' + n10, 'checked');
}
/* 11. deploy guard (tools/check_deploy.js): a production build must be launch-ready, and the guard must catch every way it can fail */
{
  const cd = require('../tools/check_deploy.js'), bp = require('../tools/build_pages.js'); let n11 = 0;
  const D = (c, m) => { n11++; ok(c, m); };
  const BASE = 'https://elecmetric.test/app';
  const files = (b) => { const r = bp.build({ base: b }), f = {}; Object.keys(r.pages).forEach((k) => { f['pages/' + k] = r.pages[k]; }); Object.keys(r.root).forEach((k) => { f[k] = r.root[k]; }); Object.keys(r.legal).forEach((k) => { f[k] = r.legal[k]; }); Object.keys(r.calc.pages).forEach((k) => { f['calculators/' + (k === 'index' ? '' : k + '/') + 'index.html'] = r.calc.pages[k]; }); Object.keys(r.conv.pages).forEach((k) => { f['converters/' + k] = r.conv.pages[k]; }); return f; };
  const good = files(BASE), nPages = Object.keys(good).filter((f) => /\.html$/.test(f) && !/^(404|privacy|terms)\.html$/.test(f)).length;
  D(cd.check(good, BASE).length === 0 && nPages === 225 + bp.build({ base: BASE }).conv.slugs.length, 'production build passes the deploy guard (' + nPages + ' pages)');
  D(cd.check(good, BASE + '/').length === 0, 'a trailing slash on BASE_URL is tolerated');
  /* v1.73.7: the guard refuses a launch with no operator, no location or no contact address */
  const okInfo = { operator_name: 'Example Ltd', operator_location: 'Delhi, India', contact_email: 'hello@example-company.in' };
  D(cd.siteInfoProblems(okInfo).length === 0, 'site details that are filled in pass');
  D(cd.siteInfoProblems(Object.assign({}, okInfo, { operator_name: '  ' })).some((m) => /operator_name/.test(m)), 'guard rejects an empty operator_name');
  D(cd.siteInfoProblems(Object.assign({}, okInfo, { operator_location: '' })).some((m) => /operator_location/.test(m)), 'guard rejects an empty operator_location');
  D(cd.siteInfoProblems(Object.assign({}, okInfo, { contact_email: '' })).some((m) => /contact_email is empty/.test(m)), 'guard rejects an empty contact address');
  D(cd.siteInfoProblems(null).length === 3, 'guard handles missing site details');
  D(/of the calculators has been carried out/.test(bp.build({ base: BASE }).pages['index.html'] || '') || Object.keys(good).some((f) => /No independent technical review of the calculators has been carried out\./.test(good[f])), 'footer states that no independent technical review of the calculators has been carried out');
  D(cd.check(files(''), BASE).some((p) => /canonical link missing/.test(p)) && cd.check(files(''), BASE).some((p) => /sitemap.xml is missing/.test(p)), 'a build made without BASE_URL is rejected');
  ['', 'elecmetric.in', 'http://elecmetric.in', 'https://example.com', 'https://localhost:8080'].forEach((b) => D(cd.check(good, b).length > 0, 'guard rejects BASE_URL "' + b + '"'));
  const mut = (fn) => { const f = Object.assign({}, good); fn(f); return cd.check(f, BASE); };
  D(mut((f) => { f['pages/amps-to-kw.html'] = f['pages/amps-to-kw.html'].replace(/<link rel="canonical" href="[^"]*">/, ''); }).some((p) => /amps-to-kw.html: canonical link missing/.test(p)), 'guard catches a page with no canonical');
  D(mut((f) => { f['pages/amps-to-kw.html'] = f['pages/amps-to-kw.html'].replace(BASE + '/pages/amps-to-kw.html', 'https://other.test/x'); }).some((p) => /canonical is/.test(p)), 'guard catches a canonical pointing elsewhere');
  D(mut((f) => { f['pages/ohms-law.html'] = f['pages/ohms-law.html'].replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, ''); }).some((p) => /ohms-law.html: JSON-LD missing/.test(p)), 'guard catches a page with no JSON-LD');
  D(mut((f) => { f['pages/ohms-law.html'] = f['pages/ohms-law.html'].replace('application/ld+json">{', 'application/ld+json">{{'); }).some((p) => /does not parse/.test(p)), 'guard catches broken JSON-LD');
  D(mut((f) => { delete f['sitemap.xml']; }).some((p) => /sitemap.xml is missing/.test(p)), 'guard catches a missing sitemap');
  D(mut((f) => { f['sitemap.xml'] = f['sitemap.xml'].replace('  <url><loc>' + BASE + '/pages/power-factor.html</loc></url>\n', ''); }).some((p) => /does not list pages\/power-factor.html/.test(p)), 'guard catches a page missing from the sitemap');
  D(mut((f) => { f['sitemap.xml'] = f['sitemap.xml'].replace('</urlset>', '  <url><loc>' + BASE + '/pages/ghost.html</loc></url>\n</urlset>'); }).some((p) => /no file/.test(p)), 'guard catches a sitemap URL with no file behind it');
  D(mut((f) => { f['robots.txt'] = 'User-agent: *\nAllow: /\n'; }).some((p) => /does not declare/.test(p)), 'guard catches robots.txt without the Sitemap line');
  D(mut((f) => { f['robots.txt'] += 'Disallow: /\n'; }).some((p) => /blocks the whole site/.test(p)), 'guard catches robots.txt blocking the site');
  D(mut((f) => { f['calculators/motor-current/index.html'] = f['calculators/motor-current/index.html'].replace(BASE + '/calculators/motor-current/', BASE + '/pages/motor-current.html'); }).some((p) => /calculators\/motor-current\/index.html: canonical is/.test(p)), 'guard catches a calculator page whose canonical is not its own clean URL');
  D(mut((f) => { f['sitemap.xml'] = f['sitemap.xml'].replace('  <url><loc>' + BASE + '/calculators/earth-resistance/</loc></url>\n', ''); }).some((p) => /does not list calculators\/earth-resistance\/index.html/.test(p)), 'guard catches a calculator page missing from the sitemap');
  D(mut((f) => { f['sitemap.xml'] = f['sitemap.xml'].replace('</urlset>', '  <url><loc>' + BASE + '/calculators/ghost/</loc></url>\n</urlset>'); }).some((p) => /no file/.test(p)), 'guard catches a calculator sitemap URL with no page behind it');
  D(mut((f) => { delete f['calculators/agl-ccr-loading/index.html']; }).some((p) => /agl-ccr-loading/.test(p)), 'guard catches a deleted calculator page that the sitemap still lists');
  const wf = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'pages.yml'), 'utf8');
  D(/cp -r [^\n]*pages calculators converters _site/.test(wf), 'Pages workflow publishes the calculators/ and converters/ folders');
  D(/deploy-pages/.test(wf) && /tools\/check_deploy\.js/.test(wf) && wf.indexOf('tests/run_tests.js') < wf.indexOf('tools/build_pages.js') && /vars\.BASE_URL/.test(wf), 'Pages workflow tests first, builds with BASE_URL, runs the guard, then deploys');
  { const CA = require('../tools/check_assets.js'), os = require('os'), root = path.join(__dirname, '..');
    D(CA.missing(root).length === 0, 'upload-set guard: the repository root has every file the service worker, manifest and page heads need');
    const swSrc = fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), shell = [...swSrc.match(/const SHELL = \[([\s\S]*?)\];/)[1].matchAll(/'\.\/([^']*)'/g)].map((x) => x[1]).filter((x) => x && !/\/$/.test(x));
    const rootFiles = shell.filter((x) => x.indexOf('/') < 0), cpLine = (wf.match(/cp -r ([^\n]*) _site\//) || [])[1] || '', copied = cpLine.split(/\s+/);
    D(rootFiles.length > 0 && rootFiles.every((f) => copied.indexOf(f) >= 0), 'Pages workflow copies every root file the service worker caches (missing: ' + rootFiles.filter((f) => copied.indexOf(f) < 0).join(', ') + ')');
    D(/tools\/check_assets\.js _site/.test(wf), 'Pages workflow runs the upload-set guard on _site');
    const dep2 = fs.readFileSync(path.join(root, 'DEPLOY.md'), 'utf8');
    D(rootFiles.every((f) => dep2.indexOf(f) >= 0), 'DEPLOY.md upload list names every root file the service worker caches');
    /* v1.11.1: the committed sitemap lists exactly the pages on disk, and DEPLOY.md quotes the true counts (both had drifted). */
    { const smx = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'), locs = [...smx.matchAll(/<loc>([^<]*)<\/loc>/g)].map((x) => x[1]);
      const ls = (d) => fs.readdirSync(path.join(root, d)).filter((f) => /\.html$/.test(f)), walkCalc = fs.readdirSync(path.join(root, 'calculators')).filter((f) => fs.existsSync(path.join(root, 'calculators', f, 'index.html')));
      const want = ['/'].concat(ls('pages').map((f) => '/pages/' + f), ['/calculators/'], walkCalc.map((f) => '/calculators/' + f + '/'), ls('converters').map((f) => '/converters/' + f)), got = locs.map((u) => u.replace(/^https:\/\/elecmetric\.com/, ''));
      D(want.length === got.length && want.every((u) => got.indexOf(u) >= 0), 'committed sitemap.xml lists exactly the pages on disk (' + got.length + ' URLs; missing: ' + want.filter((u) => got.indexOf(u) < 0).slice(0, 3).join(', ') + ')');
      D(dep2.indexOf('(' + got.length + ' URLs') >= 0 && dep2.indexOf('lists ' + got.length + ' URLs') >= 0, 'DEPLOY.md quotes the true sitemap URL count (' + got.length + ')');
      D(dep2.indexOf('writes ' + ls('converters').length + ' pages to `converters/') >= 0, 'DEPLOY.md quotes the true Conversion Centre page count (' + ls('converters').length + ')'); }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'elec-assets-'));
    ['sw.js', 'manifest.webmanifest', 'index.html', '404.html'].forEach((f) => fs.copyFileSync(path.join(root, f), path.join(tmp, f)));
    shell.forEach((f) => { const d = path.join(tmp, path.dirname(f)); fs.mkdirSync(d, { recursive: true }); if (!fs.existsSync(path.join(tmp, f))) fs.writeFileSync(path.join(tmp, f), 'x'); });
    ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'icon.svg', 'apple-touch-icon.png', 'logo.png'].forEach((f) => { if (!fs.existsSync(path.join(tmp, f))) fs.writeFileSync(path.join(tmp, f), 'x'); });
    D(CA.missing(tmp).length === 0, 'upload-set guard passes on a complete folder');
    fs.unlinkSync(path.join(tmp, 'icon-512.png'));
    D(CA.missing(tmp).some((m) => /icon-512\.png is missing/.test(m)), 'upload-set guard catches a missing icon');
    fs.writeFileSync(path.join(tmp, 'icon-512.png'), 'x'); fs.unlinkSync(path.join(tmp, 'logo.png'));
    D(CA.missing(tmp).some((m) => /logo\.png is missing/.test(m)), 'upload-set guard catches a missing logo');
    D(/\/engine\\\.js\$\/\.test\(url\.pathname\)/.test(swSrc) || /engine\\\.js/.test(swSrc), 'service worker fetches engine.js network-first');
  }
  total += n11; console.log('11. deploy guard:', n11 + '/' + n11, 'checked');
}
/* 12. dedicated calculator pages (Issue 4). Expected values are textbook formulas written here, not read from engine.js or the generator. */
{
  const bp = require('../tools/build_pages.js'), CP = bp.build({ base: '' }), CALC = CP.calc, cpg = CALC.pages; let n12 = 0;
  const C = (c, m) => { n12++; ok(c, m); };
  const SL = ['motor-current', 'motor-starting', 'transformer-sizing', 'transformer-fault-current', 'cable-size', 'cable-derating', 'ac-voltage-drop', 'generator-sizing', 'earth-resistance', 'solar-pv-sizing', 'solar-pv-string-size', 'battery-bank-sizing', 'agl-ccr-loading', 'transformer-efficiency', 'cable-sc-withstand', 'earth-grid-resistance', 'agl-isolating-transformer', 'agl-max-fittings', 'agl-ccr-input-energy'];
  C(SL.length === 19 && new Set(SL).size === 19 && SL.every((s) => cpg[s]) && Object.keys(cpg).length === 129 + 1 + 13 + 2, 'the 19 hand-written and 110 generated calculator pages are listed once each, plus the engineering hub, the 13 category hubs, the Basic Calculator and the Scientific Calculator, and nothing else');
  const sq = Math.sqrt(3), rod = (100 / (2 * Math.PI * 3)) * (Math.log(8 * 3 / 0.016) - 1), kt = Math.sqrt((90 - 40) / (90 - 30));
  const Rac = 1.7241e-8 * (1 + 0.00393 * (70 - 20)) * 50 / 10e-6, X = 0.08 * 50 / 1000, sinf = Math.sqrt(1 - 0.81);
  { const acd = E.BY_ID['ac-voltage-drop'], rawA = (T) => Object.assign(E.defaultsRaw(acd), { T }), cold = E.calculate(acd, rawA(20)), hot = E.calculate(acd, rawA(70)), fd = E.FEEDER_INPUTS.find((x) => x.key === 'R').def, vd = E.BY_ID['voltage-drop'].inputs.find((x) => x.key === 'R').def;
    C(E.defaultsRaw(acd).T[0] === 70 && cold.warnings.some((w) => /operating|full load/.test(w)) && !hot.warnings.some((w) => /full load runs/.test(w)), 'ac-voltage-drop defaults to 70 °C and warns when resistance is taken below 50 °C');
    C(Math.abs(fd - 0.0601 * (1 + 0.00393 * 70)) < 5e-4 && Math.abs(vd - 0.193 * (1 + 0.00393 * 70)) < 1e-3, 'Feeder Designer and Voltage Drop default cable resistances are the 90 °C values of the 20 °C table figures'); }
  const EXP = {
    'motor-current': [250000 / (0.95 * sq * 415 * 0.88), 250 / 0.95],
    'motor-starting': [140 * 6.5, 100],
    'transformer-sizing': [450 / 0.9 * 1.1 / 0.8, 800, 800000 / (sq * 415)],
    'transformer-fault-current': [1000000 / (sq * 415 * 0.05) / 1000],
    'cable-derating': [kt, 300 * kt * 0.8, 200 / (kt * 0.8)],
    'ac-voltage-drop': [sq * 50 * (Rac * 0.9 + X * sinf), sq * 50 * (Rac * 0.9 + X * sinf) / 400 * 100],
    'generator-sizing': [400 / 0.8 * 1.25, 625, 625000 / (sq * 415)],
    'earth-resistance': [rod],
    'solar-pv-sizing': [30 / (5 * 0.75), Math.ceil(30 / (5 * 0.75) * 1000 / 550)],
    'solar-pv-string-size': [49.5 * (1 + (-0.28 / 100) * (-5 - 25)), Math.floor(1000 / (49.5 * (1 + (-0.28 / 100) * (-30))))],
    'battery-bank-sizing': [500 * 4 / (48 * 0.8 * 0.9), 500 * 4 / 0.9 / 1000],
    'agl-ccr-loading': [(60 * 45 / 0.85 + 6.6 * 6.6 * 3.08 * 4) / 1000, (60 * 45 / 0.85 + 6.6 * 6.6 * 3.08 * 4) / 6.6, 7.5, (60 * 45 / 0.85 + 6.6 * 6.6 * 3.08 * 4) / 1000 / 7.5 * 100]
  };
  const bigNums = (h) => { const m = /<div class="big">([^<]*)<\/div>/.exec(h); return m ? m[1].split(' · ').map((t) => Number(t.replace(/^[^:]*: /, '').replace(/,/g, '').match(/-?\d+\.?\d*/)[0])) : []; };
  Object.keys(EXP).forEach((s) => { const g = bigNums(cpg[s]); C(g.length === EXP[s].length && EXP[s].every((x, i) => Math.abs(g[i] - x) <= 2e-3 * Math.abs(x) + 1e-9), s + ': every headline figure ' + JSON.stringify(g) + ' matches the textbook values ' + JSON.stringify(EXP[s].map((x) => +x.toPrecision(5)))); });
  { const g = bigNums(cpg['cable-size']), A = 400, rho90 = 0.017241 * (1 + 0.00393 * 70), vdPct = (sq * 400.94 * (rho90 * 180 / A * 0.9 + 0.08 * 0.18 * Math.sqrt(1 - 0.81))) / 400 * 100;
    C(g.length === 3 && g[1] === 400 && g[0] <= g[1] && g[0] > 240 && g[2] <= 3 && Math.abs(g[2] - vdPct) < 0.08, 'cable-size: the standard size is 400 mm² (at least the minimum), the drop is within the 3% limit and agrees with a textbook drop at 90 °C (' + g[2] + '% vs ' + vdPct.toFixed(2) + '%)'); }
  const T = [], D = [];
  SL.concat(['index']).forEach((s) => {
    const h = cpg[s], ti = /<title>([^<]*)<\/title>/.exec(h)[1], de = /<meta name="description" content="([^"]*)"/.exec(h)[1]; T.push(ti); D.push(de);
    C(ti.length <= 60 && de.length >= 50 && de.length <= 160, s + ': title ' + ti.length + ' and description ' + de.length + ' characters are within search limits');
    C((h.match(/<h1>/g) || []).length === 1 && (/<h2>Formula<\/h2>/.test(h) !== (s === 'index')), s + ': one h1, formula section on every calculator page');
    C(!/NaN|undefined|Infinity|\[object/.test(h.replace(/<style>.*?<\/style>/s, '')), s + ': no NaN, undefined or Infinity in the text');
    C(s === 'index' || (/<table>/.test(h) && /<h2>Limits of this calculator<\/h2>/.test(h) && /<h2>Frequently asked questions<\/h2>/.test(h)), s + ': has a table of values, a visible limits section and an FAQ');
  });
  const conv = bp.build({ base: '' }).meta; C(new Set(T).size === T.length && new Set(D).size === D.length && !T.some((t) => conv.some((m) => m.title === t)) && !D.some((d) => conv.some((m) => m.desc === d)), 'calculator page titles and descriptions are unique, also against the 64 conversion pages');
  /* every page states what it does not cover, and says honestly whether independent reference values exist (counted here from the vector file, not from the generator) */
  const vc = {}; vec.forEach((v) => { vc[v.id] = (vc[v.id] || 0) + 1; });
  CALC.meta.forEach((m) => { const h = cpg[m.slug], has = (vc[m.calc] || 0) > 0;
    C(has ? new RegExp('Cross-check: ' + vc[m.calc] + ' reference cases').test(h) && !/Cross-check: not yet/.test(h) : /Cross-check: not yet/.test(h) && !/Cross-check: \d+ reference cases/.test(h), m.slug + ': the independent-check statement matches the vector file (' + (vc[m.calc] || 0) + ' vectors)'); });
  C(['motor-starting', 'transformer-sizing', 'cable-size', 'solar-pv-string-size', 'agl-ccr-loading', 'motor-current', 'cable-derating', 'ac-voltage-drop', 'transformer-fault-current'].every((s) => /Cross-check: \d+ reference cases/.test(cpg[s]) && !/Cross-check: not yet/.test(cpg[s])), 'every calculator page now cites a reference-case count from the vector file; none says "not yet"');
  C(/simplified estimating model, not a design tool/.test(cpg['agl-ccr-loading']) && /manufacturer/.test(cpg['agl-ccr-loading']), 'AGL page says it is a simplified estimating model to confirm against manufacturer data');
  C(/upper bound/.test(cpg['transformer-fault-current']) && /infinite source/i.test(cpg['transformer-fault-current']), 'fault-current page says the result is an upper bound that ignores source and cable impedance');
  C(/Tabulated ampacities are not built in/.test(cpg['cable-derating']) && /not complete regional table lookups/.test(cpg['cable-derating']), 'cable-derating page says tables are not built in and regional lookups are not implemented');
  C(/not a cable rating/.test(cpg['cable-size']) && /short-circuit withstand/.test(cpg['cable-size']), 'cable-size page says it is voltage drop only and points to ampacity and short-circuit checks');
  /* links */
  const hrefs = (h) => [...noFoot(h).matchAll(/href="([^"]+)"/g)].map((m) => m[1]); const bad = [];
  Object.keys(cpg).forEach((s) => hrefs(cpg[s]).forEach((u) => {
    if (s === 'index') { if (/^[a-z0-9-]+\/(index\.html)?$/.test(u)) { if (!cpg[u.split('/')[0]]) bad.push(s + ' -> ' + u); } else if (!['../pages/index.html', '../converters/index.html', '../', '../index.html', '../index.html#verification', '../privacy.html', '../terms.html', '../icon.svg', '../apple-touch-icon.png', '../manifest.webmanifest'].includes(u)) bad.push(s + ' -> ' + u); return; }
    if (/^\.\.\/[a-z0-9-]+\/(index\.html)?$/.test(u)) { if (!cpg[u.split('/')[1]] || u === '../index.html' && false) bad.push(s + ' -> ' + u); }
    else if (u === '../index.html' || u === '../') { /* hub */ }
    else if (u === '../../') { /* home page root */ }
    else if (/^#[a-z-]+$/.test(u)) { if (cpg[s].indexOf('id="' + u.slice(1) + '"') < 0) bad.push(s + ' -> ' + u); }
    else if (/^\.\.\/\.\.\/pages\/[a-z0-9-]+\.html$/.test(u)) { if (!require('fs').existsSync(require('path').join(__dirname, '..', u.slice(6)))) bad.push(s + ' -> ' + u); }
    else if (/^\.\.\/\.\.\/converters\/[a-z0-9-]+\.html$/.test(u)) { if (!require('fs').existsSync(require('path').join(__dirname, '..', u.slice(6)))) bad.push(s + ' -> ' + u); }
    else if (/^\.\.\/\.\.\/index\.html(#.*)?$/.test(u)) { const id = (u.split('#')[1] || '').split('?')[0]; if (id && !E.BY_ID[id] && ['verification', 'feeder-designer'].indexOf(id) < 0) bad.push(s + ' -> ' + u); }
    else if (!['../../pages/index.html', '../../converters/index.html', '../../privacy.html', '../../terms.html', '../../icon.svg', '../../apple-touch-icon.png', '../../manifest.webmanifest'].includes(u)) bad.push(s + ' -> ' + u);
  }));
  C(bad.length === 0, 'every link on every calculator page resolves' + (bad.length ? ': ' + bad.slice(0, 3).join('; ') : ''));
  C(SL.every((s) => (cpg['index'].match(new RegExp('href="' + s + '/"', 'g')) || []).length === 1), 'the engineering hub links to each of the 19 pages exactly once');
  C(SL.every((s) => cpg[s].indexOf('href="../"') > 0 && (cpg[s].match(/href="\.\.\/[a-z0-9-]+\/"/g) || []).length >= 1), 'each calculator page links to the hub and at least one other calculator page');
  C(built.pages['index.html'].indexOf('href="../calculators/"') > 0 && /calculators\/(index\.html)?"/.test(fsx.readFileSync(pth.join(__dirname, '..', 'index.html'), 'utf8')), 'the conversion hub and the app\'s no-JavaScript fallback link to the engineering hub');
  let nl = 0; SL.forEach((s) => { const m = /class="btn" href="\.\.\/\.\.\/index\.html#([^"?]+)(?:\?([^"]*))?"/.exec(cpg[s]); if (!m) return C(false, s + ': has an open-in-calculator button'); const def = E.BY_ID[m[1]]; const raw = E.defaultsRaw(def);
    (m[2] ? m[2].replace(/&amp;/g, '&').split('&') : []).forEach((pair) => { const i = pair.indexOf('='), k = pair.slice(0, i), rest = pair.slice(i + 1), sp = def.inputs.find((x) => x.key === k); if (sp.type === 'enum') raw[k] = Number(rest); else { const j = rest.indexOf(':'); raw[k] = [decodeURIComponent(j < 0 ? rest : rest.slice(0, j)), j < 0 ? sp.unit : decodeURIComponent(rest.slice(j + 1))]; } });
    const r = E.calculate(def, raw); nl++; C(r.ok && cpg[s].indexOf(r.steps[r.steps.length - 1].split(' = ').pop().replace(/ .*$/, '')) >= 0, s + ': the app link opens the calculator with the values of the example'); });
  C(nl === 19, 'app links checked for 19 pages');
  /* forms */
  const dflt = (slug) => { const v = {}; CALC.forms[slug].fields.forEach((f) => { v[f.key] = f.val; if (!f.opts) v[f.key + '_u'] = f.unitSel || f.unit; }); return v; };
  SL.forEach((s) => { const h = cpg[s], r = bp.llCompute(E, CALC.forms[s], dflt(s));
    C(/id="try-form"/.test(h) && (h.match(/<input /g) || []).length >= 1 && h.indexOf('<script defer src="../../engine.js">') > 0, s + ': page has a form, at least one input, and loads ../../engine.js');
    C(r.ok && r.items.length >= 1 && r.items.every((it) => h.indexOf(it.text) >= 0), s + ': the form, left at its defaults, shows the same figures as the worked example'); });
  C(cpg['index'].indexOf('try-form') < 0, 'the engineering hub has no form');
  /* phasor diagram on the complex number page (v1.56.0): data from llCompute, drawing from llPhasorSvg, and only that page carries the drawing code */
  {
    const fc = (over) => bp.llCompute(E, CALC.forms['complex-number'], Object.assign(dflt('complex-number'), over)), sv = bp.llPhasorSvg;
    const d0 = fc({}).diagram, dAdd = fc({ f: 0, op: '1' }).diagram, dCv = fc({ op: '0' }).diagram, near2 = (a, b) => a.length === b.length && a.every((x, i) => Math.abs(x - b[i]) < 1e-9);
    C(CALC.forms['complex-number'].diagram === 'phasor' && cpg['complex-number'].indexOf('function llPhasorSvg') > 0 && SL.every((s) => s === 'complex-number' || cpg[s].indexOf('function llPhasorSvg') < 0) && CALC.forms['phasor-sum'].diagram === 'phasor-sum' && cpg['phasor-sum'].indexOf('function llPhasorSvg') < 0 && cpg['phasor-sum'].indexOf('function llPhasorSumSvg') > 0 && SL.every((s) => s === 'phasor-sum' || cpg[s].indexOf('function llPhasorSumSvg') < 0) && cpg['complex-number'].indexOf('function llPhasorSumSvg') < 0 && CALC.forms['ac-ohms-law'].diagram === 'phasor-vi' && cpg['ac-ohms-law'].indexOf('function llPhasorVISvg') > 0 && cpg['ac-ohms-law'].indexOf('function llPhasorSvg') < 0 && cpg['ac-ohms-law'].indexOf('function llPhasorSumSvg') < 0 && SL.every((s) => s === 'ac-ohms-law' || cpg[s].indexOf('function llPhasorVISvg') < 0), 'each phasor drawing function (complex numbers, phasor sum, AC Ohm\'s law) is carried by its own page only');
    C(near2(d0.z1, [3, 4]) && near2(d0.z2, [1, -2]) && near2(d0.res, [11, -2]) && d0.op === 3, 'complex number form: the default (3 + j4) x (1 - j2) gives a diagram of z1, z2 and 11 - j2');
    C(near2(dAdd.res, [4, 2]) && dCv.z2 === null && near2(dCv.res, [3, 4]), 'complex number form: add gives 4 + j2 and convert-only has no z2');
    const sA = sv(dAdd), sM = sv(d0), sC = sv(dCv);
    C(/^<svg viewBox="0 0 320 260" role="img" aria-label="Phasor diagram on the complex plane: z1 = 3 \+ j4, z2 = 1 - j2, result = 4 \+ j2">/.test(sA) && /<\/svg>$/.test(sA) && (sA.match(/<polygon/g) || []).length === 5 && sA.indexOf('stroke-dasharray') > 0, 'phasor diagram: addition draws z1, z2, the result and the two dashed parallelogram sides, with a text alternative');
    C((sM.match(/<polygon/g) || []).length === 3 && sM.indexOf('stroke-dasharray') < 0 && sM.indexOf('z\u2081 \u00d7 z\u2082') > 0 && /Result angle \u03b8 = -10\.3\u00b0/.test(sM), 'phasor diagram: multiplication draws three arrows, no dashed lines and the result angle -10.3 degrees');
    C((sC.match(/<polygon/g) || []).length === 1 && sC.indexOf('z\u2082') < 0 && /Result angle \u03b8 = 53\.13\u00b0/.test(sC), 'phasor diagram: convert-only draws z1 alone with its angle 53.13 degrees');
    C(sv({ op: 3, z1: [1, 1], z2: [1, 1], res: [NaN, 0] }) === '' && sv({ op: 0, z1: [Infinity, 0], z2: null, res: [0, 0] }) === '', 'phasor diagram: a value that is not finite draws nothing');
    const sZ = sv({ op: 0, z1: [0, 0], z2: null, res: [0, 0] }), sB = sv({ op: 1, z1: [1e9, 1e9], z2: [-1e9, 2e9], res: [0, 3e9] }), sS = sv({ op: 2, z1: [1e-9, 0], z2: [1e-9, 0], res: [0, 0] });
    C(sZ.indexOf('NaN') < 0 && sB.indexOf('NaN') < 0 && sS.indexOf('NaN') < 0 && sZ.indexOf('Infinity') < 0 && sB.indexOf('Infinity') < 0, 'phasor diagram: zero, huge and tiny phasors give a drawing with no NaN or Infinity in it');
    const ptsOk = (sx) => (sx.match(/(?:x|y|cx|cy|x1|y1|x2|y2)="(-?[\d.]+)"/g) || []).every((m2) => { const v = Number(m2.match(/"(-?[\d.]+)"/)[1]); return v >= -1 && v <= 321; });
    C(ptsOk(sA) && ptsOk(sM) && ptsOk(sC) && ptsOk(sB), 'phasor diagram: every coordinate stays inside the 320 by 260 drawing');
  }

  /* phasor diagram on the phasor sum page (v1.65.0): data from llCompute, drawing from llPhasorSumSvg */
  {
    const fp = (over) => bp.llCompute(E, CALC.forms['phasor-sum'], Object.assign(dflt('phasor-sum'), over)), sv = bp.llPhasorSumSvg;
    const near = (a, b) => Math.abs(a - b) < 1e-9, d0 = fp({}).diagram, d3 = fp({ m1: 230, t1: 0, m2: 230, t2: -120, m3: 230, t3: 120 }).diagram, dSub = fp({ m1: 230, t1: 0, s2: -1, m2: 230, t2: -120, m3: 0 }).diagram, d1 = fp({ m2: 0, m3: 0 }).diagram;
    C(d0.ph.length === 2 && near(d0.ph[0].x, 10 * Math.cos(Math.PI / 6)) && near(d0.ph[0].y, 5) && near(d0.ph[1].x, 5 * Math.cos(Math.PI / 4)) && near(d0.ph[1].y, -5 * Math.sin(Math.PI / 4)) && Math.abs(d0.res[0] - 12.19578794) < 1e-6 && Math.abs(d0.res[1] - 1.46446609) < 1e-6, 'phasor sum form: the default 10 at 30 degrees plus 5 at -45 degrees gives two phasors and the resultant 12.1958 + j1.4645');
    C(d1.ph.length === 1 && dSub.ph.length === 2 && dSub.ph[1].sg === -1 && near(dSub.ph[1].x, -230 * Math.cos(-2 * Math.PI / 3)) && near(dSub.res[0], 345) && d3.ph.length === 3 && near(d3.res[0], 0) && near(d3.res[1], 0), 'phasor sum form: a zero magnitude leaves a phasor out, a subtracted phasor is stored negated, and a balanced three-phase set gives three phasors that sum to zero');
    const s2 = sv(d0), s3 = sv(d3), sS = sv(dSub), s1 = sv(d1);
    C(/^<svg viewBox="0 0 320 260" role="img" aria-label="Phasor diagram: phasor 1 = 10 at 30 degrees, phasor 2 = 5 at -45 degrees, resultant = 12.2834 at 6.8473 degrees">/.test(s2) && /<\/svg>$/.test(s2) && (s2.match(/<polygon/g) || []).length === 4 && (s2.match(/stroke-dasharray/g) || []).length === 1 && /Resultant R = 12\.2834 \u2220 6\.85\u00b0/.test(s2) && s2.indexOf('>P\u2081<') > 0 && s2.indexOf('>P\u2082<') > 0 && s2.indexOf('>R<') > 0, 'phasor sum diagram: two phasors draw two arrows, the resultant and one dashed head-to-tail arrow (four arrowheads), with a text alternative and the resultant angle');
    C((s3.match(/<polygon/g) || []).length === 5 && (s3.match(/stroke-dasharray/g) || []).length === 2 && s3.indexOf('>R<') < 0 && s3.indexOf('R = 0') > 0 && /resultant = 0 at 0 degrees/.test(s3), 'phasor sum diagram: a balanced three-phase set draws three arrows and two dashed arrows that close the triangle, has no resultant arrow, and says R = 0');
    C(sS.indexOf('>\u2212P\u2082<') > 0 && /minus phasor 2 = 230 at -120 degrees/.test(sS) && /Resultant R = 398\.372 \u2220 30\u00b0/.test(sS), 'phasor sum diagram: a subtracted phasor is labelled with a minus and 230 minus 230 at -120 degrees gives 398.372 at 30 degrees');
    C((s1.match(/<polygon/g) || []).length === 1 && s1.indexOf('>R<') < 0 && s1.indexOf('stroke-dasharray') < 0 && /Resultant R = 10 \u2220 30\u00b0/.test(s1), 'phasor sum diagram: a single phasor draws one arrow and no separate resultant');
    C(/resultant = 0 at 0 degrees/.test(sv({ ph: [{ n: 1, sg: 1, m: 230, th: 0, x: 230, y: 0 }, { n: 2, sg: 1, m: 230, th: 180, x: -230, y: 2.8e-14 }], res: [1.1e-13, 2.8e-14] })), 'phasor sum diagram: a rounding residue of about 1e-13 is drawn as a zero resultant');
    C(sv({ ph: [{ n: 1, sg: 1, m: 1, th: 0, x: 1, y: 0 }], res: [NaN, 0] }) === '' && sv({ ph: [{ n: 1, sg: 1, m: 1, th: 0, x: Infinity, y: 0 }], res: [0, 0] }) === '', 'phasor sum diagram: a value that is not finite draws nothing');
    const sZ = sv({ ph: [{ n: 1, sg: 1, m: 0, th: 0, x: 0, y: 0 }], res: [0, 0] }), sB = sv({ ph: [{ n: 1, sg: 1, m: 1e9, th: 45, x: 1e9, y: 1e9 }, { n: 2, sg: 1, m: 2e9, th: 135, x: -1e9, y: 2e9 }], res: [0, 3e9] }), sT = sv({ ph: [{ n: 1, sg: 1, m: 1e-9, th: 0, x: 1e-9, y: 0 }, { n: 2, sg: 1, m: 1e-9, th: 0, x: 1e-9, y: 0 }], res: [2e-9, 0] });
    C([sZ, sB, sT].every((x) => x.indexOf('NaN') < 0 && x.indexOf('Infinity') < 0), 'phasor sum diagram: zero, huge and tiny phasors give a drawing with no NaN or Infinity in it');
    const okc = (sx) => (sx.match(/(?:x|y|cx|cy|x1|y1|x2|y2)="(-?[\d.]+)"/g) || []).every((m2) => { const v = Number(m2.match(/"(-?[\d.]+)"/)[1]); return v >= -1 && v <= 321; });
    C([s2, s3, sS, s1, sB, sT].every(okc), 'phasor sum diagram: every coordinate stays inside the 320 by 260 drawing');
  }

  /* phasor diagram on the AC Ohm's law page (v1.66.0): V and I as arrows with the angle between them */
  {
    const fa = (over) => bp.llCompute(E, CALC.forms['ac-ohms-law'], Object.assign(dflt('ac-ohms-law'), over)), sv = bp.llPhasorVISvg, near = (a, b) => Math.abs(a - b) < 1e-9;
    const d0 = fa({}).diagram, dC = fa({ Z: '23', Zang: '-60' }).diagram, dR = fa({ Zang: '0' }).diagram, dZ = fa({ V: '', Vang: '', I: '5', Iang: '-30', Z: '46', Zang: '30' }).diagram;
    C(near(d0.V[0], 230) && near(d0.V[1], 0) && near(d0.I[0], 5) && near(d0.I[1], -30) && near(dC.I[0], 10) && near(dC.I[1], 60) && near(dR.I[1], 0) && near(dZ.V[0], 230) && near(dZ.V[1], 0), 'AC Ohm\'s law form: the defaults give V 230 at 0 and I 5 at -30 degrees, a capacitive load gives I leading, and solving for voltage still gives the voltage phasor');
    const s0 = sv(d0), sC = sv(dC), sR = sv(dR);
    C(/^<svg viewBox="0 0 320 260" role="img" aria-label="Phasor diagram: voltage 230 at 0 degrees, current 5 at -30 degrees, current lagging the voltage by 30 degrees">/.test(s0) && /<\/svg>$/.test(s0) && (s0.match(/<polygon/g) || []).length === 2 && s0.indexOf('<path') > 0 && /I lags V by 30\u00b0 \(inductive\)/.test(s0) && s0.indexOf('>V<') > 0 && s0.indexOf('>I<') > 0 && s0.indexOf('not to scale') > 0, 'AC Ohm\'s law diagram: an inductive load draws V, I and the angle arc, says the current lags by 30 degrees, and says it is not to scale');
    C(/I leads V by 60\u00b0 \(capacitive\)/.test(sC) && /current leading the voltage by 60 degrees/.test(sC) && sC.indexOf('<path') > 0, 'AC Ohm\'s law diagram: a capacitive load says the current leads by 60 degrees');
    C(/I is in phase with V/.test(sR) && sR.indexOf('<path') < 0 && /current in phase with the voltage/.test(sR), 'AC Ohm\'s law diagram: a resistive load has no angle arc and says the current is in phase');
    C(sv({ V: [NaN, 0], I: [1, 0] }) === '' && sv({ V: [1, 0], I: [1, Infinity] }) === '', 'AC Ohm\'s law diagram: a value that is not finite draws nothing');
    const sE = sv({ V: [1e12, 180], I: [1e-12, -180] }), sH = sv({ V: [230, 170], I: [2, -170] });
    C(/in phase/.test(sE) && /I lags V by 340\u00b0|I leads V by 20\u00b0|in phase/.test(sH) && [s0, sC, sR, sE, sH].every((x) => x.indexOf('NaN') < 0 && x.indexOf('Infinity') < 0), 'AC Ohm\'s law diagram: huge, tiny and wrapped-angle values give a drawing with no NaN or Infinity');
    const okc = (sx) => (sx.match(/(?:x|y|cx|cy|x1|y1|x2|y2)="(-?[\d.]+)"/g) || []).every((m2) => { const v = Number(m2.match(/"(-?[\d.]+)"/)[1]); return v >= -1 && v <= 321; });
    C([s0, sC, sR, sE, sH].every(okc), 'AC Ohm\'s law diagram: every coordinate stays inside the 320 by 260 drawing');
  }
  /* header status strip contrast (v1.67.0): measured 3.4 to 4.3:1 with the old colours on the lighter right of the header gradient */
  {
    const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }, lm = (h) => { const n = parseInt(h.slice(1), 16); return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); }, cr = (h) => (lm(h) + 0.05) / (lm('#1861B4') + 0.05);
    const RT = path.join(__dirname, '..'), idx = fs.readFileSync(path.join(RT, 'index.html'), 'utf8'), css = fs.readFileSync(path.join(RT, 'tools', 'premium_app.css'), 'utf8');
    const col = (src, re) => { const m = src.match(re); return m ? m[1] : ''; };
    const lab = col(idx, /\.tb b \{ color: (#[0-9A-Fa-f]{6});/), ok = col(idx, /\.tb \.ok \{ color: (#[0-9A-Fa-f]{6});/), hov = col(idx, /\.th:hover \{ color: (#[0-9A-Fa-f]{6});/);
    C(lab !== '' && ok !== '' && cr(lab) >= 4.5 && cr(ok) >= 4.5 && cr(hov) >= 4.5, 'app header strip: label, PASS and hover colours reach 4.5:1 against the lightest part of the header gradient (rgb 24, 97, 180)');
    C(col(css, /\.tb b \{ color: (#[0-9A-Fa-f]{6});/) === lab, 'app header strip: the label colour in index.html equals the one in tools/premium_app.css');
  }
  /* phasor diagram on the Series RLC Impedance page (v1.67.0): the impedance triangle R, X and Z */
  {
    const fr = (over) => bp.llCompute(E, CALC.forms['impedance-rlc'], Object.assign(dflt('impedance-rlc'), over)), sv = bp.llPhasorRLCSvg, near = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
    const w = 2 * Math.PI * 50, X1 = w * 0.2 - 1 / (w * 100e-6), X0 = w * 0.1 - 1 / (w * 100e-6);
    const d0 = fr({}).diagram, dL = fr({ L: '200' }).diagram, dC = fr({ L: '10' }).diagram;
    const XCc = 1 / (w * 100e-6), dRes = fr({ L: String(XCc / w * 1000) }).diagram;
    C(CALC.forms['impedance-rlc'].diagram === 'phasor-rlc' && cpg['impedance-rlc'].indexOf('function llPhasorRLCSvg') > 0 && SL.every((s2) => s2 === 'impedance-rlc' || cpg[s2].indexOf('function llPhasorRLCSvg') < 0), 'impedance form: only the Series RLC Impedance page carries the impedance-triangle drawing code');
    C(near(d0.R, 10) && near(d0.X, X0) && near(dL.R, 10) && near(dL.X, X1) && dC.X < 0 && Math.abs(dRes.X) < 1e-6, 'impedance form: the defaults give R 10 and X = XL - XC = -0.4146, 200 mH gives +31.0, 10 mH is capacitive, and XL = XC gives X of about 0');
    const s0 = sv(d0), sL = sv(dL), sC = sv(dC), sRs = sv({ R: 10, X: 0 });
    C(/^<svg viewBox="0 0 320 260" role="img" aria-label="Impedance triangle on the complex plane: resistance 10 ohms, net reactance 31\.\d+ ohms, impedance 3\d\.\d+ ohms at 72\.\d+ degrees, inductive">/.test(sL) && /<\/svg>$/.test(sL) && (sL.match(/<polygon/g) || []).length === 3 && sL.indexOf('<path') > 0 && />Z</.test(sL) && />X</.test(sL) && />R</.test(sL) && /\(inductive\)/.test(sL), 'impedance diagram: an inductive circuit draws R, X and Z with the angle arc and says inductive, with a text alternative');
    C(/degrees, capacitive">/.test(sC) && /\(capacitive\)/.test(sC) && /-\d/.test(sC.match(/at (-?[\d.]+) degrees/)[0]) && /\(capacitive\)/.test(s0), 'impedance diagram: a capacitive circuit (including the 10 ohm, 100 mH, 100 uF default) says capacitive with a negative angle');
    C((sRs.match(/<polygon/g) || []).length === 1 && sRs.indexOf('<path') < 0 && /\(resistive\)/.test(sRs) && />Z</.test(sRs) === false, 'impedance diagram: zero net reactance draws R alone, no angle arc, and says resistive');
    C(sv({ R: NaN, X: 1 }) === '' && sv({ R: 1, X: Infinity }) === '', 'impedance diagram: a value that is not finite draws nothing');
    const sE = sv({ R: 1e12, X: 1e-3 }), sT = sv({ R: 1e-12, X: 1e12 }), sH = sv({ R: 5, X: -1e9 }), sN = sv({ R: 10, X: 1e-12 });
    C([s0, sL, sC, sRs, sE, sT, sH, sN].every((x) => x.indexOf('NaN') < 0 && x.indexOf('Infinity') < 0 && x.indexOf('e+') < 0 && x.indexOf('e-') < 0 || /\u03a9/.test(x) && x.indexOf('NaN') < 0 && x.indexOf('Infinity') < 0), 'impedance diagram: huge, tiny and lopsided values give a drawing with no NaN or Infinity in it');
    const okc = (sx) => (sx.match(/(?:x|y|cx|cy|x1|y1|x2|y2)="(-?[\d.]+)"/g) || []).every((m2) => { const v = Number(m2.match(/"(-?[\d.]+)"/)[1]); return v >= -1 && v <= 321; });
    C([s0, sL, sC, sRs, sE, sT, sH, sN].every(okc), 'impedance diagram: every coordinate stays inside the 320 by 260 drawing');
    C(/resistive/.test(sN) && sN.indexOf('<path') < 0, 'impedance diagram: a reactance of 1e-12 against 10 ohms is treated as zero, not drawn as a sliver');
  }
  {
    const f = (slug, over) => bp.llCompute(E, CALC.forms[slug], Object.assign(dflt(slug), over));
    const n1 = (r, i) => Number(r.items[i || 0].text.replace(/[, ]/g, '').match(/^-?[\d.]+/)[0]), nr = (a, b) => Math.abs(a - b) <= 6e-3 * Math.max(1, Math.abs(b));
    let r = f('generator-sizing', { P: '200' }); C(r.ok && nr(n1(r), 200 / 0.8 * 1.25) && n1(r, 1) >= n1(r) && n1(r, 1) <= 1.25 * n1(r) && nr(n1(r, 2), n1(r, 1) * 1000 / (sq * 415)), 'generator form: 200 kW at pf 0.8 and 25% margin needs 312.5 kVA; the standard size is not smaller, and the current is that size / (√3 × 415 V)');
    r = f('battery-bank-sizing', { t: '8' }); C(r.ok && nr(n1(r), 500 * 8 / (48 * 0.8 * 0.9)), 'battery form: doubling the backup time doubles the capacity (115.7 Ah)');
    r = f('motor-current', { P: '11', V: '400', eff: '0.9', pf: '0.85' }); C(r.ok && nr(n1(r), 11000 / (0.9 * sq * 400 * 0.85)), 'motor-current form: 11 kW, 400 V, efficiency 0.9, pf 0.85 gives 11000 / (0.9 × √3 × 400 × 0.85)');
    r = f('motor-starting', { meth: '2' }); C(r.ok && nr(n1(r), 910 / 3) && nr(n1(r, 1), 100 / 3), 'motor-starting form: star-delta divides the starting current and the torque by 3');
    r = f('motor-starting', { meth: '3', tap: '0.65' }); C(r.ok && nr(n1(r), 910 * 0.65 * 0.65), 'motor-starting form: a 0.65 auto-transformer tap gives 0.4225 of the direct-on-line current');
    r = f('transformer-fault-current', { Z: '8' }); C(r.ok && nr(n1(r), 1000000 / (sq * 415 * 0.08) / 1000), 'fault-current form: impedance 8% gives 1000 kVA / (√3 × 415 V × 0.08)');
    r = f('earth-resistance', { L: '6' }); C(r.ok && nr(n1(r), (100 / (2 * Math.PI * 6)) * (Math.log(8 * 6 / 0.016) - 1)), 'earth-resistance form: a 6 m rod follows R = ρ / (2πL) × (ln(8L/d) − 1)');
    r = f('solar-pv-string-size', { Tmin: '-20' }); C(r.ok && nr(n1(r), 49.5 * (1 + 0.0028 * 45)) && n1(r, 1) === Math.floor(1000 / (49.5 * (1 + 0.0028 * 45))), 'string-size form: at −20 °C the cold voltage is 55.7 V and the string is 17 modules');
    r = f('cable-derating', { Ta: '50', kg: '0.7' }); { const k2 = Math.sqrt((90 - 50) / (90 - 30)); C(r.ok && nr(n1(r), k2) && nr(n1(r, 1), 300 * k2 * 0.7), 'cable-derating form: 50 °C ambient and grouping 0.7 give Iz = 300 × kt × 0.7'); }
    r = f('agl-ccr-loading', { n: '120' }); C(r.ok && n1(r, 2) === 15 || r.ok && n1(r, 2) > 7.5, 'agl form: doubling the fittings moves the regulator to a larger standard size');
    r = f('motor-current', { P: 'abc' }); C(!r.ok && r.errors.length === 1, 'a non-numeric entry returns an error message, not a result');
    r = f('battery-bank-sizing', { P: '' }); C(!r.ok, 'a blank required field returns an error');
  }
  /* FAQ, head tags and structured data */
  {
    const SITE = 'https://example.com/elecmetric', dep = bp.build({ base: SITE }), ldp = (h) => { const m = h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/); return m ? JSON.parse(m[1].replace(/\\u003c/g, '<')) : null; };
    SL.forEach((s) => { const h = cpg[s], f = CALC.faqs[s], d = dep.calc.pages[s], g = ldp(d);
      C(f.length >= 5 && new Set(f.map((x) => x[0])).size === f.length && f.every((x) => x[0].length > 8 && x[1].length > 30) && (h.match(/<h3>/g) || []).length === f.length, s + ': visible FAQ with ' + f.length + ' distinct questions, each answered');
      C(h.indexOf('twitter:card') > 0 && h.indexOf('rel="canonical"') < 0 && h.indexOf('ld+json') < 0 && h.indexOf('href="../../icon.svg"') > 0, s + ': without BASE_URL the page has twitter tags, no canonical or structured data, and the right icon path');
      C(d.indexOf('<link rel="canonical" href="' + SITE + '/calculators/' + s + '/">') > 0 && d.indexOf('<meta property="og:url" content="' + SITE + '/calculators/' + s + '/">') > 0, s + ': with BASE_URL the canonical and og:url are the clean URL ending in a slash');
      const ty = g && g['@graph'].map((x) => x['@type']); C(g && ty.join() === 'BreadcrumbList,WebApplication,FAQPage' && g['@graph'][0].itemListElement.length === 3 && g['@graph'][0].itemListElement[1].item === SITE + '/calculators/' && g['@graph'][0].itemListElement[2].item === SITE + '/calculators/' + s + '/' && g['@graph'][1].url === SITE + '/calculators/' + s + '/', s + ': JSON-LD parses, with a 3-level BreadcrumbList through the hub and a WebApplication for this URL'); });
    const gh = ldp(dep.calc.pages['index']); C(gh && gh['@graph'].length === 1 && gh['@graph'][0].itemListElement.length === 2 && dep.calc.pages['index'].indexOf('<link rel="canonical" href="' + SITE + '/calculators/">') > 0, 'engineering hub: canonical and a 2-level BreadcrumbList');
  }
  const STRIPC = (h) => h.replace(/<link rel="canonical" href="[^"]*">/g, '').replace(/<meta property="og:url" content="[^"]*">/g, '').replace(/<meta property="og:image[^"]*" content="[^"]*">/g, '').replace(/<meta name="twitter:image" content="[^"]*">/g, '').replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
  C(Object.keys(cpg).every((k) => { const f = pth.join(__dirname, '..', 'calculators', k === 'index' ? '' : k, 'index.html'); return fsx.existsSync(f) && STRIPC(fsx.readFileSync(f, 'utf8')) === cpg[k]; }), 'committed calculators/ equals what the generator produces, ignoring only the deploy-time canonical, og:url and JSON-LD (run: node tools/build_pages.js)');
  total += n12; console.log('12. calculator pages:', n12 + '/' + n12, 'checked');
}
/* 13. Issue 5: standards handling in the Feeder Designer. Expected values are textbook rules written here. */
{
  let n13 = 0; const G = (c, m) => { n13++; ok(c, m); };
  const base = { P: [250, 'kW'], V: [400, 'V'], pf: 0.9, L: [180, 'm'], R: [0.0601, 'Ω/km'], X: [0.08, 'Ω/km'], limit: 3, S: [1000, 'kVA'], Z: 5, A: [300, 'mm²'], Itab: [750, 'A'], Ta: 40, kg: 0.8, mat: 2, t: 0.5 };
  const F = (o) => E.runFeeder(Object.assign({}, base, o)), st = (r, id) => r.steps.find((x) => x.id === id);
  const Ib = 250000 / (Math.sqrt(3) * 400 * 0.9), kt = Math.sqrt((90 - 40) / (90 - 30));
  /* NEC: 125% only on continuous load */
  const nc = F({ basis: 2, cont: 0 }), cn = F({ basis: 2, cont: 1 }), dflt = F({ basis: 2 });
  const inOf = (r) => Number(st(r, 'breaker-size').headline.replace(/[^\d.]/g, ''));
  G(nc.ok && cn.ok && dflt.ok, 'NEC-style feeder runs with continuous and non-continuous load');
  G(inOf(cn) >= 1.25 * Ib && inOf(cn) === inOf(dflt), 'NEC continuous (also the default): the breaker is at least 1.25 × Ib (' + inOf(cn) + ' A for Ib ' + Ib.toFixed(1) + ' A)');
  G(inOf(nc) >= Ib && inOf(nc) < 1.25 * Ib && inOf(nc) < inOf(cn), 'NEC non-continuous: the breaker is at least Ib but no 125% factor (' + inOf(nc) + ' A)');
  const hi = { Itab: [770, 'A'] }, ncH = F(Object.assign({ basis: 2, cont: 0 }, hi)), cnH = F(Object.assign({ basis: 2, cont: 1 }, hi)), Iz = 770 * kt * 0.8;
  G(Math.abs(st(ncH, 'cable-derating').value - Iz) < 0.05 && Math.abs(st(cnH, 'cable-derating').value - Iz) < 0.05, 'the derated capacity does not depend on the load type (770 A × kt × 0.8 = ' + Iz.toFixed(1) + ' A)');
  G(st(ncH, 'cable-derating').status === 'pass' && st(cnH, 'cable-derating').status === 'fail' && cnH.failed === true && ncH.failed === false, 'the same cable passes as a non-continuous feeder (500 A ≤ ' + Iz.toFixed(0) + ' A) and fails as a continuous one (630 A)');
  G(/non-continuous/.test(nc.report) && /continuous/.test(cn.report) && /no 125% factor/.test(nc.report) && /1\.25 × Ib/.test(cn.report), 'the calculation sheet states the load type and the rule applied');
  [1, 4, 5, 6].forEach((b) => G(inOf(F({ basis: b, cont: 0 })) === inOf(F({ basis: b, cont: 1 })) && inOf(F({ basis: b, cont: 0 })) === 500, 'basis ' + b + ': the load-type choice changes nothing (no 125% factor)'));
  G(F({ basis: 2, cont: 2 }).ok === false && F({ basis: 5, circ: 2 }).ok === false, 'an invalid load type or circuit type is rejected');
  /* Mixed continuous and non-continuous load (NEC-style): rating covers non-continuous + 125% of continuous. Current is proportional to power, so Ieq = Ib × ((P - Pc) + 1.25 Pc) / P. */
  {
    const m0 = { P: [150, 'kW'] }, Ib2 = 150000 / (Math.sqrt(3) * 400 * 0.9), ieq = (pc) => Ib2 * ((150 - pc) + 1.25 * pc) / 150;
    const M = (pc, o) => F(Object.assign({ basis: 2 }, m0, pc === undefined ? {} : { Pc: [pc, 'kW'] }, o || {}));
    const ncM = M(undefined, { cont: 0 }), cnM = M(undefined, { cont: 1 }), m20 = M(20), m50 = M(50), m0k = M(0), mAll = M(150);
    G([ncM, cnM, m20, m50, m0k, mAll].every((r) => r.ok), 'mixed load runs on the NEC-style basis');
    G(inOf(m0k) === inOf(ncM) && inOf(mAll) === inOf(cnM), 'a mixed load with 0 kW continuous equals non-continuous (' + inOf(ncM) + ' A) and with all of it continuous equals continuous (' + inOf(cnM) + ' A)');
    G(inOf(m20) >= ieq(20) && inOf(m20) === inOf(ncM) && inOf(m50) >= ieq(50) && inOf(m50) > inOf(ncM) && inOf(m50) <= inOf(cnM), 'mixed rating is at least Ib × (non-continuous + 1.25 × continuous) / P: 20 kW continuous needs ' + ieq(20).toFixed(1) + ' A (' + inOf(m20) + ' A), 50 kW needs ' + ieq(50).toFixed(1) + ' A (' + inOf(m50) + ' A)');
    G(inOf(M(75)) >= inOf(m20) && inOf(M(100)) >= inOf(M(75)), 'more continuous load never gives a smaller rating');
    const hiM = { Itab: [380, 'A'] }, Izm = 380 * kt * 0.8, mH = M(20, hiM), cH = M(undefined, Object.assign({ cont: 1 }, hiM));
    G(Math.abs(st(mH, 'cable-derating').value - Izm) < 0.05 && st(mH, 'cable-derating').status === 'pass' && st(cH, 'cable-derating').status === 'fail', 'the same cable (' + Izm.toFixed(1) + ' A derated) passes a 20 kW continuous mixed load (250 A) and fails when all of it is continuous (320 A)');
    G(/mixed load: 20 kW continuous and 130 kW non-continuous/.test(m20.report) && /1\.25 × Ib continuous/.test(m20.report), 'the calculation sheet states the continuous and non-continuous parts and the rule');
    G(M(151).ok === false && M(-1).ok === false, 'a continuous part above the total load, or negative, is rejected');
    [1, 4, 5, 6].forEach((b) => G(inOf(F({ basis: b, P: [150, 'kW'], Pc: [50, 'kW'] })) === inOf(F({ basis: b, P: [150, 'kW'] })), 'basis ' + b + ': a continuous part changes nothing (no 125% factor)'));
    G(inOf(M(50, { cont: 0 })) === inOf(m50) && inOf(M(50, { cont: 1 })) === inOf(m50), 'when a continuous part is entered it overrides the load type choice');
  }
  /* BS 7671: 3% lighting, 5% other uses */
  const vd = (r) => st(r, 'voltage-drop');
  const bl = F({ basis: 5, circ: 1, limit: 5 }), bo = F({ basis: 5, circ: 0, limit: 5 }), bd = F({ basis: 5, limit: 3 });
  G(/Reference: 3% for lighting circuits \(BS 7671 Appendix 4\)/.test(vd(bl).check) && /above it/.test(vd(bl).check), 'BS 7671 lighting circuit: the reference is 3% and a 5% limit is flagged as above it');
  G(/Reference: 5% for other uses \(BS 7671 Appendix 4\)/.test(vd(bo).check) && !/above it/.test(vd(bo).check), 'BS 7671 other uses: the reference is 5% and a 5% limit is not flagged');
  G(/Reference: 5% for other uses/.test(vd(bd).check) && vd(bl).status === 'pass', 'BS 7671 default circuit type is other uses; the reference is advice and does not change the pass/fail of your own limit');
  const lightOk = F({ basis: 5, circ: 1, limit: 3 }); G(!/above it/.test(vd(lightOk).check) && /lighting circuits/.test(lightOk.report) && /3% for lighting circuits/.test(lightOk.report), 'BS 7671 lighting with a 3% limit is not flagged, and the sheet records the circuit type and reference');
  /* AS/NZS: the ampacity basis (3008) and the voltage-drop reference (3000) are different documents */
  const an = F({ basis: 6 });
  G(/AS\/NZS 3000/.test(vd(an).check) && !/3008/.test(vd(an).check) && /5%/.test(vd(an).check), 'AS/NZS: the voltage-drop reference is 5% from AS/NZS 3000, not 3008');
  G(/Ampacity basis: AS\/NZS 3008\. Voltage-drop reference: AS\/NZS 3000\./.test(an.report) && /AS\/NZS 3008 ampacity basis/.test(E.BY_ID['cable-derating'].inputs.find((x) => x.key === 'basis').labels[6]), 'AS/NZS: the sheet and the basis label name 3008 as the ampacity basis and 3000 as the voltage-drop reference');
  G(E.BASES[6].ampRef === 'AS/NZS 3008' && E.BASES[6].vdRef === 'AS/NZS 3000' && E.BASES[5].vdLight === 3 && E.BASES[5].vdMax === 5, 'the bases carry the ampacity reference and the voltage-drop reference as separate fields');
  [1, 2, 4].forEach((b) => G(!/Reference:/.test(vd(F({ basis: b })).check) && /No voltage-drop reference is set/.test(F({ basis: b }).report), 'basis ' + b + ': no voltage-drop reference is invented'));
  total += n13; console.log('13. standards handling:', n13 + '/' + n13, 'checked');
}
/* 14. Issue 6: every calculator has independent vectors, and the ten added in Issue 6 behave correctly beyond the end of their size tables.
   Expected values are written here from the rules each calculator publishes. */
{
  let n14 = 0; const H = (c, m) => { n14++; ok(c, m); };
  const ids = new Set(vec.map((v) => v.id));
  H(E.CALCS.every((c) => ids.has(c.id)), 'every registered calculator has at least one independent reference vector' + (E.CALCS.filter((c) => !ids.has(c.id)).map((c) => ': ' + c.id).join('')));
  H([...ids].every((id) => E.BY_ID[id]), 'every vector refers to a registered calculator');
  const six = ['breaker-size', 'cable-size-vd', 'cable-sc-withstand', 'motor-starting', 'pv-string-size', 'copper-vs-aluminium', 'transformer-sizing', 'maximum-demand', 'parallel-cable-sets', 'agl-ccr-loading'];
  six.forEach((id) => H(vec.filter((v) => v.id === id).length >= 15, id + ': at least 15 vectors'));
  const A = (id, p) => E.api(id, p);
  const beyond = (r, key) => r.ok && !Number.isFinite(r.outputs[key].value) && (r.warnings || []).length > 0;
  H(beyond(A('breaker-size', { I: 4001, m: 1 }), 'In'), 'breaker above 4000 A: no rating is invented, a warning is given');
  H(A('breaker-size', { I: 3200, m: 1 }).outputs.In.value === 3200 && A('breaker-size', { I: 3200.01, m: 1 }).outputs.In.value === 4000, 'breaker: 3200 A selects 3200 A and just above selects 4000 A');
  H(beyond(A('transformer-sizing', { P: 3000, pf: 0.9, g: 10, ld: 0.8, V: 415 }), 'Ss'), 'transformer above 3150 kVA: no size is invented, a warning is given');
  H(Math.abs(A('transformer-sizing', { P: 3000, pf: 0.9, g: 10, ld: 0.8, V: 415 }).outputs.Sr.value - 3000 / 0.9 * 1.1 / 0.8) < 1e-6, 'transformer above the list still reports the required kVA');
  H(beyond(A('agl-ccr-loading', { n: 300, Pl: 200, et: 0.7, I: 6.6, L: 12000, R: 5, ld: 0.5 }), 'ccr'), 'CCR load above 30 kW: no size is invented, a warning is given');
  H(beyond(A('cable-sc-withstand', { Isc: 60, t: 5, mat: 3 }), 'Astd'), 'short-circuit size above 630 mm²: no size is invented, a warning is given');
  H(!A('cable-size-vd', { I: 700, L: 2000, V: 230, lim: 2, pf: 0.9, mat: 2, ins: 1, X: 0.08, phase: 1 }).ok, 'voltage-drop sizing refuses when reactive drop alone uses the whole allowance');
  H(A('parallel-cable-sets', { Ib: 1200, Iz: 400, kg: 0.8 }).outputs.n.value === 4 && A('parallel-cable-sets', { Ib: 800, Iz: 400, kg: 1 }).outputs.n.value === 2, 'parallel sets: 3.75 rounds up to 4, an exact 2.0 stays at 2');
  H(A('pv-string-size', { Voc: 50, tc: 0, Tmin: 25, Vmax: 1000 }).outputs.N.value === 20, 'PV string: an exact fit keeps the last module (1000 / 50 = 20)');
  total += n14; console.log('14. every calculator independently checked:', n14 + '/' + n14, 'checked');
}
/* 15. Issue 7: version and documentation stay in step with the code. The roadmap status section is checked against the engine, not typed twice. */
{
  let n15 = 0; const K = (c, m) => { n15++; ok(c, m); };
  const fsx = require('fs'), rm = fsx.readFileSync(path.join(__dirname, '..', 'ROADMAP.md'), 'utf8');
  const hist = fsx.readFileSync(path.join(__dirname, '..', 'docs', 'ROADMAP_HISTORY.md'), 'utf8');
  const status = (/## Current status([\s\S]*?)\n## /.exec(rm) || [, ''])[1];
  const vcount = {}; vec.forEach((v) => { vcount[v.id] = 1; });
  const covered = E.CALCS.filter((c) => vcount[c.id]).length;
  const divs = new Set(E.CALCS.map((c) => c.division)).size;
  const fmtN = (n) => n.toLocaleString('en-US');
  K(status.length > 0, 'ROADMAP.md starts with a Current status section');
  K(new RegExp('\\*\\*Version:\\*\\* ' + E.VERSION.replace(/\./g, '\\.') + '\\b').test(status), 'roadmap status version equals the engine version (' + E.VERSION + ')');
  K(new RegExp('\\*\\*Calculators:\\*\\* ' + E.CALCS.length + ' ').test(status) && new RegExp('across ' + divs + ' divisions').test(status), 'roadmap status calculator and division counts equal the registry (' + E.CALCS.length + ', ' + divs + ')');
  K(new RegExp('\\*\\*Independent reference vectors:\\*\\* ' + fmtN(vec.length) + ' across ' + covered + ' of ' + E.CALCS.length + ' calculators').test(status), 'roadmap status vector counts equal the vector file (' + fmtN(vec.length) + ' across ' + covered + ' of ' + E.CALCS.length + ')');
  { const bpx = require('../tools/build_pages.js'), nUrls = bpx.build({ base: 'https://x.example' }).root['sitemap.xml'].split('<loc>').length - 1; K(new RegExp('\\*\\*Indexable pages:\\*\\*[^\\n]*' + nUrls + ' URLs in the production sitemap').test(status) && new RegExp(bpx.CATS.length + ' category hubs').test(status) && new RegExp(bpx.CALC_DATA.length + ' calculator pages').test(status) && new RegExp(bpx.INTENTS.length + ' conversion pages').test(status), 'roadmap status page counts (' + bpx.INTENTS.length + ' conversion, ' + bpx.CALC_DATA.length + ' calculator, ' + bpx.CATS.length + ' category hubs, ' + nUrls + ' sitemap URLs) equal what the generator builds'); }
  { const bpd = require('../tools/build_pages.js'), smx = bpd.build({ base: 'https://x.example' }).root['sitemap.xml'], cnt = (pre) => smx.split('<loc>https://x.example/' + pre).length - 1, nC = cnt('calculators/'), nV = cnt('converters/'), nP = cnt('pages/'), dep = fsx.readFileSync(path.join(__dirname, '..', 'DEPLOY.md'), 'utf8'), roadAll = fsx.readFileSync(path.join(__dirname, '..', 'ROADMAP.md'), 'utf8');
    K(dep.indexOf('`pages/` (' + nP + ':') >= 0 && dep.indexOf('`calculators/` (' + nC + ':') >= 0 && dep.indexOf('`converters/` (' + nV + ')') >= 0, 'DEPLOY.md sitemap breakdown equals the real sitemap (pages ' + nP + ', calculators ' + nC + ', converters ' + nV + ')');
    K(roadAll.indexOf('`calculators/` ' + nC + ', `converters/` ' + nV + ')') >= 0, 'ROADMAP.md sitemap breakdown equals the real sitemap');
    K(roadAll.indexOf('0 of ' + E.CALCS.length + ' calculators have a recorded') >= 0 || /[1-9]\d* of \d+ calculators have a recorded/.test(roadAll), 'ROADMAP.md review-record count uses the real calculator total (' + E.CALCS.length + ')'); }
  const swv = /CACHE_VERSION = '([^']+)'/.exec(fsx.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'))[1];
  K(swv === E.VERSION, 'service worker cache version equals the engine version');
  K(new RegExp('## v' + E.VERSION.replace(/\./g, '\\.') + '\\b').test(hist), 'the history file has an entry for the current version');
  K(!/\bstill open\b/i.test(rm.replace(/Do not rely on "still open" lines there\./, '')) && !/not in this tree/i.test(rm), 'ROADMAP.md carries no historical "still open" notes; they stay in the history file');
  K(/Do not rely on "still open" lines/.test(rm) && /read `ROADMAP.md`/.test(hist), 'roadmap and history point at each other');
  const dep = fsx.readFileSync(path.join(__dirname, '..', 'DEPLOY.md'), 'utf8');
  K(/Upload:[^\n]*pages\/ calculators\//.test(dep), 'DEPLOY.md manual upload list includes pages/ and calculators/');
  { const wf = fsx.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'pages.yml'), 'utf8'); K(/cp -r [^\n]*\bpages calculators converters _site\//.test(wf), 'deploy workflow publishes pages, calculators and converters, so no sitemap URL is a 404'); K(/vars\.BASE_URL \|\| 'https:\/\/elecmetric\.com'/.test(wf), 'deploy workflow falls back to https://elecmetric.com, not the github.io address'); }
  /* v1.9.3: ids that match inherited Object properties must not resolve (router crash, API throw). */
  for (const bad of ['constructor', '__proto__', 'toString', 'hasOwnProperty', 'valueOf']) {
    K(E.BY_ID[bad] === undefined, 'BY_ID does not resolve inherited name ' + bad);
    let r; try { r = E.api(bad, {}); } catch (e) { r = null; }
    K(r && r.ok === false && /Unknown calculator/.test(r.error), 'api rejects inherited name ' + bad + ' without throwing');
  }
  { const idx = fsx.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8'); K(/special = Object\.assign\(Object\.create\(null\)/.test(idx), 'router special-page map has no inherited properties'); }
  { const sws = fsx.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'); K(/hit \|\| Response\.error\(\)/.test(sws) && /res\.ok && !url\.search/.test(sws), 'service worker never answers with undefined and does not cache query-string navigations'); }
  K(!/not modelled/i.test(fsx.readFileSync(path.join(__dirname, '..', 'STANDARDS.md'), 'utf8')), 'STANDARDS.md no longer says mixed loads are not modelled');
  total += n15; console.log('15. version and documentation in step with the code:', n15 + '/' + n15, 'checked');
}
/* 16. Issue 8: category hubs (/calculators/<category>/). Expected values come from the registry and the vector file, not from the generator. */
{
  let n16 = 0; const Q = (c, m) => { n16++; ok(c, m); };
  const bp = require('../tools/build_pages.js'), CATS = bp.CATS, CP = bp.build({ base: '' }), pg = CP.calc.pages, SITE = 'https://elecmetric.example';
  const dep = bp.build({ base: SITE }), fsx = require('fs'), pth = require('path');
  const slugs = CATS.map((k) => k.slug), calcSlugs = bp.CALC_DATA.map((c) => c.slug);
  const text = (h) => h.replace(/<style>[\s\S]*?<\/style>/, '').replace(/<script[\s\S]*?<\/script>/g, '');
  Q(CATS.length === 13 && new Set(slugs).size === 13 && slugs.every((s) => pg[s]), 'thirteen category hubs, each slug unique and built');
  Q(slugs.every((s) => calcSlugs.indexOf(s) < 0 && s !== 'index'), 'no category slug collides with a calculator page or the hub');
  /* every calculator has exactly one primary hub, and every division belongs to exactly one hub */
  const owner = (c) => CATS.filter((k) => k.divisions.indexOf(c.division.slice(0, 2)) >= 0);
  Q(E.CALCS.every((c) => owner(c).length === 1), 'every one of the 127 calculators has exactly one primary category' + E.CALCS.filter((c) => owner(c).length !== 1).map((c) => ': ' + c.id + ' (' + c.division + ')').join(''));
  const alldiv = CATS.reduce((a, k) => a.concat(k.divisions), []);
  Q(new Set(alldiv).size === alldiv.length && alldiv.every((d) => E.CALCS.some((c) => c.division.slice(0, 2) === d)), 'each division code is claimed by one hub only and every claimed division exists');
  CATS.forEach((k) => {
    const h = pg[k.slug], tx = text(h), prim = E.CALCS.filter((c) => owner(c)[0] === k), all = prim.map((c) => c.id).concat(k.also);
    const ti = /<title>([^<]*)<\/title>/.exec(h)[1], de = /<meta name="description" content="([^"]*)"/.exec(h)[1];
    Q(ti.length <= 60 && de.length >= 50 && de.length <= 160 && (h.match(/<h1>/g) || []).length === 1, k.slug + ': one h1, title ' + ti.length + ' and description ' + de.length + ' characters within search limits');
    Q(all.length >= 3 && all.every((id) => { const pgc = bp.CALC_DATA.find((c) => c.calc === id); return h.indexOf('href="' + (pgc ? '../' + pgc.slug + '/' : '../../index.html#' + id) + '"') > 0; }) && all.every((id) => tx.indexOf(E.BY_ID[id].title.replace(/&/g, '&amp;')) >= 0), k.slug + ': lists all ' + all.length + ' of its calculators by title and links to each one, to its guide page where one exists');
    Q(prim.length === 1 ? /<h2>The calculator in this category<\/h2>/.test(h) : new RegExp('<h2>All ' + prim.length + ' calculators in this category</h2>').test(h), k.slug + ': the heading count (' + prim.length + ') equals the registry count, and reads correctly for one');
    Q(/<h2>What these calculators do not cover<\/h2>/.test(h) && /<h2>Where to start<\/h2>/.test(h) && /<h2>Related categories<\/h2>/.test(h), k.slug + ': has where to start, limits and related categories');
    const nv = all.filter((id) => vec.some((v) => v.id === id)).length, tv = vec.filter((v) => all.indexOf(v.id) >= 0).length;
    Q(new RegExp('Cross-check: ' + (nv === all.length ? 'all ' + all.length : nv + ' of ' + all.length) + ' calculators listed here are compared with ' + tv.toLocaleString('en-US') + ' reference calculations').test(h), k.slug + ': the independent-check statement (' + nv + ' calculators, ' + tv + ' vectors) is counted from the vector file');
    Q(!/NaN|undefined|Infinity|\[object/.test(tx), k.slug + ': no NaN, undefined or Infinity in the text');
    const d = dep.calc.pages[k.slug], ld = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(d)[1]), g = ld['@graph'];
    Q(d.indexOf('<link rel="canonical" href="' + SITE + '/calculators/' + k.slug + '/">') > 0 && d.indexOf('<meta property="og:url" content="' + SITE + '/calculators/' + k.slug + '/">') > 0 && g[0].itemListElement.length === 3 && g[1]['@type'] === 'CollectionPage' && g[1].mainEntity.numberOfItems === all.length, k.slug + ': production build has a trailing-slash canonical, og:url, breadcrumb and an item list of ' + all.length);
  });
  const T = slugs.map((s) => /<title>([^<]*)<\/title>/.exec(pg[s])[1]), D = slugs.map((s) => /<meta name="description" content="([^"]*)"/.exec(pg[s])[1]);
  const conv = bp.build({ base: '' }).meta, others = calcSlugs.map((s) => /<title>([^<]*)<\/title>/.exec(pg[s])[1]).concat(conv.map((m) => m.title));
  Q(new Set(T).size === 13 && new Set(D).size === 13 && T.every((x) => others.indexOf(x) < 0), 'category titles and descriptions are unique, also against the calculator and conversion pages');
  Q(new Set(CATS.map((k) => k.intro)).size === 13 && new Set(CATS.map((k) => k.limits)).size === 13, 'every hub has its own intro and limits text');
  /* links: every relative link on every hub resolves to a file or an in-app route that exists */
  const hrefs = (h) => [...noFoot(h).matchAll(/href="([^"#]+)(#[^"]*)?"/g)].map((m) => [m[1], m[2]]);
  let bad = [];
  slugs.forEach((s) => hrefs(pg[s]).forEach(([u, hash]) => { if (/^https?:/.test(u)) return; const f = pth.join(__dirname, '..', 'calculators', s, u); const real = fsx.existsSync(f.replace(/\/$/, '') ) || fsx.existsSync(pth.join(f, 'index.html')); if (!real && !/engine\.js|icon\.svg/.test(u)) bad.push(s + ' -> ' + u); if (hash && /index\.html$/.test(u) && /^#/.test(hash) && hash.length > 1 && /^\.\.\/\.\.\/index\.html$/.test(u) && !E.BY_ID[hash.slice(1)] && hash.slice(1) !== 'verification' && hash.slice(1) !== 'feeder-designer') bad.push(s + ' -> unknown calculator ' + hash); }));
  Q(bad.length === 0, 'every link on every category hub resolves' + (bad.length ? ': ' + bad.slice(0, 5).join('; ') : ''));
  /* every calculator page links to its own category hub; the engineering hub lists all thirteen */
  const cat = (id) => owner(E.BY_ID[id])[0].slug;
  Q(bp.CALC_DATA.every((c) => pg[c.slug].indexOf('href="../' + cat(c.calc) + '/"') > 0), 'each of the 129 calculator pages links to the category hub of its calculator');
  Q(slugs.every((s) => pg['index'].indexOf('href="' + s + '/"') > 0), 'the engineering hub links to all thirteen category hubs');
  /* a hub must link back from the categories it names, so none is an island */
  Q(slugs.every((s) => slugs.some((o) => o !== s && CATS.find((k) => k.slug === o).related.indexOf(s) >= 0)), 'every category hub is named as related by at least one other hub');
  /* the committed files are what the generator makes */
  Q(slugs.every((s) => STRIP(fsx.readFileSync(pth.join(__dirname, '..', 'calculators', s, 'index.html'), 'utf8')) === pg[s]), 'committed category hubs equal generator output, ignoring only the deploy-time tags');
  total += n16; console.log('16. category hubs:', n16 + '/' + n16, 'checked');
}

/* ---------- 17. search and sharing (v1.5.15) ---------- */
{
  const bp = require('../tools/build_pages.js'), fsx = require('fs'), pth = require('path'), SITE = 'https://elecmetric.test/app';
  let n17 = 0; const S = (c, m) => { n17++; if (!c) { fails++; console.log('  FAIL ' + m); } };
  const dep = bp.build({ base: SITE, lastmod: '2026-11-07' }), plain = bp.build({ base: '' });
  const ldOf = (h) => { const m = h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/); return m ? JSON.parse(m[1].replace(/\\u003c/g, '<')) : null; };
  const all = Object.keys(dep.pages).map((k) => ['pages/' + k, dep.pages[k]]).concat(Object.keys(dep.calc.pages).map((k) => ['calculators/' + k, dep.calc.pages[k]]));
  all.forEach(([f, h]) => {
    S(h.indexOf('<meta property="og:image" content="' + SITE + '/og-image.png">') > 0 && h.indexOf('<meta name="twitter:image" content="' + SITE + '/og-image.png">') > 0 && h.indexOf('summary_large_image') > 0 && h.indexOf('og:site_name') > 0, f + ': production page has og:image, twitter:image, a large card and og:site_name');
    if (h.indexOf('Frequently asked questions') > 0) { const g = ldOf(h)['@graph'].find((x) => x['@type'] === 'FAQPage'); S(g && g.mainEntity.length === (h.match(/<h3>/g) || []).length && g.mainEntity.every((q) => q.name && q.acceptedAnswer.text), f + ': FAQPage JSON-LD matches the visible FAQ'); }
    const app = (ldOf(h)['@graph'] || []).find((x) => x['@type'] === 'WebApplication'); if (app) S(app.isAccessibleForFree === true && app.offers.price === '0', f + ': WebApplication is declared free');
  });
  Object.keys(plain.pages).forEach((k) => S(plain.pages[k].indexOf('og:image') < 0 && plain.pages[k].indexOf('ld+json') < 0 && plain.pages[k].indexOf('og:site_name') > 0, k + ': the committed page has no deploy-only tags'));
  const home = ldOf(dep.root['index.html'])['@graph'];
  S(home.map((x) => x['@type']).join() === 'WebApplication,WebSite' && home[1].url === SITE + '/', 'home page JSON-LD has WebApplication and WebSite');
  S(/<meta property="og:image" content="/.test(dep.root['index.html']), 'home page has og:image in a production build');
  const hh = plain.root['index.html'];
  S(/<!--browse:start-->[\s\S]*calculators\/"[\s\S]*pages\/index\.html[\s\S]*<!--browse:end-->/.test(hh) && bp.CATS.every((k) => hh.indexOf('href="calculators/' + k.slug + '/"') > 0) && bp.build({ base: '' }).meta.length > 0, 'home page links to both hubs and every category hub in plain HTML');
  S(hh.indexOf('<!--browse:start-->') > 0 && hh.split('<h1').length - 1 >= 1 && hh.indexOf('twitter:card" content="summary_large_image"') > 0, 'home page keeps its markers and a large Twitter card');
  S(dep.root['sitemap.xml'].split('<lastmod>2026-11-07</lastmod>').length - 1 === 225 + dep.conv.slugs.length && bp.build({ base: SITE }).root['sitemap.xml'].indexOf('lastmod') < 0 && bp.build({ base: SITE, lastmod: 'today' }).root['sitemap.xml'].indexOf('lastmod') < 0, 'sitemap has lastmod on every URL only when given a real YYYY-MM-DD date');
  S(dep.root['404.html'] && /<meta name="robots" content="noindex">/.test(dep.root['404.html']) && dep.root['404.html'].indexOf('rel="canonical"') < 0 && dep.root['404.html'].indexOf('href="' + SITE + '/"') > 0 && plain.root['404.html'] === undefined, '404.html is noindex, uses absolute links and exists only in a production build');
  const cd = require('../tools/check_deploy.js'), files = {}; Object.keys(dep.pages).forEach((k) => { files['pages/' + k] = dep.pages[k]; }); Object.keys(dep.root).forEach((k) => { files[k] = dep.root[k]; }); Object.keys(dep.legal).forEach((k) => { files[k] = dep.legal[k]; }); Object.keys(dep.calc.pages).forEach((k) => { files['calculators/' + (k === 'index' ? '' : k + '/') + 'index.html'] = dep.calc.pages[k]; }); Object.keys(dep.conv.pages).forEach((k) => { files['converters/' + k] = dep.conv.pages[k]; });
  const mut = (fn) => { const f = Object.assign({}, files); fn(f); return cd.check(f, SITE); };
  S(cd.check(files, SITE).length === 0, 'the new production output passes the deploy guard');
  S(mut((f) => { f['pages/amps-to-kw.html'] = f['pages/amps-to-kw.html'].replace(/<meta property="og:image" content="[^"]*">/, ''); }).some((p) => /og:image missing/.test(p)), 'guard catches a missing og:image');
  S(mut((f) => { f['pages/amps-to-kw.html'] = f['pages/amps-to-kw.html'].replace('"@type":"FAQPage"', '"@type":"Thing"'); }).some((p) => /no FAQPage/.test(p)), 'guard catches a visible FAQ with no FAQPage markup');
  S(mut((f) => { delete f['404.html']; }).some((p) => /404.html is missing/.test(p)), 'guard catches a missing 404.html');
  S(mut((f) => { f['sitemap.xml'] = f['sitemap.xml'].replace('<lastmod>2026-11-07</lastmod>', '<lastmod>soon</lastmod>'); }).some((p) => /bad lastmod/.test(p)), 'guard catches a malformed lastmod');
  const wf = fsx.readFileSync(pth.join(__dirname, '..', '.github', 'workflows', 'pages.yml'), 'utf8');
  S(/SITE_LASTMOD/.test(wf) && /og-image\.png/.test(wf) && /404\.html/.test(wf) && fsx.existsSync(pth.join(__dirname, '..', 'og-image.png')) && fsx.readFileSync(pth.join(__dirname, '..', 'og-image.png')).slice(1, 4).toString() === 'PNG', 'the Pages workflow publishes og-image.png and 404.html and passes the commit date; the PNG exists');
  /* v1.9.6: no indexable page hangs on one or two inbound links, and the deploy guards catch an empty lastmod and an unbuilt tree */
  {
    const root = pth.join(__dirname, '..'), pagesAll = ['index.html'], walk = (d) => fsx.readdirSync(pth.join(root, d), { withFileTypes: true }).forEach((e) => { const r = d + '/' + e.name; if (e.isDirectory()) walk(r); else if (/\.html$/.test(e.name)) pagesAll.push(r); });
    ['pages', 'converters', 'calculators'].forEach(walk);
    const inb = {}; pagesAll.forEach((f) => { inb[f] = new Set(); });
    pagesAll.forEach((f) => { [...new Set([...noFoot(fsx.readFileSync(pth.join(root, f), 'utf8')).matchAll(/href="([^"#?]+)"/g)].map((m) => m[1]))].forEach((u) => { if (/^(https?:|mailto:|data:)/.test(u)) return; let t = pth.posix.normalize(pth.posix.join(pth.posix.dirname(f), u)); if (/\/$/.test(t) || t === '.') t = (t === '.' ? '' : t) + 'index.html'; if (inb[t] && t !== f) inb[t].add(f); }); });
    const thin = pagesAll.filter((f) => f !== 'index.html' && inb[f].size < 3);
    S(thin.length === 0, 'every indexable page has at least 3 inbound links' + (thin.length ? ': ' + thin.slice(0, 4).join(', ') : ''));
    S(/wire-gauge-converter\.html/.test(fsx.readFileSync(pth.join(root, 'index.html'), 'utf8')) && /agl-ccr-loading\//.test(fsx.readFileSync(pth.join(root, 'index.html'), 'utf8')), 'home page links to the wire gauge converter and the AGL CCR loading calculator');
    S(/Also see:/.test(fsx.readFileSync(pth.join(root, 'pages', 'kva-to-watts.html'), 'utf8')), 'conversion pages list sibling conversions');
    S(cd.check(files, SITE, { requireLastmod: true }).length === 0, 'with lastmod on every URL the guard passes under REQUIRE_LASTMOD');
    S(cd.check(Object.assign({}, files, { 'sitemap.xml': files['sitemap.xml'].replace(/<lastmod>[^<]*<\/lastmod>/, '') }), SITE, { requireLastmod: true }).some((p) => /have a lastmod/.test(p)), 'guard catches a URL without lastmod when REQUIRE_LASTMOD is set');
    S(cd.check(Object.assign({}, files, { 'sitemap.xml': files['sitemap.xml'].replace(/<lastmod>[^<]*<\/lastmod>/, '<lastmod>2999-01-01</lastmod>') }), SITE, { requireLastmod: true }).some((p) => /in the future/.test(p)), 'guard catches a lastmod in the future');
    const bare = { 'index.html': '<html><head></head></html>', 'sw.js': "const SHELL = [];", 'manifest.webmanifest': '{"icons":[]}', '404.html': '<html></html>' }, tmp = pth.join(require('os').tmpdir(), 'em-ca-' + process.pid);
    fsx.mkdirSync(tmp, { recursive: true }); Object.keys(bare).forEach((k) => fsx.writeFileSync(pth.join(tmp, k), bare[k]));
    const ca = require('../tools/check_assets.js');
    S(ca.missing(tmp, { production: true }).some((p) => /no canonical/.test(p)) && !ca.missing(tmp, {}).some((p) => /no canonical/.test(p)), 'asset guard with --production rejects the unbuilt tree and only then');
    S(/REQUIRE_LASTMOD=1/.test(wf) && /check_assets\.js _site --production/.test(wf) && /test -n "\$SITE_LASTMOD"/.test(wf), 'Pages workflow requires lastmod and a production-built upload');
  }
  total += n17; console.log('17. search and sharing:', n17 + '/' + n17, 'checked');
}
/* ---------- 18. Conversion Centre (v1.6.0) ---------- */
{
  const bp = require('../tools/build_pages.js'), cv = require('../tools/build_converters.js'), L2 = require('../tools/converter_content_l2.js'), fsx = require('fs'), pth = require('path'), SITE = 'https://elecmetric.test/app';
  let n18 = 0; const V = (c, m) => { n18++; if (!c) { fails++; console.log('  FAIL ' + m); } };
  const ROOT = pth.join(__dirname, '..');
  /* Independent unit factors, written from SI and customary definitions (not read from engine.js).
     Energy is in joules here; the engine keeps watt-hours, so the comparison is on ratios only. */
  const BTU = 1055.05585262, G = 9.80665, IN = 25.4e-3, FT = 12 * IN, LB = 0.45359237, PFX = (b) => ({ ['p' + b]: 1e-12, ['n' + b]: 1e-9, ['µ' + b]: 1e-6, ['m' + b]: 1e-3, [b]: 1, ['k' + b]: 1e3, ['M' + b]: 1e6, ['G' + b]: 1e9 });
  const pick = (o, ks) => { const r = {}; ks.forEach((k) => { r[k] = o[k]; }); return r; };
  const IND = {
    charge: { mAh: 1e-3, Ah: 1, kAh: 1e3, C: 1 / 3600, mC: 1e-3 / 3600, kC: 1e3 / 3600 }, /* v1.11.0: 1 Ah = 1 A x 3600 s = 3600 C */
    power: { 'µW': 1e-6, mW: 1e-3, W: 1, kW: 1e3, MW: 1e6, GW: 1e9, HP: 550 * 0.3048 * 0.45359237 * G, BHP: 550 * 0.3048 * 0.45359237 * G, PS: 75 * G, 'BTU/h': BTU / 3600, TR: 12000 * BTU / 3600 },
    apparent: pick(PFX('VA'), ['VA', 'kVA', 'MVA']), reactive: pick(PFX('VAR'), ['VAR', 'kVAR', 'MVAR']),
    voltage: pick(PFX('V'), ['µV', 'mV', 'V', 'kV', 'MV', 'GV']), current: pick(PFX('A'), ['µA', 'mA', 'A', 'kA', 'MA']),
    resistance: { 'mΩ': 1e-3, 'Ω': 1, 'kΩ': 1e3, 'MΩ': 1e6, 'GΩ': 1e9 },
    frequency: Object.assign(pick(PFX('Hz'), ['Hz', 'kHz', 'MHz', 'GHz']), { THz: 1e12, 'rad/s': 1 / (2 * Math.PI) }), capacitance: { pF: 1e-12, nF: 1e-9, 'µF': 1e-6, F: 1 }, inductance: { 'µH': 1e-6, mH: 1e-3, H: 1 },
    energy: { 'µJ': 1e-6, mJ: 1e-3, J: 1, kJ: 1e3, MJ: 1e6, kcal: 4186.8, cal: 4.1868, BTU, Wh: 3600, kWh: 3.6e6, MWh: 3.6e9, eV: 1.602176634e-19, keV: 1.602176634e-16, MeV: 1.602176634e-13, GeV: 1.602176634e-10 },
    /* Level 2 and 3 (v1.7.0), from the inch, the pound, standard gravity, the US gallon (231 in³) and the BTU. */
    length: { nm: 1e-9, 'µm': 1e-6, mm: 1e-3, cm: 1e-2, m: 1, km: 1e3, mil: IN / 1000, in: IN, ft: FT, yd: 3 * FT, mi: 5280 * FT, nmi: 1852 },
    area: { 'mm²': 1e-6, 'cm²': 1e-4, 'm²': 1, ha: 1e4, 'km²': 1e6, 'in²': IN * IN, 'ft²': FT * FT, 'yd²': 9 * FT * FT, acre: 43560 * FT * FT, 'mi²': (5280 * FT) ** 2, cmil: Math.PI * (IN / 2000) ** 2 },
    volume: { mL: 1e-6, L: 1e-3, 'm³': 1, 'cm³': 1e-6, 'in³': IN ** 3, 'ft³': FT ** 3, qt: 231 * IN ** 3 / 4, gal: 231 * IN ** 3, galUK: 4.54609e-3 },
    mass: { 'µg': 1e-9, mg: 1e-6, g: 1e-3, kg: 1, t: 1e3, oz: LB / 16, lb: LB, tn: 2000 * LB },
    force: { mN: 1e-3, N: 1, kN: 1e3, MN: 1e6, kgf: G, lbf: LB * G, dyn: 1e-5 },
    torque: { 'N·m': 1, 'kN·m': 1e3, 'mN·m': 1e-3, 'kgf·m': G, 'lbf·ft': LB * G * FT, 'lbf·in': LB * G * IN, 'ozf·in': LB * G / 16 * IN },
    pressure: { Pa: 1, hPa: 100, kPa: 1e3, MPa: 1e6, mbar: 100, bar: 1e5, atm: 101325, psi: LB * G / (IN * IN), mmHg: 13595.1 * G / 1000, inHg: 25.4 * 13595.1 * G / 1000, torr: 101325 / 760, 'kgf/cm²': G * 1e4, mH2O: 1000 * G },
    flow: { 'L/s': 1e-3, 'm³/h': 1 / 3600, 'm³/s': 1, CFM: FT ** 3 / 60, 'L/min': 1e-3 / 60, 'm³/min': 1 / 60, GPM: 231 * IN ** 3 / 60 },
    bfield: { nT: 1e-9, 'µT': 1e-6, mG: 1e-7, mT: 1e-3, G: 1e-4, T: 1 },
    illuminance: { lx: 1, klx: 1e3, fc: 1 / (FT * FT), phot: 1e4 },
    luminance: { 'cd/m²': 1, 'kcd/m²': 1e3, 'cd/ft²': 1 / (FT * FT), fL: 1 / (Math.PI * FT * FT), sb: 1e4 },
    intensity: { mcd: 1e-3, cd: 1, kcd: 1e3 },
    density: { 'g/L': 1, 'kg/m³': 1, 'kg/L': 1e3, 'g/cm³': 1e3, 'lb/ft³': LB / FT ** 3, 'lb/in³': LB / IN ** 3, 'lb/gal': LB / (231 * IN ** 3) },
    rotation: { rpm: 1, 'rev/s': 60, 'rad/s': 60 / (2 * Math.PI), '°/s': 60 / 360 },
    thermcond: { 'W/(m·K)': 1, 'kcal/(h·m·°C)': 4186.8 / 3600, 'BTU/(h·ft·°F)': BTU / (3600 * FT * 5 / 9) },
    /* v1.11.0: angle from the definitions of the degree (1/360 turn), gradian (1/400 turn), arcminute and arcsecond; ratio from percent, per mille, ppm and ppb. */
    angle: { mrad: 1e-3, rad: 1, deg: 2 * Math.PI / 360, arcmin: 2 * Math.PI / (360 * 60), arcsec: 2 * Math.PI / (360 * 3600), grad: 2 * Math.PI / 400, turn: 2 * Math.PI },
    ratio: { ratio: 1, '%': 1 / 100, '‰': 1 / 1000, ppm: 1 / 1e6, ppb: 1 / 1e9 },
    /* v1.8.0: an interval is 1 K = 1 °C = 9/5 °F. Specific heat from the IT calorie (4.1868 J) and BTU per pound-degree Fahrenheit. */
    tempdiff: { 'ΔK': 1, 'Δ°C': 1, 'Δ°F': 1 / 1.8, 'Δ°R': 1 / 1.8 },
    specheat: { 'J/(kg·K)': 1, 'kJ/(kg·K)': 1000, 'J/(g·K)': 1000, 'cal/(g·°C)': 4186.8, 'kcal/(kg·°C)': 4186.8, 'BTU/(lb·°F)': BTU / (LB * 5 / 9) }
  };
  const near = (a, b) => Math.abs(a - b) <= 1e-8 * Math.abs(b);
  const ratio = (d, a, b) => IND[d][a] / IND[d][b];
  /* Page text is built from the engine's own factors. The loop below proves those equal the independent ones to 1e-8; here the text must equal the engine value. */
  const UN = (d) => E.CONV_UNITS[d] || E.UNITS[d], ER = (d, a, b) => UN(d).units[a] / UN(d).units[b];
  Object.keys(IND).forEach((d) => {
    const eu = Object.keys(UN(d).units), iu = Object.keys(IND[d]), bad = [];
    eu.forEach((a) => eu.forEach((b) => { if (iu.indexOf(a) >= 0 && iu.indexOf(b) >= 0 && !near(UN(d).units[a] / UN(d).units[b], ratio(d, a, b))) bad.push(a + '/' + b); }));
    V(eu.length === iu.length && eu.every((u) => iu.indexOf(u) >= 0) && bad.length === 0 && cv.DIM_LABEL[d], d + ': all ' + eu.length + ' engine units match independent factors for every pair' + (bad.length ? ' (bad: ' + bad.slice(0, 4).join(', ') + ')' : ''));
    V(eu.every((u) => cv.NOTE[u] && cv.NOTE[u].length > 8), d + ': every unit has a definition note');
  });
  /* number formatting */
  const nf = cv.convNum;
  V(nf(0) === '0' && nf(1234567.891) === '1,234,567.891' && nf(0.745699872) === '0.745699872' && nf(1 / 3.6e6) === '2.777777778 × 10⁻⁷' && nf(1e-9) === '1 × 10⁻⁹' && nf(3.6e12) === '3.6 × 10¹²' && nf(-2500) === '-2,500' && nf(2) === '2', 'convNum groups, keeps 10 significant digits and uses scientific notation outside 1e-4 to 1e12');
  /* page behaviour, driven against a minimal fake DOM */
  const mkDom = (ids) => {
    const els = {}, mk = () => { const o = { value: '', textContent: '', innerHTML: '', options: [], handlers: {}, addEventListener(e, fn) { (this.handlers[e] = this.handlers[e] || []).push(fn); }, appendChild(c) { this.options.push(c.value); }, fire(e) { (this.handlers[e] || []).forEach((fn) => fn()); } }; Object.defineProperty(o, 'innerHTML', { get() { return ''; }, set() { o.options = []; } }); return o; };
    ids.forEach((i) => { els[i] = mk(); });
    return { els, getElementById: (i) => els[i] || null, createElement: () => ({ value: '', textContent: '' }) };
  };
  const ids = ['cv-q', 'cv-v', 'cv-f', 'cv-t', 'cv-out', 'cv-fac', 'cv-err', 'cv-sw'];
  const cfg = { dim0: 'power', v: 1, dims: { power: ['kW', 'W'], voltage: ['kV', 'V'], energy: ['kWh', 'J'] } };
  { const d = mkDom(ids), e = d.els; e['cv-q'].value = 'power'; e['cv-v'].value = '5'; e['cv-f'].value = 'kW'; e['cv-t'].value = 'HP';
    cv.convInit(E, cfg, d);
    V(e['cv-out'].textContent === nf(5 * ER('power', 'kW', 'HP')) + ' HP', 'page script: 5 kW shows the HP value (' + e['cv-out'].textContent + ')');
    e['cv-v'].value = '7,200,000'; e['cv-q'].value = 'energy'; e['cv-q'].fire('change');
    V(e['cv-f'].options.join() === E.unitsOf('energy').join() && e['cv-f'].value === 'kWh' && e['cv-t'].value === 'J', 'page script: changing quantity refills the unit lists from the engine');
    e['cv-f'].value = 'J'; e['cv-t'].value = 'kWh'; e['cv-v'].fire('input');
    V(e['cv-out'].textContent === '2 kWh' && e['cv-fac'].textContent === '1 J = 2.777777778 × 10⁻⁷ kWh', 'page script: 7,200,000 J is 2 kWh, with a thousands separator accepted');
    e['cv-sw'].fire('click');
    V(e['cv-f'].value === 'kWh' && e['cv-t'].value === 'J' && e['cv-out'].textContent === nf(7200000 * ER('energy', 'kWh', 'J')) + ' J', 'page script: Swap exchanges the units and converts again, keeping the value');
    e['cv-v'].value = 'abc'; e['cv-v'].fire('input');
    V(e['cv-out'].textContent === '—' && /number/.test(e['cv-err'].textContent) && e['cv-fac'].textContent === '', 'page script: a non-number clears the result and says what to enter');
    e['cv-v'].value = ''; e['cv-v'].fire('input');
    V(e['cv-out'].textContent === '—' && e['cv-err'].textContent === '', 'page script: an empty field clears the result without an error');
    e['cv-v'].value = '1e3'; e['cv-v'].fire('input');
    V(e['cv-out'].textContent === nf(1000 * ER('energy', 'kWh', 'J')) + ' J', 'page script: scientific notation input is accepted');
  }
  { const d = mkDom(['cv-v', 'cv-f', 'cv-t', 'cv-out', 'cv-fac', 'cv-err']), e = d.els; e['cv-v'].value = '11'; e['cv-f'].value = 'kV'; e['cv-t'].value = 'V';
    cv.convInit(E, { dim0: 'voltage', v: 11, dims: { voltage: ['kV', 'V'] } }, d);
    V(e['cv-out'].textContent === '11,000 V', 'page script: a single-quantity page works with no quantity selector'); }
  /* v1.8.1: gauge page rows come from the engine tables (SWG 18 = 0.048 in = 1.2192 mm; AWG 18 = 1.024 mm) */
  { const sc = E.swgChart(), r18 = sc.find((r) => r.label === '18'), a18 = E.awgChart().find((r) => r.label === '18');
    V(sc.length === 57 && r18 && Math.abs(r18.dMm - 1.2192) < 1e-9 && Math.abs(a18.dMm - 1.0237) < 5e-4 && sc[0].label === '7/0' && sc[6].label === '1/0', 'swgChart: 57 sizes from 7/0 to 50, SWG 18 is 1.2192 mm, AWG 18 is about 1.024 mm'); }
  /* generated pages */
  const plain = bp.build({ base: '' }), dep = bp.build({ base: SITE, lastmod: '2026-11-07' }), PG = plain.conv.pages, MT = plain.conv.meta;
  const txt = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\s+/g, ' ');
  V(MT.length === 1 + cv.CATS.length + cv.DIRS.length + 8 + 158 + 43 && MT.filter((m) => m.kind === 'number').length === 7 && MT.filter((m) => m.kind === 'gauge').length === 1 && MT.filter((m) => m.kind === 'hub').length === 1 && MT.filter((m) => m.kind === 'category').length === cv.CATS.length && MT.filter((m) => m.kind === 'direction').length === cv.DIRS.length && MT.filter((m) => m.kind === 'reference').length === 158 && MT.filter((m) => m.kind === 'example').length === 43, 'Conversion Centre has a hub, ' + cv.CATS.length + ' category converters, ' + cv.DIRS.length + ' direction pages, 158 reference pages (5 tools and tables, 153 formula articles) and 43 worked-example pages');
  V(Object.keys(PG).every((f) => !/NaN|undefined|Infinity|\[object/.test(txt(PG[f]))), 'no converter page shows NaN, undefined, Infinity or [object] in its text (v1.8.7: the electrical page once showed NaN in Common conversions)');
  const taken = Object.keys(plain.pages).map((f) => f.replace(/\.html$/, ''));
  V(MT.every((m) => m.slug === 'index' || taken.indexOf(m.slug) < 0), 'no direction page repeats a slug that pages/ already has');
  const other = bp.build({ base: '' }).meta.map((m) => m.title).concat(Object.keys(plain.calc.pages).map((k) => /<title>([^<]*)<\/title>/.exec(plain.calc.pages[k])[1]));
  V(new Set(MT.map((m) => m.title)).size === MT.length && new Set(MT.map((m) => m.desc)).size === MT.length && MT.every((m) => other.indexOf(m.title) < 0), 'Conversion Centre titles and descriptions are unique, also against the conversion and calculator pages');
  MT.forEach((m) => {
    const h = PG[m.slug + '.html'];
    V(m.title.length <= 60 && m.desc.length >= 50 && m.desc.length <= 160 && (h.match(/<h1>/g) || []).length === 1, m.slug + ': one h1, title ' + m.title.length + ' and description ' + m.desc.length + ' characters within search limits');
    const fq = (h.match(/<h3>/g) || []).length;
    V(fq >= 2 && h.indexOf('Frequently asked questions') > 0, m.slug + ': visible FAQ with ' + fq + ' questions');
    V(h.indexOf('rel="canonical"') < 0 && h.indexOf('ld+json') < 0 && h.indexOf('twitter:card') > 0, m.slug + ': without BASE_URL no canonical or structured data');
    V(m.kind === 'reference' || m.kind === 'example' ? h.indexOf('<main class="w">') > 0 && (m.kind === 'example' ? /ltInit\("(wa|aw|ka|ak|sa)", document\)/.test(h) && h.indexOf('id="lt-out"') > 0 : true) : m.kind === 'gauge' ? h.indexOf('<table>') > 0 && h.indexOf('AWG chart') > 0 && h.indexOf('SWG chart') > 0 : m.kind === 'number' ? h.indexOf('numInit(document)') > 0 && h.indexOf('id="nm-err"') > 0 : /<script defer src="\.\.\/engine\.js"><\/script>/.test(h) && h.indexOf('convInit(window.Engine') > 0 && h.indexOf('id="cv-out"') > 0, m.slug + ': ' + (m.kind === 'reference' || m.kind === 'example' ? 'has its own markup and script' : 'loads the engine and starts the converter'));
    const bad = [...noFoot(h).matchAll(/href="([^"#]+)(#[^"]*)?"/g)].map((x) => x[1]).filter((u) => !/^https?:/.test(u) && !fsx.existsSync(pth.join(ROOT, 'converters', u)));
    V(bad.length === 0, m.slug + ': every link resolves' + (bad.length ? ' (' + bad.slice(0, 3).join(', ') + ')' : ''));
    const dj = dep.conv.pages[m.slug + '.html'], g = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(dj)[1].replace(/\\u003c/g, '<'))['@graph'];
    V(g[0].itemListElement.length === (m.slug === 'index' ? 2 : 3) && g[0].itemListElement.every((x) => x.item.indexOf(SITE + '/') === 0) && g[1]['@type'] === 'WebApplication' && g[1].url === SITE + '/converters/' + m.slug + '.html' && dj.indexOf('<link rel="canonical" href="' + SITE + '/converters/' + m.slug + '.html">') > 0 && g[2]['mainEntity'].length === fq, m.slug + ': production page has breadcrumb, WebApplication, FAQPage and its own canonical');
  });
  /* direction pages: the headline answer comes from independent factors */
  cv.DIRS.forEach((d) => {
    const aff = !!UN(d.dim).affine, h = txt(PG[d.slug + '.html']), r = E.convertUnits(d.dim, d.val, d.from, d.to), f = aff ? 0 : ER(d.dim, d.from, d.to);
    V(aff ? h.indexOf(L2.AFFINE_FORMULA[d.from + '>' + d.to][0] + ' with ' + nf(d.val) + ' ' + d.from + ' gives ' + nf(r) + ' ' + d.to) > 0 : h.indexOf(nf(d.val) + ' ' + d.from + ' = ' + nf(r) + ' ' + d.to) > 0 && h.indexOf('1 ' + d.from + ' = ' + nf(f) + ' ' + d.to) > 0, d.slug + ': worked example and factor equal the engine calculation (' + nf(r) + ' ' + d.to + ')');
    V(d.vals.every((v) => h.indexOf(nf(E.convertUnits(d.dim, v, d.from, d.to))) > 0), d.slug + ': every row of the table of common values equals the engine value');
    const rv = cv.DIRS.find((x) => x.slug === d.rev);
    V(rv && rv.from === d.to && rv.to === d.from && rv.rev === d.slug && h.indexOf(d.rev + '.html') > 0 || PG[d.slug + '.html'].indexOf('href="' + d.rev + '.html"') > 0, d.slug + ': opposite direction exists and links back');
    V(PG[d.slug + '.html'].indexOf('href="' + d.cat + '.html"') > 0 && PG[d.cat + '.html'].indexOf('href="' + d.slug + '.html"') > 0, d.slug + ': linked from and to its category converter');
  });
  /* category pages */
  cv.CATS.forEach((c) => {
    const h = PG[c.slug + '.html'], t = txt(h), bad = [];
    c.dims.forEach((d) => { if (!IND[d]) { UN(d).affine && Object.keys(UN(d).affine).forEach((u) => { if (t.indexOf(L2.AFFINE_EQ[u]) < 0) bad.push(u); }); return; } Object.keys(IND[d]).forEach((u) => { const bv = d === 'energy' ? [UN(d).units[u] * 3600, 'J'] : [UN(d).units[u], UN(d).base]; if (t.indexOf(nf(bv[0]) + ' ' + bv[1]) < 0) bad.push(u); }); });
    V(bad.length === 0, c.slug + ': the unit factor table lists every unit with its engine value' + (bad.length ? ' (missing ' + bad.join(', ') + ')' : ''));
    const [fa, fb] = c.def[c.dim], ex = E.convertUnits(c.dim, c.val, fa, fb), aff = !!UN(c.dim).affine;
    V(t.indexOf(nf(c.val) + ' ' + fa + ' is ' + nf(ex) + ' ' + fb) > 0 && t.indexOf('Result ' + nf(ex) + ' ' + fb) > 0, c.slug + ': default answer equals the engine value (' + nf(ex) + ' ' + fb + ')');
    V(c.pairs.every(([a, b]) => aff ? t.indexOf(L2.AFFINE_FORMULA[a + '>' + b][0]) > 0 : t.indexOf('1 ' + a + ' = ' + nf(ER(c.dims.find((d) => E.unitsOf(d).indexOf(a) >= 0 && E.unitsOf(d).indexOf(b) >= 0) || c.dim, a, b)) + ' ' + b) > 0), c.slug + ': every common conversion equals the engine factor');
    V((h.match(/id="cv-q"/g) || []).length === (c.dims.length > 1 ? 1 : 0), c.slug + ': quantity selector only when the page has more than one quantity');
  });
  { const pc = txt(PG['power-converter.html']);
    V(/kW, kVA and kVAR are not interchangeable/.test(pc) && /S² = P² \+ Q²/.test(pc) && /pf = P \/ S/.test(pc) && PG['power-converter.html'].indexOf('../pages/kva-to-kw.html') > 0, 'power converter explains that kW, kVA and kVAR need a power factor and links to the kVA to kW calculator');
    const ec = txt(PG['energy-converter.html']);
    V(/3,600,000 J = 3\.6 MJ/.test(ec) && /6 kWh/.test(ec) && PG['energy-converter.html'].indexOf('../pages/kw-to-kwh.html') > 0, 'energy converter explains kW versus kWh and 1 kWh = 3.6 MJ');
    const cc = txt(PG['current-converter.html']);
    V(/Amps to kW is not a unit conversion/.test(cc) && PG['current-converter.html'].indexOf('../pages/amps-to-kw.html') > 0, 'current converter states amps to kW is not a unit conversion and links to the calculator');
    /* reactance examples, from textbook formulas */
    const xc = 1 / (2 * Math.PI * 50 * 100e-6), xl = 2 * Math.PI * 50 * 1;
    V(txt(PG['capacitance-converter.html']).indexOf('Xc = ' + nf(Number(xc.toPrecision(5))) + ' Ω') > 0 && txt(PG['inductance-converter.html']).indexOf('XL = ' + nf(Number(xl.toPrecision(5))) + ' Ω') > 0, 'reactance examples: 100 µF at 50 Hz is ' + nf(Number(xc.toPrecision(5))) + ' Ω and 1 H at 50 Hz is ' + nf(Number(xl.toPrecision(5))) + ' Ω');
    const hub = PG['index.html'];
    V(cv.CATS.every((c) => hub.indexOf('href="' + c.slug + '.html"') > 0) && cv.DIRS.every((d) => hub.indexOf('href="' + d.slug + '.html"') > 0) && (hub.match(/id="cv-q"/g) || []).length === 1 && Object.keys(E.UNITS).filter((d) => !IND[d]).length > 0, 'hub links every category converter and direction page and has the quantity selector');
    V(/Can I convert amps to kW with a unit converter\?/.test(txt(hub)) && /No\. Amps measure current/.test(txt(hub)), 'hub FAQ answers the amps to kW question');
  }
  /* Level 2 and 3 (v1.7.0): temperature, number systems, page behaviour, calculators untouched */
  { const T = (v, a, b) => E.convertUnits('temperature', v, a, b), c = (a, b) => Math.abs(a - b) < 1e-9;
    V(c(T(0, '°C', 'K'), 273.15) && c(T(32, '°F', 'K'), 273.15) && c(T(491.67, '°R', 'K'), 273.15) && c(T(100, '°C', '°F'), 212) && c(T(-40, '°C', '°F'), -40) && c(T(0, 'K', '°C'), -273.15) && c(T(-459.67, '°F', '°R'), 0), 'temperature: fixed points (ice, boiling, -40, absolute zero) from definitions');
    const sc = ['K', '°C', '°F', '°R'], grid = [-273.15, -40, 0, 37, 100, 1500], bad = [];
    sc.forEach((a) => sc.forEach((b) => grid.forEach((x) => { if (Math.abs(T(T(x, a, b), b, a) - x) > 1e-9) bad.push(a + b + x); })));
    V(bad.length === 0 && E.unitsOf('temperature').join() === 'K,°C,°F,°R' && E.unitsOf('power').join() === Object.keys(E.CONV_UNITS.power.units).join(), 'temperature: round trip through every pair of scales, and unitsOf lists scales and table units');
    /* the calculators' unit lists are unchanged: UNITS keeps its original dimensions and units */
    V(Object.keys(E.UNITS.length.units).join() === 'mm,cm,m,km,in,ft,yd' && Object.keys(E.UNITS.area.units).join() === 'mm²,cm²,m²' && Object.keys(E.UNITS.torque.units).join() === 'N·m,kN·m' && !E.UNITS.pressure && !E.UNITS.mass && !E.UNITS.temperature, 'calculator unit lists are unchanged by the converter quantities');
    V(E.CONV_UNITS.length.units.mm === E.UNITS.length.units.mm && E.CONV_UNITS.flow.units['m³/h'] === E.UNITS.flow.units['m³/h'] && E.CONV_UNITS.flow.units.CFM === E.UNITS.flow.units.CFM && E.UNITS.flow.units.CFM === Math.pow(0.3048, 3) / 60 && Math.abs(E.UNITS.power.units.HP - 745.69987158227022) < 1e-9 && Math.abs(E.UNITS.energy.units.BTU * 3600 - 1055.05585262) < 1e-9, 'converter units copy the shared factors from UNITS; HP, BTU and CFM are the exact definitions in the calculators and the converters');
    /* number systems */
    const B = (v, f, t) => cv.baseConvert(v, f, t), S = cv.sciNotation;
    V(B('255', 10, 16).text === 'FF' && B('0xFF', 16, 2).text === '11111111' && B('0b1011', 2, 10).text === '11' && B('-1010', 2, 10).text === '-10' && B('0', 10, 2).text === '0' && B('777', 8, 10).text === '511' && B('1_000', 10, 16).text === '3E8' && B('ff', 16, 10).text === '255', 'number base: known conversions, prefixes, sign and separators');
    V(B('18446744073709551616', 10, 16).text === '10000000000000000' && B('FFFFFFFFFFFFFFFFFFFF', 16, 10).text === '1208925819614629174706175', 'number base: values past 2^53 are exact (BigInt)');
    V(!B('12', 2, 10).ok && /not valid in base 2/.test(B('12', 2, 10).error) && !B('', 10, 2).ok && !B('1.5', 10, 2).ok && !B('1'.repeat(201), 10, 2).ok, 'number base: bad digits, empty, fractions and over-long input are rejected with a message');
    let nb = 0; for (let n = 0; n < 5000; n += 37) { if (B(B(String(n), 10, 2).text, 2, 10).text !== String(n) || B(B(String(n), 10, 16).text, 16, 10).text !== String(n) || B(B(String(n), 10, 8).text, 8, 10).text !== String(n)) nb++; }
    V(nb === 0 && B('255', 10, 2).text === Number(255).toString(2) && B('4095', 10, 16).text === Number(4095).toString(16).toUpperCase(), 'number base: round trips agree with the built-in conversion');
    const so = S('0.000047'), s2 = S('12345.6789'), s3 = S('-0.0123'), s4 = S('1.5e3'), s5 = S('4.7×10^-5');
    V(so.sci === '4.7 × 10⁻⁵' && so.eng === '47 × 10⁻⁶' && so.e === '4.7e-5' && so.plain === '0.000047' && s2.sci === '1.23456789 × 10⁴' && s2.eng === '12.3456789 × 10³' && s3.sci === '-1.23 × 10⁻²' && s3.eng === '-12.3 × 10⁻³' && s4.plain === '1500' && s4.eng === '1.5 × 10³' && s5.sci === so.sci && S('0').sci === '0', 'scientific notation: scientific, engineering, E and plain forms');
    let sn = 0; [1, 7.5, 0.001, 123456, 6.022e23, 1.6e-19, 999, 1000, 0.5].forEach((x) => { const r = S(String(x)); if (Math.abs(Number(r.e) - x) > Math.abs(x) * 1e-12 || r.exp !== Math.floor(Math.log10(x) + 1e-12)) sn++; });
    V(sn === 0 && !S('abc').ok && !S('').ok && !S('1e999').ok, 'scientific notation: E form reads back to the input value, exponents are right, and bad input is rejected');
    /* page script with temperature, and the two number pages */
    { const d = mkDom(['cv-q', 'cv-v', 'cv-f', 'cv-t', 'cv-out', 'cv-fac', 'cv-err', 'cv-sw']), e = d.els; e['cv-q'].value = 'temperature'; e['cv-v'].value = '100'; e['cv-f'].value = '°C'; e['cv-t'].value = '°F';
      cv.convInit(E, { dim0: 'temperature', v: 100, dims: { temperature: ['°C', '°F'], pressure: ['bar', 'psi'] } }, d);
      V(e['cv-out'].textContent === '212 °F' && /zero points/.test(e['cv-fac'].textContent), 'page script: 100 °C shows 212 °F and the note explains why there is no single factor');
      e['cv-v'].value = '-40'; e['cv-v'].fire('input'); V(e['cv-out'].textContent === '-40 °F', 'page script: -40 °C is -40 °F');
      e['cv-sw'].fire('click'); V(e['cv-f'].value === '°F' && e['cv-t'].value === '°C' && e['cv-out'].textContent === '-40 °C', 'page script: Swap works for temperature');
      e['cv-q'].value = 'pressure'; e['cv-q'].fire('change'); e['cv-v'].value = '6'; e['cv-f'].value = 'bar'; e['cv-t'].value = 'psi'; e['cv-v'].fire('input');
      V(e['cv-f'].options.join() === E.unitsOf('pressure').join() && e['cv-out'].textContent === nf(6 * E.CONV_UNITS.pressure.units.bar / E.CONV_UNITS.pressure.units.psi) + ' psi', 'page script: switching from temperature to pressure refills the lists from the engine'); }
    { const d = mkDom(['nb-v', 'nb-b', 'nb-2', 'nb-8', 'nb-10', 'nb-16', 'nm-err']), e = d.els; e['nb-v'].value = '0xFF'; e['nb-b'].value = '16';
      global.BigInt = BigInt; cv.numInit(d);
      V(e['nb-2'].textContent === '11111111' && e['nb-8'].textContent === '377' && e['nb-10'].textContent === '255' && e['nb-16'].textContent === 'FF', 'number page script: 0xFF fills all four bases');
      e['nb-v'].value = '9'; e['nb-b'].value = '2'; e['nb-v'].fire('input'); V(e['nb-10'].textContent === '—' && /not valid/.test(e['nm-err'].textContent), 'number page script: an invalid digit clears the results and says why'); }
    { const d = mkDom(['sn-v', 'sn-sci', 'sn-eng', 'sn-e', 'sn-plain', 'nm-err']), e = d.els; e['sn-v'].value = '12345.6789'; cv.numInit(d);
      V(e['sn-sci'].textContent === '1.23456789 × 10⁴' && e['sn-eng'].textContent === '12.3456789 × 10³' && e['sn-e'].textContent === '1.23456789e4' && e['sn-plain'].textContent === '12345.6789', 'scientific page script: fills the four forms');
      e['sn-v'].value = 'x'; e['sn-v'].fire('input'); V(e['sn-sci'].textContent === '—' && /number/.test(e['nm-err'].textContent), 'scientific page script: bad input clears the results'); }
    V(/id="nb-16">FF</.test(PG['number-base-converter.html']) && /id="sn-eng">47 × 10⁻⁶</.test(PG['scientific-notation-converter.html']), 'number pages carry the default answer in the HTML, before any script runs');
    /* v1.11.0: degrees, minutes, seconds. Reference formulas written here: decimal = D + M/60 + S/3600; the inverse takes the fraction times 60 twice. */
    { const dd = (D, M, S, ng) => (ng ? -1 : 1) * (D + M / 60 + S / 3600), cl = (x, y) => Math.abs(x - y) < 1e-7;
      const cases = [[28, 33, 22.32, false], [33, 52, 7.68, true], [0, 0, 0.5, false], [179, 59, 59.9999, false], [90, 0, 0, false], [12, 30, 0, true], [0, 15, 0, false]];
      V(cases.every((c) => { const r = cv.dmsToDec(c[0], c[1], c[2], c[3]); return r.ok && cl(r.dec, dd(c[0], c[1], c[2], c[3])); }), 'dmsToDec: seven cases equal D + M/60 + S/3600, with the sign for south and west');
      V(cv.dmsToDec('-33', 52, 7.68, false).dec < 0 && cl(cv.dmsToDec('-33', 52, 7.68, false).dec, -33.8688) && cv.dmsToDec(0, 0, 0, true).dec === 0 && Object.is(cv.dmsToDec(0, 0, 0, true).dec, 0), 'dmsToDec: a minus typed before the degrees is a negative angle, and zero never becomes negative zero');
      const bad = [[28, 60, 0], [28, 0, 60], [28, -1, 0], [28.5, 30, 0], [28, 30.5, 10], ['', 0, 0], ['x', 0, 0]];
      V(bad.every((c) => cv.dmsToDec(c[0], c[1], c[2], false).ok === false && cv.dmsToDec(c[0], c[1], c[2], false).error.length > 10), 'dmsToDec: minutes or seconds of 60 or more, negative parts, fractions beside smaller parts and non-numbers are rejected with a message');
      V(cv.dmsToDec(28.5, 0, 0, false).ok && cl(cv.dmsToDec(28.5, 0, 0, false).dec, 28.5) && cv.dmsToDec(28, 30.5, 0, false).ok, 'dmsToDec: decimal degrees alone, and decimal minutes without seconds, are accepted');
      const vals = [28.5562, -33.8688, 0.1, 45.123456, 89.999999, 179.99999, 0.0000139, 10.5, 359.9999999];
      V(vals.every((x) => { const r = cv.decToDms(String(x)); if (!r.ok || r.min >= 60 || r.sec >= 60 || r.min < 0 || r.sec < 0 || r.deg !== Math.floor(r.deg) || r.min !== Math.floor(r.min)) return false; const back = (r.neg ? -1 : 1) * (r.deg + r.min / 60 + r.sec / 3600); return Math.abs(back - x) < 1e-4 / 3600; }), 'decToDms: parts are in range and recombine to the input within the 0.0001 arcsecond rounding');
      V(cv.decToDms('28.5562').text === '28° 33′ 22.32″' && cv.decToDms('-33.8688').text === '-33° 52′ 7.68″' && cv.decToDms('0.5').text === '0° 30′ 0″' && cv.decToDms('33.3').text === '33° 18′ 0″' && cv.decToDms('10.99999999').text === '11° 0′ 0″', 'decToDms: known values, with the carry when seconds round up to 60 (33.3 is 33° 18′ 0″, not 17′ 60″)');
      V(cv.decToDms('-0').text === '0° 0′ 0″' && !cv.decToDms('abc').ok && !cv.decToDms('').ok && /decimal/.test(cv.decToDms('abc').error), 'decToDms: negative zero shows no sign, and bad input gives a message');
      { const d = mkDom(['dm-d', 'dm-m', 'dm-s', 'dm-sg', 'dm-out', 'dd-v', 'dd-out', 'nm-err']), e = d.els; e['dm-d'].value = '33'; e['dm-m'].value = '52'; e['dm-s'].value = '7.68'; e['dm-sg'].value = 'n'; e['dd-v'].value = '28.5562'; cv.numInit(d);
        V(e['dm-out'].textContent === '-33.8688°' && e['dd-out'].textContent === '28° 33′ 22.32″' && e['nm-err'].textContent === '', 'DMS page script: fills both results from the starting values, south as a negative angle');
        e['dm-m'].value = '75'; e['dm-m'].fire('input'); V(e['dm-out'].textContent === '—' && /below 60/.test(e['nm-err'].textContent), 'DMS page script: minutes of 75 clear the result and say why');
        e['dm-m'].value = '0'; e['dm-sg'].value = 'p'; e['dm-sg'].fire('change'); e['dd-v'].value = '-0.5'; e['dd-v'].fire('input'); V(e['dm-out'].textContent === '33.00213333°' && e['dd-out'].textContent === '-0° 30′ 0″' && e['nm-err'].textContent === '', 'DMS page script: the sign list and the decimal field update their own results'); }
      V(/id="dm-out">28\.5562°</.test(PG['dms-converter.html']) && /id="dd-out">28° 33′ 22\.32″</.test(PG['dms-converter.html']) && /Aerodrome and survey coordinates/.test(txt(PG['dms-converter.html'])) && PG['index.html'].indexOf('href="dms-converter.html"') > 0, 'DMS page carries both default answers in the HTML, explains survey use, and is linked from the hub'); }
    /* v1.11.0: power level. Reference formulas written here: dBm = 10 log10(P / 1 mW), dBW = 10 log10(P / 1 W), dBW = dBm - 30. */
    { const cl = (x, y) => Math.abs(x - y) <= 1e-9 * Math.max(1, Math.abs(y)), PL = cv.powerLevel;
      V([[0, 0.001], [30, 1], [60, 1000], [-30, 1e-6], [3, 10 ** 0.3 / 1000], [43, 10 ** 4.3 / 1000]].every((c) => { const r = PL(String(c[0]), 'dBm'); return r.ok && cl(r.W, c[1]) && cl(r.dBm, c[0]) && cl(r.dBW, c[0] - 30); }), 'powerLevel: dBm to watts matches 10^(dBm/10)/1000 (0 dBm = 1 mW, 30 dBm = 1 W, 60 dBm = 1 kW) and dBW = dBm - 30');
      V([[1, 'W', 30], [1, 'mW', 0], [0.001, 'kW', 30], [100, 'W', 50], [0.5, 'W', 26.9897]].every((c) => { const r = PL(String(c[0]), c[1]); return r.ok && Math.abs(r.dBm - c[2]) < 1e-4 && Math.abs(r.dBW - (c[2] - 30)) < 1e-4; }), 'powerLevel: watts, milliwatts and kilowatts to dBm and dBW match 10 log10 of the power');
      V([-47.5, -3, 0, 12.34, 36, 90].every((x) => { const a = PL(String(x), 'dBm'), b = PL(String(a.W), 'W'); return Math.abs(b.dBm - x) < 1e-9; }) && [0.0001, 0.5, 2, 75, 12000].every((w) => { const a = PL(String(w), 'W'), b = PL(String(a.dBW), 'dBW'); return cl(b.W, w); }), 'powerLevel: round trips through dB and watts return the input');
      V(['0', '-5', 'abc', ''].every((s, i) => { const r = PL(s, i === 3 ? 'W' : 'mW'); return r.ok === false && r.error.length > 10; }) && PL('0', 'dBm').ok && PL('-20', 'dBW').ok && !PL('1000', 'dBm').ok, 'powerLevel: zero or negative power in watts and non-numbers are rejected with a message, a negative dB level is fine and absurd levels are refused');
      V(PL('30', 'dBm').tW === '1' && PL('30', 'dBm').tmW === '1000' && PL('30', 'dBm').tkW === '0.001' && PL('30', 'dBm').tdBW === '0' && PL('20', 'dBm').tW === '0.1' && PL('3', 'dBm').tmW === '1.995262', 'powerLevel: displayed text is clean (30 dBm is 1 W, 20 dBm is 0.1 W, 3 dBm is 1.995262 mW)');
      { const d = mkDom(['pl-v', 'pl-u', 'pl-W', 'pl-mW', 'pl-kW', 'pl-dBm', 'pl-dBW', 'nm-err']), e = d.els; e['pl-v'].value = '30'; e['pl-u'].value = 'dBm'; cv.numInit(d);
        V(e['pl-W'].textContent === '1' && e['pl-mW'].textContent === '1000' && e['pl-dBW'].textContent === '0', 'power level page script: 30 dBm fills watts, milliwatts and dBW');
        e['pl-v'].value = '100'; e['pl-u'].value = 'W'; e['pl-u'].fire('change'); V(e['pl-dBm'].textContent === '50' && e['pl-dBW'].textContent === '20' && e['pl-kW'].textContent === '0.1', 'power level page script: changing the unit converts 100 W to 50 dBm and 20 dBW');
        e['pl-v'].value = '-1'; e['pl-v'].fire('input'); V(e['pl-dBm'].textContent === '—' && /greater than zero/.test(e['nm-err'].textContent), 'power level page script: negative watts clear the results and say why'); }
      V(/id="pl-mW">1000</.test(PG['dbm-converter.html']) && /id="pl-dBW">0</.test(PG['dbm-converter.html']) && /dBW = dBm − 30/.test(txt(PG['dbm-converter.html'])) && PG['index.html'].indexOf('href="dbm-converter.html"') > 0, 'power level page carries the default answer in the HTML, shows the formulas and is linked from the hub'); }
      /* dB ratio converter: anchors are textbook decibel values written here (10 dB = x10 power, 20 dB = x100 power = x10 voltage) */
      { const DB = cv.dbRatio, rel = (x, y) => Math.abs(x - y) <= 1e-5 * Math.max(1e-9, Math.abs(y));
        V([[0, 1, 1], [3, 1.995262, 1.412538], [6, 3.981072, 1.995262], [10, 10, 3.162278], [20, 100, 10], [30, 1000, 31.62278], [-3, 0.5011872, 0.7079458], [-10, 0.1, 0.3162278], [-20, 0.01, 0.1]].every((c) => { const r = DB(String(c[0]), 'dB'); return r.ok && rel(r.P, c[1]) && rel(r.A, c[2]); }), 'dB converter: 0, ±3, ±6, 10, 20, 30 dB give the textbook power and voltage ratios');
        V([[2, 'power', 3.0103], [4, 'power', 6.0206], [100, 'power', 20], [2, 'amplitude', 6.0206], [10, 'amplitude', 20], [0.5, 'amplitude', -6.0206], [1, 'power', 0]].every((c) => { const r = DB(String(c[0]), c[1]); return r.ok && Math.abs(r.dB - c[2]) < 1e-4; }), 'dB converter: power ratio 2 is 3.0103 dB, voltage ratio 2 is 6.0206 dB, ratio 10 in voltage is 20 dB');
        V([-47.5, -3, 0, 12.34, 36, 90].every((x) => { const a = DB(String(x), 'dB'), b = DB(String(a.P), 'power'), c = DB(String(a.A), 'amplitude'); return Math.abs(b.dB - x) < 1e-9 && Math.abs(c.dB - x) < 1e-9; }), 'dB converter: dB to power ratio and to voltage ratio and back returns the same dB');
        V([0.1, 0.5, 2, 75, 1200].every((x) => Math.abs(DB(String(x * x), 'power').dB - DB(String(x), 'amplitude').dB) < 1e-9), 'dB converter: a voltage ratio r is the same level as a power ratio r squared');
        V(['0', '-5', 'abc', ''].every((s) => { const r = DB(s, 'power'); return r.ok === false && r.error.length > 10; }) && DB('0', 'dB').ok && DB('-20', 'dB').ok && !DB('400', 'dB').ok && !DB('1e9', 'dB').ok, 'dB converter: zero, negative and non-numeric ratios are rejected; 0 dB is valid; the 300 dB range limit holds');
        V(/id="db-P">1\.995262</.test(PG['db-converter.html']) && /id="db-A">1\.412538</.test(PG['db-converter.html']) && /id="db-dB">3</.test(PG['db-converter.html']) && /20 × log10\(voltage ratio\)/.test(PG['db-converter.html']) && PG['db-converter.html'].indexOf('dbm-converter.html') > 0 && PG['dbm-converter.html'].indexOf('db-converter.html') > 0, 'dB page carries the default answers for 3 dB, the 10 log and 20 log formulas, and links both ways with the dBm page'); }
      /* v1.63.0: binary calculator. Reference: native BigInt written from the BigInt literal syntax in the test (0b, 0o, 0x), not from the page code. */
      { const BC = cv.binaryCalc, pfx = { 2: '0b', 8: '0o', 16: '0x', 10: '' }, rdn = (s, b) => (s[0] === '-' ? -1n : 1n) * BigInt(pfx[b] + s.replace('-', '')), ts = (n, b) => (n < 0n ? '-' : '') + (n < 0n ? -n : n).toString(b).toUpperCase();
        const cases = [['1011', '110', 2], ['FF', '0F', 16], ['377', '12', 8], ['1000', '7', 10], ['-25', '4', 10], ['123456789012345678901234567890', '987654321', 10], ['FFFFFFFFFFFFFFFF', '1', 16], ['0', '1', 2], ['1', '0', 2]];
        const ref = { add: (a, b) => a + b, sub: (a, b) => a - b, mul: (a, b) => a * b, div: (a, b) => a / b, and: (a, b) => a & b, or: (a, b) => a | b, xor: (a, b) => a ^ b };
        V(Object.keys(ref).every((op) => cases.every(([a, b, base]) => { const A = rdn(a, base), B = rdn(b, base); if ((op === 'div' && B === 0n) || (['and', 'or', 'xor'].includes(op) && (A < 0n || B < 0n))) return BC(a, b, base, op).ok === false; const r = BC(a, b, base, op), want = ref[op](A, B); return r.ok && r.dec === ts(want, 10) && r.hex === ts(want, 16) && r.oct === ts(want, 8) && r.bin === ts(want, 2); })), 'binaryCalc: add, subtract, multiply, divide, AND, OR and XOR equal native BigInt arithmetic in all four bases, including 30-digit and 64-bit values and negatives');
        V(BC('1011', '110', 2, 'add').bin === '10001' && BC('1011', '110', 2, 'add').dec === '17' && BC('1011', '110', 2, 'add').binG === '0001 0001' && BC('1', '8', 10, 'shl').dec === '256' && BC('256', '4', 10, 'shr').dec === '16' && BC('F0', '3C', 16, 'xor').hex === 'CC', 'binaryCalc: 1011 + 110 = 10001 (17), shifts by 8 and 4 give 256 and 16, F0 XOR 3C = CC, and the binary answer is grouped in fours');
        V(BC('255', '7', 10, 'div').dec === '36' && /^Remainder 3 /.test(BC('255', '7', 10, 'div').rem) && BC('-255', '7', 10, 'div').dec === '-36' && /^Remainder -3 /.test(BC('-255', '7', 10, 'div').rem) && BC('3', '5', 10, 'add').rem === '', 'binaryCalc: divide gives the whole quotient and the remainder (truncated toward zero, as in a = q b + r), and other operations show no remainder');
        V(BC('0x1F', '0x1', 16, 'add').dec === '32' && BC('0b101', '1', 2, 'add').dec === '6' && BC('0o17', '1', 8, 'add').dec === '16' && BC('1111 0000', '0000 1111', 2, 'or').dec === '255' && BC('1_000', '1', 10, 'add').dec === '1001', 'binaryCalc: 0x, 0b and 0o prefixes, spaces and underscores are accepted');
        V(BC('12', '1', 2, 'add').ok === false && /not valid in base 2/.test(BC('12', '1', 2, 'add').error) && BC('1', '0', 10, 'div').ok === false && /zero/.test(BC('1', '0', 10, 'div').error) && BC('-1', '1', 10, 'and').ok === false && BC('1', '2000', 10, 'shl').ok === false && BC('', '1', 10, 'add').ok === false && BC('1', '', 10, 'add').ok === false && BC('1', '1', 10, 'nope').ok === false && BC('1'.repeat(201), '1', 10, 'add').ok === false, 'binaryCalc: invalid digits, divide by zero, negative bitwise operands, shifts above 1,000, blank entries, unknown operations and entries over 200 digits are rejected with a message');
        V(BC('0', '0', 10, 'add').bits === 1 && BC('255', '1', 10, 'add').bits === 9 && BC('-8', '0', 10, 'add').bin === '-1000' && BC('-8', '0', 10, 'add').binG === '-1000', 'binaryCalc: bit length of the answer and the sign on negative answers');
        { const d = mkDom(['bc-a', 'bc-b', 'bc-base', 'bc-op', 'bc-2', 'bc-8', 'bc-10', 'bc-16', 'bc-bits', 'bc-x', 'nm-err']), e = d.els; e['bc-a'].value = '1011'; e['bc-b'].value = '110'; e['bc-base'].value = '2'; e['bc-op'].value = 'add'; cv.numInit(d);
          V(e['bc-10'].textContent === '17' && e['bc-16'].textContent === '11' && e['bc-2'].textContent === '0001 0001' && e['bc-bits'].textContent === '5' && e['nm-err'].textContent === '', 'binary calculator page script: 1011 + 110 fills all four bases and the bit count');
          e['bc-base'].value = '10'; e['bc-a'].value = '255'; e['bc-b'].value = '7'; e['bc-op'].value = 'div'; e['bc-op'].fire('change'); V(e['bc-10'].textContent === '36' && /^Remainder 3/.test(e['bc-x'].textContent), 'binary calculator page script: changing base and operation recalculates, divide shows the remainder');
          e['bc-b'].value = '0'; e['bc-b'].fire('input'); V(e['bc-10'].textContent === '—' && /zero/.test(e['nm-err'].textContent), 'binary calculator page script: divide by zero clears the results and says why'); }
        V(/id="bc-10">17</.test(PG['binary-calculator.html']) && /id="bc-2">0001 0001</.test(PG['binary-calculator.html']) && /XOR/.test(txt(PG['binary-calculator.html'])) && PG['index.html'].indexOf('href="binary-calculator.html"') > 0 && PG['binary-calculator.html'].indexOf('number-base-converter.html') > 0, 'binary calculator page carries the default answer in the HTML, explains the bitwise operations and is linked from the hub'); }
      /* v1.63.0: SI prefix converter. Reference: value x 10^(from - to), compared as numbers; exact digit strings for the anchors. */
      { const SP = cv.siPrefix, EXPS = [12, 9, 6, 3, 0, -3, -6, -9, -12, -15], rel = (x, y) => Math.abs(x - y) <= 1e-12 * Math.max(1e-300, Math.abs(y));
        V(['4700', '0.033', '1', '250', '12.5', '0.0000047', '1e3', '-2.2', '9876.54321'].every((v) => EXPS.every((f) => EXPS.every((t) => { const r = SP(v, f, t); return r.ok && rel(Number(r.text === 'too long to show' ? r.e : r.text), Number(v) * Math.pow(10, f - t)) && rel(r.value, Number(v) * Math.pow(10, f - t)); }))), 'siPrefix: nine values through all 100 prefix pairs equal value × 10^(from − to)');
        V(SP('4700', -9, -6).text === '4.7' && SP('0.0000047', 0, -6).text === '4.7' && SP('2200', -6, -3).text === '2.2' && SP('4.7', 3, 0).text === '4700' && SP('1', 6, 3).text === '1000' && SP('250', -3, 0).text === '0.25' && SP('33', -12, -9).text === '0.033' && SP('0.5', 9, 6).text === '500' && SP('1.20', 0, 0).text === '1.2' && SP('007', 3, 3).text === '7', 'siPrefix: exact text with no floating-point residue (4,700 nF = 4.7 µF, 250 mA = 0.25 A, 33 pF = 0.033 nF, 0.5 GHz = 500 MHz)');
        V(SP('4700', -9, -6).best === '4.7 µ' && SP('0.0000047', 0, 0).best === '4.7 µ' && SP('4700', 0, 0).best === '4.7 k' && SP('1000000', 0, 0).best === '1 M' && SP('999', 0, 0).best === '999' && SP('0.5', 0, 0).best === '500 m' && SP('-0.0033', 0, 0).best === '-3.3 m' && SP('1e-20', 0, 0).best === '0.00001 f' && SP('5e15', 0, 0).best === '5000 T', 'siPrefix: the best-fit prefix leaves 1 to 999 (4,700 is 4.7 k, 0.5 is 500 m), with the sign kept and the ends of the prefix list clamped');
        V(SP('4700', -9, -6).e === '4.7e0' && SP('4700', 0, 0).e === '4.7e3' && SP('0.0000047', 0, 0).e === '4.7e-6' && SP('4.7×10^-3', 0, 0).text === '0.0047' && SP('1,000', 0, 0).text === '1000' && SP('0', 3, -3).text === '0' && SP('-0.5', 0, -3).text === '-500' && SP('.5', 0, 0).text === '0.5' && SP('5.', 0, 0).text === '5', 'siPrefix: E notation, the ×10^ form, thousands separators, zero, a negative value and a bare decimal point are read correctly');
        V(['', 'abc', '1e', '--1', '1.2.3', '.', '1e999'].every((s) => SP(s, 0, 0).ok === false && SP(s, 0, 0).error.length > 10) && SP('1'.repeat(61), 0, 0).ok === false && SP('1', 12, -15).text === '1000000000000000000000000000' && SP('1e300', 12, -15).text === 'too long to show', 'siPrefix: non-numbers and out-of-range values are rejected with a message, the widest swing (tera to femto) is exact, and a result over 40 digits is not printed');
        { const d = mkDom(['sp-v', 'sp-f', 'sp-t', 'sp-out', 'sp-e', 'sp-best', 'nm-err']), e = d.els; e['sp-v'].value = '4700'; e['sp-f'].value = '-9'; e['sp-t'].value = '-6'; cv.numInit(d);
          V(e['sp-out'].textContent === '4.7' && e['sp-e'].textContent === '4.7e0' && e['sp-best'].textContent === '4.7 µ' && e['nm-err'].textContent === '', 'SI prefix page script: 4,700 nF fills 4.7 µF, E notation and the best-fit prefix');
          e['sp-f'].value = '3'; e['sp-t'].value = '0'; e['sp-v'].value = '4.7'; e['sp-f'].fire('change'); V(e['sp-out'].textContent === '4700' && e['sp-best'].textContent === '4.7 k', 'SI prefix page script: changing a prefix list recalculates (4.7 k to the base unit is 4700)');
          e['sp-v'].value = 'x'; e['sp-v'].fire('input'); V(e['sp-out'].textContent === '—' && /number/.test(e['nm-err'].textContent), 'SI prefix page script: bad input clears the results and says why'); }
        V(/id="sp-out">4\.7</.test(PG['si-prefix-converter.html']) && /id="sp-best">4\.7 µ</.test(PG['si-prefix-converter.html']) && /m is milli and M is mega/.test(txt(PG['si-prefix-converter.html'])) && PG['index.html'].indexOf('href="si-prefix-converter.html"') > 0 && PG['si-prefix-converter.html'].indexOf('binary-calculator.html') > 0, 'SI prefix page carries the default answer in the HTML, explains m versus M and is linked from the hub'); }
    const tc = txt(PG['temperature-converter.html']), fc = txt(PG['force-converter.html']), ic = txt(PG['illumination-converter.html']), pc2 = txt(PG['pressure-converter.html']);
    V(/Temperature differences/.test(tc) && /18 °F/.test(tc) && /°F = °C × 9\/5 \+ 32/.test(tc) && /Torque is force times distance/.test(fc) && /Three different quantities/.test(ic) && /Gauge and absolute pressure/.test(pc2) && /1 foot-candle|foot-candle is one lumen per square foot/.test(ic), 'Level 2 and 3 pages explain temperature differences, torque versus energy, lighting quantities and gauge versus absolute pressure');
    V((PG['hub'] || PG['index.html']).indexOf('href="number-base-converter.html"') > 0 && PG['index.html'].indexOf('href="scientific-notation-converter.html"') > 0 && Object.keys(E.CONV_UNITS).length === 25, 'hub links both number pages; the engine holds 25 converter quantities (v1.11.0: 5 extended electrical quantities)');
    /* v1.11.0 spot checks from definitions: 1 Ah = 3600 C, 50 Hz = 100 pi rad/s, 1 GHz = 1e9 Hz, 1 cal = 4.1868 J, 1 BHP = 745.69987 W, 1 GW = 1e9 W */
    { const cl = (x, y, tol) => Math.abs(x - y) <= (tol || 1e-9) * Math.abs(y), T2 = (d, x, f2, t2) => E.convertUnits(d, x, f2, t2);
      V(cl(T2('charge', 1, 'Ah', 'C'), 3600) && cl(T2('frequency', 50, 'Hz', 'rad/s'), 100 * Math.PI) && cl(T2('frequency', 1, 'GHz', 'Hz'), 1e9) && cl(T2('energy', 1, 'cal', 'J'), 4.1868) && cl(T2('power', 1, 'BHP', 'W'), 745.69987158, 1e-8) && cl(T2('power', 1, 'GW', 'W'), 1e9) && cl(T2('voltage', 1, 'GV', 'V'), 1e9) && cl(T2('energy', 1, 'GeV', 'J'), 1.602176634e-10), 'v1.11.0 unit gaps: Ah to coulomb, Hz to rad/s, GHz, cal, BHP, GW, GV and GeV match their definitions'); }
  }
  /* committed files, integration */
  V(Object.keys(PG).every((f) => STRIP(fsx.readFileSync(pth.join(ROOT, 'converters', f), 'utf8')) === PG[f]) && fsx.readdirSync(pth.join(ROOT, 'converters')).length === Object.keys(PG).length, 'committed converters/ equals generator output, ignoring only the deploy-time tags');
  const sm = dep.root['sitemap.xml'];
  V(dep.conv.slugs.every((s) => sm.indexOf('<loc>' + SITE + '/converters/' + s + '.html</loc>') > 0), 'sitemap lists every Conversion Centre page');
  const swSrc = fsx.readFileSync(pth.join(ROOT, 'sw.js'), 'utf8'), shell = [...(/const SHELL = \[([\s\S]*?)\];/.exec(swSrc) || [, ''])[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  V(shell.indexOf('./converters/index.html') >= 0 && /fetch/.test(swSrc) && /caches\.open\(CACHE\)\.then\(\(c\) => c\.put\(req, copy\)\)/.test(swSrc), 'sw.js caches the Conversion Centre hub up front and every other converters/ page when it is first visited (not pre-cached: about 290 pages)');
  V(plain.pages['index.html'].indexOf('href="../converters/index.html"') > 0 && plain.root['index.html'].indexOf('href="converters/index.html"') > 0, 'the conversions hub and the home page link to the Conversion Centre');
  const cd = require('../tools/check_deploy.js'), files = {};
  Object.keys(dep.pages).forEach((k) => { files['pages/' + k] = dep.pages[k]; }); Object.keys(dep.root).forEach((k) => { files[k] = dep.root[k]; }); Object.keys(dep.legal).forEach((k) => { files[k] = dep.legal[k]; });
  Object.keys(dep.calc.pages).forEach((k) => { files['calculators/' + (k === 'index' ? '' : k + '/') + 'index.html'] = dep.calc.pages[k]; }); Object.keys(dep.conv.pages).forEach((k) => { files['converters/' + k] = dep.conv.pages[k]; });
  const mut = (fn) => { const f = Object.assign({}, files); fn(f); return cd.check(f, SITE); };
  V(cd.check(files, SITE).length === 0, 'production output with the Conversion Centre passes the deploy guard');
  V(mut((f) => { f['converters/kw-to-hp.html'] = f['converters/kw-to-hp.html'].replace(/<link rel="canonical" href="[^"]*">/, ''); }).some((p) => /converters\/kw-to-hp\.html: canonical link missing/.test(p)), 'guard checks Conversion Centre pages: a missing canonical is caught');
  V(mut((f) => { f['sitemap.xml'] = f['sitemap.xml'].replace('  <url><loc>' + SITE + '/converters/hp-to-kw.html</loc><lastmod>2026-11-07</lastmod></url>\n', ''); }).some((p) => /does not list converters\/hp-to-kw\.html/.test(p)), 'guard catches a Conversion Centre page missing from the sitemap');
  V(mut((f) => { delete f['converters/power-converter.html']; }).some((p) => /power-converter/.test(p)), 'guard catches a deleted Conversion Centre page that the sitemap still lists');
  total += n18; console.log('18. Conversion Centre:', n18 + '/' + n18, 'checked');
}
/* 19. Reference pages and worked examples (v1.11.0). Expected values are written here from definitions, not read from tools/reference_logic.js. */
{
  const bp = require('../tools/build_pages.js'), RL = require('../tools/reference_logic.js'), RB = require('../tools/build_reference.js'), fsx = require('fs'), pth = require('path');
  const ROOT = pth.join(__dirname, '..'), plain = bp.build({ base: '' }), PG = plain.conv.pages, MT = plain.conv.meta;
  let n19 = 0; const V = (c, m) => { n19++; if (!c) { fails++; console.log('  FAIL ' + m); } };
  const txt = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\s+/g, ' ');
  const cl = (a, b, t) => Math.abs(a - b) <= (t || 1e-9) * Math.max(Math.abs(b), 1e-300);
  /* a fake DOM with selects, hidden flags and styles */
  const mk = (ids) => { const els = {}; ids.forEach((i) => { const o = { value: '', textContent: '', options: [], hidden: false, disabled: false, style: {}, handlers: {}, addEventListener(e, fn) { (this.handlers[e] = this.handlers[e] || []).push(fn); }, appendChild(c) { this.options.push(c.value); }, fire(e) { (this.handlers[e] || []).forEach((fn) => fn()); } }; Object.defineProperty(o, 'innerHTML', { get() { return ''; }, set() { o.options = []; } }); els[i] = o; }); return { els, getElementById: (i) => els[i] || null, createElement: () => ({ value: '', textContent: '' }) }; };

  /* --- resistor colour code: the code is written out here by hand --- */
  const COL = 'black brown red orange yellow green blue violet grey white'.split(' '), T = RL.RES_T;
  const dec = (b) => RL.resDecode(T, b);
  const fx = [[['brown', 'black', 'red', 'gold'], 1000, 5], [['yellow', 'violet', 'orange', 'silver'], 47000, 10], [['red', 'red', 'black', 'black', 'brown'], 220, 1], [['green', 'blue', 'black', 'red', 'brown'], 56000, 1],
    [['brown', 'black', 'gold', 'gold'], 1, 5], [['red', 'red', 'red'], 2200, 20], [['brown', 'black', 'white', 'gold'], 1e10, 5], [['brown', 'black', 'black', 'red', 'brown', 'red'], 10000, 1], [['orange', 'orange', 'brown', 'gold'], 330, 5], [['blue', 'grey', 'yellow', 'red'], 680000, 2]];
  V(fx.every((c) => { const r = dec(c[0]); return r.ok && cl(r.ohms, c[1]) && r.tol === c[2]; }), 'resistor: ten colour codes read from the standard digits, multipliers and tolerances give the known values');
  V(dec(['brown', 'black', 'black', 'red', 'brown', 'red']).ppm === 50 && dec(['brown', 'black', 'black', 'red', 'brown', 'brown']).ppm === 100 && dec(['red', 'red', 'red']).ppm === null, 'resistor: the sixth band gives ppm/K (red 50, brown 100) and other codes give none');
  { let all = true, cnt = 0; for (let a = 1; a < 10; a++) for (let b = 0; b < 10; b++) for (let m = 0; m < 12; m++) { const e = m < 10 ? m : (m === 10 ? -1 : -2), want = (a * 10 + b) * Math.pow(10, e), got = dec([COL[a], COL[b], m < 10 ? COL[m] : (m === 10 ? 'gold' : 'silver'), 'gold']); cnt++; if (!got.ok || !cl(got.ohms, want, 1e-9)) all = false; }
    V(all && cnt === 1080, 'resistor: all 1,080 two-digit and multiplier combinations equal (10a + b) x 10^e'); }
  V(cl(dec(['yellow', 'violet', 'red', 'gold']).min, 4465) && cl(dec(['yellow', 'violet', 'red', 'gold']).max, 4935) && dec(['yellow', 'violet', 'red', 'gold']).range === '4.465 kΩ to 4.935 kΩ', 'resistor: 4.7 k at 5% runs from 4,465 to 4,935 ohms');
  V([[4.7, '4.7 Ω'], [4700, '4.7 kΩ'], [0.1, '0.1 Ω'], [2.2e6, '2.2 MΩ'], [1e10, '10 GΩ'], [999, '999 Ω'], [1000, '1 kΩ']].every((c) => RL.resFmt(c[0]) === c[1]), 'resistor: values are shown with ohm, kilohm, megohm or gigohm');
  const bad = [[['gold', 'red', 'red', 'gold'], /Band 1/], [['black', 'red', 'red', 'gold'], /Band 1 cannot be black/], [['red', 'red', 'red', 'orange'], /Band 4 must be a tolerance/], [['red', 'red', 'blue', 'gold', 'red', 'gold'], /Band 6 must be a temperature coefficient/], [['red', 'red'], /3, 4, 5 or 6/], [['red', 'red', 'red', 'red', 'red', 'red', 'red'], /3, 4, 5 or 6/], [['red', 'red', 'red', 'red', 'orange', 'brown'], /Band 5 must be a tolerance/], [['red', 'red', 'pink', 'gold'], /Band 3/]];
  V(bad.every((c) => { const r = dec(c[0]); return r.ok === false && c[1].test(r.error); }), 'resistor: a metal colour in a digit place, a black first band, a wrong tolerance, a wrong band count and an unknown colour are refused with the band number');
  { const e24 = [10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91]; let ok = true, n = 0;
    e24.forEach((v) => { for (let k = -1; k <= 9; k++) { const val = v * Math.pow(10, k), enc = RL.resEncode(T, String(Number(val.toPrecision(12))), 4, 5), back = enc.ok ? dec(enc.bands) : null; n++; if (!enc.ok || !back.ok || !cl(back.ohms, val, 1e-9)) ok = false; } });
    V(ok && n === 264, 'resistor: all 24 E24 values in eleven decades (264) encode to 4 bands and decode back to the same value'); }
  V([['4.7k', 4, 'Yellow, Violet, Red, Gold'], ['4700', 4, 'Yellow, Violet, Red, Gold'], ['330', 4, 'Orange, Orange, Brown, Gold'], ['2.2M', 4, 'Red, Red, Green, Gold'], ['0.1', 4, 'Brown, Black, Silver, Gold'], ['1', 4, 'Brown, Black, Gold, Gold'], ['4.7k', 5, 'Yellow, Violet, Black, Brown, Gold'], ['4.75k', 5, 'Yellow, Violet, Green, Brown, Gold'], ['100', 5, 'Brown, Black, Black, Black, Gold']].every((c) => { const r = RL.resEncode(T, c[0], c[1], 5); return r.ok && r.text === c[2]; }), 'resistor: encoding 4.7k, 330, 2.2M, 0.1, 1, and 5-band 4.7k, 4.75k and 100 gives the known colours');
  V(!RL.resEncode(T, '4.75k', 4, 5).ok && /5 bands/.test(RL.resEncode(T, '4.75k', 4, 5).error) && ['0', '-5', 'abc', '', '1e12', '0.05'].every((s) => RL.resEncode(T, s, 4, 5).ok === false && RL.resEncode(T, s, 4, 5).error.length > 10) && RL.resEncode(T, '100', 4, 3).ok === false && RL.resEncode(T, '100', 6, 5).ok === false, 'resistor: a value with too many digits, zero, negative, text, too large, too small, an unknown tolerance and 6 bands are refused with a message');
  V(['4.7K', '4.7 k', '4.7kΩ', '4,700', '4700 ohm'].every((s) => { const r = RL.resEncode(T, s, 4, 5); return r.ok && r.text === 'Yellow, Violet, Red, Gold'; }), 'resistor: k, K, spaces, the ohm sign, commas and the word ohm are accepted in the value');
  { const d = mk(['rc-n', 'rc-b1', 'rc-b2', 'rc-b3', 'rc-b4', 'rc-b5', 'rc-b6', 'rc-r1', 'rc-r2', 'rc-r3', 'rc-r4', 'rc-r5', 'rc-r6', 'rc-l1', 'rc-l2', 'rc-l3', 'rc-l4', 'rc-l5', 'rc-l6', 'rc-s1', 'rc-s2', 'rc-s3', 'rc-s4', 'rc-s5', 'rc-s6', 'rc-out', 'rc-range', 'rc-err', 'rc-v', 'rc-n2', 'rc-t', 'rc-enc', 'rc-err2', 'rc-e1', 'rc-e2', 'rc-e3', 'rc-e4', 'rc-e5']), e = d.els;
    e['rc-n'].value = '4'; e['rc-v'].value = '4700'; e['rc-n2'].value = '4'; e['rc-t'].value = '5'; RL.resInit(T, d);
    V(e['rc-out'].textContent === '4.7 kΩ ±5%' && e['rc-r5'].hidden === true && e['rc-r4'].hidden === false && e['rc-s5'].hidden === true && e['rc-s1'].style.background === T.css.yellow && e['rc-enc'].textContent === 'Yellow, Violet, Red, Gold', 'resistor page script: starts with yellow, violet, red, gold = 4.7 k, 4 rows shown, and the encoder fills');
    e['rc-n'].value = '5'; e['rc-n'].fire('change'); V(e['rc-out'].textContent === '4.7 kΩ ±1%' && e['rc-r5'].hidden === false && e['rc-r6'].hidden === true && /Band 4: multiplier/.test(e['rc-l4'].textContent) && e['rc-b4'].options.length === 12 && e['rc-b5'].options.length === 8, 'resistor page script: 5 bands re-labels the rows (band 4 multiplier, band 5 tolerance) with the right colour lists');
    e['rc-n'].value = '6'; e['rc-n'].fire('change'); V(e['rc-out'].textContent === '4.7 kΩ ±1%, 100 ppm/K' && e['rc-r6'].hidden === false && e['rc-b6'].options.length === 6, 'resistor page script: 6 bands adds the temperature coefficient');
    e['rc-n'].value = '3'; e['rc-n'].fire('change'); V(e['rc-out'].textContent === '4.7 kΩ ±20%' && e['rc-r4'].hidden === true, 'resistor page script: 3 bands is plus or minus 20%');
    e['rc-n'].value = '4'; e['rc-n'].fire('change'); e['rc-b1'].value = 'red'; e['rc-b2'].value = 'red'; e['rc-b3'].value = 'brown'; e['rc-b4'].value = 'silver'; e['rc-b1'].fire('change'); V(e['rc-out'].textContent === '220 Ω ±10%' && e['rc-range'].textContent === '198 Ω to 242 Ω' && e['rc-s4'].style.background === T.css.silver, 'resistor page script: red, red, brown, silver = 220 ohms, 10%, range 198 to 242');
    e['rc-b1'].value = 'black'; e['rc-b1'].fire('change'); V(e['rc-out'].textContent === '—' && /cannot be black/.test(e['rc-err'].textContent), 'resistor page script: a black first band clears the result and shows the message');
    e['rc-v'].value = '4.75k'; e['rc-v'].fire('input'); V(e['rc-enc'].textContent === '—' && /5 bands/.test(e['rc-err2'].textContent) && e['rc-e1'].hidden === true, 'resistor page script: a value that needs 5 bands says so and hides the swatches');
    e['rc-n2'].value = '5'; e['rc-n2'].fire('change'); V(e['rc-enc'].textContent === 'Yellow, Violet, Green, Brown, Gold' && e['rc-e5'].hidden === false && e['rc-e3'].style.background === T.css.green, 'resistor page script: 5 bands encodes 4.75k and shows five swatches');
    e['rc-t'].value = '1'; e['rc-t'].fire('change'); V(e['rc-enc'].textContent === 'Yellow, Violet, Green, Brown, Brown', 'resistor page script: choosing 1% changes the last band to brown'); }
  { const h = PG['resistor-color-code.html'], t = txt(h);
    V(/id="rc-out">4\.7 kΩ ±5%</.test(h) && /id="rc-range">4\.465 kΩ to 4\.935 kΩ</.test(h) && /id="rc-enc">Yellow, Violet, Red, Gold</.test(h) && /<span class="sw" id="rc-s5" hidden>/.test(h) && /<span class="sw" id="rc-s1" style="background:#FCD116">/.test(h), 'resistor page carries both default answers and the swatches in the HTML');
    V([10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91].every((v) => new RegExp('(^|[ ,:])' + v + '(,|\\b)').test(t.slice(t.indexOf('E24:')))) && /E12: 10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82/.test(t), 'resistor page lists the 12 E12 and 24 E24 preferred values');
    V(['Black', 'Brown', 'Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Violet', 'Grey', 'White', 'Gold', 'Silver'].every((c) => t.indexOf(c) > 0) && /Violet 7 ×10,000,000 ±0\.1%/.test(t) && /Gold — ×0\.1 ±5%/.test(t) && /Brown, Black, Orange, Red = 10 kΩ ±2%/.test(t), 'resistor page colour table and worked examples show the standard values'); }

  /* --- Coulomb's law: k = 1 / (4 pi eps0) written out here --- */
  { const U = RL.COULOMB_UNITS, eps0 = 8.8541878128e-12, Fd = (a, b, r) => Math.abs(a * b) / (4 * Math.PI * eps0 * r * r), F = RL.coulombForce, e = 1.602176634e-19;
    V(cl(F(U, 1, 'µC', 2, 'µC', 0.1, 'm').F, Fd(1e-6, 2e-6, 0.1), 1e-8) && cl(F(U, 1, 'C', 1, 'C', 1, 'm').F, 8.9875517923e9, 1e-9) && cl(F(U, 1, 'e', -1, 'e', 5.29177e-11, 'm').F, Fd(e, e, 5.29177e-11), 1e-8) && cl(F(U, 3, 'nC', 4, 'mC', 25, 'cm').F, Fd(3e-9, 4e-3, 0.25), 1e-8), 'Coulomb: four cases equal q1 q2 / (4 pi eps0 r^2), including the proton and electron at the Bohr radius (8.24e-8 N)');
    V(cl(F(U, 1, 'µC', 2, 'µC', 0.2, 'm').F * 4, F(U, 1, 'µC', 2, 'µC', 0.1, 'm').F, 1e-12) && cl(F(U, 2, 'µC', 2, 'µC', 0.1, 'm').F, 2 * F(U, 1, 'µC', 2, 'µC', 0.1, 'm').F, 1e-12) && cl(F(U, 1, 'µC', 2, 'µC', 10, 'cm').F, F(U, 1, 'µC', 2, 'µC', 0.1, 'm').F, 1e-12) && cl(F(U, 1, 'µC', 2, 'µC', 100, 'mm').F, F(U, 1, 'µC', 2, 'µC', 0.1, 'm').F, 1e-12), 'Coulomb: doubling the distance quarters the force, doubling a charge doubles it, and cm and mm give the same answer as metres');
    V(F(U, 1, 'µC', -2, 'µC', 1, 'm').kind === 'attractive' && F(U, -1, 'µC', -2, 'µC', 1, 'm').kind === 'repulsive' && F(U, 1, 'µC', 2, 'µC', 1, 'm').kind === 'repulsive' && F(U, 0, 'µC', 2, 'µC', 1, 'm').kind === 'none' && F(U, 0, 'µC', 2, 'µC', 1, 'm').F === 0, 'Coulomb: unlike charges attract, like charges repel (both signs), and a zero charge gives no force');
    V([['', 'µC', '2', 'µC', '1', 'm'], ['abc', 'µC', '2', 'µC', '1', 'm'], ['1', 'µC', '2', 'µC', '0', 'm'], ['1', 'µC', '2', 'µC', '-1', 'm'], ['1', 'µC', '2', 'µC', '', 'm'], ['1', 'xx', '2', 'µC', '1', 'm']].every((c) => { const r = F(U, c[0], c[1], c[2], c[3], c[4], c[5]); return r.ok === false && r.error.length > 10; }), 'Coulomb: blank, text, zero or negative distance and an unknown unit are refused with a message');
    V(RL.coulombText(1.79751) === '1.79751 N' && RL.coulombText(8.23871e-8) === '8.23871 × 10⁻⁸ N' && RL.coulombText(8.9875517923e9) === '8.98755 × 10⁹ N' && RL.coulombText(0) === '0 N' && RL.coulombText(1234.5) === '1,234.5 N', 'Coulomb: force text switches to powers of ten outside 1e-4 to 1e9');
    const d = mk(['cb-q1', 'cb-u1', 'cb-q2', 'cb-u2', 'cb-r', 'cb-ur', 'cb-out', 'cb-kind', 'cb-err']), el = d.els; el['cb-q1'].value = '1'; el['cb-u1'].value = 'µC'; el['cb-q2'].value = '2'; el['cb-u2'].value = 'µC'; el['cb-r'].value = '0.1'; el['cb-ur'].value = 'm'; RL.cbInit(U, d);
    V(el['cb-out'].textContent === '1.79751 N' && /Repulsive/.test(el['cb-kind'].textContent), 'Coulomb page script: starts at 1.79751 N repulsive');
    el['cb-q2'].value = '-2'; el['cb-q2'].fire('input'); V(el['cb-out'].textContent === '1.79751 N' && /Attractive/.test(el['cb-kind'].textContent), 'Coulomb page script: a negative second charge makes it attractive');
    el['cb-ur'].value = 'cm'; el['cb-ur'].fire('change'); V(el['cb-out'].textContent === '17,975.1 N' && cl(Fd(2e-6, 1e-6, 0.001), 17975.1035846, 1e-8), 'Coulomb page script: switching the distance unit to cm recalculates (0.1 cm = 0.001 m gives 17,975.1 N, 10,000 times more)');
    el['cb-r'].value = '0'; el['cb-r'].fire('input'); V(el['cb-out'].textContent === '—' && /greater than zero/.test(el['cb-err'].textContent), 'Coulomb page script: zero distance clears the result and shows the message');
    const h = PG['coulombs-law.html'], t = txt(h);
    V(/id="cb-out">1\.79751 N</.test(h) && /Repulsive \(like charges\)/.test(h) && /8\.23871 × 10⁻⁸ N/.test(t) && ['0.05 m', '0.1 m', '0.2 m', '0.4 m', '0.8 m'].every((s) => t.indexOf(s) > 0) && cl(Fd(1e-6, 2e-6, 0.05), 4 * Fd(1e-6, 2e-6, 0.1), 1e-12) && /7\.19 ?(\d*)/.test(t) === false || /7\.19004 N/.test(t), 'Coulomb page: default answer, the proton and electron figure and the distance table are in the HTML, and 0.05 m gives 7.19004 N'); }

  /* --- watts to amps and amps to watts --- */
  { const A = RL.ltCalc, S3 = Math.sqrt(3);
    V(cl(A('wa', 1000, 230, 1, '1ph').value, 1000 / 230) && cl(A('wa', 1000, 120, 1, '1ph').value, 1000 / 120) && cl(A('wa', 1000, 400, 0.8, '3ph').value, 1000 / (S3 * 400 * 0.8)) && cl(A('wa', 1000, 12, 0.5, 'dc').value, 1000 / 12) && cl(A('aw', 100, 230, 1, '1ph').value, 23000) && cl(A('aw', 10, 400, 0.8, '3ph').value, S3 * 400 * 10 * 0.8) && cl(A('aw', 5, 48, 0.2, 'dc').value, 240), 'watts and amps: seven cases equal P = V I pf (single-phase), sqrt(3) V I pf (three-phase) and V I (DC, power factor ignored)');
    V([[1000, 230, 0.9, '1ph'], [3500, 400, 0.85, '3ph'], [75, 12, 1, 'dc'], [0.5, 120, 0.3, '1ph']].every((c) => cl(A('aw', A('wa', c[0], c[1], c[2], c[3]).value, c[1], c[2], c[3]).value, c[0], 1e-12)), 'watts and amps: amps to watts undoes watts to amps in all three supply types');
    V([[0, 230, 1, '1ph'], ['', 230, 1, '1ph'], [-5, 230, 1, '1ph'], ['abc', 230, 1, '1ph'], [100, 0, 1, '1ph'], [100, -230, 1, '1ph'], [100, 230, 0, '1ph'], [100, 230, 1.2, '1ph'], [100, 230, '', '3ph']].every((c) => A('wa', c[0], c[1], c[2], c[3]).ok === false && A('wa', c[0], c[1], c[2], c[3]).error.length > 10) && A('wa', 100, 230, 'abc', 'dc').ok && A('wa', 100, 230, 1, '1ph').ok, 'watts and amps: zero, negative, blank and text values, a bad voltage and a power factor outside 0 to 1 are refused; DC ignores the power factor');
    V(A('wa', 1000, 230, 1, '1ph').text === '4.348 A' && A('wa', 10000, 120, 1, '1ph').text === '83.33 A' && A('aw', 100, 230, 1, '1ph').text === '23,000 W' && A('aw', 50, 480, 0.8, '3ph').text === '33,260 W' && A('wa', 100, 230, 1, '1ph').text === '0.4348 A', 'watts and amps: the text has four significant digits with thousands separators');
    const d = mk(['lt-x', 'lt-v', 'lt-pf', 'lt-sys', 'lt-out', 'lt-err']), e = d.els; e['lt-x'].value = '1000'; e['lt-v'].value = '230'; e['lt-pf'].value = '1'; e['lt-sys'].value = '1ph'; RL.ltInit('wa', d);
    V(e['lt-out'].textContent === '4.348 A' && e['lt-pf'].disabled === false, 'watts and amps page script: 1000 W at 230 V is 4.348 A');
    e['lt-sys'].value = '3ph'; e['lt-v'].value = '400'; e['lt-pf'].value = '0.8'; e['lt-sys'].fire('change'); V(e['lt-out'].textContent === '1.804 A', 'watts and amps page script: three-phase at 400 V and 0.8 gives 1.804 A');
    e['lt-sys'].value = 'dc'; e['lt-v'].value = '12'; e['lt-sys'].fire('change'); V(e['lt-out'].textContent === '83.33 A' && e['lt-pf'].disabled === true, 'watts and amps page script: DC at 12 V gives 83.33 A and switches the power factor box off');
    e['lt-x'].value = '0'; e['lt-x'].fire('input'); V(e['lt-out'].textContent === '—' && /greater than zero/.test(e['lt-err'].textContent), 'watts and amps page script: zero clears the result and shows the message');
    const d2 = mk(['lt-x', 'lt-v', 'lt-pf', 'lt-sys', 'lt-out', 'lt-err']), e2 = d2.els; e2['lt-x'].value = '20'; e2['lt-v'].value = '120'; e2['lt-pf'].value = '1'; e2['lt-sys'].value = '1ph'; RL.ltInit('aw', d2); V(e2['lt-out'].textContent === '2,400 W', 'watts and amps page script: 20 A at 120 V is 2,400 W');
    const LT = MT.filter((m) => m.kind === 'example'), WS = [100, 200, 500, 600, 750, 800, 1000, 1200, 1500, 2000, 3000, 5000, 10000], AS = [1, 2, 3, 5, 10, 15, 20, 30, 50, 100], KS = [1, 2, 3, 5, 10, 20, 50], AK = [10, 16, 32, 63, 100], SK = [25, 63, 100, 160, 250, 400, 630, 1000];
    const want = WS.map((w) => w + '-watts-to-amps').concat(AS.map((a) => a + '-amps-to-watts')).concat(KS.map((k) => k + '-kw-to-amps')).concat(AK.map((a) => a + '-amps-to-kw')).concat(SK.map((k) => k + '-kva-to-amps'));
    V(LT.length === 43 && want.length === 43 && want.every((s) => LT.some((m) => m.slug === s)), 'watts and amps: the 43 pages are 13 watts-to-amps, 10 amps-to-watts, 7 kW-to-amps, 5 amps-to-kW and 8 kVA-to-amps');
    const fm = (x) => Number(x.toPrecision(4)).toLocaleString('en-US', { maximumFractionDigits: 6 });
    WS.forEach((w) => { const h = PG[w + '-watts-to-amps.html'], t = txt(h), m = new RegExp('id="lt-out">([^<]*)<').exec(h);
      V(m && m[1] === fm(w / 230) + ' A' && t.indexOf(fm(w / 120) + ' A') > 0 && t.indexOf(fm(w / (S3 * 400 * 0.8)) + ' A') > 0 && t.indexOf(fm(w / 12) + ' A') > 0 && t.indexOf(fm(w / (230 * 0.9)) + ' A') > 0, w + ' watts to amps: headline and the 120 V, 400 V three-phase at 0.8, 12 V DC and 230 V at 0.9 figures equal the formulas'); });
    AS.forEach((a) => { const h = PG[a + '-amps-to-watts.html'], t = txt(h), m = new RegExp('id="lt-out">([^<]*)<').exec(h);
      V(m && m[1] === fm(a * 230) + ' W' && t.indexOf(fm(a * 120) + ' W') > 0 && t.indexOf(fm(a * S3 * 400 * 0.8) + ' W') > 0 && t.indexOf(fm(a * 12) + ' W') > 0 && t.indexOf(fm(a * 230 * 0.9) + ' W') > 0, a + ' amps to watts: headline and the 120 V, 400 V three-phase at 0.8, 12 V DC and 230 V at 0.9 figures equal the formulas'); });
    KS.forEach((k) => { const h = PG[k + '-kw-to-amps.html'], t = txt(h), m = new RegExp('id="lt-out">([^<]*)<').exec(h);
      V(m && m[1] === fm(k * 1000 / 230) + ' A' && t.indexOf(fm(k * 1000 / 120) + ' A') > 0 && t.indexOf(fm(k * 1000 / (S3 * 400 * 0.8)) + ' A') > 0 && t.indexOf(fm(k * 1000 / 12) + ' A') > 0 && t.indexOf(fm(k * 1000 / (230 * 0.9)) + ' A') > 0, k + ' kW to amps: headline and the 120 V, 400 V three-phase at 0.8, 12 V DC and 230 V at 0.9 figures equal the formulas'); });
    AK.forEach((a) => { const h = PG[a + '-amps-to-kw.html'], t = txt(h), m = new RegExp('id="lt-out">([^<]*)<').exec(h);
      V(m && m[1] === fm(a * 230 / 1000) + ' kW' && t.indexOf(fm(a * 120 / 1000) + ' kW') > 0 && t.indexOf(fm(a * S3 * 400 * 0.8 / 1000) + ' kW') > 0 && t.indexOf(fm(a * 12 / 1000) + ' kW') > 0 && t.indexOf(fm(a * 230 * 0.9 / 1000) + ' kW') > 0, a + ' amps to kW: headline and the 120 V, 400 V three-phase at 0.8, 12 V DC and 230 V at 0.9 figures equal the formulas'); });
    V(cl(A('ka', 5, 230, 1, '1ph').value, 5000 / 230) && cl(A('ak', 32, 400, 0.8, '3ph').value, S3 * 400 * 32 * 0.8 / 1000) && A('ka', 5, 230, 1, '1ph').text === '21.74 A' && A('ak', 100, 230, 1, '1ph').text === '23 kW' && cl(A('ak', A('ka', 7, 415, 0.85, '3ph').value, 415, 0.85, '3ph').value, 7, 1e-12), 'kW and amps: kW to amps and amps to kW equal the formulas and undo each other');
    SK.forEach((k) => { const h = PG[k + '-kva-to-amps.html'], t = txt(h), m = new RegExp('id="lt-out">([^<]*)<').exec(h);
      V(m && m[1] === fm(k * 1000 / (S3 * 400)) + ' A' && t.indexOf(fm(k * 1000 / (S3 * 11000)) + ' A') > 0 && t.indexOf(fm(k * 1000 / 230) + ' A') > 0 && t.indexOf(fm(k * 1000 / (S3 * 415)) + ' A') > 0 && t.indexOf(fm(k * 1000 / (S3 * 33000)) + ' A') > 0 && t.indexOf(fm(k * 1000 / 120) + ' A') > 0 && h.indexOf('id="lt-pf"') < 0, k + ' kVA to amps: headline (400 V three-phase) and the 230 V, 415 V, 11 kV, 33 kV and 120 V figures equal S x 1000 / (sqrt3 V) or S x 1000 / V, and there is no power factor box'); });
    V(cl(A('sa', 250, 400, 1, '3ph').value, 250000 / (S3 * 400)) && cl(A('sa', 25, 230, 0.1, '1ph').value, 25000 / 230) && A('sa', 250, 400, 'abc', '3ph').ok && !A('sa', 0, 400, 1, '3ph').ok && !A('sa', 250, 0, 1, '3ph').ok && A('sa', 1000, 11000, 1, '3ph').text === '52.49 A', 'kVA to amps: equals S x 1000 / (sqrt3 V), ignores the power factor, rejects zero values; 1000 kVA at 11 kV is 52.49 A');
    { const d3 = mk(['lt-x', 'lt-v', 'lt-sys', 'lt-out', 'lt-err']), e3 = d3.els; e3['lt-x'].value = '250'; e3['lt-v'].value = '400'; e3['lt-sys'].value = '3ph'; RL.ltInit('sa', d3); V(e3['lt-out'].textContent === '360.8 A', 'kVA page script: runs without a power factor box (250 kVA at 400 V is 360.8 A)'); e3['lt-sys'].value = '1ph'; e3['lt-v'].value = '230'; e3['lt-sys'].fire('change'); V(e3['lt-out'].textContent === '1,087 A', 'kVA page script: single-phase 230 V gives 1,087 A'); }
    V(LT.every((m) => { const h = PG[m.slug + '.html']; return ['lt-x', 'lt-v', 'lt-sys', 'lt-err'].concat(m.mode === 'sa' ? [] : ['lt-pf']).every((i) => h.indexOf('id="' + i + '"') > 0) && /(This is an estimate of the load current only|This is the rated current only)/.test(txt(h)) && /class="f"/.test(h); }), 'watts and amps: every page has the form, the formula and the note that sizing a cable or breaker needs more');
    V(new Set(LT.map((m) => txt(PG[m.slug + '.html']).split('What ')[1] || '')).size === 43, 'watts and amps: the "what this looks like" note is different on each of the 43 pages'); }

  /* --- Ohm's law, Kirchhoff's laws and symbols --- */
  { const rows = [[3, 4], [0.5, 100], [12, 0.25], [2.5, 48]];
    V(RB.OHM.length === 4 && rows.every(([I, R]) => { const Vv = I * R, P = Vv * I, want = [Vv, I, R, P]; return RB.OHM.every((row, i) => row[2](I, R, P, Vv).length === 3 && row[2](I, R, P, Vv).every((x) => cl(x, want[i], 1e-12))); }), "Ohm's law: all twelve forms (V, I, R and P each three ways) agree for four circuits");
    const t = txt(PG['ohms-law-formulas.html']);
    V(['V = I × R', 'V = P / I', 'V = √(P × R)', 'I = V / R', 'I = P / V', 'I = √(P / R)', 'R = V / I', 'R = V² / P', 'R = P / I²', 'P = V × I', 'P = I² × R', 'P = V² / R'].every((f) => t.indexOf(f) > 0), "Ohm's law page lists the twelve formulas");
    V(/I = V \/ R = 12 \/ 4 = 3 A/.test(t) && /P = V × I = 12 × 3 = 36 W/.test(t) && /I = P \/ V = 60 \/ 230 = 0\.2609 A/.test(t) && /R = V² \/ P = 52,900 \/ 60 = 881\.7 Ω/.test(t) && cl(230 * 230 / 60, 881.6667, 1e-6) && /0\.012 A 0\.144 W/.test(t) && /1 Ω 12 A 144 W/.test(t), "Ohm's law page: the 12 V across 4 ohm and 60 W on 230 V examples and the 12 V table match the formulas");
    const k = txt(PG['kirchhoffs-laws.html']);
    V(/5 \+ 3 = 2 \+ I, so I = 6 A/.test(k) && /I = V \/ \(R1 \+ R2\) = 12 \/ 320 = 0\.0375 A/.test(k) && /V1 = I × R1 = 3\.75 V and V2 = I × R2 = 8\.25 V/.test(k) && /3\.75 \+ 8\.25 = 12 V/.test(k) && /I1 = 12 \/ 100 = 0\.12 A and I2 = 12 \/ 220 = 0\.05455 A/.test(k) && /0\.1745 A/.test(k) && /Equivalent resistance = 12 \/ 0\.1745 = 68\.75 Ω/.test(k) && cl(100 * 220 / 320, 68.75, 1e-12), "Kirchhoff page: the node, series-loop and parallel examples equal hand calculation (6 A, 3.75 V + 8.25 V = 12 V, 0.12 A + 0.05455 A, 68.75 ohm)");
    const sy = PG['electrical-symbols.html'], svgs = sy.match(/<svg [^>]*>/g) || [];
    V(RB.SYMBOLS.length === 19 && svgs.length === 19 && svgs.every((s) => /role="img"/.test(s) && /aria-label="[^"]+ symbol"/.test(s) && /viewBox="0 0 64 40"/.test(s)) && RB.SYMBOLS.every((s) => sy.indexOf('aria-label="' + s[0] + ' symbol"') > 0) && new Set(RB.SYMBOLS.map((s) => s[2])).size === 19, 'symbols page: 19 distinct drawings, each an image with a name label');
    const st = txt(sy);
    V([['Voltage', 'V', 'volt', 'V'], ['Resistance', 'R', 'ohm', 'Ω'], ['Capacitance', 'C', 'farad', 'F'], ['Inductance', 'L', 'henry', 'H'], ['Frequency', 'f', 'hertz', 'Hz'], ['Real power', 'P', 'watt', 'W'], ['Magnetic flux density', 'B', 'tesla', 'T'], ['Charge', 'Q', 'coulomb', 'C']].every((q) => RB.QUANTITIES.some((r) => r.join('|') === q.join('|')) && st.indexOf(q[0] + ' ' + q[1] + ' ' + q[2] + ' ' + q[3]) > 0), 'symbols page: eight quantities (voltage, resistance, capacitance, inductance, frequency, power, flux density, charge) have the standard letter, unit and unit symbol'); }

  /* --- links, hub and wiring --- */
  { const ids = MT.filter((m) => m.kind === 'reference' || m.kind === 'example').map((m) => m.slug), hub = PG['index.html'];
    V(ids.length === 201 && ids.every((s) => hub.indexOf('href="' + s + '.html"') > 0), 'hub links to all 158 reference pages and all 43 worked-example pages');
    V(ids.every((s) => { const inbound = Object.keys(PG).filter((f) => f !== s + '.html' && PG[f].indexOf('href="' + s + '.html"') > 0).length; return inbound >= 2; }), 'every reference and example page has at least two inbound links from other converter pages');
    V(['resistor-color-code', 'ohms-law-formulas', 'coulombs-law', 'kirchhoffs-laws', 'electrical-symbols'].every((s) => plain.pages['index.html'].indexOf('converters/' + s + '.html') > 0), 'the conversions hub in pages/ links to the five reference pages');
    V(ids.every((s) => !/https?:\/\/|xmlns/.test(PG[s + '.html'].replace(/<meta[^>]*>|<link[^>]*>|<style>[\s\S]*?<\/style>/g, ''))), 'no reference or example page loads anything from another host (no http links, no xmlns)'); }
  /* v1.14.0 formula articles: every worked-example figure is written again here from the textbook formula (different expressions from the generator) */
  { const g4 = RB.g4, T = (slug) => txt(PG[slug + '.html']), has = (slug, str) => T(slug).indexOf(str) >= 0, r3 = Math.sqrt(3);
    const S = r3 * 400 * 50 / 1000, P = S * 0.85, Q = Math.sqrt(S * S - P * P), I75 = 75e3 / (r3 * 415 * 0.9);
    V(has('three-phase-power-formulas', g4(S) + ' kVA') && has('three-phase-power-formulas', g4(P) + ' kW') && has('three-phase-power-formulas', g4(Q) + ' kVAR') && has('three-phase-power-formulas', g4(I75) + ' A'), 'three-phase article: 400 V, 50 A, pf 0.85 gives 34.64 kVA, 29.44 kW, 18.25 kVAR; 75 kW at 415 V, pf 0.9 gives 115.9 A');
    V(Math.abs(S - 34.641) < 0.001 && Math.abs(I75 - 115.93) < 0.01, 'three-phase article: the expected values themselves are the published figures (34.641 kVA, 115.93 A)');
    const tn = (pf) => Math.sqrt(1 / (pf * pf) - 1), Qc = 100 * (tn(0.8) - tn(0.95));
    V(has('power-factor-formulas', g4(Qc) + ' kVAR') && Math.abs(Qc - 42.13) < 0.01 && has('power-factor-formulas', g4(tn(0.6) - tn(0.95))) && has('power-factor-formulas', g4(tn(0.9) - tn(1))), 'power factor article: 100 kW from 0.8 to 0.95 needs 42.13 kVAR; table multipliers match tan-based values');
    const XL = 10 * Math.PI, XC = 1 / (2 * Math.PI * 50 * 1e-4), Z = Math.hypot(10, XL - XC), f0 = 1 / (2 * Math.PI * Math.sqrt(0.1 * 1e-4));
    V(has('ac-circuit-formulas', g4(XL) + ' Ω') && has('ac-circuit-formulas', g4(XC) + ' Ω') && has('ac-circuit-formulas', g4(Z) + ' Ω') && has('ac-circuit-formulas', g4(f0) + ' Hz') && Math.abs(XL - 31.416) < 0.001 && Math.abs(f0 - 50.329) < 0.001, 'AC article: 100 mH and 100 µF at 50 Hz give XL 31.42 Ω, XC 31.83 Ω, Z 10.01 Ω and resonance at 50.33 Hz');
    const per = 1.15 * 0.85 + 0.08 * Math.sqrt(1 - 0.85 * 0.85), Vd3 = r3 * 50 * 0.1 * per, Vd1 = 2 * 50 * 0.1 * per;
    V(has('voltage-drop-formulas', g4(Vd3) + ' V') && has('voltage-drop-formulas', g4(Vd3 / 4) + '%') && has('voltage-drop-formulas', g4(Vd1) + ' V') && Math.abs(Vd3 - 8.830) < 0.001, 'voltage drop article: 50 A over 100 m, R 1.15 and X 0.08 ohm/km, pf 0.85 gives 8.830 V (2.208%) three-phase and 10.20 V single-phase');
    const Is = 1e6 / (r3 * 415), Ip = 1e6 / (r3 * 11000), Isc = Is / 0.05;
    V(has('transformer-formulas', g4(Is) + ' A') && has('transformer-formulas', g4(Ip) + ' A') && has('transformer-formulas', g4(Isc / 1000) + ' kA') && has('transformer-formulas', g4(11000 / 415)) && Math.abs(Is - 1391.2) < 0.1 && Math.abs(Isc - 27824) < 1, 'transformer article: 1,000 kVA, 11 kV / 415 V, Z 5% gives 1,391 A, 52.49 A, ratio 26.51 and 27.82 kA');
    const Ns = 120 * 50 / 4, slip = 100 * (1 - 1480 / Ns), Tq = 60 * 55e3 / (2 * Math.PI * 1480), Im = 55e3 / (0.93 * r3 * 415 * 0.88);
    V(Ns === 1500 && has('motor-formulas', g4(Ns) + ' rpm') && has('motor-formulas', g4(slip) + '%') && has('motor-formulas', g4(Tq) + ' N·m') && has('motor-formulas', g4(Im) + ' A') && Math.abs(Tq - 354.9) < 0.1 && Math.abs(Im - 93.50) < 0.01, 'motor article: 55 kW, 4 poles, 1,480 rpm, 415 V gives 1,500 rpm, slip 1.333%, 354.9 N·m and 93.50 A; torque by 60P/(2πN) agrees with 9548.8P/N');
    const E5 = 1000 / 25, N = 300 * 30 / (3000 * 0.6 * 0.8);
    V(has('lighting-formulas', g4(E5) + ' lx') && has('lighting-formulas', g4(N)) && has('lighting-formulas', 'Round up to ' + Math.ceil(N) + ' luminaires') && E5 === 40 && Math.ceil(N) === 7, 'lighting article: 1,000 cd at 5 m is 40 lx; a 30 m² room at 300 lx with 3,000 lm, UF 0.6, MF 0.8 needs 6.25, so 7 luminaires');
    /* v1.15.0 articles: expected values written again from the textbook form, in a different arrangement from the generator */
    const AhB = (2000 * 5) / (48 * 0.8 * 0.9), EbK = 2 * 5 / 0.72, runB = 48 * 300 * 0.72 / 2000;
    V(has('battery-formulas', g4(EbK) + ' kWh') && has('battery-formulas', g4(AhB) + ' Ah') && has('battery-formulas', g4(runB) + ' hours') && Math.abs(EbK - 13.889) < 0.001 && Math.abs(AhB - 289.35) < 0.01 && Math.abs(runB - 5.184) < 1e-9, 'battery article: 2 kW for 5 h at 48 V, DoD 0.8, efficiency 0.9 needs 13.89 kWh and 289.4 Ah; 300 Ah gives 5.184 h');
    const kWpS = 10 / 3.75, VcS = 49.5 * 1.084, annS = 2.75 * 5 * 0.75 * 365;
    V(has('solar-pv-formulas', g4(kWpS) + ' kWp') && has('solar-pv-formulas', '= 5 modules') && has('solar-pv-formulas', g4(VcS) + ' V') && has('solar-pv-formulas', '= 18 modules in series') && has('solar-pv-formulas', g4(annS) + ' kWh a year') && Math.ceil(2666.667 / 550) === 5 && Math.floor(1000 / VcS) === 18 && Math.abs(VcS - 53.658) < 1e-9, 'solar article: 10 kWh a day at 5 PSH and PR 0.75 needs 2.667 kWp, 5 modules of 550 W and 3,764 kWh a year; cold Voc 53.66 V gives 18 modules per 1,000 V string');
    const QcC = 24 * 470e-6 * 1000, EcC = 470e-6 * 24 * 24 / 2, tauC = 10e3 * 100e-6, vC = 12 - 12 * Math.exp(-2 / tauC);
    V(has('capacitor-formulas', g4(QcC) + ' mC') && has('capacitor-formulas', g4(EcC) + ' J') && has('capacitor-formulas', '= 8 µF') && has('capacitor-formulas', '= 50 µF') && has('capacitor-formulas', g4(vC) + ' V') && has('capacitor-formulas', g4(100 - 100 * Math.exp(-3)) + ' %') && Math.abs(QcC - 11.28) < 1e-9 && Math.abs(EcC - 0.13536) < 1e-9 && Math.abs(vC - 10.376) < 0.001 && Math.abs(100 - 100 * Math.exp(-3) - 95.021) < 0.001, 'capacitor article: 470 µF at 24 V holds 11.28 mC and 0.1354 J; 10 µF and 40 µF give 8 µF in series and 50 µF in parallel; 10 kΩ and 100 µF reach 10.38 V of 12 V in 2 s; 3 τ is 95.02%');
    const rodE = (rho, l) => rho / (2 * Math.PI * l) * (Math.log(4 * l / 0.008) - 1), RE = rodE(100, 3);
    V(has('earthing-formulas', g4(RE) + ' Ω') && has('earthing-formulas', g4(RE / 3.4) + ' Ω') && has('earthing-formulas', '287.5 A') && has('earthing-formulas', g4(230 / 160) + ' Ω') && Math.abs(RE - 33.493) < 0.001 && Math.abs(RE / 3.4 - 9.851) < 0.001 && has('earthing-formulas', g4(rodE(50, 1.2)) + ' Ω') && has('earthing-formulas', g4(rodE(200, 6)) + ' Ω'), 'earthing article: a 3 m, 16 mm rod in 100 Ω·m soil is 33.49 Ω (written with the radius form ln(4L/a)); four rods at 0.85 give 9.851 Ω; Zs 0.8 Ω gives 287.5 A; a 160 A trip needs Zs of 1.438 Ω or less');
    const ItC = 63 / 0.696, RC20 = 17.241 * 100 / 16 / 1000, RC70 = RC20 * 1.1965, RC90 = RC20 * 1.2751, SxC = 10000 * Math.sqrt(0.2) / 143, SpC = 10000 * Math.sqrt(0.2) / 115;
    V(has('cable-sizing-formulas', g4(ItC) + ' A') && has('cable-sizing-formulas', g4(RC20) + ' Ω') && has('cable-sizing-formulas', g4(RC70) + ' Ω') && has('cable-sizing-formulas', g4(RC90) + ' Ω') && has('cable-sizing-formulas', g4(SxC) + ' mm², so use 35 mm²') && has('cable-sizing-formulas', g4(SpC) + ' mm², so use 50 mm²') && Math.abs(ItC - 90.517) < 0.001 && Math.abs(SxC - 31.274) < 0.001 && Math.abs(SpC - 38.888) < 0.001, 'cable sizing article: 63 A with factors 0.87 and 0.80 needs 90.52 A; 100 m of 16 mm² copper is 0.1078 Ω at 20 °C; 10 kA for 0.2 s needs 31.27 mm² (XLPE, so 35) or 38.89 mm² (PVC, so 50)');
    const EnE = 7.5 * 8 * 26, EnS = 100 * 0.09 * 10 * 365, EnC = EnS / 10, EnP = 4000 / EnC;
    V(has('energy-cost-formulas', g4(EnE) + ' kWh') && has('energy-cost-formulas', g4(EnE / 10)) && has('energy-cost-formulas', g4(EnS) + ' kWh a year') && has('energy-cost-formulas', g4(EnP) + ' years') && EnE === 1560 && EnS === 32850 && Math.abs(EnP - 1.2177) < 0.001 && has('energy-cost-formulas', g4(10 * 12 * 365) + ' kWh'), 'energy article: 7.5 kW for 8 h on 26 days is 1,560 kWh; 100 fittings from 150 W to 60 W save 32,850 kWh a year and pay back in 1.218 years');
    /* v1.16.0 articles: expected values written again in a different arrangement */
    const r3b = Math.sqrt(3), SgG = 120 / 0.8, IgG = 150e3 / (r3b * 415), LhG = 100 * 220 / 840;
    V(has('generator-formulas', g4(SgG) + ' kVA') && has('generator-formulas', g4(IgG) + ' A') && has('generator-formulas', g4(LhG) + ' L/h') && has('generator-formulas', g4(450 / LhG) + ' hours') && SgG === 150 && Math.abs(IgG - 208.69) < 0.01 && Math.abs(LhG - 26.190) < 0.001, 'generator article: 120 kW at pf 0.8 is 150 kVA and 208.7 A at 415 V; 100 kW at 220 g/kWh and 840 g/L uses 26.19 L/h, so 450 L lasts 17.18 h');
    const SuU = 30 / 0.9, IdU = 30000 / (0.94 * 240), EuU = 30 * 0.25 / 0.94;
    V(has('ups-formulas', g4(SuU) + ' kVA') && has('ups-formulas', g4(SuU * 1.25) + ' kVA') && has('ups-formulas', g4(IdU) + ' A') && has('ups-formulas', g4(EuU) + ' kWh') && Math.abs(SuU - 33.333) < 0.001 && Math.abs(IdU - 132.98) < 0.01 && Math.abs(EuU - 7.9787) < 0.001, 'UPS article: 30 kW at pf 0.9 is 33.33 kVA, 41.67 kVA with 25% growth; 132.98 A from a 240 V battery at 94%; 7.979 kWh for 15 min');
    const thdH = Math.hypot(30, 20, 10) / 100, irH = Math.hypot(100, 30, 20, 10), tpH = 0.95 * 100 / irH;
    V(has('harmonics-formulas', g4(thdH * 100) + '%') && has('harmonics-formulas', g4(irH) + ' A') && has('harmonics-formulas', g4(tpH)) && has('harmonics-formulas', g4(Math.sqrt(50)) + ', close to the 7th') && has('harmonics-formulas', g4(50 / Math.sqrt(0.07)) + ' Hz') && Math.abs(thdH - 0.37417) < 1e-5 && Math.abs(irH - 106.77) < 0.01 && Math.abs(tpH - 0.88980) < 1e-4, 'harmonics article: 30, 20, 10 A harmonics on 100 A give THD 37.42%, 106.8 A rms, true pf 0.8898; 400 kVAR on 20 MVA resonates near h 7.07; a 7% reactor tunes to 189 Hz');
    const Mt = 1 / 0.05, Mk = Mt * 250 / (Mt + 250), IscK = Mk * 1e6 / (r3b * 415), ipK = 1.8 * Math.sqrt(2) * IscK;
    V(has('short-circuit-formulas', g4(Mk) + ' MVA') && has('short-circuit-formulas', g4(IscK / 1000) + ' kA') && has('short-circuit-formulas', g4(ipK / 1000) + ' kA') && has('short-circuit-formulas', g4(415 / (r3b * 0.02) / 1000) + ' kA') && Math.abs(Mk - 18.519) < 0.001 && Math.abs(IscK - 25763) < 2 && Math.abs(ipK - 65584) < 5, 'short-circuit article: 1 MVA, 5% on a 250 MVA source is 18.52 MVA, 25.76 kA at 415 V and 65.58 kA peak with kappa 1.8; 0.02 ohm gives 11.98 kA');
    const vAvg = 1206 / 3, vUn = 8 / vAvg * 100, nI = Math.sqrt(10000 + 6400 + 3600 - 8000 - 4800 - 6000), nI2 = Math.abs(100 + 80 * Math.cos(-2 * Math.PI / 3) + 60 * Math.cos(2 * Math.PI / 3));
    const nIim = Math.abs(80 * Math.sin(-2 * Math.PI / 3) + 60 * Math.sin(2 * Math.PI / 3)), nIc = Math.hypot(nI2, nIim);
    V(has('unbalance-formulas', g4(vAvg) + ' V') && has('unbalance-formulas', g4(vUn) + '%') && has('unbalance-formulas', g4(nI) + ' A') && Math.abs(nIc - nI) < 1e-9 && Math.abs(vUn - 1.9900) < 1e-3 && Math.abs(nI - 34.641) < 1e-3 && has('unbalance-formulas', '100 A'), 'unbalance article: 400, 410, 396 V is 1.990% unbalance (largest deviation 8 V from 402 V); currents 100, 80, 60 A give 34.64 A in the neutral (checked against the phasor sum)');
    const rP = 100 * 220 / 320, vD = 12 * 4.7 / 14.7;
    V(has('resistor-formulas', '650 Ω') && has('resistor-formulas', g4(rP) + ' Ω') && Math.abs(rP - 68.75) < 1e-9 && has('resistor-formulas', g4(vD) + ' V') && has('resistor-formulas', g4(vD * vD / 4.7) + ' mW') && Math.abs(vD - 3.8367) < 1e-3, 'resistor article: 100+220+330 is 650 ohm; 100 and 220 in parallel is 68.75 ohm; 12 V across 10 k and 4.7 k gives 3.837 V and 3.13 mW');
    /* v1.17.0 articles: expected values written again in a different arrangement */
    const r3c = Math.sqrt(3), IflM = 55e3 / (0.93 * r3c * 415 * 0.88), IstM = 6 * IflM, SstM = r3c * 415 * IstM / 1000, SscM = 20000 * 250000 / 270000;
    V(has('motor-starting-formulas', g4(IstM) + ' A') && has('motor-starting-formulas', g4(IstM / 3) + ' A') && has('motor-starting-formulas', g4(0.4225 * IstM) + ' A') && has('motor-starting-formulas', g4(3 * IflM) + ' A') && has('motor-starting-formulas', g4(SstM) + ' kVA') && has('motor-starting-formulas', g4(SstM / SscM * 100) + '%') && Math.abs(IstM - 561.0) < 0.1 && Math.abs(SstM / SscM * 100 - 2.178) < 0.001, 'motor starting article: 55 kW at 415 V, ratio 6 gives 561 A direct, 187 A star-delta, 237 A at a 65% tap, 403.3 kVA and a 2.178% dip on an 18.52 MVA supply');
    V(has('circuit-breaker-formulas', g4(1.45 * 63) + ' A') && has('circuit-breaker-formulas', g4(1.45 * 72) + ' A') && has('circuit-breaker-formulas', 'Type B trips between 96 A and 160 A') && has('circuit-breaker-formulas', 'Type C trips between 160 A and 320 A') && has('circuit-breaker-formulas', 'Type D trips between 320 A and 640 A') && has('circuit-breaker-formulas', '48 to 80 A') && has('circuit-breaker-formulas', '630 to 1,260 A'), 'circuit breaker article: 63 A gives I2 91.35 A against 104.4 A; a 32 A breaker trips at 96 to 160 A (B), 160 to 320 A (C), 320 to 640 A (D); 63 A type D is 630 to 1,260 A');
    const VsK = 5000 / (1.2 * 1005 * 10), VhK = 5000 * 3600 / (1.2 * 1005 * 10), dTK = 3000 * 3600 / (1.2 * 1005 * 1000);
    V(has('cooling-formulas', g4(VsK) + ' m³/s') && has('cooling-formulas', g4(VhK) + ' m³/h') && has('cooling-formulas', g4(VhK * 0.588578) + ' CFM') && has('cooling-formulas', g4(5000 * 3.412142) + ' BTU/h') && has('cooling-formulas', g4(dTK) + ' K') && Math.abs(VsK - 0.4146) < 1e-4 && Math.abs(dTK - 8.955) < 1e-3, 'cooling article: 5 kW at a 10 K rise needs 0.4146 m³/s (1,493 m³/h, 878.5 CFM) and is 17,060 BTU/h; 3 kW in 1,000 m³/h rises 8.955 K');
    const EkW = 200 * 4186 * 45 / 3.6e6, PkW = EkW / 1.8;
    V(has('heating-formulas', g4(EkW) + ' kWh') && has('heating-formulas', g4(PkW) + ' kW') && Math.abs(EkW - 10.465) < 1e-9 && Math.abs(PkW - 5.8139) < 1e-4 && has('heating-formulas', g4(100 * 4186 * 10 / 3.6e6) + ' kWh'), 'heating article: 200 L from 15 to 60 °C needs 10.465 kWh and a 5.814 kW heater in 2 h at 90%; 100 L by 10 K is 1.163 kWh');
    const IbP = 10000 / (r3c * 11), ZbP = 11 * 11 / 10;
    V(has('per-unit-formulas', g4(IbP) + ' A') && has('per-unit-formulas', g4(ZbP) + ' Ω') && has('per-unit-formulas', g4(0.5 / ZbP) + ' pu') && has('per-unit-formulas', '= 0.5 pu, which is 50%') && Math.abs(IbP - 524.86) < 0.01 && has('per-unit-formulas', g4(0.415 * 0.415 / 10) + ' Ω'), 'per-unit article: 10 MVA at 11 kV gives 524.9 A and 12.1 ohm; 0.5 ohm is 0.04132 pu; 5% on 1 MVA is 50% on 10 MVA');
    const RL = 8.8 / 0.02, RLs = 470, IaL = 8.8 / RLs;
    V(has('led-formulas', '= 440 Ω') && has('led-formulas', 'is 470 Ω') && has('led-formulas', g4(IaL * 1000) + ' mA') && has('led-formulas', g4(77.44 / 470 * 1000) + ' mW') && has('led-formulas', g4(3.2 * IaL * 1000) + ' mW') && has('led-formulas', '= 120 Ω') && Math.abs(RL - 440) < 1e-9 && Math.abs(IaL * 1000 - 18.723) < 1e-3, 'LED article: 12 V, 3.2 V, 20 mA needs 440 ohm, so 470 ohm (E12) gives 18.72 mA and 164.8 mW in the resistor; three LEDs in series need 120 ohm');
    /* v1.18.0 articles: expected values written again in a different arrangement */
    const fillC = 3 * 25 / 400 * 100, DminC = 10 * Math.sqrt(3 / 0.4);
    V(has('conduit-fill-formulas', g4(Math.PI * 25 * 3) + ' mm²') && has('conduit-fill-formulas', g4(fillC) + '%') && has('conduit-fill-formulas', g4(DminC) + ' mm inside diameter') && fillC === 18.75 && Math.abs(DminC - 27.386) < 1e-3, 'conduit article: three 10 mm cables in a 40 mm conduit fill 18.75%, and at a 40% limit the conduit needs 27.39 mm inside');
    const r0L = Math.sqrt(45 * 45 - 35 * 35), rxL = r0L - Math.sqrt(45 * 45 - 41 * 41);
    V(has('lightning-protection-formulas', g4(r0L) + ' m at ground level') && has('lightning-protection-formulas', g4(rxL) + ' m protected radius at 4 m height') && Math.abs(r0L - 28.284) < 1e-3 && Math.abs(rxL - 9.737) < 1e-3, 'lightning article: a 10 m rod with R = 45 m protects 28.28 m at ground level and 9.737 m at 4 m height');
    const effF = 1 - 12.2 / 812.2, xT = Math.sqrt(1.7 / 10.5), effM = 1 - (1.7 + xT * xT * 10.5) / (xT * 800 + 1.7 + xT * xT * 10.5), regT = 1.05 * 0.8 + Math.sqrt(25 - 1.05 * 1.05) * 0.6;
    V(has('transformer-efficiency-formulas', g4(effF * 100) + '%') && has('transformer-efficiency-formulas', g4(xT) + ' of full load') && has('transformer-efficiency-formulas', g4(effM * 100) + '%') && has('transformer-efficiency-formulas', g4(regT) + '%') && Math.abs(effF * 100 - 98.498) < 1e-3 && Math.abs(xT - 0.40237) < 1e-4 && Math.abs(regT - 3.7731) < 1e-3, 'transformer efficiency article: 1,000 kVA at pf 0.8 is 98.50% at full load, best at 0.4024 of load, with 3.773% regulation');
    const PhP = 9806.65 * 50 / 3600 * 30 / 1000, PinP = PhP / 0.63;
    V(has('pump-formulas', g4(PhP) + ' kW') && has('pump-formulas', g4(PinP) + ' kW electrical input') && Math.abs(PhP - 4.0861) < 1e-3 && Math.abs(PinP - 6.4859) < 1e-3, 'pump article: 50 m3/h at 30 m head is 4.086 kW hydraulic and 6.486 kW electrical at 70% and 90%');
    const PsF = 2 * 800 / 1000 / 0.65, P2F = PsF * Math.pow(40 / 50, 3);
    V(has('fan-formulas', g4(PsF) + ' kW') && has('fan-formulas', g4(P2F) + ' kW') && has('fan-formulas', g4(800 * 0.64) + ' Pa') && Math.abs(PsF - 2.4615) < 1e-4 && Math.abs(P2F - 1.2603) < 1e-4, 'fan article: 2 m3/s at 800 Pa and 65% needs 2.462 kW, and at 80% speed 512 Pa and 1.260 kW');
    const tauI = 0.1 / 20, iI = 24 / 20 * (1 - Math.exp(-2));
    V(has('inductor-formulas', g4(0.5 * 0.5 * 16) + ' J') && has('inductor-formulas', g4(tauI * 1000) + ' ms') && has('inductor-formulas', g4(iI) + ' A') && Math.abs(iI - 1.0376) < 1e-4 && cl(tauI, 0.005), 'inductor article: 0.5 H at 4 A holds 4 J; 100 mH with 20 ohm has tau 5 ms and 1.038 A after 10 ms on 24 V');
    /* v1.19.0 articles: expected values written again in a different arrangement */
    const VpW = Math.sqrt(2 * 230 * 230), VavW = 0.63662 * VpW;
    V(has('rms-waveform-formulas', g4(VpW) + ' V') && has('rms-waveform-formulas', g4(2 * VpW) + ' V') && has('rms-waveform-formulas', g4(VavW) + ' V') && has('rms-waveform-formulas', g4(100 / Math.sqrt(3)) + ' V') && Math.abs(VpW - 325.27) < 0.01 && Math.abs(VavW - 207.08) < 0.01, 'RMS article: 230 V rms is 325.3 V peak, 650.5 V peak-to-peak and 207.1 V half-cycle average; a 100 V triangle is 57.74 V rms');
    const f0R = 159.1549, XLR = Math.sqrt(0.01 / 1e-4), QR = XLR / 5;
    V(has('resonance-formulas', g4(f0R) + ' Hz') && has('resonance-formulas', g4(XLR) + ' Ω') && has('resonance-formulas', 'Q = ' + g4(XLR) + ' / 5 = ' + g4(QR)) && has('resonance-formulas', g4(f0R / QR) + ' Hz') && XLR === 10 && QR === 2, 'resonance article: 10 mH and 100 uF resonate at 159.2 Hz, reactance 10 ohm, Q = 2 with 5 ohm, bandwidth 79.58 Hz');
    const iM1 = 55 / 0.91, iM2 = 55 / 0.94, dPM = iM1 - iM2, dEM = dPM * 6000;
    V(has('motor-efficiency-formulas', g4(iM1) + ' kW') && has('motor-efficiency-formulas', g4(iM2) + ' kW') && has('motor-efficiency-formulas', g4(dPM) + ' kW') && has('motor-efficiency-formulas', g4(dEM) + ' kWh') && has('motor-efficiency-formulas', g4(dEM * 8)) && Math.abs(dPM - 1.9289) < 1e-3, 'motor efficiency article: 55 kW at 91% against 94% saves 1.929 kW, 11,570 kWh a year');
    V(has('demand-load-factor-formulas', '= 350 kW') && has('demand-load-factor-formulas', g4(168000 / 720) + ' kW') && has('demand-load-factor-formulas', '= ' + g4(233.3333 / 350)) && has('demand-load-factor-formulas', '420 / 350 = 1.2') && Math.abs(233.3333 / 350 - 0.66667) < 1e-4, 'demand article: 500 kW at 0.7 is 350 kW; 168,000 kWh in 720 h is 233.3 kW, load factor 0.6667 and diversity factor 1.2');
    const aT = 100 * Math.PI, nT = Math.floor(0.4 * 15000 / aT);
    V(has('cable-tray-fill-formulas', g4(12 * aT) + ' mm²') && has('cable-tray-fill-formulas', g4(12 * aT / 150) + '%') && has('cable-tray-fill-formulas', '= ' + nT + ' cables') && nT === 19 && Math.abs(12 * aT / 150 - 25.133) < 1e-3, 'cable tray article: twelve 20 mm cables on a 300 x 50 mm tray fill 25.13%, and 19 fit at a 40% limit');
    const R20C = 1.72e-8 * 100 / 2.5e-6, R70C = 0.688 * 1.1965;
    V(has('conductor-resistance-formulas', g4(R20C) + ' Ω') && has('conductor-resistance-formulas', g4(R70C) + ' Ω') && has('conductor-resistance-formulas', g4(1.128) + ' Ω') && has('conductor-resistance-formulas', g4(2.82 / 1.72) + ' times the area') && Math.abs(R70C - 0.82319) < 1e-4, 'conductor resistance article: 100 m of 2.5 mm2 copper is 0.688 ohm at 20 C and 0.8232 ohm at 70 C; aluminium needs 1.64 times the area');
    /* v1.20.0 articles: expected values written again in a different arrangement */
    const dVL = Math.sqrt(3) * 100 * (0.45 + 0.8 * Math.sqrt(0.19)), PL = Math.sqrt(3) * 11000 * 100 * 0.9 / 1000;
    V(has('transmission-line-formulas', g4(dVL / Math.sqrt(3)) + ' V') && has('transmission-line-formulas', g4(dVL) + ' V') && has('transmission-line-formulas', g4(dVL / 110) + '% of 11 kV') && has('transmission-line-formulas', g4(PL) + ' kW') && has('transmission-line-formulas', '= 15 kW') && has('transmission-line-formulas', g4(PL / (PL + 15) * 100) + '%') && Math.abs(dVL - 138.34) < 0.01 && Math.abs(PL - 1714.73) < 0.01, 'transmission line article: 100 A at pf 0.9 on an 11 kV line with 0.5 + j0.8 ohm drops 138.3 V (1.258%), loses 15 kW and is 99.13% efficient');
    const sdR = [30 * 90 / 180, 30 * 60 / 180, 60 * 90 / 180], sdZ = sdR[0] * sdR[1] + sdR[1] * sdR[2] + sdR[2] * sdR[0];
    V(has('star-delta-formulas', '= 15 Ω') && has('star-delta-formulas', '= 10 Ω') && has('star-delta-formulas', '= 30 Ω') && cl(sdZ / sdR[2], 30) && cl(sdZ / sdR[0], 60) && cl(sdZ / sdR[1], 90) && has('star-delta-formulas', g4(sdZ) + ', so R12 = ' + g4(sdZ) + ' / 30 = 30 Ω'), 'star-delta article: delta 30, 60, 90 ohm gives star 15, 10, 30 ohm, and the star converts back to the same delta');
    const iL = 4 + 16 * 0.65, pvL = (12 - 4) / 16 * 10;
    V(has('loop-4-20ma-formulas', g4(iL) + ' mA') && has('loop-4-20ma-formulas', g4(pvL) + ' bar') && has('loop-4-20ma-formulas', g4(iL * 250 / 1000) + ' V') && has('loop-4-20ma-formulas', '= 600 Ω') && has('loop-4-20ma-formulas', '350 Ω') && Math.abs(iL - 14.4) < 1e-12 && pvL === 5, '4-20 mA article: 6.5 bar of 0 to 10 bar is 14.4 mA and 3.6 V across 250 ohm; 12 mA is 5 bar; 24 V and 12 V leave 350 ohm of wire');
    const RcL = 0.688 * 200 / 1000, PcL = 3 * 100 * 100 * RcL;
    V(has('cable-loss-formulas', g4(RcL) + ' Ω') && has('cable-loss-formulas', g4(PcL) + ' W') && has('cable-loss-formulas', g4(PcL * 4) + ' kWh') && has('cable-loss-formulas', g4(PcL * 4 * 8)) && Math.abs(PcL - 4128) < 1e-6, 'cable loss article: 200 m of 0.688 ohm/km at 100 A three-phase loses 4,128 W, 16,510 kWh over 4,000 h');
    V(has('op-amp-formulas', '= −10') && has('op-amp-formulas', '= −5 V') && has('op-amp-formulas', '= 5.7') && has('op-amp-formulas', '= 2.85 V') && Math.abs(-100 / 10 * 0.5 + 5) < 1e-12 && Math.abs((1 + 47 / 10) * 0.5 - 2.85) < 1e-12, 'op-amp article: Rf 100k and Rin 10k gives -10 and -5 V for 0.5 V; Rf 47k and Rg 10k gives 5.7 and 2.85 V');
    const T5 = Math.log(2) * 21000 * 1e-5, f5 = 1 / T5;
    V(has('555-timer-formulas', g4(f5) + ' Hz') && has('555-timer-formulas', g4(Math.log(2) * 11000 * 1e-5 * 1000) + ' ms') && has('555-timer-formulas', g4(Math.log(2) * 10000 * 1e-5 * 1000) + ' ms') && has('555-timer-formulas', g4(11 / 21 * 100) + '%') && has('555-timer-formulas', '= 1.1 s') && Math.abs(f5 - 6.8707) < 1e-3 && Math.abs(1.1 * 10e3 * 100e-6 - 1.1) < 1e-12, '555 article: R1 1k, R2 10k, C 10 uF gives 6.871 Hz and 52.38% duty; monostable 10k and 100 uF gives 1.1 s');
    /* v1.21.0 articles: expected values written again in a different arrangement */
    const itT = 24 / (100 + 200 * 100 / 300), ilT = itT * 200 / 300;
    V(has('thevenin-norton-formulas', '= 16 V') && has('thevenin-norton-formulas', g4(200 / 3) + ' Ω') && has('thevenin-norton-formulas', '= 0.24 A') && has('thevenin-norton-formulas', g4(ilT) + ' A') && has('thevenin-norton-formulas', g4(ilT * 100) + ' V') && has('thevenin-norton-formulas', g4(256 / (4 * 200 / 3)) + ' W') && Math.abs(ilT - 0.096) < 1e-12, 'Thevenin article: 24 V with 100 and 200 ohm gives 16 V and 66.67 ohm, 0.24 A Norton, 0.096 A and 9.6 V in a 100 ohm load, 0.96 W at the matched load (load current also found by solving the whole circuit)');
    const vrW = 10 * 700 / 1030, dVW = vrW - 10 * 2000 / 3000, VqW = 5 * 0.7 / (2 * 700.7);
    V(has('wheatstone-bridge-formulas', '= 660 Ω') && has('wheatstone-bridge-formulas', g4(vrW) + ' V') && has('wheatstone-bridge-formulas', g4(dVW) + ' V') && has('wheatstone-bridge-formulas', '= 0.7 Ω') && has('wheatstone-bridge-formulas', '= 2.5 mV') && has('wheatstone-bridge-formulas', g4(VqW * 1000) + ' mV') && Math.abs(dVW - 0.12945) < 1e-4 && Math.abs(VqW * 1000 - 2.4975) < 1e-4, 'Wheatstone article: 1k, 2k, 330 ohm balances at 660 ohm; Rx 700 ohm on 10 V gives 0.1294 V; a 350 ohm gauge at 1,000 microstrain gives 2.5 mV (2.498 mV exactly)');
    const fCF = 2e-7 * 20000 * 20000 / 0.1;
    V(has('conductor-force-formulas', g4(fCF) + ' N/m') && has('conductor-force-formulas', g4(fCF * 2) + ' N') && has('conductor-force-formulas', g4(fCF * 2 / 9.80665) + ' kgf') && Math.abs(fCF - 800) < 1e-9, 'conductor force article: two conductors with 20 kA at 0.1 m spacing feel 800 N/m, 1,600 N on 2 m');
    const RlC = 1.72e-8 * 100 / 2.5e-6, burC = 25 * (RlC + 0.08);
    V(has('ct-burden-formulas', g4(RlC) + ' Ω') && has('ct-burden-formulas', g4(RlC + 0.08) + ' Ω') && has('ct-burden-formulas', g4(burC) + ' VA') && has('ct-burden-formulas', g4(RlC + 0.08) + ' VA') && has('ct-burden-formulas', '= 256 A') && Math.abs(burC - 19.2) < 1e-9, 'CT burden article: 50 m of 2.5 mm2 and a 2 VA relay is 0.768 ohm, 19.2 VA at 5 A (over 10 VA) and 0.768 VA at 1 A; 3.2 A on a 400/5 CT is 256 A');
    const T1G = 11000 / (1480 * 2 * Math.PI / 60), T2G = T1G * 5 * 0.96;
    V(has('gear-drive-formulas', g4(T1G) + ' N·m') && has('gear-drive-formulas', '296 rpm') && has('gear-drive-formulas', g4(T2G) + ' N·m') && has('gear-drive-formulas', g4(11 * 0.96) + ' kW') && has('gear-drive-formulas', g4(Math.PI * 0.2 * 1480 / 60) + ' m/s') && Math.abs(T1G - 70.97) < 0.01 && Math.abs(T2G - 340.66) < 0.02, 'gear article: 11 kW at 1,480 rpm is 70.97 N.m; a 5:1, 96% drive gives 296 rpm and 340.7 N.m, 10.56 kW; a 0.2 m pulley runs the belt at 15.5 m/s');
    const sd = (r, f) => 503.29 * Math.sqrt(r / f) * 1000;
    V(has('skin-effect-formulas', g4(sd(1.72e-8, 50)) + ' mm') && has('skin-effect-formulas', g4(sd(2.82e-8, 50)) + ' mm') && has('skin-effect-formulas', g4(sd(1.72e-8, 60)) + ' mm') && Math.abs(sd(1.72e-8, 50) - 9.335) < 0.005, 'skin effect article: copper at 50 Hz has a skin depth of 9.335 mm, aluminium 11.95 mm, and copper at 60 Hz 8.521 mm');
    const XcR = 1 / (2 * Math.PI * 1000 * 100e-9), gR = XcR / Math.hypot(10000, XcR), fcR = 1 / (2 * Math.PI * 1e4 * 1e-7);
    V(has('rc-filter-formulas', g4(fcR) + ' Hz') && has('rc-filter-formulas', '= 1 ms') && has('rc-filter-formulas', g4(gR) + ' = ' + g4(10 * Math.log10(gR * gR)) + ' dB') && has('rc-filter-formulas', '−' + g4(Math.atan(10000 / XcR) * 180 / Math.PI) + '°') && has('rc-filter-formulas', g4(1 / (2 * Math.PI * 1e3 * 1e-8) / 1000) + ' kΩ') && Math.abs(fcR - 159.155) < 1e-3 && Math.abs(gR - 0.15718) < 1e-4 && Math.abs(Math.atan(10000 / XcR) * 180 / Math.PI - 80.957) < 1e-3, 'RC filter article: 10 kΩ and 100 nF give 159.2 Hz and 1 ms; at 1 kHz the gain from the capacitor reactance is 0.1572 (−16.07 dB, from the power ratio) and the phase is −80.96°; 1 kHz with 10 nF needs 15.92 kΩ');
    const dVq = 0.5 * (1 / (2 * 50)) / 4700e-6, VpR = Math.sqrt(288) - 1.4;
    V(has('rectifier-ripple-formulas', g4(Math.sqrt(288)) + ' V') && has('rectifier-ripple-formulas', g4(VpR) + ' V') && has('rectifier-ripple-formulas', g4(dVq) + ' V') && has('rectifier-ripple-formulas', g4(VpR - dVq) + ' V') && has('rectifier-ripple-formulas', g4(dVq / Math.sqrt(12)) + ' V') && has('rectifier-ripple-formulas', '= 10,000 µF') && Math.abs(dVq - 1.0638) < 1e-4 && Math.abs(VpR - 15.5706) < 1e-4, 'rectifier ripple article: 12 V RMS bridge at 0.5 A and 4,700 µF gives a 15.57 V peak and 1.064 V ripple from the charge removed in half a cycle; the RMS ripple is the peak-to-peak over √12; 0.5 V ripple needs 10,000 µF');
    const dIkB = (12 - 5) * (5 / 12 / 500e3) / 22e-6, dIbB = 5 * ((1 - 5 / 12) / 500e3) / 22e-6, IinB = 12 * 1 / 0.9 / 5;
    V(has('buck-boost-converter-formulas', '= 0.4167') && has('buck-boost-converter-formulas', g4(dIkB) + ' A') && has('buck-boost-converter-formulas', '= 0.5833') && has('buck-boost-converter-formulas', g4(IinB) + ' A') && has('buck-boost-converter-formulas', g4(IinB + dIbB / 2) + ' A') && Math.abs(dIkB - 0.26515) < 1e-5 && Math.abs(dIbB - dIkB) < 1e-12 && Math.abs(IinB - 2.6667) < 1e-4, 'buck and boost article: 12 V to 5 V is D 0.4167 and 0.2652 A ripple from the volt-seconds on the inductor; 5 V to 12 V at 1 A and 90% is D 0.5833, the same ripple and 2.667 A input from power balance');
    const TjH = 40 + 15 * 1.5 + 15 * 0.5 + 15 * 3, RsaH = 85 / 15 - 2;
    V(has('heat-sink-formulas', '= 5 K/W') && has('heat-sink-formulas', g4(TjH) + ' °C') && has('heat-sink-formulas', g4(40 + 15 * 3.5) + ' °C') && has('heat-sink-formulas', g4(RsaH) + ' K/W') && Math.abs(TjH - 115) < 1e-9 && Math.abs(RsaH - 3.6667) < 1e-4, 'heat sink article: 15 W at 40 °C with 1.5, 0.5 and 3 K/W gives 115 °C junction by adding the temperature rise across each layer, a 92.5 °C case, and a sink of 3.667 K/W or lower for 125 °C');
    const cellsB = Math.round(48 / 3.7) * Math.ceil(10 / 3.5), WhB = cellsB * 3.7 * 3.5;
    V(has('battery-pack-formulas', '13 cells in series') && has('battery-pack-formulas', '3 in parallel') && has('battery-pack-formulas', 'Total cells: 13 × 3 = ' + cellsB) && has('battery-pack-formulas', g4(WhB) + ' Wh') && has('battery-pack-formulas', '54.6 V') && has('battery-pack-formulas', g4(0.025 / 3 * 13 * 1000) + ' mΩ') && cellsB === 39 && Math.abs(WhB - 505.05) < 1e-9, 'battery pack article: a 48 V, 10 Ah pack from 3.7 V, 3.5 Ah cells is 13S3P, 39 cells, 505.05 Wh counting cell by cell, 54.6 V fully charged and 108.3 mΩ with 25 mΩ cells');
    const wA = 1480 * 2 * Math.PI / 60, TrA = 55000 / wA, KEA = 0.5 * 1.2 * wA * wA + 0.5 * 220 * (wA / 5) ** 2, tA = 2 * KEA / (TrA * wA);
    V(has('motor-acceleration-time-formulas', g4(TrA) + ' N·m') && has('motor-acceleration-time-formulas', '= 10 kg·m²') && has('motor-acceleration-time-formulas', g4(tA) + ' s') && has('motor-acceleration-time-formulas', g4(KEA / 1000) + ' kJ') && Math.abs(tA - 4.3676) < 1e-3 && Math.abs(KEA - 120102) < 1, 'motor acceleration article: the 220 kg·m² load behind a 5:1 drive adds 8.8 kg·m² (total 10.0); the energy of both shafts (120.1 kJ) at 354.9 N·m net torque gives 4.368 s');
    const RsZ = 6.9 / 0.025, PzZ = 5.1 * 6.9 / RsZ, PrZ = 6.9 * 6.9 / RsZ;
    V(has('zener-regulator-formulas', '= ' + g4(RsZ) + ' Ω') && has('zener-regulator-formulas', '= ' + g4(PzZ) + ' W') && has('zener-regulator-formulas', '= ' + g4(PrZ) + ' W') && has('zener-regulator-formulas', '25 mA') && RsZ === 276 && Math.abs(PzZ - 0.1275) < 1e-12 && Math.abs(PrZ - 0.1725) < 1e-12, 'zener article: 12 V to 5.1 V at 20 mA with 5 mA minimum needs 276 ohm, 25 mA supply, 0.1275 W in the zener with no load and 0.1725 W in the resistor (V squared over R)');
    const VBb = 12 * (10 / 57), IEb = (VBb - 0.7) / 1000, VCEb = 12 - IEb * 3200;
    V(has('bjt-bias-formulas', g4(VBb) + ' V') && has('bjt-bias-formulas', g4(IEb * 1000) + ' mA') && has('bjt-bias-formulas', g4(12 - IEb * 2200) + ' V') && has('bjt-bias-formulas', g4(VCEb) + ' V') && Math.abs(VBb - 2.1053) < 1e-4 && Math.abs(IEb * 1000 - 1.4053) < 1e-4 && Math.abs(VCEb - 7.5032) < 1e-4, 'BJT bias article: 47 k / 10 k divider on 12 V gives 2.105 V base, 1.405 mA emitter current and VCE 7.503 V (loop equation with RC + RE = 3.2 k)');
    const RtP = (t) => 100 + 0.39083 * t - 5.775e-5 * t * t; let lo = 0, hi = 200; for (let k = 0; k < 80; k++) { const mid = (lo + hi) / 2; if (RtP(mid) < 119.4) lo = mid; else hi = mid; }
    V(has('pt100-rtd-formulas', '= ' + g4(RtP(50)) + ' Ω') && has('pt100-rtd-formulas', 'R100 = ' + g4(RtP(100)) + ' Ω') && has('pt100-rtd-formulas', 't = ' + g4(lo) + ' °C') && has('pt100-rtd-formulas', g4(1 / 0.39083) + ' °C') && Math.abs(RtP(100) - 138.505) < 1e-3 && Math.abs(RtP(50) - 119.397) < 1e-3, 'Pt100 article: 119.40 ohm at 50 C and 138.51 ohm at 100 C from the expanded polynomial; 119.4 ohm bisects back to 50.01 C; 1 ohm of lead resistance is 2.559 C');
    const RnT = 10000 * Math.exp(3950 / 323.15 - 3950 / 298.15), TmT = 3950 * 298.15 / (3950 + 298.15 * Math.log(0.5)) - 273.15;
    V(has('thermistor-formulas', '= ' + g4(RnT) + ' Ω') && has('thermistor-formulas', g4(TmT) + ' °C') && has('thermistor-formulas', g4(3.3 / (1 + 10000 / RnT)) + ' V') && Math.abs(RnT - 3588.2) < 0.1 && Math.abs(TmT - 41.46) < 0.01, 'thermistor article: 10 k, B 3950 gives 3,588 ohm at 50 C by exp(B/T - B/T0); 5 k reads 41.46 C by the closed form B T0 / (B + T0 ln(R/R0)); the 10 k divider on 3.3 V gives 0.8714 V');
    const IcF = 10244 * (0.5 / 25.4) * Math.sqrt(0.5 / 25.4), dnF = 25.4 * Math.pow(20 / 10244, 2 / 3);
    V(has('fusing-current-formulas', '= ' + g4(IcF) + ' A') && has('fusing-current-formulas', g4(7585 * (0.5 / 25.4) * Math.sqrt(0.5 / 25.4)) + ' A') && has('fusing-current-formulas', g4(dnF) + ' mm') && Math.abs(IcF - 28.29) < 0.01 && Math.abs(dnF - 0.3968) < 1e-3, 'fusing current article: 0.5 mm copper melts at 28.29 A (Preece, d in inches) and aluminium at 20.95 A; 20 A needs 0.397 mm of copper');
    const EfW = 0.5 * 2.25 * Math.pow(2 * Math.PI * 50, 2);
    V(has('flywheel-energy-formulas', g4(EfW / 1000) + ' kJ') && has('flywheel-energy-formulas', g4(EfW / 3600) + ' Wh') && has('flywheel-energy-formulas', g4(EfW * 5 / 9 / 1000) + ' kJ') && has('flywheel-energy-formulas', '55.56%') && Math.abs(EfW - 111033) < 1 && Math.abs(EfW * 5 / 9 - 61685) < 1, 'flywheel article: a 50 kg, 0.3 m disc at 3,000 rpm (50 rev/s) holds 111.0 kJ or 30.84 Wh; the band to 2,000 rpm is 5/9 of it (61.69 kJ, 55.56%)');
    const PlL = (12 - 5) * 1 + 12 * 0.005;
    V(has('linear-regulator-formulas', '= ' + g4(PlL) + ' W') && has('linear-regulator-formulas', '= ' + g4(5 / (PlL + 5) * 100) + '%') && has('linear-regulator-formulas', '= 6.2 V') && has('linear-regulator-formulas', '= 720 Ω') && Math.abs(PlL - 7.06) < 1e-12 && Math.abs(5 / (PlL + 5) * 100 - 41.459) < 1e-3, 'linear regulator article: 12 V to 5 V at 1 A with 5 mA quiescent loses 7.06 W (12.06 W in, 5 W out) at 41.46%; the smallest input with 1.2 V dropout is 6.2 V; R2 is 720 ohm for 5 V with 240 ohm');
    const PcM = 10 * 10 * 0.01 * 0.5, PsM = 2 * (48 * 10 * 20e-9 / 2) * 1e5, PgM = 50e-9 * 10 * 1e5;
    V(has('mosfet-loss-formulas', '= ' + g4(PcM) + ' W') && has('mosfet-loss-formulas', '= ' + g4(PsM) + ' W') && has('mosfet-loss-formulas', '= ' + g4(PgM) + ' W') && has('mosfet-loss-formulas', 'Total = ' + g4(PcM + PsM + PgM) + ' W') && Math.abs(PsM - 0.96) < 1e-9 && Math.abs(PcM + PsM + PgM - 1.51) < 1e-9, 'MOSFET article: 48 V, 10 A, 100 kHz, 10 mohm, D 0.5 gives 0.5 W conduction, 0.96 W switching (two edges of V I t / 2) and 0.05 W gate drive, 1.51 W in total');
    const RcR = 12 * 12 / 0.4, IcR = 12 / RcR, RhR = RcR + RcR * 0.00393 * 50;
    V(has('relay-coil-formulas', g4(IcR * 1000) + ' mA') && has('relay-coil-formulas', '= 360 Ω') && has('relay-coil-formulas', '= ' + g4(12 * 12 / RcR) + ' W') && has('relay-coil-formulas', '= ' + g4(RhR) + ' Ω') && has('relay-coil-formulas', g4(12 / RhR * 1000) + ' mA') && RcR === 360 && Math.abs(RhR - 430.74) < 1e-9, 'relay coil article: 12 V, 400 mW is 33.33 mA and 360 ohm; 24 V needs 360 ohm in series dissipating 0.4 W (12 V squared over R); at 70 C the coil is 430.7 ohm and 27.86 mA');
    const InT = 1e6 / (Math.sqrt(3) * 11000);
    V(has('transformer-inrush-formulas', '= ' + g4(InT) + ' A') && has('transformer-inrush-formulas', '= ' + g4(10 * InT) + ' A') && has('transformer-inrush-formulas', g4(InT * Math.SQRT2) + ' A') && has('transformer-inrush-formulas', g4(10 / Math.SQRT2) + ' times') && Math.abs(InT - 52.486) < 1e-3 && Math.abs(10 / Math.SQRT2 - 7.071) < 1e-3, 'transformer inrush article: 1,000 kVA at 11 kV is 52.49 A, a multiple of 10 gives 524.9 A, the rated peak is 74.23 A and the inrush is 7.071 times the rated peak');
    const t1B = 50 / 8.5, t2B = 80 / 19;
    V(has('battery-charge-time-formulas', '= ' + g4(t1B) + ' h') && has('battery-charge-time-formulas', '= ' + g4(t2B) + ' h') && has('battery-charge-time-formulas', '= 4.096 kWh') && has('battery-charge-time-formulas', '= 0.1 C') && Math.abs(t1B - 5.8824) < 1e-4 && Math.abs(t2B - 4.2105) < 1e-4, 'battery charge time article: 50 Ah at 10 A and 0.85 takes 5.882 h (0.1 C); 80 Ah at 20 A and 0.95 takes 4.211 h and 4.096 kWh at 51.2 V');
    const AwW = Math.PI * 25, PwW = 0.6125 * AwW * 512, PbW = 8 / 27 * 1.225 * AwW * 512, rpmW = 7 * 8 / 5 * 60 / (2 * Math.PI);
    V(has('wind-turbine-power-formulas', '= ' + g4(AwW) + ' m²') && has('wind-turbine-power-formulas', '= ' + g4(PwW / 1000) + ' kW') && has('wind-turbine-power-formulas', 'P = ' + g4(PwW * 0.4 / 1000) + ' kW') && has('wind-turbine-power-formulas', g4(PbW / 1000) + ' kW') && has('wind-turbine-power-formulas', g4(rpmW) + ' rpm') && Math.abs(PwW * 0.4 - 9852) < 1 && Math.abs(PbW - 14595.6) < 0.1 && Math.abs(rpmW - 106.95) < 0.01, 'wind turbine article: a 10 m rotor in 8 m/s has 78.54 m2, 24.63 kW in the wind, 9.852 kW at Cp 0.4, a Betz limit of 14.60 kW (8/27 form) and 106.95 rpm at tip speed ratio 7');
    const XlD = 0.07 * (400 * 400 / 50000), LD = XlD / (2 * Math.PI * 50), frD = 50 / Math.sqrt(0.07);
    V(has('detuning-reactor-formulas', '= ' + g4(XlD) + ' Ω') && has('detuning-reactor-formulas', g4(LD * 1000) + ' mH') && has('detuning-reactor-formulas', g4(frD) + ' Hz') && has('detuning-reactor-formulas', g4(400 / 0.93) + ' V') && has('detuning-reactor-formulas', g4(50 / 0.93) + ' kVAR') && Math.abs(frD - 188.98) < 0.01 && Math.abs(LD * 1000 - 0.7130) < 1e-4 && Math.abs(400 / 0.93 - 430.11) < 0.01, 'detuning reactor article: 50 kVAR at 400 V with 7% is 3.2 ohm, 0.224 ohm, 0.7130 mH, 188.98 Hz (order 3.78), 430.1 V on the capacitor and 53.76 kVAR net (50 / 0.93)');
    const tnT = (10.6 / 11 - 1) * 100, vS = (tp) => 415 * (10.6 / 11) / (1 + tp / 100);
    V(has('tap-changer-formulas', '= ' + g4(vS(0)) + ' V') && has('tap-changer-formulas', g4(tnT) + '%') && has('tap-changer-formulas', g4(vS(-2.5)) + ' V') && has('tap-changer-formulas', g4((vS(-2.5) / 415 - 1) * 100) + '%') && Math.abs(vS(0) - 399.91) < 0.01 && Math.abs(vS(-2.5) - 410.16) < 0.01 && Math.abs(tnT + 3.636) < 0.001, 'tap changer article: 10.6 kV on an 11 kV / 415 V transformer gives 399.9 V at the rated tap; the tap needed is -3.636%, the nearest is -2.5% giving 410.2 V (-1.18%)');
    const T1P = 0.4 * 6 * 9.81 * 80, T2P = T1P * Math.exp(0.4 * 0.5 * Math.PI);
    V(has('cable-pulling-tension-formulas', '= ' + g4(T1P) + ' N') && has('cable-pulling-tension-formulas', '= ' + g4(T2P) + ' N') && has('cable-pulling-tension-formulas', '= 14,250 N') && has('cable-pulling-tension-formulas', g4(Math.exp(0.2 * Math.PI))) && Math.abs(T1P - 1883.52) < 1e-9 && Math.abs(T2P - 3530.58) < 0.01, 'cable pulling article: 6 kg/m over 80 m at mu 0.4 is 1,884 N; after a 90 degree bend (e to the 0.2 pi, 1.874) 3,531 N; 3 x 95 mm2 at 50 N/mm2 allows 14,250 N');
    const R40I = 500 / 4;
    V(has('insulation-resistance-formulas', 'PI = 2400 / 800 = 3') && has('insulation-resistance-formulas', '= 1.333') && has('insulation-resistance-formulas', '= ' + g4(R40I) + ' MΩ') && has('insulation-resistance-formulas', '= 12 MΩ') && has('insulation-resistance-formulas', '= 6.25 µA') && R40I === 125, 'insulation resistance article: 800 and 2,400 MOhm give a PI of 3; 800 and 600 give a DAR of 1.333; 500 MOhm at 20 C is 125 MOhm at 40 C (two halvings); 11 kV needs 12 MOhm; 5 kV across 800 MOhm leaks 6.25 uA');
    const s15 = (Math.sqrt(6) - Math.sqrt(2)) / 4, c15 = (Math.sqrt(6) + Math.sqrt(2)) / 4, PaA = 12.1e6 * s15, QaA = -12.1e6 * (1 - c15);
    V(has('power-angle-formulas', '= ' + g4(PaA / 1e6) + ' MW') && has('power-angle-formulas', '= 12.1 MW') && has('power-angle-formulas', '= ' + g4(QaA / 1e6) + ' MVAR') && Math.abs(PaA - 3131710) < 1 && Math.abs(QaA + 412297.5) < 1, 'power angle article: 11 kV both ends, 10 ohm, 15 degrees carries 3.132 MW (sin 15 from the exact radicals), the maximum is 12.1 MW and Q at the receiving end is -0.4123 MVAR');
    const TcS = 35 + 25 * 1000 / 800, PS = 550 - 550 * 0.0034 * (TcS - 25);
    V(has('solar-panel-temperature-formulas', '= ' + g4(TcS) + ' °C') && has('solar-panel-temperature-formulas', '= ' + g4(PS) + ' W') && has('solar-panel-temperature-formulas', '= 0.8598') && Math.abs(TcS - 66.25) < 1e-12 && Math.abs(PS - 472.86) < 0.01, 'solar temperature article: 35 C air at 1,000 W/m2 and NOCT 45 gives 66.25 C cells and a 550 W module delivers 472.9 W (factor 0.8598 at -0.34% per C)');
    { const dv = (0.5 * 0.2 + 2 * 0.1) / (11000 * 11000 / 1e6), Sc = 11 * 10 * Math.sqrt(3);
    V(has('voltage-change-formulas', '= ' + g4(dv)) && has('voltage-change-formulas', 'voltage change of ' + g4(dv * 100) + '%') && has('voltage-change-formulas', '0.5 / 50 = 1%') && has('voltage-change-formulas', '= ' + g4(Sc) + ' MVA') && Math.abs(dv - 0.0024793) < 1e-7 && Math.abs(Sc - 190.526) < 1e-3, 'voltage change article: 200 kW and 100 kVAR on R 0.5 and X 2 ohm at 11 kV is 0.2479% (per-unit form), 0.5 MVA on 50 MVA is 1%, and 10 kA at 11 kV is 190.5 MVA'); }
    { const Pi = 55 / 0.94 / 0.97, Si = 55e3 / (0.94 * 0.97 * 0.95) / 1000, Ii = 55e3 / (Math.sqrt(3) * 415 * 0.95 * 0.94 * 0.97);
    V(has('soft-starter-vfd-formulas', '= 570 A') && has('soft-starter-vfd-formulas', '= 285 A') && has('soft-starter-vfd-formulas', '= 25% of') && has('soft-starter-vfd-formulas', '= ' + g4(Pi) + ' kW') && has('soft-starter-vfd-formulas', '= ' + g4(Si) + ' kVA') && has('soft-starter-vfd-formulas', '= ' + g4(Ii) + ' A') && has('soft-starter-vfd-formulas', '900 rpm') && Math.abs(Pi - 60.32) < 0.01 && Math.abs(Ii - 88.33) < 0.01, 'soft starter and VFD article: 95 A at ratio 6 is 570 A, 285 A and 25% torque at half voltage; 55 kW shaft gives 60.32 kW, 63.49 kVA and 88.33 A at the drive input; 30 Hz on 4 poles is 900 rpm'); }
    { const Rm2 = 0.017241 * 25 / 2.5 + 0.017241 * 25 / 1.5, Zs2 = 0.35 + Rm2 * 1.1965, If2 = 230 / Zs2;
    V(has('fault-loop-rcd-formulas', '= ' + g4(Rm2) + ' Ω at 20 °C') && has('fault-loop-rcd-formulas', '= ' + g4(Zs2) + ' Ω') && has('fault-loop-rcd-formulas', '= ' + g4(If2) + ' A') && has('fault-loop-rcd-formulas', '= 2.3 Ω') && has('fault-loop-rcd-formulas', '= 1,667 Ω') && Math.abs(Zs2 - 0.9001) < 1e-3 && Math.abs(If2 - 255.5) < 0.1 && Math.abs(50 / 0.03 - 1666.67) < 0.01, 'fault loop and RCD article: 25 m of 2.5 and 1.5 mm2 copper with Ze 0.35 ohm gives 0.4598 ohm cold, Zs 0.9001 ohm hot, 255.5 A, a 2.3 ohm limit for a 20 A type B breaker and 1,667 ohm for a 30 mA RCD'); }
    { const Eb = 50, Rb = 0.06, Vb = Eb - 100 * Rb, Pm2 = (Eb / 2) * (Eb / (2 * Rb));
    V(has('battery-internal-resistance-formulas', '= 0.06 Ω') && has('battery-internal-resistance-formulas', '= ' + g4(Vb) + ' V') && has('battery-internal-resistance-formulas', 'gets ' + g4(Vb * 100) + ' W') && has('battery-internal-resistance-formulas', '= ' + g4(100 * 6) + ' W') && has('battery-internal-resistance-formulas', '= ' + g4(Vb / Eb * 100) + '%') && has('battery-internal-resistance-formulas', '= ' + g4(8 / Rb) + ' A') && has('battery-internal-resistance-formulas', '= ' + g4(Pm2 / 1000) + ' kW') && Math.abs(8 / Rb - 133.33) < 0.01 && Math.abs(Pm2 - 10416.67) < 0.01, 'battery internal resistance article: 50 V and 47.6 V at 40 A is 0.06 ohm; 100 A gives 44 V, 4,400 W, 600 W lost, 88%, a 133.3 A limit to 42 V and a matched maximum of 10.42 kW'); }
    { const Ar = 2000 / 1.2, nb = Math.ceil(Ar / (100 * 10)), As = Math.sqrt(40000 * 40000 * 0.5) / 115, mC = 0.1 * 0.01 * 8960;
    V(has('busbar-rating-formulas', '= ' + g4(Ar) + ' mm²') && has('busbar-rating-formulas', 'rounded up to ' + nb + ' bars') && has('busbar-rating-formulas', '= 1 A/mm²') && has('busbar-rating-formulas', '= ' + g4(As) + ' mm²') && has('busbar-rating-formulas', '= ' + g4(mC) + ' kg/m') && has('busbar-rating-formulas', '= 2.7 kg/m') && nb === 2 && Math.abs(As - 245.95) < 0.01 && Math.abs(mC - 8.96) < 1e-9, 'busbar article: 2,000 A at 1.2 A/mm2 needs 1,667 mm2 so two 100 x 10 bars at 1 A/mm2; 40 kA for 0.5 s with k 115 needs 246 mm2; a 100 x 10 bar is 8.96 kg/m in copper and 2.7 kg/m in aluminium'); }
    { const lsbA = 3300 / 4096, cA = 1.65 / 3.3 * 4096, uAA = 16e3 / (4096 * 0.8), enA = (68 - 1.76) / 6.02;
    V(has('adc-resolution-formulas', '= ' + g4(lsbA) + ' mV') && has('adc-resolution-formulas', '= ' + g4(cA) + ' counts') && has('adc-resolution-formulas', '= ' + g4(6.02 * 12 + 1.76) + ' dB') && has('adc-resolution-formulas', g4(4096 / 5) + ' counts') && has('adc-resolution-formulas', '= ' + g4(uAA) + ' µA') && has('adc-resolution-formulas', '= ' + g4(enA) + ' bits') && Math.abs(lsbA - 0.80566) < 1e-5 && cA === 2048 && Math.abs(uAA - 4.8828) < 1e-4 && Math.abs(enA - 11.0033) < 1e-3, 'ADC article: 12 bits on 3.3 V is 0.8057 mV per step, 1.65 V is 2,048 counts, SNR 74 dB; 4-20 mA on 250 ohm and 5 V gives 819.2 counts at 4 mA and 4.883 uA per count; SINAD 68 dB is 11 ENOB'); }
    { const Cc = 1 / (2 * Math.PI * 50 * 3.2), Vp = 400 * Math.SQRT2 / Math.sqrt(3), Ip = Vp * Math.sqrt(Cc / 10e-6), fi = 1 / (2 * Math.PI * Math.sqrt(10e-6 * Cc));
    V(has('capacitor-switching-inrush-formulas', '= ' + g4(Cc * 1e6) + ' µF') && has('capacitor-switching-inrush-formulas', '= ' + g4(Vp) + ' V') && has('capacitor-switching-inrush-formulas', '= ' + g4(Ip) + ' A') && has('capacitor-switching-inrush-formulas', '= ' + g4(fi) + ' Hz') && Math.abs(Cc * 1e6 - 994.7) < 0.1 && Math.abs(Ip - 3257) < 2, 'capacitor switching article: 3.2 ohm per phase is 994.7 uF; with 10 uH the peak inrush at 400 V is about 3,257 A at about 1.6 kHz (written as Vpk x sqrt(C/L))'); }
    { const C6 = 6e-6, Q6 = 2 * Math.PI * 50 * C6 * 11000 * 11000, I6 = Q6 / (Math.sqrt(3) * 11000);
    V(has('cable-charging-current-formulas', '= 6 µF') && has('cable-charging-current-formulas', '= ' + g4(I6) + ' A') && has('cable-charging-current-formulas', '= ' + g4(Q6 / 1000) + ' kVAR') && Math.abs(I6 - 11.97) < 0.01 && Math.abs(Q6 / 1000 - 228.1) < 0.1, 'cable charging article: 20 km at 0.3 uF/km and 11 kV is 6 uF, 11.97 A per phase (from Q / (sqrt3 V)) and 228.1 kVAR'); }
    { const Pd = 13.2;
    V(has('solar-dc-ac-ratio-formulas', '= ' + g4(Pd) + ' kWp') && has('solar-dc-ac-ratio-formulas', '= 1.32') && has('solar-dc-ac-ratio-formulas', '= ' + g4(Pd / 1.25) + ' kW') && Math.abs(Pd / 1.25 - 10.56) < 1e-9 && Math.abs(Pd / 10 - 1.32) < 1e-12, 'solar DC to AC article: 24 x 550 W is 13.2 kWp, 1.32 on a 10 kW inverter and 10.56 kW for a ratio of 1.25'); }
    { const uu = Math.hypot(0.5, 0.3, 0.2);
    V(has('measurement-uncertainty-formulas', '= ' + g4(uu)) && has('measurement-uncertainty-formulas', '= ' + g4(2 * uu)) && has('measurement-uncertainty-formulas', '= ' + g4(0.5 / Math.sqrt(3))) && Math.abs(uu - 0.6164) < 1e-4 && Math.abs(2 * uu - 1.2329) < 1e-4 && Math.abs(0.5 / Math.sqrt(3) - 0.2887) < 1e-4, 'uncertainty article: 0.5, 0.3 and 0.2 combine to 0.6164, U (k = 2) is 1.233, and a +/-0.5 limit is 0.2887'); }
    { const kk = 1400 / (1000 / 5 + 630 / 4.5), l1 = kk / 5, l2 = kk / 4.5;
    V(has('parallel-transformer-formulas', '= ' + g4(1000 / 5 + 630 / 4.5)) && has('parallel-transformer-formulas', '= ' + g4(l1 * 1000) + ' kVA') && has('parallel-transformer-formulas', '= ' + g4(l2 * 630) + ' kVA') && has('parallel-transformer-formulas', g4(l2 * 100) + '% of') && has('parallel-transformer-formulas', '= 1,530 kVA') && Math.abs(l1 * 1000 - 823.5) < 0.1 && Math.abs(l1 * 1000 + l2 * 630 - 1400) < 1e-9, 'parallel transformer article: 1,400 kVA on 1,000 kVA at 5% and 630 kVA at 4.5% splits 823.5 and 576.5 kVA (82.35% and 91.5%); the largest load is 1,530 kVA'); }
    { const tP = 20 * Math.exp(1.2 * Math.log(0.25));
    V(has('peukert-formulas', '= ' + g4(tP) + ' h') && has('peukert-formulas', '= ' + g4(20 * tP) + ' Ah') && Math.abs(tP - 3.7893) < 1e-3, 'Peukert article: 100 Ah at 20 h, k 1.2, 20 A runs 3.789 h and delivers 75.79 Ah'); }
    { const ta = 100000 * 500e-6, tt = 3 * ta * Math.LN2, Ee = 0.5 * 500e-6 * 160000, Vv = 400 * Math.exp(-1.2);
    V(has('capacitor-discharge-formulas', '= ' + g4(ta) + ' s') && has('capacitor-discharge-formulas', '= ' + g4(tt) + ' s') && has('capacitor-discharge-formulas', '= ' + g4(Vv) + ' V') && has('capacitor-discharge-formulas', '= ' + g4(Ee) + ' J') && has('capacitor-discharge-formulas', '= 1.6 W') && Math.abs(tt - 103.97) < 0.01 && Math.abs(Vv - 120.48) < 0.01, 'capacitor discharge article: 500 uF and 100 kOhm is 50 s; 400 V falls to 50 V in 103.97 s (3 tau ln 2), 120.5 V after 60 s, 40 J stored and 1.6 W at the start'); }
    { const Ph = 0.001 * 200e5, Pm3 = Ph / 0.85 / 1000, F3 = Math.PI * 0.05 * 0.05 * 1e7;
    V(has('hydraulic-power-formulas', '= 20 kW') && has('hydraulic-power-formulas', '= ' + g4(Pm3) + ' kW') && has('hydraulic-power-formulas', '= ' + g4(F3 / 1000) + ' kN') && Math.abs(Ph - 20000) < 1e-6 && Math.abs(F3 - 78539.8) < 0.1, 'hydraulic article: 60 L/min at 200 bar is 20 kW (SI units), 23.53 kW at 0.85, and a 100 mm bore at 100 bar pushes 78.54 kN'); }
    { const Tt = 2050 / 41 + 25, Vt = 130 * 41 / 1000;
    V(has('thermocouple-formulas', '= ' + g4(Tt) + ' °C') && has('thermocouple-formulas', '= ' + g4(Vt) + ' mV') && Tt === 75 && Math.abs(Vt - 5.33) < 1e-9, 'thermocouple article: 2.05 mV with the reference at 25 C is 75 C at 41 uV/C, and 150 C against 20 C gives 5.33 mV'); }
    { const Il = 1e6 * 415 / 415 / (Math.sqrt(3) * 415), Ih = Il * 415 / 11000, ratio = Math.sqrt(3) * 11000 / 415;
    V(has('transformer-vector-group-formulas', '= ' + g4(11000 / 415)) && has('transformer-vector-group-formulas', '= ' + g4(ratio)) && has('transformer-vector-group-formulas', '= ' + g4(Il) + ' A') && has('transformer-vector-group-formulas', '= ' + g4(Ih) + ' A') && has('transformer-vector-group-formulas', '= ' + g4(Ih / Math.sqrt(3)) + ' A') && Math.abs(ratio - 45.91) < 0.01 && Math.abs(Il - 1391.2) < 0.1 && Math.abs(Ih - 52.486) < 0.001, 'vector group article: 11 kV delta / 415 V star, 1,000 kVA has a line ratio of 26.51, a turns ratio of 45.91, 1,391 A on the LV, 52.49 A on the HV and 30.30 A in the delta'); }
    { const Eh = 0.5 * 470e-6 * (380 * 380 - 300 * 300), th = Eh / 500;
    V(has('holdup-time-formulas', '= ' + g4(Eh) + ' J') && has('holdup-time-formulas', '= ' + g4(th * 1000) + ' ms') && Math.abs(th * 1000 - 25.57) < 0.01, 'hold-up article: 470 uF between 380 V and 300 V gives 12.78 J, so 500 W is held for 25.57 ms'); }
    { const Pw = 2000 * 9.81 * 0.5 / 0.8, Jw = 2000 * 9.81 * 15;
    V(has('hoist-power-formulas', '= ' + g4(Pw / 1000) + ' kW') && has('hoist-power-formulas', '= 30 s') && has('hoist-power-formulas', '= ' + g4(Jw / 1000) + ' kJ') && has('hoist-power-formulas', g4(Jw / 0.8 / 3.6e6) + ' kWh') && Math.abs(Pw - 12262.5) < 1e-9 && Math.abs(Jw - 294300) < 1e-9, 'hoist article: 2,000 kg at 0.5 m/s and 0.8 needs 12.26 kW, 30 s for 15 m, 294.3 kJ at the load and 0.1022 kWh from the supply'); }
    { const Pc = 101325 * 0.1 * 3 * Math.LN2;
    V(has('compressor-power-formulas', '= ' + g4(Pc / 1000) + ' kW') && has('compressor-power-formulas', '= ' + g4(Pc / 0.65 / 1000) + ' kW') && has('compressor-power-formulas', '= 35 s') && Math.abs(Pc - 21070.1) < 1 && Math.abs(Pc / 0.65 - 32415.6) < 2, 'compressor article: 0.1 m3/s at a ratio of 8 needs 21.07 kW isothermal (3 ln 2 form), 32.42 kW at 0.65, and a 0.5 m3 receiver fills in 35 s'); }
    { const Vk = 24 * Math.SQRT2, Vdd = 2 * Math.SQRT2 / Math.PI * 24 - 1.4;
    V(has('rectifier-bridge-formulas', '= ' + g4(Vk) + ' V') && has('rectifier-bridge-formulas', '= 20.2 V') && has('rectifier-bridge-formulas', '= 2.5 A') && has('rectifier-bridge-formulas', '= 7 W') && has('rectifier-bridge-formulas', '= 540 V') && Math.abs(Vk - 33.941) < 1e-3 && Math.abs(Vdd - 20.2) < 0.01 && Math.abs(3 * Math.SQRT2 / Math.PI * 400 - 540) < 0.3, 'rectifier bridge article: 24 V RMS gives a 33.94 V peak, 20.2 V DC after two 0.7 V drops (0.9 is 2 sqrt2 / pi), 2.5 A and 7 W in the diodes; 400 V three-phase gives 540 V (1.35 is 3 sqrt2 / pi)'); }
    { const Ap = 50 * 1.378, Ip = 0.048 * Math.exp(0.44 * Math.log(10) + 0.725 * Math.log(Ap)), Rt = (1.724e-8 / 35e-6) * (0.1 / 1e-3);
    V(has('pcb-trace-current-formulas', '= ' + g4(Ap) + ' mil²') && has('pcb-trace-current-formulas', '= ' + g4(Ip) + ' A') && has('pcb-trace-current-formulas', '= ' + g4(Rt) + ' Ω') && has('pcb-trace-current-formulas', '= ' + g4(2 * Rt) + ' V') && Math.abs(Ip - 2.845) < 0.01 && Math.abs(Rt - 0.049257) < 1e-6, 'PCB trace article: 50 mil, 1 oz, 10 C rise carries 2.844 A (IPC-2221 fit written with exp and log); 100 mm of 1 mm x 35 um is 0.04926 ohm'); }
    { const Cc = 308.15 / 30, Wh = 12 / 3.5;
    V(has('heat-pump-cop-formulas', '= ' + g4(Wh) + ' kW') && has('heat-pump-cop-formulas', '= ' + g4(12 * (1 - 1 / 3.5)) + ' kW') && has('heat-pump-cop-formulas', '= ' + g4(Cc)) && has('heat-pump-cop-formulas', g4(3.5 / Cc * 100) + '%') && Math.abs(Cc - 10.272) < 1e-3 && Math.abs(Wh - 3.4286) < 1e-4, 'heat pump article: 12 kW at COP 3.5 takes 3.429 kW and 8.571 kW from the source; the Carnot limit 35 C / 5 C is 10.27 and 3.5 is 34.07% of it'); }
    { const s2 = 80 + 10 * Math.log10(2), s3 = 70 + 10 * Math.log10(3), d8 = 90 - 20 * Math.log10(8);
    V(has('sound-level-formulas', '= ' + g4(s2) + ' dB') && has('sound-level-formulas', '= ' + g4(s3) + ' dB') && has('sound-level-formulas', '= ' + g4(d8) + ' dB') && Math.abs(s2 - 83.01) < 0.01 && Math.abs(s3 - 74.77) < 0.01 && Math.abs(d8 - 71.94) < 0.01, 'sound level article: two 80 dB sources give 83.01 dB, three 70 dB give 74.77 dB, and 90 dB at 1 m is 71.94 dB at 8 m'); }
    { const ms2 = (10 / 60) * 1e4 + (30 / 60) * 400, ir = Math.sqrt(ms2);
    V(has('duty-cycle-rms-formulas', '= ' + g4(ir) + ' A') && has('duty-cycle-rms-formulas', '= ' + g4(1000 / 60 + 600 / 60) + ' A') && has('duty-cycle-rms-formulas', '= ' + g4(40 / 60 * 100) + '%') && Math.abs(ir - 43.205) < 1e-3, 'duty cycle article: 100 A for 10 s, 20 A for 30 s and off for 20 s has an RMS current of 43.20 A (time-weighted squares), an average of 26.67 A and a duty factor of 66.67%'); }
    { const Qs = 100 * 1.35, Es = Qs * (2.7 + 1.35) / 2;
    V(has('supercapacitor-formulas', '= ' + g4(Es) + ' J') && has('supercapacitor-formulas', '= ' + g4(Es / 10) + ' s') && has('supercapacitor-formulas', '= 27 s') && has('supercapacitor-formulas', '= 0.05 V') && has('supercapacitor-formulas', '= 0.25 W') && has('supercapacitor-formulas', '75%') && Math.abs(Es - 273.375) < 1e-9, 'supercapacitor article: 100 F from 2.7 V to 1.35 V gives 273.4 J (charge times mean voltage), 27.34 s at 10 W, 27 s at 5 A, a 0.05 V step and 0.25 W in a 10 mohm ESR; half the voltage leaves 75%'); }
    { const Cx = 1 - 0.09 * ((2500 - 100) / 2500) / 0.29, Et1 = (1000 + 1.5 * Cx * 2500) * 0.157 * Math.SQRT2, Es1 = (1000 + 6 * Cx * 2500) * 0.157 * Math.SQRT2, Et2 = 1150 * 0.157 * Math.SQRT2, Es2 = 1600 * 0.157 * Math.SQRT2;
    V(has('step-touch-voltage-formulas', '= ' + g4(Cx)) && has('step-touch-voltage-formulas', '= ' + g4(Et1) + ' V') && has('step-touch-voltage-formulas', '= ' + g4(Es1) + ' V') && has('step-touch-voltage-formulas', '= ' + g4(Et2) + ' V') && has('step-touch-voltage-formulas', '= ' + g4(Es2) + ' V') && has('step-touch-voltage-formulas', '= 2,400 V') && Math.abs(Cx - 0.70207) < 1e-4 && Math.abs(Et1 - 806.6) < 0.2 && Math.abs(Et2 - 255.3) < 0.1, 'step and touch article: Cs 0.7021 for 0.1 m of 2,500 ohm-m rock on 100 ohm-m soil, 70 kg limits at 0.5 s from 1/sqrt(0.5) = sqrt2 (touch 806.6 V), 255.3 V touch and 355.3 V step with no layer, and 3 kA x 0.8 ohm is 2,400 V'); }
    { const Sk = 30 / (0.92 * 0.86), Ic = Sk * 1000 / (Math.sqrt(3) * 415);
    V(has('contactor-sizing-formulas', '= ' + g4(Ic) + ' A') && has('contactor-sizing-formulas', '= ' + g4(Ic / 0.9) + ' A, so the next size in the example list is 65 A') && has('contactor-sizing-formulas', '= ' + g4(7 * Ic) + ' A') && Math.abs(Ic - 52.75) < 0.01 && Ic / 0.9 > 50 && Ic / 0.9 < 65, 'contactor article: 30 kW at 415 V, 0.92 and 0.86 draws 52.75 A (via kVA), needs 58.6 A at a derating of 0.9, so the 65 A size, and a starting current of 369.3 A'); }
    { const Vb = 400 * Math.SQRT2, Vp = 2 * Vb * 500 / 550, Lx = 150 * 0.1 / 2, dv = Vb * 0.8 / 0.1;
    V(has('inverter-motor-cable-formulas', '= ' + g4(Vb) + ' V') && has('inverter-motor-cable-formulas', '= ' + g4(2 * Vb) + ' V') && has('inverter-motor-cable-formulas', '= ' + g4(Vp) + ' V') && has('inverter-motor-cable-formulas', '= ' + g4(Lx) + ' m') && has('inverter-motor-cable-formulas', '= ' + g4(dv / 1000) + ' kV/µs') && has('inverter-motor-cable-formulas', '= 0.8182') && Math.abs(Vb - 565.69) < 0.01 && Math.abs(Vp - 1028.5) < 0.1 && Math.abs(Lx - 7.5) < 1e-12, 'inverter motor cable article: 400 V gives a 565.7 V bus, a limit of 1,131 V, 1,029 V at the motor for Zm 500 and Zc 50 (2 Zm / (Zm + Zc) form), a critical length of 7.5 m and 4.525 kV/us'); }
    { const Ax = Math.PI * Math.pow(0.0315, 2), Fx = 0.6e6 * Ax, Rx = (6 + 1.01325) / 1.01325, Vx = Ax * 0.1 * Rx, Ar2 = Ax - Math.PI * Math.pow(0.01, 2), Vy = Ar2 * 0.1 * Rx;
    V(has('pneumatic-cylinder-formulas', '= ' + g4(Ax * 1e6) + ' mm²') && has('pneumatic-cylinder-formulas', '= ' + g4(Fx) + ' N') && has('pneumatic-cylinder-formulas', '= ' + g4(Fx * 0.85) + ' N') && has('pneumatic-cylinder-formulas', '= ' + g4(0.6e6 * Ar2) + ' N') && has('pneumatic-cylinder-formulas', '= ' + g4(Vx * 1000) + ' L') && has('pneumatic-cylinder-formulas', '= ' + g4(Vy * 1000) + ' L') && has('pneumatic-cylinder-formulas', '= ' + g4((Vx + Vy) * 10000) + ' L/min') && Math.abs(Fx - 1870.4) < 0.1 && Math.abs((Vx + Vy) * 1000 - 4.0977) < 1e-3, 'pneumatic article: 63 mm bore at 6 bar pushes 1,870 N (1,590 N at 0.85) and pulls 1,682 N with a 20 mm rod (SI units); a 100 mm stroke uses 2.158 L extend and 1.940 L retract of free air, 40.98 L/min at 10 cycles a minute'); }
    { let th = 35; for (let i = 0; i < 400; i++) { th = 35 + 1600 * 1600 * (1.72e-8 / 1e-3) * (1 + 0.00393 * (th - 20)) / (10 * 0.22); }
    V(has('busbar-temperature-rise-formulas', '= ' + g4(th - 35) + ' K') && has('busbar-temperature-rise-formulas', '= ' + g4(th) + ' °C') && has('busbar-temperature-rise-formulas', '= ' + g4(1600 * 1600 * 1.72e-5) + ' W/m') && has('busbar-temperature-rise-formulas', '= 0.22 m') && Math.abs(th - 35 - 23.0) < 0.1, 'busbar temperature article: 100 x 10 mm copper at 1,600 A in 35 C air rises about 23 K (closed form equals 400 passes of the heat balance), 44.03 W/m at 20 C and a 0.22 m cooling perimeter'); }
    { const T2x = (1.46 - 1.2) / 1.2 * 260 + 25;
    V(has('motor-temperature-rise-formulas', '= ' + g4(T2x) + ' °C') && has('motor-temperature-rise-formulas', '= ' + g4(T2x - 30) + ' K') && has('motor-temperature-rise-formulas', '2^(−10 / 10) = 0.5') && Math.abs(T2x - 81.3333) < 1e-3, 'motor temperature rise article: 1.20 ohm at 25 C reading 1.46 ohm hot is 81.33 C (written as the resistance change times 260 plus 25), a rise of 51.33 K in 30 C ambient, and 10 K over halves the life'); }
    { const ux = 100 * 0.9, ix = ux / 0.9, cx = 30000 / (6000 * ux);
    V(has('battery-storage-efficiency-formulas', '= 90 kWh') && has('battery-storage-efficiency-formulas', '= 100 kWh') && has('battery-storage-efficiency-formulas', '= 10 kWh') && has('battery-storage-efficiency-formulas', '= ' + g4(Math.pow(0.9, 0.5))) && has('battery-storage-efficiency-formulas', '= ' + g4(8 / 0.9)) && has('battery-storage-efficiency-formulas', '= ' + g4(cx) + ' per kWh') && Math.abs(ix - 100) < 1e-9 && Math.abs(cx - 0.055556) < 1e-6, 'battery storage article: 100 kWh at 90% depth gives 90 kWh, needs 100 kWh in at 0.9 round trip (10 kWh lost), one-way 0.9487, 8.889 per delivered kWh at a tariff of 8, and 0.05556 per kWh of throughput'); }
    { const ax = 60 - 60 * Math.exp(-2 / 3), tx = 3 * Math.log(3), kx = 60 * Math.exp(-2 / 3);
    V(has('thermal-time-constant-formulas', '= ' + g4(ax) + ' K') && has('thermal-time-constant-formulas', '= ' + g4(tx) + ' h') && has('thermal-time-constant-formulas', '= ' + g4(kx) + ' K') && has('thermal-time-constant-formulas', '63.21%') && Math.abs(ax - 29.195) < 1e-3 && Math.abs(tx - 3.2958) < 1e-4, 'thermal time constant article: 60 K final rise and tau 3 h reaches 29.2 K after 2 h (60 minus 60 e^-2/3), 40 K takes 3 ln 3 = 3.296 h, cooling leaves 30.81 K after 2 h, and one tau is 63.21%'); }
    { const Ic = 2880 / 48;
    V(has('charge-controller-formulas', '= 60 A') && has('charge-controller-formulas', '= 75 A, so the next size in the example list of 40, 60, 80 and 100 A is 80 A') && has('charge-controller-formulas', '= 300 Ah a day') && has('charge-controller-formulas', '= 50 A') && Math.abs(Ic - 60) < 1e-12 && Math.abs(14400 / 48 - 300) < 1e-12, 'charge controller article: 3 kWp at 0.96 on 48 V is 60 A, 75 A with the 1.25 margin so the 80 A size, 300 Ah a day at 5 sun hours; a PWM controller on 4 x 10 A strings needs 50 A'); }
    { const d30 = 10 / Math.cos(Math.PI / 6), Ex = 5000 * Math.cos(Math.PI / 6) / (d30 * d30);
    V(has('point-illuminance-formulas', '= 50 lx') && has('point-illuminance-formulas', '= ' + g4(Ex) + ' lx') && has('point-illuminance-formulas', '= 5.774 m') && has('point-illuminance-formulas', '= 17.68 lx') && has('point-illuminance-formulas', '= 1,280 cd') && Math.abs(Ex - 32.476) < 1e-3 && Math.abs(10 * Math.sqrt(3) / 3 - 5.7735) < 1e-4, 'point illuminance article: 5,000 cd at 10 m gives 50 lx below, 32.48 lx at 30 degrees (I cos / d squared with d = h / cos), 5.774 m out, 17.68 lx at 45 degrees; 20 lx at 8 m needs 1,280 cd'); }
    { const px = 600 * 500 / 1500, fx = 52 - 2 * (600 / 1500);
    V(has('generator-droop-formulas', '= 4%') && has('generator-droop-formulas', '= 0.5, which is half') && has('generator-droop-formulas', '= 0.4') && has('generator-droop-formulas', '= ' + g4(fx) + ' Hz') && has('generator-droop-formulas', '= ' + g4(px) + ' kW') && has('generator-droop-formulas', '= 400 kW') && Math.abs(fx - 51.2) < 1e-12 && Math.abs(px - 200) < 1e-12, 'generator droop article: 52 Hz no load and 50 Hz full load is 4% droop, 51 Hz is half load; 500 kW and 1,000 kW units sharing 600 kW run at 51.2 Hz with 200 kW and 400 kW'); }
    { const Wa = 8 + 4, Qa = Math.sqrt(3) * 4, ra = (Math.sqrt(3) - Math.tan(Math.PI / 6)) / (Math.sqrt(3) + Math.tan(Math.PI / 6)), pfb2 = 1 / Math.sqrt(13);
    V(has('two-wattmeter-formulas', '= ' + g4(Wa) + ' kW') && has('two-wattmeter-formulas', '= ' + g4(Qa) + ' kVAR') && has('two-wattmeter-formulas', '= 0.5774') && has('two-wattmeter-formulas', '= 0.866') && has('two-wattmeter-formulas', '= 4 kW') && has('two-wattmeter-formulas', '= 13.86 kVAR') && has('two-wattmeter-formulas', '= ' + g4(pfb2)) && has('two-wattmeter-formulas', g4(ra)) && Math.abs(ra - 0.5) < 1e-12, 'two-wattmeter article: 8 and 4 kW give 12 kW, 6.928 kVAR, tan 30 degrees = 0.5774 and pf 0.866; 6 and -2 kW give 4 kW, 13.86 kVAR and pf 0.2774 (1 / sqrt13); the ratio W2 / W1 at 0.866 is 0.5'); }
    { const wb = 1480 * Math.PI / 30, Eb = 0.5 * 2 * wb * wb;
    V(has('braking-resistor-formulas', '= 37.5 Ω') && has('braking-resistor-formulas', '= ' + wb.toFixed(2) + ' rad/s') && has('braking-resistor-formulas', '= ' + g4(Eb / 1000) + ' kJ') && has('braking-resistor-formulas', '= ' + g4(Eb / 4000) + ' kW') && has('braking-resistor-formulas', '= ' + g4(Eb / 60000) + ' kW') && Math.abs(Eb - 24020.4) < 0.1 && Math.abs(750 * 750 / 15000 - 37.5) < 1e-12, 'braking resistor article: 750 V and 15 kW is 37.5 ohm; 2 kg m2 at 1,480 rpm (n pi / 30) holds 24.02 kJ, 6.005 kW over a 4 s stop and 0.4003 kW over a 60 s cycle'); }
    { const Ib = 400 / (Math.sqrt(3) * 0.415);
    V(has('load-bank-test-formulas', '= 400 kW') && has('load-bank-test-formulas', '= 300 kW') && has('load-bank-test-formulas', '= ' + g4(Ib) + ' A') && has('load-bank-test-formulas', '= 80%') && Math.abs(Ib - 556.5) < 0.05, 'load bank article: 500 kVA at 0.8 is 400 kW, 300 kW at 75%, a resistive bank at 400 kW and 415 V draws 556.5 A and loads the alternator to 80% of its kVA'); }
    { const Ih = 10000 / (Math.sqrt(3) * 33), Il = 12500 / (Math.sqrt(3) * 11);
    V(has('transformer-cooling-rating-formulas', '= ' + g4(Ih) + ' A') && has('transformer-cooling-rating-formulas', '= ' + g4(12500 / (Math.sqrt(3) * 33)) + ' A') && has('transformer-cooling-rating-formulas', '= ' + g4(Il) + ' A') && has('transformer-cooling-rating-formulas', '= 90%') && has('transformer-cooling-rating-formulas', '= 72%') && Math.abs(Il - 656.1) < 0.05 && Math.abs(Ih * 3 - 524.9) < 0.1, 'transformer cooling article: 10 / 12.5 MVA at 33 / 11 kV gives 175 A and 218.7 A on the HV side, 524.9 A and 656.1 A on the LV side, and 9 MVA is 90% of ONAN and 72% of ONAF'); }
    { const Pq = (10 / 20) / 1000 * 3600, Mq = 40 * 100;
    V(has('energy-meter-multiplier-formulas', '= ' + g4(Pq) + ' kW') && has('energy-meter-multiplier-formulas', '= 80') && has('energy-meter-multiplier-formulas', '= 144 kW') && has('energy-meter-multiplier-formulas', '= 4,000') && has('energy-meter-multiplier-formulas', '= 50,000 kWh') && Math.abs(Pq - 1.8) < 1e-12 && Mq * 12.5 === 50000, 'energy meter article: 10 pulses in 20 s at 1,000 per kWh is 1.8 kW, x 80 for a 400 / 5 CT gives 144 kW; a 200 / 5 CT with an 11,000 / 110 VT is 4,000, and 12.5 kWh becomes 50,000 kWh'); }
    { const sx = Math.exp(0.02 * Math.log(5)) - 1, tx1 = 0.2 * 0.14 / sx;
    V(has('overcurrent-relay-formulas', '= ' + g4(tx1) + ' s') && has('overcurrent-relay-formulas', '= 0.675 s') && has('overcurrent-relay-formulas', '= 0.6667 s') && Math.abs(tx1 - 0.8559) < 1e-4 && Math.abs(0.2 * 13.5 / 4 - 0.675) < 1e-12 && Math.abs(0.2 * 80 / 24 - 0.66667) < 1e-4, 'overcurrent relay article: 500 A on a 100 A pick-up at TMS 0.2 gives 0.8559 s standard inverse (5^0.02 with exp and log), 0.675 s very inverse and 0.6667 s extremely inverse'); }
    { const Xc9 = 400 * 400 / 100000, Cf = 1 / (2 * Math.PI * 50 * Xc9), wt = 2 * Math.PI * 235, Lalt = 1 / (wt * wt * Cf) * 1000, Qx = 100 * 4.7 * 4.7 / (4.7 * 4.7 - 1), Vx = 400 * 4.7 * 4.7 / (4.7 * 4.7 - 1);
    V(has('harmonic-filter-formulas', '= 1.6 Ω') && has('harmonic-filter-formulas', '= ' + g4(Lalt) + ' mH') && has('harmonic-filter-formulas', '= 235 Hz') && has('harmonic-filter-formulas', '= ' + g4(Qx) + ' kVAR') && has('harmonic-filter-formulas', '= ' + g4(Vx) + ' V') && Math.abs(Qx - 104.74) < 0.01 && Math.abs(Lalt - 0.2306) < 1e-3, 'harmonic filter article: 100 kVAR at 400 V tuned to 4.7 has Xc 1.6 ohm, L from 1 / (w^2 C) at 235 Hz (0.2306 mH), 235 Hz, 104.7 kVAR (Qc h^2 / (h^2 - 1)) and a capacitor voltage of 418.9 V'); }
    { const wS = 2 * Math.PI * 50, XmS = wS * 1e-7 * 2 * Math.LN2 * 1000, IsS = 400 / Math.sqrt(1 + Math.pow(0.3 / XmS, 2)), WsS = 400 * 400 * 0.3 * XmS * XmS / (0.09 + XmS * XmS);
    V(has('sheath-current-formulas', '= ' + g4(XmS) + ' Ω/km') && has('sheath-current-formulas', '= ' + g4(IsS) + ' A') && has('sheath-current-formulas', '= ' + g4(WsS) + ' W/km') && Math.abs(XmS - 0.04355) < 1e-4 && Math.abs(IsS - 57.48) < 0.05, 'sheath current article: trefoil Xm = 0.04355 ohm/km, 400 A with a 0.3 ohm/km sheath gives 57.5 A (1 / sqrt(1 + (Rs / Xm)^2)) and a loss of I^2 Rs Xm^2 / (Rs^2 + Xm^2) per km'); }
    { const IHd = 10e6 / (Math.sqrt(3) * 33e3), sHd = IHd / 200, sLd = 10e6 / (Math.sqrt(3) * 11e3) / 600, sl1 = 0.04 / 0.98 * 100;
    V(has('differential-protection-formulas', '= ' + g4(sHd) + ' A') && has('differential-protection-formulas', '= ' + g4(sLd) + ' A') && has('differential-protection-formulas', '= ' + g4(sl1) + '%') && has('differential-protection-formulas', '= 200%') && has('differential-protection-formulas', '0.45') && has('differential-protection-formulas', '2.7') && Math.abs(sHd - 0.8747) < 1e-3 && Math.abs(0.2 + 0.25 * 10 - 2.7) < 1e-12, 'differential protection article: 10 MVA 33 / 11 kV with 200 / 1 and 600 / 1 CTs gives 0.8747 A on both sides, a 1.00 / 0.96 A through fault is 4.082% slope (restrains), 3 A and 0 A is 200% (trips), and the threshold at Ir = 10 A is 2.7 A'); }
    { const R1e = 100 / (2 * Math.PI * 3) * (Math.log(4 * 3 / 0.008) - 1), R2a = (R1e + 100 / (2 * Math.PI * 3)) / 2, R2b = (R1e + 100 / (2 * Math.PI * 6)) / 2;
    V(has('earth-electrode-spacing-formulas', '= ' + g4(R1e) + ' Ω') && has('earth-electrode-spacing-formulas', '= ' + g4(R2a) + ' Ω') && has('earth-electrode-spacing-formulas', '= ' + g4(R2b) + ' Ω') && has('earth-electrode-spacing-formulas', '= ' + g4(100 / (2 * Math.PI * R1e * 3))) && Math.abs(R1e - 33.49) < 0.01 && Math.abs(R2a - 19.40) < 0.01, 'earth electrode spacing article: one 3 m, 16 mm rod in 100 ohm m is 33.49 ohm (radius form ln(4L / a)), two rods at 3 m are 19.40 ohm and at 6 m 18.07 ohm (written as (R1 + rho / (2 pi s)) / 2)'); }
    { const alS = (90 - 30 - 23.45) * Math.PI / 180, bS = 25 * Math.PI / 180, pS = 2.28 * Math.sin(alS + bS) / Math.sin(alS);
    V(has('solar-row-spacing-formulas', '= 36.55°') && has('solar-row-spacing-formulas', '= ' + g4(pS) + ' m') && has('solar-row-spacing-formulas', '= ' + g4(2.28 / pS)) && Math.abs(pS - 3.367) < 2e-3, 'solar row spacing article: latitude 30 and a tilt of 25 give a noon winter altitude of 36.55 degrees and a pitch of 3.367 m for a 2.28 m row (L sin(a + b) / sin a), GCR 0.677'); }
    { const IdS = 50 / 24, RkS = 1.72e-8 / 1.5e-6 * 1000, dVS = 2 * IdS * RkS * 10 / 1000, LmS = 0.72 / (2 * IdS * 1.72e-8 / 1.5e-6), dE = 2 * 3 * 1.72e-8 / 2.5e-6 * 5;
    V(has('dc-lighting-voltage-drop-formulas', '= ' + g4(dVS) + ' V') && has('dc-lighting-voltage-drop-formulas', g4(dVS / 24 * 100) + '% of 24 V') && has('dc-lighting-voltage-drop-formulas', '= ' + g4(LmS) + ' m') && has('dc-lighting-voltage-drop-formulas', '= ' + g4(dE) + ' V') && has('dc-lighting-voltage-drop-formulas', '= ' + g4(dE / 2) + ' V') && Math.abs(dVS - 0.4777) < 1e-3 && Math.abs(LmS - 15.07) < 0.01, 'DC lighting voltage drop article: 50 W at 24 V over 10 m of 1.5 mm2 copper drops 0.4777 V (1.99%, from ohm per km), the longest run for 3% is 15.07 m, and a 72 W strip on 5 m of 2.5 mm2 drops 0.2064 V at the end and half of that spread out'); }
    { const fx = (t) => Math.exp(15000 * (t - 110) / (383 * (t + 273)));
    V(has('transformer-loss-of-life-formulas', '= 110 °C') && has('transformer-loss-of-life-formulas', '= ' + g4(fx(130))) && has('transformer-loss-of-life-formulas', '= ' + g4(24 * fx(130)) + ' h') && has('transformer-loss-of-life-formulas', '= ' + g4(180000 / fx(130)) + ' h') && Math.abs(fx(110) - 1) < 1e-12 && Math.abs(fx(130) - 6.98) < 0.01, 'transformer loss of life article: 30 + 55 + 25 is 110 C with a factor of 1, 130 C gives a factor of 6.98 (written as one exponent), 167.5 h of life used in a day and 25,790 h of life'); }
    { const zr = 0.15 * 1.72e-8 / 70e-6 * 1000, zx = 0.15 * 0.08, c = 0.3, s = Math.sqrt(0.91), dv = Math.sqrt(3) * 570 * (zr * c + zx * s);
    V(has('motor-start-voltage-dip-formulas', '= 570 A') && has('motor-start-voltage-dip-formulas', '= ' + g4(dv) + ' V') && has('motor-start-voltage-dip-formulas', '= ' + g4(dv / 415 * 100) + '%') && has('motor-start-voltage-dip-formulas', '= ' + g4(0.1 * 415 / (Math.sqrt(3) * 570 * (zr / 0.15 * c + 0.08 * s)) * 1000) + ' m') && dv > 22 && dv < 22.5, 'motor start voltage dip article: 95 A at a ratio of 6 is 570 A, and on 150 m of 70 mm2 copper (0.2457 ohm/km, 0.08 ohm/km) at a starting pf of 0.3 the line drop and the longest cable for 10% follow the resistive and reactive parts separately'); }
    { const Ig = 400, Vph = 11000 / Math.sqrt(3), Pf = Vph * Ig;
    V(has('neutral-earthing-resistor-formulas', '= ' + g4(Vph) + ' V') && has('neutral-earthing-resistor-formulas', '= ' + g4(Vph / Ig) + ' Ω') && has('neutral-earthing-resistor-formulas', '= ' + g4(Pf / 1e6) + ' MW') && has('neutral-earthing-resistor-formulas', '= ' + g4(Pf * 10 / 1e6) + ' MJ') && Math.abs(Vph / Ig - 15.88) < 0.01 && Math.abs(Pf / 1e6 - 2.540) < 1e-3, 'neutral earthing resistor article: 11 kV with a 400 A limit is 6,351 V phase voltage, 15.88 ohm, 2.540 MW (phase voltage times current) and 25.40 MJ for 10 s'); }
    { const w = 143 * 35, q = w * w;
    V(has('cable-it-withstand-formulas', '= ' + g4(q) + ' A²s') && has('cable-it-withstand-formulas', '= ' + g4(Math.pow(w / 10000, 2)) + ' s') && has('cable-it-withstand-formulas', '= ' + g4(Math.pow(w / 2000, 2)) + ' s') && Math.abs(10000 * Math.sqrt(0.2) / 143 - 31.27) < 0.01 && Math.abs(q - 25050025) < 1, 'cable I2t article: 35 mm2 XLPE copper holds 25.05 million A2s, 0.2505 s at 10 kA (the same k as the 31.27 mm2 at 0.2 s on the cable size page) and 6.263 s at 2 kA, and a device that lets through 0.8 million A2s is below it'); }
    { const kv = 50 * 6.3, Ilr9 = 50 * 6.3 * 1000 / (Math.sqrt(3) * 460);
    V(has('motor-code-letter-formulas', '= ' + g4(kv) + ' kVA') && has('motor-code-letter-formulas', '= ' + g4(Ilr9) + ' A') && has('motor-code-letter-formulas', '= 6.3 kVA/hp') && Math.abs(Ilr9 - 395.4) < 0.05, 'motor code letter article: 50 hp with code G at 6.3 kVA/hp is 315 kVA and 395.4 A at 460 V, and the current converts back to 6.3 kVA/hp'); }
    { V(has('synchronous-speed-formulas', '= 1,500 rpm') && has('synchronous-speed-formulas', '= 1,800 rpm') && has('synchronous-speed-formulas', '= 8 poles') && has('synchronous-speed-formulas', '= 49.33 Hz') && Math.abs(4 * 1480 / 120 - 49.3333) < 1e-3, 'synchronous speed article: 4 poles give 1,500 rpm at 50 Hz and 1,800 rpm at 60 Hz, 750 rpm at 50 Hz needs 8 poles and a 4-pole alternator at 1,480 rpm gives 49.33 Hz'); }
    { V(has('battery-c-rate-formulas', '= 0.5 C') && has('battery-c-rate-formulas', '= 2 h') && has('battery-c-rate-formulas', '= 0.2 C') && has('battery-c-rate-formulas', '= 5 h') && has('battery-c-rate-formulas', '= 30 A') && has('battery-c-rate-formulas', '= 2.4 kW') && has('battery-c-rate-formulas', '= 24,000 kWh') && has('battery-c-rate-formulas', '= ' + g4(3000 / 365) + ' years') && Math.abs(100 / 50 - 2) < 1e-12, 'battery C-rate article: 100 Ah at 50 A is 0.5 C and 2 h, at 20 A 0.2 C and 5 h, 0.3 C is 30 A, 48 V at 50 A is 2.4 kW, and 10 kWh at 80% for 3,000 cycles is 24,000 kWh over 8.219 years'); }
    { const En3 = 60 * 0.6, Eg3 = En3 / 0.9;
    V(has('ev-charging-time-formulas', '= 36 kWh') && has('ev-charging-time-formulas', '= 40 kWh') && has('ev-charging-time-formulas', '= ' + g4(40 / 7.4) + ' h') && has('ev-charging-time-formulas', '= 7.36 kW') && has('ev-charging-time-formulas', '= ' + g4(32 * 400 * Math.sqrt(3) / 1000) + ' kW') && has('ev-charging-time-formulas', '= 0.72 h') && Math.abs(Eg3 - 40) < 1e-9 && Math.abs(40 / 7.4 - 5.405) < 1e-3, 'EV charging article: 60 kWh from 20% to 80% is 36 kWh, 40 kWh from the supply at 90%, 5.405 h at 7.4 kW; 230 V at 32 A is 7.36 kW and 400 V three-phase 22.17 kW; 36 kWh at 50 kW is 0.72 h'); }
    { const md = 100 / 3.6, g = 9.81, Pb = md * g * (0.03 * 50 + 5) + 0.03 * g * 50 * 15 * 2;
    V(has('conveyor-belt-power-formulas', '= ' + g4(md) + ' kg/s') && has('conveyor-belt-power-formulas', '= ' + g4(md * g * 5) + ' W') && has('conveyor-belt-power-formulas', '= ' + g4(Pb) + ' W') && has('conveyor-belt-power-formulas', '= ' + g4(Pb / 0.85) + ' W') && Math.abs(Pb - 2213.3) < 1 && Math.abs(md - 27.778) < 1e-3, 'conveyor belt article: 100 t/h is 27.78 kg/s, lifting 5 m takes 1,363 W, and the total at the drum (mass flow times g times (mu L + h) plus the belt friction term) is about 2,213 W, 2,604 W at the motor at 85%'); }
    { const e0x = 1 / (4 * Math.PI * 1e-7 * 299792458 * 299792458), c0 = e0x * 0.01 / 0.001;
    V(has('parallel-plate-capacitor-formulas', '= ' + g4(c0 * 1e12) + ' pF') && has('parallel-plate-capacitor-formulas', '= ' + g4(4 * c0 * 1e12) + ' pF') && has('parallel-plate-capacitor-formulas', '= ' + g4(4 * c0 * 100 * 1e9) + ' nC') && has('parallel-plate-capacitor-formulas', '= ' + g4(0.5 * 4 * c0 * 1e4 * 1e6) + ' µJ') && has('parallel-plate-capacitor-formulas', '= 100 kV/m') && Math.abs(c0 * 1e12 - 88.54) < 0.01, 'parallel plate capacitor article: 100 cm2 and 1 mm in air is 88.54 pF (eps0 from 1 / (mu0 c^2)), 354.2 pF with a relative permittivity of 4, 35.42 nC and 1.771 uJ at 100 V, field 100 kV/m'); }
    { const Nx = 500, Ax = Math.PI * 1e-4, Lx = Nx * (4 * Math.PI * 1e-7 * Nx * 2 / 0.1 * Ax) / 2;
    V(has('solenoid-inductance-formulas', '= ' + g4(Ax * 1e6) + ' mm²') && has('solenoid-inductance-formulas', '= ' + g4(Lx * 1000) + ' mH') && has('solenoid-inductance-formulas', '= ' + g4(4 * Math.PI * 1e-7 * 500 * 2 / 0.1 * 1000) + ' mT') && has('solenoid-inductance-formulas', '= ' + g4(0.5 * Lx * 4 * 1000) + ' mJ') && has('solenoid-inductance-formulas', '= ' + g4(200 * Lx * 1000) + ' mH') && Math.abs(Lx * 1000 - 0.987) < 1e-3, 'solenoid inductance article: 500 turns on 100 mm and 20 mm diameter gives 314.2 mm2, 0.987 mH in air (as N times flux over current), 12.57 mT and 1.974 mJ at 2 A, and 197.4 mH at a relative permeability of 200'); }
    { const Qx = 500 * (Math.sin(Math.acos(0.8)) / 0.8 - Math.sin(Math.acos(0.95)) / 0.95), dSx = 500 / 0.8 - 500 / 0.95, sx = dSx * 400, cx = Qx * 1500;
    V(has('pf-correction-payback-formulas', '= ' + g4(Qx) + ' kVAR') && has('pf-correction-payback-formulas', '= ' + g4(dSx) + ' kVA') && has('pf-correction-payback-formulas', '= ' + g4(sx) + ' a month') && has('pf-correction-payback-formulas', '= ' + g4(cx / sx) + ' months') && Math.abs(Qx - 210.66) < 0.01 && Math.abs(dSx - 98.68) < 0.01, 'power factor correction payback article: 500 kW from 0.8 to 0.95 needs 210.7 kVAR (from sine over cosine) and cuts the demand by 98.68 kVA, a saving of 39,470 a month at 400 per kVA, and a payback of 8.0 months at 1,500 per kVAR'); }
    { const ILx = 1e6 / (Math.sqrt(3) * 415), IHx = 1e6 / (Math.sqrt(3) * 11000), ILi = 1e6 / (Math.sqrt(3) * 415 * 0.05), ILf = 1e6 / (Math.sqrt(3) * 415 * 0.054), IHf = 1e6 / (Math.sqrt(3) * 11000 * 0.054);
    V(has('transformer-through-fault-formulas', '= ' + g4(IHx) + ' A') && has('transformer-through-fault-formulas', '= ' + g4(ILx) + ' A') && has('transformer-through-fault-formulas', '= ' + g4(ILi) + ' A') && has('transformer-through-fault-formulas', '= 0.4%') && has('transformer-through-fault-formulas', '= ' + g4(ILf) + ' A') && has('transformer-through-fault-formulas', 'to ' + g4(Math.pow(0.05 / 0.054, 2) * 100) + '% of') && has('transformer-through-fault-formulas', '= ' + g4(IHf * IHf * 2) + ' A²s') && Math.abs(ILi - 27824) < 1 && Math.abs(ILf - 25763) < 1, 'transformer through-fault article: 1 MVA 11 kV / 415 V at 5% has rated currents of 52.49 A and 1,391 A, an infinite-source LV fault of 27.82 kA, 25.76 kA with a 250 MVA source (5.4% in total), a force of 85.73% of the infinite value and 1.886 million A2s over 2 s'); }
    { const Phx = 1.5 * 0.012, Etx = 2 * Math.PI * 50 * Phx / Math.SQRT2, Nx = 11000 / Etx;
    V(has('transformer-emf-formulas', '= ' + g4(Phx) + ' Wb') && has('transformer-emf-formulas', '= ' + g4(Etx) + ' V per turn') && has('transformer-emf-formulas', 'so ' + Math.round(Nx) + ' turns') && has('transformer-emf-formulas', 'so ' + Math.round(415 / Etx) + ' turns') && Math.abs(Etx - 3.9986) < 1e-3 && Math.round(Nx) === 2751, 'transformer EMF article: a core of 0.012 m2 at 1.5 T gives 0.018 Wb, 3.999 V per turn (written as 2 pi f flux over sqrt 2), 2,751 turns for 11,000 V and 104 turns for 415 V'); }
    { const Rax = 30 * 90 / 180, Rbx = 30 * 60 / 180, Rcx = 60 * 90 / 180, spx = Rax * Rbx + Rbx * Rcx + Rcx * Rax;
    V(has('delta-star-resistor-formulas', 'Ra = 30 × 90 / 180 = ' + g4(Rax) + ' Ω') && has('delta-star-resistor-formulas', '= ' + g4(Rbx) + ' Ω') && has('delta-star-resistor-formulas', '= ' + g4(Rcx) + ' Ω') && has('delta-star-resistor-formulas', '= ' + g4(spx) + ' Ω²') && Math.abs(spx / Rcx - 30) < 1e-9 && Math.abs(spx / Rax - 60) < 1e-9 && Math.abs(spx / Rbx - 90) < 1e-9, 'delta-star resistor article: a delta of 30, 60 and 90 ohm is a star of 15, 10 and 30 ohm, and converting back gives 30, 60 and 90 ohm again (the sum of products is 900)'); }
    { V(has('current-shunt-formulas', '= 0.75 mΩ') && has('current-shunt-formulas', '= 7.5 W') && has('current-shunt-formulas', '= 56 A') && has('current-shunt-formulas', '= 5 mΩ') && has('current-shunt-formulas', '= 2 W') && Math.abs(0.075 * 100 - 7.5) < 1e-12 && Math.abs(0.042 / 0.075 * 100 - 56) < 1e-9, 'current shunt article: 75 mV at 100 A is 0.75 mohm and 7.5 W (V times I), 42 mV reads 56 A, and 100 mV at 20 A is 5 mohm and 2 W'); }
    { const E0x = 10 * 5.2 * 365 * 0.8, r = 0.995, y25 = E0x * 0.98 * Math.pow(r, 24), tot25 = E0x * 0.98 * (1 - Math.pow(r, 25)) / (1 - r);
    V(has('solar-yield-degradation-formulas', '= ' + g4(E0x) + ' kWh a year') && has('solar-yield-degradation-formulas', '= ' + g4(E0x / 10) + ' kWh per kWp') && has('solar-yield-degradation-formulas', '= ' + g4(E0x * 0.98) + ' kWh') && has('solar-yield-degradation-formulas', '= ' + g4(y25) + ' kWh') && has('solar-yield-degradation-formulas', '= ' + g4(tot25) + ' kWh') && Math.abs(E0x - 15184) < 1e-6, 'solar yield article: 10 kWp at 5.2 peak sun hours and 0.8 is 15,184 kWh a year (1,518 kWh per kWp), year 25 follows 0.98 times 0.995^24, and the 25 year total is the geometric sum'); }
    { const Q = 10 * 3600, mol = Q / (2 * 96485), mg = mol * 63.55, mq = mg * 0.95, tq = (25e-4 * 100 * 8.96) / 63.55 * 2 * 96485 / 0.95 / 10;
    V(has('electrolysis-faraday-formulas', '= ' + g4(mg) + ' g') && has('electrolysis-faraday-formulas', '= ' + g4(mq) + ' g') && has('electrolysis-faraday-formulas', '= ' + g4(mq / 8.96 / 100 * 1e4) + ' µm') && has('electrolysis-faraday-formulas', '= ' + g4(tq) + ' s') && Math.abs(mg - 11.856) < 1e-3 && Math.abs(tq - 715.97) < 0.05, 'electrolysis article: 10 A for 1 h is 36,000 C, 0.1866 mol of copper (11.86 g), 11.26 g at 95%, a coating of 125.7 um on 100 cm2, and 25 um takes 716 s'); }
    /* v1.45.0: the six AGL guides. Values are written again here from the formulas and tied to the calculators through E.api. */
    { const lamp = 60 * 45 / 0.85, cab = 6.6 * 6.6 * 3.08 * 4, Pt = lamp + cab, Vo = Pt / 6.6, need = Pt / 0.8, pct = Pt / 7500 * 100;
    const e = E.api('agl-ccr-loading', { n: 60, Pl: 45, et: 0.85, I: 6.6, L: 4000, R: 3.08, ld: 0.8 }).outputs;
    V(has('agl-series-circuit-load-formulas', '= ' + g4(lamp) + ' W') && has('agl-series-circuit-load-formulas', '= ' + g4(cab) + ' W') && has('agl-series-circuit-load-formulas', '= ' + g4(Pt) + ' W') && has('agl-series-circuit-load-formulas', '= ' + g4(Vo) + ' V') && has('agl-series-circuit-load-formulas', '= ' + g4(need / 1000) + ' kW, so the smallest standard size is 7.5 kW') && has('agl-series-circuit-load-formulas', '= ' + g4(pct) + '%') && Math.abs(Pt - 3713.13) < 0.01 && Math.abs(Vo - 562.595) < 0.001 && Math.abs(pct - 49.5084) < 0.001 && close(e.Pt.value, Pt / 1000, 1e-9) && close(e.Vo.value, Vo, 1e-9) && e.ccr.value === 7.5, 'AGL series circuit article: 60 fittings of 45 W at 0.85 and 4 km of 3.08 ohm/km at 6.6 A load the regulator with 3,713 W at 562.6 V, which needs 4.641 kW and so the 7.5 kW size (49.51% loaded), and it agrees with the AGL CCR sizing calculator'); }
    { const use = 0.8 * 10000, cab = 6.6 * 6.6 * 3.08 * 4, per = 45 / 0.85, n = Math.floor((use - cab) / per), Pt = n * per + cab;
    const e = E.api('agl-max-fittings', { Pr: 10, Pl: 45, et: 0.85, I: 6.6, L: 4000, R: 3.08, ld: 0.8 }).outputs;
    const mx = (km) => Math.floor((use - 6.6 * 6.6 * 3.08 * km * 1) / per);
    V(has('agl-max-fittings-formulas', '= ' + g4(use) + ' W') && has('agl-max-fittings-formulas', '= ' + g4(per) + ' W') && has('agl-max-fittings-formulas', '= ⌊' + ((use - cab) / per).toFixed(2) + '⌋ = ' + n) && has('agl-max-fittings-formulas', '= ' + g4(Pt) + ' W, which is ' + g4(Pt / 100) + '% of the rating') && n === 140 && Math.abs(Pt - 7948.424) < 0.01 && e.nmax.value === n && close(e.Pt.value, Pt / 1000, 1e-9) && [2, 4, 6, 8].every((km, i) => has('agl-max-fittings-formulas', g4(6.6 * 6.6 * 3.08 * km) + ' W ' + mx(km) + (i < 3 ? ' ' : '')) || has('agl-max-fittings-formulas', g4(6.6 * 6.6 * 3.08 * km) + ' W ' + mx(km))), 'AGL maximum fittings article: a 10 kW regulator at 80% gives 8,000 W, 4 km at 6.6 A loses 536.7 W, each fitting loads 52.94 W, so 140 fittings fit (7,948 W), and it agrees with the AGL maximum fittings calculator; the length table gives 2, 4, 6 and 8 km');
    V(has('agl-max-fittings-formulas', String(mx(2))) && mx(2) > mx(4) + 0 && mx(4) > mx(6) && mx(6) > mx(8), 'AGL maximum fittings article: a longer cable always carries fewer fittings'); }
    { const Is = 6.6 * 6.6 / 6.6, Vs = 45 / Is, Pin = 45 / 0.85, Vp = Pin / 6.6, Is2 = 3.4 * 20 / 6.6, Vs2 = 30 / Is2, Pin2 = 30 / 0.8, Vp2 = Pin2 / 3.4;
    const e = E.api('agl-isolating-transformer', { Ip: 6.6, Ipr: 6.6, Isr: 6.6, Pl: 45, Pt: 100, et: 0.85 }).outputs, e2 = E.api('agl-isolating-transformer', { Ip: 3.4, Ipr: 6.6, Isr: 20, Pl: 30, Pt: 200, et: 0.8 }).outputs;
    V(has('agl-isolating-transformer-formulas', '= ' + g4(Vs) + ' V') && has('agl-isolating-transformer-formulas', '= ' + g4(Pin) + ' W') && has('agl-isolating-transformer-formulas', '= ' + g4(Vp) + ' V') && has('agl-isolating-transformer-formulas', '= 45%') && has('agl-isolating-transformer-formulas', '= ' + g4(Is2) + ' A') && has('agl-isolating-transformer-formulas', '= ' + g4(Vs2) + ' V') && has('agl-isolating-transformer-formulas', '= ' + g4(Vp2) + ' V') && has('agl-isolating-transformer-formulas', '= 15%') && Math.abs(Vs - 6.818182) < 1e-6 && Math.abs(Vp - 8.02139) < 1e-5 && Math.abs(Is2 - 10.30303) < 1e-5 && close(e.Vs.value, Vs, 1e-9) && close(e.Vp.value, Vp, 1e-9) && close(e2.Is.value, Is2, 1e-9) && close(e2.Vp.value, Vp2, 1e-9) && [2.8, 3.4, 4.1, 5.2, 6.6].every((i) => has('agl-isolating-transformer-formulas', g4(i) + ' A ' + g4(i * 20 / 6.6) + ' A')), 'AGL isolating transformer article: a 6.6/6.6 A unit with a 45 W lamp gives 6.818 V, 52.94 W and 8.021 V (45% of 100 W), a 6.6/20 A unit at 3.4 A gives 10.30 A, 2.912 V and 11.03 V (15% of 200 W), the secondary-current table follows I x 20 / 6.6, and it agrees with the calculator'); }
    { const eff = (e) => { const Pin = 3713 / e, S = Pin / 0.9, Q = Math.sqrt(S * S - Pin * Pin), E1 = Pin * 4380 / 1000; return { Pin, S, Q, E1, cost: E1 * 8 }; }, x = eff(0.9);
    const e = E.api('agl-ccr-input-energy', { Po: 3.713, ec: 0.9, pf: 0.9, h: 4380, tar: 8 }).outputs;
    V(has('agl-ccr-input-energy-formulas', '= ' + g4(x.Pin) + ' W') && has('agl-ccr-input-energy-formulas', '= ' + g4(x.S) + ' VA') && has('agl-ccr-input-energy-formulas', '= ' + g4(x.Q) + ' var') && has('agl-ccr-input-energy-formulas', '= ' + g4(x.E1) + ' kWh') && has('agl-ccr-input-energy-formulas', '= ' + g4(x.cost)) && Math.abs(x.Pin - 4125.556) < 0.001 && Math.abs(x.Q - 1998.098) < 0.01 && Math.abs(x.E1 - 18069.93) < 0.01 && close(e.Pin.value, x.Pin / 1000, 1e-9) && close(e.Q.value, x.Q / 1000, 1e-9) && close(e.E.value, x.E1, 1e-9) && close(e.cost.value, x.cost, 1e-9) && [0.85, 0.9, 0.95].every((c) => has('agl-ccr-input-energy-formulas', g4(c) + ' ' + g4(eff(c).Pin / 1000) + ' kW ' + g4(eff(c).E1) + ' kWh ' + g4(eff(c).cost))) && eff(0.85).E1 > eff(0.9).E1 && eff(0.9).E1 > eff(0.95).E1, 'AGL CCR energy article: 3,713 W at 90% and pf 0.9 draws 4,126 W, 4,584 VA and 1,998 var, 18,070 kWh in 4,380 h and costs 144,559 at 8 per kWh, a better regulator uses less, and it agrees with the calculator'); }
    { const at = (I) => { const r = I / 6.6, lamp = 60 * 45 * r * r / 0.85, cab = I * I * 3.08 * 4, Pt = lamp + cab; return { r, lamp, cab, Pt, Vo: Pt / I }; }, s1 = at(2.8), f = at(6.6);
    const e = E.api('agl-brightness-steps', { ct: 1, b: 1, n: 60, Pl: 45, et: 0.85, L: 4000, R: 3.08, k: 2 }).outputs;
    V(has('agl-brightness-step-formulas', '= ' + g4(s1.r) + ', which is ' + g4(s1.r * 100) + '% of full current') && has('agl-brightness-step-formulas', '= ' + g4(s1.lamp) + ' W') && has('agl-brightness-step-formulas', '= ' + g4(s1.cab) + ' W') && has('agl-brightness-step-formulas', 'Pt = ' + g4(s1.Pt) + ' W and Vout = ' + g4(s1.Pt) + ' / 2.8 = ' + g4(s1.Vo) + ' V') && has('agl-brightness-step-formulas', 'The load is ' + g4(s1.Pt / f.Pt * 100) + '%') && Math.abs(s1.Pt - 668.295168) < 1e-5 && Math.abs(s1.Vo - 238.676846) < 1e-5 && Math.abs(f.Pt - 3713.13) < 0.01 && close(e.Pt.value, s1.Pt / 1000, 1e-9) && close(e.Vo.value, s1.Vo, 1e-9) && close(e.pL.value, s1.Pt / f.Pt * 100, 1e-9) && [2.8, 3.4, 4.1, 5.2, 6.6].every((i) => has('agl-brightness-step-formulas', g4(i) + ' A ' + g4(i / 6.6 * 100) + '% ' + g4(at(i).Pt / 1000) + ' kW ' + g4(at(i).Vo) + ' V')) && [2.8, 3.4, 4.1, 5.2].every((i, j, a) => at(i).Pt < at([3.4, 4.1, 5.2, 6.6][j]).Pt), 'AGL brightness step article: step 1 at 2.8 A is 42.42% of full current, loads 668.3 W at 238.7 V (18.00% of the 3,713 W at 6.6 A), every step of the table is computed from the same formulas, the load rises with every step, and it agrees with the calculator'); }
    { const m = Math.log(2000 / 1000) / Math.log(6.6 / 6.1), life = (i) => 1000 * Math.pow(i / 6.6, -m), T3 = life(6.3), rep = 60 * 4380 / T3, T5 = life(5.2);
    const e = E.api('agl-lamp-life-curve', { I1: 6.6, T1: 1000, I2: 6.1, T2: 2000, I3: 6.3, n: 60, H: 4380 }), e5 = E.api('agl-lamp-life-curve', { I1: 6.6, T1: 1000, I2: 6.1, T2: 2000, I3: 5.2, n: 60, H: 4380 }).outputs;
    V(has('agl-lamp-life-formulas', '= ' + g4(m)) && has('agl-lamp-life-formulas', '= ' + g4(T3) + ' h') && has('agl-lamp-life-formulas', '= ' + g4(T3 / 1000) + ' times the first reading') && has('agl-lamp-life-formulas', '= ' + g4(rep) + ' a year') && has('agl-lamp-life-formulas', '= ' + g4(T5) + ' h, which is below the lower reading') && Math.abs(m - 8.79842) < 0.0001 && Math.abs(life(6.1) - 2000) < 1e-9 && Math.abs(life(6.6) - 1000) < 1e-9 && T3 > 1000 && T3 < 2000 && T5 > 2000 && close(e.outputs.m.value, m, 1e-9) && close(e.outputs.T3.value, T3, 1e-9) && close(e.outputs.rep.value, rep, 1e-9) && close(e5.T3.value, T5, 1e-9) && [6.6, 6.3, 6.1, 5.8, 5.5, 5.2].every((i) => has('agl-lamp-life-formulas', g4(i) + ' A ' + g4(life(i)) + ' h')), 'AGL lamp life article: 1,000 h at 6.6 A and 2,000 h at 6.1 A give m = 8.798 (the curve passes through both readings), 6.3 A gives a life between them, 5.2 A is flagged as beyond the readings, the table follows the same law, and it agrees with the calculator'); }
    { const cl = (x, y) => Math.abs(x - y) <= 1e-9 * Math.max(1, Math.abs(y)), mu = [3 * 1 - 4 * (-2), 3 * (-2) + 4 * 1], mm = Math.sqrt(mu[0] ** 2 + mu[1] ** 2), ma = Math.atan2(mu[1], mu[0]) * 180 / Math.PI, dv = [(3 * 1 + 4 * (-2)) / 5, (4 * 1 - 3 * (-2)) / 5], dm = Math.sqrt(dv[0] ** 2 + dv[1] ** 2), da = Math.atan2(dv[1], dv[0]) * 180 / Math.PI, zm = Math.sqrt(200), pfz = Math.cos(Math.PI / 4);
    const e = E.api('complex-number', { a: 3, b: 4, op: 3, c: 1, d: -2 }).outputs, e2 = E.api('complex-number', { a: 3, b: 4, op: 4, c: 1, d: -2 }).outputs;
    V(has('complex-number-formulas', '= ' + g4(mu[0]) + ' − j' + g4(Math.abs(mu[1]))) && has('complex-number-formulas', g4(mm) + ' ∠' + g4(ma) + '°') && has('complex-number-formulas', '= ' + g4(dv[0]) + ' + j' + g4(dv[1]) + ' = ' + g4(dm) + ' ∠' + g4(da) + '°') && has('complex-number-formulas', '= ' + g4(zm) + ' Ω') && has('complex-number-formulas', 'is cos θ = ' + g4(pfz) + ' lagging') && mu[0] === 11 && mu[1] === -2 && Math.abs(dm - Math.sqrt(5)) < 1e-12 && Math.abs(da - 116.565051177) < 1e-6 && cl(e.mag.value, mm) && cl(e.ang.value, ma) && cl(e2.re.value, dv[0]) && cl(e2.im.value, dv[1]) && cl(e2.ang.value, da), 'complex number article: (3 + j4)(1 − j2) = 11 − j2 = 11.18 ∠−10.3°, the quotient is −1 + j2, 10 + j10 Ω is 14.14 Ω ∠45° with power factor 0.7071, and the calculator agrees'); }
    { const DEG = Math.PI / 180, phiT = Math.acos(0.8), qT = 100 * Math.tan(phiT), e = E.api('trig-functions', { x: phiT * 180 / Math.PI, u: 1 }).outputs, e150 = E.api('trig-functions', { x: 150, u: 1 }).outputs;
    V(has('trigonometry-formulas', '= ' + g4(phiT / DEG) + '°') && has('trigonometry-formulas', '= ' + g4(qT) + ' kVAR') && has('trigonometry-formulas', '= 125 kVA') && has('trigonometry-formulas', g4(150 * DEG) + ' rad') && Math.abs(phiT / DEG - 36.8698976) < 1e-6 && Math.abs(qT - 75) < 1e-9 && close(e.cos.value, 0.8, 1e-9) && close(e.tan.value, 0.75, 1e-9) && close(e150.sin.value, 0.5, 1e-9) && close(e150.cos.value, -Math.sqrt(3) / 2, 1e-9), 'trigonometry article: a power factor of 0.8 is 36.87° with tan 0.75, so 100 kW needs 75 kVAR and 125 kVA, 150° is 2.618 rad with sin 0.5 and cos −0.866, and the calculator agrees'); }
    { const nCr = (a, b) => { let c = 1; for (let j = 1; j <= b; j++) c = c * (a - b + j) / j; return Math.round(c); }, pm = (n, p, k) => nCr(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
    const eb = E.api('binomial-distribution', { n: 20, p: 0.05, k: 2 }).outputs, ec = E.api('permutations-combinations', { n: 10, r: 3 }).outputs, ep = E.api('probability-calculator', { pa: 0.02, pb: 0.02, rel: 1, pab: '', n: 5 }).outputs;
    const le2 = pm(20, 0.05, 0) + pm(20, 0.05, 1) + pm(20, 0.05, 2);
    V(has('probability-formulas', '= ' + g4(0.0004)) && has('probability-formulas', '= ' + g4(0.0396)) && has('probability-formulas', '= ' + g4(1 - Math.pow(0.98, 5))) && has('probability-formulas', '10P3 = 10 × 9 × 8 = 720') && has('probability-formulas', '10C3 = 720 / 3! = 120') && has('probability-formulas', '= ' + g4(pm(20, 0.05, 2))) && has('probability-formulas', '= ' + g4(le2)) && has('probability-formulas', '= ' + g4(1 - le2)) && close(eb.pk.value, pm(20, 0.05, 2), 1e-9) && close(eb.ple.value, le2, 1e-9) && close(eb.pge.value, 1 - le2 + pm(20, 0.05, 2), 1e-9) && close(eb.mean.value, 1, 1e-12) && close(eb.var.value, 0.95, 1e-12) && ec.perm.value === 720 && ec.comb.value === 120 && close(ep.pand.value, 0.0004, 1e-9) && close(ep.por.value, 0.0396, 1e-9) && close(ep.pany.value, 1 - Math.pow(0.98, 5), 1e-9), 'probability article: two units at 0.02 fail together with 0.0004 and one or the other with 0.0396, 10P3 = 720 and 10C3 = 120, 20 lamps at 5% give exactly 2 failing with 0.1887 and a mean of 1, and the three calculators agree'); }
    ['agl-series-circuit-load-formulas', 'agl-max-fittings-formulas', 'agl-isolating-transformer-formulas', 'agl-ccr-input-energy-formulas', 'agl-brightness-step-formulas', 'agl-lamp-life-formulas'].forEach((sl) => { const h = PG[sl + '.html']; V(/<table>/.test(h) && (h.match(/<ol class="steps">/g) || []).length >= 1 && (h.match(/<h3>/g) || []).length >= 4 && h.indexOf('../calculators/airport-agl-engineering/') > 0 && h.indexOf('<h1>') > 0, sl + ': has a formula table, a worked example, at least four FAQ entries and a link to the Airport and AGL calculators'); });
    V(['agl-ccr-loading', 'agl-max-fittings', 'agl-isolating-transformer', 'agl-ccr-input-energy', 'agl-brightness-steps', 'agl-lamp-life-curve'].every((id) => require(path.join(__dirname, '..', 'tools', 'calc_articles.js')).BY_CALC[id].some((g) => /^agl-/.test(g))) && Object.keys(require(path.join(__dirname, '..', 'tools', 'calc_articles.js')).NO_GUIDE).length === 0, 'every one of the six AGL calculators has its own AGL guide and no calculator is left without a guide');
    ['three-phase-power-formulas', 'power-factor-formulas', 'ac-circuit-formulas', 'voltage-drop-formulas', 'transformer-formulas', 'motor-formulas', 'lighting-formulas', 'battery-formulas', 'solar-pv-formulas', 'capacitor-formulas', 'earthing-formulas', 'cable-sizing-formulas', 'energy-cost-formulas', 'generator-formulas', 'ups-formulas', 'harmonics-formulas', 'short-circuit-formulas', 'unbalance-formulas', 'resistor-formulas', 'motor-starting-formulas', 'circuit-breaker-formulas', 'cooling-formulas', 'heating-formulas', 'per-unit-formulas', 'led-formulas', 'conduit-fill-formulas', 'lightning-protection-formulas', 'transformer-efficiency-formulas', 'pump-formulas', 'fan-formulas', 'inductor-formulas', 'rms-waveform-formulas', 'resonance-formulas', 'motor-efficiency-formulas', 'demand-load-factor-formulas', 'cable-tray-fill-formulas', 'conductor-resistance-formulas', 'transmission-line-formulas', 'star-delta-formulas', 'loop-4-20ma-formulas', 'cable-loss-formulas', 'op-amp-formulas', '555-timer-formulas', 'thevenin-norton-formulas', 'wheatstone-bridge-formulas', 'conductor-force-formulas', 'ct-burden-formulas', 'gear-drive-formulas', 'skin-effect-formulas', 'rc-filter-formulas', 'rectifier-ripple-formulas', 'buck-boost-converter-formulas', 'heat-sink-formulas', 'battery-pack-formulas', 'motor-acceleration-time-formulas', 'zener-regulator-formulas', 'bjt-bias-formulas', 'pt100-rtd-formulas', 'thermistor-formulas', 'fusing-current-formulas', 'flywheel-energy-formulas', 'linear-regulator-formulas', 'mosfet-loss-formulas', 'relay-coil-formulas', 'transformer-inrush-formulas', 'battery-charge-time-formulas', 'wind-turbine-power-formulas', 'detuning-reactor-formulas', 'tap-changer-formulas', 'cable-pulling-tension-formulas', 'insulation-resistance-formulas', 'power-angle-formulas', 'solar-panel-temperature-formulas', 'voltage-change-formulas', 'soft-starter-vfd-formulas', 'fault-loop-rcd-formulas', 'battery-internal-resistance-formulas', 'busbar-rating-formulas', 'adc-resolution-formulas', 'capacitor-switching-inrush-formulas', 'cable-charging-current-formulas', 'solar-dc-ac-ratio-formulas', 'measurement-uncertainty-formulas', 'parallel-transformer-formulas', 'peukert-formulas', 'capacitor-discharge-formulas', 'hydraulic-power-formulas', 'thermocouple-formulas', 'transformer-vector-group-formulas', 'holdup-time-formulas', 'hoist-power-formulas', 'compressor-power-formulas', 'rectifier-bridge-formulas', 'pcb-trace-current-formulas', 'heat-pump-cop-formulas', 'sound-level-formulas', 'duty-cycle-rms-formulas', 'supercapacitor-formulas', 'step-touch-voltage-formulas', 'contactor-sizing-formulas', 'inverter-motor-cable-formulas', 'pneumatic-cylinder-formulas', 'busbar-temperature-rise-formulas', 'motor-temperature-rise-formulas', 'battery-storage-efficiency-formulas', 'thermal-time-constant-formulas', 'charge-controller-formulas', 'point-illuminance-formulas', 'generator-droop-formulas', 'two-wattmeter-formulas', 'braking-resistor-formulas', 'load-bank-test-formulas', 'transformer-cooling-rating-formulas', 'energy-meter-multiplier-formulas', 'overcurrent-relay-formulas', 'harmonic-filter-formulas', 'sheath-current-formulas', 'differential-protection-formulas', 'earth-electrode-spacing-formulas', 'solar-row-spacing-formulas', 'dc-lighting-voltage-drop-formulas', 'transformer-loss-of-life-formulas', 'motor-start-voltage-dip-formulas', 'neutral-earthing-resistor-formulas', 'cable-it-withstand-formulas', 'motor-code-letter-formulas', 'synchronous-speed-formulas', 'battery-c-rate-formulas', 'ev-charging-time-formulas', 'conveyor-belt-power-formulas', 'parallel-plate-capacitor-formulas', 'solenoid-inductance-formulas', 'pf-correction-payback-formulas', 'transformer-through-fault-formulas', 'transformer-emf-formulas', 'delta-star-resistor-formulas', 'current-shunt-formulas', 'solar-yield-degradation-formulas', 'electrolysis-faraday-formulas'].forEach((sl) => { const h = PG[sl + '.html']; V(/<table>/.test(h) && (h.match(/<ol class="steps">/g) || []).length >= 1 && (h.match(/<h3>/g) || []).length === 4, sl + ': has a formula table, at least one worked example and four FAQ entries'); }); }
  total += n19; console.log('19. Reference pages and worked examples:', n19 + '/' + n19, 'checked');
}

{ /* 20. Review records: a record can only exist with complete, real-looking evidence; the review pack matches the engine */
  const rv = require(path.join(__dirname, '..', 'tools', 'validate_review_records.js'));
  const ids = E.CALCS.map((c) => c.id);
  const recs = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tools', 'review_records.json'), 'utf8')).records || {};
  let n20 = 0; const R = (c, m) => { n20++; if (!c) { fails++; console.log('FAIL review records: ' + m); } };
  R(rv.validate(recs, ids).length === 0, 'committed review_records.json is valid: ' + rv.validate(recs, ids).join('; '));
  const naList = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tools', 'standard_applicability.json'), 'utf8')).not_applicable || {};
  const WAVE1 = ['cable-size-vd', 'cable-derating', 'voltage-drop', 'ac-voltage-drop', 'max-cable-length', 'cable-sc-withstand', 'parallel-cable-sets', 'fault-current', 'fault-mva', 'fault-types', 'breaker-size', 'fault-loop-impedance', 'earth-rod-resistance', 'earth-rods-parallel', 'earth-grid-resistance', 'ngr-sizing', 'transformer-sizing', 'transformer-loading', 'transformer-current', 'transformer-regulation', 'motor-current', 'motor-starting', 'motor-start-dip', 'star-delta-starting'];
  R(Object.keys(naList).every((k) => ids.indexOf(k) >= 0 && typeof naList[k] === 'string' && naList[k].length > 10), 'standard_applicability.json names only real calculators, each with a reason');
  const stdIds = Object.keys(recs).filter((k) => recs[k].standard);
  R(stdIds.length === 50 && stdIds.every((k) => ids.indexOf(k) >= 0 && recs[k].standard.review_status === 'scope_screened'), '50 applicable standards are explicitly marked scope_screened');
  R(Object.keys(naList).length === 107, '107 calculations have documented Not applicable reasons');
  R(ids.every((id) => !!(recs[id] && recs[id].standard) !== !!naList[id]) && stdIds.length + Object.keys(naList).length === ids.length, 'all 157 calculators have exactly one Stage 3 classification');
  R(Object.keys(recs).every((k) => !recs[k].approved) && Object.keys(recs).every((k) => ids.indexOf(k) >= 0 && recs[k].standard), 'no individual approval is recorded (none is claimed until a named, qualified reviewer has signed worksheets on file); every record carries a Stage 3 standard screening');
  const teamApproval = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tools', 'team_review_approval.json'), 'utf8'));
  R(teamApproval.reviewer === 'Rahul Sharma (self-designation, not independent)' && teamApproval.approval_type === 'internal_team_designation' && teamApproval.date === '2026-11-12' && teamApproval.scope_count === ids.length && /user.*direction/i.test(teamApproval.basis), 'team-level reviewer designation is complete and covers all calculators');
  R(/not an individual/i.test(teamApproval.limitation) && /not.*independent/i.test(teamApproval.limitation), 'team-level designation explicitly excludes individual and independent sign-off');
  R(Object.keys(naList).every((k) => WAVE1.indexOf(k) < 0), 'no Wave 1 (standards-governed) calculator is marked Not applicable');
  const ok = { standard: { name: 'IEC 60364-5-52', edition: '2009', date: '2026-01-31' }, approved: { reviewer: 'A. Reviewer', qualification: 'CEng', date: '2026-01-31' } };
  R(rv.validate({ 'cable-size-vd': ok }, ids, '2026-11-09').length === 0, 'a complete record is accepted');
  R(rv.validate({ 'no-such-calc': ok }, ids).length === 1, 'unknown calculator id rejected');
  R(rv.validate({ 'cable-size-vd': { approved: { reviewer: 'Full name', qualification: 'CEng', date: '2026-01-31' } } }, ids, '2026-11-09').length === 1, 'placeholder reviewer name rejected');
  R(rv.validate({ 'cable-size-vd': { approved: { reviewer: 'A. Reviewer', qualification: '', date: '2026-01-31' } } }, ids, '2026-11-09').length === 1, 'missing qualification rejected');
  R(rv.validate({ 'cable-size-vd': { standard: { name: 'IEC 60364-5-52', edition: '', date: '2026-01-31' } } }, ids, '2026-11-09').length === 1, 'missing standard edition rejected');
  R(rv.validate({ 'cable-size-vd': { approved: { reviewer: 'A. Reviewer', qualification: 'CEng', date: '2999-01-01' } } }, ids, '2026-11-09').length === 1, 'future review date rejected');
  R(rv.validate({ 'cable-size-vd': {} }, ids).length === 1, 'empty record rejected');
  R(rv.validate({ 'cable-size-vd': { standard: { name: 'IEC 60364-5-52', edition: '2009', date: '2026-01-31', review_status: 'made-up', review_basis: 'x' } } }, ids, '2026-11-09').length >= 1, 'unknown standard review state rejected');
  R(rv.validate({ 'cable-size-vd': { standard: { name: 'IEC 60364-5-52', edition: '2009', date: '2026-01-31', review_status: 'scope_screened', review_basis: 'Public catalogue only' } } }, ids, '2026-11-09').some((x) => /scope_note/.test(x)), 'scope-screened record requires its limitation note');
  R(rv.validate({ 'cable-size-vd': { standard: { name: 'IEC 60364-5-52', edition: '2009', date: '2026-01-31', review_status: 'made-up', review_basis: 'x' } } }, ids, '2026-11-09').length >= 1, 'unknown standard review state rejected');
  R(rv.validate({ 'cable-size-vd': { standard: { name: 'IEC 60364-5-52', edition: '2009', date: '2026-01-31', review_status: 'scope_screened', review_basis: 'Public catalogue only' } } }, ids, '2026-11-09').some((x) => /scope_note/.test(x)), 'scope-screened record requires its limitation note');
  const pack = fs.readFileSync(path.join(__dirname, '..', 'docs', 'REVIEW_PACK.md'), 'utf8');
  R(pack.indexOf('(v' + E.VERSION + ')') > 0, 'review pack is for the current version v' + E.VERSION);
  R(pack.indexOf(E.CALCS.length + ' calculators in') > 0, 'review pack lists all ' + E.CALCS.length + ' calculators');
  R(ids.every((id) => pack.indexOf('(`' + id + '`)') > 0), 'review pack has an entry for every calculator');
  R(pack.indexOf('## Wave 1') > 0, 'review pack has the Wave 1 priority section');
  { const pr = require('../tools/build_pages.js').legalPages()['privacy.html'], mt = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').match(/m\.(project|ref|by|chk|rev)\b/g) || [];
    ['project', 'sheet or reference', 'prepared by', 'checked by', 'revision'].forEach((w) => R(pr.indexOf(w) > 0, 'privacy notice names the saved sheet field: ' + w));
    R(/browser storage/.test(pr) && /never leave your device/.test(pr), 'privacy notice says sheet details are saved in browser storage and stay on the device');
    R(new Set(mt.map((x) => x.slice(2))).size === 5, 'the app saves exactly the five sheet fields the notice lists'); }
  { const ad = require('../tools/build_api_docs.js'), doc = fs.readFileSync(path.join(__dirname, '..', 'docs', 'API.md'), 'utf8');
    R(doc === ad.build(), 'docs/API.md equals the generator output (run node tools/build_api_docs.js)');
    R(ids.every((id) => doc.indexOf('### `' + id + '`') > 0), 'docs/API.md documents every calculator');
    R(/no hosted REST API/.test(doc), 'docs/API.md states that no hosted API exists yet');
    const a1 = E.api('three-phase-current', { P: 100, PUnit: 'kW', V: 400, VUnit: 'V', pf: 0.9, phase: 3, eff: 1 }), a2 = E.api('three-phase-current', { P: 100 });
    R(a1.ok && Math.abs(a1.outputs.I.value - 100000 / (Math.sqrt(3) * 400 * 0.9)) < 1e-6, 'documented API example matches I = P / (sqrt3 V pf)');
    R(a2.ok && Math.abs(a2.outputs.I.value - a1.outputs.I.value) < 1e-9, 'omitted inputs use the calculator defaults, as documented');
    R(E.api('nope', {}).ok === false && /Unknown calculator/.test(E.api('nope', {}).error), 'unknown id returns the documented error');
    R(E.api('three-phase-current', { P: 0 }).errors[0].key === 'P' && E.api('three-phase-current', { P: 'abc' }).ok === false, 'invalid input returns errors with a key, without throwing');
    R(E.api('three-phase-current', { P: 100, bogus: 1 }).ok === true, 'unknown input keys are ignored, as documented');
    R(E.api('cable-sc-withstand', { Isc: 10, t: 0.5, mat: 2 }).ok === true && E.api('cable-sc-withstand', { Isc: 10, t: 0.5, mat: 9 }).ok === false, 'choice inputs take the numeric option and reject others'); }
  { const lc = fs.readFileSync(path.join(__dirname, '..', 'docs', 'LAUNCH_CHECKLIST.md'), 'utf8'), pr = fs.readFileSync(path.join(__dirname, '..', 'privacy.html'), 'utf8');
    R(/## 1\. Domain/.test(lc) && /## 2\. Accessibility/.test(lc) && /## 3\. Legal review/.test(lc), 'launch checklist has the domain, accessibility and legal sections');
    ['185.199.108.153', '185.199.109.153', '185.199.110.153', '185.199.111.153'].forEach((ip) => R(lc.indexOf(ip) > 0, 'launch checklist lists GitHub Pages address ' + ip));
    R(/Enforce HTTPS/.test(lc) && /sitemap\.xml/.test(lc), 'launch checklist covers HTTPS and the sitemap');
    R(/DRAFT/.test(require('../tools/build_pages.js').legalPages()['privacy.html']) && /Legal review/i.test(lc), 'privacy draft marker stays until the legal review is recorded'); }
  total += n20; console.log('20. Review records and review pack:', n20 - 0 + '/' + n20, 'checked');
}

{ /* 21. Feeder Designer protective-device checks: expected values written here from the textbook formulas */
  let n21 = 0; const Z = (c, mm) => { n21++; if (!c) { fails++; console.log('FAIL feeder protection: ' + mm); } };
  const base = { basis: 1, P: [250, 'kW'], V: [400, 'V'], pf: 0.9, L: [180, 'm'], R: [0.0601, 'Ω/km'], X: [0.08, 'Ω/km'], limit: 3, S: [1000, 'kVA'], Z: 5, A: [300, 'mm²'], Itab: [750, 'A'], Ta: 40, kg: 0.8, mat: 2, t: 0.5 };
  const F = (o) => E.runFeeder(Object.assign({}, base, o)), st = (r, id) => r.steps.find((x) => x.id === id);
  const Zs = 0.05 * 400 * 400 / 1e6, Zc = Math.hypot(0.0601e-3 * 180, 0.08e-3 * 180), I3 = 400 / (Math.sqrt(3) * (Zs + Zc)), Ipp = I3 * Math.sqrt(3) / 2, allow = Math.pow(143 * 300, 2);
  const b = F({}), end = st(b, 'feeder-end-fault');
  Z(b.ok && Math.abs(end.value - Ipp) < 1e-6 && Math.abs(Ipp - 7692) < 5, 'far-end phase-to-phase fault is (√3/2) × V / (√3 (Zs + Zc)) = ' + Ipp.toFixed(0) + ' A');
  Z(end.headline.indexOf((I3 / 1000).toFixed(2)) >= 0 && end.headline.indexOf((Ipp / 1000).toFixed(2)) >= 0, 'the far-end headline shows ' + (I3 / 1000).toFixed(2) + ' kA and ' + (Ipp / 1000).toFixed(2) + ' kA');
  Z(st(b, 'cable-let-through').status === 'pending' && st(b, 'breaker-pickup').status === 'pending' && b.failed === false, 'without the two new inputs both checks are not verified and nothing fails');
  Z(/LET-THROUGH ENERGY NOT VERIFIED/.test(b.statusText) && /PICK-UP NOT VERIFIED/.test(b.statusText), 'the overall status says what is not verified');
  Z(['three-phase-current', 'voltage-drop', 'breaker-size', 'cable-derating', 'fault-current', 'cable-sc-withstand'].every((id) => st(b, id)) && st(b, 'cable-sc-withstand').status === 'pass', 'the existing checks are unchanged');
  const lo = F({ I2t: allow * 0.9 }), eq = F({ I2t: allow }), hi = F({ I2t: allow * 1.1 });
  Z(st(lo, 'cable-let-through').status === 'pass' && st(eq, 'cable-let-through').status === 'pass' && st(hi, 'cable-let-through').status === 'fail', 'let-through passes up to k² S² (' + allow.toExponential(3) + ' A²s) and fails above it');
  Z(hi.failed === true && lo.failed === false && !/LET-THROUGH ENERGY NOT VERIFIED/.test(lo.statusText), 'a failed let-through fails the feeder; an entered value is no longer listed as not verified');
  const small = F({ A: [95, 'mm²'], I2t: 5e8 }), wAllow = Math.pow(143 * 95, 2);
  Z(5e8 > wAllow && st(small, 'cable-let-through').status === 'fail' && Math.abs(wAllow - 1.845e8) < 1e6, 'a 95 mm² XLPE copper cable withstands ' + (wAllow / 1e6).toFixed(1) + ' million A²s, so 500 million fails');
  const al = F({ mat: 4, I2t: Math.pow(94 * 300, 2) * 1.01 }); Z(st(al, 'cable-let-through').status === 'fail', 'aluminium XLPE uses its own constant (k = 94)');
  const pu1 = F({ Ii: [Ipp - 1, 'A'] }), pu2 = F({ Ii: [Ipp + 1, 'A'] }), pu3 = F({ Ii: [5, 'kA'] });
  Z(st(pu1, 'breaker-pickup').status === 'pass' && st(pu2, 'breaker-pickup').status === 'fail' && pu2.failed === true && pu1.failed === false, 'pick-up at or below the far-end fault passes, above it fails');
  Z(st(pu3, 'breaker-pickup').status === 'pass', 'the pick-up accepts kA and converts it (5 kA ≤ ' + Ipp.toFixed(0) + ' A)');
  const long = F({ L: [600, 'm'] }), zl = Math.hypot(0.0601e-3 * 600, 0.08e-3 * 600), Il = 400 / (Math.sqrt(3) * (Zs + zl)) * Math.sqrt(3) / 2;
  Z(Math.abs(st(long, 'feeder-end-fault').value - Il) < 1e-6 && Il < Ipp, 'a longer feeder gives a lower far-end fault (' + Il.toFixed(0) + ' A at 600 m)');
  const weak = F({ S: [250, 'kVA'] }), Zw = 0.05 * 160000 / 250000, Iw = 400 / (Math.sqrt(3) * (Zw + Zc)) * Math.sqrt(3) / 2;
  Z(Math.abs(st(weak, 'feeder-end-fault').value - Iw) < 1e-6 && Iw < Ipp, 'a smaller source transformer gives a lower far-end fault');
  Z(F({ Ii: [0, 'A'] }).ok === false && F({ I2t: 0 }).ok === false && F({ I2t: -5 }).ok === false && F({ Ii: [-1, 'A'] }).ok === false, 'zero or negative pick-up and let-through values are rejected');
  Z(/Instantaneous pick-up vs far-end fault/.test(pu1.report) && /Breaker let-through energy vs cable/.test(lo.report) && /\[FAIL\]/.test(hi.report), 'the calculation sheet lists the new checks with PASS or FAIL');
  { /* earth fault loop: Zs = Ze + |(R + Rpe) L + j X L|, If = (V/√3) / Zs, passes when If >= pick-up */
    const Ze = 0.02, Rpe = 0.0601, Zf = Math.hypot((0.0601e-3 + Rpe * 1e-3) * 180, 0.08e-3 * 180), Zs = Ze + Zf, If = 400 / Math.sqrt(3) / Zs;
    const ef = (o) => F(Object.assign({ Ze: [Ze, 'Ω'], Rpe: [Rpe, 'Ω/km'] }, o)), p1 = ef({ Ii: [If - 1, 'A'] }), p2 = ef({ Ii: [If + 1, 'A'] }), s1 = st(p1, 'earth-fault-loop');
    Z(Math.abs(Zs - 0.045994) < 1e-5 && Math.abs(If - 5021.0) < 2, 'earth fault loop: Zs = ' + Zs.toFixed(4) + ' Ω and If = ' + If.toFixed(0) + ' A');
    Z(s1.status === 'pass' && st(p2, 'earth-fault-loop').status === 'fail' && p2.failed === true && p1.failed === false, 'earth fault current at or above the pick-up passes, below it fails the feeder');
    Z(s1.headline.indexOf(E.fmt(Zs, 4)) >= 0 && s1.headline.indexOf(E.fmt(If, 4)) >= 0, 'the earth fault loop headline shows the loop impedance and the earth fault current');
    Z(st(F({ Ze: [Ze, 'Ω'], Ii: [3, 'kA'] }), 'earth-fault-loop').status === 'pending' && st(F({ Rpe: [Rpe, 'Ω/km'], Ii: [3, 'kA'] }), 'earth-fault-loop').status === 'pending' && st(ef({}), 'earth-fault-loop').status === 'pending', 'the earth fault loop is not verified unless Ze, the PE resistance and the pick-up are all entered');
    Z(/EARTH FAULT LOOP NOT VERIFIED/.test(b.statusText) && !/EARTH FAULT LOOP NOT VERIFIED/.test(p1.statusText), 'the overall status lists the earth fault loop only while it is not verified');
    const bigZe = ef({ Ze: [1, 'Ω'], Ii: [3, 'kA'] }), nZs = 1 + Zf; Z(st(bigZe, 'earth-fault-loop').status === 'fail' && 400 / Math.sqrt(3) / nZs < 3000, 'a high external impedance (1 Ω) cuts the earth fault below a 3 kA pick-up and fails');
    Z(F({ Ze: [-1, 'Ω'] }).ok === false && F({ Rpe: [-1, 'Ω/km'] }).ok === false, 'negative Ze or PE resistance is rejected'); }
  Z(st(b, 'breaker-trip').status === 'pending' && st(b, 'breaker-selectivity').status === 'pending', 'the trip curve and selectivity are still stated as not checked');
  total += n21; console.log('21. Feeder Designer protective-device checks:', n21 + '/' + n21, 'checked');
}

/* 22. Benchmark practice 1: every calculator has a public, crawlable URL of its own, without two pages competing for one search intent. */
{
  let n22 = 0; const W = (c, m) => { n22++; ok(c, m); };
  const bp = require('../tools/build_pages.js'), fsx = require('fs'), pth = require('path'), plain = bp.build({ base: '' });
  const own = {}; bp.CALC_DATA.forEach((c) => { own[c.calc] = (own[c.calc] || []).concat('calculators/' + c.slug + '/'); });
  const conv = {}; plain.meta.forEach((m) => { conv[m.calc] = (conv[m.calc] || []).concat('pages/' + m.slug + '.html'); });
  const none = E.CALCS.filter((c) => !own[c.id] && !conv[c.id]).map((c) => c.id);
  W(none.length === 0, 'every one of the ' + E.CALCS.length + ' calculators has a calculator page or a conversion page' + (none.length ? ': ' + none.join(', ') : ''));
  const both = E.CALCS.filter((c) => own[c.id] && conv[c.id] && !bp.CALC_HAND.some((h) => h.calc === c.id)).map((c) => c.id);
  W(both.length === 0, 'no generated calculator page duplicates a conversion page (one page per search intent)' + (both.length ? ': ' + both.join(', ') : ''));
  const gen = bp.CALC_DATA.filter((c) => c.auto);
  W(gen.length === 110 && bp.CALC_DATA.length === 129 && gen.every((c) => fsx.existsSync(pth.join(__dirname, '..', 'calculators', c.slug, 'index.html'))), '110 generated pages plus 19 hand-written pages are all on disk');
  const T = bp.CALC_DATA.map((c) => /<title>([^<]*)<\/title>/.exec(plain.calc.pages[c.slug])[1]), D = bp.CALC_DATA.map((c) => /<meta name="description" content="([^"]*)"/.exec(plain.calc.pages[c.slug])[1]);
  W(new Set(T).size === T.length && new Set(D).size === D.length && T.every((t) => t.length <= 60) && D.every((d) => d.length >= 50 && d.length <= 160), 'all ' + T.length + ' calculator page titles and descriptions are unique and within search limits');
  gen.forEach((c) => {
    const h = plain.calc.pages[c.slug], def = E.BY_ID[c.calc], tx = h.replace(/<style>[\s\S]*?<\/style>/, '').replace(/<script[\s\S]*?<\/script>/g, '');
    const r = E.calculate(def, E.defaultsRaw(def));
    W(r.ok && (h.match(/<h1>/g) || []).length === 1 && !/NaN|undefined|Infinity|\[object/.test(tx), c.slug + ': one h1, default inputs calculate, no NaN or undefined in the text');
    W(/<h2>Inputs and results<\/h2>/.test(h) && /<h2>How it is calculated<\/h2>/.test(h) && /<h2>Standards and further reading<\/h2>/.test(h), c.slug + ': has inputs and results, method and standards sections');
    W(tx.indexOf(def.formula.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')) >= 0 && /<h2>Worked example<\/h2>/.test(h) && /<h2>Assumptions<\/h2>/.test(h) && /<h2>Frequently asked questions<\/h2>/.test(h) && /<h2>Related calculators<\/h2>/.test(h), c.slug + ': shows the registry formula, a worked example, assumptions, FAQ and related links');
  });
  bp.CALC_DATA.forEach((c) => { const h = plain.calc.pages[c.slug], def = E.BY_ID[c.calc]; W(def.inputs.filter((x) => !(c.hide || []).includes(x.key)).every((x) => h.indexOf('<td>' + x.label.replace(/ \(used when[^)]*\)/, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</td>') >= 0) && def.outputs.every((o) => h.indexOf(o.label.replace(/ \(used when[^)]*\)/, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')) >= 0), c.slug + ': inputs and results table lists every input and result of the registry entry'); });
  total += n22; console.log('22. every calculator has a public URL: ' + n22 + '/' + n22 + ' checked');
}

/* 23. Benchmark practice 3: related-calculator navigation. Every calculator page links to the calculators a user needs next, every
   "next step" link is two-way, and every link lands on a page that exists. */
{
  let n23 = 0; const W = (c, m) => { n23++; ok(c, m); };
  const bp = require('../tools/build_pages.js'), fsx = require('fs'), pth = require('path'), rel = require('../tools/calc_related.js');
  const plain = bp.build({ base: '' }), root = pth.join(__dirname, '..');
  const hrefsOf = (h) => { const i = h.indexOf('<h2>Related calculators</h2>'), j = h.indexOf('</main>', i); return [...h.slice(i, j).matchAll(/href="([^"#]+)(#[^"]*)?"/g)].map((m) => m[1]); };
  const graph = rel.buildRelated(E, bp.CALC_HAND, (d) => bp.CATS.find((k) => k.divisions.indexOf(d.division.slice(0, 2)) >= 0).slug, bp.CATS);
  const slugOf = {}; bp.CALC_DATA.forEach((c) => { slugOf[c.calc] = c.slug; });
  let oneWay = [];
  Object.keys(graph).forEach((a) => graph[a].filter((e) => e.kind === 'next' || e.kind === 'hand' || e.kind === 'back').forEach((e) => { if (!graph[e.id].some((x) => x.id === a)) oneWay.push(a + '->' + e.id); }));
  W(oneWay.length === 0, 'every next-step and before-step link between calculators is two-way' + (oneWay.length ? ': ' + oneWay.slice(0, 5).join(', ') : ''));
  const inbound = {};
  bp.CALC_DATA.forEach((c) => {
    const h = plain.calc.pages[c.slug], hs = hrefsOf(h), self = '../' + c.slug + '/';
    const peers = hs.filter((x) => (/^\.\.\/[a-z0-9-]+\/$/.test(x) && x !== '../' && !bp.CATS.some((k) => '../' + k.slug + '/' === x)) || /^\.\.\/\.\.\/pages\/[a-z0-9-]+\.html$/.test(x));
    peers.forEach((x) => { inbound[x.slice(3, -1)] = (inbound[x.slice(3, -1)] || 0) + 1; });
    W(peers.length >= rel.MIN && peers.indexOf(self) < 0 && new Set(hs).size === hs.length, c.slug + ': at least ' + rel.MIN + ' related calculator links, none to itself, none repeated');
    W(hs.every((x) => { const t = pth.join(root, 'calculators', c.slug, x); return /^\.\.\/\.\.\/index\.html$/.test(x) || fsx.existsSync(x.endsWith('/') ? pth.join(t, 'index.html') : t); }), c.slug + ': every related link opens a page that exists');
    const def = E.BY_ID[c.calc];
    const nxt = (def.next || []).filter((id) => E.BY_ID[id]);
    W(nxt.every((id) => hs.some((x) => x === '../' + slugOf[id] + '/' || /^\.\.\/\.\.\/pages\/[a-z0-9-]+\.html$/.test(x))), c.slug + ': every calculator the registry names as a next step is linked, by its own page or its conversion page');
  });
  W(bp.CALC_DATA.every((c) => inbound[c.slug] >= 2), 'every calculator page is linked from at least two other calculator pages');
  const ts = plain.calc.pages['transformer-sizing'], tl = hrefsOf(ts);
  W(['transformer-current', 'transformer-loading', 'transformer-efficiency', 'transformer-fault-current', 'transformer-regulation'].every((s) => tl.indexOf('../' + s + '/') >= 0), 'the transformer sizing page links to transformer current, loading, losses and efficiency, fault current and regulation');
  const kw = plain.meta.find((m) => m.slug === 'kw-to-amps') && plain.pages['kw-to-amps.html'];
  W(/Next steps in a design: <a class="chip" href="\.\.\/calculators\/voltage-drop\/">/.test(kw), 'a conversion page (kW to amps) links on to the design calculators that use its result');
  total += n23; console.log('23. related-calculator navigation: ' + n23 + '/' + n23 + ' checked');
}

/* 24. Benchmark practice 4: simple calculator presentation. The calculator and its result come before any explanation, and the
   reference sections are folded without losing their text. */
{
  let n24 = 0; const W = (c, m) => { n24++; ok(c, m); };
  const bp = require('../tools/build_pages.js'), plain = bp.build({ base: '' });
  bp.CALC_DATA.forEach((c) => {
    const h = plain.calc.pages[c.slug], at = (t) => h.indexOf(t);
    W(at('<h1>') > 0 && at('id="try"') > at('<h1>') && at('id="try"') < at('<h2>About this calculator</h2>') && at('id="try"') < at('<h2>Formula</h2>') && at('id="static-ans"') > at('id="try"'), c.slug + ': the calculator and its result come right after the title, before the explanation');
    W((h.match(/<p class="lede">/g) || []).length === 1, c.slug + ': one short line under the title, the longer introduction is below the calculator');
    W(['Inputs and results', 'How it is calculated', 'Standards and further reading'].every((t) => at('<summary><h2>' + t + '</h2></summary>') > 0) && /<details class="more" id="typical"><summary><h2>/.test(h) && (h.match(/<details/g) || []).length === (h.match(/<\/details>/g) || []).length && (h.match(/<details/g) || []).length === 4, c.slug + ': four reference sections are folded, headings and text still in the page');
    W(['formula', 'example', 'about', 'faq', 'related'].every((i) => at('<section id="' + i + '"') > 0) && !/<details[^>]*open/.test(h), c.slug + ': formula, worked example, FAQ and related links stay open and have anchors');
  });
  total += n24; console.log('24. simple calculator presentation: ' + n24 + '/' + n24 + ' checked');
}

/* 25. Benchmark practice 5: conversion and reference ecosystem. Calculator and conversion pages link to the guides written for their topic,
   every guide link opens a page that exists, and the six pages added in v1.44.0 are present. */
{
  let n25 = 0; const W = (c, m) => { n25++; ok(c, m); };
  const bp = require('../tools/build_pages.js'), fsx = require('fs'), pth = require('path'), ga = require('../tools/calc_articles.js');
  const plain = bp.build({ base: '' }), root = pth.join(__dirname, '..');
  const guideHrefs = (h) => [...h.matchAll(/href="((?:\.\.\/)+converters\/([a-z0-9-]+)\.html)"/g)].map((m) => m[2]);
  const nCalcs = Object.keys(ga.BY_CALC).length;
  W(E.CALCS.every((c) => ga.BY_CALC[c.id] || ga.NO_GUIDE[c.id]) && Object.keys(ga.NO_GUIDE).every((id) => !ga.BY_CALC[id]), 'every calculator has guides or is listed with a reason in NO_GUIDE, never both (' + nCalcs + ' mapped)');
  W(Object.keys(ga.BY_CALC).every((id) => ga.BY_CALC[id].length >= 1 && ga.BY_CALC[id].length <= 5 && new Set(ga.BY_CALC[id]).size === ga.BY_CALC[id].length), 'each calculator lists 1 to 5 different guides');
  bp.CALC_DATA.forEach((c) => {
    const h = plain.calc.pages[c.slug], want = ga.BY_CALC[c.calc] || [], got = (h.match(/<section id="guides">[\s\S]*?<\/section>/) || [''])[0];
    W(guideHrefs(got).join() === want.join(), c.slug + ': the guides section lists exactly the mapped guides, in order');
    W(want.length === 0 ? got === '' && h.indexOf('href="#guides"') < 0 : h.indexOf('href="#guides"') > 0 && h.indexOf('<section id="guides">') > 0, c.slug + ': the Guides jump link appears only when the section does');
    W(guideHrefs(got).every((g) => fsx.existsSync(pth.join(root, 'converters', g + '.html'))), c.slug + ': every guide link opens a page that exists');
  });
  bp.INTENTS.filter((n) => n.kind !== 'unit' || true).forEach((n) => {
    const h = plain.pages[n.slug + '.html'], want = ga.GUIDE_FOR_SLUG[n.slug] || ga.BY_CALC[n.calc] || [], row = (h.match(/Formula guides: [\s\S]*?<br>/) || [''])[0];
    W(guideHrefs(row).join() === want.join(), n.slug + ': the conversion page lists its formula guides');
  });
  W(['ah-to-wh', 'wh-to-ah', 'ah-to-kwh', 'kwh-to-ah', 'hp-to-amps', 'amps-to-hp'].every((s) => plain.pages[s + '.html'] && fsx.existsSync(pth.join(root, 'pages', s + '.html'))), 'the six pages added in v1.44.0 exist and are committed');
  const used = new Set(); Object.keys(plain.calc.pages).forEach((k) => guideHrefs(plain.calc.pages[k]).forEach((g) => used.add(g))); Object.keys(plain.pages).forEach((k) => guideHrefs(plain.pages[k]).forEach((g) => used.add(g)));
  const arts = fsx.readdirSync(pth.join(root, 'converters')).filter((f) => /-formulas\.html$/.test(f));
  W(arts.filter((f) => used.has(f.replace('.html', ''))).length >= 110, 'at least 110 of the ' + arts.length + ' formula guides are linked from a calculator or conversion page (' + arts.filter((f) => used.has(f.replace('.html', ''))).length + ' now)');
  total += n25; console.log('25. conversion and reference ecosystem: ' + n25 + '/' + n25 + ' checked');
}


/* 26. Scientific Calculator (v1.50.0): its own engine, checked against independent Python vectors, the product note's cases, formatting, safety and the page */
{
  let n26 = 0; const X = (c, m) => { n26++; ok(c, m); };
  const bp = require('../tools/build_pages.js'), fsx = require('fs'), pth = require('path'), SC = require('../tools/scicalc_engine.js'), root = pth.join(__dirname, '..');
  const D26 = JSON.parse(fsx.readFileSync(pth.join(__dirname, 'scicalc_vectors.json'), 'utf8'));
  const nErr = D26.vectors.filter((v) => v.error).length;
  X(D26.vectors.length >= 600 && nErr >= 50 && D26.polar.length >= 10, 'scicalc: ' + D26.vectors.length + ' independent vectors (' + nErr + ' error cases) and ' + D26.polar.length + ' polar conversions are present');
  const used = new Set(D26.vectors.map((v) => v.angle + (v.complex ? 'c' : 'r')));
  X(['DEGr', 'RADr', 'GRADr', 'DEGc', 'RADc', 'GRADc'].every((k) => used.has(k)), 'scicalc: the vectors cover every angle mode in Standard and Engineering mode');
  const bad = [];
  D26.vectors.forEach((v) => {
    const vv = v.vars ? Object.fromEntries(Object.entries(v.vars).map(([k, z]) => [k, { re: z[0], im: z[1] }])) : undefined, r = SC.evaluate(v.expr, { angle: v.angle, complex: v.complex, implicit: v.implicit, vars: vv });
    if (r.internal) { bad.push(v.id + ' (internal error)'); return; }
    if (v.error) { if (r.ok || !r.error) bad.push(v.id + ' should be an error'); return; }
    if (!r.ok) { bad.push(v.id + ' failed: ' + r.error); return; }
    const tol = 1e-9 * Math.max(1, Math.hypot(v.re, v.im));
    if (!(Math.abs(r.value.re - v.re) <= tol && Math.abs(r.value.im - v.im) <= tol)) bad.push(v.id + ' [' + v.angle + (v.complex ? ',complex' : '') + '] got ' + r.value.re + ',' + r.value.im + ' want ' + v.re + ',' + v.im);
  });
  X(bad.length === 0, 'scicalc: every independent vector agrees with the engine' + (bad.length ? ': ' + bad.slice(0, 5).join('; ') : ''));
  D26.polar.forEach((z, i) => {
    const d = SC.describe({ re: z.re, im: z.im }, { digits: 10 }), f = SC.format({ re: z.re, im: z.im }, { digits: 12 });
    X(Math.abs(d.mag - z.mag) <= 1e-12 * Math.max(1, z.mag) && Math.abs(d.angDeg - z.ang) <= 1e-9 && (z.im === 0 || f.polar.indexOf('\u2220') > 0), 'scicalc: polar conversion ' + i + ' (' + z.re + ', ' + z.im + ') gives magnitude ' + z.mag.toPrecision(6) + ' and angle ' + z.ang.toFixed(4) + ' degrees');
  });

  /* The product note's own test table, shown as the user would see it */
  const show = (e, o) => { const r = SC.evaluate(e, o || {}); return r.ok ? SC.format(r.value, Object.assign({ digits: 10 }, o || {})).text : 'ERR:' + r.error; };
  [['sin(30)', '0.5'], ['cos(60)', '0.5'], ['tan(45)', '1'], ['log(1000)', '3'], ['ln(e)', '1'], ['sqrt(144)', '12'], ['5!', '120'], ['2^3', '8'], ['sin(180)', '0'], ['cos(90)', '0'], ['0.1+0.2', '0.3'], ['-2^2', '-4'], ['2^3^2', '512'], ['asin(0.5)', '30'], ['sin(30\u00b0)', '0.5']].forEach((t) => X(show(t[0]) === t[1], 'scicalc: ' + t[0] + ' shows ' + t[1]));
  X(show('1/0') === 'ERR:Division by zero' && /negative number/.test(show('sqrt(-1)')) && /Engineering mode/.test(show('sqrt(-1)')) && /Missing closing bracket/.test(show('(1+2')) && /Add an operator/.test(show('1 000')), 'scicalc: errors are explained in words (division by zero, square root of a negative, missing bracket, 1 000)');
  const Z = { complex: true, digits: 5, unit: '\u03a9' }, zd = SC.describe(SC.evaluate('10+j15', Z).value, Z);
  X(JSON.stringify(zd.rows) === JSON.stringify([['Real component', '10 \u03a9'], ['Imaginary component', '+15 \u03a9'], ['Magnitude', '18.028 \u03a9'], ['Phase angle', '56.31\u00b0'], ['Representation', '18.028 \u2220 56.31\u00b0']]), 'scicalc: Z = 10 + j15 \u03a9 gives the table in the product note (18.028 \u03a9, 56.31\u00b0, 18.028 \u2220 56.31\u00b0)');
  X(show('10+j15', Z) === '10 + j15 \u03a9' && show('10+j15', { complex: true, digits: 5, unit: '\u03a9', form: 'polar' }) === '18.028 \u2220 56.31\u00b0 \u03a9', 'scicalc: rectangular and polar display of 10 + j15');
  { const U = { complex: true, digits: 10, unit: '\u03a9' }, u = (e) => SC.evaluate(e, U);
    X(u('arg(3+j4)').unitless === true && u('asin(0.5)').unitless === true && u('ncr(5,2)').unitless === true && u('abs(3+j4)').unitless === false && u('2*arg(1+j)').unitless === false && u('arg(1+j)+1').unitless === false && u('10+j15').unitless === false, 'scicalc: only a result that is a single arg, inverse-trig or nCr/nPr call is flagged unitless (so arg shows an angle, not ohms)'); }
  X(show('e^(j*pi)', { complex: true }) === '-1' && show('j*j', { complex: true }) === '-1' && show('sqrt(-4)', { complex: true }) === '0 + j2', 'scicalc: e^(j\u03c0) and j\u00b2 are -1 and sqrt(-4) is j2 in Engineering mode, with rounding noise removed');

  /* Number formatting, written by hand */
  const F = SC.fmtReal;
  X(F(4700, { fmt: 'eng' }) === '4.7\u00d710\u00b3' && F(0.000047, { fmt: 'sci' }) === '4.7\u00d710\u207b\u2075' && F(123456, { fmt: 'eng' }) === '123.456\u00d710\u00b3' && F(0.000047, { fmt: 'eng' }) === '47\u00d710\u207b\u2076' && F(1e15) === '1\u00d710\u00b9\u2075' && F(1 / 3, { fmt: 'fraction' }) === '1/3' && F(2.5, { fmt: 'fraction' }) === '5/2 (2 1/2)' && F(-0.75, { fmt: 'fraction' }) === '-3/4' && F(3, { fmt: 'fraction' }) === '3' && F(Math.PI, { fmt: 'fraction' }) === '3.141592654' && F(0.142857142857, { fmt: 'fraction' }) === '1/7', 'scicalc: scientific, engineering, fraction and large-number formats');
  X(F(1234.56789, { digits: 6 }) === '1234.57' && F(-0.5) === '-0.5' && F(999999.99999999, { digits: 10 }) === '1000000' && F(0.000001) === '0.000001' && F(0.0000001) === '1\u00d710\u207b\u2077', 'scicalc: significant-digit rounding and the switch to scientific form');
  X(SC.prefixed(4700) === '4.7 k' && SC.prefixed(0.0000033) === '3.3 \u00b5' && SC.prefixed(2.2e6) === '2.2 M' && SC.prefixed(1e15) === null && SC.prefixed(0) === null, 'scicalc: SI prefix text (4.7 k, 3.3 \u00b5, 2.2 M)');

  /* Safety: no eval, hostile text only ever gives an error, never throws */
  const eng = fsx.readFileSync(pth.join(root, 'tools', 'scicalc_engine.js'), 'utf8'), cli = fsx.readFileSync(pth.join(root, 'tools', 'scicalc_client.js'), 'utf8');
  X(!/\beval\s*\(/.test(eng + cli) && !/new\s+Function/.test(eng + cli) && !/\bFunction\s*\(/.test(eng + cli) && !/localStorage|sessionStorage|XMLHttpRequest|fetch\s*\(/.test(eng + cli), 'scicalc: no eval, Function, storage or network call in the engine or the page script');
  const hostile = ['alert(1)', 'constructor', '__proto__', 'toString(1)', 'hasOwnProperty', 'process.exit()', 'this', 'window', 'sin(constructor)', '1;2', '{}', '[1]', '"a"', '`x`', '\\', '3 4', '..5', '1e999', '2^99999', '10^400', '(((', ')))', 'sin', 'sin()', 'j', '5\u2220', '\u2220', '!', '%'];
  let thrown = null, bogus = [];
  hostile.forEach((h) => { [false, true].forEach((c) => { try { const r = SC.evaluate(h, { complex: c }); if (r.ok && !(isFinite(r.value.re) && isFinite(r.value.im))) bogus.push(h); } catch (e) { thrown = h + ': ' + e; } }); });
  X(thrown === null && bogus.length === 0, 'scicalc: hostile and malformed input never throws and never returns a non-finite value' + (thrown || ''));
  X(!SC.evaluate('constructor').ok && !SC.evaluate('alert(1)').ok && !SC.evaluate('__proto__').ok && !SC.evaluate('1e999').ok, 'scicalc: object property names and overflow give an error');
  const deep = SC.evaluate('('.repeat(20000) + '1' + ')'.repeat(20000));
  X(deep && deep.ok === false, 'scicalc: absurdly deep nesting is refused without crashing');
  X(SC.evaluate('171!').ok === false && SC.evaluate('170!').ok === true && SC.evaluate('2^2000').ok === false, 'scicalc: factorial and power overflow are errors');
  X(SC.evaluate('rnd', { random: () => 0.25 }).value.re === 0.25 && SC.evaluate('rnd', { random: () => 0.25 }).volatile === true && SC.evaluate('2+2').volatile === false && SC.evaluate('ans*2', { ans: { re: 4, im: 0 } }).value.re === 8 && SC.evaluate('mem+1', { mem: { re: 9, im: 0 } }).value.re === 10, 'scicalc: rnd is marked volatile, and Ans and memory are read');

  /* v1.50.1 audit fixes */
  { const t0 = Date.now(), np = SC.evaluate('npr(1000000000000,1000000000000)'), ms = Date.now() - t0;
    X(np.ok === false && /Overflow/.test(np.error) && ms < 200, 'scicalc: a huge npr returns an overflow error at once (took ' + ms + ' ms)'); }
  { const cz = { re: 3, im: 4 }, a1 = SC.evaluate('ans*2', { ans: cz }), m1 = SC.evaluate('mem+1', { mem: cz }), a2 = SC.evaluate('ans*2', { ans: cz, complex: true });
    X(a1.ok === false && /Engineering mode/.test(a1.error) && m1.ok === false && /Engineering mode/.test(m1.error) && a2.ok === true && a2.value.re === 6 && a2.value.im === 8 && SC.evaluate('ans+1', { ans: { re: 2, im: 0 } }).value.re === 3, 'scicalc: a complex Ans or memory value is refused in Standard mode and used in Engineering mode'); }
  X(['4.7e-11', '1e-10', '5e-12', '1e-300'].every((x) => SC.format(SC.evaluate(x).value, { fmt: 'fraction' }).text !== '0') && SC.format(SC.evaluate('1/3').value, { fmt: 'fraction' }).text === '1/3' && SC.format(SC.evaluate('0.000125').value, { fmt: 'fraction' }).text === '1/8000', 'scicalc: Fraction output never shows a small non-zero value as 0');
  X(SC.evaluate('par(0,5)', { complex: true }).value.re === 0 && SC.evaluate('par(5,-5)', { complex: true }).ok === false && /Open circuit/.test(SC.evaluate('par(5,-5)', { complex: true }).error), 'scicalc: par with a short circuit is 0 and cancelling impedances give an open-circuit error');

  X(SC.reserved('pi') && SC.reserved('SIN') && SC.reserved('arcsin') && SC.reserved('ans') && SC.reserved('j') && SC.reserved('atan2') && !SC.reserved('f') && !SC.reserved('constructor') && SC.evaluate('pi', { vars: { pi: { re: 5, im: 0 } } }).value.re === Math.PI && SC.evaluate('sqrt(4)', { vars: { sqrt: { re: 5, im: 0 } } }).value.re === 2 && !SC.evaluate('constructor', { vars: Object.create(null) }).ok, 'scicalc: variables cannot shadow constants or functions, and object property names are not variables');

  /* The page */
  const pg = bp.build({ base: '' }), html = pg.calc.pages['scientific-calculator'], disk = fsx.readFileSync(pth.join(root, 'calculators', 'scientific-calculator', 'index.html'), 'utf8');
  X(STRIP(html) === STRIP(disk), 'scicalc: the committed page equals the generator output');
  X(pg.calc.sci.title.length <= 60 && pg.calc.sci.desc.length >= 50 && pg.calc.sci.desc.length <= 160 && /<title>Scientific Calculator Online \| Elecmetric<\/title>/.test(html), 'scicalc: title and description lengths are within the limits (' + pg.calc.sci.title.length + ' and ' + pg.calc.sci.desc.length + ' characters)');
  X(html.indexOf(eng) > 0 && html.indexOf(cli) > 0, 'scicalc: the page inlines the engine and the page script unchanged, so it runs the tested code');
  X(!/<script[^>]+src=/.test(html) && !/https?:\/\/(?!elecmetric\.com|schema\.org|www\.w3\.org)/.test(html.replace(/<svg[^>]*xmlns="[^"]*"/g, '<svg')), 'scicalc: no external script and no external address in the page');
  X(/id="sc-in"/.test(html) && /<label for="sc-in"/.test(html) && /aria-live="polite"/.test(html) && /role="group" aria-label="Function keys"/.test(html) && (html.match(/<button type="button" class="k /g) || []).length >= 70, 'scicalc: the expression field has a label, the result is a live region and the keypad has its keys (' + (html.match(/<button type="button" class="k /g) || []).length + ' keys)');
  { const keys = [...html.matchAll(/<button type="button" class="k [^"]*"([^>]*)>([^<]*)<\/button>/g)]; X(keys.length >= 70 && keys.every((m) => /aria-label=/.test(m[1]) || /^[0-9A-Za-z.,()+\u2212\u00d7\u00f7=\u00b1\u232b]{1,3}$/.test(m[2])), 'scicalc: every key has an aria-label or plain visible text (' + keys.length + ' keys)'); }
  X(/Z = 10 \+ j15/.test(html) && /18\.028 \u2220 56\.31\u00b0/.test(html) && /<svg class="sc-svg"/.test(html) && /Error: division by zero/.test(html), 'scicalc: the page shows the worked impedance example, the phasor diagram and the product note\u2019s test table');
  X(/Cross-check: 756 reference cases/.test(html.replace(/\s+/g, ' ')) === (D26.vectors.length === 756) && /Cross-check: \d+ reference cases/.test(html), 'scicalc: the page states the real number of independent vectors');

  /* The Basic Calculator (v1.66.0): same engine, own keypad and page script */
  {
    const bhtml = pg.calc.pages['basic-calculator'], bdisk = fsx.readFileSync(pth.join(root, 'calculators', 'basic-calculator', 'index.html'), 'utf8'), bcli = fsx.readFileSync(pth.join(root, 'tools', 'basiccalc_client.js'), 'utf8');
    const bv = [['2+3*4', '14'], ['(2+3)*4', '20'], ['10-4-3', '3'], ['100/4/5', '5'], ['-2^2', '-4'], ['0.1+0.2', '0.3'], ['12.5*8', '100'], ['1/3', '0.3333333333'], ['1/7', '0.1428571429'], ['sqrt(144)', '12'], ['sqrt(2)', '1.414213562'],
      ['200*15%', '30'], ['200*(1+10%)', '220'], ['200*(1-10%)', '180'], ['7/8', '0.875'], ['12.5*8+(36-6)/4', '107.5'], ['99999*99999', '9999800001'], ['0.5-0.75', '-0.25'], ['3*(4+5)', '27'], ['1/8', '0.125'], ['2^10', '1024'], ['5-8', '-3'], ['(1+2)*(3+4)', '21'], ['100-0.01', '99.99'], ['((2+3)*4-5)/3', '5'], ['7*8', '56']];
    const bad = bv.filter((c) => { const r = SC.evaluate(c[0], { digits: 10, fmt: 'auto' }); return !r.ok || SC.format(r.value, { digits: 10, fmt: 'auto' }).text !== c[1]; }).map((c) => c[0]);
    X(bv.length >= 26 && bad.length === 0, 'basic calculator: ' + bv.length + ' hand-checked expressions give the expected display' + (bad.length ? ': ' + bad.join(', ') : ''));
    const e1 = SC.evaluate('1/0', { digits: 10 }), e2 = SC.evaluate('2+', { digits: 10 }), e3 = SC.evaluate('(2+3', { digits: 10 });
    X(!e1.ok && /Division by zero/.test(e1.error) && !e2.ok && !e3.ok, 'basic calculator: division by zero, a missing operand and an unclosed bracket give an error and no result');
    X(SC.evaluate('ans+4', { ans: { re: 56, im: 0 }, digits: 10 }).value.re === 60 && SC.evaluate('mem*2', { mem: { re: 25, im: 0 }, digits: 10 }).value.re === 50 && SC.evaluate('1/(8)', { digits: 10 }).value.re === 0.125 && SC.evaluate('(7)^2', { digits: 10 }).value.re === 49 && SC.evaluate('-(5)', { digits: 10 }).value.re === -5, 'basic calculator: the answer and memory keys, the reciprocal, the square and the sign change give the expected values');
    X(STRIP(bhtml) === STRIP(bdisk), 'basic calculator: the committed page equals the generator output');
    X(pg.calc.basic.title.length <= 60 && pg.calc.basic.desc.length >= 50 && pg.calc.basic.desc.length <= 160 && /<title>Basic Calculator Online \| Elecmetric<\/title>/.test(bhtml), 'basic calculator: title and description lengths are within the limits (' + pg.calc.basic.title.length + ' and ' + pg.calc.basic.desc.length + ' characters)');
    X(bhtml.indexOf(eng) > 0 && bhtml.indexOf(bcli) > 0 && bhtml.indexOf('id="bc-live">' + pg.calc.basic.defaultText + '<') > 0 && pg.calc.basic.defaultText === '107.5', 'basic calculator: the page inlines the engine and its own script unchanged, and shows the calculated default result');
    X(!/<script[^>]+src=/.test(bhtml) && !/https?:\/\/(?!elecmetric\.com|schema\.org|www\.w3\.org)/.test(bhtml), 'basic calculator: no external script and no external address in the page');
    X(!/\beval\s*\(/.test(bcli) && !/new\s+Function/.test(bcli) && !/\bFunction\s*\(/.test(bcli) && !/localStorage|sessionStorage|XMLHttpRequest|fetch\s*\(|indexedDB|document\.cookie|innerHTML|outerHTML|insertAdjacentHTML/.test(bcli), 'basic calculator: the page script uses no dynamic code, no storage, no network and no HTML injection');
    { const keys = [...bhtml.matchAll(/<button type="button" class="k [^"]*"([^>]*)>([^<]*)<\/button>/g)];
      X(keys.length === 30 && keys.every((m) => /aria-label=/.test(m[1]) || /^[0-9.()+=\u2212\u00d7\u00f7\u00b1\u232b%]{1,3}$/.test(m[2]) || /^(AC|MC|MR|Ans)$/.test(m[2])), 'basic calculator: the keypad has 30 keys, each with an aria-label or plain visible text (' + keys.length + ' keys)');
      const acts = [...bhtml.matchAll(/data-act="([a-z]+)"/g)].map((m) => m[1]), actBlock = bcli.slice(bcli.indexOf('var ACT = {'), bcli.indexOf('\n  };', bcli.indexOf('var ACT = {'))), clientActs = [...actBlock.matchAll(/(?:^|[\s,{])([a-z]+):/g)].map((m) => m[1]);
      X(acts.every((a) => clientActs.indexOf(a) >= 0), 'basic calculator: every button action on the page has a handler in the page script (' + acts.length + ' buttons, ' + clientActs.length + ' handlers)'); }
    X(/id="bc-in"/.test(bhtml) && /<label for="bc-in"/.test(bhtml) && /id="bc-live"/.test(bhtml) && /aria-live="polite"/.test(bhtml) && /role="group" aria-label="Calculator keys"/.test(bhtml) && /inputmode="decimal"/.test(bhtml), 'basic calculator: the expression field has a label, the result is a live region and the keypad is a labelled group');
    X(/200\*\(1\+10%\)<\/code> = 220/.test(bhtml) && /200\*15%<\/code> = 30/.test(bhtml) && />-4</.test(bhtml.replace(/<td class="n">-4<\/td>/, '>-4<')), 'basic calculator: the percent section shows 15% of 200 = 30 and 200 plus 10 percent = 220');
    const hubHtml = pg.calc.pages.index, smap = bp.build({ base: 'https://x.example' }).root['sitemap.xml'];
    X(hubHtml.indexOf('href="basic-calculator/"') > 0 && smap.indexOf('<loc>https://x.example/calculators/basic-calculator/</loc>') > 0 && bhtml.indexOf('href="../scientific-calculator/"') > 0 && html.indexOf('href="../basic-calculator/"') > 0, 'basic calculator: it is linked from the engineering hub and the Scientific Calculator, links back to it, and is in the sitemap');
  }
  const hubs = Object.keys(pg.calc.pages).filter((k) => !/^index$/.test(k) && pg.calc.cats.some((c) => c.slug === k));
  X(hubs.length === 13 && hubs.every((k) => pg.calc.pages[k].indexOf('href="../scientific-calculator/"') > 0) && pg.calc.pages.index.indexOf('href="scientific-calculator/"') > 0 && fsx.readFileSync(pth.join(root, 'index.html'), 'utf8').indexOf('calculators/scientific-calculator/') > 0, 'scicalc: linked from the home page, the calculators hub and all 13 category hubs');
  X(/\.\/calculators\/scientific-calculator\/index\.html/.test(fsx.readFileSync(pth.join(root, 'sw.js'), 'utf8')), 'scicalc: cached by the service worker for offline use');
  X(/id="sc-ws"/.test(html) && /data-act="wsadd"/.test(html) && /data-act="wsprint"/.test(html) && /data-act="wscopy"/.test(html) && /data-act="wsclear"/.test(html) && /<label class="sc-l" for="sc-ws-title">/.test(html), 'scicalc worksheet: the page carries the worksheet card, its four buttons and a labelled title field');
  X(/html\.sc-wsp body>\*:not\(#sc-ws-sheet\)\{display:none!important\}/.test(html) && /#sc-ws-sheet\{display:none\}/.test(html), 'scicalc worksheet: printing shows only the worksheet sheet, which is hidden on screen');
  X(/Can I keep my results as a worksheet or a PDF\?/.test(html) && /The history, the worksheet and any variables are held in the page/.test(html) && /The worksheet stays in this page and is not stored/.test(html), 'scicalc worksheet: the page says the worksheet is not stored and answers the PDF question');
  X(/textContent/.test(cli) && !/innerHTML\s*=[^=]*(note|\.value|title)/i.test(cli.slice(cli.indexOf('worksheet:'), cli.indexOf('/* ---------- controls'))), 'scicalc worksheet: notes, titles and expressions are written as text, never as HTML');
  X(/WS_MAX = 50/.test(cli) && /sc-wsp/.test(cli) && /afterprint/.test(cli), 'scicalc worksheet: the script caps the worksheet, marks the page while printing and cleans up after printing');
  total += n26; console.log('26. scientific calculator: ' + n26 + '/' + n26 + ' checked');
}

/* 27. footer navigation: every page carries the site footer nav and every one of its links points at a file that exists */
{
  const fsx = require('fs'), pth = require('path'), root = pth.join(__dirname, '..');
  const walk = (d) => fsx.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? (/^(tests|tools|docs|\.github|node_modules)$/.test(e.name) ? [] : walk(pth.join(d, e.name))) : /\.html$/.test(e.name) ? [pth.join(d, e.name)] : []);
  const files = walk(root).filter((f) => !/[\\/]404\.html$/.test(f));
  let n27 = 0, noNav = [], broken = [];
  files.forEach((f) => {
    const m = /<footer class="mf">[\s\S]*?<\/footer>/.exec(fsx.readFileSync(f, 'utf8'));
    if (!m) { noNav.push(pth.relative(root, f)); return; }
    [...m[0].matchAll(/href="([^"#?]*)/g)].map((x) => x[1]).forEach((u) => {
      if (!u || /^(https?:|mailto:)/.test(u)) return;
      let t = pth.join(pth.dirname(f), u); if (/[\\/]$/.test(u)) t = pth.join(t, 'index.html');
      n27++; if (!fsx.existsSync(t)) broken.push(pth.relative(root, f) + ' -> ' + u);
    });
  });
  ok(noNav.length === 0, 'footer navigation: every page has the footer nav' + (noNav.length ? ': ' + noNav.slice(0, 3).join(', ') : ''));
  ok(broken.length === 0, 'footer navigation: every footer link resolves' + (broken.length ? ': ' + broken.slice(0, 3).join('; ') : ''));
  ok(files.length >= 500 && n27 > 20000, 'footer navigation: checked ' + files.length + ' pages and ' + n27 + ' links');
  console.log('27. footer navigation: ' + files.length + ' pages, ' + n27 + ' links checked');
}

/* 28. verification register: three-level classification, nothing Verified without a complete record, scope lists accurate to the code */
{
  const VR = require(path.join(__dirname, '..', 'tools', 'verification_register.js'));
  const basis = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tools', 'verification_register.json'), 'utf8'));
  const scope = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tools', 'calc_scope.json'), 'utf8'));
  const recs = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tools', 'review_records.json'), 'utf8')).records || {};
  const stdNA = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tools', 'standard_applicability.json'), 'utf8')).not_applicable || {};
  const info = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tools', 'site_info.json'), 'utf8'));
  const vec = {}; JSON.parse(fs.readFileSync(path.join(__dirname, 'reference_vectors.json'), 'utf8')).forEach((v) => { vec[v.id] = (vec[v.id] || 0) + 1; });
  let n28 = 0; const R = (c, m) => { n28++; if (!c) { fails++; console.log('FAIL verification register: ' + m); } };
  const teamApproval = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tools', 'team_review_approval.json'), 'utf8'));
  const ctx = (r, today, author, reviewer) => ({ records: r, basis, stdNA, vectors: vec, today: today || '2026-11-12', author: author || '', reviewer: reviewer || '', teamApproval: null });
  const reg = VR.build(E.CALCS, ctx(recs, undefined, info.calculation_author, info.technical_reviewer)).reg;
  R(Object.keys(reg).length === E.CALCS.length, 'one register entry per calculator');
  R(info.calculation_author === 'Rahul Sharma (author)' && !info.technical_reviewer && Object.keys(reg).every((id) => reg[id].author === 'Rahul Sharma (author)' && !reg[id].reviewer), 'all calculator registers attribute the author to Rahul Sharma and name no technical reviewer');
  R(Object.keys(reg).every((id) => reg[id].individualApprovalStatus === 'Not recorded' && reg[id].reviewDate === '' && reg[id].nextReview === '' && reg[id].teamApprovalDate === '' && reg[id].cls !== 'verified'), 'individual approval is not recorded for any calculator, no team approval date is shown, and nothing becomes Verified without its other evidence');
  /* v1.73.4: the public reviewer wording cannot drift from the register state */
  { const rootDir = path.join(__dirname, '..'), files = []; (function walk(d) { fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { if (e.name === 'node_modules' || e.name === '.git') return; const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.html$/.test(e.name)) files.push(p); }); })(rootDir);
    const withReg = files.filter((f) => /Verification register entry/.test(fs.readFileSync(f, 'utf8'))), anyIndividual = false;
    R(withReg.length > 0 && withReg.every((f) => { const h = fs.readFileSync(f, 'utf8'); return !/<th scope=\"row\">Technical reviewer<\/th>/.test(h) && (/No independent technical review has been carried out/.test(h) && !/Mr\. Metric/.test(h)); }) || anyIndividual, 'public reviewer wording: no page labels anyone "Technical reviewer"; every register page states that no independent review has been carried out and names no individual (' + withReg.length + ' pages)');
    R(Object.keys(reg).every((id) => reg[id].cls !== 'verified') || anyIndividual, 'no calculator is Verified without its other required evidence (formula reference, clause-reviewed standard)'); }
  R(Object.keys(basis.simplified).concat(Object.keys(basis.standard_method)).every((id) => E.BY_ID[id]), 'basis lists name only real calculators');
  R(Object.keys(scope.calculators).every((id) => E.BY_ID[id]), 'scope lists name only real calculators');
  R(Object.keys(scope.calculators).every((id) => scope.calculators[id].checked.length && scope.calculators[id].notChecked.length), 'every scope entry states what is checked and what is not');
  R(['cable-size-vd', 'cable-derating', 'voltage-drop', 'cable-sc-withstand', 'breaker-size', 'fault-current', 'fault-loop-impedance', 'earth-grid-resistance'].every((id) => scope.calculators[id]), 'priority engineering calculators have their own scope entry');
  if (!Object.keys(recs).some((k) => recs[k].approved)) R(Object.keys(reg).every((id) => reg[id].cls !== 'verified'), 'no calculator is Verified while no review record exists');
  R(reg['cable-derating'].cls === 'indicative' && reg['ohms-law'].cls === 'reference', 'classification: simplified model is Indicative, textbook identity is Engineering reference');
  const full = { standard: { name: 'IEC 60364-5-52', edition: '2009', date: '2026-01-31', review_status: 'clause_reviewed', review_basis: 'Licensed text checked; clauses and tables recorded' }, approved: { reviewer: 'A. Reviewer', qualification: 'CEng', date: '2026-01-31', next_review: '2027-01-31' }, reference: { formula_source: 'Textbook', exact: 'Eq 4.2', author: 'B. Author' } };
  R(VR.build(E.CALCS, ctx({ 'cable-size-vd': full })).reg['cable-size-vd'].cls === 'verified', 'a complete record makes a calculator Verified');
  const scopeFull = Object.assign({}, full, { standard: Object.assign({}, full.standard, { review_status: 'scope_screened' }) });
  R(VR.build(E.CALCS, ctx({ 'cable-size-vd': scopeFull })).reg['cable-size-vd'].cls !== 'verified' && VR.build(E.CALCS, ctx({ 'cable-size-vd': scopeFull })).reg['cable-size-vd'].missing.indexOf('licensed clause-by-clause standard review') >= 0, 'scope_screened can never satisfy Stage 3 or make a calculator Verified');
  const unspecified = Object.assign({}, full, { standard: Object.assign({}, full.standard) }); delete unspecified.standard.review_status;
  R(VR.build(E.CALCS, ctx({ 'cable-size-vd': unspecified })).reg['cable-size-vd'].standardReviewStatus === 'scope_screened', 'legacy standard metadata without an explicit review state defaults conservatively to scope_screened');
  R(reg['voltage-drop'].standardReviewStatus === 'scope_screened' && reg['voltage-drop'].missing.indexOf('licensed clause-by-clause standard review') >= 0, 'committed standard record remains Partial until licensed clause review');
  R(reg['watts-to-amps'].standardReviewStatus === 'not_applicable', 'Not applicable classification appears separately from pending review');
  R(VR.build(E.CALCS, ctx({ 'ohms-law': full }, '2028-01-01')).reg['ohms-law'].cls === 'reference', 'a review past its next review date drops back from Verified');
  ['standard', 'reference', 'approved'].forEach((k) => { const r = Object.assign({}, full); delete r[k]; R(VR.build(E.CALCS, ctx({ 'cable-size-vd': r })).reg['cable-size-vd'].cls !== 'verified', 'Verified needs the ' + k + ' part'); });
  const noAuthor = Object.assign({}, full, { reference: { formula_source: 'Textbook', exact: 'Eq 4.2' } });
  R(VR.build(E.CALCS, ctx({ 'cable-size-vd': noAuthor })).reg['cable-size-vd'].cls !== 'verified', 'Verified needs a named calculation author');
  R(VR.build(E.CALCS, ctx({ 'cable-derating': full })).reg['cable-derating'].cls === 'verified', 'a simplified model can be Verified once independently reviewed');
  { const bp = require('../tools/build_pages.js'), g = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
    ['calculators/cable-size/index.html', 'calculators/cable-derating/index.html'].forEach((f) => { const h = g(f); R(/id="verification"/.test(h) && /What this calculator checks/.test(h) && /What remains unverified/.test(h) && /Verification register entry/.test(h) && !/Team approval record date/.test(h) && /No independent technical review has been carried out/.test(h) && /Individual professional approval/.test(h) && /results-note/.test(h), f + ': status, scope, no-independent-review statement, results disclaimer and separate individual approval field are on the page'); });
    R(/id="verification"/.test(g('calculators/cable-derating/index.html')) && /Indicative/.test(g('calculators/cable-derating/index.html')), 'cable-derating page shows Indicative');
    const idx = g('index.html'); R(/window\.LL_VERIF=\{[^<]*"reg":/.test(idx) && /"counts":\{"verified":0/.test(idx) && /Public-scope screened; licensed clause review still pending/.test(idx) && /Stage 3 classified/.test(idx) && !/team-level reviewer designation/.test(idx) && /No independent technical review has been carried out/.test(idx), 'app carries standard review state, no-independent-review statement, scope limitation and Stage 3 counts'); }
  console.log('28. verification register: ' + n28 + '/' + n28 + ' checked');
}

/* 29. standards data layer and Cable Selection Check: datasets need provenance, no value is verified without evidence, every result lists what it relied on */
{
  let n29 = 0; const R = (c, m) => { n29++; if (!c) { fails++; console.log('FAIL cable selection: ' + m); } };
  const near = (a, b, e) => Math.abs(a - b) <= (e || 1e-9) * Math.max(1, Math.abs(b));
  const hdr = (kind, extra, src) => '# kind: ' + kind + '\n# standard: TEST ONLY synthetic data, not from any standard\n# edition: none\n# table: T1\n# source: ' + (src || 'user-entered') + '\n# entered_by: Test Author\n' + (extra || '');
  const amp = hdr('ampacity', '# method: test\n# conductor: Cu\n# insulation: XLPE\n# loaded_conductors: 3\n') + 'size_mm2,amps\n25,120\n35,150\n50,180\n';
  const tmp = hdr('temperature-factor', '# conductor: Cu\n# insulation: XLPE\n# reference_ambient_c: 30\n') + 'ambient_c,factor\n25,1.04\n30,1\n35,0.96\n40,0.91\n';
  const grp = hdr('grouping-factor', '# method: test\n') + 'circuits,factor\n1,1\n2,0.8\n3,0.7\n';
  const P = (t, today) => E.parseDatasetCsv(t, today || '2026-11-12');
  const sets = { ampacity: P(amp).dataset, 'temperature-factor': P(tmp).dataset, 'grouping-factor': P(grp).dataset };
  R(P(amp).ok && P(tmp).ok && P(grp).ok, 'well-formed synthetic datasets are accepted');
  R(sets.ampacity.status === 'unverified' && sets.ampacity.verified === null, 'a dataset is unverified unless verifier, qualification and date are recorded');
  R(!P(amp.replace('# entered_by: Test Author\n', '')).ok, 'entered_by is required');
  R(!P(amp.replace('# source: user-entered', '# source: heard-it')).ok, 'source must be licensed-copy, manufacturer or user-entered');
  R(!P(amp.replace('# table: T1\n', '')).ok, 'table reference is required');
  R(!P(amp.replace('# conductor: Cu', '# conductor: Fe')).ok, 'conductor must be Cu or Al');
  R(!P(amp.replace('35,150\n50,180', '50,180\n35,150')).ok, 'rows must be in increasing order');
  R(!P(amp.replace('120', '-5')).ok, 'a non-positive value is rejected');
  R(!P(tmp.replace('0.96', '1.9')).ok, 'a correction factor above 1.5 is rejected');
  R(!P(amp + '# verified_by: A. Person\n').ok, 'verification with only a name is rejected');
  R(P(amp + '# verified_by: A. Person\n# verified_qualification: CEng\n# verified_date: 2026-11-01\n').dataset.status === 'verified', 'verifier, qualification and past date make the dataset verified as recorded');
  R(!P(amp + '# verified_by: A. Person\n# verified_qualification: CEng\n# verified_date: 2099-01-01\n').ok, 'a verification date in the future is rejected');
  R(!P(amp.replace('# kind: ampacity', '# kind: lookup')).ok, 'unknown kind is rejected');
  const base = { Ib: [100, 'A'], In: [100, 'A'], A: [35, 'mm²'], mat: 2, Ta: 32.5, ncirc: 2, Imax: [10, 'kA'], tmax: [0.1, 's'] };
  const r = E.runCableSelection(base, sets), st = (id) => r.steps.find((x) => x.id === id);
  R(r.ok && near(r.Iz, 150 * 0.98 * 0.8, 1e-9), 'Iz = 150 × 0.98 (interpolated between 30 and 35 °C) × 0.8 = 117.6 A');
  R(st('overload-1').status === 'pass' && st('overload-2').status === 'pass', 'In = 100 A passes both overload rules against Iz = 117.6 A');
  R(E.runCableSelection(Object.assign({}, base, { In: [125, 'A'] }), sets).steps.find((x) => x.id === 'overload-1').status === 'fail', 'In = 125 A exceeds Iz and fails');
  R(st('withstand-max').status === 'pass' && /22\.1/.test(st('withstand-max').headline), 'withstand: 10 kA for 0.1 s with k = 143 needs 22.1 mm²');
  R(E.runCableSelection(Object.assign({}, base, { tmax: [0.5, 's'] }), sets).steps.find((x) => x.id === 'withstand-max').status === 'fail', 'withstand fails for 0.5 s at 10 kA on 35 mm² (needs 49.5 mm²)');
  R(st('breaking-capacity').status === 'pending' && st('min-fault-time').status === 'pending' && st('pickup').status === 'pending' && st('selectivity').status === 'pending', 'checks with no input are reported not verified, not passed');
  R(!r.failed && r.pending.length === 4 && /NOT VERIFIED/.test(r.statusText) && r.unverifiedData.length >= 4, 'status says four checks are not verified and lists the unverified data relied on');
  const full = Object.assign({}, base, { Icu: [15, 'kA'], Imin: [500, 'A'], tmin: [0.4, 's'], Ii: [400, 'A'], Isel: [12, 'kA'] }), rf = E.runCableSelection(full, sets), sf = (id) => rf.steps.find((x) => x.id === id);
  R(sf('breaking-capacity').status === 'pass' && sf('min-fault-time').status === 'pass' && sf('pickup').status === 'pass' && sf('selectivity').status === 'pass' && rf.pending.length === 0, 'with every input given, all checks are made');
  R(/NOT INDEPENDENTLY VERIFIED/.test(rf.statusText), 'even with every check passing, unverified data is stated in the status');
  R(near(Math.pow(143 * 35 / 500, 2), 100.2001, 1e-6) && /100\.2/.test(sf('min-fault-time').headline), 'minimum-fault allowed time t = (k S / I)² = 100.2 s');
  R(E.runCableSelection(Object.assign({}, full, { Imin: [4000, 'A'], tmin: [2, 's'] }), sets).steps.find((x) => x.id === 'min-fault-time').status === 'fail', 'a 2 s disconnection at 4000 A fails the (kS/I)² limit of 1.57 s');
  R(E.runCableSelection(Object.assign({}, full, { Icu: [8, 'kA'] }), sets).failed, 'breaking capacity below the maximum fault fails the result');
  R(E.runCableSelection(Object.assign({}, full, { Ii: [600, 'A'] }), sets).steps.find((x) => x.id === 'pickup').status === 'fail', 'pick-up above the minimum fault fails');
  { const o = E.runCableSelection(Object.assign({}, base, { Ta: 50 }), sets); R(o.steps.find((x) => x.id === 'temperature-factor').status === 'pending' && o.Iz === null && /not extrapolate/.test(o.steps.find((x) => x.id === 'temperature-factor').sentence), 'ambient outside the table is not extrapolated; Iz is not computed'); }
  { const o = E.runCableSelection(Object.assign({}, base, { A: [95, 'mm²'] }), sets); R(o.steps.find((x) => x.id === 'ampacity').status === 'pending' && o.Iz === null, 'a size missing from the ampacity table is reported missing, not guessed'); }
  { const o = E.runCableSelection(Object.assign({}, base, { ncirc: 5 }), sets); R(o.steps.find((x) => x.id === 'grouping-factor').status === 'pending', 'a circuit count missing from the grouping table is reported missing'); }
  { const o = E.runCableSelection(Object.assign({}, base, { mat: 4 }), sets); R(o.Iz === null && /dataset is for Cu/.test(o.steps.find((x) => x.id === 'ampacity').sentence), 'a dataset for another conductor or insulation is refused'); }
  { const o = E.runCableSelection(Object.assign({}, base, { ItabM: [150, 'A'], ktM: 0.98, kgM: 0.8 }), {}); R(near(o.Iz, 117.6, 1e-9) && o.unverifiedData.some((x) => /entered by hand/.test(x)), 'hand-entered factors work and are listed as not verified'); }
  { const o = E.runCableSelection(base, {}); R(o.Iz === null && o.steps.find((x) => x.id === 'temperature-factor').status === 'pending', 'with no data and no hand values, Iz is not computed: no silent fallback to the approximate factor'); }
  { const ksets = Object.assign({}, sets, { 'k-factor': P(hdr('k-factor', '# conductor: Cu\n# insulation: XLPE\n') + 'size_max_mm2,k\n300,140\ninf,130\n').dataset }), o = E.runCableSelection(base, ksets); R(/k = 140|\/ 140/.test(o.steps.find((x) => x.id === 'withstand-max').sentence), 'a k-factor dataset overrides the built-in constant'); }
  { const v = (t) => P(t + '# verified_by: A. Person\n# verified_qualification: CEng\n# verified_date: 2026-11-01\n').dataset, vs = { ampacity: v(amp), 'temperature-factor': v(tmp), 'grouping-factor': v(grp) }, o = E.runCableSelection(Object.assign({}, base, { Ta: 30 }), vs); R(o.unverifiedData.length === 2 && o.unverifiedData.some((x) => /1\.45/.test(x)) && o.unverifiedData.some((x) => /k factor/.test(x)), 'with verified datasets, the remaining unverified items are the built-in k and the 1.45 coefficient'); }
  R(E.CABLE_SEL_NOT_CHECKED.length >= 4 && rf.report.indexOf('NOT CHECKED BY ELECMETRIC') > 0 && rf.report.indexOf('RELIED ON, NOT VERIFIED') > 0, 'the report lists what is not checked and what was relied on');
  { const d = require('fs'), pth = require('path'); ['ampacity', 'temperature-factor', 'grouping-factor', 'k-factor'].forEach((k) => { const t = d.readFileSync(pth.join(__dirname, '..', 'data-templates', k + '-template.csv'), 'utf8'); R(/^# kind: /m.test(t) && !/^\d/m.test(t), 'template for ' + k + ' has headers and no table values'); }); }
  console.log('29. cable selection and standards data layer: ' + n29 + '/' + n29 + ' checked');
}

console.log(fails ? '\n' + fails + ' FAILED of ' + total : '\nALL ' + total + ' CHECKS PASSED');
process.exit(fails ? 1 : 0);
