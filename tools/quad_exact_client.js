/* Elecmetric Quadratic Formula Calculator: page script for Mode 04 (Exact Root & Factorisation). Inlined by tools/quad_exact_page.js after tools/quad_engine.js and tools/quad_exact_engine.js. */
(function () {
  var $ = function (id) { return document.getElementById(id); }, Qd = Quad, QX = QuadExact, mode = 'equation', last = null;
  var F = { equation: [$('ex-a'), $('ex-b'), $('ex-c')], roots: [$('er-a'), $('er-r1'), $('er-r2')], vertex: [$('ev-a'), $('ev-h'), $('ev-k')] }, DP = $('ex-dp');
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function mn(s) { return Qd.mn(s); }
  function note(t) { $('ex-note').textContent = t; }
  function copy(t) { var d = function () { note('Copied'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function mark(el, msg) { el.classList.toggle('bad', !!msg); el.setAttribute('aria-invalid', String(!!msg)); }
  function table(head, rows) { return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + esc(head.join(', ')) + '"><table class="ns-t"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function flag(t, hot) { return '<span class="ns-flag' + (hot ? ' r' : '') + '">' + esc(t) + '</span>'; }
  function row(a, b, c) { return '<tr><td>' + a + '</td><td class="r">' + esc(mn(b)) + '</td><td>' + (c || '') + '</td></tr>'; }
  function actions(text, file) { return '<div class="ns-act"><button type="button" class="btn2" data-copy="' + esc(text) + '">Copy result</button><button type="button" class="btn2" data-act="save" data-file="' + file + '">Save as .txt</button><button type="button" class="btn2" data-act="print">Print</button></div>'; }
  function xs(r, i) { return r.roots.length > 1 ? 'x' + (i === 0 ? '\u2081' : '\u2082') : 'x'; }
  function list(a) { return '<ol class="steps">' + a.map(function (s) { return '<li>' + esc(mn(s)) + '</li>'; }).join('') + '</ol>'; }

  function show(r, out, errEl, inputs, errKeys) {
    var stp = $('ex-steps'), ver = $('ex-verify'), res = $('ex-res');
    if (!r.ok) { var e = r.errors || {}; inputs.forEach(function (el, i) { mark(el, e[errKeys[i]]); }); errEl.textContent = r.empty ? '' : r.error; out.innerHTML = ''; last = null; res.hidden = true; return; }
    inputs.forEach(function (el) { mark(el, ''); }); errEl.textContent = '';
    if (r.noQuadratic) {
      out.innerHTML = '<div class="res"><div class="big"><div class="qroot">Not a quadratic</div></div><div class="sub">' + esc(mn(r.label + (r.roots && r.roots.length ? '. x = ' + r.roots[0].exact : ''))) + '</div></div>';
      res.hidden = true; last = null; return;
    }
    res.hidden = false;
    var f = r.factored, v = r.vertex, rr = r.rational, rows = [];
    rows.push(row('Equation', r.equation));
    if (r.integerForm) rows.push(row('Whole-number form', r.integerForm, flag('common factor ' + r.content.kText)));
    rows.push(row('Factored form', f.text + ' = 0', f.overQ ? flag(f.label) : flag(f.kind === 'complex' ? 'over the complex numbers' : 'over the real numbers', true)));
    if (f.realForm) rows.push(row('Real form', f.realForm + ' = 0', flag('no real factors', true)));
    rows.push(row('Vertex form', v.text + ' = 0'));
    rows.push(row('Vertex (h, k)', '(' + v.hText + ', ' + v.kText + ')', v.hText !== v.hDec || v.kText !== v.kDec ? esc(mn('\u2248 (' + v.hDec + ', ' + v.kDec + ')')) : ''));
    r.roots.forEach(function (x, i) { var same = x.exact === x.dec.text; rows.push(row(xs(r, i) + ' (exact)', x.exact)); if (!same) rows.push(row(xs(r, i) + ' (decimal)', (x.dec.exact ? '' : '\u2248 ') + x.dec.text)); });
    rows.push(row('Sum of roots, \u2212B/A', Qd.rs(r.sum))); rows.push(row('Product of roots, C/A', Qd.rs(r.product)));
    rows.push(row('Factors over the rationals', f.overQ ? 'yes' : 'no', f.overQ ? '' : flag(f.kind === 'complex' ? 'complex roots' : 'irrational roots')));
    var big = '<div class="qroot">' + esc(mn(f.text)) + ' = 0</div><div class="qroot">' + esc(mn(v.text)) + ' = 0</div>';
    var sub = r.roots.map(function (x, i) { return xs(r, i) + ' = ' + mn(x.exact); }).join(',  ');
    var text = QX.summary(r); last = { text: text };
    var rrHtml = '';
    if (rr.enumerated) {
      var cl = rr.list.slice(0, 40).map(function (c) { return '<span class="ns-flag' + (c.root ? '' : ' mute') + '">' + esc(c.text) + (c.root ? ' \u2713' : '') + '</span>'; }).join(' ');
      rrHtml = '<h3>Rational root theorem</h3><p>For ' + esc(mn(rr.whole)) + ' = 0 a rational root p/q has p dividing ' + esc(mn(String(rr.c))) + ' and q dividing ' + esc(String(rr.a)) + '. That leaves ' + rr.count + ' candidates' + (rr.count > 40 ? ' (first 40 shown)' : '') + ', tested exactly: ' + (rr.found.length ? esc(mn(rr.found.map(Qd.rs).join(' and '))) + (rr.found.length > 1 ? ' work.' : ' works.') : 'none works, so there is no rational root.') + '</p><p class="cands">' + cl + '</p>';
    } else if (rr.zeroRoot) rrHtml = '<h3>Rational root theorem</h3><p>C = 0, so x = 0 is a root and the other root comes from the remaining linear factor.</p>';
    else rrHtml = '<h3>Rational root theorem</h3><p>The constant or leading term has too many divisors to list the candidates here. The discriminant test is exact and decides the same question: the roots are ' + (f.overQ ? 'rational.' : 'not rational.') + '</p>';
    out.innerHTML = '<div class="res"><div class="big">' + big + '</div><div class="sub">' + esc(sub) + '</div></div>' + table(['Form', 'Result', ''], rows) + rrHtml + actions(text, 'factored-and-vertex-form') +
      (f.kind === 'complex' ? '<p class="note">Mathematics writes the imaginary unit i; electrical engineering writes j. Replace i with j when you use these factors in a circuit calculation.</p>' : '');
    stp.innerHTML = (r.buildSteps.length ? '<h3>Building the equation</h3>' + list(r.buildSteps) : '') + '<h3>Factoring</h3>' + list(r.factorSteps) + '<h3>Completing the square</h3>' + list(r.completeSquare);
    ver.innerHTML = '<p>' + (r.checkOk ? flag('Verified', false) + ' Every check below holds in exact arithmetic.' : flag('Check failed', true) + ' A check did not hold. Please report this equation.') + '</p><ul class="vl">' + r.checks.map(function (c) { return '<li>' + esc(mn(c.label)) + ' ' + (c.ok ? '\u2713' : '\u2717') + '</li>'; }).join('') + '</ul>';
  }

  function render() {
    var dp = +DP.value;
    if (mode === 'equation') {
      var a = Qd.parseNum(F.equation[0].value), b = Qd.parseNum(F.equation[1].value), c = Qd.parseNum(F.equation[2].value);
      $('ex-eq').textContent = (a.v && b.v && c.v) ? mn(Qd.equationText(a.v, b.v, c.v)) : '';
      show(QX.forms({ a: F.equation[0].value, b: F.equation[1].value, c: F.equation[2].value, dp: dp }), $('ex-out'), $('ex-err'), F.equation, ['a', 'b', 'c']);
    } else if (mode === 'roots') show(QX.fromRoots({ a: F.roots[0].value, r1: F.roots[1].value, r2: F.roots[2].value, dp: dp }), $('er-out'), $('er-err'), F.roots, ['a', 'r1', 'r2']);
    else show(QX.fromVertex({ a: F.vertex[0].value, h: F.vertex[1].value, k: F.vertex[2].value, dp: dp }), $('ev-out'), $('ev-err'), F.vertex, ['a', 'h', 'k']);
  }
  function setMode(m) {
    mode = m; ['equation', 'roots', 'vertex'].forEach(function (k) { $('ex-p-' + k).hidden = k !== m; var b = document.querySelector('[data-mode="' + k + '"]'); b.classList.toggle('on', k === m); b.setAttribute('aria-pressed', String(k === m)); });
    render();
  }
  $('dx').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.mode) { setMode(b.dataset.mode); return; }
    if (b.dataset.ex) { var v = JSON.parse(b.dataset.ex), k = b.dataset.kind || 'equation', f = F[k]; Object.keys(v).forEach(function (key, i) { f[i].value = v[key]; }); setMode(k); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'save' && last) { var bl = new Blob([last.text + '\n\nCalculated with Elecmetric Quadratic Formula Calculator, Mode 04\n'], { type: 'text/plain' }), u = URL.createObjectURL(bl), a = document.createElement('a'); a.href = u; a.download = b.dataset.file + '.txt'; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(u); }, 500); return; }
    if (b.dataset.act === 'reset') { [].concat(F.equation, F.roots, F.vertex).forEach(function (el) { el.value = el.defaultValue; }); DP.value = '8'; setMode('equation'); F.equation[0].focus(); }
  });
  [].concat(F.equation, F.roots, F.vertex).forEach(function (el) { el.addEventListener('input', render); });
  DP.addEventListener('change', render);
  setMode('equation');
})();
