/* Builds calculators/decay-percentage-calculator/index.html (Elecmetric Half-Life Calculator, Mode 03: remaining and decayed percentage). Run: node tools/halflife_percent_page.js
   Takes the page shell from the Basic Calculator and the engines and script from tools/halflife_engine.js, tools/halflife_percent_engine.js and tools/halflife_percent_client.js.
   Every example number on the page is calculated by the engine at build time, so the page text can never disagree with the calculator. */
const fs = require('fs'), path = require('path');
const H = require('./halflife_engine.js'), P = require('./halflife_percent_engine.js'), modes = require('./halflife_modes.js');
const root = path.join(__dirname, '..');
const shell = fs.readFileSync(path.join(root, 'calculators/basic-calculator/index.html'), 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const TITLE = 'Decay Percentage Calculator | Remaining and Decayed Percentage from Half-Life';
const DESC = 'Free decay percentage calculator with step-by-step working. Enter the elapsed time and the half-life (and an initial quantity if you have one) to get the remaining and decayed percentage, the remaining and decayed quantity and the number of half-lives.';
const run = (o) => { const r = P.run(Object.assign({ timeUnit: 'yr' }, o)); if (!r.ok) throw new Error('page example failed ' + JSON.stringify(o) + ': ' + r.error); return r; };
const F6 = (v) => H.fmt(v, 6), PC = (f) => F6(f * 100) + '%';
const D = { N0: '', t: '', T: '', tu: 'yr', hu: 'same', qu: '', sig: '6' };
const ex = (label, d) => '<button type="button" class="chipb" data-ex="' + esc(JSON.stringify(Object.assign({}, D, d))) + '">' + esc(label) + '</button>';
const chips = [
  ex('100 g after 11,460 yr (T\u00bd 5,730 yr)', { N0: '100', qu: 'g', t: '11460', T: '5730' }),
  ex('100 g after one half-life', { N0: '100', qu: 'g', t: '10', T: '10' }),
  ex('100 g after three half-lives', { N0: '100', qu: 'g', t: '30', T: '10' }),
  ex('T\u00bd 10 yr, 20 yr elapsed (percent only)', { t: '20', T: '10' }),
  ex('Less than one half-life: 3 of 10 yr', { t: '3', T: '10' }),
  ex('3 days with a 12 h half-life', { N0: '800', qu: 'MBq', t: '3', tu: 'd', T: '12', hu: 'h' }),
  ex('8.02-day half-life, 30 days', { N0: '50', qu: 'mg', t: '30', tu: 'd', T: '8.02', hu: 'd' }),
  ex('Time zero', { N0: '100', qu: 'g', t: '0', T: '10' }),
  ex('100 half-lives', { t: '1000', T: '10' })].join('');
const unitOpts = (sel, same) => (same ? '<option value="same" selected>Same unit as elapsed time</option>' : '') + H.TIME_UNITS.map((u) => '<option value="' + u[0] + '"' + (u[0] === sel ? ' selected' : '') + '>' + esc(u[2]) + '</option>').join('');
const sigOpts = [['4', '4 significant figures'], ['6', '6 significant figures'], ['8', '8 significant figures'], ['10', '10 significant figures'], ['12', '12 significant figures'], ['full', 'Full precision']].map((o) => '<option value="' + o[0] + '"' + (o[0] === '6' ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('');
const field = (k, lab, val, ph, extra) => '<div class="ns-f"><label id="dp-l' + k + '" for="dp-' + k + '" class="ns-l">' + lab + '</label><input id="dp-' + k + '" class="ns-in" type="text" inputmode="decimal" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-describedby="dp-err" value="' + val + '" placeholder="' + ph + '"></div>';
const tool =
  '<div id="dp">' + modes('percent') + '<section class="card ns-card" aria-label="Decay percentage calculator">' +
  '<div class="ns-grid dp3">' + field('N0', 'Initial quantity N\u2080 (optional)', '100', 'leave empty for percentages only') +
  '<div class="ns-f"><label for="dp-qu" class="ns-l">Quantity unit (label only)</label><input id="dp-qu" class="ns-in" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="16" value="g" placeholder="g, mg, Bq, %"></div></div>' +
  '<div class="ns-grid dp3"><div class="dp-pair">' + field('t', 'Elapsed time t (years)', '11460', '11460') + '<div class="ns-f"><label for="dp-tu" class="ns-l">Unit</label><select id="dp-tu" class="ns-sel">' + unitOpts('yr', false) + '</select></div></div>' +
  '<div class="dp-pair">' + field('T', 'Half-life T\u00bd (years)', '5730', '5730') + '<div class="ns-f"><label for="dp-hu" class="ns-l">Unit</label><select id="dp-hu" class="ns-sel">' + unitOpts('yr', true) + '</select></div></div></div>' +
  '<p class="note ns-msg" id="dp-err" role="status"></p>' +
  '<div class="ns-grid dp4"><div class="ns-f"><label for="dp-sig" class="ns-l">Show results to</label><select id="dp-sig" class="ns-sel">' + sigOpts + '</select></div></div>' +
  '<div class="ns-act"><button type="button" class="btn2" data-act="clear">Clear numbers</button><button type="button" class="btn2" data-act="reset">Reset</button><button type="button" class="btn2" data-act="save">Save to history</button></div>' +
  '<div class="ns-try"><span class="ns-l">Try</span> ' + chips + '</div>' +
  '<div id="dp-out" aria-live="polite"></div>' +
  '<div id="dp-dl" class="ns-act" hidden><span class="ns-l dp-dll">Copy and save</span><button type="button" class="btn2" data-act="copyall">Copy with working</button><button type="button" class="btn2" data-dl="txt">TXT</button><button type="button" class="btn2" data-dl="csv">CSV</button><button type="button" class="btn2" data-dl="json">JSON</button><button type="button" class="btn2" data-act="print">Print</button></div>' +
  '<p class="sr-only" id="dp-note" role="status" aria-live="polite"></p>' +
  '<noscript><p class="note">The calculator needs JavaScript. Nothing is sent anywhere.</p></noscript></section>' +
  '<section class="card"><h2>Working</h2><div id="dp-steps"></div></section>' +
  '<section class="card"><h2>History</h2><ul class="dp-hist" id="dp-hist"></ul><button type="button" class="btn2" id="dp-hclear" data-act="hclear" hidden>Clear history</button><p class="note">Kept only in this browser. Up to 10 calculations.</p></section></div>';
const tbl = (head, rows, num) => '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + head.join(', ') + '"><table><thead><tr>' + head.map((h) => '<th>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows.map((r) => '<tr>' + r.map((c, i) => '<td' + (num && i > 0 ? ' class="n"' : '') + '>' + esc(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';

/* worked examples, all calculated by the engine */
const w1 = run({ N0: '100', t: '11460', T: '5730' }).sol, w2 = run({ N0: '100', t: '10', T: '10' }).sol, w3 = run({ N0: '100', t: '30', T: '10' }).sol, w4 = run({ t: '20', T: '10' }).sol, w5 = run({ t: '3', T: '10' }).sol, w6 = run({ N0: '800', t: '3', timeUnit: 'd', T: '12', halfLifeUnit: 'h' }).sol, w7 = run({ N0: '50', t: '30', timeUnit: 'd', T: '8.02' }).sol, w8 = run({ t: '1000', T: '10' }).sol;
const exRows = [
  ['100 g after 11,460 yr, T\u00bd 5,730 yr', 'n = ' + F6(w1.n), PC(w1.remFrac) + ' left = ' + F6(w1.remQty) + ' g; ' + PC(w1.decFrac) + ' decayed = ' + F6(w1.decQty) + ' g'],
  ['100 g after one half-life', 'n = ' + F6(w2.n), F6(w2.remQty) + ' g left (' + PC(w2.remFrac) + ')'],
  ['100 g after three half-lives', 'n = ' + F6(w3.n), F6(w3.remQty) + ' g left (' + PC(w3.remFrac) + '), exactly 1 / 8'],
  ['T\u00bd 10 yr, 20 yr elapsed', 'n = ' + F6(w4.n), PC(w4.remFrac) + ' left, ' + PC(w4.decFrac) + ' decayed'],
  ['3 yr of a 10-year half-life', 'n = ' + F6(w5.n), PC(w5.remFrac) + ' left, ' + PC(w5.decFrac) + ' decayed'],
  ['3 days with a 12 h half-life, 800 units', 'n = ' + F6(w6.n), PC(w6.remFrac) + ' left = ' + F6(w6.remQty) + ' units'],
  ['30 days with an 8.02-day half-life, 50 mg', 'n = ' + F6(w7.n), PC(w7.remFrac) + ' left = ' + F6(w7.remQty) + ' mg'],
  ['100 half-lives', 'n = ' + F6(w8.n), PC(w8.remFrac) + ' left']];
const lad = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((k) => [String(k), F6(P.remainingFraction(k) * 100) + '%', F6(P.decayedFraction(k, P.remainingFraction(k)) * 100) + '%', F6(100 * P.remainingFraction(k)) + ' g']);
const forms = [
  ['Half-lives elapsed', 'n = t / T\u00bd', 't and T\u00bd in the same unit; t \u2265 0, T\u00bd > 0'],
  ['Fraction remaining', 'f = 2^(\u2212n) = (1/2)^n', 'any n \u2265 0'],
  ['Remaining percentage', 'f \u00d7 100%', ''],
  ['Fraction decayed', '1 \u2212 f = 1 \u2212 2^(\u2212n)', ''],
  ['Decayed percentage', '(1 \u2212 f) \u00d7 100% = 100% \u2212 remaining %', ''],
  ['Remaining quantity', 'N\u209c = N\u2080 \u00d7 f', 'N\u2080 > 0'],
  ['Decayed quantity', 'N\u2080 \u2212 N\u209c = N\u2080 \u00d7 (1 \u2212 f)', 'N\u2080 > 0'],
  ['Time to fall to a percentage p', 't = T\u00bd \u00d7 log\u2082(100 / p)', '0 < p \u2264 100']];
const faq = [
  ['How do I calculate the percentage remaining after a given time?', 'Divide the elapsed time by the half-life to get the number of half-lives n, then the fraction left is 2^(\u2212n). For a 10-year half-life and 20 years that is n = ' + F6(w4.n) + ' and ' + PC(w4.remFrac) + ' left.'],
  ['Do I have to enter an initial quantity?', 'No. The percentages do not depend on it. Leave it empty to see percentages only, or enter it to also get the remaining and decayed quantity in whatever unit you label it with.'],
  ['What if the elapsed time is not a whole number of half-lives?', 'The same formula works. After ' + F6(w5.n) + ' half-lives (3 years of a 10-year half-life) ' + PC(w5.remFrac) + ' is left. Do not interpolate between the halving steps; the decay is smooth, not stepped.'],
  ['Can the elapsed time and the half-life be in different units?', 'Yes. Pick a unit for each. The elapsed time is converted to the unit of the half-life first, using exact unit ratios (a year is 365.25 days). Three days with a 12 hour half-life is ' + F6(w6.n) + ' half-lives, and ' + PC(w6.remFrac) + ' is left.'],
  ['Why is 100 g after three half-lives exactly 12.5 g?', 'Because three halvings give 100 \u00d7 (1/2)\u00b3 = 12.5, and the calculator computes powers of two directly rather than through a logarithm, so whole numbers of half-lives are exact: ' + F6(w3.remQty) + ' g, ' + PC(w3.remFrac) + '.'],
  ['What is the decayed percentage?', 'The part of the original that has gone: 100% minus the remaining percentage. After one half-life it is 50%, after two 75%, after three ' + PC(w3.decFrac) + '. It approaches 100% but never reaches it in finite time.'],
  ['Why does the decayed percentage never reach 100%?', 'Each half-life removes half of what is left, so some always remains. After 100 half-lives the fraction left is ' + PC(w8.remFrac) + ', tiny but not zero. For a count of whole atoms the last one decays at a random moment, which is a statistical statement the model does not make.'],
  ['What happens at an elapsed time of zero?', 'Nothing has decayed: n = 0, 100% remains and 0% has decayed. The calculator accepts zero for the elapsed time and refuses a negative one.'],
  ['Why is a zero initial quantity refused?', 'A percentage of nothing is undefined, and the remaining quantity would be 0 whatever the time. Leave the field empty if you only want the percentages.'],
  ['How accurate are very small decayed percentages?', 'For a short time next to the half-life the decayed fraction is computed as \u2212expm1(\u2212n ln 2) rather than 1 \u2212 2^(\u2212n), which would round to zero. A time of one billionth of a half-life gives a decay of ' + F6(run({ t: '1e-9', T: '1' }).sol.decFrac) + ', not 0.'],
  ['Does this give the time needed to reach a given percentage?', 'The table under the results shows how long it takes to fall to 90%, 75%, 50%, 25%, 10%, 5%, 1% and 0.1% for the half-life you entered. For any other target use the Half-Life Calculator (Mode 01), which solves for the elapsed time.'],
  ['Is this a radiation safety or dose calculator?', 'No. It evaluates one exponential law. It does not give a dose, an exposure or a safety assessment, and it ignores any growth from a parent nuclide.'],
  ['Is anything sent to a server?', 'No. The calculation runs in your browser, and the history list is stored only in your browser.']];
const body = '<main class="w"><h1>Decay Percentage Calculator: Remaining and Decayed Percentage</h1><p class="lede">Enter the elapsed time and the half-life, and add an initial quantity if you have one. The calculator gives the percentage remaining, the percentage decayed, the remaining and decayed quantity and the number of half-lives, with the working written out in your own numbers. Calculate. Convert. Understand.</p>' + tool +
  '<section id="examples"><h2>Worked examples</h2>' + tbl(['Case', 'Half-lives', 'Result'], exRows) + '<p class="note">Results calculated by this page\u2019s engine and checked against independent high-precision arithmetic (Python decimal, 450 digits for the decayed fraction).</p></section>' +
  '<section id="formulas"><h2>The formulas</h2><p>One decay law, N\u209c = N\u2080 \u00d7 2^(\u2212t / T\u00bd), turned into percentages:</p>' + tbl(['To find', 'Formula', 'Valid when'], forms) + '<p class="note">The percentage remaining depends only on how many half-lives have passed, not on the substance or the starting amount. That is why the initial quantity is optional.</p></section>' +
  '<section id="ladder"><h2>The halving ladder</h2><p>Each half-life halves what is left. For a start of 100 g:</p>' + tbl(['Half-lives', 'Remaining', 'Decayed', 'Quantity left'], lad, true) + '</section>' +
  '<section id="rules"><h2>Rules and limits</h2><ul>' +
  '<li>The half-life must be greater than zero, and the elapsed time cannot be negative; zero is allowed and leaves 100%.</li>' +
  '<li>The initial quantity is optional; when entered it must be greater than zero.</li>' +
  '<li>The elapsed time and the half-life each have their own time unit, from nanoseconds to billions of years. A year is a Julian year of 365.25 days.</li>' +
  '<li>The quantity unit is a label only. Nothing is converted, and the percentages do not depend on it.</li>' +
  '<li>Results are double-precision. A remaining fraction below about 5 \u00d7 10\u207b\u00b3\u00b2\u2074 shows as 0% with a note that it is not exactly zero, and one below about 2.2 \u00d7 10\u207b\u00b3\u2070\u2078 is flagged as carrying fewer digits.</li>' +
  '<li>Mathematical decay only: not a radiation-safety, dosimetry or exposure assessment.</li></ul></section>' +
  '<section id="faq"><h2>Questions</h2>' + faq.map((q) => '<h3>' + esc(q[0]) + '</h3><p>' + esc(q[1]) + '</p>').join('') + '</section>' +
  '<section id="related"><h2>Related</h2><p><a class="chip" href="../half-life-calculator/">Half-Life Calculator (Mode 01)</a><a class="chip" href="../decay-constant-calculator/">Decay Constant Calculator (Mode 02)</a><a class="chip" href="../basic-percentage-calculator/">Basic Percentage Calculator</a><a class="chip" href="../percentage-increase-decrease-calculator/">Percentage Increase and Decrease</a><a class="chip" href="../rc-time-constant/">RC Time Constant</a><a class="chip" href="../rc-rl-transient/">RC and RL Transient</a><a class="chip" href="../logarithm/">Logarithm</a><a class="chip" href="../powers-roots/">Powers and Roots</a><a class="chip" href="../engineering-mathematics/">Engineering Mathematics</a><a class="chip" href="../../converters/index.html">Conversion Centre</a></p></section></main>';
const css = '<style>' + modes.css +
  '#dp .ns-card{padding:16px}#dp .ns-grid{display:grid;gap:12px;margin-bottom:12px}#dp .dp3{grid-template-columns:repeat(auto-fit,minmax(230px,1fr))}#dp .dp4{grid-template-columns:repeat(auto-fit,minmax(185px,1fr))}#dp .dp-pair{display:grid;grid-template-columns:minmax(0,1fr) minmax(110px,150px);gap:8px;align-items:end}#dp .ns-l,#dp label.ns-l{display:block;font-weight:600;font-size:13px;margin:0 0 4px}' +
  '#dp .ns-in,#dp .ns-sel{display:block;width:100%;box-sizing:border-box;font:500 18px/1.3 var(--mono);padding:10px 12px;min-height:48px;border-radius:8px;border:1px solid var(--line);background:var(--field);color:var(--ink)}#dp .ns-sel{font:500 15px var(--body)}#dp .ns-in:focus,#dp .ns-sel:focus{outline:2px solid var(--gold);outline-offset:1px}#dp .ns-in.bad{border-color:var(--err)}#dp .ns-in.solved{background:var(--gold-fill);border-color:var(--gold);font-weight:700}#dp .ns-in::placeholder{color:var(--muted);opacity:1}' +
  '#dp .ns-msg{min-height:1.4em;margin:4px 0 8px;color:var(--err)}#dp .ns-msg.hint{color:var(--muted)}#dp .ns-act{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:4px 0 10px}#dp .btn2,#dp .chipb{font:600 13px var(--body);color:var(--ink);background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:8px 12px;min-height:38px;cursor:pointer}#dp .btn2:hover,#dp .chipb:hover{background:var(--field)}#dp .chipb{border-radius:999px;padding:5px 12px;min-height:32px;font-weight:500;margin:3px 4px 3px 0}#dp .btn2:focus-visible,#dp .chipb:focus-visible{outline:2px solid var(--gold);outline-offset:2px}#dp .ns-try{margin:0 0 12px}#dp .dp-dll{margin:0}' +
  '#dp pre.al{font:600 15px/1.6 var(--mono);background:var(--field);border:1px solid var(--line);border-radius:8px;padding:12px 14px;margin:6px 0 12px;overflow-x:auto;color:var(--num);white-space:pre-wrap;overflow-wrap:anywhere}#dp .res .big{font:700 26px/1.4 var(--mono);color:var(--num);word-break:break-all}#dp .res .big .sym{color:var(--muted);font-weight:600}#dp .res .big.src{background:var(--gold-fill);border-radius:6px;padding:0 6px}#dp .res .big .btn2{vertical-align:middle;margin-left:8px;padding:2px 8px;min-height:28px}#dp .res .sub{color:var(--muted);margin:2px 0 8px}' +
  '#dp .ns-t td.r{font:600 15px var(--mono);color:var(--num);text-align:left;word-break:break-all}#dp .ns-t tr.cu td,#dp .ns-t tr.cu th{background:var(--gold-fill)}#dp .ns-t th[scope=row]{text-align:left;text-transform:none;letter-spacing:normal}#dp .ns-facts{margin:12px 0;display:flex;flex-wrap:wrap;gap:6px 18px;font-size:14px}#dp .ns-facts b{font-family:var(--mono)}#dp .note.warn{color:var(--ink);border-left:3px solid var(--gold);padding-left:10px}#dp h3{margin:14px 0 4px}#dp .dp-hist{list-style:none;margin:0 0 8px;padding:0}' +
  '#dp .dp-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin:8px 0 10px}#dp .dp-c{border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:var(--surface)}#dp .dp-c .big{font:700 26px/1.4 var(--mono);color:var(--num);word-break:break-all}#dp .dp-c .big .btn2{vertical-align:middle;margin-left:8px;padding:2px 8px;min-height:28px}#dp .dp-c .sub{color:var(--muted);font-size:14px}#dp .dp-bar{display:flex;height:22px;border-radius:6px;overflow:hidden;border:1px solid var(--line);background:var(--field)}#dp .dp-bar .rem{background:var(--gold);display:block}#dp .dp-bar .dec{flex:1;background:repeating-linear-gradient(45deg,var(--field),var(--field) 6px,var(--line) 6px,var(--line) 7px)}#dp .dp-key{display:flex;gap:16px;font-size:13px;margin:4px 0 12px}#dp .dp-key i{display:inline-block;width:12px;height:12px;margin-right:6px;border:1px solid var(--line);vertical-align:-1px}#dp .dp-key .k1{background:var(--gold)}#dp .dp-key .k2{background:var(--field)}#dp .ns-t td.r,#dp .ns-t th[scope=row]{font-variant-numeric:tabular-nums}@media(max-width:700px){#dp .dp-c .big{font-size:20px}}' +
  'td.n{font-family:var(--mono)}.sr-only{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}code{font-family:var(--mono)}[hidden]{display:none!important}@media(max-width:700px){#dp .res .big{font-size:20px}}@media print{#dp .ns-act,#dp .ns-try,#dp .fmodes{display:none}}</style>';
const client = fs.readFileSync(path.join(__dirname, 'halflife_percent_client.js'), 'utf8');
const engine = fs.readFileSync(path.join(__dirname, 'halflife_engine.js'), 'utf8') + '\n' + fs.readFileSync(path.join(__dirname, 'halflife_percent_engine.js'), 'utf8');
const ld = '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Decay Percentage Calculator', applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any (web browser)', description: DESC, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }) + '</script>';
let out = shell;
const h0 = out.indexOf('<style>');
out = out.slice(0, h0) + css + out.slice(out.indexOf('</style>', h0) + 8);
out = out.replace(/<title>.*?<\/title>/, '<title>' + esc(TITLE) + '</title>');
['name="description"', 'property="og:title"', 'property="og:description"', 'name="twitter:title"', 'name="twitter:description"'].forEach((k) => { const v = /title/.test(k) ? TITLE : DESC; out = out.replace(new RegExp('(<meta ' + k + ' content=")[^"]*'), '$1' + esc(v)); });
out = out.replace(/<main class="w">[\s\S]*?<\/main>/, () => body);
[...out.matchAll(/<script>[\s\S]*?<\/script>/g)].filter((m) => /Elecmetric Scientific Calculator engine|Elecmetric Basic Calculator: page script/.test(m[0])).forEach((m) => { out = out.replace(m[0], ''); });
out = out.replace('</head>', () => ld + '</head>');
out = out.replace('<script>try{if("serviceWorker"', () => '<script>' + engine + '\n' + client + '</script><script>try{if("serviceWorker"');
const dir = path.join(root, 'calculators/decay-percentage-calculator');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'index.html'), out);
console.log('wrote calculators/decay-percentage-calculator/index.html (' + out.length + ' bytes)');
