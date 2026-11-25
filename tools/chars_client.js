/* Elecmetric ASCII and Unicode converters: page script (Mode 09). Inlined by tools/chars_page.js after the engine. */
(function () {
  var $ = function (id) { return document.getElementById(id); }, C = Chars, mode = $('nu-mode').value, V = $('nu-v'), err = $('nu-err'), out = $('nu-out'), stp = $('nu-steps');
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function copy(t) { var d = function () { $('nu-note').textContent = 'Copied'; }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function cp(t, l) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="' + l + '">Copy</button>'; }
  function fail(r) { err.textContent = r.empty ? '' : r.error; V.classList.toggle('bad', !r.empty); V.setAttribute('aria-invalid', String(!r.empty)); out.innerHTML = ''; stp.innerHTML = '<p class="note">Enter a valid value to see the steps.</p>'; }
  function table(head, rows) { return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + head.join(', ') + '"><table class="ns-t"><thead><tr>' + head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td class="r">' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>'; }
  function sh(r) { return r.ctrl ? '<' + r.ch + '>' : r.ch; }
  function render() {
    var dir = $('nu-dir').value, dec = dir === 'dec', r, h, steps = [];
    if ($('nu-kindf')) $('nu-kindf').hidden = !dec; if ($('nu-fmtf')) $('nu-fmtf').hidden = dec;
    V.placeholder = mode === 'asc' ? (dec ? 'e.g. 72 101 108 108 111' : 'e.g. Hello') : (dec ? 'e.g. U+0048 U+1F600' : 'e.g. H\u20ac\u{1F600}');
    if (mode === 'asc') {
      r = C.ascii({ text: V.value, dir: dir, kind: $('nu-kind') ? $('nu-kind').value : 'dec', fmt: $('nu-fmt') ? $('nu-fmt').value : 'dec' }); if (!r.ok) return fail(r);
      h = '<div class="res"><div class="big">' + esc(dec ? r.shown : r.codes) + cp(dec ? r.text : r.codes, dec ? 'Copy text' : 'Copy codes') + '</div><div class="sub">' + r.rows.length + (r.rows.length === 1 ? ' character' : ' characters') + (dec ? ' \u00b7 control codes shown as &lt;NAME&gt;' : '') + '</div></div>' + table(['Char', 'Dec', 'Hex', 'Binary', 'Octal', 'Name'], r.rows.map(function (x) { return [sh(x), x.dec, x.hex, x.bin, x.oct, x.name]; }));
      steps = r.rows.slice(0, 16).map(function (x) { return '\u2018' + sh(x) + '\u2019 = ' + x.dec + ' decimal = 0x' + x.hex + ' = ' + x.bin + ' binary'; }); if (r.rows.length > 16) steps.push('\u2026 and ' + (r.rows.length - 16) + ' more (see the table).');
      steps.push('ASCII uses 7 bits (0 to 127); the table shows them in an 8-bit byte with a leading 0.');
    } else {
      r = C.unicode({ text: V.value, dir: dir, kind: $('nu-kind') ? $('nu-kind').value : 'hex' }); if (!r.ok) return fail(r);
      h = '<div class="res"><div class="big">' + esc(dec ? r.shown : r.points) + cp(dec ? r.text : r.points, dec ? 'Copy text' : 'Copy code points') + '</div><div class="sub">' + r.n + ' code point' + (r.n === 1 ? '' : 's') + ' \u00b7 ' + r.utf8Bytes + ' bytes in UTF-8 \u00b7 ' + r.utf16Units + ' units in UTF-16</div></div>' + table(['Char', 'Code point', 'Decimal', 'UTF-8 (hex)', 'UTF-16 (hex)', 'Plane'], r.rows.map(function (x) { return [sh(x), x.u, x.dec, x.utf8.join(' '), x.utf16.join(' '), String(x.plane)]; }));
      steps = r.rows.slice(0, 12).map(function (x) { var n = x.utf8.length; return '\u2018' + sh(x) + '\u2019 is ' + x.u + ': UTF-8 uses ' + n + ' byte' + (n > 1 ? 's' : '') + ' (' + x.utf8.join(' ') + ')' + (x.utf16.length === 2 ? ', and UTF-16 needs a surrogate pair (' + x.utf16.join(' ') + ')' : ', UTF-16 uses one unit (' + x.utf16[0] + ')') + '.'; }); if (r.rows.length > 12) steps.push('\u2026 and ' + (r.rows.length - 12) + ' more (see the table).');
      steps.push('Each character here is one code point. Characters that look like one symbol but combine several code points, such as some flags and accents, are listed code point by code point.');
    }
    err.textContent = ''; V.classList.remove('bad'); V.setAttribute('aria-invalid', 'false'); out.innerHTML = h;
    stp.innerHTML = '<ol class="steps">' + steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>';
  }
  $('nu').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.ex) { var d = JSON.parse(b.dataset.ex); Object.keys(d).forEach(function (k) { if ($('nu-' + k)) $('nu-' + k).value = d[k]; }); render(); return; }
    if (b.dataset.act === 'reset') { V.value = V.defaultValue; Array.prototype.forEach.call($('nu').querySelectorAll('select'), function (s) { s.selectedIndex = 0; }); render(); V.focus(); }
  });
  Array.prototype.forEach.call($('nu').querySelectorAll('input,select'), function (el) { el.addEventListener('input', render); el.addEventListener('change', render); });
  render();
})();
