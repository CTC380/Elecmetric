/* Elecmetric Log Calculator: page script for Mode 01 (Universal Log Calculator). Inlined by tools/log_page.js after tools/quad_engine.js and tools/log_engine.js. */
(function () {
  var $ = function (id) { return document.getElementById(id); }, Qd = Quad, Lg = window.Lg, B = $('nu-b'), X = $('nu-x'), DP = $('nu-dp'), eqEl = $('nu-eq'), out = $('nu-out'), stp = $('nu-steps'), ver = $('nu-verify'), hist = $('nu-hist'), KEY = 'elecmetric.log.history', H = [], last = null, timer = 0;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function mn(s) { return Qd.mn(s); }
  function note(t) { $('nu-note').textContent = t; }
  function copy(t) { var d = function () { note('Copied'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function cp(t, l, txt) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="' + esc(l) + '">' + (txt || 'Copy') + '</button>'; }
  function loadH() { try { var s = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(s)) H = s.filter(function (x) { return x && typeof x.b === 'string' && typeof x.x === 'string' && typeof x.r === 'string' && typeof x.eq === 'string'; }).slice(0, 10); } catch (e) { H = []; } }
  function saveH() { try { localStorage.setItem(KEY, JSON.stringify(H)); } catch (e) {} }
  function drawH() {
    if (!H.length) { hist.innerHTML = '<p class="note">Your last ten calculations appear here. They are kept only in this browser.</p>'; return; }
    hist.innerHTML = '<ul class="fh">' + H.map(function (x, i) { return '<li><button type="button" class="chipb" data-h="' + i + '" aria-label="Use again: ' + esc(x.eq) + '">' + esc(mn(x.eq)) + '</button></li>'; }).join('') + '</ul><button type="button" class="btn2" data-act="clearh">Clear history</button>';
  }
  function push(x) { if (H.length && H[0].b === x.b && H[0].x === x.x) return; H.unshift(x); H = H.slice(0, 10); saveH(); drawH(); }
  function mark(el, msg) { el.classList.toggle('bad', !!msg); el.setAttribute('aria-invalid', String(!!msg)); }
  function table(head, rows) { return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + esc(head.join(', ')) + '"><table class="ns-t"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function flag(t, hot) { return '<span class="ns-flag' + (hot ? ' r' : '') + '">' + esc(t) + '</span>'; }
  function preview() {
    var r = Lg.calc({ b: B.value, x: X.value, dp: +DP.value });
    eqEl.textContent = r.ok ? mn(r.equation) : '';
  }
  function fail(r) {
    var e = r.errors || {}; mark(B, e.b); mark(X, e.x);
    $('nu-err').textContent = r.empty ? '' : (e.b || e.x || r.error);
    eqEl.textContent = ''; out.innerHTML = ''; ver.innerHTML = ''; last = null; stp.innerHTML = '<p class="note">Enter a base and a number to see the working.</p>';
  }
  function render() {
    var r = Lg.calc({ b: B.value, x: X.value, dp: +DP.value });
    if (!r.ok) return fail(r);
    mark(B, ''); mark(X, ''); $('nu-err').textContent = ''; eqEl.textContent = mn(r.equation);
    var row = function (a, b, c) { return '<tr><td>' + a + '</td><td class="r">' + esc(mn(b)) + '</td><td>' + (c || '') + '</td></tr>'; };
    var rows = [row('Logarithm y', r.yText, flag(r.status === 'rational' ? 'exact' : r.status === 'irrational' ? 'irrational, rounded to ' + r.dp + ' places' : 'rounded to ' + r.dp + ' places', r.status !== 'rational'))];
    if (r.exact !== null && r.exact !== r.y.text) rows.push(row('Exact fraction', r.exact));
    rows.push(row('Equivalent exponential equation', r.expEq));
    rows.push(row('Change of base', r.changeOfBase));
    rows.push(row('Common logarithm, log\u2081\u2080 x', r.common.text)); rows.push(row('Natural logarithm, ln x', r.natural.text)); rows.push(row('Binary logarithm, log\u2082 x', r.binary.text));
    var big = '<div class="qroot">' + esc(mn(r.equation)) + '</div>', sub = esc(r.label) + ' \u00b7 ' + esc(mn(r.expEq));
    out.innerHTML = '<div class="res"><div class="big">' + big + '</div><div class="sub">' + sub + '</div></div>' + table(['Quantity', 'Result', ''], rows) +
      '<div class="ns-act">' + cp(r.summary, 'Copy the whole result', 'Copy result') + '<button type="button" class="btn2" data-act="save">Save as .txt</button><button type="button" class="btn2" data-act="print">Print</button></div>';
    stp.innerHTML = '<ol class="steps">' + r.steps.map(function (s) { return '<li>' + esc(mn(s)) + '</li>'; }).join('') + '</ol>';
    ver.innerHTML = '<p>' + (r.verifyOk ? flag('Verified', false) + ' Every check below agrees with the result.' : flag('Check failed', true) + ' A check did not agree. Please report these inputs.') + '</p><ul class="vl">' + r.verify.map(function (v) { return '<li>' + esc(mn(v.text)) + ' ' + (v.ok ? '\u2713' : '\u2717') + '</li>'; }).join('') + '</ul>' + (r.verify.length ? '' : '<p class="note">The double-precision check is skipped when the base or the number is too close to 1 or too large for it to be reliable.</p>');
    last = { b: B.value.trim(), x: X.value.trim(), eq: r.equation, r: r.yText, text: r.summary };
    clearTimeout(timer); timer = setTimeout(function () { if (last) push(last); }, 1500);
  }
  $('nu').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.h) { var x = H[+b.dataset.h]; if (x) { B.value = x.b; X.value = x.x; render(); } return; }
    if (b.dataset.ex) { var v = JSON.parse(b.dataset.ex); B.value = v.b; X.value = v.x; render(); return; }
    if (b.dataset.base) { B.value = b.dataset.base; render(); X.focus(); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'save' && last) { var bl = new Blob([last.text + '\n\nCalculated with Elecmetric Log Calculator\n'], { type: 'text/plain' }), u = URL.createObjectURL(bl), a = document.createElement('a'); a.href = u; a.download = 'log-result.txt'; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(u); }, 500); return; }
    if (b.dataset.act === 'clearh') { H = []; saveH(); drawH(); return; }
    if (b.dataset.act === 'reset') { B.value = B.defaultValue; X.value = X.defaultValue; DP.value = '8'; render(); B.focus(); }
  });
  [B, X].forEach(function (el) { el.addEventListener('input', render); el.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { clearTimeout(timer); render(); if (last) push(last); } }); });
  DP.addEventListener('change', render);
  loadH(); drawH(); render();
})();
