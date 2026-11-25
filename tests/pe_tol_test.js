/* Tests for tools/pe_tol_engine.js (Elecmetric Percent Error Calculator, Mode 03, Tolerance Verification) against tests/pe_tol_vectors.json (independent:
   gen_pe_tol_vectors.py, Python fractions.Fraction and decimal.Decimal), the cases in the product brief, and exact properties on BigInt arithmetic.
   Also checks that Mode 03 agrees with Mode 02 on the signed deviation, and static checks of the built page calculators/tolerance-verification/index.html. */
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
const E = require('../tools/pe_tol_engine.js'), M2 = require('../tools/pe_signed_engine.js'), V = require('./pe_tol_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 15) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': ' + a + ' vs ' + b); };
const inp = (o, r, basis, shape, t, tl, tu, places, unit) => ({ x: o, y: r, basis, shape, t, tl, tu, places, unit });
const K = (o, r, t, extra) => E.calc(Object.assign({ x: String(o), y: String(r), t: String(t), unit: '' }, extra || {}));
const row = (x, re) => x.rows.find((q) => re.test(q[0]));
for (const [o, r, basis, shape, t, tl, tu, places, lower, upper, status, on, signed, mL, mU, near, used, dev] of V.calc) {
  const tag = '[' + String(o).slice(0, 12) + ' vs ' + String(r).slice(0, 12) + ' ' + basis + ' ' + shape + ' ' + (shape === 'sym' ? t : tl + '/' + tu) + ' @' + places + ']', x = E.calc(inp(o, r, basis, shape, t, tl, tu, places));
  eq(x.ok, true, 'accepted ' + tag); if (!x.ok) continue;
  eq(x.lower, lower, 'lower limit ' + tag); eq(x.upper, upper, 'upper limit ' + tag); eq(x.status, status, 'status ' + tag); eq(x.pass, status === 'within', 'pass flag ' + tag); eq(x.onLimit, on, 'on a limit ' + tag);
  eq(x.signed, signed, 'signed error ' + tag); eq(x.marginLower, mL, 'margin to lower limit ' + tag); eq(x.marginUpper, mU, 'margin to upper limit ' + tag); eq(x.nearest, near, 'nearest margin ' + tag);
  eq(x.used, used, 'tolerance used ' + tag); eq(x.dev, dev, 'measured deviation ' + tag);
  eq(row(x, /^Lower limit/)[1], lower, 'lower limit row ' + tag); eq(row(x, /^Upper limit/)[1], upper, 'upper limit row ' + tag);
  eq(row(x, /^Permitted range/)[1], lower + ' to ' + upper, 'range row ' + tag);
  eq(x.big, status === 'within' ? 'Within the entered tolerance' + (on ? ' (on a limit)' : '') : 'Outside the entered tolerance: ' + status + ' the ' + (status === 'above' ? 'upper' : 'lower') + ' limit', 'assessment ' + tag);
  eq(Array.isArray(x.steps) && x.steps.length === 6 && x.steps.every((s) => typeof s === 'string' && s.length > 8), true, 'working present ' + tag);
  eq(x.rows.length >= 15 && x.rows.every((q) => q.length === 3), true, 'result rows ' + tag);
  eq(/undefined|NaN|\[object|@/.test(JSON.stringify([x.steps, x.rows, x.formula, x.subst, x.sentence, x.big, x.warnings])), false, 'no undefined, NaN or placeholder text ' + tag);
  eq(/complian|certif|approved/i.test(JSON.stringify([x.steps, x.rows, x.sentence, x.big])), false, 'never claims compliance ' + tag);
  if (dev !== null) { const m = M2.calc({ x: o, y: r, places }); eq(m.ok && m.big === x.dev && m.pct === x.devPct && m.frac === x.devFrac, true, 'agrees with Mode 02 on the deviation ' + tag); }
  else eq(row(x, /^Measured deviation/)[1], 'Not defined', 'no percentage when the reference is 0 ' + tag);
}
for (const [a, b, basis, shape, t, tl, tu] of V.zero) { const x = E.calc(inp(a, b, basis, shape, t, tl, tu)); eq(x.ok, false, 'zero reference refused for a percentage tolerance ' + a + ' ' + b); eq(/reference value is 0/.test(x.error), true, 'zero reference message'); }
for (const [a, b, basis, shape, t, tl, tu] of V.bad) { const x = E.calc(inp(a, b, basis, shape, t, tl, tu)); eq(x.ok, false, 'refused ' + String(a).slice(0, 8) + ' ' + String(b).slice(0, 8) + ' ' + t + tl + tu); eq(!x.empty && String(x.error).length > 10, true, 'message present'); }
for (const [a, b, basis, shape, t, tl, tu] of V.empty) { const x = E.calc(inp(a, b, basis, shape, t, tl, tu)); eq(x.ok === false && x.empty === true && typeof x.hint === 'string' && x.hint.length > 5, true, 'empty input flagged ' + JSON.stringify([a, b, t, tl, tu])); }
// the cases in the product brief: 225 V against 230 V with 5%
const b = K(225, 230, 5, { unit: 'V' });
eq(b.lower, '218.5', 'lower limit 218.5'); eq(b.upper, '241.5', 'upper limit 241.5'); eq(b.pass, true, '225 V is within 5% of 230 V'); eq(b.big, 'Within the entered tolerance', 'assessment');
eq(row(b, /^Permitted range/)[1], '218.5 V to 241.5 V', 'range'); eq(b.dev, '\u2248 -2.173913%', 'measured deviation'); eq(row(b, /^Permitted deviation/)[1], '\u00b15% of the reference', 'permitted deviation'); eq(row(b, /^Signed error/)[1], '-5 V', 'signed error');
eq(row(b, /^Margin to lower/)[1], '+6.5 V', 'margin to the lower limit'); eq(row(b, /^Margin to upper/)[1], '+16.5 V', 'margin to the upper limit'); eq(row(b, /^Nearest/)[1], 'Lower limit, margin +6.5 V', 'nearest limit'); eq(row(b, /^Tolerance used/)[1], '\u2248 43.478261%', 'tolerance used');
eq(b.formula, 'Limits = Reference \u00b1 Reference \u00d7 Tolerance% \u00f7 100', 'formula'); eq(b.subst, '230 \u00b1 230 \u00d7 5 \u00f7 100 = 218.5 V to 241.5 V; 225 is inside', 'substituted');
eq(b.sentence, 'An observed value of 225 V against a reference of 230 V with an entered tolerance of \u00b15% (permitted range 218.5 V to 241.5 V) is within the entered tolerance', 'sentence');
// boundaries: limits are included, and the smallest step beyond a limit fails
eq(K(241.5, 230, 5).pass, true, 'on the upper limit'); eq(K(241.5, 230, 5).onLimit, true, 'on a limit flagged'); eq(K(218.5, 230, 5).pass, true, 'on the lower limit'); eq(K('241.500001', 230, 5).pass, false, 'just above'); eq(K('218.499999', 230, 5).pass, false, 'just below');
eq(K(242, 230, 5).big, 'Outside the entered tolerance: above the upper limit', 'above'); eq(row(K(242, 230, 5, { unit: 'V' }), /^Margin to upper/)[1], '-0.5 V', 'beyond the upper limit is a negative margin'); eq(row(K(242, 230, 5), /^Tolerance used/)[1], '\u2248 104.347826%', 'over 100% used');
eq(K('9.87', 10, 1, { unit: 'k\u03a9' }).sentence.endsWith(' is outside the entered tolerance: 0.03 k\u03a9 below the lower limit 9.9 k\u03a9'), true, 'resistor sentence');
eq(K('9.8', 10, '0.5', { basis: 'abs', unit: 'kW' }).pass, true, 'absolute tolerance'); eq(row(K('9.8', 10, '0.5', { basis: 'abs', unit: 'kW' }), /^Permitted deviation/)[1], '\u00b15% of the reference', 'absolute tolerance as a percentage of the reference');
eq(K(255, 230, '', { shape: 'asym', tl: '6', tu: '10' }).status, 'above', 'asymmetric'); eq(K(255, 230, '', { shape: 'asym', tl: '6', tu: '10' }).range, '216.2 to 253', 'asymmetric range');
eq(K('0.2', 0, '0.5', { basis: 'abs', unit: 'V' }).pass, true, 'reference 0 with an absolute tolerance'); eq(K(1, 0, 5).ok, false, 'reference 0 with a percentage tolerance'); eq(K('5%', 10, 5).ok, false, 'a % sign is not accepted on the observed value'); eq(K(5, 10, '5%').ok, true, 'a % sign is accepted on a percentage tolerance'); eq(K(5, 10, '5%', { basis: 'abs' }).ok, false, 'a % sign is refused on an absolute tolerance');
eq(K(1, 1, 0).pass, true, 'zero tolerance, equal values'); eq(K(1, 1, 0).warnings.length, 1, 'zero tolerance explained'); eq(K('1.0001', 1, 0).pass, false, 'zero tolerance, unequal values'); eq(row(K('1.0001', 1, 0), /^Tolerance used/)[1], 'Not defined', 'no tolerance used on a zero side');
eq(K(1, 2, 150).warnings.some((w) => /crosses zero/.test(w)), true, 'range across zero explained'); eq(K(5, 10, 5).warnings.length, 0, 'no warning for an ordinary case'); eq(K(-9, -10, 20).warnings.length, 1, 'negative reference explained');
eq(K(225, 230, 5, { unit: 'V' }).used.length > 0, true, 'used present'); eq(K(225, 230, 5, { unit: 'V' }).lower, K(225, 230, 5, { unit: 'mA' }).lower, 'the unit never changes the number'); eq(K(1, 2, 5, { unit: '<b>' }).ok, false, 'markup in the unit refused'); eq(K(1, 2, 5, { unit: 'x'.repeat(17) }).ok, false, '17-character unit refused');
eq(E.calc(null).ok, false, 'null input'); eq(K(1, 1, 5, { places: 13 }).ok, false, 'too many places refused'); eq(K(1, 1, 5, { places: -1 }).ok, false, 'negative places refused');
// properties on exact arithmetic: swapping the signed error flips the side, the accepted band is centred on the reference, and it widens with the tolerance
let s = 4410123; const rnd = (m) => { s = (s * 1103515245 + 12345) % 2147483648; return s % m; };
const dec = () => (rnd(5) === 0 ? '-' : '') + (1 + rnd(99999)) + (rnd(2) ? '.' + (rnd(9999) + '').padStart(4, '0') : '');
for (let i = 0; i < 600; i++) {
  const o = dec(), r = dec(), t = String(rnd(40)), a = E.calc({ x: o, y: r, t }), w = E.calc({ x: o, y: r, t: String(+t + 5) });
  eq(a.ok && w.ok, true, 'both accepted ' + o + ' ' + r); if (!a.ok || !w.ok) continue;
  const m = M2.calc({ x: o, y: r }); eq(m.big === a.dev && m.signed === a.signed, true, 'same deviation and signed error as Mode 02 ' + o + ' ' + r);
  eq(a.pass === (a.status === 'within'), true, 'pass follows the status ' + o + ' ' + r); if (a.pass) eq(w.pass, true, 'a wider tolerance keeps a pass ' + o + ' ' + r);
  eq(a.marginLower.charAt(0) === '-' || a.marginUpper.charAt(0) === '-', !a.pass, 'a negative margin means outside ' + o + ' ' + r);
  const sym = E.calc({ x: o, y: r, shape: 'asym', tl: t, tu: t }); eq(sym.lower + '|' + sym.upper + '|' + sym.status, a.lower + '|' + a.upper + '|' + a.status, 'equal lower and upper tolerances give the symmetrical result ' + o + ' ' + r);
  const ab = E.calc({ x: o, y: r, basis: 'abs', t: a.tolUpper }); eq(ab.lower + '|' + ab.upper + '|' + ab.status, a.lower + '|' + a.upper + '|' + a.status, 'the same tolerance entered as a value gives the same limits ' + o + ' ' + r);
}
// the built page
const h = fs.readFileSync(path.join(root, 'calculators/tolerance-verification/index.html'), 'utf8');
for (const id of ['ns', 'ns-x', 'ns-y', 'ns-u', 'ns-pl', 'ns-basis', 'ns-shape', 'ns-t', 'ns-tl', 'ns-tu', 'ns-err', 'ns-out', 'ns-steps', 'ns-hist', 'ns-note', 'ns-q', 'rp-card']) eq((h.match(new RegExp('id="' + id + '"', 'g')) || []).length, 1, 'one #' + id);
for (const src of ['percent_engine.js', 'percent_error_engine.js', 'pe_engine.js', 'pe_signed_engine.js', 'pe_tol_engine.js', 'pe_tol_client.js']) eq(h.indexOf(fs.readFileSync(path.join(root, 'tools', src), 'utf8')) >= 0, true, src + ' is inlined unchanged');
eq(/<(script|link|img)[^>]+(src|href)="https?:/.test(h.replace(/<a [^>]*>/g, '')), false, 'no remote resource'); eq(/<h1>Tolerance Verification Calculator<\/h1>/.test(h), true, 'h1'); eq(/bcd-converter|BCD/.test(h), false, 'no leftover BCD page text');
eq(/<title>Tolerance Verification Calculator \|/.test(h), true, 'title'); eq(/Mode 03 \u00b7 Tolerance Verification/.test(h) && /aria-current="page"/.test(h), true, 'mode strip marks Mode 03');
const m = /<meta name="description" content="([^"]*)"/.exec(h); eq(!!m && m[1].length <= 160 && m[1].length >= 100, true, 'description length');
const hrefs = [...h.matchAll(/class="chip[^"]*" href="\.\.\/([^/"]+)\//g)].map((q) => q[1]); for (const d of hrefs) eq(fs.existsSync(path.join(root, 'calculators', d, 'index.html')), true, 'linked page exists: ' + d);
eq(/not a regulatory|does not know|no standard/i.test(h), true, 'page says the tolerance is user-entered and not a standard');
for (const d of ['percent-error-calculator', 'signed-error-analysis']) eq(/href="\.\.\/tolerance-verification\/"/.test(fs.readFileSync(path.join(root, 'calculators', d, 'index.html'), 'utf8')), true, 'Mode ' + d + ' links to Mode 03');
eq(/href="\.\.\/signed-error-analysis\/"/.test(h) && /href="\.\.\/percent-error-calculator\/"/.test(h), true, 'Mode 03 links to Modes 01 and 02');
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
