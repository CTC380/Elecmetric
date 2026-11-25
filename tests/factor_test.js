/* Tests for tools/factor_engine.js (Factor Calculator, Mode 01, All Factors Finder) against tests/factor_vectors.json (independent: gen_factor_vectors.py, brute force, sympy.divisors,
   sympy.factorint prime-power products, divisor-count and divisor-sum formulas), the fixed cases of the Factor Calculator CEO decision note, and the built page calculators/factor-calculator/index.html. */
const F = require('../tools/factor_engine.js'), V = require('./factor_vectors.json'), fs = require('fs'), path = require('path'), crypto = require('crypto');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 20) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const ok = (c, m) => { n++; if (!c) bad(m); };
const S = (t, o) => F.solve(Object.assign({ text: t }, o || {}));
const sha = (l) => crypto.createHash('sha256').update(l.join(',')).digest('hex');
for (const [t, kind, cnt, facs, ftxt, np, sq, sg, sigma, head, tail, hash, nsg, p3, pl3] of V.solve) {
  const tag = '[' + t.replace(/\s+/g, ' ').slice(0, 40) + ']', r = S(t, { signed: true });
  if (!r.ok) { bad(tag + ' rejected: ' + r.error); continue; }
  if (kind === 'zero') { eq(r.status, 'zero', 'status ' + tag); eq(r.count, 0, 'no factors ' + tag); eq(r.valueText, 'Undefined', 'headline ' + tag); eq(r.verifyOk, true, 'checks ' + tag); continue; }
  eq(r.status === 'ok' || r.status === 'prime' || r.status === 'one' ? r.kind : r.status, kind === 'ok' ? 'composite' : kind === 'one' ? 'neither' : kind, 'kind ' + tag);
  eq(r.count, cnt, 'count ' + tag);
  if (facs) eq(r.factors.join(','), facs.join(','), 'factors ' + tag);
  eq(r.factors.slice(0, 6).join(','), head.join(','), 'first six ' + tag); eq(r.factors.slice(-6).join(','), tail.join(','), 'last six ' + tag); eq(sha(r.factors), hash, 'sha256 of the list ' + tag);
  eq(r.factorText, ftxt, 'factorisation ' + tag); eq(r.pairs.length, np, 'pair count ' + tag); eq(r.square, sq, 'equal pair flag ' + tag);
  eq(r.pairs.slice(0, 3).map((p) => p[0] + ' x ' + p[1]).join(','), p3.join(','), 'first pairs ' + tag); eq(r.pairs.slice(-3).map((p) => p[0] + ' x ' + p[1]).join(','), pl3.join(','), 'last pairs ' + tag);
  eq(r.signedPairs.length, nsg, 'signed pair count ' + tag); if (sg) eq(r.signedPairs.map((p) => p[0] + ' x ' + p[1]).join(','), sg.join(','), 'signed pairs ' + tag);
  eq(r.rows[1][1], String(cnt), 'table count ' + tag);
  eq(r.verifyOk, true, 'checks ' + tag); eq(r.verify.every((x) => x[1] === true), true, 'every check passed ' + tag); eq(r.verify.length >= 8, true, 'number of checks ' + tag);
  eq(F.sigma(r.primeFactors.map((x) => [BigInt(x[0]), x[1]])), BigInt(sigma), 'sigma ' + tag);
  eq(r.negative, /^\s*[-\u2212\u2013]\s*[1-9]/.test(t), 'sign flag ' + tag); eq(r.showSigned, true, 'signed on ' + tag);
  eq(/NaN|\[object|null|\bundefined\b/.test(JSON.stringify([r.steps, r.rows, r.sentence, r.summary, r.valueText])), false, 'no undefined or NaN text ' + tag);
  eq(S(t).showSigned, r.negative, 'signed pairs only automatic for negatives ' + tag);
}
for (const t of V.err) { const r = S(t); eq(r.ok, false, 'refused [' + t + ']'); eq(!!r.empty, false, 'not an empty hint [' + t + ']'); ok(typeof r.error === 'string' && r.error.length > 15, 'message [' + t + ']'); }
for (const t of V.empty) { const r = S(t); eq(r.ok, false, 'empty [' + JSON.stringify(t) + ']'); eq(r.empty, true, 'empty flag'); ok(r.hint && r.hint.length > 5, 'hint'); }
for (const [nt, ct, isf, q, rem] of V.cand) {
  const c = S(nt, { check: ct }).candidate, tag = '[' + nt + ' / ' + ct + ']';
  ok(c && c.ok, 'candidate ok ' + tag); if (!c) continue;
  eq(c.factor, isf, 'is factor ' + tag); if (q !== null) { eq(c.quotient, q, 'quotient ' + tag); if (rem !== '0') eq(c.remainder, rem, 'remainder ' + tag); }
}
ok(S('36', { check: 'abc' }).candidate.ok === false, 'bad candidate gives an error'); eq(S('36', { check: '' }).candidate, null, 'blank candidate');
/* the note's fixed table */
const L = (t) => S(t).listText;
eq(L('12'), '1, 2, 3, 4, 6, 12', 'factors of 12'); eq(L('36'), '1, 2, 3, 4, 6, 9, 12, 18, 36', 'factors of 36'); eq(L('60'), '1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60', 'factors of 60');
eq(S('120').factorText, '2^3 \u00d7 3 \u00d7 5', '120'); eq(S('360').factorText, '2^3 \u00d7 3^2 \u00d7 5', '360'); eq(S('360').count, 24, 'tau(360)');
eq(F.sigma([[2n, 3], [3n, 2], [5n, 1]]), 1170n, 'sigma(360)'); eq(S('360').summary.indexOf('Number of positive factors: 24') > 0, true, 'summary count');
eq(L('13'), '1, 13', 'factors of 13'); eq(S('13').kind, 'prime', '13 prime'); eq(S('28').kind, 'composite', '28 composite'); eq(L('1'), '1', 'factors of 1'); eq(S('1').kind, 'neither', '1 neither');
eq(S('0').status, 'zero', '0 undefined'); eq(S('36').pairs.length, 5, 'pairs of 36'); eq(S('36').pairs.map((p) => p.join('x')).join(' '), '1x36 2x18 3x12 4x9 6x6', 'pairs of 36 listed');
eq(S('-36').listText, S('36').listText, 'negative uses the absolute value'); eq(S('-36').signedPairs.length, 9, 'signed pairs of -36'); eq(S('36', { signed: true }).signedPairs.length, 10, 'signed pairs of 36');
eq(S('1,170').abs, '1170', 'thousands comma'); eq(S('36.0').abs, '36', '36.0'); eq(S('1000000000000000000').count, 361, '10^18 has 361 factors'); eq(S('897612484786617600').count, 103680, 'largest factor count');
eq(S('1000000000000000001').ok, false, 'above the limit refused'); eq(S('360').csv.split('\r\n')[0], 'Factor,Quotient (|n| / factor),Remainder', 'csv header'); eq(S('360').csv.trim().split('\r\n').length, 25, 'csv rows');
/* properties for 1..3000: factors pair up, sum = sigma, 1 and n included */
for (let k = 1; k <= 3000; k++) { const r = S(String(k)); let s = 0; r.factors.forEach((x) => { s += +x; }); ok(r.factors[0] === '1' && r.factors[r.count - 1] === String(k) && r.factors.every((x) => k % x === 0) && r.verifyOk, 'property ' + k); if (k <= 400) eq(r.count, Array.from({ length: k }, (_, i) => i + 1).filter((d) => k % d === 0).length, 'brute count ' + k); }
const t0 = Date.now(); S('897612484786617600'); S('999999937' * 1 && String(999999937n * 999999929n)); ok(Date.now() - t0 < 5000, 'timing guard');
/* built page */
const root = path.join(__dirname, '..'), pg = fs.readFileSync(path.join(root, 'calculators/factor-calculator/index.html'), 'utf8'), g1 = fs.readFileSync(path.join(root, 'calculators/gcf-calculator/index.html'), 'utf8');
ok(/<title>Factor Calculator Online/.test(pg), 'page title'); ok(pg.indexOf('id="ns-in"') > 0 && pg.indexOf('window.FACT') > 0 && pg.indexOf('FACT') > 0, 'page has the tool and the engine');
ok(/Mode 01 \u00b7 All Factors Finder/.test(pg) && pg.indexOf('Mode 02 \u00b7 Prime Factorisation (coming)') > 0, 'mode strip');
ok(pg.indexOf('36 \u00f7 5 = 7') > 0 && pg.indexOf('2<sup>3</sup> \u00d7 3<sup>2</sup> \u00d7 5') > 0 && pg.indexOf('1, 2, 3, 4, 6, 9, 12, 18, 36') > 0, 'worked examples are on the page');
ok(!/href="\.\.\/(prime-factorization|factor-pairs|number-properties|advanced-number-theory)/.test(pg), 'no link to an unbuilt mode');
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
