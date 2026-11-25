/* Tests for tools/exponent_laws_engine.js (Exponent Calculator, Mode 04: Exponent Laws) against tests/exponent_laws_vectors.json
   (independent: gen_exponent_laws_vectors.py; every value is an mpmath number at 90 digits and every power goes through one real-power rule, so the sides of each
   rule are found by evaluation and a failing rule is detected, not looked up). Also checks the CEO brief's examples, the domain traps, inputs, exports and the
   built page. Run: node tests/exponent_laws_test.js */
const fs = require('fs'), path = require('path');
const L = require('../tools/exponent_laws_engine.js'), V = require('./exponent_laws_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 25) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const ok = (c, m) => { n++; if (!c) bad(m); };
const R = (o) => L.run(Object.assign({ sig: '6' }, o));
const sgn = (v) => (v.sign < 0 ? -1 : v.sign === 0 ? 0 : 1);

/* 1. independent vectors */
const tally = {};
for (const v of V) {
  const r = R(v), tag = JSON.stringify(v).slice(0, 110); tally[v.status] = (tally[v.status] || 0) + 1;
  if (!r.ok) { bad(tag + ' errored: ' + r.error); continue; }
  eq(r.status, v.status, tag + ' status');
  [['left', v.left], ['right', v.right]].forEach(([k, e]) => {
    const s = r[k];
    if (e === null) { ok(!s.ok && s.error, tag + ' ' + k + ' side should have no real value'); return; }
    if (!s.ok) { bad(tag + ' ' + k + ' side errored: ' + s.error); return; }
    eq(sgn(s.v), e.sign, tag + ' ' + k + ' sign');
    if (e.log10 !== null) ok(Math.abs(s.v.log10 - Number(e.log10)) <= 1e-11 * Math.max(1, Math.abs(Number(e.log10))), tag + ' ' + k + ' log10 got ' + s.v.log10 + ', expected ' + e.log10);
  });
  ok(r.steps.length >= 5 && r.steps.every((s) => s.text && !/undefined\b.*NaN|NaN|\[object/.test(s.text)), tag + ' working');
  if (v.status === 'holds') ok(r.check && r.check.ok, tag + ' check'); else ok(r.check === null && r.message.length > 20, tag + ' explains why not');
}
ok(V.length > 900 && tally.holds > 700 && tally.mismatch >= 20 && tally.undefined >= 100, 'vector mix: ' + JSON.stringify(tally));

/* 2. the CEO brief's examples, written out */
const hl = (o) => L.headline(R(o));
eq(hl({ rule: 'product', a: '2', m: '3', n: '4' }), '2^3 \u00d7 2^4 = 2^7 = 128', '2^3 x 2^4 = 2^7 = 128');
eq(hl({ rule: 'quotient', a: '5', m: '6', n: '2' }), '5^6 \u00f7 5^2 = 5^4 = 625', '5^6 / 5^2 = 5^4 = 625');
eq(hl({ rule: 'power', a: '3', m: '2', n: '3' }), '(3^2)^3 = 3^6 = 729', '(3^2)^3 = 3^6 = 729');
eq(R({ rule: 'product', a: '2', m: '3', n: '4' }).simplified, '2^7', 'product simplified form'); eq(R({ rule: 'quotient', a: '5', m: '6', n: '2' }).simplified, '5^4', 'quotient simplified form'); eq(R({ rule: 'power', a: '3', m: '2', n: '3' }).simplified, '3^6', 'power simplified form');
eq(R({ rule: 'negative', a: '2', n: '3' }).left.text, '1/8 = 0.125', '2^-3 = 1/8'); eq(R({ rule: 'zero', a: '7' }).left.text, '1', '7^0 = 1'); eq(R({ rule: 'fraction', a: '27', n: '3' }).left.text, '3', '27^(1/3) = 3');
eq(R({ rule: 'prodbase', a: '2', b: '3', n: '2' }).left.text, '36', '(2x3)^2 = 36'); eq(R({ rule: 'quotbase', a: '2', b: '3', n: '2' }).left.text, '4/9 \u2248 0.444444', '(2/3)^2 = 4/9');
eq(R({ rule: 'product', a: '2', m: '10', n: '20' }).left.text, '1,073,741,824', 'grouping'); eq(R({ rule: 'product', a: '2', m: '1/2', n: '1/2' }).status, 'holds', 'irrational parts multiply to the exact sum');
eq(R({ rule: 'fraction', a: '2', n: '2' }).left.text, '\u221a2  \u2248 1.41421', 'radical form is shown');

/* 3. the domain traps are reported, not hidden */
eq(R({ rule: 'power', a: '-1', m: '2', n: '1/2' }).status, 'mismatch', '((-1)^2)^(1/2) = 1 but (-1)^1 = -1'); eq(R({ rule: 'power', a: '-1', m: '2', n: '1/2' }).left.text + '|' + R({ rule: 'power', a: '-1', m: '2', n: '1/2' }).right.text, '1|\u22121', 'the two sides of the classic trap');
eq(R({ rule: 'power', a: '-8', m: '1/3', n: '2' }).status, 'holds', '((-8)^(1/3))^2 = (-8)^(2/3)'); eq(R({ rule: 'product', a: '-4', m: '1/2', n: '1/2' }).status, 'undefined', 'a side with no real value');
eq(R({ rule: 'prodbase', a: '-2', b: '-3', n: '1/2' }).status, 'undefined', '(ab)^(1/2) with two negatives: one side is real, the other is not'); eq(R({ rule: 'zero', a: '0' }).status, 'undefined', '0^0'); eq(R({ rule: 'negative', a: '0', n: '2' }).status, 'undefined', '0^-2'); eq(R({ rule: 'quotient', a: '0', m: '2', n: '2' }).status, 'undefined', '0^2 / 0^2');
eq(R({ rule: 'fraction', a: '-8', n: '2' }).status, 'undefined', 'even root of a negative'); eq(R({ rule: 'fraction', a: '-8', n: '3' }).left.text, '\u22122', 'odd root of a negative'); eq(R({ rule: 'quotient', a: '0', m: '5', n: '2' }).status, 'undefined', '0^5 / 0^2 is 0 / 0');
ok(/negative base/.test(R({ rule: 'power', a: '-1', m: '2', n: '1/2' }).message), 'the trap is explained'); ok(/Both sides are undefined/.test(R({ rule: 'zero', a: '0' }).message) === false && /right side/.test(R({ rule: 'zero', a: '0' }).message) || /left side/.test(R({ rule: 'zero', a: '0' }).message), 'undefined side is named');

/* 4. inputs */
ok(R({ rule: 'product', a: '', m: '', n: '' }).empty === true, 'nothing entered'); const part = R({ rule: 'product', a: '2', m: '3', n: '' }); ok(part.partial === true && part.field === 'n', 'partly entered');
eq(R({ rule: 'product', a: 'x', m: '3', n: '4' }).field, 'a', 'bad base'); eq(R({ rule: 'quotbase', a: '2', b: '0', n: '2' }).field, 'b', 'b = 0'); eq(R({ rule: 'fraction', a: '8', n: '1/2' }).field, 'n', 'root index must be whole'); eq(R({ rule: 'fraction', a: '8', n: '0' }).field, 'n', 'root index zero'); eq(R({ rule: 'fraction', a: '8', n: '-3' }).field, 'n', 'root index negative');
eq(R({ rule: 'nonsense', a: '2', m: '3', n: '4' }).rule, 'product', 'unknown rule falls back'); eq(R({ rule: 'zero', a: '5', m: 'junk', n: 'junk' }).ok, true, 'unused fields are ignored'); eq(R({ rule: 'product', a: '0.5', m: '1,000', n: '-1e3' }).ok, true, 'decimals, separators and powers of ten');
eq(R({ rule: 'product', a: '2', m: '3', n: '4', sig: 'bogus' }).sig, '6', 'bad precision falls back'); eq(R({ rule: 'product', a: '2', m: '1.5', n: '2.5' }).simplified, '2^4', 'decimal exponents are exact fractions'); eq(R({ rule: 'product', a: '1/2', m: '-3', n: '2' }).simplified, '(1/2)^(\u22121)', 'fraction base and negative exponent');
ok(L.RULES.length === 8 && L.RULES.every((r) => r.fields.length >= 1 && r.formula && r.cond), 'eight rules, each with fields, formula and condition');
/* a huge power is refused with a reason, not a crash */
const big = R({ rule: 'product', a: '10', m: '999999999', n: '999999999' }); ok(big.ok && big.status !== undefined, 'huge exponents do not crash'); ok(R({ rule: 'power', a: '2', m: '100', n: '100' }).status === 'holds', '2^100 to the 100 is handled');

/* 5. exports */
L.RULES.forEach((rule) => {
  const o = { rule: rule.key, a: '3', b: '2', m: '2', n: '3' }; const r = R(o);
  ok(r.ok, rule.key + ' runs'); const t = L.exportTxt(r), c = L.exportCsv(r), j = JSON.parse(L.exportJson(r));
  ok(/Rule: /.test(t) && /Working/.test(t), rule.key + ' TXT'); ok(/^rule,formula/.test(c) && c.split('\n').length === 2, rule.key + ' CSV'); eq(j.status, r.status, rule.key + ' JSON status'); ok(j.steps.length >= 5, rule.key + ' JSON steps');
});

/* 6. mode strip and built page */
const modes = require('../tools/exponent_modes.js'), strip = modes('laws');
ok(/href="\.\.\/exponent-laws-calculator\/" aria-current="page"/.test(strip), 'mode strip marks Mode 04 as the current page'); ok(/href="\.\.\/exponent-solver\/"/.test(strip) && /href="\.\.\/exponent-calculator\/"/.test(strip), 'mode strip links Modes 01 to 03'); ok(/href="\.\.\/engineering-powers-scientific-notation\/"/.test(strip) && !/chip soon/.test(strip), 'Mode 05 is linked');
const pagePath = path.join(__dirname, '../calculators/exponent-laws-calculator/index.html');
if (fs.existsSync(pagePath)) {
  const html = fs.readFileSync(pagePath, 'utf8');
  ok(/<title>[^<]{20,60}<\/title>/.test(html), 'page title length'); const d = /name="description" content="([^"]*)"/.exec(html); ok(d && d[1].length >= 50 && d[1].length <= 160, 'meta description length');
  ok((html.match(/<h1[ >]/g) || []).length === 1, 'one h1'); ['a', 'b', 'm', 'n'].forEach((k) => ok(new RegExp('id="ex-' + k + '"').test(html), 'field ' + k)); ok(/id="ex-rule"/.test(html), 'rule selector'); L.RULES.forEach((r) => ok(html.indexOf('value="' + r.key + '"') > 0, 'rule option ' + r.key));
  ok(/ExponentLaws/.test(html) && /ExponentSolver/.test(html) && /ExponentFrac/.test(html) && /ExponentCalc/.test(html), 'engines inlined');
  ok(/Mode 04 · Exponent Laws/.test(html) && !/class="chip soon"[^>]*>Mode 04/.test(html), 'Mode 04 not marked coming'); ok((((html.match(/<section id="faq">[^]*?<\/section>/) || [''])[0]).match(/<h3>[^]*?<\/h3><p>[^]*?<\/p>/g) || []).length >= 10, 'faq section has at least 10 question and answer pairs');
  const els = {}; const mk = (id) => (els[id] = els[id] || { id, value: '', innerHTML: '', textContent: '', hidden: false, readOnly: false, placeholder: '', dataset: {}, children: [], h: {}, attrs: {}, cls: new Set(), classList: { toggle(c, on) { (on ? els[id].cls.add(c) : els[id].cls.delete(c)); }, add(c) { els[id].cls.add(c); }, remove(c) { els[id].cls.delete(c); } }, setAttribute(k, v) { els[id].attrs[k] = v; }, addEventListener(t, f) { els[id].h[t] = f; }, focus() {}, select() {}, click() {}, setSelectionRange() {} });
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((t) => /ExponentLaws/.test(t) && /em-exponent-laws-history/.test(t));
  ok(!!script, 'page script found');
  if (script) {
    const doc = { getElementById: (id) => mk(id), createElement: () => mk('x'), execCommand: () => true, body: { appendChild() {}, removeChild() {} } }, store = {};
    ['ex-a', 'ex-b', 'ex-m', 'ex-n', 'ex-rule', 'ex-sig', 'ex-err', 'ex-out', 'ex-steps', 'ex-note', 'ex-dl', 'ex-hist', 'ex-hclear', 'ex', 'ex-formula', 'ex-ga', 'ex-gb', 'ex-gm', 'ex-gn', 'ex-la', 'ex-lb', 'ex-lm', 'ex-ln'].forEach(mk); els['ex-sig'].value = '6';
    const click = (b) => els['ex'].h.click({ target: { closest: () => b } }), btn = (d) => ({ dataset: d }), typeIn = (id, v) => { els[id].value = v; els[id].h.input(); }, pick = (v) => { els['ex-rule'].value = v; (els['ex-rule'].h.change || els['ex-rule'].h.input)(); };
    try {
      new Function('document', 'window', 'localStorage', 'navigator', 'self', script)(doc, { print() {} }, { getItem: (k) => store[k] || null, setItem: (k, v) => { store[k] = v; } }, {}, undefined);
      ok(/rule holds|Rule holds/i.test(els['ex-out'].innerHTML) && /128/.test(els['ex-out'].innerHTML), 'default: 2^3 x 2^4 = 128 is shown'); ok(!/undefined|NaN|\[object/.test(els['ex-out'].innerHTML + els['ex-steps'].innerHTML), 'default render has no broken text'); ok(els['ex-dl'].hidden === false, 'default: downloads shown'); ok(els['ex-gb'].hidden === true && els['ex-gm'].hidden === false, 'default: b is hidden, m is shown');
      pick('prodbase'); ok(els['ex-gb'].hidden === false && els['ex-gm'].hidden === true, 'power of a product shows b and hides m'); typeIn('ex-a', '2'); typeIn('ex-b', '3'); typeIn('ex-n', '2'); ok(/36/.test(els['ex-out'].innerHTML), '(2x3)^2 = 36');
      pick('zero'); ok(els['ex-gn'].hidden === true && els['ex-gb'].hidden === true, 'zero exponent shows only a'); typeIn('ex-a', '0'); ok(/Undefined|undefined/.test(els['ex-out'].innerHTML), '0^0 is undefined'); typeIn('ex-a', 'abc'); ok(/not a number/.test(els['ex-err'].textContent) && els['ex-a'].cls.has('bad'), 'a bad entry marks the field');
      click(btn({ ex: JSON.stringify({ rule: 'power', a: '-1', m: '2', n: '1/2', sig: '6' }) })); ok(/does not hold/i.test(els['ex-out'].innerHTML), 'chip: the negative-base trap is shown'); click(btn({ act: 'save' })); ok(JSON.parse(store['em-exponent-laws-history'] || '[]').length === 1, 'history saved');
      click(btn({ act: 'copyall' })); click(btn({ dl: 'csv' })); click(btn({ act: 'reset' })); ok(/128/.test(els['ex-out'].innerHTML), 'reset returns to the default');
    } catch (e) { bad('page script threw: ' + e.message + ' ' + (e.stack || '').split('\n')[1]); }
  }
}
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
