/* Elecmetric Matrix Calculator, Mode 06: matrix functions.
   exp(A) by scaling and squaring with a degree-13 Pade approximant (Higham 2005); sin(A) and cos(A) from one exponential of the block
   matrix [[0,-A],[A,0]]; principal square root by the scaled Denman-Beavers iteration; principal logarithm by inverse scaling and
   squaring with a Gauss-Legendre (Pade) quadrature of log(I+X). Real matrices up to 8 x 8. Every result carries identity checks.
   Needs MatrixDecomp (decomp_engine.js) for the eigenvalue pre-check. Required by tests/matfun_run.js, inlined by tools/matrix_page6.js. */
(function (root) {
  'use strict';
  var EPS = 2.220446049250313e-16;
  var D = (typeof module !== 'undefined' && module.exports) ? require('./decomp_engine.js') : root.MatrixDecomp;
  var OPS = { expm: 'Matrix exponential', logm: 'Matrix logarithm', sqrtm: 'Matrix square root', sinm: 'Matrix sine', cosm: 'Matrix cosine' };

  function zeros(m, n) { var M = [], i; for (i = 0; i < m; i++) M.push(new Array(n).fill(0)); return M; }
  function eye(n) { var I = zeros(n, n); for (var i = 0; i < n; i++) I[i][i] = 1; return I; }
  function mul(A, B) { var m = A.length, k = B.length, n = B[0].length, R = zeros(m, n), i, j, p; for (i = 0; i < m; i++) for (p = 0; p < k; p++) { var a = A[i][p]; if (a !== 0) for (j = 0; j < n; j++) R[i][j] += a * B[p][j]; } return R; }
  function add(A, B) { return A.map(function (r, i) { return r.map(function (x, j) { return x + B[i][j]; }); }); }
  function sub(A, B) { return A.map(function (r, i) { return r.map(function (x, j) { return x - B[i][j]; }); }); }
  function sc(A, s) { return A.map(function (r) { return r.map(function (x) { return x * s; }); }); }
  function fro(A) { var s = 0; A.forEach(function (r) { r.forEach(function (x) { s += x * x; }); }); return Math.sqrt(s); }
  function norm1(A) { var mx = 0, n = A[0].length, j, i; for (j = 0; j < n; j++) { var s = 0; for (i = 0; i < A.length; i++) s += Math.abs(A[i][j]); mx = Math.max(mx, s); } return mx; }
  function finite(A) { return A.every(function (r) { return r.every(isFinite); }); }
  /* solve A X = B by Gaussian elimination with partial pivoting; also returns det(A). null when singular */
  function solve(A, B) {
    var n = A.length, m = B[0].length, M = A.map(function (r, i) { return r.concat(B[i]); }), det = 1, i, j, k;
    for (k = 0; k < n; k++) {
      var p = k; for (i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
      if (M[p][k] === 0) return null;
      if (p !== k) { var t = M[p]; M[p] = M[k]; M[k] = t; det = -det; }
      det *= M[k][k];
      for (i = k + 1; i < n; i++) { var f = M[i][k] / M[k][k]; if (f !== 0) for (j = k; j < n + m; j++) M[i][j] -= f * M[k][j]; }
    }
    var X = zeros(n, m);
    for (j = 0; j < m; j++) for (i = n - 1; i >= 0; i--) { var s = M[i][n + j]; for (k = i + 1; k < n; k++) s -= M[i][k] * X[k][j]; X[i][j] = s / M[i][i]; }
    return { X: X, det: det };
  }
  function inv(A) { var r = solve(A, eye(A.length)); return r ? r.X : null; }

  /* exp(A): returns {E, s} or null on overflow */
  var B13 = [64764752532480000, 32382376266240000, 7771770303897600, 1187353796428800, 129060195264000, 10559470521600, 670442572800, 33522128640, 1323241920, 40840800, 960960, 16380, 182, 1];
  function expm(A) {
    var n = A.length, nr = norm1(A), s = nr > 5.371920351148152 ? Math.max(0, Math.ceil(Math.log(nr / 5.371920351148152) / Math.LN2)) : 0;
    if (s > 1000) return null;
    var As = sc(A, Math.pow(2, -s)), I = eye(n), A2 = mul(As, As), A4 = mul(A2, A2), A6 = mul(A4, A2), b = B13;
    var inner = add(add(sc(A6, b[13]), sc(A4, b[11])), sc(A2, b[9])), Uo = add(add(add(mul(A6, inner), sc(A6, b[7])), add(sc(A4, b[5]), sc(A2, b[3]))), sc(I, b[1])), U = mul(As, Uo);
    var inV = add(add(sc(A6, b[12]), sc(A4, b[10])), sc(A2, b[8])), V = add(add(add(mul(A6, inV), sc(A6, b[6])), add(sc(A4, b[4]), sc(A2, b[2]))), sc(I, b[0]));
    var R = solve(sub(V, U), add(V, U)); if (!R) return null; var E = R.X;
    for (var k = 0; k < s; k++) { E = mul(E, E); if (!finite(E)) return null; }
    return finite(E) ? { E: E, s: s } : null;
  }
  /* principal square root by scaled Denman-Beavers; assumes no eigenvalue on the closed negative real axis */
  function sqrtDB(A) {
    var n = A.length, Y = A.map(function (r) { return r.slice(); }), Z = eye(n), it, scaling = true;
    for (it = 0; it < 80; it++) {
      var Yi = solve(Y, eye(n)), Zi = solve(Z, eye(n)); if (!Yi || !Zi) return null; Yi = Yi.X; Zi = Zi.X;
      var mu = 1; if (scaling) { var dY = solve(Y, eye(n)).det, dZ = solve(Z, eye(n)).det; mu = Math.pow(Math.abs(dY * dZ), -1 / (2 * n)); if (!isFinite(mu) || mu <= 0) mu = 1; }
      var Yn = sc(add(sc(Y, mu), sc(Zi, 1 / mu)), 0.5), Zn = sc(add(sc(Z, mu), sc(Yi, 1 / mu)), 0.5), ch = fro(sub(Yn, Y)) / Math.max(fro(Yn), 1e-300);
      Y = Yn; Z = Zn; if (ch < 1e-2) scaling = false; if (ch <= 4 * EPS * n && !scaling) return { S: Y, iters: it + 1 };
      if (!finite(Y)) return null;
    }
    return { S: Y, iters: 80, slow: true };
  }
  /* Gauss-Legendre nodes and weights on [0,1] */
  function gl(m) {
    var x = [], w = [], i, k;
    for (i = 0; i < m; i++) {
      var z = Math.cos(Math.PI * (i + 0.75) / (m + 0.5)), pp = 1;
      for (k = 0; k < 100; k++) { var p1 = 1, p2 = 0, j; for (j = 1; j <= m; j++) { var p3 = p2; p2 = p1; p1 = ((2 * j - 1) * z * p2 - (j - 1) * p3) / j; } pp = m * (z * p1 - p2) / (z * z - 1); var dz = p1 / pp; z -= dz; if (Math.abs(dz) < 1e-16) break; }
      x.push((1 - z) / 2); w.push(1 / ((1 - z * z) * pp * pp));
    }
    return { x: x, w: w };
  }
  var GL = gl(8);
  function logm(A) {
    var n = A.length, I = eye(n), B = A.map(function (r) { return r.slice(); }), k = 0, steps = 0;
    while (norm1(sub(B, I)) > 0.2 && k < 60) { var r = sqrtDB(B); if (!r) return null; B = r.S; k++; }
    var X = sub(B, I), L = zeros(n, n), j;
    for (j = 0; j < GL.x.length; j++) { var T = solve(add(I, sc(X, GL.x[j])), X); if (!T) return null; L = add(L, sc(T.X, GL.w[j])); }
    return { L: sc(L, Math.pow(2, k)), k: k };
  }
  function eigBad(A) {
    var g = D.eigGeneral(A); if (g.error) return null; var bad = null, sc_ = Math.max(fro(A), 1);
    g.values.forEach(function (z) { if (Math.abs(z.i) <= 1e-9 * sc_ && z.r <= 1e-12 * sc_) bad = z; });
    return bad ? bad : false;
  }

  /* ---------- formatting and checks ---------- */
  function num(x, tiny) { if (Math.abs(x) <= tiny) return '0'; var a = Math.abs(x); if (a >= 1e7 || a < 1e-4) return x.toExponential(5).replace(/\.?0+e/, 'e').replace('e+', 'e'); return String(parseFloat(x.toPrecision(7))); }
  function sci(x) { return x === 0 ? '0' : x.toExponential(2).replace('e+', 'e'); }
  function fmtMat(M, label) { var tiny = Math.max(fro(M), 1) * 1e-13, t = M.map(function (r) { return r.map(function (v) { return num(v, tiny); }); }); return { label: label, rows: M.length, cols: M[0].length, text: t, dec: t }; }
  function verdict(res, n) { var lim = 1e3 * Math.max(n, 1) * EPS; return res <= lim ? 'pass' : res <= 1e5 * Math.max(n, 1) * EPS ? 'reduced' : 'fail'; }
  function chk(label, value, n) { return { label: label, value: value, text: sci(value), state: verdict(value, n) }; }
  function overall(c) { var w = 'pass'; c.forEach(function (x) { if (x.state === 'fail') w = 'fail'; else if (x.state === 'reduced' && w !== 'fail') w = 'reduced'; }); return w; }
  function statusText(w) { return w === 'pass' ? 'All checks passed' : w === 'reduced' ? 'Reduced accuracy (sensitive input)' : 'Checks failed: treat the result with caution'; }
  function trace(A) { var t = 0; for (var i = 0; i < A.length; i++) t += A[i][i]; return t; }
  function finish(title, A, F, label, checks, lines, steps, raw) {
    var w = overall(checks); return { ok: true, title: title, mats: [fmtMat(F, label)], lines: lines, checks: checks, status: statusText(w), steps: steps, capped: false, copy: [[label, F]], raw: raw };
  }

  function doExp(A) {
    var n = A.length, r = expm(A); if (!r) return { ok: false, error: 'exp(A) overflows: the entries of A are too large.' };
    var rn = expm(sc(A, -1)); if (!rn) return { ok: false, error: 'exp(−A) overflows: the entries of A are too large.' };
    var E = r.E, En = rn.E, t = trace(A), rh = expm(sc(A, 0.5)), hh = rh ? mul(rh.E, rh.E) : null;
    var checks = [chk('‖e^A·e^−A − I‖ / (‖e^A‖‖e^−A‖)', fro(sub(mul(E, En), eye(n))) / (fro(E) * fro(En)), n)];
    if (hh) checks.push(chk('‖(e^(A/2))² − e^A‖ / ‖e^A‖', fro(sub(hh, E)) / fro(E), n * 4));
    var lines = ['e^A is always invertible, with inverse e^−A and determinant e^trace(A) = ' + num(Math.exp(t), 0) + '.', r.s ? 'A was scaled by 2^−' + r.s + ' before the approximation, then the result was squared ' + r.s + ' time' + (r.s === 1 ? '' : 's') + '.' : 'No scaling was needed (‖A‖₁ ≤ 5.37).'];
    return finish('Matrix exponential e^A', A, E, 'exp(A)', checks, lines, ['Scale: choose s so that ‖A/2ˢ‖₁ ≤ 5.37, the range where a degree-13 Padé approximant is accurate to rounding error.', 'Approximate e^(A/2ˢ) ≈ (V − U)⁻¹(V + U), where U and V are the odd and even parts of a degree-13 polynomial in A/2ˢ (Higham, 2005).', 'Square the result s times, because e^A = (e^(A/2ˢ))^(2ˢ).', 'Checks: e^A·e^−A = I, and (e^(A/2))² = e^A, which compares the result with an exponential computed at half the scale.'], { E: E, s: r.s });
  }
  function doTrig(A, op) {
    var n = A.length, K = zeros(2 * n, 2 * n), i, j;
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) { K[i][n + j] = -A[i][j]; K[n + i][j] = A[i][j]; }
    var r = expm(K); if (!r) return { ok: false, error: 'The entries of A are too large for sin(A) and cos(A).' };
    var Cm = zeros(n, n), Sm = zeros(n, n); for (i = 0; i < n; i++) for (j = 0; j < n; j++) { Cm[i][j] = r.E[i][j]; Sm[i][j] = r.E[n + i][j]; }
    var r2 = expm((function () { var K2 = zeros(2 * n, 2 * n); for (i = 0; i < n; i++) for (j = 0; j < n; j++) { K2[i][n + j] = -2 * A[i][j]; K2[n + i][j] = 2 * A[i][j]; } return K2; })()), S2 = zeros(n, n);
    if (r2) for (i = 0; i < n; i++) for (j = 0; j < n; j++) S2[i][j] = r2.E[n + i][j];
    var id = sub(add(mul(Sm, Sm), mul(Cm, Cm)), eye(n)), dbl = sub(S2, sc(mul(Sm, Cm), 2));
    var checks = [chk('‖sin²A + cos²A − I‖ / (‖sin A‖² + ‖cos A‖²)', fro(id) / (fro(Sm) * fro(Sm) + fro(Cm) * fro(Cm)), n * 2)];
    if (r2) checks.push(chk('‖sin 2A − 2 sin A cos A‖ / (‖sin 2A‖ + ‖sin A‖‖cos A‖)', fro(dbl) / Math.max(fro(S2) + fro(Sm) * fro(Cm), 1e-300), n * 2));
    var F = op === 'sinm' ? Sm : Cm, other = op === 'sinm' ? Cm : Sm, nm = op === 'sinm' ? 'sin' : 'cos';
    var res = finish('Matrix ' + (op === 'sinm' ? 'sine' : 'cosine'), A, F, nm + '(A)', checks, ['sin(A) and cos(A) are computed together. The other function, ' + (op === 'sinm' ? 'cos' : 'sin') + '(A), is shown below.'], ['For real A, e^(iA) = cos A + i sin A. Instead of complex arithmetic, take the real block matrix K = [[0, −A], [A, 0]]. Its exponential is [[cos A, −sin A], [sin A, cos A]].', 'Compute e^K with the scaling-and-squaring Padé method used for e^A, then read cos A from the top-left block and sin A from the bottom-left block.', 'Checks: sin²A + cos²A = I, and the double-angle identity sin 2A = 2 sin A cos A, using a second, independent exponential for 2A.'], { sin: Sm, cos: Cm });
    res.mats.push(fmtMat(other, (op === 'sinm' ? 'cos' : 'sin') + '(A)')); res.copy.push([(op === 'sinm' ? 'cos' : 'sin') + '(A)', other]); return res;
  }
  function doSqrt(A) {
    var n = A.length, bad = eigBad(A);
    if (bad === null) return { ok: false, error: 'Could not find the eigenvalues of A.' };
    if (bad) return { ok: false, error: 'A has ' + (Math.abs(bad.r) <= 1e-12 * Math.max(fro(A), 1) ? 'a zero eigenvalue (it is singular)' : 'a negative real eigenvalue (' + num(bad.r, 0) + ')') + '. This calculator returns the principal square root, which is real only when A has no eigenvalue on the closed negative real axis.' };
    var r = sqrtDB(A); if (!r) return { ok: false, error: 'The square-root iteration failed. A may be too close to singular.' };
    var S = r.S, checks = [chk('‖S² − A‖ / ‖A‖', fro(sub(mul(S, S), A)) / fro(A), n)];
    if (r.slow) checks.push({ label: 'Iteration converged', value: 1, text: 'no', state: 'reduced' });
    return finish('Matrix square root (principal)', A, S, 'sqrt(A)', checks, ['The principal square root is the one whose eigenvalues all have positive real part. It is unique and real when A has no eigenvalue on the closed negative real axis.', 'Converged in ' + r.iters + ' iterations.'], ['Start with Y₀ = A and Z₀ = I.', 'Iterate Yₖ₊₁ = ½(Yₖ + Zₖ⁻¹) and Zₖ₊₁ = ½(Zₖ + Yₖ⁻¹) (Denman–Beavers). Yₖ converges to √A and Zₖ to its inverse; early steps are scaled by the determinant to speed up convergence.', 'Stop when the relative change reaches rounding level.', 'Check: S·S = A.'], { S: S });
  }
  function doLog(A) {
    var n = A.length, bad = eigBad(A);
    if (bad === null) return { ok: false, error: 'Could not find the eigenvalues of A.' };
    if (bad) return { ok: false, error: 'A has ' + (Math.abs(bad.r) <= 1e-12 * Math.max(fro(A), 1) ? 'a zero eigenvalue (it is singular)' : 'a negative real eigenvalue (' + num(bad.r, 0) + ')') + ', so log(A) has no real principal value. It exists for any A with no eigenvalue on the closed negative real axis.' };
    var r = logm(A); if (!r) return { ok: false, error: 'The logarithm computation failed. A may be too close to singular.' };
    var back = expm(r.L); if (!back) return { ok: false, error: 'The logarithm is too large to check.' };
    var checks = [chk('‖exp(log A) − A‖ / ‖A‖', fro(sub(back.E, A)) / fro(A), n * 4)];
    return finish('Matrix logarithm (principal)', A, r.L, 'log(A)', checks, ['The principal logarithm is the one whose eigenvalues have imaginary part between −π and π. It is real when A has no eigenvalue on the closed negative real axis.', 'Took ' + r.k + ' square root' + (r.k === 1 ? '' : 's') + ' to bring A close to I.'], ['Inverse scaling and squaring: take square roots A → A^(1/2) → A^(1/4) … k times, until ‖A^(1/2ᵏ) − I‖₁ ≤ 0.2.', 'With X = A^(1/2ᵏ) − I, use log(I + X) = ∫₀¹ X(I + tX)⁻¹ dt, evaluated by an 8-point Gauss–Legendre rule, which is accurate to rounding error for such a small X.', 'Multiply by 2ᵏ, because log A = 2ᵏ · log(A^(1/2ᵏ)).', 'Check: exp(log A) = A, using the Padé exponential.'], { L: r.L, k: r.k });
  }
  function calc(o) {
    if (!OPS[o.op]) return { ok: false, error: 'Unknown operation.' };
    var G = o.A, A = [], i, j;
    for (i = 0; i < G.length; i++) { A.push([]); for (j = 0; j < G[i].length; j++) { var v = D.parseCell(G[i][j]); if (!isFinite(v)) return { ok: false, error: 'Matrix A, row ' + (i + 1) + ', column ' + (j + 1) + ': enter a number, a decimal or a fraction such as 3/4.', cell: ['A', i, j] }; A[i].push(v); } }
    if (A.length !== A[0].length) return { ok: false, error: 'This function needs a square matrix. A is ' + A.length + ' × ' + A[0].length + '.' };
    if (A.length > 8) return { ok: false, error: 'Matrices are limited to 8 × 8.' };
    try { return { expm: doExp, logm: doLog, sqrtm: doSqrt, sinm: function (M) { return doTrig(M, 'sinm'); }, cosm: function (M) { return doTrig(M, 'cosm'); } }[o.op](A); }
    catch (e) { return { ok: false, error: 'Could not compute this function (' + e.message + ').' }; }
  }
  var api = { calc: calc, OPS: OPS, expm: expm };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MatrixFunctions = api;
})(typeof self !== 'undefined' ? self : this);
