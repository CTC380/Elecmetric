/* Elecmetric Scientific Calculator: page script. Inlined into calculators/scientific-calculator/index.html by tools/scicalc_page.js.
   Needs window.SciCalc (tools/scicalc_engine.js, inlined before this file). No network, no storage, no dynamic code.
   The history and the worksheet live in memory only and are gone when the page closes. */
(function () {
  'use strict';
  var S = window.SciCalc, doc = document;
  var $ = function (id) { return doc.getElementById(id); };
  var inp = $('sc-in'), live = $('sc-live'), alt = $('sc-alt'), msg = $('sc-err'), note = $('sc-note'), memEl = $('sc-mem');
  if (!S || !inp) return;
  var st = { mode: 'std', angle: 'DEG', fmt: 'auto', dig: 10, unit: '', form: 'rect', ans: { re: 0, im: 0 }, mem: { re: 0, im: 0 }, hist: [], ws: [], just: false, last: null, imp: 'equal', vars: Object.create(null) };

  function opts() {
    var eng = st.mode === 'eng';
    return { angle: st.angle, complex: eng, digits: st.dig, fmt: st.fmt, unit: eng ? st.unit : '', form: st.form, ans: st.ans, mem: st.mem, implicit: st.imp, vars: st.vars };
  }
  function fo(r) { var o = opts(); if (r && r.unitless) o.unit = ''; return o; }
  /* name=expression stores a variable. Only letters, because the engine reads a name as a run of letters. */
  function splitAssign(t) {
    var m = /^\s*([A-Za-z]+)\s*=\s*([^=].*?)\s*$/.exec(t);
    return m ? { name: m[1].toLowerCase(), rhs: m[2] } : null;
  }
  function calc() { var a = splitAssign(inp.value); return S.evaluate(a ? a.rhs : inp.value, opts()); }
  function announce(t) { note.textContent = ''; setTimeout(function () { note.textContent = t; }, 30); }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  /* ---------- drawing the result ---------- */
  function renderPanel(r) {
    var panel = $('sc-cx');
    if (st.mode !== 'eng') { panel.hidden = true; return; }
    panel.hidden = false;
    var body = $('sc-cx-body'), hint = $('sc-cx-hint');
    if (!r || !r.ok || !r.complex) {
      body.hidden = true; hint.hidden = false;
      return;
    }
    var o = opts(), d = S.describe(r.value, o), tb = $('sc-cx-rows'), ol = $('sc-cx-steps');
    hint.hidden = true; body.hidden = false;
    clear(tb); clear(ol);
    d.rows.forEach(function (row) {
      var tr = doc.createElement('tr'), th = doc.createElement('th'), td = doc.createElement('td');
      th.scope = 'row'; th.textContent = row[0]; td.textContent = row[1];
      tr.appendChild(th); tr.appendChild(td); tb.appendChild(tr);
    });
    d.steps.forEach(function (t) { var li = doc.createElement('li'); li.textContent = t; ol.appendChild(li); });
    $('sc-cx-svg').innerHTML = S.phasorSvg(d, o);
  }
  function show(committed) {
    var r = calc(), o = opts();
    st.last = r;
    msg.className = committed && !r.ok && !r.empty ? 'err' : 'note';
    clear(alt);
    if (r.empty) { live.textContent = '0'; msg.textContent = ''; renderPanel(null); return r; }
    if (!r.ok) {
      live.textContent = '\u2026'; msg.textContent = r.error; renderPanel(null);
      return r;
    }
    msg.textContent = '';
    var asg = splitAssign(inp.value);
    if (asg && !committed) msg.textContent = S.reserved(asg.name) ? "'" + asg.name + "' is a built-in name and cannot be a variable." : 'Press Enter to store this as ' + asg.name + '.';
    if (r.volatile && !committed) { live.textContent = '?'; msg.textContent = 'Press = to generate a random number.'; renderPanel(null); return r; }
    var f = S.format(r.value, fo(r));
    live.textContent = f.text;
    var line = '';
    if (!f.real) line = st.form === 'polar' ? f.rect : f.polar;
    else if (f.prefix) line = f.prefix;
    if (line) alt.textContent = line;
    renderPanel(r);
    return r;
  }

  /* ---------- editing the expression ---------- */
  function caret() {
    var v = inp.value, on = doc.activeElement === inp;
    return { s: on ? inp.selectionStart : v.length, e: on ? inp.selectionEnd : v.length };
  }
  function put(v, pos) {
    inp.value = v;
    try { inp.setSelectionRange(pos, pos); } catch (e) { /* not focusable yet */ }
  }
  function focusMaybe() {
    if (window.matchMedia && window.matchMedia('(pointer:fine)').matches) inp.focus();
  }
  function ins(t) {
    var isExp = t === 'E';
    if (st.just) {
      inp.value = /^[\^!%*\/+\-]/.test(t) || isExp ? 'ans' : '';
      st.just = false;
      try { inp.setSelectionRange(inp.value.length, inp.value.length); } catch (e) { /* ignore */ }
    }
    var c = caret(), v = inp.value;
    /* EXP directly after a number is the exponent marker (2E3). After anything else it means times ten to the power, because a bare E would be read as Euler's number. */
    if (isExp && !/[0-9.]/.test(v.charAt(c.s - 1))) t = /^$|[(+\-*\/^,]/.test(v.charAt(c.s - 1)) ? '10^' : '*10^';
    put(v.slice(0, c.s) + t + v.slice(c.e), c.s + t.length);
    focusMaybe();
    show(false);
  }
  function backspace() {
    var c = caret(), v = inp.value;
    if (c.s !== c.e) put(v.slice(0, c.s) + v.slice(c.e), c.s);
    else if (c.s > 0) put(v.slice(0, c.s - 1) + v.slice(c.s), c.s - 1);
    st.just = false;
    focusMaybe(); show(false);
  }
  function wrap(before, after) {
    var v = inp.value.trim();
    if (!v) { ins(before); return; }
    put(before + v + after, (before + v + after).length);
    st.just = false; focusMaybe(); show(false);
  }
  /* True when the opening bracket at the start of t is closed by the last character, so -(1)+(2) is not treated as -( ... ). */
  function wrapsAll(t) {
    var depth = 0;
    for (var i = 0; i < t.length; i++) {
      if (t.charAt(i) === '(') depth++;
      else if (t.charAt(i) === ')') { depth--; if (depth === 0 && i < t.length - 1) return false; }
    }
    return depth === 0;
  }
  function negate() {
    var v = inp.value.trim();
    if (!v) { ins('-'); return; }
    if (/^-\(.*\)$/.test(v) && wrapsAll(v.slice(1))) put(v.slice(2, -1), v.length - 3);
    else put('-(' + v + ')', v.length + 3);
    st.just = false; focusMaybe(); show(false);
  }

  /* ---------- history, memory ---------- */
  function renderHist() {
    var ol = $('sc-hist'), none = $('sc-hist-none');
    clear(ol);
    none.hidden = st.hist.length > 0;
    $('sc-hist-clear').hidden = st.hist.length === 0;
    st.hist.forEach(function (h) {
      var li = doc.createElement('li'), b = doc.createElement('button');
      b.type = 'button'; b.className = 'sc-h';
      b.textContent = h.expr + ' = ' + h.text;
      b.setAttribute('aria-label', 'Use ' + h.expr + ', which equals ' + h.text);
      b.addEventListener('click', function () { st.just = false; put(h.expr, h.expr.length); focusMaybe(); show(false); });
      li.appendChild(b); ol.appendChild(li);
    });
  }
  function renderVars() {
    var box = $('sc-vars'), list = $('sc-vars-list'), names = Object.keys(st.vars).sort();
    if (!box) return;
    box.hidden = names.length === 0;
    clear(list);
    names.forEach(function (n) {
      var b = doc.createElement('button'), t = S.format(st.vars[n], opts()).text;
      b.type = 'button'; b.className = 'chipb'; b.setAttribute('data-ins', n);
      b.textContent = n + ' = ' + t;
      b.setAttribute('aria-label', 'Insert variable ' + n + ', value ' + t);
      list.appendChild(b);
    });
  }
  function memShow() {
    var z = st.mem, on = z.re !== 0 || z.im !== 0;
    memEl.hidden = !on;
    if (on) memEl.textContent = 'M = ' + S.format(z, opts()).text;
  }
  function commit() {
    var asg = splitAssign(inp.value), r = show(true);
    if (r.empty || !r.ok) return;
    if (asg) {
      var fresh = !(asg.name in st.vars);
      if (S.reserved(asg.name)) { msg.className = 'err'; msg.textContent = "'" + asg.name + "' is a built-in name and cannot be a variable."; return; }
      if (fresh && Object.keys(st.vars).length >= 20) { msg.className = 'err'; msg.textContent = 'At most 20 variables. Clear some first.'; return; }
      st.vars[asg.name] = r.value; renderVars();
    }
    var f = S.format(r.value, fo(r));
    st.ans = r.value; st.just = true;
    st.hist.unshift({ expr: inp.value.trim(), text: f.text });
    if (st.hist.length > 40) st.hist.pop();
    renderHist();
    try {
      var h = hashFor();
      if (window.history && history.replaceState) history.replaceState(null, '', h);
    } catch (e) { /* the address bar is optional */ }
    announce(asg ? asg.name + ' stored as ' + f.text : 'Result ' + f.text);
  }
  function memValue() {
    var r = calc();
    if (r.ok) return r.value;
    if (st.last && st.last.ok) return st.last.value;
    return null;
  }

  /* ---------- clipboard ---------- */
  function copyText(t, label) {
    function done() { announce((label || 'Result') + ' copied'); }
    function fallback() {
      var ta = doc.createElement('textarea');
      ta.value = t; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      doc.body.appendChild(ta); ta.select();
      try { doc.execCommand('copy'); done(); } catch (e) { announce('Copy is not available in this browser'); }
      doc.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, fallback);
    else fallback();
  }
  function hashFor() {
    var h = '#e=' + encodeURIComponent(inp.value.trim()) + '&m=' + st.mode + '&a=' + st.angle + '&d=' + st.dig;
    if (st.mode === 'eng') {
      if (st.unit) h += '&u=' + encodeURIComponent(st.unit);
      if (st.form === 'polar') h += '&f=polar';
    }
    if (st.imp === 'tight') h += '&i=tight';
    var vn = Object.keys(st.vars).sort();
    if (vn.length) h += '&v=' + encodeURIComponent(vn.map(function (n) { return n + ':' + st.vars[n].re + ',' + st.vars[n].im; }).join(';'));
    return h;
  }
  function shareUrl() { return location.href.split('#')[0] + hashFor(); }


  /* ---------- worksheet: results kept with their settings and a note, printed or copied. Memory only. ---------- */
  var WS_MAX = 50;
  function settingsText(e) {
    var t = (e.mode === 'eng' ? 'Engineering' : 'Standard') + ' mode, ' + e.angle + ', ' + e.dig + ' significant digits';
    if (e.unit) t += ', unit ' + e.unit;
    if (e.vars) t += ', with ' + e.vars;
    return t;
  }
  function varsUsed(expr) {
    var toks = expr.toLowerCase().match(/[a-z]+/g) || [], seen = Object.create(null), out = [];
    toks.forEach(function (n) {
      if (n in st.vars && !(n in seen)) { seen[n] = 1; out.push(n + ' = ' + S.format(st.vars[n], opts()).text); }
    });
    return out.join(', ');
  }
  function wsEntry() {
    var expr = inp.value.trim(), r = calc();
    if (r.empty || !r.ok) return null;
    var f, h = st.hist[0];
    if (r.volatile) {
      if (!(h && h.expr === expr)) return null;
      f = { text: h.text, real: true };
    } else f = S.format(r.value, fo(r));
    var alt2 = '';
    if (!r.volatile) { if (!f.real) alt2 = st.form === 'polar' ? f.rect : f.polar; else if (f.prefix) alt2 = f.prefix; }
    return { expr: expr, text: f.text, alt: alt2, mode: st.mode, angle: st.angle, dig: st.dig, unit: st.mode === 'eng' && !r.unitless ? st.unit : '', vars: varsUsed(expr), note: '' };
  }
  function renderWs() {
    var ol = $('sc-ws-list'), none = $('sc-ws-none'), body = $('sc-ws-body');
    if (!ol) return;
    clear(ol);
    none.hidden = st.ws.length > 0; body.hidden = st.ws.length === 0;
    st.ws.forEach(function (e, i) {
      var li = doc.createElement('li'), x = doc.createElement('div'), sm = doc.createElement('div'), lab = doc.createElement('label'), ta = doc.createElement('textarea'), rm = doc.createElement('button');
      x.className = 'sc-wsx'; x.textContent = (i + 1) + '. ' + e.expr + ' = ' + e.text + (e.alt ? '  (' + e.alt + ')' : '');
      sm.className = 'sc-wss'; sm.textContent = settingsText(e);
      lab.className = 'sr-only'; lab.setAttribute('for', 'sc-wsn-' + i); lab.textContent = 'Note for entry ' + (i + 1);
      ta.id = 'sc-wsn-' + i; ta.maxLength = 300; ta.rows = 2; ta.value = e.note; ta.placeholder = 'Note (optional)';
      ta.addEventListener('input', function () { e.note = ta.value; });
      rm.type = 'button'; rm.className = 'btn2'; rm.textContent = 'Remove';
      rm.setAttribute('aria-label', 'Remove entry ' + (i + 1) + ': ' + e.expr);
      rm.addEventListener('click', function () { st.ws.splice(st.ws.indexOf(e), 1); renderWs(); announce('Entry removed'); });
      li.appendChild(x); li.appendChild(sm); li.appendChild(lab); li.appendChild(ta); li.appendChild(rm); ol.appendChild(li);
    });
  }
  function wsAdd() {
    var e = wsEntry();
    if (!e) { announce(st.last && st.last.volatile ? 'Press = to confirm the random number, then add it' : 'Nothing to add yet'); return; }
    if (st.ws.length >= WS_MAX) { msg.className = 'err'; msg.textContent = 'The worksheet holds at most ' + WS_MAX + ' entries. Remove some first.'; return; }
    st.ws.push(e); renderWs();
    announce('Added to worksheet, entry ' + st.ws.length);
  }
  function wsTitle() { var t = ($('sc-ws-title').value || '').trim(); return t || 'Calculation worksheet'; }
  function wsText() {
    var by = ($('sc-ws-by').value || '').trim(), lines = [wsTitle()];
    if (by) lines.push('Prepared by ' + by);
    lines.push('');
    st.ws.forEach(function (e, i) {
      lines.push((i + 1) + '. ' + e.expr + ' = ' + e.text + (e.alt ? ' (' + e.alt + ')' : ''));
      lines.push('   ' + settingsText(e));
      if (e.note.trim()) lines.push('   Note: ' + e.note.trim());
    });
    lines.push('');
    lines.push('Calculated with the Elecmetric Scientific Calculator (double-precision arithmetic). Check results independently before using them in a design.');
    return lines.join('\n');
  }
  function wsSheet() {
    var old = $('sc-ws-sheet'), el = doc.createElement('div'), h = doc.createElement('h1'), m = doc.createElement('p'), tb = doc.createElement('table'), hd = doc.createElement('thead'), hr = doc.createElement('tr'), bd = doc.createElement('tbody'), ft = doc.createElement('p'), by = ($('sc-ws-by').value || '').trim(), d = '';
    if (old && old.parentNode) old.parentNode.removeChild(old);
    try { d = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }); } catch (e) { d = ''; }
    el.id = 'sc-ws-sheet';
    h.textContent = wsTitle(); m.className = 'm';
    m.textContent = [by ? 'Prepared by ' + by : '', d].filter(Boolean).join(' \u00b7 ');
    ['No.', 'Expression', 'Result', 'Settings', 'Note'].forEach(function (t) { var th = doc.createElement('th'); th.scope = 'col'; th.textContent = t; hr.appendChild(th); });
    hd.appendChild(hr); tb.appendChild(hd);
    st.ws.forEach(function (e, i) {
      var tr = doc.createElement('tr'), cells = [String(i + 1), e.expr, e.text + (e.alt ? '\n' + e.alt : ''), settingsText(e), e.note.trim()], cls = ['', 'x', 'r', '', ''];
      cells.forEach(function (t, k) { var td = doc.createElement('td'); if (cls[k]) td.className = cls[k]; td.style.whiteSpace = 'pre-line'; td.textContent = t; tr.appendChild(td); });
      bd.appendChild(tr);
    });
    tb.appendChild(bd);
    ft.className = 'f';
    ft.textContent = 'Calculated with the Elecmetric Scientific Calculator (double-precision arithmetic). Check results independently before using them in a design. ' + location.href.split('#')[0];
    el.appendChild(h); el.appendChild(m); el.appendChild(tb); el.appendChild(ft);
    doc.body.appendChild(el);
    return el;
  }
  function wsEndPrint() {
    doc.documentElement.classList.remove('sc-wsp');
    var el = $('sc-ws-sheet');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }
  function wsPrint() {
    if (!st.ws.length) { announce('The worksheet is empty'); return; }
    if (!window.print) { announce('Printing is not available in this browser. Use Copy as text.'); return; }
    wsSheet();
    doc.documentElement.classList.add('sc-wsp');
    var once = function () { window.removeEventListener('afterprint', once); wsEndPrint(); };
    window.addEventListener('afterprint', once);
    try { window.print(); } catch (e) { wsEndPrint(); announce('Printing is not available in this browser. Use Copy as text.'); }
  }

  /* ---------- controls ---------- */
  function press(group, attr, val) {
    var bs = group.querySelectorAll('button');
    for (var i = 0; i < bs.length; i++) bs[i].setAttribute('aria-pressed', bs[i].getAttribute(attr) === val ? 'true' : 'false');
  }
  function setMode(m) {
    st.mode = m;
    press($('sc-modes'), 'data-mode', m);
    var eng = m === 'eng', els = doc.querySelectorAll('[data-eng]');
    for (var i = 0; i < els.length; i++) els[i].hidden = !eng;
    var ex = doc.querySelectorAll('[data-std]');
    for (var k = 0; k < ex.length; k++) ex[k].hidden = eng;
    show(false); memShow(); renderVars();
  }
  function setAngle(a) { st.angle = a; press($('sc-angles'), 'data-angle', a); show(false); }
  function setSel(id, key, num) { $(id).addEventListener('change', function () { st[key] = num ? parseInt(this.value, 10) : this.value; show(false); memShow(); renderVars(); }); }

  $('sc-modes').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) setMode(b.getAttribute('data-mode')); });
  $('sc-angles').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) setAngle(b.getAttribute('data-angle')); });
  setSel('sc-fmt', 'fmt'); setSel('sc-dig', 'dig', true); setSel('sc-unit', 'unit'); setSel('sc-form', 'form'); setSel('sc-imp', 'imp');

  var ACT = {
    ac: function () { st.just = false; put('', 0); focusMaybe(); show(false); },
    del: backspace,
    eq: commit,
    recip: function () { wrap('1/(', ')'); },
    neg: negate,
    mc: function () { st.mem = { re: 0, im: 0 }; memShow(); announce('Memory cleared'); },
    mr: function () { ins('mem'); },
    ms: function () { var v = memValue(); if (v) { st.mem = v; memShow(); announce('Stored in memory'); } },
    mp: function () { var v = memValue(); if (v) { st.mem = { re: st.mem.re + v.re, im: st.mem.im + v.im }; memShow(); announce('Added to memory'); } },
    mm: function () { var v = memValue(); if (v) { st.mem = { re: st.mem.re - v.re, im: st.mem.im - v.im }; memShow(); announce('Subtracted from memory'); } },
    copy: function () { var r = st.last; if (r && r.ok) copyText(S.format(r.value, fo(r)).copy, 'Result'); else announce('Nothing to copy yet'); },
    copyp: function () { var r = st.last; if (r && r.ok) { var f = S.format(r.value, fo(r)); copyText(f.real ? f.copy : f.copyPolar, 'Polar result'); } else announce('Nothing to copy yet'); },
    link: function () { copyText(shareUrl(), 'Link'); },
    varclear: function () { st.vars = Object.create(null); renderVars(); show(false); announce('Variables cleared'); },
    histclear: function () { st.hist = []; renderHist(); announce('History cleared'); },
    wsadd: wsAdd,
    wsprint: wsPrint,
    wscopy: function () { if (st.ws.length) copyText(wsText(), 'Worksheet'); else announce('The worksheet is empty'); },
    wsclear: function () { st.ws = []; renderWs(); announce('Worksheet cleared'); }
  };
  doc.addEventListener('mousedown', function (e) { if (e.target.closest && e.target.closest('.k')) e.preventDefault(); });
  $('sc').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button[data-ins],button[data-act],button[data-ex]') : null;
    if (!b) return;
    if (b.hasAttribute('data-ins')) { ins(b.getAttribute('data-ins')); return; }
    if (b.hasAttribute('data-act')) { var f = ACT[b.getAttribute('data-act')]; if (f) f(); return; }
    if (b.hasAttribute('data-ex')) {
      var m = b.getAttribute('data-m');
      if (m && m !== st.mode) setMode(m);
      if (b.getAttribute('data-u') !== null) { st.unit = b.getAttribute('data-u'); $('sc-unit').value = st.unit; }
      if (b.getAttribute('data-d')) { st.dig = parseInt(b.getAttribute('data-d'), 10); $('sc-dig').value = String(st.dig); }
      st.just = false; put(b.getAttribute('data-ex'), b.getAttribute('data-ex').length); show(false);
      if (window.matchMedia && window.matchMedia('(pointer:fine)').matches) inp.focus();
    }
  });
  inp.addEventListener('input', function () { st.just = false; show(false); });
  inp.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    else if (e.key === 'Escape') { e.preventDefault(); ACT.ac(); }
  });

  /* ---------- start: read a shared link, then draw ---------- */
  function fromHash() {
    var h = (location.hash || '').replace(/^#/, ''), p = {};
    if (h.indexOf('e=') !== 0 && h.indexOf('&e=') < 0) return;
    h.split('&').forEach(function (kv) { var i = kv.indexOf('='); if (i > 0) { try { p[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1)); } catch (e) { /* skip */ } } });
    if (p.a === 'RAD' || p.a === 'GRAD' || p.a === 'DEG') { st.angle = p.a; press($('sc-angles'), 'data-angle', p.a); }
    var dg = parseInt(p.d, 10), sel = $('sc-dig');
    if (dg && sel.querySelector('option[value="' + dg + '"]')) { st.dig = dg; sel.value = String(dg); }
    if (typeof p.u === 'string' && $('sc-unit').querySelector('option[value="' + p.u.replace(/["\\]/g, '') + '"]')) { st.unit = p.u; $('sc-unit').value = p.u; }
    if (p.f === 'polar' || p.f === 'rect') { st.form = p.f; $('sc-form').value = p.f; }
    if (p.i === 'tight' || p.i === 'equal') { st.imp = p.i; $('sc-imp').value = p.i; }
    if (typeof p.v === 'string' && p.v.length <= 2000) {
      var nv = Object.create(null), cnt = 0;
      p.v.split(';').forEach(function (item) {
        var m = /^([a-z]+):([^,]+),([^,]+)$/.exec(item), re, im;
        if (!m || cnt >= 20 || S.reserved(m[1])) return;
        re = Number(m[2]); im = Number(m[3]);
        if (isFinite(re) && isFinite(im)) { nv[m[1]] = { re: re, im: im }; cnt++; }
      });
      st.vars = nv; renderVars();
    }
    if (p.m === 'eng' || p.m === 'std') setMode(p.m);
    if (typeof p.e === 'string' && p.e.length <= 300) { st.just = false; inp.value = p.e; }
    show(false); memShow();
  }
  fromHash();
  window.addEventListener('hashchange', fromHash);
  renderHist(); renderWs(); renderVars(); memShow(); show(false);
  doc.documentElement.setAttribute('data-sc-ready', '1');
}());
