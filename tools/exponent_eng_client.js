/* Elecmetric Exponent Calculator, Mode 05: page script. Inlined by tools/exponent_eng_page.js after the engine (ExponentEng). */
(function () {
  var $ = function (id) { return document.getElementById(id); }, X = ExponentEng;
  var modeS = $('ex-mode'), sigS = $('ex-sig'), fieldsEl = $('ex-fields'), err = $('ex-err'), out = $('ex-out'), stp = $('ex-steps'), gwrap = $('ex-gwrap'), graphEl = $('ex-graph');
  var HKEY = 'em-exponent-eng-history', hist = [], last = null, store = {}, focusId = null, sigTouched = false, DEFMODE = 'rc_discharge';
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmt(t) { return esc(t).replace(/10\^(-?\d+)/g, function (m, e) { return '10<sup>' + e.replace('-', '\u2212') + '</sup>'; }); }
  function say(t) { $('ex-note').textContent = t; }
  function copy(t) { var d = function () { say('Copied ' + (t.length > 60 ? 'the text' : t)); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); try { a.select(); document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function mode() { return X.MODES.filter(function (m) { return m.key === modeS.value; })[0] || X.MODES[0]; }
  function defaults(m) { var o = {}; m.fields.forEach(function (f) { o[f.k] = f.def; }); return o; }
  function cur() { var m = mode(); return store[m.key] || (store[m.key] = defaults(m)); }
  function state() { return { mode: mode().key, vals: Object.assign({}, cur()), sig: sigS.value }; }
  function drawFields() {
    var m = mode(), v = cur();
    $('ex-formula').textContent = m.formula;
    fieldsEl.innerHTML = m.fields.map(function (f) {
      var id = 'ex-f-' + f.k, val = v[f.k] === undefined ? '' : v[f.k];
      var ctl = f.kind === 'sel' ? '<select id="' + id + '" class="ns-sel" data-k="' + f.k + '">' + f.opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === val ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>'
        : '<input id="' + id + '" class="ns-in" type="text" inputmode="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" data-k="' + f.k + '" aria-describedby="ex-err" value="' + esc(val) + '">';
      return '<div class="ns-f"><label for="' + id + '" class="ns-l">' + esc(f.label) + '</label>' + ctl + (f.hint ? '<span class="eg-hint">' + esc(f.hint) + '</span>' : '') + '</div>';
    }).join('');
  }
  function setState(d) {
    modeS.value = d.mode || DEFMODE; var m = mode(); store[m.key] = Object.assign(defaults(m), d.vals || {}); sigS.value = d.sig || m.sigDef; sigTouched = !!d.sig && d.sig !== m.sigDef; drawFields(); render();
  }
  function mark(field) { var els = fieldsEl.querySelectorAll ? fieldsEl.querySelectorAll('[data-k]') : []; for (var i = 0; i < els.length; i++) { var bad = els[i].dataset.k === field; els[i].classList.toggle('bad', bad); els[i].setAttribute('aria-invalid', String(bad)); } }
  function card(c) { return '<div class="dp-c"><span class="ns-l">' + esc(c.label) + '</span><div class="big">' + fmt(c.text) + (c.copy ? '<button type="button" class="btn2" data-copy="' + esc(c.copy) + '" aria-label="Copy ' + esc(c.label) + '">Copy</button>' : '') + '</div><div class="sub">' + fmt(c.sub) + '</div></div>'; }
  function tbl(t) { return '<h3>' + esc(t.title) + '</h3><div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + esc(t.title) + '"><table class="ns-t"><thead><tr>' + t.head.map(function (h) { return '<th scope="col">' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + t.rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + fmt(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>'; }
  function render() {
    var m = mode(), r = X.run(Object.assign({ mode: m.key, sig: sigS.value }, cur()));
    last = null; $('ex-dl').hidden = true; gwrap.hidden = true;
    if (!r.ok) {
      err.textContent = r.empty ? '' : r.error; err.classList.toggle('hint', !!(r.empty || r.partial)); mark(r.empty || r.partial ? null : r.field);
      out.innerHTML = ''; stp.innerHTML = '<p class="note">Enter the values to see the result and the working.</p>'; return;
    }
    err.textContent = ''; err.classList.remove('hint'); mark(null);
    out.innerHTML = r.warnings.map(function (w) { return '<p class="note warn">' + esc(w) + '</p>'; }).join('') + '<div class="dp-cards">' + r.cards.map(card).join('') + '</div>' + (r.facts.length ? '<p class="ns-facts">' + r.facts.map(function (f) { return '<span>' + esc(f[0]) + ': <b>' + fmt(f[1]) + '</b></span>'; }).join('') + '</p>' : '') + r.tables.map(tbl).join('');
    stp.innerHTML = r.steps.map(function (x) { return '<h3>' + esc(x.title) + '</h3><pre class="al" tabindex="0">' + fmt(x.text) + '</pre>'; }).join('') + '<h3>Check</h3><pre class="al" tabindex="0">' + (r.check.ok ? 'Passed. ' : 'Not passed. ') + esc(r.check.detail) + '</pre>';
    if (r.graphSpec) { graphEl.innerHTML = X.graph(r); gwrap.hidden = false; }
    last = { r: r, text: X.headline(r) }; $('ex-dl').hidden = false;
  }
  function download(name, mime, blob) { var a = document.createElement('a'), u = URL.createObjectURL(blob); a.href = u; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(u); }, 500); say('Downloaded ' + name); }
  function savePng() {
    var svg = X.graph(last.r), img = new Image(), u = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    img.onload = function () { var c = document.createElement('canvas'); c.width = 1520; c.height = 840; var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); if (c.toBlob) c.toBlob(function (b) { if (b) download('exponential-graph.png', 'image/png', b); else say('This browser could not make a PNG. Use the SVG.'); }, 'image/png'); else say('This browser could not make a PNG. Use the SVG.'); };
    img.onerror = function () { URL.revokeObjectURL(u); say('This browser could not make a PNG. Use the SVG.'); }; img.src = u;
  }
  function loadHist() { try { var x = JSON.parse(localStorage.getItem(HKEY) || '[]'); hist = Array.isArray(x) ? x.filter(function (h) { return h && typeof h.text === 'string' && h.s && typeof h.s === 'object' && h.s.vals; }).slice(0, 10) : []; } catch (e) { hist = []; } }
  function saveHist() { try { localStorage.setItem(HKEY, JSON.stringify(hist.slice(0, 10))); } catch (e) {} }
  function drawHist() {
    $('ex-hist').innerHTML = hist.length ? hist.map(function (h, k) { return '<li><button type="button" class="chipb" data-h="' + k + '" aria-label="Use again: ' + esc(h.text) + '">' + esc(h.text) + '</button></li>'; }).join('') : '<li class="note">No saved calculations yet. Press Save to history or Enter.</li>';
    $('ex-hclear').hidden = !hist.length;
  }
  function keep() { if (!last) return; var t = last.text.length > 90 ? last.text.slice(0, 87) + '\u2026' : last.text; hist = hist.filter(function (h) { return h.text !== t; }); hist.unshift({ text: t, s: state() }); hist = hist.slice(0, 10); saveHist(); drawHist(); say('Saved to history'); }
  function target() { var el = focusId && $(focusId); if (el && el.dataset && el.dataset.k && el.tagName !== 'SELECT') return el; var f = mode().fields.filter(function (x) { return x.kind !== 'sel'; })[0]; return f ? $('ex-f-' + f.k) : null; }
  function insert(k) {
    var el = target(); if (!el) return; var v = el.value, s = el.selectionStart, e = el.selectionEnd; if (typeof s !== 'number') { s = e = v.length; }
    if (k === 'back') { if (s !== e) { el.value = v.slice(0, s) + v.slice(e); e = s; } else if (s > 0) { el.value = v.slice(0, s - 1) + v.slice(s); s = e = s - 1; } }
    else { el.value = v.slice(0, s) + k + v.slice(e); s = e = s + k.length; }
    cur()[el.dataset.k] = el.value; if (el.focus) el.focus(); try { el.setSelectionRange(s, e); } catch (x) {} render();
  }
  fieldsEl.addEventListener('input', function (e) { var t = e.target; if (!t || !t.dataset || !t.dataset.k) return; cur()[t.dataset.k] = t.value; render(); });
  fieldsEl.addEventListener('change', function (e) { var t = e.target; if (!t || !t.dataset || !t.dataset.k) return; cur()[t.dataset.k] = t.value; render(); });
  fieldsEl.addEventListener('focusin', function (e) { if (e.target && e.target.id) focusId = e.target.id; });
  fieldsEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); keep(); } });
  modeS.addEventListener('change', function () { var m = mode(); if (!sigTouched) sigS.value = m.sigDef; focusId = null; drawFields(); render(); });
  sigS.addEventListener('change', function () { sigTouched = true; render(); });
  $('ex').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.key) { insert(b.dataset.key); return; }
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.ex) { setState(JSON.parse(b.dataset.ex)); return; }
    if (b.dataset.h !== undefined) { var h = hist[Number(b.dataset.h)]; if (h) setState(h.s); return; }
    if (b.dataset.act === 'reset') { store = {}; sigTouched = false; setState({ mode: modeS.value }); return; }
    if (b.dataset.act === 'save') { keep(); return; }
    if (b.dataset.act === 'clear') { var v = cur(); mode().fields.forEach(function (f) { if (f.kind !== 'sel') v[f.k] = ''; }); drawFields(); render(); var t = target(); if (t && t.focus) t.focus(); return; }
    if (b.dataset.act === 'hclear') { hist = []; saveHist(); drawHist(); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'copyall' && last) { copy(X.exportTxt(last.r)); return; }
    if (!last) return;
    var n = 'engineering-powers-' + last.r.mode;
    if (b.dataset.dl === 'txt') download(n + '.txt', 'text/plain', new Blob([X.exportTxt(last.r)], { type: 'text/plain' }));
    if (b.dataset.dl === 'csv') download(n + '.csv', 'text/csv', new Blob([X.exportCsv(last.r)], { type: 'text/csv' }));
    if (b.dataset.dl === 'json') download(n + '.json', 'application/json', new Blob([X.exportJson(last.r)], { type: 'application/json' }));
    if (b.dataset.dl === 'svg' && last.r.graphSpec) download(n + '.svg', 'image/svg+xml', new Blob([X.graph(last.r)], { type: 'image/svg+xml' }));
    if (b.dataset.dl === 'png' && last.r.graphSpec) savePng();
  });
  loadHist(); drawHist(); setState({ mode: DEFMODE });
})();
