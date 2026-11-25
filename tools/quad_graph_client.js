/* Elecmetric Quadratic Formula Calculator: page script for Mode 03 (Parabola Graph & Vertex). Inlined by tools/quad_graph_page.js after tools/quad_engine.js and tools/quad_graph_engine.js. */
(function () {
  var $ = function (id) { return document.getElementById(id); }, Qd = Quad, QG = QuadGraph, NS = 'http://www.w3.org/2000/svg';
  var A = $('pg-a'), B = $('pg-b'), C = $('pg-c'), DP = $('pg-dp'), GR = $('pg-gr'), W = 640, H = 400, view = null, res = null, last = null, trace = null, showFocus = false;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function mn(s) { return Qd.mn(s); }
  function note(t) { $('pg-note').textContent = t; }
  function copy(t) { var d = function () { note('Copied'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function mark(el, msg) { el.classList.toggle('bad', !!msg); el.setAttribute('aria-invalid', String(!!msg)); }
  function table(head, rows) { return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + esc(head.join(', ')) + '"><table class="ns-t"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function row(a, b, c) { return '<tr><td>' + esc(a) + '</td><td class="r">' + esc(b) + '</td><td>' + (c ? esc(c) : '') + '</td></tr>'; }
  function flag(t, hot) { return '<span class="ns-flag' + (hot ? ' r' : '') + '">' + esc(t) + '</span>'; }
  function actions(text) { return '<div class="ns-act"><button type="button" class="btn2" data-copy="' + esc(text) + '">Copy result</button><button type="button" class="btn2" data-act="save">Save as .txt</button><button type="button" class="btn2" data-act="png">Save graph (SVG)</button><button type="button" class="btn2" data-act="print">Print</button></div>'; }

  /* ---------- graph ---------- */
  function niceStep(span) { var raw = span / 8, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p; }
  function fmtTick(v, step) {
    if (Math.abs(v) < step * 1e-9) return '0';
    if (Math.abs(v) >= 1e6 || step < 1e-4) return mn(v.toExponential(2).replace(/\.?0+e/, 'e').replace('e+', 'e'));
    var d = Math.max(0, -Math.floor(Math.log10(step) + 1e-9)); return mn(v.toFixed(Math.min(d, 12)));
  }
  function short(v) { if (!isFinite(v)) return ''; var a = Math.abs(v); if (a !== 0 && (a >= 1e6 || a < 1e-4)) return mn(v.toExponential(3).replace(/\.?0+e/, 'e').replace('e+', 'e')); return mn(String(+v.toPrecision(5))); }
  function sx(x) { return (x - view.x0) / (view.x1 - view.x0) * W; }
  function sy(y) { return H - (y - view.y0) / (view.y1 - view.y0) * H; }
  function ix(px) { return view.x0 + px / W * (view.x1 - view.x0); }
  function iy(py) { return view.y0 + (H - py) / H * (view.y1 - view.y0); }
  function clampPx(v) { return Math.max(-5000, Math.min(5000, v)); }

  function drawGraph() {
    var g = res && res.graph, s = [], i;
    if (!view) view = { x0: -10, x1: 10, y0: -10 * H / W, y1: 10 * H / W };
    var sxs = niceStep(view.x1 - view.x0), sys = niceStep(view.y1 - view.y0);
    s.push('<defs><clipPath id="pg-clip"><rect x="0" y="0" width="' + W + '" height="' + H + '"/></clipPath></defs><rect class="gbg" x="0" y="0" width="' + W + '" height="' + H + '"/><g clip-path="url(#pg-clip)">');
    for (var x = Math.ceil(view.x0 / sxs) * sxs, n = 0; x <= view.x1 && n < 60; x += sxs, n++) s.push('<line class="grid" x1="' + sx(x).toFixed(1) + '" y1="0" x2="' + sx(x).toFixed(1) + '" y2="' + H + '"/>');
    for (var y = Math.ceil(view.y0 / sys) * sys, m = 0; y <= view.y1 && m < 60; y += sys, m++) s.push('<line class="grid" x1="0" y1="' + sy(y).toFixed(1) + '" x2="' + W + '" y2="' + sy(y).toFixed(1) + '"/>');
    if (view.x0 <= 0 && view.x1 >= 0) s.push('<line class="axis" x1="' + sx(0).toFixed(1) + '" y1="0" x2="' + sx(0).toFixed(1) + '" y2="' + H + '"/>');
    if (view.y0 <= 0 && view.y1 >= 0) s.push('<line class="axis" x1="0" y1="' + sy(0).toFixed(1) + '" x2="' + W + '" y2="' + sy(0).toFixed(1) + '"/>');
    if (g && g.kind === 'parabola') {
      var ax = sx(g.fn.h); s.push('<line class="sym" x1="' + ax.toFixed(1) + '" y1="0" x2="' + ax.toFixed(1) + '" y2="' + H + '"/>');
      if (showFocus && isFinite(g.fn.h)) {
        var p = 1 / (4 * g.fn.a), dy = sy(g.fn.k - p); s.push('<line class="dir" x1="0" y1="' + clampPx(dy).toFixed(1) + '" x2="' + W + '" y2="' + clampPx(dy).toFixed(1) + '"/>');
      }
    }
    if (g && g.fn && g.view && g.view.drawable) {
      var d = '', N = 480;
      for (i = 0; i <= N; i++) { var xv = view.x0 + (view.x1 - view.x0) * i / N, yv = g.fn.at(xv); if (!isFinite(yv)) continue; d += (d ? 'L' : 'M') + sx(xv).toFixed(1) + ' ' + clampPx(sy(yv)).toFixed(1); }
      if (d) s.push('<path class="curve" d="' + d + '"/>');
    }
    s.push('</g>');
    for (x = Math.ceil(view.x0 / sxs) * sxs, n = 0; x <= view.x1 && n < 60; x += sxs, n++) { var tx = sx(x); if (tx > 14 && tx < W - 14) s.push('<text class="tick" x="' + tx.toFixed(1) + '" y="' + (H - 5) + '" text-anchor="middle">' + fmtTick(x, sxs) + '</text>'); }
    for (y = Math.ceil(view.y0 / sys) * sys, m = 0; y <= view.y1 && m < 60; y += sys, m++) { var ty = sy(y); if (ty > 12 && ty < H - 16) s.push('<text class="tick" x="5" y="' + (ty - 3).toFixed(1) + '">' + fmtTick(y, sys) + '</text>'); }
    var boxes = [];
    function label(px, py, text, cls, shape, below) {
      if (!isFinite(px) || !isFinite(py)) return;
      if (px < -20 || px > W + 20 || py < -20 || py > H + 20) return;
      var anc = px > W - 170 ? 'end' : 'start', off = anc === 'end' ? -10 : 10, wd = text.length * 6.6 + 6, ly = below ? py + 22 : py - 9, step = below ? 15 : -15, tries = 0;
      if (ly < 14) { ly = py + 22; step = 15; } if (ly > H - 6) { ly = py - 9; step = -15; }
      function hit() { var x0 = anc === 'end' ? px + off - wd : px + off, x1 = x0 + wd; return boxes.some(function (q) { return x0 < q[1] && x1 > q[0] && ly - 12 < q[3] && ly + 3 > q[2]; }); }
      while (hit() && tries < 8) { ly += step; tries++; }
      var bx0 = anc === 'end' ? px + off - wd : px + off; boxes.push([bx0, bx0 + wd, ly - 12, ly + 3]);
      s.push((shape === 'sq' ? '<rect class="pt ' + cls + '" x="' + (px - 4.5).toFixed(1) + '" y="' + (py - 4.5).toFixed(1) + '" width="9" height="9"/>' : shape === 'di' ? '<path class="pt ' + cls + '" d="M' + px.toFixed(1) + ' ' + (py - 7).toFixed(1) + 'l7 7l-7 7l-7 -7z"/>' : '<circle class="pt ' + cls + '" cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="5"/>') + '<text class="plab" x="' + (px + off).toFixed(1) + '" y="' + ly.toFixed(1) + '" text-anchor="' + anc + '">' + esc(text) + '</text>');
    }
    if (g && g.kind === 'parabola') {
      var up = g.opens === 'up';
      g.xints.forEach(function (z) { label(sx(z.num), sy(0), 'x = ' + short(z.num), 'px', 'c', !up); });
      label(sx(0), sy(g.fn.at(0)), 'y-int (0, ' + short(g.fn.at(0)) + ')', 'py', 'sq', !up);
      if (showFocus) label(sx(g.fn.h), sy(g.fn.k + 1 / (4 * g.fn.a)), 'Focus', 'pf', 'c', up);
      label(sx(g.fn.h), sy(g.fn.k), 'Vertex (' + short(g.fn.h) + ', ' + short(g.fn.k) + ')', 'pv', 'di', up);
    } else if (g && g.kind === 'line') { label(sx(0), sy(g.fn.c), 'y-int (0, ' + short(g.fn.c) + ')', 'py', 'sq'); label(sx(g.xint.x ? QG.toNum(g.xint.x) : 0), sy(0), 'x = ' + short(QG.toNum(g.xint.x)), 'px', 'c'); }
    if (trace !== null && g && g.fn) { var yt = g.fn.at(trace), tpx = sx(trace), tpy = sy(yt); if (isFinite(tpy)) s.push('<line class="trl" x1="' + tpx.toFixed(1) + '" y1="0" x2="' + tpx.toFixed(1) + '" y2="' + H + '"/><circle class="trp" cx="' + tpx.toFixed(1) + '" cy="' + clampPx(tpy).toFixed(1) + '" r="5"/>'); }
    s.push('<rect class="gfr" x="0.5" y="0.5" width="' + (W - 1) + '" height="' + (H - 1) + '"/>');
    $('pg-svg').innerHTML = s.join('');
    $('pg-svg').setAttribute('aria-label', g && g.kind === 'parabola' ? 'Graph of ' + mn(g.standard) + '. Vertex ' + g.vertex.text + ', ' + g.opens + 'ward opening, ' + (g.xints.length ? 'x-intercepts ' + g.xints.map(function (z) { return z.exact; }).join(' and ') : 'no x-intercepts') + ', y-intercept ' + g.yint.text + '.' : g && g.kind === 'line' ? 'Graph of a straight line, A = 0.' : 'No graph');
    var el = $('pg-view'); el.textContent = 'x from ' + short(view.x0) + ' to ' + short(view.x1) + ', y from ' + short(view.y0) + ' to ' + short(view.y1);
  }
  function readout() {
    var g = res && res.graph, el = $('pg-read');
    if (trace === null || !g || !g.fn) { el.textContent = 'Click or tap the graph to read a point.'; return; }
    el.textContent = 'x ≈ ' + short(trace) + ',  y ≈ ' + short(g.fn.at(trace)) + '  (approximate: read from the picture. Use "Value at x" below for an exact result.)';
  }
  function fit() { var g = res && res.graph; view = g && g.view ? { x0: g.view.x0, x1: g.view.x1, y0: g.view.y0, y1: g.view.y1 } : { x0: -10, x1: 10, y0: -10 * H / W, y1: 10 * H / W }; }
  function zoom(f, cx, cy) {
    var px = cx === undefined ? (view.x0 + view.x1) / 2 : cx, py = cy === undefined ? (view.y0 + view.y1) / 2 : cy;
    var nx0 = px - (px - view.x0) * f, nx1 = px + (view.x1 - px) * f, ny0 = py - (py - view.y0) * f, ny1 = py + (view.y1 - py) * f;
    if (!isFinite(nx0 + nx1 + ny0 + ny1) || nx1 - nx0 < 1e-12 * Math.max(1, Math.abs(nx0)) || ny1 - ny0 < 1e-12 * Math.max(1, Math.abs(ny0)) || nx1 - nx0 > 1e15 || ny1 - ny0 > 1e15) return;
    view = { x0: nx0, x1: nx1, y0: ny0, y1: ny1 }; drawGraph();
  }
  function pan(fx, fy) { var dx = (view.x1 - view.x0) * fx, dy = (view.y1 - view.y0) * fy; view = { x0: view.x0 + dx, x1: view.x1 + dx, y0: view.y0 + dy, y1: view.y1 + dy }; drawGraph(); }
  function equalAxes() { var cx = (view.x0 + view.x1) / 2, cy = (view.y0 + view.y1) / 2, half = (view.x1 - view.x0) / 2 * H / W; view = { x0: view.x0, x1: view.x1, y0: cy - half, y1: cy + half }; drawGraph(); }
  function svgPoint(e) { var r = $('pg-svg').getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }

  var drag = null;
  GR.addEventListener('pointerdown', function (e) { if (e.button !== undefined && e.button > 0) return; var p = svgPoint(e); drag = { px: p.x, py: p.y, v: { x0: view.x0, x1: view.x1, y0: view.y0, y1: view.y1 }, moved: false, id: e.pointerId }; try { GR.setPointerCapture(e.pointerId); } catch (er) {} });
  GR.addEventListener('pointermove', function (e) {
    var p = svgPoint(e);
    if (drag && drag.id === e.pointerId) {
      var dx = p.x - drag.px, dy = p.y - drag.py; if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
      if (drag.moved) { var wx = (drag.v.x1 - drag.v.x0) / W, wy = (drag.v.y1 - drag.v.y0) / H; view = { x0: drag.v.x0 - dx * wx, x1: drag.v.x1 - dx * wx, y0: drag.v.y0 + dy * wy, y1: drag.v.y1 + dy * wy }; drawGraph(); GR.classList.add('grab'); }
    } else if (e.pointerType === 'mouse' && res && res.graph && res.graph.fn) { trace = ix(p.x); drawGraph(); readout(); }
  });
  function endDrag(e) { if (!drag || drag.id !== e.pointerId) return; var was = drag; drag = null; GR.classList.remove('grab'); if (!was.moved && res && res.graph && res.graph.fn) { trace = ix(svgPoint(e).x); drawGraph(); readout(); } }
  GR.addEventListener('pointerup', endDrag); GR.addEventListener('pointercancel', function (e) { if (drag && drag.id === e.pointerId) { drag = null; GR.classList.remove('grab'); } });
  GR.addEventListener('wheel', function (e) { e.preventDefault(); var p = svgPoint(e); zoom(e.deltaY < 0 ? 0.85 : 1 / 0.85, ix(p.x), iy(p.y)); }, { passive: false });
  GR.addEventListener('keydown', function (e) {
    var k = e.key, h = true;
    if (k === 'ArrowLeft') pan(-0.1, 0); else if (k === 'ArrowRight') pan(0.1, 0); else if (k === 'ArrowUp') pan(0, 0.1); else if (k === 'ArrowDown') pan(0, -0.1);
    else if (k === '+' || k === '=') zoom(0.8); else if (k === '-' || k === '_') zoom(1.25); else if (k === '0') { fit(); drawGraph(); } else h = false;
    if (h) e.preventDefault();
  });

  /* ---------- results ---------- */
  function render(keepView) {
    var a = Qd.parseNum(A.value), b = Qd.parseNum(B.value), c = Qd.parseNum(C.value);
    $('pg-eq').textContent = (a.v && b.v && c.v) ? 'y = ' + mn(Qd.equationText(a.v, b.v, c.v)).replace(/ = 0$/, '') : '';
    var r = QG.graph({ a: A.value, b: B.value, c: C.value, dp: +DP.value }), out = $('pg-out'), stp = $('pg-steps'), ver = $('pg-verify');
    if (!r.ok) {
      var e = r.errors || {}; mark(A, e.a); mark(B, e.b); mark(C, e.c); $('pg-err').textContent = r.empty ? '' : (e.a || e.b || e.c || r.error);
      res = null; last = null; out.innerHTML = ''; ver.innerHTML = ''; stp.innerHTML = '<p class="note">Enter A, B and C to see the working.</p>'; $('pg-val').innerHTML = ''; if (!keepView) fit(); drawGraph(); readout(); return;
    }
    mark(A, ''); mark(B, ''); mark(C, ''); $('pg-err').textContent = '';
    res = r; var g = r.graph; if (!keepView) { fit(); trace = null; }
    if (g.kind === 'parabola' && !g.view.drawable) $('pg-err').textContent = 'These values are too large or too small to draw. The exact results below are still correct.';
    drawGraph(); readout();
    if (g.kind !== 'parabola') {
      out.innerHTML = '<div class="res"><div class="big"><div class="qroot">' + esc(g.kind === 'line' ? 'A straight line' : 'No graph') + '</div></div><div class="sub">' + esc(g.kind === 'line' ? 'A = 0, so y = ' + mn(Qd.rs(r.B)) + 'x + ' + mn(Qd.rs(r.C)) + ' is a line, not a parabola. It has no vertex or axis of symmetry. Y-intercept ' + mn(g.yint.text) + ', x-intercept ' + mn(g.xint.text) + '.' : r.label + '. A = B = 0 gives ' + (r.kind === 'none' ? 'y = ' + mn(Qd.rs(r.C)) + ', a horizontal line that never meets the x-axis.' : 'y = 0, which is the x-axis itself.')) + '</div></div>';
      stp.innerHTML = g.kind === 'line' ? '<ol class="steps"><li>' + esc(mn(r.graphSteps[0])) + '</li></ol>' : ''; ver.innerHTML = ''; $('pg-val').innerHTML = ''; last = null; return;
    }
    var rows = [];
    rows.push(row('Vertex (h, k)', g.vertex.text, g.vertex.exact ? '' : '≈ ' + g.vertex.dtext));
    rows.push(row('Vertex x, −B/(2A)', g.vertex.xt, g.vertex.xt !== g.vertex.xd ? (g.vertex.exact ? '= ' : '≈ ') + mn(g.vertex.xd) : ''));
    rows.push(row('Vertex y, −Δ/(4A)', g.vertex.yt, g.vertex.yt !== g.vertex.yd ? (g.vertex.exact ? '= ' : '≈ ') + mn(g.vertex.yd) : ''));
    rows.push(row('Axis of symmetry', g.axis));
    rows.push(row('Opens', g.opens === 'up' ? 'Upward (A > 0)' : 'Downward (A < 0)'));
    rows.push(row(g.extremum === 'minimum' ? 'Minimum value' : 'Maximum value', Qd.mn(Qd.rs(g.extremumValue)), 'at x = ' + g.vertex.xt));
    rows.push(row('Range', g.range));
    rows.push(row('Increasing / decreasing', g.trend));
    rows.push(row('Y-intercept', g.yint.text, g.mirrorSame ? 'on the axis, the vertex' : 'mirror point ' + g.mirror.text));
    if (g.xints.length) g.xints.forEach(function (z, i) { rows.push(row('X-intercept' + (g.xints.length > 1 ? ' ' + (i + 1) : ''), z.text, z.exact !== z.dec ? '≈ ' + z.dec : '')); });
    else rows.push(row('X-intercepts', 'none', 'complex roots ' + g.complexRoots.join(', ')));
    rows.push(row('Discriminant Δ', mn(g.discriminant), r.D.n > 0n ? 'Δ > 0: crosses the x-axis twice' : r.D.n === 0n ? 'Δ = 0: touches the x-axis' : 'Δ < 0: does not meet the x-axis'));
    rows.push(row('Type', r.label));
    rows.push(row('Vertex form', g.vertexForm));
    rows.push(row('Focus', g.focus.text, g.focus.exact ? '' : '≈ ' + g.focus.dtext));
    rows.push(row('Directrix', g.directrix));
    rows.push(row('Latus rectum (width at the focus)', g.latusText));
    var text = QG.summary(r); last = { text: text };
    var big = '<div class="qroot">Vertex ' + esc(g.vertex.text) + '</div><div class="qroot">Opens ' + esc(g.opens === 'up' ? 'upward' : 'downward') + '</div>';
    out.innerHTML = '<div class="res"><div class="big">' + big + '</div><div class="sub">' + esc(g.standard.replace(/-/g, '\u2212') + '   |   ' + g.range + '   |   axis ' + g.axis) + '</div></div>' + table(['Property', 'Value', ''], rows).replace(/<td class="r">/g, '<td class="r">') + actions(text);
    stp.innerHTML = '<ol class="steps">' + r.graphSteps.map(function (t) { return '<li>' + esc(mn(t)) + '</li>'; }).join('') + '</ol>';
    ver.innerHTML = '<p>' + (g.checkOk ? flag('Verified', false) + ' All ' + g.checks.length + ' checks hold in exact arithmetic. The graph is drawn from the same numbers; drawing uses ordinary floating point and changes none of the printed values.' : flag('Check failed', true) + ' A check did not hold. Please report this equation.') + '</p><ul class="vl">' + g.checks.map(function (c) { return '<li>' + (c.ok ? '✓' : '✗') + ' ' + esc(mn(c.name)) + ': <b>' + esc(mn(c.value)) + '</b></li>'; }).join('') + '</ul>';
    $('pg-val').innerHTML = '<h3>Table of values near the vertex</h3>' + table(['x', 'y = f(x)', 'decimal'], g.values.map(function (v) { return '<tr' + (v.isVertex ? ' class="vx"' : '') + '><td>' + esc(mn(v.x)) + '</td><td class="r">' + esc(mn(v.y)) + '</td><td>' + (v.y !== v.yd ? (v.exact ? '= ' : '≈ ') + esc(mn(v.yd)) : '') + '</td></tr>'; }));
    evalX();
  }
  function evalX() {
    var el = $('pg-xo'), X = $('pg-x'); if (!res) { el.textContent = ''; return; }
    var v = QG.evalAt({ a: A.value, b: B.value, c: C.value, x: X.value, dp: +DP.value });
    mark(X, v.error && !v.empty && v.error !== 'Enter A, B and C first.' ? v.error : '');
    if (!v.ok) { el.textContent = v.empty ? '' : v.error; return; }
    el.innerHTML = 'f(' + esc(mn(v.xt)) + ') = <b>' + esc(mn(v.yt)) + '</b>' + (v.yt !== v.yd ? ' ' + (v.exact ? '= ' : '≈ ') + esc(mn(v.yd)) : '');
  }

  /* ---------- sliders ---------- */
  var SL = { a: $('pg-sa'), b: $('pg-sb'), c: $('pg-sc') }, IN = { a: A, b: B, c: C };
  function syncSliders() { ['a', 'b', 'c'].forEach(function (k) { var p = Qd.parseNum(IN[k].value); if (p.v) { var v = Number(p.v.n) / Number(p.v.d); if (isFinite(v)) SL[k].value = String(Math.max(-10, Math.min(10, v))); } }); }
  ['a', 'b', 'c'].forEach(function (k) { SL[k].addEventListener('input', function () { IN[k].value = String(+SL[k].value); render(true); }); });

  /* ---------- events ---------- */
  $('pg').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.z) { var z = b.dataset.z; if (z === 'in') zoom(0.8); else if (z === 'out') zoom(1.25); else if (z === 'fit') { fit(); drawGraph(); } else if (z === 'eq') equalAxes(); else if (z === 'l') pan(-0.15, 0); else if (z === 'r') pan(0.15, 0); else if (z === 'u') pan(0, 0.15); else if (z === 'd') pan(0, -0.15); return; }
    if (b.dataset.ex) { var v = JSON.parse(b.dataset.ex); A.value = v.a; B.value = v.b; C.value = v.c; syncSliders(); render(false); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'save' && last) { var bl = new Blob([last.text + '\n\nCalculated with Elecmetric Quadratic Formula Calculator, Mode 03\n'], { type: 'text/plain' }); dl(bl, 'parabola-vertex.txt'); return; }
    if (b.dataset.act === 'png') { var svg = $('pg-svg').cloneNode(true); svg.setAttribute('xmlns', NS); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', W); svg.setAttribute('height', H); var st = document.createElementNS(NS, 'style'); st.textContent = '.gbg{fill:#fff}.grid{stroke:#d3dfef;stroke-width:1}.axis{stroke:#4b5f86;stroke-width:1.6}.sym{stroke:#b34a00;stroke-width:1.2;stroke-dasharray:6 5}.dir{stroke:#0062de;stroke-width:1.2;stroke-dasharray:3 4}.curve{fill:none;stroke:#043b79;stroke-width:2.4}.pt{fill:#fff;stroke:#043b79;stroke-width:2}.pv{fill:#ff7a00;stroke:#043b79}.plab,.tick{font:12px sans-serif;fill:#0a2347}.tick{fill:#4b5f86}.gfr{fill:none;stroke:#4b5f86}.trl{stroke:#888;stroke-dasharray:3 3}.trp{fill:#ff7a00}'; svg.insertBefore(st, svg.firstChild); dl(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }), 'parabola-graph.svg'); return; }
    if (b.dataset.act === 'reset') { [A, B, C].forEach(function (el) { el.value = el.defaultValue; }); DP.value = '8'; $('pg-x').value = ''; showFocus = false; $('pg-focus').checked = false; syncSliders(); render(false); A.focus(); }
  });
  function dl(bl, name) { var u = URL.createObjectURL(bl), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(u); }, 500); }
  [A, B, C].forEach(function (el) { el.addEventListener('input', function () { syncSliders(); render(false); }); });
  $('pg-x').addEventListener('input', evalX);
  DP.addEventListener('change', function () { render(true); });
  $('pg-focus').addEventListener('change', function () { showFocus = this.checked; drawGraph(); });
  syncSliders(); render(false);
})();
