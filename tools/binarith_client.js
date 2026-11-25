/* Elecmetric Binary Calculator, Mode 01: Binary Arithmetic. Page script. Inlined by tools/binarith_page.js after the engine (BinArith). */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var LET = 'ABCDEFGHIJKLMNOPQRST', box = $('ba-ops'), opSel = $('ba-op'), padSel = $('ba-pad'), last = null, lastRes = null;
  var DEF = { op: 'add', ops: ['1010', '0101'], pad: 'min' }, HKEY = 'em-binarith-history', hist = [];
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function say(t) { $('ba-note').textContent = t; }
  function copy(t) { var d = function () { say('Copied ' + t); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function inputs() { return Array.prototype.slice.call(box.querySelectorAll('input.ns-in')); }
  function values() { return inputs().map(function (i) { return i.value; }); }
  function setOps(vals) {
    box.innerHTML = vals.map(function (v, k) {
      return '<div class="ba-row"><div class="ns-f"><label for="ba-i' + k + '" class="ns-l">' + (opSel.value === 'div' ? (k === 0 ? 'Dividend A' : 'Divisor B') : 'Number ' + LET.charAt(k)) + '</label><input id="ba-i' + k + '" class="ns-in" type="text" inputmode="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-describedby="ba-err" value="' + esc(v) + '"></div>' +
        (vals.length > 2 ? '<button type="button" class="btn2 ba-rm" data-rm="' + k + '" aria-label="Remove number ' + LET.charAt(k) + '">Remove</button>' : '') + '</div>';
    }).join('');
    $('ba-add').hidden = opSel.value === 'div' || vals.length >= BinArith.MAXN;
  }
  function track() { last = document.activeElement && document.activeElement.classList && document.activeElement.classList.contains('ns-in') ? document.activeElement : last; }
  function sym() { return (BinArith.OPS.filter(function (d) { return d[0] === opSel.value; })[0] || [0, '+'])[1]; }
  function cell(c, cls) { return '<td' + (cls ? ' class="' + cls + '"' : '') + '>' + c + '</td>'; }
  function copyBtn(t, label) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="Copy ' + esc(label) + '">Copy</button>'; }
  function bitsRow(r) {
    var neg = r.neg, m = r.padded.replace('-', ''), n = m.length, o = '';
    if (n > 64) return '<p class="note">The result has ' + n + ' bits; the bit-by-bit view is shown up to 64 bits.</p>';
    for (var i = 0; i < n; i++) o += '<span class="bit"><i>' + (n - 1 - i) + '</i><b>' + m.charAt(i) + '</b></span>';
    return '<div class="bits" role="img" aria-label="' + (neg ? 'Negative. ' : '') + 'Bits, most significant first: ' + m.split('').join(' ') + '">' + (neg ? '<span class="bit sg"><i>sign</i><b>−</b></span>' : '') + o + '</div>';
  }
  function resultTable(r) {
    var head = '<thead><tr><th scope="col"></th><th scope="col">Binary</th><th scope="col">Decimal</th><th scope="col">Hexadecimal</th><th scope="col">Octal</th></tr></thead>', rows = '';
    r.operands.forEach(function (x, k) { rows += '<tr><th scope="row">' + (r.op === 'div' ? (k === 0 ? 'Dividend' : 'Divisor') : LET.charAt(k)) + '</th>' + cell(esc(x.bits) + (x.placeValue && x.dec !== '0' ? '<small>' + esc(x.placeValue) + ' = ' + esc(x.dec.replace('-', '')) + '</small>' : ''), 'r') + cell(esc(x.dec), 'r') + cell(esc(x.hex), 'r') + cell(esc(x.oct), 'r') + '</tr>'; });
    var res = r.result, rem = r.remainder;
    rows += '<tr class="cu"><th scope="row">' + (rem ? 'Quotient' : 'Result') + '</th>' + cell(esc(res.padded), 'r') + cell(esc(res.dec), 'r') + cell(esc(res.hex), 'r') + cell(esc(res.oct), 'r') + '</tr>';
    if (rem) rows += '<tr class="cu"><th scope="row">Remainder</th>' + cell(esc(rem.padded), 'r') + cell(esc(rem.dec), 'r') + cell(esc(rem.hex), 'r') + cell(esc(rem.oct), 'r') + '</tr>';
    return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: operands and result in four number systems"><table class="ns-t">' + head + '<tbody>' + rows + '</tbody></table></div>';
  }
  function render() {
    var r = BinArith.run({ op: opSel.value, operands: values(), pad: padSel.value }), err = $('ba-err');
    inputs().forEach(function (e) { e.classList.remove('bad'); e.setAttribute('aria-invalid', 'false'); });
    lastRes = null;
    $('ba-dl').hidden = true;
    if (!r.ok) {
      err.textContent = r.empty ? '' : r.error;
      if (r.field !== undefined) { var f = inputs()[r.field]; if (f && !r.empty) { f.classList.add('bad'); f.setAttribute('aria-invalid', 'true'); } }
      $('ba-out').innerHTML = ''; $('ba-steps').innerHTML = '<p class="note">Enter valid binary numbers to see the working.</p>'; return;
    }
    err.textContent = ''; lastRes = r;
    var expr = r.operands.map(function (x) { return x.bits; }).join(' ' + r.symbol + ' '), res = r.result, rem = r.remainder;
    var big = '<div class="res"><p class="sub">' + esc(expr) + '</p><div class="big">' + (rem ? 'Q ' : '') + esc(res.padded) + copyBtn(res.padded, 'binary result') + '</div>' +
      (rem ? '<div class="big">R ' + esc(rem.padded) + copyBtn(rem.padded, 'binary remainder') + '</div>' : '') +
      '<p class="sub">Decimal <b>' + esc(res.dec) + '</b>' + copyBtn(res.dec, 'decimal result') + ' &nbsp; Hex <b>' + esc(res.hex) + '</b>' + copyBtn(res.hex, 'hexadecimal result') + ' &nbsp; Octal <b>' + esc(res.oct) + '</b></p></div>';
    var facts = '<p class="ns-facts"><span>Bit length <b>' + res.bitLength + '</b></span><span>Ones <b>' + res.ones + '</b></span><span>Zeros <b>' + res.zeros + '</b></span><span>Sign <b>' + (res.zero ? 'zero' : res.neg ? 'negative' : 'positive') + '</b></span></p>';
    var nt = r.notes.map(function (n) { return '<p class="note">' + esc(n) + '</p>'; }).join('');
    $('ba-out').innerHTML = big + bitsRow(res) + facts + resultTable(r) + nt;
    $('ba-steps').innerHTML = r.steps.map(function (s) { return '<h3>' + esc(s.title) + '</h3><pre class="al" tabindex="0">' + esc(s.text) + '</pre>'; }).join('');
    $('ba-dl').hidden = false;
  }
  function relabel() { var ls = box.querySelectorAll('label.ns-l'); for (var k = 0; k < ls.length; k++) ls[k].textContent = opSel.value === 'div' ? (k === 0 ? 'Dividend A' : 'Divisor B') : 'Number ' + LET.charAt(k); $('ba-add').hidden = opSel.value === 'div' || ls.length >= BinArith.MAXN; }
  function setAll(d) { opSel.value = d.op; padSel.value = d.pad || 'min'; setOps(d.ops); render(); }
  function onOp() {
    var v = values();
    if (opSel.value === 'div' && v.length > 2) { v = v.slice(0, 2); setOps(v); } else relabel();
    render();
  }
  function download(name, mime, text) { var a = document.createElement('a'), u = URL.createObjectURL(new Blob([text], { type: mime })); a.href = u; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(u); }, 500); say('Downloaded ' + name); }
  function loadHist() { try { var s = localStorage.getItem(HKEY); hist = s ? JSON.parse(s) : []; if (!Array.isArray(hist)) hist = []; } catch (e) { hist = []; } }
  function saveHist() { try { localStorage.setItem(HKEY, JSON.stringify(hist.slice(0, 10))); } catch (e) {} }
  function drawHist() {
    $('ba-hist').innerHTML = hist.length ? hist.map(function (h, k) { return '<li><button type="button" class="chipb" data-h="' + k + '">' + esc(h.text) + '</button></li>'; }).join('') : '<li class="note">No saved calculations yet. Press Enter or Save to history.</li>';
    $('ba-hclear').hidden = !hist.length;
  }
  function keep() {
    if (!lastRes) return; var r = lastRes, t = r.operands.map(function (x) { return x.bits; }).join(' ' + r.symbol + ' ') + ' = ' + r.result.padded + (r.remainder ? ' R ' + r.remainder.padded : '');
    hist = hist.filter(function (h) { return h.text !== t; }); hist.unshift({ text: t, op: opSel.value, ops: values(), pad: padSel.value }); hist = hist.slice(0, 10); saveHist(); drawHist(); say('Saved to history');
  }
  function insert(s) {
    var f = last && document.body.contains(last) ? last : inputs()[0]; if (!f) return;
    if (s === 'back') f.value = f.value.slice(0, -1); else if (s === 'clear') f.value = ''; else if (s === '-') f.value = f.value.charAt(0) === '-' ? f.value.slice(1) : '-' + f.value; else f.value += s;
    f.focus(); render();
  }
  $('ba').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.ex) { setAll(JSON.parse(b.dataset.ex)); return; }
    if (b.dataset.k) { insert(b.dataset.k); return; }
    if (b.dataset.rm !== undefined) { var v = values(); v.splice(Number(b.dataset.rm), 1); setOps(v); render(); return; }
    if (b.dataset.h !== undefined) { var h = hist[Number(b.dataset.h)]; if (h) setAll(h); return; }
    if (b.dataset.act === 'add') { var w = values(); w.push(''); setOps(w); inputs()[w.length - 1].focus(); render(); }
    if (b.dataset.act === 'swap') { var s = values(); var t = s[0]; s[0] = s[1]; s[1] = t; setOps(s); render(); }
    if (b.dataset.act === 'reset') { setAll(DEF); inputs()[0].focus(); }
    if (b.dataset.act === 'save') keep();
    if (b.dataset.act === 'hclear') { hist = []; saveHist(); drawHist(); }
    if (b.dataset.dl && lastRes) { var n = 'binary-arithmetic'; if (b.dataset.dl === 'txt') download(n + '.txt', 'text/plain', BinArith.exportTxt(lastRes)); if (b.dataset.dl === 'csv') download(n + '.csv', 'text/csv', BinArith.exportCsv(lastRes)); if (b.dataset.dl === 'json') download(n + '.json', 'application/json', BinArith.exportJson(lastRes)); }
  });
  box.addEventListener('input', render);
  box.addEventListener('focusin', track);
  box.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); keep(); } });
  opSel.addEventListener('change', onOp); padSel.addEventListener('change', render);
  document.addEventListener('focusin', track);
  loadHist(); drawHist(); setAll(DEF);
})();
