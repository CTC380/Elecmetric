/* Tests for tools/ratio_engine.js (Ratio Calculator, Mode 01, Ratio Simplifier) against tests/ratio_vectors.json (independent: gen_ratio_vectors.py, Python fractions.Fraction
   with a second, brute-force route to the simplest form) and the fixed cases from the Ratio Calculator CEO decision note. */
const Rt = require('../tools/ratio_engine.js'), V = require('./ratio_vectors.json'), fs = require('fs'), path = require('path');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 20) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const S = (ratio, places) => Rt.simplify({ ratio, places });
for (const [text, simp, whole, g, L, k, shares, dec4, pct2, ab, abDec] of V.ok) {
  const t = '[' + text.slice(0, 40) + ']', r = Rt.simplify({ ratio: text, places: 4 });
  if (!r.ok) { bad(t + ' rejected: ' + r.error); continue; }
  eq(r.simplified.join(','), simp.join(','), 'simplified ' + t); eq(r.whole.join(','), whole.join(','), 'whole-number form ' + t);
  eq(r.gcd, g, 'gcd ' + t); eq(r.lcm, L, 'lcm ' + t); eq(r.scale, k, 'scale factor ' + t); eq(r.n, simp.length, 'term count ' + t);
  eq(r.ratioText, simp.join(' : '), 'ratio text ' + t);
  eq(r.shareRows.map((x) => x.fraction).join(','), shares.join(','), 'share fractions ' + t);
  eq(r.shareRows.map((x) => x.decimal).join(','), dec4.join(','), 'share decimals at 4 places ' + t);
  const p2 = Rt.simplify({ ratio: text, places: 2 }); eq(p2.shareRows.map((x) => x.percent).join(','), pct2.map((x) => x + '%').join(','), 'share percents at 2 places ' + t);
  eq(r.fraction, ab, 'A/B fraction ' + t);
  if (ab !== null) { const row = r.rows.find((x) => x[0] === 'Decimal A/B'); eq(row && row[1], abDec, 'A/B decimal at 4 places ' + t); }
  eq(r.verifyOk, true, 'exact checks ' + t); eq(r.verify.length >= 5 && r.verify.every((x) => x[1] === true), true, 'every check passed ' + t);
  eq(Array.isArray(r.steps) && r.steps.length >= 5 && r.steps.every((s) => typeof s === 'string' && s.length > 8), true, 'working ' + t);
  eq(/undefined|NaN|\[object|null/.test(JSON.stringify([r.steps, r.rows, r.equation, r.shareRows, r.summary]).replace(/is undefined/g, '')), false, 'no undefined or NaN text ' + t);
  eq(r.already, simp.join(':') === text.replace(/\s/g, '').replace(/,/g, ''), 'already-simplest flag ' + t);
}
for (const e of V.err) { const r = S(e); eq(r.ok, false, 'must refuse [' + e + ']'); eq(typeof r.error === 'string' && r.error.length > 5, true, 'message [' + e + ']'); }
for (const e of V.empty) { const r = S(e); eq(r.ok === false && r.empty === true && typeof r.hint === 'string' && r.hint.length > 5, true, 'empty input flagged with a hint [' + e + ']'); }
// the CEO note, by exact text
const T = (x) => S(x).ratioText;
eq(T('12:18'), '2 : 3', '12:18'); eq(T('45:60'), '3 : 4', '45:60'); eq(T('1.5:2.5'), '3 : 5', '1.5:2.5'); eq(T('400:5'), '80 : 1', '400:5 CT ratio');
eq(S('12:18').gcd, '6', 'GCD(12,18) = 6'); eq(S('2:3', 2).shareRows.map((x) => x.percent).join(' '), '40.00% 60.00%', '2:3 as share of total (40% and 60%)'); eq(S('2:3').shareRows.map((x) => x.percent).join(' '), '40% 60%', 'auto places: 2:3 shares are exactly 40% and 60%');
eq(S('2:3').fraction, '2/3', 'fraction A/B of 2:3'); eq(S('2:3', 4).rows.find((x) => x[0] === 'Decimal A/B')[1], '\u2248 0.6667', 'decimal A/B of 2:3 is 0.6667');
eq(S('2:3', 2).rows.find((x) => x[0] === 'A as a percentage of B')[1], '\u2248 66.67%', 'A as a percentage of B is 66.67%');
eq(S('2:3').shareRows[0].percent, '40%', "A's share of total 40%"); eq(S('2:3').shareRows[1].percent, '60%', "B's share of total 60%");
eq(T('2:3') === T('3:2'), false, '2:3 and 3:2 are different ratios'); eq(T('3:2'), '3 : 2', 'order is kept');
eq(S('2:3:4').ratioText, '2 : 3 : 4', 'three-term 2:3:4 is already simplest'); eq(S('900:600:400').ratioText, '9 : 6 : 4', '900:600:400'); eq(S('2:3:4').shareRows.map((x) => x.fraction).join(' '), '2/9 1/3 4/9', 'shares of 2:3:4');
eq(S('2:3').already, true, '2:3 is already simplest'); eq(S('4:6').already, false, '4:6 is not');
eq(S('0:5').ratioText, '0 : 1', '0:5'); eq(S('5:0').fraction, null, 'A/B undefined when B is 0'); eq(S('5:0').rows.some((x) => x[1] === 'Undefined'), true, 'undefined is stated');
eq(S('-1:2').ok, false, 'negative is refused'); eq(/cannot be negative/.test(S('-1:2').error), true, 'negative message'); eq(S('0:0').ok, false, 'all zero is refused'); eq(/greater than 0/.test(S('0:0').error), true, 'zero message');
eq(S('1/2:3/4').ratioText, '2 : 3', 'fractions'); eq(S('2 1/2:5').ratioText, '1 : 2', 'mixed number'); eq(S('0.25:0.75:1.25').ratioText, '1 : 3 : 5', 'decimals'); eq(S('1e3:2e3').ratioText, '1 : 2', 'scientific notation');
eq(S('1\u22362').ratioText, '1 : 2', 'the ratio sign is read as a colon'); eq(S(' 12 : 18 ').ratioText, '2 : 3', 'spaces are ignored');
eq(S('12:18', 13).ok, false, 'too many places refused'); eq(S('12:18', -1).ok, false, 'negative places refused'); eq(S('12:18', 1.5).ok, false, 'fractional places refused'); eq(S('1:2', 0).shareRows[0].percent, '\u2248 33%', 'zero places rounds and says approximate'); eq(S('12:18', 0).shareRows[0].percent, '40%', 'zero places and an exact value: no approximate sign');
eq(S('1:2:3:4:5:6:7:8:9:10:11:12').ok, true, 'twelve terms accepted'); eq(S('1:2:3:4:5:6:7:8:9:10:11:12:13').ok, false, 'thirteen terms refused');
eq(S('1' + '0'.repeat(40) + ':' + '2' + '0'.repeat(40)).ratioText, '1 : 2', 'two 41-digit terms'); eq(S('1'.repeat(61) + ':1').ok, false, '61 digits refused');
eq(S('7:7').ratioText, '1 : 1', 'equal terms'); eq(S('7:7').verify.every((x) => x[1]), true, 'equal terms verified');
// auto places: exact when the decimal terminates, six places when not
eq(S('3:4').rows.find((x) => x[0] === 'Decimal A/B')[1], '0.75', 'auto: 3/4 = 0.75 exact'); eq(S('2:3').rows.find((x) => x[0] === 'Decimal A/B')[1], '\u2248 0.666667', 'auto: 2/3 rounded to six places');
// the built page
const html = fs.readFileSync(path.join(__dirname, '..', 'calculators', 'ratio-calculator', 'index.html'), 'utf8');
['<h1>Ratio Calculator</h1>', 'id="ns-r"', 'id="ns-pl"', 'Mode 01', 'href="../proportion-calculator/"', 'Ratio Distribution (coming)', 'Ratio Simplifier', 'href="../equivalent-ratio-calculator/"'].forEach((s) => eq(html.indexOf(s) >= 0, true, 'page has ' + s));
eq(html.indexOf('Verification register entry'), -1, 'old registry page replaced');
eq(require('../tools/heading_standard.js').standardise('calculators/ratio-calculator/index.html', fs.readFileSync(path.join(__dirname, '..', 'tools', 'standalone', 'ratio-calculator.html'), 'utf8')) === require('../tools/breadcrumbs.js').strip(html), true, 'standalone source equals built page (the breadcrumb trail is added by tools/breadcrumbs.js)');
console.log('ratio_test: ' + n + ' checks, ' + fail + ' failures'); process.exit(fail ? 1 : 0);
