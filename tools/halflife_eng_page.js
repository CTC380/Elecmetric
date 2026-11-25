/* Builds calculators/engineering-exponential-decay-calculator/index.html (Elecmetric Half-Life Calculator, Mode 05: engineering exponential decay, RC and RL). Run: node tools/halflife_eng_page.js
   Takes the page shell from the Basic Calculator and the engines and script from tools/halflife_engine.js, tools/halflife_eng_engine.js and tools/halflife_eng_client.js.
   Every example number on the page is calculated by the engine at build time, so the page text can never disagree with the calculator. */
const fs = require('fs'), path = require('path');
const H = require('./halflife_engine.js'), E = require('./halflife_eng_engine.js'), modes = require('./halflife_modes.js');
const root = path.join(__dirname, '..');
const shell = fs.readFileSync(path.join(root, 'calculators/basic-calculator/index.html'), 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const TITLE = 'RC and RL Decay Calculator | Capacitor Discharge, Inductor Current Decay and Time Constant';
const DESC = 'Free engineering exponential decay calculator. RC capacitor discharge V(t) = V0 e^(-t/RC) and RL inductor current decay I(t) = I0 e^(-tR/L): find the voltage or current at a time, or the time to fall to a target. Time constant, half-value time, energy, decay curve and tables. Download CSV, SVG or PNG.';
const F6 = (v) => H.fmt(v, 6), PC = (f) => F6(f * 100) + '%', T = (s) => E.timeText(s, 6);
const D = { circ: 'rc', find: 'value', X0: '', x0u: 'V', R: '', ru: 'ohm', Z: '', zu: 'uF', tau: '', tauu: 's', kind: 'tau', t: '', tun: 's', tg: '', tgm: 'abs', ql: '', sig: '6' };
/* page state (the chip data) to engine input */
const toIn = (d) => ({ circuit: d.circ, find: d.find, X0: d.X0, x0Unit: d.x0u, quantityUnit: d.ql, R: d.R, rUnit: d.ru, C: d.Z, cUnit: d.zu, L: d.Z, lUnit: d.zu, tau: d.tau, tauUnit: d.tauu, tauKind: d.kind, t: d.t, tUnit: d.tun, target: d.tg, targetMode: d.tgm });
const run = (o) => { const r = E.run(toIn(Object.assign({}, D, o))); if (!r.ok) throw new Error('page example failed ' + JSON.stringify(o) + ': ' + r.error); return r; };
const ex = (label, d) => '<button type="button" class="chipb" data-ex="' + esc(JSON.stringify(Object.assign({}, D, d))) + '">' + esc(label) + '</button>';
const EXS = [
  ['RC: 100 V, 10 kΩ, 100 µF, after 1 s', { X0: '100', R: '10', ru: 'kohm', Z: '100', zu: 'uF', t: '1', tun: 's' }],
  ['RC: time to fall from 100 V to 50 V', { find: 'time', X0: '100', R: '10', ru: 'kohm', Z: '100', zu: 'uF', tg: '50', tun: 's' }],
  ['Bleeder: 400 V to 50 V (1 MΩ, 470 µF)', { find: 'time', X0: '400', R: '1', ru: 'Mohm', Z: '470', zu: 'uF', tg: '50', tun: 'min' }],
  ['RC timing: 5 V falls to 10%', { find: 'time', X0: '5', R: '100', ru: 'kohm', Z: '10', zu: 'uF', tg: '10', tgm: 'pct', tun: 's' }],
  ['RL: 2 A, 10 Ω, 100 mH, after 10 ms', { circ: 'rl', X0: '2', x0u: 'A', R: '10', Z: '100', zu: 'mH', t: '10', tun: 'ms' }],
  ['RL: 5 A, 22 Ω, 2 H, time to 10%', { circ: 'rl', find: 'time', X0: '5', x0u: 'A', R: '22', Z: '2', zu: 'H', tg: '10', tgm: 'pct', tun: 'ms' }],
  ['Signal envelope: τ 5 ms, after 20 ms', { circ: 'gen', X0: '1', ql: 'V', tau: '5', tauu: 'ms', t: '20', tun: 'ms' }],
  ['Degradation: half-life 30 days, time to 20%', { circ: 'gen', find: 'time', X0: '100', ql: '%', kind: 'half', tau: '30', tauu: 'd', tg: '20', tgm: 'pct', tun: 'd' }]];
const chips = EXS.map((x) => ex(x[0], x[1])).join('');
const unitOpts = (kind) => E.UNITS[kind].map((u) => '<option value="' + u[0] + '"' + (u[0] === E.DEFAULT_UNIT[kind] ? ' selected' : '') + '>' + esc(u[1]) + '</option>').join('');
const sigOpts = [['4', '4 significant figures'], ['6', '6 significant figures'], ['8', '8 significant figures'], ['10', '10 significant figures'], ['12', '12 significant figures'], ['full', 'Full precision']].map((o) => '<option value="' + o[0] + '"' + (o[0] === '6' ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('');
const field = (k, lab, val, ph) => '<div class="ns-f"><label id="ed-l' + k + '" for="ed-' + k + '" class="ns-l">' + lab + '</label><input id="ed-' + k + '" class="ns-in" type="text" inputmode="decimal" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-describedby="ed-err" value="' + val + '" placeholder="' + ph + '"></div>';
const unitSel = (id, kind, extra) => '<div class="ns-f"' + (extra || '') + '><label for="' + id + '" class="ns-l">Unit</label><select id="' + id + '" class="ns-sel">' + unitOpts(kind) + '</select></div>';
const tool =
  '<div id="ed">' + modes('eng') + '<section class="card ns-card" aria-label="RC and RL decay calculator">' +
  '<div class="ns-grid dt3"><div class="ns-f"><label for="ed-circ" class="ns-l">Circuit or process</label><select id="ed-circ" class="ns-sel"><option value="rc" selected>RC capacitor discharge</option><option value="rl">RL inductor current decay</option><option value="gen">Generic: signal or degradation decay</option></select></div>' +
  '<div class="ns-f"><label for="ed-find" class="ns-l">Find</label><select id="ed-find" class="ns-sel"><option value="value" selected>The value at a given time</option><option value="time">The time to reach a target</option></select></div>' +
  '<div class="ns-f"><label for="ed-sig" class="ns-l">Show results to</label><select id="ed-sig" class="ns-sel">' + sigOpts + '</select></div></div>' +
  '<div class="ns-grid dt3"><div class="dt-pair">' + field('X0', 'Initial voltage V₀', '100', '100') + '<div id="ed-wx0u" class="ns-f"><label for="ed-x0u" class="ns-l">Unit</label><select id="ed-x0u" class="ns-sel">' + unitOpts('V') + '</select></div><div id="ed-wql" class="ns-f" hidden><label for="ed-ql" class="ns-l">Unit (label only)</label><input id="ed-ql" class="ns-in" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="16" value="" placeholder="V, A, %, g"></div></div>' +
  '<div class="dt-pair" id="ed-wR">' + field('R', 'Discharge resistance R', '10', '10') + unitSel('ed-ru', 'R') + '</div>' +
  '<div class="dt-pair" id="ed-wZ">' + field('Z', 'Capacitance C', '100', '100') + unitSel('ed-zu', 'C') + '</div></div>' +
  '<div class="ns-grid dt3" id="ed-wtau" hidden><div class="dt-pair">' + field('tau', 'Time constant τ', '', 'e.g. 5') + unitSel('ed-tauu', 'T') + '</div><div class="ns-f"><label for="ed-kind" class="ns-l">The number is</label><select id="ed-kind" class="ns-sel"><option value="tau" selected>Time constant τ</option><option value="half">Half-life T½</option></select></div></div>' +
  '<div class="ns-grid dt3"><div id="ed-wt">' + field('t', 'Elapsed time t', '1', '1') + '</div>' +
  '<div id="ed-wtg" class="dt-pair" hidden>' + field('tg', 'Target voltage', '', 'e.g. 50') + '<div class="ns-f" id="ed-wtgm"><label for="ed-tgm" class="ns-l">Target as</label><select id="ed-tgm" class="ns-sel"><option value="abs" selected>Value</option><option value="pct">% of initial</option></select></div></div>' +
  '<div class="ns-f"><label id="ed-ltun" for="ed-tun" class="ns-l">Time unit</label><select id="ed-tun" class="ns-sel">' + unitOpts('T') + '</select></div></div>' +
  '<p class="note ns-msg" id="ed-err" role="status"></p>' +
  '<div class="ns-act"><button type="button" class="btn2" data-act="clear">Clear numbers</button><button type="button" class="btn2" data-act="reset">Reset</button><button type="button" class="btn2" data-act="save">Save to history</button></div>' +
  '<div class="ns-try"><span class="ns-l">Try</span> ' + chips + '</div>' +
  '<div id="ed-out" aria-live="polite"></div>' +
  '<div id="ed-gwrap" hidden><h2>Decay curve</h2><div id="ed-graph" class="dt-g"></div>' +
  '<div class="ns-f"><label for="ed-probe" class="ns-l">Move along the curve (or touch or hover the graph)</label><input id="ed-probe" type="range" min="0" max="1000" step="1" value="200"></div><div id="ed-rd" aria-live="polite"></div></div>' +
  '<div id="ed-dl" class="ns-act" hidden><span class="ns-l dt-dll">Copy and save</span><button type="button" class="btn2" data-act="copyall">Copy with working</button><button type="button" class="btn2" data-dl="csv">CSV</button><button type="button" class="btn2" data-dl="txt">TXT</button><button type="button" class="btn2" data-dl="json">JSON</button><button type="button" class="btn2" data-dl="svg">Graph as SVG</button><button type="button" class="btn2" data-dl="png">Graph as PNG</button><button type="button" class="btn2" data-act="print">Print</button></div>' +
  '<p class="sr-only" id="ed-note" role="status" aria-live="polite"></p>' +
  '<noscript><p class="note">The calculator needs JavaScript. This tool does not submit calculator inputs to Elecmetric.</p></noscript></section>' +
  '<section class="card"><h2>Working</h2><div id="ed-steps"></div></section>' +
  '<section class="card"><h2>History</h2><ul class="dt-hist" id="ed-hist"></ul><button type="button" class="btn2" id="ed-hclear" data-act="hclear" hidden>Clear history</button><p class="note">Kept only in this browser. Up to 10 calculations.</p></section></div>';
const tbl = (head, rows, num) => '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: ' + head.join(', ') + '"><table><thead><tr>' + head.map((h) => '<th>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows.map((r) => '<tr>' + r.map((c, i) => '<td' + (num && i > 0 ? ' class="n"' : '') + '>' + esc(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';

/* worked examples, all calculated by the engine */
const a = run(EXS[0][1]), b = run(EXS[1][1]), c = run(EXS[2][1]), d = run(EXS[3][1]), e = run(EXS[4][1]), g = run(EXS[5][1]), h = run(EXS[6][1]), k = run(EXS[7][1]);
const exRows = [
  ['RC: 100 V, 10 kΩ, 100 µF', 'τ = ' + T(a.tauS) + ', after 1 s', F6(a.xt) + ' V (' + PC(a.frac) + ' left)'],
  ['RC: same circuit, target 50 V', 'half-value time t½ = τ ln 2', T(b.tS)],
  ['Bleeder: 400 V, 1 MΩ, 470 µF', 'time to fall to 50 V (n = ' + F6(c.n) + ')', T(c.tS)],
  ['RC: 5 V, 100 kΩ, 10 µF', 'time to 10% of 5 V', T(d.tS)],
  ['RL: 2 A, 10 Ω, 100 mH', 'τ = ' + T(e.tauS) + ', after 10 ms', F6(e.xt) + ' A (' + PC(e.frac) + ' left)'],
  ['RL: 5 A, 22 Ω, 2 H', 'τ = ' + T(g.tauS) + ', time to 10%', T(g.tS)],
  ['Signal: τ 5 ms', 'after 20 ms (n = ' + F6(h.n) + ')', PC(h.frac) + ' left'],
  ['Degradation: half-life 30 days', 'time to 20% left', F6(k.timeIn) + ' days']];
const lad = [1, 2, 3, 4, 5].map((m) => [m + ' τ', PC(Math.exp(-m)), PC(-Math.expm1(-m)), F6(100 * Math.exp(-m)) + ' V']);
const forms = [
  ['RC time constant', 'τ = R C', 'R in ohm, C in farad, τ in seconds'],
  ['RC voltage', 'V(t) = V₀ e^(−t / RC)', 'discharge to zero through R'],
  ['RC half-value time', 't½ = R C ln 2', 'about 0.693 τ'],
  ['RL time constant', 'τ = L / R', 'L in henry, R in ohm'],
  ['RL current', 'I(t) = I₀ e^(−t R / L)', 'source removed, loop closed through R'],
  ['RL half-value time', 't½ = (L / R) ln 2', 'about 0.693 τ'],
  ['Time to a target', 't = τ ln(x₀ / x(t))', '0 < x(t) ≤ x₀'],
  ['Decay rate', 'λ = 1 / τ = ln 2 / t½', 'the same λ as in Mode 02'],
  ['Energy in C or L', '½ C V² or ½ L I²', 'falls as e^(−2t / τ), twice as fast as V or I']];
const cmp = [
  ['Radioactive decay', 'Nₜ = N₀ 2^(−t / T½)', 'T½ is a property of the nuclide', 'Cannot be changed by the user'],
  ['RC capacitor discharge', 'V(t) = V₀ e^(−t / RC)', 't½ = R C ln 2', 'Set by the resistor and capacitor you choose'],
  ['RL current decay', 'I(t) = I₀ e^(−t R / L)', 't½ = (L / R) ln 2', 'Set by the coil and the loop resistance'],
  ['Signal or degradation', 'x(t) = x₀ e^(−t / τ)', 'τ measured or assumed', 'A model of your system, not a law of nature']];
const apps = [['Capacitor discharge', 'Voltage decay'], ['Inductor discharge', 'Current decay'], ['RC time constant', 'Circuit transient response'], ['RL time constant', 'Inductive transient response'], ['Exponential degradation', 'Remaining quantity analysis'], ['Signal decay', 'Exponential attenuation models']];
const faq = [
  ['What does this calculator do?', 'It evaluates one exponential law for three cases. For an RC circuit it gives V(t) = V₀ e^(−t/RC); for an RL circuit I(t) = I₀ e^(−tR/L); for any other process you give τ or a half-life. You can find the value at a time, or the time to reach a target.'],
  ['How do I discharge-time a capacitor, for example 100 V down to 50 V?', 'Choose RC, enter 100 V, 10 kΩ and 100 µF, choose “The time to reach a target” and enter 50 V. The time constant is ' + T(a.tauS) + ' and the time is τ ln 2 = ' + T(b.tS) + '.'],
  ['What is the value after one time constant?', 'About 36.8% of the initial value is left: 100 V falls to ' + F6(a.xt) + ' V after one τ. After five time constants ' + PC(Math.exp(-5)) + ' is still left, so a circuit is never exactly discharged in finite time.'],
  ['What is the difference between the time constant and the half-value time?', 'The time constant τ is the time to fall to 1/e (36.8%). The half-value time t½ = τ ln 2 ≈ 0.693 τ is the time to fall to 50%. They describe the same curve. In the 10 kΩ, 100 µF circuit τ is ' + T(a.tauS) + ' and t½ is ' + T(a.tHalfS) + '.'],
  ['Is this the same as radioactive half-life?', 'The equation is the same, with λ = 1 / τ, but the process is different. A nuclide’s half-life is a fixed property of the nuclide. The half-value time of a circuit depends on the components you chose, and changes when you change R, C or L.'],
  ['Which resistance do I enter for an RL circuit?', 'The total resistance of the loop the current flows round while it decays: the discharge resistor plus the coil’s own winding resistance plus any diode or switch drop you want to include as a resistance. For a coil of ' + F6(2) + ' H in a 22 Ω loop the time constant is ' + T(g.tauS) + '.'],
  ['What about opening a switch in series with an inductor?', 'That is not covered. If there is no path for the current, the voltage rises until something breaks down (an arc, a diode, a transient suppressor). This calculator assumes the current decays through a resistive path, such as a freewheel diode and resistor or a discharge resistor.'],
  ['Does it include leakage, ESR or dielectric absorption?', 'No. It is the ideal first-order model: a capacitor with no leakage or series resistance beyond the R you enter, and an ideal inductor. A real capacitor can recover some voltage after being shorted (dielectric absorption), and an electrolytic capacitor has leakage that shortens the decay.'],
  ['Can I use it to decide a capacitor is safe to touch?', 'No. It is a calculation, not a safety assessment. Use the calculated time as a planning figure only, then measure the voltage with a meter rated for it and discharge with a proper tool. Stored energy in a high-voltage capacitor can be dangerous at voltages that the formula says are “low”.'],
  ['What is the generic mode for?', 'For a signal envelope, an exponential attenuation model or the degradation of any quantity. Enter the initial value, and either a time constant or a half-life. Only the numbers are used: the unit is a label.'],
  ['How is the time to a target calculated?', 't = τ ln(x₀ / x). For a target of 10% that is τ ln 10 = 2.3026 τ. A target of exactly zero is refused, because it is only reached at infinite time; use a small positive target such as 1% instead.'],
  ['What can I download?', 'The time-constant ladder and the fall-to-a-level table as CSV, TXT or JSON, and the graph as SVG or PNG. The saved graph has a white background and fixed colours so it can go into a report or a slide.'],
  ['Is anything sent to a server?', 'No. The calculation and the graph are made in your browser, and the history list is stored only in your browser.']];
const body = '<main class="w"><h1>RC and RL Decay Calculator: Capacitor Discharge and Inductor Current Decay</h1><p class="lede">Mode 05 of the Half-Life Calculator: exponential decay in electrical engineering. Enter an RC or RL circuit (or a time constant of your own) and find the voltage or current at a time, or the time to fall to a target. The calculator gives the time constant, the half-value time, the energy, a decay curve and the working in your own numbers. Calculate. Convert. Understand.</p>' + tool +
  '<section id="examples"><h2>Worked examples</h2>' + tbl(['Case', 'Condition', 'Result'], exRows) + '<p class="note">Results calculated by this page’s engine and checked against independent high-precision arithmetic (Python decimal).</p></section>' +
  '<section id="formulas"><h2>The formulas</h2><p>The same decay law as the other modes, written with the time constant τ:</p>' + tbl(['To find', 'Formula', 'Notes'], forms) + '</section>' +
  '<section id="ladder"><h2>The time-constant ladder</h2><p>The fraction left depends only on how many time constants have passed. For a start of 100 V:</p>' + tbl(['Time', 'Remaining', 'Decayed', 'Voltage left'], lad, true) + '<p class="note">After one time constant 36.8% is left; after five, ' + PC(Math.exp(-5)) + '. “Five time constants” is a working rule for “practically discharged”, not zero.</p></section>' +
  '<section id="applications"><h2>Where the same mathematics appears</h2>' + tbl(['Application', 'Use'], apps) + '</section>' +
  '<section id="distinction"><h2>Radioactive half-life and RC / RL half-value time are not the same process</h2><p>They share one equation and the relations λ = 1 / τ and t½ = τ ln 2. They are different physics, and they should not be mixed up.</p>' + tbl(['Process', 'Law', 'Half-life or half-value time', 'Who sets it'], cmp) + '</section>' +
  '<section id="rules"><h2>Rules and limits</h2><ul>' +
  '<li>Initial voltage, current, value, resistance, capacitance, inductance, time constant and half-life must be greater than zero. Time may be zero but not negative.</li>' +
  '<li>A target must be greater than zero and not more than the initial value (or 100%). A target of exactly zero is refused: it has no finite time.</li>' +
  '<li>The model is a first-order circuit discharging to zero: no leakage, ESR, dielectric absorption, coil capacitance, saturation or switching arc. For a source-driven transient or a series RLC circuit use the RC and RL Transient and RLC Transient pages.</li>' +
  '<li>Units are converted to SI exactly (prefixes by powers of ten). The voltage, current or value is shown in the unit you entered.</li>' +
  '<li>Results are double-precision. A remaining fraction below about 5 × 10⁻³²⁴ shows as 0% with a note that it is not exactly zero.</li>' +
  '<li>Mathematical results only: not a safety assessment, and not a radiation-safety, dosimetry or exposure assessment.</li></ul></section>' +
  '<section id="faq"><h2>Questions</h2>' + faq.map((q) => '<h3>' + esc(q[0]) + '</h3><p>' + esc(q[1]) + '</p>').join('') + '</section>' +
  '<section id="related"><h2>Related</h2><p><a class="chip" href="../half-life-calculator/">Half-Life Calculator (Mode 01)</a><a class="chip" href="../decay-constant-calculator/">Decay Constant Calculator (Mode 02)</a><a class="chip" href="../decay-percentage-calculator/">Decay Percentage Calculator (Mode 03)</a><a class="chip" href="../decay-table-calculator/">Decay Table and Graph (Mode 04)</a><a class="chip" href="../rc-time-constant/">RC Time Constant</a><a class="chip" href="../rc-rl-transient/">RC and RL Transient</a><a class="chip" href="../rlc-transient/">RLC Transient</a><a class="chip" href="../rc-filter-cutoff/">RC Filter Cutoff</a><a class="chip" href="../logarithm/">Logarithm</a><a class="chip" href="../powers-roots/">Powers and Roots</a><a class="chip" href="../engineering-mathematics/">Engineering Mathematics</a><a class="chip" href="../../converters/index.html">Conversion Centre</a></p></section></main>';
const css = '<style>' + modes.css +
  '#ed .ns-card{padding:16px}#ed .ns-grid{display:grid;gap:12px;margin-bottom:12px}#ed .dt3{grid-template-columns:repeat(auto-fit,minmax(230px,1fr))}#ed .dt4{grid-template-columns:repeat(auto-fit,minmax(185px,1fr))}#ed .dt-pair{display:grid;grid-template-columns:minmax(0,1fr) minmax(110px,150px);gap:8px;align-items:end}#ed .ns-l,#ed label.ns-l{display:block;font-weight:600;font-size:13px;margin:0 0 4px}' +
  '#ed .ns-in,#ed .ns-sel{display:block;width:100%;box-sizing:border-box;font:500 18px/1.3 var(--mono);padding:10px 12px;min-height:48px;border-radius:8px;border:1px solid var(--line);background:var(--field);color:var(--ink)}#ed .ns-sel{font:500 15px var(--body)}#ed .ns-in:focus,#ed .ns-sel:focus{outline:2px solid var(--gold);outline-offset:1px}#ed .ns-in.bad{border-color:var(--err)}#ed .ns-in.solved{background:var(--gold-fill);border-color:var(--gold);font-weight:700}#ed .ns-in::placeholder{color:var(--muted);opacity:1}' +
  '#ed .ns-msg{min-height:1.4em;margin:4px 0 8px;color:var(--err)}#ed .ns-msg.hint{color:var(--muted)}#ed .ns-act{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:4px 0 10px}#ed .btn2,#ed .chipb{font:600 13px var(--body);color:var(--ink);background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:8px 12px;min-height:38px;cursor:pointer}#ed .btn2:hover,#ed .chipb:hover{background:var(--field)}#ed .chipb{border-radius:999px;padding:5px 12px;min-height:32px;font-weight:500;margin:3px 4px 3px 0}#ed .btn2:focus-visible,#ed .chipb:focus-visible{outline:2px solid var(--gold);outline-offset:2px}#ed .ns-try{margin:0 0 12px}#ed .dt-dll{margin:0}' +
  '#ed pre.al{font:600 15px/1.6 var(--mono);background:var(--field);border:1px solid var(--line);border-radius:8px;padding:12px 14px;margin:6px 0 12px;overflow-x:auto;color:var(--num);white-space:pre-wrap;overflow-wrap:anywhere}#ed .res .big{font:700 26px/1.4 var(--mono);color:var(--num);word-break:break-all}#ed .res .big .sym{color:var(--muted);font-weight:600}#ed .res .big.src{background:var(--gold-fill);border-radius:6px;padding:0 6px}#ed .res .big .btn2{vertical-align:middle;margin-left:8px;padding:2px 8px;min-height:28px}#ed .res .sub{color:var(--muted);margin:2px 0 8px}' +
  '#ed .ns-t td.r{font:600 15px var(--mono);color:var(--num);text-align:left;word-break:break-all}#ed .ns-t tr.cu td,#ed .ns-t tr.cu th{background:var(--gold-fill)}#ed .ns-t th[scope=row]{text-align:left;text-transform:none;letter-spacing:normal}#ed .ns-facts{margin:12px 0;display:flex;flex-wrap:wrap;gap:6px 18px;font-size:14px}#ed .ns-facts b{font-family:var(--mono)}#ed .note.warn{color:var(--ink);border-left:3px solid var(--gold);padding-left:10px}#ed h3{margin:14px 0 4px}#ed .dt-hist{list-style:none;margin:0 0 8px;padding:0}' +
  '#ed .dt-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin:8px 0 10px}#ed .dt-c{border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:var(--surface)}#ed .dt-c .big{font:700 26px/1.4 var(--mono);color:var(--num);word-break:break-all}#ed .dt-c .big .btn2{vertical-align:middle;margin-left:8px;padding:2px 8px;min-height:28px}#ed .dt-c .sub{color:var(--muted);font-size:14px}#ed .dt-bar{display:flex;height:22px;border-radius:6px;overflow:hidden;border:1px solid var(--line);background:var(--field)}#ed .dt-bar .rem{background:var(--gold);display:block}#ed .dt-bar .dec{flex:1;background:repeating-linear-gradient(45deg,var(--field),var(--field) 6px,var(--line) 6px,var(--line) 7px)}#ed .dt-key{display:flex;gap:16px;font-size:13px;margin:4px 0 12px}#ed .dt-key i{display:inline-block;width:12px;height:12px;margin-right:6px;border:1px solid var(--line);vertical-align:-1px}#ed .dt-key .k1{background:var(--gold)}#ed .dt-key .k2{background:var(--field)}#ed .ns-t td.r,#ed .ns-t th[scope=row]{font-variant-numeric:tabular-nums}@media(max-width:700px){#ed .dt-c .big{font-size:20px}}' +
  'td.n{font-family:var(--mono)}.sr-only{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}code{font-family:var(--mono)}[hidden]{display:none!important}@media(max-width:700px){#ed .res .big{font-size:20px}}@media print{#ed .ns-act,#ed .ns-try,#ed .fmodes{display:none}}#ed .dt-g svg{display:block;width:100%;height:auto;border:1px solid var(--line);border-radius:8px;background:#fff;touch-action:pan-y}#ed .dt-rd{margin:8px 0 2px}#ed .dt-rl{list-style:none;margin:0 0 8px;padding:0}#ed .dt-rl li{margin:2px 0}#ed .dt-sw{display:inline-block;width:12px;height:12px;border-radius:2px;margin-right:6px;vertical-align:-1px}#ed input[type=range]{width:100%;min-height:32px}#ed .dt-chk{display:flex;align-items:center;gap:8px;font-weight:600;font-size:14px;min-height:44px}#ed .dt-chk input{width:20px;height:20px}#ed .ns-t thead th{text-align:center}#ed .tw{max-height:520px;overflow:auto}#ed .ed-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin:8px 0 10px}#ed .ed-c{border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:var(--surface)}#ed .ed-c .big{font:700 24px/1.4 var(--mono);color:var(--num);word-break:break-all}#ed .ed-c .sub{color:var(--muted);font-size:14px}#ed .ns-t th[scope=row]{font-weight:600}@media(max-width:700px){#ed .ed-c .big{font-size:19px}}</style>';
const client = fs.readFileSync(path.join(__dirname, 'halflife_eng_client.js'), 'utf8');
const engine = fs.readFileSync(path.join(__dirname, 'halflife_engine.js'), 'utf8') + '\n' + fs.readFileSync(path.join(__dirname, 'halflife_eng_engine.js'), 'utf8');
const ld = '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebApplication', name: 'RC and RL Decay Calculator', applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any (web browser)', description: DESC, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }) + '</script>';
let out = shell;
const h0 = out.indexOf('<style>');
out = out.slice(0, h0) + css + out.slice(out.indexOf('</style>', h0) + 8);
out = out.replace(/<title>.*?<\/title>/, '<title>' + esc(TITLE) + '</title>');
['name="description"', 'property="og:title"', 'property="og:description"', 'name="twitter:title"', 'name="twitter:description"'].forEach((k2) => { const v = /title/.test(k2) ? TITLE : DESC; out = out.replace(new RegExp('(<meta ' + k2 + ' content=")[^"]*'), '$1' + esc(v)); });
out = out.replace(/<main class="w">[\s\S]*?<\/main>/, () => body);
[...out.matchAll(/<script>[\s\S]*?<\/script>/g)].filter((m) => /Elecmetric Scientific Calculator engine|Elecmetric Basic Calculator: page script/.test(m[0])).forEach((m) => { out = out.replace(m[0], ''); });
out = out.replace('</head>', () => ld + '</head>');
out = out.replace('<script>try{if("serviceWorker"', () => '<script>' + engine + '\n' + client + '</script><script>try{if("serviceWorker"');
const dir = path.join(root, 'calculators/engineering-exponential-decay-calculator');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'index.html'), out);
console.log('wrote calculators/engineering-exponential-decay-calculator/index.html (' + out.length + ' bytes)');
