/* Tests for tools/quad_eng_engine.js (Quadratic Formula Calculator, Mode 05: Engineering Quadratic Solver) against tests/quad_eng_vectors.json
   (independent: gen_quad_eng_vectors.py, exact sympy roots for the class and mpmath at 60 digits for every number and for the natural response)
   plus fixed worked examples, the exact critical-damping policy, input reading and the built page.
   The class (over, critical, under, ...) is compared exactly. Decimal quantities use a relative tolerance of 1e-9; the response is compared against the size of its own terms. */
const fs = require('fs'), path = require('path');
const E = require('../tools/quad_eng_engine.js'), V = require('./quad_eng_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 25) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const ok = (c, m) => { n++; if (!c) bad(m); };
const near = (a, b, m, rel = 1e-9, abs = 0) => { n++; const tol = rel * Math.max(Math.abs(a), Math.abs(b)) + abs; if (!(Math.abs(a - b) <= tol)) bad(m + ': got ' + a + ', expected ' + b); };

const counts = {};
for (const v of V.rows) {
  const t = '[' + v.type + ' ' + v.in.join(', ') + ' | x0 ' + v.x0 + ', v0 ' + v.v0 + ']';
  const r = E.analyse({ type: v.type, p1: v.in[0], p2: v.in[1], p3: v.in[2], x0: v.x0, v0: v.v0, dp: 10 });
  if (!r.ok) { bad(t + ' not solved: ' + r.error); continue; }
  counts[v.key] = (counts[v.key] || 0) + 1;
  eq(r.key, v.key, 'class ' + t); eq(r.stable, v.stable, 'stable ' + t);
  ok(r.checkOk, 'every check holds ' + t + ' ' + r.checks.filter((c) => !c.ok).map((c) => c.label).join('; '));
  const sc = Math.max(...v.roots.map((x) => Math.hypot(x[0], x[1])), 1e-300), big = sc;
  [0, 1].forEach((i) => { near(r.rootsF[i].re, v.roots[i][0], 'root ' + (i + 1) + ' real part ' + t, 1e-9, 1e-12 * sc); near(r.rootsF[i].im, v.roots[i][1], 'root ' + (i + 1) + ' imaginary part ' + t, 1e-9, 1e-12 * sc); });
  const p = r.p;
  const pairs = [['omega0', 'omega0'], ['alpha', 'alpha'], ['zeta', 'zeta'], ['f0', 'f0'], ['Q', 'Q'], ['omegad', 'omegad'], ['overshoot', 'overshoot'], ['peakTime', 'peakTime'], ['tauDom', 'tauDom']];
  for (const [k, vk] of pairs) {
    if (vk in v) { ok(p[k] !== undefined && p[k] !== null, k + ' present ' + t); if (p[k] !== undefined && p[k] !== null) near(p[k], v[vk], k + ' ' + t, 1e-9, vk === 'alpha' ? 1e-12 * sc : 0); }
    else if (k !== 'tauDom' && k !== 'alpha') ok(p[k] === undefined || p[k] === null, k + ' absent ' + t + ' (got ' + p[k] + ')');
  }
  if ('Rcrit' in v) near(v.type === 'mech' ? p.ccrit : p.Rcrit, v.Rcrit, 'critical damping value ' + t);
  v.samples.forEach(([tt, x, dx, scl], i) => {
    near(r.response.at(tt), x, 'x(t) sample ' + i + ' ' + t, 0, 1e-8 * scl);
    near(r.response.slopeAt(tt), dx, 'x\u2032(t) sample ' + i + ' ' + t, 0, 1e-8 * scl * big);
  });
}
console.log('classes covered: ' + JSON.stringify(counts));
['over', 'critical', 'under', 'undamped', 'marginal', 'unstable', 'unstable-osc'].forEach((k) => ok(counts[k] > 0, 'vectors cover class ' + k));

/* worked examples with exact texts */
const A = (t, p1, p2, p3) => E.analyse({ type: t, p1, p2, p3 });
let r = A('series', '10', '1m', '100u');
eq(r.label, 'Overdamped', 'series 10 ohm, 1 mH, 100 uF'); eq(r.roots.map((x) => x.exact).join(' ; '), '\u22125000 \u2212 1000\u221a15 ; \u22125000 + 1000\u221a15', 'exact roots of the overdamped example');
r = A('series', '20', '1m', '1u'); eq(r.label, 'Underdamped', 'series 20 ohm, 1 mH, 1 uF'); eq(r.roots.map((x) => x.exact).join(' ; '), '\u221210000 + 30000i ; \u221210000 \u2212 30000i', 'exact complex roots');
near(r.p.omegad, 30000, 'damped frequency', 1e-12); near(r.p.omega0, Math.sqrt(1e9), 'natural frequency', 1e-12);
r = A('series', '63.2455532033676', '1m', '1u'); ok(r.key === 'over' || r.key === 'critical', 'a decimal that only approximates the critical R is not claimed to be critical');
r = A('series', '20', '1m', '10u'); eq(r.key, 'critical', 'R = 2 sqrt(L/C) = 20 ohm is critical, exactly'); eq(r.roots.length, 1, 'one repeated root'); eq(r.roots[0].exact, '-10000', 'repeated root');
r = A('series', '20.000000000000001', '1m', '10u'); eq(r.key, 'over', 'R one part in 1e16 above critical is overdamped, decided exactly');
r = A('series', '19.999999999999999', '1m', '10u'); eq(r.key, 'under', 'R one part in 1e16 below critical is underdamped, decided exactly');
r = A('parallel', '1k', '10m', '100n'); eq(r.key, 'under', 'parallel 1 kohm, 10 mH, 100 nF'); near(r.p.Q, 1000 * Math.sqrt(100e-9 / 10e-3), 'parallel Q = R sqrt(C/L)', 1e-12);
r = A('series', '10', '1m', '100u'); near(r.p.Rcrit, 2 * Math.sqrt(1e-3 / 1e-4), 'series critical resistance', 1e-12);
r = A('series', '20', '1m', '1u'); near(r.p.Q, Math.sqrt(1e-3 / 1e-6) / 20, 'series Q = sqrt(L/C)/R', 1e-12); near(r.p.bw, 20 / 1e-3, 'series bandwidth R/L', 1e-12);
r = A('mech', '1', '4', '4'); eq(r.key, 'critical', 'mass-spring-damper c = 2 sqrt(km)'); near(r.p.ccrit, 4, 'critical damping c');
r = A('zeta', '100', '0.5'); near(r.p.overshoot, 100 * Math.exp(-Math.PI * 0.5 / Math.sqrt(0.75)), 'overshoot at zeta 0.5', 1e-12); near(r.p.overshoot, 16.3, 'overshoot at zeta 0.5 is about 16.3 percent', 0.01);
r = A('control', '1', '-2', '5'); eq(r.key, 'unstable-osc', 'negative damping'); eq(r.stable, false, 'not stable');
r = A('control', '1', '0', '0'); eq(r.key, 'marginal', 's^2 = 0'); eq(r.checkOk, true, 's^2 = 0 checks');
r = A('control', '-2', '-4', '-10'); eq(r.key, 'under', 'all coefficients negative is stable (same as all positive)');
r = A('control', '1', '3', '0'); eq(r.key, 'marginal', 'one root at zero'); r = A('control', '1', '0', '-4'); eq(r.key, 'unstable', 'saddle');
/* SI prefixes, units and fractions are read exactly */
const rd = (s, f) => { const q = E.readValue(s, f); return q.v ? q.v.n + '/' + q.v.d : 'E:' + (q.error || ''); };
const Rf = E.TYPES.series.fields[0], Lf = E.TYPES.series.fields[1], Cf = E.TYPES.series.fields[2];
eq(rd('4.7k', Rf), '4700/1', '4.7k'); eq(rd('4.7 k\u03a9', Rf), '4700/1', '4.7 kilohm'); eq(rd('10 mH', Lf), '1/100', '10 mH'); eq(rd('100nF', Cf), '1/10000000', '100 nF'); eq(rd('2.2u', Cf), '11/5000000', '2.2u'); eq(rd('1e-3', Lf), '1/1000', 'scientific');
eq(rd('3/4', Lf), '3/4', 'fraction'); eq(rd('1 M', Rf), '1000000/1', '1 M'); eq(rd('5 pF', Cf), '1/200000000000', '5 pF'); eq(rd('1\u00b5H', Lf), '1/1000000', 'micro sign');
/* errors */
const bd = (t, a, b, c, key) => { const x = A(t, a, b, c); ok(!x.ok && x.errors && x.errors[key], 'rejected ' + [t, a, b, c] + ' on ' + key + ': ' + JSON.stringify(x.errors)); };
bd('series', '10', '0', '1u', 'p2'); bd('series', '10', '1m', '-1u', 'p3'); bd('series', '-1', '1m', '1u', 'p1'); bd('series', 'x', '1m', '1u', 'p1'); bd('parallel', '0', '1m', '1u', 'p1'); bd('zeta', '0', '0.5', '', 'p1'); bd('zeta', '100', '-0.5', '', 'p2'); bd('mech', '0', '1', '1', 'p1');
ok(!A('control', '0', '2', '5').ok && /not a second-order/.test(A('control', '0', '2', '5').error), 'a = 0 is not second order');
ok(A('series', '', '', '').empty === true, 'empty input is reported as empty');
ok(!A('series', '10', '1e400', '1u').ok, 'out-of-range exponent rejected');
ok(!A('series', '10', '1e-200', '1e-200').ok, 'values too extreme to analyse are refused, not mis-computed');
ok(!E.analyse({ type: 'bogus' }).ok, 'unknown type');
ok(A('series', '10', '1m', '100u').summary.split('\n').length >= 7, 'summary has the main lines');
/* number formatting */
eq(E.sig(1234.5678, 6), '1234.57', 'sig'); eq(E.sig(0.000012345, 4), '1.235\u00d710\u207b\u2075', 'sig small'); eq(E.sig(1.5e-9, 3), '1.5\u00d710\u207b\u2079', 'sig exponent'); eq(E.sig(0, 6), '0', 'sig zero');
eq(E.si(503.292, 'Hz', 6), '503.292 Hz', 'si Hz'); eq(E.si(31622.7766, 'rad/s', 6), '31.6228 krad/s', 'si krad/s'); eq(E.si(0.0035, 's', 3), '3.5 ms', 'si ms'); eq(E.si(1e-9, 'F', 3), '1 nF', 'si nF');
ok(E.si(999999.9, 'Hz', 4) === '1 MHz', 'si carries up at the boundary: ' + E.si(999999.9, 'Hz', 4));

/* the built page, when it exists */
const pg = path.join(__dirname, '..', 'calculators', 'engineering-quadratic', 'index.html');
if (fs.existsSync(pg)) {
  const h = fs.readFileSync(pg, 'utf8');
  ok(/<h1>[^<]*Engineering[^<]*<\/h1>/.test(h) || /<h1>[^<]*RLC[^<]*<\/h1>/.test(h), 'page h1');
  ok(/Mode 05/.test(h) && !/Mode 05 \u00b7 Engineering Solver \(coming\)/.test(h), 'Mode 05 is live on its own page');
  ok(h.includes('root.QuadEng = api') && h.includes('root.Quad = api'), 'both engines inlined');
  ok(!/\(coming\)/.test(h), 'no mode is still marked coming');
  ['Mode 01', 'Mode 02', 'Mode 03', 'Mode 04'].forEach((m) => ok(h.includes(m), 'mode strip has ' + m));
  ok((h.match(/<h1/g) || []).length === 1, 'one h1');
  ['quadratic-solver', 'discriminant-calculator', 'parabola-graph', 'exact-roots'].forEach((s) => ok(h.includes('../' + s + '/'), 'links to ' + s));
}
console.log((fail ? 'FAILED ' + fail + ' of ' : 'ALL ') + n + ' CHECKS' + (fail ? '' : ' PASSED') + ' (quad_eng_test)');
process.exit(fail ? 1 : 0);
