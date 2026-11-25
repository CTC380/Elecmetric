/* Per-page standards that replace the category list in tools/calc_refs.js where the category list does not fit the calculator
   (FAQ review fix, v1.99.101: e.g. the Data Centre PUE page was citing the indoor-lighting standard). Key = calculator page folder.
   Same rules as calc_refs.js: widely published standard numbers only, named as background reading; an empty list says no single
   standard sets the method instead of inventing one. Applied to built pages by tools/calc_refs_fix.js and by tools/build_pages.js. */
const GEN = 'No single standard sets the method for this calculation. Use the equipment data sheets and your project specification for the values you enter.';
const S = (refs, note) => ({ refs, note });
module.exports = {
  'thermal-rise': S(['IEC 61439-1 (low-voltage switchgear and controlgear assemblies)'], 'The assembly manufacturer\'s verified data decides the real temperature rise; treat this as a first estimate.'),
  'busbar-sizing': S(['IEC 61439-1 (low-voltage switchgear and controlgear assemblies)'], 'Busbar ratings come from the assembly manufacturer\'s verified data; treat this as a first estimate.'),
  'pue': S(['ISO/IEC 30134-2 (power usage effectiveness)'], 'Compare PUE values only when total facility power and IT power are measured at the same points and over the same period.'),
  'ladder-logic-simulator': S(['IEC 61131-3 (programmable controllers, programming languages)'], 'This is a teaching simulation of one rung. The PLC manufacturer\'s manual defines how a real controller scans and behaves.'),
  'plant-load-flow': S([], GEN), 'water-heater-kw': S([], GEN), 'contact-resistance': S([], GEN), 'load-schedule': S([], GEN),
  'rack-cooling': S([], GEN), 'fan-pump-affinity': S([], GEN), 'led-retrofit-payback': S([], GEN),
  'bess-energy-power': S([], GEN), 'generator-fuel': S([], GEN),
  'battery-series-parallel': S(['IEC 62485-2 (safety requirements for stationary batteries and battery installations)'], 'Cell and battery limits come from the manufacturer data sheet.'),
  'ups-runtime': S(['IEC 62040-3 (uninterruptible power systems, performance and test requirements)', 'IEEE Std 485 (sizing lead-acid batteries for stationary applications)'], 'Runtime depends on battery age, temperature and discharge rate; use the manufacturer\'s discharge tables.'),
  'railway-backup-load': S(['IEEE Std 485 (sizing lead-acid batteries for stationary applications)'], 'The capacity allowances come from the battery data sheet and your project specification.'),
  'battery-charge-time': S([], 'Charge time depends on the charger and the battery manufacturer\'s charging profile.'),
  'alternator-emf': S(['IEC 60034-1 (rotating electrical machines, rating and performance)'], 'Where the machine data sheet gives a value, use it in place of a calculated one.'),
  'harmonic-thd': S(['IEEE Std 519 (harmonic limits)'], 'Limits apply at the point of common coupling and come from your utility and the edition of the standard you design to.'),
  'reliability-indices': S(['IEEE Std 1366 (electric power distribution reliability indices)'], 'Your regulator may define the indices and exclusions differently; check the rules that apply to you.'),
  'load-flow-3bus': S([], 'Load flow and per-unit methods are textbook power-system analysis, not the subject of one standard. Check results against your utility\'s requirements and the equipment data sheets.'),
  'per-unit-base': S([], 'Load flow and per-unit methods are textbook power-system analysis, not the subject of one standard. Check results against your utility\'s requirements and the equipment data sheets.'),
  'per-unit-convert': S([], 'Load flow and per-unit methods are textbook power-system analysis, not the subject of one standard. Check results against your utility\'s requirements and the equipment data sheets.'),
  'ev-charger-load': S(['IEC 61851-1 (electric vehicle conductive charging system)'], 'Charger and vehicle data sheets set the real power and efficiency.'),
  'ev-charge-time': S(['IEC 61851-1 (electric vehicle conductive charging system)'], 'Charger and vehicle data sheets set the real power and efficiency.'),
  'ev-energy-consumption': S([], 'Real consumption depends on the vehicle, route, temperature and driving style. Use the manufacturer\'s tested figures where you have them.'),
  'ev-range': S([], 'Real range depends on the vehicle, route, temperature and driving style. Use the manufacturer\'s tested figures where you have them.'),
  'wind-power': S(['IEC 61400-1 (wind turbines, design requirements)'], 'Turbine power curves come from the manufacturer; local wind data and grid codes set the rest.'),
  'capacitance-series-parallel': S([], 'These are textbook component relationships. Capacitor data sheets set tolerances and voltage ratings.'),
  'pt-ratio': S(['IEC 61869-3 (inductive voltage transformers)'], 'Ratio and accuracy class come from the transformer nameplate and test certificate.'),
  'power-measurement': S([], 'These are textbook measurement relationships. Meter data sheets set accuracy and ranges.'),
  'two-wattmeter': S([], 'These are textbook measurement relationships. Meter data sheets set accuracy and ranges.'),
  'ir-temp-correction': S([], 'Insulation test limits and temperature-correction rules come from the equipment manufacturer and the test standard your specification names.'),
  'insulation-pi-dar': S([], 'Insulation test limits and temperature-correction rules come from the equipment manufacturer and the test standard your specification names.'),
  'measurement-uncertainty': S(['JCGM 100:2008 (Guide to the expression of uncertainty in measurement)'], 'Instrument uncertainty values come from calibration certificates and data sheets.')
};
