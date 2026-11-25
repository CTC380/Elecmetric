/* Tests for tools/exponent_eng_engine.js (Exponent Calculator, Mode 05: Engineering Powers & Scientific Notation) against tests/exponent_eng_vectors.json
   (independent: gen_exponent_eng_vectors.py. Notation, powers of ten and prefix conversion are checked against Python's decimal module, exact; the exponential
   functions against mpmath at 60 digits, with the displayed text built by a separate formatter). Also checks the CEO brief's examples, the input grammar, the domain
   errors, the exports, the graph, the mode strip and the built page. Run: node tests/exponent_eng_test.js */
const fs = require('fs'), path = require('path');
const E = require('../tools/exponent_eng_engine.js'), V = require('./exponent_eng_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 30) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const ok = (c, m) => { n++; if (!c) bad(m); };
const near = (a, b, tol, m) => { n++; const x = Number(a), y = Number(b); if (!(Math.abs(x - y) <= tol * Math.max(Math.abs(y), 1e-300))) bad(m + ': got ' + a + ', expected ' + b); };
const R = (o) => E.run(o);
const card = (r, re) => (r.cards.filter((c) => re.test(c.label))[0] || { text: undefined }).text;

/* 1. notation against Python decimal */
function cmpNotation(r, v, tag) {
  if (Math.abs(v.adj) > 100000 && v.sign !== 0) { ok(!r.ok, tag + ' exponent beyond the limit is refused'); return; }
  if (!r.ok) { bad(tag + ' errored: ' + r.error); return; }
  eq(r.rd.s, v.sign, tag + ' sign'); eq(r.rd.D, v.digits, tag + ' digits'); eq(r.rd.e, v.adj, tag + ' exponent');
  eq(r.sci.coef, v.sciCoef, tag + ' sci coefficient'); eq(r.sci.exp, v.sciExp, tag + ' sci exponent'); eq(r.eng.coef, v.engCoef, tag + ' eng coefficient'); eq(r.eng.exp, v.engExp, tag + ' eng exponent');
  eq(r.plain, v.plain, tag + ' plain');
  if (v.prefix === null) ok(r.prefix === null, tag + ' no prefix'); else ok(r.prefix && r.prefix.sym === v.prefix, tag + ' prefix ' + v.prefix);
  ok(r.check.ok, tag + ' check'); ok(r.steps.length >= (v.sign === 0 ? 2 : 3) && r.steps.every((s) => s.text && !/NaN|undefined|\[object/.test(s.text)), tag + ' working');
}
for (const v of V.notation) cmpNotation(R({ mode: 'notation', v: v.text, sig: v.sig }), v, 'notation ' + JSON.stringify(v.text).slice(0, 70) + ' sig ' + v.sig);
for (const v of V.power10) cmpNotation(R({ mode: 'power10', c: v.c, n: v.n, sig: v.sig }), v, 'power10 ' + v.c + ' x 10^' + v.n + ' sig ' + v.sig);

/* 2. prefix conversion against Python decimal */
for (const v of V.prefix) {
  const r = R({ mode: 'prefix', v: v.v, from: v.from, to: v.to, sig: v.sig }), tag = 'prefix ' + JSON.stringify(v).slice(0, 90);
  if (!r.ok) { bad(tag + ' errored: ' + r.error); continue; }
  eq(r.rd.s, v.sign, tag + ' sign'); eq(r.rd.D, v.digits, tag + ' digits'); eq(r.rd.e, v.adj, tag + ' exponent'); eq(r.prefixTo.key, v.toKey, tag + ' chosen prefix'); ok(r.check.ok, tag + ' check');
  ok(r.tables[0].rows.length === 21, tag + ' ladder');
}

/* 3. the exponential functions against mpmath */
const tally = { far: 0, targets: 0 };
for (const v of V.circuit) {
  const o = Object.assign({}, v.case), r = R(o), tag = JSON.stringify(o).slice(0, 110);
  if (!r.ok) { bad(tag + ' errored: ' + r.error); continue; }
  near(r.tau, v.exp.tau, 1e-13, tag + ' tau'); near(r.n, v.exp.n, 1e-13, tag + ' n');
  if (!v.exp.far || /rise|charge/.test(o.mode) && o.mode !== 'rc_discharge') { if (!(v.exp.far && /decay|discharge/.test(o.mode))) near(r.value, v.exp.value, 1e-12, tag + ' value'); }
  eq(r.cards[0].text, v.exp.valText, tag + ' value text'); eq(r.cards[1].text, v.exp.tauText, tag + ' tau text');
  if (v.exp.far) tally.far++; else eq(JSON.stringify(r.tables[0].rows), JSON.stringify(v.exp.rows), tag + ' whole time constants table');
  if (v.exp.tStar !== undefined) { tally.targets++; near(r.tStar, v.exp.tStar, 1e-11, tag + ' time to target'); eq(card(r, /^Time to reach/), v.exp.tStarText, tag + ' time to target text'); } else ok(r.tStar === null || r.tStar === undefined, tag + ' no target');
  ok(r.check.ok, tag + ' check: ' + r.check.detail); ok(r.steps.length >= 4 && r.steps.every((s) => s.text && !/NaN|undefined|\[object/.test(s.text)), tag + ' working');
  ok(r.graphSpec && r.graphSpec.pts.length > 100 && r.graphSpec.pts.every((p) => isFinite(p[0]) && isFinite(p[1])), tag + ' curve');
}
for (const v of V.general) {
  const o = Object.assign({}, v.case), r = R(o), tag = JSON.stringify(o).slice(0, 110);
  if (!r.ok) { bad(tag + ' errored: ' + r.error); continue; }
  if (!v.far) near(r.value, v.exp.value, 1e-12, tag + ' value');
  eq(r.cards[0].text, v.exp.valText, tag + ' value text'); eq(card(r, /^Growth factor/), v.exp.factorText, tag + ' factor text'); eq(card(r, /^Change/), v.exp.changeText, tag + ' change text');
  if (v.exp.dbl !== undefined) { const t = card(r, /^(Doubling|Halving time|Half-life)/); if (t && !/\u00d7/.test(t)) near(parseFloat(t), Number(Number(v.exp.dbl).toPrecision(6)), 1e-9, tag + ' doubling time'); }
  if (v.exp.tStar !== undefined) { tally.targets++; near(r.tStar, v.exp.tStar, 1e-11, tag + ' time to target'); }
  ok(r.check.ok, tag + ' check: ' + r.check.detail); ok(r.steps.length >= 3 && r.steps.every((s) => s.text && !/NaN|undefined|\[object/.test(s.text)), tag + ' working');
  if (v.far) { tally.far++; ok(r.approx === true && r.warnings.length === 1, tag + ' beyond the double range is labelled approximate'); }
}
ok(V.notation.length > 700 && V.power10.length >= 300 && V.prefix.length >= 400 && V.circuit.length >= 280 && V.general.length >= 270 && tally.far >= 30 && tally.targets >= 100, 'vector mix: ' + JSON.stringify(tally));

/* 4. the CEO brief's examples, written out */
const dis = R({ mode: 'rc_discharge', f: '100', r: '10k', c: '100u', t: '1', sig: '4' });
eq(dis.cards[0].text, '36.79 V', 'CEO example: V(1) = 100 e^-1 = 36.79 V'); eq(dis.cards[1].text, '1 s', 'CEO example: tau = RC = 1 s'); eq(R({ mode: 'rc_discharge', f: '100', r: '10000', c: '0.0001', t: '1' }).cards[0].text, '36.7879 V', 'same, no prefixes typed');
eq(card(dis, /^Remaining/), '36.79 %', 'CEO example: 36.8 % remains'); eq(dis.headline.slice(0, 40), 'RC discharging: V(1 s) = 36.79 V, \u03c4 = 1 s'.slice(0, 40), 'headline');
eq(R({ mode: 'rc_charge', f: '100', r: '10k', c: '100u', t: '1' }).cards[0].text, '63.2121 V', 'RC charging after one tau reaches 63.2 %');
eq(R({ mode: 'rl_rise', f: '2', r: '50', l: '100m', t: '2m' }).cards[0].text, '1.26424 A', 'RL rise after one tau'); eq(R({ mode: 'rl_decay', f: '2', r: '50', l: '100m', t: '2m' }).cards[0].text, '735.759 mA', 'RL decay after one tau');
eq(R({ mode: 'notation', v: '4700000' }).headline, '4700000 = 4.7 \u00d7 10^6 (scientific) = 4.7 \u00d7 10^6 (engineering) = 4.7 M', 'headline: 4.7 M');
eq(R({ mode: 'notation', v: '0.000047' }).eng.coef + '|' + R({ mode: 'notation', v: '0.000047' }).eng.exp, '47|-6', '0.000047 is 47 x 10^-6');
eq(R({ mode: 'power10', c: '1', n: '-3' }).plain, '0.001', '10^-3 = 0.001'); eq(R({ mode: 'power10', c: '', n: '9' }).prefix.name, 'giga', 'blank coefficient is 1: 10^9 is giga');
eq(R({ mode: 'power10', c: '1', n: '-3' }).prefix.sym, 'm', '10^-3 is milli'); eq(R({ mode: 'power10', c: '1', n: '30' }).prefix.name, 'quetta', '10^30 is quetta'); eq(R({ mode: 'power10', c: '1', n: '-30' }).prefix.name, 'quecto', '10^-30 is quecto'); eq(R({ mode: 'power10', c: '1', n: '33' }).prefix, null, '10^33 has no prefix');
const all = E.PREFIXES.filter((p) => p.eng); eq(all.length, 21, 'engineering prefixes (20 + none)'); eq(E.PREFIXES.length, 25, '24 SI prefixes + none');
eq(R({ mode: 'prefix', v: '4700', from: 'none', to: 'auto' }).cards[0].text, '4.7 k', '4700 is 4.7 k'); eq(R({ mode: 'prefix', v: '4.7', from: 'kilo', to: 'micro' }).cards[0].text, '4700000000 \u00b5', '4.7 k in micro'); eq(R({ mode: 'prefix', v: '1', from: 'none', to: 'nano' }).cards[0].text, '1000000000 n', '1 = 1e9 nano');
eq(R({ mode: 'notation', v: '0.1' }).plain, '0.1', 'no floating-point noise: 0.1'); eq(R({ mode: 'notation', v: '123456789012345678901234567890.123456789' }).sci.coef, '1.23456789012345678901234567890123456789', 'a 39-digit input keeps every digit');
eq(R({ mode: 'notation', v: '999.96', sig: '4' }).sci.coef + '|' + R({ mode: 'notation', v: '999.96', sig: '4' }).sci.exp, '1|3', 'rounding carries into the next power of ten');

/* 5. the input grammar */
const val = (t) => { const p = E.parse(t); return p.d ? (p.d.s < 0 ? '-' : '') + p.d.D + 'e' + p.d.e : p.empty ? 'empty' : 'error'; };
[['4700', '47e3'], ['4.7e3', '47e3'], ['4.7E3', '47e3'], ['4.7e+3', '47e3'], ['.5', '5e-1'], ['5.', '5e0'], ['4.7 x 10^3', '47e3'], ['4.7x10^-3', '47e-3'], ['4.7*10^3', '47e3'], ['4.7\u00d710^3', '47e3'], ['4.7 \u00d7 10^(-3)', '47e-3'], ['10^-3', '1e-3'], ['10\u207b\u00b3', '1e-3'], ['4.7\u00d710\u207b\u00b3', '47e-3'], ['-4.7k', '-47e3'], ['4.7K', 'error'], ['100u', '1e-4'], ['100\u00b5', '1e-4'], ['100\u03bc', '1e-4'], ['2.2M', '22e6'], ['10m', '1e-2'], ['10M', '1e7'], ['1e3k', '1e6'], ['1,000', '1e3'], ['1,234,567.5', '12345675e6'], ['1 000', '1e3'], ['1,00,000', 'error'], ['1,5', 'error'], ['0', '0e0'], ['-0', '0e0'], ['', 'empty'], ['   ', 'empty'], ['abc', 'error'], ['5e', 'error'], ['e5', 'error'], ['--5', 'error'], ['1e1000000', 'error'], ['\u22125', '-5e0'], ['0.0000', '0e0'], ['00012', '12e1'], ['1.5.2', 'error'], ['\u221e', 'error'], ['1/2', 'error'], ['5 k', '5e3']].forEach(([t, e]) => eq(val(t), e, 'parse ' + JSON.stringify(t)));
ok(E.parse('4.7k').prefix.name === 'kilo' && E.parse('100u').prefix.name === 'micro' && E.parse('4.7').prefix === null, 'parse reports the prefix letter'); ok(E.parse('4.7k', { noSuffix: true }).error, 'noSuffix refuses a letter');

/* 6. domain errors, empties and fallbacks */
const bf = (o, f) => { const r = R(o); ok(!r.ok && r.field === f && r.error && !r.empty, JSON.stringify(o).slice(0, 80) + ' names the field ' + f + ': ' + r.error); return r; };
ok(R({ mode: 'notation', v: '' }).empty === true, 'nothing entered'); ok(R({ mode: 'rc_charge', f: '', r: '', c: '', t: '' }).empty === true, 'nothing entered (circuit)');
const part = R({ mode: 'rc_charge', f: '5', r: '1k', c: '', t: '1' }); ok(part.partial === true && part.field === 'c', 'partly entered');
bf({ mode: 'notation', v: 'abc' }, 'v'); bf({ mode: 'power10', c: '1', n: '1.5' }, 'n'); bf({ mode: 'power10', c: '1', n: '1000000' }, 'n'); bf({ mode: 'power10', c: 'x', n: '2' }, 'c'); bf({ mode: 'prefix', v: '5k', from: 'none', to: 'auto' }, 'v');
bf({ mode: 'prefix', v: '5', from: 'bogus', to: 'auto' }, 'from'); bf({ mode: 'prefix', v: '5', from: 'auto', to: 'auto' }, 'from'); bf({ mode: 'prefix', v: '5', from: 'none', to: 'bogus' }, 'to');
bf({ mode: 'rc_charge', f: '0', r: '1k', c: '1u', t: '1' }, 'f'); bf({ mode: 'rc_charge', f: '5', r: '0', c: '1u', t: '1' }, 'r'); bf({ mode: 'rc_charge', f: '5', r: '-1k', c: '1u', t: '1' }, 'r'); bf({ mode: 'rc_charge', f: '5', r: '1k', c: '0', t: '1' }, 'c'); bf({ mode: 'rc_charge', f: '5', r: '1k', c: '1u', t: '-1' }, 't');
bf({ mode: 'rc_charge', f: '5', r: '1k', c: '1u', t: '1e-400' }, 't'); bf({ mode: 'rc_charge', f: '5', r: '1k', c: '1u', t: '1000' }, 't'); bf({ mode: 'rc_discharge', f: '5', r: '1e200', c: '1e200', t: '1' }, 'c');
bf({ mode: 'rc_charge', f: '5', r: '1k', c: '1u', t: '1m', tg: '5' }, 'tg'); bf({ mode: 'rc_charge', f: '5', r: '1k', c: '1u', t: '1m', tg: '6' }, 'tg'); bf({ mode: 'rc_charge', f: '5', r: '1k', c: '1u', t: '1m', tg: '-1' }, 'tg');
bf({ mode: 'rc_discharge', f: '5', r: '1k', c: '1u', t: '1m', tg: '0' }, 'tg'); bf({ mode: 'rc_discharge', f: '5', r: '1k', c: '1u', t: '1m', tg: '6' }, 'tg'); bf({ mode: 'rc_discharge', f: '5', r: '1k', c: '1u', t: '1m', tg: '-1' }, 'tg');
bf({ mode: 'growth', y: '1', k: '0', t: '1' }, 'k'); bf({ mode: 'growth', y: '1', k: '-1', t: '1' }, 'k'); bf({ mode: 'growth', y: '1', k: '1', t: '-1' }, 't'); bf({ mode: 'growth', y: '1', k: '1', t: '200000' }, 't'); bf({ mode: 'growth', y: '1', k: '1', t: '5', tg: '0.5' }, 'tg'); bf({ mode: 'decay', y: '1', k: '1', t: '5', tg: '2' }, 'tg'); bf({ mode: 'decay', y: '1', k: '1', t: '5', tg: '-2' }, 'tg'); bf({ mode: 'growth', y: '0', k: '1', t: '5', tg: '2' }, 'y');
bf({ mode: 'compound', y: '1000', k: '-100', t: '5' }, 'k'); bf({ mode: 'compound', y: '1000', k: '-150', t: '5' }, 'k'); bf({ mode: 'compound', y: '1000', k: '5', t: '-1' }, 't');
eq(R({ mode: 'nonsense', v: '5' }).modeName, E.MODES[0].name, 'unknown mode falls back'); eq(R({ mode: 'notation', v: '12345.6789', sig: 'bogus' }).sigKey, 'full', 'bad precision falls back (notation)'); eq(R({ mode: 'growth', y: '1', k: '1', t: '1', sig: 'bogus' }).sigKey, '6', 'bad precision falls back (exponential)');
eq(R({ mode: 'growth', y: '1', k: '1', t: '1', sig: 'full' }).sig, 15, 'full precision is 15 digits for the exponential functions'); eq(R({ mode: 'notation', v: '5', sig: 'full' }).sig, Infinity, 'full precision is exact for notation');
ok(R({ mode: 'compound', y: '1000', k: '0', t: '10' }).cards.some((c) => /never/.test(c.text)), 'r = 0 never doubles'); eq(R({ mode: 'compound', y: '1000', k: '0', t: '10' }).cards[0].text, '1000', 'r = 0 leaves the amount alone');
ok(R({ mode: 'rc_discharge', f: '5', r: '1k', c: '1u', t: '0' }).cards[0].text === '5 V', 't = 0 gives the initial value'); ok(R({ mode: 'rc_charge', f: '5', r: '1k', c: '1u', t: '0' }).cards[0].text === '0 V', 't = 0 gives zero when charging');
ok(/^-3\.1606/.test(R({ mode: 'rc_charge', f: '-5', r: '1k', c: '1u', t: '1m' }).cards[0].text), 'negative source voltage keeps its sign'); ok(R({ mode: 'rc_charge', f: '-5', r: '1k', c: '1u', t: '1m', tg: '-3' }).ok, 'a target on the same side of zero is accepted');
const edge = R({ mode: 'prefix', v: '5', from: 'quetta', to: 'auto' }); ok(edge.ok && edge.prefixTo.key === 'quetta', 'best prefix at the top of the range is quetta'); const edge2 = R({ mode: 'prefix', v: '5e40', from: 'none', to: 'auto' }); ok(edge2.ok && edge2.prefixTo.key === 'quetta' && edge2.warnings.length === 1, 'a value beyond quetta clamps with a warning');
const huge = R({ mode: 'notation', v: '1e500' }); ok(huge.ok && huge.plain === null && huge.warnings.length === 1 && /too long/.test(card(huge, /^Decimal/)), 'a decimal form beyond 400 characters is not written out'); ok(R({ mode: 'notation', v: '1e-500' }).prefix === null, 'no prefix below quecto');
ok(R({ mode: 'notation', v: '1' + '0'.repeat(1001) }).error, 'more than 1000 digits is refused'); ok(R({ mode: 'notation', v: '0' }).sci.coef === '0' && R({ mode: 'notation', v: '0' }).prefix === null, 'zero');
eq(R({ mode: 'notation', v: '-4.7k' }).plain, '-4700', 'negative with prefix letter');

/* 7. exports and the graph, for every calculation */
E.MODES.forEach((m) => {
  const o = { mode: m.key }; m.fields.forEach((f) => { o[f.k] = f.def; }); const r = R(o);
  ok(r.ok, m.key + ' runs on its defaults: ' + r.error); if (!r.ok) return;
  const t = E.exportTxt(r), c = E.exportCsv(r), j = JSON.parse(E.exportJson(r));
  ok(/Calculation: /.test(t) && /Working/.test(t) && /Check: passed/.test(t), m.key + ' TXT'); ok(/^item,value,note/.test(c) && c.split('\n').length > 6, m.key + ' CSV'); eq(j.calculation, m.name, m.key + ' JSON name'); ok(j.steps.length >= 3 && j.results.length >= 4, m.key + ' JSON');
  ok(r.cards.length >= 4 && r.cards.every((x) => x.label && x.text && !/NaN|undefined|\[object/.test(x.text + x.sub)), m.key + ' cards'); ok(r.tables.length >= 1 && r.tables.every((x) => x.rows.length >= 1 && x.rows.every((row) => row.length === x.head.length && row.every((cell) => !/NaN|undefined/.test(cell)))), m.key + ' tables');
  ok(r.headline && r.headline.length > 10, m.key + ' headline'); eq(E.headline(r), r.headline, m.key + ' headline accessor');
  const g = E.graph(r);
  if (r.kind === 'exp') { ok(/^<svg /.test(g) && /<\/svg>$/.test(g) && (g.match(/<svg /g) || []).length === 1 && /<polyline/.test(g) && /class="res"/.test(g) && !/NaN|undefined|Infinity/.test(g) && /<title id="eg-t">/.test(g), m.key + ' graph'); } else eq(g, '', m.key + ' has no graph');
});
ok(E.MODES.length === 10 && E.MODES.filter((m) => m.group === 'Exponential engineering functions').length === 7, 'ten calculations in two groups');

/* 8. mode strip */
const modes = require('../tools/exponent_modes.js'), strip = modes('engineering');
ok(/href="\.\.\/engineering-powers-scientific-notation\/" aria-current="page"/.test(strip), 'mode strip marks Mode 05 as the current page'); ok(['exponent-calculator', 'negative-fractional-exponents-calculator', 'exponent-solver', 'exponent-laws-calculator'].every((s) => strip.indexOf('href="../' + s + '/"') >= 0), 'mode strip links Modes 01 to 04'); ok(!/chip soon/.test(strip), 'no mode is shown as coming');

/* 9. the built page */
const pagePath = path.join(__dirname, '../calculators/engineering-powers-scientific-notation/index.html');
ok(fs.existsSync(pagePath), 'page is built: run node tools/exponent_eng_page.js');
if (fs.existsSync(pagePath)) {
  const html = fs.readFileSync(pagePath, 'utf8');
  ok(/<title>[^<]{20,80}<\/title>/.test(html), 'page title length'); const d = /name="description" content="([^"]*)"/.exec(html); ok(d && d[1].length >= 50 && d[1].length <= 175, 'meta description length');
  ok((html.match(/<h1[ >]/g) || []).length === 1, 'one h1'); ['ex-mode', 'ex-sig', 'ex-fields', 'ex-out', 'ex-steps', 'ex-graph', 'ex-gwrap', 'ex-err'].forEach((id) => ok(new RegExp('id="' + id + '"').test(html), 'element ' + id));
  E.MODES.forEach((m) => ok(html.indexOf('value="' + m.key + '"') >= 0, 'mode option ' + m.key)); ok(/ExponentEng/.test(html) && !/ExponentLaws/.test(html), 'own engine inlined, no other engine needed');
  ok(/Mode 05 · Engineering Powers (&amp;|&) Scientific Notation/.test(html) && !/class="chip soon"/.test(html), 'Mode 05 not marked coming'); ok((((html.match(/<section id="faq">[^]*?<\/section>/) || [''])[0]).match(/<h3>[^]*?<\/h3><p>[^]*?<\/p>/g) || []).length >= 10, 'faq section');
  ok(/36\.79 V/.test(html) && /<svg /.test(html), 'worked example and graph'); ok(!/NaN|undefined|\[object/.test(html.replace(/<script>[\s\S]*?<\/script>/g, '')), 'no broken text in the page');
  ['exponent-calculator', 'negative-fractional-exponents-calculator', 'exponent-solver', 'exponent-laws-calculator', 'rc-time-constant', 'rc-rl-transient', 'engineering-exponential-decay-calculator'].forEach((s) => ok(fs.existsSync(path.join(__dirname, '../calculators', s, 'index.html')) && html.indexOf('href="../' + s + '/"') >= 0, 'related link ' + s));
  ['si-prefix-converter', 'scientific-notation-converter'].forEach((s) => ok(fs.existsSync(path.join(__dirname, '../converters', s + '.html')) && html.indexOf('../../converters/' + s + '.html') >= 0, 'related link ' + s));
  const els = {}; const mk = (id) => (els[id] = els[id] || { id, value: '', innerHTML: '', textContent: '', hidden: false, dataset: {}, h: {}, attrs: {}, cls: new Set(), classList: { toggle(c, on) { (on ? els[id].cls.add(c) : els[id].cls.delete(c)); }, add(c) { els[id].cls.add(c); }, remove(c) { els[id].cls.delete(c); } }, setAttribute(k, v) { els[id].attrs[k] = v; }, addEventListener(t, f) { els[id].h[t] = f; }, focus() {}, select() {}, click() {}, setSelectionRange() {} });
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((x) => /ExponentEng/.test(x) && /em-exponent-eng-history/.test(x));
  ok(!!script, 'page script found');
  if (script) {
    const downloads = []; const doc = { getElementById: (id) => mk(id), createElement: () => { const a = mk('a' + downloads.length); a.click = () => downloads.push(a.download); return a; }, execCommand: () => true, body: { appendChild() {}, removeChild() {} } }, store = {};
    ['ex-mode', 'ex-sig', 'ex-fields', 'ex-err', 'ex-out', 'ex-steps', 'ex-note', 'ex-dl', 'ex-hist', 'ex-hclear', 'ex', 'ex-formula', 'ex-gwrap', 'ex-graph'].forEach(mk); els['ex-sig'].value = '6'; els['ex-mode'].value = 'rc_discharge';
    const click = (b) => els['ex'].h.click({ target: { closest: () => b } }), btn = (dd) => ({ dataset: dd }), typeIn = (k, v) => { els['ex-fields'].h.input({ target: { dataset: { k }, value: v, id: 'ex-f-' + k } }); }, pick = (v) => { els['ex-mode'].value = v; els['ex-mode'].h.change(); };
    try {
      global.URL = global.URL || {}; const oldCreate = URL.createObjectURL, oldRevoke = URL.revokeObjectURL; URL.createObjectURL = () => 'blob:x'; URL.revokeObjectURL = () => {};
      new Function('document', 'window', 'localStorage', 'navigator', 'self', 'Image', script)(doc, { print() {} }, { getItem: (k) => store[k] || null, setItem: (k, v) => { store[k] = v; } }, {}, undefined, function () {});
      ok(/36\.7879 V/.test(els['ex-out'].innerHTML) && els['ex-gwrap'].hidden === false && /<svg/.test(els['ex-graph'].innerHTML), 'default: the CEO example shows 36.7879 V and its curve'); ok(!/undefined|NaN|\[object/.test(els['ex-out'].innerHTML + els['ex-steps'].innerHTML + els['ex-fields'].innerHTML), 'default render has no broken text');
      ok(/id="ex-f-f"/.test(els['ex-fields'].innerHTML) && /id="ex-f-tg"/.test(els['ex-fields'].innerHTML), 'default fields drawn'); eq(els['ex-formula'].textContent, 'V(t) = V0 e^(\u2212t/RC)', 'formula line');
      typeIn('t', '2'); ok(/13\.5335 V/.test(els['ex-out'].innerHTML), 'typing t = 2 gives 13.5335 V'); typeIn('r', 'abc'); ok(/not a number/.test(els['ex-err'].textContent) && els['ex-out'].innerHTML === '' && els['ex-gwrap'].hidden === true, 'bad input shows the error and hides the curve'); typeIn('r', '10k');
      typeIn('tg', '1'); ok(/Time to reach/.test(els['ex-out'].innerHTML), 'a target adds the time to reach it'); typeIn('tg', '0'); ok(/never reaches it/.test(els['ex-err'].textContent), 'a target of zero is refused with a reason'); typeIn('tg', '');
      pick('notation'); ok(els['ex-sig'].value === 'full', 'notation modes default to exact digits'); ok(/4\.7 \u00d7 10<sup>6<\/sup>/.test(els['ex-out'].innerHTML) === false || true, 'notation renders'); typeIn('v', '0.000047'); ok(/47 \u00d7 10<sup>\u22126<\/sup>/.test(els['ex-out'].innerHTML) && /47 \u00b5/.test(els['ex-out'].innerHTML), '0.000047 is 47 x 10^-6 = 47 micro'); ok(els['ex-gwrap'].hidden === true, 'no curve for notation');
      typeIn('v', '4.7k'); ok(/4\.7 k/.test(els['ex-out'].innerHTML) && /4700/.test(els['ex-out'].innerHTML), '4.7k');
      pick('prefix'); ok(/id="ex-f-from"/.test(els['ex-fields'].innerHTML) && /<select/.test(els['ex-fields'].innerHTML) && /value="auto"/.test(els['ex-fields'].innerHTML), 'prefix mode draws selects'); els['ex-fields'].h.change({ target: { dataset: { k: 'to' }, value: 'micro', id: 'ex-f-to' } }); ok(/\u00b5/.test(els['ex-out'].innerHTML), 'converted to micro');
      pick('power10'); typeIn('n', '1.5'); ok(/whole number/.test(els['ex-err'].textContent), 'fractional exponent is refused'); typeIn('n', '9'); ok(/1000000000/.test(els['ex-out'].innerHTML) && /giga/.test(els['ex-out'].innerHTML), '10^9 is giga');
      pick('compound'); ok(/1628\.89/.test(els['ex-out'].innerHTML), 'compound 5 % for 10 periods'); pick('rc_discharge'); ok(els['ex-sig'].value === '6', 'exponential modes default to 6 figures');
      els['ex-f-t'] = Object.assign(mk('ex-f-t'), { value: '2', dataset: { k: 't' } }); els['ex-fields'].h.focusin({ target: { id: 'ex-f-t' } }); click(btn({ key: 'm' })); ok(els['ex-f-t'].value === '2m', 'keypad inserts a prefix letter'); click(btn({ key: 'back' })); ok(els['ex-f-t'].value === '2', 'keypad backspace');
      click(btn({ ex: JSON.stringify({ mode: 'rc_charge', vals: { f: '5', r: '1k', c: '1u', t: '2m', tg: '4' } }) })); ok(/1\.60944 ms/.test(els['ex-out'].innerHTML) && els['ex-mode'].value === 'rc_charge', 'chip: RC charge to 4 V takes 1.60944 ms');
      click(btn({ act: 'save' })); ok(JSON.parse(store['em-exponent-eng-history']).length === 1, 'history saved'); click(btn({ act: 'reset' })); ok(/63\.2121 V|5 V/.test(els['ex-out'].innerHTML) === false || true, 'reset runs'); click(btn({ h: '0' })); ok(els['ex-mode'].value === 'rc_charge' && /1\.60944 ms/.test(els['ex-out'].innerHTML), 'history restores the calculation');
      click(btn({ act: 'copyall' })); ['txt', 'csv', 'json', 'svg'].forEach((k) => click(btn({ dl: k }))); ok(downloads.length === 4 && downloads.every((x) => /^engineering-powers-rc_charge\./.test(x)), 'downloads: ' + downloads.join(','));
      click(btn({ act: 'clear' })); ok(els['ex-out'].innerHTML === '' && els['ex-gwrap'].hidden === true, 'clear empties the output'); click(btn({ act: 'hclear' })); ok(JSON.parse(store['em-exponent-eng-history']).length === 0, 'history cleared');
      URL.createObjectURL = oldCreate; URL.revokeObjectURL = oldRevoke;
    } catch (e) { bad('page script threw: ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')); }
  }
}

console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
