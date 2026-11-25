/* Elecmetric Fraction Calculator: page script for Mode 04 (Mixed Number Calculator). Inlined by tools/fraction_mixed_page.js after the engine. */
(function () {
  var $ = function (id) { return document.getElementById(id); }, FR = Fraction, E = $('ns-e'), err = $('ns-err'), out = $('ns-out'), stp = $('ns-steps'), hist = $('ns-hist'), OP = $('mx-op'), KEY = 'elecmetric.fraction.mixed.history', H = [], last = null, timer = 0;
  var FIELDS = ['mx-aw', 'mx-an', 'mx-ad', 'mx-bw', 'mx-bn', 'mx-bd'].map($), SYM = { '+': '+', '-': '\u2212', '*': '\u00d7', '\u00f7': '\u00f7' }, NAME = { '+': 'Add', '-': 'Subtract', '*': 'Multiply', '\u00f7': 'Divide' };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function disp(s) { return String(s).replace(/-(?=\d)/g, '\u2212'); }
  function note(t) { $('ns-note').textContent = t; }
  function copy(t) { var d = function () { note('Copied'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function cp(t, l) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="' + l + '">Copy</button>'; }
  function loadH() { try { var s = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(s)) H = s.filter(function (x) { return x && typeof x.e === 'string' && typeof x.r === 'string'; }).slice(0, 10); } catch (e) { H = []; } }
  function saveH() { try { localStorage.setItem(KEY, JSON.stringify(H)); } catch (e) {} }
  function drawH() {
    if (!H.length) { hist.innerHTML = '<p class="note">Your last ten calculations appear here. They are kept only in this browser.</p>'; return; }
    hist.innerHTML = '<ul class="fh">' + H.map(function (x, i) { return '<li><button type="button" class="chipb" data-h="' + i + '" aria-label="Use again: ' + esc(x.e) + '">' + esc(disp(x.e)) + ' = <b>' + esc(disp(x.r)) + '</b></button></li>'; }).join('') + '</ul><button type="button" class="btn2" data-act="clearh">Clear history</button>';
  }
  function push(e, r) { if (H.length && H[0].e === e) return; H.unshift({ e: e, r: r }); H = H.slice(0, 10); saveH(); drawH(); }
  function mark(el, bad) { el.classList.toggle('bad', bad); el.setAttribute('aria-invalid', String(bad)); }
  function markFields(p, bad) { ['w', 'n', 'd'].forEach(function (k) { mark($('mx-' + p + k), bad); }); }
  function fail(r, which) {
    err.textContent = r.empty ? '' : r.error; mark(E, !r.empty && !which); markFields('a', which === 'a'); markFields('b', which === 'b');
    out.innerHTML = ''; last = null; stp.innerHTML = '<p class="note">Enter a mixed number, a fraction or two numbers with an operation to see the working.</p>';
  }
  /* the fields write the expression; a failed side returns { err } and leaves the expression alone */
  function side(p) {
    var w = $('mx-' + p + 'w').value.trim(), n = $('mx-' + p + 'n').value.trim(), d = $('mx-' + p + 'd').value.trim();
    if ((n && !d) || (!n && d)) return { err: 'Fill in both the numerator and the denominator, or leave both empty.' };
    if (w && n && /^[+\-\u2212]/.test(n + d)) return { err: 'The minus sign goes on the whole number, as in \u22121 3/4, not on the numerator or the denominator.' };
    return { s: w && n ? w + ' ' + n + '/' + d : w ? w : n ? n + '/' + d : '' };
  }
  function build() {
    var a = side('a'), b = side('b'), op = SYM[OP.value];
    if (a.err) return fail({ error: a.err }, 'a'); if (b.err) return fail({ error: b.err }, 'b');
    if (!a.s && !b.s) { E.value = ''; return render(); }
    if (!a.s) return fail({ error: 'Enter the first number.' }, 'a');
    E.value = b.s ? a.s + ' ' + op + ' ' + b.s : a.s; render();
  }
  function fill(r) {
    function put(p, x) { var f = x && x.w === ''; $('mx-' + p + 'w').value = x && !f ? x.sign + x.w : ''; $('mx-' + p + 'n').value = x ? (f ? x.sign : '') + x.n : ''; $('mx-' + p + 'd').value = x ? x.d : ''; }
    put('a', r.a); put('b', r.b); if (r.op) OP.value = r.op;
  }
  function table(head, rows) { return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + esc(head.join(', ')) + '"><table class="ns-t"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  var FX = '<span class="ns-flag">exact</span>';
  function render() {
    var r = FR.mixedCalc({ expr: E.value });
    if (!r.ok) return fail(r);
    mark(E, false); markFields('a', false); markFields('b', false); err.textContent = '';
    var d = r.decimal, p = r.percent, e = E.value.trim(), conv = r.mode === 'convert', toImp = conv && r.a.kind === 'mixed', imp = r.resultKind === 'improper',
      dflag = d.exact ? FX : '<span class="ns-flag r">repeating' + (d.period ? ', period ' + d.period : '') + '</span>', pflag = p.exact ? FX : '<span class="ns-flag r">repeating</span>';
    var row = function (a, b, c, plain) { return '<tr><td>' + a + '</td><td' + (plain ? '' : ' class="r"') + '>' + esc(disp(b)) + (c ? '<div class="fflag">' + c + '</div>' : '') + '</td></tr>'; };
    var title = conv ? (toImp ? 'Mixed number to improper fraction' : imp ? 'Improper fraction to mixed number' : 'A value in every form') : NAME[r.op] + ' (first ' + SYM[r.op] + ' second)';
    var rows = [row('You entered', e), row('Task', title, '', true)];
    if (r.a.kind === 'mixed') rows.push(row('First number as an improper fraction', r.a.sign + r.a.value.replace(/^-/, ''), FX));
    if (r.b && r.b.kind === 'mixed') rows.push(row('Second number as an improper fraction', r.b.sign + r.b.value.replace(/^-/, ''), FX));
    rows.push(row(imp ? 'Improper fraction (lowest terms)' : 'Fraction (lowest terms)', r.frac, FX));
    rows.push(row('Mixed number', r.mixed.text, r.mixed.isMixed ? '' : (r.isInteger ? 'a whole number' : 'a proper fraction: no whole part')));
    rows.push(row('Decimal', d.text, dflag)); rows.push(row('Percentage', p.text, pflag));
    var big = toImp || !r.mixed.isMixed ? r.frac : r.mixed.text, subParts = [];
    if (toImp) { subParts.push(r.mixed.text); } else if (imp) subParts.push(r.frac);
    subParts.push(d.text); subParts.push(p.text);
    var summary = e + ' = ' + (toImp ? r.frac : r.mixed.text + (imp ? ' = ' + r.frac : '')) + ' = ' + d.text;
    out.innerHTML = '<div class="res"><div class="big">' + esc(disp(big)) + cp(big, 'Copy result') + '</div><div class="sub">' + esc(disp(subParts.join(' \u00b7 '))) + '</div></div>' +
      table(['Form', 'Value'], rows) +
      '<div class="ns-act">' + cp(summary, 'Copy the whole result').replace('>Copy<', '>Copy result line<') + '<button type="button" class="btn2" data-act="print">Print</button></div>' +
      (d.repeating && d.period ? '<p class="note">The decimal repeats forever; the block in brackets is the repeating part. The fraction and the mixed number are the exact value; a rounded decimal is not.</p>' : '');
    last = { e: e, r: toImp ? r.frac : r.mixed.text };
    stp.innerHTML = '<ol class="steps">' + r.steps.map(function (s) { return '<li>' + esc(disp(s)) + '</li>'; }).join('') + '</ol>';
    clearTimeout(timer); timer = setTimeout(function () { if (last) push(last.e, last.r); }, 1500);
  }
  $('ns').addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.h) { var x = H[+b.dataset.h]; if (x) { E.value = x.e; sync(); } return; }
    if (b.dataset.ex) { E.value = JSON.parse(b.dataset.ex).v; sync(); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'clearh') { H = []; saveH(); drawH(); return; }
    if (b.dataset.act === 'swap') { var A = FIELDS.slice(0, 3).map(function (f) { return f.value; }); FIELDS.slice(0, 3).forEach(function (f, i) { f.value = FIELDS[i + 3].value; }); FIELDS.slice(3).forEach(function (f, i) { f.value = A[i]; }); build(); return; }
    if (b.dataset.act === 'reset') { E.value = E.defaultValue; FIELDS.forEach(function (f) { f.value = f.defaultValue; }); Array.prototype.forEach.call(OP.options, function (o) { o.selected = o.defaultSelected; }); render(); FIELDS[0].focus(); }
  });
  /* an expression that reads cleanly fills the fields; one that does not is reported and the fields are left as they were */
  function sync() { var r = FR.mixedCalc({ expr: E.value }); if (r.ok) fill(r); render(); }
  E.addEventListener('input', sync); E.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { clearTimeout(timer); render(); if (last) push(last.e, last.r); } });
  FIELDS.forEach(function (el) { el.addEventListener('input', build); el.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { clearTimeout(timer); build(); if (last) push(last.e, last.r); } }); }); OP.addEventListener('change', build);
  loadH(); drawH(); render();
})();
