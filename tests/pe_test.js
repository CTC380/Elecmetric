/* Tests for tools/pe_engine.js (Elecmetric Percent Error Calculator, Mode 01, Absolute Percent Error) against tests/pe_vectors.json (independent:
   gen_pe_vectors.py, Python fractions.Fraction and decimal.Decimal), the cases in the product brief, and exact properties on BigInt arithmetic.
   Also static checks of the built page calculators/percent-error-calculator/index.html: containers the script reads, engines inlined and equal to source,
   no remote resource, and a mode strip that links only to pages that exist. */
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
const E = require('../tools/pe_engine.js'), V = require('./pe_vectors.json'), M4 = require('../tools/percent_error_engine.js');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 15) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': ' + a + ' vs ' + b); };
const K = (o, r, u, p) => E.calc({ x: String(o), y: String(r), unit: u === undefined ? '' : u, places: p === undefined ? 'auto' : p });
const row = (x, re) => x.rows.find((q) => re.test(q[0]));
// independent vectors
for (const [o, r, places, num, den, text, exact, dir, signed, abs, rel] of V.calc) {
  const t = '[' + String(o).slice(0, 12) + ' vs ' + String(r).slice(0, 12) + ' @' + places + ']', x = E.calc({ x: o, y: r, places });
  eq(x.ok, true, 'accepted ' + t); if (!x.ok) continue;
  eq(x.num, num, 'numerator ' + t); eq(x.den, den, 'denominator ' + t); eq(x.text, text, 'text ' + t); eq(x.exact, exact, 'exactness ' + t); eq(x.dir, dir, 'direction ' + t);
  eq(x.signed, signed, 'signed error ' + t); eq(x.abs, abs, 'absolute error ' + t); eq(x.rel, rel, 'relative error magnitude ' + t);
  eq(x.big, (exact ? '' : '\u2248 ') + text + '%', 'big ' + t); eq(BigInt(x.den) > 0n, true, 'positive denominator ' + t);
  eq(Array.isArray(x.steps) && x.steps.length >= 4 && x.steps.every((s) => typeof s === 'string' && s.length > 8), true, 'working present ' + t);
  eq(x.rows.length >= 7 && x.rows.every((q) => q.length === 3), true, 'result rows ' + t);
  eq(/undefined|NaN|\[object|@/.test(JSON.stringify([x.steps, x.rows, x.formula, x.subst, x.sentence, x.big])), false, 'no undefined, NaN or placeholder text ' + t);
  eq(/measured/i.test(x.sentence + x.formula + x.subst) && !/observed/i.test(x.sentence), false, 'observed wording ' + t);
}
for (const [a, b] of V.zero) { const x = E.calc({ x: a, y: b }); eq(x.ok, false, 'zero reference refused ' + a + ' ' + b); eq(/reference value is 0/.test(x.error), true, 'zero reference message'); }
for (const [a, b] of V.bad) { const x = E.calc({ x: a, y: b }); eq(x.ok, false, 'refused ' + String(a).slice(0, 8) + ' ' + String(b).slice(0, 8)); eq(!x.empty && String(x.error).length > 10, true, 'message present'); }
for (const [a, b] of V.empty) { const x = E.calc({ x: a, y: b }); eq(x.ok === false && x.empty === true && typeof x.hint === 'string' && x.hint.length > 5, true, 'empty input flagged with a hint ' + JSON.stringify([a, b])); }
// the cases in the product brief
eq(K(225, 230, 'V').text, '2.173913', '225 against 230'); eq(K(225, 230, 'V').big, '\u2248 2.173913%', '225 against 230 big'); eq(K(235, 230, 'V').text, '2.173913', '235 against 230'); eq(K(100, 100).big, '0%', 'no error'); eq(K(7, 9).text, '22.222222', '7 against 9');
eq(K('56.891', '62.327', '', 3).text, '8.722', '56.891 against 62.327, 3 places'); eq(K('9.8', 10, 'kW').big, '2%', '9.8 kW against 10 kW'); eq(K(-9, -10, 'V').big, '10%', 'negative reference magnitude'); eq(K(5, 0).ok, false, 'reference 0');
const b = K(225, 230, 'V');
eq(row(b, /^Observed value/)[1], '225 V', 'observed with unit'); eq(row(b, /^Reference value/)[1], '230 V', 'reference with unit'); eq(row(b, /^Signed error/)[1], '-5 V', 'signed error'); eq(row(b, /^Absolute error/)[1], '5 V', 'absolute error');
eq(row(b, /^Relative error magnitude/)[1], '\u2248 0.02173913', 'relative error magnitude'); eq(row(b, /^Measurement direction/)[1], 'Below reference', 'direction'); eq(b.sentence, 'An observed value of 225 V against a reference of 230 V is \u2248 2.173913% below the reference', 'sentence');
eq(K(235, 230, 'V').dir, 'above', 'above'); eq(row(K(235, 230, 'V'), /^Signed error/)[1], '5 V', 'positive signed error'); eq(K(100, 100, 'V').sentence, 'An observed value of 100 V equals the reference 100 V (0% error)', 'equal sentence');
eq(K(9.8, 10, 'kW').dir, 'below', '9.8 below 10'); eq(row(K('9.8', 10, 'kW'), /^Signed error/)[1], '-0.2 kW', 'power meter signed error'); eq(row(K('9.8', 10, 'kW'), /^Relative error magnitude/)[1], '0.02', 'power meter relative error');
// units are labels only
eq(K(225, 230, '%').rows[2][1], '-5%', 'percent unit has no space'); eq(K(225, 230, '\u00b0C').rows[2][1], '-5\u00b0C', 'degree unit has no space'); eq(K(225, 230, 'k\u03a9').rows[3][1], '5 k\u03a9', 'kilohm label'); eq(K(225, 230, '').rows[3][1], '5', 'no unit');
eq(K(225, 230, 'V').num, K(225, 230, 'mA').num, 'the unit never changes the number'); eq(K(1, 2, 'x'.repeat(16)).ok, true, '16-character unit'); eq(K(1, 2, 'x'.repeat(17)).ok, false, '17-character unit refused'); eq(K(1, 2, '<b>').ok, false, 'markup in the unit refused'); eq(K(1, 2, 'V\u0007').ok, false, 'control character in the unit refused');
eq(E.calc(null).ok, false, 'null input'); eq(K(1, 1, undefined, 13).ok, false, 'too many places refused'); eq(K(1, 1, '', -1).ok, false, 'negative places refused'); eq(K('1'.repeat(400), 2).ok, true, '400-digit value'); eq(K('1'.repeat(401), 2).ok, false, '401 digits refused');
eq(K(1, 3, '', 2).warnings.length, 0, 'no warning for an ordinary case'); eq(K(-10, -9).warnings.length, 1, 'negative reference explained'); eq(K(-5, 5).warnings.length, 1, 'opposite signs explained'); eq(K(5, -5).warnings.length, 2, 'negative reference and opposite signs explained'); eq(K(500, 5).warnings.length, 1, 'error above 100% explained'); eq(K(0, 50).warnings.length, 1, 'zero observation explained');
// properties on exact arithmetic, and agreement with the Mode 04 engine (separate code path for the same percentage)
let s = 4410021; const rnd = (m) => { s = (s * 1103515245 + 12345) % 2147483648; return s % m; };
const rat = (str) => { const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(str), f = m[3] || '', k = 10n ** BigInt(f.length); return { n: (m[1] ? -1n : 1n) * BigInt(m[2] + f), d: k }; };
const dec = () => (rnd(5) === 0 ? '-' : '') + (1 + rnd(99999)) + (rnd(2) ? '.' + (rnd(9999) + '').padStart(4, '0') : '');
for (let i = 0; i < 600; i++) {
  const o = dec(), r = dec(), x = E.calc({ x: o, y: r }), m4 = M4.calc({ kind: 'err', x: r, y: o });
  eq(x.ok && m4.ok, true, 'both engines accept ' + o + ' ' + r); if (!x.ok || !m4.ok) continue;
  eq(x.num + '/' + x.den, m4.num + '/' + m4.den, 'same percentage as the Percentage Calculator Mode 04 ' + o + ' ' + r);
  const O = rat(o), R = rat(r), e = { n: O.n * R.d - R.n * O.d, d: O.d * R.d }, ae = e.n < 0n ? -e.n : e.n, aR = R.n < 0n ? -R.n : R.n;
  eq(BigInt(x.num) * (e.d * aR) === 100n * ae * BigInt(x.den) * R.d, true, 'percentage = 100 |O - R| / |R| exactly ' + o + ' ' + r);
  eq(x.dir, e.n > 0n ? 'above' : e.n < 0n ? 'below' : 'equal', 'direction from the sign of the error ' + o + ' ' + r);
}
// the built page
const f = path.join(root, 'calculators/percent-error-calculator/index.html'), h = fs.readFileSync(f, 'utf8');
for (const id of ['ns', 'ns-x', 'ns-y', 'ns-u', 'ns-pl', 'ns-err', 'ns-out', 'ns-steps', 'ns-hist', 'ns-note', 'ns-q', 'rp-card']) eq((h.match(new RegExp('id="' + id + '"', 'g')) || []).length, 1, 'one #' + id);
for (const src of ['percent_engine.js', 'percent_error_engine.js', 'pe_engine.js', 'pe_client.js']) eq(h.indexOf(fs.readFileSync(path.join(root, 'tools', src), 'utf8')) >= 0, true, src + ' is inlined unchanged');
eq(/<(script|link|img)[^>]+(src|href)="https?:/.test(h.replace(/<a [^>]*>/g, '')), false, 'no remote resource'); eq(/<h1>Percent Error Calculator<\/h1>/.test(h), true, 'h1'); eq(/bcd-converter|BCD/.test(h), false, 'no leftover BCD page text');
eq(/<title>Percent Error Calculator \|/.test(h), true, 'title'); eq(/Mode 01 \u00b7 Absolute Percent Error/.test(h) && /aria-current="page"/.test(h), true, 'mode strip marks Mode 01');
const hrefs = [...h.matchAll(/class="chip[^"]*" href="\.\.\/([^/"]+)\//g)].map((m) => m[1]); for (const d of hrefs) eq(fs.existsSync(path.join(root, 'calculators', d, 'index.html')), true, 'linked page exists: ' + d);
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
