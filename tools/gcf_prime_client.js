/* Elecmetric GCF Calculator: page script for Mode 02 (Prime Factorisation GCF). Inlined by tools/gcf_prime_page.js after tools/gcf_engine.js and tools/gcf_prime_engine.js. */
(function () {
  var $ = function (id) { return document.getElementById(id); }, G = window.GCFP, IN = $('ns-in'), MS = $('ns-method'), rowsBox = $('ns-rows'), err = $('ns-err'), out = $('ns-out'), stp = $('ns-steps'), ver = $('ns-verify'), hist = $('ns-hist'), KEY = 'elecmetric.gcf.prime.history';
  var H = [], last = null, timer = 0, DEF = '24, 36';
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function mn(s) { return String(s).replace(/(^|[^A-Za-z0-9])-(?=\d)/g, '$1−'); }
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
  function tdh(h, c) { return '<td' + (c ? ' class="' + c + '"' : '') + '>' + h + '</td>'; }
  function sup(f) { /* [[p, e], ...] with superscripts */ if (!f || !f.length) return '1'; return f.map(function (x) { return esc(x[0]) + (x[1] > 1 ? '<sup>' + x[1] + '</sup>' : ''); }).join(' × '); }
  function short(s) { s = String(s); return s.length > 30 ? s.slice(0, 14) + '…' + s.slice(-12) : s; }

  function tok() { return G.tokens(IN.value); }
  function buildRows(cur) {
    cur = (cur || tok()).slice(0, G.MAX_TERMS); while (cur.length < 2) cur.push('');
    rowsBox.innerHTML = cur.map(function (v, i) { return '<div class="nrow"><label class="sr-only" for="ns-n' + i + '">Number ' + (i + 1) + '</label><input id="ns-n' + i + '" class="ns-in nbox" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" data-i="' + i + '" value="' + esc(v) + '" placeholder="n' + (i + 1) + '"><button type="button" class="btn2 nrm" data-rm="' + i + '" aria-label="Remove number ' + (i + 1) + '"' + (cur.length <= 2 ? ' disabled' : '') + '>−</button></div>'; }).join('') + '<button type="button" class="btn2" data-act="add"' + (cur.length >= G.MAX_TERMS ? ' disabled' : '') + '>+ Add number</button>';
  }
  function rowVals() { return Array.prototype.map.call(rowsBox.querySelectorAll('input'), function (i) { return i.value.trim(); }); }
  function syncText() { IN.value = rowVals().filter(function (v) { return v !== ''; }).join(', '); }
  function preview() { var tk = tok(); $('ns-q').textContent = tk.length ? 'GCF(' + tk.map(short).join(', ') + ') by prime factorisation' : 'GCF of two or more whole numbers by prime factorisation'; }
  function fail(r) {
    IN.classList.toggle('bad', !r.empty); IN.setAttribute('aria-invalid', String(!r.empty));
    err.textContent = r.empty ? (r.hint || '') : r.error; err.classList.toggle('ns-hint', !!r.empty);
    out.innerHTML = ''; ver.innerHTML = ''; last = null; stp.innerHTML = '<p class="note">Enter two or more whole numbers to see the working.</p>'; preview();
  }

  /* ---- the working, in the four steps of the method ---- */
  function workHtml(r, ladders) {
    var h = '', nzIdx = r.nzIdx, full = r.view === 'full';
    var pre = r.steps.filter(function (s) { return /^(Signs|Every number divides 0)/.test(s); });
    if (pre.length) h += '<ol class="steps">' + pre.map(function (s) { return '<li>' + esc(mn(s)) + '</li>'; }).join('') + '</ol>';
    if (r.view === 'none') return h + '<p class="note">' + esc(r.steps[r.steps.length - 1]) + '</p>';
    if (!full) h += '<p class="note ns-warn">' + esc(r.notes[0] || '') + '</p>';
    h += '<h3 class="rh">Step 1. ' + (full ? 'Prime factors of each number' : 'Prime factors of the GCF, found in each number') + '</h3>';
    h += table(full ? ['Number', 'Prime factorisation', 'Written out'] : ['Number', 'Powers of the GCF’s primes, times the rest'], r.numbers.map(function (x) {
      if (x.zero) return '<tr>' + td('0') + td('0 has no prime factorisation (every prime divides 0), so it is set aside', 'r') + (full ? td('') : '') + '</tr>';
      if (full) return '<tr>' + td(x.value) + tdh(x.one ? '1 (no prime factors)' : sup(x.factors), 'r') + td(x.one ? '1' : x.expanded, 'r') + '</tr>';
      return '<tr>' + td(short(x.value)) + td(x.factorText, 'r') + '</tr>';
    }));
    if (full && ladders) {
      h += '<h3 class="rh">Division ladders</h3><p class="note">Divide by the smallest prime that goes in, again and again, until the quotient is 1. The divisors are the prime factors.</p>';
      r.numbers.forEach(function (x) {
        if (x.zero || x.one) return;
        h += x.ladder ? '<p class="eh">' + esc(x.value) + '</p>' + table(['Divide by', 'Quotient'], x.ladder.map(function (d, i) { return '<tr>' + td(d[0]) + td(d[1]) + '</tr>'; })) : '<p class="note">' + esc(x.value) + ' has more than 60 prime factors, so its ladder is not listed.</p>';
      });
    }
    if (r.primes.length) {
      h += '<h3 class="rh">Step 2. Which primes are common, and their powers</h3>';
      h += table(['Prime'].concat(nzIdx.map(function (i) { return short(r.abs[i]); })).concat(['Lowest power', 'In every number?']), r.primes.map(function (c) {
        return '<tr>' + td(c.p) + nzIdx.map(function (i) { var e = c.exps[i]; return '<td' + (c.common && e === c.min ? ' class="lo"' : '') + '>' + e + '</td>'; }).join('') + td(String(c.min)) + td(c.common ? 'yes' : 'no') + '</tr>';
      }));
      h += '<p class="note">A power of 0 means the prime is not a factor of that number. The shaded cell in each common row is the lowest power, and that is the power the GCF keeps.' + (full ? ' A prime that is missing from even one number has lowest power 0 and drops out.' : '') + '</p>';
    }
    h += '<h3 class="rh">Step 3. Multiply the lowest powers</h3>';
    if (r.gcfFactors.length) {
      h += '<p class="eh">GCF = ' + sup(r.gcfFactors) + (r.gcfFactors.some(function (x) { return x[1] > 1; }) && r.gcfFactors.length > 1 ? ' = ' + esc(r.gcfPowers.join(' × ')) : '') + ' = <b>' + esc(r.gcf) + '</b></p>';
      if (r.gcfExpanded && r.gcfExpanded !== r.gcf && r.gcfFactors.some(function (x) { return x[1] > 1; })) h += '<p class="note">Written out: ' + esc(r.gcfExpanded) + ' = ' + esc(r.gcf) + '.</p>';
    } else h += '<p class="note">No prime is in every number, so the only common factor is 1 and <b>GCF = 1</b>.</p>';
    if (full) {
      var rest = r.nzIdx.map(function (i) { return esc(short(r.abs[i])) + ' = ' + esc(r.gcf) + ' × ' + esc(short(r.quotients[i])) + (r.quotientFactors[i] && r.quotientFactors[i] !== r.quotients[i] && r.quotientFactors[i] !== '1' ? ' (' + esc(r.quotientFactors[i]) + ')' : ''); });
      h += '<h3 class="rh">Step 4. Check what is left</h3><ul class="vl">' + rest.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul><p class="note">The leftover parts share no prime, so no bigger common factor is possible.</p>';
      if (r.lcmFactorText && r.lcm !== '0') h += '<h3 class="rh">Same table, highest powers</h3><p class="note">Taking the highest power of every prime in the table instead gives the least common multiple: LCM = ' + esc(r.lcmFactorText) + ' = <b>' + esc(r.lcm) + '</b>.</p>';
    }
    return h;
  }
  function render() {
    var r = G.solve({ text: IN.value }), view = MS.value;
    if (!r.ok) return fail(r);
    IN.classList.remove('bad'); IN.setAttribute('aria-invalid', 'false'); err.textContent = ''; err.classList.remove('ns-hint'); preview();
    var good = r.status !== 'undefined', rows = r.rows.map(function (x) { return '<tr>' + td(x[0]) + td(x[1], 'r') + td(x[2]) + '</tr>'; });
    var big = '<div class="res"><div class="big"><span class="rbig">' + esc(mn(r.valueText)) + '</span>' + flag(!good ? 'undefined' : r.coprime ? 'relatively prime' : r.view === 'full' ? 'by prime factors' : 'found', !good) + (good ? cp(r.gcf, 'Copy the GCF') : '') + '</div><div class="sub">' + esc(mn(r.sentence)) + (good && r.gcfFactorText && r.gcfFactorText !== r.gcf ? '  =  ' : '') + (good && r.gcfFactorText && r.gcfFactorText !== r.gcf ? sup(r.gcfFactors) : '') + '</div></div>';
    out.innerHTML = big + (r.warnings.length ? '<p class="note ns-warn">' + r.warnings.map(esc).join(' ') + '</p>' : '') + table(['Quantity', 'Result', 'Note'], rows) + (r.notes.length && r.view === 'none' ? '<p class="note">' + r.notes.map(esc).join(' ') + '</p>' : '') +
      '<div class="ns-act">' + cp(r.summary, 'Copy the whole result', 'Copy result') + '<button type="button" class="btn2" data-act="save">Save as .txt</button><button type="button" class="btn2" data-act="print">Print</button></div>';
    if (!good) stp.innerHTML = '<ol class="steps">' + r.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>';
    else stp.innerHTML = workHtml(r, view === 'ladder');
    ver.innerHTML = '<p>' + (r.verifyOk ? flag('Verified', false) + ' Every check below agrees with the result.' : flag('Check failed', true) + ' A check did not agree. Please report these inputs.') + '</p><ul class="vl">' + r.verify.map(function (v) { return '<li>' + (v[1] ? '✓ ' : '✗ ') + esc(v[0]) + '</li>'; }).join('') + '</ul>';
    last = { r: IN.value.trim(), e: r.sentence, text: r.summary };
    clearTimeout(timer); timer = setTimeout(function () { if (last) push(last); }, 1500);
  }
  function saveTxt() { if (!last) return; var b = new Blob([last.text + '\n\nCalculated exactly in the browser by Elecmetric GCF Calculator, Prime Factorisation mode (' + location.href.split('#')[0] + ').\n'], { type: 'text/plain;charset=utf-8' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'gcf-prime-factorisation-result.txt'; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); }
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
    if (b.dataset.act === 'reset') { MS.value = 'table'; setText(DEF); IN.focus(); }
  });
  IN.addEventListener('input', function () { buildRows(); render(); });
  IN.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); clearTimeout(timer); render(); if (last) push(last); } });
  rowsBox.addEventListener('input', function (ev) { if (ev.target.classList.contains('nbox')) { syncText(); render(); } });
  MS.addEventListener('change', render);
  loadH(); drawH(); IN.value = DEF; buildRows(); render();
})();
