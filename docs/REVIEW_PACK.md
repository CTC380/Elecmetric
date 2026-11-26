# Elecmetric independent review pack (v1.99.110)

Purpose: give a reviewer everything needed to check each calculator without reading `engine.js`. 246 calculators in 34 divisions.

## How to review one calculator
1. Use the licensed standard edition adopted by the project. Check the exact clauses, tables, annexes and calculation assumptions.
2. Check each assumption and note is true and stated honestly.
3. Work one example by hand and compare it with the calculator.
4. The team-level designation in `tools/team_review_approval.json` is administrative only. Only after a qualified individual has actually approved a calculator should an entry be added to `tools/review_records.json` (format in its `_example`). Never record a review that has not been done.

Team-level reviewer designation: Elecmetric project team (self-designation, not independent) (recorded 12 November 2026).

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

### Resistance, Conductance and Resistivity Calculator (Solve Resistance, Resistivity, Length or Cross-Section, with Conductivity, % IACS and Temperature) (`resistivity-conductance`)

- Formula: `R = ρT × L / A G = 1 / R = σ A / L σ = 1 / ρ ρT = ρ20 × (1 + α (T − 20)) round wire: A = π d² / 4 % IACS = 1.7241e-8 / ρ20 × 100`
- Inputs: Solve for; Conductor material; Custom resistivity at 20 °C (used when material is Custom) [Ω·m]; Custom temperature coefficient (per °C); Conductor temperature (°C); Cross-section given as; Length of the conductor (used unless solving for length) [m]; Cross-section area (used with Area, unless solving for it) [mm²]; Conductor diameter (used with Diameter, unless solving for the cross-section) [mm]; Resistance (used when solving for resistivity, length or cross-section) [Ω]
- Outputs: Resistance at the conductor temperature [Ω]; Conductance (S, reciprocal of the resistance); Resistance of the same conductor at 20 °C [Ω]; Resistance per unit length at the conductor temperature [Ω/km]; Resistivity at the conductor temperature [Ω·m]; Resistivity at 20 °C [Ω·m]; Resistivity at 20 °C (Ω·mm²/m); Conductivity at the conductor temperature (MS/m); Conductivity at 20 °C as a percentage of annealed copper (% IACS); Length [m]; Cross-section area [mm²]; Diameter of the round conductor of that area [mm]
- Assumptions: A uniform conductor of one material with the current spread evenly over the section: the DC resistance, with no skin or proximity effect and no stranding or contact allowance; The resistivity at 20 °C of the presets (Ω·m): copper 1.7241e-8 (the IACS value of annealed copper), aluminium 2.8264e-8, silver 1.59e-8, gold 2.44e-8, nickel 6.99e-8, nichrome 1.10e-6; the temperature coefficients (per °C) are 0.00393, 0.00403, 0.0038, 0.0034, 0.006 and 0.0004. These are the same figures the other conductor calculators here use; The resistivity changes linearly with temperature, ρT = ρ20 (1 + α (T − 20)), which is a good fit for the metals near room temperature and is warned about more than 100 °C from 20 °C; In the resistivity solve the measured resistance is taken as the value at the conductor temperature, and the result is referred back to 20 °C with the coefficient of the material chosen (for a material you have not listed, choose Custom and enter its coefficient). The "nearest listed material" comparison uses the 20 °C value and the six presets only; A custom resistivity is taken as the value at 20 °C; a custom coefficient of 0 means no change with temperature; Conductivity σ = 1 / ρ is in siemens per metre (shown in MS/m); 100% IACS is the conductivity of annealed copper at 20 °C, 1 / 1.7241e-8 = 58.0 MS/m
- Notes: Resistivity is a property of the material and resistance is a property of one piece of it: the same copper gives a resistance in proportion to its length and in inverse proportion to its section. Stranded cable, which is longer in the wire than in the cable and so has a little more resistance than the solid value, and cable-data-sheet resistance should be used where a cable is being sized. For AC the resistance rises with the skin and proximity effects, which this calculator does not model. Use this to see how resistance, resistivity, conductance and conductivity relate, to check a resistance from a conductor's size, to find the resistivity of a sample from a four-wire or bridge measurement of its length and section, to size a heating or sensing element or a bus conductor for a target resistance, or to convert between resistivity in Ω·m and Ω·mm²/m and conductivity in MS/m or % IACS. For a cable at its operating temperature see the Conductor Resistance vs Temperature calculator, for the volts lost along it the DC Voltage Drop calculator, and for the copper against aluminium comparison the Copper vs Aluminium Conductor calculator.
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

### Second-Order Response Calculator (Damping Ratio, Overshoot, Rise and Settling Time) (`second-order-response`)

- Formula: `Standard form G(s) = K ωn² / (s² + 2 ζ ωn s + ωn²) denominator s² + a1 s + a0: ωn = √a0, ζ = a1 / (2 √a0), K = b0 / a0\nUnderdamped (ζ < 1): poles −ζ ωn ± j ωd, ωd = ωn √(1 − ζ²), overshoot = 100 exp (−π ζ / √(1 − ζ²)) %, peak time = π / ωd\nFrom the overshoot: ζ = −ln (OS / 100) / √(π² + ln² (OS / 100)), ωd = π / peak time, ωn = ωd / √(1 − ζ²)\nStep response: y = K [1 − e^(−ζ ωn t) (cos ωd t + (ζ ωn / ωd) sin ωd t)]; critically damped y = K [1 − (1 + ωn t) e^(−ωn t)]; overdamped from the two real poles\nRise time and settling time are found exactly from y(t); the textbook 2% settling time is 4 / (ζ ωn)`
- Inputs: What is known; Damping ratio ζ (first choice); Natural frequency ωn in rad/s (first choice); DC gain K (first choice); Percent overshoot (second choice); Peak time (second choice) [s]; Denominator coefficient a1 of s (third choice); Denominator constant a0 (third choice); Numerator b0 (third choice)
- Outputs: Damping ratio ζ; Natural frequency ωn (rad/s); DC gain K; Pole real part (rad/s): −ζ ωn when underdamped, the slower pole when overdamped; Second real pole (rad/s), critically damped and overdamped only; Damped frequency ωd = ωn √(1 − ζ²) (rad/s), underdamped only; Percent overshoot, underdamped only; Peak time π / ωd, underdamped only [s]; Rise time, 10% to 90% of the final value [s]; Settling time to within 2% of the final value [s]; Settling time to within 5% of the final value [s]; Textbook approximation 4 / (ζ ωn) for the 2% settling time, underdamped only [s]; Final value of the output for a unit step; Peak value of the output, underdamped only
- Assumptions: A linear second-order system with no zeros and no delay, started from rest and driven by a unit step; the output is the response y(t) and K is its final value; The rise, peak and settling times are found by solving the exact step response (not the usual approximations), and the textbook 4 / (ζ ωn) is given beside the exact 2% settling time for underdamped systems only: it is the envelope time and is close for ζ below about 0.7 but not for a heavily damped system; Settling time is the last time the response is outside the band of 2% or 5% of the final value around it; an undamped system (ζ = 0) never settles and is not accepted; Higher-order systems, a zero in the numerator (which adds overshoot), time delay, saturation and a changing input are not covered; a closed loop of higher order can often be approximated by its dominant pair of poles, which this gives; Percent overshoot, peak time and the peak value apply to an underdamped system; a critically damped or overdamped response has no overshoot and no peak, and those outputs show a dash
- Notes: Use this to relate the damping ratio and natural frequency of a control loop, a filter or an RLC circuit to what is seen on a step test, or to find the ζ and ωn that meet an overshoot and peak-time specification. For the response of a specific series or parallel RLC circuit from R, L and C, use the RLC circuit calculator.
- Independent vectors in the test suite: 51
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Routh-Hurwitz Stability Calculator (Routh Array, Roots in the Right Half Plane) (`routh-hurwitz`)

- Formula: `Row 1: a_n, a_(n−2), a_(n−4), ... Row 2: a_(n−1), a_(n−3), a_(n−5), ...\nEach later row: b = (first of the row above × next entry of the row two above − first of the row two above × next entry of the row above) / first of the row above\nRight-half-plane roots = sign changes in the first column; stable only if there are none and no root is on the imaginary axis\nZero row: auxiliary polynomial A(s) from the row above; the zero row is replaced by the coefficients of dA/ds; roots on the imaginary axis = degree of A − 2 × (sign changes from the auxiliary row down)\nZero first entry (rest of the row not zero): the zero is replaced by a small positive ε and the signs are read as ε → 0+`
- Inputs: Degree of the polynomial n; Coefficient a6 of s⁶ (used for degree 6); Coefficient a5 of s⁵ (degree 5 and 6); Coefficient a4 of s⁴ (degree 4 to 6); Coefficient a3 of s³ (degree 3 to 6); Coefficient a2 of s²; Coefficient a1 of s; Constant term a0
- Outputs: Roots in the right half plane (sign changes in the first column); Roots on the imaginary axis; Roots in the left half plane; Stability: 1 stable, 0 marginally stable, −1 unstable; Degree of the auxiliary polynomial (zero row only); First column, row 1 (s^n); First column, row 2; First column, row 3; First column, row 4; First column, row 5; First column, row 6; First column, row 7; First column, row 8 (degree 6 with a zero row only)
- Assumptions: A linear time-invariant system with a polynomial characteristic equation with real coefficients. The roots of the characteristic equation are the poles of the closed loop; the system is stable only if all of them are in the left half plane; The array is built in exact arithmetic (coefficients are read as decimal fractions), so a zero in the table is a true zero and not a rounding result; the counts are those of the polynomial entered; A zero in the first column with the rest of its row not zero is replaced by ε, a small positive number (the exact value 10^-80 is used in exact arithmetic, so the signs are those of ε → 0+); the rows from that one on depend on ε, so their first-column values are not shown and only their signs are used; A zero row is handled by the auxiliary polynomial; its roots on the imaginary axis are counted, and a second zero row (repeated roots on the imaginary axis) is outside what this tool counts and is flagged, but a system with repeated imaginary roots is unstable; The criterion gives the number of unstable roots, not their values, and it needs the characteristic equation: this tool does not form it from a block diagram, and it does not find a gain range
- Notes: Use this to check whether a loop is stable, to see how many poles are in the right half plane, or to test the characteristic equation of a design before simulating it. First check that every coefficient has the same sign and none is zero: if not, the system cannot be stable, whatever the table shows. For the time response of a stable second-order system, use the second-order response calculator.
- Independent vectors in the test suite: 51
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Fourier Series Calculator (Harmonics, DC, RMS and THD of Square, Triangle, Sawtooth, Rectified and Pulse Waves) (`fourier-series`)

- Formula: `f(t) = a0 + Σ [ a_n cos(2π n f t) + b_n sin(2π n f t) ], c_n = √(a_n² + b_n²)\nSquare: b_n = 4A / (n π) for odd n; a0 = 0; RMS = A\nTriangle: b_n = (8A / (n² π²)) (−1)^((n−1)/2) for odd n; RMS = A / √3\nSawtooth: b_n = (2A / (n π)) (−1)^(n+1); RMS = A / √3\nHalf-wave rectified sine: a0 = A / π, b_1 = A / 2, a_n = −2A / (π (n² − 1)) for even n; RMS = A / 2\nFull-wave rectified sine (period of the output): a0 = 2A / π, a_n = −4A / (π (4 n² − 1)); RMS = A / √2\nPulse train (duty D, centred): a0 = A D, a_n = 2A sin(n π D) / (n π); RMS = A √D\nAC RMS = √(RMS² − a0²); THD = √(RMS² − a0² − c1² / 2) / (c1 / √2) × 100; AC power share of N harmonics = Σ c_k² / 2 / (RMS² − a0²)`
- Inputs: Waveform; Peak amplitude A; Frequency f (Hz); Duty cycle D of the pulse train (%); Harmonic number n to inspect (1 = fundamental); Number of harmonics N in the partial sum; Time t for the partial sum (ms)
- Outputs: DC (average) value a0; RMS value; AC RMS value (without the DC term); Fundamental amplitude c1; Cosine coefficient a_n of the chosen harmonic; Sine coefficient b_n of the chosen harmonic; Amplitude c_n of the chosen harmonic; Chosen harmonic as % of the fundamental; Total harmonic distortion, all harmonics (%); AC power carried by harmonics 1 to N (%); Partial sum of the first N harmonics at time t; Exact waveform value at time t; Partial sum minus exact value
- Assumptions: The waveform is ideal, periodic and exactly the shape named, with no rise time, droop or noise; The time origin is the one stated for each waveform (the square, triangle and sawtooth start at 0 and rise; the pulse is centred on t = 0; the half-wave rectified sine starts at its zero crossing); THD is taken over all harmonics, from the exact RMS, and is relative to the fundamental; the DC term is not counted as distortion; At a jump of the waveform the exact value is shown as the midpoint of the jump, and a partial sum overshoots near a jump by about 9% of the jump however many harmonics are added (the Gibbs phenomenon)
- Notes: Use this to see which harmonics a waveform contains and how fast they fall: a square wave has only odd harmonics falling as 1/n, a triangle wave only odd harmonics falling as 1/n², and a sawtooth has all harmonics falling as 1/n. It is useful for filter design, for the harmonic currents of rectifiers, and for checking a measurement. A real waveform has different harmonics; for a measured waveform use a spectrum analysis. For the voltage and current of a series RLC load, use the RLC calculator for each harmonic.
- Independent vectors in the test suite: 58
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### AC/DC Equivalent Value Converter (Peak, RMS and Mean Value of a Waveform) (`ac-dc-equivalent`)

- Formula: `Vrms = kr × Vpeak Vavg = ka × Vpeak form factor = Vrms / Vavg crest factor = Vpeak / Vrms P = Vrms² / R meter = (π / (2√2)) × Vavg [sine: kr 1/√2, ka 2/π; square: 1, 1; triangle: 1/√3, 1/2; full-wave rectified sine: 1/√2, 2/π; half-wave rectified sine: 1/2, 1/π]`
- Inputs: Waveform; Value you know; Voltage (or current) value [V]; Load resistance [Ω]
- Outputs: Peak value [V]; RMS value (the equivalent DC value) [V]; Average value (mean of the absolute value) [V]; Form factor (RMS / average); Crest factor (peak / RMS); RMS load current, Vrms / R [A]; Power in the load, Vrms² / R [W]; Power if the peak were taken as DC, Vp² / R [W]; That power divided by the true power (= crest factor squared); Reading of an average-responding meter set for sine waves [V]; Error of that meter against the true RMS (%)
- Assumptions: The waveform is ideal, with no distortion and no other DC offset: a symmetrical sine, square or triangle has zero mean, so the average here is the mean of the absolute value (the rectified average); a rectified waveform has that same value as its DC component; The RMS value is the DC value that gives the same average heat in a resistor, which is why it is called the equivalent value; it holds for a purely resistive load and for the heating effect only; The load is a resistor, so the current has the same shape as the voltage; with a reactive load the current waveform changes and the power also depends on the phase; A rectified waveform carries a DC component equal to its average, and its RMS value includes the AC ripple on top: the DC average alone understates the heat; The meter line models an average-responding meter that is scaled to read the RMS value of a sine wave (reading = 1.1107 × average); a true-RMS meter reads the RMS value of any shape, within its crest-factor limit
- Notes: Use this to see why 230 V AC is not the same as 325 V DC: a sine wave of 325 V peak heats a resistor like 230 V of DC, and only half as much as a 325 V DC supply would. Choose the waveform, enter the value you know and the load resistance, and read the other values and the power. The factors are exact for ideal waveforms; for a distorted or phase-controlled waveform use a true-RMS meter or compute the RMS from the samples.
- Independent vectors in the test suite: 46
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### RLC Circuit Calculator (Step Response, Damping, Overshoot and Settling Time) (`rlc-transient`)

- Formula: `Series: α = R / (2L). Parallel: α = 1 / (2RC). Both: ω₀ = 1/√(LC), ζ = α/ω₀, Q = 1/(2ζ) Output y obeys y″ + 2α y′ + ω₀² y = ω₀² A, starting from rest ζ < 1: y = A [1 − e^(−αt) (cos ω_d t + (α/ω_d) sin ω_d t)], ω_d = √(ω₀² − α²), overshoot = 100 e^(−πζ/√(1−ζ²)) ζ = 1: y = A [1 − (1 + αt) e^(−αt)] ζ > 1: y = A [1 − (s₂ e^(s₁t) − s₁ e^(s₂t)) / (s₂ − s₁)], s = −α ± √(α² − ω₀²) Critical R: series 2√(L/C), parallel ½√(L/C)`
- Inputs: Circuit; Resistance R [Ω]; Inductance L [mH]; Capacitance C [µF]; Step size (V for series, A for parallel); Time at which to read the output [ms]
- Outputs: Damping coefficient α (1/s); Natural angular frequency ω₀ = 1/√(LC) (rad/s); Damping ratio ζ = α / ω₀; Quality factor Q = 1 / (2ζ); Natural frequency f₀ [Hz]; Damped ringing frequency (underdamped only, else 0) [Hz]; Resistance that gives critical damping [Ω]; Overshoot above the final value (underdamped only, else 0) (%); Settling time to 2% (about 4 / slowest decay rate) [ms]; Output at the chosen time
- Assumptions: Ideal L and C (no series resistance in the coil, no leakage in the capacitor); all losses are in R; A single step from rest: the capacitor starts uncharged and the inductor carries no current; The series case reads the capacitor voltage and the parallel case the inductor current; other outputs (the resistor voltage, the other element) are not given; Settling time is the standard approximation 4 divided by the slowest decay rate (α for under and critical damping, the slower pole for overdamping), to the 2% band; A real inductor has winding resistance and a real capacitor has ESR, which add to R and change the damping; a switch, a source impedance or a non-linear load needs a circuit simulator
- Notes: Use this to see whether a circuit rings, how much it overshoots and how long it takes to settle after a switch is closed, for example a capacitor charged through a cable inductance, a snubber, a filter or an LC tank. Compare R with the critical resistance: below it a series circuit rings and overshoots, above it the response is slow and does not overshoot. An overshoot of 35% on a capacitor means it briefly sees 1.35 times the supply, so check the voltage rating.
- Independent vectors in the test suite: 50
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### RC and RL Time Constant Calculator (Charging, Discharging and Step Response) (`rc-rl-transient`)

- Formula: `RC: τ = R × C RL: τ = L / R Fraction of the change done after time t: f = 1 − e^(−t/τ)\nOutput y(t) = y₀ + (y_final − y₀) × f RC charging: y₀ = 0, y_final = V RC discharging: y₀ = V, y_final = 0 RL step: y₀ = 0, y_final = V / R RL decay: y₀ = I₀, y_final = 0\nTime to reach a share p of the change: t = −τ ln(1 − p/100) Half-time = τ ln 2 10 to 90% time = τ ln 9 99% time = τ ln 100\nCompanion: RC current = (V − v_C)/R when charging, v_C/R when discharging; RL inductor voltage = V − R i for the step, R i for the decay Energy: ½ C v_C² or ½ L i²`
- Inputs: Circuit and event; Resistance R [kΩ]; Capacitance C (RC cases) [µF]; Inductance L (RL cases) [H]; Source voltage, or starting capacitor voltage [V]; Starting inductor current (RL decay case) [A]; Time at which to read the output [ms]; Level to find the time for, as a percentage of the total change
- Outputs: Time constant τ (RC or L/R) [ms]; Corner frequency 1 / (2πτ) [Hz]; Starting value of the output (V for RC, A for RL); Final value of the output (V for RC, A for RL); Output at the chosen time (V for RC, A for RL); Share of the change completed at that time (%); Companion at that time: resistor current (A) for RC, inductor voltage (V) for RL, magnitude; Energy stored at that time (½CV² or ½LI²) [mJ]; Time to complete the chosen percentage of the change [ms]; Half-time (50% of the change, 0.693 τ) [ms]; 10 to 90% rise or fall time (2.197 τ) [ms]; Time to complete 99% of the change (4.605 τ) [ms]
- Assumptions: Ideal resistor and an ideal capacitor or inductor; all loss is in R. A real inductor has winding resistance, which belongs in R, and a real capacitor has leakage and ESR; One time constant: a single resistor with a single capacitor or inductor, a constant source and a switch that operates at t = 0. A network with several storage elements needs the second-order or a circuit simulator; RC charging starts from an uncharged capacitor and the RL step starts from zero current; the discharge and decay cases start from the value you enter; The RL decay case assumes the current is carried by R after the switch operates (a freewheel path). It does not model an inductor being opened with no path, where the voltage is set by arcing or a snubber, not by R; The corner frequency 1 / (2πτ) is the cutoff of the equivalent first-order low-pass or high-pass filter; it is a property of τ and is given for convenience; The companion value is the magnitude: the resistor current in the RC cases, the inductor voltage in the RL cases
- Notes: Use this to see how fast a capacitor charges or discharges, how long an inductor takes to build up or lose its current, or how long a first-order filter needs to settle. After one time constant the change is 63.2% complete; after five, more than 99%. A slow RC discharge is a safety point for capacitor banks and supplies: the time to fall to a safe voltage is τ ln(V/Vsafe). For an inductor, the voltage across R at the instant of switching off is I₀ × R, which can be far above the supply voltage, so a diode or snubber is used across a relay coil or a motor field.
- Independent vectors in the test suite: 40
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Wavelength Calculator (Frequency to Wavelength, Velocity Factor, Wave Impedance and Electrical Length) (`wavelength`)

- Formula: `c = 299 792 458 m/s n = √(εr μr) = 1 / VF v = c / n λ = v / f λ0 = c / f = n λ f = v / λ\nT = 1 / f k = 2π / λ half-wave = λ / 2 quarter-wave = λ / 4\nWave impedance η = η0 √(μr / εr) η0 = μ0 c = 376.730 Ω\nElectrical length = 360° × length / λ`
- Inputs: What to calculate; How the medium is given; Frequency (mode 1) [MHz]; Wavelength in the medium (mode 2) [m]; Relative permittivity εr (medium: permittivity and permeability); Relative permeability μr (medium: permittivity and permeability); Velocity factor (medium: velocity factor); Physical length to express in wavelengths (0 to skip) [m]
- Outputs: Frequency [MHz]; Wavelength in the medium [m]; Wavelength in free space at this frequency [m]; Speed of the wave in the medium [m/s]; Velocity factor (speed as a fraction of the speed of light); Refractive index n (speed of light over speed in the medium); Period [µs]; Wave number k = 2π / wavelength (rad/m); Half-wave length (λ / 2) [m]; Quarter-wave length (λ / 4) [m]; Wave impedance of the medium [Ω]; Physical length as a fraction of the wavelength; Electrical length (degrees)
- Assumptions: A plane wave in a lossless, non-dispersive medium: the speed is c / √(εr μr) at every frequency, with εr and μr entered as constants for the frequency you work at; The wavelength is that of the wave inside the medium; the free-space wavelength is c / f at the same frequency; The velocity factor of a line already holds its dielectric and its geometry, so the wave impedance is not given for that way of entering the medium (it needs μr and εr of a plane wave, not the characteristic impedance of the line); The speed of light is the exact value 299 792 458 m/s and the impedance of free space uses μ0 = 1.25663706212e-6 H/m (CODATA 2018), so η0 = 376.7303 Ω
- Notes: Use this to size an antenna element or a stub, to see how long a cable is in wavelengths, or to find the frequency at which a given length is a quarter or a half wave. A length longer than about a tenth of a wavelength should be treated as a transmission line: voltage and current then change along it, and a lumped-circuit calculation becomes inaccurate. In a cable or on a printed board the wavelength is shorter than in air by the velocity factor, so a real antenna or a stub cut from the free-space value will be the wrong length. A real antenna element is also shortened from λ / 2 by its end effect (a typical dipole is about 5% shorter) and the permittivity and loss of a real material both change with frequency and temperature; this calculator does not model any of that.
- Independent vectors in the test suite: 38
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### PID Tuning Calculator (Ziegler-Nichols, Cohen-Coon, Lambda and Tyreus-Luyben Settings for P, PI and PID Controllers) (`pid-tuning`)

- Formula: `Reaction curve (K, τ, θ): Z-N P: Kc = τ / (K θ); PI: Kc = 0.9 τ / (K θ), Ti = θ / 0.3; PID: Kc = 1.2 τ / (K θ), Ti = 2 θ, Td = 0.5 θ\nCohen-Coon (r = θ / τ): P: Kc = (τ / (K θ)) (1 + r / 3); PI: Kc = (τ / (K θ)) (0.9 + r / 12), Ti = θ (30 + 3 r) / (9 + 20 r); PID: Kc = (τ / (K θ)) (4/3 + r / 4), Ti = θ (32 + 6 r) / (13 + 8 r), Td = 4 θ / (11 + 2 r)\nLambda: PI: Kc = τ / (K (λ + θ)), Ti = τ; PID: Kc = (τ + θ/2) / (K (λ + θ/2)), Ti = τ + θ/2, Td = τ θ / (2 τ + θ)\nUltimate (Ku, Pu): Z-N P: Kc = 0.5 Ku; PI: Kc = 0.45 Ku, Ti = Pu / 1.2; PID: Kc = 0.6 Ku, Ti = Pu / 2, Td = Pu / 8; Tyreus-Luyben PI: Kc = Ku / 3.2, Ti = 2.2 Pu; PID: Kc = Ku / 2.2, Ti = 2.2 Pu, Td = Pu / 6.3\nParallel form: Ki = Kc / Ti, Kd = Kc × Td; proportional band = 100 / Kc`
- Inputs: Tuning method; Controller; Process gain K (methods 1 to 3); Process time constant τ (methods 1 to 3) [s]; Dead time θ (methods 1 to 3) [s]; Lambda λ, desired closed-loop time constant (method 3) [s]; Ultimate gain Ku (methods 4 and 5); Ultimate period Pu (methods 4 and 5) [s]
- Outputs: Controller gain Kc; Integral time Ti [s]; Derivative time Td [s]; Parallel-form integral gain Ki = Kc / Ti (per second); Parallel-form derivative gain Kd = Kc × Td (seconds); Proportional band 100 / Kc (%); Dead-time ratio θ / τ
- Assumptions: The settings are for the ideal (non-interacting) PID form, u = Kc (e + ∫e dt / Ti + Td de/dt), with the same units on the process gain K and the controller output; Methods 1 to 3 assume the process is a first-order lag plus dead time with constant K, τ and θ; a real process is only approximated by it, and the quality of the fit decides how good the settings are; The Ziegler-Nichols and Cohen-Coon rules are tuned for a quarter-amplitude decay after a load disturbance, which is lively: expect large overshoot on a set-point change; Cohen-Coon was fitted for θ / τ from about 0.1 to 1; the Ziegler-Nichols reaction-curve rules for about 0.1 to 1 as well; Lambda tuning uses Ti = τ with a PI, and the Padé form with a half dead time for the PID; it has no proportional-only form; Tyreus-Luyben has no proportional-only form; it gives a larger Ti and a smaller gain than Ziegler-Nichols, which is less oscillatory; The derivative term is ideal: filtering of the derivative, set-point weighting, output limits and anti-windup are not part of the result
- Notes: These are starting values to be refined on the plant, not final settings. Reaction-curve and ultimate-gain rules are old empirical recipes that give an aggressive loop; reduce Kc by a third to a half and lengthen Ti if the response overshoots too much. When the dead time is long compared with the time constant (θ / τ above 1), lag-dominant rules ask for a very high gain and PID is a poor choice; consider a smaller gain, a Smith predictor or a slower lambda. The ultimate-gain test drives a real process to its stability limit, which is not always safe; do it only where an oscillation of that size can be tolerated. Check the result in a simulation or on a safe operating point before putting the loop in automatic.
- Independent vectors in the test suite: 66
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Bode Plot Calculator (Magnitude and Phase, Gain and Phase Crossover, Gain Margin and Phase Margin) (`bode-plot`)

- Formula: `G(jω) = K e^(−jωθ) Π(1 + jω/zᵢ) / ((jω)ⁿ Π(1 + jω/pⱼ))\n|G| in dB = 20 log10 K − 20 n log10 ω + Σ 10 log10(1 + (ω/zᵢ)²) − Σ 10 log10(1 + (ω/pⱼ)²)\nPhase = Σ atan(ω/zᵢ) − 90° n − Σ atan(ω/pⱼ) − ω θ (180/π)\nStraight-line magnitude: 20 log10 K − 20 n log10 ω + Σ (ω > zᵢ) 20 log10(ω/zᵢ) − Σ (ω > pⱼ) 20 log10(ω/pⱼ)\nGain crossover ωgc: |G| = 1; phase margin PM = 180° + phase(ωgc). Phase crossover ωpc: phase = −180°; gain margin GM = −20 log10 |G(ωpc)|`
- Inputs: Gain K (DC gain, or the constant in front of the integrators); Integrators n (poles at the origin); Zero corner frequency z1 (rad/s, 0 = none); Zero corner frequency z2 (rad/s, 0 = none); Pole corner frequency p1 (rad/s, 0 = none); Pole corner frequency p2 (rad/s, 0 = none); Pole corner frequency p3 (rad/s, 0 = none); Dead time θ [s]; Frequency to evaluate ω (rad/s)
- Outputs: Magnitude |G(jω)|; Magnitude (dB); Phase (degrees); Straight-line (asymptotic) magnitude (dB); Exact minus straight-line magnitude (dB); Slope of the straight-line magnitude at ω (dB per decade); Gain crossover frequency (rad/s); Phase margin (degrees); Phase crossover frequency (rad/s); Gain margin (dB)
- Assumptions: The transfer function is open loop, a constant times real first-order factors, integrators and an ideal dead time; complex pole or zero pairs (resonances) are not included; The phase is the sum of the factor phases (it is not wrapped to ±180°), so a phase below −180° is shown as such; Crossovers are the first frequencies that cut 0 dB and −180°, found by a scan from 10⁻⁶ to 10⁶ rad/s and then refinement; a loop that crosses more than once is judged on the first crossing only; The Bode stability rule (a positive phase margin and gain margin mean a stable closed loop) holds for an open loop that is itself stable and has no right-half-plane zeros; an unstable open loop needs the Nyquist criterion; Phase margin and gain margin measure the distance to instability for the model entered; they do not include model error or sampling delay
- Notes: Corner frequencies must be in rad/s, not Hz: a pole at 10 Hz is at about 62.83 rad/s. The straight-line plot is least accurate at the corners, where the exact curve is 3 dB away for a single pole or zero. A dead time makes the phase fall without limit, so a loop with enough delay will always meet −180° at some frequency. As a rule of thumb, aim for a phase margin of 45° or more and a gain margin of 6 dB or more; the lower the margins, the more the closed loop rings. Check the final design against a measured frequency response.
- Independent vectors in the test suite: 60
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Inductance Calculator (Self and Mutual Inductance, Coupling Coefficient, Series and Parallel Coupled Coils) (`coupled-inductance`)

- Formula: `M = k √(L1 L2) k = M / √(L1 L2) ≤ 1 La = L1 + L2 + 2M Lo = L1 + L2 − 2M M = (La − Lo) / 4 Lp(aiding) = (L1 L2 − M²) / (L1 + L2 − 2M) Lp(opposing) = (L1 L2 − M²) / (L1 + L2 + 2M) L = N² / ℜ ℜ = lc / (μ₀ μr Ac) W = ½ L1 i1² + ½ L2 i2² + M i1 i2 e2 = M di1/dt`
- Inputs: Self-inductances L1 and L2 come from; Coil 1 self-inductance L1 (used with Entered values) [mH]; Coil 2 self-inductance L2 (used with Entered values) [mH]; Coil 1 turns N1 (used with Turns on a common core); Coil 2 turns N2 (used with Turns on a common core); Core cross-section area Ac (used with Turns on a common core) [cm²]; Core mean path length lc (used with Turns on a common core) [cm]; Core relative permeability μr (used with Turns on a common core); Coupling is given as; Coupling coefficient k (0 to 1); Mutual inductance M (used with Mutual inductance) [mH]; Series-aiding inductance La (used with Series readings) [mH]; Series-opposing inductance Lo (used with Series readings) [mH]; Frequency f (for the reactances) [Hz]; Coil 1 current i1 (for the stored energy and flux linkage) [A]; Coil 2 current i2 (for the stored energy and flux linkage) [A]; Rate of change of coil 1 current di1/dt (A/s)
- Outputs: Self-inductance of coil 1, L1 [mH]; Self-inductance of coil 2, L2 [mH]; Mutual inductance M [mH]; Coupling coefficient k = M / √(L1 L2); Turns-ratio equivalent √(L1 / L2); Series aiding L1 + L2 + 2M [mH]; Series opposing L1 + L2 − 2M [mH]; Parallel aiding (L1 L2 − M²) / (L1 + L2 − 2M) [mH]; Parallel opposing (L1 L2 − M²) / (L1 + L2 + 2M) [mH]; Leakage seen at coil 1 with coil 2 shorted, L1 (1 − k²) [mH]; Leakage seen at coil 2 with coil 1 shorted, L2 (1 − k²) [mH]; T-equivalent arm L1 − M (the shunt arm is M) [mH]; T-equivalent arm L2 − M [mH]; Flux linkage of coil 1, L1 i1 + M i2 (Wb-turns); Flux linkage of coil 2, L2 i2 + M i1 (Wb-turns); Stored energy ½ L1 i1² + ½ L2 i2² + M i1 i2 (J); Of which the mutual term M i1 i2 (J); Reactance of coil 1, ω L1 [Ω]; Reactance of coil 2, ω L2 [Ω]; Mutual reactance, ω M [Ω]; Voltage induced in coil 1 by its own current, L1 di1/dt (V); Voltage induced in coil 2 (open circuit), M di1/dt (V); Core reluctance ℜ = lc / (μ₀ μr Ac) (A/Wb), turns on a core only; Core flux density (N1 i1 + N2 i2) μ₀ μr / lc (T), turns on a core only
- Assumptions: Two linear coils with constant inductances, so M is the same both ways (M12 = M21) and the results hold at one frequency and current level; M is entered and shown as a positive size. Aiding means the two fluxes add (both currents entering the dotted ends, or the coils connected so the current passes through both in the same sense); opposing means one coil is reversed; k = 1 is perfect coupling, with no leakage flux, and M cannot exceed √(L1 L2): a larger value is rejected. For two coils on one core, L1 L2 = (N1 N2 / ℜ)², so the largest possible M is N1 N2 / ℜ; With Turns on a common core the core is closed and of one constant relative permeability, μ₀ is taken as 4π × 10⁻⁷ H/m, and the coupling is the k you enter (k = 1 would be no leakage at all); a warning is given above 1.6 T, where iron saturates and the constant μr no longer holds; The series-reading method gives M = (La − Lo) / 4 and needs no knowledge of the turns. If L1 and L2 are also known, (La + Lo) / 2 should equal L1 + L2; a warning is given when they differ by more than 5%; Parallel aiding with k = 1 and L1 = L2 is 0 / 0 in the formula; its limit, L1 (1 + k) / 2, is used; Stored energy and flux linkage use the instantaneous currents entered, with i2 signed. The induced voltages are for the rate of change entered, with coil 2 open; resistance, winding capacitance and core loss are not modelled
- Notes: Mutual inductance is why a changing current in one coil induces a voltage in another, and it is the basis of the transformer, the coupled inductor and the wireless-power coil. The coupling coefficient k says how much of one coil's flux reaches the other; the part that does not is leakage, shown here as the inductance left when the other coil is shorted, L1 (1 − k²). Use this to find the inductance of two coils wired in series or parallel with their coupling counted (the plain series and parallel formulas are the k = 0 case), to find M and k from a bench measurement of the two series connections, to size the inductance of coils wound on one core, to find the energy held in a coupled pair, or to find the T-equivalent used in circuit analysis. For coils that have no coupling see the Inductors in Series and Parallel calculator, for a gapped core the Magnetic Circuit calculator, and for the ratio of an ideal transformer the Transformer Turns Ratio calculator.
- Independent vectors in the test suite: 40
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

### Superposition Theorem Calculator (Two Voltage Sources, a Current Source and a Load) (`superposition-theorem`)

- Formula: `Circuit: V₁ in series with R₁, V₂ in series with R₂ and the current source Is all join at node N; the load R₃ runs from N to the common node. V₁ alone: V′ = V₁ × (R₂‖R₃) / (R₁ + R₂‖R₃) V₂ alone: V″ = V₂ × (R₁‖R₃) / (R₂ + R₁‖R₃) Is alone: V‴ = Is × (R₁‖R₂‖R₃) V_L = V′ + V″ + V‴ I_L = V_L / R₃ P = V_L² / R₃ (not the sum of three powers)`
- Inputs: Voltage source V₁ [V]; Series resistance R₁ of source 1 [Ω]; Voltage source V₂ [V]; Series resistance R₂ of source 2 [Ω]; Current source Is into node N [A]; Load resistance R₃ [Ω]
- Outputs: Load voltage from V₁ alone (V₂ shorted, Is open) [V]; Load voltage from V₂ alone (V₁ shorted, Is open) [V]; Load voltage from Is alone (both voltage sources shorted) [V]; Total load voltage (sum of the three) [V]; Total load current [A]; Load power P = V² / R₃ (true value) [W]; Sum of the three separate powers (not valid) [W]; Current delivered by V₁ [A]; Current delivered by V₂ [A]; Check: difference from the direct node-voltage solution [V]
- Assumptions: The network is linear: every resistance is constant and does not change with voltage, current or temperature. Diodes, lamps with a hot filament, saturating iron cores and semiconductor loads are not linear; Superposition applies to voltages and currents only. Power is V² / R, which is not linear, so the three separate powers must never be added; the true load power is found from the total voltage; To switch a source off, an ideal voltage source is replaced by a short circuit (0 V) and an ideal current source by an open circuit (0 A). Any internal resistance stays in the circuit; here it is the series resistance R₁ or R₂; Positive voltage means the positive terminal faces node N; positive Is pushes current into N. A negative entry reverses the source; DC (or a single frequency with all values as phasors) is assumed. For sources of different frequencies the results can only be added as instantaneous values, not as rms values; The direct node-voltage solution V_N = (V₁/R₁ + V₂/R₂ + Is) / (1/R₁ + 1/R₂ + 1/R₃) is the check; it uses a different route, so a match confirms the sum
- Notes: Use this to check a textbook superposition problem, to see how much each source contributes to a load, or to confirm a two-source or battery-and-charger circuit before building it. Enter a zero for a source you do not have: a zero voltage source is a short circuit, a zero current source is an open circuit. If the current from a voltage source comes out negative, that source is absorbing power (like a battery being charged). For a circuit with more branches use the mesh or nodal method, which gives the same answer.
- Independent vectors in the test suite: 44
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Magnetic Circuit Calculator (Core with an Air Gap) (`magnetic-circuit`)

- Formula: `R = l / (μ₀ μᵣ A) R_gap = l_g / (μ₀ A_g), A_g = A_c × kf F = N I = Φ (R_core + R_gap) B = Φ / A H = B / (μ₀ μᵣ) L = N² / R W = ½ L I² μ₀ = 4π × 10⁻⁷ H/m`
- Inputs: Coil turns N; Coil current I [A]; Core mean path length lc [cm]; Core cross-section area Ac [cm²]; Core relative permeability μr; Air gap length lg [mm]; Gap area factor for fringing
- Outputs: Core reluctance (A/Wb); Gap reluctance (A/Wb); Total reluctance (A/Wb); Total MMF N × I (ampere-turns); MMF used in the core (ampere-turns); MMF used in the gap (ampere-turns); Share of the MMF used in the gap (%); Flux Φ (Wb); Flux density in the core (T); Flux density in the gap (T); Field strength in the core (A/m); Field strength in the gap (A/m); Inductance L = N² / R [mH]; Stored energy ½ L I² (J)
- Assumptions: This is the magnetic equivalent of Ohm's law (Hopkinson's law): MMF is like voltage, flux like current and reluctance like resistance. The core and the gap are in series, so one flux passes through both and the reluctances add; The core has one constant relative permeability. Real iron saturates: above roughly 1.5 to 1.8 T for silicon steel the permeability falls and this result is not valid; a warning is given above 1.6 T in the core; Leakage flux is ignored, so all the flux links every turn and passes through the whole path; The gap flux is spread over Ac × the fringing factor; the core flux density is always Φ / Ac; Hysteresis, remanence and eddy currents are not included; the current is steady, or a peak value for a peak flux; μ₀ is taken as 4π × 10⁻⁷ H/m. A small gap carries most of the MMF when μr is large, which is why a gap linearises and limits the flux of a choke
- Notes: Use this to see how much of the ampere-turns a gap takes, to find the flux and flux density for a given coil, to estimate the inductance of a gapped core or choke, or to check a magnetic-circuit problem. To find the turns or gap needed for a target flux density, run it with trial values: the flux density of the core is the quantity to keep below saturation. A gap reduces inductance but allows more current before saturation.
- Independent vectors in the test suite: 35
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Magnetic Flux Density Calculator (B = Φ/A and the B–H Relation) (`magnetic-flux-density`)

- Formula: `B = Φ / A B = μ H = μ₀ μr H μ₀ = 4π × 10⁻⁷ H/m\nSolenoid or toroid: H = N I / l Straight conductor: H = I / (2π r) B = μ₀ μr H\nFlux through the area: Φ = B A Energy density = B² / (2μ) = ½ B H Pressure on a surface = B² / (2μ₀) 1 T = 10 000 gauss`
- Inputs: Find B from; Relative permeability μr of the medium; Flux Φ (Wb) (case 1); Cross-section area A [cm²]; Field strength H (A/m) (case 2); Turns N (case 3); Current I (cases 3 and 4) [A]; Coil length l (case 3) [cm]; Distance r from the conductor axis (case 4) [cm]
- Outputs: Flux density B (T); Flux density B (gauss); Field strength H (A/m); Absolute permeability μ = μ₀ μr (H/m); Flux through the area Φ = B A (Wb); Energy stored per unit volume B² / 2μ (J/m³); Magnetic pressure B² / 2μ₀ on a surface (N/m²)
- Assumptions: A uniform field at right angles to the area, and a medium whose permeability is the constant μr you enter. Real iron has a B–H curve that saturates; use the curve of the steel for anything near or above about 1.5 T; A long solenoid (length much greater than diameter) or a closed toroid, so the field inside is uniform and H = N I / l. Near the ends of a short coil the field is lower; A long straight conductor, with r measured from its axis and larger than the conductor radius; inside the conductor the field is different. The field of a short wire or a loop needs the Biot-Savart integral; Steady (DC) current or the peak current for a peak flux density. Eddy currents, hysteresis and frequency effects are not modelled; The magnetic pressure B² / 2μ₀ is the pull per unit area across an air gap or on an iron face, with the field normal to the surface
- Notes: Use this to turn a flux into a flux density to compare with a core limit, to find the field a coil or a busbar produces, or to see how much H a given B needs in air or in iron. Air needs about 800 000 A/m for 1 T, which is why an air gap takes most of the ampere-turns in a gapped core. Silicon steel saturates at about 1.5 to 2 T, so a constant-μr result above that is not real. For a core with an air gap use the Magnetic Circuit Calculator.
- Independent vectors in the test suite: 40
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Induced EMF Calculator (Faraday's Law: Moving Conductor, Changing Flux, Rotating Coil) (`induced-emf`)

- Formula: `Moving conductor: e = B l v sin θ I = e / R F = B I l P = e I = I² R Changing flux: e = −N ΔΦ / Δt, ΔΦ = (B2 − B1) A (the size of the average EMF is shown; the minus sign is Lenz's law) Rotating coil: ω = 2π n / 60 Em = N B A ω e = Em sin α Erms = Em / √2 f = n / 60`
- Inputs: Case to solve; Flux density B (conductor and rotating coil); Active conductor length l (first case) [m]; Conductor speed v (first case) [m/s]; Angle θ between velocity and field (first case); Circuit resistance R (first case) [Ω]; Coil turns N (second and third case); Initial flux density B1 (second case); Final flux density B2 (second case); Coil area A (second and third case) [cm²]; Time interval Δt (second case) [ms]; Rotation speed (third case) [rpm]; Coil angle from the neutral plane (third case)
- Outputs: Induced EMF (V): moving conductor, average of the interval, or instantaneous at the coil angle [V]; Circuit current (first case) [A]; Force on the conductor, B I l (N); Power taken from the mover, e × I [W]; Flux change ΔΦ (Wb); Rate of change of flux ΔΦ / Δt (Wb/s); Angular speed ω (rad/s); Frequency of the EMF [Hz]; Peak EMF Em = N B A ω [V]; RMS EMF = Em / √2 [V]
- Assumptions: Faraday's law: the EMF is the rate at which flux linkage changes. The minus sign is Lenz's law: the induced EMF drives a current whose own field opposes the change that caused it, so the sign shown in the steps is the direction of opposition and the size is what the figures give; Moving conductor: a straight conductor of active length l, a uniform field, the field, the length and the velocity at the angle θ stated, and a closed circuit of total resistance R with no inductance; the EMF is the open-circuit value and the circuit voltage at the conductor terminals is lower by I times its own resistance; Changing flux: the field is uniform over the coil, at right angles to its plane, and the same flux links every turn; the result is the average EMF over the interval, and the EMF at any instant can be larger or smaller if the flux does not change at a constant rate; Rotating coil: one coil in a uniform two-pole field turning at constant speed, so the EMF is a pure sine wave at the rotation frequency; the number of poles is not an input, so for a machine with more poles the frequency is poles / 2 times higher and the EMF per turn is set by the flux per pole; No saturation, no leakage flux, no skin effect and no self-induction in the circuit; the flux density is a value you supply, not found from a magnetic circuit; The coil angle is measured from the neutral plane, where the coil plane is at right angles to the field and the EMF is zero
- Notes: Use the moving-conductor case for a rail or generator conductor and the quick forces on it, the changing-flux case for a coil in a transformer, relay or sensor where the flux builds or collapses over a known time, and the rotating-coil case for the EMF of a simple alternator coil. For the flux density itself, use the magnetic circuit calculator.
- Independent vectors in the test suite: 45
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Thevenin-Norton Equivalent Calculator (`thevenin-norton`)

- Formula: `Divider: Vth = Vs R2 / (R1 + R2) Rth = R3 + R1 R2 / (R1 + R2) Measured: Vth = Voc Rth = Voc / Isc Norton: IN = Vth / Rth = Isc Load: IL = Vth / (Rth + RL) VL = IL RL PL = IL² RL Pmax = Vth² / (4 Rth) at RL = Rth`
- Inputs: Circuit given as; Source voltage Vs (divider circuit) [V]; Series resistor R1 (from the source) [Ω]; Shunt resistor R2 (to the common line) [Ω]; Series resistor R3 (to the load terminals) [Ω]; Open-circuit voltage Voc (measured) [V]; Short-circuit current Isc (measured) [A]; Load resistance RL [Ω]
- Outputs: Thevenin voltage Vth [V]; Thevenin resistance Rth [Ω]; Norton current IN [A]; Load current [A]; Load voltage [V]; Load power [W]; Maximum power the terminals can deliver [W]; Share of the equivalent source power reaching the load (%)
- Assumptions: Linear circuit with resistive parts only, so the equivalents hold at every load; The Thevenin and Norton equivalents are the same source seen two ways: IN = Vth / Rth; The load is a plain resistor connected across the terminals; the equivalent gives the load values only, not the power or current inside the original circuit; The maximum-power figure is for a load that can be matched to Rth; it delivers half the source power to the load (50 % share); Measured values need the same sign convention: Isc flows out of the terminal that is positive for Voc
- Notes: The equivalent is exact only at the terminals you chose, and only while the circuit stays linear. Do not use it to find what happens inside the original network. Matching the load to Rth gives the most power but loses half of it in the source, so power systems are not matched this way. For an AC network with reactive parts use complex impedances (AC Ohm's law or the phasor calculators); this calculator is resistive.
- Independent vectors in the test suite: 40
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Kirchhoff Circuit Solver (KCL and KVL for a Two-Loop, Three-Branch DC Network) (`kirchhoff-solver`)

- Formula: `Three branches join node A (top) and node B (bottom, 0 V). Branch k holds a source Ek (positive towards A) and a resistor Rk. I₁ and I₂ flow up into A through branches 1 and 2; I₃ flows down through branch 3. KCL at A: I₁ + I₂ − I₃ = 0 KVL, loop 1 (branches 1 and 3): R₁ I₁ + R₃ I₃ = E₁ − E₃ KVL, loop 2 (branches 2 and 3): R₂ I₂ + R₃ I₃ = E₂ − E₃ With S = R₁R₂ + R₂R₃ + R₁R₃, a = E₁ − E₃, c = E₂ − E₃ (Cramer’s rule): I₁ = (R₃(a − c) + R₂ a) / S I₂ = (R₁ c − R₃(a − c)) / S I₃ = (R₂ a + R₁ c) / S V_A = E₁ − I₁ R₁ Source power Pk = Ek × (current it pushes up into A); resistor power = I² R`
- Inputs: Source E₁ in branch 1 [V]; Resistance R₁ of branch 1 [Ω]; Source E₂ in branch 2 [V]; Resistance R₂ of branch 2 [Ω]; Source E₃ in branch 3 (usually none) [V]; Resistance R₃ of branch 3 (the load) [Ω]
- Outputs: Current I₁ from source 1 into node A [A]; Current I₂ from source 2 into node A [A]; Current I₃ down through branch 3 (node A to B) [A]; Voltage of node A above node B [V]; Voltage across R₁ (I₁ R₁) [V]; Voltage across R₂ (I₂ R₂) [V]; Voltage across R₃ (I₃ R₃) [V]; Power delivered by source 1 (negative = absorbed) [W]; Power delivered by source 2 (negative = absorbed) [W]; Power delivered by source 3 (negative = absorbed) [W]; Total power lost in the three resistors [W]; Check: current sum at node A, I₁ + I₂ − I₃ [A]; Check: voltage round the outer loop (not used in the solution) [V]; Check: source power minus resistor power [W]
- Assumptions: A linear resistive DC network with exactly this shape: three branches between the same two nodes, which gives one current equation and two independent voltage-loop equations. A network with more nodes or meshes needs a larger set of equations (use the matrix or simultaneous-equations calculator); Ideal sources and constant resistors. Each source is an ideal EMF in series with its resistor, so a real battery’s internal resistance is added into Rk; Positive source voltage means its positive terminal faces node A. I₁ and I₂ are positive when the branch pushes current up into A; I₃ is positive when current flows down through branch 3. A negative current means the true direction is opposite to the one assumed, which is normal and not an error; A source whose power is negative is absorbing energy (a battery being charged), not delivering it; DC steady state. For AC, enter the values as phasors in a complex-number solver; this page works with real numbers only; The solution uses Cramer’s rule on the three equations above; the node voltage and the power balance are then computed and compared as independent checks
- Notes: Use this to check a textbook Kirchhoff problem (two batteries and a load, a battery charging from a supply, two feeders into one load) or to see the equations written out for your numbers. Enter each source and resistor; leave E₃ at 0 for a plain load. If a current comes out negative, the real current flows the other way through that branch. If a source shows negative power it is being charged by the other source. The three check lines should read zero; they confirm the current law at the node, a voltage loop that was not used to solve the circuit, and that the power supplied equals the power lost.
- Independent vectors in the test suite: 46
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Mesh and Nodal Analysis Solver (Bridge Network with a Source, by Mesh Currents or Node Voltages) (`mesh-nodal-solver`)

- Formula: `The source E with Rs feeds node A; node D is 0 V. R₁ joins A to B, R₂ joins B to D, R₃ joins A to C, R₄ joins C to D and R₅ joins B to C. Gk = 1/Rk. Mesh currents i₁ (A→B→C→A), i₂ (B→D→C→B), i₃ (source loop D→A→C→D): (R₁+R₅+R₃) i₁ − R₅ i₂ − R₃ i₃ = 0 −R₅ i₁ + (R₂+R₄+R₅) i₂ − R₄ i₃ = 0 −R₃ i₁ − R₄ i₂ + (Rs+R₃+R₄) i₃ = E Then Is = i₃, I₁ = i₁, I₂ = i₂, I₃ = i₃ − i₁, I₄ = i₃ − i₂, I₅ = i₁ − i₂. Node voltages (KCL at A, B and C): (Gs+G₁+G₃) V_A − G₁ V_B − G₃ V_C = E Gs −G₁ V_A + (G₁+G₂+G₅) V_B − G₅ V_C = 0 −G₃ V_A − G₅ V_B + (G₃+G₄+G₅) V_C = 0 Then Ik = (voltage across Rk) / Rk and Is = (E − V_A) / Rs. Balanced bridge: R₁ R₄ = R₂ R₃ (V_B = V_C, no current in R₅)`
- Inputs: Method shown; Source voltage E [V]; Source resistance Rs [Ω]; Resistor R₁ (A to B) [Ω]; Resistor R₂ (B to D) [Ω]; Resistor R₃ (A to C) [Ω]; Resistor R₄ (C to D) [Ω]; Bridge resistor R₅ (B to C) [Ω]
- Outputs: Voltage of node A above D (bridge input) [V]; Voltage of node B above D [V]; Voltage of node C above D [V]; Voltage across R₅ (V_B − V_C) [V]; Current drawn from the source [A]; Current in R₁ (A to B) [A]; Current in R₂ (B to D) [A]; Current in R₃ (A to C) [A]; Current in R₄ (C to D) [A]; Current in R₅ (B to C) [A]; Resistance of the bridge seen at A and D [Ω]; Power delivered by the source [W]; Power lost in Rs and the five resistors [W]; Check: largest current difference between the mesh and nodal solutions [A]; Check: voltage round the outer loop E, Rs, R₁, R₂ [V]; Check: source power minus resistor power [W]
- Assumptions: A linear resistive DC network of exactly this shape: a source with its resistance and a five-resistor bridge. A network with a different layout needs its own equations (use the matrix or simultaneous-equations calculator); Ideal constant resistors and one ideal source in series with Rs. Rs must be above zero, so an ideal voltage source is entered as a very small Rs; The mesh currents all run in the same sense, so the shared resistors appear with a minus sign in the off-diagonal terms. A negative branch current means the real current flows opposite to the direction written in the label, which is normal; Both methods are always solved. The one you choose is shown in the working and the outputs; the other is used as an independent check; DC steady state. For AC with reactances the same equations hold with complex impedances, which this calculator does not handle
- Notes: Use this to check a textbook bridge or two-loop network, to see mesh and nodal equations written out with your numbers, or to find the voltage across and current in the middle resistor of a Wheatstone bridge. Mesh analysis writes one voltage equation per loop; nodal analysis writes one current equation per node. Both must give the same branch currents, and the check line shows the gap, which should be zero apart from rounding. When R₁ R₄ = R₂ R₃ the bridge is balanced and R₅ carries no current, which is how a bridge measures an unknown resistance.
- Independent vectors in the test suite: 46
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Electric Potential Calculator (Point Charges, Potential at a Point and Energy of the Group) (`electric-potential`)

- Formula: `k = 1 / (4π ε0 εr) ε0 = 8.8541878128×10⁻¹² F/m ri = √((px − xi)² + (py − yi)²) Vi = k × qi / ri V = V1 + V2 + V3 W = q0 × V U = k × Σ (qi × qj / rij) over each pair of charges`
- Inputs: Number of point charges; Relative permittivity εr of the medium; Charge 1 [µC]; Charge 1 position x [m]; Charge 1 position y [m]; Charge 2 [µC]; Charge 2 position x [m]; Charge 2 position y [m]; Charge 3 [µC]; Charge 3 position x [m]; Charge 3 position y [m]; Field point position x [m]; Field point position y [m]; Test charge q0 (for the work) [µC]
- Outputs: Distance from charge 1 [m]; Distance from charge 2 [m]; Distance from charge 3 [m]; Potential from charge 1 [V]; Potential from charge 2 [V]; Potential from charge 3 [V]; Total potential at the field point [V]; Work to bring the test charge from infinity [J]; Electrostatic energy of the charges themselves [J]; Net charge [µC]
- Assumptions: Point charges in a uniform, linear medium of relative permittivity εr, with potential taken as zero at infinity; The potential is a scalar: the contributions are added as signed numbers, with no direction; The charges and the field point lie in one plane; the distance is the straight-line distance; ε0 = 8.8541878128×10⁻¹² F/m (CODATA 2018), so k = 8.98755×10⁹ N·m²/C² in vacuum; The work is that of an outside agent bringing the test charge in slowly, without the test charge disturbing the other charges; U counts each pair once; a single charge has no pair energy and the self-energy of a point charge is not included; No conductors, boundaries or moving charges: charges induced on nearby conductors or dielectric interfaces are not modelled
- Notes: The potential at a point is the work per unit charge to bring a positive test charge there from infinity. Zero potential at a point does not mean zero electric field: two equal and opposite charges give zero potential on the line halfway between them, where the field is not zero. For the force between two charges use the Coulomb's law guide; for energy, voltage and charge in any two use the Joules, Volts, Charge and eV calculator. This is an idealised textbook model; it is not a field simulation of real electrodes.
- Independent vectors in the test suite: 34
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Electric Field Calculator (Point Charges, Field Vector at a Point and Force on a Test Charge) (`electric-field`)

- Formula: `k = 1 / (4π ε0 εr) ε0 = 8.8541878128×10⁻¹² F/m ri = √((px − xi)² + (py − yi)²) Ei = k |qi| / ri² pointing away from a positive charge and towards a negative one Ex = Σ k qi (px − xi) / ri³ Ey = Σ k qi (py − yi) / ri³ E = √(Ex² + Ey²) direction = atan2(Ey, Ex) F = q0 E (the force reverses for a negative q0)`
- Inputs: Number of point charges; Relative permittivity εr of the medium; Charge 1 [µC]; Charge 1 position x [m]; Charge 1 position y [m]; Charge 2 [µC]; Charge 2 position x [m]; Charge 2 position y [m]; Charge 3 [µC]; Charge 3 position x [m]; Charge 3 position y [m]; Field point position x [m]; Field point position y [m]; Test charge q0 (for the force) [µC]
- Outputs: Distance from charge 1 [m]; Distance from charge 2 [m]; Distance from charge 3 [m]; Field strength from charge 1 (V/m); Field strength from charge 2 (V/m); Field strength from charge 3 (V/m); Net field, x component (V/m); Net field, y component (V/m); Net field magnitude (V/m); Direction of the net field (degrees from the +x axis); Force on the test charge (N); Direction of the force on the test charge (degrees from the +x axis)
- Assumptions: Point charges in a uniform, linear medium of relative permittivity εr; The field is a vector: the contributions are added by components, so their directions matter (unlike potential, which adds as signed numbers); The charges and the field point lie in one plane; the field is then also in that plane; ε0 = 8.8541878128×10⁻¹² F/m (CODATA 2018), so k = 8.98755×10⁹ N·m²/C² in vacuum; The test charge is small enough not to disturb the other charges; No conductors, boundaries or moving charges: charges induced on nearby conductors or dielectric interfaces are not modelled, and the field of a line, sheet or volume of charge is not covered
- Notes: The field is the force per unit charge on a small positive test charge. A field of zero at a point does not mean zero potential: between two equal like charges the field is zero at the midpoint but the potential is not. The field points away from positive charge and towards negative charge, and falls with the square of the distance. For the potential at the same point use the Electric Potential Calculator. This is an idealised textbook model; it is not a field simulation of real electrodes, and no breakdown or corona limit is checked.
- Independent vectors in the test suite: 39
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

### Three-Phase Circuit Calculator (Balanced or Unbalanced Star and Delta Load, with Line and Neutral Impedance) (`three-phase-network`)

- Formula: `Star: Ik = (Ek − Vn) / (Zk + Zl) Vn = (Σ Ek / (Zk + Zl)) / (Σ 1 / (Zk + Zl) + 1 / Zn) delta to star: Za = Zab Zca / ΣZ, Zb = Zab Zbc / ΣZ, Zc = Zbc Zca / ΣZ delta branch: Jab = Vab / Zab In = Ia + Ib + Ic S = Σ |J|² Z I1, I2 = (Ia + a Ib + a² Ic) / 3, (Ia + a² Ib + a Ic) / 3`
- Inputs: Load connection; Supply line-to-line voltage (balanced, phase order a-b-c) [V]; Impedance a: resistance R [Ω]; Impedance a: reactance X (inductive +, capacitive −) [Ω]; Impedance b: resistance R [Ω]; Impedance b: reactance X (inductive +, capacitive −) [Ω]; Impedance c: resistance R [Ω]; Impedance c: reactance X (inductive +, capacitive −) [Ω]; Line impedance in each line: resistance (0 for none) [Ω]; Line impedance in each line: reactance (0 for none) [Ω]; Neutral wire impedance: resistance (four-wire star only) [Ω]; Neutral wire impedance: reactance (four-wire star only) [Ω]
- Outputs: Line current a [A]; Line current a angle (degrees, from Van); Line current b [A]; Line current b angle (degrees); Line current c [A]; Line current c angle (degrees); Neutral wire current (four-wire star) [A]; Shift of the load star point from the supply neutral (star) [V]; Current in load impedance a [A]; Current in load impedance b [A]; Current in load impedance c [A]; Voltage across load impedance a [V]; Voltage across load impedance b [V]; Voltage across load impedance c [V]; Line voltage at the load, a-b [V]; Line voltage at the load, b-c [V]; Line voltage at the load, c-a [V]; Real power in impedance a [kW]; Real power in impedance b [kW]; Real power in impedance c [kW]; Load real power [kW]; Load reactive power (inductive +, capacitive −) [kVAR]; Load apparent power [kVA]; Load power factor; Loss in the line and neutral wires [kW]; Supply real power [kW]; Supply reactive power [kVAR]; Supply apparent power [kVA]; Supply power factor; Line current unbalance, largest deviation from the average (%); Negative-sequence current as a share of positive-sequence (%); Line voltage unbalance at the load (%); Drop in the average line voltage at the load below the supply (%)
- Assumptions: A balanced three-phase supply of the line-to-line voltage entered, phase order a-b-c, with phase a as the angle reference: Van = VL / √3 ∠0°, Vbn = ∠−120°, Vcn = ∠+120°. The supply impedance is not modelled; enter it as part of the line impedance if it matters; The load is three linear impedances of constant resistance and reactance at one frequency (sinusoidal, steady state). A constant-power load such as a motor at changing voltage is not a constant impedance, so use the result as the answer for the impedances entered; Star: the impedances run from each line to the load star point. With the neutral wire, the star point is joined to the supply neutral through the neutral impedance, and 0 + j0 is an ideal solid neutral. Without it the star point floats and moves to a voltage set by the unbalance. Delta: the impedances sit between lines a-b, b-c and c-a; The line impedance is the same in all three lines and is in series between the supply and the load. For delta the load is first turned into its equivalent star so the line impedance can be added, and the delta branch voltages and currents are then found from the line voltages at the load terminals; Power is the real and reactive power in the load impedances (|J|² R and |J|² X, reactive positive for an inductive load). Supply power is the power leaving the source, so supply real power equals the load real power plus the loss in the line and neutral wires, which is shown as a check in the working; Current unbalance is the largest deviation of a line current from the average line current as a percentage of that average (the NEMA-style definition used for voltage); the negative-sequence share |I2| / |I1| uses the symmetrical-component transformation. Both are screening figures. Voltage unbalance is worked out the same way on the three line voltages at the load; The warning levels (10% current unbalance, 2% voltage unbalance, 5% voltage drop, 10% movement of the load star point) are common screening values, not limits of one standard
- Notes: Use this to see what an unbalanced or unequal load does: the currents in each line, how much current the neutral carries, how far the star point moves when there is no neutral, and what the line impedance costs in voltage and loss. For a balanced load all three line currents are equal, the neutral current is zero and the power is √3 × VL × IL × pf, which the Three-Phase Power calculator gives directly. For an unbalanced star load with no neutral wire, one phase can end up with a voltage well above the phase voltage and another well below it, so a lightly loaded phase on a three-wire star can be overvoltaged, which is why a neutral is carried to an unbalanced star load. With the neutral connected, the neutral carries the phasor sum of the three line currents, which can be as large as the largest line current. The calculation is an exact phasor solution of the circuit you describe. For the effect of harmonics on a neutral, a real network with sources and cables of different impedance, or a fault, use a load flow or a short-circuit study. For the line and phase quantities of a balanced load see the Line and Phase Quantities calculator, for the neutral current from three measured currents the Neutral Current from Unbalanced Load calculator, and for the sequence components of a measured set the Symmetrical Components calculator.
- Independent vectors in the test suite: 40
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 07 Power and Energy

### Appliance Running Cost (Energy and Cost) (`energy-cost`)

- Formula: `E per day = P × (run-at % / 100) × hours per day per 30-day month = × 30 per average month = × 365 / 12 per year = × 365 Cost = E × tariff`
- Inputs: Load [kW]; Run at (% of the load); Hours of use; Hours of use are per; Days to total; Tariff per kWh; Currency symbol on the results
- Outputs: Energy (days entered) [kWh]; Cost (days entered); Cost per day; Cost per average month (365 ÷ 12 days); Cost per year; Energy per day [kWh]; Energy per average month (365 ÷ 12 days) [kWh]; Energy per year (365 days) [kWh]; Energy per 30-day month [kWh]; Cost per 30-day month
- Assumptions: Constant draw at the run-at percentage while on; Hours per week are spread over 7 days and hours per month over 365 / 12 = 30.42 days; Flat tariff, no demand charges; Typical appliance wattages are indicative, not measured values
- Notes: This is the cost of one load at one flat rate. A real bill adds demand and fixed charges that are not modelled here. The per-month figure uses an average month of 30.42 days (so that 12 months equal the 365-day year), so it differs a little from the days-to-total result when that is 30. Worked example: 1.5 kW for 8 h a day at 8 per kWh costs 96 a day; over 30 days that is 360 kWh and 2,880, while an average month is 365 / 12 = 30.42 days, 365 kWh and 2,920, and the year (365 days) is 4,380 kWh and 35,040. For a bill that covers a billing period of a set number of days, use the days-to-total result. For a whole bill from the units on your meter, with tariff slabs, a fixed charge and tax, use Electricity Bill from Tariff Slabs. Power can be entered in BTU/h (1 BTU/h = 0.29307 W) or tons of refrigeration (1 TR = 12,000 BTU/h = 3,516.85 W); that is the cooling rating, so check the electrical input power of an air conditioner on its label.
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

### Energy Audit Calculator (Load Survey Against Metered Energy) (`energy-audit`)

- Formula: `Row: E = n × P × load factor × hours Surveyed Es = ΣE Unaccounted Eu = Emetered − Es Unaccounted share = Eu / Emetered × 100 Cost = energy × tariff Baseline change = Emetered − Ebaseline`
- Inputs: Metered energy for the audit year (from bills or meter readings) [kWh]; Energy tariff (per kWh); Baseline: metered energy of the previous or reference year (0 to skip) [kWh]; Load 1: rated input power of each unit (0 leaves the row out) [kW]; Load 1: number of units; Load 1: average load factor (fraction of rated input power actually drawn); Load 1: operating hours per year; Load 2: rated input power of each unit (0 leaves the row out) [kW]; Load 2: number of units; Load 2: average load factor (fraction of rated input power actually drawn); Load 2: operating hours per year; Load 3: rated input power of each unit (0 leaves the row out) [kW]; Load 3: number of units; Load 3: average load factor (fraction of rated input power actually drawn); Load 3: operating hours per year; Load 4: rated input power of each unit (0 leaves the row out) [kW]; Load 4: number of units; Load 4: average load factor (fraction of rated input power actually drawn); Load 4: operating hours per year; Load 5: rated input power of each unit (0 leaves the row out) [kW]; Load 5: number of units; Load 5: average load factor (fraction of rated input power actually drawn); Load 5: operating hours per year; Load 6: rated input power of each unit (0 leaves the row out) [kW]; Load 6: number of units; Load 6: average load factor (fraction of rated input power actually drawn); Load 6: operating hours per year
- Outputs: Surveyed connected load [kW]; Load 1 energy per year [kWh]; Load 2 energy per year [kWh]; Load 3 energy per year [kWh]; Load 4 energy per year [kWh]; Load 5 energy per year [kWh]; Load 6 energy per year [kWh]; Surveyed (accounted) energy per year [kWh]; Unaccounted energy (metered less surveyed) [kWh]; Unaccounted share of metered energy (%); Average metered demand over the year [kW]; Largest energy user (load number); Largest user share of surveyed energy (%); Cost of metered energy per year; Cost of surveyed energy per year; Cost of unaccounted energy per year; Change from baseline year [kWh]; Change from baseline year (%)
- Assumptions: Each row is a group of identical loads with one average load factor and one set of operating hours; group similar loads into one row; The rated power is the electrical input power (shaft power divided by efficiency for a motor) and the load factor is the average fraction of it actually drawn, from measurement or logger data where possible; The unaccounted energy is a balance, not a measured loss: it holds distribution and transformer losses, loads that were not surveyed and every error in the load factors and hours; Energy is taken as constant over the operating hours; seasonal and shift variation inside a row is not modelled; The tariff is one flat rate per kWh; demand charges, time-of-use rates and power factor penalties are not included; The baseline comparison is the plain difference between two metered years and is not normalised for production, weather or occupancy
- Notes: Measure rather than assume the load factor and hours of the biggest users first; they decide the result. A gap of a few percent is normal and is mostly distribution loss. A large gap means loads are missing or the assumptions are wrong, so go back to the survey before drawing conclusions.
- Independent vectors in the test suite: 42
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Time-of-Use and Demand-Charge Bill (Peak, Shoulder, Off-Peak and Billed Demand) (`tou-demand-bill`)

- Formula: `Energy charge = kWh peak × rate + kWh shoulder × rate + kWh off-peak × rate Billed demand = larger of recorded demand and (minimum % × contract demand) Demand charge = billed demand × rate Subtotal = energy + demand + fixed Duty and tax = % of subtotal Total = subtotal + duty + tax + other Load factor = total kWh / (recorded demand × days × 24) × 100`
- Inputs: Peak energy (kWh); Shoulder energy (kWh); Off-peak energy (kWh); Peak rate per kWh; Shoulder rate per kWh; Off-peak rate per kWh; Recorded maximum demand (kW); Contract demand (kW); Minimum billed demand (% of contract demand); Demand charge per kW per month; Days in the billing period; Fixed monthly charge; Electricity duty (% of subtotal); Tax (% of subtotal); Other charges, total; Currency symbol on the results
- Outputs: Total energy (kWh); Peak energy charge; Shoulder energy charge; Off-peak energy charge; Total energy charge; Billed demand (kW); Demand charge; Subtotal before duty and tax; Electricity duty; Tax; Total bill; Average cost per kWh (total bill / energy); Share of energy used at peak (%); Load factor on recorded demand (%)
- Assumptions: Three energy periods, each at one flat rate for the whole billing period; Billed demand is the larger of the recorded demand and a set percentage of the contract demand; the figures come from your tariff order; Duty and tax are each a percent of the same subtotal (added, not compounded); One billing period of the days entered; the demand charge is per kW for that period; No power factor penalty or rebate, no minimum charge, no subsidy, no arrears, no seasonal or slab rates
- Notes: No real tariff is built in: the example rates are for illustration, so enter the rates, contract demand and billing rules from your own tariff order. Utilities differ in how demand is measured (kW or kVA, the averaging interval, ratchets over several months), and this calculator uses the one figure you enter. Moving energy from peak to off-peak lowers the bill only by the rate difference, while a single high demand reading is billed for the whole period. For slab billing from meter readings use Electricity Bill from Meter Readings.
- Independent vectors in the test suite: 33
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Load Energy and Cost (Voltage, Current and Power Factor to kWh and Cost) (`load-energy-cost`)

- Formula: `P = n × √3 × V × I × (load / 100) × pf (three-phase L-N: 3 × V; single-phase: V; DC: pf = 1) E = P × hours × days Cost = E × tariff`
- Inputs: Current type; Voltage type (three-phase only); Voltage [V]; Running current of one load [A]; Power factor; Number of identical loads; Average load while running (% of the current entered); Hours of operation per day; Days of operation per month; Days of operation per year; Tariff per kWh; Currency symbol on the results
- Outputs: Real power of all loads while running [kW]; Apparent power of all loads while running [kVA]; Energy per day [kWh]; Energy per month [kWh]; Energy per year [kWh]; Cost per hour of running; Cost per day; Cost per month; Cost per year
- Assumptions: Balanced load, sinusoidal waveforms, the same current in every phase; V is line-to-line RMS for three-phase unless line-to-neutral is chosen; The power factor entered applies at the current entered; real motors lose power factor at part load, so use measured values for a part-loaded motor; The load runs at the same power for every hour entered on every day of the period; One flat tariff; no demand charge, fixed charge, duty, tax or time-of-use rate
- Notes: This is real input power, so the energy is what the meter records, not shaft output. Connected load, rated input power, actual average power and maximum demand are not the same quantity: enter the running current and power factor, not the nameplate of a lightly loaded machine. A measured average from a power meter is better than any estimate. For the bill that the units produce, use Electricity Bill from Meter Readings; for several different loads use Multiple Appliance Energy Cost.
- Independent vectors in the test suite: 33
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Equipment Replacement Energy Savings (Existing Against New: Energy, Cost, Payback) (`replacement-savings`)

- Formula: `E = n × P × (share / 100) × hours per day × days Saving = E existing − E new Cost = E × tariff Percent saved = saving / E existing × 100 Yearly saving = daily saving × days per year Investment = n × cost per unit + other cost Payback = investment / yearly cost saving Net = yearly saving × life − investment`
- Inputs: Number of units replaced; Existing unit: power of one unit [W]; Existing unit: hours of use per day; Existing unit: share of its rating drawn while on (%); New unit: power of one unit [W]; New unit: hours of use per day; New unit: share of its rating drawn while on (%); Days of use per month; Days of use per year; Tariff per kWh; Cost of one new unit; Other cost of the change (installation, disposal), total; Life of the new equipment (years); Currency symbol on the results
- Outputs: Existing energy per month [kWh]; New energy per month [kWh]; Existing cost per month; New cost per month; Energy saved per month [kWh]; Cost saved per month; Energy saved (%); Energy saved per year [kWh]; Cost saved per year; Total investment; Simple payback (months); Simple payback (years); Net saving over the life (not discounted)
- Assumptions: Both loads are constant while on, at the share of rating entered, for the hours entered, on every day of the period; The new equipment gives the same useful output as the existing one; this calculator compares electrical energy only and cannot check that; One flat tariff, no tariff rise, no discounting, no maintenance, lamp-life or residual-value effects; payback is simple payback; Monthly figures use the days per month entered and yearly figures use the days per year entered, so twelve months match the year only if the two agree (30 and 360); Savings in demand or fixed charges, power factor and cooling load are not included
- Notes: Use measured or nameplate input power, and the real hours, since they decide the result. A replacement that gives less light, flow or cooling is not a like-for-like saving. If the payback comes out longer than the life of the new equipment, the net saving is negative. For discounting, tariff rise and several measures together use the Energy Savings Estimator; for a plain lighting retrofit by fitting count use LED Retrofit Payback.
- Independent vectors in the test suite: 32
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Electricity Bill from Meter Readings (Slabs, Fixed Charges, Duty and Tax) (`electricity-bill-meter`)

- Formula: `Units = (current − previous) × multiplier Telescopic: Uj = units in block j, Energy = Σ Uj × rj Non-telescopic: all units × r of the slab the total falls in Subtotal = Energy + ld × fixed per kW + fixed monthly + units × surcharge Duty = Subtotal × duty % Tax = Subtotal × tax % Total = Subtotal + Duty + Tax + Other`
- Inputs: Previous meter reading (kWh); Current meter reading (kWh); Meter multiplier; Slab billing method; Slab 1 upper limit (units); Slab 2 upper limit (units); Slab 3 upper limit (units); Slab 1 rate per kWh; Slab 2 rate per kWh; Slab 3 rate per kWh; Slab 4 rate per kWh; Sanctioned load (kW); Fixed charge per kW of sanctioned load; Fixed monthly charge; Surcharge per kWh (fuel or power purchase adjustment); Electricity duty (% of energy, fixed and surcharge); Tax (% of energy, fixed and surcharge); Other charges (fixed amount, added at the end); Currency symbol on the results
- Outputs: Units billed (kWh); Slab that applies (non-telescopic) or highest slab reached (telescopic); Slab 1 units; Slab 2 units; Slab 3 units; Slab 4 units; Slab 1 charge; Slab 2 charge; Slab 3 charge; Slab 4 charge; Energy charge; Fixed charges (load-based plus monthly); Per-unit surcharge; Subtotal before duty and tax; Electricity duty; Tax; Total bill; Average cost per kWh (total bill / units)
- Assumptions: Units are the meter difference times the multiplier; a slab limit is inclusive (units equal to a limit stay in that slab); Slab limits, rates, fixed charges, duty and tax are the values you enter from your tariff order, for one billing period; Duty and tax are each a percentage of the same subtotal (energy, fixed charges and surcharge); they are added, not compounded, and Other charges are added after them; No demand charge on recorded maximum demand, power factor penalty, time-of-day rate, subsidy, rebate or arrears; Slab limits are used as entered: a tariff that sets limits per month, per day or by sanctioned load must be converted to the billing period first
- Notes: Check which method your tariff order uses; the two can differ a lot near a slab limit. Real tariffs often add items this calculator does not model (demand charges, minimum charges, rebates, subsidies and surcharges on arrears), so treat the result as an estimate to compare with the printed bill, not a replacement for it. If a printed bill differs, compare units first, then the slab split, then each fixed item.
- Independent vectors in the test suite: 34
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Multiple Appliance Electricity Cost (Household or Building Load List) (`multi-appliance-cost`)

- Formula: `Row: E per day = n × P × (share / 100) × hours Total Ed = ΣE per day Month: Em = Ed × days Year: Ey = Σ (row E per day × 365 × months of use / 12 + row E per day at the other-month hours × 365 × (12 − months of use) / 12); with a monthly pattern: Ey = Σ rows n × P × share × Σ over months (hours in month × days in month) Cost = energy (kWh) × tariff Share = row energy / total × 100`
- Inputs: Days of use per month; Tariff per kWh; Currency symbol on the results; Appliance 1: power of one unit (0 leaves the row out) [W]; Appliance 1: number of units; Appliance 1: hours of use per day; Appliance 1: share of its rating drawn while on (%); Appliance 1: months of use per year (12 = all year); Appliance 1: hours of use per day in the months not in use (0 = none); Appliance 1: hours pattern; Appliance 1: hours per day in January; Appliance 1: hours per day in February; Appliance 1: hours per day in March; Appliance 1: hours per day in April; Appliance 1: hours per day in May; Appliance 1: hours per day in June; Appliance 1: hours per day in July; Appliance 1: hours per day in August; Appliance 1: hours per day in September; Appliance 1: hours per day in October; Appliance 1: hours per day in November; Appliance 1: hours per day in December; Appliance 2: power of one unit (0 leaves the row out) [W]; Appliance 2: number of units; Appliance 2: hours of use per day; Appliance 2: share of its rating drawn while on (%); Appliance 2: months of use per year (12 = all year); Appliance 2: hours of use per day in the months not in use (0 = none); Appliance 2: hours pattern; Appliance 2: hours per day in January; Appliance 2: hours per day in February; Appliance 2: hours per day in March; Appliance 2: hours per day in April; Appliance 2: hours per day in May; Appliance 2: hours per day in June; Appliance 2: hours per day in July; Appliance 2: hours per day in August; Appliance 2: hours per day in September; Appliance 2: hours per day in October; Appliance 2: hours per day in November; Appliance 2: hours per day in December; Appliance 3: power of one unit (0 leaves the row out) [W]; Appliance 3: number of units; Appliance 3: hours of use per day; Appliance 3: share of its rating drawn while on (%); Appliance 3: months of use per year (12 = all year); Appliance 3: hours of use per day in the months not in use (0 = none); Appliance 3: hours pattern; Appliance 3: hours per day in January; Appliance 3: hours per day in February; Appliance 3: hours per day in March; Appliance 3: hours per day in April; Appliance 3: hours per day in May; Appliance 3: hours per day in June; Appliance 3: hours per day in July; Appliance 3: hours per day in August; Appliance 3: hours per day in September; Appliance 3: hours per day in October; Appliance 3: hours per day in November; Appliance 3: hours per day in December; Appliance 4: power of one unit (0 leaves the row out) [W]; Appliance 4: number of units; Appliance 4: hours of use per day; Appliance 4: share of its rating drawn while on (%); Appliance 4: months of use per year (12 = all year); Appliance 4: hours of use per day in the months not in use (0 = none); Appliance 4: hours pattern; Appliance 4: hours per day in January; Appliance 4: hours per day in February; Appliance 4: hours per day in March; Appliance 4: hours per day in April; Appliance 4: hours per day in May; Appliance 4: hours per day in June; Appliance 4: hours per day in July; Appliance 4: hours per day in August; Appliance 4: hours per day in September; Appliance 4: hours per day in October; Appliance 4: hours per day in November; Appliance 4: hours per day in December; Appliance 5: power of one unit (0 leaves the row out) [W]; Appliance 5: number of units; Appliance 5: hours of use per day; Appliance 5: share of its rating drawn while on (%); Appliance 5: months of use per year (12 = all year); Appliance 5: hours of use per day in the months not in use (0 = none); Appliance 5: hours pattern; Appliance 5: hours per day in January; Appliance 5: hours per day in February; Appliance 5: hours per day in March; Appliance 5: hours per day in April; Appliance 5: hours per day in May; Appliance 5: hours per day in June; Appliance 5: hours per day in July; Appliance 5: hours per day in August; Appliance 5: hours per day in September; Appliance 5: hours per day in October; Appliance 5: hours per day in November; Appliance 5: hours per day in December; Appliance 6: power of one unit (0 leaves the row out) [W]; Appliance 6: number of units; Appliance 6: hours of use per day; Appliance 6: share of its rating drawn while on (%); Appliance 6: months of use per year (12 = all year); Appliance 6: hours of use per day in the months not in use (0 = none); Appliance 6: hours pattern; Appliance 6: hours per day in January; Appliance 6: hours per day in February; Appliance 6: hours per day in March; Appliance 6: hours per day in April; Appliance 6: hours per day in May; Appliance 6: hours per day in June; Appliance 6: hours per day in July; Appliance 6: hours per day in August; Appliance 6: hours per day in September; Appliance 6: hours per day in October; Appliance 6: hours per day in November; Appliance 6: hours per day in December; Appliance 7: power of one unit (0 leaves the row out) [W]; Appliance 7: number of units; Appliance 7: hours of use per day; Appliance 7: share of its rating drawn while on (%); Appliance 7: months of use per year (12 = all year); Appliance 7: hours of use per day in the months not in use (0 = none); Appliance 7: hours pattern; Appliance 7: hours per day in January; Appliance 7: hours per day in February; Appliance 7: hours per day in March; Appliance 7: hours per day in April; Appliance 7: hours per day in May; Appliance 7: hours per day in June; Appliance 7: hours per day in July; Appliance 7: hours per day in August; Appliance 7: hours per day in September; Appliance 7: hours per day in October; Appliance 7: hours per day in November; Appliance 7: hours per day in December; Appliance 8: power of one unit (0 leaves the row out) [W]; Appliance 8: number of units; Appliance 8: hours of use per day; Appliance 8: share of its rating drawn while on (%); Appliance 8: months of use per year (12 = all year); Appliance 8: hours of use per day in the months not in use (0 = none); Appliance 8: hours pattern; Appliance 8: hours per day in January; Appliance 8: hours per day in February; Appliance 8: hours per day in March; Appliance 8: hours per day in April; Appliance 8: hours per day in May; Appliance 8: hours per day in June; Appliance 8: hours per day in July; Appliance 8: hours per day in August; Appliance 8: hours per day in September; Appliance 8: hours per day in October; Appliance 8: hours per day in November; Appliance 8: hours per day in December; Appliance 9: power of one unit (0 leaves the row out) [W]; Appliance 9: number of units; Appliance 9: hours of use per day; Appliance 9: share of its rating drawn while on (%); Appliance 9: months of use per year (12 = all year); Appliance 9: hours of use per day in the months not in use (0 = none); Appliance 9: hours pattern; Appliance 9: hours per day in January; Appliance 9: hours per day in February; Appliance 9: hours per day in March; Appliance 9: hours per day in April; Appliance 9: hours per day in May; Appliance 9: hours per day in June; Appliance 9: hours per day in July; Appliance 9: hours per day in August; Appliance 9: hours per day in September; Appliance 9: hours per day in October; Appliance 9: hours per day in November; Appliance 9: hours per day in December; Appliance 10: power of one unit (0 leaves the row out) [W]; Appliance 10: number of units; Appliance 10: hours of use per day; Appliance 10: share of its rating drawn while on (%); Appliance 10: months of use per year (12 = all year); Appliance 10: hours of use per day in the months not in use (0 = none); Appliance 10: hours pattern; Appliance 10: hours per day in January; Appliance 10: hours per day in February; Appliance 10: hours per day in March; Appliance 10: hours per day in April; Appliance 10: hours per day in May; Appliance 10: hours per day in June; Appliance 10: hours per day in July; Appliance 10: hours per day in August; Appliance 10: hours per day in September; Appliance 10: hours per day in October; Appliance 10: hours per day in November; Appliance 10: hours per day in December; Appliance 11: power of one unit (0 leaves the row out) [W]; Appliance 11: number of units; Appliance 11: hours of use per day; Appliance 11: share of its rating drawn while on (%); Appliance 11: months of use per year (12 = all year); Appliance 11: hours of use per day in the months not in use (0 = none); Appliance 11: hours pattern; Appliance 11: hours per day in January; Appliance 11: hours per day in February; Appliance 11: hours per day in March; Appliance 11: hours per day in April; Appliance 11: hours per day in May; Appliance 11: hours per day in June; Appliance 11: hours per day in July; Appliance 11: hours per day in August; Appliance 11: hours per day in September; Appliance 11: hours per day in October; Appliance 11: hours per day in November; Appliance 11: hours per day in December; Appliance 12: power of one unit (0 leaves the row out) [W]; Appliance 12: number of units; Appliance 12: hours of use per day; Appliance 12: share of its rating drawn while on (%); Appliance 12: months of use per year (12 = all year); Appliance 12: hours of use per day in the months not in use (0 = none); Appliance 12: hours pattern; Appliance 12: hours per day in January; Appliance 12: hours per day in February; Appliance 12: hours per day in March; Appliance 12: hours per day in April; Appliance 12: hours per day in May; Appliance 12: hours per day in June; Appliance 12: hours per day in July; Appliance 12: hours per day in August; Appliance 12: hours per day in September; Appliance 12: hours per day in October; Appliance 12: hours per day in November; Appliance 12: hours per day in December
- Outputs: Connected load (all units, rated) [kW]; Average power over the day [kW]; Energy per day [kWh]; Energy per month [kWh]; Energy per year [kWh]; Cost per day; Cost per month; Cost per year; Largest energy user (appliance number); Largest user share of the total (%); Appliance 1 energy per month [kWh]; Appliance 2 energy per month [kWh]; Appliance 3 energy per month [kWh]; Appliance 4 energy per month [kWh]; Appliance 5 energy per month [kWh]; Appliance 6 energy per month [kWh]; Appliance 7 energy per month [kWh]; Appliance 8 energy per month [kWh]; Appliance 9 energy per month [kWh]; Appliance 10 energy per month [kWh]; Appliance 11 energy per month [kWh]; Appliance 12 energy per month [kWh]; Appliance 1 cost per month; Appliance 2 cost per month; Appliance 3 cost per month; Appliance 4 cost per month; Appliance 5 cost per month; Appliance 6 cost per month; Appliance 7 cost per month; Appliance 8 cost per month; Appliance 9 cost per month; Appliance 10 cost per month; Appliance 11 cost per month; Appliance 12 cost per month; Appliance 1 share of the total (%); Appliance 2 share of the total (%); Appliance 3 share of the total (%); Appliance 4 share of the total (%); Appliance 5 share of the total (%); Appliance 6 share of the total (%); Appliance 7 share of the total (%); Appliance 8 share of the total (%); Appliance 9 share of the total (%); Appliance 10 share of the total (%); Appliance 11 share of the total (%); Appliance 12 share of the total (%)
- Assumptions: Each row is one kind of appliance: n identical units, each drawing the stated power, for the stated hours a day, every day of the period; The share of rating is the average fraction of the entered power actually drawn while the appliance is on. Rated power, connected load, average power and maximum demand are different quantities and are not interchangeable; One flat tariff per kWh: no slabs, fixed charge, demand charge, time-of-use rate, duty or tax; The monthly figure uses the days entered (30 by default) for a month in which every appliance is in use. The yearly figure uses 365 days and, for each appliance, only the months of use per year you enter (12 by default), so twelve monthly figures do not add up to the year unless the days entered are 30.42 and every appliance runs all year; Seasonal use has two levels per appliance: the hours a day in its months of use, and (optionally) a lower number of hours a day in the remaining months. Whole months only. Alternatively set the hours pattern of a row to enter hours per day for each of the twelve months; the yearly energy is then the sum of each month’s hours × the days of that calendar month (365 days in all), and the months of use and other-month fields of that row are ignored. The daily and monthly results still use the hours-per-day field
- Notes: A compressor load such as a refrigerator or an air conditioner cycles on and off, so entering its rated power for 24 hours overstates the energy. Enter a measured average power, or reduce the share of its rating drawn. The total is the energy cost of the appliances you listed at one flat rate, not your bill: a real bill adds slab rates, fixed charges, duty and tax. To turn the monthly units into a bill, use Electricity Bill from Tariff Slabs. If the listed total is well below your meter reading, an appliance is missing or the hours are too low.
- Independent vectors in the test suite: 30
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Electricity Cost Planner (Appliances to Monthly Bill to Replacement Saving) (`electricity-cost-planner`)

- Formula: `Step 1: monthly energy E = Σ n × P × share × hours × days (Multiple Appliance Electricity Cost) Step 2: bill = slab energy charge + fixed charge, then duty and tax, plus other charges (Electricity Bill from Meter Readings, units = E); or, for a time-of-use tariff, E split into peak, shoulder and off-peak at the shares entered, plus billed demand × demand rate (Time-of-Use and Demand-Charge Bill) Step 3: replacement saves dE = n × (Pold × share × hours − Pnew × share × hours) × days; bill after = bill at (E − dE) units; saving = bill − bill after Payback = investment / bill saving per month Net = saving × 12 × life − investment`
- Inputs: Days in the billing month; Currency symbol on the results; Appliance 1: power of one unit (0 leaves the row out) [W]; Appliance 1: number of units; Appliance 1: hours of use per day; Appliance 1: share of its rating drawn while on (%); Appliance 2: power of one unit (0 leaves the row out) [W]; Appliance 2: number of units; Appliance 2: hours of use per day; Appliance 2: share of its rating drawn while on (%); Appliance 3: power of one unit (0 leaves the row out) [W]; Appliance 3: number of units; Appliance 3: hours of use per day; Appliance 3: share of its rating drawn while on (%); Appliance 4: power of one unit (0 leaves the row out) [W]; Appliance 4: number of units; Appliance 4: hours of use per day; Appliance 4: share of its rating drawn while on (%); Appliance 5: power of one unit (0 leaves the row out) [W]; Appliance 5: number of units; Appliance 5: hours of use per day; Appliance 5: share of its rating drawn while on (%); Appliance 6: power of one unit (0 leaves the row out) [W]; Appliance 6: number of units; Appliance 6: hours of use per day; Appliance 6: share of its rating drawn while on (%); Appliance 7: power of one unit (0 leaves the row out) [W]; Appliance 7: number of units; Appliance 7: hours of use per day; Appliance 7: share of its rating drawn while on (%); Appliance 8: power of one unit (0 leaves the row out) [W]; Appliance 8: number of units; Appliance 8: hours of use per day; Appliance 8: share of its rating drawn while on (%); Appliance 9: power of one unit (0 leaves the row out) [W]; Appliance 9: number of units; Appliance 9: hours of use per day; Appliance 9: share of its rating drawn while on (%); Appliance 10: power of one unit (0 leaves the row out) [W]; Appliance 10: number of units; Appliance 10: hours of use per day; Appliance 10: share of its rating drawn while on (%); Appliance 11: power of one unit (0 leaves the row out) [W]; Appliance 11: number of units; Appliance 11: hours of use per day; Appliance 11: share of its rating drawn while on (%); Appliance 12: power of one unit (0 leaves the row out) [W]; Appliance 12: number of units; Appliance 12: hours of use per day; Appliance 12: share of its rating drawn while on (%); Tariff type; Slab billing method; Slab 1 upper limit (units); Slab 2 upper limit (units); Slab 3 upper limit (units); Slab 1 rate per kWh; Slab 2 rate per kWh; Slab 3 rate per kWh; Slab 4 rate per kWh; Fixed monthly charge; Electricity duty (% of energy and fixed charge); Tax (% of energy and fixed charge); Other charges (fixed amount, added at the end); Time-of-use: share of the list energy used at peak (%); Time-of-use: share used in the shoulder period (%), the rest is off-peak; Time-of-use: peak rate per kWh; Time-of-use: shoulder rate per kWh; Time-of-use: off-peak rate per kWh; Demand: recorded maximum demand (kW); Demand: contract demand (kW); Demand: minimum billed demand (% of contract demand); Demand: charge per kW per month; Time-of-use split; Time-of-use, appliance 1: share of its energy at peak (%); Time-of-use, appliance 1: share in the shoulder period (%); Time-of-use, appliance 2: share of its energy at peak (%); Time-of-use, appliance 2: share in the shoulder period (%); Time-of-use, appliance 3: share of its energy at peak (%); Time-of-use, appliance 3: share in the shoulder period (%); Time-of-use, appliance 4: share of its energy at peak (%); Time-of-use, appliance 4: share in the shoulder period (%); Time-of-use, appliance 5: share of its energy at peak (%); Time-of-use, appliance 5: share in the shoulder period (%); Time-of-use, appliance 6: share of its energy at peak (%); Time-of-use, appliance 6: share in the shoulder period (%); Time-of-use, appliance 7: share of its energy at peak (%); Time-of-use, appliance 7: share in the shoulder period (%); Time-of-use, appliance 8: share of its energy at peak (%); Time-of-use, appliance 8: share in the shoulder period (%); Time-of-use, appliance 9: share of its energy at peak (%); Time-of-use, appliance 9: share in the shoulder period (%); Time-of-use, appliance 10: share of its energy at peak (%); Time-of-use, appliance 10: share in the shoulder period (%); Time-of-use, appliance 11: share of its energy at peak (%); Time-of-use, appliance 11: share in the shoulder period (%); Time-of-use, appliance 12: share of its energy at peak (%); Time-of-use, appliance 12: share in the shoulder period (%); Demand after the replacement (kW, 0 keeps the recorded demand); Appliance to replace (row number, 0 for none); Replacement: power of one new unit [W]; Replacement: hours of use per day; Replacement: share of its rating drawn while on (%); Replacement: cost of one new unit; Replacement: other cost of the change (installation, disposal), total; Replacement: life of the new equipment (years)
- Outputs: Energy per month (the list) [kWh]; Energy per year (the list) [kWh]; Largest energy user (appliance number); Largest user share of the total (%); Energy charge; Fixed monthly charge; Electricity duty; Tax; Billed demand (kW, time-of-use tariff); Demand charge (time-of-use tariff); Total bill for the month; Average cost per kWh (total bill / units); Twelve bills like this one; Energy saved by the replacement per month [kWh]; Energy saved (% of the list); Total bill for the month after the replacement; Bill saved per month; Bill saved per year (twelve bills); Total investment; Simple payback (months); Simple payback (years); Net saving over the life (not discounted)
- Assumptions: Each appliance row is n identical units drawing the share of their rating entered, for the hours entered, every day of the billing month; The units billed are exactly the energy of the list. A real meter also records appliances that are not in the list, so a printed bill is usually higher: enter the meter units in Electricity Bill from Meter Readings to compare; The bill uses one set of slabs for the month, with a fixed monthly charge, duty and tax as percentages of energy and fixed charge, and other charges added at the end. No sanctioned-load charge, per-unit surcharge, subsidy or rebate. A time-of-use tariff splits the list energy by one set of peak and shoulder shares, or by a share for each appliance if you choose that, so a share is a fixed fraction of the energy of an appliance, not a schedule of hours; the recorded demand is an input from the meter, not worked out from the list. After a replacement the energy saved is taken off in the shares of the replaced appliance (or of the whole list); The saving is the difference between two bills, so it uses the slab the replaced energy was billed at. It is therefore not simply the saved kWh times the average rate; Annual figures are twelve bills like this one, not a seasonal profile; for seasonal or monthly hours use Multiple Appliance Electricity Cost for the yearly energy; Payback and net saving are simple and not discounted; they ignore tariff change, maintenance and any difference in the service the equipment gives
- Notes: Slab tariffs make the saving depend on where the household sits in the slabs: removing units from the highest slab saves at the highest rate. Check the slab limits and rates against your tariff order or your printed bill, and whether your utility bills telescopically. A replacement is only a like-for-like saving if it gives the same cooling, light or output. For a printed bill that is far above the list, an appliance is missing, the hours are low, or the tariff has charges this planner does not model.
- Independent vectors in the test suite: 41
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Maximum Demand (`maximum-demand`)

- Formula: `MD = connected × demand factor / diversity factor S = MD / pf`
- Inputs: Connected load [kW]; Demand factor; Diversity factor; Power factor
- Outputs: Maximum demand [kW]; Maximum demand [kVA]
- Assumptions: Demand factor = max demand ÷ connected load for each group; Diversity factor ≥ 1 reflects groups peaking at different times
- Notes: Use factors from your project specification or standard; the defaults are only examples.
- Independent vectors in the test suite: 15
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Load Factor Calculator (Load Factor, Demand Factor, Diversity Factor and Maximum Demand) (`load-factor`)

- Formula: `Maximum demand Pmd = connected load × demand factor (or measured) Average demand Pavg = energy / hours\nLoad factor = Pavg / Pmd = energy / (Pmd × hours) Demand factor = Pmd / connected load\nDiversity factor = sum of individual maximum demands / Pmd`
- Inputs: Connected load [kW]; Demand factor (used when no measured maximum demand is entered); Measured maximum demand (optional) [kW]; Energy used in the period [kWh]; Length of the period [h]; Sum of the individual maximum demands (optional) [kW]
- Outputs: Maximum demand [kW]; Demand factor (maximum demand / connected load); Average demand (energy / hours) [kW]; Load factor (average / maximum demand); Load factor (%); Peak above the average (maximum − average demand) [kW]; Energy at the maximum demand for the whole period [kWh]; Share of that energy not used (%); Diversity factor (sum of individual maxima / group maximum)
- Assumptions: The energy and the maximum demand cover the same period and the same point of supply; The maximum demand is the highest average over the utility demand interval (often 15 or 30 minutes), not an instantaneous peak; The load factor is at most 1 and the diversity factor is at least 1; a result outside these is rejected or flagged; The demand factor is user data; the calculator does not supply code values
- Notes: A low load factor means the supply and the demand charge are sized for a peak that is rare; moving or spreading load, or peak-shaving, raises it. A load factor over about 0.9 means a flat load that leaves little room to add load without raising the peak. Use the same period for the energy and the maximum demand: a month of energy with a year-high peak gives a load factor that is too low.
- Independent vectors in the test suite: 24
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Equipment Loss Calculator (Transformer, Motor and Cable Energy Loss and Cost) (`equipment-loss`)

- Formula: `Transformer: Pt = Pfe + x² Pcu η = x S pf / (x S pf + Pt) Et = Pfe Hte + x² Pcu Htl\nMotor: Ploss,r = Pr (1/ηr − 1) Pf = share × Ploss,r Pv = Ploss,r − Pf at load y: Pm = Pf + Pv y² η = y Pr / (y Pr + Pm) Em = Pm Hm\nCable: Pc = 3 I² R L (three-phase) or 2 I² R L (single-phase) Ec = Pc Hc\nTotal: Etot = Et + Em + Ec Cost = Etot × tariff`
- Inputs: Transformer rating [kVA]; Transformer no-load (iron) loss [kW]; Transformer full-load (copper) loss [kW]; Transformer average loading (fraction of rating); Power factor; Transformer energised hours per year; Transformer hours per year at this loading; Motor rated shaft output [kW]; Motor efficiency at full load (%); Motor fixed losses as a share of the full-load loss (%); Motor shaft load (% of rated); Motor running hours per year; Cable load current [A]; Cable route length [m]; Cable conductor resistance [Ω/km]; Cable system voltage (L-L) [V]; Phase; Cable carrying hours per year; Energy tariff (per kWh)
- Outputs: Transformer iron loss [kW]; Transformer copper loss at this loading [kW]; Transformer total loss at this loading [kW]; Transformer efficiency at this loading (%); Motor fixed loss [kW]; Motor load-dependent loss at this load [kW]; Motor total loss at this load [kW]; Motor efficiency at this load (%); Cable loss [kW]; Cable loss as a share of the power it carries (%); Total loss of the three at these loads (all running together) [kW]; Transformer energy lost per year [kWh]; Motor energy lost per year [kWh]; Cable energy lost per year [kWh]; Total energy lost per year [kWh]; Transformer share of the yearly loss (%); Motor share of the yearly loss (%); Cable share of the yearly loss (%); Share of the yearly loss that is fixed (transformer iron, motor core and friction) (%); Cost of the yearly loss
- Assumptions: The transformer is loaded at one average fraction of its rating for the loaded hours and carries only its iron loss for the rest of the energised hours; copper loss is taken to vary with the square of the load; The motor uses the usual two-part loss model: a fixed part (core, friction and windage) and a part that rises with the square of the load. The fixed share is an estimate unless you have a no-load test; The cable carries one steady current for its carrying hours; its resistance is the AC value at operating temperature, the load is balanced and neutral current is ignored; The three items are independent: the motor and cable do not share the transformer's load, and the loss in each is not added to the load of another. The total in kW is what the three lose when all run at their stated loads at once; Constant voltage and frequency; no harmonic losses, no stray or eddy losses in the transformer beyond the data-sheet figures, no loss in switchgear, busbars, capacitors or other equipment
- Notes: Use this to see which item in a supply chain wastes the most energy and how much of it is there whatever the load. The transformer's iron loss runs for every energised hour, so a lightly loaded or spare transformer can lose more energy than its copper loss suggests, and the motor's fixed loss does the same when it runs at light load. For each part in more detail use the Transformer Efficiency, Motor Efficiency and Cable Power Loss calculators. Loss figures from a test report refer to the reference conditions that report states; real losses change with temperature and with harmonics.
- Independent vectors in the test suite: 38
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Energy Savings Estimator (Motors, Lighting and Distribution Losses: Savings, Payback and Net Present Value) (`energy-savings`)

- Formula: `Motors: E = n × Pshaft × (1/ηold − 1/ηnew) × hours Lighting: E = n × (Wold × h − Wnew × h × (1 − controls %)) Distribution: E = (loss before − loss after) × hours S1 = total E × tariff simple payback = investment / (S1 + maintenance) PV = S1 × Σ (1 + e)^(t−1) / (1 + d)^t for t = 1 to life, plus maintenance × Σ 1 / (1 + d)^t NPV = PV − investment SIR = PV / investment CO₂ = E × emission factor`
- Inputs: Energy tariff (per kWh); Yearly rise in the tariff (%); Discount rate (%); Analysis life (years); Grid emission factor (kg CO₂ per kWh); Yearly maintenance saving, all measures (currency); Motors: number of motors replaced (0 to leave out); Motors: shaft output of each at its average load [kW]; Motors: efficiency of the existing motor at that load (%); Motors: efficiency of the new motor at that load (%); Motors: running hours per year; Motors: installed cost of each new motor (currency); Lighting: number of fittings replaced (0 to leave out); Lighting: existing fitting power including control gear [W]; Lighting: new fitting power including driver [W]; Lighting: burning hours per year (existing); Lighting: hours cut by controls on the new fittings (%); Lighting: installed cost of each new fitting (currency); Distribution: include a loss reduction?; Distribution: losses before [kW]; Distribution: losses after [kW]; Distribution: hours per year the loss occurs; Distribution: total cost of the measure (currency)
- Outputs: Motors: energy saved per year [kWh]; Lighting: energy saved per year [kWh]; Distribution: energy saved per year [kWh]; Total energy saved per year [kWh]; Share of the covered equipment's energy that is saved (%); Cost saved in the first year (energy and maintenance); Total investment; Simple payback (years); Present value of the savings over the life; Net present value (present value less investment); Savings to investment ratio; Carbon dioxide avoided per year (tonnes)
- Assumptions: Each measure runs the stated hours at the stated load every year, with the same savings in every year (no ageing, no change of use); Savings are taken at the end of each year and the investment is spent at the start (year 0); the energy tariff rises at the stated yearly rate and maintenance saving does not; Energy tariff only: demand or capacity charges, power factor penalties and taxes are not included, and no residual value, financing, tax, inflation of costs or replacement cost during the life is included; Motor savings assume the same shaft load and hours before and after, and the efficiencies are those at that load; a change of speed or load (a variable-speed drive) is not modelled; Lighting savings are the difference in connected power at the stated hours, plus the controls cut on the new fittings; a change in light output or the heat effect on air conditioning is not included; The distribution saving is a loss reduction in kilowatts that you supply; the calculator does not work out the loss; The grid emission factor is an average; the saving in carbon is the energy saved times that factor
- Notes: Use this to compare measures at an early stage and to see which of them carry the saving. Check the biggest saving first: it usually comes from the equipment that runs for the most hours. The result is only as good as the load and hour figures, so measure them where you can. Present value and the savings to investment ratio add the effect of time and the rising tariff to the simple payback; a value of the ratio above 1 means the present value of the savings is more than the investment. Check the final choice against quotations and a measured baseline.
- Independent vectors in the test suite: 34
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

### Motor Efficiency, Losses and Load Assessment Calculator (Efficiency Curve, Load from Input Power or Slip, Annual Loss Cost) (`motor-efficiency-loss`)

- Formula: `Full-load loss Ploss,r = Pr (1 / ηr − 1) Fixed loss Pf = share × Ploss,r (or the no-load input) Load-dependent loss Pv = Ploss,r − Pf At load fraction x: Pout = x Pr Ploss = Pf + Pv x² Pin = Pout + Ploss η = Pout / Pin Peak efficiency at x = √(Pf / Pv) Load from input power: Pv x² + Pr x + Pf − Pin = 0 Load from slip: x = (Ns − N) / (Ns − Nr) Saving = Pout (1 / η − 1 / η2) × hours × tariff`
- Inputs: Find the load; Rated shaft output [kW]; Efficiency at full load (%); Fixed losses as a share of the full-load loss (%); No-load input power (optional) [kW]; Shaft load (% of rated) (first case); Measured input power (second case) [kW]; Synchronous speed (third case) [rpm]; Rated (nameplate) speed (third case) [rpm]; Measured speed (third case) [rpm]; Operating hours per year; Energy tariff (per kWh); Efficiency of a replacement motor at the same load (%) (optional)
- Outputs: Shaft output at this load [kW]; Electrical input [kW]; Total loss [kW]; Efficiency at this load (%); Load as a percentage of rated (%); Fixed loss (core, friction and windage) [kW]; Load-dependent loss at this load (winding and stray) [kW]; Efficiency at 100% load (%); Efficiency at 75% load (%); Efficiency at 50% load (%); Efficiency at 25% load (%); Load at peak efficiency, √(fixed / load-dependent loss) (% of rated); Peak efficiency (%); Energy drawn per year at this load [kWh]; Energy lost in the motor per year [kWh]; Cost of the losses per year; Input power saved by the replacement [kW]; Energy saved per year [kWh]; Money saved per year
- Assumptions: Fixed loss (core, friction and windage) does not change with load, and the other loss (winding I²R and stray load loss) rises with the square of the load. This is the usual two-part loss model; real stray load loss and the slip of the rotor are not separated; The full-load efficiency and the fixed share are your data. Without a no-load test the fixed share is an estimate, and the efficiency at light load depends on it; Loading from the input power uses the same loss model, so it is only as good as the fixed share and the rated efficiency. Measure the input power at about rated voltage; The slip method assumes rated voltage and a motor at working temperature: slip rises as the square of a low supply voltage, and the method is poor below about 20% load; A balanced three-phase induction motor at constant rated voltage and frequency. A motor on a variable-speed drive has drive losses and a different loss split, which are not included; The replacement is compared at the same shaft load and the same hours; its price and payback, and any speed difference between motors, are not included
- Notes: Use this to see whether a motor is well matched to its load. A standard induction motor is at its best between about 60 and 100% load, and falls off below about 40 to 50%, so an oversized motor wastes energy as fixed loss and also runs at a poor power factor. Read the load from the measured input power where you can: it is more reliable than the slip method or the current ratio. A motor near or beyond 100% load needs its temperature rise checked. For a rated current at a given power use the Motor Full-Load Current calculator, and for the cost of energy over a year use the Energy Audit calculator.
- Independent vectors in the test suite: 45
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

### VFD Frequency and Motor Speed Calculator (V/f Control) (`vfd-speed`)

- Formula: `Synchronous speed Ns = 120 × f / p Rated slip speed Δn = 120 × fb / p − Nr (held constant) Shaft speed N = Ns − Δn Frequency for a speed f = p × (N + Δn) / 120 Voltage V = Vb × f / fb up to fb, then V = Vb Flux = (V / f) ÷ (Vb / fb) Rated torque Tr = 60 × Pr / (2π × Nr) Up to fb: T = Tr Above fb: P = Pr, T = 60 × P / (2π × N)`
- Inputs: Motor rated (base) frequency [Hz]; Motor rated voltage [V]; Number of poles; Rated shaft speed (nameplate) [rpm]; Rated shaft power [kW]; What to find; Drive output frequency (used for the first choice) [Hz]; Target shaft speed (used for the second choice) [rpm]
- Outputs: Drive output frequency [Hz]; Synchronous speed at that frequency [rpm]; Shaft speed [rpm]; Shaft speed as a percentage of rated speed; Slip speed (held at its rated value) [rpm]; Slip at this frequency (%); Drive output voltage (V/f control) [V]; Volts per hertz; Motor flux as a percentage of rated; Torque the motor can deliver [N·m]; Shaft power at that torque and speed [kW]
- Assumptions: The drive runs under open-loop V/f control: the voltage rises in proportion to the frequency up to the base frequency and stays at the rated voltage above it; The slip speed (synchronous minus shaft speed) is held at its rated value, which is the usual approximation for a motor at constant flux and the same torque; the real slip changes a little with load, and a given load torque gives a different speed; Below the base frequency the torque is the rated torque (constant flux, constant torque); above it the motor is in field weakening at the rated power, so the torque falls as the speed rises; The motor is taken at its rated current in those regions; torque at light load or a low-frequency voltage boost is not modelled; Cooling of a self-ventilated motor at low speed, the drive current limit, the motor pull-out torque and the maximum mechanical speed are not checked
- Notes: Use this to find the frequency a drive should be set to for a required speed, to read off the speed at a chosen frequency, or to see how much torque and power the motor keeps at reduced and increased speed. At low frequency a self-cooled motor may need a derating or a separate fan, and above the base frequency the torque capability falls with speed. Confirm the limits with the motor and drive data sheets.
- Independent vectors in the test suite: 41
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Star-Delta Starting (`star-delta-starting`)

- Formula: `IDOL = k × In Istar = IDOL / 3 Tstar = TDOL / 3`
- Inputs: Motor rated current [A]; Locked-rotor current ratio (ILR / In); Motor rated torque [N·m]; Locked-rotor torque ratio (TLR / Tn); Load torque at start [N·m]
- Outputs: DOL starting current [A]; Star starting line current [A]; DOL starting torque [N·m]; Star starting torque [N·m]
- Assumptions: Motor is delta-connected at its rated line voltage; Supply voltage stays constant; Switching transient peak is not included
- Notes: Star-delta cuts both current and torque to one third. It only suits loads that start with low torque, such as unloaded fans and pumps with a closed valve.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Synchronous Motor Calculator (Speed, Back EMF, Load Angle, Torque, Reactive Power and Pull-out Power) (`synchronous-motor`)

- Formula: `Ns = 120 f / poles V = VL / √3 Ia = P / (√3 VL cos φ) Q = P tan φ (− if leading)\nEb = V − Ia (Ra + j Xs) (phasors, Ia at −φ lagging or +φ leading) Eb = |Eb| δ = −arg(Eb)\nPcu = 3 Ia² Ra Pd = P − Pcu T = Pd / (2π Ns / 60)\nZs = √(Ra² + Xs²) θ = atan(Xs / Ra) Pd(δ) = 3 [V Eb cos(θ − δ) − Eb² cos θ] / Zs Pmax = Pd at δ = θ = 3 Eb (V − Eb cos θ) / Zs`
- Inputs: Electrical input power [kW]; Terminal line voltage [V]; Number of poles; Supply frequency [Hz]; Power factor; Power factor type; Armature resistance Ra per phase [Ω]; Synchronous reactance Xs per phase [Ω]
- Outputs: Synchronous speed Ns = 120 f / poles [rpm]; Terminal voltage per phase [V]; Line (armature) current [A]; Apparent power taken [kVA]; Reactive power (positive taken, negative supplied) [kVAR]; Back EMF (excitation voltage) per phase [V]; Back EMF, line to line equivalent (√3 × per phase) [V]; Back EMF / terminal voltage; Load angle δ (back EMF behind the terminal voltage, degrees); Armature copper loss [kW]; Developed (air-gap) power [kW]; Developed torque [N·m]; Pull-out (maximum developed) power at this excitation [kW]; Load angle at pull-out (degrees); Pull-out power / present developed power
- Assumptions: A cylindrical-rotor (round-rotor) machine with a constant synchronous reactance and constant excitation: saturation and the salient-pole reluctance torque are not included, so a salient-pole machine pulls out at a smaller angle than shown; Balanced three-phase supply at constant voltage and frequency, and the motor is taken as star connected (the equivalent star values are used for a delta winding); The developed power is the electrical input less the armature copper loss. Core loss, friction and windage, and the field excitation power are not taken off, so the shaft output and torque are lower than shown by those losses; The pull-out power is for the excitation found at this operating point held constant while the load is raised; with an automatic voltage regulator or a field current change the figure changes
- Notes: Use this to see what a given load and power factor need from the field: the back EMF above the terminal voltage means over-excited and supplying reactive power (leading), below it means under-excited and taking reactive power. The margin shows how far the machine is from losing synchronism if the load rises with the excitation fixed. For the generator side use the alternator calculator, and for an induction motor use the slip and starting calculators. The calculator does not size the starting method, the damper winding or the field supply.
- Independent vectors in the test suite: 33
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### DC Machine EMF and Torque Calculator (Motor or Generator) (`dc-machine-emf-torque`)

- Formula: `Ea = Φ Z N P / (60 A) Motor: Ea = V − Ia Ra − Vb, so N = 60 A Ea / (Φ Z P) Generator: V = Ea − Ia Ra − Vb ω = 2π N / 60 Te = Ea Ia / ω = (P Z / (2π A)) Φ Ia A = P (lap), A = 2 (wave)`
- Inputs: Operation; Number of poles P; Total armature conductors Z; Armature winding; Flux per pole Φ (mWb); Terminal voltage V (used for a motor) [V]; Speed N (used for a generator) [rpm]; Armature current Ia [A]; Armature circuit resistance Ra [Ω]; Total brush contact drop [V]
- Outputs: Parallel paths A; Generated EMF Ea (back EMF for a motor) [V]; Speed N [rpm]; Angular speed ω (rad/s); Terminal voltage V [V]; Electromagnetic torque Te [N·m]; Developed power Ea × Ia [kW]; Armature copper loss Ia² Ra [kW]; Brush contact loss Vb × Ia [kW]; Terminal power V × Ia [kW]; Armature-circuit efficiency (%)
- Assumptions: The EMF equation is for the generated voltage between the brushes with the flux per pole Φ taken as steady. Z is the total number of armature conductors and A the number of parallel paths: A = P for a simplex lap winding and A = 2 for a simplex wave winding. Duplex and other multiple windings are not covered; Ea is the voltage induced in the armature. For a motor it is the back EMF, found from the terminal voltage less the armature resistance drop and the brush drop; for a generator the terminal voltage is the EMF less the same drops; The torque is the electromagnetic (air-gap) torque Ea × Ia / ω. The shaft torque is a little less, because friction, windage and iron losses take some of it. The terminal power is the electrical power into the armature of a motor or out of the armature of a generator; The efficiency shown is that of the armature circuit only (copper and brush loss). It leaves out field-circuit loss, core loss, friction and windage, so the machine efficiency is lower; Armature reaction and saturation change the flux with load. Enter the flux per pole that applies at the working load and field current, from a magnetisation curve or a test; this calculator does not predict it; A motor speed is found from Ea and Φ, so a weak or lost field gives a very high speed. The speed result is only as good as the flux value entered
- Notes: Use this to find the speed a DC motor will run at for a given voltage, current and flux, to find the voltage a DC generator delivers at a given speed, and to find the torque for a given armature current. Both modes need the winding data (poles, conductors, lap or wave) and the flux per pole. If you know the nameplate speed and voltage instead, work back through the motor mode to find the flux you need. Compare the answer with the nameplate before relying on it.
- Independent vectors in the test suite: 45
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Motor Nameplate Calculator (Read and Check the Ratings of a Three-Phase Induction Motor) (`motor-nameplate`)

- Formula: `Ns = 120 f / p s = (Ns − N) / Ns fr = s f T = P / ω = 60 P / (2π N) Pin = P / η S = √3 V In Q = S sin φ Ical = P / (√3 V η cos φ) Delta: Vw = V, Iw = In / √3 Star: Vw = V / √3, Iw = In ILR = klr In Pmax = SF P I(Vs) = In V / Vs (constant output)`
- Inputs: Rated shaft output P (nameplate kW or HP) [kW]; Rated line voltage V [V]; Rated frequency f [Hz]; Number of poles; Rated speed N [rpm]; Rated current In [A]; Rated power factor cos φ; Rated efficiency η (%); Service factor SF; Locked-rotor current ratio ILR / In; Winding connection at this voltage; Supply line voltage you have, Vs [V]; Supply frequency you have, fs [Hz]; Measured running current Im (0 if not measured) [A]
- Outputs: Synchronous speed Ns = 120 f / p [rpm]; Rated slip s = (Ns − N) / Ns (%); Slip speed Ns − N [rpm]; Rotor current frequency s f [Hz]; Rated shaft torque T = P / ω [N·m]; Rated input power P / η [kW]; Rated losses P / η − P [kW]; Rated apparent power √3 V In (kVA); Rated reactive power √3 V In sin φ (kvar); Current from P, V, cos φ and η [A]; Nameplate current against that value (%); Efficiency implied by the plate current P / (√3 V In cos φ) (%); Voltage across each winding [V]; Current in each winding [A]; Locked-rotor current ILR = klr In [A]; Continuous output at the service factor, SF P [kW]; Torque at the service-factor output, at the rated speed [N·m]; Supply voltage against rated (%); Supply frequency against rated (%); Volts per hertz against rated (%); Synchronous speed at the supply frequency [rpm]; Current for the rated output at the supply voltage, In V / Vs [A]; Loading by current, Im / In (%), rough
- Assumptions: A three-phase induction motor on a balanced sinusoidal supply, and the nameplate values are those at rated output, rated voltage and rated frequency; The poles are the total number of poles (an even whole number) and the rated speed is the full-load rotor speed, below the synchronous speed; The nameplate current, power factor and efficiency should satisfy P = √3 V In cos φ η; a spread of a few per cent is normal because plates round their figures, so a spread above 5% is flagged; The winding voltage and current follow from the connection chosen: a delta winding carries the line voltage and In / √3, a star winding V / √3 and In; The service factor only scales the output (SF P); the current, temperature rise, efficiency and power factor at that output are not on the plate and are not calculated; At a supply voltage other than rated the current for the same output is taken as In V / Vs (constant power), a rough guide only because the power factor and efficiency also change; The loading estimate Im / In is a current ratio, not a power ratio: a lightly loaded motor draws far more than its load share of the rated current (the magnetising current), so the estimate overstates the load at light load
- Notes: The plate is the contract between the motor and the supply: it says what output the shaft can give for what voltage, frequency and current. Use this to read a plate, to check that its numbers are consistent before you size a cable, starter or protection from them, and to see what a different supply does. It does not read the insulation class, enclosure, duty type, temperature rise or efficiency class, and the standards that set those are not applied.
- Independent vectors in the test suite: 40
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Motor Selection and Load Calculator (Size a Three-Phase Induction Motor to a Driven Load and Check the Duty) (`motor-selection-load`)

- Formula: `Pm = Pl / ηt Pdes = Pm (1 + margin) Preq = Pdes / derating Psel = smallest standard rating ≥ Preq Tn = 60 Psel / (2π N) Tm = 60 Pm / (2π N) Tstart = kLR Tn (Vs / V)² Tbreak = b Tm Tbd = kbd Tn (Vr / V)² Tpeak = pk Tm tacc = (Jm + Jl / i²) (2π N / 60) / (kavg Tn (Vs / V)² − c Tm) Pin = Pm / η I = Pin / (√3 V cos φ)`
- Inputs: Power the driven machine needs at its shaft, Pl [kW]; Speed ratio of the drive, motor speed / load speed; Drive (coupling, gearbox, belt) efficiency (%); Design margin on the power (%); Derating factor of the motor (ambient, altitude, supply); Rated speed of the motor, N [rpm]; Locked-rotor torque, multiples of rated torque; Average motor torque while accelerating, multiples of rated torque; Breakdown (pull-out) torque, multiples of rated torque; Terminal voltage while starting (% of rated); Terminal voltage while running (% of rated); Breakaway torque of the load (% of its full-load torque); Average load torque while accelerating (% of full-load torque); Peak running load, multiples of the normal load; Torque margin you require over the load (%); Load inertia at the load shaft, Jl (kg·m²); Motor rotor inertia, Jm (kg·m²); Line voltage of the supply, V [V]; Motor efficiency at the operating load (%); Motor power factor at the operating load
- Outputs: Power the motor must deliver, Pl / ηt [kW]; Design power with the margin [kW]; Nameplate rating needed, design power / derating factor [kW]; Smallest standard rating that covers it [kW]; Loading, shaft power / rating (%); Loading of the derated output (%); Spare power at the derated output [kW]; Next smaller standard rating [kW]; Load on the derated output of that smaller size (%); Load shaft speed [rpm]; Load torque at the load shaft [N·m]; Load torque at the motor shaft [N·m]; Rated torque of the selected motor [N·m]; Starting torque available at the start voltage [N·m]; Breakaway torque of the load at the motor shaft [N·m]; Starting torque / breakaway torque; Peak running torque at the motor shaft [N·m]; Breakdown torque at the running voltage [N·m]; Breakdown torque / peak running torque; Total inertia at the motor shaft, Jm + Jl / ratio² (kg·m²); Average accelerating torque [N·m]; Time to accelerate to full speed [s]; Electrical input power at the operating load [kW]; Line current at the operating load [A]; Reactive power at the operating load (kvar)
- Assumptions: A three-phase cage induction motor on a balanced sinusoidal supply driving one machine at constant speed through a drive of constant efficiency; The motor is chosen from the IEC 60072 preferred output ratings (0.18 kW to 1,000 kW); the rated speed, the torque ratios, the efficiency and the power factor are entered once and taken as the same for the rating chosen and its neighbours; The margin, the derating factor and the torque margin are your figures; the common practice figures often used (a few tens of per cent) are not applied for you; Torque at start and at breakdown is taken as proportional to the square of the terminal voltage; the load torque is independent of the voltage; The acceleration time is the total inertia at the motor shaft times the final angular speed over a constant average accelerating torque, the motor average less the average load torque; it is a first estimate and the real time depends on the full torque and load curves; The loading uses the shaft power the load needs against the nameplate rating, and a second figure takes the derated output as the capacity; the input power and current use the efficiency and power factor you enter for that loading, which fall as the loading falls
- Notes: Selecting a motor is two questions. Is the rating large enough for the steady load, and can the motor get the load moving and up to speed, and ride through its peaks, on the voltage the supply really gives at the moment? Power alone answers only the first. A machine with a high breakaway torque or a large inertia can need a bigger motor, or a drive or starter, than its running power suggests, and a motor chosen far above the load runs at low efficiency and power factor. Use this to compare the standard sizes, to see how much margin each torque check has, and to find which check sets the size. It does not select an enclosure, insulation class, cooling, duty type, protection or cable, and no standard's sizing rule is applied.
- Independent vectors in the test suite: 40
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

### Transformer Parallel Operation Checker (Load Sharing, Circulating Current and Largest Load for Two Transformers) (`transformer-parallel`)

- Formula: `Yi = (Sn,i / zi) ∠ −atan(X/R)i Ys = Y1 + Y2 IL = S ∠ −φ\\nE1 = 1 ∠ 0 E2 = (1 + ε) ∠ −Δ Δ = (clock2 − clock1) × 30° Ic = (E1 − E2) Y1 Y2 / Ys\\nI1 = IL Y1 / Ys + Ic I2 = IL Y2 / Ys − Ic Si = |Ii| loading = Si / Sn,i\\nSimple share: S1 = S (Sn,1 / z1) / Σ(Sn / z)\\nLargest load: smallest S that gives |S u + c| = Sn,i, with u = ∠−φ Yi / Ys and c = ±Ic`
- Inputs: Vector group of unit 1; Unit 1 rating [kVA]; Unit 1 impedance (% on its own rating); Unit 1 X/R ratio; Vector group of unit 2; Unit 2 rating [kVA]; Unit 2 impedance (% on its own rating); Unit 2 X/R ratio; No-load secondary voltage of unit 2 above unit 1 (%); Total load to be supplied [kVA]; Load power factor (lagging)
- Outputs: Phase displacement difference between the units (°); Impedance difference (% of the lower impedance); Rating ratio (larger / smaller); Unit 1 share by the simple rating over impedance rule [kVA]; Unit 1 apparent power carried [kVA]; Unit 2 apparent power carried [kVA]; Unit 1 loading (% of its rating); Unit 2 loading (% of its rating); Unit 1 real power [kW]; Unit 2 real power [kW]; Unit 1 reactive power (positive delivered) [kVAR]; Unit 2 reactive power (positive delivered) [kVAR]; Circulating current (in kVA at rated voltage) [kVA]; Circulating current as % of unit 1 rating; Circulating current as % of unit 2 rating; Largest total load before a unit reaches 100% [kVA]; Largest load as % of the two ratings added; Unit that reaches 100% first (1 or 2); Largest load less the present load (negative if overloaded) [kVA]
- Assumptions: Two three-phase transformers with their primaries on the same supply and their secondaries on one common busbar, carrying a balanced load at a fixed lagging power factor; The percentage impedance of each unit is on its own rating and is taken at the tap position in use; each unit is a series impedance with an ideal transformer, with the magnetising branch ignored; The loading of a unit is its current divided by its rated current, with the busbar voltage taken as rated, so the voltage drop under load is not fed back into the shares; The ratio difference is the difference in no-load secondary voltage of the two units, and the vector groups differ only by their clock numbers (30° each). Groups that can be paralleled by reconnecting phases outside the transformer are not handled; The checks at 0.5% ratio difference, 10% impedance difference and a 3 to 1 rating ratio are common practice guidelines and are not clauses of a standard; follow the manufacturer and the utility for the limits that apply; The cable or busbar impedance between each transformer and the common busbar is not included; add it to the transformer impedance when it is not small
- Notes: Use this to see how a load divides between two transformers of different rating or impedance, and how much capacity is lost to the mismatch. The unit with the lower percentage impedance on its own rating takes more than its share and reaches 100% first, so the largest load is below the two ratings added. A voltage ratio difference sends a circulating current round the two windings that loads both units even with no load connected. A vector group (phase displacement) mismatch is not a small error: the circulating current is many times rated current, so the groups must match before paralleling. The calculator does not check the polarity or phase sequence of the connections, the tap changer ranges, the short-circuit rating of the busbar or the protection settings.
- Independent vectors in the test suite: 45
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Transformer Inrush Current Estimator (Peak Inrush, Rated Peak, Decay and Instantaneous Relay Setting Check) (`transformer-inrush`)

- Formula: `In = S / (√3 V) Ipeak = k In Irated peak = √2 In Ipeak / Irated peak = k / √2 Ipeak(t) = Ipeak e^(−t/τ) time to the rated peak = τ ln(k / √2) setting margin = Iset / Ipeak`
- Inputs: Transformer rating [kVA]; Voltage of the winding being energised (L-L) [V]; Inrush multiple of rated current (k); Decay time constant [s]; Time after energising to check [s]; Instantaneous overcurrent setting on this winding [A]
- Outputs: Rated current of the winding [A]; Rated peak current (rated current × √2) [A]; Peak inrush current (k × rated current) [A]; Peak inrush as a multiple of the rated peak; Time for the peak to fall to the rated peak [s]; Peak inrush remaining after the chosen time [A]; Setting as a multiple of the peak inrush; Setting as a multiple of rated current
- Assumptions: A three-phase transformer energised from the supply side with the other winding open; the multiple k is the highest peak of the three phases and is taken from the manufacturer for the side being energised; The peaks of successive cycles fall as an exponential with one time constant. Real inrush decays more slowly as the core comes out of saturation, so the decay shown is an estimate and a recording or the manufacturer curve should be used where the timing matters; The first peak depends on the point on the voltage wave at switching and on the residual flux, so the value of k is a worst-case multiple and not a prediction for one switching; The setting check compares the instantaneous pickup with the peak value of the inrush. Relays that measure the RMS of the fundamental, or that are restrained by second harmonic, can ride through a peak above the setting, and that is not modelled; The supply impedance, the other transformers on the same bus (sympathetic inrush) and the switching device are not modelled
- Notes: Use this to see how large the energising current of a transformer can be next to its rated current, and whether an instantaneous setting or fuse will be above it. The peak is several times the rated peak but lasts only a few cycles, so the usual answer is a setting above the peak, a short time delay, or second-harmonic restraint rather than a larger fuse. The multiple and the time constant are the two numbers that matter and both should come from the manufacturer. The calculator does not give the harmonic content, the thermal effect of a long inrush, or the effect on the voltage dip at the supply.
- Independent vectors in the test suite: 38
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Transformer OC and SC Test Calculator (`transformer-test-data`)

- Formula: `cos φ₀ = P₀ / (√3 V₀ I₀) Rc = a² V₀φ² / P₀φ Y₀ = I₀ / V₀φ, G = P₀φ / V₀φ², B = √(Y₀² − G²), Xm = a² / B R = Pscφ / Isc², Z = Vscφ / Isc, X = √(Z² − R²) Pcu = Psc (Irated / Isc)² E = |Vφ + x Irated (cos φ ∓ j sin φ)(R + jX)|, regulation = (E − Vφ) / Vφ η = x S pf / (x S pf + P₀ + x² Pcu) x_max = √(P₀ / Pcu) a = V1 / V2`
- Inputs: Rated power S [kVA]; Rated voltage, short-circuit (HV) side [V]; Rated voltage, open-circuit (LV) side [V]; Phases; Open-circuit test voltage V₀ [V]; Open-circuit test current I₀ [A]; Open-circuit test power P₀ [W]; Short-circuit test voltage Vsc [V]; Short-circuit test current Isc [A]; Short-circuit test power Psc [W]; Load for regulation and efficiency (% of rated); Load power factor; Load power factor type
- Outputs: Rated current, HV side (A); No-load power factor cos φ₀; Core-loss current Ic, LV side (A); Magnetising current Im, LV side (A); Core-loss resistance Rc, referred to HV [Ω]; Magnetising reactance Xm, referred to HV [Ω]; Series resistance R, HV side (per phase) [Ω]; Series reactance X, HV side (per phase) [Ω]; Series impedance Z, HV side (per phase) [Ω]; Resistance R (% on rating); Reactance X (% on rating); Impedance Z (% on rating); Core loss (constant) [kW]; Copper loss at rated current [kW]; Voltage regulation at the chosen load (%); Efficiency at the chosen load (%); Load for maximum efficiency (% of rated); Maximum efficiency at that load and the same power factor (%)
- Assumptions: Values are for the equivalent star: each phase carries the line voltage divided by √3 and one third of the total power. A single-phase transformer uses the readings as they are; The open-circuit test is taken on the LV side at rated voltage and the short-circuit test on the HV side at about rated current. The magnetising branch is referred to the HV side by the square of the voltage ratio a = V1 / V2, so both branches are on the same side; The core loss is taken as the open-circuit power as measured; it is not corrected if the test voltage is not rated, and a warning is shown if it is more than 5% away. The copper loss is scaled from the test current to rated current by the square of the current ratio; The series branch uses the short-circuit result alone, with the magnetising branch left out; this is the usual approximate equivalent circuit. The short-circuit resistance is the winding resistance at the test temperature, not corrected to a reference winding temperature; Regulation uses the exact phasor sum of the series drop, not the approximation; efficiency counts only the core and copper losses, so stray, dielectric and cooling losses are not included; Efficiency is highest at the load where the copper loss equals the core loss; the maximum efficiency is given at the same power factor as the chosen load
- Notes: Use this to work out the equivalent-circuit values and losses from a routine or type test, to find the per-unit impedance for a fault or parallel-operation study, and to check test results against the nameplate. Take both tests on the same winding temperature if you can, and compare the percentage impedance with the nameplate figure; a large difference points to a wrong reading or a wrong rating.
- Independent vectors in the test suite: 39
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Transformer Vector Group Calculator (Dyn11, Yd1, Yy0 and others) (`transformer-vector-group`)

- Formula: `Line voltage ratio a = VH / VL Winding voltage: delta Vw = V, star Vw = V / √3 Turns ratio N1 / N2 = VHw / VLw Line current I = S / (√3 V) Winding current: delta Iw = I / √3, star Iw = I Phase shift = clock number × 30° (low side lags) Link voltage = 2 sin(Δ / 2) × V`
- Inputs: Vector group; High-voltage line voltage VH (L-L) [kV]; Low-voltage line voltage VL (L-L) [V]; Rated power S [kVA]; Compare with a second group (to parallel with)
- Outputs: Line voltage ratio VH / VL; Turns ratio N1 / N2 (winding voltage ratio); Clock number; Low-voltage side lags high-voltage side by (°); High-voltage winding voltage [V]; Low-voltage winding voltage [V]; High-voltage line current [A]; Low-voltage line current [A]; High-voltage winding current [A]; Low-voltage winding current [A]; Phase difference between the two groups (°); Voltage across an open paralleling link (% of the low-voltage line voltage)
- Assumptions: A balanced three-phase transformer carrying its rated kVA, with VH and VL the rated no-load line-to-line voltages; In a delta winding the winding voltage is the line voltage and the winding current is the line current divided by √3; in a star winding the winding voltage is the line voltage divided by √3 and the winding current is the line current; The turns ratio is the ratio of the high-voltage winding voltage to the low-voltage winding voltage on one core limb, so it equals the line voltage ratio only for star-star and delta-delta groups; The clock number is the hour at which the low-voltage line phasor stands when the high-voltage line phasor is at twelve (IEC 60076-1 convention), with positive sequence; each hour is 30°; The comparison assumes both transformers have the same voltage ratio and the same phase sequence, and shows the voltage that would appear across the open paralleling link if the two secondaries had equal line voltages
- Notes: Use this to read a nameplate vector group, find the turns ratio and winding currents for a test or a design, or check the phase shift before two transformers are connected in parallel. The group alone does not make two transformers compatible: the voltage ratio, the percentage impedance and the tap positions also have to be close. Groups with the same phase displacement (for example Dyn11 and Yd11) can be paralleled, and a group with a different displacement cannot, without a connection change. A Yy group has no delta winding, so the third-harmonic magnetising current and the zero-sequence current of an unbalanced load have no path; check that the core type or a tertiary delta winding provides for them. The calculator gives the group's nominal angle only: it does not check the winding polarity, the actual lead connections, or the sequence of the supply.
- Independent vectors in the test suite: 61
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Transformer Turns Ratio Calculator (Voltage Ratio, Turns, Currents and Referred Impedance) (`transformer-turns-ratio`)

- Formula: `Winding voltage: Vw = V (single-phase, or three-phase delta) or V / √3 (three-phase star) Turns ratio a = Vwp / Vws Line ratio = Vp / Vs Secondary turns Ns = Np / a Volts per turn = Vwp / Np = Vws / Ns Line current I = S / (k V), k = 1 (single-phase) or √3 (three-phase) Winding current = I (star or single-phase) or I / √3 (delta) Referred impedance Z′ = a² ZL (the primary winding sees a squared ratio times the load)`
- Inputs: Phases; Primary winding connection (three-phase only); Secondary winding connection (three-phase only); Primary rated voltage [V]; Secondary rated voltage [V]; Rated apparent power [kVA]; Primary turns per phase; Load impedance across one secondary winding [Ω]
- Outputs: Line voltage ratio Vp / Vs; Turns ratio per phase (winding voltage ratio); Secondary turns per phase (exact); Secondary turns to build (nearest whole turn); Ratio error from rounding the turns (%); Volts per turn [V]; Rated primary line current [A]; Rated secondary line current [A]; Primary winding current [A]; Secondary winding current [A]; Load impedance referred to one primary winding [Ω]; Check: primary kVA minus secondary kVA [kVA]
- Assumptions: An ideal transformer: no magnetising current, no leakage reactance and no winding resistance, so the ratio of the no-load voltages equals the ratio of the turns; Rated voltages are taken as the no-load line voltages; under load the secondary voltage falls by the regulation, which this calculator does not include (use the transformer regulation calculator); A balanced three-phase transformer with three identical windings per side. The turns ratio is per phase, so it differs from the line voltage ratio when one side is delta and the other star (for example Dyn11 has a turns ratio √3 times the line ratio); Secondary turns must be a whole number in practice; the rounded value and the ratio error it causes are shown. Tapping ranges are not included; Phase shift and the vector group are not shown here (use the vector group calculator)
- Notes: Use this to find how many secondary turns a winding needs for a given primary, to check a nameplate, or to see how a load looks from the primary side. Note that for a delta-star transformer the turns ratio is not the line voltage ratio: 11000/415 V Dyn11 has a line ratio of 26.5 but a turns ratio of 45.9. The impedance a squared ratio times larger is what the supply sees for a given secondary load.
- Independent vectors in the test suite: 46
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

### Alternator EMF and Voltage Regulation Calculator (Synchronous Generator) (`alternator-emf`)

- Formula: `Frequency f = P n / 120 Slot angle γ = 180° / (3 q) Chording angle α = (3q − span) γ\nPitch factor Kp = cos (α / 2) Distribution factor Kd = sin (q γ / 2) / (q sin (γ / 2)) Winding factor Kw = Kp Kd\nEMF per phase E = 4.44 Kp Kd f Φ T (exactly √2 π Kw f Φ T) Star: EL = √3 E Delta: EL = E\nRegulation: E0 = |V + Ia (cos φ ∓ j sin φ)(Ra + j Xs)| Regulation = (E0 − V) / V × 100 (− lagging, + leading) Star: V = VL / √3, Ia = IL Delta: V = VL, Ia = IL / √3`
- Inputs: What to find; Number of poles (first choice); Rotor speed (first choice) [rpm]; Flux per pole Φ in mWb (first choice); Slots per pole per phase (first choice); Coil span in slots (first choice); Series turns per phase T (first choice); Winding connection; Rated terminal line voltage (second choice) [V]; Load line current (second choice) [A]; Load power factor (second choice); Load power factor type; Armature resistance Ra per phase (second choice) [Ω]; Synchronous reactance Xs per phase (second choice) [Ω]
- Outputs: Frequency f = poles × speed / 120 [Hz]; Total slots on the stator; Slot angle γ (electrical degrees); Short-pitch (chording) angle α (electrical degrees); Pitch factor Kp = cos (α / 2); Distribution factor Kd = sin (q γ / 2) / (q sin (γ / 2)); Winding factor Kp × Kd; EMF per phase with Kp = Kd = 1: 4.44 f Φ T [V]; Generated EMF per phase E = 4.44 Kp Kd f Φ T [V]; Generated EMF, line to line [V]; Terminal voltage per phase [V]; Armature current per phase [A]; Resistance drop Ia Ra per phase [V]; Reactance drop Ia Xs per phase [V]; No-load EMF per phase E0 [V]; No-load EMF, line to line [V]; Voltage regulation (E0 − V) / V (%); Angle of E0 ahead of the terminal voltage (degrees); Output apparent power [kVA]; Output real power [kW]
- Assumptions: A three-phase alternator with a sinusoidal flux in space, so the EMF is a sine wave; the 4.44 in the textbooks is the rounded value of √2 π = 4.4429 (4 times the form factor 1.11) and the exact value is used here, so a hand answer with 4.44 comes out about 0.06% lower; The number of slots per pole per phase is a whole number, so every phase group has the same coils; a fractional-slot winding is not covered. With a short-pitched coil, the coil span is counted in slots and the short pitch is a whole number of slots; The distribution and pitch factors apply to the fundamental only: harmonics are not calculated, and a skewed slot or a salient pole shape changes the factors slightly and is not included; Regulation by the synchronous impedance (EMF) method: a constant Xs and Ra per phase, no saturation, and the same field current at no load as is needed on load, so the result for a machine with saturation is usually higher than the true regulation (the method is pessimistic); the MMF and the Potier methods are not included; The regulation is the rise of the terminal voltage when the load is thrown off at the same field current and speed; it is negative for a leading load with a large enough capacitive component, which means the voltage falls when the load is removed; The no-load EMF in the second choice comes from the load values and is not linked to the winding EMF of the first choice, which has its own inputs
- Notes: Use the first choice for the EMF of a given winding or to see how a short pitch or a spread winding reduces it (the winding factor is the part of the conductor EMF that adds up), and the second for the no-load EMF a given load needs and for the regulation of a design. For the EMF of a single coil in a field, use the induced EMF calculator, and for the rating, use the generator selection calculator.
- Independent vectors in the test suite: 46
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

### BESS Energy and Power Calculator (MWh, MW, Round-Trip Efficiency and C-Rate) (`bess-energy-power`)

- Formula: `Eout = P × t η1 = √ηrt Edc = Eout / η1 Ein = Eout / ηrt Loss = Ein − Eout\nNameplate = Edc / (DoD × SOH) C(discharge) = (P / η1) / Nameplate C(charge) = (Edc / Tc) / Nameplate\nConverter kVA = P / pf Per year = Eout × cycles per day × 365 Years to cycle life = Ncyc / (cycles per day × 365)`
- Inputs: Power to deliver at the connection point (AC) [kW]; Duration at that power [h]; AC round-trip efficiency; Usable depth of discharge; Capacity at end of life (share of nameplate); Time available to recharge [h]; Battery maximum C-rate (1/h); Converter power factor at rated output; Full cycles per day; Cycle life at this depth of discharge
- Outputs: Energy delivered per discharge (AC) [kWh]; Energy drawn from the battery per discharge (DC) [kWh]; Energy taken from the grid to recharge (AC) [kWh]; Energy lost per cycle [kWh]; Nameplate energy required (holds the duration at end of life) [kWh]; Usable energy when new [kWh]; Nameplate energy to rated power ratio (hours); Battery DC power at discharge [kW]; Discharge C-rate (1/h); Grid power to recharge in the time given (AC) [kW]; Charge C-rate (1/h); Converter rating (power / power factor) [kVA]; Energy delivered per year [MWh]; Energy lost per year [MWh]; Years to reach the cycle life
- Assumptions: One full discharge at constant AC power for the whole duration, then one recharge in the time given; The AC round-trip efficiency is split equally between charge and discharge (one-way efficiency = √ηrt) and held constant; it is a single average figure, not a curve; The nameplate energy is sized so that, after the capacity falls to the end-of-life share and only the usable depth is drawn, the battery still delivers the duration; The C-rate limit applies to both directions and is taken against the nameplate energy; The auxiliary load (cooling, control) is part of the round-trip figure; there is no separate stand-by loss; A year is 365 days of the same cycling; the cycle life and the end-of-life share are user data for the depth of discharge used
- Notes: This is a first sizing of the energy and the power. It tells you the MWh and MW to ask for, and whether the C-rate and the recharge time are reasonable, before a manufacturer offer. The result does not model temperature, the change of efficiency with power or state of charge, degradation over the years, stand-by losses, the ramp rate or the grid code. Use the data sheet, the warranty and the project study for those.
- Independent vectors in the test suite: 38
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Railway Backup Load Calculator (Signalling and Telecom Standby Battery: Backup Energy, Battery Size, Charger and Runtime) (`railway-backup-load`)

- Formula: `Average load = Σ P × share Design load = average × (1 + growth) Power from battery = design load / η I = power from battery / V Ah taken = I × t Usable fraction = DoD × end-of-life capacity × low-temperature factor Nameplate Ah = Ah taken / usable fraction Nameplate kWh = Ah × V / 1000 Charger current = Ah taken / (recharge time × charge efficiency) + I Runtime = installed Ah × usable fraction / I`
- Inputs: DC bus voltage of the battery [V]; Load 1 (for example interlocking): connected power, W; Load 1: share drawn during the outage, %; Load 2 (for example trackside signals): connected power, W; Load 2: share drawn during the outage, %; Load 3 (for example telecom, GSM-R): connected power, W; Load 3: share drawn during the outage, %; Load 4 (for example point machines): connected power, W; Load 4: share drawn during the outage, %; Required backup time, h; Efficiency from the battery to the loads, %; Usable depth of discharge, %; Capacity at end of life, % of nameplate; Low-temperature capacity factor, %; Growth margin on the load, %; Recharge time, h; Charge efficiency (ampere-hours in ÷ out), %; Installed battery capacity to check, Ah (0 to skip)
- Outputs: Connected load, all groups at full power (W); Average load during the outage (W); Design load with growth margin (W); Power taken from the battery (W); Average battery current (A); Battery current with every group at full power (A); Ampere-hours taken from the battery over the backup time (Ah); Energy taken from the battery (kWh); Usable fraction of nameplate (depth of discharge × ageing × temperature); Nameplate battery energy needed (kWh); Nameplate battery capacity needed (Ah); Next standard battery size at or above it (Ah); Full-power battery current as a multiple of that size (C); Charger current to recharge in the set time and carry the loads (A); Charger output power at the bus voltage (kW); Runtime of the installed battery at the design load (h); Runtime margin over the required backup time (h, negative = short)
- Assumptions: The loads draw a constant average power over the whole backup time at the shares you enter; the calculator does not follow a load profile or the short peaks of point machines and other motors; The three capacity allowances (depth of discharge, end-of-life capacity and low-temperature factor) are your inputs from the battery data sheet and are multiplied together; no standard supplies them; The battery capacity is taken at the discharge rate of the backup time, with no Peukert or rate correction and no allowance for voltage falling towards the end of discharge or for the end-of-discharge voltage the loads can accept; The charger current is the ampere-hours taken, divided by the recharge time and the charge efficiency, plus the load current at the bus; a charger current limit, the float voltage and the charge profile are not modelled; The standard sizes are 50, 65, 80, 100, 120, 150, 200, 250, 300, 400, 500, 600, 800, 1000, 1500 and 2000 Ah, a convention to confirm against the product range you use
- Notes: The backup time and the loads that must be kept alive are set by the railway operator, not by this calculator, so take them from the project specification. Point machines, lamp proving and level-crossing barriers have peak currents that an average hides: the full-power battery current is shown with its C-rate so you can check the battery and the cables for those peaks separately. Battery capacity falls with cold, age and fast discharge, so use the data-sheet figure for the lowest temperature at the site rather than the rating at 20 °C. The calculator does not apply any railway standard or a signalling safety requirement (EN 50129, EN 50122, EN 50155, EN 50160 or a national rule); those and the product certification are checked separately.
- Independent vectors in the test suite: 42
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

### Overcurrent Relay Setting Calculator (Pick-up, TMS and High-set) (`relay-setting`)

- Formula: `Is = kpu × IL Relay secondary = Is × (CT secondary / CT primary) Plug setting = Is / CT primary × 100% M = I / Is t = TMS × k / (M^α − 1) TMS = t × (M^α − 1) / k TMS to set = exact TMS rounded up to the next relay step High-set = ki × downstream fault current`
- Inputs: Relay curve (IEC 60255-151); Maximum load current IL [A]; CT primary rating [A]; CT secondary rating; Pick-up factor over load current; Maximum fault current at the relay [A]; Minimum fault current at the end of the protected zone [A]; Required operating time at the maximum fault [s]; Relay TMS step (smallest increment); Relay maximum TMS; Fault current at the next device downstream (for the high-set) [A]; High-set factor over the downstream fault
- Outputs: Pick-up current Is (primary) [A]; Pick-up at the relay (CT secondary) [A]; Plug setting (% of CT rating); Plug setting multiplier at the maximum fault, Ifmax / Is; Time multiplier setting needed (exact); TMS to set (rounded up to the relay step); Operating time at the maximum fault with that TMS [s]; Achieved time minus required time (negative = too fast) [s]; Sensitivity at the minimum fault, Ifmin / Is; Operating time at the minimum fault [s]; High-set (instantaneous) pick-up (primary) [A]; High-set pick-up at the relay (CT secondary) [A]
- Assumptions: The IEC 60255-151 operating curve t = TMS × k / ((I / Is)^α − 1), with the constants of the chosen curve and a relay that follows the standard shape exactly; a relay maker may show a different curve, so use the maker's equation or chart for the final setting; The pick-up factor, the required time and the high-set factor are your design inputs (from the load, the grading study and your utility rule); this calculator does not choose them and does not grade one relay against another; The fault currents are primary amperes at the relay, taken as steady (the symmetrical RMS value), with the CT carrying them without saturating; The TMS is rounded up to the next multiple of the relay step (0.025 unless you change it), so the operating time at the maximum fault is never shorter than the time you asked for; rounding to the nearest step could pick a faster setting and cut the grading margin. If the exact TMS is above the relay maximum, the time you asked for cannot be reached and a warning says so
- Notes: Use this to find a first set of pick-up, TMS and high-set values for a feeder or transformer relay, to see how the pick-up looks at the relay terminals and as a plug setting, and to check the sensitivity and operating time at the minimum fault. The result is a starting point: the real setting comes from a co-ordination study that grades every relay against the next with the breaker time and the errors allowed for, and the sensitivity, the inrush, the starting current of motors and the thermal limit of the cable or transformer must be checked on your own data. The calculator does not cover earth-fault, directional or differential elements, and does not check the CT accuracy limit factor or burden (see the CT burden guide).
- Independent vectors in the test suite: 49
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Overcurrent Relay Coordination Calculator (Grading Margin and Upstream TMS) (`relay-coordination`)

- Formula: `M = I / Is t = TMS × k / (M^α − 1) Upstream time required = downstream time + grading margin TMSu = treq × (Mu^α − 1) / k Margin = upstream time − downstream time`
- Inputs: Downstream relay curve (IEC 60255-151); Downstream relay pick-up Is [A]; Downstream relay TMS; Upstream relay curve (IEC 60255-151); Upstream relay pick-up Is [A]; Fault current through both relays (grading fault) [A]; Lower fault current to check [A]; Grading margin (coordination time interval) [s]
- Outputs: Downstream plug setting multiplier, If / Isd; Downstream operating time at the grading fault [s]; Upstream time required (downstream time + margin) [s]; Upstream plug setting multiplier, If / Isu; Upstream TMS needed (exact); Upstream TMS to set (next 0.025 above); Upstream operating time with that TMS [s]; Margin you get at the grading fault [s]; Downstream multiplier at the lower fault, Ifl / Isd; Downstream operating time at the lower fault [s]; Upstream multiplier at the lower fault, Ifl / Isu; Upstream operating time at the lower fault [s]; Margin you get at the lower fault [s]
- Assumptions: The IEC 60255-151 operating curve t = TMS × k / ((I / Is)^α − 1) for both relays, with the constants of the chosen curves and relays that follow the standard shape exactly; a relay maker may show a different curve, so use the maker's equations or charts for the final settings; The grading margin is your design input (breaker opening time, relay overshoot, timing errors and a safety allowance); this calculator does not build it up and does not choose it; Both relays see the same fault current in primary amperes, taken as steady (the symmetrical RMS value), with the CTs carrying it without saturating; a transformer between them, an infeed or an outfeed is not modelled; The upstream TMS is rounded up to the next 0.025 so the margin at the grading fault is never below the one you asked for; use the step of your relay, and expect a different margin from the exact value; Only the overcurrent inverse-time element is graded: instantaneous (high-set), earth-fault, directional and definite-time stages are not
- Notes: Use this to set the upstream overcurrent relay so that it waits long enough for the downstream relay and its breaker to clear a fault, to see how much margin is left at a smaller fault where the two curves are further apart or closer together, and to find out if the upstream relay still gives back-up there. The result is a starting point: a real co-ordination study grades every relay pair on a time-current chart, over the whole range of fault current from the smallest to the largest, with the breaker time, the CT errors, any infeed and the thermal limits of the cable and transformer. The calculator grades one pair at one fault current (and checks one lower current); it does not draw the curves, and it does not cover earth-fault, directional or differential elements.
- Independent vectors in the test suite: 46
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### CT Burden Calculator (Lead Resistance, Total VA and Accuracy Limit) (`ct-burden`)

- Formula: `RL = ρ [1 + α (T − 20)] × (n × L) / A Rrelay = S(relay) / Is² Rtotal = RL + Rrelay + Rmeter + Rcontacts S = Is² × Rtotal ALF′ = ALF × (Sn + Is² Rct) / (S + Is² Rct) ALF needed = Ifmax / Ip Lmax = (Sn / Is² − Rrelay − Rmeter − Rcontacts) × A / (ρ [1 + α (T − 20)] × n)`
- Inputs: CT rated secondary current; CT rated burden Sn [VA]; Rated accuracy limit factor (ALF); CT secondary winding resistance Rct [Ω]; Lead cable length (one way) [m]; Lead cable conductor cross-section [mm²]; Resistivity at 20 °C (Ω·mm²/m); Lead cable temperature (°C); Temperature coefficient (per °C); Lead connection; Relay burden at rated current [VA]; Meter or other series burden at rated current [VA]; Contact and terminal resistance [Ω]; Maximum fault current (primary) [A]; CT primary rating [A]
- Outputs: Lead loop resistance [Ω]; Relay burden as resistance [Ω]; Meter burden as resistance [Ω]; Total external burden (resistance) [Ω]; Total external burden [VA]; Share of the rated burden used (%); Margin to the rated burden [VA]; CT internal burden, Is² × Rct [VA]; Actual accuracy limit factor at this burden; Accuracy limit factor the fault needs, Ifmax / Ip; Ratio of actual to needed (above 1 is a margin); Lead resistance left at the rated burden [Ω]; Longest lead cable (one way) at the rated burden [m]
- Assumptions: The burden is a resistance at power factor 1 (a lead cable and a relay with a small inductance); a relay or meter with a large inductive part, or a CT rated at power factor 0.8, needs the data sheet; The lead resistance is the DC resistance of one copper or aluminium conductor, with the temperature correction, multiplied by n = 2 (out and back) or n = 1 (balanced three-phase star fault with a common return); an earth-fault or single-phase fault always uses n = 2; The relay and meter burdens are taken at the rated secondary current; some relays have a burden that changes with current, so use the value at the fault current for the saturation check; The actual accuracy limit factor uses the standard relationship ALF′ = ALF × (Sn + Sct) / (S + Sct), which is valid for a CT that is not driven far past its knee and ignores the remanent flux and the DC offset of the fault current; The comparison with Ifmax / Ip is a first check only: it does not include the DC offset, the transient factor or the remanence that a protection CT specification (for example class TPS or TPY) adds
- Notes: Use this to check that a protection or metering CT can drive the cable and the relay or meter connected to it: the total burden must not exceed the rated burden, and a protection CT must still reproduce the fault current, so the actual accuracy limit factor must be above the one the maximum fault needs. A 1 A secondary has a lead burden 25 times lower than a 5 A secondary for the same cable, which is why long runs use 1 A. The result is a screening check: the real selection comes from the relay maker's CT requirement (a knee-point voltage, with the DC offset and the X/R ratio), and the calculator does not check measuring classes, knee-point voltage or the thermal and dynamic withstand of the CT.
- Independent vectors in the test suite: 48
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Protection Coordination Checker (Overcurrent Relay Pick-up Window, Sensitivity, Stability and Time Grading) (`protection-coordination-check`)

- Formula: `Stable on load: Is × reset ratio ≥ margin × IL, so Is ≥ lowest = margin × IL / reset ratio Sensitive: Imin / Is ≥ ks, so Is ≤ highest = Imin / ks Instantaneous stable: Iinst ≥ ki × Imax t = TMS × k / ((I / Is)^α − 1) for each relay, graded at Imax and at Imin: margin = upstream time − downstream time ≥ wanted margin`
- Inputs: Maximum load current of the feeder [A]; Margin on load current (overload and error allowance); Relay pick-up Is (downstream relay) [A]; Relay reset (drop-off) ratio; Smallest fault current at the far end of the zone [A]; Required sensitivity factor; Largest through-fault current (grading fault) [A]; Instantaneous (high-set) pick-up [A]; Instantaneous stability factor; Downstream relay curve (IEC 60255-151); Downstream relay TMS; Upstream relay curve (IEC 60255-151); Upstream relay pick-up Is [A]; Upstream relay TMS; Grading margin wanted (coordination time interval) [s]
- Outputs: Lowest pick-up that stays stable on load [A]; Highest pick-up that meets the sensitivity factor [A]; Load stability margin, pick-up / lowest stable pick-up (1 or more passes); Sensitivity factor, smallest fault / pick-up; Instantaneous stability factor, setting / largest through fault; Smallest fault as a multiple of the instantaneous setting (1 or more: it reaches the far end); Downstream operating time at the largest through fault [s]; Upstream operating time at the largest through fault [s]; Margin at the largest through fault [s]; Downstream operating time at the smallest fault [s]; Upstream operating time at the smallest fault [s]; Margin at the smallest fault [s]; Checks made; Checks failed
- Assumptions: Steady symmetrical RMS currents in primary amperes for the load, the smallest fault and the largest through fault, with the CTs carrying them without saturating; fault current decrement, DC offset (other than through the instantaneous factor), infeeds and outfeeds are not modelled; The IEC 60255-151 operating curve t = TMS × k / ((I / Is)^α − 1) for both relays with the constants of the chosen curves; a relay maker may show a different curve, so use the maker's equations or charts for the final settings; The load margin, reset ratio, sensitivity factor, instantaneous factor and grading margin are your design inputs; this calculator does not choose them and applies no utility or standard rule; The grading is checked at two currents only (the largest through fault and the smallest fault); a real study grades the whole range on a time-current chart. The instantaneous element is checked for stability and reach, not graded in time; Overcurrent (50/51) phase elements only: earth fault, directional, differential, thermal and cable or transformer withstand limits are not checked
- Notes: Use this as a first check of an overcurrent relay setting against the three tests of protection: it must not operate on the load or on a through fault (stability), it must operate on the smallest fault it protects (sensitivity), and the relay upstream must wait for it (selectivity). The pick-up window shows the range of settings that pass the first two tests; if the lowest stable pick-up is above the highest sensitive one, no single setting satisfies both and the relay, the CT ratio or the minimum fault must change. The result is a screening check, not a coordination study: confirm against the relay maker's curves, the CT data, the cable and transformer withstand and your utility's rules, and grade the whole fault range on a time-current chart.
- Independent vectors in the test suite: 39
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Protective Device Selection Tool (Choose a Fuse, MCB, MCCB or ACB Rating and Check It Against the Cable and the Fault) (`protective-device-selection`)

- Formula: `In ≥ Ib In ≤ Iz k2 In ≤ 1.45 Iz (so In ≤ Imax = min(Iz, 1.45 Iz / k2)) Icu ≥ Isc Imin ≥ m In I²t ≤ k² S²`
- Inputs: Kind of protective device; Design current of the circuit, Ib [A]; Current-carrying capacity of the cable, Iz [A]; Conventional operating factor of the device, k2; Prospective short-circuit current at the device, Isc [kA]; Rated breaking capacity of the device you plan to use [kA]; Smallest fault current at the far end of the circuit [A]; Instantaneous trip, highest setting (multiples of the rating); Let-through energy of the device at the fault, I²t (A²s); Cable conductor area, S (mm²); Adiabatic constant of the cable, k
- Outputs: Highest rating the cable allows, smaller of Iz and 1.45 Iz / k2 [A]; Smallest standard rating at or above Ib [A]; Largest standard rating the cable allows [A]; Load on the rating, Ib / In (%); Conventional operating current, k2 In [A]; Conventional operating current / Iz (the limit is 1.45); Smallest standard breaking capacity at or above Isc [kA]; Breaking capacity of your device / Isc; Instantaneous trip, highest setting m × In [A]; Smallest fault current / highest trip setting; Cable withstand, k² S² (A²s); Cable withstand / let-through energy; Number of checks not met
- Assumptions: A single circuit with one protective device against overload and short circuit; the rating is chosen from common catalogue steps for the kind of device (miniature: 6 to 125 A; moulded-case: 16 to 1,600 A; air circuit-breaker: 630 to 6,300 A; gG fuse: 2 to 1,250 A), which differ between makers and must be confirmed against the range you will buy; The overload rule is the usual two-part condition: the rating is at least the design current and not above the cable capacity, and the current that makes the device operate in the conventional time does not exceed 1.45 times the cable capacity; the operating factor k2 is your figure from the data sheet; The breaking capacity step list (3 to 150 kA) is a set of common catalogue values; the rating of the device you plan to use and the prospective fault current are your figures and the check is rated capacity at or above the fault current; The instantaneous trip check compares the smallest end-of-circuit fault current with the highest setting of the trip band (a margin you want on top is not added); it is not made for a fuse; The cable withstand uses the adiabatic energy k² S² against the let-through I²t you read from the device curve, for one conductor and one fault, with the constant k that you enter
- Notes: Choosing a protective device is four checks on one circuit. The rating has to carry the load and still protect the cable, which gives a window between the design current and the cable capacity; the device has to be able to break the largest fault; it has to trip on the smallest fault; and it has to let through no more energy than the cable can take. The calculator finds the window and the standard ratings in it and then checks the other three against the figures you enter. It does not check discrimination or back-up protection with other devices, the voltage rating, the number of poles, temperature derating of the device, motor starting or inrush, earth-fault loop impedance and disconnection time, arc-flash energy or any rule of an installation code. Read the device ratings and curves from the maker's data sheet.
- Independent vectors in the test suite: 42
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

### Short-Circuit Calculator (Source, Transformer and Cable Impedance) (`short-circuit-impedance`)

- Formula: `Network: Zq = c V² / Ssc, split by its X/R ratio Transformer: ZT = (uk / 100) V² / St, RT = Pk V² / St², XT = √(ZT² − RT²) Cable: R = r20 [1 + α (T − 20)] L / n, X = x L / n Total Z = √(R² + X²) with R and X summed along the path Ik″ = c V / (√3 Z) Ik2 = (√3 / 2) Ik″ Sk″ = √3 V Ik″ Peak: ip = κ √2 Ik″, κ = 1.02 + 0.98 e^(−3 R / X)`
- Inputs: Nominal system voltage (L-L) [V]; Voltage factor c; Upstream network fault level [MVA]; Upstream network X/R ratio; Supply transformer between the network and the fault; Transformer rating [kVA]; Transformer impedance voltage uk (%); Transformer load (copper) loss at rated current [kW]; Cable resistance at 20 °C [Ω/km]; Cable reactance [Ω/km]; Cable length [m]; Conductors per phase in parallel; Conductor material; Cable conductor temperature (°C)
- Outputs: Initial symmetrical three-phase short-circuit current at the fault [kA]; Peak short-circuit current [kA]; Line-to-line short-circuit current [kA]; Short-circuit level at the fault [MVA]; Three-phase short-circuit current at the busbar (before the cable) [kA]; Fall in fault current caused by the cable (%); Total resistance to the fault [mΩ]; Total reactance to the fault [mΩ]; Total impedance to the fault [mΩ]; X/R ratio at the fault; Peak factor κ; Network impedance (at the system voltage) [mΩ]; Transformer impedance [mΩ]; Cable impedance [mΩ]
- Assumptions: A balanced three-phase bolted short circuit, the method of IEC 60909 for the initial symmetrical current in a radial network far from generators: the positive, negative and zero-sequence impedances are equal for the line-to-line figure, and the source is a network with a given fault level and X/R ratio; Network, transformer and cable are in series on one voltage level. The network fault level is taken as the value at the transformer primary and referred to the secondary through the nominal voltage, so one voltage level (the system voltage) is used throughout; The IEC 60909 transformer correction factor KT is not applied. For a typical transformer it would lower the transformer impedance by a few percent, so the result is a little low for the maximum current. Motor contribution, generators, arc resistance and the decay of the current with time are not included; The peak uses the IEC 60909 method (a), κ = 1.02 + 0.98 e^(−3 R/X), taken from the R/X of the whole path. Cable resistance is corrected with a linear temperature coefficient (copper 0.00393, aluminium 0.00403 per °C); The cable is a single run described by its per-conductor resistance and reactance; a cable with several parallel runs is entered with the number in parallel. Mutual effects between parallel cables are ignored
- Notes: Use the maximum value (voltage factor 1.05 or 1.10, cable at 20 °C) to check the breaking and making capacity of a device, and the minimum value (voltage factor 0.95, cable hot) to check that a protective device operates at the far end of the cable. The fault current at the busbar is the figure for the device that protects the cable at its start. A hot cable has a higher resistance and so a lower fault current, so never size breaking capacity from a hot value.
- Independent vectors in the test suite: 50
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 18 Earthing

### Earthing Conductor Sizing (Protective Conductor Cross-Section) (`earthing-conductor-size`)

- Formula: `S = √(I² t) / k S must also be at least the mechanical minimum I²t = I² t k = √[ Qc (B + 20) / ρ20 × ln(1 + (θf − θi) / (B + θi)) ] (the published k values are this, rounded) Table rule: S = Sph for Sph ≤ 16 mm²; 16 mm² for 16 < Sph ≤ 35 mm²; Sph / 2 above 35 mm²`
- Inputs: Earth fault current (rms) [kA]; Disconnection time [s]; Conductor material, insulation and installation; Mechanical minimum size; Phase conductor cross-section (0 to skip the table comparison) [mm²]
- Outputs: Minimum cross-section for the fault [mm²]; Mechanical minimum size [mm²]; Standard size to use [mm²]; Material constant k; Fault current density at the standard size (A/mm²); Fault let-through energy I²t (MA²s); Size by the phase-conductor table rule [mm²]; Standard size by the table rule [mm²]
- Assumptions: Adiabatic heating: all the fault energy heats the conductor and none leaves it, which holds for disconnection times up to 5 s; k is the published value for the conductor material, its insulation and its starting and final temperatures (IEC 60364-5-54 and IEC 60364-4-43 type values; the physical formula reproduces each within 0.6%). Separate conductors start at 30 °C, conductors in a cable or bundle at the cable operating temperature (70 °C PVC, 90 °C XLPE / EPR). PVC in a cable above 300 mm² uses the lower final temperature of 140 °C (k 103 copper, 68 aluminium), applied here when the required area is above 300 mm²; Bare conductors use the 500 °C (copper, steel) or 300 °C (aluminium) final temperature, which is only acceptable where that heat cannot damage anything nearby, such as visible runs and restricted areas; The mechanical minimums are those usually stated for separate protective conductors; they are applied only to copper and aluminium. The table rule assumes the phase conductor is the same material, and the standard accepts it in place of the calculation; it is shown here for comparison; Sizes are the IEC 60228 preferred cross-sections from 1.5 to 630 mm². Corrosion, joints, the earth-fault loop impedance needed to trip the device, and the electrode or soil heating of a buried conductor are not assessed
- Notes: Take the disconnection time from the protective device curve at the earth fault current, not its trip setting. Size from the larger of the fault size and the mechanical minimum, then check that the loop impedance lets the device trip in that time.
- Independent vectors in the test suite: 60
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

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

### Load Flow Calculator (3-Bus, Newton-Raphson or Gauss-Seidel) (`load-flow-3bus`)

- Formula: `Pk = Σj |Vk||Vj| (Gkj cos δkj + Bkj sin δkj) Qk = Σj |Vk||Vj| (Gkj sin δkj − Bkj cos δkj) Newton-Raphson: [ΔP; ΔQ] = J [Δδ; Δ|V|] Gauss-Seidel: Vk = (1 / Ykk) [ (Pk − jQk) / Vk* − Σj≠k Ykj Vj ] Sij = Vi (Vi − Vj)* yij*`
- Inputs: Base power Sbase [MVA]; Slack bus 1 voltage (pu); Line 1-2 resistance R (pu); Line 1-2 reactance X (pu); Line 1-3 resistance R (pu); Line 1-3 reactance X (pu); Line 2-3 resistance R (pu); Line 2-3 reactance X (pu); Bus 2 load real power P2 [MW]; Bus 2 load reactive power Q2 [MVAR]; Bus 3 type; Bus 3 real power P3 [MW]; Bus 3 load reactive power Q3 (load bus only) [MVAR]; Bus 3 voltage setpoint (generator bus only, pu); Method
- Outputs: Iterations to converge; Bus 2 voltage |V2| (pu); Bus 2 angle (degrees); Bus 3 voltage |V3| (pu); Bus 3 angle (degrees); Slack bus real power output [MW]; Slack bus reactive power output [MVAR]; Bus 3 reactive output (generator bus only) [MVAR]; Line 1-2 real power, bus 1 end [MW]; Line 1-2 reactive power, bus 1 end [MVAR]; Line 1-3 real power, bus 1 end [MW]; Line 1-3 reactive power, bus 1 end [MVAR]; Line 2-3 real power, bus 2 end [MW]; Line 2-3 reactive power, bus 2 end [MVAR]; Total line loss [MW]; Final power mismatch (pu)
- Assumptions: Per-unit steady-state model, balanced three-phase, with each line as a series resistance and reactance only: there is no line charging (shunt capacitance), no off-nominal tap and no shunt at any bus; Bus 1 is the slack bus: its voltage magnitude is set and its angle is the zero reference. It supplies whatever real and reactive power the rest of the network needs, including the losses. Bus 2 is always a load (PQ) bus. Bus 3 is either a load (PQ) bus or a generator (PV) bus that holds its voltage magnitude; Loads are constant power, taken as positive when drawn from the network. At a generator bus, P3 is the real power injected into the network and the reactive output is solved for; no reactive limit is applied, so check the Qg3 result against the machine capability; Newton-Raphson uses the exact polar Jacobian and stops when every real and reactive power mismatch is below 1e-10 per unit. Gauss-Seidel uses a plain update with no acceleration factor and stops when no bus voltage changes by more than 1e-11 per unit; it can need very many iterations on a weakly loaded or high-impedance network; Both methods start from a flat profile (1.0 pu, 0°, or the generator setpoint at bus 3). If the case has no solution, for example a load beyond the network capability (voltage collapse), the iteration does not converge and the inputs are rejected; Flows are given at the sending end of each line as shown, with power leaving the named bus positive. The line loss is the sum of the two end flows on every line. The slack real power is the load plus the loss less the real power delivered at bus 3
- Notes: Use this to see how a small network shares real and reactive power, to find the bus voltages and line loading before a design check, and to compare the two classic methods: Newton-Raphson usually settles in a handful of iterations, while Gauss-Seidel needs many more but each pass is simpler. Check that every bus voltage stays within the allowed band (often 0.95 to 1.05 pu), that no line is overloaded, and that the generator reactive output is within what the machine can supply. This is a study and screening tool; a real network study uses dedicated software with the full model.
- Independent vectors in the test suite: 42
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Symmetrical Components Calculator (Phase, Sequence and Fault Currents) (`symmetrical-components`)

- Formula: `V0 = (Va + Vb + Vc) / 3 V1 = (Va + a Vb + a² Vc) / 3 V2 = (Va + a² Vb + a Vc) / 3 a = 1∠120° Va = V0 + V1 + V2 Vb = V0 + a² V1 + a V2 Vc = V0 + a V1 + a² V2 Faults (phase a reference, E = VLL / √3): 3-phase I = E / Z1 line-ground I = 3E / (Z0 + Z1 + Z2) line-line I = √3 E / |Z1 + Z2| double line-ground Ia1 = E / (Z1 + Z2‖Z0)`
- Inputs: What to calculate; Phase a magnitude |Va| (phase-to-sequence); Phase a angle (degrees); Phase b magnitude |Vb|; Phase b angle (degrees); Phase c magnitude |Vc|; Phase c angle (degrees); Zero-sequence magnitude |V0| (sequence-to-phase); Zero-sequence angle (degrees); Positive-sequence magnitude |V1|; Positive-sequence angle (degrees); Negative-sequence magnitude |V2|; Negative-sequence angle (degrees); System line-to-line voltage at the fault (fault currents) [V]; Positive-sequence resistance R1 [Ω]; Positive-sequence reactance X1 [Ω]; Negative-sequence resistance R2 [Ω]; Negative-sequence reactance X2 [Ω]; Zero-sequence resistance R0 [Ω]; Zero-sequence reactance X0 [Ω]
- Outputs: Zero-sequence |V0|; Zero-sequence angle (degrees); Positive-sequence |V1|; Positive-sequence angle (degrees); Negative-sequence |V2|; Negative-sequence angle (degrees); Negative-sequence unbalance |V2| ÷ |V1| (%); Zero-sequence unbalance |V0| ÷ |V1| (%); Phase a magnitude (rebuilt); Phase a angle (degrees); Phase b magnitude (rebuilt); Phase b angle (degrees); Phase c magnitude (rebuilt); Phase c angle (degrees); Round-trip check: largest phasor difference after rebuilding; Three-phase fault current [kA]; Single line-to-ground fault current (phase a) [kA]; Line-to-line fault current (phases b-c) [kA]; Double line-to-ground fault, phase b current [kA]; Double line-to-ground fault, phase c current [kA]; Double line-to-ground fault, earth return current 3 I0 [kA]
- Assumptions: The three phasors are one balanced-system quantity (all voltages or all currents) with phase a as the angle reference, and a normal phase order a-b-c, so that b lags a by 120°. The sequence components are those of phase a. Zero-sequence has equal phasors in all three phases, positive-sequence is the normal a-b-c rotation and negative-sequence is the opposite rotation; The unbalance factors |V2| ÷ |V1| and |V0| ÷ |V1| are the simple ratios of the component magnitudes. They are not the same as the NEMA line-voltage definition (maximum deviation from the average ÷ the average), so compare with a limit only if that limit is defined the same way. The 2% warning level is a common screening value, not a requirement of any one standard; Fault mode: a bolted (zero fault impedance) fault at one point of a balanced three-phase system, with the prefault voltage E = VLL / √3 and no load current or prefault phase shift. Z1, Z2 and Z0 are the Thévenin sequence impedances seen from the fault point, in ohms at that voltage. The single line-to-ground fault is on phase a, and the line-to-line and double line-to-ground faults are on phases b and c. Mutual coupling between sequences, arc resistance and the contribution of motors are not modelled; Z0 depends on the transformer winding connections and the earthing of the system, so it must come from the equipment data or a system study: a delta winding or an ungrounded source blocks the zero-sequence path
- Notes: Use the phase-to-sequence mode on measured voltages or currents to see how much of an unbalance is the negative sequence, which causes heating in motors and the extra negative-sequence current that protective relays look for, and how much is zero sequence, which flows in the neutral or earth. Use the sequence-to-phase mode to check a hand calculation or to build a test set. Use the fault mode to compare the four fault types at one point: the three-phase value is not always the largest, because a line-to-ground fault can exceed it when Z0 is smaller than Z1. Check the largest value against the equipment rating and the smallest against the protection pick-up. Use a short-circuit study for a real network.
- Independent vectors in the test suite: 44
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Reliability Indices Calculator (SAIFI, SAIDI, CAIDI, ASAI and Energy Not Supplied from Interruption Records) (`reliability-indices`)

- Formula: `Ci = customers interrupted in event i ri = duration of event i NT = customers served T = reporting period\nSAIFI = Σ Ci / NT SAIDI = Σ (Ci × ri) / NT CAIDI = SAIDI / SAIFI = Σ (Ci × ri) / Σ Ci\nASAI = (NT × T − Σ Ci × ri) / (NT × T) ASUI = 1 − ASAI ENS = Σ Ci × ri × L AENS = ENS / NT (L = average load per interrupted customer)`
- Inputs: Total customers served; Reporting period [h]; Number of interruption events; Event 1: customers interrupted; Event 1: duration [min]; Event 2: customers interrupted; Event 2: duration [min]; Event 3: customers interrupted; Event 3: duration [min]; Event 4: customers interrupted; Event 4: duration [min]; Event 5: customers interrupted; Event 5: duration [min]; Average load of an interrupted customer [kW]; SAIFI target (interruptions per customer per period, 0 to skip); SAIDI target (0 to skip) [min]
- Outputs: Customer interruptions (customers interrupted, summed over events); Customer minutes of interruption; SAIFI (interruptions per customer per period); SAIDI (minutes without supply per customer per period) [min]; CAIDI (average minutes per interruption) [min]; ASAI (fraction of the period supplied); ASAI as a percentage; ASUI (fraction of the period not supplied); Energy not supplied [kWh]; Average energy not supplied per customer [kWh]; Largest single event: share of SAIDI (%); Event that contributes most to SAIDI
- Assumptions: The indices are customer-weighted: every customer counts equally and SAIFI and SAIDI are averages over all customers served, including those never interrupted; Each event is one sustained interruption of a given number of customers for a given time; a customer interrupted twice is counted twice in SAIFI, which is the intended meaning; Every event entered is counted. IEEE Std 1366 leaves interruptions shorter than 5 minutes out of SAIFI and SAIDI (they are momentary) and excludes major event days; this calculator does neither, so enter only the events your reporting rules count; ASAI and ASUI use the reporting period you enter and treat every customer as supplied for the whole period apart from the events listed; The energy not supplied uses one average load for every interrupted customer, taken as constant over the outage; it is an estimate, not a metered value; The definitions are those of the usual distribution reliability indices; the targets are your own figures and no regulator's limits or standard's clauses are applied
- Notes: Use this to turn an outage log into the indices a regulator or utility reports. SAIFI says how often the average customer lost supply, SAIDI how long they were without it in total, and CAIDI how long a typical interruption lasted; CAIDI is what restoration crews influence, while SAIFI reflects how many faults there were and how many customers each reaches. A few large events usually dominate SAIDI, which is why the largest single event's share is shown. Reporting rules differ between regulators on what counts as an interruption, how momentary events and major event days are treated, and how customers are counted, so check the definitions your reporting follows before comparing figures. This is a calculation from the events you list; it does not model the network or predict future reliability.
- Independent vectors in the test suite: 35
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

### Boolean Logic Tool (Truth Table, Minterms, Prime Implicants and Minimal SOP / POS for 2 to 4 Variables) (`boolean-logic`)

- Formula: `Row r = A·2^(n−1) + … + last input (A is the most significant bit); truth-table number = Σ F(r) · 2^r\nMinterms: rows with F = 1; maxterms: rows with F = 0\nImplicant: a product of literals that is 1 only on rows where F = 1; prime implicant: one that cannot drop a literal and stay an implicant\nMinimal SOP: fewest product terms, then fewest literals, chosen from the prime implicants; minimal POS: the complement of the minimal SOP of F′ (De Morgan)`
- Inputs: Number of inputs (variables); Function; Truth-table number (Custom function only); Input A; Input B; Input C (3 or 4 inputs); Input D (4 inputs)
- Outputs: Output F at the chosen inputs (0 or 1); Minterms (rows where F = 1); Minimal SOP: product terms; Minimal SOP: literals; Minimal POS: sum terms; Minimal POS: literals; Prime implicants of F; Essential prime implicants of F; Maxterms (rows where F = 0); Inputs the function actually depends on; Kind: 0 depends on its inputs, 1 always 0, 2 always 1; Row number of the chosen inputs (A is the most significant bit); Truth-table number of F (decimal); Truth-table number of the complement F′
- Assumptions: Complete truth table of 2, 3 or 4 inputs with every row defined; no don't-care rows are used, which can allow a simpler form in a real design; Minimal means fewest terms, then fewest literals, in two-level AND-OR (SOP) or OR-AND (POS) form; the counts are exact, but when several forms tie only one is shown (a warning says so); A single input letter with a prime (A′) is the complement; a SOP of a constant 1 is written 1 and of a constant 0 is written 0, and the POS forms follow the same convention (a product of no sums is 1, a sum of no literals is 0); Ideal logic: gate delay, hazards (glitches), fan-in limits, multi-level and shared-gate minimisation are not considered
- Notes: Use this to check a truth table, simplify a control or interlock condition, or see how a NAND-only or NOR-only version would be counted before drawing the gates. For hand work, the minterms are the cells marked 1 on a Karnaugh map and each prime implicant is a largest rectangle of 1s.
- Independent vectors in the test suite: 48
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Power Supply Ripple Calculator (Capacitor-Filtered Rectifier: Ripple Voltage, Capacitor Size and Regulator Headroom) (`power-supply-ripple`)

- Formula: `Vpk = Vs × √2 Vp = Vpk − n × Vd (n = 1 half-wave and centre-tap, 2 bridge) fr = f (half-wave) or 2f (full-wave) ΔV = I / (fr × C) Vmin = Vp − ΔV Vdc = Vp − ΔV / 2 Vr = ΔV / (2√3) ripple factor = Vr / Vdc C needed = I / (fr × ΔV wanted) headroom = Vmin − (Vo + dropout) output ripple = Vr / 10^(rejection / 20)`
- Inputs: Rectifier; Transformer secondary RMS voltage [V]; Mains frequency [Hz]; Voltage drop of one diode [V]; DC load current [A]; Filter capacitor [µF]; Peak-to-peak ripple wanted [V]; Linear regulator output voltage (0 to leave the regulator out) [V]; Regulator dropout voltage [V]; Regulator ripple rejection (dB)
- Outputs: Peak voltage from the secondary [V]; Peak voltage on the capacitor, after the diodes [V]; Ripple frequency [Hz]; Peak-to-peak ripple [V]; Lowest voltage on the capacitor [V]; Average DC voltage [V]; RMS ripple voltage (triangle shape) [V]; Ripple factor, RMS ripple / average DC (%); Capacitor needed for the ripple wanted [µF]; Headroom: lowest input minus output and dropout (0 or more passes) [V]; RMS ripple at the regulator output [mV]
- Assumptions: A constant DC load current: the capacitor discharges linearly and is recharged in a short pulse at each peak, which gives a sawtooth with RMS ripple ΔV / (2√3); a resistive load decays exponentially and the ripple is a little smaller; The whole ripple period is taken as the discharge time, so the result is a little pessimistic for a large capacitor and it is a screening estimate once the ripple passes about 20% of the peak (a warning is given); Transformer and diode series resistance, the mains tolerance (typically −10%) and the capacitor tolerance are not included; allow for them in the voltage and the capacitance you enter; The diode drop is one fixed figure at the peak current; the regulator dropout and ripple rejection are your data-sheet figures and the rejection is applied as a constant at the ripple frequency; The capacitor ripple current (several times the DC load current), the diode surge current at switch-on and the transformer heating are not calculated
- Notes: Use this to size the smoothing capacitor of a linear power supply and to check that the lowest point of the ripple still clears the dropout of the regulator after it. If the headroom is negative, the regulator drops out at the bottom of every ripple cycle and the output will carry that ripple: raise the secondary voltage, use a larger capacitor, accept a lower load current or choose a low-dropout regulator. Allow for the mains at the low end of its tolerance when you enter the secondary voltage, and check the ripple-current rating of the capacitor against the data sheet, because it charges in short pulses several times the DC load current.
- Independent vectors in the test suite: 40
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 24 Semiconductor Components

### Diode Circuit Calculator (Forward Drop, Rectifier and Clamp) (`diode-circuit`)

- Formula: `DC circuit, constant drop: I = (Vs − Vf) / R when Vs > Vf, otherwise I = 0 Vd = Vf VR = I R DC circuit, Shockley: I = Is (e^(Vd / nVt) − 1) Vs = Vd + I R Is = Iref / (e^(Vf / nVt) − 1) Vt = kT / q rd = nVt / (I + Is) Rectifier (Vt = Vf for one diode, 2 Vf for a bridge): Vpk = √2 Vs θ1 = asin(Vt / Vpk) conducts from θ1 to π − θ1 vo = Vpk sin θ − Vt Average Vdc = (2 Vpk cos θ1 − Vt (π − 2θ1)) / (2π) half-wave, or / π for a bridge RMS and ripple factor RF = √((Vrms / Vdc)² − 1) PIV = Vpk (half-wave) or Vpk − Vf (bridge) diode loss = Vt × Idc efficiency = Pload / (Pload + diode loss) Clamp: capacitor voltage = Vpk − Vf highest output = 2 Vpk − Vf lowest output = −Vf PIV = 2 Vpk − Vf`
- Inputs: Circuit; Diode model (DC series circuit only); Source voltage (DC volts for the DC circuit; RMS volts for the three AC circuits) [V]; Resistor or load resistance [Ω]; Forward voltage drop [V]; Current at which that drop applies (Shockley model) [mA]; Ideality factor n (Shockley model); Junction temperature in °C (Shockley model)
- Outputs: Diode current (DC circuit) or average load current (rectifier) [mA]; Voltage across the diode (DC circuit) [V]; Voltage across the resistor (DC circuit) [V]; Dynamic resistance of the diode at this current (Shockley model) [Ω]; Power in the diode (DC circuit) or total diode loss (rectifier) [W]; Power in the resistor or load [W]; Efficiency: load power ÷ (load power + diode loss) (%); Peak of the AC supply [V]; Peak output voltage [V]; Lowest output voltage (clamp) [V]; Average (DC) output voltage [V]; RMS output voltage (rectifier) [V]; Ripple factor, no filter (%); Peak load current (rectifier) [mA]; Average current per diode (rectifier) [mA]; Peak inverse voltage across a diode [V]; Conduction angle in each pulse (rectifier)
- Assumptions: The diode is described by one forward drop (constant-drop model) or by the Shockley equation with an ideality factor and the drop at one reference current; the series resistance of a real diode, reverse leakage, junction capacitance and reverse breakdown are not modelled; In the DC circuit a source at or below the forward drop gives no current; a negative source reverse-biases the diode and the full source voltage appears across it; The rectifiers have an ideal sine supply with no source impedance, a resistive load and no smoothing capacitor, and the diode drop is constant while it conducts; the output is the supply minus the drop from the point where the supply first exceeds it; The ripple factor, form factor and efficiency are those of the unfiltered output; the smoothing capacitor and the supply impedance are not included (the Power Converter Calculator covers an ideal rectifier with a capacitor); The bridge peak inverse voltage is Vpk − Vf for each off diode while the other pair conducts; add a margin when choosing the rating, because supply spikes and transformer regulation are not included; The clamp has an ideal capacitor that has charged to the peak, a diode that is ideal apart from the constant drop, and no load, so the output keeps the input swing of 2 Vpk shifted up; a load resistor lets the DC level sag between peaks
- Notes: Take the forward drop from the data sheet at your own current: a silicon diode drops about 0.6 V at a few milliamps and 0.9 V or more near its rated current. For a rectifier choose a diode with a repetitive peak reverse voltage rating above the peak inverse voltage with margin, and an average current rating above the current per diode with allowance for the repetitive peak current.
- Independent vectors in the test suite: 70
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

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

### PWM Inverter Calculator (Modulation Index, Output Voltage and Carrier Harmonics) (`pwm-inverter`)

- Formula: `Frequency modulation ratio mf = fc / f1 Amplitude modulation index ma = reference peak / carrier peak\nFundamental (peak): half bridge ma Vdc / 2 full bridge ma Vdc three-phase bridge ma Vdc / 2 per phase, line to line (√3 / 2) ma Vdc = 0.612 ma Vdc RMS\nLinear range: ma ≤ 1 (sinusoidal reference); ma ≤ 2 / √3 = 1.1547 (third-harmonic injection or space-vector PWM)\nCarrier harmonics (sinusoidal reference, natural sampling): amplitude / fundamental = 4 / (π m ma) × J_n (m π ma / 2) at the frequency m fc ± n f1, when m + n is odd\nUnipolar full bridge: only odd n (no groups at mf, mf ± 2, 3mf). Three-phase line voltage: none where n is a multiple of 3 (no groups at mf, 2mf ± 3, 3mf)\nLoad: Z = √(R² + (2π f L)²) at each frequency, I = V / Z, P = (phases) R I²`
- Inputs: Inverter circuit; Reference wave; DC bus voltage Vdc [V]; Amplitude modulation index ma; Carrier (switching) frequency fc [Hz]; Output (fundamental) frequency f1 [Hz]; Load resistance per phase R [Ω]; Load inductance per phase L [mH]
- Outputs: Frequency modulation ratio mf = fc / f1; Largest ma in the linear range; Fundamental output voltage, peak (one phase to the load neutral for a three-phase bridge) [V]; Fundamental output voltage, RMS (same voltage) [V]; Fundamental line-to-line voltage, RMS (three-phase bridge) [V]; Fundamental RMS at the end of the linear range (line to line for a three-phase bridge) [V]; Harmonic at mf, as % of the fundamental; Harmonic at mf ± 2 (each of the two), as % of the fundamental; Harmonic at 2mf ± 1 (each of the two), as % of the fundamental; Harmonic at 2mf ± 3 (each of the two), as % of the fundamental; Harmonic at 3mf, as % of the fundamental; Harmonic at 3mf ± 2 (each of the two), as % of the fundamental; Voltage distortion of the listed carrier groups, as % of the fundamental; Load impedance at the fundamental |R + j 2π f1 L| [Ω]; Load angle at the fundamental (degrees); Fundamental load current, RMS per phase [A]; Load current of the listed carrier groups, RMS per phase [A]; Total load current, RMS per phase (fundamental plus listed groups) [A]; Load power R I² (all phases) from the total current [W]
- Assumptions: A voltage-source inverter with ideal switches (no dead time, no switch drop) and a constant DC bus, a triangular carrier and natural sampling (the reference is compared with the carrier continuously), so the fundamental follows ma exactly in the linear range; The carrier harmonics are those of the double Fourier series of a naturally sampled sinusoidal PWM wave (Bessel functions J_n). They are the sidebands of the carrier and its multiples, and they are tabulated for the sinusoidal reference only: with third-harmonic injection or space-vector PWM the sideband sizes differ a little and are not calculated, and the harmonic and distortion outputs show a dash; Each listed group is a harmonic at m fc ± n f1. The two sidebands of a group (± n) have the same size, which is shown once; the distortion output adds all the components of the six listed groups (the smaller groups at 4mf and above are not included), so it is a lower bound on the true distortion; At a low mf the groups come close in frequency and can fall on the same harmonic, where their sizes add as phasors and the single-group figure is no longer the harmonic at that frequency; this is flagged below mf = 9. Synchronised PWM with a whole, odd mf (an odd multiple of 3 for a three-phase bridge) keeps the waveform symmetrical, with no even harmonics and no DC; a fractional mf gives sub-harmonics that are not calculated; The load is a series R-L in each phase (star-connected, isolated neutral, for the three-phase bridge, so the carrier groups that are in phase in the three legs, a multiple of 3 at the sideband order, drive no current). The load current is found at each harmonic from V / Z and added in quadrature; the overmodulation range, dead time, switch losses and DC bus ripple are not included
- Notes: Use this to choose ma and mf and to see the output voltage and where the carrier harmonics sit before sizing the output filter or the load. For the harmonic content of a measured waveform, use the harmonic distortion calculator; for a rectifier, inverter or DC-DC converter at the level of the topology (ratings, ripple, duty cycle), use the power converter calculator; for the speed a drive gives a motor, use the VFD speed calculator.
- Independent vectors in the test suite: 51
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Controlled Rectifier Calculator (Thyristor Output Voltage, Firing Angle, Overlap and Input Power Factor) (`controlled-rectifier`)

- Formula: `Vm = √2 Vs Average output: 1-phase half-wave R: Vm (1 + cos α) / 2π; 1-phase bridge R: Vm (1 + cos α) / π; 1-phase bridge R-L: 2 Vm cos α / π; 1-phase half-controlled: Vm (1 + cos α) / π; 3-pulse R-L (Vm per phase): 3√3 Vm cos α / 2π; 3-phase bridge R-L (Vm line-to-line): 3 Vm cos α / π\nRMS output (resistive): half-wave (Vm / 2) √((π − α + ½ sin 2α) / π); bridge Vm √((π − α + ½ sin 2α) / 2π)\nR-L-E circuits: Id = (Vd0 cos α − E) / (R + Rc), Rc = 2ωLs / π (1-phase bridge), 3ωLs / 2π (3-pulse), 3ωLs / π (3-phase bridge); cos α − cos(α + μ) = 2 ω Ls Id / Vc; Vdc = Vd0 cos α − Rc Id\nInput current (steady load current Id): 1-phase bridge I = Id, I1 = 2√2 Id / π, φ1 = α; half-controlled I = Id √((π − α) / π), I1 = 2√2 Id cos(α/2) / π, φ1 = α/2; 3-pulse I = Id / √3, I1 = √3 Id / (π √2); 3-phase bridge I = Id √(2/3), I1 = √6 Id / π, φ1 = α\nPF = P / S = (I1 / I) cos φ1, P = Vdc Id (R-L-E) or Vrms² / R (resistive)`
- Inputs: Circuit and load; Supply voltage, RMS [V]; Supply frequency [Hz]; Firing angle α (degrees); Load resistance [Ω]; Load counter-EMF, R-L-E circuits (V) [V]; Source inductance per phase, optional [mH]
- Outputs: Maximum average output (α = 0, no overlap) [V]; Average output voltage [V]; Average output as a percentage of the maximum; RMS output voltage (ideal, no overlap) [V]; Output ripple frequency [Hz]; Average load current [A]; Real power at the converter (negative when returned to the supply) [kW]; Apparent power at the AC side [kVA]; Fundamental reactive power (always lagging for a firing delay) [kVAR]; Power factor P / S (negative when power returns to the supply); Displacement power factor cos φ1; RMS supply current per line (or phase) [A]; Fundamental RMS supply current [A]; Supply current distortion, total including any DC component (%); Overlap angle μ (degrees); Extinction angle γ = 180° − α − μ in inverter operation (degrees); Average voltage lost to overlap [V]; Average current per thyristor [A]; Peak reverse voltage per thyristor [V]
- Assumptions: An ideal sinusoidal source and ideal thyristors: no forward drop, no turn-off time and no firing pulse limits. The firing angle is the same for every thyristor and is measured from the natural firing point; Resistive circuits: the current follows the voltage, so the current is zero while a thyristor waits and stops at the voltage zero crossing. Source inductance is ignored in these two circuits; R-L-E circuits: the load inductance is large enough to keep the load current steady and unbroken (continuous conduction, no ripple). The calculator does not check this, and a load with too little inductance or a high counter-EMF at a large firing angle makes the current discontinuous, where these formulas do not apply; Source inductance (circuits 2, 4 and 5 only) gives the overlap angle and the voltage drop Rc Id. The supply current, distortion and reactive power are then those of the instant-commutation current, so they are close but not exact; the power factor is P / S with the reduced output, which gives the usual displacement factor ½ [cos α + cos(α + μ)]; Three-phase half-wave: each secondary phase carries a one-way current with a DC component, which a delta-star transformer is normally used to handle; the figures are those of the converter terminals, and the distortion figure includes the DC component; Reactive power is the fundamental reactive power only, not the distortion power. The supply is a stiff, balanced source of the voltage entered, and the thyristor ratings given are the steady-state average current and the peak reverse voltage, before any safety margin, snubber or transient allowance
- Notes: Use this to see how the firing angle trades output voltage against input power factor, or to find the firing angle for a wanted output: change α and read the average output voltage, the supply current and the power factor. The input displacement factor of a fully controlled converter is cos α, so a low output voltage from a large firing angle costs power factor, and the half-controlled bridge gives a better power factor at the same output because its displacement angle is only α/2. For the average and ripple of an uncontrolled bridge, use the Power Converter calculator; for diode drops and the clamp, use the Diode Circuit calculator. Choose thyristors with a repetitive peak reverse voltage well above the peak reverse voltage shown (a factor of 2 or more is common), an average current rating above the value shown after derating for temperature, and check the turn-off time against the extinction angle in inverter operation. The calculator gives the steady-state values only; it does not model the thyristor gate drive, snubbers, harmonics against a limit or the protection of the converter.
- Independent vectors in the test suite: 61
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### DC-DC Converter Calculator (Buck, Boost and Buck-Boost Design with Switch, Diode and Inductor Losses) (`dc-dc-converter`)

- Formula: `Buck: D = (Vo + Vf + IL DCR) / (Vin − IL Rds + Vf), IL = Io. Boost: (Vo + Vf) x² − (Vin + Io Rds) x + Io (Rds + DCR) = 0 with x = 1 − D, IL = Io / x. Buck-boost: (Vin + Vo + Vf) x² − (Vin + Io Rds) x + Io (Rds + DCR) = 0\nΔIL = Von D / (L fsw), Von = Vin − IL (Rds + DCR) − Vo (buck) or Vin − IL (Rds + DCR) (boost, buck-boost); Lcrit = Von D / (2 fsw IL); ILrms = √(IL² + ΔIL² / 12)\nOutput ripple: buck ΔIL / (8 fsw C) + ΔIL ESR; boost and buck-boost Io D / (fsw C) + (IL + ΔIL / 2) ESR\nLosses: switch D (IL² + ΔIL²/12) Rds, diode Vf (1 − D) IL, inductor ILrms² DCR; η = Po / (Po + losses)`
- Inputs: Converter type; Input voltage [V]; Output voltage, magnitude [V]; Output (load) current [A]; Switching frequency [kHz]; Inductor ripple current, % of its average current; Inductor you have, optional [µH]; Output voltage ripple target, % of output; Output capacitor you have, optional [µF]; Output capacitor ESR [mΩ]; Switch on-resistance [mΩ]; Diode forward drop (V) [V]; Inductor winding resistance [mΩ]
- Outputs: Duty cycle D; Average inductor current [A]; Inductor ripple current (peak to peak) [A]; Peak inductor and switch current [A]; RMS inductor current [A]; Inductance used [µH]; Critical inductance (current just reaches zero) [µH]; Output capacitance needed for the ripple target (ESR not included) [µF]; Output ripple, peak to peak (capacitance plus ESR) [V]; Average switch current [A]; RMS switch current [A]; Average diode current [A]; Voltage across the switch and diode when off [V]; Switch conduction loss [W]; Diode conduction loss [W]; Inductor winding loss [W]; Total of these three losses [W]; Average input current [A]; Efficiency from these losses (%)
- Assumptions: Continuous conduction only: the inductor current stays above zero all the time. An inductor below the critical value, or a ripple above 200%, is rejected. Discontinuous operation has a different gain and is not modelled; The duty cycle is found from the average voltages with the average inductor current; the ripple is then taken from that duty cycle and the output voltage. Switching losses (overlap, gate charge, diode recovery), core loss, capacitor loss and the control loop are not included, so the efficiency is the conduction-loss efficiency and is higher than the efficiency of a real converter; The switch, diode and inductor resistance are constants; the diode drop is constant while it conducts. Dead time, a synchronous rectifier and the input capacitor ripple are not modelled; The output ripple adds the capacitance part and the ESR part, which is a slight overestimate of the true peak-to-peak value because the two peaks do not coincide; the output inductance of the capacitor and the load transient are not included; The buck-boost is the inverting type; the output polarity is opposite to the input and the output voltage entered is its magnitude. Isolated converters (flyback, forward) are not covered
- Notes: Use this to pick the inductor and capacitor for a converter and to check what a real switch, diode and inductor cost. Enter the voltages, load current and frequency, take the inductor from the ripple percentage, then check the saturation current of the part you choose against the peak current, the RMS rating against the RMS current, and the capacitor ripple-current rating. Round the inductance up and put your real part back in the inductor field to see its ripple and its distance from the critical value. The efficiency here is conduction loss only; add switching, core and capacitor losses from the data sheets. For the ideal design equations without losses, and for rectifiers and inverters, use the Power Converter calculator.
- Independent vectors in the test suite: 33
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Switching Loss Comparison Tool (MOSFET Conduction, Switching and Gate Loss for Two or Three Devices, with the Frequency Where They Break Even) (`switching-loss-comparison`)

- Formula: `Conduction Pc = I² × Rds(on) × D\nSwitching (overlap) Psw = ½ × V × I × (tr + tf) × fsw\nGate drive Pg = Qg × Vgs × fsw\nTotal P = Pc + Psw + Pg; loss inside the device = Pc + Psw\nWrite P = Pc + k × fsw with k = ½ V I (tr + tf) + Qg Vgs. Two devices break even where Pc,x + kx f = Pc,y + ky f, so f = (Pc,x − Pc,y) / (ky − kx) when this is above 0. Conduction equals switching plus gate loss at f = Pc / k`
- Inputs: Switched (off-state) voltage [V]; On-state current [A]; Duty cycle D (fraction of the period the switch is on); Switching frequency [kHz]; Gate drive voltage [V]; Device A: on-resistance Rds(on) [mΩ]; Device A: rise time tr (ns); Device A: fall time tf (ns); Device A: total gate charge Qg [nC]; Device B: on-resistance Rds(on) [mΩ]; Device B: rise time tr (ns); Device B: fall time tf (ns); Device B: total gate charge Qg [nC]; Device C (optional): on-resistance Rds(on) [mΩ]; Device C (optional): rise time tr (ns); Device C (optional): fall time tf (ns); Device C (optional): total gate charge Qg [nC]
- Outputs: Device A: conduction loss [W]; Device A: switching loss [W]; Device A: gate drive loss [W]; Device A: total loss [W]; Device A: loss inside the device (conduction plus switching) [W]; Device B: conduction loss [W]; Device B: switching loss [W]; Device B: gate drive loss [W]; Device B: total loss [W]; Device B: loss inside the device (conduction plus switching) [W]; Device C: conduction loss [W]; Device C: switching loss [W]; Device C: gate drive loss [W]; Device C: total loss [W]; Device C: loss inside the device (conduction plus switching) [W]; Device with the lowest total loss (1 = A, 2 = B, 3 = C); Total loss of the worst device minus the best [W]; Saving of the best device over the worst (% of the worst); Device A: switching and gate loss, % of its total; Device B: switching and gate loss, % of its total; Device C: switching and gate loss, % of its total; Device A: frequency where switching plus gate loss equals conduction loss [kHz]; Device B: frequency where switching plus gate loss equals conduction loss [kHz]; Device C: frequency where switching plus gate loss equals conduction loss [kHz]; Break-even frequency, A and B (equal total loss) [kHz]; Break-even frequency, A and C [kHz]; Break-even frequency, B and C [kHz]
- Assumptions: Each device is run at the same voltage, on-state current, duty cycle, frequency and gate voltage. The conduction loss uses the on-state current as an RMS value, as in the MOSFET Loss Formulas guide, with the on-resistance you enter (use the hot value); The switching loss is the usual hard-switched estimate ½ V I (tr + tf) fsw: the voltage is held at V while the current ramps up over tr, and the current is held at I while the voltage ramps up over tf, so each edge costs ½ V I times its time. It leaves out the output capacitance (Coss) loss, the reverse recovery of the diode, ringing and the effect of the Miller plateau on the real transition time, so it is an estimate of the order of the loss. Use the rise and fall times at your own gate drive and load, not the data sheet test conditions, if you can; The gate drive loss Qg Vgs fsw is dissipated mostly in the gate driver and the gate resistor, not in the MOSFET. It is in the total for the efficiency of the stage; the loss inside the device (conduction plus switching) is the one that heats the MOSFET; The model is for MOSFETs, whose conduction loss is resistive (I² Rds), including silicon carbide and gallium nitride MOSFETs entered by their Rds(on). An IGBT has a fixed saturation voltage and a turn-off tail current, so its conduction loss and switching loss follow different equations and it is not covered; On-resistance, switching times and gate charge are taken as constants; temperature, gate voltage and current dependence of the data sheet values are not modelled. Rds(on) and the switching times are entered as the values you choose to compare; The break-even frequency assumes the other conditions stay fixed while the frequency changes. If the device is also changed in the circuit (a different gate resistor, for example) the times change too and the comparison has to be run again
- Notes: Use this to choose between two or three MOSFETs for a switching stage, or to see how a change of frequency moves the loss. Enter the stage conditions once, then each device's on-resistance, edge times and gate charge from its data sheet. The break-even frequency is the quick answer: below it the device with the lower on-resistance has the lower loss, above it the device with the faster edges and lower gate charge does. Check the winner against the thermal limit with the loss inside the device and the heat sink calculator, and add the diode recovery and output capacitance losses from the data sheets for a closer figure. For the losses of a whole converter, use the DC-DC Converter Calculator.
- Independent vectors in the test suite: 55
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Power Converter Calculator (Rectifier, Inverter and DC-DC Converter) (`power-electronics-converter`)

- Formula: `Rectifier, ideal diodes, resistive load, Vm = √2 Vs: half-wave Vdc = Vm / π, Vrms = Vm / 2; full-wave bridge Vdc = 2 Vm / π, Vrms = Vm / √2; 3-phase half-wave Vdc = 3√3 Vm / 2π, Vrms = Vm √(1/2 + 3√3 / 8π) (Vm per phase); 3-phase bridge Vdc = 3 Vm / π, Vrms = Vm √(1/2 + 3√3 / 4π) (Vm line-to-line); FF = Vrms / Vdc, RF = √(FF² − 1), fr = p f. With capacitor: Vfl = Vm / (1 + 1 / (2 fr C RL)), Vrpp = Vfl / (fr C RL). Inverter: 1-phase square V1 = 4 Vd / (π√2), Vo = Vd; 1-phase PWM V1 = ma Vd / √2; 3-phase six-step VLL1 = √6 Vd / π, Vo = √(2/3) Vd; 3-phase PWM VLL1 = √3 ma Vd / (2√2). DC-DC (CCM): buck D = Vo / Vin, L = Vo (1 − D) / (fsw ΔIL), C = ΔIL / (8 fsw ΔV); boost D = 1 − Vin / Vo, L = Vin D / (fsw ΔIL), C = Io D / (fsw ΔV); buck-boost D = Vo / (Vin + Vo), L = Vin D / (fsw ΔIL), C = Io D / (fsw ΔV).`
- Inputs: What to calculate; Rectifier circuit; AC supply voltage, RMS (rectifier) [V]; Supply frequency (rectifier) [Hz]; Load resistance (rectifier) [Ω]; Smoothing capacitor (rectifier, optional) [µF]; Inverter circuit and control; DC bus voltage (inverter) [V]; Modulation index ma (PWM inverter); Output frequency (inverter) [Hz]; DC-DC converter type; Input voltage (DC-DC) [V]; Output voltage, magnitude (DC-DC) [V]; Output (load) current (DC-DC) [A]; Switching frequency (DC-DC) [kHz]; Inductor ripple current, % of its average current (DC-DC); Output voltage ripple, % of output (DC-DC); Converter efficiency (DC-DC)
- Outputs: Peak voltage of the conducting source [V]; Average (DC) output voltage [V]; RMS output voltage [V]; DC load current [A]; DC output power [W]; Rectification efficiency Pdc ÷ Pac (%); Form factor Vrms ÷ Vdc; Ripple factor (%); Ripple frequency [Hz]; Peak inverse voltage across each diode [V]; Average current per diode (resistive load, no capacitor) [A]; RMS current per diode (resistive load, no capacitor) [A]; Output voltage with the smoothing capacitor (average) [V]; Load current with the smoothing capacitor [A]; Output ripple with the capacitor (peak to peak) [V]; Fundamental output voltage, RMS (three-phase: line-to-line) [V]; Fundamental phase voltage, RMS (three-phase) [V]; Total RMS output voltage including harmonics [V]; Total harmonic distortion of the output voltage (%); DC bus utilisation V1 ÷ Vd; Volts per hertz of the fundamental; Duty cycle D (ideal); Average inductor current [A]; Inductor ripple current (peak to peak) [A]; Peak inductor and switch current [A]; Inductance needed [µH]; Output capacitance needed (ideal capacitor) [µF]; Voltage across the switch and diode when off [V]; Average input current [A]; Converter loss [W]
- Assumptions: Rectifier: ideal diodes with no forward drop and no source impedance, a purely resistive load and a sinusoidal supply. The diode currents shown are for that load without the capacitor; with a capacitor the diodes carry short pulses whose peak is several times the average, so the diode ratings must be checked separately. The capacitor formula treats the output as a falling straight line between peaks and is accurate only for small ripple; Rectifier supply voltage is RMS: single-phase circuits use the voltage applied to the rectifier, the three-phase half-wave circuit uses the phase voltage and the three-phase bridge uses the line-to-line voltage. The peak inverse voltage is for the circuit named, not for a centre-tapped full-wave rectifier (which needs twice the peak); Inverter: the DC bus is steady and the switches are ideal with no dead time. PWM figures are for the fundamental in the linear range only: overmodulation is not covered, and the carrier-frequency harmonics are not summed, so the total RMS and the distortion are shown only for the square-wave and six-step cases, where they are exact. Three-phase voltages are line-to-line unless marked as phase voltages; DC-DC converter: continuous conduction only, with ideal switch, diode, inductor and capacitor, so the duty cycle is the lossless value and the efficiency is used only for the input current and the loss. The inductor ripple is a percentage of the average inductor current (for a buck this is the load current, for a boost or buck-boost it is the load current ÷ (1 − D)). The output ripple is from the capacitance alone: the ESR of a real capacitor, which often dominates, is not included. The buck-boost output is of opposite polarity and its magnitude is entered
- Notes: Pick the mode, enter only the inputs for that mode, and read the results. For a rectifier, compare the ripple factor with what the load can tolerate and add a capacitor if it cannot; the half-wave circuit is the cheapest but its ripple is 121%, against 48% for the bridge and 4% for the three-phase bridge. For an inverter, check that the DC bus is high enough: the fundamental can never reach the DC bus voltage, and the three-phase PWM output is 0.612 × ma × Vd line-to-line. For a DC-DC converter, treat the inductance and capacitance as minimum values, round up to a standard part, then check the inductor saturation current against the peak current and the capacitor ripple current rating. Compare every answer with the component data sheets before building.
- Independent vectors in the test suite: 89
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### SCR Triggering Calculator (Gate Resistor, Gate Power and Resistor-Triggered Firing Angle) (`scr-triggering`)

- Formula: `Mode 1: IG = k × IGT Rmax = (Vs − VGT) / IG PGpk = VGT × IG Pres = (Vs − VGT) × IG duty = tp / T PGav = PGpk × duty\nMode 2: Vm = √2 × Vac Vth = VGT + VD + IGT × Rg α = asin(Vth / Vm) θ = 180° − α Rfire = (Vm − VGT − VD) / IGT\nHalf-wave resistive load: Vavg = Vm (1 + cos α) / (2π) Vrms = Vm √((π − α + sin 2α / 2) / (4π))`
- Inputs: What to calculate; Gate trigger voltage VGT [V]; Gate trigger current IGT [mA]; Trigger source voltage (mode 1) [V]; Safety margin on IGT (mode 1); Pulse width (mode 1, 0 for a continuous gate current) [µs]; Pulse repetition period (mode 1) [ms]; Peak gate power rating PGM [W]; Average gate power rating PG(AV) [W]; AC supply voltage, RMS (mode 2) [V]; Series diode drop in the gate path (mode 2) [V]; Total series gate resistance (mode 2) [kΩ]
- Outputs: Gate current driven [mA]; Largest series gate resistor [Ω]; Gate power during the pulse (VGT × IG) [W]; Resistor power during the pulse [W]; Duty cycle of the gate current (%); Average gate power [W]; Peak of the AC supply [V]; Supply voltage at which the gate fires [V]; Firing angle (degrees); Conduction angle (degrees); Average load voltage (resistive load, half-wave) [V]; RMS load voltage (resistive load, half-wave) [V]; Largest total gate resistance that still fires [Ω]
- Assumptions: VGT and IGT are the data-sheet trigger values, taken as constants: the gate is modelled as a fixed voltage VGT in series with the gate resistor; Mode 1 drives a gate current k times IGT; the gate-cathode voltage is taken as VGT while it conducts; Mode 2 fires when the supply reaches VGT + VD + IGT × Rg on the rising half-cycle, so the firing angle can only be between 0 and 90°; a delay beyond 90° needs a phase-shift or pulse circuit; Mode 2 uses IGT itself (no margin), which is the point where firing is just guaranteed; the load is a resistance with no inductance, and the SCR drop and gate-circuit capacitance are ignored; Peak gate current (IGM), latching and holding current, dv/dt and di/dt are not checked
- Notes: The data sheet gives IGT and VGT as maximums with wide spread and a strong temperature effect, so a gate drive that only just meets them will misfire on a cold device. A resistor-triggered circuit can only delay firing up to the peak of the supply (90°); the firing point also moves with temperature and with the particular SCR, which is why phase-shift RC or pulse circuits are used where the angle must be stable. Check the final circuit against the data sheet, including the latching current of the load.
- Independent vectors in the test suite: 39
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Semiconductor Loss Calculator (MOSFET, IGBT or Diode in a Switching Stage: Conduction, Switching, Gate, Output Capacitance and Recovery Loss with Junction Temperature) (`semiconductor-loss`)

- Formula: `Conduction Pc = Vo × I × D + Ron(Tj) × I² × D Ron(Tj) = Ron25 × (1 + tc/100 × (Tj − 25))\nSwitching Eon = ½ V I tr and Eoff = ½ V I tf, or the data-sheet energies × (V / Vref) × (I / Iref); Psw = (Eon + Eoff) × fsw\nCoss Poss = ½ Coss V² fsw Recovery Prr = Qrr × V × fsw Gate Pg = Qg × Vg × fsw\nLoss inside the device Pd = Pc + Psw + Poss + Prr Total Pt = Pd + Pg\nJunction Tj = Ta + Rth × Pd, solved with Ron at Tj: Tj = (Ta + Rth (a + b (1 − 25 k) + Pother)) / (1 − Rth b k), with a = Vo I D, b = Ron25 I² D, k = tc/100\nHighest frequency fmax = ((Tjmax − Ta) / Rth − Pc(Tjmax)) / (Eon + Eoff + Eoss + Err)`
- Inputs: Switched (off-state) voltage [V]; On-state current [A]; Duty cycle D (fraction of the period the device conducts); Switching frequency [kHz]; Conduction offset voltage (0 for a MOSFET) [V]; On-resistance at 25 °C (Rds(on), rce or the diode slope resistance) [mΩ]; On-resistance temperature coefficient (% per K); Switching loss from; Current rise time tr (ns), used with the times; Voltage rise time tf (ns), used with the times; Turn-on energy Eon at the test point (µJ), used with the energies; Turn-off energy Eoff at the test point (µJ), used with the energies; Test voltage of Eon and Eoff [V]; Test current of Eon and Eoff [A]; Total gate charge Qg (0 for a diode) [nC]; Gate drive voltage [V]; Output capacitance Coss (0 to leave out) [pF]; Reverse recovery charge Qrr of the diode that commutates with it (0 to leave out) [nC]; Junction-to-ambient thermal resistance (°C/W); Ambient temperature (°C); Maximum junction temperature (°C)
- Outputs: On-resistance at the junction temperature [mΩ]; Conduction loss [W]; Turn-on energy per cycle (µJ); Turn-off energy per cycle (µJ); Output capacitance energy per cycle (µJ); Reverse recovery energy per cycle (µJ); Switching loss [W]; Output capacitance loss [W]; Reverse recovery loss [W]; Gate drive loss (in the driver, not the device) [W]; Loss inside the device (conduction, switching, Coss and recovery) [W]; Total loss including the gate drive [W]; Junction temperature (°C); Margin to the maximum junction temperature (°C, negative means over); Highest loss inside the device the junction allows at this ambient [W]; Highest switching frequency that keeps the junction within its limit [kHz]; Switching, Coss, recovery and gate loss, % of the total
- Assumptions: One device in a hard-switched stage, at a steady operating point. The conduction loss uses the on-state current as an RMS value while on (Vo I D for the offset and Ron I² D for the resistance), so a current that is not flat while on (a ramp in an inductor) needs its RMS value entered; With the times, the switching loss is the linear overlap estimate ½ V I (tr + tf) fsw: the voltage is held at V while the current rises and the current is held at I while the voltage rises. It leaves out ringing, the Miller plateau, and the IGBT turn-off tail unless you use the data-sheet energies, which include it for the test conditions; With the energies, Eon and Eoff are scaled in proportion to the voltage and the current from the test point. The real dependence is not exactly linear (the energy rises faster than linearly with current for some IGBTs and with temperature), so a warning is given when the voltage or the current is above the test point and the energies should be taken at the junction temperature you expect; The gate loss Qg × Vg × fsw is dissipated mostly in the gate driver and gate resistor, not in the device: it is in the total, not in the loss inside the device that heats the junction. The output capacitance and recovery energies are taken as lost in the device itself, and the recovery loss as Qrr × V (the whole recovery charge at the full voltage), which is an upper estimate for a soft diode; Only the resistive part of the on-state voltage changes with temperature (linearly, through the coefficient); the offset, switching energies, Coss and Qrr are taken as constants. The thermal path is a single resistance to ambient with no heat capacity, so this is a steady-state temperature and not a transient or pulsed one; heating of the sink by neighbouring parts is not included; Third-quadrant (body-diode) conduction, dead-time loss, soft-switching or zero-voltage turn-on, parallel devices sharing current, and the diode or inductor losses of the rest of the converter are not calculated
- Notes: Use this to estimate the loss and the junction temperature of one MOSFET, IGBT or diode before choosing a heat sink. Enter the device values from the data sheet at the junction temperature you expect, and the stage conditions from the converter design. If the junction is over its limit, the highest loss and the highest frequency tell you how far the design is from the limit: lower the frequency, slow the switching less or use a device with lower Rds(on) or lower energies, or lower the thermal resistance with a larger heat sink (see the Heatsink Thermal Resistance calculator). To compare two or three MOSFETs for the same stage use the Switching Loss Comparison Tool, and for the losses of a whole converter use the DC-DC Converter Calculator.
- Independent vectors in the test suite: 40
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

### Solar Inverter Sizing Calculator (DC to AC Ratio, String Voltage Windows, Input Current and Clipping) (`solar-inverter-sizing`)

- Formula: `Pdc = Ns × Np × Pm r = Pdc / Pac Pac(target) = Pdc / r(target)\nVoc(cold) = Ns × Voc × (1 + tcVoc × (Tmin − 25)) Vmp(hot) = Ns × Vmp × (1 + tcVmp × (Tmax − 25)) Vmp(cold) = Ns × Vmp × (1 + tcVmp × (Tmin − 25))\nIsc(input) = ceil(Np / MPPT inputs) × Isc Peak AC = Pdc × k × η Clipped = (Peak AC − Pac) / Peak AC`
- Inputs: Module rated power (STC) [W]; Modules in series per string; Strings in the array (in parallel); Module open-circuit voltage (STC) [V]; Voc temperature coefficient (%/°C); Module maximum-power voltage (STC) [V]; Vmp temperature coefficient (%/°C); Module short-circuit current (STC) [A]; Lowest cell temperature (°C); Highest cell temperature (°C); Inverter AC rating [kW]; Inverter maximum DC input voltage [V]; MPPT window: lowest voltage [V]; MPPT window: highest voltage [V]; MPPT inputs; Maximum short-circuit current per MPPT input [A]; Inverter efficiency at high load (fraction); Peak array output as a fraction of its STC rating; Target DC to AC ratio
- Outputs: Array rating (modules × rated power) [kW]; Number of modules; DC to AC ratio (array / inverter); Inverter AC rating for the target ratio [kW]; Largest array for this inverter at the target ratio [kW]; String open-circuit voltage at the lowest temperature [V]; Most modules per string for the maximum DC voltage; String maximum-power voltage at the highest temperature [V]; String maximum-power voltage at the lowest temperature [V]; Strings on the busiest MPPT input; Short-circuit current on that input [A]; AC output at the assumed peak (before clipping) [kW]; Inverter loading at the assumed peak (%); Share of peak power clipped (%); Array output, as % of its rating, at which the inverter reaches its rating
- Assumptions: Identical modules in every string, all strings of the same length, one orientation; The temperature coefficients are linear and the cold and hot cell temperatures are your data; The short-circuit current is the module STC value; extra current from high irradiance or reflection is not added, so check the inverter data sheet and your code for the margin required; The peak output fraction and the efficiency are user data; the clipped share is for the peak instant only, not a yearly energy loss, which needs an irradiance profile; The 1.0 and 1.5 ratio flags are common practice guidelines, not requirements of a standard; Not checked: string fuse and cable sizing, DC protection and isolation, maximum current per MPPT input at the maximum power point, inverter derating with temperature or altitude, grid-code limits and export limits
- Notes: The cold string voltage must stay under the inverter maximum DC voltage and the hot maximum-power voltage must stay inside the MPPT window, or the inverter stops tracking on hot days. Clipping at the top of the day is usually a small share of the yearly energy at a ratio near 1.2, and it rises with the ratio. Use a simulation with the site irradiance and tilt to price it before choosing a ratio above about 1.3.
- Independent vectors in the test suite: 36
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Hybrid System Sizing Calculator (Solar PV, Battery, Inverter and Generator from a Daily Load) (`hybrid-system-sizing`)

- Formula: `Es = (1 − fg) E En = fn Es Edc = (Es − En) / ηi + En / (ηi × rt) Reserve = max(0, Da Es / ηi − En / ηi)\nEdr = Edc + Reserve / (rt × Dr) Array = Edr / (sun hours × PR) Battery usable = max(En / ηi, Da Es / ηi) Nominal = usable / DoD\nInverter = peak × margin C = (peak / ηi) / nominal Generator hours = fg E / (loading × rating) Fuel = fg E × litres per kWh`
- Inputs: Daily energy use [kWh]; Peak load [kW]; Share of the solar-served energy used after dark or without sun; Share of the daily energy supplied by the generator; Peak sun hours per day; Performance ratio of the array to the DC bus; Inverter efficiency; Battery round-trip efficiency; Usable depth of discharge; Days of autonomy; Days allowed to recharge the autonomy reserve; Battery bank voltage [V]; Module rated power (STC) [W]; Sizing margin on the peak load; Battery maximum discharge rate (C); Generator average loading while running (fraction of its rating); Generator fuel use (litres per kWh)
- Outputs: Energy served by solar and battery per day [kWh]; Part of it passing through the battery [kWh]; Energy supplied by the generator per day [kWh]; Daily DC energy the array must supply (before the reserve recharge) [kWh]; Daily DC energy including the reserve recharge [kWh]; Array rating required [kW]; Modules (whole number); Array rating installed [kW]; Daily DC energy from the installed array [kWh]; Battery usable energy required [kWh]; Battery nominal capacity required [kWh]; Battery nominal capacity at the bank voltage [Ah]; Daily battery cycle depth (% of nominal capacity); Battery discharge rate at the peak load (C); Days to recharge the reserve with the installed array; Inverter rating (peak load × margin) [kW]; Generator rating (peak load × margin) [kW]; Generator running hours per day; Generator fuel per day (litres)
- Assumptions: One day of average load, no seasonal change: size for the worst month you will operate in; The array output is its STC rating × sun hours × performance ratio; the performance ratio already holds temperature and charge-controller losses; The energy taken after dark passes PV to battery to loads once; one round-trip efficiency covers the battery, one average efficiency covers the inverter; The autonomy reserve is the battery energy beyond the nightly cycle; refilling it is added to the array in the chosen number of days; The generator carries its share of the energy at an assumed loading and fuel use, both user data; it does not charge the battery in this model; The margin of 1.25 and the 0.6 to 0.8 generator loading are common practice, not requirements of a standard; Not checked: hourly dispatch or yearly simulation, battery cycle life, temperature and ageing derating, charge-controller and DC bus voltage and current, cable and protection sizing, motor starting and surge power, grid-code limits
- Notes: This is a first sizing from the energy balance of a typical day. It shows what the array, battery, inverter and generator have to be before you spend time on a simulation. Test the result against the worst month, run an hourly simulation with your load profile, and take cycle life, temperature derating and the charge controller from the manufacturer data. A generator share above zero lowers the array and battery but adds running hours and fuel.
- Independent vectors in the test suite: 38
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### PV Performance Ratio Calculator (PR, Loss Waterfall and Degradation) (`pv-performance-ratio`)

- Formula: `Yf = E / P0 Yr = H / G_STC with G_STC = 1 kW/m² PR = Yf / Yr = E / (P0 × H) Ideal energy Eid = P0 × H Temperature-corrected PR = PR / (1 + γ (Tm − 25)) Waterfall (each step is taken on the energy left by the one before): degradation (1 − d)^years, temperature 1 + γ (Tm − 25), soiling, DC wiring and mismatch, availability, other, inverter efficiency Expected PR = product of the factors Gap = expected energy − measured energy Shortfall = target PR × Eid − E`
- Inputs: AC energy delivered at the meter over the period, kWh; Array nameplate DC power, kWp; Plane-of-array irradiation over the same period, kWh/m²; Days in the period; Average module temperature while generating, °C; Power temperature coefficient γ, % per °C (negative); Soiling loss, %; DC wiring and mismatch loss, %; Availability and curtailment loss, %; Other losses (shading, reflection, low light, AC), %; Inverter efficiency (weighted), %; Years in service; Annual degradation, % per year; Target performance ratio, % (0 to skip)
- Outputs: Final yield Yf = E / P0 (kWh per kWp over the period); Final yield per day (kWh per kWp per day); Reference yield Yr = H / 1 kW/m² (peak-sun hours over the period); Performance ratio PR = Yf / Yr (%); Ideal energy P0 × Yr (kWh); Energy lost against the ideal (kWh); Temperature-corrected PR, to 25 °C module temperature (%); Waterfall: degradation loss (kWh); Waterfall: module temperature loss (kWh); Waterfall: soiling loss (kWh); Waterfall: DC wiring and mismatch loss (kWh); Waterfall: availability and curtailment loss (kWh); Waterfall: other losses (kWh); Waterfall: inverter loss (kWh); Expected energy from the waterfall (kWh); Expected PR from the waterfall (%); Expected PR of the same plant when new (%); Expected minus measured energy (kWh, positive = measured is short); Measured energy below the expected (%, negative = above); Energy at the target PR (kWh); Shortfall against the target (kWh, negative = surplus); PR minus target (percentage points)
- Assumptions: The performance ratio is the plain IEC 61724-1 energy ratio PR = (E / P0) / (H / 1 kW/m²) over the period you give: the energy is the AC energy at the metering point, P0 is the nameplate DC power at standard test conditions, and H is the plane-of-array irradiation over the same hours; PR is not an efficiency and has no unit; The irradiation is measured in the plane of the modules, the energy and irradiation cover exactly the same period, and the sensor is accurate (a pyranometer is usually within 2 to 5 %); a PR of a single day or a week is noisy and one over a whole year is the figure usually used for acceptance; The temperature step uses one average module temperature and a linear power coefficient from 25 °C; it is not the interval-by-interval temperature-weighted correction of IEC 61724-1, so the corrected PR is an estimate; The waterfall is a design estimate in which every loss is a percentage you enter, applied one after another to the energy left by the step before; the kWh given to each step depends on that order, although the expected PR does not; Degradation is compounded each year, (1 − d)^years, from the nameplate power; light-induced degradation in the first year, if the data sheet gives it, is part of the annual figure you enter; No inverter clipping, tracker, bifacial gain, snow, grid availability data, sensor drift or soiling model is included: a clipped, bifacial or tracked plant should enter those effects in the other losses (a gain can be entered as a negative figure only by reducing the other losses)
- Notes: The performance ratio says how much of the energy the array would make at its nameplate rating, in the sunlight that fell on it, actually reached the meter. A PR of 80 % means 20 % was lost on the way to temperature, dirt, wiring, the inverter, downtime and the like. Because the sunlight is divided out, a good plant and a poor one can be compared across sites and seasons, although temperature still moves it: PR is lower in a hot month, which is why the temperature-corrected PR is shown. The waterfall adds up the losses you expect, and the gap to the measured energy shows what is not explained by them: a measured PR well below the expected one points to a fault, soiling above the figure entered, an outage or a sensor problem, and one above it suggests the losses entered are too high or the irradiation sensor reads low. A new plant often reaches 80 to 85 % and a poor one is below 70 %, but the right figure depends on the climate, mounting and design, so treat those as rough bands and use your contract or design figure for acceptance. This is a worksheet on the figures you enter, not an acceptance test to IEC 61724-1 or IEC 62446-3: the monitoring class, the sensor calibration, the data filtering, the interval-by-interval temperature correction and the test period come from your procedure.
- Independent vectors in the test suite: 42
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

### EV Energy Consumption Calculator (Wh/km, kWh/100 km and Running Cost) (`ev-energy-consumption`)

- Formula: `θ = atan(grade / 100) Fr = Crr m g cos θ Fa = ½ ρ Cd A v² Fg = m g sin θ Pw = (Fr + Fa + Fg) v\nBattery power = Pw / ηdrive + Paux (Pw ≥ 0) or Pw × ηregen + Paux (Pw < 0)\nWh/km = P(battery) / v × 1000 / 3600 From the grid = Wh/km / ηcharge Cost = kWh × price`
- Inputs: Vehicle mass with driver and load (kg); Constant speed [km/h]; Drag coefficient Cd; Frontal area [m²]; Rolling resistance coefficient Crr; Air density (kg/m³); Road grade (%, uphill positive); Drivetrain efficiency, battery to wheels; Regeneration efficiency, wheels to battery; Auxiliary load (heating, cooling, electronics) [kW]; Charging efficiency, grid to battery; Trip distance [km]; Distance per year [km]; Electricity price per kWh (any currency)
- Outputs: Rolling resistance force (N); Air drag force (N); Grade force (negative downhill) (N); Total force at the wheels (N); Air drag as a share of rolling plus air resistance (%); Power at the wheels [kW]; Battery power (drive plus auxiliary) [kW]; Energy per km at the battery (Wh/km); Energy per km from the grid (Wh/km); Consumption at the battery (kWh/100 km); Consumption from the grid (kWh/100 km); Distance per kWh from the grid (km/kWh); Distance per kWh from the grid (miles/kWh); Trip time [h]; Trip energy at the battery [kWh]; Trip energy from the grid [kWh]; Energy from the grid per year [kWh]; Running cost per year; Running cost per 100 km
- Assumptions: Constant speed on a straight road of constant grade, with no wind; there is no acceleration, no stop and go and no speed change; g = 9.80665 m/s². Air density, drag coefficient, frontal area and rolling resistance coefficient are constants you enter; the rolling coefficient does not change with speed, tyre pressure or temperature; One average drivetrain efficiency applies to driving and one to regeneration; both are held constant and are not curves of speed or load; The auxiliary load is constant and is drawn from the battery all the time; Distance is road distance; the grade is rise over horizontal run, so the angle is atan(grade / 100); Charging efficiency is one average figure from the grid to the battery
- Notes: This is a steady-speed estimate for comparing speeds, grades and loads, and for a first running-cost figure. Real consumption is higher in stop-and-go driving, in cold weather (battery and cabin heating), with a headwind, with under-inflated tyres and at the vehicle's edge of the motor efficiency map. The test-cycle figure on the vehicle label (for example WLTP) is measured differently. Use a logged drive for a precise figure.
- Independent vectors in the test suite: 38
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### EV Range Estimator (Pack Voltage, Capacity, Usable Energy and Driving Range) (`ev-range`)

- Formula: `Vpack = Ns × Vcell Qpack = Np × Qcell Enom = Vpack × Qpack\nEavailable = Enom × (SoH / 100) × (temperature factor / 100) Eusable = Eavailable × (SoC start − reserve) / 100\nWh/km total = Wh/km driving + Paux / v Range = Eusable / (Wh/km total) × 1000\nCharge for a trip = distance × Wh/km total / Eavailable × 100 Arrival charge = start − charge for the trip`
- Inputs: Cells in series; Cells in parallel (per series group); Cell nominal voltage (V); Cell capacity [Ah]; State of health (% of rated capacity); Temperature capacity factor (% of the 20 °C capacity); Starting state of charge (%); Reserve to keep at the end (%); Driving consumption at the battery (Wh/km); Auxiliary load (heating, cooling, electronics) [kW]; Average speed [km/h]; Trip distance [km]
- Outputs: Pack nominal voltage [V]; Pack capacity [Ah]; Cells in the pack; Pack nominal energy (new, at the reference temperature) [kWh]; Energy available at this health and temperature (100% to 0%) [kWh]; Usable energy between the start and the reserve [kWh]; Auxiliary energy per km (Wh/km); Total consumption at the battery (Wh/km); Range to the reserve [km]; Range to the reserve (miles); Range from 100% to 0% at this health and temperature [km]; Range of the new pack with no auxiliary load, 100% to 0% [km]; Range lost to ageing, cold, reserve, start charge and auxiliaries (%); Distance per 1% of charge (km); Driving time to the reserve [h]; Average battery power at this speed [kW]; Average discharge rate (C, per hour); Energy for the trip at the battery [kWh]; Charge needed for the trip (% of the available energy); Charge on arrival (%); Distance margin over the trip (negative: short by) [km]
- Assumptions: Capacity is taken as constant between the start and the reserve: the voltage curve of the cell, its change with charge and the rate of discharge are not modelled, and the energy is the nominal voltage times the capacity; The state of health and the temperature factor are single numbers you enter; they scale the whole pack and are not looked up; The driving consumption is one average figure at the battery for the speed and conditions of the trip; the auxiliary load is a constant power spread over the distance at the average speed; No regeneration, grade, wind or speed profile is modelled beyond what is in the consumption figure, and no buffer or hidden reserve held back by the battery management system is added
- Notes: This is a planning estimate from the pack and the consumption you enter. Real range also depends on the speed profile, the grade, wind, tyre pressure, the battery temperature during the trip, the charge limits the vehicle applies and the rate of discharge. The label (WLTP or EPA) range is measured on a test cycle and will differ. Pack energy from nominal voltage times capacity is the usual rating but is not the energy at every charge level. For a longer trip, allow a margin and plan the charging stops, not only the arrival charge. Use the EV Energy Consumption Calculator to find the consumption from speed, mass and drag.
- Independent vectors in the test suite: 38
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### EV Charger Load Calculator (Site Demand, Diversity and Supply Limit) (`ev-charger-load`)

- Formula: `Group demand = (chargers in use) × (rated power × average power %) / efficiency chargers in use = round up(number × share in use %) Connected load = Σ number × rated power / efficiency Diversity factor = demand / connected load Q = P × tan(arccos pf) for chargers and for the building S = √((Pc + Pb)² + (Qc + Qb)²) I = S / (√3 × V) (three-phase) or S / V (single-phase) Design S = S × (1 + spare %) Transformer = smallest standard size ≥ design S Power left for chargers: solve √((P + Pb)² + (P tan φc + Qb)²) = limit for P Share = P / connected load`
- Inputs: Supply voltage (line-to-line for three-phase) [V]; Phase; Group 1 (AC chargers): number of chargers; Group 1: rated power of one charger, kW; Group 1: efficiency from the supply to the rated output, %; Group 1: share of chargers in use at the busiest time, %; Group 1: average power while charging, % of rating; Group 2 (DC fast chargers): number of chargers; Group 2: rated power of one charger, kW; Group 2: efficiency from the supply to the rated output, %; Group 2: share of chargers in use at the busiest time, %; Group 2: average power while charging, % of rating; Charger power factor; Other (building) load at its maximum demand, kW; Building load power factor; Spare capacity for growth, %; Supply limit to check against, kVA (0 to skip)
- Outputs: Group 1: chargers in use at the peak; Group 2: chargers in use at the peak; Connected load, every charger at full rating (kW at the supply); Charger demand at the peak (kW); Diversity factor of the chargers (peak demand ÷ connected load); Charger demand at the peak (kVA); Site demand, chargers and building (kW); Site demand (kvar); Site demand (kVA); Site power factor; Site current at the peak (A); Design demand with spare capacity (kVA); Design current with spare capacity (A); Next standard transformer at or above the design demand (kVA); Peak demand as a share of that transformer (%); Room under the supply limit at the peak (kVA, negative = over); Room under the supply limit at the design demand (kVA, negative = over); Power the supply limit leaves for the chargers (kW); Share of its rating each charger gets if all are used at once (%, 100 = no cut)
- Assumptions: The two groups are all the chargers on the supply, every charger in a group is the same, and the share in use, the average power while charging and the efficiency are your inputs: the calculator applies a diversity you choose and does not take one from a standard or a code table; Demand is taken at one busiest moment, with the chargers and the building load peaking together (the building maximum demand is added in full, which is conservative if they peak at different times); Efficiency is the rated output over the power drawn from the supply at full power; the same figure is used at part load, and a charger standing idle is taken as drawing nothing; The power factor of each part is constant, and the chargers are balanced across the three phases; no harmonics, unbalance, inrush or voltage drop is included; The supply limit is compared in kVA with the peak and design demand; the load-management figures are the kW and the share of rating that the limit leaves for the chargers after the building load, not a controller design
- Notes: Diversity is the main judgement in a charging site. A workplace or home car park where cars sit for hours behaves very differently from a motorway hub where fast chargers are full all day, so test the share in use and the average power against a count from a similar site rather than taking one figure for all of them. Where the supply cannot carry every charger at full rating, load management shares the available kW between the vehicles in use; the last two results show how much it would have to cut. The calculator does not apply a code diversity or demand table (IEC 60364-7-722, NEC Article 625 and local rules differ), nor a utility connection rule: check those separately before ordering equipment.
- Independent vectors in the test suite: 42
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

### Lighting Uniformity Calculator (Average, Minimum, Maximum and Uniformity Ratios from Measured or Calculated Lux Points) (`lighting-uniformity`)

- Formula: `Eavg = (E1 + E2 + … + En) / n\nUo = Emin / Eavg U1 = Emin / Emax Emax / Eavg\nStandard deviation σ = √( Σ (Ei − Eavg)² / n ) Coefficient of variation = σ / Eavg × 100\nLowest point needed = Uo,required × Eavg Shortfall = max(0, Uo,required × Eavg − Emin)`
- Inputs: Number of points used; Point 1 (lux); Point 2 (lux); Point 3 (lux); Point 4 (lux); Point 5 (lux); Point 6 (lux); Point 7 (lux); Point 8 (lux); Point 9 (lux); Point 10 (lux); Point 11 (lux); Point 12 (lux); Required average illuminance (lux); Required uniformity Uo (Emin / Eavg)
- Outputs: Average illuminance Eavg (lux); Minimum illuminance Emin (lux); Maximum illuminance Emax (lux); Uniformity Uo = Emin / Eavg; Ratio U1 = Emin / Emax; Ratio Emax / Eavg; Standard deviation of the points (lux); Coefficient of variation (%); Number of the lowest point; Number of the highest point; Average meets the requirement (1 = yes, 0 = no); Uniformity meets the requirement (1 = yes, 0 = no); Lowest point needed for the required Uo (lux); Lux the lowest point is short by (0 if met)
- Assumptions: The points are a fair sample of the area: a regular grid, or the positions your method prescribes, each point counted once; All readings are illuminance on the same plane (horizontal, vertical or the plane in your method) and in the same unit, lux; The average is the simple mean of the points. An area-weighted mean, or a grid whose points do not each stand for the same area, is not handled; The standard deviation is over the n points entered (divisor n), not an estimate for a larger population (divisor n − 1); Uo = Emin / Eavg is the usual definition of uniformity; some specifications use Emin / Emax or another ratio, so check which one your document names, and enter your own requirements
- Notes: Use this to check a lighting survey or a calculation grid against a specification: enter the lux at each point, the average you need and the uniformity you need. If the uniformity fails, the shortfall shows how far the lowest point is from passing, and the ratio of highest to average shows whether the problem is a dark spot or a bright one. For the average lux from the lamp output, use the lumen method; for the lux at a single point from a luminaire, use the candela, lux and distance calculator. The calculator does not decide how many points a survey needs or where they go; that comes from your standard or method.
- Independent vectors in the test suite: 30
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Point-by-Point Lighting Calculator (Illuminance, Uniformity and Light Spread from a Grid of Identical Luminaires) (`point-by-point-lighting`)

- Formula: `E at a point = MF × Σ I(γ) × cos γ / d² I(γ) = I0 × cos^m γ cos γ = h / d d² = r² + h² So each luminaire gives MF × I0 × h^(m+1) / (r² + h²)^((m+3)/2), r being its horizontal distance from the point Eavg = mean of the grid points Uo = Emin / Eavg U1 = Emin / Emax Lowest point needed = Uo,required × Eavg Flux of one luminaire Φ = I0 × 2π / (m + 1) Share landing on the area = (Eavg / MF) × area / (n × Φ) Half-intensity angle = arccos(0.5^(1/m))`
- Inputs: Luminaires along the length (x); Luminaires across the width (y); Spacing along x [m]; Spacing along y [m]; Mounting height above the plane [m]; Intensity straight down (cd); Light spread exponent (0 to 20); Maintenance factor; Calculation points along x; Calculation points along y; Required average illuminance (lux); Required uniformity Uo (Emin / Eavg); Point of interest: distance along x [m]; Point of interest: distance along y [m]
- Outputs: Area served (m²); Number of luminaires; Average illuminance Eavg (lux); Minimum illuminance Emin (lux); Maximum illuminance Emax (lux); Uniformity Uo = Emin / Eavg; Ratio U1 = Emin / Emax; Darkest point: distance along x (m); Darkest point: distance along y (m); Illuminance at the point of interest (lux); Illuminance directly under one luminaire, that one alone (lux); Average meets the requirement (1 = yes, 0 = no); Uniformity meets the requirement (1 = yes, 0 = no); Lowest point needed for the required Uo (lux); Lux the lowest point is short by (0 if met); Half-intensity angle from the vertical (°); Flux implied by the pattern, all luminaires (lm); Share of that flux landing on the area, before maintenance (ratio)
- Assumptions: Direct light only: nothing reflected from walls, floor or ceiling is added, so the result is lower than a lit room and the area edge is dark because no light comes from beyond it; The plane is horizontal and the luminaires hang straight down with no tilt; the illuminance is the horizontal component on that plane; Every luminaire is the same and has the same maintenance factor, with intensity I0 × cos^m γ at the angle γ from the vertical, round the vertical axis; a real luminaire with a different pattern in different planes is not matched; Each luminaire is a point source: the plane must be farther away than about five times the luminaire size; The calculation points are at the centres of equal rectangles over the area the array serves; the average is the plain mean of those points, so a different grid, or points outside the array, will give different averages and a different minimum; No obstruction, shadowing, glare, colour or visual-comfort assessment
- Notes: Use this to compare layouts before a lighting design is run in full photometric software: change the spacing, height or number of luminaires and watch the uniformity. To check a survey or a grid of results you already have, use the lighting uniformity calculator; for the average lux from the lamp output by the lumen method, use that calculator; for one luminaire and one point, use the candela, lux and distance calculator. Whether the area edge is part of the task area, how many points a survey needs and what the requirements are come from your standard or your specification, not from this calculator. The light spread exponent is a fit: when a manufacturer gives a full candela table, use that table in a photometric program.
- Independent vectors in the test suite: 38
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 29 Industrial Electrical

### Load Schedule Calculator (Connected Load to Maximum Demand) (`load-schedule`)

- Formula: `Row: Pc = n × P Pd = Pc × demand factor Qd = Pd × tan(acos pf) Totals: P = ΣPd / diversity Q = ΣQd / diversity S = √(P² + Q²) pf = P / S Design: Sdes = S × (1 + margin) I = Sdes / (√3 V) (three-phase) or Sdes / V (single-phase)`
- Inputs: Supply voltage (line-to-line for three-phase) [V]; Phase; Group diversity factor; Spare margin for future growth (%); Load 1: rated power of each unit (0 leaves the row out) [kW]; Load 1: number of units; Load 1: demand factor; Load 1: power factor; Load 2: rated power of each unit (0 leaves the row out) [kW]; Load 2: number of units; Load 2: demand factor; Load 2: power factor; Load 3: rated power of each unit (0 leaves the row out) [kW]; Load 3: number of units; Load 3: demand factor; Load 3: power factor; Load 4: rated power of each unit (0 leaves the row out) [kW]; Load 4: number of units; Load 4: demand factor; Load 4: power factor; Load 5: rated power of each unit (0 leaves the row out) [kW]; Load 5: number of units; Load 5: demand factor; Load 5: power factor; Load 6: rated power of each unit (0 leaves the row out) [kW]; Load 6: number of units; Load 6: demand factor; Load 6: power factor; Load 7: rated power of each unit (0 leaves the row out) [kW]; Load 7: number of units; Load 7: demand factor; Load 7: power factor; Load 8: rated power of each unit (0 leaves the row out) [kW]; Load 8: number of units; Load 8: demand factor; Load 8: power factor
- Outputs: Connected load [kW]; Connected load [kVA]; Load 1 demand [kW]; Load 2 demand [kW]; Load 3 demand [kW]; Load 4 demand [kW]; Load 5 demand [kW]; Load 6 demand [kW]; Load 7 demand [kW]; Load 8 demand [kW]; Maximum demand [kW]; Maximum demand [kVAR]; Maximum demand [kVA]; Overall power factor at maximum demand; Overall demand factor (demand ÷ connected load); Design load including the spare margin [kVA]; Design current [A]
- Assumptions: Each row is one group of identical loads at one demand factor and power factor; group similar loads into one row; Active and reactive demands are added separately, so the overall power factor follows from the mix of rows rather than being averaged; The diversity factor divides the active and reactive totals alike, so the overall power factor does not change with it; Demand factors, diversity and the spare margin are entered by the user from the project specification or the standard in use; none are built in; Loads are balanced across the phases; harmonics, motor starting current and the largest-motor-start allowance are not included; The kVAR of each row comes from its power factor, assumed lagging
- Notes: Take the demand factors and diversity from your specification. Use the design kVA to choose a transformer or generator and the design current to check the incomer and cable; then check voltage drop and fault level separately.
- Independent vectors in the test suite: 40
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

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

### Ladder Logic Simulator (Start/Stop Seal-In Rung with On-Delay or Off-Delay Timer) (`ladder-logic-simulator`)

- Formula: `Rung 1: M = (START OR M) AND NOT STOP AND NOT OL (M on the right is the output, M on the left is its holding contact from the previous scan)\nTON: ACC = min(time the rung has been true, PT) when the rung is true, otherwise 0; DN = rung true AND ACC ≥ PT\nTOF: ACC = 0 while the rung is true, otherwise min(time the rung has been false, PT); DN = rung true OR ACC < PT\nPercent complete = ACC / PT × 100; time left = PT − ACC; scans in the preset = PT / scan time, rounded up`
- Inputs: Timer type; START pushbutton (normally open, XIC); STOP pushbutton (normally closed, XIO); Overload relay (normally closed contact, XIO); Holding contact M (state of the motor contactor in the previous scan); Timer preset PT (s); Time the timer has been running (s); PLC scan time (ms)
- Outputs: Motor contactor M (rung 1 output): 1 on, 0 off; Timer rung enable (1 true, 0 false); Timer accumulated time ACC (s); Timer done bit DN, the delayed output: 1 on, 0 off; Time left to the preset (s); Timer complete (% of preset); PLC scans in the preset
- Assumptions: One scan is evaluated: inputs are read, rung 1 is solved, then the timer rung, using the holding contact from the previous scan; a program with other rungs, other instructions or a different rung order is not covered; Rungs are solved left to right and top to bottom, the way a PLC scans; the contactor state used by the holding contact is the one from the end of the previous scan; The timer is continuous: the time the timer has been running is entered, and it is not rounded to the PLC time base or to a scan; Pushbuttons are ideal (no contact bounce), and the STOP pushbutton and the overload contact are wired normally closed, so the program reads them as true when healthy; if your STOP is wired normally open, the logic differs
- Notes: Use this to check how a start/stop rung and a delay timer behave before entering them in a PLC, or to explain the seal-in circuit: a short press of START turns M on, and the holding contact keeps it on until STOP is pressed or the overload trips. STOP and the overload always win over START. The timer here is a single TON or TOF; counters, one-shot and retentive timers are not included.
- Independent vectors in the test suite: 78
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Busbar Sizing Calculator (Load Area, Number of Bars and Short-Circuit Withstand) (`busbar-sizing`)

- Formula: `A(load) = I / J Ab = w × t n(load) = ⌈A(load) / Ab⌉ A(fault) = Isc × √t / k n(fault) = ⌈A(fault) / Ab⌉ n = max(n(load), n(fault)) J(actual) = I / (n × Ab) Iwithstand = n × Ab × k / √t m = n × Ab × ρm R = ρ [1 + α (T − 20)] / (n × Ab) P = I² R`
- Inputs: Busbar material; Load current per phase [A]; Design current density J (A/mm²); Bar width [mm]; Bar thickness [mm]; Fault current through the busbar [kA]; Fault duration [s]; Material constant k (A·√s/mm²); Working temperature (°C)
- Outputs: Cross-section the load needs, I / J [mm²]; Area of one bar [mm²]; Bars for the load (rounded up); Cross-section the fault needs, Isc × √t / k [mm²]; Bars for the fault (rounded up); Bars to install (the larger of the two); Installed cross-section [mm²]; Actual current density (A/mm²); Short-circuit withstand of the installed bars, A × k / √t [kA]; Installed area / area the fault needs (above 1 is a margin); Mass per metre of the installed bars (kg/m); DC resistance per metre per phase at the working temperature [mΩ]; Loss per metre per phase at the load current (DC) [W]
- Assumptions: The current density J is a rule-of-thumb input and not a rating: the real current rating of a busbar depends on the temperature rise allowed, the enclosure, the ambient temperature, the paint and the way the bars are arranged and spaced, so the maker's or the standard's rating governs; Bars in parallel carry less than the sum of their areas because of the skin and proximity effects, and this calculator does not apply any derating for that; The short-circuit area uses the adiabatic relation A = Isc × √t / k with k supplied by the user from the standard or the maker for the material and the temperature; it is a thermal check only and is meant for fault times up to about 5 s; The fault is taken as the r.m.s. current for the whole duration: the electromagnetic force on the bars and their supports, the support spacing and the peak current are not checked; The resistance is the DC resistance of the bars at the working temperature with ρ and α for copper (0.017241 Ω·mm²/m, 0.00393 per °C) or aluminium (0.02826 Ω·mm²/m, 0.00403 per °C), and the loss is I² R; skin and proximity effects raise the AC value, and the load current is taken as one steady value
- Notes: Use this to size a busbar from the load current and a design current density, and to check that the bars you choose also carry the fault until it is cleared: the cross-section must be at least Isc × √t / k. The number of bars is the larger of the two answers. It is a screening calculation: the temperature rise, the electromagnetic force on the bars and supports, the derating of bars in parallel and the type-tested rating of the assembly are not checked, and the busbar maker's ratings and the standard govern the design.
- Independent vectors in the test suite: 46
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Plant Load Flow Planner (Utility to Loads) (`plant-load-flow`)

- Formula: `Pk = connected × demand factor Qk = Pk tan φk Pd = kc ΣPk Qd = kc ΣQk Qn = Qd − Qc Sn = √(Pd² + Qn²) x = Sn / St Losses: Pl = P0 + x² Pcu Ql = Q0 + x² Qz Q0 = √((i0 St)² − P0²) Qz = √((uk St)² − Pcu²) Utility: Pu = Pd + Pl Qu = Qn + Ql Qx = Qu − Pu tan(acos pft)`
- Inputs: Plant bus voltage (L-L) [V]; Utility supply voltage (L-L) [kV]; Main transformer rating [kVA]; Transformer impedance (%); Transformer full-load copper loss [kW]; Transformer no-load (iron) loss [kW]; Transformer no-load current (%); Group 1 connected load (for example process motors) [kW]; Group 1 demand factor; Group 1 power factor; Group 2 connected load (for example HVAC and compressors) [kW]; Group 2 demand factor; Group 2 power factor; Group 3 connected load (for example heating) [kW]; Group 3 demand factor; Group 3 power factor; Group 4 connected load (for example lighting and small power) [kW]; Group 4 demand factor; Group 4 power factor; Coincidence factor between groups; Capacitor bank on the plant bus [kVAR]; Target power factor at the utility
- Outputs: Group 1 demand [kW]; Group 1 apparent demand [kVA]; Group 2 demand [kW]; Group 2 apparent demand [kVA]; Group 3 demand [kW]; Group 3 apparent demand [kVA]; Group 4 demand [kW]; Group 4 apparent demand [kVA]; Plant demand (after coincidence) [kW]; Plant reactive demand (before capacitors) [kVAR]; Plant power factor before capacitors; Net reactive power at the plant bus [kVAR]; Plant bus apparent power [kVA]; Power factor at the plant bus; Plant bus line current [A]; Transformer loading (% of rating); Spare transformer capacity [kVA]; Transformer real power loss [kW]; Transformer reactive power loss [kVAR]; Real power from the utility [kW]; Reactive power from the utility [kVAR]; Apparent power from the utility [kVA]; Power factor at the utility; Utility incoming line current [A]; Extra capacitor needed for the target power factor [kVAR]
- Assumptions: Balanced three-phase plant at one voltage level, one main transformer and one capacitor bank; Each group has one demand factor and one power factor; the groups add as complex power, so their power factors combine correctly; The coincidence factor scales both the kW and the kvar of the sum of the groups, so the plant power factor is that of the sum; Transformer copper loss goes with the square of the load, the iron loss and magnetising current stay constant, and the reactive loss follows from the impedance and no-load current; The capacitor bank is fully in service at the maximum demand and the supply voltage is nominal, so a capacitor delivers its rated kvar; The extra capacitor figure is worked at the present loading; a larger bank trims the transformer reactive loss slightly, so it errs on the high side; Cable and busbar losses, voltage drop, harmonics and motor starting are not modelled
- Notes: This is a planning tool for the power that flows from the utility to the loads at the maximum demand. Check that the transformer is not overloaded and keeps room for growth (many designers plan for about 70 to 80 % loading, though your specification governs), that the power factor at the utility meets the tariff or supply agreement, and that the capacitor bank does not push the plant bus to a leading power factor at light load. The demand and coincidence factors are your inputs, and they decide the answer: take them from the project specification, measured load data or a standard, not from the defaults. It does not replace a network study.
- Independent vectors in the test suite: 42
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Contact Resistance Calculator (Constriction and Film Resistance, Voltage Drop and Spot Heating) (`contact-resistance`)

- Formula: `A = F / H a = √(A / (n π)) Rc = (ρ1 + ρ2) / (4 n a) Rf = σf / A R = Rc + Rf\nU = I R P = I² R Tmax² = Tb² + U² / (4 L) L = 2.45e-8 V²/K²\nU at a temperature T = 2 √(L (T² − Tb²)) I at that temperature = U / R\nMode 2: R = Um / I single-spot radius = (ρ1 + ρ2) / (4 R)`
- Inputs: What to calculate; Resistivity of contact member 1 [Ω·m]; Resistivity of contact member 2 [Ω·m]; Contact force (N) (mode 1); Hardness of the softer member (MPa) (mode 1); Number of contact spots (mode 1); Film resistance per unit area (mΩ·mm²) (mode 1); Current through the contact [A]; Measured voltage drop across the contact (mode 2) [mV]; Temperature of the bulk metal beside the contact (°C); Softening temperature of the contact metal (°C); Melting temperature of the contact metal (°C); Resistance limit to check against (µΩ, 0 to skip)
- Outputs: True contact area A = F / H (mm²) [mm²]; Radius of each contact spot (µm); Constriction resistance (µΩ); Film resistance (µΩ); Total contact resistance (µΩ); Radius of the single clean spot that gives this resistance (µm); Voltage drop across the contact [mV]; Power lost in the contact [W]; Temperature of the hottest spot (°C); Spot temperature above the bulk metal (K); Contact voltage that brings the spot to the softening temperature [mV]; Contact voltage that brings the spot to the melting temperature [mV]; Current at which the spot reaches the softening temperature [A]; Current at which the spot reaches the melting temperature [A]; Total resistance divided by the limit
- Assumptions: One clean circular spot between two flat metal surfaces has the constriction resistance (ρ1 + ρ2) / (4a) (Holm); n equal spots far enough apart not to interact give 1 / n of that at the same total area, so the figure is a lower bound when spots cluster; The true contact area is the force divided by the hardness of the softer member (plastic contact, no elastic recovery); it is not the area of the visible contact face; A surface film adds a resistance per unit area in series with the constriction and is spread over the whole true area; it is your own figure; The spot temperature follows the Kohlrausch relation Tmax² = Tb² + U² / (4 L) with the Lorenz number L = 2.45e-8 V²/K² (Wiedemann-Franz law), both members of one metal or of metals with the same behaviour, steady heating; Resistivity and hardness are taken as constants at the values entered; they change with temperature and with the cold working of the metal
- Notes: Use this to see how contact force, hardness and surface condition set the resistance of a connector, a terminal or a bolted joint, and to judge a millivolt-drop reading. Resistance falls as the force rises only as its square root, so doubling the force lowers it by about 29%. In practice a measured joint is usually higher than the clean-metal figure because of film and because the true contact is made at many small spots; use mode 1 for a lower bound and for sensitivity, and mode 2 for real readings. Once the spot temperature approaches the softening temperature the area grows and the resistance falls, and near melting the contact can weld, so the relation holds only up to those points. The measured drop must be taken right at the contact: if it includes bulk conductor, the result is too high and the spot heating is overstated. This calculator does not model creep, fretting, stress relaxation, plating wear or the thermal rise of the whole joint, and it supplies no acceptance limit.
- Independent vectors in the test suite: 38
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Thermal Rise Estimator (Enclosure Temperature Rise, Cooling Airflow and Warm-Up Time) (`thermal-rise`)

- Formula: `Surface: free-standing A = 2HW + 2HD + WD wall-mounted A = HW + 2HD + WD G = h × A Steady state: ΔT = P / G Ti = Ta + ΔT Pmax = G × (Tmax − Ta) Pex = P − Pmax (if positive) Airflow: V̇ = Pex / (ρ × cp,air × (Tmax − Ta)) cp,air = 1005 J/(kg·K) Warm-up: τ = m cp / G T(t) = Ta + ΔT × (1 − e^(−t/τ)) time to the limit = −τ × ln(1 − (Tmax − Ta) / ΔT)`
- Inputs: Heat dissipated inside the enclosure (W); Mounting (which faces lose heat); Enclosure width [m]; Enclosure height [m]; Enclosure depth [m]; Exposed surface area (m², used only if you enter it); Surface material; Overall heat transfer coefficient (W/m²K, used only if you enter it); Ambient air temperature outside (°C); Highest allowed internal air temperature (°C); Thermal mass: weight of enclosure and equipment (kg, 0 to skip); Average specific heat of that mass (J/kg·K); Time since the heat started [h]; Air density for the ventilation airflow (kg/m³)
- Outputs: Exposed surface area [m²]; Heat transfer coefficient used (W/m²K); Thermal conductance to outside air (W/K); Steady-state temperature rise of the internal air above ambient (K); Steady-state internal air temperature (°C); Heat the enclosure can lose with the internal air at the limit [W]; Heat that must be removed (extra) to stay at the limit [W]; Ventilation airflow that removes it, with the air leaving at the limit [m³/h]; Thermal time constant [min]; Internal air temperature after the time given (°C); Time to reach the limit [min]
- Assumptions: One lumped average internal air temperature: the air at the top is hotter than the average and parts next to a heat source are hotter than the air; A sealed enclosure losing heat only through its outer surface by convection and radiation, with a single overall heat transfer coefficient h for all faces; The coefficients for the listed materials are typical figures used for sheet-metal and plastic enclosures in cooling guides, not values set by a standard; use the enclosure maker's figure when you have it; The exposed area is a plain geometric area of the faces that lose heat; no allowance is made for ribs, doors held open, enclosures side by side or partitions inside; No heat from the sun or from other equipment nearby, all of the dissipated power is treated as heat, and the ambient does not change; The warm-up uses one lumped thermal mass at the same temperature as the air, so it is an estimate of the order of the time, not a prediction; the heat in the air itself is ignored; The ventilation airflow removes only the heat in excess of what the surface can lose, with outside air entering at the ambient temperature and leaving at the limit
- Notes: Use this to see whether an enclosure will stay inside the temperature limit of what is in it, and how much extra cooling it needs if not. The formal method for the temperature rise of switchgear and controlgear assemblies is a separate standard with its own area and installation factors; this is a simpler estimate for early sizing, so check the final design against the standard your assembly is built to and against the maker's thermal data. Allow for a margin, because dust on filters, a hot ambient and equipment added later all reduce the cooling.
- Independent vectors in the test suite: 34
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

### Sensor Range Converter (Process Value to 4-20 mA, 0-10 V Signal) (`sensor-range-converter`)

- Formula: `Span fraction f = (PV − lo) / (hi − lo) Signal = s0 + f × (s1 − s0) PV = lo + (Signal − s0) / (s1 − s0) × (hi − lo) 4-20 mA equivalent = 4 + 16 f`
- Inputs: Sensor range low value (0% of span); Sensor range high value (100% of span); Signal type; What to find; Process value (used for the first choice); Signal level (used for the second choice)
- Outputs: Percentage of span; Process value; Signal level (mA or V, as chosen); Equivalent 4-20 mA loop current (mA); Process units per mA or volt of signal
- Assumptions: Linear transmitter between its range low and range high values; Signal limits s0 and s1: 4 and 20 mA, 0 and 20 mA, 0 and 10 V, 1 and 5 V, 0 and 5 V, or 2 and 10 V; No square-root, logarithmic or other non-linear characteristic, and no sensor error, loop resistance or burden effect
- Notes: Check the transmitter data sheet for its over-range behaviour. Many 4-20 mA transmitters saturate near 3.8 mA and 20.5 mA (NAMUR NE43), and a current outside that band is normally treated as a fault.
- Independent vectors in the test suite: 41
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### RTD Resistance to Temperature (`rtd-pt100`)

- Formula: `R = R0 (1 + A T + B T²) T = (−A + √(A² − 4B (1 − R/R0))) / 2B A = 3.9083×10⁻³, B = −5.775×10⁻⁷`
- Inputs: Measured resistance [Ω]; Resistance at 0 °C [Ω]
- Outputs: Temperature (°C); Sensitivity at this point (Ω/°C)
- Assumptions: Standard platinum RTD, 0 to 850 °C range; Lead wire resistance already subtracted or a 3 or 4-wire connection
- Notes: Two-wire connections add lead resistance, which reads as a temperature error of about 2.6 °C per ohm for a Pt100. Below 0 °C a third term is needed and this calculator does not cover it.
- Independent vectors in the test suite: 6
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### ADC Resolution and Sampling Calculator (LSB, Counts, SNR, ENOB, Nyquist and Aliasing) (`adc-sampling`)

- Formula: `LSB = FSR / 2^N counts = floor((V − V0) / LSB) quantisation error ≤ ½ LSB\nIdeal SNR = 6.02 × N + 1.76 dB (full-scale sine) ENOB = (SINAD − 1.76) / 6.02\nNyquist: fs > 2 × fmax oversampling ratio = fs / (2 × fmax), extra bits ≈ ½ × log2(OSR)\nAlias of a tone f above fs / 2: |f − k × fs| with k the whole number nearest f / fs`
- Inputs: Number of bits N; Full-scale input range [V]; Voltage at code 0 (bottom of the range) [V]; Input voltage to convert [V]; Sensor signal at 0% of its span [V]; Sensor signal at 100% of its span [V]; Sensor span in its own units; Highest frequency in the signal [Hz]; Sampling rate [Hz]; Measured SINAD (signal to noise and distortion), dB
- Outputs: Step size (1 LSB) [mV]; Number of levels (2^N); Highest code (2^N − 1); Ideal count for the input voltage; Maximum quantisation error (±½ LSB) [mV]; Maximum quantisation error (% of full-scale range); Ideal signal to noise ratio (full-scale sine); Effective number of bits (ENOB) from SINAD; Bits lost to noise and distortion (N − ENOB); Counts available across the sensor span; Part of the input range the sensor span uses (%); Resolution of the sensor span in bits (log2 of the counts); One count as a percentage of the sensor span; Sensor units per count; Largest gain that still keeps the span inside the range; Nyquist frequency (fs / 2) [kHz]; Oversampling ratio (fs / 2 fmax); Extra resolution from oversampling and averaging (bits); Alias frequency (where an under-sampled tone appears) [Hz]
- Assumptions: An ideal converter with a straight transfer line from code 0 to code 2^N − 1 over the full-scale range; no offset, gain, linearity or noise error except where SINAD is entered; The ideal SNR uses a full-scale sine wave and quantisation noise of LSB² / 12; the constants are 6.0206 and 1.7609, shown as 6.02 and 1.76; The oversampling gain assumes the noise is white and the converter noise is quantisation-limited; it is not available if the converter noise or a reference is the limit; The alias is for a single tone with no anti-alias filter; a real filter attenuates it but does not remove it
- Notes: Use this to see how many counts a sensor really gets, whether the converter is enough, and whether the sampling rate is safe. Fewer counts than you expected usually means the span uses only part of the range: scale the signal to fill it. The ENOB, not the bit count, tells what the converter can do, so check the SINAD at your signal frequency on the data sheet. Sampling just above twice the highest frequency leaves nothing for filter roll-off, so practical systems sample at 5 to 10 times the highest frequency, or filter before the converter.
- Independent vectors in the test suite: 45
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Calibration Error Calculator (As-Found and As-Left Error, Zero and Span Shift, Test Uncertainty Ratio) (`calibration-error`)

- Formula: `Reference at point k: Rk = lo + pk/100 × (hi − lo) Error (units) = reading − Rk Error (% of span) = (reading − Rk) / (hi − lo) × 100 Out of tolerance when |error % of span| > tolerance As-found line: error = z + (sp/100) × p, least squares over the points (p in % of span) zero error z, span error sp left-over = largest |error − line| TUR = tolerance / reference accuracy`
- Inputs: Instrument range low value (0% of span); Instrument range high value (100% of span); Calibration tolerance (± % of span); Reference standard accuracy (± % of span, 0 to skip); Number of test points; Point 1: applied value (% of span); Point 1: as-found reading; Point 1: as-left reading; Point 2: applied value (% of span); Point 2: as-found reading; Point 2: as-left reading; Point 3: applied value (% of span); Point 3: as-found reading; Point 3: as-left reading; Point 4: applied value (% of span); Point 4: as-found reading; Point 4: as-left reading; Point 5: applied value (% of span); Point 5: as-found reading; Point 5: as-left reading
- Outputs: Point 1 as-found error (% of span); Point 2 as-found error (% of span); Point 3 as-found error (% of span); Point 4 as-found error (% of span); Point 5 as-found error (% of span); Point 1 as-left error (% of span); Point 2 as-left error (% of span); Point 3 as-left error (% of span); Point 4 as-left error (% of span); Point 5 as-left error (% of span); Largest as-found error (% of span, magnitude); Largest as-found error (in the range unit, magnitude); Point with the largest as-found error; Largest as-left error (% of span, magnitude); As-found points outside tolerance; As-left points outside tolerance; Zero error from the as-found line (% of span at 0%); Span error from the as-found line (change in error from 0% to 100%, % of span); Error left after a zero and span adjustment (largest distance from the line, % of span); Test uncertainty ratio (tolerance : reference accuracy)
- Assumptions: Errors are stated as a percentage of span (full scale range), the usual basis for a transmitter or gauge; a tolerance given as a percentage of reading is not checked; A point is out of tolerance only when its error is larger than the tolerance; an error equal to the tolerance passes; The reading and the reference are in the same unit, the reference value is exact, and the reference accuracy is used only for the ratio; it is not subtracted from the errors or used as a guard band; The zero and span error come from a least-squares straight line through the as-found errors and the applied points, so they describe the error that adjusting zero and span could remove; they need at least two different applied points; One reading per point: no separate upward and downward runs, so hysteresis and repeatability are not separated, and no temperature, mounting or static-pressure effect is included; The 4 to 1 test uncertainty ratio is a common practice guideline, not a requirement of this calculator's method; your procedure or quality system may set another ratio
- Notes: Use this to judge a calibration result and decide what to do next. Out of tolerance as-found means the instrument had drifted before it was adjusted, so look at what it measured since the last calibration; out of tolerance as-left means the adjustment did not work. When the left-over error is large, zero and span adjustment cannot fix the instrument: the characteristic is non-linear or the sensor is damaged. Use the Sensor Range Converter to turn a 4-20 mA reading into the range unit. This is a worksheet check; the calibration record, traceability of the reference and the as-left acceptance rule come from your procedure.
- Independent vectors in the test suite: 39
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

## Division 32 Testing and Measurement

### Power Measurement from Meter Readings (Voltmeter, Ammeter, Wattmeter and Energy Meter) (`power-measurement`)

- Formula: `Primary: V = V(meter) × VT ratio I = I(meter) × CT ratio P = W × VT ratio × CT ratio (× 3 if the wattmeter reads one phase) S = √3 V I (three-phase) or V I (single-phase) pf = P / S Q = √(S² − P²) angle = acos(pf) Energy meter: E = (E2 − E1) × multiplying factor Pavg = E / time difference = (Pavg − P) / P`
- Inputs: Phase; Voltmeter reading (line-to-line for three-phase) [V]; Ammeter reading (line current) [A]; Wattmeter reading [kW]; What the wattmeter reads; Voltage transformer ratio (1 if connected directly); Current transformer ratio (1 if connected directly); Energy meter reading at the start (set both readings equal to skip the check) [kWh]; Energy meter reading at the end [kWh]; Time between the two energy readings [min]; Energy meter multiplying factor
- Outputs: Primary voltage [V]; Primary current [A]; Apparent power [kVA]; Real power [kW]; Power factor; Reactive power [kVAR]; Phase angle (degrees); Energy used in the interval [kWh]; Average power from the energy meter [kW]; Energy meter average compared with the wattmeter (%)
- Assumptions: A balanced three-phase load with equal currents and voltages when the wattmeter reads one phase; Sinusoidal voltage and current: with distortion the V × I product includes harmonic volt-amperes and the power factor shown is the total power factor, not the displacement power factor; The instrument readings are taken together while the load is steady, and the instrument errors are not included; The wattmeter reading is the real power of the load as connected; the burden of the instruments and the instrument transformer ratio and phase errors are not corrected; The reactive power is the magnitude only; the reading does not show whether the load is lagging or leading; The energy meter register does not roll over between the two readings
- Notes: Read all three instruments at the same moment. If the energy meter average differs from the wattmeter by more than a few per cent, check the multiplying factor, the ratios and whether the load changed during the interval before suspecting the meter.
- Independent vectors in the test suite: 35
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Voltage Transformer (PT) Ratio Calculator (`pt-ratio`)

- Formula: `Ratio: K = Vpn / Vsn Secondary = Primary / K Primary = Secondary × K Ratio test: actual ratio Ka = Vtp / Vts ratio error = (K Vts − Vtp) / Vtp × 100% Burden: loading = Sc / Sn × 100% secondary current = Sc / Vsn`
- Inputs: Rated primary voltage (as on the nameplate) [V]; Rated secondary voltage (as on the nameplate) [V]; What to find; Voltage to convert (primary for the first choice, secondary reading for the second) [V]; Ratio test: primary voltage applied (0 to skip the ratio error) [V]; Ratio test: secondary voltage measured (0 to skip the ratio error) [V]; Rated burden (0 to skip the burden check) [VA]; Connected burden [VA]
- Outputs: Rated ratio (primary ÷ secondary); Primary voltage [V]; Secondary voltage [V]; Primary voltage as a percentage of the rated primary; Actual ratio from the test; Ratio error (%); Connected burden as a percentage of the rated burden; Secondary current drawn by the connected burden [A]
- Assumptions: The ratio is the rated primary divided by the rated secondary voltage; a three-phase value is converted with the same ratio when the PT is connected line to line, and a star-connected PT rated on phase voltages has the same ratio; The ratio error follows the usual definition: a positive value means the secondary voltage is higher than the rated ratio predicts; The secondary current is the connected burden divided by the rated secondary voltage, for one winding with a unity-power-factor approximation; the burden power factor is not used; The accuracy class limits, the phase displacement and the voltage factor of the PT are not applied; The primary and secondary voltages are single-winding values; a residual (open-delta) winding is not covered
- Notes: Use the actual ratio from a test only to understand a particular PT; protection and metering settings are normally set from the rated ratio. Keep the connected burden between 25% and 100% of the rated burden for the accuracy class to hold.
- Independent vectors in the test suite: 29
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

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

### Two-Wattmeter Method Calculator (Total Power, Reactive Power and Power Factor of a Three-Phase Load from Two Readings) (`two-wattmeter`)

- Formula: `P = W1 + W2 Q = √3 (W1 − W2) tan φ = √3 (W1 − W2) / (W1 + W2) pf = cos φ S = √(P² + Q²) I = S / (√3 V) Readings from a load: W = (S / √3) cos(30° ∓ φ)`
- Inputs: Find; Wattmeter 1 reading [kW]; Wattmeter 2 reading [kW]; Total real power of the load [kW]; Power factor of the load; Load type; Line voltage (L-L) [V]
- Outputs: Total real power [kW]; Reactive power (positive lagging, negative leading) [kVAR]; Apparent power [kVA]; Power angle (°); Power factor; Larger reading [kW]; Smaller reading (negative below pf 0.5) [kW]; Smaller reading / larger reading; Line current at the line voltage [A]
- Assumptions: A balanced three-wire three-phase load, with a wattmeter current coil in two lines and both voltage coils to the third line; balanced voltages and currents of one sequence; The total P = W1 + W2 holds for an unbalanced load on three wires, but Q, the angle and the power factor from the readings assume balance; The readings are taken as true real-power readings of ideal sinusoidal quantities; wattmeter errors, instrument transformer ratios and harmonics are not included; Which wattmeter reads the larger value depends on the phase sequence and the lines used, so the calculator gives the larger and the smaller reading. For the usual sequence and connection, the lagging load makes the meter in the last line read the larger value; A four-wire load, or any load with a neutral current, needs three wattmeters and is outside this method
- Notes: Use this to turn two wattmeter readings into power factor and kVAR, or to see what two readings to expect from a known load. Keep the sign of each reading: below a power factor of 0.5 one reading is negative, so adding the magnitudes would give the wrong total. At a power factor of 0.5 the smaller reading is zero. The reactive power sign comes from the load type you select, because the two readings alone do not say whether the load is lagging or leading. The calculator does not correct for instrument transformer ratios or meter error; the Power Measurement Calculator handles the ratios.
- Independent vectors in the test suite: 44
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Measurement Uncertainty Calculator (Uncertainty Budget, Combined and Expanded Uncertainty) (`measurement-uncertainty`)

- Formula: `Standard uncertainty u: rectangular a / √3 triangular a / √6 arcsine a / √2 resolution d / (2√3) expanded U / 2 Type A: uA = s / √n Contribution qi = |ci| ui Combined uc = √(uA² + q1² + q2² + q3² + q4²) Share of source i = qi² / uc² Effective degrees of freedom (Welch–Satterthwaite): νeff = uc⁴ / (uA⁴ / (n − 1)), the other sources taken as infinite Expanded U = k uc TUR = T / U`
- Inputs: Measured value (the result, in the unit of the measurement); Standard deviation of the repeated readings, s (0 to skip); Number of readings averaged, n; Source 1: kind of figure; Source 1: value; Source 1: sensitivity coefficient, c; Source 2: kind of figure; Source 2: value; Source 2: sensitivity coefficient, c; Source 3: kind of figure; Source 3: value; Source 3: sensitivity coefficient, c; Source 4: kind of figure; Source 4: value; Source 4: sensitivity coefficient, c; Coverage; Tolerance on the measured quantity, ±T (0 to skip)
- Outputs: Repeatability, standard uncertainty of the mean s / √n; Source 1: contribution |c| u; Source 2: contribution |c| u; Source 3: contribution |c| u; Source 4: contribution |c| u; Repeatability share of the variance (%); Source 1 share of the variance (%); Source 2 share of the variance (%); Source 3 share of the variance (%); Source 4 share of the variance (%); Combined standard uncertainty, uc; Largest contributor (0 = repeatability, 1 to 4 = source); Effective degrees of freedom (blank = infinite); Coverage factor, k; Expanded uncertainty, U = k uc (±); Expanded uncertainty as a percentage of the reading; Result interval, lower end (x - U); Result interval, upper end (x + U); Test uncertainty ratio, T / U
- Assumptions: One measurand and a result that is a single reading or the mean of n readings; every source is independent of the others (no correlation terms) and acts on the result through its sensitivity coefficient, with all figures in the unit of the result after the coefficient is applied; The distribution of each Type B source is the one you pick: a data-sheet limit is rectangular unless you know better, a limit that the error sits near the ends of is U-shaped, and a limit that the error clusters in the middle of is triangular; a calibration certificate figure is taken as the expanded uncertainty at k = 2 (use a standard uncertainty entry for any other k); The Type A source has n − 1 degrees of freedom and every Type B source is taken as infinite (a Type B figure is treated as exactly known); with no Type A source the effective degrees of freedom are infinite and k is the normal value, 1.960 for 95% and 2.576 for 99%; The effective degrees of freedom are truncated to a whole number before the t factor is found, as the GUM advises, and a value of one million or more is treated as infinite; The result is the interval x ± U for the stated coverage; it assumes the result is a linear combination of the sources and the combined distribution is close to normal or to Student t, and the correction for any known systematic error is already applied to x; The test uncertainty ratio is the plain ratio T / U of the tolerance to the expanded uncertainty; no guard band or decision rule on pass or fail is applied
- Notes: An uncertainty budget lists everything that could make the result differ from the true value, puts each on the same footing as a standard uncertainty and combines them. Because independent errors seldom all reach their limits together, they are added as squares, so one large source usually dominates: the share column shows which one, and improving a small source will do little. The expanded uncertainty U is the range around the result that is expected to hold the true value with the chosen coverage; quote it with its coverage factor. With few repeated readings the scatter is itself uncertain, which is what the effective degrees of freedom and the Student t factor allow for. The test uncertainty ratio compares that range with the tolerance being checked; 4 to 1 is a common guideline and below 1 means the measurement cannot show whether the quantity is inside the tolerance. This is a worksheet for the standard method, not a calibration laboratory budget: it has no correlation terms, no unknown distributions beyond the six listed and no certificate-specific coverage factors. The correction for known systematic errors, the traceability of the reference and the decision rule come from your procedure.
- Independent vectors in the test suite: 42
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
- Assumptions: Resistive series circuit, power factor near unity; Cable resistance given for the full loop length; Standard CCR sizes (FAA AC 150/5345-10H, clause 1.2.4): 1, 2, 4, 7.5, 10, 15, 20, 25, 30 kW. 50 and 70 kW are replacement equipment only and are not offered for new designs. FAA AC 150/5345-10H clause 1.2.2 defines Class 1 (6.6 A) and Class 2 (20.0 A) output current; Style 1 gives three brightness steps and Style 2 gives five. Some manufacturers may offer additional ratings, such as 5 kW, subject to equipment specifications and project requirements; confirm against the current edition of AC 150/5345-10 and the manufacturer range before use
- Notes: Confirm against the CCR manufacturer's output curves, the isolating transformer open-circuit behaviour and the project specification. Lamp failures shift the load, so check at the highest brightness step.
- Independent vectors in the test suite: 43
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

- Formula: `I = step current Plamp = n × Pfull × (I / Ifull)^k / ηT Pcable = I² × R × L Pt = Plamp + Pcable Vout = Pt / I (Ifull = 6.6 A, or 20.0 A on the 20 A circuit type)`
- Inputs: Circuit type; Brightness step; Fittings on the circuit; Lamp power per fitting at full circuit current [W]; Isolating transformer efficiency; Series cable loop length [m]; Series cable resistance [Ω/km]; Lamp power exponent
- Outputs: Circuit current at this step [A]; Current as % of full current; Total circuit load at this step [kW]; CCR output voltage at this step [V]; Cable loss at this step [W]; Load as % of the full-current load
- Assumptions: Step currents are the usual values: 2.8, 3.4, 4.1, 5.2, 6.6 A (5-step, 6.6 A), 4.8, 5.5, 6.6 A (3-step, 6.6 A) and 8.5, 10.3, 12.4, 15.8, 20.0 A (5-step, 20 A, FAA AC 150/5345-10H Class 2); Lamp power scales as a power of the current, with the exponent you enter; Transformer efficiency is constant at every step; Resistive series circuit, power factor near unity
- Notes: The highest step normally sets the CCR size, so use the CCR sizing calculator at the full circuit current (6.6 A, or 20 A for a Class 2 regulator) for that. Use this one to see the output voltage and load at the lower steps and to check them against the CCR curves. Confirm the step currents against your project specification.
- Independent vectors in the test suite: 44
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

### AGL Photometry Data Tool (Mean, Spread and Point Limits of Measured Light Intensity, Required Level and Light Output Against a New Light) (`agl-photometry-data`)

- Formula: `Lux to candela: I = E × d² (E in lux at distance d in metres)\nIavg = (I1 + I2 + … + In) / n Imin, Imax, standard deviation σ = √( Σ (Ii − Iavg)² / n ) coefficient of variation = σ / Iavg × 100\nLowest allowed point = Fp / 100 × Iavg points below it are counted\nShortfall = max(0, Ireq − Iavg) average with uncertainty = Iavg × (1 − u / 100)\nLight output remaining = Iavg / Inew × 100`
- Inputs: What the readings are; Measuring distance (lux readings) [m]; Number of readings used; Reading 1; Reading 2; Reading 3; Reading 4; Reading 5; Reading 6; Reading 7; Reading 8; Reading 9; Reading 10; Reading 11; Reading 12; Required minimum average intensity (cd); Lowest allowed point, as % of the average; Average intensity of a new light (cd); Lowest allowed light output, as % of a new light; Measuring uncertainty of the photometer (%)
- Outputs: Average intensity (cd); Lowest intensity (cd); Highest intensity (cd); Number of the lowest point; Number of the highest point; Lowest as a share of the average (Imin / Iavg); Highest as a share of the average (Imax / Iavg); Standard deviation of the points (cd); Coefficient of variation (%); Lowest allowed point (cd); Points below the lowest allowed point; Average meets the requirement (1 = yes, 0 = no); Every point meets the point limit (1 = yes, 0 = no); Average is short of the requirement by (cd, 0 if met); Average with the uncertainty taken off (cd); Requirement still met with the uncertainty (1 = yes, 0 = no); Light output compared with a new light (%); Light output meets the in-service limit (1 = yes, 0 = no)
- Assumptions: The readings are taken at the points your method prescribes within the main beam, each point counted once; the average is the simple mean of those points, not weighted by the solid angle each stands for; Lux readings are converted with the inverse-square law, I = E × d², which holds only when the distance is at least five times the largest size of the light and the photometer faces the light squarely; the calculator cannot check either; The standard deviation is over the n points entered (divisor n), not an estimate for a larger population; The required average, the point limit, the average of a new light and the in-service limit are your own figures; none is looked up or taken from a standard, and each requirement is a plain comparison with them; The uncertainty is applied as a single worst-case percentage taken off the average; it is not an uncertainty budget and it does not change the lowest or highest point
- Notes: Use this to turn a photometric measurement of an airfield light into a pass or fail against your own figures: enter the readings, the average you require, the lowest share of the average any point may have, the average of a new light and the lowest light output you accept in service. The uncertainty line shows when a light that passes on the readings would not pass in the worst case, and the light output line shows how far an in-service light has fallen from new. The calculator does not decide where the points go or what the numbers should be: the point pattern, the required intensities and the in-service limits come from the specification for the light type, such as the ICAO Annex 14 light characteristics, the aerodrome design manual for visual aids and the manufacturer data, and must be checked in the current edition. For the intensity seen at the pilot's eye through fog use the Allard's law calculator; for the lux a luminaire gives on a surface use the point-by-point calculator.
- Independent vectors in the test suite: 39
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Signage Load Calculator (Airfield Guidance Signs on a Series Circuit: Sign and Transformer Load, Cable Loss, CCR Size and Spare Capacity) (`signage-load`)

- Formula: `Group load = n × Plamp / ηT Pin = sum of the group loads Pcable = I² × R × L Ptotal = Pin + Pother + Pcable Vout = Ptotal / I Transformer loading = Plamp / Trating Pdesign = Pin × (1 + spare) + Pother + Pcable CCR ≥ Pdesign / maximum loading Room = loading × CCR − Ptotal More signs = ⌊room / (Pin / signs)⌋`
- Inputs: Group 1: number of signs; Group 1: lamp load per sign [W]; Group 1: isolating transformer rating per sign [W]; Group 2: number of signs; Group 2: lamp load per sign [W]; Group 2: isolating transformer rating per sign [W]; Group 3: number of signs; Group 3: lamp load per sign [W]; Group 3: isolating transformer rating per sign [W]; Group 4: number of signs; Group 4: lamp load per sign [W]; Group 4: isolating transformer rating per sign [W]; Isolating transformer efficiency; Circuit current [A]; Series cable loop length [m]; Series cable resistance [Ω/km]; Other load on the same circuit [W]; Spare capacity for future signs (% of the sign load); Maximum CCR loading
- Outputs: Signs on the circuit; Lamp load of all the signs [kW]; Load of all the signs at the transformer inputs [kW]; Group 1 load at the transformer inputs [kW]; Group 2 load at the transformer inputs [kW]; Group 3 load at the transformer inputs [kW]; Group 4 load at the transformer inputs [kW]; Cable loss [W]; Total circuit load now [kW]; CCR output voltage now [V]; Highest lamp load as a share of its transformer rating (%); Group with the highest transformer loading; Design load with the spare capacity [kW]; Smallest standard CCR [kW]; Loading of that CCR now (%); Loading of that CCR at the design load (%); Room left at the maximum loading [kW]; More signs of the average size that fit
- Assumptions: Resistive series circuit at the stated current, power factor near unity; every lamp load is the figure at that current; One transformer efficiency for every sign; each sign has its own isolating transformer and the lamp load is the only load on it; Cable resistance applies to the whole loop length; the spare capacity grows the sign load only, not the cable loss; The transformer rating is a nameplate figure compared with the lamp load; no thermal, open-circuit or lamp-failure behaviour is modelled; Standard CCR sizes (FAA AC 150/5345-10H, clause 1.2.4): 1, 2, 4, 7.5, 10, 15, 20, 25, 30 kW. Confirm against the current edition and the manufacturer range before use; Sign lamp loads, transformer ratings and efficiency are your data; no sign size, class or standard is looked up
- Notes: Use this to see what a taxiway or runway sign circuit puts on its CCR and whether the isolating transformers are sized sensibly for their signs. The lamp loads must be the data-sheet figures at the circuit current you enter, so check the highest brightness step. The spare capacity is a design allowance you choose, not a requirement, and the sign count that still fits is for signs of the average size on the circuit. Confirm against the CCR manufacturer's output curves, the isolating transformer data sheet and the project specification; a lamp failure or a transformer open circuit changes the real load. This calculator does not apply any standard to the sign sizes, the transformer sizing or the circuit layout.
- Independent vectors in the test suite: 39
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

### Derivative and Integral Calculator (Polynomial, Sine, Exponential and Power Functions) (`derivative-integral`)

- Formula: `Cubic: f′ = 3a x² + 2b x + c f″ = 6a x + 2b F = a x⁴/4 + b x³/3 + c x²/2 + d x Sine: f′ = a b cos(b x + c) f″ = −a b² sin(b x + c) F = −(a/b) cos(b x + c) + d x Exponential: f′ = a b e^(b x) f″ = a b² e^(b x) F = (a/b) e^(b x) + d x Power: f′ = a b x^(b−1) f″ = a b (b−1) x^(b−2) F = a x^(b+1)/(b+1) + d x (a ln x + d x when b = −1) Integral = F(hi) − F(lo) Mean = Integral / (hi − lo)`
- Inputs: Function; Coefficient a (x³ term, amplitude or multiplier); Coefficient b (x² term, angular rate, rate or exponent); Coefficient c (x term or phase in radians); Constant d (offset); Point x at which to find the value and derivatives; Integral lower limit; Integral upper limit
- Outputs: f(x) at the point; First derivative f′(x) at the point; Second derivative f″(x) at the point; Definite integral between the limits; Mean value of f over the interval; Integral by Simpson's rule (check)
- Assumptions: The function is one of the four forms shown, with real coefficients; sums or products of different forms are not handled; The sine takes its angle in radians; The power function is defined for x above 0 only, so the point and both limits must be above 0; this keeps non-integer and negative exponents real and avoids the singularity at 0; The integral is the signed area between the curve and the x axis: parts below the axis count as negative; The mean value is the integral divided by the interval length; it is not the RMS value, which needs the integral of the square
- Notes: Use the Simpson figure as a quick check that the exact integral and the limits were entered as intended. For the RMS of a waveform, use the RMS and peak calculator.
- Independent vectors in the test suite: 45
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### First-Order Differential Equation Solver (a dy/dt + b y = Step, Ramp or Sine Forcing, Transient and Steady State) (`first-order-ode`)

- Formula: `Equation: a dy/dt + b y = g(t) y(0) = y₀ τ = a / b Solution y = y_p(t) + C e^(−t/τ) C = y₀ − y_p(0)\nStep g = F: y_p = F / b Ramp g = F t: y_p = (F / b)(t − τ) Sine g = F sin ωt: y_p = (F / b)(sin ωt − ωτ cos ωt) / (1 + ω²τ²)\nSlope: dy/dt = (g(t) − b y) / a Sine steady state: amplitude (F / b) / √(1 + ω²τ²), lag arctan(ωτ)\nSettling into a band of p% of the transient: t = τ ln(100 / p) Check: classical fourth-order Runge-Kutta on y′ = (g − b y) / a`
- Inputs: Forcing g(t) on the right-hand side; Coefficient a of dy/dt; Coefficient b of y; Size F of the forcing; Angular frequency ω of the sine (rad per unit of time); Starting value y(0); Time t at which to read the solution; Settling band for the transient (% of its starting size)
- Outputs: Time constant τ = a / b; Forced (particular) part at time t; Transient (decaying) part at time t; Solution y(t); Slope dy/dt at time t; Forcing g(t) at time t; Transient size at t = 0, y(0) minus the forced part at 0; Final value F / b (step only); Steady-state amplitude (sine only); Phase lag of the output behind the sine (degrees, sine only); Time for the transient to settle into the band; Check: y(t) by 4000 Runge-Kutta steps; Check: difference between the Runge-Kutta value and the closed form
- Assumptions: A first-order linear equation with constant coefficients a and b, both above zero, and one forcing of the three forms shown. Sums of forcings, a switched forcing, a variable coefficient or a nonlinear term are not handled; The unit of time is whatever you use for a / b and t; the values y, F and y(0) share one unit set by the physical quantity. The solver does not convert units; The ramp never settles: its forced part keeps growing with t, so the settling time refers to the transient only. The output follows the input ramp with a lag in time equal to τ; The sine response is the full solution from t = 0, transient and steady state together; the steady-state amplitude and phase lag describe it after the transient has died away; The Runge-Kutta check uses 4000 equal steps from 0 to t. It is a numerical cross-check of the closed form, not a second method for stiff or very long runs, and a long time with a fast sine can make it differ without the closed form being wrong
- Notes: Use this to see the transient and the steady-state part of a first-order circuit written as a differential equation, for example an RC circuit as R C dv/dt + v = V or an RL circuit as L di/dt + R i = V. After about four time constants the transient has fallen below 2%; a sine drive then leaves only the steady-state part, scaled by 1 / √(1 + ω²τ²) and delayed by arctan(ωτ). The same equation covers a heated body (thermal mass and conductance) and a tank filling through a restriction.
- Independent vectors in the test suite: 66
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

### Laplace Transform Reference Tool (Standard Pairs, F(s) at a Complex s, Time Delay, Initial and Final Value) (`laplace-transform`)

- Formula: `F(s) = ∫ f(t) e^(−st) dt from 0 to ∞, s = σ + jΩ Delay: K f(t − T) u(t − T) ↔ K e^(−sT) F(s) Linearity: K f(t) ↔ K F(s) Step 1/s Ramp 1/s² tⁿ n!/s^(n+1) e^(−at) 1/(s + a) t e^(−at) 1/(s + a)² tⁿ e^(−at) n!/(s + a)^(n+1) sin ωt ω/(s² + ω²) cos ωt s/(s² + ω²) e^(−at) sin ωt ω/((s + a)² + ω²) e^(−at) cos ωt (s + a)/((s + a)² + ω²) Initial value f(0+) = lim sF(s) as s → ∞ Final value f(∞) = lim sF(s) as s → 0, only if every pole of sF(s) is in the left half-plane`
- Inputs: Time function f(t) for t ≥ 0; Amplitude K multiplying the function; Decay rate a (1/s); Angular frequency ω (rad/s); Power n (whole number, 1 to 8); Time delay T (s); Real part σ of s (1/s); Imaginary part Ω of s (rad/s); Time t at which to read f(t) (s)
- Outputs: F(s), real part; F(s), imaginary part (coefficient of j); F(s), magnitude |F|; F(s), phase angle (degrees); Abscissa of convergence (F(s) exists for σ above this); Time function f(t) at the chosen time; Initial value f(0+); Final value f(∞) (only where it exists); Check: difference between the numerical integral and F(s)
- Assumptions: A table lookup for ten one-sided transform pairs with real constants, an amplitude K and one optional time delay. Sums, products of different forms, transforms of derivatives or integrals and the inverse transform of a general ratio of polynomials are not handled; The transform is the one-sided Laplace transform: the function is zero before t = 0 (or before the delay T). The value at a single instant has no effect on F(s); F(s) is evaluated at one point s = σ + jΩ with σ above the abscissa of convergence. It is not a frequency response unless the poles are in the left half-plane and σ is allowed to go to 0, which this tool does not do; The final value is given only for the step (K) and for the forms with e^(−at) (0). The ramp, tⁿ, sine and cosine have no final value, because their poles are at the origin or on the imaginary axis, so the final value theorem cannot be used; The numerical check is Simpson integration of K f(t − T) e^(−st) from T over a length of 60 / (σ − abscissa), at least 120 points per cycle of the fastest oscillation, so it is a cross-check of the table, not a second method for a point close to the abscissa of convergence
- Notes: Use this to check a table entry or a hand calculation when you move between the time domain and the s-domain, for example to turn a step response e^(−at) sin ωt of a second-order circuit into its transform, to see how a delay multiplies the transform by e^(−sT), or to see why the final value theorem fails for a sine. Poles of F(s) give the form of the time response: a pole at −a is a decay e^(−at), a pair at −a ± jω a damped oscillation, and a repeated pole adds a power of t.
- Independent vectors in the test suite: 66
- [ ] Formula checked   [ ] Assumptions checked   [ ] Worked example checked   [ ] Approved

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

### Determinant and Inverse Calculator (2×2 and 3×3) (`matrix-calculator`)

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

