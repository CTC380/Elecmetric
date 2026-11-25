/* Tests for tools/exponent_solver_engine.js (Exponent Calculator, Mode 03: Missing Value Solver, a^n = y) against tests/exponent_solver_vectors.json
   (independent: gen_exponent_solver_vectors.py; sympy prime factorisation decides whether an exponent is an exact fraction, mpmath at 90 digits gives
   ln y / ln a and the roots, and the real solutions of a^n = y are found by trying both signs through the real power of a base, with no parity rule).
   Also checks the CEO brief's cases, the domain classes, input handling, exports and the built page. Run: node tests/exponent_solver_test.js */
const fs = require('fs'), path = require('path');
const S = require('../tools/exponent_solver_engine.js'), F = require('../tools/exponent_frac_engine.js'), X = require('../tools/exponent_engine.js'), V = require('./exponent_solver_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 25) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const ok = (c, m) => { n++; if (!c) bad(m); };
const R = (o) => S.run(Object.assign({ sig: 'full' }, o));
const num = (t) => { const s = String(t).replace(/\u2212/g, '-').replace(/^\u2248\s*/, '').replace(/\s*\u00d7\s*10/, 'e').replace(/[\u2070\u00b9\u00b2\u00b3\u2074-\u2079\u207b]/g, (c) => ({ '\u2070': '0', '\u00b9': '1', '\u00b2': '2', '\u00b3': '3', '\u2074': '4', '\u2075': '5', '\u2076': '6', '\u2077': '7', '\u2078': '8', '\u2079': '9', '\u207b': '-' })[c]); return Number(s); };

/* 1. independent vectors */
const tally = {};
for (const v of V) {
  const o = v.out, tag = v.solve + ': ' + JSON.stringify({ a: v.a, n: v.n, y: v.y }), r = R(v); tally[v.solve + '/' + o.cls] = (tally[v.solve + '/' + o.cls] || 0) + 1;
  if (!r.ok) { bad(tag + ' errored: ' + r.error); continue; }
  eq(r.cls, o.cls, tag + ' class');
  if (o.cls === 'none' || o.cls === 'indeterminate') { ok(r.solutions.length === 0 && r.message.length > 10, tag + ' no solutions listed, with a reason'); continue; }
  if (v.solve === 'n') {
    const s = r.solutions[0]; eq(r.solutions.length, 1, tag + ' one solution');
    if (o.exact) { ok(s.exact, tag + ' exact'); eq(s.text.replace(/\u2212/g, '-'), o.n, tag + ' exponent'); ok(r.check.ok, tag + ' exact check'); }
    else { ok(!s.exact, tag + ' approximate'); ok(/^\u2248/.test(s.text), tag + ' marked approximate'); }
    const want = Number(o.nlog), have = num(s.decimal);
    ok(Math.abs(have - want) <= 1e-13 * Math.max(1, Math.abs(want)), tag + ': n got ' + have + ', expected ' + want);
    ok(r.check.ok, tag + ' check');
  } else if (v.solve === 'a') {
    eq(r.solutions.length, o.alog.length, tag + ' number of solutions');
    o.alog.forEach((e, k) => {
      const s = r.solutions[k]; if (!s) return;
      eq(s.sign < 0 ? -1 : s.sign === 0 ? 0 : 1, e.sign, tag + ' sign of solution ' + (k + 1));
      if (e.log10 !== null) ok(Math.abs(s.log10 - Number(e.log10)) <= 1e-12 * Math.max(1, Math.abs(Number(e.log10))), tag + ': log10|a| got ' + s.log10 + ', expected ' + e.log10);
      else eq(s.text, '0', tag + ' zero base');
    });
    ok(r.check.ok, tag + ' check');
  } else {
    const s = r.solutions[0]; eq(s.sign < 0 ? -1 : s.sign === 0 ? 0 : 1, o.sign, tag + ' sign');
    if (o.log10 !== null) ok(Math.abs(s.log10 - Number(o.log10)) <= 1e-12 * Math.max(1, Math.abs(Number(o.log10))), tag + ': log10|y| got ' + s.log10 + ', expected ' + o.log10);
    else eq(s.text, '0', tag + ' zero result');
  }
}
ok(Object.keys(tally).length >= 9 && V.length > 900, 'vector mix: ' + JSON.stringify(tally));

/* 2. the CEO brief's examples, written out */
const hl = (o) => S.headline(R(o));
eq(hl({ solve: 'y', a: '2', n: '10' }), '2^10 = 1,024', 'Example A: 2^10 = 1024');
eq(hl({ solve: 'n', a: '2', y: '32' }), '2^n = 32   \u2192   n = 5', 'Example B: 2^x = 32 gives x = 5');
eq(hl({ solve: 'a', n: '3', y: '125' }), 'a^3 = 125   \u2192   a = 5', 'Example C: x^3 = 125 gives x = 5');
eq(R({ solve: 'n', a: '2', y: '32' }).cls, 'unique', '2^x = 32 is unique'); eq(R({ solve: 'a', n: '3', y: '125' }).cls, 'unique', 'x^3 = 125 is unique');
eq(R({ solve: 'a', n: '2', y: '9' }).cls, 'multiple', 'x^2 = 9 has two real solutions'); eq(S.solText(R({ solve: 'a', n: '2', y: '9' })), 'a = 3  or  a = \u22123', 'x^2 = 9: 3 and -3');
eq(R({ solve: 'a', n: '2', y: '-4' }).cls, 'none', 'x^2 = -4 has no real solution'); eq(R({ solve: 'n', a: '2', y: '-8' }).cls, 'none', '2^x = -8 has no real solution');
eq(R({ solve: 'y', a: '0', n: '0' }).cls, 'indeterminate', '0^0 is indeterminate'); eq(R({ solve: 'y', a: '0', n: '-2' }).cls, 'none', '0^-2 is undefined'); eq(R({ solve: 'y', a: '-8', n: '1/2' }).cls, 'none', '(-8)^(1/2) is not real');
eq(S.solText(R({ solve: 'y', a: '-8', n: '1/3' })), 'y = \u22122', '(-8)^(1/3) = -2');
eq(S.solText(R({ solve: 'n', a: '4', y: '8' })), 'n = 3/2', '4^n = 8 gives 3/2'); eq(S.solText(R({ solve: 'n', a: '8', y: '4' })), 'n = 2/3', '8^n = 4 gives 2/3'); eq(S.solText(R({ solve: 'n', a: '10', y: '0.001' })), 'n = \u22123', '10^n = 0.001');
eq(S.solText(R({ solve: 'n', a: '-8', y: '-2' })), 'n = 1/3', '(-8)^n = -2 gives 1/3'); eq(R({ solve: 'n', a: '-8', y: '2' }).cls, 'none', '(-8)^n = 2 has no real exponent');
eq(S.solText(R({ solve: 'a', n: '1/2', y: '3' })), 'a = 9', 'a^(1/2) = 3'); eq(S.solText(R({ solve: 'a', n: '2', y: '12' })), 'a = 2\u221a3  or  a = \u22122\u221a3', 'a^2 = 12 in radical form');
eq(S.solText(R({ solve: 'a', n: '0.5', y: '3' })), 'a = 9', 'exponent typed as 0.5'); eq(S.solText(R({ solve: 'a', n: '-2', y: '1/4' })), 'a = 2  or  a = \u22122', 'a^-2 = 1/4');
eq(R({ solve: 'n', a: '2', y: '10' }).solutions[0].exact, false, '2^n = 10 is irrational'); eq(R({ solve: 'n', a: '2', y: '10', sig: '6' }).solutions[0].text, '\u2248 3.32193', 'n = log2(10) to 6 digits');
eq(R({ solve: 'n', a: 'e', y: '10', sig: '6' }).solutions[0].text, '\u2248 2.30259', 'e^n = 10'); eq(R({ solve: 'n', a: 'e', y: '1' }).solutions[0].text, '0', 'e^n = 1');
['1,1', '1,7', '0,0', '-1,1', '-1,-1'].forEach((t) => { const [a, y] = t.split(','); const c = R({ solve: 'n', a, y }).cls; ok(c === 'indeterminate' || c === 'none', 'special base ' + a); });

/* 3. every answer agrees with the other modes: solving for y is Mode 02; solving for n and a, then putting the value back, returns the input */
[['2', '10'], ['27', '2/3'], ['8', '-2/3'], ['-8', '1/3'], ['5', '0.75'], ['3', '-4'], ['1/2', '3'], ['12', '1/2']].forEach(([a, e]) => {
  const y = R({ solve: 'y', a, n: e }), f = F.run({ a, n: e, sig: 'full' }), s = y.solutions[0];
  eq(s.exact, f.exact, a + '^' + e + ' exactness matches Mode 02'); eq(s.sign, f.rawSign, a + '^' + e + ' sign matches Mode 02');
  ok(Math.abs(s.log10 - Math.log10(Math.abs(f.mode1.value))) <= 1e-12, a + '^' + e + ' size matches Mode 02'); eq(y.valueLine, F.headline(f), a + '^' + e + ' headline matches Mode 02');
});
[['2', '3'], ['3', '-2'], ['1/2', '4'], ['5', '1/2'], ['10', '-3']].forEach(([a, e]) => {
  const fy = F.run({ a, n: e, sig: 'full' }); if (!fy.exact) return;
  const yTxt = fy.exactD === '1' ? (fy.rawSign < 0 ? '-' : '') + fy.exactN : (fy.rawSign < 0 ? '-' : '') + fy.exactN + '/' + fy.exactD;
  eq(S.solText(R({ solve: 'n', a, y: yTxt })).replace('n = ', ''), e.replace('-', '\u2212'), 'round trip n for ' + a + '^' + e);
  const back = R({ solve: 'a', n: e, y: yTxt }); ok(back.solutions.some((s) => s.text.replace(/^\u2212/, '') === a), 'round trip base for ' + a + '^' + e + ' gives ' + back.solutions.map((s) => s.text).join(','));
});

/* 4. input handling */
ok(R({ solve: 'n', a: '', y: '' }).empty === true, 'nothing entered'); ok(R({ solve: 'n', a: '2', y: '' }).partial === true && R({ solve: 'n', a: '2', y: '' }).field === 'y', 'partly entered');
eq(R({ solve: 'n', a: 'x', y: '3' }).field, 'a', 'bad base field'); eq(R({ solve: 'a', n: '2', y: '1/0' }).field, 'y', 'zero denominator');
ok(R({ solve: 'y', a: '2', n: '', y: 'ignored text' }).partial === true, 'the unknown field is ignored'); ok(R({ solve: 'n', a: '2', y: '32', n: 'garbage' }).ok, 'the unknown field is ignored (n)');
eq(R({ solve: 'zzz', a: '2', n: '3' }).solve, 'y', 'unknown mode falls back to y'); eq(R({ solve: 'n', a: '2', y: '32', sig: 'bogus' }).sig, '6', 'bad precision falls back');
eq(R({ solve: 'n', a: '2', y: '32' }).equation, '2^n = 32', 'equation text'); eq(R({ solve: 'a', n: '-3', y: '8' }).equation, 'a^(\u22123) = 8', 'equation text with a negative exponent');
eq(R({ solve: 'n', a: '-2', y: '-8' }).equation, '(\u22122)^n = \u22128', 'equation text with a negative base');
eq(R({ solve: 'a', n: '1e3', y: '2' }).ok, true, 'power of ten typed as exponent'); eq(R({ solve: 'n', a: '2', y: '1e-3' }).ok, true, 'power of ten typed as result'); eq(R({ solve: 'n', a: '2', y: '1,024' }).solutions[0].text, '10', 'thousands separator');
/* very large and very small values */
eq(R({ solve: 'n', a: '2', y: '1267650600228229401496703205376' }).solutions[0].text, '100', '2^n = 2^100 exactly'); eq(S.solText(R({ solve: 'n', a: '10', y: '1e-30' })), 'n = \u221230', '10^n = 1e-30');
ok(R({ solve: 'n', a: '2', y: '3' }).check.ok, 'check on an irrational exponent'); ok(R({ solve: 'n', a: '1.0000001', y: '1.000001' }).ok, 'a base close to 1');
eq(S.solText(R({ solve: 'n', a: '1.0001', y: '1.00020001' })), 'n = 2', 'a base close to 1, exact exponent');

/* 5. working, exports and the results table */
['n', 'a', 'y'].forEach((m) => {
  const o = m === 'n' ? { solve: 'n', a: '2', y: '32' } : m === 'a' ? { solve: 'a', n: '2', y: '12' } : { solve: 'y', a: '12', n: '1/2' }, r = R(o);
  ok(r.steps.length >= 3 && r.steps[0].title === 'The problem', m + ': working starts with the problem'); ok(r.steps.every((s) => s.text && !/undefined|NaN|\[object/.test(s.text)), m + ': no broken text in the working');
  const t = S.exportTxt(r), c = S.exportCsv(r), j = JSON.parse(S.exportJson(r));
  ok(/Classification/.test(t) && /Working/.test(t) && /Check: passed/.test(t), m + ': TXT export'); ok(c.split('\n').length >= 2 && /^equation,solving_for/.test(c), m + ': CSV export'); eq(j.classification, r.cls, m + ': JSON class'); ok(Array.isArray(j.solutions) && j.solutions.length === r.solutions.length, m + ': JSON solutions');
});
ok(/no real solution|None|none/i.test(S.exportCsv(R({ solve: 'a', n: '2', y: '-4' }))), 'CSV of a case with no solution'); ok(S.exportTxt(R({ solve: 'a', n: '2', y: '-4' })).indexOf('Answer: ') > 0, 'TXT of a case with no solution');
eq(S.fmtGroup('1234567.5'), '1,234,567.5', 'digit grouping');

/* 6. mode strip and built page */
const modes = require('../tools/exponent_modes.js'), strip = modes('solver');
ok(/href="\.\.\/exponent-solver\/" aria-current="page"/.test(strip), 'mode strip marks Mode 03 as the current page'); ok(/href="\.\.\/exponent-calculator\/"/.test(strip) && /href="\.\.\/negative-fractional-exponents-calculator\/"/.test(strip), 'mode strip links Modes 01 and 02');
ok(/href="\.\.\/exponent-laws-calculator\/"/.test(strip) && /href="\.\.\/engineering-powers-scientific-notation\/"/.test(strip) && !/chip soon/.test(strip), 'Modes 04 and 05 are linked');
const pagePath = path.join(__dirname, '../calculators/exponent-solver/index.html');
if (fs.existsSync(pagePath)) {
  const html = fs.readFileSync(pagePath, 'utf8');
  ok(/<title>[^<]{20,60}<\/title>/.test(html), 'page title length'); const d = /name="description" content="([^"]*)"/.exec(html); ok(d && d[1].length >= 50 && d[1].length <= 160, 'meta description length');
  ok((html.match(/<h1[ >]/g) || []).length === 1, 'one h1'); ok(/id="ex-a"/.test(html) && /id="ex-n"/.test(html) && /id="ex-y"/.test(html), 'three input fields'); ok(/data-solve="n"/.test(html) && /data-solve="a"/.test(html) && /data-solve="y"/.test(html), 'three solve-for buttons');
  ok(/ExponentSolver/.test(html) && /ExponentFrac/.test(html) && /ExponentCalc/.test(html), 'engines inlined'); ok(!/ExponentSolver\.run\([^)]*\)\s*\.\s*undefined/.test(html), 'no broken calls');
  ok((((html.match(/<section id="faq">[^]*?<\/section>/) || [''])[0]).match(/<h3>[^]*?<\/h3><p>[^]*?<\/p>/g) || []).length >= 10, 'faq section has at least 10 question and answer pairs for the FAQPage markup'); ok(!/class="chip soon"[^>]*>Mode 03/.test(html), 'Mode 03 not marked coming'); ok(/Mode 03 · Missing Value Solver/.test(html), 'mode strip on the page');
  const faqCount = (html.match(/<h3>[^<]*\?<\/h3>/g) || []).length; ok(faqCount >= 10, 'FAQ present: ' + faqCount);
  /* run the page script against a small fake DOM, as the other modes do, and drive it: default render, switching the unknown, a chip, typing, history */
  const els = {}; const mk = (id) => (els[id] = els[id] || { id, value: '', innerHTML: '', textContent: '', hidden: false, readOnly: false, placeholder: '', dataset: {}, children: [], h: {}, attrs: {}, cls: new Set(), classList: { toggle(c, on) { (on ? els[id].cls.add(c) : els[id].cls.delete(c)); }, add(c) { els[id].cls.add(c); }, remove(c) { els[id].cls.delete(c); } }, setAttribute(k, v) { els[id].attrs[k] = v; }, addEventListener(t, f) { els[id].h[t] = f; }, focus() {}, select() {}, click() {}, setSelectionRange() {} });
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((t) => /ExponentSolver/.test(t) && /em-exponent-solver-history/.test(t));
  ok(!!script, 'page script found');
  if (script) {
    const doc = { getElementById: (id) => mk(id), createElement: () => mk('x'), execCommand: () => true, body: { appendChild() {}, removeChild() {} } }, store = {};
    ['ex-a', 'ex-n', 'ex-y', 'ex-sig', 'ex-err', 'ex-out', 'ex-steps', 'ex-note', 'ex-dl', 'ex-hist', 'ex-hclear', 'ex', 'ex-unk', 'ex-la', 'ex-ln', 'ex-ly'].forEach(mk);
    els['ex-unk'].children = ['n', 'a', 'y'].map((k) => ({ dataset: { solve: k }, attrs: {}, setAttribute(a, v) { this.attrs[a] = v; } })); els['ex-sig'].value = '6';
    const click = (b) => els['ex'].h.click({ target: { closest: () => b } }), btn = (d) => ({ dataset: d });
    const typeIn = (id, v) => { els[id].value = v; els[id].h.input(); };
    try {
      new Function('document', 'window', 'localStorage', 'navigator', 'self', script)(doc, { print() {} }, { getItem: (k) => store[k] || null, setItem: (k, v) => { store[k] = v; } }, {}, undefined);
      eq(els['ex-n'].value, '5', 'default: 2^n = 32 fills the exponent field'); ok(els['ex-n'].readOnly && !els['ex-a'].readOnly && !els['ex-y'].readOnly, 'default: only the exponent field is read-only'); ok(/Unique real solution/.test(els['ex-out'].innerHTML) && /Exponent n/.test(els['ex-out'].innerHTML), 'default: result shown'); ok(els['ex-dl'].hidden === false, 'default: downloads shown');
      ok(!/undefined|NaN|\[object/.test(els['ex-out'].innerHTML + els['ex-steps'].innerHTML), 'default render has no broken text'); ok(/Passed/.test(els['ex-steps'].innerHTML), 'default: the check is shown');
      click(btn({ solve: 'a' })); ok(els['ex-a'].readOnly && !els['ex-n'].readOnly, 'solve for a: the base field is read-only'); ok(/Enter/.test(els['ex-err'].textContent), 'solve for a: asks for the missing exponent'); eq(els['ex-out'].innerHTML, '', 'solve for a: no result while a value is missing');
      typeIn('ex-n', '3'); typeIn('ex-y', '125'); eq(els['ex-a'].value, '5', 'x^3 = 125 gives 5'); typeIn('ex-n', '2'); typeIn('ex-y', '9'); eq(els['ex-a'].value, '\u00b13', 'x^2 = 9 shows both signs'); ok(/Multiple real solutions/.test(els['ex-out'].innerHTML), 'two solutions are labelled');
      typeIn('ex-y', '-4'); ok(/No real solution/.test(els['ex-out'].innerHTML) && els['ex-a'].value === '', 'x^2 = -4: no real solution, field left empty'); typeIn('ex-y', 'abc'); ok(/not a number/.test(els['ex-err'].textContent) && els['ex-y'].cls.has('bad'), 'a bad entry marks the field');
      click(btn({ ex: JSON.stringify({ solve: 'y', a: '27', n: '2/3', y: '', sig: '6' }) })); eq(els['ex-y'].value, '9', 'chip: 27^(2/3) = 9'); eq(els['ex-n'].value, '2/3', 'chip: the other fields are filled');
      click(btn({ solve: 'n' })); eq(els['ex-y'].value, '', 'switching the unknown restores the typed value of the other field'); click(btn({ ex: JSON.stringify({ solve: 'n', a: '2', n: '', y: '10', sig: '6' }) })); ok(/\u2248 3\.32193/.test(els['ex-n'].value), 'chip: an irrational exponent is marked approximate');
      click(btn({ act: 'save' })); ok(JSON.parse(store['em-exponent-solver-history'] || '[]').length === 1, 'history saved'); click(btn({ act: 'copyall' })); click(btn({ dl: 'csv' })); click(btn({ act: 'reset' })); eq(els['ex-n'].value, '5', 'reset returns to the default');
    } catch (e) { bad('page script threw: ' + e.message + ' ' + (e.stack || '').split('\n')[1]); }
  }
}
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
