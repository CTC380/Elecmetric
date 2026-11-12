/* Elecmetric reference pages and worked-example pages (written into converters/ by build_converters.js).
   Reference: resistor colour code, Ohm's law formulas, Kirchhoff's laws, Coulomb's law, electrical symbols.
   Worked examples: watts to amps and amps to watts for common values.
   Every number on these pages is computed here from the formula, never typed in. */
const L = require('./reference_logic.js');
const { RES_T, COULOMB_UNITS } = L;

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
    const slug = 'resistor-color-code', h1 = 'Resistor Color Code Calculator';
    const desc = 'Resistor colour code calculator for 3, 4, 5 and 6 band resistors: colours to ohms with tolerance range, and ohms to colours, with the full colour table.';
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
      ['How do I know which end to start from?', 'The tolerance band (often gold or silver) is set slightly apart from the others, and it is read last. If no band is gold or silver, the band nearest an end is usually the first. When in doubt, measure the resistor with a meter.'],
      ['What is the difference between 4, 5 and 6 band resistors?', 'A 5 band resistor has a third digit, so it can show more exact values (precision resistors). A 6 band resistor adds a temperature coefficient band, in ppm per kelvin. A 3 band resistor has no tolerance band and is \u00b120%.'],
      ['Which colour means what?', 'Black 0, brown 1, red 2, orange 3, yellow 4, green 5, blue 6, violet 7, grey 8, white 9. As a multiplier gold is \u00d70.1 and silver is \u00d70.01. As a tolerance gold is \u00b15% and silver is \u00b110%.']
    ];
    const colRows = RES_T.order.m.map((c) => [c.charAt(0).toUpperCase() + c.slice(1), RES_T.digit[c] !== undefined ? String(RES_T.digit[c]) : '\u2014', '\u00d7' + convNum(RES_T.mult[c]), RES_T.tol[c] !== undefined ? '\u00b1' + RES_T.tol[c] + '%' : '\u2014', RES_T.ppm[c] !== undefined ? RES_T.ppm[c] + ' ppm/K' : '\u2014']);
    const E12 = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82], E24 = [10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91];
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
      '<h2>Colour code table</h2>' + table(['Colour', 'Digit', 'Multiplier', 'Tolerance', 'Temp. coefficient'], colRows) +
      '<p class="note">Tolerance and temperature coefficient colours are not used by every maker. Where a datasheet and this table disagree, the datasheet is right. A resistor with no tolerance band is \u00b120%.</p>' +
      '<h2>Worked examples</h2><ol class="steps">' + [['yellow', 'violet', 'red', 'gold'], ['brown', 'black', 'orange', 'red'], ['red', 'red', 'black', 'black', 'brown'], ['green', 'blue', 'black', 'red', 'brown', 'red']].map((b) => '<li>' + esc(b.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(', ') + ' = ' + L.resDecode(RES_T, b).text) + '</li>').join('') + '</ol>' +
      '<h2>Preferred values: E12 and E24</h2><p>Resistors are made in preferred values rather than every number. E12 has 12 values per decade (about \u00b110%) and E24 has 24 (about \u00b15%). Multiply each by 1, 10, 100 and so on.</p>' +
      '<p><strong>E12:</strong> ' + E12.join(', ') + '</p><p><strong>E24:</strong> ' + E24.join(', ') + '</p>' +
      '<h2>Using the code</h2><p>Reading a resistor from its bands is a check, not a measurement. Colours fade, and brown, red and orange are easy to confuse under poor light. Where it matters, measure the resistance with the resistor out of the circuit.</p>';
    const tail = '<script>' + fns(L.resRoles, L.resFmt, L.resLabel, L.resDecode, L.resEncode, L.resInit) + '\nresInit(' + jsonSafe(RES_T) + ', document);</script>';
    const css = '<style>.rcs{display:flex;gap:6px;margin:12px 0}.sw{display:inline-block;width:28px;height:44px;border:1px solid var(--line);border-radius:4px}.sw[hidden]{display:none}</style>';
    finish(slug, h1, desc, wrap(h1, desc, inner, faq, [['ohms-law-formulas.html', 'Ohm\u2019s Law Formulas'], ['electrical-symbols.html', 'Electrical Symbols'], ['../calculators/electrical-fundamentals/', 'Fundamentals calculators']]), faq, tail, 'reference', css);
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
