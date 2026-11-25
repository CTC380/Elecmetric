/* Tests for tools/percent_change_engine.js (Percentage Calculator, Mode 02, Increase & Decrease) against tests/percent_change_vectors.json (independent:
   gen_percent_change_vectors.py, Python fractions.Fraction and decimal.Decimal), the fixed cases from the Percentage Calculator CEO decision note,
   and round-trip properties between the five questions. */
const C = require('../tools/percent_change_engine.js'), V = require('./percent_change_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 15) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': ' + a + ' vs ' + b); };
const U = { inc: '', dec: '', chg: '%', revinc: '', revdec: '' };
const common = (r, t) => {
  eq(r.ok, true, 'accepted ' + t); if (!r.ok) return false;
  eq(Array.isArray(r.steps) && r.steps.length >= 3 && r.steps.every((s) => typeof s === 'string' && s.length > 8), true, 'working present ' + t);
  eq(Array.isArray(r.rows) && r.rows.length >= 4 && r.rows.every((x) => x.length === 3), true, 'result rows ' + t);
  eq(typeof r.formula === 'string' && r.formula.length > 5 && typeof r.subst === 'string' && typeof r.sentence === 'string' && r.sentence.length > 3, true, 'formula, substitution and sentence ' + t);
  eq(/undefined|NaN|\[object|@/.test(JSON.stringify([r.steps, r.rows, r.formula, r.subst, r.sentence, r.big])), false, 'no undefined, NaN or placeholder text ' + t);
  return true;
};
const chk = (row, tag) => {
  const [kind, x, y, places, num, den, text, exact, dir, amt] = row, t = '[' + tag + ' ' + kind + ' ' + String(x).slice(0, 12) + ' ' + String(y).slice(0, 12) + ' @' + places + ']';
  const r = C.calc({ kind, x, y, places }); if (!common(r, t)) return;
  eq(r.num, num, 'numerator ' + t); eq(r.den, den, 'denominator ' + t); eq(r.text, text, 'text ' + t); eq(r.exact, exact, 'exactness ' + t);
  eq(r.unit, U[kind], 'unit ' + t); eq(r.big, (exact ? '' : '\u2248 ') + text + U[kind], 'big ' + t); eq(BigInt(r.den) > 0n, true, 'positive denominator ' + t);
  if (kind === 'chg') { eq(r.dir, dir, 'direction ' + t); eq(r.rows.some((x) => x[0] === 'Direction' && x[1].toLowerCase() === dir), true, 'direction row ' + t); }
  if (amt !== null && amt !== undefined) { const row = r.rows.find((z) => /^Amount of /.test(z[0])); eq(row && row[1], amt, 'amount row ' + t); }
  if (kind === 'inc' || kind === 'dec') eq(r.sentence.indexOf(exact ? ' = ' : ' \u2248 ') > 0, true, 'sentence sign ' + t);
};
V.calc.forEach((row) => chk(row, 'calc')); V.big.forEach((row) => chk(row, 'big'));
for (const [kind, a, b] of V.err) {
  const t = '[' + kind + ' ' + [a, b].map((s) => String(s).slice(0, 10)).join(' | ') + ']', r = C.calc({ kind, x: a, y: b });
  eq(r.ok, false, 'must be refused ' + t); eq(typeof r.error === 'string', true, 'error is text ' + t); if (!r.empty) eq(r.error.length > 10, true, 'message present ' + t);
}
for (const [kind, a, b] of V.empty) { const r = C.calc({ kind, x: a, y: b }); eq(r.empty === true && r.ok === false && typeof r.hint === 'string' && r.hint.length > 5, true, 'empty input is flagged empty with a hint [' + kind + ' ' + a + ' ' + b + ']'); }
// fixed cases from the product note
const K = (k, x, y, p) => C.calc({ kind: k, x: String(x), y: String(y), places: p === undefined ? 'auto' : p });
eq(K('inc', 1000, 15).big, '1150', 'a 1,000 component up 15%'); eq(K('revdec', 920, 20).big, '1150', 'original of 920 after a 20% discount');
eq(K('chg', 80, 100).big, '25%', '80 to 100 is +25%'); eq(K('chg', 100, 80).big, '-20%', '100 to 80 is -20%');
eq(K('revdec', 920, 20).rows.find((z) => /Wrong shortcut/.test(z[0]))[1], '1104', 'adding 20% to 920 gives 1104, not the original');
eq(K('revinc', 1150, 15).big, '1000', 'original before a 15% increase');
eq(K('chg', 1000, 750).big, '-25%', 'energy: 1,000 kWh down to 750 kWh'); eq(K('chg', 1000, 750).sentence, 'From 1000 to 750 is a decrease of 25%', 'sentence');
eq(K('chg', 80, 100).sentence, 'From 80 to 100 is an increase of 25%', 'sentence increase'); eq(K('chg', 5, 5).sentence, 'From 5 to 5 there is no change (0%)', 'sentence no change');
eq(K('chg', 3, 4).big, '\u2248 33.333333%', 'rounded change is approximate'); eq(K('chg', 3, 4, 2).text, '33.33', 'two places');
eq(K('inc', 100, 25).rows.find((z) => /get back/.test(z[0]))[0], 'Decrease needed to get back to V', '25% up needs a 20% fall'); eq(K('inc', 100, 25).rows.find((z) => /get back/.test(z[0]))[1], '20%', '100 to 125 to 100 is -20%');
eq(K('dec', 100, 25).rows.find((z) => /get back/.test(z[0]))[0], 'Increase needed to get back to V', 'a 25% fall needs an increase'); eq(K('dec', 100, 20).rows.find((z) => /get back/.test(z[0]))[1], '25%', '100 to 80 to 100 is +25%');
eq(K('dec', 100, 100).rows.find((z) => /get back/.test(z[0]))[1], 'not possible', 'from 0 you cannot get back');
eq(K('chg', 0, 5).ok, false, 'zero old value'); eq(/old value is 0/.test(K('chg', 0, 5).error), true, 'zero old value message'); eq(K('revdec', 5, 100).ok, false, '100% decrease cannot be reversed'); eq(K('revinc', 5, -100).ok, false, '-100% increase cannot be reversed');
eq(K('dec', 100, 150).big, '-50', 'over 100% decrease goes below zero'); eq(K('dec', 100, 150).warnings.length, 1, 'over 100% is explained'); eq(K('inc', 100, -20).warnings.length, 1, 'negative percentage is explained'); eq(K('chg', -50, -25).warnings.length, 1, 'negative old value is explained');
eq(K('chg', 5, -5).warnings.length, 1, 'sign change is explained'); eq(K('chg', -50, -25).big, '50%', 'a rise from -50 to -25 is an increase');
eq(K('inc', 1000, 15, 'auto').places, 'auto', 'places echoed'); eq(K('inc', 1, 1, 13).ok, false, 'too many places refused'); eq(K('inc', 1, 1, -1).ok, false, 'negative places refused'); eq(K('inc', 1, 1, 1.5).ok, false, 'fractional places refused');
eq(C.calc(null).ok, false, 'null input'); eq(C.calc({ kind: 'of', x: '1', y: '1' }).ok, false, 'Mode 01 kind is not a Mode 02 kind');
eq(K('inc', '1'.repeat(400), 10).ok, true, '400-digit value'); eq(K('inc', '1'.repeat(401), 10).ok, false, '401 digits refused');
// round trips on exact arithmetic (a different route from the vectors): undoing a change returns the start, and the change measured from start to result is the percentage that was applied
const PE = require('../tools/percent_engine.js'), fr = (t, neg) => { const q = PE.parseNum(t, 'p').q, n = neg ? -q.n : q.n; return q.d === 1n ? String(n) : n + '/' + q.d; };
let s = 12345; const rnd = (m) => { s = (s * 1103515245 + 12345) % 2147483648; return s % m; };
for (let i = 0; i < 1500; i++) {
  const v = (1 + rnd(99999)) + '.' + rnd(100), p = rnd(300) + '.' + rnd(100), pp = Math.min(99, rnd(100)) + '.' + rnd(100), t = '[' + v + ' ' + p + ' ' + pp + ']';
  const a = C.calc({ kind: 'inc', x: v, y: p }), b = C.calc({ kind: 'revinc', x: a.text, y: p }), c = C.calc({ kind: 'chg', x: v, y: a.text });
  eq(a.exact && b.ok && b.frac, fr(v), 'revinc of an increase returns the start ' + t); eq(c.ok && c.frac, fr(p), 'change from V to V increased by P is P ' + t);
  const d = C.calc({ kind: 'dec', x: v, y: pp }), e = C.calc({ kind: 'revdec', x: d.text, y: pp }), g = C.calc({ kind: 'chg', x: v, y: d.text });
  eq(d.exact && e.ok && e.frac, fr(v), 'revdec of a decrease returns the start ' + t); eq(g.ok && g.frac, fr(pp, true), 'change from V to V decreased by P is minus P ' + t);
}
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
