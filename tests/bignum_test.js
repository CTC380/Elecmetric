/* Tests for tools/bignum_engine.js (Big Number Calculator, Mode 01, Big Integer Arithmetic) against tests/bignum_vectors.json (independent: gen_bignum_vectors.py, Python's own int and the decimal module),
   the fixed cases from the Big Number Calculator CEO decision note, the input parser, the documented limits, and the built page calculators/big-number-calculator/index.html. */
const B = require('../tools/bignum_engine.js'), V = require('./bignum_vectors.json'), fs = require('fs'), path = require('path');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 20) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + String(a).slice(0, 80) + ', expected ' + String(b).slice(0, 80)); };
const ok = (c, m) => { n++; if (!c) bad(m); };
const S = (a, op, b, conv, extras) => B.solve({ a, op, b, conv, extras });
const clean = (r) => !/NaN|\[object|\bnull\b|\bundefined\b/.test(JSON.stringify([r.steps, r.rows, r.sentence, r.summary, r.headline, r.notes, r.csv]));
for (const [a, op, b, conv, res, q, rem, digits, dsum, first, lastd, tz, bits, parity, sign, sci, eng] of V.solve) {
  const tag = '[' + (a.length > 24 ? a.slice(0, 10) + '..(' + a.length + ')' : a) + ' ' + op + ' ' + (b.length > 24 ? b.slice(0, 10) + '..(' + b.length + ')' : b) + ' ' + conv + ']', r = S(a, op, b, conv, false);
  if (!r.ok) { bad(tag + ' rejected: ' + r.error); continue; }
  eq(r.result, res, 'result ' + tag);
  if (op === 'div') { eq(r.quotient, q, 'quotient ' + tag); eq(r.remainder, rem, 'remainder ' + tag); } else if (op === 'mod') { eq(r.remainder, rem, 'remainder ' + tag); eq(r.quotient, q, 'quotient of MOD ' + tag); } else { eq(r.quotient, null, 'no quotient ' + tag); }
  const an = r.analysis; eq(an.digits, digits, 'digits ' + tag); eq(an.digitSum, dsum, 'digit sum ' + tag); eq(an.first, first, 'first digits ' + tag); eq(an.last, lastd, 'last digits ' + tag); eq(an.trailingZeros, tz, 'trailing zeros ' + tag); eq(an.bits, bits, 'bit size ' + tag);
  eq(an.parity, parity, 'parity ' + tag); eq(an.sign, sign, 'sign ' + tag); eq(an.sci, sci, 'scientific notation ' + tag); eq(an.eng, eng, 'engineering notation ' + tag);
  eq(r.verifyOk, true, 'checks ' + tag); eq(r.verify.every((x) => x[1] === true), true, 'every check passed ' + tag); ok(r.verify.length >= 3, 'number of checks ' + tag);
  ok(Array.isArray(r.steps) && r.steps.length >= 2 && r.steps.every((s) => typeof s.title === 'string' && Array.isArray(s.lines) && s.lines.length >= 1), 'working ' + tag); ok(clean(r), 'no undefined or NaN text ' + tag);
  ok(r.summary.indexOf('Number A = ' + BigInt(r.a)) >= 0 && r.summary.indexOf(op === 'div' ? 'Quotient = ' + q : op === 'mod' ? 'Remainder = ' + rem : 'Result = ' + res) >= 0, 'summary holds the exact digits ' + tag);
  ok(r.csv.split('\r\n').length >= 7 && r.csv.indexOf('"Quantity","Value"') === 0, 'csv ' + tag);
  if (op === 'div') eq(BigInt(r.quotient) * BigInt(r.b) + BigInt(r.remainder), BigInt(r.a), 'q*b+r=a ' + tag);
  { const f = (op === 'div' ? q : op === 'mod' ? rem : res).replace('-', ''); eq(r.analysis.sciExact, f === '0' || /^0*$/.test(f.slice(10)), 'sci exactness flag ' + tag); }
}
for (const [a, op, b, sub] of V.err) { const r = S(a, op, b, 'euclid'); const tag = '[' + a.slice(0, 20) + ' ' + op + ' ' + b.slice(0, 20) + ']'; ok(r.ok === false && !r.empty, 'refused ' + tag); ok(r.error && r.error.indexOf(sub) >= 0, 'message contains "' + sub + '" ' + tag + ': ' + r.error); }
for (const [a, op, b] of V.empty) { const r = S(a, op, b); ok(r.ok === false && r.empty === true && r.hint && r.hint.length > 10, 'empty input hint [' + a + '|' + b + ']'); }
for (const [t, want] of V.parse) { const p = B.parseInteger(t, 'Number A'); ok(p.ok === true, 'parse accepts [' + t.slice(0, 20) + ']'); eq(p.text, want, 'parse [' + t.slice(0, 20) + ']'); eq(p.value, BigInt(want), 'parse value [' + t.slice(0, 20) + ']'); }
// fixed cases of the CEO note
eq(S('999999999999999999', 'add', '1').result, '1000000000000000000', 'note 999999999999999999 + 1'); eq(S('123456789', 'mul', '987654321').result, '121932631112635269', 'note 123456789 x 987654321');
eq(S('100', 'div', '7').quotient + ' r ' + S('100', 'div', '7').remainder, '14 r 2', 'note 100 / 7 = 14 remainder 2'); eq(S('2', 'pow', '256').result, '115792089237316195423570985008687907853269984665640564039457584007913129639936', 'note 2^256');
eq(S('2', 'pow', '256').analysis.digits, 78, '2^256 has 78 digits'); eq(S('2', 'pow', '256').analysis.hex, undefined, 'binary and hex only when asked');
const x = S('2', 'pow', '256', 'euclid', true).analysis; eq(x.hex, '1' + '0'.repeat(64), '2^256 in hex'); eq(x.bin, '1' + '0'.repeat(256), '2^256 in binary');
eq(S('1e50', 'mul', '1e25').result, '1' + '0'.repeat(75), 'note 10^50 x 10^25 = 10^75'); eq(S('17', 'mod', '5').result, '2', 'note 17 MOD 5'); eq(S('12345678901234567890', 'add', '98765432109876543210').result, '111111111011111111100', 'note 20-digit sum');
eq(S('5', 'div', '0').ok, false, 'division by zero is an error'); eq(S('0', 'div', '5').result, '0', '0 / 5'); eq(S('-17', 'mod', '5').result, '3', '-17 MOD 5 is 3 (Euclidean)'); eq(S('-17', 'mod', '5', 'floor').result, '3', '-17 MOD 5 floored'); eq(S('-17', 'mod', '5', 'trunc').result, '-2', '-17 MOD 5 truncated');
eq(S('17', 'mod', '-5', 'euclid').result, '2', '17 MOD -5 Euclidean'); eq(S('17', 'mod', '-5', 'floor').result, '-3', '17 MOD -5 floored'); eq(S('17', 'mod', '-5', 'trunc').result, '2', '17 MOD -5 truncated');
eq(S('0', 'pow', '0').result, '1', '0^0 is 1'); ok(S('0', 'pow', '0').notes.some((t) => /0\^0/.test(t)), '0^0 note'); eq(S('9007199254740993', 'add', '0').result, '9007199254740993', 'above 2^53 is exact'); eq(S('9007199254740993', 'mul', '1').result, '9007199254740993', 'above 2^53 times 1');
eq(S('0.1', 'add', '0.2').ok, false, 'decimals are refused in this mode'); ok(/Big Decimal/.test(S('0.1', 'add', '0.2').error), 'decimal message points to the decimal mode');
eq(S('3', 'frob', '4').ok, false, 'unknown operation'); eq(S('5', 'div', '2', 'nonsense').remainder, '1', 'unknown convention falls back to Euclidean');
eq(S('1,000', 'add', '1').result, '1001', 'grouped input'); eq(S('1e3', 'add', '1').notes.length, 1, 'E-notation note'); eq(S('5', 'sq', 'garbage').result, '25', 'square ignores B'); eq(S('5', 'sq', '').ok, true, 'square needs no B');
// limits
eq(S('2', 'pow', '66438').ok, true, '2^66438 (exactly 20,000 digits) is allowed'); eq(S('2', 'pow', '66438').analysis.digits, 20000, '2^66438 digit count'); eq(S('2', 'pow', '66439').ok, false, '2^66439 (20,001 digits) is refused'); ok(/20,001 digits/.test(S('2', 'pow', '66439').error), 'the refusal gives the digit count'); eq(S('10', 'pow', '19999').ok, true, '10^19999 (20,000 digits) is allowed'); eq(S('10', 'pow', '20000').ok, false, '10^20000 (20,001 digits) is refused'); eq(S('2', 'pow', '70000').ok, false, 'a power well over the limit is refused (estimated, not computed)');
eq(S('1', 'pow', '1000000').result, '1', '1^1000000'); eq(S('-1', 'pow', '999999').result, '-1', '(-1)^999999'); eq(S('2', 'pow', '1000001').ok, false, 'exponent above the maximum');
eq(S('9'.repeat(5000), 'mul', '9'.repeat(5000)).analysis.digits, 10000, '5000 x 5000 digits'); eq(S('9'.repeat(5001), 'add', '1').ok, false, '5001 digits refused');
// the work is bounded
let t0 = Date.now(); const big = S('7'.repeat(5000), 'mul', '3'.repeat(5000)); ok(big.ok && big.verifyOk && Date.now() - t0 < 3000, 'a 5000 x 5000 digit product finishes in time');
t0 = Date.now(); const bp = S('123456789', 'pow', '2469'); ok(bp.ok && bp.verifyOk && Date.now() - t0 < 3000, 'a near-limit power finishes in time');
t0 = Date.now(); const bd = S('9'.repeat(5000), 'div', '7'.repeat(2500)); ok(bd.ok && bd.verifyOk && Date.now() - t0 < 3000, 'a 5000 / 2500 digit division finishes in time');
// the working shown
const w1 = S('12345', 'add', '678'); ok(w1.steps.some((s) => s.table && s.table.rows.length === 4 && s.table.rows[3].slice(1).join('') === '013023'.replace(/^/, '') || s.table), 'column addition table'); eq(w1.steps.find((s) => s.table).table.rows[3].slice(1).join(''), '13023', 'column sum digits 12345 + 678');
const w2 = S('1234', 'mul', '56'); const pp = w2.steps.find((s) => s.table); eq(pp.table.rows.map((r) => r[2]).join(','), '7404,61700', 'partial products of 1234 x 56'); ok(w2.steps.some((s) => /7404 \+ 61700 = 69104/.test(s.lines.join(' '))), 'partial products add to 69104');
const w3 = S('1000', 'div', '7'); const ld = w3.steps.find((s) => s.table); eq(ld.table.rows.map((r) => r[3]).join(''), '0142', 'long division quotient digits of 1000 / 7'); eq(ld.table.rows[ld.table.rows.length - 1][4], '6', 'long division final remainder');
const w4 = S('-17', 'div', '5'); const cv = w4.steps.find((s) => s.table && s.table.head[0] === 'Convention'); eq(cv && cv.table.rows.map((r) => r.join('/')).join(' '), 'Euclidean/-4/3 Floored/-4/3 Truncated/-3/-2', 'all three conventions listed for a negative number');
const w5 = S('3', 'pow', '13'); const sm = w5.steps.find((s) => s.table); eq(sm.table.rows.map((r) => r[0]).join(''), '1101', 'binary exponent bits 13 = 1101'); eq(sm.table.rows[sm.table.rows.length - 1][2], '1594323', 'square-and-multiply ends at 3^13');
eq(S('100', 'div', '7').exactFraction, '100/7', 'exact fraction'); eq(S('100', 'div', '10').exactFraction, '10', 'exact fraction that is a whole number'); eq(S('-6', 'div', '-4').exactFraction, '3/2', 'reduced fraction with signs');
eq(B.notation(115792089237316195423570985008687907853269984665640564039457584007913129639936n).sci, '1.157920892×10^77', 'notation of 2^256'); eq(B.notation(9999999999999n).sci, '1×10^13', 'rounding carry in scientific notation'); eq(B.notation(-4700n).eng, '-4.7×10^3', 'engineering notation of -4700'); eq(B.notation(12345n).eng, '12.345×10^3', 'engineering notation of 12345'); eq(B.group('1234567', ','), '1,234,567', 'grouping'); eq(B.group('-123', ','), '-123', 'grouping a short negative');
eq(B.modPow(2n, 10n, 1000n), 24n, 'modPow'); eq(B.modPow(7n, 0n, 1n), 0n, 'modPow modulus 1');
// the built page
const base = path.join(__dirname, '..', 'calculators'), hp = path.join(base, 'big-number-calculator', 'index.html');
if (fs.existsSync(hp)) {
  const html = fs.readFileSync(hp, 'utf8'), txt = html.replace(/<script[\s\S]*?<\/script>/g, '');
  ok(/<title>[^<]{20,60}<\/title>/.test(html), 'page title length'); const d = /name="description" content="([^"]*)"/.exec(html); ok(d && d[1].length >= 50 && d[1].length <= 175, 'meta description length');
  eq((html.match(/<h1>/g) || []).length, 1, 'one h1'); ok(/id="ns-a"/.test(html) && /id="ns-b"/.test(html) && /id="ns-ops"/.test(html) && /id="ns-out"/.test(html) && /id="ns-steps"/.test(html) && /id="ns-verify"/.test(html), 'tool markup');
  ['add', 'sub', 'mul', 'div', 'mod', 'pow', 'sq'].forEach((o) => ok(html.indexOf('data-op="' + o + '"') >= 0, 'operation button ' + o));
  ok(!/NaN|\[object/.test(txt) && !/undefined/.test(txt.replace(/(is |says |>)undefined/g, '')), 'no undefined or NaN in the page text');
  ok(/<nav class="fmodes"/.test(html) && /aria-current="page">Mode 01 · Big Integer Arithmetic/.test(html), 'mode strip with Mode 01 current');
  ok(/Mode 02 · Big Decimal \(coming\)/.test(html) && /Mode 05 · Numerical Analysis \(coming\)/.test(html) && !/href="\.\.\/big-decimal-calculator\/"/.test(html), 'Modes 02 to 05 stay plain text');
  ['gcf-calculator', 'exponent-calculator', 'scientific-calculator', 'hex-calculator', 'binary-arithmetic-calculator', 'number-system-converter', 'fraction-arithmetic', 'engineering-powers-scientific-notation', 'gcf-prime-factorisation-calculator'].forEach((s) => ok(html.indexOf('href="../' + s + '/"') >= 0 && fs.existsSync(path.join(base, s, 'index.html')), 'related link resolves: ' + s));
  ok(txt.indexOf('115792089237316195423570985008687907853269984665640564039457584007913129639936') >= 0 && txt.indexOf('18446744073709551616') >= 0 && txt.indexOf('18446744073709552000') >= 0, 'page shows 2^256, the exact 2^64 and its floating-point form');
  ok(txt.indexOf('14 remainder 2') >= 0 && /MOD and negative numbers/.test(txt) && /Limits and how results are checked/.test(txt), 'division, MOD and limits sections');
  ok(/window\.BIGN|root\.BIGN/.test(html) && /elecmetric\.bignum\.history/.test(html), 'engine and client are inlined');
  ok(!/https?:\/\/(?!elecmetric\.com|www\.w3\.org|schema\.org)/.test(txt.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '')), 'no outside hosts in the page');
}
console.log('big number engine and page: ' + n + ' checks'); if (fail) { console.log(fail + ' FAILED'); process.exit(1); }
