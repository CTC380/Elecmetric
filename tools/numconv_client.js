/* Elecmetric Binary Calculator, Mode 02: Number System Conversion. Page script. Inlined by tools/numconv_page.js after the engine (NumConv). */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var inp = $('nc-in'), fromSel = $('nc-from'), toSel = $('nc-to'), repSel = $('nc-rep'), wSel = $('nc-w'), nSel = $('nc-n'), padSel = $('nc-pad'), grpSel = $('nc-grp'), lastRes = null;
  var DEF = { from: 'bin', to: 'all', text: '10101010', rep: 'signed', width: '8', fracDigits: '16', pad: 'min', grp: '0' }, HKEY = 'em-numconv-history', hist = [];
  var NAMES = { bin: 'Binary', oct: 'Octal', dec: 'Decimal', hex: 'Hexadecimal' }, ORDER = ['bin', 'oct', 'dec', 'hex'];
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function say(t) { $('nc-note').textContent = t; }
  function copy(t) { var d = function () { say('Copied ' + t); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function copyBtn(t, label) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="Copy ' + esc(label) + '">Copy</button>'; }
  function grp() { return Number(grpSel.value) || 0; }
  /* display text of one output; binary is grouped on request (the integer part from the right, the fraction from the left). Copy always uses the plain digits. */
  function shown(id, x) {
    var t = x.text, g = grp();
    if (id === 'bin' && g) { var neg = t.charAt(0) === '-', body = neg ? t.slice(1) : t, p = body.split('.'), f = p[1] || '', fo = '', i; for (i = 0; i < f.length; i++) { if (i > 0 && i % g === 0) fo += ' '; fo += f.charAt(i); } t = (neg ? '-' : '') + NumConv.groupBits(p[0], g) + (f ? '.' + fo : ''); }
    return t + (x.approx ? '…' : '');
  }
  function plain(x) { return x.text; }
  function isFixed() { return repSel.value !== 'signed'; }
  function sync() {
    var fx = isFixed(); $('nc-wrap-w').hidden = !fx; $('nc-wrap-n').hidden = fx; $('nc-wrap-pad').hidden = fx;
    $('nc-hint').textContent = fx ? (fromSel.value === 'dec' ? 'Enter a whole decimal number, positive or negative. It is encoded into the bit pattern.' : 'Enter the bit pattern without a sign. It is read as the selected representation.') : 'Enter a number with an optional minus sign and radix point. The number is converted exactly.';
  }
  function bitsRow(r) {
    var t = r.outputs.bin.text, neg = t.charAt(0) === '-', m = t.replace('-', ''), n = m.length, o = '', i;
    if (r.mode === 'signed' && !r.isInteger) return '';
    if (n > 64) return '<p class="note">The binary value has ' + n + ' bits; the bit-by-bit view is shown up to 64 bits.</p>';
    for (i = 0; i < n; i++) o += '<span class="bit' + (r.mode === 'fixed' && i === 0 && r.rep !== 'unsigned' ? ' sg' : '') + '"><i>' + (n - 1 - i) + '</i><b>' + m.charAt(i) + '</b></span>';
    return '<div class="bits" role="img" aria-label="' + (neg ? 'Negative. ' : '') + (r.mode === 'fixed' ? r.width + '-bit pattern' : 'Bits') + ', most significant first: ' + m.split('').join(' ') + '">' + (neg ? '<span class="bit sg"><i>sign</i><b>−</b></span>' : '') + o + '</div>';
  }
  function resultTable(r) {
    var rows = '', fx = r.mode === 'fixed';
    ORDER.forEach(function (id) {
      var x = r.outputs[id], cur = r.to === id || r.to === 'all' && id !== r.from;
      rows += '<tr' + (r.to === id ? ' class="cu"' : '') + '><th scope="row">' + NAMES[id] + (fx && id === 'dec' ? '<small>' + esc(r.repName) + ' value</small>' : fx ? '<small>bit pattern</small>' : '') + '</th><td class="r">' + esc(shown(id, x)) + (x.repeat ? '<small>exact: ' + esc(x.repeat) + '</small>' : '') + (x.approx && !x.repeat ? '<small>' + (x.capped ? 'no repeat found within 4,096 digits' : x.periodLong ? 'repeats every ' + x.period + ' digits' : '') + '</small>' : '') + '</td><td>' + copyBtn(plain(x), NAMES[id].toLowerCase() + ' value') + '</td></tr>';
    });
    if (fx) rows += '<tr><th scope="row">Decimal<small>unsigned reading</small></th><td class="r">' + esc(r.fixed.unsigned) + '</td><td>' + copyBtn(r.fixed.unsigned, 'unsigned value') + '</td></tr>';
    return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: the value in four number systems"><table class="ns-t"><thead><tr><th scope="col">System</th><th scope="col">Value</th><th scope="col"><span class="sr-only">Copy</span></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }
  function compareTable(r) {
    var f = r.fixed, rows = f.compare.map(function (c) { return '<tr' + (c.selected ? ' class="cu"' : '') + '><th scope="row">' + esc(c.name) + (c.selected ? ' <small>selected</small>' : '') + '</th><td class="r">' + esc(c.value) + '</td><td class="r">' + esc(c.min) + ' to ' + esc(c.max) + '</td></tr>'; }).join('');
    return '<h3>The same ' + r.width + ' bits, read each way</h3><div class="tw" tabindex="0" role="region" aria-label="Scrollable table: one bit pattern in four representations"><table class="ns-t"><thead><tr><th scope="col">Representation</th><th scope="col">Value of ' + esc(f.bits) + '</th><th scope="col">Range at ' + r.width + ' bits</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }
  function facts(r) {
    if (r.mode === 'fixed') { var f = r.fixed; return '<p class="ns-facts"><span>Bit width <b>' + r.width + '</b></span><span>Sign bit (MSB) <b>' + f.msb + '</b></span><span>LSB <b>' + f.lsb + '</b></span><span>Set bits <b>' + f.setBits + '</b></span><span>Clear bits <b>' + f.clearBits + '</b></span></p>'; }
    if (!r.isInteger) return ''; var s = r.facts; return '<p class="ns-facts"><span>Bit length <b>' + s.bitLength + '</b></span><span>Ones <b>' + s.ones + '</b></span><span>Zeros <b>' + s.zeros + '</b></span></p>';
  }
  function headline(r) {
    var id = r.to === 'all' ? null : r.to; if (!id) return '<div class="res"><p class="sub">' + esc(r.input.typed) + ' (' + NAMES[r.from].toLowerCase() + ')' + (r.mode === 'fixed' ? ' as ' + esc(r.repName) + ', ' + r.width + ' bits' : '') + '</p></div>';
    var x = r.outputs[id];
    return '<div class="res"><p class="sub">' + esc(r.input.typed) + ' (' + NAMES[r.from].toLowerCase() + ') in ' + NAMES[id].toLowerCase() + (r.mode === 'fixed' ? ', ' + esc(r.repName) + ', ' + r.width + ' bits' : '') + '</p><div class="big">' + esc(shown(id, x)) + copyBtn(plain(x), NAMES[id].toLowerCase() + ' result') + '</div>' + (x.repeat ? '<p class="sub">Exact (repeating): <b>' + esc(x.repeat) + '</b></p>' : '') + '</div>';
  }
  function render() {
    sync();
    var o = { from: fromSel.value, to: toSel.value, text: inp.value, rep: repSel.value, width: wSel.value, fracDigits: nSel.value, pad: padSel.value }, err = $('nc-err'), r;
    inp.classList.remove('bad'); inp.setAttribute('aria-invalid', 'false'); lastRes = null; $('nc-dl').hidden = true;
    try { r = NumConv.run(o); } catch (e) { r = { ok: false, error: 'An internal check failed, so no result is shown. Please report this input.' }; }
    if (!r.ok) {
      err.textContent = r.empty ? '' : r.error; if (!r.empty) { inp.classList.add('bad'); inp.setAttribute('aria-invalid', 'true'); }
      $('nc-out').innerHTML = ''; $('nc-steps').innerHTML = '<p class="note">Enter a valid number to see the working.</p>'; return;
    }
    err.textContent = ''; lastRes = r;
    var nt = r.notes.map(function (n) { return '<p class="note">' + esc(n) + '</p>'; }).join('');
    $('nc-out').innerHTML = headline(r) + bitsRow(r) + facts(r) + resultTable(r) + (r.mode === 'fixed' ? compareTable(r) : '') + nt;
    $('nc-steps').innerHTML = r.steps.map(function (s) { return '<h3>' + esc(s.title) + '</h3><pre class="al" tabindex="0">' + esc(s.text) + '</pre>'; }).join('');
    $('nc-dl').hidden = false;
  }
  function setAll(d) { fromSel.value = d.from; toSel.value = d.to; inp.value = d.text; repSel.value = d.rep || 'signed'; wSel.value = d.width || '8'; nSel.value = d.fracDigits || '16'; padSel.value = d.pad || 'min'; grpSel.value = d.grp || '0'; render(); }
  function download(name, mime, text) { var a = document.createElement('a'), u = URL.createObjectURL(new Blob([text], { type: mime })); a.href = u; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(u); }, 500); say('Downloaded ' + name); }
  function loadHist() { try { var s = localStorage.getItem(HKEY); hist = s ? JSON.parse(s) : []; if (!Array.isArray(hist)) hist = []; } catch (e) { hist = []; } }
  function saveHist() { try { localStorage.setItem(HKEY, JSON.stringify(hist.slice(0, 10))); } catch (e) {} }
  function drawHist() {
    $('nc-hist').innerHTML = hist.length ? hist.map(function (h, k) { return '<li><button type="button" class="chipb" data-h="' + k + '">' + esc(h.label) + '</button></li>'; }).join('') : '<li class="note">No saved conversions yet. Press Enter or Save to history.</li>';
    $('nc-hclear').hidden = !hist.length;
  }
  function keep() {
    if (!lastRes) return; var r = lastRes, first = r.to === 'all' ? ORDER.filter(function (i) { return i !== r.from; })[0] : r.to;
    var label = r.input.typed + ' (' + NAMES[r.from].toLowerCase() + ') = ' + shown(first, r.outputs[first]) + ' (' + NAMES[first].toLowerCase() + ')' + (r.mode === 'fixed' ? ', ' + r.width + '-bit ' + r.repName : '');
    var d = { from: fromSel.value, to: toSel.value, text: inp.value, rep: repSel.value, width: wSel.value, fracDigits: nSel.value, pad: padSel.value, grp: grpSel.value, label: label };
    hist = hist.filter(function (h) { return h.label !== label; }); hist.unshift(d); hist = hist.slice(0, 10); saveHist(); drawHist(); say('Saved to history');
  }
  function insert(s) {
    var v = inp.value; if (s === 'back') v = v.slice(0, -1); else if (s === 'clear') v = ''; else if (s === '-') v = v.charAt(0) === '-' ? v.slice(1) : '-' + v; else v += s;
    inp.value = v; inp.focus(); render();
  }
  function keypad() {
    var b = fromSel.value, set = b === 'bin' ? '01' : b === 'oct' ? '01234567' : b === 'dec' ? '0123456789' : '0123456789ABCDEF', h = '', i;
    for (i = 0; i < set.length; i++) h += '<button type="button" class="btn2 kp" data-k="' + set.charAt(i) + '" aria-label="Insert ' + set.charAt(i) + '">' + set.charAt(i) + '</button>';
    h += '<button type="button" class="btn2 kp" data-k="." aria-label="Insert radix point">.</button><button type="button" class="btn2 kp" data-k="-" aria-label="Change sign">±</button><button type="button" class="btn2 kp" data-k="back" aria-label="Delete last digit">⌫</button><button type="button" class="btn2 kp" data-k="clear" aria-label="Clear the field">Clear</button>';
    $('nc-kp').innerHTML = h;
  }
  $('nc').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.ex) { setAll(JSON.parse(b.dataset.ex)); keypad(); return; }
    if (b.dataset.k) { insert(b.dataset.k); return; }
    if (b.dataset.h !== undefined) { var h = hist[Number(b.dataset.h)]; if (h) { setAll(h); keypad(); } return; }
    if (b.dataset.act === 'swap') {
      var r = lastRes; if (!r || r.to === 'all' || r.to === r.from) { say('Choose one target system to swap.'); return; }
      var t = r.outputs[r.to].text; fromSel.value = r.to; toSel.value = r.from; inp.value = t; keypad(); render(); return; }
    if (b.dataset.act === 'reset') { setAll(DEF); keypad(); inp.focus(); }
    if (b.dataset.act === 'save') keep();
    if (b.dataset.act === 'hclear') { hist = []; saveHist(); drawHist(); }
    if (b.dataset.dl && lastRes) { var n = 'number-system-conversion'; if (b.dataset.dl === 'txt') download(n + '.txt', 'text/plain', NumConv.exportTxt(lastRes)); if (b.dataset.dl === 'csv') download(n + '.csv', 'text/csv', NumConv.exportCsv(lastRes)); if (b.dataset.dl === 'json') download(n + '.json', 'application/json', NumConv.exportJson(lastRes)); }
  });
  inp.addEventListener('input', render);
  inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); keep(); } });
  fromSel.addEventListener('change', function () { keypad(); render(); });
  [toSel, repSel, wSel, nSel, padSel, grpSel].forEach(function (s) { s.addEventListener('change', render); });
  loadHist(); drawHist(); keypad(); setAll(DEF);
})();
