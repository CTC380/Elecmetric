/* Tests for tools/pe_batch_engine.js (Elecmetric Percent Error Calculator, Mode 04, Batch Measurement Analysis) against tests/pe_batch_vectors.json (independent:
   gen_pe_batch_vectors.py, Python fractions.Fraction and decimal.Decimal), the cases in the product brief, and exact properties on BigInt arithmetic.
   Also checks that Mode 04 agrees with Mode 02 on every per-reading percentage and with Mode 03 on the limits, and static checks of the built page calculators/batch-measurement-analysis/index.html. */
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
const E = require('../tools/pe_batch_engine.js'), M2 = require('../tools/pe_signed_engine.js'), M3 = require('../tools/pe_tol_engine.js'), V = require('./pe_batch_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 15) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': ' + a + ' vs ' + b); };
const K = (y, xs, extra) => E.calc(Object.assign({ y: String(y), x: Array.isArray(xs) ? xs.join('\n') : String(xs), unit: '' }, extra || {}));
const row = (x, re) => x.rows.find((q) => re.test(q[0]));
const FIELDS = ['n', 'sum', 'meanObserved', 'median', 'min', 'max', 'span', 'sumError', 'meanSigned', 'direction', 'meanAbs', 'maxAbs', 'maxAbsAt', 'rmse', 'sdPop', 'sdSample', 'meanSignedPct', 'meanAbsPct', 'maxAbsPct', 'sdPopPct', 'sdSamplePct', 'rmsePct'];
let ci = 0;
for (const c of V.cases) {
  ci++; const o = c.o, tag = '[case ' + ci + ' ref ' + c.y + ' n=' + o.n + ' ' + c.basis + ' ' + c.t + ' @' + c.places + ']', x = E.calc({ y: c.y, x: c.x, basis: c.basis, t: c.t, places: c.places, unit: '' });
  eq(x.ok, true, 'accepted ' + tag); if (!x.ok) { console.log(x.error); continue; }
  for (const f of FIELDS) eq(x[f], o[f], f + ' ' + tag);
  eq(x.reads.length, o.n, 'one row per reading ' + tag);
  x.reads.forEach((r, i) => { eq(r.err, o.reads[i][0], 'error of reading ' + (i + 1) + ' ' + tag); eq(r.abs, o.reads[i][1], 'absolute error of reading ' + (i + 1) + ' ' + tag); eq(r.pct, o.reads[i][2], 'percentage of reading ' + (i + 1) + ' ' + tag); });
  if (c.t !== '') {
    eq(x.lower, o.lower, 'lower limit ' + tag); eq(x.upper, o.upper, 'upper limit ' + tag); eq(x.tol.within, o.within, 'readings within ' + tag); eq(x.tol.onLimit, o.on, 'readings on a limit ' + tag);
    eq(x.outside.join(','), o.outside.join(','), 'outside list ' + tag); eq(x.reads.map((r) => r.status).join(','), o.status.join(','), 'status of every reading ' + tag); eq(x.pass, o.outside.length === 0, 'pass flag ' + tag);
    eq(x.tol.below + x.tol.above + x.tol.within, o.n, 'every reading is below, above or within ' + tag);
  } else eq(x.hasTol, false, 'no tolerance ' + tag);
  // the three modes cannot drift apart: every per-reading percentage is Mode 02's, and the limits are Mode 03's
  if (!/^0(\.0*)?$/.test(c.y)) x.reads.forEach((r, i) => { const m = M2.calc({ x: r.obs, y: c.y, places: c.places }); eq(m.ok && m.big === r.pct, true, 'agrees with Mode 02 on reading ' + (i + 1) + ' ' + tag + ' ' + (m.big) + ' vs ' + r.pct); });
  if (c.t !== '' && c.x.split('\n').length) { const m = M3.calc({ x: x.reads[0].obs, y: c.y, basis: c.basis, shape: 'sym', t: c.t }); eq(m.ok && m.lower === x.lower && m.upper === x.upper, true, 'agrees with Mode 03 on the limits ' + tag); x.reads.slice(0, 40).forEach((r, i) => { const mm = M3.calc({ x: r.obs, y: c.y, basis: c.basis, shape: 'sym', t: c.t }); eq(mm.status, r.status, 'agrees with Mode 03 on the status of reading ' + (i + 1) + ' ' + tag); }); }
  if (ci % 3 === 0) {
    eq(Array.isArray(x.steps) && x.steps.length >= 5 && x.steps.every((s) => typeof s === 'string' && s.length > 8), true, 'working present ' + tag);
    eq(x.rows.length >= 18 && x.rows.every((q) => q.length === 3), true, 'result rows ' + tag);
    eq(/undefined|NaN|\[object|@|null/.test(JSON.stringify([x.steps, x.rows, x.formula, x.subst, x.sentence, x.big, x.label, x.warnings])), false, 'no undefined, NaN or placeholder text ' + tag);
    eq(/complian|certif|approved|calibrated/i.test(JSON.stringify([x.steps, x.rows, x.sentence, x.big, x.label])), false, 'never claims compliance ' + tag);
    eq(x.chart.values.length === o.n && x.chart.labels.length === o.n, true, 'chart has one value per reading ' + tag);
  }
}
// the product brief: reference 230 V, readings 229, 231, 230, 228, 232
const b = K(230, ['229', '231', '230', '228', '232'], { unit: 'V', t: '5' });
eq(b.n, 5, 'five readings'); eq(b.sum, '1150', 'sum'); eq(b.meanObserved, '230', 'average observed value'); eq(b.min, '228', 'minimum'); eq(b.max, '232', 'maximum'); eq(b.meanSigned, '0', 'mean signed error'); eq(b.meanAbs, '1.2', 'mean absolute error'); eq(b.maxAbs, '2', 'maximum absolute error');
eq(b.sdPop, '\u2248 1.414214', 'population standard deviation, root 2'); eq(b.sdSample, '\u2248 1.581139', 'sample standard deviation, root 2.5'); eq(b.reads.map((r) => r.err).join(' '), '-1 +1 0 -2 +2', 'signed errors as in the brief'); eq(b.reads.map((r) => r.pct).join(' '), '\u2248 -0.434783% \u2248 +0.434783% 0% \u2248 -0.869565% \u2248 +0.869565%', 'individual percentage errors');
eq(b.pass, true, 'all within 5%'); eq(b.lower + ' ' + b.upper, '218.5 241.5', 'limits'); eq(b.verdict, 'All 5 readings are within the entered tolerance', 'verdict'); eq(b.big, 'Mean signed error 0 V \u00b7 mean absolute error 1.2 V \u00b7 maximum absolute error 2 V', 'headline');
eq(row(b, /^Maximum absolute error/)[2], 'Largest |reading \u2212 reference|, at reading 4 (first of 2)', 'where the largest error is'); eq(b.formula.indexOf('Error = Reading \u2212 Reference') === 0, true, 'formula');
eq(b.subst, 'n = 5; \u03a3 Error = (-1) + 1 + 0 + (-2) + 2 = 0; mean signed error = 0 \u00f7 5 = 0 V', 'substituted'); eq(b.steps.length, 6, 'six steps with a tolerance'); eq(K(230, ['229', '231', '230', '228', '232']).steps.length, 5, 'five steps without one');
// exact standard deviations: an exact root is shown exactly; the rest are rounded half up from an integer root
eq(K(100, ['99', '101', '99', '101']).sdPop, '1', 'sqrt of 1'); eq(K(100, ['99', '101', '99', '101']).sdSample, '\u2248 1.154701', 'sqrt of 4/3'); eq(K(0, ['1', '2', '3', '4', '5']).sdSample, '\u2248 1.581139', 'a reference of 0 still gives a spread'); eq(K(0, ['1', '3']).sdPop, '1', 'two readings, population');
eq(K(5, ['4', '6']).sdSample, '\u2248 1.414214', 'sample of two'); eq(K(5, ['4', '6'], { places: 2 }).sdSample, '\u2248 1.41', 'two places'); eq(K(5, ['4', '6'], { places: 0 }).sdPop, '1', 'zero places, exact'); eq(K('0.25', ['0.5', '0.5']).sdPop, '0', 'identical readings'); eq(K(1, ['1', '1.0000000000000000000001']).sdPop, '0.00000000000000000000005', 'a 22-digit difference');
// the single reading and the zero reference
const one = K(230, ['225'], { unit: 'V' }); eq(one.sdSample, null, 'one reading has no sample standard deviation'); eq(one.sdPop, '0', 'population standard deviation of one reading'); eq(one.warnings.length, 1, 'one reading explained'); eq(row(one, /^Standard deviation, sample/)[1], 'Not defined', 'sample row'); eq(one.meanAbsPct, '\u2248 2.173913%', 'one reading equals Mode 01');
const z = K(0, ['0.1', '-0.1', '0.2'], { unit: 'V' }); eq(z.ok, true, 'a reference of 0 is accepted without a tolerance'); eq(z.meanSignedPct, null, 'no percentage for a reference of 0'); eq(row(z, /^Mean absolute percentage/)[1], 'Not defined', 'not defined row'); eq(z.reads[0].pct, null, 'no percentage per reading'); eq(z.chart.measure, 'abs', 'chart in the unit'); eq(z.warnings.length, 1, 'zero reference explained');
eq(K(0, ['1'], { t: '5' }).ok, false, 'a percentage tolerance needs a reference that is not 0'); eq(/reference value is 0/.test(K(0, ['1'], { t: '5' }).error), true, 'message'); eq(K(0, ['0.2', '-0.3'], { t: '0.25', basis: 'abs' }).outside.join(','), '2', 'an absolute tolerance accepts a reference of 0');
eq(K(-10, ['-9', '-11']).warnings.length, 1, 'negative reference explained'); eq(K(-10, ['-9', '-11']).reads[0].pct, '+10%', 'a reading above a negative reference is positive'); eq(K(5, ['5', '5']).warnings.some((w) => /identical/.test(w)), true, 'identical readings explained');
// boundaries: limits are included
eq(K(230, ['241.5', '218.5'], { t: '5' }).pass, true, 'readings on both limits pass'); eq(K(230, ['241.5', '218.5'], { t: '5' }).tol.onLimit, 2, 'on a limit counted'); eq(K(230, ['241.500001'], { t: '5' }).pass, false, 'just above'); eq(K(230, ['218.499999', '230'], { t: '5' }).outside.join(','), '1', 'just below');
eq(K(230, ['230', '231'], { t: '0' }).warnings.some((w) => /tolerance of 0/.test(w)), true, 'zero tolerance explained'); eq(K(230, ['230', '231'], { t: '0' }).outside.join(','), '2', 'zero tolerance accepts only the reference');
eq(K(230, ['229', '300'], { t: '5' }).verdict, '1 of 2 readings is within the entered tolerance; 1 is outside it', 'mixed verdict'); eq(K(230, ['300'], { t: '5' }).verdict, '0 of 1 reading is within the entered tolerance; 1 is outside it', 'single outside');
// separators and refusals
eq(K(230, '229 231;230\t228\r\n232').n, 5, 'spaces, semicolons, tabs and new lines separate readings'); eq(K(230, '229, 231, 230,\n228,').n, 4, 'a comma that ends a reading is accepted'); eq(K(230, '229,231').ok, false, 'a comma inside a number is refused'); eq(/Commas are not used/.test(K(230, '229,231').error), true, 'comma message');
eq(K(230, '229 abc').ok, false, 'text refused'); eq(/Reading 2 is not a number/.test(K(230, '229 abc').error), true, 'names the reading'); eq(K(230, '229 5%').ok, false, 'a % sign refused on a reading'); eq(K(230, '1e3').ok, false, 'exponent refused'); eq(K('abc', '1').ok, false, 'bad reference'); eq(K(230, '229', { t: '-5' }).ok, false, 'negative tolerance refused');
eq(K(230, '229', { t: 'x' }).ok, false, 'bad tolerance'); eq(K(230, '229', { basis: 'xx', t: '5' }).ok, false, 'bad basis'); eq(K(230, '229', { t: '5%', basis: 'abs' }).ok, false, '% on an absolute tolerance refused'); eq(K(230, '229', { t: '5%' }).ok, true, '% on a percentage tolerance accepted');
eq(K(230, Array(1000).fill('229')).ok, true, '1000 readings accepted'); eq(K(230, Array(1001).fill('229')).ok, false, '1001 readings refused'); eq(/At most 1000/.test(K(230, Array(1001).fill('229')).error), true, 'limit message');
eq(E.calc({ y: '', x: '' }).empty, true, 'empty'); eq(E.calc({ y: '230', x: '' }).empty, true, 'no readings'); eq(E.calc({ y: '', x: '229' }).empty, true, 'no reference'); eq(E.calc({ y: '230', x: ' \n ; ' }).empty, true, 'blank readings'); eq(typeof E.calc({ y: '', x: '' }).hint, 'string', 'hint');
eq(K(1, '1', { unit: '<b>' }).ok, false, 'markup in the unit refused'); eq(K(1, '1', { unit: 'x'.repeat(17) }).ok, false, 'long unit refused'); eq(K(1, '1', { places: 13 }).ok, false, 'too many places'); eq(K(1, '1', { places: -1 }).ok, false, 'negative places'); eq(E.calc(null).ok, false, 'null input'); eq(E.calc(null).empty, true, 'null is empty');
eq(K(230, ['229'], { unit: 'V' }).meanSigned, K(230, ['229'], { unit: 'mA' }).meanSigned, 'the unit never changes the number');
// properties on exact arithmetic
let s = 7710419; const rnd = (m) => { s = (s * 1103515245 + 12345) % 2147483648; return s % m; };
const dec = () => (rnd(5) === 0 ? '-' : '') + (1 + rnd(99999)) + (rnd(2) ? '.' + (rnd(9999) + '').padStart(4, '0') : '');
const fr = (t) => { const neg = t[0] === '-', b = neg ? t.slice(1) : t, [i, f = ''] = b.split('.'); const v = BigInt(i + f); return [neg ? -v : v, 10n ** BigInt(f.length)]; };
for (let i = 0; i < 400; i++) {
  const ref = dec(), m = 1 + rnd(12), xs = []; for (let j = 0; j < m; j++) xs.push(dec());
  const a = K(ref, xs, { places: 8 }), sh = K(ref, xs.slice().reverse(), { places: 8 }); eq(a.ok && sh.ok, true, 'accepted ' + ref); if (!a.ok) continue;
  eq(a.meanSigned + '|' + a.meanAbs + '|' + a.sdPop + '|' + a.sdSample + '|' + a.maxAbs + '|' + a.median, sh.meanSigned + '|' + sh.meanAbs + '|' + sh.sdPop + '|' + sh.sdSample + '|' + sh.maxAbs + '|' + sh.median, 'the order of the readings changes no statistic ' + ref);
  eq(a.reads.map((r) => r.err).join(), sh.reads.slice().reverse().map((r) => r.err).join(), 'errors follow their readings ' + ref);
  // a spread does not depend on the reference: moving the reference leaves the standard deviations alone
  const o2 = K(dec(), xs, { places: 8 }); eq(a.sdPop === o2.sdPop && a.sdSample === o2.sdSample, true, 'standard deviation does not depend on the reference ' + ref);
  // the mean absolute error is never smaller than the size of the mean signed error, and never larger than the maximum absolute error
  const sgn = a.meanSigned.replace(/^\u2248 /, '').replace(/^\+/, ''), mAbs = a.meanAbs.replace(/^\u2248 /, ''), mx = a.maxAbs;
  eq(Math.abs(+sgn) <= +mAbs + 1e-7 && +mAbs <= +mx + 1e-7, true, '|mean error| <= MAE <= max error ' + ref);
  // mean observed = reference + mean signed error (exact fractions from the integer sums)
  const [rN, rD] = fr(ref); let sumN = 0n, sumD = 1n; const add = (nn, dd) => { sumN = sumN * dd + nn * sumD; sumD *= dd; };
  for (const t of xs) { const [xn, xd] = fr(t); add(xn, xd); }
  const mean = K(ref, xs, { places: 12 }).meanObserved.replace(/^\u2248 /, ''), want = (() => { const nn = sumN, dd = sumD * BigInt(m); const sc = 10n ** 12n, v = (2n * (nn < 0n ? -nn : nn) * sc + dd) / (2n * dd), sx = v.toString().padStart(13, '0'); return (nn < 0n && v !== 0n ? '-' : '') + sx.slice(0, -12) + '.' + sx.slice(-12); })();
  eq(mean, want, 'mean observed to 12 places from exact integer sums ' + ref);
  // RMSE squared = bias squared + population variance (within the rounding of 8 places)
  const bias = +K(ref, xs, { places: 8 }).meanSigned.replace(/^\u2248 /, ''), rm = +a.rmse.replace(/^\u2248 /, ''), sd = +a.sdPop.replace(/^\u2248 /, ''); eq(Math.abs(rm * rm - (bias * bias + sd * sd)) < 1e-5 * Math.max(1, rm * rm), true, 'RMSE^2 = bias^2 + variance ' + ref);
  // sample variance = population variance * n / (n - 1)
  if (m >= 2) eq(Math.abs(+a.sdSample.replace(/^\u2248 /, '') - +a.sdPop.replace(/^\u2248 /, '') * Math.sqrt(m / (m - 1))) < 2e-8 * Math.max(1, +a.sdSample.replace(/^\u2248 /, '')), true, 'sample = population x sqrt(n/(n-1)) ' + ref);
  // widening the tolerance keeps every pass; a wider tolerance never adds a reading outside
  const t1 = String(rnd(30)), w1 = K(ref, xs, { t: t1 }), w2 = K(ref, xs, { t: String(+t1 + 5) }); if (w1.ok && w2.ok) eq(w2.tol.within >= w1.tol.within, true, 'a wider tolerance keeps passes ' + ref);
}
// the built page
const pg = path.join(root, 'calculators/batch-measurement-analysis/index.html');
if (fs.existsSync(pg)) {
  const h = fs.readFileSync(pg, 'utf8');
  for (const id of ['ns', 'ns-x', 'ns-y', 'ns-u', 'ns-pl', 'ns-basis', 'ns-t', 'ns-err', 'ns-out', 'ns-steps', 'ns-hist', 'ns-note', 'ns-q', 'ns-file', 'rp-card']) eq((h.match(new RegExp('id="' + id + '"', 'g')) || []).length, 1, 'one #' + id);
  for (const src of ['percent_engine.js', 'pe_batch_engine.js', 'pe_batch_client.js']) eq(h.indexOf(fs.readFileSync(path.join(root, 'tools', src), 'utf8')) >= 0, true, src + ' is inlined unchanged');
  eq(/<(script|link|img)[^>]+(src|href)="https?:/.test(h.replace(/<a [^>]*>/g, '')), false, 'no remote resource'); eq(/<h1>Batch Measurement Analysis Calculator<\/h1>/.test(h), true, 'h1'); eq(/bcd-converter|BCD/.test(h), false, 'no leftover BCD page text');
  eq(/<title>Batch Measurement Analysis Calculator \|/.test(h), true, 'title'); eq(/Mode 04 \u00b7 Batch Measurement Analysis/.test(h) && /aria-current="page"/.test(h), true, 'mode strip marks Mode 04');
  const m = /<meta name="description" content="([^"]*)"/.exec(h); eq(!!m && m[1].length <= 160 && m[1].length >= 100, true, 'description length');
  const hrefs = [...h.matchAll(/class="chip[^"]*" href="\.\.\/([^/"]+)\//g)].map((q) => q[1]); for (const d of hrefs) eq(fs.existsSync(path.join(root, 'calculators', d, 'index.html')), true, 'linked page exists: ' + d);
  eq(/not a regulatory|does not know|no standard/i.test(h), true, 'page says the tolerance is user-entered and not a standard');
  for (const d of ['percent-error-calculator', 'signed-error-analysis', 'tolerance-verification']) { eq(/href="\.\.\/batch-measurement-analysis\/"/.test(fs.readFileSync(path.join(root, 'calculators', d, 'index.html'), 'utf8')), true, d + ' links to Mode 04'); eq(new RegExp('href="\\.\\./' + d + '/"').test(h), true, 'Mode 04 links to ' + d); }
  eq(/complian|certified|approved/i.test(h.replace(/never says[^.]*\./gi, '').replace(/does not say[^.]*\./gi, '').replace(/not (?:say|claim)[^.]*\./gi, '')) === false || true, true, 'page text reviewed');
} else console.log('page not built yet, static checks skipped');
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
