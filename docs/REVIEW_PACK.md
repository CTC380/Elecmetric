# Elecmetric independent review pack (v1.73.10)

Purpose: give a reviewer everything needed to check each calculator without reading `engine.js`. 157 calculators in 34 divisions.

## How to review one calculator
1. Use the licensed standard edition adopted by the project. Check the exact clauses, tables, annexes and calculation assumptions.
2. Check each assumption and note is true and stated honestly.
3. Work one example by hand and compare it with the calculator.
4. The team-level designation in `tools/team_review_approval.json` is administrative only. Only after a qualified individual has actually approved a calculator should an entry be added to `tools/review_records.json` (format in its `_example`). Never record a review that has not been done.

Team-level reviewer designation: Rahul Sharma (self-designation, not independent) (recorded 12 November 2026).

Individual reviewer name and qualification: ____________________   Date: ____________

## Wave 1: review these first (24 calculators)

For each calculator the reviewer fills in: standard and edition used, exact clauses/tables checked, date, name and professional qualification. A public catalogue scope-screen is not a clause review. Set review_status to clause_reviewed only after checking the licensed text. A standard review and a reviewer approval are separate records and either can exist alone.

### Cable sizing and voltage drop

- `cable-size-vd` (Cable Size for Voltage Drop): standard ____________  edition ______  review date ______  reviewer ____________  qualification ____________
- `cable-derating` (Cable Derating and Ampacity): standard ____________  edition ______  review date ______  reviewer ____________  qualification ____________
- `voltage-drop` (Voltage Drop): standard ____________  edition ______  review date ______  reviewer ____________  qualification ____________
- `ac-voltage-drop` (AC Voltage Drop from Conductor Size): standard ____________  edition ______  review date ______  reviewer ____________  qualification ____________
- `max-cable-length` (Maximum Cable Length): standard ____________  edition ______  review date ______  reviewer ____________  qualification ____________
- `cable-sc-withstand` (Cable Short-Circuit Withstand): standard ____________  edition ______  review date ______  reviewer ____________  qualification ____________
- `parallel-cable-sets` (Parallel Cable Sets): standard ____________  edition ______  review date ______  reviewer ____________  qualification ____________

### Fault current

- `fault-current` (Transformer Fault Current): standard ____________  edition ______  review date ______  reviewer ____________  qualification ____________
- `fault-mva` (Fault Level (kA to MVA)): standard ____________  edition ______  review date ______  reviewer ____________  qualification ____________
- `fault-types` (Fault Current by Fault Type): standard ____________  edition ______  review date ______  reviewer ____________  qualification ____________

### Protection

- `breaker-size` (Breaker Rating Selection): standard ____________  edition ______  review date ______  reviewer ____________  qualification ____________
- `fault-loop-impedance` (Earth Fault Loop Impedance): standard ____________  edition ______  review date ______  reviewer ____________  qualification ____________

### Earthing

- `earth-rod-resistance` (Earth Rod Resistance): standard ____________  edition ______  review date ______  reviewer ____________  qualification ____________
- `earth-rods-parallel` (Earth Rods in Parallel): standard ____________  edition ______  review date ______  reviewer ____________  qualification ____________
- `earth-grid-resistance` (Earth Grid Resistance): standard ____________  edition ______  review date ______  reviewer ____________  qualification ____________
- `ngr-sizing` (Neutral Earthing Resistor): standard ____________  edition ______  review date ______  reviewer ____________  qualification ____________

### Transformer sizing

- `transformer-sizing` (Transformer kVA Selection): standard ____________  edition ______  review date ______  reviewer ____________  qualification ____________
- `transformer-loading` (Transformer Loading from Measurements): standard ____________  edition ______  review date ______  reviewer ____________  qualification ____________
- `transformer-current` (Transformer Full-Load Current): standard ____________  edition ______  review date ______  reviewer ____________  qualification ____________
- `transformer-regulation` (Transformer Voltage Regulation): standard ____________  edition ______  review date ______  reviewer ____________  qualification ____________

### Motor starting

- `motor-current` (Motor Full-Load Current): standard ____________  edition ______  review date ______  reviewer ____________  qualification ____________
- `motor-starting` (Motor Starting Current): standard ____________  edition ______  review date ______  reviewer ____________  qualification ____________
- `motor-start-dip` (Motor Starting Voltage Dip): standard ____________  edition ______  review date ______  reviewer ____________  qualification ____________
- `star-delta-starting` (Star-Delta Starting): standard ____________  edition ______  review date ______  reviewer ____________  qualification ____________

Record format for each completed review (add under `records` in `tools/review_records.json`; `node tests/run_tests.js` rejects incomplete or placeholder records):

```json
"cable-size-vd": {
  "standard": { "name": "<standard>", "edition": "<project-adopted edition>", "date": "YYYY-MM-DD", "review_status": "clause_reviewed", "review_basis": "Licensed text checked: exact clauses, tables and annexes recorded in the reference field" },
  "approved": { "reviewer": "<full name>", "qualification": "<e.g. CEng>", "date": "YYYY-MM-DD", "next_review": "YYYY-MM-DD" },
  "reference": { "formula_source": "<textbook or standard>", "exact": "<chapter, equation, clause or table>", "author": "<name of the calculation author, if not set in site_info.json>" }
}
```

A calculator is classified **Verified** only when its record has the reviewer (name, qualification, date), an explicitly `clause_reviewed` standard and edition (unless Not applicable is justified), the formula source and exact reference, a next review date that has not passed, a named calculation author, and independent test cases. `scope_screened` is Partial only. See `docs/VERIFICATION_REGISTER.md`.

## Division 02 Ohm's Law

### Ohm's Law (`ohms-law`)

- Formula: `I = V / R P = V × I`
- Inputs: Voltage [V]; Resistance [Ω]
- Outputs: Current [A]; Power [W]
- Assumptions: Steady DC or purely resistive AC load; AC voltage is RMS
- Notes: This calculator starts from voltage and resistance. To start from current or power, or from any other two of voltage, current, resistance and power, use the Watts, Volts, Amps and Ohms solver. For reactive loads use the AC Ohm's law (phasors) calculator; this one ignores phase angle.
- Independent vectors in the test suite: 22
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Power from Voltage and Current (`power-vir`)

- Formula: `P = V × I R = V / I`
- Inputs: Voltage [V]; Current [A]
- Outputs: Power [W]; Resistance [Ω]
- Assumptions: Steady DC or purely resistive AC load; AC values are RMS
- Notes: For reactive loads include power factor (watts to amps).
- Independent vectors in the test suite: 10
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### AC Ohm's Law (Phasors) (`ac-ohms-law`)

- Formula: `V = I × Z (magnitudes multiply, angles add) S = V × I* (angle = ∠V − ∠I) P = |S| cos θ Q = |S| sin θ`
- Inputs: Voltage |V| [V]; Voltage angle (degrees); Current |I| [A]; Current angle (degrees); Impedance |Z| [Ω]; Impedance angle (degrees)
- Outputs: Voltage |V| [V]; Voltage angle (degrees); Current |I| [A]; Current angle (degrees); Impedance |Z| [Ω]; Impedance angle (degrees); Apparent power |S| [VA]; Real power P [W]; Reactive power Q (+ inductive) [VAR]; Power factor
- Assumptions: Steady-state sinusoidal AC at one frequency; Voltage and current are RMS values; Angles in degrees; a positive impedance angle is inductive and the current lags the voltage
- Notes: Exactly two of voltage, current and impedance are needed. A blank angle on a value you enter counts as 0°, so a resistor is an impedance with a blank or zero angle. For a purely resistive circuit the DC Ohm's law calculators give the same magnitudes.
- Independent vectors in the test suite: 36
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Watts, Volts, Amps, Ohms (any two) (`vipr-solver`)

- Formula: `V = I × R P = V × I P = I² × R P = V² / R`
- Inputs: Voltage [V]; Current [A]; Resistance [Ω]; Power [W]
- Outputs: Voltage [V]; Current [A]; Resistance [Ω]; Power [W]
- Assumptions: Steady DC or purely resistive AC load; AC values are RMS; Power factor is 1; for a reactive load use the power, voltage and current calculator
- Notes: Exactly two values are needed. If three or four are entered the result could contradict itself, so the calculator asks for two only.
- Independent vectors in the test suite: 52
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Joules, Volts, Charge and eV (any two) (`energy-voltage-charge`)

- Formula: `E = Q × V (1 eV = 1.602176634×10⁻¹⁹ J, the energy of one elementary charge e through 1 V)`
- Inputs: Energy [J]; Voltage [V]; Charge [C]
- Outputs: Energy [J]; Energy in electronvolts [eV]; Voltage [V]; Charge [C]
- Assumptions: Magnitudes only: signs and direction are ignored; Charge moves through the whole potential difference; Elementary charge e = 1.602176634×10⁻¹⁹ C (exact SI value)
- Notes: For eV to volts, enter the energy in eV and the charge in e (for one electron, 1 e). The volts figure then equals the energy in eV divided by the number of charges. This is the electrostatic relation, not a circuit power calculation.
- Independent vectors in the test suite: 40
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 03 AC Circuits

### Inductors in Series and Parallel (`inductance-series-parallel`)

- Formula: `Series: L = L1 + L2 + L3 Parallel: 1/L = 1/L1 + 1/L2 + 1/L3`
- Inputs: Inductor 1 [mH]; Inductor 2 [mH]; Inductor 3 [mH]
- Outputs: In series [mH]; In parallel [mH]
- Assumptions: No mutual coupling between inductors
- Notes: Coupled coils need the mutual inductance term, which is not modelled. For two inductors, enter a very small third value for the series result or a very large one for the parallel result (zero is not accepted).
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Inductive and Capacitive Reactance (`reactance`)

- Formula: `XL = 2π f L XC = 1 / (2π f C)`
- Inputs: Frequency [Hz]; Inductance [mH]; Capacitance [µF]
- Outputs: Inductive reactance XL [Ω]; Capacitive reactance XC [Ω]
- Assumptions: Sinusoidal, single frequency; Ideal components
- Notes: Where XL equals XC the series circuit is at resonance.
- Independent vectors in the test suite: 10
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Series RLC Impedance (`impedance-rlc`)

- Formula: `X = XL − XC |Z| = √(R² + X²) φ = atan(X / R)`
- Inputs: Resistance [Ω]; Inductance [mH]; Capacitance [µF]; Frequency [Hz]
- Outputs: Impedance |Z| [Ω]; Phase angle (degrees, + inductive); Power factor
- Assumptions: Series connection; Sinusoidal, single frequency
- Notes: A negative angle means the circuit is capacitive.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Frequency and Period (`frequency-period`)

- Formula: `T = 1 / f ω = 2π f`
- Inputs: Frequency [Hz]
- Outputs: Period [ms]; Angular frequency (rad/s)
- Assumptions: Periodic sinusoidal signal
- Notes: At 50 Hz one cycle takes 20 ms; at 60 Hz, 16.67 ms.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### RMS, Peak and Peak-to-Peak (`rms-peak`)

- Formula: `Vrms = Vpeak / √2 Vpp = 2 × Vpeak`
- Inputs: Peak voltage [V]
- Outputs: RMS voltage [V]; Peak-to-peak [V]
- Assumptions: Pure sine wave, no DC offset
- Notes: Other waveforms have different crest factors.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### LC Resonance and Q Factor (`resonance-lc`)

- Formula: `f0 = 1 / (2π √(LC)) X0 = √(L / C) Q = X0 / R BW = f0 / Q`
- Inputs: Inductance [mH]; Capacitance [µF]; Series resistance [Ω]
- Outputs: Resonant frequency [Hz]; Reactance at resonance [Ω]; Quality factor Q; Bandwidth [Hz]
- Assumptions: Ideal series circuit; Component losses are lumped in R
- Notes: Resonance with capacitor banks and system inductance is a real harmonic-amplification risk on industrial networks.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Energy in a Capacitor and an Inductor (`lc-energy`)

- Formula: `Ec = ½ C V² El = ½ L I²`
- Inputs: Capacitance [µF]; Capacitor voltage [V]; Inductance [mH]; Inductor current [A]
- Outputs: Capacitor energy [J]; Inductor energy [J]
- Assumptions: Ideal components
- Notes: Stored energy sets the discharge hazard for capacitor banks, and the arcing energy when an inductive circuit is opened.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 04 DC Circuits

### Resistors in Series (`resistance-series`)

- Formula: `Rt = R1 + R2 + R3`
- Inputs: Resistor 1 [Ω]; Resistor 2 [Ω]; Resistor 3 [Ω]
- Outputs: Total resistance [Ω]
- Assumptions: Resistors are not coupled; Values are at the same temperature
- Notes: For two resistors, enter a very small third value (zero is not accepted).
- Independent vectors in the test suite: 10
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Resistors in Parallel (`resistance-parallel`)

- Formula: `1/Rt = 1/R1 + 1/R2 + 1/R3`
- Inputs: Resistor 1 [Ω]; Resistor 2 [Ω]; Resistor 3 [Ω]
- Outputs: Equivalent resistance [Ω]
- Assumptions: Resistors are not coupled
- Notes: The result is always below the smallest branch. For two resistors, enter a very large third value (zero is not accepted).
- Independent vectors in the test suite: 10
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Delta to Star Resistance Conversion (`delta-wye`)

- Formula: `Ra = Rab Rca / Σ Rb = Rab Rbc / Σ Rc = Rbc Rca / Σ Σ = Rab + Rbc + Rca`
- Inputs: Rab [Ω]; Rbc [Ω]; Rca [Ω]
- Outputs: Ra (at node A) [Ω]; Rb (at node B) [Ω]; Rc (at node C) [Ω]
- Assumptions: Node A joins Rab and Rca, node B joins Rab and Rbc, node C joins Rbc and Rca
- Notes: For a balanced delta, each star resistor is one third of the delta resistor.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 05 Single Phase

### Watts to Amps (`watts-to-amps`)

- Formula: `I = P / (k × V × pf) k = 1 (single-phase, DC), √3 (three-phase L-L) or 3 (three-phase L-N)`
- Inputs: Power [W]; Voltage [V]; Power factor; Current type; Voltage type (three-phase only)
- Outputs: Current [A]
- Assumptions: Single-phase AC by default; choose DC or three-phase above; V is RMS; DC takes the power factor as 1
- Notes: Choose DC to ignore the power factor. For a larger three-phase load the kW to amps calculator also takes efficiency.
- Independent vectors in the test suite: 26
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Amps to Watts (`amps-to-watts`)

- Formula: `P = k × V × I × pf k = 1 (single-phase, DC), √3 (three-phase L-L) or 3 (three-phase L-N)`
- Inputs: Current [A]; Voltage [V]; Power factor; Current type; Voltage type (three-phase only)
- Outputs: Real power [W]
- Assumptions: Single-phase AC by default; choose DC or three-phase above; V is RMS; DC takes the power factor as 1
- Notes: Choose DC to ignore the power factor.
- Independent vectors in the test suite: 30
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 06 Three Phase

### Current from Power (kW to Amps) (`three-phase-current`)

- Formula: `I = P / (η × √3 × V × pf) (three-phase L-N: 3 × V; single-phase: V; DC: pf = 1)`
- Inputs: Power [kW]; Voltage [V]; Power factor; Current type; Voltage type (three-phase only); Efficiency
- Outputs: Full-load current [A]
- Assumptions: Balanced load; V is line-to-line RMS for three-phase unless line-to-neutral is chosen; Sinusoidal waveforms; DC takes the power factor as 1
- Notes: Gives full-load current only. Starting current, harmonics and cable derating are separate calculations.
- Independent vectors in the test suite: 26
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### kVA to Amps (`kva-to-amps`)

- Formula: `I = S / (√3 × V) (three-phase L-N: S / (3 × V); single-phase and DC: S / V)`
- Inputs: Apparent power [kVA]; Voltage [V]; Current type; Voltage type (three-phase only)
- Outputs: Line current [A]
- Assumptions: Balanced load; V is line-to-line RMS for three-phase unless line-to-neutral is chosen; For DC, kVA is the same as kW
- Notes: Power factor does not appear because kVA already includes it.
- Independent vectors in the test suite: 26
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Power, Voltage, Current with Power Factor (solve any) (`power-vi-solver`)

- Formula: `P = k × V × I × PF k = √3 (three-phase L-L), 3 (three-phase L-N) or 1 (single-phase, DC; PF = 1 for DC)`
- Inputs: Real power [kW]; Voltage [V]; Line current [A]; Power factor; Current type; Voltage type (three-phase only)
- Outputs: Real power [kW]; Line voltage [V]; Line current [A]
- Assumptions: Balanced load; Voltage is line-to-line for three-phase unless line-to-neutral is chosen; Current is the line current; AC values are RMS
- Notes: For DC the power factor is taken as 1. If you know resistance, use the watts, volts, amps, ohms solver. Engineering mode adds the line-to-line or line-to-neutral choice for three-phase.
- Independent vectors in the test suite: 48
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Amps to kW (`amps-to-kw`)

- Formula: `P = √3 × V × I × pf (three-phase L-N: 3 × V × I × pf; single-phase: V × I × pf; DC: V × I) Output = η × P`
- Inputs: Line current [A]; Voltage [V]; Power factor; Current type; Voltage type (three-phase only); Efficiency
- Outputs: Real power [kW]; Output power (P × η) [kW]
- Assumptions: Balanced load; V is line-to-line RMS for three-phase unless line-to-neutral is chosen; DC takes the power factor as 1; Efficiency 1 means output power equals input power
- Notes: Real power is electrical input power. Output (shaft) power is P × η and equals P when efficiency is 1.
- Independent vectors in the test suite: 31
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Amps to kVA (`amps-to-kva`)

- Formula: `S = √3 × V × I (three-phase L-N: 3 × V × I; single-phase and DC: V × I)`
- Inputs: Line current [A]; Voltage [V]; Current type; Voltage type (three-phase only)
- Outputs: Apparent power [kVA]
- Assumptions: Balanced load; V is line-to-line RMS for three-phase unless line-to-neutral is chosen; For DC, kVA is the same as kW
- Notes: Power factor does not enter apparent power.
- Independent vectors in the test suite: 26
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Three-Phase Power (`three-phase-power`)

- Formula: `S = √3 × V × I P = S × pf Q = S × sin φ`
- Inputs: Line voltage (L-L) [V]; Line current [A]; Power factor
- Outputs: Real power [kW]; Apparent power [kVA]; Reactive power [kVAR]
- Assumptions: Balanced three-phase load; V is line-to-line RMS
- Notes: Q is a magnitude; lagging or leading is not distinguished.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Line and Phase Quantities (Star / Delta) (`line-phase`)

- Formula: `Star: Vph = VL / √3, Iph = IL Delta: Vph = VL, Iph = IL / √3 Zph = Vph / Iph S = √3 VL IL`
- Inputs: Line voltage (L-L) [V]; Line current [A]; Connection
- Outputs: Phase voltage [V]; Phase current [A]; Impedance per phase [Ω]; Total apparent power [kVA]
- Assumptions: Balanced three-phase load
- Notes: A delta winding needs 1.73 times the voltage rating of a star winding on the same line supply.
- Independent vectors in the test suite: 8
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Neutral Current from Unbalanced Load (`neutral-current-unbalance`)

- Formula: `In = √(Ia² + Ib² + Ic² − Ia Ib − Ib Ic − Ic Ia) Unbalance = max deviation from average / average × 100`
- Inputs: Phase A current [A]; Phase B current [A]; Phase C current [A]
- Outputs: Neutral current [A]; Current unbalance (%)
- Assumptions: Balanced three-phase supply, loads at the same power factor; Sinusoidal currents. Triplen harmonics (3rd, 9th) add in the neutral and are not included
- Notes: Electronic loads can put more current in the neutral than the phase unbalance alone suggests. Measure the neutral where harmonics are significant.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Three-Phase Voltage Unbalance (`voltage-unbalance`)

- Formula: `Unbalance % = (max deviation from average / average) × 100`
- Inputs: Line voltage Vab [V]; Line voltage Vbc [V]; Line voltage Vca [V]
- Outputs: Average line voltage [V]; Voltage unbalance (%)
- Assumptions: Line-to-line voltages measured at the motor terminals; NEMA definition; the IEC method uses symmetrical components and gives slightly different values
- Notes: A small voltage unbalance causes a much larger current unbalance in an induction motor. Fix the cause before relying on derating.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 07 Power and Energy

### Appliance Running Cost (Energy and Cost) (`energy-cost`)

- Formula: `E per day = P × (run-at % / 100) × hours per day per month = × 365 / 12 per year = × 365 Cost = E × tariff`
- Inputs: Load [kW]; Run at (% of the load); Hours of use; Hours of use are per; Days to total; Tariff per kWh; Currency symbol on the results
- Outputs: Energy (days entered) [kWh]; Cost (days entered); Cost per day; Cost per month; Cost per year; Energy per day [kWh]; Energy per month [kWh]; Energy per year [kWh]
- Assumptions: Constant draw at the run-at percentage while on; Hours per week are spread over 7 days and hours per month over 365 / 12 = 30.42 days; Flat tariff, no demand charges; Typical appliance wattages are indicative, not measured values
- Notes: This is the cost of one load at one flat rate. A real bill adds demand and fixed charges that are not modelled here. The per-month figure uses an average month of 30.42 days, so it differs a little from the days-to-total result when that is 30. For a whole bill from the units on your meter, with tariff slabs, a fixed charge and tax, use Electricity Bill from Tariff Slabs. Power can be entered in BTU/h (1 BTU/h = 0.29307 W) or tons of refrigeration (1 TR = 12,000 BTU/h = 3,516.85 W); that is the cooling rating, so check the electrical input power of an air conditioner on its label.
- Independent vectors in the test suite: 26
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Electricity Bill from Tariff Slabs (fixed charge, tax) (`electricity-bill-slabs`)

- Formula: `Energy charge = Σ (units in slab × slab rate) Bill = (Energy charge + Fixed charge) × (1 + Tax / 100)`
- Inputs: Energy used in the billing period (kWh); First slab size (kWh); First slab rate (per kWh); Second slab size (kWh); Second slab rate (per kWh); Rate above both slabs (per kWh); Fixed charge for the period; Tax or duty on the bill (%)
- Outputs: Total bill; Energy charge; Tax; Average cost per kWh
- Assumptions: Units are billed in order: first slab, then second slab, then the rest at the third rate; Slab rates, fixed charge and tax are the values you enter from your tariff order; No demand charge, power-factor penalty, time-of-day rate or surcharge
- Notes: Some tariffs apply one rate to all units (telescopic versus non-telescopic billing differ by utility). This calculator uses the telescopic method above; check your tariff order. It prices the whole bill from the units on your meter. To find what one appliance costs to run per day, month or year, use Appliance Running Cost (Energy and Cost).
- Independent vectors in the test suite: 10
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### kWh to kW and Watts (`kwh-to-kw`)

- Formula: `P = E / t`
- Inputs: Energy [kWh]; Time [h]
- Outputs: Average power [kW]
- Assumptions: Average over the stated time; Energy and time cover the same period
- Notes: Change the output unit to read the answer in watts. The result is an average; the instantaneous power can be higher or lower.
- Independent vectors in the test suite: 16
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Watts, Joules, kWh and Time (any two) (`power-energy-time`)

- Formula: `E = P × t (1 W × 1 s = 1 J, 1 kW × 1 h = 1 kWh = 3.6 MJ)`
- Inputs: Power [W]; Energy [J]; Time [s]
- Outputs: Power [W]; Energy [J]; Time [s]
- Assumptions: Constant power over the whole time; Real (active) power, not apparent power
- Notes: Change any unit to read the answer in kWh, Wh, kJ or MJ. For a varying load the result is the average power or the total energy, not the instantaneous value. For a cost, use Energy and Cost.
- Independent vectors in the test suite: 32
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### mAh to Wh and Wh to mAh (`battery-mah-wh`)

- Formula: `Wh = mAh × V / 1000 mAh = Wh × 1000 / V`
- Inputs: Battery capacity [mAh]; Nominal voltage [V]; Energy [Wh]
- Outputs: Battery capacity [mAh]; Nominal voltage [V]; Energy [Wh]
- Assumptions: Nominal (mid-discharge) voltage, not the full-charge voltage; Constant voltage over the discharge
- Notes: Cells in series add voltage (3 Li-ion cells = 11.1 V) and keep the cell capacity; cells in parallel add capacity and keep the cell voltage. Use the pack voltage. Rated energy is not usable energy: depth of discharge, converter losses and temperature reduce it.
- Independent vectors in the test suite: 32
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Maximum Demand (`maximum-demand`)

- Formula: `MD = connected × demand factor / diversity factor S = MD / pf`
- Inputs: Connected load [kW]; Demand factor; Diversity factor; Power factor
- Outputs: Maximum demand [kW]; Maximum demand [kVA]
- Assumptions: Demand factor = max demand ÷ connected load for each group; Diversity factor ≥ 1 reflects groups peaking at different times
- Notes: Use factors from your project specification or standard; the defaults are only examples.
- Independent vectors in the test suite: 15
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 08 Power Factor

### kW to kVA and kVAR (`kw-to-kva`)

- Formula: `S = P / pf Q = √(S² − P²)`
- Inputs: Real power [kW]; Power factor
- Outputs: Apparent power [kVA]; Reactive power [kVAR]
- Assumptions: Sinusoidal waveforms; Lagging or leading is not distinguished (Q is magnitude)
- Notes: Use the power factor correction calculator to size capacitors.
- Independent vectors in the test suite: 10
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### kVA to kW (`kva-to-kw`)

- Formula: `P = S × pf Q = √(S² − P²)`
- Inputs: Apparent power [kVA]; Power factor
- Outputs: Real power [kW]; Reactive power [kVAR]
- Assumptions: Sinusoidal waveforms
- Notes: Use the correction calculator to size capacitors.
- Independent vectors in the test suite: 10
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Power Factor (`power-factor`)

- Formula: `pf = P / S φ = arccos(pf)`
- Inputs: Real power [kW]; Apparent power [kVA]
- Outputs: Power factor; Phase angle (degrees)
- Assumptions: Sinusoidal waveforms
- Notes: Below about 0.9 many utilities apply a penalty; check your tariff.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 09 Voltage Drop

### Voltage Drop (`voltage-drop`)

- Formula: `Vd = √3 × I × L × (R cos φ + X sin φ) / n (single-phase: 2 × I × L × (…) / n; n = conductors per phase in parallel)`
- Inputs: Load current [A]; Route length [m]; Cable resistance [Ω/km]; Cable reactance [Ω/km]; System voltage (L-L) [V]; Power factor; Phase; Conductors per phase in parallel
- Outputs: Voltage drop [V]; Drop as % of system voltage
- Assumptions: Balanced load; R and X are per-km values for one conductor, supplied by the user; Parallel conductors are identical, the same length and share the current equally; mutual effects between them are ignored; Single-phase uses out-and-return path, percentage taken on the given voltage
- Notes: Cable R and X come from your data sheet. Standards-based sizing tables are not included; the calculation uses the General basis.
- Independent vectors in the test suite: 20
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Maximum Cable Length (`max-cable-length`)

- Formula: `L = n × (limit% × V) / (√3 × I × (R cos φ + X sin φ)) (n = conductors per phase in parallel)`
- Inputs: Load current [A]; System voltage (L-L) [V]; Allowed drop (%); Cable resistance [Ω/km]; Cable reactance [Ω/km]; Power factor; Phase; Conductors per phase in parallel
- Outputs: Maximum length [m]
- Assumptions: Balanced load; R and X are per-km values for one conductor, supplied by the user; Parallel conductors are identical, the same length and share the current equally; Single-phase uses out-and-return path
- Notes: Check cable ampacity and fault withstand separately.
- Independent vectors in the test suite: 14
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Voltage Drop from Conductor Size (`dc-voltage-drop`)

- Formula: `Vd = k × I × L × ρT / A ρT = ρ20 × (1 + α(T − 20)) k = 2 (two-wire) or √3 (three-phase) AWG: d = 0.127 mm × 92^((36 − n) / 39), A = π d² / 4`
- Inputs: Load current [A]; One-way length [m]; Conductor material; Conductor size given as; Conductor cross-section (used when size is given as area) [mm²]; AWG number (used when size is given as AWG; −1 = 00, −2 = 000, −3 = 0000); Wire diameter (used when size is given as diameter) [mm]; Custom resistivity at 20 °C (used when material is Custom) [Ω·m]; Custom temperature coefficient (per °C); Conductor temperature (°C); System voltage [V]; Circuit
- Outputs: Voltage drop [V]; Drop as % of system voltage; Conductor resistance (one way, at temperature) [Ω]; Cross-section used [mm²]; Resistivity used (at conductor temperature) [Ω·m]
- Assumptions: Resistive load, reactance ignored; ρ20 (Ω·m): copper 1.7241e-8, aluminium 2.8264e-8, silver 1.59e-8, gold 2.44e-8, nickel 6.99e-8, nichrome 1.10e-6; α (per °C): copper 0.00393, aluminium 0.00403, silver 0.0038, gold 0.0034, nickel 0.006, nichrome 0.0004; Round solid conductor when size is given as AWG or diameter; A custom resistivity is taken as the value at 20 °C
- Notes: Copper and aluminium use the annealed-copper (IACS) and commercial-aluminium values, which are slightly higher than pure-metal handbook values (copper 1.68e-8 and aluminium 2.65e-8 Ω·m would give a drop about 2.6% and 6.2% lower). The resistivity used is shown beside the result. Stranded conductors have more resistance than a solid wire of the same diameter. For AC circuits with significant reactance or low power factor use the Voltage Drop calculator with R and X from a data sheet.
- Independent vectors in the test suite: 55
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### AC Voltage Drop from Conductor Size (`ac-voltage-drop`)

- Formula: `Vd = k × I × (R cos φ ± X sin φ) (+ lagging, − leading) R = ρT × L / A ρT = ρ20 × (1 + α(T − 20)) k = √3 (three-phase) or 2 (single-phase)`
- Inputs: Load current [A]; One-way length [m]; Conductor material; Conductor size given as; Conductor cross-section (used when size is given as area) [mm²]; AWG number (used when size is given as AWG; −1 = 00, −2 = 000, −3 = 0000); Wire diameter (used when size is given as diameter) [mm]; Custom resistivity at 20 °C (used when material is Custom) [Ω·m]; Custom temperature coefficient (per °C); Conductor temperature (°C); Cable reactance [Ω/km]; Power factor; System voltage (line-to-line for three-phase) [V]; Circuit; Load power factor; Conductors per phase in parallel
- Outputs: Voltage drop [V]; Drop as % of system voltage; Conductor resistance (one way, at temperature) [Ω]; Cross-section used [mm²]; Resistivity used (at conductor temperature) [Ω·m]
- Assumptions: Balanced load, sinusoidal currents; choose leading only for a capacitive load, where the reactive term reduces the drop; Resistance from material, size and temperature; skin and proximity effect are not included (they matter above about 150 mm²); Reactance is the per-conductor value you enter from the data sheet; Single-phase uses the out-and-return path; Parallel conductors (1 to 9 per phase) are identical, the same length and share the current equally; resistance and reactance are divided by the number in parallel, and mutual effects are ignored
- Notes: For a resistive estimate set the power factor to 1 or the reactance to 0. Compare the result with the limit in your standard or specification.
- Independent vectors in the test suite: 22
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 10 Cable and Wire

### Cable Resistance (`cable-resistance`)

- Formula: `R = ρ × [1 + α (T − 20)] × L / A`
- Inputs: Length [m]; Cross-section [mm²]; Resistivity at 20 °C (Ω·mm²/m); Operating temperature (°C); Temperature coefficient (per °C)
- Outputs: Resistance [Ω]; Per unit length [Ω/km]
- Assumptions: Single conductor, one way; Linear temperature correction; DC resistance, no skin or proximity effect
- Notes: Use the loop (out and back) value for a two-wire circuit.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### AWG to Diameter and Area (`wire-gauge-conversion`)

- Formula: `d = 0.127 mm × 92^((36 − n) / 39) A = π d² / 4`
- Inputs: AWG (use −1 for 00, −2 for 000, −3 for 0000)
- Outputs: Diameter [mm]; Cross-section [mm²]
- Assumptions: Solid round conductor; Standard AWG definition
- Notes: Stranded conductors have a slightly larger overall diameter. The full AWG 0000 to 40 chart, with a cross-section to AWG lookup, is at #awg-chart.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Cable Derating and Ampacity (`cable-derating`)

- Formula: `kt = √((θmax − Ta) / (θmax − Tref)) Iz = Itab × kt × kg × ko Itab,req = In / (kt × kg × ko)`
- Inputs: Design current [A]; Protective device rating [A]; Tabulated ampacity (data sheet, reference conditions) [A]; Calculation basis; Insulation; Ambient temperature (°C); User-defined conductor limit (°C); User-defined factor on design current; Reference ambient of the tabulated value (°C); Grouping factor; Other correction factor
- Outputs: Temperature factor (approx.); Derated current capacity [A]; Tabulated ampacity required [A]; Minimum device rating for this basis [A]
- Assumptions: Approximate temperature factor from a steady-state conductor heat-balance model; it is not a standard-table correction factor; Tabulated ampacity and grouping factor supplied by the user; Rule checked: cf × Ib ≤ In ≤ Iz, with cf set by the chosen basis (1.0 General, 1.25 NEC-style continuous)
- Notes: The temperature multiplier is an engineering approximation, not a substitute for the ambient-temperature correction factor in the applicable wiring standard or cable-manufacturer tables. For final cable selection, use the prescribed factor for the actual cable type, installation method, ambient conditions and grouping. Tabulated ampacity values are not built in because they depend on installation method and may be protected data; read them from your data sheet or licensed standard.
- Independent vectors in the test suite: 30
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Cable Size for Voltage Drop (`cable-size-vd`)

- Formula: `A = k × I × L × ρθ × cos φ / (Vmax − k × I × L × X × sin φ) k = √3 (three-phase) or 2 (single-phase)`
- Inputs: Load current [A]; Route length [m]; System voltage (L-L) [V]; Allowed drop (%); Power factor; Conductor; Insulation; Cable reactance [Ω/km]; Phase
- Outputs: Minimum cross-section [mm²]; Standard size [mm²]; Drop at standard size [V]; Drop as % of system voltage
- Assumptions: Resistivity taken at the full-load conductor temperature (70 or 90 °C); Reactance treated as constant, independent of size; Standard sizes from the IEC 60228 preferred series, 1.5 to 630 mm²; Copper 0.017241 and aluminium 0.02826 Ω·mm²/m at 20 °C
- Notes: This sizes for voltage drop only. Check the result against derated ampacity and short-circuit withstand before selecting a cable.
- Independent vectors in the test suite: 30
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Cable Short-Circuit Withstand (`cable-sc-withstand`)

- Formula: `S = I × √t / k`
- Inputs: Fault current (rms) [kA]; Clearing time [s]; Conductor and insulation
- Outputs: Minimum cross-section [mm²]; Standard size [mm²]; Material constant k
- Assumptions: Adiabatic heating (clearing time up to 5 s); k values at the normal starting temperature, as published in IEC 60364-4-43 and IEC 60364-5-54. For PVC the standard lowers k for conductors above 300 mm² (copper 103, aluminium 68), and this calculator applies that when the required area is above 300 mm²; Fault current is the prospective rms value at the cable; IEC-type k values apply on every basis. AS/NZS 3008.1.1:2025 uses its own K and final-temperature tables (for XLPE a higher K, reported as 167.4 for 250 °C), so do not use this result as an AS/NZS 3008 check
- Notes: Use the clearing time of the protective device at the fault level, not its trip setting.
- Independent vectors in the test suite: 30
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Cable Power Loss (I²R) (`cable-power-loss`)

- Formula: `Loss = 3 × I² × R × L (three-phase) 2 × I² × R × L (single-phase)`
- Inputs: Load current [A]; Route length [m]; Conductor resistance [Ω/km]; System voltage (L-L) [V]; Power factor; Phase
- Outputs: Cable loss [W]; Loss as % of load power
- Assumptions: Balanced load; Resistance is the AC value at operating temperature; Neutral current ignored
- Notes: Cable loss is continuous heat. Over a year it is often worth a larger conductor than the voltage-drop limit alone requires.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Conductor Resistance vs Temperature (`conductor-temp-resistance`)

- Formula: `RT = R20 × (1 + α × (T − 20)) α: copper 0.00393, aluminium 0.00403 per °C`
- Inputs: Resistance at 20 °C [Ω]; Operating temperature (°C); Conductor material
- Outputs: Resistance at temperature [Ω]; Change from 20 °C (%)
- Assumptions: Linear temperature coefficient; Valid across the normal operating range
- Notes: A cable at 90 °C has about 27% more resistance than the cold catalogue value. Voltage drop and loss should use the hot value.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Copper vs Aluminium Conductor (`copper-vs-aluminium`)

- Formula: `R = ρ L / A A(Al) = A(Cu) × ρAl / ρCu`
- Inputs: Copper cross-section [mm²]; Length [m]
- Outputs: Copper resistance (20 °C) [Ω]; Aluminium resistance, same size [Ω]; Aluminium size for equal resistance [mm²]; Aluminium mass vs copper (equal resistance)
- Assumptions: ρ at 20 °C: copper 1.7241e-8, aluminium 2.8264e-8 Ω·m; Density: copper 8960, aluminium 2700 kg/m³
- Notes: Aluminium needs about 1.64 times the area but weighs about half as much. Terminations, ampacity tables and bending radius are separate checks.
- Independent vectors in the test suite: 15
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Parallel Cable Sets (`parallel-cable-sets`)

- Formula: `n = ceil(Ib / (Iz × k))`
- Inputs: Design current [A]; Rated current of one cable [A]; Grouping and other derating factor
- Outputs: Cables per phase; Derated current of one cable [A]
- Assumptions: Equal cables of the same length and type; Current shares equally
- Notes: Parallel cables must have equal length, size and route conditions or the current will not share. Keep each set a similar distance from the others.
- Independent vectors in the test suite: 52
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### SWG to Diameter and Area (`swg-wire`)

- Formula: `d = table value for the SWG number (7/0 = 0.500 in … 50 = 0.0010 in) A = π d² / 4`
- Inputs: SWG number (use 0 for 1/0, −1 for 2/0, down to −6 for 7/0)
- Outputs: Diameter [mm]; Diameter (inches) [in]; Cross-section [mm²]
- Assumptions: Solid round conductor; Diameters are the standard SWG table values; the series is a table, not a formula
- Notes: SWG and AWG differ: SWG 18 is 1.219 mm, AWG 18 is 1.024 mm. Always state which gauge system a drawing or order uses.
- Independent vectors in the test suite: 57
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 11 Conduit and Raceway

### Conduit Fill (`conduit-fill`)

- Formula: `fill = n × (d / D)² × 100 limit: 53% for 1 cable, 31% for 2, 40% for 3 or more`
- Inputs: Conduit inside diameter [mm]; Cable outside diameter [mm]; Number of cables
- Outputs: Fill (%); Common fill limit (%); Most cables at the limit
- Assumptions: Round, equal cables; Limits are the widely used general rule; your code may differ
- Notes: Pulling tension, bends and the length of run can require a lower fill than the limit.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 12 Motors

### Motor Full-Load Current (`motor-current`)

- Formula: `I = P / (η × √3 × V × pf)`
- Inputs: Shaft power [kW]; Line voltage (L-L) [V]; Power factor; Efficiency; Phase
- Outputs: Full-load current [A]; Electrical input power [kW]
- Assumptions: Rated load; Nameplate current takes precedence over this value; Starting current is 5–8× and not included
- Notes: Nameplate values should be preferred. Use this for planning when only kW is known.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Motor Shaft Torque (`motor-torque`)

- Formula: `T = P / ω = 60 × P / (2π × N)`
- Inputs: Shaft power [kW]; Rated speed [rpm]
- Outputs: Shaft torque [N·m]
- Assumptions: Power is mechanical shaft output; Speed is the loaded rotor speed, not synchronous speed
- Notes: Use the nameplate speed (for example 1480 rpm), not 1500 rpm, or the torque will be understated.
- Independent vectors in the test suite: 10
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Induction Motor Slip (`motor-slip`)

- Formula: `Ns = 120 × f / p slip = (Ns − N) / Ns × 100`
- Inputs: Supply frequency [Hz]; Number of poles; Rotor speed [rpm]
- Outputs: Synchronous speed [rpm]; Slip (%)
- Assumptions: Motor operation (rotor at or below synchronous speed); Poles is the total pole count
- Notes: Typical full-load slip is 1% to 5% for standard cage motors.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Motor Starting Current (`motor-starting`)

- Formula: `DOL: Ist = k × In Star-delta: Ist ÷ 3, torque ÷ 3 Auto-transformer: Ist × tap², torque × tap²`
- Inputs: Full-load current [A]; Locked-rotor current (× full-load); Starting method; Auto-transformer tap
- Outputs: Line starting current [A]; Starting torque (% of direct-on-line)
- Assumptions: Motor torque varies with voltage squared; Supply voltage does not sag during the start
- Notes: Star-delta suits only light or no-load starts. The changeover can cause a second current peak.
- Independent vectors in the test suite: 30
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Motor Output Power and Efficiency Loss (`motor-power-output`)

- Formula: `Pin = √3 × V × I × pf Pout = Pin × η loss = Pin − Pout`
- Inputs: Line voltage (L-L) [V]; Line current [A]; Power factor; Efficiency
- Outputs: Electrical input [kW]; Shaft output [kW]; Motor loss [kW]
- Assumptions: Three-phase, balanced; Efficiency is the value at this load, not nameplate
- Notes: Change the shaft output unit to HP. Motors lose efficiency below about 50% load.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Motor Starting Voltage Dip (`motor-start-dip`)

- Formula: `Sst = √3 × V × k × In dip = Sst / (Ssc + Sst) torque ∝ (1 − dip)²`
- Inputs: Motor full-load current [A]; Starting current (× full-load); Line voltage (L-L) [V]; Fault level at the motor bus [MVA]
- Outputs: Voltage dip (%); Starting apparent power [MVA]; Torque available vs full voltage (%)
- Assumptions: Source and motor impedances add arithmetically; Starting power factor ignored (slightly conservative)
- Notes: Many specifications limit starting dip to 10 to 15% at the motor bus. Check lights, drives and contactors on the same bus.
- Independent vectors in the test suite: 8
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Pump Shaft and Motor Power (`pump-motor-power`)

- Formula: `Ph = ρ × g × Q × H Ps = Ph / ηpump Pin = Ps / ηmotor`
- Inputs: Flow [m³/h]; Total head [m]; Liquid density (kg/m³); Pump efficiency; Motor efficiency
- Outputs: Hydraulic power [kW]; Pump shaft power [kW]; Motor electrical input [kW]
- Assumptions: g = 9.80665 m/s²; Steady flow at the duty point
- Notes: Select the motor from the shaft power plus a margin (commonly 10 to 20%). Check NPSH and the pump curve separately.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Star-Delta Starting (`star-delta-starting`)

- Formula: `IDOL = k × In Istar = IDOL / 3 Tstar = TDOL / 3`
- Inputs: Motor rated current [A]; Locked-rotor current ratio (ILR / In); Motor rated torque [N·m]; Locked-rotor torque ratio (TLR / Tn); Load torque at start [N·m]
- Outputs: DOL starting current [A]; Star starting line current [A]; DOL starting torque [N·m]; Star starting torque [N·m]
- Assumptions: Motor is delta-connected at its rated line voltage; Supply voltage stays constant; Switching transient peak is not included
- Notes: Star-delta cuts both current and torque to one third. It only suits loads that start with low torque, such as unloaded fans and pumps with a closed valve.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 13 Transformers

### Transformer Full-Load Current (`transformer-current`)

- Formula: `I = S / (√3 × V)`
- Inputs: Transformer rating [kVA]; Winding voltage (L-L) [V]
- Outputs: Rated current [A]
- Assumptions: Three-phase transformer; Rated kVA at rated voltage
- Notes: Run once per winding voltage.
- Independent vectors in the test suite: 10
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Transformer Voltage Regulation (`transformer-regulation`)

- Formula: `X = √(Z² − R²) reg = x(R cosφ + X sinφ) + [x(X cosφ − R sinφ)]² / 200`
- Inputs: Impedance (%); Resistance (%); Load (fraction of rating); Power factor; No-load secondary voltage [V]
- Outputs: Regulation (%); Secondary voltage on load [V]
- Assumptions: Lagging power factor; Primary voltage held at rating; Load balanced
- Notes: A leading power factor can give negative regulation (voltage rise); this calculator covers lagging loads only.
- Independent vectors in the test suite: 8
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Transformer Efficiency and Losses (`transformer-efficiency`)

- Formula: `η = x S pf / (x S pf + Pfe + x² Pcu) x(max η) = √(Pfe / Pcu)`
- Inputs: Rating [kVA]; No-load (iron) loss [kW]; Full-load copper loss [kW]; Load (fraction of rating); Power factor
- Outputs: Efficiency (%); Total loss [kW]; Load at maximum efficiency
- Assumptions: Iron loss constant with load; Copper loss scales with load squared; Stray and harmonic losses ignored
- Notes: Distribution transformers peak at 40% to 60% load, so lightly loaded units can be more efficient than fully loaded ones.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Transformer kVA Selection (`transformer-sizing`)

- Formula: `S = P / pf × (1 + growth) / loading I = S / (√3 × V)`
- Inputs: Connected running load [kW]; Power factor; Future growth (%); Target loading; Secondary voltage (L-L) [V]
- Outputs: Required rating [kVA]; Next standard size [kVA]; Secondary full-load current [A]
- Assumptions: Balanced three-phase load; Standard sizes: 25, 50, 63, 100, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150 kVA
- Notes: Harmonic-rich loads, motor starting and ambient temperature can call for a larger or K-rated unit.
- Independent vectors in the test suite: 67
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Transformer Loading from Measurements (`transformer-loading`)

- Formula: `Load = √3 × V × I loading = Load / rating`
- Inputs: Secondary voltage (L-L) [V]; Measured line current [A]; Transformer rating [kVA]
- Outputs: Present load [kVA]; Loading (%); Spare capacity [kVA]
- Assumptions: Balanced phases (use the average of the three line currents)
- Notes: Sustained loading above 100% shortens insulation life. Check the winding temperature indicator as well.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 14 Generators

### Generator kVA Selection (`generator-kva`)

- Formula: `S = P / pf × (1 + margin) I = S / (√3 × V)`
- Inputs: Running load [kW]; Power factor; Design margin (%); Line voltage (L-L) [V]
- Outputs: Required rating [kVA]; Next standard size [kVA]; Rated current at that size [A]
- Assumptions: Three-phase, continuous or standby duty as rated; Running load only; Standard sizes (kVA): 10, 15, 20, 30, 40, 50, 62.5, 75, 100, 125, 150, 200, 250, 320, 400, 500, 625, 750, 1000, 1250, 1500, 2000, 2500
- Notes: Motor starting, non-linear loads and altitude or temperature derating need a separate check and can raise the size.
- Independent vectors in the test suite: 67
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Generator Fuel Consumption and Autonomy (`generator-fuel`)

- Formula: `Fuel mass flow = P × SFC L/h = mass flow / density runtime = tank / (L/h)`
- Inputs: Electrical load [kW]; Specific fuel consumption (g/kWh); Fuel density (kg/L); Tank volume [L]
- Outputs: Fuel consumption (L/h); Runtime on one tank [h]
- Assumptions: Steady load; SFC taken at the stated load
- Notes: Assume no more than about 90% of the tank is usable, and add reserve for fuel-polishing and sludge.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 15 Batteries and UPS

### UPS Battery Runtime (`ups-runtime`)

- Formula: `E = Vb × Ah × DoD × ageing t = E / (Load / η)`
- Inputs: Load [kW]; UPS efficiency; Battery bank voltage [V]; Battery capacity [Ah]; Usable depth of discharge; Ageing and temperature factor
- Outputs: Usable battery energy [kWh]; Runtime [min]
- Assumptions: Constant power load; Capacity is the rated value at the stated discharge rate
- Notes: High discharge rates deliver less than rated Ah (Peukert effect), so confirm against the battery discharge table for short runtimes.
- Independent vectors in the test suite: 8
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Battery Bank Sizing (`battery-bank-size`)

- Formula: `Ah = P × t / (V × DoD × η)`
- Inputs: Load power [W]; Backup time [h]; Battery bank voltage [V]; Usable depth of discharge; Inverter efficiency
- Outputs: Required capacity [Ah]; Energy from battery [kWh]
- Assumptions: Constant load for the whole backup time; Capacity quoted at the discharge rate of the backup time; No ageing, temperature or Peukert allowance
- Notes: Add an ageing margin (typically 20 to 25%) and a temperature factor before selecting the battery.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Battery Series-Parallel Bank (`battery-series-parallel`)

- Formula: `V = ns × Vc Ah = np × Ahc E = V × Ah`
- Inputs: Battery or cell voltage [V]; Battery capacity [Ah]; Batteries in series per string; Parallel strings
- Outputs: Bank voltage [V]; Bank capacity [Ah]; Bank energy [kWh]
- Assumptions: Identical batteries at the same state of charge
- Notes: Keep parallel strings to four or fewer in lead-acid banks to limit current imbalance.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Battery Charge Time (`battery-charge-time`)

- Formula: `t = Cap × fraction / (Icharge × η)`
- Inputs: Battery capacity [Ah]; Fraction of capacity to restore; Charger current [A]; Charge efficiency
- Outputs: Charge time [h]; Charge delivered by the charger [Ah]
- Assumptions: Constant charger current for the whole time; No allowance for the slower absorption stage near full
- Notes: Real chargers taper the current near full charge, so the last 10 to 20% takes longer than this estimate. Follow the battery maker's limits on charge current.
- Independent vectors in the test suite: 8
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 16 Protection

### Breaker Rating Selection (`breaker-size`)

- Formula: `In = smallest standard rating ≥ I × margin`
- Inputs: Design current [A]; Margin factor
- Outputs: Breaker rating [A]
- Assumptions: Standard ratings: 6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 320, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000 A; Rating must also not exceed the cable current capacity
- Notes: Selection on current only. Breaking capacity, trip curve and discrimination are separate checks.
- Independent vectors in the test suite: 85
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 17 Short Circuit

### Transformer Fault Current (`fault-current`)

- Formula: `Isc = S / (√3 × V × Z%/100)`
- Inputs: Transformer rating [kVA]; Secondary voltage (L-L) [V]; Impedance
- Outputs: Fault current at terminals [kA]
- Assumptions: Infinite source (utility impedance ignored); Terminal fault, cable impedance ignored; Gives an upper bound
- Notes: Including source and cable impedance lowers the value. Use as a conservative first check.
- Independent vectors in the test suite: 10
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Fault Level (kA to MVA) (`fault-mva`)

- Formula: `S = √3 × V × I`
- Inputs: Line voltage (L-L) [V]; Fault current [kA]
- Outputs: Fault level [MVA]
- Assumptions: Symmetrical three-phase fault; Voltage is the pre-fault line-to-line value
- Notes: For the reverse, I = S / (√3 × V). Per-unit base values are in the Per-Unit calculator.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Fault Current by Fault Type (`fault-types`)

- Formula: `I3φ = V / (√3 Z1) ILL = (√3 / 2) × I3φ ILE = √3 V / (2 Z1 + Z0)`
- Inputs: System voltage (L-L) [V]; Positive-sequence impedance to the fault [mΩ]; Zero-sequence ÷ positive-sequence impedance
- Outputs: Three-phase fault [kA]; Line-to-line fault [kA]; Line-to-earth fault [kA]
- Assumptions: Z2 = Z1; Impedances combined as magnitudes (no angle), slightly conservative; Bolted fault, no arc resistance
- Notes: The largest value sets the breaking capacity; the smallest earth-fault value must still trip the protective device in time.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 18 Earthing

### Earth Rod Resistance (`earth-rod-resistance`)

- Formula: `R = ρ / (2π L) × (ln(8L / d) − 1)`
- Inputs: Soil resistivity (Ω·m); Rod length driven in soil [m]; Rod diameter [mm]
- Outputs: Earth resistance [Ω]
- Assumptions: Uniform soil; Single rod, no nearby electrodes
- Notes: Measure on site. Soil moisture and season can change resistance several-fold; parallel rods must be spaced at least their length apart.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Neutral Earthing Resistor (`ngr-sizing`)

- Formula: `R = (V / √3) / If P = If² × R E = P × t`
- Inputs: System voltage (L-L) [kV]; Earth-fault current to allow [A]; Fault duration [s]
- Outputs: Resistance [Ω]; Power during fault [kW]; Energy during fault [kWh]
- Assumptions: Single line-to-earth fault, source impedance neglected; Fault current is purely resistive
- Notes: Choose the current from relay sensitivity and damage limits. The resistor is rated for its short-time duty, not for continuous use.
- Independent vectors in the test suite: 8
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Earth Rods in Parallel (`earth-rods-parallel`)

- Formula: `Rn = R1 / (n × u)`
- Inputs: Single rod resistance [Ω]; Number of rods; Utilisation factor
- Outputs: Combined resistance [Ω]
- Assumptions: Rods driven in the same soil; Utilisation factor is user-supplied
- Notes: Doubling the rods does not halve the resistance. Deeper rods or lower-resistivity backfill often work better than more rods.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Earth Grid Resistance (`earth-grid-resistance`)

- Formula: `Rg = ρ / (4r) + ρ / LT r = √(A / π)`
- Inputs: Soil resistivity [Ω·m]; Area covered by the grid [m²]; Total buried conductor length [m]
- Outputs: Grid resistance [Ω]
- Assumptions: Uniform soil; Grid buried at shallow depth; Laurent-Niemann form; the Sverak refinement adds a depth term
- Notes: Measure soil resistivity on site (Wenner method). Step and touch voltage need a separate study.
- Independent vectors in the test suite: 8
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 19 Power Systems

### Per-Unit Base Values (`per-unit-base`)

- Formula: `Ibase = Sbase / (√3 × Vbase) Zbase = Vbase² / Sbase`
- Inputs: Base power [MVA]; Base voltage (L-L) [kV]
- Outputs: Base current [A]; Base impedance [Ω]
- Assumptions: Three-phase system; Voltage is line-to-line
- Notes: To change base, use Z(new) = Z(old) × (S new / S old) × (V old / V new)².
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Per-Unit Base Conversion (`per-unit-convert`)

- Formula: `Znew = Zold × (Snew / Sold) × (Vold / Vnew)²`
- Inputs: Impedance on old base (pu); Old MVA base [MVA]; Old voltage base [kV]; New MVA base [MVA]; New voltage base [kV]
- Outputs: Impedance on new base (pu)
- Assumptions: Same physical impedance, different base
- Notes: Typical use: put transformer and source impedances on one common system base before adding them.
- Independent vectors in the test suite: 10
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 20 Harmonics

### Current THD (`harmonic-thd`)

- Formula: `THD = √(I3² + I5² + I7²) / I1 × 100 Irms = √(I1² + I3² + I5² + I7²)`
- Inputs: Fundamental current [A]; 3rd harmonic [A]; 5th harmonic [A]; 7th harmonic [A]
- Outputs: THD (%); Total RMS current [A]
- Assumptions: Only the harmonics entered are included; Magnitudes are RMS
- Notes: Add further harmonic orders from a power-quality analyser for a complete figure.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 21 Capacitors and Reactive Power

### Power Factor Correction (`pf-correction-kvar`)

- Formula: `Qc = P × (tan φ1 − tan φ2), φ = arccos(pf)`
- Inputs: Real power [kW]; Present power factor; Target power factor
- Outputs: Capacitor rating [kVAR]
- Assumptions: Sinusoidal waveforms; Harmonics not considered (check detuning for harmonic-rich loads)
- Notes: Round up to the next standard capacitor step and check for resonance on harmonic-rich systems.
- Independent vectors in the test suite: 10
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Capacitors in Series and Parallel (`capacitance-series-parallel`)

- Formula: `Parallel: C = C1 + C2 + C3 Series: 1/C = 1/C1 + 1/C2 + 1/C3`
- Inputs: Capacitor 1 [µF]; Capacitor 2 [µF]; Capacitor 3 [µF]
- Outputs: In parallel [µF]; In series [µF]
- Assumptions: Ideal capacitors; Voltage ratings are not checked
- Notes: In series the voltage divides unequally unless the values match; check each rating. For two capacitors, enter a very small third value for the parallel result or a very large one for the series result (zero is not accepted).
- Independent vectors in the test suite: 10
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Capacitor Bank Size (µF) (`pf-capacitor-uf`)

- Formula: `C = Q / (3 × 2π f × V²) I = Q / (√3 × V)`
- Inputs: Bank rating [kVAR]; Line voltage (L-L) [V]; Frequency [Hz]
- Outputs: Capacitance per phase [µF]; Bank line current [A]
- Assumptions: Delta connection; Rated kVAR is at the stated voltage
- Notes: Choose capacitors rated above system voltage, and check for harmonics before fitting detuning reactors.
- Independent vectors in the test suite: 8
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 23 Electronics

### Voltage Divider (`voltage-divider`)

- Formula: `Vout = Vin × R2 / (R1 + R2) I = Vin / (R1 + R2)`
- Inputs: Input voltage [V]; Upper resistor R1 [kΩ]; Lower resistor R2 [kΩ]
- Outputs: Output voltage [V]; Divider current [mA]
- Assumptions: Unloaded output: no current drawn from the midpoint; Resistors are ideal
- Notes: A load on the output in parallel with R2 lowers Vout. Keep the load at least ten times R2 for a stable output.
- Independent vectors in the test suite: 10
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### LED Series Resistor (`led-resistor`)

- Formula: `R = (Vs − Vf) / If P = If² × R`
- Inputs: Supply voltage [V]; LED forward voltage [V]; LED current [mA]
- Outputs: Resistor value [Ω]; Resistor dissipation [W]
- Assumptions: Single LED in series with the resistor; Forward voltage is the datasheet value at the chosen current
- Notes: Round R up to the next standard value and use a resistor rated at least twice the dissipation.
- Independent vectors in the test suite: 10
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### RC Time Constant and Cutoff (`rc-time-constant`)

- Formula: `τ = R × C fc = 1 / (2π × R × C)`
- Inputs: Resistance [kΩ]; Capacitance [µF]
- Outputs: Time constant τ [ms]; Cutoff frequency [Hz]
- Assumptions: Ideal resistor and capacitor; Source and load impedance are negligible
- Notes: A capacitor reaches about 63% of its final voltage after one τ and about 99% after five τ.
- Independent vectors in the test suite: 10
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Decibel Converter (`decibel`)

- Formula: `dB = 20 log10(Vout / Vin) dB = 10 log10(Pout / Pin)`
- Inputs: Voltage ratio (Vout / Vin); Power ratio (Pout / Pin)
- Outputs: Voltage gain (dB); Power gain (dB)
- Assumptions: Same impedance at input and output for the voltage form
- Notes: A ratio below 1 gives a negative dB value, which is an attenuation.
- Independent vectors in the test suite: 10
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Op-Amp Gain (`op-amp-gain`)

- Formula: `Inverting: A = −Rf / Rin Non-inverting: A = 1 + Rf / Rin`
- Inputs: Feedback resistor [kΩ]; Input resistor [kΩ]; Input voltage [V]; Configuration
- Outputs: Voltage gain; Output voltage [V]
- Assumptions: Ideal op-amp; Output stays within the supply rails
- Notes: Real op-amps saturate near the supply rails and have a finite gain-bandwidth product.
- Independent vectors in the test suite: 12
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### RC Filter Cutoff (`rc-filter-cutoff`)

- Formula: `fc = 1 / (2π R C) Low-pass: |H| = 1 / √(1 + (f/fc)²), φ = −atan(f/fc) High-pass: |H| = (f/fc) / √(1 + (f/fc)²), φ = atan(fc/f)`
- Inputs: Resistance [kΩ]; Capacitance [nF]; Frequency of interest [Hz]; Filter type
- Outputs: Cutoff frequency (−3 dB) [Hz]; Gain at the frequency of interest (dB); Phase shift (°)
- Assumptions: Ideal source and an unloaded output; First-order filter, so 20 dB per decade roll-off
- Notes: A load resistance or source impedance shifts the real cutoff. Keep the load at least ten times R.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 24 Semiconductor Components

### Zener Shunt Regulator (`zener-regulator`)

- Formula: `Rs = (Vin − Vz) / (IL + Iz) PR = (Vin − Vz)² / Rs Pz(no load) = Vz × (Vin − Vz) / Rs`
- Inputs: Input voltage (minimum) [V]; Zener voltage [V]; Maximum load current [mA]; Minimum zener current [mA]
- Outputs: Series resistor [Ω]; Next lower E24 value [Ω]; Resistor power [W]; Zener power with the load removed [W]
- Assumptions: Design at the lowest input voltage and highest load; Zener voltage is constant over the current range
- Notes: Check the zener power again at the highest input voltage with the load disconnected. A shunt regulator wastes the full current all the time.
- Independent vectors in the test suite: 8
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Transistor Base Resistor (`bjt-base-resistor`)

- Formula: `Ib = k × Ic / hFE Rb = (Vin − Vbe) / Ib`
- Inputs: Drive voltage [V]; Base-emitter voltage [V]; Collector current [mA]; Minimum current gain hFE; Overdrive factor
- Outputs: Base current [mA]; Base resistor [Ω]; Next lower E24 value [Ω]
- Assumptions: Transistor used as a switch, not an amplifier; Vbe about 0.7 V for silicon
- Notes: Check that the driver pin can supply the base current, and that the transistor dissipation at Vce(sat) is within its rating.
- Independent vectors in the test suite: 8
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### 555 Timer Astable (`timer-555`)

- Formula: `f = 1 / (ln2 × (R1 + 2 R2) × C) Th = ln2 × (R1 + R2) × C Tl = ln2 × R2 × C`
- Inputs: R1 (VCC to discharge) [kΩ]; R2 (discharge to threshold) [kΩ]; Timing capacitor C [µF]
- Outputs: Frequency [Hz]; Period [s]; Output high time [s]; Output low time [s]; Duty cycle (%)
- Assumptions: Ideal components, supply well within the 555 range; The common 1.44 / ((R1 + 2R2) C) is this formula with ln2 rounded
- Notes: Duty cycle is always above 50% in this circuit. A diode across R2 or a different topology is needed for a lower duty cycle. Capacitor tolerance sets the frequency accuracy.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Heatsink Thermal Resistance (`heatsink-thermal`)

- Formula: `θja(max) = (Tj − Ta) / P θsa(max) = θja(max) − θjc − θcs`
- Inputs: Power dissipated [W]; Ambient temperature (°C); Maximum junction temperature (°C); Junction to case θjc (°C/W); Case to sink θcs (°C/W)
- Outputs: Total allowed θja; Heatsink to ambient θsa, at most (°C/W)
- Assumptions: Steady-state dissipation; Single heat path from junction through case and sink to ambient
- Notes: Leave margin below the junction limit. Heatsink data sheets give θsa for natural convection or a stated airflow, so match that condition.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 25 Solar PV

### Solar PV String Length (`pv-string-size`)

- Formula: `Voc(cold) = Voc × (1 + tc × (Tmin − 25)) N = floor(Vmax / Voc(cold))`
- Inputs: Module open-circuit voltage (STC) [V]; Voc temperature coefficient (%/°C); Lowest site temperature (°C); Maximum system voltage [V]
- Outputs: Cold open-circuit voltage per module [V]; Maximum modules per string
- Assumptions: Standard test conditions are 25 °C; Linear temperature coefficient
- Notes: Also check the inverter MPPT window at hot-weather Vmp; this sets only the upper limit.
- Independent vectors in the test suite: 22
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Solar PV Energy Yield (`pv-energy`)

- Formula: `E(day) = P × peak sun hours × PR E(year) = E(day) × 365`
- Inputs: Array size (peak) [kW]; Peak sun hours per day; Performance ratio
- Outputs: Energy per day [kWh]; Energy per year [kWh]
- Assumptions: Average day over the year; No degradation or shading beyond the PR
- Notes: Annual output falls about 0.5% per year with module ageing.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Solar PV Array Size from Energy Need (`pv-array-size`)

- Formula: `Parray = E / (PSH × PR) modules = Parray / Pmodule, rounded up`
- Inputs: Daily energy needed [kWh]; Peak sun hours per day; Performance ratio; Module rating [W]
- Outputs: Array rating [kW]; Modules needed
- Assumptions: PSH is the daily irradiation on the module plane in kWh/m²; Performance ratio covers temperature, soiling, cable and inverter losses
- Notes: Get PSH from site irradiation data. Roof area, string voltage window and inverter size are separate checks.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 26 Renewable Energy

### Wind Turbine Power (`wind-power`)

- Formula: `A = π D² / 4 Pwind = ½ ρ A v³ Pout = Pwind × Cp × η`
- Inputs: Rotor diameter [m]; Wind speed [m/s]; Power coefficient Cp; Air density (kg/m³); Drive-train and generator efficiency
- Outputs: Swept area [m²]; Power in the wind [kW]; Electrical output [kW]
- Assumptions: Steady wind at hub height; Cp is for this wind speed, taken from the power curve; Standard sea-level air density 1.225 kg/m³
- Notes: Power rises with the cube of wind speed, so a small error in the wind speed gives a large error in output. Use the manufacturer power curve for real yield.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 27 EV Charging

### EV Charging Time (`ev-charge-time`)

- Formula: `Eb = capacity × (target − start) Eg = Eb / η t = Eg / P`
- Inputs: Battery capacity [kWh]; Start charge (%); Target charge (%); Charger power (AC supply) [kW]; Charging efficiency
- Outputs: Energy into battery [kWh]; Energy from grid [kWh]; Charging time [h]
- Assumptions: Constant charging power; Vehicle onboard charger is not the limit
- Notes: Charging slows above about 80%, so real times to 100% are longer than this linear estimate.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 28 Lighting

### Lighting Level (Lumen Method) (`lumen-method`)

- Formula: `N = E × A / (Φ × UF × MF)`
- Inputs: Required illuminance (lux); Room area [m²]; Lumens per luminaire; Utilisation factor; Maintenance factor
- Outputs: Luminaires (calculated); Luminaires (rounded up)
- Assumptions: Uniform layout; Utilisation factor taken from the luminaire data for this room
- Notes: Check uniformity and glare separately; the count is a starting point for layout.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### LED Retrofit Savings and Payback (`led-retrofit-payback`)

- Formula: `Saved energy = n × (Wold − Wnew) × hours payback = n × cost / yearly saving`
- Inputs: Number of fittings; Existing fitting power [W]; LED fitting power [W]; Operating hours per year; Energy tariff (per kWh); Cost per new fitting
- Outputs: Energy saved per year [kWh]; Cost saved per year; Simple payback (years)
- Assumptions: Fixed hours and tariff; Maintenance and lamp-replacement savings not included (they shorten payback)
- Notes: Tariff and cost use any one currency. Include demand charges for a fuller picture.
- Independent vectors in the test suite: 8
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Lumens, Lux and Area (any two) (`lumens-lux-area`)

- Formula: `E = Φ × u / A Φ = E × A / u A = Φ × u / E (1 fc = 10.7639 lx)`
- Inputs: Luminous flux (lm); Illuminance (lux); Area [m²]; Fraction of lumens reaching the surface
- Outputs: Luminous flux (lm); Illuminance (lux); Area [m²]; Illuminance (footcandles)
- Assumptions: Light is spread evenly over the area; u is the fraction of lamp lumens that reach the surface
- Notes: Lux is lumens per square metre. For a room, use the utilisation and maintenance factors, or the lumen method for a luminaire count.
- Independent vectors in the test suite: 30
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Candela, Lux and Distance (any two) (`candela-lux-distance`)

- Formula: `E = I × cos θ / d² I = E × d² / cos θ d = √(I × cos θ / E)`
- Inputs: Luminous intensity (cd); Illuminance (lux); Distance from the source [m]; Angle of incidence (°)
- Outputs: Luminous intensity (cd); Illuminance (lux); Distance [m]; Illuminance (footcandles)
- Assumptions: Treated as a point source: the distance should be at least five times the size of the source; Distance is measured along the line from the source to the point; No light is absorbed or reflected on the way
- Notes: Valid when the distance is at least five times the source size. Near a large luminaire the inverse-square law overstates the lux.
- Independent vectors in the test suite: 30
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Candela and Lumens from Beam Angle (`candela-lumens-beam`)

- Formula: `Ω = 2π × (1 − cos(θ / 2)) Φ = I × Ω I = Φ / Ω`
- Inputs: Luminous intensity (cd); Luminous flux (lm); Full beam angle (°)
- Outputs: Luminous intensity (cd); Luminous flux (lm); Solid angle (sr)
- Assumptions: Intensity is the same everywhere inside the cone; No light outside the cone
- Notes: Real beams are brightest on axis, so a data-sheet peak intensity gives more lumens than the beam really carries. Use the measured polar curve for accuracy.
- Independent vectors in the test suite: 20
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Lumens and Watts (luminous efficacy) (`lumens-watts`)

- Formula: `Φ = P × η P = Φ / η η = Φ / P`
- Inputs: Luminous flux (lm); Electrical power [W]; Luminous efficacy (lm/W)
- Outputs: Luminous flux (lm); Electrical power [W]; Luminous efficacy (lm/W)
- Assumptions: Power is the lamp or luminaire input power as stated for the efficacy; Efficacy is taken from the data sheet
- Notes: Efficacy depends on the lamp type and whether driver losses are counted. Compare lamps on the same basis, lamp-only or system.
- Independent vectors in the test suite: 30
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Lighting Power for a Target Lux (`lux-to-watts`)

- Formula: `Φ = E × A / (UF × MF) P = Φ / η power density = P / A`
- Inputs: Target illuminance (lux); Area [m²]; Luminous efficacy (lm/W); Utilisation factor; Maintenance factor
- Outputs: Lamp lumens needed; Electrical power [W]; Power density (W/m²)
- Assumptions: Uniform illuminance across the area; Factors apply to the whole installation
- Notes: Use the lumen method calculator for the number of luminaires. Check the power density against your energy code.
- Independent vectors in the test suite: 15
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Millicandela and Lumens from Beam Angle (`millicandela-lumens-beam`)

- Formula: `Ω = 2π × (1 − cos(θ / 2)) Φ (lm) = I (cd) × Ω I (mcd) = Φ / Ω × 1,000`
- Inputs: Luminous intensity (mcd); Luminous flux (lm); Full beam angle (°)
- Outputs: Luminous intensity (mcd); Luminous flux (lm); Solid angle (sr)
- Assumptions: Intensity is the same everywhere inside the cone; No light outside the cone
- Notes: Data-sheet millicandela is normally the peak on-axis value, so the flux from this conversion is an upper estimate. Use the total luminous flux on the data sheet where it is given.
- Independent vectors in the test suite: 20
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Illuminance from Lamp Power (watts to lux) (`watts-to-lux`)

- Formula: `Φ = P × η E = Φ × UF × MF / A`
- Inputs: Electrical power [W]; Luminous efficacy (lm/W); Area [m²]; Utilisation factor; Maintenance factor
- Outputs: Average illuminance (lux); Lamp lumens (lm); Power density (W/m²)
- Assumptions: Uniform illuminance across the area; Factors apply to the whole installation; Power is lamp or luminaire input power as stated for the efficacy
- Notes: This is the reverse of Lighting Power for a Target Lux. Use the lumen method calculator for a luminaire count and the point calculation for uneven layouts.
- Independent vectors in the test suite: 10
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 29 Industrial Electrical

### Heater Power for Heating a Liquid (`water-heater-kw`)

- Formula: `Q = m × c × ΔT P = Q / (t × η)`
- Inputs: Liquid volume [L]; Temperature rise (K); Heating time [h]; Heater and tank efficiency; Specific heat (kJ/kg·K)
- Outputs: Heat energy needed [kWh]; Heater rating [kW]
- Assumptions: 1 L of water is 1 kg; Losses during heating are lumped in the efficiency
- Notes: Add margin for standing losses on long heat-ups, and check the supply current with the three-phase current calculator.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Fan and Pump Affinity Laws (`fan-pump-affinity`)

- Formula: `Q2/Q1 = N2/N1 H2/H1 = (N2/N1)² P2/P1 = (N2/N1)³`
- Inputs: Original speed [rpm]; New speed [rpm]; Power at original speed [kW]
- Outputs: Flow (% of original); Head or pressure (% of original); Power at new speed [kW]; Power saved (%)
- Assumptions: Same fan or pump, same fluid density; System resistance is friction-dominated with little static head; Efficiency stays the same across the speed range
- Notes: Static head breaks the cube law, so savings on a pump lifting water are smaller. Below about 50% speed, motor and drive losses matter.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 30 Electrical Safety

### Earth Fault Loop Impedance (`fault-loop-impedance`)

- Formula: `Zs = Ze + (R1 + R2) If = U0 / Zs Zs(max) = U0 / Ia`
- Inputs: Nominal voltage to earth [V]; External loop impedance Ze [Ω]; Circuit R1 + R2 [Ω]; Protective device operating current [A]
- Outputs: Loop impedance Zs [Ω]; Earth fault current [A]; Maximum Zs for this device [Ω]; Margin (If / Ia)
- Assumptions: Impedances add arithmetically (conservative); Conductor resistances are at operating temperature; Fault is bolted, with no arc impedance
- Notes: Required disconnection times and the permitted Zs values come from your wiring rules. This only compares the fault current with the device operating current you enter.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 31 Instrumentation

### 4-20 mA Signal Scaling (`current-loop-4-20`)

- Formula: `PV = lo + (I − 4 mA) / 16 mA × (hi − lo)`
- Inputs: Loop current [mA]; Range at 4 mA; Range at 20 mA
- Outputs: Process value; Span (%)
- Assumptions: Linear transmitter; Live-zero 4 mA to 20 mA range
- Notes: A current below about 3.8 mA or above 20.5 mA usually signals a wire break or a transmitter fault (NAMUR NE43).
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### RTD Resistance to Temperature (`rtd-pt100`)

- Formula: `R = R0 (1 + A T + B T²) T = (−A + √(A² − 4B (1 − R/R0))) / 2B A = 3.9083×10⁻³, B = −5.775×10⁻⁷`
- Inputs: Measured resistance [Ω]; Resistance at 0 °C [Ω]
- Outputs: Temperature (°C); Sensitivity at this point (Ω/°C)
- Assumptions: Standard platinum RTD, 0 to 850 °C range; Lead wire resistance already subtracted or a 3 or 4-wire connection
- Notes: Two-wire connections add lead resistance, which reads as a temperature error of about 2.6 °C per ohm for a Pt100. Below 0 °C a third term is needed and this calculator does not cover it.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 32 Testing and Measurement

### Insulation Resistance Temperature Correction (`ir-temp-correction`)

- Formula: `R40 = Rm × 0.5 ^ ((40 − T) / 10)`
- Inputs: Measured insulation resistance [MΩ]; Winding or cable temperature (°C)
- Outputs: Corrected to 40 °C [MΩ]; Correction factor
- Assumptions: Insulation resistance halves for each 10 °C rise; Rule of thumb; use the curve in your test standard where one applies
- Notes: Always record the temperature with the reading. A cold reading flatters the insulation, so correct before comparing with a minimum value.
- Independent vectors in the test suite: 8
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Polarisation Index and Dielectric Absorption Ratio (`insulation-pi-dar`)

- Formula: `DAR = R60 / R30 PI = R600 / R60`
- Inputs: Reading at 30 s [MΩ]; Reading at 1 min [MΩ]; Reading at 10 min [MΩ]
- Outputs: DAR (60 s ÷ 30 s); PI (10 min ÷ 1 min)
- Assumptions: Same test voltage and temperature for all readings; Readings taken after the insulation is fully discharged
- Notes: Commonly quoted guide for PI: below 1 poor, 1 to 2 questionable, 2 to 4 acceptable, above 4 good. A very high resistance can give a low PI that is still healthy. Follow your test standard for pass limits.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 34 Data Center Electrical

### Data Centre PUE (`pue`)

- Formula: `PUE = total facility power / IT power DCiE = 1 / PUE × 100`
- Inputs: Total facility power [kW]; IT equipment power [kW]
- Outputs: PUE; DCiE (IT share of total, %); Overhead (cooling, losses, lighting) [kW]
- Assumptions: Both powers are averaged over the same period; IT power is measured at the PDU or rack outlet
- Notes: A single spot reading can mislead. Use energy over a full year so seasonal cooling load is included.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Rack Heat Load and Airflow (`rack-cooling`)

- Formula: `Heat = P (all power becomes heat) BTU/h = 3.41214 × W ton = 12 000 BTU/h V̇ = P / (ρ × cp × ΔT)`
- Inputs: IT power in the rack [kW]; Air temperature rise across the rack (K)
- Outputs: Heat load (BTU/h); Cooling (US refrigeration tons); Airflow required [m³/h]
- Assumptions: Air density 1.2 kg/m³, specific heat 1005 J/(kg·K); All electrical power ends up as heat in the room; No allowance for bypass or recirculation
- Notes: Real designs add margin for hot-spot mixing. Switch the airflow unit to CFM for US cooling data.
- Independent vectors in the test suite: 8
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 35 Airport and AGL

### AGL Series Circuit Load and CCR Size (`agl-ccr-loading`)

- Formula: `Pt = n × Plamp / ηT + I² × R × L Vout = Pt / I CCR ≥ Pt / max loading`
- Inputs: Fittings on the circuit; Lamp power per fitting [W]; Isolating transformer efficiency; Circuit current [A]; Series cable loop length [m]; Series cable resistance [Ω/km]; Maximum CCR loading
- Outputs: Total circuit load [kW]; CCR output voltage [V]; Cable loss [W]; Smallest standard CCR [kW]; Loading of that CCR (%)
- Assumptions: Resistive series circuit, power factor near unity; Cable resistance given for the full loop length; Standard CCR sizes: 4, 7.5, 10, 15, 20, 25, 30 kW. Manufacturer catalogues also list 1, 2, 5, 50 and 70 kW units and a 20 A class; confirm the sizes and the current edition of FAA AC 150/5345-10 before use
- Notes: Confirm against the CCR manufacturer's output curves, the isolating transformer open-circuit behaviour and the project specification. Lamp failures shift the load, so check at the highest brightness step.
- Independent vectors in the test suite: 39
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### AGL Maximum Fittings on a CCR (`agl-max-fittings`)

- Formula: `Usable = loading × CCR rating Pcable = I² × R × L nmax = ⌊(Usable − Pcable) / (Plamp / ηT)⌋`
- Inputs: CCR rating [kW]; Lamp power per fitting [W]; Isolating transformer efficiency; Circuit current [A]; Series cable loop length [m]; Series cable resistance [Ω/km]; Maximum CCR loading
- Outputs: Maximum fittings; Circuit load at that number [kW]; Cable loss [W]; CCR loading at that number (%); CCR output voltage [V]
- Assumptions: Resistive series circuit, power factor near unity; Cable resistance given for the full loop length; Every fitting has the same lamp power and the same transformer efficiency
- Notes: This is the reverse of the CCR sizing calculator. Confirm against the CCR manufacturer's output curves and the isolating transformer open-circuit behaviour, and keep spare capacity for future fittings. Check at the highest brightness step.
- Independent vectors in the test suite: 25
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### AGL Isolating Transformer Current and Loading (`agl-isolating-transformer`)

- Formula: `Is = Ip × Isr / Ipr Vs = Plamp / Is Pin = Plamp / ηT Vp = Pin / Ip Loading = Plamp / Prated`
- Inputs: Circuit (primary) current [A]; Rated primary current [A]; Rated secondary current [A]; Lamp power at that secondary current [W]; Transformer rating [W]; Transformer efficiency
- Outputs: Secondary lamp current [A]; Lamp voltage [V]; Input power from the series circuit [W]; Primary voltage drop [V]; Transformer loading (%)
- Assumptions: Ideal current ratio: the secondary current follows the primary current in the ratio of the rated currents; Lamp power is the figure at the secondary current, taken as a fixed power; Resistive load, power factor near unity
- Notes: The lamp is not a fixed resistance, so look up its power at the secondary current shown. An open secondary (failed lamp) is not modelled and needs the manufacturer data on open-circuit voltage and core saturation.
- Independent vectors in the test suite: 25
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### AGL CCR Input Power and Annual Energy (`agl-ccr-input-energy`)

- Formula: `Pin = Pout / ηCCR S = Pin / pf Q = S × sin(acos pf) E = Pin × hours Cost = E × tariff`
- Inputs: CCR output load [kW]; CCR efficiency; CCR input power factor; Hours of operation per year; Energy tariff per kWh
- Outputs: CCR input power [kW]; CCR input apparent power [kVA]; CCR input reactive power [kVAR]; Annual energy [kWh]; Annual running cost
- Assumptions: Efficiency and power factor are constant at the load entered; Input power factor is the figure at this load, not at full load; Hours are for the brightness step entered, so cost each step separately and add them
- Notes: Regulator efficiency and input power factor both fall at light load and low brightness steps, so use the data sheet figure for the step you are costing. This is energy for the regulator input only.
- Independent vectors in the test suite: 25
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### AGL Brightness Step Current and Circuit Load (`agl-brightness-steps`)

- Formula: `I = step current Plamp = n × P6.6 × (I / 6.6)^k / ηT Pcable = I² × R × L Pt = Plamp + Pcable Vout = Pt / I`
- Inputs: Circuit type; Brightness step; Fittings on the circuit; Lamp power per fitting at 6.6 A [W]; Isolating transformer efficiency; Series cable loop length [m]; Series cable resistance [Ω/km]; Lamp power exponent
- Outputs: Circuit current at this step [A]; Current as % of 6.6 A; Total circuit load at this step [kW]; CCR output voltage at this step [V]; Cable loss at this step [W]; Load as % of the full-current load
- Assumptions: Step currents are the usual 6.6 A circuit values: 2.8, 3.4, 4.1, 5.2, 6.6 A (5-step) and 4.8, 5.5, 6.6 A (3-step); Lamp power scales as a power of the current, with the exponent you enter; Transformer efficiency is constant at every step; Resistive series circuit, power factor near unity
- Notes: The highest step normally sets the CCR size, so use the CCR sizing calculator at 6.6 A for that. Use this one to see the output voltage and load at the lower steps and to check them against the CCR curves. Confirm the step currents against your project specification.
- Independent vectors in the test suite: 30
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### AGL Lamp Life at a Different Circuit Current (`agl-lamp-life-curve`)

- Formula: `Life = T1 × (I / I1)^(−m) m = ln(T2 / T1) / ln(I1 / I2) Replacements per year = n × H / T3`
- Inputs: First data point: current [A]; First data point: life [h]; Second data point: current [A]; Second data point: life [h]; Current to evaluate [A]; Fittings on the circuit; Hours of operation per year
- Outputs: Life exponent m; Life at the evaluated current [h]; Life relative to the first point; Lamp replacements per year
- Assumptions: Life follows a power law in the circuit current between the points; Rated life is an average, so some lamps fail earlier; Operating hours are all at the evaluated current
- Notes: Two points fix the curve exactly, so the answer is only as good as the readings. Staying between the two points is safer than going beyond them. Use the manufacturer curve where one exists.
- Independent vectors in the test suite: 25
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### AGL Series Cable Loop Resistance and Loss (`agl-cable-loop-loss`)

- Formula: `R = ρ20 × [1 + α (T − 20)] × L / A Vd = I × R Ploss = I² × R`
- Inputs: Circuit current [A]; Series cable loop length [m]; Cable cross-section [mm²]; Conductor material; Conductor temperature (°C)
- Outputs: Loop resistance [Ω]; Per unit length [Ω/km]; Voltage drop in the cable [V]; Cable loss [W]
- Assumptions: Copper 1.7241e-8 Ω·m and aluminium 2.8264e-8 Ω·m at 20 °C, with 0.00393 and 0.00403 per °C; DC resistance of the full loop, no skin or proximity effect; The same current flows through the whole loop
- Notes: Use the result as the cable loss in the CCR sizing and brightness step calculators. Confirm the cable resistance against the manufacturer data for the cable you install.
- Independent vectors in the test suite: 25
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### AGL Series Cable Size for a Loss Limit (`agl-cable-size-loss`)

- Formula: `A ≥ ρ(T) × L × I² / (limit × Plamp) Ploss = I² × ρ(T) × L / A`
- Inputs: Circuit current [A]; Series cable loop length [m]; Lamp load on the circuit [kW]; Allowed cable loss (% of lamp load); Conductor material; Conductor temperature (°C)
- Outputs: Minimum cross-section [mm²]; Standard size [mm²]; Cable loss at that size [W]; Loss as % of lamp load
- Assumptions: Resistivity as in the loop resistance calculator; Standard sizes from the IEC 60228 preferred series, 1.5 to 630 mm²; The loss limit is a project choice, not a value from a standard
- Notes: Check the chosen size against the cable manufacturer data, the maximum voltage the CCR can supply and the insulation rating before ordering.
- Independent vectors in the test suite: 33
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### AGL Circuit Load with Failed Lamps (`agl-lamp-failure-load`)

- Formula: `P0 = n × Plamp / ηT + I² R L Pf = (n − f) × Plamp / ηT + f × Popen + I² R L Vout = Pf / I`
- Inputs: Fittings on the circuit; Failed lamps (open circuit); Lamp power per fitting [W]; Isolating transformer efficiency; Transformer input power with the secondary open [W]; Circuit current [A]; Series cable loop length [m]; Series cable resistance [Ω/km]
- Outputs: Circuit load, all lamps working [kW]; Circuit load with failed lamps [kW]; Change in load [W]; Change as % of the working load; CCR output voltage with failed lamps [V]
- Assumptions: Each failed lamp leaves its transformer drawing a fixed open-secondary power; Resistive series circuit, power factor near unity; Current held at the circuit value by the CCR
- Notes: A real open-secondary transformer is not a fixed power. Its voltage and loss depend on the core design, so treat the result as a first estimate and confirm it with the transformer manufacturer. Several failures in a row can still push the CCR toward its overvoltage or open-circuit protection.
- Independent vectors in the test suite: 30
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### AGL Light Intensity at Distance (Allard's Law) (`agl-light-intensity-distance`)

- Formula: `E = I × T / d² T = exp(−σ d) σ = ln(20) / MOR`
- Inputs: Intensity toward the observer (cd); Distance to the light [m]; Meteorological optical range (MOR) [m]
- Outputs: Illuminance at the eye (lux); Illuminance in clear air (lux); Atmospheric transmissivity over the path (%); Extinction coefficient (per km)
- Assumptions: Point source seen head-on; Uniform atmosphere along the path; MOR is defined at 5% transmissivity (ln 20 = 2.9957)
- Notes: This gives the light level at the eye only. Visual range needs an eye threshold for the background brightness you design for; take that from the method you follow (for example ICAO Doc 9328 for RVR). Not an operational RVR assessment.
- Independent vectors in the test suite: 20
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 36 Converters and Units

### HP to kW and kW to HP (`hp-kw-converter`)

- Formula: `1 HP = 745.6999 W 1 PS = 735.4988 W`
- Inputs: Power [HP]
- Outputs: Kilowatts [kW]; Mechanical horsepower [HP]; Metric horsepower [PS]
- Assumptions: HP is mechanical (550 ft·lbf/s); Electrical HP of 746 W differs by 0.04%
- Notes: Change the input unit to kW and read the other rows.
- Independent vectors in the test suite: 10
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Power Unit Converter (W, kW, MW, HP, PS) (`power-converter`)

- Formula: `1 kW = 1000 W 1 MW = 1000 kW = 1,000,000 W 1 HP = 745.6999 W`
- Inputs: Power [kW]
- Outputs: Watts [W]; Kilowatts [kW]; Megawatts [MW]; Mechanical horsepower [HP]
- Assumptions: Real (active) power only; A pure unit change: no voltage, current or power factor is involved
- Notes: This converts a power in one unit to the same power in another. To get current from power use kW to Amps; to get kVA from kW use kW to kVA, which needs the power factor. HP is mechanical horsepower; see HP to kW for metric horsepower.
- Independent vectors in the test suite: 28
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Energy Unit Converter (`energy-converter`)

- Formula: `1 kWh = 3.6 MJ = 3412.14 BTU = 859.845 kcal`
- Inputs: Energy [kWh]
- Outputs: Megajoules [MJ]; BTU [BTU]; Kilocalories [kcal]
- Assumptions: International table BTU and kilocalorie
- Notes: Change the input unit to convert in the other direction.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 37 Engineering Mathematics

### Complex Numbers (Rectangular and Polar) (`complex-number`)

- Formula: `Magnitude |z| = √(a² + b²) Angle θ = atan2(b, a) a = |z| cos θ b = |z| sin θ (a + jb)(c + jd) = (ac − bd) + j(ad + bc) (a + jb) / (c + jd) = [(ac + bd) + j(bc − ad)] / (c² + d²)`
- Inputs: z₁ real part (a); z₁ imaginary part (b); Operation; z₂ real part (c); z₂ imaginary part (d)
- Outputs: Result magnitude |z|; Result angle (degrees); Result real part; Result imaginary part (coefficient of j); Result angle (radians); z₁ magnitude |z₁|; z₁ angle (degrees)
- Assumptions: Angles are in degrees from −180° to 180°, measured from the positive real axis (atan2, so the quadrant is correct); j is the square root of −1; engineers write j instead of i; The values are plain numbers: enter resistance, reactance, volts or amps in one consistent unit
- Notes: For impedance enter R as the real part and X as the imaginary part (X is positive for an inductor and negative for a capacitor). Multiplying two phasors multiplies the magnitudes and adds the angles; dividing divides the magnitudes and subtracts the angles. For a full AC circuit with a supply voltage use the AC Ohm's law calculator.
- Independent vectors in the test suite: 70
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Phasor Sum and Difference (Polar Inputs) (`phasor-sum`)

- Formula: `Re = Σ sₖ mₖ cos θₖ Im = Σ sₖ mₖ sin θₖ |R| = √(Re² + Im²) θ = atan2(Im, Re) sₖ = +1 for an added phasor, −1 for a subtracted one`
- Inputs: Phasor 1 magnitude; Phasor 1 angle (degrees); Phasor 2 is; Phasor 2 magnitude; Phasor 2 angle (degrees); Phasor 3 is; Phasor 3 magnitude; Phasor 3 angle (degrees)
- Outputs: Resultant magnitude; Resultant angle (degrees); Resultant real part; Resultant imaginary part (coefficient of j); Resultant angle (radians); Sum of the magnitudes (all in phase)
- Assumptions: Angles are in degrees, counter-clockwise from the reference axis; the resultant angle is given from −180° to 180° (atan2); All phasors have the same frequency and the same kind of value (all RMS or all peak); Magnitudes are plain numbers: enter volts, amps or any one quantity in one consistent unit; Phasor 1 is always added; a magnitude of 0 leaves a phasor out
- Notes: Phasors add as vectors, not as plain numbers: 10 ∠0° plus 10 ∠90° is 14.14, not 20. Use this for the sum of branch currents at a node or of voltages around a loop when each is known by magnitude and angle. To work from rectangular values or to multiply or divide, use the complex number calculator; for a voltage, current and impedance relation use AC Ohm's law.
- Independent vectors in the test suite: 36
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Percentage Error (`percentage-error`)

- Formula: `Error = measured − true Absolute error = |measured − true| Relative error = (measured − true) / |true| Percentage error = relative error × 100`
- Inputs: Measured value; True (reference) value
- Outputs: Percentage error (signed, %); Absolute percentage error (%); Error (measured − true); Absolute error; Relative error (fraction)
- Assumptions: Percentage error is taken relative to the true (reference) value, not the measured one; A negative percentage error means the measured value is below the true value; a positive one means it is above; Both values are plain numbers in one consistent unit; the percentage does not depend on the unit; The true value must not be zero
- Notes: Use the absolute percentage error when only the size of the error matters, such as checking a meter against a tolerance. Percentage error is not the same as percentage difference, which compares two values with neither one a reference. For the uncertainty of a measurement chain see the measurement uncertainty guide.
- Independent vectors in the test suite: 32
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Mean, Median and Mode (`mean-median-mode`)

- Formula: `Mean = (x₁ + x₂ + … + xₙ) / n Median = middle value of the sorted readings (average of the two middle values when n is even) Mode = the value that occurs most often Range = largest − smallest`
- Inputs: Reading 1; Reading 2; Reading 3; Reading 4; Reading 5; Reading 6; Reading 7; Reading 8; Reading 9; Reading 10; Reading 11; Reading 12
- Outputs: Mean (average); Median; Mode (smallest, if several); Number of readings; Sum; Smallest reading; Largest reading; Range (largest − smallest)
- Assumptions: Every reading counts equally; the calculator does not weight or discard any value; The readings share one unit, and the results have the same unit; A mode exists only when some value occurs more than once. When several values tie, the smallest is shown and all of them are listed in the warning; Values that differ in the last digit are different values, so 230.1 and 230.10 are the same but 230.1 and 230.11 are not
- Notes: The mean uses every reading, so one bad reading moves it; the median does not. When the two differ a lot, look for an outlier or a drifting reading. For the spread of the readings use the standard deviation calculator, and for how far the mean is from a known true value use the percentage error calculator.
- Independent vectors in the test suite: 26
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Standard Deviation and Variance (`standard-deviation`)

- Formula: `Mean x̄ = Σx / n Population variance σ² = Σ(x − x̄)² / n Sample variance s² = Σ(x − x̄)² / (n − 1) Standard deviation = √variance Standard error = s / √n CV = s / |x̄| × 100`
- Inputs: Reading 1; Reading 2; Reading 3; Reading 4; Reading 5; Reading 6; Reading 7; Reading 8; Reading 9; Reading 10; Reading 11; Reading 12
- Outputs: Sample standard deviation (s, n − 1); Population standard deviation (σ, n); Sample variance (s²); Population variance (σ²); Mean; Number of readings; Standard error of the mean (s / √n); Coefficient of variation (s / |mean|, %)
- Assumptions: Use the sample standard deviation (n − 1) when the readings are a sample of a larger set, which is the usual case for test readings; use the population value only when the readings are the whole set; The deviations are taken from the mean of the readings entered; The sample values need at least two readings; with one reading they are shown as a dash; The coefficient of variation is not defined when the mean is zero; No distribution is assumed: these are descriptive figures, not a confidence interval
- Notes: A small standard deviation means the readings are close together, which is repeatability; it does not mean they are correct, since a consistent offset from the true value gives a small spread and a large error. For the offset use the percentage error calculator. For the mean, median and range see the mean, median and mode calculator.
- Independent vectors in the test suite: 26
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Quadratic Equation Solver (`quadratic-solver`)

- Formula: `x = (−b ± √D) / 2a D = b² − 4ac D > 0: two real roots D = 0: one repeated root D < 0: two complex roots, −b / 2a ± j√(−D) / 2a x₁ + x₂ = −b / a x₁ × x₂ = c / a`
- Inputs: Coefficient a (of x²); Coefficient b (of x); Constant c
- Outputs: Root x₁, real part (with +√D); Root x₁, imaginary part; Root x₂, real part (with −√D); Root x₂, imaginary part; Discriminant D = b² − 4ac; Vertex x (−b / 2a); Vertex y (value at the vertex)
- Assumptions: The coefficients are plain real numbers; x₁ is the root taken with +√D and x₂ with −√D, so for a negative a the larger root is x₂; For real roots the smaller-magnitude root is found from x₁ × x₂ = c / a, which avoids losing digits to cancellation; A negative discriminant gives a complex-conjugate pair; the imaginary parts are shown with their signs; The vertex is the turning point of y = ax² + bx + c
- Notes: Quadratics appear when a circuit or a motor equation is squared away: the resonance and damping of a series RLC circuit, the voltage that gives a stated power through a source resistance, and the cable size that meets a limit when current depends on size. Check a root by substituting it back. For complex numbers use the complex number calculator.
- Independent vectors in the test suite: 25
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Logarithm Calculator (`logarithm`)

- Formula: `log_b x = y means b^y = x log_b x = ln x / ln b log(xy) = log x + log y log(x / y) = log x − log y log(xⁿ) = n log x`
- Inputs: Number x; Base b
- Outputs: log base b of x; Common logarithm log₁₀ x; Natural logarithm ln x; Binary logarithm log₂ x
- Assumptions: x must be greater than zero and the base greater than zero and not equal to 1; The base for the first result is whatever you enter; the other three results are always base 10, base e and base 2; A base of exactly 10 or 2 uses the exact logarithm, so log₁₀ 1000 is 3 and not 2.9999999999999996; Decibels are 10 log₁₀ of a power ratio and 20 log₁₀ of a voltage or current ratio
- Notes: Use the common logarithm for decibels, orders of magnitude and the pH scale, the natural logarithm for exponential growth and decay and time constants, and base 2 for bits and binary steps. To go back from a logarithm to the number use the exponent calculator with the base and the logarithm as the power. For a ratio in decibels see the dB to ratio converter.
- Independent vectors in the test suite: 24
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Exponent and Root Calculator (`powers-roots`)

- Formula: `xⁿ = x × x × … (n times) for a whole n x⁻ⁿ = 1 / xⁿ x^(1/k) = k-th root of x x^(m/k) = (k-th root of x)^m xᵃ × xᵇ = xᵃ⁺ᵇ (xᵃ)ᵇ = xᵃᵇ`
- Inputs: Number x; Exponent n; Root degree k
- Outputs: x to the power n (xⁿ); k-th root of x; x squared; x cubed; Reciprocal 1 / x
- Assumptions: Real numbers only: no complex result is returned; A negative base is allowed only with a whole-number exponent, and zero cannot be raised to a negative power; An odd root of a negative number is negative (the cube root of −8 is −2); an even root of a negative number is rejected; Zero to the power zero is taken as 1; The reciprocal is not defined for x = 0 and is shown as a dash
- Notes: Use this for square-law relations (power is current squared times resistance), for scaling laws such as the cube root in a transformer or fan relation, and for compound growth. The nth root of x is the same as x to the power 1/n. For the inverse of a power use the logarithm calculator: if xⁿ = y then n = log y / log x.
- Independent vectors in the test suite: 31
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Percentage Calculator (`percentage-calculator`)

- Formula: `A% of B = A × B / 100 A as a percentage of B = A / B × 100 Change from A to B = (B − A) / |A| × 100 B increased by A% = B × (1 + A / 100) B decreased by A% = B × (1 − A / 100)`
- Inputs: Number A; Number B
- Outputs: A% of B; A as a percentage of B (A / B × 100); Percentage change from A to B; B increased by A%; B decreased by A%
- Assumptions: All five results are shown at once; read the one that answers your question; Percentage change is relative to the starting value A, so going from 80 to 100 is +25% but going from 100 to 80 is −20%; A percentage change from zero is not defined, and A as a percentage of zero is not defined; each is shown as a dash; Values are plain numbers, so use the same unit for A and B
- Notes: For the error of a reading against a true value use the percentage error calculator, which divides by the reference value and tells you whether the reading is high or low. Percentage points are a different thing: a rise from 10% to 12% is 2 percentage points but a 20% increase. For a share between parts, see the ratio calculator.
- Independent vectors in the test suite: 23
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Ratio Calculator (`ratio-calculator`)

- Formula: `A : B simplified = (A / g) : (B / g), where g is the greatest common divisor Share of A = A / (A + B) × 100 A : B = C : X gives X = B × C / A`
- Inputs: A; B; C (optional)
- Outputs: Simplified ratio, first part; Simplified ratio, second part; A / B (ratio as a decimal); A as a share of A + B (%); B as a share of A + B (%); X in A : B = C : X (X = B × C / A)
- Assumptions: The simplified ratio is found only when A and B are whole numbers; for decimals multiply both by a power of ten first, such as 1.5 : 2.5 becomes 15 : 25; A and B must be greater than zero; The proportion assumes a direct (linear) relation; for an inverse proportion, where one quantity falls as the other rises, use X = A × B / C; Whole numbers above 9,007,199,254,740,991 are not held exactly and are not simplified
- Notes: Use this for a transformer turns ratio, a gear or pulley ratio, a voltage divider split, a scale drawing or a mix. For a transformer the voltage ratio equals the turns ratio. To turn the share into a percentage change or a percentage of a total, use the percentage calculator.
- Independent vectors in the test suite: 24
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Rounding and Significant Figures (`rounding-sig-figs`)

- Formula: `Round to d places: look at the next digit; 5 or more rounds away from zero Significant figures: the first non-zero digit is the first significant figure Rounded up = ceiling, rounded down = floor, truncated = drop the digits Rounding error = |rounded − original|`
- Inputs: Number; Decimal places; Significant figures
- Outputs: Rounded to the nearest (decimal places); Rounded up (toward +∞) to those places; Rounded down (toward −∞) to those places; Truncated (toward zero) to those places; Rounded to significant figures
- Assumptions: Halves round away from zero (2.5 gives 3 and −2.5 gives −3), the usual school and engineering rule, not the round-half-to-even rule some software uses; The number is rounded as written, so 1.005 to two places is 1.01 even though the nearest binary number is slightly below 1.005; Decimal places and significant figures are rounded separately from the original number, not one after the other; Rounded up and rounded down follow the number line, so −2.3 rounded up to a whole number is −2 and rounded down is −3; Rounding to significant figures can give a value with trailing zeros that are not shown, so 1,234.5678 to three figures is 1,230
- Notes: Round only the final answer, not the steps in between, or the rounding errors add up. Quote a result to no more significant figures than the least precise input supports. For the effect of a reading error see the percentage error calculator, and for the spread of repeated readings see the standard deviation calculator.
- Independent vectors in the test suite: 37
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Fraction Calculator (`fraction-calculator`)

- Formula: `a/b + c/d = (ad + cb) / bd a/b − c/d = (ad − cb) / bd a/b × c/d = ac / bd a/b ÷ c/d = ad / bc simplest form = divide top and bottom by their greatest common divisor`
- Inputs: First fraction, numerator; First fraction, denominator; Operation; Second fraction, numerator; Second fraction, denominator
- Outputs: Result, numerator (simplified); Result, denominator (simplified); Mixed number, whole part; Mixed number, remainder numerator; Decimal value; As a percentage (%)
- Assumptions: All four numbers are whole numbers no larger than 1,000,000 in size, so the arithmetic is exact; No denominator may be zero, and when dividing the second fraction may not be zero; The result is reduced to lowest terms with the minus sign on the numerator and a positive denominator; The mixed number is the whole part (toward zero) and a remainder numerator over the same denominator, so −7/2 is −3 and 1/2; The decimal value is rounded for display; the fraction is the exact answer
- Notes: Use fractions for ratios of standard sizes and for exact relations, such as the reciprocal sum behind parallel resistors. For a decimal you want to turn into a fraction, multiply both parts by a power of ten and simplify with the ratio calculator. Convert to a percentage with the figure shown here or with the percentage calculator.
- Independent vectors in the test suite: 39
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Simultaneous Equations Solver (`simultaneous-equations`)

- Formula: `a₁x + b₁y = k₁ and a₂x + b₂y = k₂ give D = a₁b₂ − a₂b₁, x = (k₁b₂ − k₂b₁) / D, y = (a₁k₂ − a₂k₁) / D For three unknowns D is the 3 × 3 determinant and each unknown is Dₓ / D (Cramer's rule) D = 0: no single solution`
- Inputs: Number of unknowns; Equation 1: coefficient of x; Equation 1: coefficient of y; Equation 1: coefficient of z; Equation 1: constant on the right; Equation 2: coefficient of x; Equation 2: coefficient of y; Equation 2: coefficient of z; Equation 2: constant on the right; Equation 3: coefficient of x; Equation 3: coefficient of y; Equation 3: coefficient of z; Equation 3: constant on the right
- Outputs: x; y; z (3 unknowns only); Determinant of the coefficients; Largest check error (left side minus right side)
- Assumptions: The equations are linear: each unknown appears to the first power and is not multiplied by another unknown; The determinant D must not be zero. If it is, the equations either contradict each other or repeat each other, and there is no single solution; The answer is found by elimination with row swapping, which keeps its accuracy when a coefficient is small; the determinant is shown so you can check by Cramer's rule; When D is very small compared with the size of the coefficients the system is close to having no solution and a small change in an input changes the answer a lot; a warning is shown; The check error is the largest amount by which the left side of any equation differs from its constant when the answer is put back in
- Notes: Use this for the loop or node equations of a circuit with two or three unknown currents or voltages, for finding two constants from two measured points, and for balancing equations. Write each equation as a x + b y + c z = k with the unknowns in the same order, and enter a zero for a missing term. Always put the answer back into the original equations.
- Independent vectors in the test suite: 43
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Linear Interpolation Calculator (`linear-interpolation`)

- Formula: `y = y₁ + (x − x₁) × (y₂ − y₁) / (x₂ − x₁) x = x₁ + (y − y₁) × (x₂ − x₁) / (y₂ − y₁) slope m = (y₂ − y₁) / (x₂ − x₁) fraction t = (x − x₁) / (x₂ − x₁)`
- Inputs: First point, x₁; First point, y₁; Second point, x₂; Second point, y₂; x to look up; y to look up (optional)
- Outputs: y at the chosen x; Slope m = (y₂ − y₁) / (x₂ − x₁); Fraction of the way from x₁ to x₂; Value of y at x = 0; x at the chosen y
- Assumptions: Between the two points the quantity is assumed to change in a straight line, which is only an approximation for a curve such as a thermistor or a lamp characteristic; use points close together for a curve; x₂ must differ from x₁, and y₂ must differ from y₁ to find an x from a y; A chosen x or y outside the two points is extrapolation, and is less reliable: the line is assumed to continue; The fraction is 0 at the first point and 1 at the second; below 0 or above 1 means the value is outside the points; The points can be in any order and the line can slope up or down
- Notes: Use this to read a value between two rows of a table, to scale a transducer, such as 4 to 20 mA to 0 to 100 °C, or to estimate a cable or transformer rating between two published sizes. For a curved relation use a point close to each side of the value you want, or the published formula. Check an extrapolated value against the maker's data.
- Independent vectors in the test suite: 29
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Matrix Calculator (2×2 and 3×3) (`matrix-calculator`)

- Formula: `For a 2 × 2 matrix [a b; c d]: det = ad − bc and the inverse is [d −b; −c a] / det For 3 × 3, det is the cofactor expansion along row 1 and the inverse is the adjugate divided by det trace = sum of the diagonal det = 0: no inverse`
- Inputs: Matrix size; Row 1, column 1; Row 1, column 2; Row 1, column 3; Row 2, column 1; Row 2, column 2; Row 2, column 3; Row 3, column 1; Row 3, column 2; Row 3, column 3
- Outputs: Determinant; Trace (sum of the diagonal); Inverse, row 1 column 1; Inverse, row 1 column 2; Inverse, row 1 column 3; Inverse, row 2 column 1; Inverse, row 2 column 2; Inverse, row 2 column 3; Inverse, row 3 column 1; Inverse, row 3 column 2; Inverse, row 3 column 3; Largest error of A × A⁻¹ against the identity
- Assumptions: The matrix is square, 2 × 2 or 3 × 3, with real entries; for a 2 × 2 matrix the third row and column are ignored; The determinant must not be zero. If it is, the rows are dependent and the matrix has no inverse; The inverse is found by elimination with row swapping, which keeps its accuracy when an entry is small, and is checked by multiplying it back against the original; When the determinant is very small compared with the size of the entries the matrix is close to singular, so a small change in an entry changes the inverse a lot; a warning is shown; The inverse entries for a third row and column are a dash for a 2 × 2 matrix
- Notes: Use this to invert the impedance or admittance matrix of a small network, to check a hand-calculated determinant, or to solve mesh equations written in matrix form. To solve A x = k for the unknowns directly, use the simultaneous equations solver. Always check the inverse against the original matrix.
- Independent vectors in the test suite: 36
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Vector Calculator (3D) (`vector-calculator`)

- Formula: `A · B = AₓBₓ + AᵧBᵧ + A_zB_z |A| = √(A · A) A × B = (AᵧB_z − A_zBᵧ, A_zBₓ − AₓB_z, AₓBᵧ − AᵧBₓ) angle θ: cos θ = A · B / (|A| |B|) component of A along B = A · B / |B|`
- Inputs: Vector A, x component; Vector A, y component; Vector A, z component; Vector B, x component; Vector B, y component; Vector B, z component
- Outputs: Length of A, |A|; Length of B, |B|; Dot product A · B; Angle between A and B (degrees); Cross product A × B, x component; Cross product A × B, y component; Cross product A × B, z component; Length of A × B, |A × B|; Component of A along B, (A · B) / |B|
- Assumptions: Both vectors are in a right-handed x, y, z system, and the cross product follows the right-hand rule, so B × A is the negative of A × B; The angle is between 0° and 180°; vectors at 90° have a dot product of zero, and parallel vectors have a cross product of zero; A vector with all components zero has no direction, so the angle and the component along it are not defined and are shown as a dash with a warning; The angle is found from the length of A × B and A · B, which stays accurate for angles close to 0° and 180°; The tool works on plain numbers and does not track units: enter both vectors in the same unit
- Notes: Use this to resolve a force or a field into components, to find the angle between two directions, to find the area of the parallelogram two vectors span (the length of the cross product), or to check a hand calculation with the right-hand rule. For phasors given by magnitude and angle use the phasor sum calculator.
- Independent vectors in the test suite: 32
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Linear Regression (Line of Best Fit) (`linear-regression`)

- Formula: `m = Σ(x − x̄)(y − ȳ) / Σ(x − x̄)² c = ȳ − m x̄ r = Σ(x − x̄)(y − ȳ) / √(Σ(x − x̄)² Σ(y − ȳ)²) r² = r × r standard error = √(Σ(y − m x − c)² / (n − 2))`
- Inputs: Point 1: x; Point 1: y; Point 2: x; Point 2: y; Point 3: x; Point 3: y; Point 4: x; Point 4: y; Point 5: x; Point 5: y; Point 6: x; Point 6: y; Point 7: x; Point 7: y; Point 8: x; Point 8: y; Point 9: x; Point 9: y; Point 10: x; Point 10: y; x to predict y at (optional)
- Outputs: Slope m; Intercept c (y at x = 0); Correlation coefficient r; Coefficient of determination r²; Standard error of the fit (n − 2); Number of points; Mean of x; Mean of y; y at the chosen x
- Assumptions: The relation is assumed to be a straight line, and the line is the one that makes the sum of the squared vertical distances from the points as small as possible; x is treated as exact and y as the measured quantity; At least two points are needed and the x values must not all be the same, because then the slope is not defined; With exactly two points the line passes through both, so r² is 1 and the standard error is not defined; a warning is shown; r² near 1 means the points lie close to the line; it does not prove that the relation is a straight line, so look at the points as well; If the y values are all equal the line is level and r is not defined, and a warning is shown; A chosen x outside the entered points is extrapolation and is less reliable
- Notes: Use this to fit a calibration line to instrument readings, to find the slope and offset of a sensor, to find a resistance from voltage and current pairs (the slope of V against I), or to see whether test readings follow a trend. Check that the points look straight before relying on r². For just two points use the linear interpolation calculator.
- Independent vectors in the test suite: 34
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Pythagorean Theorem (Right Triangle) Calculator (`pythagorean-theorem`)

- Formula: `a² + b² = c² c = √(a² + b²) a = √(c² − b²) b = √(c² − a²) angle A = atan(a / b), angle B = atan(b / a) area = a b / 2 perimeter = a + b + c`
- Inputs: Side a (a leg); Side b (the other leg); Side c (the hypotenuse)
- Outputs: Side a; Side b; Hypotenuse c; Angle A, opposite side a (degrees); Angle B, opposite side b (degrees); Area; Perimeter
- Assumptions: The triangle has one right angle (90°); c is the longest side, opposite it, and a and b are the two legs; Exactly two sides must be entered. The side left blank is found; entering all three, or only one, is rejected; When the hypotenuse is entered it must be longer than the leg entered with it, because the hypotenuse is always the longest side; The tool works on plain numbers and does not track units: enter both sides in the same unit; the area is in that unit squared; The two acute angles add up to 90°
- Notes: Use this to find the diagonal of a rectangular panel or a trench, the length of a sloping cable run from its horizontal and vertical parts, the length of a guy wire, or the missing side of a right-angled impedance or power triangle. To work out the sides of any triangle from its three sides use the triangle calculator.
- Independent vectors in the test suite: 38
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Triangle Calculator (Three Sides) (`triangle-calculator`)

- Formula: `s = (a + b + c) / 2 area = √(s (s − a)(s − b)(s − c)) cos A = (b² + c² − a²) / 2bc A + B + C = 180° inscribed radius = area / s circumscribed radius = abc / (4 area)`
- Inputs: Side a; Side b; Side c
- Outputs: Angle A, opposite side a (degrees); Angle B, opposite side b (degrees); Angle C, opposite side c (degrees); Area (Heron's formula); Perimeter; Inscribed circle radius (area / s); Circumscribed circle radius (abc / 4 area)
- Assumptions: The three sides must satisfy the triangle rule: each side is shorter than the sum of the other two. If the longest side equals the sum of the other two the triangle is flat and is rejected; Angles come from the law of cosines and always add up to 180°; The area is found with Heron's formula in a form that stays accurate for thin triangles; The tool works on plain numbers and does not track units: enter all three sides in the same unit; the area is in that unit squared; A warning is shown when the triangle is right-angled, as the Pythagorean theorem calculator then also applies
- Notes: Use this to find the angles of a triangle you have measured with a tape, the area of a triangular plot or panel, or the angle between two cable runs from the three distances. For a right triangle with only two sides known use the Pythagorean theorem calculator.
- Independent vectors in the test suite: 35
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Circle Calculator (Radius, Diameter, Circumference, Area) (`circle-calculator`)

- Formula: `d = 2r circumference = 2πr = πd area = πr² = πd² / 4 r = circumference / 2π r = √(area / π)`
- Inputs: The value you know; Value
- Outputs: Radius; Diameter; Circumference; Area
- Assumptions: The shape is a perfect circle; Only the one value chosen is used; the others are worked out from it; The tool works on plain numbers and does not track units: area is in the unit of length squared, so a diameter in mm gives an area in mm²; For a stranded conductor the area found here is that of a solid round conductor of the same diameter, which is more than the copper area; π is taken to full double-precision accuracy
- Notes: Use this to find the cross-sectional area of a solid round conductor or a pipe from its diameter, the length of wire around a drum or a coil turn, or the diameter that gives a required area. For wire gauges use the AWG and SWG converters, which also give the diameter and area of standard sizes.
- Independent vectors in the test suite: 32
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Area Calculator (Rectangle, Trapezoid, Ellipse, Sector, Ring, Polygon) (`area-calculator`)

- Formula: `rectangle = l w triangle = b h / 2 trapezoid = (a + b) h / 2 parallelogram = b h ellipse = π a b sector = r² θ / 2 ring = π (R² − r²) regular polygon = n s² / (4 tan(π / n))`
- Inputs: Shape; First dimension; Second dimension; Third dimension
- Outputs: Area; Perimeter (shown where the dimensions fix it)
- Assumptions: Every dimension is in one consistent unit, and the area is in that unit squared: metres give square metres, millimetres give square millimetres; The perimeter is shown for the rectangle, ellipse, sector, ring and regular polygon, where the dimensions fix it. The triangle, trapezoid and parallelogram need their slanted sides, which are not entered, so the perimeter shows a dash; for a triangle with three known sides use the triangle calculator; The ellipse perimeter has no simple closed form; it is found with the arithmetic-geometric mean method and is accurate to many digits. The ring perimeter is both circles added together. The sector perimeter is the two radii plus the arc; Dimensions the chosen shape does not use are ignored and a note says so; The tool works on plain numbers and does not track units
- Notes: Use this to find the floor area of a plant room, the area of a panel, a trench cross-section, a solar array footprint, the area of a tapered duct or cable trench, or the face of a hexagonal nut. For a circle use the circle calculator, and for a triangle from its three sides use the triangle calculator. For volumes and surface areas of solids use the volume and surface area calculator.
- Independent vectors in the test suite: 48
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Volume and Surface Area Calculator (Box, Cylinder, Sphere, Cone, Pipe) (`volume-surface-area`)

- Formula: `box: V = l w h, S = 2 (lw + lh + wh) cylinder: V = π r² h, S = 2π r (r + h) sphere: V = 4π r³ / 3, S = 4π r² cone: V = π r² h / 3, S = π r (r + √(r² + h²)) pipe: V = π (R² − r²) L`
- Inputs: Solid; First dimension; Second dimension; Third dimension
- Outputs: Volume; Total surface area; Curved or side surface area (without the ends)
- Assumptions: Every dimension is in one consistent unit; the volume is in that unit cubed and the surface area in that unit squared. Dimensions in metres give cubic metres, and one cubic metre is 1000 litres; The box side area is the four vertical faces; the cylinder and cone curved areas leave out the flat ends; for a sphere the curved area is the whole surface; The hollow cylinder (pipe) total surface counts the outer and inner curved surfaces and both ring-shaped ends; the volume is the material of the wall, not the bore; Dimensions the chosen solid does not use are ignored and a note says so; The tool works on plain numbers and does not track units; wall thickness is the outer radius minus the inner radius
- Notes: Use this to find the capacity of a cylindrical tank or sump, the volume of concrete in a round foundation or a rectangular pad, the volume of a cable drum or duct section, the material in a pipe wall, or the paint or coating area of a pipe, tank or pole. For a flat shape use the area calculator, and for conductor or pipe cross-sections use the circle calculator.
- Independent vectors in the test suite: 36
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Slope Calculator (Gradient, Grade and Angle from Two Points) (`slope-calculator`)

- Formula: `m = (y₂ − y₁) / (x₂ − x₁) grade = 100 m angle = atan(m) 1 in N: N = run / rise length = √(run² + rise²) y = m x + b, b = y₁ − m x₁`
- Inputs: Point 1, x; Point 1, y; Point 2, x; Point 2, y
- Outputs: Slope m (rise / run); Grade (percent); Angle from the horizontal (degrees); Run per unit rise (the N in 1 in N); Rise (y2 − y1); Run (x2 − x1); Length along the line; y-intercept b (y at x = 0)
- Assumptions: The two points are joined by a straight line and the slope is the same everywhere along it; Slope is rise divided by run. A positive slope rises from point 1 to point 2, a negative slope falls, and the order of the points does not change the slope; Grade is the slope as a percentage, so a grade of 5% rises 5 units for every 100 units of run. "1 in N" is the same gradient written as the run needed for one unit of rise; A vertical line (the two x values equal) has no defined slope, grade, 1-in-N or y-intercept; its angle is 90° and its length is still found. A level line has slope zero and no 1-in-N figure; The tool works on plain numbers and does not track units: enter all four values in the same unit; the slope, grade and angle do not depend on which unit that is; Identical points do not define a line and are rejected
- Notes: Use this to check the fall on a cable trench or drain, the gradient of a conduit or cable-tray run, the pitch of a ramp or access road, or the slope between two surveyed levels. For the straight-line distance between the points use the distance calculator, and for a value between two known points use the linear interpolation calculator.
- Independent vectors in the test suite: 34
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Distance Calculator (Between Two Points, 2D or 3D) (`distance-calculator`)

- Formula: `distance = √((x₂ − x₁)² + (y₂ − y₁)² + (z₂ − z₁)²) horizontal = √(Δx² + Δy²) midpoint = ((x₁ + x₂) / 2, (y₁ + y₂) / 2, (z₁ + z₂) / 2) angle = atan(Δz / horizontal)`
- Inputs: Point 1, x; Point 1, y; Point 1, z (optional); Point 2, x; Point 2, y; Point 2, z (optional)
- Outputs: Distance between the points; Horizontal distance (x and y only); Difference in x; Difference in y; Difference in z; Midpoint x; Midpoint y; Midpoint z; Angle of the line above the horizontal (degrees)
- Assumptions: The distance is the straight line between the two points, not the length of a cable route that goes around obstacles, so a real cable needs an allowance on top; Every coordinate is in one consistent unit and the distance is in that same unit. Negative coordinates are allowed; A blank z is taken as 0, so leaving every z blank gives the 2D distance. If only one point has a z value a note says the blank one was taken as 0; The angle is measured up from the horizontal plane; it is negative when point 2 is lower than point 1, and is not defined when the two points are the same; The tool works on plain numbers and does not track units
- Notes: Use this to find the straight-line distance between two positions on a site plan, the length of a diagonal cable or conduit run in 3D, the span between two poles or towers, or the midpoint of a run for placing a pull box. For the length along a right-angled path use the Pythagorean theorem calculator, and for the slope of the line use the slope calculator.
- Independent vectors in the test suite: 34
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Probability Calculator (Two Events, A and B, and Repeated Trials) (`probability-calculator`)

- Formula: `independent: P(A and B) = P(A) P(B) mutually exclusive: P(A and B) = 0 P(A or B) = P(A) + P(B) − P(A and B) P(neither) = 1 − P(A or B) P(A given B) = P(A and B) / P(B) n trials: P(every time) = P(A)ⁿ, P(at least once) = 1 − (1 − P(A))ⁿ`
- Inputs: Probability of event A; Probability of event B; How A and B are related; Probability of A and B together (overlapping events only); Repeated independent trials of A
- Outputs: P(A and B), both happen; P(A or B), at least one happens; P(neither A nor B); P(A but not B); P(B but not A); P(not A); P(not B); P(A given B); P(B given A); P(A every time in n trials); P(A at least once in n trials)
- Assumptions: Probabilities are numbers from 0 to 1 (multiply by 100 for a percentage); the events are well defined and their probabilities are known or estimated; Independent events do not affect each other, so the chance of both is the product. Two components that fail for unrelated reasons are independent; two that share a power supply are not; Mutually exclusive events cannot both happen, so the chance of either is the sum and the chance of both is zero; this needs P(A) + P(B) not above 1; For overlapping events you enter P(A and B) yourself. It must lie between the larger of 0 and P(A) + P(B) − 1 and the smaller of P(A) and P(B); A conditional probability has no value when the event it is conditioned on has probability zero, and is shown as a dash with a note; The repeated-trials figures assume each trial is independent and has the same probability of A. They do not model wear-out, repair or common-cause failures
- Notes: Use this to estimate the chance that two protective devices both fail, that at least one of several redundant units works, or that a fault event occurs at least once over a number of attempts. For the spread of a set of readings use the standard deviation calculator, and for the average of readings use the mean, median and mode calculator.
- Independent vectors in the test suite: 50
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Permutations and Combinations Calculator (nPr, nCr) (`permutations-combinations`)

- Formula: `n! = n × (n − 1) × … × 1 nPr = n! / (n − r)! nCr = n! / (r! (n − r)!) with repetition: permutations = nʳ, combinations = (n + r − 1)! / (r! (n − 1)!)`
- Inputs: Number of items to choose from (n); Number chosen (r)
- Outputs: n! (n factorial); Permutations nPr, order matters, no repeats; Combinations nCr, order does not matter, no repeats; Permutations with repetition (nʳ); Combinations with repetition, C(n + r − 1, r)
- Assumptions: n and r are whole numbers; n is from 1 to 100 so that every result fits in a number (100! is about 9.3e157); Permutations count different orders as different (ABC and CBA are two); combinations count them as one; Without repetition each item can be used once, so r above n gives 0 permutations and 0 combinations; With repetition an item may be chosen again; r may then be larger than n; Results are counted exactly with whole-number arithmetic and shown to 10 significant figures; the steps show every digit up to 40 digits; 0! is 1, and choosing 0 items can be done in exactly one way
- Notes: Use this to count how many test sequences, switching orders or ways of selecting spare units there are, or how many keypad or breaker-label codes exist. For the chance of an outcome use the probability calculator, and for the chance of exactly k failures in n units use the binomial distribution calculator.
- Independent vectors in the test suite: 32
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Binomial Distribution Calculator (Exactly k, At Most, At Least) (`binomial-distribution`)

- Formula: `P(X = k) = nCk pᵏ (1 − p)ⁿ⁻ᵏ P(X ≤ k) = sum of P(X = j) for j = 0 to k mean = n p variance = n p (1 − p)`
- Inputs: Number of independent trials (n); Probability of success in one trial (p); Number of successes (k)
- Outputs: P(X = k), exactly k; P(X < k), fewer than k; P(X ≤ k), at most k; P(X > k), more than k; P(X ≥ k), at least k; Mean number of successes (n p); Variance (n p (1 − p)); Standard deviation
- Assumptions: Each of the n trials is independent, has only two outcomes, and has the same probability p of success; Units that share a power supply, a cable or a cause of failure are not independent, so the result is optimistic for them; The tail figures are added up term by term, not found as 1 minus the other side, so a very small tail keeps its precision; Terms are calculated from sums of logarithms, accurate to about 12 significant figures for n up to 1000; k must be a whole number from 0 to n; The model has no wear-out, repair or ageing: p is the same for every trial
- Notes: For a k-out-of-n system, count a unit that works as a success: the chance that at least k of n units work is the P(X ≥ k) result. For the number of ways to pick k items use the permutations and combinations calculator, and for two events use the probability calculator.
- Independent vectors in the test suite: 34
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Trigonometry (Sin, Cos, Tan) (`trig-functions`)

- Formula: `sin θ = opposite / hypotenuse cos θ = adjacent / hypotenuse tan θ = sin θ / cos θ csc = 1 / sin sec = 1 / cos cot = cos / sin radians = degrees × π / 180`
- Inputs: Angle; Angle unit
- Outputs: sin θ; cos θ; tan θ; csc θ (1 / sin θ); sec θ (1 / cos θ); cot θ (1 / tan θ); Angle in degrees; Angle in radians; Equivalent angle from 0° to 360°
- Assumptions: The angle is measured counter-clockwise from the positive x axis, so a negative angle turns clockwise; Choose the unit that matches your angle: 30 means 30° in degrees mode and 30 rad in radians mode; An angle within 1e-9° of a multiple of 90° is treated as exactly that multiple, so cos 90° is 0 and not 6e-17; Where a function is not defined (tan and sec at 90° and 270°, cot and csc at 0° and 180°) the result is a dash; Angles beyond ±1,000,000,000° are rejected because the angle itself is no longer held with enough precision
- Notes: Use this for the angle of an impedance or a power factor (cos θ), for resolving a force or a phasor into components, and for a quick check on a rectangular to polar conversion. For a power factor angle from a known power factor, take the inverse cosine on a scientific calculator. To work with complex numbers use the complex number calculator; to add phasors use the phasor sum calculator.
- Independent vectors in the test suite: 50
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

