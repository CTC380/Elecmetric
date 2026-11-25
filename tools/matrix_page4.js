/* Builds calculators/matrix-calculator/index.html for Modes 01 to 04 from the Mode 03 page.
   Takes the existing built page as its shell (the converter shell file is not needed), swaps in both engines and the client,
   and adds the Mode 04 menu entries, example buttons, size rules, FAQ entries and SEO text.
   Run:  node tools/matrix_page4.js            (reads calculators/matrix-calculator/index.html, writes it back)
   Run it on the Mode 03 page only: it refuses to patch a page that already contains Mode 04. */
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
const file = path.join(root, 'calculators/matrix-calculator/index.html');
let h = fs.readFileSync(file, 'utf8');
if (h.includes('data-mode04')) throw new Error('This page already contains Mode 04. Restore the Mode 03 page first.');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rep = (from, to, all) => { if (!h.includes(from)) throw new Error('not found: ' + from.slice(0, 70)); h = all ? h.split(from).join(to) : h.replace(from, () => to); };

/* 1. operation menu */
const ops4 = [['lu', 'LU decomposition  (PA = LU)'], ['qr', 'QR decomposition  (A = QR)'], ['chol', 'Cholesky  (A = LLᵀ, symmetric positive definite)'], ['svd', 'SVD  (A = UΣVᵀ)'], ['eig', 'Eigenvalues and eigenvectors'], ['schur', 'Schur decomposition  (A = QTQᴴ)'], ['lstsq', 'Least squares  (AX ≈ B, using A and B)'], ['pinv', 'Pseudo-inverse  A⁺'], ['cond', 'Condition number  κ(A)']];
rep('<option value="ref">REF(A)  (row echelon form)</option></select>', '<option value="ref">REF(A)  (row echelon form)</option><optgroup label="Decompositions (floating point, with accuracy checks)">' + ops4.map((o) => '<option value="' + o[0] + '">' + esc(o[1]) + '</option>').join('') + '</optgroup></select>');

/* 2. example buttons */
const ex = (l, d) => '<button type="button" class="chipb" data-ex="' + esc(JSON.stringify(d)) + '">' + esc(l) + '</button>';
const chips = [
  ex('LU 3×3', { op: 'lu', A: [['2', '1', '1'], ['4', '3', '3'], ['8', '7', '9']] }),
  ex('QR of a 3×2', { op: 'qr', A: [['1', '1'], ['1', '2'], ['1', '3']] }),
  ex('Cholesky 3×3', { op: 'chol', A: [['4', '12', '-16'], ['12', '37', '-43'], ['-16', '-43', '98']] }),
  ex('Not positive definite (error)', { op: 'chol', A: [['1', '2'], ['2', '1']] }),
  ex('SVD of a 2×3', { op: 'svd', A: [['3', '2', '2'], ['2', '3', '-2']] }),
  ex('Eigen: symmetric 3×3', { op: 'eig', A: [['2', '-1', '0'], ['-1', '2', '-1'], ['0', '-1', '2']] }),
  ex('Eigen: complex pair', { op: 'eig', A: [['0', '-1'], ['1', '0']] }),
  ex('Eigen: not diagonalisable', { op: 'eig', A: [['2', '1'], ['0', '2']] }),
  ex('Schur 3×3', { op: 'schur', A: [['4', '1', '2'], ['0', '3', '1'], ['1', '-1', '2']] }),
  ex('Line fit by least squares', { op: 'lstsq', A: [['1', '1'], ['1', '2'], ['1', '3'], ['1', '4']], B: [['2'], ['3'], ['5'], ['4']] }),
  ex('Hilbert 5×5 condition number', { op: 'cond', A: [0, 1, 2, 3, 4].map((i) => [0, 1, 2, 3, 4].map((j) => '1/' + (i + j + 1))) }),
].join(' ');
rep('</div><div id="nu-out" aria-live="polite">', ' ' + chips + '</div><div id="nu-out" aria-live="polite">');

/* 3. SEO and intro text */
const T0 = 'Matrix Calculator Online | Inverse, Determinant, RREF &amp; Linear Equation Solver', T1 = 'Matrix Calculator Online | Inverse, RREF, LU, QR, SVD &amp; Eigenvalues';
rep(T0, T1, true);
const D0 = "Free online matrix calculator. Add, subtract and multiply matrices, find the determinant, inverse, rank and RREF, and solve simultaneous linear equations by Gauss-Jordan, Gaussian elimination, Cramer's rule or LU, with exact fractions and step-by-step working.";
const D1 = "Free online matrix calculator. Add, multiply, find the determinant, inverse, rank and RREF, solve linear equations, and compute LU, QR, Cholesky, SVD and Schur decompositions, eigenvalues and eigenvectors, least squares and condition numbers, with step-by-step working and accuracy checks.";
rep(D0, D1, true);
rep('and solve simultaneous equations, with exact fractions and the working shown. Calculate. Convert. Understand.', 'solve simultaneous equations, and factor a matrix by LU, QR, Cholesky, SVD or Schur, or find its eigenvalues and eigenvectors. Exact fractions for the basics, and accuracy checks on every decomposition. Calculate. Convert. Understand.');

/* 4. size rules */
const row = (a, b, c) => '<tr><td class="n">' + esc(a) + '</td><td class="n">' + esc(b) + '</td><td class="n">' + esc(c) + '</td></tr>';
rep('</tbody></table></div><p class="note">A⁰ is the identity matrix.</p>', row('LU, Cholesky, eigenvalues, Schur', 'Square matrix. Cholesky also needs A symmetric and positive definite', 'Factor matrices, same size as A') + row('QR, SVD, pseudo-inverse, condition number', 'Any matrix', 'Q is m × m, R is m × n. SVD is the thin form: U is m × k, V is n × k, k = min(m, n)') + row('Least squares AX ≈ B', 'B has one row per row of A', 'n × columns of B') + '</tbody></table></div><p class="note">A⁰ is the identity matrix.</p>');

/* 5. FAQ */
rep('Eigenvalues and decompositions are planned as later modes.', 'It also computes LU, QR, Cholesky, SVD and Schur decompositions, eigenvalues and eigenvectors, least-squares solutions, the pseudo-inverse and the condition number.');
rep('<h3>Are the results exact?</h3><p>Yes. Entries are stored as exact fractions, so 0.1 + 0.2 gives exactly 3/10 and 1/3 + 1/3 gives exactly 2/3. A decimal approximation is shown beside each fraction.</p>', '<h3>Are the results exact?</h3><p>The basic operations, determinant, inverse, rank, RREF and equation solvers are exact: entries are stored as fractions, so 0.1 + 0.2 gives exactly 3/10. The decompositions (LU, QR, Cholesky, SVD, eigenvalues, Schur) are floating-point: they use double precision, about 16 significant digits, and show 7. Each one comes with checks that show how close the result is to the true answer.</p>');
const faq4 = [
  ['Which decompositions does it compute?', 'LU with partial pivoting (PA = LU), Householder QR, Cholesky, the singular value decomposition, eigenvalues and eigenvectors, the complex Schur decomposition, the least-squares solution of AX ≈ B, the Moore-Penrose pseudo-inverse and the 2-norm condition number. Matrices can be up to 8 × 8.'],
  ['How do I know a decomposition is right?', 'Each result shows its own checks: for LU, QR, Cholesky, SVD and Schur the size of A minus the product of the factors; for QR, SVD and Schur how close the orthogonal or unitary factors are to orthogonal; for every eigenvalue and eigenvector the residual ‖Av − λv‖. Values near 1e-16 are rounding. If the input is ill-conditioned the status says reduced accuracy instead of presenting the numbers as certain.'],
  ['Why does Cholesky say my matrix is not positive definite?', 'Cholesky only exists for symmetric matrices whose eigenvalues are all positive. The calculator reports the row where a pivot is zero, negative or rounding-sized. A matrix that is only positive semidefinite, such as one with dependent rows, has a pivot of zero and is rejected too.'],
  ['Why are some eigenvalues complex?', 'A real matrix that is not symmetric can have complex eigenvalues. They come in conjugate pairs a + bi and a − bi. A rotation matrix such as [[0, −1], [1, 0]] has eigenvalues i and −i, because no real direction is left unchanged by a turn. Symmetric matrices always have real eigenvalues.'],
  ['What does a defective matrix mean?', 'Some matrices, such as [[2, 1], [0, 2]], have a repeated eigenvalue but only one independent eigenvector. They cannot be diagonalised as A = VΛV⁻¹. The calculator warns when it finds repeated eigenvalues with parallel eigenvectors.'],
  ['Should I use LU, QR or SVD?', 'LU is the fast choice for solving square systems and finding determinants. QR is the stable choice for least squares. SVD is the most informative: it gives rank, condition number, the best low-rank approximations and the pseudo-inverse, and it is the safest way to decide whether a matrix is singular in the presence of rounding.']
].map((q) => '<h3>' + esc(q[0]) + '</h3><p>' + esc(q[1]) + '</p>').join('');
rep('<h3>Is anything sent to a server?</h3>', faq4 + '<h3>Is anything sent to a server?</h3>');

/* 6. style, marker and script */
rep('font-size:15px;line-height:1.6;overflow-x:auto}</style>', 'font-size:15px;line-height:1.6;overflow-x:auto}#nu .mh{font-size:15px;margin:14px 0 6px}#nu .ck td,#nu .ck th{padding:6px 8px}#nu .ckw{font-weight:600}#nu .ckf{color:var(--err);font-weight:600}</style><!-- data-mode04 -->');
const eng = fs.readFileSync(path.join(__dirname, 'matrix_engine.js'), 'utf8'), dec = fs.readFileSync(path.join(__dirname, 'decomp_engine.js'), 'utf8'), cli = fs.readFileSync(path.join(__dirname, 'matrix_client.js'), 'utf8');
const mk = h.indexOf('/* Elecmetric Matrix Calculator: engine'); if (mk < 0) throw new Error('matrix script block not found');
const s0 = h.lastIndexOf('<script>', mk), s1 = h.indexOf('</script>', mk);
h = h.slice(0, s0) + '<script>' + eng + '\n' + dec + '\n' + cli + h.slice(s1);
fs.writeFileSync(file, h);
console.log('wrote ' + path.relative(root, file) + ' (' + h.length + ' bytes)');
