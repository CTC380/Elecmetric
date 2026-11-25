/* Tests for tools/round_engine.js (Rounding Calculator, Mode 01, Decimal Place Rounding) against tests/round_vectors.json (independent: gen_round_vectors.py,
   Python Decimal.quantize and Fraction, which must agree before a vector is written), the fixed cases from the Rounding Calculator CEO decision note,
   the floating-point comparison, and the built page calculators/rounding-calculator/index.html. */
const R = require('../tools/round_engine.js'), V = require('./round_vectors.json'), fs = require('fs'), path = require('path');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 20) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const ok = (c, m) => { n++; if (!c) bad(m); };
const S = (t, p, r, extra) => R.solve(Object.assign({ text: t, places: p, rule: r || 'away' }, extra || {}));
const clean = (r) => !/undefined|NaN|\[object|null/.test(JSON.stringify([r.steps, r.rows, r.sentence, r.summary, r.notes, r.warnings, r.verify, r.alts]));
const groups = new Map();
for (const [t, p, rule, res, resMin, ad, dir, tie, exact] of V.cases) {
  const tag = '[' + t.slice(0, 40) + ' @' + p + ' ' + rule + ']', r = S(t, p, rule, { keepZeros: true });
  if (!r.ok) { bad(tag + ' rejected: ' + r.error); continue; }
  eq(r.result, res, 'result ' + tag); eq(S(t, p, rule, { keepZeros: false }).result, resMin, 'result without trailing zeros ' + tag); eq(r.resultMinimal, resMin, 'resultMinimal ' + tag);
  eq(r.absDiff, ad, 'absolute difference ' + tag); eq(r.direction, dir, 'direction ' + tag); eq(r.tie, tie, 'tie flag ' + tag); eq(r.exact, exact, 'exact flag ' + tag);
  eq(r.verifyOk, true, 'checks ' + tag); eq(r.verify.every((x) => x[1] === true), true, 'every check passed ' + tag); eq(r.verify.length, 6, 'number of checks ' + tag);
  eq(Array.isArray(r.steps) && r.steps.length >= 4 && r.steps.every((s) => typeof s === 'string' && s.length > 8), true, 'working ' + tag); eq(clean(r), true, 'no undefined or NaN text ' + tag);
  eq(/^-0(\.0*)?$/.test(r.result), false, 'no negative zero ' + tag); eq(r.alts.length, 9, 'nine alternatives ' + tag); eq(r.alts.filter((a) => a.current).length, 1, 'one selected alternative ' + tag);
  eq(r.alts.find((a) => a.current).result, r.result, 'selected alternative is the result ' + tag);
  const key = t + '|' + p; if (!groups.has(key)) groups.set(key, {}); groups.get(key)[rule] = res;
  // rounding the result again changes nothing; the mirror property holds
  if (r.result.replace(/^-|\./g, '').length <= R.MAX_DIGITS) eq(S(r.result, p, rule).result, r.result, 'idempotent ' + tag); /* a longer result is checked inside the engine; the public parser stops at 1000 digits */
  const neg = t.charAt(0) === '-' ? t.slice(1) : '-' + t, m = R.MIRROR[rule], mr = S(neg, p, m, { keepZeros: true });
  if (mr.ok) { const a = mr.result.charAt(0) === '-' ? mr.result.slice(1) : '-' + mr.result; eq(/^-?0(\.0*)?$/.test(res) ? a.replace(/^-/, '') : a, /^-?0(\.0*)?$/.test(res) ? res.replace(/^-/, '') : res, 'mirror ' + tag); }
}
// the alternatives table of every (number, places) agrees with the independent vector of each rule
for (const [key, byRule] of groups) {
  const [t, p] = [key.slice(0, key.lastIndexOf('|')), key.slice(key.lastIndexOf('|') + 1)], r = S(t, p, 'away', { keepZeros: true });
  if (Object.keys(byRule).length === 9) r.alts.forEach((a) => eq(a.result, byRule[a.id], 'alternative ' + a.id + ' of [' + t.slice(0, 30) + ' @' + p + ']'));
}
// the floating-point note against Python's exact binary value
for (const [t, p, differs, fl, stored] of V.floats) {
  const r = S(t, p), tag = '[' + t + ' @' + p + ']';
  eq(r.floatNote !== null, differs, 'float note present ' + tag);
  if (differs) { eq(r.floatNote.floatResult, fl, 'floating-point result ' + tag); eq(r.floatNote.stored, stored, 'stored binary value ' + tag); eq(/binary floating point/.test(r.floatNote.text), true, 'float text ' + tag); }
}
V.err.forEach((t) => { const r = S(t, 2); eq(r.ok, false, 'must refuse [' + t.slice(0, 40) + ']'); eq(typeof r.error === 'string' && r.error.length > 10 && r.empty !== true, true, 'message for [' + t.slice(0, 40) + ']'); });
V.badPlaces.forEach((p) => { const r = S('1.5', p); eq(r.ok, false, 'places must be refused [' + p + ']'); eq(typeof r.error === 'string' && r.error.length > 10, true, 'places message [' + p + ']'); });
V.empty.forEach((t) => { const r = S(t, 2); eq(r.ok === false && r.empty === true && typeof r.hint === 'string' && r.hint.length > 5, true, 'empty number flagged with a hint [' + t + ']'); });
eq(S('1.5', '').empty, true, 'empty places flagged with a hint'); eq(S('1.5', undefined).empty, true, 'missing places flagged with a hint'); eq(S('1.5', 2, 'nope').ok, false, 'unknown rule refused');
// the CEO note, by exact text
const exp = [['15.496', 2, 'away', '15.50'], ['2.675', 2, 'away', '2.68'], ['3.14159265', 3, 'away', '3.142'], ['1499', -2, 'away', '1500'], ['-2.5', 0, 'away', '-3'], ['-2.5', 0, 'even', '-2'], ['8.999', 0, 'floor', '8'], ['-2.1', 0, 'ceiling', '-2'], ['1,499', -1, 'away', '1500'], ['1,499', -2, 'away', '1500'], ['1,499', -3, 'away', '1000'], ['12,345', -2, 'away', '12300'], ['230.4567', 0, 'away', '230'], ['230.4567', 1, 'away', '230.5'], ['230.4567', 2, 'away', '230.46'], ['230.4567', 3, 'away', '230.457']];
exp.forEach(([t, p, rule, res]) => eq(S(t, p, rule).result, res, 'CEO note ' + t + ' @' + p + ' ' + rule));
eq(S('15.496', 2).absDiff, '0.004', 'CEO note difference 0.004'); eq(S('2.675', 2).absDiff, '0.005', 'CEO note difference 0.005'); eq(S('2.675', 2).direction, 'up', 'direction up');
// the tie table of the CEO note (2.5 and -2.5 to a whole number)
const ties = { away: ['3', '-3'], toward0: ['2', '-2'], even: ['2', '-2'], odd: ['3', '-3'], posinf: ['3', '-2'], neginf: ['2', '-3'], ceiling: ['3', '-2'], floor: ['2', '-3'], truncate: ['2', '-2'] };
for (const k in ties) { eq(S('2.5', 0, k).result, ties[k][0], 'tie table 2.5 ' + k); eq(S('-2.5', 0, k).result, ties[k][1], 'tie table -2.5 ' + k); }
eq(S('-5.5', 0, 'posinf').result, '-5', 'half towards +inf: -5.5 -> -5 (the Calculator.net "half up")'); eq(S('-5.5', 0, 'away').result, '-6', 'half away from zero: -5.5 -> -6');
// trailing zeros, scientific notation, separators
eq(S('15.496', 2, 'away', { keepZeros: false }).result, '15.5', 'trailing zero removed'); eq(S('15.5', 3).result, '15.500', 'padded to three places'); eq(S('15.5', 3, 'away', { keepZeros: false }).result, '15.5', 'not padded when switched off');
eq(S('1234567.891', 1, 'away', { group: true }).resultShown, '1,234,567.9', 'thousands separators'); eq(S('1234567.891', 1, 'away', { group: true }).result, '1234567.9', 'plain result stays plain');
eq(S('15.496', 2).sci, '1.550 \u00d7 10^1', 'scientific notation keeps the trailing zero'); eq(S('15.496', 2, 'away', { keepZeros: false }).sci, '1.55 \u00d7 10^1', 'scientific notation without it'); eq(S('1499', -2).sci, '1.5 \u00d7 10^3', 'integer scientific notation'); eq(S('-0.004876', 5).sciE, '-4.88e-3', 'negative scientific notation'); eq(S('0.001', 0).sci, '0', 'zero');
eq(S('1.5e3', -2).result, '1500', 'scientific input'); eq(S('1.5\u00d710^3', -2).result, '1500', 'times ten to the power input'); eq(S('1.5 \u00d7 10\u207b\u00b3', 4).result, '0.0015', 'superscript exponent input'); eq(S('\u22122.5', 0).result, '-3', 'unicode minus');
eq(S('-0.001', 2).result, '0.00', 'negative that rounds to zero is not negative'); eq(S('-0.001', 2).notes.some((x) => /negative zero/.test(x)), true, 'negative zero note');
eq(S('9.996', 2).carry, true, 'carry flagged'); eq(S('9.996', 2).steps.some((x) => /carry/.test(x)), true, 'carry in the working'); eq(S('15.496', 2).carry, false, 'no carry');
eq(S('2.675', 2).tie, true, '2.675 is a tie at two places'); eq(S('2.675', 2).notes.some((x) => /exactly halfway/.test(x)), true, 'tie note'); eq(S('15.496', 2).floatNote, null, 'no float note where binary agrees');
eq(S('2.675', 2).floatNote.floatResult, '2.67', 'binary floating point gives 2.67'); eq(S('2.675', 2).floatNote.stored, '2.67499999999999982236431605997495353221893310546875', 'exact stored value of 2.675');
eq(S('1.5', 4).notes.some((x) => /fewer than the 4 asked for/.test(x)), true, 'places beyond the digits explained');
eq(S('15.496', 2).lower + '/' + S('15.496', 2).upper, '15.49/15.50', 'neighbouring multiples'); eq(S('15.49', 2).lower, null, 'exact number has no neighbours');
eq(S('15.496', 2).halfUnit, '0.005', 'half a unit'); eq(S('15.496', 2, 'floor').halfUnit, '0.005', 'half unit is still reported'); eq(S('1499', -2).unit, '100', 'unit for negative places');
eq(S('15.496', 2).placeName, 'hundredths', 'place name'); eq(S('1499', -2).placeName, 'hundreds', 'place name, hundreds'); eq(R.placesText(-1), '-1 decimal places (nearest ten)', 'places text, tens'); eq(R.placesText(0), '0 decimal places (nearest whole number)', 'places text, whole');
// limits
eq(S('1' + '0'.repeat(999), 0).ok, true, '1000 digits accepted'); eq(S('1' + '0'.repeat(1000), 0).ok, false, '1001 digits refused'); eq(S('1.5', 1000).ok, true, '1000 places accepted'); eq(S('1.5', -1000).result, '0', '-1000 places of 1.5 is 0'); eq(S('1.5', 1001).ok, false, '1001 places refused');
eq(S('1e1000', -1000).result, '1' + '0'.repeat(1000), '10^1000 at -1000 places'); eq(S('1e1001', 0).ok, false, 'exponent beyond 1000 refused');
// shared entry point and independence from Math.round
eq(R.roundString('2.675', 2), '2.68', 'roundString'); eq(R.roundString('abc', 2), null, 'roundString refuses');
eq(R.roundString('0.1', 20), '0.10000000000000000000', 'exact decimal, no 0.1000000000000000055 noise');
eq(S('0.30000000000000004', 16).result, '0.3000000000000000', 'a floating-point artefact rounds to 0.3');
// the engine source does not use Math.round or toFixed to produce a result
const src = fs.readFileSync(path.join(__dirname, '..', 'tools', 'round_engine.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
ok(!/Math\.round|Math\.floor|Math\.ceil/.test(src), 'engine does not use Math.round, floor or ceil'); ok((src.match(/toFixed/g) || []).length === 1, 'toFixed is used once, only for the floating-point comparison');
// the built page
const hp = path.join(__dirname, '..', 'calculators', 'rounding-calculator', 'index.html');
if (fs.existsSync(hp)) {
  const html = fs.readFileSync(hp, 'utf8');
  ok(/<title>[^<]{20,60}<\/title>/.test(html), 'page title length'); const d = /name="description" content="([^"]*)"/.exec(html); ok(d && d[1].length >= 50 && d[1].length <= 160, 'meta description length');
  eq((html.match(/<h1>/g) || []).length, 1, 'one h1'); ok(/id="ns-in"/.test(html) && /id="ns-places"/.test(html) && /id="ns-rule"/.test(html) && /id="ns-out"/.test(html) && /id="ns-steps"/.test(html) && /id="ns-verify"/.test(html), 'tool markup');
  ok(/<option value="even"/.test(html) && (html.match(/<option value=/g) || []).length === 9, 'nine rounding rules in the selector');
  ok(!/undefined|NaN|\[object/.test(html.replace(/<script[\s\S]*?<\/script>/g, '')), 'no undefined or NaN in the page text');
  ok(/<nav class="fmodes"/.test(html) && /Rounding Calculator/.test(html) && /Mode 02 \u00b7 Significant Figures \(coming\)/.test(html), 'mode strip with later modes marked coming');
  ok(/href="\.\.\/rounding-sig-figs\/"/.test(html) && /href="\.\.\/engineering-measurement-analysis\/"/.test(html), 'related links');
  ok(/2\.68/.test(html) && /2\.67499999999999982236431605997495353221893310546875/.test(html) && /15\.50/.test(html), 'worked values on the page, computed by the engine');
  ok(/1,500/.test(html) && /12,300/.test(html), 'negative decimal places table');
  ok(/Half towards \+\u221e/.test(html) && /banker/.test(html), 'rule names on the page');
  ok(!/Math\.round/.test(html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/It never uses Math\.round or toFixed/, '')), 'page text does not recommend Math.round');
}
console.log('rounding engine and page: ' + n + ' checks'); if (fail) { console.log(fail + ' FAILED'); process.exit(1); }
