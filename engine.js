/* Elecmetric calculation engine. Pure functions, no DOM. Used by index.html in the browser and by tests/run_tests.js in Node. */
(function (root) {
'use strict';
const SQ3 = Math.sqrt(3);
const VERSION = '1.73.10';
/* Exact definitions (v1.8.2). Earlier versions rounded these: HP by 5.6e-10, BTU by 2.5e-9 and CFM by 1.4e-8, relative.
   Mechanical horsepower = 550 ft·lbf/s; International Table BTU = 1055.05585262 J; CFM = 0.3048³ / 60 m³/s. */
const HP_W = 550 * 0.3048 * 0.45359237 * 9.80665, BTU_J = 1055.05585262, CFM_M3S = 0.3048 * 0.3048 * 0.3048 / 60;

/* ---------- Unit engine: every dimension has an SI base; conversion happens at the edges only ---------- */
const UNITS = {
  power:      { base: 'W',   units: { 'µW': 1e-6, mW: 1e-3, W: 1, kW: 1e3, MW: 1e6, HP: HP_W, PS: 735.49875, 'BTU/h': BTU_J / 3600, TR: 12000 * BTU_J / 3600 } },
  apparent:   { base: 'VA',  units: { VA: 1, kVA: 1e3, MVA: 1e6 } },
  reactive:   { base: 'VAR', units: { VAR: 1, kVAR: 1e3, MVAR: 1e6 } },
  voltage:    { base: 'V',   units: { 'µV': 1e-6, mV: 1e-3, V: 1, kV: 1e3, MV: 1e6 } },
  current:    { base: 'A',   units: { 'µA': 1e-6, mA: 1e-3, A: 1, kA: 1e3, MA: 1e6 } },
  resistance: { base: 'Ω',   units: { 'mΩ': 1e-3, 'Ω': 1, 'kΩ': 1e3, 'MΩ': 1e6, 'GΩ': 1e9 } },
  resistivity:{ base: 'Ω·m', units: { 'Ω·m': 1, 'Ω·cm': 0.01 } },
  volume:     { base: 'm³',  units: { L: 1e-3, 'm³': 1, gal: 3.785411784e-3 } },
  flow:       { base: 'm³/s', units: { 'L/s': 1e-3, 'm³/h': 1 / 3600, 'm³/s': 1, CFM: CFM_M3S } },
  length:     { base: 'm',   units: { mm: 1e-3, cm: 0.01, m: 1, km: 1e3, in: 0.0254, ft: 0.3048, yd: 0.9144 } },
  resPerLen:  { base: 'Ω/m', units: { 'Ω/km': 1e-3, 'mΩ/m': 1e-3, 'Ω/m': 1 } },
  frequency:  { base: 'Hz',  units: { Hz: 1, kHz: 1e3, MHz: 1e6 } },
  capacitance:{ base: 'F',   units: { pF: 1e-12, nF: 1e-9, 'µF': 1e-6, F: 1 } },
  inductance: { base: 'H',   units: { 'µH': 1e-6, mH: 1e-3, H: 1 } },
  time:       { base: 's',   units: { 'µs': 1e-6, ms: 1e-3, s: 1, min: 60, h: 3600 } },
  speed:      { base: 'rpm', units: { rpm: 1 } },
  velocity:   { base: 'm/s', units: { 'm/s': 1, 'km/h': 1 / 3.6, mph: 0.44704, kn: 0.514444444 } },
  torque:     { base: 'N·m', units: { 'N·m': 1, 'kN·m': 1e3 } },
  coulomb:    { base: 'C',   units: { nC: 1e-9, 'µC': 1e-6, mC: 1e-3, C: 1, e: 1.602176634e-19 } },
  charge:     { base: 'Ah',  units: { mAh: 1e-3, Ah: 1, kAh: 1e3 } },
  area:       { base: 'm²',  units: { 'mm²': 1e-6, 'cm²': 1e-4, 'm²': 1 } },
  energy:     { base: 'Wh',  units: { 'µJ': 1e-6 / 3600, mJ: 1e-3 / 3600, J: 1 / 3600, kJ: 1000 / 3600, MJ: 1e6 / 3600, kcal: 4186.8 / 3600, BTU: BTU_J / 3600, Wh: 1, kWh: 1e3, MWh: 1e6, eV: 1.602176634e-19 / 3600, keV: 1.602176634e-16 / 3600, MeV: 1.602176634e-13 / 3600 } },
  number:     { base: '',    units: { '': 1 } }
};
const FACTOR = {};
for (const d in UNITS) for (const u in UNITS[d].units) FACTOR[u] = UNITS[d].units[u];

/* Conversion Centre quantities (v1.7.0). These extend the unit table for the converters only: calculators keep using UNITS,
   so their unit lists do not change. Where a quantity already exists in UNITS, the shared units are copied from it, so each factor has one source.
   Every factor is written from its SI or customary definition. CFM is the exact value (0.3048³/60 m³/s), shared with the calculators from v1.8.2. */
const _u = (d, extra) => Object.assign({}, UNITS[d].units, extra);
const CONV_UNITS = {
  /* v1.11.0: unit gaps found in the RapidTables comparison. Added to the converters only; calculators keep their own unit lists.
     BHP is brake horsepower, which in the imperial system is the same mechanical horsepower as HP. Ah and coulomb join one table: 1 Ah = 3600 C.
     The calorie is the International Table calorie, 4.1868 J. */
  frequency: { base: 'Hz', units: _u('frequency', { GHz: 1e9, THz: 1e12, 'rad/s': 1 / (2 * Math.PI) }) },
  voltage: { base: 'V', units: _u('voltage', { GV: 1e9 }) },
  power: { base: 'W', units: _u('power', { GW: 1e9, BHP: HP_W }) },
  charge: { base: 'Ah', units: _u('charge', { C: 1 / 3600, mC: 1e-3 / 3600, kC: 1e3 / 3600 }) },
  energy: { base: 'Wh', units: _u('energy', { cal: 4.1868 / 3600, GeV: 1.602176634e-10 / 3600 }) },
  length: { base: 'm', units: _u('length', { nm: 1e-9, 'µm': 1e-6, mil: 2.54e-5, mi: 1609.344, nmi: 1852 }) },
  area: { base: 'm²', units: _u('area', { ha: 1e4, 'km²': 1e6, 'in²': 0.0254 * 0.0254, 'ft²': 0.3048 * 0.3048, 'yd²': 0.9144 * 0.9144, acre: 4046.8564224, 'mi²': 1609.344 * 1609.344, cmil: Math.PI / 4 * 2.54e-5 * 2.54e-5 }) },
  volume: { base: 'm³', units: _u('volume', { mL: 1e-6, 'cm³': 1e-6, 'in³': 0.0254 * 0.0254 * 0.0254, 'ft³': 0.3048 * 0.3048 * 0.3048, qt: 3.785411784e-3 / 4, galUK: 4.54609e-3 }) },
  mass: { base: 'kg', units: { 'µg': 1e-9, mg: 1e-6, g: 1e-3, kg: 1, t: 1e3, oz: 0.45359237 / 16, lb: 0.45359237, tn: 907.18474 } },
  force: { base: 'N', units: { mN: 1e-3, N: 1, kN: 1e3, MN: 1e6, kgf: 9.80665, lbf: 0.45359237 * 9.80665, dyn: 1e-5 } },
  torque: { base: 'N·m', units: _u('torque', { 'mN·m': 1e-3, 'kgf·m': 9.80665, 'lbf·ft': 0.45359237 * 9.80665 * 0.3048, 'lbf·in': 0.45359237 * 9.80665 * 0.0254, 'ozf·in': 0.45359237 * 9.80665 / 16 * 0.0254 }) },
  pressure: { base: 'Pa', units: { Pa: 1, hPa: 100, kPa: 1e3, MPa: 1e6, mbar: 100, bar: 1e5, atm: 101325, psi: 0.45359237 * 9.80665 / (0.0254 * 0.0254), mmHg: 133.322387415, inHg: 25.4 * 133.322387415, torr: 101325 / 760, 'kgf/cm²': 9.80665 / 1e-4, mH2O: 9806.65 } },
  flow: { base: 'm³/s', units: _u('flow', { CFM: CFM_M3S, 'L/min': 1e-3 / 60, 'm³/min': 1 / 60, GPM: 3.785411784e-3 / 60 }) },
  bfield: { base: 'T', units: { nT: 1e-9, 'µT': 1e-6, mG: 1e-7, mT: 1e-3, G: 1e-4, T: 1 } },
  illuminance: { base: 'lx', units: { lx: 1, klx: 1e3, fc: 1 / (0.3048 * 0.3048), phot: 1e4 } },
  luminance: { base: 'cd/m²', units: { 'cd/m²': 1, 'kcd/m²': 1e3, 'cd/ft²': 1 / (0.3048 * 0.3048), fL: 1 / (Math.PI * 0.3048 * 0.3048), sb: 1e4 } },
  intensity: { base: 'cd', units: { mcd: 1e-3, cd: 1, kcd: 1e3 } },
  density: { base: 'kg/m³', units: { 'g/L': 1, 'kg/m³': 1, 'kg/L': 1e3, 'g/cm³': 1e3, 'lb/ft³': 0.45359237 / (0.3048 * 0.3048 * 0.3048), 'lb/in³': 0.45359237 / (0.0254 * 0.0254 * 0.0254), 'lb/gal': 0.45359237 / 3.785411784e-3 } },
  rotation: { base: 'rpm', units: { rpm: 1, 'rev/s': 60, 'rad/s': 60 / (2 * Math.PI), '°/s': 1 / 6 } },
  thermcond: { base: 'W/(m·K)', units: { 'W/(m·K)': 1, 'kcal/(h·m·°C)': 4186.8 / 3600, 'BTU/(h·ft·°F)': 1055.05585262 / (3600 * 0.3048 * 5 / 9) } },
  /* Temperature differences (v1.8.0) are intervals, not points on a scale: no offset applies, only the size of the degree. */
  tempdiff: { base: 'ΔK', units: { 'ΔK': 1, 'Δ°C': 1, 'Δ°F': 5 / 9, 'Δ°R': 5 / 9 } },
  /* Specific heat capacity (v1.8.0): the International Table calorie is 4.1868 J and the BTU is 1055.05585262 J, so 1 BTU/(lb·°F) is exactly 4186.8 J/(kg·K). */
  specheat: { base: 'J/(kg·K)', units: { 'J/(kg·K)': 1, 'kJ/(kg·K)': 1e3, 'J/(g·K)': 1e3, 'cal/(g·°C)': 4186.8, 'kcal/(kg·°C)': 4186.8, 'BTU/(lb·°F)': 1055.05585262 / (0.45359237 * 5 / 9) } },
  /* v1.11.0: plane angle (base radian) and dimensionless ratios (base 1). Both are pure factor tables.
     Degree = pi/180 rad, gradian = pi/200 rad, arcminute = 1/60 degree, arcsecond = 1/3600 degree, turn = 2 pi rad. */
  angle: { base: 'rad', units: { mrad: 1e-3, rad: 1, deg: Math.PI / 180, arcmin: Math.PI / 10800, arcsec: Math.PI / 648000, grad: Math.PI / 200, turn: 2 * Math.PI } },
  ratio: { base: 'ratio', units: { ratio: 1, '%': 1e-2, '‰': 1e-3, ppm: 1e-6, ppb: 1e-9 } },
  /* Temperature has offsets, so it is not a table of factors. Each scale converts to and from kelvin. */
  temperature: { base: 'K', affine: {
    K: { to: (x) => x, from: (k) => k }, '°C': { to: (x) => x + 273.15, from: (k) => k - 273.15 },
    '°F': { to: (x) => (x + 459.67) * 5 / 9, from: (k) => k * 9 / 5 - 459.67 }, '°R': { to: (x) => x * 5 / 9, from: (k) => k * 9 / 5 } } }
};
const unitsOf = (dim) => { const d = CONV_UNITS[dim] || UNITS[dim]; return d.affine ? Object.keys(d.affine) : Object.keys(d.units); };
/* One conversion for the converters: a table quantity multiplies by the ratio of its factors, temperature goes through kelvin. */
function convertUnits(dim, x, a, b) {
  const d = CONV_UNITS[dim] || UNITS[dim];
  if (d.affine) return d.affine[b].from(d.affine[a].to(x));
  return x * d.units[a] / d.units[b];
}

/* Digit grouping for displayed numbers: 'intl' = 1,234,567  |  'indian' = 12,34,567.
   The decimal separator is always a point, so a copied result can be pasted back into an input. */
let GROUPING = 'indian';
function setGrouping(g) { GROUPING = g === 'intl' ? 'intl' : 'indian'; }
function getGrouping() { return GROUPING; }
function detectGrouping(lang) { return /^(en-IN|hi|bn|ta|te|mr|gu|kn|ml|pa|ur)(-|$)/i.test(lang || '') ? 'indian' : 'intl'; }
const loc = () => (GROUPING === 'intl' ? 'en-US' : 'en-IN');
function fmt(x, p) {
  if (p == null) p = 2;
  if (!isFinite(x)) return '—';
  if (x !== 0 && (Math.abs(x) < 1e-6 || Math.abs(x) >= 1e15)) return x.toExponential(3).replace('e+', 'e');
  if (x !== 0 && Math.abs(x) < Math.pow(10, -p) / 2) return Number(x.toPrecision(2)).toLocaleString(loc(), { maximumSignificantDigits: 2 });
  return Number(x.toFixed(p)).toLocaleString(loc(), { maximumFractionDigits: p });
}

/* F6: strict number reader for typed input. Returns { v } or { err }. */
function readNumber(raw) {
  if (typeof raw === 'number') return isFinite(raw) ? { v: raw } : { err: 'must be a finite number' };
  if (typeof raw !== 'string') return { err: 'must be a number' };
  let t = raw.trim();
  if (t === '') return { empty: true };
  if (/^[+-]?0[xbo]/i.test(t)) return { err: 'must be a decimal number (hexadecimal, binary and octal are not accepted)' };
  t = t.replace(/[\u2009\u00a0 ]/g, '');
  if (/^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(t) || /^[+-]?\d{1,2}(,\d{2})*,\d{3}(\.\d+)?$/.test(t)) t = t.replace(/,/g, '');
  else if (/,/.test(t)) return { err: 'must be a number. Use a decimal point (1.5), not a comma. Thousands separators are only accepted in the form 1,000 or 1,00,000' };
  if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t)) return { err: 'must be a number' };
  const n = Number(t);
  return isFinite(n) ? { v: n } : { err: 'must be a finite number' };
}
const q = (v, u, p) => fmt(v / FACTOR[u], p == null ? 2 : p) + (u ? ' ' + u : '');

function I(key, label, dim, unit, def, o) {
  return Object.assign({ key, label, dim, unit, def }, o || {});
}
const PARALLEL_N = { key: 'n', label: 'Conductors per phase in parallel', type: 'enum', options: [1, 2, 3, 4, 5, 6, 7, 8, 9], def: 1, mode: 'engineering', labels: { 1: 'One (single set)', 2: '2 in parallel', 3: '3 in parallel', 4: '4 in parallel', 5: '5 in parallel', 6: '6 in parallel', 7: '7 in parallel', 8: '8 in parallel', 9: '9 in parallel' } };
const PHASE = { key: 'phase', label: 'Phase', type: 'enum', options: [3, 1], def: 3, mode: 'engineering', labels: { 3: 'Three-phase', 1: 'Single-phase' } };
const PHASE_ALL = (def) => ({ key: 'phase', label: 'Current type', type: 'enum', options: [3, 1, 0], def, labels: { 3: 'Three-phase AC', 1: 'Single-phase AC', 0: 'DC' } });
const VTYPE = { key: 'vt', label: 'Voltage type (three-phase only)', type: 'enum', options: [0, 1], def: 0, mode: 'engineering', labels: { 0: 'Line-to-line (L-L)', 1: 'Line-to-neutral (L-N)' } };
const VHINT = 'Line-to-line for three-phase unless the voltage type is line-to-neutral; the supply voltage for single-phase AC and DC';
/* Circuit factor shared by the amps / kW / kVA family: DC k = 1 and PF = 1; single-phase k = 1; three-phase k = √3 (L-L) or 3 (L-N) */
function circ(i) {
  if (i.phase === 0) return { k: 1, kt: '', pf: 1, name: 'DC', dc: true };
  if (i.phase === 1) return { k: 1, kt: '', pf: i.pf, name: 'single-phase' };
  return i.vt === 1 ? { k: 3, kt: '3 × ', pf: i.pf, name: 'three-phase, line-to-neutral' } : { k: SQ3, kt: '√3 × ', pf: i.pf, name: 'three-phase' };
}
const PF = (def) => I('pf', 'Power factor', 'number', '', def, { min: 0, max: 1, exMin: true, hint: 'Rough starting point only. Resistive heating and incandescent loads are 1.0; a fully loaded induction motor is typically 0.8 to 0.88 and falls sharply when lightly loaded; discharge lighting depends on its ballast or driver. For real work use the nameplate or a measured value.' });
const kf = (ph) => (ph === 3 ? SQ3 : 1);

const NB = (key, label, def, opts) => I(key, label, 'number', '', def, opts);
/* F3: indicative running wattages for the appliance picker. Typical figures only; a nameplate or a meter reading always wins. */
const APPLIANCES = [
  ['LED bulb', 9], ['LED tube light', 18], ['Ceiling fan', 75], ['Table fan', 50], ['Air cooler', 150], ['Refrigerator (average running)', 150], ['LED TV (32 to 43 in)', 60],
  ['Laptop', 60], ['Desktop computer', 200], ['Wi-Fi router', 10], ['Washing machine', 500], ['Mixer grinder', 500], ['Microwave oven', 1200], ['Induction cooktop', 1800],
  ['Electric kettle', 1500], ['Iron', 1000], ['Water heater / geyser', 2000], ['Room heater', 1500], ['Air conditioner, 1.5 TR (running)', 1500], ['Water pump, 0.5 HP', 550]
].map((a) => ({ name: a[0], W: a[1] }));
const CURRENCY = { 0: '', 1: '₹', 2: '$', 3: '€', 4: '£' };
const PERIOD_DAYS = { 0: 1, 1: 7, 2: 365 / 12 }, PERIOD_MAX = { 0: 24, 1: 168, 2: 744 }, PERIOD_NAME = { 0: 'a day', 1: 'a week', 2: 'a month' };
/* ---------- Calculator registry: each calculator is a definition plus a pure compute function ---------- */
const STD_AREAS = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630];
const RATINGS = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 320, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000];
/* Calculation basis layer: each basis sets the method constants and the protection rule. No standard tables are embedded. */
const BASES = {
  1: { name: 'General / IEC-style', tc: { 1: 70, 2: 90 }, cf: 1, rule: 'Ib ≤ In ≤ Iz', tref: 30 },
  2: { name: 'NEC-style', tc: { 1: 75, 2: 90 }, cf: 1.25, rule: '1.25 × Ib ≤ In ≤ Iz (continuous load)', tref: 30 },
  3: { name: 'User-defined' },
  /* Method constants only. Rating tables stay user-supplied. Confirm every constant against the edition you design to. */
  4: { name: 'IS (India)', short: 'IS', tc: { 1: 70, 2: 90 }, cf: 1, rule: 'Ib ≤ In ≤ Iz', tref: 40, tnote: 'Indian cable ratings are commonly tabulated for 40 °C air' },
  5: { name: 'BS 7671 (UK)', short: 'BS 7671', tc: { 1: 70, 2: 90 }, cf: 1, rule: 'Ib ≤ In ≤ Iz', tref: 30, vdMax: 5, vdLight: 3, vdRef: 'BS 7671 Appendix 4', tnote: 'BS 7671 tables refer to 30 °C air' },
  6: { name: 'AS/NZS 3008 (Aus/NZ)', short: 'AS/NZS', tc: { 1: 75, 2: 90 }, cf: 1, rule: 'Ib ≤ In ≤ Iz', tref: 40, vdMax: 5, ampRef: 'AS/NZS 3008', vdRef: 'AS/NZS 3000', tnote: 'AS/NZS 3008 tables refer to 40 °C air; PVC (V-75) is rated 75 °C' }
};
const BASIS_LABELS = { 1: 'General / IEC-style (70 / 90 °C, 30 °C table ambient)', 4: 'IS India (70 / 90 °C, 40 °C table ambient)', 5: 'BS 7671 UK (70 / 90 °C, 30 °C table ambient) - provisional, not checked against the 2026 amendment', 6: 'AS/NZS 3008 ampacity basis (75 / 90 °C, 40 °C table ambient) - provisional, not checked against the 2025 edition', 2: 'NEC-style (75 / 90 °C, 125% on continuous load)', 3: 'User-defined (set below in Engineering mode)' };
/* Voltage-drop reference for a basis: { pct, ref, kind } or null. BS 7671 has two figures (lighting 3%, other uses 5%); AS/NZS 3000 gives 5% and is a different document from the AS/NZS 3008 ampacity basis. */
const vdRefOf = (basis, circ) => { const b = BASES[basis]; if (!b || !b.vdMax) return null; return basis === 5 && circ === 1 ? { pct: b.vdLight, ref: b.vdRef, kind: 'lighting circuits' } : { pct: b.vdMax, ref: b.vdRef, kind: basis === 5 ? 'other uses' : 'point of supply to point of use' }; };
const trefOf = (v) => (v.basis === 3 ? v.Tref : BASES[v.basis || 1].tref);
const tmOf = (v) => (v.basis === 3 ? v.tmu : BASES[v.basis || 1].tc[v.ins === 1 ? 1 : 2]), cfOf = (v) => (v.basis === 3 ? v.cf : BASES[v.basis || 1].cf);

/* Positional factory keeps each new definition short; the shape is the same JSON-style definition as the schema. */
function C(id, title, division, purpose, keywords, inputs, outputs, formula, assumptions, notes, next, compute, a, b) {
  const check = typeof a === 'function' ? a : null, tests = check ? b : a;
  const wrapped = (i) => Object.assign({ warnings: [] }, compute(i));
  return Object.assign({ id, title, division, version: '1.0.0', purpose, keywords, inputs, outputs, formula, assumptions, notes, next, compute: wrapped, tests }, check ? { check } : {});
}
const wrapDeg = (x) => { let a = ((x + 180) % 360 + 360) % 360 - 180; if (a === -180) a = 180; return Math.abs(a) < 1e-12 ? 0 : a; };
/* Adiabatic k for the conductor and insulation (IEC 60364-4-43 Table 43A, IEC 60364-5-54 Table A.54.4, BS 7671 Table 43.1: these are the older references; IEC 60364-4-43:2023 restructured the standard and lists the k values as Table 2 under 431.5.4 in its public contents, so confirm the reference in a licensed copy).
   PVC (70 °C start, 160 °C end) has k = 115 Cu / 76 Al up to 300 mm² and 103 Cu / 68 Al above 300 mm² (140 °C end). XLPE is 143 Cu / 94 Al at every size.
   `areaMm2` is the conductor area in mm². Because the area is what decides k, the required area is first found with the up-to-300 mm² value:
   if that is 300 mm² or less, it stands; if more, the larger conductor is above 300 mm² and the lower k applies. */
function kShortCircuit(mat, areaMm2) {
  const base = [0, 115, 143, 76, 94][mat];
  if ((mat === 1 || mat === 3) && areaMm2 > 300) return mat === 1 ? 103 : 68;
  return base;
}

const CALCS = [
  {
    id: 'ohms-law', title: "Ohm's Law", division: '02 Ohm\'s Law', version: '1.0.0',
    purpose: 'Find current and power from voltage and resistance.',
    keywords: ['ohm', 'resistance', 'voltage', 'current', 'dc', 'resistor'],
    inputs: [I('V', 'Voltage', 'voltage', 'V', 230, { min: 0, exMin: true }), I('R', 'Resistance', 'resistance', 'Ω', 46, { min: 0, exMin: true })],
    outputs: [{ key: 'I', label: 'Current', dim: 'current', unit: 'A', prec: 3 }, { key: 'P', label: 'Power', dim: 'power', unit: 'W', prec: 1 }],
    formula: 'I = V / R     P = V × I',
    assumptions: ['Steady DC or purely resistive AC load', 'AC voltage is RMS'],
    notes: 'This calculator starts from voltage and resistance. To start from current or power, or from any other two of voltage, current, resistance and power, use the Watts, Volts, Amps and Ohms solver. For reactive loads use the AC Ohm\'s law (phasors) calculator; this one ignores phase angle.',
    next: ['vipr-solver', 'voltage-drop', 'energy-cost', 'ac-ohms-law'],
    compute(i) {
      const Ic = i.V / i.R, P = i.V * Ic;
      return { out: { I: Ic, P }, steps: [`I = V / R = ${q(i.V, 'V', 3)} / ${q(i.R, 'Ω', 3)} = ${fmt(Ic, 4)} A`, `P = V × I = ${fmt(i.V, 3)} × ${fmt(Ic, 4)} = ${fmt(P, 2)} W`], warnings: [],
        sentence: `A ${q(i.V, 'V', 1)} supply across ${q(i.R, 'Ω', 2)} drives ${fmt(Ic, 3)} A and dissipates ${fmt(P, 1)} W.` };
    },
    tests: [
      { name: '230 V across 46 Ω', in: { V: [230, 'V'], R: [46, 'Ω'] }, out: { I: 5, P: 1150 }, tol: 1e-6 },
      { name: 'kΩ input', in: { V: [12, 'V'], R: [1, 'kΩ'] }, out: { I: 0.012 }, tol: 1e-6 },
      { name: 'zero resistance rejected', in: { V: [12, 'V'], R: [0, 'Ω'] }, error: 'R' }
    ]
  },
  {
    id: 'three-phase-current', title: 'Current from Power (kW to Amps)', division: '06 Three Phase', version: '1.0.0',
    purpose: 'Calculate line current from real power, voltage and power factor.',
    keywords: ['kw', 'amps', 'current', 'three', 'phase', '3', 'load', 'watts', 'power', 'single'],
    inputs: [I('P', 'Power', 'power', 'kW', 100, { min: 0, exMin: true }), I('V', 'Voltage', 'voltage', 'V', 400, { min: 0, exMin: true, hint: VHINT }), PF(0.9), PHASE_ALL(3), VTYPE,
      I('eff', 'Efficiency', 'number', '', 1, { min: 0, max: 1, exMin: true, mode: 'engineering', hint: 'Use 1 for a load rated in electrical kW' })],
    outputs: [{ key: 'I', label: 'Full-load current', dim: 'current', unit: 'A', prec: 2 }],
    formula: 'I = P / (η × √3 × V × pf)     (three-phase L-N: 3 × V; single-phase: V; DC: pf = 1)',
    assumptions: ['Balanced load', 'V is line-to-line RMS for three-phase unless line-to-neutral is chosen', 'Sinusoidal waveforms', 'DC takes the power factor as 1'],
    notes: 'Gives full-load current only. Starting current, harmonics and cable derating are separate calculations.',
    next: ['voltage-drop', 'breaker-size', 'kw-to-kva'],
    compute(i) {
      const c = circ(i), k = c.k, Pin = i.P / i.eff, Ic = Pin / (k * i.V * c.pf), w = [];
      if (!c.dc && i.pf < 0.7) w.push('Power factor below 0.7 is unusual for a loaded circuit. Check the value.');
      return { out: { I: Ic }, steps: [
        `Input power = P / η = ${q(i.P, 'kW', 3)} / ${fmt(i.eff, 3)} = ${q(Pin, 'kW', 3)}`,
        `Denominator = ${c.kt}V × pf = ${fmt(k, 4)} × ${fmt(i.V, 1)} × ${fmt(c.pf, 3)} = ${fmt(k * i.V * c.pf, 3)}${c.dc ? ' (DC: power factor taken as 1)' : ''}`,
        `I = ${fmt(Pin, 1)} / ${fmt(k * i.V * c.pf, 3)} = ${fmt(Ic, 3)} A`], warnings: w,
        sentence: `The full-load current is ${fmt(Ic, 2)} A for a ${q(i.P, 'kW', 1)}, ${q(i.V, 'V', 0)}, ${c.name} load${c.dc ? '' : ' at ' + fmt(i.pf, 2) + ' power factor'}.` };
    },
    tests: [
      { name: '100 kW, 400 V, PF 0.9, 3-phase', in: { P: [100, 'kW'], V: [400, 'V'], pf: 0.9, phase: 3, eff: 1 }, out: { I: 160.375 }, tol: 1e-4 },
      { name: '250 kW, 400 V, PF 0.9, 3-phase', in: { P: [250, 'kW'], V: [400, 'V'], pf: 0.9, phase: 3, eff: 1 }, out: { I: 400.94 }, tol: 1e-4 },
      { name: '5 kW, 230 V, PF 1, single-phase', in: { P: [5, 'kW'], V: [230, 'V'], pf: 1, phase: 1, eff: 1 }, out: { I: 21.7391 }, tol: 1e-4 },
      { name: 'kV input equals V input', in: { P: [100, 'kW'], V: [0.4, 'kV'], pf: 0.9, phase: 3, eff: 1 }, out: { I: 160.375 }, tol: 1e-4 },
      { name: 'PF = 0 rejected', in: { P: [100, 'kW'], V: [400, 'V'], pf: 0, phase: 3, eff: 1 }, error: 'pf' },
      { name: 'PF above 1 rejected', in: { P: [100, 'kW'], V: [400, 'V'], pf: 1.2, phase: 3, eff: 1 }, error: 'pf' },
      { name: 'negative power rejected', in: { P: [-5, 'kW'], V: [400, 'V'], pf: 0.9, phase: 3, eff: 1 }, error: 'P' },
      { name: 'DC: 10 kW at 400 V is 25 A, PF ignored', in: { P: [10, 'kW'], V: [400, 'V'], pf: 0.5, phase: 0, eff: 1 }, out: { I: 25 }, tol: 1e-9 },
      { name: 'three-phase line-to-neutral: 100 kW, 230 V, PF 0.9', in: { P: [100, 'kW'], V: [230, 'V'], pf: 0.9, phase: 3, vt: 1, eff: 1 }, out: { I: 161.030596 }, tol: 1e-6 },
      { name: 'L-N at 230 V equals L-L at 230×√3 V', in: { P: [100, 'kW'], V: [398.3716857, 'V'], pf: 0.9, phase: 3, vt: 0, eff: 1 }, out: { I: 161.030596 }, tol: 1e-6 }
    ]
  },
  {
    id: 'kva-to-amps', title: 'kVA to Amps', division: '06 Three Phase', version: '1.0.0',
    purpose: 'Calculate line current from apparent power and voltage.',
    keywords: ['kva', 'amps', 'apparent', 'current'],
    inputs: [I('S', 'Apparent power', 'apparent', 'kVA', 500, { min: 0, exMin: true }), I('V', 'Voltage', 'voltage', 'V', 415, { min: 0, exMin: true, hint: VHINT }), PHASE_ALL(3), VTYPE],
    outputs: [{ key: 'I', label: 'Line current', dim: 'current', unit: 'A', prec: 1 }],
    formula: 'I = S / (√3 × V)     (three-phase L-N: S / (3 × V); single-phase and DC: S / V)',
    assumptions: ['Balanced load', 'V is line-to-line RMS for three-phase unless line-to-neutral is chosen', 'For DC, kVA is the same as kW'],
    notes: 'Power factor does not appear because kVA already includes it.',
    next: ['breaker-size', 'voltage-drop'],
    compute(i) {
      const c = circ(i), Ic = i.S / (c.k * i.V);
      return { out: { I: Ic }, steps: [`I = S / (${c.kt}V) = ${fmt(i.S, 0)} / ${fmt(c.k * i.V, 3)} = ${fmt(Ic, 3)} A`], warnings: [],
        sentence: `${q(i.S, 'kVA', 1)} at ${q(i.V, 'V', 0)} (${c.name}) draws ${fmt(Ic, 1)} A.` };
    },
    tests: [
      { name: '500 kVA, 415 V, 3-phase', in: { S: [500, 'kVA'], V: [415, 'V'], phase: 3 }, out: { I: 695.6 }, tol: 1e-3 },
      { name: '10 kVA, 230 V, single-phase', in: { S: [10, 'kVA'], V: [230, 'V'], phase: 1 }, out: { I: 43.478 }, tol: 1e-4 },
      { name: 'zero voltage rejected', in: { S: [500, 'kVA'], V: [0, 'V'], phase: 3 }, error: 'V' },
      { name: 'DC: 10 kVA at 400 V is 25 A', in: { S: [10, 'kVA'], V: [400, 'V'], phase: 0 }, out: { I: 25 }, tol: 1e-9 },
      { name: 'three-phase line-to-neutral: 30 kVA at 230 V', in: { S: [30, 'kVA'], V: [230, 'V'], phase: 3, vt: 1 }, out: { I: 43.478261 }, tol: 1e-6 }
    ]
  },
  {
    id: 'kw-to-kva', title: 'kW to kVA and kVAR', division: '08 Power Factor', version: '1.0.0',
    purpose: 'Convert real power to apparent and reactive power.',
    keywords: ['kw', 'kva', 'kvar', 'reactive', 'apparent', 'power factor'],
    inputs: [I('P', 'Real power', 'power', 'kW', 100, { min: 0, exMin: true }), PF(0.8)],
    outputs: [{ key: 'S', label: 'Apparent power', dim: 'apparent', unit: 'kVA', prec: 2 }, { key: 'Q', label: 'Reactive power', dim: 'reactive', unit: 'kVAR', prec: 2 }],
    formula: 'S = P / pf     Q = √(S² − P²)',
    assumptions: ['Sinusoidal waveforms', 'Lagging or leading is not distinguished (Q is magnitude)'],
    notes: 'Use the power factor correction calculator to size capacitors.',
    next: ['pf-correction-kvar', 'three-phase-current'],
    compute(i) {
      const S = i.P / i.pf, Q = Math.sqrt(Math.max(S * S - i.P * i.P, 0));
      return { out: { S, Q }, steps: [`S = P / pf = ${q(i.P, 'kW', 2)} / ${fmt(i.pf, 3)} = ${q(S, 'kVA', 3)}`, `Q = √(S² − P²) = ${q(Q, 'kVAR', 3)}`], warnings: [],
        sentence: `${q(i.P, 'kW', 1)} at ${fmt(i.pf, 2)} power factor is ${q(S, 'kVA', 2)} apparent and ${q(Q, 'kVAR', 2)} reactive.` };
    },
    tests: [
      { name: '100 kW at PF 0.8', in: { P: [100, 'kW'], pf: 0.8 }, out: { S: 125, Q: 75 }, tol: 1e-6 },
      { name: 'unity PF has no reactive power', in: { P: [50, 'kW'], pf: 1 }, out: { S: 50 }, tol: 1e-9 },
      { name: 'PF 0 rejected', in: { P: [50, 'kW'], pf: 0 }, error: 'pf' }
    ]
  },
  {
    id: 'pf-correction-kvar', title: 'Power Factor Correction', division: '21 Reactive Power', version: '1.0.0',
    purpose: 'Capacitor kVAR needed to raise power factor to a target.',
    keywords: ['power factor', 'correction', 'capacitor', 'kvar', 'improve', 'pf'],
    inputs: [I('P', 'Real power', 'power', 'kW', 100, { min: 0, exMin: true }), I('pf1', 'Present power factor', 'number', '', 0.8, { min: 0, max: 1, exMin: true }), I('pf2', 'Target power factor', 'number', '', 0.95, { min: 0, max: 1, exMin: true })],
    outputs: [{ key: 'Qc', label: 'Capacitor rating', dim: 'reactive', unit: 'kVAR', prec: 2 }],
    formula: 'Qc = P × (tan φ1 − tan φ2),   φ = arccos(pf)',
    assumptions: ['Sinusoidal waveforms', 'Harmonics not considered (check detuning for harmonic-rich loads)'],
    notes: 'Round up to the next standard capacitor step and check for resonance on harmonic-rich systems.',
    next: ['kw-to-kva'],
    check(v) { return v.pf2 <= v.pf1 ? [{ key: 'pf2', msg: 'Target power factor must be higher than the present power factor' }] : []; },
    compute(i) {
      const t1 = Math.tan(Math.acos(i.pf1)), t2 = Math.tan(Math.acos(i.pf2)), Qc = i.P * (t1 - t2);
      return { out: { Qc }, steps: [`tan φ1 = tan(arccos ${fmt(i.pf1, 3)}) = ${fmt(t1, 4)}`, `tan φ2 = tan(arccos ${fmt(i.pf2, 3)}) = ${fmt(t2, 4)}`, `Qc = ${q(i.P, 'kW', 2)} × (${fmt(t1, 4)} − ${fmt(t2, 4)}) = ${q(Qc, 'kVAR', 3)}`], warnings: [],
        sentence: `Raising ${q(i.P, 'kW', 1)} from ${fmt(i.pf1, 2)} to ${fmt(i.pf2, 2)} power factor needs ${q(Qc, 'kVAR', 2)} of capacitors.` };
    },
    tests: [
      { name: '100 kW, 0.80 to 0.95', in: { P: [100, 'kW'], pf1: 0.8, pf2: 0.95 }, out: { Qc: 42.1316 }, tol: 1e-4 },
      { name: 'target below present rejected', in: { P: [100, 'kW'], pf1: 0.9, pf2: 0.8 }, error: 'pf2' },
      { name: 'target equal to present rejected', in: { P: [100, 'kW'], pf1: 0.9, pf2: 0.9 }, error: 'pf2' }
    ]
  },
  {
    id: 'voltage-drop', title: 'Voltage Drop', division: '09 Voltage Drop', version: '1.0.0',
    purpose: 'Voltage drop along a cable from current, length and impedance.',
    keywords: ['voltage', 'drop', 'cable', 'length', 'metres', 'meters', 'run', 'feeder'],
    inputs: [I('I', 'Load current', 'current', 'A', 160.4, { min: 0, exMin: true }), I('L', 'Route length', 'length', 'm', 120, { min: 0, exMin: true }),
      I('R', 'Cable resistance', 'resPerLen', 'Ω/km', 0.246, { min: 0, exMin: true, hint: 'From the cable data sheet at operating temperature (90 °C for XLPE, 70 °C for PVC). The 20 °C table value understates the drop.' }),
      I('X', 'Cable reactance', 'resPerLen', 'Ω/km', 0.08, { min: 0, mode: 'engineering' }),
      I('V', 'System voltage (L-L)', 'voltage', 'V', 400, { min: 0, exMin: true }), PF(0.9), PHASE, PARALLEL_N],
    outputs: [{ key: 'Vd', label: 'Voltage drop', dim: 'voltage', unit: 'V', prec: 2 }, { key: 'pct', label: 'Drop as % of system voltage', dim: 'number', unit: '', prec: 2 }],
    formula: 'Vd = √3 × I × L × (R cos φ + X sin φ) / n     (single-phase: 2 × I × L × (…) / n; n = conductors per phase in parallel)',
    assumptions: ['Balanced load', 'R and X are per-km values for one conductor, supplied by the user', 'Parallel conductors are identical, the same length and share the current equally; mutual effects between them are ignored', 'Single-phase uses out-and-return path, percentage taken on the given voltage'],
    notes: 'Cable R and X come from your data sheet. Standards-based sizing tables are not included; the calculation uses the General basis.',
    next: ['breaker-size'],
    compute(i) {
      const sin = Math.sqrt(1 - i.pf * i.pf), n = i.n || 1, z = (i.R * i.pf + i.X * sin) / n, k = i.phase === 3 ? SQ3 : 2, Vd = k * i.I * i.L * z, pct = Vd / i.V * 100, w = [];
      if (pct > 5) w.push('Drop above 5% exceeds most design limits.'); else if (pct > 3) w.push('Drop above 3% exceeds the common limit for final circuits.');
      if (n > 1) w.push('Load current is the total per phase. Each of the ' + n + ' parallel conductors carries one ' + n + 'th of it only if they are identical, the same length and laid out alike.');
      return { out: { Vd, pct }, steps: [`sin φ = √(1 − pf²) = ${fmt(sin, 4)}`, n > 1 ? `Z = (R cos φ + X sin φ) / ${n} conductors = ${fmt(z * 1000, 4)} Ω/km` : `Z = R cos φ + X sin φ = ${fmt(z * 1000, 4)} Ω/km`, `Vd = ${i.phase === 3 ? '√3' : '2'} × ${fmt(i.I, 2)} × ${fmt(i.L / 1000, 4)} km × ${fmt(z * 1000, 4)} = ${fmt(Vd, 3)} V`, `Vd % = ${fmt(Vd, 3)} / ${fmt(i.V, 1)} × 100 = ${fmt(pct, 3)} %`], warnings: w,
        sentence: `A ${fmt(i.I, 1)} A load over ${q(i.L, 'm', 0)} loses ${fmt(Vd, 2)} V, which is ${fmt(pct, 2)}% of ${q(i.V, 'V', 0)}.` };
    },
    tests: [
      { name: 'hand check: 100 A, 100 m, 0.1 Ω/km, PF 1', in: { I: [100, 'A'], L: [100, 'm'], R: [0.1, 'Ω/km'], X: [0, 'Ω/km'], V: [400, 'V'], pf: 1, phase: 3 }, out: { Vd: 1.73205, pct: 0.433 }, tol: 1e-3 },
      { name: 'single-phase doubles the path', in: { I: [100, 'A'], L: [100, 'm'], R: [0.1, 'Ω/km'], X: [0, 'Ω/km'], V: [230, 'V'], pf: 1, phase: 1 }, out: { Vd: 2 }, tol: 1e-6 },
      { name: 'feet convert to metres', in: { I: [100, 'A'], L: [328.084, 'ft'], R: [0.1, 'Ω/km'], X: [0, 'Ω/km'], V: [400, 'V'], pf: 1, phase: 3 }, out: { Vd: 1.73205 }, tol: 1e-3 },
      { name: 'zero length rejected', in: { I: [100, 'A'], L: [0, 'm'], R: [0.1, 'Ω/km'], X: [0, 'Ω/km'], V: [400, 'V'], pf: 1, phase: 3 }, error: 'L' },
      { name: '2 conductors per phase halve the drop', in: { I: [100, 'A'], L: [100, 'm'], R: [0.1, 'Ω/km'], X: [0, 'Ω/km'], V: [400, 'V'], pf: 1, phase: 3, n: 2 }, out: { Vd: 0.866025 }, tol: 1e-5 }
    ]
  },
  {
    id: 'breaker-size', title: 'Breaker Rating Selection', division: '16 Protection', version: '1.0.0',
    purpose: 'Smallest standard breaker rating at or above the design current.',
    keywords: ['breaker', 'mccb', 'mcb', 'protection', 'rating', 'size'],
    inputs: [I('I', 'Design current', 'current', 'A', 400.94, { min: 0, exMin: true }), I('m', 'Margin factor', 'number', '', 1, { min: 1, max: 2, mode: 'engineering', hint: '1.0 selects on design current; 1.25 adds 25% for continuous loads' })],
    outputs: [{ key: 'In', label: 'Breaker rating', dim: 'current', unit: 'A', prec: 0 }],
    formula: 'In = smallest standard rating ≥ I × margin',
    assumptions: ['Standard ratings: 6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 320, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000 A', 'Rating must also not exceed the cable current capacity'],
    notes: 'Selection on current only. Breaking capacity, trip curve and discrimination are separate checks.',
    next: ['voltage-drop'],
    compute(i) {
      const need = i.I * i.m, In = RATINGS.find((r) => r >= need), w = [];
      if (In == null) { w.push('Above 4000 A: use parallel feeders or a different frame.'); return { out: { In: NaN }, steps: [`Required ${fmt(need, 1)} A exceeds the list`], warnings: w, sentence: 'The required current is above the largest standard rating in the list.' }; }
      return { out: { In }, steps: [`Required = I × margin = ${fmt(i.I, 2)} × ${fmt(i.m, 2)} = ${fmt(need, 2)} A`, `Next standard rating ≥ ${fmt(need, 2)} A is ${In} A`], warnings: w,
        sentence: `A design current of ${fmt(i.I, 1)} A selects a ${In} A breaker.` };
    },
    tests: [
      { name: '400.94 A selects 500 A', in: { I: [400.94, 'A'], m: 1 }, out: { In: 500 }, tol: 0 },
      { name: 'exactly 100 A selects 100 A', in: { I: [100, 'A'], m: 1 }, out: { In: 100 }, tol: 0 },
      { name: '100.1 A selects 125 A', in: { I: [100.1, 'A'], m: 1 }, out: { In: 125 }, tol: 0 },
      { name: 'margin below 1 rejected', in: { I: [100, 'A'], m: 0.9 }, error: 'm' }
    ]
  },
  {
    id: 'fault-current', title: 'Transformer Fault Current', division: '17 Short Circuit', version: '1.0.0',
    purpose: 'Prospective three-phase fault current at a transformer secondary.',
    keywords: ['fault', 'short', 'circuit', 'transformer', 'ka', 'prospective'],
    inputs: [I('S', 'Transformer rating', 'apparent', 'kVA', 1000, { min: 0, exMin: true }), I('V', 'Secondary voltage (L-L)', 'voltage', 'V', 415, { min: 0, exMin: true }), I('Z', 'Impedance', 'number', '', 5, { min: 0, max: 100, exMin: true, hint: 'Percent, from the nameplate' })],
    outputs: [{ key: 'Isc', label: 'Fault current at terminals', dim: 'current', unit: 'kA', prec: 2 }],
    formula: 'Isc = S / (√3 × V × Z%/100)',
    assumptions: ['Infinite source (utility impedance ignored)', 'Terminal fault, cable impedance ignored', 'Gives an upper bound'],
    notes: 'Including source and cable impedance lowers the value. Use as a conservative first check.',
    next: ['breaker-size'],
    compute(i) {
      const In = i.S / (SQ3 * i.V), Isc = In / (i.Z / 100);
      return { out: { Isc }, steps: [`Full-load current = S / (√3 × V) = ${fmt(In, 1)} A`, `Isc = ${fmt(In, 1)} / ${fmt(i.Z / 100, 4)} = ${fmt(Isc, 0)} A`], warnings: i.Z < 1 ? ['Very low impedance: distribution transformers are usually 4 to 8 %. Check that Z is in percent, not per unit.'] : [],
        sentence: `A ${q(i.S, 'kVA', 0)}, ${q(i.V, 'V', 0)} transformer at ${fmt(i.Z, 2)}% impedance gives about ${q(Isc, 'kA', 1)} at its terminals.` };
    },
    tests: [
      { name: '1000 kVA, 415 V, 5%', in: { S: [1000, 'kVA'], V: [415, 'V'], Z: 5 }, out: { Isc: 27.823 }, tol: 1e-3 },
      { name: 'zero impedance rejected', in: { S: [1000, 'kVA'], V: [415, 'V'], Z: 0 }, error: 'Z' },
      { name: 'impedance above 100% rejected', in: { S: [1000, 'kVA'], V: [415, 'V'], Z: 120 }, error: 'Z' },
      { name: 'implausibly low impedance warns', in: { S: [1000, 'kVA'], V: [415, 'V'], Z: 0.05 }, out: {}, tol: 0, warn: 'Very low impedance' },
      { name: 'ordinary impedance does not warn', in: { S: [1000, 'kVA'], V: [415, 'V'], Z: 5 }, out: {}, tol: 0, noWarn: 'Very low impedance' }
    ]
  },
  {
    id: 'motor-current', title: 'Motor Full-Load Current', division: '12 Motors', version: '1.0.0',
    purpose: 'Line current of a motor from shaft power, efficiency and power factor.',
    keywords: ['motor', 'hp', 'induction', 'current', 'shaft'],
    inputs: [I('P', 'Shaft power', 'power', 'kW', 250, { min: 0, exMin: true }), I('V', 'Line voltage (L-L)', 'voltage', 'V', 415, { min: 0, exMin: true }), PF(0.88), I('eff', 'Efficiency', 'number', '', 0.95, { min: 0, max: 1, exMin: true }), PHASE],
    outputs: [{ key: 'I', label: 'Full-load current', dim: 'current', unit: 'A', prec: 1 }, { key: 'Pin', label: 'Electrical input power', dim: 'power', unit: 'kW', prec: 1 }],
    formula: 'I = P / (η × √3 × V × pf)',
    assumptions: ['Rated load', 'Nameplate current takes precedence over this value', 'Starting current is 5–8× and not included'],
    notes: 'Nameplate values should be preferred. Use this for planning when only kW is known.',
    next: ['voltage-drop', 'breaker-size'],
    compute(i) {
      const Pin = i.P / i.eff, Ic = Pin / (kf(i.phase) * i.V * i.pf);
      return { out: { I: Ic, Pin }, steps: [`Input power = ${q(i.P, 'kW', 1)} / ${fmt(i.eff, 3)} = ${q(Pin, 'kW', 2)}`, `I = ${fmt(Pin, 0)} / (${fmt(kf(i.phase), 4)} × ${fmt(i.V, 0)} × ${fmt(i.pf, 2)}) = ${fmt(Ic, 2)} A`], warnings: [],
        sentence: `A ${q(i.P, 'kW', 0)} motor on ${q(i.V, 'V', 0)} at ${fmt(i.pf, 2)} power factor and ${fmt(i.eff * 100, 0)}% efficiency draws ${fmt(Ic, 1)} A.` };
    },
    tests: [
      { name: '250 kW, 415 V, PF 0.88, η 0.95', in: { P: [250, 'kW'], V: [415, 'V'], pf: 0.88, eff: 0.95, phase: 3 }, out: { I: 416.0, Pin: 263.158 }, tol: 1e-3 },
      { name: 'HP converts to kW', in: { P: [335.2349, 'HP'], V: [415, 'V'], pf: 0.88, eff: 0.95, phase: 3 }, out: { I: 416.0 }, tol: 1e-3 },
      { name: 'efficiency 0 rejected', in: { P: [250, 'kW'], V: [415, 'V'], pf: 0.88, eff: 0, phase: 3 }, error: 'eff' }
    ]
  },
  {
    id: 'transformer-current', title: 'Transformer Full-Load Current', division: '13 Transformers', version: '1.0.0',
    purpose: 'Rated line current on either side of a transformer.',
    keywords: ['transformer', 'kva', 'rated', 'current'],
    inputs: [I('S', 'Transformer rating', 'apparent', 'kVA', 1000, { min: 0, exMin: true }), I('V', 'Winding voltage (L-L)', 'voltage', 'V', 415, { min: 0, exMin: true })],
    outputs: [{ key: 'I', label: 'Rated current', dim: 'current', unit: 'A', prec: 1 }],
    formula: 'I = S / (√3 × V)',
    assumptions: ['Three-phase transformer', 'Rated kVA at rated voltage'],
    notes: 'Run once per winding voltage.',
    next: ['fault-current', 'breaker-size'],
    compute(i) {
      const Ic = i.S / (SQ3 * i.V);
      return { out: { I: Ic }, steps: [`I = ${fmt(i.S, 0)} / (√3 × ${fmt(i.V, 1)}) = ${fmt(Ic, 3)} A`], warnings: [], sentence: `A ${q(i.S, 'kVA', 0)} transformer has a rated current of ${fmt(Ic, 1)} A at ${q(i.V, 'V', 0)}.` };
    },
    tests: [
      { name: '1000 kVA at 415 V', in: { S: [1000, 'kVA'], V: [415, 'V'] }, out: { I: 1391.2 }, tol: 1e-3 },
      { name: '1000 kVA at 11 kV', in: { S: [1000, 'kVA'], V: [11, 'kV'] }, out: { I: 52.49 }, tol: 1e-3 },
      { name: 'negative rating rejected', in: { S: [-1, 'kVA'], V: [415, 'V'] }, error: 'S' }
    ]
  },
  {
    id: 'energy-cost', title: 'Appliance Running Cost (Energy and Cost)', division: '07 Power / Energy', version: '1.1.0',
    purpose: 'Running cost of one appliance or load: energy and cost per day, month and year, and over the days you choose, from its power, how hard it runs, hours of use and one flat tariff. For a whole bill with slabs, a fixed charge and tax use Electricity Bill from Tariff Slabs.',
    keywords: ['energy', 'cost', 'bill', 'tariff', 'kwh', 'units', 'electricity', 'appliance', 'running cost', 'appliance cost', 'cost per day', 'cost per month', 'cost per year', 'wattage', 'capacity', 'btu', 'ton'],
    inputs: [
      I('P', 'Load', 'power', 'kW', 2, { min: 0, exMin: true, presets: APPLIANCES, hint: 'Rated power. Pick a typical appliance to fill it in, then edit it. Typical values are indicative only; use the nameplate or a meter reading. BTU/h and TR (tons of refrigeration) are accepted for air conditioners.' }),
      NB('cap', 'Run at (% of the load)', 100, { min: 0, exMin: true, max: 100, hint: 'Use 100 for a load that draws its full rating while on. A compressor or thermostat-controlled load that works at, say, 60 % of its rating: enter 60.' }),
      NB('h', 'Hours of use', 8, { min: 0, exMin: true, hint: 'Per day, week or month, as chosen below. At most 24 a day, 168 a week or 744 a month.' }),
      { key: 'per', label: 'Hours of use are per', type: 'enum', options: [0, 1, 2], def: 0, labels: { 0: 'Day', 1: 'Week', 2: 'Month' } },
      NB('d', 'Days to total', 30, { min: 0, exMin: true, hint: 'The first two results add up this many days. The per-day, per-month and per-year results do not depend on it.' }),
      NB('t', 'Tariff per kWh', 8, { min: 0, hint: 'In your currency, for example ₹ per unit' }),
      { key: 'cur', label: 'Currency symbol on the results', type: 'enum', options: [0, 1, 2, 3, 4], def: 0, labels: { 0: 'None', 1: '₹ rupee', 2: '$ dollar', 3: '€ euro', 4: '£ pound' } }
    ],
    outputs: [
      { key: 'E', label: 'Energy (days entered)', dim: 'energy', unit: 'kWh', prec: 1 }, { key: 'cost', label: 'Cost (days entered)', dim: 'number', unit: '', prec: 2 },
      { key: 'costDay', label: 'Cost per day', dim: 'number', unit: '', prec: 2 }, { key: 'costMonth', label: 'Cost per month', dim: 'number', unit: '', prec: 2 }, { key: 'costYear', label: 'Cost per year', dim: 'number', unit: '', prec: 2 },
      { key: 'Eday', label: 'Energy per day', dim: 'energy', unit: 'kWh', prec: 2 }, { key: 'Emonth', label: 'Energy per month', dim: 'energy', unit: 'kWh', prec: 1 }, { key: 'Eyear', label: 'Energy per year', dim: 'energy', unit: 'kWh', prec: 0 }
    ],
    formula: 'E per day = P × (run-at % / 100) × hours per day     per month = × 365 / 12     per year = × 365     Cost = E × tariff',
    assumptions: ['Constant draw at the run-at percentage while on', 'Hours per week are spread over 7 days and hours per month over 365 / 12 = 30.42 days', 'Flat tariff, no demand charges', 'Typical appliance wattages are indicative, not measured values'],
    notes: 'This is the cost of one load at one flat rate. A real bill adds demand and fixed charges that are not modelled here. The per-month figure uses an average month of 30.42 days, so it differs a little from the days-to-total result when that is 30. For a whole bill from the units on your meter, with tariff slabs, a fixed charge and tax, use Electricity Bill from Tariff Slabs. Power can be entered in BTU/h (1 BTU/h = 0.29307 W) or tons of refrigeration (1 TR = 12,000 BTU/h = 3,516.85 W); that is the cooling rating, so check the electrical input power of an air conditioner on its label.',
    next: ['electricity-bill-slabs', 'power-energy-time', 'three-phase-current'],
    check(v) { return v.h > PERIOD_MAX[v.per] ? [{ key: 'h', msg: 'Hours of use cannot exceed ' + PERIOD_MAX[v.per] + ' ' + PERIOD_NAME[v.per] }] : []; },
    compute(i) {
      const sym = CURRENCY[i.cur], m = (x) => sym + fmt(x, 2), Pr = i.P * i.cap / 100, hd = i.h / PERIOD_DAYS[i.per];
      const Eday = Pr * hd, Emonth = Eday * 365 / 12, Eyear = Eday * 365, E = Eday * i.d, k = i.t / 1000;
      const out = { E, cost: E * k, costDay: Eday * k, costMonth: Emonth * k, costYear: Eyear * k, Eday, Emonth, Eyear };
      const hdTxt = i.per === 0 ? `${fmt(i.h, 2)} h` : `${fmt(i.h, 2)} h ${i.per === 1 ? 'a week ÷ 7' : 'a month ÷ 30.42'} = ${fmt(hd, 3)} h`;
      const pf = i.cap === 100 ? '' : ` × ${fmt(i.cap, 1)} %`;
      return { out, outMeta: { cost: { prefix: sym }, costDay: { prefix: sym }, costMonth: { prefix: sym }, costYear: { prefix: sym } },
        steps: [`Power drawn = ${q(i.P, 'kW', 2)}${pf} = ${q(Pr, 'kW', 3)}`, `Hours per day = ${hdTxt}`, `E per day = ${q(Pr, 'kW', 3)} × ${fmt(hd, 3)} h = ${q(Eday, 'kWh', 3)}; per month ${q(Emonth, 'kWh', 2)}; per year ${q(Eyear, 'kWh', 1)}`,
          `Cost per day = ${q(Eday, 'kWh', 3)} × ${fmt(i.t, 2)} = ${m(out.costDay)}; per month ${m(out.costMonth)}; per year ${m(out.costYear)}`, `Over ${fmt(i.d, 0)} days: E = ${q(E, 'kWh', 2)}, cost = ${m(out.cost)}`], warnings: [],
        sentence: `${q(i.P, 'kW', 3)}${i.cap === 100 ? '' : ' at ' + fmt(i.cap, 0) + ' %'} for ${fmt(i.h, 1)} h ${PERIOD_NAME[i.per]} uses ${q(Eday, 'kWh', 2)} a day and costs ${m(out.costDay)} a day, ${m(out.costMonth)} a month and ${m(out.costYear)} a year; over ${fmt(i.d, 0)} days that is ${q(E, 'kWh', 1)} and ${m(out.cost)}.` };
    },
    tests: [
      { name: '2 kW, 8 h, 30 d, 8 per kWh', in: { P: [2, 'kW'], h: 8, d: 30, t: 8 }, out: { E: 480, cost: 3840, costDay: 128, Eday: 16 }, tol: 1e-9 },
      { name: 'per month and per year use 365/12 and 365 days', in: { P: [2, 'kW'], h: 8, d: 30, t: 8 }, out: { Emonth: 16 * 365 / 12, Eyear: 16 * 365, costMonth: 128 * 365 / 12, costYear: 128 * 365 }, tol: 1e-9 },
      { name: 'run at 60 % scales every result', in: { P: [2, 'kW'], cap: 60, h: 8, d: 30, t: 8 }, out: { Eday: 9.6, E: 288, cost: 2304 }, tol: 1e-9 },
      { name: '40 h a week is 40/7 h a day', in: { P: [1, 'kW'], h: 40, per: 1, d: 7, t: 10 }, out: { Eday: 40 / 7, E: 40, cost: 400 }, tol: 1e-9 },
      { name: '240 h a month is 240 / (365/12) h a day', in: { P: [1, 'kW'], h: 240, per: 2, d: 30, t: 10 }, out: { Eyear: 240 * 12, costYear: 240 * 12 * 10 }, tol: 1e-9 },
      { name: '1 TR is 3.51685 kW', in: { P: [1, 'TR'], h: 10, d: 1, t: 1 }, out: { E: 12000 * BTU_J / 3600 * 10 / 1000 }, tol: 1e-9 },
      { name: '12,000 BTU/h equals 1 TR', in: { P: [12000, 'BTU/h'], h: 10, d: 1, t: 1 }, out: { E: 12000 * BTU_J / 3600 * 10 / 1000 }, tol: 1e-9 },
      { name: 'currency symbol prefixes the cost results only', in: { P: [2, 'kW'], h: 8, d: 30, t: 8, cur: 1 }, out: { cost: 3840 }, tol: 1e-9, prefix: { cost: '₹', E: '' } },
      { name: 'more than 24 h a day rejected', in: { P: [2, 'kW'], h: 25, d: 30, t: 8 }, error: 'h' },
      { name: 'more than 168 h a week rejected', in: { P: [2, 'kW'], h: 169, per: 1, d: 30, t: 8 }, error: 'h' },
      { name: 'run at above 100 % rejected', in: { P: [2, 'kW'], cap: 120, h: 8, d: 30, t: 8 }, error: 'cap' }
    ]
  },
  C('electricity-bill-slabs', 'Electricity Bill from Tariff Slabs (fixed charge, tax)', '07 Power / Energy', 'Whole-bill estimate from the units on your meter: up to three tariff slabs, a fixed charge and tax. To cost one appliance, use Appliance Running Cost.', ['electricity bill', 'bill', 'slab', 'tariff', 'fixed charge', 'tax', 'units', 'kwh', 'energy charge', 'meter units', 'whole bill', 'tariff slabs'],
    [NB('E', 'Energy used in the billing period (kWh)', 480, { min: 0, exMin: true }), NB('s1', 'First slab size (kWh)', 100, { min: 0, hint: 'Units charged at the first rate. Use 0 to skip the slab.' }), NB('r1', 'First slab rate (per kWh)', 4, { min: 0 }),
      NB('s2', 'Second slab size (kWh)', 200, { min: 0, hint: 'Units charged at the second rate, after the first slab' }), NB('r2', 'Second slab rate (per kWh)', 6, { min: 0 }), NB('r3', 'Rate above both slabs (per kWh)', 8, { min: 0 }),
      NB('fc', 'Fixed charge for the period', 100, { min: 0, hint: 'In your currency; use 0 if none' }), NB('tax', 'Tax or duty on the bill (%)', 5, { min: 0, max: 100, hint: 'Applied to energy charge plus fixed charge. Use 0 if none' })],
    [{ key: 'total', label: 'Total bill', dim: 'number', unit: '', prec: 2 }, { key: 'energy', label: 'Energy charge', dim: 'number', unit: '', prec: 2 }, { key: 'taxAmt', label: 'Tax', dim: 'number', unit: '', prec: 2 }, { key: 'avg', label: 'Average cost per kWh', dim: 'number', unit: '', prec: 3 }],
    'Energy charge = Σ (units in slab × slab rate)     Bill = (Energy charge + Fixed charge) × (1 + Tax / 100)',
    ['Units are billed in order: first slab, then second slab, then the rest at the third rate', 'Slab rates, fixed charge and tax are the values you enter from your tariff order', 'No demand charge, power-factor penalty, time-of-day rate or surcharge'],
    'Some tariffs apply one rate to all units (telescopic versus non-telescopic billing differ by utility). This calculator uses the telescopic method above; check your tariff order. It prices the whole bill from the units on your meter. To find what one appliance costs to run per day, month or year, use Appliance Running Cost (Energy and Cost).', ['energy-cost', 'power-energy-time'],
    (i) => {
      const e1 = Math.min(i.E, i.s1), e2 = Math.min(Math.max(i.E - i.s1, 0), i.s2), e3 = Math.max(i.E - i.s1 - i.s2, 0);
      const energy = e1 * i.r1 + e2 * i.r2 + e3 * i.r3, sub = energy + i.fc, taxAmt = sub * i.tax / 100, total = sub + taxAmt, avg = total / i.E;
      return { out: { total, energy, taxAmt, avg }, steps: [`Slab 1: ${fmt(e1, 2)} kWh × ${fmt(i.r1, 3)} = ${fmt(e1 * i.r1, 2)}`, `Slab 2: ${fmt(e2, 2)} kWh × ${fmt(i.r2, 3)} = ${fmt(e2 * i.r2, 2)}`, `Above slabs: ${fmt(e3, 2)} kWh × ${fmt(i.r3, 3)} = ${fmt(e3 * i.r3, 2)}`, `Energy charge = ${fmt(energy, 2)}; with the fixed charge ${fmt(i.fc, 2)} = ${fmt(sub, 2)}`, `Tax = ${fmt(sub, 2)} × ${fmt(i.tax, 2)} % = ${fmt(taxAmt, 2)}`, `Bill = ${fmt(sub, 2)} + ${fmt(taxAmt, 2)} = ${fmt(total, 2)}`],
        sentence: `${fmt(i.E, 1)} kWh gives a bill of ${fmt(total, 2)}: energy ${fmt(energy, 2)}, fixed ${fmt(i.fc, 2)} and tax ${fmt(taxAmt, 2)}, an average of ${fmt(avg, 3)} per kWh.` };
    },
    [{ name: '480 kWh, 100@4 + 200@6 + rest@8, fixed 100, tax 5%', in: { E: 480, s1: 100, r1: 4, s2: 200, r2: 6, r3: 8, fc: 100, tax: 5 }, out: { energy: 3040, taxAmt: 157, total: 3297 }, tol: 1e-9 },
      { name: 'usage inside the first slab only', in: { E: 60, s1: 100, r1: 4, s2: 200, r2: 6, r3: 8, fc: 0, tax: 0 }, out: { total: 240, energy: 240, avg: 4 }, tol: 1e-9 },
      { name: 'zero usage rejected', in: { E: 0, s1: 100, r1: 4, s2: 200, r2: 6, r3: 8, fc: 0, tax: 0 }, error: 'E' },
      { name: 'tax above 100 % rejected', in: { E: 100, s1: 100, r1: 4, s2: 200, r2: 6, r3: 8, fc: 0, tax: 120 }, error: 'tax' }]),
  C('power-vir', 'Power from Voltage and Current', "02 Ohm's Law", 'Power and resistance from voltage and current.', ['power', 'watts', 'voltage', 'current', 'vir'],
    [I('V', 'Voltage', 'voltage', 'V', 230, { min: 0, exMin: true }), I('I', 'Current', 'current', 'A', 5, { min: 0, exMin: true })],
    [{ key: 'P', label: 'Power', dim: 'power', unit: 'W', prec: 1 }, { key: 'R', label: 'Resistance', dim: 'resistance', unit: 'Ω', prec: 2 }],
    'P = V × I     R = V / I', ['Steady DC or purely resistive AC load', 'AC values are RMS'], 'For reactive loads include power factor (watts to amps).', ['ohms-law', 'watts-to-amps', 'vipr-solver'],
    (i) => { const P = i.V * i.I, R = i.V / i.I; return { out: { P, R }, steps: [`P = V × I = ${fmt(i.V, 2)} × ${fmt(i.I, 3)} = ${fmt(P, 2)} W`, `R = V / I = ${fmt(R, 3)} Ω`], sentence: `${q(i.V, 'V', 1)} at ${fmt(i.I, 2)} A is ${fmt(P, 1)} W across ${fmt(R, 2)} Ω.` }; },
    [{ name: '230 V, 5 A', in: { V: [230, 'V'], I: [5, 'A'] }, out: { P: 1150, R: 46 }, tol: 1e-6 }, { name: 'mA converts', in: { V: [12, 'V'], I: [500, 'mA'] }, out: { P: 6, R: 24 }, tol: 1e-6 }, { name: 'zero current rejected', in: { V: [12, 'V'], I: [0, 'A'] }, error: 'I' }]),
  {
    id: 'ac-ohms-law', title: "AC Ohm's Law (Phasors)", division: "02 Ohm's Law", version: '1.0.0',
    purpose: 'Enter any two of voltage, current and impedance, each with a phase angle. The third phasor and the power triangle are calculated.',
    keywords: ['ac ohm', 'phasor', 'phase angle', 'complex', 'impedance', 'polar', 'reactive', 'apparent', 'power factor'],
    inputs: [
      I('V', 'Voltage |V|', 'voltage', 'V', 230, { min: 0, exMin: true, optional: true, hint: 'Enter any two of voltage, current and impedance and leave the third blank. RMS values' }),
      I('Vang', 'Voltage angle (degrees)', 'number', '', 0, { min: -360, max: 360, optional: true, hint: 'Blank counts as 0°. Leave blank when voltage is the value being solved' }),
      I('I', 'Current |I|', 'current', 'A', '', { min: 0, exMin: true, optional: true }),
      I('Iang', 'Current angle (degrees)', 'number', '', '', { min: -360, max: 360, optional: true, hint: 'Blank counts as 0°. A negative angle behind the voltage is a lagging (inductive) current' }),
      I('Z', 'Impedance |Z|', 'resistance', 'Ω', 46, { min: 0, exMin: true, optional: true }),
      I('Zang', 'Impedance angle (degrees)', 'number', '', 30, { min: -360, max: 360, optional: true, hint: 'Positive for an inductive load, negative for a capacitive load, 0 for a resistor' })
    ],
    outputs: [
      { key: 'V', label: 'Voltage |V|', dim: 'voltage', unit: 'V', prec: 3 }, { key: 'Vang', label: 'Voltage angle (degrees)', dim: 'number', unit: '', prec: 2 },
      { key: 'I', label: 'Current |I|', dim: 'current', unit: 'A', prec: 4 }, { key: 'Iang', label: 'Current angle (degrees)', dim: 'number', unit: '', prec: 2 },
      { key: 'Z', label: 'Impedance |Z|', dim: 'resistance', unit: 'Ω', prec: 3 }, { key: 'Zang', label: 'Impedance angle (degrees)', dim: 'number', unit: '', prec: 2 },
      { key: 'S', label: 'Apparent power |S|', dim: 'apparent', unit: 'VA', prec: 2 }, { key: 'P', label: 'Real power P', dim: 'power', unit: 'W', prec: 2 },
      { key: 'Q', label: 'Reactive power Q (+ inductive)', dim: 'reactive', unit: 'VAR', prec: 2 }, { key: 'pf', label: 'Power factor', dim: 'number', unit: '', prec: 4 }
    ],
    formula: 'V = I × Z (magnitudes multiply, angles add)     S = V × I* (angle = ∠V − ∠I)     P = |S| cos θ     Q = |S| sin θ',
    assumptions: ['Steady-state sinusoidal AC at one frequency', 'Voltage and current are RMS values', 'Angles in degrees; a positive impedance angle is inductive and the current lags the voltage'],
    notes: 'Exactly two of voltage, current and impedance are needed. A blank angle on a value you enter counts as 0°, so a resistor is an impedance with a blank or zero angle. For a purely resistive circuit the DC Ohm\'s law calculators give the same magnitudes.',
    next: ['vipr-solver', 'ohms-law', 'impedance-rlc', 'power-factor'],
    check(v) {
      const names = { V: 'voltage', I: 'current', Z: 'impedance' }, ang = { V: 'Vang', I: 'Iang', Z: 'Zang' };
      const given = ['V', 'I', 'Z'].filter((k) => v[k] != null);
      if (given.length < 2) return ['V', 'I', 'Z'].filter((k) => v[k] == null).map((k) => ({ key: k, msg: 'Enter any two of voltage, current and impedance (' + names[k] + ')' }));
      if (given.length > 2) return given.map((k) => ({ key: k, msg: 'Enter only two of voltage, current and impedance; clear one (' + names[k] + ')' }));
      return ['V', 'I', 'Z'].filter((k) => v[k] == null && v[ang[k]] != null).map((k) => ({ key: ang[k], msg: 'Clear the ' + names[k] + ' angle: ' + names[k] + ' is the value being solved for' }));
    },
    compute(i) {
      const has = (k) => i[k] != null;
      let Vm = i.V, Va = i.Vang || 0, Im = i.I, Ia = i.Iang || 0, Zm = i.Z, Za = i.Zang || 0, how = [];
      const pol = (m, a, u, p) => `${fmt(m, p)} ${u} ∠${fmt(wrapDeg(a), 2)}°`;
      if (has('V') && has('I')) {
        Zm = Vm / Im; Za = wrapDeg(Va - Ia);
        how.push(`Z = V / I = (${pol(Vm, Va, 'V', 3)}) / (${pol(Im, Ia, 'A', 4)})`, `|Z| = |V| / |I| = ${fmt(Vm, 3)} / ${fmt(Im, 4)} = ${fmt(Zm, 4)} Ω`, `∠Z = ∠V − ∠I = ${fmt(Va, 2)}° − (${fmt(Ia, 2)}°) = ${fmt(Za, 2)}°`);
      } else if (has('V') && has('Z')) {
        Im = Vm / Zm; Ia = wrapDeg(Va - Za);
        how.push(`I = V / Z = (${pol(Vm, Va, 'V', 3)}) / (${pol(Zm, Za, 'Ω', 3)})`, `|I| = |V| / |Z| = ${fmt(Vm, 3)} / ${fmt(Zm, 3)} = ${fmt(Im, 4)} A`, `∠I = ∠V − ∠Z = ${fmt(Va, 2)}° − (${fmt(Za, 2)}°) = ${fmt(Ia, 2)}°`);
      } else {
        Vm = Im * Zm; Va = wrapDeg(Ia + Za);
        how.push(`V = I × Z = (${pol(Im, Ia, 'A', 4)}) × (${pol(Zm, Za, 'Ω', 3)})`, `|V| = |I| × |Z| = ${fmt(Im, 4)} × ${fmt(Zm, 3)} = ${fmt(Vm, 4)} V`, `∠V = ∠I + ∠Z = ${fmt(Ia, 2)}° + (${fmt(Za, 2)}°) = ${fmt(Va, 2)}°`);
      }
      Va = wrapDeg(Va); Ia = wrapDeg(Ia); Za = wrapDeg(Za);
      const th = wrapDeg(Va - Ia), r = Math.PI / 180, S = Vm * Im, P = S * Math.cos(th * r), Qv = S * Math.sin(th * r), pf = Math.cos(th * r);
      const Zr = Zm * Math.cos(Za * r), Zx = Zm * Math.sin(Za * r), sg = (x) => (x < 0 ? '−' : '+');
      how.push(`Z = ${fmt(Zr, 3)} ${sg(Zx)} j${fmt(Math.abs(Zx), 3)} Ω (resistance ${fmt(Zr, 3)} Ω, reactance ${fmt(Zx, 3)} Ω)`,
        `S = V × I*: |S| = ${fmt(Vm, 3)} × ${fmt(Im, 4)} = ${fmt(S, 2)} VA at ∠${fmt(th, 2)}° (∠V − ∠I)`,
        `P = |S| cos θ = ${fmt(P, 2)} W     Q = |S| sin θ = ${fmt(Qv, 2)} VAR     pf = cos θ = ${fmt(pf, 4)}`);
      const warnings = [];
      if (Math.abs(Za) > 90 + 1e-9) warnings.push('An impedance angle beyond ±90° means negative resistance: the element supplies power instead of absorbing it. Check the angles.');
      const kind = Math.abs(th) < 1e-9 ? 'in phase with the voltage' : th > 0 ? `lagging the voltage by ${fmt(th, 2)}° (inductive)` : `leading the voltage by ${fmt(-th, 2)}° (capacitive)`;
      return { out: { V: Vm, Vang: Va, I: Im, Iang: Ia, Z: Zm, Zang: Za, S, P, Q: Qv, pf }, steps: how, warnings,
        sentence: `${fmt(Vm, 3)} V across ${fmt(Zm, 3)} Ω drives ${fmt(Im, 3)} A, ${kind}, with ${fmt(P, 1)} W real and ${fmt(Qv, 1)} VAR reactive power.` };
    },
    tests: [
      { name: '230 V ∠0° across 46 Ω ∠30°', in: { V: [230, 'V'], Vang: 0, I: '', Iang: '', Z: [46, 'Ω'], Zang: 30 }, out: { I: 5, Iang: -30, S: 1150, P: 995.9292143521045, Q: 575, pf: 0.8660254037844387 }, tol: 1e-9 },
      { name: 'V and I give Z (230 ∠0°, 5 ∠−30°)', in: { V: [230, 'V'], Vang: 0, I: [5, 'A'], Iang: -30, Z: '', Zang: '' }, out: { Z: 46, Zang: 30, P: 995.9292143521045 }, tol: 1e-9 },
      { name: 'I and Z give V (5 ∠−30°, 46 ∠30°)', in: { V: '', Vang: '', I: [5, 'A'], Iang: -30, Z: [46, 'Ω'], Zang: 30 }, out: { V: 230, Vang: 0 }, tol: 1e-9 },
      { name: 'capacitive load: 230 V, 23 Ω ∠−60°', in: { V: [230, 'V'], Vang: 0, I: '', Iang: '', Z: [23, 'Ω'], Zang: -60 }, out: { I: 10, Iang: 60, S: 2300, P: 1150, Q: -1991.858428704209, pf: 0.5 }, tol: 1e-9 },
      { name: 'angle wraps into ±180°', in: { V: [100, 'V'], Vang: 170, I: [2, 'A'], Iang: -170, Z: '', Zang: '' }, out: { Z: 50, Zang: -20 }, tol: 1e-9 },
      { name: 'mA and kΩ convert', in: { V: [12, 'V'], Vang: 0, I: [2, 'mA'], Iang: -45, Z: '', Zang: '' }, out: { Z: 6000, Zang: 45 }, tol: 1e-9 },
      { name: 'blank angles count as 0° (resistive)', in: { V: [12, 'V'], Vang: '', I: '', Iang: '', Z: [24, 'Ω'], Zang: '' }, out: { I: 0.5, Iang: 0, P: 6, pf: 1 }, tol: 1e-9 },
      { name: 'negative resistance warns', in: { V: [230, 'V'], Vang: 0, I: '', Iang: '', Z: [46, 'Ω'], Zang: 120 }, out: { Iang: -120 }, tol: 1e-9, warn: 'negative resistance' },
      { name: 'one value only is rejected', in: { V: [230, 'V'], Vang: 0, I: '', Iang: '', Z: '', Zang: '' }, error: 'I' },
      { name: 'three values rejected', in: { V: [230, 'V'], Vang: 0, I: [5, 'A'], Iang: -30, Z: [46, 'Ω'], Zang: 30 }, error: 'V' },
      { name: 'angle on the solved value is rejected', in: { V: [230, 'V'], Vang: 0, I: '', Iang: -30, Z: [46, 'Ω'], Zang: 30 }, error: 'Iang' },
      { name: 'zero impedance rejected', in: { V: [230, 'V'], Vang: 0, I: '', Iang: '', Z: [0, 'Ω'], Zang: 0 }, error: 'Z' }
    ]
  },
  {
    id: 'vipr-solver', title: 'Watts, Volts, Amps, Ohms (any two)', division: "02 Ohm's Law", version: '1.0.0',
    purpose: 'Enter any two of voltage, current, resistance and power. The other two are calculated.',
    keywords: ['ohm', 'watts volts amps ohms', 'solve', 'any two', 'resistance', 'power', 'voltage', 'current', 'vir'],
    inputs: [
      I('V', 'Voltage', 'voltage', 'V', 230, { min: 0, exMin: true, optional: true, hint: 'Enter any two of the four values and leave the other two blank' }),
      I('I', 'Current', 'current', 'A', 5, { min: 0, exMin: true, optional: true }),
      I('R', 'Resistance', 'resistance', 'Ω', '', { min: 0, exMin: true, optional: true }),
      I('P', 'Power', 'power', 'W', '', { min: 0, exMin: true, optional: true })
    ],
    outputs: [{ key: 'V', label: 'Voltage', dim: 'voltage', unit: 'V', prec: 3 }, { key: 'I', label: 'Current', dim: 'current', unit: 'A', prec: 4 }, { key: 'R', label: 'Resistance', dim: 'resistance', unit: 'Ω', prec: 3 }, { key: 'P', label: 'Power', dim: 'power', unit: 'W', prec: 2 }],
    formula: 'V = I × R     P = V × I     P = I² × R     P = V² / R',
    assumptions: ['Steady DC or purely resistive AC load', 'AC values are RMS', 'Power factor is 1; for a reactive load use the power, voltage and current calculator'],
    notes: 'Exactly two values are needed. If three or four are entered the result could contradict itself, so the calculator asks for two only.',
    next: ['ohms-law', 'power-vir', 'power-vi-solver', 'ac-ohms-law'],
    check(v) {
      const given = ['V', 'I', 'R', 'P'].filter((k) => v[k] != null);
      if (given.length === 2) return [];
      const names = { V: 'voltage', I: 'current', R: 'resistance', P: 'power' };
      const msg = given.length < 2 ? 'Enter any two of voltage, current, resistance and power' : 'Enter only two of voltage, current, resistance and power; clear the others';
      return (given.length < 2 ? ['V', 'I', 'R', 'P'].filter((k) => v[k] == null) : given).map((k) => ({ key: k, msg: msg + ' (' + names[k] + ')' }));
    },
    compute(i) {
      let V = i.V, Ic = i.I, R = i.R, P = i.P, how;
      if (V != null && Ic != null) { R = V / Ic; P = V * Ic; how = [`R = V / I = ${fmt(V, 3)} / ${fmt(Ic, 4)} = ${fmt(R, 4)} Ω`, `P = V × I = ${fmt(P, 3)} W`]; }
      else if (V != null && R != null) { Ic = V / R; P = V * V / R; how = [`I = V / R = ${fmt(V, 3)} / ${fmt(R, 3)} = ${fmt(Ic, 4)} A`, `P = V² / R = ${fmt(P, 3)} W`]; }
      else if (V != null && P != null) { Ic = P / V; R = V * V / P; how = [`I = P / V = ${fmt(P, 3)} / ${fmt(V, 3)} = ${fmt(Ic, 4)} A`, `R = V² / P = ${fmt(R, 4)} Ω`]; }
      else if (Ic != null && R != null) { V = Ic * R; P = Ic * Ic * R; how = [`V = I × R = ${fmt(Ic, 4)} × ${fmt(R, 3)} = ${fmt(V, 4)} V`, `P = I² × R = ${fmt(P, 3)} W`]; }
      else if (Ic != null && P != null) { V = P / Ic; R = P / (Ic * Ic); how = [`V = P / I = ${fmt(P, 3)} / ${fmt(Ic, 4)} = ${fmt(V, 4)} V`, `R = P / I² = ${fmt(R, 4)} Ω`]; }
      else { V = Math.sqrt(P * R); Ic = Math.sqrt(P / R); how = [`V = √(P × R) = ${fmt(V, 4)} V`, `I = √(P / R) = ${fmt(Ic, 4)} A`]; }
      return { out: { V, I: Ic, R, P }, steps: how, warnings: [],
        sentence: `${fmt(V, 3)} V, ${fmt(Ic, 3)} A, ${fmt(R, 3)} Ω and ${fmt(P, 2)} W describe the same circuit.` };
    },
    tests: [
      { name: 'V and I (230 V, 5 A)', in: { V: [230, 'V'], I: [5, 'A'] }, out: { R: 46, P: 1150 }, tol: 1e-9 },
      { name: 'V and R (12 V, 24 Ω)', in: { V: [12, 'V'], I: '', R: [24, 'Ω'] }, out: { I: 0.5, P: 6 }, tol: 1e-9 },
      { name: 'V and P (230 V, 1150 W)', in: { V: [230, 'V'], I: '', P: [1150, 'W'] }, out: { I: 5, R: 46 }, tol: 1e-9 },
      { name: 'I and R (5 A, 46 Ω)', in: { V: '', I: [5, 'A'], R: [46, 'Ω'] }, out: { V: 230, P: 1150 }, tol: 1e-9 },
      { name: 'I and P (5 A, 1150 W)', in: { V: '', I: [5, 'A'], P: [1150, 'W'] }, out: { V: 230, R: 46 }, tol: 1e-9 },
      { name: 'R and P (46 Ω, 1150 W)', in: { V: '', I: '', R: [46, 'Ω'], P: [1150, 'W'] }, out: { V: 230, I: 5 }, tol: 1e-9 },
      { name: 'kW input converts', in: { V: '', I: [5, 'A'], P: [1.15, 'kW'] }, out: { V: 230 }, tol: 1e-9 },
      { name: 'one value only is rejected', in: { V: [230, 'V'], I: '' }, error: 'I' },
      { name: 'three values rejected', in: { V: [230, 'V'], I: [5, 'A'], R: [46, 'Ω'] }, error: 'V' },
      { name: 'zero resistance rejected', in: { V: [12, 'V'], I: '', R: [0, 'Ω'] }, error: 'R' }
    ]
  },
  {
    id: 'power-vi-solver', title: 'Power, Voltage, Current with Power Factor (solve any)', division: '06 Three Phase', version: '1.0.0',
    purpose: 'Enter any two of power, voltage and current, with the power factor. The third is calculated, for single or three-phase AC.',
    keywords: ['amps to volts', 'kw to volts', 'watts to volts', 'solve', 'voltage from power', 'volts', 'power', 'current', 'three', 'phase'],
    inputs: [
      I('P', 'Real power', 'power', 'kW', '', { min: 0, exMin: true, optional: true, hint: 'Enter any two of power, voltage and current and leave the third blank' }),
      I('V', 'Voltage', 'voltage', 'V', 400, { min: 0, exMin: true, optional: true, hint: VHINT }),
      I('I', 'Line current', 'current', 'A', 100, { min: 0, exMin: true, optional: true }),
      PF(0.9), PHASE_ALL(3), VTYPE
    ],
    outputs: [{ key: 'P', label: 'Real power', dim: 'power', unit: 'kW', prec: 3 }, { key: 'V', label: 'Line voltage', dim: 'voltage', unit: 'V', prec: 2 }, { key: 'I', label: 'Line current', dim: 'current', unit: 'A', prec: 3 }],
    formula: 'P = k × V × I × PF     k = √3 (three-phase L-L), 3 (three-phase L-N) or 1 (single-phase, DC; PF = 1 for DC)',
    assumptions: ['Balanced load', 'Voltage is line-to-line for three-phase unless line-to-neutral is chosen', 'Current is the line current', 'AC values are RMS'],
    notes: 'For DC the power factor is taken as 1. If you know resistance, use the watts, volts, amps, ohms solver. Engineering mode adds the line-to-line or line-to-neutral choice for three-phase.',
    next: ['three-phase-current', 'amps-to-kw', 'vipr-solver'],
    check(v) {
      const given = ['P', 'V', 'I'].filter((k) => v[k] != null);
      if (given.length === 2) return [];
      const msg = given.length < 2 ? 'Enter any two of power, voltage and current' : 'Enter only two of power, voltage and current; clear the third';
      return (given.length < 2 ? ['P', 'V', 'I'].filter((k) => v[k] == null) : given).map((k) => ({ key: k, msg }));
    },
    compute(i) {
      const c = circ(i), k = c.k, kt = c.kt ? c.kt.replace(' × ', '') : '1', pfx = c.pf;
      let P = i.P, V = i.V, Ic = i.I, how;
      if (P == null) { P = k * V * Ic * pfx; how = `P = ${kt} × V × I × PF = ${kt} × ${fmt(V, 2)} × ${fmt(Ic, 3)} × ${fmt(pfx, 3)} = ${fmt(P / 1000, 4)} kW`; }
      else if (V == null) { V = P / (k * Ic * pfx); how = `V = P / (${kt} × I × PF) = ${fmt(P, 2)} / (${kt} × ${fmt(Ic, 3)} × ${fmt(pfx, 3)}) = ${fmt(V, 3)} V`; }
      else { Ic = P / (k * V * pfx); how = `I = P / (${kt} × V × PF) = ${fmt(P, 2)} / (${kt} × ${fmt(V, 2)} × ${fmt(pfx, 3)}) = ${fmt(Ic, 4)} A`; }
      return { out: { P, V, I: Ic }, steps: [how], warnings: [],
        sentence: `${fmt(P / 1000, 3)} kW at ${fmt(V, 1)} V and ${fmt(Ic, 2)} A with power factor ${fmt(pfx, 2)} (${c.name}${c.dc ? ', power factor taken as 1' : ''}).` };
    },
    tests: [
      { name: 'power from V and I, three-phase', in: { P: '', V: [400, 'V'], I: [100, 'A'], pf: 0.9, phase: 3 }, out: { P: 62.35382907 }, tol: 1e-7 },
      { name: 'voltage from P and I, three-phase', in: { P: [62.35382907, 'kW'], V: '', I: [100, 'A'], pf: 0.9, phase: 3 }, out: { V: 400 }, tol: 1e-7 },
      { name: 'current from P and V, single-phase', in: { P: [2.07, 'kW'], V: [230, 'V'], I: '', pf: 0.9, phase: 1 }, out: { I: 10 }, tol: 1e-9 },
      { name: 'voltage from P and I, single-phase', in: { P: [2070, 'W'], V: '', I: [10, 'A'], pf: 0.9, phase: 1 }, out: { V: 230 }, tol: 1e-9 },
      { name: 'DC: power from 12 V and 5 A', in: { P: '', V: [12, 'V'], I: [5, 'A'], pf: 0.5, phase: 0 }, out: { P: 0.06 }, tol: 1e-9 },
      { name: 'DC: voltage from 60 W and 5 A', in: { P: [60, 'W'], V: '', I: [5, 'A'], pf: 0.5, phase: 0 }, out: { V: 12 }, tol: 1e-9 },
      { name: 'L-N: voltage from P and I, three-phase', in: { P: [62.1, 'kW'], V: '', I: [100, 'A'], pf: 0.9, phase: 3, vt: 1 }, out: { V: 230 }, tol: 1e-9 },
      { name: 'only one value rejected', in: { P: '', V: [400, 'V'], I: '', pf: 0.9, phase: 3 }, error: 'P' },
      { name: 'power factor above 1 rejected', in: { P: '', V: [400, 'V'], I: [100, 'A'], pf: 1.2, phase: 3 }, error: 'pf' }
    ]
  },
  {
    id: 'kwh-to-kw', title: 'kWh to kW and Watts', division: '07 Power / Energy', version: '1.0.0',
    purpose: 'Average power from energy used and the time it took.',
    keywords: ['kwh to kw', 'kwh to watts', 'energy to power', 'average power', 'wh to w'],
    inputs: [I('E', 'Energy', 'energy', 'kWh', 12, { min: 0, exMin: true }), I('t', 'Time', 'time', 'h', 4, { min: 0, exMin: true })],
    outputs: [{ key: 'P', label: 'Average power', dim: 'power', unit: 'kW', prec: 4 }],
    formula: 'P = E / t',
    assumptions: ['Average over the stated time', 'Energy and time cover the same period'],
    notes: 'Change the output unit to read the answer in watts. The result is an average; the instantaneous power can be higher or lower.',
    next: ['power-energy-time', 'energy-cost', 'energy-converter'],
    compute(i) {
      const P = i.E / (i.t / 3600);
      return { out: { P }, steps: [`P = E / t = ${q(i.E, 'kWh', 3)} / ${q(i.t, 'h', 3)} = ${q(P, 'kW', 4)}`], warnings: [],
        sentence: `${q(i.E, 'kWh', 2)} used over ${q(i.t, 'h', 2)} is an average of ${q(P, 'kW', 3)} (${q(P, 'W', 1)}).` };
    },
    tests: [
      { name: '12 kWh over 4 h', in: { E: [12, 'kWh'], t: [4, 'h'] }, out: { P: 3 }, tol: 1e-9 },
      { name: '500 Wh over 30 min', in: { E: [500, 'Wh'], t: [30, 'min'] }, out: { P: 1 }, tol: 1e-9 },
      { name: 'zero time rejected', in: { E: [12, 'kWh'], t: [0, 'h'] }, error: 't' }
    ]
  },
  {
    id: 'power-energy-time', title: 'Watts, Joules, kWh and Time (any two)', division: '07 Power / Energy', version: '1.0.0',
    purpose: 'Enter any two of power, energy and time. The third is calculated: watts to joules, joules to watts, kW to kWh, watts to kWh.',
    keywords: ['watts to joules', 'joules to watts', 'kw to kwh', 'watts to kwh', 'power to energy', 'energy from power', 'joule', 'kwh', 'energy', 'power', 'time', 'duration'],
    inputs: [
      I('P', 'Power', 'power', 'W', 100, { min: 0, exMin: true, optional: true, hint: 'Enter any two of power, energy and time and leave the third blank' }),
      I('E', 'Energy', 'energy', 'J', '', { min: 0, exMin: true, optional: true }),
      I('t', 'Time', 'time', 's', 10, { min: 0, exMin: true, optional: true })
    ],
    outputs: [{ key: 'P', label: 'Power', dim: 'power', unit: 'W', prec: 4 }, { key: 'E', label: 'Energy', dim: 'energy', unit: 'J', prec: 4 }, { key: 't', label: 'Time', dim: 'time', unit: 's', prec: 4 }],
    formula: 'E = P × t     (1 W × 1 s = 1 J,  1 kW × 1 h = 1 kWh = 3.6 MJ)',
    assumptions: ['Constant power over the whole time', 'Real (active) power, not apparent power'],
    notes: 'Change any unit to read the answer in kWh, Wh, kJ or MJ. For a varying load the result is the average power or the total energy, not the instantaneous value. For a cost, use Energy and Cost.',
    next: ['kwh-to-kw', 'energy-cost', 'energy-converter'],
    check(v) {
      const given = ['P', 'E', 't'].filter((k) => v[k] != null);
      if (given.length === 2) return [];
      const msg = given.length < 2 ? 'Enter any two of power, energy and time' : 'Enter only two of power, energy and time; clear the third';
      return (given.length < 2 ? ['P', 'E', 't'].filter((k) => v[k] == null) : given).map((k) => ({ key: k, msg }));
    },
    compute(i) {
      let P = i.P, E = i.E, t = i.t, how;
      if (E == null) { E = P * t / 3600; how = `E = P × t = ${q(P, 'W', 4)} × ${q(t, 's', 4)} = ${q(E, 'J', 4)}`; }
      else if (t == null) { t = E * 3600 / P; how = `t = E / P = ${q(E, 'J', 4)} / ${q(P, 'W', 4)} = ${q(t, 's', 4)}`; }
      else { P = E * 3600 / t; how = `P = E / t = ${q(E, 'J', 4)} / ${q(t, 's', 4)} = ${q(P, 'W', 4)}`; }
      return { out: { P, E, t }, steps: [how, `In other units: ${q(E, 'kWh', 6)} = ${q(E, 'MJ', 6)}; ${q(P, 'kW', 6)}; ${q(t, 'h', 6)}`], warnings: [],
        sentence: `${q(P, 'W', 3)} over ${q(t, 's', 3)} is ${q(E, 'J', 3)} (${q(E, 'kWh', 6)}).` };
    },
    tests: [
      { name: '100 W for 10 s is 1000 J', in: { P: [100, 'W'], E: '', t: [10, 's'] }, out: { E: 1000 }, tol: 1e-9 },
      { name: '1 kW for 1 h is 3.6 MJ', in: { P: [1, 'kW'], E: '', t: [1, 'h'] }, out: { E: 3600000 }, tol: 1e-9 },
      { name: '3600 J in 1 s is 3600 W', in: { P: '', E: [3600, 'J'], t: [1, 's'] }, out: { P: 3600 }, tol: 1e-9 },
      { name: '12 kWh over 4 h is 3 kW', in: { P: '', E: [12, 'kWh'], t: [4, 'h'] }, out: { P: 3000 }, tol: 1e-9 },
      { name: '1000 J at 100 W takes 10 s', in: { P: [100, 'W'], E: [1000, 'J'], t: '' }, out: { t: 10 }, tol: 1e-9 },
      { name: 'one value only is rejected', in: { P: [100, 'W'], E: '', t: '' }, error: 'E' },
      { name: 'three values rejected', in: { P: [100, 'W'], E: [1000, 'J'], t: [10, 's'] }, error: 'P' },
      { name: 'zero power rejected', in: { P: [0, 'W'], E: [1000, 'J'], t: '' }, error: 'P' }
    ]
  },
  {
    id: 'energy-voltage-charge', title: 'Joules, Volts, Charge and eV (any two)', division: "02 Ohm's Law", version: '1.0.0',
    purpose: 'Enter any two of energy, voltage and charge. The third is calculated: joules to volts, volts to joules, eV to volts, volts to eV.',
    keywords: ['joules to volts', 'volts to joules', 'ev to volts', 'volts to ev', 'electron volt', 'electronvolt', 'coulomb', 'charge', 'joule', 'voltage'],
    inputs: [
      I('E', 'Energy', 'energy', 'J', '', { min: 0, exMin: true, optional: true, hint: 'Enter any two of energy, voltage and charge and leave the third blank. Pick eV for energy and e for charge for single-particle work' }),
      I('V', 'Voltage', 'voltage', 'V', 12, { min: 0, exMin: true, optional: true }),
      I('Q', 'Charge', 'coulomb', 'C', 2, { min: 0, exMin: true, optional: true })
    ],
    outputs: [{ key: 'E', label: 'Energy', dim: 'energy', unit: 'J', prec: 4 }, { key: 'Eev', label: 'Energy in electronvolts', dim: 'energy', unit: 'eV', prec: 4 }, { key: 'V', label: 'Voltage', dim: 'voltage', unit: 'V', prec: 4 }, { key: 'Q', label: 'Charge', dim: 'coulomb', unit: 'C', prec: 4 }],
    formula: 'E = Q × V     (1 eV = 1.602176634×10⁻¹⁹ J, the energy of one elementary charge e through 1 V)',
    assumptions: ['Magnitudes only: signs and direction are ignored', 'Charge moves through the whole potential difference', 'Elementary charge e = 1.602176634×10⁻¹⁹ C (exact SI value)'],
    notes: 'For eV to volts, enter the energy in eV and the charge in e (for one electron, 1 e). The volts figure then equals the energy in eV divided by the number of charges. This is the electrostatic relation, not a circuit power calculation.',
    next: ['power-energy-time', 'energy-converter', 'vipr-solver'],
    check(v) {
      const given = ['E', 'V', 'Q'].filter((k) => v[k] != null);
      if (given.length === 2) return [];
      const msg = given.length < 2 ? 'Enter any two of energy, voltage and charge' : 'Enter only two of energy, voltage and charge; clear the third';
      return (given.length < 2 ? ['E', 'V', 'Q'].filter((k) => v[k] == null) : given).map((k) => ({ key: k, msg }));
    },
    compute(i) {
      let E = i.E, V = i.V, Q = i.Q, how;
      if (E == null) { E = Q * V / 3600; how = `E = Q × V = ${q(Q, 'C', 6)} × ${q(V, 'V', 4)} = ${q(E, 'J', 4)}`; }
      else if (V == null) { V = E * 3600 / Q; how = `V = E / Q = ${q(E, 'J', 4)} / ${q(Q, 'C', 6)} = ${q(V, 'V', 4)}`; }
      else { Q = E * 3600 / V; how = `Q = E / V = ${q(E, 'J', 4)} / ${q(V, 'V', 4)} = ${q(Q, 'C', 6)}`; }
      return { out: { E, Eev: E, V, Q }, steps: [how, `In electronvolts: ${q(E, 'eV', 4)}; charge is ${q(Q, 'e', 4)}`], warnings: [],
        sentence: `${q(Q, 'C', 4)} through ${q(V, 'V', 3)} carries ${q(E, 'J', 4)} (${q(E, 'eV', 4)}).` };
    },
    tests: [
      { name: '2 C through 12 V is 24 J', in: { E: '', V: [12, 'V'], Q: [2, 'C'] }, out: { E: 24, Eev: 24 / 1.602176634e-19 }, tol: 1e-9 },
      { name: 'one electron through 1 V is 1 eV', in: { E: '', V: [1, 'V'], Q: [1, 'e'] }, out: { Eev: 1, E: 1.602176634e-19 }, tol: 1e-9 },
      { name: '5 eV for one electron is 5 V', in: { E: [5, 'eV'], V: '', Q: [1, 'e'] }, out: { V: 5 }, tol: 1e-9 },
      { name: '24 J at 12 V is 2 C', in: { E: [24, 'J'], V: [12, 'V'], Q: '' }, out: { Q: 2 }, tol: 1e-9 },
      { name: 'mC input converts', in: { E: '', V: [10, 'V'], Q: [500, 'mC'] }, out: { E: 5 }, tol: 1e-9 },
      { name: 'one value only is rejected', in: { E: '', V: [12, 'V'], Q: '' }, error: 'E' },
      { name: 'three values rejected', in: { E: [24, 'J'], V: [12, 'V'], Q: [2, 'C'] }, error: 'E' }
    ]
  },
  {
    id: 'battery-mah-wh', title: 'mAh to Wh and Wh to mAh', division: '07 Power / Energy', version: '1.0.0',
    purpose: 'Battery capacity in mAh, energy in Wh and nominal voltage: enter any two and the third is calculated.',
    keywords: ['mah to wh', 'wh to mah', 'ah to wh', 'wh to ah', 'milliamp hours', 'battery capacity', 'battery energy', 'power bank', 'mah', 'wh'],
    inputs: [
      I('Q', 'Battery capacity', 'charge', 'mAh', 5000, { min: 0, exMin: true, optional: true, hint: 'Enter any two of capacity, nominal voltage and energy and leave the third blank' }),
      I('V', 'Nominal voltage', 'voltage', 'V', 3.7, { min: 0, exMin: true, optional: true }),
      I('E', 'Energy', 'energy', 'Wh', '', { min: 0, exMin: true, optional: true })
    ],
    outputs: [{ key: 'Q', label: 'Battery capacity', dim: 'charge', unit: 'mAh', prec: 2 }, { key: 'V', label: 'Nominal voltage', dim: 'voltage', unit: 'V', prec: 3 }, { key: 'E', label: 'Energy', dim: 'energy', unit: 'Wh', prec: 3 }],
    formula: 'Wh = mAh × V / 1000     mAh = Wh × 1000 / V',
    assumptions: ['Nominal (mid-discharge) voltage, not the full-charge voltage', 'Constant voltage over the discharge'],
    notes: 'Cells in series add voltage (3 Li-ion cells = 11.1 V) and keep the cell capacity; cells in parallel add capacity and keep the cell voltage. Use the pack voltage. Rated energy is not usable energy: depth of discharge, converter losses and temperature reduce it.',
    next: ['energy-voltage-charge', 'power-energy-time', 'energy-converter'],
    check(v) {
      const given = ['Q', 'V', 'E'].filter((k) => v[k] != null);
      if (given.length === 2) return [];
      const msg = given.length < 2 ? 'Enter any two of capacity, voltage and energy' : 'Enter only two of capacity, voltage and energy; clear the third';
      return (given.length < 2 ? ['Q', 'V', 'E'].filter((k) => v[k] == null) : given).map((k) => ({ key: k, msg }));
    },
    compute(i) {
      let Q = i.Q, V = i.V, E = i.E, how;
      if (E == null) { E = Q * V; how = `Wh = mAh × V / 1000 = ${q(Q, 'mAh', 4)} × ${q(V, 'V', 4)} / 1000 = ${q(E, 'Wh', 4)}`; }
      else if (Q == null) { Q = E / V; how = `mAh = Wh × 1000 / V = ${q(E, 'Wh', 4)} × 1000 / ${q(V, 'V', 4)} = ${q(Q, 'mAh', 4)}`; }
      else { V = E / Q; how = `V = Wh × 1000 / mAh = ${q(E, 'Wh', 4)} × 1000 / ${q(Q, 'mAh', 4)} = ${q(V, 'V', 4)}`; }
      return { out: { Q, V, E }, steps: [how], warnings: [],
        sentence: `${q(Q, 'mAh', 1)} at ${q(V, 'V', 2)} stores ${q(E, 'Wh', 2)}.` };
    },
    tests: [
      { name: '5000 mAh at 3.7 V is 18.5 Wh', in: { Q: [5000, 'mAh'], V: [3.7, 'V'], E: '' }, out: { E: 18.5 }, tol: 1e-9 },
      { name: '18.5 Wh at 3.7 V is 5000 mAh', in: { Q: '', V: [3.7, 'V'], E: [18.5, 'Wh'] }, out: { Q: 5000 }, tol: 1e-9 },
      { name: '100 Ah at 12 V is 1200 Wh', in: { Q: [100, 'Ah'], V: [12, 'V'], E: '' }, out: { E: 1200 }, tol: 1e-9 },
      { name: '18.5 Wh over 5000 mAh is 3.7 V', in: { Q: [5000, 'mAh'], V: '', E: [18.5, 'Wh'] }, out: { V: 3.7 }, tol: 1e-9 },
      { name: 'one value only is rejected', in: { Q: [5000, 'mAh'], V: '', E: '' }, error: 'V' },
      { name: 'three values rejected', in: { Q: [5000, 'mAh'], V: [3.7, 'V'], E: [18.5, 'Wh'] }, error: 'Q' }
    ]
  },
  C('resistance-series', 'Resistors in Series', '04 DC Circuits', 'Total resistance of up to three resistors in series.', ['resistance', 'resistor', 'series', 'total'],
    [I('R1', 'Resistor 1', 'resistance', 'Ω', 100, { min: 0, exMin: true }), I('R2', 'Resistor 2', 'resistance', 'Ω', 220, { min: 0, exMin: true }), I('R3', 'Resistor 3', 'resistance', 'Ω', 330, { min: 0, exMin: true })],
    [{ key: 'Rt', label: 'Total resistance', dim: 'resistance', unit: 'Ω', prec: 3 }], 'Rt = R1 + R2 + R3', ['Resistors are not coupled', 'Values are at the same temperature'], 'For two resistors, enter a very small third value (zero is not accepted).', ['resistance-parallel', 'ohms-law'],
    (i) => { const Rt = i.R1 + i.R2 + i.R3; return { out: { Rt }, steps: [`Rt = ${fmt(i.R1, 3)} + ${fmt(i.R2, 3)} + ${fmt(i.R3, 3)} = ${fmt(Rt, 3)} Ω`], sentence: `Three resistors in series total ${fmt(Rt, 2)} Ω.` }; },
    [{ name: '100 + 220 + 330', in: { R1: [100, 'Ω'], R2: [220, 'Ω'], R3: [330, 'Ω'] }, out: { Rt: 650 }, tol: 1e-9 }, { name: 'kΩ input', in: { R1: [1, 'kΩ'], R2: [1, 'kΩ'], R3: [1, 'kΩ'] }, out: { Rt: 3000 }, tol: 1e-9 }]),
  C('resistance-parallel', 'Resistors in Parallel', '04 DC Circuits', 'Equivalent resistance of up to three resistors in parallel.', ['resistance', 'resistor', 'parallel', 'equivalent'],
    [I('R1', 'Resistor 1', 'resistance', 'Ω', 100, { min: 0, exMin: true }), I('R2', 'Resistor 2', 'resistance', 'Ω', 220, { min: 0, exMin: true }), I('R3', 'Resistor 3', 'resistance', 'Ω', 330, { min: 0, exMin: true })],
    [{ key: 'Rt', label: 'Equivalent resistance', dim: 'resistance', unit: 'Ω', prec: 3 }], '1/Rt = 1/R1 + 1/R2 + 1/R3', ['Resistors are not coupled'], 'The result is always below the smallest branch. For two resistors, enter a very large third value (zero is not accepted).', ['resistance-series', 'ohms-law'],
    (i) => { const Rt = 1 / (1 / i.R1 + 1 / i.R2 + 1 / i.R3); return { out: { Rt }, steps: [`1/Rt = 1/${fmt(i.R1, 3)} + 1/${fmt(i.R2, 3)} + 1/${fmt(i.R3, 3)}`, `Rt = ${fmt(Rt, 4)} Ω`], sentence: `Three resistors in parallel are equivalent to ${fmt(Rt, 2)} Ω.` }; },
    [{ name: '100, 220, 330 Ω', in: { R1: [100, 'Ω'], R2: [220, 'Ω'], R3: [330, 'Ω'] }, out: { Rt: 56.89655 }, tol: 1e-5 }, { name: 'three equal 300 Ω give 100 Ω', in: { R1: [300, 'Ω'], R2: [300, 'Ω'], R3: [300, 'Ω'] }, out: { Rt: 100 }, tol: 1e-9 }]),
  C('capacitance-series-parallel', 'Capacitors in Series and Parallel', '21 Capacitors', 'Combined capacitance of three capacitors, both ways.', ['capacitance', 'capacitor', 'series', 'parallel', 'farad'],
    [I('C1', 'Capacitor 1', 'capacitance', 'µF', 10, { min: 0, exMin: true }), I('C2', 'Capacitor 2', 'capacitance', 'µF', 22, { min: 0, exMin: true }), I('C3', 'Capacitor 3', 'capacitance', 'µF', 47, { min: 0, exMin: true })],
    [{ key: 'Cp', label: 'In parallel', dim: 'capacitance', unit: 'µF', prec: 3 }, { key: 'Cs', label: 'In series', dim: 'capacitance', unit: 'µF', prec: 4 }], 'Parallel: C = C1 + C2 + C3     Series: 1/C = 1/C1 + 1/C2 + 1/C3', ['Ideal capacitors', 'Voltage ratings are not checked'], 'In series the voltage divides unequally unless the values match; check each rating. For two capacitors, enter a very small third value for the parallel result or a very large one for the series result (zero is not accepted).', ['reactance', 'pf-correction-kvar'],
    (i) => { const Cp = i.C1 + i.C2 + i.C3, Cs = 1 / (1 / i.C1 + 1 / i.C2 + 1 / i.C3); return { out: { Cp, Cs }, steps: [`Parallel = ${fmt(Cp * 1e6, 4)} µF`, `Series = ${fmt(Cs * 1e6, 5)} µF`], sentence: `The three capacitors give ${fmt(Cp * 1e6, 2)} µF in parallel and ${fmt(Cs * 1e6, 3)} µF in series.` }; },
    [{ name: '10, 22, 47 µF', in: { C1: [10, 'µF'], C2: [22, 'µF'], C3: [47, 'µF'] }, out: { Cp: 79, Cs: 5.99768 }, tol: 1e-5 }, { name: 'nF input', in: { C1: [1000, 'nF'], C2: [1000, 'nF'], C3: [1000, 'nF'] }, out: { Cp: 3, Cs: 0.333333 }, tol: 1e-5 }]),
  C('inductance-series-parallel', 'Inductors in Series and Parallel', '03 AC Circuits', 'Combined inductance of three inductors, both ways.', ['inductance', 'inductor', 'series', 'parallel', 'henry'],
    [I('L1', 'Inductor 1', 'inductance', 'mH', 10, { min: 0, exMin: true }), I('L2', 'Inductor 2', 'inductance', 'mH', 22, { min: 0, exMin: true }), I('L3', 'Inductor 3', 'inductance', 'mH', 47, { min: 0, exMin: true })],
    [{ key: 'Ls', label: 'In series', dim: 'inductance', unit: 'mH', prec: 3 }, { key: 'Lp', label: 'In parallel', dim: 'inductance', unit: 'mH', prec: 4 }], 'Series: L = L1 + L2 + L3     Parallel: 1/L = 1/L1 + 1/L2 + 1/L3', ['No mutual coupling between inductors'], 'Coupled coils need the mutual inductance term, which is not modelled. For two inductors, enter a very small third value for the series result or a very large one for the parallel result (zero is not accepted).', ['reactance', 'impedance-rlc'],
    (i) => { const Ls = i.L1 + i.L2 + i.L3, Lp = 1 / (1 / i.L1 + 1 / i.L2 + 1 / i.L3); return { out: { Ls, Lp }, steps: [`Series = ${fmt(Ls * 1e3, 4)} mH`, `Parallel = ${fmt(Lp * 1e3, 5)} mH`], sentence: `The three inductors give ${fmt(Ls * 1e3, 2)} mH in series and ${fmt(Lp * 1e3, 3)} mH in parallel.` }; },
    [{ name: '10, 22, 47 mH', in: { L1: [10, 'mH'], L2: [22, 'mH'], L3: [47, 'mH'] }, out: { Ls: 79, Lp: 5.99768 }, tol: 1e-5 }, { name: 'H input', in: { L1: [1, 'H'], L2: [1, 'H'], L3: [1, 'H'] }, out: { Ls: 3000, Lp: 333.333 }, tol: 1e-5 }]),
  C('reactance', 'Inductive and Capacitive Reactance', '03 AC Circuits', 'Reactance of an inductor and a capacitor at a given frequency.', ['reactance', 'inductive', 'capacitive', 'xl', 'xc', 'frequency'],
    [I('f', 'Frequency', 'frequency', 'Hz', 50, { min: 0, exMin: true }), I('L', 'Inductance', 'inductance', 'mH', 100, { min: 0, exMin: true }), I('C', 'Capacitance', 'capacitance', 'µF', 100, { min: 0, exMin: true })],
    [{ key: 'XL', label: 'Inductive reactance XL', dim: 'resistance', unit: 'Ω', prec: 3 }, { key: 'XC', label: 'Capacitive reactance XC', dim: 'resistance', unit: 'Ω', prec: 3 }], 'XL = 2π f L     XC = 1 / (2π f C)', ['Sinusoidal, single frequency', 'Ideal components'], 'Where XL equals XC the series circuit is at resonance.', ['impedance-rlc'],
    (i) => { const XL = 2 * Math.PI * i.f * i.L, XC = 1 / (2 * Math.PI * i.f * i.C); return { out: { XL, XC }, steps: [`XL = 2π × ${fmt(i.f, 2)} × ${fmt(i.L, 5)} = ${fmt(XL, 4)} Ω`, `XC = 1 / (2π × ${fmt(i.f, 2)} × ${fmt(i.C * 1e6, 3)} µF) = ${fmt(XC, 4)} Ω`], sentence: `At ${q(i.f, 'Hz', 1)} the inductor presents ${fmt(XL, 2)} Ω and the capacitor ${fmt(XC, 2)} Ω.` }; },
    [{ name: '50 Hz, 100 mH, 100 µF', in: { f: [50, 'Hz'], L: [100, 'mH'], C: [100, 'µF'] }, out: { XL: 31.41593, XC: 31.83099 }, tol: 1e-5 }, { name: 'kHz input', in: { f: [1, 'kHz'], L: [1, 'mH'], C: [1, 'µF'] }, out: { XL: 6.283185, XC: 159.1549 }, tol: 1e-5 }]),
  C('impedance-rlc', 'Series RLC Impedance', '03 AC Circuits', 'Impedance, phase angle and power factor of a series R-L-C circuit.', ['impedance', 'rlc', 'series', 'phase', 'resonance'],
    [I('R', 'Resistance', 'resistance', 'Ω', 10, { min: 0, exMin: true }), I('L', 'Inductance', 'inductance', 'mH', 100, { min: 0, exMin: true }), I('C', 'Capacitance', 'capacitance', 'µF', 100, { min: 0, exMin: true }), I('f', 'Frequency', 'frequency', 'Hz', 50, { min: 0, exMin: true })],
    [{ key: 'Z', label: 'Impedance |Z|', dim: 'resistance', unit: 'Ω', prec: 3 }, { key: 'phi', label: 'Phase angle (degrees, + inductive)', dim: 'number', unit: '', prec: 2 }, { key: 'pf', label: 'Power factor', dim: 'number', unit: '', prec: 4 }], 'X = XL − XC     |Z| = √(R² + X²)     φ = atan(X / R)', ['Series connection', 'Sinusoidal, single frequency'], 'A negative angle means the circuit is capacitive.', ['reactance', 'power-factor'],
    (i) => { const XL = 2 * Math.PI * i.f * i.L, XC = 1 / (2 * Math.PI * i.f * i.C), X = XL - XC, Z = Math.hypot(i.R, X), phi = Math.atan2(X, i.R) * 180 / Math.PI, w = []; if (Math.abs(X) < 0.01 * Math.max(XL, XC)) w.push('Reactances nearly cancel: the circuit is close to series resonance.'); return { out: { Z, phi, pf: i.R / Z }, steps: [`XL = ${fmt(XL, 4)} Ω, XC = ${fmt(XC, 4)} Ω, X = ${fmt(X, 4)} Ω`, `|Z| = √(${fmt(i.R, 3)}² + ${fmt(X, 4)}²) = ${fmt(Z, 4)} Ω`, `φ = atan(X / R) = ${fmt(phi, 3)}°`], warnings: w, sentence: `The series circuit has ${fmt(Z, 2)} Ω impedance at ${fmt(phi, 1)}° and a power factor of ${fmt(i.R / Z, 3)}.` }; },
    [{ name: '10 Ω, 100 mH, 100 µF, 50 Hz', in: { R: [10, 'Ω'], L: [100, 'mH'], C: [100, 'µF'], f: [50, 'Hz'] }, out: { Z: 10.00861, phi: -2.37677, pf: 0.99914 }, tol: 1e-4 }, { name: 'zero resistance rejected', in: { R: [0, 'Ω'], L: [100, 'mH'], C: [100, 'µF'], f: [50, 'Hz'] }, error: 'R' }]),
  C('frequency-period', 'Frequency and Period', '03 AC Circuits', 'Period and angular frequency from frequency.', ['frequency', 'period', 'hz', 'angular', 'cycle'],
    [I('f', 'Frequency', 'frequency', 'Hz', 50, { min: 0, exMin: true })],
    [{ key: 'T', label: 'Period', dim: 'time', unit: 'ms', prec: 3 }, { key: 'w', label: 'Angular frequency (rad/s)', dim: 'number', unit: '', prec: 2 }], 'T = 1 / f     ω = 2π f', ['Periodic sinusoidal signal'], 'At 50 Hz one cycle takes 20 ms; at 60 Hz, 16.67 ms.', ['reactance', 'rms-peak'],
    (i) => { const T = 1 / i.f, w = 2 * Math.PI * i.f; return { out: { T, w }, steps: [`T = 1 / f = 1 / ${fmt(i.f, 3)} = ${fmt(T * 1e3, 4)} ms`, `ω = 2π f = ${fmt(w, 3)} rad/s`], sentence: `${q(i.f, 'Hz', 2)} has a period of ${fmt(T * 1e3, 3)} ms.` }; },
    [{ name: '50 Hz', in: { f: [50, 'Hz'] }, out: { T: 20, w: 314.1593 }, tol: 1e-6 }, { name: '1 kHz', in: { f: [1, 'kHz'] }, out: { T: 1, w: 6283.185 }, tol: 1e-6 }]),
  C('rms-peak', 'RMS, Peak and Peak-to-Peak', '03 AC Circuits', 'RMS and peak-to-peak voltage of a sine wave from its peak.', ['rms', 'peak', 'peak-to-peak', 'sine', 'amplitude'],
    [I('Vp', 'Peak voltage', 'voltage', 'V', 325, { min: 0, exMin: true })],
    [{ key: 'Vrms', label: 'RMS voltage', dim: 'voltage', unit: 'V', prec: 2 }, { key: 'Vpp', label: 'Peak-to-peak', dim: 'voltage', unit: 'V', prec: 1 }], 'Vrms = Vpeak / √2     Vpp = 2 × Vpeak', ['Pure sine wave, no DC offset'], 'Other waveforms have different crest factors.', ['frequency-period', 'ohms-law'],
    (i) => { const r = i.Vp / Math.SQRT2; return { out: { Vrms: r, Vpp: 2 * i.Vp }, steps: [`Vrms = ${fmt(i.Vp, 3)} / √2 = ${fmt(r, 4)} V`, `Vpp = 2 × ${fmt(i.Vp, 3)} = ${fmt(2 * i.Vp, 3)} V`], sentence: `A ${q(i.Vp, 'V', 1)} peak sine wave is ${fmt(r, 2)} V RMS.` }; },
    [{ name: '100 V peak', in: { Vp: [100, 'V'] }, out: { Vrms: 70.71068, Vpp: 200 }, tol: 1e-6 }, { name: '325 V peak is about 230 V RMS', in: { Vp: [325, 'V'] }, out: { Vrms: 229.8097 }, tol: 1e-6 }]),
  C('watts-to-amps', 'Watts to Amps', '05 Single Phase', 'Current drawn by a single-phase or DC load from watts and voltage.', ['watts', 'amps', 'single', 'phase', 'dc', 'current'],
    [I('P', 'Power', 'power', 'W', 1000, { min: 0, exMin: true }), I('V', 'Voltage', 'voltage', 'V', 230, { min: 0, exMin: true, hint: VHINT }), PF(1), PHASE_ALL(1), VTYPE],
    [{ key: 'I', label: 'Current', dim: 'current', unit: 'A', prec: 3 }], 'I = P / (k × V × pf)     k = 1 (single-phase, DC), √3 (three-phase L-L) or 3 (three-phase L-N)', ['Single-phase AC by default; choose DC or three-phase above', 'V is RMS', 'DC takes the power factor as 1'], 'Choose DC to ignore the power factor. For a larger three-phase load the kW to amps calculator also takes efficiency.', ['amps-to-watts', 'three-phase-current'],
    (i) => { const c = circ(i), Ic = i.P / (c.k * i.V * c.pf), w = []; if (!c.dc && i.pf < 0.7) w.push('Power factor below 0.7 is unusual. Check the value.'); return { out: { I: Ic }, steps: [`I = P / (${c.kt}V${c.dc ? '' : ' × pf'}) = ${fmt(i.P, 1)} / (${c.kt}${fmt(i.V, 1)}${c.dc ? '' : ' × ' + fmt(i.pf, 3)}) = ${fmt(Ic, 4)} A`], warnings: w, sentence: `${q(i.P, 'W', 0)} at ${q(i.V, 'V', 0)} (${c.name}${c.dc ? '' : ', power factor ' + fmt(i.pf, 2)}) draws ${fmt(Ic, 2)} A.` }; },
    [{ name: '1000 W, 230 V, PF 1', in: { P: [1000, 'W'], V: [230, 'V'], pf: 1 }, out: { I: 4.347826 }, tol: 1e-6 }, { name: '2300 W, 230 V, PF 0.9', in: { P: [2300, 'W'], V: [230, 'V'], pf: 0.9 }, out: { I: 11.11111 }, tol: 1e-6 }, { name: 'PF 0 rejected', in: { P: [1000, 'W'], V: [230, 'V'], pf: 0 }, error: 'pf' }, { name: 'DC: 120 W at 12 V is 10 A, PF ignored', in: { P: [120, 'W'], V: [12, 'V'], pf: 0.5, phase: 0 }, out: { I: 10 }, tol: 1e-9 }, { name: 'three-phase: 10 kW at 400 V, PF 0.9', in: { P: [10000, 'W'], V: [400, 'V'], pf: 0.9, phase: 3 }, out: { I: 16.037507 }, tol: 1e-6 }]),
  C('amps-to-watts', 'Amps to Watts', '05 Single Phase', 'Real power of a single-phase or DC load from current and voltage.', ['amps', 'watts', 'single', 'phase', 'dc', 'power'],
    [I('I', 'Current', 'current', 'A', 10, { min: 0, exMin: true }), I('V', 'Voltage', 'voltage', 'V', 230, { min: 0, exMin: true, hint: VHINT }), PF(0.9), PHASE_ALL(1), VTYPE],
    [{ key: 'P', label: 'Real power', dim: 'power', unit: 'W', prec: 1 }], 'P = k × V × I × pf     k = 1 (single-phase, DC), √3 (three-phase L-L) or 3 (three-phase L-N)', ['Single-phase AC by default; choose DC or three-phase above', 'V is RMS', 'DC takes the power factor as 1'], 'Choose DC to ignore the power factor.', ['watts-to-amps', 'amps-to-kw'],
    (i) => { const c = circ(i), P = c.k * i.V * i.I * c.pf; return { out: { P }, steps: [`P = ${c.kt}${fmt(i.V, 1)} × ${fmt(i.I, 3)}${c.dc ? '' : ' × ' + fmt(i.pf, 3)} = ${fmt(P, 2)} W`], sentence: `${fmt(i.I, 2)} A at ${q(i.V, 'V', 0)} (${c.name}${c.dc ? '' : ', power factor ' + fmt(i.pf, 2)}) is ${fmt(P, 1)} W.` }; },
    [{ name: '10 A, 230 V, PF 0.9', in: { I: [10, 'A'], V: [230, 'V'], pf: 0.9 }, out: { P: 2070 }, tol: 1e-9 }, { name: 'mA input', in: { I: [500, 'mA'], V: [12, 'V'], pf: 1 }, out: { P: 6 }, tol: 1e-9 }, { name: 'DC: 2 A at 12 V is 24 W, PF ignored', in: { I: [2, 'A'], V: [12, 'V'], pf: 0.5, phase: 0 }, out: { P: 24 }, tol: 1e-9 }, { name: 'three-phase L-N: 10 A, 230 V, PF 0.9', in: { I: [10, 'A'], V: [230, 'V'], pf: 0.9, phase: 3, vt: 1 }, out: { P: 6210 }, tol: 1e-9 }]),
  C('amps-to-kw', 'Amps to kW', '06 Three Phase', 'Real power from line current, voltage and power factor, with optional efficiency for output (shaft) power.', ['amps', 'kw', 'power', 'three', 'phase'],
    [I('I', 'Line current', 'current', 'A', 100, { min: 0, exMin: true }), I('V', 'Voltage', 'voltage', 'V', 400, { min: 0, exMin: true, hint: VHINT }), PF(0.9), PHASE_ALL(3), VTYPE,
      I('eff', 'Efficiency', 'number', '', 1, { min: 0, max: 1, exMin: true, mode: 'engineering', hint: 'Use 1 for electrical input power. Enter the motor or drive efficiency (for example 0.92) to get the output power as well' })],
    [{ key: 'P', label: 'Real power', dim: 'power', unit: 'kW', prec: 3 }, { key: 'Pout', label: 'Output power (P × η)', dim: 'power', unit: 'kW', prec: 3 }], 'P = √3 × V × I × pf     (three-phase L-N: 3 × V × I × pf; single-phase: V × I × pf; DC: V × I)     Output = η × P', ['Balanced load', 'V is line-to-line RMS for three-phase unless line-to-neutral is chosen', 'DC takes the power factor as 1', 'Efficiency 1 means output power equals input power'], 'Real power is electrical input power. Output (shaft) power is P × η and equals P when efficiency is 1.', ['amps-to-kva', 'three-phase-power'],
    (i) => { const c = circ(i), P = c.k * i.V * i.I * c.pf, Po = P * i.eff, w = []; if (!c.dc && i.pf < 0.7) w.push('Power factor below 0.7 is unusual for a loaded circuit. Check the value.'); const st = [`P = ${c.kt}${fmt(i.V, 1)} × ${fmt(i.I, 2)}${c.dc ? '' : ' × ' + fmt(i.pf, 3)} = ${fmt(P / 1000, 4)} kW`]; if (i.eff !== 1) st.push(`Output = η × P = ${fmt(i.eff, 3)} × ${fmt(P / 1000, 4)} = ${fmt(Po / 1000, 4)} kW`); return { out: { P, Pout: Po }, steps: st, warnings: w, sentence: `${fmt(i.I, 1)} A at ${q(i.V, 'V', 0)} (${c.name}${c.dc ? '' : ', PF ' + fmt(i.pf, 2)}) is ${fmt(P / 1000, 2)} kW input${i.eff !== 1 ? ' and ' + fmt(Po / 1000, 2) + ' kW output at ' + fmt(i.eff, 2) + ' efficiency' : ''}.` }; },
    [{ name: '100 A, 400 V, PF 0.9, 3-phase', in: { I: [100, 'A'], V: [400, 'V'], pf: 0.9, phase: 3 }, out: { P: 62.35383 }, tol: 1e-6 }, { name: '20 A, 230 V, PF 1, single-phase', in: { I: [20, 'A'], V: [230, 'V'], pf: 1, phase: 1 }, out: { P: 4.6 }, tol: 1e-9 }, { name: 'DC: 20 A at 48 V is 0.96 kW, PF ignored', in: { I: [20, 'A'], V: [48, 'V'], pf: 0.5, phase: 0 }, out: { P: 0.96 }, tol: 1e-9 }, { name: 'three-phase L-N: 100 A, 230 V, PF 0.9', in: { I: [100, 'A'], V: [230, 'V'], pf: 0.9, phase: 3, vt: 1 }, out: { P: 62.1 }, tol: 1e-9 }, { name: 'efficiency 0.9 gives output power', in: { I: [100, 'A'], V: [400, 'V'], pf: 0.9, phase: 3, eff: 0.9 }, out: { P: 62.35383, Pout: 56.118447 }, tol: 1e-6 }, { name: 'efficiency above 1 rejected', in: { I: [100, 'A'], V: [400, 'V'], pf: 0.9, eff: 1.2 }, error: 'eff' }]),
  C('amps-to-kva', 'Amps to kVA', '06 Three Phase', 'Apparent power from line current and voltage.', ['amps', 'kva', 'apparent', 'three', 'phase'],
    [I('I', 'Line current', 'current', 'A', 100, { min: 0, exMin: true }), I('V', 'Voltage', 'voltage', 'V', 415, { min: 0, exMin: true, hint: VHINT }), PHASE_ALL(3), VTYPE],
    [{ key: 'S', label: 'Apparent power', dim: 'apparent', unit: 'kVA', prec: 2 }], 'S = √3 × V × I     (three-phase L-N: 3 × V × I; single-phase and DC: V × I)', ['Balanced load', 'V is line-to-line RMS for three-phase unless line-to-neutral is chosen', 'For DC, kVA is the same as kW'], 'Power factor does not enter apparent power.', ['amps-to-kw', 'kva-to-amps'],
    (i) => { const c = circ(i), S = c.k * i.V * i.I; return { out: { S }, steps: [`S = ${c.kt}${fmt(i.V, 1)} × ${fmt(i.I, 2)} = ${fmt(S / 1000, 4)} kVA`], sentence: `${fmt(i.I, 1)} A at ${q(i.V, 'V', 0)} (${c.name}) is ${fmt(S / 1000, 2)} kVA.` }; },
    [{ name: '100 A, 415 V, 3-phase', in: { I: [100, 'A'], V: [415, 'V'], phase: 3 }, out: { S: 71.88011 }, tol: 1e-6 }, { name: '20 A, 230 V, single-phase', in: { I: [20, 'A'], V: [230, 'V'], phase: 1 }, out: { S: 4.6 }, tol: 1e-9 }, { name: 'DC: 20 A at 48 V is 0.96 kVA', in: { I: [20, 'A'], V: [48, 'V'], phase: 0 }, out: { S: 0.96 }, tol: 1e-9 }, { name: 'three-phase L-N: 100 A, 230 V', in: { I: [100, 'A'], V: [230, 'V'], phase: 3, vt: 1 }, out: { S: 69 }, tol: 1e-9 }]),
  C('kva-to-kw', 'kVA to kW', '08 Power Factor', 'Real and reactive power from apparent power and power factor.', ['kva', 'kw', 'real', 'power factor', 'kvar'],
    [I('S', 'Apparent power', 'apparent', 'kVA', 100, { min: 0, exMin: true }), PF(0.8)],
    [{ key: 'P', label: 'Real power', dim: 'power', unit: 'kW', prec: 2 }, { key: 'Q', label: 'Reactive power', dim: 'reactive', unit: 'kVAR', prec: 2 }], 'P = S × pf     Q = √(S² − P²)', ['Sinusoidal waveforms'], 'Use the correction calculator to size capacitors.', ['kw-to-kva', 'pf-correction-kvar'],
    (i) => { const P = i.S * i.pf, Q = Math.sqrt(Math.max(i.S * i.S - P * P, 0)); return { out: { P, Q }, steps: [`P = S × pf = ${q(i.S, 'kVA', 2)} × ${fmt(i.pf, 3)} = ${q(P, 'kW', 3)}`, `Q = √(S² − P²) = ${q(Q, 'kVAR', 3)}`], sentence: `${q(i.S, 'kVA', 1)} at ${fmt(i.pf, 2)} power factor is ${q(P, 'kW', 2)} real and ${q(Q, 'kVAR', 2)} reactive.` }; },
    [{ name: '100 kVA at PF 0.8', in: { S: [100, 'kVA'], pf: 0.8 }, out: { P: 80, Q: 60 }, tol: 1e-9 }, { name: 'unity PF', in: { S: [50, 'kVA'], pf: 1 }, out: { P: 50 }, tol: 1e-9 }, { name: 'PF 0 rejected', in: { S: [50, 'kVA'], pf: 0 }, error: 'pf' }]),
  C('three-phase-power', 'Three-Phase Power', '06 Three Phase', 'Real, apparent and reactive power from voltage, current and power factor.', ['three', 'phase', 'power', 'kw', 'kva', 'kvar'],
    [I('V', 'Line voltage (L-L)', 'voltage', 'V', 400, { min: 0, exMin: true }), I('I', 'Line current', 'current', 'A', 100, { min: 0, exMin: true }), PF(0.9)],
    [{ key: 'P', label: 'Real power', dim: 'power', unit: 'kW', prec: 3 }, { key: 'S', label: 'Apparent power', dim: 'apparent', unit: 'kVA', prec: 3 }, { key: 'Q', label: 'Reactive power', dim: 'reactive', unit: 'kVAR', prec: 3 }], 'S = √3 × V × I     P = S × pf     Q = S × sin φ', ['Balanced three-phase load', 'V is line-to-line RMS'], 'Q is a magnitude; lagging or leading is not distinguished.', ['amps-to-kw', 'pf-correction-kvar'],
    (i) => { const S = SQ3 * i.V * i.I, P = S * i.pf, Q = S * Math.sqrt(1 - i.pf * i.pf); return { out: { P, S, Q }, steps: [`S = √3 × ${fmt(i.V, 1)} × ${fmt(i.I, 2)} = ${q(S, 'kVA', 3)}`, `P = S × pf = ${q(P, 'kW', 3)}`, `Q = S × sin φ = ${q(Q, 'kVAR', 3)}`], sentence: `${q(i.V, 'V', 0)} and ${fmt(i.I, 1)} A at ${fmt(i.pf, 2)} power factor is ${q(P, 'kW', 1)}, ${q(S, 'kVA', 1)} and ${q(Q, 'kVAR', 1)}.` }; },
    [{ name: '400 V, 100 A, PF 0.9', in: { V: [400, 'V'], I: [100, 'A'], pf: 0.9 }, out: { P: 62.35383, S: 69.28203, Q: 30.19934 }, tol: 1e-6 }, { name: 'PF 1 has no reactive part', in: { V: [400, 'V'], I: [100, 'A'], pf: 1 }, out: { P: 69.28203 }, tol: 1e-6 }]),
  C('power-factor', 'Power Factor', '08 Power Factor', 'Power factor from real and apparent power.', ['power factor', 'pf', 'cos', 'kw', 'kva'],
    [I('P', 'Real power', 'power', 'kW', 80, { min: 0, exMin: true }), I('S', 'Apparent power', 'apparent', 'kVA', 100, { min: 0, exMin: true })],
    [{ key: 'pf', label: 'Power factor', dim: 'number', unit: '', prec: 3 }, { key: 'phi', label: 'Phase angle (degrees)', dim: 'number', unit: '', prec: 2 }], 'pf = P / S     φ = arccos(pf)', ['Sinusoidal waveforms'], 'Below about 0.9 many utilities apply a penalty; check your tariff.', ['pf-correction-kvar', 'kw-to-kva'],
    (i) => { const pf = i.P / i.S, w = []; if (pf < 0.85) w.push('Power factor below 0.85: correction is usually worthwhile.'); return { out: { pf, phi: Math.acos(pf) * 180 / Math.PI }, steps: [`pf = ${q(i.P, 'kW', 2)} / ${q(i.S, 'kVA', 2)} = ${fmt(pf, 4)}`, `φ = arccos(${fmt(pf, 4)}) = ${fmt(Math.acos(pf) * 180 / Math.PI, 3)}°`], warnings: w, sentence: `${q(i.P, 'kW', 1)} of ${q(i.S, 'kVA', 1)} is a power factor of ${fmt(pf, 3)}.` }; },
    (v) => { return v.P > v.S ? [{ key: 'P', msg: 'Real power cannot exceed apparent power' }] : []; },
    [{ name: '80 kW of 100 kVA', in: { P: [80, 'kW'], S: [100, 'kVA'] }, out: { pf: 0.8, phi: 36.8699 }, tol: 1e-5 }, { name: 'equal values give unity', in: { P: [50, 'kW'], S: [50, 'kVA'] }, out: { pf: 1 }, tol: 1e-9 }, { name: 'real above apparent rejected', in: { P: [120, 'kW'], S: [100, 'kVA'] }, error: 'P' }]),
  C('cable-resistance', 'Cable Resistance', '10 Cable and Wire', 'Conductor resistance from length, cross-section and material.', ['cable', 'wire', 'resistance', 'conductor', 'copper', 'aluminium', 'resistivity'],
    [I('L', 'Length', 'length', 'm', 100, { min: 0, exMin: true }), I('A', 'Cross-section', 'area', 'mm²', 16, { min: 0, exMin: true }), I('rho', 'Resistivity at 20 °C (Ω·mm²/m)', 'number', '', 0.017241, { min: 0, exMin: true, hint: 'Copper 0.017241, aluminium 0.02826' }),
      I('T', 'Operating temperature (°C)', 'number', '', 20, { min: -50, max: 250, mode: 'engineering' }), I('alpha', 'Temperature coefficient (per °C)', 'number', '', 0.00393, { min: 0, max: 0.01, exMin: true, mode: 'engineering', hint: 'Copper 0.00393, aluminium 0.00403' })],
    [{ key: 'R', label: 'Resistance', dim: 'resistance', unit: 'Ω', prec: 4 }, { key: 'Rk', label: 'Per unit length', dim: 'resPerLen', unit: 'Ω/km', prec: 4 }], 'R = ρ × [1 + α (T − 20)] × L / A', ['Single conductor, one way', 'Linear temperature correction', 'DC resistance, no skin or proximity effect'], 'Use the loop (out and back) value for a two-wire circuit.', ['voltage-drop', 'max-cable-length'],
    (i) => { const k = 1 + i.alpha * (i.T - 20), R = i.rho * k * (i.L / (i.A * 1e6)) * 1e-0 ; return { out: { R, Rk: R / i.L }, steps: [`Temperature factor = 1 + α (T − 20) = ${fmt(k, 5)}`, `R = ρ × factor × L / A = ${fmt(R, 5)} Ω`], sentence: `${q(i.L, 'm', 0)} of ${fmt(i.A * 1e6, 1)} mm² conductor has ${fmt(R, 4)} Ω resistance.` }; },
    [{ name: '100 m, 16 mm² copper at 20 °C', in: { L: [100, 'm'], A: [16, 'mm²'], rho: 0.017241, T: 20, alpha: 0.00393 }, out: { R: 0.10775625 }, tol: 1e-6 }, { name: 'same cable at 70 °C', in: { L: [100, 'm'], A: [16, 'mm²'], rho: 0.017241, T: 70, alpha: 0.00393 }, out: { R: 0.12893035 }, tol: 1e-6 }, { name: 'zero area rejected', in: { L: [100, 'm'], A: [0, 'mm²'], rho: 0.017241, T: 20, alpha: 0.00393 }, error: 'A' }]),
  C('wire-gauge-conversion', 'AWG to Diameter and Area', '10 Cable and Wire', 'Wire diameter and cross-section from an AWG number.', ['awg', 'awg chart', 'wire', 'gauge', 'wire gauge', 'diameter', 'mm2', 'conversion'],
    [I('n', 'AWG (use −1 for 00, −2 for 000, −3 for 0000)', 'number', '', 10, { min: -3, max: 40 })],
    [{ key: 'd', label: 'Diameter', dim: 'length', unit: 'mm', prec: 3 }, { key: 'A', label: 'Cross-section', dim: 'area', unit: 'mm²', prec: 3 }], 'd = 0.127 mm × 92^((36 − n) / 39)     A = π d² / 4', ['Solid round conductor', 'Standard AWG definition'], 'Stranded conductors have a slightly larger overall diameter. The full AWG 0000 to 40 chart, with a cross-section to AWG lookup, is at #awg-chart.', ['cable-resistance', 'voltage-drop'],
    (i) => { const d = 0.127e-3 * Math.pow(92, (36 - i.n) / 39), A = Math.PI * d * d / 4; return { out: { d, A }, steps: [`d = 0.127 × 92^((36 − ${fmt(i.n, 0)}) / 39) = ${fmt(d * 1e3, 4)} mm`, `A = π d² / 4 = ${fmt(A * 1e6, 4)} mm²`], sentence: `AWG ${fmt(i.n, 0)} is ${fmt(d * 1e3, 3)} mm across, ${fmt(A * 1e6, 2)} mm² in area.` }; },
    [{ name: 'AWG 10', in: { n: 10 }, out: { d: 2.588187, A: 5.261155 }, tol: 1e-6 }, { name: 'AWG 0', in: { n: 0 }, out: { d: 8.251463, A: 53.47512 }, tol: 1e-6 }, { name: 'AWG above 40 rejected', in: { n: 41 }, error: 'n' }]),
  C('max-cable-length', 'Maximum Cable Length', '09 Voltage Drop', 'Longest run that keeps voltage drop within a limit.', ['maximum', 'cable', 'length', 'distance', 'voltage', 'drop', 'run'],
    [I('I', 'Load current', 'current', 'A', 100, { min: 0, exMin: true }), I('V', 'System voltage (L-L)', 'voltage', 'V', 400, { min: 0, exMin: true }), I('lim', 'Allowed drop (%)', 'number', '', 3, { min: 0, max: 20, exMin: true }), I('R', 'Cable resistance', 'resPerLen', 'Ω/km', 0.1, { min: 0, exMin: true }),
      I('X', 'Cable reactance', 'resPerLen', 'Ω/km', 0.08, { min: 0, mode: 'engineering' }), PF(0.9), PHASE, PARALLEL_N],
    [{ key: 'L', label: 'Maximum length', dim: 'length', unit: 'm', prec: 0 }], 'L = n × (limit% × V) / (√3 × I × (R cos φ + X sin φ))     (n = conductors per phase in parallel)', ['Balanced load', 'R and X are per-km values for one conductor, supplied by the user', 'Parallel conductors are identical, the same length and share the current equally', 'Single-phase uses out-and-return path'], 'Check cable ampacity and fault withstand separately.', ['voltage-drop', 'cable-resistance'],
    (i) => { const sin = Math.sqrt(1 - i.pf * i.pf), n = i.n || 1, z = (i.R * i.pf + i.X * sin) / n, k = i.phase === 3 ? SQ3 : 2, L = (i.lim / 100 * i.V) / (k * i.I * z); return { out: { L }, steps: [n > 1 ? `Z = (R cos φ + X sin φ) / ${n} conductors = ${fmt(z * 1000, 4)} Ω/km` : `Z = R cos φ + X sin φ = ${fmt(z * 1000, 4)} Ω/km`, `L = ${fmt(i.lim, 2)}% × ${fmt(i.V, 1)} / (${i.phase === 3 ? '√3' : '2'} × ${fmt(i.I, 2)} × Z) = ${fmt(L, 1)} m`], sentence: `At ${fmt(i.I, 1)} A the cable can run ${fmt(L, 0)} m before the drop passes ${fmt(i.lim, 1)}% of ${q(i.V, 'V', 0)}.` }; },
    [{ name: '100 A, 400 V, 3%, 0.1 Ω/km, PF 1', in: { I: [100, 'A'], V: [400, 'V'], lim: 3, R: [0.1, 'Ω/km'], X: [0, 'Ω/km'], pf: 1, phase: 3 }, out: { L: 692.8203 }, tol: 1e-6 }, { name: 'matches the voltage drop calculator', in: { I: [100, 'A'], V: [230, 'V'], lim: 2, R: [0.1, 'Ω/km'], X: [0, 'Ω/km'], pf: 1, phase: 1 }, out: { L: 230 }, tol: 1e-6 }]),

  C('cable-derating', 'Cable Derating and Ampacity', '10 Cable and Wire', 'Derated current capacity of a cable and the tabulated rating it must start from.',
    ['cable', 'derating', 'ampacity', 'current', 'capacity', 'temperature', 'grouping', 'correction', 'iz'],
    [I('Ib', 'Design current', 'current', 'A', 160.4, { min: 0, exMin: true }), I('In', 'Protective device rating', 'current', 'A', 200, { min: 0, exMin: true }),
      I('Itab', 'Tabulated ampacity (data sheet, reference conditions)', 'current', 'A', 300, { min: 0, exMin: true, hint: 'Value from the cable manufacturer or your applicable standard for the installation method' }),
      { key: 'basis', label: 'Calculation basis', type: 'enum', options: [1, 4, 5, 6, 2, 3], def: 1, labels: BASIS_LABELS },
      { key: 'ins', label: 'Insulation', type: 'enum', options: [1, 2], def: 2, labels: { 1: 'PVC (70 °C; 75 °C under AS/NZS and NEC-style)', 2: 'XLPE / EPR (90 °C conductor)' } },
      I('Ta', 'Ambient temperature (°C)', 'number', '', 40, { min: -50, max: 80 }), I('tmu', 'User-defined conductor limit (°C)', 'number', '', 90, { min: 50, max: 250, mode: 'engineering', hint: 'Used only with the user-defined basis' }), I('cf', 'User-defined factor on design current', 'number', '', 1, { min: 1, max: 2, mode: 'engineering', hint: 'Used only with the user-defined basis; 1.25 for continuous loads under NEC-style rules' }), I('Tref', 'Reference ambient of the tabulated value (°C)', 'number', '', 30, { min: -50, max: 80, mode: 'engineering', hint: '30 °C for cables in air in IEC-based tables; check your data sheet' }),
      I('kg', 'Grouping factor', 'number', '', 0.8, { min: 0.1, max: 1, hint: 'From the grouping table for your installation method' }), I('ko', 'Other correction factor', 'number', '', 1, { min: 0.1, max: 1.5, mode: 'engineering', hint: 'Soil resistivity, depth, harmonics or similar' })],
    [{ key: 'kt', label: 'Temperature factor (approx.)', dim: 'number', unit: '', prec: 3 }, { key: 'Iz', label: 'Derated current capacity', dim: 'current', unit: 'A', prec: 1 }, { key: 'Ireq', label: 'Tabulated ampacity required', dim: 'current', unit: 'A', prec: 1 }, { key: 'Idev', label: 'Minimum device rating for this basis', dim: 'current', unit: 'A', prec: 1 }],
    'kt = √((θmax − Ta) / (θmax − Tref))     Iz = Itab × kt × kg × ko     Itab,req = In / (kt × kg × ko)',
    ['Approximate temperature factor from a steady-state conductor heat-balance model; it is not a standard-table correction factor', 'Tabulated ampacity and grouping factor supplied by the user', 'Rule checked: cf × Ib ≤ In ≤ Iz, with cf set by the chosen basis (1.0 General, 1.25 NEC-style continuous)'],
    'The temperature multiplier is an engineering approximation, not a substitute for the ambient-temperature correction factor in the applicable wiring standard or cable-manufacturer tables. For final cable selection, use the prescribed factor for the actual cable type, installation method, ambient conditions and grouping. Tabulated ampacity values are not built in because they depend on installation method and may be protected data; read them from your data sheet or licensed standard.', ['voltage-drop', 'cable-size-vd', 'breaker-size'],
    (i) => { const tm = tmOf(i), kt = Math.sqrt((tm - i.Ta) / (tm - i.Tref)), f = kt * i.kg * i.ko, Iz = i.Itab * f, Ireq = i.In / f, w = [];
      const cf = cfOf(i), Idev = i.Ib * cf; if (i.In < Idev - 1e-9) w.push(cf > 1 ? 'Device rating is below ' + fmt(cf, 2) + ' × the design current required by this basis.' : 'Device rating is below the design current.');
      if (i.basis !== 3 && Math.abs(i.Tref - trefOf(i)) > 0.5) w.push('Tables under ' + BASES[i.basis || 1].name + ' usually refer to ' + trefOf(i) + ' °C. You entered ' + fmt(i.Tref, 0) + ' °C; confirm the reference ambient printed on your data sheet.');
      if (i.In > Iz) w.push('Device rating exceeds the derated capacity. The cable is not protected; choose a larger cable.');
      return { out: { kt, Iz, Ireq, Idev }, steps: [`θmax = ${tm} °C`, `kt = √((${tm} − ${fmt(i.Ta, 1)}) / (${tm} − ${fmt(i.Tref, 1)})) = ${fmt(kt, 4)}`, `Combined factor = ${fmt(kt, 4)} × ${fmt(i.kg, 3)} × ${fmt(i.ko, 3)} = ${fmt(f, 4)}`, `Iz = ${fmt(i.Itab, 1)} × ${fmt(f, 4)} = ${fmt(Iz, 2)} A`, `Required tabulated ampacity = ${fmt(i.In, 1)} / ${fmt(f, 4)} = ${fmt(Ireq, 2)} A`], warnings: w,
        sentence: `Under these conditions the cable carries ${fmt(Iz, 1)} A. A ${fmt(i.In, 0)} A device needs a cable tabulated at ${fmt(Ireq, 1)} A or more.` }; },
    (v) => { const tm = tmOf(v), e = []; if (v.Ta >= tm) e.push({ key: 'Ta', msg: 'Ambient temperature must be below the conductor limit of ' + tm + ' °C' }); if (v.Tref >= tm) e.push({ key: 'Tref', msg: 'Reference ambient must be below ' + tm + ' °C' }); return e; },
    [{ name: 'NEC-style basis, 75 °C insulation', in: { basis: 2, Ib: [160.4, 'A'], In: [200, 'A'], Itab: [300, 'A'], ins: 1, Ta: 40, tmu: 90, cf: 1, Tref: 30, kg: 0.8, ko: 1 }, out: { kt: 0.881917, Iz: 211.660105, Ireq: 283.473355, Idev: 200.5 }, tol: 1e-6 },
      { name: 'user-defined 105 °C limit, factor 1.1', in: { basis: 3, Ib: [160.4, 'A'], In: [200, 'A'], Itab: [300, 'A'], ins: 2, Ta: 40, tmu: 105, cf: 1.1, Tref: 30, kg: 0.8, ko: 1 }, out: { kt: 0.930949, Iz: 223.427841, Ireq: 268.543078, Idev: 176.44 }, tol: 1e-6 },
      { name: 'AS/NZS PVC (75 °C), 50 °C ambient, 40 °C table', in: { basis: 6, Ib: [80, 'A'], In: [100, 'A'], Itab: [120, 'A'], ins: 1, Ta: 50, tmu: 90, cf: 1, Tref: 40, kg: 1, ko: 1 }, out: { kt: 0.845154, Iz: 101.418511, Idev: 80 }, tol: 1e-6 },
      { name: 'AS/NZS XLPE, 50 °C ambient, 40 °C table', in: { basis: 6, Ib: [80, 'A'], In: [100, 'A'], Itab: [120, 'A'], ins: 2, Ta: 50, tmu: 90, cf: 1, Tref: 40, kg: 1, ko: 1 }, out: { kt: 0.894427, Iz: 107.331263 }, tol: 1e-5 },
      { name: 'IS India XLPE, 45 °C ambient, 40 °C table', in: { basis: 4, Ib: [80, 'A'], In: [100, 'A'], Itab: [120, 'A'], ins: 2, Ta: 45, tmu: 90, cf: 1, Tref: 40, kg: 0.9, ko: 1 }, out: { kt: 0.948683, Iz: 102.457796 }, tol: 1e-5 },
      { name: 'BS 7671 PVC, 35 °C ambient, 30 °C table', in: { basis: 5, Ib: [80, 'A'], In: [100, 'A'], Itab: [120, 'A'], ins: 1, Ta: 35, tmu: 90, cf: 1, Tref: 30, kg: 1, ko: 1 }, out: { kt: 0.935414, Iz: 112.249722 }, tol: 1e-5 },
      { name: 'mismatched table ambient warns', in: { basis: 6, Ib: [80, 'A'], In: [100, 'A'], Itab: [120, 'A'], ins: 2, Ta: 40, tmu: 90, cf: 1, Tref: 30, kg: 1, ko: 1 }, out: { kt: 0.912871 }, tol: 1e-5 },
      { name: 'user-defined limit below ambient rejected', in: { basis: 3, Ib: [160.4, 'A'], In: [200, 'A'], Itab: [300, 'A'], ins: 2, Ta: 70, tmu: 60, cf: 1, Tref: 30, kg: 0.8, ko: 1 }, error: 'Ta' },
      { name: 'XLPE, 40 °C ambient, grouping 0.8', in: { Ib: [160.4, 'A'], In: [200, 'A'], Itab: [300, 'A'], ins: 2, Ta: 40, Tref: 30, kg: 0.8, ko: 1 }, out: { kt: 0.912871, Iz: 219.0890, Ireq: 273.8613 }, tol: 1e-5 },
      { name: 'PVC at 40 °C gives the familiar 0.866', in: { Ib: [100, 'A'], In: [100, 'A'], Itab: [150, 'A'], ins: 1, Ta: 40, Tref: 30, kg: 1, ko: 1 }, out: { kt: 0.866025 }, tol: 1e-5 },
      { name: 'ambient at the conductor limit rejected', in: { Ib: [100, 'A'], In: [100, 'A'], Itab: [150, 'A'], ins: 1, Ta: 70, Tref: 30, kg: 1, ko: 1 }, error: 'Ta' }]),
  C('cable-size-vd', 'Cable Size for Voltage Drop', '10 Cable and Wire', 'Smallest standard conductor that keeps voltage drop within the limit.',
    ['cable', 'size', 'conductor', 'cross-section', 'voltage', 'drop', 'mm2', 'copper', 'aluminium'],
    [I('I', 'Load current', 'current', 'A', 400.94, { min: 0, exMin: true }), I('L', 'Route length', 'length', 'm', 180, { min: 0, exMin: true }), I('V', 'System voltage (L-L)', 'voltage', 'V', 400, { min: 0, exMin: true }),
      I('lim', 'Allowed drop (%)', 'number', '', 3, { min: 0, max: 20, exMin: true }), PF(0.9),
      { key: 'mat', label: 'Conductor', type: 'enum', options: [1, 2], def: 1, labels: { 1: 'Copper', 2: 'Aluminium' } }, { key: 'ins', label: 'Insulation', type: 'enum', options: [1, 2], def: 2, labels: { 1: 'PVC (70 °C)', 2: 'XLPE / EPR (90 °C)' } },
      I('X', 'Cable reactance', 'resPerLen', 'Ω/km', 0.08, { min: 0, mode: 'engineering', hint: 'Typical 0.07 to 0.09 Ω/km for multicore cable' }), PHASE],
    [{ key: 'Amin', label: 'Minimum cross-section', dim: 'area', unit: 'mm²', prec: 1 }, { key: 'Astd', label: 'Standard size', dim: 'area', unit: 'mm²', prec: 1 }, { key: 'Vd', label: 'Drop at standard size', dim: 'voltage', unit: 'V', prec: 2 }, { key: 'pct', label: 'Drop as % of system voltage', dim: 'number', unit: '', prec: 2 }],
    'A = k × I × L × ρθ × cos φ / (Vmax − k × I × L × X × sin φ)     k = √3 (three-phase) or 2 (single-phase)',
    ['Resistivity taken at the full-load conductor temperature (70 or 90 °C)', 'Reactance treated as constant, independent of size', 'Standard sizes from the IEC 60228 preferred series, 1.5 to 630 mm²', 'Copper 0.017241 and aluminium 0.02826 Ω·mm²/m at 20 °C'],
    'This sizes for voltage drop only. Check the result against derated ampacity and short-circuit withstand before selecting a cable.', ['cable-derating', 'cable-sc-withstand', 'breaker-size'],
    (i) => { const th = i.ins === 1 ? 70 : 90, rho20 = i.mat === 1 ? 0.017241 : 0.02826, al = i.mat === 1 ? 0.00393 : 0.00403, rho = rho20 * (1 + al * (th - 20)), k = i.phase === 3 ? SQ3 : 2, sin = Math.sqrt(1 - i.pf * i.pf), Vmax = i.lim / 100 * i.V, xd = k * i.I * i.L * i.X * sin, Am = k * i.I * i.L * rho * i.pf / (Vmax - xd), Astd = STD_AREAS.find((a) => a >= Am - 1e-9), w = ['Voltage-drop size only, not a cable rating. Check the current capacity (derated ampacity) and short-circuit withstand before choosing a cable.'];
      let Vd = NaN, pct = NaN; if (Astd) { Vd = k * i.I * i.L * (rho / Astd * i.pf + i.X * sin); pct = Vd / i.V * 100; } else w.push('Above 630 mm². Use parallel cables per phase.');
      if (Astd && i.I / Astd > 15) w.unshift('DANGER: ' + fmt(i.I / Astd, 0) + ' A per mm² is far more than any cable can carry. This short run passes the drop limit but the cable would overheat. Size it on current capacity first.');
      return { out: { Amin: Am * 1e-6, Astd: Astd ? Astd * 1e-6 : NaN, Vd, pct }, steps: [`Operating temperature ${th} °C, ρθ = ${fmt(rho, 6)} Ω·mm²/m`, `Allowed drop = ${fmt(i.lim, 2)}% × ${fmt(i.V, 0)} V = ${fmt(Vmax, 2)} V`, `Reactive part = ${fmt(xd, 3)} V`, `A min = ${fmt(Am, 2)} mm²`, Astd ? `Next standard size = ${Astd} mm², drop ${fmt(Vd, 2)} V (${fmt(pct, 2)}%)` : 'No standard single-core size is large enough'], warnings: w,
        sentence: Astd ? `Voltage drop alone needs at least ${fmt(Am, 1)} mm² for ${fmt(i.I, 1)} A over ${q(i.L, 'm', 0)} (${Astd} mm² gives ${fmt(pct, 2)}% drop). This is not a cable rating.` : `The run needs ${fmt(Am, 0)} mm², beyond a single 630 mm² conductor.` }; },
    (v) => { const th = v.ins === 1 ? 70 : 90, sin = Math.sqrt(1 - v.pf * v.pf), k = v.phase === 3 ? SQ3 : 2; return k * v.I * v.L * v.X * sin >= v.lim / 100 * v.V ? [{ key: 'lim', msg: 'Reactive drop alone uses the whole allowance. Shorten the run or split the load.' }] : []; },
    [{ name: '401.9 A, 180 m, 400 V, 3%, copper XLPE', in: { I: [401.9, 'A'], L: [180, 'm'], V: [400, 'V'], lim: 3, pf: 0.9, mat: 1, ins: 2, X: [0.08, 'Ω/km'], phase: 3 }, out: { Amin: 324.8923, Astd: 400, Vd: 10.5672, pct: 2.64180 }, tol: 1e-5 },
      { name: 'reactance larger than the allowance rejected', in: { I: [1000, 'A'], L: [5000, 'm'], V: [400, 'V'], lim: 1, pf: 0.5, mat: 1, ins: 2, X: [0.1, 'Ω/km'], phase: 3 }, error: 'lim' }]),
  C('cable-sc-withstand', 'Cable Short-Circuit Withstand', '10 Cable and Wire', 'Smallest conductor that survives a fault for a given clearing time.',
    ['cable', 'short', 'circuit', 'withstand', 'thermal', 'fault', 'adiabatic', 'cross-section'],
    [I('Isc', 'Fault current (rms)', 'current', 'kA', 25, { min: 0, exMin: true }), I('t', 'Clearing time', 'time', 's', 1, { min: 0, exMin: true, max: 5 }),
      { key: 'mat', label: 'Conductor and insulation', type: 'enum', options: [1, 2, 3, 4], def: 2, labels: { 1: 'Copper / PVC (k = 115, 103 above 300 mm²)', 2: 'Copper / XLPE (k = 143)', 3: 'Aluminium / PVC (k = 76, 68 above 300 mm²)', 4: 'Aluminium / XLPE (k = 94)' } }],
    [{ key: 'Amin', label: 'Minimum cross-section', dim: 'area', unit: 'mm²', prec: 1 }, { key: 'Astd', label: 'Standard size', dim: 'area', unit: 'mm²', prec: 1 }, { key: 'k', label: 'Material constant k', dim: 'number', unit: '', prec: 0 }],
    'S = I × √t / k',
    ['Adiabatic heating (clearing time up to 5 s)', 'k values at the normal starting temperature, as published in IEC 60364-4-43 and IEC 60364-5-54. For PVC the standard lowers k for conductors above 300 mm² (copper 103, aluminium 68), and this calculator applies that when the required area is above 300 mm²', 'Fault current is the prospective rms value at the cable', 'IEC-type k values apply on every basis. AS/NZS 3008.1.1:2025 uses its own K and final-temperature tables (for XLPE a higher K, reported as 167.4 for 250 °C), so do not use this result as an AS/NZS 3008 check'],
    'Use the clearing time of the protective device at the fault level, not its trip setting.', ['fault-current', 'cable-size-vd', 'cable-derating'],
    (i) => { const k = kShortCircuit(i.mat, i.Isc * Math.sqrt(i.t) / [0, 115, 143, 76, 94][i.mat]), Am = i.Isc * Math.sqrt(i.t) / k, Astd = STD_AREAS.find((a) => a >= Am - 1e-9), w = []; if (!Astd) w.push('Above 630 mm². Use parallel cables or a faster protective device.');
      return { out: { Amin: Am * 1e-6, Astd: Astd ? Astd * 1e-6 : NaN, k }, steps: [`k = ${k}`, `S = ${fmt(i.Isc, 0)} × √${fmt(i.t, 3)} / ${k} = ${fmt(Am, 2)} mm²`, Astd ? `Next standard size = ${Astd} mm²` : 'No standard single-core size is large enough'], warnings: w,
        sentence: Astd ? `A ${fmt(i.Isc / 1000, 1)} kA fault cleared in ${fmt(i.t, 3)} s needs at least ${fmt(Am, 1)} mm², so use ${Astd} mm².` : `The fault needs ${fmt(Am, 0)} mm², beyond a single 630 mm² conductor.` }; },
    [{ name: '25 kA for 1 s, copper XLPE', in: { Isc: [25, 'kA'], t: [1, 's'], mat: 2 }, out: { Amin: 174.8252, Astd: 185, k: 143 }, tol: 1e-5 },
      { name: 'aluminium PVC needs the largest conductor', in: { Isc: [10, 'kA'], t: [0.5, 's'], mat: 3 }, out: { Amin: 93.04037, Astd: 95 }, tol: 1e-5 },
      { name: 'copper PVC up to 300 mm² keeps k = 115', in: { Isc: [25, 'kA'], t: [1, 's'], mat: 1 }, out: { Amin: 217.3913, Astd: 240, k: 115 }, tol: 1e-5 },
      { name: 'copper PVC above 300 mm² uses k = 103 (40 kA, 1 s)', in: { Isc: [40, 'kA'], t: [1, 's'], mat: 1 }, out: { Amin: 388.3495, Astd: 400, k: 103 }, tol: 1e-5 },
      { name: 'aluminium PVC above 300 mm² uses k = 68 (30 kA, 1 s)', in: { Isc: [30, 'kA'], t: [1, 's'], mat: 3 }, out: { Amin: 441.1765, Astd: 500, k: 68 }, tol: 1e-5 },
      { name: 'XLPE keeps its k at every size (60 kA, 1 s copper)', in: { Isc: [60, 'kA'], t: [1, 's'], mat: 2 }, out: { Amin: 419.5804, Astd: 500, k: 143 }, tol: 1e-5 },
      { name: 'clearing time above 5 s rejected', in: { Isc: [10, 'kA'], t: [6, 's'], mat: 2 }, error: 't' }]),

  /* ---- Phase 2 batch: motors, transformers, generation and backup, power systems ---- */
  C('motor-torque', 'Motor Shaft Torque', '12 Motors', 'Shaft torque from motor power and speed.', ['motor', 'torque', 'shaft', 'rpm', 'speed', 'nm'],
    [I('P', 'Shaft power', 'power', 'kW', 75, { min: 0, exMin: true }), I('N', 'Rated speed', 'speed', 'rpm', 1480, { min: 0, exMin: true })],
    [{ key: 'T', label: 'Shaft torque', dim: 'torque', unit: 'N·m', prec: 1 }], 'T = P / ω = 60 × P / (2π × N)', ['Power is mechanical shaft output', 'Speed is the loaded rotor speed, not synchronous speed'], 'Use the nameplate speed (for example 1480 rpm), not 1500 rpm, or the torque will be understated.', ['motor-slip', 'motor-starting'],
    (i) => { const T = i.P * 60 / (2 * Math.PI * i.N); return { out: { T }, steps: [`ω = 2π × N / 60 = ${fmt(2 * Math.PI * i.N / 60, 3)} rad/s`, `T = P / ω = ${fmt(i.P, 1)} / ${fmt(2 * Math.PI * i.N / 60, 3)} = ${fmt(T, 2)} N·m`], sentence: `A ${q(i.P, 'kW', 1)} motor at ${fmt(i.N, 0)} rpm delivers ${fmt(T, 1)} N·m at the shaft.` }; },
    [{ name: '75 kW at 1480 rpm', in: { P: [75, 'kW'], N: [1480, 'rpm'] }, out: { T: 483.91706 }, tol: 1e-6 }, { name: '11 kW at 1450 rpm', in: { P: [11, 'kW'], N: [1450, 'rpm'] }, out: { T: 72.44294 }, tol: 1e-6 }]),
  C('motor-slip', 'Induction Motor Slip', '12 Motors', 'Synchronous speed and slip from frequency, poles and rotor speed.', ['motor', 'slip', 'synchronous', 'poles', 'rpm', 'induction'],
    [I('f', 'Supply frequency', 'frequency', 'Hz', 50, { min: 0, exMin: true }), I('poles', 'Number of poles', 'number', '', 4, { min: 2, max: 48 }), I('N', 'Rotor speed', 'speed', 'rpm', 1470, { min: 0, exMin: true })],
    [{ key: 'Ns', label: 'Synchronous speed', dim: 'speed', unit: 'rpm', prec: 0 }, { key: 'slip', label: 'Slip (%)', dim: 'number', unit: '', prec: 2 }], 'Ns = 120 × f / p     slip = (Ns − N) / Ns × 100', ['Motor operation (rotor at or below synchronous speed)', 'Poles is the total pole count'], 'Typical full-load slip is 1% to 5% for standard cage motors.', ['motor-torque', 'motor-current'],
    (i) => { const Ns = 120 * i.f / i.poles, slip = (Ns - i.N) / Ns * 100; return { out: { Ns, slip }, steps: [`Ns = 120 × ${fmt(i.f, 2)} / ${fmt(i.poles, 0)} = ${fmt(Ns, 1)} rpm`, `slip = (${fmt(Ns, 1)} − ${fmt(i.N, 1)}) / ${fmt(Ns, 1)} × 100 = ${fmt(slip, 3)} %`], sentence: `A ${fmt(i.poles, 0)}-pole motor on ${fmt(i.f, 1)} Hz has a synchronous speed of ${fmt(Ns, 0)} rpm; at ${fmt(i.N, 0)} rpm the slip is ${fmt(slip, 2)} %.` }; },
    (v) => { const e = []; if (v.poles !== Math.round(v.poles) || v.poles % 2) e.push({ key: 'poles', msg: 'Number of poles must be an even whole number' }); else if (v.N > 120 * v.f / v.poles) e.push({ key: 'N', msg: 'Rotor speed must not exceed synchronous speed (' + fmt(120 * v.f / v.poles, 0) + ' rpm) for a motor' }); return e; },
    [{ name: '50 Hz, 4 poles, 1470 rpm', in: { f: [50, 'Hz'], poles: 4, N: [1470, 'rpm'] }, out: { Ns: 1500, slip: 2 }, tol: 1e-9 }, { name: '60 Hz, 6 poles, 1140 rpm', in: { f: [60, 'Hz'], poles: 6, N: [1140, 'rpm'] }, out: { Ns: 1200, slip: 5 }, tol: 1e-9 },
      { name: 'odd pole count rejected', in: { f: [50, 'Hz'], poles: 5, N: [1000, 'rpm'] }, error: 'poles' }, { name: 'speed above synchronous rejected', in: { f: [50, 'Hz'], poles: 4, N: [1600, 'rpm'] }, error: 'N' }]),
  C('motor-starting', 'Motor Starting Current', '12 Motors', 'Line starting current and relative torque for direct, star-delta and auto-transformer starting.', ['motor', 'starting', 'dol', 'star', 'delta', 'autotransformer', 'inrush', 'lrc'],
    [I('In', 'Full-load current', 'current', 'A', 140, { min: 0, exMin: true }), I('k', 'Locked-rotor current (× full-load)', 'number', '', 6.5, { min: 1, max: 12, hint: 'From the motor data sheet, typically 5 to 8' }),
      { key: 'meth', label: 'Starting method', type: 'enum', options: [1, 2, 3], def: 1, labels: { 1: 'Direct on line', 2: 'Star-delta', 3: 'Auto-transformer' } }, I('tap', 'Auto-transformer tap', 'number', '', 0.65, { min: 0.4, max: 0.85, hint: 'Used only for the auto-transformer method (fraction of line voltage)' })],
    [{ key: 'Ist', label: 'Line starting current', dim: 'current', unit: 'A', prec: 1 }, { key: 'Tq', label: 'Starting torque (% of direct-on-line)', dim: 'number', unit: '', prec: 1 }], 'DOL: Ist = k × In     Star-delta: Ist ÷ 3, torque ÷ 3     Auto-transformer: Ist × tap², torque × tap²', ['Motor torque varies with voltage squared', 'Supply voltage does not sag during the start'], 'Star-delta suits only light or no-load starts. The changeover can cause a second current peak.', ['voltage-drop', 'breaker-size'],
    (i) => { const D = i.In * i.k, m = Math.round(i.meth), f = m === 1 ? 1 : m === 2 ? 1 / 3 : i.tap * i.tap, Ist = D * f, w = [];
      if (m === 2) w.push('Star-delta gives one third of direct-on-line torque. Confirm the load can accelerate at that torque.');
      return { out: { Ist, Tq: f * 100 }, steps: [`Direct-on-line current = k × In = ${fmt(i.k, 2)} × ${fmt(i.In, 1)} = ${fmt(D, 1)} A`, `Method factor = ${fmt(f, 4)}`, `Line current = ${fmt(Ist, 1)} A, torque = ${fmt(f * 100, 1)} % of DOL`], warnings: w, sentence: `${['', 'Direct-on-line', 'Star-delta', 'Auto-transformer'][m]} starting draws ${fmt(Ist, 0)} A from the line at ${fmt(f * 100, 1)} % of the direct-on-line torque.` }; },
    [{ name: 'DOL, 140 A, 6.5×', in: { In: [140, 'A'], k: 6.5, meth: 1, tap: 0.65 }, out: { Ist: 910, Tq: 100 }, tol: 1e-9 }, { name: 'star-delta', in: { In: [140, 'A'], k: 6.5, meth: 2, tap: 0.65 }, out: { Ist: 303.33333, Tq: 33.33333 }, tol: 1e-6 },
      { name: 'auto-transformer 65% tap', in: { In: [140, 'A'], k: 6.5, meth: 3, tap: 0.65 }, out: { Ist: 384.475, Tq: 42.25 }, tol: 1e-9 }, { name: 'locked-rotor ratio below 1 rejected', in: { In: [140, 'A'], k: 0.5, meth: 1, tap: 0.65 }, error: 'k' }]),
  C('transformer-regulation', 'Transformer Voltage Regulation', '13 Transformers', 'Secondary voltage drop under load from impedance, resistance, load and power factor.', ['transformer', 'regulation', 'voltage', 'impedance', 'secondary', 'load'],
    [I('Z', 'Impedance (%)', 'number', '', 5, { min: 0, max: 100, exMin: true }), I('R', 'Resistance (%)', 'number', '', 1, { min: 0, max: 100, hint: 'Copper loss as % of rating; reactance is derived from Z and R' }), I('x', 'Load (fraction of rating)', 'number', '', 1, { min: 0, max: 1.5, exMin: true }), PF(0.8), I('V', 'No-load secondary voltage', 'voltage', 'V', 415, { min: 0, exMin: true })],
    [{ key: 'reg', label: 'Regulation (%)', dim: 'number', unit: '', prec: 2 }, { key: 'Vl', label: 'Secondary voltage on load', dim: 'voltage', unit: 'V', prec: 1 }], 'X = √(Z² − R²)     reg = x(R cosφ + X sinφ) + [x(X cosφ − R sinφ)]² / 200', ['Lagging power factor', 'Primary voltage held at rating', 'Load balanced'], 'A leading power factor can give negative regulation (voltage rise); this calculator covers lagging loads only.', ['transformer-efficiency', 'fault-current'],
    (i) => { const X = Math.sqrt(i.Z * i.Z - i.R * i.R), c = i.pf, sn = Math.sqrt(1 - c * c), reg = i.x * (i.R * c + X * sn) + Math.pow(i.x * (X * c - i.R * sn), 2) / 200, Vl = i.V * (1 - reg / 100);
      return { out: { reg, Vl }, steps: [`X = √(${fmt(i.Z, 2)}² − ${fmt(i.R, 2)}²) = ${fmt(X, 4)} %`, `Regulation = ${fmt(reg, 4)} %`, `Vload = ${fmt(i.V, 1)} × (1 − ${fmt(reg / 100, 5)}) = ${fmt(Vl, 2)} V`], sentence: `At ${fmt(i.x * 100, 0)} % load and ${fmt(c, 2)} power factor the secondary falls by ${fmt(reg, 2)} %, from ${q(i.V, 'V', 0)} to ${q(Vl, 'V', 1)}.` }; },
    (v) => (v.R > v.Z ? [{ key: 'R', msg: 'Resistance cannot exceed the impedance' }] : []),
    [{ name: '5% Z, 1% R, full load, PF 0.8', in: { Z: 5, R: 1, x: 1, pf: 0.8, V: [415, 'V'] }, out: { reg: 3.79447, Vl: 399.25294 }, tol: 1e-5 }, { name: 'half load, unity PF', in: { Z: 5, R: 1, x: 0.5, pf: 1, V: [415, 'V'] }, out: { reg: 0.53 }, tol: 1e-6 },
      { name: 'resistance above impedance rejected', in: { Z: 2, R: 3, x: 1, pf: 0.8, V: [415, 'V'] }, error: 'R' }]),
  C('transformer-efficiency', 'Transformer Efficiency and Losses', '13 Transformers', 'Efficiency at any load, total loss, and the load at which efficiency peaks.', ['transformer', 'efficiency', 'losses', 'iron', 'copper', 'no-load'],
    [I('S', 'Rating', 'apparent', 'kVA', 1000, { min: 0, exMin: true }), I('Pfe', 'No-load (iron) loss', 'power', 'kW', 1.7, { min: 0, exMin: true }), I('Pcu', 'Full-load copper loss', 'power', 'kW', 10.5, { min: 0, exMin: true }), I('x', 'Load (fraction of rating)', 'number', '', 1, { min: 0, max: 1.5, exMin: true }), PF(0.9)],
    [{ key: 'eff', label: 'Efficiency (%)', dim: 'number', unit: '', prec: 3 }, { key: 'loss', label: 'Total loss', dim: 'power', unit: 'kW', prec: 2 }, { key: 'xo', label: 'Load at maximum efficiency', dim: 'number', unit: '', prec: 3 }], 'η = x S pf / (x S pf + Pfe + x² Pcu)     x(max η) = √(Pfe / Pcu)', ['Iron loss constant with load', 'Copper loss scales with load squared', 'Stray and harmonic losses ignored'], 'Distribution transformers peak at 40% to 60% load, so lightly loaded units can be more efficient than fully loaded ones.', ['transformer-regulation', 'transformer-current'],
    (i) => { const o = i.x * i.S * i.pf, loss = i.Pfe + i.x * i.x * i.Pcu, eff = o / (o + loss) * 100, xo = Math.sqrt(i.Pfe / i.Pcu);
      return { out: { eff, loss, xo }, steps: [`Output = x × S × pf = ${fmt(o / 1000, 2)} kW`, `Loss = Pfe + x² × Pcu = ${fmt(loss / 1000, 3)} kW`, `η = ${fmt(o / 1000, 2)} / (${fmt(o / 1000, 2)} + ${fmt(loss / 1000, 3)}) = ${fmt(eff, 4)} %`, `Maximum efficiency at ${fmt(xo, 3)} of rating`], sentence: `At ${fmt(i.x * 100, 0)} % load and ${fmt(i.pf, 2)} power factor the transformer is ${fmt(eff, 2)} % efficient, losing ${q(loss, 'kW', 2)}.` }; },
    [{ name: '1000 kVA, full load, PF 0.9', in: { S: [1000, 'kVA'], Pfe: [1.7, 'kW'], Pcu: [10.5, 'kW'], x: 1, pf: 0.9 }, out: { eff: 98.66257, loss: 12.2, xo: 0.402374 }, tol: 1e-5 }, { name: 'half load', in: { S: [1000, 'kVA'], Pfe: [1.7, 'kW'], Pcu: [10.5, 'kW'], x: 0.5, pf: 0.9 }, out: { eff: 99.04804 }, tol: 1e-5 }]),
  C('generator-kva', 'Generator kVA Selection', '14 Generators', 'Required generator rating from running load, power factor and design margin, rounded to a standard size.', ['generator', 'genset', 'kva', 'sizing', 'standby', 'diesel'],
    [I('P', 'Running load', 'power', 'kW', 400, { min: 0, exMin: true }), PF(0.8), I('m', 'Design margin (%)', 'number', '', 25, { min: 0, max: 100, hint: 'Growth and loading headroom' }), I('V', 'Line voltage (L-L)', 'voltage', 'V', 415, { min: 0, exMin: true })],
    [{ key: 'Sr', label: 'Required rating', dim: 'apparent', unit: 'kVA', prec: 1 }, { key: 'Ss', label: 'Next standard size', dim: 'apparent', unit: 'kVA', prec: 1 }, { key: 'I', label: 'Rated current at that size', dim: 'current', unit: 'A', prec: 0 }], 'S = P / pf × (1 + margin)     I = S / (√3 × V)', ['Three-phase, continuous or standby duty as rated', 'Running load only', 'Standard sizes (kVA): 10, 15, 20, 30, 40, 50, 62.5, 75, 100, 125, 150, 200, 250, 320, 400, 500, 625, 750, 1000, 1250, 1500, 2000, 2500'], 'Motor starting, non-linear loads and altitude or temperature derating need a separate check and can raise the size.', ['breaker-size', 'motor-starting'],
    (i) => { const Sr = i.P / i.pf * (1 + i.m / 100), STD = [10, 15, 20, 30, 40, 50, 62.5, 75, 100, 125, 150, 200, 250, 320, 400, 500, 625, 750, 1000, 1250, 1500, 2000, 2500], k = STD.filter((x) => x * 1000 >= Sr - 1e-6)[0], Ss = k ? k * 1000 : NaN, I = Ss / (SQ3 * i.V), w = [];
      if (!k) w.push('Required rating is above the standard list; consider paralleled sets.');
      return { out: { Sr, Ss, I }, steps: [`S = ${fmt(i.P / 1000, 1)} / ${fmt(i.pf, 2)} × ${fmt(1 + i.m / 100, 3)} = ${fmt(Sr / 1000, 2)} kVA`, `Next standard size = ${k ? k + ' kVA' : 'none'}`, `I = ${fmt(Ss / 1000, 1)} kVA / (√3 × ${fmt(i.V, 0)}) = ${fmt(I, 1)} A`], warnings: w, sentence: `A ${q(i.P, 'kW', 0)} load at ${fmt(i.pf, 2)} power factor with ${fmt(i.m, 0)} % margin needs ${fmt(Sr / 1000, 1)} kVA, so choose ${k ? k + ' kVA' : 'a larger or paralleled set'}.` }; },
    [{ name: '400 kW, PF 0.8, 25% margin', in: { P: [400, 'kW'], pf: 0.8, m: 25, V: [415, 'V'] }, out: { Sr: 625, Ss: 625, I: 869.5034 }, tol: 1e-6 }, { name: '300 kW rounds up to 500 kVA', in: { P: [300, 'kW'], pf: 0.8, m: 20, V: [415, 'V'] }, out: { Sr: 450, Ss: 500 }, tol: 1e-9 }]),
  C('ups-runtime', 'UPS Battery Runtime', '15 Batteries and UPS', 'Backup time and usable energy from battery bank size, depth of discharge, ageing and UPS efficiency.', ['ups', 'battery', 'runtime', 'backup', 'ah', 'autonomy'],
    [I('Pl', 'Load', 'power', 'kW', 10, { min: 0, exMin: true }), I('eff', 'UPS efficiency', 'number', '', 0.95, { min: 0, max: 1, exMin: true }), I('Vb', 'Battery bank voltage', 'voltage', 'V', 240, { min: 0, exMin: true }), I('Ah', 'Battery capacity', 'charge', 'Ah', 100, { min: 0, exMin: true }), I('dod', 'Usable depth of discharge', 'number', '', 0.8, { min: 0, max: 1, exMin: true }), I('age', 'Ageing and temperature factor', 'number', '', 0.8, { min: 0, max: 1, exMin: true, hint: '0.8 allows for end-of-life capacity' })],
    [{ key: 'E', label: 'Usable battery energy', dim: 'energy', unit: 'kWh', prec: 2 }, { key: 'T', label: 'Runtime', dim: 'time', unit: 'min', prec: 1 }], 'E = Vb × Ah × DoD × ageing     t = E / (Load / η)', ['Constant power load', 'Capacity is the rated value at the stated discharge rate'], 'High discharge rates deliver less than rated Ah (Peukert effect), so confirm against the battery discharge table for short runtimes.', ['generator-kva', 'energy-cost'],
    (i) => { const E = i.Vb * i.Ah * i.dod * i.age, T = E / (i.Pl / i.eff) * 3600, w = [];
      if (i.dod > 0.8) w.push('Depth of discharge above 80% shortens battery life for most chemistries.');
      return { out: { E, T }, steps: [`E = ${fmt(i.Vb, 0)} V × ${fmt(i.Ah, 1)} Ah × ${fmt(i.dod, 2)} × ${fmt(i.age, 2)} = ${fmt(E / 1000, 3)} kWh`, `Input power = Load / η = ${fmt(i.Pl / i.eff / 1000, 3)} kW`, `t = ${fmt(E / 1000, 3)} / ${fmt(i.Pl / i.eff / 1000, 3)} = ${fmt(T / 3600, 3)} h`], warnings: w, sentence: `The battery holds ${fmt(E / 1000, 2)} kWh usable, which runs a ${q(i.Pl, 'kW', 1)} load for about ${fmt(T / 60, 0)} minutes.` }; },
    [{ name: '10 kW on 240 V, 100 Ah', in: { Pl: [10, 'kW'], eff: 0.95, Vb: [240, 'V'], Ah: [100, 'Ah'], dod: 0.8, age: 0.8 }, out: { E: 15.36, T: 87.552 }, tol: 1e-6 }, { name: '5 kW load', in: { Pl: [5, 'kW'], eff: 0.95, Vb: [240, 'V'], Ah: [100, 'Ah'], dod: 0.8, age: 0.8 }, out: { T: 175.104 }, tol: 1e-6 }]),
  C('per-unit-base', 'Per-Unit Base Values', '19 Power Systems', 'Base current and base impedance from a chosen MVA and kV base.', ['per', 'unit', 'pu', 'base', 'impedance', 'mva', 'kv', 'power systems'],
    [I('S', 'Base power', 'apparent', 'MVA', 100, { min: 0, exMin: true }), I('V', 'Base voltage (L-L)', 'voltage', 'kV', 132, { min: 0, exMin: true })],
    [{ key: 'Ib', label: 'Base current', dim: 'current', unit: 'A', prec: 1 }, { key: 'Zb', label: 'Base impedance', dim: 'resistance', unit: 'Ω', prec: 2 }], 'Ibase = Sbase / (√3 × Vbase)     Zbase = Vbase² / Sbase', ['Three-phase system', 'Voltage is line-to-line'], 'To change base, use Z(new) = Z(old) × (S new / S old) × (V old / V new)².', ['fault-current', 'transformer-current'],
    (i) => { const Ib = i.S / (SQ3 * i.V), Zb = i.V * i.V / i.S; return { out: { Ib, Zb }, steps: [`Ibase = ${fmt(i.S / 1e6, 2)} MVA / (√3 × ${fmt(i.V / 1e3, 2)} kV) = ${fmt(Ib, 2)} A`, `Zbase = (${fmt(i.V / 1e3, 2)} kV)² / ${fmt(i.S / 1e6, 2)} MVA = ${fmt(Zb, 3)} Ω`], sentence: `On a ${fmt(i.S / 1e6, 0)} MVA, ${fmt(i.V / 1e3, 1)} kV base, one per-unit is ${fmt(Ib, 1)} A and ${fmt(Zb, 2)} Ω.` }; },
    [{ name: '100 MVA, 132 kV', in: { S: [100, 'MVA'], V: [132, 'kV'] }, out: { Ib: 437.38657, Zb: 174.24 }, tol: 1e-6 }, { name: '10 MVA, 11 kV', in: { S: [10, 'MVA'], V: [11, 'kV'] }, out: { Ib: 524.86388, Zb: 12.1 }, tol: 1e-6 }]),
  /* ---- Phase 2 batch 2: solar, EV, lighting, earthing, harmonics, reactive, fault ---- */
  C('pv-string-size', 'Solar PV String Length', '25 Solar PV', 'Maximum modules in series so the cold-weather open-circuit voltage stays under the system limit.', ['solar', 'pv', 'string', 'voc', 'modules', 'series', 'inverter'],
    [I('Voc', 'Module open-circuit voltage (STC)', 'voltage', 'V', 49.5, { min: 0, exMin: true }), I('tc', 'Voc temperature coefficient (%/°C)', 'number', '', -0.28, { min: -1, max: 0 }), I('Tmin', 'Lowest site temperature (°C)', 'number', '', -5, { min: -60, max: 25 }), I('Vmax', 'Maximum system voltage', 'voltage', 'V', 1000, { min: 0, exMin: true })],
    [{ key: 'Vc', label: 'Cold open-circuit voltage per module', dim: 'voltage', unit: 'V', prec: 2 }, { key: 'N', label: 'Maximum modules per string', dim: 'number', unit: '', prec: 0 }], 'Voc(cold) = Voc × (1 + tc × (Tmin − 25))     N = floor(Vmax / Voc(cold))', ['Standard test conditions are 25 °C', 'Linear temperature coefficient'], 'Also check the inverter MPPT window at hot-weather Vmp; this sets only the upper limit.', ['pv-energy', 'ups-runtime'],
    (i) => { const Vc = i.Voc * (1 + i.tc / 100 * (i.Tmin - 25)), N = Math.floor(i.Vmax / Vc), w = []; if (N < 1) w.push('One module already exceeds the system voltage limit.'); return { out: { Vc, N }, steps: [`Voc(cold) = ${fmt(i.Voc, 2)} × (1 + ${fmt(i.tc / 100, 5)} × ${fmt(i.Tmin - 25, 1)}) = ${fmt(Vc, 3)} V`, `N = floor(${fmt(i.Vmax, 0)} / ${fmt(Vc, 3)}) = ${N}`], warnings: w, sentence: `At ${fmt(i.Tmin, 0)} °C each module reaches ${fmt(Vc, 1)} V, so a ${fmt(i.Vmax, 0)} V system allows ${N} modules in series.` }; },
    [{ name: '49.5 V module, -5 °C, 1000 V', in: { Voc: [49.5, 'V'], tc: -0.28, Tmin: -5, Vmax: [1000, 'V'] }, out: { Vc: 53.658, N: 18 }, tol: 1e-9 }, { name: 'positive coefficient rejected', in: { Voc: [49.5, 'V'], tc: 0.28, Tmin: -5, Vmax: [1000, 'V'] }, error: 'tc' }]),
  C('pv-energy', 'Solar PV Energy Yield', '25 Solar PV', 'Daily and annual energy from array size, peak sun hours and performance ratio.', ['solar', 'pv', 'energy', 'yield', 'kwp', 'array', 'generation'],
    [I('P', 'Array size (peak)', 'power', 'kW', 100, { min: 0, exMin: true }), I('psh', 'Peak sun hours per day', 'number', '', 5.5, { min: 0, max: 12, exMin: true }), I('pr', 'Performance ratio', 'number', '', 0.78, { min: 0, max: 1, exMin: true, hint: 'Typical 0.75 to 0.85 after all losses' })],
    [{ key: 'Ed', label: 'Energy per day', dim: 'energy', unit: 'kWh', prec: 1 }, { key: 'Ey', label: 'Energy per year', dim: 'energy', unit: 'kWh', prec: 0 }], 'E(day) = P × peak sun hours × PR     E(year) = E(day) × 365', ['Average day over the year', 'No degradation or shading beyond the PR'], 'Annual output falls about 0.5% per year with module ageing.', ['pv-string-size', 'energy-cost'],
    (i) => { const Ed = i.P * i.psh * i.pr, Ey = Ed * 365; return { out: { Ed, Ey }, steps: [`E(day) = ${fmt(i.P / 1000, 1)} × ${fmt(i.psh, 2)} × ${fmt(i.pr, 2)} = ${fmt(Ed / 1000, 2)} kWh`, `E(year) = ${fmt(Ed / 1000, 2)} × 365 = ${fmt(Ey / 1000, 0)} kWh`], sentence: `A ${q(i.P, 'kW', 0)} array yields about ${fmt(Ed / 1000, 0)} kWh a day and ${fmt(Ey / 1000, 0)} kWh a year.` }; },
    [{ name: '100 kWp, 5.5 h, PR 0.78', in: { P: [100, 'kW'], psh: 5.5, pr: 0.78 }, out: { Ed: 429, Ey: 156585 }, tol: 1e-9 }, { name: 'PR above 1 rejected', in: { P: [100, 'kW'], psh: 5.5, pr: 1.2 }, error: 'pr' }]),
  C('ev-charge-time', 'EV Charging Time', '27 EV Charging', 'Charging time and grid energy from battery size, state of charge range and charger power.', ['ev', 'charging', 'charger', 'battery', 'time', 'soc'],
    [I('cap', 'Battery capacity', 'energy', 'kWh', 60, { min: 0, exMin: true }), I('from', 'Start charge (%)', 'number', '', 20, { min: 0, max: 100 }), I('to', 'Target charge (%)', 'number', '', 80, { min: 0, max: 100 }), I('P', 'Charger power (AC supply)', 'power', 'kW', 11, { min: 0, exMin: true }), I('eff', 'Charging efficiency', 'number', '', 0.9, { min: 0, max: 1, exMin: true })],
    [{ key: 'Eb', label: 'Energy into battery', dim: 'energy', unit: 'kWh', prec: 1 }, { key: 'Eg', label: 'Energy from grid', dim: 'energy', unit: 'kWh', prec: 1 }, { key: 'T', label: 'Charging time', dim: 'time', unit: 'h', prec: 2 }], 'Eb = capacity × (target − start)     Eg = Eb / η     t = Eg / P', ['Constant charging power', 'Vehicle onboard charger is not the limit'], 'Charging slows above about 80%, so real times to 100% are longer than this linear estimate.', ['three-phase-current', 'energy-cost'],
    (i) => { const Eb = i.cap * (i.to - i.from) / 100, Eg = Eb / i.eff, T = Eg / i.P * 3600; return { out: { Eb, Eg, T }, steps: [`Eb = ${fmt(i.cap / 1000, 1)} × ${fmt(i.to - i.from, 0)} % = ${fmt(Eb / 1000, 2)} kWh`, `Eg = ${fmt(Eb / 1000, 2)} / ${fmt(i.eff, 2)} = ${fmt(Eg / 1000, 2)} kWh`, `t = ${fmt(Eg / 1000, 2)} / ${fmt(i.P / 1000, 1)} = ${fmt(T / 3600, 3)} h`], sentence: `Charging ${fmt(i.from, 0)} % to ${fmt(i.to, 0)} % takes about ${fmt(T / 3600, 1)} hours and draws ${fmt(Eg / 1000, 1)} kWh from the grid.` }; },
    (v) => (v.to <= v.from ? [{ key: 'to', msg: 'Target charge must be above the start charge' }] : []),
    [{ name: '60 kWh, 20 to 80 %, 11 kW', in: { cap: [60, 'kWh'], from: 20, to: 80, P: [11, 'kW'], eff: 0.9 }, out: { Eb: 36, Eg: 40, T: 3.636364 }, tol: 1e-6 }, { name: 'target below start rejected', in: { cap: [60, 'kWh'], from: 80, to: 20, P: [11, 'kW'], eff: 0.9 }, error: 'to' }]),
  C('lumen-method', 'Lighting Level (Lumen Method)', '28 Lighting', 'Number of luminaires needed for a target illuminance.', ['lighting', 'lumen', 'lux', 'luminaires', 'illuminance', 'room'],
    [I('E', 'Required illuminance (lux)', 'number', '', 500, { min: 0, exMin: true }), I('A', 'Room area', 'area', 'm²', 100, { min: 0, exMin: true }), I('phi', 'Lumens per luminaire', 'number', '', 4000, { min: 0, exMin: true }), I('uf', 'Utilisation factor', 'number', '', 0.6, { min: 0, max: 1, exMin: true }), I('mf', 'Maintenance factor', 'number', '', 0.8, { min: 0, max: 1, exMin: true })],
    [{ key: 'N', label: 'Luminaires (calculated)', dim: 'number', unit: '', prec: 1 }, { key: 'Nr', label: 'Luminaires (rounded up)', dim: 'number', unit: '', prec: 0 }], 'N = E × A / (Φ × UF × MF)', ['Uniform layout', 'Utilisation factor taken from the luminaire data for this room'], 'Check uniformity and glare separately; the count is a starting point for layout.', ['energy-cost', 'power-vir'],
    (i) => { const N = i.E * i.A / (i.phi * i.uf * i.mf), Nr = Math.ceil(N - 1e-9); return { out: { N, Nr }, steps: [`N = ${fmt(i.E, 0)} × ${fmt(i.A, 1)} / (${fmt(i.phi, 0)} × ${fmt(i.uf, 2)} × ${fmt(i.mf, 2)}) = ${fmt(N, 3)}`, `Rounded up = ${Nr}`], sentence: `${fmt(i.E, 0)} lux over ${fmt(i.A, 0)} m² needs ${Nr} luminaires of ${fmt(i.phi, 0)} lm.` }; },
    [{ name: '500 lux, 100 m², 4000 lm', in: { E: 500, A: [100, 'm²'], phi: 4000, uf: 0.6, mf: 0.8 }, out: { N: 26.041667, Nr: 27 }, tol: 1e-6 }, { name: 'zero utilisation rejected', in: { E: 500, A: [100, 'm²'], phi: 4000, uf: 0, mf: 0.8 }, error: 'uf' }]),
  C('earth-rod-resistance', 'Earth Rod Resistance', '18 Earthing', 'Resistance to earth of a single vertical rod.', ['earth', 'earthing', 'grounding', 'rod', 'electrode', 'resistance', 'soil'],
    [I('rho', 'Soil resistivity (Ω·m)', 'number', '', 100, { min: 0, exMin: true }), I('L', 'Rod length driven in soil', 'length', 'm', 3, { min: 0, exMin: true }), I('d', 'Rod diameter', 'length', 'mm', 16, { min: 0, exMin: true })],
    [{ key: 'R', label: 'Earth resistance', dim: 'resistance', unit: 'Ω', prec: 2 }], 'R = ρ / (2π L) × (ln(8L / d) − 1)', ['Uniform soil', 'Single rod, no nearby electrodes'], 'Measure on site. Soil moisture and season can change resistance several-fold; parallel rods must be spaced at least their length apart.', ['fault-current', 'cable-sc-withstand'],
    (i) => { const R = i.rho / (2 * Math.PI * i.L) * (Math.log(8 * i.L / i.d) - 1); return { out: { R }, steps: [`ln(8L/d) = ln(${fmt(8 * i.L / i.d, 1)}) = ${fmt(Math.log(8 * i.L / i.d), 4)}`, `R = ${fmt(i.rho, 1)} / (2π × ${fmt(i.L, 2)}) × (${fmt(Math.log(8 * i.L / i.d), 4)} − 1) = ${fmt(R, 3)} Ω`], sentence: `A ${q(i.L, 'm', 1)} rod in ${fmt(i.rho, 0)} Ω·m soil gives about ${fmt(R, 1)} Ω to earth.` }; },
    (v) => (v.d >= v.L ? [{ key: 'd', msg: 'Rod diameter must be much smaller than its length' }] : []),
    [{ name: '100 Ω·m, 3 m, 16 mm', in: { rho: 100, L: [3, 'm'], d: [16, 'mm'] }, out: { R: 33.492674 }, tol: 1e-6 }, { name: '50 Ω·m, 2.4 m, 14 mm', in: { rho: 50, L: [2.4, 'm'], d: [14, 'mm'] }, out: { R: 20.635792 }, tol: 1e-6 }]),
  C('harmonic-thd', 'Current THD', '20 Harmonics', 'Total harmonic distortion and RMS current from the fundamental and 3rd, 5th and 7th harmonics.', ['harmonics', 'thd', 'distortion', 'power quality', 'rms'],
    [I('I1', 'Fundamental current', 'current', 'A', 100, { min: 0, exMin: true }), I('I3', '3rd harmonic', 'current', 'A', 20, { min: 0 }), I('I5', '5th harmonic', 'current', 'A', 12, { min: 0 }), I('I7', '7th harmonic', 'current', 'A', 8, { min: 0 })],
    [{ key: 'thd', label: 'THD (%)', dim: 'number', unit: '', prec: 2 }, { key: 'Irms', label: 'Total RMS current', dim: 'current', unit: 'A', prec: 2 }], 'THD = √(I3² + I5² + I7²) / I1 × 100     Irms = √(I1² + I3² + I5² + I7²)', ['Only the harmonics entered are included', 'Magnitudes are RMS'], 'Add further harmonic orders from a power-quality analyser for a complete figure.', ['transformer-efficiency', 'pf-correction-kvar'],
    (i) => { const h = Math.sqrt(i.I3 * i.I3 + i.I5 * i.I5 + i.I7 * i.I7), thd = h / i.I1 * 100, Irms = Math.sqrt(i.I1 * i.I1 + h * h), w = []; if (thd > 30) w.push('THD above 30% usually needs filtering or transformer derating.'); return { out: { thd, Irms }, steps: [`Harmonic RMS = ${fmt(h, 3)} A`, `THD = ${fmt(h, 3)} / ${fmt(i.I1, 2)} × 100 = ${fmt(thd, 3)} %`, `Irms = ${fmt(Irms, 3)} A`], warnings: w, sentence: `Harmonics add ${fmt(h, 1)} A on a ${q(i.I1, 'A', 0)} fundamental: THD is ${fmt(thd, 1)} % and the RMS current is ${fmt(Irms, 1)} A.` }; },
    [{ name: '100 A with 20, 12, 8 A', in: { I1: [100, 'A'], I3: [20, 'A'], I5: [12, 'A'], I7: [8, 'A'] }, out: { thd: 24.657656, Irms: 102.995146 }, tol: 1e-6 }, { name: 'no harmonics', in: { I1: [50, 'A'], I3: [0, 'A'], I5: [0, 'A'], I7: [0, 'A'] }, out: { Irms: 50 }, tol: 1e-9 }]),
  C('pf-capacitor-uf', 'Capacitor Bank Size (µF)', '21 Reactive Power', 'Capacitance per phase and line current for a delta-connected bank of a given kVAR.', ['capacitor', 'bank', 'kvar', 'microfarad', 'uf', 'delta', 'power factor'],
    [I('Q', 'Bank rating', 'reactive', 'kVAR', 58.4, { min: 0, exMin: true }), I('V', 'Line voltage (L-L)', 'voltage', 'V', 415, { min: 0, exMin: true }), I('f', 'Frequency', 'frequency', 'Hz', 50, { min: 0, exMin: true })],
    [{ key: 'C', label: 'Capacitance per phase', dim: 'capacitance', unit: 'µF', prec: 1 }, { key: 'I', label: 'Bank line current', dim: 'current', unit: 'A', prec: 1 }], 'C = Q / (3 × 2π f × V²)     I = Q / (√3 × V)', ['Delta connection', 'Rated kVAR is at the stated voltage'], 'Choose capacitors rated above system voltage, and check for harmonics before fitting detuning reactors.', ['pf-correction-kvar', 'harmonic-thd'],
    (i) => { const C = i.Q / (3 * 2 * Math.PI * i.f * i.V * i.V), I = i.Q / (SQ3 * i.V); return { out: { C, I }, steps: [`C = ${fmt(i.Q / 1000, 2)} kVAR / (3 × 2π × ${fmt(i.f, 1)} × ${fmt(i.V, 0)}²) = ${fmt(C * 1e6, 2)} µF`, `I = ${fmt(i.Q / 1000, 2)} kVAR / (√3 × ${fmt(i.V, 0)}) = ${fmt(I, 2)} A`], sentence: `A ${q(i.Q, 'kVAR', 1)} delta bank at ${q(i.V, 'V', 0)} needs ${fmt(C * 1e6, 0)} µF per phase and draws ${fmt(I, 1)} A.` }; },
    [{ name: '58.4 kVAR, 415 V, 50 Hz', in: { Q: [58.4, 'kVAR'], V: [415, 'V'], f: [50, 'Hz'] }, out: { C: 359.787049, I: 81.246399 }, tol: 1e-6 }, { name: '100 kVAR, 400 V', in: { Q: [100, 'kVAR'], V: [400, 'V'], f: [50, 'Hz'] }, out: { C: 663.145596 }, tol: 1e-6 }]),
  C('fault-mva', 'Fault Level (kA to MVA)', '17 Short Circuit', 'Fault MVA from fault current and voltage.', ['fault', 'mva', 'short circuit', 'ka', 'level', 'switchgear'],
    [I('V', 'Line voltage (L-L)', 'voltage', 'V', 415, { min: 0, exMin: true }), I('I', 'Fault current', 'current', 'kA', 25, { min: 0, exMin: true })],
    [{ key: 'S', label: 'Fault level', dim: 'apparent', unit: 'MVA', prec: 2 }], 'S = √3 × V × I', ['Symmetrical three-phase fault', 'Voltage is the pre-fault line-to-line value'], 'For the reverse, I = S / (√3 × V). Per-unit base values are in the Per-Unit calculator.', ['per-unit-base', 'fault-current'],
    (i) => { const S = SQ3 * i.V * i.I; return { out: { S }, steps: [`S = √3 × ${fmt(i.V, 0)} V × ${fmt(i.I / 1000, 2)} kA = ${fmt(S / 1e6, 3)} MVA`], sentence: `${q(i.I, 'kA', 1)} at ${q(i.V, 'V', 0)} is a fault level of ${fmt(S / 1e6, 2)} MVA.` }; },
    [{ name: '25 kA at 415 V', in: { V: [415, 'V'], I: [25, 'kA'] }, out: { S: 17.970027 }, tol: 1e-6 }, { name: '31.5 kA at 11 kV', in: { V: [11, 'kV'], I: [31.5, 'kA'] }, out: { S: 600.155605 }, tol: 1e-6 }]),
  C('voltage-divider', 'Voltage Divider', '23 Electronics', 'Output voltage and divider current from two series resistors.', ['voltage', 'divider', 'resistor', 'vout', 'potential'],
    [I('Vin', 'Input voltage', 'voltage', 'V', 12, { min: 0, exMin: true }), I('R1', 'Upper resistor R1', 'resistance', 'kΩ', 10, { min: 0, exMin: true }), I('R2', 'Lower resistor R2', 'resistance', 'kΩ', 10, { min: 0, exMin: true })],
    [{ key: 'Vo', label: 'Output voltage', dim: 'voltage', unit: 'V', prec: 3 }, { key: 'Id', label: 'Divider current', dim: 'current', unit: 'mA', prec: 4 }], 'Vout = Vin × R2 / (R1 + R2)     I = Vin / (R1 + R2)', ['Unloaded output: no current drawn from the midpoint', 'Resistors are ideal'], 'A load on the output in parallel with R2 lowers Vout. Keep the load at least ten times R2 for a stable output.', ['ohms-law', 'resistance-series'],
    (i) => { const Rt = i.R1 + i.R2, Vo = i.Vin * i.R2 / Rt, Id = i.Vin / Rt; return { out: { Vo, Id }, steps: [`Vout = ${fmt(i.Vin, 3)} × ${fmt(i.R2, 2)} / ${fmt(Rt, 2)} = ${fmt(Vo, 4)} V`, `I = ${fmt(i.Vin, 3)} / ${fmt(Rt, 2)} = ${fmt(Id * 1000, 4)} mA`], sentence: `${q(i.Vin, 'V', 2)} across ${q(i.R1, 'kΩ', 2)} and ${q(i.R2, 'kΩ', 2)} gives ${fmt(Vo, 3)} V unloaded.` }; },
    [{ name: '12 V, 10 kΩ / 10 kΩ', in: { Vin: [12, 'V'], R1: [10, 'kΩ'], R2: [10, 'kΩ'] }, out: { Vo: 6, Id: 0.6 }, tol: 1e-9 }, { name: '12 V, 10 kΩ / 20 kΩ', in: { Vin: [12, 'V'], R1: [10, 'kΩ'], R2: [20, 'kΩ'] }, out: { Vo: 8, Id: 0.4 }, tol: 1e-9 }, { name: '5 V, 1 kΩ / 3 kΩ', in: { Vin: [5, 'V'], R1: [1000, 'Ω'], R2: [3000, 'Ω'] }, out: { Vo: 3.75 }, tol: 1e-9 }]),
  C('led-resistor', 'LED Series Resistor', '23 Electronics', 'Series resistor value and power for an LED from a fixed supply.', ['led', 'resistor', 'series', 'forward', 'diode'],
    [I('Vs', 'Supply voltage', 'voltage', 'V', 5, { min: 0, exMin: true }), I('Vf', 'LED forward voltage', 'voltage', 'V', 2, { min: 0, exMin: true }), I('If', 'LED current', 'current', 'mA', 20, { min: 0, exMin: true })],
    [{ key: 'R', label: 'Resistor value', dim: 'resistance', unit: 'Ω', prec: 1 }, { key: 'P', label: 'Resistor dissipation', dim: 'power', unit: 'W', prec: 4 }], 'R = (Vs − Vf) / If     P = If² × R', ['Single LED in series with the resistor', 'Forward voltage is the datasheet value at the chosen current'], 'Round R up to the next standard value and use a resistor rated at least twice the dissipation.', ['ohms-law', 'power-vir'],
    (i) => { const R = (i.Vs - i.Vf) / i.If, P = i.If * i.If * R; return { out: { R, P }, steps: [`R = (${fmt(i.Vs, 2)} − ${fmt(i.Vf, 2)}) / ${fmt(i.If, 4)} = ${fmt(R, 2)} Ω`, `P = If² × R = ${fmt(P, 5)} W`], sentence: `Use about ${fmt(R, 0)} Ω for ${q(i.If, 'mA', 0)} through the LED from ${q(i.Vs, 'V', 1)}.` }; },
    (v) => (v.Vs <= v.Vf ? [{ key: 'Vs', msg: 'Supply voltage must be higher than the LED forward voltage' }] : []),
    [{ name: '5 V, 2 V, 20 mA', in: { Vs: [5, 'V'], Vf: [2, 'V'], If: [20, 'mA'] }, out: { R: 150, P: 0.06 }, tol: 1e-9 }, { name: '12 V, 3.2 V, 20 mA', in: { Vs: [12, 'V'], Vf: [3.2, 'V'], If: [20, 'mA'] }, out: { R: 440 }, tol: 1e-9 }, { name: 'supply below forward voltage rejected', in: { Vs: [1.8, 'V'], Vf: [2, 'V'], If: [20, 'mA'] }, error: 'Vs' }]),
  C('rc-time-constant', 'RC Time Constant and Cutoff', '23 Electronics', 'Time constant and cutoff frequency of a first-order RC circuit.', ['rc', 'time', 'constant', 'cutoff', 'filter', 'capacitor', 'charge'],
    [I('R', 'Resistance', 'resistance', 'kΩ', 10, { min: 0, exMin: true }), I('C', 'Capacitance', 'capacitance', 'µF', 0.1, { min: 0, exMin: true })],
    [{ key: 'tau', label: 'Time constant τ', dim: 'time', unit: 'ms', prec: 4 }, { key: 'fc', label: 'Cutoff frequency', dim: 'frequency', unit: 'Hz', prec: 2 }], 'τ = R × C     fc = 1 / (2π × R × C)', ['Ideal resistor and capacitor', 'Source and load impedance are negligible'], 'A capacitor reaches about 63% of its final voltage after one τ and about 99% after five τ.', ['reactance', 'impedance-rlc'],
    (i) => { const tau = i.R * i.C, fc = 1 / (2 * Math.PI * tau); return { out: { tau, fc }, steps: [`τ = R × C = ${fmt(i.R, 1)} Ω × ${fmt(i.C * 1e6, 4)} µF = ${fmt(tau * 1000, 4)} ms`, `fc = 1 / (2π × τ) = ${fmt(fc, 3)} Hz`], sentence: `An RC pair of ${q(i.R, 'kΩ', 2)} and ${q(i.C, 'µF', 3)} has τ = ${fmt(tau * 1000, 3)} ms and a ${fmt(fc, 1)} Hz cutoff.` }; },
    [{ name: '10 kΩ, 100 nF', in: { R: [10, 'kΩ'], C: [0.1, 'µF'] }, out: { tau: 1, fc: 159.154943 }, tol: 1e-6 }, { name: '1 kΩ, 1 µF', in: { R: [1, 'kΩ'], C: [1, 'µF'] }, out: { tau: 1, fc: 159.154943 }, tol: 1e-6 }, { name: '100 Ω, 10 µF', in: { R: [100, 'Ω'], C: [10, 'µF'] }, out: { tau: 1 }, tol: 1e-9 }]),
  C('current-loop-4-20', '4-20 mA Signal Scaling', '31 Instrumentation', 'Convert a 4-20 mA loop current to the process value.', ['4-20', 'ma', 'loop', 'transmitter', 'scaling', 'sensor', 'instrument'],
    [I('I', 'Loop current', 'current', 'mA', 12, { min: 0.004, max: 0.02 }), I('lo', 'Range at 4 mA', 'number', '', 0), I('hi', 'Range at 20 mA', 'number', '', 100)],
    [{ key: 'PV', label: 'Process value', dim: 'number', unit: '', prec: 3 }, { key: 'pct', label: 'Span (%)', dim: 'number', unit: '', prec: 2 }], 'PV = lo + (I − 4 mA) / 16 mA × (hi − lo)', ['Linear transmitter', 'Live-zero 4 mA to 20 mA range'], 'A current below about 3.8 mA or above 20.5 mA usually signals a wire break or a transmitter fault (NAMUR NE43).', ['ohms-law'],
    (i) => { const f = (i.I - 0.004) / 0.016, PV = i.lo + f * (i.hi - i.lo), w = i.I < 0.0038 || i.I > 0.0205 ? ['Current is outside the normal live range. Check for a fault.'] : []; return { out: { PV, pct: f * 100 }, warnings: w, steps: [`Span = (${fmt(i.I * 1000, 3)} − 4) / 16 = ${fmt(f * 100, 2)} %`, `PV = ${fmt(i.lo, 3)} + ${fmt(f, 4)} × (${fmt(i.hi, 3)} − ${fmt(i.lo, 3)}) = ${fmt(PV, 3)}`], sentence: `A ${q(i.I, 'mA', 2)} signal is ${fmt(f * 100, 1)}% of span, a process value of ${fmt(PV, 2)}.` }; },
    (v) => (v.hi === v.lo ? [{ key: 'hi', msg: 'The 20 mA range value must differ from the 4 mA value' }] : []),
    [{ name: '12 mA on 0 to 100', in: { I: [12, 'mA'], lo: 0, hi: 100 }, out: { PV: 50, pct: 50 }, tol: 1e-9 }, { name: '4 mA is range low', in: { I: [4, 'mA'], lo: 0, hi: 100 }, out: { PV: 0 }, tol: 1e-9 }, { name: '20 mA on 0 to 10 bar', in: { I: [20, 'mA'], lo: 0, hi: 10 }, out: { PV: 10 }, tol: 1e-9 }, { name: 'equal range values rejected', in: { I: [12, 'mA'], lo: 5, hi: 5 }, error: 'hi' }]),
  C('battery-bank-size', 'Battery Bank Sizing', '15 Batteries and UPS', 'Battery capacity needed to carry a load for a set backup time.', ['battery', 'bank', 'ah', 'capacity', 'backup', 'dod', 'sizing'],
    [I('P', 'Load power', 'power', 'W', 500, { min: 0, exMin: true }), I('t', 'Backup time', 'time', 'h', 4, { min: 0, exMin: true }), I('V', 'Battery bank voltage', 'voltage', 'V', 48, { min: 0, exMin: true }), I('dod', 'Usable depth of discharge', 'number', '', 0.8, { min: 0, max: 1, exMin: true }), I('eff', 'Inverter efficiency', 'number', '', 0.9, { min: 0, max: 1, exMin: true })],
    [{ key: 'Ah', label: 'Required capacity', dim: 'charge', unit: 'Ah', prec: 1 }, { key: 'E', label: 'Energy from battery', dim: 'energy', unit: 'kWh', prec: 3 }], 'Ah = P × t / (V × DoD × η)', ['Constant load for the whole backup time', 'Capacity quoted at the discharge rate of the backup time', 'No ageing, temperature or Peukert allowance'], 'Add an ageing margin (typically 20 to 25%) and a temperature factor before selecting the battery.', ['ups-runtime', 'three-phase-current'],
    (i) => { const th = i.t / 3600, Ah = i.P * th / (i.V * i.dod * i.eff), E = i.P * th / i.eff; return { out: { Ah, E }, steps: [`Energy = P × t / η = ${fmt(i.P, 1)} × ${fmt(th, 2)} / ${fmt(i.eff, 2)} = ${fmt(E, 1)} Wh`, `Ah = ${fmt(E, 1)} / (${fmt(i.V, 1)} × ${fmt(i.dod, 2)}) = ${fmt(Ah, 2)} Ah`], sentence: `A ${q(i.P, 'W', 0)} load for ${fmt(th, 1)} h on a ${fmt(i.V, 0)} V bank needs about ${fmt(Ah, 0)} Ah.` }; },
    [{ name: '500 W, 4 h, 48 V', in: { P: [500, 'W'], t: [4, 'h'], V: [48, 'V'], dod: 0.8, eff: 0.9 }, out: { Ah: 57.87037, E: 2.222222 }, tol: 1e-6 }, { name: '1 kW, 5 h, 24 V, DoD 0.5', in: { P: [1, 'kW'], t: [5, 'h'], V: [24, 'V'], dod: 0.5, eff: 1 }, out: { Ah: 416.666667 }, tol: 1e-6 }, { name: 'DoD above 1 rejected', in: { P: [500, 'W'], t: [4, 'h'], V: [48, 'V'], dod: 1.5, eff: 0.9 }, error: 'dod' }]),
];
/* ---------- v1.0 additions: Phase 2 calculators. Same definition shape as above; every formula has hand-checked reference tests. ---------- */
const MAT = { 1: { name: 'Copper', rho: 1.7241e-8, alpha: 0.00393, dens: 8960 }, 2: { name: 'Aluminium', rho: 2.8264e-8, alpha: 0.00403, dens: 2700 },
  3: { name: 'Silver', rho: 1.59e-8, alpha: 0.0038 }, 4: { name: 'Gold', rho: 2.44e-8, alpha: 0.0034 }, 5: { name: 'Nickel', rho: 6.99e-8, alpha: 0.006 }, 6: { name: 'Nichrome', rho: 1.10e-6, alpha: 0.0004 } };
const MATSEL_VD = { key: 'mat', label: 'Conductor material', type: 'enum', options: [1, 2, 3, 4, 5, 6, 7], def: 1, labels: { 1: 'Copper', 2: 'Aluminium', 3: 'Silver', 4: 'Gold', 5: 'Nickel', 6: 'Nichrome', 7: 'Custom (enter resistivity below)' } };
const awgDia = (n) => 0.127e-3 * Math.pow(92, (36 - n) / 39);
/* AWG chart (-3 to 40) and size-to-AWG lookup. All values come from the AWG definition above. Resistance is annealed copper at 20 °C. */
const awgLabel = (n) => (n <= 0 ? '0'.repeat(1 - n) : String(n));
function awgChart() {
  const rows = [];
  for (let n = -3; n <= 40; n++) {
    const d = awgDia(n), A = Math.PI * d * d / 4, dIn = d / 0.0254;
    rows.push({ n, label: awgLabel(n), dMm: d * 1e3, dIn, AMm2: A * 1e6, kcmil: dIn * dIn * 1e3, ohmPerKm: 1.7241e-8 / A * 1e3 });
  }
  return rows;
}
function awgFromArea(Amm2) {
  const x = Number(Amm2);
  if (!(x > 0) || !isFinite(x)) return { ok: false, error: 'Enter a cross-section greater than zero.' };
  const d = Math.sqrt(4 * x * 1e-6 / Math.PI), exact = 36 - 39 * Math.log(d / 0.127e-3) / Math.log(92);
  const near = Math.round(exact), up = Math.floor(exact + 1e-4);
  if (near < -3 || near > 40) return { ok: false, error: 'That size is outside AWG 0000 to 40 (0.005 to 107.2 mm²).' };
  const pick = (n) => ({ n, label: awgLabel(n), AMm2: Math.PI * awgDia(n) * awgDia(n) / 4 * 1e6 });
  return { ok: true, exact, nearest: pick(near), nextLarger: up < -3 ? null : pick(Math.min(up, 40)) };
}
const MATSEL = { key: 'mat', label: 'Conductor material', type: 'enum', options: [1, 2], def: 1, labels: { 1: 'Copper', 2: 'Aluminium' } };
const N = (key, label, def, o) => I(key, label, 'number', '', def, o);
const ENUM = (key, label, options, def, labels) => ({ key, label, type: 'enum', options, def, labels });
const isInt = (key, label) => (v) => (Math.abs(v[key] - Math.round(v[key])) > 1e-9 ? [{ key, msg: label + ' must be a whole number' }] : []);
const STD_TX = [25, 50, 63, 100, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150];
const STD_CCR = [4, 7.5, 10, 15, 20, 25, 30];

CALCS.push(
  C('cable-power-loss', 'Cable Power Loss (I²R)', '10 Cable and Wire', 'Heat dissipated in a cable run and the share of the load power it wastes.', ['cable', 'loss', 'i2r', 'heat', 'copper loss', 'power loss'],
    [I('I', 'Load current', 'current', 'A', 100, { min: 0, exMin: true }), I('L', 'Route length', 'length', 'm', 1000, { min: 0, exMin: true }), I('R', 'Conductor resistance', 'resPerLen', 'Ω/km', 0.2, { min: 0, exMin: true, hint: 'At operating temperature, from the cable data sheet' }),
      I('V', 'System voltage (L-L)', 'voltage', 'V', 400, { min: 0, exMin: true }), PF(0.9), PHASE],
    [{ key: 'Pl', label: 'Cable loss', dim: 'power', unit: 'W', prec: 1 }, { key: 'pct', label: 'Loss as % of load power', dim: 'number', unit: '', prec: 2 }],
    'Loss = 3 × I² × R × L (three-phase)     2 × I² × R × L (single-phase)', ['Balanced load', 'Resistance is the AC value at operating temperature', 'Neutral current ignored'], 'Cable loss is continuous heat. Over a year it is often worth a larger conductor than the voltage-drop limit alone requires.', ['voltage-drop', 'energy-cost'],
    (i) => { const n = i.phase === 3 ? 3 : 2, Rt = i.R * i.L, Pl = n * i.I * i.I * Rt, Pload = (i.phase === 3 ? SQ3 : 1) * i.V * i.I * i.pf, pct = Pl / Pload * 100;
      return { out: { Pl, pct }, steps: [`Conductor resistance = R × L = ${fmt(Rt, 4)} Ω`, `Loss = ${n} × ${fmt(i.I, 2)}² × ${fmt(Rt, 4)} = ${fmt(Pl, 1)} W`, `Load power = ${fmt(Pload / 1000, 2)} kW, loss share = ${fmt(pct, 3)} %`], warnings: pct > 5 ? ['Loss above 5% of the load power. A larger conductor will pay back.'] : [], sentence: `A ${fmt(i.I, 1)} A load over ${q(i.L, 'm', 0)} wastes ${fmt(Pl, 0)} W in the cable, ${fmt(pct, 2)}% of the load power.` }; },
    [{ name: '100 A, 1 km, 0.2 Ω/km, three-phase', in: { I: [100, 'A'], L: [1, 'km'], R: [0.2, 'Ω/km'], V: [400, 'V'], pf: 0.9, phase: 3 }, out: { Pl: 6000, pct: 9.62250 }, tol: 1e-5 }, { name: 'single-phase uses two conductors', in: { I: [100, 'A'], L: [1, 'km'], R: [0.2, 'Ω/km'], V: [230, 'V'], pf: 1, phase: 1 }, out: { Pl: 4000 }, tol: 1e-9 }]),
  C('dc-voltage-drop', 'Voltage Drop from Conductor Size', '09 Voltage Drop', 'Voltage drop from conductor material, size (area, AWG or diameter) and temperature, for DC, single-phase or resistive three-phase circuits.', ['voltage drop', 'dc', 'conductor', 'copper', 'aluminium', 'mm2', 'area', 'solar cable', 'awg', 'wire gauge', 'wire diameter', 'resistivity', 'wire resistance'],
    [I('I', 'Load current', 'current', 'A', 50, { min: 0, exMin: true }), I('L', 'One-way length', 'length', 'm', 50, { min: 0, exMin: true }), MATSEL_VD,
      ENUM('sz', 'Conductor size given as', [0, 1, 2], 0, { 0: 'Cross-section (area)', 1: 'AWG number', 2: 'Wire diameter' }),
      I('A', 'Conductor cross-section (used when size is given as area)', 'area', 'mm²', 10, { min: 0, exMin: true }),
      N('awg', 'AWG number (used when size is given as AWG; −1 = 00, −2 = 000, −3 = 0000)', 8, { min: -3, max: 40 }),
      I('D', 'Wire diameter (used when size is given as diameter)', 'length', 'mm', 3.264, { min: 0, exMin: true }),
      I('rhoC', 'Custom resistivity at 20 °C (used when material is Custom)', 'resistivity', 'Ω·m', 1.7241e-8, { min: 0, exMin: true, hint: 'Starts at the Copper preset, 1.7241e-8 (aluminium preset 2.8264e-8). Pure-metal handbook values are lower: copper about 1.68e-8, aluminium about 2.65e-8. Carbon steel is about 1.43e-7. Take the value from your material data sheet' }),
      N('aC', 'Custom temperature coefficient (per °C)', 0, { min: 0, max: 0.01, mode: 'engineering', hint: '0 uses the resistivity as given at every temperature. Used only when material is Custom' }),
      N('T', 'Conductor temperature (°C)', 20, { min: -50, max: 250, hint: '20 °C gives the cold value; 70 °C is typical for PVC cable at full load' }), I('V', 'System voltage', 'voltage', 'V', 230, { min: 0, exMin: true }), ENUM('phase', 'Circuit', [1, 3], 1, { 1: 'Two-wire (DC or single-phase AC)', 3: 'Three-phase AC (resistive)' })],
    [{ key: 'Vd', label: 'Voltage drop', dim: 'voltage', unit: 'V', prec: 3 }, { key: 'pct', label: 'Drop as % of system voltage', dim: 'number', unit: '', prec: 2 }, { key: 'R', label: 'Conductor resistance (one way, at temperature)', dim: 'resistance', unit: 'Ω', prec: 5 }, { key: 'Au', label: 'Cross-section used', dim: 'area', unit: 'mm²', prec: 4 }, { key: 'rho', label: 'Resistivity used (at conductor temperature)', dim: 'resistivity', unit: 'Ω·m', prec: 5 }],
    'Vd = k × I × L × ρT / A     ρT = ρ20 × (1 + α(T − 20))     k = 2 (two-wire) or √3 (three-phase)     AWG: d = 0.127 mm × 92^((36 − n) / 39), A = π d² / 4', ['Resistive load, reactance ignored', 'ρ20 (Ω·m): copper 1.7241e-8, aluminium 2.8264e-8, silver 1.59e-8, gold 2.44e-8, nickel 6.99e-8, nichrome 1.10e-6', 'α (per °C): copper 0.00393, aluminium 0.00403, silver 0.0038, gold 0.0034, nickel 0.006, nichrome 0.0004', 'Round solid conductor when size is given as AWG or diameter', 'A custom resistivity is taken as the value at 20 °C'], 'Copper and aluminium use the annealed-copper (IACS) and commercial-aluminium values, which are slightly higher than pure-metal handbook values (copper 1.68e-8 and aluminium 2.65e-8 Ω·m would give a drop about 2.6% and 6.2% lower). The resistivity used is shown beside the result. Stranded conductors have more resistance than a solid wire of the same diameter. For AC circuits with significant reactance or low power factor use the Voltage Drop calculator with R and X from a data sheet.', ['cable-power-loss', 'voltage-drop', 'wire-gauge-conversion'],
    (i) => {
      const cust = i.mat === 7, m = cust ? { name: 'Custom material', rho: i.rhoC, alpha: i.aC } : MAT[i.mat], rho = m.rho * (1 + m.alpha * (i.T - 20)), k = i.phase === 3 ? SQ3 : 2;
      let A = i.A, sizeStep = `A = ${fmt(i.A * 1e6, 3)} mm² (given)`;
      if (i.sz === 1) { const d = awgDia(i.awg); A = Math.PI * d * d / 4; sizeStep = `AWG ${fmt(i.awg, 0)}: d = 0.127 × 92^((36 − ${fmt(i.awg, 0)}) / 39) = ${fmt(d * 1e3, 4)} mm, A = π d² / 4 = ${fmt(A * 1e6, 4)} mm²`; }
      else if (i.sz === 2) { A = Math.PI * i.D * i.D / 4; sizeStep = `A = π d² / 4 = π × ${fmt(i.D * 1e3, 4)}² / 4 = ${fmt(A * 1e6, 4)} mm²`; }
      const R = rho * i.L / A, Vd = k * i.I * R, pct = Vd / i.V * 100;
      return { out: { Vd, pct, R, Au: A, rho }, steps: [sizeStep, `ρ(${fmt(i.T, 0)} °C) = ${(m.rho * 1e8).toPrecision(4)}e-8 × (1 + ${m.alpha} × ${fmt(i.T - 20, 0)}) = ${(rho * 1e8).toPrecision(4)}e-8 Ω·m`, `R = ρ L / A = ${fmt(R, 5)} Ω (one way)`, `Vd = ${i.phase === 3 ? '√3' : '2'} × ${fmt(i.I, 2)} × ${fmt(R, 5)} = ${fmt(Vd, 4)} V`, `Vd % = ${fmt(pct, 3)} %`], warnings: pct > 5 ? ['Drop above 5% exceeds most design limits.'] : pct > 3 ? ['Drop above 3% exceeds the common limit for final circuits.'] : [], sentence: `${fmt(i.I, 1)} A over ${q(i.L, 'm', 0)} of ${fmt(A * 1e6, 2)} mm² ${m.name.toLowerCase()} drops ${fmt(Vd, 2)} V, which is ${fmt(pct, 2)}% of ${q(i.V, 'V', 0)}. Resistivity used: ${(rho * 1e8).toPrecision(5)}e-8 Ω·m at ${fmt(i.T, 0)} °C.` }; },
    [{ name: '50 A, 50 m, 10 mm² copper at 20 °C, two-wire', in: { I: [50, 'A'], L: [50, 'm'], A: [10, 'mm²'], mat: 1, T: 20, V: [230, 'V'], phase: 1 }, out: { Vd: 8.6205, pct: 3.74804 }, tol: 1e-5 }, { name: 'aluminium is 1.64 times copper', in: { I: [50, 'A'], L: [50, 'm'], A: [10, 'mm²'], mat: 2, T: 20, V: [230, 'V'], phase: 1 }, out: { Vd: 14.132 }, tol: 1e-5 },
      { name: 'copper at 70 °C', in: { I: [50, 'A'], L: [50, 'm'], A: [10, 'mm²'], mat: 1, T: 70, V: [230, 'V'], phase: 1 }, out: { Vd: 10.314428 }, tol: 1e-6 }, { name: 'three-phase factor', in: { I: [50, 'A'], L: [50, 'm'], A: [10, 'mm²'], mat: 1, T: 20, V: [400, 'V'], phase: 3 }, out: { Vd: 7.465572 }, tol: 1e-6 },
      { name: 'AWG 10 copper gives the same area as 5.2612 mm²', in: { I: [10, 'A'], L: [30, 'm'], mat: 1, sz: 1, awg: 10, T: 20, V: [12, 'V'], phase: 1 }, out: { Au: 5.261155, Vd: 1.966222 }, tol: 1e-5 },
      { name: 'diameter 2.5882 mm equals AWG 10', in: { I: [10, 'A'], L: [30, 'm'], mat: 1, sz: 2, D: [2.588187, 'mm'], T: 20, V: [12, 'V'], phase: 1 }, out: { Au: 5.261155 }, tol: 1e-5 },
      { name: 'resistivity used is reported (copper 20 °C)', in: { I: [50, 'A'], L: [50, 'm'], A: [10, 'mm²'], mat: 1, T: 20, V: [230, 'V'], phase: 1 }, out: { rho: 1.7241e-8 }, tol: 1e-12 }, { name: 'resistivity used rises with temperature (copper 70 °C)', in: { I: [50, 'A'], L: [50, 'm'], A: [10, 'mm²'], mat: 1, T: 70, V: [230, 'V'], phase: 1 }, out: { rho: 2.06288565e-8 }, tol: 1e-12 },
      { name: 'untouched Custom field matches the Copper preset', in: { I: [50, 'A'], L: [50, 'm'], A: [10, 'mm²'], mat: 7, aC: 0, T: 20, V: [230, 'V'], phase: 1 }, out: { Vd: 8.6205, rho: 1.7241e-8 }, tol: 1e-6 },
      { name: 'custom resistivity equal to copper matches copper', in: { I: [50, 'A'], L: [50, 'm'], A: [10, 'mm²'], mat: 7, rhoC: [1.7241e-8, 'Ω·m'], aC: 0, T: 20, V: [230, 'V'], phase: 1 }, out: { Vd: 8.6205 }, tol: 1e-6 },
      { name: 'AWG above 40 rejected', in: { sz: 1, awg: 41 }, error: 'awg' }, { name: 'zero custom resistivity rejected', in: { mat: 7, rhoC: [0, 'Ω·m'] }, error: 'rhoC' }]),
  C('conductor-temp-resistance', 'Conductor Resistance vs Temperature', '10 Cable and Wire', 'Resistance of a copper or aluminium conductor at its operating temperature.', ['resistance', 'temperature', 'conductor', 'copper', 'aluminium', 'rt', 'operating temperature'],
    [I('R20', 'Resistance at 20 °C', 'resistance', 'Ω', 1, { min: 0, exMin: true }), N('T', 'Operating temperature (°C)', 70, { min: -50, max: 250 }), MATSEL],
    [{ key: 'RT', label: 'Resistance at temperature', dim: 'resistance', unit: 'Ω', prec: 4 }, { key: 'chg', label: 'Change from 20 °C (%)', dim: 'number', unit: '', prec: 2 }],
    'RT = R20 × (1 + α × (T − 20))     α: copper 0.00393, aluminium 0.00403 per °C', ['Linear temperature coefficient', 'Valid across the normal operating range'], 'A cable at 90 °C has about 27% more resistance than the cold catalogue value. Voltage drop and loss should use the hot value.', ['dc-voltage-drop', 'cable-power-loss'],
    (i) => { const m = MAT[i.mat], f = 1 + m.alpha * (i.T - 20), RT = i.R20 * f; return { out: { RT, chg: (f - 1) * 100 }, steps: [`Factor = 1 + ${m.alpha} × (${fmt(i.T, 1)} − 20) = ${fmt(f, 5)}`, `RT = ${fmt(i.R20, 4)} × ${fmt(f, 5)} = ${fmt(RT, 5)} Ω`], sentence: `${m.name} resistance rises by ${fmt((f - 1) * 100, 1)}% at ${fmt(i.T, 0)} °C, from ${q(i.R20, 'Ω', 3)} to ${q(RT, 'Ω', 4)}.` }; },
    [{ name: 'copper 1 Ω at 70 °C', in: { R20: [1, 'Ω'], T: 70, mat: 1 }, out: { RT: 1.1965, chg: 19.65 }, tol: 1e-6 }, { name: 'aluminium 1 Ω at 90 °C', in: { R20: [1, 'Ω'], T: 90, mat: 2 }, out: { RT: 1.2821 }, tol: 1e-6 }, { name: 'at 20 °C nothing changes', in: { R20: [2.5, 'Ω'], T: 20, mat: 1 }, out: { RT: 2.5 }, tol: 1e-9 }]),
  C('copper-vs-aluminium', 'Copper vs Aluminium Conductor', '10 Cable and Wire', 'Resistance of a copper and an aluminium conductor, and the aluminium size that matches copper.', ['copper', 'aluminium', 'aluminum', 'compare', 'conductor', 'weight'],
    [I('A', 'Copper cross-section', 'area', 'mm²', 95, { min: 0, exMin: true }), I('L', 'Length', 'length', 'm', 100, { min: 0, exMin: true })],
    [{ key: 'Rcu', label: 'Copper resistance (20 °C)', dim: 'resistance', unit: 'Ω', prec: 5 }, { key: 'Ral', label: 'Aluminium resistance, same size', dim: 'resistance', unit: 'Ω', prec: 5 }, { key: 'Aeq', label: 'Aluminium size for equal resistance', dim: 'area', unit: 'mm²', prec: 1 }, { key: 'wr', label: 'Aluminium mass vs copper (equal resistance)', dim: 'number', unit: '', prec: 3 }],
    'R = ρ L / A     A(Al) = A(Cu) × ρAl / ρCu', ['ρ at 20 °C: copper 1.7241e-8, aluminium 2.8264e-8 Ω·m', 'Density: copper 8960, aluminium 2700 kg/m³'], 'Aluminium needs about 1.64 times the area but weighs about half as much. Terminations, ampacity tables and bending radius are separate checks.', ['dc-voltage-drop', 'cable-size-vd'],
    (i) => { const Rcu = MAT[1].rho * i.L / i.A, Ral = MAT[2].rho * i.L / i.A, r = MAT[2].rho / MAT[1].rho, Aeq = i.A * r, wr = r * MAT[2].dens / MAT[1].dens;
      return { out: { Rcu, Ral, Aeq, wr }, steps: [`Rcu = ρ L / A = ${fmt(Rcu, 6)} Ω`, `Ral = ${fmt(Ral, 6)} Ω`, `ρAl / ρCu = ${fmt(r, 4)}, so aluminium needs ${fmt(Aeq * 1e6, 1)} mm²`, `Mass ratio = ${fmt(r, 4)} × 2700 / 8960 = ${fmt(wr, 4)}`], sentence: `${fmt(i.A * 1e6, 0)} mm² of copper matches about ${fmt(Aeq * 1e6, 0)} mm² of aluminium, which weighs ${fmt(wr * 100, 0)}% as much.` }; },
    [{ name: '95 mm², 100 m', in: { A: [95, 'mm²'], L: [100, 'm'] }, out: { Rcu: 0.01814842, Ral: 0.02975158, Aeq: 155.73807, wr: 0.49399998 }, tol: 1e-6 }]),
  C('motor-power-output', 'Motor Output Power and Efficiency Loss', '12 Motors', 'Shaft power and losses from measured voltage, current, power factor and efficiency.', ['motor', 'output', 'shaft', 'hp', 'kw', 'efficiency', 'input power'],
    [I('V', 'Line voltage (L-L)', 'voltage', 'V', 415, { min: 0, exMin: true }), I('I', 'Line current', 'current', 'A', 140, { min: 0, exMin: true }), PF(0.88), N('eff', 'Efficiency', 0.93, { min: 0, max: 1, exMin: true })],
    [{ key: 'Pin', label: 'Electrical input', dim: 'power', unit: 'kW', prec: 2 }, { key: 'Pout', label: 'Shaft output', dim: 'power', unit: 'kW', prec: 2 }, { key: 'loss', label: 'Motor loss', dim: 'power', unit: 'kW', prec: 2 }],
    'Pin = √3 × V × I × pf     Pout = Pin × η     loss = Pin − Pout', ['Three-phase, balanced', 'Efficiency is the value at this load, not nameplate'], 'Change the shaft output unit to HP. Motors lose efficiency below about 50% load.', ['motor-current', 'motor-torque'],
    (i) => { const Pin = SQ3 * i.V * i.I * i.pf, Pout = Pin * i.eff; return { out: { Pin, Pout, loss: Pin - Pout }, steps: [`Pin = √3 × ${fmt(i.V, 0)} × ${fmt(i.I, 1)} × ${fmt(i.pf, 2)} = ${fmt(Pin / 1000, 3)} kW`, `Pout = ${fmt(Pin / 1000, 3)} × ${fmt(i.eff, 3)} = ${fmt(Pout / 1000, 3)} kW = ${fmt(Pout / HP_W, 2)} HP`], sentence: `The motor draws ${fmt(Pin / 1000, 1)} kW and delivers ${fmt(Pout / 1000, 1)} kW (${fmt(Pout / HP_W, 0)} HP) at the shaft.` }; },
    [{ name: '415 V, 140 A, PF 0.88, 93%', in: { V: [415, 'V'], I: [140, 'A'], pf: 0.88, eff: 0.93 }, out: { Pin: 88.556294, Pout: 82.357353, loss: 6.198941 }, tol: 1e-6 }]),
  C('motor-start-dip', 'Motor Starting Voltage Dip', '12 Motors', 'Voltage dip at the motor bus while it starts, and the torque still available.', ['motor', 'starting', 'voltage dip', 'sag', 'dol', 'fault level', 'weak supply'],
    [I('In', 'Motor full-load current', 'current', 'A', 140, { min: 0, exMin: true }), N('k', 'Starting current (× full-load)', 6.5, { min: 1, max: 12 }), I('V', 'Line voltage (L-L)', 'voltage', 'V', 415, { min: 0, exMin: true }), I('Ssc', 'Fault level at the motor bus', 'apparent', 'MVA', 10, { min: 0, exMin: true })],
    [{ key: 'dip', label: 'Voltage dip (%)', dim: 'number', unit: '', prec: 2 }, { key: 'Sst', label: 'Starting apparent power', dim: 'apparent', unit: 'MVA', prec: 3 }, { key: 'Tq', label: 'Torque available vs full voltage (%)', dim: 'number', unit: '', prec: 1 }],
    'Sst = √3 × V × k × In     dip = Sst / (Ssc + Sst)     torque ∝ (1 − dip)²', ['Source and motor impedances add arithmetically', 'Starting power factor ignored (slightly conservative)'], 'Many specifications limit starting dip to 10 to 15% at the motor bus. Check lights, drives and contactors on the same bus.', ['motor-starting', 'fault-mva'],
    (i) => { const Sst = SQ3 * i.V * i.k * i.In, dip = Sst / (i.Ssc + Sst) * 100, Tq = Math.pow(1 - dip / 100, 2) * 100, w = [];
      if (dip > 15) w.push('Dip above 15% is likely to cause contactor drop-out and flicker. Consider soft starter, star-delta or a stronger source.'); else if (dip > 10) w.push('Dip above 10% exceeds many project limits.');
      return { out: { dip, Sst, Tq }, steps: [`Sst = √3 × ${fmt(i.V, 0)} × ${fmt(i.k * i.In, 1)} = ${fmt(Sst / 1e6, 4)} MVA`, `dip = ${fmt(Sst / 1e6, 4)} / (${fmt(i.Ssc / 1e6, 2)} + ${fmt(Sst / 1e6, 4)}) = ${fmt(dip, 3)} %`, `Torque = (1 − ${fmt(dip / 100, 4)})² = ${fmt(Tq, 2)} % of full-voltage torque`], warnings: w, sentence: `Starting draws ${fmt(Sst / 1e6, 2)} MVA from a ${q(i.Ssc, 'MVA', 1)} bus, so the voltage dips ${fmt(dip, 1)}% and ${fmt(Tq, 0)}% of the torque remains.` }; },
    [{ name: '140 A, 6.5×, 415 V, 10 MVA', in: { In: [140, 'A'], k: 6.5, V: [415, 'V'], Ssc: [10, 'MVA'] }, out: { dip: 6.1394997, Sst: 0.654109, Tq: 88.097935 }, tol: 1e-5 }, { name: 'a stiff source barely dips', in: { In: [140, 'A'], k: 6.5, V: [415, 'V'], Ssc: [500, 'MVA'] }, out: { dip: 0.1306509 }, tol: 1e-5 }]),
  C('pump-motor-power', 'Pump Shaft and Motor Power', '12 Motors', 'Hydraulic, shaft and motor input power for a pump from flow, head and efficiencies.', ['pump', 'flow', 'head', 'motor', 'kw', 'hydraulic', 'water'],
    [I('Q', 'Flow', 'flow', 'm³/h', 100, { min: 0, exMin: true }), I('H', 'Total head', 'length', 'm', 30, { min: 0, exMin: true }), N('rho', 'Liquid density (kg/m³)', 1000, { min: 1, max: 20000 }), N('ep', 'Pump efficiency', 0.7, { min: 0, max: 1, exMin: true }), N('em', 'Motor efficiency', 0.92, { min: 0, max: 1, exMin: true })],
    [{ key: 'Ph', label: 'Hydraulic power', dim: 'power', unit: 'kW', prec: 2 }, { key: 'Ps', label: 'Pump shaft power', dim: 'power', unit: 'kW', prec: 2 }, { key: 'Pm', label: 'Motor electrical input', dim: 'power', unit: 'kW', prec: 2 }],
    'Ph = ρ × g × Q × H     Ps = Ph / ηpump     Pin = Ps / ηmotor', ['g = 9.80665 m/s²', 'Steady flow at the duty point'], 'Select the motor from the shaft power plus a margin (commonly 10 to 20%). Check NPSH and the pump curve separately.', ['motor-current', 'energy-cost'],
    (i) => { const Qs = i.Q, Ph = i.rho * 9.80665 * Qs * i.H, Ps = Ph / i.ep, Pm = Ps / i.em; return { out: { Ph, Ps, Pm }, steps: [`Ph = ${fmt(i.rho, 0)} × 9.80665 × ${fmt(Qs * 3600, 1)} m³/h × ${fmt(i.H, 1)} m = ${fmt(Ph / 1000, 3)} kW`, `Shaft = ${fmt(Ph / 1000, 3)} / ${fmt(i.ep, 2)} = ${fmt(Ps / 1000, 3)} kW`, `Motor input = ${fmt(Ps / 1000, 3)} / ${fmt(i.em, 2)} = ${fmt(Pm / 1000, 3)} kW`], sentence: `Moving ${fmt(Qs * 3600, 0)} m³/h against ${fmt(i.H, 0)} m needs ${fmt(Ps / 1000, 1)} kW at the pump shaft and ${fmt(Pm / 1000, 1)} kW electrical input.` }; },
    [{ name: '100 m³/h, 30 m, water', in: { Q: [100, 'm³/h'], H: [30, 'm'], rho: 1000, ep: 0.7, em: 0.92 }, out: { Ph: 8.172208, Ps: 11.674583, Pm: 12.689764 }, tol: 1e-6 }]),
  C('transformer-sizing', 'Transformer kVA Selection', '13 Transformers', 'Required transformer rating from load, power factor, growth and target loading, rounded to a standard size.', ['transformer', 'kva', 'size', 'sizing', 'select', 'rating'],
    [I('P', 'Connected running load', 'power', 'kW', 450, { min: 0, exMin: true }), PF(0.9), N('g', 'Future growth (%)', 10, { min: 0, max: 200 }), N('ld', 'Target loading', 0.8, { min: 0.3, max: 1, hint: 'Fraction of rating at design load; 0.7 to 0.8 leaves headroom' }), I('V', 'Secondary voltage (L-L)', 'voltage', 'V', 415, { min: 0, exMin: true })],
    [{ key: 'Sr', label: 'Required rating', dim: 'apparent', unit: 'kVA', prec: 1 }, { key: 'Ss', label: 'Next standard size', dim: 'apparent', unit: 'kVA', prec: 0 }, { key: 'I', label: 'Secondary full-load current', dim: 'current', unit: 'A', prec: 0 }],
    'S = P / pf × (1 + growth) / loading     I = S / (√3 × V)', ['Balanced three-phase load', 'Standard sizes: 25, 50, 63, 100, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150 kVA'], 'Harmonic-rich loads, motor starting and ambient temperature can call for a larger or K-rated unit.', ['transformer-current', 'transformer-loading', 'fault-current'],
    (i) => { const Sr = i.P / i.pf * (1 + i.g / 100) / i.ld, k = STD_TX.find((x) => x * 1000 >= Sr - 1e-6), Ss = k ? k * 1000 : NaN, I = Ss / (SQ3 * i.V);
      return { out: { Sr, Ss, I }, steps: [`S = ${fmt(i.P / 1000, 1)} / ${fmt(i.pf, 2)} × ${fmt(1 + i.g / 100, 2)} / ${fmt(i.ld, 2)} = ${fmt(Sr / 1000, 2)} kVA`, `Next standard size = ${k ? k + ' kVA' : 'none in list'}`, `I = ${fmt(Ss / 1000, 0)} kVA / (√3 × ${fmt(i.V, 0)}) = ${fmt(I, 1)} A`], warnings: k ? [] : ['Above the standard list; consider two units in parallel.'], sentence: `The load needs ${fmt(Sr / 1000, 0)} kVA, so choose ${k ? k + ' kVA' : 'a larger or paralleled unit'}.` }; },
    [{ name: '450 kW, PF 0.9, 10% growth, 80% loading', in: { P: [450, 'kW'], pf: 0.9, g: 10, ld: 0.8, V: [415, 'V'] }, out: { Sr: 687.5, Ss: 800, I: 1112.964374 }, tol: 1e-6 }, { name: 'exact fit stays in size', in: { P: [400, 'kW'], pf: 1, g: 0, ld: 1, V: [415, 'V'] }, out: { Ss: 400 }, tol: 1e-9 }]),
  C('transformer-loading', 'Transformer Loading from Measurements', '13 Transformers', 'Present loading and spare capacity from measured secondary current.', ['transformer', 'loading', 'load', 'spare', 'utilisation', 'measured'],
    [I('V', 'Secondary voltage (L-L)', 'voltage', 'V', 415, { min: 0, exMin: true }), I('I', 'Measured line current', 'current', 'A', 900, { min: 0, exMin: true }), I('S', 'Transformer rating', 'apparent', 'kVA', 1000, { min: 0, exMin: true })],
    [{ key: 'Sl', label: 'Present load', dim: 'apparent', unit: 'kVA', prec: 1 }, { key: 'pct', label: 'Loading (%)', dim: 'number', unit: '', prec: 1 }, { key: 'sp', label: 'Spare capacity', dim: 'apparent', unit: 'kVA', prec: 1 }],
    'Load = √3 × V × I     loading = Load / rating', ['Balanced phases (use the average of the three line currents)'], 'Sustained loading above 100% shortens insulation life. Check the winding temperature indicator as well.', ['transformer-sizing', 'transformer-efficiency'],
    (i) => { const Sl = SQ3 * i.V * i.I, pct = Sl / i.S * 100, w = pct > 100 ? ['Overloaded. Reduce load or add capacity.'] : pct > 80 ? ['Above 80% leaves little room for growth.'] : [];
      return { out: { Sl, pct, sp: i.S - Sl }, steps: [`Load = √3 × ${fmt(i.V, 0)} × ${fmt(i.I, 1)} = ${fmt(Sl / 1000, 2)} kVA`, `Loading = ${fmt(Sl / 1000, 2)} / ${fmt(i.S / 1000, 0)} = ${fmt(pct, 2)} %`], warnings: w, sentence: `${fmt(i.I, 0)} A at ${q(i.V, 'V', 0)} is ${fmt(Sl / 1000, 0)} kVA, which loads the ${q(i.S, 'kVA', 0)} transformer to ${fmt(pct, 1)}%.` }; },
    [{ name: '900 A on 1000 kVA', in: { V: [415, 'V'], I: [900, 'A'], S: [1000, 'kVA'] }, out: { Sl: 646.920977, pct: 64.692098, sp: 353.079023 }, tol: 1e-6 }]),
  C('fault-types', 'Fault Current by Fault Type', '17 Short Circuit', 'Three-phase, line-to-line and line-to-earth fault currents from positive-sequence impedance and the zero-sequence ratio.', ['fault', 'short circuit', 'line to earth', 'earth fault', 'line to line', 'sequence', 'slg', 'ground fault'],
    [I('V', 'System voltage (L-L)', 'voltage', 'V', 415, { min: 0, exMin: true }), I('Z1', 'Positive-sequence impedance to the fault', 'resistance', 'mΩ', 20, { min: 0, exMin: true }), N('r0', 'Zero-sequence ÷ positive-sequence impedance', 1, { min: 0.1, max: 20, hint: 'About 1 for a solidly earthed transformer secondary, often 2 to 5 at the end of a cable run' })],
    [{ key: 'I3', label: 'Three-phase fault', dim: 'current', unit: 'kA', prec: 2 }, { key: 'Ill', label: 'Line-to-line fault', dim: 'current', unit: 'kA', prec: 2 }, { key: 'Ie', label: 'Line-to-earth fault', dim: 'current', unit: 'kA', prec: 2 }],
    'I3φ = V / (√3 Z1)     ILL = (√3 / 2) × I3φ     ILE = √3 V / (2 Z1 + Z0)', ['Z2 = Z1', 'Impedances combined as magnitudes (no angle), slightly conservative', 'Bolted fault, no arc resistance'], 'The largest value sets the breaking capacity; the smallest earth-fault value must still trip the protective device in time.', ['cable-sc-withstand', 'fault-mva'],
    (i) => { const I3 = i.V / (SQ3 * i.Z1), Ill = SQ3 / 2 * I3, Ie = SQ3 * i.V / (2 * i.Z1 + i.r0 * i.Z1); return { out: { I3, Ill, Ie }, steps: [`I3φ = ${fmt(i.V, 0)} / (√3 × ${fmt(i.Z1 * 1000, 2)} mΩ) = ${fmt(I3 / 1000, 3)} kA`, `ILL = 0.866 × I3φ = ${fmt(Ill / 1000, 3)} kA`, `ILE = √3 × ${fmt(i.V, 0)} / ((2 + ${fmt(i.r0, 2)}) × ${fmt(i.Z1 * 1000, 2)} mΩ) = ${fmt(Ie / 1000, 3)} kA`], sentence: `At ${q(i.V, 'V', 0)} and Z1 = ${fmt(i.Z1 * 1000, 1)} mΩ the three-phase fault is ${fmt(I3 / 1000, 2)} kA and the line-to-earth fault is ${fmt(Ie / 1000, 2)} kA.` }; },
    [{ name: '415 V, 20 mΩ, Z0 = Z1', in: { V: [415, 'V'], Z1: [20, 'mΩ'], r0: 1 }, out: { I3: 11.980018, Ill: 10.375, Ie: 11.980018 }, tol: 1e-6 }, { name: 'Z0 = 3 × Z1 lowers the earth fault', in: { V: [415, 'V'], Z1: [20, 'mΩ'], r0: 3 }, out: { Ie: 7.188011 }, tol: 1e-6 }]),
  C('per-unit-convert', 'Per-Unit Base Conversion', '19 Power Systems', 'Convert a per-unit impedance from one MVA and voltage base to another.', ['per unit', 'pu', 'base', 'impedance', 'conversion', 'mva base'],
    [N('z', 'Impedance on old base (pu)', 0.08, { min: 0, exMin: true }), I('S1', 'Old MVA base', 'apparent', 'MVA', 10, { min: 0, exMin: true }), I('V1', 'Old voltage base', 'voltage', 'kV', 11, { min: 0, exMin: true }), I('S2', 'New MVA base', 'apparent', 'MVA', 100, { min: 0, exMin: true }), I('V2', 'New voltage base', 'voltage', 'kV', 11, { min: 0, exMin: true })],
    [{ key: 'zn', label: 'Impedance on new base (pu)', dim: 'number', unit: '', prec: 5 }],
    'Znew = Zold × (Snew / Sold) × (Vold / Vnew)²', ['Same physical impedance, different base'], 'Typical use: put transformer and source impedances on one common system base before adding them.', ['per-unit-base', 'fault-mva'],
    (i) => { const zn = i.z * (i.S2 / i.S1) * Math.pow(i.V1 / i.V2, 2); return { out: { zn }, steps: [`Znew = ${fmt(i.z, 4)} × (${fmt(i.S2 / 1e6, 1)} / ${fmt(i.S1 / 1e6, 1)}) × (${fmt(i.V1 / 1000, 2)} / ${fmt(i.V2 / 1000, 2)})² = ${fmt(zn, 5)} pu`], sentence: `${fmt(i.z, 3)} pu on ${q(i.S1, 'MVA', 0)} becomes ${fmt(zn, 4)} pu on ${q(i.S2, 'MVA', 0)}.` }; },
    [{ name: '0.08 pu, 10 to 100 MVA', in: { z: 0.08, S1: [10, 'MVA'], V1: [11, 'kV'], S2: [100, 'MVA'], V2: [11, 'kV'] }, out: { zn: 0.8 }, tol: 1e-9 }, { name: 'voltage base change', in: { z: 0.1, S1: [50, 'MVA'], V1: [33, 'kV'], S2: [50, 'MVA'], V2: [11, 'kV'] }, out: { zn: 0.9 }, tol: 1e-9 }]),
  C('battery-series-parallel', 'Battery Series-Parallel Bank', '15 Batteries and UPS', 'Bank voltage, capacity and energy from the number of series and parallel batteries.', ['battery', 'series', 'parallel', 'bank', 'string', 'ah', 'voltage'],
    [I('Vc', 'Battery or cell voltage', 'voltage', 'V', 12, { min: 0, exMin: true }), I('Ahc', 'Battery capacity', 'charge', 'Ah', 100, { min: 0, exMin: true }), N('ns', 'Batteries in series per string', 4, { min: 1, max: 500 }), N('np', 'Parallel strings', 2, { min: 1, max: 100 })],
    [{ key: 'Vb', label: 'Bank voltage', dim: 'voltage', unit: 'V', prec: 1 }, { key: 'Ahb', label: 'Bank capacity', dim: 'charge', unit: 'Ah', prec: 1 }, { key: 'E', label: 'Bank energy', dim: 'energy', unit: 'kWh', prec: 2 }],
    'V = ns × Vc     Ah = np × Ahc     E = V × Ah', ['Identical batteries at the same state of charge'], 'Keep parallel strings to four or fewer in lead-acid banks to limit current imbalance.', ['battery-bank-size', 'ups-runtime'],
    (i) => { const Vb = i.ns * i.Vc, Ahb = i.np * i.Ahc, E = Vb * Ahb; return { out: { Vb, Ahb, E }, steps: [`V = ${fmt(i.ns, 0)} × ${fmt(i.Vc, 1)} = ${fmt(Vb, 1)} V`, `Ah = ${fmt(i.np, 0)} × ${fmt(i.Ahc, 1)} = ${fmt(Ahb, 1)} Ah`, `E = ${fmt(Vb, 1)} × ${fmt(Ahb, 1)} = ${fmt(E / 1000, 3)} kWh`], warnings: i.np > 4 ? ['More than four parallel strings: current sharing becomes hard to control.'] : [], sentence: `${fmt(i.ns, 0)} series by ${fmt(i.np, 0)} parallel of ${q(i.Vc, 'V', 0)} ${fmt(i.Ahc, 0)} Ah batteries gives ${fmt(Vb, 0)} V, ${fmt(Ahb, 0)} Ah, ${fmt(E / 1000, 1)} kWh.` }; },
    isInt('ns', 'Series count'), [{ name: '4s2p of 12 V 100 Ah', in: { Vc: [12, 'V'], Ahc: [100, 'Ah'], ns: 4, np: 2 }, out: { Vb: 48, Ahb: 200, E: 9.6 }, tol: 1e-9 }, { name: 'fractional count rejected', in: { Vc: [12, 'V'], Ahc: [100, 'Ah'], ns: 2.5, np: 1 }, error: 'ns' }]),
  C('pv-array-size', 'Solar PV Array Size from Energy Need', '25 Solar PV', 'Array rating and number of modules for a daily energy target.', ['solar', 'pv', 'array', 'kwp', 'panels', 'modules', 'daily energy', 'sizing'],
    [I('E', 'Daily energy needed', 'energy', 'kWh', 30, { min: 0, exMin: true }), N('psh', 'Peak sun hours per day', 5, { min: 0.5, max: 9 }), N('pr', 'Performance ratio', 0.75, { min: 0.3, max: 1, hint: '0.7 to 0.8 for a typical grid-tied system, lower with batteries' }), I('Pm', 'Module rating', 'power', 'W', 550, { min: 0, exMin: true })],
    [{ key: 'Pa', label: 'Array rating', dim: 'power', unit: 'kW', prec: 2 }, { key: 'nm', label: 'Modules needed', dim: 'number', unit: '', prec: 0 }],
    'Parray = E / (PSH × PR)     modules = Parray / Pmodule, rounded up', ['PSH is the daily irradiation on the module plane in kWh/m²', 'Performance ratio covers temperature, soiling, cable and inverter losses'], 'Get PSH from site irradiation data. Roof area, string voltage window and inverter size are separate checks.', ['pv-string-size', 'pv-energy'],
    (i) => { const Pa = i.E / (i.psh * i.pr), nm = Math.ceil(Pa / i.Pm - 1e-9); return { out: { Pa, nm }, steps: [`Parray = ${fmt(i.E / 1000, 1)} kWh / (${fmt(i.psh, 2)} × ${fmt(i.pr, 2)}) = ${fmt(Pa / 1000, 3)} kW`, `Modules = ${fmt(Pa, 0)} / ${fmt(i.Pm, 0)} = ${fmt(Pa / i.Pm, 2)}, rounded up to ${nm}`], sentence: `${q(i.E, 'kWh', 0)} a day needs a ${fmt(Pa / 1000, 2)} kW array, which is ${nm} modules of ${fmt(i.Pm, 0)} W.` }; },
    [{ name: '30 kWh/day, 5 PSH, PR 0.75', in: { E: [30, 'kWh'], psh: 5, pr: 0.75, Pm: [550, 'W'] }, out: { Pa: 8, nm: 15 }, tol: 1e-9 }]),
  C('led-retrofit-payback', 'LED Retrofit Savings and Payback', '28 Lighting', 'Energy, cost saving and payback from replacing old fittings with LED.', ['led', 'retrofit', 'saving', 'payback', 'lighting', 'energy saving', 'roi'],
    [N('n', 'Number of fittings', 100, { min: 1, max: 100000 }), I('Wo', 'Existing fitting power', 'power', 'W', 150, { min: 0, exMin: true }), I('Wn', 'LED fitting power', 'power', 'W', 60, { min: 0, exMin: true }), N('h', 'Operating hours per year', 4000, { min: 1, max: 8760 }), N('tar', 'Energy tariff (per kWh)', 8, { min: 0, exMin: true }), N('cost', 'Cost per new fitting', 2500, { min: 0 })],
    [{ key: 'Es', label: 'Energy saved per year', dim: 'energy', unit: 'kWh', prec: 0 }, { key: 'cs', label: 'Cost saved per year', dim: 'number', unit: '', prec: 0 }, { key: 'pb', label: 'Simple payback (years)', dim: 'number', unit: '', prec: 2 }],
    'Saved energy = n × (Wold − Wnew) × hours     payback = n × cost / yearly saving', ['Fixed hours and tariff', 'Maintenance and lamp-replacement savings not included (they shorten payback)'], 'Tariff and cost use any one currency. Include demand charges for a fuller picture.', ['energy-cost', 'lumen-method'],
    (i) => { const Es = i.n * (i.Wo - i.Wn) * i.h, cs = Es / 1000 * i.tar, pb = i.n * i.cost / cs; return { out: { Es, cs, pb }, steps: [`Saved = ${fmt(i.n, 0)} × (${fmt(i.Wo, 0)} − ${fmt(i.Wn, 0)}) W × ${fmt(i.h, 0)} h = ${fmt(Es / 1000, 0)} kWh`, `Cost saved = ${fmt(Es / 1000, 0)} × ${fmt(i.tar, 2)} = ${fmt(cs, 0)}`, `Payback = ${fmt(i.n * i.cost, 0)} / ${fmt(cs, 0)} = ${fmt(pb, 2)} years`], sentence: `Replacing ${fmt(i.n, 0)} fittings saves ${fmt(Es / 1000, 0)} kWh a year, worth ${fmt(cs, 0)}, and pays back in ${fmt(pb, 1)} years.` }; },
    (v) => (v.Wn >= v.Wo ? [{ key: 'Wn', msg: 'LED power must be lower than the existing fitting power' }] : []),
    [{ name: '100 fittings, 150 W to 60 W', in: { n: 100, Wo: [150, 'W'], Wn: [60, 'W'], h: 4000, tar: 8, cost: 2500 }, out: { Es: 36000, cs: 288000, pb: 0.868056 }, tol: 1e-5 }, { name: 'LED above existing rejected', in: { n: 10, Wo: [50, 'W'], Wn: [60, 'W'], h: 4000, tar: 8, cost: 100 }, error: 'Wn' }]),
  C('resonance-lc', 'LC Resonance and Q Factor', '03 AC Circuits', 'Resonant frequency, reactance at resonance and Q of a series RLC circuit.', ['resonance', 'resonant', 'lc', 'tank', 'q factor', 'bandwidth', 'frequency'],
    [I('L', 'Inductance', 'inductance', 'mH', 10, { min: 0, exMin: true }), I('C', 'Capacitance', 'capacitance', 'µF', 10, { min: 0, exMin: true }), I('R', 'Series resistance', 'resistance', 'Ω', 5, { min: 0, exMin: true })],
    [{ key: 'f0', label: 'Resonant frequency', dim: 'frequency', unit: 'Hz', prec: 2 }, { key: 'X0', label: 'Reactance at resonance', dim: 'resistance', unit: 'Ω', prec: 3 }, { key: 'Q', label: 'Quality factor Q', dim: 'number', unit: '', prec: 3 }, { key: 'bw', label: 'Bandwidth', dim: 'frequency', unit: 'Hz', prec: 2 }],
    'f0 = 1 / (2π √(LC))     X0 = √(L / C)     Q = X0 / R     BW = f0 / Q', ['Ideal series circuit', 'Component losses are lumped in R'], 'Resonance with capacitor banks and system inductance is a real harmonic-amplification risk on industrial networks.', ['reactance', 'impedance-rlc'],
    (i) => { const f0 = 1 / (2 * Math.PI * Math.sqrt(i.L * i.C)), X0 = Math.sqrt(i.L / i.C), Qf = X0 / i.R; return { out: { f0, X0, Q: Qf, bw: f0 / Qf }, steps: [`f0 = 1 / (2π √(${fmt(i.L * 1000, 3)} mH × ${fmt(i.C * 1e6, 3)} µF)) = ${fmt(f0, 3)} Hz`, `X0 = √(L / C) = ${fmt(X0, 4)} Ω`, `Q = ${fmt(X0, 3)} / ${fmt(i.R, 2)} = ${fmt(Qf, 3)}`], sentence: `The circuit resonates at ${fmt(f0, 1)} Hz with Q = ${fmt(Qf, 2)} and a bandwidth of ${fmt(f0 / Qf, 1)} Hz.` }; },
    [{ name: '10 mH, 10 µF, 5 Ω', in: { L: [10, 'mH'], C: [10, 'µF'], R: [5, 'Ω'] }, out: { f0: 503.292121, X0: 31.622777, Q: 6.324555, bw: 79.577472 }, tol: 1e-6 }]),
  C('lc-energy', 'Energy in a Capacitor and an Inductor', '03 AC Circuits', 'Energy stored in a charged capacitor and in a current-carrying inductor.', ['capacitor', 'inductor', 'energy', 'stored', 'joule', 'charge'],
    [I('C', 'Capacitance', 'capacitance', 'µF', 100, { min: 0, exMin: true }), I('V', 'Capacitor voltage', 'voltage', 'V', 400, { min: 0, exMin: true }), I('L', 'Inductance', 'inductance', 'mH', 50, { min: 0, exMin: true }), I('I', 'Inductor current', 'current', 'A', 10, { min: 0, exMin: true })],
    [{ key: 'Ec', label: 'Capacitor energy', dim: 'energy', unit: 'J', prec: 3 }, { key: 'El', label: 'Inductor energy', dim: 'energy', unit: 'J', prec: 3 }],
    'Ec = ½ C V²     El = ½ L I²', ['Ideal components'], 'Stored energy sets the discharge hazard for capacitor banks, and the arcing energy when an inductive circuit is opened.', ['rc-time-constant', 'reactance'],
    (i) => { const Ec = 0.5 * i.C * i.V * i.V, El = 0.5 * i.L * i.I * i.I; return { out: { Ec: Ec / 3600, El: El / 3600 }, steps: [`Ec = ½ × ${fmt(i.C * 1e6, 2)} µF × ${fmt(i.V, 1)}² = ${fmt(Ec, 4)} J`, `El = ½ × ${fmt(i.L * 1000, 2)} mH × ${fmt(i.I, 2)}² = ${fmt(El, 4)} J`], sentence: `The capacitor stores ${fmt(Ec, 2)} J and the inductor stores ${fmt(El, 2)} J.` }; },
    [{ name: '100 µF at 400 V, 50 mH at 10 A', in: { C: [100, 'µF'], V: [400, 'V'], L: [50, 'mH'], I: [10, 'A'] }, out: { Ec: 8, El: 2.5 }, tol: 1e-9 }]),
  C('delta-wye', 'Delta to Star Resistance Conversion', '04 DC Circuits', 'Equivalent star resistors for a delta network of three resistors.', ['delta', 'star', 'wye', 'y', 'transformation', 'network'],
    [I('Rab', 'Rab', 'resistance', 'Ω', 30, { min: 0, exMin: true }), I('Rbc', 'Rbc', 'resistance', 'Ω', 60, { min: 0, exMin: true }), I('Rca', 'Rca', 'resistance', 'Ω', 90, { min: 0, exMin: true })],
    [{ key: 'Ra', label: 'Ra (at node A)', dim: 'resistance', unit: 'Ω', prec: 3 }, { key: 'Rb', label: 'Rb (at node B)', dim: 'resistance', unit: 'Ω', prec: 3 }, { key: 'Rc', label: 'Rc (at node C)', dim: 'resistance', unit: 'Ω', prec: 3 }],
    'Ra = Rab Rca / Σ     Rb = Rab Rbc / Σ     Rc = Rbc Rca / Σ     Σ = Rab + Rbc + Rca', ['Node A joins Rab and Rca, node B joins Rab and Rbc, node C joins Rbc and Rca'], 'For a balanced delta, each star resistor is one third of the delta resistor.', ['resistance-series', 'resistance-parallel'],
    (i) => { const s = i.Rab + i.Rbc + i.Rca, Ra = i.Rab * i.Rca / s, Rb = i.Rab * i.Rbc / s, Rc = i.Rbc * i.Rca / s; return { out: { Ra, Rb, Rc }, steps: [`Σ = ${fmt(s, 3)} Ω`, `Ra = ${fmt(Ra, 4)} Ω, Rb = ${fmt(Rb, 4)} Ω, Rc = ${fmt(Rc, 4)} Ω`], sentence: `The delta network is equivalent to a star of ${fmt(Ra, 2)}, ${fmt(Rb, 2)} and ${fmt(Rc, 2)} Ω.` }; },
    [{ name: '30, 60, 90 Ω', in: { Rab: [30, 'Ω'], Rbc: [60, 'Ω'], Rca: [90, 'Ω'] }, out: { Ra: 15, Rb: 10, Rc: 30 }, tol: 1e-9 }, { name: 'balanced delta divides by three', in: { Rab: [90, 'Ω'], Rbc: [90, 'Ω'], Rca: [90, 'Ω'] }, out: { Ra: 30 }, tol: 1e-9 }]),
  C('line-phase', 'Line and Phase Quantities (Star / Delta)', '06 Three Phase', 'Phase voltage, phase current and per-phase impedance from line values and the winding connection.', ['star', 'delta', 'wye', 'phase voltage', 'line voltage', 'phase current', 'connection'],
    [I('VL', 'Line voltage (L-L)', 'voltage', 'V', 400, { min: 0, exMin: true }), I('IL', 'Line current', 'current', 'A', 10, { min: 0, exMin: true }), ENUM('con', 'Connection', [1, 2], 1, { 1: 'Star (wye)', 2: 'Delta' })],
    [{ key: 'Vp', label: 'Phase voltage', dim: 'voltage', unit: 'V', prec: 2 }, { key: 'Ip', label: 'Phase current', dim: 'current', unit: 'A', prec: 3 }, { key: 'Zp', label: 'Impedance per phase', dim: 'resistance', unit: 'Ω', prec: 3 }, { key: 'S', label: 'Total apparent power', dim: 'apparent', unit: 'kVA', prec: 3 }],
    'Star: Vph = VL / √3, Iph = IL     Delta: Vph = VL, Iph = IL / √3     Zph = Vph / Iph     S = √3 VL IL', ['Balanced three-phase load'], 'A delta winding needs 1.73 times the voltage rating of a star winding on the same line supply.', ['three-phase-power', 'amps-to-kva'],
    (i) => { const star = i.con === 1, Vp = star ? i.VL / SQ3 : i.VL, Ip = star ? i.IL : i.IL / SQ3, Zp = Vp / Ip, S = SQ3 * i.VL * i.IL; return { out: { Vp, Ip, Zp, S }, steps: [`${star ? 'Star' : 'Delta'}: Vph = ${fmt(Vp, 3)} V, Iph = ${fmt(Ip, 4)} A`, `Zph = ${fmt(Vp, 3)} / ${fmt(Ip, 4)} = ${fmt(Zp, 3)} Ω`, `S = √3 × ${fmt(i.VL, 0)} × ${fmt(i.IL, 2)} = ${fmt(S / 1000, 3)} kVA`], sentence: `In ${star ? 'star' : 'delta'}, each phase sees ${fmt(Vp, 1)} V and carries ${fmt(Ip, 2)} A, an impedance of ${fmt(Zp, 2)} Ω.` }; },
    [{ name: 'star, 400 V, 10 A', in: { VL: [400, 'V'], IL: [10, 'A'], con: 1 }, out: { Vp: 230.940108, Ip: 10, Zp: 23.094011, S: 6.928203 }, tol: 1e-6 }, { name: 'delta, 400 V, 10 A', in: { VL: [400, 'V'], IL: [10, 'A'], con: 2 }, out: { Vp: 400, Ip: 5.773503, Zp: 69.282032 }, tol: 1e-6 }]),
  C('generator-fuel', 'Generator Fuel Consumption and Autonomy', '14 Generators', 'Fuel burn per hour and tank runtime from load and specific fuel consumption.', ['generator', 'diesel', 'fuel', 'consumption', 'litres', 'tank', 'runtime', 'sfc'],
    [I('P', 'Electrical load', 'power', 'kW', 400, { min: 0, exMin: true }), N('sfc', 'Specific fuel consumption (g/kWh)', 230, { min: 100, max: 600, hint: 'From the engine data sheet at this load, typically 200 to 260 for diesel' }), N('d', 'Fuel density (kg/L)', 0.84, { min: 0.5, max: 1.2 }), I('Tk', 'Tank volume', 'volume', 'L', 500, { min: 0, exMin: true })],
    [{ key: 'lph', label: 'Fuel consumption (L/h)', dim: 'number', unit: '', prec: 1 }, { key: 'rt', label: 'Runtime on one tank', dim: 'time', unit: 'h', prec: 2 }],
    'Fuel mass flow = P × SFC     L/h = mass flow / density     runtime = tank / (L/h)', ['Steady load', 'SFC taken at the stated load'], 'Assume no more than about 90% of the tank is usable, and add reserve for fuel-polishing and sludge.', ['generator-kva', 'energy-cost'],
    (i) => { const lph = i.P / 1000 * i.sfc / 1000 / i.d, rt = (i.Tk * 1000) / lph * 3600; return { out: { lph, rt }, steps: [`Fuel = ${fmt(i.P / 1000, 1)} kW × ${fmt(i.sfc, 0)} g/kWh = ${fmt(i.P / 1000 * i.sfc / 1000, 2)} kg/h`, `L/h = ${fmt(i.P / 1000 * i.sfc / 1000, 2)} / ${fmt(i.d, 2)} = ${fmt(lph, 2)} L/h`, `Runtime = ${fmt(i.Tk * 1000, 0)} L / ${fmt(lph, 2)} = ${fmt(rt / 3600, 2)} h`], sentence: `At ${q(i.P, 'kW', 0)} the set burns ${fmt(lph, 1)} L/h, so a ${fmt(i.Tk * 1000, 0)} L tank lasts ${fmt(rt / 3600, 1)} hours.` }; },
    [{ name: '400 kW, 230 g/kWh, 0.84 kg/L, 500 L', in: { P: [400, 'kW'], sfc: 230, d: 0.84, Tk: [500, 'L'] }, out: { lph: 109.52381, rt: 4.565217 }, tol: 1e-6 }]),
  C('maximum-demand', 'Maximum Demand', '07 Power / Energy', 'Coincident maximum demand from connected load, demand factor and diversity factor.', ['maximum demand', 'demand factor', 'diversity', 'connected load', 'md', 'load estimation'],
    [I('Pc', 'Connected load', 'power', 'kW', 500, { min: 0, exMin: true }), N('df', 'Demand factor', 0.7, { min: 0, max: 1, exMin: true }), N('dv', 'Diversity factor', 1.2, { min: 1, max: 5 }), PF(0.9)],
    [{ key: 'md', label: 'Maximum demand', dim: 'power', unit: 'kW', prec: 1 }, { key: 'S', label: 'Maximum demand', dim: 'apparent', unit: 'kVA', prec: 1 }],
    'MD = connected × demand factor / diversity factor     S = MD / pf', ['Demand factor = max demand ÷ connected load for each group', 'Diversity factor ≥ 1 reflects groups peaking at different times'], 'Use factors from your project specification or standard; the defaults are only examples.', ['transformer-sizing', 'generator-kva'],
    (i) => { const md = i.Pc * i.df / i.dv, S = md / i.pf; return { out: { md, S }, steps: [`MD = ${fmt(i.Pc / 1000, 1)} × ${fmt(i.df, 2)} / ${fmt(i.dv, 2)} = ${fmt(md / 1000, 2)} kW`, `S = ${fmt(md / 1000, 2)} / ${fmt(i.pf, 2)} = ${fmt(S / 1000, 2)} kVA`], sentence: `${q(i.Pc, 'kW', 0)} connected gives a maximum demand of ${fmt(md / 1000, 0)} kW (${fmt(S / 1000, 0)} kVA).` }; },
    [{ name: '500 kW, DF 0.7, diversity 1.2, PF 0.9', in: { Pc: [500, 'kW'], df: 0.7, dv: 1.2, pf: 0.9 }, out: { md: 291.667, S: 324.074 }, tol: 1e-5 }]),
  C('ngr-sizing', 'Neutral Earthing Resistor', '18 Earthing', 'Resistance and short-time power of a neutral earthing resistor for a chosen earth-fault current.', ['ngr', 'neutral earthing', 'resistor', 'earth fault', 'grounding resistor', 'limit'],
    [I('V', 'System voltage (L-L)', 'voltage', 'kV', 11, { min: 0, exMin: true }), I('If', 'Earth-fault current to allow', 'current', 'A', 400, { min: 0, exMin: true }), I('t', 'Fault duration', 'time', 's', 10, { min: 0, exMin: true })],
    [{ key: 'R', label: 'Resistance', dim: 'resistance', unit: 'Ω', prec: 2 }, { key: 'P', label: 'Power during fault', dim: 'power', unit: 'kW', prec: 1 }, { key: 'E', label: 'Energy during fault', dim: 'energy', unit: 'kWh', prec: 3 }],
    'R = (V / √3) / If     P = If² × R     E = P × t', ['Single line-to-earth fault, source impedance neglected', 'Fault current is purely resistive'], 'Choose the current from relay sensitivity and damage limits. The resistor is rated for its short-time duty, not for continuous use.', ['fault-types', 'earth-rod-resistance'],
    (i) => { const R = i.V / SQ3 / i.If, P = i.If * i.If * R, E = P * i.t / 3600; return { out: { R, P, E }, steps: [`R = (${fmt(i.V / 1000, 1)} kV / √3) / ${fmt(i.If, 1)} A = ${fmt(R, 3)} Ω`, `P = ${fmt(i.If, 1)}² × ${fmt(R, 3)} = ${fmt(P / 1000, 1)} kW for ${fmt(i.t, 1)} s`], sentence: `A ${q(i.V, 'kV', 1)} system limited to ${fmt(i.If, 0)} A needs a ${fmt(R, 2)} Ω resistor dissipating ${fmt(P / 1000, 0)} kW during the fault.` }; },
    [{ name: '11 kV, 400 A', in: { V: [11, 'kV'], If: [400, 'A'], t: [10, 's'] }, out: { R: 15.877132, P: 2540.341184, E: 7.056503 }, tol: 1e-6 }]),
  C('earth-rods-parallel', 'Earth Rods in Parallel', '18 Earthing', 'Combined earth resistance of several rods allowing for mutual interference.', ['earth', 'rods', 'parallel', 'electrodes', 'earth pit', 'grounding', 'resistance'],
    [I('R1', 'Single rod resistance', 'resistance', 'Ω', 30, { min: 0, exMin: true }), N('n', 'Number of rods', 4, { min: 1, max: 100 }), N('u', 'Utilisation factor', 0.85, { min: 0.3, max: 1, hint: 'Falls as rods are spaced closer; about 0.8 to 0.9 at spacing of twice the rod length' })],
    [{ key: 'Rt', label: 'Combined resistance', dim: 'resistance', unit: 'Ω', prec: 3 }],
    'Rn = R1 / (n × u)', ['Rods driven in the same soil', 'Utilisation factor is user-supplied'], 'Doubling the rods does not halve the resistance. Deeper rods or lower-resistivity backfill often work better than more rods.', ['earth-rod-resistance', 'earth-grid-resistance'],
    (i) => { const Rt = i.R1 / (i.n * i.u); return { out: { Rt }, steps: [`Rn = ${fmt(i.R1, 2)} / (${fmt(i.n, 0)} × ${fmt(i.u, 2)}) = ${fmt(Rt, 4)} Ω`], sentence: `${fmt(i.n, 0)} rods of ${q(i.R1, 'Ω', 1)} each give about ${fmt(Rt, 2)} Ω combined.` }; },
    isInt('n', 'Number of rods'), [{ name: '4 rods of 30 Ω, u 0.85', in: { R1: [30, 'Ω'], n: 4, u: 0.85 }, out: { Rt: 8.82353 }, tol: 1e-5 }, { name: 'one rod, u = 1 is unchanged', in: { R1: [30, 'Ω'], n: 1, u: 1 }, out: { Rt: 30 }, tol: 1e-9 }]),
  C('earth-grid-resistance', 'Earth Grid Resistance', '18 Earthing', 'Resistance of a buried earthing grid from soil resistivity, grid area and total conductor length.', ['earth grid', 'earthing grid', 'mesh', 'substation', 'resistance', 'laurent', 'soil resistivity'],
    [I('rho', 'Soil resistivity', 'resistivity', 'Ω·m', 100, { min: 0, exMin: true }), I('A', 'Area covered by the grid', 'area', 'm²', 900, { min: 0, exMin: true }), I('LT', 'Total buried conductor length', 'length', 'm', 600, { min: 0, exMin: true })],
    [{ key: 'Rg', label: 'Grid resistance', dim: 'resistance', unit: 'Ω', prec: 3 }],
    'Rg = ρ / (4r) + ρ / LT     r = √(A / π)', ['Uniform soil', 'Grid buried at shallow depth', 'Laurent-Niemann form; the Sverak refinement adds a depth term'], 'Measure soil resistivity on site (Wenner method). Step and touch voltage need a separate study.', ['earth-rods-parallel', 'earth-rod-resistance'],
    (i) => { const r = Math.sqrt(i.A / Math.PI), Rg = i.rho / (4 * r) + i.rho / i.LT; return { out: { Rg }, steps: [`Equivalent radius r = √(${fmt(i.A, 0)} / π) = ${fmt(r, 3)} m`, `Rg = ${fmt(i.rho, 1)} / (4 × ${fmt(r, 3)}) + ${fmt(i.rho, 1)} / ${fmt(i.LT, 0)} = ${fmt(Rg, 4)} Ω`], sentence: `A ${fmt(i.A, 0)} m² grid with ${fmt(i.LT, 0)} m of conductor in ${fmt(i.rho, 0)} Ω·m soil has a resistance of about ${fmt(Rg, 2)} Ω.` }; },
    [{ name: '100 Ω·m, 900 m², 600 m', in: { rho: [100, 'Ω·m'], A: [900, 'm²'], LT: [600, 'm'] }, out: { Rg: 1.643712 }, tol: 1e-6 }]),
  C('parallel-cable-sets', 'Parallel Cable Sets', '10 Cable and Wire', 'Number of parallel cables needed for a design current after grouping derating.', ['parallel cables', 'multiple cores', 'sets', 'large current', 'cable runs', 'derating'],
    [I('Ib', 'Design current', 'current', 'A', 1200, { min: 0, exMin: true }), I('Iz', 'Rated current of one cable', 'current', 'A', 400, { min: 0, exMin: true, hint: 'From the data sheet for the installation method' }), N('kg', 'Grouping and other derating factor', 0.8, { min: 0.1, max: 1 })],
    [{ key: 'n', label: 'Cables per phase', dim: 'number', unit: '', prec: 0 }, { key: 'Iu', label: 'Derated current of one cable', dim: 'current', unit: 'A', prec: 1 }],
    'n = ceil(Ib / (Iz × k))', ['Equal cables of the same length and type', 'Current shares equally'], 'Parallel cables must have equal length, size and route conditions or the current will not share. Keep each set a similar distance from the others.', ['cable-derating', 'cable-sc-withstand'],
    (i) => { const Iu = i.Iz * i.kg, n = Math.ceil(i.Ib / Iu - 1e-9); return { out: { n, Iu }, steps: [`Derated current per cable = ${fmt(i.Iz, 0)} × ${fmt(i.kg, 2)} = ${fmt(Iu, 1)} A`, `n = ${fmt(i.Ib, 0)} / ${fmt(Iu, 1)} = ${fmt(i.Ib / Iu, 2)}, rounded up to ${n}`], sentence: `A ${fmt(i.Ib, 0)} A circuit needs ${n} parallel cables of ${fmt(i.Iz, 0)} A rating at ${fmt(i.kg, 2)} derating.` }; },
    [{ name: '1200 A, 400 A cables, 0.8', in: { Ib: [1200, 'A'], Iz: [400, 'A'], kg: 0.8 }, out: { n: 4, Iu: 320 }, tol: 1e-9 }, { name: 'exact fit does not add a cable', in: { Ib: [800, 'A'], Iz: [400, 'A'], kg: 1 }, out: { n: 2 }, tol: 1e-9 }]),
  C('conduit-fill', 'Conduit Fill', '11 Conduit and Raceway', 'Fill percentage of a conduit for a number of equal cables, with the commonly used fill limit.', ['conduit', 'fill', 'raceway', 'cables in conduit', 'duct', 'pipe size'],
    [I('D', 'Conduit inside diameter', 'length', 'mm', 50, { min: 0, exMin: true }), I('d', 'Cable outside diameter', 'length', 'mm', 12, { min: 0, exMin: true }), N('n', 'Number of cables', 6, { min: 1, max: 500 })],
    [{ key: 'fill', label: 'Fill (%)', dim: 'number', unit: '', prec: 2 }, { key: 'lim', label: 'Common fill limit (%)', dim: 'number', unit: '', prec: 0 }, { key: 'nmax', label: 'Most cables at the limit', dim: 'number', unit: '', prec: 0 }],
    'fill = n × (d / D)² × 100     limit: 53% for 1 cable, 31% for 2, 40% for 3 or more', ['Round, equal cables', 'Limits are the widely used general rule; your code may differ'], 'Pulling tension, bends and the length of run can require a lower fill than the limit.', ['cable-derating', 'parallel-cable-sets'],
    (i) => { const fill = i.n * Math.pow(i.d / i.D, 2) * 100, lim = i.n === 1 ? 53 : i.n === 2 ? 31 : 40, nmax = Math.floor(lim / 100 * Math.pow(i.D / i.d, 2) + 1e-9); return { out: { fill, lim, nmax }, steps: [`fill = ${fmt(i.n, 0)} × (${fmt(i.d * 1000, 1)} / ${fmt(i.D * 1000, 1)})² × 100 = ${fmt(fill, 3)} %`, `Limit for ${fmt(i.n, 0)} cable${i.n === 1 ? '' : 's'} = ${lim} %`], warnings: i.d >= i.D ? ['The cable is as large as the conduit or larger, so it does not fit. Check the diameters and their units.'] : fill > lim ? ['Fill is above the limit. Use a larger conduit or fewer cables.'] : [], sentence: `${fmt(i.n, 0)} cables of ${q(i.d, 'mm', 1)} fill ${fmt(fill, 1)}% of a ${q(i.D, 'mm', 0)} conduit, against a ${lim}% limit.` }; },
    isInt('n', 'Number of cables'), [{ name: '6 × 12 mm in 50 mm', in: { D: [50, 'mm'], d: [12, 'mm'], n: 6 }, out: { fill: 34.56, lim: 40, nmax: 6 }, tol: 1e-9 }, { name: '7 cables exceed 40%', in: { D: [50, 'mm'], d: [12, 'mm'], n: 7 }, out: { fill: 40.32 }, tol: 1e-9 }, { name: 'one cable limit is 53%', in: { D: [50, 'mm'], d: [12, 'mm'], n: 1 }, out: { lim: 53 }, tol: 0 }, { name: 'cable larger than the conduit does not fit', in: { D: [10, 'mm'], d: [20, 'mm'], n: 2 }, out: { fill: 800 }, warn: 'does not fit', tol: 1e-9 }]),
  C('hp-kw-converter', 'HP to kW and kW to HP', '36 Converters and Units', 'Convert mechanical horsepower, metric horsepower and kilowatts.', ['hp', 'horsepower', 'kw', 'kilowatt', 'convert', 'ps'],
    [I('P', 'Power', 'power', 'HP', 100, { min: 0, exMin: true })],
    [{ key: 'kw', label: 'Kilowatts', dim: 'power', unit: 'kW', prec: 3 }, { key: 'hp', label: 'Mechanical horsepower', dim: 'power', unit: 'HP', prec: 3 }, { key: 'ps', label: 'Metric horsepower', dim: 'power', unit: 'PS', prec: 3 }],
    '1 HP = 745.6999 W     1 PS = 735.4988 W', ['HP is mechanical (550 ft·lbf/s)', 'Electrical HP of 746 W differs by 0.04%'], 'Change the input unit to kW and read the other rows.', ['motor-power-output', 'motor-current', 'power-converter'],
    (i) => ({ out: { kw: i.P, hp: i.P, ps: i.P }, steps: [`${fmt(i.P / HP_W, 4)} HP = ${fmt(i.P / 1000, 4)} kW = ${fmt(i.P / 735.49875, 4)} PS`], sentence: `${q(i.P, 'HP', 2)} on this input is ${fmt(i.P / 1000, 3)} kW.` }),
    [{ name: '100 HP', in: { P: [100, 'HP'] }, out: { kw: 74.5699872, ps: 101.38697 }, tol: 1e-6 }, { name: '75 kW in HP', in: { P: [75, 'kW'] }, out: { hp: 100.576657 }, tol: 1e-6 }]),
  C('power-converter', 'Power Unit Converter (W, kW, MW, HP, PS)', '36 Converters and Units', 'Convert real power between watts, kilowatts, megawatts and horsepower: watts to kW, kW to watts, MW to kW.',
    ['watts to kw', 'kw to watts', 'kw to w', 'w to kw', 'mw to kw', 'kw to mw', 'watts to mw', 'mw to watts', 'kilowatts to watts', 'watts to kilowatts', 'megawatts to kilowatts', 'power converter', 'power unit converter', 'convert power'],
    [I('P', 'Power', 'power', 'kW', 1, { min: 0, exMin: true })],
    [{ key: 'w', label: 'Watts', dim: 'power', unit: 'W', prec: 6 }, { key: 'kw', label: 'Kilowatts', dim: 'power', unit: 'kW', prec: 6 }, { key: 'mw', label: 'Megawatts', dim: 'power', unit: 'MW', prec: 6 }, { key: 'hp', label: 'Mechanical horsepower', dim: 'power', unit: 'HP', prec: 4 }],
    '1 kW = 1000 W     1 MW = 1000 kW = 1,000,000 W     1 HP = 745.6999 W', ['Real (active) power only', 'A pure unit change: no voltage, current or power factor is involved'], 'This converts a power in one unit to the same power in another. To get current from power use kW to Amps; to get kVA from kW use kW to kVA, which needs the power factor. HP is mechanical horsepower; see HP to kW for metric horsepower.', ['hp-kw-converter', 'three-phase-current', 'kw-to-kva'],
    (i) => ({ out: { w: i.P, kw: i.P, mw: i.P, hp: i.P }, steps: [`${fmt(i.P, 6)} W = ${fmt(i.P / 1000, 6)} kW = ${fmt(i.P / 1e6, 9)} MW = ${fmt(i.P / HP_W, 4)} HP`], sentence: `${q(i.P, 'W', 6)} is ${fmt(i.P / 1000, 6)} kW.` }),
    [{ name: '1 kW in watts', in: { P: [1, 'kW'] }, out: { w: 1000, mw: 0.001 }, tol: 1e-9 }, { name: '2500 W in kW', in: { P: [2500, 'W'] }, out: { kw: 2.5 }, tol: 1e-9 }, { name: '3 MW in kW', in: { P: [3, 'MW'] }, out: { kw: 3000 }, tol: 1e-9 }, { name: 'zero rejected', in: { P: [0, 'kW'] }, error: 'P' }]),
  C('energy-converter', 'Energy Unit Converter', '36 Converters and Units', 'Convert between kWh, MJ, kcal, BTU and joules.', ['energy', 'kwh', 'mj', 'joule', 'btu', 'kcal', 'convert'],
    [I('E', 'Energy', 'energy', 'kWh', 1, { min: 0, exMin: true })],
    [{ key: 'MJ', label: 'Megajoules', dim: 'energy', unit: 'MJ', prec: 4 }, { key: 'BTU', label: 'BTU', dim: 'energy', unit: 'BTU', prec: 1 }, { key: 'kcal', label: 'Kilocalories', dim: 'energy', unit: 'kcal', prec: 1 }],
    '1 kWh = 3.6 MJ = 3412.14 BTU = 859.845 kcal', ['International table BTU and kilocalorie'], 'Change the input unit to convert in the other direction.', ['energy-cost', 'hp-kw-converter'],
    (i) => ({ out: { MJ: i.E, BTU: i.E, kcal: i.E }, steps: [`${fmt(i.E / 1000, 5)} kWh = ${fmt(i.E / 277.7778, 5)} MJ = ${fmt(i.E / 0.2930711, 1)} BTU = ${fmt(i.E / 1.163, 1)} kcal`], sentence: `${fmt(i.E / 1000, 4)} kWh is ${fmt(i.E * 3.6 / 1000, 4)} MJ.` }),
    [{ name: '1 kWh', in: { E: [1, 'kWh'] }, out: { MJ: 3.6, BTU: 3412.14, kcal: 859.845 }, tol: 1e-5 }, { name: '1 MJ', in: { E: [1, 'MJ'] }, out: { MJ: 1 }, tol: 1e-9 }]),
  C('decibel', 'Decibel Converter', '23 Electronics', 'Convert voltage and power ratios to decibels and back.', ['decibel', 'db', 'gain', 'ratio', 'attenuation', 'amplifier'],
    [N('rv', 'Voltage ratio (Vout / Vin)', 10, { min: 0, exMin: true }), N('rp', 'Power ratio (Pout / Pin)', 100, { min: 0, exMin: true })],
    [{ key: 'dv', label: 'Voltage gain (dB)', dim: 'number', unit: '', prec: 2 }, { key: 'dp', label: 'Power gain (dB)', dim: 'number', unit: '', prec: 2 }],
    'dB = 20 log10(Vout / Vin)     dB = 10 log10(Pout / Pin)', ['Same impedance at input and output for the voltage form'], 'A ratio below 1 gives a negative dB value, which is an attenuation.', ['voltage-divider', 'rc-time-constant'],
    (i) => ({ out: { dv: 20 * Math.log10(i.rv), dp: 10 * Math.log10(i.rp) }, steps: [`20 log10(${fmt(i.rv, 4)}) = ${fmt(20 * Math.log10(i.rv), 3)} dB`, `10 log10(${fmt(i.rp, 4)}) = ${fmt(10 * Math.log10(i.rp), 3)} dB`], sentence: `A voltage ratio of ${fmt(i.rv, 2)} is ${fmt(20 * Math.log10(i.rv), 1)} dB and a power ratio of ${fmt(i.rp, 2)} is ${fmt(10 * Math.log10(i.rp), 1)} dB.` }),
    [{ name: '10× voltage, 100× power', in: { rv: 10, rp: 100 }, out: { dv: 20, dp: 20 }, tol: 1e-9 }, { name: 'half voltage is about −6 dB', in: { rv: 0.5, rp: 1 }, out: { dv: -6.0206 }, tol: 1e-4 }]),
  C('op-amp-gain', 'Op-Amp Gain', '23 Electronics', 'Gain and output voltage of an inverting or non-inverting op-amp stage.', ['op amp', 'opamp', 'amplifier', 'gain', 'inverting', 'non-inverting', 'feedback'],
    [I('Rf', 'Feedback resistor', 'resistance', 'kΩ', 100, { min: 0, exMin: true }), I('Rin', 'Input resistor', 'resistance', 'kΩ', 10, { min: 0, exMin: true }), I('Vin', 'Input voltage', 'voltage', 'V', 0.5, { min: 0, exMin: true }), ENUM('cfg', 'Configuration', [1, 2], 1, { 1: 'Inverting', 2: 'Non-inverting' })],
    [{ key: 'A', label: 'Voltage gain', dim: 'number', unit: '', prec: 3 }, { key: 'Vo', label: 'Output voltage', dim: 'voltage', unit: 'V', prec: 3 }],
    'Inverting: A = −Rf / Rin     Non-inverting: A = 1 + Rf / Rin', ['Ideal op-amp', 'Output stays within the supply rails'], 'Real op-amps saturate near the supply rails and have a finite gain-bandwidth product.', ['voltage-divider', 'decibel'],
    (i) => { const A = i.cfg === 1 ? -i.Rf / i.Rin : 1 + i.Rf / i.Rin, Vo = A * i.Vin; return { out: { A, Vo }, steps: [`A = ${i.cfg === 1 ? '−Rf / Rin' : '1 + Rf / Rin'} = ${fmt(A, 4)}`, `Vout = ${fmt(A, 4)} × ${fmt(i.Vin, 3)} = ${fmt(Vo, 4)} V`], sentence: `The ${i.cfg === 1 ? 'inverting' : 'non-inverting'} stage has a gain of ${fmt(A, 2)}, giving ${fmt(Vo, 2)} V from ${fmt(i.Vin, 2)} V.` }; },
    [{ name: 'inverting 100k / 10k', in: { Rf: [100, 'kΩ'], Rin: [10, 'kΩ'], Vin: [0.5, 'V'], cfg: 1 }, out: { A: -10, Vo: -5 }, tol: 1e-9 }, { name: 'non-inverting 100k / 10k', in: { Rf: [100, 'kΩ'], Rin: [10, 'kΩ'], Vin: [0.5, 'V'], cfg: 2 }, out: { A: 11, Vo: 5.5 }, tol: 1e-9 }]),
  C('water-heater-kw', 'Heater Power for Heating a Liquid', '29 Industrial Electrical', 'Electrical heater rating to raise a volume of water or similar liquid by a set temperature in a set time.', ['heater', 'heating', 'water', 'immersion', 'kw', 'temperature rise', 'boiler', 'tank'],
    [I('V', 'Liquid volume', 'volume', 'L', 1000, { min: 0, exMin: true }), N('dT', 'Temperature rise (K)', 40, { min: 0, exMin: true, max: 100 }), I('t', 'Heating time', 'time', 'h', 2, { min: 0, exMin: true }), N('eff', 'Heater and tank efficiency', 0.9, { min: 0, max: 1, exMin: true }), N('c', 'Specific heat (kJ/kg·K)', 4.186, { min: 0.5, max: 10 })],
    [{ key: 'E', label: 'Heat energy needed', dim: 'energy', unit: 'kWh', prec: 2 }, { key: 'P', label: 'Heater rating', dim: 'power', unit: 'kW', prec: 2 }],
    'Q = m × c × ΔT     P = Q / (t × η)', ['1 L of water is 1 kg', 'Losses during heating are lumped in the efficiency'], 'Add margin for standing losses on long heat-ups, and check the supply current with the three-phase current calculator.', ['three-phase-current', 'energy-cost'],
    (i) => { const m = i.V * 1000, Q = m * i.c * i.dT / 3.6, P = Q / (i.t / 3600) / i.eff; return { out: { E: Q, P }, steps: [`Q = ${fmt(m, 0)} kg × ${fmt(i.c, 3)} × ${fmt(i.dT, 1)} K = ${fmt(m * i.c * i.dT / 1000, 1)} MJ = ${fmt(Q / 1000, 2)} kWh`, `P = ${fmt(Q / 1000, 2)} kWh / (${fmt(i.t / 3600, 2)} h × ${fmt(i.eff, 2)}) = ${fmt(P / 1000, 2)} kW`], sentence: `Heating ${fmt(m, 0)} L by ${fmt(i.dT, 0)} K in ${fmt(i.t / 3600, 1)} h needs ${fmt(Q / 1000, 1)} kWh, so a ${fmt(P / 1000, 1)} kW heater.` }; },
    [{ name: '1000 L, 40 K, 2 h, 90%', in: { V: [1000, 'L'], dT: 40, t: [2, 'h'], eff: 0.9, c: 4.186 }, out: { E: 46.5111, P: 25.8395 }, tol: 1e-4 }]),
  C('ir-temp-correction', 'Insulation Resistance Temperature Correction', '32 Testing and Measurement', 'Insulation resistance corrected to a 40 °C reference using the halving-per-10 °C rule of thumb.', ['insulation resistance', 'megger', 'ir', 'temperature correction', 'insulation test', 'meg ohm', 'cable test'],
    [I('Rm', 'Measured insulation resistance', 'resistance', 'MΩ', 1000, { min: 0, exMin: true }), N('T', 'Winding or cable temperature (°C)', 20, { min: -20, max: 120 })],
    [{ key: 'R40', label: 'Corrected to 40 °C', dim: 'resistance', unit: 'MΩ', prec: 1 }, { key: 'kt', label: 'Correction factor', dim: 'number', unit: '', prec: 4 }],
    'R40 = Rm × 0.5 ^ ((40 − T) / 10)', ['Insulation resistance halves for each 10 °C rise', 'Rule of thumb; use the curve in your test standard where one applies'], 'Always record the temperature with the reading. A cold reading flatters the insulation, so correct before comparing with a minimum value.', ['insulation-pi-dar', 'cable-resistance'],
    (i) => { const kt = Math.pow(0.5, (40 - i.T) / 10); return { out: { R40: i.Rm * kt, kt }, steps: [`kt = 0.5 ^ ((40 − ${fmt(i.T, 1)}) / 10) = ${fmt(kt, 5)}`, `R40 = ${fmt(i.Rm / 1e6, 2)} MΩ × ${fmt(kt, 5)} = ${fmt(i.Rm * kt / 1e6, 2)} MΩ`], sentence: `${q(i.Rm, 'MΩ', 0)} measured at ${fmt(i.T, 0)} °C is ${fmt(i.Rm * kt / 1e6, 1)} MΩ when corrected to 40 °C.` }; },
    [{ name: '1000 MΩ at 20 °C', in: { Rm: [1000, 'MΩ'], T: 20 }, out: { R40: 250, kt: 0.25 }, tol: 1e-9 }, { name: 'at 40 °C nothing changes', in: { Rm: [500, 'MΩ'], T: 40 }, out: { R40: 500 }, tol: 1e-9 }, { name: 'warm reading is corrected up', in: { Rm: [100, 'MΩ'], T: 50 }, out: { R40: 200 }, tol: 1e-9 }]),
  C('insulation-pi-dar', 'Polarisation Index and Dielectric Absorption Ratio', '32 Testing and Measurement', 'PI and DAR from timed insulation resistance readings.', ['polarisation index', 'polarization index', 'pi', 'dar', 'dielectric absorption', 'insulation', 'megger', 'motor test', 'cable test'],
    [I('R30', 'Reading at 30 s', 'resistance', 'MΩ', 1000, { min: 0, exMin: true }), I('R60', 'Reading at 1 min', 'resistance', 'MΩ', 1500, { min: 0, exMin: true }), I('R600', 'Reading at 10 min', 'resistance', 'MΩ', 4500, { min: 0, exMin: true })],
    [{ key: 'dar', label: 'DAR (60 s ÷ 30 s)', dim: 'number', unit: '', prec: 2 }, { key: 'pi', label: 'PI (10 min ÷ 1 min)', dim: 'number', unit: '', prec: 2 }],
    'DAR = R60 / R30     PI = R600 / R60', ['Same test voltage and temperature for all readings', 'Readings taken after the insulation is fully discharged'], 'Commonly quoted guide for PI: below 1 poor, 1 to 2 questionable, 2 to 4 acceptable, above 4 good. A very high resistance can give a low PI that is still healthy. Follow your test standard for pass limits.', ['ir-temp-correction', 'cable-resistance'],
    (i) => { const dar = i.R60 / i.R30, pi = i.R600 / i.R60, g = pi < 1 ? 'poor' : pi < 2 ? 'questionable' : pi <= 4 ? 'acceptable' : 'good', w = pi < 1 ? ['PI below 1 suggests insulation in poor condition. Do not energise without further investigation.'] : [];
      return { out: { dar, pi }, steps: [`DAR = ${fmt(i.R60 / 1e6, 1)} / ${fmt(i.R30 / 1e6, 1)} = ${fmt(dar, 3)}`, `PI = ${fmt(i.R600 / 1e6, 1)} / ${fmt(i.R60 / 1e6, 1)} = ${fmt(pi, 3)}`], warnings: w, sentence: `DAR is ${fmt(dar, 2)} and PI is ${fmt(pi, 2)}, which the common guide rates as ${g}.` }; },
    [{ name: '1000 / 1500 / 4500 MΩ', in: { R30: [1000, 'MΩ'], R60: [1500, 'MΩ'], R600: [4500, 'MΩ'] }, out: { dar: 1.5, pi: 3 }, tol: 1e-9 }, { name: 'flat readings give PI = 1', in: { R30: [500, 'MΩ'], R60: [500, 'MΩ'], R600: [500, 'MΩ'] }, out: { pi: 1 }, tol: 1e-9 }]),
  C('agl-ccr-loading', 'AGL Series Circuit Load and CCR Size', '35 Airport and AGL', 'Output load, loop voltage and the smallest standard constant current regulator for a series lighting circuit.', ['agl', 'ccr', 'constant current regulator', 'series circuit', 'airfield', 'runway', 'taxiway', 'isolating transformer', '6.6 a', 'airport lighting'],
    [N('n', 'Fittings on the circuit', 60, { min: 1, max: 500 }), I('Pl', 'Lamp power per fitting', 'power', 'W', 45, { min: 0, exMin: true, hint: 'At the circuit current, from the fitting data sheet' }), N('et', 'Isolating transformer efficiency', 0.85, { min: 0.5, max: 1, exMin: true, hint: 'From the transformer data sheet at the circuit current' }),
      I('I', 'Circuit current', 'current', 'A', 6.6, { min: 0, exMin: true }), I('L', 'Series cable loop length', 'length', 'm', 4000, { min: 0, exMin: true }), I('R', 'Series cable resistance', 'resPerLen', 'Ω/km', 3.08, { min: 0, exMin: true }), N('ld', 'Maximum CCR loading', 0.8, { min: 0.3, max: 1, hint: 'Fraction of rated kW you are willing to use' })],
    [{ key: 'Pt', label: 'Total circuit load', dim: 'power', unit: 'kW', prec: 3 }, { key: 'Vo', label: 'CCR output voltage', dim: 'voltage', unit: 'V', prec: 0 }, { key: 'Pc', label: 'Cable loss', dim: 'power', unit: 'W', prec: 0 }, { key: 'ccr', label: 'Smallest standard CCR', dim: 'power', unit: 'kW', prec: 1 }, { key: 'pct', label: 'Loading of that CCR (%)', dim: 'number', unit: '', prec: 1 }],
    'Pt = n × Plamp / ηT + I² × R × L     Vout = Pt / I     CCR ≥ Pt / max loading', ['Resistive series circuit, power factor near unity', 'Cable resistance given for the full loop length', 'Standard CCR sizes: 4, 7.5, 10, 15, 20, 25, 30 kW. Manufacturer catalogues also list 1, 2, 5, 50 and 70 kW units and a 20 A class; confirm the sizes and the current edition of FAA AC 150/5345-10 before use'], 'Confirm against the CCR manufacturer\'s output curves, the isolating transformer open-circuit behaviour and the project specification. Lamp failures shift the load, so check at the highest brightness step.', ['insulation-pi-dar', 'ir-temp-correction'],
    (i) => { const lamp = i.n * i.Pl / i.et, cab = i.I * i.I * i.R * i.L, Pt = lamp + cab, Vo = Pt / i.I, need = Pt / i.ld, k = STD_CCR.find((x) => x * 1000 >= need - 1e-6), pct = k ? Pt / (k * 1000) * 100 : NaN;
      return { out: { Pt, Vo, Pc: cab, ccr: k ? k * 1000 : NaN, pct }, steps: [`Lamp load = ${fmt(i.n, 0)} × ${fmt(i.Pl, 0)} W / ${fmt(i.et, 2)} = ${fmt(lamp, 1)} W`, `Cable loss = ${fmt(i.I, 2)}² × ${fmt(i.R * 1000, 3)} Ω/km × ${fmt(i.L / 1000, 2)} km = ${fmt(cab, 1)} W`, `Total = ${fmt(Pt / 1000, 3)} kW, Vout = ${fmt(Pt, 0)} / ${fmt(i.I, 2)} = ${fmt(Vo, 0)} V`, `Needed rating = ${fmt(Pt / 1000, 3)} / ${fmt(i.ld, 2)} = ${fmt(need / 1000, 2)} kW, so ${k ? k + ' kW' : 'no standard size'}`], warnings: k ? [] : ['Above 30 kW: split the circuit.'], sentence: `${fmt(i.n, 0)} fittings on ${q(i.L, 'm', 0)} of cable load the circuit to ${fmt(Pt / 1000, 2)} kW at ${fmt(Vo, 0)} V, so choose a ${k ? k + ' kW' : 'larger'} CCR (${fmt(pct, 0)}% loaded).` }; },
    isInt('n', 'Number of fittings'), [{ name: '60 × 45 W, 4 km, 6.6 A', in: { n: 60, Pl: [45, 'W'], et: 0.85, I: [6.6, 'A'], L: [4000, 'm'], R: [3.08, 'Ω/km'], ld: 0.8 }, out: { Pt: 3.71313, Vo: 562.595, Pc: 536.6592, ccr: 7.5, pct: 49.50840 }, tol: 1e-5 }, { name: 'light circuit fits the 4 kW size', in: { n: 20, Pl: [30, 'W'], et: 0.9, I: [6.6, 'A'], L: [1000, 'm'], R: [3.08, 'Ω/km'], ld: 0.8 }, out: { ccr: 4 }, tol: 0 }]),
  C('agl-max-fittings', 'AGL Maximum Fittings on a CCR', '35 Airport and AGL', 'Largest number of fittings a constant current regulator of a given kW rating can carry on a series circuit, after cable loss.', ['agl', 'ccr', 'maximum fittings', 'how many lights', 'series circuit', 'airfield', 'runway', 'taxiway', 'spare capacity', 'airport lighting'],
    [I('Pr', 'CCR rating', 'power', 'kW', 10, { min: 0, exMin: true, hint: 'Rated output of the regulator, from its nameplate' }), I('Pl', 'Lamp power per fitting', 'power', 'W', 45, { min: 0, exMin: true, hint: 'At the circuit current, from the fitting data sheet' }), N('et', 'Isolating transformer efficiency', 0.85, { min: 0.5, max: 1, exMin: true, hint: 'From the transformer data sheet at the circuit current' }),
      I('I', 'Circuit current', 'current', 'A', 6.6, { min: 0, exMin: true }), I('L', 'Series cable loop length', 'length', 'm', 4000, { min: 0, exMin: true }), I('R', 'Series cable resistance', 'resPerLen', 'Ω/km', 3.08, { min: 0, exMin: true }), N('ld', 'Maximum CCR loading', 0.8, { min: 0.3, max: 1, hint: 'Fraction of rated kW you are willing to use' })],
    [{ key: 'nmax', label: 'Maximum fittings', dim: 'number', unit: '', prec: 0 }, { key: 'Pt', label: 'Circuit load at that number', dim: 'power', unit: 'kW', prec: 3 }, { key: 'Pc', label: 'Cable loss', dim: 'power', unit: 'W', prec: 0 }, { key: 'pct', label: 'CCR loading at that number (%)', dim: 'number', unit: '', prec: 1 }, { key: 'Vo', label: 'CCR output voltage', dim: 'voltage', unit: 'V', prec: 0 }],
    'Usable = loading × CCR rating     Pcable = I² × R × L     nmax = ⌊(Usable − Pcable) / (Plamp / ηT)⌋', ['Resistive series circuit, power factor near unity', 'Cable resistance given for the full loop length', 'Every fitting has the same lamp power and the same transformer efficiency'], 'This is the reverse of the CCR sizing calculator. Confirm against the CCR manufacturer\'s output curves and the isolating transformer open-circuit behaviour, and keep spare capacity for future fittings. Check at the highest brightness step.', ['agl-ccr-loading', 'cable-power-loss'],
    (i) => { const use = i.ld * i.Pr, cab = i.I * i.I * i.R * i.L, per = i.Pl / i.et, room = use - cab, n = room < 0 ? 0 : Math.floor(room / per + 1e-9), Pt = n * per + cab, pct = Pt / i.Pr * 100, Vo = Pt / i.I, w = [];
      if (room < per) w.push('The cable loss alone leaves no room for one fitting. Shorten the loop, use a larger conductor or a larger CCR.');
      return { out: { nmax: n, Pt, Pc: cab, pct, Vo }, warnings: w, steps: [`Usable = ${fmt(i.ld, 2)} × ${fmt(i.Pr / 1000, 2)} kW = ${fmt(use, 0)} W`, `Cable loss = ${fmt(i.I, 2)}² × ${fmt(i.R * 1000, 3)} Ω/km × ${fmt(i.L / 1000, 2)} km = ${fmt(cab, 1)} W`, `Load per fitting = ${fmt(i.Pl, 0)} W / ${fmt(i.et, 2)} = ${fmt(per, 2)} W`, `Maximum fittings = ⌊(${fmt(use, 0)} − ${fmt(cab, 1)}) / ${fmt(per, 2)}⌋ = ${n}`], sentence: `A ${fmt(i.Pr / 1000, 1)} kW CCR loaded to ${fmt(i.ld * 100, 0)}% carries up to ${n} fittings of ${fmt(i.Pl, 0)} W on ${q(i.L, 'm', 0)} of cable (${fmt(pct, 0)}% loaded).` }; },
    [{ name: '10 kW CCR, 45 W, 4 km, 6.6 A', in: { Pr: [10, 'kW'], Pl: [45, 'W'], et: 0.85, I: [6.6, 'A'], L: [4000, 'm'], R: [3.08, 'Ω/km'], ld: 0.8 }, out: { nmax: 140, Pc: 536.6592, Pt: 7.948424 }, tol: 1e-5 }, { name: 'exact fit keeps the last fitting', in: { Pr: [1, 'kW'], Pl: [99.9, 'W'], et: 1, I: [1, 'A'], L: [1000, 'm'], R: [1, 'Ω/km'], ld: 1 }, out: { nmax: 10, Pc: 1 }, tol: 1e-9 }, { name: 'cable loss alone exceeds the usable rating', in: { Pr: [4, 'kW'], Pl: [45, 'W'], et: 0.85, I: [6.6, 'A'], L: [60000, 'm'], R: [3.08, 'Ω/km'], ld: 0.8 }, out: { nmax: 0 }, tol: 0 }]),
  C('agl-isolating-transformer', 'AGL Isolating Transformer Current and Loading', '35 Airport and AGL', 'Secondary lamp current, lamp voltage, primary voltage drop and loading of a series isolating transformer at a given circuit current.', ['agl', 'isolating transformer', 'series transformer', 'secondary current', 'lamp current', '6.6/6.6', '6.6/20', 'airfield', 'airport lighting', 'loading'],
    [I('Ip', 'Circuit (primary) current', 'current', 'A', 6.6, { min: 0, exMin: true, hint: 'The CCR output current at the brightness step you are checking' }), I('Ipr', 'Rated primary current', 'current', 'A', 6.6, { min: 0, exMin: true, hint: 'From the transformer nameplate, for example 6.6 A' }), I('Isr', 'Rated secondary current', 'current', 'A', 6.6, { min: 0, exMin: true, hint: 'From the transformer nameplate, for example 6.6 A or 20 A' }),
      I('Pl', 'Lamp power at that secondary current', 'power', 'W', 45, { min: 0, exMin: true, hint: 'From the fitting data sheet at the secondary current shown in the result' }), I('Pt', 'Transformer rating', 'power', 'W', 100, { min: 0, exMin: true, hint: 'Rated output of the isolating transformer, from its nameplate' }), N('et', 'Transformer efficiency', 0.85, { min: 0.5, max: 1, exMin: true, hint: 'From the transformer data sheet at this current' })],
    [{ key: 'Is', label: 'Secondary lamp current', dim: 'current', unit: 'A', prec: 3 }, { key: 'Vs', label: 'Lamp voltage', dim: 'voltage', unit: 'V', prec: 2 }, { key: 'Pin', label: 'Input power from the series circuit', dim: 'power', unit: 'W', prec: 1 }, { key: 'Vp', label: 'Primary voltage drop', dim: 'voltage', unit: 'V', prec: 2 }, { key: 'pct', label: 'Transformer loading (%)', dim: 'number', unit: '', prec: 1 }],
    'Is = Ip × Isr / Ipr     Vs = Plamp / Is     Pin = Plamp / ηT     Vp = Pin / Ip     Loading = Plamp / Prated', ['Ideal current ratio: the secondary current follows the primary current in the ratio of the rated currents', 'Lamp power is the figure at the secondary current, taken as a fixed power', 'Resistive load, power factor near unity'], 'The lamp is not a fixed resistance, so look up its power at the secondary current shown. An open secondary (failed lamp) is not modelled and needs the manufacturer data on open-circuit voltage and core saturation.', ['agl-ccr-loading', 'agl-max-fittings'],
    (i) => { const Is = i.Ip * i.Isr / i.Ipr, Vs = i.Pl / Is, Pin = i.Pl / i.et, Vp = Pin / i.Ip, pct = i.Pl / i.Pt * 100, w = [];
      if (pct > 100) w.push('The lamp power is above the transformer rating. Use a larger transformer.');
      if (i.Ip > i.Ipr * (1 + 1e-9)) w.push('The circuit current is above the rated primary current of the transformer.');
      return { out: { Is, Vs, Pin, Vp, pct }, warnings: w, steps: [`Secondary current = ${fmt(i.Ip, 3)} × ${fmt(i.Isr, 2)} / ${fmt(i.Ipr, 2)} = ${fmt(Is, 3)} A`, `Lamp voltage = ${fmt(i.Pl, 1)} W / ${fmt(Is, 3)} A = ${fmt(Vs, 2)} V`, `Input power = ${fmt(i.Pl, 1)} / ${fmt(i.et, 2)} = ${fmt(Pin, 1)} W, primary drop = ${fmt(Pin, 1)} / ${fmt(i.Ip, 3)} = ${fmt(Vp, 2)} V`, `Loading = ${fmt(i.Pl, 1)} / ${fmt(i.Pt, 0)} = ${fmt(pct, 1)} %`], sentence: `At ${fmt(i.Ip, 2)} A in the series circuit the lamp carries ${fmt(Is, 2)} A at ${fmt(Vs, 1)} V, the transformer drops ${fmt(Vp, 1)} V in the loop and is ${fmt(pct, 0)}% loaded.` }; },
    [{ name: '6.6/6.6 A, 45 W lamp, 100 W unit', in: { Ip: [6.6, 'A'], Ipr: [6.6, 'A'], Isr: [6.6, 'A'], Pl: [45, 'W'], Pt: [100, 'W'], et: 0.85 }, out: { Is: 6.6, Vs: 6.818182, Pin: 52.941176, Vp: 8.021390, pct: 45 }, tol: 1e-5 }, { name: '6.6/20 A unit at a lower step', in: { Ip: [3.4, 'A'], Ipr: [6.6, 'A'], Isr: [20, 'A'], Pl: [30, 'W'], Pt: [200, 'W'], et: 0.8 }, out: { Is: 10.30303, pct: 15 }, tol: 1e-5 }]),
  C('agl-ccr-input-energy', 'AGL CCR Input Power and Annual Energy', '35 Airport and AGL', 'Input kW, kVA and kvar of a constant current regulator from its output load, with annual energy and running cost.', ['agl', 'ccr', 'input power', 'energy', 'kwh', 'running cost', 'regulator efficiency', 'power factor', 'airfield', 'airport lighting'],
    [I('Po', 'CCR output load', 'power', 'kW', 3.713, { min: 0, exMin: true, hint: 'Circuit load from the CCR sizing calculator, at the brightness step you are costing' }), N('ec', 'CCR efficiency', 0.9, { min: 0.5, max: 1, exMin: true, hint: 'From the CCR data sheet at this load and brightness step' }), I('pf', 'CCR input power factor', 'number', '', 0.9, { min: 0, max: 1, exMin: true, hint: 'From the CCR data sheet at this load and brightness step' }), N('h', 'Hours of operation per year', 4380, { min: 0, max: 8760, exMin: true, hint: 'At this brightness step' }), N('tar', 'Energy tariff per kWh', 8, { min: 0, hint: 'In your own currency' })],
    [{ key: 'Pin', label: 'CCR input power', dim: 'power', unit: 'kW', prec: 3 }, { key: 'S', label: 'CCR input apparent power', dim: 'apparent', unit: 'kVA', prec: 3 }, { key: 'Q', label: 'CCR input reactive power', dim: 'reactive', unit: 'kVAR', prec: 3 }, { key: 'E', label: 'Annual energy', dim: 'energy', unit: 'kWh', prec: 0 }, { key: 'cost', label: 'Annual running cost', dim: 'number', unit: '', prec: 0 }],
    'Pin = Pout / ηCCR     S = Pin / pf     Q = S × sin(acos pf)     E = Pin × hours     Cost = E × tariff', ['Efficiency and power factor are constant at the load entered', 'Input power factor is the figure at this load, not at full load', 'Hours are for the brightness step entered, so cost each step separately and add them'], 'Regulator efficiency and input power factor both fall at light load and low brightness steps, so use the data sheet figure for the step you are costing. This is energy for the regulator input only.', ['agl-ccr-loading', 'agl-max-fittings'],
    (i) => { const Pin = i.Po / i.ec, S = Pin / i.pf, Q = S * Math.sqrt(1 - i.pf * i.pf), E = Pin * i.h, cost = E / 1000 * i.tar;
      return { out: { Pin, S, Q, E, cost }, steps: [`Input power = ${fmt(i.Po / 1000, 3)} kW / ${fmt(i.ec, 3)} = ${fmt(Pin / 1000, 3)} kW`, `Apparent power = ${fmt(Pin / 1000, 3)} / ${fmt(i.pf, 2)} = ${fmt(S / 1000, 3)} kVA, reactive = ${fmt(Q / 1000, 3)} kVAR`, `Annual energy = ${fmt(Pin / 1000, 3)} kW × ${fmt(i.h, 0)} h = ${fmt(E / 1000, 0)} kWh`, `Cost = ${fmt(E / 1000, 0)} kWh × ${fmt(i.tar, 2)} = ${fmt(cost, 0)}`], sentence: `A ${fmt(i.Po / 1000, 2)} kW load draws ${fmt(Pin / 1000, 2)} kW (${fmt(S / 1000, 2)} kVA) at the CCR input and uses ${fmt(E / 1000, 0)} kWh a year, costing ${fmt(cost, 0)}.` }; },
    [{ name: '3.713 kW at 90%, pf 0.9, 4380 h, tariff 8', in: { Po: [3.713, 'kW'], ec: 0.9, pf: 0.9, h: 4380, tar: 8 }, out: { Pin: 4.125556, S: 4.583951, Q: 1.998098, E: 18069.933, cost: 144559.47 }, tol: 1e-5 }, { name: 'unity power factor has no reactive power', in: { Po: [2, 'kW'], ec: 1, pf: 1, h: 1000, tar: 1 }, out: { Pin: 2, S: 2, Q: 0, E: 2000, cost: 2000 }, tol: 1e-9 }]),
  C('agl-brightness-steps', 'AGL Brightness Step Current and Circuit Load', '35 Airport and AGL', 'Circuit current, lamp load, cable loss, CCR output voltage and load at one brightness step of a 6.6 A series lighting circuit.', ['agl', 'brightness step', 'b1', 'b5', 'ccr', 'series circuit', '2.8 a', '3.4 a', '4.1 a', '5.2 a', '6.6 a', 'airfield', 'airport lighting', 'intensity'],
    [ENUM('ct', 'Circuit type', [1, 2], 1, { 1: '5-step (2.8, 3.4, 4.1, 5.2, 6.6 A)', 2: '3-step (4.8, 5.5, 6.6 A)' }), ENUM('b', 'Brightness step', [1, 2, 3, 4, 5], 3, { 1: 'Step 1 (lowest)', 2: 'Step 2', 3: 'Step 3', 4: 'Step 4', 5: 'Step 5 (highest)' }), N('n', 'Fittings on the circuit', 60, { min: 1, max: 500 }), I('Pl', 'Lamp power per fitting at 6.6 A', 'power', 'W', 45, { min: 0, exMin: true, hint: 'At full current, from the fitting data sheet' }), N('et', 'Isolating transformer efficiency', 0.85, { min: 0.5, max: 1, exMin: true, hint: 'Taken as constant at every step' }),
      I('L', 'Series cable loop length', 'length', 'm', 4000, { min: 0, exMin: true }), I('R', 'Series cable resistance', 'resPerLen', 'Ω/km', 3.08, { min: 0, exMin: true }), N('k', 'Lamp power exponent', 2, { min: 1, max: 6, hint: 'Lamp power at a step = full-current power × (I / 6.6)^k. 2 treats the lamp as a fixed resistance. A tungsten filament cools at a low step and its resistance falls, so its real power is lower and the exponent is nearer 2.5 to 2.7 (power rises about as the 1.6 power of voltage while current rises as the 0.6 power). Using 2 therefore over-states the load at the low steps, which is the safe side for CCR loading. Use the lamp data sheet where you have it.' })],
    [{ key: 'I', label: 'Circuit current at this step', dim: 'current', unit: 'A', prec: 2 }, { key: 'pI', label: 'Current as % of 6.6 A', dim: 'number', unit: '', prec: 1 }, { key: 'Pt', label: 'Total circuit load at this step', dim: 'power', unit: 'kW', prec: 3 }, { key: 'Vo', label: 'CCR output voltage at this step', dim: 'voltage', unit: 'V', prec: 0 }, { key: 'Pc', label: 'Cable loss at this step', dim: 'power', unit: 'W', prec: 0 }, { key: 'pL', label: 'Load as % of the full-current load', dim: 'number', unit: '', prec: 1 }],
    'I = step current     Plamp = n × P6.6 × (I / 6.6)^k / ηT     Pcable = I² × R × L     Pt = Plamp + Pcable     Vout = Pt / I', ['Step currents are the usual 6.6 A circuit values: 2.8, 3.4, 4.1, 5.2, 6.6 A (5-step) and 4.8, 5.5, 6.6 A (3-step)', 'Lamp power scales as a power of the current, with the exponent you enter', 'Transformer efficiency is constant at every step', 'Resistive series circuit, power factor near unity'], 'The highest step normally sets the CCR size, so use the CCR sizing calculator at 6.6 A for that. Use this one to see the output voltage and load at the lower steps and to check them against the CCR curves. Confirm the step currents against your project specification.', ['agl-ccr-loading', 'agl-ccr-input-energy'],
    (i) => { const T = i.ct === 1 ? [2.8, 3.4, 4.1, 5.2, 6.6] : [4.8, 5.5, 6.6], I = T[i.b - 1], r = I / 6.6, lamp = i.n * i.Pl * Math.pow(r, i.k) / i.et, cab = I * I * i.R * i.L, Pt = lamp + cab, Vo = Pt / I, full = i.n * i.Pl / i.et + 6.6 * 6.6 * i.R * i.L, pL = Pt / full * 100;
      return { out: { I, pI: r * 100, Pt, Vo, Pc: cab, pL }, steps: [`Step current = ${fmt(I, 1)} A (${fmt(r * 100, 1)} % of 6.6 A)`, `Lamp load = ${fmt(i.n, 0)} × ${fmt(i.Pl, 0)} W × ${fmt(r, 4)}^${fmt(i.k, 2)} / ${fmt(i.et, 2)} = ${fmt(lamp, 1)} W`, `Cable loss = ${fmt(I, 1)}² × ${fmt(i.R * 1000, 3)} Ω/km × ${fmt(i.L / 1000, 2)} km = ${fmt(cab, 1)} W`, `Total = ${fmt(Pt / 1000, 3)} kW, Vout = ${fmt(Pt, 0)} / ${fmt(I, 1)} = ${fmt(Vo, 0)} V`], warnings: [], sentence: `At ${fmt(I, 1)} A the circuit loads the CCR to ${fmt(Pt / 1000, 2)} kW at ${fmt(Vo, 0)} V, which is ${fmt(pL, 0)}% of the full-current load.` }; },
    (v) => isInt('n', 'Number of fittings')(v).concat(v.ct === 2 && v.b > 3 ? [{ key: 'b', msg: 'A 3-step circuit has steps 1 to 3' }] : []),
    [{ name: 'step 5 equals the 6.6 A sizing result', in: { ct: 1, b: 5, n: 60, Pl: [45, 'W'], et: 0.85, L: [4000, 'm'], R: [3.08, 'Ω/km'], k: 2 }, out: { I: 6.6, pI: 100, Pt: 3.71313, Pc: 536.6592, pL: 100 }, tol: 1e-5 }, { name: '5-step, step 1 at 2.8 A', in: { ct: 1, b: 1, n: 60, Pl: [45, 'W'], et: 0.85, L: [4000, 'm'], R: [3.08, 'Ω/km'], k: 2 }, out: { I: 2.8, pI: 42.424242424, Pt: 0.668295168, Vo: 238.676845892, Pc: 96.5888, pL: 17.998163453 }, tol: 1e-6 }, { name: '3-step, step 2 at 5.5 A, exponent 2.5', in: { ct: 2, b: 2, n: 20, Pl: [30, 'W'], et: 0.9, L: [1000, 'm'], R: [3.08, 'Ω/km'], k: 2.5 }, out: { I: 5.5, Pt: 0.51579543, Pc: 93.17, pL: 64.407487923 }, tol: 1e-6 }]),
  C('agl-lamp-life-curve', 'AGL Lamp Life at a Different Circuit Current', '35 Airport and AGL', 'Fits a power law to two lamp life readings from a data sheet and gives the life at another circuit current, with the replacements a circuit needs each year.', ['agl', 'lamp life', 'lamp current', 'life curve', 'brightness step', 'lamp replacement', 'maintenance', 'series circuit', 'airfield', 'airport lighting', 'mtbf'],
    [I('I1', 'First data point: current', 'current', 'A', 6.6, { min: 0, exMin: true, hint: 'From the lamp life curve or data sheet' }), I('T1', 'First data point: life', 'time', 'h', 1000, { min: 0, exMin: true }), I('I2', 'Second data point: current', 'current', 'A', 6.1, { min: 0, exMin: true, hint: 'A different current from the first' }), I('T2', 'Second data point: life', 'time', 'h', 2000, { min: 0, exMin: true, hint: 'Example values only. Use the readings for your lamp.' }),
      I('I3', 'Current to evaluate', 'current', 'A', 5.2, { min: 0, exMin: true }), N('n', 'Fittings on the circuit', 60, { min: 1, max: 500 }), N('H', 'Hours of operation per year', 4380, { min: 0, max: 8760, exMin: true, hint: 'At the current to evaluate' })],
    [{ key: 'm', label: 'Life exponent m', dim: 'number', unit: '', prec: 2 }, { key: 'T3', label: 'Life at the evaluated current', dim: 'time', unit: 'h', prec: 0 }, { key: 'rt', label: 'Life relative to the first point', dim: 'number', unit: '', prec: 2 }, { key: 'rep', label: 'Lamp replacements per year', dim: 'number', unit: '', prec: 1 }],
    'Life = T1 × (I / I1)^(−m)     m = ln(T2 / T1) / ln(I1 / I2)     Replacements per year = n × H / T3', ['Life follows a power law in the circuit current between the points', 'Rated life is an average, so some lamps fail earlier', 'Operating hours are all at the evaluated current'], 'Two points fix the curve exactly, so the answer is only as good as the readings. Staying between the two points is safer than going beyond them. Use the manufacturer curve where one exists.', ['agl-brightness-steps', 'agl-max-fittings'],
    (i) => { const m = Math.log(i.T2 / i.T1) / Math.log(i.I1 / i.I2), T3 = i.T1 * Math.pow(i.I3 / i.I1, -m), rt = T3 / i.T1, rep = i.n * i.H / (T3 / 3600), lo = Math.min(i.I1, i.I2), hi = Math.max(i.I1, i.I2), w = [];
      if (i.I3 < lo * (1 - 1e-9) || i.I3 > hi * (1 + 1e-9)) w.push('The current is outside the two data points, so the life is extrapolated. Treat it as indicative.');
      if (m < 0) w.push('Life rises with current in these readings. Check the order of the readings.');
      return { out: { m, T3, rt, rep }, warnings: w, steps: [`m = ln(${fmt(i.T2 / 3600, 0)} / ${fmt(i.T1 / 3600, 0)}) / ln(${fmt(i.I1, 2)} / ${fmt(i.I2, 2)}) = ${fmt(m, 3)}`, `Life = ${fmt(i.T1 / 3600, 0)} h × (${fmt(i.I3, 2)} / ${fmt(i.I1, 2)})^(−${fmt(m, 3)}) = ${fmt(T3 / 3600, 0)} h`, `Replacements = ${fmt(i.n, 0)} × ${fmt(i.H, 0)} / ${fmt(T3 / 3600, 0)} = ${fmt(rep, 1)} a year`], sentence: `At ${fmt(i.I3, 2)} A the life is about ${fmt(T3 / 3600, 0)} h (${fmt(rt, 1)} times the first point), so ${fmt(i.n, 0)} fittings need about ${fmt(rep, 0)} lamps a year.` }; },
    (v) => isInt('n', 'Number of fittings')(v).concat(Math.abs(v.I1 - v.I2) < 1e-12 ? [{ key: 'I2', msg: 'The two currents must be different' }] : []),
    [{ name: 'doubling the life per 0.5 A step', in: { I1: [6.6, 'A'], T1: [1000, 'h'], I2: [6.1, 'A'], T2: [2000, 'h'], I3: [5.2, 'A'], n: 60, H: 4380 }, out: { m: 8.798419102, T3: 8146.92131202, rt: 8.146921312, rep: 32.257584176 }, tol: 1e-6 }, { name: 'evaluating at the first point returns its life', in: { I1: [6.6, 'A'], T1: [1000, 'h'], I2: [5.2, 'A'], T2: [5000, 'h'], I3: [6.6, 'A'], n: 10, H: 1000 }, out: { T3: 1000, rt: 1, rep: 10 }, tol: 1e-9 }]),

  C('agl-cable-loop-loss', 'AGL Series Cable Loop Resistance and Loss', '35 Airport and AGL', 'Loop resistance, voltage drop and heat loss of a series lighting circuit cable from its length, size, material and temperature.', ['agl', 'series cable', 'loop resistance', 'cable loss', 'voltage drop', 'primary cable', 'series circuit', 'airfield', 'copper', 'airport lighting', 'i2r'],
    [I('I', 'Circuit current', 'current', 'A', 6.6, { min: 0, exMin: true }), I('L', 'Series cable loop length', 'length', 'm', 4000, { min: 0, exMin: true, hint: 'Out and back, the full length of the series loop' }), I('A', 'Cable cross-section', 'area', 'mm²', 6, { min: 0, exMin: true }),
      ENUM('mat', 'Conductor material', [1, 2], 1, { 1: 'Copper', 2: 'Aluminium' }), I('T', 'Conductor temperature (°C)', 'number', '', 20, { min: -50, max: 150, hint: 'Resistance rises about 0.39% per °C for copper' })],
    [{ key: 'Rl', label: 'Loop resistance', dim: 'resistance', unit: 'Ω', prec: 3 }, { key: 'Rk', label: 'Per unit length', dim: 'resPerLen', unit: 'Ω/km', prec: 3 }, { key: 'Vd', label: 'Voltage drop in the cable', dim: 'voltage', unit: 'V', prec: 1 }, { key: 'Pc', label: 'Cable loss', dim: 'power', unit: 'W', prec: 0 }],
    'R = ρ20 × [1 + α (T − 20)] × L / A     Vd = I × R     Ploss = I² × R', ['Copper 1.7241e-8 Ω·m and aluminium 2.8264e-8 Ω·m at 20 °C, with 0.00393 and 0.00403 per °C', 'DC resistance of the full loop, no skin or proximity effect', 'The same current flows through the whole loop'], 'Use the result as the cable loss in the CCR sizing and brightness step calculators. Confirm the cable resistance against the manufacturer data for the cable you install.', ['agl-ccr-loading', 'agl-max-fittings', 'cable-resistance'],
    (i) => { const m = MAT[i.mat], k = 1 + m.alpha * (i.T - 20), R = m.rho * k * i.L / i.A, Vd = i.I * R, Pc = i.I * i.I * R;
      return { out: { Rl: R, Rk: R / i.L, Vd, Pc }, steps: [`ρ(T) = ${(m.rho * 1e8).toPrecision(5)}e-8 × (1 + ${m.alpha} × (${fmt(i.T, 1)} − 20)) = ${(m.rho * k * 1e8).toPrecision(5)}e-8 Ω·m`, `R = ρ(T) × ${fmt(i.L, 0)} m / ${fmt(i.A * 1e6, 2)} mm² = ${fmt(R, 3)} Ω`, `Vd = ${fmt(i.I, 2)} A × ${fmt(R, 3)} Ω = ${fmt(Vd, 1)} V`, `Loss = ${fmt(i.I, 2)}² × ${fmt(R, 3)} = ${fmt(Pc, 0)} W`], sentence: `${q(i.L, 'm', 0)} of ${fmt(i.A * 1e6, 1)} mm² ${m.name.toLowerCase()} at ${fmt(i.I, 2)} A has ${fmt(R, 2)} Ω loop resistance, drops ${fmt(Vd, 0)} V and loses ${fmt(Pc, 0)} W.` }; },
    [{ name: '4 km of 6 mm² copper at 20 °C, 6.6 A', in: { I: [6.6, 'A'], L: [4000, 'm'], A: [6, 'mm²'], mat: 1, T: 20 }, out: { Rl: 11.494, Vd: 75.86040, Pc: 500.67864 }, tol: 1e-6 }, { name: 'aluminium at 20 °C', in: { I: [5, 'A'], L: [1000, 'm'], A: [10, 'mm²'], mat: 2, T: 20 }, out: { Rl: 2.8264 }, tol: 1e-6 }, { name: 'zero area rejected', in: { I: [6.6, 'A'], L: [4000, 'm'], A: [0, 'mm²'], mat: 1, T: 20 }, error: 'A' }]),

  C('agl-cable-size-loss', 'AGL Series Cable Size for a Loss Limit', '35 Airport and AGL', 'Smallest conductor size for a series lighting loop so that the cable loss stays within a chosen share of the lamp load.', ['agl', 'series cable', 'cable size', 'cable loss', 'loss limit', 'conductor size', 'primary cable', 'series circuit', 'airfield', 'airport lighting'],
    [I('I', 'Circuit current', 'current', 'A', 6.6, { min: 0, exMin: true }), I('L', 'Series cable loop length', 'length', 'm', 4000, { min: 0, exMin: true }), I('P', 'Lamp load on the circuit', 'power', 'kW', 3.176, { min: 0, exMin: true, hint: 'Lamps divided by transformer efficiency, without the cable loss' }), N('lim', 'Allowed cable loss (% of lamp load)', 15, { min: 0.1, max: 50, hint: 'Your own design limit. It is not taken from a standard' }),
      ENUM('mat', 'Conductor material', [1, 2], 1, { 1: 'Copper', 2: 'Aluminium' }), I('T', 'Conductor temperature (°C)', 'number', '', 20, { min: -50, max: 150 })],
    [{ key: 'Amin', label: 'Minimum cross-section', dim: 'area', unit: 'mm²', prec: 2 }, { key: 'Astd', label: 'Standard size', dim: 'area', unit: 'mm²', prec: 1 }, { key: 'Pc', label: 'Cable loss at that size', dim: 'power', unit: 'W', prec: 0 }, { key: 'pct', label: 'Loss as % of lamp load', dim: 'number', unit: '', prec: 1 }],
    'A ≥ ρ(T) × L × I² / (limit × Plamp)     Ploss = I² × ρ(T) × L / A', ['Resistivity as in the loop resistance calculator', 'Standard sizes from the IEC 60228 preferred series, 1.5 to 630 mm²', 'The loss limit is a project choice, not a value from a standard'], 'Check the chosen size against the cable manufacturer data, the maximum voltage the CCR can supply and the insulation rating before ordering.', ['agl-cable-loop-loss', 'agl-ccr-loading', 'cable-resistance'],
    (i) => { const m = MAT[i.mat], k = 1 + m.alpha * (i.T - 20), rho = m.rho * k, allow = i.lim / 100 * i.P, Am = rho * i.L * i.I * i.I / allow, Amm = Am * 1e6, Astd = STD_AREAS.find((a) => a >= Amm - 1e-9), w = [];
      if (!Astd) w.push('Above 630 mm². Shorten the loop, accept a higher loss or split the circuit.');
      const Pc = Astd ? i.I * i.I * rho * i.L / (Astd * 1e-6) : NaN;
      return { out: { Amin: Am, Astd: Astd ? Astd * 1e-6 : NaN, Pc, pct: Astd ? Pc / i.P * 100 : NaN }, warnings: w, steps: [`Allowed loss = ${fmt(i.lim, 1)}% × ${fmt(i.P / 1000, 3)} kW = ${fmt(allow, 1)} W`, `A = ρ(T) × L × I² / allowed = ${fmt(Amm, 3)} mm²`, Astd ? `Next standard size = ${Astd} mm², loss ${fmt(Pc, 1)} W` : 'No standard single-core size is large enough'], sentence: Astd ? `To hold the loss of ${q(i.L, 'm', 0)} of ${m.name.toLowerCase()} at ${fmt(i.I, 2)} A to ${fmt(i.lim, 0)}% of the lamp load needs at least ${fmt(Amm, 2)} mm², so use ${Astd} mm².` : `The loss limit needs ${fmt(Amm, 0)} mm², beyond a single 630 mm² conductor.` }; },
    [{ name: '4 km, 6.6 A, 3.176 kW, 15%, copper', in: { I: [6.6, 'A'], L: [4000, 'm'], P: [3.176, 'kW'], lim: 15, mat: 1, T: 20 }, out: { Amin: 6.305776322, Astd: 10 }, tol: 1e-6 }, { name: 'loss limit of zero rejected', in: { I: [6.6, 'A'], L: [4000, 'm'], P: [3.176, 'kW'], lim: 0, mat: 1, T: 20 }, error: 'lim' }]),

  C('agl-lamp-failure-load', 'AGL Circuit Load with Failed Lamps', '35 Airport and AGL', 'How the load and the CCR output voltage of a series lighting circuit change when some lamps have failed open and their isolating transformers are left with open secondaries.', ['agl', 'lamp failure', 'failed lamps', 'open circuit', 'isolating transformer', 'series circuit', 'ccr load', 'airfield', 'airport lighting', 'maintenance'],
    [N('n', 'Fittings on the circuit', 60, { min: 1, max: 500 }), N('f', 'Failed lamps (open circuit)', 3, { min: 0, max: 500 }), I('Pl', 'Lamp power per fitting', 'power', 'W', 45, { min: 0, exMin: true, hint: 'At the circuit current, from the fitting data sheet' }), N('et', 'Isolating transformer efficiency', 0.85, { min: 0.5, max: 1, exMin: true }),
      I('Pm', 'Transformer input power with the secondary open', 'power', 'W', 10, { min: 0, hint: 'Example value only. Use the transformer data sheet or a measurement' }), I('I', 'Circuit current', 'current', 'A', 6.6, { min: 0, exMin: true }), I('L', 'Series cable loop length', 'length', 'm', 4000, { min: 0, exMin: true }), I('R', 'Series cable resistance', 'resPerLen', 'Ω/km', 3.08, { min: 0, exMin: true })],
    [{ key: 'P0', label: 'Circuit load, all lamps working', dim: 'power', unit: 'kW', prec: 3 }, { key: 'Pf', label: 'Circuit load with failed lamps', dim: 'power', unit: 'kW', prec: 3 }, { key: 'dP', label: 'Change in load', dim: 'power', unit: 'W', prec: 0 }, { key: 'pd', label: 'Change as % of the working load', dim: 'number', unit: '', prec: 1 }, { key: 'Vf', label: 'CCR output voltage with failed lamps', dim: 'voltage', unit: 'V', prec: 0 }],
    'P0 = n × Plamp / ηT + I² R L     Pf = (n − f) × Plamp / ηT + f × Popen + I² R L     Vout = Pf / I', ['Each failed lamp leaves its transformer drawing a fixed open-secondary power', 'Resistive series circuit, power factor near unity', 'Current held at the circuit value by the CCR'], 'A real open-secondary transformer is not a fixed power. Its voltage and loss depend on the core design, so treat the result as a first estimate and confirm it with the transformer manufacturer. Several failures in a row can still push the CCR toward its overvoltage or open-circuit protection.', ['agl-ccr-loading', 'agl-isolating-transformer', 'agl-lamp-life-curve'],
    (i) => { const cab = i.I * i.I * i.R * i.L, per = i.Pl / i.et, P0 = i.n * per + cab, Pf = (i.n - i.f) * per + i.f * i.Pm + cab, dP = Pf - P0, w = [];
      if (i.Pm >= per) w.push('The open-secondary power is not below the working load of a fitting. Check the data sheet value.');
      return { out: { P0, Pf, dP, pd: dP / P0 * 100, Vf: Pf / i.I }, warnings: w, steps: [`Fitting load = ${fmt(i.Pl, 1)} W / ${fmt(i.et, 2)} = ${fmt(per, 2)} W, cable loss = ${fmt(cab, 1)} W`, `All working: ${fmt(i.n, 0)} × ${fmt(per, 2)} + ${fmt(cab, 1)} = ${fmt(P0, 1)} W`, `${fmt(i.f, 0)} failed: ${fmt(i.n - i.f, 0)} × ${fmt(per, 2)} + ${fmt(i.f, 0)} × ${fmt(i.Pm, 1)} + ${fmt(cab, 1)} = ${fmt(Pf, 1)} W`, `Vout = ${fmt(Pf, 0)} / ${fmt(i.I, 2)} = ${fmt(Pf / i.I, 0)} V`], sentence: `With ${fmt(i.f, 0)} of ${fmt(i.n, 0)} lamps failed the circuit load changes by ${fmt(dP, 0)} W (${fmt(dP / P0 * 100, 1)}%) to ${fmt(Pf / 1000, 3)} kW at ${fmt(Pf / i.I, 0)} V.` }; },
    (v) => isInt('n', 'Number of fittings')(v).concat(isInt('f', 'Number of failed lamps')(v), v.f > v.n + 1e-9 ? [{ key: 'f', msg: 'Failed lamps cannot exceed the number of fittings' }] : []),
    [{ name: '3 of 60 failed, 10 W open', in: { n: 60, f: 3, Pl: [45, 'W'], et: 0.85, Pm: [10, 'W'], I: [6.6, 'A'], L: [4000, 'm'], R: [3.08, 'Ω/km'] }, out: { P0: 3.713129788, Pf: 3.584306259, dP: -128.8235294 }, tol: 1e-6 }, { name: 'no failures leaves the load unchanged', in: { n: 60, f: 0, Pl: [45, 'W'], et: 0.85, Pm: [10, 'W'], I: [6.6, 'A'], L: [4000, 'm'], R: [3.08, 'Ω/km'] }, out: { dP: 0, pd: 0 }, tol: 1e-9 }, { name: 'more failures than fittings rejected', in: { n: 5, f: 6, Pl: [45, 'W'], et: 0.85, Pm: [10, 'W'], I: [6.6, 'A'], L: [4000, 'm'], R: [3.08, 'Ω/km'] }, error: 'f' }])
);

/* ---------- v1.1 additions: Phase 3 start. New divisions 24, 26, 30, 34 plus gaps in 06, 12, 15, 23, 29, 31. Reference values were computed independently of this file. ---------- */
const E24 = [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1];
/* Largest E24 preferred value that does not exceed r, so the current is never below the design value. */
function e24Down(r) {
  const dec = Math.pow(10, Math.floor(Math.log10(r) + 1e-12)), m = r / dec;
  let best = E24[0];
  E24.forEach((e) => { if (e <= m + 1e-9) best = e; });
  return best * dec;
}
const TOL = 1e-6;

CALCS.push(
  C('fault-loop-impedance', 'Earth Fault Loop Impedance', '30 Electrical Safety', 'Check that an earth fault draws enough current to operate the protective device.', ['earth', 'fault', 'loop', 'impedance', 'zs', 'ze', 'disconnection', 'shock', 'r1+r2'],
    [I('U0', 'Nominal voltage to earth', 'voltage', 'V', 230, { min: 0, exMin: true }), I('Ze', 'External loop impedance Ze', 'resistance', 'Ω', 0.35, { min: 0, exMin: true }), I('Zi', 'Circuit R1 + R2', 'resistance', 'Ω', 0.55, { min: 0, exMin: true }),
      I('Ia', 'Protective device operating current', 'current', 'A', 160, { min: 0, exMin: true, hint: 'Current that trips the device within the required time, from its time-current curve' })],
    [{ key: 'Zs', label: 'Loop impedance Zs', dim: 'resistance', unit: 'Ω', prec: 3 }, { key: 'If', label: 'Earth fault current', dim: 'current', unit: 'A', prec: 1 }, { key: 'Zmax', label: 'Maximum Zs for this device', dim: 'resistance', unit: 'Ω', prec: 3 }, { key: 'ratio', label: 'Margin (If / Ia)', dim: 'number', unit: '', prec: 2 }],
    'Zs = Ze + (R1 + R2)     If = U0 / Zs     Zs(max) = U0 / Ia', ['Impedances add arithmetically (conservative)', 'Conductor resistances are at operating temperature', 'Fault is bolted, with no arc impedance'], 'Required disconnection times and the permitted Zs values come from your wiring rules. This only compares the fault current with the device operating current you enter.', ['fault-current', 'breaker-size'],
    (i) => { const Zs = i.Ze + i.Zi, If = i.U0 / Zs, Zmax = i.U0 / i.Ia, ratio = If / i.Ia, w = [];
      if (ratio < 1) w.push('Fault current is below the device operating current. The device may not disconnect in time. Reduce the loop impedance or use a more sensitive device.'); else if (ratio < 1.2) w.push('Margin is thin. Real impedance at operating temperature is usually higher than a cold measurement.');
      return { out: { Zs, If, Zmax, ratio }, steps: [`Zs = Ze + (R1 + R2) = ${fmt(i.Ze, 3)} + ${fmt(i.Zi, 3)} = ${fmt(Zs, 3)} Ω`, `If = U0 / Zs = ${fmt(i.U0, 0)} / ${fmt(Zs, 3)} = ${fmt(If, 1)} A`, `Zs(max) = U0 / Ia = ${fmt(i.U0, 0)} / ${fmt(i.Ia, 1)} = ${fmt(Zmax, 3)} Ω`], warnings: w,
        sentence: `A loop impedance of ${fmt(Zs, 3)} Ω gives ${fmt(If, 0)} A earth fault current, ${fmt(ratio, 2)} times the ${fmt(i.Ia, 0)} A needed to operate the device.` }; },
    [{ name: '0.35 + 0.55 Ω on 230 V, 160 A device', in: { U0: [230, 'V'], Ze: [0.35, 'Ω'], Zi: [0.55, 'Ω'], Ia: [160, 'A'] }, out: { Zs: 0.9, If: 255.5555556, Zmax: 1.4375, ratio: 1.597222222 }, tol: TOL }, { name: 'high impedance fails the check', in: { U0: [230, 'V'], Ze: [0.8, 'Ω'], Zi: [1, 'Ω'], Ia: [160, 'A'] }, out: { Zs: 1.8, If: 127.7777778, ratio: 0.7986111111 }, tol: TOL }]),

  C('pue', 'Data Centre PUE', '34 Data Center Electrical', 'Power usage effectiveness from total facility power and IT load.', ['pue', 'data centre', 'data center', 'dcie', 'efficiency', 'it load', 'server', 'cooling overhead'],
    [I('Pt', 'Total facility power', 'power', 'kW', 1500, { min: 0, exMin: true }), I('Pit', 'IT equipment power', 'power', 'kW', 1000, { min: 0, exMin: true })],
    [{ key: 'pue', label: 'PUE', dim: 'number', unit: '', prec: 2 }, { key: 'dcie', label: 'DCiE (IT share of total, %)', dim: 'number', unit: '', prec: 1 }, { key: 'oh', label: 'Overhead (cooling, losses, lighting)', dim: 'power', unit: 'kW', prec: 1 }],
    'PUE = total facility power / IT power     DCiE = 1 / PUE × 100', ['Both powers are averaged over the same period', 'IT power is measured at the PDU or rack outlet'], 'A single spot reading can mislead. Use energy over a full year so seasonal cooling load is included.', ['rack-cooling', 'ups-runtime'],
    (i) => { const pue = i.Pt / i.Pit, dcie = 100 / pue, oh = i.Pt - i.Pit;
      return { out: { pue, dcie, oh }, steps: [`PUE = ${fmt(i.Pt / 1000, 1)} / ${fmt(i.Pit / 1000, 1)} = ${fmt(pue, 3)}`, `DCiE = 100 / ${fmt(pue, 3)} = ${fmt(dcie, 2)} %`, `Overhead = ${fmt(i.Pt / 1000, 1)} − ${fmt(i.Pit / 1000, 1)} = ${fmt(oh / 1000, 1)} kW`], warnings: [], sentence: `${q(i.Pt, 'kW', 0)} total for ${q(i.Pit, 'kW', 0)} of IT load is a PUE of ${fmt(pue, 2)}.` }; },
    (i) => (i.Pit > i.Pt ? [{ key: 'Pit', msg: 'IT power cannot exceed total facility power' }] : []),
    [{ name: '1500 kW total, 1000 kW IT', in: { Pt: [1500, 'kW'], Pit: [1000, 'kW'] }, out: { pue: 1.5, dcie: 66.66666667, oh: 500 }, tol: TOL }, { name: '1200 kW total, 1000 kW IT', in: { Pt: [1200, 'kW'], Pit: [1000, 'kW'] }, out: { pue: 1.2, dcie: 83.33333333, oh: 200 }, tol: TOL }, { name: 'IT above total rejected', in: { Pt: [1000, 'kW'], Pit: [2000, 'kW'] }, error: 'Pit' }]),

  C('rack-cooling', 'Rack Heat Load and Airflow', '34 Data Center Electrical', 'Convert IT power to heat load, cooling tons and the airflow needed for a given air temperature rise.', ['rack', 'cooling', 'airflow', 'cfm', 'btu', 'tons', 'heat load', 'server', 'data centre'],
    [I('P', 'IT power in the rack', 'power', 'kW', 10, { min: 0, exMin: true }), N('dT', 'Air temperature rise across the rack (K)', 12, { min: 0, exMin: true })],
    [{ key: 'btu', label: 'Heat load (BTU/h)', dim: 'number', unit: '', prec: 0 }, { key: 'tons', label: 'Cooling (US refrigeration tons)', dim: 'number', unit: '', prec: 2 }, { key: 'air', label: 'Airflow required', dim: 'flow', unit: 'm³/h', prec: 0 }],
    'Heat = P (all power becomes heat)     BTU/h = 3.41214 × W     ton = 12 000 BTU/h     V̇ = P / (ρ × cp × ΔT)', ['Air density 1.2 kg/m³, specific heat 1005 J/(kg·K)', 'All electrical power ends up as heat in the room', 'No allowance for bypass or recirculation'], 'Real designs add margin for hot-spot mixing. Switch the airflow unit to CFM for US cooling data.', ['pue', 'ups-runtime'],
    (i) => { const btu = i.P * 3600 / BTU_J, tons = btu / 12000, v = i.P / (1.2 * 1005 * i.dT), air = v * 3600;
      return { out: { btu, tons, air: v }, steps: [`Heat = ${fmt(i.P / 1000, 2)} kW × 3412.14 = ${fmt(btu, 0)} BTU/h`, `Tons = ${fmt(btu, 0)} / 12 000 = ${fmt(tons, 2)}`, `V̇ = ${fmt(i.P, 0)} / (1.2 × 1005 × ${fmt(i.dT, 1)}) = ${fmt(v, 4)} m³/s = ${fmt(air, 0)} m³/h`], warnings: [], sentence: `${q(i.P, 'kW', 1)} of IT load is ${fmt(btu, 0)} BTU/h and needs about ${fmt(air, 0)} m³/h of air at a ${fmt(i.dT, 0)} K rise.` }; },
    [{ name: '10 kW at 12 K rise', in: { P: [10, 'kW'], dT: 12 }, out: { btu: 34121.41633, tons: 2.843451361, air: 2487.562189 }, tol: TOL }, { name: '20 kW at 10 K rise', in: { P: [20, 'kW'], dT: 10 }, out: { btu: 68242.83266, tons: 5.686902722, air: 5970.149254 }, tol: TOL }]),

  C('wind-power', 'Wind Turbine Power', '26 Renewable Energy', 'Power in the wind across a rotor and the electrical output after Cp and drive-train efficiency.', ['wind', 'turbine', 'rotor', 'betz', 'cp', 'swept area', 'renewable'],
    [I('D', 'Rotor diameter', 'length', 'm', 90, { min: 0, exMin: true }), I('v', 'Wind speed', 'velocity', 'm/s', 10, { min: 0, exMin: true }), N('cp', 'Power coefficient Cp', 0.4, { min: 0, exMin: true, max: 16 / 27, hint: 'The Betz limit is 0.593' }), N('rho', 'Air density (kg/m³)', 1.225, { min: 0.5, max: 1.5 }), N('eff', 'Drive-train and generator efficiency', 0.95, { min: 0, exMin: true, max: 1 })],
    [{ key: 'A', label: 'Swept area', dim: 'area', unit: 'm²', prec: 0 }, { key: 'Pw', label: 'Power in the wind', dim: 'power', unit: 'kW', prec: 1 }, { key: 'Pe', label: 'Electrical output', dim: 'power', unit: 'kW', prec: 1 }],
    'A = π D² / 4     Pwind = ½ ρ A v³     Pout = Pwind × Cp × η', ['Steady wind at hub height', 'Cp is for this wind speed, taken from the power curve', 'Standard sea-level air density 1.225 kg/m³'], 'Power rises with the cube of wind speed, so a small error in the wind speed gives a large error in output. Use the manufacturer power curve for real yield.', ['pv-energy', 'energy-cost'],
    (i) => { const A = Math.PI * i.D * i.D / 4, Pw = 0.5 * i.rho * A * Math.pow(i.v, 3), Pe = Pw * i.cp * i.eff;
      return { out: { A, Pw, Pe }, steps: [`A = π × ${fmt(i.D, 1)}² / 4 = ${fmt(A, 1)} m²`, `Pwind = 0.5 × ${fmt(i.rho, 3)} × ${fmt(A, 1)} × ${fmt(i.v, 2)}³ = ${fmt(Pw / 1000, 1)} kW`, `Pout = ${fmt(Pw / 1000, 1)} × ${fmt(i.cp, 2)} × ${fmt(i.eff, 2)} = ${fmt(Pe / 1000, 1)} kW`], warnings: [], sentence: `A ${fmt(i.D, 0)} m rotor in a ${fmt(i.v, 1)} m/s wind carries ${fmt(Pw / 1000, 0)} kW and delivers about ${fmt(Pe / 1000, 0)} kW.` }; },
    [{ name: '90 m rotor, 10 m/s', in: { D: [90, 'm'], v: [10, 'm/s'], cp: 0.4, rho: 1.225, eff: 0.95 }, out: { A: 6361.725124, Pw: 3896.556638, Pe: 1480.691522 }, tol: TOL }, { name: '50 m rotor, 8 m/s in km/h', in: { D: [50, 'm'], v: [28.8, 'km/h'], cp: 0.35, rho: 1.225, eff: 0.9 }, out: { A: 1963.495408, Pw: 615.7521601, Pe: 193.9619304 }, tol: TOL }, { name: 'Cp above Betz limit rejected', in: { D: [90, 'm'], v: [10, 'm/s'], cp: 0.7, rho: 1.225, eff: 0.95 }, error: 'cp' }]),

  C('zener-regulator', 'Zener Shunt Regulator', '24 Semiconductor Components', 'Series resistor and power ratings for a zener diode regulator.', ['zener', 'regulator', 'shunt', 'reference', 'series resistor', 'diode'],
    [I('Vin', 'Input voltage (minimum)', 'voltage', 'V', 12, { min: 0, exMin: true }), I('Vz', 'Zener voltage', 'voltage', 'V', 5.1, { min: 0, exMin: true }), I('IL', 'Maximum load current', 'current', 'mA', 20, { min: 0 }), I('Iz', 'Minimum zener current', 'current', 'mA', 5, { min: 0, exMin: true, hint: 'Enough to keep the zener in regulation, from its data sheet' })],
    [{ key: 'Rs', label: 'Series resistor', dim: 'resistance', unit: 'Ω', prec: 1 }, { key: 'Rstd', label: 'Next lower E24 value', dim: 'resistance', unit: 'Ω', prec: 0 }, { key: 'Pr', label: 'Resistor power', dim: 'power', unit: 'W', prec: 3 }, { key: 'Pz', label: 'Zener power with the load removed', dim: 'power', unit: 'W', prec: 3 }],
    'Rs = (Vin − Vz) / (IL + Iz)     PR = (Vin − Vz)² / Rs     Pz(no load) = Vz × (Vin − Vz) / Rs', ['Design at the lowest input voltage and highest load', 'Zener voltage is constant over the current range'], 'Check the zener power again at the highest input voltage with the load disconnected. A shunt regulator wastes the full current all the time.', ['led-resistor', 'voltage-divider'],
    (i) => { const dv = i.Vin - i.Vz, Rs = dv / (i.IL + i.Iz), Rstd = e24Down(Rs), Pr = dv * dv / Rs, Pz = i.Vz * dv / Rs;
      return { out: { Rs, Rstd, Pr, Pz }, steps: [`Rs = (${fmt(i.Vin, 2)} − ${fmt(i.Vz, 2)}) / (${fmt(i.IL * 1000, 1)} + ${fmt(i.Iz * 1000, 1)}) mA = ${fmt(Rs, 1)} Ω`, `Next lower E24 value = ${fmt(Rstd, 0)} Ω`, `PR = ${fmt(dv, 2)}² / ${fmt(Rs, 1)} = ${fmt(Pr, 3)} W`, `Pz (no load) = ${fmt(i.Vz, 2)} × ${fmt(dv, 2)} / ${fmt(Rs, 1)} = ${fmt(Pz, 3)} W`], warnings: [], sentence: `Use about ${fmt(Rs, 0)} Ω (${fmt(Rstd, 0)} Ω standard). The resistor dissipates ${fmt(Pr, 2)} W and the zener up to ${fmt(Pz, 2)} W with no load.` }; },
    (i) => (i.Vin <= i.Vz ? [{ key: 'Vin', msg: 'Input voltage must be greater than the zener voltage' }] : []),
    [{ name: '12 V to 5.1 V, 20 mA load', in: { Vin: [12, 'V'], Vz: [5.1, 'V'], IL: [20, 'mA'], Iz: [5, 'mA'] }, out: { Rs: 276, Rstd: 270, Pr: 0.1725, Pz: 0.1275 }, tol: TOL }, { name: '24 V to 12 V, 50 mA load', in: { Vin: [24, 'V'], Vz: [12, 'V'], IL: [50, 'mA'], Iz: [5, 'mA'] }, out: { Rs: 218.1818182, Rstd: 200, Pr: 0.66, Pz: 0.66 }, tol: TOL }, { name: 'input below zener rejected', in: { Vin: [4, 'V'], Vz: [5.1, 'V'], IL: [20, 'mA'], Iz: [5, 'mA'] }, error: 'Vin' }]),

  C('bjt-base-resistor', 'Transistor Base Resistor', '24 Semiconductor Components', 'Base resistor to drive a bipolar transistor hard into saturation as a switch.', ['transistor', 'bjt', 'base resistor', 'switch', 'saturation', 'hfe', 'beta', 'npn'],
    [I('Vin', 'Drive voltage', 'voltage', 'V', 5, { min: 0, exMin: true }), I('Vbe', 'Base-emitter voltage', 'voltage', 'V', 0.7, { min: 0.3, max: 1.2 }), I('Ic', 'Collector current', 'current', 'mA', 100, { min: 0, exMin: true }), N('hfe', 'Minimum current gain hFE', 100, { min: 1, hint: 'Use the minimum at this collector current, not the typical value' }), N('k', 'Overdrive factor', 2, { min: 1, hint: '2 to 10 is typical for switching' })],
    [{ key: 'Ib', label: 'Base current', dim: 'current', unit: 'mA', prec: 3 }, { key: 'Rb', label: 'Base resistor', dim: 'resistance', unit: 'Ω', prec: 0 }, { key: 'Rstd', label: 'Next lower E24 value', dim: 'resistance', unit: 'Ω', prec: 0 }],
    'Ib = k × Ic / hFE     Rb = (Vin − Vbe) / Ib', ['Transistor used as a switch, not an amplifier', 'Vbe about 0.7 V for silicon'], 'Check that the driver pin can supply the base current, and that the transistor dissipation at Vce(sat) is within its rating.', ['led-resistor', 'rc-time-constant'],
    (i) => { const Ib = i.k * i.Ic / i.hfe, Rb = (i.Vin - i.Vbe) / Ib, Rstd = e24Down(Rb);
      return { out: { Ib, Rb, Rstd }, steps: [`Ib = ${fmt(i.k, 1)} × ${fmt(i.Ic * 1000, 1)} mA / ${fmt(i.hfe, 0)} = ${fmt(Ib * 1000, 3)} mA`, `Rb = (${fmt(i.Vin, 2)} − ${fmt(i.Vbe, 2)}) / ${fmt(Ib * 1000, 3)} mA = ${fmt(Rb, 0)} Ω`, `Next lower E24 value = ${fmt(Rstd, 0)} Ω`], warnings: [], sentence: `To switch ${fmt(i.Ic * 1000, 0)} mA, drive the base with ${fmt(Ib * 1000, 2)} mA through ${fmt(Rb, 0)} Ω (${fmt(Rstd, 0)} Ω standard).` }; },
    (i) => (i.Vin <= i.Vbe ? [{ key: 'Vin', msg: 'Drive voltage must be greater than the base-emitter voltage' }] : []),
    [{ name: '5 V drive, 100 mA, hFE 100, k 2', in: { Vin: [5, 'V'], Vbe: [0.7, 'V'], Ic: [100, 'mA'], hfe: 100, k: 2 }, out: { Ib: 2, Rb: 2150, Rstd: 2000 }, tol: TOL }, { name: '3.3 V drive, 10 mA, hFE 200, k 1', in: { Vin: [3.3, 'V'], Vbe: [0.7, 'V'], Ic: [10, 'mA'], hfe: 200, k: 1 }, out: { Ib: 0.05, Rb: 52000, Rstd: 51000 }, tol: TOL }, { name: 'drive below Vbe rejected', in: { Vin: [0.5, 'V'], Vbe: [0.7, 'V'], Ic: [100, 'mA'], hfe: 100, k: 2 }, error: 'Vin' }]),

  C('timer-555', '555 Timer Astable', '24 Semiconductor Components', 'Frequency, period and duty cycle of a 555 timer free-running oscillator.', ['555', 'timer', 'astable', 'oscillator', 'frequency', 'duty cycle', 'blinker'],
    [I('R1', 'R1 (VCC to discharge)', 'resistance', 'kΩ', 10, { min: 0, exMin: true }), I('R2', 'R2 (discharge to threshold)', 'resistance', 'kΩ', 47, { min: 0, exMin: true }), I('C', 'Timing capacitor C', 'capacitance', 'µF', 10, { min: 0, exMin: true })],
    [{ key: 'f', label: 'Frequency', dim: 'frequency', unit: 'Hz', prec: 3 }, { key: 'T', label: 'Period', dim: 'time', unit: 's', prec: 4 }, { key: 'Th', label: 'Output high time', dim: 'time', unit: 's', prec: 4 }, { key: 'Tl', label: 'Output low time', dim: 'time', unit: 's', prec: 4 }, { key: 'duty', label: 'Duty cycle (%)', dim: 'number', unit: '', prec: 1 }],
    'f = 1 / (ln2 × (R1 + 2 R2) × C)     Th = ln2 × (R1 + R2) × C     Tl = ln2 × R2 × C', ['Ideal components, supply well within the 555 range', 'The common 1.44 / ((R1 + 2R2) C) is this formula with ln2 rounded'], 'Duty cycle is always above 50% in this circuit. A diode across R2 or a different topology is needed for a lower duty cycle. Capacitor tolerance sets the frequency accuracy.', ['rc-time-constant', 'frequency-period'],
    (i) => { const Th = Math.LN2 * (i.R1 + i.R2) * i.C, Tl = Math.LN2 * i.R2 * i.C, T = Th + Tl, f = 1 / T, duty = Th / T * 100;
      return { out: { f, T, Th, Tl, duty }, steps: [`Th = ln2 × (${fmt(i.R1 / 1000, 2)} k + ${fmt(i.R2 / 1000, 2)} k) × ${fmt(i.C * 1e6, 3)} µF = ${fmt(Th, 4)} s`, `Tl = ln2 × ${fmt(i.R2 / 1000, 2)} k × ${fmt(i.C * 1e6, 3)} µF = ${fmt(Tl, 4)} s`, `f = 1 / (${fmt(Th, 4)} + ${fmt(Tl, 4)}) = ${fmt(f, 3)} Hz, duty = ${fmt(duty, 1)} %`], warnings: [], sentence: `These values run the 555 at ${fmt(f, 2)} Hz with a ${fmt(duty, 1)}% duty cycle.` }; },
    [{ name: '10 k, 47 k, 10 µF', in: { R1: [10, 'kΩ'], R2: [47, 'kΩ'], C: [10, 'µF'] }, out: { f: 1.38720677, T: 0.7208730678, Th: 0.3950938929, Tl: 0.3257791749, duty: 54.80769231 }, tol: TOL }, { name: '1 k, 10 k, 100 nF', in: { R1: [1, 'kΩ'], R2: [10, 'kΩ'], C: [100, 'nF'] }, out: { f: 686.9976385, duty: 52.38095238 }, tol: TOL }]),

  C('heatsink-thermal', 'Heatsink Thermal Resistance', '24 Semiconductor Components', 'Highest heatsink thermal resistance that keeps a device junction within its limit.', ['heatsink', 'heat sink', 'thermal', 'junction', 'temperature', 'theta', 'power transistor', 'mosfet'],
    [I('P', 'Power dissipated', 'power', 'W', 15, { min: 0, exMin: true }), N('Ta', 'Ambient temperature (°C)', 40, { min: -50, max: 150 }), N('Tj', 'Maximum junction temperature (°C)', 125, { min: 0, max: 300 }), N('tjc', 'Junction to case θjc (°C/W)', 1.5, { min: 0, hint: 'From the device data sheet' }), N('tcs', 'Case to sink θcs (°C/W)', 0.5, { min: 0, hint: 'Depends on the pad or paste; 0.1 to 1 is common' })],
    [{ key: 'tja', label: 'Total allowed θja', dim: 'number', unit: '', prec: 2 }, { key: 'tsa', label: 'Heatsink to ambient θsa, at most (°C/W)', dim: 'number', unit: '', prec: 2 }],
    'θja(max) = (Tj − Ta) / P     θsa(max) = θja(max) − θjc − θcs', ['Steady-state dissipation', 'Single heat path from junction through case and sink to ambient'], 'Leave margin below the junction limit. Heatsink data sheets give θsa for natural convection or a stated airflow, so match that condition.', ['power-vir'],
    (i) => { const tja = (i.Tj - i.Ta) / i.P, tsa = tja - i.tjc - i.tcs;
      return { out: { tja, tsa }, steps: [`θja(max) = (${fmt(i.Tj, 0)} − ${fmt(i.Ta, 0)}) / ${fmt(i.P, 1)} = ${fmt(tja, 3)} °C/W`, `θsa(max) = ${fmt(tja, 3)} − ${fmt(i.tjc, 2)} − ${fmt(i.tcs, 2)} = ${fmt(tsa, 3)} °C/W`], warnings: tsa <= 0 ? ['No heatsink can meet this. Reduce the power, lower the ambient temperature, or choose a device with lower θjc.'] : [], sentence: tsa > 0 ? `Choose a heatsink rated ${fmt(tsa, 2)} °C/W or lower to hold the junction at ${fmt(i.Tj, 0)} °C with ${fmt(i.P, 0)} W.` : `${fmt(i.P, 0)} W is too much for this device at ${fmt(i.Ta, 0)} °C ambient, even with a perfect heatsink.` }; },
    (i) => (i.Tj <= i.Ta ? [{ key: 'Tj', msg: 'Junction limit must be above the ambient temperature' }] : []),
    [{ name: '15 W, 40 °C ambient, 125 °C limit', in: { P: [15, 'W'], Ta: 40, Tj: 125, tjc: 1.5, tcs: 0.5 }, out: { tja: 5.666666667, tsa: 3.666666667 }, tol: TOL }, { name: '50 W, 45 °C ambient, 150 °C limit', in: { P: [50, 'W'], Ta: 45, Tj: 150, tjc: 0.8, tcs: 0.2 }, out: { tja: 2.1, tsa: 1.1 }, tol: TOL }, { name: '60 W gives a negative result', in: { P: [60, 'W'], Ta: 40, Tj: 125, tjc: 1.5, tcs: 0.5 }, out: { tsa: -0.5833333333 }, tol: TOL }, { name: 'limit below ambient rejected', in: { P: [15, 'W'], Ta: 90, Tj: 80, tjc: 1.5, tcs: 0.5 }, error: 'Tj' }]),

  C('rc-filter-cutoff', 'RC Filter Cutoff', '23 Electronics', 'Cutoff frequency of a first-order RC filter, with the gain and phase at a chosen frequency.', ['rc', 'filter', 'low pass', 'high pass', 'cutoff', 'corner frequency', 'attenuation', 'phase'],
    [I('R', 'Resistance', 'resistance', 'kΩ', 1, { min: 0, exMin: true }), I('C', 'Capacitance', 'capacitance', 'nF', 100, { min: 0, exMin: true }), I('f', 'Frequency of interest', 'frequency', 'Hz', 1000, { min: 0, exMin: true }), ENUM('type', 'Filter type', [1, 2], 1, { 1: 'Low-pass', 2: 'High-pass' })],
    [{ key: 'fc', label: 'Cutoff frequency (−3 dB)', dim: 'frequency', unit: 'Hz', prec: 1 }, { key: 'g', label: 'Gain at the frequency of interest (dB)', dim: 'number', unit: '', prec: 2 }, { key: 'ph', label: 'Phase shift (°)', dim: 'number', unit: '', prec: 1 }],
    'fc = 1 / (2π R C)     Low-pass: |H| = 1 / √(1 + (f/fc)²), φ = −atan(f/fc)     High-pass: |H| = (f/fc) / √(1 + (f/fc)²), φ = atan(fc/f)', ['Ideal source and an unloaded output', 'First-order filter, so 20 dB per decade roll-off'], 'A load resistance or source impedance shifts the real cutoff. Keep the load at least ten times R.', ['rc-time-constant', 'reactance'],
    (i) => { const fc = 1 / (2 * Math.PI * i.R * i.C), x = i.f / fc, lp = i.type === 1, g = lp ? -10 * Math.log10(1 + x * x) : 10 * Math.log10(x * x / (1 + x * x)), ph = lp ? -Math.atan(x) * 180 / Math.PI : Math.atan(1 / x) * 180 / Math.PI;
      return { out: { fc, g, ph }, steps: [`fc = 1 / (2π × ${fmt(i.R, 0)} × ${fmt(i.C * 1e9, 2)} nF) = ${fmt(fc, 2)} Hz`, `f / fc = ${fmt(i.f, 1)} / ${fmt(fc, 2)} = ${fmt(x, 4)}`, `Gain = ${fmt(g, 3)} dB, phase = ${fmt(ph, 2)} °`], warnings: [], sentence: `The ${lp ? 'low-pass' : 'high-pass'} filter cuts off at ${fmt(fc, 1)} Hz. At ${fmt(i.f, 0)} Hz the gain is ${fmt(g, 2)} dB.` }; },
    [{ name: 'low-pass 1 k, 100 nF at 1 kHz', in: { R: [1, 'kΩ'], C: [100, 'nF'], f: [1000, 'Hz'], type: 1 }, out: { fc: 1591.549431, g: -1.44507012, ph: -32.14190764 }, tol: TOL }, { name: 'high-pass 1 k, 100 nF at 1 kHz', in: { R: [1, 'kΩ'], C: [100, 'nF'], f: [1000, 'Hz'], type: 2 }, out: { g: -5.481472749, ph: 57.85809236 }, tol: TOL }, { name: 'at cutoff the gain is −3 dB and phase −45°', in: { R: [10, 'kΩ'], C: [1, 'µF'], f: [15.915494309189533, 'Hz'], type: 1 }, out: { g: -3.010299957, ph: -45 }, tol: TOL }]),

  C('star-delta-starting', 'Star-Delta Starting', '12 Motors', 'Starting current and torque with a star-delta starter compared with direct-on-line.', ['star delta', 'wye delta', 'starter', 'starting current', 'starting torque', 'dol', 'motor'],
    [I('In', 'Motor rated current', 'current', 'A', 100, { min: 0, exMin: true }), N('k', 'Locked-rotor current ratio (ILR / In)', 6, { min: 1, hint: 'From the motor data sheet' }), I('Tn', 'Motor rated torque', 'torque', 'N·m', 500, { min: 0, exMin: true }), N('kt', 'Locked-rotor torque ratio (TLR / Tn)', 1.5, { min: 0, exMin: true }), I('Tl', 'Load torque at start', 'torque', 'N·m', 150, { min: 0 })],
    [{ key: 'Id', label: 'DOL starting current', dim: 'current', unit: 'A', prec: 0 }, { key: 'Iy', label: 'Star starting line current', dim: 'current', unit: 'A', prec: 0 }, { key: 'Td', label: 'DOL starting torque', dim: 'torque', unit: 'N·m', prec: 0 }, { key: 'Ty', label: 'Star starting torque', dim: 'torque', unit: 'N·m', prec: 0 }],
    'IDOL = k × In     Istar = IDOL / 3     Tstar = TDOL / 3', ['Motor is delta-connected at its rated line voltage', 'Supply voltage stays constant', 'Switching transient peak is not included'], 'Star-delta cuts both current and torque to one third. It only suits loads that start with low torque, such as unloaded fans and pumps with a closed valve.', ['motor-starting', 'motor-start-dip'],
    (i) => { const Id = i.k * i.In, Iy = Id / 3, Td = i.kt * i.Tn, Ty = Td / 3, w = Ty < i.Tl ? ['Star starting torque is below the load torque. The motor will not accelerate in star.'] : [];
      return { out: { Id, Iy, Td, Ty }, steps: [`IDOL = ${fmt(i.k, 1)} × ${fmt(i.In, 1)} = ${fmt(Id, 0)} A`, `Istar = ${fmt(Id, 0)} / 3 = ${fmt(Iy, 0)} A`, `TDOL = ${fmt(i.kt, 2)} × ${fmt(i.Tn, 0)} = ${fmt(Td, 0)} N·m, Tstar = ${fmt(Ty, 0)} N·m`], warnings: w, sentence: `Star-delta starting cuts the starting current from ${fmt(Id, 0)} A to ${fmt(Iy, 0)} A and the starting torque from ${fmt(Td, 0)} to ${fmt(Ty, 0)} N·m.` }; },
    [{ name: '100 A motor, ratio 6, 500 N·m', in: { In: [100, 'A'], k: 6, Tn: [500, 'N·m'], kt: 1.5, Tl: [150, 'N·m'] }, out: { Id: 600, Iy: 200, Td: 750, Ty: 250 }, tol: TOL }, { name: 'weak torque case', in: { In: [50, 'A'], k: 7, Tn: [200, 'N·m'], kt: 0.6, Tl: [150, 'N·m'] }, out: { Id: 350, Iy: 116.6666667, Td: 120, Ty: 40 }, tol: TOL }]),

  C('battery-charge-time', 'Battery Charge Time', '15 Batteries and UPS', 'Time to restore a battery from its present state with a given charger current and efficiency.', ['battery', 'charge time', 'charger', 'ah', 'recharge', 'lead acid', 'lithium'],
    [I('Cap', 'Battery capacity', 'charge', 'Ah', 100, { min: 0, exMin: true }), N('fr', 'Fraction of capacity to restore', 0.5, { min: 0, exMin: true, max: 1, hint: '0.5 for a battery discharged by half' }), I('Ic', 'Charger current', 'current', 'A', 20, { min: 0, exMin: true }), N('eta', 'Charge efficiency', 0.85, { min: 0, exMin: true, max: 1, hint: 'Typically 0.8 to 0.9 for lead-acid; higher for lithium' })],
    [{ key: 't', label: 'Charge time', dim: 'time', unit: 'h', prec: 2 }, { key: 'Qc', label: 'Charge delivered by the charger', dim: 'charge', unit: 'Ah', prec: 1 }],
    't = Cap × fraction / (Icharge × η)', ['Constant charger current for the whole time', 'No allowance for the slower absorption stage near full'], 'Real chargers taper the current near full charge, so the last 10 to 20% takes longer than this estimate. Follow the battery maker\'s limits on charge current.', ['battery-bank-size', 'ups-runtime'],
    (i) => { const t = i.Cap * i.fr / (i.Ic * i.eta), Qc = i.Ic * t;
      return { out: { t: t * 3600, Qc }, steps: [`Charge needed = ${fmt(i.Cap, 1)} Ah × ${fmt(i.fr, 2)} = ${fmt(i.Cap * i.fr, 1)} Ah`, `t = ${fmt(i.Cap * i.fr, 1)} / (${fmt(i.Ic, 1)} × ${fmt(i.eta, 2)}) = ${fmt(t, 3)} h`, `Charge delivered = ${fmt(i.Ic, 1)} × ${fmt(t, 3)} = ${fmt(Qc, 1)} Ah`], warnings: i.Ic > i.Cap ? ['Charge current is above 1C. Check the battery maker\'s maximum charge rate.'] : [], sentence: `Restoring ${fmt(i.fr * 100, 0)}% of a ${fmt(i.Cap, 0)} Ah battery at ${fmt(i.Ic, 0)} A takes about ${fmt(t, 1)} hours.` }; },
    [{ name: '100 Ah, half, 20 A, 85%', in: { Cap: [100, 'Ah'], fr: 0.5, Ic: [20, 'A'], eta: 0.85 }, out: { t: 2.941176471, Qc: 58.82352941 }, tol: TOL }, { name: '200 Ah, 80%, 30 A, 90%', in: { Cap: [200, 'Ah'], fr: 0.8, Ic: [30, 'A'], eta: 0.9 }, out: { t: 5.925925926, Qc: 177.7777778 }, tol: TOL }]),

  C('fan-pump-affinity', 'Fan and Pump Affinity Laws', '29 Industrial Electrical', 'Flow, head and power at a new speed, showing the energy saved by slowing a fan or pump.', ['affinity', 'fan', 'pump', 'vfd', 'speed', 'energy saving', 'drive', 'cube law'],
    [I('N1', 'Original speed', 'speed', 'rpm', 1450, { min: 0, exMin: true }), I('N2', 'New speed', 'speed', 'rpm', 1160, { min: 0, exMin: true }), I('P1', 'Power at original speed', 'power', 'kW', 22, { min: 0, exMin: true })],
    [{ key: 'Q', label: 'Flow (% of original)', dim: 'number', unit: '', prec: 1 }, { key: 'H', label: 'Head or pressure (% of original)', dim: 'number', unit: '', prec: 1 }, { key: 'P2', label: 'Power at new speed', dim: 'power', unit: 'kW', prec: 2 }, { key: 'sav', label: 'Power saved (%)', dim: 'number', unit: '', prec: 1 }],
    'Q2/Q1 = N2/N1     H2/H1 = (N2/N1)²     P2/P1 = (N2/N1)³', ['Same fan or pump, same fluid density', 'System resistance is friction-dominated with little static head', 'Efficiency stays the same across the speed range'], 'Static head breaks the cube law, so savings on a pump lifting water are smaller. Below about 50% speed, motor and drive losses matter.', ['motor-power-output', 'pump-motor-power'],
    (i) => { const r = i.N2 / i.N1, P2 = i.P1 * r * r * r;
      return { out: { Q: r * 100, H: r * r * 100, P2, sav: (1 - r * r * r) * 100 }, steps: [`Speed ratio = ${fmt(i.N2, 0)} / ${fmt(i.N1, 0)} = ${fmt(r, 4)}`, `Flow = ${fmt(r * 100, 1)} %, head = ${fmt(r * r * 100, 1)} %`, `P2 = ${fmt(i.P1 / 1000, 2)} kW × ${fmt(r, 4)}³ = ${fmt(P2 / 1000, 2)} kW`], warnings: i.N2 > i.N1 ? ['New speed is above the original. Check the fan or pump, bearing and motor limits.'] : [], sentence: `Running at ${fmt(r * 100, 0)}% speed gives ${fmt(r * 100, 0)}% flow and cuts power from ${fmt(i.P1 / 1000, 1)} kW to ${fmt(P2 / 1000, 1)} kW.` }; },
    [{ name: '1450 to 1160 rpm, 22 kW', in: { N1: [1450, 'rpm'], N2: [1160, 'rpm'], P1: [22, 'kW'] }, out: { Q: 80, H: 64, P2: 11.264, sav: 48.8 }, tol: TOL }, { name: '1500 to 1000 rpm, 75 kW', in: { N1: [1500, 'rpm'], N2: [1000, 'rpm'], P1: [75, 'kW'] }, out: { Q: 66.66666667, H: 44.44444444, P2: 22.22222222, sav: 70.37037037 }, tol: TOL }]),

  C('rtd-pt100', 'RTD Resistance to Temperature', '31 Instrumentation', 'Temperature from the measured resistance of a platinum RTD such as Pt100 or Pt1000.', ['rtd', 'pt100', 'pt1000', 'platinum', 'temperature', 'resistance', 'callendar', 'sensor'],
    [I('R', 'Measured resistance', 'resistance', 'Ω', 138.51, { min: 0, exMin: true }), I('R0', 'Resistance at 0 °C', 'resistance', 'Ω', 100, { min: 0, exMin: true, hint: '100 Ω for Pt100, 1000 Ω for Pt1000' })],
    [{ key: 'T', label: 'Temperature (°C)', dim: 'number', unit: '', prec: 2 }, { key: 'S', label: 'Sensitivity at this point (Ω/°C)', dim: 'number', unit: '', prec: 4 }],
    'R = R0 (1 + A T + B T²)     T = (−A + √(A² − 4B (1 − R/R0))) / 2B     A = 3.9083×10⁻³, B = −5.775×10⁻⁷', ['Standard platinum RTD, 0 to 850 °C range', 'Lead wire resistance already subtracted or a 3 or 4-wire connection'], 'Two-wire connections add lead resistance, which reads as a temperature error of about 2.6 °C per ohm for a Pt100. Below 0 °C a third term is needed and this calculator does not cover it.', ['current-loop-4-20', 'ir-temp-correction'],
    (i) => { const A = 3.9083e-3, B = -5.775e-7, T = (-A + Math.sqrt(A * A - 4 * B * (1 - i.R / i.R0))) / (2 * B) + 0, S = i.R0 * (A + 2 * B * T);
      return { out: { T, S }, steps: [`R / R0 = ${fmt(i.R, 3)} / ${fmt(i.R0, 0)} = ${fmt(i.R / i.R0, 5)}`, `T = (−A + √(A² − 4B(1 − R/R0))) / 2B = ${fmt(T, 3)} °C`, `Sensitivity = R0 (A + 2BT) = ${fmt(S, 4)} Ω/°C`], warnings: i.R > i.R0 * 3.904811 ? ['Resistance corresponds to more than 850 °C, beyond the range of this equation.'] : [], sentence: `${fmt(i.R, 2)} Ω on a ${fmt(i.R0, 0)} Ω RTD is ${fmt(T, 1)} °C.` }; },
    (i) => (i.R < i.R0 ? [{ key: 'R', msg: 'Resistance is below R0, which is a temperature under 0 °C. This calculator covers 0 to 850 °C.' }] : []),
    [{ name: '138.51 Ω on Pt100', in: { R: [138.51, 'Ω'], R0: [100, 'Ω'] }, out: { T: 100.0118646, S: 0.3792786296 }, tol: TOL }, { name: '100 Ω is 0 °C', in: { R: [100, 'Ω'], R0: [100, 'Ω'] }, out: { T: 0, S: 0.39083 }, tol: TOL }, { name: 'Pt1000 at 1385.055 Ω', in: { R: [1.385055, 'kΩ'], R0: [1000, 'Ω'] }, out: { T: 100, S: 3.7928 }, tol: TOL }, { name: '212.05 Ω on Pt100', in: { R: [212.05, 'Ω'], R0: [100, 'Ω'] }, out: { T: 299.9957886, S: 0.356180483 }, tol: TOL }, { name: 'below R0 rejected', in: { R: [90, 'Ω'], R0: [100, 'Ω'] }, error: 'R' }]),

  C('neutral-current-unbalance', 'Neutral Current from Unbalanced Load', '06 Three Phase', 'Neutral current and percentage unbalance for three phase currents of any size.', ['neutral', 'unbalance', 'unbalanced', 'imbalance', 'three phase', 'load balancing', 'phase current'],
    [I('Ia', 'Phase A current', 'current', 'A', 100, { min: 0 }), I('Ib', 'Phase B current', 'current', 'A', 80, { min: 0 }), I('Ic', 'Phase C current', 'current', 'A', 60, { min: 0 })],
    [{ key: 'In', label: 'Neutral current', dim: 'current', unit: 'A', prec: 2 }, { key: 'unb', label: 'Current unbalance (%)', dim: 'number', unit: '', prec: 1 }],
    'In = √(Ia² + Ib² + Ic² − Ia Ib − Ib Ic − Ic Ia)     Unbalance = max deviation from average / average × 100', ['Balanced three-phase supply, loads at the same power factor', 'Sinusoidal currents. Triplen harmonics (3rd, 9th) add in the neutral and are not included'], 'Electronic loads can put more current in the neutral than the phase unbalance alone suggests. Measure the neutral where harmonics are significant.', ['three-phase-power', 'harmonic-thd'],
    (i) => { const In = Math.sqrt(Math.max(0, i.Ia * i.Ia + i.Ib * i.Ib + i.Ic * i.Ic - i.Ia * i.Ib - i.Ib * i.Ic - i.Ic * i.Ia)), av = (i.Ia + i.Ib + i.Ic) / 3, unb = Math.max(Math.abs(i.Ia - av), Math.abs(i.Ib - av), Math.abs(i.Ic - av)) / av * 100;
      return { out: { In, unb }, steps: [`In = √(${fmt(i.Ia, 1)}² + ${fmt(i.Ib, 1)}² + ${fmt(i.Ic, 1)}² − ${fmt(i.Ia, 1)}×${fmt(i.Ib, 1)} − ${fmt(i.Ib, 1)}×${fmt(i.Ic, 1)} − ${fmt(i.Ic, 1)}×${fmt(i.Ia, 1)}) = ${fmt(In, 2)} A`, `Average = ${fmt(av, 2)} A`, `Unbalance = ${fmt(unb, 1)} %`], warnings: unb > 10 ? ['Unbalance above 10%. Move single-phase loads between phases.'] : [], sentence: `Phase currents of ${fmt(i.Ia, 0)}, ${fmt(i.Ib, 0)} and ${fmt(i.Ic, 0)} A leave ${fmt(In, 1)} A in the neutral, an unbalance of ${fmt(unb, 1)}%.` }; },
    (i) => (i.Ia + i.Ib + i.Ic === 0 ? [{ key: 'Ia', msg: 'At least one phase current must be above zero' }] : []),
    [{ name: '100, 80, 60 A', in: { Ia: [100, 'A'], Ib: [80, 'A'], Ic: [60, 'A'] }, out: { In: 34.64101615, unb: 25 }, tol: TOL }, { name: 'balanced 200 A', in: { Ia: [200, 'A'], Ib: [200, 'A'], Ic: [200, 'A'] }, out: { In: 0, unb: 0 }, tol: TOL }, { name: 'single loaded phase', in: { Ia: [150, 'A'], Ib: [0, 'A'], Ic: [0, 'A'] }, out: { In: 150, unb: 200 }, tol: TOL }, { name: 'all zero rejected', in: { Ia: [0, 'A'], Ib: [0, 'A'], Ic: [0, 'A'] }, error: 'Ia' }]),

  C('voltage-unbalance', 'Three-Phase Voltage Unbalance', '06 Three Phase', 'Percentage voltage unbalance from the three line-to-line voltages, as used for motor derating.', ['voltage unbalance', 'unbalance', 'vur', 'nema', 'three phase', 'motor derating', 'supply quality'],
    [I('Vab', 'Line voltage Vab', 'voltage', 'V', 400, { min: 0, exMin: true }), I('Vbc', 'Line voltage Vbc', 'voltage', 'V', 410, { min: 0, exMin: true }), I('Vca', 'Line voltage Vca', 'voltage', 'V', 395, { min: 0, exMin: true })],
    [{ key: 'avg', label: 'Average line voltage', dim: 'voltage', unit: 'V', prec: 1 }, { key: 'vur', label: 'Voltage unbalance (%)', dim: 'number', unit: '', prec: 2 }],
    'Unbalance % = (max deviation from average / average) × 100', ['Line-to-line voltages measured at the motor terminals', 'NEMA definition; the IEC method uses symmetrical components and gives slightly different values'], 'A small voltage unbalance causes a much larger current unbalance in an induction motor. Fix the cause before relying on derating.', ['motor-current', 'neutral-current-unbalance'],
    (i) => { const avg = (i.Vab + i.Vbc + i.Vca) / 3, dev = Math.max(Math.abs(i.Vab - avg), Math.abs(i.Vbc - avg), Math.abs(i.Vca - avg)), vur = dev / avg * 100, w = [];
      if (vur > 5) w.push('Above 5% unbalance. Running a motor on this supply is not recommended (NEMA MG 1).'); else if (vur > 1) w.push('Above 1% unbalance. Motors normally need derating here; use the manufacturer\'s curve.');
      return { out: { avg, vur }, steps: [`Average = (${fmt(i.Vab, 1)} + ${fmt(i.Vbc, 1)} + ${fmt(i.Vca, 1)}) / 3 = ${fmt(avg, 2)} V`, `Largest deviation = ${fmt(dev, 2)} V`, `Unbalance = ${fmt(dev, 2)} / ${fmt(avg, 2)} × 100 = ${fmt(vur, 3)} %`], warnings: w, sentence: `Line voltages of ${fmt(i.Vab, 0)}, ${fmt(i.Vbc, 0)} and ${fmt(i.Vca, 0)} V have a ${fmt(vur, 2)}% unbalance.` }; },
    [{ name: '400, 410, 395 V', in: { Vab: [400, 'V'], Vbc: [410, 'V'], Vca: [395, 'V'] }, out: { avg: 401.6666667, vur: 2.074688797 }, tol: TOL }, { name: 'balanced 415 V', in: { Vab: [415, 'V'], Vbc: [415, 'V'], Vca: [415, 'V'] }, out: { avg: 415, vur: 0 }, tol: TOL }, { name: '400, 400, 420 V', in: { Vab: [400, 'V'], Vbc: [400, 'V'], Vca: [420, 'V'] }, out: { avg: 406.6666667, vur: 3.278688525 }, tol: TOL }])
);

/* One canonical name per division number, so the same division never appears twice. */
const DIVNAMES = { '02': "Ohm's Law", '03': 'AC Circuits', '04': 'DC Circuits', '05': 'Single Phase', '06': 'Three Phase', '07': 'Power and Energy', '08': 'Power Factor', '09': 'Voltage Drop', '10': 'Cable and Wire', '11': 'Conduit and Raceway', '12': 'Motors', '13': 'Transformers', '14': 'Generators', '15': 'Batteries and UPS', '16': 'Protection', '17': 'Short Circuit', '18': 'Earthing', '19': 'Power Systems', '20': 'Harmonics', '21': 'Capacitors and Reactive Power', '23': 'Electronics', '24': 'Semiconductor Components', '25': 'Solar PV', '26': 'Renewable Energy', '27': 'EV Charging', '28': 'Lighting', '29': 'Industrial Electrical', '30': 'Electrical Safety', '31': 'Instrumentation', '32': 'Testing and Measurement', '34': 'Data Center Electrical', '35': 'Airport and AGL', '36': 'Converters and Units', '37': 'Engineering Mathematics' };
CALCS.forEach((c) => { const n = c.division.slice(0, 2); if (DIVNAMES[n]) c.division = n + ' ' + DIVNAMES[n]; });

/* v1.5.9: AC voltage drop with resistance computed from material, size and temperature (shares the size inputs of dc-voltage-drop) */
CALCS.push(
  C('ac-voltage-drop', 'AC Voltage Drop from Conductor Size', '09 Voltage Drop', 'AC voltage drop for single-phase or three-phase circuits from conductor material, size (area, AWG or diameter), temperature, power factor and cable reactance.', ['voltage drop', 'ac', 'three phase', 'single phase', 'power factor', 'reactance', 'conductor', 'copper', 'aluminium', 'awg', 'mm2', 'cable size', 'material'],
    [I('I', 'Load current', 'current', 'A', 50, { min: 0, exMin: true }), I('L', 'One-way length', 'length', 'm', 50, { min: 0, exMin: true })]
      .concat(CALCS.find((c) => c.id === 'dc-voltage-drop').inputs.filter((x) => ['mat', 'sz', 'A', 'awg', 'D', 'rhoC', 'aC', 'T'].indexOf(x.key) >= 0).map((x) => x.key === 'T' ? Object.assign({}, x, { def: 70, hint: 'Operating temperature of the conductor: 70 °C for PVC, 90 °C for XLPE at full load. 20 °C gives the cold value, which understates the drop of a loaded cable.' }) : x))
      .concat([I('X', 'Cable reactance', 'resPerLen', 'Ω/km', 0.08, { min: 0, hint: 'Per conductor, from the cable data sheet. About 0.08 Ω/km is commonly quoted for LV multicore cable (indicative only). Use 0 for a resistive estimate.' }), PF(0.9),
        I('V', 'System voltage (line-to-line for three-phase)', 'voltage', 'V', 400, { min: 0, exMin: true }), ENUM('phase', 'Circuit', [1, 3], 3, { 1: 'Single-phase (out and return)', 3: 'Three-phase balanced' }), ENUM('lead', 'Load power factor', [0, 1], 0, { 0: 'Lagging (inductive load, the usual case)', 1: 'Leading (capacitive load)' }), PARALLEL_N]),
    [{ key: 'Vd', label: 'Voltage drop', dim: 'voltage', unit: 'V', prec: 3 }, { key: 'pct', label: 'Drop as % of system voltage', dim: 'number', unit: '', prec: 2 }, { key: 'R', label: 'Conductor resistance (one way, at temperature)', dim: 'resistance', unit: 'Ω', prec: 5 }, { key: 'Au', label: 'Cross-section used', dim: 'area', unit: 'mm²', prec: 4 }, { key: 'rho', label: 'Resistivity used (at conductor temperature)', dim: 'resistivity', unit: 'Ω·m', prec: 5 }],
    'Vd = k × I × (R cos φ ± X sin φ)  (+ lagging, − leading)     R = ρT × L / A     ρT = ρ20 × (1 + α(T − 20))     k = √3 (three-phase) or 2 (single-phase)',
    ['Balanced load, sinusoidal currents; choose leading only for a capacitive load, where the reactive term reduces the drop', 'Resistance from material, size and temperature; skin and proximity effect are not included (they matter above about 150 mm²)', 'Reactance is the per-conductor value you enter from the data sheet', 'Single-phase uses the out-and-return path', 'Parallel conductors (1 to 9 per phase) are identical, the same length and share the current equally; resistance and reactance are divided by the number in parallel, and mutual effects are ignored'],
    'For a resistive estimate set the power factor to 1 or the reactance to 0. Compare the result with the limit in your standard or specification.', ['voltage-drop', 'dc-voltage-drop', 'breaker-size'],
    (i) => {
      const cust = i.mat === 7, m = cust ? { name: 'Custom material', rho: i.rhoC, alpha: i.aC } : MAT[i.mat], rho = m.rho * (1 + m.alpha * (i.T - 20)), k = i.phase === 3 ? SQ3 : 2;
      let A = i.A, sizeStep = `A = ${fmt(i.A * 1e6, 3)} mm² (given)`;
      if (i.sz === 1) { const d = awgDia(i.awg); A = Math.PI * d * d / 4; sizeStep = `AWG ${fmt(i.awg, 0)}: d = ${fmt(d * 1e3, 4)} mm, A = π d² / 4 = ${fmt(A * 1e6, 4)} mm²`; }
      else if (i.sz === 2) { A = Math.PI * i.D * i.D / 4; sizeStep = `A = π d² / 4 = π × ${fmt(i.D * 1e3, 4)}² / 4 = ${fmt(A * 1e6, 4)} mm²`; }
      const nn = i.n || 1, R = rho * i.L / (A * nn), Xc = i.X * i.L / nn, sin = Math.sqrt(Math.max(0, 1 - i.pf * i.pf)), sg = i.lead === 1 ? -1 : 1, z = R * i.pf + sg * Xc * sin, Vd = k * i.I * z, pct = Vd / i.V * 100, w = [];
      if (pct > 5) w.push('Drop above 5% exceeds most design limits.'); else if (pct > 3) w.push('Drop above 3% exceeds the common limit for final circuits.');
      if (i.T < 50) w.push('Resistance is taken at ' + fmt(i.T, 0) + ' °C. A cable carrying full load runs at 70 to 90 °C, which raises the resistive part of the drop by about ' + fmt(((1 + m.alpha * 70) / (1 + m.alpha * (i.T - 20)) - 1) * 100, 0) + '% at 90 °C. Set the operating temperature for a design check.');
      if (i.lead === 1 && Vd < 0) w.push('Negative result: with a leading power factor the line voltage rises at the load end (Ferranti-type effect). The sign is correct; check the load really is capacitive.');
      if (A * 1e6 > 150 && i.X === 0) w.push('Large conductor with zero reactance: the real drop will be higher. Enter the data-sheet reactance.');
      return { out: { Vd, pct, R, Au: A, rho }, steps: [sizeStep, `ρ(${fmt(i.T, 0)} °C) = ${(m.rho * 1e8).toPrecision(4)}e-8 × (1 + ${m.alpha} × ${fmt(i.T - 20, 0)}) = ${(rho * 1e8).toPrecision(4)}e-8 Ω·m`, nn > 1 ? `R = ρ L / (A × ${nn} conductors) = ${fmt(R, 5)} Ω (one way, per phase)` : `R = ρ L / A = ${fmt(R, 5)} Ω (one way)`, `X = ${fmt(i.X * 1000, 4)} Ω/km × ${fmt(i.L / 1000, 4)} km${nn > 1 ? ' / ' + nn : ''} = ${fmt(Xc, 5)} Ω, sin φ = ${fmt(sin, 4)}`, `Vd = ${i.phase === 3 ? '√3' : '2'} × ${fmt(i.I, 2)} × (${fmt(R, 5)} × ${fmt(i.pf, 3)} ${sg < 0 ? '−' : '+'} ${fmt(Xc, 5)} × ${fmt(sin, 4)}) = ${fmt(Vd, 4)} V`, `Vd % = ${fmt(Vd, 4)} / ${fmt(i.V, 1)} × 100 = ${fmt(pct, 3)} %`], warnings: w,
        sentence: `${fmt(i.I, 1)} A over ${q(i.L, 'm', 0)} of ${fmt(A * 1e6, 2)} mm² ${m.name.toLowerCase()} at power factor ${fmt(i.pf, 2)} drops ${fmt(Vd, 2)} V, which is ${fmt(pct, 2)}% of ${q(i.V, 'V', 0)}. Resistivity used: ${(rho * 1e8).toPrecision(5)}e-8 Ω·m at ${fmt(i.T, 0)} °C.` };
    },
    [{ name: 'hand check: 50 A, 50 m, 10 mm² Cu, 20 °C, X 0.08, PF 0.9, three-phase 400 V', in: { I: [50, 'A'], L: [50, 'm'], A: [10, 'mm²'], mat: 1, T: 20, X: [0.08, 'Ω/km'], pf: 0.9, V: [400, 'V'], phase: 3 }, out: { Vd: 6.870011, R: 0.086205 }, tol: 1e-5 },
      { name: 'PF 1 and X 0 equals the resistive result of dc-voltage-drop', in: { I: [50, 'A'], L: [50, 'm'], A: [10, 'mm²'], mat: 1, T: 20, X: [0, 'Ω/km'], pf: 1, V: [400, 'V'], phase: 3 }, out: { Vd: 7.465572 }, tol: 1e-6 },
      { name: 'single-phase uses two conductors', in: { I: [50, 'A'], L: [50, 'm'], A: [10, 'mm²'], mat: 1, T: 20, X: [0, 'Ω/km'], pf: 1, V: [230, 'V'], phase: 1 }, out: { Vd: 8.6205 }, tol: 1e-5 },
      { name: 'AWG 10 copper', in: { I: [10, 'A'], L: [30, 'm'], mat: 1, sz: 1, awg: 10, T: 20, X: [0, 'Ω/km'], pf: 1, V: [230, 'V'], phase: 1 }, out: { Au: 5.261155, Vd: 1.966222 }, tol: 1e-5 },
      { name: 'leading power factor reduces the drop: 50 A, 50 m, 10 mm² Cu, 20 °C, X 0.08, PF 0.9 leading', in: { I: [50, 'A'], L: [50, 'm'], A: [10, 'mm²'], mat: 1, T: 20, X: [0.08, 'Ω/km'], pf: 0.9, V: [400, 'V'], phase: 3, lead: 1 }, out: { Vd: 6.568018 }, tol: 1e-5 },
      { name: '3 conductors per phase give a third of the drop', in: { I: [50, 'A'], L: [50, 'm'], A: [10, 'mm²'], mat: 1, T: 20, X: [0, 'Ω/km'], pf: 1, V: [400, 'V'], phase: 3, n: 3 }, out: { Vd: 2.488524 }, tol: 1e-5 },
      { name: 'power factor above 1 rejected', in: { pf: 1.2 }, error: 'pf' }, { name: 'AWG above 40 rejected', in: { sz: 1, awg: 41 }, error: 'awg' }]),
);
/* v1.5.10: SWG (Imperial standard wire gauge). Diameters are the legal table values, in inches, 7/0 to 50. */
const SWG_IN = [0.500, 0.464, 0.432, 0.400, 0.372, 0.348, 0.324, 0.300, 0.276, 0.252, 0.232, 0.212, 0.192, 0.176, 0.160, 0.144, 0.128, 0.116, 0.104, 0.092, 0.080, 0.072, 0.064, 0.056, 0.048, 0.040, 0.036, 0.032, 0.028, 0.024, 0.022, 0.020, 0.018, 0.0164, 0.0148, 0.0136, 0.0124, 0.0116, 0.0108, 0.0100, 0.0092, 0.0084, 0.0076, 0.0068, 0.0060, 0.0052, 0.0048, 0.0044, 0.0040, 0.0036, 0.0032, 0.0028, 0.0024, 0.0020, 0.0016, 0.0012, 0.0010];
const swgIn = (n) => SWG_IN[n + 6];
const swgLabel = (n) => (n <= 0 ? (1 - n) + '/0' : String(n));
/* v1.8.1: the SWG table as rows for the Conversion Centre gauge page, with the nearest AWG size by cross-section. Uses SWG_IN above; no second table. */
function swgChart() {
  return SWG_IN.map((dIn, k) => {
    const n = k - 6, dMm = dIn * 25.4, A = Math.PI * dMm * dMm / 4, a = awgFromArea(A);
    return { n, label: swgLabel(n), dIn, dMm, AMm2: A, awg: a.ok ? a.nearest.label : '' };
  });
}
CALCS.push(
  C('swg-wire', 'SWG to Diameter and Area', '10 Cable and Wire', 'Wire diameter and cross-section from a Standard Wire Gauge (SWG) number.', ['swg', 'standard wire gauge', 'imperial wire gauge', 'british wire gauge', 'wire gauge', 'wire', 'gauge', 'diameter', 'mm2', 'conversion'],
    [N('n', 'SWG number (use 0 for 1/0, −1 for 2/0, down to −6 for 7/0)', 18, { min: -6, max: 50, hint: 'SWG is not the same as AWG. The same number gives a different wire.' })],
    [{ key: 'd', label: 'Diameter', dim: 'length', unit: 'mm', prec: 3 }, { key: 'din', label: 'Diameter (inches)', dim: 'length', unit: 'in', prec: 4 }, { key: 'A', label: 'Cross-section', dim: 'area', unit: 'mm²', prec: 4 }], 'd = table value for the SWG number (7/0 = 0.500 in … 50 = 0.0010 in)     A = π d² / 4', ['Solid round conductor', 'Diameters are the standard SWG table values; the series is a table, not a formula'],
    'SWG and AWG differ: SWG 18 is 1.219 mm, AWG 18 is 1.024 mm. Always state which gauge system a drawing or order uses.', ['wire-gauge-conversion', 'dc-voltage-drop'],
    (i) => { const din = swgIn(i.n), d = din * 0.0254, A = Math.PI * d * d / 4; return { out: { d, din: d, A }, steps: [`SWG ${swgLabel(i.n)} = ${fmt(din, 4)} in (table value)`, `d = ${fmt(din, 4)} × 25.4 = ${fmt(d * 1e3, 4)} mm`, `A = π d² / 4 = ${fmt(A * 1e6, 4)} mm²`], sentence: `SWG ${swgLabel(i.n)} is ${fmt(d * 1e3, 3)} mm across, ${fmt(A * 1e6, 3)} mm² in area.` }; },
    (v) => (Math.abs(v.n - Math.round(v.n)) > 1e-9 ? [{ key: 'n', msg: 'SWG number must be a whole number' }] : []),
    [{ name: 'SWG 18 is 0.048 in', in: { n: 18 }, out: { d: 1.2192, A: 1.167454 }, tol: 1e-5 }, { name: 'SWG 1/0 (0) is 0.324 in', in: { n: 0 }, out: { d: 8.2296 }, tol: 1e-6 }, { name: 'SWG 7/0 (−6) is 0.5 in', in: { n: -6 }, out: { d: 12.7 }, tol: 1e-6 }, { name: 'SWG 50 is 0.001 in', in: { n: 50 }, out: { d: 0.0254 }, tol: 1e-6 },
      { name: 'fractional SWG rejected', in: { n: 18.5 }, error: 'n' }, { name: 'SWG 51 rejected', in: { n: 51 }, error: 'n' }]),
);
/* ---------- v1.10.0: lighting calculators (lumens, lux, candela, watts) and an AGL light-intensity calculator. Reference vectors are written separately in tests/gen_vectors.py from the textbook relations. ---------- */
const FC_LUX = 10.763910416709722; /* 1 footcandle = 1 lm/ft² = 10.7639104167 lx (exact from the foot) */
const WORD_N = { 1: 'one', 2: 'any two', 3: 'all three' };
/* "Enter exactly n of these" guard for the solver-style lighting calculators; blank fields are null. */
const exactly = (keys, names, n, noun) => (v) => {
  const given = keys.filter((k) => v[k] != null);
  if (given.length === n) return [];
  const msg = given.length < n ? `Enter ${WORD_N[n]} of ${noun}` : `Enter only ${WORD_N[n]} of ${noun}; clear the others`;
  return (given.length < n ? keys.filter((k) => v[k] == null) : given).map((k) => ({ key: k, msg: msg + ' (' + names[k] + ')' }));
};
CALCS.push(
  C('lumens-lux-area', 'Lumens, Lux and Area (any two)', '28 Lighting', 'Enter any two of luminous flux, illuminance and area. The third is calculated, with an optional factor for lumens that do not reach the surface.', ['lumens to lux', 'lux to lumens', 'lumen', 'lux', 'illuminance', 'luminous flux', 'area', 'lighting', 'footcandle'],
    [I('phi', 'Luminous flux (lm)', 'number', '', 3000, { min: 0, exMin: true, optional: true, hint: 'Enter any two of flux, illuminance and area and leave the third blank' }), I('E', 'Illuminance (lux)', 'number', '', '', { min: 0, exMin: true, optional: true }), I('A', 'Area', 'area', 'm²', 20, { min: 0, exMin: true, optional: true }),
      I('u', 'Fraction of lumens reaching the surface', 'number', '', 1, { min: 0, max: 1, exMin: true, hint: '1 means every lumen lands on the surface (ideal). Use the utilisation × maintenance factor for a real room.' })],
    [{ key: 'phi', label: 'Luminous flux (lm)', dim: 'number', unit: '', prec: 1 }, { key: 'E', label: 'Illuminance (lux)', dim: 'number', unit: '', prec: 2 }, { key: 'A', label: 'Area', dim: 'area', unit: 'm²', prec: 2 }, { key: 'fc', label: 'Illuminance (footcandles)', dim: 'number', unit: '', prec: 2 }],
    'E = Φ × u / A     Φ = E × A / u     A = Φ × u / E     (1 fc = 10.7639 lx)', ['Light is spread evenly over the area', 'u is the fraction of lamp lumens that reach the surface'], 'Lux is lumens per square metre. For a room, use the utilisation and maintenance factors, or the lumen method for a luminaire count.', ['lux-to-watts', 'lumen-method', 'candela-lux-distance'],
    (i) => { let phi = i.phi, E = i.E, A = i.A, how; const u = i.u;
      if (phi != null && A != null) { E = phi * u / A; how = [`E = Φ × u / A = ${fmt(phi, 1)} × ${fmt(u, 2)} / ${fmt(A, 2)} = ${fmt(E, 3)} lux`]; }
      else if (E != null && A != null) { phi = E * A / u; how = [`Φ = E × A / u = ${fmt(E, 1)} × ${fmt(A, 2)} / ${fmt(u, 2)} = ${fmt(phi, 2)} lm`]; }
      else { A = phi * u / E; how = [`A = Φ × u / E = ${fmt(phi, 1)} × ${fmt(u, 2)} / ${fmt(E, 1)} = ${fmt(A, 3)} m²`]; }
      return { out: { phi, E, A, fc: E / FC_LUX }, steps: how.concat([`Footcandles = lux / 10.7639 = ${fmt(E / FC_LUX, 3)}`]), sentence: `${fmt(phi, 0)} lm over ${fmt(A, 1)} m² at a utilisation of ${fmt(u, 2)} is ${fmt(E, 1)} lux (${fmt(E / FC_LUX, 1)} fc).` }; },
    exactly(['phi', 'E', 'A'], { phi: 'luminous flux', E: 'illuminance', A: 'area' }, 2, 'luminous flux, illuminance and area'),
    [{ name: '3000 lm over 20 m²', in: { phi: 3000, E: '', A: [20, 'm²'], u: 1 }, out: { E: 150, fc: 13.935455 }, tol: 1e-6 }, { name: 'lumens from lux and area', in: { phi: '', E: 300, A: [50, 'm²'], u: 0.6 }, out: { phi: 25000 }, tol: 1e-9 }, { name: 'area from lumens and lux', in: { phi: 4000, E: 500, A: '', u: 0.5 }, out: { A: 4 }, tol: 1e-9 }, { name: 'one value only rejected', in: { phi: 3000, E: '', A: '', u: 1 }, error: 'E' }, { name: 'three values rejected', in: { phi: 3000, E: 150, A: [20, 'm²'], u: 1 }, error: 'phi' }, { name: 'zero area rejected', in: { phi: 3000, E: '', A: [0, 'm²'], u: 1 }, error: 'A' }]),

  C('candela-lux-distance', 'Candela, Lux and Distance (any two)', '28 Lighting', 'Enter any two of luminous intensity, illuminance and distance. The third is calculated with the inverse-square law and the angle of incidence.', ['candela to lux', 'lux to candela', 'candela', 'lux', 'inverse square', 'illuminance', 'luminous intensity', 'distance', 'cosine law', 'point source'],
    [I('I', 'Luminous intensity (cd)', 'number', '', 1000, { min: 0, exMin: true, optional: true, hint: 'Enter any two of intensity, illuminance and distance and leave the third blank' }), I('E', 'Illuminance (lux)', 'number', '', '', { min: 0, exMin: true, optional: true }), I('d', 'Distance from the source', 'length', 'm', 5, { min: 0, exMin: true, optional: true }),
      I('th', 'Angle of incidence (°)', 'number', '', 0, { min: 0, max: 89, hint: '0 means the surface faces the source. Up to 89°.' })],
    [{ key: 'I', label: 'Luminous intensity (cd)', dim: 'number', unit: '', prec: 2 }, { key: 'E', label: 'Illuminance (lux)', dim: 'number', unit: '', prec: 3 }, { key: 'd', label: 'Distance', dim: 'length', unit: 'm', prec: 3 }, { key: 'fc', label: 'Illuminance (footcandles)', dim: 'number', unit: '', prec: 3 }],
    'E = I × cos θ / d²     I = E × d² / cos θ     d = √(I × cos θ / E)', ['Treated as a point source: the distance should be at least five times the size of the source', 'Distance is measured along the line from the source to the point', 'No light is absorbed or reflected on the way'], 'Valid when the distance is at least five times the source size. Near a large luminaire the inverse-square law overstates the lux.', ['lumens-lux-area', 'candela-lumens-beam', 'agl-light-intensity-distance'],
    (i) => { let I0 = i.I, E = i.E, d = i.d, how; const c = Math.cos(i.th * Math.PI / 180);
      if (I0 != null && d != null) { E = I0 * c / (d * d); how = [`E = I × cos θ / d² = ${fmt(I0, 2)} × ${fmt(c, 4)} / ${fmt(d, 3)}² = ${fmt(E, 4)} lux`]; }
      else if (E != null && d != null) { I0 = E * d * d / c; how = [`I = E × d² / cos θ = ${fmt(E, 3)} × ${fmt(d, 3)}² / ${fmt(c, 4)} = ${fmt(I0, 3)} cd`]; }
      else { d = Math.sqrt(I0 * c / E); how = [`d = √(I × cos θ / E) = √(${fmt(I0, 2)} × ${fmt(c, 4)} / ${fmt(E, 3)}) = ${fmt(d, 4)} m`]; }
      return { out: { I: I0, E, d, fc: E / FC_LUX }, steps: how, sentence: `${fmt(I0, 0)} cd at ${fmt(d, 2)} m gives ${fmt(E, 2)} lux (${fmt(E / FC_LUX, 2)} fc) on a surface tilted ${fmt(i.th, 0)}° from facing the source.` }; },
    exactly(['I', 'E', 'd'], { I: 'luminous intensity', E: 'illuminance', d: 'distance' }, 2, 'luminous intensity, illuminance and distance'),
    [{ name: '1000 cd at 5 m', in: { I: 1000, E: '', d: [5, 'm'], th: 0 }, out: { E: 40, fc: 3.7161216 }, tol: 1e-6 }, { name: 'tilted 60°', in: { I: 1000, E: '', d: [5, 'm'], th: 60 }, out: { E: 20 }, tol: 1e-9 }, { name: 'intensity from lux and distance', in: { I: '', E: 40, d: [5, 'm'], th: 0 }, out: { I: 1000 }, tol: 1e-9 }, { name: 'distance from intensity and lux', in: { I: 1000, E: 10, d: '', th: 0 }, out: { d: 10 }, tol: 1e-9 }, { name: 'one value only rejected', in: { I: 1000, E: '', d: '', th: 0 }, error: 'E' }, { name: '90° rejected', in: { I: 1000, E: '', d: [5, 'm'], th: 90 }, error: 'th' }]),

  C('candela-lumens-beam', 'Candela and Lumens from Beam Angle', '28 Lighting', 'Convert between luminous intensity (candela) and luminous flux (lumens) for a beam of a given full angle. Enter one of the two.', ['candela to lumens', 'lumens to candela', 'millicandela', 'mcd', 'beam angle', 'solid angle', 'steradian', 'luminous intensity', 'luminous flux', 'led'],
    [I('I', 'Luminous intensity (cd)', 'number', '', 1000, { min: 0, exMin: true, optional: true, hint: 'Enter either intensity or flux, not both. For millicandela divide by 1000.' }), I('phi', 'Luminous flux (lm)', 'number', '', '', { min: 0, exMin: true, optional: true }), I('th', 'Full beam angle (°)', 'number', '', 60, { min: 0, max: 360, exMin: true, hint: 'The full cone angle, 360° for a sphere' })],
    [{ key: 'I', label: 'Luminous intensity (cd)', dim: 'number', unit: '', prec: 2 }, { key: 'phi', label: 'Luminous flux (lm)', dim: 'number', unit: '', prec: 2 }, { key: 'om', label: 'Solid angle (sr)', dim: 'number', unit: '', prec: 4 }],
    'Ω = 2π × (1 − cos(θ / 2))     Φ = I × Ω     I = Φ / Ω', ['Intensity is the same everywhere inside the cone', 'No light outside the cone'], 'Real beams are brightest on axis, so a data-sheet peak intensity gives more lumens than the beam really carries. Use the measured polar curve for accuracy.', ['candela-lux-distance', 'lumens-watts'],
    (i) => { const om = 2 * Math.PI * (1 - Math.cos(i.th * Math.PI / 360)); let I0 = i.I, phi = i.phi, how = [`Ω = 2π × (1 − cos(${fmt(i.th, 1)}° / 2)) = ${fmt(om, 5)} sr`];
      if (I0 != null) { phi = I0 * om; how.push(`Φ = I × Ω = ${fmt(I0, 2)} × ${fmt(om, 5)} = ${fmt(phi, 3)} lm`); } else { I0 = phi / om; how.push(`I = Φ / Ω = ${fmt(phi, 2)} / ${fmt(om, 5)} = ${fmt(I0, 3)} cd`); }
      return { out: { I: I0, phi, om }, steps: how, sentence: `A ${fmt(i.th, 0)}° beam (${fmt(om, 3)} sr) carries ${fmt(phi, 0)} lm at ${fmt(I0, 0)} cd.` }; },
    exactly(['I', 'phi'], { I: 'luminous intensity', phi: 'luminous flux' }, 1, 'luminous intensity or luminous flux'),
    [{ name: '1000 cd over 60°', in: { I: 1000, phi: '', th: 60 }, out: { phi: 841.7872145, om: 0.8417872145 }, tol: 1e-6 }, { name: 'lumens to candela over 60°', in: { I: '', phi: 841.7872145, th: 60 }, out: { I: 1000 }, tol: 1e-4 }, { name: 'full sphere is 4π sr', in: { I: 100, phi: '', th: 360 }, out: { om: 12.566371, phi: 1256.6371 }, tol: 1e-6 }, { name: 'both values rejected', in: { I: 1000, phi: 800, th: 60 }, error: 'I' }, { name: 'angle above 360° rejected', in: { I: 1000, phi: '', th: 400 }, error: 'th' }]),

  C('lumens-watts', 'Lumens and Watts (luminous efficacy)', '28 Lighting', 'Enter any two of luminous flux, electrical power and luminous efficacy. The third is calculated.', ['lumens to watts', 'watts to lumens', 'luminous efficacy', 'lm/w', 'lumen', 'watt', 'led', 'lamp', 'efficacy'],
    [I('phi', 'Luminous flux (lm)', 'number', '', '', { min: 0, exMin: true, optional: true, hint: 'Enter any two of flux, power and efficacy and leave the third blank' }), I('P', 'Electrical power', 'power', 'W', 10, { min: 0, exMin: true, optional: true }), I('eta', 'Luminous efficacy (lm/W)', 'number', '', 100, { min: 0, exMin: true, optional: true, hint: 'From the lamp data sheet. There is no single lumens-to-watts factor.' })],
    [{ key: 'phi', label: 'Luminous flux (lm)', dim: 'number', unit: '', prec: 1 }, { key: 'P', label: 'Electrical power', dim: 'power', unit: 'W', prec: 2 }, { key: 'eta', label: 'Luminous efficacy (lm/W)', dim: 'number', unit: '', prec: 1 }],
    'Φ = P × η     P = Φ / η     η = Φ / P', ['Power is the lamp or luminaire input power as stated for the efficacy', 'Efficacy is taken from the data sheet'], 'Efficacy depends on the lamp type and whether driver losses are counted. Compare lamps on the same basis, lamp-only or system.', ['lux-to-watts', 'led-retrofit-payback', 'candela-lumens-beam'],
    (i) => { let phi = i.phi, P = i.P, eta = i.eta, how;
      if (P != null && eta != null) { phi = P * eta; how = [`Φ = P × η = ${fmt(P, 2)} × ${fmt(eta, 1)} = ${fmt(phi, 1)} lm`]; }
      else if (phi != null && eta != null) { P = phi / eta; how = [`P = Φ / η = ${fmt(phi, 1)} / ${fmt(eta, 1)} = ${fmt(P, 3)} W`]; }
      else { eta = phi / P; how = [`η = Φ / P = ${fmt(phi, 1)} / ${fmt(P, 2)} = ${fmt(eta, 2)} lm/W`]; }
      return { out: { phi, P, eta }, steps: how, sentence: `${fmt(P, 1)} W at ${fmt(eta, 0)} lm/W gives ${fmt(phi, 0)} lm.` }; },
    exactly(['phi', 'P', 'eta'], { phi: 'luminous flux', P: 'electrical power', eta: 'luminous efficacy' }, 2, 'luminous flux, power and efficacy'),
    [{ name: '10 W at 100 lm/W', in: { phi: '', P: [10, 'W'], eta: 100 }, out: { phi: 1000 }, tol: 1e-9 }, { name: 'watts from lumens and efficacy', in: { phi: 800, P: '', eta: 80 }, out: { P: 10 }, tol: 1e-9 }, { name: 'efficacy from lumens and watts', in: { phi: 1600, P: [20, 'W'], eta: '' }, out: { eta: 80 }, tol: 1e-9 }, { name: 'kW input converts', in: { phi: '', P: [0.1, 'kW'], eta: 90 }, out: { phi: 9000 }, tol: 1e-9 }, { name: 'one value only rejected', in: { phi: 800, P: '', eta: '' }, error: 'P' }, { name: 'zero efficacy rejected', in: { phi: '', P: [10, 'W'], eta: 0 }, error: 'eta' }]),

  C('lux-to-watts', 'Lighting Power for a Target Lux', '28 Lighting', 'Lamp lumens and electrical watts needed to reach a target illuminance on an area, with utilisation and maintenance factors.', ['lux to watts', 'watts to lux', 'lighting power', 'lighting design', 'illuminance', 'lumen method', 'w/m2', 'power density', 'led'],
    [I('E', 'Target illuminance (lux)', 'number', '', 300, { min: 0, exMin: true }), I('A', 'Area', 'area', 'm²', 50, { min: 0, exMin: true }), I('eta', 'Luminous efficacy (lm/W)', 'number', '', 100, { min: 0, exMin: true, hint: 'Lamp or luminaire efficacy from the data sheet' }), I('uf', 'Utilisation factor', 'number', '', 0.6, { min: 0, max: 1, exMin: true }), I('mf', 'Maintenance factor', 'number', '', 0.8, { min: 0, max: 1, exMin: true })],
    [{ key: 'phi', label: 'Lamp lumens needed', dim: 'number', unit: '', prec: 0 }, { key: 'P', label: 'Electrical power', dim: 'power', unit: 'W', prec: 1 }, { key: 'pd', label: 'Power density (W/m²)', dim: 'number', unit: '', prec: 2 }],
    'Φ = E × A / (UF × MF)     P = Φ / η     power density = P / A', ['Uniform illuminance across the area', 'Factors apply to the whole installation'], 'Use the lumen method calculator for the number of luminaires. Check the power density against your energy code.', ['lumen-method', 'lumens-watts', 'led-retrofit-payback'],
    (i) => { const phi = i.E * i.A / (i.uf * i.mf), P = phi / i.eta, pd = P / i.A;
      return { out: { phi, P, pd }, steps: [`Φ = ${fmt(i.E, 0)} × ${fmt(i.A, 1)} / (${fmt(i.uf, 2)} × ${fmt(i.mf, 2)}) = ${fmt(phi, 1)} lm`, `P = ${fmt(phi, 1)} / ${fmt(i.eta, 1)} = ${fmt(P, 2)} W`, `Power density = ${fmt(P, 2)} / ${fmt(i.A, 1)} = ${fmt(pd, 3)} W/m²`], sentence: `${fmt(i.E, 0)} lux over ${fmt(i.A, 0)} m² needs about ${fmt(phi, 0)} lamp lumens and ${fmt(P, 0)} W (${fmt(pd, 1)} W/m²).` }; },
    [{ name: '300 lux, 50 m², 100 lm/W', in: { E: 300, A: [50, 'm²'], eta: 100, uf: 0.6, mf: 0.8 }, out: { phi: 31250, P: 312.5, pd: 6.25 }, tol: 1e-9 }, { name: 'ideal factors', in: { E: 500, A: [100, 'm²'], eta: 120, uf: 1, mf: 1 }, out: { phi: 50000, P: 416.666667, pd: 4.166667 }, tol: 1e-6 }, { name: 'zero efficacy rejected', in: { E: 300, A: [50, 'm²'], eta: 0, uf: 0.6, mf: 0.8 }, error: 'eta' }, { name: 'utilisation above 1 rejected', in: { E: 300, A: [50, 'm²'], eta: 100, uf: 1.2, mf: 0.8 }, error: 'uf' }]),

  C('millicandela-lumens-beam', 'Millicandela and Lumens from Beam Angle', '28 Lighting', 'Convert between luminous intensity in millicandela (mcd, as on LED data sheets) and luminous flux in lumens for a beam of a given full angle. Enter one of the two.', ['millicandela to lumens', 'lumens to millicandela', 'mcd to lumens', 'lumens to mcd', 'millicandela', 'mcd', 'led', 'beam angle', 'solid angle', 'luminous intensity', 'luminous flux'],
    [I('I', 'Luminous intensity (mcd)', 'number', '', 5000, { min: 0, exMin: true, optional: true, hint: 'Enter either intensity or flux, not both. Millicandela as on the data sheet: 1 cd = 1,000 mcd.' }), I('phi', 'Luminous flux (lm)', 'number', '', '', { min: 0, exMin: true, optional: true }), I('th', 'Full beam angle (°)', 'number', '', 30, { min: 0, max: 360, exMin: true, hint: 'The full cone angle from the data sheet (twice the half angle), 360° for a sphere' })],
    [{ key: 'I', label: 'Luminous intensity (mcd)', dim: 'number', unit: '', prec: 1 }, { key: 'phi', label: 'Luminous flux (lm)', dim: 'number', unit: '', prec: 3 }, { key: 'om', label: 'Solid angle (sr)', dim: 'number', unit: '', prec: 4 }],
    'Ω = 2π × (1 − cos(θ / 2))     Φ (lm) = I (cd) × Ω     I (mcd) = Φ / Ω × 1,000', ['Intensity is the same everywhere inside the cone', 'No light outside the cone'], 'Data-sheet millicandela is normally the peak on-axis value, so the flux from this conversion is an upper estimate. Use the total luminous flux on the data sheet where it is given.', ['candela-lumens-beam', 'candela-lux-distance'],
    (i) => { const om = 2 * Math.PI * (1 - Math.cos(i.th * Math.PI / 360)); let mcd = i.I, phi = i.phi, how = [`Ω = 2π × (1 − cos(${fmt(i.th, 1)}° / 2)) = ${fmt(om, 5)} sr`];
      if (mcd != null) { phi = mcd / 1000 * om; how.push(`I = ${fmt(mcd, 2)} mcd / 1,000 = ${fmt(mcd / 1000, 5)} cd`, `Φ = I × Ω = ${fmt(mcd / 1000, 5)} × ${fmt(om, 5)} = ${fmt(phi, 4)} lm`); } else { mcd = phi / om * 1000; how.push(`I = Φ / Ω = ${fmt(phi, 4)} / ${fmt(om, 5)} = ${fmt(mcd / 1000, 5)} cd`, `I = ${fmt(mcd / 1000, 5)} cd × 1,000 = ${fmt(mcd, 2)} mcd`); }
      return { out: { I: mcd, phi, om }, steps: how, sentence: `A ${fmt(i.th, 0)}° beam (${fmt(om, 3)} sr) at ${fmt(mcd, 0)} mcd carries ${fmt(phi, 3)} lm.` }; },
    exactly(['I', 'phi'], { I: 'luminous intensity', phi: 'luminous flux' }, 1, 'luminous intensity or luminous flux'),
    [{ name: '5000 mcd over 30°', in: { I: 5000, phi: '', th: 30 }, out: { phi: 1.07047174, om: 0.21409435 }, tol: 1e-6 }, { name: '1 lm over 30° in mcd', in: { I: '', phi: 1, th: 30 }, out: { I: 4670.83793 }, tol: 1e-5 }, { name: 'full sphere is 4π sr', in: { I: 100000, phi: '', th: 360 }, out: { om: 12.566371, phi: 1256.6371 }, tol: 1e-6 }, { name: 'both values rejected', in: { I: 5000, phi: 1, th: 30 }, error: 'I' }, { name: 'angle above 360° rejected', in: { I: 5000, phi: '', th: 400 }, error: 'th' }]),

  C('watts-to-lux', 'Illuminance from Lamp Power (watts to lux)', '28 Lighting', 'Estimate the average lux on an area from the electrical watts of the lamps, their luminous efficacy, the area and the utilisation and maintenance factors.', ['watts to lux', 'lux from watts', 'illuminance from power', 'lighting level', 'average lux', 'lumen method', 'lm/w', 'efficacy', 'led'],
    [I('P', 'Electrical power', 'power', 'W', 100, { min: 0, exMin: true, hint: 'Total input power of all the lamps or luminaires' }), I('eta', 'Luminous efficacy (lm/W)', 'number', '', 100, { min: 0, exMin: true, hint: 'Lamp or luminaire efficacy from the data sheet' }), I('A', 'Area', 'area', 'm²', 20, { min: 0, exMin: true }), I('uf', 'Utilisation factor', 'number', '', 0.6, { min: 0, max: 1, exMin: true }), I('mf', 'Maintenance factor', 'number', '', 0.8, { min: 0, max: 1, exMin: true })],
    [{ key: 'E', label: 'Average illuminance (lux)', dim: 'number', unit: '', prec: 1 }, { key: 'phi', label: 'Lamp lumens (lm)', dim: 'number', unit: '', prec: 0 }, { key: 'pd', label: 'Power density (W/m²)', dim: 'number', unit: '', prec: 2 }],
    'Φ = P × η     E = Φ × UF × MF / A', ['Uniform illuminance across the area', 'Factors apply to the whole installation', 'Power is lamp or luminaire input power as stated for the efficacy'], 'This is the reverse of Lighting Power for a Target Lux. Use the lumen method calculator for a luminaire count and the point calculation for uneven layouts.', ['lux-to-watts', 'lumen-method', 'lumens-lux-area'],
    (i) => { const phi = i.P * i.eta, E = phi * i.uf * i.mf / i.A, pd = i.P / i.A;
      return { out: { E, phi, pd }, steps: [`Φ = P × η = ${fmt(i.P, 1)} × ${fmt(i.eta, 1)} = ${fmt(phi, 1)} lm`, `E = Φ × UF × MF / A = ${fmt(phi, 1)} × ${fmt(i.uf, 2)} × ${fmt(i.mf, 2)} / ${fmt(i.A, 1)} = ${fmt(E, 2)} lux`, `Power density = ${fmt(i.P, 1)} / ${fmt(i.A, 1)} = ${fmt(pd, 3)} W/m²`], sentence: `${fmt(i.P, 0)} W at ${fmt(i.eta, 0)} lm/W over ${fmt(i.A, 0)} m² gives about ${fmt(E, 0)} lux.` }; },
    [{ name: '100 W, 100 lm/W, 20 m²', in: { P: [100, 'W'], eta: 100, A: [20, 'm²'], uf: 0.6, mf: 0.8 }, out: { E: 240, phi: 10000, pd: 5 }, tol: 1e-9 }, { name: 'ideal factors', in: { P: [500, 'W'], eta: 120, A: [100, 'm²'], uf: 1, mf: 1 }, out: { E: 600, phi: 60000, pd: 5 }, tol: 1e-9 }, { name: 'zero area rejected', in: { P: [100, 'W'], eta: 100, A: [0, 'm²'], uf: 0.6, mf: 0.8 }, error: 'A' }, { name: 'maintenance factor above 1 rejected', in: { P: [100, 'W'], eta: 100, A: [20, 'm²'], uf: 0.6, mf: 1.5 }, error: 'mf' }]),

  C('agl-light-intensity-distance', "AGL Light Intensity at Distance (Allard's Law)", '35 Airport and AGL', "Illuminance at the pilot's eye from a light of given intensity, at a distance, through fog or haze described by the meteorological optical range (MOR).", ['agl', "allard's law", 'allard', 'visual range', 'rvr', 'mor', 'meteorological optical range', 'transmissivity', 'intensity', 'candela', 'airfield lighting', 'fog', 'visibility'],
    [I('I', 'Intensity toward the observer (cd)', 'number', '', 10000, { min: 0, exMin: true, hint: 'Example value. Use the isocandela data for the fitting and the viewing angle.' }), I('d', 'Distance to the light', 'length', 'm', 300, { min: 0, exMin: true }), I('mor', 'Meteorological optical range (MOR)', 'length', 'm', 800, { min: 0, exMin: true, hint: 'Path length that cuts a light beam to 5% (the standard MOR definition)' })],
    [{ key: 'E', label: 'Illuminance at the eye (lux)', dim: 'number', unit: '', prec: 6 }, { key: 'Ec', label: 'Illuminance in clear air (lux)', dim: 'number', unit: '', prec: 6 }, { key: 'T', label: 'Atmospheric transmissivity over the path (%)', dim: 'number', unit: '', prec: 2 }, { key: 'sig', label: 'Extinction coefficient (per km)', dim: 'number', unit: '', prec: 3 }],
    "E = I × T / d²     T = exp(−σ d)     σ = ln(20) / MOR", ['Point source seen head-on', 'Uniform atmosphere along the path', 'MOR is defined at 5% transmissivity (ln 20 = 2.9957)'], 'This gives the light level at the eye only. Visual range needs an eye threshold for the background brightness you design for; take that from the method you follow (for example ICAO Doc 9328 for RVR). Not an operational RVR assessment.', ['agl-brightness-steps', 'candela-lux-distance', 'agl-lamp-life-curve'],
    (i) => { const sig = Math.log(20) / i.mor, T = Math.exp(-sig * i.d), Ec = i.I / (i.d * i.d), E = Ec * T, w = [];
      if (i.d > 3 * i.mor) w.push('The distance is more than three times the MOR, so the light is very strongly attenuated and the result is small.');
      return { out: { E, Ec, T: T * 100, sig: sig * 1000 }, warnings: w, steps: [`σ = ln 20 / MOR = ${fmt(Math.log(20), 4)} / ${fmt(i.mor, 1)} = ${fmt(sig * 1000, 4)} per km`, `T = exp(−σ d) = exp(−${fmt(sig * i.d, 4)}) = ${fmt(T, 5)}`, `E = I × T / d² = ${fmt(i.I, 1)} × ${fmt(T, 5)} / ${fmt(i.d, 1)}² = ${fmt(E, 6)} lux`], sentence: `At ${fmt(i.d, 0)} m with a ${fmt(i.mor, 0)} m MOR, a ${fmt(i.I, 0)} cd light gives ${fmt(E, 4)} lux at the eye, ${fmt(T * 100, 0)}% of the clear-air value.` }; },
    [{ name: '10000 cd, 300 m, MOR 800 m', in: { I: 10000, d: [300, 'm'], mor: [800, 'm'] }, out: { E: 0.0361302729, Ec: 0.1111111111, T: 32.5172456, sig: 3.7446653 }, tol: 1e-5 }, { name: 'distance equal to the MOR gives 5%', in: { I: 5000, d: [800, 'm'], mor: [800, 'm'] }, out: { T: 5 }, tol: 1e-9 }, { name: 'very long MOR approaches clear air', in: { I: 1000, d: [100, 'm'], mor: [1e9, 'm'] }, out: { E: 0.1 }, tol: 1e-5 }, { name: 'zero MOR rejected', in: { I: 10000, d: [300, 'm'], mor: [0, 'm'] }, error: 'mor' }, { name: 'zero distance rejected', in: { I: 10000, d: [0, 'm'], mor: [800, 'm'] }, error: 'd' }])
);
/* ---------- v1.46.0: Engineering Mathematics division (37). Reference vectors are written separately in tests/gen_vectors.py with Python's cmath. ---------- */
const cxSign = (x) => (x < 0 ? '−' : '+');
const cxRect = (a, b, p) => `${fmt(a, p)} ${cxSign(b)} j${fmt(Math.abs(b), p)}`;
const cxPolar = (m, th, p) => `${fmt(m, p)} ∠${fmt(th, 3)}°`;
/* Exact zero for a result that is zero apart from rounding noise relative to its parts, and no negative zero. */
const cxClean = (x, scale) => (Math.abs(x) <= 1e-14 * scale ? 0 : x + 0);
CALCS.push(
  C('complex-number', 'Complex Numbers (Rectangular and Polar)', '37 Engineering Mathematics', 'Add, subtract, multiply or divide two complex numbers, or convert one between rectangular (a + jb) and polar (magnitude ∠ angle) form. The answer is shown in both forms with the working.',
    ['complex number', 'complex number calculator', 'rectangular to polar', 'polar to rectangular', 'polar form', 'rectangular form', 'phasor', 'j operator', 'imaginary', 'magnitude', 'phase angle', 'argument', 'complex arithmetic'],
    [I('a', 'z₁ real part (a)', 'number', '', 3, { hint: 'z₁ = a + jb. For a phasor or impedance the real part is the resistance or the in-phase component.' }),
      I('b', 'z₁ imaginary part (b)', 'number', '', 4, { hint: 'The coefficient of j. Inductive reactance is positive, capacitive reactance is negative.' }),
      { key: 'op', label: 'Operation', type: 'enum', options: [3, 4, 1, 2, 0], def: 3, labels: { 3: 'z₁ × z₂ (multiply)', 4: 'z₁ ÷ z₂ (divide)', 1: 'z₁ + z₂ (add)', 2: 'z₁ − z₂ (subtract)', 0: 'Convert z₁ only (rectangular to polar and back)' } },
      I('c', 'z₂ real part (c)', 'number', '', 1, { hint: 'z₂ = c + jd. Ignored when the operation is "Convert z₁ only".' }),
      I('d', 'z₂ imaginary part (d)', 'number', '', -2, { hint: 'The coefficient of j in z₂. Ignored when converting z₁ only.' })],
    [{ key: 'mag', label: 'Result magnitude |z|', dim: 'number', unit: '', prec: 6 }, { key: 'ang', label: 'Result angle (degrees)', dim: 'number', unit: '', prec: 4 }, { key: 're', label: 'Result real part', dim: 'number', unit: '', prec: 6 },
      { key: 'im', label: 'Result imaginary part (coefficient of j)', dim: 'number', unit: '', prec: 6 }, { key: 'angr', label: 'Result angle (radians)', dim: 'number', unit: '', prec: 6 },
      { key: 'm1', label: 'z₁ magnitude |z₁|', dim: 'number', unit: '', prec: 6 }, { key: 'a1', label: 'z₁ angle (degrees)', dim: 'number', unit: '', prec: 4 }],
    'Magnitude |z| = √(a² + b²)     Angle θ = atan2(b, a)     a = |z| cos θ     b = |z| sin θ     (a + jb)(c + jd) = (ac − bd) + j(ad + bc)     (a + jb) / (c + jd) = [(ac + bd) + j(bc − ad)] / (c² + d²)',
    ['Angles are in degrees from −180° to 180°, measured from the positive real axis (atan2, so the quadrant is correct)', 'j is the square root of −1; engineers write j instead of i', 'The values are plain numbers: enter resistance, reactance, volts or amps in one consistent unit'],
    'For impedance enter R as the real part and X as the imaginary part (X is positive for an inductor and negative for a capacitor). Multiplying two phasors multiplies the magnitudes and adds the angles; dividing divides the magnitudes and subtracts the angles. For a full AC circuit with a supply voltage use the AC Ohm\'s law calculator.',
    ['ac-ohms-law', 'impedance-rlc', 'reactance', 'resonance-lc'],
    (i) => {
      const r2d = 180 / Math.PI, m1 = Math.hypot(i.a, i.b), a1 = Math.atan2(i.b, i.a) * r2d, how = [], w = [];
      let re, im;
      how.push(`z₁ = ${cxRect(i.a, i.b, 4)}`);
      if (i.op !== 0) how.push(`z₂ = ${cxRect(i.c, i.d, 4)}`);
      if (i.op === 0) {
        re = i.a; im = i.b;
        how.push(`|z₁| = √(a² + b²) = √(${fmt(i.a, 4)}² + ${fmt(i.b, 4)}²) = ${fmt(m1, 6)}`, `θ = atan2(b, a) = atan2(${fmt(i.b, 4)}, ${fmt(i.a, 4)}) = ${fmt(a1, 4)}°`,
          `Back to rectangular: a = |z| cos θ = ${fmt(m1 * Math.cos(a1 / r2d), 6)}, b = |z| sin θ = ${fmt(m1 * Math.sin(a1 / r2d), 6)}`);
      } else if (i.op === 1) {
        re = i.a + i.c; im = i.b + i.d;
        how.push(`z₁ + z₂ = (a + c) + j(b + d) = (${fmt(i.a, 4)} + ${fmt(i.c, 4)}) + j(${fmt(i.b, 4)} + ${fmt(i.d, 4)})`);
      } else if (i.op === 2) {
        re = i.a - i.c; im = i.b - i.d;
        how.push(`z₁ − z₂ = (a − c) + j(b − d) = (${fmt(i.a, 4)} − ${fmt(i.c, 4)}) + j(${fmt(i.b, 4)} − ${fmt(i.d, 4)})`);
      } else if (i.op === 3) {
        re = i.a * i.c - i.b * i.d; im = i.a * i.d + i.b * i.c;
        how.push(`z₁ × z₂ = (ac − bd) + j(ad + bc)`, `ac − bd = ${fmt(i.a, 4)} × ${fmt(i.c, 4)} − ${fmt(i.b, 4)} × ${fmt(i.d, 4)} = ${fmt(re, 6)}`, `ad + bc = ${fmt(i.a, 4)} × ${fmt(i.d, 4)} + ${fmt(i.b, 4)} × ${fmt(i.c, 4)} = ${fmt(im, 6)}`);
      } else {
        const den = i.c * i.c + i.d * i.d;
        re = (i.a * i.c + i.b * i.d) / den; im = (i.b * i.c - i.a * i.d) / den;
        how.push(`z₁ ÷ z₂ = [(ac + bd) + j(bc − ad)] / (c² + d²)`, `c² + d² = ${fmt(i.c, 4)}² + ${fmt(i.d, 4)}² = ${fmt(den, 6)}`,
          `Real = (ac + bd) / (c² + d²) = ${fmt(re, 6)}`, `Imaginary = (bc − ad) / (c² + d²) = ${fmt(im, 6)}`);
      }
      const scale = Math.max(Math.abs(i.a), Math.abs(i.b), i.op === 0 ? 0 : Math.abs(i.c), i.op === 0 ? 0 : Math.abs(i.d), 1e-300);
      re = cxClean(re, i.op === 3 || i.op === 4 ? scale * scale : scale); im = cxClean(im, i.op === 3 || i.op === 4 ? scale * scale : scale);
      const mag = Math.hypot(re, im), ang = mag === 0 ? 0 : Math.atan2(im, re) * r2d;
      if (mag === 0) w.push('The result is zero, so its angle is undefined. It is shown as 0°.');
      if (i.op === 0 && m1 === 0) w.push('z₁ is zero, so its angle is undefined. It is shown as 0°.');
      how.push(`Result = ${cxRect(re, im, 6)}`, `|z| = √(${fmt(re, 4)}² + ${fmt(im, 4)}²) = ${fmt(mag, 6)}     θ = atan2(${fmt(im, 4)}, ${fmt(re, 4)}) = ${fmt(ang, 4)}°`, `Polar form = ${cxPolar(mag, ang, 6)}`);
      const what = { 0: 'z₁', 1: 'z₁ + z₂', 2: 'z₁ − z₂', 3: 'z₁ × z₂', 4: 'z₁ ÷ z₂' }[i.op];
      return { out: { re, im, mag, ang, angr: ang / r2d, m1, a1: m1 === 0 ? 0 : a1 }, steps: how, warnings: w,
        sentence: `${what} = ${cxRect(re, im, 4)} in rectangular form, which is ${cxPolar(mag, ang, 4)} in polar form.` };
    },
    (v) => {
      const e = [];
      if (v.op === 4 && v.c === 0 && v.d === 0) e.push({ key: 'c', msg: 'z₂ is zero, so z₁ ÷ z₂ is undefined. Enter a non-zero real or imaginary part for z₂' }, { key: 'd', msg: 'z₂ is zero, so z₁ ÷ z₂ is undefined' });
      return e;
    },
    [{ name: '(3 + j4) × (1 − j2) = 11 − j2', in: { a: 3, b: 4, op: 3, c: 1, d: -2 }, out: { re: 11, im: -2, mag: 11.1803398875, ang: -10.3048467, m1: 5, a1: 53.13010235 }, tol: 1e-6 },
      { name: '3 + j4 converts to 5 ∠53.13°', in: { a: 3, b: 4, op: 0, c: 0, d: 0 }, out: { re: 3, im: 4, mag: 5, ang: 53.13010235, angr: 0.927295218 }, tol: 1e-8 },
      { name: 'second quadrant: −3 + j4 is 5 ∠126.87°', in: { a: -3, b: 4, op: 0, c: 0, d: 0 }, out: { mag: 5, ang: 126.8698976 }, tol: 1e-8 },
      { name: 'third quadrant: −3 − j4 is 5 ∠−126.87°', in: { a: -3, b: -4, op: 0, c: 0, d: 0 }, out: { mag: 5, ang: -126.8698976 }, tol: 1e-8 },
      { name: 'negative real axis is 180°', in: { a: -5, b: 0, op: 0, c: 0, d: 0 }, out: { mag: 5, ang: 180 }, tol: 1e-9 },
      { name: 'j is 1 ∠90°', in: { a: 0, b: 1, op: 0, c: 0, d: 0 }, out: { mag: 1, ang: 90, angr: 1.570796327 }, tol: 1e-9 },
      { name: 'addition: (3 + j4) + (1 − j2) = 4 + j2', in: { a: 3, b: 4, op: 1, c: 1, d: -2 }, out: { re: 4, im: 2 }, tol: 1e-12 },
      { name: 'subtraction: (3 + j4) − (1 − j2) = 2 + j6', in: { a: 3, b: 4, op: 2, c: 1, d: -2 }, out: { re: 2, im: 6 }, tol: 1e-12 },
      { name: 'division: (3 + j4) ÷ (1 − j2) = −1 + j2', in: { a: 3, b: 4, op: 4, c: 1, d: -2 }, out: { re: -1, im: 2, mag: 2.2360679775, ang: 116.5650512 }, tol: 1e-8 },
      { name: 'j × j = −1', in: { a: 0, b: 1, op: 3, c: 0, d: 1 }, out: { re: -1, im: 0, ang: 180 }, tol: 1e-12 },
      { name: 'z ÷ z = 1', in: { a: 7.5, b: -2.25, op: 4, c: 7.5, d: -2.25 }, out: { re: 1, im: 0, ang: 0 }, tol: 1e-12 },
      { name: 'z − z is zero with a warning', in: { a: 3, b: 4, op: 2, c: 3, d: 4 }, out: { re: 0, im: 0, mag: 0, ang: 0 }, tol: 1e-12, warn: 'angle is undefined' },
      { name: 'division by zero rejected', in: { a: 3, b: 4, op: 4, c: 0, d: 0 }, error: 'c' },
      { name: 'z₂ is ignored when converting', in: { a: 3, b: 4, op: 0, c: 0, d: 0 }, out: { mag: 5 }, tol: 1e-12 }]),
  C('phasor-sum', 'Phasor Sum and Difference (Polar Inputs)', '37 Engineering Mathematics', 'Add or subtract up to three phasors given as magnitude and angle, such as voltages or currents at different phase angles. The resultant is shown in polar and rectangular form with the working.',
    ['phasor', 'phasor calculator', 'phasor addition', 'phasor sum', 'add phasors', 'vector sum', 'resultant phasor', 'phase angle', 'polar form', 'polar to rectangular', 'sum of voltages', 'sum of currents', 'kirchhoff phasor'],
    [I('m1', 'Phasor 1 magnitude', 'number', '', 10, { min: 0, hint: 'RMS or peak value, as long as all three phasors use the same one. Volts, amps or any consistent quantity.' }),
      I('t1', 'Phasor 1 angle (degrees)', 'number', '', 30, { hint: 'Measured from the reference axis, counter-clockwise positive. A lagging quantity has a negative angle relative to the reference.' }),
      { key: 's2', label: 'Phasor 2 is', type: 'enum', options: [1, -1], def: 1, labels: { 1: 'added (+)', '-1': 'subtracted (−)' } },
      I('m2', 'Phasor 2 magnitude', 'number', '', 5, { min: 0, hint: 'Enter 0 to leave phasor 2 out.' }),
      I('t2', 'Phasor 2 angle (degrees)', 'number', '', -45),
      { key: 's3', label: 'Phasor 3 is', type: 'enum', options: [1, -1], def: 1, labels: { 1: 'added (+)', '-1': 'subtracted (−)' } },
      I('m3', 'Phasor 3 magnitude', 'number', '', 0, { min: 0, hint: 'Enter 0 to leave phasor 3 out.' }),
      I('t3', 'Phasor 3 angle (degrees)', 'number', '', 0)],
    [{ key: 'mag', label: 'Resultant magnitude', dim: 'number', unit: '', prec: 6 }, { key: 'ang', label: 'Resultant angle (degrees)', dim: 'number', unit: '', prec: 4 }, { key: 're', label: 'Resultant real part', dim: 'number', unit: '', prec: 6 },
      { key: 'im', label: 'Resultant imaginary part (coefficient of j)', dim: 'number', unit: '', prec: 6 }, { key: 'angr', label: 'Resultant angle (radians)', dim: 'number', unit: '', prec: 6 },
      { key: 'arith', label: 'Sum of the magnitudes (all in phase)', dim: 'number', unit: '', prec: 6 }],
    'Re = Σ sₖ mₖ cos θₖ     Im = Σ sₖ mₖ sin θₖ     |R| = √(Re² + Im²)     θ = atan2(Im, Re)     sₖ = +1 for an added phasor, −1 for a subtracted one',
    ['Angles are in degrees, counter-clockwise from the reference axis; the resultant angle is given from −180° to 180° (atan2)', 'All phasors have the same frequency and the same kind of value (all RMS or all peak)', 'Magnitudes are plain numbers: enter volts, amps or any one quantity in one consistent unit', 'Phasor 1 is always added; a magnitude of 0 leaves a phasor out'],
    'Phasors add as vectors, not as plain numbers: 10 ∠0° plus 10 ∠90° is 14.14, not 20. Use this for the sum of branch currents at a node or of voltages around a loop when each is known by magnitude and angle. To work from rectangular values or to multiply or divide, use the complex number calculator; for a voltage, current and impedance relation use AC Ohm\'s law.',
    ['complex-number', 'ac-ohms-law', 'impedance-rlc', 'three-phase-power'],
    (i) => {
      const r2d = 180 / Math.PI, how = [], w = [], ph = [[1, i.m1, i.t1], [i.s2, i.m2, i.t2], [i.s3, i.m3, i.t3]];
      let re = 0, im = 0, arith = 0, used = 0;
      ph.forEach((p, k) => {
        const sg = p[0], m = p[1], th = p[2];
        if (k > 0 && m === 0) return;
        const x = sg * m * Math.cos(th / r2d), y = sg * m * Math.sin(th / r2d);
        re += x; im += y; arith += m; used++;
        how.push(`Phasor ${k + 1}: ${sg < 0 ? '−' : '+'} ${fmt(m, 4)} ∠${fmt(th, 3)}° = ${cxRect(x, y, 6)}`);
      });
      if (used === 1) w.push('Only one phasor has a magnitude above zero, so the result is that phasor (negated if subtracted).');
      re = cxClean(re, arith || 1); im = cxClean(im, arith || 1);
      const mag = Math.hypot(re, im), ang = mag === 0 ? 0 : Math.atan2(im, re) * r2d;
      if (mag === 0) w.push('The phasors cancel exactly, so the result is zero and its angle is undefined. It is shown as 0°.');
      how.push(`Sum = ${cxRect(re, im, 6)}`, `|R| = √(${fmt(re, 4)}² + ${fmt(im, 4)}²) = ${fmt(mag, 6)}     θ = atan2(${fmt(im, 4)}, ${fmt(re, 4)}) = ${fmt(ang, 4)}°`, `Resultant = ${cxPolar(mag, ang, 6)}`);
      return { out: { re, im, mag, ang, angr: ang / r2d, arith }, steps: how, warnings: w,
        sentence: `The resultant is ${cxPolar(mag, ang, 4)}, which is ${cxRect(re, im, 4)} in rectangular form.` };
    },
    [{ name: '10 ∠30° + 5 ∠−45° (defaults)', in: { m1: 10, t1: 30, s2: 1, m2: 5, t2: -45, s3: 1, m3: 0, t3: 0 }, out: { re: 12.19578794, im: 1.46446609, mag: 12.28339955, ang: 6.84727287, arith: 15 }, tol: 1e-6 },
      { name: 'two equal phasors 90° apart: 10 ∠0° + 10 ∠90° = 14.142 ∠45°', in: { m1: 10, t1: 0, s2: 1, m2: 10, t2: 90, s3: 1, m3: 0, t3: 0 }, out: { re: 10, im: 10, mag: 14.14213562, ang: 45 }, tol: 1e-9 },
      { name: 'in phase phasors add arithmetically', in: { m1: 6, t1: 20, s2: 1, m2: 4, t2: 20, s3: 1, m3: 0, t3: 0 }, out: { mag: 10, ang: 20, arith: 10 }, tol: 1e-9 },
      { name: 'opposite phasors subtract', in: { m1: 6, t1: 0, s2: 1, m2: 4, t2: 180, s3: 1, m3: 0, t3: 0 }, out: { mag: 2, ang: 0 }, tol: 1e-9 },
      { name: 'balanced three-phase set sums to zero with a warning', in: { m1: 230, t1: 0, s2: 1, m2: 230, t2: -120, s3: 1, m3: 230, t3: 120 }, out: { re: 0, im: 0, mag: 0, ang: 0 }, tol: 1e-9, warn: 'cancel' },
      { name: 'line voltage: 230 ∠0° − 230 ∠−120° = 398.37 ∠30°', in: { m1: 230, t1: 0, s2: -1, m2: 230, t2: -120, s3: 1, m3: 0, t3: 0 }, out: { mag: 398.3716857, ang: 30 }, tol: 1e-6 },
      { name: 'subtracting a phasor from itself is zero', in: { m1: 7, t1: 33, s2: -1, m2: 7, t2: 33, s3: 1, m3: 0, t3: 0 }, out: { mag: 0 }, tol: 1e-9, warn: 'cancel' },
      { name: 'a single phasor in the third quadrant keeps its sign', in: { m1: 3, t1: 200, s2: 1, m2: 0, t2: 0, s3: 1, m3: 0, t3: 0 }, out: { mag: 3, ang: -160 }, tol: 1e-9, warn: 'Only one phasor' },
      { name: 'negative magnitude rejected', in: { m1: -1, t1: 0, s2: 1, m2: 1, t2: 0, s3: 1, m3: 0, t3: 0 }, error: 'm1' }]),
  C('percentage-error', 'Percentage Error', '37 Engineering Mathematics', 'Compare a measured or calculated value with a true or reference value. Gives the error, the absolute error, the relative error and the percentage error, signed so you can see whether the reading is high or low.',
    ['percentage error', 'percent error', 'percentage error calculator', 'percent error calculator', 'measurement error', 'absolute error', 'relative error', 'error percentage', 'accuracy', 'meter error', 'reading error', 'test reading', 'calibration error', 'experimental error'],
    [I('m', 'Measured value', 'number', '', 98.5, { hint: 'The reading or calculated value you are checking. Use the same unit as the true value.' }),
      I('t', 'True (reference) value', 'number', '', 100, { hint: 'The accepted, rated or reference value. It cannot be zero, because the error is expressed as a share of it.' })],
    [{ key: 'pe', label: 'Percentage error (signed, %)', dim: 'number', unit: '', prec: 4 }, { key: 'ape', label: 'Absolute percentage error (%)', dim: 'number', unit: '', prec: 4 }, { key: 'err', label: 'Error (measured − true)', dim: 'number', unit: '', prec: 6 },
      { key: 'aerr', label: 'Absolute error', dim: 'number', unit: '', prec: 6 }, { key: 'rel', label: 'Relative error (fraction)', dim: 'number', unit: '', prec: 6 }],
    'Error = measured − true     Absolute error = |measured − true|     Relative error = (measured − true) / |true|     Percentage error = relative error × 100',
    ['Percentage error is taken relative to the true (reference) value, not the measured one', 'A negative percentage error means the measured value is below the true value; a positive one means it is above', 'Both values are plain numbers in one consistent unit; the percentage does not depend on the unit', 'The true value must not be zero'],
    'Use the absolute percentage error when only the size of the error matters, such as checking a meter against a tolerance. Percentage error is not the same as percentage difference, which compares two values with neither one a reference. For the uncertainty of a measurement chain see the measurement uncertainty guide.',
    ['complex-number', 'phasor-sum', 'ohms-law', 'rms-peak'],
    (i) => {
      const err = i.m - i.t, aerr = Math.abs(err), rel = err / Math.abs(i.t), pe = rel * 100, ape = Math.abs(pe), w = [];
      if (aerr > Math.abs(i.t)) w.push('The error is larger than the true value itself. Check that the true (reference) value is the one you meant.');
      return { out: { pe, ape, err, aerr, rel }, warnings: w,
        steps: [`Error = measured − true = ${fmt(i.m, 6)} − ${fmt(i.t, 6)} = ${fmt(err, 6)}`, `Absolute error = |${fmt(err, 6)}| = ${fmt(aerr, 6)}`, `Relative error = error / |true| = ${fmt(err, 6)} / ${fmt(Math.abs(i.t), 6)} = ${fmt(rel, 6)}`, `Percentage error = ${fmt(rel, 6)} × 100 = ${fmt(pe, 4)}%`],
        sentence: `A reading of ${fmt(i.m, 6)} against a true value of ${fmt(i.t, 6)} is ${fmt(ape, 4)}% ${err < 0 ? 'low' : err > 0 ? 'high' : 'off (no error)'}.` };
    },
    (v) => (v.t === 0 ? [{ key: 't', msg: 'The true value cannot be zero, because the error is expressed as a share of it' }] : []),
    [{ name: '98.5 against 100 is −1.5%', in: { m: 98.5, t: 100 }, out: { pe: -1.5, ape: 1.5, err: -1.5, aerr: 1.5, rel: -0.015 }, tol: 1e-9 },
      { name: '105 against 100 is +5%', in: { m: 105, t: 100 }, out: { pe: 5, ape: 5, err: 5, rel: 0.05 }, tol: 1e-9 },
      { name: 'voltmeter 229.2 V against 230 V', in: { m: 229.2, t: 230 }, out: { pe: -0.347826087, err: -0.8 }, tol: 1e-6 },
      { name: 'g measured 9.81 against 9.80665', in: { m: 9.81, t: 9.80665 }, out: { pe: 0.0341604931, aerr: 0.00335 }, tol: 1e-8 },
      { name: 'equal values give zero error', in: { m: 42.5, t: 42.5 }, out: { pe: 0, ape: 0, err: 0 }, tol: 1e-12 },
      { name: 'negative true value: −9 against −10 reads high by 10%', in: { m: -9, t: -10 }, out: { pe: 10, err: 1 }, tol: 1e-9 },
      { name: 'error larger than the true value warns', in: { m: 250, t: 100 }, out: { pe: 150 }, tol: 1e-9, warn: 'larger than the true value' },
      { name: 'zero true value rejected', in: { m: 5, t: 0 }, error: 't' }]),
  C('mean-median-mode', 'Mean, Median and Mode', '37 Engineering Mathematics', 'Enter up to 12 readings and get the mean (average), median, mode, range, smallest and largest value and the sum. Blank boxes are ignored, so you can use as few as one reading.',
    ['mean median mode', 'mean median and mode calculator', 'average calculator', 'mean calculator', 'median calculator', 'mode calculator', 'average of readings', 'arithmetic mean', 'data range', 'range of data', 'test readings', 'measurement readings'],
    [I('x1', 'Reading 1', 'number', '', 230.1, { hint: 'Enter the readings in any order, in one consistent unit. At least one reading is needed; blank boxes are ignored.' }),
      I('x2', 'Reading 2', 'number', '', 229.8, { optional: true }), I('x3', 'Reading 3', 'number', '', 230.4, { optional: true }), I('x4', 'Reading 4', 'number', '', 229.8, { optional: true }),
      I('x5', 'Reading 5', 'number', '', 231, { optional: true }), I('x6', 'Reading 6', 'number', '', 230.2, { optional: true }), I('x7', 'Reading 7', 'number', '', '', { optional: true }),
      I('x8', 'Reading 8', 'number', '', '', { optional: true }), I('x9', 'Reading 9', 'number', '', '', { optional: true }), I('x10', 'Reading 10', 'number', '', '', { optional: true }),
      I('x11', 'Reading 11', 'number', '', '', { optional: true }), I('x12', 'Reading 12', 'number', '', '', { optional: true })],
    [{ key: 'mean', label: 'Mean (average)', dim: 'number', unit: '', prec: 6 }, { key: 'median', label: 'Median', dim: 'number', unit: '', prec: 6 }, { key: 'mode', label: 'Mode (smallest, if several)', dim: 'number', unit: '', prec: 6 },
      { key: 'n', label: 'Number of readings', dim: 'number', unit: '', prec: 0 }, { key: 'sum', label: 'Sum', dim: 'number', unit: '', prec: 6 }, { key: 'min', label: 'Smallest reading', dim: 'number', unit: '', prec: 6 },
      { key: 'max', label: 'Largest reading', dim: 'number', unit: '', prec: 6 }, { key: 'range', label: 'Range (largest − smallest)', dim: 'number', unit: '', prec: 6 }],
    'Mean = (x₁ + x₂ + … + xₙ) / n     Median = middle value of the sorted readings (average of the two middle values when n is even)     Mode = the value that occurs most often     Range = largest − smallest',
    ['Every reading counts equally; the calculator does not weight or discard any value', 'The readings share one unit, and the results have the same unit', 'A mode exists only when some value occurs more than once. When several values tie, the smallest is shown and all of them are listed in the warning', 'Values that differ in the last digit are different values, so 230.1 and 230.10 are the same but 230.1 and 230.11 are not'],
    'The mean uses every reading, so one bad reading moves it; the median does not. When the two differ a lot, look for an outlier or a drifting reading. For the spread of the readings use the standard deviation calculator, and for how far the mean is from a known true value use the percentage error calculator.',
    ['standard-deviation', 'percentage-error', 'rms-peak', 'complex-number'],
    (i) => {
      const xs = []; for (let k = 1; k <= 12; k++) if (i['x' + k] != null) xs.push(i['x' + k]);
      const n = xs.length, s = xs.slice().sort((a, b) => a - b), sum = xs.reduce((a, b) => a + b, 0), mean = sum / n, w = [];
      const median = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2, mn = s[0], mx = s[n - 1];
      const cnt = new Map(); s.forEach((x) => cnt.set(x, (cnt.get(x) || 0) + 1));
      let top = 1; cnt.forEach((c) => { if (c > top) top = c; });
      const modes = top > 1 ? Array.from(cnt.keys()).filter((x) => cnt.get(x) === top) : [], mode = modes.length ? modes[0] : NaN;
      if (!modes.length) w.push('No value occurs more than once, so there is no mode. It is shown as a dash.');
      else if (modes.length > 1) w.push('There are ' + modes.length + ' modes (' + modes.map((x) => fmt(x, 6)).join(', ') + '), each occurring ' + top + ' times. The smallest is shown.');
      if (n === 1) w.push('Only one reading was entered, so the mean, median and range say nothing about spread.');
      return { out: { mean, median, mode, n, sum, min: mn, max: mx, range: mx - mn }, warnings: w,
        steps: [`Sorted readings: ${s.map((x) => fmt(x, 6)).join(', ')}  (n = ${n})`, `Sum = ${fmt(sum, 6)}     Mean = sum / n = ${fmt(sum, 6)} / ${n} = ${fmt(mean, 6)}`,
          n % 2 ? `Median = middle value (position ${(n + 1) / 2}) = ${fmt(median, 6)}` : `Median = average of the middle two values (positions ${n / 2} and ${n / 2 + 1}) = (${fmt(s[n / 2 - 1], 6)} + ${fmt(s[n / 2], 6)}) / 2 = ${fmt(median, 6)}`,
          modes.length ? `Mode = ${modes.map((x) => fmt(x, 6)).join(' and ')} (occurs ${top} times)` : 'Mode: no value is repeated', `Range = largest − smallest = ${fmt(mx, 6)} − ${fmt(mn, 6)} = ${fmt(mx - mn, 6)}`],
        sentence: `The ${n} reading${n === 1 ? ' has' : 's have'} a mean of ${fmt(mean, 6)} and a median of ${fmt(median, 6)}, and span a range of ${fmt(mx - mn, 6)}.` };
    },
    [{ name: 'default readings: mean 230.2167, median 230.15, mode 229.8', in: { x1: 230.1, x2: 229.8, x3: 230.4, x4: 229.8, x5: 231, x6: 230.2 }, out: { mean: 230.216666667, median: 230.15, mode: 229.8, n: 6, range: 1.2 }, tol: 1e-6 },
      { name: '2, 4, 4, 6, 9: odd count, median is the middle value', in: { x1: 2, x2: 4, x3: 4, x4: 6, x5: 9, x6: '', x7: '', x8: '', x9: '', x10: '', x11: '', x12: '' }, out: { mean: 5, median: 4, mode: 4, n: 5, sum: 25, min: 2, max: 9, range: 7 }, tol: 1e-9 },
      { name: 'even count averages the two middle values', in: { x1: 1, x2: 2, x3: 3, x4: 10, x5: '', x6: '', x7: '', x8: '', x9: '', x10: '', x11: '', x12: '' }, out: { mean: 4, median: 2.5 }, tol: 1e-9 },
      { name: 'no repeated value: no mode', in: { x1: 1, x2: 2, x3: 3, x4: '', x5: '', x6: '', x7: '', x8: '', x9: '', x10: '', x11: '', x12: '' }, out: { mean: 2, median: 2 }, tol: 1e-9, warn: 'no mode' },
      { name: 'two modes: smallest shown and both listed', in: { x1: 1, x2: 1, x3: 5, x4: 5, x5: 9, x6: '', x7: '', x8: '', x9: '', x10: '', x11: '', x12: '' }, out: { mode: 1 }, tol: 1e-9, warn: '2 modes' },
      { name: 'one reading: spread is meaningless', in: { x1: 7, x2: '', x3: '', x4: '', x5: '', x6: '', x7: '', x8: '', x9: '', x10: '', x11: '', x12: '' }, out: { mean: 7, median: 7, range: 0, n: 1 }, tol: 1e-9, warn: 'Only one reading' },
      { name: 'negative readings', in: { x1: -3, x2: -1, x3: 4, x4: '', x5: '', x6: '', x7: '', x8: '', x9: '', x10: '', x11: '', x12: '' }, out: { mean: 0, median: -1, min: -3, max: 4, range: 7 }, tol: 1e-9 },
      { name: 'first reading cannot be blank', in: { x1: '', x2: 5 }, error: 'x1' }]),
  C('standard-deviation', 'Standard Deviation and Variance', '37 Engineering Mathematics', 'Enter up to 12 readings and get the sample and population standard deviation and variance, the mean, the standard error of the mean and the coefficient of variation. Blank boxes are ignored.',
    ['standard deviation', 'standard deviation calculator', 'variance', 'variance calculator', 'sample standard deviation', 'population standard deviation', 'sample variance', 'population variance', 'standard error', 'coefficient of variation', 'spread of readings', 'repeatability', 'measurement scatter'],
    [I('x1', 'Reading 1', 'number', '', 230.1, { hint: 'Enter the readings in any order, in one consistent unit. At least two readings are needed for a sample standard deviation; blank boxes are ignored.' }),
      I('x2', 'Reading 2', 'number', '', 229.8, { optional: true }), I('x3', 'Reading 3', 'number', '', 230.4, { optional: true }), I('x4', 'Reading 4', 'number', '', 229.8, { optional: true }),
      I('x5', 'Reading 5', 'number', '', 231, { optional: true }), I('x6', 'Reading 6', 'number', '', 230.2, { optional: true }), I('x7', 'Reading 7', 'number', '', '', { optional: true }),
      I('x8', 'Reading 8', 'number', '', '', { optional: true }), I('x9', 'Reading 9', 'number', '', '', { optional: true }), I('x10', 'Reading 10', 'number', '', '', { optional: true }),
      I('x11', 'Reading 11', 'number', '', '', { optional: true }), I('x12', 'Reading 12', 'number', '', '', { optional: true })],
    [{ key: 'ssd', label: 'Sample standard deviation (s, n − 1)', dim: 'number', unit: '', prec: 6 }, { key: 'psd', label: 'Population standard deviation (σ, n)', dim: 'number', unit: '', prec: 6 },
      { key: 'svar', label: 'Sample variance (s²)', dim: 'number', unit: '', prec: 6 }, { key: 'pvar', label: 'Population variance (σ²)', dim: 'number', unit: '', prec: 6 },
      { key: 'mean', label: 'Mean', dim: 'number', unit: '', prec: 6 }, { key: 'n', label: 'Number of readings', dim: 'number', unit: '', prec: 0 },
      { key: 'sem', label: 'Standard error of the mean (s / √n)', dim: 'number', unit: '', prec: 6 }, { key: 'cv', label: 'Coefficient of variation (s / |mean|, %)', dim: 'number', unit: '', prec: 4 }],
    'Mean x̄ = Σx / n     Population variance σ² = Σ(x − x̄)² / n     Sample variance s² = Σ(x − x̄)² / (n − 1)     Standard deviation = √variance     Standard error = s / √n     CV = s / |x̄| × 100',
    ['Use the sample standard deviation (n − 1) when the readings are a sample of a larger set, which is the usual case for test readings; use the population value only when the readings are the whole set', 'The deviations are taken from the mean of the readings entered', 'The sample values need at least two readings; with one reading they are shown as a dash', 'The coefficient of variation is not defined when the mean is zero', 'No distribution is assumed: these are descriptive figures, not a confidence interval'],
    'A small standard deviation means the readings are close together, which is repeatability; it does not mean they are correct, since a consistent offset from the true value gives a small spread and a large error. For the offset use the percentage error calculator. For the mean, median and range see the mean, median and mode calculator.',
    ['mean-median-mode', 'percentage-error', 'rms-peak', 'complex-number'],
    (i) => {
      const xs = []; for (let k = 1; k <= 12; k++) if (i['x' + k] != null) xs.push(i['x' + k]);
      const n = xs.length, mean = xs.reduce((a, b) => a + b, 0) / n, ss = xs.reduce((a, x) => a + (x - mean) * (x - mean), 0), w = [];
      const pvar = ss / n, psd = Math.sqrt(pvar), svar = n > 1 ? ss / (n - 1) : NaN, ssd = Math.sqrt(svar), sem = ssd / Math.sqrt(n), cv = mean === 0 ? NaN : ssd / Math.abs(mean) * 100;
      if (n === 1) w.push('Only one reading was entered. The sample variance and standard deviation need at least two and are shown as a dash; the population values are 0.');
      else if (mean === 0) w.push('The mean is zero, so the coefficient of variation is not defined and is shown as a dash.');
      return { out: { ssd, psd, svar, pvar, mean, n, sem, cv }, warnings: w,
        steps: [`Mean = ${fmt(mean, 6)} from n = ${n} reading${n === 1 ? '' : 's'}`, `Sum of squared deviations Σ(x − x̄)² = ${fmt(ss, 6)}`, `Population variance = ${fmt(ss, 6)} / ${n} = ${fmt(pvar, 6)}, so σ = ${fmt(psd, 6)}`,
          n > 1 ? `Sample variance = ${fmt(ss, 6)} / ${n - 1} = ${fmt(svar, 6)}, so s = ${fmt(ssd, 6)}` : 'Sample variance: needs at least two readings', n > 1 ? `Standard error = s / √n = ${fmt(ssd, 6)} / ${fmt(Math.sqrt(n), 6)} = ${fmt(sem, 6)}` : 'Standard error: needs at least two readings'],
        sentence: n > 1 ? `The ${n} readings have a mean of ${fmt(mean, 6)}, a sample standard deviation of ${fmt(ssd, 6)} and a population standard deviation of ${fmt(psd, 6)}.` : `One reading of ${fmt(mean, 6)} has no spread to measure.` };
    },
    [{ name: 'default readings: mean 230.2167, s 0.4491', in: { x1: 230.1, x2: 229.8, x3: 230.4, x4: 229.8, x5: 231, x6: 230.2 }, out: { mean: 230.216666667, n: 6, pvar: 0.1680555556, svar: 0.2016666667 }, tol: 1e-6 },
      { name: 'classic data set 2, 4, 4, 4, 5, 5, 7, 9: population σ = 2', in: { x1: 2, x2: 4, x3: 4, x4: 4, x5: 5, x6: 5, x7: 7, x8: 9, x9: '', x10: '', x11: '', x12: '' }, out: { mean: 5, psd: 2, pvar: 4, svar: 4.571428571, ssd: 2.138089935 }, tol: 1e-8 },
      { name: 'two readings 10 and 12: s = √2', in: { x1: 10, x2: 12, x3: '', x4: '', x5: '', x6: '', x7: '', x8: '', x9: '', x10: '', x11: '', x12: '' }, out: { svar: 2, ssd: 1.414213562, pvar: 1, psd: 1, sem: 1, cv: 12.8564869307 }, tol: 1e-8 },
      { name: 'identical readings have zero spread', in: { x1: 5, x2: 5, x3: 5, x4: '', x5: '', x6: '', x7: '', x8: '', x9: '', x10: '', x11: '', x12: '' }, out: { ssd: 0, psd: 0, svar: 0, cv: 0, sem: 0 }, tol: 1e-12 },
      { name: 'one reading: sample values undefined', in: { x1: 7, x2: '', x3: '', x4: '', x5: '', x6: '', x7: '', x8: '', x9: '', x10: '', x11: '', x12: '' }, out: { mean: 7, psd: 0, pvar: 0, n: 1 }, tol: 1e-12, warn: 'Only one reading' },
      { name: 'zero mean: coefficient of variation undefined', in: { x1: -1, x2: 1, x3: '', x4: '', x5: '', x6: '', x7: '', x8: '', x9: '', x10: '', x11: '', x12: '' }, out: { mean: 0, svar: 2 }, tol: 1e-9, warn: 'mean is zero' },
      { name: 'negative readings', in: { x1: -2, x2: -4, x3: -6, x4: '', x5: '', x6: '', x7: '', x8: '', x9: '', x10: '', x11: '', x12: '' }, out: { mean: -4, svar: 4, ssd: 2, cv: 50 }, tol: 1e-9 },
      { name: 'first reading cannot be blank', in: { x1: '', x2: 5 }, error: 'x1' }]),
  C('quadratic-solver', 'Quadratic Equation Solver', '37 Engineering Mathematics', 'Solve ax² + bx + c = 0. Gives both roots (real or complex), the discriminant and the vertex of the parabola, with the working. Uses a form of the formula that stays accurate when b is much larger than a and c.',
    ['quadratic equation', 'quadratic equation solver', 'quadratic formula', 'quadratic formula calculator', 'quadratic solver', 'solve quadratic', 'roots of quadratic', 'discriminant', 'discriminant calculator', 'complex roots', 'second order equation', 'parabola vertex'],
    [I('a', 'Coefficient a (of x²)', 'number', '', 1, { hint: 'Cannot be zero; if it is, the equation is linear and has one root, −c / b.' }), I('b', 'Coefficient b (of x)', 'number', '', -5), I('c', 'Constant c', 'number', '', 6)],
    [{ key: 'x1', label: 'Root x₁, real part (with +√D)', dim: 'number', unit: '', prec: 8 }, { key: 'x1i', label: 'Root x₁, imaginary part', dim: 'number', unit: '', prec: 8 },
      { key: 'x2', label: 'Root x₂, real part (with −√D)', dim: 'number', unit: '', prec: 8 }, { key: 'x2i', label: 'Root x₂, imaginary part', dim: 'number', unit: '', prec: 8 },
      { key: 'disc', label: 'Discriminant D = b² − 4ac', dim: 'number', unit: '', prec: 8 }, { key: 'xv', label: 'Vertex x (−b / 2a)', dim: 'number', unit: '', prec: 8 }, { key: 'yv', label: 'Vertex y (value at the vertex)', dim: 'number', unit: '', prec: 8 }],
    'x = (−b ± √D) / 2a     D = b² − 4ac     D > 0: two real roots     D = 0: one repeated root     D < 0: two complex roots, −b / 2a ± j√(−D) / 2a     x₁ + x₂ = −b / a     x₁ × x₂ = c / a',
    ['The coefficients are plain real numbers', 'x₁ is the root taken with +√D and x₂ with −√D, so for a negative a the larger root is x₂', 'For real roots the smaller-magnitude root is found from x₁ × x₂ = c / a, which avoids losing digits to cancellation', 'A negative discriminant gives a complex-conjugate pair; the imaginary parts are shown with their signs', 'The vertex is the turning point of y = ax² + bx + c'],
    'Quadratics appear when a circuit or a motor equation is squared away: the resonance and damping of a series RLC circuit, the voltage that gives a stated power through a source resistance, and the cable size that meets a limit when current depends on size. Check a root by substituting it back. For complex numbers use the complex number calculator.',
    ['complex-number', 'impedance-rlc', 'trig-functions', 'logarithm'],
    (i) => {
      const a = i.a, b = i.b, c = i.c, D = b * b - 4 * a * c, xv = -b / (2 * a), yv = c - b * b / (4 * a), w = [];
      let x1, x2, x1i = 0, x2i = 0, st;
      if (D >= 0) {
        const s = Math.sqrt(D), q = -(b + (b >= 0 ? s : -s)) / 2, ra = q === 0 ? 0 : q / a, rb = q === 0 ? 0 : c / q;
        x1 = a > 0 ? Math.max(ra, rb) : Math.min(ra, rb); x2 = a > 0 ? Math.min(ra, rb) : Math.max(ra, rb);
        st = [`D = b² − 4ac = ${fmt(b, 6)}² − 4 × ${fmt(a, 6)} × ${fmt(c, 6)} = ${fmt(D, 8)}`, D === 0 ? `D = 0: one repeated root, x = −b / 2a = ${fmt(x1, 8)}` : `D > 0: two real roots, x = (−b ± √D) / 2a, √D = ${fmt(s, 8)}`, `x₁ = ${fmt(x1, 8)}     x₂ = ${fmt(x2, 8)}`];
        if (D === 0) w.push('The discriminant is zero: the two roots are equal (a repeated root, and the vertex lies on the x axis).');
      } else {
        x1 = x2 = xv; x1i = Math.sqrt(-D) / (2 * a); x2i = -x1i;
        st = [`D = b² − 4ac = ${fmt(b, 6)}² − 4 × ${fmt(a, 6)} × ${fmt(c, 6)} = ${fmt(D, 8)}`, `D < 0: no real roots; the roots are complex conjugates, −b / 2a ± j√(−D) / 2a`, `x₁ = ${fmt(x1, 8)} ${x1i < 0 ? '−' : '+'} j${fmt(Math.abs(x1i), 8)}     x₂ = ${fmt(x2, 8)} ${x2i < 0 ? '−' : '+'} j${fmt(Math.abs(x2i), 8)}`];
        w.push('The discriminant is negative, so there are no real roots. The roots are a complex-conjugate pair; the parabola does not cross the x axis.');
      }
      st.push(`Vertex: x = −b / 2a = ${fmt(xv, 8)}, y = ${fmt(yv, 8)}`);
      return { out: { x1, x1i, x2, x2i, disc: D, xv, yv }, warnings: w, steps: st,
        sentence: D < 0 ? `${fmt(a, 6)}x² + ${fmt(b, 6)}x + ${fmt(c, 6)} = 0 has no real roots; they are ${fmt(x1, 6)} ± j${fmt(Math.abs(x1i), 6)}.` : D === 0 ? `${fmt(a, 6)}x² + ${fmt(b, 6)}x + ${fmt(c, 6)} = 0 has one repeated root, x = ${fmt(x1, 6)}.` : `${fmt(a, 6)}x² + ${fmt(b, 6)}x + ${fmt(c, 6)} = 0 has the real roots ${fmt(x1, 6)} and ${fmt(x2, 6)}.` };
    },
    (v) => (v.a === 0 ? [{ key: 'a', msg: 'Coefficient a cannot be zero; with a = 0 the equation is linear, x = −c / b' }] : []),
    [{ name: 'x² − 5x + 6 = 0 gives 3 and 2', in: { a: 1, b: -5, c: 6 }, out: { x1: 3, x2: 2, disc: 1, xv: 2.5, yv: -0.25 }, tol: 1e-9 },
      { name: 'x² + 2x + 5 = 0 gives −1 ± 2j', in: { a: 1, b: 2, c: 5 }, out: { x1: -1, x1i: 2, x2: -1, x2i: -2, disc: -16 }, tol: 1e-9, warn: 'no real roots' },
      { name: 'x² − 2x + 1 = 0 is a repeated root', in: { a: 1, b: -2, c: 1 }, out: { x1: 1, x2: 1, xv: 1 }, tol: 1e-9, warn: 'zero' },
      { name: 'negative a: −x² + 4 = 0, x₁ is the root with +√D', in: { a: -1, b: 0, c: 4 }, out: { x1: -2, x2: 2, disc: 16, yv: 4 }, tol: 1e-9 },
      { name: 'b much larger than a and c keeps the small root', in: { a: 1, b: 1e8, c: 1 }, out: { x1: -1e-8, x2: -1e8 }, tol: 1e-6 },
      { name: '2x² − 4x − 6 = 0 gives 3 and −1', in: { a: 2, b: -4, c: -6 }, out: { x1: 3, x2: -1, disc: 64, xv: 1, yv: -8 }, tol: 1e-9 },
      { name: 'c = 0: x² + 3x = 0 gives 0 and −3', in: { a: 1, b: 3, c: 0 }, out: { x2: -3, disc: 9 }, tol: 1e-9 },
      { name: 'a = 0 rejected', in: { a: 0, b: 2, c: 1 }, error: 'a' }]),
  C('logarithm', 'Logarithm Calculator', '37 Engineering Mathematics', 'Find the logarithm of a number to any base, together with its common (base 10), natural (base e) and binary (base 2) logarithms, with the working.',
    ['logarithm', 'logarithm calculator', 'log calculator', 'log base 10', 'log10', 'natural log', 'ln calculator', 'log base 2', 'log2', 'log any base', 'change of base', 'decibel logarithm', 'antilog'],
    [I('x', 'Number x', 'number', '', 1000, { min: 0, exMin: true, hint: 'Must be greater than zero. The logarithm of zero or a negative number is not a real number.' }),
      I('b', 'Base b', 'number', '', 10, { min: 0, exMin: true, hint: 'Greater than zero and not 1. Use 10 for the common logarithm, 2.718281828 for the natural logarithm, 2 for the binary logarithm.' })],
    [{ key: 'lb', label: 'log base b of x', dim: 'number', unit: '', prec: 8 }, { key: 'l10', label: 'Common logarithm log₁₀ x', dim: 'number', unit: '', prec: 8 }, { key: 'ln', label: 'Natural logarithm ln x', dim: 'number', unit: '', prec: 8 }, { key: 'l2', label: 'Binary logarithm log₂ x', dim: 'number', unit: '', prec: 8 }],
    'log_b x = y means b^y = x     log_b x = ln x / ln b     log(xy) = log x + log y     log(x / y) = log x − log y     log(xⁿ) = n log x',
    ['x must be greater than zero and the base greater than zero and not equal to 1', 'The base for the first result is whatever you enter; the other three results are always base 10, base e and base 2', 'A base of exactly 10 or 2 uses the exact logarithm, so log₁₀ 1000 is 3 and not 2.9999999999999996', 'Decibels are 10 log₁₀ of a power ratio and 20 log₁₀ of a voltage or current ratio'],
    'Use the common logarithm for decibels, orders of magnitude and the pH scale, the natural logarithm for exponential growth and decay and time constants, and base 2 for bits and binary steps. To go back from a logarithm to the number use the exponent calculator with the base and the logarithm as the power. For a ratio in decibels see the dB to ratio converter.',
    ['powers-roots', 'quadratic-solver', 'trig-functions', 'rms-peak'],
    (i) => {
      const x = i.x, b = i.b, ln = Math.log(x), l10 = Math.log10(x), l2 = Math.log2(x), lb = b === 10 ? l10 : b === 2 ? l2 : ln / Math.log(b), w = [];
      return { out: { lb, l10, ln, l2 }, warnings: w,
        steps: [`log base ${fmt(b, 8)} of ${fmt(x, 8)} = ln x / ln b = ${fmt(ln, 8)} / ${fmt(Math.log(b), 8)} = ${fmt(lb, 8)}`, `Check: ${fmt(b, 8)} ^ ${fmt(lb, 8)} = ${fmt(Math.pow(b, lb), 8)}`, `Common log = ${fmt(l10, 8)}     Natural log = ${fmt(ln, 8)}     Binary log = ${fmt(l2, 8)}`],
        sentence: `log base ${fmt(b, 6)} of ${fmt(x, 6)} is ${fmt(lb, 6)}; the common logarithm is ${fmt(l10, 6)} and the natural logarithm is ${fmt(ln, 6)}.` };
    },
    (v) => (v.b === 1 ? [{ key: 'b', msg: 'The base cannot be 1, because 1 raised to any power is 1' }] : []),
    [{ name: 'log₁₀ 1000 = 3', in: { x: 1000, b: 10 }, out: { lb: 3, l10: 3, ln: 6.907755279, l2: 9.965784285 }, tol: 1e-8 },
      { name: 'log₂ 8 = 3', in: { x: 8, b: 2 }, out: { lb: 3, l2: 3, l10: 0.903089987 }, tol: 1e-8 },
      { name: 'ln e = 1 (base e)', in: { x: 2.718281828459045, b: 2.718281828459045 }, out: { lb: 1, ln: 1 }, tol: 1e-9 },
      { name: 'log base 5 of 125 = 3', in: { x: 125, b: 5 }, out: { lb: 3 }, tol: 1e-9 },
      { name: 'a number below 1 has a negative log: log₁₀ 0.001 = −3', in: { x: 0.001, b: 10 }, out: { lb: -3, l10: -3 }, tol: 1e-9 },
      { name: 'power ratio 100 is 20 dB: 10 log₁₀ 100', in: { x: 100, b: 10 }, out: { l10: 2 }, tol: 1e-12 },
      { name: 'x = 0 rejected', in: { x: 0, b: 10 }, error: 'x' },
      { name: 'negative x rejected', in: { x: -5, b: 10 }, error: 'x' },
      { name: 'base 1 rejected', in: { x: 10, b: 1 }, error: 'b' },
      { name: 'base 0 rejected', in: { x: 10, b: 0 }, error: 'b' }]),
  C('powers-roots', 'Exponent and Root Calculator', '37 Engineering Mathematics', 'Raise a number to any power and take its square, cube or nth root. A negative base needs a whole-number exponent, and an even root of a negative number is rejected rather than returned as a wrong real answer.',
    ['exponent calculator', 'exponents', 'power calculator', 'powers', 'x to the power of n', 'root calculator', 'nth root', 'square root calculator', 'cube root calculator', 'fourth root', 'radical calculator', 'raise to a power'],
    [I('x', 'Number x', 'number', '', 8, { hint: 'The base for the power and the number under the root.' }), I('n', 'Exponent n', 'number', '', 2, { hint: 'Any number, positive, negative or a fraction. A negative base needs a whole-number exponent.' }),
      I('k', 'Root degree k', 'number', '', 3, { min: 1, max: 1000, hint: 'A whole number from 1 to 1000: 2 for a square root, 3 for a cube root. Even roots need x of zero or more.' })],
    [{ key: 'pow', label: 'x to the power n (xⁿ)', dim: 'number', unit: '', prec: 10 }, { key: 'root', label: 'k-th root of x', dim: 'number', unit: '', prec: 10 }, { key: 'sq', label: 'x squared', dim: 'number', unit: '', prec: 10 }, { key: 'cube', label: 'x cubed', dim: 'number', unit: '', prec: 10 }, { key: 'rec', label: 'Reciprocal 1 / x', dim: 'number', unit: '', prec: 10 }],
    'xⁿ = x × x × … (n times) for a whole n     x⁻ⁿ = 1 / xⁿ     x^(1/k) = k-th root of x     x^(m/k) = (k-th root of x)^m     xᵃ × xᵇ = xᵃ⁺ᵇ     (xᵃ)ᵇ = xᵃᵇ',
    ['Real numbers only: no complex result is returned', 'A negative base is allowed only with a whole-number exponent, and zero cannot be raised to a negative power', 'An odd root of a negative number is negative (the cube root of −8 is −2); an even root of a negative number is rejected', 'Zero to the power zero is taken as 1', 'The reciprocal is not defined for x = 0 and is shown as a dash'],
    'Use this for square-law relations (power is current squared times resistance), for scaling laws such as the cube root in a transformer or fan relation, and for compound growth. The nth root of x is the same as x to the power 1/n. For the inverse of a power use the logarithm calculator: if xⁿ = y then n = log y / log x.',
    ['logarithm', 'quadratic-solver', 'trig-functions', 'rms-peak'],
    (i) => {
      const x = i.x, n = i.n, k = i.k, w = [], pow = Math.pow(x, n);
      const root = x < 0 ? -Math.pow(-x, 1 / k) : k === 2 ? Math.sqrt(x) : k === 3 ? Math.cbrt(x) : Math.pow(x, 1 / k), rec = x === 0 ? NaN : 1 / x;
      if (x === 0 && n === 0) w.push('Zero to the power zero is not defined in general. It is taken as 1 here, the usual convention.');
      if (x === 0) w.push('The reciprocal of zero is not defined and is shown as a dash.');
      return { out: { pow, root, sq: x * x, cube: x * x * x, rec }, warnings: w,
        steps: [`x ^ n = ${fmt(x, 8)} ^ ${fmt(n, 8)} = ${fmt(pow, 10)}`, `k-th root: x ^ (1/${fmt(k, 0)}) = ${fmt(root, 10)}${x < 0 ? ' (odd root of a negative number)' : ''}`, `Check: (${fmt(root, 10)}) ^ ${fmt(k, 0)} = ${fmt(Math.pow(root, k), 8)}`, `x² = ${fmt(x * x, 10)}     x³ = ${fmt(x * x * x, 10)}${x === 0 ? '' : '     1 / x = ' + fmt(rec, 10)}`],
        sentence: `${fmt(x, 6)} to the power ${fmt(n, 6)} is ${fmt(pow, 8)}, and its ${fmt(k, 0)}${k === 2 ? 'nd' : k === 3 ? 'rd' : 'th'} root is ${fmt(root, 8)}.` };
    },
    (v) => {
      const e = [];
      if (v.k !== Math.floor(v.k)) e.push({ key: 'k', msg: 'The root degree must be a whole number' });
      else if (v.x < 0 && v.k % 2 === 0) e.push({ key: 'x', msg: 'An even root of a negative number is not a real number' });
      if (v.x < 0 && v.n !== Math.floor(v.n)) e.push({ key: 'n', msg: 'A negative base needs a whole-number exponent, because a fractional power of a negative number is not real' });
      if (v.x === 0 && v.n < 0) e.push({ key: 'n', msg: 'Zero cannot be raised to a negative power (it would be a division by zero)' });
      return e;
    },
    [{ name: '8 squared is 64, cube root 2', in: { x: 8, n: 2, k: 3 }, out: { pow: 64, root: 2, sq: 64, cube: 512, rec: 0.125 }, tol: 1e-9 },
      { name: '2 to the power 10 is 1024', in: { x: 2, n: 10, k: 2 }, out: { pow: 1024, root: 1.414213562 }, tol: 1e-8 },
      { name: 'negative exponent: 10 to the −3 is 0.001', in: { x: 10, n: -3, k: 2 }, out: { pow: 0.001 }, tol: 1e-9 },
      { name: 'fractional exponent: 16 to the 0.25 is 2', in: { x: 16, n: 0.25, k: 4 }, out: { pow: 2, root: 2 }, tol: 1e-9 },
      { name: 'cube root of −27 is −3', in: { x: -27, n: 3, k: 3 }, out: { pow: -19683, root: -3 }, tol: 1e-9 },
      { name: 'negative base, even whole exponent', in: { x: -3, n: 4, k: 1 }, out: { pow: 81, root: -3 }, tol: 1e-9 },
      { name: 'zero to the power zero is taken as 1 and warns', in: { x: 0, n: 0, k: 2 }, out: { pow: 1 }, tol: 1e-9, warn: 'taken as 1' },
      { name: 'even root of a negative number rejected', in: { x: -4, n: 2, k: 2 }, error: 'x' },
      { name: 'fractional power of a negative number rejected', in: { x: -4, n: 0.5, k: 3 }, error: 'n' },
      { name: 'zero to a negative power rejected', in: { x: 0, n: -1, k: 2 }, error: 'n' },
      { name: 'non-integer root degree rejected', in: { x: 8, n: 2, k: 2.5 }, error: 'k' }]),
  C('percentage-calculator', 'Percentage Calculator', '37 Engineering Mathematics', 'Five common percentage questions from two numbers: A% of B, A as a percentage of B, the percentage change from A to B, and B increased or decreased by A%.',
    ['percentage calculator', 'percent calculator', 'percentage of a number', 'what percent of', 'percentage change', 'percent change', 'percentage increase', 'percentage decrease', 'increase by percent', 'decrease by percent', 'percentage difference', 'percent of a value'],
    [I('A', 'Number A', 'number', '', 15, { hint: 'The percentage for "A% of B" and for the increase or decrease, and the starting value for "percentage change from A to B".' }), I('B', 'Number B', 'number', '', 200, { hint: 'The number the percentage is taken of, and the end value for "percentage change from A to B".' })],
    [{ key: 'pof', label: 'A% of B', dim: 'number', unit: '', prec: 8 }, { key: 'whatpct', label: 'A as a percentage of B (A / B × 100)', dim: 'number', unit: '', prec: 8 }, { key: 'chg', label: 'Percentage change from A to B', dim: 'number', unit: '', prec: 8 },
      { key: 'inc', label: 'B increased by A%', dim: 'number', unit: '', prec: 8 }, { key: 'dec', label: 'B decreased by A%', dim: 'number', unit: '', prec: 8 }],
    'A% of B = A × B / 100     A as a percentage of B = A / B × 100     Change from A to B = (B − A) / |A| × 100     B increased by A% = B × (1 + A / 100)     B decreased by A% = B × (1 − A / 100)',
    ['All five results are shown at once; read the one that answers your question', 'Percentage change is relative to the starting value A, so going from 80 to 100 is +25% but going from 100 to 80 is −20%', 'A percentage change from zero is not defined, and A as a percentage of zero is not defined; each is shown as a dash', 'Values are plain numbers, so use the same unit for A and B'],
    'For the error of a reading against a true value use the percentage error calculator, which divides by the reference value and tells you whether the reading is high or low. Percentage points are a different thing: a rise from 10% to 12% is 2 percentage points but a 20% increase. For a share between parts, see the ratio calculator.',
    ['percentage-error', 'ratio-calculator', 'mean-median-mode', 'rounding-sig-figs'],
    (i) => {
      const A = i.A, B = i.B, w = [], pof = A * B / 100, whatpct = B === 0 ? NaN : A / B * 100, chg = A === 0 ? NaN : (B - A) / Math.abs(A) * 100, inc = B * (1 + A / 100), dec = B * (1 - A / 100);
      if (B === 0) w.push('B is zero, so A as a percentage of B is not defined and is shown as a dash.');
      if (A === 0) w.push('A is zero, so the percentage change from A to B is not defined and is shown as a dash.');
      if (A > 100) w.push('A is above 100%, so decreasing B by A% gives a result of the opposite sign.');
      return { out: { pof, whatpct, chg, inc, dec }, warnings: w,
        steps: [`${fmt(A, 8)}% of ${fmt(B, 8)} = ${fmt(A, 8)} × ${fmt(B, 8)} / 100 = ${fmt(pof, 8)}`, B === 0 ? 'A as a percentage of B: B is zero, not defined' : `${fmt(A, 8)} as a percentage of ${fmt(B, 8)} = ${fmt(A, 8)} / ${fmt(B, 8)} × 100 = ${fmt(whatpct, 8)}%`,
          A === 0 ? 'Change from A to B: A is zero, not defined' : `Change from ${fmt(A, 8)} to ${fmt(B, 8)} = (${fmt(B, 8)} − ${fmt(A, 8)}) / |${fmt(A, 8)}| × 100 = ${fmt(chg, 8)}%`, `${fmt(B, 8)} increased by ${fmt(A, 8)}% = ${fmt(B, 8)} × (1 + ${fmt(A, 8)} / 100) = ${fmt(inc, 8)}`, `${fmt(B, 8)} decreased by ${fmt(A, 8)}% = ${fmt(B, 8)} × (1 − ${fmt(A, 8)} / 100) = ${fmt(dec, 8)}`],
        sentence: `${fmt(A, 6)}% of ${fmt(B, 6)} is ${fmt(pof, 6)}; ${fmt(B, 6)} increased by ${fmt(A, 6)}% is ${fmt(inc, 6)} and decreased by ${fmt(A, 6)}% is ${fmt(dec, 6)}.` };
    },
    [{ name: '15% of 200 is 30; 200 up 15% is 230, down 15% is 170', in: { A: 15, B: 200 }, out: { pof: 30, whatpct: 7.5, chg: 1233.333333333, inc: 230, dec: 170 }, tol: 1e-9 },
      { name: '80 to 100 is a 25% rise', in: { A: 80, B: 100 }, out: { chg: 25, whatpct: 80, pof: 80 }, tol: 1e-9 },
      { name: '100 to 80 is a 20% fall (the starting value is the base)', in: { A: 100, B: 80 }, out: { chg: -20, pof: 80 }, tol: 1e-9 },
      { name: 'negative starting value uses |A|', in: { A: -50, B: -25 }, out: { chg: 50 }, tol: 1e-9 },
      { name: 'B = 0: percentage of zero is not defined', in: { A: 5, B: 0 }, out: { pof: 0 }, tol: 1e-9, warn: 'B is zero' },
      { name: 'A = 0: change from zero is not defined', in: { A: 0, B: 40 }, out: { pof: 0, inc: 40, dec: 40 }, tol: 1e-9, warn: 'A is zero' },
      { name: 'A above 100% warns on the decrease', in: { A: 120, B: 100 }, out: { dec: -20, inc: 220 }, tol: 1e-9, warn: 'above 100%' },
      { name: 'decimals: 12.5% of 8 is 1', in: { A: 12.5, B: 8 }, out: { pof: 1, whatpct: 156.25 }, tol: 1e-9 }]),
  C('ratio-calculator', 'Ratio Calculator', '37 Engineering Mathematics', 'Simplify a ratio A : B, find each part as a share of the whole, and solve the proportion A : B = C : X for the missing value. Works for turns ratios, gear ratios, mix ratios and scaling.',
    ['ratio calculator', 'ratio', 'simplify ratio', 'ratio simplifier', 'proportion calculator', 'solve proportion', 'a to b ratio', 'equivalent ratio', 'ratio to percentage', 'turns ratio', 'scale ratio', 'cross multiplication'],
    [I('a', 'A', 'number', '', 12, { min: 0, exMin: true, hint: 'The first part of the ratio A : B. Must be greater than zero.' }), I('b', 'B', 'number', '', 18, { min: 0, exMin: true, hint: 'The second part of the ratio A : B. Must be greater than zero.' }),
      I('c', 'C (optional)', 'number', '', 5, { min: 0, exMin: true, optional: true, hint: 'To solve A : B = C : X for X, enter C. Leave blank to only simplify A : B.' })],
    [{ key: 'sa', label: 'Simplified ratio, first part', dim: 'number', unit: '', prec: 0 }, { key: 'sb', label: 'Simplified ratio, second part', dim: 'number', unit: '', prec: 0 }, { key: 'rab', label: 'A / B (ratio as a decimal)', dim: 'number', unit: '', prec: 8 },
      { key: 'pa', label: 'A as a share of A + B (%)', dim: 'number', unit: '', prec: 6 }, { key: 'pb', label: 'B as a share of A + B (%)', dim: 'number', unit: '', prec: 6 }, { key: 'x', label: 'X in A : B = C : X (X = B × C / A)', dim: 'number', unit: '', prec: 8 }],
    'A : B simplified = (A / g) : (B / g), where g is the greatest common divisor     Share of A = A / (A + B) × 100     A : B = C : X gives X = B × C / A',
    ['The simplified ratio is found only when A and B are whole numbers; for decimals multiply both by a power of ten first, such as 1.5 : 2.5 becomes 15 : 25', 'A and B must be greater than zero', 'The proportion assumes a direct (linear) relation; for an inverse proportion, where one quantity falls as the other rises, use X = A × B / C', 'Whole numbers above 9,007,199,254,740,991 are not held exactly and are not simplified'],
    'Use this for a transformer turns ratio, a gear or pulley ratio, a voltage divider split, a scale drawing or a mix. For a transformer the voltage ratio equals the turns ratio. To turn the share into a percentage change or a percentage of a total, use the percentage calculator.',
    ['percentage-calculator', 'quadratic-solver', 'powers-roots', 'rounding-sig-figs'],
    (i) => {
      const a = i.a, b = i.b, c = i.c, w = [], whole = Number.isInteger(a) && Number.isInteger(b) && a <= 9007199254740991 && b <= 9007199254740991;
      let sa = NaN, sb = NaN, g = NaN;
      if (whole) { let p = a, q = b; while (q) { const t = p % q; p = q; q = t; } g = p; sa = a / g; sb = b / g; } else w.push('A and B are not both whole numbers, so the simplified ratio is not shown (a dash). Multiply both by a power of ten to make them whole numbers.');
      const x = c == null ? NaN : b * c / a;
      return { out: { sa, sb, rab: a / b, pa: a / (a + b) * 100, pb: b / (a + b) * 100, x }, warnings: w,
        steps: [whole ? `Greatest common divisor of ${fmt(a, 0)} and ${fmt(b, 0)} = ${fmt(g, 0)}, so ${fmt(a, 0)} : ${fmt(b, 0)} = ${fmt(sa, 0)} : ${fmt(sb, 0)}` : 'Simplified ratio: A and B must be whole numbers', `A / B = ${fmt(a, 8)} / ${fmt(b, 8)} = ${fmt(a / b, 8)}`, `Shares: A = ${fmt(a / (a + b) * 100, 6)}%, B = ${fmt(b / (a + b) * 100, 6)}%`,
          c == null ? 'Proportion: enter C to solve A : B = C : X' : `X = B × C / A = ${fmt(b, 8)} × ${fmt(c, 8)} / ${fmt(a, 8)} = ${fmt(x, 8)}`],
        sentence: whole ? `${fmt(a, 0)} : ${fmt(b, 0)} simplifies to ${fmt(sa, 0)} : ${fmt(sb, 0)}${c == null ? '' : `, and ${fmt(a, 6)} : ${fmt(b, 6)} = ${fmt(c, 6)} : ${fmt(x, 6)}`}.` : `${fmt(a, 6)} : ${fmt(b, 6)} is a ratio of ${fmt(a / b, 6)}.` };
    },
    (v) => [],
    [{ name: '12 : 18 simplifies to 2 : 3; 12 : 18 = 5 : 7.5', in: { a: 12, b: 18, c: 5 }, out: { sa: 2, sb: 3, rab: 0.666666667, pa: 40, pb: 60, x: 7.5 }, tol: 1e-8 },
      { name: 'already simplest: 7 : 9', in: { a: 7, b: 9, c: '' }, out: { sa: 7, sb: 9 }, tol: 1e-12 },
      { name: 'equal parts: 5 : 5 is 1 : 1', in: { a: 5, b: 5, c: '' }, out: { sa: 1, sb: 1, rab: 1, pa: 50, pb: 50 }, tol: 1e-12 },
      { name: 'turns ratio 11000 : 415 and 230 turns on the primary side', in: { a: 11000, b: 415, c: 230 }, out: { sa: 2200, sb: 83, x: 8.677272727 }, tol: 1e-8 },
      { name: 'decimals are not simplified and warn', in: { a: 1.5, b: 2.5, c: 3 }, out: { rab: 0.6, x: 5 }, tol: 1e-9, warn: 'whole numbers' },
      { name: 'blank C leaves X as a dash', in: { a: 4, b: 6, c: '' }, out: { sa: 2, sb: 3 }, tol: 1e-12 },
      { name: 'A = 0 rejected', in: { a: 0, b: 6, c: '' }, error: 'a' },
      { name: 'negative B rejected', in: { a: 2, b: -6, c: '' }, error: 'b' }]),
  C('rounding-sig-figs', 'Rounding and Significant Figures', '37 Engineering Mathematics', 'Round a number to a chosen number of decimal places or significant figures. Also gives the value rounded up, rounded down and truncated to the same decimal places. Halves round away from zero, so 2.5 is 3 and 1.005 to two places is 1.01.',
    ['rounding calculator', 'round to decimal places', 'significant figures calculator', 'sig fig calculator', 'round to significant figures', 'round to nearest', 'round up', 'round down', 'truncate', 'round to 2 decimal places', 'round to nearest ten', 'decimal places'],
    [I('x', 'Number', 'number', '', 1234.5678, { min: -1e15, max: 1e15, hint: 'The value to round, up to 15 digits.' }), I('d', 'Decimal places', 'number', '', 2, { min: -6, max: 15, hint: 'A whole number from −6 to 15. Use 0 for the nearest whole number, 2 for hundredths, −1 for the nearest ten, −2 for the nearest hundred.' }),
      I('s', 'Significant figures', 'number', '', 3, { min: 1, max: 15, hint: 'A whole number from 1 to 15. Leading zeros are not significant: 0.00456 has three significant figures.' })],
    [{ key: 'rd', label: 'Rounded to the nearest (decimal places)', dim: 'number', unit: '', prec: 15 }, { key: 'up', label: 'Rounded up (toward +∞) to those places', dim: 'number', unit: '', prec: 15 }, { key: 'dn', label: 'Rounded down (toward −∞) to those places', dim: 'number', unit: '', prec: 15 },
      { key: 'tr', label: 'Truncated (toward zero) to those places', dim: 'number', unit: '', prec: 15 }, { key: 'rs', label: 'Rounded to significant figures', dim: 'number', unit: '', prec: 15 }],
    'Round to d places: look at the next digit; 5 or more rounds away from zero     Significant figures: the first non-zero digit is the first significant figure     Rounded up = ceiling, rounded down = floor, truncated = drop the digits     Rounding error = |rounded − original|',
    ['Halves round away from zero (2.5 gives 3 and −2.5 gives −3), the usual school and engineering rule, not the round-half-to-even rule some software uses', 'The number is rounded as written, so 1.005 to two places is 1.01 even though the nearest binary number is slightly below 1.005', 'Decimal places and significant figures are rounded separately from the original number, not one after the other', 'Rounded up and rounded down follow the number line, so −2.3 rounded up to a whole number is −2 and rounded down is −3', 'Rounding to significant figures can give a value with trailing zeros that are not shown, so 1,234.5678 to three figures is 1,230'],
    'Round only the final answer, not the steps in between, or the rounding errors add up. Quote a result to no more significant figures than the least precise input supports. For the effect of a reading error see the percentage error calculator, and for the spread of repeated readings see the standard deviation calculator.',
    ['percentage-calculator', 'percentage-error', 'standard-deviation', 'ratio-calculator'],
    (i) => {
      const x = i.x, d = i.d, s = i.s, ex = (v) => (String(v).indexOf('e') >= 0);
      const sh = (v, k, f) => (ex(v) || ex(Math.abs(v)) ? f(v * Math.pow(10, k)) / Math.pow(10, k) : Number(f(Number(String(v) + 'e' + k)) + 'e' + (-k)));
      const away = (v) => (v < 0 ? -Math.round(-v) : Math.round(v)), tr = (v) => (v < 0 ? -Math.floor(-v) : Math.floor(v));
      const rd = x === 0 ? 0 : sh(x, d, away), up = sh(x, d, Math.ceil), dn = sh(x, d, Math.floor), trn = x === 0 ? 0 : sh(x, d, tr);
      let rs = 0; if (x !== 0) { const mag = Number(Math.abs(x).toExponential().split('e')[1]); rs = sh(x, s - 1 - mag, away); }
      const w = [];
      return { out: { rd, up, dn, tr: trn, rs }, warnings: w,
        steps: [`To ${fmt(d, 0)} decimal place${d === 1 ? '' : 's'}: ${fmt(x, 15)} → ${fmt(rd, 15)} (nearest), ${fmt(up, 15)} (up), ${fmt(dn, 15)} (down), ${fmt(trn, 15)} (truncated)`, `To ${fmt(s, 0)} significant figure${s === 1 ? '' : 's'}: ${fmt(x, 15)} → ${fmt(rs, 15)}`, `Rounding error to ${fmt(d, 0)} places = |${fmt(rd, 15)} − ${fmt(x, 15)}| = ${fmt(Math.abs(rd - x), 6)}`],
        sentence: `${fmt(x, 15)} is ${fmt(rd, 15)} to ${fmt(d, 0)} decimal places and ${fmt(rs, 15)} to ${fmt(s, 0)} significant figures.` };
    },
    (v) => { const e = []; if (v.d !== Math.floor(v.d)) e.push({ key: 'd', msg: 'Decimal places must be a whole number' }); if (v.s !== Math.floor(v.s)) e.push({ key: 's', msg: 'Significant figures must be a whole number' }); return e; },
    [{ name: '1234.5678: 2 places 1234.57, 3 sig figs 1230', in: { x: 1234.5678, d: 2, s: 3 }, out: { rd: 1234.57, up: 1234.57, dn: 1234.56, tr: 1234.56, rs: 1230 }, tol: 1e-12 },
      { name: '1.005 to two places is 1.01 (not 1.00)', in: { x: 1.005, d: 2, s: 3 }, out: { rd: 1.01, up: 1.01, dn: 1, tr: 1 }, tol: 1e-12 },
      { name: '2.5 rounds to 3 and −2.5 to −3 (away from zero)', in: { x: 2.5, d: 0, s: 1 }, out: { rd: 3, up: 3, dn: 2, rs: 3 }, tol: 1e-12 },
      { name: 'negative: −2.3 to whole numbers', in: { x: -2.3, d: 0, s: 2 }, out: { rd: -2, up: -2, dn: -3, tr: -2 }, tol: 1e-12 },
      { name: 'negative places: 1234 to the nearest ten and hundred', in: { x: 1234, d: -1, s: 4 }, out: { rd: 1230, up: 1240, dn: 1230 }, tol: 1e-12 },
      { name: 'small number: 0.00456789 to 3 sig figs is 0.00457', in: { x: 0.00456789, d: 4, s: 3 }, out: { rs: 0.00457, rd: 0.0046 }, tol: 1e-12 },
      { name: 'zero', in: { x: 0, d: 2, s: 3 }, out: {}, tol: 0 },
      { name: 'fractional places rejected', in: { x: 5, d: 1.5, s: 3 }, error: 'd' },
      { name: 'zero significant figures rejected', in: { x: 5, d: 2, s: 0 }, error: 's' }]),
  C('fraction-calculator', 'Fraction Calculator', '37 Engineering Mathematics', 'Add, subtract, multiply or divide two fractions. The answer is given as a simplified fraction, a mixed number, a decimal and a percentage, with the working.',
    ['fraction calculator', 'fractions', 'add fractions', 'subtract fractions', 'multiply fractions', 'divide fractions', 'simplify fraction', 'reduce fraction', 'mixed number', 'improper fraction', 'fraction to decimal', 'lowest terms'],
    [I('n1', 'First fraction, numerator', 'number', '', 1, { min: -1e6, max: 1e6, hint: 'Whole numbers only, up to 1,000,000 in size. A negative fraction takes the minus sign on the numerator.' }), I('d1', 'First fraction, denominator', 'number', '', 2, { min: -1e6, max: 1e6, hint: 'A whole number that is not zero.' }),
      { key: 'op', label: 'Operation', type: 'enum', options: [1, 2, 3, 4], def: 1, labels: { 1: 'Add (+)', 2: 'Subtract (−)', 3: 'Multiply (×)', 4: 'Divide (÷)' } },
      I('n2', 'Second fraction, numerator', 'number', '', 1, { min: -1e6, max: 1e6 }), I('d2', 'Second fraction, denominator', 'number', '', 3, { min: -1e6, max: 1e6, hint: 'A whole number that is not zero.' })],
    [{ key: 'rn', label: 'Result, numerator (simplified)', dim: 'number', unit: '', prec: 0 }, { key: 'rd', label: 'Result, denominator (simplified)', dim: 'number', unit: '', prec: 0 }, { key: 'mw', label: 'Mixed number, whole part', dim: 'number', unit: '', prec: 0 }, { key: 'mn', label: 'Mixed number, remainder numerator', dim: 'number', unit: '', prec: 0 },
      { key: 'dec', label: 'Decimal value', dim: 'number', unit: '', prec: 10 }, { key: 'pct', label: 'As a percentage (%)', dim: 'number', unit: '', prec: 8 }],
    'a/b + c/d = (ad + cb) / bd     a/b − c/d = (ad − cb) / bd     a/b × c/d = ac / bd     a/b ÷ c/d = ad / bc     simplest form = divide top and bottom by their greatest common divisor',
    ['All four numbers are whole numbers no larger than 1,000,000 in size, so the arithmetic is exact', 'No denominator may be zero, and when dividing the second fraction may not be zero', 'The result is reduced to lowest terms with the minus sign on the numerator and a positive denominator', 'The mixed number is the whole part (toward zero) and a remainder numerator over the same denominator, so −7/2 is −3 and 1/2', 'The decimal value is rounded for display; the fraction is the exact answer'],
    'Use fractions for ratios of standard sizes and for exact relations, such as the reciprocal sum behind parallel resistors. For a decimal you want to turn into a fraction, multiply both parts by a power of ten and simplify with the ratio calculator. Convert to a percentage with the figure shown here or with the percentage calculator.',
    ['ratio-calculator', 'percentage-calculator', 'rounding-sig-figs', 'resistance-parallel'],
    (i) => {
      const n1 = i.n1, d1 = i.d1, n2 = i.n2, d2 = i.d2, op = i.op, w = [];
      let n, d, how;
      if (op === 1) { n = n1 * d2 + n2 * d1; d = d1 * d2; how = `(${n1} × ${d2} + ${n2} × ${d1}) / (${d1} × ${d2})`; }
      else if (op === 2) { n = n1 * d2 - n2 * d1; d = d1 * d2; how = `(${n1} × ${d2} − ${n2} × ${d1}) / (${d1} × ${d2})`; }
      else if (op === 3) { n = n1 * n2; d = d1 * d2; how = `(${n1} × ${n2}) / (${d1} × ${d2})`; }
      else { n = n1 * d2; d = d1 * n2; how = `(${n1} × ${d2}) / (${d1} × ${n2})`; }
      const raw = `${n} / ${d}`; if (d < 0) { n = -n; d = -d; }
      let p = Math.abs(n), q = d; while (q) { const t = p % q; p = q; q = t; } const g = p || 1, rn = n / g, rd = n === 0 ? 1 : d / g;
      const mw = Math.trunc(rn / rd), mn = Math.abs(rn) - Math.abs(mw) * rd, dec = rn / rd;
      if (n === 0) w.push('The result is zero.'); else if (rd === 1) w.push('The result is a whole number.');
      return { out: { rn: n === 0 ? 0 : rn, rd, mw: n === 0 ? 0 : mw, mn: n === 0 ? 0 : mn, dec, pct: dec * 100 }, warnings: w,
        steps: [`${n1}/${d1} ${['+', '−', '×', '÷'][op - 1]} ${n2}/${d2} = ${how} = ${raw}`, `Greatest common divisor of ${Math.abs(n)} and ${d} = ${g}, so the simplest form is ${fmt(rn, 0)}/${fmt(rd, 0)}`, rd === 1 || Math.abs(rn) < rd ? `Mixed number: ${fmt(rn, 0)}/${fmt(rd, 0)} needs no whole part` : `Mixed number: ${fmt(rn, 0)} / ${fmt(rd, 0)} = ${fmt(mw, 0)} and ${fmt(mn, 0)}/${fmt(rd, 0)}`, `Decimal = ${fmt(rn, 0)} / ${fmt(rd, 0)} = ${fmt(dec, 10)}`],
        sentence: `${n1}/${d1} ${['plus', 'minus', 'times', 'divided by'][op - 1]} ${n2}/${d2} is ${fmt(rn, 0)}/${fmt(rd, 0)}, which is ${fmt(dec, 8)}.` };
    },
    (v) => {
      const e = [];
      ['n1', 'd1', 'n2', 'd2'].forEach((k) => { if (v[k] !== Math.floor(v[k])) e.push({ key: k, msg: 'Enter a whole number: fractions here have a whole-number numerator and denominator' }); });
      if (v.d1 === 0) e.push({ key: 'd1', msg: 'A denominator cannot be zero' });
      if (v.d2 === 0) e.push({ key: 'd2', msg: 'A denominator cannot be zero' });
      if (v.op === 4 && v.n2 === 0) e.push({ key: 'n2', msg: 'Cannot divide by a fraction that is zero' });
      return e;
    },
    [{ name: '1/2 + 1/3 = 5/6', in: { n1: 1, d1: 2, op: 1, n2: 1, d2: 3 }, out: { rn: 5, rd: 6, dec: 0.8333333333, pct: 83.33333333, mn: 5 }, tol: 1e-9 },
      { name: '3/4 − 5/4 = −1/2', in: { n1: 3, d1: 4, op: 2, n2: 5, d2: 4 }, out: { rn: -1, rd: 2, dec: -0.5 }, tol: 1e-9 },
      { name: '2/3 × 3/4 = 1/2', in: { n1: 2, d1: 3, op: 3, n2: 3, d2: 4 }, out: { rn: 1, rd: 2 }, tol: 1e-9 },
      { name: '1/2 ÷ 1/4 = 2 (whole number)', in: { n1: 1, d1: 2, op: 4, n2: 1, d2: 4 }, out: { rn: 2, rd: 1, mw: 2 }, tol: 1e-9, warn: 'whole number' },
      { name: '7/2 + 0/1: mixed number 3 and 1/2', in: { n1: 7, d1: 2, op: 1, n2: 0, d2: 1 }, out: { rn: 7, rd: 2, mw: 3, mn: 1 }, tol: 1e-9 },
      { name: 'negative mixed number: −17/5 is −3 and 2/5', in: { n1: -17, d1: 5, op: 3, n2: 1, d2: 1 }, out: { rn: -17, rd: 5, mw: -3, mn: 2 }, tol: 1e-9 },
      { name: 'negative denominator moves the sign to the numerator', in: { n1: 1, d1: -2, op: 3, n2: 1, d2: 1 }, out: { rn: -1, rd: 2 }, tol: 1e-9 },
      { name: 'zero result warns', in: { n1: 1, d1: 2, op: 2, n2: 2, d2: 4 }, out: { dec: 0 }, tol: 0, warn: 'zero' },
      { name: 'zero denominator rejected', in: { n1: 1, d1: 0, op: 1, n2: 1, d2: 2 }, error: 'd1' },
      { name: 'divide by a zero fraction rejected', in: { n1: 1, d1: 2, op: 4, n2: 0, d2: 5 }, error: 'n2' },
      { name: 'a decimal numerator is rejected', in: { n1: 1.5, d1: 2, op: 1, n2: 1, d2: 3 }, error: 'n1' }]),
  C('simultaneous-equations', 'Simultaneous Equations Solver', '37 Engineering Mathematics', 'Solve two equations in two unknowns, or three equations in three unknowns, such as the loop equations of a circuit. Gives x, y and z, the determinant of the coefficients and a check by substitution. A system with no single solution is rejected.',
    ['simultaneous equations', 'simultaneous equations solver', 'simultaneous equation calculator', 'system of equations', 'system of linear equations', 'linear equations solver', 'solve for x and y', '2x2 system', '3x3 system', 'cramer\'s rule', 'determinant', 'mesh current equations', 'kirchhoff equations'],
    [{ key: 'n', label: 'Number of unknowns', type: 'enum', options: [2, 3], def: 2, labels: { 2: '2 equations, x and y', 3: '3 equations, x, y and z' } },
      I('a1', 'Equation 1: coefficient of x', 'number', '', 2, { min: -1e12, max: 1e12, hint: 'Each equation is written a x + b y + c z = k. Enter a zero for a missing term.' }), I('b1', 'Equation 1: coefficient of y', 'number', '', 3, { min: -1e12, max: 1e12 }), I('c1', 'Equation 1: coefficient of z', 'number', '', '', { min: -1e12, max: 1e12, optional: true, hint: 'Used only for 3 unknowns; leave blank for 2.' }), I('k1', 'Equation 1: constant on the right', 'number', '', 13, { min: -1e12, max: 1e12 }),
      I('a2', 'Equation 2: coefficient of x', 'number', '', 1, { min: -1e12, max: 1e12 }), I('b2', 'Equation 2: coefficient of y', 'number', '', -1, { min: -1e12, max: 1e12 }), I('c2', 'Equation 2: coefficient of z', 'number', '', '', { min: -1e12, max: 1e12, optional: true, hint: 'Used only for 3 unknowns; leave blank for 2.' }), I('k2', 'Equation 2: constant on the right', 'number', '', -1, { min: -1e12, max: 1e12 }),
      I('a3', 'Equation 3: coefficient of x', 'number', '', '', { min: -1e12, max: 1e12, optional: true, hint: 'Equation 3 is used only for 3 unknowns; leave it blank for 2.' }), I('b3', 'Equation 3: coefficient of y', 'number', '', '', { min: -1e12, max: 1e12, optional: true }), I('c3', 'Equation 3: coefficient of z', 'number', '', '', { min: -1e12, max: 1e12, optional: true }), I('k3', 'Equation 3: constant on the right', 'number', '', '', { min: -1e12, max: 1e12, optional: true })],
    [{ key: 'x', label: 'x', dim: 'number', unit: '', prec: 10 }, { key: 'y', label: 'y', dim: 'number', unit: '', prec: 10 }, { key: 'z', label: 'z (3 unknowns only)', dim: 'number', unit: '', prec: 10 },
      { key: 'det', label: 'Determinant of the coefficients', dim: 'number', unit: '', prec: 10 }, { key: 'res', label: 'Largest check error (left side minus right side)', dim: 'number', unit: '', prec: 6 }],
    'a₁x + b₁y = k₁ and a₂x + b₂y = k₂ give D = a₁b₂ − a₂b₁, x = (k₁b₂ − k₂b₁) / D, y = (a₁k₂ − a₂k₁) / D     For three unknowns D is the 3 × 3 determinant and each unknown is Dₓ / D (Cramer\'s rule)     D = 0: no single solution',
    ['The equations are linear: each unknown appears to the first power and is not multiplied by another unknown', 'The determinant D must not be zero. If it is, the equations either contradict each other or repeat each other, and there is no single solution', 'The answer is found by elimination with row swapping, which keeps its accuracy when a coefficient is small; the determinant is shown so you can check by Cramer\'s rule', 'When D is very small compared with the size of the coefficients the system is close to having no solution and a small change in an input changes the answer a lot; a warning is shown', 'The check error is the largest amount by which the left side of any equation differs from its constant when the answer is put back in'],
    'Use this for the loop or node equations of a circuit with two or three unknown currents or voltages, for finding two constants from two measured points, and for balancing equations. Write each equation as a x + b y + c z = k with the unknowns in the same order, and enter a zero for a missing term. Always put the answer back into the original equations.',
    ['linear-interpolation', 'quadratic-solver', 'complex-number', 'resistance-parallel'],
    (i) => {
      const n = i.n, w = [], N = n === 3 ? 3 : 2;
      const M = N === 2 ? [[i.a1, i.b1, i.k1], [i.a2, i.b2, i.k2]] : [[i.a1, i.b1, i.c1, i.k1], [i.a2, i.b2, i.c2, i.k2], [i.a3, i.b3, i.c3, i.k3]];
      const det = N === 2 ? M[0][0] * M[1][1] - M[1][0] * M[0][1]
        : M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
      const A = M.map((r) => r.slice());
      for (let c = 0; c < N; c++) {
        let p = c; for (let r = c + 1; r < N; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
        const t = A[c]; A[c] = A[p]; A[p] = t;
        for (let r = c + 1; r < N; r++) { const f = A[r][c] / A[c][c]; for (let k = c; k <= N; k++) A[r][k] -= f * A[c][k]; }
      }
      const s = new Array(N).fill(0);
      for (let r = N - 1; r >= 0; r--) { let t = A[r][N]; for (let k = r + 1; k < N; k++) t -= A[r][k] * s[k]; s[r] = t / A[r][r]; }
      let res = 0; for (let r = 0; r < N; r++) { let t = -M[r][N]; for (let k = 0; k < N; k++) t += M[r][k] * s[k]; res = Math.max(res, Math.abs(t)); }
      const scale = M.reduce((p, r) => p * Math.max(...r.slice(0, N).map(Math.abs)), 1);
      if (Math.abs(det) < 1e-6 * scale) w.push('The determinant is very small compared with the coefficients, so the equations are nearly dependent. The answer is very sensitive to the inputs; check it carefully.');
      const eq = (r) => N === 2 ? `${fmt(M[r][0], 6)}x + ${fmt(M[r][1], 6)}y = ${fmt(M[r][2], 6)}` : `${fmt(M[r][0], 6)}x + ${fmt(M[r][1], 6)}y + ${fmt(M[r][2], 6)}z = ${fmt(M[r][3], 6)}`;
      const st = [`Equations: ${M.map((r, k) => eq(k)).join('   ;   ')}`, N === 2 ? `D = a₁b₂ − a₂b₁ = ${fmt(M[0][0], 6)} × ${fmt(M[1][1], 6)} − ${fmt(M[1][0], 6)} × ${fmt(M[0][1], 6)} = ${fmt(det, 10)}` : `D = determinant of the 3 × 3 coefficients = ${fmt(det, 10)}`,
        N === 2 ? `x = ${fmt(s[0], 10)}     y = ${fmt(s[1], 10)}` : `x = ${fmt(s[0], 10)}     y = ${fmt(s[1], 10)}     z = ${fmt(s[2], 10)}`, `Check: the largest difference between a left side and its constant is ${fmt(res, 6)}`];
      return { out: { x: s[0], y: s[1], z: N === 3 ? s[2] : null, det, res }, warnings: w, steps: st,
        sentence: N === 2 ? `The solution is x = ${fmt(s[0], 6)} and y = ${fmt(s[1], 6)}.` : `The solution is x = ${fmt(s[0], 6)}, y = ${fmt(s[1], 6)} and z = ${fmt(s[2], 6)}.` };
    },
    (v) => {
      const e = [], N = v.n === 3 ? 3 : 2;
      if (N === 3) ['c1', 'c2', 'a3', 'b3', 'c3', 'k3'].forEach((k) => { if (v[k] == null) e.push({ key: k, msg: 'Enter a value (use 0 for a missing term): three unknowns need all three equations' }); });
      if (e.length) return e;
      const M = N === 2 ? [[v.a1, v.b1], [v.a2, v.b2]] : [[v.a1, v.b1, v.c1], [v.a2, v.b2, v.c2], [v.a3, v.b3, v.c3]];
      const det = N === 2 ? M[0][0] * M[1][1] - M[1][0] * M[0][1]
        : M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
      const scale = M.reduce((p, r) => p * Math.max(...r.map(Math.abs)), 1);
      if (scale === 0 || Math.abs(det) <= 1e-12 * scale) e.push({ key: 'a1', msg: 'These equations have no single solution: the determinant of the coefficients is zero, so two equations contradict or repeat each other (for example one is a multiple of another)' });
      return e;
    },
    [{ name: '2x + 3y = 13 and x − y = −1 give x = 2, y = 3', in: { n: 2, a1: 2, b1: 3, c1: '', k1: 13, a2: 1, b2: -1, c2: '', k2: -1, a3: '', b3: '', c3: '', k3: '' }, out: { x: 2, y: 3, det: -5 }, tol: 1e-9 },
      { name: '3 unknowns: x + y + z = 6, 2y + 5z = −4, 2x + 5y − z = 27 give 5, 3, −2', in: { n: 3, a1: 1, b1: 1, c1: 1, k1: 6, a2: 0, b2: 2, c2: 5, k2: -4, a3: 2, b3: 5, c3: -1, k3: 27 }, out: { x: 5, y: 3, z: -2, det: -21 }, tol: 1e-9 },
      { name: 'a zero on the diagonal still solves (row swap): y = 4, x = 1', in: { n: 2, a1: 0, b1: 1, c1: '', k1: 4, a2: 1, b2: 1, c2: '', k2: 5, a3: '', b3: '', c3: '', k3: '' }, out: { x: 1, y: 4, det: -1 }, tol: 1e-9 },
      { name: 'two-loop circuit: 10I₁ − 4I₂ = 12 and −4I₁ + 9I₂ = 0', in: { n: 2, a1: 10, b1: -4, c1: '', k1: 12, a2: -4, b2: 9, c2: '', k2: 0, a3: '', b3: '', c3: '', k3: '' }, out: { x: 1.4594594595, y: 0.6486486486, det: 74 }, tol: 1e-8 },
      { name: 'nearly dependent equations warn', in: { n: 2, a1: 1, b1: 1, c1: '', k1: 2, a2: 1, b2: 1.0000001, c2: '', k2: 2.0000001, a3: '', b3: '', c3: '', k3: '' }, out: { x: 1, y: 1 }, tol: 1e-4, warn: 'nearly dependent' },
      { name: 'repeated equation rejected (no single solution)', in: { n: 2, a1: 1, b1: 2, c1: '', k1: 3, a2: 2, b2: 4, c2: '', k2: 6, a3: '', b3: '', c3: '', k3: '' }, error: 'a1' },
      { name: 'three unknowns with a blank third equation rejected', in: { n: 3, a1: 1, b1: 1, c1: 1, k1: 6, a2: 0, b2: 2, c2: 5, k2: -4, a3: '', b3: '', c3: '', k3: '' }, error: 'a3' }]),
  C('linear-interpolation', 'Linear Interpolation Calculator', '37 Engineering Mathematics', 'Find y at a chosen x on the straight line through two known points (x₁, y₁) and (x₂, y₂), or find the x that gives a chosen y. Also gives the slope and the value at x = 0. A result outside the two points is marked as extrapolation.',
    ['linear interpolation', 'linear interpolation calculator', 'interpolation calculator', 'interpolate between two values', 'extrapolation', 'straight line between two points', 'two point line', 'find y for x', 'table lookup', 'sensor scaling', 'linear scaling', '4-20 mA scaling'],
    [I('x1', 'First point, x₁', 'number', '', 0, { min: -1e12, max: 1e12 }), I('y1', 'First point, y₁', 'number', '', 4, { min: -1e12, max: 1e12 }), I('x2', 'Second point, x₂', 'number', '', 100, { min: -1e12, max: 1e12, hint: 'Must differ from x₁.' }), I('y2', 'Second point, y₂', 'number', '', 20, { min: -1e12, max: 1e12 }),
      I('x', 'x to look up', 'number', '', 25, { min: -1e12, max: 1e12, hint: 'The x at which you want y.' }), I('yt', 'y to look up (optional)', 'number', '', '', { min: -1e12, max: 1e12, optional: true, hint: 'Enter a y to find the x that gives it. Leave blank to skip. y₁ and y₂ must differ.' })],
    [{ key: 'y', label: 'y at the chosen x', dim: 'number', unit: '', prec: 10 }, { key: 'm', label: 'Slope m = (y₂ − y₁) / (x₂ − x₁)', dim: 'number', unit: '', prec: 10 }, { key: 't', label: 'Fraction of the way from x₁ to x₂', dim: 'number', unit: '', prec: 10 },
      { key: 'b', label: 'Value of y at x = 0', dim: 'number', unit: '', prec: 10 }, { key: 'xt', label: 'x at the chosen y', dim: 'number', unit: '', prec: 10 }],
    'y = y₁ + (x − x₁) × (y₂ − y₁) / (x₂ − x₁)     x = x₁ + (y − y₁) × (x₂ − x₁) / (y₂ − y₁)     slope m = (y₂ − y₁) / (x₂ − x₁)     fraction t = (x − x₁) / (x₂ − x₁)',
    ['Between the two points the quantity is assumed to change in a straight line, which is only an approximation for a curve such as a thermistor or a lamp characteristic; use points close together for a curve', 'x₂ must differ from x₁, and y₂ must differ from y₁ to find an x from a y', 'A chosen x or y outside the two points is extrapolation, and is less reliable: the line is assumed to continue', 'The fraction is 0 at the first point and 1 at the second; below 0 or above 1 means the value is outside the points', 'The points can be in any order and the line can slope up or down'],
    'Use this to read a value between two rows of a table, to scale a transducer, such as 4 to 20 mA to 0 to 100 °C, or to estimate a cable or transformer rating between two published sizes. For a curved relation use a point close to each side of the value you want, or the published formula. Check an extrapolated value against the maker\'s data.',
    ['simultaneous-equations', 'current-loop-4-20', 'percentage-calculator', 'rounding-sig-figs'],
    (i) => {
      const x1 = i.x1, y1 = i.y1, x2 = i.x2, y2 = i.y2, x = i.x, yt = i.yt, w = [];
      const m = (y2 - y1) / (x2 - x1), t = (x - x1) / (x2 - x1), y = y1 + (x - x1) * m, b = y1 - x1 * m;
      const xt = yt == null ? null : x1 + (yt - y1) / m;
      const lo = Math.min(x1, x2), hi = Math.max(x1, x2), ylo = Math.min(y1, y2), yhi = Math.max(y1, y2);
      if (x < lo || x > hi) w.push('The chosen x is outside the two known points, so y is extrapolated along the line and is less reliable.');
      if (yt != null && (yt < ylo || yt > yhi)) w.push('The chosen y is outside the two known values, so x is extrapolated along the line and is less reliable.');
      return { out: { y, m, t, b, xt }, warnings: w,
        steps: [`Slope m = (y₂ − y₁) / (x₂ − x₁) = (${fmt(y2, 8)} − ${fmt(y1, 8)}) / (${fmt(x2, 8)} − ${fmt(x1, 8)}) = ${fmt(m, 10)}`, `y = y₁ + (x − x₁) × m = ${fmt(y1, 8)} + (${fmt(x, 8)} − ${fmt(x1, 8)}) × ${fmt(m, 10)} = ${fmt(y, 10)}`, `Fraction of the way from x₁ to x₂ = (x − x₁) / (x₂ − x₁) = ${fmt(t, 10)}`,
          yt == null ? 'To find an x from a y, enter the y to look up' : m === 0 ? 'The line is level, so no single x gives that y' : `x = x₁ + (y − y₁) / m = ${fmt(x1, 8)} + (${fmt(yt, 8)} − ${fmt(y1, 8)}) / ${fmt(m, 10)} = ${fmt(xt, 10)}`],
        sentence: `On the line through (${fmt(x1, 6)}, ${fmt(y1, 6)}) and (${fmt(x2, 6)}, ${fmt(y2, 6)}), y = ${fmt(y, 6)} at x = ${fmt(x, 6)}${yt == null ? '' : `, and x = ${fmt(xt, 6)} at y = ${fmt(yt, 6)}`}.` };
    },
    (v) => {
      const e = [];
      if (v.x1 === v.x2) e.push({ key: 'x2', msg: 'x₂ must differ from x₁: two points with the same x do not define y as a function of x' });
      if (v.yt != null && v.y1 === v.y2) e.push({ key: 'yt', msg: 'y₁ and y₂ are equal, so the line is level and no single x gives this y. Clear this entry' });
      return e;
    },
    [{ name: '4 to 20 mA over 0 to 100: 25 gives 8 mA, the slope is 0.16', in: { x1: 0, y1: 4, x2: 100, y2: 20, x: 25, yt: '' }, out: { y: 8, m: 0.16, t: 0.25, b: 4 }, tol: 1e-9 },
      { name: 'x from y: 12 mA is at 50', in: { x1: 0, y1: 4, x2: 100, y2: 20, x: 25, yt: 12 }, out: { y: 8, xt: 50 }, tol: 1e-9 },
      { name: 'falling line: (10, 50) and (30, 10) at x = 20 gives 30', in: { x1: 10, y1: 50, x2: 30, y2: 10, x: 20, yt: '' }, out: { y: 30, m: -2, t: 0.5, b: 70 }, tol: 1e-9 },
      { name: 'points given in reverse order give the same line', in: { x1: 100, y1: 20, x2: 0, y2: 4, x: 25, yt: '' }, out: { y: 8, m: 0.16, t: 0.75 }, tol: 1e-9 },
      { name: 'extrapolation beyond x₂ warns', in: { x1: 0, y1: 4, x2: 100, y2: 20, x: 150, yt: '' }, out: { y: 28, t: 1.5 }, tol: 1e-9, warn: 'extrapolated' },
      { name: 'y outside the two values warns', in: { x1: 0, y1: 4, x2: 100, y2: 20, x: 50, yt: 24 }, out: { xt: 125 }, tol: 1e-9, warn: 'extrapolated' },
      { name: 'equal x values rejected', in: { x1: 5, y1: 1, x2: 5, y2: 9, x: 5, yt: '' }, error: 'x2' },
      { name: 'level line with a y to look up rejected', in: { x1: 0, y1: 7, x2: 10, y2: 7, x: 5, yt: 7 }, error: 'yt' }]),
  C('matrix-calculator', 'Matrix Calculator (2×2 and 3×3)', '37 Engineering Mathematics', 'Find the determinant, trace and inverse of a 2 × 2 or 3 × 3 matrix, with a check that the matrix times its inverse gives the identity. A matrix with a zero determinant has no inverse and is rejected.',
    ['matrix calculator', 'matrix inverse', 'inverse matrix calculator', 'matrix determinant', 'determinant calculator', 'inverse of a matrix', '2x2 matrix', '3x3 matrix', 'matrix trace', 'impedance matrix', 'admittance matrix', 'ybus'],
    [{ key: 'n', label: 'Matrix size', type: 'enum', options: [2, 3], def: 2, labels: { 2: '2 × 2', 3: '3 × 3' } },
      I('m11', 'Row 1, column 1', 'number', '', 4, { min: -1e12, max: 1e12, hint: 'Enter the matrix row by row. For a 2 × 2 matrix leave the third row and third column blank.' }), I('m12', 'Row 1, column 2', 'number', '', 7, { min: -1e12, max: 1e12 }), I('m13', 'Row 1, column 3', 'number', '', '', { min: -1e12, max: 1e12, optional: true }),
      I('m21', 'Row 2, column 1', 'number', '', 2, { min: -1e12, max: 1e12 }), I('m22', 'Row 2, column 2', 'number', '', 6, { min: -1e12, max: 1e12 }), I('m23', 'Row 2, column 3', 'number', '', '', { min: -1e12, max: 1e12, optional: true }),
      I('m31', 'Row 3, column 1', 'number', '', '', { min: -1e12, max: 1e12, optional: true }), I('m32', 'Row 3, column 2', 'number', '', '', { min: -1e12, max: 1e12, optional: true }), I('m33', 'Row 3, column 3', 'number', '', '', { min: -1e12, max: 1e12, optional: true })],
    [{ key: 'det', label: 'Determinant', dim: 'number', unit: '', prec: 10 }, { key: 'tr', label: 'Trace (sum of the diagonal)', dim: 'number', unit: '', prec: 10 },
      { key: 'i11', label: 'Inverse, row 1 column 1', dim: 'number', unit: '', prec: 10 }, { key: 'i12', label: 'Inverse, row 1 column 2', dim: 'number', unit: '', prec: 10 }, { key: 'i13', label: 'Inverse, row 1 column 3', dim: 'number', unit: '', prec: 10 },
      { key: 'i21', label: 'Inverse, row 2 column 1', dim: 'number', unit: '', prec: 10 }, { key: 'i22', label: 'Inverse, row 2 column 2', dim: 'number', unit: '', prec: 10 }, { key: 'i23', label: 'Inverse, row 2 column 3', dim: 'number', unit: '', prec: 10 },
      { key: 'i31', label: 'Inverse, row 3 column 1', dim: 'number', unit: '', prec: 10 }, { key: 'i32', label: 'Inverse, row 3 column 2', dim: 'number', unit: '', prec: 10 }, { key: 'i33', label: 'Inverse, row 3 column 3', dim: 'number', unit: '', prec: 10 },
      { key: 'res', label: 'Largest error of A × A⁻¹ against the identity', dim: 'number', unit: '', prec: 6 }],
    'For a 2 × 2 matrix [a b; c d]: det = ad − bc and the inverse is [d −b; −c a] / det     For 3 × 3, det is the cofactor expansion along row 1 and the inverse is the adjugate divided by det     trace = sum of the diagonal     det = 0: no inverse',
    ['The matrix is square, 2 × 2 or 3 × 3, with real entries; for a 2 × 2 matrix the third row and column are ignored', 'The determinant must not be zero. If it is, the rows are dependent and the matrix has no inverse', 'The inverse is found by elimination with row swapping, which keeps its accuracy when an entry is small, and is checked by multiplying it back against the original', 'When the determinant is very small compared with the size of the entries the matrix is close to singular, so a small change in an entry changes the inverse a lot; a warning is shown', 'The inverse entries for a third row and column are a dash for a 2 × 2 matrix'],
    'Use this to invert the impedance or admittance matrix of a small network, to check a hand-calculated determinant, or to solve mesh equations written in matrix form. To solve A x = k for the unknowns directly, use the simultaneous equations solver. Always check the inverse against the original matrix.',
    ['simultaneous-equations', 'vector-calculator', 'complex-number', 'resistance-parallel'],
    (i) => {
      const N = i.n === 3 ? 3 : 2, w = [];
      const M = N === 2 ? [[i.m11, i.m12], [i.m21, i.m22]] : [[i.m11, i.m12, i.m13], [i.m21, i.m22, i.m23], [i.m31, i.m32, i.m33]];
      const det = N === 2 ? M[0][0] * M[1][1] - M[0][1] * M[1][0]
        : M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
      const A = M.map((r, k) => r.concat(Array.from({ length: N }, (_, c) => (c === k ? 1 : 0))));
      for (let c = 0; c < N; c++) {
        let p = c; for (let r = c + 1; r < N; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
        const t = A[c]; A[c] = A[p]; A[p] = t;
        const d = A[c][c]; for (let k = 0; k < 2 * N; k++) A[c][k] /= d;
        for (let r = 0; r < N; r++) if (r !== c) { const f = A[r][c]; if (f !== 0) for (let k = 0; k < 2 * N; k++) A[r][k] -= f * A[c][k]; }
      }
      const inv = A.map((r) => r.slice(N));
      let res = 0; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { let t = r === c ? -1 : 0; for (let k = 0; k < N; k++) t += M[r][k] * inv[k][c]; res = Math.max(res, Math.abs(t)); }
      const scale = M.reduce((p, r) => p * Math.max(...r.map(Math.abs)), 1);
      if (Math.abs(det) < 1e-6 * scale) w.push('The determinant is very small compared with the entries, so the matrix is nearly singular. The inverse is very sensitive to the inputs; check it carefully.');
      const out = { det, tr: M.reduce((p, r, k) => p + r[k], 0), res };
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out['i' + (r + 1) + (c + 1)] = r < N && c < N ? inv[r][c] : null;
      const row = (m, r) => m[r].map((v) => fmt(v, 8)).join('   ');
      const st = [`Matrix, row by row: ${M.map((r, k) => row(M, k)).join('  |  ')}`, N === 2 ? `det = ad − bc = ${fmt(M[0][0], 8)} × ${fmt(M[1][1], 8)} − ${fmt(M[0][1], 8)} × ${fmt(M[1][0], 8)} = ${fmt(det, 10)}` : `det = cofactor expansion along row 1 = ${fmt(det, 10)}`,
        `Trace = ${fmt(out.tr, 10)}`, `Inverse, row by row: ${inv.map((r, k) => row(inv, k)).join('  |  ')}`, `Check: the largest difference between A × A⁻¹ and the identity is ${fmt(res, 6)}`];
      return { out, warnings: w, steps: st, sentence: `The ${N} × ${N} matrix has determinant ${fmt(det, 6)} and trace ${fmt(out.tr, 6)}, and its inverse is found.` };
    },
    (v) => {
      const e = [], N = v.n === 3 ? 3 : 2;
      if (N === 3) ['m13', 'm23', 'm31', 'm32', 'm33'].forEach((k) => { if (v[k] == null) e.push({ key: k, msg: 'Enter a value (use 0 for a zero entry): a 3 × 3 matrix needs all nine entries' }); });
      if (e.length) return e;
      const M = N === 2 ? [[v.m11, v.m12], [v.m21, v.m22]] : [[v.m11, v.m12, v.m13], [v.m21, v.m22, v.m23], [v.m31, v.m32, v.m33]];
      const det = N === 2 ? M[0][0] * M[1][1] - M[0][1] * M[1][0]
        : M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
      const scale = M.reduce((p, r) => p * Math.max(...r.map(Math.abs)), 1);
      if (scale === 0 || Math.abs(det) <= 1e-12 * scale) e.push({ key: 'm11', msg: 'This matrix has no inverse: its determinant is zero, so one row is a multiple of, or a sum of multiples of, the others' });
      return e;
    },
    [{ name: '2 × 2 [4 7; 2 6]: det 10, inverse [0.6 −0.7; −0.2 0.4]', in: { n: 2, m11: 4, m12: 7, m13: '', m21: 2, m22: 6, m23: '', m31: '', m32: '', m33: '' }, out: { det: 10, tr: 10, i11: 0.6, i12: -0.7, i21: -0.2, i22: 0.4 }, tol: 1e-9 },
      { name: '3 × 3 [2 0 1; 1 3 2; 1 1 2]: det 6, trace 7', in: { n: 3, m11: 2, m12: 0, m13: 1, m21: 1, m22: 3, m23: 2, m31: 1, m32: 1, m33: 2 }, out: { det: 6, tr: 7 }, tol: 1e-9 },
      { name: 'identity matrix is its own inverse', in: { n: 3, m11: 1, m12: 0, m13: 0, m21: 0, m22: 1, m23: 0, m31: 0, m32: 0, m33: 1 }, out: { det: 1, tr: 3, i11: 1, i22: 1, i33: 1, i12: 0 }, tol: 1e-12 },
      { name: 'a zero on the diagonal still inverts (row swap): [0 1; 1 0]', in: { n: 2, m11: 0, m12: 1, m13: '', m21: 1, m22: 0, m23: '', m31: '', m32: '', m33: '' }, out: { det: -1, i12: 1, i21: 1 }, tol: 1e-12 },
      { name: 'nearly singular matrix warns', in: { n: 2, m11: 1, m12: 1, m13: '', m21: 1, m22: 1.0000001, m23: '', m31: '', m32: '', m33: '' }, out: {}, tol: 1e-4, warn: 'nearly singular' },
      { name: 'repeated row rejected (no inverse)', in: { n: 2, m11: 1, m12: 2, m13: '', m21: 2, m22: 4, m23: '', m31: '', m32: '', m33: '' }, error: 'm11' },
      { name: 'three by three with a blank entry rejected', in: { n: 3, m11: 1, m12: 0, m13: 0, m21: 0, m22: 1, m23: 0, m31: 0, m32: 0, m33: '' }, error: 'm33' }]),
  C('vector-calculator', 'Vector Calculator (3D)', '37 Engineering Mathematics', 'From two vectors A and B in three dimensions, find each length, the dot product, the angle between them, the cross product and its length, and the component of A along B. Leave the z entries at 0 for a flat vector.',
    ['vector calculator', 'dot product', 'cross product', 'dot product calculator', 'cross product calculator', 'angle between two vectors', 'vector magnitude', 'vector length', 'vector projection', '3d vector', 'vector addition'],
    [I('ax', 'Vector A, x component', 'number', '', 3, { min: -1e12, max: 1e12 }), I('ay', 'Vector A, y component', 'number', '', 4, { min: -1e12, max: 1e12 }), I('az', 'Vector A, z component', 'number', '', 0, { min: -1e12, max: 1e12, hint: 'Leave at 0 for a vector in a flat plane.' }),
      I('bx', 'Vector B, x component', 'number', '', 1, { min: -1e12, max: 1e12 }), I('by', 'Vector B, y component', 'number', '', 2, { min: -1e12, max: 1e12 }), I('bz', 'Vector B, z component', 'number', '', 2, { min: -1e12, max: 1e12 })],
    [{ key: 'ma', label: 'Length of A, |A|', dim: 'number', unit: '', prec: 10 }, { key: 'mb', label: 'Length of B, |B|', dim: 'number', unit: '', prec: 10 }, { key: 'dot', label: 'Dot product A · B', dim: 'number', unit: '', prec: 10 }, { key: 'ang', label: 'Angle between A and B (degrees)', dim: 'number', unit: '', prec: 8 },
      { key: 'cx', label: 'Cross product A × B, x component', dim: 'number', unit: '', prec: 10 }, { key: 'cy', label: 'Cross product A × B, y component', dim: 'number', unit: '', prec: 10 }, { key: 'cz', label: 'Cross product A × B, z component', dim: 'number', unit: '', prec: 10 }, { key: 'mc', label: 'Length of A × B, |A × B|', dim: 'number', unit: '', prec: 10 },
      { key: 'proj', label: 'Component of A along B, (A · B) / |B|', dim: 'number', unit: '', prec: 10 }],
    'A · B = AₓBₓ + AᵧBᵧ + A_zB_z     |A| = √(A · A)     A × B = (AᵧB_z − A_zBᵧ, A_zBₓ − AₓB_z, AₓBᵧ − AᵧBₓ)     angle θ: cos θ = A · B / (|A| |B|)     component of A along B = A · B / |B|',
    ['Both vectors are in a right-handed x, y, z system, and the cross product follows the right-hand rule, so B × A is the negative of A × B', 'The angle is between 0° and 180°; vectors at 90° have a dot product of zero, and parallel vectors have a cross product of zero', 'A vector with all components zero has no direction, so the angle and the component along it are not defined and are shown as a dash with a warning', 'The angle is found from the length of A × B and A · B, which stays accurate for angles close to 0° and 180°', 'The tool works on plain numbers and does not track units: enter both vectors in the same unit'],
    'Use this to resolve a force or a field into components, to find the angle between two directions, to find the area of the parallelogram two vectors span (the length of the cross product), or to check a hand calculation with the right-hand rule. For phasors given by magnitude and angle use the phasor sum calculator.',
    ['matrix-calculator', 'phasor-sum', 'complex-number', 'trig-functions'],
    (i) => {
      const a = [i.ax, i.ay, i.az], b = [i.bx, i.by, i.bz], w = [];
      const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
      const c = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      const ma = Math.hypot(a[0], a[1], a[2]), mb = Math.hypot(b[0], b[1], b[2]), mc = Math.hypot(c[0], c[1], c[2]);
      const zero = ma === 0 || mb === 0;
      if (zero) w.push('One of the vectors is zero, so it has no direction: the angle and the component along it are not defined.');
      const ang = zero ? null : Math.atan2(mc, dot) * 180 / Math.PI, proj = mb === 0 ? null : dot / mb;
      const v3 = (v) => `(${v.map((x) => fmt(x, 8)).join(', ')})`;
      return { out: { ma, mb, dot, ang, cx: c[0], cy: c[1], cz: c[2], mc, proj }, warnings: w,
        steps: [`A = ${v3(a)}     B = ${v3(b)}`, `|A| = ${fmt(ma, 10)}     |B| = ${fmt(mb, 10)}`, `A · B = ${fmt(dot, 10)}`, `A × B = ${v3(c)}, length ${fmt(mc, 10)}`, zero ? 'The angle and component are not defined for a zero vector' : `Angle = atan2(|A × B|, A · B) = ${fmt(ang, 8)}°`, mb === 0 ? '' : `Component of A along B = A · B / |B| = ${fmt(proj, 10)}`].filter(Boolean),
        sentence: zero ? `A · B = ${fmt(dot, 6)}; the angle is not defined because one vector is zero.` : `A · B = ${fmt(dot, 6)}, the angle between the vectors is ${fmt(ang, 6)}° and |A × B| = ${fmt(mc, 6)}.` };
    },
    [{ name: '(3, 4, 0) and (1, 2, 2): dot 11, cross (8, −6, 2), |A| = 5, |B| = 3', in: { ax: 3, ay: 4, az: 0, bx: 1, by: 2, bz: 2 }, out: { ma: 5, mb: 3, dot: 11, cx: 8, cy: -6, cz: 2, proj: 11 / 3 }, tol: 1e-9 },
      { name: 'perpendicular vectors: x and y unit vectors give 90°, cross (0, 0, 1)', in: { ax: 1, ay: 0, az: 0, bx: 0, by: 1, bz: 0 }, out: { dot: 0, ang: 90, cz: 1, mc: 1 }, tol: 1e-9 },
      { name: 'parallel vectors: 0° and a zero cross product', in: { ax: 1, ay: 2, az: 3, bx: 2, by: 4, bz: 6 }, out: { ang: 0, mc: 0, cx: 0, cy: 0, cz: 0, dot: 28 }, tol: 1e-6 },
      { name: 'opposite vectors: 180°', in: { ax: 1, ay: 0, az: 0, bx: -5, by: 0, bz: 0 }, out: { ang: 180, dot: -5, proj: -1 }, tol: 1e-9 },
      { name: 'a zero vector warns and has no angle', in: { ax: 0, ay: 0, az: 0, bx: 1, by: 2, bz: 3 }, out: { ma: 0, dot: 0 }, tol: 1e-9, warn: 'zero' }]),
  C('linear-regression', 'Linear Regression (Line of Best Fit)', '37 Engineering Mathematics', 'Fit a straight line y = m x + c through up to 10 measured points by least squares. Gives the slope, the intercept, the correlation coefficient r and r², the standard error of the fit, and y at a chosen x. Blank pairs are ignored.',
    ['linear regression', 'linear regression calculator', 'line of best fit', 'least squares', 'least squares line', 'regression line', 'trend line', 'correlation coefficient', 'r squared', 'r2 calculator', 'calibration curve', 'best fit line', 'straight line fit'],
    [I('x1', 'Point 1: x', 'number', '', 0, { min: -1e12, max: 1e12, hint: 'Enter each point as an x and a y. At least two points are needed, and the x values must not all be the same. Blank pairs are ignored.' }), I('y1', 'Point 1: y', 'number', '', 4, { min: -1e12, max: 1e12 }),
      I('x2', 'Point 2: x', 'number', '', 25, { min: -1e12, max: 1e12 }), I('y2', 'Point 2: y', 'number', '', 8.1, { min: -1e12, max: 1e12 }),
      I('x3', 'Point 3: x', 'number', '', 50, { min: -1e12, max: 1e12, optional: true }), I('y3', 'Point 3: y', 'number', '', 11.9, { min: -1e12, max: 1e12, optional: true }),
      I('x4', 'Point 4: x', 'number', '', 75, { min: -1e12, max: 1e12, optional: true }), I('y4', 'Point 4: y', 'number', '', 16.2, { min: -1e12, max: 1e12, optional: true }),
      I('x5', 'Point 5: x', 'number', '', 100, { min: -1e12, max: 1e12, optional: true }), I('y5', 'Point 5: y', 'number', '', 19.9, { min: -1e12, max: 1e12, optional: true }),
      I('x6', 'Point 6: x', 'number', '', '', { min: -1e12, max: 1e12, optional: true }), I('y6', 'Point 6: y', 'number', '', '', { min: -1e12, max: 1e12, optional: true }),
      I('x7', 'Point 7: x', 'number', '', '', { min: -1e12, max: 1e12, optional: true }), I('y7', 'Point 7: y', 'number', '', '', { min: -1e12, max: 1e12, optional: true }),
      I('x8', 'Point 8: x', 'number', '', '', { min: -1e12, max: 1e12, optional: true }), I('y8', 'Point 8: y', 'number', '', '', { min: -1e12, max: 1e12, optional: true }),
      I('x9', 'Point 9: x', 'number', '', '', { min: -1e12, max: 1e12, optional: true }), I('y9', 'Point 9: y', 'number', '', '', { min: -1e12, max: 1e12, optional: true }),
      I('x10', 'Point 10: x', 'number', '', '', { min: -1e12, max: 1e12, optional: true }), I('y10', 'Point 10: y', 'number', '', '', { min: -1e12, max: 1e12, optional: true }),
      I('xp', 'x to predict y at (optional)', 'number', '', '', { min: -1e12, max: 1e12, optional: true, hint: 'Enter an x to read y from the fitted line. Leave blank to skip.' })],
    [{ key: 'm', label: 'Slope m', dim: 'number', unit: '', prec: 10 }, { key: 'c', label: 'Intercept c (y at x = 0)', dim: 'number', unit: '', prec: 10 }, { key: 'r', label: 'Correlation coefficient r', dim: 'number', unit: '', prec: 8 }, { key: 'r2', label: 'Coefficient of determination r²', dim: 'number', unit: '', prec: 8 },
      { key: 'see', label: 'Standard error of the fit (n − 2)', dim: 'number', unit: '', prec: 8 }, { key: 'n', label: 'Number of points', dim: 'number', unit: '', prec: 0 }, { key: 'xbar', label: 'Mean of x', dim: 'number', unit: '', prec: 8 }, { key: 'ybar', label: 'Mean of y', dim: 'number', unit: '', prec: 8 }, { key: 'yp', label: 'y at the chosen x', dim: 'number', unit: '', prec: 10 }],
    'm = Σ(x − x̄)(y − ȳ) / Σ(x − x̄)²     c = ȳ − m x̄     r = Σ(x − x̄)(y − ȳ) / √(Σ(x − x̄)² Σ(y − ȳ)²)     r² = r × r     standard error = √(Σ(y − m x − c)² / (n − 2))',
    ['The relation is assumed to be a straight line, and the line is the one that makes the sum of the squared vertical distances from the points as small as possible; x is treated as exact and y as the measured quantity', 'At least two points are needed and the x values must not all be the same, because then the slope is not defined', 'With exactly two points the line passes through both, so r² is 1 and the standard error is not defined; a warning is shown', 'r² near 1 means the points lie close to the line; it does not prove that the relation is a straight line, so look at the points as well', 'If the y values are all equal the line is level and r is not defined, and a warning is shown', 'A chosen x outside the entered points is extrapolation and is less reliable'],
    'Use this to fit a calibration line to instrument readings, to find the slope and offset of a sensor, to find a resistance from voltage and current pairs (the slope of V against I), or to see whether test readings follow a trend. Check that the points look straight before relying on r². For just two points use the linear interpolation calculator.',
    ['linear-interpolation', 'standard-deviation', 'mean-median-mode', 'percentage-error'],
    (i) => {
      const xs = [], ys = [], w = [];
      for (let k = 1; k <= 10; k++) if (i['x' + k] != null && i['y' + k] != null) { xs.push(i['x' + k]); ys.push(i['y' + k]); }
      const n = xs.length, xb = xs.reduce((a, b) => a + b, 0) / n, yb = ys.reduce((a, b) => a + b, 0) / n;
      let sxx = 0, syy = 0, sxy = 0; for (let k = 0; k < n; k++) { sxx += (xs[k] - xb) * (xs[k] - xb); syy += (ys[k] - yb) * (ys[k] - yb); sxy += (xs[k] - xb) * (ys[k] - yb); }
      const m = sxy / sxx, c = yb - m * xb;
      const r = syy === 0 ? null : Math.max(-1, Math.min(1, sxy / Math.sqrt(sxx * syy))), r2 = r == null ? null : r * r;
      let ssr = 0; for (let k = 0; k < n; k++) { const e = ys[k] - m * xs[k] - c; ssr += e * e; }
      const see = n > 2 ? Math.sqrt(ssr / (n - 2)) : null, xp = i.xp, yp = xp == null ? null : m * xp + c;
      if (n === 2) w.push('Only two points were entered, so the line passes through both exactly: r² is 1 and the standard error is not defined. Enter more points to test how straight the data is.');
      if (r == null) w.push('The y values are all equal, so the line is level and the correlation coefficient is not defined.');
      if (xp != null && (xp < Math.min(...xs) || xp > Math.max(...xs))) w.push('The chosen x is outside the entered points, so y is extrapolated along the line and is less reliable.');
      return { out: { m, c, r, r2, see, n, xbar: xb, ybar: yb, yp }, warnings: w,
        steps: [`n = ${n} points, mean x = ${fmt(xb, 8)}, mean y = ${fmt(yb, 8)}`, `Σ(x − x̄)² = ${fmt(sxx, 8)}, Σ(y − ȳ)² = ${fmt(syy, 8)}, Σ(x − x̄)(y − ȳ) = ${fmt(sxy, 8)}`, `Slope m = Σ(x − x̄)(y − ȳ) / Σ(x − x̄)² = ${fmt(m, 10)}`, `Intercept c = ȳ − m x̄ = ${fmt(yb, 8)} − ${fmt(m, 10)} × ${fmt(xb, 8)} = ${fmt(c, 10)}`,
          r == null ? 'Correlation coefficient: not defined for level data' : `r = ${fmt(r, 8)}, r² = ${fmt(r2, 8)}`, see == null ? 'Standard error: needs at least three points' : `Standard error of the fit = ${fmt(see, 8)}`, xp == null ? 'To read y from the line, enter an x to predict' : `y at x = ${fmt(xp, 8)} is ${fmt(m, 10)} × ${fmt(xp, 8)} + ${fmt(c, 10)} = ${fmt(yp, 10)}`],
        sentence: `The best-fit line through ${n} points is y = ${fmt(m, 6)} x + ${fmt(c, 6)}${r2 == null ? '' : ' with r² = ' + fmt(r2, 6)}.` };
    },
    (v) => {
      const e = [], xs = [];
      for (let k = 1; k <= 10; k++) {
        const hx = v['x' + k] != null, hy = v['y' + k] != null;
        if (hx && !hy) e.push({ key: 'y' + k, msg: 'Enter the y value for point ' + k + ', or clear its x to ignore the pair' });
        if (!hx && hy) e.push({ key: 'x' + k, msg: 'Enter the x value for point ' + k + ', or clear its y to ignore the pair' });
        if (hx && hy) xs.push(v['x' + k]);
      }
      if (e.length) return e;
      if (xs.length < 2) e.push({ key: 'x2', msg: 'Enter at least two points' });
      else if (xs.every((x) => x === xs[0])) e.push({ key: 'x2', msg: 'The x values are all the same, so the slope is not defined: enter points with at least two different x values' });
      return e;
    },
    [{ name: 'textbook data (1,2),(2,4),(3,5),(4,4),(5,5): m 0.6, c 2.2, r² 0.6', in: { x1: 1, y1: 2, x2: 2, y2: 4, x3: 3, y3: 5, x4: 4, y4: 4, x5: 5, y5: 5, x6: '', y6: '', x7: '', y7: '', x8: '', y8: '', x9: '', y9: '', x10: '', y10: '', xp: 6 }, out: { m: 0.6, c: 2.2, r2: 0.6, r: 0.7745966692, see: 0.894427191, yp: 5.8, n: 5, xbar: 3, ybar: 4 }, tol: 1e-8 },
      { name: 'exact line (1,2),(2,4),(3,6): m 2, c 0, r 1', in: { x1: 1, y1: 2, x2: 2, y2: 4, x3: 3, y3: 6, x4: '', y4: '', x5: '', y5: '', x6: '', y6: '', x7: '', y7: '', x8: '', y8: '', x9: '', y9: '', x10: '', y10: '', xp: '' }, out: { m: 2, r: 1, r2: 1, see: 0 }, tol: 1e-9 },
      { name: 'falling line: r is negative', in: { x1: 0, y1: 10, x2: 1, y2: 8, x3: 2, y3: 6, x4: 3, y4: 4, x5: '', y5: '', x6: '', y6: '', x7: '', y7: '', x8: '', y8: '', x9: '', y9: '', x10: '', y10: '', xp: '' }, out: { m: -2, c: 10, r: -1 }, tol: 1e-9 },
      { name: 'two points fit exactly and warn', in: { x1: 0, y1: 1, x2: 10, y2: 21, x3: '', y3: '', x4: '', y4: '', x5: '', y5: '', x6: '', y6: '', x7: '', y7: '', x8: '', y8: '', x9: '', y9: '', x10: '', y10: '', xp: '' }, out: { m: 2, c: 1, r2: 1 }, tol: 1e-9, warn: 'exactly' },
      { name: 'prediction outside the x range warns', in: { x1: 1, y1: 2, x2: 2, y2: 4, x3: 3, y3: 6, x4: '', y4: '', x5: '', y5: '', x6: '', y6: '', x7: '', y7: '', x8: '', y8: '', x9: '', y9: '', x10: '', y10: '', xp: 10 }, out: { yp: 20 }, tol: 1e-9, warn: 'extrapolated' },
      { name: 'level data: slope 0, r not defined, warns', in: { x1: 1, y1: 5, x2: 2, y2: 5, x3: 3, y3: 5, x4: '', y4: '', x5: '', y5: '', x6: '', y6: '', x7: '', y7: '', x8: '', y8: '', x9: '', y9: '', x10: '', y10: '', xp: '' }, out: { m: 0, c: 5 }, tol: 1e-9, warn: 'not defined' },
      { name: 'all x the same rejected', in: { x1: 2, y1: 1, x2: 2, y2: 5, x3: 2, y3: 9, x4: '', y4: '', x5: '', y5: '', x6: '', y6: '', x7: '', y7: '', x8: '', y8: '', x9: '', y9: '', x10: '', y10: '', xp: '' }, error: 'x2' },
      { name: 'half-filled pair rejected', in: { x1: 1, y1: 2, x2: 2, y2: 4, x3: 3, y3: '', x4: '', y4: '', x5: '', y5: '', x6: '', y6: '', x7: '', y7: '', x8: '', y8: '', x9: '', y9: '', x10: '', y10: '', xp: '' }, error: 'y3' }]),
  C('pythagorean-theorem', 'Pythagorean Theorem (Right Triangle) Calculator', '37 Engineering Mathematics', 'Enter any two sides of a right triangle, the legs a and b or a leg and the hypotenuse c, and get the third side, the two acute angles, the area and the perimeter. Leave the side you want to find blank.',
    ['pythagorean theorem', 'pythagorean theorem calculator', 'pythagoras', 'right triangle calculator', 'right angle triangle', 'hypotenuse calculator', 'hypotenuse', 'find the hypotenuse', 'find the missing side', 'a squared plus b squared', '3 4 5 triangle', 'diagonal of a rectangle'],
    [I('a', 'Side a (a leg)', 'number', '', 3, { min: 0, max: 1e12, optional: true, hint: 'Enter exactly two of the three sides and leave the one you want to find blank. All must be above zero, in one consistent unit.' }), I('b', 'Side b (the other leg)', 'number', '', 4, { min: 0, max: 1e12, optional: true }), I('c', 'Side c (the hypotenuse)', 'number', '', '', { min: 0, max: 1e12, optional: true, hint: 'The longest side, opposite the right angle.' })],
    [{ key: 'a', label: 'Side a', dim: 'number', unit: '', prec: 10 }, { key: 'b', label: 'Side b', dim: 'number', unit: '', prec: 10 }, { key: 'c', label: 'Hypotenuse c', dim: 'number', unit: '', prec: 10 },
      { key: 'angA', label: 'Angle A, opposite side a (degrees)', dim: 'number', unit: '', prec: 8 }, { key: 'angB', label: 'Angle B, opposite side b (degrees)', dim: 'number', unit: '', prec: 8 }, { key: 'area', label: 'Area', dim: 'number', unit: '', prec: 10 }, { key: 'perim', label: 'Perimeter', dim: 'number', unit: '', prec: 10 }],
    'a² + b² = c²     c = √(a² + b²)     a = √(c² − b²)     b = √(c² − a²)     angle A = atan(a / b), angle B = atan(b / a)     area = a b / 2     perimeter = a + b + c',
    ['The triangle has one right angle (90°); c is the longest side, opposite it, and a and b are the two legs', 'Exactly two sides must be entered. The side left blank is found; entering all three, or only one, is rejected', 'When the hypotenuse is entered it must be longer than the leg entered with it, because the hypotenuse is always the longest side', 'The tool works on plain numbers and does not track units: enter both sides in the same unit; the area is in that unit squared', 'The two acute angles add up to 90°'],
    'Use this to find the diagonal of a rectangular panel or a trench, the length of a sloping cable run from its horizontal and vertical parts, the length of a guy wire, or the missing side of a right-angled impedance or power triangle. To work out the sides of any triangle from its three sides use the triangle calculator.',
    ['triangle-calculator', 'trig-functions', 'complex-number', 'circle-calculator'],
    (i) => {
      let a = i.a, b = i.b, c = i.c;
      if (c == null) c = Math.hypot(a, b); else if (a == null) a = Math.sqrt((c - b) * (c + b)); else b = Math.sqrt((c - a) * (c + a));
      const angA = Math.atan2(a, b) * 180 / Math.PI, angB = Math.atan2(b, a) * 180 / Math.PI;
      const found = i.c == null ? 'c = √(a² + b²)' : i.a == null ? 'a = √(c² − b²)' : 'b = √(c² − a²)';
      return { out: { a, b, c, angA, angB, area: a * b / 2, perim: a + b + c }, warnings: [],
        steps: [`Given two sides, the third is found from a² + b² = c²: ${found}`, `a = ${fmt(a, 10)}     b = ${fmt(b, 10)}     c = ${fmt(c, 10)}`, `Angle A = atan(a / b) = ${fmt(angA, 8)}°     Angle B = atan(b / a) = ${fmt(angB, 8)}°`, `Area = a × b / 2 = ${fmt(a * b / 2, 10)}     Perimeter = a + b + c = ${fmt(a + b + c, 10)}`],
        sentence: `The right triangle has sides ${fmt(a, 6)}, ${fmt(b, 6)} and ${fmt(c, 6)}, with acute angles of ${fmt(angA, 6)}° and ${fmt(angB, 6)}°.` };
    },
    (v) => {
      const e = [], have = ['a', 'b', 'c'].filter((k) => v[k] != null);
      if (have.length !== 2) { e.push({ key: have.length < 2 ? 'a' : 'c', msg: have.length < 2 ? 'Enter two sides and leave the one you want to find blank' : 'Enter exactly two sides: clear the side you want to find' }); return e; }
      have.forEach((k) => { if (!(v[k] > 0)) e.push({ key: k, msg: 'A side must be greater than zero' }); });
      if (e.length) return e;
      if (v.c != null && v.a != null && v.c <= v.a) e.push({ key: 'c', msg: 'The hypotenuse must be longer than side a' });
      if (v.c != null && v.b != null && v.c <= v.b) e.push({ key: 'c', msg: 'The hypotenuse must be longer than side b' });
      return e;
    },
    [{ name: '3 and 4 give the 3-4-5 triangle, area 6, perimeter 12', in: { a: 3, b: 4, c: '' }, out: { a: 3, b: 4, c: 5, angA: 36.8698976458, angB: 53.1301023542, area: 6, perim: 12 }, tol: 1e-8 },
      { name: 'leg and hypotenuse: c = 13, b = 12 give a = 5', in: { a: '', b: 12, c: 13 }, out: { a: 5, area: 30, perim: 30 }, tol: 1e-9 },
      { name: 'equal legs give 45° angles and c = √2', in: { a: 1, b: 1, c: '' }, out: { c: 1.4142135624, angA: 45, angB: 45 }, tol: 1e-9 },
      { name: 'the other leg: a = 8, c = 17 give b = 15', in: { a: 8, b: '', c: 17 }, out: { b: 15 }, tol: 1e-9 },
      { name: 'hypotenuse not longer than the leg rejected', in: { a: '', b: 5, c: 5 }, error: 'c' },
      { name: 'all three sides entered rejected', in: { a: 3, b: 4, c: 5 }, error: 'c' },
      { name: 'only one side entered rejected', in: { a: 3, b: '', c: '' }, error: 'a' },
      { name: 'a zero side rejected', in: { a: 0, b: 4, c: '' }, error: 'a' }]),
  C('triangle-calculator', 'Triangle Calculator (Three Sides)', '37 Engineering Mathematics', 'Enter the three sides of any triangle and get its three angles, the area, the perimeter, the inscribed and circumscribed circle radii. Sides that cannot close into a triangle are rejected.',
    ['triangle calculator', 'triangle calculator three sides', 'sss triangle', 'triangle angles from sides', 'area of a triangle', 'heron\'s formula', 'herons formula calculator', 'law of cosines', 'law of cosines calculator', 'angles of a triangle', 'triangle area from three sides', 'scalene triangle'],
    [I('a', 'Side a', 'number', '', 7, { min: 0, max: 1e12, hint: 'Enter all three sides, in one consistent unit. The two shorter sides together must be longer than the longest.' }), I('b', 'Side b', 'number', '', 8, { min: 0, max: 1e12 }), I('c', 'Side c', 'number', '', 9, { min: 0, max: 1e12 })],
    [{ key: 'angA', label: 'Angle A, opposite side a (degrees)', dim: 'number', unit: '', prec: 8 }, { key: 'angB', label: 'Angle B, opposite side b (degrees)', dim: 'number', unit: '', prec: 8 }, { key: 'angC', label: 'Angle C, opposite side c (degrees)', dim: 'number', unit: '', prec: 8 },
      { key: 'area', label: 'Area (Heron\'s formula)', dim: 'number', unit: '', prec: 10 }, { key: 'perim', label: 'Perimeter', dim: 'number', unit: '', prec: 10 }, { key: 'inr', label: 'Inscribed circle radius (area / s)', dim: 'number', unit: '', prec: 10 }, { key: 'cir', label: 'Circumscribed circle radius (abc / 4 area)', dim: 'number', unit: '', prec: 10 }],
    's = (a + b + c) / 2     area = √(s (s − a)(s − b)(s − c))     cos A = (b² + c² − a²) / 2bc     A + B + C = 180°     inscribed radius = area / s     circumscribed radius = abc / (4 area)',
    ['The three sides must satisfy the triangle rule: each side is shorter than the sum of the other two. If the longest side equals the sum of the other two the triangle is flat and is rejected', 'Angles come from the law of cosines and always add up to 180°', 'The area is found with Heron\'s formula in a form that stays accurate for thin triangles', 'The tool works on plain numbers and does not track units: enter all three sides in the same unit; the area is in that unit squared', 'A warning is shown when the triangle is right-angled, as the Pythagorean theorem calculator then also applies'],
    'Use this to find the angles of a triangle you have measured with a tape, the area of a triangular plot or panel, or the angle between two cable runs from the three distances. For a right triangle with only two sides known use the Pythagorean theorem calculator.',
    ['pythagorean-theorem', 'trig-functions', 'circle-calculator', 'phasor-sum'],
    (i) => {
      const [a, b, c] = [i.a, i.b, i.c], w = [], s = (a + b + c) / 2;
      const [x, y, z] = [a, b, c].slice().sort((p, q) => q - p);
      const area = Math.sqrt((x + (y + z)) * (z - (x - y)) * (z + (x - y)) * (x + (y - z))) / 4;
      const ang = (p, q, r) => Math.acos(Math.max(-1, Math.min(1, (q * q + r * r - p * p) / (2 * q * r)))) * 180 / Math.PI;
      const angA = ang(a, b, c), angB = ang(b, a, c), angC = 180 - angA - angB;
      if (Math.abs(angA - 90) < 1e-9 || Math.abs(angB - 90) < 1e-9 || Math.abs(angC - 90) < 1e-9) w.push('This is a right triangle, so the Pythagorean theorem calculator also applies.');
      return { out: { angA, angB, angC, area, perim: a + b + c, inr: area / s, cir: a * b * c / (4 * area) }, warnings: w,
        steps: [`s = (a + b + c) / 2 = ${fmt(s, 10)}`, `Area = √(s (s − a)(s − b)(s − c)) = ${fmt(area, 10)}`, `Angle A = ${fmt(angA, 8)}°     Angle B = ${fmt(angB, 8)}°     Angle C = ${fmt(angC, 8)}°`, `Perimeter = ${fmt(a + b + c, 10)}     Inscribed radius = ${fmt(area / s, 10)}     Circumscribed radius = ${fmt(a * b * c / (4 * area), 10)}`],
        sentence: `The triangle with sides ${fmt(a, 6)}, ${fmt(b, 6)} and ${fmt(c, 6)} has angles ${fmt(angA, 6)}°, ${fmt(angB, 6)}° and ${fmt(angC, 6)}°, and an area of ${fmt(area, 6)}.` };
    },
    (v) => {
      const e = [];
      ['a', 'b', 'c'].forEach((k) => { if (!(v[k] > 0)) e.push({ key: k, msg: 'A side must be greater than zero' }); });
      if (e.length) return e;
      const t = [v.a, v.b, v.c].sort((p, q) => q - p);
      if (t[0] >= t[1] + t[2]) e.push({ key: 'c', msg: 'These sides cannot make a triangle: the longest side must be shorter than the other two added together' });
      return e;
    },
    [{ name: '3, 4, 5: angles 36.87°, 53.13°, 90°, area 6, radii 1 and 2.5', in: { a: 3, b: 4, c: 5 }, out: { angA: 36.8698976458, angB: 53.1301023542, angC: 90, area: 6, perim: 12, inr: 1, cir: 2.5 }, tol: 1e-8, warn: 'right triangle' },
      { name: 'equilateral 2, 2, 2: 60° each, area √3', in: { a: 2, b: 2, c: 2 }, out: { angA: 60, angB: 60, angC: 60, area: 1.7320508076, inr: 0.5773502692, cir: 1.1547005384 }, tol: 1e-8 },
      { name: '7, 8, 9: area √720', in: { a: 7, b: 8, c: 9 }, out: { area: 26.83281573, perim: 24 }, tol: 1e-8 },
      { name: 'sides in any order give the same triangle (9, 7, 8)', in: { a: 9, b: 7, c: 8 }, out: { area: 26.83281573 }, tol: 1e-8 },
      { name: 'flat triangle 1, 2, 3 rejected', in: { a: 1, b: 2, c: 3 }, error: 'c' },
      { name: 'impossible triangle 1, 2, 10 rejected', in: { a: 1, b: 2, c: 10 }, error: 'c' },
      { name: 'a zero side rejected', in: { a: 0, b: 4, c: 5 }, error: 'a' }]),
  C('circle-calculator', 'Circle Calculator (Radius, Diameter, Circumference, Area)', '37 Engineering Mathematics', 'Enter any one of the radius, diameter, circumference or area of a circle and get the other three. Useful for converting a conductor or pipe diameter to its cross-sectional area.',
    ['circle calculator', 'area of a circle', 'circle area calculator', 'circumference calculator', 'circumference of a circle', 'diameter to radius', 'radius to diameter', 'diameter to area', 'diameter to circumference', 'area to diameter', 'pi r squared', 'cross sectional area of a round conductor'],
    [{ key: 'k', label: 'The value you know', type: 'enum', options: [1, 2, 3, 4], def: 1, labels: { 1: 'Radius', 2: 'Diameter', 3: 'Circumference', 4: 'Area' } }, I('v', 'Value', 'number', '', 5, { min: 0, max: 1e12, hint: 'The size of the quantity chosen above, above zero, in one consistent unit (area in that unit squared).' })],
    [{ key: 'r', label: 'Radius', dim: 'number', unit: '', prec: 10 }, { key: 'd', label: 'Diameter', dim: 'number', unit: '', prec: 10 }, { key: 'circ', label: 'Circumference', dim: 'number', unit: '', prec: 10 }, { key: 'area', label: 'Area', dim: 'number', unit: '', prec: 10 }],
    'd = 2r     circumference = 2πr = πd     area = πr² = πd² / 4     r = circumference / 2π     r = √(area / π)',
    ['The shape is a perfect circle', 'Only the one value chosen is used; the others are worked out from it', 'The tool works on plain numbers and does not track units: area is in the unit of length squared, so a diameter in mm gives an area in mm²', 'For a stranded conductor the area found here is that of a solid round conductor of the same diameter, which is more than the copper area', 'π is taken to full double-precision accuracy'],
    'Use this to find the cross-sectional area of a solid round conductor or a pipe from its diameter, the length of wire around a drum or a coil turn, or the diameter that gives a required area. For wire gauges use the AWG and SWG converters, which also give the diameter and area of standard sizes.',
    ['pythagorean-theorem', 'triangle-calculator', 'wire-gauge-conversion', 'swg-wire'],
    (i) => {
      const v = i.v, k = i.k, P = Math.PI;
      const r = k === 1 ? v : k === 2 ? v / 2 : k === 3 ? v / (2 * P) : Math.sqrt(v / P);
      const d = 2 * r, circ = 2 * P * r, area = P * r * r, name = ['', 'radius', 'diameter', 'circumference', 'area'][k];
      return { out: { r, d, circ, area }, warnings: [],
        steps: [`Known: ${name} = ${fmt(v, 10)}`, `Radius r = ${fmt(r, 10)}     Diameter d = 2r = ${fmt(d, 10)}`, `Circumference = 2πr = ${fmt(circ, 10)}`, `Area = πr² = ${fmt(area, 10)}`],
        sentence: `A circle with ${name} ${fmt(v, 6)} has radius ${fmt(r, 6)}, diameter ${fmt(d, 6)}, circumference ${fmt(circ, 6)} and area ${fmt(area, 6)}.` };
    },
    (v) => { const e = []; if (!(v.v > 0)) e.push({ key: 'v', msg: 'The value must be greater than zero' }); return e; },
    [{ name: 'radius 5: diameter 10, circumference 31.4159, area 78.5398', in: { k: 1, v: 5 }, out: { r: 5, d: 10, circ: 31.4159265359, area: 78.5398163397 }, tol: 1e-9 },
      { name: 'diameter 10 gives the same circle', in: { k: 2, v: 10 }, out: { r: 5, circ: 31.4159265359, area: 78.5398163397 }, tol: 1e-9 },
      { name: 'circumference 2π gives radius 1', in: { k: 3, v: 6.283185307179586 }, out: { r: 1, d: 2, area: 3.1415926536 }, tol: 1e-9 },
      { name: 'area 100 gives radius 5.6419', in: { k: 4, v: 100 }, out: { r: 5.6418958354, d: 11.2837916709, circ: 35.4490770181 }, tol: 1e-8 },
      { name: 'a 2.5 mm² round conductor has a diameter of 1.784 mm', in: { k: 4, v: 2.5 }, out: { d: 1.7841241162 }, tol: 1e-8 },
      { name: 'zero rejected', in: { k: 1, v: 0 }, error: 'v' }]),
  C('area-calculator', 'Area Calculator (Rectangle, Trapezoid, Ellipse, Sector, Ring, Polygon)', '37 Engineering Mathematics', 'Choose a shape, enter its dimensions and get the area and, where the dimensions fix it, the perimeter. Covers the rectangle, triangle, trapezoid, parallelogram, ellipse, circular sector, ring and regular polygon.',
    ['area calculator', 'area calc', 'area of shapes', 'area of a rectangle', 'rectangle area', 'area of a trapezoid', 'trapezoid area calculator', 'area of a parallelogram', 'area of an ellipse', 'ellipse area and perimeter', 'area of a sector', 'sector area', 'area of a ring', 'annulus area', 'area of a regular polygon', 'area of a hexagon', 'panel area', 'floor area calculator', 'square metres'],
    [{ key: 's', label: 'Shape', type: 'enum', options: [1, 2, 3, 4, 5, 6, 7, 8], def: 1, labels: { 1: 'Rectangle', 2: 'Triangle (base and height)', 3: 'Trapezoid', 4: 'Parallelogram', 5: 'Ellipse', 6: 'Circular sector', 7: 'Ring (annulus)', 8: 'Regular polygon' } },
      I('x', 'First dimension', 'number', '', 6, { min: 0, max: 1e12, hint: 'Rectangle: length. Triangle: base. Trapezoid: first parallel side. Parallelogram: base. Ellipse: semi-axis a (half the long width). Sector: radius. Ring: outer radius. Polygon: number of sides (a whole number from 3 to 1000).' }),
      I('y', 'Second dimension', 'number', '', 4, { min: 0, max: 1e12, optional: true, hint: 'Rectangle: width. Triangle: height. Trapezoid: second parallel side. Parallelogram: height. Ellipse: semi-axis b. Sector: angle in degrees (up to 360). Ring: inner radius. Polygon: length of one side.' }),
      I('z', 'Third dimension', 'number', '', '', { min: 0, max: 1e12, optional: true, hint: 'Used only by the trapezoid, where it is the height between the two parallel sides. Leave it blank for every other shape.' })],
    [{ key: 'area', label: 'Area', dim: 'number', unit: '', prec: 10 }, { key: 'perim', label: 'Perimeter (shown where the dimensions fix it)', dim: 'number', unit: '', prec: 10 }],
    'rectangle = l w     triangle = b h / 2     trapezoid = (a + b) h / 2     parallelogram = b h     ellipse = π a b     sector = r² θ / 2     ring = π (R² − r²)     regular polygon = n s² / (4 tan(π / n))',
    ['Every dimension is in one consistent unit, and the area is in that unit squared: metres give square metres, millimetres give square millimetres', 'The perimeter is shown for the rectangle, ellipse, sector, ring and regular polygon, where the dimensions fix it. The triangle, trapezoid and parallelogram need their slanted sides, which are not entered, so the perimeter shows a dash; for a triangle with three known sides use the triangle calculator', 'The ellipse perimeter has no simple closed form; it is found with the arithmetic-geometric mean method and is accurate to many digits. The ring perimeter is both circles added together. The sector perimeter is the two radii plus the arc', 'Dimensions the chosen shape does not use are ignored and a note says so', 'The tool works on plain numbers and does not track units'],
    'Use this to find the floor area of a plant room, the area of a panel, a trench cross-section, a solar array footprint, the area of a tapered duct or cable trench, or the face of a hexagonal nut. For a circle use the circle calculator, and for a triangle from its three sides use the triangle calculator. For volumes and surface areas of solids use the volume and surface area calculator.',
    ['circle-calculator', 'triangle-calculator', 'volume-surface-area', 'pythagorean-theorem'],
    (i) => {
      const s = i.s, x = i.x, y = i.y, z = i.z, P = Math.PI, w = [];
      const used = { 1: 2, 2: 2, 3: 3, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2 }[s];
      let area, perim = null, name, st;
      if (s === 1) { area = x * y; perim = 2 * (x + y); name = 'rectangle'; st = [`Area = length × width = ${fmt(x, 10)} × ${fmt(y, 10)} = ${fmt(area, 10)}`, `Perimeter = 2 (length + width) = ${fmt(perim, 10)}`]; }
      else if (s === 2) { area = x * y / 2; name = 'triangle'; st = [`Area = base × height / 2 = ${fmt(x, 10)} × ${fmt(y, 10)} / 2 = ${fmt(area, 10)}`, 'The perimeter needs all three sides and is not shown']; }
      else if (s === 3) { area = (x + y) * z / 2; name = 'trapezoid'; st = [`Area = (a + b) × h / 2 = (${fmt(x, 10)} + ${fmt(y, 10)}) × ${fmt(z, 10)} / 2 = ${fmt(area, 10)}`, 'The perimeter needs the two slanted sides and is not shown']; }
      else if (s === 4) { area = x * y; name = 'parallelogram'; st = [`Area = base × height = ${fmt(x, 10)} × ${fmt(y, 10)} = ${fmt(area, 10)}`, 'The perimeter needs the slanted side and is not shown']; }
      else if (s === 5) {
        const a = Math.max(x, y), b = Math.min(x, y);
        let A = 1, B = b / a, c2 = 1 - B * B, sum = 0.5 * c2, pw = 1;
        for (let k = 0; k < 40 && Math.abs(A - B) > 1e-16 * A; k++) { const An = (A + B) / 2, Bn = Math.sqrt(A * B), c = (A - B) / 2; A = An; B = Bn; pw *= 2; sum += pw / 2 * c * c; }
        const E = P / (2 * A) * (1 - sum);
        area = P * x * y; perim = 4 * a * E; name = 'ellipse';
        st = [`Area = π a b = π × ${fmt(x, 10)} × ${fmt(y, 10)} = ${fmt(area, 10)}`, `Perimeter = 4 a E(e), with E found by the arithmetic-geometric mean = ${fmt(perim, 10)}`];
      }
      else if (s === 6) { const th = y * P / 180, arc = x * th; area = x * x * th / 2; perim = 2 * x + arc; name = 'circular sector'; st = [`Angle = ${fmt(y, 10)}° = ${fmt(th, 10)} rad     Arc length = r θ = ${fmt(arc, 10)}`, `Area = r² θ / 2 = ${fmt(area, 10)}`, `Perimeter = 2r + arc = ${fmt(perim, 10)}`]; }
      else if (s === 7) { area = P * (x - y) * (x + y); perim = 2 * P * (x + y); name = 'ring'; st = [`Area = π (R² − r²) = π (${fmt(x, 10)}² − ${fmt(y, 10)}²) = ${fmt(area, 10)}`, `Perimeter = 2π (R + r) = ${fmt(perim, 10)}`]; }
      else { area = x * y * y / (4 * Math.tan(P / x)); perim = x * y; name = 'regular polygon'; st = [`Area = n s² / (4 tan(π / n)) = ${fmt(x, 10)} × ${fmt(y, 10)}² / (4 tan(π / ${fmt(x, 10)})) = ${fmt(area, 10)}`, `Perimeter = n s = ${fmt(perim, 10)}`]; }
      if (used < 3 && z != null) w.push('The third dimension is not used for this shape and was ignored.');
      return { out: { area, perim }, warnings: w, steps: st,
        sentence: `The ${name} has an area of ${fmt(area, 6)}` + (perim == null ? '.' : ` and a perimeter of ${fmt(perim, 6)}.`) };
    },
    (v) => {
      const e = [], keys = ['x', 'y', 'z'].slice(0, v.s === 3 ? 3 : 2);
      keys.forEach((k) => { if (v[k] == null) e.push({ key: k, msg: 'Enter this dimension for the chosen shape' }); else if (!(v[k] > 0)) e.push({ key: k, msg: 'A dimension must be greater than zero' }); });
      if (e.length) return e;
      if (v.s === 6 && v.y > 360) e.push({ key: 'y', msg: 'The sector angle cannot be more than 360 degrees' });
      if (v.s === 7 && v.y >= v.x) e.push({ key: 'y', msg: 'The inner radius must be smaller than the outer radius' });
      if (v.s === 8 && (!Number.isInteger(v.x) || v.x < 3 || v.x > 1000)) e.push({ key: 'x', msg: 'The number of sides must be a whole number from 3 to 1000' });
      return e;
    },
    [{ name: 'rectangle 6 × 4: area 24, perimeter 20', in: { s: 1, x: 6, y: 4, z: '' }, out: { area: 24, perim: 20 }, tol: 1e-9 },
      { name: 'triangle base 10, height 3: area 15, no perimeter', in: { s: 2, x: 10, y: 3, z: '' }, out: { area: 15 }, tol: 1e-9 },
      { name: 'trapezoid 5, 7 and height 4: area 24', in: { s: 3, x: 5, y: 7, z: 4 }, out: { area: 24 }, tol: 1e-9 },
      { name: 'parallelogram base 8, height 3: area 24', in: { s: 4, x: 8, y: 3, z: '' }, out: { area: 24 }, tol: 1e-9 },
      { name: 'ellipse a 5, b 3: area 15π, perimeter 25.5270', in: { s: 5, x: 5, y: 3, z: '' }, out: { area: 47.1238898038, perim: 25.5269988634 }, tol: 1e-8 },
      { name: 'an ellipse with equal axes is a circle: a = b = 2 gives 4π and 4π', in: { s: 5, x: 2, y: 2, z: '' }, out: { area: 12.5663706144, perim: 12.5663706144 }, tol: 1e-9 },
      { name: 'quarter sector of radius 10: area 78.54, perimeter 35.708', in: { s: 6, x: 10, y: 90, z: '' }, out: { area: 78.5398163397, perim: 35.7079632679 }, tol: 1e-9 },
      { name: 'ring R 10, r 4: area 84π, perimeter 28π', in: { s: 7, x: 10, y: 4, z: '' }, out: { area: 263.8937829015, perim: 87.9645943005 }, tol: 1e-9 },
      { name: 'regular hexagon of side 2: area 6√3, perimeter 12', in: { s: 8, x: 6, y: 2, z: '' }, out: { area: 10.3923048454, perim: 12 }, tol: 1e-9 },
      { name: 'a square is a polygon with four sides: side 3 gives 9', in: { s: 8, x: 4, y: 3, z: '' }, out: { area: 9, perim: 12 }, tol: 1e-9 },
      { name: 'an unused third dimension is ignored with a note', in: { s: 1, x: 6, y: 4, z: 9 }, out: { area: 24 }, tol: 1e-9, warn: 'ignored' },
      { name: 'ring with the inner radius not smaller rejected', in: { s: 7, x: 4, y: 4, z: '' }, error: 'y' },
      { name: 'polygon with 2 sides rejected', in: { s: 8, x: 2, y: 3, z: '' }, error: 'x' },
      { name: 'polygon with 3.5 sides rejected', in: { s: 8, x: 3.5, y: 3, z: '' }, error: 'x' },
      { name: 'sector angle above 360 rejected', in: { s: 6, x: 5, y: 400, z: '' }, error: 'y' },
      { name: 'trapezoid without its height rejected', in: { s: 3, x: 5, y: 7, z: '' }, error: 'z' },
      { name: 'a zero dimension rejected', in: { s: 1, x: 0, y: 4, z: '' }, error: 'x' }]),
  C('volume-surface-area', 'Volume and Surface Area Calculator (Box, Cylinder, Sphere, Cone, Pipe)', '37 Engineering Mathematics', 'Choose a solid, enter its dimensions and get the volume, the total surface area and the curved or side surface area. Covers the box, cylinder, sphere, cone and hollow cylinder (pipe).',
    ['volume calculator', 'surface area calculator', 'volume and surface area', 'volume of a cylinder', 'volume of a sphere', 'volume of a cone', 'volume of a box', 'volume of a cuboid', 'volume of a pipe', 'surface area of a cylinder', 'surface area of a sphere', 'surface area of a cone', 'surface area of a box', 'tank volume', 'cylindrical tank capacity', 'cubic metres'],
    [{ key: 's', label: 'Solid', type: 'enum', options: [1, 2, 3, 4, 5], def: 2, labels: { 1: 'Box (cuboid)', 2: 'Cylinder', 3: 'Sphere', 4: 'Cone', 5: 'Hollow cylinder (pipe)' } },
      I('x', 'First dimension', 'number', '', 2, { min: 0, max: 1e12, hint: 'Box: length. Cylinder: radius. Sphere: radius. Cone: radius of the base. Hollow cylinder: outer radius.' }),
      I('y', 'Second dimension', 'number', '', 5, { min: 0, max: 1e12, optional: true, hint: 'Box: width. Cylinder: height. Cone: height. Hollow cylinder: inner radius. Leave it blank for a sphere.' }),
      I('z', 'Third dimension', 'number', '', '', { min: 0, max: 1e12, optional: true, hint: 'Box: height. Hollow cylinder: length. Leave it blank for the cylinder, sphere and cone.' })],
    [{ key: 'vol', label: 'Volume', dim: 'number', unit: '', prec: 10 }, { key: 'sa', label: 'Total surface area', dim: 'number', unit: '', prec: 10 }, { key: 'lat', label: 'Curved or side surface area (without the ends)', dim: 'number', unit: '', prec: 10 }],
    'box: V = l w h, S = 2 (lw + lh + wh)     cylinder: V = π r² h, S = 2π r (r + h)     sphere: V = 4π r³ / 3, S = 4π r²     cone: V = π r² h / 3, S = π r (r + √(r² + h²))     pipe: V = π (R² − r²) L',
    ['Every dimension is in one consistent unit; the volume is in that unit cubed and the surface area in that unit squared. Dimensions in metres give cubic metres, and one cubic metre is 1000 litres', 'The box side area is the four vertical faces; the cylinder and cone curved areas leave out the flat ends; for a sphere the curved area is the whole surface', 'The hollow cylinder (pipe) total surface counts the outer and inner curved surfaces and both ring-shaped ends; the volume is the material of the wall, not the bore', 'Dimensions the chosen solid does not use are ignored and a note says so', 'The tool works on plain numbers and does not track units; wall thickness is the outer radius minus the inner radius'],
    'Use this to find the capacity of a cylindrical tank or sump, the volume of concrete in a round foundation or a rectangular pad, the volume of a cable drum or duct section, the material in a pipe wall, or the paint or coating area of a pipe, tank or pole. For a flat shape use the area calculator, and for conductor or pipe cross-sections use the circle calculator.',
    ['area-calculator', 'circle-calculator', 'pythagorean-theorem', 'triangle-calculator'],
    (i) => {
      const s = i.s, x = i.x, y = i.y, z = i.z, P = Math.PI, w = [];
      const used = { 1: 3, 2: 2, 3: 1, 4: 2, 5: 3 }[s];
      let vol, sa, lat, name, st;
      if (s === 1) { vol = x * y * z; sa = 2 * (x * y + x * z + y * z); lat = 2 * z * (x + y); name = 'box'; st = [`Volume = l × w × h = ${fmt(x, 10)} × ${fmt(y, 10)} × ${fmt(z, 10)} = ${fmt(vol, 10)}`, `Total surface area = 2 (lw + lh + wh) = ${fmt(sa, 10)}`, `Side area (four vertical faces) = 2 h (l + w) = ${fmt(lat, 10)}`]; }
      else if (s === 2) { vol = P * x * x * y; sa = 2 * P * x * (x + y); lat = 2 * P * x * y; name = 'cylinder'; st = [`Volume = π r² h = π × ${fmt(x, 10)}² × ${fmt(y, 10)} = ${fmt(vol, 10)}`, `Total surface area = 2π r (r + h) = ${fmt(sa, 10)}`, `Curved area = 2π r h = ${fmt(lat, 10)}`]; }
      else if (s === 3) { vol = 4 * P * x * x * x / 3; sa = 4 * P * x * x; lat = sa; name = 'sphere'; st = [`Volume = 4π r³ / 3 = ${fmt(vol, 10)}`, `Surface area = 4π r² = ${fmt(sa, 10)}`]; }
      else if (s === 4) { const sl = Math.hypot(x, y); vol = P * x * x * y / 3; lat = P * x * sl; sa = lat + P * x * x; name = 'cone'; st = [`Slant height = √(r² + h²) = ${fmt(sl, 10)}`, `Volume = π r² h / 3 = ${fmt(vol, 10)}`, `Curved area = π r × slant = ${fmt(lat, 10)}     Total = curved + base π r² = ${fmt(sa, 10)}`]; }
      else { vol = P * (x - y) * (x + y) * z; lat = 2 * P * (x + y) * z; sa = lat + 2 * P * (x - y) * (x + y); name = 'hollow cylinder'; st = [`Wall volume = π (R² − r²) L = π (${fmt(x, 10)}² − ${fmt(y, 10)}²) × ${fmt(z, 10)} = ${fmt(vol, 10)}`, `Curved areas (outer + inner) = 2π (R + r) L = ${fmt(lat, 10)}`, `Total surface area = curved areas + two ring ends = ${fmt(sa, 10)}`]; }
      if (used < 3 && (y != null && used < 2 || z != null)) w.push('A dimension this solid does not use was ignored.');
      return { out: { vol, sa, lat }, warnings: w, steps: st,
        sentence: `The ${name} has a volume of ${fmt(vol, 6)} and a total surface area of ${fmt(sa, 6)}.` };
    },
    (v) => {
      const e = [], n = { 1: 3, 2: 2, 3: 1, 4: 2, 5: 3 }[v.s], keys = ['x', 'y', 'z'].slice(0, n);
      keys.forEach((k) => { if (v[k] == null) e.push({ key: k, msg: 'Enter this dimension for the chosen solid' }); else if (!(v[k] > 0)) e.push({ key: k, msg: 'A dimension must be greater than zero' }); });
      if (e.length) return e;
      if (v.s === 5 && v.y >= v.x) e.push({ key: 'y', msg: 'The inner radius must be smaller than the outer radius' });
      return e;
    },
    [{ name: 'box 2 × 3 × 4: volume 24, surface 52, sides 40', in: { s: 1, x: 2, y: 3, z: 4 }, out: { vol: 24, sa: 52, lat: 40 }, tol: 1e-9 },
      { name: 'cylinder r 2, h 5: volume 62.83, surface 87.96, curved 62.83', in: { s: 2, x: 2, y: 5, z: '' }, out: { vol: 62.8318530718, sa: 87.9645943005, lat: 62.8318530718 }, tol: 1e-9 },
      { name: 'sphere r 3: volume 36π, surface 36π', in: { s: 3, x: 3, y: '', z: '' }, out: { vol: 113.0973355292, sa: 113.0973355292, lat: 113.0973355292 }, tol: 1e-9 },
      { name: 'cone r 3, h 4 (slant 5): volume 12π, curved 15π, total 24π', in: { s: 4, x: 3, y: 4, z: '' }, out: { vol: 37.6991118431, lat: 47.1238898038, sa: 75.3982236862 }, tol: 1e-9 },
      { name: 'pipe R 5, r 3, L 10: wall volume 160π, total surface 192π', in: { s: 5, x: 5, y: 3, z: 10 }, out: { vol: 502.6548245744, lat: 502.6548245744, sa: 603.1857894892 }, tol: 1e-9 },
      { name: 'a cylinder tank 2 m radius, 5 m high holds 62.83 m³ (62,832 litres)', in: { s: 2, x: 2, y: 5, z: '' }, out: { vol: 62.8318530718 }, tol: 1e-9 },
      { name: 'an unused third dimension is ignored with a note', in: { s: 2, x: 2, y: 5, z: 9 }, out: { vol: 62.8318530718 }, tol: 1e-9, warn: 'ignored' },
      { name: 'pipe with the inner radius not smaller rejected', in: { s: 5, x: 3, y: 3, z: 10 }, error: 'y' },
      { name: 'box without its height rejected', in: { s: 1, x: 2, y: 3, z: '' }, error: 'z' },
      { name: 'a zero dimension rejected', in: { s: 3, x: 0, y: '', z: '' }, error: 'x' }]),
  C('slope-calculator', 'Slope Calculator (Gradient, Grade and Angle from Two Points)', '37 Engineering Mathematics', 'Enter two points and get the slope (rise over run), the grade in percent, the angle from the horizontal, the run per unit rise (the "1 in N" gradient), the length along the line and the y-intercept. Useful for cable trench falls, conduit runs, ramps and drainage.',
    ['slope calculator', 'slope', 'gradient calculator', 'gradient', 'grade calculator', 'percent grade', 'slope percentage', 'slope percent', 'rise over run', 'rise and run', 'slope of a line', 'slope formula', 'slope from two points', 'angle of slope', '1 in 20 gradient', 'trench fall', 'ramp slope', 'fall per metre', 'line equation from two points'],
    [I('x1', 'Point 1, x', 'number', '', 0, { min: -1e12, max: 1e12, hint: 'The horizontal position of the first point. Use the same unit for all four values; negative values are allowed.' }), I('y1', 'Point 1, y', 'number', '', 0, { min: -1e12, max: 1e12, hint: 'The vertical position (height) of the first point.' }),
      I('x2', 'Point 2, x', 'number', '', 20, { min: -1e12, max: 1e12 }), I('y2', 'Point 2, y', 'number', '', 1, { min: -1e12, max: 1e12 })],
    [{ key: 'm', label: 'Slope m (rise / run)', dim: 'number', unit: '', prec: 10 }, { key: 'grade', label: 'Grade (percent)', dim: 'number', unit: '', prec: 8 }, { key: 'ang', label: 'Angle from the horizontal (degrees)', dim: 'number', unit: '', prec: 8 }, { key: 'ratio', label: 'Run per unit rise (the N in 1 in N)', dim: 'number', unit: '', prec: 8 },
      { key: 'rise', label: 'Rise (y2 − y1)', dim: 'number', unit: '', prec: 10 }, { key: 'run', label: 'Run (x2 − x1)', dim: 'number', unit: '', prec: 10 }, { key: 'len', label: 'Length along the line', dim: 'number', unit: '', prec: 10 }, { key: 'b', label: 'y-intercept b (y at x = 0)', dim: 'number', unit: '', prec: 10 }],
    'm = (y₂ − y₁) / (x₂ − x₁)     grade = 100 m     angle = atan(m)     1 in N: N = run / rise     length = √(run² + rise²)     y = m x + b,  b = y₁ − m x₁',
    ['The two points are joined by a straight line and the slope is the same everywhere along it', 'Slope is rise divided by run. A positive slope rises from point 1 to point 2, a negative slope falls, and the order of the points does not change the slope', 'Grade is the slope as a percentage, so a grade of 5% rises 5 units for every 100 units of run. "1 in N" is the same gradient written as the run needed for one unit of rise', 'A vertical line (the two x values equal) has no defined slope, grade, 1-in-N or y-intercept; its angle is 90° and its length is still found. A level line has slope zero and no 1-in-N figure', 'The tool works on plain numbers and does not track units: enter all four values in the same unit; the slope, grade and angle do not depend on which unit that is', 'Identical points do not define a line and are rejected'],
    'Use this to check the fall on a cable trench or drain, the gradient of a conduit or cable-tray run, the pitch of a ramp or access road, or the slope between two surveyed levels. For the straight-line distance between the points use the distance calculator, and for a value between two known points use the linear interpolation calculator.',
    ['distance-calculator', 'linear-interpolation', 'pythagorean-theorem', 'trig-functions'],
    (i) => {
      const { x1, y1, x2, y2 } = i, dx = x2 - x1, dy = y2 - y1, w = [];
      const len = Math.hypot(dx, dy), vert = dx === 0, level = dy === 0;
      const m = vert ? null : dy / dx, ang = vert ? 90 : Math.atan2(dx > 0 ? dy : -dy, Math.abs(dx)) * 180 / Math.PI;
      const grade = vert ? null : 100 * m, ratio = level ? null : Math.abs(dx / dy), b = vert ? null : y1 - m * x1;
      if (vert) w.push('The line is vertical, so the slope, grade, 1-in-N figure and y-intercept are not defined.');
      else if (level) w.push('The line is level, so the slope is zero and there is no run per unit rise.');
      const st = [`Rise = y₂ − y₁ = ${fmt(y2, 10)} − ${fmt(y1, 10)} = ${fmt(dy, 10)}     Run = x₂ − x₁ = ${fmt(x2, 10)} − ${fmt(x1, 10)} = ${fmt(dx, 10)}`];
      if (vert) st.push('The run is zero, so the slope is undefined; the angle is 90°', `Length = √(run² + rise²) = ${fmt(len, 10)}`);
      else st.push(`Slope m = rise / run = ${fmt(m, 10)}     Grade = 100 m = ${fmt(grade, 8)}%`, `Angle = atan(m) = ${fmt(ang, 8)}°` + (level ? '' : `     Run per unit rise = ${fmt(ratio, 8)} (1 in ${fmt(ratio, 6)})`), `Length = √(run² + rise²) = ${fmt(len, 10)}     y-intercept b = y₁ − m x₁ = ${fmt(b, 10)}`);
      return { out: { m, grade, ang, ratio, rise: dy, run: dx, len, b }, warnings: w, steps: st,
        sentence: vert ? `The line from (${fmt(x1, 6)}, ${fmt(y1, 6)}) to (${fmt(x2, 6)}, ${fmt(y2, 6)}) is vertical and ${fmt(len, 6)} long.` : `The line from (${fmt(x1, 6)}, ${fmt(y1, 6)}) to (${fmt(x2, 6)}, ${fmt(y2, 6)}) has a slope of ${fmt(m, 6)}, a grade of ${fmt(grade, 6)}% and an angle of ${fmt(ang, 6)}° from the horizontal.` };
    },
    (v) => { const e = []; if (v.x1 === v.x2 && v.y1 === v.y2) e.push({ key: 'x2', msg: 'The two points are the same: enter two different points' }); return e; },
    [{ name: 'rise 1 over run 20: slope 0.05, grade 5%, 2.8624°, 1 in 20', in: { x1: 0, y1: 0, x2: 20, y2: 1 }, out: { m: 0.05, grade: 5, ang: 2.8624052262, ratio: 20, rise: 1, run: 20, len: 20.0249843945, b: 0 }, tol: 1e-8 },
      { name: '(0, 0) to (4, 3): slope 0.75, angle 36.87°, length 5', in: { x1: 0, y1: 0, x2: 4, y2: 3 }, out: { m: 0.75, grade: 75, ang: 36.8698976458, ratio: 1.3333333333, len: 5 }, tol: 1e-8 },
      { name: 'a falling line (0, 10) to (5, 0): slope −2, angle −63.43°, intercept 10', in: { x1: 0, y1: 10, x2: 5, y2: 0 }, out: { m: -2, grade: -200, ang: -63.4349488229, ratio: 0.5, rise: -10, run: 5, b: 10 }, tol: 1e-8 },
      { name: 'the order of the points does not change the slope: (4, 3) to (0, 0)', in: { x1: 4, y1: 3, x2: 0, y2: 0 }, out: { m: 0.75, ang: 36.8698976458, rise: -3, run: -4, len: 5 }, tol: 1e-8 },
      { name: 'a vertical line (2, 0) to (2, 5) is 90° and 5 long, with a note', in: { x1: 2, y1: 0, x2: 2, y2: 5 }, out: { ang: 90, len: 5, rise: 5, run: 0 }, tol: 1e-9, warn: 'vertical' },
      { name: 'a level line (0, 2) to (8, 2) has slope zero, with a note', in: { x1: 0, y1: 2, x2: 8, y2: 2 }, out: { m: 0, grade: 0, ang: 0, b: 2, len: 8 }, tol: 1e-9, warn: 'level' },
      { name: 'identical points rejected', in: { x1: 3, y1: 3, x2: 3, y2: 3 }, error: 'x2' }]),
  C('distance-calculator', 'Distance Calculator (Between Two Points, 2D or 3D)', '37 Engineering Mathematics', 'Enter the coordinates of two points and get the straight-line distance, the horizontal distance, the differences along each axis, the midpoint and the angle of the line above the horizontal. Leave z blank for a flat 2D drawing.',
    ['distance calculator', 'distance between two points', 'distance formula', 'distance between points', '2d distance', '3d distance', 'distance in 3d', 'euclidean distance', 'midpoint calculator', 'midpoint formula', 'midpoint between two points', 'straight line distance', 'length between two points', 'coordinate distance', 'point to point distance'],
    [I('x1', 'Point 1, x', 'number', '', 0, { min: -1e12, max: 1e12, hint: 'Use the same unit for every coordinate; negative values are allowed.' }), I('y1', 'Point 1, y', 'number', '', 0, { min: -1e12, max: 1e12 }), I('z1', 'Point 1, z (optional)', 'number', '', '', { min: -1e12, max: 1e12, optional: true, hint: 'The height or third coordinate. Leave it blank for a flat 2D drawing; a blank z is taken as 0.' }),
      I('x2', 'Point 2, x', 'number', '', 3, { min: -1e12, max: 1e12 }), I('y2', 'Point 2, y', 'number', '', 4, { min: -1e12, max: 1e12 }), I('z2', 'Point 2, z (optional)', 'number', '', '', { min: -1e12, max: 1e12, optional: true })],
    [{ key: 'dist', label: 'Distance between the points', dim: 'number', unit: '', prec: 10 }, { key: 'horiz', label: 'Horizontal distance (x and y only)', dim: 'number', unit: '', prec: 10 }, { key: 'dx', label: 'Difference in x', dim: 'number', unit: '', prec: 10 }, { key: 'dy', label: 'Difference in y', dim: 'number', unit: '', prec: 10 }, { key: 'dz', label: 'Difference in z', dim: 'number', unit: '', prec: 10 },
      { key: 'mx', label: 'Midpoint x', dim: 'number', unit: '', prec: 10 }, { key: 'my', label: 'Midpoint y', dim: 'number', unit: '', prec: 10 }, { key: 'mz', label: 'Midpoint z', dim: 'number', unit: '', prec: 10 }, { key: 'elev', label: 'Angle of the line above the horizontal (degrees)', dim: 'number', unit: '', prec: 8 }],
    'distance = √((x₂ − x₁)² + (y₂ − y₁)² + (z₂ − z₁)²)     horizontal = √(Δx² + Δy²)     midpoint = ((x₁ + x₂) / 2, (y₁ + y₂) / 2, (z₁ + z₂) / 2)     angle = atan(Δz / horizontal)',
    ['The distance is the straight line between the two points, not the length of a cable route that goes around obstacles, so a real cable needs an allowance on top', 'Every coordinate is in one consistent unit and the distance is in that same unit. Negative coordinates are allowed', 'A blank z is taken as 0, so leaving every z blank gives the 2D distance. If only one point has a z value a note says the blank one was taken as 0', 'The angle is measured up from the horizontal plane; it is negative when point 2 is lower than point 1, and is not defined when the two points are the same', 'The tool works on plain numbers and does not track units'],
    'Use this to find the straight-line distance between two positions on a site plan, the length of a diagonal cable or conduit run in 3D, the span between two poles or towers, or the midpoint of a run for placing a pull box. For the length along a right-angled path use the Pythagorean theorem calculator, and for the slope of the line use the slope calculator.',
    ['slope-calculator', 'pythagorean-theorem', 'vector-calculator', 'triangle-calculator'],
    (i) => {
      const x1 = i.x1, y1 = i.y1, x2 = i.x2, y2 = i.y2, z1 = i.z1 == null ? 0 : i.z1, z2 = i.z2 == null ? 0 : i.z2, w = [];
      const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1, horiz = Math.hypot(dx, dy), dist = Math.hypot(dx, dy, dz);
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, mz = (z1 + z2) / 2, elev = dist === 0 ? null : Math.atan2(dz, horiz) * 180 / Math.PI;
      if (dist === 0) w.push('The two points are the same, so the distance is zero.');
      if ((i.z1 == null) !== (i.z2 == null)) w.push('Only one point has a z value; the blank z was taken as 0.');
      return { out: { dist, horiz, dx, dy, dz, mx, my, mz, elev }, warnings: w,
        steps: [`Differences: Δx = ${fmt(dx, 10)}     Δy = ${fmt(dy, 10)}     Δz = ${fmt(dz, 10)}`, `Distance = √(Δx² + Δy² + Δz²) = ${fmt(dist, 10)}     Horizontal distance = √(Δx² + Δy²) = ${fmt(horiz, 10)}`, `Midpoint = (${fmt(mx, 10)}, ${fmt(my, 10)}, ${fmt(mz, 10)})`, elev == null ? 'The angle above the horizontal is not defined for identical points' : `Angle above the horizontal = atan(Δz / horizontal) = ${fmt(elev, 8)}°`],
        sentence: `The distance between (${fmt(x1, 6)}, ${fmt(y1, 6)}, ${fmt(z1, 6)}) and (${fmt(x2, 6)}, ${fmt(y2, 6)}, ${fmt(z2, 6)}) is ${fmt(dist, 6)}, and the midpoint is (${fmt(mx, 6)}, ${fmt(my, 6)}, ${fmt(mz, 6)}).` };
    },
    [{ name: '(0, 0) to (3, 4): distance 5, midpoint (1.5, 2)', in: { x1: 0, y1: 0, z1: '', x2: 3, y2: 4, z2: '' }, out: { dist: 5, horiz: 5, dx: 3, dy: 4, dz: 0, mx: 1.5, my: 2, mz: 0, elev: 0 }, tol: 1e-9 },
      { name: '3D (1, 2, 3) to (4, 6, 15): differences 3, 4, 12, distance 13, angle 67.38°', in: { x1: 1, y1: 2, z1: 3, x2: 4, y2: 6, z2: 15 }, out: { dist: 13, horiz: 5, dx: 3, dy: 4, dz: 12, mx: 2.5, my: 4, mz: 9, elev: 67.380135052 }, tol: 1e-8 },
      { name: 'negative coordinates (−2, −3) to (2, 0): distance 5', in: { x1: -2, y1: -3, z1: '', x2: 2, y2: 0, z2: '' }, out: { dist: 5, dx: 4, dy: 3, mx: 0, my: -1.5 }, tol: 1e-9 },
      { name: 'a lower second point gives a negative angle: (0, 0, 5) to (4, 3, 0)', in: { x1: 0, y1: 0, z1: 5, x2: 4, y2: 3, z2: 0 }, out: { dist: 7.0710678119, horiz: 5, dz: -5, elev: -45 }, tol: 1e-8 },
      { name: 'identical points give distance zero, with a note', in: { x1: 2, y1: 2, z1: '', x2: 2, y2: 2, z2: '' }, out: { dist: 0, horiz: 0 }, tol: 1e-9, warn: 'same' },
      { name: 'one blank z is taken as 0, with a note: (0, 0) to (0, 0, 5)', in: { x1: 0, y1: 0, z1: '', x2: 0, y2: 0, z2: 5 }, out: { dist: 5, elev: 90 }, tol: 1e-9, warn: 'blank' }]),
  C('probability-calculator', 'Probability Calculator (Two Events, A and B, and Repeated Trials)', '37 Engineering Mathematics', 'Enter the probability of two events and get the chance of both, either, neither, only one, and the conditional probabilities. Choose independent, mutually exclusive or overlapping events, and add a number of repeated trials to find the chance of at least one occurrence. Useful for reliability, redundancy and fault-chance estimates.',
    ['probability calculator', 'probability', 'probability of two events', 'probability of a and b', 'probability of a or b', 'probability a and b', 'probability a or b', 'independent events', 'mutually exclusive events', 'conditional probability', 'probability of at least one', 'at least one probability', 'probability of neither', 'probability of failure', 'reliability probability', 'chance of failure', 'redundancy probability', 'probability of both events', 'union and intersection'],
    [I('pa', 'Probability of event A', 'number', '', 0.3, { min: 0, max: 1, hint: 'A number from 0 to 1. For 30% enter 0.3. 0 means impossible and 1 means certain.' }), I('pb', 'Probability of event B', 'number', '', 0.5, { min: 0, max: 1, hint: 'A number from 0 to 1, in the same way as event A.' }),
      { key: 'rel', label: 'How A and B are related', type: 'enum', options: [1, 2, 3], def: 1, labels: { 1: 'Independent (one does not affect the other)', 2: 'Mutually exclusive (they cannot both happen)', 3: 'Overlapping, with P(A and B) known' } },
      I('pab', 'Probability of A and B together (overlapping events only)', 'number', '', '', { min: 0, max: 1, optional: true, hint: 'Used only when the events are overlapping. It cannot exceed the smaller of A and B, and cannot be less than P(A) + P(B) − 1.' }),
      I('n', 'Repeated independent trials of A', 'number', '', 5, { min: 1, max: 1e6, hint: 'A whole number. Gives the chance that A happens every time, and at least once, in this many independent trials.' })],
    [{ key: 'pand', label: 'P(A and B), both happen', dim: 'number', unit: '', prec: 10 }, { key: 'por', label: 'P(A or B), at least one happens', dim: 'number', unit: '', prec: 10 }, { key: 'pnone', label: 'P(neither A nor B)', dim: 'number', unit: '', prec: 10 }, { key: 'paonly', label: 'P(A but not B)', dim: 'number', unit: '', prec: 10 }, { key: 'pbonly', label: 'P(B but not A)', dim: 'number', unit: '', prec: 10 },
      { key: 'pnota', label: 'P(not A)', dim: 'number', unit: '', prec: 10 }, { key: 'pnotb', label: 'P(not B)', dim: 'number', unit: '', prec: 10 }, { key: 'pagb', label: 'P(A given B)', dim: 'number', unit: '', prec: 10 }, { key: 'pbga', label: 'P(B given A)', dim: 'number', unit: '', prec: 10 },
      { key: 'pall', label: 'P(A every time in n trials)', dim: 'number', unit: '', prec: 10 }, { key: 'pany', label: 'P(A at least once in n trials)', dim: 'number', unit: '', prec: 10 }],
    'independent: P(A and B) = P(A) P(B)     mutually exclusive: P(A and B) = 0     P(A or B) = P(A) + P(B) − P(A and B)     P(neither) = 1 − P(A or B)     P(A given B) = P(A and B) / P(B)     n trials: P(every time) = P(A)ⁿ, P(at least once) = 1 − (1 − P(A))ⁿ',
    ['Probabilities are numbers from 0 to 1 (multiply by 100 for a percentage); the events are well defined and their probabilities are known or estimated', 'Independent events do not affect each other, so the chance of both is the product. Two components that fail for unrelated reasons are independent; two that share a power supply are not', 'Mutually exclusive events cannot both happen, so the chance of either is the sum and the chance of both is zero; this needs P(A) + P(B) not above 1', 'For overlapping events you enter P(A and B) yourself. It must lie between the larger of 0 and P(A) + P(B) − 1 and the smaller of P(A) and P(B)', 'A conditional probability has no value when the event it is conditioned on has probability zero, and is shown as a dash with a note', 'The repeated-trials figures assume each trial is independent and has the same probability of A. They do not model wear-out, repair or common-cause failures'],
    'Use this to estimate the chance that two protective devices both fail, that at least one of several redundant units works, or that a fault event occurs at least once over a number of attempts. For the spread of a set of readings use the standard deviation calculator, and for the average of readings use the mean, median and mode calculator.',
    ['mean-median-mode', 'standard-deviation', 'percentage-calculator', 'ratio-calculator'],
    (i) => {
      const { pa, pb, rel, n } = i, w = [];
      const pand = rel === 1 ? pa * pb : rel === 2 ? 0 : i.pab;
      const por = pa + pb - pand, pnone = 1 - por, paonly = pa - pand, pbonly = pb - pand;
      const pagb = pb > 0 ? pand / pb : null, pbga = pa > 0 ? pand / pa : null;
      const pall = Math.pow(pa, n), pany = -Math.expm1(n * Math.log1p(-pa));
      if (pb === 0) w.push('P(B) is zero, so P(A given B) is not defined.');
      if (pa === 0) w.push('P(A) is zero, so P(B given A) is not defined.');
      const nm = rel === 1 ? 'Independent: P(A and B) = P(A) × P(B)' : rel === 2 ? 'Mutually exclusive: P(A and B) = 0' : 'Overlapping: P(A and B) entered as given';
      return { out: { pand, por, pnone, paonly, pbonly, pnota: 1 - pa, pnotb: 1 - pb, pagb, pbga, pall, pany }, warnings: w,
        steps: [`${nm} = ${fmt(pand, 10)}`, `P(A or B) = P(A) + P(B) − P(A and B) = ${fmt(pa, 10)} + ${fmt(pb, 10)} − ${fmt(pand, 10)} = ${fmt(por, 10)}`, `P(neither) = 1 − P(A or B) = ${fmt(pnone, 10)}     P(A but not B) = ${fmt(paonly, 10)}     P(B but not A) = ${fmt(pbonly, 10)}`,
          pagb == null ? 'P(A given B) is not defined because P(B) is zero' : `P(A given B) = P(A and B) / P(B) = ${fmt(pagb, 10)}`, pbga == null ? 'P(B given A) is not defined because P(A) is zero' : `P(B given A) = P(A and B) / P(A) = ${fmt(pbga, 10)}`,
          `In ${fmt(n, 10)} independent trials: P(A every time) = P(A)ⁿ = ${fmt(pall, 10)}     P(A at least once) = 1 − (1 − P(A))ⁿ = ${fmt(pany, 10)}`],
        sentence: `With P(A) = ${fmt(pa, 6)} and P(B) = ${fmt(pb, 6)}, the chance of both is ${fmt(pand, 6)}, the chance of at least one is ${fmt(por, 6)} and the chance of neither is ${fmt(pnone, 6)}.` };
    },
    (v) => {
      const e = [];
      if (v.n !== Math.round(v.n)) e.push({ key: 'n', msg: 'The number of trials must be a whole number' });
      if (v.rel === 2 && v.pa + v.pb > 1 + 1e-12) e.push({ key: 'pb', msg: 'Mutually exclusive events cannot have P(A) + P(B) above 1' });
      if (v.rel === 3) {
        if (v.pab == null) e.push({ key: 'pab', msg: 'Enter P(A and B) for overlapping events' });
        else if (v.pab > Math.min(v.pa, v.pb) + 1e-12) e.push({ key: 'pab', msg: 'P(A and B) cannot exceed the smaller of P(A) and P(B)' });
        else if (v.pab < v.pa + v.pb - 1 - 1e-12) e.push({ key: 'pab', msg: 'P(A and B) cannot be less than P(A) + P(B) − 1' });
      }
      return e;
    },
    [{ name: 'independent 0.3 and 0.5: both 0.15, either 0.65, neither 0.35, five trials', in: { pa: 0.3, pb: 0.5, rel: 1, pab: '', n: 5 }, out: { pand: 0.15, por: 0.65, pnone: 0.35, paonly: 0.15, pbonly: 0.35, pnota: 0.7, pnotb: 0.5, pagb: 0.3, pbga: 0.5, pall: 0.00243, pany: 0.83193 }, tol: 1e-9 },
      { name: 'mutually exclusive 0.2 and 0.5: both 0, either 0.7, neither 0.3', in: { pa: 0.2, pb: 0.5, rel: 2, pab: '', n: 1 }, out: { pand: 0, por: 0.7, pnone: 0.3, paonly: 0.2, pbonly: 0.5, pagb: 0, pbga: 0, pall: 0.2, pany: 0.2 }, tol: 1e-9 },
      { name: 'overlapping 0.6 and 0.5 with P(A and B) 0.4: either 0.7, A given B 0.8', in: { pa: 0.6, pb: 0.5, rel: 3, pab: 0.4, n: 2 }, out: { pand: 0.4, por: 0.7, pnone: 0.3, paonly: 0.2, pbonly: 0.1, pagb: 0.8, pbga: 0.6666666667, pall: 0.36, pany: 0.84 }, tol: 1e-9 },
      { name: 'two redundant units each failing with 0.01: both fail 0.0001', in: { pa: 0.01, pb: 0.01, rel: 1, pab: '', n: 1 }, out: { pand: 0.0001, por: 0.0199, pnone: 0.9801 }, tol: 1e-9 },
      { name: 'a certain event: P(A) = 1 gives at least once = 1', in: { pa: 1, pb: 0.25, rel: 1, pab: '', n: 3 }, out: { pand: 0.25, por: 1, pnone: 0, pall: 1, pany: 1 }, tol: 1e-9 },
      { name: 'P(B) = 0 leaves P(A given B) undefined, with a note', in: { pa: 0.4, pb: 0, rel: 1, pab: '', n: 1 }, out: { pand: 0, por: 0.4 }, tol: 1e-9, warn: 'P(B) is zero' },
      { name: 'exclusive events adding to more than 1 rejected', in: { pa: 0.7, pb: 0.5, rel: 2, pab: '', n: 1 }, error: 'pb' },
      { name: 'overlap above the smaller probability rejected', in: { pa: 0.3, pb: 0.5, rel: 3, pab: 0.4, n: 1 }, error: 'pab' },
      { name: 'overlap below P(A) + P(B) − 1 rejected', in: { pa: 0.8, pb: 0.7, rel: 3, pab: 0.3, n: 1 }, error: 'pab' },
      { name: 'overlapping events without P(A and B) rejected', in: { pa: 0.3, pb: 0.5, rel: 3, pab: '', n: 1 }, error: 'pab' },
      { name: 'a fractional number of trials rejected', in: { pa: 0.3, pb: 0.5, rel: 1, pab: '', n: 2.5 }, error: 'n' }]),
  C('permutations-combinations', 'Permutations and Combinations Calculator (nPr, nCr)', '37 Engineering Mathematics', 'Enter n items and a selection of r and get the number of permutations (order matters) and combinations (order does not matter), with and without repetition, plus n factorial. Useful for counting test sequences, switching arrangements, spare selections and address or code combinations.',
    ['permutations and combinations', 'permutation calculator', 'combination calculator', 'npr calculator', 'ncr calculator', 'nCr', 'nPr', 'permutation', 'combination', 'factorial calculator', 'n factorial', 'n choose r', 'combinations with repetition', 'permutations with repetition', 'counting arrangements', 'number of combinations', 'number of permutations', 'binomial coefficient'],
    [I('n', 'Number of items to choose from (n)', 'number', '', 10, { min: 1, max: 100, hint: 'A whole number from 1 to 100.' }), I('r', 'Number chosen (r)', 'number', '', 3, { min: 0, max: 100, hint: 'A whole number from 0 to 100. Without repetition r above n gives 0 ways, because you cannot pick more distinct items than there are.' })],
    [{ key: 'nfact', label: 'n! (n factorial)', dim: 'number', unit: '', prec: 10 }, { key: 'perm', label: 'Permutations nPr, order matters, no repeats', dim: 'number', unit: '', prec: 10 }, { key: 'comb', label: 'Combinations nCr, order does not matter, no repeats', dim: 'number', unit: '', prec: 10 },
      { key: 'permrep', label: 'Permutations with repetition (nʳ)', dim: 'number', unit: '', prec: 10 }, { key: 'combrep', label: 'Combinations with repetition, C(n + r − 1, r)', dim: 'number', unit: '', prec: 10 }],
    'n! = n × (n − 1) × … × 1     nPr = n! / (n − r)!     nCr = n! / (r! (n − r)!)     with repetition: permutations = nʳ, combinations = (n + r − 1)! / (r! (n − 1)!)',
    ['n and r are whole numbers; n is from 1 to 100 so that every result fits in a number (100! is about 9.3e157)', 'Permutations count different orders as different (ABC and CBA are two); combinations count them as one', 'Without repetition each item can be used once, so r above n gives 0 permutations and 0 combinations', 'With repetition an item may be chosen again; r may then be larger than n', 'Results are counted exactly with whole-number arithmetic and shown to 10 significant figures; the steps show every digit up to 40 digits', '0! is 1, and choosing 0 items can be done in exactly one way'],
    'Use this to count how many test sequences, switching orders or ways of selecting spare units there are, or how many keypad or breaker-label codes exist. For the chance of an outcome use the probability calculator, and for the chance of exactly k failures in n units use the binomial distribution calculator.',
    ['binomial-distribution', 'probability-calculator', 'mean-median-mode', 'fraction-calculator'],
    (i) => {
      const n = BigInt(i.n), r = BigInt(i.r), w = [];
      const fact = (m) => { let f = 1n; for (let j = 2n; j <= m; j++) f *= j; return f; };
      const choose = (a, b) => { if (b < 0n || b > a) return 0n; if (b > a - b) b = a - b; let c = 1n; for (let j = 1n; j <= b; j++) c = c * (a - b + j) / j; return c; };
      const nfact = fact(n), perm = r > n ? 0n : nfact / fact(n - r), comb = choose(n, r), permrep = n ** r, combrep = choose(n + r - 1n, r);
      if (r > n) w.push('r is larger than n, so there are no ways to choose r different items; the repetition figures are still valid.');
      const s = (b) => { const t = b.toString(); return t.length <= 40 ? t : fmt(Number(b), 10); };
      return { out: { nfact: Number(nfact), perm: Number(perm), comb: Number(comb), permrep: Number(permrep), combrep: Number(combrep) }, warnings: w,
        steps: [`n! = ${i.n}! = ${s(nfact)}`, r > n ? 'nPr and nCr are 0 because r is larger than n' : `nPr = n! / (n − r)! = ${s(perm)}     nCr = n! / (r! (n − r)!) = ${s(comb)}`, `With repetition: nʳ = ${s(permrep)}     C(n + r − 1, r) = ${s(combrep)}`],
        sentence: `Choosing ${i.r} from ${i.n} gives ${s(perm)} permutations and ${s(comb)} combinations without repetition, and ${s(permrep)} permutations and ${s(combrep)} combinations with repetition.` };
    },
    (v) => {
      const e = [];
      if (v.n !== Math.round(v.n)) e.push({ key: 'n', msg: 'n must be a whole number' });
      if (v.r !== Math.round(v.r)) e.push({ key: 'r', msg: 'r must be a whole number' });
      return e;
    },
    [{ name: '10 choose 3: 720 permutations, 120 combinations, 1000 with repeats, 220 combinations with repeats', in: { n: 10, r: 3 }, out: { nfact: 3628800, perm: 720, comb: 120, permrep: 1000, combrep: 220 }, tol: 1e-12 },
      { name: '52 cards, 5 chosen: 2,598,960 hands', in: { n: 52, r: 5 }, out: { comb: 2598960, perm: 311875200 }, tol: 1e-12 },
      { name: 'choosing none: one way', in: { n: 6, r: 0 }, out: { perm: 1, comb: 1, permrep: 1, combrep: 1 }, tol: 1e-12 },
      { name: 'choosing all: n! permutations, one combination', in: { n: 5, r: 5 }, out: { nfact: 120, perm: 120, comb: 1, permrep: 3125, combrep: 126 }, tol: 1e-12 },
      { name: 'r above n: zero without repetition, with a note', in: { n: 3, r: 5 }, out: { perm: 0, comb: 0, permrep: 243, combrep: 21 }, tol: 1e-12, warn: 'larger than n' },
      { name: '100! is about 9.3326e157', in: { n: 100, r: 1 }, out: { nfact: 9.332621544394415e157, perm: 100, comb: 100 }, tol: 1e-12 },
      { name: 'a fractional r rejected', in: { n: 10, r: 2.5 }, error: 'r' },
      { name: 'a fractional n rejected', in: { n: 10.5, r: 2 }, error: 'n' }]),
  C('binomial-distribution', 'Binomial Distribution Calculator (Exactly k, At Most, At Least)', '37 Engineering Mathematics', 'Enter the number of independent trials, the chance of success in one trial and k, and get the chance of exactly k, fewer than k, at most k, more than k and at least k successes, with the mean and standard deviation. Useful for k-out-of-n redundancy, lamp failure counts and defect sampling.',
    ['binomial distribution', 'binomial', 'at least k', 'at most k', 'exactly k', 'binomial probability', 'binomial calculator', 'binomial distribution calculator', 'binomial probability calculator', 'probability of exactly k', 'probability of at least k', 'probability of at most k', 'k out of n', 'k out of n redundancy', 'bernoulli trials', 'number of successes', 'number of failures', 'lamp failure probability', 'defect probability', 'cumulative binomial', 'binompdf', 'binomcdf'],
    [I('n', 'Number of independent trials (n)', 'number', '', 20, { min: 1, max: 1000, hint: 'A whole number from 1 to 1000, such as the number of lamps, units or samples.' }), I('p', 'Probability of success in one trial (p)', 'number', '', 0.05, { min: 0, max: 1, hint: 'A number from 0 to 1. For 5% enter 0.05. Use the chance of the event you are counting, for example a lamp failing.' }), I('k', 'Number of successes (k)', 'number', '', 2, { min: 0, max: 1000, hint: 'A whole number from 0 to n. A success is the event with probability p.' })],
    [{ key: 'pk', label: 'P(X = k), exactly k', dim: 'number', unit: '', prec: 10 }, { key: 'plt', label: 'P(X < k), fewer than k', dim: 'number', unit: '', prec: 10 }, { key: 'ple', label: 'P(X ≤ k), at most k', dim: 'number', unit: '', prec: 10 }, { key: 'pgt', label: 'P(X > k), more than k', dim: 'number', unit: '', prec: 10 }, { key: 'pge', label: 'P(X ≥ k), at least k', dim: 'number', unit: '', prec: 10 },
      { key: 'mean', label: 'Mean number of successes (n p)', dim: 'number', unit: '', prec: 10 }, { key: 'var', label: 'Variance (n p (1 − p))', dim: 'number', unit: '', prec: 10 }, { key: 'sd', label: 'Standard deviation', dim: 'number', unit: '', prec: 10 }],
    'P(X = k) = nCk pᵏ (1 − p)ⁿ⁻ᵏ     P(X ≤ k) = sum of P(X = j) for j = 0 to k     mean = n p     variance = n p (1 − p)',
    ['Each of the n trials is independent, has only two outcomes, and has the same probability p of success', 'Units that share a power supply, a cable or a cause of failure are not independent, so the result is optimistic for them', 'The tail figures are added up term by term, not found as 1 minus the other side, so a very small tail keeps its precision', 'Terms are calculated from sums of logarithms, accurate to about 12 significant figures for n up to 1000', 'k must be a whole number from 0 to n', 'The model has no wear-out, repair or ageing: p is the same for every trial'],
    'For a k-out-of-n system, count a unit that works as a success: the chance that at least k of n units work is the P(X ≥ k) result. For the number of ways to pick k items use the permutations and combinations calculator, and for two events use the probability calculator.',
    ['permutations-combinations', 'probability-calculator', 'standard-deviation', 'percentage-calculator'],
    (i) => {
      const { n, p, k } = i, w = [];
      const lf = [0]; for (let j = 1; j <= n; j++) lf.push(lf[j - 1] + Math.log(j));
      const pmf = (j) => {
        if (p === 0) return j === 0 ? 1 : 0;
        if (p === 1) return j === n ? 1 : 0;
        return Math.exp(lf[n] - lf[j] - lf[n - j] + j * Math.log(p) + (n - j) * Math.log1p(-p));
      };
      let plt = 0, ple = 0, pgt = 0, pge = 0, pk = pmf(k);
      for (let j = 0; j <= k - 1; j++) plt += pmf(j);
      for (let j = n; j >= k + 1; j--) pgt += pmf(j);
      ple = plt + pk; pge = pgt + pk;
      const mean = n * p, vr = n * p * (1 - p);
      if (p === 0 || p === 1) w.push('p is 0 or 1, so the outcome is certain and the whole probability sits on one value of k.');
      return { out: { pk, plt, ple, pgt, pge, mean, var: vr, sd: Math.sqrt(vr) }, warnings: w,
        steps: [`P(X = k) = nCk pᵏ (1 − p)ⁿ⁻ᵏ = ${fmt(pk, 10)}   (n = ${fmt(n, 10)}, p = ${fmt(p, 10)}, k = ${fmt(k, 10)})`, `P(X ≤ k) = ${fmt(ple, 10)}     P(X < k) = ${fmt(plt, 10)}`, `P(X ≥ k) = ${fmt(pge, 10)}     P(X > k) = ${fmt(pgt, 10)}`, `Mean = n p = ${fmt(mean, 10)}     Variance = n p (1 − p) = ${fmt(vr, 10)}     Standard deviation = ${fmt(Math.sqrt(vr), 10)}`],
        sentence: `In ${fmt(n, 6)} trials with success probability ${fmt(p, 6)}, the chance of exactly ${fmt(k, 6)} successes is ${fmt(pk, 6)}, of at most ${fmt(k, 6)} is ${fmt(ple, 6)} and of at least ${fmt(k, 6)} is ${fmt(pge, 6)}.` };
    },
    (v) => {
      const e = [];
      if (v.n !== Math.round(v.n)) e.push({ key: 'n', msg: 'The number of trials must be a whole number' });
      if (v.k !== Math.round(v.k)) e.push({ key: 'k', msg: 'k must be a whole number' });
      else if (v.k > v.n) e.push({ key: 'k', msg: 'k cannot be larger than the number of trials' });
      return e;
    },
    [{ name: 'n = 10, p = 0.5, k = 5: exactly 5 is 252/1024', in: { n: 10, p: 0.5, k: 5 }, out: { pk: 0.24609375, ple: 0.623046875, pge: 0.623046875, plt: 0.376953125, pgt: 0.376953125, mean: 5, var: 2.5 }, tol: 1e-9 },
      { name: '20 lamps, p = 0.05, k = 2: exactly 2 fail 0.1887', in: { n: 20, p: 0.05, k: 2 }, out: { pk: 0.18867680, mean: 1, var: 0.95 }, tol: 1e-6 },
      { name: 'n = 3, p = 0.1, k = 0: all three work 0.729', in: { n: 3, p: 0.1, k: 0 }, out: { pk: 0.729, plt: 0, ple: 0.729, pgt: 0.271, pge: 1 }, tol: 1e-9 },
      { name: 'k = n: all succeed, p^n', in: { n: 4, p: 0.5, k: 4 }, out: { pk: 0.0625, pgt: 0, pge: 0.0625, ple: 1 }, tol: 1e-9 },
      { name: 'p = 0: certain zero successes, with a note', in: { n: 8, p: 0, k: 0 }, out: { pk: 1, pge: 1, mean: 0 }, tol: 1e-9, warn: 'certain' },
      { name: 'p = 1: certain n successes, with a note', in: { n: 8, p: 1, k: 8 }, out: { pk: 1, plt: 0, pgt: 0 }, tol: 1e-9, warn: 'certain' },
      { name: 'k above n rejected', in: { n: 5, p: 0.5, k: 6 }, error: 'k' },
      { name: 'a fractional number of trials rejected', in: { n: 5.5, p: 0.5, k: 2 }, error: 'n' }]),
  C('trig-functions', 'Trigonometry (Sin, Cos, Tan)', '37 Engineering Mathematics', 'Find the sine, cosine, tangent, cosecant, secant and cotangent of an angle given in degrees or radians. Exact values are returned at 0°, 90°, 180° and 270°, and a value that is not defined is shown as a dash with the reason.',
    ['trigonometry', 'trigonometry calculator', 'trig calculator', 'sin cos tan', 'sine calculator', 'cosine calculator', 'tangent calculator', 'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'degrees to radians', 'radians to degrees', 'angle in radians', 'trig functions', 'power factor angle'],
    [I('x', 'Angle', 'number', '', 30, { hint: 'Any angle, positive or negative, including more than one full turn. Choose degrees or radians below.' }),
      { key: 'u', label: 'Angle unit', type: 'enum', options: [1, 2], def: 1, labels: { 1: 'Degrees (°)', 2: 'Radians (rad)' } }],
    [{ key: 'sin', label: 'sin θ', dim: 'number', unit: '', prec: 6 }, { key: 'cos', label: 'cos θ', dim: 'number', unit: '', prec: 6 }, { key: 'tan', label: 'tan θ', dim: 'number', unit: '', prec: 6 },
      { key: 'csc', label: 'csc θ (1 / sin θ)', dim: 'number', unit: '', prec: 6 }, { key: 'sec', label: 'sec θ (1 / cos θ)', dim: 'number', unit: '', prec: 6 }, { key: 'cot', label: 'cot θ (1 / tan θ)', dim: 'number', unit: '', prec: 6 },
      { key: 'deg', label: 'Angle in degrees', dim: 'number', unit: '', prec: 6 }, { key: 'rad', label: 'Angle in radians', dim: 'number', unit: '', prec: 6 }, { key: 'red', label: 'Equivalent angle from 0° to 360°', dim: 'number', unit: '', prec: 6 }],
    'sin θ = opposite / hypotenuse     cos θ = adjacent / hypotenuse     tan θ = sin θ / cos θ     csc = 1 / sin     sec = 1 / cos     cot = cos / sin     radians = degrees × π / 180',
    ['The angle is measured counter-clockwise from the positive x axis, so a negative angle turns clockwise', 'Choose the unit that matches your angle: 30 means 30° in degrees mode and 30 rad in radians mode', 'An angle within 1e-9° of a multiple of 90° is treated as exactly that multiple, so cos 90° is 0 and not 6e-17', 'Where a function is not defined (tan and sec at 90° and 270°, cot and csc at 0° and 180°) the result is a dash', 'Angles beyond ±1,000,000,000° are rejected because the angle itself is no longer held with enough precision'],
    'Use this for the angle of an impedance or a power factor (cos θ), for resolving a force or a phasor into components, and for a quick check on a rectangular to polar conversion. For a power factor angle from a known power factor, take the inverse cosine on a scientific calculator. To work with complex numbers use the complex number calculator; to add phasors use the phasor sum calculator.',
    ['complex-number', 'phasor-sum', 'impedance-rlc', 'pf-correction-kvar'],
    (i) => {
      const r2d = 180 / Math.PI, deg = i.u === 1 ? i.x : i.x * r2d, w = [];
      let red = ((deg % 360) + 360) % 360;
      const q = Math.round(red / 90), snapped = Math.abs(red - q * 90) < 1e-9;
      if (snapped) red = (q % 4) * 90;
      const S = [0, 1, 0, -1], Cc = [1, 0, -1, 0];
      const sn = snapped ? S[q % 4] : Math.sin(red / r2d), cs = snapped ? Cc[q % 4] : Math.cos(red / r2d);
      const tn = cs === 0 ? NaN : sn / cs, sc = cs === 0 ? NaN : 1 / cs, cc = sn === 0 ? NaN : 1 / sn, ct = sn === 0 ? NaN : cs / sn;
      if (cs === 0) w.push('cos θ is 0 at this angle, so tan θ and sec θ are not defined and are shown as a dash.');
      if (sn === 0) w.push('sin θ is 0 at this angle, so cot θ and csc θ are not defined and are shown as a dash.');
      const how = [];
      if (i.u === 2) how.push(`Angle in degrees = ${fmt(i.x, 6)} rad × 180 / π = ${fmt(deg, 6)}°`);
      if (Math.abs(deg) >= 360 || deg < 0) how.push(`Equivalent angle from 0° to 360° = ${fmt(red, 6)}°`);
      how.push(`sin θ = ${fmt(sn, 6)}     cos θ = ${fmt(cs, 6)}`, cs === 0 ? 'tan θ = sin θ / cos θ is not defined because cos θ = 0' : `tan θ = sin θ / cos θ = ${fmt(sn, 6)} / ${fmt(cs, 6)} = ${fmt(tn, 6)}`,
        `Check: sin² θ + cos² θ = ${fmt(sn * sn, 6)} + ${fmt(cs * cs, 6)} = ${fmt(sn * sn + cs * cs, 6)}`);
      return { out: { sin: sn, cos: cs, tan: tn, csc: cc, sec: sc, cot: ct, deg, rad: deg / r2d, red }, steps: how, warnings: w,
        sentence: `For an angle of ${fmt(deg, 4)}° (${fmt(deg / r2d, 4)} rad): sin = ${fmt(sn, 4)}, cos = ${fmt(cs, 4)} and tan = ${cs === 0 ? 'not defined' : fmt(tn, 4)}.` };
    },
    (v) => (Math.abs(v.u === 1 ? v.x : v.x * 180 / Math.PI) > 1e9 ? [{ key: 'x', msg: 'The angle must be within ±1,000,000,000 degrees, beyond which it is no longer held with enough precision' }] : []),
    [{ name: '30° gives sin 0.5, cos 0.866, tan 0.5774 (defaults)', in: { x: 30, u: 1 }, out: { sin: 0.5, cos: 0.8660254038, tan: 0.5773502692, csc: 2, sec: 1.154700538, cot: 1.732050808, deg: 30, rad: 0.5235987756, red: 30 }, tol: 1e-8 },
      { name: '45° gives sin = cos = 0.7071', in: { x: 45, u: 1 }, out: { sin: 0.7071067812, cos: 0.7071067812, tan: 1 }, tol: 1e-8 },
      { name: 'π/3 rad is 60°', in: { x: 1.0471975511966, u: 2 }, out: { sin: 0.8660254038, cos: 0.5, deg: 60 }, tol: 1e-8 },
      { name: 'π/2 rad gives cos exactly 0 and tan not defined', in: { x: 1.5707963267949, u: 2 }, out: { sin: 1, cos: 0, red: 90 }, tol: 1e-9, warn: 'tan θ and sec θ are not defined' },
      { name: '180° gives sin exactly 0 and cot not defined', in: { x: 180, u: 1 }, out: { sin: 0, cos: -1, tan: 0 }, tol: 1e-12, warn: 'cot θ and csc θ are not defined' },
      { name: '−30° is the same as 330°', in: { x: -30, u: 1 }, out: { sin: -0.5, cos: 0.8660254038, red: 330 }, tol: 1e-8 },
      { name: '750° is 30° plus two turns', in: { x: 750, u: 1 }, out: { sin: 0.5, red: 30 }, tol: 1e-8 },
      { name: '270° gives sin −1 and cos 0', in: { x: 270, u: 1 }, out: { sin: -1, cos: 0, csc: -1 }, tol: 1e-12, warn: 'not defined' },
      { name: 'power factor angle: cos 25.84° is about 0.9', in: { x: 25.84193276, u: 1 }, out: { cos: 0.9 }, tol: 1e-7 },
      { name: 'angle beyond 1e9 degrees rejected', in: { x: 2e9, u: 1 }, error: 'x' }]),
);
/* Null-prototype map: ids such as 'constructor' or '__proto__' must not resolve to inherited Object properties (v1.9.3). */
const BY_ID = Object.create(null);
CALCS.forEach((c) => (BY_ID[c.id] = c));
/* Guardrail tests (v1.2) */
BY_ID['cable-size-vd'].tests.push(
  { name: '400 A over 5 m is flagged as unsafe', in: { I: [400.94, 'A'], L: [5, 'm'], V: [400, 'V'], lim: 3, pf: 0.9, mat: 1, ins: 2, X: [0.08, 'Ω/km'], phase: 3 }, out: { Astd: 6 }, tol: 0, warn: 'DANGER' },
  { name: 'normal run is not flagged as dangerous', in: { I: [401.9, 'A'], L: [180, 'm'], V: [400, 'V'], lim: 3, pf: 0.9, mat: 1, ins: 2, X: [0.08, 'Ω/km'], phase: 3 }, out: { Astd: 400 }, tol: 0, noWarn: 'DANGER' },
  { name: 'result always carries the voltage-drop-only notice', in: { I: [100, 'A'], L: [50, 'm'], V: [400, 'V'], lim: 3, pf: 0.9, mat: 1, ins: 2, X: [0.08, 'Ω/km'], phase: 3 }, out: { Astd: 16 }, tol: 0, warn: 'Voltage-drop size only' });
BY_ID['three-phase-current'].tests.push(
  { name: '10^9 kW is flagged as implausible', in: { P: [1e9, 'kW'], V: [400, 'V'], pf: 0.9 }, out: { I: 1603750747.75 }, tol: 1e-6, warn: 'power above 5 GW' },
  { name: '0.001 V on a power circuit is flagged', in: { P: [100, 'kW'], V: [0.001, 'V'], pf: 0.9 }, out: {}, tol: 0, warn: 'below 12 V' },
  { name: 'PF 0.3 is flagged', in: { P: [100, 'kW'], V: [400, 'V'], pf: 0.3 }, out: {}, tol: 0, warn: 'below 0.5' },
  { name: 'ordinary inputs raise no unusual-value warning', in: { P: [100, 'kW'], V: [400, 'V'], pf: 0.9 }, out: {}, tol: 0, noWarn: 'Unusual value' });

/* ---------- Validation and calculation ---------- */
function defaultsRaw(def) {
  const r = {};
  def.inputs.forEach((s) => { r[s.key] = s.type === 'enum' ? s.def : [s.def, s.unit]; });
  return r;
}

function parse(def, raw) {
  const vals = {}, errors = [];
  for (const s of def.inputs) {
    if (s.type === 'enum') {
      const v = raw && raw[s.key] != null ? Number(raw[s.key]) : s.def;
      if (s.options.indexOf(v) < 0) errors.push({ key: s.key, msg: s.label + ' must be one of ' + s.options.join(', ') });
      vals[s.key] = v; continue;
    }
    let r = raw ? raw[s.key] : undefined; if (r === undefined) r = [s.def, s.unit];
    let v, u = s.unit;
    if (Array.isArray(r)) { v = r[0]; u = r[1]; } else if (r && typeof r === 'object') { v = r.v; u = r.u; } else v = r;
    if (v === '' || v == null || (typeof v === 'number' && isNaN(v))) { if (!s.optional) errors.push({ key: s.key, msg: s.label + ' is required' }); continue; }
    const rn = readNumber(v);
    if (rn.empty) { if (!s.optional) errors.push({ key: s.key, msg: s.label + ' is required' }); continue; }
    if (rn.err) { errors.push({ key: s.key, msg: s.label + ' ' + rn.err }); continue; }
    v = rn.v;
    const f = Object.prototype.hasOwnProperty.call(UNITS[s.dim].units, u) ? UNITS[s.dim].units[u] : null;
    if (f == null) { errors.push({ key: s.key, msg: 'Unit ' + u + ' is not valid for ' + s.label }); continue; }
    const b = v * f, dm = s.unit ? ' ' + s.unit : '';
    if (s.min != null && (s.exMin ? b <= s.min : b < s.min)) { errors.push({ key: s.key, msg: s.label + ' must be ' + (s.exMin ? 'greater than ' : 'at least ') + fmt(s.min / FACTOR[s.unit], 4) + dm }); continue; }
    if (s.max != null && (s.exMax ? b >= s.max : b > s.max)) { errors.push({ key: s.key, msg: s.label + ' must be ' + (s.exMax ? 'less than ' : 'at most ') + fmt(s.max / FACTOR[s.unit], 4) + dm }); continue; }
    vals[s.key] = b;
  }
  return { vals, errors };
}

/* Soft plausibility checks: these warn, they never block. Hard errors stay for impossible values only. */
const CEIL = { power: [5e9, 'power above 5 GW'], apparent: [5e9, 'apparent power above 5 GVA'], current: [1e6, 'current above 1 MA'], voltage: [1.5e6, 'voltage above 1.5 MV'] };
function plausibility(def, v) {
  const w = [], hasPower = def.inputs.some((s) => s.dim === 'power' || s.dim === 'apparent');
  def.inputs.forEach((s) => {
    if (s.type === 'enum' || v[s.key] == null) return;
    const c = CEIL[s.dim];
    if (c && v[s.key] > c[0]) w.push('Unusual value: ' + s.label.toLowerCase() + ' is ' + c[1] + '. Check the units.');
    if (s.dim === 'voltage' && hasPower && v[s.key] < 12) w.push('Unusual value: ' + s.label.toLowerCase() + ' is below 12 V for a power calculation. Check the units (V or kV).');
    if (s.key === 'pf' && v[s.key] < 0.5) w.push('Unusual value: power factor below 0.5 is very rare on a real circuit.');
  });
  return w;
}
function calculate(def, raw) {
  const p = parse(def, raw);
  if (p.errors.length) return { ok: false, errors: p.errors };
  const extra = def.check ? def.check(p.vals) : [];
  if (extra.length) return { ok: false, errors: extra };
  const r = def.compute(p.vals);
  r.warnings = (r.warnings || []).concat(plausibility(def, p.vals));
  const outputs = def.outputs.map((o) => Object.assign({}, o, { value: r.out[o.key] }, r.outMeta && r.outMeta[o.key]));
  /* A result that is too large to hold, or a division by zero, shows as a dash. Say why, unless a more specific warning already does. */
  if (!r.warnings.length && outputs.some((o) => typeof o.value === 'number' && !isFinite(o.value))) r.warnings.push('A result is outside the range this calculator can show (a number too large or too small, or a division by zero). The dash means no value. Check the units and the values entered.');
  return { ok: true, inputs: p.vals, outputs, steps: r.steps, warnings: r.warnings, sentence: r.sentence };
}

const show = (o, unit) => (o.value == null || isNaN(o.value) ? '—' : (o.prefix || '') + fmt(o.value / FACTOR[unit == null ? o.unit : unit], o.prec));

/* ---------- Test runner: reference cases plus generated unit-switch and invalid-input tests ---------- */
function runCase(def, t) {
  const r = calculate(def, t.in);
  if (t.error) return { name: t.name, kind: 'reference', pass: !r.ok && r.errors.some((e) => e.key === t.error), detail: r.ok ? 'accepted invalid input' : r.errors.map((e) => e.key).join(',') };
  if (!r.ok) return { name: t.name, kind: 'reference', pass: false, detail: r.errors.map((e) => e.msg).join('; ') };
  if (t.warn && !r.warnings.some((w) => w.indexOf(t.warn) >= 0)) return { name: t.name, kind: 'reference', pass: false, detail: 'expected warning containing: ' + t.warn };
  if (t.noWarn && r.warnings.some((w) => w.indexOf(t.noWarn) >= 0)) return { name: t.name, kind: 'reference', pass: false, detail: 'unexpected warning: ' + t.noWarn };
  for (const k in t.out) {
    const o = r.outputs.find((x) => x.key === k), got = o.value / FACTOR[o.unit], exp = t.out[k];
    if (!(Math.abs(got - exp) <= t.tol * Math.abs(exp))) return { name: t.name, kind: 'reference', pass: false, detail: k + ': got ' + got + ', expected ' + exp };
  }
  if (t.prefix) for (const k in t.prefix) { const o = r.outputs.find((x) => x.key === k); if ((o.prefix || '') !== t.prefix[k]) return { name: t.name, kind: 'reference', pass: false, detail: k + ' prefix: got ' + (o.prefix || '(none)') + ', expected ' + (t.prefix[k] || '(none)') }; }
  return { name: t.name, kind: 'reference', pass: true };
}
function runTests(def) {
  const res = def.tests.map((t) => runCase(def, t));
  const base = defaultsRaw(def), ref = calculate(def, base);
  def.inputs.forEach((s) => {
    if (s.type === 'enum') return;
    const alts = Object.keys(UNITS[s.dim].units).filter((u) => UNITS[s.dim].units[u] !== UNITS[s.dim].units[s.unit]);
    if (alts.length && s.def !== '') {
      const u2 = alts[0], raw = Object.assign({}, base);
      raw[s.key] = [s.def * FACTOR[s.unit] / FACTOR[u2], u2];
      const r = calculate(def, raw);
      let pass = r.ok && ref.ok;
      if (pass) ref.outputs.forEach((o, n) => { if (!(Math.abs(o.value - r.outputs[n].value) <= 1e-9 * Math.max(1, Math.abs(o.value)))) pass = false; });
      res.push({ name: 'switching ' + s.label + ' to ' + u2 + ' keeps the result', kind: 'units', pass });
    }
    if (s.min != null) {
      const bad = s.exMin ? s.min : s.min - 1, raw = Object.assign({}, base);
      raw[s.key] = [bad / FACTOR[s.unit], s.unit];
      const r = calculate(def, raw);
      res.push({ name: s.label + ' below its limit is rejected', kind: 'invalid', pass: !r.ok && r.errors.some((e) => e.key === s.key) });
    }
    if (s.optional) return;
    const raw2 = Object.assign({}, base); raw2[s.key] = '';
    const r2 = calculate(def, raw2);
    res.push({ name: 'empty ' + s.label + ' is rejected', kind: 'invalid', pass: !r2.ok && r2.errors.some((e) => e.key === s.key) });
  });
  const by = (k) => res.filter((x) => x.kind === k);
  return { results: res, total: res.length, passed: res.filter((x) => x.pass).length, failures: res.filter((x) => !x.pass),
    groups: { reference: by('reference'), units: by('units'), invalid: by('invalid') } };
}

/* ---------- Chain: Feeder Designer. Each step feeds the next; all numbers come from the registry ---------- */
function rawBase(def, vals) {
  const r = {};
  def.inputs.forEach((s) => { r[s.key] = s.type === 'enum' ? vals[s.key] : (vals[s.key] === undefined ? [s.def, s.unit] : [vals[s.key] / 1, UNITS[s.dim].base]); });
  return r;
}
const FEEDER_INPUTS = [
  { key: 'basis', label: 'Calculation basis', type: 'enum', options: [1, 4, 5, 6, 2], def: 1, labels: BASIS_LABELS },
  I('P', 'Load', 'power', 'kW', 250, { min: 0, exMin: true }),
  I('V', 'System voltage (L-L)', 'voltage', 'V', 400, { min: 0, exMin: true }),
  PF(0.9),
  I('L', 'Feeder length', 'length', 'm', 180, { min: 0, exMin: true }),
  I('R', 'Cable resistance', 'resPerLen', 'Ω/km', 0.0766, { min: 0, exMin: true, hint: 'Per core, at the conductor operating temperature (90 °C for XLPE, 70 °C for PVC), from the data sheet of the cable you choose. The 20 °C table value understates the voltage drop.' }),
  I('X', 'Cable reactance', 'resPerLen', 'Ω/km', 0.08, { min: 0 }),
  I('limit', 'Allowed voltage drop (%)', 'number', '', 3, { min: 0, max: 20, exMin: true, hint: 'Your project limit. Under BS 7671 and AS/NZS the reference figure for the circuit type is shown beside the result' }),
  { key: 'circ', label: 'Circuit type (sets the BS 7671 voltage-drop reference: 3% lighting, 5% other uses)', type: 'enum', options: [0, 1], def: 0, labels: { 0: 'Other uses (power, sockets, motors)', 1: 'Lighting' } },
  { key: 'cont', label: 'Load type (NEC-style basis only: 125% applies to continuous load)', type: 'enum', options: [1, 0], def: 1, labels: { 1: 'Continuous (3 hours or more): 125% applies', 0: 'Non-continuous: no 125% factor' } },
  I('Pc', 'Continuous part of a mixed load (NEC-style basis only)', 'power', 'kW', '', { min: 0, optional: true, hint: 'Leave blank to use the load type above. Enter the kW that runs 3 hours or more and the rest is treated as non-continuous: the rating is non-continuous + 125% of continuous. Must not exceed the load' }),
  I('S', 'Source transformer', 'apparent', 'kVA', 1000, { min: 0, exMin: true }),
  I('Z', 'Transformer impedance (%)', 'number', '', 5, { min: 0, max: 100, exMin: true }),
  I('Icu', 'Breaker rated breaking capacity (Icu / Ics)', 'current', 'kA', '', { min: 0, exMin: true, optional: true, hint: 'From the breaker data sheet at the system voltage. Leave blank if no breaker is selected yet; the sheet then shows interrupting capacity as NOT VERIFIED' }),
  I('pf2', 'Target power factor', 'number', '', 0.97, { min: 0, max: 1, exMin: true }),
  I('A', 'Chosen cable cross-section', 'area', 'mm²', 300, { min: 0, exMin: true, hint: 'Per phase; also used for the short-circuit check' }),
  I('Itab', 'Tabulated ampacity of that cable', 'current', 'A', 750, { min: 0, exMin: true, hint: 'From your data sheet for the installation method, at reference conditions' }),
  I('Ta', 'Ambient temperature (°C)', 'number', '', 40, { min: -50, max: 69 }),
  I('kg', 'Grouping factor', 'number', '', 0.8, { min: 0.1, max: 1 }),
  I('mat', 'Conductor type (1 Cu/PVC, 2 Cu/XLPE, 3 Al/PVC, 4 Al/XLPE)', 'number', '', 2, { min: 1, max: 4 }),
  I('t', 'Fault clearing time', 'time', 's', 0.5, { min: 0, exMin: true, max: 5 }),
  I('Ii', 'Breaker instantaneous (magnetic) pick-up setting', 'current', 'A', '', { min: 0, exMin: true, optional: true, hint: 'The highest current at which the breaker may still need to wait, from its data sheet or setting, including the upper tolerance band. Leave blank if not selected yet; the pick-up check is then not verified' }),
  I('I2t', 'Breaker let-through energy I²t at the fault level (A²s)', 'number', '', '', { min: 0, exMin: true, optional: true, hint: 'From the manufacturer let-through (energy) curve at the prospective fault current, in A²s. Leave blank if not known; the let-through check is then not verified' }),
  I('Ze', 'External earth fault loop impedance Ze (supply side)', 'resistance', 'Ω', '', { min: 0, optional: true, hint: 'Impedance of the earth fault path from the source up to the start of this feeder, measured or from the supplier or transformer data. Leave blank if not known; the earth fault loop check is then not verified' }),
  I('Rpe', 'Protective conductor (PE) resistance', 'resPerLen', 'Ω/km', '', { min: 0, optional: true, hint: 'Per conductor, at operating temperature, for the PE or earth conductor that runs with this feeder, from the cable data sheet. Leave blank if not known' })
];
function runFeeder(raw) {
  const spec = { id: 'feeder', inputs: FEEDER_INPUTS };
  const p = parse(spec, raw);
  if (p.errors.length) return { ok: false, errors: p.errors };
  const c = p.vals, steps = [];
  if (c.Pc !== undefined && c.Pc > c.P) return { ok: false, errors: [{ key: 'Pc', msg: 'Continuous part of a mixed load cannot exceed the total load' }] };
  const B = BASES[c.basis], mixed = c.basis === 2 && c.Pc !== undefined, nonCont = c.basis === 2 && c.cont === 0 && !mixed;
  /* Mixed load (NEC-style): current is proportional to power at the same voltage and power factor, so the design current is Ib × ((P - Pc) + 1.25 Pc) / P. */
  const cf = mixed ? ((c.P - c.Pc) + B.cf * c.Pc) / c.P : nonCont ? 1 : B.cf, eqCur = nonCont || mixed, vdr = vdRefOf(c.basis, c.circ);
  const ruleText = mixed ? 'Ieq ≤ In ≤ Iz, Ieq = Ib non-continuous + 1.25 × Ib continuous (mixed load)' : nonCont ? 'Ib ≤ In ≤ Iz (non-continuous load, no 125% factor)' : B.rule;
  const run = (id, vals) => calculate(BY_ID[id], rawBase(BY_ID[id], vals));
  const s1 = run('three-phase-current', { P: c.P, V: c.V, pf: c.pf, phase: 3, eff: 1 });
  steps.push({ id: 'three-phase-current', title: 'Load current', ok: s1.ok, headline: fmt(s1.outputs[0].value, 2) + ' A', sentence: s1.sentence, status: 'info' });
  const Ic = s1.outputs[0].value;
  const s2 = run('voltage-drop', { I: Ic, L: c.L, R: c.R, X: c.X, V: c.V, pf: c.pf, phase: 3 });
  const pct = s2.outputs[1].value, vdOk = pct <= c.limit;
  steps.push({ id: 'voltage-drop', title: 'Voltage drop', ok: s2.ok, headline: fmt(s2.outputs[0].value, 2) + ' V (' + fmt(pct, 2) + '%)', sentence: s2.sentence, status: vdOk ? 'pass' : 'fail', check: (vdr ? 'Reference: ' + vdr.pct + '% for ' + vdr.kind + ' (' + vdr.ref + '). ' + (c.limit > vdr.pct ? 'Your limit of ' + fmt(c.limit, 1) + '% is above it; confirm for this circuit. ' : '') : '') + (vdOk ? 'Within the ' + fmt(c.limit, 1) + '% limit' : 'Exceeds the ' + fmt(c.limit, 1) + '% limit. Use a larger conductor or shorten the run.') });
  const s3 = run('breaker-size', { I: Ic * cf, m: 1 });
  const In = s3.outputs[0].value;
  steps.push({ id: 'breaker-size', title: 'Breaker rating', ok: s3.ok, headline: isNaN(In) ? '—' : In + ' A', sentence: s3.sentence, status: 'info', check: 'The cable must carry at least this current. Confirm against the cable ampacity for your installation.' });
  const mat = Math.min(4, Math.max(1, Math.round(c.mat))), s3b = run('cable-derating', Object.assign({ basis: c.basis, Ib: mixed ? Ic * cf : Ic, In, Itab: c.Itab, ins: mat % 2 === 0 ? 2 : 1, Ta: c.Ta, Tref: B.tref, kg: c.kg, ko: 1 }, eqCur ? { basis: 3, tmu: B.tc[mat % 2 === 0 ? 2 : 1], cf: 1, Tref: B.tref } : {}));
  const Iz = s3b.ok ? s3b.outputs[1].value : NaN, dOk = s3b.ok && In <= Iz;
  steps.push({ id: 'cable-derating', title: 'Cable current capacity', ok: s3b.ok, headline: s3b.ok ? fmt(Iz, 1) + ' A derated' : 'Check inputs', sentence: s3b.ok ? s3b.sentence : (s3b.errors || []).map((e) => e.msg).join('; '), status: dOk ? 'pass' : 'fail', value: Iz, check: (dOk ? (mixed ? 'Ieq ≤ In ≤ Iz is satisfied (' + fmt(Ic * cf, 1) + ' ≤ ' : 'Ib ≤ In ≤ Iz is satisfied (' + fmt(Ic, 1) + ' ≤ ')  + fmt(In, 0) + ' ≤ ' + fmt(Iz, 1) + ' A). ' : 'Breaker rating exceeds the calculated derated capacity. Use a larger cable or review the correction factors. ') + 'The temperature multiplier is approximate; verify cable ampacity and correction factors against the applicable standard edition and manufacturer data before approving the cable.' });
  const s4 = run('fault-current', { S: c.S, V: c.V, Z: c.Z });
  const Isc = s4.outputs[0].value;
  steps.push({ id: 'fault-current', title: 'Fault level', ok: s4.ok, headline: fmt(Isc / 1000, 2) + ' kA', sentence: s4.sentence, status: 'info', check: 'Prospective fault current at the transformer terminals (infinite source behind the transformer, so conservative). A breaker at the source end must have a breaking capacity at or above this value.' });
  const icKnown = c.Icu !== undefined, icOk = icKnown && c.Icu >= Isc;
  steps.push(icKnown
    ? { id: 'breaker-icu', title: 'Breaker interrupting capacity', ok: true, headline: fmt(c.Icu / 1000, 1) + ' kA rated vs ' + fmt(Isc / 1000, 2) + ' kA fault', sentence: 'Compares the entered breaking capacity with the calculated prospective fault current.', status: icOk ? 'pass' : 'fail', check: icOk ? 'Rated breaking capacity is at or above the prospective fault level.' : 'Rated breaking capacity is BELOW the prospective fault level. Select a breaker with a higher Icu / Ics.' }
    : { id: 'breaker-icu', title: 'Breaker interrupting capacity', ok: true, headline: 'Not verified', sentence: 'No breaker breaking capacity was entered, so it was not compared with the ' + fmt(Isc / 1000, 2) + ' kA fault level.', status: 'pending', badge: 'not verified', check: 'Enter the breaker Icu / Ics (kA) to verify.' });
  const s4b = run('cable-sc-withstand', { Isc, t: c.t, mat }), Amin = s4b.ok ? s4b.outputs[0].value : NaN, scOk = s4b.ok && c.A >= Amin;
  steps.push({ id: 'cable-sc-withstand', title: 'Short-circuit withstand', ok: s4b.ok, headline: s4b.ok ? 'Needs ≥ ' + fmt(Amin * 1e6, 1) + ' mm²' : 'Check inputs', sentence: s4b.ok ? s4b.sentence : '', status: scOk ? 'pass' : 'fail', check: scOk ? 'The chosen ' + fmt(c.A * 1e6, 0) + ' mm² withstands the fault.' : 'The chosen cable is too small for this fault and clearing time.' });
  /* Protective device checks (v1.39.0). Fault at the far end of the feeder: source impedance Zs = Z% × V²/S plus the cable impedance, added arithmetically
     (|Zs| + |Zc|), which gives a lower current than the vector sum and so is the conservative figure for a pick-up check. Phase-to-phase = (√3/2) × three-phase. */
  const Zs = (c.Z / 100) * c.V * c.V / c.S, Zc = Math.hypot(c.R * c.L, c.X * c.L), Iend3 = c.V / (Math.sqrt(3) * (Zs + Zc)), Iendpp = Iend3 * Math.sqrt(3) / 2;
  steps.push({ id: 'feeder-end-fault', title: 'Fault at the far end of the feeder', ok: true, headline: fmt(Iend3 / 1000, 2) + ' kA three-phase, ' + fmt(Iendpp / 1000, 2) + ' kA phase-to-phase', sentence: 'Source impedance from the transformer rating and impedance, plus the cable resistance and reactance over the feeder length, added arithmetically (conservative). The source is taken as an infinite bus behind the transformer.', status: 'info', value: Iendpp, check: 'This is the lowest balanced fault current for the feeder as entered. A phase-to-earth fault can be lower still: check the earth fault loop impedance for the earthing system.' });
  const Aw = c.A * 1e6, kW = s4b.ok ? kShortCircuit(mat, Aw) : NaN, allow = (kW * Aw) * (kW * Aw);
  steps.push(c.I2t !== undefined && s4b.ok
    ? { id: 'cable-let-through', title: 'Breaker let-through energy vs cable', ok: true, headline: fmt(c.I2t, 4) + ' A²s let through vs ' + fmt(allow, 4) + ' A²s withstand', sentence: 'The cable withstands k² × S² of fault energy. The breaker must let through no more than that: I²t ≤ k² × S².', status: c.I2t <= allow ? 'pass' : 'fail', check: c.I2t <= allow ? 'The entered let-through energy is within the cable withstand.' : 'The entered let-through energy exceeds what the cable withstands. Use a larger cable or a breaker that limits the energy more.' }
    : { id: 'cable-let-through', title: 'Breaker let-through energy vs cable', ok: true, headline: 'Not verified', sentence: 'No breaker let-through energy (I²t) was entered, so it was not compared with the cable withstand.', status: 'pending', badge: 'not verified', check: 'Enter the I²t from the manufacturer curve to verify.' });
  steps.push(c.Ii !== undefined
    ? { id: 'breaker-pickup', title: 'Instantaneous pick-up vs far-end fault', ok: true, headline: fmt(c.Ii, 4) + ' A pick-up vs ' + fmt(Iendpp, 4) + ' A phase-to-phase fault', sentence: 'For the cable to be protected against a fault at its far end, the instantaneous pick-up must be at or below the lowest balanced fault current there.', status: c.Ii <= Iendpp ? 'pass' : 'fail', check: c.Ii <= Iendpp ? 'The pick-up is at or below the far-end fault, so the breaker should operate instantly. Confirm with the manufacturer tolerance.' : 'The pick-up is above the far-end fault, so the breaker may not trip instantly. The fault would clear only through the slower overload part of the curve, so check the clearing time and the cable withstand at that time.' }
    : { id: 'breaker-pickup', title: 'Instantaneous pick-up vs far-end fault', ok: true, headline: 'Not verified', sentence: 'No instantaneous pick-up setting was entered, so it was not compared with the fault at the far end of the feeder.', status: 'pending', badge: 'not verified', check: 'Enter the breaker pick-up (A) to verify.' });
  /* Earth fault loop (v1.39.0): Zs = Ze + Zfeeder, Zfeeder = |(R + Rpe) L + j X L| (phase reactance only, impedances added arithmetically so the current is not overstated). Disconnection is by the instantaneous pick-up Ii. */
  const loopKnown = c.Ze !== undefined && c.Rpe !== undefined && c.Ii !== undefined;
  if (loopKnown) {
    const Zf = Math.hypot((c.R + c.Rpe) * c.L, c.X * c.L), sl = run('fault-loop-impedance', { U0: c.V / Math.sqrt(3), Ze: c.Ze, Zi: Zf, Ia: c.Ii }), lp = sl.ok, lOk = lp && sl.outputs[1].value >= c.Ii;
    steps.push({ id: 'earth-fault-loop', title: 'Earth fault loop', ok: lp, headline: lp ? fmt(sl.outputs[0].value, 4) + ' Ω loop, ' + fmt(sl.outputs[1].value, 4) + ' A earth fault vs ' + fmt(c.Ii, 4) + ' A pick-up' : 'Check inputs', sentence: lp ? sl.sentence : '', status: lOk ? 'pass' : 'fail', check: lOk ? 'The earth fault current is at or above the instantaneous pick-up, so the breaker should operate instantly. The permitted disconnection time and Zs limit come from your wiring rules; confirm them there.' : 'The earth fault current is below the pick-up (or the inputs are invalid). The breaker may not trip instantly on an earth fault: check the clearing time against the permitted disconnection time, or use a larger protective conductor, a lower pick-up or an RCD.' });
  } else steps.push({ id: 'earth-fault-loop', title: 'Earth fault loop', ok: true, headline: 'Not verified', sentence: 'The external loop impedance Ze, the protective conductor resistance and the instantaneous pick-up are all needed, and one or more was not entered.', status: 'pending', badge: 'not verified', check: 'Enter Ze, the PE resistance and the pick-up (A) to verify. The check assumes a bolted fault and uses the phase conductor reactance only.' });
  steps.push({ id: 'breaker-trip', title: 'Breaker trip characteristics', ok: true, headline: 'Not checked', sentence: 'Elecmetric does not model the breaker trip curve.', status: 'pending', badge: 'not checked', check: 'Verify against the breaker data: overload setting versus Ib and Iz, short-circuit pick-up below the minimum fault current at the far end, and let-through energy (I²t) within the cable withstand.' });
  steps.push({ id: 'breaker-selectivity', title: 'Selectivity (discrimination)', ok: true, headline: 'Not checked', sentence: 'Elecmetric does not model coordination with upstream or downstream devices.', status: 'pending', badge: 'not checked', check: 'Verify with the manufacturer selectivity tables or time-current curves for the actual upstream and downstream devices.' });
  let s5 = null;
  if (c.pf2 > c.pf) {
    s5 = run('pf-correction-kvar', { P: c.P, pf1: c.pf, pf2: c.pf2 });
    steps.push({ id: 'pf-correction-kvar', title: 'Power factor correction', ok: s5.ok, headline: fmt(s5.outputs[0].value / 1000, 1) + ' kVAR', sentence: s5.sentence, status: 'info' });
  } else steps.push({ id: 'pf-correction-kvar', title: 'Power factor correction', ok: true, headline: 'Not needed', sentence: 'Present power factor already meets the target.', status: 'info' });
  const efFail = steps.find((x) => x.id === 'earth-fault-loop').status === 'fail', ltFail = steps.find((x) => x.id === 'cable-let-through').status === 'fail', puFail = steps.find((x) => x.id === 'breaker-pickup').status === 'fail';
  const failed = !(vdOk && dOk && scOk) || (icKnown && !icOk) || ltFail || puFail || efFail;
  const pending = steps.filter((x) => x.status === 'pending').map((x) => x.title.toLowerCase());
  const statusText = failed ? 'ONE OR MORE CHECKS FAIL' : 'MODELED CHECKS PASSED | ' + [icKnown ? null : 'BREAKER INTERRUPTING CAPACITY NOT VERIFIED', c.I2t === undefined ? 'LET-THROUGH ENERGY NOT VERIFIED' : null, c.Ii === undefined ? 'PICK-UP NOT VERIFIED' : null, loopKnown ? null : 'EARTH FAULT LOOP NOT VERIFIED', 'TRIP CHARACTERISTICS AND SELECTIVITY NOT CHECKED'].filter(Boolean).join(' | ');
  const lines = [
    'FEEDER CALCULATION SHEET', 'Generated by Elecmetric (' + BASES[c.basis].name + ' basis)', '',
    'INPUTS', `Load ${q(c.P, 'kW', 1)}, ${fmt(c.V, 0)} V, three-phase, PF ${fmt(c.pf, 2)}`, `Feeder ${fmt(c.L, 0)} m, R ${fmt(c.R * 1000, 4)} Ω/km, X ${fmt(c.X * 1000, 4)} Ω/km`, `Voltage-drop limit ${fmt(c.limit, 1)}%` + (vdr ? ` (reference ${vdr.pct}% for ${vdr.kind}, ${vdr.ref})` : '') + (c.basis === 2 ? (mixed ? `, mixed load: ${q(c.Pc, 'kW', 1)} continuous and ${q(c.P - c.Pc, 'kW', 1)} non-continuous` : `, load ${nonCont ? 'non-continuous' : 'continuous'}`) : ''), `Source ${q(c.S, 'kVA', 0)}, Z ${fmt(c.Z, 2)}%, breaker Icu/Ics ${icKnown ? q(c.Icu, 'kA', 1) : 'not entered'}`, `Cable ${fmt(c.A * 1e6, 0)} mm², tabulated ${q(c.Itab, 'A', 0)}, ambient ${fmt(c.Ta, 0)} °C, grouping ${fmt(c.kg, 2)}, clearing ${fmt(c.t, 2)} s, type ${mat}`, '',
    'RESULTS', ...steps.map((s) => `${s.title}: ${s.headline}${s.status === 'pass' ? '  [PASS]' : s.status === 'fail' ? '  [FAIL]' : s.status === 'pending' ? '  [' + s.badge.toUpperCase() + ']' : ''}`), '',
    'NOTES', 'Checks not performed by Elecmetric: ' + pending.join('; ') + '.', 'Basis constants (' + BASES[c.basis].name + '): conductor limits ' + BASES[c.basis].tc[1] + ' / ' + BASES[c.basis].tc[2] + ' °C, table reference ambient ' + BASES[c.basis].tref + ' °C, rule ' + ruleText + '. No standard tables are embedded.', (B.ampRef ? 'Ampacity basis: ' + B.ampRef + '. Voltage-drop reference: ' + B.vdRef + '.' : vdr ? 'Voltage-drop reference: ' + vdr.ref + '.' : 'No voltage-drop reference is set for this basis; the limit is yours.'), 'Cable size, tabulated ampacity and grouping factor are user-selected from the data sheet; resistance and reactance come from the same sheet.', 'Results are design assistance. The responsible engineer must verify against the applicable standard.'
  ];
  return { ok: true, steps, failed, status: failed ? 'fail' : 'partial', statusText, pending, report: lines.join('\n'), current: Ic };
}

/* ---------- Standards data layer and Cable Selection Check (v1.70.0) ----------
   Elecmetric embeds no standard tables. A person with a licensed copy of the standard (or a manufacturer catalogue) loads each table as a dataset.
   Every dataset records its standard, edition, table, installation method, source and who entered it, and is "unverified" unless a verifier, qualification
   and date are recorded in the file. Each result then states which dataset or constant it relied on and whether that is verified. */
const DS_SOURCES = ['licensed-copy', 'manufacturer', 'user-entered'];
const DS_KINDS = {
  'ampacity': { cols: ['size_mm2', 'amps'], need: ['method', 'conductor', 'insulation', 'loaded_conductors'], label: 'Tabulated ampacity' },
  'temperature-factor': { cols: ['ambient_c', 'factor'], need: ['conductor', 'insulation', 'reference_ambient_c'], label: 'Ambient temperature correction' },
  'grouping-factor': { cols: ['circuits', 'factor'], need: ['method'], label: 'Grouping correction' },
  'k-factor': { cols: ['size_max_mm2', 'k'], need: ['conductor', 'insulation'], label: 'Short-circuit k factor' }
};
const DS_TEXT = /^(?!\s*$)(?!(full name|e\.g\.|tbd|todo|n\/a|name|\.\.\.|x+|_+)\s*$)/i;
function parseDatasetCsv(text, today) {
  const errors = [], meta = {}, rows = [], t = today || new Date().toISOString().slice(0, 10);
  let cols = null;
  String(text || '').split(/\r?\n/).forEach((line, n) => {
    const s = line.trim(); if (!s) return;
    if (s[0] === '#') { const m = /^#\s*([a-z_0-9]+)\s*:\s*(.*)$/i.exec(s); if (m) meta[m[1].toLowerCase()] = m[2].trim(); return; }
    const p = s.split(',').map((x) => x.trim());
    if (!cols) { cols = p.map((x) => x.toLowerCase()); return; }
    if (p.length !== cols.length) { errors.push('line ' + (n + 1) + ': expected ' + cols.length + ' columns'); return; }
    rows.push(p);
  });
  const kind = DS_KINDS[meta.kind];
  if (!kind) return { ok: false, errors: ['# kind must be one of: ' + Object.keys(DS_KINDS).join(', ')] };
  ['standard', 'edition', 'table', 'source', 'entered_by'].concat(kind.need).forEach((k) => { if (!meta[k] || !DS_TEXT.test(meta[k])) errors.push('# ' + k + ' is required'); });
  if (meta.source && DS_SOURCES.indexOf(meta.source) < 0) errors.push('# source must be one of: ' + DS_SOURCES.join(', '));
  if (meta.conductor && ['Cu', 'Al'].indexOf(meta.conductor) < 0) errors.push('# conductor must be Cu or Al');
  if (meta.insulation && ['PVC', 'XLPE'].indexOf(meta.insulation) < 0) errors.push('# insulation must be PVC or XLPE');
  if (meta.loaded_conductors && ['2', '3'].indexOf(meta.loaded_conductors) < 0) errors.push('# loaded_conductors must be 2 or 3');
  if (!cols || cols.join(',') !== kind.cols.join(',')) errors.push('column header must be exactly: ' + kind.cols.join(','));
  const data = [];
  if (cols && cols.join(',') === kind.cols.join(',')) rows.forEach((p, i) => {
    const nums = p.map((x) => (/^inf(inity)?$/i.test(x) ? 1e9 : Number(x)));
    if (nums.some((x) => !isFinite(x) || x <= 0) && !(kind.cols[0] === 'ambient_c' && isFinite(nums[0]) && nums[1] > 0)) { errors.push('row ' + (i + 1) + ': every value must be a positive number'); return; }
    if (data.length && nums[0] <= data[data.length - 1][0]) { errors.push('row ' + (i + 1) + ': first column must increase down the table'); return; }
    if (kind.cols[1] === 'factor' && nums[1] > 1.5) { errors.push('row ' + (i + 1) + ': a correction factor above 1.5 is not credible'); return; }
    data.push(nums);
  });
  if (!data.length && !errors.length) errors.push('no data rows');
  let status = 'unverified', verified = null;
  if (meta.verified_by || meta.verified_qualification || meta.verified_date) {
    const okV = meta.verified_by && DS_TEXT.test(meta.verified_by) && meta.verified_qualification && DS_TEXT.test(meta.verified_qualification) && /^\d{4}-\d{2}-\d{2}$/.test(meta.verified_date || '') && meta.verified_date <= t;
    if (okV) { status = 'verified'; verified = { by: meta.verified_by, qualification: meta.verified_qualification, date: meta.verified_date }; }
    else errors.push('verified_by, verified_qualification and verified_date (YYYY-MM-DD, not in the future) must all be given together, or none');
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true, errors: [], dataset: { kind: meta.kind, meta, rows: data, status, verified } };
}
const dsName = (d) => d.meta.standard + ', ' + d.meta.edition + ', ' + d.meta.table + (d.meta.method ? ', method ' + d.meta.method : '');
function dsExact(d, x) { const r = d.rows.find((q) => Math.abs(q[0] - x) < 1e-9); return r ? { ok: true, value: r[1] } : { ok: false }; }
function dsInterp(d, x) {
  const r = d.rows; if (x < r[0][0] - 1e-9 || x > r[r.length - 1][0] + 1e-9) return { ok: false };
  for (let i = 0; i < r.length; i++) { if (Math.abs(r[i][0] - x) < 1e-9) return { ok: true, value: r[i][1], interpolated: false }; if (r[i][0] > x) { const a = r[i - 1], b = r[i]; return { ok: true, value: a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]), interpolated: true }; } }
  return { ok: false };
}
function dsRange(d, x) { const r = d.rows.find((q) => x <= q[0] + 1e-9); return r ? { ok: true, value: r[1] } : { ok: false }; }
const CABLE_SEL_INPUTS = [
  I('Ib', 'Design current Ib', 'current', 'A', 100, { min: 0, exMin: true }),
  I('In', 'Protective device rating In', 'current', 'A', 125, { min: 0, exMin: true }),
  I('A', 'Cable cross-section', 'area', 'mm²', 35, { min: 0, exMin: true }),
  { key: 'mat', label: 'Conductor and insulation', type: 'enum', options: [1, 2, 3, 4], def: 2, labels: { 1: 'Copper / PVC', 2: 'Copper / XLPE', 3: 'Aluminium / PVC', 4: 'Aluminium / XLPE' } },
  I('Ta', 'Ambient temperature (°C)', 'number', '', 30, { min: -50, max: 90 }),
  I('ncirc', 'Number of grouped circuits', 'number', '', 1, { min: 1, max: 100 }),
  I('ItabM', 'Tabulated ampacity, entered by hand (used only if no ampacity dataset is loaded)', 'current', 'A', '', { min: 0, exMin: true, optional: true }),
  I('ktM', 'Temperature factor, entered by hand (used only if no temperature dataset is loaded)', 'number', '', '', { min: 0.1, max: 1.5, optional: true }),
  I('kgM', 'Grouping factor, entered by hand (used only if no grouping dataset is loaded)', 'number', '', '', { min: 0.1, max: 1, optional: true }),
  I('I2f', 'Conventional tripping current factor I2 / In', 'number', '', 1.45, { min: 1, max: 3, hint: 'From the protective device standard and data sheet for the device you chose' }),
  I('Imax', 'Maximum prospective fault current at the cable origin', 'current', 'kA', 10, { min: 0, exMin: true }),
  I('tmax', 'Device clearing time at the maximum fault', 'time', 's', 0.1, { min: 0, exMin: true, max: 5 }),
  I('Imin', 'Minimum fault current at the far end of the cable', 'current', 'A', '', { min: 0, exMin: true, optional: true, hint: 'The smallest fault the protection must still clear (usually earth fault or line-to-neutral at the far end, with the source at its weakest)' }),
  I('tmin', 'Device disconnection time at the minimum fault', 'time', 's', '', { min: 0, exMin: true, optional: true, hint: 'Read from the device time-current curve at the minimum fault current' }),
  I('Icu', 'Device rated breaking capacity', 'current', 'kA', '', { min: 0, exMin: true, optional: true }),
  I('Ii', 'Instantaneous pick-up, upper tolerance', 'current', 'A', '', { min: 0, exMin: true, optional: true }),
  I('Isel', 'Selectivity limit with the other device (manufacturer table)', 'current', 'kA', '', { min: 0, exMin: true, optional: true, hint: 'The fault current up to which the manufacturer guarantees discrimination for this device pair' })
];
const CABLE_SEL_NOT_CHECKED = ['Voltage drop (use the Feeder Designer or Voltage Drop calculator)', 'Harmonic and neutral loading', 'Soil thermal resistivity and depth of burial unless a dataset for them was loaded as a correction', 'Cable installation method suitability: the dataset you loaded is assumed to match your actual installation', 'Time-current coordination curves: only the checks listed above are made'];
function runCableSelection(raw, sets, today) {
  const spec = { id: 'cable-selection', inputs: CABLE_SEL_INPUTS }, p = parse(spec, raw);
  if (p.errors.length) return { ok: false, errors: p.errors };
  const c = p.vals; sets = sets || {};
  const mat = c.mat, cond = mat <= 2 ? 'Cu' : 'Al', ins = mat % 2 === 1 ? 'PVC' : 'XLPE', Amm = c.A * 1e6, steps = [], rely = [];
  const push = (s) => { steps.push(s); return s; };
  const mismatch = (d, label) => (d.meta.conductor && d.meta.conductor !== cond) || (d.meta.insulation && d.meta.insulation !== ins) ? label + ' dataset is for ' + (d.meta.conductor || '') + ' / ' + (d.meta.insulation || '') + ', but ' + cond + ' / ' + ins + ' is selected' : '';
  const dstat = (d) => (d.status === 'verified' ? 'verified dataset' : 'unverified dataset');
  /* 1 data sources */
  const used = ['ampacity', 'temperature-factor', 'grouping-factor', 'k-factor'].filter((k) => sets[k]);
  push({ id: 'data-sources', title: 'Data used', status: 'info', headline: used.length ? used.length + ' dataset' + (used.length > 1 ? 's' : '') + ' loaded' : 'No datasets loaded', sentence: used.length ? used.map((k) => DS_KINDS[k].label + ': ' + dsName(sets[k]) + ' (' + dstat(sets[k]) + ', source ' + sets[k].meta.source + ')').join('; ') + '.' : 'No standard or manufacturer tables are loaded. Factors entered by hand are used, and the results that need a table are not verified.', check: 'Elecmetric does not check that a loaded table has been entered correctly. Compare the values with the printed table.' });
  /* 2 tabulated ampacity */
  let Itab = NaN, itabSrc = '', itabMiss = '';
  if (sets.ampacity) { const mm = mismatch(sets.ampacity, 'Ampacity'), l = dsExact(sets.ampacity, Amm); if (mm) itabMiss = mm; else if (!l.ok) itabMiss = Amm + ' mm² is not a row of the loaded ampacity table'; else { Itab = l.value; itabSrc = 'ampacity dataset (' + dstat(sets.ampacity) + ')'; } }
  else if (c.ItabM !== undefined) { Itab = c.ItabM; itabSrc = 'value entered by hand (not verified)'; } else itabMiss = 'no ampacity dataset is loaded and no value was entered';
  push(isNaN(Itab) ? { id: 'ampacity', title: 'Tabulated ampacity', status: 'pending', badge: 'missing input', headline: 'Not available', sentence: 'Missing: ' + itabMiss + '.', check: 'Load the ampacity table for your installation method, or enter the value from the data sheet.' }
    : { id: 'ampacity', title: 'Tabulated ampacity', status: 'info', headline: fmt(Itab, 1) + ' A at ' + fmt(Amm, 0) + ' mm²', sentence: 'From the ' + itabSrc + '.', check: '' });
  if (!isNaN(Itab)) rely.push({ what: 'Tabulated ampacity', src: itabSrc, verified: !!sets.ampacity && sets.ampacity.status === 'verified' });
  /* 3 temperature factor */
  let kt = NaN, ktSrc = '', ktMiss = '';
  if (sets['temperature-factor']) { const d = sets['temperature-factor'], mm = mismatch(d, 'Temperature factor'), l = dsInterp(d, c.Ta); if (mm) ktMiss = mm; else if (!l.ok) ktMiss = fmt(c.Ta, 1) + ' °C is outside the loaded table (' + d.rows[0][0] + ' to ' + d.rows[d.rows.length - 1][0] + ' °C); Elecmetric does not extrapolate'; else { kt = l.value; ktSrc = 'temperature dataset (' + dstat(d) + ')' + (l.interpolated ? ', interpolated between table rows' : ''); } }
  else if (c.ktM !== undefined) { kt = c.ktM; ktSrc = 'value entered by hand (not verified)'; } else ktMiss = 'no temperature dataset is loaded and no factor was entered. The approximate heat-balance factor of the Cable Derating calculator is deliberately not used here';
  push(isNaN(kt) ? { id: 'temperature-factor', title: 'Temperature correction', status: 'pending', badge: 'missing input', headline: 'Not available', sentence: 'Missing: ' + ktMiss + '.', check: 'Load the temperature correction table, or enter the factor from your standard.' }
    : { id: 'temperature-factor', title: 'Temperature correction', status: 'info', headline: 'kt = ' + fmt(kt, 3), sentence: 'At ' + fmt(c.Ta, 1) + ' °C from the ' + ktSrc + '.', check: '' });
  if (!isNaN(kt)) rely.push({ what: 'Temperature factor', src: ktSrc, verified: !!sets['temperature-factor'] && sets['temperature-factor'].status === 'verified' && !/interpolated/.test(ktSrc) });
  /* 4 grouping factor */
  let kg = NaN, kgSrc = '', kgMiss = '';
  if (sets['grouping-factor']) { const d = sets['grouping-factor'], l = dsExact(d, Math.round(c.ncirc)); if (!l.ok) kgMiss = Math.round(c.ncirc) + ' circuits is not a row of the loaded grouping table'; else { kg = l.value; kgSrc = 'grouping dataset (' + dstat(d) + ')'; } }
  else if (c.kgM !== undefined) { kg = c.kgM; kgSrc = 'value entered by hand (not verified)'; } else if (Math.round(c.ncirc) === 1) { kg = 1; kgSrc = 'single circuit, no grouping'; } else kgMiss = 'no grouping dataset is loaded and no factor was entered for ' + Math.round(c.ncirc) + ' circuits';
  push(isNaN(kg) ? { id: 'grouping-factor', title: 'Grouping correction', status: 'pending', badge: 'missing input', headline: 'Not available', sentence: 'Missing: ' + kgMiss + '.', check: 'Load the grouping table, or enter the factor from your standard.' }
    : { id: 'grouping-factor', title: 'Grouping correction', status: 'info', headline: 'kg = ' + fmt(kg, 3), sentence: 'For ' + Math.round(c.ncirc) + ' circuit' + (Math.round(c.ncirc) > 1 ? 's' : '') + ': ' + kgSrc + '.', check: '' });
  if (!isNaN(kg) && Math.round(c.ncirc) > 1) rely.push({ what: 'Grouping factor', src: kgSrc, verified: !!sets['grouping-factor'] && sets['grouping-factor'].status === 'verified' });
  /* 5-7 capacity and overload rules */
  const Iz = Itab * kt * kg, haveIz = isFinite(Iz);
  if (!haveIz) {
    ['capacity', 'overload-1', 'overload-2'].forEach((id) => push({ id, title: id === 'capacity' ? 'Derated cable capacity Iz' : id === 'overload-1' ? 'Overload rule Ib ≤ In ≤ Iz' : 'Overload rule I2 ≤ 1.45 Iz', status: 'pending', badge: 'missing input', headline: 'Not verified', sentence: 'The derated capacity needs the tabulated ampacity, the temperature factor and the grouping factor, and one or more is missing (see above).', check: '' }));
  } else {
    push({ id: 'capacity', title: 'Derated cable capacity Iz', status: 'info', headline: fmt(Iz, 1) + ' A', sentence: 'Iz = ' + fmt(Itab, 1) + ' × ' + fmt(kt, 3) + ' × ' + fmt(kg, 3) + ' = ' + fmt(Iz, 2) + ' A.', check: '' });
    const o1 = c.Ib <= c.In && c.In <= Iz;
    push({ id: 'overload-1', title: 'Overload rule Ib ≤ In ≤ Iz', status: o1 ? 'pass' : 'fail', headline: fmt(c.Ib, 1) + ' ≤ ' + fmt(c.In, 1) + ' ≤ ' + fmt(Iz, 1) + ' A', sentence: o1 ? 'The device rating lies between the design current and the cable capacity.' : (c.Ib > c.In ? 'The device rating is below the design current.' : 'The device rating exceeds the derated cable capacity.'), check: '' });
    const I2 = c.I2f * c.In, o2 = I2 <= 1.45 * Iz;
    push({ id: 'overload-2', title: 'Overload rule I2 ≤ 1.45 Iz', status: o2 ? 'pass' : 'fail', headline: fmt(I2, 1) + ' A vs ' + fmt(1.45 * Iz, 1) + ' A', sentence: 'I2 = ' + fmt(c.I2f, 2) + ' × In. The factor 1.45 is the widely published overload coefficient.', check: 'Confirm the 1.45 coefficient and the I2 definition against the edition of the wiring rules you design to.' });
    rely.push({ what: 'Overload coefficient 1.45', src: 'built-in constant, edition not revalidated', verified: false });
  }
  /* 8 breaking capacity */
  const Imax = c.Imax;
  push(c.Icu !== undefined ? { id: 'breaking-capacity', title: 'Breaking capacity', status: c.Icu >= Imax ? 'pass' : 'fail', headline: fmt(c.Icu / 1000, 1) + ' kA rated vs ' + fmt(Imax / 1000, 2) + ' kA maximum fault', sentence: 'Compares the rated breaking capacity with the maximum prospective fault you entered.', check: '' }
    : { id: 'breaking-capacity', title: 'Breaking capacity', status: 'pending', badge: 'missing input', headline: 'Not verified', sentence: 'No breaking capacity was entered.', check: '' });
  /* 9 withstand at max fault */
  let k = NaN, kSrc = '', kVer = false;
  if (sets['k-factor']) { const d = sets['k-factor'], mm = mismatch(d, 'k factor'), l = dsRange(d, Amm); if (!mm && l.ok) { k = l.value; kSrc = 'k dataset (' + dstat(d) + ')'; kVer = d.status === 'verified'; } }
  if (isNaN(k)) { k = kShortCircuit(mat, Amm); kSrc = 'built-in k, edition not revalidated'; kVer = false; }
  const Smin = Imax * Math.sqrt(c.tmax) / k, wOk = Amm >= Smin;
  push({ id: 'withstand-max', title: 'Short-circuit withstand at maximum fault', status: wOk ? 'pass' : 'fail', headline: 'Needs ≥ ' + fmt(Smin, 1) + ' mm², chosen ' + fmt(Amm, 0) + ' mm²', sentence: 'S = I √t / k = ' + fmt(Imax, 0) + ' × √' + fmt(c.tmax, 3) + ' / ' + k + ' (k from the ' + kSrc + ').', check: c.tmax > 5 ? '' : '' });
  rely.push({ what: 'Short-circuit k factor', src: kSrc, verified: kVer });
  /* 10 disconnection at min fault */
  if (c.Imin !== undefined && c.tmin !== undefined) {
    const tAllow = Math.pow(k * Amm / c.Imin, 2), okT = c.tmin <= tAllow && tAllow >= 0;
    push({ id: 'min-fault-time', title: 'Disconnection at the minimum fault', status: okT ? 'pass' : 'fail', headline: fmt(c.tmin, 3) + ' s device vs ' + fmt(tAllow, 3) + ' s allowed', sentence: 'Allowed time t = (k S / I)² = (' + k + ' × ' + fmt(Amm, 0) + ' / ' + fmt(c.Imin, 0) + ')² = ' + fmt(tAllow, 3) + ' s.', check: tAllow > 5 ? 'The adiabatic equation is normally limited to 5 s; confirm the permitted disconnection time with your standard.' : '' });
  } else push({ id: 'min-fault-time', title: 'Disconnection at the minimum fault', status: 'pending', badge: 'missing input', headline: 'Not verified', sentence: 'Needs the minimum fault current at the far end and the device disconnection time at that current.', check: '' });
  push(c.Imin !== undefined && c.Ii !== undefined ? { id: 'pickup', title: 'Instantaneous pick-up vs minimum fault', status: c.Ii <= c.Imin ? 'pass' : 'fail', headline: fmt(c.Ii, 1) + ' A pick-up vs ' + fmt(c.Imin, 1) + ' A minimum fault', sentence: 'The minimum fault must exceed the upper tolerance of the instantaneous setting for the device to trip without delay.', check: '' }
    : { id: 'pickup', title: 'Instantaneous pick-up vs minimum fault', status: 'pending', badge: 'missing input', headline: 'Not verified', sentence: 'Needs the minimum fault current and the pick-up setting.', check: '' });
  push(c.Isel !== undefined ? { id: 'selectivity', title: 'Selectivity limit', status: c.Isel >= Imax ? 'pass' : 'fail', headline: fmt(c.Isel / 1000, 1) + ' kA limit vs ' + fmt(Imax / 1000, 2) + ' kA maximum fault', sentence: 'Compares the manufacturer selectivity limit you entered with the maximum fault. This is not a time-current curve study.', check: '' }
    : { id: 'selectivity', title: 'Selectivity limit', status: 'pending', badge: 'missing input', headline: 'Not verified', sentence: 'No manufacturer selectivity limit was entered.', check: '' });
  const failed = steps.some((s) => s.status === 'fail'), pending = steps.filter((s) => s.status === 'pending').map((s) => s.title);
  const unverifiedData = rely.filter((r) => !r.verified).map((r) => r.what + ' (' + r.src + ')');
  const statusText = failed ? 'ONE OR MORE CHECKS FAIL' : pending.length ? 'MODELED CHECKS PASSED, ' + pending.length + ' NOT VERIFIED' : 'ALL CHECKS PASSED, ON DATA AND CONSTANTS THAT ARE NOT INDEPENDENTLY VERIFIED';
  const report = ['CABLE SELECTION CHECK', 'Generated by Elecmetric v' + VERSION, '', 'INPUTS', 'Ib ' + fmt(c.Ib, 1) + ' A, In ' + fmt(c.In, 1) + ' A, ' + fmt(Amm, 0) + ' mm² ' + cond + ' / ' + ins + ', ambient ' + fmt(c.Ta, 1) + ' °C, ' + Math.round(c.ncirc) + ' circuit(s)', '', 'RESULTS'].concat(steps.map((s) => s.title + ': ' + s.headline + (s.status === 'pass' ? '  [PASS]' : s.status === 'fail' ? '  [FAIL]' : s.status === 'pending' ? '  [' + (s.badge || 'not verified').toUpperCase() + ']' : ''))).concat(['', 'STATUS: ' + statusText, '', 'RELIED ON, NOT VERIFIED: ' + (unverifiedData.length ? unverifiedData.join('; ') : 'none'), 'NOT CHECKED BY ELECMETRIC: ' + CABLE_SEL_NOT_CHECKED.join('; '), 'Results are design assistance. The responsible engineer must verify against the applicable standard.']).join('\n');
  return { ok: true, steps, failed, status: failed ? 'fail' : 'partial', statusText, pending, unverifiedData, notChecked: CABLE_SEL_NOT_CHECKED, report, Iz: haveIz ? Iz : null };
}

/* ---------- Public API: plain object in, plain object out. Omitted inputs take the calculator default. ---------- */
function api(id, payload) {
  const def = BY_ID[id];
  if (!def) return { ok: false, error: 'Unknown calculator: ' + id };
  const raw = {}, p = payload || {};
  def.inputs.forEach((s) => { const v = p[s.key]; if (v === undefined) { if (s.optional) raw[s.key] = ''; return; } raw[s.key] = s.type === 'enum' ? v : [v, p[s.key + 'Unit'] || s.unit]; });
  const r = calculate(def, raw);
  if (!r.ok) return { ok: false, id, errors: r.errors };
  const outputs = {};
  r.outputs.forEach((o) => { outputs[o.key] = { label: o.label, value: Number((o.value / FACTOR[o.unit]).toPrecision(12)), unit: o.unit }; });
  return { ok: true, id, calculatorVersion: def.version, engine: VERSION, outputs, warnings: r.warnings, summary: r.sentence };
}

root.Engine = { VERSION, APPLIANCES, BASES, api, UNITS, FACTOR, CONV_UNITS, unitsOf, convertUnits, fmt, q, setGrouping, getGrouping, detectGrouping, readNumber, CALCS, BY_ID, calculate, defaultsRaw, show, runTests, FEEDER_INPUTS, runFeeder, runCableSelection, CABLE_SEL_INPUTS, CABLE_SEL_NOT_CHECKED, parseDatasetCsv, DS_KINDS, parse, awgChart, awgFromArea, swgChart };
if (typeof module !== 'undefined') module.exports = root.Engine;
})(typeof window !== 'undefined' ? window : globalThis);
