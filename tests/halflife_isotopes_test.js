/* Isotope presets on the Half-Life Calculator page (Mode 01).
   The expected table below is typed from the cited publications, not read from tools/halflife_isotopes.js, so a slip in the data file is caught here.
   Run: node tests/halflife_isotopes_test.js */
const fs = require('fs'), path = require('path');
const H = require('../tools/halflife_engine.js'), ISO = require('../tools/halflife_isotopes.js');
let n = 0, fail = 0;
const ok = (c, m) => { n++; if (!c) { fail++; console.log('FAIL: ' + m); } };
const eq = (a, b, m) => ok(a === b, m + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')');

/* id: [value, unit, uncertainty, source key] as published */
const WANT = {
  c14: [5730, 'yr', null, 'conv'], f18: [109.77, 'min', 0.05, 'ensdf'], tc99m: [6.0072, 'h', 0.0009, 'ensdf'], i131: [8.0252, 'd', 0.0006, 'ensdf'],
  co60: [5.2711, 'yr', 0.0008, 'irdff'], cs137: [30.08, 'yr', 0.09, 'irdff'], ra226: [1600, 'yr', 7, 'npl'], am241: [432.6, 'yr', 0.6, 'npl'],
  pu239: [24110, 'yr', 30, 'npl'], u238: [4.468, 'Gyr', 0.006, 'npl']
};
eq(ISO.LIST.length, Object.keys(WANT).length, 'number of presets');
Object.keys(WANT).forEach((id) => {
  const x = ISO.byId(id), w = WANT[id]; ok(!!x, 'preset exists: ' + id); if (!x) return;
  eq(x.T, w[0], id + ' half-life'); eq(x.unit, w[1], id + ' unit'); eq(x.unc, w[2], id + ' uncertainty'); eq(x.source, w[3], id + ' source');
  ok(H.isTimeUnit(x.unit), id + ' unit is a calculator time unit'); ok(x.T > 0 && isFinite(x.T), id + ' half-life is positive and finite');
  ok(x.unc === null || (x.unc > 0 && x.unc < x.T), id + ' uncertainty is positive and smaller than the half-life');
  ok(ISO.SOURCES[x.source] && ISO.SOURCES[x.source].label && ISO.SOURCES[x.source].note, id + ' source is described');
  /* the decay law applied to each preset: one half-life leaves exactly half, two leave a quarter, and the time to reach 25% is two half-lives */
  const r1 = H.run({ N0: '100', t: String(x.T), T: String(x.T), timeUnit: x.unit, quantityUnit: 'Bq' }), r2 = H.run({ N0: '100', Nt: '25', T: String(x.T), timeUnit: x.unit });
  ok(r1.ok && Math.abs(r1.sol.Nt - 50) < 1e-9, id + ' 50 after one half-life'); ok(r2.ok && Math.abs(r2.sol.t / x.T - 2) < 1e-12, id + ' two half-lives to reach 25');
  /* independent decay constant and mean lifetime: ln 2 / T and T / ln 2 */
  const l = H.run({ N0: '100', t: '0', T: String(x.T), timeUnit: x.unit }).sol; ok(Math.abs(l.lambda * x.T - Math.LN2) < 1e-15, id + ' lambda T = ln 2'); ok(Math.abs(l.tau - x.T / Math.LN2) < 1e-9 * l.tau, id + ' tau');
});
eq(Object.keys(ISO.SOURCES).sort().join(','), 'conv,ensdf,irdff,npl', 'source keys');
ok(new Set(ISO.LIST.map((x) => x.id)).size === ISO.LIST.length, 'ids are unique');

/* the built page */
const page = path.join(__dirname, '..', 'calculators', 'half-life-calculator', 'index.html');
if (fs.existsSync(page)) {
  const html = fs.readFileSync(page, 'utf8');
  ok(/<select id="hl-preset"/.test(html) && /<label for="hl-preset"/.test(html), 'preset select has a label');
  ISO.LIST.forEach((x) => {
    ok(new RegExp('<option value="' + x.id + '" data-T="' + String(x.T).replace('.', '\\.') + '" data-tu="' + x.unit + '"').test(html), 'option for ' + x.id + ' carries the half-life and unit');
    ok(html.indexOf(x.name + ' (' + x.symbol + ')') > 0, x.id + ' is in the sources table');
  });
  ok(/<h2>Isotope half-lives<\/h2>/.test(html), 'isotope section present');
  Object.keys(ISO.SOURCES).forEach((k) => ok(html.indexOf(ISO.SOURCES[k].label.slice(0, 40).replace(/&/g, '&amp;')) > 0, 'source listed: ' + k));
  ok(/not a data library/.test(html) && /dose, exposure or safety/.test(html), 'scope wording present');
  ok(/getElementById\('hl-preset'\)|\$\('hl-preset'\)/.test(html), 'client handles the preset');
  ok(/is now read in/.test(html), 'unit-change warning is in the client');
  eq((html.match(/<h1[ >]/g) || []).length, 1, 'still one h1');
} else console.log('(page not built yet: skipping page checks)');
console.log(n + ' checks, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
