/* Elecmetric Ratio Calculator: page script for Mode 03 (Equivalent Ratio Generator). Inlined by tools/equiv_page.js after tools/quad_engine.js, tools/ratio_engine.js and tools/equiv_engine.js. */
(function () {
  var $ = function (id) { return document.getElementById(id); }, Eq = window.Equiv, Qd = window.Quad, X = $('ns-r'), OP = $('ns-op'), MU = $('ns-m'), FA = $('ns-f'), TI = $('ns-ti'), TV = $('ns-tv'), err = $('ns-err'), out = $('ns-out'), stp = $('ns-steps'), ver = $('ns-verify'), hist = $('ns-hist'), KEY = 'elecmetric.ratio.equivalent.history';
  var FIELD = { ratio: X, op: OP, mults: MU, factor: FA, divisor: FA, term: TI, target: TV };
  var H = [], last = null, timer = 0, DEF = { r: '2:3', op: 'table', m: '1, 2, 3, 4, 5, 10', f: '2', ti: '1', tv: '100' };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function mn(s) { return Qd.mn(s); }
  function note(t) { $('ns-note').textContent = t; }
  function copy(t) { var d = function () { note('Copied'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function cp(t, l, txt) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="' + esc(l) + '">' + (txt || 'Copy') + '</button>'; }
  function state() { return { r: X.value, op: OP.value, m: MU.value, f: FA.value, ti: TI.value, tv: TV.value }; }
  function setState(s) { X.value = s.r; OP.value = s.op; MU.value = s.m; FA.value = s.f; syncTerms(); TI.value = s.ti; TV.value = s.tv; }
  function key(s) { return [s.r, s.op, s.op === 'table' ? s.m : s.op === 'target' ? s.ti + '/' + s.tv : s.f].join('|'); }
  function loadH() { try { var s = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(s)) H = s.filter(function (x) { return x && x.s && typeof x.s.r === 'string' && typeof x.e === 'string'; }).slice(0, 10); } catch (e) { H = []; } }
  function saveH() { try { localStorage.setItem(KEY, JSON.stringify(H)); } catch (e) {} }
  function drawH() {
    if (!H.length) { hist.innerHTML = '<p class="note">Your last ten ratios appear here. They are kept only in this browser.</p>'; return; }
    hist.innerHTML = '<ul class="fh">' + H.map(function (x, i) { return '<li><button type="button" class="chipb" data-h="' + i + '" aria-label="Use again: ' + esc(x.e) + '">' + esc(mn(x.e)) + '</button></li>'; }).join('') + '</ul><button type="button" class="btn2" data-act="clearh">Clear history</button>';
  }
  function push(x) { if (H.length && key(H[0].s) === key(x.s)) return; H.unshift(x); H = H.slice(0, 10); saveH(); drawH(); }
  function mark(f) { Object.keys(FIELD).forEach(function (k) { var b = k === f; FIELD[k].classList.toggle('bad', b); FIELD[k].setAttribute('aria-invalid', String(b)); }); }
  function table(head, rows) { return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + esc(head.join(', ')) + '"><table class="ns-t"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function flag(t, hot) { return '<span class="ns-flag' + (hot ? ' r' : '') + '">' + esc(t) + '</span>'; }
  function td(s, c) { return '<td' + (c ? ' class="' + c + '"' : '') + '>' + esc(mn(s)) + '</td>'; }
  function syncTerms() {
    var cnt = Math.max(2, (X.value.split(/[:\u2236\uff1a]/).length) || 2), keep = TI.value; cnt = Math.min(cnt, 12);
    if (TI.options.length !== cnt) { TI.innerHTML = ''; for (var i = 1; i <= cnt; i++) { var o = document.createElement('option'); o.value = String(i); o.textContent = 'Term ' + i; TI.appendChild(o); } }
    if (+keep >= 1 && +keep <= cnt) TI.value = keep;
  }
  function showFields() {
    var o = OP.value; $('ns-fm').hidden = o !== 'table'; $('ns-ff').hidden = !(o === 'multiply' || o === 'divide'); $('ns-ft').hidden = o !== 'target';
    $('ns-fl').textContent = o === 'divide' ? 'Divide every term by' : 'Multiply every term by';
  }
  function preview(r) { $('ns-q').textContent = r && r.ok ? 'Equivalent ratios of ' + r.enteredText : 'Equivalent ratios of a ratio'; }
  function fail(r) { mark(r.empty ? '' : r.field); err.textContent = r.empty ? (r.hint || '') : r.error; err.classList.toggle('ns-hint', !!r.empty); out.innerHTML = ''; ver.innerHTML = ''; last = null; stp.innerHTML = '<p class="note">Enter a ratio to see the working.</p>'; preview(null); }
  function bar(r) {
    var tot = r.simplified.reduce(function (a, s) { return a + Number(s); }, 0), html = '<div class="rbar" role="img" aria-label="' + esc('Shape of the ratio ' + r.ratioText + ', the same for every equivalent ratio') + '">';
    r.simplified.forEach(function (s, i) { var w = tot > 0 && isFinite(tot) ? Number(s) / tot : 1 / r.simplified.length; html += '<span class="rseg c' + (i % 6) + '" style="flex:' + Math.max(w, 0.0001) + ' 1 0"><b>' + (i + 1) + '</b></span>'; });
    return html + '</div>';
  }
  function render() {
    var s = state(), r = Eq.generate({ ratio: s.r, op: s.op, mults: s.m, factor: s.f, divisor: s.f, term: s.ti, target: s.tv });
    if (!r.ok) return fail(r);
    mark(''); err.textContent = ''; err.classList.remove('ns-hint'); preview(r);
    var big = '<div class="res"><div class="big"><span class="rbig">' + esc(mn(r.op === 'table' ? r.headline : r.first.ratio)) + '</span>' + flag(r.op === 'table' ? 'equivalent' : 'scaled', false) + (r.op === 'table' ? '' : cp(r.first.ratio, 'Copy the equivalent ratio')) + '</div><div class="sub">' + esc(mn(r.op === 'table' ? 'Simplest form ' + r.ratioText : r.sentence)) + '</div></div>';
    var main;
    if (r.op === 'table') main = '<h3 class="rh">Equivalent ratios</h3>' + table(['Multiplier', 'Equivalent ratio', 'Whole numbers?'], r.rows.map(function (x) { return '<tr>' + td(x.lab) + td(x.ratio, 'r') + td(x.whole ? 'yes' : 'no') + '</tr>'; }));
    else main = '<h3 class="rh">Term by term</h3>' + table(['Term', 'Entered', 'Scale factor', 'Result'], r.terms.map(function (t, i) { return '<tr' + (r.targetTerm === i + 1 ? ' class="hl"' : '') + '>' + td(t.term) + td(t.entered) + td(r.first.factor) + td(r.first.terms[i], 'r') + '</tr>'; })) + (r.op === 'target' ? '<p class="note">The scale factor is ' + esc(mn(r.first.factor)) + '. Term ' + r.targetTerm + ' is set to the target value.</p>' : '');
    var down = r.down ? '<h3 class="rh">Scaling down: whole-number equivalents</h3>' + table(['From the whole-number form', 'Equivalent ratio', 'Note'], r.down.map(function (x) { return '<tr>' + td(x.lab.replace(/^\u00d7 /, '\u00f7 ').replace(/^\u00f7 1$/, 'as entered')) + td(x.ratio, 'r') + td(x.simplest ? 'simplest form' : '') + '</tr>'; })) + (r.downNote ? '<p class="note">' + esc(r.downNote) + '</p>' : '') : '<p class="note">' + esc(r.downNote) + '</p>';
    out.innerHTML = big + (r.warnings.length ? '<p class="note ns-warn">' + r.warnings.map(esc).join(' ') + '</p>' : '') + main + down + '<h3 class="rh">The shape is the same for every result</h3>' + bar(r) + '<p class="note">' + esc(r.notes[0]) + '</p>' +
      '<div class="ns-act">' + cp(r.summary, 'Copy the whole result', 'Copy result') + '<button type="button" class="btn2" data-act="save">Save as .txt</button><button type="button" class="btn2" data-act="print">Print</button></div>';
    stp.innerHTML = '<ol class="steps">' + r.steps.map(function (t) { return '<li>' + esc(mn(t)) + '</li>'; }).join('') + '</ol>';
    ver.innerHTML = '<p>' + (r.verifyOk ? flag('Verified', false) + ' Every check below agrees with the result.' : flag('Check failed', true) + ' A check did not agree. Please report these inputs.') + '</p><ul class="vl">' + r.verify.map(function (v) { return '<li>' + (v[1] ? '\u2713 ' : '\u2717 ') + esc(mn(v[0])) + '</li>'; }).join('') + '</ul>';
    last = { s: s, e: r.sentence, text: r.summary };
    clearTimeout(timer); timer = setTimeout(function () { if (last) push(last); }, 1500);
  }
  function saveTxt() { if (!last) return; var b = new Blob([last.text + '\n\nCalculated exactly in the browser by Elecmetric Ratio Calculator (' + location.href.split('#')[0] + ').\n'], { type: 'text/plain;charset=utf-8' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'equivalent-ratios.txt'; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); }
  function again() { syncTerms(); showFields(); render(); }
  $('ns').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.h) { var x = H[+b.dataset.h]; if (x) { setState(x.s); again(); } return; }
    if (b.dataset.ex) { var p = b.dataset.ex.split('|'); setState({ r: p[0], op: p[1], m: p[2] || DEF.m, f: p[3] || DEF.f, ti: p[4] || '1', tv: p[5] || DEF.tv }); again(); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'save') { saveTxt(); return; }
    if (b.dataset.act === 'clearh') { H = []; saveH(); drawH(); return; }
    if (b.dataset.act === 'reset') { setState(DEF); again(); X.focus(); }
  });
  [X, MU, FA, TV].forEach(function (f) { f.addEventListener('input', function () { if (f === X) syncTerms(); render(); }); f.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { clearTimeout(timer); render(); if (last) push(last); } }); });
  OP.addEventListener('change', again); TI.addEventListener('change', render);
  loadH(); drawH(); setState(DEF); showFields(); render();
})();
