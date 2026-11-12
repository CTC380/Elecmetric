/* Practice 5 of the RapidTables benchmark: the conversion and reference ecosystem.
   Before this module the links ran one way only: every formula guide linked out to calculators, but no calculator page and only one
   conversion page linked back to a guide. This is the one place that says which guides and converters belong to which calculator.

   Keys are registry calculator ids. They serve both the calculator pages (calculators/<slug>/) and the conversion pages (pages/<slug>.html)
   that are built on the same calculator. GUIDE_FOR_SLUG overrides a single conversion page where its topic differs from its calculator.
   A value is a list of 1 to 5 converter-folder slugs, strongest first. Every slug is checked when this file loads: a typo or a removed
   guide stops the build, so a link cannot go dead. A calculator with no suitable guide is left out on purpose and listed in NO_GUIDE
   rather than given an unrelated one. */

const BY_CALC = {
  /* fundamentals */
  'ohms-law': ['ohms-law-formulas', 'resistor-formulas', 'kirchhoffs-laws'],
  'vipr-solver': ['ohms-law-formulas', 'resistor-formulas'],
  'power-vir': ['ohms-law-formulas', 'ac-circuit-formulas'],
  'power-vi-solver': ['ohms-law-formulas', 'three-phase-power-formulas', 'power-factor-formulas'],
  'ac-ohms-law': ['ac-circuit-formulas', 'resonance-formulas'],
  'complex-number': ['complex-number-formulas', 'ac-circuit-formulas', 'resonance-formulas'],
  'phasor-sum': ['phasor-addition-formulas', 'complex-number-formulas', 'three-phase-power-formulas'],
  'percentage-error': ['percentage-error-formulas', 'measurement-uncertainty-formulas', 'ohms-law-formulas'],
  'quadratic-solver': ['quadratic-log-power-formulas', 'complex-number-formulas', 'resonance-formulas'],
  'logarithm': ['quadratic-log-power-formulas', 'trigonometry-formulas', 'complex-number-formulas'],
  'powers-roots': ['quadratic-log-power-formulas', 'trigonometry-formulas', 'complex-number-formulas'],
  'percentage-calculator': ['percentage-ratio-rounding-formulas', 'percentage-error-formulas', 'measurement-uncertainty-formulas'],
  'ratio-calculator': ['percentage-ratio-rounding-formulas', 'transformer-formulas', 'percentage-error-formulas'],
  'rounding-sig-figs': ['percentage-ratio-rounding-formulas', 'measurement-uncertainty-formulas', 'statistics-formulas'],
  'fraction-calculator': ['percentage-ratio-rounding-formulas', 'resistor-formulas', 'measurement-uncertainty-formulas'],
  'simultaneous-equations': ['kirchhoffs-laws', 'thevenin-norton-formulas', 'quadratic-log-power-formulas'],
  'linear-interpolation': ['loop-4-20ma-formulas', 'measurement-uncertainty-formulas', 'pt100-rtd-formulas'],
  'matrix-calculator': ['kirchhoffs-laws', 'thevenin-norton-formulas', 'complex-number-formulas'],
  'linear-regression': ['statistics-formulas', 'measurement-uncertainty-formulas', 'percentage-error-formulas'],
  'pythagorean-theorem': ['trigonometry-formulas', 'ac-circuit-formulas', 'power-factor-formulas'],
  'triangle-calculator': ['trigonometry-formulas', 'power-factor-formulas', 'complex-number-formulas'],
  'circle-calculator': ['conductor-resistance-formulas', 'cable-sizing-formulas', 'skin-effect-formulas'],
  'area-calculator': ['conduit-fill-formulas', 'cable-tray-fill-formulas', 'conductor-resistance-formulas'],
  'volume-surface-area': ['pneumatic-cylinder-formulas', 'compressor-power-formulas', 'hydraulic-power-formulas'],
  'vector-calculator': ['trigonometry-formulas', 'complex-number-formulas', 'ac-circuit-formulas'],
  'slope-calculator': ['trigonometry-formulas', 'conveyor-belt-power-formulas', 'solar-row-spacing-formulas'],
  'distance-calculator': ['trigonometry-formulas', 'cable-pulling-tension-formulas', 'complex-number-formulas'],
  'probability-calculator': ['probability-formulas', 'statistics-formulas', 'measurement-uncertainty-formulas'],
  'permutations-combinations': ['probability-formulas', 'statistics-formulas', 'percentage-ratio-rounding-formulas'],
  'binomial-distribution': ['probability-formulas', 'statistics-formulas', 'measurement-uncertainty-formulas'],
  'mean-median-mode': ['statistics-formulas', 'percentage-error-formulas', 'measurement-uncertainty-formulas'],
  'standard-deviation': ['statistics-formulas', 'measurement-uncertainty-formulas', 'percentage-error-formulas'],
  'trig-functions': ['trigonometry-formulas', 'power-factor-formulas', 'complex-number-formulas'],
  'resistance-series': ['resistor-formulas', 'ohms-law-formulas', 'resistor-color-code'],
  'resistance-parallel': ['resistor-formulas', 'ohms-law-formulas', 'thevenin-norton-formulas'],
  'capacitance-series-parallel': ['capacitor-formulas', 'parallel-plate-capacitor-formulas', 'capacitor-discharge-formulas'],
  'inductance-series-parallel': ['inductor-formulas', 'solenoid-inductance-formulas'],
  'reactance': ['ac-circuit-formulas', 'capacitor-formulas', 'inductor-formulas'],
  'impedance-rlc': ['ac-circuit-formulas', 'resonance-formulas'],
  'frequency-period': ['ac-circuit-formulas', 'rms-waveform-formulas', 'frequency-converter'],
  'rms-peak': ['rms-waveform-formulas', 'duty-cycle-rms-formulas', 'ac-circuit-formulas'],
  'resonance-lc': ['resonance-formulas', 'ac-circuit-formulas'],
  'lc-energy': ['capacitor-formulas', 'inductor-formulas', 'capacitor-discharge-formulas'],
  'delta-wye': ['delta-star-resistor-formulas', 'star-delta-formulas'],
  'voltage-divider': ['resistor-formulas', 'ohms-law-formulas', 'kirchhoffs-laws'],
  'rc-time-constant': ['rc-filter-formulas', 'capacitor-discharge-formulas'],

  /* power, three-phase and power factor */
  'three-phase-power': ['three-phase-power-formulas', 'power-factor-formulas', 'two-wattmeter-formulas'],
  'three-phase-current': ['three-phase-power-formulas', 'power-factor-formulas', 'ac-circuit-formulas'],
  'amps-to-kw': ['three-phase-power-formulas', 'power-factor-formulas', 'ac-circuit-formulas'],
  'amps-to-watts': ['three-phase-power-formulas', 'power-factor-formulas', 'ac-circuit-formulas'],
  'watts-to-amps': ['three-phase-power-formulas', 'power-factor-formulas', 'ac-circuit-formulas'],
  'amps-to-kva': ['three-phase-power-formulas', 'power-factor-formulas'],
  'kva-to-amps': ['three-phase-power-formulas', 'transformer-formulas'],
  'kva-to-kw': ['power-factor-formulas', 'three-phase-power-formulas'],
  'kw-to-kva': ['power-factor-formulas', 'three-phase-power-formulas'],
  'power-factor': ['power-factor-formulas', 'pf-correction-payback-formulas'],
  'pf-correction-kvar': ['power-factor-formulas', 'pf-correction-payback-formulas', 'harmonic-filter-formulas', 'capacitor-switching-inrush-formulas', 'detuning-reactor-formulas'],
  'pf-capacitor-uf': ['power-factor-formulas', 'pf-correction-payback-formulas', 'capacitor-formulas'],
  'line-phase': ['three-phase-power-formulas', 'star-delta-formulas'],
  'harmonic-thd': ['harmonics-formulas', 'harmonic-filter-formulas', 'rms-waveform-formulas', 'detuning-reactor-formulas'],
  'neutral-current-unbalance': ['unbalance-formulas', 'harmonics-formulas'],
  'voltage-unbalance': ['unbalance-formulas', 'motor-formulas'],
  'maximum-demand': ['demand-load-factor-formulas', 'energy-meter-multiplier-formulas'],

  /* energy, batteries, units */
  'power-energy-time': ['energy-cost-formulas', 'energy-converter', 'electrical-unit-converter'],
  'kwh-to-kw': ['energy-cost-formulas', 'energy-converter', 'electrical-unit-converter'],
  'energy-voltage-charge': ['capacitor-formulas', 'coulombs-law', 'energy-converter'],
  'energy-cost': ['energy-cost-formulas', 'energy-meter-multiplier-formulas'],
  'electricity-bill-slabs': ['energy-cost-formulas', 'energy-meter-multiplier-formulas'],
  'battery-mah-wh': ['battery-capacity-converter', 'battery-formulas', 'battery-pack-formulas'],
  'battery-series-parallel': ['battery-pack-formulas', 'battery-formulas', 'battery-internal-resistance-formulas'],
  'battery-bank-size': ['battery-formulas', 'battery-pack-formulas', 'peukert-formulas', 'battery-c-rate-formulas', 'supercapacitor-formulas'],
  'battery-charge-time': ['battery-charge-time-formulas', 'battery-formulas', 'peukert-formulas', 'battery-c-rate-formulas', 'battery-storage-efficiency-formulas'],
  'ups-runtime': ['ups-formulas', 'holdup-time-formulas', 'peukert-formulas', 'supercapacitor-formulas'],
  'ev-charge-time': ['ev-charging-time-formulas', 'battery-charge-time-formulas'],
  'hp-kw-converter': ['hp-to-kw', 'kw-to-hp', 'motor-formulas'],
  'power-converter': ['power-converter', 'hp-to-kw', 'electrical-unit-converter'],
  'energy-converter': ['energy-converter', 'joules-to-kwh', 'electrical-unit-converter'],
  'decibel': ['db-converter', 'dbm-converter', 'sound-level-formulas'],
  'wire-gauge-conversion': ['wire-gauge-converter', 'conductor-resistance-formulas'],
  'swg-wire': ['wire-gauge-converter', 'conductor-resistance-formulas'],

  /* cables */
  'voltage-drop': ['voltage-drop-formulas', 'conductor-resistance-formulas', 'cable-sizing-formulas'],
  'dc-voltage-drop': ['voltage-drop-formulas', 'dc-lighting-voltage-drop-formulas', 'conductor-resistance-formulas'],
  'ac-voltage-drop': ['voltage-drop-formulas', 'ac-circuit-formulas', 'conductor-resistance-formulas'],
  'cable-size-vd': ['cable-sizing-formulas', 'voltage-drop-formulas', 'circuit-breaker-formulas'],
  'cable-resistance': ['conductor-resistance-formulas', 'skin-effect-formulas', 'cable-loss-formulas'],
  'max-cable-length': ['voltage-drop-formulas', 'cable-sizing-formulas'],
  'cable-derating': ['cable-sizing-formulas', 'cable-loss-formulas', 'busbar-temperature-rise-formulas'],
  'cable-sc-withstand': ['cable-it-withstand-formulas', 'short-circuit-formulas', 'fusing-current-formulas', 'conductor-force-formulas'],
  'cable-power-loss': ['cable-loss-formulas', 'conductor-resistance-formulas', 'voltage-drop-formulas', 'sheath-current-formulas', 'cable-charging-current-formulas'],
  'conductor-temp-resistance': ['conductor-resistance-formulas', 'cable-loss-formulas'],
  'copper-vs-aluminium': ['conductor-resistance-formulas', 'cable-sizing-formulas'],
  'parallel-cable-sets': ['cable-sizing-formulas', 'conductor-resistance-formulas'],
  'conduit-fill': ['conduit-fill-formulas', 'cable-tray-fill-formulas', 'cable-pulling-tension-formulas'],
  'ir-temp-correction': ['insulation-resistance-formulas'],
  'insulation-pi-dar': ['insulation-resistance-formulas'],

  /* protection, faults, earthing */
  'breaker-size': ['circuit-breaker-formulas', 'cable-sizing-formulas', 'short-circuit-formulas', 'overcurrent-relay-formulas', 'ct-burden-formulas'],
  'fault-current': ['short-circuit-formulas', 'transformer-through-fault-formulas', 'per-unit-formulas', 'differential-protection-formulas'],
  'fault-mva': ['short-circuit-formulas', 'per-unit-formulas', 'transformer-through-fault-formulas'],
  'fault-types': ['short-circuit-formulas', 'fault-loop-rcd-formulas'],
  'per-unit-base': ['per-unit-formulas', 'short-circuit-formulas'],
  'per-unit-convert': ['per-unit-formulas', 'short-circuit-formulas'],
  'fault-loop-impedance': ['fault-loop-rcd-formulas', 'earthing-formulas'],
  'ngr-sizing': ['neutral-earthing-resistor-formulas', 'earthing-formulas', 'short-circuit-formulas'],
  'earth-rod-resistance': ['earthing-formulas', 'earth-electrode-spacing-formulas'],
  'earth-rods-parallel': ['earthing-formulas', 'earth-electrode-spacing-formulas'],
  'earth-grid-resistance': ['earthing-formulas', 'step-touch-voltage-formulas', 'lightning-protection-formulas'],

  /* motors */
  'motor-current': ['motor-formulas', 'motor-efficiency-formulas', 'motor-code-letter-formulas', 'inverter-motor-cable-formulas'],
  'motor-power-output': ['motor-efficiency-formulas', 'motor-formulas', 'motor-temperature-rise-formulas'],
  'motor-torque': ['motor-formulas', 'synchronous-speed-formulas', 'gear-drive-formulas', 'hoist-power-formulas', 'conveyor-belt-power-formulas'],
  'motor-slip': ['synchronous-speed-formulas', 'motor-formulas'],
  'motor-starting': ['motor-starting-formulas', 'soft-starter-vfd-formulas', 'star-delta-formulas', 'motor-acceleration-time-formulas', 'contactor-sizing-formulas'],
  'star-delta-starting': ['star-delta-formulas', 'motor-starting-formulas', 'soft-starter-vfd-formulas'],
  'motor-start-dip': ['motor-start-voltage-dip-formulas', 'voltage-change-formulas', 'motor-starting-formulas'],
  'pump-motor-power': ['pump-formulas', 'hydraulic-power-formulas', 'motor-efficiency-formulas', 'compressor-power-formulas'],
  'fan-pump-affinity': ['fan-formulas', 'pump-formulas'],

  /* transformers and generators */
  'transformer-current': ['transformer-formulas', 'transformer-through-fault-formulas', 'transformer-emf-formulas', 'transformer-vector-group-formulas'],
  'transformer-regulation': ['transformer-formulas', 'tap-changer-formulas', 'voltage-change-formulas'],
  'transformer-efficiency': ['transformer-efficiency-formulas', 'transformer-loss-of-life-formulas', 'transformer-cooling-rating-formulas'],
  'transformer-sizing': ['transformer-formulas', 'parallel-transformer-formulas', 'transformer-cooling-rating-formulas', 'transformer-inrush-formulas', 'transformer-vector-group-formulas'],
  'transformer-loading': ['transformer-formulas', 'transformer-loss-of-life-formulas'],
  'generator-kva': ['generator-formulas', 'generator-droop-formulas', 'motor-starting-formulas'],
  'generator-fuel': ['generator-formulas', 'generator-droop-formulas', 'load-bank-test-formulas'],

  /* lighting */
  'lumen-method': ['lighting-formulas', 'point-illuminance-formulas', 'illumination-converter'],
  'lumens-lux-area': ['lighting-formulas', 'point-illuminance-formulas', 'illumination-converter'],
  'candela-lux-distance': ['point-illuminance-formulas', 'lighting-formulas', 'illumination-converter'],
  'candela-lumens-beam': ['lighting-formulas', 'point-illuminance-formulas'],
  'millicandela-lumens-beam': ['lighting-formulas', 'led-formulas'],
  'lumens-watts': ['lighting-formulas', 'led-formulas'],
  'lux-to-watts': ['lighting-formulas', 'point-illuminance-formulas'],
  'watts-to-lux': ['lighting-formulas', 'point-illuminance-formulas'],
  'led-retrofit-payback': ['energy-cost-formulas', 'lighting-formulas', 'led-formulas'],
  'led-resistor': ['led-formulas', 'resistor-formulas'],
  'agl-light-intensity-distance': ['point-illuminance-formulas', 'lighting-formulas'],
  'agl-ccr-loading': ['agl-series-circuit-load-formulas', 'agl-max-fittings-formulas', 'agl-brightness-step-formulas'],
  'agl-max-fittings': ['agl-max-fittings-formulas', 'agl-series-circuit-load-formulas', 'cable-loss-formulas'],
  'agl-isolating-transformer': ['agl-isolating-transformer-formulas', 'transformer-formulas', 'transformer-efficiency-formulas'],
  'agl-ccr-input-energy': ['agl-ccr-input-energy-formulas', 'power-factor-formulas', 'energy-cost-formulas'],
  'agl-brightness-steps': ['agl-brightness-step-formulas', 'agl-series-circuit-load-formulas', 'agl-ccr-input-energy-formulas'],
  'agl-lamp-life-curve': ['agl-lamp-life-formulas', 'agl-brightness-step-formulas'],
  'agl-cable-loop-loss': ['cable-loss-formulas', 'agl-series-circuit-load-formulas', 'conductor-resistance-formulas'],
  'agl-cable-size-loss': ['cable-loss-formulas', 'agl-series-circuit-load-formulas', 'conductor-resistance-formulas'],
  'agl-lamp-failure-load': ['agl-series-circuit-load-formulas', 'agl-isolating-transformer-formulas', 'agl-max-fittings-formulas'],

  /* renewables, thermal, facilities */
  'pv-energy': ['solar-pv-formulas', 'solar-yield-degradation-formulas', 'solar-panel-temperature-formulas'],
  'pv-string-size': ['solar-pv-formulas', 'solar-panel-temperature-formulas'],
  'pv-array-size': ['solar-pv-formulas', 'solar-dc-ac-ratio-formulas', 'solar-yield-degradation-formulas', 'charge-controller-formulas', 'solar-row-spacing-formulas'],
  'wind-power': ['wind-turbine-power-formulas'],
  'water-heater-kw': ['heating-formulas', 'specific-heat-converter', 'energy-cost-formulas', 'heat-pump-cop-formulas'],
  'pue': ['cooling-formulas', 'energy-cost-formulas'],
  'rack-cooling': ['cooling-formulas', 'fan-formulas'],
  'heatsink-thermal': ['heat-sink-formulas', 'thermal-time-constant-formulas', 'mosfet-loss-formulas'],

  /* electronics and instrumentation */
  'op-amp-gain': ['op-amp-formulas'],
  'zener-regulator': ['zener-regulator-formulas', 'linear-regulator-formulas'],
  'bjt-base-resistor': ['bjt-bias-formulas'],
  'timer-555': ['555-timer-formulas'],
  'rc-filter-cutoff': ['rc-filter-formulas'],
  'current-loop-4-20': ['loop-4-20ma-formulas', 'current-shunt-formulas', 'adc-resolution-formulas'],
  'rtd-pt100': ['pt100-rtd-formulas', 'thermistor-formulas', 'thermocouple-formulas', 'wheatstone-bridge-formulas']
};

/* One conversion page whose topic differs from the calculator it is built on. */
const GUIDE_FOR_SLUG = {
  'hp-to-amps': ['motor-formulas', 'motor-efficiency-formulas', 'hp-to-kw'],
  'amps-to-hp': ['motor-formulas', 'motor-efficiency-formulas', 'kw-to-hp'],
  'amps-to-volts': ['ohms-law-formulas', 'three-phase-power-formulas'],
  'volts-to-amps': ['ohms-law-formulas', 'three-phase-power-formulas'],
  'kw-to-volts': ['ohms-law-formulas', 'three-phase-power-formulas'],
  'volts-to-kw': ['ohms-law-formulas', 'three-phase-power-formulas'],
  'joules-to-watts': ['energy-converter', 'joules-to-kwh', 'energy-cost-formulas'],
  'watts-to-joules': ['energy-converter', 'joules-to-kwh', 'energy-cost-formulas'],
  'kw-to-joules': ['energy-converter', 'joules-to-kwh', 'energy-cost-formulas'],
  'joules-to-kw': ['energy-converter', 'joules-to-kwh', 'energy-cost-formulas'],
  'kj-to-watts': ['energy-converter', 'joules-to-kj', 'kj-to-joules'],
  'watts-to-kj': ['energy-converter', 'joules-to-kj', 'kj-to-joules'],
  'kw-to-kj': ['energy-converter', 'joules-to-kj', 'kj-to-joules'],
  'kj-to-kw': ['energy-converter', 'joules-to-kj', 'kj-to-joules'],
  'kva-to-va': ['power-factor-formulas', 'electrical-unit-converter'],
  'va-to-kva': ['power-factor-formulas', 'electrical-unit-converter'],
  'ah-to-wh': ['battery-capacity-converter', 'ah-to-mah', 'battery-pack-formulas'],
  'wh-to-ah': ['battery-capacity-converter', 'ah-to-mah', 'battery-pack-formulas'],
  'ah-to-kwh': ['battery-capacity-converter', 'battery-formulas', 'battery-pack-formulas'],
  'kwh-to-ah': ['battery-capacity-converter', 'battery-formulas', 'battery-pack-formulas']
};

/* Calculators that deliberately have no guide, with the reason. A test checks that every calculator is in BY_CALC or here. */
const NO_GUIDE = {};

/* Titles and one-line purposes for guides that are not formula articles (converters and reference pages). */
const EXTRA = {
  'energy-converter': ['Energy Converter', 'J, kJ, Wh, kWh, BTU and more'],
  'hp-to-kw': ['HP to kW Converter', 'mechanical horsepower to kilowatts'],
  'kw-to-hp': ['kW to HP Converter', 'kilowatts to mechanical horsepower'],
  'db-converter': ['dB to Ratio Converter', 'decibels to power and voltage ratios'],
  'dbm-converter': ['dBm to Watts Converter', 'dBm to mW and watts'],
  'wire-gauge-converter': ['AWG and SWG Wire Gauge Converter', 'gauge numbers, diameters and areas'],
  'illumination-converter': ['Illuminance and Luminance Converter', 'lux, foot-candles and related units'],
  'battery-capacity-converter': ['Battery Capacity Converter', 'mAh, Ah, kAh, Wh and kWh'],
  'electrical-unit-converter': ['Electrical Unit Converter', 'voltage, current, power and energy units'],
  'kirchhoffs-laws': ['Kirchhoff’s Current and Voltage Laws', 'the two circuit laws with worked examples'],
  'ohms-law-formulas': ['Ohm’s Law Formulas and Power Wheel', 'all twelve V, I, R and P formulas'],
  'resistor-color-code': ['Resistor Color Code Calculator', 'read a resistor from its bands'],
  'coulombs-law': ['Coulomb’s Law Calculator', 'force between two charges'],
  'joules-to-kj': ['J to kJ Converter', 'joules to kilojoules'],
  'joules-to-kwh': ['J to kWh Converter', 'joules to kilowatt-hours'],
  'kj-to-joules': ['kJ to J Converter', 'kilojoules to joules'],
  'frequency-converter': ['Frequency Converter', 'Hz, kHz, MHz and GHz'],
  'power-converter': ['Power Converter', 'W, kW, MW, HP and BTU/h'],
  'specific-heat-converter': ['Specific Heat Converter', 'J/kg·K, kJ/kg·K and BTU/lb·°F'],
  'ah-to-mah': ['Ah to mAh Converter', 'amp-hours to milliamp-hours']
};

function guideInfo(E, articleList) {
  const art = {};
  articleList.forEach((a) => { art[a.slug] = { title: a.h1, blurb: a.desc }; });
  const info = (slug) => {
    if (art[slug]) return art[slug];
    if (EXTRA[slug]) return { title: EXTRA[slug][0], blurb: EXTRA[slug][1] };
    throw new Error('calc_articles.js: unknown guide ' + slug);
  };
  const all = [];
  Object.keys(BY_CALC).forEach((id) => {
    if (!E.BY_ID[id]) throw new Error('calc_articles.js: unknown calculator ' + id);
    if (BY_CALC[id].length < 1 || BY_CALC[id].length > 5) throw new Error('calc_articles.js: ' + id + ' must list 1 to 5 guides');
    if (new Set(BY_CALC[id]).size !== BY_CALC[id].length) throw new Error('calc_articles.js: ' + id + ' lists a guide twice');
    BY_CALC[id].forEach((s) => { info(s); all.push(s); });
  });
  Object.keys(GUIDE_FOR_SLUG).forEach((k) => GUIDE_FOR_SLUG[k].forEach((s) => { info(s); all.push(s); }));
  Object.keys(NO_GUIDE).forEach((id) => { if (!E.BY_ID[id]) throw new Error('calc_articles.js: unknown calculator ' + id); });
  E.CALCS.forEach((c) => { if (!BY_CALC[c.id] && !NO_GUIDE[c.id]) throw new Error('calc_articles.js: ' + c.id + ' has no guide and is not in NO_GUIDE'); });
  return {
    info,
    forCalc: (id) => BY_CALC[id] || [],
    forSlug: (slug, id) => GUIDE_FOR_SLUG[slug] || BY_CALC[id] || [],
    used: Array.from(new Set(all))
  };
}

module.exports = { guideInfo, BY_CALC, GUIDE_FOR_SLUG, NO_GUIDE, EXTRA };
