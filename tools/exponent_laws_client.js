/* Elecmetric Exponent Calculator, Mode 04: page script. Inlined by tools/exponent_laws_page.js after the four engines (ExponentCalc, ExponentFrac, ExponentSolver, ExponentLaws). */
(function () {
  var $ = function (id) { return document.getElementById(id); }, X = ExponentLaws;
  var inp = { a: $('ex-a'), b: $('ex-b'), m: $('ex-m'), n: $('ex-n') }, ruleS = $('ex-rule'), sigS = $('ex-sig'), err = $('ex-err'), out = $('ex-out'), stp = $('ex-steps'), focus = inp.a;
  var DEF = { rule: 'product', a: '2', b: '3', m: '3', n: '4', sig: '6' }, HKEY = 'em-exponent-laws-history', hist = [], last = null, vals = { a: '2', b: '3', m: '3', n: '4' };
  var STL = { holds: 'The rule holds', mismatch: 'The rule does not hold', undefined: 'Undefined' };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function say(t) { $('ex-note').textContent = t; }
  function copy(t) { var d = function () { say('Copied ' + (t.length > 60 ? 'the text' : t)); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function copyBtn(t, label) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="Copy ' + esc(label) + '">Copy</button>'; }
  function rule() { var k = ruleS.value; return X.RULES.filter(function (r) { return r.key === k; })[0] || X.RULES[0]; }
  function state() { return { rule: ruleS.value, a: vals.a, b: vals.b, m: vals.m, n: vals.n, sig: sigS.value }; }
  function setState(d) { ruleS.value = d.rule || 'product'; vals = { a: d.a || '', b: d.b || '', m: d.m || '', n: d.n || '' }; sigS.value = d.sig || '6'; ['a', 'b', 'm', 'n'].forEach(function (k) { inp[k].value = vals[k]; }); render(); }
  function mark(field) { ['a', 'b', 'm', 'n'].forEach(function (k) { var bad = k === field; inp[k].classList.toggle('bad', bad); inp[k].setAttribute('aria-invalid', String(bad)); }); }
  function layout() {
    var r = rule(); $('ex-formula').textContent = r.formula;
    ['a', 'b', 'm', 'n'].forEach(function (k) {
      var show = r.fields.indexOf(k) >= 0; $('ex-g' + k).hidden = !show;
      var lab = $('ex-l' + k); if (lab) lab.textContent = k === 'n' && r.key === 'fraction' ? 'Root index (n), a whole number' : X.LABEL[k];
    });
  }
  function card(label, big, copyText, sub) { return '<div class="dp-c"><span class="ns-l">' + esc(label) + '</span><div class="big">' + esc(big) + (copyText ? copyBtn(copyText, label) : '') + '</div><div class="sub">' + esc(sub || '') + '</div></div>'; }
  function plain(t) { return String(t).replace(/^\u2248\s*/, '').replace(/\u2212/g, '-').replace(/\s+=\s+.*$/, '').replace(/\s+\u2248\s+.*$/, ''); }
  function render() {
    layout();
    var r = X.run({ rule: ruleS.value, a: vals.a, b: vals.b, m: vals.m, n: vals.n, sig: sigS.value });
    last = null; $('ex-dl').hidden = true;
    if (!r.ok) {
      err.textContent = r.empty ? '' : r.error; err.classList.toggle('hint', !!(r.empty || r.partial)); mark(r.empty || r.partial ? null : r.field);
      out.innerHTML = ''; stp.innerHTML = '<p class="note">Enter the values to see both sides of the rule and the working.</p>'; return;
    }
    err.textContent = ''; err.classList.remove('hint'); mark(null);
    var cls = r.status === 'holds' ? 'c-unique' : 'c-none', html = '<p class="ex-cls ' + cls + '"><b>' + esc(STL[r.status]) + '.</b> ' + esc(r.message) + '</p>';
    var cards = card('Left side', r.left.text, r.left.ok ? plain(r.left.text) : '', r.left.expr) + card('Right side', r.right.text, r.right.ok ? plain(r.right.text) : '', r.right.expr);
    if (r.status === 'holds') cards = card('Simplified form', r.simplified, r.simplified, 'by the rule: ' + r.formula) + cards;
    var rows = [['Rule', r.ruleName, r.formula], ['Values', Object.keys(r.inputs).map(function (k) { return k + ' = ' + r.inputs[k]; }).join(', '), ''], ['Left side', r.left.expr, r.left.text], ['Right side', r.right.expr, r.right.text], ['Simplified form', r.simplified, ''], ['Result', STL[r.status], '']];
    var tbl = '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: both sides of the rule"><table class="ns-t"><thead><tr><th scope="col">Item</th><th scope="col">Expression</th><th scope="col">Value</th></tr></thead><tbody>' + rows.map(function (x) { return '<tr><th scope="row">' + esc(x[0]) + '</th><td class="r">' + esc(x[1]) + '</td><td class="r">' + esc(x[2]) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    out.innerHTML = html + '<div class="dp-cards">' + cards + '</div>' + tbl + '<p class="note">Valid when: ' + esc(r.condition) + '.</p>';
    stp.innerHTML = r.steps.map(function (x) { return '<h3>' + esc(x.title) + '</h3><pre class="al" tabindex="0">' + esc(x.text) + '</pre>'; }).join('') + (r.check ? '<h3>Check</h3><pre class="al" tabindex="0">Passed: ' + esc(r.check.detail) + '.</pre>' : '');
    last = { r: r, text: X.headline(r) }; $('ex-dl').hidden = false;
  }
  function download(name, mime, text) { var a = document.createElement('a'), u = URL.createObjectURL(new Blob([text], { type: mime })); a.href = u; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(u); }, 500); say('Downloaded ' + name); }
  function loadHist() { try { var x = JSON.parse(localStorage.getItem(HKEY) || '[]'); hist = Array.isArray(x) ? x.filter(function (h) { return h && typeof h.text === 'string' && h.s && typeof h.s === 'object'; }).slice(0, 10) : []; } catch (e) { hist = []; } }
  function saveHist() { try { localStorage.setItem(HKEY, JSON.stringify(hist.slice(0, 10))); } catch (e) {} }
  function drawHist() {
    $('ex-hist').innerHTML = hist.length ? hist.map(function (h, k) { return '<li><button type="button" class="chipb" data-h="' + k + '" aria-label="Use again: ' + esc(h.text) + '">' + esc(h.text) + '</button></li>'; }).join('') : '<li class="note">No saved calculations yet. Press Save to history or Enter.</li>';
    $('ex-hclear').hidden = !hist.length;
  }
  function keep() { if (!last) return; var t = last.text.length > 90 ? last.text.slice(0, 87) + '\u2026' : last.text; hist = hist.filter(function (h) { return h.text !== t; }); hist.unshift({ text: t, s: state() }); hist = hist.slice(0, 10); saveHist(); drawHist(); say('Saved to history'); }
  function target() { var r = rule(), k = Object.keys(inp).filter(function (x) { return inp[x] === focus; })[0]; return inp[k && r.fields.indexOf(k) >= 0 ? k : r.fields[0]]; }
  function insert(k) {
    var el = target(), key = Object.keys(inp).filter(function (x) { return inp[x] === el; })[0], v = el.value, s = el.selectionStart, e = el.selectionEnd;
    if (typeof s !== 'number') { s = e = v.length; }
    if (k === 'back') { if (s !== e) { el.value = v.slice(0, s) + v.slice(e); e = s; } else if (s > 0) { el.value = v.slice(0, s - 1) + v.slice(s); s = e = s - 1; } }
    else { el.value = v.slice(0, s) + (k === '-' ? '\u2212' : k) + v.slice(e); s = e = s + 1; }
    vals[key] = el.value; el.focus(); try { el.setSelectionRange(s, e); } catch (x) {} render();
  }
  ['a', 'b', 'm', 'n'].forEach(function (k) {
    var el = inp[k];
    el.addEventListener('focus', function () { focus = el; });
    el.addEventListener('input', function () { vals[k] = el.value; render(); });
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); keep(); } });
  });
  ruleS.addEventListener('change', render); ruleS.addEventListener('input', render);
  $('ex').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.key) { insert(b.dataset.key); return; }
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.ex) { setState(JSON.parse(b.dataset.ex)); return; }
    if (b.dataset.h !== undefined) { var h = hist[Number(b.dataset.h)]; if (h) setState(h.s); return; }
    if (b.dataset.act === 'reset') { setState(DEF); return; }
    if (b.dataset.act === 'save') { keep(); return; }
    if (b.dataset.act === 'clear') { vals = { a: '', b: '', m: '', n: '' }; ['a', 'b', 'm', 'n'].forEach(function (k) { inp[k].value = ''; }); render(); var t = target(); if (t) t.focus(); return; }
    if (b.dataset.act === 'hclear') { hist = []; saveHist(); drawHist(); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'copyall' && last) { copy(X.exportTxt(last.r)); return; }
    if (b.dataset.dl && last) { var n = 'exponent-laws'; if (b.dataset.dl === 'txt') download(n + '.txt', 'text/plain', X.exportTxt(last.r)); if (b.dataset.dl === 'csv') download(n + '.csv', 'text/csv', X.exportCsv(last.r)); if (b.dataset.dl === 'json') download(n + '.json', 'application/json', X.exportJson(last.r)); }
  });
  sigS.addEventListener('change', render); sigS.addEventListener('input', render);
  loadHist(); drawHist(); setState(DEF);
})();
