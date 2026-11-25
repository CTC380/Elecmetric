/* Tests for tools/quad_engine.js (Quadratic Formula Calculator, Mode 01) against tests/quad_vectors.json (independent: gen_quad_vectors.py, sympy and mpmath)
   plus fixed cases from the CEO note. Roots are compared as numbers at 1e-10 relative / 1e-12 absolute tolerance; the discriminant, vertex, sum and product exactly. */
const Q = require('../tools/quad_engine.js'), V = require('./quad_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 20) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const num = (t) => parseFloat(String(t).replace(/\u2212/g, '-'));
const close = (a, b) => Math.abs(a - b) <= Math.max(1e-12, 1e-10 * Math.abs(b));
const rr = (q) => q.d === 1n ? String(q.n) : q.n + '/' + q.d;
for (const [a, b, c, kind, D, roots, vx, vy, sum, prod] of V.ok) {
  const t = '[' + a + ', ' + b + ', ' + c + ']', r = Q.solve({ a, b, c, dp: 15 });
  if (!r.ok) { bad(t + ' rejected: ' + r.error); continue; }
  const k = r.kind === 'linear' || r.kind === 'none' || r.kind === 'indeterminate' ? r.kind : (r.kind === 'repeated' ? 'repeated' : r.kind);
  eq(k, kind, 'kind ' + t);
  if (r.degree === 2) { eq(r.discriminant, D, 'discriminant ' + t); eq(rr(r.vertex.x), vx, 'vertex x ' + t); eq(rr(r.vertex.y), vy, 'vertex y ' + t); eq(rr(r.sum), sum, 'sum ' + t); eq(rr(r.product), prod, 'product ' + t); }
  eq(r.roots.length, roots.length, 'root count ' + t);
  r.roots.forEach((x, i) => {
    const re = x.real ? num(x.dec.text) : num(x.re.text), im = x.real ? 0 : num(x.im.text), e = roots[i];
    if (!close(re, parseFloat(e[0]))) bad('root ' + (i + 1) + ' real part ' + t + ': ' + re + ' vs ' + e[0]);
    if (!close(im, parseFloat(e[1]))) bad('root ' + (i + 1) + ' imaginary part ' + t + ': ' + im + ' vs ' + e[1]);
    n += 2;
  });
  if (r.degree >= 1) eq(r.verifyOk, true, 'exact substitution ' + t);
  eq(Array.isArray(r.steps) && r.steps.length >= 2 && r.steps.every((s) => typeof s === 'string' && s.length > 8), true, 'working ' + t);
}
for (const e of V.err) { const r = Q.solve({ a: e, b: '1', c: '1' }); eq(r.ok, false, 'must reject [' + e + ']'); eq(typeof r.error === 'string' && r.error.length > 5, true, 'message [' + e + ']'); }
// the CEO note, by exact text
const S = (a, b, c) => Q.solve({ a, b, c });
eq(S('1', '-5', '6').roots.map((x) => x.exact).join(','), '2,3', 'x^2-5x+6'); eq(S('1', '-5', '6').discriminant, '1', 'discriminant 1');
eq(S('1', '-4', '4').label, 'One repeated real root (double root)', 'repeated'); eq(S('1', '-4', '4').roots[0].exact, '2', 'repeated root 2');
eq(S('1', '2', '5').roots.map((x) => x.exact).join(' | '), '\u22121 + 2i | \u22121 \u2212 2i', 'complex roots -1 +/- 2i'); eq(S('1', '2', '5').discriminant, '-16', 'discriminant -16');
eq(S('2', '3', '-5').roots.map((x) => x.exact).join(','), '-5/2,1', '2x^2+3x-5'); eq(S('2', '3', '-5').roots[0].dec.text, '-2.5', '-2.5');
eq(S('1', '-2', '-1').roots.map((x) => x.exact).join(' | '), '1 \u2212 \u221a2 | 1 + \u221a2', 'x^2-2x-1'); eq(S('3', '0', '-12').roots.map((x) => x.exact).join(','), '-2,2', '3x^2-12');
eq(S('1', '0', '1').roots.map((x) => x.exact).join(' | '), 'i | \u2212i', 'x^2+1'); eq(S('0', '2', '-4').kind, 'linear', 'A = 0 is linear'); eq(S('0', '2', '-4').roots[0].exact, '2', 'linear root');
eq(S('0', '0', '5').kind, 'none', 'A=B=0, C!=0'); eq(S('0', '0', '0').kind, 'indeterminate', 'A=B=C=0');
eq(S('3/4', '1/2', '-2').roots.map((x) => x.exact).join(','), '-2,4/3', 'fractions'); eq(S('3/4', '1/2', '-2').discriminant, '25/4', 'fraction discriminant');
eq(S('2 1/2', '0', '-10').roots.map((x) => x.exact).join(','), '-2,2', 'mixed number A'); eq(S('\u22121', '2', '\u22121').kind, 'repeated', 'unicode minus');
eq(S('0.1', '0.2', '0.1').kind, 'repeated', 'decimal repeated root is exactly detected'); eq(S('1e154', '1', '1e-154').ok, true, 'huge coefficients do not overflow'); eq(S('1e154', '1', '1e-154').verifyOk, true, 'huge coefficients verified');
eq(S('1', '-2000000000', '1000000000000000001').kind, 'complex', 'near-repeated, D < 0'); eq(S('1', '-2000000000', '999999999999999999').roots.map((x) => x.exact).join(','), '999999999,1000000001', 'near-repeated, D = 4'); eq(S('1', '-2000000000', '1000000000000000000').kind, 'repeated', 'near-repeated, D = 0');
eq(S('1', '-2000000000', '1000000000000000001').discriminant, '-4', 'near-repeated discriminant is exact');
eq(S('', '1', '1').ok, false, 'empty A'); eq(S('', '', '').empty, true, 'all empty flagged'); eq(S('x', '1', '1').errors.a.length > 5, true, 'error message on the field');
eq(Q.solve({ a: '1', b: '-3', c: '1', dp: 4 }).roots[1].dec.text, '2.6180', 'rounded to 4 places'); eq(Q.solve({ a: '1', b: '-3', c: '1', dp: 12 }).roots[1].dec.text, '2.618033988750', 'rounded to 12 places');
eq(Q.equationText(Q.parseNum('1').v, Q.parseNum('-5').v, Q.parseNum('6').v), 'x\u00b2 \u2212 5x + 6 = 0', 'equation text'); eq(Q.equationText(Q.parseNum('-1').v, Q.parseNum('0').v, Q.parseNum('3/4').v), '\u2212x\u00b2 + (3/4) = 0', 'equation text with fraction and missing term');
console.log(n + ' checks, ' + fail + ' failures'); process.exit(fail ? 1 : 0);
