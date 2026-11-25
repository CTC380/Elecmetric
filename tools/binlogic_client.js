/* Elecmetric Binary Arithmetic & Logic Calculator: page script (Mode 03). Inlined by tools/binlogic_page.js after the engine. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var A = $('bl-a'), Bf = $('bl-b'), op = $('bl-op'), wid = $('bl-w'), kind = $('bl-kind'), sg = $('bl-sg');
  var DEF = { a: '10101010', b: '00001111', op: 'and', w: '8', kind: 'bin', sg: 'u' };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function g4(b) { var o = [], i; for (i = b.length; i > 0; i -= 4) o.unshift(b.slice(Math.max(0, i - 4), i)); return o.join(' '); }
  function copy(t) { var d = function () { $('bl-note').textContent = 'Copied ' + t; }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function fields() {
    var o = op.value, unary = o === 'not', shift = o.indexOf('sh') === 0;
    $('bl-bf').hidden = unary;
    $('bl-bl').textContent = shift ? 'Shift count n (decimal)' : 'B';
    Bf.setAttribute('inputmode', shift ? 'numeric' : 'text');
  }
  function flag(label, v, why) { return '<span class="fl ' + (v === true ? 'on' : '') + '"><b>' + esc(label) + '</b>: ' + (v === null ? 'n/a' : (v ? 'yes' : 'no')) + (why ? '<small>' + esc(why) + '</small>' : '') + '</span>'; }
  function render() {
    fields();
    var w = Number(wid.value), signed = sg.value === 's', o = op.value;
    var r = BinLogic.run({ op: o, a: A.value, b: Bf.value, kind: kind.value, w: w, signed: signed });
    var err = $('bl-err'); [A, Bf].forEach(function (e) { e.classList.remove('bad'); e.setAttribute('aria-invalid', 'false'); });
    if (!r.ok) {
      err.textContent = r.empty ? '' : r.error;
      if (!r.empty && r.field) { var f = r.field === 'a' ? A : Bf; f.classList.add('bad'); f.setAttribute('aria-invalid', 'true'); }
      $('bl-out').innerHTML = ''; $('bl-steps').innerHTML = '<p class="note">Enter valid numbers to see the steps.</p>'; return;
    }
    err.textContent = '';
    var lab = { add: '+', sub: '\u2212', mul: '\u00d7', div: '\u00f7', and: 'AND', or: 'OR', xor: 'XOR', nand: 'NAND', nor: 'NOR', xnor: 'XNOR', not: 'NOT', shl: '<<', shrl: '>>', shra: '>>>' }[o];
    var L = [], pre = '';
    if (r.lines && r.lines.carry) L.push('carry  ' + g4(r.lines.carry));
    L.push('A      ' + g4(r.a.bits));
    if (r.b) L.push(r.b.count !== undefined ? 'n      ' + r.b.count + ' (' + lab + ')' : 'B      ' + g4(r.b.bits) + '   (' + lab + ')');
    L.push('=      ' + r.grouped + (r.rem ? '   quotient' : ''));
    if (r.rem) L.push('rem    ' + g4(r.rem.bits));
    pre = '<pre class="al" aria-label="Aligned binary working">' + esc(L.join('\n')) + '</pre>';
    var rows = '<tr class="' + (signed ? '' : 'cu') + '"><td>Unsigned</td><td class="r">' + r.unsigned + '</td></tr><tr class="' + (signed ? 'cu' : '') + '"><td>Signed (two\u2019s complement)</td><td class="r">' + r.signed + '</td></tr>';
    if (r.rem) rows += '<tr><td>Remainder</td><td class="r">' + (signed ? r.rem.signed : r.rem.unsigned) + '</td></tr>';
    var res = '<div class="res"><div class="big">' + esc(r.grouped) + '<button type="button" class="btn2" data-copy="' + r.bits + '" aria-label="Copy binary result">Copy</button></div><div class="sub">Hex <b>' + r.hex + '</b> \u00b7 ' + w + ' bits</div><table class="ns-t"><tbody>' + rows + '</tbody></table></div>';
    var fl = '<div class="fls">' + flag('Zero', r.zero) + flag('Sign bit set', r.negative);
    if (r.ovU !== null || r.ovS !== null) {
      var unl = { add: 'carry out of the top bit', sub: 'borrow: A is smaller than B', mul: 'product needs more than ' + w + ' bits', shl: 'a 1 was shifted out' }[o];
      fl += flag('Unsigned overflow', r.ovU, r.ovU ? unl : '') + flag('Signed overflow', r.ovS, r.ovS ? 'true signed result is out of range' : '');
    }
    fl += '</div>';
    var ex = '';
    if (r.full) ex = '<p class="note">Full result with no width limit: <b>' + esc(r.full.u.indexOf('-') === 0 ? r.full.u : r.full.u) + '</b> in binary' + (o === 'div' ? '' : ' (unsigned operands), <b>' + esc(r.full.s) + '</b> as a signed number') + '.</p>';
    var sc = '';
    if (r.shiftCompare) { var c = r.shiftCompare; sc = '<h3>Logical and arithmetic right shift of the same input</h3><table class="ns-t"><thead><tr><th>Shift</th><th>Result</th><th>Signed value</th></tr></thead><tbody><tr class="' + (o === 'shrl' ? 'cu' : '') + '"><td>Logical (zero fill)</td><td class="r">' + g4(c.logical) + '</td><td class="r">' + c.logicalSigned + '</td></tr><tr class="' + (o === 'shra' ? 'cu' : '') + '"><td>Arithmetic (sign fill)</td><td class="r">' + g4(c.arithmetic) + '</td><td class="r">' + c.arithmeticSigned + '</td></tr></tbody></table>'; }
    var nt = r.notes.map(function (n) { return '<p class="note">' + esc(n) + '</p>'; }).join('');
    $('bl-out').innerHTML = pre + res + fl + ex + sc + nt;
    $('bl-steps').innerHTML = '<ol class="steps">' + r.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>';
  }
  function setAll(d) { A.value = d.a; Bf.value = d.b; op.value = d.op; wid.value = d.w; kind.value = d.kind; sg.value = d.sg; render(); }
  $('bl').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copy) { copy(b.dataset.copy); return; }
    if (b.dataset.ex) { setAll(JSON.parse(b.dataset.ex)); return; }
    if (b.dataset.act === 'reset') { setAll(DEF); A.focus(); }
    if (b.dataset.act === 'swap') { var t = A.value; A.value = Bf.value; Bf.value = t; render(); }
  });
  [A, Bf, op, wid, kind, sg].forEach(function (el) { el.addEventListener('input', render); el.addEventListener('change', render); });
  render();
})();
