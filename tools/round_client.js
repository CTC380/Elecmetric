/* Elecmetric Rounding Calculator: page script for Mode 01 (Decimal Place Rounding). Inlined by tools/round_page.js after tools/round_engine.js. */
(function () {
  var $ = function (id) { return document.getElementById(id); }, R = window.RND, IN = $('ns-in'), PL = $('ns-places'), RU = $('ns-rule'), KZ = $('ns-zeros'), GP = $('ns-group'), err = $('ns-err'), out = $('ns-out'), stp = $('ns-steps'), ver = $('ns-verify'), hist = $('ns-hist'), KEY = 'elecmetric.round.history';
  var H = [], last = null, timer = 0, DEF = { n: '15.496', p: '2', r: 'away' };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function mn(s) { return String(s).replace(/(^|[^A-Za-z0-9])-(?=[\d.])/g, '$1\u2212'); }
  function note(t) { $('ns-note').textContent = t; }
  function copy(t) { var d = function () { note('Copied'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function cp(t, l, txt) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="' + esc(l) + '">' + (txt || 'Copy') + '</button>'; }
  function loadH() { try { var s = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(s)) H = s.filter(function (x) { return x && typeof x.n === 'string' && typeof x.p === 'string' && typeof x.r === 'string' && typeof x.e === 'string'; }).slice(0, 10); } catch (e) { H = []; } }
  function saveH() { try { localStorage.setItem(KEY, JSON.stringify(H)); } catch (e) {} }
  function drawH() {
    if (!H.length) { hist.innerHTML = '<p class="note">Your last ten calculations appear here. They are kept only in this browser.</p>'; return; }
    hist.innerHTML = '<ul class="fh">' + H.map(function (x, i) { return '<li><button type="button" class="chipb" data-h="' + i + '" aria-label="Use again: ' + esc(x.e) + '">' + esc(mn(x.e)) + '</button></li>'; }).join('') + '</ul><button type="button" class="btn2" data-act="clearh">Clear history</button>';
  }
  function push(x) { if (H.length && H[0].n === x.n && H[0].p === x.p && H[0].r === x.r) return; H.unshift({ n: x.n, p: x.p, r: x.r, e: x.e }); H = H.slice(0, 10); saveH(); drawH(); }
  function table(head, rows) { return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + esc(head.join(', ')) + '"><table class="ns-t"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function flag(t, hot) { return '<span class="ns-flag' + (hot ? ' r' : '') + '">' + esc(t) + '</span>'; }
  function td(s, c) { return '<td' + (c ? ' class="' + c + '"' : '') + '>' + esc(mn(s)) + '</td>'; }
  function short(s) { s = String(s); return s.length > 30 ? s.slice(0, 14) + '\u2026' + s.slice(-12) : s; }
  function opts() { return { text: IN.value, places: PL.value, rule: RU.value, keepZeros: KZ.checked, group: GP.checked }; }

  function preview() {
    var t = IN.value.trim(), p = R.parsePlaces(PL.value);
    $('ns-q').textContent = t ? mn(short(t)) + ' \u2192 ' + (p.ok ? R.placesText(p.p).replace(/ \(.*\)$/, '') : 'decimal places') : 'Round a number to decimal places';
  }
  function fail(r) {
    var bad = !r.empty; var which = /decimal places|Decimal places/.test(r.error || '') ? PL : IN;
    IN.classList.remove('bad'); PL.classList.remove('bad'); IN.setAttribute('aria-invalid', 'false'); PL.setAttribute('aria-invalid', 'false');
    if (bad) { which.classList.add('bad'); which.setAttribute('aria-invalid', 'true'); }
    err.textContent = r.empty ? (r.hint || '') : r.error; err.classList.toggle('ns-hint', !!r.empty);
    out.innerHTML = ''; ver.innerHTML = ''; last = null; stp.innerHTML = '<p class="note">Enter a number and the decimal places to see the working.</p>'; preview();
  }
  function render() {
    var o = opts(), r = R.solve(o);
    if (!r.ok) return fail(r);
    IN.classList.remove('bad'); PL.classList.remove('bad'); IN.setAttribute('aria-invalid', 'false'); PL.setAttribute('aria-invalid', 'false'); err.textContent = ''; err.classList.remove('ns-hint'); preview();
    var rows = r.rows.map(function (x) { return '<tr>' + td(x[0]) + td(x[1], 'r') + td(x[2]) + '</tr>'; });
    var big = '<div class="res"><div class="big"><span class="rbig">' + esc(mn(r.resultShown)) + '</span>' + flag(r.direction === 'up' ? 'rounded up' : r.direction === 'down' ? 'rounded down' : 'no change', false) + cp(r.result, 'Copy the rounded result') + '</div><div class="sub">' + esc(mn(r.sentence)) + '</div></div>';
    var diffLine = '<p class="eh">Original ' + esc(mn(short(r.x))) + ' \u2192 rounded ' + esc(mn(r.result)) + ' \u00b7 difference ' + esc(r.absDiff) + '</p>';
    var alts = table(['Rule', 'Result', 'Difference from original', ''], r.alts.map(function (a) { return '<tr' + (a.current ? ' class="cur"' : '') + '>' + td(a.name) + td(a.result, 'r') + td(a.changed ? a.diff : '0') + td(a.current ? 'selected' : (a.tie ? 'tie' : '')) + '</tr>'; }));
    var fn = r.floatNote ? '<p class="note ns-warn"><b>Why exact decimal arithmetic matters.</b> ' + esc(mn(r.floatNote.text)) + '</p>' : '';
    out.innerHTML = big + diffLine + fn + (r.notes.length ? '<p class="note">' + r.notes.map(function (n) { return esc(mn(n)); }).join(' ') + '</p>' : '') + table(['Quantity', 'Result', 'Note'], rows) +
      '<h3 class="rh">The same number under every rule</h3>' + alts + '<p class="note">Rounding is applied once, to the final value. Round at the end of a calculation, not at every step, or the errors add up.</p>' +
      '<div class="ns-act">' + cp(r.summary, 'Copy the whole result', 'Copy result') + '<button type="button" class="btn2" data-act="save">Save as .txt</button><button type="button" class="btn2" data-act="print">Print</button></div>';
    stp.innerHTML = '<ol class="steps">' + r.steps.map(function (s) { return '<li>' + esc(mn(s)) + '</li>'; }).join('') + '</ol>';
    ver.innerHTML = '<p>' + (r.verifyOk ? flag('Verified', false) + ' Every check below agrees with the result.' : flag('Check failed', true) + ' A check did not agree. Please report these inputs.') + '</p><ul class="vl">' + r.verify.map(function (v) { return '<li>' + (v[1] ? '\u2713 ' : '\u2717 ') + esc(mn(v[0])) + '</li>'; }).join('') + '</ul>';
    last = { n: IN.value.trim(), p: PL.value.trim(), r: RU.value, e: r.sentence, text: r.summary };
    clearTimeout(timer); timer = setTimeout(function () { if (last) push(last); }, 1500);
  }
  function saveTxt() { if (!last) return; var b = new Blob([last.text + '\n\nCalculated exactly in the browser by Elecmetric Rounding Calculator (' + location.href.split('#')[0] + ').\n'], { type: 'text/plain;charset=utf-8' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'rounding-result.txt'; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); }
  function set(n, p, r) { IN.value = n; PL.value = p; if (r) RU.value = r; render(); }
  $('ns').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.h) { var x = H[+b.dataset.h]; if (x) set(x.n, x.p, x.r); return; }
    if (b.dataset.ex) { var q = b.dataset.ex.split('|'); set(q[0], q[1], q[2] || 'away'); return; }
    if (b.dataset.pl !== undefined) { PL.value = b.dataset.pl; render(); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'save') { saveTxt(); return; }
    if (b.dataset.act === 'clearh') { H = []; saveH(); drawH(); return; }
    if (b.dataset.act === 'clearall') { KZ.checked = true; GP.checked = false; set('', '', 'away'); IN.focus(); return; }
    if (b.dataset.act === 'reset') { KZ.checked = true; GP.checked = false; set(DEF.n, DEF.p, DEF.r); IN.focus(); }
  });
  [IN, PL].forEach(function (el) { el.addEventListener('input', render); el.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); clearTimeout(timer); render(); if (last) push(last); } }); });
  RU.addEventListener('change', render); KZ.addEventListener('change', render); GP.addEventListener('change', render);
  loadH(); drawH(); set(DEF.n, DEF.p, DEF.r);
})();
