/* Elecmetric Basic Calculator: page script. Inlined into calculators/basic-calculator/index.html by tools/basiccalc_page.js.
   Needs window.SciCalc (tools/scicalc_engine.js, inlined before this file): the same parser and tests as the Scientific Calculator, in Standard mode.
   No network, no storage, no dynamic code. The history lives in memory only and is gone when the page closes. */
(function () {
  'use strict';
  var S = window.SciCalc, doc = document;
  var $ = function (id) { return doc.getElementById(id); };
  var inp = $('bc-in'), live = $('bc-live'), msg = $('bc-err'), note = $('bc-note'), memEl = $('bc-mem');
  if (!S || !inp) return;
  var st = { ans: { re: 0, im: 0 }, mem: { re: 0, im: 0 }, hist: [], just: false, last: null };
  var OPS = /^[+\-*\/^]/;

  function opts() { return { angle: 'DEG', complex: false, digits: 10, fmt: 'auto', ans: st.ans, mem: st.mem }; }
  function announce(t) { note.textContent = ''; setTimeout(function () { note.textContent = t; }, 30); }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }
  function put(v, caret) { inp.value = v; try { inp.setSelectionRange(caret, caret); } catch (e) { /* not all input types allow it */ } }

  function show(confirm) {
    var t = inp.value;
    if (!t.trim()) { st.last = null; live.textContent = '0'; msg.textContent = ''; msg.className = 'note bc-msg'; return { empty: true }; }
    var r = S.evaluate(t, opts());
    st.last = r;
    if (r.ok) { live.textContent = S.format(r.value, opts()).text; msg.textContent = ''; msg.className = 'note bc-msg'; }
    else if (confirm) { msg.className = 'err bc-msg'; msg.textContent = r.error; }
    else { msg.textContent = ''; msg.className = 'note bc-msg'; }
    return r;
  }
  /* The caret, or the end of the text when the field has not been focused yet. */
  function sel() {
    var n = inp.value.length, f = doc.activeElement === inp && inp.selectionStart != null;
    return f ? [inp.selectionStart, inp.selectionEnd == null ? inp.selectionStart : inp.selectionEnd] : [n, n];
  }
  function ins(s) {
    var v = inp.value, c = sel(), a = c[0], b = c[1];
    if (st.just) { v = OPS.test(s) ? 'ans' : ''; a = b = v.length; st.just = false; }
    put(v.slice(0, a) + s + v.slice(b), a + s.length); show(false); inp.focus();
  }
  function backspace() {
    st.just = false;
    var v = inp.value, c = sel(), a = c[0], b = c[1];
    if (b > a) put(v.slice(0, a) + v.slice(b), a); else if (a > 0) put(v.slice(0, a - 1) + v.slice(a), a - 1);
    show(false); inp.focus();
  }
  function wrap(pre, post) { var v = inp.value.trim(); st.just = false; if (!v) { ins(pre + post); return; } put(pre + v + post, (pre + v + post).length); show(false); inp.focus(); }
  function negate() {
    st.just = false; var v = inp.value.trim();
    if (!v) { ins('-'); return; }
    var nv = /^-\(.*\)$/.test(v) ? v.slice(2, -1) : '-(' + v + ')'; put(nv, nv.length); show(false); inp.focus();
  }
  function renderHist() {
    var ol = $('bc-hist'); clear(ol);
    st.hist.forEach(function (h) {
      var li = doc.createElement('li'), b = doc.createElement('button');
      b.type = 'button'; b.className = 'bc-h'; b.textContent = h.expr + ' = ' + h.text;
      b.setAttribute('aria-label', 'Use ' + h.again + ' again, result ' + h.text);
      b.addEventListener('click', function () { st.just = false; put(h.again, h.again.length); show(false); inp.focus(); });
      li.appendChild(b); ol.appendChild(li);
    });
    $('bc-hist-none').hidden = st.hist.length > 0; $('bc-hist-clear').hidden = st.hist.length === 0;
  }
  function memShow() {
    var on = st.mem.re !== 0;
    memEl.hidden = !on; if (on) memEl.textContent = 'M = ' + S.format(st.mem, opts()).text;
  }
  function memValue() {
    var r = inp.value.trim() ? S.evaluate(inp.value, opts()) : { ok: true, value: st.ans };
    if (!r.ok) { msg.className = 'err bc-msg'; msg.textContent = r.error; return null; }
    return r.value;
  }
  function commit() {
    var r = show(true);
    if (r.empty || !r.ok) return;
    var f = S.format(r.value, opts());
    st.ans = r.value; st.just = true;
    st.hist.unshift({ expr: inp.value.trim(), text: f.text, again: /(^|[^a-z])(ans|mem)([^a-z]|$)/i.test(inp.value) ? f.copy : inp.value.trim() }); if (st.hist.length > 30) st.hist.pop();
    renderHist(); announce('Result ' + f.text);
  }
  function copyText(text, what) {
    var done = function () { announce(what + ' copied'); };
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, function () { announce('Copy was blocked by the browser'); }); return; }
    var ta = doc.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; doc.body.appendChild(ta); ta.select();
    try { doc.execCommand('copy'); done(); } catch (e) { announce('Copy is not available in this browser'); }
    doc.body.removeChild(ta);
  }
  var ACT = {
    ac: function () { st.just = false; put('', 0); show(false); inp.focus(); },
    del: backspace, eq: commit,
    recip: function () { wrap('1/(', ')'); }, sq: function () { wrap('(', ')^2'); }, root: function () { wrap('sqrt(', ')'); }, neg: negate,
    mc: function () { st.mem = { re: 0, im: 0 }; memShow(); announce('Memory cleared'); },
    mr: function () { ins('mem'); },
    mp: function () { var v = memValue(); if (v) { st.mem = { re: st.mem.re + v.re, im: 0 }; memShow(); announce('Added to memory'); } },
    mm: function () { var v = memValue(); if (v) { st.mem = { re: st.mem.re - v.re, im: 0 }; memShow(); announce('Subtracted from memory'); } },
    copy: function () { var r = st.last; if (r && r.ok) copyText(S.format(r.value, opts()).copy, 'Result'); else announce('Nothing to copy yet'); },
    histclear: function () { st.hist = []; renderHist(); announce('History cleared'); }
  };
  doc.addEventListener('mousedown', function (e) { if (e.target.closest && e.target.closest('.k')) e.preventDefault(); });
  $('bc').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button[data-ins],button[data-act],button[data-ex]') : null;
    if (!b) return;
    if (b.hasAttribute('data-ins')) { ins(b.getAttribute('data-ins')); return; }
    if (b.hasAttribute('data-act')) { var f = ACT[b.getAttribute('data-act')]; if (f) f(); return; }
    if (b.hasAttribute('data-ex')) { st.just = false; put(b.getAttribute('data-ex'), b.getAttribute('data-ex').length); show(false); inp.focus(); }
  });
  inp.addEventListener('input', function () { st.just = false; show(false); });
  inp.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    else if (e.key === 'Escape') { e.preventDefault(); ACT.ac(); }
  });
  /* A typed character after a confirmed result continues from the answer (operators) or starts afresh (digits). */
  inp.addEventListener('beforeinput', function (e) {
    if (!st.just || !e.data) return;
    e.preventDefault(); ins(e.data);
  });
  renderHist(); memShow();
  /* The page opens with an example expression and its result. Treat it like a confirmed result: a digit or a typed character starts a new calculation, an operator continues from the result. */
  show(false);
  if (st.last && st.last.ok) { st.ans = st.last.value; st.just = true; }
})();
