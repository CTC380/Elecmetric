/* Tests for tools/quad_disc_engine.js (Quadratic Formula Calculator, Mode 02: Discriminant & Root Analysis) against tests/quad_disc_vectors.json
   (independent: gen_quad_disc_vectors.py, sympy and mpmath) plus the CEO note's cases, the numerical policy, input handling and the built page.
   Exact values (discriminant, sum of squares, sum of reciprocals) are compared as text; the root separation, imaginary part and modulus as numbers at 1e-10 relative. */
const fs = require('fs'), path = require('path');
const D = require('../tools/quad_disc_engine.js'), V = require('./quad_disc_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 25) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const ok = (c, m) => { n++; if (!c) bad(m); };
const num = (t) => parseFloat(String(t).replace(/−/g, '-'));
const close = (a, b) => Math.abs(a - b) <= Math.max(1e-12, 1e-10 * Math.abs(b));
const frac = (t) => { const p = String(t).split('/'); return p.length === 2 ? parseFloat(p[0]) / parseFloat(p[1]) : parseFloat(t); };
const rs = (q) => q.d === 1n ? String(q.n) : q.n + '/' + q.d;
const dnum = (x) => num(x.dec(15).text);

for (const [a, b, c, kind, Dt, rational, ss, rec, signs, diff, imag, modu] of V.analyse) {
  const t = '[' + a + ', ' + b + ', ' + c + ']', r = D.analyse({ a, b, c, dp: 15 });
  if (!r.ok || !r.analysis) { bad(t + ' not analysed: ' + r.error); continue; }
  const an = r.analysis;
  eq(an.kind, kind, 'kind ' + t); eq(r.discriminant, Dt, 'discriminant ' + t);
  eq(an.rational, rational, 'rational ' + t); eq(rs(an.sumSquares), ss, 'sum of squares ' + t);
  eq(an.recip === null ? null : rs(an.recip), rec, 'sum of reciprocals ' + t);
  const sk = /^Both roots are positive/.test(an.signs) ? 'both_positive' : /^Both roots are negative/.test(an.signs) ? 'both_negative' : /^One positive root and one negative/.test(an.signs) ? 'opposite' : /^One root is zero and the other is positive/.test(an.signs) ? 'zero_positive' : /^One root is zero and the other is negative/.test(an.signs) ? 'zero_negative' : /^Both roots are zero/.test(an.signs) ? 'both_zero' : /^No real roots/.test(an.signs) ? 'none' : '?';
  eq(sk, signs, 'root signs ' + t);
  eq(an.distinctReal, kind === 'distinct' ? 2 : kind === 'repeated' ? 1 : 0, 'real root count ' + t);
  if (diff !== null) { ok(an.diff && close(dnum(an.diff), parseFloat(diff)), 'root separation ' + t + ': ' + (an.diff && dnum(an.diff)) + ' vs ' + diff); } else ok(!an.diff, 'no separation for complex ' + t);
  if (imag !== null) ok(an.imag && close(dnum(an.imag), parseFloat(imag)), 'imaginary part ' + t);
  if (modu !== null) ok(an.modulus && close(dnum(an.modulus), parseFloat(modu)), 'modulus ' + t);
  eq(an.checkOk, true, 'checks (substitution and identity) ' + t);
  eq(an.factorsOverQ, rational, 'factors over Q ' + t); eq(an.factorsOverR, kind !== 'complex', 'factors over R ' + t);
  ok(r.mode2Steps.length >= 4 && r.mode2Steps.every((s) => typeof s === 'string' && s.length > 10), 'working ' + t);
  ok(D.summary(r).indexOf('Discriminant') >= 0, 'summary ' + t);
}

const inIv = (iv, x) => iv.point ? Math.abs(x - iv.lo) <= 1e-9 * Math.max(1, Math.abs(iv.lo)) : (iv.lo === null || x > iv.lo) && (iv.hi === null || x < iv.hi);
for (const [u, a, b, c, bps, probes] of V.range) {
  const t = u + ' [' + a + ', ' + b + ', ' + c + ']', g = D.rangeFor({ unknown: u, a, b, c });
  if (!g.ok) { bad(t + ' rejected: ' + g.error); continue; }
  const got = []; g.cases.forEach((cs) => cs.intervals.forEach((iv) => { if (iv.point) got.push(iv.lo); else { if (iv.lo !== null && iv.lo !== 0) got.push(iv.lo); if (iv.hi !== null && iv.hi !== 0) got.push(iv.hi); } }));
  const uniq = [...new Set(got.map((x) => +x.toPrecision(12)))].sort((p, q) => p - q);
  eq(uniq.length, bps.length, 'breakpoint count ' + t);
  uniq.forEach((x, i) => { if (bps[i] !== undefined) ok(close(x, bps[i]), 'breakpoint ' + i + ' ' + t + ': ' + x + ' vs ' + bps[i]); });
  for (const [pv, kind] of probes) {
    const x = frac(pv), hits = g.cases.filter((cs) => cs.intervals.some((iv) => inIv(iv, x)));
    ok(hits.length === 1 && hits[0].kind === kind, 'probe ' + u + ' = ' + pv + ' ' + t + ': in ' + hits.map((h) => h.kind).join('+') + ', expected ' + kind);
  }
  g.cases.forEach((cs) => { if (cs.example) ok(cs.example.matches, 'worked example for ' + cs.kind + ' ' + t); ok(cs.possible === (cs.intervals.length > 0), 'possible flag ' + t); ok(typeof cs.condition === 'string' && cs.condition.length > 3, 'condition text ' + t); });
  ok(typeof g.formula === 'string' && g.formula.indexOf('Δ') === 0, 'formula ' + t);
  if (u === 'a') ok(!g.cases.some((cs) => cs.intervals.some((iv) => inIv(iv, 0))), 'A = 0 left out ' + t);
}
for (const e of V.err) { const r = D.analyse({ a: e, b: '1', c: '1' }); eq(r.ok, false, 'must reject [' + e + ']'); const g = D.rangeFor({ unknown: 'c', a: e, b: '1' }); eq(g.ok, false, 'range must reject [' + e + ']'); }

// the CEO note
const S = (a, b, c) => D.analyse({ a, b, c });
eq(S('1', '-5', '6').discriminant, '1', 'A: delta 1'); eq(S('1', '-5', '6').analysis.label, 'Two distinct real roots', 'A: label'); eq(S('1', '-5', '6').roots.map((x) => x.exact).join(','), '2,3', 'A: roots 2 and 3');
eq(S('1', '-4', '4').discriminant, '0', 'B: delta 0'); eq(S('1', '-4', '4').analysis.label, 'One repeated real root', 'B: label'); eq(S('1', '-4', '4').roots[0].exact, '2', 'B: root 2');
eq(S('1', '2', '5').discriminant, '-16', 'C: delta -16'); eq(S('1', '2', '5').analysis.label, 'Two complex conjugate roots', 'C: label'); eq(S('1', '2', '5').roots.map((x) => x.exact).join(' | '), '−1 + 2i | −1 − 2i', 'C: -1 +/- 2i');
// numerical policy: the discriminant is exact, so a tiny one is not taken as zero and a zero one is not missed
eq(S('1', '-2000000000', '1000000000000000001').analysis.kind, 'complex', 'near-repeated delta = -4 is complex'); eq(S('1', '-2000000000', '1000000000000000001').analysis.nearlyRepeated, true, 'near-repeated flagged');
eq(S('1', '-2000000000', '1000000000000000000').analysis.kind, 'repeated', 'exact repeated at large size'); eq(S('1', '-2000000000', '1000000000000000000').analysis.nearlyRepeated, false, 'exact zero is not "nearly"');
eq(S('0.1', '0.2', '0.1').analysis.kind, 'repeated', '0.1, 0.2, 0.1 is exactly repeated'); eq(S('1', '-5', '6').analysis.nearlyRepeated, false, 'ordinary case not flagged');
eq(S('1e154', '1', '1e-154').analysis.checkOk, true, 'huge coefficients pass the checks');
// degenerate inputs pass through unchanged (no analysis)
eq(S('0', '2', '-4').analysis, undefined, 'linear has no discriminant analysis'); eq(S('0', '2', '-4').kind, 'linear', 'linear kind'); eq(S('0', '0', '5').kind, 'none', 'no solution kind');
// parameter ranges, exact text
const G = (u, a, b, c) => D.rangeFor({ unknown: u, a, b, c });
eq(G('c', '1', '-5', '').cases.map((c) => c.kind + ':' + c.condition).join(' | '), 'distinct:C < 25/4 | complex:C > 25/4 | repeated:C = 25/4', 'x^2 - 5x + C');
eq(G('b', '1', '', '4').cases.map((c) => c.condition).join(' | '), 'B < −4 or B > 4 | −4 < B < 4 | B = −4 or B = 4', 'x^2 + Bx + 4');
eq(G('b', '2', '', '3').cases[1].condition, '−2√6 < B < 2√6', 'B radical boundary'); eq(G('b', '1', '', '-3').cases[0].condition, 'every value of B', 'B: delta always positive'); eq(G('b', '1', '', '-3').cases[1].possible, false, 'B: no complex');
eq(G('a', '', '4', '2').cases[0].condition, 'A < 0 or 0 < A < 2', 'A: zero left out'); eq(G('a', '', '3', '0').cases[0].condition, 'A ≠ 0', 'A: every value except 0'); eq(G('a', '', '0', '3').cases[2].possible, false, 'A: B = 0 gives no repeated root');
eq(G('c', '0', '1', '').ok, false, 'range needs A for C'); eq(G('c', '', '1', '').ok, false, 'range empty A'); eq(G('x', '1', '1', '1').ok, false, 'bad unknown'); eq(G('c', '1', '', '').empty, false, 'one field missing is not "empty"'); eq(G('b', '', '', '').empty, true, 'all empty flagged');

// the built page
const html = fs.readFileSync(path.join(__dirname, '..', 'calculators', 'discriminant-calculator', 'index.html'), 'utf8');
ok(/<title>[^<]*Discriminant[^<]*<\/title>/.test(html), 'page title'); ok(html.indexOf('id="dq"') > 0, 'page has the tool'); ok(/Mode 02/.test(html) && /quadratic-solver\//.test(html), 'mode strip links Mode 01');
ok(!/<script[^>]+src=/.test(html), 'no external scripts');
console.log(n + ' checks, ' + fail + ' failures'); process.exit(fail ? 1 : 0);
