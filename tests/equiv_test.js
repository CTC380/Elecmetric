/* Tests for tools/equiv_engine.js (Ratio Calculator, Mode 03, Equivalent Ratio Generator) against tests/equiv_vectors.json (independent: gen_equiv_vectors.py, Python
   fractions.Fraction and sympy.divisors) and the fixed cases from the Ratio Calculator CEO decision note (2:3 table, 3:4 and 2:3 scaling, 400:5 as 80:1). */
const E = require('../tools/equiv_engine.js'), V = require('./equiv_vectors.json'), fs = require('fs'), path = require('path');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 20) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const lab = (f) => { const p = f.split('/'); return p.length === 1 ? '\u00d7 ' + f : p[0] === '1' ? '\u00f7 ' + p[1] : '\u00d7 ' + f; };
const clean = (r) => !/undefined|NaN|\[object|null/.test(JSON.stringify([r.steps, r.rows, r.sentence, r.summary, r.terms, r.first, r.down || [], r.headline, r.warnings, r.notes, r.verify]).replace(/is undefined/g, ''));
for (const [text, op, ex, rows, first, down, simp, gcd] of V.cases) {
  const tag = '[' + text.slice(0, 40) + ' ' + op + ' ' + JSON.stringify(ex).slice(0, 50) + ']';
  const r = E.generate({ ratio: text, op, mults: ex.mults, factor: ex.factor, divisor: ex.factor, term: ex.term, target: ex.target });
  if (!r.ok) { bad(tag + ' rejected: ' + r.error); continue; }
  eq(r.rows.length, rows.length, 'row count ' + tag);
  rows.forEach((x, i) => { const g = r.rows[i]; if (!g) return; eq(g.label, x[0], 'multiplier ' + i + ' ' + tag); eq(g.ratio, x[1], 'ratio ' + i + ' ' + tag); eq(g.whole, x[2], 'whole-number flag ' + i + ' ' + tag); eq(g.lab, op === 'divide' ? '\u00f7 ' + x[0] : op === 'target' ? lab(x[0]) : '\u00d7 ' + x[0], 'label ' + i + ' ' + tag); });
  eq(r.first.factor, first, 'first scale factor ' + tag); eq(r.first.ratio, rows[0][1], 'first ratio ' + tag); eq(r.ratioText, simp, 'simplest form ' + tag); eq(r.gcd, gcd, 'gcd of the whole-number form ' + tag);
  if (down === null) { eq(r.down, null, 'no divisor list ' + tag); eq(r.downNote.length > 20, true, 'note explains why ' + tag); }
  else {
    eq(r.down.length, down.length, 'down count ' + tag);
    down.forEach((x, i) => { const g = r.down[i]; if (!g) return; eq(g.lab, x[0], 'down label ' + i + ' ' + tag); eq(g.ratio, x[1], 'down ratio ' + i + ' ' + tag); eq(g.simplest, x[2], 'down simplest flag ' + i + ' ' + tag); });
    eq(r.down[r.down.length - 1].ratio, simp, 'last scaled-down ratio is the simplest form ' + tag); eq(r.down[r.down.length - 1].simplest, true, 'last is flagged simplest ' + tag);
  }
  eq(r.verifyOk, true, 'checks ' + tag); eq(r.verify.length >= 4 && r.verify.every((x) => x[1] === true), true, 'every check passed ' + tag);
  eq(Array.isArray(r.steps) && r.steps.length >= 4 && r.steps.every((s) => typeof s === 'string' && s.length > 8), true, 'working ' + tag); eq(clean(r), true, 'no undefined or NaN text ' + tag);
  eq(r.summary.split('\n').length >= 3, true, 'summary lines ' + tag); eq(r.terms.length, text.split(':').length, 'terms listed ' + tag);
  // a ratio and its equivalent always have equal cross products term by term (independent integer check on the text of the first result)
  if (op !== 'table' && r.first.terms.every((t) => /^\d+$/.test(t)) && text.split(':').every((t) => /^\d+$/.test(t))) {
    const a = text.split(':').map(BigInt), b = r.first.terms.map(BigInt); let okc = true; for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (a[i] * b[j] !== a[j] * b[i]) okc = false;
    eq(okc, true, 'integer cross products agree ' + tag);
  }
}
V.err.forEach(([inp, field]) => { const r = E.generate(inp), tag = '[' + JSON.stringify(inp) + ']'; eq(r.ok, false, 'must refuse ' + tag); eq(typeof r.error === 'string' && r.error.length > 5 && r.empty !== true, true, 'message ' + tag); eq(r.field, field, 'bad field ' + tag); });
V.empty.forEach(([inp]) => { const r = E.generate(inp); eq(r.ok === false && r.empty === true && typeof r.hint === 'string' && r.hint.length > 5, true, 'empty input flagged with a hint [' + JSON.stringify(inp) + ']'); });
// the CEO note, by exact text
const t = E.generate({ ratio: '2:3', op: 'table' });
eq(t.rows.map((x) => x.ratio).join(' | '), '2 : 3 | 4 : 6 | 6 : 9 | 8 : 12 | 10 : 15 | 20 : 30', 'the 2:3 table of the note'); eq(t.rows.map((x) => x.label).join(','), '1,2,3,4,5,10', 'default multipliers');
eq(E.generate({ ratio: '2:3', op: 'multiply', factor: '4' }).first.ratio, '8 : 12', '2:3 scaled by 4 is 8:12'); eq(E.generate({ ratio: '8:12', op: 'divide', factor: '4' }).first.ratio, '2 : 3', '8:12 scaled down by 4');
eq(E.generate({ ratio: '400:5', op: 'target', term: 2, target: '1' }).first.ratio, '80 : 1', '400:5 is 80:1'); eq(E.generate({ ratio: '400:5', op: 'target', term: 1, target: '240' }).first.ratio, '240 : 3', '240 A primary gives 3 A secondary');
eq(E.generate({ ratio: '12:18' }).ratioText, '2 : 3', '12:18 simplest form'); eq(E.generate({ ratio: '45:60' }).ratioText, '3 : 4', '45:60 simplest form'); eq(E.generate({ ratio: '1.5:2.5' }).ratioText, '3 : 5', '1.5:2.5 simplest form');
eq(E.generate({ ratio: '12:18' }).down.map((x) => x.ratio).join(' | '), '12 : 18 | 6 : 9 | 4 : 6 | 2 : 3', 'whole-number list of 12:18');
eq(E.generate({ ratio: '2:3', op: 'target', term: 2, target: '1' }).first.ratio, '2/3 : 1', 'a non-terminating term is an exact fraction'); eq(E.generate({ ratio: '1:3', op: 'multiply', factor: '2.5' }).first.ratio, '2.5 : 7.5', 'exact decimals');
eq(E.generate({ ratio: '2:3', op: 'multiply', factor: '1/3' }).first.ratio, '2/3 : 1', 'a fractional factor'); eq(E.generate({ ratio: '2:3', mults: '1-10' }).rows.length, 10, 'range 1-10'); eq(E.generate({ ratio: '2:3', mults: '5-5' }).rows.length, 1, 'range 5-5');
eq(E.generate({ ratio: '2:3', mults: '1\u201310' }).rows.length, 10, 'en dash range'); eq(E.generate({ ratio: '2:3', mults: '1..3, 10' }).rows.length, 4, '1..3 range with another multiplier'); eq(E.generate({ ratio: '2:3', mults: '1;2\n3' }).rows.length, 3, 'semicolon and newline separators');
eq(E.generate({ ratio: '2:3', mults: '1-60' }).rows.length, 60, 'sixty multipliers allowed'); eq(E.generate({ ratio: '2:3', mults: '1-61' }).ok, false, 'sixty-one refused'); eq(E.generate({ ratio: '2:3', mults: Array(61).fill('1').join(',') }).ok, false, 'sixty-one listed refused');
eq(E.generate({ ratio: '2:3' }).op, 'table', 'table is the default operation'); eq(E.generate({ ratio: '2:3', op: '' }).op, 'table', 'empty operation is the table'); eq(E.generate({ ratio: '2:3', op: 'target', target: '9' }).targetTerm, 1, 'term defaults to 1');
eq(E.generate({ ratio: '0:5:10', op: 'multiply', factor: '3' }).first.ratio, '0 : 15 : 30', 'zero stays zero'); eq(E.generate({ ratio: '0:5:10', op: 'multiply', factor: '3' }).warnings.some((w) => /stays 0/.test(w)), true, 'zero warning');
eq(E.generate({ ratio: '1.5:2.5' }).warnings.some((w) => /read exactly/.test(w)), true, 'decimals read exactly warning'); eq(E.generate({ ratio: '2:3', op: 'multiply', factor: '2.5' }).warnings.some((w) => /not a whole number/.test(w)), true, 'non-whole result warning');
eq(E.generate({ ratio: '1:2:3:4:5:6:7:8:9:10:11:12:13' }).ok, false, 'thirteen terms refused'); eq(E.generate({ ratio: '1:2:3:4:5:6:7:8:9:10:11:12', op: 'multiply', factor: '2' }).ok, true, 'twelve terms allowed');
eq(E.generate({ ratio: '1' + '0'.repeat(40) + ':3' + '0'.repeat(40), op: 'multiply', factor: '7' }).first.ratio, '7' + '0'.repeat(40) + ' : 21' + '0'.repeat(40), '41-digit terms');
eq(E.generate({ ratio: '12:18', op: 'target', term: 2, target: '0.5' }).first.ratio, '1/3 : 0.5', 'target below the term gives an exact fraction and a decimal');
eq(E.generate({ ratio: '5:0', op: 'multiply', factor: '2' }).first.ratio, '10 : 0', '5:0 scaled'); eq(E.generate({ ratio: '5:0', op: 'target', term: 2, target: '3' }).ok, false, 'a zero term cannot reach a target');
eq(E.tt === undefined, false, 'tt exported'); eq(E.factorLabel({ n: 1n, d: 4n }), '\u00f7 4', 'label for 1/4'); eq(E.factorLabel({ n: 3n, d: 2n }), '\u00d7 3/2', 'label for 3/2'); eq(E.factorLabel({ n: 6n, d: 1n }), '\u00d7 6', 'label for 6');
eq(E.parseMults('1, 2, 3').list.length, 3, 'parseMults list'); eq(E.DEFAULT_MULTS, '1, 2, 3, 4, 5, 10', 'default multipliers constant');
// the built page and the mode strip
const html = fs.readFileSync(path.join(__dirname, '..', 'calculators', 'equivalent-ratio-calculator', 'index.html'), 'utf8');
['<h1>Equivalent Ratio Calculator</h1>', 'id="ns-r"', 'id="ns-op"', 'id="ns-m"', 'id="ns-f"', 'id="ns-ti"', 'id="ns-tv"', 'Mode 03', 'Equivalent Ratio Generator', 'Ratio Distribution (coming)', 'href="../ratio-calculator/"', 'href="../proportion-calculator/"', 'The four ways to scale', 'Scaling down to whole numbers'].forEach((s) => eq(html.indexOf(s) >= 0, true, 'page has ' + s));
eq(html.indexOf('Equivalent Ratio Generator (coming)') < 0, true, 'Mode 03 is a link, not "(coming)"');
['ratio-calculator', 'proportion-calculator'].forEach((d) => { const h = fs.readFileSync(path.join(__dirname, '..', 'calculators', d, 'index.html'), 'utf8'); eq(h.indexOf('href="../equivalent-ratio-calculator/"') >= 0 && h.indexOf('Equivalent Ratio Generator (coming)') < 0, true, 'Mode ' + (d === 'ratio-calculator' ? '01' : '02') + ' page links to Mode 03'); });
console.log('equiv_test: ' + n + ' checks, ' + fail + ' failures'); process.exit(fail ? 1 : 0);
