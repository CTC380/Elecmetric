/* Elecmetric Root Calculator: page script for Mode 03 (General nth Root Calculator). Inlined by tools/nthroot_page.js after tools/quad_engine.js and tools/nthroot_engine.js. */
(function () {
  var $ = function (id) { return document.getElementById(id); }, Nr = window.NthRoot, F = $('ns-r'), KI = $('ns-k'), PL = $('ns-pl'), DS = $('ns-disp'), err = $('ns-err'), out = $('ns-out'), stp = $('ns-steps'), ver = $('ns-verify'), hist = $('ns-hist'), KEY = 'elecmetric.root.nth.history';
  var H = [], last = null, timer = 0, DEF = '-243', DEFK = '5', SUPD = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function mn(s) { return String(s).replace(/(^|[^A-Za-z0-9])-(?=[\d∛√(⁰¹²³⁴⁵⁶⁷⁸⁹])/g, '$1−'); }
  function sym(k) { return k === 2 ? '√' : k === 3 ? '∛' : String(k).split('').map(function (c) { return SUPD.charAt(+c); }).join('') + '√'; }
  function note(t) { $('ns-note').textContent = t; }
  function copy(t) { var d = function () { note('Copied'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function cp(t, l, txt) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="' + esc(l) + '">' + (txt || 'Copy') + '</button>'; }
  function loadH() { try { var s = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(s)) H = s.filter(function (x) { return x && typeof x.r === 'string' && typeof x.k === 'string' && typeof x.e === 'string' && typeof x.p === 'string'; }).slice(0, 10); } catch (e) { H = []; } }
  function saveH() { try { localStorage.setItem(KEY, JSON.stringify(H)); } catch (e) {} }
  function drawH() {
    if (!H.length) { hist.innerHTML = '<p class="note">Your last ten roots appear here. They are kept only in this browser.</p>'; return; }
    hist.innerHTML = '<ul class="fh">' + H.map(function (x, i) { return '<li><button type="button" class="chipb" data-h="' + i + '" aria-label="Use again: ' + esc(x.e) + '">' + esc(mn(x.e)) + '</button></li>'; }).join('') + '</ul><button type="button" class="btn2" data-act="clearh">Clear history</button>';
  }
  function push(x) { if (H.length && H[0].r === x.r && H[0].k === x.k && H[0].p === x.p) return; H.unshift({ r: x.r, k: x.k, p: x.p, e: x.e }); H = H.slice(0, 10); saveH(); drawH(); }
  function mark(b) { F.classList.toggle('bad', b); F.setAttribute('aria-invalid', String(b)); }
  function table(head, rows) { return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + esc(head.join(', ')) + '"><table class="ns-t"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function flag(t, hot) { return '<span class="ns-flag' + (hot ? ' r' : '') + '">' + esc(t) + '</span>'; }
  function td(s, c) { return '<td' + (c ? ' class="' + c + '"' : '') + '>' + esc(mn(s)) + '</td>'; }
  function kval() { var t = KI.value.trim(); return /^\d+$/.test(t) && +t >= 1 ? +t : null; }
  function preview() { var v = F.value.trim(), k = kval(); $('ns-q').textContent = (k === null ? 'ⁿ√' : sym(k)) + (v === '' ? '?' : /^[0-9.]+$/.test(v) ? v : '(' + mn(v) + ')'); KI.setAttribute('aria-label', 'Root index n'); document.querySelectorAll('#ns [data-k]').forEach(function (b) { b.classList.toggle('on', b.dataset.k === KI.value.trim()); }); }
  function fail(r) {
    var idx = !!r.badIndex || (r.empty && /index/.test(r.hint || ''));
    F.dataset.idx = idx ? '1' : ''; KI.classList.toggle('bad', !!r.badIndex); KI.setAttribute('aria-invalid', String(!!r.badIndex));
    mark(!r.empty && !idx); err.textContent = r.empty ? (r.hint || '') : r.error; err.classList.toggle('ns-hint', !!r.empty);
    out.innerHTML = r.noReal ? '<div class="res"><div class="big"><span class="rbig">No real result</span>' + flag('negative radicand, even index', true) + '</div>' + (r.complex ? '<div class="sub">Complex result: ' + esc(mn(r.complex)) + '</div>' : '') + '</div>' : '';
    ver.innerHTML = ''; last = null; stp.innerHTML = '<p class="note">Enter a number and a root index to see the working.</p>'; preview();
  }
  function render() {
    var r = Nr.solve({ radicand: F.value, index: KI.value, places: PL.value });
    if (!r.ok) return fail(r);
    F.dataset.idx = ''; KI.classList.remove('bad'); KI.setAttribute('aria-invalid', 'false');
    mark(false); err.textContent = ''; err.classList.remove('ns-hint'); preview();
    var disp = DS.value, rows = r.rows.map(function (x) { return '<tr>' + td(x[0]) + td(x[1], 'r') + td(x[2]) + '</tr>'; });
    var decLine = (r.perfect ? (r.decimalExact ? 'Exact decimal: ' + r.decimal : 'Decimal ≈ ' + r.decimal) : 'Decimal ≈ ' + r.decimal);
    var head = disp === 'decimal' ? r.title + (r.decimalExact ? ' = ' : ' ≈ ') + r.decimal : r.title + ' = ' + r.exact;
    var subTxt = disp === 'exact' ? '' : disp === 'decimal' ? 'Exact: ' + r.exact : decLine;
    var big = '<div class="res"><div class="big"><span class="rbig">' + esc(mn(head)) + '</span>' + flag(r.perfect ? 'perfect power' : 'irrational', false) + (r.negative ? flag('negative: real root', false) : '') + cp(disp === 'decimal' ? r.decimal : r.exact, disp === 'decimal' ? 'Copy the decimal' : 'Copy the exact result') + '</div>' +
      (subTxt ? '<div class="sub">' + esc(mn(subTxt)) + (r.perfect && disp !== 'decimal' ? '' : (disp === 'decimal' ? cp(r.exact, 'Copy the exact result', 'Copy exact') : ' ' + cp(r.decimal, 'Copy the decimal', 'Copy decimal'))) + '</div>' : '') + '</div>';
    var est = r.estimate.length ? '<h3 class="rh">Newton’s method estimate</h3>' + table(['Step', 'Estimate g', 'g' + '^' + r.index], r.estimate.map(function (e) { return '<tr>' + td(String(e.i)) + td(e.guess, 'r') + td(e.power, 'r') + '</tr>'; })) + '<p class="note">Each new estimate is ((n − 1) g + x ÷ g' + '^' + (r.index - 1) + ') ÷ n with n = ' + r.index + ', starting from the next whole number above the root. g' + '^' + r.index + ' closes in on the radicand.' + (r.negative ? ' The table is for the positive number ' + esc(mn(r.radicand.replace(/^-/, ''))) + '; the real root of the negative radicand is minus that estimate.' : '') + '</p>'
      : (!r.zero && r.index > Nr.MAXNEWTON ? '<p class="note">The Newton estimate table is shown for indices 2 to ' + Nr.MAXNEWTON + '. From a whole-number start it converges slowly when the index is large, so it is left out here; the answer itself comes from an exact integer root.</p>' : '');
    out.innerHTML = big + (r.warnings.length ? '<p class="note ns-warn">' + r.warnings.map(esc).join(' ') + '</p>' : '') + table(['Quantity', 'Result', 'Note'], rows) + est + '<p class="note">' + esc(r.notes[0]) + '</p>' +
      '<div class="ns-act">' + cp(r.summary, 'Copy the whole result', 'Copy result') + '<button type="button" class="btn2" data-act="save">Save as .txt</button><button type="button" class="btn2" data-act="print">Print</button></div>';
    stp.innerHTML = '<ol class="steps">' + r.steps.map(function (s) { return '<li>' + esc(mn(s)) + '</li>'; }).join('') + '</ol>';
    ver.innerHTML = '<p>' + (r.verifyOk ? flag('Verified', false) + ' Every check below agrees with the result.' : flag('Check failed', true) + ' A check did not agree. Please report this input.') + '</p><ul class="vl">' + r.verify.map(function (v) { return '<li>' + (v[1] ? '✓ ' : '✗ ') + esc(mn(v[0])) + '</li>'; }).join('') + '</ul>';
    last = { r: F.value.trim(), k: KI.value.trim(), p: PL.value, e: r.sentence, text: r.summary };
    clearTimeout(timer); timer = setTimeout(function () { if (last) push(last); }, 1500);
  }
  function saveTxt() { if (!last) return; var b = new Blob([last.text + '\n\nCalculated exactly in the browser by Elecmetric Root Calculator, Mode 03 (' + location.href.split('#')[0] + ').\n'], { type: 'text/plain;charset=utf-8' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'nth-root.txt'; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); }
  $('ns').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.h) { var x = H[+b.dataset.h]; if (x) { F.value = x.r; KI.value = x.k; PL.value = x.p; render(); } return; }
    if (b.dataset.ex !== undefined) { F.value = b.dataset.ex; if (b.dataset.exk) KI.value = b.dataset.exk; render(); return; }
    if (b.dataset.k) { KI.value = b.dataset.k; render(); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'save') { saveTxt(); return; }
    if (b.dataset.act === 'clearh') { H = []; saveH(); drawH(); return; }
    if (b.dataset.act === 'clearall') { F.value = ''; KI.value = ''; render(); F.focus(); return; }
    if (b.dataset.act === 'reset') { F.value = DEF; KI.value = DEFK; PL.value = '8'; DS.value = 'both'; render(); F.focus(); }
    if (b.dataset.act === 'neg') { var v = F.value.trim(); F.value = v.charAt(0) === '-' ? v.slice(1) : (v === '' ? '' : '-' + v); render(); }
  });
  F.addEventListener('input', render); KI.addEventListener('input', render); F.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { clearTimeout(timer); render(); if (last) push(last); } }); KI.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { clearTimeout(timer); render(); if (last) push(last); } });
  PL.addEventListener('change', render); DS.addEventListener('change', render);
  loadH(); drawH(); F.value = DEF; KI.value = DEFK; render();
})();
