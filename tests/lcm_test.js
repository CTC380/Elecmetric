/* Tests for tools/lcm_engine.js (LCM Calculator, Mode 01, Multiple Number LCM) against tests/lcm_vectors.json (independent: gen_lcm_vectors.py, Python math.lcm / math.gcd,
   a reverse-order fold, a brute-force search for small cases and sympy.factorint prime powers) and the fixed cases from the LCM Calculator CEO decision note. */
const Lc = require('../tools/lcm_engine.js'), V = require('./lcm_vectors.json'), fs = require('fs'), path = require('path');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 20) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const C = (text, method) => Lc.calc({ text, method });
const clean = (r) => !/undefined|NaN|\[object|null/.test(JSON.stringify([r.steps, r.rows, r.verify, r.notes, r.warnings, r.sentence, r.summary, r.quotients]).replace(/is undefined/g, ''));
const SHORT = (s) => (s.length <= 40 ? s : s.slice(0, 10) + '\u2026' + s.slice(-6) + ' (' + s.length + ' digits)');
for (const [text, lcm, gcd, dist, zero, noz, neg, primeOk, listOk] of V.ok) {
  const t = '[' + text.replace(/\s+/g, ' ').slice(0, 44) + ']', r = C(text);
  if (!r.ok) { bad(t + ' rejected: ' + r.error); continue; }
  eq(r.lcm, lcm, 'LCM ' + t); eq(r.gcd, gcd, 'GCD ' + t); eq(r.distinct.join(','), dist.join(','), 'distinct values ' + t); eq(r.zero, zero, 'zero flag ' + t); eq(r.negative, neg, 'negative flag ' + t);
  eq(r.withoutZero, noz, 'LCM without the zeros ' + t); eq(r.rows[0][0] + '=' + r.rows[0][1], 'LCM=' + lcm, 'first row ' + t); eq(r.rows[1][0] + '=' + r.rows[1][1], 'GCD=' + gcd, 'second row ' + t);
  eq(r.verifyOk, true, 'checks ' + t); eq(r.verify.every((x) => x[1] === true) && r.verify.length >= (zero ? 3 : 5), true, 'every check passed, enough of them ' + t);
  eq(Array.isArray(r.steps) && r.steps.length >= 1 && r.steps.every((s) => typeof s === 'string' && s.length > 8), true, 'working ' + t); eq(clean(r), true, 'no undefined or NaN text ' + t);
  eq(r.sentence.indexOf('LCM(') === 0 && r.sentence.endsWith(' = ' + SHORT(lcm)), true, 'sentence ' + t); eq(r.summary.indexOf('LCM = ' + lcm) > 0, true, 'summary holds the full LCM ' + t);
  eq(r.methodUsed, 'gcd', 'default method ' + t);
  if (!zero) {
    const L = BigInt(lcm);
    eq(r.quotients.length, dist.length, 'quotient rows ' + t); eq(r.quotients.every((q, i) => BigInt(q.n) === BigInt(dist[i]) && BigInt(q.q) * BigInt(dist[i]) === L), true, 'quotients ' + t);
    eq(r.multiples.length, 5, 'five common multiples ' + t); eq(r.multiples.every((m, i) => BigInt(m) === L * BigInt(i + 1)), true, 'common multiples ' + t);
    eq(r.lcmDigits, lcm.length, 'digit count ' + t);
    if (dist.length === 2) eq(BigInt(gcd) * L, BigInt(dist[0]) * BigInt(dist[1]), 'GCD x LCM = product ' + t);
  } else eq(r.lcm, '0', 'zero convention ' + t);
  // the other two ways of showing the working give the same LCM and fall back exactly when the page says they cannot be shown
  const p = C(text, 'prime'), l = C(text, 'list');
  eq(p.ok && p.lcm === lcm && p.gcd === gcd && p.verifyOk, true, 'prime method result ' + t); eq(l.ok && l.lcm === lcm && l.gcd === gcd && l.verifyOk, true, 'list method result ' + t);
  eq(p.methodUsed, primeOk ? 'prime' : 'gcd', 'prime working available ' + t); eq(l.methodUsed, listOk ? 'list' : 'gcd', 'listing working available ' + t);
  eq(p.warnings.length, primeOk ? 0 : 1, 'prime fallback message ' + t); eq(l.warnings.length, listOk ? 0 : 1, 'listing fallback message ' + t);
  if (primeOk) eq(p.steps[p.steps.length - 1].indexOf('LCM = ') === 0 && p.steps[p.steps.length - 1].endsWith(' = ' + SHORT(lcm) + '.'), true, 'prime working ends at the LCM ' + t);
  if (listOk) {
    const L = BigInt(lcm), rowsL = l.steps.filter((s) => s.indexOf('Multiples of ') === 0);
    eq(rowsL.length, dist.length, 'one list per distinct number ' + t);
    eq(rowsL.every((s, i) => { const k = Number(L / BigInt(dist[i])), items = s.slice(s.indexOf(':') + 2, -1).split(', '); return items.length === k && items[k - 1] === lcm && items.every((v, j) => BigInt(v) === BigInt(dist[i]) * BigInt(j + 1)); }), true, 'lists of multiples reach the LCM exactly ' + t);
  }
  if (zero) eq(p.warnings.length === 1 && l.warnings.length === 1, true, 'zero: working by prime and by listing is not shown ' + t);
}
for (const e of V.err) { const r = C(e); eq(r.ok, false, 'must refuse [' + e.slice(0, 40) + ']'); eq(r.empty === undefined || r.empty === false, true, 'a refusal is not an empty hint [' + e.slice(0, 40) + ']'); eq(typeof r.error === 'string' && r.error.length > 5, true, 'message [' + e.slice(0, 40) + ']'); eq(typeof r.termIndex === 'number', true, 'term index [' + e.slice(0, 40) + ']'); }
for (const e of V.empty) { const r = C(e); eq(r.ok === false && r.empty === true && typeof r.hint === 'string' && r.hint.length > 5, true, 'empty input flagged with a hint [' + JSON.stringify(e) + ']'); }
// the CEO note, by exact text
const T = (x) => C(x).lcm;
eq(T('4, 6'), '12', 'LCM(4, 6)'); eq(T('12, 18'), '36', 'LCM(12, 18)'); eq(T('12, 18, 24'), '72', 'LCM(12, 18, 24)'); eq(T('21, 14, 38'), '798', 'LCM(21, 14, 38)'); eq(T('5, 7, 9'), '315', 'LCM(5, 7, 9)');
eq(T('8, 12, 20'), '120', 'LCM(8, 12, 20)'); eq(T('1, 100'), '100', 'LCM(1, 100)'); eq(T('15, 25'), '75', 'LCM(15, 25)'); eq(T('0, 5'), '0', 'LCM(0, 5)'); eq(T('-4, 6'), '12', 'LCM(-4, 6)'); eq(T('2, 3, 4'), '12', 'LCM(2, 3, 4)');
eq(C('12, 18').gcd, '6', 'GCD(12, 18) = 6'); eq(C('12, 18').rows.find((x) => x[0] === 'Product of the two numbers')[1], '216', 'product of 12 and 18'); eq(C('12, 18').rows.find((x) => x[0] === 'Product of the two numbers')[2], 'GCD \u00d7 LCM = 216', 'GCD x LCM = 216');
eq(C('12, 18, 24').quotients.map((q) => q.q).join(','), '6,4,3', '72 / 12, 18, 24 = 6, 4, 3 (the note\'s verification)'); eq(C('4, 6').rows.some((x) => x[0] === 'Where it is used' && /12 units/.test(x[2])), true, 'timing reading for 4 and 6 gives 12');
eq(C('12, 18, 24').steps.some((s) => /LCM\(12, 18\)[^]*GCD = 6[^]*= 36/.test(s)), true, 'working shows LCM(12, 18) = 36'); eq(C('12, 18', 'prime').steps.some((s) => s === '12 = 2\u00b2 \u00d7 3.') && C('12, 18', 'prime').steps.some((s) => s === 'LCM = 2\u00b2 \u00d7 3\u00b2 = 36.'), true, 'prime working for 12 and 18 is the note\'s 2^2 x 3^2 = 36');
eq(C('0, 5, 10').withoutZero, '10', 'LCM without the zero'); eq(C('0, 0').gcd, '0', 'GCD(0, 0) = 0'); eq(C('0, 0').withoutZero, null, 'no LCM without the zeros when every number is 0'); eq(C('0, 0').verifyOk, true, 'all zero is verified');
eq(C('7').lcm, '7', 'one number'); eq(C('7').notes[0].indexOf('A single number') === 0, true, 'one number is explained'); eq(C('12, 12, 18').steps.some((s) => /Repeated values are used once/.test(s)), true, 'repeated values are explained');
eq(C('-4, 6').steps[0].indexOf('absolute values') > 0, true, 'negative numbers are explained'); eq(C('12,,18').lcm, '36', 'an empty entry between commas is ignored'); eq(C('12, 18,').lcm, '36', 'a trailing comma is ignored'); eq(C('  12 \n 18\t24  ').lcm, '72', 'spaces, new lines and tabs separate numbers');
eq(C('1,000').lcm, '0', 'a comma separates numbers, so 1,000 is 1 and 000'); eq(/comma separates/.test(C('1,000').notes.join(' ')), true, 'the comma rule is on the page');
eq(C('12.0, 18.00').lcm, '36', 'whole-number decimals'); eq(C('1e3, 1.5e1').lcm, '3000', 'scientific notation that is a whole number'); eq(/not a whole number/.test(C('2.5, 4').error) && C('2.5, 4').termIndex === 0, true, 'a decimal is refused at its position');
eq(/is a fraction/.test(C('4, 1/2').error) && C('4, 1/2').termIndex === 1, true, 'a fraction is refused at its position'); eq(/is not a number/.test(C('12, abc').error) && C('12, abc').termIndex === 1, true, 'a word is refused at its position');
eq(C('1' + '0'.repeat(99) + ', 3').lcm, '3' + '0'.repeat(99), '100-digit number accepted'); eq(/more than 100 digits/.test(C('1' + '0'.repeat(100)).error), true, '101-digit number refused');
eq(C(Array.from({ length: 50 }, (_, i) => i + 1).join(' ')).lcm, '3099044504245996706400', 'LCM(1..50) = 3099044504245996706400'); eq(/At most 50 numbers/.test(C(Array.from({ length: 51 }, (_, i) => i + 1).join(' ')).error), true, '51 numbers refused');
eq(C('12, 18', 'nonsense').ok, false, 'unknown method refused'); eq(C(undefined).empty, true, 'undefined text is an empty input'); eq(Lc.isBlank(' , ;\n'), true, 'isBlank'); eq(Lc.isBlank('0'), false, 'isBlank 0');
// properties: order, repeats, adding 1, adding the LCM itself, GCD x LCM for two numbers, and large numbers
let seed = 7; const rnd = (m) => { seed = (seed * 48271) % 2147483647; return seed % m; };
for (let i = 0; i < 300; i++) {
  const k = 2 + rnd(6), a = Array.from({ length: k }, () => 1 + rnd(5000)), L = BigInt(C(a.join(',')).lcm);
  const sh = a.slice().sort(() => rnd(3) - 1), neg = a.map((x) => (rnd(2) ? -x : x));
  eq(C(sh.join(' ')).lcm, String(L), 'order does not matter ' + a); eq(C(a.concat(a).join(',')).lcm, String(L), 'repeats do not matter ' + a); eq(C(a.concat([1]).join(',')).lcm, String(L), 'adding 1 changes nothing ' + a);
  eq(C(a.concat([String(L)]).join(',')).lcm, String(L), 'adding the LCM changes nothing ' + a); eq(C(neg.join(',')).lcm, String(L), 'signs do not matter ' + a);
  eq(a.every((x) => L % BigInt(x) === 0n), true, 'LCM is a multiple of each number ' + a); eq(C(a.join(',') + ',0').lcm, '0', 'adding 0 gives 0 ' + a);
  if (k === 2) eq(BigInt(C(a.join(',')).gcd) * L, BigInt(a[0]) * BigInt(a[1]), 'GCD x LCM for two numbers ' + a);
}
for (let i = 0; i < 20; i++) { const g = BigInt('1' + '7'.repeat(30 + rnd(40))), x = [g * BigInt(2 + rnd(900)), g * BigInt(3 + rnd(900)), g * BigInt(5 + rnd(900))], r = C(x.join(', ')); eq(r.ok && r.verifyOk, true, 'large numbers verified ' + i); eq(BigInt(r.gcd) % g, 0n, 'the planted factor divides the GCD ' + i); }
// the built page
const html = fs.readFileSync(path.join(__dirname, '..', 'calculators', 'lcm-calculator', 'index.html'), 'utf8');
['<h1>LCM Calculator</h1>', 'id="ns-list"', 'id="ns-m"', 'id="ns-rows"', 'id="ns-add"', 'Mode 01', 'Mode 02 \u00b7 Prime Factorisation (coming)', 'Mode 05 \u00b7 Engineering LCM Applications (coming)', 'LCM(12, 18)', 'How to find the LCM of several numbers', 'Three ways to find an LCM', 'Zero and negative numbers', 'LCM in engineering', 'Is anything sent to a server?', 'window.Lcm', 'elecmetric.lcm.multiple.history'].forEach((s) => eq(html.indexOf(s) >= 0 || (s === 'window.Lcm' && html.indexOf('root.Lcm = api') >= 0), true, 'page has ' + s));
eq((html.match(/<h1>/g) || []).length, 1, 'one h1'); eq(/<title>[^<]{20,60}<\/title>/.test(html), true, 'title length'); eq(/aria-current="page">Mode 01/.test(html), true, 'Mode 01 is the current mode');
eq(/href="\.\.\/lcm-calculator\/"/.test(html), true, 'mode strip links to this page'); eq(/Mode 0[2-5][^<]*<\/a>/.test(html), false, 'unbuilt modes are not links'); eq(html.indexOf('bcd-converter'), -1, 'no shell leftovers');
eq(/undefined|NaN|\[object Object\]/.test(html.replace(/<script>[\s\S]*?<\/script>/g, '').replace(/<style>[\s\S]*?<\/style>/g, '')), false, 'no undefined or NaN text in the page');
console.log('lcm_test: ' + n + ' checks, ' + fail + ' failures'); process.exit(fail ? 1 : 0);
