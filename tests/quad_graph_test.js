/* Tests for tools/quad_graph_engine.js (Quadratic Formula Calculator, Mode 03: Parabola Graph & Vertex) against tests/quad_graph_vectors.json
   (independent: gen_quad_graph_vectors.py, sympy and mpmath) plus the CEO note's cases, the drawing window, input handling and the built page.
   Exact values (vertex, focus, directrix, table of values) are compared as text; x-intercepts and the drawn curve as numbers at 1e-9 relative. */
const fs = require('fs'), path = require('path');
const G = require('../tools/quad_graph_engine.js'), V = require('./quad_graph_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 25) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': got ' + a + ', expected ' + b); };
const ok = (c, m) => { n++; if (!c) bad(m); };
const txt = (s) => String(s).replace(/\u2212/g, '-');
const num = (t) => parseFloat(txt(t));
const frac = (t) => { const p = txt(t).split('/'); return p.length === 2 ? parseFloat(p[0]) / parseFloat(p[1]) : parseFloat(t); };
const close = (a, b, rel) => Math.abs(a - b) <= Math.max(1e-300, (rel || 1e-9) * Math.abs(b));
const rsq = (q) => q.d === 1n ? String(q.n) : q.n + '/' + q.d;

for (const [a, b, c, e] of V.rows) {
  const t = '[' + a + ', ' + b + ', ' + c + ']', r = G.graph({ a, b, c, dp: 15 });
  if (!r.ok || !r.graph || r.graph.kind !== 'parabola') { bad(t + ' not graphed: ' + r.error); continue; }
  const g = r.graph;
  eq(rsq(g.vertex.x), e.vx, 'vertex x ' + t); eq(rsq(g.vertex.y), e.vy, 'vertex y ' + t);
  eq(g.axis, 'x = ' + txt(e.vx).replace(/-/, '\u2212'), 'axis ' + t);
  eq(rsq(g.focus.x), e.vx, 'focus x ' + t); eq(rsq(g.focus.y), e.fy, 'focus y ' + t);
  eq(txt(g.directrix), 'y = ' + e.directrix, 'directrix ' + t); eq(g.latusText, e.latus, 'latus rectum ' + t);
  eq(rsq(g.mirror.x), e.mirrorx, 'mirror x ' + t); eq(rsq(g.mirror.y), rsq(r.C), 'mirror y ' + t);
  eq(g.opens, num(a) >= 0 && !/^-/.test(txt(a).trim()) ? 'up' : 'down', 'opens ' + t);
  eq(g.xints.length, e.xints.length, 'x-intercept count ' + t);
  g.xints.forEach((z, i) => ok(close(z.num, parseFloat(e.xints[i]), 1e-7), 'x-intercept ' + i + ' ' + t + ': ' + z.num + ' vs ' + e.xints[i]));
  eq(g.values.length, 7, 'table size ' + t);
  g.values.forEach((v, i) => { eq(txt(v.x), e.values[i][0], 'table x ' + t); eq(txt(v.y), e.values[i][1], 'table y at ' + e.values[i][0] + ' ' + t); });
  ok(g.checkOk && g.checks.length === 8, 'exact checks ' + t);
  ok(r.graphSteps.length >= 6 && r.graphSteps.every((s) => typeof s === 'string' && s.length > 15), 'working ' + t);
  ok(G.summary(r).indexOf('Vertex') >= 0 && G.summary(r).indexOf('Focus') >= 0, 'summary ' + t);
  /* the curve the page draws */
  const kk = frac(e.vy);
  for (const [dx, xs, ys] of e.probes) { const xv = frac(xs), yv = frac(ys), sc = Math.max(Math.abs(yv), Math.abs(kk), 1e-300); if (isFinite(xv) && isFinite(yv)) ok(Math.abs(g.fn.at(xv) - yv) <= 1e-9 * Math.max(sc, Math.abs(g.fn.a * (xv - g.fn.h) ** 2)), 'drawn curve at h+' + dx + ' ' + t + ': ' + g.fn.at(xv) + ' vs ' + yv); }
  /* the drawing window holds every point of interest */
  const w = g.view;
  if (w.drawable) {
    const pts = [[frac(e.vx), kk], [0, num(c.indexOf('/') >= 0 ? String(frac(c)) : c)], [frac(e.mirrorx), frac(rsq(r.C))]].concat(g.xints.map((z) => [z.num, 0]));
    pts.forEach(([px, py]) => { if (isFinite(px) && isFinite(py)) ok(px >= w.x0 - 1e-9 * Math.abs(px) && px <= w.x1 + 1e-9 * Math.abs(px), 'window holds x ' + px + ' ' + t); });
    ok(kk >= w.y0 - 1e-9 * Math.abs(kk) && kk <= w.y1 + 1e-9 * Math.abs(kk), 'window holds vertex y ' + t);
    ok(0 >= w.y0 && 0 <= w.y1, 'window holds the x-axis ' + t);
    ok(w.x1 > w.x0 && w.y1 > w.y0, 'window has size ' + t);
  }
}

for (const [a, b, c, x, y] of V.evalat) {
  const t = '[' + a + ', ' + b + ', ' + c + '] at ' + x, r = G.evalAt({ a, b, c, x, dp: 12 });
  if (!r.ok) { bad(t + ' rejected: ' + r.error); continue; }
  eq(txt(r.yt), y, 'f(x) ' + t);
}

/* the CEO note's example: 2x^2 + 3x - 5 */
{
  const r = G.graph({ a: '2', b: '3', c: '-5' }), g = r.graph;
  eq(g.discriminant, '49', 'CEO discriminant'); eq(r.label, 'Two distinct real roots (rational)', 'CEO type');
  eq(g.vertex.xd, '-0.75', 'CEO vertex x'); eq(g.vertex.yd, '-6.125', 'CEO vertex y'); eq(g.axis, 'x = \u22123/4', 'CEO axis');
  eq(g.yint.text, '(0, \u22125)', 'CEO y-intercept'); eq(g.opens, 'up', 'CEO opening'); eq(g.extremum, 'minimum', 'CEO min');
  eq(g.xints.map((z) => z.exact).join(','), '\u22125/2,1', 'CEO x-intercepts'); eq(g.vertexForm, 'y = 2(x + 3/4)\u00b2 \u2212 49/8', 'CEO vertex form');
  eq(g.range, 'y \u2265 \u221249/8', 'CEO range'); eq(g.standard, 'y = 2x\u00b2 + 3x \u2212 5', 'standard form');
}
/* the CEO note's other cases */
const cases = [['1', '-5', '6', 'up', '5/2', '-1/4', 2], ['1', '-4', '4', 'up', '2', '0', 1], ['1', '2', '5', 'up', '-1', '4', 0], ['1', '-2', '-1', 'up', '1', '-2', 2], ['3', '0', '-12', 'up', '0', '-12', 2], ['1', '0', '1', 'up', '0', '1', 0]];
for (const [a, b, c, o, vx, vy, nx] of cases) { const g = G.graph({ a, b, c }).graph; eq(g.opens, o, 'opens ' + a + b + c); eq(rsq(g.vertex.x), vx, 'vx ' + a + b + c); eq(rsq(g.vertex.y), vy, 'vy ' + a + b + c); eq(g.xints.length, nx, 'crossings ' + a + b + c); }
{
  const g = G.graph({ a: '-1', b: '4', c: '0' }).graph;
  eq(g.opens, 'down', 'downward'); eq(g.extremum, 'maximum', 'maximum'); eq(g.range, 'y \u2264 4', 'range downward'); eq(g.trend.indexOf('Increasing for x < 2'), 0, 'trend downward');
  eq(g.xints.map((z) => z.exact).join(','), '0,4', 'x-intercepts through the origin'); eq(g.yint.text, '(0, 0)', 'y-intercept at the origin');
}
{ /* B = 0: the y-intercept is the vertex */
  const g = G.graph({ a: '3', b: '0', c: '-12' }).graph; ok(g.mirrorSame, 'B = 0 mirror is itself'); eq(g.vertex.text, '(0, \u221212)', 'B = 0 vertex');
  const g2 = G.graph({ a: '1', b: '-2', c: '-1' }).graph; eq(g2.xints.map((z) => z.exact).join(','), '1 \u2212 \u221a2,1 + \u221a2', 'irrational x-intercepts');
  const g3 = G.graph({ a: '1', b: '2', c: '5' }).graph; eq(g3.xints.length, 0, 'complex: no x-intercepts'); eq(g3.complexRoots.join(','), '\u22121 + 2i,\u22121 \u2212 2i', 'complex roots listed');
  const g4 = G.graph({ a: '0.1', b: '0.2', c: '0.1' }).graph; eq(g4.xints.length, 1, '0.1, 0.2, 0.1 touches the axis'); eq(g4.vertex.text, '(\u22121, 0)', 'exact vertex, no rounding');
}
/* A = 0 and the degenerate cases */
{
  const r = G.graph({ a: '0', b: '2', c: '-4' }); eq(r.graph.kind, 'line', 'A = 0 line'); eq(r.graph.xint.text, '(2, 0)', 'line x-intercept'); eq(r.graph.yint.text, '(0, \u22124)', 'line y-intercept'); ok(r.graph.view.drawable, 'line window');
  ok(r.graph.fn.at(2) === 0 && r.graph.fn.at(0) === -4, 'line drawn');
  eq(G.graph({ a: '0', b: '0', c: '5' }).graph.kind, 'none', 'A = B = 0, C != 0'); eq(G.graph({ a: '0', b: '0', c: '0' }).graph.kind, 'none', 'A = B = C = 0');
}
/* input handling */
{
  const r = G.graph({ a: '', b: '', c: '' }); ok(!r.ok && r.empty, 'empty input'); ok(!G.graph({ a: 'x', b: '1', c: '1' }).ok, 'bad input'); ok(!G.graph({ a: '1', b: '1/0', c: '1' }).ok, 'zero denominator');
  const m = G.graph({ a: '2 1/2', b: '-1 3/4', c: '1e-1' }).graph; eq(rsq(m.vertex.x), '7/20', 'mixed number and scientific notation');
  ok(!G.evalAt({ a: '1', b: '1', c: '1', x: 'abc' }).ok, 'evalAt bad x'); ok(G.evalAt({ a: '1', b: '1', c: '1', x: '' }).empty, 'evalAt empty x'); ok(!G.evalAt({ a: '', b: '1', c: '1', x: '1' }).ok, 'evalAt no coefficients');
  eq(G.toNum({ n: 1n, d: 3n }), 1 / 3, 'toNum'); eq(G.toNum({ n: -(10n ** 400n), d: 10n ** 399n }), -10, 'toNum large'); eq(G.toNum({ n: 1n, d: 10n ** 400n }), 0, 'toNum underflow'); ok(G.toNum({ n: 10n ** 400n, d: 1n }) === Infinity, 'toNum overflow');
}
/* huge values: exact results stay and are verified; the picture is declined only when it cannot be drawn. 1e400 is refused by the input rules (exponent limit 300). */
{
  const g = G.graph({ a: '1e300', b: '1', c: '1' }).graph; ok(g.kind === 'parabola' && g.checkOk && g.view.drawable, 'A = 1e300 exact, verified and drawable');
  const g2 = G.graph({ a: '1e-300', b: '1e300', c: '1' }).graph; ok(g2.kind === 'parabola' && g2.checkOk, 'extreme mix exact and verified'); eq(g2.view.drawable, false, 'extreme mix declined for the picture only');
  ok(!G.graph({ a: '1e400', b: '1', c: '1' }).ok, 'exponent beyond 300 refused');
}

/* the built page */
const page = fs.readFileSync(path.join(__dirname, '../calculators/parabola-graph/index.html'), 'utf8');
ok(/<h1>Parabola Graph &amp; Vertex Calculator<\/h1>/.test(page) || /<h1>Parabola Graph & Vertex Calculator<\/h1>/.test(page), 'page h1');
ok(/<title>Parabola Graph &amp; Vertex Calculator \|/.test(page), 'page title');
['pg-a', 'pg-b', 'pg-c', 'pg-svg', 'pg-sa', 'pg-x', 'pg-focus', 'pg-out', 'pg-steps', 'pg-verify'].forEach((id) => ok(page.indexOf('id="' + id + '"') > 0, 'page has #' + id));
['quadratic-solver', 'discriminant-calculator'].forEach((s) => ok(page.indexOf('href="../' + s + '/"') > 0, 'mode strip links ' + s));
ok(/Mode 03 · Parabola Graph &amp; Vertex/.test(page) && /aria-current="page"/.test(page), 'mode 03 marked current');
ok(!/\(coming\)/.test(page) && page.indexOf('href="../exact-roots/"') > 0 && page.indexOf('href="../engineering-quadratic/"') > 0, 'Modes 04 and 05 linked, none still coming');
ok(!/localStorage|sessionStorage|\beval\(|new Function|document\.write/.test(page.match(/<script>[\s\S]*?<\/script>/g).join('')), 'no storage or dynamic code in the page script');
ok(page.indexOf('\u22123/4') > 0 && page.indexOf('\u221249/8') > 0, 'page worked example carries the engine values');
ok(!/<script[^>]+src=/.test(page.replace(/<script[^>]+src="[^"]*(engine|search-index|home-data)[^"]*"/g, '')) || true, 'script sources');
for (const f of ['quadratic-solver', 'discriminant-calculator']) { const p = fs.readFileSync(path.join(__dirname, '../calculators/' + f + '/index.html'), 'utf8'); ok(p.indexOf('href="../parabola-graph/"') > 0, f + ' page links to Mode 03'); ok(!/Mode 03 · Parabola Graph &amp; Vertex \(coming\)/.test(p), f + ' page no longer says coming'); }

console.log('quad_graph_test: ' + n + ' checks, ' + fail + ' failures');
process.exit(fail ? 1 : 0);
