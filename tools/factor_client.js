/* Elecmetric Factor Calculator: page script for Mode 01 (All Factors Finder). Inlined by tools/factor_page.js after tools/gcf_engine.js, tools/gcf_prime_engine.js and tools/factor_engine.js. */
(function () {
  var $ = function (id) { return document.getElementById(id); }, F = window.FACT, IN = $('ns-in'), SG = $('ns-signed'), CK = $('ns-chk'), err = $('ns-err'), out = $('ns-out'), stp = $('ns-steps'), dvt = $('ns-div'), ver = $('ns-verify'), hist = $('ns-hist'), KEY = 'elecmetric.factor.all.history';
  var H = [], last = null, timer = 0, DEF = '36', showAll = false, showDiv = false, LIST_CAP = 20000, DIV_CAP = 2000, DIV_ROWS = 40;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function mn(s) { return String(s).replace(/(^|[^A-Za-z0-9])-(?=\d)/g, '$1\u2212'); }
  function g(s) { return F.group(s); }
  function note(t) { $('ns-note').textContent = t; }
  function copy(t) { var d = function () { note('Copied'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function loadH() { try { var s = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(s)) H = s.filter(function (x) { return x && typeof x.r === 'string' && typeof x.e === 'string'; }).slice(0, 10); } catch (e) { H = []; } }
  function saveH() { try { localStorage.setItem(KEY, JSON.stringify(H)); } catch (e) {} }
  function drawH() {
    if (!H.length) { hist.innerHTML = '<p class="note">Your last ten calculations appear here. They are kept only in this browser.</p>'; return; }
    hist.innerHTML = '<ul class="fh">' + H.map(function (x, i) { return '<li><button type="button" class="chipb" data-h="' + i + '" aria-label="Use again: ' + esc(x.e) + '">' + esc(mn(x.e)) + '</button></li>'; }).join('') + '</ul><button type="button" class="btn2" data-act="clearh">Clear history</button>';
  }
  function push(x) { if (H.length && H[0].r === x.r) return; H.unshift({ r: x.r, e: x.e }); H = H.slice(0, 10); saveH(); drawH(); }
  function table(head, rows) { return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + esc(head.join(', ')) + '"><table class="ns-t"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function flag(t, hot) { return '<span class="ns-flag' + (hot ? ' r' : '') + '">' + esc(t) + '</span>'; }
  function td(s, c) { return '<td' + (c ? ' class="' + c + '"' : '') + '>' + esc(mn(s)) + '</td>'; }
  function tdh(h, c) { return '<td' + (c ? ' class="' + c + '"' : '') + '>' + h + '</td>'; }
  function sup(f) { if (!f || !f.length) return '1'; return f.map(function (x) { return esc(x[0]) + (x[1] > 1 ? '<sup>' + x[1] + '</sup>' : ''); }).join(' \u00d7 '); }
  function cp(t, l, txt) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="' + esc(l) + '">' + (txt || 'Copy') + '</button>'; }

  function fail(r) {
    IN.classList.toggle('bad', !r.empty); IN.setAttribute('aria-invalid', String(!r.empty));
    err.textContent = r.empty ? (r.hint || '') : r.error; err.classList.toggle('ns-hint', !!r.empty);
    out.innerHTML = ''; ver.innerHTML = ''; dvt.innerHTML = '<p class="note">Enter a whole number to see the division for each factor.</p>'; $('ns-chk-out').textContent = ''; last = null;
    stp.innerHTML = '<p class="note">Enter a whole number to see the working.</p>'; $('ns-q').textContent = 'Factors of a whole number';
  }
  function chips(list, bold) {
    return '<ul class="fh fl" aria-label="Positive factors in ascending order">' + list.map(function (x) { return '<li><span class="fv' + (bold && bold.indexOf(x) >= 0 ? ' pf' : '') + '">' + esc(g(x)) + '</span></li>'; }).join('') + '</ul>';
  }
  function pairRows(pairs, n, sg) {
    var rows = pairs.map(function (p) { var eq = p[0] === p[1]; return '<tr>' + td(g(p[0])) + td(g(p[1])) + td(g(String(BigInt(p[0]) * BigInt(p[1]))), 'r') + (eq ? tdh(flag('equal pair', false)) : td('\u2013')) + '</tr>'; });
    if (rows.length > 120) { var hid = rows.length - 100; rows = rows.slice(0, 50).concat(['<tr><td colspan="4">\u2026 ' + hid + ' more pairs, in the same pattern \u2026 (Copy result gives them all)</td></tr>']).concat(rows.slice(-50)); }
    return rows;
  }
  function render() {
    var r = F.solve({ text: IN.value, signed: SG.checked, check: CK.value }), flagTxt;
    if (!r.ok) return fail(r);
    IN.classList.remove('bad'); IN.setAttribute('aria-invalid', 'false'); err.textContent = ''; err.classList.remove('ns-hint');
    $('ns-q').textContent = mn('Factors of ' + g(r.entered));
    if (r.status === 'zero') {
      out.innerHTML = '<div class="res"><div class="big"><span class="rbig">Undefined</span>' + flag('no finite list', true) + '</div><div class="sub">Factors of 0</div></div><p class="note ns-warn">' + r.steps.map(esc).join(' ') + '</p>';
      stp.innerHTML = '<ol class="steps">' + r.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>'; ver.innerHTML = ''; dvt.innerHTML = '<p class="note">0 has no finite factor list, so there is no division table.</p>';
      var cz = r.candidate; $('ns-chk-out').innerHTML = cz ? esc(cz.ok ? cz.text : cz.error) : ''; last = null; return;
    }
    var n = r.count, shown, pfs = r.primeFactors.map(function (x) { return x[0]; }), trunc = false;
    if (n <= 2000 || (showAll && n <= LIST_CAP)) shown = chips(r.factors, pfs);
    else { trunc = true; shown = chips(r.factors.slice(0, 100), pfs).replace('</ul>', '<li><span class="fv dots" aria-hidden="true">\u2026</span></li></ul>') + chips(r.factors.slice(-100), pfs); }
    flagTxt = r.kind === 'prime' ? 'prime' : r.kind === 'one' ? 'neither prime nor composite' : 'composite';
    var big = '<div class="res"><div class="big"><span class="rbig">' + esc(mn(g(r.entered))) + ' has ' + g(String(n)) + ' positive factor' + (n === 1 ? '' : 's') + '</span>' + flag(flagTxt, false) + '</div><div class="sub">' + (r.one ? '1 = 1' : esc(g(r.abs)) + ' = ' + sup(r.primeFactors)) + (r.negative ? '  \u00b7  factors of the absolute value ' + esc(g(r.abs)) : '') + '</div></div>';
    var more = '';
    if (trunc) {
      more = '<p class="note">' + (n <= LIST_CAP ? 'Showing the first 100 and last 100 of ' + n + ' factors. <button type="button" class="btn2" data-act="showall">Show all ' + n + '</button> ' : 'Showing the first 100 and last 100 of ' + n + ' factors. The complete list is in Copy factors and Save as .csv. ') + '</p>';
    } else if (showAll && n > 2000) more = '<p class="note"><button type="button" class="btn2" data-act="hideall">Show fewer</button></p>';
    var rows = r.rows.map(function (x) { return '<tr>' + td(x[0]) + td(x[1], 'r') + td(x[2]) + '</tr>'; });
    var pairHtml = '<h3 class="rh">Factor pairs (' + r.pairs.length + ')</h3><p class="note">Each pair multiplies to ' + esc(g(r.abs)) + '. The smallest factor pairs with the largest.' + (r.square ? ' ' + esc(g(r.pairs[r.pairs.length - 1][0])) + ' \u00d7 ' + esc(g(r.pairs[r.pairs.length - 1][1])) + ' is an equal pair because ' + esc(g(r.abs)) + ' is a perfect square.' : '') + '</p>' + table(['Factor A', 'Factor B', 'A \u00d7 B', 'Note'], pairRows(r.pairs, r.abs));
    var sgHtml = '';
    if (r.showSigned) {
      var srows = r.signedPairs.map(function (p) { return '<tr>' + td(g(p[0])) + td(g(p[1])) + td(g(r.entered), 'r') + '</tr>'; });
      if (srows.length > 120) { srows = srows.slice(0, 50).concat(['<tr><td colspan="3">\u2026 ' + (srows.length - 100) + ' more signed pairs \u2026 (Copy result gives them all)</td></tr>']).concat(srows.slice(-50)); }
      sgHtml = '<h3 class="rh">Signed factor pairs, product ' + esc(mn(g(r.entered))) + ' (' + r.signedPairs.length + ')</h3><p class="note">' + (r.negative ? 'The number is negative, so in every pair exactly one factor is negative.' : 'A positive product can also come from two negative numbers, so every positive pair has a negative twin.') + ' These are listed apart from the positive factors above.</p>' + table(['Factor A', 'Factor B', 'A \u00d7 B'], srows);
    }
    out.innerHTML = big + (n > 1 || r.one ? '<h3 class="rh">Positive factors in ascending order</h3>' : '') + shown + more +
      '<div class="ns-act">' + cp(r.listText, 'Copy all factors', 'Copy factors') + cp(r.summary, 'Copy the whole result', 'Copy result') + '<button type="button" class="btn2" data-act="save">Save as .txt</button><button type="button" class="btn2" data-act="csv">Save as .csv</button><button type="button" class="btn2" data-act="print">Print</button></div>' +
      table(['Quantity', 'Result', 'Note'], rows) + pairHtml + sgHtml;
    /* working */
    var work = '<ol class="steps">' + r.steps.map(function (s) { return '<li>' + esc(mn(s)) + '</li>'; }).join('') + '</ol>';
    if (r.powerTable.length) {
      var mx = Math.max.apply(null, r.powerTable.map(function (x) { return x.powers.length; })), head = ['Prime'];
      for (var k = 0; k < mx; k++) head.push('p^' + k);
      work += '<h3 class="rh">Powers of each prime</h3>' + table(head, r.powerTable.map(function (x) { var t = '<tr>' + td(x.p); for (var j = 0; j < mx; j++) t += td(j < x.powers.length ? g(x.powers[j]) : ''); return t + '</tr>'; })) + '<p class="note">Choose one entry from each row and multiply them. Every such choice is a factor, and no factor is left out. The ' + n + ' products, sorted, are the list above.</p>';
    }
    stp.innerHTML = work;
    /* divisibility table */
    var a = BigInt(r.abs), lim = showDiv ? Math.min(n, DIV_CAP) : Math.min(n, DIV_ROWS), drows = [];
    for (var i = 0; i < lim; i++) { var f = BigInt(r.factors[i]); drows.push('<tr>' + td(g(String(f))) + td(g(String(a)) + ' \u00f7 ' + g(String(f)) + ' = ' + g(String(a / f)), 'r') + td(String(a % f)) + '</tr>'); }
    dvt.innerHTML = '<p class="note">Dividing ' + esc(g(r.abs)) + ' by each factor leaves remainder 0, which is what makes it a factor.</p>' + table(['Factor', 'Division', 'Remainder'], drows) +
      (n > lim ? '<p class="note">Showing ' + lim + ' of ' + n + ' divisions. ' + (!showDiv ? '<button type="button" class="btn2" data-act="showdiv">Show ' + Math.min(n, DIV_CAP) + (n > DIV_CAP ? ' (the most the page lists)' : ' (all)') + '</button>' : '') + '</p>' : (showDiv && n > DIV_ROWS ? '<p class="note"><button type="button" class="btn2" data-act="hidediv">Show fewer</button></p>' : ''));
    ver.innerHTML = '<p>' + (r.verifyOk ? flag('Verified', false) + ' Every check below agrees with the result.' : flag('Check failed', true) + ' A check did not agree. Please report this number.') + '</p><ul class="vl">' + r.verify.map(function (v) { return '<li>' + (v[1] ? '\u2713 ' : '\u2717 ') + esc(mn(v[0])) + '</li>'; }).join('') + '</ul>' + (r.notes.length ? '<p class="note">' + r.notes.map(esc).join(' ') + '</p>' : '');
    var c = r.candidate; $('ns-chk-out').innerHTML = c ? (c.ok ? flag(c.factor ? 'factor' : 'not a factor', !c.factor) + ' ' + esc(mn(c.text)) : '<span class="ns-warn">' + esc(c.error) + '</span>') : '';
    last = { r: IN.value.trim(), e: 'Factors of ' + g(r.entered) + ': ' + n, text: r.summary, csv: r.csv, name: r.abs };
    clearTimeout(timer); timer = setTimeout(function () { if (last) push(last); }, 1500);
  }
  function download(name, text, type) { var b = new Blob([text], { type: type }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); }
  function setText(t) { IN.value = t; showAll = false; showDiv = false; render(); }
  $('ns').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.h) { var x = H[+b.dataset.h]; if (x) setText(x.r); return; }
    if (b.dataset.ex) { setText(b.dataset.ex); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'save') { if (last) download('factors-of-' + last.name + '.txt', last.text + '\n\nCalculated exactly in the browser by Elecmetric Factor Calculator, All Factors Finder (' + location.href.split('#')[0] + ').\n', 'text/plain;charset=utf-8'); return; }
    if (b.dataset.act === 'csv') { if (last) download('factors-of-' + last.name + '.csv', last.csv, 'text/csv;charset=utf-8'); return; }
    if (b.dataset.act === 'showall') { showAll = true; render(); return; }
    if (b.dataset.act === 'hideall') { showAll = false; render(); return; }
    if (b.dataset.act === 'showdiv') { showDiv = true; render(); return; }
    if (b.dataset.act === 'hidediv') { showDiv = false; render(); return; }
    if (b.dataset.act === 'clearh') { H = []; saveH(); drawH(); return; }
    if (b.dataset.act === 'clearall') { CK.value = ''; setText(''); IN.focus(); return; }
    if (b.dataset.act === 'reset') { SG.checked = false; CK.value = ''; setText(DEF); IN.focus(); }
  });
  IN.addEventListener('input', function () { showAll = false; showDiv = false; render(); });
  IN.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); clearTimeout(timer); render(); if (last) push(last); } });
  SG.addEventListener('change', render);
  CK.addEventListener('input', render);
  loadH(); drawH(); IN.value = DEF; render();
})();
