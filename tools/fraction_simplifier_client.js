/* Elecmetric Fraction Calculator: page script for Mode 02 (Fraction Simplifier). Inlined by tools/fraction_simplifier_page.js after the engine. */
(function () {
  var $ = function (id) { return document.getElementById(id); }, FR = Fraction, N = $('ns-n'), D = $('ns-d'), E = $('ns-e'), err = $('ns-err'), out = $('ns-out'), stp = $('ns-steps'), eu = $('ns-euclid'), hist = $('ns-hist'), KEY = 'elecmetric.fraction.simplify.history', H = [], last = null, timer = 0, src = 'f';
  var SUP = { '0': '\u2070', '1': '\u00b9', '2': '\u00b2', '3': '\u00b3', '4': '\u2074', '5': '\u2075', '6': '\u2076', '7': '\u2077', '8': '\u2078', '9': '\u2079' };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function disp(s) { return String(s).replace(/\^(\d+)/g, function (m, d) { return d.replace(/\d/g, function (c) { return SUP[c]; }); }).replace(/-(?=\d)/g, '\u2212'); }
  function note(t) { $('ns-note').textContent = t; }
  function copy(t) { var d = function () { note('Copied'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function cp(t, l) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="' + l + '">Copy</button>'; }
  function loadH() { try { var s = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(s)) H = s.filter(function (x) { return x && typeof x.e === 'string' && typeof x.r === 'string'; }).slice(0, 10); } catch (e) { H = []; } }
  function saveH() { try { localStorage.setItem(KEY, JSON.stringify(H)); } catch (e) {} }
  function drawH() {
    if (!H.length) { hist.innerHTML = '<p class="note">Your last ten simplifications appear here. They are kept only in this browser.</p>'; return; }
    hist.innerHTML = '<ul class="fh">' + H.map(function (x, i) { return '<li><button type="button" class="chipb" data-h="' + i + '" aria-label="Use again: ' + esc(x.e) + '">' + esc(disp(x.e)) + ' = <b>' + esc(disp(x.r)) + '</b></button></li>'; }).join('') + '</ul><button type="button" class="btn2" data-act="clearh">Clear history</button>';
  }
  function push(e, r) { if (H.length && H[0].e === e) return; H.unshift({ e: e, r: r }); H = H.slice(0, 10); saveH(); drawH(); }
  function mark(el, bad) { el.classList.toggle('bad', bad); el.setAttribute('aria-invalid', String(bad)); }
  function fail(r) { err.textContent = r.empty ? '' : r.error; var b = !r.empty; if (src === 'e') mark(E, b); else { mark(N, b); mark(D, b); } out.innerHTML = ''; eu.innerHTML = ''; last = null; stp.innerHTML = '<p class="note">Enter a numerator and a denominator to see the working.</p>'; }
  function entered() { return src === 'e' ? E.value.trim() : (N.value.trim() + '/' + D.value.trim()); }
  function table(head, rows, cls) { return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + esc(head.join(', ')) + '"><table class="ns-t"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function render() {
    var r = src === 'e' ? FR.simplify({ expr: E.value }) : FR.simplify({ num: N.value, den: D.value });
    if (src === 'f' && !N.value.trim() && !D.value.trim()) r = { ok: false, empty: true, error: '' };
    if (!r.ok) return fail(r);
    mark(E, false); mark(N, false); mark(D, false); err.textContent = '';
    var d = r.decimal, p = r.percent, e = entered(), flag = r.changed ? '<span class="ns-flag r">reduced: divided by ' + esc(String(r.g)) + '</span>' : '<span class="ns-flag">already in lowest terms</span>',
      dflag = d.exact ? '<span class="ns-flag">exact</span>' : '<span class="ns-flag r">repeating' + (d.period ? ', period ' + d.period : '') + '</span>', pflag = p.exact ? '<span class="ns-flag">exact</span>' : '<span class="ns-flag r">repeating</span>';
    var row = function (a, b, c) { return '<tr><td>' + a + '</td><td class="r">' + esc(disp(b)) + '</td><td>' + (c || '') + '</td></tr>'; };
    var rows = [row('You entered', e), row('Greatest common divisor (GCD)', String(r.g), r.g === 1n ? '' : 'the largest number that divides both'), row('Simplified numerator', String(r.num)), row('Simplified denominator', String(r.den)), row('Simplified fraction', r.frac, flag), row('Mixed number', r.mixed.text, r.mixed.isMixed ? '' : (r.den === 1n ? 'a whole number' : 'a proper fraction')), row('Decimal', d.text, dflag), row('Percentage', p.text, pflag)];
    out.innerHTML = '<div class="res"><div class="big">' + esc(disp(r.frac)) + cp(r.frac, 'Copy fraction') + '</div><div class="sub">' + (r.changed ? esc(disp(e)) + ' = ' + esc(disp(r.frac)) + ' \u00b7 ' : '') + (r.mixed.isMixed ? esc(disp(r.mixed.text)) + ' \u00b7 ' : '') + esc(disp(d.text)) + '</div></div>' +
      table(['Parameter', 'Result', ''], rows) +
      '<div class="ns-act">' + cp(e + ' = ' + r.frac + ' (gcd ' + r.g + ')', 'Copy the whole result').replace('>Copy<', '>Copy result<') + '<button type="button" class="btn2" data-act="print">Print</button></div>' +
      (d.repeating && d.period ? '<p class="note">The decimal repeats forever; the block in brackets is the repeating part. The fraction is the exact value; a rounded decimal is not.</p>' : '');
    last = { e: e, r: r.frac };
    var st = r.steps.slice(); st.push('Result in lowest terms: ' + r.frac + (r.mixed.isMixed ? ' = ' + r.mixed.text : '') + '.');
    stp.innerHTML = '<ol class="steps">' + st.map(function (s) { return '<li>' + esc(disp(s)) + '</li>'; }).join('') + '</ol>';
    var fx = '';
    if (r.factors) { var fs = function (f) { return f.length ? f.map(function (x) { return x[1] > 1 ? x[0] + '^' + x[1] : String(x[0]); }).join(' \u00d7 ') : '1'; };
      fx = '<h3>Prime factors</h3><p class="fp">' + esc(disp(r.factors.n + ' = ' + fs(r.factors.fa))) + '<br>' + esc(disp(r.factors.d + ' = ' + fs(r.factors.fb))) + '<br>Common: ' + esc(disp(r.factors.common.length ? fs(r.factors.common) + ' = ' + r.g : '1')) + '</p>'; }
    var er = r.euclid, shown = er.slice(0, 40);
    eu.innerHTML = fx + (er.length ? '<h3>Euclidean algorithm</h3>' + table(['Dividend', '= Divisor \u00d7 Quotient', '+ Remainder'], shown.map(function (x) { return '<tr><td class="r">' + x[0] + '</td><td class="r">' + x[1] + ' \u00d7 ' + x[2] + '</td><td class="r">' + x[3] + '</td></tr>'; })) + (er.length > 40 ? '<p class="note">Showing the first 40 of ' + er.length + ' divisions.</p>' : '') : '');
    clearTimeout(timer); timer = setTimeout(function () { if (last) push(last.e, last.r); }, 1500);
  }
  function fromFields() { src = 'f'; var n = N.value.trim(), d = D.value.trim(); E.value = (n || d) ? n + '/' + d : ''; render(); }
  function fromExpr() { src = 'e'; var m = /^\s*([-+\u2212]?[\d.]+)\s*\/\s*([-+\u2212]?[\d.]+)\s*$/.exec(E.value); if (m) { N.value = m[1].replace('\u2212', '-'); D.value = m[2].replace('\u2212', '-'); } else { N.value = ''; D.value = ''; } render(); }
  $('ns').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.h) { var x = H[+b.dataset.h]; if (x) { E.value = x.e; fromExpr(); } return; }
    if (b.dataset.ex) { E.value = JSON.parse(b.dataset.ex).v; fromExpr(); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'clearh') { H = []; saveH(); drawH(); return; }
    if (b.dataset.act === 'reset') { N.value = N.defaultValue; D.value = D.defaultValue; fromFields(); N.focus(); }
  });
  N.addEventListener('input', fromFields); D.addEventListener('input', fromFields); E.addEventListener('input', fromExpr);
  [N, D, E].forEach(function (el) { el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { clearTimeout(timer); render(); if (last) push(last.e, last.r); } }); });
  loadH(); drawH(); fromFields();
})();
