# Elecmetric JavaScript API (v1.73.10)

Elecmetric is a client-side engine: `engine.js` has no dependencies and no DOM. It runs in a browser or in Node 18+. **There is no hosted REST API yet**; see "Hosted API" below.

## Use it

Browser: load `engine.js`, then call `Elecmetric.api(id, inputs)`. Node: `const E = require("./engine.js"); E.api(id, inputs)`.

```js
Elecmetric.api('three-phase-current', {"P":100,"PUnit":"kW","V":400,"VUnit":"V","pf":0.9,"phase":3,"eff":1})
```

## Rules

- `id` is a calculator id from the reference below. An unknown id returns `{ ok: false, error: "Unknown calculator: <id>" }`.
- Each input is a plain number under its `key`. To give it in another unit add `<key>Unit`, for example `PUnit: "kW"`. Without it the input's default unit is used.
- Choice inputs (enums) take the numeric option listed in the reference, not the label.
- Omitted inputs use the calculator's default value. Keys the calculator does not know are ignored.
- Outputs come back in each output's display unit, rounded to 12 significant figures.
- Invalid input returns `ok: false` and an `errors` array of `{ key, msg }`; nothing is thrown.

## Response

Success:

```json
{
  "ok": true,
  "id": "three-phase-current",
  "calculatorVersion": "1.0.0",
  "engine": "1.73.10",
  "outputs": {
    "I": {
      "label": "Full-load current",
      "value": 160.375074775,
      "unit": "A"
    }
  },
  "warnings": [],
  "summary": "The full-load current is 160.38 A for a 100 kW, 400 V, three-phase load at 0.9 power factor."
}
```

Failure:

```json
{
  "ok": false,
  "id": "three-phase-current",
  "errors": [
    {
      "key": "P",
      "msg": "Power must be greater than 0 kW"
    }
  ]
}
```

`warnings` lists the calculator's own cautions (for example a result beyond the end of a size table). Show them with the result.

## Verification status

Every calculator is tested against separately generated reference vectors (`tests/README.md`). Standard applicability records in `tools/review_records.json` distinguish `scope_screened` (public catalogue scope only; licensed clause review still pending) from `clause_reviewed`. The team-level reviewer designation in `tools/team_review_approval.json` is administrative only; it is not an individual or independent professional sign-off. Individual technical approval is a separate record in `tools/review_records.json`. Do not describe API results as certified or standards-compliant.

## Hosted API

Planned, not available. A hosted service would wrap this same `api()` function behind HTTPS (`POST /v1/calculate/<id>`), return the response above unchanged, version the path, and add authentication and rate limits. Until it exists, embed `engine.js` directly (it is a single file) or link to a calculator with pre-filled inputs: `/#three-phase-current?P=250:kW&V=415:V`.

## Calculator reference (157)

### `ohms-law`: Ohm's Law

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `V` | Voltage | µV, mV, V, kV, MV, GV | 230 V |
| `R` | Resistance | mΩ, Ω, kΩ, MΩ, GΩ | 46 Ω |

Outputs: `I` (Current, A); `P` (Power, W)

### `three-phase-current`: Current from Power (kW to Amps)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `P` | Power | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 100 kW |
| `V` | Voltage | µV, mV, V, kV, MV, GV | 400 V |
| `pf` | Power factor |  | 0.9 |
| `phase` | Current type | 3 = Three-phase AC; 1 = Single-phase AC; 0 = DC | 3 |
| `vt` | Voltage type (three-phase only) | 0 = Line-to-line (L-L); 1 = Line-to-neutral (L-N) | 0 |
| `eff` | Efficiency |  | 1 |

Outputs: `I` (Full-load current, A)

### `kva-to-amps`: kVA to Amps

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `S` | Apparent power | VA, kVA, MVA | 500 kVA |
| `V` | Voltage | µV, mV, V, kV, MV, GV | 415 V |
| `phase` | Current type | 3 = Three-phase AC; 1 = Single-phase AC; 0 = DC | 3 |
| `vt` | Voltage type (three-phase only) | 0 = Line-to-line (L-L); 1 = Line-to-neutral (L-N) | 0 |

Outputs: `I` (Line current, A)

### `kw-to-kva`: kW to kVA and kVAR

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `P` | Real power | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 100 kW |
| `pf` | Power factor |  | 0.8 |

Outputs: `S` (Apparent power, kVA); `Q` (Reactive power, kVAR)

### `pf-correction-kvar`: Power Factor Correction

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `P` | Real power | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 100 kW |
| `pf1` | Present power factor |  | 0.8 |
| `pf2` | Target power factor |  | 0.95 |

Outputs: `Qc` (Capacitor rating, kVAR)

### `voltage-drop`: Voltage Drop

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `I` | Load current | µA, mA, A, kA, MA | 160.4 A |
| `L` | Route length | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 120 m |
| `R` | Cable resistance | Ω/km, mΩ/m, Ω/m | 0.246 Ω/km |
| `X` | Cable reactance | Ω/km, mΩ/m, Ω/m | 0.08 Ω/km |
| `V` | System voltage (L-L) | µV, mV, V, kV, MV, GV | 400 V |
| `pf` | Power factor |  | 0.9 |
| `phase` | Phase | 3 = Three-phase; 1 = Single-phase | 3 |
| `n` | Conductors per phase in parallel | 1 = One (single set); 2 = 2 in parallel; 3 = 3 in parallel; 4 = 4 in parallel; 5 = 5 in parallel; 6 = 6 in parallel; 7 = 7 in parallel; 8 = 8 in parallel; 9 = 9 in parallel | 1 |

Outputs: `Vd` (Voltage drop, V); `pct` (Drop as % of system voltage)

### `breaker-size`: Breaker Rating Selection

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `I` | Design current | µA, mA, A, kA, MA | 400.94 A |
| `m` | Margin factor |  | 1 |

Outputs: `In` (Breaker rating, A)

### `fault-current`: Transformer Fault Current

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `S` | Transformer rating | VA, kVA, MVA | 1000 kVA |
| `V` | Secondary voltage (L-L) | µV, mV, V, kV, MV, GV | 415 V |
| `Z` | Impedance |  | 5 |

Outputs: `Isc` (Fault current at terminals, kA)

### `motor-current`: Motor Full-Load Current

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `P` | Shaft power | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 250 kW |
| `V` | Line voltage (L-L) | µV, mV, V, kV, MV, GV | 415 V |
| `pf` | Power factor |  | 0.88 |
| `eff` | Efficiency |  | 0.95 |
| `phase` | Phase | 3 = Three-phase; 1 = Single-phase | 3 |

Outputs: `I` (Full-load current, A); `Pin` (Electrical input power, kW)

### `transformer-current`: Transformer Full-Load Current

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `S` | Transformer rating | VA, kVA, MVA | 1000 kVA |
| `V` | Winding voltage (L-L) | µV, mV, V, kV, MV, GV | 415 V |

Outputs: `I` (Rated current, A)

### `energy-cost`: Appliance Running Cost (Energy and Cost)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `P` | Load | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 2 kW |
| `cap` | Run at (% of the load) |  | 100 |
| `h` | Hours of use |  | 8 |
| `per` | Hours of use are per | 0 = Day; 1 = Week; 2 = Month | 0 |
| `d` | Days to total |  | 30 |
| `t` | Tariff per kWh |  | 8 |
| `cur` | Currency symbol on the results | 0 = None; 1 = ₹ rupee; 2 = $ dollar; 3 = € euro; 4 = £ pound | 0 |

Outputs: `E` (Energy (days entered), kWh); `cost` (Cost (days entered)); `costDay` (Cost per day); `costMonth` (Cost per month); `costYear` (Cost per year); `Eday` (Energy per day, kWh); `Emonth` (Energy per month, kWh); `Eyear` (Energy per year, kWh)

### `electricity-bill-slabs`: Electricity Bill from Tariff Slabs (fixed charge, tax)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `E` | Energy used in the billing period (kWh) |  | 480 |
| `s1` | First slab size (kWh) |  | 100 |
| `r1` | First slab rate (per kWh) |  | 4 |
| `s2` | Second slab size (kWh) |  | 200 |
| `r2` | Second slab rate (per kWh) |  | 6 |
| `r3` | Rate above both slabs (per kWh) |  | 8 |
| `fc` | Fixed charge for the period |  | 100 |
| `tax` | Tax or duty on the bill (%) |  | 5 |

Outputs: `total` (Total bill); `energy` (Energy charge); `taxAmt` (Tax); `avg` (Average cost per kWh)

### `power-vir`: Power from Voltage and Current

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `V` | Voltage | µV, mV, V, kV, MV, GV | 230 V |
| `I` | Current | µA, mA, A, kA, MA | 5 A |

Outputs: `P` (Power, W); `R` (Resistance, Ω)

### `ac-ohms-law`: AC Ohm's Law (Phasors)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `V` | Voltage |V| | µV, mV, V, kV, MV, GV | 230 V |
| `Vang` | Voltage angle (degrees) |  | 0 |
| `I` | Current |I| | µA, mA, A, kA, MA |  A |
| `Iang` | Current angle (degrees) |  |  |
| `Z` | Impedance |Z| | mΩ, Ω, kΩ, MΩ, GΩ | 46 Ω |
| `Zang` | Impedance angle (degrees) |  | 30 |

Outputs: `V` (Voltage |V|, V); `Vang` (Voltage angle (degrees)); `I` (Current |I|, A); `Iang` (Current angle (degrees)); `Z` (Impedance |Z|, Ω); `Zang` (Impedance angle (degrees)); `S` (Apparent power |S|, VA); `P` (Real power P, W); `Q` (Reactive power Q (+ inductive), VAR); `pf` (Power factor)

### `vipr-solver`: Watts, Volts, Amps, Ohms (any two)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `V` | Voltage | µV, mV, V, kV, MV, GV | 230 V |
| `I` | Current | µA, mA, A, kA, MA | 5 A |
| `R` | Resistance | mΩ, Ω, kΩ, MΩ, GΩ |  Ω |
| `P` | Power | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP |  W |

Outputs: `V` (Voltage, V); `I` (Current, A); `R` (Resistance, Ω); `P` (Power, W)

### `power-vi-solver`: Power, Voltage, Current with Power Factor (solve any)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `P` | Real power | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP |  kW |
| `V` | Voltage | µV, mV, V, kV, MV, GV | 400 V |
| `I` | Line current | µA, mA, A, kA, MA | 100 A |
| `pf` | Power factor |  | 0.9 |
| `phase` | Current type | 3 = Three-phase AC; 1 = Single-phase AC; 0 = DC | 3 |
| `vt` | Voltage type (three-phase only) | 0 = Line-to-line (L-L); 1 = Line-to-neutral (L-N) | 0 |

Outputs: `P` (Real power, kW); `V` (Line voltage, V); `I` (Line current, A)

### `kwh-to-kw`: kWh to kW and Watts

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `E` | Energy | µJ, mJ, J, kJ, MJ, kcal, BTU, Wh, kWh, MWh, eV, keV, MeV, cal, GeV | 12 kWh |
| `t` | Time | µs, ms, s, min, h | 4 h |

Outputs: `P` (Average power, kW)

### `power-energy-time`: Watts, Joules, kWh and Time (any two)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `P` | Power | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 100 W |
| `E` | Energy | µJ, mJ, J, kJ, MJ, kcal, BTU, Wh, kWh, MWh, eV, keV, MeV, cal, GeV |  J |
| `t` | Time | µs, ms, s, min, h | 10 s |

Outputs: `P` (Power, W); `E` (Energy, J); `t` (Time, s)

### `energy-voltage-charge`: Joules, Volts, Charge and eV (any two)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `E` | Energy | µJ, mJ, J, kJ, MJ, kcal, BTU, Wh, kWh, MWh, eV, keV, MeV, cal, GeV |  J |
| `V` | Voltage | µV, mV, V, kV, MV, GV | 12 V |
| `Q` | Charge | nC, µC, mC, C, e | 2 C |

Outputs: `E` (Energy, J); `Eev` (Energy in electronvolts, eV); `V` (Voltage, V); `Q` (Charge, C)

### `battery-mah-wh`: mAh to Wh and Wh to mAh

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Q` | Battery capacity | mAh, Ah, kAh, C, mC, kC | 5000 mAh |
| `V` | Nominal voltage | µV, mV, V, kV, MV, GV | 3.7 V |
| `E` | Energy | µJ, mJ, J, kJ, MJ, kcal, BTU, Wh, kWh, MWh, eV, keV, MeV, cal, GeV |  Wh |

Outputs: `Q` (Battery capacity, mAh); `V` (Nominal voltage, V); `E` (Energy, Wh)

### `resistance-series`: Resistors in Series

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `R1` | Resistor 1 | mΩ, Ω, kΩ, MΩ, GΩ | 100 Ω |
| `R2` | Resistor 2 | mΩ, Ω, kΩ, MΩ, GΩ | 220 Ω |
| `R3` | Resistor 3 | mΩ, Ω, kΩ, MΩ, GΩ | 330 Ω |

Outputs: `Rt` (Total resistance, Ω)

### `resistance-parallel`: Resistors in Parallel

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `R1` | Resistor 1 | mΩ, Ω, kΩ, MΩ, GΩ | 100 Ω |
| `R2` | Resistor 2 | mΩ, Ω, kΩ, MΩ, GΩ | 220 Ω |
| `R3` | Resistor 3 | mΩ, Ω, kΩ, MΩ, GΩ | 330 Ω |

Outputs: `Rt` (Equivalent resistance, Ω)

### `capacitance-series-parallel`: Capacitors in Series and Parallel

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `C1` | Capacitor 1 | pF, nF, µF, F | 10 µF |
| `C2` | Capacitor 2 | pF, nF, µF, F | 22 µF |
| `C3` | Capacitor 3 | pF, nF, µF, F | 47 µF |

Outputs: `Cp` (In parallel, µF); `Cs` (In series, µF)

### `inductance-series-parallel`: Inductors in Series and Parallel

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `L1` | Inductor 1 | µH, mH, H | 10 mH |
| `L2` | Inductor 2 | µH, mH, H | 22 mH |
| `L3` | Inductor 3 | µH, mH, H | 47 mH |

Outputs: `Ls` (In series, mH); `Lp` (In parallel, mH)

### `reactance`: Inductive and Capacitive Reactance

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `f` | Frequency | Hz, kHz, MHz, GHz, THz, rad/s | 50 Hz |
| `L` | Inductance | µH, mH, H | 100 mH |
| `C` | Capacitance | pF, nF, µF, F | 100 µF |

Outputs: `XL` (Inductive reactance XL, Ω); `XC` (Capacitive reactance XC, Ω)

### `impedance-rlc`: Series RLC Impedance

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `R` | Resistance | mΩ, Ω, kΩ, MΩ, GΩ | 10 Ω |
| `L` | Inductance | µH, mH, H | 100 mH |
| `C` | Capacitance | pF, nF, µF, F | 100 µF |
| `f` | Frequency | Hz, kHz, MHz, GHz, THz, rad/s | 50 Hz |

Outputs: `Z` (Impedance |Z|, Ω); `phi` (Phase angle (degrees, + inductive)); `pf` (Power factor)

### `frequency-period`: Frequency and Period

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `f` | Frequency | Hz, kHz, MHz, GHz, THz, rad/s | 50 Hz |

Outputs: `T` (Period, ms); `w` (Angular frequency (rad/s))

### `rms-peak`: RMS, Peak and Peak-to-Peak

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Vp` | Peak voltage | µV, mV, V, kV, MV, GV | 325 V |

Outputs: `Vrms` (RMS voltage, V); `Vpp` (Peak-to-peak, V)

### `watts-to-amps`: Watts to Amps

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `P` | Power | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 1000 W |
| `V` | Voltage | µV, mV, V, kV, MV, GV | 230 V |
| `pf` | Power factor |  | 1 |
| `phase` | Current type | 3 = Three-phase AC; 1 = Single-phase AC; 0 = DC | 1 |
| `vt` | Voltage type (three-phase only) | 0 = Line-to-line (L-L); 1 = Line-to-neutral (L-N) | 0 |

Outputs: `I` (Current, A)

### `amps-to-watts`: Amps to Watts

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `I` | Current | µA, mA, A, kA, MA | 10 A |
| `V` | Voltage | µV, mV, V, kV, MV, GV | 230 V |
| `pf` | Power factor |  | 0.9 |
| `phase` | Current type | 3 = Three-phase AC; 1 = Single-phase AC; 0 = DC | 1 |
| `vt` | Voltage type (three-phase only) | 0 = Line-to-line (L-L); 1 = Line-to-neutral (L-N) | 0 |

Outputs: `P` (Real power, W)

### `amps-to-kw`: Amps to kW

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `I` | Line current | µA, mA, A, kA, MA | 100 A |
| `V` | Voltage | µV, mV, V, kV, MV, GV | 400 V |
| `pf` | Power factor |  | 0.9 |
| `phase` | Current type | 3 = Three-phase AC; 1 = Single-phase AC; 0 = DC | 3 |
| `vt` | Voltage type (three-phase only) | 0 = Line-to-line (L-L); 1 = Line-to-neutral (L-N) | 0 |
| `eff` | Efficiency |  | 1 |

Outputs: `P` (Real power, kW); `Pout` (Output power (P × η), kW)

### `amps-to-kva`: Amps to kVA

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `I` | Line current | µA, mA, A, kA, MA | 100 A |
| `V` | Voltage | µV, mV, V, kV, MV, GV | 415 V |
| `phase` | Current type | 3 = Three-phase AC; 1 = Single-phase AC; 0 = DC | 3 |
| `vt` | Voltage type (three-phase only) | 0 = Line-to-line (L-L); 1 = Line-to-neutral (L-N) | 0 |

Outputs: `S` (Apparent power, kVA)

### `kva-to-kw`: kVA to kW

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `S` | Apparent power | VA, kVA, MVA | 100 kVA |
| `pf` | Power factor |  | 0.8 |

Outputs: `P` (Real power, kW); `Q` (Reactive power, kVAR)

### `three-phase-power`: Three-Phase Power

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `V` | Line voltage (L-L) | µV, mV, V, kV, MV, GV | 400 V |
| `I` | Line current | µA, mA, A, kA, MA | 100 A |
| `pf` | Power factor |  | 0.9 |

Outputs: `P` (Real power, kW); `S` (Apparent power, kVA); `Q` (Reactive power, kVAR)

### `power-factor`: Power Factor

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `P` | Real power | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 80 kW |
| `S` | Apparent power | VA, kVA, MVA | 100 kVA |

Outputs: `pf` (Power factor); `phi` (Phase angle (degrees))

### `cable-resistance`: Cable Resistance

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `L` | Length | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 100 m |
| `A` | Cross-section | mm², cm², m², ha, km², in², ft², yd², acre, mi², cmil | 16 mm² |
| `rho` | Resistivity at 20 °C (Ω·mm²/m) |  | 0.017241 |
| `T` | Operating temperature (°C) |  | 20 |
| `alpha` | Temperature coefficient (per °C) |  | 0.00393 |

Outputs: `R` (Resistance, Ω); `Rk` (Per unit length, Ω/km)

### `wire-gauge-conversion`: AWG to Diameter and Area

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `n` | AWG (use −1 for 00, −2 for 000, −3 for 0000) |  | 10 |

Outputs: `d` (Diameter, mm); `A` (Cross-section, mm²)

### `max-cable-length`: Maximum Cable Length

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `I` | Load current | µA, mA, A, kA, MA | 100 A |
| `V` | System voltage (L-L) | µV, mV, V, kV, MV, GV | 400 V |
| `lim` | Allowed drop (%) |  | 3 |
| `R` | Cable resistance | Ω/km, mΩ/m, Ω/m | 0.1 Ω/km |
| `X` | Cable reactance | Ω/km, mΩ/m, Ω/m | 0.08 Ω/km |
| `pf` | Power factor |  | 0.9 |
| `phase` | Phase | 3 = Three-phase; 1 = Single-phase | 3 |
| `n` | Conductors per phase in parallel | 1 = One (single set); 2 = 2 in parallel; 3 = 3 in parallel; 4 = 4 in parallel; 5 = 5 in parallel; 6 = 6 in parallel; 7 = 7 in parallel; 8 = 8 in parallel; 9 = 9 in parallel | 1 |

Outputs: `L` (Maximum length, m)

### `cable-derating`: Cable Derating and Ampacity

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Ib` | Design current | µA, mA, A, kA, MA | 160.4 A |
| `In` | Protective device rating | µA, mA, A, kA, MA | 200 A |
| `Itab` | Tabulated ampacity (data sheet, reference conditions) | µA, mA, A, kA, MA | 300 A |
| `basis` | Calculation basis | 1 = General / IEC-style (70 / 90 °C, 30 °C table ambient); 4 = IS India (70 / 90 °C, 40 °C table ambient); 5 = BS 7671 UK (70 / 90 °C, 30 °C table ambient) - provisional, not checked against the 2026 amendment; 6 = AS/NZS 3008 ampacity basis (75 / 90 °C, 40 °C table ambient) - provisional, not checked against the 2025 edition; 2 = NEC-style (75 / 90 °C, 125% on continuous load); 3 = User-defined (set below in Engineering mode) | 1 |
| `ins` | Insulation | 1 = PVC (70 °C; 75 °C under AS/NZS and NEC-style); 2 = XLPE / EPR (90 °C conductor) | 2 |
| `Ta` | Ambient temperature (°C) |  | 40 |
| `tmu` | User-defined conductor limit (°C) |  | 90 |
| `cf` | User-defined factor on design current |  | 1 |
| `Tref` | Reference ambient of the tabulated value (°C) |  | 30 |
| `kg` | Grouping factor |  | 0.8 |
| `ko` | Other correction factor |  | 1 |

Outputs: `kt` (Temperature factor (approx.)); `Iz` (Derated current capacity, A); `Ireq` (Tabulated ampacity required, A); `Idev` (Minimum device rating for this basis, A)

### `cable-size-vd`: Cable Size for Voltage Drop

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `I` | Load current | µA, mA, A, kA, MA | 400.94 A |
| `L` | Route length | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 180 m |
| `V` | System voltage (L-L) | µV, mV, V, kV, MV, GV | 400 V |
| `lim` | Allowed drop (%) |  | 3 |
| `pf` | Power factor |  | 0.9 |
| `mat` | Conductor | 1 = Copper; 2 = Aluminium | 1 |
| `ins` | Insulation | 1 = PVC (70 °C); 2 = XLPE / EPR (90 °C) | 2 |
| `X` | Cable reactance | Ω/km, mΩ/m, Ω/m | 0.08 Ω/km |
| `phase` | Phase | 3 = Three-phase; 1 = Single-phase | 3 |

Outputs: `Amin` (Minimum cross-section, mm²); `Astd` (Standard size, mm²); `Vd` (Drop at standard size, V); `pct` (Drop as % of system voltage)

### `cable-sc-withstand`: Cable Short-Circuit Withstand

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Isc` | Fault current (rms) | µA, mA, A, kA, MA | 25 kA |
| `t` | Clearing time | µs, ms, s, min, h | 1 s |
| `mat` | Conductor and insulation | 1 = Copper / PVC (k = 115, 103 above 300 mm²); 2 = Copper / XLPE (k = 143); 3 = Aluminium / PVC (k = 76, 68 above 300 mm²); 4 = Aluminium / XLPE (k = 94) | 2 |

Outputs: `Amin` (Minimum cross-section, mm²); `Astd` (Standard size, mm²); `k` (Material constant k)

### `motor-torque`: Motor Shaft Torque

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `P` | Shaft power | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 75 kW |
| `N` | Rated speed | rpm | 1480 rpm |

Outputs: `T` (Shaft torque, N·m)

### `motor-slip`: Induction Motor Slip

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `f` | Supply frequency | Hz, kHz, MHz, GHz, THz, rad/s | 50 Hz |
| `poles` | Number of poles |  | 4 |
| `N` | Rotor speed | rpm | 1470 rpm |

Outputs: `Ns` (Synchronous speed, rpm); `slip` (Slip (%))

### `motor-starting`: Motor Starting Current

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `In` | Full-load current | µA, mA, A, kA, MA | 140 A |
| `k` | Locked-rotor current (× full-load) |  | 6.5 |
| `meth` | Starting method | 1 = Direct on line; 2 = Star-delta; 3 = Auto-transformer | 1 |
| `tap` | Auto-transformer tap |  | 0.65 |

Outputs: `Ist` (Line starting current, A); `Tq` (Starting torque (% of direct-on-line))

### `transformer-regulation`: Transformer Voltage Regulation

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Z` | Impedance (%) |  | 5 |
| `R` | Resistance (%) |  | 1 |
| `x` | Load (fraction of rating) |  | 1 |
| `pf` | Power factor |  | 0.8 |
| `V` | No-load secondary voltage | µV, mV, V, kV, MV, GV | 415 V |

Outputs: `reg` (Regulation (%)); `Vl` (Secondary voltage on load, V)

### `transformer-efficiency`: Transformer Efficiency and Losses

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `S` | Rating | VA, kVA, MVA | 1000 kVA |
| `Pfe` | No-load (iron) loss | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 1.7 kW |
| `Pcu` | Full-load copper loss | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 10.5 kW |
| `x` | Load (fraction of rating) |  | 1 |
| `pf` | Power factor |  | 0.9 |

Outputs: `eff` (Efficiency (%)); `loss` (Total loss, kW); `xo` (Load at maximum efficiency)

### `generator-kva`: Generator kVA Selection

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `P` | Running load | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 400 kW |
| `pf` | Power factor |  | 0.8 |
| `m` | Design margin (%) |  | 25 |
| `V` | Line voltage (L-L) | µV, mV, V, kV, MV, GV | 415 V |

Outputs: `Sr` (Required rating, kVA); `Ss` (Next standard size, kVA); `I` (Rated current at that size, A)

### `ups-runtime`: UPS Battery Runtime

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Pl` | Load | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 10 kW |
| `eff` | UPS efficiency |  | 0.95 |
| `Vb` | Battery bank voltage | µV, mV, V, kV, MV, GV | 240 V |
| `Ah` | Battery capacity | mAh, Ah, kAh, C, mC, kC | 100 Ah |
| `dod` | Usable depth of discharge |  | 0.8 |
| `age` | Ageing and temperature factor |  | 0.8 |

Outputs: `E` (Usable battery energy, kWh); `T` (Runtime, min)

### `per-unit-base`: Per-Unit Base Values

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `S` | Base power | VA, kVA, MVA | 100 MVA |
| `V` | Base voltage (L-L) | µV, mV, V, kV, MV, GV | 132 kV |

Outputs: `Ib` (Base current, A); `Zb` (Base impedance, Ω)

### `pv-string-size`: Solar PV String Length

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Voc` | Module open-circuit voltage (STC) | µV, mV, V, kV, MV, GV | 49.5 V |
| `tc` | Voc temperature coefficient (%/°C) |  | -0.28 |
| `Tmin` | Lowest site temperature (°C) |  | -5 |
| `Vmax` | Maximum system voltage | µV, mV, V, kV, MV, GV | 1000 V |

Outputs: `Vc` (Cold open-circuit voltage per module, V); `N` (Maximum modules per string)

### `pv-energy`: Solar PV Energy Yield

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `P` | Array size (peak) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 100 kW |
| `psh` | Peak sun hours per day |  | 5.5 |
| `pr` | Performance ratio |  | 0.78 |

Outputs: `Ed` (Energy per day, kWh); `Ey` (Energy per year, kWh)

### `ev-charge-time`: EV Charging Time

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `cap` | Battery capacity | µJ, mJ, J, kJ, MJ, kcal, BTU, Wh, kWh, MWh, eV, keV, MeV, cal, GeV | 60 kWh |
| `from` | Start charge (%) |  | 20 |
| `to` | Target charge (%) |  | 80 |
| `P` | Charger power (AC supply) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 11 kW |
| `eff` | Charging efficiency |  | 0.9 |

Outputs: `Eb` (Energy into battery, kWh); `Eg` (Energy from grid, kWh); `T` (Charging time, h)

### `lumen-method`: Lighting Level (Lumen Method)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `E` | Required illuminance (lux) |  | 500 |
| `A` | Room area | mm², cm², m², ha, km², in², ft², yd², acre, mi², cmil | 100 m² |
| `phi` | Lumens per luminaire |  | 4000 |
| `uf` | Utilisation factor |  | 0.6 |
| `mf` | Maintenance factor |  | 0.8 |

Outputs: `N` (Luminaires (calculated)); `Nr` (Luminaires (rounded up))

### `earth-rod-resistance`: Earth Rod Resistance

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `rho` | Soil resistivity (Ω·m) |  | 100 |
| `L` | Rod length driven in soil | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 3 m |
| `d` | Rod diameter | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 16 mm |

Outputs: `R` (Earth resistance, Ω)

### `harmonic-thd`: Current THD

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `I1` | Fundamental current | µA, mA, A, kA, MA | 100 A |
| `I3` | 3rd harmonic | µA, mA, A, kA, MA | 20 A |
| `I5` | 5th harmonic | µA, mA, A, kA, MA | 12 A |
| `I7` | 7th harmonic | µA, mA, A, kA, MA | 8 A |

Outputs: `thd` (THD (%)); `Irms` (Total RMS current, A)

### `pf-capacitor-uf`: Capacitor Bank Size (µF)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Q` | Bank rating | VAR, kVAR, MVAR | 58.4 kVAR |
| `V` | Line voltage (L-L) | µV, mV, V, kV, MV, GV | 415 V |
| `f` | Frequency | Hz, kHz, MHz, GHz, THz, rad/s | 50 Hz |

Outputs: `C` (Capacitance per phase, µF); `I` (Bank line current, A)

### `fault-mva`: Fault Level (kA to MVA)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `V` | Line voltage (L-L) | µV, mV, V, kV, MV, GV | 415 V |
| `I` | Fault current | µA, mA, A, kA, MA | 25 kA |

Outputs: `S` (Fault level, MVA)

### `voltage-divider`: Voltage Divider

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Vin` | Input voltage | µV, mV, V, kV, MV, GV | 12 V |
| `R1` | Upper resistor R1 | mΩ, Ω, kΩ, MΩ, GΩ | 10 kΩ |
| `R2` | Lower resistor R2 | mΩ, Ω, kΩ, MΩ, GΩ | 10 kΩ |

Outputs: `Vo` (Output voltage, V); `Id` (Divider current, mA)

### `led-resistor`: LED Series Resistor

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Vs` | Supply voltage | µV, mV, V, kV, MV, GV | 5 V |
| `Vf` | LED forward voltage | µV, mV, V, kV, MV, GV | 2 V |
| `If` | LED current | µA, mA, A, kA, MA | 20 mA |

Outputs: `R` (Resistor value, Ω); `P` (Resistor dissipation, W)

### `rc-time-constant`: RC Time Constant and Cutoff

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `R` | Resistance | mΩ, Ω, kΩ, MΩ, GΩ | 10 kΩ |
| `C` | Capacitance | pF, nF, µF, F | 0.1 µF |

Outputs: `tau` (Time constant τ, ms); `fc` (Cutoff frequency, Hz)

### `current-loop-4-20`: 4-20 mA Signal Scaling

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `I` | Loop current | µA, mA, A, kA, MA | 12 mA |
| `lo` | Range at 4 mA |  | 0 |
| `hi` | Range at 20 mA |  | 100 |

Outputs: `PV` (Process value); `pct` (Span (%))

### `battery-bank-size`: Battery Bank Sizing

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `P` | Load power | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 500 W |
| `t` | Backup time | µs, ms, s, min, h | 4 h |
| `V` | Battery bank voltage | µV, mV, V, kV, MV, GV | 48 V |
| `dod` | Usable depth of discharge |  | 0.8 |
| `eff` | Inverter efficiency |  | 0.9 |

Outputs: `Ah` (Required capacity, Ah); `E` (Energy from battery, kWh)

### `cable-power-loss`: Cable Power Loss (I²R)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `I` | Load current | µA, mA, A, kA, MA | 100 A |
| `L` | Route length | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 1000 m |
| `R` | Conductor resistance | Ω/km, mΩ/m, Ω/m | 0.2 Ω/km |
| `V` | System voltage (L-L) | µV, mV, V, kV, MV, GV | 400 V |
| `pf` | Power factor |  | 0.9 |
| `phase` | Phase | 3 = Three-phase; 1 = Single-phase | 3 |

Outputs: `Pl` (Cable loss, W); `pct` (Loss as % of load power)

### `dc-voltage-drop`: Voltage Drop from Conductor Size

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `I` | Load current | µA, mA, A, kA, MA | 50 A |
| `L` | One-way length | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 50 m |
| `mat` | Conductor material | 1 = Copper; 2 = Aluminium; 3 = Silver; 4 = Gold; 5 = Nickel; 6 = Nichrome; 7 = Custom (enter resistivity below) | 1 |
| `sz` | Conductor size given as | 0 = Cross-section (area); 1 = AWG number; 2 = Wire diameter | 0 |
| `A` | Conductor cross-section (used when size is given as area) | mm², cm², m², ha, km², in², ft², yd², acre, mi², cmil | 10 mm² |
| `awg` | AWG number (used when size is given as AWG; −1 = 00, −2 = 000, −3 = 0000) |  | 8 |
| `D` | Wire diameter (used when size is given as diameter) | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 3.264 mm |
| `rhoC` | Custom resistivity at 20 °C (used when material is Custom) | Ω·m, Ω·cm | 1.7241e-8 Ω·m |
| `aC` | Custom temperature coefficient (per °C) |  | 0 |
| `T` | Conductor temperature (°C) |  | 20 |
| `V` | System voltage | µV, mV, V, kV, MV, GV | 230 V |
| `phase` | Circuit | 1 = Two-wire (DC or single-phase AC); 3 = Three-phase AC (resistive) | 1 |

Outputs: `Vd` (Voltage drop, V); `pct` (Drop as % of system voltage); `R` (Conductor resistance (one way, at temperature), Ω); `Au` (Cross-section used, mm²); `rho` (Resistivity used (at conductor temperature), Ω·m)

### `conductor-temp-resistance`: Conductor Resistance vs Temperature

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `R20` | Resistance at 20 °C | mΩ, Ω, kΩ, MΩ, GΩ | 1 Ω |
| `T` | Operating temperature (°C) |  | 70 |
| `mat` | Conductor material | 1 = Copper; 2 = Aluminium | 1 |

Outputs: `RT` (Resistance at temperature, Ω); `chg` (Change from 20 °C (%))

### `copper-vs-aluminium`: Copper vs Aluminium Conductor

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `A` | Copper cross-section | mm², cm², m², ha, km², in², ft², yd², acre, mi², cmil | 95 mm² |
| `L` | Length | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 100 m |

Outputs: `Rcu` (Copper resistance (20 °C), Ω); `Ral` (Aluminium resistance, same size, Ω); `Aeq` (Aluminium size for equal resistance, mm²); `wr` (Aluminium mass vs copper (equal resistance))

### `motor-power-output`: Motor Output Power and Efficiency Loss

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `V` | Line voltage (L-L) | µV, mV, V, kV, MV, GV | 415 V |
| `I` | Line current | µA, mA, A, kA, MA | 140 A |
| `pf` | Power factor |  | 0.88 |
| `eff` | Efficiency |  | 0.93 |

Outputs: `Pin` (Electrical input, kW); `Pout` (Shaft output, kW); `loss` (Motor loss, kW)

### `motor-start-dip`: Motor Starting Voltage Dip

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `In` | Motor full-load current | µA, mA, A, kA, MA | 140 A |
| `k` | Starting current (× full-load) |  | 6.5 |
| `V` | Line voltage (L-L) | µV, mV, V, kV, MV, GV | 415 V |
| `Ssc` | Fault level at the motor bus | VA, kVA, MVA | 10 MVA |

Outputs: `dip` (Voltage dip (%)); `Sst` (Starting apparent power, MVA); `Tq` (Torque available vs full voltage (%))

### `pump-motor-power`: Pump Shaft and Motor Power

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Q` | Flow | L/s, m³/h, m³/s, CFM, L/min, m³/min, GPM | 100 m³/h |
| `H` | Total head | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 30 m |
| `rho` | Liquid density (kg/m³) |  | 1000 |
| `ep` | Pump efficiency |  | 0.7 |
| `em` | Motor efficiency |  | 0.92 |

Outputs: `Ph` (Hydraulic power, kW); `Ps` (Pump shaft power, kW); `Pm` (Motor electrical input, kW)

### `transformer-sizing`: Transformer kVA Selection

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `P` | Connected running load | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 450 kW |
| `pf` | Power factor |  | 0.9 |
| `g` | Future growth (%) |  | 10 |
| `ld` | Target loading |  | 0.8 |
| `V` | Secondary voltage (L-L) | µV, mV, V, kV, MV, GV | 415 V |

Outputs: `Sr` (Required rating, kVA); `Ss` (Next standard size, kVA); `I` (Secondary full-load current, A)

### `transformer-loading`: Transformer Loading from Measurements

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `V` | Secondary voltage (L-L) | µV, mV, V, kV, MV, GV | 415 V |
| `I` | Measured line current | µA, mA, A, kA, MA | 900 A |
| `S` | Transformer rating | VA, kVA, MVA | 1000 kVA |

Outputs: `Sl` (Present load, kVA); `pct` (Loading (%)); `sp` (Spare capacity, kVA)

### `fault-types`: Fault Current by Fault Type

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `V` | System voltage (L-L) | µV, mV, V, kV, MV, GV | 415 V |
| `Z1` | Positive-sequence impedance to the fault | mΩ, Ω, kΩ, MΩ, GΩ | 20 mΩ |
| `r0` | Zero-sequence ÷ positive-sequence impedance |  | 1 |

Outputs: `I3` (Three-phase fault, kA); `Ill` (Line-to-line fault, kA); `Ie` (Line-to-earth fault, kA)

### `per-unit-convert`: Per-Unit Base Conversion

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `z` | Impedance on old base (pu) |  | 0.08 |
| `S1` | Old MVA base | VA, kVA, MVA | 10 MVA |
| `V1` | Old voltage base | µV, mV, V, kV, MV, GV | 11 kV |
| `S2` | New MVA base | VA, kVA, MVA | 100 MVA |
| `V2` | New voltage base | µV, mV, V, kV, MV, GV | 11 kV |

Outputs: `zn` (Impedance on new base (pu))

### `battery-series-parallel`: Battery Series-Parallel Bank

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Vc` | Battery or cell voltage | µV, mV, V, kV, MV, GV | 12 V |
| `Ahc` | Battery capacity | mAh, Ah, kAh, C, mC, kC | 100 Ah |
| `ns` | Batteries in series per string |  | 4 |
| `np` | Parallel strings |  | 2 |

Outputs: `Vb` (Bank voltage, V); `Ahb` (Bank capacity, Ah); `E` (Bank energy, kWh)

### `pv-array-size`: Solar PV Array Size from Energy Need

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `E` | Daily energy needed | µJ, mJ, J, kJ, MJ, kcal, BTU, Wh, kWh, MWh, eV, keV, MeV, cal, GeV | 30 kWh |
| `psh` | Peak sun hours per day |  | 5 |
| `pr` | Performance ratio |  | 0.75 |
| `Pm` | Module rating | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 550 W |

Outputs: `Pa` (Array rating, kW); `nm` (Modules needed)

### `led-retrofit-payback`: LED Retrofit Savings and Payback

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `n` | Number of fittings |  | 100 |
| `Wo` | Existing fitting power | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 150 W |
| `Wn` | LED fitting power | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 60 W |
| `h` | Operating hours per year |  | 4000 |
| `tar` | Energy tariff (per kWh) |  | 8 |
| `cost` | Cost per new fitting |  | 2500 |

Outputs: `Es` (Energy saved per year, kWh); `cs` (Cost saved per year); `pb` (Simple payback (years))

### `resonance-lc`: LC Resonance and Q Factor

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `L` | Inductance | µH, mH, H | 10 mH |
| `C` | Capacitance | pF, nF, µF, F | 10 µF |
| `R` | Series resistance | mΩ, Ω, kΩ, MΩ, GΩ | 5 Ω |

Outputs: `f0` (Resonant frequency, Hz); `X0` (Reactance at resonance, Ω); `Q` (Quality factor Q); `bw` (Bandwidth, Hz)

### `lc-energy`: Energy in a Capacitor and an Inductor

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `C` | Capacitance | pF, nF, µF, F | 100 µF |
| `V` | Capacitor voltage | µV, mV, V, kV, MV, GV | 400 V |
| `L` | Inductance | µH, mH, H | 50 mH |
| `I` | Inductor current | µA, mA, A, kA, MA | 10 A |

Outputs: `Ec` (Capacitor energy, J); `El` (Inductor energy, J)

### `delta-wye`: Delta to Star Resistance Conversion

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Rab` | Rab | mΩ, Ω, kΩ, MΩ, GΩ | 30 Ω |
| `Rbc` | Rbc | mΩ, Ω, kΩ, MΩ, GΩ | 60 Ω |
| `Rca` | Rca | mΩ, Ω, kΩ, MΩ, GΩ | 90 Ω |

Outputs: `Ra` (Ra (at node A), Ω); `Rb` (Rb (at node B), Ω); `Rc` (Rc (at node C), Ω)

### `line-phase`: Line and Phase Quantities (Star / Delta)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `VL` | Line voltage (L-L) | µV, mV, V, kV, MV, GV | 400 V |
| `IL` | Line current | µA, mA, A, kA, MA | 10 A |
| `con` | Connection | 1 = Star (wye); 2 = Delta | 1 |

Outputs: `Vp` (Phase voltage, V); `Ip` (Phase current, A); `Zp` (Impedance per phase, Ω); `S` (Total apparent power, kVA)

### `generator-fuel`: Generator Fuel Consumption and Autonomy

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `P` | Electrical load | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 400 kW |
| `sfc` | Specific fuel consumption (g/kWh) |  | 230 |
| `d` | Fuel density (kg/L) |  | 0.84 |
| `Tk` | Tank volume | L, m³, gal, mL, cm³, in³, ft³, qt, galUK | 500 L |

Outputs: `lph` (Fuel consumption (L/h)); `rt` (Runtime on one tank, h)

### `maximum-demand`: Maximum Demand

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Pc` | Connected load | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 500 kW |
| `df` | Demand factor |  | 0.7 |
| `dv` | Diversity factor |  | 1.2 |
| `pf` | Power factor |  | 0.9 |

Outputs: `md` (Maximum demand, kW); `S` (Maximum demand, kVA)

### `ngr-sizing`: Neutral Earthing Resistor

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `V` | System voltage (L-L) | µV, mV, V, kV, MV, GV | 11 kV |
| `If` | Earth-fault current to allow | µA, mA, A, kA, MA | 400 A |
| `t` | Fault duration | µs, ms, s, min, h | 10 s |

Outputs: `R` (Resistance, Ω); `P` (Power during fault, kW); `E` (Energy during fault, kWh)

### `earth-rods-parallel`: Earth Rods in Parallel

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `R1` | Single rod resistance | mΩ, Ω, kΩ, MΩ, GΩ | 30 Ω |
| `n` | Number of rods |  | 4 |
| `u` | Utilisation factor |  | 0.85 |

Outputs: `Rt` (Combined resistance, Ω)

### `earth-grid-resistance`: Earth Grid Resistance

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `rho` | Soil resistivity | Ω·m, Ω·cm | 100 Ω·m |
| `A` | Area covered by the grid | mm², cm², m², ha, km², in², ft², yd², acre, mi², cmil | 900 m² |
| `LT` | Total buried conductor length | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 600 m |

Outputs: `Rg` (Grid resistance, Ω)

### `parallel-cable-sets`: Parallel Cable Sets

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Ib` | Design current | µA, mA, A, kA, MA | 1200 A |
| `Iz` | Rated current of one cable | µA, mA, A, kA, MA | 400 A |
| `kg` | Grouping and other derating factor |  | 0.8 |

Outputs: `n` (Cables per phase); `Iu` (Derated current of one cable, A)

### `conduit-fill`: Conduit Fill

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `D` | Conduit inside diameter | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 50 mm |
| `d` | Cable outside diameter | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 12 mm |
| `n` | Number of cables |  | 6 |

Outputs: `fill` (Fill (%)); `lim` (Common fill limit (%)); `nmax` (Most cables at the limit)

### `hp-kw-converter`: HP to kW and kW to HP

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `P` | Power | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 100 HP |

Outputs: `kw` (Kilowatts, kW); `hp` (Mechanical horsepower, HP); `ps` (Metric horsepower, PS)

### `power-converter`: Power Unit Converter (W, kW, MW, HP, PS)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `P` | Power | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 1 kW |

Outputs: `w` (Watts, W); `kw` (Kilowatts, kW); `mw` (Megawatts, MW); `hp` (Mechanical horsepower, HP)

### `energy-converter`: Energy Unit Converter

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `E` | Energy | µJ, mJ, J, kJ, MJ, kcal, BTU, Wh, kWh, MWh, eV, keV, MeV, cal, GeV | 1 kWh |

Outputs: `MJ` (Megajoules, MJ); `BTU` (BTU, BTU); `kcal` (Kilocalories, kcal)

### `decibel`: Decibel Converter

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `rv` | Voltage ratio (Vout / Vin) |  | 10 |
| `rp` | Power ratio (Pout / Pin) |  | 100 |

Outputs: `dv` (Voltage gain (dB)); `dp` (Power gain (dB))

### `op-amp-gain`: Op-Amp Gain

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Rf` | Feedback resistor | mΩ, Ω, kΩ, MΩ, GΩ | 100 kΩ |
| `Rin` | Input resistor | mΩ, Ω, kΩ, MΩ, GΩ | 10 kΩ |
| `Vin` | Input voltage | µV, mV, V, kV, MV, GV | 0.5 V |
| `cfg` | Configuration | 1 = Inverting; 2 = Non-inverting | 1 |

Outputs: `A` (Voltage gain); `Vo` (Output voltage, V)

### `water-heater-kw`: Heater Power for Heating a Liquid

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `V` | Liquid volume | L, m³, gal, mL, cm³, in³, ft³, qt, galUK | 1000 L |
| `dT` | Temperature rise (K) |  | 40 |
| `t` | Heating time | µs, ms, s, min, h | 2 h |
| `eff` | Heater and tank efficiency |  | 0.9 |
| `c` | Specific heat (kJ/kg·K) |  | 4.186 |

Outputs: `E` (Heat energy needed, kWh); `P` (Heater rating, kW)

### `ir-temp-correction`: Insulation Resistance Temperature Correction

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Rm` | Measured insulation resistance | mΩ, Ω, kΩ, MΩ, GΩ | 1000 MΩ |
| `T` | Winding or cable temperature (°C) |  | 20 |

Outputs: `R40` (Corrected to 40 °C, MΩ); `kt` (Correction factor)

### `insulation-pi-dar`: Polarisation Index and Dielectric Absorption Ratio

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `R30` | Reading at 30 s | mΩ, Ω, kΩ, MΩ, GΩ | 1000 MΩ |
| `R60` | Reading at 1 min | mΩ, Ω, kΩ, MΩ, GΩ | 1500 MΩ |
| `R600` | Reading at 10 min | mΩ, Ω, kΩ, MΩ, GΩ | 4500 MΩ |

Outputs: `dar` (DAR (60 s ÷ 30 s)); `pi` (PI (10 min ÷ 1 min))

### `agl-ccr-loading`: AGL Series Circuit Load and CCR Size

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `n` | Fittings on the circuit |  | 60 |
| `Pl` | Lamp power per fitting | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 45 W |
| `et` | Isolating transformer efficiency |  | 0.85 |
| `I` | Circuit current | µA, mA, A, kA, MA | 6.6 A |
| `L` | Series cable loop length | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 4000 m |
| `R` | Series cable resistance | Ω/km, mΩ/m, Ω/m | 3.08 Ω/km |
| `ld` | Maximum CCR loading |  | 0.8 |

Outputs: `Pt` (Total circuit load, kW); `Vo` (CCR output voltage, V); `Pc` (Cable loss, W); `ccr` (Smallest standard CCR, kW); `pct` (Loading of that CCR (%))

### `agl-max-fittings`: AGL Maximum Fittings on a CCR

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Pr` | CCR rating | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 10 kW |
| `Pl` | Lamp power per fitting | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 45 W |
| `et` | Isolating transformer efficiency |  | 0.85 |
| `I` | Circuit current | µA, mA, A, kA, MA | 6.6 A |
| `L` | Series cable loop length | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 4000 m |
| `R` | Series cable resistance | Ω/km, mΩ/m, Ω/m | 3.08 Ω/km |
| `ld` | Maximum CCR loading |  | 0.8 |

Outputs: `nmax` (Maximum fittings); `Pt` (Circuit load at that number, kW); `Pc` (Cable loss, W); `pct` (CCR loading at that number (%)); `Vo` (CCR output voltage, V)

### `agl-isolating-transformer`: AGL Isolating Transformer Current and Loading

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Ip` | Circuit (primary) current | µA, mA, A, kA, MA | 6.6 A |
| `Ipr` | Rated primary current | µA, mA, A, kA, MA | 6.6 A |
| `Isr` | Rated secondary current | µA, mA, A, kA, MA | 6.6 A |
| `Pl` | Lamp power at that secondary current | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 45 W |
| `Pt` | Transformer rating | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 100 W |
| `et` | Transformer efficiency |  | 0.85 |

Outputs: `Is` (Secondary lamp current, A); `Vs` (Lamp voltage, V); `Pin` (Input power from the series circuit, W); `Vp` (Primary voltage drop, V); `pct` (Transformer loading (%))

### `agl-ccr-input-energy`: AGL CCR Input Power and Annual Energy

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Po` | CCR output load | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 3.713 kW |
| `ec` | CCR efficiency |  | 0.9 |
| `pf` | CCR input power factor |  | 0.9 |
| `h` | Hours of operation per year |  | 4380 |
| `tar` | Energy tariff per kWh |  | 8 |

Outputs: `Pin` (CCR input power, kW); `S` (CCR input apparent power, kVA); `Q` (CCR input reactive power, kVAR); `E` (Annual energy, kWh); `cost` (Annual running cost)

### `agl-brightness-steps`: AGL Brightness Step Current and Circuit Load

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `ct` | Circuit type | 1 = 5-step (2.8, 3.4, 4.1, 5.2, 6.6 A); 2 = 3-step (4.8, 5.5, 6.6 A) | 1 |
| `b` | Brightness step | 1 = Step 1 (lowest); 2 = Step 2; 3 = Step 3; 4 = Step 4; 5 = Step 5 (highest) | 3 |
| `n` | Fittings on the circuit |  | 60 |
| `Pl` | Lamp power per fitting at 6.6 A | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 45 W |
| `et` | Isolating transformer efficiency |  | 0.85 |
| `L` | Series cable loop length | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 4000 m |
| `R` | Series cable resistance | Ω/km, mΩ/m, Ω/m | 3.08 Ω/km |
| `k` | Lamp power exponent |  | 2 |

Outputs: `I` (Circuit current at this step, A); `pI` (Current as % of 6.6 A); `Pt` (Total circuit load at this step, kW); `Vo` (CCR output voltage at this step, V); `Pc` (Cable loss at this step, W); `pL` (Load as % of the full-current load)

### `agl-lamp-life-curve`: AGL Lamp Life at a Different Circuit Current

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `I1` | First data point: current | µA, mA, A, kA, MA | 6.6 A |
| `T1` | First data point: life | µs, ms, s, min, h | 1000 h |
| `I2` | Second data point: current | µA, mA, A, kA, MA | 6.1 A |
| `T2` | Second data point: life | µs, ms, s, min, h | 2000 h |
| `I3` | Current to evaluate | µA, mA, A, kA, MA | 5.2 A |
| `n` | Fittings on the circuit |  | 60 |
| `H` | Hours of operation per year |  | 4380 |

Outputs: `m` (Life exponent m); `T3` (Life at the evaluated current, h); `rt` (Life relative to the first point); `rep` (Lamp replacements per year)

### `agl-cable-loop-loss`: AGL Series Cable Loop Resistance and Loss

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `I` | Circuit current | µA, mA, A, kA, MA | 6.6 A |
| `L` | Series cable loop length | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 4000 m |
| `A` | Cable cross-section | mm², cm², m², ha, km², in², ft², yd², acre, mi², cmil | 6 mm² |
| `mat` | Conductor material | 1 = Copper; 2 = Aluminium | 1 |
| `T` | Conductor temperature (°C) |  | 20 |

Outputs: `Rl` (Loop resistance, Ω); `Rk` (Per unit length, Ω/km); `Vd` (Voltage drop in the cable, V); `Pc` (Cable loss, W)

### `agl-cable-size-loss`: AGL Series Cable Size for a Loss Limit

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `I` | Circuit current | µA, mA, A, kA, MA | 6.6 A |
| `L` | Series cable loop length | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 4000 m |
| `P` | Lamp load on the circuit | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 3.176 kW |
| `lim` | Allowed cable loss (% of lamp load) |  | 15 |
| `mat` | Conductor material | 1 = Copper; 2 = Aluminium | 1 |
| `T` | Conductor temperature (°C) |  | 20 |

Outputs: `Amin` (Minimum cross-section, mm²); `Astd` (Standard size, mm²); `Pc` (Cable loss at that size, W); `pct` (Loss as % of lamp load)

### `agl-lamp-failure-load`: AGL Circuit Load with Failed Lamps

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `n` | Fittings on the circuit |  | 60 |
| `f` | Failed lamps (open circuit) |  | 3 |
| `Pl` | Lamp power per fitting | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 45 W |
| `et` | Isolating transformer efficiency |  | 0.85 |
| `Pm` | Transformer input power with the secondary open | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 10 W |
| `I` | Circuit current | µA, mA, A, kA, MA | 6.6 A |
| `L` | Series cable loop length | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 4000 m |
| `R` | Series cable resistance | Ω/km, mΩ/m, Ω/m | 3.08 Ω/km |

Outputs: `P0` (Circuit load, all lamps working, kW); `Pf` (Circuit load with failed lamps, kW); `dP` (Change in load, W); `pd` (Change as % of the working load); `Vf` (CCR output voltage with failed lamps, V)

### `fault-loop-impedance`: Earth Fault Loop Impedance

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `U0` | Nominal voltage to earth | µV, mV, V, kV, MV, GV | 230 V |
| `Ze` | External loop impedance Ze | mΩ, Ω, kΩ, MΩ, GΩ | 0.35 Ω |
| `Zi` | Circuit R1 + R2 | mΩ, Ω, kΩ, MΩ, GΩ | 0.55 Ω |
| `Ia` | Protective device operating current | µA, mA, A, kA, MA | 160 A |

Outputs: `Zs` (Loop impedance Zs, Ω); `If` (Earth fault current, A); `Zmax` (Maximum Zs for this device, Ω); `ratio` (Margin (If / Ia))

### `pue`: Data Centre PUE

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Pt` | Total facility power | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 1500 kW |
| `Pit` | IT equipment power | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 1000 kW |

Outputs: `pue` (PUE); `dcie` (DCiE (IT share of total, %)); `oh` (Overhead (cooling, losses, lighting), kW)

### `rack-cooling`: Rack Heat Load and Airflow

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `P` | IT power in the rack | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 10 kW |
| `dT` | Air temperature rise across the rack (K) |  | 12 |

Outputs: `btu` (Heat load (BTU/h)); `tons` (Cooling (US refrigeration tons)); `air` (Airflow required, m³/h)

### `wind-power`: Wind Turbine Power

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `D` | Rotor diameter | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 90 m |
| `v` | Wind speed | m/s, km/h, mph, kn | 10 m/s |
| `cp` | Power coefficient Cp |  | 0.4 |
| `rho` | Air density (kg/m³) |  | 1.225 |
| `eff` | Drive-train and generator efficiency |  | 0.95 |

Outputs: `A` (Swept area, m²); `Pw` (Power in the wind, kW); `Pe` (Electrical output, kW)

### `zener-regulator`: Zener Shunt Regulator

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Vin` | Input voltage (minimum) | µV, mV, V, kV, MV, GV | 12 V |
| `Vz` | Zener voltage | µV, mV, V, kV, MV, GV | 5.1 V |
| `IL` | Maximum load current | µA, mA, A, kA, MA | 20 mA |
| `Iz` | Minimum zener current | µA, mA, A, kA, MA | 5 mA |

Outputs: `Rs` (Series resistor, Ω); `Rstd` (Next lower E24 value, Ω); `Pr` (Resistor power, W); `Pz` (Zener power with the load removed, W)

### `bjt-base-resistor`: Transistor Base Resistor

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Vin` | Drive voltage | µV, mV, V, kV, MV, GV | 5 V |
| `Vbe` | Base-emitter voltage | µV, mV, V, kV, MV, GV | 0.7 V |
| `Ic` | Collector current | µA, mA, A, kA, MA | 100 mA |
| `hfe` | Minimum current gain hFE |  | 100 |
| `k` | Overdrive factor |  | 2 |

Outputs: `Ib` (Base current, mA); `Rb` (Base resistor, Ω); `Rstd` (Next lower E24 value, Ω)

### `timer-555`: 555 Timer Astable

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `R1` | R1 (VCC to discharge) | mΩ, Ω, kΩ, MΩ, GΩ | 10 kΩ |
| `R2` | R2 (discharge to threshold) | mΩ, Ω, kΩ, MΩ, GΩ | 47 kΩ |
| `C` | Timing capacitor C | pF, nF, µF, F | 10 µF |

Outputs: `f` (Frequency, Hz); `T` (Period, s); `Th` (Output high time, s); `Tl` (Output low time, s); `duty` (Duty cycle (%))

### `heatsink-thermal`: Heatsink Thermal Resistance

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `P` | Power dissipated | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 15 W |
| `Ta` | Ambient temperature (°C) |  | 40 |
| `Tj` | Maximum junction temperature (°C) |  | 125 |
| `tjc` | Junction to case θjc (°C/W) |  | 1.5 |
| `tcs` | Case to sink θcs (°C/W) |  | 0.5 |

Outputs: `tja` (Total allowed θja); `tsa` (Heatsink to ambient θsa, at most (°C/W))

### `rc-filter-cutoff`: RC Filter Cutoff

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `R` | Resistance | mΩ, Ω, kΩ, MΩ, GΩ | 1 kΩ |
| `C` | Capacitance | pF, nF, µF, F | 100 nF |
| `f` | Frequency of interest | Hz, kHz, MHz, GHz, THz, rad/s | 1000 Hz |
| `type` | Filter type | 1 = Low-pass; 2 = High-pass | 1 |

Outputs: `fc` (Cutoff frequency (−3 dB), Hz); `g` (Gain at the frequency of interest (dB)); `ph` (Phase shift (°))

### `star-delta-starting`: Star-Delta Starting

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `In` | Motor rated current | µA, mA, A, kA, MA | 100 A |
| `k` | Locked-rotor current ratio (ILR / In) |  | 6 |
| `Tn` | Motor rated torque | N·m, kN·m, mN·m, kgf·m, lbf·ft, lbf·in, ozf·in | 500 N·m |
| `kt` | Locked-rotor torque ratio (TLR / Tn) |  | 1.5 |
| `Tl` | Load torque at start | N·m, kN·m, mN·m, kgf·m, lbf·ft, lbf·in, ozf·in | 150 N·m |

Outputs: `Id` (DOL starting current, A); `Iy` (Star starting line current, A); `Td` (DOL starting torque, N·m); `Ty` (Star starting torque, N·m)

### `battery-charge-time`: Battery Charge Time

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Cap` | Battery capacity | mAh, Ah, kAh, C, mC, kC | 100 Ah |
| `fr` | Fraction of capacity to restore |  | 0.5 |
| `Ic` | Charger current | µA, mA, A, kA, MA | 20 A |
| `eta` | Charge efficiency |  | 0.85 |

Outputs: `t` (Charge time, h); `Qc` (Charge delivered by the charger, Ah)

### `fan-pump-affinity`: Fan and Pump Affinity Laws

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `N1` | Original speed | rpm | 1450 rpm |
| `N2` | New speed | rpm | 1160 rpm |
| `P1` | Power at original speed | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 22 kW |

Outputs: `Q` (Flow (% of original)); `H` (Head or pressure (% of original)); `P2` (Power at new speed, kW); `sav` (Power saved (%))

### `rtd-pt100`: RTD Resistance to Temperature

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `R` | Measured resistance | mΩ, Ω, kΩ, MΩ, GΩ | 138.51 Ω |
| `R0` | Resistance at 0 °C | mΩ, Ω, kΩ, MΩ, GΩ | 100 Ω |

Outputs: `T` (Temperature (°C)); `S` (Sensitivity at this point (Ω/°C))

### `neutral-current-unbalance`: Neutral Current from Unbalanced Load

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Ia` | Phase A current | µA, mA, A, kA, MA | 100 A |
| `Ib` | Phase B current | µA, mA, A, kA, MA | 80 A |
| `Ic` | Phase C current | µA, mA, A, kA, MA | 60 A |

Outputs: `In` (Neutral current, A); `unb` (Current unbalance (%))

### `voltage-unbalance`: Three-Phase Voltage Unbalance

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Vab` | Line voltage Vab | µV, mV, V, kV, MV, GV | 400 V |
| `Vbc` | Line voltage Vbc | µV, mV, V, kV, MV, GV | 410 V |
| `Vca` | Line voltage Vca | µV, mV, V, kV, MV, GV | 395 V |

Outputs: `avg` (Average line voltage, V); `vur` (Voltage unbalance (%))

### `ac-voltage-drop`: AC Voltage Drop from Conductor Size

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `I` | Load current | µA, mA, A, kA, MA | 50 A |
| `L` | One-way length | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 50 m |
| `mat` | Conductor material | 1 = Copper; 2 = Aluminium; 3 = Silver; 4 = Gold; 5 = Nickel; 6 = Nichrome; 7 = Custom (enter resistivity below) | 1 |
| `sz` | Conductor size given as | 0 = Cross-section (area); 1 = AWG number; 2 = Wire diameter | 0 |
| `A` | Conductor cross-section (used when size is given as area) | mm², cm², m², ha, km², in², ft², yd², acre, mi², cmil | 10 mm² |
| `awg` | AWG number (used when size is given as AWG; −1 = 00, −2 = 000, −3 = 0000) |  | 8 |
| `D` | Wire diameter (used when size is given as diameter) | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 3.264 mm |
| `rhoC` | Custom resistivity at 20 °C (used when material is Custom) | Ω·m, Ω·cm | 1.7241e-8 Ω·m |
| `aC` | Custom temperature coefficient (per °C) |  | 0 |
| `T` | Conductor temperature (°C) |  | 70 |
| `X` | Cable reactance | Ω/km, mΩ/m, Ω/m | 0.08 Ω/km |
| `pf` | Power factor |  | 0.9 |
| `V` | System voltage (line-to-line for three-phase) | µV, mV, V, kV, MV, GV | 400 V |
| `phase` | Circuit | 1 = Single-phase (out and return); 3 = Three-phase balanced | 3 |
| `lead` | Load power factor | 0 = Lagging (inductive load, the usual case); 1 = Leading (capacitive load) | 0 |
| `n` | Conductors per phase in parallel | 1 = One (single set); 2 = 2 in parallel; 3 = 3 in parallel; 4 = 4 in parallel; 5 = 5 in parallel; 6 = 6 in parallel; 7 = 7 in parallel; 8 = 8 in parallel; 9 = 9 in parallel | 1 |

Outputs: `Vd` (Voltage drop, V); `pct` (Drop as % of system voltage); `R` (Conductor resistance (one way, at temperature), Ω); `Au` (Cross-section used, mm²); `rho` (Resistivity used (at conductor temperature), Ω·m)

### `swg-wire`: SWG to Diameter and Area

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `n` | SWG number (use 0 for 1/0, −1 for 2/0, down to −6 for 7/0) |  | 18 |

Outputs: `d` (Diameter, mm); `din` (Diameter (inches), in); `A` (Cross-section, mm²)

### `lumens-lux-area`: Lumens, Lux and Area (any two)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `phi` | Luminous flux (lm) |  | 3000 |
| `E` | Illuminance (lux) |  |  |
| `A` | Area | mm², cm², m², ha, km², in², ft², yd², acre, mi², cmil | 20 m² |
| `u` | Fraction of lumens reaching the surface |  | 1 |

Outputs: `phi` (Luminous flux (lm)); `E` (Illuminance (lux)); `A` (Area, m²); `fc` (Illuminance (footcandles))

### `candela-lux-distance`: Candela, Lux and Distance (any two)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `I` | Luminous intensity (cd) |  | 1000 |
| `E` | Illuminance (lux) |  |  |
| `d` | Distance from the source | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 5 m |
| `th` | Angle of incidence (°) |  | 0 |

Outputs: `I` (Luminous intensity (cd)); `E` (Illuminance (lux)); `d` (Distance, m); `fc` (Illuminance (footcandles))

### `candela-lumens-beam`: Candela and Lumens from Beam Angle

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `I` | Luminous intensity (cd) |  | 1000 |
| `phi` | Luminous flux (lm) |  |  |
| `th` | Full beam angle (°) |  | 60 |

Outputs: `I` (Luminous intensity (cd)); `phi` (Luminous flux (lm)); `om` (Solid angle (sr))

### `lumens-watts`: Lumens and Watts (luminous efficacy)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `phi` | Luminous flux (lm) |  |  |
| `P` | Electrical power | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 10 W |
| `eta` | Luminous efficacy (lm/W) |  | 100 |

Outputs: `phi` (Luminous flux (lm)); `P` (Electrical power, W); `eta` (Luminous efficacy (lm/W))

### `lux-to-watts`: Lighting Power for a Target Lux

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `E` | Target illuminance (lux) |  | 300 |
| `A` | Area | mm², cm², m², ha, km², in², ft², yd², acre, mi², cmil | 50 m² |
| `eta` | Luminous efficacy (lm/W) |  | 100 |
| `uf` | Utilisation factor |  | 0.6 |
| `mf` | Maintenance factor |  | 0.8 |

Outputs: `phi` (Lamp lumens needed); `P` (Electrical power, W); `pd` (Power density (W/m²))

### `millicandela-lumens-beam`: Millicandela and Lumens from Beam Angle

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `I` | Luminous intensity (mcd) |  | 5000 |
| `phi` | Luminous flux (lm) |  |  |
| `th` | Full beam angle (°) |  | 30 |

Outputs: `I` (Luminous intensity (mcd)); `phi` (Luminous flux (lm)); `om` (Solid angle (sr))

### `watts-to-lux`: Illuminance from Lamp Power (watts to lux)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `P` | Electrical power | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 100 W |
| `eta` | Luminous efficacy (lm/W) |  | 100 |
| `A` | Area | mm², cm², m², ha, km², in², ft², yd², acre, mi², cmil | 20 m² |
| `uf` | Utilisation factor |  | 0.6 |
| `mf` | Maintenance factor |  | 0.8 |

Outputs: `E` (Average illuminance (lux)); `phi` (Lamp lumens (lm)); `pd` (Power density (W/m²))

### `agl-light-intensity-distance`: AGL Light Intensity at Distance (Allard's Law)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `I` | Intensity toward the observer (cd) |  | 10000 |
| `d` | Distance to the light | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 300 m |
| `mor` | Meteorological optical range (MOR) | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 800 m |

Outputs: `E` (Illuminance at the eye (lux)); `Ec` (Illuminance in clear air (lux)); `T` (Atmospheric transmissivity over the path (%)); `sig` (Extinction coefficient (per km))

### `complex-number`: Complex Numbers (Rectangular and Polar)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `a` | z₁ real part (a) |  | 3 |
| `b` | z₁ imaginary part (b) |  | 4 |
| `op` | Operation | 3 = z₁ × z₂ (multiply); 4 = z₁ ÷ z₂ (divide); 1 = z₁ + z₂ (add); 2 = z₁ − z₂ (subtract); 0 = Convert z₁ only (rectangular to polar and back) | 3 |
| `c` | z₂ real part (c) |  | 1 |
| `d` | z₂ imaginary part (d) |  | -2 |

Outputs: `mag` (Result magnitude |z|); `ang` (Result angle (degrees)); `re` (Result real part); `im` (Result imaginary part (coefficient of j)); `angr` (Result angle (radians)); `m1` (z₁ magnitude |z₁|); `a1` (z₁ angle (degrees))

### `phasor-sum`: Phasor Sum and Difference (Polar Inputs)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `m1` | Phasor 1 magnitude |  | 10 |
| `t1` | Phasor 1 angle (degrees) |  | 30 |
| `s2` | Phasor 2 is | 1 = added (+); -1 = subtracted (−) | 1 |
| `m2` | Phasor 2 magnitude |  | 5 |
| `t2` | Phasor 2 angle (degrees) |  | -45 |
| `s3` | Phasor 3 is | 1 = added (+); -1 = subtracted (−) | 1 |
| `m3` | Phasor 3 magnitude |  | 0 |
| `t3` | Phasor 3 angle (degrees) |  | 0 |

Outputs: `mag` (Resultant magnitude); `ang` (Resultant angle (degrees)); `re` (Resultant real part); `im` (Resultant imaginary part (coefficient of j)); `angr` (Resultant angle (radians)); `arith` (Sum of the magnitudes (all in phase))

### `percentage-error`: Percentage Error

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `m` | Measured value |  | 98.5 |
| `t` | True (reference) value |  | 100 |

Outputs: `pe` (Percentage error (signed, %)); `ape` (Absolute percentage error (%)); `err` (Error (measured − true)); `aerr` (Absolute error); `rel` (Relative error (fraction))

### `mean-median-mode`: Mean, Median and Mode

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `x1` | Reading 1 |  | 230.1 |
| `x2` | Reading 2 |  | 229.8 |
| `x3` | Reading 3 |  | 230.4 |
| `x4` | Reading 4 |  | 229.8 |
| `x5` | Reading 5 |  | 231 |
| `x6` | Reading 6 |  | 230.2 |
| `x7` | Reading 7 |  |  |
| `x8` | Reading 8 |  |  |
| `x9` | Reading 9 |  |  |
| `x10` | Reading 10 |  |  |
| `x11` | Reading 11 |  |  |
| `x12` | Reading 12 |  |  |

Outputs: `mean` (Mean (average)); `median` (Median); `mode` (Mode (smallest, if several)); `n` (Number of readings); `sum` (Sum); `min` (Smallest reading); `max` (Largest reading); `range` (Range (largest − smallest))

### `standard-deviation`: Standard Deviation and Variance

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `x1` | Reading 1 |  | 230.1 |
| `x2` | Reading 2 |  | 229.8 |
| `x3` | Reading 3 |  | 230.4 |
| `x4` | Reading 4 |  | 229.8 |
| `x5` | Reading 5 |  | 231 |
| `x6` | Reading 6 |  | 230.2 |
| `x7` | Reading 7 |  |  |
| `x8` | Reading 8 |  |  |
| `x9` | Reading 9 |  |  |
| `x10` | Reading 10 |  |  |
| `x11` | Reading 11 |  |  |
| `x12` | Reading 12 |  |  |

Outputs: `ssd` (Sample standard deviation (s, n − 1)); `psd` (Population standard deviation (σ, n)); `svar` (Sample variance (s²)); `pvar` (Population variance (σ²)); `mean` (Mean); `n` (Number of readings); `sem` (Standard error of the mean (s / √n)); `cv` (Coefficient of variation (s / |mean|, %))

### `quadratic-solver`: Quadratic Equation Solver

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `a` | Coefficient a (of x²) |  | 1 |
| `b` | Coefficient b (of x) |  | -5 |
| `c` | Constant c |  | 6 |

Outputs: `x1` (Root x₁, real part (with +√D)); `x1i` (Root x₁, imaginary part); `x2` (Root x₂, real part (with −√D)); `x2i` (Root x₂, imaginary part); `disc` (Discriminant D = b² − 4ac); `xv` (Vertex x (−b / 2a)); `yv` (Vertex y (value at the vertex))

### `logarithm`: Logarithm Calculator

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `x` | Number x |  | 1000 |
| `b` | Base b |  | 10 |

Outputs: `lb` (log base b of x); `l10` (Common logarithm log₁₀ x); `ln` (Natural logarithm ln x); `l2` (Binary logarithm log₂ x)

### `powers-roots`: Exponent and Root Calculator

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `x` | Number x |  | 8 |
| `n` | Exponent n |  | 2 |
| `k` | Root degree k |  | 3 |

Outputs: `pow` (x to the power n (xⁿ)); `root` (k-th root of x); `sq` (x squared); `cube` (x cubed); `rec` (Reciprocal 1 / x)

### `percentage-calculator`: Percentage Calculator

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `A` | Number A |  | 15 |
| `B` | Number B |  | 200 |

Outputs: `pof` (A% of B); `whatpct` (A as a percentage of B (A / B × 100)); `chg` (Percentage change from A to B); `inc` (B increased by A%); `dec` (B decreased by A%)

### `ratio-calculator`: Ratio Calculator

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `a` | A |  | 12 |
| `b` | B |  | 18 |
| `c` | C (optional) |  | 5 |

Outputs: `sa` (Simplified ratio, first part); `sb` (Simplified ratio, second part); `rab` (A / B (ratio as a decimal)); `pa` (A as a share of A + B (%)); `pb` (B as a share of A + B (%)); `x` (X in A : B = C : X (X = B × C / A))

### `rounding-sig-figs`: Rounding and Significant Figures

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `x` | Number |  | 1234.5678 |
| `d` | Decimal places |  | 2 |
| `s` | Significant figures |  | 3 |

Outputs: `rd` (Rounded to the nearest (decimal places)); `up` (Rounded up (toward +∞) to those places); `dn` (Rounded down (toward −∞) to those places); `tr` (Truncated (toward zero) to those places); `rs` (Rounded to significant figures)

### `fraction-calculator`: Fraction Calculator

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `n1` | First fraction, numerator |  | 1 |
| `d1` | First fraction, denominator |  | 2 |
| `op` | Operation | 1 = Add (+); 2 = Subtract (−); 3 = Multiply (×); 4 = Divide (÷) | 1 |
| `n2` | Second fraction, numerator |  | 1 |
| `d2` | Second fraction, denominator |  | 3 |

Outputs: `rn` (Result, numerator (simplified)); `rd` (Result, denominator (simplified)); `mw` (Mixed number, whole part); `mn` (Mixed number, remainder numerator); `dec` (Decimal value); `pct` (As a percentage (%))

### `simultaneous-equations`: Simultaneous Equations Solver

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `n` | Number of unknowns | 2 = 2 equations, x and y; 3 = 3 equations, x, y and z | 2 |
| `a1` | Equation 1: coefficient of x |  | 2 |
| `b1` | Equation 1: coefficient of y |  | 3 |
| `c1` | Equation 1: coefficient of z |  |  |
| `k1` | Equation 1: constant on the right |  | 13 |
| `a2` | Equation 2: coefficient of x |  | 1 |
| `b2` | Equation 2: coefficient of y |  | -1 |
| `c2` | Equation 2: coefficient of z |  |  |
| `k2` | Equation 2: constant on the right |  | -1 |
| `a3` | Equation 3: coefficient of x |  |  |
| `b3` | Equation 3: coefficient of y |  |  |
| `c3` | Equation 3: coefficient of z |  |  |
| `k3` | Equation 3: constant on the right |  |  |

Outputs: `x` (x); `y` (y); `z` (z (3 unknowns only)); `det` (Determinant of the coefficients); `res` (Largest check error (left side minus right side))

### `linear-interpolation`: Linear Interpolation Calculator

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `x1` | First point, x₁ |  | 0 |
| `y1` | First point, y₁ |  | 4 |
| `x2` | Second point, x₂ |  | 100 |
| `y2` | Second point, y₂ |  | 20 |
| `x` | x to look up |  | 25 |
| `yt` | y to look up (optional) |  |  |

Outputs: `y` (y at the chosen x); `m` (Slope m = (y₂ − y₁) / (x₂ − x₁)); `t` (Fraction of the way from x₁ to x₂); `b` (Value of y at x = 0); `xt` (x at the chosen y)

### `matrix-calculator`: Matrix Calculator (2×2 and 3×3)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `n` | Matrix size | 2 = 2 × 2; 3 = 3 × 3 | 2 |
| `m11` | Row 1, column 1 |  | 4 |
| `m12` | Row 1, column 2 |  | 7 |
| `m13` | Row 1, column 3 |  |  |
| `m21` | Row 2, column 1 |  | 2 |
| `m22` | Row 2, column 2 |  | 6 |
| `m23` | Row 2, column 3 |  |  |
| `m31` | Row 3, column 1 |  |  |
| `m32` | Row 3, column 2 |  |  |
| `m33` | Row 3, column 3 |  |  |

Outputs: `det` (Determinant); `tr` (Trace (sum of the diagonal)); `i11` (Inverse, row 1 column 1); `i12` (Inverse, row 1 column 2); `i13` (Inverse, row 1 column 3); `i21` (Inverse, row 2 column 1); `i22` (Inverse, row 2 column 2); `i23` (Inverse, row 2 column 3); `i31` (Inverse, row 3 column 1); `i32` (Inverse, row 3 column 2); `i33` (Inverse, row 3 column 3); `res` (Largest error of A × A⁻¹ against the identity)

### `vector-calculator`: Vector Calculator (3D)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `ax` | Vector A, x component |  | 3 |
| `ay` | Vector A, y component |  | 4 |
| `az` | Vector A, z component |  | 0 |
| `bx` | Vector B, x component |  | 1 |
| `by` | Vector B, y component |  | 2 |
| `bz` | Vector B, z component |  | 2 |

Outputs: `ma` (Length of A, |A|); `mb` (Length of B, |B|); `dot` (Dot product A · B); `ang` (Angle between A and B (degrees)); `cx` (Cross product A × B, x component); `cy` (Cross product A × B, y component); `cz` (Cross product A × B, z component); `mc` (Length of A × B, |A × B|); `proj` (Component of A along B, (A · B) / |B|)

### `linear-regression`: Linear Regression (Line of Best Fit)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `x1` | Point 1: x |  | 0 |
| `y1` | Point 1: y |  | 4 |
| `x2` | Point 2: x |  | 25 |
| `y2` | Point 2: y |  | 8.1 |
| `x3` | Point 3: x |  | 50 |
| `y3` | Point 3: y |  | 11.9 |
| `x4` | Point 4: x |  | 75 |
| `y4` | Point 4: y |  | 16.2 |
| `x5` | Point 5: x |  | 100 |
| `y5` | Point 5: y |  | 19.9 |
| `x6` | Point 6: x |  |  |
| `y6` | Point 6: y |  |  |
| `x7` | Point 7: x |  |  |
| `y7` | Point 7: y |  |  |
| `x8` | Point 8: x |  |  |
| `y8` | Point 8: y |  |  |
| `x9` | Point 9: x |  |  |
| `y9` | Point 9: y |  |  |
| `x10` | Point 10: x |  |  |
| `y10` | Point 10: y |  |  |
| `xp` | x to predict y at (optional) |  |  |

Outputs: `m` (Slope m); `c` (Intercept c (y at x = 0)); `r` (Correlation coefficient r); `r2` (Coefficient of determination r²); `see` (Standard error of the fit (n − 2)); `n` (Number of points); `xbar` (Mean of x); `ybar` (Mean of y); `yp` (y at the chosen x)

### `pythagorean-theorem`: Pythagorean Theorem (Right Triangle) Calculator

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `a` | Side a (a leg) |  | 3 |
| `b` | Side b (the other leg) |  | 4 |
| `c` | Side c (the hypotenuse) |  |  |

Outputs: `a` (Side a); `b` (Side b); `c` (Hypotenuse c); `angA` (Angle A, opposite side a (degrees)); `angB` (Angle B, opposite side b (degrees)); `area` (Area); `perim` (Perimeter)

### `triangle-calculator`: Triangle Calculator (Three Sides)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `a` | Side a |  | 7 |
| `b` | Side b |  | 8 |
| `c` | Side c |  | 9 |

Outputs: `angA` (Angle A, opposite side a (degrees)); `angB` (Angle B, opposite side b (degrees)); `angC` (Angle C, opposite side c (degrees)); `area` (Area (Heron's formula)); `perim` (Perimeter); `inr` (Inscribed circle radius (area / s)); `cir` (Circumscribed circle radius (abc / 4 area))

### `circle-calculator`: Circle Calculator (Radius, Diameter, Circumference, Area)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `k` | The value you know | 1 = Radius; 2 = Diameter; 3 = Circumference; 4 = Area | 1 |
| `v` | Value |  | 5 |

Outputs: `r` (Radius); `d` (Diameter); `circ` (Circumference); `area` (Area)

### `area-calculator`: Area Calculator (Rectangle, Trapezoid, Ellipse, Sector, Ring, Polygon)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `s` | Shape | 1 = Rectangle; 2 = Triangle (base and height); 3 = Trapezoid; 4 = Parallelogram; 5 = Ellipse; 6 = Circular sector; 7 = Ring (annulus); 8 = Regular polygon | 1 |
| `x` | First dimension |  | 6 |
| `y` | Second dimension |  | 4 |
| `z` | Third dimension |  |  |

Outputs: `area` (Area); `perim` (Perimeter (shown where the dimensions fix it))

### `volume-surface-area`: Volume and Surface Area Calculator (Box, Cylinder, Sphere, Cone, Pipe)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `s` | Solid | 1 = Box (cuboid); 2 = Cylinder; 3 = Sphere; 4 = Cone; 5 = Hollow cylinder (pipe) | 2 |
| `x` | First dimension |  | 2 |
| `y` | Second dimension |  | 5 |
| `z` | Third dimension |  |  |

Outputs: `vol` (Volume); `sa` (Total surface area); `lat` (Curved or side surface area (without the ends))

### `slope-calculator`: Slope Calculator (Gradient, Grade and Angle from Two Points)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `x1` | Point 1, x |  | 0 |
| `y1` | Point 1, y |  | 0 |
| `x2` | Point 2, x |  | 20 |
| `y2` | Point 2, y |  | 1 |

Outputs: `m` (Slope m (rise / run)); `grade` (Grade (percent)); `ang` (Angle from the horizontal (degrees)); `ratio` (Run per unit rise (the N in 1 in N)); `rise` (Rise (y2 − y1)); `run` (Run (x2 − x1)); `len` (Length along the line); `b` (y-intercept b (y at x = 0))

### `distance-calculator`: Distance Calculator (Between Two Points, 2D or 3D)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `x1` | Point 1, x |  | 0 |
| `y1` | Point 1, y |  | 0 |
| `z1` | Point 1, z (optional) |  |  |
| `x2` | Point 2, x |  | 3 |
| `y2` | Point 2, y |  | 4 |
| `z2` | Point 2, z (optional) |  |  |

Outputs: `dist` (Distance between the points); `horiz` (Horizontal distance (x and y only)); `dx` (Difference in x); `dy` (Difference in y); `dz` (Difference in z); `mx` (Midpoint x); `my` (Midpoint y); `mz` (Midpoint z); `elev` (Angle of the line above the horizontal (degrees))

### `probability-calculator`: Probability Calculator (Two Events, A and B, and Repeated Trials)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `pa` | Probability of event A |  | 0.3 |
| `pb` | Probability of event B |  | 0.5 |
| `rel` | How A and B are related | 1 = Independent (one does not affect the other); 2 = Mutually exclusive (they cannot both happen); 3 = Overlapping, with P(A and B) known | 1 |
| `pab` | Probability of A and B together (overlapping events only) |  |  |
| `n` | Repeated independent trials of A |  | 5 |

Outputs: `pand` (P(A and B), both happen); `por` (P(A or B), at least one happens); `pnone` (P(neither A nor B)); `paonly` (P(A but not B)); `pbonly` (P(B but not A)); `pnota` (P(not A)); `pnotb` (P(not B)); `pagb` (P(A given B)); `pbga` (P(B given A)); `pall` (P(A every time in n trials)); `pany` (P(A at least once in n trials))

### `permutations-combinations`: Permutations and Combinations Calculator (nPr, nCr)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `n` | Number of items to choose from (n) |  | 10 |
| `r` | Number chosen (r) |  | 3 |

Outputs: `nfact` (n! (n factorial)); `perm` (Permutations nPr, order matters, no repeats); `comb` (Combinations nCr, order does not matter, no repeats); `permrep` (Permutations with repetition (nʳ)); `combrep` (Combinations with repetition, C(n + r − 1, r))

### `binomial-distribution`: Binomial Distribution Calculator (Exactly k, At Most, At Least)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `n` | Number of independent trials (n) |  | 20 |
| `p` | Probability of success in one trial (p) |  | 0.05 |
| `k` | Number of successes (k) |  | 2 |

Outputs: `pk` (P(X = k), exactly k); `plt` (P(X < k), fewer than k); `ple` (P(X ≤ k), at most k); `pgt` (P(X > k), more than k); `pge` (P(X ≥ k), at least k); `mean` (Mean number of successes (n p)); `var` (Variance (n p (1 − p))); `sd` (Standard deviation)

### `trig-functions`: Trigonometry (Sin, Cos, Tan)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `x` | Angle |  | 30 |
| `u` | Angle unit | 1 = Degrees (°); 2 = Radians (rad) | 1 |

Outputs: `sin` (sin θ); `cos` (cos θ); `tan` (tan θ); `csc` (csc θ (1 / sin θ)); `sec` (sec θ (1 / cos θ)); `cot` (cot θ (1 / tan θ)); `deg` (Angle in degrees); `rad` (Angle in radians); `red` (Equivalent angle from 0° to 360°)

