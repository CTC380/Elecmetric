/* Elecmetric Binary Calculator, Mode 03: Bitwise Operations. Page script. Inlined by tools/bitops_page.js after the engine (BitOps). */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var opS = $('bo-op'), baseS = $('bo-base'), wS = $('bo-w'), aI = $('bo-a'), bI = $('bo-b'), nI = $('bo-n'), grpS = $('bo-grp'), lastRes = null;
  var DEF = { op: 'and', base: 'bin', width: '8', a: '10101010', b: '00001111', n: '2' }, HKEY = 'em-bitops-history', hist = [];
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function say(t) { $('bo-note').textContent = t; }
  function copy(t) { var d = function () { say('Copied ' + t); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function cb(t, l) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="Copy ' + esc(l) + '">Copy</button>'; }
  function isBit() { return /bit$/.test(opS.value); }
  function sync() {
    var op = opS.value, needB = !!BitOps.NEEDB[op], needN = !!BitOps.NEEDN[op];
    $('bo-wrap-b').hidden = !needB; $('bo-wrap-n').hidden = !needN;
    $('bo-nl').textContent = isBit() ? 'Bit position (0 = least significant)' : 'Shift amount (bits)';
    wS.querySelector('option[value="auto"]').disabled = !!BitOps.NEEDW[op];
    if (BitOps.NEEDW[op] && wS.value === 'auto') { wS.value = '8'; say('NOT and shifts need a fixed width, so 8 bits is selected.'); }
    $('bo-hint').textContent = BitOps.NEEDW[op] ? 'This operation needs an explicit bit width: the result depends on how many bits the register has.' : 'Automatic width uses the longest value typed, rounded up to a whole nibble.';
  }
  function hl(i) { return (i % 4 === 3 ? ' g' : ''); }
  function grid(r) {
    var W = r.width, h = '<tr><th scope="row">Bit</th>', rowA = '<tr><th scope="row">A</th>', rowB = r.b ? '<tr><th scope="row">B</th>' : '', rowR = '<tr class="res-r"><th scope="row">' + esc(r.opName) + '</th>', rowC = '<tr><th scope="row">Changed</th>', rowS = '', x;
    var shift = r.op === 'shl' || r.op === 'shr' || r.op === 'sar'; if (shift) rowS = '<tr><th scope="row">From bit</th>';
    r.rows.forEach(function (c) {
      var g = hl(c.i) + (c.i === W - 1 ? '' : '');
      h += '<th scope="col" class="ix' + g + (c.target ? ' tg' : '') + '">' + c.i + '</th>';
      rowA += '<td class="' + (c.a ? 'on' : '') + g + (c.target ? ' tg' : '') + '">' + c.a + '</td>';
      if (r.b) rowB += '<td class="' + (c.b ? 'on' : '') + g + '">' + c.b + '</td>';
      rowR += '<td class="' + (c.r ? 'one' : '') + (c.changed ? ' chg' : '') + g + (c.target ? ' tg' : '') + '">' + c.r + '</td>';
      rowC += '<td class="mk' + g + '">' + (c.changed ? '≠' : '') + '</td>';
      if (shift) rowS += '<td class="mk' + g + '">' + (c.src !== null ? c.src : (c.fill === 'sign' ? 's' : '0')) + '</td>';
    });
    return '<div class="tw bg-w" tabindex="0" role="region" aria-label="Scrollable table: the bits of each value, most significant first"><table class="bg"><caption class="sr-only">' + esc(r.opName) + ' bit by bit, ' + W + ' bits, most significant bit first</caption><tbody>' + h + '</tr>' + rowA + '</tr>' + rowB + (r.b ? '</tr>' : '') + rowR + '</tr>' + rowS + (shift ? '</tr>' : '') + rowC + '</tr></tbody></table></div><p class="note">Gold: the result bit is 1. Outlined and marked ≠: the bit differs from A.' + (shift ? ' “From bit” is the position the result bit came from; 0 or s means a zero or a sign-bit copy was shifted in.' : '') + '</p>';
  }
  function numbers(r) {
    var rows = [['A', r.a]].concat(r.b ? [['B', r.b]] : [], [['Result', r.result]]).map(function (p) { var d = p[1]; return '<tr' + (p[0] === 'Result' ? ' class="cu"' : '') + '><th scope="row">' + p[0] + '</th><td class="r">' + esc(grp() ? d.grouped : d.bin) + '</td><td class="r">' + d.hex + '</td><td class="r">' + d.oct + '</td><td class="r">' + d.uns + '</td><td class="r">' + d.sgn + '</td><td>' + cb(d.bin, p[0].toLowerCase() + ' binary') + '</td></tr>'; }).join('');
    return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: each value in binary, hexadecimal, octal and decimal"><table class="ns-t"><thead><tr><th scope="col">Value</th><th scope="col">Binary</th><th scope="col">Hex</th><th scope="col">Octal</th><th scope="col">Unsigned</th><th scope="col">Signed (two’s complement)</th><th scope="col"><span class="sr-only">Copy</span></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }
  function grp() { return grpS.value === '4'; }
  function headline(r) {
    var d = r.result, extra = '';
    if (r.op === 'testbit') extra = '<p class="sub">Bit ' + r.n + ' is <b>' + (r.bit.value ? 'set (1)' : 'clear (0)') + '</b>.</p>';
    if (r.op === 'diff') extra = '<p class="sub">' + (r.diff.count ? r.diff.count + ' differing bit' + (r.diff.count === 1 ? '' : 's') + ' at position' + (r.diff.count === 1 ? ' ' : 's ') + r.diff.positions.join(', ') : 'The values are identical') + ' (Hamming distance ' + r.diff.count + ').</p>';
    if (r.lost) extra += '<p class="sub">Shifted out: <b>' + esc(r.lost) + '</b></p>';
    return '<div class="res"><p class="sub">' + esc(r.expr) + (BitOps.NEEDN[r.op] ? ', n = ' + r.n : '') + ', ' + r.width + ' bits' + (r.auto ? ' (automatic)' : '') + '</p><div class="big">' + esc(grp() ? d.grouped : d.bin) + cb(d.bin, 'result') + '</div><p class="sub">hex <b>' + d.hex + '</b> · unsigned <b>' + d.uns + '</b> · signed <b>' + d.sgn + '</b></p>' + extra + '</div>';
  }
  function facts(r) { var d = r.result; return '<p class="ns-facts"><span>Bit width <b>' + r.width + '</b></span><span>MSB <b>' + d.msb + '</b></span><span>LSB <b>' + d.lsb + '</b></span><span>Set bits <b>' + d.ones + '</b></span><span>Clear bits <b>' + d.zeros + '</b></span></p>'; }
  function render() {
    sync();
    var o = { op: opS.value, base: baseS.value, width: wS.value, a: aI.value, b: bI.value, n: nI.value }, r, err = $('bo-err');
    [aI, bI, nI].forEach(function (e) { e.classList.remove('bad'); e.setAttribute('aria-invalid', 'false'); }); lastRes = null; $('bo-dl').hidden = true;
    try { r = BitOps.run(o); } catch (e) { r = { ok: false, error: 'An internal check failed, so no result is shown. Please report this input.' }; }
    if (!r.ok) {
      err.textContent = r.empty ? '' : r.error; var f = r.field === 'b' ? bI : r.field === 'n' ? nI : aI; if (r.error && !r.empty) { f.classList.add('bad'); f.setAttribute('aria-invalid', 'true'); }
      $('bo-out').innerHTML = ''; $('bo-steps').innerHTML = '<p class="note">Enter valid values to see the working.</p>'; return;
    }
    err.textContent = ''; lastRes = r;
    $('bo-out').innerHTML = headline(r) + grid(r) + facts(r) + numbers(r) + r.notes.map(function (n) { return '<p class="note">' + esc(n) + '</p>'; }).join('');
    $('bo-steps').innerHTML = r.steps.map(function (s) { return '<h3>' + esc(s.title) + '</h3><pre class="al" tabindex="0">' + esc(s.text) + '</pre>'; }).join('');
    $('bo-dl').hidden = false;
  }
  function setAll(d) { opS.value = d.op; baseS.value = d.base || 'bin'; wS.value = d.width || '8'; aI.value = d.a || ''; bI.value = d.b || ''; nI.value = d.n == null ? '' : d.n; grpS.value = d.grp || '0'; render(); }
  function download(name, mime, text) { var a = document.createElement('a'), u = URL.createObjectURL(new Blob([text], { type: mime })); a.href = u; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(u); }, 500); say('Downloaded ' + name); }
  function loadHist() { try { var s = localStorage.getItem(HKEY); hist = s ? JSON.parse(s) : []; if (!Array.isArray(hist)) hist = []; } catch (e) { hist = []; } }
  function saveHist() { try { localStorage.setItem(HKEY, JSON.stringify(hist.slice(0, 10))); } catch (e) {} }
  function drawHist() { $('bo-hist').innerHTML = hist.length ? hist.map(function (h, k) { return '<li><button type="button" class="chipb" data-h="' + k + '">' + esc(h.label) + '</button></li>'; }).join('') : '<li class="note">No saved operations yet. Press Enter or Save to history.</li>'; $('bo-hclear').hidden = !hist.length; }
  function keep() {
    if (!lastRes) return; var r = lastRes, label = r.opName + ' ' + (r.b ? r.a.bin + ', ' + r.b.bin : r.a.bin) + (BitOps.NEEDN[r.op] ? ', n = ' + r.n : '') + ' = ' + r.result.bin + ' (' + r.width + ' bits)';
    var d = { op: opS.value, base: baseS.value, width: wS.value, a: aI.value, b: bI.value, n: nI.value, grp: grpS.value, label: label };
    hist = hist.filter(function (h) { return h.label !== label; }); hist.unshift(d); hist = hist.slice(0, 10); saveHist(); drawHist(); say('Saved to history');
  }

  var KPS = { bin: '01', oct: '01234567', dec: '0123456789', hex: '0123456789ABCDEF' }, lastF = aI, kpBox = $('bo-kp');
  function fbase(f) { return f === nI ? 'dec' : baseS.value; }
  function drawKp() {
    var f = lastF, bs = fbase(f), keys = KPS[bs] || KPS.bin, h = '';
    for (var i = 0; i < keys.length; i++) h += '<button type="button" class="btn2 kp" data-k="' + keys.charAt(i) + '" aria-label="Insert ' + keys.charAt(i) + '">' + keys.charAt(i) + '</button>';
    
    h += '<button type="button" class="btn2 kp" data-k="back" aria-label="Delete last digit">\u232b</button><button type="button" class="btn2 kp" data-k="clear" aria-label="Clear the field">Clear</button>';
    kpBox.innerHTML = h;
  }
  function kpInsert(s) {
    var f = lastF; if (!f) return;
    if (s === 'back') f.value = f.value.slice(0, -1); else if (s === 'clear') f.value = ''; else if (s === '-') f.value = f.value.charAt(0) === '-' ? f.value.slice(1) : '-' + f.value; else f.value += s;
    f.focus(); render();
  }
  [aI, bI, nI].forEach(function (el) { el.addEventListener('focus', function () { lastF = el; drawKp(); }); });
  baseS.addEventListener('change', drawKp);
  drawKp();
  $('bo').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.k) { kpInsert(b.dataset.k); return; }
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.ex) { setAll(JSON.parse(b.dataset.ex)); return; }
    if (b.dataset.h !== undefined) { var h = hist[Number(b.dataset.h)]; if (h) setAll(h); return; }
    if (b.dataset.act === 'swap') { var t = aI.value; aI.value = bI.value; bI.value = t; render(); return; }
    if (b.dataset.act === 'reset') { setAll(DEF); aI.focus(); }
    if (b.dataset.act === 'save') keep();
    if (b.dataset.act === 'hclear') { hist = []; saveHist(); drawHist(); }
    if (b.dataset.dl && lastRes) { var n = 'bitwise-operation'; if (b.dataset.dl === 'txt') download(n + '.txt', 'text/plain', BitOps.exportTxt(lastRes)); if (b.dataset.dl === 'csv') download(n + '.csv', 'text/csv', BitOps.exportCsv(lastRes)); if (b.dataset.dl === 'json') download(n + '.json', 'application/json', BitOps.exportJson(lastRes)); }
  });
  [aI, bI, nI].forEach(function (e) { e.addEventListener('input', render); e.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); keep(); } }); });
  [opS, baseS, wS, grpS].forEach(function (s) { s.addEventListener('change', render); });
  loadHist(); drawHist(); setAll(DEF);
})();
