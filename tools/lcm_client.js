/* Elecmetric LCM Calculator: page script for Mode 01 (Multiple Number LCM). Inlined by tools/lcm_page.js after tools/lcm_engine.js. */
(function () {
  var $ = function (id) { return document.getElementById(id); }, Lc = window.Lcm, LIST = $('ns-list'), M = $('ns-m'), rowsEl = $('ns-rows'), addBtn = $('ns-add'), err = $('ns-err'), out = $('ns-out'), stp = $('ns-steps'), ver = $('ns-verify'), hist = $('ns-hist'), KEY = 'elecmetric.lcm.multiple.history';
  var H = [], last = null, timer = 0, DEF = '12, 18, 24', MAXR = Lc.MAXTERMS;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function mn(s) { return String(s).replace(/(^|[^A-Za-z0-9])-(?=\d)/g, '$1\u2212'); } /* a typographic minus only in front of a number, so words such as non-zero keep their hyphen */
  function note(t) { $('ns-note').textContent = t; }
  function copy(t) { var d = function () { note('Copied'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function cp(t, l, txt) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="' + esc(l) + '">' + (txt || 'Copy') + '</button>'; }
  function toks(s) { return String(s).split(/[\s,;]+/).filter(function (x) { return x !== ''; }); }
  function loadH() { try { var s = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(s)) H = s.filter(function (x) { return x && typeof x.r === 'string' && typeof x.e === 'string'; }).slice(0, 10); } catch (e) { H = []; } }
  function saveH() { try { localStorage.setItem(KEY, JSON.stringify(H)); } catch (e) {} }
  function short(s, n) { return s.length > n ? s.slice(0, n) + '\u2026' : s; }
  function drawH() {
    if (!H.length) { hist.innerHTML = '<p class="note">Your last ten lists appear here. They are kept only in this browser.</p>'; return; }
    hist.innerHTML = '<ul class="fh">' + H.map(function (x, i) { return '<li><button type="button" class="chipb" data-h="' + i + '" aria-label="Use again: ' + esc(short(x.e, 80)) + '">' + esc(mn(short(x.e, 60))) + '</button></li>'; }).join('') + '</ul><button type="button" class="btn2" data-act="clearh">Clear history</button>';
    }
  function push(x) { if (H.length && H[0].r === x.r) return; H.unshift({ r: x.r, e: x.e }); H = H.slice(0, 10); saveH(); drawH(); }

  /* number rows: one input per number, kept in step with the list box */
  function drawRows(vals) {
    if (!vals.length) vals = ['', ''];
    vals = vals.slice(0, MAXR);
    rowsEl.innerHTML = vals.map(function (v, i) { return '<div class="lrow"><label class="ns-l" for="ns-r' + i + '">Number ' + (i + 1) + '</label><input id="ns-r' + i + '" class="ns-in rin" data-i="' + i + '" type="text" inputmode="text" autocomplete="off" autocorrect="off" spellcheck="false" value="' + esc(v) + '"><button type="button" class="btn2" data-rm="' + i + '" aria-label="Remove number ' + (i + 1) + '">\u00d7</button></div>'; }).join('');
    addBtn.disabled = vals.length >= MAXR;
  }
  function rowInputs() { return [].slice.call(rowsEl.querySelectorAll('.rin')); }
  function rowVals() { return rowInputs().map(function (i) { return i.value; }); }
  function listFromRows() { LIST.value = rowVals().map(function (v) { return v.trim(); }).filter(Boolean).join(', '); }
  function mark(idx, on) {
    LIST.classList.toggle('bad', on); LIST.setAttribute('aria-invalid', String(on));
    var k = 0; rowInputs().forEach(function (inp) { var b = false; if (on && idx >= 0 && inp.value.trim() !== '') { b = k === idx; k++; } inp.classList.toggle('bad', b); inp.setAttribute('aria-invalid', String(b)); });
  }
  function preview(r) { var t = toks(LIST.value); $('ns-q').textContent = t.length ? 'Find the LCM of ' + short(t.join(', '), 70) : 'Find the LCM of two or more numbers'; }
  function table(head, rows) { return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + esc(head.join(', ')) + '"><table class="ns-t"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function flag(t, hot) { return '<span class="ns-flag' + (hot ? ' r' : '') + '">' + esc(t) + '</span>'; }
  function td(s, c) { return '<td' + (c ? ' class="' + c + '"' : '') + '>' + esc(mn(s)) + '</td>'; }
  function fail(r) {
    mark(r.empty ? -1 : r.termIndex, !r.empty); err.textContent = r.empty ? (r.hint || '') : r.error; err.classList.toggle('ns-hint', !!r.empty);
    out.innerHTML = ''; ver.innerHTML = ''; last = null; stp.innerHTML = '<p class="note">Enter two or more numbers to see the working.</p>'; preview(r);
  }
  function render() {
    var r = Lc.calc({ text: LIST.value, method: M.value });
    if (!r.ok) return fail(r);
    mark(-1, false); err.textContent = ''; err.classList.remove('ns-hint'); preview(r);
    var rows = r.rows.map(function (x) { return '<tr>' + td(x[0]) + td(x[1], 'r') + td(x[2]) + '</tr>'; });
    var big = '<div class="res"><div class="big"><span class="rbig">LCM = ' + esc(r.lcm) + '</span>' + flag(r.verifyOk ? 'verified' : 'check failed', !r.verifyOk) + cp(r.lcm, 'Copy the LCM') + '</div><div class="sub">' + esc(mn(r.sentence)) + '  \u00b7  GCD = ' + esc(r.gcd) + '</div></div>';
    var q = r.quotients.length ? '<h3 class="rh">Every number divides the LCM</h3>' + table(['Number', 'LCM \u00f7 number', 'Check'], r.quotients.map(function (x) { return '<tr>' + td(x.n) + td(x.q, 'r') + td('\u2713 divides exactly') + '</tr>'; })) : '';
    var mu = r.multiples.length ? '<p class="note">Common multiples: ' + esc(r.multiples.map(function (x) { return x.length > 40 ? x.slice(0, 10) + '\u2026 (' + x.length + ' digits)' : x; }).join(', ')) + ', \u2026 Every common multiple of the numbers is a multiple of the LCM.</p>' : '';
    out.innerHTML = big + (r.warnings.length ? '<p class="note ns-warn">' + r.warnings.map(esc).join(' ') + '</p>' : '') + table(['Quantity', 'Result', 'Note'], rows) + q + mu + r.notes.map(function (n) { return '<p class="note">' + esc(mn(n)) + '</p>'; }).join('') +
      '<div class="ns-act">' + cp(r.summary, 'Copy the whole result', 'Copy result') + '<button type="button" class="btn2" data-act="save">Save as .txt</button><button type="button" class="btn2" data-act="print">Print</button></div>';
    stp.innerHTML = '<p class="note">Working: ' + esc(r.methodName) + '.</p><ol class="steps">' + r.steps.map(function (s) { return '<li>' + esc(mn(s)) + '</li>'; }).join('') + '</ol>';
    ver.innerHTML = '<p>' + (r.verifyOk ? flag('Verified', false) + ' Every check below agrees with the result.' : flag('Check failed', true) + ' A check did not agree. Please report these numbers.') + '</p><ul class="vl">' + r.verify.map(function (v) { return '<li>' + (v[1] ? '\u2713 ' : '\u2717 ') + esc(mn(v[0])) + '</li>'; }).join('') + '</ul>';
    last = { r: toks(LIST.value).join(', '), e: r.sentence, text: r.summary };
    clearTimeout(timer); timer = setTimeout(function () { if (last) push(last); }, 1500);
  }
  function saveTxt() { if (!last) return; var b = new Blob([last.text + '\n\nCalculated exactly in the browser by Elecmetric LCM Calculator (' + location.href.split('#')[0] + ').\n'], { type: 'text/plain;charset=utf-8' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'lcm-result.txt'; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); }
  function setList(v) { LIST.value = v; drawRows(toks(v)); }
  $('ns').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.h) { var x = H[+b.dataset.h]; if (x) { setList(x.r); render(); } return; }
    if (b.dataset.ex) { setList(b.dataset.ex); render(); return; }
    if (b.dataset.rm !== undefined) { var v = rowVals(); v.splice(+b.dataset.rm, 1); drawRows(v); listFromRows(); render(); var ri = rowInputs(); if (ri.length) ri[Math.min(+b.dataset.rm, ri.length - 1)].focus(); return; }
    if (b.dataset.act === 'addrow') { var v2 = rowVals(); if (v2.length < MAXR) { v2.push(''); drawRows(v2); var r2 = rowInputs(); r2[r2.length - 1].focus(); } return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'save') { saveTxt(); return; }
    if (b.dataset.act === 'clearh') { H = []; saveH(); drawH(); return; }
    if (b.dataset.act === 'clearall') { setList(''); render(); LIST.focus(); return; }
    if (b.dataset.act === 'reset') { setList(DEF); M.value = 'gcd'; render(); LIST.focus(); }
  });
  LIST.addEventListener('input', function () { drawRows(toks(LIST.value)); render(); });
  LIST.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); clearTimeout(timer); render(); if (last) push(last); } });
  rowsEl.addEventListener('input', function (ev) { if (ev.target && ev.target.classList.contains('rin')) { listFromRows(); render(); } });
  rowsEl.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' && ev.target && ev.target.classList.contains('rin')) { ev.preventDefault(); clearTimeout(timer); render(); if (last) push(last); } });
  M.addEventListener('change', render);
  loadH(); drawH(); setList(DEF); render();
})();
