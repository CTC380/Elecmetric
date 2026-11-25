/* Elecmetric reference pages and worked-example pages (written into converters/ by build_converters.js).
   Reference: resistor colour code, Ohm's law formulas, Kirchhoff's laws, Coulomb's law, electrical symbols.
   Worked examples: watts to amps and amps to watts for common values.
   Every number on these pages is computed here from the formula, never typed in. */
const L = require('./reference_logic.js');
const { RES_T, SMD_T, ES_T, PW_T, COULOMB_UNITS } = L;

const SUP = { '-': '\u207b', 0: '\u2070', 1: '\u00b9', 2: '\u00b2', 3: '\u00b3', 4: '\u2074', 5: '\u2075', 6: '\u2076', 7: '\u2077', 8: '\u2078', 9: '\u2079' };
/* 4 significant digits with thousands separators; the same rule everywhere on these pages */
const g4 = (x) => { const t = String(Number(x.toPrecision(4))).split('.'); t[0] = t[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); return t.join('.'); };

/* ---------- electrical symbols: inline SVG, 64 x 40 box, stroke follows the text colour ---------- */
const SYMBOLS = [
  ['Resistor (IEC)', 'resistor-iec', '<path d="M2 20h14M48 20h14"/><rect x="16" y="12" width="32" height="16"/>', 'Opposes current. The rectangle is the IEC form; the zigzag is the common North American form.'],
  ['Resistor (zigzag)', 'resistor-zigzag', '<path d="M2 20h14l4-9 8 18 8-18 8 18 4-9h14"/>', 'The same component drawn the ANSI/IEEE way. Check which form a drawing set uses.'],
  ['Capacitor', 'capacitor', '<path d="M2 20h24M38 20h24M26 8v24M38 8v24"/>', 'Two plates with a gap. Stores energy in an electric field. No polarity.'],
  ['Polarised capacitor', 'capacitor-polarised', '<path d="M2 20h24M38 20h24M26 8v24M38 8q-7 12 0 24M14 10h6M17 7v6"/>', 'Electrolytic type. The straight plate and the plus sign mark the positive side.'],
  ['Inductor', 'inductor', '<path d="M2 24h10a6 6 0 0 1 12 0a6 6 0 0 1 12 0a6 6 0 0 1 12 0h14"/>', 'A coil. Stores energy in a magnetic field.'],
  ['Transformer', 'transformer', '<path d="M2 6h10a4 4 0 0 0 0 8a4 4 0 0 0 0 8a4 4 0 0 0 0 8h-10M62 6h-10a4 4 0 0 1 0 8a4 4 0 0 1 0 8a4 4 0 0 1 0 8h10M29 4v32M35 4v32"/>', 'Two coils sharing a core. The two vertical lines are the iron core.'],
  ['DC cell or battery', 'battery', '<path d="M2 20h26M36 20h26M28 8v24M36 13v14"/>', 'The long plate is positive and the short plate is negative. Several pairs in a row mean a battery.'],
  ['AC source', 'ac-source', '<circle cx="32" cy="20" r="14"/><path d="M2 20h16M46 20h16M23 20q4.5-8 9 0t9 0"/>', 'A circle with a sine wave: an alternating voltage source.'],
  ['Earth (ground)', 'earth', '<path d="M32 4v14M18 18h28M23 24h18M28 30h8"/>', 'A connection to the general mass of earth, used as a reference and for protection.'],
  ['Diode', 'diode', '<path d="M2 20h20M42 20h20M22 8l20 12-20 12zM42 8v24"/>', 'Conducts from the triangle side (anode) to the bar side (cathode) only.'],
  ['LED', 'led', '<path d="M2 20h20M42 20h20M22 8l20 12-20 12zM42 8v24M46 9l7-7M53 2h-4M53 2v4M52 15l7-7M59 8h-4M59 8v4"/>', 'A diode with arrows pointing away: it gives off light.'],
  ['Zener diode', 'zener', '<path d="M2 20h20M42 20h20M22 8l20 12-20 12zM39 11v-3h3v24h3v-3"/>', 'A diode with a bent bar. Used to hold a voltage in reverse breakdown.'],
  ['Switch (SPST)', 'switch', '<path d="M2 24h14M48 24h14M16 24l28-14"/><circle cx="16" cy="24" r="2"/><circle cx="48" cy="24" r="2"/>', 'Single pole, single throw. The lever opens or closes the circuit.'],
  ['Fuse', 'fuse', '<path d="M2 20h12M50 20h12M14 20h36"/><rect x="14" y="14" width="36" height="12"/>', 'A protective element that melts and opens the circuit on overcurrent.'],
  ['Lamp', 'lamp', '<circle cx="32" cy="20" r="12"/><path d="M2 20h18M44 20h18M23.5 11.5l17 17M40.5 11.5l-17 17"/>', 'A circle with a cross: a lamp or indicator light.'],
  ['Motor', 'motor', '<circle cx="32" cy="20" r="14"/><path d="M2 20h16M46 20h16"/><text x="32" y="26" text-anchor="middle" font-size="16" font-family="sans-serif" fill="currentColor" stroke="none">M</text>', 'A circle with the letter M. A G in the circle means a generator.'],
  ['Ammeter', 'ammeter', '<circle cx="32" cy="20" r="14"/><path d="M2 20h16M46 20h16"/><text x="32" y="26" text-anchor="middle" font-size="16" font-family="sans-serif" fill="currentColor" stroke="none">A</text>', 'Measures current. Connected in series with the load.'],
  ['Voltmeter', 'voltmeter', '<circle cx="32" cy="20" r="14"/><path d="M2 20h16M46 20h16"/><text x="32" y="26" text-anchor="middle" font-size="16" font-family="sans-serif" fill="currentColor" stroke="none">V</text>', 'Measures voltage. Connected in parallel across the part being measured.'],
  ['NPN transistor', 'npn', '<circle cx="32" cy="20" r="16"/><path d="M2 20h18M20 9v22M20 16l18-9M20 24l18 9M38 7V1M38 33v6M38 33L31.3 33M38 33L34 27.6"/>', 'A bipolar transistor. Base on the left, collector at the top, emitter (with the arrow) at the bottom.']
];

const QUANTITIES = [
  ['Voltage', 'V', 'volt', 'V'], ['Current', 'I', 'ampere', 'A'], ['Resistance', 'R', 'ohm', '\u03a9'], ['Conductance', 'G', 'siemens', 'S'],
  ['Real power', 'P', 'watt', 'W'], ['Apparent power', 'S', 'volt-ampere', 'VA'], ['Reactive power', 'Q', 'volt-ampere reactive', 'var'],
  ['Energy', 'E or W', 'joule', 'J'], ['Charge', 'Q', 'coulomb', 'C'], ['Capacitance', 'C', 'farad', 'F'], ['Inductance', 'L', 'henry', 'H'],
  ['Impedance', 'Z', 'ohm', '\u03a9'], ['Reactance', 'X', 'ohm', '\u03a9'], ['Frequency', 'f', 'hertz', 'Hz'], ['Period', 'T', 'second', 's'],
  ['Angular frequency', '\u03c9', 'radian per second', 'rad/s'], ['Power factor', 'cos \u03c6 or pf', 'no unit (0 to 1)', '\u2014'], ['Resistivity', '\u03c1', 'ohm metre', '\u03a9\u00b7m'],
  ['Magnetic flux', '\u03a6', 'weber', 'Wb'], ['Magnetic flux density', 'B', 'tesla', 'T'], ['Illuminance', 'E', 'lux', 'lx']
];

/* ---------- Ohm's law ---------- */
const OHM = [
  ['Voltage', ['V = I \u00d7 R', 'V = P / I', 'V = \u221a(P \u00d7 R)'], (I, R, P) => [I * R, P / I, Math.sqrt(P * R)]],
  ['Current', ['I = V / R', 'I = P / V', 'I = \u221a(P / R)'], (I, R, P, V) => [V / R, P / V, Math.sqrt(P / R)]],
  ['Resistance', ['R = V / I', 'R = V\u00b2 / P', 'R = P / I\u00b2'], (I, R, P, V) => [V / I, V * V / P, P / (I * I)]],
  ['Power', ['P = V \u00d7 I', 'P = I\u00b2 \u00d7 R', 'P = V\u00b2 / R'], (I, R, P, V) => [V * I, I * I * R, V * V / R]]
];

function build(ctx) {
  const { esc, FOOT, table, faqHtml, head, ld, styleHead, chip, url, BASE, convNum, page } = ctx;
  const pages = {}, meta = [];
  const finish = (slug, h1, desc, body, faq, tail, kind, extra) => {
    if (desc.length > 160 || desc.length < 50) throw new Error(slug + ': description length ' + desc.length);
    if ((h1 + ' | Elecmetric').length > 60) throw new Error(slug + ': title too long');
    pages[slug + '.html'] = page(slug, h1, desc, body, ld(h1, slug, desc, faq) + styleHead + (extra || ''), tail || '', { url: BASE ? url(slug) : '', prefix: '../' });
    meta.push({ slug, title: h1 + ' | Elecmetric', desc, kind });
  };
  const wrap = (h1, desc, inner, faq, related) => head() + '<main class="w"><h1>' + esc(h1) + '</h1><p class="lede">' + esc(desc) + '</p>' + inner + faqHtml(faq) +
    '<h2>Related</h2><p>' + related.map(([h, t]) => chip(h, t)).join('') + chip('index.html', 'Conversion Centre') + '</p></main>' + FOOT('../');
  const jsonSafe = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
  const fns = (...f) => f.map((x) => x.toString()).join('\n');

  /* ---------------- resistor colour code ---------------- */
  {
    const slug = 'resistor-color-code', h1 = 'Resistor Color Code Calculator for 3 to 6 Bands';
    const desc = 'Calculate resistor values from 3, 4, 5 and 6-band colour codes. Decode tolerance and TCR, turn values into bands and read SMD codes (472, 4R7, EIA-96).';
    const def = L.resDecode(RES_T, RES_T.defaults[4]), enc = L.resEncode(RES_T, '4700', 4, 5);
    const opt = (role, pick) => RES_T.order[role].map((c) => '<option value="' + c + '"' + (c === pick ? ' selected' : '') + '>' + esc(L.resLabel(RES_T, role, c)) + '</option>').join('');
    const roles = L.resRoles(4), allRoles = ['d', 'd', 'd', 'm', 't', 'p'], names = { d: 'digit', m: 'multiplier', t: 'tolerance', p: 'temperature coefficient' };
    const rows = [0, 1, 2, 3, 4, 5].map((i) => {
      const role = roles[i] || allRoles[i], on = i < roles.length;
      return '<div id="rc-r' + (i + 1) + '"' + (on ? '' : ' hidden') + '><label id="rc-l' + (i + 1) + '" for="rc-b' + (i + 1) + '">Band ' + (i + 1) + ': ' + names[role] + '</label><select id="rc-b' + (i + 1) + '">' + opt(role, RES_T.defaults[4][i] || RES_T.order[role][0]) + '</select></div>';
    }).join('');
    const sw = (p, n, cols) => [...Array(n)].map((_, i) => '<span class="sw" id="' + p + (i + 1) + '"' + (cols && cols[i] ? ' style="background:' + RES_T.css[cols[i]] + '"' : ' hidden') + '></span>').join('');
    const faq = [
      ['How do I read a 4 band resistor?', 'The first two bands are digits, the third is the multiplier and the fourth is the tolerance. Yellow, violet, red, gold is 4, 7, \u00d7100 and \u00b15%, which is 4,700 \u03a9 (4.7 k\u03a9) \u00b15%.'],
      ['How do I know which end to start from?', 'Start from the end that the first band is nearest to: IEC 60062 says that, wherever possible, the first band is placed nearer its end of the resistor than the last band is to the other end. The tolerance band is read last; it is made at least 1.5 times as wide as the other bands and is often gold or silver, so it is set slightly apart. If you cannot tell, measure the resistor with a meter.'],
      ['What is the difference between 4, 5 and 6 band resistors?', 'A 5 band resistor has a third digit, so it can show more exact values (precision resistors). A 6 band resistor adds a temperature coefficient band, in ppm per kelvin (IEC 60062:2016: black 250, brown 100, red 50, orange 15, yellow 25, green 20, blue 10, violet 5, grey 1). The 2016 edition no longer makes the sixth band wider, so the tolerance band stays the single wider band. A 3 band resistor has no tolerance band and is \u00b120%.'],
      ['Which colour means what?', 'Black 0, brown 1, red 2, orange 3, yellow 4, green 5, blue 6, violet 7, grey 8, white 9. As a multiplier gold is \u00d70.1, silver is \u00d70.01 and pink is \u00d70.001 (pink was added in IEC 60062:2016 with Amendment 1:2019, so older charts do not show it). As a tolerance gold is \u00b15% and silver is \u00b110%; the precision colours are brown \u00b11%, red \u00b12%, green \u00b10.5%, blue \u00b10.25%, violet \u00b10.1%, and, in the 2016 edition, orange \u00b10.05%, yellow \u00b10.02% and grey \u00b10.01% (older charts give grey as \u00b10.05%, so check the datasheet for an older part).'],
      ['How do I read an SMD resistor code such as 472 or 1002?', 'On a 3-digit code the first two digits are the value and the third is the power of ten, so 472 is 47 \u00d7 10\u00b2 = 4,700 \u03a9 (4.7 k\u03a9) and 103 is 10 k\u03a9. A 4-digit code uses three digits and a power of ten, so 1002 is 100 \u00d7 10\u00b2 = 10 k\u03a9.'],
      ['What does 4R7 mean on a resistor?', 'The R is the decimal point, so 4R7 is 4.7 \u03a9 and R100 is 0.1 \u03a9. K and M work the same way for kilohms and megohms: 4K7 is 4.7 k\u03a9 and 1M2 is 1.2 M\u03a9. L is the milliohm and G the gigaohm (IEC 60062:2016 Table 2): 4L7 is 4.7 m\u03a9, L100 is 0.1 m\u03a9 and 1G0 is 1 G\u03a9. Values with four significant digits use five characters: 59R04 is 59.04 \u03a9 and 5K904 is 5.904 k\u03a9.'],
      ['How do I read an EIA-96 code such as 10B?', 'Two digits from 01 to 96 pick one of the 96 values of the E96 series (code 10 is 124) and the letter is the multiplier (B is \u00d710), so 10B is 1.24 k\u03a9. The code table on this page lists all 96 values and the letters.'],
      ['What is the nearest standard resistor value?', 'Resistors are made in preferred values (IEC 60063 E series), not every number. E12 has 12 values per decade, E24 has 24, E96 has 96. For example 500 \u03a9 is not a standard value: the nearest E24 value is 510 \u03a9 (+2%), and in E12 it is 470 \u03a9 (\u22126%). The finder on this page shows the nearest value and the next value on each side, so you can round up or down on purpose.'],
      ['How do I find the total of resistors in series or parallel?', 'In series the values add: 330 \u03a9 + 180 \u03a9 = 510 \u03a9. In parallel the total is 1 / (1/R1 + 1/R2 + \u2026): two 1 k\u03a9 resistors give 500 \u03a9, and the total is always below the smallest one. Enter the values in the calculator on this page and it also shows the nearest standard value of the series you choose.'],
      ['What power rating does a resistor need?', 'Work out the power it dissipates, P = V\u00b2 / R or I\u00b2 \u00d7 R, then choose a rating well above it. With 10 V across 510 \u03a9 the power is about 196 mW, and keeping to half the rating needs at least 392 mW, so a 1/2 W resistor is the next common size. The colour code does not show the power rating; it comes from the size of the part and the datasheet, and it falls at higher ambient temperatures.'],
      ['How do I choose a resistor for an LED?', 'Subtract the LED forward voltage from the supply and divide by the current you want: (12 V \u2212 2 V) / 20 mA = 500 \u03a9. That is not a standard value, so take the next standard value above (510 \u03a9 in E24), which gives about 19.6 mA and never more than you asked for, then read its colour bands (green, brown, brown, gold) and check the power: 10 V \u00d7 19.6 mA is about 196 mW, so a 1/2 W resistor with margin. The forward voltage changes with current, temperature and LED colour, so take it from the datasheet.'],
      ['How much can tolerance change an LED current or a divider output?', 'More than the resistor tolerance alone suggests. With 12 V \u00b15%, a 2 V LED that can shift by 0.2 V and a 510 \u03a9 \u00b15% resistor, the current is 19.61 mA nominal but can range from 17.18 mA to 22.29 mA in the worst case, and the supply is the largest single source. The tolerance impact cards on this page show the lowest and highest result, each source on its own, and a root-sum-square estimate of the typical spread.'],
      ['Does the SMD code show the tolerance or the power rating?', 'No. The marking gives the resistance only. The tolerance and the power rating come from the datasheet or the size and series of the part.']
    ];
    const colRows = RES_T.order.m.map((c) => [c.charAt(0).toUpperCase() + c.slice(1), RES_T.digit[c] !== undefined ? String(RES_T.digit[c]) : '\u2014', '\u00d7' + convNum(RES_T.mult[c]), RES_T.tol[c] !== undefined ? '\u00b1' + RES_T.tol[c] + '%' : '\u2014', RES_T.ppm[c] !== undefined ? RES_T.ppm[c] + ' ppm/K' : '\u2014']);
    const smdDef = L.smdDecode(SMD_T, '472');
    const smdCard = '<section class="card" aria-label="SMD resistor code decoder"><h2>SMD resistor code decoder</h2>' +
      '<div class="tgrid"><div><label for="smd-in">Code printed on the resistor (472, 1002, 4R7, 4L7, 10B)</label><div class="trow"><input id="smd-in" inputmode="text" autocomplete="off" maxlength="6" value="472"></div></div></div>' +
      '<div class="tres cvr" aria-live="polite"><div class="big"><small>Resistance</small><span id="smd-out">' + esc(smdDef.text) + '</span></div><div class="big"><small>Marking system</small><span id="smd-sys">' + esc(smdDef.system) + '</span></div></div>' +
      '<p class="note" id="smd-how">' + esc(smdDef.how) + '</p><p class="err" id="smd-err" role="status"></p></section>';
    const esDef = L.esFind(ES_T, 'E24', '500'), esBd = L.esBands(ES_T, RES_T, 'E24', esDef.nearest.ohms), esSw = [...Array(5)].map((_, i) => '<span class="sw" id="es-w' + (i + 1) + '"' + (i < esBd.bands.length ? ' style="background:' + RES_T.css[esBd.bands[i]] + '"' : ' hidden') + '></span>').join('');
    const esCard = '<section class="card" aria-label="Standard resistor value finder"><h2>Standard value finder (E6 to E192)</h2>' +
      '<div class="tgrid"><div><label for="es-in">Resistance wanted (ohms; 4.7k and 2.2M also work)</label><div class="trow"><input id="es-in" inputmode="decimal" autocomplete="off" value="500"></div></div>' +
      '<div><label for="es-s">Series</label><select id="es-s">' + Object.keys(ES_T.s).map((k) => '<option value="' + k + '"' + (k === 'E24' ? ' selected' : '') + '>' + k + ' (' + ES_T.s[k].length + ' per decade, \u00b1' + ES_T.tol[k] + '%)</option>').join('') + '</select></div></div>' +
      '<div class="rcs" aria-hidden="true">' + esSw + '</div>' +
      '<div class="tres cvr" aria-live="polite"><div class="big"><small>Nearest standard value</small><span id="es-near">' + esc(esDef.nearest.text) + '</span></div><div class="big"><small>Next value below</small><span id="es-lo">' + esc(esDef.below.text) + '</span></div><div class="big"><small>Next value above</small><span id="es-hi">' + esc(esDef.above.text) + '</span></div><div class="big"><small>Colour bands of the nearest value</small><span id="es-bands">' + esc(esBd.text) + '</span></div></div>' +
      '<p class="note" id="es-how">' + esc(esDef.how + ' ' + esDef.perDecade + ' values per decade, typical tolerance \u00b1' + esDef.tol + '%.') + '</p><p class="err" id="es-err" role="status"></p></section>';
    const spDef = L.rsCombine('330, 180', 'series'), spNear = L.esFind(ES_T, 'E24', spDef.total);
    const spCard = '<section class="card" aria-label="Series and parallel resistors"><h2>Series and parallel resistors</h2>' +
      '<div class="tgrid"><div><label for="sp-in">Resistances (2 to 20, spaced or comma separated: 330 180 or 4.7k, 10k)</label><div class="trow"><input id="sp-in" inputmode="text" autocomplete="off" value="330, 180"></div></div>' +
      '<div><label for="sp-m">Connection</label><select id="sp-m"><option value="series" selected>Series</option><option value="parallel">Parallel</option></select></div>' +
      '<div><label for="sp-s">Find the nearest value in</label><select id="sp-s">' + Object.keys(ES_T.s).map((k) => '<option value="' + k + '"' + (k === 'E24' ? ' selected' : '') + '>' + k + '</option>').join('') + '</select></div></div>' +
      '<div class="tres cvr" aria-live="polite"><div class="big"><small>Total resistance</small><span id="sp-out">' + esc(spDef.text) + '</span></div><div class="big"><small>Nearest standard value</small><span id="sp-near">' + esc(spNear.nearest.text + (spNear.exact ? ' (exact)' : '')) + '</span></div></div>' +
      '<p class="note" id="sp-how">' + esc(spDef.how) + '</p><p class="err" id="sp-err" role="status"></p></section>';
    const pwDef = L.pwCalc(PW_T, '510', 'V', '10', 0.5);
    const pwCard = '<section class="card" aria-label="Resistor power and rating"><h2>Resistor power and rating</h2>' +
      '<div class="tgrid"><div><label for="pw-r">Resistance (ohms; 510 or 4.7k)</label><div class="trow"><input id="pw-r" inputmode="decimal" autocomplete="off" value="510"></div></div>' +
      '<div><label for="pw-m">You know the</label><select id="pw-m"><option value="V" selected>Voltage across it</option><option value="I">Current through it</option></select></div>' +
      '<div><label id="pw-xl" for="pw-x">Voltage across the resistor (volts)</label><div class="trow"><input id="pw-x" inputmode="decimal" autocomplete="off" value="10"></div></div>' +
      '<div><label for="pw-d">Largest share of the rating to use</label><select id="pw-d"><option value="0.5" selected>50% (conservative)</option><option value="0.6">60%</option><option value="0.7">70%</option><option value="1">100% (no margin)</option></select></div></div>' +
      '<div class="tres cvr" aria-live="polite"><div class="big"><small>Current</small><span id="pw-i">' + esc(L.pwFmt(pwDef.amps, 'A')) + '</span></div><div class="big"><small>Voltage</small><span id="pw-v">' + esc(L.pwFmt(pwDef.volts, 'V')) + '</span></div><div class="big"><small>Power dissipated</small><span id="pw-p">' + esc(L.pwFmt(pwDef.watts, 'W')) + '</span></div><div class="big"><small>Next common rating</small><span id="pw-rate">' + esc(pwDef.ratingLabel) + '</span></div></div>' +
      '<p class="note" id="pw-how">' + esc(pwDef.how) + '</p><p class="note">Common ratings are 1/16, 1/10, 1/8, 1/4, 1/2, 1, 2, 3, 5, 10, 25, 50 and 100 W; not every maker offers every size. The rating is set at a stated ambient temperature (often 70 \u00b0C) and falls above it, and pulses and enclosed spaces matter too, so check the datasheet.</p><p class="err" id="pw-err" role="status"></p></section>';
    const ledDef = L.ledCalc(ES_T, PW_T, RES_T, '12', '2', '20', '1', 'E24', 'up', 0.5), ledSw = [...Array(5)].map((_, i) => '<span class="sw" id="led-w' + (i + 1) + '"' + (i < ledDef.bands.bands.length ? ' style="background:' + RES_T.css[ledDef.bands.bands[i]] + '"' : ' hidden') + '></span>').join('');
    const vdDef = L.vdCalc(ES_T, PW_T, RES_T, '12', '5', '10k', '', 'E24', 0.5), vdSw = (pre, b) => [...Array(5)].map((_, i) => '<span class="sw" id="' + pre + (i + 1) + '"' + (b.bands[i] ? ' style="background:' + RES_T.css[b.bands[i]] + '"' : ' hidden') + '></span>').join('');
    const vdCard = '<section class="card" aria-label="Voltage divider"><h2>Voltage divider with standard values</h2>' +
      '<p>Choose R1 and R2 from a standard series for the output you want. The page tries the standard values on each side of the ideal ones and keeps the pair that comes closest, then shows the colour bands, the output with the resistor tolerance, the current and the power in each resistor.</p>' +
      '<div class="tgrid"><div><label for="vd-vin">Input voltage (volts)</label><div class="trow"><input id="vd-vin" inputmode="decimal" autocomplete="off" value="12"></div></div>' +
      '<div><label for="vd-vout">Output voltage wanted (volts)</label><div class="trow"><input id="vd-vout" inputmode="decimal" autocomplete="off" value="5"></div></div>' +
      '<div><label for="vd-rt">Total R1 + R2 wanted (ohms; 10k also works)</label><div class="trow"><input id="vd-rt" inputmode="decimal" autocomplete="off" value="10k"></div></div>' +
      '<div><label for="vd-rl">Load resistance (optional; blank for no load)</label><div class="trow"><input id="vd-rl" inputmode="decimal" autocomplete="off" value=""></div></div>' +
      '<div><label for="vd-s">Standard series</label><select id="vd-s">' + Object.keys(ES_T.s).map((k) => '<option value="' + k + '"' + (k === 'E24' ? ' selected' : '') + '>' + k + '</option>').join('') + '</select></div>' +
      '<div><label for="vd-p">Largest share of the power rating to use</label><select id="vd-p"><option value="0.5" selected>50% (conservative)</option><option value="0.6">60%</option><option value="0.7">70%</option><option value="1">100% (no margin)</option></select></div></div>' +
      '<div class="rcs" aria-hidden="true">' + vdSw('vd-x', vdDef.r1Bands) + '</div><div class="rcs" aria-hidden="true">' + vdSw('vd-y', vdDef.r2Bands) + '</div>' +
      '<div class="tres cvr" aria-live="polite"><div class="big"><small>R1 (top, from the input)</small><span id="vd-r1">' + esc(vdDef.r1Text) + '</span></div><div class="big"><small>R1 colour bands</small><span id="vd-b1">' + esc(vdDef.r1Bands.text) + '</span></div><div class="big"><small>R2 (bottom, to ground)</small><span id="vd-r2">' + esc(vdDef.r2Text) + '</span></div><div class="big"><small>R2 colour bands</small><span id="vd-b2">' + esc(vdDef.r2Bands.text) + '</span></div><div class="big"><small>Output voltage</small><span id="vd-vo">' + esc(L.pwFmt(vdDef.vout, 'V') + ' (' + (vdDef.pct > 0 ? '+' : '') + vdDef.pct + '%)') + '</span></div><div class="big"><small>Output range with the resistor tolerance</small><span id="vd-rng">' + esc(L.pwFmt(vdDef.vMin, 'V') + ' to ' + L.pwFmt(vdDef.vMax, 'V') + ' (\u00b1' + vdDef.tol + '%)') + '</span></div><div class="big"><small>Divider current</small><span id="vd-i">' + esc(L.pwFmt(vdDef.amps, 'A')) + '</span></div><div class="big"><small>Power and next common rating</small><span id="vd-pw">' + esc('R1 ' + L.pwFmt(vdDef.p1, 'W') + ' (' + vdDef.rate1 + '), R2 ' + L.pwFmt(vdDef.p2, 'W') + ' (' + vdDef.rate2 + ')') + '</span></div></div>' +
      '<p class="note" id="vd-how">' + esc(vdDef.how) + '</p><p class="note" id="vd-ohm">' + esc(vdDef.ohm) + '</p><p class="note">Vout = Vin \u00d7 R2 / (R1 + R2); with a load, R2 is taken in parallel with it. Lower resistances hold the output steadier against a load but draw more current from the supply. The tolerance range uses the series tolerance on both resistors at once, in opposite directions, so it is the worst case for the nominal values; a divider also changes with temperature and with any current the load draws that you have not entered. Check the resistor datasheets.</p><p class="note">To check the arithmetic by hand, use the <a href="../pages/ohms-law.html">Ohm\u2019s Law Calculator</a> (V = I \u00d7 R and P = V \u00d7 I) or the <a href="ohms-law-formulas.html">Ohm\u2019s Law formulas</a>.</p><p class="err" id="vd-err" role="status"></p></section>';
    const tlDef = L.tolLed('12', '5', '2', '0.2', '510', '5', '20'), tdDef = L.tolDiv('12', '5', '5.6k', '5', '3.9k', '5', '');
    const tin = (id, lab, val) => '<div><label for="' + id + '">' + lab + '</label><div class="trow"><input id="' + id + '" inputmode="decimal" autocomplete="off" value="' + val + '"></div></div>';
    const big = (id, lab, val) => '<div class="big"><small>' + lab + '</small><span id="' + id + '">' + esc(val) + '</span></div>';
    const tlCard = '<section class="card" aria-label="Tolerance impact on LED current"><h2>Tolerance impact: LED current</h2>' +
      '<p>A resistor of a stated tolerance does not fix the LED current: the supply and the LED voltage move it too. Enter the tolerances to see the lowest and highest current, which source matters most, and the resistor power in the worst case. Blank tolerances count as 0.</p>' +
      '<div class="tgrid">' + tin('tl-vs', 'Supply voltage (volts)', '12') + tin('tl-ts', 'Supply tolerance (%)', '5') + tin('tl-vf', 'LED forward voltage (volts)', '2') + tin('tl-dv', 'Possible change of the LED voltage (\u00b1 volts)', '0.2') + tin('tl-r', 'Resistance (ohms; 510 or 4.7k)', '510') + tin('tl-tr', 'Resistor tolerance (%)', '5') + tin('tl-max', 'LED maximum current (mA, optional)', '20') + '</div>' +
      '<div class="tres cvr" aria-live="polite">' + big('tl-nom', 'Nominal current', L.pwFmt(tlDef.nom, 'A')) + big('tl-rng', 'Worst-case current range', tlDef.rngText) + big('tl-rss', 'Typical spread (root-sum-square)', tlDef.rssText) + big('tl-p1', 'Resistor tolerance alone', tlDef.parts[0].text) + big('tl-p2', 'Supply tolerance alone', tlDef.parts[1].text) + big('tl-p3', 'LED voltage change alone', tlDef.parts[2].text) + big('tl-pw', 'Resistor power', L.pwFmt(tlDef.pNom, 'W') + ' nominal, ' + L.pwFmt(tlDef.pMax, 'W') + ' worst case') + '</div>' +
      '<p class="note" id="tl-how">' + esc(tlDef.how) + '</p><p class="note">The worst case puts every quantity at its limit at once, so it is a bound, not an expectation. The typical spread is the root-sum-square of the three single-source deviations, a common estimate when the errors are independent. The LED voltage also changes with current and temperature, and the resistor with temperature and age: check the datasheets, and measure the finished circuit where it matters.</p><p class="err" id="tl-err" role="status"></p></section>';
    const tdCard = '<section class="card" aria-label="Tolerance impact on divider output"><h2>Tolerance impact: voltage divider output</h2>' +
      '<p>The output of a divider depends on both resistors and on the input. Enter the tolerance of each to see the lowest and highest output and which one matters most.</p>' +
      '<div class="tgrid">' + tin('td-vin', 'Input voltage (volts)', '12') + tin('td-tin', 'Input tolerance (%)', '5') + tin('td-r1', 'R1 (top; 5.6k)', '5.6k') + tin('td-t1', 'R1 tolerance (%)', '5') + tin('td-r2', 'R2 (bottom; 3.9k)', '3.9k') + tin('td-t2', 'R2 tolerance (%)', '5') + tin('td-rl', 'Load resistance (optional)', '') + '</div>' +
      '<div class="tres cvr" aria-live="polite">' + big('td-nom', 'Nominal output', L.pwFmt(tdDef.nom, 'V')) + big('td-rng', 'Worst-case output range', tdDef.rngText) + big('td-rss', 'Typical spread (root-sum-square)', tdDef.rssText) + big('td-p1', 'R1 tolerance alone', tdDef.parts[0].text) + big('td-p2', 'R2 tolerance alone', tdDef.parts[1].text) + big('td-p3', 'Input tolerance alone', tdDef.parts[2].text) + big('td-x', 'Largest single source', tdDef.top.replace(' alone', '')) + '</div>' +
      '<p class="note" id="td-how">' + esc(tdDef.how) + '</p><p class="note">If the input is a regulated reference, set its tolerance low and the divider ratio alone sets the result: two 1% resistors give an output within about 2% of the ratio. The worst case is a bound; the load resistance is taken as exact.</p><p class="err" id="td-err" role="status"></p></section>';
    const rpCard = '<section class="card" aria-label="Calculation report"><h2>Print a calculation report</h2><p>Prints the current LED resistor and voltage divider results, with their inputs, on a page of their own (use the print dialog to save it as a PDF).</p><p><button type="button" id="rp-btn" class="btn">Print the report</button></p><p class="err" id="rp-msg" role="status"></p></section><section class="rp" id="rp"><h2>Elecmetric calculation report</h2><pre id="rp-out"></pre></section>';
    const ledCard = '<section class="card" aria-label="LED series resistor"><h2>LED series resistor, step by step</h2>' +
      '<p>One calculation from the supply to a checked resistor: required value, standard value, colour bands, the current you actually get, the power and the rating.</p>' +
      '<div class="tgrid"><div><label for="led-vs">Supply voltage (volts)</label><div class="trow"><input id="led-vs" inputmode="decimal" autocomplete="off" value="12"></div></div>' +
      '<div><label for="led-vf">LED forward voltage (volts, from its datasheet)</label><div class="trow"><input id="led-vf" inputmode="decimal" autocomplete="off" value="2"></div></div>' +
      '<div><label for="led-i">LED current wanted (milliamperes)</label><div class="trow"><input id="led-i" inputmode="decimal" autocomplete="off" value="20"></div></div>' +
      '<div><label for="led-n">LEDs in series</label><div class="trow"><input id="led-n" inputmode="numeric" autocomplete="off" value="1"></div></div>' +
      '<div><label for="led-s">Standard series</label><select id="led-s">' + Object.keys(ES_T.s).map((k) => '<option value="' + k + '"' + (k === 'E24' ? ' selected' : '') + '>' + k + '</option>').join('') + '</select></div>' +
      '<div><label for="led-d">Choose</label><select id="led-d"><option value="up" selected>Next value above (safer)</option><option value="nearest">Nearest value</option></select></div>' +
      '<div><label for="led-p">Largest share of the power rating to use</label><select id="led-p"><option value="0.5" selected>50% (conservative)</option><option value="0.6">60%</option><option value="0.7">70%</option><option value="1">100% (no margin)</option></select></div></div>' +
      '<div class="rcs" aria-hidden="true">' + ledSw + '</div>' +
      '<div class="tres cvr" aria-live="polite"><div class="big"><small>1. Required resistance</small><span id="led-r">' + esc(ledDef.requiredText) + '</span></div><div class="big"><small>2. Standard value</small><span id="led-std">' + esc(ledDef.stdText) + '</span></div><div class="big"><small>3. Colour bands</small><span id="led-bands">' + esc(ledDef.bands.text) + '</span></div><div class="big"><small>4. Actual LED current</small><span id="led-ia">' + esc(L.pwFmt(ledDef.amps, 'A') + ' (' + (ledDef.pct > 0 ? '+' : '') + ledDef.pct + '%)') + '</span></div><div class="big"><small>5. Resistor power</small><span id="led-pw">' + esc(L.pwFmt(ledDef.watts, 'W')) + '</span></div><div class="big"><small>6. Next common rating</small><span id="led-rate">' + esc(ledDef.rating) + '</span></div><div class="big"><small>Current range with the resistor tolerance</small><span id="led-rng">' + esc(L.pwFmt(ledDef.iMin, 'A') + ' to ' + L.pwFmt(ledDef.iMax, 'A') + ' (\u00b1' + ledDef.tol + '%)') + '</span></div></div>' +
      '<p class="note" id="led-how">' + esc(ledDef.how) + '</p><p class="note" id="led-ohm">' + esc(ledDef.ohm) + '</p><p class="note">This is the resistor only. The forward voltage changes with current, temperature and the individual LED, the supply may not be exactly the stated voltage, and the LED\u2019s own maximum current and the resistor\u2019s datasheet rating are the limits. Check the result against both datasheets.</p><p class="note">To check the arithmetic by hand, use the <a href="../pages/ohms-law.html">Ohm\u2019s Law Calculator</a> (V = I \u00d7 R and P = V \u00d7 I) or the <a href="ohms-law-formulas.html">Ohm\u2019s Law formulas</a>.</p><p class="err" id="led-err" role="status"></p></section>';
    const eiaRows = [...Array(24)].map((_, r) => [0, 1, 2, 3].reduce((a, c) => { const n = c * 24 + r + 1; return a.concat([(n < 10 ? '0' : '') + n, String(SMD_T.e96[n - 1])]); }, []));
    const eiaLetters = Object.keys(SMD_T.letters).map((k) => [k, '\u00d7' + convNum(SMD_T.letters[k])]);
    const smdTables = '<h2>SMD resistor codes</h2><p>Chip resistors are too small for colour bands, so the value is printed as a short code. The marking gives the resistance only, not the tolerance or the power rating.</p>' +
      table(['Marking', 'Example', 'How it reads', 'Value'], [['3 digits', '472', '47 \u00d7 10\u00b2', L.smdDecode(SMD_T, '472').text], ['3 digits', '103', '10 \u00d7 10\u00b3', L.smdDecode(SMD_T, '103').text], ['4 digits', '1002', '100 \u00d7 10\u00b2', L.smdDecode(SMD_T, '1002').text], ['R notation', '4R7', 'R is the decimal point', L.smdDecode(SMD_T, '4R7').text], ['R notation', 'R100', 'R is the decimal point', L.smdDecode(SMD_T, 'R100').text], ['K notation', '4K7', 'K is the decimal point', L.smdDecode(SMD_T, '4K7').text], ['L notation', '4L7', 'L is the decimal point, in milliohm', L.smdDecode(SMD_T, '4L7').text], ['L notation', 'L100', 'L is the decimal point, in milliohm', L.smdDecode(SMD_T, 'L100').text], ['G notation', '1G0', 'G is the decimal point, in gigaohm', L.smdDecode(SMD_T, '1G0').text], ['5 characters', '59R04', 'four significant digits, R is the decimal point', L.smdDecode(SMD_T, '59R04').text], ['EIA-96', '10B', 'code 10 = 124, B = \u00d710', L.smdDecode(SMD_T, '10B').text], ['Zero-ohm link', '000', 'a jumper', L.smdDecode(SMD_T, '000').text]]) +
      '<p class="note">A 3-digit code that ends in 8 or 9 (for \u00d70.01 or \u00d70.1) is a convention of some makers only. A code such as 47R can be read as 47 \u03a9 (R notation) or as an EIA-96 code (3.01 \u03a9); the page shows the R-notation value and says so.</p>' +
      '<h2>EIA-96 code table</h2><p>Each two-digit code is one value of the E96 series (1% tolerance). The value is multiplied by the letter.</p>' +
      table(['Code', 'Value', 'Code', 'Value', 'Code', 'Value', 'Code', 'Value'], eiaRows) +
      '<p><strong>EIA-96 multiplier letters</strong></p>' + table(['Letter', 'Multiplier'], eiaLetters);
    const inner = '<section class="card" aria-label="Resistor colour bands to resistance"><h2>Colour bands to resistance</h2>' +
      '<div class="tgrid"><div><label for="rc-n">Number of bands</label><select id="rc-n"><option value="3">3 bands</option><option value="4" selected>4 bands</option><option value="5">5 bands</option><option value="6">6 bands</option></select></div>' + rows + '</div>' +
      '<div class="rcs" aria-hidden="true">' + sw('rc-s', 6, RES_T.defaults[4]) + '</div>' +
      '<div class="tres cvr" aria-live="polite"><div class="big"><small>Resistance</small><span id="rc-out">' + esc(def.text) + '</span></div><div class="big"><small>Range allowed by the tolerance</small><span id="rc-range">' + esc(def.range) + '</span></div></div>' +
      '<p class="err" id="rc-err" role="status"></p></section>' +
      '<section class="card" aria-label="Resistance to colour bands"><h2>Resistance to colour bands</h2>' +
      '<div class="tgrid"><div><label for="rc-v">Resistance (ohms; 4.7k and 2.2M also work)</label><div class="trow"><input id="rc-v" inputmode="decimal" autocomplete="off" value="4700"></div></div>' +
      '<div><label for="rc-n2">Bands</label><select id="rc-n2"><option value="4" selected>4 bands</option><option value="5">5 bands</option></select></div>' +
      '<div><label for="rc-t">Tolerance</label><select id="rc-t">' + RES_T.order.t.map((c) => '<option value="' + RES_T.tol[c] + '"' + (c === 'gold' ? ' selected' : '') + '>\u00b1' + RES_T.tol[c] + '% (' + c + ')</option>').join('') + '</select></div></div>' +
      '<div class="rcs" aria-hidden="true">' + sw('rc-e', 5, enc.bands) + '</div>' +
      '<div class="tres cvr" aria-live="polite"><div class="big"><small>Colour bands, first to last</small><span id="rc-enc">' + esc(enc.text) + '</span></div></div>' +
      '<p class="err" id="rc-err2" role="status"></p></section>' +
      smdCard +
      esCard +
      spCard +
      pwCard +
      ledCard +
      vdCard +
      tlCard +
      tdCard +
      rpCard +
      '<h2>Colour code table</h2>' + table(['Colour', 'Digit', 'Multiplier', 'Tolerance', 'Temp. coefficient'], colRows) +
      '<p class="note">Tolerance and temperature coefficient colours are not used by every maker. Where a datasheet and this table disagree, the datasheet is right. A resistor with no tolerance band is \u00b120%. The colours and values follow IEC 60062:2016 Table 1. Pink (\u00d70.001) lets four bands show values down to 10 m\u03a9; on a resistor made to an older edition of the standard, a pink band may not be a multiplier, so confirm with the datasheet or a meter.</p>' +
      smdTables +
      '<h2>Worked examples</h2><ol class="steps">' + [['yellow', 'violet', 'red', 'gold'], ['yellow', 'violet', 'pink', 'gold'], ['brown', 'black', 'orange', 'red'], ['red', 'red', 'black', 'black', 'brown'], ['green', 'blue', 'black', 'red', 'brown', 'red']].map((b) => '<li>' + esc(b.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(', ') + ' = ' + L.resDecode(RES_T, b).text) + '</li>').join('') + '</ol>' +
      '<h2>Preferred values: the E series</h2><p>Resistors are made in preferred values (IEC 60063) rather than every number. Each series has a fixed number of values per decade: E6 (about \u00b120%), E12 (\u00b110%), E24 (\u00b15%), E48 (\u00b12%), E96 (\u00b11%) and E192 (\u00b10.5% and tighter). Multiply each value by 1, 10, 100 and so on. The tolerances are the ones usually sold with each series; E24 values are also made in 1% parts, so check the datasheet.</p>' +
      Object.keys(ES_T.s).map((k) => '<p><strong>' + k + ':</strong> ' + ES_T.s[k].map((x) => String(k === 'E6' || k === 'E12' || k === 'E24' ? x / 10 : x)).join(', ') + '</p>').join('') +
      '<p class="note">Values are shown as digits, so 47 stands for 4.7, 47, 470 and so on, and 475 stands for 4.75, 47.5 and so on. E48, E96 and E192 are the roundings of 10<sup>k/N</sup> to three digits, and E48 is every second E96 value. E6, E12 and E24 are the published tables, which differ slightly from plain rounding (E24 has 2.7, 3.0 and 3.3, not 2.6, 2.9 and 3.2).</p>'
      '<h2>Using the code</h2><p>Reading a resistor from its bands is a check, not a measurement. Colours fade, and brown, red and orange are easy to confuse under poor light. Where it matters, measure the resistance with the resistor out of the circuit.</p>';
    const tail = '<script>' + fns(L.resRoles, L.resFmt, L.resLabel, L.resDecode, L.resEncode, L.resInit, L.smdDecode, L.smdInit, L.esFind, L.esBands, L.esInit, L.rsNum, L.rsCombine, L.pwFmt, L.pwCalc, L.spInit, L.pwInit, L.ledCalc, L.ledInit, L.vdOut, L.vdCalc, L.vdInit, L.tlPc, L.tlSgn, L.tlParts, L.tolLed, L.tolDiv, L.tolInit, 'var ' + 'RP_SECTIONS = ' + JSON.stringify(L.RP_SECTIONS) + ';', L.rpText, L.rpInit) + '\nresInit(' + jsonSafe(RES_T) + ', document);\nsmdInit(' + jsonSafe(SMD_T) + ', document);\nesInit(' + jsonSafe(ES_T) + ', ' + jsonSafe(RES_T) + ', document);\nspInit(' + jsonSafe(ES_T) + ', document);\npwInit(' + jsonSafe(PW_T) + ', document);\nledInit(' + jsonSafe(ES_T) + ', ' + jsonSafe(PW_T) + ', ' + jsonSafe(RES_T) + ', document);\nvdInit(' + jsonSafe(ES_T) + ', ' + jsonSafe(PW_T) + ', ' + jsonSafe(RES_T) + ', document);\ntolInit(document);\nrpInit(document, window);</script>';
    const css = '<style>.rcs{display:flex;gap:6px;margin:12px 0}.sw{display:inline-block;width:28px;height:44px;border:1px solid var(--line);border-radius:4px}.sw[hidden]{display:none}.rp{display:none}.rp pre{white-space:pre-wrap;font:14px/1.5 var(--body)}@media print{body.rp-on>*:not(main){display:none!important}body.rp-on main>*:not(.rp){display:none!important}body.rp-on .rp{display:block}}</style>';
    finish(slug, h1, desc, wrap(h1, desc, inner, faq, [['ohms-law-formulas.html', 'Ohm\u2019s Law Formulas'], ['../pages/ohms-law.html', 'Ohm\u2019s Law Calculator'], ['../pages/voltage-divider.html', 'Voltage Divider Calculator'], ['../calculators/led-resistor/', 'LED Series Resistor Calculator'], ['../calculators/resistance-series/', 'Resistors in Series'], ['../calculators/resistance-parallel/', 'Resistors in Parallel'], ['resistor-formulas.html', 'Resistor Formulas'], ['electrical-symbols.html', 'Electrical Symbols'], ['../calculators/electrical-fundamentals/', 'Fundamentals calculators']]), faq, tail, 'reference', css);
  }

  /* ---------------- Ohm's law formulas ---------------- */
  {
    const slug = 'ohms-law-formulas', h1 = 'Ohm\u2019s Law Formulas and Power Wheel';
    const desc = 'Ohm\u2019s law formulas for voltage, current, resistance and power: all twelve forms in one table, worked examples, and values at 12 V.';
    const I = 3, R = 4, V = I * R, P = V * I, ex2 = { P: 60, V: 230 };
    const faq = [
      ['What is Ohm\u2019s law?', 'The current through a resistor is proportional to the voltage across it: V = I \u00d7 R. With volts, amperes and ohms, 12 V across 4 \u03a9 drives 3 A.'],
      ['How do I find power from voltage and resistance?', 'P = V\u00b2 / R. For 12 V across 4 \u03a9 that is 144 / 4 = 36 W. The same power is V \u00d7 I = 12 \u00d7 3 and I\u00b2 \u00d7 R = 9 \u00d7 4.'],
      ['Does Ohm\u2019s law work for AC?', 'For a purely resistive load, yes, with RMS values. For loads with inductance or capacitance, resistance becomes impedance Z and the power also depends on the power factor.'],
      ['Which materials do not follow Ohm\u2019s law?', 'Diodes, LEDs, lamp filaments (whose resistance rises as they heat) and other non-linear parts. Their current is not proportional to voltage.']
    ];
    const fRows = OHM.map(([q, forms]) => [q].concat(forms));
    const vals = [1, 10, 100, 1000, 10000].map((r) => [convNum(r) + ' \u03a9', convNum(12 / r) + ' A', convNum(144 / r) + ' W']);
    const e2R = ex2.V * ex2.V / ex2.P, e2I = ex2.P / ex2.V;
    const inner = '<h2>The twelve formulas</h2>' + table(['To find', 'Formula 1', 'Formula 2', 'Formula 3'], fRows) +
      '<p class="note">Read across: each row gives the quantity three ways. V is voltage in volts, I current in amperes, R resistance in ohms and P power in watts.</p>' +
      '<h2>Worked example: 12 V across 4 \u03a9</h2><ol class="steps"><li>' + esc('I = V / R = ' + V + ' / ' + R + ' = ' + I + ' A') + '</li><li>' + esc('P = V \u00d7 I = ' + V + ' \u00d7 ' + I + ' = ' + P + ' W') + '</li><li>' + esc('Check: I\u00b2 \u00d7 R = ' + I * I + ' \u00d7 ' + R + ' = ' + I * I * R + ' W, and V\u00b2 / R = ' + V * V + ' / ' + R + ' = ' + V * V / R + ' W') + '</li></ol>' +
      '<h2>Worked example: a 60 W lamp on 230 V</h2><ol class="steps"><li>' + esc('I = P / V = 60 / 230 = ' + g4(e2I) + ' A') + '</li><li>' + esc('R = V\u00b2 / P = 52,900 / 60 = ' + g4(e2R) + ' \u03a9 (hot)') + '</li></ol>' +
      '<p class="note">A filament lamp measures much less when cold, because its resistance rises with temperature.</p>' +
      '<h2>Current and power at 12 V</h2>' + table(['Resistance', 'Current', 'Power'], vals) +
      '<h2>Series and parallel</h2><p>In series the same current flows through every resistor and the resistances add. In parallel every resistor has the same voltage and the conductances (1/R) add. Both follow from Kirchhoff\u2019s laws.</p>';
    finish(slug, h1, desc, wrap(h1, desc, inner, faq, [['kirchhoffs-laws.html', 'Kirchhoff\u2019s Laws'], ['resistor-color-code.html', 'Resistor Color Code'], ['../pages/ohms-law.html', 'Ohm\u2019s Law Calculator'], ['../pages/voltage-divider.html', 'Voltage Divider Calculator']]), faq, '', 'reference');
  }

  /* ---------------- Kirchhoff's laws ---------------- */
  {
    const slug = 'kirchhoffs-laws', h1 = 'Kirchhoff\u2019s Current and Voltage Laws';
    const desc = 'Kirchhoff\u2019s current law (KCL) and voltage law (KVL) stated plainly, with sign conventions and three worked circuits you can check by hand.';
    const Vs = 12, R1 = 100, R2 = 220, Is = Vs / (R1 + R2), V1 = Is * R1, V2 = Is * R2, Ia = Vs / R1, Ib = Vs / R2;
    const faq = [
      ['What is Kirchhoff\u2019s current law?', 'The currents into a node add up to the currents out of it. Charge does not collect at a junction. If 5 A and 3 A flow in and 2 A flows out through one wire, the other wire carries 6 A.'],
      ['What is Kirchhoff\u2019s voltage law?', 'Around any closed loop the voltage rises and drops add up to zero. In a series circuit the drops across the resistors equal the source voltage.'],
      ['How do I handle signs?', 'Choose a direction for each current and a direction around the loop. A drop across a resistor in the direction of the current is positive; going through a source from \u2212 to + is a rise. If an answer comes out negative, the real direction is opposite to the one you chose.'],
      ['Do the laws work for AC?', 'Yes, for the instantaneous values, and for phasors with complex impedances. They assume lumped components, so very high frequencies and long lines need transmission line theory.']
    ];
    const inner = '<h2>The two laws</h2><div class="f">KCL:  \u03a3 I(in) = \u03a3 I(out)  at any node\nKVL:  \u03a3 V = 0  around any closed loop</div>' +
      '<h2>Example 1: a node (KCL)</h2><ol class="steps"><li>' + esc('Currents into the node: 5 A and 3 A. Out through one branch: 2 A.') + '</li><li>' + esc('5 + 3 = 2 + I, so I = ' + (5 + 3 - 2) + ' A out through the last branch.') + '</li></ol>' +
      '<h2>Example 2: a series loop (KVL)</h2><p>A ' + Vs + ' V source drives ' + R1 + ' \u03a9 and ' + R2 + ' \u03a9 in series.</p><ol class="steps"><li>' + esc('I = V / (R1 + R2) = ' + Vs + ' / ' + (R1 + R2) + ' = ' + g4(Is) + ' A') + '</li><li>' + esc('V1 = I \u00d7 R1 = ' + g4(V1) + ' V and V2 = I \u00d7 R2 = ' + g4(V2) + ' V') + '</li><li>' + esc('KVL check: ' + g4(V1) + ' + ' + g4(V2) + ' = ' + g4(V1 + V2) + ' V, the source voltage') + '</li></ol>' +
      '<h2>Example 3: a parallel pair (KCL at the top node)</h2><p>The same ' + Vs + ' V source across ' + R1 + ' \u03a9 and ' + R2 + ' \u03a9 in parallel.</p><ol class="steps"><li>' + esc('I1 = ' + Vs + ' / ' + R1 + ' = ' + g4(Ia) + ' A and I2 = ' + Vs + ' / ' + R2 + ' = ' + g4(Ib) + ' A') + '</li><li>' + esc('The source supplies I1 + I2 = ' + g4(Ia + Ib) + ' A') + '</li><li>' + esc('Equivalent resistance = ' + Vs + ' / ' + g4(Ia + Ib) + ' = ' + g4(Vs / (Ia + Ib)) + ' \u03a9, which equals (R1 \u00d7 R2) / (R1 + R2)') + '</li></ol>' +
      '<h2>When the laws are used</h2><p>Every circuit method is built on them: series and parallel reduction, the voltage and current dividers, mesh and node analysis. They apply to any circuit made of lumped components, linear or not.</p>';
    finish(slug, h1, desc, wrap(h1, desc, inner, faq, [['ohms-law-formulas.html', 'Ohm\u2019s Law Formulas'], ['coulombs-law.html', 'Coulomb\u2019s Law'], ['../pages/voltage-divider.html', 'Voltage Divider Calculator']]), faq, '', 'reference');
  }

  /* ---------------- Coulomb's law ---------------- */
  {
    const slug = 'coulombs-law', h1 = 'Coulomb\u2019s Law Calculator';
    const desc = 'Coulomb\u2019s law calculator: force between two point charges from the charges and the distance, with attractive or repulsive result and a distance table.';
    const def = L.coulombForce(COULOMB_UNITS, '1', '\u00b5C', '2', '\u00b5C', '0.1', 'm');
    const ee = L.coulombForce(COULOMB_UNITS, '1', 'e', '-1', 'e', '5.29177e-11', 'm');
    const rows = [0.05, 0.1, 0.2, 0.4, 0.8].map((r) => { const f = L.coulombForce(COULOMB_UNITS, '1', '\u00b5C', '2', '\u00b5C', String(r), 'm'); return [String(r) + ' m', L.coulombText(f.F)]; });
    const opts = (o, pick) => Object.keys(o).map((u) => '<option value="' + esc(u) + '"' + (u === pick ? ' selected' : '') + '>' + esc(u) + '</option>').join('');
    const faq = [
      ['What is Coulomb\u2019s law?', 'The force between two point charges is proportional to the product of the charges and inversely proportional to the square of the distance: F = k \u00d7 q1 \u00d7 q2 / r\u00b2, with k = 8.9875517923 \u00d7 10\u2079 N\u00b7m\u00b2/C\u00b2.'],
      ['Is the force attractive or repulsive?', 'Like charges (both positive or both negative) repel. Unlike charges attract. The calculator gives the size of the force and says which it is.'],
      ['What happens if the distance doubles?', 'The force falls to a quarter, because of the r\u00b2 in the formula. Halving the distance makes it four times larger. The table above shows this.'],
      ['How does k relate to the permittivity of free space?', 'k = 1 / (4\u03c0\u03b50), where \u03b50 = 8.8541878128 \u00d7 10\u207b\u00b9\u00b2 F/m. In a material with relative permittivity \u03b5r the force is divided by \u03b5r.']
    ];
    const inner = '<section class="card" aria-label="Coulomb force calculator"><div class="tgrid">' +
      '<div><label for="cb-q1">Charge 1</label><div class="trow"><input id="cb-q1" inputmode="decimal" autocomplete="off" value="1"><select id="cb-u1" aria-label="Unit of charge 1">' + opts(COULOMB_UNITS.q, '\u00b5C') + '</select></div></div>' +
      '<div><label for="cb-q2">Charge 2</label><div class="trow"><input id="cb-q2" inputmode="decimal" autocomplete="off" value="2"><select id="cb-u2" aria-label="Unit of charge 2">' + opts(COULOMB_UNITS.q, '\u00b5C') + '</select></div></div>' +
      '<div><label for="cb-r">Distance</label><div class="trow"><input id="cb-r" inputmode="decimal" autocomplete="off" value="0.1"><select id="cb-ur" aria-label="Unit of distance">' + opts(COULOMB_UNITS.r, 'm') + '</select></div></div></div>' +
      '<div class="tres cvr" aria-live="polite"><div class="big"><small>Force</small><span id="cb-out">' + esc(L.coulombText(def.F)) + '</span></div><div class="big"><small>Direction</small><span id="cb-kind">Repulsive (like charges)</span></div></div>' +
      '<p class="err" id="cb-err" role="status"></p></section>' +
      '<h2>Formula</h2><div class="f">F = k \u00d7 q1 \u00d7 q2 / r\u00b2     k = 1 / (4\u03c0\u03b50) = 8.9875517923 \u00d7 10\u2079 N\u00b7m\u00b2/C\u00b2</div>' +
      '<h2>Worked example</h2><ol class="steps"><li>' + esc('q1 = 1 \u00b5C = 1 \u00d7 10\u207b\u2076 C and q2 = 2 \u00b5C = 2 \u00d7 10\u207b\u2076 C, r = 0.1 m') + '</li><li>' + esc('F = 8.9875517923 \u00d7 10\u2079 \u00d7 (1 \u00d7 10\u207b\u2076) \u00d7 (2 \u00d7 10\u207b\u2076) / 0.1\u00b2 = ' + L.coulombText(def.F)) + '</li><li>Both charges are positive, so the force is repulsive.</li></ol>' +
      '<h2>Force against distance</h2><p>For the same two charges, 1 \u00b5C and 2 \u00b5C:</p>' + table(['Distance', 'Force'], rows) +
      '<h2>An electron and a proton</h2><p>At the Bohr radius, 5.29177 \u00d7 10\u207b\u00b9\u00b9 m, the pull between one proton and one electron is ' + esc(L.coulombText(ee.F)) + '. The charge of one electron is 1.602176634 \u00d7 10\u207b\u00b9\u2079 C (the unit <em>e</em> in the calculator).</p>' +
      '<h2>Limits</h2><p>The law is for point charges (or spheres, measured centre to centre) at rest, in a vacuum. In air it is almost the same. Moving charges also produce magnetic forces, which are not included.</p>';
    const tail = '<script>' + fns(convNum, L.coulombForce, L.coulombText, L.cbInit) + '\ncbInit(' + jsonSafe(COULOMB_UNITS) + ', document);</script>';
    finish(slug, h1, desc, wrap(h1, desc, inner, faq, [['kirchhoffs-laws.html', 'Kirchhoff\u2019s Laws'], ['ohms-law-formulas.html', 'Ohm\u2019s Law Formulas'], ['electrical-unit-converter.html', 'Electrical Unit Converter'], ['../pages/joules-to-volts.html', 'Joules to Volts']]), faq, tail, 'reference');
  }

  /* ---------------- electrical symbols ---------------- */
  {
    const slug = 'electrical-symbols', h1 = 'Electrical Symbols and Quantity Units';
    const desc = 'Electrical circuit symbols with drawings and meanings, plus a table of electrical quantities, their letter symbols and SI units.';
    const faq = [
      ['Why do some symbols have two forms?', 'Two drawing conventions are in use. The IEC style draws a resistor as a rectangle; the ANSI/IEEE style draws a zigzag. Both mean the same component. Use the one your drawing standard asks for.'],
      ['How do I tell polarity on a symbol?', 'On a battery the long plate is positive. On a polarised capacitor the straight plate and a plus sign mark the positive side. On a diode current flows from the triangle to the bar.'],
      ['Where do I find the full list?', 'The complete sets are in the drawing standards (for example IEC 60617 and IEEE 315). This page shows the common symbols and does not reproduce those standards.']
    ];
    const svg = (label, inner) => '<svg viewBox="0 0 64 40" width="96" height="60" role="img" aria-label="' + esc(label + ' symbol') + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
    const symTable = '<div class="tw" tabindex="0" role="region" aria-label="Scrollable table: Symbol, Name, What it does"><table><thead><tr><th>Symbol</th><th>Name</th><th>What it means</th></tr></thead><tbody>' +
      SYMBOLS.map(([name, , d, note]) => '<tr><td>' + svg(name, d) + '</td><td>' + esc(name) + '</td><td>' + esc(note) + '</td></tr>').join('') + '</tbody></table></div>';
    const inner = '<h2>Circuit symbols</h2>' + symTable +
      '<h2>Quantities, letter symbols and units</h2>' + table(['Quantity', 'Symbol', 'SI unit', 'Unit symbol'], QUANTITIES) +
      '<p class="note">V, I, R and P are italic in print. Unit symbols are upright, and a unit named after a person is written with a lower-case name (volt, ampere) and a capital-letter symbol (V, A).</p>' +
      '<h2>Metric prefixes used with these units</h2>' + table(['Prefix', 'Symbol', 'Factor'], [['giga', 'G', '10\u2079'], ['mega', 'M', '10\u2076'], ['kilo', 'k', '10\u00b3'], ['milli', 'm', '10\u207b\u00b3'], ['micro', '\u00b5', '10\u207b\u2076'], ['nano', 'n', '10\u207b\u2079'], ['pico', 'p', '10\u207b\u00b9\u00b2']]);
    finish(slug, h1, desc, wrap(h1, desc, inner, faq, [['resistor-color-code.html', 'Resistor Color Code'], ['ohms-law-formulas.html', 'Ohm\u2019s Law Formulas'], ['scientific-notation-converter.html', 'Scientific Notation Converter']]), faq, '', 'reference', '<style>td svg{display:block;color:var(--ink)}</style>');
  }

  /* ---------------- numeric long-tail pages: watts to amps, amps to watts ---------------- */
  const SYS = [['DC', 12, 'dc'], ['DC', 24, 'dc'], ['DC', 48, 'dc'], ['Single-phase', 120, '1ph'], ['Single-phase', 230, '1ph'], ['Single-phase', 240, '1ph'], ['Three-phase', 208, '3ph'], ['Three-phase', 400, '3ph'], ['Three-phase', 415, '3ph'], ['Three-phase', 480, '3ph']];
  const NOTE_W = {
    600: 'about the load of a microwave oven on a medium setting, a large desktop computer or a small pump motor.',
    800: 'about the load of a toaster, a hand-held vacuum cleaner or a mid-size blender at full power.',
    1200: 'about the load of a hair dryer, an iron or a small space heater.',
    100: 'about the load of a bright incandescent lamp, a ceiling fan or a laptop working hard.',
    200: 'about the load of a large television, a desktop computer under load or a small refrigerator compressor.',
    500: 'about the load of a food processor, a small vacuum cleaner or a mid-size circulating pump.',
    750: 'close to one mechanical horsepower of motor output (1 HP is 745.7 W). A motor draws more electrical power than it delivers, because it is not 100% efficient.',
    1000: 'about the load of a small room heater or a toaster.',
    1500: 'a common top setting for a portable space heater.',
    2000: 'about the load of an electric kettle or a large hair dryer.',
    3000: 'about the element of a domestic water heater, or a small portable generator at full output.',
    5000: 'a larger water heater, a small electric oven or a mid-size inverter.',
    10000: 'a large electric shower, or a 10 kW inverter or generator.'
  };
  const NOTE_A = {
    1: 'a phone charger, a small lamp or a device on a small plug-in adapter.',
    2: 'a small fan, a laptop charger or a light appliance on a 5 A circuit.',
    3: 'a table fan, a small heater on its low setting or a typical extension-lead load.',
    5: 'a small appliance circuit, for example a fan heater on its low setting.',
    10: 'a common rating for a single appliance plug and a typical general-purpose circuit.',
    15: 'a common branch circuit rating in North America, at 120 V.',
    20: 'a common branch circuit rating for kitchens and workshops in North America, at 120 V.',
    30: 'a common rating for an electric clothes dryer circuit in North America, at 240 V.',
    50: 'a common rating for an electric range circuit in North America, at 240 V.',
    100: 'a common size for the supply to a small house or for a sub-board feeder.'
  };
  const NOTE_K = {
    1: 'about the load of a small room heater or a toaster.',
    2: 'about the load of an electric kettle or a large hair dryer.',
    3: 'about the element of a domestic water heater, or a small portable generator at full output.',
    5: 'a larger water heater, a small electric oven or a mid-size inverter.',
    10: 'a large electric shower, a small commercial oven or a 10 kW inverter or generator.',
    20: 'a motor of roughly 25 to 30 horsepower, or the load of a small workshop.',
    50: 'a fast DC electric vehicle charger, or the load of a small shop or workshop.'
  };
  const NOTE_AK = {
    10: 'a typical single-appliance circuit, for example a small oven or a heater.',
    16: 'a common miniature circuit breaker rating in IEC-style systems.',
    32: 'a common breaker rating for an electric cooker or a home electric vehicle charger circuit.',
    63: 'a common breaker size for a sub-board feeder.',
    100: 'about the size of an incoming supply for a small commercial unit.'
  };
  const lt = [];
  Object.keys(NOTE_W).forEach((w) => lt.push({ mode: 'wa', x: Number(w), note: NOTE_W[w], slug: w + '-watts-to-amps' }));
  Object.keys(NOTE_A).forEach((a) => lt.push({ mode: 'aw', x: Number(a), note: NOTE_A[a], slug: a + '-amps-to-watts' }));
  Object.keys(NOTE_K).forEach((k) => lt.push({ mode: 'ka', x: Number(k), note: NOTE_K[k], slug: k + '-kw-to-amps' }));
  Object.keys(NOTE_AK).forEach((a) => lt.push({ mode: 'ak', x: Number(a), note: NOTE_AK[a], slug: a + '-amps-to-kw' }));
  lt.forEach((p) => {
    const wa = p.mode === 'wa' || p.mode === 'ka', kw = p.mode === 'ka' || p.mode === 'ak', U = kw ? 'kW' : 'W', UW = kw ? 'kilowatts' : 'watts', xs = convNum(p.x), h1 = wa ? xs + ' ' + (kw ? 'kW' : 'Watts') + ' to Amps' : xs + ' Amps to ' + (kw ? 'kW' : 'Watts');
    const calc = (V, pf, sys) => L.ltCalc(p.mode, p.x, V, pf, sys), v = (V, pf, sys) => calc(V, pf, sys).value;
    const unitIn = wa ? U : 'A';
    const r230 = calc(230, 1, '1ph'), r120 = calc(120, 1, '1ph'), r400 = calc(400, 0.8, '3ph'), r09 = calc(230, 0.9, '1ph');
    const desc = wa
      ? xs + ' ' + U + ' is ' + r230.text + ' at 230 V and ' + r120.text + ' at 120 V (single-phase, power factor 1). Table for DC and three-phase, power factor 0.8, and the formula.'
      : xs + ' A is ' + r230.text + ' at 230 V and ' + r120.text + ' at 120 V (single-phase, power factor 1). Table for DC and three-phase, power factor 0.8, and the formula.';
    const formulaLine = kw ? (wa ? 'I = P \u00d7 1,000 / V (DC)     I = P \u00d7 1,000 / (V \u00d7 pf) (single-phase)     I = P \u00d7 1,000 / (\u221a3 \u00d7 V \u00d7 pf) (three-phase)' : 'P = V \u00d7 I / 1,000 (DC)     P = V \u00d7 I \u00d7 pf / 1,000 (single-phase)     P = \u221a3 \u00d7 V \u00d7 I \u00d7 pf / 1,000 (three-phase)') : wa ? 'I = P / V (DC)     I = P / (V \u00d7 pf) (single-phase)     I = P / (\u221a3 \u00d7 V \u00d7 pf) (three-phase)' : 'P = V \u00d7 I (DC)     P = V \u00d7 I \u00d7 pf (single-phase)     P = \u221a3 \u00d7 V \u00d7 I \u00d7 pf (three-phase)';
    const rows = SYS.map(([n, V, s]) => [n, V + ' V', calc(V, 1, s).text, s === 'dc' ? 'not used' : calc(V, 0.8, s).text]);
    const faq = [
      wa ? ['How many amps is ' + xs + ' ' + UW + '?', xs + ' ' + U + ' is ' + r230.text + ' on a 230 V single-phase supply and ' + r120.text + ' on 120 V, both with a power factor of 1. The current depends on the voltage, so it is a different answer on every supply.']
        : ['How many ' + UW + ' is ' + xs + ' amps?', xs + ' A is ' + r230.text + ' on a 230 V single-phase supply and ' + r120.text + ' on 120 V, both with a power factor of 1. The power depends on the voltage, so it is a different answer on every supply.'],
      ['What if the power factor is not 1?', wa ? 'The current rises. At 230 V and a power factor of 0.9, ' + xs + ' ' + U + ' draws ' + r09.text + '. Heaters and filament lamps are close to 1, while motors and many power supplies are lower.' : 'The real power falls. At 230 V and a power factor of 0.9, ' + xs + ' A is ' + r09.text + '. Heaters and filament lamps are close to 1, while motors and many power supplies are lower.'],
      ['What about a three-phase supply?', xs + ' ' + unitIn + ' on 400 V three-phase at a power factor of 0.8 is ' + r400.text + '. The line voltage is used with the factor \u221a3 (about 1.732).']
    ];
    const inner = '<section class="card" aria-label="' + esc(h1) + ' calculator"><div class="tgrid"><div><label for="lt-x">' + (wa ? 'Power (' + U + ')' : 'Current (A)') + '</label><div class="trow"><input id="lt-x" inputmode="decimal" autocomplete="off" value="' + p.x + '"></div></div>' +
      '<div><label for="lt-v">Voltage (V)</label><div class="trow"><input id="lt-v" inputmode="decimal" autocomplete="off" value="230"></div></div>' +
      '<div><label for="lt-pf">Power factor</label><div class="trow"><input id="lt-pf" inputmode="decimal" autocomplete="off" value="1"></div></div>' +
      '<div><label for="lt-sys">Supply</label><select id="lt-sys"><option value="dc">DC</option><option value="1ph" selected>Single-phase AC</option><option value="3ph">Three-phase AC (line voltage)</option></select></div></div>' +
      '<div class="tres cvr" aria-live="polite"><div class="big"><small>' + (wa ? 'Current' : 'Power') + '</small><span id="lt-out">' + esc(r230.text) + '</span></div></div><p class="err" id="lt-err" role="status"></p></section>' +
      '<div class="card ans"><div>' + esc(xs + ' ' + unitIn + ' at 230 V, single-phase, power factor 1 =') + '</div><div class="big">' + esc(r230.text) + '</div></div>' +
      '<h2>Formula</h2><div class="f">' + esc(formulaLine) + '</div>' +
      '<h2>Worked example</h2><ol class="steps"><li>' + esc(wa ? 'I = ' + xs + (kw ? ' \u00d7 1,000' : '') + ' / (230 \u00d7 1) = ' + r230.text : 'P = 230 \u00d7 ' + xs + ' \u00d7 1' + (kw ? ' / 1,000' : '') + ' = ' + r230.text) + '</li><li>' + esc(wa ? 'With a power factor of 0.9: I = ' + xs + (kw ? ' \u00d7 1,000' : '') + ' / (230 \u00d7 0.9) = ' + r09.text : 'With a power factor of 0.9: P = 230 \u00d7 ' + xs + ' \u00d7 0.9' + (kw ? ' / 1,000' : '') + ' = ' + r09.text) + '</li></ol>' +
      '<h2>On other supplies</h2>' + table(['Supply', 'Voltage', wa ? 'Current at pf 1' : 'Power at pf 1', wa ? 'Current at pf 0.8' : 'Power at pf 0.8'], rows) +
      '<p class="note">Three-phase rows use the line-to-line voltage. DC ignores the power factor.</p>' +
      '<h2>What ' + esc(xs) + ' ' + unitIn + ' looks like</h2><p>' + esc(xs + ' ' + unitIn + ' is ' + p.note) + '</p>' +
      '<p class="note">This is an estimate of the load current only. Choosing a cable or a breaker also needs the installation method, the ambient temperature, the voltage drop and the rules you work to.</p>';
    const tail = '<script>' + fns(L.ltCalc, L.ltInit) + '\nltInit(' + JSON.stringify(p.mode) + ', document);</script>';
    const rel = kw ? (wa ? [['../pages/kw-to-amps.html', 'kW to Amps Calculator'], ['../pages/kva-to-amps.html', 'kVA to Amps']] : [['../pages/amps-to-kw.html', 'Amps to kW Calculator'], ['../pages/kw-to-kva.html', 'kW to kVA']]) : wa ? [['../pages/watts-to-amps.html', 'Watts to Amps Calculator'], ['../pages/kw-to-amps.html', 'kW to Amps']] : [['../pages/amps-to-watts.html', 'Amps to Watts Calculator'], ['../pages/amps-to-kw.html', 'Amps to kW']];
    const same = lt.filter((o) => o.mode === p.mode), idx = same.findIndex((o) => o.slug === p.slug), nb = (o) => [o.slug + '.html', convNum(o.x) + (wa ? ' ' + U + ' to A' : ' A to ' + U)];
    const near = [same[(idx + same.length - 1) % same.length], same[(idx + 1) % same.length], same[(idx + 2) % same.length]].map(nb);
    finish(p.slug, h1, desc, wrap(h1, desc, inner, faq, rel.concat(near, [[wa ? 'power-converter.html' : 'current-converter.html', wa ? 'Power Converter' : 'Current Converter']])), faq, tail, 'example');
    meta[meta.length - 1].mode = p.mode; meta[meta.length - 1].x = p.x;
  });

  /* ---------------- kVA to amps (transformer and generator ratings; no power factor) ---------------- */
  const NOTE_S = {
    25: 'a small distribution transformer, or the supply to a small commercial unit.',
    63: 'a common small distribution transformer rating.',
    100: 'a common distribution transformer rating for a small group of buildings.',
    160: 'a standard rating in the IEC preferred series of distribution transformers.',
    250: 'a common size for a transformer feeding a small factory or a large building.',
    400: 'a common size for the supply to a medium commercial building.',
    630: 'one of the most common ratings of three-phase distribution transformers.',
    1000: 'a large distribution transformer, often feeding a factory or a big building.'
  };
  const SYS_S = [['Single-phase', 120, '1ph'], ['Single-phase', 230, '1ph'], ['Single-phase', 240, '1ph'], ['Three-phase', 208, '3ph'], ['Three-phase', 400, '3ph'], ['Three-phase', 415, '3ph'], ['Three-phase', 480, '3ph'], ['Three-phase', 690, '3ph'], ['Three-phase', 6600, '3ph'], ['Three-phase', 11000, '3ph'], ['Three-phase', 33000, '3ph']];
  Object.keys(NOTE_S).forEach((k) => {
    const x = Number(k), xs = convNum(x), slug = k + '-kva-to-amps', h1 = xs + ' kVA to Amps', calc = (V, sys) => L.ltCalc('sa', x, V, 1, sys);
    const a400 = calc(400, '3ph'), a415 = calc(415, '3ph'), a11 = calc(11000, '3ph'), a230 = calc(230, '1ph');
    const desc = xs + ' kVA is ' + a400.text + ' at 400 V and ' + a11.text + ' at 11 kV (three-phase), and ' + a230.text + ' at 230 V single-phase. Table for common supplies and the formula.';
    const faq = [
      ['How many amps is ' + xs + ' kVA?', xs + ' kVA is ' + a400.text + ' on a 400 V three-phase supply, ' + a415.text + ' at 415 V and ' + a11.text + ' at 11 kV. On a 230 V single-phase supply it is ' + a230.text + '. The current depends on the voltage, so there is no single answer.'],
      ['Why is no power factor needed?', 'kVA is apparent power, which is voltage times current (times \u221a3 for three-phase). The power factor only matters when you convert kVA to kW.'],
      ['Is this the rated current of a transformer?', 'It is the rated line current at that voltage for a balanced load: kVA \u00d7 1,000 / (\u221a3 \u00d7 V). Inrush, overload and fault current are separate questions.']
    ];
    const rows = SYS_S.map(([n, V, s]) => [n, convNum(V) + ' V', calc(V, s).text]);
    const inner = '<section class="card" aria-label="' + esc(h1) + ' calculator"><div class="tgrid"><div><label for="lt-x">Apparent power (kVA)</label><div class="trow"><input id="lt-x" inputmode="decimal" autocomplete="off" value="' + x + '"></div></div>' +
      '<div><label for="lt-v">Voltage (V, line to line for three-phase)</label><div class="trow"><input id="lt-v" inputmode="decimal" autocomplete="off" value="400"></div></div>' +
      '<div><label for="lt-sys">Supply</label><select id="lt-sys"><option value="1ph">Single-phase AC</option><option value="3ph" selected>Three-phase AC</option></select></div></div>' +
      '<div class="tres cvr" aria-live="polite"><div class="big"><small>Current</small><span id="lt-out">' + esc(a400.text) + '</span></div></div><p class="err" id="lt-err" role="status"></p></section>' +
      '<div class="card ans"><div>' + esc(xs + ' kVA at 400 V, three-phase =') + '</div><div class="big">' + esc(a400.text) + '</div></div>' +
      '<h2>Formula</h2><div class="f">' + esc('I = S \u00d7 1,000 / V (single-phase)     I = S \u00d7 1,000 / (\u221a3 \u00d7 V) (three-phase)') + '</div>' +
      '<h2>Worked example</h2><ol class="steps"><li>' + esc('Three-phase, 400 V: I = ' + xs + ' \u00d7 1,000 / (\u221a3 \u00d7 400) = ' + a400.text) + '</li><li>' + esc('Single-phase, 230 V: I = ' + xs + ' \u00d7 1,000 / 230 = ' + a230.text) + '</li></ol>' +
      '<h2>On other supplies</h2>' + table(['Supply', 'Voltage', 'Current'], rows) +
      '<p class="note">Three-phase rows use the line-to-line voltage.</p>' +
      '<h2>What ' + esc(xs) + ' kVA looks like</h2><p>' + esc(xs + ' kVA is ' + NOTE_S[k]) + '</p>' +
      '<p class="note">This is the rated current only. Cable, breaker and protection settings also depend on the installation, inrush, the rules you work to and the transformer data sheet.</p>';
    const tail = '<script>' + fns(L.ltCalc, L.ltInit) + '\nltInit("sa", document);</script>';
    const same = Object.keys(NOTE_S), i = same.indexOf(k), nb = (o) => [o + '-kva-to-amps.html', convNum(Number(o)) + ' kVA to A'];
    const near = [same[(i + same.length - 1) % same.length], same[(i + 1) % same.length], same[(i + 2) % same.length]].map(nb);
    finish(slug, h1, desc, wrap(h1, desc, inner, faq, [['../pages/kva-to-amps.html', 'kVA to Amps Calculator'], ['../pages/kva-to-kw.html', 'kVA to kW']].concat(near, [['../calculators/transformer-sizing/', 'Transformer Sizing Calculator'], ['power-converter.html', 'Power Converter']])), faq, tail, 'example');
    meta[meta.length - 1].mode = 'sa'; meta[meta.length - 1].x = x;
  });

  /* ---------------- formula articles (tools/reference_articles.js) ---------------- */
  const ART = require('./reference_articles.js').articles(ctx);
  ART.forEach((a) => {
    const have = a.related.map((r) => r[0]), sib = ART.filter((o) => o.slug !== a.slug && have.indexOf(o.slug + '.html') < 0).map((o) => [o.slug + '.html', o.h1]);
    finish(a.slug, a.h1, a.desc, wrap(a.h1, a.desc, a.inner, a.faq, a.related.concat(sib)), a.faq, '', 'reference');
    meta[meta.length - 1].article = true;
  });

  return { pages, meta, lt };
}

module.exports = { build, SYMBOLS, QUANTITIES, OHM, g4 };
