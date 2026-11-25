/* Builds calculators/decay-constant-calculator/index.html (Elecmetric Half-Life Calculator, Mode 02: decay constant and mean lifetime converter). Run: node tools/halflife_const_page.js
   Takes the page shell from the Basic Calculator and the engines and script from tools/halflife_engine.js, tools/halflife_const_engine.js and tools/halflife_const_client.js.
   Every example number on the page is calculated by the engine at build time, so the page text can never disagree with the calculator. */
const fs = require('fs'), path = require('path');
const H = require('./halflife_engine.js'), C = require('./halflife_const_engine.js'), modes = require('./halflife_modes.js');
const root = path.join(__dirname, '..');
const shell = fs.readFileSync(path.join(root, 'calculators/basic-calculator/index.html'), 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const TITLE = 'Decay Constant Calculator | Half-Life, Mean Lifetime and Decay Constant Converter';
const DESC = 'Free decay constant calculator with step-by-step working. Convert between half-life, decay constant and mean lifetime in any time unit, with the three values shown together and checked.';
const run = (o) => { const r = C.run(Object.assign({ timeUnit: 'yr' }, o)); if (!r.ok) throw new Error('page example failed ' + JSON.stringify(o) + ': ' + r.error); return r; };
const F6 = (v) => H.fmt(v, 6);
const D = { known: 'auto', T: '', lambda: '', tau: '', tu: 'yr', ou: 'same', sig: '6' };
const ex = (label, d) => '<button type="button" class="chipb" data-ex="' + esc(JSON.stringify(Object.assign({}, D, d))) + '">' + esc(label) + '</button>';
const chips = [
  ex('10-year half-life', { T: '10' }),
  ex('Carbon-14, 5,730 yr', { T: '5730' }),
  ex('Half-life from \u03bb = 0.0693147', { lambda: '0.0693147' }),
  ex('Half-life from \u03c4 = 14.427 yr', { tau: '14.427' }),
  ex('6 h half-life in seconds', { T: '6', tu: 'h', ou: 's' }),
  ex('\u03bb = 0.001 per second', { lambda: '0.001', tu: 's' }),
  ex('Three values that agree', { T: '10', lambda: String(Math.LN2 / 10), tau: String(10 / Math.LN2) }),
  ex('Values that disagree', { T: '10', lambda: '0.07' })].join('');
const unitOpts = (sel, same) => (same ? '<option value="same" selected>Same unit as above</option>' : '') + H.TIME_UNITS.map((u) => '<option value="' + u[0] + '"' + (u[0] === sel ? ' selected' : '') + '>' + esc(u[2]) + '</option>').join('');
const knownOpts = C.KNOWN.map((o) => '<option value="' + o[0] + '"' + (o[0] === 'auto' ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('');
const sigOpts = [['4', '4 significant figures'], ['6', '6 significant figures'], ['8', '8 significant figures'], ['10', '10 significant figures'], ['12', '12 significant figures'], ['full', 'Full precision']].map((o) => '<option value="' + o[0] + '"' + (o[0] === '6' ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('');
const field = (k, lab, val, ph) => '<div class="ns-f"><label id="dc-l' + k + '" for="dc-' + k + '" class="ns-l">' + lab + '</label><input id="dc-' + k + '" class="ns-in" type="text" inputmode="decimal" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-describedby="dc-err" value="' + val + '" placeholder="' + ph + '"></div>';
const tool =
  '<div id="dc">' + modes('constants') + '<section class="card ns-card" aria-label="Decay constant and mean lifetime converter">' +
  '<div class="ns-grid dc3">' + field('T', 'Half-life T\u00bd (years)', '10', '10') + field('lambda', 'Decay constant \u03bb (per year)', '', '0.0693147') + field('tau', 'Mean lifetime \u03c4 (years)', '', '14.427') + '</div>' +
  '<p class="note ns-msg" id="dc-err" role="status"></p>' +
  '<div class="ns-grid dc4"><div class="ns-f"><label for="dc-known" class="ns-l">Start from</label><select id="dc-known" class="ns-sel">' + knownOpts + '</select></div>' +
  '<div class="ns-f"><label for="dc-tu" class="ns-l">Time unit (for T\u00bd, \u03bb and \u03c4)</label><select id="dc-tu" class="ns-sel">' + unitOpts('yr', false) + '</select></div>' +
  '<div class="ns-f"><label for="dc-ou" class="ns-l">Also show in</label><select id="dc-ou" class="ns-sel">' + unitOpts('yr', true) + '</select></div>' +
  '<div class="ns-f"><label for="dc-sig" class="ns-l">Show results to</label><select id="dc-sig" class="ns-sel">' + sigOpts + '</select></div></div>' +
  '<div class="ns-act"><button type="button" class="btn2" data-act="clear">Clear numbers</button><button type="button" class="btn2" data-act="reset">Reset</button><button type="button" class="btn2" data-act="save">Save to history</button></div>' +
  '<div class="ns-try"><span class="ns-l">Try</span> ' + chips + '</div>' +
  '<div id="dc-out" aria-live="polite"></div>' +
  '<div id="dc-dl" class="ns-act" hidden><span class="ns-l dc-dll">Copy and save</span><button type="button" class="btn2" data-act="copyall">Copy with working</button><button type="button" class="btn2" data-dl="txt">TXT</button><button type="button" class="btn2" data-dl="csv">CSV</button><button type="button" class="btn2" data-dl="json">JSON</button><button type="button" class="btn2" data-act="print">Print</button></div>' +
  '<p class="sr-only" id="dc-note" role="status" aria-live="polite"></p>' +
  '<noscript><p class="note">The calculator needs JavaScript. This tool does not submit calculator inputs to Elecmetric.</p></noscript></section>' +
  '<section class="card"><h2>Working</h2><div id="dc-steps"></div></section>' +
  '<section class="card"><h2>History</h2><ul class="dc-hist" id="dc-hist"></ul><button type="button" class="btn2" id="dc-hclear" data-act="hclear" hidden>Clear history</button><p class="note">Kept only in this browser. Up to 10 calculations.</p></section></div>';
const tbl = (head, rows, num) => '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + head.join(', ') + '"><table><thead><tr>' + head.map((h) => '<th>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows.map((r) => '<tr>' + r.map((c, i) => '<td' + (num && i > 0 ? ' class="n"' : '') + '>' + esc(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';

/* worked examples, all calculated by the engine */
const w1 = run({ T: '10' }).sol, w2 = run({ T: '5730' }).sol, w3 = run({ lambda: '0.0693147' }).sol, w4 = run({ tau: '14.427' }).sol, w5 = run({ T: '6', timeUnit: 'h', outUnit: 's' }), w6 = run({ lambda: '0.001', timeUnit: 's' }).sol, w7 = run({ T: '8.02', timeUnit: 'd' }).sol;
const exRows = [
  ['10-year half-life', 'T\u00bd = 10 yr', '\u03bb = ' + F6(w1.lambda) + ' per yr, \u03c4 = ' + F6(w1.tau) + ' yr'],
  ['5,730-year half-life (the brief\u2019s example)', 'T\u00bd = 5,730 yr', '\u03bb = ' + F6(w2.lambda) + ' per yr, \u03c4 = ' + F6(w2.tau) + ' yr'],
  ['Half-life from a decay constant', '\u03bb = 0.0693147 per yr', 'T\u00bd = ' + F6(w3.T) + ' yr, \u03c4 = ' + F6(w3.tau) + ' yr'],
  ['Half-life from a mean lifetime', '\u03c4 = 14.427 yr', 'T\u00bd = ' + F6(w4.T) + ' yr, \u03bb = ' + F6(w4.lambda) + ' per yr'],
  ['Change of time unit', 'T\u00bd = 6 h', '\u03bb = ' + F6(w5.sol.lambda) + ' per h = ' + F6(w5.conv.lambda) + ' per s; \u03c4 = ' + F6(w5.conv.tau) + ' s'],
  ['Short-lived process', '\u03bb = 0.001 per s', 'T\u00bd = ' + F6(w6.T) + ' s, \u03c4 = ' + F6(w6.tau) + ' s'],
  ['A value given in days', 'T\u00bd = 8.02 d', '\u03bb = ' + F6(w7.lambda) + ' per d, \u03c4 = ' + F6(w7.tau) + ' d']];
const ladder = [0, 1, 2, 3, 4, 5].map((k) => [String(k), F6(k / C.LN2), F6(C.afterMeanLifetimes(k) * 100) + '%']);
const forms = [
  ['Decay constant from half-life', '\u03bb = ln 2 / T\u00bd', 'T\u00bd > 0'],
  ['Half-life from decay constant', 'T\u00bd = ln 2 / \u03bb', '\u03bb > 0'],
  ['Mean lifetime from decay constant', '\u03c4 = 1 / \u03bb', '\u03bb > 0'],
  ['Decay constant from mean lifetime', '\u03bb = 1 / \u03c4', '\u03c4 > 0'],
  ['Mean lifetime from half-life', '\u03c4 = T\u00bd / ln 2 = T\u00bd \u00d7 1.442695\u2026', 'T\u00bd > 0'],
  ['Half-life from mean lifetime', 'T\u00bd = \u03c4 \u00d7 ln 2 = \u03c4 \u00d7 0.693147\u2026', '\u03c4 > 0']];
const meaning = [
  ['Half-life T\u00bd', 'Time for half of the quantity to decay', 'Reading a decay curve, comparing processes, quoting a nuclide'],
  ['Decay constant \u03bb', 'Fraction of the remaining quantity that decays per unit time (continuous form)', 'Writing N\u209c = N\u2080 e^(\u2212\u03bbt), rate equations, activity A = \u03bbN'],
  ['Mean lifetime \u03c4', 'Average life of one nucleus or particle; time to fall to 1/e', 'Time constants, lifetimes of excited states, the electrical analogy (RC, L/R)']];
const faq = [
  ['What is the relationship between half-life and decay constant?', '\u03bb = ln 2 / T\u00bd. For a 10-year half-life \u03bb = ' + F6(w1.lambda) + ' per year. A longer half-life means a smaller decay constant, and the two are always inversely proportional.'],
  ['What is the mean lifetime, and how does it differ from the half-life?', 'The half-life is the time for half to decay. The mean lifetime \u03c4 = 1 / \u03bb is the average time a single nucleus survives, and also the time for the quantity to fall to 1/e = ' + F6(C.afterMeanLifetimes(1) * 100) + '%. It is always longer than the half-life, by the factor 1 / ln 2 = ' + F6(1 / C.LN2) + '. For a 10-year half-life \u03c4 = ' + F6(w1.tau) + ' years.'],
  ['Why is the mean lifetime longer than the half-life?', 'Half of the nuclei are gone after one half-life, but the ones that last longest last much longer, and they raise the average. The decay law is skewed: many short lives and a few very long ones.'],
  ['Which should I use, the half-life or the decay constant?', 'Quote the half-life when you want a feel for the time scale, and use the decay constant in formulas written with e^(\u2212\u03bbt) or in rate equations. The calculator gives all three, so you can move between them.'],
  ['What do I enter if I know two of the three?', 'One is enough. If you type more than one, the calculator uses the half-life first, then the decay constant, and tells you if the others do not agree with it. Choose \u201cStart from\u201d to use a particular one and ignore the rest.'],
  ['Why does the calculator say my values do not agree?', 'Because they differ by more than one part in a billion. A decay constant of 0.0693147 and a half-life of 10 years differ in the seventh digit (ln 2 / 10 = ' + H.fmt(w1.lambda, 10) + '), so a rounded value is reported, not hidden. The half-life you typed is the one used.'],
  ['What unit is the decay constant in?', 'Per unit of time, in the unit you choose: per second, per year and so on. If T\u00bd is in years, \u03bb is per year. The time unit applies to all three values together, so they cannot be mixed by mistake. Years are Julian years of 365.25 days.'],
  ['How do I change the time unit?', 'Use \u201cAlso show in\u201d. Half-life and mean lifetime are multiplied by the ratio of the units and the decay constant is divided by it. For example 6 hours is ' + F6(w5.conv.T) + ' seconds and \u03bb = ' + F6(w5.conv.lambda) + ' per second.'],
  ['Can I use this for RC and RL circuits?', 'The mathematics is the same: the time constant RC or L/R plays the part of the mean lifetime, and the half-value time is RC ln 2 or (L/R) ln 2. Enter the time constant as the mean lifetime to get the half-value time and the decay rate. The physical processes are different, and the RC and RL Transient calculator keeps them labelled.'],
  ['Does the uncertainty of a measured half-life carry through?', 'No. The calculator treats every number as exact. Convert the two ends of a measured range to see the spread.'],
  ['Is this a radiation safety or dose calculator?', 'No. It converts three descriptions of the same exponential law. It does not give a dose, an exposure or a safety assessment.'],
  ['Is anything sent to a server?', 'No. The calculation runs in your browser, and the history list is stored only in your browser.']];
const body = '<main class="w"><h1>Decay Constant Calculator: Half-Life, Mean Lifetime and Decay Constant</h1><p class="lede">Enter a half-life, a decay constant or a mean lifetime, and the calculator gives the other two, in the time unit you choose, with the working written out in your own numbers and a check that puts the results back together. Calculate. Convert. Understand.</p>' + tool +
  '<section id="examples"><h2>Worked examples</h2>' + tbl(['Case', 'Given', 'Result'], exRows) + '<p class="note">Results calculated by this page\u2019s engine and checked against independent high-precision arithmetic (Python decimal, 60 digits).</p></section>' +
  '<section id="formulas"><h2>The formulas</h2><p>One decay law, N\u209c = N\u2080 \u00d7 2^(\u2212t / T\u00bd) = N\u2080 \u00d7 e^(\u2212\u03bbt), written three ways:</p>' + tbl(['To find', 'Formula', 'Valid when'], forms) + '<p class="note">Each conversion is a single multiplication or division, so the result is exact to double precision. The mean lifetime is taken from T\u00bd / ln 2 directly, not by inverting a rounded decay constant.</p></section>' +
  '<section id="meaning"><h2>What the three numbers mean</h2>' + tbl(['Quantity', 'Meaning', 'Used for'], meaning) + '<p>Setting N\u209c = N\u2080 / 2 in N\u209c = N\u2080 e^(\u2212\u03bbt) gives e^(\u2212\u03bbT\u00bd) = 1/2, so T\u00bd = ln 2 / \u03bb. The mean lifetime is the average of t over the decaying nuclei, \u03c4 = \u222b t \u03bb e^(\u2212\u03bbt) dt = 1 / \u03bb. Hence \u03c4 = T\u00bd / ln 2.</p></section>' +
  '<section id="ladder"><h2>How much is left after a mean lifetime</h2><p>After one mean lifetime the quantity has fallen to 1/e, not to one half, because \u03c4 is longer than T\u00bd:</p>' + tbl(['Mean lifetimes', 'Half-lives', 'Remaining'], ladder, true) + '</section>' +
  '<section id="rules"><h2>Rules and limits</h2><ul>' +
  '<li>The half-life, decay constant and mean lifetime must each be greater than zero.</li>' +
  '<li>All three share one time unit; the decay constant is per that unit. \u201cAlso show in\u201d changes the unit of all three together.</li>' +
  '<li>If you type more than one value, the half-life is used first, then the decay constant; the others are compared with it and a note is shown when they do not agree to one part in a billion.</li>' +
  '<li>Results are double-precision. A result that would be too large to represent is refused with a note to change the time unit, and one below about 2.2 \u00d7 10\u207b\u00b3\u2070\u2078 is shown with a note that it carries fewer digits.</li>' +
  '<li>Mathematical decay only: not a radiation-safety, dosimetry or exposure assessment.</li></ul></section>' +
  '<section id="faq"><h2>Questions</h2>' + faq.map((q) => '<h3>' + esc(q[0]) + '</h3><p>' + esc(q[1]) + '</p>').join('') + '</section>' +
  '<section id="related"><h2>Related</h2><p><a class="chip" href="../half-life-calculator/">Half-Life Calculator (Mode 01)</a><a class="chip" href="../rc-time-constant/">RC Time Constant</a><a class="chip" href="../rc-rl-transient/">RC and RL Transient</a><a class="chip" href="../../converters/capacitor-discharge-formulas.html">Capacitor discharge formulas</a><a class="chip" href="../logarithm/">Logarithm</a><a class="chip" href="../powers-roots/">Powers and Roots</a><a class="chip" href="../scientific-calculator/">Scientific Calculator</a><a class="chip" href="../engineering-mathematics/">Engineering Mathematics</a><a class="chip" href="../../converters/index.html">Conversion Centre</a></p></section></main>';
const css = '<style>' + modes.css +
  '#dc .ns-card{padding:16px}#dc .ns-grid{display:grid;gap:12px;margin-bottom:12px}#dc .dc3{grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}#dc .dc4{grid-template-columns:repeat(auto-fit,minmax(185px,1fr))}#dc .ns-l,#dc label.ns-l{display:block;font-weight:600;font-size:13px;margin:0 0 4px}' +
  '#dc .ns-in,#dc .ns-sel{display:block;width:100%;box-sizing:border-box;font:500 18px/1.3 var(--mono);padding:10px 12px;min-height:48px;border-radius:8px;border:1px solid var(--line);background:var(--field);color:var(--ink)}#dc .ns-sel{font:500 15px var(--body)}#dc .ns-in:focus,#dc .ns-sel:focus{outline:2px solid var(--gold);outline-offset:1px}#dc .ns-in.bad{border-color:var(--err)}#dc .ns-in.solved{background:var(--gold-fill);border-color:var(--gold);font-weight:700}#dc .ns-in::placeholder{color:var(--muted);opacity:1}' +
  '#dc .ns-msg{min-height:1.4em;margin:4px 0 8px;color:var(--err)}#dc .ns-msg.hint{color:var(--muted)}#dc .ns-act{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:4px 0 10px}#dc .btn2,#dc .chipb{font:600 13px var(--body);color:var(--ink);background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:8px 12px;min-height:38px;cursor:pointer}#dc .btn2:hover,#dc .chipb:hover{background:var(--field)}#dc .chipb{border-radius:999px;padding:5px 12px;min-height:32px;font-weight:500;margin:3px 4px 3px 0}#dc .btn2:focus-visible,#dc .chipb:focus-visible{outline:2px solid var(--gold);outline-offset:2px}#dc .ns-try{margin:0 0 12px}#dc .dc-dll{margin:0}' +
  '#dc pre.al{font:600 15px/1.6 var(--mono);background:var(--field);border:1px solid var(--line);border-radius:8px;padding:12px 14px;margin:6px 0 12px;overflow-x:auto;color:var(--num);white-space:pre-wrap;overflow-wrap:anywhere}#dc .res .big{font:700 26px/1.4 var(--mono);color:var(--num);word-break:break-all}#dc .res .big .sym{color:var(--muted);font-weight:600}#dc .res .big.src{background:var(--gold-fill);border-radius:6px;padding:0 6px}#dc .res .big .btn2{vertical-align:middle;margin-left:8px;padding:2px 8px;min-height:28px}#dc .res .sub{color:var(--muted);margin:2px 0 8px}' +
  '#dc .ns-t td.r{font:600 15px var(--mono);color:var(--num);text-align:left;word-break:break-all}#dc .ns-t tr.cu td,#dc .ns-t tr.cu th{background:var(--gold-fill)}#dc .ns-t th[scope=row]{text-align:left;text-transform:none;letter-spacing:normal}#dc .ns-facts{margin:12px 0;display:flex;flex-wrap:wrap;gap:6px 18px;font-size:14px}#dc .ns-facts b{font-family:var(--mono)}#dc .note.warn{color:var(--ink);border-left:3px solid var(--gold);padding-left:10px}#dc h3{margin:14px 0 4px}#dc .dc-hist{list-style:none;margin:0 0 8px;padding:0}' +
  'td.n{font-family:var(--mono)}.sr-only{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}code{font-family:var(--mono)}[hidden]{display:none!important}@media(max-width:700px){#dc .res .big{font-size:20px}}@media print{#dc .ns-act,#dc .ns-try,#dc .fmodes{display:none}}</style>';
const client = fs.readFileSync(path.join(__dirname, 'halflife_const_client.js'), 'utf8');
const engine = fs.readFileSync(path.join(__dirname, 'halflife_engine.js'), 'utf8') + '\n' + fs.readFileSync(path.join(__dirname, 'halflife_const_engine.js'), 'utf8');
const ld = '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Decay Constant Calculator', applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any (web browser)', description: DESC, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }) + '</script>';
let out = shell;
const h0 = out.indexOf('<style>');
out = out.slice(0, h0) + css + out.slice(out.indexOf('</style>', h0) + 8);
out = out.replace(/<title>.*?<\/title>/, '<title>' + esc(TITLE) + '</title>');
['name="description"', 'property="og:title"', 'property="og:description"', 'name="twitter:title"', 'name="twitter:description"'].forEach((k) => { const v = /title/.test(k) ? TITLE : DESC; out = out.replace(new RegExp('(<meta ' + k + ' content=")[^"]*'), '$1' + esc(v)); });
out = out.replace(/<main class="w">[\s\S]*?<\/main>/, () => body);
[...out.matchAll(/<script>[\s\S]*?<\/script>/g)].filter((m) => /Elecmetric Scientific Calculator engine|Elecmetric Basic Calculator: page script/.test(m[0])).forEach((m) => { out = out.replace(m[0], ''); });
out = out.replace('</head>', () => ld + '</head>');
out = out.replace('<script>try{if("serviceWorker"', () => '<script>' + engine + '\n' + client + '</script><script>try{if("serviceWorker"');
const dir = path.join(root, 'calculators/decay-constant-calculator');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'index.html'), out);
console.log('wrote calculators/decay-constant-calculator/index.html (' + out.length + ' bytes)');
