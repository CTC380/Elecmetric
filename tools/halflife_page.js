/* Builds calculators/half-life-calculator/index.html (Elecmetric Half-Life Calculator, Mode 01: four-variable solver). Run: node tools/halflife_page.js
   Takes the page shell from the Basic Calculator and the engine and script from tools/halflife_engine.js and tools/halflife_client.js. Every example number on
   the page is calculated by the engine at build time, so the page text can never disagree with the calculator. */
const fs = require('fs'), path = require('path');
const H = require('./halflife_engine.js'), modes = require('./halflife_modes.js'), ISO = require('./halflife_isotopes.js');
const root = path.join(__dirname, '..');
const shell = fs.readFileSync(path.join(root, 'calculators/basic-calculator/index.html'), 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const TITLE = 'Half-Life Calculator | Remaining Amount, Elapsed Time, Initial Quantity and Half-Life';
const DESC = 'Free half-life calculator with step-by-step working. Enter any three of initial quantity, remaining quantity, elapsed time and half-life to find the fourth, with remaining and decayed percentages, decay constant and mean lifetime.';
const run = (o) => { const r = H.run(Object.assign({ timeUnit: 'yr', quantityUnit: '' }, o)); if (!r.ok) throw new Error('page example failed ' + JSON.stringify(o) + ': ' + r.error); return r; };
const F6 = (v) => H.fmt(v, 6);
const D = { target: 'auto', N0: '', Nt: '', t: '', T: '', tu: 'yr', qu: 'g', sig: '6' };
const ex = (label, d) => '<button type="button" class="chipb" data-ex="' + esc(JSON.stringify(Object.assign({}, D, d))) + '">' + esc(label) + '</button>';
const chips = [
  ex('100 g, 11,460 yr, T\u00bd 5,730 yr', { N0: '100', t: '11460', T: '5730' }),
  ex('Time for 100 g to reach 25 g', { N0: '100', Nt: '25', T: '5730' }),
  ex('Half-life from 100 g to 25 g', { N0: '100', Nt: '25', t: '11460' }),
  ex('Initial amount from 25 g', { Nt: '25', t: '11460', T: '5730' }),
  ex('Three half-lives', { N0: '100', t: '30', T: '10' }),
  ex('Hours: 80 mg, T\u00bd 6 h, 24 h', { N0: '80', t: '24', T: '6', tu: 'h', qu: 'mg' }),
  ex('No decay observed', { N0: '100', Nt: '100', t: '10' }),
  ex('Very small amounts', { N0: '1e300', Nt: '1e-300', T: '1e9', qu: '' })].join('');
const unitOpts = H.TIME_UNITS.map((u) => '<option value="' + u[0] + '"' + (u[0] === 'yr' ? ' selected' : '') + '>' + esc(u[2]) + '</option>').join('');
const tgtOpts = H.TARGETS.map((o) => '<option value="' + o[0] + '"' + (o[0] === 'auto' ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('');
const sigOpts = [['4', '4 significant figures'], ['6', '6 significant figures'], ['8', '8 significant figures'], ['10', '10 significant figures'], ['12', '12 significant figures'], ['full', 'Full precision']].map((o) => '<option value="' + o[0] + '"' + (o[0] === '6' ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('');
const qunits = ['g', 'mg', '\u00b5g', 'kg', 'mol', 'Bq', 'MBq', 'mCi', 'atoms', 'nuclei', '%'].map((u) => '<option value="' + esc(u) + '">').join('');
const presetOpts = '<option value="">Choose an isotope (sets the half-life and its unit)</option>' + ISO.LIST.map((x) => '<option value="' + x.id + '" data-T="' + x.T + '" data-tu="' + x.unit + '" data-n="' + esc(x.name + ' (' + x.symbol + ')') + '" data-u="' + (x.unc === null ? '' : x.unc) + '" data-s="' + x.source + '">' + esc(x.symbol + ' \u00b7 ' + H.fmt(x.T, 8) + ' ' + H.timeLabel(x.unit, x.T)) + '</option>').join('');
const field = (k, lab, val, ph) => '<div class="ns-f"><label id="hl-l' + k + '" for="hl-' + k + '" class="ns-l">' + lab + '</label><input id="hl-' + k + '" class="ns-in" type="text" inputmode="decimal" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-describedby="hl-err" value="' + val + '" placeholder="' + ph + '"></div>';
const tool =
  '<div id="hl">' + modes('solver') + '<section class="card ns-card" aria-label="Half-life calculator">' +
  '<div class="ns-grid hl4">' + field('N0', 'Initial quantity N\u2080 (g)', '100', '100') + field('Nt', 'Remaining quantity N\u209c (g)', '', '25') + field('t', 'Elapsed time t (years)', '11460', '11,460') + field('T', 'Half-life T\u00bd (years)', '5730', '5,730') + '</div>' +
  '<p class="note ns-msg" id="hl-err" role="status"></p>' +
  '<div class="ns-grid hl4"><div class="ns-f"><label for="hl-target" class="ns-l">Find</label><select id="hl-target" class="ns-sel">' + tgtOpts + '</select></div>' +
  '<div class="ns-f"><label for="hl-tu" class="ns-l">Time unit (for t and T\u00bd)</label><select id="hl-tu" class="ns-sel">' + unitOpts + '</select></div>' +
  '<div class="ns-f"><label for="hl-qu" class="ns-l">Quantity unit (label only)</label><input id="hl-qu" class="ns-in" type="text" list="hl-ul" maxlength="16" autocomplete="off" spellcheck="false" value="g" placeholder="g, mg, Bq, atoms"><datalist id="hl-ul">' + qunits + '</datalist></div>' +
  '<div class="ns-f"><label for="hl-sig" class="ns-l">Show results to</label><select id="hl-sig" class="ns-sel">' + sigOpts + '</select></div></div>' +
  '<div class="ns-act"><button type="button" class="btn2" data-act="clear">Clear numbers</button><button type="button" class="btn2" data-act="reset">Reset</button><button type="button" class="btn2" data-act="save">Save to history</button></div>' +
  '<div class="ns-try"><span class="ns-l">Try</span> ' + chips + '</div>' +
  '<div class="ns-grid hl3"><div class="ns-f"><label for="hl-preset" class="ns-l">Isotope half-life preset</label><select id="hl-preset" class="ns-sel" aria-describedby="hl-pnote">' + presetOpts + '</select></div></div>' +
  '<p class="note" id="hl-pnote" role="status" aria-live="polite">A preset fills only the half-life and its time unit. Your amounts and the elapsed time number are kept, so check that the elapsed time is in the preset\u2019s unit. Sources are listed under Isotope half-lives below.</p>' +
  '<div id="hl-out" aria-live="polite"></div>' +
  '<div id="hl-dl" class="ns-act" hidden><span class="ns-l hl-dll">Copy and save</span><button type="button" class="btn2" data-act="copyall">Copy with working</button><button type="button" class="btn2" data-dl="txt">TXT</button><button type="button" class="btn2" data-dl="csv">CSV</button><button type="button" class="btn2" data-dl="json">JSON</button><button type="button" class="btn2" data-act="print">Print</button></div>' +
  '<p class="sr-only" id="hl-note" role="status" aria-live="polite"></p>' +
  '<noscript><p class="note">The calculator needs JavaScript. This tool does not submit calculator inputs to Elecmetric.</p></noscript></section>' +
  '<section class="card"><h2>Working</h2><div id="hl-steps"></div></section>' +
  '<section class="card"><h2>History</h2><ul class="hl-hist" id="hl-hist"></ul><button type="button" class="btn2" id="hl-hclear" data-act="hclear" hidden>Clear history</button><p class="note">Kept only in this browser. Up to 10 calculations.</p></section></div>';
const tbl = (head, rows, num) => '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + head.join(', ') + '"><table><thead><tr>' + head.map((h) => '<th>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows.map((r) => '<tr>' + r.map((c, i) => '<td' + (num && i > 0 ? ' class="n"' : '') + '>' + esc(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';

/* worked examples, all calculated by the engine */
const w1 = run({ N0: '100', t: '11460', T: '5730' }).sol, w2 = run({ N0: '100', Nt: '25', T: '5730' }).sol, w3 = run({ N0: '100', Nt: '25', t: '11460' }).sol, w4 = run({ Nt: '25', t: '11460', T: '5730' }).sol, w5 = run({ N0: '100', t: '30', T: '10' }).sol, w6 = run({ N0: '80', t: '24', T: '6', timeUnit: 'h' }).sol, w7 = run({ N0: '100', Nt: '30', T: '8' }).sol;
const exRows = [
  ['Remaining quantity', '100 g, T\u00bd 5,730 yr, t 11,460 yr', 'N\u209c = ' + F6(w1.Nt) + ' g (' + F6(w1.remFrac * 100) + '% remaining)'],
  ['Elapsed time', '100 g to 25 g, T\u00bd 5,730 yr', 't = ' + F6(w2.t) + ' yr (' + F6(w2.n) + ' half-lives)'],
  ['Half-life', '100 g to 25 g in 11,460 yr', 'T\u00bd = ' + F6(w3.T) + ' yr'],
  ['Initial quantity', '25 g left after 11,460 yr, T\u00bd 5,730 yr', 'N\u2080 = ' + F6(w4.N0) + ' g'],
  ['Remaining quantity', '100 g, T\u00bd 10 yr, t 30 yr', 'N\u209c = ' + F6(w5.Nt) + ' g (three half-lives)'],
  ['Remaining quantity', '80 mg, T\u00bd 6 h, t 24 h', 'N\u209c = ' + F6(w6.Nt) + ' mg (four half-lives)'],
  ['Elapsed time (not a whole number of half-lives)', '100 to 30, T\u00bd 8 d', 't = ' + F6(w7.t) + ' d (' + F6(w7.n) + ' half-lives)']];
const isoRows = ISO.LIST.map((x) => { const l = run({ N0: '100', t: '0', T: String(x.T), timeUnit: x.unit }).sol; return [x.name + ' (' + x.symbol + ')', H.fmt(x.T, 8) + ' ' + H.timeLabel(x.unit, x.T), x.unc === null ? 'not given' : '\u00b1 ' + H.fmt(x.unc, 4) + ' ' + H.timeLabel(x.unit, x.unc), F6(l.lambda) + ' per ' + H.timeLabel(x.unit, 1), F6(l.tau) + ' ' + H.timeLabel(x.unit, l.tau), ISO.SOURCES[x.source].label]; });
const isoSrc = Object.keys(ISO.SOURCES).filter((k) => ISO.LIST.some((x) => x.source === k)).map((k) => '<li><b>' + esc(ISO.SOURCES[k].label) + '.</b> ' + esc(ISO.SOURCES[k].note) + '</li>').join('');
const ladder = [0, 1, 2, 3, 4, 5].map((k) => { const s = run({ N0: '100', t: String(k * 5730), T: '5730' }).sol; return [String(k), F6(s.t) + ' yr', F6(s.Nt) + ' g', F6(s.remFrac * 100) + '%']; });
const lam = run({ N0: '100', t: '10', T: '10' }).sol;
const forms = [
  ['Remaining quantity N\u209c', 'N\u209c = N\u2080 \u00d7 2^(\u2212t / T\u00bd)', 'N\u2080 > 0, T\u00bd > 0, t \u2265 0'],
  ['Initial quantity N\u2080', 'N\u2080 = N\u209c \u00d7 2^(t / T\u00bd)', 'N\u209c > 0, T\u00bd > 0, t \u2265 0'],
  ['Elapsed time t', 't = T\u00bd \u00d7 log\u2082(N\u2080 / N\u209c) = T\u00bd \u00d7 ln(N\u2080 / N\u209c) / ln 2', '0 < N\u209c \u2264 N\u2080, T\u00bd > 0'],
  ['Half-life T\u00bd', 'T\u00bd = t \u00d7 ln 2 / ln(N\u2080 / N\u209c) = t / log\u2082(N\u2080 / N\u209c)', '0 < N\u209c < N\u2080, t > 0'],
  ['Decay constant \u03bb', '\u03bb = ln 2 / T\u00bd', 'T\u00bd > 0'],
  ['Mean lifetime \u03c4', '\u03c4 = 1 / \u03bb = T\u00bd / ln 2', 'T\u00bd > 0']];
const procs = [
  ['Radioactive decay', 'Number of nuclei, or the activity of one radionuclide', 'N\u209c = N\u2080 \u00d7 2^(\u2212t / T\u00bd); T\u00bd is a property of the nuclide', 'This calculator'],
  ['Biological removal', 'Amount of a substance in the body', 'The same law with a biological half-life that depends on the substance and the person', 'This calculator, labelled separately'],
  ['Effective half-life', 'Physical decay and biological removal together', '1 / T\u1d49\u1da0\u1da0 = 1 / T\u209a\u2095\u2099\u209b + 1 / T\u1d47\u1d62\u2092', 'A separate advanced feature, not in this release'],
  ['RC capacitor discharge', 'Capacitor voltage', 'V(t) = V\u2080 e^(\u2212t / RC); half-value time = RC ln 2', 'RC Time Constant and RC and RL Transient calculators'],
  ['RL inductor current decay', 'Inductor current', 'I(t) = I\u2080 e^(\u2212tR / L); half-value time = (L / R) ln 2', 'RC and RL Transient calculator']];
const faq = [
  ['How do I calculate how much is left after a given time?', 'Divide the elapsed time by the half-life to get the number of half-lives n, then halve the starting amount n times: N\u209c = N\u2080 \u00d7 2^(\u2212n). For ' + F6(w1.N0) + ' g with a half-life of 5,730 years after 11,460 years, n = ' + F6(w1.n) + ' and ' + F6(w1.Nt) + ' g remains.'],
  ['Can n be a number that is not whole?', 'Yes. After 1.5 half-lives, ' + F6(run({ N0: '100', t: '15', T: '10' }).sol.Nt) + ' g of 100 g remains. The halving ladder is only the whole-number cases of the same law, and the calculator accepts any elapsed time.'],
  ['How do I find the half-life from two measurements?', 'Use T\u00bd = t \u00d7 ln 2 / ln(N\u2080 / N\u209c). A quantity that fell from 100 to 25 in 11,460 years has N\u2080 / N\u209c = 4, which is two half-lives, so T\u00bd = ' + F6(w3.T) + ' years.'],
  ['Why does the calculator refuse a remaining quantity of zero?', 'Exponential decay never reaches exactly zero in finite time, so there is no elapsed time or half-life to report. Enter a small positive amount, for example one atom or the detection limit, to get a finite answer.'],
  ['Why is a remaining quantity larger than the initial quantity refused?', 'This is ordinary decay, in which the amount can only fall. A larger remaining amount would mean growth or an added source, which this model does not describe.'],
  ['What if the remaining quantity equals the initial quantity?', 'With a non-zero elapsed time no decay was observed, so the half-life is not finite and the page says so. With the half-life known, the elapsed time is 0.'],
  ['What is the decay constant, and how is it related to the half-life?', '\u03bb = ln 2 / T\u00bd is the fraction removed per unit time in the continuous form N\u209c = N\u2080 e^(\u2212\u03bbt). For a 10-year half-life \u03bb = ' + F6(lam.lambda) + ' per year, and the mean lifetime \u03c4 = T\u00bd / ln 2 = ' + F6(lam.tau) + ' years.'],
  ['Which time units can I use?', 'Nanoseconds to billions of years. Elapsed time and half-life share one unit, chosen once, so they cannot be mixed by mistake. Years are Julian years of 365.25 days. Convert the numbers yourself if your half-life is in a different unit from your elapsed time.'],
  ['What quantity units can I use?', 'Any label: grams, becquerels, atoms, percent or your own. The label is shown with the results and nothing is converted. N\u2080 and N\u209c must be in the same unit, because only their ratio matters.'],
  ['Does the uncertainty of a measured half-life carry through?', 'No. The calculator treats every number as exact. A half-life measured as 5,730 \u00b1 40 years gives a range of results, not one, and uncertainty in the measured amounts is a separate matter from uncertainty in the estimated half-life. Use the calculator at the ends of the range to see the spread.'],
  ['Is this a radiation safety or dose calculator?', 'No. It calculates mathematical decay only. A remaining quantity is not a dose, an exposure or a safety assessment, and it ignores daughter products, detector efficiency and shielding. Radiation protection needs a qualified person and the applicable regulations.'],
  ['Where do the isotope half-lives in the preset menu come from, and are they exact?', 'They are published values, listed with their sources and standard uncertainties in the Isotope half-lives section. They are not exact: evaluations differ in the last digits, and a preset fills only the half-life and its time unit. Use the value your own source or procedure requires, and remember that the calculator treats whatever half-life you enter as exact.'],
  ['Is anything sent to a server?', 'No. The calculation runs in your browser, and the history list is stored only in your browser.']];
const body = '<main class="w"><h1>Half-Life Calculator: Remaining Amount, Time, Initial Quantity and Half-Life</h1><p class="lede">Enter any three of initial quantity, remaining quantity, elapsed time and half-life, and the calculator finds the fourth. It also gives the remaining and decayed percentages, the number of half-lives, the decay constant and the mean lifetime, with the working written out in your own numbers. Calculate. Convert. Understand.</p>' + tool +
  '<section id="examples"><h2>Worked examples</h2>' + tbl(['Find', 'Given', 'Result'], exRows) + '<p class="note">Results calculated by this page\u2019s engine and checked against independent high-precision arithmetic (Python decimal, 60 digits).</p></section>' +
  '<section id="isotopes"><h2>Isotope half-lives</h2><p>The preset menu uses the published half-lives below, in the unit each was published in. The decay constant and mean lifetime are calculated here from the half-life. These are values to start a calculation, not a data library: evaluations differ in the last digits, so use the value your own source or procedure requires.</p>' + tbl(['Nuclide', 'Half-life', 'Standard uncertainty', 'Decay constant', 'Mean lifetime', 'Source'], isoRows) + '<p><b>Sources</b></p><ul>' + isoSrc + '</ul><p class="note">Years are Julian years of 365.25 days. A half-life says nothing about dose, exposure or safety: this is mathematical decay only.</p></section>' +
  '<section id="ladder"><h2>Repeated halving</h2><p>Each half-life halves what is left. For 100 g with a half-life of 5,730 years:</p>' + tbl(['Half-lives', 'Elapsed time', 'Remaining', 'Remaining %'], ladder, true) + '</section>' +
  '<section id="formulas"><h2>The formulas</h2><p>One decay law, N\u209c = N\u2080 \u00d7 2^(\u2212t / T\u00bd) = N\u2080 \u00d7 e^(\u2212\u03bbt), solved four ways:</p>' + tbl(['To find', 'Formula', 'Valid when'], forms) + '<p class="note">Elapsed time and half-life use logarithms of the ratio N\u2080 / N\u209c, computed so that very large and very small amounts do not overflow or lose precision.</p></section>' +
  '<section id="processes"><h2>One law, several different processes</h2><p>The mathematics is shared, but the physical meaning is not. A radioactive half-life, a biological half-life and the half-value time of an RC or RL circuit describe different processes and must not be mixed.</p>' + tbl(['Process', 'What decays', 'Law', 'Where'], procs) + '</section>' +
  '<section id="rules"><h2>Rules and limits</h2><ul>' +
  '<li>The initial quantity and the half-life must be greater than zero, and the elapsed time cannot be negative.</li>' +
  '<li>To find elapsed time or half-life, the remaining quantity must be greater than zero and no greater than the initial quantity.</li>' +
  '<li>A remaining quantity of exactly zero is not treated as a finite-time answer.</li>' +
  '<li>Elapsed time and half-life share one time unit; the quantity unit is a label only.</li>' +
  '<li>Results are double-precision. A remaining amount below about 5 \u00d7 10\u207b\u00b3\u00b2\u2074 shows as 0 with a note, and an initial amount above about 1.8 \u00d7 10\u00b3\u2070\u2078 shows as infinite with a note.</li>' +
  '<li>Mathematical decay only: not a radiation-safety, dosimetry or exposure assessment.</li></ul></section>' +
  '<section id="faq"><h2>Questions</h2>' + faq.map((q) => '<h3>' + esc(q[0]) + '</h3><p>' + esc(q[1]) + '</p>').join('') + '</section>' +
  '<section id="related"><h2>Related</h2><p><a class="chip" href="../rc-time-constant/">RC Time Constant</a><a class="chip" href="../rc-rl-transient/">RC and RL Transient</a><a class="chip" href="../../converters/capacitor-discharge-formulas.html">Capacitor discharge formulas</a><a class="chip" href="../logarithm/">Logarithm</a><a class="chip" href="../powers-roots/">Powers and Roots</a><a class="chip" href="../percentage-error-calculator/">Percentage Calculator</a><a class="chip" href="../scientific-calculator/">Scientific Calculator</a><a class="chip" href="../engineering-mathematics/">Engineering Mathematics</a><a class="chip" href="../../converters/index.html">Conversion Centre</a></p></section></main>';
const css = '<style>' + modes.css +
  '#hl .ns-card{padding:16px}#hl .ns-grid{display:grid;gap:12px;margin-bottom:12px}#hl .hl3{grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}#hl .hl4{grid-template-columns:repeat(auto-fit,minmax(185px,1fr))}#hl .ns-l,#hl label.ns-l{display:block;font-weight:600;font-size:13px;margin:0 0 4px}' +
  '#hl .ns-in,#hl .ns-sel{display:block;width:100%;box-sizing:border-box;font:500 18px/1.3 var(--mono);padding:10px 12px;min-height:48px;border-radius:8px;border:1px solid var(--line);background:var(--field);color:var(--ink)}#hl .ns-sel{font:500 15px var(--body)}#hl .ns-in:focus,#hl .ns-sel:focus{outline:2px solid var(--gold);outline-offset:1px}#hl .ns-in.bad{border-color:var(--err)}#hl .ns-in.solved{background:var(--gold-fill);border-color:var(--gold);font-weight:700}#hl .ns-in::placeholder{color:var(--muted);opacity:1}' +
  '#hl .ns-msg{min-height:1.4em;margin:4px 0 8px;color:var(--err)}#hl .ns-msg.hint{color:var(--muted)}#hl .ns-act{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:4px 0 10px}#hl .btn2,#hl .chipb{font:600 13px var(--body);color:var(--ink);background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:8px 12px;min-height:38px;cursor:pointer}#hl .btn2:hover,#hl .chipb:hover{background:var(--field)}#hl .chipb{border-radius:999px;padding:5px 12px;min-height:32px;font-weight:500;margin:3px 4px 3px 0}#hl .btn2:focus-visible,#hl .chipb:focus-visible{outline:2px solid var(--gold);outline-offset:2px}#hl .ns-try{margin:0 0 12px}#hl .hl-dll{margin:0}' +
  '#hl pre.al{font:600 15px/1.6 var(--mono);background:var(--field);border:1px solid var(--line);border-radius:8px;padding:12px 14px;margin:6px 0 12px;overflow-x:auto;color:var(--num);white-space:pre-wrap;overflow-wrap:anywhere}#hl .res .big{font:700 30px/1.3 var(--mono);color:var(--num);word-break:break-all}#hl .res .big .btn2{vertical-align:middle;margin-left:8px;padding:2px 8px;min-height:28px}#hl .res .sub{color:var(--muted);margin:2px 0 8px}' +
  '#hl .ns-t td.r{font:600 15px var(--mono);color:var(--num);text-align:left;word-break:break-all}#hl .ns-t tr.cu td,#hl .ns-t tr.cu th{background:var(--gold-fill)}#hl .ns-t th[scope=row]{text-align:left;text-transform:none;letter-spacing:normal}#hl .ns-facts{margin:12px 0;display:flex;flex-wrap:wrap;gap:6px 18px;font-size:14px}#hl .ns-facts b{font-family:var(--mono)}#hl .note.warn{color:var(--ink);border-left:3px solid var(--gold);padding-left:10px}#hl h3{margin:14px 0 4px}#hl .hl-hist{list-style:none;margin:0 0 8px;padding:0}' +
  'td.n{font-family:var(--mono)}.sr-only{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}code{font-family:var(--mono)}[hidden]{display:none!important}@media(max-width:700px){#hl .res .big{font-size:22px}}@media print{#hl .ns-act,#hl .ns-try,#hl .fmodes{display:none}}</style>';
const client = fs.readFileSync(path.join(__dirname, 'halflife_client.js'), 'utf8');
const engine = fs.readFileSync(path.join(__dirname, 'halflife_engine.js'), 'utf8');
const ld = '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Half-Life Calculator', applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any (web browser)', description: DESC, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }) + '</script>';
let out = shell;
const h0 = out.indexOf('<style>');
out = out.slice(0, h0) + css + out.slice(out.indexOf('</style>', h0) + 8);
out = out.replace(/<title>.*?<\/title>/, '<title>' + esc(TITLE) + '</title>');
['name="description"', 'property="og:title"', 'property="og:description"', 'name="twitter:title"', 'name="twitter:description"'].forEach((k) => { const v = /title/.test(k) ? TITLE : DESC; out = out.replace(new RegExp('(<meta ' + k + ' content=")[^"]*'), '$1' + esc(v)); });
out = out.replace(/<main class="w">[\s\S]*?<\/main>/, () => body);
[...out.matchAll(/<script>[\s\S]*?<\/script>/g)].filter((m) => /Elecmetric Scientific Calculator engine|Elecmetric Basic Calculator: page script/.test(m[0])).forEach((m) => { out = out.replace(m[0], ''); });
out = out.replace('</head>', () => ld + '</head>');
out = out.replace('<script>try{if("serviceWorker"', () => '<script>' + engine + '\n' + client + '</script><script>try{if("serviceWorker"');
const dir = path.join(root, 'calculators/half-life-calculator');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'index.html'), out);
console.log('wrote calculators/half-life-calculator/index.html (' + out.length + ' bytes)');
