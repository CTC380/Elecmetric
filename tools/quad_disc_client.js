/* Elecmetric Quadratic Formula Calculator: page script for Mode 02 (Discriminant & Root Analysis). Inlined by tools/quad_disc_page.js after tools/quad_engine.js and tools/quad_disc_engine.js. */
(function () {
  var $ = function (id) { return document.getElementById(id); }, Qd = Quad, QD = QuadDisc, A = $('dq-a'), B = $('dq-b'), C = $('dq-c'), DP = $('dq-dp'), mode = 'analyse', unk = 'c', last = null;
  var RA = $('dr-a'), RB = $('dr-b'), RC = $('dr-c');
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function mn(s) { return Qd.mn(s); }
  function note(t) { $('dq-note').textContent = t; }
  function copy(t) { var d = function () { note('Copied'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function mark(el, msg) { el.classList.toggle('bad', !!msg); el.setAttribute('aria-invalid', String(!!msg)); }
  function table(head, rows) { return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + esc(head.join(', ')) + '"><table class="ns-t"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function flag(t, hot) { return '<span class="ns-flag' + (hot ? ' r' : '') + '">' + esc(t) + '</span>'; }
  function row(a, b, c) { return '<tr><td>' + a + '</td><td class="r">' + esc(mn(b)) + '</td><td>' + (c || '') + '</td></tr>'; }
  function actions(text, file) { return '<div class="ns-act"><button type="button" class="btn2" data-copy="' + esc(text) + '">Copy result</button><button type="button" class="btn2" data-act="save" data-file="' + file + '">Save as .txt</button><button type="button" class="btn2" data-act="print">Print</button></div>'; }
  function xs(r, i) { return r.roots.length > 1 ? 'x' + (i === 0 ? '₁' : '₂') : 'x'; }

  function renderAnalyse() {
    var a = Qd.parseNum(A.value), b = Qd.parseNum(B.value), c = Qd.parseNum(C.value);
    $('dq-eq').textContent = (a.v && b.v && c.v) ? mn(Qd.equationText(a.v, b.v, c.v)) : '';
    var r = QD.analyse({ a: A.value, b: B.value, c: C.value, dp: +DP.value }), out = $('dq-out'), stp = $('dq-steps'), ver = $('dq-verify');
    if (!r.ok) { var e = r.errors || {}; mark(A, e.a); mark(B, e.b); mark(C, e.c); $('dq-err').textContent = r.empty ? '' : (e.a || e.b || e.c || r.error); out.innerHTML = ''; ver.innerHTML = ''; last = null; stp.innerHTML = '<p class="note">Enter A, B and C to see the working.</p>'; return; }
    mark(A, ''); mark(B, ''); mark(C, ''); $('dq-err').textContent = '';
    if (r.degree !== 2) {
      out.innerHTML = '<div class="res"><div class="big"><div class="qroot">No discriminant</div></div><div class="sub">' + esc(r.kind === 'linear' ? 'A = 0: the equation is linear, so there is no discriminant. Its one root is x = ' + mn(r.roots[0].exact) + '.' : r.label + '. With A = 0 there is no quadratic to analyse.') + '</div></div>';
      stp.innerHTML = '<ol class="steps">' + r.steps.map(function (s) { return '<li>' + esc(mn(s)) + '</li>'; }).join('') + '</ol>'; ver.innerHTML = ''; last = null; return;
    }
    var an = r.analysis, s = an.sign, hot = s <= 0, rows = [];
    rows.push(row('Equation', r.equation));
    rows.push(row('Discriminant Δ = B² − 4AC', r.discriminant, flag(s > 0 ? 'Δ > 0' : s === 0 ? 'Δ = 0' : 'Δ < 0', hot)));
    rows.push(row('Nature of the roots', an.label + (s > 0 ? (an.rational ? ', rational' : ', irrational') : '')));
    rows.push(row('Real roots', String(an.distinctReal), flag(s > 0 ? 'two crossings' : s === 0 ? 'touches the x-axis' : 'no crossing', hot)));
    rows.push(row('Factors over the rationals', an.factorsOverQ ? 'yes' : 'no', an.factorsOverR && !an.factorsOverQ ? flag('real factors with radicals') : ''));
    r.roots.forEach(function (x, i) { var same = x.exact === x.dec.text; rows.push(row(xs(r, i) + ' (exact)', x.exact)); if (!same) rows.push(row(xs(r, i) + ' (decimal)', (x.dec.exact ? '' : '≈ ') + x.dec.text)); });
    rows.push(row('Sum of roots, −B/A', Qd.rs(r.sum))); rows.push(row('Product of roots, C/A', Qd.rs(r.product)));
    rows.push(row('Sum of squares, x₁² + x₂²', Qd.rs(an.sumSquares)));
    if (an.recip) rows.push(row('Sum of reciprocals, −B/C', Qd.rs(an.recip)));
    if (s >= 0) { var dd = an.diff.dec(+DP.value); rows.push(row('Distance between roots, √Δ/|A|', an.diff.text + (an.diff.rational ? '' : '  ≈ ' + dd.text))); }
    else { rows.push(row('Real part of the pair', Qd.rs(an.re))); rows.push(row('Imaginary part, ±', an.imag.text + (an.imag.rational ? '' : '  ≈ ' + an.imag.dec(+DP.value).text))); rows.push(row('Modulus of each root, √(C/A)', an.modulus.text + (an.modulus.rational ? '' : '  ≈ ' + an.modulus.dec(+DP.value).text))); }
    rows.push(row('Sign of the roots', an.signs));
    rows.push(row('x-axis', an.xAxis));
    var big = '<div class="qroot">Δ = ' + esc(mn(r.discriminant)) + '</div><div class="qroot">' + esc(an.label) + '</div>';
    var sub = r.roots.map(function (x, i) { return xs(r, i) + ' = ' + mn(x.exact); }).join(',  ');
    var text = QD.summary(r); last = { text: text };
    out.innerHTML = '<div class="res"><div class="big">' + big + '</div><div class="sub">' + esc(sub) + '</div></div>' + (an.nearlyRepeated ? '<p class="note"><b>Close to a repeated root.</b> Δ is not zero, but it is less than a millionth of B², so the two roots are almost equal. The type of root is decided exactly, with no tolerance, and would change with a tiny change in a coefficient.</p>' : '') + table(['Parameter', 'Result', ''], rows) + actions(text, 'discriminant-analysis') +
      (s < 0 ? '<p class="note">Mathematics writes the imaginary unit i; electrical engineering writes j. Replace i with j when you use these roots in a circuit calculation.</p>' : '');
    stp.innerHTML = '<ol class="steps">' + r.steps.concat(r.mode2Steps).map(function (t) { return '<li>' + esc(mn(t)) + '</li>'; }).join('') + '</ol>';
    ver.innerHTML = '<p>' + (an.checkOk ? flag('Verified', false) + ' Every root gives exactly zero when put back into A·x² + B·x + C, and (sum)² − 4(product) equals Δ/A². Both checks use exact arithmetic.' : flag('Check failed', true) + ' A check did not hold. Please report this equation.') + '</p>' +
      '<ul class="vl">' + r.verify.map(function (v, i) { return '<li><b>' + xs(r, i) + ' = ' + esc(mn(v.root)) + '</b>: A·x² + B·x + C = <b>' + esc(mn(v.value)) + '</b> ' + (v.ok ? '✓' : '✗') + '</li>'; }).join('') + '</ul>';
  }

  function renderRange() {
    var names = { a: RA, b: RB, c: RC };
    ['a', 'b', 'c'].forEach(function (k) { names[k].disabled = k === unk; names[k].closest('.ns-f').style.display = k === unk ? 'none' : ''; });
    var g = QD.rangeFor({ unknown: unk, a: RA.value, b: RB.value, c: RC.value, dp: +DP.value }), out = $('dr-out');
    ['a', 'b', 'c'].forEach(function (k) { mark(names[k], g.errors && g.errors[k]); });
    if (!g.ok) { $('dr-err').textContent = g.empty ? '' : g.error; out.innerHTML = ''; last = null; return; }
    $('dr-err').textContent = '';
    var V = g.unknown, rows = g.cases.map(function (c) {
      var ex = c.example ? 'e.g. ' + V + ' = ' + c.example.value + ': ' + c.example.equation + ', Δ = ' + c.example.discriminant + (c.example.roots ? ', roots ' + c.example.roots : '') : (c.possible ? 'the value is irrational, so no whole or fractional example' : '');
      return '<tr><td>' + esc(c.label) + '</td><td class="r">' + (c.possible ? esc(mn(c.condition)) : '<i>' + esc(mn(c.condition)) + '</i>') + '</td><td>' + esc(ex) + '</td></tr>';
    });
    var bp = g.breakpoints.map(function (p) { return '<li><b>' + esc(mn(p.name)) + ' = ' + esc(mn(p.exact)) + '</b>' + (p.approx ? ' ≈ ' + esc(mn(p.dec)) : '') + '</li>'; }).join('');
    var text = QD.rangeSummary(g); last = { text: text };
    out.innerHTML = '<div class="res"><div class="big"><div class="qroot">' + esc(mn(g.formula)) + '</div></div><div class="sub">Known: ' + ['a', 'b', 'c'].filter(function (k) { return k !== unk; }).map(function (k) { return k.toUpperCase() + ' = ' + mn(g.known[k]); }).join(', ') + '</div></div>' +
      table(['Type of roots', 'Values of ' + V, 'Example'], rows) + (bp ? '<p class="ns-l">Boundary values where Δ = 0</p><ul class="vl">' + bp + '</ul>' : '') +
      '<ul class="vl">' + g.notes.map(function (n) { return '<li>' + esc(mn(n)) + '</li>'; }).join('') + '</ul>' + actions(text, 'discriminant-ranges');
  }

  function render() { if (mode === 'analyse') renderAnalyse(); else renderRange(); }
  function setMode(m) {
    mode = m; $('dq-p1').hidden = m !== 'analyse'; $('dq-p2').hidden = m !== 'range'; $('dq-res1').hidden = m !== 'analyse';
    ['analyse', 'range'].forEach(function (k) { var b = document.querySelector('[data-mode="' + k + '"]'); b.classList.toggle('on', k === m); b.setAttribute('aria-pressed', String(k === m)); });
    render();
  }
  function setUnk(u) { unk = u; [RA, RB, RC].forEach(function (el, i) { if (['a', 'b', 'c'][i] !== u && el.value.trim() === '') el.value = el.defaultValue; }); ['a', 'b', 'c'].forEach(function (k) { var b = document.querySelector('[data-unk="' + k + '"]'); b.classList.toggle('on', k === u); b.setAttribute('aria-pressed', String(k === u)); }); render(); }
  $('dq').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.mode) { setMode(b.dataset.mode); return; }
    if (b.dataset.unk) { setUnk(b.dataset.unk); return; }
    if (b.dataset.ex) { var v = JSON.parse(b.dataset.ex); A.value = v.a; B.value = v.b; C.value = v.c; render(); return; }
    if (b.dataset.rex) { var w = JSON.parse(b.dataset.rex); RA.value = w.a; RB.value = w.b; RC.value = w.c; setUnk(w.u); setMode('range'); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'save' && last) { var bl = new Blob([last.text + '\n\nCalculated with Elecmetric Quadratic Formula Calculator, Mode 02\n'], { type: 'text/plain' }), u = URL.createObjectURL(bl), a = document.createElement('a'); a.href = u; a.download = b.dataset.file + '.txt'; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(u); }, 500); return; }
    if (b.dataset.act === 'reset') { [A, B, C, RA, RB, RC].forEach(function (el) { el.value = el.defaultValue; }); DP.value = '8'; unk = 'c'; setUnk('c'); setMode('analyse'); A.focus(); }
  });
  [A, B, C, RA, RB, RC].forEach(function (el) { el.addEventListener('input', render); });
  DP.addEventListener('change', render);
  setUnk('c'); setMode('analyse');
})();
