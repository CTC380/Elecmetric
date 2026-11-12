/* Builds calculators/scientific-calculator/index.html.
   Every example number on the page is calculated by tools/scicalc_engine.js at build time, so the text cannot drift from the calculator.
   The engine and tools/scicalc_client.js are inlined into the page, so the page runs the same code the tests run. */
const fs = require('fs'), path = require('path');
const S = require('./scicalc_engine.js');

const SLUG = 'scientific-calculator';
const NAME = 'Scientific Calculator Online';
const DESC = 'Free online scientific calculator for electrical engineers and students: trigonometry, logarithms, powers, roots, complex numbers and phasors.';
const DEFAULT_EXPR = 'sqrt(144)+sin(30)';

function vectorCounts() {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tests', 'scicalc_vectors.json'), 'utf8'));
    return { n: j.vectors.length, polar: j.polar.length };
  } catch (e) { return { n: 0, polar: 0 }; }
}

function build(h) {
  const { page, esc, table, faqHtml, calcLd, HEADC, FOOTC, calcUrl, BASE } = h;
  const ev = (expr, o) => {
    const oo = Object.assign({ digits: 10 }, o || {}), r = S.evaluate(expr, oo);
    if (!r.ok) throw new Error('scientific calculator page example failed: ' + expr + ': ' + r.error);
    return { r, f: S.format(r.value, oo), o: oo };
  };
  const val = (expr, o) => ev(expr, o).f.text;
  const VC = vectorCounts();

  /* ---------- keypad ---------- */
  const K = (label, ins, aria, cls) => '<button type="button" class="k ' + (cls || '') + '" data-ins="' + esc(ins) + '"' + (aria ? ' aria-label="' + esc(aria) + '"' : '') + '>' + esc(label) + '</button>';
  const A = (label, act, aria, cls) => '<button type="button" class="k ' + (cls || '') + '" data-act="' + act + '"' + (aria ? ' aria-label="' + esc(aria) + '"' : '') + '>' + esc(label) + '</button>';
  const fnKeys = [
    K('sin', 'sin(', 'sine', 'fn'), K('cos', 'cos(', 'cosine', 'fn'), K('tan', 'tan(', 'tangent', 'fn'), K('ln', 'ln(', 'natural logarithm', 'fn'), K('log', 'log(', 'logarithm base 10', 'fn'),
    K('sin\u207b\u00b9', 'asin(', 'inverse sine', 'fn'), K('cos\u207b\u00b9', 'acos(', 'inverse cosine', 'fn'), K('tan\u207b\u00b9', 'atan(', 'inverse tangent', 'fn'), K('e\u02e3', 'e^', 'e to the power', 'fn'), K('10\u02e3', '10^', '10 to the power', 'fn'),
    K('sinh', 'sinh(', 'hyperbolic sine', 'fn'), K('cosh', 'cosh(', 'hyperbolic cosine', 'fn'), K('tanh', 'tanh(', 'hyperbolic tangent', 'fn'), K('\u221a', 'sqrt(', 'square root', 'fn'), K('x\u00b2', '^2', 'square', 'fn'),
    K('x\u02b8', '^', 'power', 'fn'), K('\u02b8\u221ax', 'root(', 'nth root: enter the number, a comma, then the root', 'fn'), K('n!', '!', 'factorial', 'fn'), A('1/x', 'recip', 'reciprocal', 'fn'), K('%', '%', 'percent', 'fn'),
    K('\u03c0', 'pi', 'pi', 'fn'), K('e', 'e', 'Euler\u2019s number e', 'fn'), K('EXP', 'E', 'times ten to the power', 'fn'), K('Ans', 'ans', 'previous answer', 'fn'), K('RND', 'rnd', 'random number', 'fn'),
    K('log\u2082', 'log2(', 'logarithm base 2', 'fn'), K('log\u2093', 'logb(', 'logarithm to any base: enter the number, a comma, then the base', 'fn'), K('nCr', 'ncr(', 'combinations', 'fn'), K('nPr', 'npr(', 'permutations', 'fn'), K('mod', 'mod(', 'remainder', 'fn'),
    A('MC', 'mc', 'memory clear', 'mem'), A('MR', 'mr', 'memory recall', 'mem'), A('MS', 'ms', 'memory store', 'mem'), A('M+', 'mp', 'add to memory', 'mem'), A('M\u2212', 'mm', 'subtract from memory', 'mem')
  ].join('');
  const numKeys = [
    A('AC', 'ac', 'clear all', 'op'), A('\u232b', 'del', 'backspace', 'op'), K('(', '(', 'open bracket', 'op'), K(')', ')', 'close bracket', 'op'),
    K('7', '7', '', 'n'), K('8', '8', '', 'n'), K('9', '9', '', 'n'), K('\u00f7', '/', 'divide', 'op'),
    K('4', '4', '', 'n'), K('5', '5', '', 'n'), K('6', '6', '', 'n'), K('\u00d7', '*', 'multiply', 'op'),
    K('1', '1', '', 'n'), K('2', '2', '', 'n'), K('3', '3', '', 'n'), K('\u2212', '-', 'minus', 'op'),
    K('0', '0', '', 'n'), K('.', '.', 'decimal point', 'n'), K(',', ',', 'comma between values', 'n'), A('\u00b1', 'neg', 'plus or minus', 'op'),
    K('+', '+', 'plus', 'op'), A('=', 'eq', 'equals', 'eq wide')
  ].join('');
  const engKeys = [
    K('j', 'j', 'imaginary unit j', 'fn'), K('\u2220', '\u2220', 'polar angle: magnitude, then angle', 'fn'), K('\u00b0', '\u00b0', 'degrees', 'fn'), K('atan2', 'atan2(', 'angle from y and x: enter y, a comma, then x', 'fn'),
    K('re', 're(', 'real part', 'fn'), K('im', 'im(', 'imaginary part', 'fn'), K('|z|', 'abs(', 'magnitude', 'fn'), K('arg', 'arg(', 'phase angle', 'fn'), K('conj', 'conj(', 'complex conjugate', 'fn'), K('par', 'par(', 'parallel combination of impedances', 'fn'),
    K('G', 'G', 'giga, times a billion', 'fn'), K('M', 'M', 'mega, times a million', 'fn'), K('k', 'k', 'kilo, times a thousand', 'fn'), K('m', 'm', 'milli, divide by a thousand', 'fn'), K('\u00b5', '\u00b5', 'micro, divide by a million', 'fn'), K('n', 'n', 'nano', 'fn'), K('p', 'p', 'pico', 'fn')
  ].join('');
  const chip = (label, expr, extra) => '<button type="button" class="chipb" data-ex="' + esc(expr) + '"' + (extra || '') + '>' + esc(label) + '</button>';
  const stdChips = [['sin(30)', 'sin(30)'], ['log(1000)', 'log(1000)'], ['5!', '5!'], ['\u221a144', 'sqrt(144)'], ['2\u00b9\u2070', '2^10'], ['ln(e)', 'ln(e)'], ['15% of 200', '200*15%'], ['sin\u207b\u00b9(0.5)', 'asin(0.5)']].map((c) => chip(c[0], c[1], ' data-m="std"')).join('');
  const engChips = [
    ['Z = 10 + j15 \u03a9', '10+j15', ' data-m="eng" data-u="\u03a9" data-d="5"'],
    ['R and L in series at 50 Hz', '10+j*2*pi*50*0.1', ' data-m="eng" data-u="\u03a9" data-d="5"'],
    ['Capacitor at 50 Hz', '1/(j*2*pi*50*100u)', ' data-m="eng" data-u="\u03a9" data-d="5"'],
    ['Two impedances in parallel', 'par(10+j5,10-j5)', ' data-m="eng" data-u="\u03a9" data-d="5"'],
    ['Polar input', '230\u222030', ' data-m="eng" data-u="V" data-d="6"'],
    ['Voltage divider', '230*(j20)/(10+j20)', ' data-m="eng" data-u="V" data-d="5"']
  ].map((c) => chip(c[0], c[1], c[2])).join('');

  const optSel = (id, label, opts, sel, dataAttr) => '<div class="sc-g"' + (dataAttr ? ' ' + dataAttr : '') + '><label for="' + id + '">' + esc(label) + '</label><select id="' + id + '">' + opts.map((o) => '<option value="' + esc(o[0]) + '"' + (o[0] === sel ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select></div>';
  const def = ev(DEFAULT_EXPR);

  const calcHtml =
    '<div id="sc"><section class="card sc-card" aria-label="Scientific calculator">' +
    '<div class="sc-top">' +
    '<div class="sc-g"><span class="sc-l" id="sc-ml">Mode</span><div class="seg" id="sc-modes" role="group" aria-labelledby="sc-ml"><button type="button" data-mode="std" aria-pressed="true">Standard</button><button type="button" data-mode="eng" aria-pressed="false">Engineering</button></div></div>' +
    '<div class="sc-g"><span class="sc-l" id="sc-al">Angle</span><div class="seg" id="sc-angles" role="group" aria-labelledby="sc-al"><button type="button" data-angle="DEG" aria-pressed="true">DEG</button><button type="button" data-angle="RAD" aria-pressed="false">RAD</button><button type="button" data-angle="GRAD" aria-pressed="false">GRAD</button></div></div>' +
    optSel('sc-fmt', 'Output', [['auto', 'Automatic'], ['sci', 'Scientific'], ['eng', 'Engineering'], ['fraction', 'Fraction']], 'auto') +
    optSel('sc-dig', 'Significant digits', [['5', '5'], ['6', '6'], ['8', '8'], ['10', '10'], ['12', '12'], ['15', '15']], '10') +
    optSel('sc-imp', 'Implicit multiplication', [['equal', '1/2\u03c0 = (1/2)\u00b7\u03c0'], ['tight', '1/2\u03c0 = 1/(2\u03c0)']], 'equal') +
    optSel('sc-unit', 'Unit of the result', [['', 'None'], ['\u03a9', '\u03a9 (ohm)'], ['V', 'V (volt)'], ['A', 'A (ampere)'], ['VA', 'VA'], ['W', 'W (watt)'], ['S', 'S (siemens)']], '', 'data-eng hidden') +
    optSel('sc-form', 'Show complex results as', [['rect', 'Rectangular (a + jb)'], ['polar', 'Polar (r \u2220 \u03b8)']], 'rect', 'data-eng hidden') +
    '</div>' +
    '<label for="sc-in" class="sc-l">Expression</label>' +
    '<input id="sc-in" class="sc-in" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" aria-describedby="sc-live sc-err" value="' + esc(DEFAULT_EXPR) + '">' +
    '<div class="sc-res" aria-live="polite" aria-atomic="true"><div class="sc-eq" aria-hidden="true">=</div><div class="sc-live" id="sc-live">' + esc(def.f.text) + '</div><div class="sc-alt" id="sc-alt"></div></div>' +
    '<p class="note sc-msg" id="sc-err" role="status"></p>' +
    '<div class="sc-act"><button type="button" class="btn2" data-act="copy">Copy result</button><button type="button" class="btn2" data-act="copyp" data-eng hidden>Copy polar form</button><button type="button" class="btn2" data-act="link">Copy link to this calculation</button><button type="button" class="btn2" data-act="wsadd">Add to worksheet</button><span class="sc-mem" id="sc-mem" hidden></span></div>' +
    '<p class="sr-only" id="sc-note" role="status" aria-live="polite"></p>' +
    '<div class="sc-vars" id="sc-vars" hidden><span class="sc-l">Variables</span> <span id="sc-vars-list"></span><button type="button" class="btn2" data-act="varclear">Clear variables</button></div>' +
    '<div class="sc-try"><span class="sc-l">Try</span> <span data-std>' + stdChips + '</span><span data-eng hidden>' + engChips + '</span></div>' +
    '<div class="pads"><div class="pad f5" role="group" aria-label="Function keys">' + fnKeys + '</div><div class="pad d4" role="group" aria-label="Number keys">' + numKeys + '</div></div>' +
    '<div class="pad e8" role="group" aria-label="Engineering keys" data-eng hidden>' + engKeys + '</div>' +
    '<noscript><p class="note">The calculator needs JavaScript. Nothing is sent anywhere: every calculation runs in your browser.</p></noscript>' +
    '</section>' +
    '<section class="card" id="sc-cx" aria-label="Complex result" hidden><h2>Complex result</h2>' +
    '<p class="note" id="sc-cx-hint">Enter a complex value such as 10+j15 or 230\u222030 to see its real and imaginary parts, magnitude, phase angle and phasor diagram.</p>' +
    '<div id="sc-cx-body" hidden><div class="sc-cx"><div class="tw" tabindex="0" role="region" aria-label="Scrollable table: parts of the complex result"><table><tbody id="sc-cx-rows"></tbody></table></div><div id="sc-cx-svg"></div></div><p><strong>Working</strong></p><ol class="steps" id="sc-cx-steps"></ol></div></section>' +
    '<section class="card" aria-label="History"><h2>History</h2><p class="note" id="sc-hist-none">Results you confirm with = appear here. Select one to use its expression again. History stays in this page and is not stored.</p><ol class="sc-hist" id="sc-hist"></ol><button type="button" class="btn2" data-act="histclear" id="sc-hist-clear" hidden>Clear history</button></section>' +
    '<section class="card" id="sc-ws" aria-label="Worksheet"><h2>Worksheet</h2>' +
    '<p class="note" id="sc-ws-none">Press Add to worksheet to keep a result with its expression, settings and a note of your own. When you are done, print the worksheet or save it as a PDF. The worksheet stays in this page and is not stored, so print or copy it before you close the page.</p>' +
    '<div id="sc-ws-body" hidden><div class="sc-wsm"><div class="sc-g"><label class="sc-l" for="sc-ws-title">Worksheet title</label><input id="sc-ws-title" type="text" maxlength="80" autocomplete="off" placeholder="Calculation worksheet"></div><div class="sc-g"><label class="sc-l" for="sc-ws-by">Prepared by</label><input id="sc-ws-by" type="text" maxlength="60" autocomplete="off"></div></div>' +
    '<ol class="sc-wsl" id="sc-ws-list"></ol>' +
    '<div class="sc-act"><button type="button" class="btn2" data-act="wsprint">Print or save as PDF</button><button type="button" class="btn2" data-act="wscopy">Copy as text</button><button type="button" class="btn2" data-act="wsclear">Clear worksheet</button></div></div></section></div>';

  /* ---------- reference content, all calculated by the engine ---------- */
  const fnRows = [
    ['sin, cos, tan', 'Sine, cosine and tangent of an angle in the angle mode you choose', 'sin(30)', 'sin(30)'],
    ['sin\u207b\u00b9, cos\u207b\u00b9, tan\u207b\u00b9', 'Inverse functions: the angle, in the active angle unit', 'asin(0.5)', 'asin(0.5)'],
    ['atan2', 'Angle of the point (x, y) in the correct quadrant, in the active angle unit: atan2(y, x)', 'atan2(1,-1)', 'atan2(1,-1)'],
    ['sinh, cosh, tanh', 'Hyperbolic functions and their inverses (asinh, acosh, atanh)', 'sinh(1)', 'sinh(1)'],
    ['log, ln', 'Logarithm base 10 and natural logarithm', 'log(1000)', 'log(1000)'],
    ['log\u2082, log\u2093', 'Logarithm base 2, and to any base: logb(number, base)', 'logb(81,3)', 'logb(81,3)'],
    ['e\u02e3, x\u02b8', 'Exponential and powers, evaluated right to left', '2^10', '2^10'],
    ['\u221a, \u221b, \u02b8\u221ax', 'Square root, cube root and nth root: root(number, n)', 'root(32,5)', 'root(32,5)'],
    ['n!', 'Factorial of a whole number from 0 to 170', '5!', '5!'],
    ['nCr, nPr', 'Combinations and permutations', 'ncr(5,2)', 'ncr(5,2)'],
    ['mod', 'Remainder, with the sign of the divisor', 'mod(17,5)', 'mod(17,5)'],
    ['%', 'Divides by 100', '200*15%', '200*15%'],
    ['abs, floor, ceil, round', 'Absolute value and rounding to a whole number', 'abs(-7.5)', 'abs(-7.5)'],
    ['1/x', 'Reciprocal of the whole expression', 'inv(8)', 'inv(8)']
  ].map((r) => [r[0], r[1], r[2], val(r[3])]);
  const angRows = [
    ['DEG', '360\u00b0', 'sin(30)', val('sin(30)', { angle: 'DEG' })],
    ['RAD', '2\u03c0 rad', 'sin(pi/6)', val('sin(pi/6)', { angle: 'RAD' })],
    ['GRAD', '400 grad', 'sin(100/3)', val('sin(100/3)', { angle: 'GRAD' })]
  ];
  const precRows = [
    ['1', 'Brackets and function arguments', '(2+3)*4', val('(2+3)*4')],
    ['2', 'Factorial, percent and degree sign, applied to the value before them', '3!^2', val('3!^2')],
    ['3', 'Power, evaluated right to left', '2^3^2', val('2^3^2')],
    ['4', 'Unary minus, so it applies after a power', '-2^2', val('-2^2')],
    ['5', 'Polar angle \u2220 (Engineering mode)', '2\u222030*3', ev('2\u222030*3', { complex: true, digits: 6 }).f.text],
    ['6', 'Multiply and divide, left to right, including a multiplication sign left out', '10/2*5', val('10/2*5')],
    ['7', 'Add and subtract, left to right', '2+3*4', val('2+3*4')]
  ];
  const O5 = { complex: true, digits: 5, unit: '\u03a9' };
  const z0 = ev('10+j15', O5), d0 = S.describe(z0.r.value, O5);
  const exRows = [
    ['(10+j15)*(5-j2)', { complex: true, digits: 6 }], ['230\u222030', { complex: true, digits: 6 }], ['1/(j*2*pi*50*100u)', { complex: true, digits: 6 }], ['230*(j20)/(10+j20)', { complex: true, digits: 6 }], ['sqrt(-4)', { complex: true, digits: 6 }]
  ].map((x) => { const e = ev(x[0], x[1]); return [x[0], e.f.rect, e.f.polar]; });
  const tests = [['sin(30\u00b0)', 'sin(30)'], ['cos(60\u00b0)', 'cos(60)'], ['tan(45\u00b0)', 'tan(45)'], ['log(1000)', 'log(1000)'], ['ln(e)', 'ln(e)'], ['\u221a144', 'sqrt(144)'], ['5!', '5!'], ['2\u00b3', '2^3']].map((t) => [t[0], val(t[1])]).concat([['1/0', 'Error: ' + S.evaluate('1/0').error.toLowerCase()]]);

  const faq = [
    ['How does this calculator read what I type?', 'It uses its own expression parser, written for this page. It does not use eval or run your text as code, and nothing you type leaves your browser. Brackets, operator order and functions follow the usual rules of mathematics.'],
    ['How do I switch between degrees, radians and gradians?', 'Choose DEG, RAD or GRAD above the keypad. It sets how sin, cos and tan read their input and the unit of asin, acos and atan results. You can also write the degree sign after a value, as in sin(30\u00b0), and it is converted to the active unit.'],
    ['Why does sin(180) show 0 and not a tiny number?', 'In degree and gradian mode the calculator uses exact values at multiples of 30 and 45 degrees, so sin(30) is exactly 0.5 and cos(90) is exactly 0. In radian mode a result that is only rounding noise, such as sin(\u03c0), is shown as 0.'],
    ['How do I enter complex numbers and polar values?', 'Switch to Engineering mode. Write the imaginary unit as j, for example 10+j15. For polar input write the magnitude, the \u2220 sign and the angle, for example 230\u222030, or type 230<30. The angle follows the angle mode. Results show as rectangular and polar form, with a phasor diagram and the working.'],
    ['What do k, M, m, \u00b5, n and p do in Engineering mode?', 'Written directly after a number they are SI prefixes: 4.7k is 4,700, 100u is 100 microunits (0.0001) and 33n is 33 nano. They are not read as prefixes when a letter follows, so 3pi is 3 times pi.'],
    ['What does the % key do?', 'It divides the value before it by 100, so 200*15% is 30. It does not add a percentage to a total: 50+10% is 50.1. For 50 plus 10 percent write 50*(1+10%).'],
    ['How many digits are right?', 'Calculations use double-precision numbers, which hold about 15 to 17 significant digits. The display rounds to the number of significant digits you choose, 10 by default. Results can differ from exact mathematics in the last digits, for example 0.1+0.2 is shown as 0.3.'],
    ['How do I use a value again, such as a frequency?', 'Type f=50 and press Enter. The name f then stands for 50 in every later calculation until you clear it or close the page. Names are letters only, up to 20 variables, and the names of functions and constants such as pi, e, i, j and ans are not allowed (i and j are both the imaginary unit, so i cannot stand for current; use a name such as ia). A name is read as one word, so write f c or f*c, not fc. A variable that holds a complex number needs Engineering mode.'],
    ['What does the Implicit multiplication setting do?', 'It decides how 1/2\u03c0 is read. With the default, a product with the sign left out ranks with multiply and divide, so 1/2\u03c0 is (1/2)\u00b7\u03c0. With the other choice the product binds first, so 1/2\u03c0 is 1/(2\u03c0), which is how the reactance formula 1/2\u03c0fC is usually meant. Use brackets to be sure.'],
    ['Does it keep my calculations?', 'No. The history, the worksheet and any variables are held in the page and disappear when you close it. The Copy link button puts your expression in the link, so whoever opens the link sees the same calculation.'],
    ['Can I keep my results as a worksheet or a PDF?', 'Yes. After a result appears, press Add to worksheet. Each entry keeps the expression, the result, the angle mode, the number of digits and any variable values it uses, and you can type a note beside it. Give the worksheet a title, then press Print or save as PDF and choose Save as PDF in the print window, or press Copy as text. The worksheet is built in your browser and is not stored or sent anywhere, so it is gone when you close the page.']
  ];

  const intro = '<p>Standard mode is a full scientific calculator: brackets and operator precedence, trigonometry, logarithms, powers and roots, factorials, constants, memory and the previous answer. Engineering mode adds complex numbers, rectangular and polar form, phasor arithmetic and SI prefixes for electrical work. Type on the keyboard or use the keypad. Press Enter or = to confirm a result and add it to the history, and use Add to worksheet to collect results with notes for printing or saving as a PDF.</p>';
  const body = HEADC + '<main class="w"><h1>' + esc(NAME) + '</h1><p class="lede">' + esc(DESC) + ' Calculate. Check. Understand.</p>' + calcHtml +
    '<section id="about"><h2>How to use it</h2>' + intro + '<ul><li>Keyboard: type an expression, press Enter to confirm, Escape to clear. Use * and / or \u00d7 and \u00f7. Powers are written with ^.</li><li>Functions take brackets, as in sin(30) or sqrt(16). Brackets are not needed for a single value: sin30 and \u221a144 also work.</li><li>Variables: type a name, an equals sign and an expression, as in <code>f=50</code>, then press Enter. Use the name in later calculations, for example <code>1/(2*pi*f*100u)</code>. Names are letters only and are not case sensitive. The stored values appear under the result and are gone when you close the page.</li><li>Ans is the last confirmed result. MS, M+ and M\u2212 store, add to and subtract from memory, and MR enters it as <code>mem</code>.</li><li>An error is explained in words, for example division by zero, or a square root of a negative number outside Engineering mode.</li></ul></section>' +
    '<section id="functions"><h2>Functions and keys</h2>' + table(['Key', 'What it does', 'Example', 'Result'], fnRows) + '<p class="note">Every result in this table is calculated by the same engine as the calculator above.</p></section>' +
    '<section id="angles"><h2>Angle modes</h2><p>The angle mode changes how trigonometric functions read their input. The same angle gives the same answer in each mode:</p>' + table(['Mode', 'Full circle', 'Example', 'Result'], angRows) + '<p>Switching mode does not convert numbers you have already typed. A degree sign written after a value, as in 30\u00b0, always means 30 degrees and is converted to the active unit.</p></section>' +
    '<section id="order"><h2>Order of operations</h2>' + table(['Order', 'Rule', 'Example', 'Result'], precRows) + '<p>Where a rule could be read two ways, the calculator follows the usual convention for scientific calculators: -2^2 is -4, and 2^3^2 is 2^9. Use brackets when in doubt. A product written without a sign, as in 3(4+5) or 2sin(30), is read as multiplication. The Implicit multiplication setting changes how a product with the sign left out ranks against division: by default 1/2\u03c0 is (1/2)\u00b7\u03c0, and the other choice reads it as 1/(2\u03c0) so that 1/2\u03c0fC means 1/(2\u03c0fC). Explicit signs are never affected: 1/2*pi is always (1/2)\u00b7\u03c0. Two numbers side by side with a space, as in 1 000, are rejected rather than multiplied, so a thousands separator cannot silently change an answer.</p></section>' +
    '<section id="engineering"><h2>Engineering mode: impedance example</h2><p>Enter an impedance of Z = 10 + j15 \u03a9 and the calculator returns its parts, its magnitude |Z| = \u221a(10\u00b2 + 15\u00b2) and its phase angle \u03b8 = tan\u207b\u00b9(15/10):</p>' +
    '<div class="sc-cx"><div class="tw" tabindex="0" role="region" aria-label="Scrollable table: parts of the impedance 10 + j15 ohms"><table><tbody>' + d0.rows.map((r) => '<tr><th scope="row">' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>').join('') + '</tbody></table></div><div>' + S.phasorSvg(d0, O5) + '</div></div>' +
    '<ol class="steps">' + d0.steps.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ol>' +
    '<p>More examples, with results shown to 6 significant digits:</p>' + table(['Expression', 'Rectangular', 'Polar'], exRows) +
    '<p>Complex results from the trigonometric, logarithmic, power and root functions are available in Engineering mode, and a negative number under a square root gives an imaginary result instead of an error. Phase angles follow the angle mode and are normally read in degrees. par(Z1, Z2) gives impedances in parallel.</p></section>' +
    '<section id="limits"><h2>Limits and accuracy</h2><ul><li>Numbers are double precision (about 15 to 17 significant digits). Very large or very small results are shown in scientific form.</li><li>Factorials are limited to whole numbers up to 170. Larger values overflow.</li><li>An even root or a non-integer power of a negative number is an error in Standard mode, and a complex result in Engineering mode, using the principal value.</li><li>On a branch cut, such as asin(2), the sign of the imaginary part is a convention. Check it before using it in a design.</li><li>Phase angles are shown between -180\u00b0 and 180\u00b0.</li><li>The calculator is a general mathematical tool. It does not know about units: the unit you choose in Engineering mode is a label on the result, and it is not checked.</li></ul><p class="note">Cross-check: ' + (VC.n ? VC.n + ' reference cases, calculated with Python\u2019s math and cmath modules, written separately from this calculator (they cover each angle mode, inverse and hyperbolic functions, logarithms, powers and roots, factorials, operator order, error cases, complex arithmetic, polar input and SI prefixes), and ' + VC.polar + ' polar conversions agree with it.' : 'not yet recorded.') + ' The calculator\u2019s own tests also cover the standard values in the table below.</p>' +
    table(['Test', 'Expected result'], tests.map((t) => [t[0], t[1]])) + '</section>' +
    '<section id="faq">' + faqHtml(faq) + '</section>' +
    '<section id="related"><h2>Related</h2><p><a class="chip" href="../basic-calculator/">Basic Calculator</a><a class="chip" href="../complex-number/">Complex Number Calculator</a><a class="chip" href="../phasor-sum/">Phasor Sum Calculator</a><a class="chip" href="../trig-functions/">Trig Functions Calculator</a><a class="chip" href="../impedance-rlc/">Impedance RLC Calculator</a><a class="chip" href="../ac-ohms-law/">AC Ohm’s Law Calculator</a><a class="chip" href="../engineering-mathematics/">More Engineering Mathematics calculators</a><a class="chip" href="../../converters/angle-converter.html">Angle Converter</a><a class="chip" href="../../converters/scientific-notation-converter.html">Scientific Notation Converter</a><a class="chip" href="../../converters/db-converter.html">dB to Ratio Converter</a><a class="chip" href="../">All engineering calculators</a></p></section>' +
    '</main>' + FOOTC('../../');

  const CSS = '#sc .sc-card{padding:16px 16px 18px}#sc .sc-top{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:end;margin-bottom:12px}#sc .sc-g{display:flex;flex-direction:column;gap:4px}#sc .sc-g select{width:auto;min-width:96px}#sc .sc-l,#sc label.sc-l{display:block;font-weight:600;font-size:13px;margin:0 0 4px}#sc .sc-g label{margin:0;font-weight:600;font-size:13px}#sc select{font:15px var(--body);color:var(--ink);background:var(--field);border:1px solid var(--line);border-radius:6px;padding:8px;min-height:40px}#sc th,#sc td{text-transform:none;letter-spacing:0}' +
    '#sc .seg{display:inline-flex;border:1px solid var(--line);border-radius:6px;overflow:hidden}#sc .seg button{font:600 14px var(--body);padding:9px 14px;min-height:40px;background:var(--surface);color:var(--ink);border:0;border-right:1px solid var(--line);cursor:pointer}#sc .seg button:last-child{border-right:0}#sc .seg button[aria-pressed="true"]{background:var(--navy);color:var(--on-navy)}#sc .seg button:focus-visible,#sc .k:focus-visible,#sc .btn2:focus-visible,#sc .chipb:focus-visible,#sc .sc-h:focus-visible{outline:none;box-shadow:var(--ring)}' +
    '#sc .sc-in{display:block;width:100%;box-sizing:border-box;font:500 22px/1.3 var(--mono);padding:12px 14px;min-height:52px;border-radius:8px;border:1px solid var(--line);background:var(--field);color:var(--ink)}#sc .sc-in:focus{outline:2px solid var(--gold);outline-offset:1px}' +
    '#sc .sc-res{display:flex;gap:12px;align-items:baseline;flex-wrap:wrap;padding:12px 2px 2px;min-height:60px}#sc .sc-eq{font:600 28px var(--display);color:var(--muted)}#sc .sc-live{font:600 34px/1.15 var(--display);color:var(--num);word-break:break-word}#sc .sc-alt{flex-basis:100%;color:var(--muted);font:14px var(--mono);min-height:1.2em}#sc .sc-msg{min-height:1.4em;margin:2px 0 8px}' +
    '#sc .sc-act{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:4px 0 10px}#sc .btn2,#sc .chipb{font:600 13px var(--body);color:var(--ink);background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:8px 12px;min-height:38px;cursor:pointer}#sc .btn2:hover,#sc .chipb:hover{background:var(--field)}#sc .chipb{border-radius:999px;padding:5px 12px;min-height:32px;font-weight:500;margin:3px 6px 3px 0}#sc .sc-mem{font:600 13px var(--mono);color:var(--muted)}#sc .sc-vars{margin:0 0 10px}#sc .sc-vars .sc-l{display:inline;margin-right:6px}#sc .sc-vars .btn2{margin-left:6px}#sc .sc-try{margin:0 0 10px}#sc .sc-try .sc-l{display:inline;margin-right:6px}' +
    '#sc .pads{display:grid;gap:12px;grid-template-columns:1fr}@media(min-width:700px){#sc .pads{grid-template-columns:5fr 4fr}}#sc .pad{display:grid;gap:6px}#sc .f5{grid-template-columns:repeat(5,minmax(0,1fr))}#sc .d4{grid-template-columns:repeat(4,minmax(0,1fr))}#sc .e8{grid-template-columns:repeat(auto-fit,minmax(56px,1fr));margin-top:10px}#sc .e8[hidden]{display:none}' +
    '#sc .k{min-height:46px;padding:6px 2px;font:600 15px var(--body);color:var(--ink);background:var(--surface);border:1px solid var(--line);border-radius:8px;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}#sc .k:hover{background:var(--field)}#sc .k:active{transform:translateY(1px)}#sc .k.fn{background:var(--field);font-size:14px}#sc .k.n{font-size:19px}#sc .k.op{background:var(--gold-fill)}#sc .k.mem{font-size:13px}#sc .k.eq{background:var(--navy);color:var(--on-navy);border-color:var(--gold);font-size:22px}#sc .k.wide{grid-column:span 3}' +
    '#sc .sc-cx{display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start}#sc .sc-cx>div:first-child{flex:1 1 260px;min-width:0}#sc .sc-cx>div:last-child{flex:1 1 280px;max-width:340px}.sc-svg{width:100%;max-width:340px;height:auto;display:block}#sc .sc-hist{list-style:none;margin:0 0 8px;padding:0;display:grid;gap:4px}#sc .sc-h{width:100%;text-align:left;font:14px var(--mono);color:var(--ink);background:var(--field);border:1px solid var(--line);border-radius:6px;padding:8px 10px;cursor:pointer;overflow-wrap:anywhere}#sc .sc-h:hover{border-color:var(--gold)}' +
    '.sc-cx th,.sc-cx td{text-transform:none}.sr-only{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}code{font-family:var(--mono)}[hidden]{display:none!important}@media(max-width:420px){#sc .sc-live{font-size:28px}#sc .k{font-size:14px}#sc .k.n{font-size:18px}#sc .f5 .k{font-size:12.5px}}' +
    '#sc .sc-wsm{display:flex;flex-wrap:wrap;gap:10px 18px;margin:8px 0 12px}#sc .sc-wsm input{font:500 14px var(--body);padding:8px 10px;min-height:38px;border-radius:6px;border:1px solid var(--line);background:var(--field);color:var(--ink);min-width:200px}#sc .sc-wsl{list-style:none;margin:0 0 8px;padding:0}#sc .sc-wsl li{border:1px solid var(--line);border-radius:8px;padding:10px 12px;margin:0 0 8px;background:var(--surface)}#sc .sc-wsx{font:600 15px var(--mono);color:var(--num);word-break:break-word}#sc .sc-wss{font-size:12px;color:var(--muted);margin:2px 0 6px}#sc .sc-wsl textarea{display:block;width:100%;box-sizing:border-box;font:400 14px var(--body);padding:8px 10px;min-height:44px;border-radius:6px;border:1px solid var(--line);background:var(--field);color:var(--ink);resize:vertical}#sc .sc-wsl .btn2{margin-top:6px}' +
    '#sc-ws-sheet{display:none}@media print{#sc .pads,#sc .sc-act,#sc .sc-try,#sc .sc-top{display:none}html.sc-wsp body>*:not(#sc-ws-sheet){display:none!important}html.sc-wsp body{background:#fff!important;background-image:none!important}html.sc-wsp #sc-ws-sheet{display:block;color:#000;background:#fff;font:13px/1.45 Arial,Helvetica,sans-serif;padding:0}#sc-ws-sheet h1{font-size:20px;margin:0 0 4px;color:#000}#sc-ws-sheet .m{color:#333;margin:0 0 12px;font-size:12px}#sc-ws-sheet table{width:100%;border-collapse:collapse;font-size:12px}#sc-ws-sheet th,#sc-ws-sheet td{border:1px solid #666;padding:5px 7px;text-align:left;vertical-align:top;color:#000;background:#fff}#sc-ws-sheet td.x,#sc-ws-sheet td.r{font-family:Consolas,Menlo,monospace;word-break:break-word}#sc-ws-sheet tr{break-inside:avoid}#sc-ws-sheet .f{margin-top:12px;font-size:11px;color:#333}}';

  const srcs = ['scicalc_engine.js', 'scicalc_client.js'].map((f) => fs.readFileSync(path.join(__dirname, f), 'utf8'));
  srcs.forEach((t, i) => { if (/<\/script/i.test(t) || /<!--/.test(t)) throw new Error('scicalc: ' + i + ' would end the script block'); });
  const script = srcs.map((t) => '<script>' + t + '</script>').join('');
  const head = calcLd(NAME, SLUG, DESC, faq) + '<style>' + CSS + '</style>';
  return { html: page(SLUG, NAME, DESC, body, head, script, { url: BASE ? calcUrl(SLUG) : '', prefix: '../../' }), slug: SLUG, name: NAME, desc: DESC, title: NAME + ' | Elecmetric', defaultText: def.f.text };
}

module.exports = { build, SLUG, NAME, DESC, DEFAULT_EXPR };
