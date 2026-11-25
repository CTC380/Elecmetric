/* Elecmetric Half-Life Calculator, Mode 03: page script. Inlined by tools/halflife_percent_page.js after the engines (HalfLife, HalfLifePercent). */
(function () {
  var $ = function (id) { return document.getElementById(id); }, HL = HalfLife, DP = HalfLifePercent, F = DP.FIELDS;
  var tu = $('dp-tu'), hu = $('dp-hu'), qu = $('dp-qu'), sigS = $('dp-sig'), err = $('dp-err'), out = $('dp-out'), stp = $('dp-steps');
  var inp = {}; F.forEach(function (f) { inp[f] = $('dp-' + f); });
  var DEF = { N0: '100', t: '11460', T: '5730', tu: 'yr', hu: 'same', qu: 'g', sig: '6' }, HKEY = 'em-halflife-percent-history', hist = [], last = null;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function say(t) { $('dp-note').textContent = t; }
  function copy(t) { var d = function () { say('Copied ' + t); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function copyBtn(t, label) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="Copy ' + esc(label) + '">Copy</button>'; }
  function sigVal() { return sigS.value === 'full' ? 'full' : Number(sigS.value); }
  function state() { return { N0: inp.N0.value, t: inp.t.value, T: inp.T.value, tu: tu.value, hu: hu.value, qu: qu.value, sig: sigS.value }; }
  function setState(d) { F.forEach(function (f) { inp[f].value = d[f] === undefined ? '' : d[f]; }); tu.value = d.tu || 'yr'; hu.value = d.hu || 'same'; qu.value = d.qu === undefined ? '' : d.qu; sigS.value = d.sig || '6'; render(); }
  function mark(field) { F.forEach(function (f) { var bad = f === field; inp[f].classList.toggle('bad', bad); inp[f].setAttribute('aria-invalid', String(bad)); }); }
  function labels() {
    var tl = HL.timeLabel(tu.value), hl = HL.timeLabel(hu.value === 'same' ? tu.value : hu.value);
    $('dp-lt').textContent = 'Elapsed time t (' + tl + ')'; $('dp-lT').textContent = 'Half-life T\u00bd (' + hl + ')';
  }
  function pc(fr, sg) { return fr === 0 ? '\u2248 0%' : HL.fmt(fr * 100, sg) + '%'; }
  function render() {
    labels();
    var r = DP.run({ N0: inp.N0.value, t: inp.t.value, T: inp.T.value, timeUnit: tu.value, halfLifeUnit: hu.value, quantityUnit: qu.value, sig: sigVal() });
    last = null; $('dp-dl').hidden = true;
    if (!r.ok) {
      err.textContent = r.empty ? '' : r.error; err.classList.toggle('hint', !!(r.empty || r.partial)); mark(r.empty || r.partial ? null : r.field);
      out.innerHTML = ''; stp.innerHTML = '<p class="note">Enter an elapsed time and a half-life to see the working.</p>'; return;
    }
    err.textContent = ''; err.classList.remove('hint'); mark(null);
    var s = r.sol, sg = sigVal(), f = function (v) { return HL.fmt(v, sg); }, Q = r.quantityUnit ? '\u00a0' + r.quantityUnit : '', hl = HL.timeLabel(r.halfLifeUnit, 1);
    var remPct = s.remFrac * 100, bar = '<div class="dp-bar" role="img" aria-label="Remaining ' + esc(pc(s.remFrac, sg)) + ', decayed ' + esc(pc(s.decFrac, sg)) + '"><span class="rem" style="width:' + Math.max(0, Math.min(100, remPct)).toFixed(3) + '%"></span><span class="dec"></span></div><p class="dp-key"><span><i class="k1"></i>Remaining</span><span><i class="k2"></i>Decayed</span></p>';
    var cards = '<div class="dp-cards"><div class="dp-c"><span class="ns-l">Remaining</span><div class="big">' + esc(pc(s.remFrac, sg)) + copyBtn(s.remFrac === 0 ? '0%' : f(remPct) + '%', 'remaining percentage') + '</div>' + (s.hasQty ? '<div class="sub">' + esc(f(s.remQty) + Q) + '</div>' : '') + '</div>' +
      '<div class="dp-c"><span class="ns-l">Decayed</span><div class="big">' + esc(pc(s.decFrac, sg)) + copyBtn(f(s.decFrac * 100) + '%', 'decayed percentage') + '</div>' + (s.hasQty ? '<div class="sub">' + esc(f(s.decQty) + Q) + '</div>' : '') + '</div>' +
      '<div class="dp-c"><span class="ns-l">Half-lives elapsed</span><div class="big">' + esc(f(s.n)) + copyBtn(f(s.n), 'half-lives elapsed') + '</div><div class="sub">' + (s.wholeIsN && s.n >= 1 && s.n <= 53 ? 'halved ' + esc(f(s.n)) + (s.n === 1 ? ' time' : ' times') + ', 1 / ' + esc(HL.fmt(Math.pow(2, s.n), 12)) + ' left' : s.n === 0 ? 'no time has passed' : 'n = t / T\u00bd') + '</div></div></div>';
    var rows = [['Remaining percentage', pc(s.remFrac, sg), ''], ['Decayed percentage', pc(s.decFrac, sg), '']];
    if (s.hasQty) rows.unshift(['Initial quantity N\u2080', f(s.N0), r.quantityUnit], ['Remaining quantity N\u209c', f(s.remQty), r.quantityUnit], ['Decayed quantity', f(s.decQty), r.quantityUnit]);
    rows.push(['Half-lives elapsed n', f(s.n), ''], ['Elapsed time t', f(s.t), HL.timeLabel(r.timeUnit, s.t)], ['Half-life T\u00bd', f(s.T), HL.timeLabel(r.halfLifeUnit, s.T)], ['Decay constant \u03bb', f(s.lambda), 'per ' + hl], ['Mean lifetime \u03c4', f(s.tau), HL.timeLabel(r.halfLifeUnit, s.tau)]);
    var tbl = '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: decay percentage results"><table class="ns-t"><thead><tr><th scope="col">Quantity</th><th scope="col">Value</th><th scope="col">Unit</th></tr></thead><tbody>' + rows.map(function (x) { return '<tr><th scope="row">' + esc(x[0]) + '</th><td class="r">' + esc(x[1]) + '</td><td>' + esc(x[2]) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    var lad = '<h3>The halving ladder</h3><div class="tw" tabindex="0" role="region" aria-label="Scrollable table: the halving ladder"><table class="ns-t"><thead><tr><th scope="col">Half-lives</th><th scope="col">Time (' + esc(HL.timeLabel(r.halfLifeUnit)) + ')</th><th scope="col">Remaining</th>' + (s.hasQty ? '<th scope="col">Quantity' + (r.quantityUnit ? ' (' + esc(r.quantityUnit) + ')' : '') + '</th>' : '') + '</tr></thead><tbody>' +
      r.ladder.map(function (x) { return '<tr' + (x.current ? ' class="cu"' : '') + '><th scope="row">' + x.k + (x.current ? ' (now)' : '') + '</th><td class="r">' + esc(f(x.time)) + '</td><td class="r">' + esc(pc(x.frac, sg)) + '</td>' + (s.hasQty ? '<td class="r">' + esc(f(x.qty)) + '</td>' : '') + '</tr>'; }).join('') + '</tbody></table></div>' + (s.wholeIsN ? '' : '<p class="note">Your time is ' + esc(f(s.n)) + ' half-lives, between ' + s.whole + ' and ' + (s.whole + 1) + ' (' + esc(pc(DP.remainingFraction(s.whole), sg)) + ' and ' + esc(pc(DP.remainingFraction(s.whole + 1), sg)) + ' left).</p>');
    var ms = '<h3>How long until it falls to</h3><div class="tw" tabindex="0" role="region" aria-label="Scrollable table: time to reach a percentage"><table class="ns-t"><thead><tr><th scope="col">Remaining</th><th scope="col">Half-lives</th><th scope="col">Time (' + esc(HL.timeLabel(r.halfLifeUnit)) + ')</th></tr></thead><tbody>' + r.milestones.map(function (x) { return '<tr><th scope="row">' + esc(HL.fmt(x.percent, 6) + '%') + '</th><td class="r">' + esc(f(x.halfLives)) + '</td><td class="r">' + esc(f(x.time)) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    var eqv = r.equivalents.length ? '<p class="ns-facts">' + r.equivalents.map(function (q) { return '<span>' + esc(q.label) + ' <b>' + esc(f(q.seconds) + ' s') + '</b>' + (r.timeUnit === 'yr' && r.halfLifeUnit === 'yr' ? '' : ' = <b>' + esc(f(q.years) + ' Julian years') + '</b>') + '</span>'; }).join('') + '</p>' : '';
    var warn = r.warnings.map(function (w) { return '<p class="note warn">' + esc(w.message) + '</p>'; }).join('');
    out.innerHTML = cards + bar + tbl + eqv + lad + ms + warn;
    stp.innerHTML = r.steps.map(function (x) { return '<h3>' + esc(x.title) + '</h3><pre class="al" tabindex="0">' + esc(x.text) + '</pre>'; }).join('');
    last = { r: r, text: line(r) }; $('dp-dl').hidden = false;
  }
  function line(r) {
    var s = r.sol, f = function (v) { return HL.fmt(v, sigVal()); }, Q = r.quantityUnit ? '\u00a0' + r.quantityUnit : '';
    return (s.hasQty ? f(s.N0) + Q + ' after ' : '') + f(s.t) + '\u00a0' + HL.timeLabel(r.timeUnit, s.t) + ' (T\u00bd = ' + f(s.T) + '\u00a0' + HL.timeLabel(r.halfLifeUnit, s.T) + '): ' + pc(s.remFrac, sigVal()) + ' left, ' + pc(s.decFrac, sigVal()) + ' decayed';
  }
  function download(name, mime, text) { var a = document.createElement('a'), u = URL.createObjectURL(new Blob([text], { type: mime })); a.href = u; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(u); }, 500); say('Downloaded ' + name); }
  function loadHist() { try { var x = JSON.parse(localStorage.getItem(HKEY) || '[]'); hist = Array.isArray(x) ? x.filter(function (h) { return h && typeof h.text === 'string' && h.s && typeof h.s === 'object'; }).slice(0, 10) : []; } catch (e) { hist = []; } }
  function saveHist() { try { localStorage.setItem(HKEY, JSON.stringify(hist.slice(0, 10))); } catch (e) {} }
  function drawHist() {
    $('dp-hist').innerHTML = hist.length ? hist.map(function (h, k) { return '<li><button type="button" class="chipb" data-h="' + k + '" aria-label="Use again: ' + esc(h.text) + '">' + esc(h.text) + '</button></li>'; }).join('') : '<li class="note">No saved calculations yet. Press Enter or Save to history.</li>';
    $('dp-hclear').hidden = !hist.length;
  }
  function keep() { if (!last) return; var t = last.text; hist = hist.filter(function (h) { return h.text !== t; }); hist.unshift({ text: t, s: state() }); hist = hist.slice(0, 10); saveHist(); drawHist(); say('Saved to history'); }
  $('dp').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.ex) { setState(JSON.parse(b.dataset.ex)); return; }
    if (b.dataset.h !== undefined) { var h = hist[Number(b.dataset.h)]; if (h) setState(h.s); return; }
    if (b.dataset.act === 'reset') { setState(DEF); return; }
    if (b.dataset.act === 'save') { keep(); return; }
    if (b.dataset.act === 'clear') { F.forEach(function (f) { inp[f].value = ''; }); render(); inp.t.focus(); return; }
    if (b.dataset.act === 'hclear') { hist = []; saveHist(); drawHist(); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'copyall' && last) { copy(DP.exportTxt(last.r)); return; }
    if (b.dataset.dl && last) { var n = 'decay-percentage'; if (b.dataset.dl === 'txt') download(n + '.txt', 'text/plain', DP.exportTxt(last.r)); if (b.dataset.dl === 'csv') download(n + '.csv', 'text/csv', DP.exportCsv(last.r)); if (b.dataset.dl === 'json') download(n + '.json', 'application/json', DP.exportJson(last.r)); }
  });
  F.forEach(function (f) { inp[f].addEventListener('input', render); inp[f].addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); keep(); } }); });
  qu.addEventListener('input', render);
  [tu, hu, sigS].forEach(function (el) { el.addEventListener('change', render); el.addEventListener('input', render); });
  loadHist(); drawHist(); setState(DEF);
})();
