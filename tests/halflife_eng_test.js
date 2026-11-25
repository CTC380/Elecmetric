/* Tests for tools/halflife_eng_engine.js (Half-Life Calculator, Mode 05: RC and RL engineering decay) against tests/halflife_eng_vectors.json
   (independent: gen_halflife_eng_vectors.py, Python decimal at 450 digits), the cases in the CEO product decision, the graph and the probe. Also checks the built pages.
   Run: node tests/halflife_eng_test.js */
const fs = require('fs'), path = require('path');
const E = require('../tools/halflife_eng_engine.js'), H = require('../tools/halflife_engine.js'), V = require('./halflife_eng_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 20) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const ok = (c, m) => { n++; if (!c) bad(m); };
const near = (a, b, m, nn = 0, base = 2e-14) => { n++; const e = Number(b), tol = Math.max((base + 2.5e-16 * nn) * Math.abs(e), 1e-322); if (!(Math.abs(a - e) <= tol)) bad(m + ': got ' + a + ', expected ' + e); };
const run = (o) => E.run(o);
const RC = (o) => run(Object.assign({ circuit: 'rc', find: 'value', X0: '100', x0Unit: 'V', R: '10', rUnit: 'kohm', C: '100', cUnit: 'uF', t: '1', tUnit: 's' }, o));
const RL = (o) => run(Object.assign({ circuit: 'rl', find: 'value', X0: '2', x0Unit: 'A', R: '10', rUnit: 'ohm', L: '100', lUnit: 'mH', t: '10', tUnit: 'ms' }, o));
const GN = (o) => run(Object.assign({ circuit: 'gen', find: 'value', X0: '1', tau: '5', tauUnit: 'ms', t: '20', tUnit: 'ms' }, o));

/* 1. independent vectors */
for (const v of V) {
  const r = run(v.in), tag = v.name;
  if (!r.ok) { bad(tag + ' errored: ' + r.error); continue; }
  ok(r.check.ok, tag + ' built-in check failed');
  const nn = Number(v.out.n);
  const get = { tau: r.tauS, tHalf: r.tHalfS, lambda: r.lambda, time: r.tS, n: r.n, frac: r.frac, dec: r.dec, xt: r.xt };
  Object.keys(v.out).forEach((k) => {
    const got = get[k] !== undefined ? get[k] : r.v[k];
    if (got === undefined) { bad(tag + ' missing ' + k); return; }
    const exp = Number(v.out[k]);
    if (k === 'n' || k === 'time') near(got, v.out[k], tag + ' ' + k, 0, 4e-14);
    else if (k === 'dec') near(got, v.out[k], tag + ' ' + k, nn, 4e-14);
    else near(got, v.out[k], tag + ' ' + k, nn * (k === 'frac' || k === 'xt' || k === 'It' || k === 'Qt' || k === 'VRt' || k === 'psit' ? 1 : 2), 4e-14);
  });
}

/* 2. the brief's cases */
const a = RC();
near(a.tauS, 1, 'RC tau = 1 s', 0, 1e-15); near(a.xt, 100 * Math.exp(-1), 'V(1) = 100 e^-1'); ok(/^36\.7879/.test(String(a.xt).slice(0, 7)) && Math.abs(a.xt - 36.79) < 0.005, 'V(1) = 36.79 V');
const b = RC({ find: 'time', target: '50' }); near(b.tS, Math.LN2, 'time to 50 V is RC ln 2 = 0.693 s'); ok(Math.abs(b.tS - 0.693) < 5e-4, '0.693 s'); near(b.tHalfS, Math.LN2, 'half-value time');
near(RL().tauS, 0.01, 'RL tau = L / R = 10 ms', 0, 1e-15); near(RL().xt, 2 * Math.exp(-1), 'RL I(10 ms)'); near(RL().tHalfS, 0.01 * Math.LN2, 'RL half-value time (L / R) ln 2');
near(RC({ t: '0.5' }).xt, 100 * Math.exp(-0.5), 'RC at half a time constant'); eq(RC({ t: '0' }).xt, 100, 'time zero leaves the initial value'); eq(RC({ t: '0' }).frac, 1, 'time zero fraction'); eq(RC({ t: '0' }).dec, 0, 'time zero decayed');
near(RC({ find: 'time', target: '50', tgm: 1 }).n, Math.LN2, 'n = ln 2 for 50%'); eq(RC({ find: 'time', target: '100' }).tS, 0, 'target = initial gives time 0'); ok(RC({ find: 'time', target: '100' }).warnings.some((w) => w.code === 'TARGET_EQUALS_START'), 'target at start noted');
near(RC({ find: 'time', target: '36.787944117144233', tUnit: 's' }).n, 1, 'target 1/e gives one time constant', 0, 1e-12);
const pc = RC({ find: 'time', target: '10', targetMode: 'pct' }); near(pc.n, Math.log(10), 'time to 10% is tau ln 10'); eq(pc.xt, 10, '10% of 100 V is 10 V'); near(pc.frac, 0.1, '10% fraction');
near(GN().frac, Math.exp(-4), 'generic: 4 time constants'); near(GN({ tau: '30', tauUnit: 'd', tauKind: 'half', t: '30', tUnit: 'd' }).frac, 0.5, 'generic: one half-life leaves 50%'); near(GN({ tau: '30', tauUnit: 'd', tauKind: 'half', t: '60', tUnit: 'd' }).frac, 0.25, 'generic: two half-lives leave 25%');
near(GN({ tauKind: 'half' }).tauS, 0.005 / Math.LN2, 'tau from a half-life'); eq(GN({ quantityUnit: 'mg ' }).quantityUnit, 'mg', 'generic unit label trimmed');
/* energy falls as f^2, and the three energies add up */
const en = RC({ t: '0.7' }); near(en.v.Et, en.v.E0 * en.frac * en.frac, 'energy left = E0 f^2'); near(en.v.E0, 0.5 * 100e-6 * 100 * 100, 'E0 = C V^2 / 2'); near(en.v.Et + en.v.Ed, en.v.E0, 'energy left + dissipated = E0', 0, 1e-13); near(en.v.I0, 0.01, 'I0 = V0 / R'); near(en.v.Q0, 0.01, 'Q0 = C V0'); near(en.v.P0, 1, 'P0 = V0^2 / R');
const el = RL({ t: '4' }); near(el.v.E0, 0.5 * 0.1 * 4, 'RL E0 = L I^2 / 2'); near(el.v.VR0, 20, 'RL initial voltage across R'); near(el.v.VRt, 20 * el.frac, 'RL voltage across R follows the current');
/* units */
near(RC({ R: '10000', rUnit: 'ohm' }).tauS, 1, 'ohm equals kohm x 1000'); near(RC({ C: '0.1', cUnit: 'mF' }).tauS, 1, 'mF'); near(RC({ C: '1e5', cUnit: 'nF' }).tauS, 1, 'nF', 0, 1e-15); near(RC({ C: '1e5', cUnit: 'pF', R: '10', rUnit: 'Mohm' }).tauS, 1, 'pF and Mohm', 0, 1e-15); eq(RC({ t: '1000', tUnit: 'ms' }).frac, a.frac, '1000 ms = 1 s'); near(RC({ t: '1', tUnit: 'min' }).n, 60, 'minute');
eq(RC({ X0: '0.1', x0Unit: 'kV' }).xt, 0.1 * Math.exp(-1) * 1, 'voltage shown in the unit entered'); near(RC({ X0: '100000', x0Unit: 'mV' }).v.E0, a.v.E0, 'energy independent of the voltage unit'); eq(RC({ X0: '5', x0Unit: 'kV' }).quantityUnit, 'kV', 'unit label');
near(RL({ L: '100000', lUnit: 'uH' }).tauS, RL().tauS, 'uH'); near(RL({ R: '10000', rUnit: 'mohm' }).tauS, RL().tauS, 'mohm'); near(RL({ X0: '2000', x0Unit: 'mA' }).v.E0, RL().v.E0, 'energy independent of the current unit');

/* 3. validation and limits */
eq(run({}).ok, false, 'empty input is not a result'); eq(run({}).empty, true, 'empty is flagged'); eq(RC({ X0: '' }).empty, true, 'empty voltage'); eq(RC({ X0: '' }).field, 'X0', 'empty voltage field'); eq(RC({ t: '' }).empty, true, 'empty time'); eq(RC({ find: 'time', target: '' }).empty, true, 'empty target');
[['X0', '0'], ['X0', '-5'], ['R', '0'], ['R', '-1'], ['C', '0']].forEach((x) => { const r = RC({ [x[0]]: x[1] }); eq(r.ok, false, x + ' refused'); eq(r.field, x[0], x + ' field'); });
eq(RL({ L: '0' }).ok, false, 'zero inductance refused'); eq(RL({ L: '0' }).field, 'L', 'zero inductance field'); eq(RL({ R: '0' }).field, 'R', 'zero resistance (RL) field'); eq(GN({ tau: '0' }).field, 'tau', 'zero time constant field'); eq(GN({ tau: '-2' }).ok, false, 'negative tau refused');
eq(RC({ t: '-1' }).ok, false, 'negative time refused'); eq(RC({ t: '-1' }).field, 't', 'negative time field');
eq(RC({ find: 'time', target: '0' }).ok, false, 'zero target refused'); ok(/infinite time/.test(RC({ find: 'time', target: '0' }).error), 'zero target explained'); eq(RC({ find: 'time', target: '101' }).ok, false, 'target above initial refused'); eq(RC({ find: 'time', target: '101' }).field, 'target', 'target field');
eq(RC({ find: 'time', target: '101', targetMode: 'pct' }).ok, false, 'over 100% refused'); eq(RC({ find: 'time', target: '-1' }).ok, false, 'negative target refused'); eq(RC({ find: 'time', target: '100', targetMode: 'pct' }).tS, 0, '100% gives time 0');
['abc', 'Infinity', 'NaN', '1e999', '1/2', '5 V'].forEach((x) => ['X0', 'R', 'C', 't'].forEach((f) => { const r = RC({ [f]: x }); eq(r.ok, false, 'refuses ' + x + ' in ' + f); eq(r.field, f, 'field for ' + x + ' in ' + f); }));
eq(RC({ x0Unit: 'MV' }).ok, false, 'unknown voltage unit'); eq(RC({ rUnit: 'x' }).ok, false, 'unknown resistance unit'); eq(RC({ cUnit: 'x' }).ok, false, 'unknown capacitance unit'); eq(RL({ lUnit: 'x' }).ok, false, 'unknown inductance unit'); eq(RC({ tUnit: 'x' }).ok, false, 'unknown time unit'); eq(GN({ tauUnit: 'x' }).ok, false, 'unknown tau unit');
eq(RC({ R: '1e300', C: '1e300' }).ok, false, 'time constant out of range refused'); eq(RC({ t: '1e300', C: '1e-300', R: '1e-3' }).ok, false, 'huge n refused');
eq(RC({ R: '11,000', C: '1e2', t: ' 1 ' }).ok, true, 'accepts grouped digits, exponent notation and spaces');
const un = RC({ t: '1000' }); eq(un.ok, true, 'underflow allowed'); eq(un.frac, 0, 'underflow fraction is 0'); ok(un.warnings.some((w) => w.code === 'UNDERFLOW_TO_ZERO'), 'underflow warned'); eq(un.dec, 1, 'underflow decayed is 1');
ok(a.warnings.length === 0, 'ordinary case has no warnings');
const tiny = RC({ find: 'time', X0: '1', target: '1e-300' }); eq(tiny.ok, true, 'tiny target ok'); near(tiny.n, 300 * Math.LN10, 'tiny target n', 0, 1e-13);
const tiny2 = RC({ t: '1e-9', C: '1', cUnit: 'F', R: '1', rUnit: 'ohm', tUnit: 's' }); near(tiny2.dec, 1e-9, 'tiny decay keeps its digits', 0, 1e-8); ok(tiny2.dec > 0, 'tiny decay is not zero');

/* 4. the probe */
const at = E.at(a, 1); near(at.frac, a.frac, 'probe at 1 tau'); eq(E.at(a, 0).frac, 1, 'probe at zero'); near(E.at(a, Math.LN2).frac, 0.5, 'probe at the half-value time', 0, 1e-15); near(E.at(a, 2).xt, 100 * Math.exp(-2), 'probe value'); near(E.at(a, 3).tS, 3, 'probe time');

/* 5. the graph */
const svgOk = (s, m) => { ok(/^<svg [^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(s) && /<\/svg>$/.test(s), m + ' is a closed svg'); ok(!/NaN|Infinity|undefined/.test(s), m + ' has no NaN, Infinity or undefined'); ok(!/var\(--/.test(s) && !/<script|onload=|href="http/i.test(s), m + ' is self-contained'); };
const g1 = E.graph(a, {}), g2 = E.graph(RL(), { probe: 2 }), g3 = E.graph(GN({ t: '300' }), {}), g4 = E.graph(un, {});
svgOk(g1, 'RC graph'); svgOk(g2, 'RL graph with probe'); svgOk(g3, 'generic graph (n = 60)'); svgOk(g4, 'underflow graph');
eq((g1.match(/<polyline/g) || []).length, 1, 'one curve'); eq((g1.match(/class="tcm"/g) || []).length, 5, 'markers at 1 to 5 tau'); ok(/class="hvm"/.test(g1) && /0\.693/.test(g1), 'half-value marker'); ok(/<title id="ed-gt">/.test(g1) && /<desc id="ed-gd">/.test(g1), 'title and description');
ok(/36\.8%/.test(g1) && /0\.674%|0\.673/.test(g1), 'percentages at 1 and 5 tau'); ok(/RC capacitor discharge/.test(g1) && /RL inductor current decay/.test(g2) && /Exponential decay/.test(g3), 'titles by circuit'); eq((g1.match(/class="res"/g) || []).length, 1, 'the result is marked'); ok(!/class="res"/.test(g3), 'a result beyond 40 tau is not drawn'); ok(/not drawn/.test(g3), 'and says so');
ok(/stroke-dasharray="3 3"/.test(g2) && !/stroke-dasharray="3 3"/.test(g1), 'probe line only when asked'); ok(/viewBox="0 0 400 300"/.test(E.graph(a, { width: 400, height: 300 })), 'custom size');
const lp = g1.match(/points="([^"]*)"/)[1].split(' ').map((x) => x.split(',').map(Number)); eq(lp.length, 241, 'curve has 241 points'); ok(lp.every((x, i) => i === 0 || x[1] >= lp[i - 1][1]), 'curve falls monotonically (y rises on screen)');
eq(E.graph(a, { probe: -1 }).indexOf('r="5"'), -1, 'probe outside range not drawn'); ok(!/<b>/.test(E.graph(GN({ quantityUnit: '<b>' }), {})), 'no raw markup in the graph');

/* 6. properties */
let seed = 777; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
for (let i = 0; i < 600; i++) {
  const R0 = Math.pow(10, rnd() * 4 - 1), C0 = Math.pow(10, rnd() * 4 - 1), X = Math.pow(10, rnd() * 5 - 2), m = rnd() * 9, tau = R0 * 1e3 * C0 * 1e-6, tt = m * tau;
  const r = RC({ X0: String(X), R: String(R0), rUnit: 'kohm', C: String(C0), cUnit: 'uF', t: String(tt), tUnit: 's' });
  ok(r.ok && r.check.ok, 'RC case ' + i);
  near(r.frac + r.dec, 1, 'remaining + decayed = 1 #' + i, 0, 1e-15); near(r.xt, X * Math.exp(-tt / tau), 'agrees with exp #' + i, m, 4e-14);
  /* round trip: the time to reach the value found */
  if (r.xt > 0) { const back = RC({ find: 'time', X0: String(X), R: String(R0), rUnit: 'kohm', C: String(C0), cUnit: 'uF', target: String(r.xt), tUnit: 's' }); ok(back.ok, 'round trip ok #' + i); if (back.ok) near(back.tS, tt, 'time round trip #' + i, m, 1e-11); }
  /* f(2t) = f(t)^2, doubling R doubles tau */
  const r2 = RC({ X0: String(X), R: String(R0), rUnit: 'kohm', C: String(C0), cUnit: 'uF', t: String(2 * tt), tUnit: 's' }); near(r2.frac, r.frac * r.frac, 'f(2t) = f(t)^2 #' + i, m * 2, 1e-13);
  const rd = RC({ X0: String(X), R: String(2 * R0), rUnit: 'kohm', C: String(C0), cUnit: 'uF', t: String(tt), tUnit: 's' }); near(rd.tauS, 2 * r.tauS, 'doubling R doubles tau #' + i, 0, 1e-14); ok(rd.frac >= r.frac, 'a larger R decays more slowly #' + i);
  const x = RL({ X0: String(X), R: String(R0), rUnit: 'ohm', L: String(C0 * 100), lUnit: 'mH', t: String(tt / 100), tUnit: 's' }); ok(x.ok && x.check.ok, 'RL case ' + i);
  const dual = GN({ X0: String(X), tau: String(r.tauS), tauUnit: 's', t: String(tt), tUnit: 's' }); near(dual.frac, r.frac, 'generic equals RC for the same tau #' + i, m, 4e-14);
}

/* 7. exports and working */
const rr = RC({ sig: 6 }), csv = E.exportCsv(rr).split('\r\n');
eq(csv[0], 'Point,Time constants (n),Time (s),Remaining %,Decayed %,Value (V)', 'csv header'); eq(csv[1], 'Start,0,0,100,0,100', 'csv start row'); ok(/^1 τ,1,1,36\.78794/.test(csv[2]), 'csv 1 tau row'); eq(csv.length, 1 + 14 + 1, 'csv rows: header, 6 ladder, 8 milestones and the closing line');
const js = JSON.parse(E.exportJson(rr)); eq(js.circuit, 'rc', 'json circuit'); near(js.timeConstantSeconds, 1, 'json tau'); eq(js.points.length, 14, 'json points'); near(js.remainingPercentage, 100 * Math.exp(-1), 'json remaining'); ok(js.results.E0 && js.results.E0.unit === 'J', 'json energy');
const tx = E.exportTxt(rr); ok(/RC capacitor discharge/.test(tx) && /Time constant τ: 1 s/.test(tx) && /THE DECAY LAW/.test(tx) && /not a safety assessment/.test(tx), 'txt content');
rr.steps.forEach((s) => ok(s.title && s.text, 'step has title and text')); ok(rr.steps.some((s) => s.title === 'Check') && rr.steps.some((s) => /radioactive/.test(s.title)), 'working has the check and the physics distinction'); ok(/V\(t\) = V₀ e\^\(−t \/ RC\)/.test(rr.steps[0].text), 'RC law shown'); ok(/I\(t\) = I₀/.test(RL().steps[0].text), 'RL law shown');
ok(/Time to the target/.test(b.steps.map((s) => s.title).join()), 'time working'); eq(E.si(0.000123, 'A', 3), '123 µA', 'si micro'); eq(E.si(999.9999, 'V', 4), '1 kV', 'si rounds up into the next prefix'); eq(E.timeText(0.5, 3), '500 ms', 'time ms'); eq(E.timeText(600, 3), '10 min', 'time min'); eq(E.timeText(86400 * 3, 3), '3 days', 'time days');

/* 8. the built page and the mode strip */
const base = path.join(__dirname, '..', 'calculators'), page = path.join(base, 'engineering-exponential-decay-calculator', 'index.html');
if (fs.existsSync(page)) {
  const html = fs.readFileSync(page, 'utf8');
  eq((html.match(/<h1[ >]/g) || []).length, 1, 'page has one h1'); ok(!/<script[^>]+src="https?:/i.test(html), 'no external scripts'); ok(!/<link[^>]+href="https?:/i.test(html), 'no external stylesheets or fonts');
  ok(html.indexOf('Elecmetric Half-Life Calculator, Mode 05') > 0 && html.indexOf('HalfLifeEng') > 0 && html.indexOf('Elecmetric Half-Life Calculator, Mode 01') > 0, 'both engines are inlined');
  ['circ', 'find', 'X0', 'x0u', 'ql', 'R', 'ru', 'Z', 'zu', 'tau', 'tauu', 'kind', 't', 'tun', 'tg', 'tgm', 'sig', 'probe', 'graph', 'rd', 'out', 'steps', 'hist', 'err', 'dl', 'gwrap'].forEach((k) => ok(new RegExp('id="ed-' + k + '"').test(html), 'element ed-' + k));
  ok(/safety assessment/.test(html) && /radiation-safety/.test(html), 'scope statements'); ok(/<title>[^<]*RC and RL Decay/.test(html), 'title'); ok(/different (physics|process)|not the same process/i.test(html), 'physical distinction stated');
  ['half-life-calculator', 'decay-constant-calculator', 'decay-percentage-calculator', 'decay-table-calculator'].forEach((d) => ok(new RegExp('href="\\.\\./' + d + '/"').test(html), 'links to ' + d));
  ok(/aria-current="page"[^>]*>Mode 05/.test(html), 'mode strip marks Mode 05 current'); ok(!/\(coming\)/.test(html), 'no mode is marked coming');
  ['rc-time-constant', 'rc-rl-transient', 'rlc-transient', 'rc-filter-cutoff', 'logarithm', 'powers-roots', 'engineering-mathematics'].forEach((d) => ok(fs.existsSync(path.join(base, d, 'index.html')) && html.indexOf('href="../' + d + '/"') > 0, 'related page ' + d + ' exists and is linked'));
  const mm = html.match(/data-ex="[^"]*"/g) || []; ok(mm.length >= 8, 'example chips present');
  mm.forEach((c) => { const d = JSON.parse(c.slice(9, -1).replace(/&quot;/g, '"').replace(/&amp;/g, '&')); ok(run({ circuit: d.circ, find: d.find, X0: d.X0, x0Unit: d.x0u, quantityUnit: d.ql, R: d.R, rUnit: d.ru, C: d.Z, cUnit: d.zu, L: d.Z, lUnit: d.zu, tau: d.tau, tauUnit: d.tauu, tauKind: d.kind, t: d.t, tUnit: d.tun, target: d.tg, targetMode: d.tgm }).ok, 'chip example is valid: ' + c.slice(0, 60)); });
  ok((html.match(/<h3>/g) || []).length >= 13, 'thirteen questions'); ['examples', 'formulas', 'ladder', 'applications', 'distinction', 'rules', 'faq', 'related'].forEach((s) => ok(new RegExp('id="' + s + '"').test(html), 'section ' + s));
  ok(/type="range"/.test(html) && /data-dl="svg"/.test(html) && /data-dl="png"/.test(html) && /data-dl="csv"/.test(html), 'probe slider and downloads');
  ['half-life-calculator', 'decay-constant-calculator', 'decay-percentage-calculator', 'decay-table-calculator'].forEach((d) => { const h = fs.readFileSync(path.join(base, d, 'index.html'), 'utf8'); ok(/href="\.\.\/engineering-exponential-decay-calculator\/"/.test(h), d + ' page links to Mode 05'); });
  ['sw.js', 'sitemap.xml'].forEach((f) => ok(fs.readFileSync(path.join(__dirname, '..', f), 'utf8').indexOf('engineering-exponential-decay-calculator') > 0, f + ' lists the page'));
} else console.log('(page not built yet: skipping page checks)');

console.log(n + ' checks, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
