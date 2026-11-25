/* Tests for tools/cbrt_engine.js (Root Calculator, Mode 02, Cube Root Calculator) against tests/cbrt_vectors.json (independent: gen_cbrt_vectors.py, sympy factorint and sp.root for the exact form,
   mpmath and Python decimal for the decimal, sympy integer_nthroot for perfect cubes) and the fixed cases from the Root Calculator CEO decision note. */
const Cb = require('../tools/cbrt_engine.js'), V = require('./cbrt_vectors.json'), fs = require('fs'), path = require('path');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 20) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const S = (radicand, places) => Cb.solve({ radicand, places });
const clean = (r) => !/undefined|NaN|\[object|null/.test(JSON.stringify([r.steps, r.rows, r.sentence, r.summary, r.verify, r.title, r.exact, r.decimal, r.warnings, r.notes]));
for (const [t, p, exact, perfect, decimal, floor, radicand] of V.solve) {
  const tag = '[' + t.slice(0, 50) + ' @' + p + ']', r = S(t, p);
  if (!r.ok) { bad(tag + ' rejected: ' + r.error); continue; }
  eq(r.exact, exact, 'exact ' + tag); eq(r.perfect, perfect, 'perfect cube ' + tag); eq(r.irrational, !perfect, 'irrational flag ' + tag);
  eq(r.decimal, decimal, 'decimal ' + tag); eq(r.floor, floor, 'floor of |root| ' + tag); eq(r.radicand, radicand, 'radicand as exact fraction ' + tag);
  eq(r.verifyOk, true, 'checks ' + tag); eq(r.verify.length >= 4 && r.verify.every((x) => x[1] === true), true, 'every check passed ' + tag);
  eq(Array.isArray(r.steps) && r.steps.length >= 4 && r.steps.every((s) => typeof s === 'string' && s.length > 8), true, 'working ' + tag); eq(clean(r), true, 'no undefined or NaN text ' + tag);
  eq(r.valueText, exact, 'headline value ' + tag);
  eq(r.negative, radicand.charAt(0) === '-', 'negative flag ' + tag);
  if (!perfect) eq(r.decimalExact, false, 'irrational decimal is never exact ' + tag); else eq(typeof r.decimalExact, 'boolean', 'exact flag ' + tag);
  eq(r.rows.some((x) => x[0] === 'Power-back'), true, 'power-back row ' + tag);
  const drow = r.rows.find((x) => x[0] === 'Decimal')[1]; eq(drow.indexOf('≈') === 0, !r.decimalExact, 'approximate marker ' + tag);
  // the real cube root has the sign of the radicand
  eq(/^-/.test(exact), radicand.charAt(0) === '-' && radicand !== '0', 'sign of the exact result ' + tag);
  eq(/^-/.test(r.decimal), radicand.charAt(0) === '-' && /[1-9]/.test(r.decimal), 'sign of the decimal ' + tag);
  // exact cube of the exact form equals the radicand: re-derived from the text
  const [rn, rd] = radicand.split('/').map(BigInt), m = /^(-?)(\d*)∛(\d+)(?:\/(\d+))?$/.exec(exact);
  if (m) { const sg = m[1] ? -1n : 1n, a = BigInt(m[2] || '1'), rad = BigInt(m[3]), den = BigInt(m[4] || '1'); eq(sg * a * a * a * rad * (rd || 1n) === rn * den * den * den, true, 'radical cubed is the radicand ' + tag); }
  else { const [en, ed] = exact.split('/').map(BigInt); eq(en * en * en * (rd || 1n) === rn * (ed || 1n) ** 3n, true, 'rational root cubed is the radicand ' + tag); }
}
// tiny values: more places than asked may be shown, but never a 0 for a nonzero number, with at least ten significant digits, correctly rounded
for (const [t, p, truth, exact, neg] of V.tiny) {
  const r = S(t, p), tag = '[' + t + ']'; if (!r.ok) { bad(tag + ' rejected: ' + r.error); continue; }
  eq(r.exact, exact, 'exact ' + tag); eq(/[1-9]/.test(r.decimal), true, 'a nonzero root is not shown as 0 ' + tag); eq(/^-/.test(r.decimal), neg, 'sign ' + tag);
  const mag = r.decimal.replace(/^-/, ''), sig = mag.replace('.', '').replace(/^0+/, ''); eq(sig.length >= 10, true, 'at least ten significant digits ' + tag + ' ' + r.decimal);
  const dp = (mag.split('.')[1] || '').length, tr = truth.replace('.', '').split('e'), digits = tr[0], ex = parseInt(tr[1], 10);
  // truth = digits * 10^(ex - 60); round half up at dp places with BigInt
  const shift = BigInt(dp) + BigInt(ex) - 60n; let v = BigInt(digits); const sc = shift >= 0n ? v * 10n ** shift : v / 10n ** -shift, rem = shift >= 0n ? 0n : (v % 10n ** -shift) * 2n >= 10n ** -shift ? 1n : 0n;
  const want = String(sc + rem).padStart(dp + 1, '0'), wt = want.slice(0, want.length - dp) + '.' + want.slice(want.length - dp);
  eq(mag, wt, 'tiny decimal correctly rounded ' + tag); eq(r.verifyOk, true, 'checks ' + tag);
}
V.bad.forEach((t) => { const r = S(t, 8); eq(r.ok, false, 'must refuse unreadable [' + t.slice(0, 40) + ']'); eq(typeof r.error === 'string' && r.error.length > 5 && r.empty !== true, true, 'message [' + t.slice(0, 40) + ']'); });
V.empty.forEach((t) => { const r = S(t, 8); eq(r.ok === false && r.empty === true && typeof r.hint === 'string' && r.hint.length > 5, true, 'blank flagged with a hint [' + JSON.stringify(t) + ']'); });
eq(S(undefined).empty, true, 'undefined radicand is blank'); eq(S(null).empty, true, 'null radicand is blank');
// the CEO note, by exact text
const note = { '8': '2', '27': '3', '64': '4', '125': '5', '216': '6', '-8': '-2', '-27': '-3', '0.125': '1/2' };
Object.keys(note).forEach((k) => eq(S(k, 8).exact, note[k], 'note case ∛' + k));
eq(S('0.125').decimal, '0.5', '∛0.125 = 0.5 as in the note'); eq(S('0.125').decimalExact, true, '∛0.125 is exact'); eq(S('-8').decimal, '-2', '∛(−8) decimal'); eq(S('-8').negative, true, '∛(−8) is negative');
eq(S('-8').ok, true, 'a negative radicand has a real cube root'); eq(S('-27').title, '∛(−27)', 'title of a negative radicand'); eq(S('27').title, '∛27', 'title of a positive radicand');
eq(S('2').decimal, '1.25992105', '∛2 to 8 places'); eq(S('2').decimalExact, false, '∛2 is not exact'); eq(S('2').irrational, true, '∛2 is irrational'); eq(S('2').exact, '∛2', '∛2 exact');
eq(S('54').exact, '3∛2', '∛54'); eq(S('-54').exact, '-3∛2', '∛(−54)'); eq(S('16').exact, '2∛2', '∛16'); eq(S('24').exact, '2∛3', '∛24'); eq(S('250').exact, '5∛2', '∛250'); eq(S('0').exact, '0', '∛0'); eq(S('0').perfect, true, '0 is a perfect cube'); eq(S('0').negative, false, '0 is not negative'); eq(S('-0').exact, '0', '−0 is 0'); eq(S('1').exact, '1', '∛1'); eq(S('-1').exact, '-1', '∛(−1)');
eq(S('1/2').exact, '∛4/2', 'denominator rationalised'); eq(S('-1/2').exact, '-∛4/2', 'negative fraction'); eq(S('3/8').exact, '∛3/2', '∛(3/8)'); eq(S('3/4').exact, '∛6/2', '∛(3/4)'); eq(S('5/12').exact, '∛90/6', '∛(5/12)'); eq(S('1/9').exact, '∛3/3', '∛(1/9)'); eq(S('8/27').exact, '2/3', '∛(8/27)'); eq(S('-8/27').exact, '-2/3', '∛(−8/27)');
eq(S('1/27').decimalExact, false, '1/3 does not end'); eq(S('1/27', 4).decimal, '0.3333', '∛(1/27) at 4 places'); eq(S('-1/27', 4).decimal, '-0.3333', '∛(−1/27) at 4 places');
// the root of a negative number is minus the root of the positive number, for every vector of a positive whole number
for (let k = 1; k <= 400; k++) { const a = S(String(k)), b = S(String(-k)); eq(b.exact, '-' + a.exact, 'odd function ' + k); eq(b.decimal, '-' + a.decimal, 'odd function decimal ' + k); }
// places
eq(S('2', 0).decimal, '1', '0 places'); eq(S('3', 0).decimal, '1', '0 places (1.442 -> 1)'); eq(S('4', 0).decimal, '2', '0 places rounds half up (1.587 -> 2)'); eq(S('-4', 0).decimal, '-2', '0 places negative'); eq(S('2', 50).decimal.length, 52, '50 places'); eq(S('2', 51).ok, false, '51 places refused'); eq(S('2', -1).ok, false, 'negative places refused'); eq(S('2', 2.5).ok, false, 'fractional places refused'); eq(S('2', 'abc').ok, false, 'text places refused');
eq(S('2', '3').decimal, '1.260', 'places as text'); eq(S('2', '').decimal, '1.25992105', 'blank places means the default 8'); eq(S('2', 'auto').decimal, '1.25992105', 'auto places means the default 8');
eq(S('2', 50).decimal, '1.25992104989487316476721060727822835057025146470151', '∛2 to 50 places (known digits 1.2599210498948731647672106072782283505702514647015079…, rounded down)');
eq(S('10', 10).decimal, '2.1544346900', '∛10 to 10 places'); eq(S('3', 12).decimal, '1.442249570307', '∛3 to 12 places');
// big exact inputs
eq(S('1' + '0'.repeat(41)).exact, '1' + '0'.repeat(13) + '∛100', 'a 42-digit power of ten: 10^41 = (10^13)^3 × 100'); eq(S('1' + '0'.repeat(42)).exact, '1' + '0'.repeat(14), '10^42 is a perfect cube'); eq(S('1'.repeat(61)).ok, false, '61 digits refused'); eq(S('1'.repeat(60)).ok, true, '60 digits accepted');
eq(S('-1' + '0'.repeat(42)).exact, '-1' + '0'.repeat(14), '−10^42 is a perfect cube');
const prime3 = S(String(1000003n ** 3n)); eq(prime3.exact, '1000003', 'a cube of a prime above the trial limit is found by the integer cube root'); eq(prime3.perfect && prime3.full, true, 'and counts as fully factored');
const prime2 = S(String(1000003n ** 2n)); eq(prime2.exact, '∛' + (1000003n ** 2n), 'a square of a large prime stays under the root'); eq(prime2.full, true, 'fully factored');
const big = S('1' + '0'.repeat(30) + '1'.repeat(25)); eq(big.ok, true, 'large input ok'); eq(big.verifyOk, true, 'large input checks');
const semi = S(String(1000003n * 1000033n * 1000037n)); eq(semi.ok && semi.verifyOk, true, 'three primes above the trial limit: still correct'); eq(semi.full, false, 'not fully factored is reported'); eq(semi.warnings.length >= 1 && /too large to factor completely/.test(semi.warnings[0]), true, 'warning about the factoring limit'); eq(semi.exact, '∛' + (1000003n * 1000033n * 1000037n), 'kept whole under the root');
const unfact = S(String(10000019n * 10000079n * 27n)); eq(unfact.exact, '3∛' + (10000019n * 10000079n), 'a factor 3³ taken out of a semiprime with two 8-digit primes'); eq(unfact.verifyOk, true, 'checks for the unfactored input');
const nu = S('-' + String(10000019n * 10000079n * 27n)); eq(nu.exact, '-3∛' + (10000019n * 10000079n), 'the same, negative');
// Newton table converges
const e = S('54').estimate; eq(e.length, 6, 'six Newton rows'); eq(e[0].guess, '4.0000000000', 'Newton start'); eq(e[1].guess, '3.7916666667', 'Newton step 1'); eq(e[4].guess, '3.7797631497', 'Newton step 4'); eq(S('0').estimate.length, 0, 'no Newton rows for 0'); eq(S('-54').estimate[4].guess, '3.7797631497', 'negative: estimate for |x|');
eq(Cb.newton({ n: 2n, d: 1n }, 3).length, 4, 'newton iterates'); eq(Cb.factorise(72n).map((x) => x.join('^')).join(' '), '2^3 3^2', 'factorise 72'); eq(Cb.factorise(10n ** 13n), null, 'factorise declines above 1e12');
eq(Cb.icbrt(0n), 0n, 'icbrt 0'); eq(Cb.icbrt(7n), 1n, 'icbrt 7'); eq(Cb.icbrt(8n), 2n, 'icbrt 8'); eq(Cb.icbrt(26n), 2n, 'icbrt 26'); eq(Cb.icbrt(27n), 3n, 'icbrt 27'); eq(Cb.icbrt(10n ** 60n), 10n ** 20n, 'icbrt 10^60'); eq(Cb.icbrt(10n ** 60n - 1n), 10n ** 20n - 1n, 'icbrt 10^60 − 1');
for (let k = 1n; k < 3000n; k += 7n) { eq(Cb.icbrt(k * k * k), k, 'icbrt of a cube ' + k); eq(Cb.icbrt(k * k * k - 1n), k - 1n, 'icbrt just below ' + k); eq(Cb.icbrt(k * k * k + 1n), k, 'icbrt just above ' + k); }
const sp = Cb.cubeSplit(2n ** 4n * 3n ** 5n * 5n ** 2n * 7n ** 3n); eq(sp.s, 2n * 3n * 7n, 'cube split: s'); eq(sp.a, 2n, 'cube split: a'); eq(sp.b, 3n * 5n, 'cube split: b'); eq(sp.r, 2n * 15n * 15n, 'cube split: r = a b²');
// working text names the key facts
const w54 = S('54').steps.join('\n'); ['2 × 3³', '3³ × 2', '3∛2', 'irrational', '3.77976315'].forEach((s) => eq(w54.indexOf(s) >= 0, true, 'working for ∛54 has ' + s));
const wn = S('-27').steps.join('\n'); ['negative', '−∛x', '= -3'].forEach((s) => eq(wn.indexOf(s) >= 0, true, 'working for ∛(−27) has ' + s));
const w34 = S('3/4').steps.join('\n'); ['∛3 / ∛4', '∛6/2', 'Rationalise'].forEach((s) => eq(w34.indexOf(s) >= 0, true, 'working for ∛(3/4) has ' + s));
const w12 = S('1/2').steps.join('\n'); eq(/Rationalise the denominator/.test(w12), true, 'working for ∛(1/2) rationalises');
// summary text
eq(S('27').summary.split('\n')[1], '∛27 = 3', 'summary line'); eq(S('-27').summary.split('\n')[1], '∛(−27) = −3', 'summary line, negative, with the true minus sign'); eq(/Irrational: yes/.test(S('2').summary), true, 'summary says irrational'); eq(/Perfect cube: yes/.test(S('27').summary), true, 'summary says perfect cube');
eq(/every nonzero number has three cube roots/i.test(S('-8').notes.join(' ')), true, 'note about the complex cube roots');
// the built page
const html = fs.readFileSync(path.join(__dirname, '..', 'calculators', 'cube-root-calculator', 'index.html'), 'utf8');
['<h1>Cube Root Calculator</h1>', 'id="ns-r"', 'id="ns-pl"', 'Mode 02', 'href="../square-root-calculator/"', 'href="../nth-root-calculator/"', 'Root Simplification (coming)', 'Engineering Root Calculator (coming)', 'aria-current="page"', 'Cube Root Calculator | Exact Radical'].forEach((s) => eq(html.indexOf(s) >= 0, true, 'page has ' + s));
eq(/href="\.\.\/(radical|engineering)/.test(html), false, 'no link to a mode that is not built');
eq(html.indexOf('3∛2') >= 0 && html.indexOf('1.25992105') >= 0 && html.indexOf('3.77976315') >= 0 && html.indexOf('−3') >= 0, true, 'page examples computed by the engine');
eq((html.match(/<h1/g) || []).length, 1, 'one h1');
const sqh = fs.readFileSync(path.join(__dirname, '..', 'calculators', 'square-root-calculator', 'index.html'), 'utf8');
eq(sqh.indexOf('href="../cube-root-calculator/"') >= 0 && sqh.indexOf('Cube Root Calculator (coming)') < 0, true, 'Mode 01 page links to Mode 02');
console.log('cbrt_test: ' + n + ' checks, ' + fail + ' failures'); process.exit(fail ? 1 : 0);
