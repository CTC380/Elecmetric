/* Builds calculators/signed-binary-calculator/index.html (Binary Calculator, Mode 04: Signed Binary Representations). Run: node tools/signbin_page.js
   Page shell from the Basic Calculator, style block from the built Mode 01 page (ids renamed), engine and script from tools/signbin_engine.js and tools/signbin_client.js.
   Every example is calculated by the engine at build time. */
const fs = require('fs'), path = require('path');
const C = require('./signbin_engine.js');
const root = path.join(__dirname, '..');
const shell = fs.readFileSync(path.join(root, 'calculators/basic-calculator/index.html'), 'utf8');
const mode1 = fs.readFileSync(path.join(root, 'calculators/binary-arithmetic-calculator/index.html'), 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const TITLE = 'Signed Binary Calculator | Two’s Complement, One’s Complement & Overflow';
const DESC = 'Free signed binary calculator. Convert between unsigned, sign-magnitude, one’s complement and two’s complement at 4 to 64 bits, add, subtract and negate with overflow and underflow warnings, and sign-extend.';
const run = (o) => { const r = C.run(Object.assign({ rep: 'twos', width: '8', base: 'dec', policy: 'flag' }, o)); if (!r.ok) throw new Error('page example failed ' + JSON.stringify(o) + ': ' + r.error); return r; };
const ex = (label, d) => '<button type="button" class="chipb" data-ex="' + esc(JSON.stringify(d)) + '">' + esc(label) + '</button>';
const D = { op: 'analyze', rep: 'twos', width: '8', base: 'dec', a: '', b: '', to: '16', policy: 'flag', grp: '4' };
const chips = [
  ex('-5 in 8-bit two’s complement', Object.assign({}, D, { a: '-5' })), ex('11111111 as two’s complement', Object.assign({}, D, { base: 'bin', a: '11111111' })), ex('11111111 as unsigned', Object.assign({}, D, { base: 'bin', rep: 'unsigned', a: '11111111' })),
  ex('-5 as sign-magnitude', Object.assign({}, D, { rep: 'signmag', a: '-5' })), ex('-5 as one’s complement', Object.assign({}, D, { rep: 'ones', a: '-5' })), ex('-128, the minimum', Object.assign({}, D, { a: '-128' })),
  ex('100 + 50 overflows', Object.assign({}, D, { op: 'add', a: '100', b: '50' })), ex('100 + 50, wrap around', Object.assign({}, D, { op: 'add', a: '100', b: '50', policy: 'wrap' })), ex('-100 - 50, saturate', Object.assign({}, D, { op: 'sub', a: '-100', b: '50', policy: 'sat' })),
  ex('Negate -128', Object.assign({}, D, { op: 'neg', a: '-128' })), ex('Sign-extend -5 to 16 bits', Object.assign({}, D, { op: 'resize', a: '-5', to: '16' }))].join('');
const opt = (v, t, sel, dis) => '<option value="' + v + '"' + (sel ? ' selected' : '') + (dis ? ' disabled' : '') + '>' + esc(t) + '</option>';
const opOpts = C.OPS.map((d) => opt(d[0], d[1], d[0] === 'analyze')).join('');
const repOpts = C.REPS.map((d) => opt(d[0], d[1], d[0] === 'twos')).join('');
const baseOpts = C.BASES.map((d) => opt(d[0], d[2].charAt(0).toUpperCase() + d[2].slice(1) + (d[0] === 'dec' ? ' (signed value)' : ' (bit pattern)'), d[0] === 'dec')).join('');
const wOpts = C.WIDTHS.map((w) => opt(String(w), w + ' bits', w === 8)).join('');
const toOpts = C.WIDTHS.map((w) => opt(String(w), w + ' bits', w === 16)).join('');
const polOpts = C.POLICIES.map((d) => opt(d[0], d[1], d[0] === 'flag')).join('');
const field = (id, label, html, extra) => '<div class="ns-f"' + (extra || '') + '><label for="' + id + '" class="ns-l" id="' + id + 'l">' + label + '</label>' + html + '</div>';
const inp = (id, v, ph) => '<input id="' + id + '" class="ns-in" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" value="' + v + '" placeholder="' + (ph || '') + '" aria-describedby="sb-err">';
const tool =
  '<div id="sb"><section class="card ns-card" aria-label="Signed binary calculator">' +
  '<div class="ns-grid">' + field('sb-op', 'Operation', '<select id="sb-op" class="ns-sel">' + opOpts + '</select>') + field('sb-rep', 'Representation', '<select id="sb-rep" class="ns-sel">' + repOpts + '</select>') + field('sb-w', 'Bit width', '<select id="sb-w" class="ns-sel">' + wOpts + '</select>') + field('sb-base', 'Enter values in', '<select id="sb-base" class="ns-sel">' + baseOpts + '</select>') + '</div>' +
  '<p class="note" id="sb-hint"></p>' +
  '<div class="ns-grid" style="margin-top:8px">' + field('sb-a', 'Value or bit pattern', inp('sb-a', '-5')) + field('sb-b', 'B', inp('sb-b', '3'), ' id="sb-wrap-b" hidden') + field('sb-to', 'Change to width', '<select id="sb-to" class="ns-sel">' + toOpts + '</select>', ' id="sb-wrap-to" hidden') + field('sb-pol', 'If the result does not fit', '<select id="sb-pol" class="ns-sel">' + polOpts + '</select>', ' id="sb-wrap-pol" hidden') + field('sb-grp', 'Group binary digits', '<select id="sb-grp" class="ns-sel">' + opt('0', 'No grouping', false) + opt('4', 'Groups of 4 (nibbles)', true) + '</select>') + '</div>' +
  '<div class="ba-kp" id="sb-kp" role="group" aria-label="Keypad: inserts into the field you last used"></div>' +
  '<p class="note ns-msg" id="sb-err" role="status"></p>' +
  '<div class="ns-act"><button type="button" class="btn2" data-act="swap">Swap A and B</button><button type="button" class="btn2" data-act="reset">Reset</button><button type="button" class="btn2" data-act="save">Save to history</button></div>' +
  '<div class="ns-try"><span class="ns-l">Try</span> ' + chips + '</div>' +
  '<div id="sb-out" aria-live="polite"></div>' +
  '<div id="sb-dl" class="ns-act" hidden><span class="ns-l ba-dll">Download</span><button type="button" class="btn2" data-dl="txt">TXT</button><button type="button" class="btn2" data-dl="csv">CSV</button><button type="button" class="btn2" data-dl="json">JSON</button></div>' +
  '<p class="sr-only" id="sb-note" role="status" aria-live="polite"></p>' +
  '<noscript><p class="note">The calculator needs JavaScript. This tool does not submit calculator inputs to Elecmetric.</p></noscript></section>' +
  '<section class="card"><h2>Working</h2><div id="sb-steps"></div></section>' +
  '<section class="card"><h2>History</h2><ul class="ba-hist" id="sb-hist"></ul><button type="button" class="btn2" id="sb-hclear" data-act="hclear" hidden>Clear history</button><p class="note">Kept only in this browser. Up to 10 operations.</p></section></div>';
const tbl = (head, rows) => '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + head.join(', ') + '"><table><thead><tr>' + head.map((h) => '<th>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows.map((r) => '<tr>' + r.map((c) => '<td class="n">' + esc(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
const bitsOf = (o) => run(o).result.bin, valOf = (o) => run(o).result.value;
const rangeRows = [4, 8, 16, 32, 64].map((w) => [w + ' bits'].concat(['unsigned', 'signmag', 'ones', 'twos'].map((r) => { const R = C.range(r, w); return R.min + ' to ' + R.max; })));
const fiveRows = [['+5', '00000101', '00000101', '00000101'], ['-5', bitsOf({ rep: 'signmag', op: 'analyze', a: '-5' }), bitsOf({ rep: 'ones', op: 'analyze', a: '-5' }), bitsOf({ op: 'analyze', a: '-5' })], ['+0', bitsOf({ rep: 'signmag', op: 'analyze', a: '0' }), bitsOf({ rep: 'ones', op: 'analyze', a: '0' }), bitsOf({ op: 'analyze', a: '0' })], ['-0', '10000000', '11111111', 'does not exist']];
const same = run({ op: 'analyze', base: 'bin', a: '11111111' }).result.reads;
const sameRows = ['11111111', '10000000', '01111111', '00000001'].map((p) => [p].concat(run({ op: 'analyze', base: 'bin', a: p }).result.reads.slice().reverse().map((x) => x.value)));
const ovRows = [['100 + 50', 'two’s complement, 8 bits', run({ op: 'add', a: '100', b: '50' }).calc.exact + ' (overflow)', valOf({ op: 'add', a: '100', b: '50', policy: 'wrap' }), valOf({ op: 'add', a: '100', b: '50', policy: 'sat' })], ['-100 - 50', 'two’s complement, 8 bits', run({ op: 'sub', a: '-100', b: '50' }).calc.exact + ' (underflow)', valOf({ op: 'sub', a: '-100', b: '50', policy: 'wrap' }), valOf({ op: 'sub', a: '-100', b: '50', policy: 'sat' })],
  ['-(-128)', 'two’s complement, 8 bits', run({ op: 'neg', a: '-128' }).calc.exact + ' (overflow)', valOf({ op: 'neg', a: '-128', policy: 'wrap' }), valOf({ op: 'neg', a: '-128', policy: 'sat' })], ['3 - 5', 'unsigned, 8 bits', run({ op: 'sub', rep: 'unsigned', a: '3', b: '5' }).calc.exact + ' (underflow)', valOf({ op: 'sub', rep: 'unsigned', a: '3', b: '5', policy: 'wrap' }), valOf({ op: 'sub', rep: 'unsigned', a: '3', b: '5', policy: 'sat' })],
  ['7 + 1', 'two’s complement, 4 bits', run({ op: 'add', width: '4', a: '7', b: '1' }).calc.exact + ' (overflow)', valOf({ op: 'add', width: '4', a: '7', b: '1', policy: 'wrap' }), valOf({ op: 'add', width: '4', a: '7', b: '1', policy: 'sat' })]];
const faq = [
  ['What is two’s complement?', 'Two’s complement is the way almost every computer stores signed integers. A negative number is written by inverting every bit of its positive twin and adding 1, so -5 in 8 bits is 00000101 inverted (11111010) plus 1, which is 11111011. The sign bit is the leftmost bit, and the same adder works for signed and unsigned numbers. An N-bit two’s complement number ranges from -2^(N-1) to 2^(N-1) - 1, so 8 bits give -128 to 127.'],
  ['Why is 11111111 sometimes 255 and sometimes -1?', 'A bit pattern has no meaning until you choose a representation. As an unsigned 8-bit number 11111111 is 255. As 8-bit two’s complement it is -1, as one’s complement it is -0, and as sign-magnitude it is -127. This page always shows the representation you selected, and the same bits in the others.'],
  ['What is the difference between one’s complement, two’s complement and sign-magnitude?', 'Sign-magnitude uses the leftmost bit as a sign and the other bits as the size, so -5 is 10000101. One’s complement negates by inverting every bit, so -5 is 11111010. Two’s complement inverts and adds 1, so -5 is 11111011. The first two have two zeros (+0 and -0); two’s complement has one zero and one extra negative value.'],
  ['What is overflow and what is underflow?', 'Overflow is a result larger than the largest value the width can hold (100 + 50 in 8-bit two’s complement is 150, above 127). Underflow is a result smaller than the smallest value (-100 - 50 is -150, below -128). For unsigned numbers, a subtraction that would go below 0 is an underflow. The true result is always shown.'],
  ['What happens when a result does not fit?', 'You choose. “Report” stores nothing and shows the warning. “Wrap around” keeps only the bits that fit, so 150 becomes -106 in 8-bit two’s complement. “Saturate” stops at the nearest limit, 127 here. Wrapping is what a plain adder does; saturation is common in signal processing. Neither is the true result, and the page says so.'],
  ['How does the calculator detect two’s complement overflow?', 'It adds the bit patterns and compares the carry into the sign bit with the carry out of it. If they differ, the result overflowed. The engine also checks that against exact integer arithmetic, and refuses to show a result if the two disagree.'],
  ['Why does negating -128 give -128?', 'In 8-bit two’s complement the range is -128 to 127, so +128 does not exist. Inverting 10000000 gives 01111111, and adding 1 gives 10000000 again. The calculator reports this as an overflow.'],
  ['How do I sign-extend a number to more bits?', 'Copy the sign bit into the new bits on the left: -5 is 11111011 in 8 bits and 1111111111111011 in 16 bits. Filling with zeros instead gives 251, which is wrong for a negative number. Sign-magnitude moves the sign bit instead, and unsigned numbers are filled with zeros. Narrowing is only allowed when the value still fits.'],
  ['What happens if I type a short bit pattern?', 'It is padded with zeros on the left to the chosen width, so 101 at 8 bits is 00000101, which is +5, not -3. Short patterns are never sign-extended automatically, because the width is part of the question.'],
  ['Is anything sent to a server?', 'No. Everything runs in your browser, and the history list is stored only in your browser.']];
const body = '<main class="w"><h1>Signed Binary Calculator: Two’s Complement, One’s Complement and Sign-Magnitude</h1><p class="lede">Choose the representation, and see exactly what the bits mean. Unsigned, sign-magnitude, one’s complement and two’s complement at 4, 8, 16, 32 or 64 bits, with the sign bit, the value in each representation, minimum and maximum, and overflow and underflow warnings. Add, subtract, negate and sign-extend with the true result always shown. Calculate. Convert. Understand.</p>' + tool +
  '<section id="five"><h2>+5 and -5 in 8 bits</h2>' + tbl(['Value', 'Sign-magnitude', 'One’s complement', 'Two’s complement'], fiveRows) + '<p class="note">In two’s complement: +5 is 00000101, invert all bits to get 11111010, add 1 to get 11111011, which is -5. Results calculated by this page’s engine.</p></section>' +
  '<section id="same"><h2>The same bits, four meanings (8 bits)</h2>' + tbl(['Bits', 'Two’s complement', 'One’s complement', 'Sign-magnitude', 'Unsigned'], sameRows) + '</section>' +
  '<section id="range"><h2>Range of each representation</h2>' + tbl(['Width', 'Unsigned', 'Sign-magnitude', 'One’s complement', 'Two’s complement'], rangeRows) + '<p class="note">For an N-bit two’s complement integer, -2^(N-1) ≤ n ≤ 2^(N-1) - 1; for 8 bits, -128 ≤ n ≤ 127.</p></section>' +
  '<section id="overflow"><h2>When the result does not fit</h2>' + tbl(['Calculation', 'Representation', 'True result', 'Wrap around', 'Saturate'], ovRows) + '</section>' +
  '<section id="faq"><h2>Questions</h2>' + faq.map((q) => '<h3>' + esc(q[0]) + '</h3><p>' + esc(q[1]) + '</p>').join('') + '</section>' +
  '<section id="related"><h2>Related</h2><p><a class="chip" href="../binary-arithmetic-calculator/">Binary Calculator: Add, Subtract, Multiply and Divide</a><a class="chip" href="../number-system-converter/">Number System Converter</a><a class="chip" href="../bitwise-operations-calculator/">Bitwise Operations Calculator</a><a class="chip" href="../digital-logic-calculator/">Digital Logic Calculator</a><a class="chip" href="../bcd-converter/">BCD Converter</a><a class="chip" href="../gray-code-converter/">Gray Code Converter</a><a class="chip" href="../engineering-mathematics/">Engineering Mathematics</a></p></section></main>';
const m1css = mode1.match(/<style>[\s\S]*?<\/style>/)[0].replace(/#ba /g, '#sb ').replace(/#ba\./g, '#sb.');
const css = m1css.replace('</style>', '#sb .ns-t th small{display:block;font:500 12px var(--body);color:var(--muted)}#sb .ns-t td{vertical-align:middle}#sb .tw{position:relative}#sb .ns-f[hidden]{display:none}' +
  '#sb table.bg{border-collapse:separate;border-spacing:0;font-family:var(--mono);margin:4px 0}#sb .bg th,#sb .bg td{min-width:30px;padding:6px 4px;text-align:center;border:1px solid var(--line);font:600 17px var(--mono);color:var(--muted)}#sb .bg th[scope=row]{position:sticky;left:0;z-index:1;background:var(--surface);min-width:84px;text-align:left;font:700 12px var(--body);color:var(--ink);padding:6px 8px}' +
  '#sb .bg td.one{background:var(--gold-fill);color:var(--gold);border-color:var(--gold);font-weight:800}#sb .bg th.ix{font:500 11px var(--mono)}#sb .bg td.mk{font:600 11px var(--mono);color:var(--muted)}#sb .bg .g{border-left:3px solid var(--navy-2)}#sb .bg .sg{box-shadow:inset 3px 0 0 var(--orange)}#sb .bg th[scope=row]+.g{border-left:1px solid var(--line)}#sb .bg-w{margin-top:12px}' +
  '#sb .ns-warn{margin:10px 0;padding:10px 12px;border:1px solid var(--orange);border-left-width:5px;border-radius:8px;background:var(--field);color:var(--ink)}</style>');
const client = fs.readFileSync(path.join(__dirname, 'signbin_client.js'), 'utf8'), engine = fs.readFileSync(path.join(__dirname, 'signbin_engine.js'), 'utf8');
const ld = '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Signed Binary Calculator', applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any (web browser)', description: DESC, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }) + '</script>';
let o2 = shell; const h0 = o2.indexOf('<style>');
o2 = o2.slice(0, h0) + css + o2.slice(o2.indexOf('</style>', h0) + 8);
o2 = o2.replace(/<title>.*?<\/title>/, '<title>' + esc(TITLE) + '</title>');
['name="description"', 'property="og:title"', 'property="og:description"', 'name="twitter:title"', 'name="twitter:description"'].forEach((k) => { const v = /title/.test(k) ? TITLE : DESC; o2 = o2.replace(new RegExp('(<meta ' + k + ' content=")[^"]*'), '$1' + esc(v)); });
o2 = o2.replace(/<main class="w">[\s\S]*?<\/main>/, () => body);
[...o2.matchAll(/<script>[\s\S]*?<\/script>/g)].filter((m) => /Elecmetric Scientific Calculator engine|Elecmetric Basic Calculator: page script/.test(m[0])).forEach((m) => { o2 = o2.replace(m[0], ''); });
o2 = o2.replace('</head>', () => ld + '</head>');
o2 = o2.replace('<script>try{if("serviceWorker"', () => '<script>' + engine + '\n' + client + '</script><script>try{if("serviceWorker"');
const dir = path.join(root, 'calculators/signed-binary-calculator'); fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'index.html'), o2); console.log('wrote calculators/signed-binary-calculator/index.html (' + o2.length + ' bytes)');
