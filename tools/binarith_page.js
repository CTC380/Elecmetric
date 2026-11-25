/* Builds calculators/binary-arithmetic-calculator/index.html (Binary Calculator, Mode 01: Binary Arithmetic). Run: node tools/binarith_page.js
   Takes the page shell from the Basic Calculator and the engine and script from tools/binarith_engine.js and tools/binarith_client.js. Example numbers are calculated by the engine at build time. */
const fs = require('fs'), path = require('path');
const B = require('./binarith_engine.js');
const root = path.join(__dirname, '..');
const shell = fs.readFileSync(path.join(root, 'calculators/basic-calculator/index.html'), 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const TITLE = 'Binary Calculator Online | Binary Addition, Subtraction & Conversion';
const DESC = 'Free online binary calculator. Add, subtract, multiply and divide binary numbers. Convert binary to decimal, octal and hexadecimal, perform bitwise operations and calculate two\u2019s complement.';
const run = (op, operands, pad) => { const r = B.run({ op, operands, pad }); if (!r.ok) throw new Error('page example failed ' + op + ' ' + operands + ': ' + r.error); return r; };
const ex = (label, d) => '<button type="button" class="chipb" data-ex="' + esc(JSON.stringify(d)) + '">' + esc(label) + '</button>';
const chips = [
  ex('1010 + 0101', { op: 'add', ops: ['1010', '0101'], pad: 'min' }),
  ex('1100 − 0101', { op: 'sub', ops: ['1100', '0101'], pad: 'match' }),
  ex('101 × 11', { op: 'mul', ops: ['101', '11'], pad: 'min' }),
  ex('1100 ÷ 0011', { op: 'div', ops: ['1100', '0011'], pad: 'match' }),
  ex('10 + 11 + 100', { op: 'add', ops: ['10', '11', '100'], pad: 'min' }),
  ex('101 − 1100 (negative)', { op: 'sub', ops: ['101', '1100'], pad: 'min' }),
  ex('110101 ÷ 101 (remainder)', { op: 'div', ops: ['110101', '101'], pad: 'min' }),
  ex('−111 × 11', { op: 'mul', ops: ['-111', '11'], pad: 'min' })].join('');
const opOpts = B.OPS.map((o) => '<option value="' + o[0] + '"' + (o[0] === 'add' ? ' selected' : '') + '>' + esc(o[2] + ' (' + o[1] + ')') + '</option>').join('');
const padOpts = [['min', 'Shortest (no leading zeros)'], ['match', 'Match the longest number entered'], ['4', 'At least 4 bits'], ['8', 'At least 8 bits'], ['16', 'At least 16 bits'], ['32', 'At least 32 bits'], ['64', 'At least 64 bits']].map((o) => '<option value="' + o[0] + '">' + esc(o[1]) + '</option>').join('');
const key = (k, label, aria) => '<button type="button" class="btn2 kp" data-k="' + k + '" aria-label="' + aria + '">' + label + '</button>';
const tool =
  '<div id="ba"><section class="card ns-card" aria-label="Binary arithmetic calculator">' +
  '<div class="ns-grid bag"><div class="ns-f"><label for="ba-op" class="ns-l">Operation</label><select id="ba-op" class="ns-sel">' + opOpts + '</select></div>' +
  '<div class="ns-f"><label for="ba-pad" class="ns-l">Show result as</label><select id="ba-pad" class="ns-sel">' + padOpts + '</select></div></div>' +
  '<div id="ba-ops" class="ba-ops"></div>' +
  '<p class="note ns-msg" id="ba-err" role="status"></p>' +
  '<div class="ns-act"><button type="button" class="btn2" id="ba-add" data-act="add">Add a number</button><button type="button" class="btn2" data-act="swap">Swap first two</button><button type="button" class="btn2" data-act="reset">Reset</button><button type="button" class="btn2" data-act="save">Save to history</button></div>' +
  '<div class="ba-kp" role="group" aria-label="Keypad: inserts into the field you last used">' + key('0', '0', 'Insert 0') + key('1', '1', 'Insert 1') + key('-', '±', 'Change sign') + key('back', '⌫', 'Delete last digit') + key('clear', 'Clear', 'Clear the field') + '</div>' +
  '<div class="ns-try"><span class="ns-l">Try</span> ' + chips + '</div>' +
  '<div id="ba-out" aria-live="polite"></div>' +
  '<div id="ba-dl" class="ns-act" hidden><span class="ns-l ba-dll">Download</span><button type="button" class="btn2" data-dl="txt">TXT</button><button type="button" class="btn2" data-dl="csv">CSV</button><button type="button" class="btn2" data-dl="json">JSON</button></div>' +
  '<p class="sr-only" id="ba-note" role="status" aria-live="polite"></p>' +
  '<noscript><p class="note">The calculator needs JavaScript. Nothing is sent anywhere.</p></noscript></section>' +
  '<section class="card"><h2>Working</h2><div id="ba-steps"></div></section>' +
  '<section class="card"><h2>History</h2><ul class="ba-hist" id="ba-hist"></ul><button type="button" class="btn2" id="ba-hclear" data-act="hclear" hidden>Clear history</button><p class="note">Kept only in this browser. Up to 10 calculations.</p></section></div>';
const tbl = (head, rows) => '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + head.join(', ') + '"><table><thead><tr>' + head.map((h) => '<th>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows.map((r) => '<tr>' + r.map((c) => '<td class="n">' + esc(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
const exRows = [
  ['1010 + 0101', 'add', ['1010', '0101'], 'match'], ['1100 − 0101', 'sub', ['1100', '0101'], 'match'], ['101 × 11', 'mul', ['101', '11'], 'min'], ['1100 ÷ 0011', 'div', ['1100', '0011'], 'match'],
  ['10 + 11 + 100', 'add', ['10', '11', '100'], 'min'], ['101 − 1100', 'sub', ['101', '1100'], 'min'], ['−111 ÷ 10', 'div', ['-111', '10'], 'min']
].map(([l, op, ops, pad]) => { const r = run(op, ops, pad); return [l, r.result.padded + (r.remainder ? ' remainder ' + r.remainder.padded : ''), r.result.dec + (r.remainder ? ' remainder ' + r.remainder.dec : '')]; });
const faq = [
  ['How do you add binary numbers?', 'Work from the right, one column at a time. 0 + 0 = 0, 0 + 1 = 1, 1 + 1 = 10 (write 0 and carry 1) and 1 + 1 + 1 = 11 (write 1 and carry 1). The calculator shows the carry row above each column, so 1101 + 1011 = 11000 can be followed digit by digit.'],
  ['How does binary subtraction work, and what if the answer is negative?', 'Subtract column by column from the right. When a column needs 0 − 1, borrow 1 from the next column to the left. If B is larger than A, the calculator subtracts the smaller number from the larger and puts a minus sign in front, so 101 − 1100 = −111 (5 − 12 = −7).'],
  ['How is binary multiplication done?', 'Each bit of the multiplier gives one partial product: the multiplicand if the bit is 1, or zero if the bit is 0, shifted one place further left for each bit. The partial products are then added. The working table shows every row.'],
  ['What happens to the remainder in binary division?', 'It is reported, not discarded. 110101 ÷ 101 gives quotient 1010 and remainder 11 (53 ÷ 5 = 10 remainder 3), and the check Q × B + R = A is shown. Division truncates toward zero, and the remainder takes the sign of the dividend.'],
  ['How large can the numbers be?', 'Up to ' + B.MAXD + ' binary digits each, with up to ' + B.MAXN + ' numbers for addition, subtraction and multiplication. The arithmetic is exact (arbitrary precision), so a very long number never overflows or loses digits. Division takes exactly two numbers.'],
  ['Do leading zeros matter?', 'Not for the value: 0101 and 101 are both 5. They matter only for display. Choose “Match the longest number entered” to keep a fixed number of digits (1010 + 0101 = 1111, 1100 − 0101 = 0111) or a minimum of 4 to 64 bits. A result that needs more bits is always shown in full; nothing is cut off.'],
  ['How are negative numbers written?', 'With a minus sign in front of the magnitude (sign and magnitude), for example −101 is −5. This is not the same as a fixed-width two’s complement pattern, where the same bits such as 11111111 mean 255 unsigned but −1 in 8-bit two’s complement. For fixed-width registers, wrap-around and overflow flags use the Binary Calculator and Logic Gates page.'],
  ['Can I convert to decimal, hexadecimal and octal?', 'Every operand and result is shown in binary, decimal, hexadecimal and octal, with the place-value expansion for short numbers (1010 = 8 + 2 = 10). To enter decimal, hexadecimal or octal values, or to convert fractions, use the Number System Converter.'],
  ['Is anything sent to a server?', 'No. The calculation runs in your browser, and the history list is stored only in your browser.']
];
const body = '<main class="w"><h1>Binary Calculator: Add, Subtract, Multiply and Divide</h1><p class="lede">Enter binary numbers of any length and add, subtract, multiply or divide them. Use more than two numbers, negative values and leading zeros; division shows the quotient and the remainder. Every operand and result is shown in binary, decimal, hexadecimal and octal, with the carries, borrows, partial products and long division written out. Calculate. Convert. Understand.</p>' + tool +
  '<section id="examples"><h2>Worked examples</h2>' + tbl(['Calculation', 'Binary result', 'Decimal'], exRows) + '<p class="note">Results calculated by this page’s engine and checked against independent Python integer arithmetic.</p></section>' +
  '<section id="rules"><h2>The four rules at a glance</h2>' + tbl(['Operation', 'Rule per column', 'Example'], [['Addition', '0+0=0, 0+1=1, 1+1=10 (carry 1), 1+1+1=11 (carry 1)', '1010 + 0101 = 1111'], ['Subtraction', '1−1=0, 1−0=1, 0−0=0, 0−1 = 1 with a borrow', '1100 − 0101 = 0111'], ['Multiplication', 'A copy of the multiplicand for each 1 bit, shifted left, then added', '101 × 11 = 1111'], ['Division', 'Bring down a bit; subtract the divisor when it fits (write 1), else write 0', '1100 ÷ 0011 = 0100 remainder 0']]) + '</section>' +
  '<section id="faq"><h2>Questions</h2>' + faq.map((q) => '<h3>' + esc(q[0]) + '</h3><p>' + esc(q[1]) + '</p>').join('') + '</section>' +
  '<section id="related"><h2>Related</h2><p><a class="chip" href="../number-system-converter/">Number System Converter</a><a class="chip" href="../../converters/number-base-converter.html">Number base converter</a><a class="chip" href="../bcd-converter/">BCD Converter</a><a class="chip" href="../gray-code-converter/">Gray Code Converter</a><a class="chip" href="../boolean-logic/">Boolean Logic</a><a class="chip" href="../engineering-mathematics/">Engineering Mathematics</a><a class="chip" href="../../converters/index.html">Conversion Centre</a></p></section></main>';
const css = '<style>#ba .ns-card{padding:16px}#ba .ns-grid{display:grid;gap:12px;grid-template-columns:1fr 1fr}#ba .ns-l,#ba label.ns-l{display:block;font-weight:600;font-size:13px;margin:0 0 4px}#ba .ns-in,#ba .ns-sel{display:block;width:100%;box-sizing:border-box;font:500 18px/1.3 var(--mono);padding:10px 12px;min-height:48px;border-radius:8px;border:1px solid var(--line);background:var(--field);color:var(--ink)}#ba .ns-sel{font:500 15px var(--body)}#ba .ns-in:focus,#ba .ns-sel:focus{outline:2px solid var(--gold);outline-offset:1px}#ba .ns-in.bad{border-color:var(--err)}#ba .ns-msg{min-height:1.4em;margin:8px 0 4px;color:var(--err)}#ba .ns-act{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:4px 0 10px}#ba .btn2,#ba .chipb{font:600 13px var(--body);color:var(--ink);background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:8px 12px;min-height:38px;cursor:pointer}#ba .btn2:hover,#ba .chipb:hover{background:var(--field)}#ba .chipb{border-radius:999px;padding:5px 12px;min-height:32px;font-weight:500;margin:3px 4px 3px 0}#ba .btn2:focus-visible,#ba .chipb:focus-visible{outline:2px solid var(--gold);outline-offset:2px}#ba .ns-try{margin:0 0 12px}' +
  '#ba .ba-ops{display:grid;gap:10px;margin-top:12px}#ba .ba-row{display:flex;gap:8px;align-items:flex-end}#ba .ba-row .ns-f{flex:1;min-width:0}#ba .ba-kp{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}#ba .kp{min-width:56px;min-height:44px;font:700 18px var(--mono)}#ba .ba-dll{margin:0}' +
  '#ba pre.al{font:600 15px/1.6 var(--mono);background:var(--field);border:1px solid var(--line);border-radius:8px;padding:12px 14px;margin:6px 0 12px;overflow-x:auto;color:var(--num);white-space:pre}#ba .res .big{font:700 28px/1.3 var(--mono);color:var(--num);word-break:break-all}#ba .res .big .btn2,#ba .res .sub .btn2{vertical-align:middle;margin-left:8px;padding:2px 8px;min-height:28px}#ba .res .sub{color:var(--muted);margin:2px 0 8px;word-break:break-all}' +
  '#ba .ns-t td.r{font:600 15px var(--mono);color:var(--num);word-break:break-all;text-align:left}#ba .ns-t td.r small{display:block;font:500 12px var(--mono);color:var(--muted)}#ba .ns-t tr.cu td,#ba .ns-t tr.cu th{background:var(--gold-fill)}#ba .ns-t th[scope=row]{text-align:left;white-space:nowrap}#ba .ns-facts{margin:12px 0;display:flex;flex-wrap:wrap;gap:6px 18px;font-size:14px}#ba .ns-facts b{font-family:var(--mono)}' +
  '#ba .bits{display:flex;flex-wrap:wrap;gap:4px;margin:14px 0 4px}#ba .bit{display:flex;flex-direction:column;align-items:center;min-width:34px;padding:4px 2px;border:1px solid var(--line);border-radius:6px;background:var(--field)}#ba .bit.sg{border-color:var(--gold);background:var(--gold-fill)}#ba .bit i{font:11px var(--mono);color:var(--muted);font-style:normal}#ba .bit b{font:700 20px var(--mono);color:var(--num)}#ba h3{margin:14px 0 4px}#ba .ba-hist{list-style:none;margin:0 0 8px;padding:0}.sr-only{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}code{font-family:var(--mono)}[hidden]{display:none!important}@media(max-width:700px){#ba .ns-grid{grid-template-columns:1fr}#ba .res .big{font-size:22px}}</style>';
const client = fs.readFileSync(path.join(__dirname, 'binarith_client.js'), 'utf8');
const engine = fs.readFileSync(path.join(__dirname, 'binarith_engine.js'), 'utf8');
const ld = '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Binary Arithmetic Calculator', applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any (web browser)', description: DESC, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }) + '</script>';
let out = shell;
const h0 = out.indexOf('<style>');
out = out.slice(0, h0) + css + out.slice(out.indexOf('</style>', h0) + 8);
out = out.replace(/<title>.*?<\/title>/, '<title>' + esc(TITLE) + '</title>');
['name="description"', 'property="og:title"', 'property="og:description"', 'name="twitter:title"', 'name="twitter:description"'].forEach((k) => { const v = /title/.test(k) ? TITLE : DESC; out = out.replace(new RegExp('(<meta ' + k + ' content=")[^"]*'), '$1' + esc(v)); });
out = out.replace(/<main class="w">[\s\S]*?<\/main>/, () => body);
[...out.matchAll(/<script>[\s\S]*?<\/script>/g)].filter((m) => /Elecmetric Scientific Calculator engine|Elecmetric Basic Calculator: page script/.test(m[0])).forEach((m) => { out = out.replace(m[0], ''); });
out = out.replace('</head>', () => ld + '</head>');
out = out.replace('<script>try{if("serviceWorker"', () => '<script>' + engine + '\n' + client + '</script><script>try{if("serviceWorker"');
const dir = path.join(root, 'calculators/binary-arithmetic-calculator');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'index.html'), out);
console.log('wrote calculators/binary-arithmetic-calculator/index.html (' + out.length + ' bytes)');
