/* Content for the dedicated calculator landing pages (Issue 4 of the v1.5.13 re-audit).
   Pure data. tools/build_pages.js turns each entry into /calculators/<slug>/index.html.
   Rules for editing this file:
   - No result figures in the text. Every number on a page is computed by engine.js at build time.
   - Each page has its own search intent. Where two calculators answer the same question (kW to amps, short-circuit vs transformer fault current,
     cable ampacity vs derating) there is ONE page, so pages do not compete with each other.
   - `caveat` says what the calculator does not do. It is shown above the formula, not buried in the footer.
   - `desc` is 50 to 160 characters and unique; `name` + ' Calculator | Elecmetric' must stay within 60 characters. */
module.exports = [
  {
    slug: 'motor-current', calc: 'motor-current', name: 'Motor Full-Load Current', group: 'Motors',
    desc: 'Estimate the full-load current of a three-phase or single-phase motor from kW, voltage, power factor and efficiency, with the formula and worked example.',
    head: [['I', 'A'], ['Pin', 'kW']], vary: ['P', 'kW', [5.5, 11, 22, 55, 110, 250, 400]],
    intro: 'Use this when you know the motor rating in kW but not the current, for example while choosing a starter, a cable or a breaker before the nameplate is available. Efficiency and power factor are inputs because the line current depends on both, not on the shaft power alone.',
    caveat: 'This is a planning estimate. When the motor nameplate gives a full-load current, use the nameplate value. Starting current is not included; the motor starting calculator covers it.',
    faq: [
      ['Why is the current higher than the rated kW divided by the voltage?', 'The kW rating is shaft power. The motor draws more electrical power than that because of its losses (efficiency), and for the same power a lower power factor means more current. The formula divides by efficiency, power factor, the voltage and √3 for three-phase.'],
      ['Should I use the nameplate current instead?', 'Yes, when you have it. The nameplate figure is measured for that motor. Use the calculated value only for planning when the nameplate or data sheet is not available yet.'],
      ['Does this give the starting current?', 'No. Starting current is several times the full-load current and depends on the starting method. Use the motor starting current calculator with the full-load current from this page.']
    ],
    pages: ['motor-starting', 'cable-size', 'generator-sizing'], app: ['motor-start-dip', 'breaker-size']
  },
  {
    slug: 'motor-starting', calc: 'motor-starting', name: 'Motor Starting Current', group: 'Motors',
    desc: 'Find the line starting current and relative torque of a motor started direct on line, star-delta or with an auto-transformer, with formula and worked example.',
    head: [['Ist', 'A'], ['Tq', '']], vary: ['In', 'A', [20, 50, 100, 140, 200, 400]],
    intro: 'Use this to see how much the starting method changes the current drawn from the supply and the torque available at the shaft. Enter the full-load current and the locked-rotor multiple from the data sheet, then compare direct on line, star-delta and auto-transformer starting.',
    caveat: 'The model assumes motor torque varies with the square of the voltage and that the supply does not sag during the start. Star-delta suits light or no-load starts only. Check the real supply voltage dip with the motor starting voltage dip calculator.',
    faq: [
      ['How much does star-delta starting reduce the starting current?', 'Star-delta divides the line starting current by 3, and the starting torque is divided by 3 as well. The changeover from star to delta can cause a second current peak, which this model does not show.'],
      ['How does an auto-transformer reduce the starting current?', 'The motor sees the tap fraction of the supply voltage. The current and the torque both fall with the square of the tap, so a tap of 0.65 gives about 42% of the direct-on-line values.'],
      ['Where do I find the locked-rotor current multiple?', 'It is on the motor data sheet, often as locked-rotor current over full-load current. Values of 5 to 8 times are common for induction motors; use the data sheet figure, not a typical one, for design.']
    ],
    pages: ['motor-current', 'cable-size'], app: ['motor-start-dip', 'breaker-size', 'voltage-drop']
  },
  {
    slug: 'transformer-sizing', calc: 'transformer-sizing', name: 'Transformer Sizing', group: 'Transformers',
    desc: 'Work out the transformer kVA rating you need from load, power factor, growth allowance and target loading, rounded up to the next standard size.',
    head: [['Sr', 'kVA'], ['Ss', 'kVA'], ['I', 'A']], vary: ['P', 'kW', [50, 100, 200, 450, 800, 1500]],
    intro: 'Use this to turn a connected running load into a transformer rating. It adds a growth allowance, divides by the loading you want the transformer to run at, and rounds up to the next standard size so you can also see the secondary full-load current of that size.',
    caveat: 'Harmonic-rich loads, motor starting and a high ambient temperature can call for a larger or K-rated transformer; none of these is modelled. Confirm the result against the manufacturer data before ordering.',
    faq: [
      ['Why not choose the transformer that exactly matches the load?', 'Transformers are sold in standard sizes, loads grow, and running a transformer near its full rating all day leaves no margin. The calculator adds a growth allowance and a target loading, then rounds up to the next standard size.'],
      ['Which standard sizes does it use?', 'The standard kVA series listed in the assumptions below, from 25 kVA up to 3,150 kVA. If your utility or supplier uses a different series, take the required rating and select from their list.'],
      ['What target loading should I enter?', 'It is a design choice. A lower figure leaves more headroom and lower losses at the cost of a larger unit. Enter the loading your specification or utility asks for.']
    ],
    pages: ['transformer-fault-current', 'generator-sizing', 'cable-size', 'transformer-efficiency'], app: ['transformer-current', 'transformer-loading', 'transformer-efficiency']
  },
  {
    slug: 'transformer-fault-current', calc: 'fault-current', name: 'Transformer Fault Current', group: 'Short circuit',
    desc: 'Calculate the prospective three-phase short-circuit current at a transformer secondary from kVA, voltage and impedance percent, with formula and examples.',
    head: [['Isc', 'kA']], vary: ['S', 'kVA', [250, 500, 1000, 1600, 2000]],
    intro: 'Use this for a first estimate of the short-circuit current available at the secondary terminals of a transformer, for example when checking the breaking capacity of the breaker or switchgear that will be connected there.',
    caveat: 'This is an upper bound. It treats the supply as an infinite source and ignores cable impedance, so the real fault current at a downstream board is lower. It is not a substitute for a short-circuit study, and the equipment rating must still be read from the manufacturer data.',
    faq: [
      ['Is this the same as a short-circuit current calculator?', 'It answers the most common version of that question: the three-phase fault level at a transformer secondary. Faults further along a cable run, or with a weak supply, need the source and cable impedance included, which this calculator does not do.'],
      ['Why is the result called an upper bound?', 'Adding the utility source impedance and the cable impedance always lowers the fault current. Ignoring them gives the highest value, which is the safe side for a first check of breaker breaking capacity.'],
      ['What impedance do I enter?', 'Use the impedance voltage in percent from the transformer nameplate or data sheet. Typical distribution transformers are around 4 to 6 percent, but use the actual figure.']
    ],
    pages: ['transformer-sizing', 'earth-resistance', 'cable-size'], app: ['fault-mva', 'fault-types', 'breaker-size']
  },
  {
    slug: 'cable-size', calc: 'cable-size-vd', name: 'Cable Size for Voltage Drop', group: 'Cables',
    desc: 'Find the smallest standard cable cross-section that keeps voltage drop within your limit, from current, length, voltage, power factor and conductor type.',
    head: [['Amin', 'mm²'], ['Astd', 'mm²'], ['pct', '']], vary: ['L', 'm', [25, 50, 100, 180, 250, 300]],
    intro: 'Use this when a long run, not the current rating, is likely to decide the cable size. Enter the load, the route length and the voltage drop you will accept, and it returns the minimum cross-section and the next standard size with the drop that size gives.',
    caveat: 'This sizes for voltage drop only; it is not a cable rating. Check the derated current capacity and the short-circuit withstand before choosing a cable.',
    faq: [
      ['Is the size it gives enough for the current?', 'Not necessarily. Voltage drop and current capacity are separate checks and the larger size governs. Use the cable derating calculator for the current capacity, and check the short-circuit withstand as well.'],
      ['What voltage drop limit should I use?', 'The limit comes from the wiring rules or specification you work to and differs by circuit type and country. Enter that figure; Elecmetric does not decide it for you.'],
      ['Which standard sizes does it choose from?', 'The IEC 60228 preferred series from 1.5 to 630 mm², as listed in the assumptions below. If you buy another series, use the minimum cross-section and select upward from your own list.']
    ],
    pages: ['cable-derating', 'ac-voltage-drop', 'motor-current', 'cable-sc-withstand'], app: ['cable-sc-withstand', 'parallel-cable-sets', 'breaker-size']
  },
  {
    slug: 'cable-derating', calc: 'cable-derating', name: 'Cable Derating and Ampacity', group: 'Cables',
    desc: 'Derate a cable for ambient temperature and grouping to get its usable current capacity, and the tabulated ampacity you must start from for a given breaker.',
    head: [['kt', ''], ['Iz', 'A'], ['Ireq', 'A']], vary: ['Ta', '', [30, 35, 40, 45, 50, 55]],
    intro: 'Use this to find the current a cable can actually carry once the ambient temperature and grouping are accounted for, or the tabulated ampacity a cable must have to be protected by a given device. It also checks the design current against the device rating and the derated capacity.',
    caveat: 'Tabulated ampacities are not built in, because they depend on the installation method and come from licensed standards. Enter the value from your cable data sheet or the standard. The calculation bases apply the factors listed in the assumptions below; they are not complete regional table lookups, so check the result against the standard you work to.',
    faq: [
      ['Where do I get the tabulated ampacity?', 'From the cable manufacturer data sheet or the installation table in the standard you work to, for your installation method and conductor. Elecmetric applies the correction factors to that figure; it does not look it up.'],
      ['How is the temperature factor worked out?', 'It comes from the heat balance of the conductor, the square root of the margin between the conductor limit and the ambient, over the margin between the conductor limit and the reference ambient of the table. The formula above shows it.'],
      ['Is cable ampacity a separate calculation from derating?', 'No. The derated current capacity is the ampacity for your conditions, so this one page covers both questions.']
    ],
    pages: ['cable-size', 'transformer-sizing', 'motor-current'], app: ['feeder-designer', 'cable-sc-withstand', 'breaker-size']
  },
  {
    slug: 'ac-voltage-drop', calc: 'ac-voltage-drop', name: 'AC Voltage Drop', group: 'Cables',
    desc: 'Calculate single-phase or three-phase AC voltage drop from current, length, conductor size, power factor and reactance, with the formula and worked example.',
    head: [['Vd', 'V'], ['pct', '']], vary: ['L', 'm', [10, 25, 50, 100, 150, 200]],
    intro: 'Use this when the circuit carries AC and the power factor and cable reactance matter, so a simple resistive estimate is not good enough. It takes the conductor size as an area, AWG number or diameter, and corrects the resistance for conductor temperature.',
    caveat: 'Skin and proximity effect are not included, and they matter above about 150 mm². Reactance is the per-conductor value you enter from the data sheet. Compare the drop with the limit in your standard or specification.',
    faq: [
      ['How is this different from the voltage drop calculator for DC?', 'An AC circuit has reactance as well as resistance, and the power factor decides how much of each counts. The formula uses R cos φ plus X sin φ; the DC calculator uses resistance alone.'],
      ['Why is the single-phase drop calculated over the out-and-return path?', 'Current flows out on one conductor and back on the other, so the drop is over twice the one-way length. Three-phase uses √3 with the line-to-line voltage instead.'],
      ['When is the load power factor leading?', 'Only for a capacitive load. A leading current makes the reactive term reduce the drop. For the usual inductive load keep lagging.']
    ],
    pages: ['cable-size', 'cable-derating'], app: ['voltage-drop', 'dc-voltage-drop', 'breaker-size']
  },
  {
    slug: 'generator-sizing', calc: 'generator-kva', name: 'Generator Sizing', group: 'Generators',
    desc: 'Size a generator in kVA from running load, power factor and design margin, rounded to a standard rating, with the rated line current at that size.',
    head: [['Sr', 'kVA'], ['Ss', 'kVA'], ['I', 'A']], vary: ['P', 'kW', [50, 100, 200, 400, 800]],
    intro: 'Use this for a first estimate of the generator rating needed to carry a known running load. It converts kW to kVA with the power factor, adds your design margin, rounds up to a standard size and gives the rated current of that size for the breaker and cable.',
    caveat: 'This covers the running load only. Motor starting, non-linear loads, and altitude or temperature derating need a separate check and can raise the size. Only the required rating is cross-checked against separately coded values; the standard-size table and rated current are not yet.',
    faq: [
      ['Why does the generator size depend on power factor?', 'Generators are rated in kVA, while loads are usually known in kW. The same kW at a lower power factor needs more kVA, so the calculator divides the running load by the power factor.'],
      ['Does this allow for motor starting?', 'No. Large motors can pull the voltage down at start and may need a larger set. Check them with the motor starting current and voltage dip calculators.'],
      ['What design margin should I add?', 'It is a design choice that covers growth and uncertainty in the load figure. Use the figure your specification or client sets; the calculator adds it as a percentage.']
    ],
    pages: ['transformer-sizing', 'motor-starting', 'battery-bank-sizing'], app: ['generator-fuel', 'breaker-size', 'motor-start-dip']
  },
  {
    slug: 'earth-resistance', calc: 'earth-rod-resistance', name: 'Earth Rod Resistance', group: 'Earthing',
    desc: 'Estimate the resistance to earth of a single vertical earth rod from soil resistivity, rod length and diameter, with the formula and a worked example.',
    head: [['R', 'Ω']], vary: ['rho', '', [30, 50, 100, 200, 500, 1000]],
    intro: 'Use this to see roughly what a single driven rod will give in a soil of known resistivity, and how much a longer or thicker rod helps. It is a design estimate to decide whether one rod could be enough or whether you will need several rods or a grid.',
    caveat: 'The model assumes uniform soil and one rod with no other electrodes nearby. Soil moisture and season can change the real resistance several-fold, so measure on site. Parallel rods must be spaced at least their length apart to help; use the earth rods in parallel calculator for that.',
    faq: [
      ['Does a longer rod or a thicker rod help more?', 'Length helps much more. The resistance falls roughly in proportion to the length, while the diameter enters only through a logarithm, so a thicker rod changes it very little.'],
      ['What soil resistivity should I use?', 'Use a measured value from the site, for example from a four-pin test. Soil resistivity varies widely with moisture, temperature and soil type, so a handbook figure is only a rough guide.'],
      ['Is the calculated value what an earth tester will read?', 'Not exactly. Real soil is layered and changes with the season. Treat the calculation as a design estimate and verify the installed electrode by measurement.']
    ],
    pages: ['transformer-fault-current', 'cable-size', 'earth-grid-resistance'], app: ['earth-rods-parallel', 'earth-grid-resistance', 'fault-loop-impedance']
  },
  {
    slug: 'solar-pv-sizing', calc: 'pv-array-size', name: 'Solar PV Array Sizing', group: 'Solar PV',
    desc: 'Size a solar PV array from your daily energy need, peak sun hours, performance ratio and module rating, and get the number of modules, with the formula.',
    head: [['Pa', 'kW'], ['nm', '']], vary: ['E', 'kWh', [5, 10, 30, 60, 100]],
    intro: 'Use this to turn a daily energy target into an array rating and a module count. It divides the energy by the peak sun hours and the performance ratio, then rounds the number of modules up.',
    caveat: 'Get the peak sun hours from irradiation data for the site and the tilt of the array. Roof area, the string voltage window and the inverter size are separate checks. The string length calculator covers the voltage limit.',
    faq: [
      ['What are peak sun hours?', 'The daily solar energy on the module plane in kWh per square metre, which is equal to the hours of full sun at 1 kW per square metre. It depends on the site, season and tilt.'],
      ['What does the performance ratio cover?', 'The losses between the nameplate rating and the energy delivered: temperature, soiling, cable and inverter losses. Use a value you can justify for the site and the equipment.'],
      ['How many modules fit in a string?', 'That is a voltage question, not an energy one. Use the solar PV string size calculator, which limits the number of modules so the cold-weather open-circuit voltage stays under the system limit.']
    ],
    pages: ['solar-pv-string-size', 'battery-bank-sizing'], app: ['pv-energy', 'ups-runtime']
  },
  {
    slug: 'solar-pv-string-size', calc: 'pv-string-size', name: 'Solar PV String Size', group: 'Solar PV',
    desc: 'Find the maximum number of PV modules in series so the cold-weather open-circuit voltage stays under the system limit, with the formula and worked example.',
    head: [['Vc', 'V'], ['N', '']], vary: ['Tmin', '', [-20, -10, -5, 0, 10]],
    intro: 'Use this to find how many modules you can connect in series. The open-circuit voltage of a module rises as it gets colder, so the limit is set by the lowest site temperature, not by the standard test conditions on the data sheet.',
    caveat: 'This sets only the upper limit of the string length. Also check the inverter MPPT window at hot-weather voltage so the string still operates in summer.',
    faq: [
      ['Why use the lowest site temperature?', 'The open-circuit voltage is highest when the modules are coldest and unloaded. The string must stay under the maximum system voltage in that condition.'],
      ['Where do I find the temperature coefficient?', 'On the module data sheet, as the temperature coefficient of Voc in percent per degree Celsius. It is negative, so a lower temperature raises the voltage.'],
      ['Does this check the inverter input window?', 'No. It checks only the maximum voltage. The minimum number of modules depends on the inverter MPPT window at the hottest operating temperature, which needs its own check.']
    ],
    pages: ['solar-pv-sizing', 'battery-bank-sizing'], app: ['pv-energy', 'pv-array-size']
  },
  {
    slug: 'battery-bank-sizing', calc: 'battery-bank-size', name: 'Battery Bank Sizing', group: 'Batteries',
    desc: 'Size a battery bank in Ah from load power, backup time, bank voltage, depth of discharge and inverter efficiency, with the formula and a worked example.',
    head: [['Ah', 'Ah'], ['E', 'kWh']], vary: ['t', 'h', [1, 2, 4, 8, 12]],
    intro: 'Use this to find the battery capacity needed to carry a constant load for a set backup time. It allows for the usable depth of discharge and the inverter efficiency, and gives the energy drawn from the battery as well as the capacity in amp-hours.',
    caveat: 'No ageing, temperature or Peukert allowance is included. Add an ageing margin (typically 20 to 25%) and a temperature factor before selecting the battery, and use the capacity quoted at the discharge rate of your backup time.',
    faq: [
      ['Why is the Ah more than the energy divided by the voltage?', 'Only part of the battery can be used, set by the depth of discharge, and the inverter loses some energy. The formula divides by both, so the bank must be larger than the plain energy figure.'],
      ['Should I add a margin to the result?', 'Yes. The result is the capacity needed when new, at the rated temperature. Batteries lose capacity with age and in the cold, so add an ageing margin and a temperature factor.'],
      ['How is this different from battery runtime?', 'This works from the backup time you need to the capacity required. The UPS runtime calculator goes the other way, from a given battery to the time it can carry the load.']
    ],
    pages: ['generator-sizing', 'solar-pv-sizing'], app: ['ups-runtime', 'battery-series-parallel', 'battery-charge-time']
  },
  {
    slug: 'agl-ccr-loading', calc: 'agl-ccr-loading', name: 'AGL CCR Loading', group: 'Airport and AGL',
    desc: 'Estimate the load, loop voltage and smallest standard CCR for an airfield ground lighting series circuit from fittings, lamp power and cable length.',
    head: [['Pt', 'kW'], ['Vo', 'V'], ['ccr', 'kW'], ['pct', '']], vary: ['n', '', [20, 40, 60, 80, 100]],
    intro: 'Use this for a first estimate of the load on an airfield ground lighting series circuit and the constant current regulator (CCR) size it points to. It adds the lamp load, with the isolating transformer efficiency, to the cable loss in the series loop.',
    caveat: 'This is a simplified estimating model, not a design tool. Confirm the load model and the CCR rating against the fitting, isolating transformer and CCR manufacturer data and the project requirements, and check the highest brightness step, because lamp failures shift the load.',
    faq: [
      ['Why does the cable loss matter in a series circuit?', 'The same current flows through every fitting and through the whole cable loop, so the loop resistance dissipates I² × R. The regulator has to supply it on top of the lamp load.'],
      ['Which CCR sizes does it choose from?', 'The standard sizes listed in the assumptions below. If your manufacturer offers other ratings, take the required load and select from their range.'],
      ['Can I rely on this for a project design?', 'Not on its own. Use it to screen options, then verify with the manufacturer output curves, the isolating transformer open-circuit behaviour and the project specification.']
    ],
    pages: ['cable-size', 'agl-isolating-transformer', 'agl-max-fittings', 'agl-ccr-input-energy'], app: ['insulation-pi-dar', 'ir-temp-correction']
  },
  {
    slug: 'transformer-efficiency', calc: 'transformer-efficiency', name: 'Transformer Efficiency', group: 'Transformers',
    desc: 'Calculate transformer efficiency, total loss and the load at maximum efficiency from kVA rating, iron loss, copper loss, load and power factor.',
    head: [['eff', ''], ['loss', 'kW'], ['xo', '']], vary: ['x', '', [0.25, 0.5, 0.75, 1, 1.1]],
    intro: 'Use this to see how efficient a transformer is at a given load and where it peaks. The no-load (iron) loss is present whenever the transformer is energised, while the copper loss grows with the square of the load, so efficiency is highest at a part load rather than at full load.',
    caveat: 'Iron loss is taken as constant and copper loss as proportional to load squared. Stray, harmonic and cooling-equipment losses are ignored, and losses are taken at the temperature the data sheet quotes them for. Use the guaranteed loss figures from the transformer data sheet.',
    faq: [
      ['Why is efficiency not highest at full load?', 'Iron loss stays the same at every load and copper loss rises with the square of the load. Efficiency peaks where the two are equal, which for most distribution transformers is well below full load.'],
      ['Where do I find the iron and copper loss figures?', 'On the transformer data sheet or test certificate, usually as no-load loss and load loss at rated current. Use the guaranteed values, not typical ones, when you are comparing offers.'],
      ['Does power factor change the efficiency?', 'Yes. The output power is the apparent power times the power factor while the losses stay the same, so a lower power factor gives a lower efficiency for the same kVA load.']
    ],
    pages: ['transformer-sizing', 'transformer-fault-current'], app: ['transformer-loading', 'transformer-regulation']
  },
  {
    slug: 'cable-sc-withstand', calc: 'cable-sc-withstand', name: 'Cable Short-Circuit Withstand', group: 'Cables',
    desc: 'Find the minimum cable cross-section that withstands a short-circuit from fault current, clearing time and conductor and insulation material.',
    head: [['Amin', 'mm²'], ['Astd', 'mm²'], ['k', '']], vary: ['Isc', 'kA', [6, 10, 16, 25, 40]],
    intro: 'Use this to check that a cable will not be damaged by heat while a fault is cleared. It applies the adiabatic equation, which assumes all the fault heat stays in the conductor, and returns the smallest cross-section and the next standard size above it.',
    caveat: 'The method is valid for clearing times up to five seconds and uses the material constant for the conductor and insulation you choose. Use the clearing time of the protective device at the prospective fault current, not its trip setting. Confirm the constant against the standard edition you work to.',
    faq: [
      ['Why does the clearing time matter so much?', 'The required area grows with the square root of the time the fault lasts. A slower protective device needs a larger cable, and a current-limiting device can allow a smaller one.'],
      ['Which fault current should I use?', 'The prospective rms fault current at the cable, usually the highest value, at the point where the cable starts. Use the clearing time of the device at that current.'],
      ['Does this replace checking current-carrying capacity?', 'No. It checks only thermal withstand during a fault. Current rating and voltage drop are separate checks, covered by the cable size and cable derating calculators.']
    ],
    pages: ['cable-size', 'cable-derating'], app: ['cable-power-loss', 'fault-mva']
  },
  {
    slug: 'earth-grid-resistance', calc: 'earth-grid-resistance', name: 'Earth Grid Resistance', group: 'Earthing',
    desc: 'Estimate the resistance to earth of a buried earthing grid from soil resistivity, grid area and total buried conductor length.',
    head: [['Rg', 'Ω']], vary: ['rho', 'Ω·m', [25, 50, 100, 200, 500]],
    intro: 'Use this for an early estimate of the resistance to earth of a substation or plant earthing grid. It models the grid as an equivalent disc with the same area and adds a term for the length of buried conductor.',
    caveat: 'The model assumes uniform soil and a grid buried at shallow depth. Real soil is layered, so measure resistivity on site and use the design value from the earthing study. Step and touch voltages need a separate study.',
    faq: [
      ['What soil resistivity should I enter?', 'Use a measured value, for example from a Wenner four-pin survey, taken in the worst season for the site. Soil tables give only a rough range and vary widely with moisture and temperature.'],
      ['Why does adding conductor lower the resistance only slightly?', 'Most of the resistance depends on the grid area. Extra buried conductor helps through the second term, but with diminishing returns, so a larger grid area is usually more effective.'],
      ['Is a low grid resistance enough to be safe?', 'No. Safety depends on the step and touch voltages for the fault current and clearing time, which need their own calculation.']
    ],
    pages: ['earth-resistance', 'transformer-fault-current'], app: ['earth-rods-parallel', 'cable-resistance']
  },
  {
    slug: 'agl-isolating-transformer', calc: 'agl-isolating-transformer', name: 'AGL Isolating Transformer', group: 'Airport and AGL',
    desc: 'Work out secondary lamp current, lamp voltage, input power and transformer loading for an airfield lighting series isolating transformer.',
    head: [['Is', 'A'], ['Vs', 'V'], ['Pin', 'W'], ['pct', '']], vary: ['Pl', 'W', [30, 45, 65, 100, 200]],
    intro: 'Use this to see what an isolating transformer on an airfield ground lighting series circuit does to a lamp: the secondary current follows the circuit current in the ratio of the rated currents, and the transformer takes its own losses from the series circuit.',
    caveat: 'The lamp is not a fixed resistance, so look up its power at the secondary current shown. An open secondary, such as a failed lamp, is not modelled and needs the manufacturer data on open-circuit voltage and core saturation.',
    faq: [
      ['Why is the secondary current set by the primary current?', 'The circuit is a constant current series circuit, so the regulator holds the primary current and the transformer ratio sets the secondary current at each brightness step.'],
      ['What is the transformer loading figure?', 'It is the lamp power as a share of the transformer rating. Check the highest brightness step, where the lamp power is largest.'],
      ['What happens when a lamp fails?', 'The secondary opens and the voltage across it rises. This calculator does not model that, so use the manufacturer open-circuit data.']
    ],
    pages: ['agl-ccr-loading'], app: ['agl-max-fittings', 'agl-brightness-steps']
  },
  {
    slug: 'agl-max-fittings', calc: 'agl-max-fittings', name: 'AGL Maximum Fittings per Circuit', group: 'Airport and AGL',
    desc: 'Find the largest number of fittings a CCR can supply on an airfield lighting series circuit from CCR rating, lamp power and cable loop.',
    head: [['nmax', ''], ['Pt', 'kW'], ['pct', ''], ['Vo', 'V']], vary: ['Pr', 'kW', [4, 7.5, 10, 15, 20, 30]],
    intro: 'Use this when the regulator is fixed and you need to know how many fittings it can carry. It is the reverse of the CCR loading calculator: it subtracts the cable loss from the usable CCR output and divides by the load of one fitting, including its isolating transformer loss.',
    caveat: 'Every fitting is assumed to have the same lamp power and transformer efficiency. Confirm the result against the CCR manufacturer output curves, keep spare capacity for future fittings and check the highest brightness step.',
    faq: [
      ['What is the maximum CCR loading setting?', 'It is the share of the CCR rating you allow to be used, which leaves headroom. Set it to the margin your specification requires.'],
      ['Why is the number rounded down?', 'A fraction of a fitting cannot be connected, so the result is the whole number of fittings that fits within the usable output.'],
      ['How is this different from the CCR loading calculator?', 'That page starts from the number of fittings and gives the load and the CCR size. This one starts from the CCR and gives the number of fittings.']
    ],
    pages: ['agl-ccr-loading'], app: ['agl-isolating-transformer', 'cable-resistance']
  },
  {
    slug: 'agl-ccr-input-energy', calc: 'agl-ccr-input-energy', name: 'AGL CCR Input Power and Energy', group: 'Airport and AGL',
    desc: 'Estimate CCR input power, apparent and reactive power, annual energy and running cost from output load, efficiency and power factor.',
    head: [['Pin', 'kW'], ['S', 'kVA'], ['E', 'kWh'], ['cost', '']], vary: ['Po', 'kW', [4, 7.5, 10, 15, 20, 30]],
    intro: 'Use this to turn a constant current regulator output load into the power it takes from the supply, and into energy and running cost over a year at the hours and tariff you enter.',
    caveat: 'Efficiency and input power factor are held constant at the load entered. Both fall at light load and low brightness steps, so use the data sheet figures for the step you are costing, cost each step separately and add them. This covers the regulator input only.',
    faq: [
      ['Why cost each brightness step separately?', 'Output load, efficiency and power factor differ at each step, and the hours at each step differ. Run the calculation once per step and add the results.'],
      ['What efficiency should I enter?', 'Use the regulator data sheet figure at the load and brightness step you are costing, not the full-load figure.'],
      ['Does the result include the lamps and cables?', 'The output load you enter is what the regulator supplies, so it already includes them. The result adds only the regulator losses.']
    ],
    pages: ['agl-ccr-loading'], app: ['agl-brightness-steps', 'energy-cost']
  }
];
