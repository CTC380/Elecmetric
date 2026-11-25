/* Elecmetric Fraction Calculator: page script for Mode 01 (Fraction Arithmetic). Inlined by tools/fraction_page.js after the engine. */
(function () {
  var $ = function (id) { return document.getElementById(id); }, FR = Fraction, V = $('nu-v'), err = $('nu-err'), out = $('nu-out'), stp = $('nu-steps'), hist = $('nu-hist'), KEY = 'elecmetric.fraction.history', H = [], last = null, timer = 0;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function disp(s) { return String(s).replace(/-/g, '\u2212'); }
  function note(t) { $('nu-note').textContent = t; }
  function copy(t) { var d = function () { note('Copied'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function cp(t, l) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="' + l + '">Copy</button>'; }
  function loadH() { try { var s = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(s)) H = s.filter(function (x) { return x && typeof x.e === 'string' && typeof x.r === 'string'; }).slice(0, 10); } catch (e) { H = []; } }
  function saveH() { try { localStorage.setItem(KEY, JSON.stringify(H)); } catch (e) {} }
  function drawH() {
    if (!H.length) { hist.innerHTML = '<p class="note">Your last ten calculations appear here. They are kept only in this browser.</p>'; return; }
    hist.innerHTML = '<ul class="fh">' + H.map(function (x, i) { return '<li><button type="button" class="chipb" data-h="' + i + '" aria-label="Use again: ' + esc(x.e) + '">' + esc(disp(x.e)) + ' = <b>' + esc(disp(x.r)) + '</b></button></li>'; }).join('') + '</ul><button type="button" class="btn2" data-act="clearh">Clear history</button>';
  }
  function push(e, r) { if (H.length && H[0].e === e) return; H.unshift({ e: e, r: r }); H = H.slice(0, 10); saveH(); drawH(); }
  function fail(r) { err.textContent = r.empty ? '' : r.error; V.classList.toggle('bad', !r.empty); V.setAttribute('aria-invalid', String(!r.empty)); out.innerHTML = ''; last = null; stp.innerHTML = '<p class="note">Enter a valid expression to see the working.</p>'; }
  function dtext(d) { return d.repeating && d.period ? d.text : d.text; }
  function render() {
    var r = FR.calc({ expr: V.value }); if (!r.ok) return fail(r);
    var d = r.decimal, flag = d.exact ? '<span class="ns-flag">exact</span>' : (d.period ? '<span class="ns-flag r">repeating, period ' + d.period + '</span>' : '<span class="ns-flag r">repeating, long period (shown rounded)</span>'),
      p = r.percent, pflag = p.exact ? '<span class="ns-flag">exact</span>' : '<span class="ns-flag r">repeating</span>',
      rows = [['Fraction (lowest terms)', r.frac, ''], ['Mixed number', r.mixed.text, r.mixed.isMixed ? '' : (r.isInteger ? 'a whole number' : 'a proper fraction')], ['Decimal', d.text, flag], ['Percentage', p.text, pflag]];
    var h = '<div class="res"><div class="big">' + esc(disp(r.frac)) + cp(r.frac, 'Copy fraction') + '</div><div class="sub">' + (r.mixed.isMixed ? esc(disp(r.mixed.text)) + ' \u00b7 ' : '') + esc(disp(d.text)) + ' \u00b7 ' + esc(disp(p.text)) + '</div></div>' +
      '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: result in each form"><table class="ns-t"><thead><tr><th>Form</th><th>Value</th><th></th></tr></thead><tbody>' + rows.map(function (x) { return '<tr><td>' + x[0] + '</td><td class="r">' + esc(disp(x[1])) + '</td><td>' + x[2] + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<div class="ns-act">' + cp(V.value.trim() + ' = ' + r.frac + (r.mixed.isMixed ? ' = ' + r.mixed.text : '') + ' = ' + d.text, 'Copy the whole calculation').replace('>Copy<', '>Copy calculation<') + '<button type="button" class="btn2" data-act="print">Print</button></div>' +
      (d.repeating && d.period ? '<p class="note">The decimal repeats forever; the block in brackets is the repeating part (about ' + esc(d.rounded) + '). The fraction is the exact value; a rounded decimal is not.</p>' : '') + (d.longPeriod ? '<p class="note">The repeating block is longer than 5,000 digits, so the decimal is cut off. The fraction is still exact.</p>' : '');
    err.textContent = ''; V.classList.remove('bad'); V.setAttribute('aria-invalid', 'false'); out.innerHTML = h; last = { e: V.value.trim(), r: r.frac };
    var steps = r.steps.slice(); if (!steps.length) steps.push(r.single ? 'A single value: nothing to calculate. It is shown in lowest terms, as a mixed number, a decimal and a percentage.' : 'Calculated exactly.');
    steps.push('Result in lowest terms: ' + r.frac + (r.mixed.isMixed ? ' = ' + r.mixed.text : '') + '.');
    stp.innerHTML = '<ol class="steps">' + steps.map(function (s) { return '<li>' + esc(disp(s)) + '</li>'; }).join('') + '</ol>';
    clearTimeout(timer); timer = setTimeout(function () { if (last) push(last.e, last.r); }, 1500);
  }
  function side(k) {
    var w = $('nu-w' + k).value.trim(), n = $('nu-n' + k).value.trim(), d = $('nu-d' + k).value.trim(), s = '';
    if (w && (n || d)) s = w + ' ' + (n || '') + '/' + (d || ''); else if (w) s = w; else if (n || d) s = (n || '') + '/' + (d || '');
    return s;
  }
  function build() {
    var a = side(1), b = side(2), op = $('nu-op').value; if (!a && !b) return;
    if (!b) V.value = a; else if (!a) V.value = b; else V.value = a + ' ' + op + ' ' + (/^[-\u2212]/.test(b) ? '(' + b + ')' : b);
    render();
  }
  function insert(t) {
    var s = V.selectionStart, e = V.selectionEnd; if (typeof s !== 'number') { V.value += t; } else { V.value = V.value.slice(0, s) + t + V.value.slice(e); V.selectionStart = V.selectionEnd = s + t.length; }
    V.focus(); render();
  }
  $('nu').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.k) { insert(b.dataset.k); return; }
    if (b.dataset.h) { var x = H[+b.dataset.h]; if (x) { V.value = x.e; render(); } return; }
    if (b.dataset.ex) { var d = JSON.parse(b.dataset.ex); V.value = d.v; render(); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'clearh') { H = []; saveH(); drawH(); return; }
    if (b.dataset.act === 'reset') { V.value = V.defaultValue; Array.prototype.forEach.call($('nu').querySelectorAll('.fb'), function (el) { el.value = ''; }); $('nu-op').selectedIndex = 0; render(); V.focus(); }
  });
  V.addEventListener('input', render); V.addEventListener('keydown', function (e) { if (e.key === 'Enter') { clearTimeout(timer); render(); if (last) push(last.e, last.r); } });
  Array.prototype.forEach.call($('nu').querySelectorAll('.fb,#nu-op'), function (el) { el.addEventListener('input', build); el.addEventListener('change', build); });
  loadH(); drawH(); render();
})();
