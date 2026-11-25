/* Elecmetric Fraction Calculator, Phase 3: professional calculation report.
   Shared by Modes 01 to 06. tools/fraction_report_install.js inlines CSS, card and script into each built page; the script reads the page's own
   inputs, result, tables and working from the DOM, so every mode gets the same report without a second calculation path. Runs in the browser only. */
(function () {
  var root = document.getElementById('ns') || document.getElementById('nu'); if (!root) return;
  var pre = root.id, card = document.getElementById('rp-card'); if (!card) return; root.appendChild(card);
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function txt(el) { var c = el.cloneNode(true); Array.prototype.forEach.call(c.querySelectorAll('button,.sr-only'), function (b) { b.remove(); }); Array.prototype.forEach.call(c.querySelectorAll('div'), function (d) { var t = d.textContent.trim(); d.textContent = t ? ' (' + t + ')' : ''; }); return c.textContent.replace(/\s+/g, ' ').trim(); }
  function label(el) {
    var l = el.id && document.querySelector('label[for="' + el.id + '"]'), t, fs = el.closest('fieldset'), lg = fs && fs.querySelector('legend');
    if (l) t = txt(l); else if (el.getAttribute('aria-label')) t = el.getAttribute('aria-label'); else { var p = el.closest('label'); t = p ? txt(p) : (el.id || 'Input'); }
    if (lg) t = txt(lg).replace(/\s*\(.*$/, '') + ': ' + t.toLowerCase(); return t;
  }
  function gather() {
    var out = $(pre + '-out'), res = out ? out.querySelector('.big') : null, inputs = [], sel = [], tables = [], steps = [];
    var tc = root.querySelector('.ns-card') || root.querySelector('.card');
    if (tc) {
      Array.prototype.forEach.call(tc.querySelectorAll('[aria-pressed="true"]'), function (b) { sel.push(txt(b)); });
      Array.prototype.forEach.call(tc.querySelectorAll('input,select,textarea'), function (el) {
        if (el.type === 'hidden' || el.type === 'button' || el.type === 'checkbox' && false || el.closest('[hidden]') || (el.offsetParent === null && el.type !== 'radio')) return;
        var v = el.tagName === 'SELECT' ? (el.options[el.selectedIndex] ? el.options[el.selectedIndex].text : '') : el.value; if (String(v).trim() === '') return;
        inputs.push([label(el).replace(/\s*:\s*$/, ''), String(v).trim()]);
      });
    }
    if (out) Array.prototype.forEach.call(out.querySelectorAll('table'), function (t) {
      var h = t.previousElementSibling, title = h && /^H[2-4]$/.test(h.tagName) ? txt(h) : '';
      if (!title && t.closest('.tw') && t.closest('.tw').previousElementSibling && /^H[2-4]$/.test(t.closest('.tw').previousElementSibling.tagName)) title = txt(t.closest('.tw').previousElementSibling);
      tables.push({ title: title || (tables.length ? 'Table ' + (tables.length + 1) : 'Results'), head: Array.prototype.map.call(t.querySelectorAll('thead th'), txt), rows: Array.prototype.map.call(t.querySelectorAll('tbody tr'), function (r) { return Array.prototype.map.call(r.children, txt); }) });
    });
    var st = $(pre + '-steps'); if (st) Array.prototype.forEach.call(st.querySelectorAll('li'), function (li) { steps.push(txt(li)); });
    return { ok: !!res && !(out.querySelector('.bad')), result: res ? txt(res) : '', inputs: inputs, sel: sel, tables: tables, steps: steps };
  }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return ('00000000' + h.toString(16)).slice(-8).toUpperCase(); }
  function stamp(d) { function p(n) { return ('0' + n).slice(-2); } return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); }
  var meta = ['rp-proj', 'rp-by', 'rp-chk', 'rp-ref', 'rp-note'], KEY = 'elecmetric.fraction.report.meta';
  function readMeta() { var o = {}; meta.forEach(function (k) { o[k] = $(k).value.trim(); }); return o; }
  try { var sv = JSON.parse(localStorage.getItem(KEY) || '{}'); ['rp-proj', 'rp-by', 'rp-chk'].forEach(function (k) { if (typeof sv[k] === 'string') $(k).value = sv[k].slice(0, 120); }); } catch (e) {}
  function saveMeta() { try { var m = readMeta(); localStorage.setItem(KEY, JSON.stringify({ 'rp-proj': m['rp-proj'], 'rp-by': m['rp-by'], 'rp-chk': m['rp-chk'] })); } catch (e) {} }
  var cur = null;
  function build() {
    var g = gather(), m = readMeta(), now = new Date(); if (!g.ok) return null;
    var key = g.sel.join('|') + '|' + g.inputs.map(function (x) { return x.join('=') }).join('|') + '|' + g.result;
    var id = 'FR-' + stamp(now).replace(/[^0-9]/g, '').slice(0, 8) + '-' + hash(key);
    return { g: g, m: m, id: id, when: stamp(now), title: (document.querySelector('main h1') || { textContent: 'Fraction Calculator' }).textContent.trim(), url: location.href.split('#')[0] };
  }
  function html(R) {
    var g = R.g, m = R.m, h = '<header class="rp-h"><div class="rp-brand">ELECMETRIC</div><div class="rp-t"><h2>Calculation report</h2><p>' + esc(R.title) + '</p></div><div class="rp-id"><b>' + esc(R.id) + '</b><br>' + esc(R.when) + '</div></header>';
    h += '<table class="rp-meta"><tbody><tr><th>Project</th><td>' + esc(m['rp-proj'] || '\u2014') + '</td><th>Reference</th><td>' + esc(m['rp-ref'] || '\u2014') + '</td></tr><tr><th>Prepared by</th><td>' + esc(m['rp-by'] || '\u2014') + '</td><th>Checked by</th><td>' + esc(m['rp-chk'] || '\u2014') + '</td></tr></tbody></table>';
    h += '<h3>1. Input</h3><table class="rp-t1"><tbody>' + (g.sel.length ? '<tr><th>Tool</th><td>' + esc(g.sel.join(' \u00b7 ')) + '</td></tr>' : '') + g.inputs.map(function (x) { return '<tr><th>' + esc(x[0]) + '</th><td>' + esc(x[1]) + '</td></tr>'; }).join('') + '</tbody></table>';
    h += '<h3>2. Result</h3><p class="rp-res">' + esc(g.result) + '</p>';
    g.tables.forEach(function (t) { h += (t.title ? '<h4>' + esc(t.title) + '</h4>' : '') + '<table class="rp-t2"><thead><tr>' + t.head.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' + t.rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>'; });
    if (g.steps.length) h += '<h3>3. Working</h3><ol class="rp-steps">' + g.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>';
    if (m['rp-note']) h += '<h3>' + (g.steps.length ? '4' : '3') + '. Notes</h3><p class="rp-notes">' + esc(m['rp-note']).replace(/\n/g, '<br>') + '</p>';
    h += '<h3>Method and limits</h3><p class="rp-lim">All fraction arithmetic is exact: numerators and denominators are whole numbers of any length and no floating point is used, so a result is exact unless it is marked rounded or approximate. A decimal that is rounded for display is flagged and the exact value is listed. This sheet records a number; it does not establish engineering accuracy. A real dimension, ratio or rating also needs its units, tolerances and measurement precision, and a result used in design or documentation should be checked by a competent person.</p>';
    h += '<footer class="rp-f"><span>Elecmetric Fraction Calculator \u00b7 ' + esc(R.url) + '</span><span>Report ' + esc(R.id) + ' \u00b7 calculated in the browser</span></footer>';
    return h;
  }
  function plain(R) {
    var g = R.g, m = R.m, L = ['ELECMETRIC CALCULATION REPORT', R.title, 'Report ' + R.id + '   ' + R.when, ''];
    L.push('Project: ' + (m['rp-proj'] || '-') + '   Reference: ' + (m['rp-ref'] || '-')); L.push('Prepared by: ' + (m['rp-by'] || '-') + '   Checked by: ' + (m['rp-chk'] || '-')); L.push('', '1. INPUT');
    if (g.sel.length) L.push('Tool: ' + g.sel.join(' / ')); g.inputs.forEach(function (x) { L.push(x[0] + ': ' + x[1]); });
    L.push('', '2. RESULT', g.result);
    g.tables.forEach(function (t) { L.push('', t.title || 'Table'); L.push(t.head.join(' | ')); t.rows.forEach(function (r) { L.push(r.join(' | ')); }); });
    if (g.steps.length) { L.push('', '3. WORKING'); g.steps.forEach(function (s, i) { L.push((i + 1) + '. ' + s); }); }
    if (m['rp-note']) L.push('', 'NOTES', m['rp-note']);
    L.push('', 'Exact fraction arithmetic (whole numbers of any length, no floating point). This sheet records a number and does not establish engineering accuracy: units, tolerances and measurement precision still apply.', R.url);
    return L.join('\n');
  }
  var sheet = document.createElement('div'); sheet.id = 'rp-sheet'; sheet.className = 'rp-sheet'; sheet.hidden = true; document.body.appendChild(sheet);
  function msg(t) { $('rp-msg').textContent = t; }
  function make() { saveMeta(); cur = build(); var pv = $('rp-prev'); if (!cur) { pv.innerHTML = ''; pv.hidden = true; msg('Enter a valid value in the calculator above first. A report needs a result.'); return null; } msg(''); pv.innerHTML = html(cur); pv.hidden = false; return cur; }
  card.addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) return; var a = b.dataset.rp; if (!a) return;
    var R = make(); if (!R) return;
    if (a === 'print') { sheet.innerHTML = html(R); sheet.hidden = false; document.body.classList.add('rp-printing'); var done = function () { document.body.classList.remove('rp-printing'); sheet.hidden = true; window.removeEventListener('afterprint', done); }; window.addEventListener('afterprint', done); window.print(); setTimeout(function () { if (document.body.classList.contains('rp-printing') && !window.matchMedia('print').matches) done(); }, 1500); }
    else if (a === 'copy') { var t = plain(R), ok = function () { msg('Report copied as text.'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, ok); else { var ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); ok(); } }
    else if (a === 'save') { try { var bl = new Blob([plain(R) + '\n'], { type: 'text/plain;charset=utf-8' }), u = URL.createObjectURL(bl), l = document.createElement('a'); l.href = u; l.download = R.id + '.txt'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 2000); msg('Saved ' + R.id + '.txt'); } catch (e) { msg('This browser could not save the file. Use Copy as text.'); } }
  });
  meta.forEach(function (k) { $(k).addEventListener('input', function () { if (!$('rp-prev').hidden) make(); }); });
  window.__fractionReport = { gather: gather, plain: function () { var R = build(); return R ? plain(R) : null; } };
})();
