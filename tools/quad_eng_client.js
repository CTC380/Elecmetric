/* Elecmetric Quadratic Formula Calculator: page script for Mode 05 (Engineering Quadratic Solver). Inlined by tools/quad_eng_page.js after tools/quad_engine.js and tools/quad_eng_engine.js. */
(function () {
  var $ = function (id) { return document.getElementById(id); }, Qd = Quad, QE = QuadEng, type = 'series', last = null;
  var F = [$('en-p1'), $('en-p2'), $('en-p3')], X0 = $('en-x0'), V0 = $('en-v0'), DP = $('en-dp');
  var DEF = { series: ['10', '1m', '100u'], parallel: ['1k', '10m', '100n'], control: ['1', '2', '5'], mech: ['1', '4', '4'], zeta: ['100', '0.5', ''] };
  var PH = { series: ['e.g. 4.7k', 'e.g. 10m', 'e.g. 100n'], parallel: ['e.g. 1k', 'e.g. 10m', 'e.g. 100n'], control: ['e.g. 1', 'e.g. 2', 'e.g. 5'], mech: ['e.g. 2', 'e.g. 3', 'e.g. 8'], zeta: ['e.g. 100', 'e.g. 0.5', ''] };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function mn(s) { return Qd.mn(s); }
  function note(t) { $('en-note').textContent = t; }
  function copy(t) { var d = function () { note('Copied'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function mark(el, msg) { el.classList.toggle('bad', !!msg); el.setAttribute('aria-invalid', String(!!msg)); }
  function table(head, rows) { return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + esc(head.join(', ')) + '"><table class="ns-t"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function flag(t, hot) { return '<span class="ns-flag' + (hot ? ' r' : '') + '">' + esc(t) + '</span>'; }
  function row(a, b, c) { return '<tr><td>' + a + '</td><td class="r">' + esc(mn(b)) + '</td><td>' + (c || '') + '</td></tr>'; }
  function actions(text) { return '<div class="ns-act"><button type="button" class="btn2" data-copy="' + esc(text) + '">Copy result</button><button type="button" class="btn2" data-act="save">Save as .txt</button><button type="button" class="btn2" data-act="print">Print</button></div>'; }
  function list(a) { return '<ol class="steps">' + a.map(function (s) { return '<li>' + esc(mn(s)) + '</li>'; }).join('') + '</ol>'; }

  /* ---------- pictures ---------- */
  function niceTicks(lo, hi, n) { var span = hi - lo, st = Math.pow(10, Math.floor(Math.log10(span / n))), m = span / n / st; st *= m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10; var t = [], v = Math.ceil(lo / st - 1e-9) * st; for (; v <= hi + st * 1e-9; v += st) t.push(Math.abs(v) < st * 1e-9 ? 0 : v); return t; }
  function responseSvg(r) {
    var pts = QE.curve(r, 400), env = QE.envelope(r), lo = Infinity, hi = -Infinity, i;
    pts.forEach(function (p) { lo = Math.min(lo, p[1]); hi = Math.max(hi, p[1]); });
    if (env) { lo = Math.min(lo, -env(0)); hi = Math.max(hi, env(0)); }
    lo = Math.min(lo, 0); hi = Math.max(hi, 0);
    if (!isFinite(lo) || !isFinite(hi) || hi === lo) return '';
    var pad = (hi - lo) * 0.06; lo -= pad; hi += pad;
    var W = 640, H = 300, L = 62, Rm = 14, T = 14, B = 40, sx = function (t) { return L + (W - L - Rm) * t / r.span; }, sy = function (y) { return T + (H - T - B) * (hi - y) / (hi - lo); };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Natural response x(t) against time" class="eng-svg"><rect x="' + L + '" y="' + T + '" width="' + (W - L - Rm) + '" height="' + (H - T - B) + '" fill="none" stroke="currentColor" stroke-opacity=".25"/>';
    niceTicks(lo, hi, 5).forEach(function (v) { var y = sy(v); s += '<line x1="' + L + '" x2="' + (W - Rm) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="currentColor" stroke-opacity="' + (v === 0 ? '.5' : '.12') + '"/><text x="' + (L - 6) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="currentColor">' + esc(mn(QE.sig(v, 3))) + '</text>'; });
    niceTicks(0, r.span, 5).forEach(function (v) { var x = sx(v); s += '<line x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + T + '" y2="' + (H - B) + '" stroke="currentColor" stroke-opacity=".12"/><text x="' + x.toFixed(1) + '" y="' + (H - B + 16) + '" text-anchor="middle" font-size="11" fill="currentColor">' + esc(QE.si(v, 's', 3)) + '</text>'; });
    if (env) { var up = '', dn = ''; for (i = 0; i <= 120; i++) { var t = r.span * i / 120, e = env(t); up += (i ? 'L' : 'M') + sx(t).toFixed(1) + ' ' + sy(e).toFixed(1); dn += (i ? 'L' : 'M') + sx(t).toFixed(1) + ' ' + sy(-e).toFixed(1); } s += '<path d="' + up + '" fill="none" stroke="var(--gold)" stroke-width="1.2" stroke-dasharray="5 4"/><path d="' + dn + '" fill="none" stroke="var(--gold)" stroke-width="1.2" stroke-dasharray="5 4"/>'; }
    s += '<path d="' + pts.map(function (p, k) { return (k ? 'L' : 'M') + sx(p[0]).toFixed(1) + ' ' + sy(p[1]).toFixed(1); }).join('') + '" fill="none" stroke="var(--num)" stroke-width="2"/>';
    s += '<text x="' + ((L + W - Rm) / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="12" fill="currentColor">time t</text></svg>';
    return s;
  }
  function poleSvg(r) {
    var W = 320, H = 300, cx = W / 2, cy = H / 2, m = Math.max.apply(null, r.rootsF.map(function (q) { return Math.max(Math.abs(q.re), Math.abs(q.im)); })), sc;
    if (!(m > 0)) m = 1; sc = (Math.min(W, H) / 2 - 38) / m;
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Pole map in the s-plane" class="eng-svg"><rect x="0" y="0" width="' + cx + '" height="' + H + '" fill="var(--gold)" fill-opacity=".07"/>';
    s += '<line x1="8" x2="' + (W - 8) + '" y1="' + cy + '" y2="' + cy + '" stroke="currentColor" stroke-opacity=".5"/><line x1="' + cx + '" x2="' + cx + '" y1="8" y2="' + (H - 8) + '" stroke="currentColor" stroke-opacity=".5"/><text x="' + (W - 10) + '" y="' + (cy - 6) + '" text-anchor="end" font-size="11" fill="currentColor">Re(s)</text><text x="' + (cx + 6) + '" y="18" font-size="11" fill="currentColor">Im(s)</text><text x="12" y="' + (H - 12) + '" font-size="10" fill="currentColor" fill-opacity=".7">left half-plane: stable</text>';
    var seen = {};
    r.rootsF.forEach(function (q, i) {
      var x = cx + q.re * sc, y = cy - q.im * sc, k = x.toFixed(1) + ',' + y.toFixed(1), d = 7;
      s += '<path d="M' + (x - d) + ' ' + (y - d) + 'L' + (x + d) + ' ' + (y + d) + 'M' + (x - d) + ' ' + (y + d) + 'L' + (x + d) + ' ' + (y - d) + '" stroke="var(--num)" stroke-width="2.4" fill="none"/>';
      if (!seen[k]) { seen[k] = 1; var lab = q.im === 0 ? 's = ' + QE.sig(q.re, 4) : QE.sig(q.re, 4) + (q.im > 0 ? ' + ' : ' \u2212 ') + QE.sig(Math.abs(q.im), 4) + 'j'; var tx = x > cx ? x - 10 : x + 10; s += '<text x="' + tx.toFixed(1) + '" y="' + (y + (q.im >= 0 ? -12 : 20)).toFixed(1) + '" text-anchor="' + (x > cx ? 'end' : 'start') + '" font-size="11" fill="currentColor">' + esc(mn(lab)) + '</text>'; }
    });
    return s + '</svg>';
  }

  function show(r) {
    var out = $('en-out'), res = $('en-res'), err = $('en-err');
    if (!r.ok) { var e = r.errors || {}; F.forEach(function (el, i) { mark(el, e['p' + (i + 1)]); }); mark(X0, e.x0); mark(V0, e.v0); err.textContent = r.empty ? '' : r.error; out.innerHTML = ''; last = null; res.hidden = true; return; }
    F.forEach(function (el) { mark(el, ''); }); mark(X0, ''); mark(V0, ''); err.textContent = ''; res.hidden = false;
    var p = r.p, rows = [], hot = r.key === 'unstable' || r.key === 'unstable-osc';
    rows.push(row('Characteristic equation', r.characteristic + ' = 0'));
    rows.push(row('Discriminant \u0394 = b\u00b2 \u2212 4ac', Qd.rs(r.quad.D), flag('exact')));
    rows.push(row('Classification', r.label, flag(r.stable ? 'stable' : r.marginal ? 'marginal' : 'unstable', hot)));
    r.roots.forEach(function (x, i) { var nm = r.roots.length > 1 ? 's' + (i + 1) : 's (repeated)'; rows.push(row(nm + ' (exact)', x.exact)); if (x.exact !== x.dec) rows.push(row(nm + ' (decimal)', (x.exact === x.dec ? '' : '\u2248 ') + x.dec)); });
    if (p.omega0 !== undefined) { rows.push(row('Natural frequency \u03c90', QE.si(p.omega0, 'rad/s'), esc(mn('f0 = ' + QE.si(p.f0, 'Hz'))))); rows.push(row('Damping ratio \u03b6', QE.sig(p.zeta, 6), p.Q ? esc('Q = ' + QE.sig(p.Q, 6)) : '')); }
    rows.push(row('Neper frequency \u03b1 = b/(2a)', QE.si(p.alpha, 'Np/s')));
    if (p.omegad !== undefined) rows.push(row('Damped frequency \u03c9d', QE.si(p.omegad, 'rad/s'), esc(mn('fd = ' + QE.si(p.fd, 'Hz') + ', period ' + QE.si(p.period, 's')))));
    if (p.tauDom !== undefined) rows.push(row('Slowest time constant', QE.si(p.tauDom, 's'), esc('settling (2%) \u2248 ' + QE.si(p.ts, 's'))));
    if (p.bw) rows.push(row('Bandwidth (\u22123 dB)', QE.si(p.bwHz, 'Hz'), esc(mn('= ' + QE.si(p.bw, 'rad/s')))));
    if (p.f1 !== undefined) rows.push(row('Half-power frequencies', QE.si(p.f1, 'Hz') + ' and ' + QE.si(p.f2, 'Hz')));
    if (p.overshoot !== undefined) rows.push(row('Step overshoot', QE.sig(p.overshoot, 4) + ' %', esc('peak at ' + QE.si(p.peakTime, 's'))));
    if (p.Rcrit !== undefined) rows.push(row(type === 'mech' ? 'Critical damping c' : 'Critical resistance R', QE.si(p.Rcrit, type === 'mech' ? 'N\u00b7s/m' : '\u03a9'), esc(p.RcritNote)));
    if (p.ccrit !== undefined) rows.push(row('Critical damping c', QE.si(p.ccrit, 'N\u00b7s/m'), esc(p.RcritNote)));
    rows.push(row('Natural response', r.text));
    var big = '<div class="qroot">' + esc(r.label) + '</div>', sub = r.roots.map(function (x, i) { return (r.roots.length > 1 ? 's' + (i + 1) : 's') + ' = ' + mn(x.exact); }).join(',  ');
    last = { text: r.summary };
    out.innerHTML = '<div class="res"><div class="big">' + big + '</div><div class="sub">' + esc(sub) + '</div><p class="note">' + esc(r.detail + ' ' + r.stability) + '</p></div>' + table(['Quantity', 'Value', ''], rows) + actions(r.summary) +
      '<div class="eng-figs"><figure><figcaption>Natural response x(t), starting at x(0) = ' + esc(QE.sig(r.response.x0, 4)) + ', x\u2032(0) = ' + esc(QE.sig(r.response.v0, 4)) + (r.key === 'under' || r.key === 'unstable-osc' ? '. The dashed curves are the envelope.' : '') + '</figcaption>' + responseSvg(r) + '</figure><figure><figcaption>Poles in the s-plane</figcaption>' + poleSvg(r) + '</figure></div>' +
      ((type === 'control' || type === 'zeta') ? '<p class="note">Electrical engineering writes the imaginary unit as j; the roots above use the mathematical i.</p>' : '');
    $('en-steps').innerHTML = list(r.steps);
    $('en-verify').innerHTML = '<p>' + (r.checkOk ? flag('Verified', false) + ' Every check below holds.' : flag('Check failed', true) + ' A check did not hold. Please report this system.') + '</p><ul class="vl">' + r.checks.map(function (c) { return '<li>' + esc(mn(c.label)) + ' ' + (c.ok ? '\u2713' : '\u2717') + '</li>'; }).join('') + '</ul>';
  }

  function render() {
    var T = QE.TYPES[type], nf = T.nf || 3;
    $('en-eq').textContent = mn(T.eq);
    show(QE.analyse({ type: type, p1: F[0].value, p2: F[1].value, p3: F[2].value, x0: X0.value, v0: V0.value, dp: +DP.value }));
  }
  function setType(t, vals) {
    type = t; var T = QE.TYPES[t], nf = T.nf || 3;
    [].forEach.call(document.querySelectorAll('[data-type]'), function (b) { var on = b.dataset.type === t; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    for (var i = 0; i < 3; i++) {
      var show3 = i < nf; F[i].parentNode.hidden = !show3;
      if (show3) { $('en-l' + (i + 1)).textContent = T.fields[i][1] + (T.fields[i][2] ? ' (' + T.fields[i][2] + ')' : ''); F[i].placeholder = PH[t][i]; F[i].value = vals ? vals[i] : DEF[t][i]; F[i].defaultValue = DEF[t][i]; }
      else F[i].value = '';
    }
    [].forEach.call(document.querySelectorAll('.eng-chips'), function (el) { el.hidden = el.dataset.for !== t; });
    render();
  }
  $('en').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.type) { setType(b.dataset.type); return; }
    if (b.dataset.ex) { var v = JSON.parse(b.dataset.ex); X0.value = v.x0 || '1'; V0.value = v.v0 || '0'; setType(v.type, [v.p1, v.p2, v.p3]); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'save' && last) { var bl = new Blob([last.text + '\n\nCalculated with Elecmetric Quadratic Formula Calculator, Mode 05\n'], { type: 'text/plain' }), u = URL.createObjectURL(bl), a = document.createElement('a'); a.href = u; a.download = 'engineering-quadratic-solution.txt'; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(u); }, 500); return; }
    if (b.dataset.act === 'reset') { X0.value = '1'; V0.value = '0'; DP.value = '8'; setType('series'); F[0].focus(); }
  });
  F.concat([X0, V0]).forEach(function (el) { el.addEventListener('input', render); });
  DP.addEventListener('change', render);
  setType('series');
})();
