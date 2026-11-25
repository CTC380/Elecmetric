/* Builds calculators/matrix-calculator/index.html for Modes 01 to 05 from the Mode 04 page.
   Takes the built Mode 04 page as its shell, swaps in the three engines and the Mode 05 client, and adds the network-analysis
   menu group, network input box, example buttons, size rules, FAQ entries and SEO text.
   Run:  node tools/matrix_page5.js     (reads calculators/matrix-calculator/index.html, writes it back)
   Run it on the Mode 04 page only: it refuses to patch a page that already contains Mode 05. */
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
const file = path.join(root, 'calculators/matrix-calculator/index.html');
let h = fs.readFileSync(file, 'utf8');
if (h.includes('data-mode05')) throw new Error('This page already contains Mode 05. Restore the Mode 04 page first.');
if (!h.includes('data-mode04')) throw new Error('This is not the Mode 04 page.');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rep = (from, to, all) => { if (!h.includes(from)) throw new Error('not found: ' + from.slice(0, 70)); h = all ? h.split(from).join(to) : h.replace(from, () => to); };

/* 1. menu group */
const ops5 = [['nodal', 'Nodal analysis  (circuit text → node voltages)'], ['mesh', 'Mesh analysis  (circuit text → mesh currents)'], ['ybus', 'Y-bus  (power-system admittance matrix)'], ['zbus', 'Z-bus  (impedance matrix, inverse of Y-bus)'], ['incidence', 'Incidence and loop matrices  (network topology)'], ['ss', 'State-space analysis  (poles, stability, transfer function)'], ['symm', 'Symmetrical components  (Fortescue 0-1-2)'], ['dcpf', 'DC power flow  (angles and line flows)']];
rep('Condition number  κ(A)</option></optgroup></select>', 'Condition number  κ(A)</option></optgroup><optgroup label="Electrical network analysis (Mode 05)">' + ops5.map((o) => '<option value="' + o[0] + '">' + esc(o[1]) + '</option>').join('') + '</optgroup></select>');

/* 2. network input box, placed where the matrices are */
rep('<div class="mxrow">', '<div class="mxrow" id="mx-row">');
rep('<div class="ns-grid mxop">', '<div id="nw-box" hidden><label for="nw-text" class="ns-l">Network data (one item per line)</label><textarea id="nw-text" class="nw" rows="9" spellcheck="false" autocomplete="off" autocapitalize="off" aria-describedby="nw-hint"></textarea><p class="note" id="nw-hint" style="white-space:pre-line"></p></div><div class="ns-grid mxop">');

/* 3. example buttons */
const ex = (l, op, text) => '<button type="button" class="chipb" data-ex="' + esc(JSON.stringify({ op, text })) + '">' + esc(l) + '</button>';
const chips = [
  ex('Nodal: resistor network with a current source', 'nodal', 'V1 1 0 10\nR1 1 2 4\nR2 2 0 6\nR3 2 3 3\nR4 3 0 6\nI1 0 3 1'),
  ex('Nodal: RLC near resonance (AC)', 'nodal', 'V1 1 0 10<0\nR1 1 2 100\nL1 2 3 0.5\nC1 3 0 20u\nfreq 50'),
  ex('Nodal: floating node (error)', 'nodal', 'V1 1 0 10\nR1 1 2 100\nR2 3 4 50'),
  ex('Mesh: two meshes', 'mesh', 'V1 20 1\nR1 4 1\nR2 6 1 2\nR3 2 2\nV2 8 2'),
  ex('Mesh: supermesh (shared current source)', 'mesh', 'V1 10 1\nR1 4 1\nI1 1 1 2\nR2 4 1 2\nR3 6 2\nR4 3 2'),
  ex('Y-bus: 3 buses', 'ybus', 'line 1 2 0.02 0.06 0.06\nline 1 3 0.08 0.24 0.05\nline 2 3 0.06 0.18 0.04'),
  ex('Y-bus: tap transformer and shunt', 'ybus', 'line 1 2 0.02 0.06 0.06\nxfmr 2 3 0.01 0.1 0.97\nline 1 3 0.08 0.24 0.05\nshunt 3 0 0.1'),
  ex('Z-bus: reference bus 1', 'zbus', 'line 1 2 0.02 0.06\nline 1 3 0.08 0.24\nline 2 3 0.06 0.18\nref 1'),
  ex('Incidence: 4 nodes, 5 branches', 'incidence', 'b1 1 0 10\nb2 1 2 20\nb3 2 0 30\nb4 2 3 5\nb5 3 0 5'),
  ex('State-space: second-order system', 'ss', 'A = 0 1 ; -2 -3\nB = 0 ; 1\nC = 1 0\nD = 0'),
  ex('State-space: unstable and uncontrollable', 'ss', 'A = 1 0 ; 0 -2\nB = 0 ; 1\nC = 1 1'),
  ex('State-space: discrete time', 'ss', 'type discrete\nA = 0.5 0.2 ; 0 0.8\nB = 0 ; 1\nC = 1 0'),
  ex('Symmetrical: unbalanced voltages', 'symm', 'va 100<0\nvb 80<-110\nvc 90<130'),
  ex('Symmetrical: line-to-ground fault current', 'symm', 'ia 1000<-30\nib 0\nic 0'),
  ex('Symmetrical: voltages, currents and power', 'symm', 'va 100<0\nvb 80<-110\nvc 90<130\nia 5<-20\nib 4<-140\nic 6<100'),
  ex('DC power flow: 3 buses', 'dcpf', 'line 1 2 0.1\nline 2 3 0.2\nline 1 3 0.25 1.0\np 1 1.5\np 3 -1.5\nslack 2'),
  ex('DC power flow: overloaded line', 'dcpf', 'line 1 2 0.1 1.0\nline 2 3 0.2 1.0\nline 1 3 0.25 0.5\np 1 1.5\np 3 -1.5\nslack 2\nbase 100')
].join(' ');
rep('</div><div id="nu-out" aria-live="polite">', ' <span class="ns-l">Network examples</span> ' + chips + '</div><div id="nu-out" aria-live="polite">');

/* 4. SEO and intro text */
rep('Matrix Calculator Online | Inverse, RREF, LU, QR, SVD &amp; Eigenvalues', 'Matrix Calculator Online | Inverse, SVD, Eigenvalues &amp; Circuit Analysis', true);
const D1 = 'Free online matrix calculator. Add, multiply, find the determinant, inverse, rank and RREF, solve linear equations, and compute LU, QR, Cholesky, SVD and Schur decompositions, eigenvalues and eigenvectors, least squares and condition numbers, with step-by-step working and accuracy checks.';
const D2 = 'Free online matrix calculator. Add, multiply, find the determinant, inverse, rank and RREF, solve linear equations, and compute LU, QR, SVD and eigenvalues. Also nodal and mesh circuit analysis, Y-bus and Z-bus, state-space stability, symmetrical components and DC power flow, with working and accuracy checks.';
rep(D1, D2, true);
rep('or find its eigenvalues and eigenvectors. Exact fractions for the basics, and accuracy checks on every decomposition. Calculate. Convert. Understand.', 'or find its eigenvalues and eigenvectors. Then use matrices on electrical networks: nodal and mesh analysis, Y-bus and Z-bus, incidence and loop matrices, state-space stability, symmetrical components and DC power flow. Exact fractions for the basics, and accuracy checks on every result. Calculate. Convert. Understand.');

/* 5. size rules */
const row = (a, b, c) => '<tr><td class="n">' + esc(a) + '</td><td class="n">' + esc(b) + '</td><td class="n">' + esc(c) + '</td></tr>';
rep('</tbody></table></div><p class="note">A⁰ is the identity matrix.</p>',
  row('Nodal and mesh analysis', 'Circuit text, up to 16 nodes (or 10 meshes) and 60 elements. Nodes need a path to ground', 'Node voltages or mesh currents, element currents, voltages and power') +
  row('Y-bus, Z-bus', 'Up to 14 buses. The Z-bus needs a shunt path to ground or a reference bus', 'Complex matrix, buses × buses') +
  row('Incidence and loop matrices', 'Up to 16 nodes and 60 branches', 'Nodes × branches, and links × branches') +
  row('State-space', 'A is n × n with n up to 8; B, C, D optional', 'Poles, stability, controllability, observability, transfer function') +
  row('Symmetrical components', 'Three phasors per set (phase or sequence)', 'The other set, unbalance factors and power') +
  row('DC power flow', 'Up to 14 connected buses, reactances above zero', 'Angles and line flows') +
  '</tbody></table></div><p class="note">A⁰ is the identity matrix.</p>');

/* 6. FAQ */
rep('least-squares solutions, the pseudo-inverse and the condition number.', 'least-squares solutions, the pseudo-inverse and the condition number. The electrical network group adds nodal and mesh analysis, Y-bus and Z-bus, incidence and loop matrices, state-space analysis, symmetrical components and DC power flow.');
rep('Each one comes with checks that show how close the result is to the true answer.', 'Each one comes with checks that show how close the result is to the true answer. The network tools are floating-point too, and carry their own checks: KCL, KVL, power balance and round-trip tests.');
const faq5 = [
  ['How do I enter a circuit for nodal analysis?', 'Type one element per line: a name, two nodes and a value, for example R1 1 2 100. Names start with R, L, C, Z (a complex impedance such as 3+4j), Y (an admittance), V (a voltage source, positive terminal at the first node) or I (a current source flowing from the first node through the source to the second). Node 0 is ground. For AC, add a line such as freq 50 and give source values as phasors like 10<30.'],
  ['How does it handle voltage sources?', 'By modified nodal analysis. A voltage source fixes the difference between two node voltages instead of a current, so its current is added as an extra unknown and the matrix gets one more row and column for each source. The result shows the augmented matrix and the current in every source.'],
  ['What do the network checks mean?', 'After solving, every element current is recomputed from the node voltages. The calculator then tests Kirchhoff’s current law at every node and sums the power of all elements, which must be zero (Tellegen’s theorem). A small residual such as 1e-16 is rounding. A large condition number warns that the answer is sensitive to the data.'],
  ['How does mesh analysis treat current sources?', 'A current source in only one mesh fixes that mesh current. A current source shared by two meshes forms a supermesh: the two KVL equations are added, which removes the unknown voltage across the source, and a constraint equation I₁ − I₂ = I is used instead. One current source per mesh is supported; for harder cases use nodal analysis.'],
  ['What is the Y-bus and how is it built?', 'The Y-bus is the nodal admittance matrix of a power system, with [I] = [Y][V]. Each line adds its series admittance to the diagonal entries and subtracts it from the off-diagonals, with half of the line-charging susceptance at each end. A transformer with tap a puts y/a² on one diagonal, y on the other and −y/a off the diagonal. Shunts go on the diagonal. The calculator checks the matrix against branch-by-branch currents for a test voltage set.'],
  ['What does the Z-bus tell me?', 'It is the inverse of the Y-bus. The diagonal entry Zᵢᵢ is the Thevenin impedance seen from bus i, which is the starting point for fault studies, and the off-diagonal entries are transfer impedances. A Y-bus with no path to ground is singular, so add a shunt or give a reference bus.'],
  ['What are the incidence and loop matrices for?', 'The incidence matrix A records which branches leave and enter each node, so KCL is A·i = 0. The loop matrix B has one row per independent loop, so KVL is B·v = 0. They satisfy A·Bᵀ = 0, which the calculator checks. With resistances given, A·G·Aᵀ is the nodal matrix and B·R·Bᵀ is the loop matrix used in nodal and mesh analysis.'],
  ['What does the state-space tool report?', 'The poles (eigenvalues of A) with time constants or natural frequency and damping ratio, whether the system is stable, controllability and observability from the ranks of the Krylov matrices, and for single-input single-output systems the transfer function, its zeros and the DC gain. It works in continuous or discrete time.'],
  ['What are symmetrical components?', 'Fortescue’s transformation splits any three-phase set into zero, positive and negative sequence parts. A balanced set has only a positive-sequence part. Unbalanced loads and faults create negative and zero sequence, which is why protection and fault studies work with the sequence networks. The tool converts either way and reports the unbalance factors and the power.'],
  ['How accurate is the DC power flow?', 'It is the linear approximation used for screening: voltage magnitudes are 1 pu, resistance is ignored and angle differences are small, so there are no losses and no reactive power. It gives a quick estimate of MW flows and loading. For voltages, losses and reactive power you need an AC load flow in dedicated power-system software.']
].map((q) => '<h3>' + esc(q[0]) + '</h3><p>' + esc(q[1]) + '</p>').join('');
rep('<h3>Is anything sent to a server?</h3>', faq5 + '<h3>Is anything sent to a server?</h3>');

/* 7. style, marker and script */
rep('</style><!-- data-mode04 -->', '#nu textarea.nw{display:block;width:100%;min-height:190px;box-sizing:border-box;font:15px/1.5 var(--mono);padding:10px 12px;border-radius:8px;border:1px solid var(--line);background:var(--field);color:var(--ink);resize:vertical}#nu textarea.nw:focus{outline:2px solid var(--gold);outline-offset:1px}#nu #nw-hint{margin:6px 0 10px}#nu .res .nt{max-width:none}#nu .nt td.r{word-break:normal;overflow-wrap:anywhere}</style><!-- data-mode04 --><!-- data-mode05 -->');
const fr = (n) => fs.readFileSync(path.join(__dirname, n), 'utf8');
const mk = h.indexOf('/* Elecmetric Matrix Calculator: engine'); if (mk < 0) throw new Error('matrix script block not found');
const s0 = h.lastIndexOf('<script>', mk), s1 = h.indexOf('</script>', mk);
h = h.slice(0, s0) + '<script>' + fr('matrix_engine.js') + '\n' + fr('decomp_engine.js') + '\n' + fr('network_engine.js') + '\n' + fr('matrix_client5.js') + h.slice(s1);
fs.writeFileSync(file, h);
console.log('wrote ' + path.relative(root, file) + ' (' + h.length + ' bytes)');
