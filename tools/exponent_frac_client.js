/* Elecmetric Exponent Calculator, Mode 02: page script. Inlined by tools/exponent_frac_page.js after the two engines (ExponentCalc, ExponentFrac). */
(function () {
  var $ = function (id) { return document.getElementById(id); }, X = ExponentFrac;
  var ia = $('ex-a'), inn = $('ex-n'), sigS = $('ex-sig'), err = $('ex-err'), out = $('ex-out'), stp = $('ex-steps'), focus = ia;
  var DEF = { a: '12', n: '1/2', sig: '6' }, HKEY = 'em-exponent-frac-history', hist = [], last = null;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function say(t) { $('ex-note').textContent = t; }
  function copy(t) { var d = function () { say('Copied ' + (t.length > 60 ? 'the text' : t)); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function copyBtn(t, label) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="Copy ' + esc(label) + '">Copy</button>'; }
  function state() { return { a: ia.value, n: inn.value, sig: sigS.value }; }
  function setState(d) { ia.value = d.a === undefined ? '' : d.a; inn.value = d.n === undefined ? '' : d.n; sigS.value = d.sig || '6'; render(); }
  function mark(field) { [['a', ia], ['n', inn]].forEach(function (p) { var bad = p[0] === field; p[1].classList.toggle('bad', bad); p[1].setAttribute('aria-invalid', String(bad)); }); }
  function card(label, big, copyText, sub) { return '<div class="dp-c"><span class="ns-l">' + esc(label) + '</span><div class="big">' + esc(big) + (copyText ? copyBtn(copyText, label) : '') + '</div><div class="sub">' + esc(sub || '') + '</div></div>'; }
  function render() {
    var r = X.run({ a: ia.value, n: inn.value, sig: sigS.value });
    last = null; $('ex-dl').hidden = true;
    if (!r.ok) {
      err.textContent = r.empty ? '' : r.error; err.classList.toggle('hint', !!(r.empty || r.partial)); mark(r.empty || r.partial ? null : r.field);
      out.innerHTML = ''; stp.innerHTML = '<p class="note">Enter a base and an exponent to see the working.</p>'; return;
    }
    err.textContent = ''; err.classList.remove('hint'); mark(null);
    var s = r.sol, cards = '', vt = X.valueText(r), copyMain;
    if (r.radical && !r.radical.exactRoot) cards += card('Simplified radical form', r.radical.text, r.radical.plain, 'exact' + (r.exponent.neg ? ', denominator rationalised' : ''));
    if (r.exact) {
      copyMain = s.isInteger ? (s.integerString ? (s.sign < 0 ? '−' : '') + s.integerString : s.sciText) : s.fraction;
      cards += card(r.radical && !r.radical.exactRoot ? 'Value' : 'Result y = ' + r.exprText, s.isInteger ? (s.integerString && s.integerString.length <= 40 ? (s.sign < 0 ? '−' : '') + X.groupInt(s.integerString) : s.sciText) : s.fraction, copyMain, s.isInteger ? 'exact' : 'exact fraction');
      if (!s.isInteger && s.standard) cards += card('Decimal', s.decimalIsExact ? s.standard : '≈ ' + s.standard, s.standard.replace(/,/g, ''), s.decimalIsExact ? 'exact' : 'rounded for display');
    } else {
      cards += card(r.radical ? 'Decimal value' : 'Result y = ' + r.exprText, '≈ ' + (s.standard || s.sciText), s.standard ? s.standard.replace(/,/g, '') : s.eText, 'approximate (about ' + Math.min(15, s.reliableDigits) + ' reliable digits)');
    }
    cards += card('Scientific notation', s.sciText, s.eText, s.eText);
    var ex = r.exponent, exTxt = ex.q === 1n ? 'whole number ' + ex.p : 'exact fraction ' + ex.p + '/' + ex.q + (ex.mixed ? ' (' + ex.whole + ' and ' + ex.rem + '/' + ex.q + ')' : '');
    var rows = [['Base a', r.base.text, ''], ['Exponent n', r.exponent.text, exTxt], ['Result y', vt, r.exact ? 'exact' : 'approximate'], ['Sign', s.sign < 0 ? 'negative' : s.sign === 0 ? 'zero' : 'positive', '']];
    var tbl = '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: equivalent forms"><table class="ns-t"><thead><tr><th scope="col">Form</th><th scope="col">Expression</th><th scope="col">Note</th></tr></thead><tbody>' + r.forms.map(function (f) { return '<tr><th scope="row">' + esc(f.label) + '</th><td class="r">' + esc(f.text) + '</td><td>' + esc(f.note || '') + '</td></tr>'; }).join('') + rows.map(function (x) { return '<tr><th scope="row">' + esc(x[0]) + '</th><td class="r">' + esc(x[1]) + '</td><td>' + esc(x[2]) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    var warn = r.warnings.map(function (w) { return '<p class="note warn">' + esc(w.message) + '</p>'; }).join('') + (r.radicalNote ? '<p class="note warn">' + esc(r.radicalNote) + '</p>' : '');
    out.innerHTML = '<div class="dp-cards">' + cards + '</div>' + tbl + warn;
    stp.innerHTML = r.steps.map(function (x) { return '<h3>' + esc(x.title) + '</h3><pre class="al" tabindex="0">' + esc(x.text) + '</pre>'; }).join('') + '<h3>Check</h3><pre class="al" tabindex="0">' + esc(r.check.ok ? (r.check.detail ? 'Passed: ' + r.check.detail + '.' : 'Passed.') : 'FAILED: ' + r.check.detail) + '</pre>';
    last = { r: r, text: X.headline(r) }; $('ex-dl').hidden = false;
  }
  function download(name, mime, text) { var a = document.createElement('a'), u = URL.createObjectURL(new Blob([text], { type: mime })); a.href = u; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(u); }, 500); say('Downloaded ' + name); }
  function loadHist() { try { var x = JSON.parse(localStorage.getItem(HKEY) || '[]'); hist = Array.isArray(x) ? x.filter(function (h) { return h && typeof h.text === 'string' && h.s && typeof h.s === 'object'; }).slice(0, 10) : []; } catch (e) { hist = []; } }
  function saveHist() { try { localStorage.setItem(HKEY, JSON.stringify(hist.slice(0, 10))); } catch (e) {} }
  function drawHist() {
    $('ex-hist').innerHTML = hist.length ? hist.map(function (h, k) { return '<li><button type="button" class="chipb" data-h="' + k + '" aria-label="Use again: ' + esc(h.text) + '">' + esc(h.text) + '</button></li>'; }).join('') : '<li class="note">No saved calculations yet. Press Save to history or Enter.</li>';
    $('ex-hclear').hidden = !hist.length;
  }
  function keep() { if (!last) return; var t = last.text.length > 90 ? last.text.slice(0, 87) + '…' : last.text; hist = hist.filter(function (h) { return h.text !== t; }); hist.unshift({ text: t, s: state() }); hist = hist.slice(0, 10); saveHist(); drawHist(); say('Saved to history'); }
  function insert(k) {
    var el = focus || ia, v = el.value, s = el.selectionStart, e = el.selectionEnd;
    if (typeof s !== 'number') { s = e = v.length; }
    if (k === 'back') { if (s !== e) { el.value = v.slice(0, s) + v.slice(e); e = s; } else if (s > 0) { el.value = v.slice(0, s - 1) + v.slice(s); s = e = s - 1; } }
    else { el.value = v.slice(0, s) + (k === '-' ? '−' : k) + v.slice(e); s = e = s + 1; }
    el.focus(); try { el.setSelectionRange(s, e); } catch (x) {} render();
  }
  ia.addEventListener('focus', function () { focus = ia; }); inn.addEventListener('focus', function () { focus = inn; });
  $('ex').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.key) { insert(b.dataset.key); return; }
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.ex) { setState(JSON.parse(b.dataset.ex)); return; }
    if (b.dataset.h !== undefined) { var h = hist[Number(b.dataset.h)]; if (h) setState(h.s); return; }
    if (b.dataset.act === 'reset') { setState(DEF); return; }
    if (b.dataset.act === 'swap') { var t = ia.value; ia.value = inn.value; inn.value = t; render(); return; }
    if (b.dataset.act === 'save') { keep(); return; }
    if (b.dataset.act === 'clear') { ia.value = ''; inn.value = ''; render(); ia.focus(); return; }
    if (b.dataset.act === 'hclear') { hist = []; saveHist(); drawHist(); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'copyall' && last) { copy(X.exportTxt(last.r)); return; }
    if (b.dataset.dl && last) { var n = 'exponent-negative-fractional'; if (b.dataset.dl === 'txt') download(n + '.txt', 'text/plain', X.exportTxt(last.r)); if (b.dataset.dl === 'csv') download(n + '.csv', 'text/csv', X.exportCsv(last.r)); if (b.dataset.dl === 'json') download(n + '.json', 'application/json', X.exportJson(last.r)); }
  });
  [ia, inn].forEach(function (el) { el.addEventListener('input', render); el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); keep(); } }); });
  sigS.addEventListener('change', render); sigS.addEventListener('input', render);
  loadHist(); drawHist(); setState(DEF);
})();
