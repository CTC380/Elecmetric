/* Elecmetric Matrix Calculator: engine for Modes 01 to 03 (basic operations, properties, linear equation solver). One file, no dependencies, no DOM.
   Exact arithmetic: every entry is a BigInt fraction, so 0.1 + 0.2 is exactly 3/10. Required by tests/matrix_test.js and inlined by tools/matrix_page.js. */
(function (root) {
  'use strict';
  var MAXN = 8, MAXPOW = 20, MAXLEN = 400;
  function gcd(a, b) { if (a < 0n) a = -a; if (b < 0n) b = -b; while (b) { var t = a % b; a = b; b = t; } return a; }
  function Q(n, d) { if (d === undefined) d = 1n; if (d < 0n) { n = -n; d = -d; } var g = gcd(n, d) || 1n; return { n: n / g, d: d / g }; }
  function add(a, b) { return Q(a.n * b.d + b.n * a.d, a.d * b.d); }
  function sub(a, b) { return Q(a.n * b.d - b.n * a.d, a.d * b.d); }
  function mul(a, b) { return Q(a.n * b.n, a.d * b.d); }
  function isZero(a) { return a.n === 0n; }
  function parse(s) {
    s = String(s == null ? '' : s).trim().replace(/\u2212/g, '-');
    if (!s) return { error: 'empty' };
    if (s.length > 30) return { error: 'too long' };
    var m = /^([+-]?)(\d+)\/(\d+)$/.exec(s);
    if (m) { if (/^0+$/.test(m[3])) return { error: 'division by zero' }; return { v: Q(BigInt(m[1] + m[2]), BigInt(m[3])) }; }
    m = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(s);
    if (m && (m[2] || m[3])) { var f = m[3] || ''; return { v: Q(BigInt(m[1] + (m[2] || '0') + f), 10n ** BigInt(f.length)) }; }
    return { error: 'not a number' };
  }
  function text(q) { return q.d === 1n ? q.n.toString() : q.n + '/' + q.d; }
  function dec(q) {
    var neg = q.n < 0n, a = neg ? -q.n : q.n, sc = (a * 10n ** 6n * 2n / q.d + 1n) / 2n, s = sc.toString();
    while (s.length < 7) s = '0' + s;
    var out = s.slice(0, -6) + '.' + s.slice(-6); out = out.replace(/\.?0+$/, '');
    if (out === '' || out === '0') return q.n === 0n ? '0' : (neg ? '-' : '') + '0.000001 or less';
    return (neg ? '-' : '') + out;
  }
  function dims(M) { return M.length + '\u00d7' + M[0].length; }
  function mm(X, Y) { return X.map(function (r, i) { return Y[0].map(function (_, j) { var s = Q(0n); for (var k = 0; k < Y.length; k++) s = add(s, mul(X[i][k], Y[k][j])); return s; }); }); }
  function readM(S, name) {
    if (!S || !S.length || !S[0].length) return { error: 'Matrix ' + name + ' is empty.' };
    if (S.length > MAXN || S[0].length > MAXN) return { error: 'Matrix ' + name + ' is larger than ' + MAXN + '\u00d7' + MAXN + '.' };
    var M = [];
    for (var i = 0; i < S.length; i++) { M.push([]); for (var j = 0; j < S[0].length; j++) {
      var p = parse(S[i][j]); if (p.error) return { error: 'Matrix ' + name + ', row ' + (i + 1) + ', column ' + (j + 1) + ': ' + (p.error === 'empty' ? 'enter a number.' : '\u2018' + String(S[i][j]).trim() + '\u2019 is ' + (p.error === 'division by zero' ? 'a division by zero.' : p.error === 'too long' ? 'too long.' : 'not a number. Use integers, decimals or fractions such as 3/4.')), cell: [name, i, j] };
      M[i].push(p.v); } }
    return { M: M };
  }
  function show(M) { return '[' + M.map(function (r) { return r.map(text).join(', '); }).join('; ') + ']'; }
  function finish(M, steps, title, extra) {
    var o = { ok: true, M: M, rows: M.length, cols: M[0].length, title: title, steps: steps, text: M.map(function (r) { return r.map(text); }), dec: M.map(function (r) { return r.map(dec); }) };
    for (var k in extra) o[k] = extra[k]; return o;
  }

  function div(a, b) { return Q(a.n * b.d, a.d * b.n); }
  function copy(M) { return M.map(function (r) { return r.slice(); }); }
  function ident(n) { var I = []; for (var i = 0; i < n; i++) { I.push([]); for (var j = 0; j < n; j++) I[i].push(Q(i === j ? 1n : 0n)); } return I; }
  function sq(A, what) { return A.length === A[0].length ? null : 'A is ' + dims(A) + '. ' + what + ' is only defined for a square matrix.'; }
  var N = function (q) { return Number(q.n) / Number(q.d); };
  function detOf(A, st) {
    var M = copy(A), n = M.length, sign = 1, c, r, i, j;
    for (c = 0; c < n; c++) {
      for (r = c; r < n && isZero(M[r][c]); r++);
      if (r === n) { if (st && st.length < 16) st.push('Column ' + (c + 1) + ' has no usable pivot, so det(A) = 0.'); return Q(0n); }
      if (r !== c) { var t = M[r]; M[r] = M[c]; M[c] = t; sign = -sign; if (st && st.length < 16) st.push('Swap R' + (c + 1) + ' and R' + (r + 1) + ' (the sign of the determinant flips).'); }
      for (i = c + 1; i < n; i++) if (!isZero(M[i][c])) { var f = div(M[i][c], M[c][c]); for (j = c; j < n; j++) M[i][j] = sub(M[i][j], mul(f, M[c][j])); if (st && st.length < 16) st.push('R' + (i + 1) + ' \u2190 R' + (i + 1) + ' \u2212 (' + text(f) + ')\u00b7R' + (c + 1)); }
    }
    var d = Q(sign === 1 ? 1n : -1n); for (i = 0; i < n; i++) d = mul(d, M[i][i]);
    if (st && st.length < 17) st.push('Triangular form reached. det(A) = ' + (sign < 0 ? '(\u22121) \u00d7 ' : '') + 'product of the diagonal (' + M.map(function (r, i) { return text(r[i]); }).join(' \u00d7 ') + ') = ' + text(d));
    return d;
  }
  function rankOf(A, st) {
    var M = copy(A), rk = 0, c, r, i, j;
    for (c = 0; c < M[0].length && rk < M.length; c++) {
      for (r = rk; r < M.length && isZero(M[r][c]); r++);
      if (r === M.length) continue;
      var t = M[r]; M[r] = M[rk]; M[rk] = t;
      for (i = rk + 1; i < M.length; i++) if (!isZero(M[i][c])) { var f = div(M[i][c], M[rk][c]); for (j = c; j < M[0].length; j++) M[i][j] = sub(M[i][j], mul(f, M[rk][j])); }
      if (st && st.length < 17) st.push('Pivot in column ' + (c + 1) + ' (row ' + (rk + 1) + ' of the reduced form).'); rk++;
    }
    return rk;
  }
  function invOf(A, st) {
    var n = A.length, M = A.map(function (r, i) { return r.concat(ident(n)[i]); }), c, r, i, j;
    for (c = 0; c < n; c++) {
      for (r = c; r < n && isZero(M[r][c]); r++);
      if (r === n) return null;
      var t = M[r]; M[r] = M[c]; M[c] = t; if (r !== c && st && st.length < 16) st.push('Swap R' + (c + 1) + ' and R' + (r + 1) + '.');
      var p = M[c][c]; if (!(p.n === 1n && p.d === 1n)) { M[c] = M[c].map(function (x) { return div(x, p); }); if (st && st.length < 16) st.push('R' + (c + 1) + ' \u2190 R' + (c + 1) + ' \u00f7 (' + text(p) + ')'); }
      for (i = 0; i < n; i++) if (i !== c && !isZero(M[i][c])) { var f = M[i][c]; for (j = 0; j < 2 * n; j++) M[i][j] = sub(M[i][j], mul(f, M[c][j])); if (st && st.length < 16) st.push('R' + (i + 1) + ' \u2190 R' + (i + 1) + ' \u2212 (' + text(f) + ')\u00b7R' + (c + 1)); }
    }
    return M.map(function (r) { return r.slice(n); });
  }
  function norm1(A) { var b = Q(0n); for (var j = 0; j < A[0].length; j++) { var s = Q(0n); for (var i = 0; i < A.length; i++) s = add(s, A[i][j].n < 0n ? Q(-A[i][j].n, A[i][j].d) : A[i][j]); if (s.n * b.d > b.n * s.d) b = s; } return b; }
  function normInf(A) { return norm1(A[0].map(function (_, j) { return A.map(function (r) { return r[j]; }); })); }
  function minorM(A, i, j) { return A.filter(function (_, r) { return r !== i; }).map(function (r) { return r.filter(function (_, c) { return c !== j; }); }); }
  function sc(label, q) { return { label: label, text: text(q), dec: dec(q) }; }
  function props(o, A, steps) {
    var e, n = A.length, i, j, d, R;
    if (o.op === 'det') { if ((e = sq(A, 'The determinant'))) return { ok: false, error: e }; steps.push('Row-reduce A with row swaps, keeping track of the sign.'); d = detOf(A, steps); return { ok: true, title: 'det(A)', scalar: [sc('det(A)', d)], steps: steps, singular: isZero(d), det: d }; }
    if (o.op === 'rank') { steps.push('Row-reduce A. The rank is the number of pivots.'); R = rankOf(A, steps); steps.push('rank(A) = ' + R + ' (A is ' + dims(A) + ', so the most it can be is ' + Math.min(n, A[0].length) + ').'); return { ok: true, title: 'rank(A)', scalar: [sc('rank(A)', Q(BigInt(R)))], steps: steps }; }
    if (o.op === 'trace') { if ((e = sq(A, 'The trace'))) return { ok: false, error: e }; d = Q(0n); for (i = 0; i < n; i++) d = add(d, A[i][i]); steps.push('tr(A) = ' + A.map(function (r, i) { return text(r[i]); }).join(' + ') + ' = ' + text(d)); return { ok: true, title: 'tr(A)', scalar: [sc('tr(A)', d)], steps: steps }; }
    if (o.op === 'norm') { var f = Q(0n); A.forEach(function (r) { r.forEach(function (x) { f = add(f, mul(x, x)); }); }); var fr = Math.sqrt(N(f)), n1 = norm1(A), ni = normInf(A);
      steps.push('1-norm: largest column sum of absolute values = ' + text(n1) + '.', 'Infinity norm: largest row sum of absolute values = ' + text(ni) + '.', 'Frobenius norm: square root of the sum of squares = \u221a' + text(f) + ' \u2248 ' + String(+fr.toPrecision(7)) + '.');
      return { ok: true, title: '\u2016A\u2016', scalar: [sc('\u2016A\u2016\u2081', n1), sc('\u2016A\u2016\u221e', ni), { label: '\u2016A\u2016F', text: '\u221a' + text(f), dec: String(+fr.toPrecision(7)) }], steps: steps }; }
    if ((e = sq(A, o.op === 'inv' ? 'The inverse' : 'The ' + (o.op === 'adj' ? 'adjugate' : o.op === 'cof' ? 'cofactor matrix' : 'matrix of minors')))) return { ok: false, error: e };
    if (o.op === 'inv') {
      d = detOf(A); if (isZero(d)) return { ok: false, error: 'A is singular: det(A) = 0 (rank ' + rankOf(A) + ' of ' + n + '), so it has no inverse.', singular: true };
      steps.push('Row-reduce [A | I] to [I | A\u207b\u00b9]. det(A) = ' + text(d) + ', which is not zero.'); R = invOf(A, steps);
      var c1 = norm1(A), c2 = norm1(R), cond = N(c1) * N(c2); var chk = mm(A, R), okI = chk.every(function (r, i) { return r.every(function (x, j) { return x.n === (i === j ? 1n : 0n) && x.d === 1n; }); });
      steps.push('Condition number (1-norm) \u2248 ' + String(+cond.toPrecision(4)) + '. ' + (cond > 1e8 ? 'This is very large: the matrix is ill-conditioned, so small changes in the entries change the inverse a lot. The result here is exact, but measured data would be unreliable.' : cond > 100 ? 'Moderate: the inverse is sensitive to small errors in the entries, so expect to lose about ' + Math.floor(Math.log10(cond)) + ' digit(s) of accuracy with measured data.' : 'Small, so the matrix is well-conditioned.'), 'Check: A \u00d7 A\u207b\u00b9 ' + (okI ? 'gives the identity matrix exactly.' : 'does not give the identity (this should never happen).'));
      return finish(R, steps, 'A\u207b\u00b9', { det: d, cond: cond, inv: true });
    }
    var Mi = A.map(function (r, i) { return r.map(function (_, j) { return n === 1 ? Q(1n) : detOf(minorM(A, i, j)); }); }), Co = Mi.map(function (r, i) { return r.map(function (x, j) { return (i + j) % 2 ? Q(-x.n, x.d) : x; }); });
    if (o.op === 'minor') { steps.push('M[i,j] is the determinant of A with row i and column j deleted.'); for (i = 0; i < n; i++) for (j = 0; j < n && steps.length < 17; j++) steps.push('M[' + (i + 1) + ',' + (j + 1) + '] = ' + text(Mi[i][j])); return finish(Mi, steps, 'Minors M\u1d62\u2c7c'); }
    steps.push('Cofactor C[i,j] = (\u22121)^(i+j) \u00d7 M[i,j].'); if (o.op === 'cof') { for (i = 0; i < n; i++) for (j = 0; j < n && steps.length < 17; j++) steps.push('C[' + (i + 1) + ',' + (j + 1) + '] = ' + ((i + j) % 2 ? '\u2212' : '+') + text(Mi[i][j]) + ' = ' + text(Co[i][j])); return finish(Co, steps, 'Cofactors C\u1d62\u2c7c'); }
    steps.push('The adjugate is the transpose of the cofactor matrix. For an invertible matrix, A\u207b\u00b9 = adj(A) / det(A).'); return finish(Co[0].map(function (_, j) { return Co.map(function (r) { return r[j]; }); }), steps, 'adj(A)', { det: detOf(A) });
  }

  /* ---- Mode 03: linear systems AX = B ---- */
  var SUBD = '\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089';
  function sub9(i) { return String(i).replace(/\d/g, function (d) { return SUBD[+d]; }); }
  function xv(i) { return 'x' + sub9(i + 1); }
  function lg(st) { for (var q = 1; q < arguments.length; q++) { if (st.length < 60) st.push(arguments[q]); else st.capped = true; } }
  function reduce(M0, nc, full, st) {
    var M = copy(M0), rk = 0, piv = [], c, r, i, t;
    for (c = 0; c < nc && rk < M.length; c++) {
      for (r = rk; r < M.length && isZero(M[r][c]); r++);
      if (r === M.length) { if (st) lg(st, 'Column ' + (c + 1) + ' has no pivot, so ' + xv(c) + ' is a free variable.'); continue; }
      if (r !== rk) { t = M[r]; M[r] = M[rk]; M[rk] = t; if (st) lg(st, 'Swap R' + (rk + 1) + ' and R' + (r + 1) + '.'); }
      var p = M[rk][c];
      if (full && !(p.n === 1n && p.d === 1n)) { M[rk] = M[rk].map(function (x) { return div(x, p); }); if (st) lg(st, 'R' + (rk + 1) + ' \u2190 R' + (rk + 1) + ' \u00f7 (' + text(p) + ')'); }
      for (i = full ? 0 : rk + 1; i < M.length; i++) if (i !== rk && !isZero(M[i][c])) {
        var f = full ? M[i][c] : div(M[i][c], M[rk][c]), pr = M[rk]; M[i] = M[i].map(function (x, j) { return sub(x, mul(f, pr[j])); });
        if (st) lg(st, 'R' + (i + 1) + ' \u2190 R' + (i + 1) + ' \u2212 (' + text(f) + ')\u00b7R' + (rk + 1));
      }
      piv.push([rk, c]); rk++;
    }
    return { M: M, piv: piv };
  }
  function classify(R, piv, n, k) {
    var rk = piv.length, free = [], j, i, r, f, out = [], pc = {};
    piv.forEach(function (p) { pc[p[1]] = p[0]; });
    for (j = 0; j < n; j++) if (pc[j] === undefined) free.push(j);
    for (j = 0; j < k; j++) {
      var bad = false; for (r = rk; r < R.length; r++) if (!isZero(R[r][n + j])) bad = true;
      if (bad) { out.push({ type: 'none', rank: rk, rankAug: rk + 1 }); continue; }
      var part = [], basis = []; for (i = 0; i < n; i++) part.push(pc[i] === undefined ? Q(0n) : R[pc[i]][n + j]);
      if (!free.length) { out.push({ type: 'unique', x: part, rank: rk, rankAug: rk }); continue; }
      free.forEach(function (fv) { var v = []; for (i = 0; i < n; i++) v.push(i === fv ? Q(1n) : pc[i] === undefined ? Q(0n) : Q(-R[pc[i]][fv].n, R[pc[i]][fv].d)); basis.push(v); });
      out.push({ type: 'infinite', particular: part, basis: basis, free: free, pc: pc, R: R, col: n + j, rank: rk, rankAug: rk });
    }
    return out;
  }
  function paramLines(c, n) {
    var lines = []; for (var i = 0; i < n; i++) {
      var fi = c.free.indexOf(i), parts = [];
      if (fi >= 0) { lines.push(xv(i) + ' = t' + sub9(fi + 1) + '  (free)'); continue; }
      var r = c.pc[i]; if (!isZero(c.R[r][c.col])) parts.push(text(c.R[r][c.col]));
      c.free.forEach(function (f, k) { var v = c.R[r][f]; if (!isZero(v)) parts.push('(' + text(Q(-v.n, v.d)) + ')\u00b7t' + sub9(k + 1)); });
      lines.push(xv(i) + ' = ' + (parts.join(' + ') || '0'));
    }
    return lines;
  }
  function eqLine(A, B, i) { var t = []; A[i].forEach(function (a, j) { if (!isZero(a)) t.push((a.n === 1n && a.d === 1n ? '' : a.n === -1n && a.d === 1n ? '\u2212' : /[\/-]/.test(text(a)) ? '(' + text(a) + ')' : text(a)) + xv(j)); }); return (t.join(' + ') || '0') + ' = ' + text(B[i][0]); }
  function luDecomp(A) {
    var n = A.length, U = copy(A), L = ident(n).map(function (r) { return r.map(function () { return Q(0n); }); }), perm = [], i, j, c, r, t;
    for (i = 0; i < n; i++) perm.push(i);
    for (c = 0; c < n; c++) {
      for (r = c; r < n && isZero(U[r][c]); r++); if (r === n) return null;
      if (r !== c) { t = U[r]; U[r] = U[c]; U[c] = t; t = perm[r]; perm[r] = perm[c]; perm[c] = t; for (j = 0; j < c; j++) { t = L[r][j]; L[r][j] = L[c][j]; L[c][j] = t; } }
      for (i = c + 1; i < n; i++) { var f = div(U[i][c], U[c][c]); L[i][c] = f; if (!isZero(f)) for (j = c; j < n; j++) U[i][j] = sub(U[i][j], mul(f, U[c][j])); }
    }
    for (i = 0; i < n; i++) L[i][i] = Q(1n);
    return { L: L, U: U, perm: perm };
  }
  function lines3(sol, n, k, st) {
    var L = [], j, i, allU = sol.every(function (c) { return c.type === 'unique'; });
    sol.forEach(function (c, jj) {
      var pre = k > 1 ? 'Column ' + (jj + 1) + ': ' : '';
      if (c.type === 'unique') { if (k === 1) c.x.forEach(function (x, i) { L.push(xv(i) + ' = ' + text(x) + (dec(x) !== text(x) ? '  \u2248 ' + dec(x) : '')); }); else L.push(pre + c.x.map(function (x, i) { return xv(i) + ' = ' + text(x); }).join(', ')); }
      else if (c.type === 'none') L.push(pre + 'No solution. rank(A) = ' + c.rank + ' but rank([A | B]) = ' + c.rankAug + ': an equation reduces to 0 = c with c \u2260 0.');
      else { L.push(pre + 'Infinitely many solutions: rank(A) = ' + c.rank + ' is less than the ' + n + ' unknowns, so ' + c.free.length + ' free variable' + (c.free.length > 1 ? 's' : '') + '.'); paramLines(c, n).forEach(function (l) { L.push((k > 1 ? '   ' : '') + l); }); }
    });
    return { lines: L, all: allU };
  }
  function solver(o, A, steps) {
    var b = readM(o.B, 'B'); if (b.error) return { ok: false, error: b.error, cell: b.cell };
    var B = b.M, m = A.length, n = A[0].length, k = B[0].length, meth = o.op.slice(6), i, j, e, aug, rr, sol, X = null, kk;
    if (B.length !== m) return { ok: false, error: 'A has ' + m + ' rows (equations) but B has ' + B.length + '. B needs one row for each equation.' };
    aug = A.map(function (r, i) { return r.concat(B[i]); }); rr = reduce(aug, n, true); sol = classify(rr.M, rr.piv, n, k);
    var allU = sol.every(function (c) { return c.type === 'unique'; }), rk = rr.piv.length;
    if (meth === 'cramer' || meth === 'lu') {
      var nm = meth === 'cramer' ? "Cramer's rule" : 'LU solving';
      if (m !== n) return { ok: false, error: nm + ' needs a square A, but A is ' + dims(A) + '. Use Gauss-Jordan for rectangular systems.' };
      if (rk < n) return { ok: false, error: nm + ' needs det(A) \u2260 0, but A is singular (rank ' + rk + ' of ' + n + '). ' + (sol.every(function (c) { return c.type === 'none'; }) ? 'This system has no solution.' : sol.some(function (c) { return c.type === 'infinite'; }) ? 'This system has infinitely many solutions (or none, depending on B). Use Gauss-Jordan to see which.' : 'Use Gauss-Jordan to see the solution.') };
    }
    if (k === 1 && m <= 8) { steps.push('System of equations:'); for (i = 0; i < m; i++) lg(steps, '   ' + eqLine(A, B, i)); }
    if (meth === 'gj') { lg(steps, 'Gauss-Jordan: reduce [A | B] to reduced row echelon form.'); var g = reduce(aug, n, true, steps); lg(steps, 'RREF of [A | B] = ' + show(g.M)); }
    else if (meth === 'gauss') {
      lg(steps, 'Gaussian elimination: reduce [A | B] to row echelon form (zeros below each pivot).'); var fw = reduce(aug, n, false, steps).M; lg(steps, 'Row echelon form = ' + show(fw));
      if (allU) { var xs = []; for (kk = 0; kk < k; kk++) { var x = []; if (k > 1) lg(steps, 'Back-substitution, column ' + (kk + 1) + ':');
        for (i = n - 1; i >= 0; i--) { var acc = fw[i][n + kk], tm = ''; for (j = i + 1; j < n; j++) if (!isZero(fw[i][j])) { acc = sub(acc, mul(fw[i][j], x[j])); tm += ' \u2212 (' + text(fw[i][j]) + ')(' + text(x[j]) + ')'; }
          x[i] = div(acc, fw[i][i]); lg(steps, xv(i) + ' = (' + text(fw[i][n + kk]) + tm + ') / ' + (/\//.test(text(fw[i][i])) ? '(' + text(fw[i][i]) + ')' : text(fw[i][i])) + ' = ' + text(x[i])); }
        xs.push(x); } sol = sol.map(function (c, kk) { return { type: 'unique', x: xs[kk], rank: c.rank, rankAug: c.rankAug }; }); }
      else lg(steps, 'The echelon form shows the system is not uniquely solvable. Back-substitution with free variables gives the answer below.');
    } else if (meth === 'cramer') {
      var d = detOf(A); lg(steps, "Cramer's rule: x\u1d62 = det(A\u1d62) / det(A), where A\u1d62 is A with column i replaced by B. det(A) = " + text(d) + ', not zero.'); var cx = [];
      for (kk = 0; kk < k; kk++) { var cc = []; for (i = 0; i < n; i++) { var Ai = A.map(function (r, ri) { var q = r.slice(); q[i] = B[ri][kk]; return q; }), di = detOf(Ai); cc.push(div(di, d)); lg(steps, (k > 1 ? 'Column ' + (kk + 1) + ': ' : '') + xv(i) + ' = det(A' + sub9(i + 1) + ') / det(A) = ' + text(di) + ' / ' + text(d) + ' = ' + text(cc[i])); } cx.push(cc); }
      sol = sol.map(function (c, kk) { return { type: 'unique', x: cx[kk], rank: c.rank, rankAug: c.rankAug }; });
    } else if (meth === 'lu') {
      var lu = luDecomp(A), PA = lu.perm.map(function (p) { return A[p]; }), prod = mm(lu.L, lu.U), okLU = prod.every(function (r, i) { return r.every(function (x, j) { return x.n === PA[i][j].n && x.d === PA[i][j].d; }); });
      lg(steps, 'LU with partial pivoting: PA = LU, where L is unit lower triangular and U is upper triangular.', 'Row order P = [' + lu.perm.map(function (p) { return p + 1; }).join(', ') + ']', 'L = ' + show(lu.L), 'U = ' + show(lu.U), 'Check: PA = LU ' + (okLU ? 'holds exactly.' : 'FAILED (should never happen).'));
      var lx = []; for (kk = 0; kk < k; kk++) { var y = [], xx = []; for (i = 0; i < n; i++) { var a1 = B[lu.perm[i]][kk]; for (j = 0; j < i; j++) a1 = sub(a1, mul(lu.L[i][j], y[j])); y[i] = a1; }
        for (i = n - 1; i >= 0; i--) { var a2 = y[i]; for (j = i + 1; j < n; j++) a2 = sub(a2, mul(lu.U[i][j], xx[j])); xx[i] = div(a2, lu.U[i][i]); }
        lg(steps, (k > 1 ? 'Column ' + (kk + 1) + ': ' : '') + 'Forward substitution Ly = Pb gives y = ' + show([y]), (k > 1 ? 'Column ' + (kk + 1) + ': ' : '') + 'Back substitution Ux = y gives x = ' + show([xx])); lx.push(xx); }
      sol = sol.map(function (c, kk) { return { type: 'unique', x: lx[kk], rank: c.rank, rankAug: c.rankAug }; });
    }
    lg(steps, 'rank(A) = ' + rk + ', unknowns = ' + n + ', equations = ' + m + '.');
    var L3 = lines3(sol, n, k, steps), status = sol.every(function (c) { return c.type === sol[0].type; }) ? { unique: 'Unique solution', infinite: 'Infinitely many solutions', none: 'No solution' }[sol[0].type] : 'Mixed results, see each column';
    var base = { kind: sol[0].type, status: status, lines: L3.lines, sol: sol.map(function (c) { return { type: c.type, x: c.x && c.x.map(text), particular: c.particular && c.particular.map(text), basis: c.basis && c.basis.map(function (v) { return v.map(text); }), free: c.free, rank: c.rank, rankAug: c.rankAug }; }), capped: !!steps.capped };
    if (L3.all) { X = n ? A[0].map(function (_, i) { return sol.map(function (c) { return c.x[i]; }); }) : null; return finish(X, steps, 'Solution X', base); }
    base.ok = true; base.title = 'Solve AX = B'; base.steps = steps; return base;
  }
  function refOp(o, A, steps) {
    var full = o.op === 'rref', R = (steps.push(full ? 'Reduced row echelon form: every pivot is 1 and is the only non-zero entry in its column.' : 'Row echelon form: zeros below each pivot.'), reduce(A, A[0].length, full, steps));
    lg(steps, 'Pivot columns: ' + (R.piv.map(function (p) { return p[1] + 1; }).join(', ') || 'none') + '. rank(A) = ' + R.piv.length + '.');
    return finish(R.M, steps, full ? 'RREF(A)' : 'REF(A)', { capped: !!steps.capped, lines: ['Pivot columns: ' + (R.piv.map(function (p) { return p[1] + 1; }).join(', ') || 'none'), 'rank(A) = ' + R.piv.length] });
  }
  /* o: { op: add|sub|mul|scale|transpose|power, A: [[str]], B: [[str]], k: str, n: str } */
  function calc(o) {
    var a = readM(o.A, 'A'); if (a.error) return { ok: false, error: a.error, cell: a.cell }; var A = a.M, B, steps = [], i, j, S = [];
    if (/^(det|inv|rank|trace|norm|adj|cof|minor)$/.test(o.op)) return props(o, A, steps);
    if (o.op === 'ref' || o.op === 'rref') return refOp(o, A, steps);
    if (/^solve-(gj|gauss|cramer|lu)$/.test(o.op)) return solver(o, A, steps);
    var two = o.op === 'add' || o.op === 'sub' || o.op === 'mul';
    if (two) { var b = readM(o.B, 'B'); if (b.error) return { ok: false, error: b.error, cell: b.cell }; B = b.M; }
    if (o.op === 'add' || o.op === 'sub') {
      var pl = o.op === 'add', sg = pl ? '+' : '\u2212';
      if (A.length !== B.length || A[0].length !== B[0].length) return { ok: false, error: 'A is ' + dims(A) + ' and B is ' + dims(B) + '. Matrices must be the same size to ' + (pl ? 'add' : 'subtract') + ' them.' };
      var C = A.map(function (r, i) { return r.map(function (x, j) { return pl ? add(x, B[i][j]) : sub(x, B[i][j]); }); });
      steps.push('Both matrices are ' + dims(A) + ', so each entry is ' + (pl ? 'added' : 'subtracted') + ' to the entry in the same position.');
      for (i = 0; i < C.length; i++) for (j = 0; j < C[0].length && steps.length < 17; j++) steps.push('C[' + (i + 1) + ',' + (j + 1) + '] = ' + text(A[i][j]) + ' ' + sg + ' ' + text(B[i][j]) + ' = ' + text(C[i][j]));
      return finish(C, steps, 'A ' + sg + ' B');
    }
    if (o.op === 'mul') {
      if (A[0].length !== B.length) return { ok: false, error: 'A is ' + dims(A) + ' and B is ' + dims(B) + '. The number of columns of A (' + A[0].length + ') must equal the number of rows of B (' + B.length + ') to multiply them.' };
      var P = mm(A, B);
      steps.push(dims(A) + ' times ' + dims(B) + ' gives ' + dims(P) + '. Each entry is row i of A times column j of B.');
      for (i = 0; i < P.length; i++) for (j = 0; j < P[0].length && steps.length < 17; j++) { var t = []; for (var k = 0; k < B.length; k++) t.push('(' + text(A[i][k]) + ')(' + text(B[k][j]) + ')'); steps.push('C[' + (i + 1) + ',' + (j + 1) + '] = ' + t.join(' + ') + ' = ' + text(P[i][j])); }
      return finish(P, steps, 'AB');
    }
    if (o.op === 'scale') {
      var kk = parse(o.k); if (kk.error) return { ok: false, error: 'Scalar k: ' + (kk.error === 'empty' ? 'enter a number.' : 'not a number. Use an integer, decimal or fraction.'), cell: ['k'] };
      var Sc = A.map(function (r) { return r.map(function (x) { return mul(kk.v, x); }); });
      steps.push('Multiply every entry of A by k = ' + text(kk.v) + '.');
      for (i = 0; i < Sc.length; i++) for (j = 0; j < Sc[0].length && steps.length < 17; j++) steps.push('kA[' + (i + 1) + ',' + (j + 1) + '] = ' + text(kk.v) + ' \u00d7 ' + text(A[i][j]) + ' = ' + text(Sc[i][j]));
      return finish(Sc, steps, 'kA');
    }
    if (o.op === 'transpose') {
      var T = A[0].map(function (_, j) { return A.map(function (r) { return r[j]; }); });
      steps.push('A is ' + dims(A) + ', so Aᵀ is ' + dims(T) + '. Row i of A becomes column i of Aᵀ.');
      for (i = 0; i < A.length && steps.length < 17; i++) steps.push('Row ' + (i + 1) + ' of A (' + A[i].map(text).join(', ') + ') is column ' + (i + 1) + ' of Aᵀ.');
      return finish(T, steps, 'Aᵀ');
    }
    if (o.op === 'power') {
      if (A.length !== A[0].length) return { ok: false, error: 'A is ' + dims(A) + '. Only a square matrix can be raised to a power.' };
      var n = /^-?\d+$/.test(String(o.n).trim()) ? parseInt(o.n, 10) : NaN;
      if (isNaN(n) || Math.abs(n) > MAXPOW) return { ok: false, error: 'Power n must be a whole number from \u2212' + MAXPOW + ' to ' + MAXPOW + '.', cell: ['n'] };
      if (n < 0) { var iv = invOf(A); if (!iv) return { ok: false, error: 'A is singular (det(A) = 0), so it has no inverse and no negative powers.' }; steps.push('A^' + n + ' = (A\u207b\u00b9)^' + (-n) + '. First A\u207b\u00b9 = ' + show(iv) + '.'); A = iv; n = -n; }
      var R = A.map(function (r, i) { return r.map(function (_, j) { return Q(i === j ? 1n : 0n); }); });
      if (n === 0) steps.push('A\u2070 is the identity matrix of the same size.');
      else { R = A; steps.push('A\u00b9 = ' + show(A)); for (var p = 2; p <= n; p++) { R = mm(R, A); var s = show(R); steps.push('A^' + p + ' = A^' + (p - 1) + ' \u00d7 A = ' + (s.length > MAXLEN ? 'a ' + dims(R) + ' matrix with large entries (see result for A^' + n + ')' : s)); } }
      return finish(R, steps, 'A^' + (o.n.trim().charAt(0) === '-' ? '(' + o.n.trim() + ')' : n));
    }
    return { ok: false, error: 'Unknown operation.' };
  }
  var api = { calc: calc, detOf: detOf, parse: parse, text: text, dec: dec, MAXN: MAXN, MAXPOW: MAXPOW };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MatrixEngine = api;
})(typeof self !== 'undefined' ? self : this);
