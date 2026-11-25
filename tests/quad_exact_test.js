/* Tests for tools/quad_exact_engine.js (Quadratic Formula Calculator, Mode 04: Exact Root & Factorisation) against tests/quad_exact_vectors.json
   (independent: gen_quad_exact_vectors.py, sympy factor_list / roots / Poly algebra) plus the CEO note's example, fixed texts, input handling and the built page.
   Exact values (content, vertex, rational roots, candidate counts, factor coefficients) are compared as text or integers, never within a tolerance. */
const fs = require('fs'), path = require('path');
const X = require('../tools/quad_exact_engine.js'), Q = require('../tools/quad_engine.js'), V = require('./quad_exact_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 25) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const ok = (c, m) => { n++; if (!c) bad(m); };
const plain = (t) => String(t).replace(/−/g, '-');
const rs = (q) => q.d === 1n ? String(q.n) : q.n + '/' + q.d;
const squarefree = (r) => { for (let p = 2n; p * p <= r && p < 100000n; p++) if (r % (p * p) === 0n) return false; return true; };

for (const [a, b, c, kind, content, whole, h, k, rats, ncand, overQ, facs, tt] of V.forms) {
  const t = '[' + a + ', ' + b + ', ' + c + ']', r = X.forms({ a, b, c, dp: 12 });
  if (!r.ok || r.degree !== 2) { bad(t + ' not handled: ' + (r.error || r.label)); continue; }
  const kd = r.factored.kind;
  eq(kd === 'radical' || kd === 'complex' ? kd : r.kind, kind, 'kind ' + t);
  eq(plain(r.content.kText), content, 'common factor ' + t);
  eq([r.content.a, r.content.b, r.content.c].join(','), whole.join(','), 'whole-number form ' + t);
  eq(plain(r.vertex.hText), h, 'vertex x ' + t); eq(plain(r.vertex.kText), k, 'vertex y ' + t);
  eq(r.factored.overQ, overQ, 'factors over Q ' + t);
  eq(r.rational.found.map((q) => plain(rs(q))).join('|'), rats.join('|'), 'rational roots ' + t);
  eq(r.rational.count === null ? 'null' : r.rational.count, ncand === null ? 'null' : ncand, 'candidate count ' + t);
  if (overQ) eq(r.factored.q.map((f) => f.q + ',' + f.p).join(';'), facs.map((f) => f.join(',')).join(';'), 'factor coefficients ' + t);
  else { const s = r.s; ok(!s.zero && squarefree(s.r), 'radicand squarefree ' + t); eq(rs(Q.R(s.coef.n * s.coef.n * s.r, s.coef.d * s.coef.d)).replace(/^-/, ''), plain(tt).replace(/^-/, ''), 's squared ' + t); eq(s.imag, kind === 'complex', 'imaginary flag ' + t); }
  eq(r.checkOk, true, 'all exact checks ' + t);
  ok(r.checks.length >= 6 && r.checks.every((x) => x.ok), 'every check listed holds ' + t);
  ok(r.factorSteps.length >= 3 && r.completeSquare.length === 5, 'working ' + t);
  /* the factored text re-read: for rational factors rebuild it from the vectors */
  if (overQ) {
    const lin = (q, p) => { const l = q === 1 ? 'x' : q + 'x'; return p === 0 ? l : p > 0 ? l + ' − ' + p : l + ' + ' + (-p); };
    const fw = (q, p) => q === 1 && p === 0 ? 'x' : '(' + lin(q, p) + ')';
    const kk = plain(content), pre = kk === '1' ? '' : kk === '-1' ? '-' : /\//.test(kk) ? '(' + kk + ')' : kk;
    const f = facs.map((x) => fw(x[0], x[1]));
    const body = kind === 'repeated' ? (f[0] === 'x' ? 'x²' : f[0] + '²') : f.join('');
    eq(plain(r.factored.text), plain(pre + body), 'factored text ' + t);
  }
}
for (const [a, r1, r2, A, B, C] of V.roots) {
  const t = 'roots [' + a + ', ' + r1 + ', ' + r2 + ']', r = X.fromRoots({ a, r1, r2 });
  if (!r.ok) { bad(t + ' refused: ' + r.error); continue; }
  eq(plain(rs(r.A)), A, 'A ' + t); eq(plain(rs(r.B)), B, 'B ' + t); eq(plain(rs(r.C)), C, 'C ' + t);
  eq(r.checkOk, true, 'checks ' + t); eq(r.rootsRecovered, true, 'roots recovered ' + t);
}
for (const [a, h, k, A, B, C] of V.vertex) {
  const t = 'vertex [' + a + ', ' + h + ', ' + k + ']', r = X.fromVertex({ a, h, k });
  if (!r.ok) { bad(t + ' refused: ' + r.error); continue; }
  eq(plain(rs(r.A)), A, 'A ' + t); eq(plain(rs(r.B)), B, 'B ' + t); eq(plain(rs(r.C)), C, 'C ' + t);
  eq(r.checkOk, true, 'checks ' + t); eq(plain(r.vertex.hText), plain(rs(Q.parseNum(h).v)), 'vertex x kept ' + t);
}

/* the CEO note's example, in full */
{
  const r = X.forms({ a: '2', b: '3', c: '-5' });
  eq(r.factored.text, '(2x + 5)(x − 1)', 'CEO note: factored form'); eq(r.roots.map((x) => plain(x.exact)).join(','), '-5/2,1', 'CEO note: roots');
  eq(r.vertex.text, '2(x + 3/4)² − 49/8', 'CEO note: vertex form'); eq(r.rational.count, 8, 'CEO note: 8 candidates'); eq(r.rational.found.map(rs).join('|'), '-5/2|1', 'CEO note: rational roots');
  eq(rs(r.sum), '-3/2', 'sum'); eq(rs(r.product), '-5/2', 'product');
}
/* fixed texts */
const T = (a, b, c) => X.forms({ a, b, c });
eq(T('1', '-2', '-1').factored.text, '(x − 1 − √2)(x − 1 + √2)', 'radical factors'); eq(T('1', '2', '5').factored.text, '(x + 1 − 2i)(x + 1 + 2i)', 'complex factors'); eq(T('1', '2', '5').factored.realForm, '[(x + 1)² + 4]', 'real form of a complex pair');
eq(T('1', '-4', '4').factored.text, '(x − 2)²', 'perfect square'); eq(T('1', '0', '0').factored.text, 'x²', 'double zero root'); eq(T('2', '-3', '0').factored.text, 'x(2x − 3)', 'zero root');
eq(T('-6', '0', '24').factored.text, '−6(x + 2)(x − 2)', 'negative leading coefficient'); eq(T('3/4', '1/2', '-2').factored.text, '(1/4)(x + 2)(3x − 4)', 'fractional content'); eq(T('0.1', '0.2', '0.1').factored.text, '(1/10)(x + 1)²', '0.1 is exact');
eq(T('4', '4', '5').factored.text, '4(x + 1/2 − i)(x + 1/2 + i)', 'complex with fractions'); eq(T('1', '0', '1').factored.text, '(x − i)(x + i)', 'x² + 1'); eq(T('1', '0', '-2').factored.text, '(x − √2)(x + √2)', 'x² − 2');
eq(T('1', '-1', '-1').factored.text, '(x − 1/2 − √5/2)(x − 1/2 + √5/2)', 'golden ratio factors'); eq(T('2', '0', '-1').vertex.text, '2x² − 1', 'vertex form with h = 0');
eq(T('1', '1000000', '1').rational.count, 2, 'x² + 10⁶x + 1 has two candidates'); eq(T('1', '-2000000000', '1000000000000000001').factored.kind, 'complex', 'huge near-repeated stays exact');
/* degenerate and invalid input */
{
  const z = X.forms({ a: '0', b: '2', c: '-4' }); ok(z.ok && z.noQuadratic && z.degree === 1, 'A = 0 is linear'); eq(z.roots[0].exact, '2', 'linear root');
  ok(X.forms({ a: '0', b: '0', c: '0' }).noQuadratic, 'all zero'); ok(!X.forms({ a: '', b: '', c: '' }).ok && X.forms({ a: '', b: '', c: '' }).empty, 'empty input'); ok(!X.forms({ a: 'x', b: '1', c: '1' }).ok, 'bad A');
  ok(!X.fromRoots({ a: '0', r1: '1', r2: '2' }).ok, 'roots with A = 0 refused'); ok(!X.fromVertex({ a: '0', h: '1', k: '2' }).ok, 'vertex with A = 0 refused');
  ok(!X.fromRoots({ a: '1', r1: '1', r2: '' }).ok, 'missing root refused'); ok(!X.fromVertex({ a: '1', h: '', k: '1' }).ok, 'missing h refused');
  const e = X.fromRoots({ a: '1', r1: '1/3', r2: '-2.5' }); eq(e.equation, 'x² + (13/6)x − (5/6) = 0', 'roots to equation'); eq(e.integerForm, '6x² + 13x − 5 = 0', 'whole-number form from roots');
  const v = X.fromVertex({ a: '-2', h: '3', k: '5' }); eq(v.equation, '−2x² + 12x − 13 = 0', 'vertex to equation'); eq(v.vertex.text, '−2(x − 3)² + 5', 'vertex text kept');
  const big = X.forms({ a: '1', b: '-9007199254740993', c: '2' }); ok(big.ok && big.checkOk, 'coefficients beyond 2^53');
  const pr = X.forms({ a: '1', b: '0', c: '-1000000000000000000000000000000' }); ok(pr.ok && pr.rational.count === null && pr.checkOk, 'too many divisors: candidates skipped, still exact');
}
ok(/Factored form: \(2x \+ 5\)\(x − 1\) = 0/.test(X.summary(X.forms({ a: '2', b: '3', c: '-5' }))), 'summary text');

/* the built page */
const pf = path.join(__dirname, '../calculators/exact-roots/index.html');
if (fs.existsSync(pf)) {
  const page = fs.readFileSync(pf, 'utf8');
  ok(/<title>Factoring and Vertex Form Calculator \|/.test(page), 'page title'); ok(/<h1>Factoring and Vertex Form Calculator<\/h1>/.test(page), 'page h1');
  ['ex-a', 'ex-b', 'ex-c', 'ex-out', 'ex-steps', 'ex-verify', 'er-a', 'er-r1', 'er-r2', 'ev-a', 'ev-h', 'ev-k'].forEach((id) => ok(page.indexOf('id="' + id + '"') > 0, 'page has #' + id));
  ['quadratic-solver', 'discriminant-calculator', 'parabola-graph'].forEach((s) => ok(page.indexOf('href="../' + s + '/"') > 0, 'mode strip links ' + s));
  ok(/Mode 04 · Exact Root &amp; Factorisation/.test(page) && /aria-current="page"/.test(page), 'mode 04 marked current'); ok(!/\(coming\)/.test(page) && page.indexOf('href="../engineering-quadratic/"') > 0, 'mode 05 linked, none still coming');
  ok(!/localStorage|sessionStorage|\beval\(|new Function|document\.write/.test(page.match(/<script>[\s\S]*?<\/script>/g).join('')), 'no storage or dynamic code in the page script');
  ok(page.indexOf('(2x + 5)(x − 1)') > 0 && page.indexOf('2(x + 3/4)² − 49/8') > 0, 'page worked example carries the engine values');
  for (const f of ['quadratic-solver', 'discriminant-calculator', 'parabola-graph']) { const p = fs.readFileSync(path.join(__dirname, '../calculators/' + f + '/index.html'), 'utf8'); ok(p.indexOf('href="../exact-roots/"') > 0, f + ' page links to Mode 04'); ok(!/Mode 04 · Exact Root &amp; Factorisation \(coming\)/.test(p), f + ' page no longer says coming'); }
} else bad('calculators/exact-roots/index.html is missing');

console.log('quad_exact_test: ' + n + ' checks, ' + fail + ' failures');
process.exit(fail ? 1 : 0);
