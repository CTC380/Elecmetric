/* Elecmetric Quadratic Formula Calculator: page script for Mode 01 (Quadratic Equation Solver). Inlined by tools/quad_page.js after tools/quad_engine.js. */
(function () {
  var $ = function (id) { return document.getElementById(id); }, Qd = Quad, A = $('nu-a'), B = $('nu-b'), C = $('nu-c'), DP = $('nu-dp'), eqEl = $('nu-eq'), out = $('nu-out'), stp = $('nu-steps'), ver = $('nu-verify'), hist = $('nu-hist'), KEY = 'elecmetric.quadratic.history', H = [], last = null, timer = 0;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function mn(s) { return Qd.mn(s); }
  function note(t) { $('nu-note').textContent = t; }
  function copy(t) { var d = function () { note('Copied'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function cp(t, l, txt) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="' + esc(l) + '">' + (txt || 'Copy') + '</button>'; }
  function loadH() { try { var s = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(s)) H = s.filter(function (x) { return x && typeof x.a === 'string' && typeof x.b === 'string' && typeof x.c === 'string' && typeof x.r === 'string'; }).slice(0, 10); } catch (e) { H = []; } }
  function saveH() { try { localStorage.setItem(KEY, JSON.stringify(H)); } catch (e) {} }
  function drawH() {
    if (!H.length) { hist.innerHTML = '<p class="note">Your last ten equations appear here. They are kept only in this browser.</p>'; return; }
    hist.innerHTML = '<ul class="fh">' + H.map(function (x, i) { return '<li><button type="button" class="chipb" data-h="' + i + '" aria-label="Use again: ' + esc(x.eq) + '">' + esc(mn(x.eq)) + ' \u2192 <b>' + esc(mn(x.r)) + '</b></button></li>'; }).join('') + '</ul><button type="button" class="btn2" data-act="clearh">Clear history</button>';
  }
  function push(x) { if (H.length && H[0].a === x.a && H[0].b === x.b && H[0].c === x.c) return; H.unshift(x); H = H.slice(0, 10); saveH(); drawH(); }
  function mark(el, msg) { el.classList.toggle('bad', !!msg); el.setAttribute('aria-invalid', String(!!msg)); }
  function table(head, rows) { return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + esc(head.join(', ')) + '"><table class="ns-t"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function flag(t, hot) { return '<span class="ns-flag' + (hot ? ' r' : '') + '">' + esc(t) + '</span>'; }
  function preview() {
    var a = Qd.parseNum(A.value), b = Qd.parseNum(B.value), c = Qd.parseNum(C.value);
    eqEl.textContent = (a.v && b.v && c.v) ? mn(Qd.equationText(a.v, b.v, c.v)) : '';
  }
  function fail(r) {
    var e = r.errors || {}; mark(A, e.a); mark(B, e.b); mark(C, e.c);
    $('nu-err').textContent = r.empty ? '' : (e.a || e.b || e.c || r.error);
    out.innerHTML = ''; ver.innerHTML = ''; last = null; stp.innerHTML = '<p class="note">Enter A, B and C to see the working.</p>';
  }
  function xs(r, i) { return r.roots.length > 1 ? 'x' + (i === 0 ? '\u2081' : '\u2082') : 'x'; }
  function render() {
    preview();
    var r = Qd.solve({ a: A.value, b: B.value, c: C.value, dp: +DP.value });
    if (!r.ok) return fail(r);
    mark(A, ''); mark(B, ''); mark(C, ''); $('nu-err').textContent = '';
    var rows = [], big = '', sub = '', row = function (a, b, c) { return '<tr><td>' + a + '</td><td class="r">' + esc(mn(b)) + '</td><td>' + (c || '') + '</td></tr>'; };
    rows.push(row('Equation', r.equation));
    if (r.degree === 2) { rows.push(row('Discriminant \u0394 = B\u00b2 \u2212 4AC', r.discriminant, flag(r.D.n > 0n ? '\u0394 > 0' : r.D.n === 0n ? '\u0394 = 0' : '\u0394 < 0', r.D.n <= 0n))); }
    rows.push(row('Type of solution', r.label));
    if (r.degree === 2) {
      r.roots.forEach(function (x, i) {
        var nm = xs(r, i), same = x.exact === x.dec.text;
        rows.push(row(nm + ' (exact)', x.exact, r.kind === 'repeated' ? flag('repeated', true) : ''));
        if (!same) rows.push(row(nm + ' (decimal)', (x.dec.exact ? '' : '\u2248 ') + x.dec.text, x.dec.exact ? flag('exact') : flag('rounded to ' + r.dp + ' places', true)));
      });
      rows.push(row('Sum of roots, \u2212B/A', Qd.rs(r.sum))); rows.push(row('Product of roots, C/A', Qd.rs(r.product)));
      rows.push(row('Vertex (h, k)', '(' + Qd.rs(r.vertex.x) + ', ' + Qd.rs(r.vertex.y) + ')')); rows.push(row('Axis of symmetry', 'x = ' + Qd.rs(r.axis)));
      rows.push(row('y-intercept', '(0, ' + Qd.rs(r.yint) + ')')); rows.push(row('Parabola opens', r.opens === 'up' ? 'upward' : 'downward', flag(r.extremum + ' value ' + mn(Qd.rs(r.extremumValue)))));
      big = r.roots.map(function (x, i) { return '<div class="qroot">' + xs(r, i) + ' = ' + esc(mn(x.exact)) + '</div>'; }).join('');
      sub = esc(mn(r.label)) + ' \u00b7 \u0394 = ' + esc(mn(r.discriminant));
      if (r.roots.some(function (x) { return x.exact !== x.dec.text; })) sub += ' \u00b7 ' + r.roots.map(function (x, i) { return xs(r, i) + (x.dec.exact ? ' = ' : ' \u2248 ') + mn(x.dec.text); }).join(', ');
    } else if (r.kind === 'linear') {
      rows.push(row('x (exact)', r.roots[0].exact)); if (r.roots[0].exact !== r.roots[0].dec.text) rows.push(row('x (decimal)', (r.roots[0].dec.exact ? '' : '\u2248 ') + r.roots[0].dec.text));
      big = '<div class="qroot">x = ' + esc(mn(r.roots[0].exact)) + '</div>'; sub = 'A = 0: this is a linear equation, so there is one root';
    } else { big = '<div class="qroot">' + esc(r.label) + '</div>'; sub = r.kind === 'none' ? 'A and B are zero and C is not, so 0 = C is never true' : 'A, B and C are all zero, so 0 = 0 holds for every x'; }
    var text = Qd.summary(r);
    out.innerHTML = '<div class="res"><div class="big">' + big + '</div><div class="sub">' + sub + '</div></div>' + table(['Parameter', 'Result', ''], rows) +
      '<div class="ns-act">' + cp(text, 'Copy the whole result', 'Copy result') + '<button type="button" class="btn2" data-act="save">Save as .txt</button><button type="button" class="btn2" data-act="print">Print</button></div>' +
      (r.degree === 2 && r.kind === 'complex' ? '<p class="note">The roots are a complex conjugate pair. Mathematics writes the imaginary unit i; electrical engineering writes j. Replace i with j when you use these in a circuit calculation.</p>' : '') +
      (r.radicandFull === false ? '<p class="note">The number under the root has a large factor that was not tested for square parts, so the exact form may be reducible further. The decimal values are correct.</p>' : '');
    var st = r.steps.slice(); stp.innerHTML = '<ol class="steps">' + st.map(function (s) { return '<li>' + esc(mn(s)) + '</li>'; }).join('') + '</ol>';
    if (r.verify) {
      ver.innerHTML = '<p>' + (r.verifyOk ? flag('Verified', false) + ' Each root was put back into A\u00b7x\u00b2 + B\u00b7x + C in exact arithmetic and gives zero.' : flag('Check failed', true) + ' A root did not give zero. Please report this equation.') + '</p>' +
        '<ul class="vl">' + r.verify.map(function (v, i) { var nm = r.roots.length > 1 ? 'x' + (i === 0 ? '\u2081' : '\u2082') : 'x'; return '<li><b>' + nm + ' = ' + esc(mn(v.root)) + '</b>: ' + (v.parts ? esc(mn(v.parts[0] + ' + ' + v.parts[1] + ' + ' + v.parts[2])) + ' = ' : 'A\u00b7x\u00b2 + B\u00b7x + C = ') + '<b>' + esc(mn(v.value)) + '</b> ' + (v.ok ? '\u2713' : '\u2717') + '</li>'; }).join('') + '</ul>';
    } else ver.innerHTML = '<p class="note">There is no root to substitute for this equation.</p>';
    last = { a: A.value.trim(), b: B.value.trim(), c: C.value.trim(), eq: r.equation, r: r.kind === 'none' || r.kind === 'indeterminate' ? r.label : r.roots.map(function (x) { return x.exact; }).join(', '), text: text };
    clearTimeout(timer); timer = setTimeout(function () { if (last) push(last); }, 1500);
  }
  $('nu').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.h) { var x = H[+b.dataset.h]; if (x) { A.value = x.a; B.value = x.b; C.value = x.c; render(); } return; }
    if (b.dataset.ex) { var v = JSON.parse(b.dataset.ex); A.value = v.a; B.value = v.b; C.value = v.c; render(); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'save' && last) { var bl = new Blob([last.text + '\n\nCalculated with Elecmetric Quadratic Formula Calculator\n'], { type: 'text/plain' }), u = URL.createObjectURL(bl), a = document.createElement('a'); a.href = u; a.download = 'quadratic-result.txt'; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(u); }, 500); return; }
    if (b.dataset.act === 'clearh') { H = []; saveH(); drawH(); return; }
    if (b.dataset.act === 'reset') { A.value = A.defaultValue; B.value = B.defaultValue; C.value = C.defaultValue; DP.value = '8'; render(); A.focus(); }
  });
  [A, B, C].forEach(function (el) { el.addEventListener('input', render); el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { clearTimeout(timer); render(); if (last) push(last); } }); });
  DP.addEventListener('change', render);
  loadH(); drawH(); render();
})();
