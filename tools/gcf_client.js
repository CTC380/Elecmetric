/* Elecmetric GCF Calculator: page script for Mode 01 (Multiple Number GCF). Inlined by tools/gcf_page.js after tools/gcf_engine.js. */
(function () {
  var $ = function (id) { return document.getElementById(id); }, G = window.GCF, IN = $('ns-in'), MS = $('ns-method'), rowsBox = $('ns-rows'), err = $('ns-err'), out = $('ns-out'), stp = $('ns-steps'), ver = $('ns-verify'), hist = $('ns-hist'), KEY = 'elecmetric.gcf.history';
  var H = [], last = null, timer = 0, DEF = '16, 88, 104';
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function mn(s) { return String(s).replace(/(^|[^A-Za-z0-9])-(?=\d)/g, '$1\u2212'); }
  function note(t) { $('ns-note').textContent = t; }
  function copy(t) { var d = function () { note('Copied'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function cp(t, l, txt) { return '<button type="button" class="btn2" data-copy="' + esc(t) + '" aria-label="' + esc(l) + '">' + (txt || 'Copy') + '</button>'; }
  function loadH() { try { var s = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(s)) H = s.filter(function (x) { return x && typeof x.r === 'string' && typeof x.e === 'string'; }).slice(0, 10); } catch (e) { H = []; } }
  function saveH() { try { localStorage.setItem(KEY, JSON.stringify(H)); } catch (e) {} }
  function drawH() {
    if (!H.length) { hist.innerHTML = '<p class="note">Your last ten calculations appear here. They are kept only in this browser.</p>'; return; }
    hist.innerHTML = '<ul class="fh">' + H.map(function (x, i) { return '<li><button type="button" class="chipb" data-h="' + i + '" aria-label="Use again: ' + esc(x.e) + '">' + esc(mn(x.e)) + '</button></li>'; }).join('') + '</ul><button type="button" class="btn2" data-act="clearh">Clear history</button>';
  }
  function push(x) { if (H.length && H[0].r === x.r) return; H.unshift({ r: x.r, e: x.e }); H = H.slice(0, 10); saveH(); drawH(); }
  function table(head, rows) { return '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + esc(head.join(', ')) + '"><table class="ns-t"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function flag(t, hot) { return '<span class="ns-flag' + (hot ? ' r' : '') + '">' + esc(t) + '</span>'; }
  function td(s, c) { return '<td' + (c ? ' class="' + c + '"' : '') + '>' + esc(mn(s)) + '</td>'; }
  function pw(f) { /* [[p, e], ...] as HTML with superscripts */ if (!f.length) return '1'; return f.map(function (x) { return esc(x[0]) + (x[1] > 1 ? '<sup>' + x[1] + '</sup>' : ''); }).join(' \u00d7 '); }
  function pwt(f) { return f.length ? f.map(function (x) { return x[0] + (x[1] > 1 ? '^' + x[1] : ''); }).join(' \u00d7 ') : '1'; }
  function short(s) { s = String(s); return s.length > 30 ? s.slice(0, 14) + '\u2026' + s.slice(-12) : s; }

  /* ---- dynamic number boxes, kept in step with the text box ---- */
  function tok() { return G.tokens(IN.value); }
  function buildRows(cur) {
    cur = (cur || tok()).slice(0, G.MAX_TERMS); while (cur.length < 2) cur.push('');
    rowsBox.innerHTML = cur.map(function (v, i) { return '<div class="nrow"><label class="sr-only" for="ns-n' + i + '">Number ' + (i + 1) + '</label><input id="ns-n' + i + '" class="ns-in nbox" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" data-i="' + i + '" value="' + esc(v) + '" placeholder="n' + (i + 1) + '"><button type="button" class="btn2 nrm" data-rm="' + i + '" aria-label="Remove number ' + (i + 1) + '"' + (cur.length <= 2 ? ' disabled' : '') + '>\u2212</button></div>'; }).join('') + '<button type="button" class="btn2" data-act="add"' + (cur.length >= G.MAX_TERMS ? ' disabled' : '') + '>+ Add number</button>';
  }
  function rowVals() { return Array.prototype.map.call(rowsBox.querySelectorAll('input'), function (i) { return i.value.trim(); }); }
  function syncText() { IN.value = rowVals().filter(function (v) { return v !== ''; }).join(', '); }

  function preview(r) {
    var tk = tok(); $('ns-q').textContent = tk.length ? 'GCF(' + tk.map(short).join(', ') + ')' : 'GCF of two or more whole numbers';
  }
  function fail(r) {
    IN.classList.toggle('bad', !r.empty); IN.setAttribute('aria-invalid', String(!r.empty));
    err.textContent = r.empty ? (r.hint || '') : r.error; err.classList.toggle('ns-hint', !!r.empty);
    out.innerHTML = ''; ver.innerHTML = ''; last = null; stp.innerHTML = '<p class="note">Enter two or more whole numbers to see the working.</p>'; preview(r);
  }
  function euclidHtml(r) {
    var h = '';
    r.euclid.forEach(function (s, k) {
      if (k === 0) return;
      var nth = r.abs[s.idx];
      if (!s.divs.length) { h += '<p class="eh">GCF(' + esc(short(s.before)) + ', ' + esc(short(nth)) + ') = ' + esc(short(s.value)) + (nth === '0' ? ' (the other number is 0)' : ' (GCF(0, n) = |n|)') + '</p>'; return; }
      h += '<p class="eh">GCF(' + esc(short(s.before)) + ', ' + esc(short(nth)) + ')</p>' + table(['Step', 'Division', 'Remainder'], s.divs.map(function (d, j) { return '<tr>' + td(String(j + 1)) + td(d[0] + ' = ' + d[1] + ' \u00d7 ' + d[2] + ' + ' + d[3], 'r') + td(d[3]) + '</tr>'; })) + '<p class="note">The remainder reaches 0 at the last row, so the last divisor, ' + esc(short(s.value)) + ', is the GCF of the pair.</p>';
    });
    if (r.count > 2 || r.zeros) h += '<p class="note">The numbers are taken one at a time: GCF(GCF(a, b), c). The order does not change the answer.</p>';
    return h;
  }
  function primeHtml(r) {
    if (!r.factors) return '<p class="note">' + esc(r.notes[0] || '') + '</p>';
    var head = ['Number', 'Prime factorisation'], rows = r.factors.map(function (f, i) { return '<tr>' + td(r.abs[i]) + '<td class="r">' + (r.abs[i] === '0' ? '0 has no prime factorisation' : (f.length ? pw(f) : '1')) + '</td></tr>'; });
    var h = table(head, rows), cm = r.common;
    if (cm.length) {
      var nzIdx = []; r.abs.forEach(function (v, i) { if (v !== '0') nzIdx.push(i); });
      h += '<h3 class="rh">Powers of each prime</h3>' + table(['Prime'].concat(nzIdx.map(function (i) { return short(r.abs[i]); })).concat(['Lowest power', 'Common?']), cm.map(function (c) { return '<tr>' + td(c.p) + nzIdx.map(function (i) { return td(String(c.exps[i])); }).join('') + td(String(c.min)) + td(c.min > 0 ? 'yes' : 'no') + '</tr>'; }));
    }
    h += '<p class="note">' + (r.gcfFactors.length ? 'Take each common prime to its lowest power and multiply: <b>' + pw(r.gcfFactors) + ' = ' + esc(r.gcf) + '</b>.' : 'No prime divides every non-zero number, so the GCF is 1.') + '</p>';
    return h;
  }
  function render() {
    var r = G.solve({ text: IN.value }), method = MS.value;
    if (!r.ok) return fail(r);
    IN.classList.remove('bad'); IN.setAttribute('aria-invalid', 'false'); err.textContent = ''; err.classList.remove('ns-hint'); preview(r);
    var good = r.status !== 'undefined', rows = r.rows.map(function (x) { return '<tr>' + td(x[0]) + td(x[1], 'r') + td(x[2]) + '</tr>'; });
    var big = '<div class="res"><div class="big"><span class="rbig">' + esc(mn(r.valueText)) + '</span>' + flag(!good ? 'undefined' : r.coprime ? 'relatively prime' : 'found', !good) + (good ? cp(r.gcf, 'Copy the GCF') : '') + '</div><div class="sub">' + esc(mn(r.sentence)) + (good && r.gcfFactorText && r.gcfFactorText !== r.gcf ? '  =  ' + esc(r.gcfFactorText) : '') + '</div></div>';
    out.innerHTML = big + (r.warnings.length ? '<p class="note ns-warn">' + r.warnings.map(esc).join(' ') + '</p>' : '') + table(['Quantity', 'Result', 'Note'], rows) + (r.notes.length ? '<p class="note">' + r.notes.map(esc).join(' ') + '</p>' : '') +
      '<div class="ns-act">' + cp(r.summary, 'Copy the whole result', 'Copy result') + '<button type="button" class="btn2" data-act="save">Save as .txt</button><button type="button" class="btn2" data-act="print">Print</button></div>';
    if (!good) { stp.innerHTML = '<ol class="steps">' + r.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>'; }
    else {
      var pre = '<ol class="steps">' + r.steps.filter(function (s) { return /^(Signs|A zero)/.test(s); }).map(function (s) { return '<li>' + esc(mn(s)) + '</li>'; }).join('') + '</ol>';
      var e = '<h3 class="rh">Euclidean algorithm</h3>' + euclidHtml(r), p = '<h3 class="rh">Prime factorisation</h3>' + primeHtml(r);
      stp.innerHTML = (pre.length > 20 ? pre : '') + (method === 'prime' ? p : method === 'euclid' ? e : e + p);
    }
    ver.innerHTML = '<p>' + (r.verifyOk ? flag('Verified', false) + ' Every check below agrees with the result.' : flag('Check failed', true) + ' A check did not agree. Please report these inputs.') + '</p><ul class="vl">' + r.verify.map(function (v) { return '<li>' + (v[1] ? '\u2713 ' : '\u2717 ') + esc(v[0]) + '</li>'; }).join('') + '</ul>';
    last = { r: IN.value.trim(), e: r.sentence, text: r.summary };
    clearTimeout(timer); timer = setTimeout(function () { if (last) push(last); }, 1500);
  }
  function saveTxt() { if (!last) return; var b = new Blob([last.text + '\n\nCalculated exactly in the browser by Elecmetric GCF Calculator (' + location.href.split('#')[0] + ').\n'], { type: 'text/plain;charset=utf-8' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'gcf-result.txt'; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); }
  function setText(t) { IN.value = t; buildRows(); render(); }
  $('ns').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.h) { var x = H[+b.dataset.h]; if (x) setText(x.r); return; }
    if (b.dataset.ex) { setText(b.dataset.ex); return; }
    if (b.dataset.rm !== undefined) { var v = rowVals(); v.splice(+b.dataset.rm, 1); IN.value = v.filter(function (q) { return q !== ''; }).join(', '); buildRows(v); render(); return; }
    if (b.dataset.act === 'add') { var w = rowVals(); w.push(''); buildRows(w); var ins = rowsBox.querySelectorAll('input'); ins[ins.length - 1].focus(); return; }
    if (b.dataset.act === 'print') { window.print(); return; }
    if (b.dataset.act === 'save') { saveTxt(); return; }
    if (b.dataset.act === 'clearh') { H = []; saveH(); drawH(); return; }
    if (b.dataset.act === 'clearall') { setText(''); IN.focus(); return; }
    if (b.dataset.act === 'reset') { MS.value = 'both'; setText(DEF); IN.focus(); }
  });
  IN.addEventListener('input', function () { buildRows(); render(); });
  IN.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); clearTimeout(timer); render(); if (last) push(last); } });
  rowsBox.addEventListener('input', function (ev) { if (ev.target.classList.contains('nbox')) { syncText(); render(); } });
  MS.addEventListener('change', render);
  loadH(); drawH(); IN.value = DEF; buildRows(); render();
})();
