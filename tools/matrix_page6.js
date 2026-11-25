/* Builds calculators/matrix-calculator/index.html for Modes 01 to 06 from the Mode 05 page.
   Adds the matrix-functions menu group (exp, log, sqrt, sin, cos), example buttons, size rule, FAQ entries and SEO text,
   and swaps in the four engines and the Mode 06 client.
   Run:  node tools/matrix_page6.js   (reads and rewrites calculators/matrix-calculator/index.html; refuses to run twice) */
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
const file = path.join(root, 'calculators/matrix-calculator/index.html');
let h = fs.readFileSync(file, 'utf8');
if (h.includes('data-mode06')) throw new Error('This page already contains Mode 06.');
if (!h.includes('data-mode05')) throw new Error('This is not the Mode 05 page.');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rep = (a, b, all) => { if (!h.includes(a)) throw new Error('not found: ' + a.slice(0, 70)); h = all ? h.split(a).join(b) : h.replace(a, () => b); };
const ops = [['expm', 'Matrix exponential  e^A'], ['logm', 'Matrix logarithm  log A'], ['sqrtm', 'Matrix square root  √A'], ['sinm', 'Matrix sine  sin A'], ['cosm', 'Matrix cosine  cos A']];
rep('<optgroup label="Electrical network analysis (Mode 05)">', '<optgroup label="Matrix functions (Mode 06)">' + ops.map((o) => '<option value="' + o[0] + '">' + esc(o[1]) + '</option>').join('') + '</optgroup><optgroup label="Electrical network analysis (Mode 05)">');
const ex = (l, d) => '<button type="button" class="chipb" data-ex="' + esc(JSON.stringify(d)) + '">' + esc(l) + '</button>';
const chips = [
  ex('e^A of a rotation generator', { op: 'expm', A: [['0', '1'], ['-1', '0']] }),
  ex('e^A of a 2×2 matrix', { op: 'expm', A: [['1', '2'], ['3', '4']] }),
  ex('e^A of a 3×3 system matrix', { op: 'expm', A: [['0', '1', '0'], ['0', '0', '1'], ['-6', '-11', '-6']] }),
  ex('log A of a symmetric matrix', { op: 'logm', A: [['2', '1'], ['1', '2']] }),
  ex('√A of a symmetric matrix', { op: 'sqrtm', A: [['2', '1'], ['1', '2']] }),
  ex('√A with a negative eigenvalue (error)', { op: 'sqrtm', A: [['1', '2'], ['3', '4']] }),
  ex('sin A and cos A', { op: 'sinm', A: [['1', '2'], ['0', '1']] })
].join(' ');
rep(' <span class="ns-l">Network examples</span> ', ' <span class="ns-l">Matrix function examples</span> ' + chips + ' <span class="ns-l">Network examples</span> ');
rep('Matrix Calculator Online | Inverse, SVD, Eigenvalues &amp; Circuit Analysis', 'Matrix Calculator Online | Inverse, SVD, Eigenvalues, e^A &amp; Circuit Analysis', true);
const D2 = 'Free online matrix calculator. Add, multiply, find the determinant, inverse, rank and RREF, solve linear equations, and compute LU, QR, SVD and eigenvalues. Also nodal and mesh circuit analysis, Y-bus and Z-bus, state-space stability, symmetrical components and DC power flow, with working and accuracy checks.';
const D3 = 'Free online matrix calculator. Add, multiply, find the determinant, inverse, rank and RREF, solve linear equations, and compute LU, QR, SVD, eigenvalues, e^A, log A, √A, sin A and cos A. Also nodal and mesh circuit analysis, Y-bus, state-space stability and DC power flow, with working and accuracy checks.';
rep(D2, D3, true);
const row = (a, b, c) => '<tr><td class="n">' + esc(a) + '</td><td class="n">' + esc(b) + '</td><td class="n">' + esc(c) + '</td></tr>';
rep('</tbody></table></div><p class="note">A⁰ is the identity matrix.</p>', row('e^A, sin A, cos A', 'Square matrix up to 8 × 8', 'Square matrix of the same size') + row('log A, √A', 'Square matrix with no zero or negative real eigenvalue', 'Square matrix of the same size (principal value)') + '</tbody></table></div><p class="note">A⁰ is the identity matrix.</p>');
const faq = [
  ['What is the matrix exponential?', 'e^A = I + A + A²/2! + A³/3! + … for a square matrix A. It solves the linear differential equation dx/dt = Ax, whose solution is x(t) = e^(At)·x(0), so it is used for state-space systems, transient analysis and Markov chains. It always exists and is always invertible, with inverse e^−A. To get e^(At), multiply A by t before entering it.'],
  ['How is e^A computed, and is the series used?', 'It is not computed from the raw series, which loses accuracy for large matrices. The calculator scales A down, uses a degree-13 Padé approximant, and squares the result back up. The result is checked by e^A·e^−A = I and by comparing (e^(A/2))² with e^A.'],
  ['What are the matrix logarithm and square root?', 'They are the inverse operations: exp(log A) = A and (√A)² = A. A matrix has many square roots and logarithms, so the calculator returns the principal one. It is real when A has no zero or negative real eigenvalue, and the page tells you when that fails, for example for [[1, 2], [3, 4]], which has a negative eigenvalue.'],
  ['What are sin A and cos A of a matrix?', 'They are defined by the same power series as the scalar functions. Both come from one exponential of the block matrix [[0, −A], [A, 0]]. The checks are sin²A + cos²A = I and the double-angle identity sin 2A = 2 sin A cos A.'],
  ['Why is cos of [[0, 1], [−1, 0]] equal to 1.543 on the diagonal?', 'This matrix J satisfies J² = −I, which makes it behave like the imaginary unit i. So cos J = cosh 1 · I ≈ 1.543 · I and sin J = sinh 1 · J, while e^J is the ordinary rotation matrix with cos 1 and sin 1.']
].map((q) => '<h3>' + esc(q[0]) + '</h3><p>' + esc(q[1]) + '</p>').join('');
rep('<h3>How do I enter a circuit for nodal analysis?</h3>', faq + '<h3>How do I enter a circuit for nodal analysis?</h3>');
rep('</style><!-- data-mode04 --><!-- data-mode05 -->', '</style><!-- data-mode04 --><!-- data-mode05 --><!-- data-mode06 -->');
const fr = (n) => fs.readFileSync(path.join(__dirname, n), 'utf8');
const mk = h.indexOf('/* Elecmetric Matrix Calculator: engine'); if (mk < 0) throw new Error('script block not found');
const s0 = h.lastIndexOf('<script>', mk), s1 = h.indexOf('</script>', mk);
h = h.slice(0, s0) + '<script>' + fr('matrix_engine.js') + '\n' + fr('decomp_engine.js') + '\n' + fr('network_engine.js') + '\n' + fr('matfun_engine.js') + '\n' + fr('matrix_client6.js') + h.slice(s1);
fs.writeFileSync(file, h); console.log('wrote ' + path.relative(root, file) + ' (' + h.length + ' bytes)');
