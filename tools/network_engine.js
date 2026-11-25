/* Elecmetric Matrix Calculator, Mode 05: electrical network matrix analysis.
   Nodal analysis (modified nodal analysis, handles voltage sources), mesh analysis (with supermesh for current sources),
   Y-bus and Z-bus, incidence and loop matrices, state-space analysis, symmetrical components and DC power flow.
   Phasor (complex) arithmetic throughout; DC circuits are the special case with zero imaginary parts.
   Every result carries independent checks (KCL, KVL, power balance, residuals, round trips).
   Required by tests/network_run.js and inlined by tools/matrix_page5.js. Needs MatrixDecomp (decomp_engine.js) for eigenvalues. */
(function (root) {
  'use strict';
  var EPS = 2.220446049250313e-16;
  var D = (typeof module !== 'undefined' && module.exports) ? require('./decomp_engine.js') : root.MatrixDecomp;
  var LIM = { nodes: 16, elems: 60, meshes: 10, buses: 14, states: 8 };

  /* ---------- complex arithmetic ---------- */
  function C(r, i) { return { r: r, i: i || 0 }; }
  function add(a, b) { return C(a.r + b.r, a.i + b.i); }
  function sub(a, b) { return C(a.r - b.r, a.i - b.i); }
  function mul(a, b) { return C(a.r * b.r - a.i * b.i, a.r * b.i + a.i * b.r); }
  function conj(a) { return C(a.r, -a.i); }
  function abs(a) { return Math.hypot(a.r, a.i); }
  function scl(a, s) { return C(a.r * s, a.i * s); }
  function div(a, b) { var d = b.r * b.r + b.i * b.i; return C((a.r * b.r + a.i * b.i) / d, (a.i * b.r - a.r * b.i) / d); }
  function inv(a) { return div(C(1, 0), a); }
  function expj(deg) { var t = deg * Math.PI / 180; return C(Math.cos(t), Math.sin(t)); }
  function czero(m, n) { var M = []; for (var i = 0; i < m; i++) { M.push([]); for (var j = 0; j < n; j++) M[i].push(C(0, 0)); } return M; }
  function cmm(A, B) { var m = A.length, k = B.length, n = B[0].length, R = czero(m, n), i, j, p; for (i = 0; i < m; i++) for (j = 0; j < n; j++) { var s = C(0, 0); for (p = 0; p < k; p++) s = add(s, mul(A[i][p], B[p][j])); R[i][j] = s; } return R; }
  function cmv(A, v) { return A.map(function (r) { var s = C(0, 0); r.forEach(function (z, j) { s = add(s, mul(z, v[j])); }); return s; }); }
  function norm1(A) { var mx = 0, n = A[0].length; for (var j = 0; j < n; j++) { var s = 0; for (var i = 0; i < A.length; i++) s += abs(A[i][j]); mx = Math.max(mx, s); } return mx; }
  function normInfV(v) { var m = 0; v.forEach(function (z) { m = Math.max(m, abs(z)); }); return m; }
  function normInfM(A) { var mx = 0; A.forEach(function (r) { var s = 0; r.forEach(function (z) { s += abs(z); }); mx = Math.max(mx, s); }); return mx; }
  /* LU with scaled partial pivoting. Returns {lu, perm, singular, row} */
  function cLU(A) {
    var n = A.length, M = A.map(function (r) { return r.map(function (z) { return C(z.r, z.i); }); }), perm = [], i, j, k, sc = [], mx = 0, singular = false, badRow = -1;
    for (i = 0; i < n; i++) { perm.push(i); var s = 0; for (j = 0; j < n; j++) s = Math.max(s, abs(M[i][j])); sc.push(s || 1); mx = Math.max(mx, s); }
    for (k = 0; k < n; k++) {
      var p = k, best = -1;
      for (i = k; i < n; i++) { var r = abs(M[i][k]) / sc[i]; if (r > best) { best = r; p = i; } }
      if (p !== k) { var t = M[p]; M[p] = M[k]; M[k] = t; t = sc[p]; sc[p] = sc[k]; sc[k] = t; t = perm[p]; perm[p] = perm[k]; perm[k] = t; }
      if (abs(M[k][k]) <= 1e-13 * mx || abs(M[k][k]) === 0) { singular = true; badRow = perm[k]; continue; }
      for (i = k + 1; i < n; i++) { var f = div(M[i][k], M[k][k]); M[i][k] = f; for (j = k + 1; j < n; j++) M[i][j] = sub(M[i][j], mul(f, M[k][j])); }
    }
    return { lu: M, perm: perm, singular: singular, badRow: badRow, n: n };
  }
  function cSolveLU(F, b) {
    var n = F.n, y = [], i, j;
    for (i = 0; i < n; i++) { var s = b[F.perm[i]]; for (j = 0; j < i; j++) s = sub(s, mul(F.lu[i][j], y[j])); y.push(s); }
    var x = new Array(n); for (i = n - 1; i >= 0; i--) { var t = y[i]; for (j = i + 1; j < n; j++) t = sub(t, mul(F.lu[i][j], x[j])); x[i] = div(t, F.lu[i][i]); }
    return x;
  }
  function cInverse(A) { var n = A.length, F = cLU(A); if (F.singular) return null; var X = czero(n, n), j, i; for (j = 0; j < n; j++) { var e = []; for (i = 0; i < n; i++) e.push(i === j ? C(1, 0) : C(0, 0)); var c = cSolveLU(F, e); for (i = 0; i < n; i++) X[i][j] = c[i]; } return X; }

  /* ---------- formatting ---------- */
  function num(x, tiny) {
    if (Math.abs(x) <= (tiny || 0)) return '0';
    var a = Math.abs(x);
    if (a >= 1e7 || a < 1e-4) return x.toExponential(5).replace(/\.?0+e/, 'e').replace('e+', 'e');
    return String(parseFloat(x.toPrecision(7)));
  }
  function sci(x) { if (x === 0) return '0'; return x.toExponential(2).replace('e+', 'e'); }
  function cnum(z, tiny) {
    var re = num(z.r, tiny), im = num(Math.abs(z.i), tiny);
    if (im === '0') return re;
    if (re === '0') return (z.i < 0 ? '−' : '') + (im === '1' ? '' : im) + 'j';
    return re + (z.i < 0 ? ' − ' : ' + ') + (im === '1' ? '' : im) + 'j';
  }
  function pol(z, tiny) { var m = abs(z); if (m <= (tiny || 0)) return '0'; var a = Math.atan2(z.i, z.r) * 180 / Math.PI; return num(m, 0) + '∠' + num(a, 1e-9) + '°'; }
  function isReal(list) { var mx = 0, mi = 0; list.forEach(function (z) { mx = Math.max(mx, Math.abs(z.r)); mi = Math.max(mi, Math.abs(z.i)); }); return mi <= 1e-12 * Math.max(mx, 1e-300); }
  function tinyOf(list) { var m = 0; list.forEach(function (z) { m = Math.max(m, abs(z)); }); return 1e-12 * m; }
  function showC(z, ac, tiny) { return ac ? (Math.abs(z.i) <= tiny ? num(z.r, tiny) : pol(z, tiny) + '  (' + cnum(z, tiny) + ')') : num(z.r, tiny); }
  function fmtCM(M, label, tiny) { var t = M.map(function (r) { return r.map(function (z) { return cnum(z, tiny); }); }); return { label: label, rows: M.length, cols: M[0].length, text: t, dec: t }; }
  function fmtRM(M, label) { var t = M.map(function (r) { return r.map(function (x) { return num(x, 1e-13); }); }); return { label: label, rows: M.length, cols: M[0].length, text: t, dec: t }; }
  function reOf(M) { return M.map(function (r) { return r.map(function (z) { return z.r; }); }); }
  function imOf(M) { return M.map(function (r) { return r.map(function (z) { return z.i; }); }); }

  /* ---------- checks ---------- */
  function verdict(res, n) { var lim = 1e3 * Math.max(n, 1) * EPS; return res <= lim ? 'pass' : res <= 1e5 * Math.max(n, 1) * EPS ? 'reduced' : 'fail'; }
  function chk(label, value, n) { return { label: label, value: value, text: sci(value), state: verdict(value, n) }; }
  function chkCond(c) { return { label: 'Condition number κ₁ of the system matrix', value: c, text: sci(c), state: c < 1e8 ? 'pass' : c < 1e13 ? 'reduced' : 'fail' }; }
  function overall(checks) { var w = 'pass'; checks.forEach(function (c) { if (c.state === 'fail') w = 'fail'; else if (c.state === 'reduced' && w !== 'fail') w = 'reduced'; }); return w; }
  function statusText(w) { return w === 'pass' ? 'All checks passed' : w === 'reduced' ? 'Reduced accuracy (ill-conditioned network)' : 'Checks failed: treat the result with caution'; }

  /* ---------- parsing ---------- */
  var SUF = { f: 1e-15, p: 1e-12, n: 1e-9, u: 1e-6, 'µ': 1e-6, 'μ': 1e-6, m: 1e-3, k: 1e3, K: 1e3, M: 1e6, meg: 1e6, MEG: 1e6, Meg: 1e6, G: 1e9, g: 1e9, T: 1e12 };
  function parseReal(s) {
    s = String(s).replace(/−/g, '-');
    if (s.indexOf('/') > 0) { var p = s.split('/'); if (p.length !== 2) return NaN; var a = parseReal(p[0]), b = parseReal(p[1]); return b === 0 ? NaN : a / b; }
    var m = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)(meg|MEG|Meg|[fpnuµμmkKMGgT])?$/.exec(s);
    if (!m) return NaN; var v = parseFloat(m[1]); return m[2] ? v * SUF[m[2]] : v;
  }
  var NUMRE = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
  function parseComplex(s) {
    s = String(s).replace(/−/g, '-');
    var pm = /[<∠@]/.exec(s);
    if (pm) { var mag = parseReal(s.slice(0, pm.index)), ang = parseFloat(s.slice(pm.index + 1)); if (!isFinite(mag) || !isFinite(ang) || !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?°?$/.test(s.slice(pm.index + 1).replace(/°$/, '') + '')) { return null; } var e = expj(ang); return C(mag * e.r, mag * e.i); }
    if (/[jJi]$/.test(s)) {
      var body = s.slice(0, -1), idx = -1, k;
      for (k = body.length - 1; k > 0; k--) { var ch = body[k]; if ((ch === '+' || ch === '-') && !/[eE]/.test(body[k - 1])) { idx = k; break; } }
      var re = idx > 0 ? body.slice(0, idx) : '0', im = idx > 0 ? body.slice(idx) : body;
      if (im === '' || im === '+') im = '1'; else if (im === '-') im = '-1';
      if (!NUMRE.test(re) || !NUMRE.test(im)) return null;
      return C(parseFloat(re), parseFloat(im));
    }
    var v = parseReal(s); return isFinite(v) ? C(v, 0) : null;
  }
  function parseLines(text) {
    var out = [], raw = String(text || '').split(/\r?\n/);
    raw.forEach(function (ln, k) { ln = ln.replace(/#.*$/, '').replace(/\/\/.*$/, '').trim(); if (ln) out.push({ no: k + 1, toks: ln.split(/\s+/), text: ln }); });
    return out;
  }
  function labelOrder(set) { var a = Object.keys(set); a.sort(function (x, y) { var nx = /^\d+$/.test(x), ny = /^\d+$/.test(y); if (nx && ny) return +x - +y; if (nx) return -1; if (ny) return 1; return x < y ? -1 : x > y ? 1 : 0; }); return a; }
  function isGnd(t) { return t === '0' || /^(gnd|ground)$/i.test(t); }
  function bad(no, msg) { return { error: 'Line ' + no + ': ' + msg }; }

  /* ---------- circuit text for nodal and mesh ---------- */
  function parseCircuit(text, mesh) {
    var L = parseLines(text), els = [], names = {}, freq = 0, i, nodeSet = {}, hasGnd = false, TYPES = 'RLCZYVI';
    for (i = 0; i < L.length; i++) {
      var t = L[i].toks, no = L[i].no;
      if (/^freq(uency)?$/i.test(t[0])) { if (t.length !== 2) return bad(no, 'write the frequency as "freq 50" (hertz).'); var f = parseReal(t[1]); if (!isFinite(f) || f < 0) return bad(no, 'the frequency must be a number of hertz, zero or more.'); freq = f; continue; }
      var type = t[0][0].toUpperCase();
      if (TYPES.indexOf(type) < 0) return bad(no, 'the element name "' + t[0] + '" must start with R, L, C, Z, Y, V or I.');
      if (names[t[0].toUpperCase()]) return bad(no, 'the name ' + t[0] + ' is used twice.');
      names[t[0].toUpperCase()] = 1;
      var el = { name: t[0], type: type, no: no };
      if (mesh) {
        if (t.length < 3 || t.length > 4) return bad(no, 'write a mesh element as "name value mesh" or "name value mesh1 mesh2".');
        el.valueText = t[1]; el.m1 = t[2]; el.m2 = t.length === 4 ? t[3] : null;
        if (el.m2 !== null && el.m1 === el.m2) return bad(no, 'the two meshes of ' + t[0] + ' are the same.');
        nodeSet[el.m1] = 1; if (el.m2 !== null) nodeSet[el.m2] = 1;
      } else {
        if (t.length !== 4) return bad(no, 'write an element as "name node1 node2 value", for example R1 1 2 100.');
        el.a = t[1]; el.b = t[2]; el.valueText = t[3];
        if (el.a === el.b || (isGnd(el.a) && isGnd(el.b))) return bad(no, t[0] + ' connects a node to itself.');
        if (isGnd(el.a)) { el.a = '0'; hasGnd = true; } else nodeSet[el.a] = 1;
        if (isGnd(el.b)) { el.b = '0'; hasGnd = true; } else nodeSet[el.b] = 1;
      }
      var z = (type === 'R' || type === 'L' || type === 'C') ? (function () { var v = parseReal(el.valueText); return isFinite(v) ? C(v, 0) : null; })() : parseComplex(el.valueText);
      if (!z) return bad(no, 'cannot read the value "' + el.valueText + '" of ' + t[0] + '. Use a number (suffixes k, M, m, u, n, p), or a phasor such as 3+4j or 10<30.');
      el.val = z;
      if ((type === 'R' || type === 'L' || type === 'C' || type === 'Z' || type === 'Y') && abs(z) === 0) return bad(no, t[0] + ' must not be zero' + (type === 'R' ? ' (use a 0 V source for a short circuit).' : '.'));
      if ((type === 'R' || type === 'L' || type === 'C') && z.r < 0 && type !== 'R') return bad(no, t[0] + ' must be positive.');
      els.push(el);
    }
    if (!els.length) return { error: 'Enter at least one element, one per line. See the format note below the box.' };
    if (els.length > LIM.elems) return { error: 'Too many elements: the limit is ' + LIM.elems + '.' };
    var labels = labelOrder(nodeSet);
    if (labels.length > (mesh ? LIM.meshes : LIM.nodes)) return { error: 'Too many ' + (mesh ? 'meshes' : 'nodes') + ': the limit is ' + (mesh ? LIM.meshes : LIM.nodes) + '.' };
    if (!mesh && !hasGnd) return { error: 'No ground node. Use node 0 (or gnd) as the reference for at least one element.' };
    var hasLC = els.some(function (e) { return e.type === 'L' || e.type === 'C'; });
    if (hasLC && !(freq > 0)) return { error: 'The circuit has an inductor or capacitor, so it needs a frequency. Add a line such as "freq 50" (hertz).' };
    var w = 2 * Math.PI * freq;
    els.forEach(function (e) {
      if (e.type === 'R' || e.type === 'Z') e.z = e.val; else if (e.type === 'L') e.z = C(0, w * e.val.r); else if (e.type === 'C') e.z = C(0, -1 / (w * e.val.r)); else if (e.type === 'Y') e.z = inv(e.val);
      if (e.z) e.y = inv(e.z);
    });
    var ac = hasLC || els.some(function (e) { return Math.abs(e.val.i) > 0; });
    return { els: els, labels: labels, freq: freq, ac: ac, w: w };
  }

  /* ---------- nodal analysis ---------- */
  function doNodal(text) {
    var P = parseCircuit(text, false); if (P.error) return { ok: false, error: P.error };
    var els = P.els, labels = P.labels, n = labels.length, idx = { '0': -1 }, i, j;
    if (n === 0) return { ok: false, error: 'The circuit has no node other than ground.' };
    labels.forEach(function (l, k) { idx[l] = k; });
    var vs = els.filter(function (e) { return e.type === 'V'; }), m = vs.length, N = n + m;
    /* connectivity: every node needs a path to ground through R, L, C, Z, Y or V elements */
    var par = {}; function find(x) { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; }
    ['0'].concat(labels).forEach(function (l) { par[l] = l; });
    els.forEach(function (e) { if (e.type !== 'I') par[find(e.a)] = find(e.b); });
    for (i = 0; i < labels.length; i++) if (find(labels[i]) !== find('0')) return { ok: false, error: 'Node ' + labels[i] + ' has no path to ground. A node joined to the rest only through current sources is undefined: add a resistor or another element to ground.' };
    var Y = czero(n, n), M = czero(N, N), rhs = []; for (i = 0; i < N; i++) rhs.push(C(0, 0));
    var stamps = [];
    els.forEach(function (e) {
      var a = idx[e.a], b = idx[e.b];
      if (e.y) {
        if (a >= 0) { Y[a][a] = add(Y[a][a], e.y); } if (b >= 0) { Y[b][b] = add(Y[b][b], e.y); }
        if (a >= 0 && b >= 0) { Y[a][b] = sub(Y[a][b], e.y); Y[b][a] = sub(Y[b][a], e.y); }
        stamps.push(e.name + ': admittance ' + cnum(e.y, 1e-15) + ' S between ' + e.a + ' and ' + e.b + ' added to Y[' + e.a + '][' + e.a + '] and Y[' + e.b + '][' + e.b + '], subtracted from the off-diagonal entries.');
      } else if (e.type === 'I') {
        if (a >= 0) rhs[a] = sub(rhs[a], e.val); if (b >= 0) rhs[b] = add(rhs[b], e.val);
        stamps.push(e.name + ': current source of ' + cnum(e.val, 1e-15) + ' A flowing from ' + e.a + ' through the source to ' + e.b + ' removes it from node ' + e.a + ' and injects it into node ' + e.b + '.');
      }
    });
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) M[i][j] = Y[i][j];
    vs.forEach(function (e, k) {
      var a = idx[e.a], b = idx[e.b], r = n + k;
      if (a >= 0) { M[a][r] = add(M[a][r], C(1, 0)); M[r][a] = add(M[r][a], C(1, 0)); }
      if (b >= 0) { M[b][r] = sub(M[b][r], C(1, 0)); M[r][b] = sub(M[r][b], C(1, 0)); }
      rhs[r] = e.val; e.k = k;
      stamps.push(e.name + ': voltage source of ' + cnum(e.val, 1e-15) + ' V, v(' + e.a + ') − v(' + e.b + ') = ' + cnum(e.val, 1e-15) + '. Its current becomes an extra unknown (row and column ' + (r + 1) + ').');
    });
    var F = cLU(M);
    if (F.singular) return { ok: false, error: 'The system matrix is singular, so the circuit has no unique solution. Typical causes: voltage sources in a loop or in parallel with each other, or a part of the circuit that is not tied to ground.' };
    var x = cSolveLU(F, rhs), Mi = cInverse(M), cond = norm1(M) * norm1(Mi);
    var V = {}; V['0'] = C(0, 0); labels.forEach(function (l, k) { V[l] = x[k]; });
    var rows = [], Sabs = C(0, 0), Sdel = C(0, 0), Smag = 0, maxI = 0, leave = {};
    ['0'].concat(labels).forEach(function (l) { leave[l] = C(0, 0); });
    els.forEach(function (e) {
      var vd = sub(V[e.a], V[e.b]), cur;
      if (e.y) cur = mul(e.y, vd); else if (e.type === 'I') cur = e.val; else cur = x[n + e.k];
      var S = mul(vd, conj(cur)); e.vd = vd; e.cur = cur; e.S = S;
      leave[e.a] = add(leave[e.a], cur); leave[e.b] = sub(leave[e.b], cur);
      Sabs = add(Sabs, S); Smag += abs(S); maxI = Math.max(maxI, abs(cur));
      if (S.r < 0 && (e.type === 'V' || e.type === 'I')) Sdel = sub(Sdel, S);
    });
    var kclMax = 0; labels.forEach(function (l) { kclMax = Math.max(kclMax, abs(leave[l])); });
    var resid = cmv(M, x).map(function (z, k) { return sub(z, rhs[k]); }), rN = normInfV(resid) / (normInfM(M) * normInfV(x) + normInfV(rhs) || 1);
    var checks = [chk('Largest KCL imbalance at a node / largest element current', kclMax / (maxI || 1), N), chk('Power balance |ΣS| / Σ|S| (all elements)', Smag > 0 ? abs(Sabs) / Smag : 0, N), chk('‖Mx − b‖ / (‖M‖‖x‖ + ‖b‖)', rN, N), chkCond(cond)];
    var all = labels.map(function (l) { return V[l]; }).concat(els.map(function (e) { return e.cur; })).concat(els.map(function (e) { return e.vd; })), real = isReal(all) && !P.ac || isReal(all), ac = !real, tiny = tinyOf(all);
    var tables = [{ title: 'Node voltages', head: ac ? ['Node', 'Voltage (V)'] : ['Node', 'Voltage (V)'], rows: labels.map(function (l) { return ['v(' + l + ')', showC(V[l], ac, tiny)]; }) }];
    tables.push({ title: 'Element results (current flows from the first node to the second through the element)', head: ['Element', 'Nodes', 'Voltage a→b (V)', 'Current a→b (A)', 'Power absorbed' + (ac ? ' S = V·I*' : ' (W)')], rows: els.map(function (e) { return [e.name, e.a + ' → ' + e.b, showC(e.vd, ac, tiny), showC(e.cur, ac, tiny), ac ? cnum(e.S, tiny * tiny / 1e-12 + 1e-300) : num(e.S.r, tiny * tiny + 1e-300)]; }) });
    var lines = [labels.length + ' nodes (plus ground), ' + els.length + ' elements, ' + m + ' voltage source' + (m === 1 ? '' : 's') + '. System size ' + N + ' × ' + N + '.'];
    if (ac) lines.push('AC phasor analysis' + (P.freq > 0 ? ' at ' + num(P.freq, 0) + ' Hz (ω = ' + num(P.w, 0) + ' rad/s)' : '') + '. Phasors are used exactly as entered (RMS or peak); S = V·I* is in the same units. Negative real power means the element delivers power.');
    else lines.push('DC analysis. Negative power means the element delivers power.');
    lines.push('Power delivered by sources: ' + (ac ? cnum(Sdel, tiny * tiny + 1e-300) + ' VA' : num(Sdel.r, 1e-300) + ' W') + '.');
    var steps = ['Choose ground (node 0) as the reference. Each remaining node gets one unknown voltage.', 'Write KCL at each node: the sum of currents leaving through the elements equals the current injected by sources. For element with admittance y between nodes a and b this gives y(v_a − v_b), so the matrix is [Y][V] = [I].'].concat(stamps);
    if (m) steps.push('Voltage sources fix a voltage difference rather than a current, so their currents are added as unknowns and the matrix is augmented with one row per source (modified nodal analysis). This is why the system size is ' + N + '.');
    steps.push('Solve with LU decomposition and scaled partial pivoting. Check: the element currents are recomputed from the solved voltages and KCL is tested at every node, and the powers of all elements are summed (Tellegen: the sum is zero).');
    var mats = [fmtCM(Y, 'Nodal admittance matrix Y from the passive elements (S), rows and columns in node order ' + labels.join(', '), 1e-15)];
    if (m) mats.push(fmtCM(M, 'Augmented system matrix M (nodes, then voltage-source currents)', 1e-15));
    mats.push(fmtCM(rhs.map(function (z) { return [z]; }), 'Right-hand side (injected currents, then source voltages)', 1e-15));
    mats.push(fmtCM(x.map(function (z) { return [z]; }), 'Solution x (node voltages, then currents into the + terminal of each voltage source)', tiny));
    var raw = { labels: labels, V: labels.map(function (l) { return [V[l].r, V[l].i]; }), elems: els.map(function (e) { return { name: e.name, a: e.a, b: e.b, i: [e.cur.r, e.cur.i], v: [e.vd.r, e.vd.i] }; }), cond: cond, Y: Y.map(function (r) { return r.map(function (z) { return [z.r, z.i]; }); }) };
    return { ok: true, title: 'Nodal analysis (modified nodal analysis)', status: statusText(overall(checks)), lines: lines, mats: mats, tables: tables, checks: checks, steps: steps, capped: false, copy: ac ? [] : [['Y', reOf(Y)]], raw: raw };
  }

  /* ---------- mesh analysis ---------- */
  function doMesh(text) {
    var P = parseCircuit(text, true); if (P.error) return { ok: false, error: P.error };
    var els = P.els, labels = P.labels, n = labels.length, idx = {}, i, j;
    labels.forEach(function (l, k) { idx[l] = k; });
    var Z = czero(n, n), E = [], cs = [], touch = {};
    for (i = 0; i < n; i++) E.push(C(0, 0));
    for (i = 0; i < els.length; i++) {
      var e = els[i], a = idx[e.m1], b = e.m2 === null ? -1 : idx[e.m2];
      if (e.type === 'V') { E[a] = add(E[a], e.val); if (b >= 0) E[b] = sub(E[b], e.val); }
      else if (e.type === 'I') { cs.push(e); touch[a] = (touch[a] || 0) + 1; if (b >= 0) touch[b] = (touch[b] || 0) + 1; }
      else { Z[a][a] = add(Z[a][a], e.z); if (b >= 0) { Z[b][b] = add(Z[b][b], e.z); Z[a][b] = sub(Z[a][b], e.z); Z[b][a] = sub(Z[b][a], e.z); } }
    }
    for (i = 0; i < n; i++) if (touch[i] > 1) return { ok: false, error: 'Mesh ' + labels[i] + ' contains more than one current source. Mesh analysis here handles one current source per mesh (shared sources form a supermesh). Use nodal analysis for this circuit.' };
    var M = Z.map(function (r) { return r.slice(); }), rhs = E.slice(), super_ = [];
    cs.forEach(function (e) {
      var a = idx[e.m1], b = e.m2 === null ? -1 : idx[e.m2];
      if (b < 0) { for (j = 0; j < n; j++) M[a][j] = C(0, 0); M[a][a] = C(1, 0); rhs[a] = e.val; super_.push(e.name + ' is only in mesh ' + e.m1 + ', so it fixes the mesh current: I' + e.m1 + ' = ' + cnum(e.val, 1e-15) + '.'); }
      else {
        for (j = 0; j < n; j++) M[a][j] = add(Z[a][j], Z[b][j]); rhs[a] = add(E[a], E[b]);
        for (j = 0; j < n; j++) M[b][j] = C(0, 0); M[b][a] = C(1, 0); M[b][b] = C(-1, 0); rhs[b] = e.val;
        super_.push(e.name + ' is shared by meshes ' + e.m1 + ' and ' + e.m2 + ', so they form a supermesh: add the two KVL equations (the unknown voltage across the source cancels) and use the constraint I' + e.m1 + ' − I' + e.m2 + ' = ' + cnum(e.val, 1e-15) + '.');
      }
    });
    var F = cLU(M); if (F.singular) return { ok: false, error: 'The mesh equations are singular, so the circuit has no unique solution. Check for a mesh with no impedance, or a source loop.' };
    var I = cSolveLU(F, rhs), Mi = cInverse(M), cond = norm1(M) * norm1(Mi);
    var Sabs = C(0, 0), Smag = 0, maxI = 0;
    /* element currents and drops along mesh m1's clockwise direction */
    els.forEach(function (e) {
      var a = idx[e.m1], b = e.m2 === null ? -1 : idx[e.m2]; e.cur = b >= 0 ? sub(I[a], I[b]) : I[a];
      if (e.type === 'V') e.drop = scl(e.val, -1); else if (e.type !== 'I') e.drop = mul(e.z, e.cur);
    });
    /* voltage across each current source from KVL of its first mesh */
    cs.forEach(function (e) { var a = idx[e.m1], s = C(0, 0); els.forEach(function (o) { if (o === e || o.type === 'I') return; var ia = idx[o.m1], ib = o.m2 === null ? -1 : idx[o.m2]; if (ia === a) s = add(s, o.drop); else if (ib === a) s = sub(s, o.drop); }); e.drop = scl(s, -1); });
    els.forEach(function (e) { e.S = mul(e.drop, conj(e.cur)); Sabs = add(Sabs, e.S); Smag += abs(e.S); maxI = Math.max(maxI, abs(e.cur)); });
    var kvl = 0, maxV = 0;
    for (i = 0; i < n; i++) { var s = C(0, 0); els.forEach(function (o) { var ia = idx[o.m1], ib = o.m2 === null ? -1 : idx[o.m2]; if (ia === i) s = add(s, o.drop); else if (ib === i) s = sub(s, o.drop); }); kvl = Math.max(kvl, abs(s)); }
    els.forEach(function (o) { maxV = Math.max(maxV, abs(o.drop)); });
    var resid = cmv(M, I).map(function (z, k) { return sub(z, rhs[k]); }), rN = normInfV(resid) / (normInfM(M) * normInfV(I) + normInfV(rhs) || 1);
    var checks = [chk('Largest KVL imbalance around a mesh / largest element voltage', kvl / (maxV || 1), n), chk('Power balance |ΣS| / Σ|S| (all elements)', Smag > 0 ? abs(Sabs) / Smag : 0, n), chk('‖Mx − b‖ / (‖M‖‖x‖ + ‖b‖)', rN, n), chkCond(cond)];
    var all = I.concat(els.map(function (e) { return e.drop; })), ac = !isReal(all), tiny = tinyOf(all);
    var tables = [{ title: 'Mesh currents (all meshes clockwise)', head: ['Mesh', 'Current (A)'], rows: labels.map(function (l, k) { return ['I' + l, showC(I[k], ac, tiny)]; }) }, { title: 'Element results (current and voltage in the clockwise direction of the first mesh listed)', head: ['Element', 'Meshes', 'Current (A)', 'Voltage drop (V)', 'Power absorbed' + (ac ? ' S = V·I*' : ' (W)')], rows: els.map(function (e) { return [e.name, e.m1 + (e.m2 !== null ? ', ' + e.m2 : ''), showC(e.cur, ac, tiny), showC(e.drop, ac, tiny), ac ? cnum(e.S, tiny * tiny + 1e-300) : num(e.S.r, tiny * tiny + 1e-300)]; }) }];
    var lines = [n + ' meshes, ' + els.length + ' elements. Every mesh current is taken clockwise, so a shared element carries I_a − I_b and the mutual terms in Z are negative.'];
    if (ac) lines.push('AC phasor analysis' + (P.freq > 0 ? ' at ' + num(P.freq, 0) + ' Hz' : '') + '. Phasors are used exactly as entered; S = V·I*.'); else lines.push('DC analysis. Negative power means the element delivers power.');
    var steps = ['Assign a clockwise mesh current to every mesh.', 'Write KVL around each mesh: Z[a][a] is the sum of impedances in mesh a, Z[a][b] is minus the sum of the impedances shared with mesh b, and E[a] is the sum of the source EMFs that push current clockwise in mesh a. This gives [Z][I] = [E].'].concat(super_);
    steps.push('Solve with LU decomposition and scaled partial pivoting. Check: element voltages are recomputed from the solved currents and KVL is summed around every mesh (a voltage across a current source comes from one mesh, so the other mesh of a supermesh gives an independent test), and the powers of all elements are summed.');
    var mats = [fmtCM(Z, 'Mesh impedance matrix Z (Ω), before any current-source rows are substituted', 1e-15), fmtCM(E.map(function (z) { return [z]; }), 'EMF vector E (V)', 1e-15)];
    if (cs.length) mats.push(fmtCM(M, 'Matrix actually solved (current-source rows substituted)', 1e-15));
    mats.push(fmtCM(I.map(function (z) { return [z]; }), 'Mesh currents I (A)', tiny));
    var raw = { labels: labels, I: I.map(function (z) { return [z.r, z.i]; }), elems: els.map(function (e) { return { name: e.name, m1: e.m1, m2: e.m2, i: [e.cur.r, e.cur.i], v: [e.drop.r, e.drop.i] }; }), cond: cond };
    return { ok: true, title: 'Mesh analysis', status: statusText(overall(checks)), lines: lines, mats: mats, tables: tables, checks: checks, steps: steps, capped: false, copy: ac ? [] : [['Z', reOf(Z)]], raw: raw };
  }

  /* ---------- Y-bus and Z-bus ---------- */
  function parseBus(text) {
    var L = parseLines(text), br = [], sh = [], set = {}, ref = null, i;
    for (i = 0; i < L.length; i++) {
      var t = L[i].toks, no = L[i].no, k = t[0].toLowerCase(), r;
      if (k === 'ref') { if (t.length !== 2) return bad(no, 'write "ref 3" to choose a reference bus.'); ref = t[1]; continue; }
      if (k === 'line' || k === 'xfmr') {
        var need = k === 'line' ? [5, 6] : [6, 6]; if (t.length < need[0] || t.length > need[1]) return bad(no, k === 'line' ? 'write "line from to r x" or "line from to r x bch" (bch is the total line-charging susceptance).' : 'write "xfmr from to r x tap" (the tap ratio is on the "from" side).');
        var v = t.slice(3).map(parseReal); if (v.some(function (x) { return !isFinite(x); })) return bad(no, 'cannot read a number on this line.');
        if (v[0] === 0 && v[1] === 0) return bad(no, 'the series impedance r + jx must not be zero.');
        if (v[0] < 0) return bad(no, 'the resistance r must not be negative.');
        var b = { kind: k, a: t[1], b: t[2], r: v[0], x: v[1], bch: k === 'line' && v.length > 2 ? v[2] : 0, tap: k === 'xfmr' ? v[2] : 1 };
        if (b.tap <= 0) return bad(no, 'the tap ratio must be greater than zero.');
        if (b.a === b.b) return bad(no, 'a branch cannot connect a bus to itself.');
        if (t[1] === '0' || t[2] === '0') return bad(no, 'bus 0 is not used here. Use "shunt" for connections to ground.');
        set[b.a] = 1; set[b.b] = 1; br.push(b); continue;
      }
      if (k === 'shunt') { if (t.length !== 4) return bad(no, 'write "shunt bus g b" (shunt admittance g + jb to ground).'); var g = parseReal(t[2]), bb = parseReal(t[3]); if (!isFinite(g) || !isFinite(bb)) return bad(no, 'cannot read the shunt values.'); set[t[1]] = 1; sh.push({ a: t[1], g: g, b: bb }); continue; }
      return bad(no, 'unknown keyword "' + t[0] + '". Use line, xfmr, shunt or ref.');
    }
    var labels = labelOrder(set); if (labels.length < 2) return { error: 'Enter at least one line or transformer between two buses.' };
    if (labels.length > LIM.buses) return { error: 'Too many buses: the limit is ' + LIM.buses + '.' };
    if (ref !== null && labels.indexOf(ref) < 0) return { error: 'The reference bus ' + ref + ' is not in the network.' };
    return { br: br, sh: sh, labels: labels, ref: ref };
  }
  function buildYbus(P) {
    var n = P.labels.length, idx = {}, Y = czero(n, n); P.labels.forEach(function (l, k) { idx[l] = k; });
    P.br.forEach(function (e) {
      var i = idx[e.a], j = idx[e.b], y = inv(C(e.r, e.x)), a = e.tap, hb = C(0, e.bch / 2);
      Y[i][i] = add(Y[i][i], add(scl(y, 1 / (a * a)), hb)); Y[j][j] = add(Y[j][j], add(y, hb));
      Y[i][j] = sub(Y[i][j], scl(y, 1 / a)); Y[j][i] = sub(Y[j][i], scl(y, 1 / a));
    });
    P.sh.forEach(function (s) { var i = idx[s.a]; Y[i][i] = add(Y[i][i], C(s.g, s.b)); });
    return { Y: Y, idx: idx };
  }
  function busChecks(P, Y, idx) {
    var n = P.labels.length, V = [], k, i, j, seed = 12345;
    for (k = 0; k < n; k++) { seed = (seed * 1103515245 + 12345) % 2147483648; var m = 0.9 + 0.2 * seed / 2147483648; seed = (seed * 1103515245 + 12345) % 2147483648; V.push(scl(expj(-20 + 40 * seed / 2147483648), m)); }
    var Iy = cmv(Y, V), Ip = []; for (k = 0; k < n; k++) Ip.push(C(0, 0));
    P.br.forEach(function (e) {
      var i = idx[e.a], j = idx[e.b], y = inv(C(e.r, e.x)), a = e.tap, hb = C(0, e.bch / 2), Vi = scl(V[i], 1 / a);
      Ip[i] = add(Ip[i], scl(add(mul(sub(Vi, V[j]), y), mul(hb, V[i])), 1 / (e.kind === 'xfmr' ? a : 1)));
      Ip[j] = add(Ip[j], add(mul(sub(V[j], Vi), y), mul(hb, V[j])));
    });
    P.sh.forEach(function (s) { var i = idx[s.a]; Ip[i] = add(Ip[i], mul(C(s.g, s.b), V[i])); });
    var d = 0, sc = 0; for (k = 0; k < n; k++) { d = Math.max(d, abs(sub(Iy[k], Ip[k]))); sc = Math.max(sc, abs(Iy[k])); }
    var asym = 0; for (i = 0; i < n; i++) for (j = 0; j < i; j++) asym = Math.max(asym, abs(sub(Y[i][j], Y[j][i])));
    return [chk('Y·V against branch-by-branch currents for a test voltage set', d / (sc || 1), n), chk('Symmetry |Yᵢⱼ − Yⱼᵢ|', asym / (normInfM(Y) || 1), n)];
  }
  function doYbus(text, wantZ) {
    var P = parseBus(text); if (P.error) return { ok: false, error: P.error };
    var B = buildYbus(P), Y = B.Y, n = P.labels.length, tiny = 1e-14 * Math.max(normInfM(Y), 1), checks = busChecks(P, Y, B.idx), mats = [], steps, lines = [], i, j, copy = [], raw = { labels: P.labels, Y: Y.map(function (r) { return r.map(function (z) { return [z.r, z.i]; }); }) };
    lines.push(n + ' buses, ' + P.br.length + ' branches' + (P.sh.length ? ', ' + P.sh.length + ' shunts' : '') + '. Values are used exactly as entered (per-unit or ohms and siemens, as long as they are consistent).');
    mats.push(fmtCM(Y, 'Y-bus (S), rows and columns in bus order ' + P.labels.join(', '), tiny));
    mats.push(fmtRM(reOf(Y), 'G = Re(Y-bus)')); mats.push(fmtRM(imOf(Y), 'B = Im(Y-bus)')); copy = [['G', reOf(Y)], ['B', imOf(Y)]];
    steps = ['For a line between buses i and j with series admittance y = 1/(r + jx): add y to Y[i][i] and Y[j][j], and subtract y from Y[i][j] and Y[j][i]. Half of the total line-charging susceptance bch goes to each end as j·bch/2 on the diagonal.', 'For a transformer with off-nominal tap ratio a on bus i: Y[i][i] gets y/a², Y[j][j] gets y, and Y[i][j] = Y[j][i] = −y/a.', 'Add every shunt g + jb to the diagonal at its bus.', 'Check: a test voltage set is applied and the bus currents from Y·V are compared with the currents computed branch by branch from the line and transformer equations, which do not use the matrix.'];
    if (wantZ) {
      var keep = []; for (i = 0; i < n; i++) if (P.labels[i] !== P.ref) keep.push(i);
      var Yr = keep.map(function (a) { return keep.map(function (b) { return Y[a][b]; }); }), Zr = cInverse(Yr);
      if (!Zr) return { ok: false, error: 'The Y-bus is singular' + (P.ref ? ' even after removing reference bus ' + P.ref : ', because no bus has a path to ground') + '. A network with no shunt path to ground has no Z-bus. Add a shunt (line charging or a load) at some bus, or choose a reference bus with a line "ref 1" so the other buses are measured against it.' };
      var cond = norm1(Yr) * norm1(Zr), ID = cmm(Yr, Zr), e = 0; for (i = 0; i < ID.length; i++) for (j = 0; j < ID.length; j++) e = Math.max(e, abs(sub(ID[i][j], i === j ? C(1, 0) : C(0, 0))));
      checks.push(chk('‖Y·Z − I‖ (reduced Y-bus)', e, keep.length), chkCond(cond));
      var asym = 0; for (i = 0; i < Zr.length; i++) for (j = 0; j < i; j++) asym = Math.max(asym, abs(sub(Zr[i][j], Zr[j][i]))); checks.push(chk('Symmetry of Z-bus |Zᵢⱼ − Zⱼᵢ| / ‖Z‖', asym / (normInfM(Zr) || 1), keep.length));
      var lab = keep.map(function (k) { return P.labels[k]; }), tz = 1e-14 * Math.max(normInfM(Zr), 1);
      mats = [fmtCM(Zr, 'Z-bus (Ω), buses ' + lab.join(', '), tz), fmtCM(Yr, (P.ref ? 'Reduced ' : '') + 'Y-bus that was inverted (S)', tiny)]; copy = [['Zre', reOf(Zr)], ['Zim', imOf(Zr)]];
      lines.push('Z-bus = inverse of the ' + (P.ref ? 'Y-bus with the row and column of reference bus ' + P.ref + ' removed' : 'Y-bus') + '. The diagonal entry Zᵢᵢ is the Thevenin impedance seen at bus i.');
      steps = ['Build the Y-bus (line, transformer and shunt stamps as in the Y-bus tool).', P.ref ? 'Remove the row and column of reference bus ' + P.ref + ': voltages are then measured relative to that bus.' : 'The Y-bus is used whole, so every bus must have a path to ground through a shunt.', 'Invert with LU decomposition and scaled partial pivoting. Zᵢᵢ is the driving-point impedance at bus i, and Zᵢⱼ is the transfer impedance, because [V] = [Z][I].', 'Check: Y·Z must equal the identity, and Z must be symmetric (no phase shifters), and the condition number shows how sensitive Z is to the data.'];
      raw.Z = Zr.map(function (r) { return r.map(function (z) { return [z.r, z.i]; }); }); raw.Zlabels = lab; raw.cond = cond;
    }
    return { ok: true, title: wantZ ? 'Z-bus (impedance matrix)' : 'Y-bus (admittance matrix)', status: statusText(overall(checks)), lines: lines, mats: mats, checks: checks, steps: steps, capped: false, copy: copy, raw: raw };
  }

  /* ---------- incidence, loop and network matrices ---------- */
  function realRank(A) { var M = A.map(function (r) { return r.slice(); }), m = M.length, n = m ? M[0].length : 0, rk = 0, i, j, c; for (c = 0; c < n && rk < m; c++) { var p = rk; for (i = rk + 1; i < m; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i; if (Math.abs(M[p][c]) < 1e-9) continue; var t = M[p]; M[p] = M[rk]; M[rk] = t; for (i = rk + 1; i < m; i++) { var f = M[i][c] / M[rk][c]; for (j = c; j < n; j++) M[i][j] -= f * M[rk][j]; } rk++; } return rk; }
  function doIncidence(text) {
    var L = parseLines(text), br = [], set = {}, i, j, anyVal = false, allVal = true;
    for (i = 0; i < L.length; i++) {
      var t = L[i].toks, no = L[i].no; if (t.length < 3 || t.length > 4) return { ok: false, error: bad(no, 'write a branch as "name from to" or "name from to resistance".').error };
      var a = isGnd(t[1]) ? '0' : t[1], b = isGnd(t[2]) ? '0' : t[2]; if (a === b) return { ok: false, error: bad(no, t[0] + ' connects a node to itself.').error };
      var v = null; if (t.length === 4) { v = parseReal(t[3]); if (!isFinite(v) || v <= 0) return { ok: false, error: bad(no, 'the resistance must be a positive number.').error }; anyVal = true; } else allVal = false;
      set[a] = 1; set[b] = 1; br.push({ name: t[0], a: a, b: b, r: v });
    }
    if (!br.length) return { ok: false, error: 'Enter at least one branch, one per line: name from to [resistance].' };
    var labels = labelOrder(set), n = labels.length, nb = br.length;
    if (n > LIM.nodes || nb > LIM.elems) return { ok: false, error: 'Too many nodes or branches: the limits are ' + LIM.nodes + ' nodes and ' + LIM.elems + ' branches.' };
    var idx = {}; labels.forEach(function (l, k) { idx[l] = k; });
    var A = []; for (i = 0; i < n; i++) A.push(new Array(nb).fill(0));
    br.forEach(function (e, k) { A[idx[e.a]][k] += 1; A[idx[e.b]][k] -= 1; });
    var refLab = set['0'] ? '0' : labels[0], ri = idx[refLab], Ar = A.filter(function (_, k) { return k !== ri; });
    var par = labels.map(function (_, k) { return k; }); function find(x) { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; }
    br.forEach(function (e) { par[find(idx[e.a])] = find(idx[e.b]); });
    var roots = {}; labels.forEach(function (_, k) { roots[find(k)] = 1; }); var comps = Object.keys(roots).length;
    /* spanning forest by BFS */
    var adj = labels.map(function () { return []; }); br.forEach(function (e, k) { adj[idx[e.a]].push([idx[e.b], k]); adj[idx[e.b]].push([idx[e.a], k]); });
    var seen = new Array(n).fill(false), tree = new Array(nb).fill(false), tadj = labels.map(function () { return []; });
    for (var s0 = 0; s0 < n; s0++) { if (seen[s0]) continue; seen[s0] = true; var q = [s0]; while (q.length) { var u = q.shift(); adj[u].forEach(function (pr) { if (!seen[pr[0]]) { seen[pr[0]] = true; tree[pr[1]] = true; tadj[u].push([pr[0], pr[1]]); tadj[pr[0]].push([u, pr[1]]); q.push(pr[0]); } }); } }
    var links = []; br.forEach(function (_, k) { if (!tree[k]) links.push(k); });
    var Bm = [];
    links.forEach(function (lk) {
      var row = new Array(nb).fill(0), u = idx[br[lk].a], v = idx[br[lk].b]; row[lk] = 1;
      /* tree path from v to u */
      var prev = {}, q2 = [v]; prev[v] = null; while (q2.length) { var x = q2.shift(); if (x === u) break; tadj[x].forEach(function (pr) { if (!(pr[0] in prev)) { prev[pr[0]] = [x, pr[1]]; q2.push(pr[0]); } }); }
      var cur = u; while (cur !== v) { var pr2 = prev[cur], from = pr2[0], e2 = pr2[1]; /* path goes from pr2[0] (nearer v) to cur */ row[e2] += (idx[br[e2].a] === from && idx[br[e2].b] === cur) ? 1 : -1; cur = from; }
      Bm.push(row);
    });
    var prod = 0; if (Bm.length) for (i = 0; i < n; i++) for (j = 0; j < Bm.length; j++) { var s1 = 0; for (var k = 0; k < nb; k++) s1 += A[i][k] * Bm[j][k]; prod = Math.max(prod, Math.abs(s1)); }
    var rk = realRank(A), loops = nb - n + comps;
    var checks = [chk('Largest entry of A·Bᵀ (KCL and KVL are orthogonal, so it must be 0)', prod, nb), { label: 'rank(A) − (nodes − components)', value: Math.abs(rk - (n - comps)), text: String(rk - (n - comps)), state: rk === n - comps ? 'pass' : 'fail' }, { label: 'Links − (branches − nodes + components)', value: Math.abs(links.length - loops), text: String(links.length - loops), state: links.length === loops ? 'pass' : 'fail' }];
    var lines = [n + ' nodes, ' + nb + ' branches, ' + comps + ' connected part' + (comps === 1 ? '' : 's') + '. rank(A) = ' + rk + ' = nodes − components.', 'Independent loops = branches − nodes + components = ' + loops + (comps === 1 ? '. This is the number of mesh equations needed.' : '.'), 'Spanning tree branches: ' + br.filter(function (_, k) { return tree[k]; }).map(function (e) { return e.name; }).join(', ') + '. Links: ' + (links.length ? links.map(function (k) { return br[k].name; }).join(', ') : 'none') + '.', 'Reference node for the reduced matrix: ' + refLab + '.'];
    var rowL = labels.map(function (l) { return 'node ' + l; }), mats = [fmtRM(A, 'Incidence matrix A (rows ' + labels.join(', ') + '; columns ' + br.map(function (e) { return e.name; }).join(', ') + '; +1 where the branch leaves the node, −1 where it enters)'), fmtRM(Ar, 'Reduced incidence matrix (reference node ' + refLab + ' removed)')];
    if (Bm.length) mats.push(fmtRM(Bm, 'Fundamental loop matrix B (one row per link: ' + links.map(function (k) { return br[k].name; }).join(', ') + '; +1 along the branch direction, −1 against)'));
    var raw = { labels: labels, A: A, B: Bm, rank: rk, comps: comps, loops: loops, ref: refLab };
    if (anyVal && allVal) {
      var g = br.map(function (e) { return 1 / e.r; }), Yn = Ar.map(function (r1) { return Ar.map(function (r2) { var s2 = 0; for (var k = 0; k < nb; k++) s2 += r1[k] * g[k] * r2[k]; return s2; }); });
      mats.push(fmtRM(Yn, 'Nodal conductance matrix A·G·Aᵀ (S), reference node ' + refLab + ' removed')); raw.Y = Yn;
      if (Bm.length) { var Zl = Bm.map(function (r1) { return Bm.map(function (r2) { var s3 = 0; for (var k = 0; k < nb; k++) s3 += r1[k] * br[k].r * r2[k]; return s3; }); }); mats.push(fmtRM(Zl, 'Loop resistance matrix B·R·Bᵀ (Ω), one loop per link')); raw.Zl = Zl; }
    } else if (anyVal) lines.push('Resistances were given for some branches only, so the nodal and loop matrices are not built. Give a value for every branch to get them.');
    var steps = ['Each branch has a direction from its first node to its second. Column k of A has +1 in the row of the node the branch leaves and −1 in the row of the node it enters.', 'KCL for the whole network is A·i = 0. Removing the reference row keeps the equations independent: the reduced matrix has full row rank when the network is connected.', 'A spanning tree is found by breadth-first search. Each branch left out (a link) closes exactly one loop with the tree. Row ℓ of B holds +1 for the link and ±1 for the tree branches on that loop, so KVL is B·v = 0.', 'Check: every KCL row is orthogonal to every KVL row, A·Bᵀ = 0, and the counts match the graph theorem rank(A) = n − c and loops = b − n + c.'];
    if (anyVal && allVal) steps.push('With branch conductances G = diag(1/R) the nodal matrix is A·G·Aᵀ, and with resistances R the loop matrix is B·R·Bᵀ. These are the matrices that nodal and mesh analysis solve.');
    return { ok: true, title: 'Incidence and loop matrices', status: statusText(overall(checks)), lines: lines, mats: mats, checks: checks, steps: steps, capped: false, copy: [['A', A]].concat(Bm.length ? [['B', Bm]] : []), raw: raw };
  }

  /* ---------- state-space ---------- */
  function polyEval(c, z) { var s = C(0, 0); c.forEach(function (a) { s = add(mul(s, z), C(a, 0)); }); return s; }
  function polyStr(c, v) {
    var d = c.length - 1, parts = [], mx = 0; c.forEach(function (a) { mx = Math.max(mx, Math.abs(a)); });
    c.forEach(function (a, k) { var pw = d - k; if (Math.abs(a) <= 1e-10 * mx) return; var mag = Math.abs(a), ms = num(mag, 0), body = (pw === 0 || ms !== '1') ? ms : ''; if (pw >= 1) body += (pw === 1 ? v : v + '^' + pw); parts.push((parts.length ? (a < 0 ? ' − ' : ' + ') : (a < 0 ? '−' : '')) + body); });
    return parts.length ? parts.join('') : '0';
  }
  function trimPoly(c) { var mx = 0; c.forEach(function (a) { mx = Math.max(mx, Math.abs(a)); }); var o = c.map(function (a) { return Math.abs(a) <= 1e-10 * mx ? 0 : a; }); while (o.length > 1 && o[0] === 0) o.shift(); return o; }
  function polyRoots(c) { c = trimPoly(c); var d = c.length - 1; if (d < 1) return []; if (d === 1) return [C(-c[1] / c[0], 0)]; var Cm = []; for (var i = 0; i < d; i++) { Cm.push(new Array(d).fill(0)); } for (var j = 0; j < d; j++) Cm[0][j] = -c[j + 1] / c[0]; for (var k = 1; k < d; k++) Cm[k][k - 1] = 1; var g = D.eigGeneral(Cm); return g.error ? [] : g.values.map(function (z) { return Math.abs(z.i) <= 1e-9 * Math.max(abs(z), 1) ? C(z.r, 0) : z; }); }
  function parseMat(body, name) {
    var rows = body.split(';').map(function (r) { return r.trim(); }).filter(function (r) { return r.length; }), M = [];
    for (var i = 0; i < rows.length; i++) { var cells = rows[i].split(/[\s,]+/).filter(function (x) { return x.length; }).map(parseReal); if (cells.some(function (x) { return !isFinite(x); })) return { error: 'Matrix ' + name + ', row ' + (i + 1) + ': cannot read a number.' }; if (M.length && cells.length !== M[0].length) return { error: 'Matrix ' + name + ': row ' + (i + 1) + ' has ' + cells.length + ' entries but row 1 has ' + M[0].length + '.' }; M.push(cells); }
    if (!M.length) return { error: 'Matrix ' + name + ' is empty.' }; return { M: M };
  }
  function rmul(A, B) { var m = A.length, k = B.length, n = B[0].length, R = []; for (var i = 0; i < m; i++) { R.push(new Array(n).fill(0)); for (var p = 0; p < k; p++) for (var j = 0; j < n; j++) R[i][j] += A[i][p] * B[p][j]; } return R; }
  function doSS(text) {
    var L = parseLines(text), M = {}, disc = false, i;
    for (i = 0; i < L.length; i++) {
      var t = L[i].text, mm = /^([ABCDabcd])\s*=\s*(.*)$/.exec(t), tt = /^type\s+(continuous|discrete)$/i.exec(t);
      if (tt) { disc = /discrete/i.test(tt[1]); continue; }
      if (!mm) return { ok: false, error: 'Line ' + L[i].no + ': write a matrix as "A = 0 1 ; -2 -3" (rows separated by ;) or "type discrete".' };
      var r = parseMat(mm[2], mm[1].toUpperCase()); if (r.error) return { ok: false, error: r.error }; M[mm[1].toUpperCase()] = r.M;
    }
    var A = M.A; if (!A) return { ok: false, error: 'Matrix A is required, for example "A = 0 1 ; -2 -3".' };
    var n = A.length; if (A[0].length !== n) return { ok: false, error: 'A must be square: it is ' + n + ' × ' + A[0].length + '.' };
    if (n > LIM.states) return { ok: false, error: 'The limit is ' + LIM.states + ' states.' };
    var B = M.B || null, Cm = M.C || null, Dm = M.D || null;
    if (B && B.length !== n) return { ok: false, error: 'B must have ' + n + ' rows, one per state. It has ' + B.length + '.' };
    if (Cm && Cm[0].length !== n) return { ok: false, error: 'C must have ' + n + ' columns, one per state. It has ' + Cm[0].length + '.' };
    if (Dm && !(B && Cm)) return { ok: false, error: 'D needs both B and C.' };
    if (Dm && (Dm.length !== Cm.length || Dm[0].length !== B[0].length)) return { ok: false, error: 'D must be ' + Cm.length + ' × ' + B[0].length + ' (outputs × inputs). It is ' + Dm.length + ' × ' + Dm[0].length + '.' };
    if (B && Cm && !Dm) { Dm = []; for (i = 0; i < Cm.length; i++) Dm.push(new Array(B[0].length).fill(0)); }
    var fa = 0; A.forEach(function (r) { r.forEach(function (x) { fa += x * x; }); }); fa = Math.sqrt(fa); var scale = Math.max(fa, 1e-300);
    var g = D.eigGeneral(A); if (g.error) return { ok: false, error: g.error };
    var vals = g.values.map(function (z) { return Math.abs(z.i) <= 1e-10 * Math.max(scale, 1) ? C(z.r, 0) : z; });
    vals.sort(function (a, b) { return b.r - a.r || b.i - a.i; });
    var tol = 1e-9 * Math.max(scale, 1), maxRe = -Infinity, maxMod = 0; vals.forEach(function (z) { maxRe = Math.max(maxRe, z.r); maxMod = Math.max(maxMod, abs(z)); });
    var stab, sv = disc ? maxMod - 1 : maxRe; stab = sv < -tol ? 'Asymptotically stable' : sv > tol ? 'Unstable' : 'Marginally stable or unstable (an eigenvalue lies on the stability boundary; repeated boundary eigenvalues make the system unstable)';
    var poleRows = vals.map(function (z, k) {
      var w = abs(z), info;
      if (disc) info = z.i === 0 ? (w > 1e-12 ? 'decay factor per step ' + num(w, 0) : 'deadbeat') : '|λ| = ' + num(w, 0) + ', angle ' + num(Math.atan2(z.i, z.r) * 180 / Math.PI, 1e-9) + '°/step';
      else if (z.i === 0) info = Math.abs(z.r) > tol ? 'time constant τ = ' + num(Math.abs(1 / z.r), 0) + ' s' + (z.r > 0 ? ' (growing)' : '') : 'on the imaginary-axis origin';
      else info = 'ωₙ = ' + num(w, 0) + ' rad/s, ζ = ' + num(-z.r / w, 1e-12);
      return ['λ' + (k + 1), cnum(z, 1e-13 * Math.max(scale, 1)), info];
    });
    var checks = [], lines = [], mats = [fmtRM(A, 'A')], steps = [], raw = { eig: vals.map(function (z) { return [z.r, z.i]; }), stable: stab }, copy = [];
    var tsum = C(0, 0), tprod = C(1, 0); vals.forEach(function (z) { tsum = add(tsum, z); tprod = mul(tprod, z); }); var trA = 0; for (i = 0; i < n; i++) trA += A[i][i];
    var dA = D.lu(A).det, scaleP = Math.pow(Math.max(scale / Math.sqrt(n), 1e-300), n);
    checks.push(chk('|Σλ − trace(A)| / ‖A‖', abs(sub(tsum, C(trA, 0))) / scale, n), chk('|Πλ − det(A)| / (‖A‖/√n)ⁿ', abs(sub(tprod, C(dA, 0))) / scaleP, n));
    lines.push((disc ? 'Discrete-time system x[k+1] = Ax[k] + Bu[k]. ' : 'Continuous-time system dx/dt = Ax + Bu. ') + n + ' state' + (n === 1 ? '' : 's') + '.', 'Stability: ' + stab + '. ' + (disc ? 'Largest |λ| = ' + num(maxMod, 0) + ' (must be below 1).' : 'Largest real part = ' + num(maxRe, 1e-13 * Math.max(scale, 1)) + ' (must be below 0).'));
    /* characteristic polynomial by Faddeev-LeVerrier */
    var cp = [1], Mk = []; for (i = 0; i < n; i++) { Mk.push(new Array(n).fill(0)); Mk[i][i] = 1; }
    var Ms = [Mk.map(function (r) { return r.slice(); })];
    for (var k = 1; k <= n; k++) { var AM = rmul(A, Ms[k - 1]), tr = 0; for (i = 0; i < n; i++) tr += AM[i][i]; var ck = -tr / k; cp.push(ck); if (k < n) { for (i = 0; i < n; i++) AM[i][i] += ck; Ms.push(AM); } }
    var pres = 0, pmag = 0; var pfl = (n + 1) * EPS * Math.max(scale, 1); vals.forEach(function (z) { var s = C(0, 0), sm = 0, pw = C(1, 0), am = Math.max(scale, abs(z)) + pfl * 0; for (var q = cp.length - 1; q >= 0; q--) { s = add(s, scl(pw, cp[q])); sm += Math.abs(cp[q]) * Math.pow(am, cp.length - 1 - q); pw = mul(pw, z); } pres = Math.max(pres, abs(s) / (sm || 1)); });
    checks.push(chk('Characteristic polynomial at each eigenvalue, |p(λ)| / Σ|cₖ|‖A‖ⁿ⁻ᵏ', pres, n));
    lines.push('Characteristic polynomial: ' + (disc ? polyStr(cp, 'z') : polyStr(cp, 's')) + ' = 0.');
    var tables = [{ title: 'Poles (eigenvalues of A)', head: ['', 'Value', 'Meaning'], rows: poleRows }];
    /* controllability and observability */
    function rankOf(Mx) { var r = D.svd(Mx); return { rank: r.S.filter(function (x) { return x > r.tol; }).length, S: r.S }; }
    if (B) {
      var K = B.map(function (r) { return r.slice(); }), Pw = B; for (i = 1; i < n; i++) { Pw = rmul(A, Pw); for (var rr = 0; rr < n; rr++) K[rr] = K[rr].concat(Pw[rr]); }
      var rc = rankOf(K); lines.push('Controllability: rank [B AB … Aⁿ⁻¹B] = ' + rc.rank + ' of ' + n + (rc.rank === n ? ' (controllable).' : ' (not controllable: some states cannot be steered by the input).')); raw.ctrb = rc.rank; mats.push(fmtRM(B, 'B'));
    }
    if (Cm) {
      var O = Cm.map(function (r) { return r.slice(); }), Pc = Cm; for (i = 1; i < n; i++) { Pc = rmul(Pc, A); O = O.concat(Pc); }
      var ro = rankOf(O); lines.push('Observability: rank [C; CA; …; CAⁿ⁻¹] = ' + ro.rank + ' of ' + n + (ro.rank === n ? ' (observable).' : ' (not observable: some states do not show up in the output).')); raw.obsv = ro.rank; mats.push(fmtRM(Cm, 'C'));
    }
    if (Dm && B && Cm) mats.push(fmtRM(Dm, 'D'));
    if (n >= 6 && (B || Cm)) lines.push('Note: the controllability and observability matrices become badly scaled for six or more states, so a rank result close to the boundary should be confirmed with a different method.');
    /* transfer function for single-input single-output */
    if (B && Cm && B[0].length === 1 && Cm.length === 1) {
      var num_ = new Array(n + 1).fill(0), d0 = Dm[0][0];
      for (k = 0; k < n; k++) { var Bk = rmul(Ms[k], B), val = 0; for (i = 0; i < n; i++) val += Cm[0][i] * Bk[i][0]; num_[k + 1] += val; }
      for (k = 0; k <= n; k++) num_[k] += d0 * cp[k];
      var N = trimPoly(num_), vname = disc ? 'z' : 's', zs = polyRoots(N), zres = 0;
      var zmax = 1; zs.forEach(function (z) { zmax = Math.max(zmax, abs(z)); }); zs.forEach(function (z) { var s = C(0, 0), sm = 0, pw = C(1, 0), am = zmax; for (var q = N.length - 1; q >= 0; q--) { s = add(s, scl(pw, N[q])); sm += Math.abs(N[q]) * Math.pow(am, N.length - 1 - q); pw = mul(pw, z); } zres = Math.max(zres, abs(s) / (sm || 1)); });
      if (zs.length) checks.push(chk('Numerator at each zero, |N(z)| / Σ|cₖ|zₘₐₓᵏ', zres, N.length));
      lines.push('Transfer function G(' + vname + ') = (' + polyStr(N, vname) + ') / (' + polyStr(cp, vname) + ').');
      lines.push('Zeros: ' + (zs.length ? zs.map(function (z) { return cnum(z, 1e-12 * Math.max(scale, 1)); }).join(', ') : 'none') + '.');
      var G0den = cp[n], G0num = num_[n]; var dc;
      if (disc) { var p1 = polyEval(cp, C(1, 0)), n1 = polyEval(num_, C(1, 0)); dc = abs(p1) <= 1e-12 * Math.max(1, Math.abs(cp[0])) ? null : div(n1, p1).r; }
      else dc = Math.abs(G0den) <= 1e-12 * Math.max(Math.pow(scale, n), 1e-300) ? null : G0num / G0den;
      lines.push('DC gain: ' + (dc === null ? 'infinite (a pole at ' + (disc ? 'z = 1' : 's = 0') + ').' : num(dc, 1e-13) + '.')); raw.num = N; raw.den = cp; raw.dc = dc; raw.zeros = zs.map(function (z) { return [z.r, z.i]; });
    } else if (B && Cm) lines.push('The transfer function is shown for single-input single-output systems only (this one has ' + B[0].length + ' input' + (B[0].length === 1 ? '' : 's') + ' and ' + Cm.length + ' output' + (Cm.length === 1 ? '' : 's') + ').');
    steps = ['The poles of the system are the eigenvalues of A, found with the Hessenberg and shifted QR method used in Mode 04.', disc ? 'A discrete-time system is stable when every eigenvalue lies inside the unit circle, |λ| < 1.' : 'A continuous-time system is asymptotically stable when every eigenvalue has a negative real part. For a complex pair λ = σ ± jω the natural frequency is ωₙ = |λ| and the damping ratio is ζ = −σ/|λ|.', 'The characteristic polynomial det(sI − A) comes from the Faddeev–LeVerrier recursion: Mₖ = AMₖ₋₁ + cₖI with cₖ = −trace(AMₖ₋₁)/k. The same matrices give adj(sI − A) = Σ Mₖ sⁿ⁻¹⁻ᵏ, so G(s) = C·adj(sI − A)·B / det(sI − A) + D.', 'Controllability and observability are tested by the rank of the Krylov matrices, computed from their singular values.', 'Checks: the sum and product of the eigenvalues must equal trace(A) and det(A), and the characteristic polynomial must vanish at every eigenvalue.'];
    return { ok: true, title: 'State-space analysis', status: statusText(overall(checks)), lines: lines, mats: mats, tables: tables, checks: checks, steps: steps, capped: false, copy: copy, raw: raw };
  }

  /* ---------- symmetrical components ---------- */
  function doSymm(text) {
    var L = parseLines(text), S = {}, i, no;
    for (i = 0; i < L.length; i++) {
      var t = L[i].toks; no = L[i].no; if (t.length !== 2) return { ok: false, error: bad(no, 'write one phasor per line, for example "va 100<0" or "ib 5<-150".').error };
      var key = t[0].toLowerCase(); if (!/^[vi]([abc012])$/.test(key)) return { ok: false, error: bad(no, 'the name "' + t[0] + '" must be va, vb, vc, v0, v1, v2 (voltages) or ia, ib, ic, i0, i1, i2 (currents).').error };
      var z = parseComplex(t[1]); if (!z) return { ok: false, error: bad(no, 'cannot read "' + t[1] + '". Use 100<-120 (magnitude and angle in degrees) or 86.6-50j.').error };
      if (S[key]) return { ok: false, error: bad(no, key + ' appears twice.').error }; S[key] = z;
    }
    var a = expj(120), a2 = expj(240), T = [[C(1, 0), C(1, 0), C(1, 0)], [C(1, 0), a, a2], [C(1, 0), a2, a]].map(function (r) { return r.map(function (z) { return scl(z, 1 / 3); }); }), Ti = [[C(1, 0), C(1, 0), C(1, 0)], [C(1, 0), a2, a], [C(1, 0), a, a2]];
    var sets = {}, any = false, tables = [], checks = [], lines = [], steps, raw = {}, mats = [];
    ['v', 'i'].forEach(function (q) {
      var ph = ['a', 'b', 'c'].map(function (k) { return S[q + k]; }), sq = ['0', '1', '2'].map(function (k) { return S[q + k]; }), nph = ph.filter(Boolean).length, nsq = sq.filter(Boolean).length;
      if (nph === 0 && nsq === 0) return; any = true;
      if (nph && nsq) { sets.err = 'Give the ' + (q === 'v' ? 'voltages' : 'currents') + ' either as phases (a, b, c) or as sequence components (0, 1, 2), not both.'; return; }
      if ((nph || nsq) !== 3) { sets.err = 'Give all three ' + (q === 'v' ? 'voltages' : 'currents') + ': ' + (nph ? q + 'a, ' + q + 'b, ' + q + 'c' : q + '0, ' + q + '1, ' + q + '2') + '.'; return; }
      var fromPhase = nph === 3, phv = fromPhase ? ph : cmv(Ti, sq), sqv = fromPhase ? cmv(T, ph) : sq, back = fromPhase ? cmv(Ti, sqv) : cmv(T, phv), rt = 0, mx = 0;
      for (var k = 0; k < 3; k++) { rt = Math.max(rt, abs(sub(back[k], fromPhase ? ph[k] : sq[k]))); mx = Math.max(mx, abs(fromPhase ? ph[k] : sq[k])); }
      sets[q] = { ph: phv, sq: sqv };
      var nm = q === 'v' ? 'Voltage' : 'Current', unit = q === 'v' ? 'V' : 'A', tiny = 1e-12 * Math.max(mx, 1e-300);
      tables.push({ title: nm + ' phasors (' + unit + ')', head: ['Quantity', 'Polar', 'Rectangular'], rows: [['Phase a', pol(phv[0], tiny), cnum(phv[0], tiny)], ['Phase b', pol(phv[1], tiny), cnum(phv[1], tiny)], ['Phase c', pol(phv[2], tiny), cnum(phv[2], tiny)], ['Zero sequence ' + q.toUpperCase() + '₀', pol(sqv[0], tiny), cnum(sqv[0], tiny)], ['Positive sequence ' + q.toUpperCase() + '₁', pol(sqv[1], tiny), cnum(sqv[1], tiny)], ['Negative sequence ' + q.toUpperCase() + '₂', pol(sqv[2], tiny), cnum(sqv[2], tiny)]] });
      var m1 = abs(sqv[1]); lines.push(nm + ' unbalance: ' + (m1 > tiny ? '|' + q.toUpperCase() + '₂|/|' + q.toUpperCase() + '₁| = ' + num(100 * abs(sqv[2]) / m1, 1e-9) + '%,  |' + q.toUpperCase() + '₀|/|' + q.toUpperCase() + '₁| = ' + num(100 * abs(sqv[0]) / m1, 1e-9) + '%.' : 'there is no positive-sequence component, so the ratios are undefined.'));
      var s3 = add(add(phv[0], phv[1]), phv[2]); checks.push(chk(nm + ' round trip (transform and back) / largest phasor', rt / (mx || 1), 3), chk(nm + ': |Va + Vb + Vc − 3·V₀| / largest phasor'.replace(/V/g, q.toUpperCase()), abs(sub(s3, scl(sqv[0], 3))) / (mx || 1), 3));
      raw[q] = { ph: phv.map(function (z) { return [z.r, z.i]; }), sq: sqv.map(function (z) { return [z.r, z.i]; }) };
    });
    if (!any) return { ok: false, error: 'Enter three phase phasors (va, vb, vc and/or ia, ib, ic) or three sequence components (v0, v1, v2 and/or i0, i1, i2).' };
    if (sets.err) return { ok: false, error: sets.err };
    if (sets.v && sets.i) {
      var Sp = C(0, 0), Ss = C(0, 0), k; for (k = 0; k < 3; k++) { Sp = add(Sp, mul(sets.v.ph[k], conj(sets.i.ph[k]))); Ss = add(Ss, scl(mul(sets.v.sq[k], conj(sets.i.sq[k])), 3)); }
      checks.push(chk('Power invariance |ΣVₚIₚ* − 3·ΣVₖIₖ*| / |S|', abs(sub(Sp, Ss)) / (abs(Sp) || 1), 3));
      var tp = 1e-12 * abs(Sp); lines.push('Total complex power S = ΣV·I* = ' + cnum(Sp, tp) + ' VA, the same in phase and in sequence quantities (with the factor 3 in the sequence form).'); raw.S = [Sp.r, Sp.i];
    }
    mats.push(fmtCM(T, 'Transformation [V₀ V₁ V₂]ᵀ = T [Vₐ V_b V_c]ᵀ, with a = 1∠120°', 1e-15), fmtCM(Ti, 'Inverse transformation [Vₐ V_b V_c]ᵀ = T⁻¹ [V₀ V₁ V₂]ᵀ', 1e-15));
    steps = ['Fortescue: any three-phase set can be split into a zero-sequence part (three equal phasors), a positive-sequence part (balanced, phase order a-b-c) and a negative-sequence part (balanced, phase order a-c-b).', 'With a = 1∠120°: X₀ = (Xa + Xb + Xc)/3, X₁ = (Xa + a·Xb + a²·Xc)/3, X₂ = (Xa + a²·Xb + a·Xc)/3. The reverse is Xa = X₀ + X₁ + X₂, Xb = X₀ + a²X₁ + aX₂, Xc = X₀ + aX₁ + a²X₂.', 'A balanced set has only X₁. Zero sequence appears with earth faults and unbalanced loads on a grounded system; negative sequence with unbalanced loading.', 'Checks: transform the result back and compare with the input, confirm Xa + Xb + Xc = 3X₀, and when both voltages and currents are given confirm that total power is the same in phase and sequence quantities.'];
    return { ok: true, title: 'Symmetrical components (Fortescue transformation)', status: statusText(overall(checks)), lines: lines, mats: mats, tables: tables, checks: checks, steps: steps, capped: false, copy: [], raw: raw };
  }

  /* ---------- DC power flow ---------- */
  function doDCPF(text) {
    var L = parseLines(text), lines_ = [], inj = {}, set = {}, slack = null, base = null, i;
    for (i = 0; i < L.length; i++) {
      var t = L[i].toks, no = L[i].no, k = t[0].toLowerCase();
      if (k === 'slack') { if (t.length !== 2) return { ok: false, error: bad(no, 'write "slack 1".').error }; slack = t[1]; continue; }
      if (k === 'base') { if (t.length !== 2) return { ok: false, error: bad(no, 'write "base 100" (MVA).').error }; base = parseReal(t[1]); if (!(base > 0)) return { ok: false, error: bad(no, 'the base must be a positive number of MVA.').error }; continue; }
      if (k === 'p') { if (t.length !== 3) return { ok: false, error: bad(no, 'write "p bus value" (positive for generation, negative for load).').error }; var pv = parseReal(t[2]); if (!isFinite(pv)) return { ok: false, error: bad(no, 'cannot read the injection.').error }; if (t[1] in inj) return { ok: false, error: bad(no, 'bus ' + t[1] + ' has two injections.').error }; inj[t[1]] = pv; set[t[1]] = 1; continue; }
      if (k === 'line') { if (t.length < 4 || t.length > 5) return { ok: false, error: bad(no, 'write "line from to x" or "line from to x limit".').error }; var x = parseReal(t[3]), lim = t.length === 5 ? parseReal(t[4]) : null; if (!(x > 0)) return { ok: false, error: bad(no, 'the reactance x must be positive.').error }; if (t.length === 5 && !(lim > 0)) return { ok: false, error: bad(no, 'the limit must be positive.').error }; if (t[1] === t[2]) return { ok: false, error: bad(no, 'a line cannot connect a bus to itself.').error }; set[t[1]] = 1; set[t[2]] = 1; lines_.push({ a: t[1], b: t[2], x: x, lim: lim }); continue; }
      return { ok: false, error: bad(no, 'unknown keyword "' + t[0] + '". Use line, p, slack or base.').error };
    }
    if (!lines_.length) return { ok: false, error: 'Enter at least one line: "line from to x".' };
    var labels = labelOrder(set), n = labels.length; if (n > LIM.buses) return { ok: false, error: 'Too many buses: the limit is ' + LIM.buses + '.' };
    var idx = {}; labels.forEach(function (l, k) { idx[l] = k; });
    var slackNote = ''; if (slack === null) { slack = labels[0]; slackNote = 'No slack bus was given, so bus ' + slack + ' is used. '; } else if (labels.indexOf(slack) < 0) return { ok: false, error: 'The slack bus ' + slack + ' is not in the network.' };
    var par = labels.map(function (_, k) { return k; }); function find(x) { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; }
    lines_.forEach(function (e) { par[find(idx[e.a])] = find(idx[e.b]); });
    for (i = 1; i < n; i++) if (find(i) !== find(0)) return { ok: false, error: 'The network is not connected: bus ' + labels[i] + ' has no path to bus ' + labels[0] + '. DC power flow needs one connected network.' };
    var Bp = []; for (i = 0; i < n; i++) Bp.push(new Array(n).fill(0));
    lines_.forEach(function (e) { var a = idx[e.a], b = idx[e.b], y = 1 / e.x; Bp[a][a] += y; Bp[b][b] += y; Bp[a][b] -= y; Bp[b][a] -= y; });
    var P = labels.map(function (l) { return inj[l] || 0; }), si = idx[slack], others = 0; for (i = 0; i < n; i++) if (i !== si) others += P[i]; P[si] = -others;
    var keep = []; for (i = 0; i < n; i++) if (i !== si) keep.push(i);
    var Br = keep.map(function (a) { return keep.map(function (b) { return C(Bp[a][b], 0); }); }), Fr = cLU(Br); if (Fr.singular) return { ok: false, error: 'The reduced susceptance matrix is singular. Check the line data.' };
    var th = cSolveLU(Fr, keep.map(function (k) { return C(P[k], 0); })), theta = new Array(n).fill(0); keep.forEach(function (k, j) { theta[k] = th[j].r; });
    var Bi = cInverse(Br), cond = norm1(Br) * norm1(Bi);
    var flows = lines_.map(function (e) { return (theta[idx[e.a]] - theta[idx[e.b]]) / e.x; });
    var res = 0, bal = 0, sc = 0; for (i = 0; i < n; i++) { var s = 0, f = 0; for (var j = 0; j < n; j++) s += Bp[i][j] * theta[j]; res = Math.max(res, Math.abs(s - P[i])); sc = Math.max(sc, Math.abs(P[i])); }
    var leave = new Array(n).fill(0); lines_.forEach(function (e, k) { leave[idx[e.a]] += flows[k]; leave[idx[e.b]] -= flows[k]; }); var mxf = 0; flows.forEach(function (f) { mxf = Math.max(mxf, Math.abs(f)); }); for (i = 0; i < n; i++) bal = Math.max(bal, Math.abs(leave[i] - P[i]));
    var checks = [chk('‖B′θ − P‖ over all buses including the slack row / largest injection', res / (sc || 1), n), chk('Largest bus imbalance, Σ line flows − P / largest flow', bal / (mxf || 1), n), chkCond(cond)];
    var unit = base ? ' MW' : ' pu', mult = base || 1, over = [];
    var tables = [{ title: 'Bus voltage angles and injections', head: ['Bus', 'Angle θ (rad)', 'Angle θ (degrees)', 'Injection P' + (base ? ' (MW)' : ' (pu)')], rows: labels.map(function (l, k) { return [l + (k === si ? ' (slack)' : ''), num(theta[k], 1e-13), num(theta[k] * 180 / Math.PI, 1e-11), num(P[k] * mult, 1e-12)]; }) }, { title: 'Line flows (positive from the first bus to the second)', head: ['Line', 'x', 'Flow' + (base ? ' (MW)' : ' (pu)'), 'Loading'], rows: lines_.map(function (e, k) { var ld = e.lim ? 100 * Math.abs(flows[k]) / e.lim : null; if (ld !== null && ld > 100 + 1e-9) over.push(e.a + '–' + e.b); return [e.a + ' → ' + e.b, num(e.x, 0), num(flows[k] * mult, 1e-12), ld === null ? '—' : num(ld, 1e-9) + '% of ' + num(e.lim * 1, 0) + unit + (ld > 100 + 1e-9 ? '  OVERLOAD' : '')]; }) }];
    var lines = [slackNote + n + ' buses, ' + lines_.length + ' lines. Angle of the slack bus is 0. The slack bus supplies ' + num(P[si] * mult, 1e-12) + unit + ' to balance the other injections.', 'This is the lossless linear (DC) approximation: flow = (θᵢ − θⱼ)/x, voltage magnitudes are 1 pu and angle differences are small. It gives MW flows but no losses or reactive power.'];
    if (over.length) lines.push('Overloaded line' + (over.length === 1 ? '' : 's') + ': ' + over.join(', ') + '.');
    var steps = ['Each line contributes susceptance b = 1/x. The B′ matrix has B′ᵢᵢ = Σ b over lines at bus i and B′ᵢⱼ = −Σ b between buses i and j. Rows sum to zero, so B′ is singular until a slack bus is fixed.', 'The slack bus is given angle 0 and absorbs the mismatch, P_slack = −ΣP of the other buses. Remove the slack row and column and solve B′θ = P by LU decomposition with scaled partial pivoting.', 'Line flow = (θᵢ − θⱼ)/x. Loading is the flow as a percentage of the line limit when one is given.', 'Check: B′θ is recomputed for all buses, including the slack row that was not solved, and compared with P; the line flows at each bus are summed and compared with the injection.'];
    var mats = [fmtRM(Bp, 'B′ matrix (pu), rows and columns in bus order ' + labels.join(', '))];
    var raw = { labels: labels, theta: theta, flows: flows, P: P, Bp: Bp, slack: slack };
    return { ok: true, title: 'DC power flow', status: statusText(overall(checks)), lines: lines, mats: mats, tables: tables, checks: checks, steps: steps, capped: false, copy: [['Bprime', Bp]], raw: raw };
  }

  /* ---------- entry point ---------- */
  var OPS = { nodal: 'Nodal analysis', mesh: 'Mesh analysis', ybus: 'Y-bus', zbus: 'Z-bus', incidence: 'Incidence and loop matrices', ss: 'State-space', symm: 'Symmetrical components', dcpf: 'DC power flow' };
  function calc(o) {
    if (!OPS[o.op]) return { ok: false, error: 'Unknown operation.' };
    var text = String(o.text || ''); if (!text.trim()) return { ok: false, error: 'Enter the network data in the box. Use an example button to see the format.' };
    if (text.length > 20000) return { ok: false, error: 'The input is too long.' };
    try {
      switch (o.op) {
        case 'nodal': return doNodal(text);
        case 'mesh': return doMesh(text);
        case 'ybus': return doYbus(text, false);
        case 'zbus': return doYbus(text, true);
        case 'incidence': return doIncidence(text);
        case 'ss': return doSS(text);
        case 'symm': return doSymm(text);
        default: return doDCPF(text);
      }
    } catch (e) { return { ok: false, error: 'Could not analyse this input (' + (e && e.message ? e.message : e) + '). Check the format.' }; }
  }
  var api = { calc: calc, OPS: OPS, parseComplex: parseComplex, parseReal: parseReal };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MatrixNetwork = api;
})(typeof self !== 'undefined' ? self : this);
