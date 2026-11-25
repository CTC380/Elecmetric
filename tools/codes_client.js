/* Elecmetric BCD / Excess-3 and Gray code converters: page script (Mode 06). Inlined by tools/codes_page.js after the engine. */
(function () {
  var $ = function (id) { return document.getElementById(id); }, C = Codes, mode = $('nu-mode').value, V = $('nu-v'), err = $('nu-err'), out = $('nu-out'), stp = $('nu-steps');
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function copy(t) { var d = function () { $('nu-note').textContent = 'Copied'; }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function cp(t, l) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="' + l + '">Copy</button>'; }
  var last = null, HKEY = 'em-codes-history-' + mode, hist = [];
  try { hist = JSON.parse(localStorage.getItem(HKEY) || '[]'); if (!Array.isArray(hist)) hist = []; } catch (e) { hist = []; }
  function say(t) { $('nu-note').textContent = t; }
  function setLast(title, rows, sum) { last = { title: title, rows: rows, sum: sum }; $('nu-dl').hidden = false; }
  function csvq(v) { v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function expTxt(l) { return 'Elecmetric - ' + l.title + '\n' + l.rows.map(function (r) { return r[0] + ': ' + r[1]; }).join('\n') + '\n'; }
  function expCsv(l) { return 'Field,Value\n' + l.rows.map(function (r) { return csvq(r[0]) + ',' + csvq(r[1]); }).join('\n') + '\n'; }
  function expJson(l) { var o = { tool: l.title }; l.rows.forEach(function (r) { o[r[0]] = r[1]; }); return JSON.stringify(o, null, 2) + '\n'; }
  function download(name, mime, text) { var a = document.createElement('a'), u = URL.createObjectURL(new Blob([text], { type: mime })); a.href = u; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(u); }, 500); say('Downloaded ' + name); }
  function saveHist() { try { localStorage.setItem(HKEY, JSON.stringify(hist)); } catch (e) {} }
  function drawHist() { $('nu-hist').innerHTML = hist.length ? hist.map(function (h, k) { return '<li><button type="button" class="chipb" data-h="' + k + '">' + esc(h.text) + '</button></li>'; }).join('') : '<li class="note">No saved calculations yet. Press Save to history.</li>'; $('nu-hclear').hidden = !hist.length; }
  function inputs() { var d = {}; Array.prototype.forEach.call($('nu').querySelectorAll('input[id^="nu-"],select'), function (el) { if (el.id !== 'nu-mode') d[el.id.slice(3)] = el.value; }); return d; }
  function addHist() { if (!last) return; var t = last.sum || last.rows.map(function (r) { return r[1]; }).slice(0, 2).join(' \u2192 '); hist = hist.filter(function (h) { return h.text !== t; }); hist.unshift({ text: t, d: inputs() }); hist = hist.slice(0, 10); saveHist(); drawHist(); say('Saved to history'); }
  function fail(r) { err.textContent = r.empty ? '' : r.error; V.classList.toggle('bad', !r.empty); V.setAttribute('aria-invalid', String(!r.empty)); out.innerHTML = ''; last = null; $('nu-dl').hidden = true; stp.innerHTML = '<p class="note">Enter a valid value to see the steps.</p>'; }
  function good() { err.textContent = ''; V.classList.remove('bad'); V.setAttribute('aria-invalid', 'false'); }
  function renderBcd() {
    var dir = $('nu-dir').value, o = { code: $('nu-code').value, unpacked: $('nu-lay').value === 'u', padLeft: true }, name = o.code === 'xs3' ? 'Excess-3' : '8421 BCD';
    if (dir === 'enc') {
      var r = C.bcdEncode(V.value, o); if (!r.ok) return fail(r); good();
      var big = r.groups.join(' ');
      out.innerHTML = '<div class="res"><div class="big">' + esc(big) + cp(r.bits, 'Copy binary without spaces') + '</div><div class="sub">' + name + (r.unpacked ? ', unpacked' : ', packed') + ' \u00b7 ' + esc(r.plain) + ' \u00b7 hex <b>' + r.hex + '</b></div></div><table class="ns-t"><thead><tr><th>Digit</th><th>' + name + '</th></tr></thead><tbody>' + r.digits.map(function (d, i) { return '<tr><td class="r">' + d + '</td><td class="r">' + r.groups[i] + '</td></tr>'; }).join('') + '</tbody></table>';
      stp.innerHTML = '<ol class="steps">' + r.digits.map(function (d, i) { return '<li>' + (o.code === 'xs3' ? d + ' + 3 = ' + (+d + 3) + ' \u2192 ' : d + ' \u2192 ') + esc(r.groups[i]) + '</li>'; }).join('') + '<li>Join the groups: ' + esc(big) + '</li></ol><p class="note">Each decimal digit uses its own 4-bit group, so BCD is not the same as converting the whole number to binary. Plain binary of this number would be ' + (r.digits.length <= 60 ? esc(BigInt(r.digits.join('')).toString(2)) : 'much shorter') + '.</p>';
      setLast(name + ' encode', [['Input', V.value], ['Code', name], ['Layout', o.unpacked ? 'unpacked' : 'packed'], [name, big], ['Hex', r.hex]]);
    } else {
      var d = C.bcdDecode(V.value, o); if (!d.ok) return fail(d); good();
      var sz = o.unpacked ? 8 : 4, raw = V.value.replace(/[\s_]/g, ''), padded = raw.length % sz !== 0;
      out.innerHTML = '<div class="res"><div class="big">' + esc(d.dec) + cp(d.dec, 'Copy decimal') + '</div><div class="sub">' + name + (d.unpacked ? ', unpacked' : ', packed') + ' \u2192 decimal' + (padded ? ' \u00b7 padded with leading zeros to a whole number of groups' : '') + '</div></div>';
      stp.innerHTML = '<ol class="steps">' + d.groups.map(function (g, i) { return '<li>' + esc(g) + (o.code === 'xs3' ? ' = ' + (d.digits[i] + 3) + ', minus 3 = ' : ' = ') + d.digits[i] + '</li>'; }).join('') + '<li>Read the digits in order: ' + esc(d.dec) + '</li></ol>';
      setLast(name + ' decode', [['Input', V.value], ['Code', name], ['Layout', o.unpacked ? 'unpacked' : 'packed'], ['Decimal', d.dec]]);
    }
  }
  function renderGray() {
    var r = C.gray({ text: V.value, kind: $('nu-kind').value, width: +$('nu-w').value, dir: $('nu-dir').value }); if (!r.ok) return fail(r); good();
    var big = r.b2g ? r.gray : r.bin, lab = r.b2g ? 'Gray code' : 'Binary';
    var tb = '<table class="ns-t"><thead><tr><th></th><th>Binary</th><th>Gray</th></tr></thead><tbody><tr><td>Bits</td><td class="r">' + C.g4(r.bin) + '</td><td class="r">' + C.g4(r.gray) + '</td></tr><tr><td>Hex</td><td class="r">' + r.binHex + '</td><td class="r">' + r.grayHex + '</td></tr><tr><td>Decimal value</td><td class="r">' + r.binDec + '</td><td class="r">' + r.grayDec + '</td></tr></tbody></table>';
    out.innerHTML = '<div class="res"><div class="big">' + esc(C.g4(big)) + cp(big, 'Copy ' + lab) + '</div><div class="sub">' + lab + ' \u00b7 ' + r.w + ' bits</div></div>' + tb;
    var al = r.b2g ? '<pre class="al" aria-label="Aligned working">binary   ' + C.g4(r.bin) + '\nbin >> 1 ' + C.g4(r.shifted) + '\nXOR      ' + C.g4(r.gray) + '  (Gray)</pre>' : '';
    stp.innerHTML = al + '<ol class="steps">' + r.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>';
    setLast('Gray code ' + (r.b2g ? 'encode' : 'decode'), [['Input', V.value], ['Width (bits)', r.w], ['Binary', r.bin], ['Gray', r.gray], ['Binary hex', r.binHex], ['Gray hex', r.grayHex], ['Binary decimal', r.binDec], ['Gray decimal', r.grayDec]], (r.b2g ? 'Binary ' + r.bin + ' \u2192 Gray ' + r.gray : 'Gray ' + r.gray + ' \u2192 binary ' + r.bin));
  }
  var render = mode === 'bcd' ? renderBcd : renderGray;
  $('nu').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.dl && last) { var n = mode === 'bcd' ? 'bcd-converter' : 'gray-code-converter'; if (b.dataset.dl === 'txt') download(n + '.txt', 'text/plain', expTxt(last)); if (b.dataset.dl === 'csv') download(n + '.csv', 'text/csv', expCsv(last)); if (b.dataset.dl === 'json') download(n + '.json', 'application/json', expJson(last)); return; }
    if (b.dataset.act === 'save') { addHist(); return; }
    if (b.dataset.act === 'hclear') { hist = []; saveHist(); drawHist(); return; }
    if (b.dataset.h !== undefined) { var h = hist[+b.dataset.h]; if (h) { Object.keys(h.d).forEach(function (k) { if ($('nu-' + k)) $('nu-' + k).value = h.d[k]; }); render(); } return; }
    if (b.dataset.ex) { var d = JSON.parse(b.dataset.ex); Object.keys(d).forEach(function (k) { if ($('nu-' + k)) $('nu-' + k).value = d[k]; }); render(); return; }
    if (b.dataset.act === 'reset') { V.value = V.defaultValue; Array.prototype.forEach.call($('nu').querySelectorAll('select'), function (s) { s.selectedIndex = 0; }); render(); V.focus(); }
  });
  Array.prototype.forEach.call($('nu').querySelectorAll('input,select'), function (el) { el.addEventListener('input', render); el.addEventListener('change', render); });
  drawHist(); render();
})();
