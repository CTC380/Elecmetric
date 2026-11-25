/* Elecmetric Matrix Calculator: page script (Modes 01 to 04). Inlined by tools/matrix_page4.js after the two engines. */
(function () {
  var $ = function (id) { return document.getElementById(id); }, E = MatrixEngine, D = MatrixDecomp, root = $('nu'), out = $('nu-out'), stp = $('nu-steps'), err = $('nu-err'), note = $('nu-note');
  var S = { A: [['1', '2'], ['3', '4']], B: [['5', '6'], ['7', '8']] }, UN = { scale: 1, transpose: 1, power: 1, det: 1, inv: 1, rank: 1, trace: 1, norm: 1, adj: 1, cof: 1, minor: 1, ref: 1, rref: 1, lu: 1, qr: 1, chol: 1, svd: 1, eig: 1, schur: 1, pinv: 1, cond: 1 };
  var STATE = { pass: '✓ pass', reduced: '⚠ reduced accuracy', fail: '✗ fail' };
  function matsHtml(r) {
    var h = r.mats.map(function (M) { return '<h3 class="mh">' + esc(M.label) + '</h3>' + table(M); }).join('');
    if (r.copy && r.copy.length) h += '<p>' + r.copy.map(function (c) { return '<button type="button" class="btn2" data-copy="' + esc('[' + c[1].map(function (x) { return '[' + x.map(String).join(', ') + ']'; }).join(', ') + ']') + '">Copy ' + esc(c[0]) + ' as [[…]]</button>'; }).join('') + '</p>';
    return h;
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
    var op = $('nu-op').value; read('A'); read('B');
    $('mx-bbox').hidden = !!UN[op]; $('nu-kf').hidden = op !== 'scale'; $('nu-nf').hidden = op !== 'power';
    Array.prototype.forEach.call(root.querySelectorAll('.bad'), function (el) { el.classList.remove('bad'); el.removeAttribute('aria-invalid'); });
    var r = D.OPS[op] ? D.calc({ op: op, A: S.A, B: S.B }) : E.calc({ op: op, A: S.A, B: S.B, k: $('nu-k').value, n: $('nu-n').value });
    if (!r.ok) {
      err.textContent = r.error; out.innerHTML = ''; stp.innerHTML = '<p class="note">Fix the input to see the working.</p>';
      if (r.cell) { var el = r.cell[0] === 'k' ? $('nu-k') : r.cell[0] === 'n' ? $('nu-n') : root.querySelector('input[data-n="' + r.cell[0] + '"][data-i="' + r.cell[1] + '"][data-j="' + r.cell[2] + '"]'); if (el) { el.classList.add('bad'); el.setAttribute('aria-invalid', 'true'); } }
      return;
    }
    err.textContent = '';
    var h = '<div class="res"><div class="sub"><b>' + esc(r.title) + '</b>' + (r.status ? ' \u00b7 ' + esc(r.status) : r.text ? ' \u00b7 ' + r.rows + ' \u00d7 ' + r.cols + ' matrix' : '') + '</div>';
    if (r.lines) h += '<ul class="sol">' + r.lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>';
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
    if (b.dataset.ex) { var d = JSON.parse(b.dataset.ex); S.A = d.A; if (d.B) S.B = d.B; $('nu-op').value = d.op; $('nu-k').value = d.k || '2'; $('nu-n').value = d.n || '2'; build('A'); build('B'); return calc(); }
    if (b.dataset.act === 'reset') { S.A = [['1', '2'], ['3', '4']]; S.B = [['5', '6'], ['7', '8']]; $('nu-op').value = 'add'; $('nu-k').value = '2'; $('nu-n').value = '2'; build('A'); build('B'); calc(); }
  });
  root.addEventListener('input', function (e) { if (e.target.classList.contains('mx') || e.target.id === 'nu-k' || e.target.id === 'nu-n') calc(); });
  root.addEventListener('change', function (e) { var id = e.target.id; if (id === 'nu-op') return calc(); if (/^[rc][AB]$/.test(id)) { var n = id[1]; size(n, +$('r' + n).value, +$('c' + n).value); } });
  root.addEventListener('keydown', function (e) {
    var el = e.target; if (!el.classList.contains('mx')) return; var di = { ArrowUp: -1, ArrowDown: 1, Enter: 1 }[e.key], dj = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (di === undefined && dj === undefined) return; if (dj !== undefined && !(el.selectionStart === el.selectionEnd && (dj < 0 ? el.selectionStart === 0 : el.selectionStart === el.value.length))) return;
    var nx = root.querySelector('input[data-n="' + el.dataset.n + '"][data-i="' + (+el.dataset.i + (di || 0)) + '"][data-j="' + (+el.dataset.j + (dj || 0)) + '"]'); if (nx) { e.preventDefault(); nx.focus(); nx.select(); }
  });
  build('A'); build('B'); calc();
})();
