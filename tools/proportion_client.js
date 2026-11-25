/* Elecmetric Ratio Calculator: page script for Mode 02 (Proportion Solver). Inlined by tools/proportion_page.js after tools/quad_engine.js, tools/ratio_engine.js and tools/proportion_engine.js. */
(function () {
  var $ = function (id) { return document.getElementById(id); }, Pr = window.Proportion, F = [$('ns-a'), $('ns-b'), $('ns-c'), $('ns-d')], PL = $('ns-pl'), err = $('ns-err'), out = $('ns-out'), stp = $('ns-steps'), ver = $('ns-verify'), hist = $('ns-hist'), KEY = 'elecmetric.ratio.proportion.history';
  var H = [], last = null, timer = 0, DEF = ['3', '4', '9', ''];
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function mn(s) { return String(s).replace(/(^|[^A-Za-z0-9])-(?=\d)/g, '$1\u2212'); } /* a typographic minus only in front of a number, so words such as non-zero keep their hyphen */
  function note(t) { $('ns-note').textContent = t; }
  function copy(t) { var d = function () { note('Copied'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function cp(t, l, txt) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="' + esc(l) + '">' + (txt || 'Copy') + '</button>'; }
  function vals() { return F.map(function (f) { return f.value; }); }
  function setVals(v) { for (var i = 0; i < 4; i++) F[i].value = v[i] === undefined ? '' : v[i]; }
  function loadH() { try { var s = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(s)) H = s.filter(function (x) { return x && typeof x.r === 'string' && typeof x.e === 'string'; }).slice(0, 10); } catch (e) { H = []; } }
  function saveH() { try { localStorage.setItem(KEY, JSON.stringify(H)); } catch (e) {} }
  function drawH() {
    if (!H.length) { hist.innerHTML = '<p class="note">Your last ten proportions appear here. They are kept only in this browser.</p>'; return; }
    hist.innerHTML = '<ul class="fh">' + H.map(function (x, i) { return '<li><button type="button" class="chipb" data-h="' + i + '" aria-label="Use again: ' + esc(x.e) + '">' + esc(mn(x.e)) + '</button></li>'; }).join('') + '</ul><button type="button" class="btn2" data-act="clearh">Clear history</button>';
  }
  function push(x) { if (H.length && H[0].r === x.r) return; H.unshift({ r: x.r, e: x.e }); H = H.slice(0, 10); saveH(); drawH(); }
  function mark(i) { F.forEach(function (f, k) { var b = k === i; f.classList.toggle('bad', b); f.setAttribute('aria-invalid', String(b)); }); }
  function table(head, rows) { return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + esc(head.join(', ')) + '"><table class="ns-t"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function flag(t, hot) { return '<span class="ns-flag' + (hot ? ' r' : '') + '">' + esc(t) + '</span>'; }
  function td(s, c) { return '<td' + (c ? ' class="' + c + '"' : '') + '>' + esc(mn(s)) + '</td>'; }
  function preview(r) {
    var v = vals().map(function (s) { return Pr.isBlank(s) ? 'x' : s.trim(); }), blanks = vals().filter(Pr.isBlank).length;
    $('ns-q').textContent = (blanks === 1 ? 'Solve ' : blanks === 0 ? 'Check ' : 'Proportion ') + v[0] + ' : ' + v[1] + ' = ' + v[2] + ' : ' + v[3];
  }
  function fail(r) {
    mark(r.empty ? -1 : r.termIndex); err.textContent = r.empty ? (r.hint || '') : r.error; err.classList.toggle('ns-hint', !!r.empty);
    out.innerHTML = ''; ver.innerHTML = ''; last = null; stp.innerHTML = '<p class="note">Enter three of the four terms to see the working.</p>'; preview(r);
  }
  function bars(r) {
    if (!r.bars) return '';
    function one(label, b) { return '<div class="pbl">' + esc(label) + '</div><div class="rbar" role="img" aria-label="' + esc(label + ': first term ' + (b[0] / 100).toFixed(2) + '% of the pair, second term ' + (b[1] / 100).toFixed(2) + '%') + '"><span class="rseg c0" style="flex:' + Math.max(b[0], 1) + ' 1 0"><b>1</b></span><span class="rseg c1" style="flex:' + Math.max(b[1], 1) + ' 1 0"><b>2</b></span></div>'; }
    return '<h3 class="rh">The two ratios side by side</h3><div class="pbars">' + one('A : B', r.bars[0]) + one('C : D', r.bars[1]) + '</div><p class="note">' + (r.status === 'holds' || r.status === 'solved' ? 'The bars are identical because the two ratios are equal. Each bar shows the first and second term as shares of that pair.' : 'The bars differ because the two ratios are different. Each bar shows the first and second term as shares of that pair.') + '</p>';
  }
  function render() {
    var r = Pr.solve({ a: F[0].value, b: F[1].value, c: F[2].value, d: F[3].value, places: PL.value });
    if (!r.ok) return fail(r);
    mark(-1); err.textContent = ''; err.classList.remove('ns-hint'); preview(r);
    var rows = r.rows.map(function (x) { return '<tr>' + td(x[0]) + td(x[1], 'r') + td(x[2]) + '</tr>'; });
    var good = r.status === 'solved' || r.status === 'holds', flagText = { solved: 'solved', holds: 'true proportion', fails: 'not equal', any: 'not fixed', none: 'no solution' }[r.status];
    var big = '<div class="res"><div class="big"><span class="rbig">' + esc(mn(r.valueText)) + '</span>' + flag(flagText, !good && r.status !== 'any') + (r.valueExact ? cp(r.valueExact, 'Copy the missing term') : '') + '</div><div class="sub">' + esc(mn((r.completedText && r.status === 'solved' ? r.completedText : r.valueSub) + (r.status === 'solved' && r.valueSub ? '  (' + r.valueSub + ')' : ''))) + '</div></div>';
    var terms = table(['Term', 'Entered', 'As a fraction'], r.terms.map(function (t) { return '<tr>' + td(t.term) + td(t.entered) + td(t.asFraction, 'r') + '</tr>'; }));
    out.innerHTML = big + (r.warnings.length ? '<p class="note ns-warn">' + r.warnings.map(esc).join(' ') + '</p>' : '') + table(['Quantity', 'Result', 'Note'], rows) + '<h3 class="rh">Your terms</h3>' + terms + bars(r) + '<p class="note">' + esc(r.notes[0]) + '</p>' +
      '<div class="ns-act">' + cp(r.summary, 'Copy the whole result', 'Copy result') + '<button type="button" class="btn2" data-act="save">Save as .txt</button><button type="button" class="btn2" data-act="print">Print</button></div>';
    stp.innerHTML = '<ol class="steps">' + r.steps.map(function (s) { return '<li>' + esc(mn(s)) + '</li>'; }).join('') + '</ol>';
    ver.innerHTML = '<p>' + (r.verifyOk ? flag('Verified', false) + ' Every check below agrees with the result.' : flag('Check failed', true) + ' A check did not agree. Please report these inputs.') + '</p><ul class="vl">' + r.verify.map(function (v) { return '<li>' + (v[1] ? '\u2713 ' : '\u2717 ') + esc(v[0]) + '</li>'; }).join('') + '</ul>';
    last = { r: vals().join('|'), e: r.status === 'solved' ? r.completedText : r.sentence, text: r.summary };
    clearTimeout(timer); timer = setTimeout(function () { if (last) push(last); }, 1500);
  }
  function saveTxt() { if (!last) return; var b = new Blob([last.text + '\n\nCalculated exactly in the browser by Elecmetric Ratio Calculator (' + location.href.split('#')[0] + ').\n'], { type: 'text/plain;charset=utf-8' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'proportion-solved.txt'; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); }
  $('ns').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.h) { var x = H[+b.dataset.h]; if (x) { setVals(x.r.split('|')); render(); } return; }
    if (b.dataset.ex) { setVals(b.dataset.ex.split('|')); render(); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'save') { saveTxt(); return; }
    if (b.dataset.act === 'clearh') { H = []; saveH(); drawH(); return; }
    if (b.dataset.act === 'clearall') { setVals(['', '', '', '']); render(); F[0].focus(); return; }
    if (b.dataset.act === 'reset') { setVals(DEF); PL.value = 'auto'; render(); F[0].focus(); }
  });
  F.forEach(function (f) { f.addEventListener('input', render); f.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { clearTimeout(timer); render(); if (last) push(last); } }); });
  PL.addEventListener('change', render);
  loadH(); drawH(); setVals(DEF); render();
})();
