/* Elecmetric Ratio Calculator: page script for Mode 01 (Ratio Simplifier). Inlined by tools/ratio_page.js after tools/quad_engine.js and tools/ratio_engine.js. */
(function () {
  var $ = function (id) { return document.getElementById(id); }, Rt = window.Ratio, Qd = window.Quad, X = $('ns-r'), PL = $('ns-pl'), err = $('ns-err'), out = $('ns-out'), stp = $('ns-steps'), ver = $('ns-verify'), hist = $('ns-hist'), KEY = 'elecmetric.ratio.simplifier.history';
  var H = [], last = null, timer = 0, DEF = '12:18';
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function mn(s) { return Qd.mn(s); }
  function note(t) { $('ns-note').textContent = t; }
  function copy(t) { var d = function () { note('Copied'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function cp(t, l, txt) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="' + esc(l) + '">' + (txt || 'Copy') + '</button>'; }
  function loadH() { try { var s = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(s)) H = s.filter(function (x) { return x && typeof x.r === 'string' && typeof x.e === 'string'; }).slice(0, 10); } catch (e) { H = []; } }
  function saveH() { try { localStorage.setItem(KEY, JSON.stringify(H)); } catch (e) {} }
  function drawH() {
    if (!H.length) { hist.innerHTML = '<p class="note">Your last ten ratios appear here. They are kept only in this browser.</p>'; return; }
    hist.innerHTML = '<ul class="fh">' + H.map(function (x, i) { return '<li><button type="button" class="chipb" data-h="' + i + '" aria-label="Use again: ' + esc(x.e) + '">' + esc(mn(x.e)) + '</button></li>'; }).join('') + '</ul><button type="button" class="btn2" data-act="clearh">Clear history</button>';
  }
  function push(x) { if (H.length && H[0].r === x.r) return; H.unshift({ r: x.r, e: x.e }); H = H.slice(0, 10); saveH(); drawH(); }
  function mark(bad) { X.classList.toggle('bad', !!bad); X.setAttribute('aria-invalid', String(!!bad)); }
  function table(head, rows) { return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + esc(head.join(', ')) + '"><table class="ns-t"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function flag(t, hot) { return '<span class="ns-flag' + (hot ? ' r' : '') + '">' + esc(t) + '</span>'; }
  function td(s, c) { return '<td' + (c ? ' class="' + c + '"' : '') + '>' + esc(mn(s)) + '</td>'; }
  function preview(r) { $('ns-q').textContent = r && r.ok ? 'Simplify ' + r.enteredText + (r.already ? '' : ' to ' + r.ratioText) : 'Simplify a ratio'; }
  function fail(r) { mark(!r.empty); err.textContent = r.empty ? (r.hint || '') : r.error; err.classList.toggle('ns-hint', !!r.empty); out.innerHTML = ''; ver.innerHTML = ''; last = null; stp.innerHTML = '<p class="note">Enter a ratio to see the working.</p>'; preview(null); }
  function bars(r) {
    var total = r.shareRows.length, html = '<div class="rbar" role="img" aria-label="Shares of the total: ' + esc(r.shareRows.map(function (s, i) { return 'term ' + (i + 1) + ' ' + s.percent; }).join(', ')) + '">';
    r.shareRows.forEach(function (s, i) { var w = Number(r.simplified[i]) / Number(r.total); if (!isFinite(w)) w = 1 / total; html += '<span class="rseg c' + (i % 6) + '" style="flex:' + Math.max(w, 0.0001) + ' 1 0"><b>' + (i + 1) + '</b></span>'; });
    return html + '</div>';
  }
  function render() {
    var r = Rt.simplify({ ratio: X.value, places: PL.value });
    if (!r.ok) return fail(r);
    mark(false); err.textContent = ''; err.classList.remove('ns-hint'); preview(r);
    var rows = r.rows.map(function (x) { return '<tr>' + td(x[0]) + td(x[1], 'r') + td(x[2]) + '</tr>'; });
    var big = '<div class="res"><div class="big"><span class="rbig">' + esc(mn(r.ratioText)) + '</span>' + (r.already ? flag('already simplest', false) : flag('simplified', false)) + cp(r.ratioText, 'Copy the simplified ratio') + '</div><div class="sub">' + esc(mn(r.equation)) + '</div></div>';
    var terms = table(['Term', 'Entered', 'As a fraction', 'Whole-number form', 'Simplified'], r.terms.map(function (t) { return '<tr>' + td(t.term) + td(t.entered) + td(t.asFraction) + td(t.whole, 'r') + td(t.simplified, 'r') + '</tr>'; }));
    var shares = table(['Term', 'Simplified', 'Share of total', 'Decimal', 'Percentage'], r.shareRows.map(function (s) { return '<tr>' + td(s.term) + td(s.simplified, 'r') + td(s.fraction, 'r') + td(s.decimal, 'r') + td(s.percent, 'r') + '</tr>'; }));
    out.innerHTML = big + (r.warnings.length ? '<p class="note ns-warn">' + r.warnings.map(esc).join(' ') + '</p>' : '') + table(['Quantity', 'Result', 'Note'], rows) +
      '<h3 class="rh">Your terms</h3>' + terms + '<h3 class="rh">Share of the total (part to whole)</h3>' + bars(r) + shares + '<p class="note">' + esc(r.sumText) + '. ' + esc(r.notes[0]) + '</p>' +
      '<div class="ns-act">' + cp(r.summary, 'Copy the whole result', 'Copy result') + '<button type="button" class="btn2" data-act="save">Save as .txt</button><button type="button" class="btn2" data-act="print">Print</button></div>';
    stp.innerHTML = '<ol class="steps">' + r.steps.map(function (s) { return '<li>' + esc(mn(s)) + '</li>'; }).join('') + '</ol>';
    ver.innerHTML = '<p>' + (r.verifyOk ? flag('Verified', false) + ' Every check below agrees with the result.' : flag('Check failed', true) + ' A check did not agree. Please report these inputs.') + '</p><ul class="vl">' + r.verify.map(function (v) { return '<li>' + (v[1] ? '\u2713 ' : '\u2717 ') + esc(v[0]) + '</li>'; }).join('') + '</ul>';
    last = { r: X.value.trim(), e: r.already ? r.ratioText : r.enteredText + ' = ' + r.ratioText, text: r.summary };
    clearTimeout(timer); timer = setTimeout(function () { if (last) push(last); }, 1500);
  }
  function saveTxt() { if (!last) return; var b = new Blob([last.text + '\n\nCalculated exactly in the browser by Elecmetric Ratio Calculator (' + location.href.split('#')[0] + ').\n'], { type: 'text/plain;charset=utf-8' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'ratio-simplified.txt'; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); }
  $('ns').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.h) { var x = H[+b.dataset.h]; if (x) { X.value = x.r; render(); } return; }
    if (b.dataset.ex) { X.value = b.dataset.ex; render(); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'save') { saveTxt(); return; }
    if (b.dataset.act === 'clearh') { H = []; saveH(); drawH(); return; }
    if (b.dataset.act === 'reset') { X.value = DEF; PL.value = 'auto'; render(); X.focus(); }
  });
  X.addEventListener('input', render); X.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { clearTimeout(timer); render(); if (last) push(last); } });
  PL.addEventListener('change', render);
  loadH(); drawH(); X.value = DEF; render();
})();
