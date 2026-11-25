/* Tests for tools/pe_signed_engine.js (Elecmetric Percent Error Calculator, Mode 02, Signed Error Analysis) against tests/pe_signed_vectors.json (independent:
   gen_pe_signed_vectors.py, Python fractions.Fraction and decimal.Decimal), the cases in the product brief, and exact properties on BigInt arithmetic.
   Also checks that Mode 02 agrees with Mode 01 on the size of every error, and static checks of the built page calculators/signed-error-analysis/index.html. */
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
const E = require('../tools/pe_signed_engine.js'), M1 = require('../tools/pe_engine.js'), V = require('./pe_signed_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 15) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': ' + a + ' vs ' + b); };
const K = (o, r, u, p) => E.calc({ x: String(o), y: String(r), unit: u === undefined ? '' : u, places: p === undefined ? 'auto' : p });
const row = (x, re) => x.rows.find((q) => re.test(q[0]));
for (const [o, r, places, num, den, text, exact, dir, signed, abs, rel, pct, corr, frac] of V.calc) {
  const t = '[' + String(o).slice(0, 12) + ' vs ' + String(r).slice(0, 12) + ' @' + places + ']', x = E.calc({ x: o, y: r, places });
  eq(x.ok, true, 'accepted ' + t); if (!x.ok) continue;
  eq(x.num, num, 'numerator ' + t); eq(x.den, den, 'denominator ' + t); eq(x.text, text, 'size text ' + t); eq(x.exact, exact, 'exactness ' + t); eq(x.dir, dir, 'direction ' + t);
  eq(x.signed, signed, 'signed error ' + t); eq(x.abs, abs, 'absolute error ' + t); eq(x.rel, rel, 'signed relative error ' + t); eq(x.pct, pct, 'signed deviation ' + t);
  eq(x.big, (exact ? '' : '\u2248 ') + pct + '%', 'big ' + t); eq(x.correction, corr, 'correction ' + t); eq(x.frac, frac, 'exact fraction ' + t);
  eq(x.sign, dir === 'equal' ? 0 : dir === 'above' ? 1 : -1, 'sign ' + t);
  eq(Array.isArray(x.steps) && x.steps.length === 6 && x.steps.every((s) => typeof s === 'string' && s.length > 8), true, 'working present ' + t);
  eq(x.rows.length >= 9 && x.rows.every((q) => q.length === 3), true, 'result rows ' + t);
  eq(/undefined|NaN|\[object|@/.test(JSON.stringify([x.steps, x.rows, x.formula, x.subst, x.sentence, x.big])), false, 'no undefined, NaN or placeholder text ' + t);
  const m1 = M1.calc({ x: o, y: r, places });
  eq(m1.ok && m1.num === x.num && m1.den === x.den && m1.dir === x.dir && m1.abs === x.abs && m1.text === x.text, true, 'agrees with Mode 01 on the size ' + t);
}
for (const [a, b] of V.zero) { const x = E.calc({ x: a, y: b }); eq(x.ok, false, 'zero reference refused ' + a + ' ' + b); eq(/reference value is 0/.test(x.error), true, 'zero reference message'); }
for (const [a, b] of V.bad) { const x = E.calc({ x: a, y: b }); eq(x.ok, false, 'refused ' + String(a).slice(0, 8) + ' ' + String(b).slice(0, 8)); eq(!x.empty && String(x.error).length > 10, true, 'message present'); }
for (const [a, b] of V.empty) { const x = E.calc({ x: a, y: b }); eq(x.ok === false && x.empty === true && typeof x.hint === 'string' && x.hint.length > 5, true, 'empty input flagged ' + JSON.stringify([a, b])); }
// the cases in the product brief
eq(K(235, 230, 'V').pct, '+2.173913', '235 against 230'); eq(K(230, 230, 'V').pct, '0', '230 against 230'); eq(K(225, 230, 'V').pct, '-2.173913', '225 against 230'); eq(K(235, 230, 'V').big, '\u2248 +2.173913%', '235 big'); eq(K(225, 230, 'V').big, '\u2248 -2.173913%', '225 big');
eq(K('9.8', 10, 'kW').big, '-2%', '9.8 kW against 10 kW'); eq(K(-9, -10, 'V').big, '+10%', 'negative reference: reading above the reference is positive'); eq(K(-11, -10, 'V').big, '-10%', 'negative reference: reading below'); eq(K(5, 0).ok, false, 'reference 0');
const b = K(225, 230, 'V');
eq(row(b, /^Signed error/)[1], '-5 V', 'signed error'); eq(row(b, /^Absolute error/)[1], '5 V', 'absolute error'); eq(row(b, /^Correction/)[1], '+5 V', 'correction'); eq(row(b, /^Measurement direction/)[1], 'Below reference', 'direction');
eq(row(K(235, 230, 'V'), /^Signed error/)[1], '+5 V', 'positive signed error has a plus'); eq(row(K(235, 230, 'V'), /^Correction/)[1], '-5 V', 'correction of a high reading'); eq(row(K(230, 230, 'V'), /^Signed error/)[1], '0 V', 'zero has no sign');
eq(b.sentence, 'An observed value of 225 V against a reference of 230 V has a signed deviation of \u2248 -2.173913% (below the reference)', 'sentence'); eq(K(100, 100, 'V').sentence, 'An observed value of 100 V equals the reference 100 V (signed deviation 0%)', 'equal sentence');
eq(b.formula, 'Signed deviation = (Observed \u2212 Reference) \u00f7 Reference \u00d7 100', 'formula'); eq(K(-9, -10).formula, 'Signed deviation = (Observed \u2212 Reference) \u00f7 |Reference| \u00d7 100', 'formula, negative reference');
eq(K(225, 230, '%').rows[2][1], '-5%', 'percent unit has no space'); eq(K(225, 230, '').rows[3][1], '5', 'no unit'); eq(K(225, 230, 'V').num, K(225, 230, 'mA').num, 'the unit never changes the number'); eq(K(1, 2, '<b>').ok, false, 'markup in the unit refused'); eq(K(1, 2, 'x'.repeat(17)).ok, false, '17-character unit refused');
eq(E.calc(null).ok, false, 'null input'); eq(K(1, 1, undefined, 13).ok, false, 'too many places refused'); eq(K(-10, -9).warnings.length, 1, 'negative reference explained'); eq(K(-5, 5).warnings.length, 1, 'opposite signs explained'); eq(K(1, 3, '', 2).warnings.length, 0, 'no warning for an ordinary case');
// properties on exact arithmetic: swapping the two values flips the sign and keeps the error; the sign follows the error
let s = 4410099; const rnd = (m) => { s = (s * 1103515245 + 12345) % 2147483648; return s % m; };
const dec = () => (rnd(5) === 0 ? '-' : '') + (1 + rnd(99999)) + (rnd(2) ? '.' + (rnd(9999) + '').padStart(4, '0') : '');
for (let i = 0; i < 600; i++) {
  const o = dec(), r = dec(), x = E.calc({ x: o, y: r }), y = E.calc({ x: r, y: o });
  eq(x.ok && y.ok, true, 'both accepted ' + o + ' ' + r); if (!x.ok || !y.ok) continue;
  eq(x.abs, y.abs, 'swapping keeps the absolute error ' + o + ' ' + r); eq(x.dir === 'above' ? y.dir === 'below' : x.dir === 'below' ? y.dir === 'above' : y.dir === 'equal', true, 'swapping flips the direction ' + o + ' ' + r);
  const flip = (t) => (t === '0' ? '0' : t[0] === '-' ? '+' + t.slice(1) : '-' + t.slice(1));
  eq(x.correction, flip(x.signed), 'correction is the signed error with the opposite sign ' + o + ' ' + r); eq(y.signed, flip(x.signed), 'swapping flips the signed error ' + o + ' ' + r);
}
// the built page
const h = fs.readFileSync(path.join(root, 'calculators/signed-error-analysis/index.html'), 'utf8');
for (const id of ['ns', 'ns-x', 'ns-y', 'ns-u', 'ns-pl', 'ns-err', 'ns-out', 'ns-steps', 'ns-hist', 'ns-note', 'ns-q', 'rp-card']) eq((h.match(new RegExp('id="' + id + '"', 'g')) || []).length, 1, 'one #' + id);
for (const src of ['percent_engine.js', 'percent_error_engine.js', 'pe_engine.js', 'pe_signed_engine.js', 'pe_signed_client.js']) eq(h.indexOf(fs.readFileSync(path.join(root, 'tools', src), 'utf8')) >= 0, true, src + ' is inlined unchanged');
eq(/<(script|link|img)[^>]+(src|href)="https?:/.test(h.replace(/<a [^>]*>/g, '')), false, 'no remote resource'); eq(/<h1>Signed Error Calculator<\/h1>/.test(h), true, 'h1'); eq(/bcd-converter|BCD/.test(h), false, 'no leftover BCD page text');
eq(/<title>Signed Error Calculator \|/.test(h), true, 'title'); eq(/Mode 02 \u00b7 Signed Error Analysis/.test(h) && /aria-current="page"/.test(h), true, 'mode strip marks Mode 02');
const m = /<meta name="description" content="([^"]*)"/.exec(h); eq(!!m && m[1].length <= 160 && m[1].length >= 100, true, 'description length');
const hrefs = [...h.matchAll(/class="chip[^"]*" href="\.\.\/([^/"]+)\//g)].map((q) => q[1]); for (const d of hrefs) eq(fs.existsSync(path.join(root, 'calculators', d, 'index.html')), true, 'linked page exists: ' + d);
const h1 = fs.readFileSync(path.join(root, 'calculators/percent-error-calculator/index.html'), 'utf8'); eq(/href="\.\.\/signed-error-analysis\/"/.test(h1), true, 'Mode 01 links to Mode 02'); eq(/href="\.\.\/percent-error-calculator\/"/.test(h), true, 'Mode 02 links to Mode 01');
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
