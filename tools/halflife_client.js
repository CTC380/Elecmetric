/* Elecmetric Half-Life Calculator, Mode 01: page script. Inlined by tools/halflife_page.js after the engine (HalfLife). */
(function () {
  var $ = function (id) { return document.getElementById(id); }, HL = HalfLife, F = HL.FIELDS;
  var tgt = $('hl-target'), tu = $('hl-tu'), qu = $('hl-qu'), sigS = $('hl-sig'), err = $('hl-err'), out = $('hl-out'), stp = $('hl-steps');
  var inp = {}; F.forEach(function (f) { inp[f] = $('hl-' + f); });
  var DEF = { target: 'auto', N0: '100', Nt: '', t: '11460', T: '5730', tu: 'yr', qu: 'g', sig: '6' }, HKEY = 'em-halflife-history', hist = [], last = null, filled = null;
  var NAME = { N0: 'Initial quantity N\u2080', Nt: 'Remaining quantity N\u209c', t: 'Elapsed time t', T: 'Half-life T\u00bd' };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function say(t) { $('hl-note').textContent = t; }
  function copy(t) { var d = function () { say('Copied ' + t); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function copyBtn(t, label) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="Copy ' + esc(label) + '">Copy</button>'; }
  function sigVal() { return sigS.value === 'full' ? 'full' : Number(sigS.value); }
  function state() { return { target: tgt.value, N0: inp.N0.value, Nt: inp.Nt.value, t: inp.t.value, T: inp.T.value, tu: tu.value, qu: qu.value, sig: sigS.value }; }
  function setState(d) {
    tgt.value = d.target || 'auto'; tu.value = d.tu || 'yr'; qu.value = d.qu === undefined ? '' : d.qu; sigS.value = d.sig || '6';
    F.forEach(function (f) { inp[f].value = d[f] === undefined ? '' : d[f]; }); lock(); render();
  }
  /* the field being solved is read-only while a target is chosen; the labels carry the units */
  function lock() {
    F.forEach(function (f) {
      var solved = tgt.value === f; inp[f].readOnly = solved; inp[f].classList.toggle('solved', solved);
      if (!solved && filled === f) { inp[f].value = ''; }
    });
    if (tgt.value === 'auto') filled = null;
    var u = HL.timeLabel(tu.value), q = qu.value.trim();
    $('hl-lt').textContent = 'Elapsed time t (' + u + ')'; $('hl-lT').textContent = 'Half-life T\u00bd (' + u + ')';
    $('hl-lN0').textContent = 'Initial quantity N\u2080' + (q ? ' (' + q + ')' : ''); $('hl-lNt').textContent = 'Remaining quantity N\u209c' + (q ? ' (' + q + ')' : '');
  }
  function mark(field) { F.forEach(function (f) { var bad = f === field; inp[f].classList.toggle('bad', bad); inp[f].setAttribute('aria-invalid', String(bad)); }); }
  function clearPlaceholders() { F.forEach(function (f) { inp[f].placeholder = ''; }); }
  function render() {
    lock(); clearPlaceholders();
    var r = HL.run({ target: tgt.value, N0: inp.N0.value, Nt: inp.Nt.value, t: inp.t.value, T: inp.T.value, timeUnit: tu.value, quantityUnit: qu.value, sig: sigVal() });
    last = null; $('hl-dl').hidden = true;
    if (!r.ok) {
      err.textContent = r.empty ? '' : r.error; err.classList.toggle('hint', !!(r.empty || r.partial)); mark(r.empty || r.partial ? null : r.field);
      if (r.partial && r.field && tgt.value === 'auto') inp[r.field].placeholder = 'enter or leave empty';
      out.innerHTML = ''; stp.innerHTML = '<p class="note">Enter any three of the four values to see the working.</p>'; return;
    }
    err.textContent = ''; err.classList.remove('hint'); mark(null);
    var s = r.sol, t = r.target, shown = HL.fmt(s[t], sigVal());
    if (tgt.value !== 'auto') { inp[t].value = s[t] === Infinity ? 'infinity' : String(s[t]); filled = t; }
    else { inp[t].placeholder = '= ' + shown; filled = null; }
    var uTxt = t === 'N0' || t === 'Nt' ? r.quantityUnit : HL.timeLabel(r.timeUnit, s[t]);
    var big = '<div class="res"><p class="sub">' + esc(NAME[t]) + '</p><div class="big">' + esc(shown + (uTxt ? '\u00a0' + uTxt : '')) + copyBtn(shown, 'result') + '</div>' +
      '<p class="sub">' + esc(HL.fmt(s.remFrac * 100, sigVal()) + '% remaining, ' + HL.fmt(s.decFrac * 100, sigVal()) + '% decayed after ' + HL.fmt(s.n, sigVal()) + ' half-li' + (s.n === 1 ? 'fe' : 'ves')) + '</p></div>';
    var rowsHtml = rowList(r).map(function (x) { return '<tr' + (x.key === t ? ' class="cu"' : '') + '><th scope="row">' + esc(x.label) + '</th><td class="r">' + esc(x.value) + '</td><td>' + esc(x.unit) + '</td></tr>'; }).join('');
    var tbl = '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: decay results"><table class="ns-t"><thead><tr><th scope="col">Quantity</th><th scope="col">Value</th><th scope="col">Unit</th></tr></thead><tbody>' + rowsHtml + '</tbody></table></div>';
    var eqv = r.equivalents.length ? '<p class="ns-facts">' + r.equivalents.map(function (q) { return '<span>' + esc(q.label) + ' <b>' + esc(HL.fmt(q.seconds, sigVal()) + ' s') + '</b>' + (r.timeUnit === 'yr' ? '' : ' = <b>' + esc(HL.fmt(q.years, sigVal()) + ' Julian years') + '</b>') + '</span>'; }).join('') + '</p>' : '';
    var warn = r.warnings.map(function (w) { return '<p class="note warn">' + esc(w.message) + '</p>'; }).join('');
    out.innerHTML = big + tbl + eqv + warn;
    stp.innerHTML = r.steps.map(function (x) { return '<h3>' + esc(x.title) + '</h3><pre class="al" tabindex="0">' + esc(x.text) + '</pre>'; }).join('');
    last = { r: r, text: line(r) }; $('hl-dl').hidden = false;
  }
  function rowList(r) {
    var s = r.sol, f = function (v) { return HL.fmt(v, sigVal()); }, q = r.quantityUnit, tl = function (v) { return HL.timeLabel(r.timeUnit, v); };
    return [{ key: 'N0', label: 'Initial quantity N\u2080', value: f(s.N0), unit: q }, { key: 'Nt', label: 'Remaining quantity N\u209c', value: f(s.Nt), unit: q }, { key: 'dq', label: 'Decayed quantity', value: f(s.decQty), unit: q },
      { key: 'rp', label: 'Remaining percentage', value: s.remFrac === 0 ? '\u2248 0%' : f(s.remFrac * 100) + '%', unit: '' }, { key: 'dp', label: 'Decayed percentage', value: f(s.decFrac * 100) + '%', unit: '' },
      { key: 't', label: 'Elapsed time t', value: f(s.t), unit: tl(s.t) }, { key: 'T', label: 'Half-life T\u00bd', value: f(s.T), unit: tl(s.T) }, { key: 'n', label: 'Half-lives elapsed n', value: f(s.n), unit: '' },
      { key: 'l', label: 'Decay constant \u03bb', value: f(s.lambda), unit: 'per ' + HL.timeLabel(r.timeUnit, 1) }, { key: 'tau', label: 'Mean lifetime \u03c4', value: f(s.tau), unit: tl(s.tau) }];
  }
  function line(r) {
    var s = r.sol, f = function (v) { return HL.fmt(v, sigVal()); }, q = r.quantityUnit ? '\u00a0' + r.quantityUnit : '', u = function (v) { return '\u00a0' + HL.timeLabel(r.timeUnit, v); };
    return 'N\u2080 = ' + f(s.N0) + q + ', N\u209c = ' + f(s.Nt) + q + ', t = ' + f(s.t) + u(s.t) + ', T\u00bd = ' + f(s.T) + u(s.T);
  }
  function download(name, mime, text) { var a = document.createElement('a'), u = URL.createObjectURL(new Blob([text], { type: mime })); a.href = u; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(u); }, 500); say('Downloaded ' + name); }
  function loadHist() { try { var x = JSON.parse(localStorage.getItem(HKEY) || '[]'); hist = Array.isArray(x) ? x.filter(function (h) { return h && typeof h.text === 'string' && h.s && typeof h.s === 'object'; }).slice(0, 10) : []; } catch (e) { hist = []; } }
  function saveHist() { try { localStorage.setItem(HKEY, JSON.stringify(hist.slice(0, 10))); } catch (e) {} }
  function drawHist() {
    $('hl-hist').innerHTML = hist.length ? hist.map(function (h, k) { return '<li><button type="button" class="chipb" data-h="' + k + '" aria-label="Use again: ' + esc(h.text) + '">' + esc(h.text) + '</button></li>'; }).join('') : '<li class="note">No saved calculations yet. Press Enter or Save to history.</li>';
    $('hl-hclear').hidden = !hist.length;
  }
  function keep() {
    if (!last) return; var t = last.text; hist = hist.filter(function (h) { return h.text !== t; });
    var st = state(); if (st.target !== 'auto') st[last.r.target] = ''; st.target = 'auto';
    hist.unshift({ text: t, s: st }); hist = hist.slice(0, 10); saveHist(); drawHist(); say('Saved to history');
  }
  $('hl').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.ex) { setState(JSON.parse(b.dataset.ex)); return; }
    if (b.dataset.h !== undefined) { var h = hist[Number(b.dataset.h)]; if (h) setState(h.s); return; }
    if (b.dataset.act === 'reset') { filled = null; setState(DEF); return; }
    if (b.dataset.act === 'save') { keep(); return; }
    if (b.dataset.act === 'clear') { F.forEach(function (f) { inp[f].value = ''; }); filled = null; render(); inp.N0.focus(); return; }
    if (b.dataset.act === 'hclear') { hist = []; saveHist(); drawHist(); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'copyall' && last) { copy(HL.exportTxt(last.r)); return; }
    if (b.dataset.dl && last) { var n = 'half-life'; if (b.dataset.dl === 'txt') download(n + '.txt', 'text/plain', HL.exportTxt(last.r)); if (b.dataset.dl === 'csv') download(n + '.csv', 'text/csv', HL.exportCsv(last.r)); if (b.dataset.dl === 'json') download(n + '.json', 'application/json', HL.exportJson(last.r)); }
  });
  F.forEach(function (f) { inp[f].addEventListener('input', render); inp[f].addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); keep(); } }); });
  tgt.addEventListener('change', function () { if (tgt.value !== 'auto') { filled = null; } else { F.forEach(function (f) { if (inp[f].readOnly) inp[f].value = ''; }); } render(); });
  /* isotope preset: sets only the half-life and its time unit; amounts and elapsed time stay as typed. If the half-life was the quantity being solved, the page returns to automatic. */
  var pre = $('hl-preset');
  if (pre) pre.addEventListener('change', function () {
    var o = pre.options[pre.selectedIndex]; if (!o || !o.value) { $('hl-pnote').textContent = 'A preset fills only the half-life and its time unit.'; return; }
    if (tgt.value === 'T') { tgt.value = 'auto'; filled = null; }
    var oldTu = tu.value, hadT = inp.t.value.trim() !== '' && tgt.value !== 't';
    tu.value = o.getAttribute('data-tu'); inp.T.value = o.getAttribute('data-T'); lock(); render();
    var u = o.getAttribute('data-u');
    $('hl-pnote').textContent = o.getAttribute('data-n') + ': half-life ' + o.getAttribute('data-T') + ' ' + HL.timeLabel(tu.value, Number(o.getAttribute('data-T'))) + (u ? ' (standard uncertainty ' + u + ')' : '') + '. Source: see Isotope half-lives below.' + (hadT && oldTu !== tu.value ? ' The time unit changed to ' + HL.timeLabel(tu.value) + ', so the elapsed time you typed is now read in ' + HL.timeLabel(tu.value) + ': change it if it was in another unit.' : '');
    say(o.getAttribute('data-n') + ' half-life applied');
  });
  [tu, qu, sigS].forEach(function (el) { el.addEventListener('change', render); el.addEventListener('input', render); });
  inp.T.addEventListener('input', function () { if (pre && pre.value) pre.value = ''; }); tu.addEventListener('change', function () { if (pre && pre.value) pre.value = ''; });
  loadHist(); drawHist(); setState(DEF);
})();
