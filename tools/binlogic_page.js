/* RETIRED in v1.99.98 follow-up: the old address is now a redirect to binary-arithmetic-calculator, written by tools/build_pages.js. Do not run this script: it would overwrite the redirect.
   Builds calculators/binary-logic-calculator/index.html (Mode 03: Binary Arithmetic & Logic). Run: node tools/binlogic_page.js
   Requires calculators/signed-binary-converter/index.html (for the shared style block) and the Basic Calculator page (shell). Example numbers are calculated by tools/binlogic_engine.js at build time. */
const fs = require('fs'), path = require('path');
const B = require('./binlogic_engine.js');
const root = path.join(__dirname, '..');
const shell = fs.readFileSync(path.join(root, 'calculators/basic-calculator/index.html'), 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const TITLE = 'Binary Calculator & Logic Gates | Add, Subtract, AND, OR, XOR, Shifts';
const DESC = 'Free binary arithmetic and logic calculator. Add, subtract, multiply and divide binary numbers; AND, OR, XOR, NOT, NAND, NOR; logical and arithmetic shifts at 4 to 64 bits with carry and overflow flags.';
const run = (op, a, b, kind, w, signed) => { const r = B.run({ op, a, b, kind, w, signed: !!signed }); if (!r.ok) throw new Error('page example failed ' + op + ' ' + a + ' ' + b + ': ' + r.error); return r; };
const ex = (label, d) => '<button type="button" class="chipb" data-ex="' + esc(JSON.stringify(d)) + '">' + esc(label) + '</button>';
const chips = [
  ex('10101010 AND 00001111', { a: '10101010', b: '00001111', op: 'and', w: '8', kind: 'bin', sg: 'u' }),
  ex('1101 + 1011', { a: '1101', b: '1011', op: 'add', w: '8', kind: 'bin', sg: 'u' }),
  ex('1101 + 1011 (4-bit carry)', { a: '1101', b: '1011', op: 'add', w: '4', kind: 'bin', sg: 'u' }),
  ex('127 + 1 (signed overflow)', { a: '127', b: '1', op: 'add', w: '8', kind: 'dec', sg: 's' }),
  ex('\u22127 \u00f7 2 (signed)', { a: '-7', b: '2', op: 'div', w: '8', kind: 'dec', sg: 's' }),
  ex('10000000 >> 1', { a: '10000000', b: '1', op: 'shrl', w: '8', kind: 'bin', sg: 'u' }),
  ex('10000000 >>> 1', { a: '10000000', b: '1', op: 'shra', w: '8', kind: 'bin', sg: 'u' })].join('');
const opOpts = B.OPS.map((o) => '<option value="' + o[0] + '"' + (o[0] === 'and' ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('');
const tool =
  '<div id="bl"><section class="card ns-card" aria-label="Binary arithmetic and logic calculator">' +
  '<div class="ns-grid blg"><div class="ns-f"><label for="bl-a" class="ns-l">A</label><input id="bl-a" class="ns-in" type="text" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" aria-describedby="bl-err" value="10101010"></div>' +
  '<div class="ns-f"><label for="bl-op" class="ns-l">Operation</label><select id="bl-op" class="ns-sel">' + opOpts + '</select></div>' +
  '<div class="ns-f" id="bl-bf"><label for="bl-b" id="bl-bl" class="ns-l">B</label><input id="bl-b" class="ns-in" type="text" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" aria-describedby="bl-err" value="00001111"></div></div>' +
  '<div class="ns-grid blg2"><div class="ns-f"><label for="bl-kind" class="ns-l">Enter operands as</label><select id="bl-kind" class="ns-sel"><option value="bin" selected>Binary</option><option value="hex">Hexadecimal</option><option value="dec">Decimal</option></select></div>' +
  '<div class="ns-f"><label for="bl-w" class="ns-l">Width</label><select id="bl-w" class="ns-sel"><option value="4">4 bits</option><option value="8" selected>8 bits</option><option value="16">16 bits</option><option value="32">32 bits</option><option value="64">64 bits</option></select></div>' +
  '<div class="ns-f"><label for="bl-sg" class="ns-l">Interpret as</label><select id="bl-sg" class="ns-sel"><option value="u" selected>Unsigned</option><option value="s">Signed (two\u2019s complement)</option></select></div></div>' +
  '<p class="note ns-msg" id="bl-err" role="status"></p><div class="ns-act"><button type="button" class="btn2" data-act="swap">Swap A and B</button><button type="button" class="btn2" data-act="reset">Reset</button></div>' +
  '<div class="ns-try"><span class="ns-l">Try</span> ' + chips + '</div><div id="bl-out" aria-live="polite"></div><p class="sr-only" id="bl-note" role="status" aria-live="polite"></p>' +
  '<noscript><p class="note">The calculator needs JavaScript. Nothing is sent anywhere.</p></noscript></section>' +
  '<section class="card"><h2>Working</h2><div id="bl-steps"></div></section></div>';
const tbl = (head, rows) => '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + head.join(', ') + '"><table><thead><tr>' + head.map((h) => '<th>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows.map((r) => '<tr>' + r.map((c) => '<td class="n">' + esc(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
const gate = (f) => [0, 0, 1, 1].map((_, i) => [Math.floor(i / 2), i % 2]).map(([x, y]) => [x, y].concat(f(x, y)));
const truth = tbl(['A', 'B', 'AND', 'OR', 'XOR', 'NAND', 'NOR', 'XNOR'], [[0, 0], [0, 1], [1, 0], [1, 1]].map(([x, y]) => [x, y, x & y, x | y, x ^ y, 1 - (x & y), 1 - (x | y), 1 - (x ^ y)].map(String)));
const not = tbl(['A', 'NOT A'], [['0', '1'], ['1', '0']]);
const shifts = [['10000000 (\u2212128 or 128)', '1'], ['11110000 (\u221216 or 240)', '2'], ['11111101 (\u22123 or 253)', '1']].map(([l, n]) => { const b = l.split(' ')[0]; const a = run('shrl', b, n, 'bin', 8, false), c = run('shra', b, n, 'bin', 8, true); return [l, n, a.bits + ' (' + a.unsigned + ')', c.bits + ' (' + c.signed + ')']; });
const ovr = [['255 + 1', run('add', '255', '1', 'dec', 8, false)], ['127 + 1', run('add', '127', '1', 'dec', 8, true)], ['0 \u2212 1', run('sub', '0', '1', 'dec', 8, false)], ['16 \u00d7 16', run('mul', '16', '16', 'dec', 8, false)]].map(([l, r]) => [l + ' (8-bit)', r.bits, r.unsigned + ' / ' + r.signed, r.ovU ? 'yes' : 'no', r.ovS ? 'yes' : 'no']);
const faq = [
  ['What is the difference between logical and arithmetic right shift?', 'A logical right shift fills the vacated left bits with zeros, so it treats the pattern as an unsigned number. An arithmetic right shift copies the sign bit into them, so a negative signed number stays negative. For 10000000 in 8 bits, one logical shift gives 01000000 (64) and one arithmetic shift gives 11000000 (\u221264). For non-negative values they are the same.'],
  ['Does an arithmetic shift divide by 2?', 'Almost. It divides by 2 and rounds toward minus infinity, so \u22123 >>> 1 is \u22122. Integer division in C and most hardware truncates toward zero, so \u22123 \u00f7 2 is \u22121. This calculator uses truncation toward zero for division and shows both.'],
  ['What do the two overflow flags mean?', 'Unsigned overflow means the true result does not fit in the width when the patterns are read as unsigned numbers: a carry out of the top bit in an addition, a borrow in a subtraction, a 1 shifted out, or a product that is too large. Signed overflow means the true result does not fit when the patterns are read as two\u2019s complement numbers. The same bits can overflow one way and not the other: 255 + 1 in 8 bits carries out as unsigned, but as signed it is \u22121 + 1 = 0, which is correct.'],
  ['Why is the result limited to the width?', 'Hardware registers have a fixed width, so a result that needs more bits wraps around. The calculator shows the wrapped pattern a register would hold, the flags that say wrapping happened, and the full result with no width limit.'],
  ['How is NOT, NAND, NOR or XNOR affected by the width?', 'The inversion applies to every bit of the chosen width, including leading zeros. NOT 00001111 is 11110000 at 8 bits but 1111111111110000 at 16 bits.'],
  ['What happens if the shift count is as large as the width?', 'The calculator defines it: every bit is shifted out, so left and logical right shifts give 0 and an arithmetic right shift gives all sign bits. In C the same shift is undefined behaviour, so avoid relying on it in code.'],
  ['Is anything sent to a server?', 'No. Everything runs in your browser.']
];
const body = '<main class="w"><h1>Binary Calculator and Logic Gates</h1><p class="lede">Add, subtract, multiply and divide binary numbers, apply AND, OR, XOR, NOT, NAND, NOR and XNOR, and shift left or right at 4 to 64 bits. Carry and overflow are reported for both unsigned and signed readings. Calculate. Convert. Understand.</p>' + tool +
  '<section id="truth"><h2>Truth tables</h2>' + truth + '<h3>NOT</h3>' + not + '<p class="note">NAND, NOR and XNOR are AND, OR and XOR followed by NOT.</p></section>' +
  '<section id="shift"><h2>Logical and arithmetic right shift (8 bits)</h2>' + tbl(['Input', 'Shift n', 'Logical (unsigned value)', 'Arithmetic (signed value)'], shifts) + '</section>' +
  '<section id="overflow"><h2>Overflow and carry examples (8 bits)</h2>' + tbl(['Operation', 'Result bits', 'Unsigned / signed value', 'Unsigned overflow', 'Signed overflow'], ovr) + '<p class="note">Compare the two readings: 255 + 1 carries out when the bits are unsigned, but is \u22121 + 1 = 0 when they are signed.</p></section>' +
  '<section id="faq"><h2>Questions</h2>' + faq.map((q) => '<h3>' + esc(q[0]) + '</h3><p>' + esc(q[1]) + '</p>').join('') + '</section>' +
  '<section id="related"><h2>Related</h2><p><a class="chip" href="../number-system-converter/">Universal Number System Converter</a><a class="chip" href="../signed-binary-converter/">Signed Binary Converter</a><a class="chip" href="../../converters/binary-calculator.html">Binary Calculator (all four bases)</a><a class="chip" href="../boolean-logic/">Boolean Logic</a><a class="chip" href="../../converters/index.html">Conversion Centre</a></p></section></main>';
const base = fs.readFileSync(path.join(root, 'calculators/signed-binary-converter/index.html'), 'utf8').match(/<style>#ns[\s\S]*?<\/style>/)[0].replace(/#sb/g, '#bl').replace('</style>',
  '#bl .blg{grid-template-columns:2fr 1.4fr 2fr}#bl .blg2{grid-template-columns:1fr 1fr 1fr;margin-top:12px}#bl pre.al{font:600 15px/1.6 var(--mono);background:var(--field);border:1px solid var(--line);border-radius:8px;padding:12px 14px;margin:6px 0 12px;overflow-x:auto;color:var(--num)}#bl .res .big{font:700 28px/1.3 var(--mono);color:var(--num);word-break:break-all}#bl .res .big .btn2{vertical-align:middle}#bl .res .sub{color:var(--muted);margin:2px 0 8px}#bl .res table{max-width:420px}#bl td.r{font:600 15px var(--mono);color:var(--num)}#bl .fls{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}#bl .fl{border:1px solid var(--line);background:var(--field);border-radius:8px;padding:6px 10px;font-size:14px}#bl .fl.on{border-color:var(--gold);background:var(--gold-fill)}#bl .fl small{display:block;color:var(--muted);font-size:12px}#bl h3{margin:14px 0 4px}@media(max-width:700px){#bl .blg,#bl .blg2{grid-template-columns:1fr}}</style>');
const css = base;
const client = fs.readFileSync(path.join(__dirname, 'binlogic_client.js'), 'utf8');
const engine = fs.readFileSync(path.join(__dirname, 'binlogic_engine.js'), 'utf8');
const ld = '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Binary Arithmetic and Logic Calculator', applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any (web browser)', description: DESC, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }) + '</script>';
let out = shell;
const h0 = out.indexOf('<style>');
out = out.slice(0, h0) + css + out.slice(out.indexOf('</style>', h0) + 8);
out = out.replace(/<title>.*?<\/title>/, '<title>' + esc(TITLE) + '</title>');
['name="description"', 'property="og:title"', 'property="og:description"', 'name="twitter:title"', 'name="twitter:description"'].forEach((k) => { const v = /title/.test(k) ? TITLE : DESC; out = out.replace(new RegExp('(<meta ' + k + ' content=")[^"]*'), '$1' + esc(v)); });
out = out.replace(/<main class="w">[\s\S]*?<\/main>/, () => body);
[...out.matchAll(/<script>[\s\S]*?<\/script>/g)].filter((m) => /Elecmetric Scientific Calculator engine|Elecmetric Basic Calculator: page script/.test(m[0])).forEach((m) => { out = out.replace(m[0], ''); });
out = out.replace('</head>', () => ld + '</head>');
out = out.replace('<script>try{if("serviceWorker"', () => '<script>' + engine + '\n' + client + '</script><script>try{if("serviceWorker"');
const dir = path.join(root, 'calculators/binary-logic-calculator');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'index.html'), out);
console.log('wrote calculators/binary-logic-calculator/index.html (' + out.length + ' bytes)');
