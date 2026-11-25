/* Elecmetric Fraction Calculator: page script for Mode 03 (Decimal & Fraction Converter). Inlined by tools/fraction_converter_page.js after the engine. */
(function () {
  var $ = function (id) { return document.getElementById(id); }, FR = Fraction, E = $('ns-e'), PL = $('ns-p'), MD = $('ns-m'), err = $('ns-err'), out = $('ns-out'), stp = $('ns-steps'), dvs = $('ns-div'), hist = $('ns-hist'), KEY = 'elecmetric.fraction.convert.history', H = [], last = null, timer = 0;
  var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  var KIND = { integer: 'whole number', decimal: 'terminating decimal', repeating: 'repeating decimal', fraction: 'fraction', mixed: 'mixed number' };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function disp(s) { return String(s).replace(/\^(\d+)/g, function (m, d) { return d.replace(/\d/g, function (c) { return SUP[c]; }); }).replace(/-(?=\d)/g, '−'); }
  function note(t) { $('ns-note').textContent = t; }
  function copy(t) { var d = function () { note('Copied'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function cp(t, l) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="' + l + '">Copy</button>'; }
  function loadH() { try { var s = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(s)) H = s.filter(function (x) { return x && typeof x.e === 'string' && typeof x.r === 'string'; }).slice(0, 10); } catch (e) { H = []; } }
  function saveH() { try { localStorage.setItem(KEY, JSON.stringify(H)); } catch (e) {} }
  function drawH() {
    if (!H.length) { hist.innerHTML = '<p class="note">Your last ten conversions appear here. They are kept only in this browser.</p>'; return; }
    hist.innerHTML = '<ul class="fh">' + H.map(function (x, i) { return '<li><button type="button" class="chipb" data-h="' + i + '" aria-label="Use again: ' + esc(x.e) + '">' + esc(disp(x.e)) + ' = <b>' + esc(disp(x.r)) + '</b></button></li>'; }).join('') + '</ul><button type="button" class="btn2" data-act="clearh">Clear history</button>';
  }
  function push(e, r) { if (H.length && H[0].e === e) return; H.unshift({ e: e, r: r }); H = H.slice(0, 10); saveH(); drawH(); }
  function mark(el, bad) { el.classList.toggle('bad', bad); el.setAttribute('aria-invalid', String(bad)); }
  function fail(r) {
    err.textContent = r.empty ? '' : r.error; mark(E, !r.empty && !r.field); mark(PL, r.field === 'places'); mark(MD, r.field === 'maxDen');
    out.innerHTML = ''; dvs.innerHTML = ''; last = null; stp.innerHTML = '<p class="note">Enter a decimal, a fraction, a mixed number or a percentage to see the working.</p>';
  }
  function table(head, rows) { return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + esc(head.join(', ')) + '"><table class="ns-t"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  var FX = '<span class="ns-flag">exact</span>';
  function render() {
    var r = FR.convert({ expr: E.value, places: PL.value, maxDen: MD.value });
    if (!r.ok) return fail(r);
    mark(E, false); mark(PL, false); mark(MD, false); err.textContent = '';
    var d = r.decimal, p = r.percent, e = E.value.trim(), dec = r.headline === 'decimal',
      dflag = d.exact ? FX : '<span class="ns-flag r">repeating' + (d.period ? ', period ' + d.period : '') + '</span>', pflag = p.exact ? FX : '<span class="ns-flag r">repeating</span>';
    var row = function (a, b, c, plain) { return '<tr><td>' + a + '</td><td' + (plain ? '' : ' class="r"') + '>' + esc(disp(b)) + (c ? '<div class="fflag">' + c + '</div>' : '') + '</td></tr>'; };
    var rows = [row('You entered', e), row('Read as', r.pct ? 'percentage' : KIND[r.kind], '', true), row('Fraction (lowest terms)', r.frac, FX), row('Mixed number', r.mixed.text, r.mixed.isMixed ? '' : (r.isInteger ? 'a whole number' : 'a proper fraction')), row('Decimal', d.text, dflag), row('Percentage', p.text, pflag)];
    if (!r.rounded.exact) rows.push(row('Decimal rounded to ' + r.places + (r.places === 1 ? ' place' : ' places'), r.rounded.text, '<span class="ns-flag r">rounded, approximate</span>'));
    if (!r.roundedPct.exact) rows.push(row('Percentage rounded to ' + r.places + (r.places === 1 ? ' place' : ' places'), r.roundedPct.text + '%', '<span class="ns-flag r">rounded, approximate</span>'));
    if (r.approx) rows.push(row('Simplest fraction that rounds to this decimal', r.approx.frac, '<span class="ns-flag r">approximate: only if rounded</span>'));
    if (r.limit) rows.push(row('Nearest fraction, denominator up to ' + r.limit.max, r.limit.frac, r.limit.exact ? FX : '<span class="ns-flag r">approximate, ' + (r.limit.diffSign > 0 ? 'below the value by ' : 'above the value by ') + esc(r.limit.diff.replace(/^-/, '')) + '</span>'));
    var big = dec ? d.text : r.frac, subParts = dec ? [r.frac, p.text + (p.exact ? '' : '')] : [];
    if (dec && !r.rounded.exact) subParts.push('≈ ' + r.rounded.text);
    if (!dec) { if (r.mixed.isMixed) subParts.push(r.mixed.text); subParts.push(d.text); subParts.push(p.text); }
    var summary = e + ' = ' + (dec ? d.text + ' = ' + r.frac : r.frac + ' = ' + d.text) + ' = ' + p.text;
    out.innerHTML = '<div class="res"><div class="big">' + esc(disp(big)) + cp(big, 'Copy ' + (dec ? 'decimal' : 'fraction')) + (dec ? dflag : '') + '</div><div class="sub">' + esc(disp(subParts.join(' · '))) + '</div></div>' +
      table(['Form', 'Value'], rows) +
      '<div class="ns-act">' + cp(summary, 'Copy the whole result').replace('>Copy<', '>Copy result<') + '<button type="button" class="btn2" data-act="print">Print</button></div>' +
      (d.repeating && d.period ? '<p class="note">The decimal repeats forever; the block in brackets is the repeating part. The fraction is the exact value; a rounded decimal is not.</p>' : '') +
      (r.approx ? '<p class="note">If you typed ' + esc(e) + ' exactly, its exact fraction is ' + esc(r.frac) + '. If it was rounded from a repeating decimal, the value you meant was probably ' + esc(r.approx.frac) + '.</p>' : '');
    last = { e: e, r: dec ? d.text : r.frac };
    stp.innerHTML = '<ol class="steps">' + r.steps.map(function (s) { return '<li>' + esc(disp(s)) + '</li>'; }).join('') + '</ol>';
    var D = r.division, h = '';
    if (D) {
      var a = r.value.n < 0n ? -r.value.n : r.value.n, dn = r.value.d;
      h = '<h3>Long division</h3><p class="fp">' + esc(a + ' ÷ ' + dn + ' = ' + D.whole + ', remainder ' + (a % dn)) + '</p>' +
        table(['Step', 'Remainder × 10', '÷ ' + dn + ' gives digit', 'New remainder'], D.rows.map(function (x, i) { return '<tr><td>' + (i + 1) + (i === D.cycleAt ? ' <span class="ns-flag r" title="the repeating block starts here" aria-label="the repeating block starts here">\u21bb</span>' : '') + '</td><td class="r">' + x[0] + ' × 10 = ' + x[1] + '</td><td class="r">' + x[2] + '</td><td class="r">' + x[3] + '</td></tr>'; })) +
        '<p class="note">' + (D.done ? 'The remainder reaches 0, so the decimal ends.' : D.cycleAt >= 0 ? 'The remainder ' + D.rows[D.cycleAt][0] + ' (before step ' + (D.cycleAt + 1) + ') comes back after step ' + D.rows.length + ', so the digits from step ' + (D.cycleAt + 1) + ' repeat forever (\u21bb marks where the block starts).' : 'Showing the first ' + D.rows.length + ' digits. The remainders have not repeated yet; the block is longer.') + '</p>';
    }
    dvs.innerHTML = h;
    clearTimeout(timer); timer = setTimeout(function () { if (last) push(last.e, last.r); }, 1500);
  }
  $('ns').addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.h) { var x = H[+b.dataset.h]; if (x) { E.value = x.e; render(); } return; }
    if (b.dataset.ex) { E.value = JSON.parse(b.dataset.ex).v; render(); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'clearh') { H = []; saveH(); drawH(); return; }
    if (b.dataset.act === 'reset') { E.value = E.defaultValue; PL.value = PL.defaultValue; MD.value = MD.defaultValue; render(); E.focus(); }
  });
  [E, PL, MD].forEach(function (el) { el.addEventListener('input', render); el.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { clearTimeout(timer); render(); if (last) push(last.e, last.r); } }); });
  loadH(); drawH(); render();
})();
