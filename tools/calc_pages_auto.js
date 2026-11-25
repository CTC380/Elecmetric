/* Landing-page data for every calculator that has no hand-written page in tools/calc_pages_data.js.
   Practice 1 of the RapidTables benchmark: one calculator, one crawlable URL (/calculators/<slug>/).

   Rules:
   - A calculator whose search intent is already served by a conversion page (pages/*.html, listed in INTENTS) gets no second page,
     so two pages never compete for the same query. Those calculators stay reachable through the conversion page.
   - Nothing here is written by hand per calculator. Every sentence comes from the registry entry (purpose, inputs, outputs, formula,
     assumptions, notes, next), and every number is computed by engine.js at build time, so a page cannot disagree with the calculator.
   - A hand-written entry in calc_pages_data.js always wins over a generated one. To improve a generated page, add an entry there. */

/* Headline results for pages where the first three registry outputs are not the ones a reader came for (the bill total, the monthly cost, the saving). Keys must exist in the registry. */
const HEAD_OVERRIDES = {
  'multi-appliance-cost': ['Em', 'Cm', 'Ey', 'Cy'],
  'electricity-cost-planner': ['Em', 'Tot', 'dT', 'pbm'],
  'electricity-bill-meter': ['u', 'Tot', 'avg'],
  'load-energy-cost': ['P', 'Em', 'Cm', 'Cy'],
  'tou-demand-bill': ['Et', 'Tot', 'avg'],
  'replacement-savings': ['dE', 'dC', 'dCy', 'pby']
};

/* Calculators whose page address differs from the registry id: the URLs the CEO note asks for. The old address (the registry id) stays as a
   redirect page (tools/build_pages.js writes it, the deploy guard allows it, and it is not in the sitemap). */
const SLUG_OVERRIDES = {
  'multi-appliance-cost': 'multiple-appliance-cost',
  'electricity-bill-meter': 'electricity-bill-calculator',
  'replacement-savings': 'electricity-savings-calculator',
  'electricity-cost-planner': 'energy-cost-analysis',
  'load-energy-cost': 'industrial-energy-cost'
};

/* Short page names where the registry title is too long for a 60-character title tag. */
const NAME_OVERRIDES = {
  'dc-dc-converter': 'DC-DC Converter Design',
  'switching-loss-comparison': 'MOSFET Switching Loss Comparison',
  'controlled-rectifier': 'Controlled Rectifier (Thyristor)',
  'two-wattmeter': 'Two-Wattmeter Method',
  'power-measurement': 'Power Measurement',
  'pt-ratio': 'PT Ratio',
  'vfd-speed': 'VFD Frequency and Motor Speed',
  'load-factor': 'Load Factor Calculator',
  'motor-efficiency-loss': 'Motor Efficiency and Load',
  'magnetic-flux-density': 'Magnetic Flux Density',
  'rc-rl-transient': 'RC and RL Time Constant',
  'adc-sampling': 'ADC Resolution and Sampling',
  'sensor-range-converter': 'Sensor Range Converter',
  'calibration-error': 'Calibration Error and Tolerance',
  'electric-potential': 'Electric Potential',
  'scr-triggering': 'SCR Triggering',
  'pid-tuning': 'PID Tuning',
  'bode-plot': 'Bode Plot',
  'contact-resistance': 'Contact Resistance',
  'signage-load': 'Signage Load Calculator',
  'protection-coordination-check': 'Protection Coordination Checker',
  'three-phase-network': 'Three-Phase Circuit Calculator',
  'coupled-inductance': 'Inductance Calculator',
  'motor-selection-load': 'Motor Selection and Load Calculator',
  'protective-device-selection': 'Protective Device Selection Tool',
  'measurement-uncertainty': 'Measurement Uncertainty Calculator',
  'pv-performance-ratio': 'PV Performance Ratio Calculator',
  'ev-charger-load': 'EV Charger Load Calculator',
  'railway-backup-load': 'Railway Backup Load Calculator',
  'motor-nameplate': 'Motor Nameplate Calculator',
  'resistivity-conductance': 'Resistance and Resistivity Calculator',
  'semiconductor-loss': 'Semiconductor Loss Calculator',
  'power-supply-ripple': 'Power Supply Ripple',
  'wavelength': 'Wavelength Calculator',
  'ev-range': 'EV Range Estimator',
  'reliability-indices': 'Reliability Indices',
  'electric-field': 'Electric Field',
  'thermal-rise': 'Enclosure Thermal Rise',
  'energy-savings': 'Energy Savings Estimator',
  'energy-audit': 'Energy Audit',
  'replacement-savings': 'Replacement Energy Savings',
  'load-energy-cost': 'Load Energy and Cost',
  'tou-demand-bill': 'Time-of-Use and Demand Bill',
  'electricity-bill-meter': 'Electricity Bill from Meter Readings',
  'multi-appliance-cost': 'Multiple Appliance Cost',
  'electricity-cost-planner': 'Electricity Cost Planner',
  'alternator-emf': 'Alternator EMF and Regulation',
  'pwm-inverter': 'PWM Inverter Output and Harmonics',
  'second-order-response': 'Second-Order Step Response',
  'routh-hurwitz': 'Routh-Hurwitz Stability',
  'fourier-series': 'Fourier Series and Harmonics',
  'lighting-uniformity': 'Lighting Uniformity',
  'point-by-point-lighting': 'Point-by-Point Lighting',
  'agl-photometry-data': 'AGL Photometry Data',
  'synchronous-motor': 'Synchronous Motor',
  'transformer-inrush': 'Transformer Inrush',
  'transformer-parallel': 'Transformer Parallel Operation',
  'ladder-logic-simulator': 'Ladder Logic Start/Stop and Timer',
  'boolean-logic': 'Boolean Logic and Truth Table',
  'solar-inverter-sizing': 'Solar Inverter Sizing',
  'bess-energy-power': 'BESS Energy and Power',
  'ev-energy-consumption': 'EV Energy Consumption',
  'equipment-loss': 'Equipment Energy Loss',
  'hybrid-system-sizing': 'Hybrid Solar System Sizing',
  'derivative-integral': 'Derivative and Integral',
  'first-order-ode': 'First-Order ODE Solver',
  'laplace-transform': 'Laplace Transform Table',
  'motor-power-output': 'Motor Output Power and Loss',
  'transformer-loading': 'Transformer Loading',
  'lc-energy': 'Capacitor and Inductor Energy',
  'generator-fuel': 'Generator Fuel Consumption',
  'ir-temp-correction': 'Insulation Resistance Correction',
  'insulation-pi-dar': 'Polarisation Index and DAR',
  'agl-brightness-steps': 'AGL Brightness Step Current',
  'agl-lamp-life-curve': 'AGL Lamp Life at Circuit Current',
  'agl-cable-loop-loss': 'AGL Series Cable Loop Loss',
  'agl-cable-size-loss': 'AGL Series Cable Size for Loss',
  'agl-lamp-failure-load': 'AGL Load with Failed Lamps',
  'probability-calculator': 'Probability',
  'permutations-combinations': 'Permutations and Combinations',
  'binomial-distribution': 'Binomial Distribution'
};

const strip = (t) => t.replace(/\s*\([^)]*\)/g, '').trim();
const lower = (t) => (/^[A-Z][a-z]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t);
const list = (a) => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
const sig = (v) => Number(Number(v).toPrecision(3));

function describe(def) {
  const SUFFIX = ' With the formula, a worked example and typical values.';
  let d = def.purpose.trim();
  if (d.length > 160) { const cut = d.slice(0, 160); d = cut.slice(0, Math.max(cut.lastIndexOf('. ') + 1, cut.lastIndexOf(', '))).replace(/,$/, '.'); }
  if (d.length + SUFFIX.length <= 160) d += SUFFIX;
  if (d.length < 50) d += ' Includes the formula and a worked example.';
  return d;
}

/* Sweeps that cannot be derived from the default (gauge numbers, a live-zero current range). */
const VARY_OVERRIDES = {
  'swg-wire': ['n', '', [0, 6, 10, 14, 18, 24, 30]],
  'current-loop-4-20': ['I', 'mA', [4, 6, 8, 12, 16, 18, 20]],
  'motor-slip': ['N', 'rpm', [1000, 1200, 1400, 1470, 1480, 1490, 1499]],
  'boolean-logic': ['tt', '', [1, 105, 127, 128, 150, 232, 254]]
};

/* First input that can be varied across at least four sensible multiples of its default (not an enum, not blank). Inputs with a unit
   come first, so the table varies a physical quantity where there is one. */
function pickVary(E, def, raw) {
  if (VARY_OVERRIDES[def.id]) return VARY_OVERRIDES[def.id];
  const FACTORS = [0.1, 0.25, 0.5, 1, 2, 4, 10];
  for (const withUnit of [true, false]) {
    for (const s of def.inputs) {
      if (s.type === 'enum' || !!s.unit !== withUnit) continue;
      const cur = raw[s.key], base = Array.isArray(cur) ? Number(cur[0]) : Number(cur), u = Array.isArray(cur) ? cur[1] : s.unit;
      if (!(base > 0)) continue;
      const ok = FACTORS.map((f) => sig(base * f)).filter((v) => E.calculate(def, Object.assign({}, raw, { [s.key]: [v, u] })).ok);
      if (ok.length >= 4) return [s.key, u, Array.from(new Set(ok)).sort((a, b) => a - b)];
    }
  }
  return null;
}

function autoPages(E, hand, skipCalcIds, taken, cats) {
  const have = new Set(hand.map((h) => h.calc));
  const slugOf = {};
  hand.forEach((h) => { slugOf[h.calc] = h.slug; });
  const todo = E.CALCS.filter((c) => !have.has(c.id) && !skipCalcIds.has(c.id));
  todo.forEach((c) => { slugOf[c.id] = SLUG_OVERRIDES[c.id] || c.id; if (taken.has(slugOf[c.id])) throw new Error(c.id + ': generated slug collides with an existing page or category'); });
  const catOf = (def) => cats.find((k) => k.divisions.indexOf(def.division.slice(0, 2)) >= 0).slug;
  const out = todo.map((def) => {
    const raw = E.defaultsRaw(def);
    const vary = pickVary(E, def, raw);
    if (!vary) throw new Error(def.id + ': no input can be varied for the typical-values table');
    const head = (HEAD_OVERRIDES[def.id] ? HEAD_OVERRIDES[def.id].map((k) => { const o = def.outputs.find((x) => x.key === k); if (!o) throw new Error(def.id + ': headline output ' + k + ' is not in the registry'); return o; }) : def.outputs.slice(0, 3)).map((o) => [o.key, o.unit || '']);
    const name = NAME_OVERRIDES[def.id] || strip(def.title);
    const flat = (t) => lower(strip(t).replace(/ \(used when[^)]*\)/, '')).replace(/:\s*/g, ' ');
    const ins = def.inputs.filter((s) => s.mode !== 'engineering').map((s) => flat(s.label));
    const outs = def.outputs.map((o) => flat(o.label));
    const cap = (a, n, w) => list(a.length > n ? a.slice(0, n).concat([(a.length - n) + ' more ' + w + (a.length - n > 1 ? 's' : '')]) : a);
    const inTxt = cap(ins, 4, 'input'), outTxt = cap(outs, 3, 'result');
    const rel = (def.next || []).filter((id) => E.BY_ID[id] && id !== def.id);
    const pages = rel.filter((id) => slugOf[id] && todo.some((t) => t.id === id) || hand.some((h) => h.calc === id)).map((id) => slugOf[id]).slice(0, 4);
    const app = rel.filter((id) => !pages.includes(slugOf[id])).slice(0, 3);
    return {
      slug: SLUG_OVERRIDES[def.id] || def.id, calc: def.id, name, group: def.division.replace(/^\d+ /, ''), auto: true,
      desc: describe(def), head, vary,
      intro: 'This page calculates ' + outTxt + ' from ' + inTxt + '. Change any value or its unit and the result updates. The steps below show the working for the default values, so you can check each line against your own method.',
      caveat: def.notes,
      faq: [
        ['What does this calculator assume?', (def.assumptions || []).map((a) => a.replace(/[.]$/, '')).join('. ') + '.'],
        ['Which calculators should I use next?', rel.length ? 'Common next steps are ' + list(rel.map((id) => E.BY_ID[id].title)) + '. The related links at the bottom of this page open them.' : 'This calculator is usually a final step. The category link at the bottom of this page lists neighbouring calculators.']
      ],
      pages, app
    };
  });
  /* Each page also links to the next two generated pages in its own category (a ring in registry order), so every page has inbound links
     from its neighbours in addition to its category hub and the engineering hub. */
  const ring = {};
  out.forEach((o) => { (ring[catOf(E.BY_ID[o.calc])] = ring[catOf(E.BY_ID[o.calc])] || []).push(o); });
  Object.keys(ring).forEach((k) => ring[k].forEach((o, i, a) => {
    for (let j = 1; j <= 2 && j < a.length; j++) { const t = a[(i + j) % a.length].slug; if (t !== o.slug && o.pages.indexOf(t) < 0) o.pages.push(t); }
  }));
  return out;
}

module.exports = { autoPages, NAME_OVERRIDES, SLUG_OVERRIDES };
