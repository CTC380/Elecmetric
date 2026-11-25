/* Tests for tools/proportion_engine.js (Ratio Calculator, Mode 02, Proportion Solver) against tests/proportion_vectors.json (independent: gen_proportion_vectors.py, Python
   fractions.Fraction and sympy, with a brute-force grid search for the zero cases) and the fixed cases from the Ratio Calculator CEO decision note. */
const P = require('../tools/proportion_engine.js'), V = require('./proportion_vectors.json'), fs = require('fs'), path = require('path');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 20) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const S = (a, b, c, d, places) => P.solve({ a, b, c, d, places });
const clean = (r) => !/undefined|NaN|\[object|null/.test(JSON.stringify([r.steps, r.rows, r.sentence, r.summary, r.terms, r.valueText, r.valueSub]).replace(/is undefined/g, ''));
for (const [t, status, label, val, vdec, comp, simp, scale, cross] of V.solve) {
  const tag = '[' + t.join(' | ').slice(0, 70) + ']', r = S(t[0], t[1], t[2], t[3], 4);
  if (!r.ok) { bad(tag + ' rejected: ' + r.error); continue; }
  eq(r.status, status, 'status ' + tag); eq(r.label, label, 'unknown label ' + tag); eq(r.valueExact, val, 'exact value ' + tag);
  eq(r.completedText, comp, 'completed proportion ' + tag); eq(r.left, simp, 'simplest form ' + tag); eq(r.scale, scale, 'scale factor ' + tag);
  eq(r.crossLeft === null ? null : r.crossLeft + ' = ' + r.crossRight, cross, 'cross products ' + tag);
  if (status === 'solved') {
    eq(r.valueSub, vdec, 'decimal of the value at 4 places ' + tag); eq(r.valueText, label + ' = ' + val, 'headline ' + tag); eq(r.right, simp, 'both sides reduce to the same ratio ' + tag);
    eq(Array.isArray(r.bars) && r.bars[0][0] === r.bars[1][0], true, 'equal ratio bars ' + tag);
    eq(r.verify.length >= 5 && r.verify.every((x) => x[1] === true), true, 'every check passed ' + tag);
  } else { eq(r.valueExact, null, 'no value ' + tag); eq(r.bars, null, 'no bars ' + tag); }
  eq(r.verifyOk, true, 'checks ' + tag);
  eq(Array.isArray(r.steps) && r.steps.length >= 4 && r.steps.every((s) => typeof s === 'string' && s.length > 8), true, 'working ' + tag); eq(clean(r), true, 'no undefined or NaN text ' + tag);
  eq(r.terms.length, 4, 'four terms listed ' + tag); eq(r.terms[['A', 'B', 'C', 'D'].indexOf(label)].entered, 'x (to find)', 'unknown marked ' + tag);
  // the same input with the missing term typed as x, X or ? gives the same answer
  const i = ['A', 'B', 'C', 'D'].indexOf(label), t2 = t.slice(); t2[i] = ['x', 'X', '?', '_', '  '][n % 5]; const r2 = S(t2[0], t2[1], t2[2], t2[3], 4);
  eq(r2.ok && r2.status + '|' + r2.valueExact + '|' + r2.completedText, status + '|' + val + '|' + comp, 'x marker gives the same result ' + tag);
}
for (const [t, holds, l, r_, cl, cr, scale, sug] of V.verify) {
  const tag = '[' + t.join(' : ').slice(0, 70) + ']', r = S(t[0], t[1], t[2], t[3], 4);
  if (!r.ok) { bad(tag + ' rejected: ' + r.error); continue; }
  eq(r.status, holds ? 'holds' : 'fails', 'is it a proportion ' + tag); eq(r.left, l, 'simplest A:B ' + tag); eq(r.right, r_, 'simplest C:D ' + tag);
  eq(r.crossLeft, cl, 'A x D ' + tag); eq(r.crossRight, cr, 'B x C ' + tag); eq(r.scale, scale, 'scale factor ' + tag);
  eq((cl === cr), holds, 'cross products agree exactly when it is a proportion ' + tag); eq((l === r_), holds, 'simplest forms agree exactly when it is a proportion ' + tag);
  eq(r.verifyOk, true, 'checks ' + tag); eq(r.verify.every((x) => x[1] === true), true, 'every check passed ' + tag);
  const row = r.rows.find((x) => x[0] === 'To make it a proportion');
  if (sug === null) eq(!!row, false, 'no suggestion ' + tag); else eq(!!row && row[1].indexOf('D = ' + sug) === 0, true, 'suggested D ' + tag + ' got ' + (row && row[1]));
  eq(clean(r), true, 'no undefined or NaN text ' + tag); eq(r.valueText, holds ? 'True proportion' : 'Not a proportion', 'headline ' + tag);
}
V.err.forEach((t, k) => { const r = S(t[0], t[1], t[2], t[3]); eq(r.ok, false, 'must refuse [' + t.join(' | ') + ']'); eq(typeof r.error === 'string' && r.error.length > 5 && r.empty !== true, true, 'message [' + t.join(' | ') + ']'); eq(r.termIndex, V.errbad[k], 'bad field [' + t.join(' | ') + ']'); });
V.empty.forEach((t) => { const r = S(t[0], t[1], t[2], t[3]); eq(r.ok === false && r.empty === true && typeof r.hint === 'string' && r.hint.length > 5, true, 'empty or too few terms flagged with a hint [' + t.join(' | ') + ']'); });
// the CEO note, by exact text
const sv = S('3', '4', '9', '');
eq(sv.valueText, 'D = 12', '3:4 = 9:x gives x = 12'); eq(sv.completedText, '3 : 4 = 9 : 12', 'completed 3:4 = 9:12'); eq(sv.steps.some((s) => s.indexOf('3 \u00d7 x = 36') >= 0 && s.indexOf('x = 36 \u00f7 3 = 12') >= 0), true, 'cross multiplication 3x = 4 x 9');
eq(sv.steps.some((s) => s.indexOf('3 \u00d7 x = 4 \u00d7 9') >= 0), true, 'the cross-product equation is written with the entered values'); eq(sv.crossLeft + ' = ' + sv.crossRight, '36 = 36', 'cross products 36 = 36');
eq(S('3', '4', '9', '').left, '3 : 4', 'equivalent ratio verification: 3:4'); eq(S('3', '4', '9', '').right, '3 : 4', 'equivalent ratio verification: 9:12 is 3:4'); eq(S('3', '4', '9', '').scale, '3', 'scale factor 3');
eq(S('400', '5', '240', '').valueText, 'D = 3', 'CT 400:5 = 240:x gives 3 A secondary'); eq(S('400', '5', '240', '').left, '80 : 1', 'CT ratio simplifies to 80:1'); eq(S('11000', '110', '6600', '').valueText, 'D = 66', 'PT 11000:110 = 6600:x gives 66 V');
eq(S('1.5', '2.5', '3', '').valueText, 'D = 5', 'decimals are exact'); eq(S('1/2', '3/4', '10', '').valueText, 'D = 15', 'fractions'); eq(S('2 1/2', '5', '3', '').valueText, 'D = 6', 'mixed numbers'); eq(S('1e3', '2e3', '5', '').valueText, 'D = 10', 'scientific notation');
eq(S('2', '3', '5', '').valueText, 'D = 15/2', 'a non-whole answer is exact'); eq(S('2', '3', '5', '', 4).valueSub, '7.5000', 'and as a decimal'); eq(S('2', '3', '5', '').valueSub, '7.5', 'automatic places: exact decimal'); eq(S('1', '3', '1', '', 4).valueExact, '3', '1:3 = 1:x'); eq(S('3', '7', '2', '', 4).valueSub, '\u2248 4.6667', '14/3 is rounded and marked approximate'); eq(S('3', '7', '2', '', 0).valueSub, '\u2248 5', 'zero places');
eq(S('3', '7', '2', '', 13).ok, false, 'too many places refused'); eq(S('3', '7', '2', '', -1).ok, false, 'negative places refused'); eq(S('3', '7', '2', '', 1.5).ok, false, 'fractional places refused');
// order of the terms matters
eq(S('2', '3', '', '9').valueText, 'C = 6', '2:3 = x:9'); eq(S('3', '2', '', '9').valueText, 'C = 13.5'.replace('13.5', '27/2'), '3:2 = x:9 is not 2:3 = x:9');
// every position
['', '4', '9', '12'].forEach(() => 0); eq(S('', '4', '9', '12').valueText, 'A = 3', 'A missing'); eq(S('3', '', '9', '12').valueText, 'B = 4', 'B missing'); eq(S('3', '4', '', '12').valueText, 'C = 9', 'C missing'); eq(S('3', '4', '9', '').valueText, 'D = 12', 'D missing');
// zero handling
eq(S('0', '5', '3', '').status, 'none', '0:5 = 3:x has no solution'); eq(S('0', '5', '0', '').status, 'any', '0:5 = 0:x holds for any non-zero x'); eq(S('3', '4', '0', '').status, 'none', '3:4 = 0:x would need x = 0 and 0:0 is not a ratio');
eq(/0 : 0/.test(S('3', '4', '0', '').steps.join(' ')), true, 'the 0:0 reason is given'); eq(S('5', '0', '3', '').valueText, 'D = 0', '5:0 = 3:x gives x = 0 (3:0)'); eq(S('5', '0', '3', '').left, '1 : 0', '5:0 simplifies to 1:0');
eq(S('0', '0', '3', '').ok, false, 'A and B both 0 refused'); eq(/0 : 0/.test(S('0', '0', '3', '').error), true, 'the 0:0 message'); eq(S('1', '2', '0', '0').ok, false, 'C and D both 0 refused'); eq(S('0', '0', '1', '2').ok, false, 'all four given with 0:0 refused');
eq(S('-3', '4', '9', '').ok, false, 'negative refused'); eq(/cannot be negative/.test(S('-3', '4', '9', '').error), true, 'negative message'); eq(S('3', '4', '9', '', 'auto').ok, true, 'automatic places accepted'); eq(S('3', '4', '9', '', '').ok, true, 'empty places means automatic');
// verification mode
eq(S('3', '4', '9', '12').valueText, 'True proportion', '3:4 = 9:12 is true'); eq(S('3', '4', '9', '13').valueText, 'Not a proportion', '3:4 = 9:13 is not'); eq(S('2', '3', '4', '6').status, 'holds', '2:3 = 4:6'); eq(S('2', '3', '3', '2').status, 'fails', '2:3 and 3:2 differ');
eq(S('3', '4', '9', '13').rows.find((x) => x[0] === 'To make it a proportion')[1].indexOf('D = 12'), 0, 'suggests D = 12');
// big numbers and the twelve digits of the engine
eq(S('1' + '0'.repeat(40), '2' + '0'.repeat(40), '3', '').valueExact, '6', 'two 41-digit terms'); eq(S('1', '2', '3' + '0'.repeat(40), '').valueExact, '6' + '0'.repeat(40), 'a 41-digit answer');
eq(S('3', '4', '9', '').summary.split('\n').length >= 5, true, 'the summary has several lines'); eq(S('3', '4', '9', '').warnings.length, 0, 'no warning for whole numbers'); eq(S('1.5', '2.5', '3', '').warnings.length, 1, 'a note that decimals are read exactly');
// the built page and the mode strip
const html = fs.readFileSync(path.join(__dirname, '..', 'calculators', 'proportion-calculator', 'index.html'), 'utf8');
['<h1>Proportion Calculator</h1>', 'id="ns-a"', 'id="ns-b"', 'id="ns-c"', 'id="ns-d"', 'id="ns-pl"', 'Mode 02', 'Proportion Solver', 'Ratio Distribution (coming)', 'href="../equivalent-ratio-calculator/"', 'href="../ratio-calculator/"'].forEach((s) => eq(html.indexOf(s) >= 0, true, 'page has ' + s));
const m1 = fs.readFileSync(path.join(__dirname, '..', 'calculators', 'ratio-calculator', 'index.html'), 'utf8');
eq(m1.indexOf('href="../proportion-calculator/"') >= 0 && m1.indexOf('Proportion Solver (coming)') < 0, true, 'Mode 01 page links to Mode 02');
console.log('proportion_test: ' + n + ' checks, ' + fail + ' failures'); process.exit(fail ? 1 : 0);
