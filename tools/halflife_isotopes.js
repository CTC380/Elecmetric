/* Elecmetric Half-Life Calculator: isotope half-life presets (Mode 01 page).
   Each entry is a published half-life, in the unit it was published in, with the source it was taken from. Nothing here is computed.
   Values are rounded as published. Evaluations differ in the last digits (for example Co-60 is 5.2711 y in IRDFF-II and 5.2714 y in older IAEA tables),
   so the page tells the user to check the source their own work requires. Used by tools/halflife_page.js and tests/halflife_isotopes_test.js. */
const SOURCES = {
  ensdf: { label: 'ENSDF evaluated values, as quoted by B. Singh, \u201cUltra-precise half-lives in literature and evaluation issues\u201d, IAEA NSDD meeting, Vienna, 8\u201312 April 2019', note: 'Tc-99m is the ENSDF-2017 value, I-131 the ENSDF January 2019 value, F-18 the ENSDF value from the 1995 evaluation.' },
  irdff: { label: 'IRDFF-II recommended nuclear decay data, Trkov et al., Nuclear Data Sheets (IAEA), Table 8', note: 'Co-60 is a BIPM (DDEP) value and Cs-137 an ENSDF value, as tabulated there.' },
  npl: { label: 'NPL reference half-lives, \u201cDevelopments in mass spectrometry relevant reference materials\u201d (hosted by BIPM)', note: 'The Am-241, Ra-226 and U-238 values also appear in the DDEP evaluations listed by the IAEA (432.6 y, 1600 y, 4.468\u00d710\u2079 y).' },
  conv: { label: 'Long-standing conventional value used in radiocarbon dating', note: 'Evaluated nuclear-data libraries may list a slightly different value, so radiocarbon work should state which half-life it uses.' }
};
/* id, display name, symbol, half-life value, time-unit key (as in halflife_engine TIME_UNITS), standard uncertainty in the same unit (null = not given), source key */
const LIST = [
  ['c14', 'Carbon-14', 'C-14', 5730, 'yr', null, 'conv'],
  ['f18', 'Fluorine-18', 'F-18', 109.77, 'min', 0.05, 'ensdf'],
  ['tc99m', 'Technetium-99m', 'Tc-99m', 6.0072, 'h', 0.0009, 'ensdf'],
  ['i131', 'Iodine-131', 'I-131', 8.0252, 'd', 0.0006, 'ensdf'],
  ['co60', 'Cobalt-60', 'Co-60', 5.2711, 'yr', 0.0008, 'irdff'],
  ['cs137', 'Caesium-137', 'Cs-137', 30.08, 'yr', 0.09, 'irdff'],
  ['ra226', 'Radium-226', 'Ra-226', 1600, 'yr', 7, 'npl'],
  ['am241', 'Americium-241', 'Am-241', 432.6, 'yr', 0.6, 'npl'],
  ['pu239', 'Plutonium-239', 'Pu-239', 24110, 'yr', 30, 'npl'],
  ['u238', 'Uranium-238', 'U-238', 4.468, 'Gyr', 0.006, 'npl']
].map((r) => ({ id: r[0], name: r[1], symbol: r[2], T: r[3], unit: r[4], unc: r[5], source: r[6] }));
module.exports = { SOURCES, LIST, byId: (id) => LIST.find((x) => x.id === id) || null };
