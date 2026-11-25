/* Builds calculators/number-system-converter/index.html (Binary Calculator, Mode 02: Number System Conversion). Run: node tools/numconv_page.js
   Takes the page shell from the Basic Calculator, the style block from the built Mode 01 page (calculators/binary-arithmetic-calculator/index.html, ids renamed),
   and the engine and script from tools/numconv_engine.js and tools/numconv_client.js. Every example number is calculated by the engine at build time. */
const fs = require('fs'), path = require('path');
const C = require('./numconv_engine.js');
const root = path.join(__dirname, '..');
const shell = fs.readFileSync(path.join(root, 'calculators/basic-calculator/index.html'), 'utf8');
const mode1 = fs.readFileSync(path.join(root, 'calculators/binary-arithmetic-calculator/index.html'), 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const TITLE = 'Number System Converter | Binary, Decimal, Octal & Hex Converter';
const DESC = 'Free number system converter with step-by-step working. Convert binary, decimal, octal and hexadecimal, including fractions, very large integers and fixed-width two’s complement, one’s complement and sign-magnitude.';
const run = (o) => { const r = C.run(o); if (!r.ok) throw new Error('page example failed ' + JSON.stringify(o) + ': ' + r.error); return r; };
const ex = (label, d) => '<button type="button" class="chipb" data-ex="' + esc(JSON.stringify(d)) + '">' + esc(label) + '</button>';
const D = { rep: 'signed', width: '8', fracDigits: '16', pad: 'min', grp: '0' };
const chips = [
  ex('10101010 (binary)', Object.assign({}, D, { from: 'bin', to: 'all', text: '10101010' })),
  ex('170 to binary', Object.assign({}, D, { from: 'dec', to: 'bin', text: '170' })),
  ex('FF to binary', Object.assign({}, D, { from: 'hex', to: 'bin', text: 'FF' })),
  ex('77 octal to binary', Object.assign({}, D, { from: 'oct', to: 'bin', text: '77' })),
  ex('101.101 to decimal', Object.assign({}, D, { from: 'bin', to: 'dec', text: '101.101' })),
  ex('0.1 to binary (repeating)', Object.assign({}, D, { from: 'dec', to: 'bin', text: '0.1' })),
  ex('11111111 unsigned', Object.assign({}, D, { from: 'bin', to: 'dec', text: '11111111', rep: 'unsigned' })),
  ex('11111111 two’s complement', Object.assign({}, D, { from: 'bin', to: 'dec', text: '11111111', rep: 'twos' })),
  ex('−5 as 8-bit two’s complement', Object.assign({}, D, { from: 'dec', to: 'bin', text: '-5', rep: 'twos' }))].join('');
const opt = (v, t, sel) => '<option value="' + v + '"' + (sel ? ' selected' : '') + '>' + esc(t) + '</option>';
const sysOpts = (sel) => C.SYS.map((d) => opt(d[0], d[2] + ' (base ' + d[1] + ')', d[0] === sel)).join('');
const toOpts = opt('all', 'All systems', true) + C.SYS.map((d) => opt(d[0], d[2], false)).join('');
const repOpts = C.REPS.map((d) => opt(d[0], d[1], d[0] === 'signed')).join('');
const wOpts = C.WIDTHS.map((w) => opt(String(w), w + ' bits', w === 8)).join('');
const nOpts = C.FRACS.map((n) => opt(String(n), n + ' digits', n === 16)).join('');
const padOpts = [['min', 'Shortest (no leading zeros)'], ['match', 'Match the width typed'], ['4', 'At least 4 bits'], ['8', 'At least 8 bits'], ['16', 'At least 16 bits'], ['32', 'At least 32 bits'], ['64', 'At least 64 bits']].map((o) => opt(o[0], o[1], o[0] === 'min')).join('');
const grpOpts = [['0', 'No grouping'], ['4', 'Groups of 4 (nibbles)'], ['8', 'Groups of 8 (bytes)']].map((o) => opt(o[0], o[1], o[0] === '0')).join('');
const field = (id, label, html, extra) => '<div class="ns-f"' + (extra || '') + '><label for="' + id + '" class="ns-l">' + label + '</label>' + html + '</div>';
const tool =
  '<div id="nc"><section class="card ns-card" aria-label="Number system converter">' +
  '<div class="ns-grid">' + field('nc-from', 'Convert from', '<select id="nc-from" class="ns-sel">' + sysOpts('bin') + '</select>') + field('nc-to', 'Convert to', '<select id="nc-to" class="ns-sel">' + toOpts + '</select>') + '</div>' +
  '<div class="ns-f" style="margin-top:12px"><label for="nc-in" class="ns-l">Number</label><input id="nc-in" class="ns-in" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" aria-describedby="nc-hint nc-err" value="10101010"></div>' +
  '<p class="note" id="nc-hint"></p>' +
  '<div class="ns-grid" style="margin-top:8px">' + field('nc-rep', 'Number representation', '<select id="nc-rep" class="ns-sel">' + repOpts + '</select>') + field('nc-w', 'Bit width', '<select id="nc-w" class="ns-sel">' + wOpts + '</select>', ' id="nc-wrap-w" hidden') +
  field('nc-n', 'Fraction digits when it does not end', '<select id="nc-n" class="ns-sel">' + nOpts + '</select>', ' id="nc-wrap-n"') + field('nc-pad', 'Leading zeros', '<select id="nc-pad" class="ns-sel">' + padOpts + '</select>', ' id="nc-wrap-pad"') + field('nc-grp', 'Group binary digits', '<select id="nc-grp" class="ns-sel">' + grpOpts + '</select>') + '</div>' +
  '<p class="note ns-msg" id="nc-err" role="status"></p>' +
  '<div class="ba-kp" id="nc-kp" role="group" aria-label="Keypad: inserts at the end of the number"></div>' +
  '<div class="ns-act"><button type="button" class="btn2" data-act="swap">Swap systems</button><button type="button" class="btn2" data-act="reset">Reset</button><button type="button" class="btn2" data-act="save">Save to history</button></div>' +
  '<div class="ns-try"><span class="ns-l">Try</span> ' + chips + '</div>' +
  '<div id="nc-out" aria-live="polite"></div>' +
  '<div id="nc-dl" class="ns-act" hidden><span class="ns-l ba-dll">Download</span><button type="button" class="btn2" data-dl="txt">TXT</button><button type="button" class="btn2" data-dl="csv">CSV</button><button type="button" class="btn2" data-dl="json">JSON</button></div>' +
  '<p class="sr-only" id="nc-note" role="status" aria-live="polite"></p>' +
  '<noscript><p class="note">The converter needs JavaScript. This tool does not submit calculator inputs to Elecmetric.</p></noscript></section>' +
  '<section class="card"><h2>Working</h2><div id="nc-steps"></div></section>' +
  '<section class="card"><h2>History</h2><ul class="ba-hist" id="nc-hist"></ul><button type="button" class="btn2" id="nc-hclear" data-act="hclear" hidden>Clear history</button><p class="note">Kept only in this browser. Up to 10 conversions.</p></section></div>';
const tbl = (head, rows) => '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + head.join(', ') + '"><table><thead><tr>' + head.map((h) => '<th>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows.map((r) => '<tr>' + r.map((c) => '<td class="n">' + esc(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
const o = (from, text, id, extra) => run(Object.assign({ from, text }, extra || {})).outputs[id];
const shownText = (x) => x.text + (x.approx ? '…' : '');
const exRows = [
  ['Binary 10101010 to decimal', o('bin', '10101010', 'dec')], ['Decimal 170 to binary', o('dec', '170', 'bin')], ['Binary 10101010 to octal', o('bin', '10101010', 'oct')], ['Binary 10101010 to hexadecimal', o('bin', '10101010', 'hex')],
  ['Hexadecimal FF to binary', o('hex', 'FF', 'bin')], ['Octal 77 to binary', o('oct', '77', 'bin')], ['Binary 101.101 to decimal', o('bin', '101.101', 'dec')], ['Decimal 255.5 to hexadecimal', o('dec', '255.5', 'hex')],
  ['Decimal 0.1 to binary (first 16 digits)', o('dec', '0.1', 'bin')], ['Binary 11111111 as unsigned 8-bit, in decimal', o('bin', '11111111', 'dec', { rep: 'unsigned', width: 8 })], ['Binary 11111111 as 8-bit two’s complement, in decimal', o('bin', '11111111', 'dec', { rep: 'twos', width: 8 })],
  ['Decimal −5 as 8-bit two’s complement, in binary', o('dec', '-5', 'bin', { rep: 'twos', width: 8 })]
].map(([l, x]) => [l, shownText(x) + (x.repeat ? ' (exact: ' + x.repeat + ')' : '')]);
const refRows = Array.from({ length: 16 }, (_, i) => [String(i), i.toString(2).padStart(4, '0'), i.toString(8), i.toString(16).toUpperCase()]);
const faq = [
  ['How do I convert binary to decimal?', 'Give each bit its place value, a power of 2 counted from the right (1, 2, 4, 8, …), and add the values of the bits that are 1. 10101010 = 128 + 32 + 8 + 2 = 170. The page writes the digits, weights and values in a table, and does the same with powers of 8 and 16 for octal and hexadecimal.'],
  ['How do I convert decimal to binary?', 'Divide the number by 2 again and again, writing down each remainder, until the quotient is 0. Read the remainders from the last to the first. 170 gives 10101010. For octal divide by 8, for hexadecimal by 16 (remainders 10 to 15 are the digits A to F). The working table shows every division.'],
  ['How are binary, octal and hexadecimal related?', 'Octal digits stand for 3 bits and hexadecimal digits for 4, so these three convert by grouping, with no arithmetic. Group the bits from the radix point: 1010 1010 is AA in hexadecimal and 010 101 010 is 252 in octal. Converting octal to hexadecimal goes through the bits.'],
  ['Why does 0.1 never end in binary?', 'A fraction ends in a base only if its denominator, in lowest terms, has no prime factors other than those of the base. 1/10 has a factor 5, which 2 does not have, so 0.1 is 0.0001100110011… with the block 0011 repeating. This page cuts such results off at the digit count you choose (8 to 128), truncated and never rounded, marks them with …, and shows the exact repeating form, 0.0(0011).'],
  ['What does 11111111 mean?', 'It depends on the representation, which is why you choose one. As an unsigned 8-bit number it is 255. As 8-bit two’s complement it is −1. As 8-bit one’s complement it is −0 and as sign-magnitude it is −127. In fixed-width mode the page shows all four readings of the same bits and marks the one you selected.'],
  ['How are negative numbers converted?', 'In the default mode the minus sign is kept in front of the digits (−5 is −101 in binary). To get a bit pattern for a negative number, choose two’s complement, one’s complement or sign-magnitude and a width of 4, 8, 16, 32 or 64 bits, and enter a signed decimal value. A value outside the range, such as 128 in 8-bit two’s complement, is refused and the range is given; it is never wrapped around.'],
  ['How large can the numbers be?', 'Up to ' + C.MAXD + ' digits, with up to ' + C.MAXFD + ' digits after the radix point. The arithmetic is exact (arbitrary precision), so a long number never overflows or loses digits. Fixed-width modes take whole numbers only.'],
  ['Can I type a prefix or group the digits?', 'Yes. 0b, 0o and 0x prefixes (for binary, octal and hexadecimal), spaces and underscores are accepted, and hexadecimal letters can be upper or lower case. Binary results can be shown in groups of 4 or 8 for reading; the Copy buttons give the plain digits.'],
  ['Is anything sent to a server?', 'No. The conversion runs in your browser, and the history list is stored only in your browser.']
];
const body = '<main class="w"><h1>Number System Converter: Binary, Decimal, Octal and Hexadecimal</h1><p class="lede">Convert whole numbers and fractions between binary, decimal, octal and hexadecimal, exactly and at any size. Fractions that never end are cut off at a digit count you choose, marked, and given as an exact repeating block. For negative numbers, choose a clear representation: a minus sign, or fixed-width two’s complement, one’s complement or sign-magnitude. Every conversion is written out step by step. Calculate. Convert. Understand.</p>' + tool +
  '<section id="examples"><h2>Worked examples</h2>' + tbl(['Conversion', 'Result'], exRows) + '<p class="note">Results calculated by this page’s engine and checked against independent Python integer and fraction arithmetic.</p></section>' +
  '<section id="reference"><h2>Reference table: 0 to 15</h2>' + tbl(['Decimal', 'Binary', 'Octal', 'Hexadecimal'], refRows) + '</section>' +
  '<section id="methods"><h2>The methods at a glance</h2>' + tbl(['Conversion', 'Method', 'Example'], [['Binary, octal or hex to decimal', 'Add digit × place value (powers of 2, 8 or 16)', '1010 = 8 + 2 = 10'], ['Decimal to binary, octal or hex', 'Divide repeatedly by 2, 8 or 16; read the remainders upward', '10 ÷ 2: remainders 0, 1, 0, 1 give 1010'], ['Binary to octal or hex', 'Group the bits in 3 or 4 from the radix point', '1010 1010 = AA'], ['Octal or hex to binary', 'Write each digit as 3 or 4 bits', 'F = 1111'], ['Decimal fraction to binary, octal or hex', 'Multiply the fraction by 2, 8 or 16 repeatedly; the whole parts are the digits', '0.625 × 2 = 1.25 → 1, 0.25 × 2 = 0.5 → 0, 0.5 × 2 = 1.0 → 1: 0.101'], ['Binary fraction to decimal', 'Add digit × 2^-k for each place after the point', '0.101 = 0.5 + 0.125 = 0.625']]) + '</section>' +
  '<section id="faq"><h2>Questions</h2>' + faq.map((q) => '<h3>' + esc(q[0]) + '</h3><p>' + esc(q[1]) + '</p>').join('') + '</section>' +
  '<section id="related"><h2>Related</h2><p><a class="chip" href="../binary-arithmetic-calculator/">Binary Calculator: Add, Subtract, Multiply and Divide</a><a class="chip" href="../../converters/number-base-converter.html">Number base converter</a><a class="chip" href="../bcd-converter/">BCD Converter</a><a class="chip" href="../gray-code-converter/">Gray Code Converter</a><a class="chip" href="../ascii-converter/">ASCII Converter</a><a class="chip" href="../engineering-mathematics/">Engineering Mathematics</a><a class="chip" href="../../converters/index.html">Conversion Centre</a></p></section></main>';
/* style: the Mode 01 style block with its page id renamed, plus the few rules this page adds */
const m1css = mode1.match(/<style>[\s\S]*?<\/style>/)[0].replace(/#ba /g, '#nc ').replace(/#ba\./g, '#nc.');
const css = m1css.replace('</style>', '#nc .ns-t th small{display:block;font:500 12px var(--body);color:var(--muted);white-space:normal}#nc .ns-t td.r small{margin-top:2px}#nc .ns-t td{vertical-align:middle}#nc .ba-kp .kp{min-width:48px}#nc .ns-f[hidden]{display:none}</style>');
const client = fs.readFileSync(path.join(__dirname, 'numconv_client.js'), 'utf8');
const engine = fs.readFileSync(path.join(__dirname, 'numconv_engine.js'), 'utf8');
const ld = '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Number System Converter', applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any (web browser)', description: DESC, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }) + '</script>';
let out = shell;
const h0 = out.indexOf('<style>');
out = out.slice(0, h0) + css + out.slice(out.indexOf('</style>', h0) + 8);
out = out.replace(/<title>.*?<\/title>/, '<title>' + esc(TITLE) + '</title>');
['name="description"', 'property="og:title"', 'property="og:description"', 'name="twitter:title"', 'name="twitter:description"'].forEach((k) => { const v = /title/.test(k) ? TITLE : DESC; out = out.replace(new RegExp('(<meta ' + k + ' content=")[^"]*'), '$1' + esc(v)); });
out = out.replace(/<main class="w">[\s\S]*?<\/main>/, () => body);
[...out.matchAll(/<script>[\s\S]*?<\/script>/g)].filter((m) => /Elecmetric Scientific Calculator engine|Elecmetric Basic Calculator: page script/.test(m[0])).forEach((m) => { out = out.replace(m[0], ''); });
out = out.replace('</head>', () => ld + '</head>');
out = out.replace('<script>try{if("serviceWorker"', () => '<script>' + engine + '\n' + client + '</script><script>try{if("serviceWorker"');
const dir = path.join(root, 'calculators/number-system-converter');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'index.html'), out);
console.log('wrote calculators/number-system-converter/index.html (' + out.length + ' bytes)');
