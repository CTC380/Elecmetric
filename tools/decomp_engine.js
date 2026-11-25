/* Elecmetric Matrix Calculator, Mode 04: floating-point decompositions with residual checks.
   LU (partial pivoting), QR (Householder), Cholesky, SVD (one-sided Jacobi), eigenvalues and eigenvectors
   (Jacobi for symmetric matrices, Hessenberg + shifted QR complex Schur otherwise), least squares and pseudo-inverse.
   Every result carries checks (reconstruction, orthogonality, eigenpair residuals). Required by tests/decomp_test.js
   and inlined by tools/matrix_page4.js. Plain double precision; sizes are limited by the page (8 x 8). */
(function (root) {
  'use strict';
  var EPS = 2.220446049250313e-16;

  /* ---------- real matrix helpers ---------- */
  function zeros(m, n) { var M = []; for (var i = 0; i < m; i++) M.push(new Array(n).fill(0)); return M; }
  function eye(n) { var M = zeros(n, n); for (var i = 0; i < n; i++) M[i][i] = 1; return M; }
  function clone(A) { return A.map(function (r) { return r.slice(); }); }
  function tr(A) { var m = A.length, n = A[0].length, T = zeros(n, m); for (var i = 0; i < m; i++) for (var j = 0; j < n; j++) T[j][i] = A[i][j]; return T; }
  function mul(A, B) { var m = A.length, k = B.length, n = B[0].length, C = zeros(m, n); for (var i = 0; i < m; i++) for (var p = 0; p < k; p++) { var a = A[i][p]; if (a === 0) continue; for (var j = 0; j < n; j++) C[i][j] += a * B[p][j]; } return C; }
  function sub(A, B) { return A.map(function (r, i) { return r.map(function (v, j) { return v - B[i][j]; }); }); }
  function fro(A) { var s = 0; A.forEach(function (r) { r.forEach(function (v) { s += v * v; }); }); return Math.sqrt(s); }
  function col(A, j) { return A.map(function (r) { return r[j]; }); }

  /* ---------- parsing and formatting ---------- */
  function parseCell(s) {
    s = String(s === undefined || s === null ? '' : s).replace(/−/g, '-').replace(/\s+/g, '');
    if (s === '') return NaN;
    var m = /^([+-]?\d+(?:\.\d+)?|[+-]?\.\d+)(?:\/([+-]?\d+(?:\.\d+)?))?$/.exec(s);
    if (!m) return NaN;
    var a = parseFloat(m[1]);
    if (m[2] !== undefined) { var d = parseFloat(m[2]); if (d === 0) return NaN; return a / d; }
    return a;
  }
  function parseGrid(name, G) {
    var M = [];
    for (var i = 0; i < G.length; i++) { M.push([]); for (var j = 0; j < G[i].length; j++) { var v = parseCell(G[i][j]); if (!isFinite(v)) return { error: 'Matrix ' + name + ', row ' + (i + 1) + ', column ' + (j + 1) + ': enter a number, a decimal or a fraction such as 3/4.', cell: [name, i, j] }; M[i].push(v); } }
    return { M: M };
  }
  function num(x, tiny) {
    if (Math.abs(x) <= tiny) return '0';
    var a = Math.abs(x), s;
    if (a >= 1e7 || a < 1e-4) { s = x.toExponential(5).replace(/\.?0+e/, 'e').replace('e+', 'e'); return s; }
    s = String(parseFloat(x.toPrecision(7)));
    return s;
  }
  function sci(x) { if (x === 0) return '0'; return x.toExponential(2).replace('e+', 'e'); }
  function fmtMat(M, label) {
    var s = fro(M), tiny = Math.max(s, 1) * 1e-13;
    var text = M.map(function (r) { return r.map(function (v) { return num(v, tiny); }); }); return { label: label, rows: M.length, cols: M[0].length, text: text, dec: text };
  }
  function cnum(z, tiny) {
    var re = num(z.r, tiny), im = num(Math.abs(z.i), tiny);
    if (im === '0') return re;
    var sign = z.i < 0 ? '-' : '+';
    if (re === '0') return (z.i < 0 ? '-' : '') + (im === '1' ? '' : im) + 'i';
    return re + ' ' + sign + ' ' + (im === '1' ? '' : im) + 'i';
  }
  function fmtCMat(M, label, scale) {
    var tiny = Math.max(scale, 1) * 1e-13;
    var text = M.map(function (r) { return r.map(function (z) { return cnum(z, tiny); }); }); return { label: label, rows: M.length, cols: M[0].length, text: text, dec: text };
  }

  /* ---------- LU with partial pivoting: PA = LU ---------- */
  function lu(A) {
    var n = A.length, U = clone(A), L = zeros(n, n), perm = [], sign = 1, singular = false, i, j, k;
    for (i = 0; i < n; i++) perm.push(i);
    for (k = 0; k < n; k++) {
      var p = k, mx = Math.abs(U[k][k]);
      for (i = k + 1; i < n; i++) if (Math.abs(U[i][k]) > mx) { mx = Math.abs(U[i][k]); p = i; }
      if (mx === 0) { singular = true; continue; }
      if (p !== k) { var t = U[p]; U[p] = U[k]; U[k] = t; t = L[p]; L[p] = L[k]; L[k] = t; var q = perm[p]; perm[p] = perm[k]; perm[k] = q; sign = -sign; }
      for (i = k + 1; i < n; i++) { var f = U[i][k] / U[k][k]; L[i][k] = f; for (j = k; j < n; j++) U[i][j] -= f * U[k][j]; U[i][k] = 0; }
    }
    for (i = 0; i < n; i++) L[i][i] = 1;
    var P = zeros(n, n); for (i = 0; i < n; i++) P[i][perm[i]] = 1;
    var det = sign; for (i = 0; i < n; i++) det *= U[i][i];
    return { P: P, perm: perm, L: L, U: U, sign: sign, det: det, singular: singular || U.some(function (r, i) { return r[i] === 0; }) };
  }

  /* ---------- Householder QR: A = QR, Q m x m orthogonal, R m x n upper triangular, diag(R) >= 0 ---------- */
  function qr(A) {
    var m = A.length, n = A[0].length, R = clone(A), Q = eye(m), kmax = Math.min(m - 1, n), i, j, k;
    if (m <= n) kmax = m - 1;
    if (m > n) kmax = n;
    for (k = 0; k < kmax; k++) {
      var nx = 0; for (i = k; i < m; i++) nx += R[i][k] * R[i][k]; nx = Math.sqrt(nx);
      if (nx === 0) continue;
      var alpha = R[k][k] >= 0 ? -nx : nx, v = []; for (i = k; i < m; i++) v.push(R[i][k]); v[0] -= alpha;
      var vn = 0; v.forEach(function (x) { vn += x * x; }); vn = Math.sqrt(vn); if (vn === 0) continue; v = v.map(function (x) { return x / vn; });
      for (j = 0; j < n; j++) { var s = 0; for (i = k; i < m; i++) s += v[i - k] * R[i][j]; for (i = k; i < m; i++) R[i][j] -= 2 * v[i - k] * s; }
      for (i = 0; i < m; i++) { var t = 0; for (j = k; j < m; j++) t += Q[i][j] * v[j - k]; for (j = k; j < m; j++) Q[i][j] -= 2 * t * v[j - k]; }
    }
    for (i = 0; i < m; i++) for (j = 0; j < Math.min(i, n); j++) R[i][j] = 0;
    for (k = 0; k < Math.min(m, n); k++) if (R[k][k] < 0) { for (j = 0; j < n; j++) R[k][j] = -R[k][j] === 0 ? 0 : -R[k][j]; for (i = 0; i < m; i++) Q[i][k] = -Q[i][k] === 0 ? 0 : -Q[i][k]; }
    return { Q: Q, R: R };
  }

  /* ---------- Cholesky: A = L L^T for symmetric positive definite A ---------- */
  function cholesky(A) {
    var n = A.length, L = zeros(n, n), i, j, k, sc = Math.max(fro(A), 1), asym = 0;
    for (i = 0; i < n; i++) for (j = 0; j < i; j++) asym = Math.max(asym, Math.abs(A[i][j] - A[j][i]));
    if (asym > 1e-10 * sc) return { error: 'Cholesky needs a symmetric matrix, but A differs from its transpose by up to ' + sci(asym) + '.' };
    var dmx = 0; for (i = 0; i < n; i++) dmx = Math.max(dmx, Math.abs(A[i][i]));
    for (j = 0; j < n; j++) {
      var s = A[j][j]; for (k = 0; k < j; k++) s -= L[j][k] * L[j][k];
      if (!(s > 100 * n * EPS * dmx)) return { error: 'A is not positive definite: the pivot at row ' + (j + 1) + ' is ' + (s <= 0 ? num(s, 0) : sci(s)) + ' (it must be clearly greater than 0' + (s > 0 ? '; this is rounding-level, so A is singular or nearly singular' : '') + '), so no reliable Cholesky factor exists.', pivot: j + 1 };
      L[j][j] = Math.sqrt(s);
      for (i = j + 1; i < n; i++) { var t = A[i][j]; for (k = 0; k < j; k++) t -= L[i][k] * L[j][k]; L[i][j] = t / L[j][j]; }
    }
    return { L: L };
  }

  /* ---------- SVD by one-sided Jacobi: A = U diag(S) V^T (thin) ---------- */
  function svdTall(A) { // m >= n
    var m = A.length, n = A[0].length, U = clone(A), V = eye(n), i, p, q, sweep, rotated;
    for (sweep = 0; sweep < 80; sweep++) {
      rotated = false;
      for (p = 0; p < n - 1; p++) for (q = p + 1; q < n; q++) {
        var al = 0, be = 0, ga = 0;
        for (i = 0; i < m; i++) { al += U[i][p] * U[i][p]; be += U[i][q] * U[i][q]; ga += U[i][p] * U[i][q]; }
        if (ga === 0 || Math.abs(ga) <= 1e-15 * Math.sqrt(al * be)) continue;
        rotated = true;
        var z = (be - al) / (2 * ga), t = (z >= 0 ? 1 : -1) / (Math.abs(z) + Math.sqrt(1 + z * z)), c = 1 / Math.sqrt(1 + t * t), s = c * t;
        for (i = 0; i < m; i++) { var a = U[i][p], b = U[i][q]; U[i][p] = c * a - s * b; U[i][q] = s * a + c * b; }
        for (i = 0; i < n; i++) { var a2 = V[i][p], b2 = V[i][q]; V[i][p] = c * a2 - s * b2; V[i][q] = s * a2 + c * b2; }
      }
      if (!rotated) break;
    }
    var S = [], idx = [], j; for (j = 0; j < n; j++) { var nn = 0; for (i = 0; i < m; i++) nn += U[i][j] * U[i][j]; S.push(Math.sqrt(nn)); idx.push(j); }
    idx.sort(function (a, b) { return S[b] - S[a]; });
    var smax = S[idx[0]] || 0, tol = Math.max(m, n) * EPS * smax, Us = zeros(m, n), Vs = zeros(n, n), Ss = [];
    idx.forEach(function (o, k) { Ss.push(S[o]); for (i = 0; i < n; i++) Vs[i][k] = V[i][o]; if (S[o] > tol) { for (i = 0; i < m; i++) Us[i][k] = U[i][o] / S[o]; } else Ss[k] = S[o]; });
    /* complete U columns for zero singular values with an orthonormal basis */
    for (j = 0; j < n; j++) {
      if (Ss[j] > tol) continue;
      for (var e = 0; e < m; e++) {
        var v = new Array(m).fill(0); v[e] = 1;
        for (var pass = 0; pass < 2; pass++) for (var k2 = 0; k2 < n; k2++) { if (k2 === j) continue; var colk = col(Us, k2), nk = 0, d = 0; for (i = 0; i < m; i++) { nk += colk[i] * colk[i]; d += colk[i] * v[i]; } if (nk > 0.5) for (i = 0; i < m; i++) v[i] -= d * colk[i]; }
        var nv = 0; v.forEach(function (x) { nv += x * x; }); nv = Math.sqrt(nv);
        if (nv > 1e-8) { for (i = 0; i < m; i++) Us[i][j] = v[i] / nv; break; }
      }
    }
    return { U: Us, S: Ss, V: Vs, tol: tol };
  }
  function svd(A) {
    var m = A.length, n = A[0].length;
    if (m >= n) return svdTall(A);
    var r = svdTall(tr(A)); return { U: r.V, S: r.S, V: r.U, tol: r.tol };
  }

  /* ---------- symmetric eigenproblem: cyclic Jacobi ---------- */
  function eigSym(A) {
    var n = A.length, M = clone(A), V = eye(n), sweep, p, q, i;
    for (sweep = 0; sweep < 100; sweep++) {
      var off = 0; for (p = 0; p < n; p++) for (q = p + 1; q < n; q++) off += M[p][q] * M[p][q];
      var d = 0; for (p = 0; p < n; p++) d += M[p][p] * M[p][p];
      if (off <= 1e-34 * (d + off) || off === 0) break;
      for (p = 0; p < n - 1; p++) for (q = p + 1; q < n; q++) {
        if (M[p][q] === 0) continue;
        var th = (M[q][q] - M[p][p]) / (2 * M[p][q]), t = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
        var J = eye(n); J[p][p] = c; J[q][q] = c; J[p][q] = s; J[q][p] = -s;
        M = mul(tr(J), mul(M, J)); V = mul(V, J); M[p][q] = 0; M[q][p] = 0;
      }
    }
    var order = []; for (i = 0; i < n; i++) order.push(i);
    order.sort(function (a, b) { return M[b][b] - M[a][a]; });
    var vals = order.map(function (o) { return M[o][o]; }), W = zeros(n, n);
    order.forEach(function (o, k) {
      var big = 0; for (i = 0; i < n; i++) if (Math.abs(V[i][o]) > Math.abs(V[big][o]) + 1e-12) big = i;
      var sg = V[big][o] < 0 ? -1 : 1; for (i = 0; i < n; i++) W[i][k] = sg * V[i][o];
    });
    return { values: vals, vectors: W };
  }

  /* ---------- complex helpers (objects {r, i}) ---------- */
  function C(r, i) { return { r: r, i: i || 0 }; }
  function cadd(a, b) { return C(a.r + b.r, a.i + b.i); }
  function csub(a, b) { return C(a.r - b.r, a.i - b.i); }
  function cmul(a, b) { return C(a.r * b.r - a.i * b.i, a.r * b.i + a.i * b.r); }
  function cconj(a) { return C(a.r, -a.i); }
  function cabs(a) { return Math.hypot(a.r, a.i); }
  function cscale(a, s) { return C(a.r * s, a.i * s); }
  function cdiv(a, b) { var d = b.r * b.r + b.i * b.i; return C((a.r * b.r + a.i * b.i) / d, (a.i * b.r - a.r * b.i) / d); }
  function csqrt(a) { var m = cabs(a); if (m === 0) return C(0, 0); var r = Math.sqrt((m + a.r) / 2), i = Math.sqrt(Math.max(0, (m - a.r) / 2)); return C(r, a.i < 0 ? -i : i); }
  function cmat(A) { return A.map(function (r) { return r.map(function (v) { return C(v, 0); }); }); }
  function ceye(n) { return eye(n).map(function (r) { return r.map(function (v) { return C(v, 0); }); }); }
  function cmmul(A, B) { var m = A.length, k = B.length, n = B[0].length, R = [], i, j, p; for (i = 0; i < m; i++) { R.push([]); for (j = 0; j < n; j++) { var s = C(0, 0); for (p = 0; p < k; p++) s = cadd(s, cmul(A[i][p], B[p][j])); R[i].push(s); } } return R; }
  function cherm(A) { var m = A.length, n = A[0].length, T = []; for (var j = 0; j < n; j++) { T.push([]); for (var i = 0; i < m; i++) T[j].push(cconj(A[i][j])); } return T; }
  function cfro(A) { var s = 0; A.forEach(function (r) { r.forEach(function (z) { s += z.r * z.r + z.i * z.i; }); }); return Math.sqrt(s); }
  function csubm(A, B) { return A.map(function (r, i) { return r.map(function (z, j) { return csub(z, B[i][j]); }); }); }

  /* ---------- complex Schur decomposition: A = Q T Q^H, T upper triangular ---------- */
  function schur(A) {
    var n = A.length, H = cmat(A), Q = ceye(n), i, j, k;
    /* Hessenberg reduction by Householder reflectors */
    for (k = 0; k < n - 2; k++) {
      var x = [], nx = 0; for (i = k + 1; i < n; i++) { x.push(H[i][k]); nx += H[i][k].r * H[i][k].r + H[i][k].i * H[i][k].i; } nx = Math.sqrt(nx);
      var tailz = true; for (i = 1; i < x.length; i++) if (cabs(x[i]) > 0) tailz = false;
      if (nx === 0 || tailz) continue;
      var a0 = cabs(x[0]), ph = a0 > 0 ? cscale(x[0], 1 / a0) : C(1, 0), alpha = cscale(ph, -nx), v = x.slice(); v[0] = csub(v[0], alpha);
      var vn = 0; v.forEach(function (z) { vn += z.r * z.r + z.i * z.i; }); vn = Math.sqrt(vn); if (vn === 0) continue; v = v.map(function (z) { return cscale(z, 1 / vn); });
      for (j = 0; j < n; j++) { var s = C(0, 0); for (i = 0; i < v.length; i++) s = cadd(s, cmul(cconj(v[i]), H[k + 1 + i][j])); for (i = 0; i < v.length; i++) H[k + 1 + i][j] = csub(H[k + 1 + i][j], cscale(cmul(v[i], s), 2)); }
      for (i = 0; i < n; i++) { var s2 = C(0, 0); for (j = 0; j < v.length; j++) s2 = cadd(s2, cmul(H[i][k + 1 + j], v[j])); for (j = 0; j < v.length; j++) H[i][k + 1 + j] = csub(H[i][k + 1 + j], cscale(cmul(s2, cconj(v[j])), 2)); }
      for (i = 0; i < n; i++) { var s3 = C(0, 0); for (j = 0; j < v.length; j++) s3 = cadd(s3, cmul(Q[i][k + 1 + j], v[j])); for (j = 0; j < v.length; j++) Q[i][k + 1 + j] = csub(Q[i][k + 1 + j], cscale(cmul(s3, cconj(v[j])), 2)); }
      for (i = k + 2; i < n; i++) H[i][k] = C(0, 0);
    }
    var hi = n - 1, iter = 0, total = 0;
    while (hi > 0) {
      var l = hi;
      while (l > 0) { var sc = cabs(H[l][l]) + cabs(H[l - 1][l - 1]); if (sc === 0) sc = 1; if (cabs(H[l][l - 1]) < EPS * sc) { H[l][l - 1] = C(0, 0); break; } l--; }
      if (l === hi) { hi--; iter = 0; continue; }
      if (++total > 400 * n) return { error: 'The QR iteration did not converge.' };
      iter++;
      var a = H[hi - 1][hi - 1], b = H[hi - 1][hi], c = H[hi][hi - 1], d = H[hi][hi], mu;
      var half = cscale(csub(a, d), 0.5), disc = csqrt(cadd(cmul(half, half), cmul(b, c))), mid = cscale(cadd(a, d), 0.5), e1 = cadd(mid, disc), e2 = csub(mid, disc);
      mu = cabs(csub(e1, d)) < cabs(csub(e2, d)) ? e1 : e2;
      if (iter % 11 === 10) mu = cadd(mu, C(cabs(H[hi][hi - 1]) + (hi > 1 ? cabs(H[hi - 1][hi - 2]) : 0), 0));
      var B = []; for (i = l; i <= hi; i++) { B.push([]); for (j = l; j <= hi; j++) B[i - l].push(i === j ? csub(H[i][j], mu) : H[i][j]); }
      var rots = [], m = hi - l + 1;
      for (k = 0; k < m - 1; k++) {
        var ba = B[k][k], bb = B[k + 1][k], r = Math.hypot(cabs(ba), cabs(bb)), cc, ss;
        if (r === 0) { cc = C(1, 0); ss = C(0, 0); } else { cc = cscale(ba, 1 / r); ss = cscale(bb, 1 / r); }
        rots.push([cc, ss]);
        for (j = k; j < m; j++) { var x1 = B[k][j], x2 = B[k + 1][j]; B[k][j] = cadd(cmul(cconj(cc), x1), cmul(cconj(ss), x2)); B[k + 1][j] = csub(cmul(cc, x2), cmul(ss, x1)); }
      }
      for (k = 0; k < m - 1; k++) {
        var rc = rots[k][0], rs = rots[k][1], p0 = l + k, p1 = l + k + 1;
        for (j = 0; j < n; j++) { var y1 = H[p0][j], y2 = H[p1][j]; H[p0][j] = cadd(cmul(cconj(rc), y1), cmul(cconj(rs), y2)); H[p1][j] = csub(cmul(rc, y2), cmul(rs, y1)); }
        for (i = 0; i < n; i++) { var z1 = H[i][p0], z2 = H[i][p1]; H[i][p0] = cadd(cmul(z1, rc), cmul(z2, rs)); H[i][p1] = csub(cmul(z2, cconj(rc)), cmul(z1, cconj(rs))); }
        for (i = 0; i < n; i++) { var q1 = Q[i][p0], q2 = Q[i][p1]; Q[i][p0] = cadd(cmul(q1, rc), cmul(q2, rs)); Q[i][p1] = csub(cmul(q2, cconj(rc)), cmul(q1, cconj(rs))); }
      }
    }
    for (i = 0; i < n; i++) for (j = 0; j < i; j++) H[i][j] = C(0, 0);
    return { T: H, Q: Q };
  }

  /* eigenvectors of A from its Schur form: back-substitution on T, then multiply by Q */
  function eigGeneral(A) {
    var n = A.length, S = schur(A); if (S.error) return S;
    var T = S.T, Q = S.Q, vals = [], i, j, k, tn = cfro(T), small = Math.max(tn * EPS, 1e-150), V = [];
    for (i = 0; i < n; i++) vals.push(T[i][i]);
    for (k = 0; k < n; k++) {
      var x = new Array(n).fill(null).map(function () { return C(0, 0); }); x[k] = C(1, 0);
      for (i = k - 1; i >= 0; i--) {
        var s = C(0, 0); for (j = i + 1; j <= k; j++) s = cadd(s, cmul(T[i][j], x[j]));
        var dn = csub(T[i][i], T[k][k]); if (cabs(dn) < small) dn = C(small, 0);
        x[i] = cscale(cdiv(s, dn), -1);
      }
      var v = []; for (i = 0; i < n; i++) { var t = C(0, 0); for (j = 0; j <= k; j++) t = cadd(t, cmul(Q[i][j], x[j])); v.push(t); }
      var nv = 0; v.forEach(function (z) { nv += z.r * z.r + z.i * z.i; }); nv = Math.sqrt(nv); v = v.map(function (z) { return cscale(z, 1 / nv); });
      var big = 0; for (i = 1; i < n; i++) if (cabs(v[i]) > cabs(v[big]) * (1 + 1e-9)) big = i;
      var ph = cscale(cconj(v[big]), 1 / cabs(v[big])); v = v.map(function (z) { return cmul(z, ph); });
      V.push(v);
    }
    return { values: vals, vectors: V, T: T, Q: Q }; // vectors[k] = k-th eigenvector (array of n complex numbers)
  }

  /* ---------- result builders ---------- */
  function verdict(res, n) { var lim = 1e3 * Math.max(n, 1) * EPS; return res <= lim ? 'pass' : res <= 1e5 * Math.max(n, 1) * EPS ? 'reduced' : 'fail'; }
  function chk(label, value, n, extra) { return { label: label, value: value, text: sci(value), state: verdict(value, n), extra: extra || '' }; }
  function overall(checks) { var w = 'pass'; checks.forEach(function (c) { if (c.state === 'fail') w = 'fail'; else if (c.state === 'reduced' && w !== 'fail') w = 'reduced'; }); return w; }
  function statusText(w) { return w === 'pass' ? 'All checks passed' : w === 'reduced' ? 'Reduced accuracy (ill-conditioned input)' : 'Checks failed: treat the result with caution'; }
  function cond2(S) { var mx = S[0], mn = S[S.length - 1]; return mn > 0 && mx / mn < 1e300 ? mx / mn : Infinity; }
  function condText(c) { return isFinite(c) ? (c >= 1e6 ? c.toExponential(3).replace('e+', 'e') : String(parseFloat(c.toPrecision(5)))) : 'infinite (singular)'; }

  function doLU(A) {
    var n = A.length; if (A[0].length !== n) return { ok: false, error: 'LU decomposition here needs a square matrix. A is ' + n + ' × ' + A[0].length + '.' };
    var r = lu(A), PA = mul(r.P, A), LU = mul(r.L, r.U), nA = Math.max(fro(A), 1e-300);
    var checks = [chk('‖PA − LU‖ / ‖A‖', fro(sub(PA, LU)) / nA, n)];
    var lines = ['det(A) = ' + num(r.det, 0) + (r.singular ? '  (a zero pivot: A is singular)' : ''), 'Row permutation (P): ' + r.perm.map(function (p) { return p + 1; }).join(', ') + '  (' + (r.sign > 0 ? 'even' : 'odd') + ' number of swaps)'];
    var steps = ['Find the largest entry in column k on or below the diagonal and swap that row up (partial pivoting). This keeps every multiplier between −1 and 1.', 'Subtract multiplier × pivot row from each row below to make zeros under the pivot. The multipliers fill L; the reduced matrix is U.', 'Every swap is recorded in P, so PA = LU. det(A) = (−1)^swaps × the product of the diagonal of U.', 'To solve AX = B: solve LY = PB by forward substitution, then UX = Y by back substitution.', 'Checked: the largest relative error in PA − LU is shown below. A value near 1e-16 means the factors are correct to machine precision.'];
    return { ok: true, title: 'LU decomposition with partial pivoting (PA = LU)', mats: [fmtMat(r.P, 'P (permutation)'), fmtMat(r.L, 'L (unit lower triangular)'), fmtMat(r.U, 'U (upper triangular)')], lines: lines, checks: checks, status: statusText(overall(checks)), steps: steps, capped: false, copy: [['P', r.P], ['L', r.L], ['U', r.U]] };
  }
  function doQR(A) {
    var m = A.length, n = A[0].length, r = qr(A), QR = mul(r.Q, r.R), nA = Math.max(fro(A), 1e-300), I = eye(m);
    var checks = [chk('‖A − QR‖ / ‖A‖', fro(sub(A, QR)) / nA, Math.max(m, n)), chk('‖QᵀQ − I‖', fro(sub(mul(tr(r.Q), r.Q), I)), m)];
    var rk = 0, rt = Math.max(m, n) * EPS * Math.max.apply(null, r.R.map(function (row, i) { return Math.abs(row[i] === undefined ? 0 : row[i]); }).concat([0]));
    for (var i = 0; i < Math.min(m, n); i++) if (Math.abs(r.R[i][i]) > rt) rk++;
    var steps = ['For each column k, build a Householder reflector H = I − 2vvᵀ that turns the part of column k on and below the diagonal into a multiple of e₁. Apply it to R and accumulate it into Q.', 'After the last column, R is upper triangular and Q = H₁H₂… is orthogonal, so A = QR.', 'Signs are chosen so the diagonal of R is not negative. For a matrix with full column rank this QR is then unique.', 'Householder reflectors are used instead of Gram-Schmidt because they keep Q orthogonal to machine precision even for nearly dependent columns.', 'Checked: reconstruction ‖A − QR‖ and orthogonality ‖QᵀQ − I‖.'];
    return { ok: true, title: 'QR decomposition (Householder)', mats: [fmtMat(r.Q, 'Q (orthogonal, ' + m + ' × ' + m + ')'), fmtMat(r.R, 'R (upper triangular, ' + m + ' × ' + n + ')')], lines: ['Numerical rank from R: ' + rk], checks: checks, status: statusText(overall(checks)), steps: steps, capped: false, copy: [['Q', r.Q], ['R', r.R]] };
  }
  function doChol(A) {
    var n = A.length; if (A[0].length !== n) return { ok: false, error: 'Cholesky needs a square, symmetric positive definite matrix. A is ' + n + ' × ' + A[0].length + '.' };
    var r = cholesky(A); if (r.error) return { ok: false, error: r.error };
    var nA = Math.max(fro(A), 1e-300), dmax = 0, dmin = Infinity; for (var i = 0; i < n; i++) { dmax = Math.max(dmax, r.L[i][i]); dmin = Math.min(dmin, r.L[i][i]); }
    var checks = [chk('‖A − LLᵀ‖ / ‖A‖', fro(sub(A, mul(r.L, tr(r.L)))) / nA, n)], det = 1; for (i = 0; i < n; i++) det *= r.L[i][i] * r.L[i][i];
    var steps = ['A must be symmetric (A = Aᵀ) and positive definite (xᵀAx > 0 for every x ≠ 0). The calculator tests symmetry first.', 'Row by row: L[j][j] = √(A[j][j] − Σ L[j][k]²), then L[i][j] = (A[i][j] − Σ L[i][k]L[j][k]) / L[j][j] for i > j.', 'If any value under the square root is zero or negative, A is not positive definite and no real factor exists. That is how the test is done, with no extra work.', 'Cholesky needs about half the work of LU and needs no pivoting. det(A) = (product of the diagonal of L)².', 'Checked: ‖A − LLᵀ‖ relative to ‖A‖.'];
    return { ok: true, title: 'Cholesky decomposition (A = LLᵀ)', mats: [fmtMat(r.L, 'L (lower triangular)'), fmtMat(tr(r.L), 'Lᵀ')], lines: ['A is symmetric positive definite.', 'det(A) = ' + num(det, 0)], checks: checks, status: statusText(overall(checks)), steps: steps, capped: false, copy: [['L', r.L]] };
  }
  function svdChecks(A, r) {
    var m = A.length, n = A[0].length, k = r.S.length, Sg = zeros(k, k), i; for (i = 0; i < k; i++) Sg[i][i] = r.S[i];
    var nA = Math.max(fro(A), 1e-300), rec = mul(r.U, mul(Sg, tr(r.V)));
    return [chk('‖A − UΣVᵀ‖ / ‖A‖', fro(sub(A, rec)) / nA, Math.max(m, n)), chk('‖UᵀU − I‖', fro(sub(mul(tr(r.U), r.U), eye(k))), Math.max(m, n)), chk('‖VᵀV − I‖', fro(sub(mul(tr(r.V), r.V), eye(k))), Math.max(m, n))];
  }
  function doSVD(A) {
    var m = A.length, n = A[0].length, r = svd(A), k = r.S.length, Sg = zeros(k, k), i, rk = 0;
    for (i = 0; i < k; i++) { Sg[i][i] = r.S[i]; if (r.S[i] > r.tol) rk++; }
    var checks = svdChecks(A, r), cn = cond2(r.S);
    var steps = ['One-sided Jacobi: rotate pairs of columns of A until all columns are mutually orthogonal. The column lengths are the singular values σ.', 'Divide each column by its length to get U. The accumulated rotations form V, so A = UΣVᵀ with σ₁ ≥ σ₂ ≥ … ≥ 0.', 'This works on A directly. It never forms AᵀA, which would square the condition number and lose half the digits of the small singular values.', 'Rank = number of σ above max(m, n) × machine epsilon × σ₁. The 2-norm condition number is σ₁ / σ min.', 'Checked: reconstruction and orthogonality of U and V. This is the thin SVD: U is ' + m + ' × ' + k + ', Σ is ' + k + ' × ' + k + ', V is ' + n + ' × ' + k + '.'];
    return { ok: true, title: 'Singular value decomposition (A = UΣVᵀ)', mats: [fmtMat(r.U, 'U (' + m + ' × ' + k + ')'), fmtMat(Sg, 'Σ (singular values)'), fmtMat(r.V, 'V (' + n + ' × ' + k + ')')], lines: ['Singular values: ' + r.S.map(function (s) { return num(s, 1e-13 * Math.max(r.S[0], 1)); }).join(', '), 'Rank: ' + rk + '    2-norm: ' + num(r.S[0], 0) + '    Condition number: ' + condText(cn)], checks: checks, status: statusText(overall(checks)), steps: steps, capped: false, copy: [['U', r.U], ['S', Sg], ['V', r.V]] };
  }
  function symmetric(A) { var n = A.length, a = 0, i, j; if (A[0].length !== n) return false; for (i = 0; i < n; i++) for (j = 0; j < i; j++) a = Math.max(a, Math.abs(A[i][j] - A[j][i])); return a <= 1e-12 * Math.max(fro(A), 1); }
  function pairResidual(A, lam, v) { var n = A.length, s = 0, i, j; for (i = 0; i < n; i++) { var t = C(0, 0); for (j = 0; j < n; j++) t = cadd(t, cscale(v[j], A[i][j])); t = csub(t, cmul(lam, v[i])); s += t.r * t.r + t.i * t.i; } return Math.sqrt(s); }
  function doEig(A) {
    var n = A.length; if (A[0].length !== n) return { ok: false, error: 'Eigenvalues need a square matrix. A is ' + n + ' × ' + A[0].length + '.' };
    var nA = Math.max(fro(A), 1e-300), sym = symmetric(A), vals, vecs, i, j, lines = [], checks = [], mats = [], copy = [];
    if (sym) {
      var r = eigSym(A); vals = r.values.map(function (x) { return C(x, 0); }); vecs = []; for (j = 0; j < n; j++) vecs.push(col(r.vectors, j).map(function (x) { return C(x, 0); }));
      var Lm = zeros(n, n); for (i = 0; i < n; i++) Lm[i][i] = r.values[i];
      checks.push(chk('‖A − VΛVᵀ‖ / ‖A‖', fro(sub(A, mul(r.vectors, mul(Lm, tr(r.vectors))))) / nA, n), chk('‖VᵀV − I‖', fro(sub(mul(tr(r.vectors), r.vectors), eye(n))), n));
      mats = [fmtMat(Lm, 'Λ (eigenvalues on the diagonal)'), fmtMat(r.vectors, 'V (eigenvectors in columns)')]; copy = [['Lambda', Lm], ['V', r.vectors]];
      var pos = r.values.every(function (x) { return x > 1e-12 * nA; }), neg = r.values.every(function (x) { return x < -1e-12 * nA; }), psd = r.values.every(function (x) { return x >= -1e-12 * nA; });
      lines.push('A is symmetric, so all eigenvalues are real and the eigenvectors are orthonormal: A = VΛVᵀ.');
      lines.push('Definiteness: ' + (pos ? 'positive definite' : neg ? 'negative definite' : psd ? 'positive semidefinite' : 'indefinite') + '.');
    } else {
      var g = eigGeneral(A); if (g.error) return { ok: false, error: g.error };
      vals = g.values; vecs = g.vectors; var scale = nA, cplx = vals.some(function (z) { return Math.abs(z.i) > 1e-10 * Math.max(scale, 1); });
      vals = vals.map(function (z) { return Math.abs(z.i) <= 1e-12 * Math.max(scale, 1) ? C(z.r, 0) : z; });
      var order = vals.map(function (_, k) { return k; }); order.sort(function (a, b) { return cabs(vals[b]) - cabs(vals[a]) || vals[b].r - vals[a].r || vals[b].i - vals[a].i; });
      vals = order.map(function (o) { return vals[o]; }); vecs = order.map(function (o) { return vecs[o]; });
      vecs = vecs.map(function (v, k) { if (vals[k].i === 0) { var mi = 0; v.forEach(function (z) { mi = Math.max(mi, Math.abs(z.i)); }); if (mi < 1e-9) { var w = v.map(function (z) { return C(z.r, 0); }), nw = 0; w.forEach(function (z) { nw += z.r * z.r; }); nw = Math.sqrt(nw); w = w.map(function (z) { return C(z.r / nw, 0); }); var bg = 0; w.forEach(function (z, t) { if (Math.abs(z.r) > Math.abs(w[bg].r) + 1e-12) bg = t; }); return w[bg].r < 0 ? w.map(function (z) { return C(-z.r, 0); }) : w; } } return v; });
      var Lc = []; for (i = 0; i < n; i++) { Lc.push([]); for (j = 0; j < n; j++) Lc[i].push(i === j ? vals[i] : C(0, 0)); }
      var Vm = []; for (i = 0; i < n; i++) { Vm.push([]); for (j = 0; j < n; j++) Vm[i].push(vecs[j][i]); }
      mats = [fmtCMat(Lc, 'Λ (eigenvalues on the diagonal)', nA), fmtCMat(Vm, 'V (unit eigenvectors in columns)', 1)];
      var re = function (M) { return M.map(function (r) { return r.map(function (z) { return z.r; }); }); }; if (!cplx) copy = [['Lambda', re(Lc)], ['V', re(Vm)]];
      var tsum = C(0, 0); vals.forEach(function (z) { tsum = cadd(tsum, z); }); var tA = 0; for (i = 0; i < n; i++) tA += A[i][i];
      checks.push(chk('|Σλ − trace(A)| / ‖A‖', cabs(csub(tsum, C(tA, 0))) / nA, n));
      lines.push(cplx ? 'A is not symmetric and has complex eigenvalues. They come in conjugate pairs because A is real.' : 'A is not symmetric. All eigenvalues are real.');
      var dup = []; for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) if (cabs(csub(vals[i], vals[j])) < 1e-6 * Math.max(cabs(vals[i]), 1)) { var dt = C(0, 0); for (var q = 0; q < n; q++) dt = cadd(dt, cmul(cconj(vecs[i][q]), vecs[j][q])); if (cabs(dt) > 1 - 1e-6) dup.push(i + 1 + ' and ' + (j + 1)); }
      if (dup.length) lines.push('Warning: eigenvalues ' + dup.join('; ') + ' repeat and their eigenvectors point the same way. A is defective (it has a Jordan block), so it cannot be diagonalised and V is singular.');
    }
    var worst = 0, resList = []; for (i = 0; i < n; i++) { var rr = pairResidual(A, vals[i], vecs[i]) / nA; worst = Math.max(worst, rr); resList.push(rr); }
    checks.push(chk('max ‖Av − λv‖ / ‖A‖ over all eigenpairs', worst, n));
    var evl = vals.map(function (z, k) { return 'λ' + (k + 1) + ' = ' + cnum(z, 1e-13 * Math.max(nA, 1)) + '   (residual ' + sci(resList[k]) + ')'; });
    var steps = sym ? ['A is symmetric. Cyclic Jacobi rotations zero one off-diagonal pair at a time, each rotation chosen to make that entry exactly zero. The product of the rotations is the eigenvector matrix V.', 'The off-diagonal size shrinks quadratically until it is below machine precision. The diagonal that remains holds the eigenvalues, sorted largest first.', 'Because every step is an orthogonal rotation, V is orthogonal and the eigenvalues are real and accurate to about machine precision.', 'Checked: reconstruction ‖A − VΛVᵀ‖, orthogonality of V, and the residual ‖Av − λv‖ of every eigenpair.']
      : ['Reduce A to upper Hessenberg form with Householder reflectors. This makes each QR step cheap.', 'Run QR iterations with a Wilkinson shift in complex arithmetic. Each step is a unitary similarity, so the eigenvalues never change, and the subdiagonal is deflated to zero as it becomes negligible. The result is the Schur form A = QTQᴴ with T upper triangular.', 'The eigenvalues are the diagonal of T. Each eigenvector comes from back-substitution on T (solve (T − λI)x = 0) followed by multiplication by Q, then scaled to length 1.', 'Checked: the residual ‖Av − λv‖ / ‖A‖ of every pair, and that the eigenvalues add up to the trace. A small residual proves the pair is correct, whatever method produced it.'];
    lines = evl.concat(lines);
    return { ok: true, title: sym ? 'Eigenvalue decomposition (symmetric: A = VΛVᵀ)' : 'Eigenvalues and eigenvectors (Av = λv)', mats: mats, lines: lines, checks: checks, status: statusText(overall(checks)), steps: steps, capped: false, copy: copy };
  }
  function doSchur(A) {
    var n = A.length; if (A[0].length !== n) return { ok: false, error: 'Schur decomposition needs a square matrix. A is ' + n + ' × ' + A[0].length + '.' };
    var s = schur(A); if (s.error) return { ok: false, error: s.error };
    var nA = Math.max(fro(A), 1e-300), Ac = cmat(A), rec = cmmul(s.Q, cmmul(s.T, cherm(s.Q))), lower = 0, i, j;
    for (i = 0; i < n; i++) for (j = 0; j < i; j++) lower = Math.max(lower, cabs(s.T[i][j]));
    var checks = [chk('‖A − QTQᴴ‖ / ‖A‖', cfro(csubm(Ac, rec)) / nA, n), chk('‖QᴴQ − I‖', cfro(csubm(cmmul(cherm(s.Q), s.Q), ceye(n))), n)];
    var cplx = s.T.some(function (r) { return r.some(function (z) { return Math.abs(z.i) > 1e-10 * nA; }); }) || s.Q.some(function (r) { return r.some(function (z) { return Math.abs(z.i) > 1e-10; }); });
    var steps = ['Every square matrix has a Schur decomposition A = QTQᴴ with Q unitary and T upper triangular. The eigenvalues of A are the diagonal of T, in the order the iteration found them.', 'The calculator reduces A to Hessenberg form, then applies shifted QR iterations in complex arithmetic until the subdiagonal is zero.', cplx ? 'This A has complex eigenvalues, so Q and T have complex entries. (A real Schur form would use 2 × 2 blocks instead.)' : 'All eigenvalues of this A are real, so Q and T are real.', 'Checked: ‖A − QTQᴴ‖ and the unitarity of Q. The part of T below the diagonal is set to exactly 0 (it was below ' + sci(lower) + ' before that).'];
    return { ok: true, title: 'Schur decomposition (A = QTQᴴ)', mats: [fmtCMat(s.Q, 'Q (unitary)', 1), fmtCMat(s.T, 'T (upper triangular)', nA)], lines: ['Eigenvalues (diagonal of T): ' + s.T.map(function (r, k) { return cnum(r[k], 1e-13 * Math.max(nA, 1)); }).join(', ')], checks: checks, status: statusText(overall(checks)), steps: steps, capped: false, copy: [] };
  }
  function pinv(A) { var r = svd(A), m = A.length, n = A[0].length, k = r.S.length, X = zeros(n, m), i, j, t; for (t = 0; t < k; t++) { if (r.S[t] <= r.tol) continue; for (i = 0; i < n; i++) for (j = 0; j < m; j++) X[i][j] += r.V[i][t] * r.U[j][t] / r.S[t]; } return { X: X, svd: r }; }
  function doPinv(A) {
    var m = A.length, n = A[0].length, p = pinv(A), X = p.X, nA = Math.max(fro(A), 1e-300), AXA = mul(A, mul(X, A)), XAX = mul(X, mul(A, X)), nX = Math.max(fro(X), 1e-300);
    var cn = cond2(p.svd.S), nn = Math.max(m, n) * Math.max(1, Math.min(cn, 1e16));
    var checks = [chk('‖AA⁺A − A‖ / ‖A‖', fro(sub(AXA, A)) / nA, nn), chk('‖A⁺AA⁺ − A⁺‖ / ‖A⁺‖', fro(sub(XAX, X)) / nX, nn), chk('‖AA⁺ − (AA⁺)ᵀ‖', fro(sub(mul(A, X), tr(mul(A, X)))), nn), chk('‖A⁺A − (A⁺A)ᵀ‖', fro(sub(mul(X, A), tr(mul(X, A)))), nn)];
    var pw = overall(checks); if (pw === 'pass' && cn > 1e8) pw = 'reduced';
    var steps = ['Take the SVD A = UΣVᵀ. The pseudo-inverse is A⁺ = VΣ⁺Uᵀ, where Σ⁺ inverts every singular value above the rank tolerance and leaves the rest at 0.', 'For a square invertible A this is the ordinary inverse. For a tall full-rank A it gives the least-squares solver (AᵀA)⁻¹Aᵀ, and for a wide full-rank A the minimum-norm solver.', 'Checked: the four Moore-Penrose conditions AA⁺A = A, A⁺AA⁺ = A⁺, and that AA⁺ and A⁺A are symmetric. A⁺ is the only matrix satisfying all four.'];
    return { ok: true, title: 'Pseudo-inverse (Moore-Penrose, via SVD)', mats: [fmtMat(X, 'A⁺ (' + n + ' × ' + m + ')')], lines: ['Rank ' + p.svd.S.filter(function (s) { return s > p.svd.tol; }).length + '    Condition number ' + condText(cn) + (cn > 1e8 ? '  (ill-conditioned: expect fewer correct digits in A⁺)' : '')], checks: checks, status: statusText(pw), steps: steps, capped: false, copy: [['A+', X]] };
  }
  function doLstsq(A, B) {
    var m = A.length, n = A[0].length; if (B.length !== m) return { ok: false, error: 'Least squares needs B to have one row per row of A: A has ' + m + ' rows and B has ' + B.length + '.' };
    var nrhs = B[0].length, q = qr(A), mn = Math.min(m, n), full = m >= n, i, j, k;
    for (i = 0; i < mn; i++) if (Math.abs(q.R[i][i]) <= Math.max(m, n) * EPS * Math.max(Math.abs(q.R[0][0]), 1e-300)) full = false;
    var X, method;
    if (full) { method = 'QR'; var QtB = mul(tr(q.Q), B); X = zeros(n, nrhs); for (k = 0; k < nrhs; k++) for (i = n - 1; i >= 0; i--) { var s = QtB[i][k]; for (j = i + 1; j < n; j++) s -= q.R[i][j] * X[j][k]; X[i][k] = s / q.R[i][i]; } }
    else { method = 'SVD'; X = mul(pinv(A).X, B); }
    var Res = sub(B, mul(A, X)), nB = Math.max(fro(B), 1e-300), g = mul(tr(A), Res), checks = [chk('‖Aᵀ(B − AX)‖ / (‖A‖‖B‖)', fro(g) / (Math.max(fro(A), 1e-300) * nB), Math.max(m, n))];
    var lines = ['Method used: ' + (method === 'QR' ? 'QR (A has full column rank)' : 'SVD minimum-norm solution (A is rank deficient or has more columns than rows)'), 'Residual norm ‖B − AX‖ = ' + num(fro(Res), 0) + (fro(Res) <= 1e-12 * nB ? '  (the system is consistent: AX = B holds exactly to rounding)' : '  (no exact solution: this X minimises the error)')];
    var steps = ['Least squares finds the X that makes ‖AX − B‖ smallest. If AX = B has an exact solution, least squares finds it.', method === 'QR' ? 'Factor A = QR (Householder). Then ‖AX − B‖ = ‖RX − QᵀB‖ because Q is orthogonal. Solve the top n rows RX = (QᵀB) by back substitution. The remaining rows are the unavoidable error.' : 'A does not have full column rank, so there are many least-squares solutions. The SVD pseudo-inverse picks the one with the smallest ‖X‖: X = A⁺B.', 'This avoids the normal equations AᵀAX = AᵀB, which square the condition number and can lose half the significant digits.', 'Checked: at the optimum the residual is orthogonal to the columns of A, so Aᵀ(B − AX) must be 0.'];
    return { ok: true, title: 'Least-squares solution of AX ≈ B', mats: [fmtMat(X, 'X (' + n + ' × ' + nrhs + ')'), fmtMat(Res, 'Residual B − AX')], lines: lines, checks: checks, status: statusText(overall(checks)), steps: steps, capped: false, copy: [['X', X]] };
  }
  function doCond(A) {
    var m = A.length, n = A[0].length, r = svd(A), c = cond2(r.S), checks = svdChecks(A, r), k = r.S.length;
    var lines = ['2-norm condition number κ₂ = σ₁ / σ' + k + ' = ' + condText(c), 'Largest singular value σ₁ = ' + num(r.S[0], 0) + '    Smallest σ' + k + ' = ' + num(r.S[k - 1], 1e-300)];
    if (isFinite(c)) lines.push('Rule of thumb: solving AX = B can lose about ' + Math.max(0, Math.round(Math.log10(c))) + ' of the 16 digits of double precision.'); else lines.push('A is singular (rank below ' + Math.min(m, n) + '): AX = B has no unique solution.');
    return { ok: true, title: 'Condition number of A', lines: lines, checks: checks, status: statusText(overall(checks)), steps: ['The 2-norm condition number is the ratio of the largest to the smallest singular value of A. It measures how much a relative error in B or A can be magnified in the solution of AX = B.', 'κ₂ = 1 for an orthogonal matrix, and grows without bound as A approaches a singular matrix.', 'It is found from the SVD, so it is correct for rectangular matrices too (for those it is the ratio over the nonzero spectrum of the thin SVD).', 'Unlike the determinant, κ₂ does not depend on the scale of A. A matrix with det = 1e-20 can be perfectly conditioned, and one with det = 1 can be nearly singular.'], capped: false, copy: [] };
  }
  var OPS = { lu: 'LU', qr: 'QR', chol: 'Cholesky', svd: 'SVD', eig: 'Eigen', schur: 'Schur', lstsq: 'Least squares', pinv: 'Pseudo-inverse', cond: 'Condition number' };
  function calc(o) {
    if (!OPS[o.op]) return { ok: false, error: 'Unknown operation.' };
    var a = parseGrid('A', o.A); if (a.error) return { ok: false, error: a.error, cell: a.cell };
    var B = null; if (o.op === 'lstsq') { var b = parseGrid('B', o.B); if (b.error) return { ok: false, error: b.error, cell: b.cell }; B = b.M; }
    var A = a.M; if (A.length > 8 || A[0].length > 8) return { ok: false, error: 'Matrices are limited to 8 × 8.' };
    return { lu: doLU, qr: doQR, chol: doChol, svd: doSVD, eig: doEig, schur: doSchur, pinv: doPinv, cond: doCond }[o.op] ? { lu: doLU, qr: doQR, chol: doChol, svd: doSVD, eig: doEig, schur: doSchur, pinv: doPinv, cond: doCond }[o.op](A) : doLstsq(A, B);
  }
  var api = { calc: calc, OPS: OPS, lu: lu, qr: qr, cholesky: cholesky, svd: svd, eigSym: eigSym, eigGeneral: eigGeneral, schur: schur, pinv: pinv, parseCell: parseCell };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MatrixDecomp = api;
})(typeof self !== 'undefined' ? self : this);
