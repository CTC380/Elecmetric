/* Elecmetric Matrix Calculator: page script (Modes 01 to 05). Inlined by tools/matrix_page5.js after the three engines. */
(function () {
  var $ = function (id) { return document.getElementById(id); }, E = MatrixEngine, D = MatrixDecomp, NW = MatrixNetwork, root = $('nu'), out = $('nu-out'), stp = $('nu-steps'), err = $('nu-err'), note = $('nu-note');
  var S = { A: [['1', '2'], ['3', '4']], B: [['5', '6'], ['7', '8']] }, UN = { scale: 1, transpose: 1, power: 1, det: 1, inv: 1, rank: 1, trace: 1, norm: 1, adj: 1, cof: 1, minor: 1, ref: 1, rref: 1, lu: 1, qr: 1, chol: 1, svd: 1, eig: 1, schur: 1, pinv: 1, cond: 1 };

  var NWDEF = {
    nodal: 'V1 1 0 10\nR1 1 2 4\nR2 2 0 6\nR3 2 3 3\nR4 3 0 6\nI1 0 3 1',
    mesh: 'V1 20 1\nR1 4 1\nR2 6 1 2\nR3 2 2\nV2 8 2',
    ybus: 'line 1 2 0.02 0.06 0.06\nline 1 3 0.08 0.24 0.05\nline 2 3 0.06 0.18 0.04',
    zbus: 'line 1 2 0.02 0.06 0.06\nline 1 3 0.08 0.24 0.05\nline 2 3 0.06 0.18 0.04',
    incidence: 'b1 1 0 10\nb2 1 2 20\nb3 2 0 30\nb4 2 3 5\nb5 3 0 5',
    ss: 'A = 0 1 ; -2 -3\nB = 0 ; 1\nC = 1 0\nD = 0',
    symm: 'va 100<0\nvb 80<-110\nvc 90<130',
    dcpf: 'line 1 2 0.1\nline 2 3 0.2\nline 1 3 0.25 1.0\np 1 1.5\np 3 -1.5\nslack 2'
  };
  var NWH = {
    nodal: 'One element per line: name node1 node2 value. The name starts with R, L, C, Z (complex ohms such as 3+4j), Y (siemens), V (voltage source, + terminal at node1) or I (current flows from node1 through the source to node2). Node 0 is ground. For AC add a line "freq 50" and give sources as phasors, for example 10<30 (magnitude, angle in degrees). Value suffixes: k, M (mega), m (milli), u, n, p. Text after # is a comment.',
    mesh: 'One element per line: name value mesh, or name value mesh1 mesh2 for an element shared by two meshes. Every mesh current is clockwise. R, L, C, Z are impedances. V is an EMF that pushes current clockwise in the first mesh listed (and against the second). I is the current in the first mesh\'s clockwise direction; one current source per mesh. L and C need a line "freq 50".',
    ybus: 'line from to r x [bch]: series impedance r + jx, and optional total line-charging susceptance bch (half at each end).\nxfmr from to r x tap: transformer with off-nominal tap ratio on the "from" side.\nshunt bus g b: shunt admittance g + jb at a bus. Use consistent units, such as per-unit.',
    zbus: 'Same input as the Y-bus: line, xfmr and shunt lines. Z-bus is the inverse of the Y-bus, so some bus needs a path to ground (a shunt or line charging). Add "ref 1" to take bus 1 as the reference instead, which removes its row and column before inverting.',
    incidence: 'One branch per line: name from to [resistance]. The branch is directed from its first node to its second. Node 0 may be used as ground and is then the reference. Give a resistance on every branch to also get the nodal and loop matrices.',
    ss: 'Write each matrix on one line with rows separated by ;  for example  A = 0 1 ; -2 -3.  A (n × n) is required. B, C and D are optional (D needs B and C). Add "type discrete" for a discrete-time system. Up to 8 states.',
    symm: 'One phasor per line. Phase quantities: va, vb, vc (voltages) and ia, ib, ic (currents). Or sequence components: v0, v1, v2 and i0, i1, i2. Write phasors as 100<-120 (magnitude, angle in degrees) or 86.6-50j. Give all three of a set.',
    dcpf: 'line from to x [limit]: line reactance x (pu) and optional flow limit.\np bus value: injection at a bus (positive generation, negative load).\nslack bus: reference bus (angle 0), which absorbs the mismatch.\nbase 100: optional, shows flows in MW.'
  };
  var NWT = {}, curNet = null;
  function setHint(op) { var h = $('nw-hint'); if (h) h.textContent = NWH[op] || ''; }
  var STATE = { pass: '✓ pass', reduced: '⚠ reduced accuracy', fail: '✗ fail' };
  function matsHtml(r) {
    var h = r.mats.map(function (M) { return '<h3 class="mh">' + esc(M.label) + '</h3>' + table(M); }).join('');
    if (r.copy && r.copy.length) h += '<p>' + r.copy.map(function (c) { return '<button type="button" class="btn2" data-copy="' + esc('[' + c[1].map(function (x) { return '[' + x.map(String).join(', ') + ']'; }).join(', ') + ']') + '">Copy ' + esc(c[0]) + ' as [[…]]</button>'; }).join('') + '</p>';
    return h;
  }
  function tablesHtml(r) {
    return r.tables.map(function (t) { return '<h3 class="mh">' + esc(t.title) + '</h3><div class="tw" tabindex="0" role="region" aria-label="' + esc(t.title) + '"><table class="ns-t ck nt"><thead><tr>' + t.head.map(function (x) { return '<th>' + esc(x) + '</th>'; }).join('') + '</tr></thead><tbody>' + t.rows.map(function (row) { return '<tr>' + row.map(function (c, j) { return '<td' + (j > 0 ? ' class="r"' : '') + '>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>'; }).join('');
  }
  function checksHtml(r) {
    if (!r.checks || !r.checks.length) return '';
    return '<h3 class="mh">Accuracy checks</h3><div class="tw" tabindex="0" role="region" aria-label="Accuracy checks"><table class="ns-t ck"><thead><tr><th>Check</th><th>Value</th><th>Result</th></tr></thead><tbody>' + r.checks.map(function (c) { return '<tr><td>' + esc(c.label) + '</td><td class="r">' + esc(c.text) + '</td><td class="' + (c.state === 'fail' ? 'ckf' : c.state === 'reduced' ? 'ckw' : 'ckp') + '">' + STATE[c.state] + '</td></tr>'; }).join('') + '</tbody></table></div><p class="note">Values near 1e-16 are machine rounding. Decomposition results are floating-point approximations, shown to 7 significant digits.</p>';
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function read(n) { var g = $('mx-' + n); if (!g) return; Array.prototype.forEach.call(g.querySelectorAll('input'), function (el) { S[n][+el.dataset.i][+el.dataset.j] = el.value; }); }
  function size(n, r, c) { read(n); var M = []; for (var i = 0; i < r; i++) { M.push([]); for (var j = 0; j < c; j++) M[i].push((S[n][i] && S[n][i][j] !== undefined) ? S[n][i][j] : '0'); } S[n] = M; build(n); calc(); }
  function build(n) {
    var M = S[n], h = '<div class="mxg" style="grid-template-columns:repeat(' + M[0].length + ',minmax(56px,1fr))" role="group" aria-label="Matrix ' + n + ', ' + M.length + ' by ' + M[0].length + '">';
    M.forEach(function (r, i) { r.forEach(function (v, j) { h += '<input class="ns-in mx" inputmode="text" autocomplete="off" spellcheck="false" data-n="' + n + '" data-i="' + i + '" data-j="' + j + '" aria-label="' + n + ' row ' + (i + 1) + ' column ' + (j + 1) + '" value="' + esc(v) + '">'; }); });
    $('mx-' + n).innerHTML = h + '</div>'; $('dim-' + n).textContent = M.length + ' \u00d7 ' + M[0].length; $('r' + n).value = M.length; $('c' + n).value = M[0].length;
  }
  function fill(n, how) { read(n); S[n] = S[n].map(function (r, i) { return r.map(function (_, j) { return how === 'zero' ? '0' : how === 'one' ? '1' : how === 'id' ? (i === j ? '1' : '0') : how === 'rand' ? String(Math.floor(Math.random() * 19) - 9) : ''; }); }); build(n); calc(); }
  function table(M) { return '<div class="tw" tabindex="0" role="region" aria-label="Result matrix"><table class="ns-t"><tbody>' + M.text.map(function (r, i) { return '<tr>' + r.map(function (c, j) { var d = M.dec[i][j]; return '<td class="r">' + esc(c) + (d !== c ? '<small>\u2248 ' + esc(d) + '</small>' : '') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>'; }
  function calc() {
    var op = $('nu-op').value, net = !!NW.OPS[op]; read('A'); read('B');
    $('mx-row').hidden = net; $('nw-box').hidden = !net; if (net) setHint(op);
    $('mx-bbox').hidden = !!UN[op]; $('nu-kf').hidden = net || op !== 'scale'; $('nu-nf').hidden = net || op !== 'power';
    Array.prototype.forEach.call(root.querySelectorAll('.bad'), function (el) { el.classList.remove('bad'); el.removeAttribute('aria-invalid'); });
    var r = net ? NW.calc({ op: op, text: $('nw-text').value }) : D.OPS[op] ? D.calc({ op: op, A: S.A, B: S.B }) : E.calc({ op: op, A: S.A, B: S.B, k: $('nu-k').value, n: $('nu-n').value });
    if (!r.ok) {
      err.textContent = r.error; out.innerHTML = ''; stp.innerHTML = '<p class="note">Fix the input to see the working.</p>';
      if (r.cell) { var el = r.cell[0] === 'k' ? $('nu-k') : r.cell[0] === 'n' ? $('nu-n') : root.querySelector('input[data-n="' + r.cell[0] + '"][data-i="' + r.cell[1] + '"][data-j="' + r.cell[2] + '"]'); if (el) { el.classList.add('bad'); el.setAttribute('aria-invalid', 'true'); } }
      return;
    }
    err.textContent = '';
    var h = '<div class="res"><div class="sub"><b>' + esc(r.title) + '</b>' + (r.status ? ' \u00b7 ' + esc(r.status) : r.text ? ' \u00b7 ' + r.rows + ' \u00d7 ' + r.cols + ' matrix' : '') + '</div>';
    if (r.lines) h += '<ul class="sol">' + r.lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>';
    if (r.tables) h += tablesHtml(r);
    if (r.mats) h += matsHtml(r);
    if (r.checks) h += checksHtml(r);
    if (r.scalar) h += r.scalar.map(function (x) { return '<div class="big">' + esc(x.label) + ' = ' + esc(x.text) + (x.dec !== x.text ? ' <small>\u2248 ' + esc(x.dec) + '</small>' : '') + '<button type="button" class="btn2" data-copy="' + esc(x.text) + '" aria-label="Copy ' + esc(x.label) + '">Copy</button></div>'; }).join('');
    if (r.text) { var csv = r.text.map(function (x) { return x.join(','); }).join('\n'), br = '[' + r.text.map(function (x) { return '[' + x.join(', ') + ']'; }).join(', ') + ']'; h += table(r) + '<p><button type="button" class="btn2" data-copy="' + esc(br) + '">Copy as [[\u2026]]</button><button type="button" class="btn2" data-copy="' + esc(csv) + '">Copy as CSV</button></p>'; }
    if (r.singular) h += '<p class="note">det(A) = 0, so A is singular: it has no inverse and its rows are linearly dependent.</p>';
    out.innerHTML = h + '</div>';
    stp.innerHTML = '<ol class="steps">' + r.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' + ((r.capped === undefined ? r.steps.length >= 17 : r.capped) ? '<p class="note">Showing the first steps only. The result above is complete.</p>' : '');
  }
  function copy(t) { var d = function () { note.textContent = 'Copied'; }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) return copy(b.dataset.copy);
    if (b.dataset.fill) return fill(b.dataset.n, b.dataset.fill);
    if (b.dataset.act === 'swap') { read('A'); read('B'); var t = S.A; S.A = S.B; S.B = t; build('A'); build('B'); return calc(); }
    if (b.dataset.ex) { var d = JSON.parse(b.dataset.ex); if (d.text !== undefined) { if (curNet) NWT[curNet] = $('nw-text').value; $('nw-text').value = d.text; NWT[d.op] = d.text; curNet = d.op; $('nu-op').value = d.op; return calc(); } S.A = d.A; if (d.B) S.B = d.B; $('nu-op').value = d.op; $('nu-k').value = d.k || '2'; $('nu-n').value = d.n || '2'; build('A'); build('B'); return calc(); }
    if (b.dataset.act === 'reset') { S.A = [['1', '2'], ['3', '4']]; S.B = [['5', '6'], ['7', '8']]; $('nu-op').value = 'add'; $('nu-k').value = '2'; $('nu-n').value = '2'; build('A'); build('B'); calc(); }
  });
  root.addEventListener('input', function (e) { if (e.target.classList.contains('mx') || e.target.id === 'nu-k' || e.target.id === 'nu-n' || e.target.id === 'nw-text') calc(); });
  root.addEventListener('change', function (e) { var id = e.target.id; if (id === 'nu-op') { var nop = $('nu-op').value; if (curNet) NWT[curNet] = $('nw-text').value; if (NW.OPS[nop]) { $('nw-text').value = NWT[nop] !== undefined ? NWT[nop] : NWDEF[nop]; curNet = nop; } else curNet = null; return calc(); } if (/^[rc][AB]$/.test(id)) { var n = id[1]; size(n, +$('r' + n).value, +$('c' + n).value); } });
  root.addEventListener('keydown', function (e) {
    var el = e.target; if (!el.classList.contains('mx')) return; var di = { ArrowUp: -1, ArrowDown: 1, Enter: 1 }[e.key], dj = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (di === undefined && dj === undefined) return; if (dj !== undefined && !(el.selectionStart === el.selectionEnd && (dj < 0 ? el.selectionStart === 0 : el.selectionStart === el.value.length))) return;
    var nx = root.querySelector('input[data-n="' + el.dataset.n + '"][data-i="' + (+el.dataset.i + (di || 0)) + '"][data-j="' + (+el.dataset.j + (dj || 0)) + '"]'); if (nx) { e.preventDefault(); nx.focus(); nx.select(); }
  });
  build('A'); build('B'); calc();
})();
