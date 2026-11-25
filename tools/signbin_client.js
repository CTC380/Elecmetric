/* Elecmetric Binary Calculator, Mode 04: Signed Binary Representations. Page script. Inlined by tools/signbin_page.js after the engine (SignBin). */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var opS = $('sb-op'), repS = $('sb-rep'), wS = $('sb-w'), baseS = $('sb-base'), toS = $('sb-to'), polS = $('sb-pol'), grpS = $('sb-grp'), aI = $('sb-a'), bI = $('sb-b'), lastRes = null;
  var DEF = { op: 'analyze', rep: 'twos', width: '8', base: 'dec', a: '-5', b: '3', to: '16', policy: 'flag', grp: '4' }, HKEY = 'em-signbin-history', hist = [];
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function say(t) { $('sb-note').textContent = t; }
  function copy(t) { var d = function () { say('Copied ' + t); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function cb(t, l) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="Copy ' + esc(l) + '">Copy</button>'; }
  function grp() { return grpS.value === '4'; }
  function bits(d) { return grp() ? d.grouped : d.bin; }
  function sync() {
    var op = opS.value, two = op === 'add' || op === 'sub', calc = two || op === 'neg';
    $('sb-wrap-b').hidden = !two; $('sb-wrap-to').hidden = op !== 'resize'; $('sb-wrap-pol').hidden = !calc;
    $('sb-al').textContent = two ? 'A' : (op === 'analyze' ? 'Value or bit pattern' : 'A');
    var bs = baseS.value === 'dec' ? 'A decimal entry is a signed value that is encoded in the chosen representation and must fit. ' : 'A binary, octal or hex entry is a bit pattern with no sign; it is padded with zeros on the left to the chosen width. ';
    $('sb-hint').textContent = bs + 'The representation decides what the bits mean: 11111111 is 255 unsigned and -1 in 8-bit two’s complement.';
  }
  function weightsTable(d, W, rep) {
    if (W > 16) return '<p class="note">Place values are shown for 4, 8 and 16 bits. At ' + W + ' bits the most significant bit has weight ' + esc(d.weights[0]) + (rep === 'signmag' ? ' (the sign)' : '') + '.</p>';
    var h = '<tr><th scope="row">Bit</th>', w = '<tr><th scope="row">Place value</th>', v = '<tr class="res-r"><th scope="row">Bit value</th>', i;
    for (i = 0; i < W; i++) { var g = ((W - 1 - i) % 4 === 3 ? ' g' : ''), top = i === 0; h += '<th scope="col" class="ix' + g + '">' + (W - 1 - i) + '</th>'; w += '<td class="mk' + g + (top ? ' sg' : '') + '">' + esc(d.weights[i]) + '</td>'; v += '<td class="' + (d.bin.charAt(i) === '1' ? 'one' : '') + g + (top ? ' sg' : '') + '">' + d.bin.charAt(i) + '</td>'; }
    return '<div class="tw bg-w" tabindex="0" role="region" aria-label="Scrollable table: the bits and their place values, most significant first"><table class="bg"><caption class="sr-only">Bits and place values, ' + W + ' bits, most significant first</caption><tbody>' + h + '</tr>' + w + '</tr>' + v + '</tr></tbody></table></div><p class="note">Gold: the bit is 1. The outlined left column is the sign bit' + (rep === 'unsigned' ? ' position; unsigned has no sign, so it is an ordinary place value.' : '.') + '</p>';
  }
  function reads(d) {
    var rows = d.reads.map(function (x) { return '<tr' + (x.selected ? ' class="cu"' : '') + '><th scope="row">' + esc(x.name) + (x.selected ? ' <span class="note">(selected)</span>' : '') + '</th><td class="r">' + esc(x.value) + '</td><td class="r">' + esc(x.min) + ' to ' + esc(x.max) + '</td></tr>'; }).join('');
    return '<h3>The same bits in each representation</h3><div class="tw" tabindex="0" role="region" aria-label="Scrollable table: the value of the bits in each representation"><table class="ns-t"><thead><tr><th scope="col">Representation</th><th scope="col">Value of these bits</th><th scope="col">Range</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }
  function writes(r) {
    var rows = r.writes.map(function (x) { return '<tr' + (x.rep === r.rep ? ' class="cu"' : '') + '><th scope="row">' + esc(x.name) + '</th><td class="r">' + (x.bin ? esc(grp() ? x.grouped : x.bin) : '<span class="note">' + esc(x.why) + '</span>') + '</td><td class="r">' + esc(x.min) + ' to ' + esc(x.max) + '</td></tr>'; }).join('');
    return '<h3>This value written in each representation</h3><div class="tw" tabindex="0" role="region" aria-label="Scrollable table: the value written in each representation"><table class="ns-t"><thead><tr><th scope="col">Representation</th><th scope="col">Bit pattern</th><th scope="col">Range</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }
  function facts(r) {
    var d = r.result; if (!d) return '';
    return '<p class="ns-facts"><span>Bit width <b>' + (r.toWidth || r.width) + '</b></span><span>Sign bit <b>' + (r.rep === 'unsigned' ? 'none' : d.sign) + '</b></span><span>Unsigned <b>' + d.uns + '</b></span><span>Value (' + esc(r.repName) + ') <b>' + esc(d.value) + '</b></span><span>One’s complement of bits <b>' + (grp() ? esc(d.onesComp.replace(/(\d{4})(?=\d)/g, '$1 ')) : esc(d.onesComp)) + '</b></span><span>Two’s complement of bits <b>' + (grp() ? esc(d.twosComp.replace(/(\d{4})(?=\d)/g, '$1 ')) : esc(d.twosComp)) + '</b></span><span>Min <b>' + esc(r.range.min) + '</b></span><span>Max <b>' + esc(r.range.max) + '</b></span></p>';
  }
  function warnings(r) { return r.warnings.map(function (w) { return '<p class="ns-warn" role="alert"><b>' + (w.kind === 'overflow' ? 'Overflow' : w.kind === 'underflow' ? 'Underflow' : 'Note') + '</b> ' + esc(w.text) + '</p>'; }).join(''); }
  function headline(r) {
    var d = r.result, W = r.toWidth || r.width, sub, big;
    if (r.op === 'analyze') { sub = esc(r.repName) + ', ' + W + ' bits'; big = esc(bits(d)) + cb(d.bin, 'bit pattern'); return '<div class="res"><p class="sub">' + sub + '</p><div class="big">' + big + '</div><p class="sub">value <b>' + esc(d.value) + '</b> · unsigned <b>' + d.uns + '</b> · hex <b>' + d.hex + '</b></p></div>'; }
    if (r.op === 'resize') return '<div class="res"><p class="sub">' + esc(r.repName) + ', ' + r.fromWidth + ' to ' + W + ' bits: ' + esc(r.a.value) + '</p><div class="big">' + esc(bits(d)) + cb(d.bin, 'result') + '</div><p class="sub">value <b>' + esc(d.value) + '</b> · hex <b>' + d.hex + '</b></p></div>';
    var c = r.calc, exact = '<p class="sub">True result ' + esc(c.symbol) + ' = <b>' + esc(c.exact) + '</b>' + (c.flag ? ' (' + c.flag + ')' : '') + '</p>';
    if (!d) return '<div class="res"><p class="sub">' + esc(r.repName) + ', ' + W + ' bits, overflow policy: report</p><div class="big">No stored result</div>' + exact + '</div>';
    return '<div class="res"><p class="sub">' + esc(r.repName) + ', ' + W + ' bits' + (c.flag ? ', ' + (c.policy === 'wrap' ? 'wrapped around' : 'saturated') : '') + '</p><div class="big">' + esc(bits(d)) + cb(d.bin, 'result') + '</div><p class="sub">value <b>' + esc(d.value) + '</b> · unsigned <b>' + d.uns + '</b> · hex <b>' + d.hex + '</b></p>' + exact + '</div>';
  }
  function operands(r) {
    var rows = [['A', r.a]].concat(r.b ? [['B', r.b]] : []).map(function (p) { return '<tr><th scope="row">' + p[0] + '</th><td class="r">' + esc(bits(p[1])) + '</td><td class="r">' + esc(p[1].value) + '</td><td class="r">' + p[1].hex + '</td><td class="r">' + p[1].uns + '</td><td>' + cb(p[1].bin, p[0].toLowerCase() + ' bits') + '</td></tr>'; }).join('');
    return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: the operands"><table class="ns-t"><thead><tr><th scope="col">Operand</th><th scope="col">Bits</th><th scope="col">Value (' + esc(r.repName) + ')</th><th scope="col">Hex</th><th scope="col">Unsigned</th><th scope="col"><span class="sr-only">Copy</span></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }
  function squeeze(r) {
    if (!r.calc || r.calc.inRange) return '';
    var c = r.calc; return '<h3>If the result is squeezed into ' + r.width + ' bits</h3><div class="tw" tabindex="0" role="region" aria-label="Scrollable table: wrap around and saturate"><table class="ns-t"><thead><tr><th scope="col">Policy</th><th scope="col">Bits</th><th scope="col">Value</th></tr></thead><tbody><tr><th scope="row">Wrap around</th><td class="r">' + esc(bits(c.wrap)) + '</td><td class="r">' + esc(c.wrap.value) + '</td></tr><tr><th scope="row">Saturate</th><td class="r">' + esc(bits(c.sat)) + '</td><td class="r">' + esc(c.sat.value) + '</td></tr></tbody></table></div>';
  }
  function render() {
    sync();
    var o = { op: opS.value, rep: repS.value, width: wS.value, base: baseS.value, a: aI.value, b: bI.value, to: toS.value, policy: polS.value }, r, err = $('sb-err');
    [aI, bI].forEach(function (e) { e.classList.remove('bad'); e.setAttribute('aria-invalid', 'false'); }); lastRes = null; $('sb-dl').hidden = true;
    try { r = SignBin.run(o); } catch (e) { r = { ok: false, error: 'An internal check failed, so no result is shown. Please report this input.' }; }
    if (!r.ok) {
      err.textContent = r.empty ? '' : r.error; var f = r.field === 'b' ? bI : aI; if (r.error && !r.empty) { f.classList.add('bad'); f.setAttribute('aria-invalid', 'true'); }
      $('sb-out').innerHTML = ''; $('sb-steps').innerHTML = '<p class="note">Enter valid values to see the working.</p>'; return;
    }
    err.textContent = ''; lastRes = r;
    var d = r.result || r.a, W = r.toWidth || r.width;
    $('sb-out').innerHTML = headline(r) + warnings(r) + (r.op === 'analyze' || r.op === 'resize' ? facts(r) : '') + (r.op !== 'analyze' ? operands(r) : '') + squeeze(r) + (r.op === 'analyze' || r.op === 'resize' ? weightsTable(d, W, r.rep) : (r.result ? weightsTable(r.result, W, r.rep) : '')) + (r.op === 'analyze' ? reads(r.a) + (r.aFromValue && r.writes ? writes(r) : '') : '') + r.notes.map(function (n) { return '<p class="note">' + esc(n) + '</p>'; }).join('');
    $('sb-steps').innerHTML = r.steps.map(function (s) { return '<h3>' + esc(s.title) + '</h3><pre class="al" tabindex="0">' + esc(s.text) + '</pre>'; }).join('');
    $('sb-dl').hidden = false;
  }
  function setAll(d) { opS.value = d.op; repS.value = d.rep; wS.value = d.width || '8'; baseS.value = d.base || 'dec'; toS.value = d.to || '16'; polS.value = d.policy || 'flag'; grpS.value = d.grp || '0'; aI.value = d.a || ''; bI.value = d.b || ''; render(); }
  function download(name, mime, text) { var a = document.createElement('a'), u = URL.createObjectURL(new Blob([text], { type: mime })); a.href = u; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(u); }, 500); say('Downloaded ' + name); }
  function loadHist() { try { var s = localStorage.getItem(HKEY); hist = s ? JSON.parse(s) : []; if (!Array.isArray(hist)) hist = []; } catch (e) { hist = []; } }
  function saveHist() { try { localStorage.setItem(HKEY, JSON.stringify(hist.slice(0, 10))); } catch (e) {} }
  function drawHist() { $('sb-hist').innerHTML = hist.length ? hist.map(function (h, k) { return '<li><button type="button" class="chipb" data-h="' + k + '">' + esc(h.label) + '</button></li>'; }).join('') : '<li class="note">No saved operations yet. Press Enter or Save to history.</li>'; $('sb-hclear').hidden = !hist.length; }
  function keep() {
    if (!lastRes) return; var r = lastRes, label = r.opName + ' ' + (r.b ? r.a.bin + ', ' + r.b.bin : r.a.bin) + ' (' + r.repName + ', ' + r.width + ' bits)' + (r.calc ? ' = ' + r.calc.exact : r.result ? ' = ' + r.result.value : '');
    var d = { op: opS.value, rep: repS.value, width: wS.value, base: baseS.value, a: aI.value, b: bI.value, to: toS.value, policy: polS.value, grp: grpS.value, label: label };
    hist = hist.filter(function (h) { return h.label !== label; }); hist.unshift(d); hist = hist.slice(0, 10); saveHist(); drawHist(); say('Saved to history');
  }

  var KPS = { bin: '01', oct: '01234567', dec: '0123456789', hex: '0123456789ABCDEF' }, lastF = aI, kpBox = $('sb-kp');
  function fbase(f) { return false ? 'dec' : baseS.value; }
  function drawKp() {
    var f = lastF, bs = fbase(f), keys = KPS[bs] || KPS.bin, h = '';
    for (var i = 0; i < keys.length; i++) h += '<button type="button" class="btn2 kp" data-k="' + keys.charAt(i) + '" aria-label="Insert ' + keys.charAt(i) + '">' + keys.charAt(i) + '</button>';
    if (bs === 'dec' && f !== null) h += '<button type="button" class="btn2 kp" data-k="-" aria-label="Change sign">\u00b1</button>';
    h += '<button type="button" class="btn2 kp" data-k="back" aria-label="Delete last digit">\u232b</button><button type="button" class="btn2 kp" data-k="clear" aria-label="Clear the field">Clear</button>';
    kpBox.innerHTML = h;
  }
  function kpInsert(s) {
    var f = lastF; if (!f) return;
    if (s === 'back') f.value = f.value.slice(0, -1); else if (s === 'clear') f.value = ''; else if (s === '-') f.value = f.value.charAt(0) === '-' ? f.value.slice(1) : '-' + f.value; else f.value += s;
    f.focus(); render();
  }
  [aI, bI].forEach(function (el) { el.addEventListener('focus', function () { lastF = el; drawKp(); }); });
  baseS.addEventListener('change', drawKp);
  drawKp();
  $('sb').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.k) { kpInsert(b.dataset.k); return; }
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.ex) { setAll(JSON.parse(b.dataset.ex)); return; }
    if (b.dataset.h !== undefined) { var h = hist[Number(b.dataset.h)]; if (h) setAll(h); return; }
    if (b.dataset.act === 'swap') { var t = aI.value; aI.value = bI.value; bI.value = t; render(); return; }
    if (b.dataset.act === 'reset') { setAll(DEF); aI.focus(); }
    if (b.dataset.act === 'save') keep();
    if (b.dataset.act === 'hclear') { hist = []; saveHist(); drawHist(); }
    if (b.dataset.dl && lastRes) { var n = 'signed-binary'; if (b.dataset.dl === 'txt') download(n + '.txt', 'text/plain', SignBin.exportTxt(lastRes)); if (b.dataset.dl === 'csv') download(n + '.csv', 'text/csv', SignBin.exportCsv(lastRes)); if (b.dataset.dl === 'json') download(n + '.json', 'application/json', SignBin.exportJson(lastRes)); }
  });
  [aI, bI].forEach(function (e) { e.addEventListener('input', render); e.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); keep(); } }); });
  [opS, repS, wS, baseS, toS, polS, grpS].forEach(function (s) { s.addEventListener('change', render); });
  loadHist(); drawHist(); setAll(DEF);
})();
