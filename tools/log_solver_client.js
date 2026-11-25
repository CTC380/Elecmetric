/* Elecmetric Log Calculator: page script for Mode 03 (Missing Value Solver). Inlined by tools/log_solver_page.js after the Quad, Lg, ExponentFrac, Antilog and LogSolver engines. */
(function () {
  var $ = function (id) { return document.getElementById(id); }, Qd = Quad, Sv = window.LogSolver, B = $('nu-b'), X = $('nu-x'), Y = $('nu-y'), DP = $('nu-sig'), eqEl = $('nu-eq'), out = $('nu-out'), stp = $('nu-steps'), ver = $('nu-verify'), hist = $('nu-hist'), KEY = 'elecmetric.logsolver.history', H = [], last = null, timer = 0;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function mn(s) { return Qd.mn(s); }
  function note(t) { $('nu-note').textContent = t; }
  function copy(t) { var d = function () { note('Copied'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function cp(t, l, txt) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="' + esc(l) + '">' + (txt || 'Copy') + '</button>'; }
  function label(x) { return 'log b = ' + (x.b || '?') + ', x = ' + (x.x || '?') + ', y = ' + (x.y || '?'); }
  function loadH() { try { var s = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(s)) H = s.filter(function (x) { return x && typeof x.b === 'string' && typeof x.x === 'string' && typeof x.y === 'string' && typeof x.t === 'string'; }).slice(0, 10); } catch (e) { H = []; } }
  function saveH() { try { localStorage.setItem(KEY, JSON.stringify(H)); } catch (e) {} }
  function drawH() {
    if (!H.length) { hist.innerHTML = '<p class="note">Your last ten calculations appear here. They are kept only in this browser.</p>'; return; }
    hist.innerHTML = '<ul class="fh">' + H.map(function (x, i) { return '<li><button type="button" class="chipb" data-h="' + i + '" aria-label="Use again: ' + esc(x.t) + '">' + esc(mn(x.t)) + '</button></li>'; }).join('') + '</ul><button type="button" class="btn2" data-act="clearh">Clear history</button>';
  }
  function push(x) { if (H.length && H[0].b === x.b && H[0].x === x.x && H[0].y === x.y) return; H.unshift(x); H = H.slice(0, 10); saveH(); drawH(); }
  function mark(el, msg) { el.classList.toggle('bad', !!msg); el.setAttribute('aria-invalid', String(!!msg)); }
  function table(head, rows) { return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + esc(head.join(', ')) + '"><table class="ns-t"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function flag(t, hot) { return '<span class="ns-flag' + (hot ? ' r' : '') + '">' + esc(t) + '</span>'; }
  function read() { return Sv.run({ b: B.value, x: X.value, y: Y.value, sig: +DP.value }); }
  function hint() {
    var n = (B.value.trim() ? 0 : 1) + (X.value.trim() ? 0 : 1) + (Y.value.trim() ? 0 : 1);
    return n === 1 ? 'Finding ' + (!B.value.trim() ? 'the base b' : !X.value.trim() ? 'the argument x' : 'the logarithm y') + '.' : n === 0 ? 'All three values are filled: checking whether the equation holds.' : 'Leave exactly one field blank.';
  }
  function fail(r) {
    var e = r.errors || {}; mark(B, e.b); mark(X, e.x); mark(Y, e.y);
    $('nu-err').textContent = r.empty ? '' : (e.b || e.x || e.y || r.error);
    eqEl.textContent = r.needMore ? hint() : ''; out.innerHTML = ''; ver.innerHTML = ''; last = null; stp.innerHTML = '<p class="note">Enter any two of b, x and y to see the working.</p>';
  }
  function render() {
    var r = read();
    if (!r.ok) return fail(r);
    mark(B, ''); mark(X, ''); mark(Y, ''); $('nu-err').textContent = '';
    eqEl.textContent = hint();
    var row = function (a, b, c) { return '<tr><td>' + a + '</td><td class="r">' + esc(mn(b)) + '</td><td>' + (c || '') + '</td></tr>'; };
    var rows = [], hot = r.cls === 'none' || (r.cls === 'check' && !r.holds);
    rows.push(row('Classification', r.clsText, flag(r.cls === 'unique' ? 'unique' : r.cls === 'check' ? (r.holds ? 'consistent' : 'inconsistent') : r.cls, hot || r.cls === 'indeterminate')));
    if (r.cls === 'unique') {
      rows.push(row('Result type', r.label, flag(r.status === 'rational' ? 'exact' : r.status === 'irrational' ? 'irrational, rounded to ' + (r.find === 'y' ? r.dp + ' decimal places' : r.sig + ' significant digits') : r.status === 'undetermined' ? 'exactness not decided' : 'rational, too long to print in full', r.status !== 'rational')));
      if (r.exact !== null && r.exact !== undefined && /\//.test(r.exact)) rows.push(row('Exact fraction', r.exact));
      if (r.sci && (r.status !== 'rational' || !/^-?\d{1,6}$/.test(r.exact || ''))) rows.push(row('Scientific notation', r.sci));
      if (r.radical) rows.push(row('Simplest radical form', r.radical));
      if (r.expEq) rows.push(row('Equivalent exponential equation', r.expEq));
      (r.rows || []).forEach(function (q) { rows.push(row(q[0], q[1])); });
    } else (r.rows || []).forEach(function (q) { rows.push(row(q[0], q[1])); });
    var big = '<div class="qroot">' + esc(mn(r.headline)) + '</div>' + (r.eq && r.cls !== 'check' ? '<div class="qroot">' + esc(mn(r.eq)) + '</div>' : '');
    var sub = esc(r.cls === 'check' ? (r.holds ? 'The three values are consistent' : 'The three values are not consistent') : r.label) + (r.expEq ? ' \u00b7 ' + esc(mn(r.expEq)) : '');
    out.innerHTML = '<div class="res"><div class="big">' + big + '</div><div class="sub">' + sub + '</div></div>' + (r.note ? '<p class="note ns-msg">' + esc(mn(r.note)) + '</p>' : '') + table(['Quantity', 'Result', ''], rows) +
      '<div class="ns-act">' + cp(r.summary, 'Copy the whole result', 'Copy result') + '<button type="button" class="btn2" data-act="save">Save as .txt</button><button type="button" class="btn2" data-act="print">Print</button></div>';
    stp.innerHTML = '<ol class="steps">' + r.steps.map(function (s) { return '<li>' + esc(mn(s)) + '</li>'; }).join('') + '</ol>';
    ver.innerHTML = r.verify.length ? '<p>' + (r.verifyOk ? flag('Verified', false) + ' Every check below agrees with the result.' : flag('Check failed', true) + ' A check did not agree. Please report these inputs.') + '</p><ul class="vl">' + r.verify.map(function (v) { return '<li>' + esc(mn(v.text)) + ' ' + (v.ok ? '\u2713' : '\u2717') + '</li>'; }).join('') + '</ul>' : '<p class="note">There is nothing to verify: this case has no value to check, and the reason is given in the working above.</p>';
    last = { b: B.value.trim(), x: X.value.trim(), y: Y.value.trim(), t: r.headline + (r.eq && r.cls !== 'check' ? ' (' + r.eq + ')' : ''), text: r.summary };
    clearTimeout(timer); timer = setTimeout(function () { if (last) push(last); }, 1500);
  }
  function setAll(v) { B.value = v.b; X.value = v.x; Y.value = v.y; render(); }
  $('nu').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.h) { var x = H[+b.dataset.h]; if (x) setAll(x); return; }
    if (b.dataset.ex) { setAll(JSON.parse(b.dataset.ex)); return; }
    if (b.dataset.base) { B.value = b.dataset.base; render(); (X.value.trim() ? Y : X).focus(); return; }
    if (b.dataset.clear) { $('nu-' + b.dataset.clear).value = ''; render(); $('nu-' + b.dataset.clear).focus(); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'save' && last) { var bl = new Blob([last.text + '\n\nCalculated with Elecmetric Log Calculator, Mode 03 (Missing Value Solver)\n'], { type: 'text/plain' }), u = URL.createObjectURL(bl), a = document.createElement('a'); a.href = u; a.download = 'log-solver-result.txt'; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(u); }, 500); return; }
    if (b.dataset.act === 'clearh') { H = []; saveH(); drawH(); return; }
    if (b.dataset.act === 'reset') { B.value = B.defaultValue; X.value = X.defaultValue; Y.value = Y.defaultValue; DP.value = '10'; render(); B.focus(); }
  });
  [B, X, Y].forEach(function (el) { el.addEventListener('input', render); el.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { clearTimeout(timer); render(); if (last) push(last); } }); });
  DP.addEventListener('change', render);
  loadH(); drawH(); render();
})();
