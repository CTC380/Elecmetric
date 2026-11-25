/* Tests for tools/sqrt_engine.js (Root Calculator, Mode 01, Square Root Calculator) against tests/sqrt_vectors.json (independent: gen_sqrt_vectors.py, sympy for the exact form,
   Python decimal for the decimal, math.isqrt for perfect squares) and the fixed cases from the Root Calculator CEO decision note. */
const Sq = require('../tools/sqrt_engine.js'), V = require('./sqrt_vectors.json'), fs = require('fs'), path = require('path');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 20) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const S = (radicand, places) => Sq.solve({ radicand, places });
const clean = (r) => !/undefined|NaN|\[object|null/.test(JSON.stringify([r.steps, r.rows, r.sentence, r.summary, r.verify, r.title, r.exact, r.decimal, r.warnings, r.notes]));
for (const [t, p, exact, perfect, decimal, floor, radicand] of V.solve) {
  const tag = '[' + t.slice(0, 50) + ' @' + p + ']', r = S(t, p);
  if (!r.ok) { bad(tag + ' rejected: ' + r.error); continue; }
  eq(r.exact, exact, 'exact ' + tag); eq(r.perfect, perfect, 'perfect square ' + tag); eq(r.irrational, !perfect, 'irrational flag ' + tag);
  eq(r.decimal, decimal, 'decimal ' + tag); eq(r.floor, floor, 'floor of the root ' + tag); eq(r.radicand, radicand, 'radicand as exact fraction ' + tag);
  eq(r.verifyOk, true, 'checks ' + tag); eq(r.verify.length >= 4 && r.verify.every((x) => x[1] === true), true, 'every check passed ' + tag);
  eq(Array.isArray(r.steps) && r.steps.length >= 4 && r.steps.every((s) => typeof s === 'string' && s.length > 8), true, 'working ' + tag); eq(clean(r), true, 'no undefined or NaN text ' + tag);
  eq(r.valueText, exact, 'headline value ' + tag);
  // a decimal is only shown as exact when the root is a perfect square whose decimal ends
  if (!perfect) eq(r.decimalExact, false, 'irrational decimal is never exact ' + tag); else eq(typeof r.decimalExact, 'boolean', 'exact flag ' + tag);
  eq(r.rows.some((x) => x[0] === 'Power-back'), true, 'power-back row ' + tag);
  // an irrational result is marked approximate in the table, a terminating perfect root is not
  const drow = r.rows.find((x) => x[0] === 'Decimal')[1]; eq(drow.indexOf('≈') === 0, !r.decimalExact, 'approximate marker ' + tag);
  // exact square of the exact form equals the radicand: re-derived from the text
  const m = /^(\d*)√(\d+)(?:\/(\d+))?$/.exec(exact);
  if (m) { const a = BigInt(m[1] || '1'), rad = BigInt(m[2]), den = BigInt(m[3] || '1'), [rn, rd] = radicand.split('/').map(BigInt); eq(a * a * rad * (rd || 1n) === rn * den * den, true, 'radical squared is the radicand ' + tag); }
  else { const [en, ed] = exact.split('/').map(BigInt), [rn, rd] = radicand.split('/').map(BigInt); eq(en * en * (rd || 1n) === rn * (ed || 1n) * (ed || 1n), true, 'rational root squared is the radicand ' + tag); }
}
// tiny values: more places than asked may be shown, but never a 0 for a positive number, with at least ten significant digits, correctly rounded
for (const [t, p, truth, exact] of V.tiny) {
  const r = S(t, p), tag = '[' + t + ']'; if (!r.ok) { bad(tag + ' rejected: ' + r.error); continue; }
  eq(r.exact, exact, 'exact ' + tag); eq(/[1-9]/.test(r.decimal), true, 'a positive root is not shown as 0 ' + tag);
  const sig = r.decimal.replace('.', '').replace(/^0+/, ''); eq(sig.length >= 10, true, 'at least ten significant digits ' + tag + ' ' + r.decimal);
  const dp = (r.decimal.split('.')[1] || '').length, tr = truth.replace('.', '').split('e'), digits = tr[0], ex = parseInt(tr[1], 10);
  // truth = digits * 10^(ex - 60); round half up at dp places with BigInt
  const shift = BigInt(dp) + BigInt(ex) - 60n; let v = BigInt(digits); const sc = shift >= 0n ? v * 10n ** shift : v / 10n ** -shift, rem = shift >= 0n ? 0n : (v % 10n ** -shift) * 2n >= 10n ** -shift ? 1n : 0n;
  const want = String(sc + rem).padStart(dp + 1, '0'), wt = want.slice(0, want.length - dp) + '.' + want.slice(want.length - dp);
  eq(r.decimal, wt, 'tiny decimal correctly rounded ' + tag); eq(r.verifyOk, true, 'checks ' + tag);
}
for (const [t, cx] of V.err) { const r = S(t, 8); eq(r.ok, false, 'must refuse [' + t + ']'); eq(r.noReal, true, 'no-real flag [' + t + ']'); eq(r.complex, cx, 'complex value named [' + t + ']'); eq(typeof r.error === 'string' && /no real result/.test(r.error) && r.empty !== true, true, 'message [' + t + ']'); }
V.bad.forEach((t) => { const r = S(t, 8); eq(r.ok, false, 'must refuse unreadable [' + t.slice(0, 40) + ']'); eq(typeof r.error === 'string' && r.error.length > 5 && r.empty !== true && !r.noReal, true, 'message [' + t.slice(0, 40) + ']'); });
V.empty.forEach((t) => { const r = S(t, 8); eq(r.ok === false && r.empty === true && typeof r.hint === 'string' && r.hint.length > 5, true, 'blank flagged with a hint [' + JSON.stringify(t) + ']'); });
eq(S(undefined).empty, true, 'undefined radicand is blank'); eq(S(null).empty, true, 'null radicand is blank');
// the CEO note, by exact text
const note = { '144': '12', '81': '9', '72': '6√2', '0.125': '√2/4' };
Object.keys(note).forEach((k) => eq(S(k, 8).exact, note[k], 'note case ' + k));
eq(S('2', 8).decimal, '1.41421356', '√2 to 8 places as in the note'); eq(S('2', 8).decimalExact, false, '√2 is not exact'); eq(S('2', 8).irrational, true, '√2 is irrational');
eq(S('72', 8).decimal, '8.48528137', '√72 decimal in the note'); eq(S('72').exact, '6√2', 'default places still exact');
eq(S('144').decimal, '12', '√144 decimal'); eq(S('144').decimalExact, true, '√144 decimal is exact'); eq(S('0.25').decimal, '0.5', '√0.25'); eq(S('1/9').decimalExact, false, '1/3 does not end');
eq(S('1/9').exact, '1/3', '√(1/9)'); eq(S('1/9', 4).decimal, '0.3333', '√(1/9) at 4 places'); eq(S('0').exact, '0', '√0'); eq(S('0').perfect, true, '0 is a perfect square'); eq(S('1').exact, '1', '√1');
eq(S('-9').complex, '3 i', 'negative: √(−9) named as 3 i'); eq(S('-1').complex, 'i', 'negative: √(−1) is i'); eq(S('-2').complex, 'i × √2', 'negative: √(−2) is i × √2');
// places
eq(S('2', 0).decimal, '1', '0 places'); eq(S('3', 0).decimal, '2', '0 places rounds half up (1.732 -> 2)'); eq(S('2', 50).decimal.length, 52, '50 places'); eq(S('2', 51).ok, false, '51 places refused'); eq(S('2', -1).ok, false, 'negative places refused'); eq(S('2', 2.5).ok, false, 'fractional places refused'); eq(S('2', 'abc').ok, false, 'text places refused');
eq(S('2', '3').decimal, '1.414', 'places as text'); eq(S('2', '').decimal, '1.41421356', 'blank places means the default 8'); eq(S('2', 'auto').decimal, '1.41421356', 'auto places means the default 8');
eq(S('2', 50).decimal, '1.41421356237309504880168872420969807856967187537695', '√2 to 50 places (known digits 1.414213562373095048801688724209698078569671875376948…, rounded up)');
eq(S('5', 12).decimal, '2.236067977500', '√5 to 12 places (2.2360679774997896… rounds up)'); eq(S('10', 10).decimal, '3.1622776602', '√10 to 10 places');
// big exact inputs
eq(S('1' + '0'.repeat(41)).exact, '1' + '0'.repeat(20) + '\u221a10', 'a 42-digit power of ten');
eq(S('1' + '0'.repeat(40)).exact, '1' + '0'.repeat(20), '10^40 is a perfect square'); eq(S('1'.repeat(61)).ok, false, '61 digits refused'); eq(S('1'.repeat(60)).ok, true, '60 digits accepted');
eq(S('4/9').exact, '2/3', '4/9'); eq(S('1/2').exact, '√2/2', 'denominator rationalised'); eq(S('3/8').exact, '√6/4', '√(3/8) = √6/4'); eq(S('50/9').exact, '5√2/3', '√(50/9)');
// the unsimplified part when the number is too big to factor: still correct and still flagged only when not fully factored
const big = S('1' + '0'.repeat(30) + '1'.repeat(25)); eq(big.ok, true, 'large input ok'); eq(big.verifyOk, true, 'large input checks');
const prime = S('1000000000000000000000000000057'); eq(prime.ok && prime.verifyOk, true, 'large prime-like input'); eq(prime.exact.indexOf('√') === 0 || /^\d+√/.test(prime.exact), true, 'radical form');
const semi = S(String(1000003n * 1000033n)); eq(semi.ok && semi.verifyOk, true, 'two primes above the trial limit: still correct'); eq(semi.full, false, 'not fully factored is reported'); eq(semi.warnings.length >= 1 && /too large to factor completely/.test(semi.warnings[0]), true, 'warning about the factoring limit'); eq(semi.exact, '\u221a' + (1000003n * 1000033n), 'kept whole under the root');
const unfact = S(String(10000019n * 10000079n * 9n)); eq(unfact.exact, '3√' + (10000019n * 10000079n), 'a factor of 3 taken out of a semiprime with two 8-digit primes'); eq(unfact.verifyOk, true, 'checks for the unfactored input');
// Newton table converges
const e = S('72').estimate; eq(e.length, 6, 'six Newton rows'); eq(e[0].guess, '9.0000000000', 'Newton start'); eq(e[1].guess, '8.5000000000', 'Newton step 1'); eq(e[4].guess, '8.4852813742', 'Newton step 4'); eq(S('0').estimate.length, 0, 'no Newton rows for 0');
eq(Sq.heron({ n: 2n, d: 1n }, 3).length, 4, 'heron iterates'); eq(Sq.factorise(72n).map((x) => x.join('^')).join(' '), '2^3 3^2', 'factorise 72'); eq(Sq.factorise(2n ** 39n + 1n) !== null, true, 'factorise a 13-digit number'); eq(Sq.factorise(10n ** 13n), null, 'factorise declines above 1e12');
// working text names the key facts
const w72 = S('72').steps.join('\n'); ['2³ × 3²', '6² × 2', '6√2', 'irrational', '8.48528137'].forEach((s) => eq(w72.indexOf(s) >= 0, true, 'working for √72 has ' + s));
const w34 = S('3/4').steps.join('\n'); ['√3 / √4', '√3/2'].forEach((s) => eq(w34.indexOf(s) >= 0, true, 'working for √(3/4) has ' + s));
const w12 = S('1/2').steps.join('\n'); eq(/Rationalise the denominator/.test(w12), true, 'working for √(1/2) rationalises');
// summary text
eq(S('144').summary.split('\n')[1], '√144 = 12', 'summary line'); eq(/Irrational: yes/.test(S('2').summary), true, 'summary says irrational'); eq(/Perfect square: yes/.test(S('144').summary), true, 'summary says perfect square');
// the built page
const html = fs.readFileSync(path.join(__dirname, '..', 'calculators', 'square-root-calculator', 'index.html'), 'utf8');
['<h1>Square Root Calculator</h1>', 'id="ns-r"', 'id="ns-pl"', 'Mode 01', 'href="../cube-root-calculator/"', 'href="../nth-root-calculator/"', 'Root Simplification (coming)', 'Engineering Root Calculator (coming)', 'aria-current="page"', 'Square Root Calculator | Exact Radical'].forEach((s) => eq(html.indexOf(s) >= 0, true, 'page has ' + s));
eq(/href="\.\.\/(radical|engineering)/.test(html), false, 'no link to a mode that is not built');
eq(html.indexOf('6√2') >= 0 && html.indexOf('1.41421356') >= 0 && html.indexOf('8.48528137') >= 0 && html.indexOf('229.8097') >= 0, true, 'page examples computed by the engine');
eq((html.match(/<h1/g) || []).length, 1, 'one h1');
console.log('sqrt_test: ' + n + ' checks, ' + fail + ' failures'); process.exit(fail ? 1 : 0);
