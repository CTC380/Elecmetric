/* Elecmetric Big Number Calculator: page script for Mode 01 (Big Integer Arithmetic). Inlined by tools/bignum_page.js after tools/bignum_engine.js. */
(function () {
  var $ = function (id) { return document.getElementById(id); }, G = window.BIGN, A = $('ns-a'), B = $('ns-b'), CV = $('ns-conv'), GR = $('ns-group'), XT = $('ns-extra'), opsBox = $('ns-ops'), err = $('ns-err'), out = $('ns-out'), stp = $('ns-steps'), ver = $('ns-verify'), hist = $('ns-hist'), KEY = 'elecmetric.bignum.history';
  var H = [], last = null, timer = 0, op = 'add', DEF = { a: '12345678901234567890', b: '98765432109876543210', op: 'add' };
  var SYM = { add: '+', sub: '\u2212', mul: '\u00d7', div: '\u00f7', mod: 'MOD', pow: 'Power', sq: 'Square' }, LBL = { add: 'Add', sub: 'Subtract', mul: 'Multiply', div: 'Divide', mod: 'MOD', pow: 'Power', sq: 'Square' };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function mn(s) { return String(s).replace(/(^|[^A-Za-z0-9])-(?=\d)/g, '$1\u2212'); }
  function note(t) { $('ns-note').textContent = t; }
  function copy(t) { var d = function () { note('Copied'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function cp(t, l, txt) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="' + esc(l) + '">' + (txt || 'Copy') + '</button>'; }
  function loadH() { try { var s = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(s)) H = s.filter(function (x) { return x && typeof x.a === 'string' && typeof x.b === 'string' && typeof x.op === 'string' && typeof x.e === 'string' && G.OPS[x.op]; }).slice(0, 10); } catch (e) { H = []; } }
  function saveH() { try { localStorage.setItem(KEY, JSON.stringify(H)); } catch (e) {} }
  function drawH() {
    if (!H.length) { hist.innerHTML = '<p class="note">Your last ten calculations appear here. They are kept only in this browser.</p>'; return; }
    hist.innerHTML = '<ul class="fh">' + H.map(function (x, i) { return '<li><button type="button" class="chipb" data-h="' + i + '" aria-label="Use again: ' + esc(x.e) + '">' + esc(mn(x.e)) + '</button></li>'; }).join('') + '</ul><button type="button" class="btn2" data-act="clearh">Clear history</button>';
  }
  function key(x) { return x.op + '|' + x.a + '|' + x.b; }
  function push(x) { if (H.length && key(H[0]) === key(x)) return; H.unshift(x); H = H.slice(0, 10); saveH(); drawH(); }
  function table(head, rows) { return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + esc(head.join(', ')) + '"><table class="ns-t"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function flag(t, hot) { return '<span class="ns-flag' + (hot ? ' r' : '') + '">' + esc(t) + '</span>'; }
  function td(s, c) { return '<td' + (c ? ' class="' + c + '"' : '') + '>' + esc(mn(s)) + '</td>'; }
  function sep() { return GR.value === 'comma' ? ',' : GR.value === 'space' ? '\u202f' : ''; }
  function shown(s) { var p = sep(); return mn(p ? G.group(s, p) : s); }
  function short(s) { s = String(s); return s.length > 30 ? s.slice(0, 14) + '\u2026' + s.slice(-12) : s; }
  function bigBox(label, val, copyLabel) {
    var long = val.replace('-', '').length > 28;
    return '<div class="res"><p class="eh">' + esc(label) + ' ' + flag('exact', false) + ' ' + flag(G.analyse(BigInt(val)).digits + ' digit' + (G.analyse(BigInt(val)).digits === 1 ? '' : 's'), false) + '</p><div class="bigbox' + (long ? ' lg' : '') + '" tabindex="0" role="region" aria-label="' + esc(label) + ', scrollable">' + esc(shown(val)) + '</div><div class="ns-act">' + cp(val, copyLabel, 'Copy digits') + '</div></div>';
  }

  function setOp(o, silent) {
    op = o; Array.prototype.forEach.call(opsBox.querySelectorAll('button'), function (b) { var on = b.dataset.op === op; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); });
    var isSq = op === 'sq', isPow = op === 'pow', dv = op === 'div' || op === 'mod';
    $('ns-bwrap').hidden = isSq; $('ns-bl').textContent = isPow ? 'Exponent' : 'Number B'; B.placeholder = isPow ? '256' : '98765432109876543210';
    $('ns-convwrap').hidden = !dv; if (!silent) render();
  }
  function preview() {
    var a = A.value.trim(), b = B.value.trim(), s = a ? short(a) : 'A';
    $('ns-q').textContent = mn(op === 'sq' ? s + '\u00b2' : op === 'pow' ? s + ' ^ ' + (b ? short(b) : 'exponent') : s + ' ' + SYM[op] + ' ' + (b ? short(b) : 'B'));
  }
  function fail(r) {
    var bad = !r.empty; A.classList.toggle('bad', bad && /Number A/.test(r.error)); B.classList.toggle('bad', bad && /Number B|Exponent|exponent|zero/.test(r.error));
    A.setAttribute('aria-invalid', String(A.classList.contains('bad'))); B.setAttribute('aria-invalid', String(B.classList.contains('bad')));
    err.textContent = r.error; err.classList.toggle('ns-hint', !!r.empty);
    out.innerHTML = ''; ver.innerHTML = ''; last = null; stp.innerHTML = '<p class="note">Enter the numbers to see the working.</p>'; preview();
  }
  function workHtml(r) {
    return r.steps.map(function (s) {
      var h = '<h3 class="rh">' + esc(s.title) + '</h3>' + s.lines.map(function (l) { return '<p class="note" style="margin:4px 0">' + esc(mn(l)) + '</p>'; }).join('');
      if (s.table) h += table(s.table.head, s.table.rows.map(function (rw) { return '<tr>' + rw.map(function (c, i) { return td(c, i === 0 ? '' : 'r'); }).join('') + '</tr>'; }));
      return h;
    }).join('');
  }
  function render() {
    var r = G.solve({ a: A.value, b: B.value, op: op, conv: CV.value, extras: XT.checked });
    if (!r.ok) return fail(r);
    A.classList.remove('bad'); B.classList.remove('bad'); A.setAttribute('aria-invalid', 'false'); B.setAttribute('aria-invalid', 'false'); err.textContent = ''; err.classList.remove('ns-hint'); preview();
    var html = '';
    if (op === 'div') html += bigBox('Quotient', r.quotient, 'Copy the quotient') + bigBox('Remainder', r.remainder, 'Copy the remainder') + '<p class="note">Exact value: ' + esc(mn(G.cut(r.exactFraction))) + ' (reduced fraction). The remainder is shown instead of a rounded decimal.</p>';
    else html += bigBox(op === 'mod' ? 'Remainder (A MOD B)' : 'Result', r.result, 'Copy the result');
    html += '<p class="sub" style="font:500 14px var(--mono);color:var(--muted);overflow-wrap:anywhere">' + esc(mn(r.sentence)) + '</p>';
    if (r.notes.length) html += '<p class="note">' + r.notes.map(esc).join(' ') + '</p>';
    var rows = r.rows.map(function (x) { return '<tr>' + td(x[0]) + td(x[1], 'r') + td(x[2]) + '</tr>'; });
    html += table(['Quantity', 'Value', 'Note'], rows);
    html += '<div class="ns-act">' + cp(r.summary, 'Copy the whole result', 'Copy result') + '<button type="button" class="btn2" data-act="useA">Use result as A</button><button type="button" class="btn2" data-act="save">Save as .txt</button><button type="button" class="btn2" data-act="csv">Save as .csv</button><button type="button" class="btn2" data-act="print">Print</button></div>';
    out.innerHTML = html;
    stp.innerHTML = workHtml(r);
    ver.innerHTML = '<p>' + (r.verifyOk ? flag('Verified', false) + ' Every check below agrees with the result.' : flag('Check failed', true) + ' A check did not agree. Please report these inputs.') + '</p><ul class="vl">' + r.verify.map(function (v) { return '<li>' + (v[1] ? '\u2713 ' : '\u2717 ') + esc(mn(v[0])) + '</li>'; }).join('') + '</ul>';
    last = { a: A.value.trim(), b: B.value.trim(), op: op, e: r.sentence, text: r.summary, csv: r.csv, res: r.op === 'div' ? r.quotient : r.result };
    clearTimeout(timer); timer = setTimeout(function () { if (last) push({ a: last.a, b: last.b, op: last.op, e: last.e }); }, 1500);
  }
  function dl(name, type, text) { var b = new Blob([text], { type: type }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); }
  function setAll(a, b, o) { A.value = a; B.value = b; setOp(o, true); render(); }
  $('ns').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.op) { setOp(b.dataset.op); return; }
    if (b.dataset.h) { var x = H[+b.dataset.h]; if (x) setAll(x.a, x.b, x.op); return; }
    if (b.dataset.ex) { var p = b.dataset.ex.split('|'); setAll(p[0], p[2], p[1]); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'save' && last) { dl('big-number-result.txt', 'text/plain;charset=utf-8', last.text + '\n\nCalculated exactly in the browser by Elecmetric Big Number Calculator (' + location.href.split('#')[0] + ').\n'); return; }
    if (b.dataset.act === 'csv' && last) { dl('big-number-result.csv', 'text/csv;charset=utf-8', last.csv + '\r\n'); return; }
    if (b.dataset.act === 'useA' && last) { A.value = last.res; render(); A.focus(); return; }
    if (b.dataset.act === 'swap') { var t = A.value; A.value = B.value; B.value = t; render(); return; }
    if (b.dataset.act === 'clearh') { H = []; saveH(); drawH(); return; }
    if (b.dataset.act === 'clearall') { A.value = ''; B.value = ''; render(); A.focus(); return; }
    if (b.dataset.act === 'reset') { CV.value = 'euclid'; GR.value = 'comma'; XT.checked = false; setAll(DEF.a, DEF.b, DEF.op); A.focus(); }
  });
  [A, B].forEach(function (el) { el.addEventListener('input', render); el.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); clearTimeout(timer); render(); if (last) push({ a: last.a, b: last.b, op: last.op, e: last.e }); } }); });
  [CV, GR, XT].forEach(function (el) { el.addEventListener('change', render); });
  loadH(); drawH(); A.value = DEF.a; B.value = DEF.b; setOp(DEF.op, true); render();
})();
