/* Elecmetric Log Calculator: page script for Mode 04 (Logarithm Rules Calculator). Inlined by tools/log_rules_page.js after the Quad, Lg and LogRules engines.
   Three tabs share one result area: simplify an expression, expand a logarithm, check a rule. */
(function () {
  var $ = function (id) { return document.getElementById(id); }, Qd = Quad, Lr = window.LogRules, DP = $('nu-sig'), out = $('nu-out'), stp = $('nu-steps'), ver = $('nu-verify'), hist = $('nu-hist'), eqEl = $('nu-eq'), errEl = $('nu-err');
  var KEY = 'elecmetric.logrules.history', H = [], last = null, timer = 0, tab = 'expr';
  var FIELDS = { expr: ['nu-t'], expand: ['nu-eb', 'nu-ex'], verify: ['nu-rule', 'nu-vb', 'nu-vx', 'nu-vy', 'nu-vn', 'nu-vc'] };
  var NEED = { product: ['b', 'x', 'y'], quotient: ['b', 'x', 'y'], power: ['b', 'x', 'n'], change: ['b', 'x', 'c'], reciprocal: ['b', 'x'], identity: ['b'], zero: ['b'], inverse: ['b', 'x'], power2: ['b', 'n'] };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function mn(s) { return Qd.mn(s); }
  function note(t) { $('nu-note').textContent = t; }
  function copy(t) { var d = function () { note('Copied'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function cp(t, l, txt) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="' + esc(l) + '">' + (txt || 'Copy') + '</button>'; }
  function table(head, rows) { return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + esc(head.join(', ')) + '"><table class="ns-t"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function flag(t, hot) { return '<span class="ns-flag' + (hot ? ' r' : '') + '">' + esc(t) + '</span>'; }
  function mark(id, msg) { var el = $(id); if (!el) return; el.classList.toggle('bad', !!msg); el.setAttribute('aria-invalid', String(!!msg)); }
  function loadH() { try { var s = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(s)) H = s.filter(function (x) { return x && typeof x.m === 'string' && x.f && typeof x.f === 'object' && typeof x.t === 'string'; }).slice(0, 10); } catch (e) { H = []; } }
  function saveH() { try { localStorage.setItem(KEY, JSON.stringify(H)); } catch (e) {} }
  function drawH() {
    if (!H.length) { hist.innerHTML = '<p class="note">Your last ten calculations appear here. They are kept only in this browser.</p>'; return; }
    hist.innerHTML = '<ul class="fh">' + H.map(function (x, i) { return '<li><button type="button" class="chipb" data-h="' + i + '" aria-label="Use again: ' + esc(x.t) + '">' + esc(mn(x.t)) + '</button></li>'; }).join('') + '</ul><button type="button" class="btn2" data-act="clearh">Clear history</button>';
  }
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function push(x) { if (H.length && H[0].m === x.m && same(H[0].f, x.f)) return; H.unshift(x); H = H.slice(0, 10); saveH(); drawH(); }

  function vals() {
    if (tab === 'expr') return { mode: 'expr', text: $('nu-t').value, dp: +DP.value };
    if (tab === 'expand') return { mode: 'expand', b: $('nu-eb').value, x: $('nu-ex').value, dp: +DP.value };
    return { mode: 'verify', rule: $('nu-rule').value, b: $('nu-vb').value, x: $('nu-vx').value, y: $('nu-vy').value, n: $('nu-vn').value, c: $('nu-vc').value, dp: +DP.value };
  }
  function fieldsOf(v) { var o = {}; Object.keys(v).forEach(function (k) { if (k !== 'mode' && k !== 'dp') o[k] = v[k]; }); return o; }
  function setTab(t) {
    tab = t;
    ['expr', 'expand', 'verify'].forEach(function (k) { var on = k === t; $('nu-tab-' + k).setAttribute('aria-selected', String(on)); $('nu-tab-' + k).tabIndex = on ? 0 : -1; $('nu-p-' + k).hidden = !on; });
    drawRuleFields();
  }
  function drawRuleFields() {
    var need = NEED[$('nu-rule').value] || [], r = Lr.RULES[$('nu-rule').value];
    ['b', 'x', 'y', 'n', 'c'].forEach(function (f) { $('nu-vf-' + f).hidden = need.indexOf(f) < 0; });
    $('nu-rule-f').textContent = r ? r.name + ': ' + mn(r.formula) : '';
  }
  function labelFor(v, r) { return v.mode === 'expr' ? 'Simplify: ' + v.text.trim() : v.mode === 'expand' ? 'Expand: log base ' + v.b.trim() + ' of ' + v.x.trim() : (Lr.RULES[v.rule] ? Lr.RULES[v.rule].name : 'Rule') + ': b = ' + v.b.trim() + (NEED[v.rule].indexOf('x') >= 0 ? ', x = ' + v.x.trim() : '') + (NEED[v.rule].indexOf('y') >= 0 ? ', y = ' + v.y.trim() : '') + (NEED[v.rule].indexOf('n') >= 0 ? ', n = ' + v.n.trim() : '') + (NEED[v.rule].indexOf('c') >= 0 ? ', c = ' + v.c.trim() : ''); }

  function fail(r) {
    var e = r.errors || {}, map = tab === 'expr' ? { t: 'nu-t' } : tab === 'expand' ? { b: 'nu-eb', x: 'nu-ex' } : { b: 'nu-vb', x: 'nu-vx', y: 'nu-vy', n: 'nu-vn', c: 'nu-vc' };
    FIELDS[tab].forEach(function (id) { mark(id, ''); }); Object.keys(map).forEach(function (k) { mark(map[k], e[k]); });
    errEl.textContent = r.empty ? '' : (r.error || '');
    eqEl.textContent = ''; out.innerHTML = ''; ver.innerHTML = ''; last = null; stp.innerHTML = '<p class="note">Enter values to see the working.</p>';
  }
  function resultCard(head, sub) { return '<div class="res"><div class="big">' + head + '</div><div class="sub">' + esc(mn(sub)) + '</div></div>'; }
  function actions(r) { return '<div class="ns-act">' + cp(r.summary, 'Copy the whole result', 'Copy result') + '<button type="button" class="btn2" data-act="save">Save as .txt</button><button type="button" class="btn2" data-act="print">Print</button></div>'; }
  function render() {
    var v = vals(), r = Lr.run(v);
    if (!r.ok) return fail(r);
    FIELDS[tab].forEach(function (id) { mark(id, ''); }); errEl.textContent = ''; eqEl.textContent = '';
    var row = function (a, b, c) { return '<tr><td>' + a + '</td><td class="r">' + esc(mn(b)) + '</td><td>' + (c || '') + '</td></tr>'; }, html = '';
    if (r.mode === 'expr') {
      eqEl.textContent = mn(r.readAs);
      var rows = [row('Read as', r.readAs), row('Condensed', r.condensed, r.nTerms > 1 ? flag(r.nTerms + ' terms \u2192 ' + r.nClasses + ' group' + (r.nClasses === 1 ? '' : 's')) : '')];
      if (r.single && r.single !== r.condensed) rows.push(row('As one logarithm', r.single));
      rows.push(row('Value', r.exact !== null ? r.yText : '\u2248 ' + r.valueText, flag(r.status === 'rational' ? 'exact' : r.status === 'irrational' ? 'irrational, rounded to ' + r.dp + ' places' : 'exactness not decided', r.status !== 'rational')));
      if (r.exact !== null && /\//.test(r.exact)) rows.push(row('Exact fraction', r.exact));
      if (r.classes.length > 1) r.classes.forEach(function (c) { rows.push(row('Group, base ' + c.base, 'log of ' + c.argument + ' = ' + c.value, flag(c.rational ? 'rational' : 'irrational', !c.rational))); });
      html = resultCard('<div class="qroot">' + esc(mn(r.condensed)) + '</div><div class="qroot">' + esc(mn(r.exact !== null ? '= ' + r.yText : '\u2248 ' + r.valueText)) + '</div>', r.label) + table(['Quantity', 'Result', ''], rows);
    } else if (r.mode === 'expand') {
      eqEl.textContent = mn(r.lead);
      var tr = r.typedItems.map(function (t) { return row(esc(mn(t.coef)) + ' \u00d7', t.term + ' = ' + t.value, flag(t.exact ? 'exact' : 'irrational', !t.exact)); }), pr = r.primeItems.map(function (t) { return row(esc(mn(t.coef)) + ' \u00d7', t.term + ' = ' + t.value, flag(t.exact ? 'exact' : 'irrational', !t.exact)); });
      html = resultCard('<div class="qroot">' + esc(mn(r.nothing ? r.primes : r.typed)) + '</div>' + (r.nothing ? '' : '<div class="qroot">= ' + esc(mn(r.primes)) + '</div>'), (r.nothing ? 'To primes' : 'As typed, then to primes') + ' \u00b7 value ' + (r.exact !== null ? r.headline : '\u2248 ' + r.valueText)) +
        (r.nothing ? '' : '<h3>Expansion as typed</h3>' + table(['Coefficient', 'Term and value', ''], tr)) + '<h3>Expansion to primes</h3>' + table(['Coefficient', 'Term and value', ''], pr);
    } else {
      eqEl.textContent = mn(r.formula);
      var rows3 = [row('Rule', r.ruleName + ': ' + r.formula), row('Left side', r.lhsText + ' = ' + r.lhsValue), row('Right side', r.rhsText + ' = ' + r.rhsValue), row('Difference', r.diffText, flag(r.holds ? 'holds' : 'differs', !r.holds))];
      html = resultCard('<div class="qroot">' + esc(mn(r.lhsText)) + '</div><div class="qroot">' + (r.rule === 'identity' || r.rule === 'zero' || r.rule === 'power2' ? '= ' : '= ') + esc(mn(r.rhsText)) + '</div>', r.label) + table(['Quantity', 'Result', ''], rows3);
    }
    out.innerHTML = html + actions(r);
    stp.innerHTML = '<ol class="steps">' + r.steps.map(function (s) { return '<li>' + esc(mn(s)) + '</li>'; }).join('') + '</ol>';
    ver.innerHTML = r.verify.length ? '<p>' + (r.verifyOk ? flag('Verified', false) + ' Every check below agrees with the result.' : flag('Check failed', true) + ' A check did not agree. Please report these inputs.') + '</p><ul class="vl">' + r.verify.map(function (x) { return '<li>' + esc(mn(x.text)) + ' ' + (x.ok ? '\u2713' : '\u2717') + '</li>'; }).join('') + '</ul>' : '<p class="note">Nothing to verify.</p>';
    last = { m: tab, f: fieldsOf(v), t: labelFor(v, r) + ' \u2192 ' + (r.mode === 'verify' ? (r.holds ? 'holds' : 'differs') : r.exact !== null ? r.exact : '\u2248 ' + r.valueText), text: r.summary };
    clearTimeout(timer); timer = setTimeout(function () { if (last) push(last); }, 1500);
  }
  function setAll(m, f) {
    setTab(m);
    if (m === 'expr') $('nu-t').value = f.text || '';
    else if (m === 'expand') { $('nu-eb').value = f.b || ''; $('nu-ex').value = f.x || ''; }
    else { $('nu-rule').value = f.rule || 'product'; ['b', 'x', 'y', 'n', 'c'].forEach(function (k) { $('nu-v' + k).value = f[k] || ''; }); drawRuleFields(); }
    render();
  }
  function ins(t) {
    var el = $('nu-t'), a = el.selectionStart === null ? el.value.length : el.selectionStart, b = el.selectionEnd === null ? a : el.selectionEnd;
    el.value = el.value.slice(0, a) + t + el.value.slice(b); var p = a + (t === '()' ? 1 : t.length); el.focus(); try { el.setSelectionRange(p, p); } catch (e) {} render();
  }
  $('nu').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.tab) { setTab(b.dataset.tab); render(); return; }
    if (b.dataset.h) { var x = H[+b.dataset.h]; if (x) setAll(x.m, x.f); return; }
    if (b.dataset.ex) { var ex = JSON.parse(b.dataset.ex); setAll(ex.m, ex.f); return; }
    if (b.dataset.ins) { ins(b.dataset.ins); return; }
    if (b.dataset.base) { $('nu-eb').value = b.dataset.base; render(); $('nu-ex').focus(); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'save' && last) { var bl = new Blob([last.text + '\n\nCalculated with Elecmetric Log Calculator, Mode 04 (Logarithm Rules)\n'], { type: 'text/plain' }), u = URL.createObjectURL(bl), a = document.createElement('a'); a.href = u; a.download = 'log-rules-result.txt'; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(u); }, 500); return; }
    if (b.dataset.act === 'clearh') { H = []; saveH(); drawH(); return; }
    if (b.dataset.act === 'reset') { FIELDS[tab].forEach(function (id) { var el = $(id); if (el) el.value = el.defaultValue; if (el && el.tagName === 'SELECT') el.selectedIndex = 0; }); DP.value = '8'; drawRuleFields(); render(); }
  });
  /* arrow keys move between the tabs */
  $('nu-tabs').addEventListener('keydown', function (ev) {
    var order = ['expr', 'expand', 'verify'], i = order.indexOf(tab);
    if (ev.key === 'ArrowRight') i = (i + 1) % 3; else if (ev.key === 'ArrowLeft') i = (i + 2) % 3; else return;
    ev.preventDefault(); setTab(order[i]); $('nu-tab-' + order[i]).focus(); render();
  });
  FIELDS.expr.concat(FIELDS.expand, FIELDS.verify).forEach(function (id) {
    var el = $(id); if (!el) return;
    el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', function () { if (id === 'nu-rule') drawRuleFields(); render(); });
    el.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { clearTimeout(timer); render(); if (last) push(last); } });
  });
  DP.addEventListener('change', render);
  loadH(); drawH(); setTab('expr'); render();
})();
