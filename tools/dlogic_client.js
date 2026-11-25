/* Elecmetric Binary Calculator, Mode 05: Digital Electronics and Logic. Page script. Inlined by tools/dlogic_page.js after the engine (DigiLogic). */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var opS = $('dl-op'), baseS = $('dl-base'), wS = $('dl-w'), valI = $('dl-val'), exprI = $('dl-expr'), expr2I = $('dl-expr2'), varsS = $('dl-vars'), asgI = $('dl-assign'), colsS = $('dl-cols'), fldI = $('dl-fields'), mskI = $('dl-mask'), actS = $('dl-act'), kindS = $('dl-kind'), posS = $('dl-pos'), pmodeS = $('dl-pmode'), lastRes = null;
  var DEF = { op: 'bool', expr: 'A AND (B OR NOT C)', expr2: '', vars: '', assign: '', cols: '1', base: 'bin', width: '8', val: '10101010', fields: 'MODE:7:6, EN:5, PS:3:0', mask: '', act: 'none', kind: 'even', pos: 'msb', pmode: 'generate' };
  var HKEY = 'em-dlogic-history', hist = [];
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function say(t) { $('dl-note').textContent = t; }
  function copy(t) { var d = function () { say('Copied ' + t); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function cb(t, l) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="Copy ' + esc(l) + '">Copy</button>'; }
  function tw(label, html) { return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + esc(label) + '">' + html + '</div>'; }
  function tbl(head, rows, cls) { return '<table class="ns-t' + (cls ? ' ' + cls : '') + '"><thead><tr>' + head.map(function (h) { return '<th scope="col">' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table>'; }
  function show(id, on) { $(id).hidden = !on; }
  function sync() {
    var op = opS.value, b = op === 'bool', r = op === 'reg', p = op === 'parity', g = op === 'group';
    ['dl-b-expr', 'dl-b-expr2', 'dl-b-vars', 'dl-b-assign', 'dl-b-cols'].forEach(function (i) { show(i, b); });
    ['dl-r-base', 'dl-r-w', 'dl-r-val'].forEach(function (i) { show(i, !b); });
    show('dl-r-fields', r); show('dl-r-mask', r); show('dl-r-act', r); ['dl-p-kind', 'dl-p-pos', 'dl-p-mode'].forEach(function (i) { show(i, p); });
    var auto = wS.querySelector('option[value=auto]'); if (auto) { auto.disabled = p; if (p && wS.value === 'auto') wS.value = '8'; }
    $('dl-vl').textContent = r ? 'Register value' : p ? (pmodeS.value === 'check' ? 'Received word (data plus parity bit)' : 'Data word') : 'Value';
    $('dl-wl').textContent = p ? 'Data width' : (r ? 'Register width' : 'Width');
    $('dl-hint').textContent = b ? 'Type an expression such as A AND (B OR NOT C), AB\' + C or A ^ B (AND, OR, NOT, XOR, NAND, NOR, XNOR or & | ! ^ + and a prime), or a minterm list such as m(1,3,5,7) d(0). Letters written together mean AND. 1 to 6 variables.' : r ? 'Enter the register value, then optionally name bit fields (NAME:high:low) and apply a mask as bit positions (0,3,5-7) or a pattern (0xF0).' : p ? 'Generate the parity bit for a data word, or check a received word that already includes its parity bit.' : 'Split a value into nibbles, bytes, words and double words, and see big-endian and little-endian byte order.';
  }
  function gateDiagram(t) {
    var leaves = 0, maxd = 0;
    function place(n) { if (n.kind !== 'gate') { n.d = 0; n.y = leaves++; return; } n.kids.forEach(place); n.d = 1 + Math.max.apply(null, n.kids.map(function (k) { return k.d; })); n.y = n.kids.reduce(function (s, k) { return s + k.y; }, 0) / n.kids.length; if (n.d > maxd) maxd = n.d; }
    place(t); if (leaves > 32) return '<p class="note">The gate diagram is shown for expressions with up to 32 inputs; this one has ' + leaves + '. The gate trace below still lists every gate.</p>';
    var X0 = 44, DX = 112, BW = 62, BH = 26, H = leaves * 36 + 16, W = X0 + (maxd + 1) * DX + 70, out = '', wires = '';
    function xr(n) { return n.kind === 'gate' ? X0 + n.d * DX + BW : X0 + 6; }
    function xl(n) { return X0 + n.d * DX; }
    function py(n) { return 18 + n.y * 36; }
    function draw(n) {
      if (n.kind !== 'gate') { out += '<circle cx="' + (X0) + '" cy="' + py(n) + '" r="6" class="dg-pin' + n.value + '"/><text x="' + (X0 - 12) + '" y="' + (py(n) + 4) + '" text-anchor="end" class="dg-t">' + esc(n.name) + '=' + n.value + '</text>'; return; }
      n.kids.forEach(function (k) { var x1 = xr(k), y1 = py(k), x2 = xl(n), y2 = py(n) + (n.kids.length === 2 ? (k === n.kids[0] ? -6 : 6) : 0), xm = (x1 + x2) / 2; wires += '<path d="M' + x1 + ' ' + y1 + ' H' + xm + ' V' + y2 + ' H' + x2 + '" class="dg-w' + k.value + '" fill="none"/>'; draw(k); });
      out += '<rect x="' + xl(n) + '" y="' + (py(n) - BH / 2) + '" width="' + BW + '" height="' + BH + '" rx="6" class="dg-g"/><text x="' + (xl(n) + BW / 2) + '" y="' + (py(n) + 4) + '" text-anchor="middle" class="dg-t">' + n.op + '</text>';
    }
    draw(t);
    var rx = xr(t), ry = py(t); wires += '<path d="M' + rx + ' ' + ry + ' H' + (rx + 28) + '" class="dg-w' + t.value + '" fill="none"/>'; out += '<text x="' + (rx + 34) + '" y="' + (ry + 4) + '" class="dg-t dg-o">F=' + t.value + '</text>';
    return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable gate diagram"><svg class="dg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Gate diagram of the expression with the chosen input values; wires carrying 1 are highlighted"><title>Gate diagram</title>' + wires + out + '</svg></div><p class="note">Highlighted wires carry 1, grey wires carry 0. Each input letter is shown where it is used.</p>';
  }
  function boolOut(r) {
    var vars = r.vars, cols = colsS.value === '1' ? r.cols : [], head = vars.concat(cols.map(function (c) { return c.label; })).concat(['F']);
    var rows = r.rows.map(function (q) { return '<tr' + (q.out === 1 ? ' class="cu"' : '') + '>' + q.inp.map(function (b) { return '<td class="r">' + b + '</td>'; }).join('') + cols.map(function (c) { return '<td class="r">' + c.vals[q.i] + '</td>'; }).join('') + '<td class="r"><b>' + q.out + '</b></td></tr>'; });
    var h = '<div class="res"><p class="sub">' + esc(r.normalized) + '</p><div class="big">' + esc(r.minSop.expr) + cb(r.minSop.expr, 'minimal SOP') + '</div><p class="sub">minimal sum of products (' + r.minSop.terms + ' term' + (r.minSop.terms === 1 ? '' : 's') + ', ' + r.minSop.lits + ' literal' + (r.minSop.lits === 1 ? '' : 's') + ')</p><div class="big">' + esc(r.minPos.expr) + cb(r.minPos.expr, 'minimal POS') + '</div><p class="sub">minimal product of sums (' + r.minPos.terms + ' term' + (r.minPos.terms === 1 ? '' : 's') + ', ' + r.minPos.lits + ' literal' + (r.minPos.lits === 1 ? '' : 's') + ')</p></div>';
    h += '<p class="ns-facts"><span>Variables <b>' + esc(vars.join(', ')) + '</b></span><span>Rows <b>' + r.rowsTotal + '</b></span><span>Ones <b>' + r.ones + '</b></span><span>Zeros <b>' + r.zeros + '</b></span>' + (r.dontcares.length ? '<span>Don’t-care <b>' + r.dontcares.length + '</b></span>' : '') + '<span>Minterms <b>Σm(' + r.minterms.join(',') + ')</b></span><span>Maxterms <b>ΠM(' + r.maxterms.join(',') + ')</b></span></p>';
    h += r.warnings.map(function (w) { return '<p class="ns-warn" role="note"><b>Note</b> ' + esc(w.text) + '</p>'; }).join('');
    h += '<h3>Truth table</h3>' + tw('truth table', tbl(head, rows)) + '<p class="note">Highlighted rows give F = 1. ' + esc(vars[0]) + ' is the most significant input.</p>';
    h += '<h3>Canonical forms</h3><p class="ns-facts"><span>Canonical SOP <b>' + esc(r.canonSop) + '</b></span><span>Canonical POS <b>' + esc(r.canonPos) + '</b></span></p>';
    if (r.primes.length) h += '<h3>Prime implicants</h3>' + tw('prime implicants', tbl(['Cube', 'Term', 'Covers minterms', 'Role'], r.primes.map(function (p) { return '<tr' + (p.chosen ? ' class="cu"' : '') + '><td class="r">' + esc(p.cube) + '</td><td class="r">' + esc(p.expr) + '</td><td class="r">' + p.covers.join(', ') + '</td><td>' + (p.essential ? 'essential' : p.chosen ? 'chosen' : 'not needed') + '</td></tr>'; })));
    if (r.equiv) h += '<h3>Equivalence</h3><p class="' + (r.equiv.equal ? 'ns-facts' : 'ns-warn') + '" role="status"><b>' + (r.equiv.equal ? 'Equivalent' : 'Not equivalent') + '</b> ' + esc(r.normalized) + ' and ' + esc(r.equiv.expr2) + (r.equiv.equal ? ' give the same output for every input.' : ' differ in ' + r.equiv.diffCount + ' of ' + (1 << r.equiv.vars.length) + ' rows.') + '</p>' + (r.equiv.equal ? '' : tw('rows where they differ', tbl(r.equiv.vars.concat(['first', 'second']), r.equiv.diff.map(function (d) { return '<tr>' + d.inp.map(function (b) { return '<td class="r">' + b + '</td>'; }).join('') + '<td class="r">' + d.a + '</td><td class="r">' + d.b + '</td></tr>'; }))));
    if (r.trace) h += '<h3>Gate diagram for ' + r.vars.map(function (v) { return v + '=' + r.trace.env[v]; }).join(', ') + '</h3>' + gateDiagram(r.trace.tree);
    return h;
  }
  function regOut(r) {
    var a = r.a, W = r.width, h = '<div class="res"><p class="sub">' + W + '-bit register</p><div class="big">' + esc(a.grouped) + cb(a.bin, 'binary') + '</div><p class="sub">decimal <b>' + a.dec + '</b> · octal <b>' + a.oct + '</b> · hex <b>' + a.hex + '</b></p></div>';
    h += '<p class="ns-facts"><span>Bit width <b>' + W + '</b></span><span>MSB (bit ' + (W - 1) + ') <b>' + a.msb + '</b></span><span>LSB (bit 0) <b>' + a.lsb + '</b></span><span>Set bits <b>' + a.ones + '</b></span><span>Clear bits <b>' + a.zeros + '</b></span></p>';
    h += r.warnings.map(function (w) { return '<p class="ns-warn" role="note"><b>Note</b> ' + esc(w.text) + '</p>'; }).join('');
    var hi = '<tr><th scope="row">Bit</th>' + a.bin.split('').map(function (c, k) { var i = W - 1 - k; return '<th scope="col" class="ix' + (i % 4 === 3 && k ? ' g' : '') + '">' + i + '</th>'; }).join('') + '</tr>';
    var rowOf = function (label, arr, cls) { return '<tr' + (cls ? ' class="' + cls + '"' : '') + '><th scope="row">' + label + '</th>' + arr.map(function (v, k) { var i = W - 1 - k; return '<td class="' + (v.on ? 'one' : '') + (i % 4 === 3 && k ? ' g' : '') + (v.chg ? ' chg' : '') + '">' + v.t + '</td>'; }).join('') + '</tr>'; };
    var reg = a.bin.split('').map(function (c) { return { t: c, on: c === '1' }; }), body = hi + rowOf('Register', reg);
    if (r.rows) { body += rowOf('Mask', r.rows.map(function (q) { return { t: q.m, on: q.m === 1 }; })) + rowOf('Result (' + r.action + ')', r.rows.map(function (q) { return { t: q.r, on: q.r === 1, chg: q.changed }; }), 'res-r') + '<tr><th scope="row">Changed</th>' + r.rows.map(function (q, k) { var i = W - 1 - k; return '<td class="' + (i % 4 === 3 && k ? 'g' : '') + '">' + (q.changed ? '≠' : '') + '</td>'; }).join('') + '</tr>'; }
    else if (r.mask) { var mb = r.mask.bin.split('').map(function (c) { return { t: c, on: c === '1' }; }); body += rowOf('Mask', mb); }
    h += '<h3>Bits</h3><div class="tw bg-w" tabindex="0" role="region" aria-label="Scrollable table: the register bits, most significant first"><table class="bg"><caption class="sr-only">Register bits, most significant first</caption><tbody>' + body + '</tbody></table></div><p class="note">Gold: the bit is 1' + (r.rows ? '. Outlined: the bit changed. ≠ marks changed bits.' : '.') + '</p>';
    if (r.result) h += '<p class="ns-facts"><span>Result <b>' + esc(r.result.grouped) + '</b></span><span>Hex <b>' + r.result.hex + '</b></span><span>Decimal <b>' + r.result.dec + '</b></span><span>Bits changed <b>' + (r.changed.length ? r.changed.join(', ') : 'none') + '</b></span></p>';
    if (r.mask) h += '<p class="ns-facts"><span>Mask <b>' + esc(r.mask.grouped) + '</b></span><span>Mask hex <b>' + r.mask.hex + '</b></span><span>Mask bits <b>' + (r.mask.positions.slice().sort(function (x, y) { return y - x; }).join(', ') || 'none') + '</b></span></p>';
    h += '<p class="ns-facts"><span>Set bit positions <b>' + (r.setPos.slice().sort(function (x, y) { return y - x; }).join(', ') || 'none') + '</b></span><span>Clear bit positions <b>' + (r.clearPos.slice().sort(function (x, y) { return y - x; }).join(', ') || 'none') + '</b></span></p>';
    if (r.fields.length) h += '<h3>Bit fields</h3>' + tw('bit fields', tbl(['Field', 'Bits', 'Binary', 'Hex', 'Decimal'], r.fields.map(function (f) { return '<tr><th scope="row">' + esc(f.name) + '</th><td class="r">' + (f.hi === f.lo ? f.hi : f.hi + ':' + f.lo) + '</td><td class="r">' + f.bin + '</td><td class="r">' + f.hex + '</td><td class="r">' + f.dec + '</td></tr>'; })));
    return h;
  }
  function parOut(r) {
    var h;
    if (r.pmode === 'generate') h = '<div class="res"><p class="sub">' + esc(r.parity) + ' parity, parity bit <b>' + r.bit + '</b> at the ' + r.ppos.toUpperCase() + '</p><div class="big">' + esc(r.word.grouped) + cb(r.word.bin, 'word') + '</div><p class="sub">' + r.word.width + ' bits · hex <b>' + r.word.hex + '</b> · data had <b>' + r.ones + '</b> one' + (r.ones === 1 ? '' : 's') + ', the word has <b>' + r.total + '</b></p></div>';
    else h = '<div class="res"><p class="sub">' + esc(r.parity) + ' parity check of ' + esc(r.word.grouped) + '</p><div class="big">' + (r.pass ? 'Passes' : 'Fails') + '</div><p class="sub">parity bit received <b>' + r.bit + '</b>, expected <b>' + r.expected + '</b> · total 1s <b>' + r.total + '</b> · data <b>' + esc(r.data.grouped) + '</b></p></div>';
    return h + r.warnings.map(function (w) { return '<p class="ns-warn" role="alert"><b>Note</b> ' + esc(w.text) + '</p>'; }).join('');
  }
  function grpOut(r) {
    var a = r.a, h = '<div class="res"><p class="sub">' + r.width + ' bits = ' + r.width / 8 + ' byte' + (r.width === 8 ? '' : 's') + ' = ' + r.width / 4 + ' nibbles</p><div class="big">' + esc(a.grouped) + cb(a.bin, 'binary') + '</div><p class="sub">hex <b>' + a.hex + '</b> · decimal <b>' + a.dec + '</b></p></div>';
    h += '<h3>Byte order in memory</h3><p class="ns-facts"><span>Big-endian <b>' + r.big.join(' ') + '</b></span><span>Little-endian <b>' + r.little.join(' ') + '</b></span></p>';
    h += '<h3>Bytes</h3>' + tw('bytes', tbl(['Byte', 'Binary', 'Hex', 'Decimal'], r.bytes.map(function (b) { return '<tr><th scope="row">' + b.index + '</th><td class="r">' + esc(b.bin.replace(/(\d{4})(?=\d)/g, '$1 ')) + '</td><td class="r">' + b.hex + '</td><td class="r">' + b.dec + '</td></tr>'; })));
    h += '<h3>Nibbles</h3>' + tw('nibbles', tbl(['Nibble', 'Binary', 'Hex'], r.nibbles.map(function (b, i) { return '<tr><th scope="row">' + (r.nibbles.length - 1 - i) + '</th><td class="r">' + b.bin + '</td><td class="r">' + b.hex + '</td></tr>'; })));
    if (r.words.length) h += '<h3>Words (16 bits)</h3>' + tw('words', tbl(['Word', 'Binary', 'Hex', 'Decimal'], r.words.map(function (b, i) { return '<tr><th scope="row">' + (r.words.length - 1 - i) + '</th><td class="r">' + esc(b.bin.replace(/(\d{4})(?=\d)/g, '$1 ')) + '</td><td class="r">' + b.hex + '</td><td class="r">' + b.dec + '</td></tr>'; })));
    if (r.dwords.length) h += '<h3>Double words (32 bits)</h3>' + tw('double words', tbl(['Dword', 'Hex', 'Decimal'], r.dwords.map(function (b, i) { return '<tr><th scope="row">' + (r.dwords.length - 1 - i) + '</th><td class="r">' + b.hex + '</td><td class="r">' + b.dec + '</td></tr>'; })));
    return h;
  }
  function render() {
    sync();
    var o = { op: opS.value, expr: exprI.value, expr2: expr2I.value, vars: varsS.value, assign: asgI.value, base: baseS.value, width: wS.value, value: valI.value, fields: fldI.value, mask: mskI.value, action: actS.value, parity: kindS.value, ppos: posS.value, pmode: pmodeS.value }, r, err = $('dl-err');
    [exprI, expr2I, asgI, valI, fldI, mskI, varsS].forEach(function (e) { e.classList.remove('bad'); e.setAttribute('aria-invalid', 'false'); }); lastRes = null; $('dl-dl').hidden = true;
    try { r = DigiLogic.run(o); } catch (e) { r = { ok: false, error: 'An internal check failed, so no result is shown. Please report this input.' }; }
    if (!r.ok) {
      err.textContent = r.empty ? '' : r.error; var f = { expr: exprI, expr2: expr2I, assign: asgI, value: valI, fields: fldI, mask: mskI, vars: varsS }[r.field]; if (f && r.error && !r.empty) { f.classList.add('bad'); f.setAttribute('aria-invalid', 'true'); }
      $('dl-out').innerHTML = ''; $('dl-steps').innerHTML = '<p class="note">Enter valid values to see the working.</p>'; return;
    }
    err.textContent = ''; lastRes = r;
    $('dl-out').innerHTML = (r.op === 'bool' ? boolOut(r) : r.op === 'reg' ? regOut(r) : r.op === 'parity' ? parOut(r) : grpOut(r)) + r.notes.map(function (n) { return '<p class="note">' + esc(n) + '</p>'; }).join('');
    $('dl-steps').innerHTML = r.steps.map(function (s) { return '<h3>' + esc(s.title) + '</h3><pre class="al" tabindex="0">' + esc(s.text) + '</pre>'; }).join(''); $('dl-dl').hidden = false;
  }
  function setAll(d) { opS.value = d.op; exprI.value = d.expr || ''; expr2I.value = d.expr2 || ''; varsS.value = d.vars || ''; asgI.value = d.assign || ''; colsS.value = d.cols || '1'; baseS.value = d.base || 'bin'; wS.value = d.width || '8'; valI.value = d.val || ''; fldI.value = d.fields || ''; mskI.value = d.mask || ''; actS.value = d.act || 'none'; kindS.value = d.kind || 'even'; posS.value = d.pos || 'msb'; pmodeS.value = d.pmode || 'generate'; render(); }
  function download(name, mime, text) { var a = document.createElement('a'), u = URL.createObjectURL(new Blob([text], { type: mime })); a.href = u; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(u); }, 500); say('Downloaded ' + name); }
  function loadHist() { try { var s = localStorage.getItem(HKEY); hist = s ? JSON.parse(s) : []; if (!Array.isArray(hist)) hist = []; } catch (e) { hist = []; } }
  function saveHist() { try { localStorage.setItem(HKEY, JSON.stringify(hist.slice(0, 10))); } catch (e) {} }
  function drawHist() { $('dl-hist').innerHTML = hist.length ? hist.map(function (h, k) { return '<li><button type="button" class="chipb" data-h="' + k + '">' + esc(h.label) + '</button></li>'; }).join('') : '<li class="note">No saved items yet. Press Enter or Save to history.</li>'; $('dl-hclear').hidden = !hist.length; }
  function snap() { return { op: opS.value, expr: exprI.value, expr2: expr2I.value, vars: varsS.value, assign: asgI.value, cols: colsS.value, base: baseS.value, width: wS.value, val: valI.value, fields: fldI.value, mask: mskI.value, act: actS.value, kind: kindS.value, pos: posS.value, pmode: pmodeS.value }; }
  function keep() {
    if (!lastRes) return; var r = lastRes, d = snap();
    d.label = r.opName + ': ' + (r.op === 'bool' ? r.normalized : r.op === 'reg' ? r.a.bin + (r.result ? ' ' + r.action + ' ' + r.mask.bin : '') : r.op === 'parity' ? r.word.bin : r.a.hex);
    hist = hist.filter(function (h) { return h.label !== d.label; }); hist.unshift(d); hist = hist.slice(0, 10); saveHist(); drawHist(); say('Saved to history');
  }
  $('dl').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.ex) { setAll(Object.assign({}, DEF, JSON.parse(b.dataset.ex))); return; }
    if (b.dataset.h !== undefined) { var h = hist[Number(b.dataset.h)]; if (h) setAll(h); return; }
    if (b.dataset.act === 'reset') { setAll(DEF); exprI.focus(); }
    if (b.dataset.act === 'save') keep();
    if (b.dataset.act === 'hclear') { hist = []; saveHist(); drawHist(); }
    if (b.dataset.dl && lastRes) { var n = 'digital-logic'; if (b.dataset.dl === 'txt') download(n + '.txt', 'text/plain', DigiLogic.exportTxt(lastRes)); if (b.dataset.dl === 'csv') download(n + '.csv', 'text/csv', DigiLogic.exportCsv(lastRes)); if (b.dataset.dl === 'json') download(n + '.json', 'application/json', DigiLogic.exportJson(lastRes)); }
  });
  [exprI, expr2I, asgI, valI, fldI, mskI].forEach(function (e) { e.addEventListener('input', render); e.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); keep(); } }); });
  [opS, baseS, wS, varsS, colsS, actS, kindS, posS, pmodeS].forEach(function (s) { s.addEventListener('change', render); });
  loadHist(); drawHist(); setAll(DEF);
})();
