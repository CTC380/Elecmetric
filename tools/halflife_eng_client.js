/* Elecmetric Half-Life Calculator, Mode 05: page script. Inlined by tools/halflife_eng_page.js after the engines (HalfLife, HalfLifeEng). */
(function () {
  var $ = function (id) { return document.getElementById(id); }, HL = HalfLife, EN = HalfLifeEng, U = EN.UNITS;
  var ids = ['X0', 'R', 'Z', 'tau', 't', 'tg', 'ql'], inp = {}; ids.forEach(function (k) { inp[k] = $('ed-' + k); });
  var circ = $('ed-circ'), find = $('ed-find'), x0u = $('ed-x0u'), ru = $('ed-ru'), zu = $('ed-zu'), tauu = $('ed-tauu'), kind = $('ed-kind'), tun = $('ed-tun'), tgm = $('ed-tgm'), sigS = $('ed-sig'), probe = $('ed-probe'), err = $('ed-err'), out = $('ed-out'), stp = $('ed-steps');
  var DEF = { circ: 'rc', find: 'value', X0: '100', x0u: 'V', R: '10', ru: 'kohm', Z: '100', zu: 'uF', tau: '', tauu: 's', kind: 'tau', t: '1', tun: 's', tg: '', tgm: 'abs', ql: '', sig: '6' }, HKEY = 'em-halflife-eng-history', hist = [], last = null, probeN = null;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function say(t) { $('ed-note').textContent = t; }
  function copy(t) { var d = function () { say('Copied'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function sigVal() { return sigS.value === 'full' ? 'full' : Number(sigS.value); }
  function fill(sel, kindKey, keep) { sel.innerHTML = U[kindKey].map(function (u) { return '<option value="' + u[0] + '">' + esc(u[1]) + '</option>'; }).join(''); sel.value = keep && U[kindKey].some(function (u) { return u[0] === keep; }) ? keep : EN.DEFAULT_UNIT[kindKey]; }
  function state() { return { circ: circ.value, find: find.value, X0: inp.X0.value, x0u: x0u.value, R: inp.R.value, ru: ru.value, Z: inp.Z.value, zu: zu.value, tau: inp.tau.value, tauu: tauu.value, kind: kind.value, t: inp.t.value, tun: tun.value, tg: inp.tg.value, tgm: tgm.value, ql: inp.ql.value, sig: sigS.value }; }
  function setState(d) {
    circ.value = d.circ || 'rc'; find.value = d.find || 'value'; fillFor = null; layout(d.x0u, d.zu);
    ['X0', 'R', 'Z', 'tau', 't', 'tg', 'ql'].forEach(function (k) { inp[k].value = d[k] === undefined ? '' : d[k]; });
    ru.value = d.ru || 'ohm'; tauu.value = d.tauu || 's'; kind.value = d.kind || 'tau'; tun.value = d.tun || 's'; tgm.value = d.tgm || 'abs'; sigS.value = d.sig || '6'; probeN = null; render();
  }
  var fillFor = null;
  function layout(keepX, keepZ) {
    var c = circ.value, gen = c === 'gen', f = find.value;
    if (fillFor !== c) { fill(x0u, c === 'rc' ? 'V' : 'I', keepX); if (!gen) fill(zu, c === 'rc' ? 'C' : 'L', keepZ); fillFor = c; }
    $('ed-wx0u').hidden = gen; $('ed-wql').hidden = !gen; $('ed-wR').hidden = gen; $('ed-wZ').hidden = gen; $('ed-wtau').hidden = !gen;
    $('ed-lX0').textContent = c === 'rc' ? 'Initial voltage V₀' : c === 'rl' ? 'Initial current I₀' : 'Initial value x₀';
    $('ed-lR').textContent = c === 'rc' ? 'Discharge resistance R' : 'Total loop resistance R';
    $('ed-lZ').textContent = c === 'rc' ? 'Capacitance C' : 'Inductance L';
    $('ed-ltau').textContent = kind.value === 'half' ? 'Half-life T½' : 'Time constant τ';
    $('ed-wt').hidden = f !== 'value'; $('ed-wtg').hidden = f !== 'time';
    $('ed-lt').textContent = 'Elapsed time t'; $('ed-ltun').textContent = f === 'value' ? 'Time unit' : 'Show the time in';
    $('ed-ltg').textContent = tgm.value === 'pct' ? 'Target (% of the initial value)' : (c === 'rc' ? 'Target voltage' : c === 'rl' ? 'Target current' : 'Target value');
    $('ed-wtgm').hidden = f !== 'time';
  }
  function mark(field) { ids.forEach(function (k) { var bad = k === field; inp[k].classList.toggle('bad', bad); inp[k].setAttribute('aria-invalid', String(bad)); }); }
  var FIELD = { X0: 'X0', R: 'R', C: 'Z', L: 'Z', tau: 'tau', t: 't', target: 'tg' };
  function run() {
    var c = circ.value;
    return EN.run({ circuit: c, find: find.value, X0: inp.X0.value, x0Unit: x0u.value, quantityUnit: inp.ql.value, R: inp.R.value, rUnit: ru.value, C: inp.Z.value, cUnit: zu.value, L: inp.Z.value, lUnit: zu.value, tau: inp.tau.value, tauUnit: tauu.value, tauKind: kind.value, t: inp.t.value, tUnit: tun.value, target: inp.tg.value, targetMode: tgm.value, sig: sigVal() });
  }
  function pc(fr, sg, isDec) { return fr === 0 && isDec ? '0%' : fr === 0 ? '≈ 0%' : HL.fmt(fr * 100, sg) + '%'; }
  function cards(r, sg) {
    var byId = {}; r.facts.forEach(function (f) { byId[f.id] = f; });
    var big = function (f, lab) { return '<div class="ed-c"><div class="sub">' + esc(lab || f.label) + '</div><div class="big">' + esc(f.text) + '</div></div>'; };
    var head = r.find === 'time' ? big(byId.time, 'Time to reach ' + HL.fmt(r.xt, sg) + (r.quantityUnit ? ' ' + r.quantityUnit : '')) + big(byId.n) + big(byId.tau) + big(byId.tHalf) : big(byId.xt, byId.xt.label) + big(byId.frac) + big(byId.dec) + big(byId.tau) + big(byId.tHalf);
    var rest = r.facts.filter(function (f) { return ['time', 'xt', 'frac', 'dec', 'tau', 'tHalf', 'n', 'x0', 'V0', 'I0'].indexOf(f.id) < 0 || (f.id === 'I0' && r.circuit === 'rc'); });
    var bar = '<div class="dt-bar" role="img" aria-label="' + esc(pc(r.frac, sg) + ' remaining, ' + pc(r.dec, sg, 1) + ' decayed') + '"><span class="rem" style="width:' + (r.frac * 100).toFixed(2) + '%"></span><span class="dec"></span></div><div class="dt-key"><span><i class="k1"></i>Remaining ' + esc(pc(r.frac, sg)) + '</span><span><i class="k2"></i>Decayed ' + esc(pc(r.dec, sg, 1)) + '</span></div>';
    return '<div class="ed-cards">' + head + '</div>' + bar + '<h3>More results</h3><table class="ns-t"><tbody>' + rest.map(function (f) { return '<tr><th scope="row">' + esc(f.label) + '</th><td class="r">' + esc(f.text) + '</td></tr>'; }).join('') + '</tbody></table>';
  }
  function ladder(r, sg) {
    var f = function (v) { return HL.fmt(v, sg); }, Q = r.quantityUnit ? ' (' + r.quantityUnit + ')' : '';
    var row = function (x) { return '<tr><th scope="row">' + esc(x.label) + '</th><td class="r">' + esc(f(x.n)) + '</td><td class="r">' + esc(EN.timeText(x.tS, sg)) + '</td><td class="r">' + esc(pc(x.frac, sg)) + '</td><td class="r">' + esc(pc(x.dec, sg, 1)) + '</td><td class="r">' + esc(f(x.value)) + '</td></tr>'; };
    var head = '<thead><tr><th scope="col">Point</th><th scope="col">n (τ)</th><th scope="col">Time</th><th scope="col">Remaining</th><th scope="col">Decayed</th><th scope="col">Value' + esc(Q) + '</th></tr></thead>';
    return '<h3>Time-constant ladder</h3><div class="tw" tabindex="0" role="region" aria-label="Scrollable table: time-constant ladder"><table class="ns-t">' + head + '<tbody>' + r.ladder.map(row).join('') + '</tbody></table></div><h3>How long to fall to a level</h3><div class="tw" tabindex="0" role="region" aria-label="Scrollable table: time to fall to a level"><table class="ns-t">' + head + '<tbody>' + r.milestones.map(row).join('') + '</tbody></table></div>';
  }
  function readout(r, sg) {
    var n = probeN === null ? Math.min(1, r.n > 0 && r.n <= 5 ? r.n : 1) : probeN, q = EN.at(r, n), f = function (v) { return HL.fmt(v, sg); };
    return '<p class="dt-rd"><b>n = ' + esc(f(n)) + ' τ = ' + esc(EN.timeText(q.tS, sg)) + '</b>: ' + esc(pc(q.frac, sg)) + ' left, ' + esc(pc(q.dec, sg, 1)) + ' decayed, ' + esc(f(q.xt)) + (r.quantityUnit ? ' ' + esc(r.quantityUnit) : '') + '</p>';
  }
  function xmaxOf(r) { return r.n <= 5 ? 5 : r.n <= 10 ? 10 : r.n <= 20 ? 20 : r.n <= 40 ? 40 : 5; }
  function drawGraph() {
    if (!last) return; var r = last.r, n = probeN === null ? undefined : probeN;
    $('ed-graph').innerHTML = EN.graph(r, { probe: n }); $('ed-rd').innerHTML = readout(r, sigVal());
    probe.value = String(Math.round((n === undefined ? Math.min(1, xmaxOf(r)) : n) / xmaxOf(r) * 1000));
  }
  function line(r) { var f = function (v) { return HL.fmt(v, sigVal()); }; return (r.circuit === 'rc' ? 'RC discharge' : r.circuit === 'rl' ? 'RL decay' : 'Exponential decay') + ': τ ' + EN.timeText(r.tauS, sigVal()) + ', ' + (r.find === 'value' ? 'at ' + f(r.tIn) + ' ' + EN.unitLabel('T', r.tUnit) + ': ' : 'to ' + f(r.xt) + (r.quantityUnit ? ' ' + r.quantityUnit : '') + ': ') + (r.find === 'value' ? f(r.xt) + (r.quantityUnit ? ' ' + r.quantityUnit : '') + ' (' + pc(r.frac, sigVal()) + ')' : EN.timeText(r.tS, sigVal())); }
  function render() {
    layout(x0u.value, zu.value); var r = run(); last = null; $('ed-dl').hidden = true; $('ed-gwrap').hidden = true;
    if (!r.ok) { err.textContent = r.error; err.classList.toggle('hint', !!r.empty); mark(r.empty ? null : FIELD[r.field] || r.field); out.innerHTML = ''; stp.innerHTML = '<p class="note">Enter the values to see the result, the graph and the working.</p>'; return; }
    err.textContent = ''; err.classList.remove('hint'); mark(null);
    last = { r: r, text: line(r) }; var sg = sigVal();
    out.innerHTML = r.warnings.map(function (w) { return '<p class="note warn">' + esc(w.message) + '</p>'; }).join('') + '<div class="res">' + cards(r, sg) + '</div>' + ladder(r, sg);
    stp.innerHTML = r.steps.map(function (x) { return '<h3>' + esc(x.title) + '</h3><pre class="al" tabindex="0">' + esc(x.text) + '</pre>'; }).join('');
    $('ed-gwrap').hidden = false; $('ed-dl').hidden = false; drawGraph();
  }
  function download(name, mime, blob) { var a = document.createElement('a'), u = URL.createObjectURL(blob); a.href = u; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(u); }, 500); say('Downloaded ' + name); }
  function svgText() { return EN.graph(last.r, { probe: probeN === null ? undefined : probeN }); }
  function savePng() {
    var svg = svgText(), img = new Image(), u = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    img.onload = function () { var c = document.createElement('canvas'); c.width = 1520; c.height = 840; var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); if (c.toBlob) c.toBlob(function (b) { if (b) download('decay-graph.png', 'image/png', b); else say('This browser could not make a PNG. Use the SVG.'); }, 'image/png'); else say('This browser could not make a PNG. Use the SVG.'); };
    img.onerror = function () { URL.revokeObjectURL(u); say('This browser could not make a PNG. Use the SVG.'); }; img.src = u;
  }
  function loadHist() { try { var x = JSON.parse(localStorage.getItem(HKEY) || '[]'); hist = Array.isArray(x) ? x.filter(function (h) { return h && typeof h.text === 'string' && h.s && typeof h.s === 'object'; }).slice(0, 10) : []; } catch (e) { hist = []; } }
  function saveHist() { try { localStorage.setItem(HKEY, JSON.stringify(hist.slice(0, 10))); } catch (e) {} }
  function drawHist() { $('ed-hist').innerHTML = hist.length ? hist.map(function (h, k) { return '<li><button type="button" class="chipb" data-h="' + k + '" aria-label="Use again: ' + esc(h.text) + '">' + esc(h.text) + '</button></li>'; }).join('') : '<li class="note">No saved calculations yet. Press Enter or Save to history.</li>'; $('ed-hclear').hidden = !hist.length; }
  function keep() { if (!last) return; var t = last.text; hist = hist.filter(function (h) { return h.text !== t; }); hist.unshift({ text: t, s: state() }); hist = hist.slice(0, 10); saveHist(); drawHist(); say('Saved to history'); }
  $('ed').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.ex) { setState(Object.assign({}, DEF, JSON.parse(b.dataset.ex))); return; }
    if (b.dataset.h !== undefined) { var h = hist[Number(b.dataset.h)]; if (h) setState(h.s); return; }
    if (b.dataset.act === 'reset') { setState(DEF); return; }
    if (b.dataset.act === 'save') { keep(); return; }
    if (b.dataset.act === 'clear') { ids.forEach(function (k) { if (k !== 'ql') inp[k].value = ''; }); render(); inp.X0.focus(); return; }
    if (b.dataset.act === 'hclear') { hist = []; saveHist(); drawHist(); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'copyall' && last) { copy(EN.exportTxt(last.r)); return; }
    if (!last) return;
    if (b.dataset.dl === 'txt') download('engineering-decay.txt', 'text/plain', new Blob([EN.exportTxt(last.r)], { type: 'text/plain' }));
    if (b.dataset.dl === 'csv') download('engineering-decay.csv', 'text/csv', new Blob([EN.exportCsv(last.r)], { type: 'text/csv' }));
    if (b.dataset.dl === 'json') download('engineering-decay.json', 'application/json', new Blob([EN.exportJson(last.r)], { type: 'application/json' }));
    if (b.dataset.dl === 'svg') download('decay-graph.svg', 'image/svg+xml', new Blob([svgText()], { type: 'image/svg+xml' }));
    if (b.dataset.dl === 'png') savePng();
  });
  ids.forEach(function (k) { inp[k].addEventListener('input', render); inp[k].addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); keep(); } }); });
  circ.addEventListener('change', function () { fillFor = null; layout(); probeN = null; render(); });
  [find, x0u, ru, zu, tauu, kind, tun, tgm, sigS].forEach(function (el) { el.addEventListener('change', render); });
  probe.addEventListener('input', function () { if (!last) return; probeN = Number(probe.value) / 1000 * xmaxOf(last.r); drawGraph(); });
  $('ed-graph').addEventListener('pointermove', function (e) { if (!last) return; var svg = $('ed-graph').firstChild; if (!svg || !svg.getBoundingClientRect) return; var bb = svg.getBoundingClientRect(), W = 760, L = 64, R = 18, x = (e.clientX - bb.left) / bb.width * W; if (x < L || x > W - R) return; probeN = (x - L) / (W - L - R) * xmaxOf(last.r); drawGraph(); });
  loadHist(); drawHist(); setState(DEF);
})();
