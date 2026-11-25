/* Tests for tools/percent_price_engine.js (Percentage Calculator, Mode 06, Sequential, Discount & Markup) against tests/percent_price_vectors.json (independent:
   gen_percent_price_vectors.py, Python fractions.Fraction and decimal.Decimal), the Phase 2 cases of the Percentage Calculator CEO decision note, and exact
   round-trip properties between the eight questions (a discount undone by the original-price question, a markup undone by the cost question, markup and margin
   recovered from the price they produced, a chain that is the same in any order). */
const C = require('../tools/percent_price_engine.js'), V = require('./percent_price_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 15) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': ' + a + ' vs ' + b); };
const U = { seq: '', disc: '', dpct: '%', mkup: '', mgn: '', mkpct: '%', orig: '', cost: '' };
const common = (r, t) => {
  eq(r.ok, true, 'accepted ' + t); if (!r.ok) return false;
  eq(Array.isArray(r.steps) && r.steps.length >= 3 && r.steps.every((s) => typeof s === 'string' && s.length > 8), true, 'working present ' + t);
  eq(Array.isArray(r.rows) && r.rows.length >= 4 && r.rows.every((x) => x.length === 3), true, 'result rows ' + t);
  eq(typeof r.formula === 'string' && r.formula.length > 5 && typeof r.subst === 'string' && typeof r.sentence === 'string' && r.sentence.length > 3, true, 'formula, substitution and sentence ' + t);
  eq(Array.isArray(r.warnings), true, 'warnings list ' + t);
  eq(/undefined|NaN|\[object|@/.test(JSON.stringify([r.steps, r.rows, r.formula, r.subst, r.sentence, r.big])), false, 'no undefined, NaN or placeholder text ' + t);
  return true;
};
const chk = (row, tag) => {
  const [kind, x, y, places, num, den, text, exact, dir, aux] = row, t = '[' + tag + ' ' + kind + ' ' + String(x).slice(0, 12) + ' ' + String(y).slice(0, 24) + ' @' + places + ']';
  const r = C.calc({ kind, x, y, places }); if (!common(r, t)) return;
  eq(r.num, num, 'numerator ' + t); eq(r.den, den, 'denominator ' + t); eq(r.text, text, 'text ' + t); eq(r.exact, exact, 'exactness ' + t);
  eq(r.unit, U[kind], 'unit ' + t); eq(r.big, (exact ? '' : '\u2248 ') + text + U[kind], 'big ' + t); eq(BigInt(r.den) > 0n, true, 'positive denominator ' + t);
  if (kind === 'dpct') { eq(r.dir, dir, 'direction ' + t); }
  for (const [label, want] of aux) { const row = r.rows.find((z) => z[0] === label); eq(row && row[1], want, 'row "' + label + '" ' + t); }
};
V.calc.forEach((row) => chk(row, 'calc')); V.big.forEach((row) => chk(row, 'big'));
for (const [kind, a, b] of V.err) {
  const t = '[' + kind + ' ' + [a, b].map((s) => String(s).slice(0, 10)).join(' | ') + ']', r = C.calc({ kind, x: a, y: b });
  eq(r.ok, false, 'must be refused ' + t); eq(typeof r.error === 'string', true, 'error is text ' + t); if (!r.empty) eq(r.error.length > 10, true, 'message present ' + t);
}
for (const [kind, a, b] of V.empty) { const r = C.calc({ kind, x: a, y: b }); eq(r.empty === true && r.ok === false && typeof r.hint === 'string' && r.hint.length > 5, true, 'empty input is flagged empty with a hint [' + kind + ' ' + a + ' ' + b + ']'); }
// fixed cases from the product note and the Phase 2 definitions
const K = (k, x, y, p) => C.calc({ kind: k, x: String(x), y: String(y), places: p === undefined ? 'auto' : p });
const rowOf = (r, re) => { const z = r.rows.find((q) => re.test(q[0])); return z ? z[1] : undefined; };
eq(K('seq', 100, '+10 -10').big, '99', '+10% then -10% is not zero'); eq(rowOf(K('seq', 100, '+10 -10'), /^Overall change/), '-1%', 'overall change is -1%');
eq(rowOf(K('seq', 100, '+10 -10'), /^Simple sum/), '0%', 'the simple sum would say 0%'); eq(rowOf(K('seq', 100, '+10 -10'), /^Sum minus/), '1 percentage point', 'singular point');
eq(K('seq', 100, '20 -20').big, '96', '+20% then -20% is 96'); eq(K('seq', 1000, '10 10 -5').big, '1149.5', 'three changes');
eq(K('seq', 100, '-20 -10').big, '72', 'two discounts of 20% and 10% leave 72'); eq(rowOf(K('seq', 100, '-20 -10'), /^Overall change/), '-28%', 'total of two discounts is 28%, not 30%');
eq(rowOf(K('seq', 7, '+10 -10'), /^Overall change/), rowOf(K('seq', 100, '+10 -10'), /^Overall change/), 'overall change does not depend on the start');
eq(rowOf(K('seq', 100, '-100 50'), /^Change needed/), 'not possible', 'cannot return from zero'); eq(K('seq', 100, '-100 50').warnings.length, 1, '-100% explained'); eq(K('seq', 100, '10').warnings.length, 1, 'single change explained');
eq(K('seq', 100, '5 5').warnings.length, 0, 'ordinary chain has no warning'); eq(K('seq', -50, '10 10').warnings.length, 1, 'negative start explained');
eq(K('seq', 100, '+10%, -10%').sentence, '100 after +10%, then \u221210% = 99', 'sentence');
eq(K('seq', 100, '1 '.repeat(30)).ok, true, '30 changes accepted'); eq(K('seq', 100, '1 '.repeat(31)).ok, false, '31 changes refused');
eq(K('disc', 500, 10).big, '450', 'Phase 2: 500 less 10%'); eq(rowOf(K('disc', 500, 10), /^You save/), '50', 'saving'); eq(K('disc', 100, 150).warnings.length, 1, 'over 100% explained'); eq(K('disc', 100, -20).warnings.length, 1, 'negative discount explained');
eq(K('dpct', 500, 450).big, '10%', 'discount from two prices'); eq(K('dpct', 500, 450).dir, 'discount', 'direction discount'); eq(K('dpct', 500, 450).sentence, 'A sale price of 450 against an original of 500 is a discount of 10%', 'discount sentence');
eq(K('dpct', 450, 500).dir, 'increase', 'a higher sale price is an increase'); eq(K('dpct', 450, 500).warnings.length, 1, 'increase explained'); eq(K('dpct', 450, 500).sentence, 'A sale price of 500 against an original of 450 is a price increase of \u2248 11.111111%', 'increase sentence');
eq(rowOf(K('dpct', 500, 450), /^Price rise needed/), '\u2248 11.111111%', 'rise needed to restore'); eq(K('dpct', 100, 100).dir, 'no change', 'no change');
eq(K('mkup', 80, 25).big, '100', 'markup 25% on cost 80'); eq(rowOf(K('mkup', 80, 25), /^Margin on/), '20%', 'markup 25% is a 20% margin');
eq(K('mgn', 80, 20).big, '100', 'margin 20% on cost 80'); eq(rowOf(K('mgn', 80, 20), /^Markup on/), '25%', 'margin 20% is a 25% markup'); eq(rowOf(K('mgn', 80, 20), /^Wrong shortcut/), '96', 'adding 20% to the cost is not a 20% margin');
eq(K('mkpct', 80, 100).big, '25%', 'markup from prices'); eq(rowOf(K('mkpct', 80, 100), /^Margin on/), '20%', 'margin from prices'); eq(K('mkpct', 100, 80).warnings.length, 1, 'loss explained');
eq(K('orig', 72, '20 10').big, '100', 'original before 20% and 10% off'); eq(rowOf(K('orig', 72, '20 10'), /^Total discount/), '28%', 'total discount'); eq(rowOf(K('orig', 72, '20 10'), /^Simple sum/), '30%', 'simple sum for contrast');
eq(rowOf(K('orig', 72, '20 10'), /^Wrong shortcut/), '93.6', 'adding 30% to 72 is not the original');
eq(K('orig', 92, 20).big, '115', 'brief: original before a 20% discount on 92'); eq(K('orig', 920, 20).big, '1150', 'original of 920 after 20% off'); eq(rowOf(K('orig', 920, 20), /^Wrong shortcut/), '1104', 'wrong shortcut 1104');
eq(K('orig', 920, 20).warnings.length, 1, 'single discount points to Mode 02'); eq(K('orig', 72, '20 10').warnings.length, 0, 'chain has no warning');
eq(K('cost', 100, 25).big, '80', 'cost from price and markup'); eq(rowOf(K('cost', 100, 25), /^Margin on/), '20%', 'margin'); eq(rowOf(K('cost', 100, 25), /^If the percentage/), '75', 'a margin reading would give a different cost');
eq(K('mgn', 80, 100).ok, false, '100% margin refused'); eq(K('orig', 5, 100).ok, false, '100% discount refused'); eq(K('orig', 5, '20 100').ok, false, 'chain reaching 0 refused'); eq(K('cost', 5, -100).ok, false, '-100% markup refused');
eq(K('dpct', 0, 5).ok, false, 'zero original price'); eq(/original price is 0/.test(K('dpct', 0, 5).error), true, 'zero original message'); eq(K('mkpct', 0, 5).ok, false, 'zero cost');
eq(rowOf(K('mkup', 100, -100), /^Margin on/), 'not defined', 'margin of a zero price'); eq(rowOf(K('mgn', 0, 30), /^Markup on/), 'not defined', 'markup of a zero cost'); eq(rowOf(K('mkpct', 100, 0), /^Margin on/), 'not defined', 'margin when the price is 0');
eq(K('seq', 100, '10,5').ok, false, 'comma between digits refused'); eq(K('seq', 100, '10, 5').ok, true, 'comma then space accepted');
eq(K('seq', 1, 1, 13).ok, false, 'too many places refused'); eq(K('disc', 1, 1, -1).ok, false, 'negative places refused'); eq(K('disc', 1, 1, 1.5).ok, false, 'fractional places refused'); eq(K('disc', 1000, 15, 'auto').places, 'auto', 'places echoed');
eq(C.calc(null).ok, false, 'null input'); eq(C.calc({ kind: 'inc', x: '1', y: '1' }).ok, false, 'Mode 02 kind is not a Mode 06 kind'); eq(C.calc({ kind: 'of', x: '1', y: '1' }).ok, false, 'Mode 01 kind is not a Mode 06 kind');
eq(K('disc', '1'.repeat(400), 10).ok, true, '400-digit value'); eq(K('disc', '1'.repeat(401), 10).ok, false, '401 digits refused');
// round trips on exact arithmetic (a different route from the vectors)
const PE = require('../tools/percent_engine.js'), fr = (t) => { const q = PE.parseNum(t, 'p').q; return q.d === 1n ? String(q.n) : q.n + '/' + q.d; };
let s = 20261122; const rnd = (m) => { s = (s * 1103515245 + 12345) % 2147483648; return s % m; };
for (let i = 0; i < 1500; i++) {
  const v = (1 + rnd(99999)) + '.' + rnd(100), p = rnd(300) + '.' + rnd(100), q = rnd(60) + '.' + rnd(100), pp = Math.min(95, rnd(100)) + '.' + rnd(100), t = '[' + v + ' ' + p + ' ' + q + ' ' + pp + ']';
  // a discount undone by the original-price question; two chained discounts undone by one question
  const d = C.calc({ kind: 'disc', x: v, y: pp }), o = C.calc({ kind: 'orig', x: d.text, y: pp }); eq(d.exact && o.ok && o.frac, fr(v), 'orig undoes disc ' + t);
  const sq = C.calc({ kind: 'seq', x: v, y: '-' + pp + ' -' + q }), o2 = C.calc({ kind: 'orig', x: sq.text, y: pp + ' ' + q });
  eq(sq.exact && o2.ok && o2.frac, fr(v), 'orig undoes a chain of two discounts ' + t);
  // a markup undone by the cost question; markup and margin recovered from the prices
  const m = C.calc({ kind: 'mkup', x: v, y: p }), c = C.calc({ kind: 'cost', x: m.text, y: p }); eq(m.exact && c.ok && c.frac, fr(v), 'cost undoes markup ' + t);
  const k = C.calc({ kind: 'mkpct', x: v, y: m.text }); eq(k.ok && k.frac, fr(p), 'markup recovered from cost and price ' + t);
  const g = C.calc({ kind: 'mgn', x: v, y: pp });
  if (g.ok && g.exact) { const k2 = C.calc({ kind: 'mkpct', x: v, y: g.text }), mg = rowOf(k2, /^Margin on/); eq(k2.ok && /^-?[\d.]+%$/.test(mg) && fr(mg.slice(0, -1)), fr(pp), 'margin recovered from cost and the price it produced ' + t); }
  // chains commute, a single change equals Mode 02's increase, and the discount percentage is recovered from the two prices
  const a = C.calc({ kind: 'seq', x: v, y: p + ' -' + q }), b = C.calc({ kind: 'seq', x: v, y: '-' + q + ' ' + p }); eq(a.ok && b.ok && a.frac, b.frac, 'chain order does not matter ' + t);
  const one = C.calc({ kind: 'seq', x: v, y: p }), two = C.calc({ kind: 'disc', x: v, y: '-' + p }); eq(one.ok && two.ok && one.frac, two.frac, 'one change equals a negative discount ' + t);
  const dp = C.calc({ kind: 'dpct', x: v, y: d.text }); eq(dp.ok && dp.frac, fr(pp), 'discount recovered from the two prices ' + t);
}
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
