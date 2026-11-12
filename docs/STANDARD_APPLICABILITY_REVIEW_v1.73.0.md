# Standard applicability review (Elecmetric v1.73.0)

**Review date:** 12 November 2026  
**Review type:** Public-scope and edition screening, not licensed-text clause verification  
**Coverage:** 157 / 157 calculators classified

## Result

- **50 calculators:** applicable standards identified and scope-screened from official or publisher catalogue/publication information.
- **107 calculators:** Not applicable because the implemented method is a generic identity, conversion, estimate or user-defined input method for which no single electrical standard governs the calculation.
- **0 calculators:** clause-by-clause reviews against licensed standard text recorded.
- **0 calculators:** independent technical reviewer approvals recorded.

> Important: “Scope screened” means the governing document and its published scope/edition metadata were identified. It does not mean the calculator formula has been verified against clauses, annexes or tables in the paid/licensed text. The app therefore shows this state as **Scope screened**, not **Done**. Project adoption, clause numbers, tables, national deviations and assumptions remain to be checked by a qualified reviewer.

## Applicable standards identified

| Calculator ID | Standard and edition | Scope-screening limitation |
|---|---|---|
| `ac-voltage-drop` | IEC 60364-5-52; IEC 60228, IEC 60364-5-52:2009 + A1:2024 Ed 3.1; IEC 60228:2023 Ed 4.0 | AC wiring-system voltage-drop and conductor resistance context are relevant. The calculator uses a simplified R/X equation; verify the conductor operating temperature, reactance, circuit layout and permitted drop. |
| `agl-brightness-steps` | IEC 61820-1-2; IEC 61820-3-2; FAA AC 150/5345-10H, IEC 61820-1-2:2024; IEC 61820-3-2:2023; FAA AC 150/5345-10H | AGL series circuit and CCR requirements are relevant. The lamp power/current relationship is entered as an exponent-based model; actual brightness-step currents, lamp data and CCR output data must come from approved equipment documentation. |
| `agl-cable-loop-loss` | IEC 61820-1-2; IEC 60228, IEC 61820-1-2:2024; IEC 60228:2023 Ed 4.0 | AGL series-circuit cable context and conductor resistance/size requirements are relevant. The calculator estimates loop resistance and I²R loss; confirm cable construction, circuit topology, operating temperature and actual manufacturer resistance. |
| `agl-cable-size-loss` | IEC 61820-1-2; IEC 60228, IEC 61820-1-2:2024; IEC 60228:2023 Ed 4.0 | AGL series-circuit cable context and conductor dimensions/resistance are relevant. The calculator solves a user-defined loss limit; the selected limit is not a standard-prescribed value and final selection needs full circuit checks. |
| `agl-ccr-input-energy` | IEC 61820-3-2; FAA AC 150/5345-10H, IEC 61820-3-2:2023; FAA AC 150/5345-10H | AGL series-circuit power-supply and CCR specification context is relevant. The calculator estimates input power, energy and cost from user-entered efficiency and power factor; it does not model CCR loss curves or metering accuracy. |
| `agl-ccr-loading` | IEC 61820-1; IEC 61820-1-2; IEC 61820-3-2; FAA AC 150/5345-10H, IEC 61820-1:2019; IEC 61820-1-2:2024; IEC 61820-3-2:2023; FAA AC 150/5345-10H | AGL fundamental principles, series-circuit requirements and CCR/power-supply requirements are relevant. The calculator estimates circuit load and CCR size; fitting-specific data, cable resistance, regulator limits and project requirements must be verified. |
| `agl-isolating-transformer` | IEC 61820-1-2; FAA AC 150/5345-47B, IEC 61820-1-2:2024; FAA AC 150/5345-47B (30 June 2005) | AGL series-circuit requirements and the FAA series-to-series isolation-transformer specification are relevant. Verify transformer type, VA rating, leakage, insulation, secondary loading and current FAA qualification status against the actual procurement specification. |
| `agl-lamp-failure-load` | IEC 61820-1-2; FAA AC 150/5345-47B, IEC 61820-1-2:2024; FAA AC 150/5345-47B (30 June 2005) | AGL series-circuit and isolation-transformer context is relevant. Open-secondary voltage/power behaviour is manufacturer-specific; the calculator requires user-entered failed-lamp/open-secondary assumptions and is indicative. |
| `agl-max-fittings` | IEC 61820-1; IEC 61820-1-2; IEC 61820-3-2; FAA AC 150/5345-10H, IEC 61820-1:2019; IEC 61820-1-2:2024; IEC 61820-3-2:2023; FAA AC 150/5345-10H | AGL series-circuit and CCR requirements are relevant. The calculator estimates a maximum fitting count from user-entered lamp, transformer and cable data; it does not replace CCR load curves or manufacturer limits. |
| `battery-bank-size` | IEEE 485; IEC 62485-2, IEEE 485-2020 (active); IEC 62485-2:2010 | Stationary lead-acid battery sizing and stationary battery safety are relevant. IEEE 485 applies to lead-acid float-service applications; the calculator is a simplified energy estimate and does not implement duty-cycle sizing. |
| `breaker-size` | IEC 60364-4-43; IEC 60947-2, IEC 60364-4-43:2023 Ed 4.0; IEC 60947-2:2024 Ed 6.0 | Overcurrent protection and LV circuit-breaker product requirements are relevant. The calculator only rounds a user-margined current to a nominal rating; it does not check breaking capacity, trip curves, selectivity or local adoption. |
| `cable-derating` | IEC 60364-5-52, 2009 + A1:2024, consolidated Ed 3.1 | Cable current-carrying capacity and correction factors are relevant. The in-app square-root temperature factor is a simplified heat-balance approximation, not a tabulated IEC derating factor; group and other factors are user inputs. |
| `cable-resistance` | IEC 60228, 2023 Ed 4.0 | Conductor classes, nominal cross-sectional areas and DC resistance are in scope. The calculator uses material resistivity and an approximate temperature correction; verify resistance against the cable datasheet and standard tables. |
| `cable-sc-withstand` | IEC 60364-4-43; IEC 60949, IEC 60364-4-43:2023 Ed 4.0; IEC 60949:1988 Ed 1.0 | Overcurrent protection and thermally permissible cable short-circuit current are relevant. The calculator uses S = I√t/k; confirm the correct k value, initial/final temperatures and adiabatic applicability in the project edition. |
| `cable-size-vd` | IEC 60364-5-52; IEC 60228, IEC 60364-5-52:2009 + A1:2024 Ed 3.1; IEC 60228:2023 Ed 4.0 | Wiring-system voltage-drop design and conductor dimensions/resistance are relevant. The calculator is a first-pass size estimate; confirm the actual cable data, installation method and permissible drop. |
| `conductor-temp-resistance` | IEC 60228, 2023 Ed 4.0 | Conductor resistance and construction are in scope. The linear temperature coefficient is a material approximation; confirm actual conductor resistance and temperature limits from the cable standard and manufacturer. |
| `conduit-fill` | NFPA 70, 2026 edition, Chapter 9 Table 1 | The calculator uses the NEC conduit/conductor fill percentages (53%, 31%, 40%). This is applicable only where the relevant NFPA 70 edition and Chapter 9 rules are adopted; cable types and local amendments must be checked. |
| `current-loop-4-20` | IEC 60381-1, 1982 Ed 2.0 | Industrial analogue DC signal ranges are covered by this standard. The calculator performs a user-defined linear scaling and does not check transmitter, receiver, loop-power or accuracy requirements. |
| `dc-voltage-drop` | IEC 60364-5-52; IEC 60228, IEC 60364-5-52:2009 + A1:2024 Ed 3.1; IEC 60228:2023 Ed 4.0 | DC wiring-system design, conductor dimensions and resistance are relevant. The calculation is a simplified resistive drop estimate and does not check ampacity, protective-device coordination or installation conditions. |
| `earth-grid-resistance` | IEEE 80; IEEE 81; IEC 60364-5-54, IEEE 80-2013 (inactive-reserved legacy guide); IEEE 81-2025; IEC 60364-5-54:2011 + A1:2021 Ed 3.1 | Substation grounding-grid safety/design and field measurement are relevant. The calculator is a simplified resistance estimate only; it does not evaluate touch/step voltage, grid geometry, current division or fault duration. |
| `earth-rod-resistance` | IEEE 81; IEC 60364-5-54, IEEE 81-2025; IEC 60364-5-54:2011 + A1:2021 Ed 3.1 | Grounding-system field measurement and earthing arrangements are relevant. The calculator uses a theoretical single-rod approximation in uniform soil; it is not a substitute for soil measurements or site testing. |
| `earth-rods-parallel` | IEEE 81; IEC 60364-5-54, IEEE 81-2025; IEC 60364-5-54:2011 + A1:2021 Ed 3.1 | Ground-electrode measurement and earthing arrangements are relevant. R/n with a utilisation factor is an approximation; mutual resistance, spacing, soil layering and seasonal variation are not modelled. |
| `fault-current` | IEC 60909-0, 2026 Ed 3.0 | Short-circuit current calculation for three-phase AC systems. The calculator is a transformer-impedance estimate and does not assemble a complete network model or apply every IEC correction factor. |
| `fault-loop-impedance` | IEC 60364-4-41; IEC 60364-5-54, IEC 60364-4-41:2017; IEC 60364-5-54:2011 + A1:2021 Ed 3.1 | Automatic disconnection of supply, earth-fault loop impedance and protective conductors are directly relevant. The calculator uses a simplified TN-loop relation; system type, conductor temperature, measured Ze, protective-device trip characteristic and required disconnection time must be verified. |
| `fault-mva` | IEC 60909-0, 2026 Ed 3.0 | Short-circuit level in three-phase AC systems is the governing context. The calculator converts a supplied three-phase fault current to MVA; it does not calculate the fault current itself. |
| `fault-types` | IEC 60909-0, 2026 Ed 3.0 | Short-circuit calculations for three-phase AC systems, including fault types and sequence networks, are relevant. The calculator is a simplified symmetrical-component estimate and assumes the sequence impedances entered represent the complete source path. |
| `generator-kva` | ISO 8528-1, 2018 Ed 3 (published edition; Ed 4 DIS was under development at review date) | Defines generating-set application, ratings and performance. The calculator only estimates kVA from kW, power factor and a user margin; load steps, ambient derating and engine/alternator ratings are not assessed. |
| `harmonic-thd` | IEEE 519; IEC 61000-4-7, IEEE 519-2022; IEC 61000-4-7:2002 + A1:2008 consolidated | Harmonic control at the point of common coupling and harmonic measurement instrumentation are relevant. The calculator only combines selected 3rd, 5th and 7th currents; it is not a full spectrum, TDD or compliance assessment. |
| `insulation-pi-dar` | IEC 60034-27-4, 2018 Ed 1.0 | Recommended test procedures for insulation resistance and polarisation index of rotating-machine windings are relevant. The calculator computes ratios only; test voltage, temperature correction, acceptance criteria and machine-specific limits remain outside scope. |
| `lumen-method` | ISO/CIE 8995-1, 2025 Ed 1 | Indoor workplace lighting requirements and maintained-illuminance criteria are relevant. The lumen-method equation is a simplified planning method; use luminaire photometry, room data and project-specific criteria for design. |
| `max-cable-length` | IEC 60364-5-52, 2009 + A1:2024, consolidated Ed 3.1 | Wiring-system selection and voltage-drop context. The calculator solves a simplified voltage-drop equation; it does not verify ampacity, fault protection or installation method. |
| `motor-current` | IEC 60034-1, 2026 Ed 15 | Rotating-machine rating and performance context. The equation estimates input current from output power, efficiency, power factor and voltage; nameplate data takes precedence. |
| `motor-start-dip` | IEC 60034-12; IEC 60909-0, IEC 60034-12:2024 Ed 4.0; IEC 60909-0:2026 Ed 3.0 | Motor starting performance and supply-system short-circuit strength are relevant context. The voltage-dip equation is a simplified source-impedance estimate, not a complete motor-starting or network study. |
| `motor-starting` | IEC 60034-12, 2024 Ed 4.0 | Starting performance of single-speed three-phase cage induction motors is relevant. The in-app DOL/star-delta/autotransformer ratios are simplified estimates; use motor-manufacturer starting-current and torque data. |
| `ngr-sizing` | IEC 60076-25, 2023 Ed 1.0 | Neutral grounding resistors for power transformers are covered. The calculator derives resistance, duty power and energy from selected voltage/current/time; check system grounding philosophy, duty cycle, tolerances and thermal rating. |
| `parallel-cable-sets` | IEC 60364-5-52, 2009 + A1:2024, consolidated Ed 3.1 | Parallel conductor installation and current-carrying capacity are relevant. The calculator estimates set count from user-supplied ampacity and factors; it does not verify equal current sharing, cable arrangement, terminals or derating tables. |
| `pue` | ISO/IEC 30134-2, 2026 Ed 2 | Defines data-centre PUE measurement, calculation and reporting. The calculator implements the basic total-facility-power / IT-equipment-power ratio; metering boundaries and reporting conditions must follow the standard. |
| `pv-array-size` | IEC 62548-1, 2023 + AMD1:2025, consolidated version | PV-array design and DC-system protection are relevant. The energy-demand sizing formula is a preliminary estimate; module configuration, inverter limits, shading, storage and site yield require separate design checks. |
| `pv-energy` | IEC 61724-1, 2021 Ed 2.0 | PV-system performance monitoring and performance-ratio terminology are relevant. The calculator is a simplified peak-sun-hours × performance-ratio estimate, not an IEC monitoring or yield-prediction implementation. |
| `pv-string-size` | IEC 62548-1, 2023 + AMD1:2025, consolidated version | PV-array design, DC wiring and protective provisions are relevant to cold-voltage string checks. Confirm module Voc and temperature coefficient, inverter maximum voltage and local code requirements. |
| `rtd-pt100` | IEC 60751, 2022 Ed 3 | Industrial platinum resistance thermometers and sensors, including the resistance-temperature relationship, are directly relevant. Confirm tolerance class, connection arrangement, self-heating and temperature range. |
| `star-delta-starting` | IEC 60034-12, 2024 Ed 4.0 | Starting performance for single-speed three-phase cage induction motors is relevant. The one-third current/torque relationships are idealised star-delta estimates; actual motor design, transition and load torque affect performance. |
| `transformer-current` | IEC 60076-1, 2011 Ed 3.0 | General power-transformer requirements and ratings. The calculator uses the three-phase apparent-power/current identity, not a full transformer design method. |
| `transformer-loading` | IEC 60076-1; IEC 60076-7, IEC 60076-1:2011 Ed 3.0; IEC 60076-7:2018 Ed 2.0 | Transformer ratings and loading guidance are relevant. The calculator estimates apparent load from measured voltage/current; thermal loading and life assessment are not included. |
| `transformer-regulation` | IEC 60076-1, 2011 Ed 3.0 | Power-transformer rating and performance context. The calculator uses user-entered resistance/impedance data and an approximate regulation relationship; confirm the test basis and sign convention. |
| `transformer-sizing` | IEC 60076-1; IEC 60076-7, IEC 60076-1:2011 Ed 3.0; IEC 60076-7:2018 Ed 2.0 | Power-transformer ratings and, for mineral-oil-immersed units, loading/thermal ageing are relevant. The calculator sizes from kW, power factor, growth and a selected loading fraction; it does not check harmonics, cooling, ambient or cyclic load. |
| `ups-runtime` | IEC 62040-3; IEEE 485, IEC 62040-3:2021 Ed 3.0; IEEE 485-2020 (active) | UPS performance and stationary lead-acid battery sizing are relevant. The runtime equation is an energy-balance estimate, not a guaranteed discharge curve; IEEE 485 applies only to lead-acid stationary batteries in float service. |
| `voltage-drop` | IEC 60364-5-52, 2009 + A1:2024, consolidated Ed 3.1 | Wiring-system selection and voltage-drop context. The calculator is a simplified estimate; allowable drop depends on the installation code, circuit use and project specification. |
| `voltage-unbalance` | ANSI/NEMA MG 1, 2021, Part 14.36.2 | The calculator uses the maximum-deviation-from-average definition published in NEMA MG 1. IEC 60034-26:2026 addresses effects of unbalanced voltages on three-phase cage motors but uses a different analytical context; do not interchange definitions. |
| `wire-gauge-conversion` | ASTM B258, B258-18 (reapproved 2026) | Defines nominal diameters and cross-sectional areas for AWG solid round wires. This is a gauge conversion only and does not establish ampacity or suitability. |

## Not applicable classification

| Calculator ID | Reason |
|---|---|
| `ac-ohms-law` | Textbook circuit identity (Ohm's law, power, series/parallel, AC circuit theory); no governing standard |
| `agl-lamp-life-curve` | Lamp life versus current is empirical and fitting-specific. The calculator interpolates manufacturer-provided life points; no universal AGL standard prescribes its exponent. |
| `agl-light-intensity-distance` | Allard’s law is an optical visibility relationship. This calculator is not an ICAO/DGCA RVR observation system or an approved RVR calculation; no AGL electrical standard governs the simplified illuminance-at-distance equation. |
| `amps-to-kva` | Textbook power and energy identity (single-phase, three-phase, power factor, per-unit); no governing standard |
| `amps-to-kw` | Textbook power and energy identity (single-phase, three-phase, power factor, per-unit); no governing standard |
| `amps-to-watts` | Textbook power and energy identity (single-phase, three-phase, power factor, per-unit); no governing standard |
| `area-calculator` | Pure mathematics or statistics; no electrical standard governs the method |
| `battery-charge-time` | A simple capacity/current calculation is not a universal charging model. Charge profile, chemistry, temperature, absorption stage and charger control are manufacturer-specific. |
| `battery-mah-wh` | Textbook circuit identity (Ohm's law, power, series/parallel, AC circuit theory); no governing standard |
| `battery-series-parallel` | Series voltage and parallel capacity are basic circuit relationships. Battery chemistry, cell arrangement and safety standards may apply to a project, but no single standard governs this generic relationship calculator. |
| `binomial-distribution` | Pure mathematics or statistics; no electrical standard governs the method |
| `bjt-base-resistor` | The base-current/resistor calculation is a textbook approximation. Transistor gain, saturation voltage, switching and temperature limits must be taken from the device datasheet. |
| `cable-power-loss` | I²R loss is a textbook circuit identity. Cable resistance and installation data should be taken from the relevant conductor standard and manufacturer, but the equation itself has no separate governing calculation standard. |
| `candela-lumens-beam` | Candela, lumens and solid-angle relationships are photometric definitions. No separate design standard governs this idealized beam-angle conversion. |
| `candela-lux-distance` | The inverse-square illuminance relationship is a photometric identity. Lighting standards set application criteria, not this generic point-source conversion equation. |
| `capacitance-series-parallel` | Textbook circuit identity (Ohm's law, power, series/parallel, AC circuit theory); no governing standard |
| `circle-calculator` | Pure mathematics or statistics; no electrical standard governs the method |
| `complex-number` | Pure mathematics or statistics; no electrical standard governs the method |
| `copper-vs-aluminium` | The calculator compares conductor resistivity using a textbook relationship. Material specifications and conductor resistance are standardized separately; no single standard governs this comparison equation. |
| `decibel` | Textbook circuit identity (Ohm's law, power, series/parallel, AC circuit theory); no governing standard |
| `delta-wye` | Textbook circuit identity (Ohm's law, power, series/parallel, AC circuit theory); no governing standard |
| `distance-calculator` | Pure mathematics or statistics; no electrical standard governs the method |
| `electricity-bill-slabs` | Tariff slabs, fixed charges and taxes are utility/jurisdiction-specific; no single electrical standard governs this user-entered billing calculation. |
| `energy-converter` | Unit conversion; no governing standard for the method |
| `energy-cost` | Textbook power and energy identity (single-phase, three-phase, power factor, per-unit); no governing standard |
| `energy-voltage-charge` | Textbook circuit identity (Ohm's law, power, series/parallel, AC circuit theory); no governing standard |
| `ev-charge-time` | Energy divided by charging power is a general estimate. EV charging standards specify EVSE characteristics, connection and safety, not a universal charging-time equation for all vehicles and charge profiles. |
| `fan-pump-affinity` | Fan and pump affinity laws are general similarity relationships. Application limits and performance curves are manufacturer-specific; no single standard governs this generic calculator. |
| `fraction-calculator` | Pure mathematics or statistics; no electrical standard governs the method |
| `frequency-period` | Textbook circuit identity (Ohm's law, power, series/parallel, AC circuit theory); no governing standard |
| `generator-fuel` | Fuel use is based on manufacturer-specific SFC and fuel density. No universal standard fixes the consumption value or this calculator’s simplified autonomy equation. |
| `heatsink-thermal` | The thermal-resistance network is a general heat-transfer calculation. Heatsink and semiconductor limits are manufacturer-specific; no single standard governs this simplified equation. |
| `hp-kw-converter` | Mechanical horsepower to watt conversion is a unit conversion, not a standards-governed electrical design method. |
| `impedance-rlc` | Textbook circuit identity (Ohm's law, power, series/parallel, AC circuit theory); no governing standard |
| `inductance-series-parallel` | Textbook circuit identity (Ohm's law, power, series/parallel, AC circuit theory); no governing standard |
| `ir-temp-correction` | The half-per-10-degree rule is a rule of thumb, not a universal insulation-resistance correction standard. Use the applicable test standard or manufacturer correction curve; do not treat this estimator as standards compliant. |
| `kva-to-amps` | Textbook power and energy identity (single-phase, three-phase, power factor, per-unit); no governing standard |
| `kva-to-kw` | Textbook power and energy identity (single-phase, three-phase, power factor, per-unit); no governing standard |
| `kw-to-kva` | Textbook power and energy identity (single-phase, three-phase, power factor, per-unit); no governing standard |
| `kwh-to-kw` | Textbook circuit identity (Ohm's law, power, series/parallel, AC circuit theory); no governing standard |
| `lc-energy` | Textbook circuit identity (Ohm's law, power, series/parallel, AC circuit theory); no governing standard |
| `led-resistor` | Textbook circuit identity (Ohm's law, power, series/parallel, AC circuit theory); no governing standard |
| `led-retrofit-payback` | Energy savings and simple payback are arithmetic estimates. Tariff, operating hours, lamp life and project costs are site-specific; no single standard governs the payback equation. |
| `line-phase` | Textbook power and energy identity (single-phase, three-phase, power factor, per-unit); no governing standard |
| `linear-interpolation` | Pure mathematics or statistics; no electrical standard governs the method |
| `linear-regression` | Pure mathematics or statistics; no electrical standard governs the method |
| `logarithm` | Pure mathematics or statistics; no electrical standard governs the method |
| `lumens-lux-area` | Lumen, illuminance and area relationships are photometric identities. Lighting standards set design criteria, but do not govern this generic unit/area conversion equation. |
| `lumens-watts` | Luminous efficacy is a ratio of source lumens to electrical watts. Actual efficacy is product-specific; this calculator uses a user-entered value and does not apply a standards table. |
| `lux-to-watts` | The calculation converts a user-selected illuminance target to approximate lamp power using user-entered UF, MF and efficacy. Lighting standards govern the target and design process, not this simplified conversion. |
| `matrix-calculator` | Pure mathematics or statistics; no electrical standard governs the method |
| `maximum-demand` | Demand and diversity factors depend on the adopted wiring code, occupancy and utility rules. The calculator accepts user-defined factors and does not implement a specific standard method. |
| `mean-median-mode` | Pure mathematics or statistics; no electrical standard governs the method |
| `millicandela-lumens-beam` | This is a photometric unit/solid-angle conversion. No separate standard governs the idealized beam-angle equation. |
| `motor-power-output` | Textbook machine relation (slip, torque, shaft power, transformer efficiency); inputs come from the data sheet |
| `motor-slip` | Textbook machine relation (slip, torque, shaft power, transformer efficiency); inputs come from the data sheet |
| `motor-torque` | Textbook machine relation (slip, torque, shaft power, transformer efficiency); inputs come from the data sheet |
| `neutral-current-unbalance` | Textbook power and energy identity (single-phase, three-phase, power factor, per-unit); no governing standard |
| `ohms-law` | Textbook circuit identity (Ohm's law, power, series/parallel, AC circuit theory); no governing standard |
| `op-amp-gain` | Ideal inverting and non-inverting gain are textbook circuit equations. Device bandwidth, offset, stability and output limits are manufacturer-specific. |
| `per-unit-base` | Textbook power and energy identity (single-phase, three-phase, power factor, per-unit); no governing standard |
| `per-unit-convert` | Textbook power and energy identity (single-phase, three-phase, power factor, per-unit); no governing standard |
| `percentage-calculator` | Pure mathematics or statistics; no electrical standard governs the method |
| `percentage-error` | Pure mathematics or statistics; no electrical standard governs the method |
| `permutations-combinations` | Pure mathematics or statistics; no electrical standard governs the method |
| `pf-capacitor-uf` | Textbook power and energy identity (single-phase, three-phase, power factor, per-unit); no governing standard |
| `pf-correction-kvar` | Textbook power and energy identity (single-phase, three-phase, power factor, per-unit); no governing standard |
| `phasor-sum` | Pure mathematics or statistics; no electrical standard governs the method |
| `power-converter` | Unit conversion; no governing standard for the method |
| `power-energy-time` | Textbook circuit identity (Ohm's law, power, series/parallel, AC circuit theory); no governing standard |
| `power-factor` | Textbook power and energy identity (single-phase, three-phase, power factor, per-unit); no governing standard |
| `power-vi-solver` | Textbook circuit identity (Ohm's law, power, series/parallel, AC circuit theory); no governing standard |
| `power-vir` | Textbook circuit identity (Ohm's law, power, series/parallel, AC circuit theory); no governing standard |
| `powers-roots` | Pure mathematics or statistics; no electrical standard governs the method |
| `probability-calculator` | Pure mathematics or statistics; no electrical standard governs the method |
| `pump-motor-power` | Hydraulic power and efficiency conversion are basic engineering relationships. Pump acceptance standards govern tests and performance, not this generic power equation. |
| `pythagorean-theorem` | Pure mathematics or statistics; no electrical standard governs the method |
| `quadratic-solver` | Pure mathematics or statistics; no electrical standard governs the method |
| `rack-cooling` | Heat load and airflow relationships are basic thermal calculations. Facility cooling design depends on equipment data and project thermal criteria; no single standard governs this calculator’s simplified equation. |
| `ratio-calculator` | Pure mathematics or statistics; no electrical standard governs the method |
| `rc-filter-cutoff` | Textbook circuit identity (Ohm's law, power, series/parallel, AC circuit theory); no governing standard |
| `rc-time-constant` | Textbook circuit identity (Ohm's law, power, series/parallel, AC circuit theory); no governing standard |
| `reactance` | Textbook circuit identity (Ohm's law, power, series/parallel, AC circuit theory); no governing standard |
| `resistance-parallel` | Textbook circuit identity (Ohm's law, power, series/parallel, AC circuit theory); no governing standard |
| `resistance-series` | Textbook circuit identity (Ohm's law, power, series/parallel, AC circuit theory); no governing standard |
| `resonance-lc` | Textbook circuit identity (Ohm's law, power, series/parallel, AC circuit theory); no governing standard |
| `rms-peak` | Textbook circuit identity (Ohm's law, power, series/parallel, AC circuit theory); no governing standard |
| `rounding-sig-figs` | Pure mathematics or statistics; no electrical standard governs the method |
| `simultaneous-equations` | Pure mathematics or statistics; no electrical standard governs the method |
| `slope-calculator` | Pure mathematics or statistics; no electrical standard governs the method |
| `standard-deviation` | Pure mathematics or statistics; no electrical standard governs the method |
| `swg-wire` | SWG is a historical gauge table conversion, not a current universal cable-selection or ampacity method. Gauge conversion does not establish conductor compliance or current-carrying capacity. |
| `three-phase-current` | Textbook power and energy identity (single-phase, three-phase, power factor, per-unit); no governing standard |
| `three-phase-power` | Textbook power and energy identity (single-phase, three-phase, power factor, per-unit); no governing standard |
| `timer-555` | The astable 555 timing equations are textbook approximations. Actual timing depends on IC variant, tolerances, threshold levels and manufacturer data. |
| `transformer-efficiency` | Textbook machine relation (slip, torque, shaft power, transformer efficiency); inputs come from the data sheet |
| `triangle-calculator` | Pure mathematics or statistics; no electrical standard governs the method |
| `trig-functions` | Pure mathematics or statistics; no electrical standard governs the method |
| `vector-calculator` | Pure mathematics or statistics; no electrical standard governs the method |
| `vipr-solver` | Textbook circuit identity (Ohm's law, power, series/parallel, AC circuit theory); no governing standard |
| `voltage-divider` | Textbook circuit identity (Ohm's law, power, series/parallel, AC circuit theory); no governing standard |
| `volume-surface-area` | Pure mathematics or statistics; no electrical standard governs the method |
| `water-heater-kw` | The heat-energy equation is a general thermodynamic identity. Heater sizing standards depend on the equipment and application, not this generic equation. |
| `watts-to-amps` | Textbook power and energy identity (single-phase, three-phase, power factor, per-unit); no governing standard |
| `watts-to-lux` | The calculator estimates illuminance from user-entered efficacy, utilisation and maintenance factors. Lighting standards govern design targets and verification, not this simplified estimate. |
| `wind-power` | The Betz/available-wind-power relationship is a physics equation. Wind-turbine standards govern power-performance measurement and turbine design, not this theoretical power estimate. |
| `zener-regulator` | The ideal shunt-regulator resistor equation is a textbook circuit method. Component tolerance, surge, thermal and safe-operating-area limits are datasheet-specific. |

## High-value primary-source checks

| Subject | Official/public source | What it establishes |
|---|---|---|
| Short-circuit calculations | [IEC 60909-0:2026](https://webstore.iec.ch/en/publication/68454) | Current edition 3.0 and scope for three-phase AC short-circuit calculations at 50/60 Hz. |
| Cable wiring systems | [IEC 60364-5-52 consolidated edition](https://webstore.iec.ch/en/publication/103734) | Edition 3.1, including A1:2024. |
| Cable overcurrent / k values | [IEC 60364-4-43:2023](https://webstore.iec.ch/en/publication/28432) | Current edition 4.0; overcurrent protection and conductor short-circuit context. |
| Cable conductors | [IEC 60228:2023](https://webstore.iec.ch/en/publication/71891) | Conductor classes, nominal cross-sectional areas and resistance. Check the IEC catalogue for the applicable product page before formal review. |
| PV array design | [IEC 62548-1:2023 + AMD1:2025](https://webstore.iec.ch/en/publication/110893) | Consolidated current document for PV-array design requirements. |
| Aerodrome lighting | [IEC 61820-1:2019](https://webstore.iec.ch/en/publication/32670), [IEC 61820-1-2:2024](https://webstore.iec.ch/en/publication/61934), [IEC 61820-3-2:2023](https://webstore.iec.ch/en/publication/67387) | AGL fundamental principles, series-circuit-specific requirements and series-circuit power supplies / CCR context. |
| Stationary batteries | [IEEE 485-2020](https://ieeexplore.ieee.org/document/9103320) | Active recommended practice for lead-acid batteries in stationary float service only. |
| Harmonic measurement | [IEC 61000-4-7:2002 + A1:2008](https://webstore.iec.ch/en/publication/4228) | Harmonic/interharmonic measurement instrumentation and methods. |
| Workplace lighting | [ISO/CIE 8995-1:2025](https://www.iso.org/standard/76342.html) | Edition 1, published January 2025; indoor workplace lighting requirements. |

## Follow-up required before formal sign-off

1. Obtain the exact project-adopted licensed editions of the standards listed above, including national adoptions and amendments.
2. Record exact clauses, tables, annexes and formulas for each calculator. In particular, verify cable ampacity/derating factors, short-circuit k values, protective-device characteristics, earth-grid/touch-step criteria, PV module temperature limits, CCR load limits and transformer manufacturer data.
3. Have a qualified electrical engineer independently review the calculator assumptions and recorded references. Do not enter a reviewer name, qualification or approval date until that person has completed the review.
4. For AGL calculators, confirm the airport project’s ICAO Annex 14 edition/amendments, applicable DGCA/AAI requirements, FAA/IEC specifications and manufacturer data. The public ICAO store lists Annex 14 Vol I 9th Edition (July 2022), Amendment 18 (4 August 2025), and Corrigenda 2 and 3 issued in 2026.

## Files updated

- `tools/review_records.json`: 50 scope-screened standard records; no independent reviewer approvals fabricated.
- `tools/standard_applicability.json`: 107 Not applicable entries with calculator-specific reasons.
- `tools/verification_register.js`, `tools/build_pages.js`, `index.html`: UI now distinguishes scope screening from licensed clause review.
- `STANDARDS.md`, `docs/VERIFICATION_REGISTER.md`, and this review file: scope and limitations documented.
