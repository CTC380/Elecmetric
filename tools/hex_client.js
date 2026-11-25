/* Elecmetric Hex Calculator: page script (five modes). Inlined by tools/hex_page.js after the engine (HexCalc). */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var LET = 'ABCDEFGHIJKLMNOPQRST', HKEY = 'em-hex-history', hist = [], mode = 'arith', lastRes = null, lastFocus = null, tool = 'register';
  var box = $('hx-ops'), opSel = $('hx-op'), padSel = $('hx-pad');
  var DEF = { op: 'add', ops: ['1A3', '2F'], pad: 'min' };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function say(t) { $('hx-note').textContent = t; }
  function mix(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = b[k]; return o; }
  function copy(t) { var d = function () { say('Copied ' + t); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function fmt() { return { hexCase: $('hx-case').value, prefix: $('hx-prefix').checked, group: $('hx-group').value }; }

  /* ---------- mode definitions for the generic form (modes 2 to 5) ---------- */
  var W4 = [['8', '8-bit'], ['16', '16-bit'], ['32', '32-bit'], ['64', '64-bit']];
  var BOPT = HexCalc.BOPS.map(function (d) { return [d[0], d[1]]; });
  var TOOLS = {
    register: { label: 'Register value decoder and bit editor', fields: [
      { id: 'value', label: 'Register value (hex)', kind: 'text', def: 'AA' }, { id: 'width', label: 'Register width', kind: 'select', opts: W4, def: '8' },
      { id: 'fields', label: 'Bit fields (one per line: name msb:lsb, or name bit)', kind: 'area', def: 'high 7:4\nlow 3:0' },
      { id: 'edit', label: 'Edit a bit', kind: 'select', opts: [['none', 'No edit'], ['set', 'Set bit'], ['clear', 'Clear bit'], ['toggle', 'Toggle bit']], def: 'none' }, { id: 'index', label: 'Bit index', kind: 'text', def: '0', show: function (v) { return v.edit !== 'none'; } }],
      ex: [['AA, set bit 0 → AB', { value: 'AA', width: '8', edit: 'set', index: '0' }], ['AA, clear bit 1 → A8', { value: 'AA', width: '8', edit: 'clear', index: '1' }], ['AA, toggle bit 7', { value: 'AA', width: '8', edit: 'toggle', index: '7' }], ['0x4001 status register (16-bit)', { value: '4001', width: '16', fields: 'ready 0\nerror 1\nmode 7:4\nflags 15:8', edit: 'none' }]] },
    memory: { label: 'Memory address calculator', fields: [
      { id: 'base', label: 'Base address (hex)', kind: 'text', def: '1000' }, { id: 'offset', label: 'Byte offset (hex, optional)', kind: 'text', def: '' },
      { id: 'index', label: 'Element index (decimal)', kind: 'text', def: '3' }, { id: 'stride', label: 'Element size in bytes (decimal)', kind: 'text', def: '4' },
      { id: 'addrWidth', label: 'Address space', kind: 'select', opts: [['0', 'No limit'], ['16', '16-bit'], ['32', '32-bit'], ['64', '64-bit']], def: '0' }],
      ex: [['1000 + 3 × 4 = 100C', { base: '1000', offset: '', index: '3', stride: '4' }], ['20000000 + 0x40 (32-bit)', { base: '20000000', offset: '40', index: '0', stride: '1', addrWidth: '32' }], ['FFF0 + 20 (overflows 16-bit)', { base: 'FFF0', offset: '20', index: '0', stride: '1', addrWidth: '16' }]] },
    bytes: { label: 'Byte grouping and endianness', fields: [
      { id: 'value', label: 'Value (hex)', kind: 'text', def: 'AABBCCDD' }, { id: 'bytes', label: 'Size', kind: 'select', opts: [['0', 'As typed'], ['1', '1 byte'], ['2', '2 bytes'], ['4', '4 bytes'], ['8', '8 bytes']], def: '0' }],
      ex: [['AABBCCDD', { value: 'AABBCCDD', bytes: '0' }], ['FF as 4 bytes', { value: 'FF', bytes: '4' }], ['1234 as 2 bytes', { value: '1234', bytes: '2' }]] },
    ascii: { label: 'ASCII and hex', fields: [
      { id: 'dir', label: 'Direction', kind: 'select', opts: [['text', 'Text to hex'], ['hex', 'Hex to text']], def: 'text' }, { id: 'text', label: 'Input', kind: 'text', def: 'Hello' }],
      ex: [['Hello → 48 65 6C 6C 6F', { dir: 'text', text: 'Hello' }], ['48 65 6C 6C 6F → text', { dir: 'hex', text: '48 65 6C 6C 6F' }]] },
    rgb: { label: 'RGB and hex colour', fields: [
      { id: 'dir', label: 'Direction', kind: 'select', opts: [['hex', 'Hex to RGB'], ['rgb', 'RGB to hex']], def: 'rgb' }, { id: 'text', label: 'Input', kind: 'text', def: '170 187 204' }],
      ex: [['170 187 204 → #AABBCC', { dir: 'rgb', text: '170 187 204' }], ['#FF8800 → RGB', { dir: 'hex', text: '#FF8800' }], ['#0F0 → RGB', { dir: 'hex', text: '#0F0' }]] },
    checksum: { label: 'Checksums and CRC', fields: [
      { id: 'kind', label: 'Input is', kind: 'select', opts: [['text', 'Text (UTF-8 bytes)'], ['hex', 'Hex bytes']], def: 'text' }, { id: 'text', label: 'Data', kind: 'text', def: '123456789' }],
      ex: [['“123456789” (standard check string)', { kind: 'text', text: '123456789' }], ['Hex bytes 01 03 00 00 00 0A', { kind: 'hex', text: '01 03 00 00 00 0A' }], ['Hex bytes 01 02 03', { kind: 'hex', text: '01 02 03' }]] }
  };
  var MODES = {
    convert: { fields: [
      { id: 'input', label: 'Number', kind: 'text', def: 'AA' }, { id: 'from', label: 'Input base', kind: 'select', opts: [['16', 'Hexadecimal'], ['auto', 'Auto-detect (asks if unclear)'], ['10', 'Decimal'], ['2', 'Binary'], ['8', 'Octal']], def: '16' },
      { id: 'maxFraction', label: 'Fraction digits', kind: 'select', opts: [['8', '8'], ['16', '16'], ['32', '32'], ['64', '64']], def: '16' }],
      run: function (v) { return HexCalc.convert(mix(v, fmt())); },
      ex: [['AA hex', { input: 'AA', from: '16' }], ['255 decimal', { input: '255', from: '10' }], ['0.8 hex (fraction)', { input: '0.8', from: '16' }], ['0.1 decimal (does not end)', { input: '0.1', from: '10' }], ['−A hex', { input: '-A', from: '16' }], ['0xFF auto-detected', { input: '0xFF', from: 'auto' }], ['11 auto (ambiguous)', { input: '11', from: 'auto' }], ['10^30 decimal', { input: '1000000000000000000000000000000', from: '10' }]] },
    signed: { fields: [
      { id: 'mode', label: 'Input is', kind: 'select', opts: [['pattern', 'A hex bit pattern'], ['value', 'A signed decimal value']], def: 'pattern' }, { id: 'text', label: 'Value', kind: 'text', def: 'FF' },
      { id: 'width', label: 'Width', kind: 'select', opts: W4.concat([['custom', 'Custom…']]), def: '8' }, { id: 'customWidth', label: 'Custom width (bits)', kind: 'text', def: '12', show: function (v) { return v.width === 'custom'; } },
      { id: 'truncate', label: 'Truncate a longer pattern to the width', kind: 'check', def: false, show: function (v) { return v.mode === 'pattern'; } }],
      run: function (v) { return HexCalc.signed(mix({ mode: v.mode, text: v.text, width: v.width === 'custom' ? v.customWidth : v.width, truncate: v.truncate }, fmt())); },
      ex: [['FF as 8-bit = −1', { mode: 'pattern', text: 'FF', width: '8' }], ['80 as 8-bit = −128', { mode: 'pattern', text: '80', width: '8' }], ['FFFF as 16-bit', { mode: 'pattern', text: 'FFFF', width: '16' }], ['−1 as 8-bit', { mode: 'value', text: '-1', width: '8' }], ['128 as 8-bit (overflow)', { mode: 'value', text: '128', width: '8' }], ['−129 as 8-bit (underflow)', { mode: 'value', text: '-129', width: '8' }], ['FFFF as 8-bit (too wide)', { mode: 'pattern', text: 'FFFF', width: '8' }]] },
    bitwise: { fields: [
      { id: 'op', label: 'Operation', kind: 'select', opts: BOPT, def: 'and' }, { id: 'a', label: 'Hexadecimal A', kind: 'text', def: 'AA' },
      { id: 'b', label: 'Hexadecimal B', kind: 'text', def: '0F', show: function (v) { return /^(and|or|xor|nand|nor|xnor)$/.test(v.op); } },
      { id: 'shift', label: 'Shift or rotate by (bits)', kind: 'text', def: '1', show: function (v) { return /^(shl|shr|sar|rol|ror)$/.test(v.op); } },
      { id: 'width', label: 'Width', kind: 'select', opts: [['auto', 'Auto']].concat(W4), def: 'auto' }],
      run: function (v) { return HexCalc.bitwise(mix(v, fmt())); },
      ex: [['AA AND 0F = 0A', { op: 'and', a: 'AA', b: '0F', width: 'auto' }], ['AA OR 0F = AF', { op: 'or', a: 'AA', b: '0F', width: 'auto' }], ['AA XOR 0F = A5', { op: 'xor', a: 'AA', b: '0F', width: 'auto' }], ['NOT AA (8-bit) = 55', { op: 'not', a: 'AA', width: '8' }], ['AA SHL 1 (8-bit)', { op: 'shl', a: 'AA', shift: '1', width: '8' }], ['AA SAR 1 = D5', { op: 'sar', a: 'AA', shift: '1', width: '8' }], ['AA ROL 1', { op: 'rol', a: 'AA', shift: '1', width: '8' }], ['Mask 0xFF000000 AND 12345678', { op: 'and', a: '12345678', b: 'FF000000', width: '32' }]] },
    tools: { fields: null, run: null, ex: null }
  };
  function curDef() { return mode === 'tools' ? TOOLS[tool] : MODES[mode]; }

  /* ---------- generic form ---------- */
  var form = $('hx-form');
  function fieldHtml(f, val) {
    var id = 'hx-f-' + f.id, l = '<label for="' + id + '" class="ns-l">' + esc(f.label) + '</label>';
    if (f.kind === 'select') return '<div class="ns-f" data-fid="' + f.id + '">' + l + '<select id="' + id + '" class="ns-sel">' + f.opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></div>';
    if (f.kind === 'area') return '<div class="ns-f ns-wide" data-fid="' + f.id + '">' + l + '<textarea id="' + id + '" class="ns-in" rows="3" spellcheck="false" autocomplete="off">' + esc(val) + '</textarea></div>';
    if (f.kind === 'check') return '<div class="ns-f ns-chk" data-fid="' + f.id + '"><label class="chk"><input type="checkbox" id="' + id + '"' + (val ? ' checked' : '') + '> ' + esc(f.label) + '</label></div>';
    return '<div class="ns-f" data-fid="' + f.id + '">' + l + '<input id="' + id + '" class="ns-in" type="text" inputmode="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-describedby="hx-err" value="' + esc(val) + '"></div>';
  }
  function buildForm(defs, vals) { form.innerHTML = defs.map(function (f) { return fieldHtml(f, vals && vals[f.id] !== undefined ? vals[f.id] : f.def); }).join(''); applyShow(); }
  function readForm(defs) { var v = {}; defs.forEach(function (f) { var e = $('hx-f-' + f.id); v[f.id] = e ? (f.kind === 'check' ? e.checked : e.value) : f.def; }); return v; }
  function applyShow() { var defs = curDef().fields, v = readForm(defs); defs.forEach(function (f) { var w = form.querySelector('[data-fid="' + f.id + '"]'); if (w) w.hidden = f.show ? !f.show(v) : false; }); }
  function setForm(vals) { var defs = curDef().fields; defs.forEach(function (f) { var e = $('hx-f-' + f.id); if (e && vals[f.id] !== undefined) { if (f.kind === 'check') e.checked = !!vals[f.id]; else e.value = vals[f.id]; } }); applyShow(); }

  /* ---------- arithmetic operand rows ---------- */
  function inputs() { return Array.prototype.slice.call(box.querySelectorAll('input.ns-in')); }
  function values() { return inputs().map(function (i) { return i.value; }); }
  function lab(k) { return opSel.value === 'div' ? (k === 0 ? 'Dividend A' : 'Divisor B') : 'Hexadecimal ' + LET.charAt(k); }
  function setOps(vals) {
    box.innerHTML = vals.map(function (v, k) {
      return '<div class="hx-row"><div class="ns-f"><label for="hx-i' + k + '" class="ns-l">' + lab(k) + '</label><input id="hx-i' + k + '" class="ns-in" type="text" inputmode="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-describedby="hx-err" value="' + esc(v) + '"></div>' +
        (vals.length > 2 ? '<button type="button" class="btn2" data-rm="' + k + '" aria-label="Remove number ' + LET.charAt(k) + '">Remove</button>' : '') + '</div>';
    }).join('');
    $('hx-add').hidden = opSel.value === 'div' || vals.length >= HexCalc.MAXN;
  }
  function track() { var a = document.activeElement; if (a && a.classList && a.classList.contains('ns-in')) lastFocus = a; }

  /* ---------- rendering ---------- */
  function copyBtn(t, label) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="Copy ' + esc(label) + '">Copy</button>'; }
  function bitGrid(rows) {
    return rows.map(function (r) {
      var n = r.bits.length, i, cells = '', cls = n > 32 ? ' sm' : '';
      for (i = 0; i < n; i++) {
        var idx = n - 1 - i, c = r.bits.charAt(i), cl = 'bit' + (c === '1' ? ' on' : '') + (r.sign && i === 0 ? ' sg' : '') + (r.ref && r.ref.charAt(i) !== c ? ' chg' : '');
        if (i > 0 && idx % 4 === 3) cells += '<span class="gap"></span>';
        cells += r.clickable ? '<button type="button" class="' + cl + '" data-bit="' + idx + '" aria-label="Bit ' + idx + ' is ' + c + '. Press to toggle it."><i>' + idx + '</i><b>' + c + '</b></button>' : '<span class="' + cl + '"><i>' + idx + '</i><b>' + c + '</b></span>';
      }
      return '<div class="bitrow' + cls + '"><span class="bl">' + esc(r.label) + '</span><div class="bits" role="' + (r.clickable ? 'group' : 'img') + '" aria-label="' + esc(r.label) + ' bits, most significant first: ' + r.bits.split('').join(' ') + '">' + (r.neg ? '<span class="bit sg"><i>sign</i><b>−</b></span>' : '') + cells + '</div></div>';
    }).join('');
  }
  function tableHtml(t) {
    return '<h3>' + esc(t.title) + '</h3><div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + esc(t.title) + '"><table class="ns-t"><thead><tr>' + t.head.map(function (h) { return '<th scope="col">' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      t.rows.map(function (r, k) { var cu = t.cur && t.cur.indexOf(k) >= 0; return '<tr' + (cu ? ' class="cu"' : '') + '>' + r.map(function (c, j) { return j === 0 ? '<th scope="row">' + esc(c) + '</th>' : '<td class="r">' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  function renderView(res) {
    var v = res.view, h = '<div class="res"><p class="sub">' + esc(v.expr) + '</p>';
    v.big.forEach(function (b) { h += '<div class="big"><small>' + esc(b.label) + '</small>' + esc(b.value) + copyBtn(b.value, b.label) + '</div>'; });
    if (v.swatch) h += '<div class="sw" style="background:' + esc(v.swatch) + '" role="img" aria-label="Colour swatch ' + esc(v.swatch) + '"></div>';
    if (v.sub && v.sub.length) h += '<p class="sub">' + v.sub.map(function (s) { return esc(s.label) + ' <b>' + esc(s.value) + '</b>' + copyBtn(s.value, s.label); }).join(' &nbsp; ') + '</p>';
    h += '</div>';
    if (v.bitrows && v.bitrows.length) h += '<div class="bitrows">' + bitGrid(v.bitrows) + '</div>';
    if (v.facts && v.facts.length) h += '<p class="ns-facts">' + v.facts.map(function (f) { return '<span>' + esc(f[0]) + ' <b>' + esc(f[1]) + '</b></span>'; }).join('') + '</p>';
    if (v.ambiguous) h += '<p class="note">This could be more than one base. Confirm: ' + v.ambiguous.options.map(function (b) { return '<button type="button" class="chipb" data-from="' + b + '">' + ({ 2: 'Binary', 8: 'Octal', 10: 'Decimal', 16: 'Hexadecimal' })[b] + '</button>'; }).join('') + '</p>';
    (v.tables || []).forEach(function (t) { h += tableHtml(t); });
    (v.notes || []).forEach(function (n) { h += '<p class="note">' + esc(n) + '</p>'; });
    $('hx-out').innerHTML = h;
    $('hx-steps').innerHTML = v.steps && v.steps.length ? v.steps.map(function (s) { return '<h3>' + esc(s.title) + '</h3><pre class="al" tabindex="0">' + esc(s.text) + '</pre>'; }).join('') : '<p class="note">This tool has no step-by-step working. The tables above show every value.</p>';
  }
  function compute() {
    if (mode === 'arith') return HexCalc.arith(mix({ op: opSel.value, operands: values(), pad: padSel.value }, fmt()));
    var d = curDef(); return mode === 'tools' ? HexCalc.tool(tool, mix(readForm(d.fields), fmt())) : d.run(readForm(d.fields));
  }
  function render() {
    var r = compute(), err = $('hx-err');
    if (mode === 'arith') inputs().forEach(function (e) { e.classList.remove('bad'); e.setAttribute('aria-invalid', 'false'); });
    lastRes = null; $('hx-dl').hidden = true;
    if (!r.ok) {
      err.textContent = r.empty ? '' : r.error;
      if (mode === 'arith' && r.field !== undefined) { var f = inputs()[r.field]; if (f && !r.empty) { f.classList.add('bad'); f.setAttribute('aria-invalid', 'true'); } }
      $('hx-out').innerHTML = ''; $('hx-steps').innerHTML = '<p class="note">Enter valid values to see the working.</p>'; return;
    }
    err.textContent = ''; lastRes = r; renderView(r); $('hx-dl').hidden = false;
  }

  /* ---------- modes ---------- */
  function chips() { var d = curDef(); $('hx-try').innerHTML = '<span class="ns-l">Try</span> ' + (mode === 'arith' ? ARITH_EX.map(function (e, k) { return '<button type="button" class="chipb" data-aex="' + k + '">' + esc(e[0]) + '</button>'; }).join('') : d.ex.map(function (e, k) { return '<button type="button" class="chipb" data-ex="' + k + '">' + esc(e[0]) + '</button>'; }).join('')); }
  var ARITH_EX = [['1A3 + 2F', { op: 'add', ops: ['1A3', '2F'], pad: 'min' }], ['1A − B', { op: 'sub', ops: ['1A', 'B'], pad: 'min' }], ['A × 5', { op: 'mul', ops: ['A', '5'], pad: 'min' }], ['64 ÷ 8', { op: 'div', ops: ['64', '8'], pad: 'min' }], ['A + B + C', { op: 'add', ops: ['A', 'B', 'C'], pad: 'min' }], ['1A3 − 2F', { op: 'sub', ops: ['1A3', '2F'], pad: 'min' }], ['2F − 1A3 (negative)', { op: 'sub', ops: ['2F', '1A3'], pad: 'min' }], ['FFFF × FFFF', { op: 'mul', ops: ['FFFF', 'FFFF'], pad: 'min' }], ['−FF ÷ 10 (remainder)', { op: 'div', ops: ['-FF', '10'], pad: 'min' }], ['0D + 0B (leading zero)', { op: 'add', ops: ['0D', '0B'], pad: '2' }]];
  function setArith(d) { opSel.value = d.op; padSel.value = d.pad || 'min'; setOps(d.ops); render(); }
  function setMode(m) {
    mode = m;
    Array.prototype.forEach.call($('hx-tabs').querySelectorAll('button'), function (b) { var on = b.dataset.mode === m; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
    $('hx-arith').hidden = m !== 'arith'; $('hx-formwrap').hidden = m === 'arith'; $('hx-toolwrap').hidden = m !== 'tools';
    if (m === 'arith') { if (!inputs().length) setArith(DEF); } else { var d = curDef(); buildForm(d.fields, null); }
    chips(); render();
  }
  function setTool(t) { tool = t; buildForm(TOOLS[t].fields, null); chips(); render(); }

  /* ---------- history ---------- */
  function loadHist() { try { var s = localStorage.getItem(HKEY); hist = s ? JSON.parse(s) : []; if (!Array.isArray(hist)) hist = []; } catch (e) { hist = []; } }
  function saveHist() { try { localStorage.setItem(HKEY, JSON.stringify(hist.slice(0, 10))); } catch (e) {} }
  function drawHist() { $('hx-hist').innerHTML = hist.length ? hist.map(function (h, k) { return '<li><button type="button" class="chipb" data-h="' + k + '">' + esc(h.text) + '</button></li>'; }).join('') : '<li class="note">No saved calculations yet. Press Enter or Save to history.</li>'; $('hx-hclear').hidden = !hist.length; }
  function keep() {
    if (!lastRes) return; var v = lastRes.view, t = v.title + ': ' + v.expr + ' = ' + v.big[0].value, rec = { text: t, mode: mode, tool: tool };
    if (mode === 'arith') { rec.op = opSel.value; rec.ops = values(); rec.pad = padSel.value; } else rec.vals = readForm(curDef().fields);
    hist = hist.filter(function (h) { return h.text !== t; }); hist.unshift(rec); hist = hist.slice(0, 10); saveHist(); drawHist(); say('Saved to history');
  }
  function restore(h) {
    if (h.mode === 'tools') tool = h.tool || 'register'; setMode(h.mode);
    if (h.mode === 'arith') { setArith({ op: h.op, ops: h.ops, pad: h.pad }); return; }
    if (h.mode === 'tools') $('hx-tool').value = tool; buildForm(curDef().fields, h.vals); chips(); render();
  }
  function download(name, mime, text) { var a = document.createElement('a'), u = URL.createObjectURL(new Blob([text], { type: mime })); a.href = u; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(u); }, 500); say('Downloaded ' + name); }
  function insert(s) {
    var f = lastFocus && document.body.contains(lastFocus) && box.contains(lastFocus) ? lastFocus : inputs()[0]; if (!f) return;
    if (s === 'back') f.value = f.value.slice(0, -1); else if (s === 'clear') f.value = ''; else if (s === '-') f.value = f.value.charAt(0) === '-' ? f.value.slice(1) : '-' + f.value; else f.value += s;
    f.focus(); render();
  }

  $('hx').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var d = b.dataset;
    if (d.copy) { copy(d.copy); return; }
    if (d.mode) { setMode(d.mode); return; }
    if (d.aex !== undefined) { setArith(ARITH_EX[Number(d.aex)][1]); return; }
    if (d.ex !== undefined) { setForm(curDef().ex[Number(d.ex)][1]); render(); return; }
    if (d.k) { insert(d.k); return; }
    if (d.from) { var fe = $('hx-f-from'); if (fe) { fe.value = d.from; render(); } return; }
    if (d.bit !== undefined) { var ed = $('hx-f-edit'), ix = $('hx-f-index'); if (ed && ix) { ed.value = 'toggle'; ix.value = d.bit; applyShow(); render(); } return; }
    if (d.rm !== undefined) { var v = values(); v.splice(Number(d.rm), 1); setOps(v); render(); return; }
    if (d.h !== undefined) { var h = hist[Number(d.h)]; if (h) restore(h); return; }
    if (d.act === 'add') { var w = values(); w.push(''); setOps(w); inputs()[w.length - 1].focus(); render(); }
    if (d.act === 'swap') { var s = values(); var t = s[0]; s[0] = s[1]; s[1] = t; setOps(s); render(); }
    if (d.act === 'reset') { if (mode === 'arith') { setArith(DEF); inputs()[0].focus(); } else { buildForm(curDef().fields, null); render(); } }
    if (d.act === 'save') keep();
    if (d.act === 'hclear') { hist = []; saveHist(); drawHist(); }
    if (d.act === 'copyall' && lastRes) copy(HexCalc.exportTxt(lastRes));
    if (d.dl && lastRes) { var n = 'hex-calculator'; if (d.dl === 'txt') download(n + '.txt', 'text/plain', HexCalc.exportTxt(lastRes)); if (d.dl === 'csv') download(n + '.csv', 'text/csv', HexCalc.exportCsv(lastRes)); if (d.dl === 'json') download(n + '.json', 'application/json', HexCalc.exportJson(lastRes)); }
  });
  $('hx-tabs').addEventListener('keydown', function (e) {
    var ids = ['arith', 'convert', 'signed', 'bitwise', 'tools'], k = ids.indexOf(mode);
    if (e.key === 'ArrowRight') k = (k + 1) % ids.length; else if (e.key === 'ArrowLeft') k = (k + ids.length - 1) % ids.length; else return;
    e.preventDefault(); setMode(ids[k]); $('hx-tabs').querySelector('[data-mode="' + ids[k] + '"]').focus();
  });
  box.addEventListener('input', render); box.addEventListener('focusin', track);
  form.addEventListener('input', function () { applyShow(); render(); }); form.addEventListener('change', function () { applyShow(); render(); });
  $('hx').addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type === 'text') { e.preventDefault(); keep(); } });
  opSel.addEventListener('change', function () {
    var v = values(); if (opSel.value === 'div' && v.length > 2) v = v.slice(0, 2); setOps(v); render();
  });
  padSel.addEventListener('change', render);
  $('hx-tool').addEventListener('change', function () { setTool(this.value); });
  ['hx-case', 'hx-prefix', 'hx-group'].forEach(function (id) { $(id).addEventListener('change', render); });
  document.addEventListener('focusin', track);
  loadHist(); drawHist(); setArith(DEF); setMode('arith');
})();
