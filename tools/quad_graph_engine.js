/* Elecmetric Quadratic Formula Calculator: engine for Mode 03 (Parabola Graph & Vertex).
   Built on the exact engine of Mode 01 (tools/quad_engine.js): the vertex, axis, intercepts, focus, directrix and table of values are exact rationals or exact radicals.
   Only the drawing window and the plotted curve use floating point, and the window never changes any value that is printed.
   graph(): everything about the parabola y = Ax^2 + Bx + C (a straight line when A = 0), the checks, the working and the suggested drawing window.
   evalAt(): y at any x, exact.
   Works in Node (module.exports) and in the browser (global QuadGraph, after Quad). */
(function (root) {
  'use strict';
  var Q = typeof module !== 'undefined' && module.exports ? require('./quad_engine.js') : root.Quad;
  var O = Q.ops, R = Q.R, rs = Q.rs, mn = Q.mn, add = O.add, sub = O.sub, mul = O.mul, div = O.div, neg = O.neg, sgn = O.sgn, isZero = O.isZero, eq = O.eq, ri = O.ri;
  var ZERO = ri(0), ONE = ri(1), TWO = ri(2), FOUR = ri(4);
  function sqr(x) { return mul(x, x); }
  function t(q) { return mn(rs(q)); }

  /* rational -> double without overflow in the intermediate BigInts; Infinity or 0 only when the value is outside the double range */
  function toNum(q) {
    var n = q.n, d = q.d, ng = n < 0n; if (ng) n = -n; if (n === 0n) return 0;
    var sh = n.toString(2).length - d.toString(2).length - 60, v;
    if (sh > 0) v = Number(n / (d << BigInt(sh))) * Math.pow(2, sh); else v = Number((n << BigInt(-sh)) / d) / Math.pow(2, -sh);
    return ng ? -v : v;
  }
  function floorDiv(n, d) { var q = n / d; if (n % d !== 0n && (n < 0n) !== (d < 0n)) q -= 1n; return q; }
  function decNum(text) { return parseFloat(String(text).replace(/\u2212/g, '-')); }
  function decOf(q, dp) { return Q.decOfRational(q, dp); }
  function pt(x, y, dp) {
    var dx = decOf(x, dp), dy = decOf(y, dp);
    return { x: x, y: y, xt: t(x), yt: t(y), xd: dx.text, yd: dy.text, exact: dx.exact && dy.exact, text: '(' + t(x) + ', ' + t(y) + ')', dtext: '(' + mn(dx.text) + ', ' + mn(dy.text) + ')' };
  }
  function f(A, B, C, x) { return add(add(mul(A, sqr(x)), mul(B, x)), C); }

  /* coefficient in front of a bracket: 1 -> '', -1 -> '-', fraction -> (3/4) */
  function coefTxt(c) { if (eq(c, ONE)) return ''; if (eq(c, neg(ONE))) return '\u2212'; var s = t(c); return c.d === 1n ? s : '(' + s + ')'; }
  function vertexForm(A, h, k) {
    var inner = isZero(h) ? 'x' : '(x ' + (sgn(h) > 0 ? '\u2212 ' : '+ ') + mn(rs(sgn(h) > 0 ? h : neg(h))) + ')';
    var s = 'y = ' + coefTxt(A) + inner + '\u00b2';
    if (!isZero(k)) s += (sgn(k) > 0 ? ' + ' : ' \u2212 ') + mn(rs(sgn(k) > 0 ? k : neg(k)));
    return s;
  }
  function standardForm(A, B, C) { return 'y = ' + mn(Q.equationText(A, B, C)).replace(/ = 0$/, ''); }

  /* ---------- suggested drawing window (floating point, for the picture only) ---------- */
  function fitWindow(fn, marks) {
    var xs = marks.slice(), xlo, xhi, ylo, yhi, ok = true;
    if (fn.kind === 'parabola') {
      var w0 = 2 * Math.sqrt(Math.max(Math.abs(fn.k), 1) / Math.abs(fn.a)); xs.push(fn.h - w0, fn.h + w0);
    }
    xs = xs.filter(function (v) { return isFinite(v); });
    if (!xs.length) return { x0: -10, x1: 10, y0: -10, y1: 10, drawable: false };
    xlo = Math.min.apply(null, xs); xhi = Math.max.apply(null, xs);
    if (!(xhi - xlo > 0)) { xlo -= 5; xhi += 5; }
    var px = 0.15 * (xhi - xlo); xlo -= px; xhi += px;
    var ys = [0, fn.at(xlo), fn.at(xhi)]; if (fn.kind === 'parabola') ys.push(fn.k); else ys.push(fn.c);
    ok = ys.every(isFinite); if (!ok) return { x0: -10, x1: 10, y0: -10, y1: 10, drawable: false };
    ylo = Math.min.apply(null, ys); yhi = Math.max.apply(null, ys);
    if (!(yhi - ylo > 0)) { ylo -= 5; yhi += 5; }
    var py = 0.12 * (yhi - ylo); ylo -= py; yhi += py;
    return { x0: xlo, x1: xhi, y0: ylo, y1: yhi, drawable: isFinite(xhi - xlo) && isFinite(yhi - ylo) && xhi - xlo > 0 && yhi - ylo > 0 };
  }

  /* ---------- the analysis ---------- */
  function graph(input) {
    var r = Q.solve(input);
    if (!r.ok) return r;
    var dp = r.dp, A = r.A, B = r.B, C = r.C, g = { dp: dp }, S = [];
    r.graph = g; r.graphSteps = S;
    if (r.degree !== 2) {
      g.kind = r.degree === 1 ? 'line' : 'none';
      if (r.degree === 1) {
        var x0 = r.roots[0].q, m = toNum(B), c = toNum(C);
        g.slope = B; g.yint = pt(ZERO, C, dp); g.xint = pt(x0, ZERO, dp);
        g.fn = { kind: 'line', m: m, c: c, at: function (x) { return m * x + c; } };
        g.view = fitWindow(g.fn, [0, toNum(x0)]);
        S.push('A = 0, so the graph is the straight line y = ' + t(B) + 'x + ' + t(C) + ', not a parabola. It crosses the y-axis at ' + g.yint.text + ' and the x-axis at ' + g.xint.text + '.');
      } else g.view = { x0: -10, x1: 10, y0: -10, y1: 10, drawable: true };
      return r;
    }
    g.kind = 'parabola';
    var D = r.D, h = r.vertex.x, k = r.vertex.y, p = div(ONE, mul(FOUR, A)), two = TWO;
    g.vertex = pt(h, k, dp); g.axis = 'x = ' + t(h); g.axisX = h;
    g.opens = r.opens; g.extremum = r.extremum; g.extremumValue = k;
    g.range = sgn(A) > 0 ? 'y \u2265 ' + t(k) : 'y \u2264 ' + t(k);
    g.trend = sgn(A) > 0 ? 'Decreasing for x < ' + t(h) + ', increasing for x > ' + t(h) : 'Increasing for x < ' + t(h) + ', decreasing for x > ' + t(h);
    g.yint = pt(ZERO, C, dp);
    g.mirror = pt(neg(div(B, A)), C, dp); g.mirrorSame = isZero(B);
    g.xints = D.n >= 0n ? r.roots.map(function (x) { return { exact: mn(x.exact), dec: mn(x.dec.text), num: x.q ? toNum(x.q) : decNum(x.dec.text), text: '(' + mn(x.exact) + ', 0)' }; }) : [];
    if (D.n < 0n) g.complexRoots = r.roots.map(function (x) { return mn(x.exact); });
    g.standard = standardForm(A, B, C); g.vertexForm = vertexForm(A, h, k);
    g.focus = pt(h, add(k, p), dp); g.directrix = 'y = ' + t(sub(k, p)); g.directrixY = sub(k, p);
    g.latus = div(ONE, sgn(A) > 0 ? A : neg(A)); g.latusText = t(g.latus);
    g.discriminant = r.discriminant; g.label = r.label;

    /* table of values around the vertex: whole numbers of x */
    var near = floorDiv(h.n * 2n + h.d, h.d * 2n), rows = [];
    for (var j = -3; j <= 3; j++) { var x = ri(near + BigInt(j)), y = f(A, B, C, x), dy = decOf(y, dp); rows.push({ x: t(x), y: t(y), yd: mn(dy.text), exact: dy.exact, isVertex: eq(x, h) }); }
    g.values = rows;

    /* exact checks, each by a different route */
    var chk = [];
    chk.push({ name: 'f(vertex x) = vertex y', ok: eq(f(A, B, C, h), k), value: t(f(A, B, C, h)) });
    chk.push({ name: 'Vertex y by C \u2212 B\u00b2/(4A) agrees with \u2212\u0394/(4A)', ok: eq(sub(C, div(sqr(B), mul(FOUR, A))), k), value: t(sub(C, div(sqr(B), mul(FOUR, A)))) });
    chk.push({ name: 'Slope 2A\u00b7h + B at the vertex is zero', ok: isZero(add(mul(mul(two, A), h), B)), value: t(add(mul(mul(two, A), h), B)) });
    var fm = f(A, B, C, add(h, ONE)), fl = f(A, B, C, sub(h, ONE));
    chk.push({ name: 'Symmetry: f(h + 1) = f(h \u2212 1)', ok: eq(fm, fl), value: t(fm) + ' and ' + t(fl) });
    chk.push({ name: 'Mirror of the y-intercept: f(\u2212B/A) = C', ok: eq(f(A, B, C, neg(div(B, A))), C), value: t(f(A, B, C, neg(div(B, A)))) });
    chk.push({ name: 'Vertex x is half the sum of the roots', ok: eq(div(r.sum, two), h), value: t(div(r.sum, two)) });
    var y1 = f(A, B, C, add(h, ONE)), dF = add(ONE, sqr(sub(y1, add(k, p)))), dL = sqr(sub(y1, sub(k, p)));
    chk.push({ name: 'Focus and directrix: a point of the curve is equally far from both', ok: eq(dF, dL), value: t(dF) + ' and ' + t(dL) });
    chk.push({ name: 'Each root, by exact substitution', ok: !!r.verifyOk, value: (r.verify || []).map(function (v) { return v.value; }).join(' and ') });
    g.checks = chk; g.checkOk = chk.every(function (c) { return c.ok; });

    /* the drawing */
    var a = toNum(A), hN = toNum(h), kN = toNum(k);
    g.fn = { kind: 'parabola', a: a, h: hN, k: kN, at: function (x) { var u = x - hN; return a * u * u + kN; } };
    var marks = [0, hN, toNum(g.mirror.x)]; g.xints.forEach(function (z) { marks.push(z.num); });
    g.view = fitWindow(g.fn, marks);

    /* working */
    S.push('Vertex. h = \u2212B/(2A) = \u2212(' + t(B) + ')/(2\u00b7' + t(A) + ') = ' + t(h) + '. Then k = f(h) = ' + t(k) + ', which is also \u2212\u0394/(4A) = \u2212(' + r.discriminant.replace(/-/g, '\u2212') + ')/(4\u00b7' + t(A) + '). The vertex is ' + g.vertex.text + '.');
    S.push('Axis of symmetry: the vertical line ' + g.axis + ' through the vertex. Points of the curve at equal distances either side of it have equal heights.');
    S.push('Opening: A = ' + t(A) + (sgn(A) > 0 ? ' is positive, so the parabola opens upward and the vertex is the lowest point.' : ' is negative, so the parabola opens downward and the vertex is the highest point.') + ' The ' + g.extremum + ' value is ' + t(k) + ', so the range is ' + g.range + '.');
    S.push('Y-intercept: x = 0 gives y = C = ' + t(C) + ', the point ' + g.yint.text + '.' + (g.mirrorSame ? ' B = 0, so this point lies on the axis of symmetry and is the vertex.' : ' Its mirror image across the axis is ' + g.mirror.text + '.'));
    if (D.n > 0n) S.push('X-intercepts: \u0394 = ' + r.discriminant.replace(/-/g, '\u2212') + ' > 0, so the curve crosses the x-axis at x = ' + g.xints.map(function (z) { return z.exact; }).join(' and x = ') + '.');
    else if (D.n === 0n) S.push('X-intercept: \u0394 = 0, so the curve touches the x-axis at one point, the vertex ' + g.vertex.text + '.');
    else S.push('X-intercepts: \u0394 = ' + r.discriminant.replace(/-/g, '\u2212') + ' < 0, so the curve does not meet the x-axis. The complex roots ' + g.complexRoots.join(' and ') + ' do not appear on this graph.');
    S.push('Vertex form: ' + g.vertexForm + '. Focus ' + g.focus.text + ', directrix ' + g.directrix + ', width of the curve at the focus (latus rectum) ' + g.latusText + '.');
    S.push('Exact checks: ' + (g.checkOk ? 'all ' + chk.length + ' hold.' : 'one did not hold.'));
    return r;
  }

  /* y at any x, exact */
  function evalAt(input) {
    var pa = Q.parseNum(input.a), pb = Q.parseNum(input.b), pc = Q.parseNum(input.c), px = Q.parseNum(input.x), dp = input.dp === undefined ? 8 : Math.max(2, Math.min(15, input.dp | 0));
    var bad = [pa, pb, pc].filter(function (z) { return z.error || z.empty; })[0];
    if (bad) return { ok: false, error: 'Enter A, B and C first.' };
    if (px.empty) return { ok: false, empty: true, error: '' };
    if (px.error) return { ok: false, error: px.error };
    var y = f(pa.v, pb.v, pc.v, px.v), d = decOf(y, dp);
    return { ok: true, x: px.v, y: y, xt: t(px.v), yt: t(y), yd: mn(d.text), exact: d.exact };
  }

  function summary(r) {
    if (!r.ok || !r.graph) return '';
    var g = r.graph, L = ['Equation: y = ' + mn(r.equation).replace(/ = 0$/, '')];
    if (g.kind !== 'parabola') { L.push(g.kind === 'line' ? 'A = 0: a straight line. Y-intercept ' + g.yint.text + ', x-intercept ' + g.xint.text : r.label); return L.join('\n'); }
    L.push('Opens: ' + g.opens + 'ward', 'Vertex: ' + g.vertex.text + (g.vertex.exact ? '' : '  \u2248 ' + g.vertex.dtext), 'Axis of symmetry: ' + g.axis, (g.extremum === 'minimum' ? 'Minimum' : 'Maximum') + ' value: ' + t(g.extremumValue), 'Range: ' + g.range, 'Y-intercept: ' + g.yint.text);
    L.push('X-intercepts: ' + (g.xints.length ? g.xints.map(function (z) { return z.text; }).join(', ') : 'none (complex roots ' + g.complexRoots.join(', ') + ')'));
    L.push('Discriminant: ' + mn(g.discriminant), 'Vertex form: ' + g.vertexForm, 'Focus: ' + g.focus.text + '; directrix: ' + g.directrix);
    L.push('Verified by exact arithmetic: ' + (g.checkOk ? 'yes' : 'NO'));
    return L.join('\n');
  }

  var api = { graph: graph, evalAt: evalAt, summary: summary, toNum: toNum, fitWindow: fitWindow };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.QuadGraph = api;
})(typeof window !== 'undefined' ? window : this);
