/* Builds calculators/bitwise-operations-calculator/index.html (Binary Calculator, Mode 03: Bitwise Operations). Run: node tools/bitops_page.js
   Page shell from the Basic Calculator, style block from the built Mode 01 page (ids renamed), engine and script from tools/bitops_engine.js and tools/bitops_client.js.
   Every example is calculated by the engine at build time. */
const fs = require('fs'), path = require('path');
const C = require('./bitops_engine.js');
const root = path.join(__dirname, '..');
const shell = fs.readFileSync(path.join(root, 'calculators/basic-calculator/index.html'), 'utf8');
const mode1 = fs.readFileSync(path.join(root, 'calculators/binary-arithmetic-calculator/index.html'), 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const TITLE = 'Bitwise Operations Calculator | AND, OR, XOR, NOT & Bit Shifts';
const DESC = 'Free bitwise calculator with a bit-by-bit grid. AND, OR, XOR, NAND, NOR, XNOR, NOT, left shift, logical and arithmetic right shift, plus set, clear, toggle and test a bit, at 4 to 64 bits.';
const run = (o) => { const r = C.run(Object.assign({ base: 'bin', width: '8' }, o)); if (!r.ok) throw new Error('page example failed ' + JSON.stringify(o) + ': ' + r.error); return r; };
const ex = (label, d) => '<button type="button" class="chipb" data-ex="' + esc(JSON.stringify(d)) + '">' + esc(label) + '</button>';
const D = { base: 'bin', width: '8', b: '', n: '' };
const chips = [
  ex('10101010 AND 00001111', Object.assign({}, D, { op: 'and', a: '10101010', b: '00001111' })), ex('1010 OR 0101', Object.assign({}, D, { op: 'or', a: '1010', b: '0101', width: 'auto' })), ex('1010 XOR 1100', Object.assign({}, D, { op: 'xor', a: '1010', b: '1100', width: 'auto' })),
  ex('NOT 00001111 (8 bits)', Object.assign({}, D, { op: 'not', a: '00001111' })), ex('1010 << 2', Object.assign({}, D, { op: 'shl', a: '1010', n: '2' })), ex('10110000 logical >> 2', Object.assign({}, D, { op: 'shr', a: '10110000', n: '2' })),
  ex('10110000 arithmetic >> 2', Object.assign({}, D, { op: 'sar', a: '10110000', n: '2' })), ex('Set bit 0 of 10101010', Object.assign({}, D, { op: 'setbit', a: '10101010', n: '0' })), ex('Compare 10101010 and 10100110', Object.assign({}, D, { op: 'diff', a: '10101010', b: '10100110' }))].join('');
const opt = (v, t, sel, dis) => '<option value="' + v + '"' + (sel ? ' selected' : '') + (dis ? ' disabled' : '') + '>' + esc(t) + '</option>';
const grp = (label, ids) => '<optgroup label="' + label + '">' + ids.map((i) => { const d = C.OPS.filter((x) => x[0] === i)[0]; return opt(i, d[1] + ' (' + d[3] + ')', i === 'and'); }).join('') + '</optgroup>';
const opOpts = grp('Logic', ['and', 'or', 'xor', 'nand', 'nor', 'xnor', 'not']) + grp('Shifts (need a width)', ['shl', 'shr', 'sar']) + grp('Register tools', ['setbit', 'clearbit', 'togglebit', 'testbit', 'diff']);
const baseOpts = C.BASES.map((d) => opt(d[0], d[2].charAt(0).toUpperCase() + d[2].slice(1), d[0] === 'bin')).join('');
const wOpts = opt('auto', 'Automatic (binary operations)', false) + C.WIDTHS.map((w) => opt(String(w), w + ' bits', w === 8)).join('');
const field = (id, label, html, extra) => '<div class="ns-f"' + (extra || '') + '><label for="' + id + '" class="ns-l" id="' + id + 'l">' + label + '</label>' + html + '</div>';
const inp = (id, v, ph) => '<input id="' + id + '" class="ns-in" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" value="' + v + '" placeholder="' + (ph || '') + '" aria-describedby="bo-err">';
const tool =
  '<div id="bo"><section class="card ns-card" aria-label="Bitwise operations calculator">' +
  '<div class="ns-grid">' + field('bo-op', 'Operation', '<select id="bo-op" class="ns-sel">' + opOpts + '</select>') + field('bo-base', 'Enter values in', '<select id="bo-base" class="ns-sel">' + baseOpts + '</select>') + field('bo-w', 'Bit width', '<select id="bo-w" class="ns-sel">' + wOpts + '</select>') + field('bo-grp', 'Group binary digits', '<select id="bo-grp" class="ns-sel">' + opt('0', 'No grouping', true) + opt('4', 'Groups of 4 (nibbles)', false) + '</select>') + '</div>' +
  '<p class="note" id="bo-hint"></p>' +
  '<div class="ns-grid" style="margin-top:8px">' + field('bo-a', 'A', inp('bo-a', '10101010')) + field('bo-b', 'B', inp('bo-b', '00001111'), ' id="bo-wrap-b"') + field('bo-n', 'Shift amount (bits)', inp('bo-n', '2'), ' id="bo-wrap-n" hidden') + '</div>' +
  '<div class="ba-kp" id="bo-kp" role="group" aria-label="Keypad: inserts into the field you last used"></div>' +
  '<p class="note ns-msg" id="bo-err" role="status"></p>' +
  '<div class="ns-act"><button type="button" class="btn2" data-act="swap">Swap A and B</button><button type="button" class="btn2" data-act="reset">Reset</button><button type="button" class="btn2" data-act="save">Save to history</button></div>' +
  '<div class="ns-try"><span class="ns-l">Try</span> ' + chips + '</div>' +
  '<div id="bo-out" aria-live="polite"></div>' +
  '<div id="bo-dl" class="ns-act" hidden><span class="ns-l ba-dll">Download</span><button type="button" class="btn2" data-dl="txt">TXT</button><button type="button" class="btn2" data-dl="csv">CSV</button><button type="button" class="btn2" data-dl="json">JSON</button></div>' +
  '<p class="sr-only" id="bo-note" role="status" aria-live="polite"></p>' +
  '<noscript><p class="note">The calculator needs JavaScript. Nothing is sent anywhere.</p></noscript></section>' +
  '<section class="card"><h2>Working</h2><div id="bo-steps"></div></section>' +
  '<section class="card"><h2>History</h2><ul class="ba-hist" id="bo-hist"></ul><button type="button" class="btn2" id="bo-hclear" data-act="hclear" hidden>Clear history</button><p class="note">Kept only in this browser. Up to 10 operations.</p></section></div>';
const tbl = (head, rows) => '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + head.join(', ') + '"><table><thead><tr>' + head.map((h) => '<th>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows.map((r) => '<tr>' + r.map((c) => '<td class="n">' + esc(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
const gate = (id, x, y) => run({ op: id, a: String(x), b: String(y), width: 'auto' }).result.bin.slice(-1);
const truth = [[0, 0], [0, 1], [1, 0], [1, 1]].map(([x, y]) => [x, y].concat(['and', 'or', 'xor', 'nand', 'nor', 'xnor'].map((id) => gate(id, x, y))));
const out = (o) => run(o).result.bin;
const exRows = [
  ['00001111 AND 11110000', out({ op: 'and', a: '00001111', b: '11110000', width: 'auto' })], ['1010 OR 0101', out({ op: 'or', a: '1010', b: '0101', width: 'auto' })], ['1010 XOR 1100', out({ op: 'xor', a: '1010', b: '1100', width: 'auto' })],
  ['10101010 AND 00001111 (keep the low nibble)', out({ op: 'and', a: '10101010', b: '00001111', width: 'auto' })], ['NOT 00001111, 8 bits', out({ op: 'not', a: '00001111' })], ['NOT 00001111, 16 bits', out({ op: 'not', a: '00001111', width: '16' })],
  ['1010 << 2, 8 bits', out({ op: 'shl', a: '1010', n: '2' })], ['1010 << 2, 4 bits (the high 1 is lost)', out({ op: 'shl', a: '1010', n: '2', width: '4' })], ['10110000 logical >> 2', out({ op: 'shr', a: '10110000', n: '2' })], ['10110000 arithmetic >> 2', out({ op: 'sar', a: '10110000', n: '2' })],
  ['Set bit 0 of 10101010', out({ op: 'setbit', a: '10101010', n: '0' })], ['Clear bit 7 of 10101010', out({ op: 'clearbit', a: '10101010', n: '7' })], ['Toggle bit 1 of 10101010', out({ op: 'togglebit', a: '10101010', n: '1' })]];
const faq = [
  ['What are the bitwise operators?', 'A bitwise operator works on each pair of bits in the same column independently. AND gives 1 only when both bits are 1, OR gives 1 when either is 1, XOR gives 1 when they differ, and NOT flips a bit. NAND, NOR and XNOR are AND, OR and XOR followed by NOT. The grid above shows every column, so you can see which bits produced each result bit.'],
  ['Why does NOT need a bit width?', 'NOT flips every bit of the register, so the answer depends on how many bits it has. NOT 00001111 is 11110000 in 8 bits but 1111111111110000 in 16 bits. The same is true of shifts, where bits can fall off the end. NOT and the shifts therefore need an explicit width of 4, 8, 16, 32 or 64 bits.'],
  ['What is the difference between a logical and an arithmetic right shift?', 'A logical right shift shifts zeros in on the left. An arithmetic right shift copies the sign bit in, which keeps a negative two’s complement number negative: 10110000 gives 00101100 logically but 11101100 arithmetically. For a value whose sign bit is 0 they give the same result. This page never mixes them up, and tells you when they differ for your input.'],
  ['What happens to the bits that are shifted out?', 'They are lost, as in a real register. The page shows them, and a left shift reports unsigned overflow when a 1 is shifted out (the result is no longer A × 2^n) and signed overflow when the two’s complement result no longer fits.'],
  ['How do I set, clear, toggle or test one bit?', 'Build a mask with a single 1 at the bit position (bit 0 is the rightmost). OR with the mask sets the bit, AND with the inverted mask clears it, XOR with the mask toggles it, and AND with the mask tells you whether the bit is set. The register tools do this for you and show the mask.'],
  ['What does Compare do?', 'It XORs the two values: every 1 in the result is a bit where they differ. The number of differing bits is the Hamming distance, and their positions are listed.'],
  ['What happens if a value is wider than the width I chose?', 'It is refused with a message, never truncated. A negative decimal value is encoded as two’s complement and must fit the width, so −129 is refused at 8 bits. A sign is not accepted on a binary, octal or hexadecimal pattern.'],
  ['Does this replace the Binary Calculator and Logic Gates page?', 'That page does fixed-width arithmetic, overflow reporting and the same logic operations on single values. This page concentrates on seeing the bits: the column grid, the shift sources, the register tools and the explicit logical and arithmetic shifts.'],
  ['Is anything sent to a server?', 'No. Everything runs in your browser, and the history list is stored only in your browser.']];
const body = '<main class="w"><h1>Bitwise Operations Calculator: AND, OR, XOR, NOT and Shifts</h1><p class="lede">See exactly which bits produce each result bit. AND, OR, XOR, NAND, NOR, XNOR, NOT, shift left, logical and arithmetic shift right, and set, clear, toggle, test or compare bits, at 4, 8, 16, 32 or 64 bits. The width is always explicit where it matters, shifted-out bits are shown, and every result is also given as hex, octal, unsigned and two’s complement. Calculate. Convert. Understand.</p>' + tool +
  '<section id="examples"><h2>Worked examples</h2>' + tbl(['Operation', 'Result (binary)'], exRows) + '<p class="note">Results calculated by this page’s engine and checked against independent Python integer arithmetic.</p></section>' +
  '<section id="truth"><h2>Truth table for two bits</h2>' + tbl(['A', 'B', 'AND', 'OR', 'XOR', 'NAND', 'NOR', 'XNOR'], truth) + '</section>' +
  '<section id="masks"><h2>Common mask patterns</h2>' + tbl(['Goal', 'Operation', 'Mask (8 bits)'], [['Keep the low nibble', 'A AND mask', '00001111'], ['Keep the high nibble', 'A AND mask', '11110000'], ['Set bit n', 'A OR (1 << n)', '1 in position n'], ['Clear bit n', 'A AND NOT (1 << n)', '0 in position n, 1 elsewhere'], ['Toggle bit n', 'A XOR (1 << n)', '1 in position n'], ['Test bit n', 'A AND (1 << n), non-zero when set', '1 in position n'], ['Which bits differ', 'A XOR B', 'not needed'], ['Multiply by 2^n', 'A << n', 'no overflow if no 1 is shifted out'], ['Divide by 2^n, unsigned', 'A >> n (logical)', 'rounds down'], ['Divide by 2^n, signed', 'A >>> n (arithmetic)', 'rounds toward minus infinity']]) + '</section>' +
  '<section id="faq"><h2>Questions</h2>' + faq.map((q) => '<h3>' + esc(q[0]) + '</h3><p>' + esc(q[1]) + '</p>').join('') + '</section>' +
  '<section id="related"><h2>Related</h2><p><a class="chip" href="../binary-arithmetic-calculator/">Binary Calculator: Add, Subtract, Multiply and Divide</a><a class="chip" href="../number-system-converter/">Number System Converter</a><a class="chip" href="../signed-binary-calculator/">Signed Binary Calculator</a><a class="chip" href="../digital-logic-calculator/">Digital Logic Calculator</a><a class="chip" href="../bcd-converter/">BCD Converter</a><a class="chip" href="../gray-code-converter/">Gray Code Converter</a><a class="chip" href="../ascii-converter/">ASCII Converter</a><a class="chip" href="../engineering-mathematics/">Engineering Mathematics</a></p></section></main>';
const m1css = mode1.match(/<style>[\s\S]*?<\/style>/)[0].replace(/#ba /g, '#bo ').replace(/#ba\./g, '#bo.');
const css = m1css.replace('</style>', '#bo .ns-t th small{display:block;font:500 12px var(--body);color:var(--muted)}#bo .ns-t td{vertical-align:middle}#bo .tw{position:relative}#bo .ns-f[hidden]{display:none}' +
  '#bo table.bg{border-collapse:separate;border-spacing:0;font-family:var(--mono);margin:4px 0}#bo .bg th,#bo .bg td{min-width:30px;padding:6px 4px;text-align:center;border:1px solid var(--line);font:600 17px var(--mono);color:var(--muted)}#bo .bg th[scope=row]{position:sticky;left:0;z-index:1;background:var(--surface);min-width:64px;text-align:left;font:700 12px var(--body);color:var(--ink);padding:6px 8px}' +
  '#bo .bg td.on{color:var(--num);background:var(--field)}#bo .bg td.one{background:var(--gold-fill);color:var(--gold);border-color:var(--gold);font-weight:800}#bo .bg td.chg{outline:2px solid var(--orange);outline-offset:-2px}#bo .bg th.ix{font:500 11px var(--mono)}#bo .bg td.mk{font:600 12px var(--mono);color:var(--muted)}' +
  '#bo .bg .g{border-left:3px solid var(--navy-2)}#bo .bg .tg{box-shadow:inset 0 -3px 0 var(--orange)}#bo .bg th[scope=row]+.g{border-left:1px solid var(--line)}#bo .bg-w{margin-top:12px}</style>');
const client = fs.readFileSync(path.join(__dirname, 'bitops_client.js'), 'utf8'), engine = fs.readFileSync(path.join(__dirname, 'bitops_engine.js'), 'utf8');
const ld = '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Bitwise Operations Calculator', applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any (web browser)', description: DESC, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }) + '</script>';
let o2 = shell; const h0 = o2.indexOf('<style>');
o2 = o2.slice(0, h0) + css + o2.slice(o2.indexOf('</style>', h0) + 8);
o2 = o2.replace(/<title>.*?<\/title>/, '<title>' + esc(TITLE) + '</title>');
['name="description"', 'property="og:title"', 'property="og:description"', 'name="twitter:title"', 'name="twitter:description"'].forEach((k) => { const v = /title/.test(k) ? TITLE : DESC; o2 = o2.replace(new RegExp('(<meta ' + k + ' content=")[^"]*'), '$1' + esc(v)); });
o2 = o2.replace(/<main class="w">[\s\S]*?<\/main>/, () => body);
[...o2.matchAll(/<script>[\s\S]*?<\/script>/g)].filter((m) => /Elecmetric Scientific Calculator engine|Elecmetric Basic Calculator: page script/.test(m[0])).forEach((m) => { o2 = o2.replace(m[0], ''); });
o2 = o2.replace('</head>', () => ld + '</head>');
o2 = o2.replace('<script>try{if("serviceWorker"', () => '<script>' + engine + '\n' + client + '</script><script>try{if("serviceWorker"');
const dir = path.join(root, 'calculators/bitwise-operations-calculator'); fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'index.html'), o2); console.log('wrote calculators/bitwise-operations-calculator/index.html (' + o2.length + ' bytes)');
