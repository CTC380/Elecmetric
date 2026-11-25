/* Tests for tools/nthroot_engine.js (Root Calculator, Mode 03, General nth Root Calculator) against tests/nthroot_vectors.json (independent: gen_nthroot_vectors.py, sympy factorint
   and sp.root for the exact form, mpmath and Python decimal for the decimal, sympy integer_nthroot for perfect powers) and the fixed cases from the Root Calculator CEO decision note. */
const N = require('../tools/nthroot_engine.js'), V = require('./nthroot_vectors.json'), fs = require('fs'), path = require('path');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 20) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const S = (radicand, index, places) => N.solve({ radicand, index, places });
const clean = (r) => !/undefined|NaN|\[object|null/.test(JSON.stringify([r.steps, r.rows, r.sentence, r.summary, r.verify, r.title, r.exact, r.decimal, r.warnings, r.notes]));
const SUPM = { '⁰': 0, '¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9 };
const RX = /^(-?)(\d*)·?(?:([√∛])|([⁰¹²³⁴⁵⁶⁷⁸⁹]+)√)(\d+)(?:\/(\d+))?$/;
for (const [t, k, p, exact, perfect, decimal, floor, radicand, red] of V.solve) {
  const tag = '[' + t.slice(0, 40) + ' k=' + k + ' @' + p + ']', r = S(t, k, p);
  if (!r.ok) { bad(tag + ' rejected: ' + r.error); continue; }
  eq(r.exact, exact, 'exact ' + tag); eq(r.perfect, perfect, 'perfect power ' + tag); eq(r.irrational, !perfect, 'irrational flag ' + tag);
  eq(r.decimal, decimal, 'decimal ' + tag); eq(r.floor, floor, 'floor of |root| ' + tag); eq(r.radicand, radicand, 'radicand as exact fraction ' + tag); eq(r.index, k, 'index ' + tag);
  eq(r.reduced, red !== '', 'index reduced flag ' + tag); if (red !== '') eq(r.radIndex, Number(red), 'reduced index ' + tag);
  eq(r.verifyOk, true, 'checks ' + tag); eq(r.verify.length >= 4 && r.verify.every((x) => x[1] === true), true, 'every check passed ' + tag);
  eq(Array.isArray(r.steps) && r.steps.length >= 3 && r.steps.every((s) => typeof s === 'string' && s.length > 8), true, 'working ' + tag); eq(clean(r), true, 'no undefined or NaN text ' + tag);
  eq(r.valueText, exact, 'headline value ' + tag); eq(r.negative, radicand.charAt(0) === '-', 'negative flag ' + tag);
  if (!perfect) eq(r.decimalExact, false, 'irrational decimal is never exact ' + tag); else eq(typeof r.decimalExact, 'boolean', 'exact flag ' + tag);
  eq(r.rows.some((x) => x[0] === 'Power-back'), true, 'power-back row ' + tag);
  eq(r.rows.find((x) => x[0] === 'Decimal')[1].indexOf('≈') === 0, !r.decimalExact, 'approximate marker ' + tag);
  eq(/^-/.test(exact), radicand.charAt(0) === '-' && radicand !== '0', 'sign of the exact result ' + tag);
  eq(/^-/.test(r.decimal), radicand.charAt(0) === '-' && /[1-9]/.test(r.decimal), 'sign of the decimal ' + tag);
  // the exact form raised to the index equals the radicand: re-derived from the text with BigInt
  const [rn, rd] = radicand.split('/').map(BigInt), K = BigInt(k), m = RX.exec(exact);
  if (m) {
    const sg = m[1] ? -1n : 1n, a = BigInt(m[2] || '1'), j = m[3] === '√' ? 2 : m[3] === '∛' ? 3 : Number([...m[4]].map((c) => SUPM[c]).join('')), rad = BigInt(m[5]), den = BigInt(m[6] || '1');
    eq(k % j, 0, 'radical index divides the index ' + tag);
    eq(sg ** K * a ** K * rad ** BigInt(k / j) * (rd || 1n) === rn * den ** K, true, 'radical raised to the index is the radicand ' + tag);
  } else { const [en, ed] = exact.split('/').map(BigInt); eq((en ** K) * (rd || 1n) === rn * (ed || 1n) ** K, true, 'rational root raised to the index is the radicand ' + tag); }
}
for (const [t, k, p, truth, exact, neg] of V.tiny) {
  const r = S(t, k, p), tag = '[' + t + ' k=' + k + ']'; if (!r.ok) { bad(tag + ' rejected: ' + r.error); continue; }
  eq(r.exact, exact, 'exact ' + tag); eq(/[1-9]/.test(r.decimal), true, 'a nonzero root is not shown as 0 ' + tag); eq(/^-/.test(r.decimal), neg, 'sign ' + tag);
  const mag = r.decimal.replace(/^-/, ''), sig = mag.replace('.', '').replace(/^0+/, ''); if (r.extended) eq(sig.length >= 10, true, 'extended value shows at least ten significant digits ' + tag + ' ' + r.decimal);
  const dp = (mag.split('.')[1] || '').length, tr = truth.replace('.', '').split('e'), digits = tr[0], ex = parseInt(tr[1], 10);
  const shift = BigInt(dp) + BigInt(ex) - 60n, v = BigInt(digits), sc = shift >= 0n ? v * 10n ** shift : v / 10n ** -shift, rem = shift >= 0n ? 0n : (v % 10n ** -shift) * 2n >= 10n ** -shift ? 1n : 0n;
  const want = String(sc + rem).padStart(dp + 1, '0'), wt = want.slice(0, want.length - dp) + '.' + want.slice(want.length - dp);
  eq(mag, wt, 'tiny decimal correctly rounded ' + tag); eq(r.verifyOk, true, 'checks ' + tag);
}
V.noreal.forEach(([t, k]) => { const r = S(t, k, 8); eq(r.ok, false, 'even root of a negative has no real result [' + t + ' k=' + k + ']'); eq(r.noReal, true, 'noReal flag [' + t + ' k=' + k + ']'); eq(/no real result/.test(r.error), true, 'message [' + t + ' k=' + k + ']'); eq(r.empty === true, false, 'not blank'); if (k === 2) eq(/\bi\b/.test(r.complex || ''), true, 'square root names the complex value [' + t + ']'); });
V.badradicand.forEach((t) => { const r = S(t, 3, 8); eq(r.ok, false, 'must refuse unreadable [' + t.slice(0, 40) + ']'); eq(typeof r.error === 'string' && r.error.length > 5 && r.empty !== true, true, 'message [' + t.slice(0, 40) + ']'); });
V.badindex.forEach((t) => { const r = S('64', t, 8); eq(r.ok, false, 'must refuse index [' + t + ']'); eq(r.badIndex, true, 'badIndex flag [' + t + ']'); eq(typeof r.error === 'string' && r.error.length > 20 && r.empty !== true, true, 'message [' + t + ']'); });
V.empty.forEach((t) => { const r = S(t, 3, 8); eq(r.ok === false && r.empty === true && typeof r.hint === 'string' && r.hint.length > 5, true, 'blank radicand flagged with a hint [' + JSON.stringify(t) + ']'); });
['', '  ', undefined, null].forEach((t) => { const r = S('64', t, 8); eq(r.ok === false && r.empty === true && /index/.test(r.hint), true, 'blank index flagged with a hint [' + JSON.stringify(t) + ']'); });
eq(S(undefined, 3).empty, true, 'undefined radicand is blank'); eq(S(null, 3).empty, true, 'null radicand is blank');
// index messages
eq(/undefined/.test(S('64', 0).error), true, 'index 0 is undefined'); eq(/reciprocal/.test(S('64', -2).error), true, 'negative index explained'); eq(/Exponents Calculator/.test(S('64', '2.5').error), true, 'fractional index pointed to exponents'); eq(/1000/.test(S('64', 1001).error), true, 'limit named');
eq(S('64', 1000).ok, true, 'index 1000 accepted'); eq(S('64', '+3').exact, '4', 'a plus sign on the index is read'); eq(S('64', ' 3 ').exact, '4', 'spaces around the index are ignored'); eq(S('64', '03').exact, '4', 'leading zero');
// the CEO note, by exact text
const note = [['144', 2, '12'], ['81', 2, '9'], ['27', 3, '3'], ['-27', 3, '-3'], ['81', 4, '3'], ['32', 5, '2'], ['64', 6, '2'], ['128', 7, '2'], ['256', 8, '2'], ['1024', 10, '2'], ['48', 4, '2·⁴√3'], ['72', 2, '6√2'], ['0.125', 3, '1/2'], ['25', 1, '25'], ['-8', 3, '-2'], ['2', 2, '√2'], ['125', 3, '5'], ['216', 3, '6'], ['8', 3, '2'], ['64', 3, '4']];
note.forEach(([t, k, e]) => eq(S(t, k).exact, e, 'note case ' + k + '-th root of ' + t));
eq(S('2', 2).decimal, '1.41421356', '√2 to 8 places as in the note'); eq(S('72', 2).decimal, '8.48528137', '√72'); eq(S('0.125', 3).decimal, '0.5', '∛0.125 = 0.5'); eq(S('25', 0).ok, false, 'index 0 is an error as in the note'); eq(S('-9', 2).ok, false, '√(−9) has no real result in real mode'); eq(S('-9', 2).complex, '3 i', 'principal complex root named');
eq(S('-8', 3).title, '∛(−8)', 'title'); eq(S('81', 4).title, '⁴√81', 'title ⁴√81'); eq(S('1024', 10).title, '¹⁰√1024', 'title ¹⁰√1024'); eq(S('25', 1).title, '¹√25', 'title index 1'); eq(S('3/4', 5).title, '⁵√(3/4)', 'title of a fraction'); eq(S('144', 2).title, '√144', 'title √144');
eq(S('9', 4).exact, '√3', '⁴√9 = √3'); eq(S('8', 6).exact, '√2', '⁶√8 = √2'); eq(S('4', 6).exact, '∛2', '⁶√4 = ∛2'); eq(S('16', 8).exact, '√2', '⁸√16 = √2'); eq(S('3/4', 4).exact, '⁴√12/2', '⁴√(3/4)'); eq(S('1/8', 4).exact, '⁴√2/2', '⁴√(1/8)'); eq(S('-96', 5).exact, '-2·⁵√3', '⁵√(−96)');
eq(S('0', 5).exact, '0', 'zero'); eq(S('-0', 5).negative, false, '−0 is not negative'); eq(S('1', 999).exact, '1', '1 to any index'); eq(S('-1', 999).exact, '-1', '−1 to an odd index');
// odd function for odd indices
for (const k of [1, 3, 5, 7, 9, 11, 13, 99, 999]) for (let a = 1; a <= 60; a++) { const x = S(String(a), k), y = S(String(-a), k); eq(y.exact, '-' + x.exact, 'odd function ' + a + ' k=' + k); eq(y.decimal, '-' + x.decimal, 'odd function decimal ' + a + ' k=' + k); }
// places
eq(S('2', 2, 0).decimal, '1', '0 places'); eq(S('3', 2, 0).decimal, '2', '0 places rounds half up (1.73 -> 2)'); eq(S('-4', 3, 0).decimal, '-2', '0 places negative (−1.587 -> −2)'); eq(S('2', 2, 50).decimal.length, 52, '50 places');
eq(S('2', 2, 51).ok, false, '51 places refused'); eq(S('2', 2, -1).ok, false, 'negative places refused'); eq(S('2', 2, 2.5).ok, false, 'fractional places refused'); eq(S('2', 2, 'abc').ok, false, 'text places refused'); eq(S('2', 2, '3').decimal, '1.414', 'places as text'); eq(S('2', 2, '').decimal, '1.41421356', 'blank places means 8'); eq(S('2', 2, 'auto').decimal, '1.41421356', 'auto places means 8');
eq(S('2', 2, 50).decimal, '1.41421356237309504880168872420969807856967187537695', '√2 to 50 places (1.41421356237309504880168872420969807856967187537694807…, rounded up)'); eq(S('2', 5, 12).decimal, '1.148698354997', '⁵√2 to 12 places'); eq(S('10', 12, 8).decimal, '1.21152766', '¹²√10 (E12 step)'); eq(S('10', 24, 6).decimal, '1.100694', '²⁴√10 (E24 step)'); eq(S('10', 20, 6).decimal, '1.122018', '²⁰√10 (1 dB)');
// big and extreme inputs
eq(S('1' + '0'.repeat(58), 2).exact, '1' + '0'.repeat(29), '10^58 square root'); eq(S('1' + '0'.repeat(41), 5).exact, '1' + '0'.repeat(8) + '·⁵√10', '10^41 fifth root: (10^8)^5 × 10'); eq(S('1'.repeat(61), 2).ok, false, '61 digits refused'); eq(S('1'.repeat(60), 7).ok, true, '60 digits accepted');
eq(S('-1' + '0'.repeat(42), 7).exact, '-1' + '0'.repeat(6), '−10^42 seventh root'); eq(S('-1' + '0'.repeat(42), 6).ok, false, 'even root of a negative big number');
const p1 = S(String(1000003n ** 5n), 5); eq(p1.exact, '1000003', 'a fifth power of a prime above the trial limit is found by the integer root'); eq(p1.perfect && p1.full, true, 'and counts as fully factored');
const p2 = S(String(1000003n ** 4n), 8); eq(p2.exact, '√1000003', '(10^6+3)^4 to the eighth root: index lowered, prime above the trial limit proven prime'); eq(p2.full, true, 'fully factored');
const semi = S(String(1000003n * 1000033n * 1000037n), 3); eq(semi.ok && semi.verifyOk, true, 'three primes above the trial limit: still correct'); eq(semi.full, false, 'not fully factored is reported'); eq(/too large to factor completely/.test(semi.warnings[0]), true, 'warning about the factoring limit');
const unf = S(String(10000019n * 10000079n * 243n), 5); eq(unf.exact, '3·⁵√' + (10000019n * 10000079n), 'a factor 3⁵ taken out of a semiprime with two 8-digit primes'); eq(unf.verifyOk, true, 'checks for the unfactored input');
const t0 = Date.now(), slow = S('1' + '7'.repeat(59), 1000, 50); eq(slow.ok && slow.verifyOk, true, 'index 1000, 60 digits, 50 places'); eq(Date.now() - t0 < 5000, true, 'index 1000 with 50 places runs in under 5 seconds (took ' + (Date.now() - t0) + ' ms)');
// iroot
for (let k = 1; k <= 24; k++) for (let x = 0n; x <= 40n; x++) { const K = BigInt(k), v = x ** K; eq(N.iroot(v, k), x, 'iroot of a power ' + x + '^' + k); if (v > 0n) eq(N.iroot(v - 1n, k), x - 1n, 'iroot just below ' + x + '^' + k); if (k > 1 && x > 0n) eq(N.iroot(v + 1n, k), x, 'iroot just above ' + x + '^' + k); }
for (const [k, e] of [[2, 100], [3, 99], [5, 100], [7, 140], [13, 130], [100, 400], [999, 2997], [1000, 3000]]) { const x = 10n ** BigInt(Math.floor(e / k)) + 12345n, K = BigInt(k); eq(N.iroot(x ** K, k), x, 'iroot big ' + k); eq(N.iroot(x ** K - 1n, k), x - 1n, 'iroot big below ' + k); }
let seed = 12345n; const rnd = () => { seed = (seed * 6364136223846793005n + 1442695040888963407n) % (1n << 64n); return seed; };
for (let i = 0; i < 300; i++) { const k = 2 + Number(rnd() % 60n), x = (rnd() * rnd() * rnd()) % (10n ** 60n) + 1n, r = N.iroot(x, k), K = BigInt(k); eq(r ** K <= x && (r + 1n) ** K > x, true, 'iroot property k=' + k + ' x=' + x); }
// factoring
eq(N.factorAtoms(72n).atoms.map((x) => x[0] + '^' + x[1]).join(' '), '2^3 3^2', 'factorAtoms 72'); eq(N.factorAtoms(1n).atoms.length, 0, 'factorAtoms 1');
eq(N.radText({ n: 2n, d: 1n }, 3n, 4), '2·⁴√3', 'radText'); eq(N.radText({ n: 1n, d: 2n }, 4n, 3), '∛4/2', 'radText fraction'); eq(N.radText({ n: 6n, d: 1n }, 1n, 2), '6', 'radText no root');
// Newton table
const e = S('48', 4).estimate; eq(e.length, 6, 'six Newton rows'); eq(e[0].guess, '3.0000000000', 'Newton start'); eq(e[5].guess, '2.6321480259', 'Newton converges to ⁴√48'); eq(e[0].power, '81.0000000000', 'g^4 at the start');
eq(S('48', 13).estimate.length, 0, 'no Newton rows above index 12'); eq(S('0', 4).estimate.length, 0, 'no Newton rows for 0'); eq(S('-32', 5).estimate[0].guess, '3.0000000000', 'negative: estimate for |x|'); eq(S('25', 1).estimate.length, 0, 'no Newton rows for index 1'); eq(S('1e60', 2).estimate.length, 6, 'big value Newton table');
// working text
const w48 = S('48', 4).steps.join('\n'); ['2⁴ × 3', '2·⁴√3', 'irrational', '2.63214803', 'fourth root'].forEach((s) => eq(w48.indexOf(s) >= 0, true, 'working for ⁴√48 has ' + s));
const wm = S('-32', 5).steps.join('\n'); ['negative', 'odd', '= -2'].forEach((s) => eq(wm.indexOf(s) >= 0, true, 'working for ⁵√(−32) has ' + s));
const w9 = S('9', 4).steps.join('\n'); eq(/falls from 4 to 2/.test(w9), true, 'working for ⁴√9 lowers the index');
const wf = S('3/4', 4).steps.join('\n'); ['Numerator', 'Denominator', 'denominator', '⁴√12/2'].forEach((s) => eq(wf.indexOf(s) >= 0, true, 'working for ⁴√(3/4) has ' + s));
eq(/first root of a number is the number itself/.test(S('25', 1).steps.join(' ')), true, 'working for index 1');
// summary and notes
eq(S('81', 4).summary.split('\n')[1], '⁴√81 = 3', 'summary line'); eq(S('-32', 5).summary.split('\n')[1], '⁵√(−32) = −2', 'summary line, negative, with the true minus sign'); eq(/Irrational: yes/.test(S('2', 5).summary), true, 'summary says irrational'); eq(/Perfect 4th power: yes/.test(S('81', 4).summary), true, 'summary says perfect 4th power'); eq(/Perfect cube: yes/.test(S('27', 3).summary), true, 'summary says perfect cube');
eq(/complex/.test(S('-8', 3).notes.join(' ')), true, 'note about complex roots');
// the built page
const dir = path.join(__dirname, '..', 'calculators');
const html = fs.readFileSync(path.join(dir, 'nth-root-calculator', 'index.html'), 'utf8');
['<h1>nth Root Calculator</h1>', 'id="ns-r"', 'id="ns-k"', 'id="ns-pl"', 'id="ns-disp"', 'Mode 03', 'href="../square-root-calculator/"', 'href="../cube-root-calculator/"', 'Root Simplification (coming)', 'Engineering Root Calculator (coming)', 'aria-current="page"', 'nth Root Calculator | Any Index'].forEach((s) => eq(html.indexOf(s) >= 0, true, 'page has ' + s));
eq(/href="\.\.\/(radical|engineering)/.test(html), false, 'no link to a mode that is not built');
eq(html.indexOf('2·⁴√3') >= 0 && html.indexOf('1.41421356') >= 0 && html.indexOf('1.122018') >= 0 && html.indexOf('1.100694') >= 0 && html.indexOf('50 Ω') >= 0, true, 'page examples computed by the engine');
eq((html.match(/<h1/g) || []).length, 1, 'one h1');
['square-root-calculator', 'cube-root-calculator'].forEach((d) => { const h = fs.readFileSync(path.join(dir, d, 'index.html'), 'utf8'); eq(h.indexOf('href="../nth-root-calculator/"') >= 0 && h.indexOf('General nth Root Calculator (coming)') < 0, true, d + ' links to Mode 03'); });
console.log('nthroot_test: ' + n + ' checks, ' + fail + ' failures'); process.exit(fail ? 1 : 0);
