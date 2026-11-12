/* Builds calculators/basic-calculator/index.html.
   A four-function calculator with brackets, percent, square, square root, reciprocal, memory and the previous answer. It uses the same expression engine as the Scientific Calculator (tools/scicalc_engine.js, Standard mode), so it is covered by the same tests.
   Every example number on the page is calculated by the engine at build time, so the text cannot drift from the calculator. */
const fs = require('fs'), path = require('path');
const S = require('./scicalc_engine.js');

const SLUG = 'basic-calculator';
const NAME = 'Basic Calculator Online';
const DESC = 'Free online basic calculator: add, subtract, multiply, divide, percent, square root, brackets and memory. Runs in your browser, with a history of results.';
const DEFAULT_EXPR = '12.5*8+(36-6)/4';

function build(h) {
  const { page, esc, table, faqHtml, calcLd, HEADC, FOOTC, calcUrl, BASE } = h;
  const val = (expr) => { const o = { digits: 10, fmt: 'auto' }, r = S.evaluate(expr, o); if (!r.ok) throw new Error('basic calculator page example failed: ' + expr + ': ' + r.error); return S.format(r.value, o).text; };
  const K = (label, ins, aria, cls) => '<button type="button" class="k ' + (cls || '') + '" data-ins="' + esc(ins) + '"' + (aria ? ' aria-label="' + esc(aria) + '"' : '') + '>' + esc(label) + '</button>';
  const A = (label, act, aria, cls) => '<button type="button" class="k ' + (cls || '') + '" data-act="' + act + '"' + (aria ? ' aria-label="' + esc(aria) + '"' : '') + '>' + esc(label) + '</button>';
  const keys = [
    A('MC', 'mc', 'memory clear', 'fn'), A('MR', 'mr', 'memory recall', 'fn'), A('M+', 'mp', 'add to memory', 'fn'), A('M\u2212', 'mm', 'subtract from memory', 'fn'),
    K('Ans', 'ans', 'previous answer', 'fn'), A('\u221a', 'root', 'square root', 'fn'), A('x\u00b2', 'sq', 'square', 'fn'), A('1/x', 'recip', 'reciprocal', 'fn'),
    A('AC', 'ac', 'clear all', 'op'), A('\u232b', 'del', 'backspace', 'op'), K('(', '(', 'open bracket', 'op'), K(')', ')', 'close bracket', 'op'),
    K('7', '7', '', 'n'), K('8', '8', '', 'n'), K('9', '9', '', 'n'), K('\u00f7', '/', 'divide', 'op'),
    K('4', '4', '', 'n'), K('5', '5', '', 'n'), K('6', '6', '', 'n'), K('\u00d7', '*', 'multiply', 'op'),
    K('1', '1', '', 'n'), K('2', '2', '', 'n'), K('3', '3', '', 'n'), K('\u2212', '-', 'minus', 'op'),
    K('0', '0', '', 'n'), K('.', '.', 'decimal point', 'n'), A('\u00b1', 'neg', 'plus or minus', 'op'), K('+', '+', 'plus', 'op'),
    K('%', '%', 'percent', 'fn'), A('=', 'eq', 'equals', 'eq wide')
  ].join('');
  const chip = (label, expr) => '<button type="button" class="chipb" data-ex="' + esc(expr) + '">' + esc(label) + '</button>';
  const chips = [['15% of 200', '200*15%'], ['7 \u00f7 8', '7/8'], ['2 + 3 \u00d7 4', '2+3*4'], ['(2 + 3) \u00d7 4', '(2+3)*4'], ['\u221a144', 'sqrt(144)'], ['1 \u00f7 3', '1/3']].map((c) => chip(c[0], c[1])).join('');

  const calcHtml =
    '<div id="bc"><section class="card bc-card" aria-label="Basic calculator">' +
    '<label for="bc-in" class="bc-l">Expression</label>' +
    '<input id="bc-in" class="bc-in" type="text" inputmode="decimal" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" aria-describedby="bc-live bc-err" value="' + esc(DEFAULT_EXPR) + '">' +
    '<div class="bc-res" aria-live="polite" aria-atomic="true"><div class="bc-eq" aria-hidden="true">=</div><div class="bc-live" id="bc-live">' + esc(val(DEFAULT_EXPR)) + '</div></div>' +
    '<p class="note bc-msg" id="bc-err" role="status"></p>' +
    '<div class="bc-act"><button type="button" class="btn2" data-act="copy">Copy result</button><span class="bc-mem" id="bc-mem" hidden></span></div>' +
    '<p class="sr-only" id="bc-note" role="status" aria-live="polite"></p>' +
    '<div class="bc-try"><span class="bc-l">Try</span> ' + chips + '</div>' +
    '<div class="pad bc-pad" role="group" aria-label="Calculator keys">' + keys + '</div>' +
    '<noscript><p class="note">The calculator needs JavaScript. Nothing is sent anywhere: every calculation runs in your browser.</p></noscript>' +
    '</section>' +
    '<section class="card" aria-label="History"><h2>History</h2><p class="note" id="bc-hist-none">Results you confirm with = appear here. Select one to use its expression again. History stays in this page and is not stored.</p><ol class="bc-hist" id="bc-hist"></ol><button type="button" class="btn2" data-act="histclear" id="bc-hist-clear" hidden>Clear history</button></section></div>';

  const keyRows = [
    ['+  \u2212  \u00d7  \u00f7', 'Add, subtract, multiply and divide. You can also type * and /', '12.5*8', val('12.5*8')],
    ['( )', 'Brackets: what is inside is worked out first', '(2+3)*4', val('(2+3)*4')],
    ['%', 'Divides the value before it by 100', '200*15%', val('200*15%')],
    ['\u221a', 'Square root', 'sqrt(144)', val('sqrt(144)')],
    ['x\u00b2', 'Square of the whole expression', '(7)^2', val('(7)^2')],
    ['1/x', 'Reciprocal of the whole expression', '1/(8)', val('1/(8)')],
    ['\u00b1', 'Changes the sign of the whole expression', '-(5)', val('-(5)')],
    ['Ans', 'The previous confirmed answer', 'ans*2 after 21', '42']
  ];
  const orderRows = [['2+3*4', 'Multiply before adding', val('2+3*4')], ['(2+3)*4', 'Brackets first', val('(2+3)*4')], ['10-4-3', 'Subtract left to right', val('10-4-3')], ['100/4/5', 'Divide left to right', val('100/4/5')], ['-2^2', 'The power is worked out before the minus', val('-2^2')]];
  const checks = [['0.1 + 0.2', val('0.1+0.2')], ['12.5 \u00d7 8', val('12.5*8')], ['1 \u00f7 3', val('1/3')], ['\u221a2', val('sqrt(2)')], ['15% of 200', val('200*15%')], ['1 \u00f7 0', 'Error: ' + S.evaluate('1/0').error.toLowerCase()]];
  const faq = [
    ['How does this calculator read what I type?', 'It uses its own expression parser, the same one as the Scientific Calculator. It does not use eval or run your text as code, and nothing you type leaves your browser. Multiplication and division are worked out before addition and subtraction, and brackets are worked out first.'],
    ['Does it work like a pocket calculator that does one operation at a time?', 'No. You type the whole expression and see the result as you go, so 2+3*4 is 14, as in mathematics, and not 20. To work step by step, press = after each step and continue from the answer: typing an operator after = starts from the previous answer.'],
    ['What does the % key do?', 'It divides the value before it by 100, so 200*15% is 30. It does not add a percentage to a total as some pocket calculators do: 200+10% is 200.1. For 200 plus 10 percent write 200*(1+10%), which is 220. The Percentage Calculator on this site handles increase, decrease and percentage change.'],
    ['Why does 0.1 + 0.2 show 0.3?', 'Calculations use double-precision numbers, which hold about 15 to 17 significant digits. The display rounds to 10 significant digits, so the tiny binary rounding error in 0.1 + 0.2 does not show.'],
    ['What happens when I divide by zero?', 'The calculator shows an error message and no result. A very large or very small result is shown in scientific form, such as 1.5\u00d710\u00b9\u2075.'],
    ['How do I use memory?', 'M+ adds the current result (or the expression you typed) to memory, M\u2212 subtracts it, MR puts the memory value into the expression and MC clears it. Memory is held in the page and disappears when you close it.'],
    ['Does it keep my calculations?', 'No. The history and memory are held in the page and disappear when you close it. Nothing is stored or sent.'],
    ['When should I use the Scientific Calculator instead?', 'Use it for trigonometry, logarithms, powers and roots of any order, factorials, complex numbers, polar form and SI prefixes for electrical work.']
  ];
  const body = HEADC + '<main class="w"><h1>' + esc(NAME) + '</h1><p class="lede">' + esc(DESC) + ' Calculate. Check. Understand.</p>' + calcHtml +
    '<section id="about"><h2>How to use it</h2><p>Type an expression on the keyboard or use the keypad, and the result appears as you type. Press Enter or = to confirm a result and add it to the history. Escape or AC clears the expression.</p><ul><li>Use * and / or the \u00d7 and \u00f7 keys. Write a decimal point, not a comma.</li><li>Brackets can be nested, as in <code>((2+3)*4-5)/3</code>.</li><li>After a confirmed result, typing + \u2212 \u00d7 \u00f7 continues from the answer, and typing a digit starts a new calculation.</li></ul></section>' +
    '<section id="keys"><h2>The keys</h2>' + table(['Key', 'What it does', 'Example', 'Result'], keyRows) + '<p class="note">Every result in this table is calculated by the same engine as the calculator above.</p></section>' +
    '<section id="order"><h2>Order of operations</h2><p>The calculator follows the usual rules of mathematics, not the order in which you press the keys:</p>' + table(['Expression', 'Rule', 'Result'], orderRows) + '</section>' +
    '<section id="percent"><h2>Working with percent</h2><p>The % key divides by 100, so a percentage of a number is the number times the percentage: 15% of 200 is <code>200*15%</code> = ' + esc(val('200*15%')) + '. To add a percentage, multiply by one plus the percentage: 200 plus 10 percent is <code>200*(1+10%)</code> = ' + esc(val('200*(1+10%)')) + ', and 200 minus 10 percent is <code>200*(1-10%)</code> = ' + esc(val('200*(1-10%)')) + '.</p></section>' +
    '<section id="accuracy"><h2>Accuracy checks</h2><p>These results are produced by the same engine and are checked by the site\u2019s tests:</p>' + table(['Calculation', 'Result'], checks) + '<p>Numbers are double precision (about 15 to 17 significant digits) and the display shows 10. For engineering work with more digits, choose the number of digits in the <a href="../scientific-calculator/">Scientific Calculator</a>.</p></section>' +
    '<section id="faq">' + faqHtml(faq) + '</section>' +
    '<section id="related"><h2>Related</h2><p><a class="chip" href="../scientific-calculator/">Scientific Calculator</a><a class="chip" href="../percentage-calculator/">Percentage Calculator</a><a class="chip" href="../fraction-calculator/">Fraction Calculator</a><a class="chip" href="../ratio-calculator/">Ratio Calculator</a><a class="chip" href="../powers-roots/">Powers and Roots</a><a class="chip" href="../rounding-sig-figs/">Rounding and Significant Figures</a><a class="chip" href="../">All engineering calculators</a></p></section>' +
    '</main>' + FOOTC('../../');

  const CSS = '#bc .bc-card{padding:16px 16px 18px}#bc .bc-l,#bc label.bc-l{display:block;font-weight:600;font-size:13px;margin:0 0 4px}' +
    '#bc .bc-in{display:block;width:100%;box-sizing:border-box;font:500 22px/1.3 var(--mono);padding:12px 14px;min-height:52px;border-radius:8px;border:1px solid var(--line);background:var(--field);color:var(--ink)}#bc .bc-in:focus{outline:2px solid var(--gold);outline-offset:1px}' +
    '#bc .bc-res{display:flex;gap:12px;align-items:baseline;flex-wrap:wrap;padding:12px 2px 2px;min-height:60px}#bc .bc-eq{font:600 28px var(--display);color:var(--muted)}#bc .bc-live{font:600 34px/1.15 var(--display);color:var(--num);word-break:break-word}#bc .bc-msg{min-height:1.4em;margin:2px 0 8px}' +
    '#bc .bc-act{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:4px 0 10px}#bc .btn2,#bc .chipb{font:600 13px var(--body);color:var(--ink);background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:8px 12px;min-height:38px;cursor:pointer}#bc .btn2:hover,#bc .chipb:hover{background:var(--field)}#bc .chipb{border-radius:999px;padding:5px 12px;min-height:32px;font-weight:500;margin:3px 4px 3px 0}#bc .bc-mem{font:600 14px var(--mono);color:var(--muted)}#bc .bc-try{margin:0 0 12px}' +
    '#bc .bc-pad{display:grid;gap:6px;grid-template-columns:repeat(4,minmax(0,1fr));max-width:420px}#bc .k{min-height:50px;padding:6px 2px;font:600 15px var(--body);color:var(--ink);background:var(--surface);border:1px solid var(--line);border-radius:8px;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}#bc .k:hover{background:var(--field)}#bc .k:active{transform:translateY(1px)}#bc .k:focus-visible,#bc .btn2:focus-visible,#bc .chipb:focus-visible,#bc .bc-h:focus-visible{outline:2px solid var(--gold);outline-offset:2px}#bc .k.fn{background:var(--field);font-size:14px}#bc .k.n{font-size:20px}#bc .k.op{font-size:18px;background:var(--field)}#bc .k.eq{background:var(--navy);color:var(--on-navy);border-color:var(--navy);font-size:20px}' +
    '#bc .bc-pad .wide{grid-column:span 3}' +
    '#bc .bc-hist{list-style:none;margin:0 0 8px;padding:0;display:grid;gap:4px}#bc .bc-h{width:100%;text-align:left;font:14px var(--mono);color:var(--ink);background:var(--field);border:1px solid var(--line);border-radius:6px;padding:8px 10px;min-height:38px;cursor:pointer;word-break:break-word}#bc .bc-h:hover{background:var(--surface)}' +
    '.sr-only{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}code{font-family:var(--mono)}[hidden]{display:none!important}@media(max-width:420px){#bc .bc-live{font-size:28px}#bc .k{min-height:48px}}@media print{#bc .bc-pad,#bc .bc-act,#bc .bc-try{display:none}}';

  const srcs = ['scicalc_engine.js', 'basiccalc_client.js'].map((f) => fs.readFileSync(path.join(__dirname, f), 'utf8'));
  srcs.forEach((t, i) => { if (/<\/script/i.test(t) || /<!--/.test(t)) throw new Error('basiccalc: ' + i + ' would end the script block'); });
  const script = srcs.map((t) => '<script>' + t + '</script>').join('');
  const head = calcLd(NAME, SLUG, DESC, faq) + '<style>' + CSS + '</style>';
  return { html: page(SLUG, NAME, DESC, body, head, script, { url: BASE ? calcUrl(SLUG) : '', prefix: '../../' }), slug: SLUG, name: NAME, desc: DESC, title: NAME + ' | Elecmetric', defaultText: val(DEFAULT_EXPR) };
}

module.exports = { build, SLUG, NAME, DESC, DEFAULT_EXPR };
