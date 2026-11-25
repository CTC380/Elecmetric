/* Elecmetric Half-Life Calculator, Mode 02: page script. Inlined by tools/halflife_const_page.js after the engines (HalfLife, HalfLifeConst). */
(function () {
  var $ = function (id) { return document.getElementById(id); }, HL = HalfLife, DC = HalfLifeConst, F = DC.FIELDS;
  var known = $('dc-known'), tu = $('dc-tu'), ou = $('dc-ou'), sigS = $('dc-sig'), err = $('dc-err'), out = $('dc-out'), stp = $('dc-steps');
  var inp = {}; F.forEach(function (f) { inp[f] = $('dc-' + f); });
  var DEF = { known: 'auto', T: '10', lambda: '', tau: '', tu: 'yr', ou: 'same', sig: '6' }, HKEY = 'em-halflife-const-history', hist = [], last = null, filled = null;
  var NAME = { T: 'Half-life T\u00bd', lambda: 'Decay constant \u03bb', tau: 'Mean lifetime \u03c4' };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function say(t) { $('dc-note').textContent = t; }
  function copy(t) { var d = function () { say('Copied ' + t); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function copyBtn(t, label) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="Copy ' + esc(label) + '">Copy</button>'; }
  function sigVal() { return sigS.value === 'full' ? 'full' : Number(sigS.value); }
  function state() { return { known: known.value, T: inp.T.value, lambda: inp.lambda.value, tau: inp.tau.value, tu: tu.value, ou: ou.value, sig: sigS.value }; }
  function setState(d) {
    known.value = d.known || 'auto'; tu.value = d.tu || 'yr'; ou.value = d.ou || 'same'; sigS.value = d.sig || '6';
    F.forEach(function (f) { inp[f].value = d[f] === undefined ? '' : d[f]; }); lock(); render();
  }
  /* the two fields being found are read-only while a starting value is chosen; the labels carry the units */
  function lock() {
    F.forEach(function (f) {
      var solved = known.value !== 'auto' && known.value !== f; inp[f].readOnly = solved; inp[f].classList.toggle('solved', solved);
      if (!solved && filled && filled.indexOf(f) >= 0) { inp[f].value = ''; }
    });
    if (known.value === 'auto') filled = null;
    var u = HL.timeLabel(tu.value);
    $('dc-lT').textContent = 'Half-life T\u00bd (' + u + ')'; $('dc-ltau').textContent = 'Mean lifetime \u03c4 (' + u + ')'; $('dc-llambda').textContent = 'Decay constant \u03bb (per ' + HL.timeLabel(tu.value, 1) + ')';
  }
  function longUnit(u) { for (var i = 0; i < HL.TIME_UNITS.length; i++) if (HL.TIME_UNITS[i][0] === u) return HL.TIME_UNITS[i][2]; return u; }
  function mark(field) { F.forEach(function (f) { var bad = f === field; inp[f].classList.toggle('bad', bad); inp[f].setAttribute('aria-invalid', String(bad)); }); }
  function clearPlaceholders() { F.forEach(function (f) { inp[f].placeholder = ''; }); }
  function render() {
    lock(); clearPlaceholders();
    var r = DC.run({ known: known.value, T: inp.T.value, lambda: inp.lambda.value, tau: inp.tau.value, timeUnit: tu.value, outUnit: ou.value, sig: sigVal() });
    last = null; $('dc-dl').hidden = true;
    if (!r.ok) {
      err.textContent = r.empty ? '' : r.error; err.classList.toggle('hint', !!r.empty); mark(r.empty ? null : r.field);
      out.innerHTML = ''; stp.innerHTML = '<p class="note">Enter a half-life, a decay constant or a mean lifetime to see the working.</p>'; return;
    }
    err.textContent = ''; err.classList.remove('hint'); mark(null);
    var s = r.sol, sg = sigVal(), f = function (v) { return HL.fmt(v, sg); };
    if (known.value !== 'auto') { filled = F.filter(function (x) { return x !== r.source; }); filled.forEach(function (x) { inp[x].value = String(s[x]); }); }
    else { filled = null; F.forEach(function (x) { if (inp[x].value.trim() === '') inp[x].placeholder = '= ' + f(s[x]); }); }
    var per = HL.timeLabel(r.timeUnit, 1), big = '<div class="res"><p class="sub">Starting from the ' + esc(DC.NAMES[r.source].toLowerCase()) + '</p>' +
      F.map(function (x) { var v = f(s[x]), unit = x === 'lambda' ? 'per ' + per : HL.timeLabel(r.timeUnit, s[x]); return '<div class="big' + (x === r.source ? ' src' : '') + '"><span class="sym">' + esc(DC.SYMS[x]) + ' =</span> ' + esc(v + '\u00a0' + unit) + copyBtn(v, DC.NAMES[x].toLowerCase()) + '</div>'; }).join('') + '</div>';
    var c = r.conv, head = '<tr><th scope="col">Quantity</th><th scope="col">Value</th><th scope="col">Unit</th>' + (c ? '<th scope="col">In ' + esc(longUnit(c.unit)) + '</th><th scope="col">Unit</th>' : '') + '</tr>';
    var body = F.map(function (x) {
      var unit = x === 'lambda' ? 'per ' + per : HL.timeLabel(r.timeUnit, s[x]), cu = c ? (x === 'lambda' ? 'per ' + HL.timeLabel(c.unit, 1) : HL.timeLabel(c.unit, c[x])) : '';
      return '<tr' + (x === r.source ? ' class="cu"' : '') + '><th scope="row">' + esc(NAME[x]) + '</th><td class="r">' + esc(f(s[x])) + '</td><td>' + esc(unit) + '</td>' + (c ? '<td class="r">' + esc(f(c[x])) + '</td><td>' + esc(cu) + '</td>' : '') + '</tr>';
    }).join('');
    var tbl = '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: decay constant results"><table class="ns-t"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>';
    var meaning = '<p class="ns-facts"><span>After one half-life <b>50%</b> is left</span><span>After one mean lifetime <b>' + esc(f(DC.afterMeanLifetimes(1) * 100) + '%') + '</b> (1/e) is left</span><span>In one ' + esc(per) + ' <b>' + esc(f(r.perUnit.remaining * 100) + '%') + '</b> is left, <b>' + esc(f(r.perUnit.decayed * 100) + '%') + '</b> decays</span><span>\u03c4 / T\u00bd = <b>' + esc(f(1 / DC.LN2)) + '</b></span></p>';
    var eqv = r.equivalents.length ? '<p class="ns-facts">' + r.equivalents.map(function (q) { return q.perSecond !== undefined ? '<span>' + esc(q.label) + ' <b>' + esc(f(q.perSecond) + ' per s') + '</b></span>' : '<span>' + esc(q.label) + ' <b>' + esc(f(q.seconds) + ' s') + '</b>' + (r.timeUnit === 'yr' ? '' : ' = <b>' + esc(f(q.years) + ' Julian years') + '</b>') + '</span>'; }).join('') + '</p>' : '';
    var warn = r.warnings.map(function (w) { return '<p class="note warn">' + esc(w.message) + '</p>'; }).join('');
    out.innerHTML = big + tbl + meaning + eqv + warn;
    stp.innerHTML = r.steps.map(function (x) { return '<h3>' + esc(x.title) + '</h3><pre class="al" tabindex="0">' + esc(x.text) + '</pre>'; }).join('');
    last = { r: r, text: line(r) }; $('dc-dl').hidden = false;
  }
  function line(r) {
    var s = r.sol, f = function (v) { return HL.fmt(v, sigVal()); }, u = function (v) { return '\u00a0' + HL.timeLabel(r.timeUnit, v); };
    return 'T\u00bd = ' + f(s.T) + u(s.T) + ', \u03bb = ' + f(s.lambda) + ' per\u00a0' + HL.timeLabel(r.timeUnit, 1) + ', \u03c4 = ' + f(s.tau) + u(s.tau);
  }
  function download(name, mime, text) { var a = document.createElement('a'), u = URL.createObjectURL(new Blob([text], { type: mime })); a.href = u; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(u); }, 500); say('Downloaded ' + name); }
  function loadHist() { try { var x = JSON.parse(localStorage.getItem(HKEY) || '[]'); hist = Array.isArray(x) ? x.filter(function (h) { return h && typeof h.text === 'string' && h.s && typeof h.s === 'object'; }).slice(0, 10) : []; } catch (e) { hist = []; } }
  function saveHist() { try { localStorage.setItem(HKEY, JSON.stringify(hist.slice(0, 10))); } catch (e) {} }
  function drawHist() {
    $('dc-hist').innerHTML = hist.length ? hist.map(function (h, k) { return '<li><button type="button" class="chipb" data-h="' + k + '" aria-label="Use again: ' + esc(h.text) + '">' + esc(h.text) + '</button></li>'; }).join('') : '<li class="note">No saved calculations yet. Press Enter or Save to history.</li>';
    $('dc-hclear').hidden = !hist.length;
  }
  function keep() {
    if (!last) return; var t = last.text; hist = hist.filter(function (h) { return h.text !== t; });
    var st = state(); st.known = last.r.source; F.forEach(function (x) { if (x !== last.r.source) st[x] = ''; });
    hist.unshift({ text: t, s: st }); hist = hist.slice(0, 10); saveHist(); drawHist(); say('Saved to history');
  }
  $('dc').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.ex) { setState(JSON.parse(b.dataset.ex)); return; }
    if (b.dataset.h !== undefined) { var h = hist[Number(b.dataset.h)]; if (h) setState(h.s); return; }
    if (b.dataset.act === 'reset') { filled = null; setState(DEF); return; }
    if (b.dataset.act === 'save') { keep(); return; }
    if (b.dataset.act === 'clear') { F.forEach(function (f) { inp[f].value = ''; }); filled = null; render(); inp.T.focus(); return; }
    if (b.dataset.act === 'hclear') { hist = []; saveHist(); drawHist(); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'copyall' && last) { copy(DC.exportTxt(last.r)); return; }
    if (b.dataset.dl && last) { var n = 'decay-constant'; if (b.dataset.dl === 'txt') download(n + '.txt', 'text/plain', DC.exportTxt(last.r)); if (b.dataset.dl === 'csv') download(n + '.csv', 'text/csv', DC.exportCsv(last.r)); if (b.dataset.dl === 'json') download(n + '.json', 'application/json', DC.exportJson(last.r)); }
  });
  F.forEach(function (f) { inp[f].addEventListener('input', render); inp[f].addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); keep(); } }); });
  known.addEventListener('change', function () { if (known.value !== 'auto') { filled = null; } else { F.forEach(function (f) { if (inp[f].readOnly) inp[f].value = ''; }); } render(); });
  [tu, ou, sigS].forEach(function (el) { el.addEventListener('change', render); el.addEventListener('input', render); });
  loadHist(); drawHist(); setState(DEF);
})();
