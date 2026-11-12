# Elecmetric v1.13.2: review of all 124 calculators

**Who did this:** Claude (an AI), not an independent qualified reviewer. This is a read-through and spot-check. It is **not** a sign-off and nothing has been added to `tools/review_records.json`.

## What was done
- Read the formula, inputs, outputs, assumptions and notes of all 124 entries in `docs/REVIEW_PACK.md` against textbook formulas and published constants.
- Checked the numeric claims in the notes (for example 27% more resistance at 90 °C, 2.6 °C per ohm for Pt100, SWG 18 and AWG 18 diameters, aluminium 1.64 times the area and about half the mass, 3.6 MJ per kWh, 859.845 kcal per kWh).
- Ran about 35 edge cases (zero or blank values, impossible inputs, out-of-range values) on the doubtful calculators. All were rejected or warned in a sensible way. Examples: power factor 0 or above 1, Cp above 0.5926, 90° incidence, resistance below R0 on the Pt100, R above Z on the transformer, a target power factor below the present one, a heatsink that cannot meet the limit.
- The existing 1,978 independent vectors (all passing) were not re-derived.

## Result
No formula error found in any of the 124. Six small text issues and a few conventions to confirm are listed below.

## Not covered
- Whether each standard-size list matches your own market or standard.
- Real-device behaviour, and any licensed standard table (none are embedded).
- Calculators were not compared against manufacturer data, field measurements or a published worked example from a standard.

| id | calculator | status | finding |
|---|---|---|---|
| ohms-law | Ohm's Law | No issue found |  |
| three-phase-current | Current from Power (kW to Amps) | No issue found |  |
| kva-to-amps | kVA to Amps | No issue found |  |
| kw-to-kva | kW to kVA and kVAR | No issue found |  |
| pf-correction-kvar | Power Factor Correction | No issue found |  |
| voltage-drop | Voltage Drop | Fixed in v1.13.3 (wording) | Note calls the calculator a "General-basis prototype". Drop "prototype" on a published page. |
| breaker-size | Breaker Rating Selection | Confirm (convention) | Standard rating list is a convention (no 2 or 4 A); confirm against the device range you use. |
| fault-current | Transformer Fault Current | No issue found |  |
| motor-current | Motor Full-Load Current | No issue found |  |
| transformer-current | Transformer Full-Load Current | No issue found |  |
| energy-cost | Appliance Running Cost (Energy and Cost) | No issue found |  |
| electricity-bill-slabs | Electricity Bill from Tariff Slabs (fixed charge, tax) | No issue found |  |
| power-vir | Power from Voltage and Current | No issue found |  |
| ac-ohms-law | AC Ohm's Law (Phasors) | No issue found |  |
| vipr-solver | Watts, Volts, Amps, Ohms (any two) | No issue found |  |
| power-vi-solver | Power, Voltage, Current with Power Factor (solve any) | No issue found |  |
| kwh-to-kw | kWh to kW and Watts | No issue found |  |
| power-energy-time | Watts, Joules, kWh and Time (any two) | No issue found |  |
| energy-voltage-charge | Joules, Volts, Charge and eV (any two) | No issue found |  |
| battery-mah-wh | mAh to Wh and Wh to mAh | No issue found |  |
| resistance-series | Resistors in Series | Fixed in v1.13.3 (usability) | Note says "or use the full set", which is unclear. A zero third value is rejected, so "enter a very small value" is the only route; say so plainly. |
| resistance-parallel | Resistors in Parallel | Fixed in v1.13.3 (usability) | The series note explains how to enter two resistors but the parallel note has none. A zero third value is rejected; a very large value works (100 Ω ∥ 220 Ω with 1e12 Ω gives 68.75 Ω, correct). Add the same guidance, saying "very large" for parallel. Same pattern on the inductor and capacitor combiners. |
| capacitance-series-parallel | Capacitors in Series and Parallel | No issue found |  |
| inductance-series-parallel | Inductors in Series and Parallel | No issue found |  |
| reactance | Inductive and Capacitive Reactance | No issue found |  |
| impedance-rlc | Series RLC Impedance | No issue found |  |
| frequency-period | Frequency and Period | No issue found |  |
| rms-peak | RMS, Peak and Peak-to-Peak | No issue found |  |
| watts-to-amps | Watts to Amps | No issue found |  |
| amps-to-watts | Amps to Watts | No issue found |  |
| amps-to-kw | Amps to kW | No issue found |  |
| amps-to-kva | Amps to kVA | No issue found |  |
| kva-to-kw | kVA to kW | No issue found |  |
| three-phase-power | Three-Phase Power | No issue found |  |
| power-factor | Power Factor | No issue found |  |
| cable-resistance | Cable Resistance | No issue found |  |
| wire-gauge-conversion | AWG to Diameter and Area | No issue found |  |
| max-cable-length | Maximum Cable Length | No issue found |  |
| cable-derating | Cable Derating and Ampacity | No issue found |  |
| cable-size-vd | Cable Size for Voltage Drop | No issue found |  |
| cable-sc-withstand | Cable Short-Circuit Withstand | No issue found |  |
| motor-torque | Motor Shaft Torque | No issue found |  |
| motor-slip | Induction Motor Slip | No issue found |  |
| motor-starting | Motor Starting Current | No issue found |  |
| transformer-regulation | Transformer Voltage Regulation | No issue found |  |
| transformer-efficiency | Transformer Efficiency and Losses | No issue found |  |
| generator-kva | Generator kVA Selection | Confirm (convention) | Standard-size list is a convention. Check it against your supplier range (for example whether 25, 82.5 or 180 kVA belong). |
| ups-runtime | UPS Battery Runtime | OK (limit stated) | No Peukert effect; the note says to check the discharge table. |
| per-unit-base | Per-Unit Base Values | No issue found |  |
| pv-string-size | Solar PV String Length | No issue found |  |
| pv-energy | Solar PV Energy Yield | No issue found |  |
| ev-charge-time | EV Charging Time | No issue found |  |
| lumen-method | Lighting Level (Lumen Method) | No issue found |  |
| earth-rod-resistance | Earth Rod Resistance | No issue found |  |
| harmonic-thd | Current THD | OK (limit stated) | Counts only the 3rd, 5th and 7th. The page says so; a real THD needs the full spectrum. |
| pf-capacitor-uf | Capacitor Bank Size (µF) | No issue found |  |
| fault-mva | Fault Level (kA to MVA) | No issue found |  |
| voltage-divider | Voltage Divider | No issue found |  |
| led-resistor | LED Series Resistor | No issue found |  |
| rc-time-constant | RC Time Constant and Cutoff | No issue found |  |
| current-loop-4-20 | 4-20 mA Signal Scaling | No issue found |  |
| battery-bank-size | Battery Bank Sizing | No issue found |  |
| cable-power-loss | Cable Power Loss (I²R) | No issue found |  |
| dc-voltage-drop | Voltage Drop from Conductor Size | Fixed in v1.13.3 (documentation) | Note says copper 1.68e-8 and aluminium 2.65e-8 Ω·m would give a drop "about 2.6% and 6.7% lower". Copper is right (2.56%). Aluminium is 6.2% lower; 6.7% is how much higher the calculator value is than 2.65e-8 (the inverse ratio). Change to "about 2.6% and 6.2% lower". |
| conductor-temp-resistance | Conductor Resistance vs Temperature | No issue found |  |
| copper-vs-aluminium | Copper vs Aluminium Conductor | No issue found |  |
| motor-power-output | Motor Output Power and Efficiency Loss | No issue found |  |
| motor-start-dip | Motor Starting Voltage Dip | No issue found |  |
| pump-motor-power | Pump Shaft and Motor Power | No issue found |  |
| transformer-sizing | Transformer kVA Selection | Confirm (convention) | Standard-size list is a convention; confirm against your utility or manufacturer range. |
| transformer-loading | Transformer Loading from Measurements | No issue found |  |
| fault-types | Fault Current by Fault Type | No issue found |  |
| per-unit-convert | Per-Unit Base Conversion | No issue found |  |
| battery-series-parallel | Battery Series-Parallel Bank | No issue found |  |
| pv-array-size | Solar PV Array Size from Energy Need | No issue found |  |
| led-retrofit-payback | LED Retrofit Savings and Payback | No issue found |  |
| resonance-lc | LC Resonance and Q Factor | No issue found |  |
| lc-energy | Energy in a Capacitor and an Inductor | No issue found |  |
| delta-wye | Delta to Star Resistance Conversion | No issue found |  |
| line-phase | Line and Phase Quantities (Star / Delta) | No issue found |  |
| generator-fuel | Generator Fuel Consumption and Autonomy | Fixed in v1.13.3 (wording, non-conservative) | Note reads "Plan for at least 90% of the tank as usable". It should say to assume no more than about 90% is usable; "at least" reads the wrong way for a runtime estimate. |
| maximum-demand | Maximum Demand | No issue found |  |
| ngr-sizing | Neutral Earthing Resistor | No issue found |  |
| earth-rods-parallel | Earth Rods in Parallel | No issue found |  |
| earth-grid-resistance | Earth Grid Resistance | No issue found |  |
| parallel-cable-sets | Parallel Cable Sets | No issue found |  |
| conduit-fill | Conduit Fill | No issue found |  |
| hp-kw-converter | HP to kW and kW to HP | No issue found |  |
| power-converter | Power Unit Converter (W, kW, MW, HP, PS) | No issue found |  |
| energy-converter | Energy Unit Converter | No issue found |  |
| decibel | Decibel Converter | No issue found |  |
| op-amp-gain | Op-Amp Gain | No issue found |  |
| water-heater-kw | Heater Power for Heating a Liquid | No issue found |  |
| ir-temp-correction | Insulation Resistance Temperature Correction | No issue found |  |
| insulation-pi-dar | Polarisation Index and Dielectric Absorption Ratio | No issue found |  |
| agl-ccr-loading | AGL Series Circuit Load and CCR Size | OK; confirm sizes | Standard CCR sizes 4, 7.5, 10, 15, 20, 25, 30 kW match the usual FAA L-828 series. Confirm against the manufacturer range for your project. |
| agl-max-fittings | AGL Maximum Fittings on a CCR | No issue found |  |
| agl-isolating-transformer | AGL Isolating Transformer Current and Loading | No issue found |  |
| agl-ccr-input-energy | AGL CCR Input Power and Annual Energy | No issue found |  |
| agl-brightness-steps | AGL Brightness Step Current and Circuit Load | No issue found |  |
| agl-lamp-life-curve | AGL Lamp Life at a Different Circuit Current | No issue found |  |
| fault-loop-impedance | Earth Fault Loop Impedance | No issue found |  |
| pue | Data Centre PUE | No issue found |  |
| rack-cooling | Rack Heat Load and Airflow | No issue found |  |
| wind-power | Wind Turbine Power | No issue found |  |
| zener-regulator | Zener Shunt Regulator | No issue found |  |
| bjt-base-resistor | Transistor Base Resistor | No issue found |  |
| timer-555 | 555 Timer Astable | No issue found |  |
| heatsink-thermal | Heatsink Thermal Resistance | No issue found |  |
| rc-filter-cutoff | RC Filter Cutoff | Fixed in v1.13.3 (label) | Output "Gain at that frequency" reads as the gain at the cutoff. It is the gain at the frequency of interest you enter. Relabel. |
| star-delta-starting | Star-Delta Starting | No issue found |  |
| battery-charge-time | Battery Charge Time | No issue found |  |
| fan-pump-affinity | Fan and Pump Affinity Laws | No issue found |  |
| rtd-pt100 | RTD Resistance to Temperature | No issue found |  |
| neutral-current-unbalance | Neutral Current from Unbalanced Load | No issue found |  |
| voltage-unbalance | Three-Phase Voltage Unbalance | No issue found |  |
| ac-voltage-drop | AC Voltage Drop from Conductor Size | No issue found |  |
| swg-wire | SWG to Diameter and Area | No issue found |  |
| lumens-lux-area | Lumens, Lux and Area (any two) | No issue found |  |
| candela-lux-distance | Candela, Lux and Distance (any two) | No issue found |  |
| candela-lumens-beam | Candela and Lumens from Beam Angle | No issue found |  |
| lumens-watts | Lumens and Watts (luminous efficacy) | No issue found |  |
| lux-to-watts | Lighting Power for a Target Lux | No issue found |  |
| agl-light-intensity-distance | AGL Light Intensity at Distance (Allard's Law) | No issue found |  |
