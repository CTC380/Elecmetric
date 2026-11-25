# Elecmetric JavaScript API (v1.99.110)

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
  "engine": "1.99.110",
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

## Calculator reference (246)

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

Outputs: `E` (Energy (days entered), kWh); `cost` (Cost (days entered)); `costDay` (Cost per day); `costMonth` (Cost per average month (365 ÷ 12 days)); `costYear` (Cost per year); `Eday` (Energy per day, kWh); `Emonth` (Energy per average month (365 ÷ 12 days), kWh); `Eyear` (Energy per year (365 days), kWh); `E30` (Energy per 30-day month, kWh); `cost30` (Cost per 30-day month)

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

### `earthing-conductor-size`: Earthing Conductor Sizing (Protective Conductor Cross-Section)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Ief` | Earth fault current (rms) | µA, mA, A, kA, MA | 10 kA |
| `t` | Disconnection time | µs, ms, s, min, h | 0.5 s |
| `mat` | Conductor material, insulation and installation | 1 = Copper, PVC, separate (30 to 160 °C, k = 143); 2 = Copper, PVC, in a cable or bundled (70 to 160 °C, k = 115; 103 above 300 mm²); 3 = Copper, XLPE / EPR, separate (30 to 250 °C, k = 176); 4 = Copper, XLPE / EPR, in a cable or bundled (90 to 250 °C, k = 143); 5 = Aluminium, PVC, separate (30 to 160 °C, k = 95); 6 = Aluminium, PVC, in a cable or bundled (70 to 160 °C, k = 76; 68 above 300 mm²); 7 = Aluminium, XLPE / EPR, separate (30 to 250 °C, k = 116); 8 = Aluminium, XLPE / EPR, in a cable or bundled (90 to 250 °C, k = 94); 9 = Copper, bare, visible or in restricted areas (30 to 500 °C, k = 228); 10 = Aluminium, bare, visible or in restricted areas (30 to 300 °C, k = 125); 11 = Steel, bare, visible or in restricted areas (30 to 500 °C, k = 82) | 1 |
| `mech` | Mechanical minimum size | 1 = None (part of a cable or enclosure, fault size only); 2 = Separate conductor, mechanically protected (copper 2.5 mm², aluminium 16 mm²); 3 = Separate conductor, not mechanically protected (copper 4 mm², aluminium 16 mm²) | 3 |
| `Sph` | Phase conductor cross-section (0 to skip the table comparison) | mm², cm², m², ha, km², in², ft², yd², acre, mi², cmil | 150 mm² |

Outputs: `Sf` (Minimum cross-section for the fault, mm²); `Sm` (Mechanical minimum size, mm²); `Sstd` (Standard size to use, mm²); `k` (Material constant k); `J` (Fault current density at the standard size (A/mm²)); `I2t` (Fault let-through energy I²t (MA²s)); `St` (Size by the phase-conductor table rule, mm²); `Sts` (Standard size by the table rule, mm²)

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

### `motor-efficiency-loss`: Motor Efficiency, Losses and Load Assessment Calculator (Efficiency Curve, Load from Input Power or Slip, Annual Loss Cost)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `mode` | Find the load | 1 = From a load percentage you enter; 2 = From a measured input power (kW); 3 = From the measured speed (slip method) | 1 |
| `Pr` | Rated shaft output | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 55 kW |
| `etar` | Efficiency at full load (%) |  | 93 |
| `fs` | Fixed losses as a share of the full-load loss (%) |  | 35 |
| `Pnl` | No-load input power (optional) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP |  kW |
| `x` | Shaft load (% of rated) (first case) |  | 75 |
| `Pim` | Measured input power (second case) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 44 kW |
| `Ns` | Synchronous speed (third case) | rpm | 1500 rpm |
| `Nr` | Rated (nameplate) speed (third case) | rpm | 1475 rpm |
| `Nm` | Measured speed (third case) | rpm | 1481 rpm |
| `hrs` | Operating hours per year |  | 6000 |
| `tar` | Energy tariff (per kWh) |  | 8 |
| `eta2` | Efficiency of a replacement motor at the same load (%) (optional) |  | 95 |

Outputs: `Pout` (Shaft output at this load, kW); `Pin` (Electrical input, kW); `loss` (Total loss, kW); `eta` (Efficiency at this load (%)); `ld` (Load as a percentage of rated (%)); `Pfx` (Fixed loss (core, friction and windage), kW); `Pvr` (Load-dependent loss at this load (winding and stray), kW); `e100` (Efficiency at 100% load (%)); `e75` (Efficiency at 75% load (%)); `e50` (Efficiency at 50% load (%)); `e25` (Efficiency at 25% load (%)); `xp` (Load at peak efficiency, √(fixed / load-dependent loss) (% of rated)); `etap` (Peak efficiency (%)); `Ein` (Energy drawn per year at this load, kWh); `El` (Energy lost in the motor per year, kWh); `cl` (Cost of the losses per year); `dP` (Input power saved by the replacement, kW); `dE` (Energy saved per year, kWh); `ds` (Money saved per year)

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

### `short-circuit-impedance`: Short-Circuit Calculator (Source, Transformer and Cable Impedance)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `V` | Nominal system voltage (L-L) | µV, mV, V, kV, MV, GV | 415 V |
| `c` | Voltage factor c | 1.05 = 1.05 (maximum fault, tolerance up to +6%); 1.1 = 1.10 (maximum fault, tolerance up to +10%); 1 = 1.00 (no factor); 0.95 = 0.95 (minimum fault) | 1.05 |
| `Ssc` | Upstream network fault level | VA, kVA, MVA | 250 MVA |
| `xrq` | Upstream network X/R ratio |  | 10 |
| `tx` | Supply transformer between the network and the fault | 1 = Yes (enter the transformer below); 0 = No (the network fault level is at the busbar; transformer entries are ignored) | 1 |
| `St` | Transformer rating | VA, kVA, MVA | 1000 kVA |
| `uk` | Transformer impedance voltage uk (%) |  | 6 |
| `Pk` | Transformer load (copper) loss at rated current | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 10.5 kW |
| `r20` | Cable resistance at 20 °C | Ω/km, mΩ/m, Ω/m | 0.0754 Ω/km |
| `x` | Cable reactance | Ω/km, mΩ/m, Ω/m | 0.072 Ω/km |
| `L` | Cable length | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 50 m |
| `n` | Conductors per phase in parallel | 1 = One (single set); 2 = 2 in parallel; 3 = 3 in parallel; 4 = 4 in parallel; 5 = 5 in parallel; 6 = 6 in parallel; 7 = 7 in parallel; 8 = 8 in parallel; 9 = 9 in parallel | 1 |
| `mat` | Conductor material | 1 = Copper; 2 = Aluminium | 1 |
| `T` | Cable conductor temperature (°C) |  | 20 |

Outputs: `Ik` (Initial symmetrical three-phase short-circuit current at the fault, kA); `ip` (Peak short-circuit current, kA); `Ik2` (Line-to-line short-circuit current, kA); `Sk` (Short-circuit level at the fault, MVA); `Ib` (Three-phase short-circuit current at the busbar (before the cable), kA); `red` (Fall in fault current caused by the cable (%)); `R` (Total resistance to the fault, mΩ); `X` (Total reactance to the fault, mΩ); `Z` (Total impedance to the fault, mΩ); `xr` (X/R ratio at the fault); `kap` (Peak factor κ); `Zq` (Network impedance (at the system voltage), mΩ); `Zt` (Transformer impedance, mΩ); `Zc` (Cable impedance, mΩ)

### `load-schedule`: Load Schedule Calculator (Connected Load to Maximum Demand)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `V` | Supply voltage (line-to-line for three-phase) | µV, mV, V, kV, MV, GV | 415 V |
| `phase` | Phase | 3 = Three-phase; 1 = Single-phase | 3 |
| `dv` | Group diversity factor |  | 1 |
| `mg` | Spare margin for future growth (%) |  | 20 |
| `P1` | Load 1: rated power of each unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 12 kW |
| `n1` | Load 1: number of units |  | 2 |
| `d1` | Load 1: demand factor |  | 0.9 |
| `f1` | Load 1: power factor |  | 0.9 |
| `P2` | Load 2: rated power of each unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 45 kW |
| `n2` | Load 2: number of units |  | 1 |
| `d2` | Load 2: demand factor |  | 0.75 |
| `f2` | Load 2: power factor |  | 0.85 |
| `P3` | Load 3: rated power of each unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 7.5 kW |
| `n3` | Load 3: number of units |  | 4 |
| `d3` | Load 3: demand factor |  | 0.7 |
| `f3` | Load 3: power factor |  | 0.85 |
| `P4` | Load 4: rated power of each unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 20 kW |
| `n4` | Load 4: number of units |  | 1 |
| `d4` | Load 4: demand factor |  | 0.4 |
| `f4` | Load 4: power factor |  | 0.9 |
| `P5` | Load 5: rated power of each unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 11 kW |
| `n5` | Load 5: number of units |  | 2 |
| `d5` | Load 5: demand factor |  | 0.5 |
| `f5` | Load 5: power factor |  | 0.8 |
| `P6` | Load 6: rated power of each unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 15 kW |
| `n6` | Load 6: number of units |  | 1 |
| `d6` | Load 6: demand factor |  | 0.8 |
| `f6` | Load 6: power factor |  | 0.95 |
| `P7` | Load 7: rated power of each unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 9 kW |
| `n7` | Load 7: number of units |  | 1 |
| `d7` | Load 7: demand factor |  | 0.6 |
| `f7` | Load 7: power factor |  | 1 |
| `P8` | Load 8: rated power of each unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 7.4 kW |
| `n8` | Load 8: number of units |  | 2 |
| `d8` | Load 8: demand factor |  | 0.5 |
| `f8` | Load 8: power factor |  | 0.95 |

Outputs: `Pc` (Connected load, kW); `Sc` (Connected load, kVA); `D1` (Load 1 demand, kW); `D2` (Load 2 demand, kW); `D3` (Load 3 demand, kW); `D4` (Load 4 demand, kW); `D5` (Load 5 demand, kW); `D6` (Load 6 demand, kW); `D7` (Load 7 demand, kW); `D8` (Load 8 demand, kW); `Pd` (Maximum demand, kW); `Qd` (Maximum demand, kVAR); `Sd` (Maximum demand, kVA); `pf` (Overall power factor at maximum demand); `ovf` (Overall demand factor (demand ÷ connected load)); `Sdes` (Design load including the spare margin, kVA); `Id` (Design current, A)

### `power-measurement`: Power Measurement from Meter Readings (Voltmeter, Ammeter, Wattmeter and Energy Meter)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `phase` | Phase | 3 = Three-phase; 1 = Single-phase | 3 |
| `V` | Voltmeter reading (line-to-line for three-phase) | µV, mV, V, kV, MV, GV | 415 V |
| `I` | Ammeter reading (line current) | µA, mA, A, kA, MA | 10 A |
| `W` | Wattmeter reading | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 5 kW |
| `wm` | What the wattmeter reads | 1 = The whole load (total power); 2 = One phase of a balanced three-phase load (total = 3 × reading) | 1 |
| `kv` | Voltage transformer ratio (1 if connected directly) |  | 1 |
| `kc` | Current transformer ratio (1 if connected directly) |  | 1 |
| `E1` | Energy meter reading at the start (set both readings equal to skip the check) | µJ, mJ, J, kJ, MJ, kcal, BTU, Wh, kWh, MWh, eV, keV, MeV, cal, GeV | 1000 kWh |
| `E2` | Energy meter reading at the end | µJ, mJ, J, kJ, MJ, kcal, BTU, Wh, kWh, MWh, eV, keV, MeV, cal, GeV | 1002.5 kWh |
| `T` | Time between the two energy readings | µs, ms, s, min, h | 30 min |
| `mf` | Energy meter multiplying factor |  | 1 |

Outputs: `Vp` (Primary voltage, V); `Ip` (Primary current, A); `S` (Apparent power, kVA); `P` (Real power, kW); `pf` (Power factor); `Q` (Reactive power, kVAR); `ang` (Phase angle (degrees)); `dE` (Energy used in the interval, kWh); `Pavg` (Average power from the energy meter, kW); `dP` (Energy meter average compared with the wattmeter (%))

### `pt-ratio`: Voltage Transformer (PT) Ratio Calculator

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Vpn` | Rated primary voltage (as on the nameplate) | µV, mV, V, kV, MV, GV | 11000 V |
| `Vsn` | Rated secondary voltage (as on the nameplate) | µV, mV, V, kV, MV, GV | 110 V |
| `mode` | What to find | 1 = Secondary voltage, from a primary voltage; 2 = Primary voltage, from a secondary meter reading | 1 |
| `Vx` | Voltage to convert (primary for the first choice, secondary reading for the second) | µV, mV, V, kV, MV, GV | 10500 V |
| `Vtp` | Ratio test: primary voltage applied (0 to skip the ratio error) | µV, mV, V, kV, MV, GV | 10500 V |
| `Vts` | Ratio test: secondary voltage measured (0 to skip the ratio error) | µV, mV, V, kV, MV, GV | 104.7 V |
| `Sn` | Rated burden (0 to skip the burden check) | VA, kVA, MVA | 50 VA |
| `Sc` | Connected burden | VA, kVA, MVA | 30 VA |

Outputs: `K` (Rated ratio (primary ÷ secondary)); `Vp` (Primary voltage, V); `Vs` (Secondary voltage, V); `pct` (Primary voltage as a percentage of the rated primary); `Ka` (Actual ratio from the test); `eps` (Ratio error (%)); `load` (Connected burden as a percentage of the rated burden); `Is` (Secondary current drawn by the connected burden, A)

### `diode-circuit`: Diode Circuit Calculator (Forward Drop, Rectifier and Clamp)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `mode` | Circuit | 1 = DC series circuit: diode and resistor from a DC source; 2 = Half-wave rectifier on a resistive load (one diode); 3 = Full-wave bridge rectifier on a resistive load (two diodes conduct); 4 = Diode clamp: series capacitor, diode to ground, light load | 1 |
| `model` | Diode model (DC series circuit only) | 1 = Constant forward drop; 2 = Shockley exponential equation | 1 |
| `Vs` | Source voltage (DC volts for the DC circuit; RMS volts for the three AC circuits) | µV, mV, V, kV, MV, GV | 5 V |
| `R` | Resistor or load resistance | mΩ, Ω, kΩ, MΩ, GΩ | 330 Ω |
| `Vf` | Forward voltage drop | µV, mV, V, kV, MV, GV | 0.7 V |
| `Iref` | Current at which that drop applies (Shockley model) | µA, mA, A, kA, MA | 10 mA |
| `n` | Ideality factor n (Shockley model) |  | 1 |
| `T` | Junction temperature in °C (Shockley model) |  | 25 |

Outputs: `I` (Diode current (DC circuit) or average load current (rectifier), mA); `Vd` (Voltage across the diode (DC circuit), V); `VR` (Voltage across the resistor (DC circuit), V); `rd` (Dynamic resistance of the diode at this current (Shockley model), Ω); `Pd` (Power in the diode (DC circuit) or total diode loss (rectifier), W); `PR` (Power in the resistor or load, W); `eta` (Efficiency: load power ÷ (load power + diode loss) (%)); `Vpk` (Peak of the AC supply, V); `Vopk` (Peak output voltage, V); `Vomin` (Lowest output voltage (clamp), V); `Vdc` (Average (DC) output voltage, V); `Vro` (RMS output voltage (rectifier), V); `RF` (Ripple factor, no filter (%)); `Ipk` (Peak load current (rectifier), mA); `Ida` (Average current per diode (rectifier), mA); `PIV` (Peak inverse voltage across a diode, V); `theta` (Conduction angle in each pulse (rectifier))

### `vfd-speed`: VFD Frequency and Motor Speed Calculator (V/f Control)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `fb` | Motor rated (base) frequency | Hz, kHz, MHz, GHz, THz, rad/s | 50 Hz |
| `Vb` | Motor rated voltage | µV, mV, V, kV, MV, GV | 415 V |
| `poles` | Number of poles |  | 4 |
| `Nr` | Rated shaft speed (nameplate) | rpm | 1470 rpm |
| `Pr` | Rated shaft power | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 11 kW |
| `mode` | What to find | 1 = Shaft speed, from a drive output frequency; 2 = Drive output frequency, for a target shaft speed | 1 |
| `fx` | Drive output frequency (used for the first choice) | Hz, kHz, MHz, GHz, THz, rad/s | 40 Hz |
| `Nx` | Target shaft speed (used for the second choice) | rpm | 900 rpm |

Outputs: `f` (Drive output frequency, Hz); `Ns` (Synchronous speed at that frequency, rpm); `N` (Shaft speed, rpm); `pct` (Shaft speed as a percentage of rated speed); `dn` (Slip speed (held at its rated value), rpm); `slip` (Slip at this frequency (%)); `V` (Drive output voltage (V/f control), V); `vhz` (Volts per hertz); `flux` (Motor flux as a percentage of rated); `T` (Torque the motor can deliver, N·m); `P` (Shaft power at that torque and speed, kW)

### `derivative-integral`: Derivative and Integral Calculator (Polynomial, Sine, Exponential and Power Functions)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `ft` | Function | 1 = Cubic: a x³ + b x² + c x + d; 2 = Sine: a sin(b x + c) + d; 3 = Exponential: a e^(b x) + d; 4 = Power: a x^b + d (x above 0) | 1 |
| `a` | Coefficient a (x³ term, amplitude or multiplier) |  | 1 |
| `b` | Coefficient b (x² term, angular rate, rate or exponent) |  | -6 |
| `c` | Coefficient c (x term or phase in radians) |  | 11 |
| `d` | Constant d (offset) |  | -6 |
| `x0` | Point x at which to find the value and derivatives |  | 1.5 |
| `lo` | Integral lower limit |  | 0 |
| `hi` | Integral upper limit |  | 3 |

Outputs: `f0` (f(x) at the point); `df` (First derivative f′(x) at the point); `d2f` (Second derivative f″(x) at the point); `I` (Definite integral between the limits); `mean` (Mean value of f over the interval); `Isim` (Integral by Simpson's rule (check))

### `first-order-ode`: First-Order Differential Equation Solver (a dy/dt + b y = Step, Ramp or Sine Forcing, Transient and Steady State)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `ft` | Forcing g(t) on the right-hand side | 1 = Step: g = F (constant from t = 0); 2 = Ramp: g = F × t; 3 = Sine: g = F × sin(ω t) | 1 |
| `a` | Coefficient a of dy/dt |  | 2 |
| `b` | Coefficient b of y |  | 4 |
| `F` | Size F of the forcing |  | 12 |
| `w` | Angular frequency ω of the sine (rad per unit of time) |  | 2 |
| `y0` | Starting value y(0) |  | 0 |
| `t` | Time t at which to read the solution |  | 1 |
| `band` | Settling band for the transient (% of its starting size) |  | 2 |

Outputs: `tau` (Time constant τ = a / b); `yp` (Forced (particular) part at time t); `ytr` (Transient (decaying) part at time t); `yt` (Solution y(t)); `dydt` (Slope dy/dt at time t); `gt` (Forcing g(t) at time t); `C` (Transient size at t = 0, y(0) minus the forced part at 0); `yinf` (Final value F / b (step only)); `amp` (Steady-state amplitude (sine only)); `lag` (Phase lag of the output behind the sine (degrees, sine only)); `tset` (Time for the transient to settle into the band); `rk4` (Check: y(t) by 4000 Runge-Kutta steps); `dy` (Check: difference between the Runge-Kutta value and the closed form)

### `laplace-transform`: Laplace Transform Reference Tool (Standard Pairs, F(s) at a Complex s, Time Delay, Initial and Final Value)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `ft` | Time function f(t) for t ≥ 0 | 1 = Unit step: 1; 2 = Ramp: t; 3 = Power: tⁿ; 4 = Exponential: e^(−at); 5 = Ramped exponential: t e^(−at); 6 = Sine: sin(ωt); 7 = Cosine: cos(ωt); 8 = Damped sine: e^(−at) sin(ωt); 9 = Damped cosine: e^(−at) cos(ωt); 10 = Power times exponential: tⁿ e^(−at) | 8 |
| `K` | Amplitude K multiplying the function |  | 1 |
| `a` | Decay rate a (1/s) |  | 2 |
| `w` | Angular frequency ω (rad/s) |  | 3 |
| `n` | Power n (whole number, 1 to 8) |  | 2 |
| `T0` | Time delay T (s) |  | 0 |
| `sig` | Real part σ of s (1/s) |  | 3 |
| `om` | Imaginary part Ω of s (rad/s) |  | 2 |
| `t` | Time t at which to read f(t) (s) |  | 0.5 |

Outputs: `Fre` (F(s), real part); `Fim` (F(s), imaginary part (coefficient of j)); `Fmag` (F(s), magnitude |F|); `Fph` (F(s), phase angle (degrees)); `sc` (Abscissa of convergence (F(s) exists for σ above this)); `fval` (Time function f(t) at the chosen time); `f0` (Initial value f(0+)); `fv` (Final value f(∞) (only where it exists)); `dF` (Check: difference between the numerical integral and F(s))

### `sensor-range-converter`: Sensor Range Converter (Process Value to 4-20 mA, 0-10 V Signal)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `lo` | Sensor range low value (0% of span) |  | 0 |
| `hi` | Sensor range high value (100% of span) |  | 10 |
| `type` | Signal type | 1 = 4-20 mA (live zero); 2 = 0-20 mA; 3 = 0-10 V; 4 = 1-5 V (live zero); 5 = 0-5 V; 6 = 2-10 V (live zero) | 1 |
| `mode` | What to find | 1 = Signal, from a process value; 2 = Process value, from a signal | 1 |
| `pv` | Process value (used for the first choice) |  | 6.5 |
| `sig` | Signal level (used for the second choice) |  | 12 |

Outputs: `pct` (Percentage of span); `PV` (Process value); `sig` (Signal level (mA or V, as chosen)); `i420` (Equivalent 4-20 mA loop current (mA)); `gain` (Process units per mA or volt of signal)

### `energy-audit`: Energy Audit Calculator (Load Survey Against Metered Energy)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Em` | Metered energy for the audit year (from bills or meter readings) | µJ, mJ, J, kJ, MJ, kcal, BTU, Wh, kWh, MWh, eV, keV, MeV, cal, GeV | 1000000 kWh |
| `tar` | Energy tariff (per kWh) |  | 8 |
| `Eb` | Baseline: metered energy of the previous or reference year (0 to skip) | µJ, mJ, J, kJ, MJ, kcal, BTU, Wh, kWh, MWh, eV, keV, MeV, cal, GeV | 1050000 kWh |
| `P1` | Load 1: rated input power of each unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 15 kW |
| `n1` | Load 1: number of units |  | 6 |
| `l1` | Load 1: average load factor (fraction of rated input power actually drawn) |  | 0.7 |
| `h1` | Load 1: operating hours per year |  | 6000 |
| `P2` | Load 2: rated input power of each unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 0.15 kW |
| `n2` | Load 2: number of units |  | 200 |
| `l2` | Load 2: average load factor (fraction of rated input power actually drawn) |  | 1 |
| `h2` | Load 2: operating hours per year |  | 4000 |
| `P3` | Load 3: rated input power of each unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 5.5 kW |
| `n3` | Load 3: number of units |  | 10 |
| `l3` | Load 3: average load factor (fraction of rated input power actually drawn) |  | 0.6 |
| `h3` | Load 3: operating hours per year |  | 3000 |
| `P4` | Load 4: rated input power of each unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 37 kW |
| `n4` | Load 4: number of units |  | 1 |
| `l4` | Load 4: average load factor (fraction of rated input power actually drawn) |  | 0.65 |
| `h4` | Load 4: operating hours per year |  | 6500 |
| `P5` | Load 5: rated input power of each unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 30 kW |
| `n5` | Load 5: number of units |  | 2 |
| `l5` | Load 5: average load factor (fraction of rated input power actually drawn) |  | 0.5 |
| `h5` | Load 5: operating hours per year |  | 2000 |
| `P6` | Load 6: rated input power of each unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 0.3 kW |
| `n6` | Load 6: number of units |  | 50 |
| `l6` | Load 6: average load factor (fraction of rated input power actually drawn) |  | 0.8 |
| `h6` | Load 6: operating hours per year |  | 8760 |

Outputs: `Pc` (Surveyed connected load, kW); `E1` (Load 1 energy per year, kWh); `E2` (Load 2 energy per year, kWh); `E3` (Load 3 energy per year, kWh); `E4` (Load 4 energy per year, kWh); `E5` (Load 5 energy per year, kWh); `E6` (Load 6 energy per year, kWh); `Es` (Surveyed (accounted) energy per year, kWh); `Eu` (Unaccounted energy (metered less surveyed), kWh); `pu` (Unaccounted share of metered energy (%)); `Eavg` (Average metered demand over the year, kW); `top` (Largest energy user (load number)); `topsh` (Largest user share of surveyed energy (%)); `Cm` (Cost of metered energy per year); `Cs` (Cost of surveyed energy per year); `Cu` (Cost of unaccounted energy per year); `dE` (Change from baseline year, kWh); `dpct` (Change from baseline year (%))

### `tou-demand-bill`: Time-of-Use and Demand-Charge Bill (Peak, Shoulder, Off-Peak and Billed Demand)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `ep` | Peak energy (kWh) |  | 3000 |
| `es` | Shoulder energy (kWh) |  | 5000 |
| `eo` | Off-peak energy (kWh) |  | 4000 |
| `rp` | Peak rate per kWh |  | 10 |
| `rs` | Shoulder rate per kWh |  | 7 |
| `ro` | Off-peak rate per kWh |  | 5 |
| `Dr` | Recorded maximum demand (kW) |  | 40 |
| `Dc` | Contract demand (kW) |  | 50 |
| `mp` | Minimum billed demand (% of contract demand) |  | 75 |
| `dd` | Demand charge per kW per month |  | 300 |
| `dys` | Days in the billing period |  | 30 |
| `fm` | Fixed monthly charge |  | 0 |
| `du` | Electricity duty (% of subtotal) |  | 5 |
| `tx` | Tax (% of subtotal) |  | 0 |
| `ot` | Other charges, total |  | 0 |
| `cur` | Currency symbol on the results | 0 = None; 1 = ₹ rupee; 2 = $ dollar; 3 = € euro; 4 = £ pound | 0 |

Outputs: `Et` (Total energy (kWh)); `Kp` (Peak energy charge); `Ks` (Shoulder energy charge); `Ko` (Off-peak energy charge); `En` (Total energy charge); `Db` (Billed demand (kW)); `Dch` (Demand charge); `Sb` (Subtotal before duty and tax); `Du` (Electricity duty); `Tx` (Tax); `Tot` (Total bill); `avg` (Average cost per kWh (total bill / energy)); `pk` (Share of energy used at peak (%)); `lf` (Load factor on recorded demand (%))

### `load-energy-cost`: Load Energy and Cost (Voltage, Current and Power Factor to kWh and Cost)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `phase` | Current type | 3 = Three-phase AC; 1 = Single-phase AC; 0 = DC | 3 |
| `vt` | Voltage type (three-phase only) | 0 = Line-to-line (L-L); 1 = Line-to-neutral (L-N) | 0 |
| `V` | Voltage | µV, mV, V, kV, MV, GV | 415 V |
| `I` | Running current of one load | µA, mA, A, kA, MA | 10 A |
| `pf` | Power factor |  | 0.8 |
| `n` | Number of identical loads |  | 1 |
| `lf` | Average load while running (% of the current entered) |  | 100 |
| `h` | Hours of operation per day |  | 8 |
| `dm` | Days of operation per month |  | 30 |
| `dy` | Days of operation per year |  | 365 |
| `tar` | Tariff per kWh |  | 8 |
| `cur` | Currency symbol on the results | 0 = None; 1 = ₹ rupee; 2 = $ dollar; 3 = € euro; 4 = £ pound | 0 |

Outputs: `P` (Real power of all loads while running, kW); `S` (Apparent power of all loads while running, kVA); `Ed` (Energy per day, kWh); `Em` (Energy per month, kWh); `Ey` (Energy per year, kWh); `Ch` (Cost per hour of running); `Cd` (Cost per day); `Cm` (Cost per month); `Cy` (Cost per year)

### `replacement-savings`: Equipment Replacement Energy Savings (Existing Against New: Energy, Cost, Payback)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `n` | Number of units replaced |  | 1 |
| `Pe` | Existing unit: power of one unit | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 100 W |
| `he` | Existing unit: hours of use per day |  | 10 |
| `de` | Existing unit: share of its rating drawn while on (%) |  | 100 |
| `Pn` | New unit: power of one unit | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 20 W |
| `hn` | New unit: hours of use per day |  | 10 |
| `dn` | New unit: share of its rating drawn while on (%) |  | 100 |
| `dm` | Days of use per month |  | 30 |
| `dy` | Days of use per year |  | 365 |
| `tar` | Tariff per kWh |  | 8 |
| `ci` | Cost of one new unit |  | 150 |
| `co` | Other cost of the change (installation, disposal), total |  | 0 |
| `life` | Life of the new equipment (years) |  | 10 |
| `cur` | Currency symbol on the results | 0 = None; 1 = ₹ rupee; 2 = $ dollar; 3 = € euro; 4 = £ pound | 0 |

Outputs: `Eo` (Existing energy per month, kWh); `En` (New energy per month, kWh); `Co` (Existing cost per month); `Cn` (New cost per month); `dE` (Energy saved per month, kWh); `dC` (Cost saved per month); `pct` (Energy saved (%)); `dEy` (Energy saved per year, kWh); `dCy` (Cost saved per year); `inv` (Total investment); `pbm` (Simple payback (months)); `pby` (Simple payback (years)); `net` (Net saving over the life (not discounted))

### `electricity-bill-meter`: Electricity Bill from Meter Readings (Slabs, Fixed Charges, Duty and Tax)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `prev` | Previous meter reading (kWh) |  | 1200 |
| `cur` | Current meter reading (kWh) |  | 1650 |
| `mf` | Meter multiplier |  | 1 |
| `meth` | Slab billing method | 0 = Telescopic: each block at its own rate; 1 = Non-telescopic: one rate on all units | 0 |
| `b1` | Slab 1 upper limit (units) |  | 100 |
| `b2` | Slab 2 upper limit (units) |  | 300 |
| `b3` | Slab 3 upper limit (units) |  | 500 |
| `r1` | Slab 1 rate per kWh |  | 2.5 |
| `r2` | Slab 2 rate per kWh |  | 5 |
| `r3` | Slab 3 rate per kWh |  | 6.5 |
| `r4` | Slab 4 rate per kWh |  | 7.5 |
| `ld` | Sanctioned load (kW) |  | 5 |
| `fkw` | Fixed charge per kW of sanctioned load |  | 25 |
| `fm` | Fixed monthly charge |  | 0 |
| `fps` | Surcharge per kWh (fuel or power purchase adjustment) |  | 0.3 |
| `du` | Electricity duty (% of energy, fixed and surcharge) |  | 5 |
| `tx` | Tax (% of energy, fixed and surcharge) |  | 0 |
| `ot` | Other charges (fixed amount, added at the end) |  | 0 |
| `cur2` | Currency symbol on the results | 0 = None; 1 = ₹ rupee; 2 = $ dollar; 3 = € euro; 4 = £ pound | 0 |

Outputs: `u` (Units billed (kWh)); `sl` (Slab that applies (non-telescopic) or highest slab reached (telescopic)); `U1` (Slab 1 units); `U2` (Slab 2 units); `U3` (Slab 3 units); `U4` (Slab 4 units); `K1` (Slab 1 charge); `K2` (Slab 2 charge); `K3` (Slab 3 charge); `K4` (Slab 4 charge); `En` (Energy charge); `Fx` (Fixed charges (load-based plus monthly)); `Sc` (Per-unit surcharge); `Sb` (Subtotal before duty and tax); `Du` (Electricity duty); `Tx` (Tax); `Tot` (Total bill); `avg` (Average cost per kWh (total bill / units))

### `multi-appliance-cost`: Multiple Appliance Electricity Cost (Household or Building Load List)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `days` | Days of use per month |  | 30 |
| `tar` | Tariff per kWh |  | 8 |
| `cur` | Currency symbol on the results | 0 = None; 1 = ₹ rupee; 2 = $ dollar; 3 = € euro; 4 = £ pound | 0 |
| `P1` | Appliance 1: power of one unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 1500 W |
| `n1` | Appliance 1: number of units |  | 1 |
| `h1` | Appliance 1: hours of use per day |  | 8 |
| `d1` | Appliance 1: share of its rating drawn while on (%) |  | 100 |
| `m1` | Appliance 1: months of use per year (12 = all year) |  | 12 |
| `o1` | Appliance 1: hours of use per day in the months not in use (0 = none) |  | 0 |
| `u1` | Appliance 1: hours pattern | 0 = Same hours every month of use (the fields above); 1 = Enter hours per day for each month, January to December | 0 |
| `g1m1` | Appliance 1: hours per day in January |  | 0 |
| `g1m2` | Appliance 1: hours per day in February |  | 0 |
| `g1m3` | Appliance 1: hours per day in March |  | 0 |
| `g1m4` | Appliance 1: hours per day in April |  | 0 |
| `g1m5` | Appliance 1: hours per day in May |  | 0 |
| `g1m6` | Appliance 1: hours per day in June |  | 0 |
| `g1m7` | Appliance 1: hours per day in July |  | 0 |
| `g1m8` | Appliance 1: hours per day in August |  | 0 |
| `g1m9` | Appliance 1: hours per day in September |  | 0 |
| `g1m10` | Appliance 1: hours per day in October |  | 0 |
| `g1m11` | Appliance 1: hours per day in November |  | 0 |
| `g1m12` | Appliance 1: hours per day in December |  | 0 |
| `P2` | Appliance 2: power of one unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 75 W |
| `n2` | Appliance 2: number of units |  | 1 |
| `h2` | Appliance 2: hours of use per day |  | 10 |
| `d2` | Appliance 2: share of its rating drawn while on (%) |  | 100 |
| `m2` | Appliance 2: months of use per year (12 = all year) |  | 12 |
| `o2` | Appliance 2: hours of use per day in the months not in use (0 = none) |  | 0 |
| `u2` | Appliance 2: hours pattern | 0 = Same hours every month of use (the fields above); 1 = Enter hours per day for each month, January to December | 0 |
| `g2m1` | Appliance 2: hours per day in January |  | 0 |
| `g2m2` | Appliance 2: hours per day in February |  | 0 |
| `g2m3` | Appliance 2: hours per day in March |  | 0 |
| `g2m4` | Appliance 2: hours per day in April |  | 0 |
| `g2m5` | Appliance 2: hours per day in May |  | 0 |
| `g2m6` | Appliance 2: hours per day in June |  | 0 |
| `g2m7` | Appliance 2: hours per day in July |  | 0 |
| `g2m8` | Appliance 2: hours per day in August |  | 0 |
| `g2m9` | Appliance 2: hours per day in September |  | 0 |
| `g2m10` | Appliance 2: hours per day in October |  | 0 |
| `g2m11` | Appliance 2: hours per day in November |  | 0 |
| `g2m12` | Appliance 2: hours per day in December |  | 0 |
| `P3` | Appliance 3: power of one unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 100 W |
| `n3` | Appliance 3: number of units |  | 1 |
| `h3` | Appliance 3: hours of use per day |  | 6 |
| `d3` | Appliance 3: share of its rating drawn while on (%) |  | 100 |
| `m3` | Appliance 3: months of use per year (12 = all year) |  | 12 |
| `o3` | Appliance 3: hours of use per day in the months not in use (0 = none) |  | 0 |
| `u3` | Appliance 3: hours pattern | 0 = Same hours every month of use (the fields above); 1 = Enter hours per day for each month, January to December | 0 |
| `g3m1` | Appliance 3: hours per day in January |  | 0 |
| `g3m2` | Appliance 3: hours per day in February |  | 0 |
| `g3m3` | Appliance 3: hours per day in March |  | 0 |
| `g3m4` | Appliance 3: hours per day in April |  | 0 |
| `g3m5` | Appliance 3: hours per day in May |  | 0 |
| `g3m6` | Appliance 3: hours per day in June |  | 0 |
| `g3m7` | Appliance 3: hours per day in July |  | 0 |
| `g3m8` | Appliance 3: hours per day in August |  | 0 |
| `g3m9` | Appliance 3: hours per day in September |  | 0 |
| `g3m10` | Appliance 3: hours per day in October |  | 0 |
| `g3m11` | Appliance 3: hours per day in November |  | 0 |
| `g3m12` | Appliance 3: hours per day in December |  | 0 |
| `P4` | Appliance 4: power of one unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 100 W |
| `n4` | Appliance 4: number of units |  | 1 |
| `h4` | Appliance 4: hours of use per day |  | 5 |
| `d4` | Appliance 4: share of its rating drawn while on (%) |  | 100 |
| `m4` | Appliance 4: months of use per year (12 = all year) |  | 12 |
| `o4` | Appliance 4: hours of use per day in the months not in use (0 = none) |  | 0 |
| `u4` | Appliance 4: hours pattern | 0 = Same hours every month of use (the fields above); 1 = Enter hours per day for each month, January to December | 0 |
| `g4m1` | Appliance 4: hours per day in January |  | 0 |
| `g4m2` | Appliance 4: hours per day in February |  | 0 |
| `g4m3` | Appliance 4: hours per day in March |  | 0 |
| `g4m4` | Appliance 4: hours per day in April |  | 0 |
| `g4m5` | Appliance 4: hours per day in May |  | 0 |
| `g4m6` | Appliance 4: hours per day in June |  | 0 |
| `g4m7` | Appliance 4: hours per day in July |  | 0 |
| `g4m8` | Appliance 4: hours per day in August |  | 0 |
| `g4m9` | Appliance 4: hours per day in September |  | 0 |
| `g4m10` | Appliance 4: hours per day in October |  | 0 |
| `g4m11` | Appliance 4: hours per day in November |  | 0 |
| `g4m12` | Appliance 4: hours per day in December |  | 0 |
| `P5` | Appliance 5: power of one unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 150 W |
| `n5` | Appliance 5: number of units |  | 1 |
| `h5` | Appliance 5: hours of use per day |  | 24 |
| `d5` | Appliance 5: share of its rating drawn while on (%) |  | 100 |
| `m5` | Appliance 5: months of use per year (12 = all year) |  | 12 |
| `o5` | Appliance 5: hours of use per day in the months not in use (0 = none) |  | 0 |
| `u5` | Appliance 5: hours pattern | 0 = Same hours every month of use (the fields above); 1 = Enter hours per day for each month, January to December | 0 |
| `g5m1` | Appliance 5: hours per day in January |  | 0 |
| `g5m2` | Appliance 5: hours per day in February |  | 0 |
| `g5m3` | Appliance 5: hours per day in March |  | 0 |
| `g5m4` | Appliance 5: hours per day in April |  | 0 |
| `g5m5` | Appliance 5: hours per day in May |  | 0 |
| `g5m6` | Appliance 5: hours per day in June |  | 0 |
| `g5m7` | Appliance 5: hours per day in July |  | 0 |
| `g5m8` | Appliance 5: hours per day in August |  | 0 |
| `g5m9` | Appliance 5: hours per day in September |  | 0 |
| `g5m10` | Appliance 5: hours per day in October |  | 0 |
| `g5m11` | Appliance 5: hours per day in November |  | 0 |
| `g5m12` | Appliance 5: hours per day in December |  | 0 |
| `P6` | Appliance 6: power of one unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 0 W |
| `n6` | Appliance 6: number of units |  | 1 |
| `h6` | Appliance 6: hours of use per day |  | 4 |
| `d6` | Appliance 6: share of its rating drawn while on (%) |  | 100 |
| `m6` | Appliance 6: months of use per year (12 = all year) |  | 12 |
| `o6` | Appliance 6: hours of use per day in the months not in use (0 = none) |  | 0 |
| `u6` | Appliance 6: hours pattern | 0 = Same hours every month of use (the fields above); 1 = Enter hours per day for each month, January to December | 0 |
| `g6m1` | Appliance 6: hours per day in January |  | 0 |
| `g6m2` | Appliance 6: hours per day in February |  | 0 |
| `g6m3` | Appliance 6: hours per day in March |  | 0 |
| `g6m4` | Appliance 6: hours per day in April |  | 0 |
| `g6m5` | Appliance 6: hours per day in May |  | 0 |
| `g6m6` | Appliance 6: hours per day in June |  | 0 |
| `g6m7` | Appliance 6: hours per day in July |  | 0 |
| `g6m8` | Appliance 6: hours per day in August |  | 0 |
| `g6m9` | Appliance 6: hours per day in September |  | 0 |
| `g6m10` | Appliance 6: hours per day in October |  | 0 |
| `g6m11` | Appliance 6: hours per day in November |  | 0 |
| `g6m12` | Appliance 6: hours per day in December |  | 0 |
| `P7` | Appliance 7: power of one unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 0 W |
| `n7` | Appliance 7: number of units |  | 1 |
| `h7` | Appliance 7: hours of use per day |  | 4 |
| `d7` | Appliance 7: share of its rating drawn while on (%) |  | 100 |
| `m7` | Appliance 7: months of use per year (12 = all year) |  | 12 |
| `o7` | Appliance 7: hours of use per day in the months not in use (0 = none) |  | 0 |
| `u7` | Appliance 7: hours pattern | 0 = Same hours every month of use (the fields above); 1 = Enter hours per day for each month, January to December | 0 |
| `g7m1` | Appliance 7: hours per day in January |  | 0 |
| `g7m2` | Appliance 7: hours per day in February |  | 0 |
| `g7m3` | Appliance 7: hours per day in March |  | 0 |
| `g7m4` | Appliance 7: hours per day in April |  | 0 |
| `g7m5` | Appliance 7: hours per day in May |  | 0 |
| `g7m6` | Appliance 7: hours per day in June |  | 0 |
| `g7m7` | Appliance 7: hours per day in July |  | 0 |
| `g7m8` | Appliance 7: hours per day in August |  | 0 |
| `g7m9` | Appliance 7: hours per day in September |  | 0 |
| `g7m10` | Appliance 7: hours per day in October |  | 0 |
| `g7m11` | Appliance 7: hours per day in November |  | 0 |
| `g7m12` | Appliance 7: hours per day in December |  | 0 |
| `P8` | Appliance 8: power of one unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 0 W |
| `n8` | Appliance 8: number of units |  | 1 |
| `h8` | Appliance 8: hours of use per day |  | 4 |
| `d8` | Appliance 8: share of its rating drawn while on (%) |  | 100 |
| `m8` | Appliance 8: months of use per year (12 = all year) |  | 12 |
| `o8` | Appliance 8: hours of use per day in the months not in use (0 = none) |  | 0 |
| `u8` | Appliance 8: hours pattern | 0 = Same hours every month of use (the fields above); 1 = Enter hours per day for each month, January to December | 0 |
| `g8m1` | Appliance 8: hours per day in January |  | 0 |
| `g8m2` | Appliance 8: hours per day in February |  | 0 |
| `g8m3` | Appliance 8: hours per day in March |  | 0 |
| `g8m4` | Appliance 8: hours per day in April |  | 0 |
| `g8m5` | Appliance 8: hours per day in May |  | 0 |
| `g8m6` | Appliance 8: hours per day in June |  | 0 |
| `g8m7` | Appliance 8: hours per day in July |  | 0 |
| `g8m8` | Appliance 8: hours per day in August |  | 0 |
| `g8m9` | Appliance 8: hours per day in September |  | 0 |
| `g8m10` | Appliance 8: hours per day in October |  | 0 |
| `g8m11` | Appliance 8: hours per day in November |  | 0 |
| `g8m12` | Appliance 8: hours per day in December |  | 0 |
| `P9` | Appliance 9: power of one unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 0 W |
| `n9` | Appliance 9: number of units |  | 1 |
| `h9` | Appliance 9: hours of use per day |  | 4 |
| `d9` | Appliance 9: share of its rating drawn while on (%) |  | 100 |
| `m9` | Appliance 9: months of use per year (12 = all year) |  | 12 |
| `o9` | Appliance 9: hours of use per day in the months not in use (0 = none) |  | 0 |
| `u9` | Appliance 9: hours pattern | 0 = Same hours every month of use (the fields above); 1 = Enter hours per day for each month, January to December | 0 |
| `g9m1` | Appliance 9: hours per day in January |  | 0 |
| `g9m2` | Appliance 9: hours per day in February |  | 0 |
| `g9m3` | Appliance 9: hours per day in March |  | 0 |
| `g9m4` | Appliance 9: hours per day in April |  | 0 |
| `g9m5` | Appliance 9: hours per day in May |  | 0 |
| `g9m6` | Appliance 9: hours per day in June |  | 0 |
| `g9m7` | Appliance 9: hours per day in July |  | 0 |
| `g9m8` | Appliance 9: hours per day in August |  | 0 |
| `g9m9` | Appliance 9: hours per day in September |  | 0 |
| `g9m10` | Appliance 9: hours per day in October |  | 0 |
| `g9m11` | Appliance 9: hours per day in November |  | 0 |
| `g9m12` | Appliance 9: hours per day in December |  | 0 |
| `P10` | Appliance 10: power of one unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 0 W |
| `n10` | Appliance 10: number of units |  | 1 |
| `h10` | Appliance 10: hours of use per day |  | 4 |
| `d10` | Appliance 10: share of its rating drawn while on (%) |  | 100 |
| `m10` | Appliance 10: months of use per year (12 = all year) |  | 12 |
| `o10` | Appliance 10: hours of use per day in the months not in use (0 = none) |  | 0 |
| `u10` | Appliance 10: hours pattern | 0 = Same hours every month of use (the fields above); 1 = Enter hours per day for each month, January to December | 0 |
| `g10m1` | Appliance 10: hours per day in January |  | 0 |
| `g10m2` | Appliance 10: hours per day in February |  | 0 |
| `g10m3` | Appliance 10: hours per day in March |  | 0 |
| `g10m4` | Appliance 10: hours per day in April |  | 0 |
| `g10m5` | Appliance 10: hours per day in May |  | 0 |
| `g10m6` | Appliance 10: hours per day in June |  | 0 |
| `g10m7` | Appliance 10: hours per day in July |  | 0 |
| `g10m8` | Appliance 10: hours per day in August |  | 0 |
| `g10m9` | Appliance 10: hours per day in September |  | 0 |
| `g10m10` | Appliance 10: hours per day in October |  | 0 |
| `g10m11` | Appliance 10: hours per day in November |  | 0 |
| `g10m12` | Appliance 10: hours per day in December |  | 0 |
| `P11` | Appliance 11: power of one unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 0 W |
| `n11` | Appliance 11: number of units |  | 1 |
| `h11` | Appliance 11: hours of use per day |  | 4 |
| `d11` | Appliance 11: share of its rating drawn while on (%) |  | 100 |
| `m11` | Appliance 11: months of use per year (12 = all year) |  | 12 |
| `o11` | Appliance 11: hours of use per day in the months not in use (0 = none) |  | 0 |
| `u11` | Appliance 11: hours pattern | 0 = Same hours every month of use (the fields above); 1 = Enter hours per day for each month, January to December | 0 |
| `g11m1` | Appliance 11: hours per day in January |  | 0 |
| `g11m2` | Appliance 11: hours per day in February |  | 0 |
| `g11m3` | Appliance 11: hours per day in March |  | 0 |
| `g11m4` | Appliance 11: hours per day in April |  | 0 |
| `g11m5` | Appliance 11: hours per day in May |  | 0 |
| `g11m6` | Appliance 11: hours per day in June |  | 0 |
| `g11m7` | Appliance 11: hours per day in July |  | 0 |
| `g11m8` | Appliance 11: hours per day in August |  | 0 |
| `g11m9` | Appliance 11: hours per day in September |  | 0 |
| `g11m10` | Appliance 11: hours per day in October |  | 0 |
| `g11m11` | Appliance 11: hours per day in November |  | 0 |
| `g11m12` | Appliance 11: hours per day in December |  | 0 |
| `P12` | Appliance 12: power of one unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 0 W |
| `n12` | Appliance 12: number of units |  | 1 |
| `h12` | Appliance 12: hours of use per day |  | 4 |
| `d12` | Appliance 12: share of its rating drawn while on (%) |  | 100 |
| `m12` | Appliance 12: months of use per year (12 = all year) |  | 12 |
| `o12` | Appliance 12: hours of use per day in the months not in use (0 = none) |  | 0 |
| `u12` | Appliance 12: hours pattern | 0 = Same hours every month of use (the fields above); 1 = Enter hours per day for each month, January to December | 0 |
| `g12m1` | Appliance 12: hours per day in January |  | 0 |
| `g12m2` | Appliance 12: hours per day in February |  | 0 |
| `g12m3` | Appliance 12: hours per day in March |  | 0 |
| `g12m4` | Appliance 12: hours per day in April |  | 0 |
| `g12m5` | Appliance 12: hours per day in May |  | 0 |
| `g12m6` | Appliance 12: hours per day in June |  | 0 |
| `g12m7` | Appliance 12: hours per day in July |  | 0 |
| `g12m8` | Appliance 12: hours per day in August |  | 0 |
| `g12m9` | Appliance 12: hours per day in September |  | 0 |
| `g12m10` | Appliance 12: hours per day in October |  | 0 |
| `g12m11` | Appliance 12: hours per day in November |  | 0 |
| `g12m12` | Appliance 12: hours per day in December |  | 0 |

Outputs: `Pc` (Connected load (all units, rated), kW); `Pavg` (Average power over the day, kW); `Ed` (Energy per day, kWh); `Em` (Energy per month, kWh); `Ey` (Energy per year, kWh); `Cd` (Cost per day); `Cm` (Cost per month); `Cy` (Cost per year); `top` (Largest energy user (appliance number)); `topsh` (Largest user share of the total (%)); `E1` (Appliance 1 energy per month, kWh); `E2` (Appliance 2 energy per month, kWh); `E3` (Appliance 3 energy per month, kWh); `E4` (Appliance 4 energy per month, kWh); `E5` (Appliance 5 energy per month, kWh); `E6` (Appliance 6 energy per month, kWh); `E7` (Appliance 7 energy per month, kWh); `E8` (Appliance 8 energy per month, kWh); `E9` (Appliance 9 energy per month, kWh); `E10` (Appliance 10 energy per month, kWh); `E11` (Appliance 11 energy per month, kWh); `E12` (Appliance 12 energy per month, kWh); `C1` (Appliance 1 cost per month); `C2` (Appliance 2 cost per month); `C3` (Appliance 3 cost per month); `C4` (Appliance 4 cost per month); `C5` (Appliance 5 cost per month); `C6` (Appliance 6 cost per month); `C7` (Appliance 7 cost per month); `C8` (Appliance 8 cost per month); `C9` (Appliance 9 cost per month); `C10` (Appliance 10 cost per month); `C11` (Appliance 11 cost per month); `C12` (Appliance 12 cost per month); `s1` (Appliance 1 share of the total (%)); `s2` (Appliance 2 share of the total (%)); `s3` (Appliance 3 share of the total (%)); `s4` (Appliance 4 share of the total (%)); `s5` (Appliance 5 share of the total (%)); `s6` (Appliance 6 share of the total (%)); `s7` (Appliance 7 share of the total (%)); `s8` (Appliance 8 share of the total (%)); `s9` (Appliance 9 share of the total (%)); `s10` (Appliance 10 share of the total (%)); `s11` (Appliance 11 share of the total (%)); `s12` (Appliance 12 share of the total (%))

### `electricity-cost-planner`: Electricity Cost Planner (Appliances to Monthly Bill to Replacement Saving)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `days` | Days in the billing month |  | 30 |
| `cur` | Currency symbol on the results | 0 = None; 1 = ₹ rupee; 2 = $ dollar; 3 = € euro; 4 = £ pound | 0 |
| `P1` | Appliance 1: power of one unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 1500 W |
| `n1` | Appliance 1: number of units |  | 1 |
| `h1` | Appliance 1: hours of use per day |  | 8 |
| `d1` | Appliance 1: share of its rating drawn while on (%) |  | 100 |
| `P2` | Appliance 2: power of one unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 75 W |
| `n2` | Appliance 2: number of units |  | 1 |
| `h2` | Appliance 2: hours of use per day |  | 10 |
| `d2` | Appliance 2: share of its rating drawn while on (%) |  | 100 |
| `P3` | Appliance 3: power of one unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 100 W |
| `n3` | Appliance 3: number of units |  | 1 |
| `h3` | Appliance 3: hours of use per day |  | 6 |
| `d3` | Appliance 3: share of its rating drawn while on (%) |  | 100 |
| `P4` | Appliance 4: power of one unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 100 W |
| `n4` | Appliance 4: number of units |  | 1 |
| `h4` | Appliance 4: hours of use per day |  | 5 |
| `d4` | Appliance 4: share of its rating drawn while on (%) |  | 100 |
| `P5` | Appliance 5: power of one unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 150 W |
| `n5` | Appliance 5: number of units |  | 1 |
| `h5` | Appliance 5: hours of use per day |  | 24 |
| `d5` | Appliance 5: share of its rating drawn while on (%) |  | 100 |
| `P6` | Appliance 6: power of one unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 0 W |
| `n6` | Appliance 6: number of units |  | 1 |
| `h6` | Appliance 6: hours of use per day |  | 4 |
| `d6` | Appliance 6: share of its rating drawn while on (%) |  | 100 |
| `P7` | Appliance 7: power of one unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 0 W |
| `n7` | Appliance 7: number of units |  | 1 |
| `h7` | Appliance 7: hours of use per day |  | 4 |
| `d7` | Appliance 7: share of its rating drawn while on (%) |  | 100 |
| `P8` | Appliance 8: power of one unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 0 W |
| `n8` | Appliance 8: number of units |  | 1 |
| `h8` | Appliance 8: hours of use per day |  | 4 |
| `d8` | Appliance 8: share of its rating drawn while on (%) |  | 100 |
| `P9` | Appliance 9: power of one unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 0 W |
| `n9` | Appliance 9: number of units |  | 1 |
| `h9` | Appliance 9: hours of use per day |  | 4 |
| `d9` | Appliance 9: share of its rating drawn while on (%) |  | 100 |
| `P10` | Appliance 10: power of one unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 0 W |
| `n10` | Appliance 10: number of units |  | 1 |
| `h10` | Appliance 10: hours of use per day |  | 4 |
| `d10` | Appliance 10: share of its rating drawn while on (%) |  | 100 |
| `P11` | Appliance 11: power of one unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 0 W |
| `n11` | Appliance 11: number of units |  | 1 |
| `h11` | Appliance 11: hours of use per day |  | 4 |
| `d11` | Appliance 11: share of its rating drawn while on (%) |  | 100 |
| `P12` | Appliance 12: power of one unit (0 leaves the row out) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 0 W |
| `n12` | Appliance 12: number of units |  | 1 |
| `h12` | Appliance 12: hours of use per day |  | 4 |
| `d12` | Appliance 12: share of its rating drawn while on (%) |  | 100 |
| `tm` | Tariff type | 0 = Slab energy tariff (units in blocks); 1 = Time-of-use energy with a demand charge | 0 |
| `meth` | Slab billing method | 0 = Telescopic: each block at its own rate; 1 = Non-telescopic: one rate on all units | 0 |
| `b1` | Slab 1 upper limit (units) |  | 100 |
| `b2` | Slab 2 upper limit (units) |  | 300 |
| `b3` | Slab 3 upper limit (units) |  | 500 |
| `r1` | Slab 1 rate per kWh |  | 2.5 |
| `r2` | Slab 2 rate per kWh |  | 5 |
| `r3` | Slab 3 rate per kWh |  | 6.5 |
| `r4` | Slab 4 rate per kWh |  | 7.5 |
| `fm` | Fixed monthly charge |  | 125 |
| `du` | Electricity duty (% of energy and fixed charge) |  | 5 |
| `tx` | Tax (% of energy and fixed charge) |  | 0 |
| `ot` | Other charges (fixed amount, added at the end) |  | 0 |
| `pk` | Time-of-use: share of the list energy used at peak (%) |  | 25 |
| `sh` | Time-of-use: share used in the shoulder period (%), the rest is off-peak |  | 40 |
| `trp` | Time-of-use: peak rate per kWh |  | 10 |
| `trs` | Time-of-use: shoulder rate per kWh |  | 7 |
| `tro` | Time-of-use: off-peak rate per kWh |  | 5 |
| `Dr` | Demand: recorded maximum demand (kW) |  | 40 |
| `Dc` | Demand: contract demand (kW) |  | 50 |
| `mp` | Demand: minimum billed demand (% of contract demand) |  | 75 |
| `dd` | Demand: charge per kW per month |  | 300 |
| `ts` | Time-of-use split | 0 = One peak and shoulder share for the whole list; 1 = Peak and shoulder share for each appliance | 0 |
| `pp1` | Time-of-use, appliance 1: share of its energy at peak (%) |  | 25 |
| `ps1` | Time-of-use, appliance 1: share in the shoulder period (%) |  | 40 |
| `pp2` | Time-of-use, appliance 2: share of its energy at peak (%) |  | 25 |
| `ps2` | Time-of-use, appliance 2: share in the shoulder period (%) |  | 40 |
| `pp3` | Time-of-use, appliance 3: share of its energy at peak (%) |  | 25 |
| `ps3` | Time-of-use, appliance 3: share in the shoulder period (%) |  | 40 |
| `pp4` | Time-of-use, appliance 4: share of its energy at peak (%) |  | 25 |
| `ps4` | Time-of-use, appliance 4: share in the shoulder period (%) |  | 40 |
| `pp5` | Time-of-use, appliance 5: share of its energy at peak (%) |  | 25 |
| `ps5` | Time-of-use, appliance 5: share in the shoulder period (%) |  | 40 |
| `pp6` | Time-of-use, appliance 6: share of its energy at peak (%) |  | 25 |
| `ps6` | Time-of-use, appliance 6: share in the shoulder period (%) |  | 40 |
| `pp7` | Time-of-use, appliance 7: share of its energy at peak (%) |  | 25 |
| `ps7` | Time-of-use, appliance 7: share in the shoulder period (%) |  | 40 |
| `pp8` | Time-of-use, appliance 8: share of its energy at peak (%) |  | 25 |
| `ps8` | Time-of-use, appliance 8: share in the shoulder period (%) |  | 40 |
| `pp9` | Time-of-use, appliance 9: share of its energy at peak (%) |  | 25 |
| `ps9` | Time-of-use, appliance 9: share in the shoulder period (%) |  | 40 |
| `pp10` | Time-of-use, appliance 10: share of its energy at peak (%) |  | 25 |
| `ps10` | Time-of-use, appliance 10: share in the shoulder period (%) |  | 40 |
| `pp11` | Time-of-use, appliance 11: share of its energy at peak (%) |  | 25 |
| `ps11` | Time-of-use, appliance 11: share in the shoulder period (%) |  | 40 |
| `pp12` | Time-of-use, appliance 12: share of its energy at peak (%) |  | 25 |
| `ps12` | Time-of-use, appliance 12: share in the shoulder period (%) |  | 40 |
| `Dr1` | Demand after the replacement (kW, 0 keeps the recorded demand) |  | 0 |
| `k` | Appliance to replace (row number, 0 for none) |  | 1 |
| `Pn` | Replacement: power of one new unit | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 1000 W |
| `hn` | Replacement: hours of use per day |  | 8 |
| `dn` | Replacement: share of its rating drawn while on (%) |  | 100 |
| `ci` | Replacement: cost of one new unit |  | 30000 |
| `co` | Replacement: other cost of the change (installation, disposal), total |  | 0 |
| `life` | Replacement: life of the new equipment (years) |  | 10 |

Outputs: `Em` (Energy per month (the list), kWh); `Ey` (Energy per year (the list), kWh); `top` (Largest energy user (appliance number)); `topsh` (Largest user share of the total (%)); `En` (Energy charge); `Fx` (Fixed monthly charge); `Du` (Electricity duty); `Tx` (Tax); `Db` (Billed demand (kW, time-of-use tariff)); `Dch` (Demand charge (time-of-use tariff)); `Tot` (Total bill for the month); `avg` (Average cost per kWh (total bill / units)); `Cy` (Twelve bills like this one); `dE` (Energy saved by the replacement per month, kWh); `dpct` (Energy saved (% of the list)); `Tot1` (Total bill for the month after the replacement); `dT` (Bill saved per month); `dTy` (Bill saved per year (twelve bills)); `inv` (Total investment); `pbm` (Simple payback (months)); `pby` (Simple payback (years)); `net` (Net saving over the life (not discounted))

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
| `ct` | Circuit type | 1 = 5-step, 6.6 A (2.8, 3.4, 4.1, 5.2, 6.6 A); 2 = 3-step, 6.6 A (4.8, 5.5, 6.6 A); 3 = 5-step, 20 A (8.5, 10.3, 12.4, 15.8, 20.0 A) | 1 |
| `b` | Brightness step | 1 = Step 1 (lowest); 2 = Step 2; 3 = Step 3; 4 = Step 4; 5 = Step 5 (highest) | 3 |
| `n` | Fittings on the circuit |  | 60 |
| `Pl` | Lamp power per fitting at full circuit current | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 45 W |
| `et` | Isolating transformer efficiency |  | 0.85 |
| `L` | Series cable loop length | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 4000 m |
| `R` | Series cable resistance | Ω/km, mΩ/m, Ω/m | 3.08 Ω/km |
| `k` | Lamp power exponent |  | 2 |

Outputs: `I` (Circuit current at this step, A); `pI` (Current as % of full current); `Pt` (Total circuit load at this step, kW); `Vo` (CCR output voltage at this step, V); `Pc` (Cable loss at this step, W); `pL` (Load as % of the full-current load)

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

### `superposition-theorem`: Superposition Theorem Calculator (Two Voltage Sources, a Current Source and a Load)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `V1` | Voltage source V₁ | µV, mV, V, kV, MV, GV | 12 V |
| `R1` | Series resistance R₁ of source 1 | mΩ, Ω, kΩ, MΩ, GΩ | 2 Ω |
| `V2` | Voltage source V₂ | µV, mV, V, kV, MV, GV | 6 V |
| `R2` | Series resistance R₂ of source 2 | mΩ, Ω, kΩ, MΩ, GΩ | 3 Ω |
| `Is` | Current source Is into node N | µA, mA, A, kA, MA | 1 A |
| `R3` | Load resistance R₃ | mΩ, Ω, kΩ, MΩ, GΩ | 6 Ω |

Outputs: `Vl1` (Load voltage from V₁ alone (V₂ shorted, Is open), V); `Vl2` (Load voltage from V₂ alone (V₁ shorted, Is open), V); `Vl3` (Load voltage from Is alone (both voltage sources shorted), V); `VL` (Total load voltage (sum of the three), V); `IL` (Total load current, A); `P` (Load power P = V² / R₃ (true value), W); `Psum` (Sum of the three separate powers (not valid), W); `I1` (Current delivered by V₁, A); `I2` (Current delivered by V₂, A); `chk` (Check: difference from the direct node-voltage solution, V)

### `magnetic-circuit`: Magnetic Circuit Calculator (Core with an Air Gap)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `N` | Coil turns N |  | 500 |
| `I` | Coil current I | µA, mA, A, kA, MA | 2 A |
| `lc` | Core mean path length lc | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 30 cm |
| `Ac` | Core cross-section area Ac | mm², cm², m², ha, km², in², ft², yd², acre, mi², cmil | 4 cm² |
| `mur` | Core relative permeability μr |  | 2000 |
| `lg` | Air gap length lg | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 1 mm |
| `kf` | Gap area factor for fringing |  | 1 |

Outputs: `Rc` (Core reluctance (A/Wb)); `Rg` (Gap reluctance (A/Wb)); `Rt` (Total reluctance (A/Wb)); `F` (Total MMF N × I (ampere-turns)); `Fc` (MMF used in the core (ampere-turns)); `Fg` (MMF used in the gap (ampere-turns)); `pg` (Share of the MMF used in the gap (%)); `phi` (Flux Φ (Wb)); `Bc` (Flux density in the core (T)); `Bg` (Flux density in the gap (T)); `Hc` (Field strength in the core (A/m)); `Hg` (Field strength in the gap (A/m)); `L` (Inductance L = N² / R, mH); `W` (Stored energy ½ L I² (J))

### `magnetic-flux-density`: Magnetic Flux Density Calculator (B = Φ/A and the B–H Relation)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `typ` | Find B from | 1 = Flux and area (B = Φ / A); 2 = Field strength H and permeability (B = μ₀ μr H); 3 = Coil or solenoid turns, current and length; 4 = Long straight conductor, current and distance | 1 |
| `mur` | Relative permeability μr of the medium |  | 1 |
| `phi` | Flux Φ (Wb) (case 1) |  | 0.0004 |
| `A` | Cross-section area A | mm², cm², m², ha, km², in², ft², yd², acre, mi², cmil | 4 cm² |
| `H` | Field strength H (A/m) (case 2) |  | 5000 |
| `Nt` | Turns N (case 3) |  | 500 |
| `I` | Current I (cases 3 and 4) | µA, mA, A, kA, MA | 2 A |
| `l` | Coil length l (case 3) | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 30 cm |
| `r` | Distance r from the conductor axis (case 4) | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 10 cm |

Outputs: `B` (Flux density B (T)); `G` (Flux density B (gauss)); `Hf` (Field strength H (A/m)); `mu` (Absolute permeability μ = μ₀ μr (H/m)); `ph` (Flux through the area Φ = B A (Wb)); `wd` (Energy stored per unit volume B² / 2μ (J/m³)); `pm` (Magnetic pressure B² / 2μ₀ on a surface (N/m²))

### `induced-emf`: Induced EMF Calculator (Faraday's Law: Moving Conductor, Changing Flux, Rotating Coil)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `mode` | Case to solve | 1 = Conductor moving in a field: e = B l v sin θ; 2 = Coil with changing flux: e = N ΔΦ / Δt; 3 = Coil rotating in a uniform field: Em = N B A ω | 1 |
| `Bm` | Flux density B (conductor and rotating coil) |  | 0.5 |
| `l` | Active conductor length l (first case) | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 0.4 m |
| `v` | Conductor speed v (first case) | m/s, km/h, mph, kn | 10 m/s |
| `th` | Angle θ between velocity and field (first case) |  | 90 |
| `R` | Circuit resistance R (first case) | mΩ, Ω, kΩ, MΩ, GΩ | 2 Ω |
| `N` | Coil turns N (second and third case) |  | 100 |
| `B1` | Initial flux density B1 (second case) |  | 0 |
| `B2` | Final flux density B2 (second case) |  | 0.8 |
| `A` | Coil area A (second and third case) | mm², cm², m², ha, km², in², ft², yd², acre, mi², cmil | 50 cm² |
| `dt` | Time interval Δt (second case) | µs, ms, s, min, h | 20 ms |
| `rpm` | Rotation speed (third case) | rpm | 1500 rpm |
| `al` | Coil angle from the neutral plane (third case) |  | 90 |

Outputs: `e` (Induced EMF (V): moving conductor, average of the interval, or instantaneous at the coil angle, V); `I` (Circuit current (first case), A); `F` (Force on the conductor, B I l (N)); `Pm` (Power taken from the mover, e × I, W); `dphi` (Flux change ΔΦ (Wb)); `rate` (Rate of change of flux ΔΦ / Δt (Wb/s)); `w` (Angular speed ω (rad/s)); `f` (Frequency of the EMF, Hz); `Em` (Peak EMF Em = N B A ω, V); `Erms` (RMS EMF = Em / √2, V)

### `alternator-emf`: Alternator EMF and Voltage Regulation Calculator (Synchronous Generator)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `mode` | What to find | 1 = EMF from the winding: E = 4.44 Kp Kd f Φ T; 2 = No-load EMF and regulation from the load (synchronous impedance method) | 1 |
| `poles` | Number of poles (first choice) |  | 4 |
| `N` | Rotor speed (first choice) | rpm | 1500 rpm |
| `phi` | Flux per pole Φ in mWb (first choice) |  | 50 |
| `q` | Slots per pole per phase (first choice) |  | 3 |
| `span` | Coil span in slots (first choice) |  | 8 |
| `T` | Series turns per phase T (first choice) |  | 48 |
| `conn` | Winding connection | 1 = Star (line voltage = √3 × phase); 2 = Delta (line voltage = phase) | 1 |
| `VL` | Rated terminal line voltage (second choice) | µV, mV, V, kV, MV, GV | 6600 V |
| `IL` | Load line current (second choice) | µA, mA, A, kA, MA | 100 A |
| `pf` | Load power factor (second choice) |  | 0.8 |
| `lead` | Load power factor type | 0 = Lagging (inductive); 1 = Leading (capacitive) | 0 |
| `Ra` | Armature resistance Ra per phase (second choice) | mΩ, Ω, kΩ, MΩ, GΩ | 1 Ω |
| `Xs` | Synchronous reactance Xs per phase (second choice) | mΩ, Ω, kΩ, MΩ, GΩ | 20 Ω |

Outputs: `f` (Frequency f = poles × speed / 120, Hz); `Ns` (Total slots on the stator); `gam` (Slot angle γ (electrical degrees)); `al` (Short-pitch (chording) angle α (electrical degrees)); `Kp` (Pitch factor Kp = cos (α / 2)); `Kd` (Distribution factor Kd = sin (q γ / 2) / (q sin (γ / 2))); `Kw` (Winding factor Kp × Kd); `Ei` (EMF per phase with Kp = Kd = 1: 4.44 f Φ T, V); `Eph` (Generated EMF per phase E = 4.44 Kp Kd f Φ T, V); `El` (Generated EMF, line to line, V); `Vph` (Terminal voltage per phase, V); `Iph` (Armature current per phase, A); `dR` (Resistance drop Ia Ra per phase, V); `dX` (Reactance drop Ia Xs per phase, V); `E0` (No-load EMF per phase E0, V); `E0l` (No-load EMF, line to line, V); `reg` (Voltage regulation (E0 − V) / V (%)); `dl` (Angle of E0 ahead of the terminal voltage (degrees)); `S` (Output apparent power, kVA); `P` (Output real power, kW)

### `pwm-inverter`: PWM Inverter Calculator (Modulation Index, Output Voltage and Carrier Harmonics)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `topo` | Inverter circuit | 1 = Single-phase half bridge; 2 = Single-phase full bridge, bipolar switching; 3 = Single-phase full bridge, unipolar switching; 4 = Three-phase bridge | 4 |
| `mod` | Reference wave | 1 = Sinusoidal PWM; 2 = Third-harmonic injection / space-vector PWM (three-phase only) | 1 |
| `Vdc` | DC bus voltage Vdc | µV, mV, V, kV, MV, GV | 600 V |
| `ma` | Amplitude modulation index ma |  | 0.8 |
| `fc` | Carrier (switching) frequency fc | Hz, kHz, MHz, GHz, THz, rad/s | 1950 Hz |
| `f1` | Output (fundamental) frequency f1 | Hz, kHz, MHz, GHz, THz, rad/s | 50 Hz |
| `R` | Load resistance per phase R | mΩ, Ω, kΩ, MΩ, GΩ | 5 Ω |
| `L` | Load inductance per phase L | µH, mH, H | 10 mH |

Outputs: `mf` (Frequency modulation ratio mf = fc / f1); `lim` (Largest ma in the linear range); `V1pk` (Fundamental output voltage, peak (one phase to the load neutral for a three-phase bridge), V); `V1` (Fundamental output voltage, RMS (same voltage), V); `VLL` (Fundamental line-to-line voltage, RMS (three-phase bridge), V); `Vmax` (Fundamental RMS at the end of the linear range (line to line for a three-phase bridge), V); `h1` (Harmonic at mf, as % of the fundamental); `h2` (Harmonic at mf ± 2 (each of the two), as % of the fundamental); `h3` (Harmonic at 2mf ± 1 (each of the two), as % of the fundamental); `h4` (Harmonic at 2mf ± 3 (each of the two), as % of the fundamental); `h5` (Harmonic at 3mf, as % of the fundamental); `h6` (Harmonic at 3mf ± 2 (each of the two), as % of the fundamental); `thd` (Voltage distortion of the listed carrier groups, as % of the fundamental); `Z1` (Load impedance at the fundamental |R + j 2π f1 L|, Ω); `phi` (Load angle at the fundamental (degrees)); `I1` (Fundamental load current, RMS per phase, A); `Ih` (Load current of the listed carrier groups, RMS per phase, A); `It` (Total load current, RMS per phase (fundamental plus listed groups), A); `P` (Load power R I² (all phases) from the total current, W)

### `second-order-response`: Second-Order Response Calculator (Damping Ratio, Overshoot, Rise and Settling Time)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `mode` | What is known | 1 = Damping ratio ζ and natural frequency ωn; 2 = Percent overshoot and peak time (find ζ and ωn); 3 = Transfer-function coefficients: b0 / (s² + a1 s + a0) | 1 |
| `zeta` | Damping ratio ζ (first choice) |  | 0.5 |
| `wn` | Natural frequency ωn in rad/s (first choice) |  | 10 |
| `K` | DC gain K (first choice) |  | 1 |
| `OS` | Percent overshoot (second choice) |  | 16.3 |
| `tp` | Peak time (second choice) | µs, ms, s, min, h | 0.363 s |
| `a1` | Denominator coefficient a1 of s (third choice) |  | 10 |
| `a0` | Denominator constant a0 (third choice) |  | 100 |
| `b0` | Numerator b0 (third choice) |  | 100 |

Outputs: `zeta` (Damping ratio ζ); `wn` (Natural frequency ωn (rad/s)); `K` (DC gain K); `pa` (Pole real part (rad/s): −ζ ωn when underdamped, the slower pole when overdamped); `pb` (Second real pole (rad/s), critically damped and overdamped only); `wd` (Damped frequency ωd = ωn √(1 − ζ²) (rad/s), underdamped only); `Mp` (Percent overshoot, underdamped only); `tp` (Peak time π / ωd, underdamped only, s); `tr` (Rise time, 10% to 90% of the final value, s); `ts2` (Settling time to within 2% of the final value, s); `ts5` (Settling time to within 5% of the final value, s); `ts2a` (Textbook approximation 4 / (ζ ωn) for the 2% settling time, underdamped only, s); `yfin` (Final value of the output for a unit step); `ypk` (Peak value of the output, underdamped only)

### `routh-hurwitz`: Routh-Hurwitz Stability Calculator (Routh Array, Roots in the Right Half Plane)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `deg` | Degree of the polynomial n | 2 = 2 (a2 s² + a1 s + a0); 3 = 3; 4 = 4; 5 = 5; 6 = 6 | 4 |
| `a6` | Coefficient a6 of s⁶ (used for degree 6) |  | 1 |
| `a5` | Coefficient a5 of s⁵ (degree 5 and 6) |  | 1 |
| `a4` | Coefficient a4 of s⁴ (degree 4 to 6) |  | 1 |
| `a3` | Coefficient a3 of s³ (degree 3 to 6) |  | 2 |
| `a2` | Coefficient a2 of s² |  | 3 |
| `a1` | Coefficient a1 of s |  | 4 |
| `a0` | Constant term a0 |  | 5 |

Outputs: `nR` (Roots in the right half plane (sign changes in the first column)); `nI` (Roots on the imaginary axis); `nL` (Roots in the left half plane); `stab` (Stability: 1 stable, 0 marginally stable, −1 unstable); `pa` (Degree of the auxiliary polynomial (zero row only)); `c0` (First column, row 1 (s^n)); `c1` (First column, row 2); `c2` (First column, row 3); `c3` (First column, row 4); `c4` (First column, row 5); `c5` (First column, row 6); `c6` (First column, row 7); `c7` (First column, row 8 (degree 6 with a zero row only))

### `ladder-logic-simulator`: Ladder Logic Simulator (Start/Stop Seal-In Rung with On-Delay or Off-Delay Timer)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `tmr` | Timer type | 0 = TON, on-delay (done after the rung has been true for the preset); 1 = TOF, off-delay (done stays on for the preset after the rung goes false) | 0 |
| `start` | START pushbutton (normally open, XIC) | 0 = Not pressed (0); 1 = Pressed (1) | 1 |
| `stop` | STOP pushbutton (normally closed, XIO) | 0 = Not pressed (contact closed); 1 = Pressed (contact open) | 0 |
| `ol` | Overload relay (normally closed contact, XIO) | 0 = Healthy (contact closed); 1 = Tripped (contact open) | 0 |
| `seal` | Holding contact M (state of the motor contactor in the previous scan) | 0 = Off in the previous scan (0); 1 = On in the previous scan (1) | 0 |
| `PT` | Timer preset PT (s) |  | 5 |
| `tin` | Time the timer has been running (s) |  | 3 |
| `scan` | PLC scan time (ms) |  | 10 |

Outputs: `M` (Motor contactor M (rung 1 output): 1 on, 0 off); `EN` (Timer rung enable (1 true, 0 false)); `acc` (Timer accumulated time ACC (s)); `dn` (Timer done bit DN, the delayed output: 1 on, 0 off); `rem` (Time left to the preset (s)); `pct` (Timer complete (% of preset)); `scans` (PLC scans in the preset)

### `synchronous-motor`: Synchronous Motor Calculator (Speed, Back EMF, Load Angle, Torque, Reactive Power and Pull-out Power)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `P` | Electrical input power | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 1000 kW |
| `VL` | Terminal line voltage | µV, mV, V, kV, MV, GV | 6600 V |
| `poles` | Number of poles |  | 6 |
| `f` | Supply frequency | Hz, kHz, MHz, GHz, THz, rad/s | 50 Hz |
| `pf` | Power factor |  | 0.9 |
| `lead` | Power factor type | 1 = Leading (over-excited, supplies reactive power); 0 = Lagging (under-excited, takes reactive power) | 1 |
| `Ra` | Armature resistance Ra per phase | mΩ, Ω, kΩ, MΩ, GΩ | 1 Ω |
| `Xs` | Synchronous reactance Xs per phase | mΩ, Ω, kΩ, MΩ, GΩ | 25 Ω |

Outputs: `Ns` (Synchronous speed Ns = 120 f / poles, rpm); `Vph` (Terminal voltage per phase, V); `Ia` (Line (armature) current, A); `S` (Apparent power taken, kVA); `Q` (Reactive power (positive taken, negative supplied), kVAR); `Eb` (Back EMF (excitation voltage) per phase, V); `Ebl` (Back EMF, line to line equivalent (√3 × per phase), V); `ratio` (Back EMF / terminal voltage); `dl` (Load angle δ (back EMF behind the terminal voltage, degrees)); `Pcu` (Armature copper loss, kW); `Pd` (Developed (air-gap) power, kW); `T` (Developed torque, N·m); `Pmax` (Pull-out (maximum developed) power at this excitation, kW); `dmax` (Load angle at pull-out (degrees)); `marg` (Pull-out power / present developed power)

### `transformer-parallel`: Transformer Parallel Operation Checker (Load Sharing, Circulating Current and Largest Load for Two Transformers)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `g1` | Vector group of unit 1 | 0 = Dyn11 (delta / star with neutral, 330° lag = 30° lead); 1 = Dyn1 (delta / star with neutral, 30° lag); 2 = Dyn5 (delta / star with neutral, 150° lag); 3 = Yd1 (star / delta, 30° lag); 4 = Yd11 (star / delta, 330° lag = 30° lead); 5 = Yy0 (star / star, 0°); 6 = Yy6 (star / star, 180°); 7 = Dd0 (delta / delta, 0°); 8 = Dd6 (delta / delta, 180°) | 0 |
| `S1` | Unit 1 rating | VA, kVA, MVA | 1000 kVA |
| `z1` | Unit 1 impedance (% on its own rating) |  | 5 |
| `xr1` | Unit 1 X/R ratio |  | 8 |
| `g2` | Vector group of unit 2 | 0 = Dyn11 (delta / star with neutral, 330° lag = 30° lead); 1 = Dyn1 (delta / star with neutral, 30° lag); 2 = Dyn5 (delta / star with neutral, 150° lag); 3 = Yd1 (star / delta, 30° lag); 4 = Yd11 (star / delta, 330° lag = 30° lead); 5 = Yy0 (star / star, 0°); 6 = Yy6 (star / star, 180°); 7 = Dd0 (delta / delta, 0°); 8 = Dd6 (delta / delta, 180°) | 0 |
| `S2` | Unit 2 rating | VA, kVA, MVA | 630 kVA |
| `z2` | Unit 2 impedance (% on its own rating) |  | 4.5 |
| `xr2` | Unit 2 X/R ratio |  | 8 |
| `eps` | No-load secondary voltage of unit 2 above unit 1 (%) |  | 0 |
| `S` | Total load to be supplied | VA, kVA, MVA | 1400 kVA |
| `pf` | Load power factor (lagging) |  | 0.85 |

Outputs: `dang` (Phase displacement difference between the units (°)); `dz` (Impedance difference (% of the lower impedance)); `rr` (Rating ratio (larger / smaller)); `Sa0` (Unit 1 share by the simple rating over impedance rule, kVA); `Sa` (Unit 1 apparent power carried, kVA); `Sb` (Unit 2 apparent power carried, kVA); `La` (Unit 1 loading (% of its rating)); `Lb` (Unit 2 loading (% of its rating)); `Pa` (Unit 1 real power, kW); `Pb` (Unit 2 real power, kW); `Qa` (Unit 1 reactive power (positive delivered), kVAR); `Qb` (Unit 2 reactive power (positive delivered), kVAR); `Ic` (Circulating current (in kVA at rated voltage), kVA); `Ca` (Circulating current as % of unit 1 rating); `Cb` (Circulating current as % of unit 2 rating); `Smax` (Largest total load before a unit reaches 100%, kVA); `util` (Largest load as % of the two ratings added); `lim` (Unit that reaches 100% first (1 or 2)); `head` (Largest load less the present load (negative if overloaded), kVA)

### `transformer-inrush`: Transformer Inrush Current Estimator (Peak Inrush, Rated Peak, Decay and Instantaneous Relay Setting Check)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `S` | Transformer rating | VA, kVA, MVA | 1000 kVA |
| `V` | Voltage of the winding being energised (L-L) | µV, mV, V, kV, MV, GV | 11000 V |
| `k` | Inrush multiple of rated current (k) |  | 10 |
| `tau` | Decay time constant | µs, ms, s, min, h | 0.5 s |
| `t` | Time after energising to check | µs, ms, s, min, h | 1 s |
| `Iset` | Instantaneous overcurrent setting on this winding | µA, mA, A, kA, MA | 600 A |

Outputs: `In` (Rated current of the winding, A); `Irp` (Rated peak current (rated current × √2), A); `Ipk` (Peak inrush current (k × rated current), A); `r` (Peak inrush as a multiple of the rated peak); `tr` (Time for the peak to fall to the rated peak, s); `Ipt` (Peak inrush remaining after the chosen time, A); `m` (Setting as a multiple of the peak inrush); `mn` (Setting as a multiple of rated current)

### `two-wattmeter`: Two-Wattmeter Method Calculator (Total Power, Reactive Power and Power Factor of a Three-Phase Load from Two Readings)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `mode` | Find | 0 = The load from two readings; 1 = The two readings from a load | 0 |
| `W1` | Wattmeter 1 reading | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 8 kW |
| `W2` | Wattmeter 2 reading | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 4 kW |
| `P` | Total real power of the load | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 12 kW |
| `pf` | Power factor of the load |  | 0.8 |
| `lt` | Load type | 0 = Lagging (inductive); 1 = Leading (capacitive) | 0 |
| `V` | Line voltage (L-L) | µV, mV, V, kV, MV, GV | 415 V |

Outputs: `P` (Total real power, kW); `Q` (Reactive power (positive lagging, negative leading), kVAR); `S` (Apparent power, kVA); `phi` (Power angle (°)); `pf` (Power factor); `Wbig` (Larger reading, kW); `Wsmall` (Smaller reading (negative below pf 0.5), kW); `ratio` (Smaller reading / larger reading); `I` (Line current at the line voltage, A)

### `controlled-rectifier`: Controlled Rectifier Calculator (Thyristor Output Voltage, Firing Angle, Overlap and Input Power Factor)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `ct` | Circuit and load | 0 = Single-phase half-wave, resistive load (one thyristor); 1 = Single-phase full-controlled bridge, resistive load; 2 = Single-phase full-controlled bridge, R-L-E load (continuous, ripple-free current); 3 = Single-phase half-controlled bridge with freewheeling, R-L-E load (continuous, ripple-free current); 4 = Three-phase half-wave (3-pulse), R-L-E load (continuous, ripple-free current); 5 = Three-phase full-controlled bridge (6-pulse), R-L-E load (continuous, ripple-free current) | 2 |
| `Vs` | Supply voltage, RMS | µV, mV, V, kV, MV, GV | 230 V |
| `f` | Supply frequency | Hz, kHz, MHz, GHz, THz, rad/s | 50 Hz |
| `alpha` | Firing angle α (degrees) |  | 30 |
| `R` | Load resistance | mΩ, Ω, kΩ, MΩ, GΩ | 10 Ω |
| `E` | Load counter-EMF, R-L-E circuits (V) | µV, mV, V, kV, MV, GV | 0 V |
| `Ls` | Source inductance per phase, optional | µH, mH, H |  mH |

Outputs: `Vd0` (Maximum average output (α = 0, no overlap), V); `Vdc` (Average output voltage, V); `rat` (Average output as a percentage of the maximum); `Vro` (RMS output voltage (ideal, no overlap), V); `fr` (Output ripple frequency, Hz); `Id` (Average load current, A); `Pw` (Real power at the converter (negative when returned to the supply), kW); `S` (Apparent power at the AC side, kVA); `Q1` (Fundamental reactive power (always lagging for a firing delay), kVAR); `PF` (Power factor P / S (negative when power returns to the supply)); `DPF` (Displacement power factor cos φ1); `Isrc` (RMS supply current per line (or phase), A); `I1` (Fundamental RMS supply current, A); `THD` (Supply current distortion, total including any DC component (%)); `mu` (Overlap angle μ (degrees)); `gamma` (Extinction angle γ = 180° − α − μ in inverter operation (degrees)); `dV` (Average voltage lost to overlap, V); `IavT` (Average current per thyristor, A); `PIV` (Peak reverse voltage per thyristor, V)

### `dc-dc-converter`: DC-DC Converter Calculator (Buck, Boost and Buck-Boost Design with Switch, Diode and Inductor Losses)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `tp` | Converter type | 0 = Buck (step-down); 1 = Boost (step-up); 2 = Buck-boost (inverting, output magnitude) | 0 |
| `Vin` | Input voltage | µV, mV, V, kV, MV, GV | 48 V |
| `Vout` | Output voltage, magnitude | µV, mV, V, kV, MV, GV | 12 V |
| `Iout` | Output (load) current | µA, mA, A, kA, MA | 5 A |
| `fsw` | Switching frequency | Hz, kHz, MHz, GHz, THz, rad/s | 100 kHz |
| `rl` | Inductor ripple current, % of its average current |  | 30 |
| `L` | Inductor you have, optional | µH, mH, H |  µH |
| `dV` | Output voltage ripple target, % of output |  | 1 |
| `C` | Output capacitor you have, optional | pF, nF, µF, F |  µF |
| `ESR` | Output capacitor ESR | mΩ, Ω, kΩ, MΩ, GΩ | 0 mΩ |
| `Rds` | Switch on-resistance | mΩ, Ω, kΩ, MΩ, GΩ | 0 mΩ |
| `Vf` | Diode forward drop (V) | µV, mV, V, kV, MV, GV | 0 V |
| `DCR` | Inductor winding resistance | mΩ, Ω, kΩ, MΩ, GΩ | 0 mΩ |

Outputs: `D` (Duty cycle D); `IL` (Average inductor current, A); `dI` (Inductor ripple current (peak to peak), A); `Ipk` (Peak inductor and switch current, A); `ILrms` (RMS inductor current, A); `L` (Inductance used, µH); `Lcrit` (Critical inductance (current just reaches zero), µH); `Cm` (Output capacitance needed for the ripple target (ESR not included), µF); `Vrip` (Output ripple, peak to peak (capacitance plus ESR), V); `Isw` (Average switch current, A); `Iswr` (RMS switch current, A); `Id` (Average diode current, A); `Vst` (Voltage across the switch and diode when off, V); `Psw` (Switch conduction loss, W); `Pd` (Diode conduction loss, W); `PL` (Inductor winding loss, W); `Pl` (Total of these three losses, W); `Iin` (Average input current, A); `eta` (Efficiency from these losses (%))

### `switching-loss-comparison`: Switching Loss Comparison Tool (MOSFET Conduction, Switching and Gate Loss for Two or Three Devices, with the Frequency Where They Break Even)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `V` | Switched (off-state) voltage | µV, mV, V, kV, MV, GV | 48 V |
| `I` | On-state current | µA, mA, A, kA, MA | 10 A |
| `D` | Duty cycle D (fraction of the period the switch is on) |  | 0.5 |
| `fsw` | Switching frequency | Hz, kHz, MHz, GHz, THz, rad/s | 100 kHz |
| `Vg` | Gate drive voltage | µV, mV, V, kV, MV, GV | 10 V |
| `RdsA` | Device A: on-resistance Rds(on) | mΩ, Ω, kΩ, MΩ, GΩ | 10 mΩ |
| `trA` | Device A: rise time tr (ns) |  | 20 |
| `tfA` | Device A: fall time tf (ns) |  | 20 |
| `QgA` | Device A: total gate charge Qg | nC, µC, mC, C, e | 50 nC |
| `RdsB` | Device B: on-resistance Rds(on) | mΩ, Ω, kΩ, MΩ, GΩ | 4 mΩ |
| `trB` | Device B: rise time tr (ns) |  | 35 |
| `tfB` | Device B: fall time tf (ns) |  | 30 |
| `QgB` | Device B: total gate charge Qg | nC, µC, mC, C, e | 140 nC |
| `RdsC` | Device C (optional): on-resistance Rds(on) | mΩ, Ω, kΩ, MΩ, GΩ |  mΩ |
| `trC` | Device C (optional): rise time tr (ns) |  |  |
| `tfC` | Device C (optional): fall time tf (ns) |  |  |
| `QgC` | Device C (optional): total gate charge Qg | nC, µC, mC, C, e |  nC |

Outputs: `PcA` (Device A: conduction loss, W); `PswA` (Device A: switching loss, W); `PgA` (Device A: gate drive loss, W); `PtA` (Device A: total loss, W); `PdA` (Device A: loss inside the device (conduction plus switching), W); `PcB` (Device B: conduction loss, W); `PswB` (Device B: switching loss, W); `PgB` (Device B: gate drive loss, W); `PtB` (Device B: total loss, W); `PdB` (Device B: loss inside the device (conduction plus switching), W); `PcC` (Device C: conduction loss, W); `PswC` (Device C: switching loss, W); `PgC` (Device C: gate drive loss, W); `PtC` (Device C: total loss, W); `PdC` (Device C: loss inside the device (conduction plus switching), W); `best` (Device with the lowest total loss (1 = A, 2 = B, 3 = C)); `dP` (Total loss of the worst device minus the best, W); `dpct` (Saving of the best device over the worst (% of the worst)); `shA` (Device A: switching and gate loss, % of its total); `shB` (Device B: switching and gate loss, % of its total); `shC` (Device C: switching and gate loss, % of its total); `fcA` (Device A: frequency where switching plus gate loss equals conduction loss, kHz); `fcB` (Device B: frequency where switching plus gate loss equals conduction loss, kHz); `fcC` (Device C: frequency where switching plus gate loss equals conduction loss, kHz); `fxAB` (Break-even frequency, A and B (equal total loss), kHz); `fxAC` (Break-even frequency, A and C, kHz); `fxBC` (Break-even frequency, B and C, kHz)

### `load-factor`: Load Factor Calculator (Load Factor, Demand Factor, Diversity Factor and Maximum Demand)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Pc` | Connected load | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 500 kW |
| `df` | Demand factor (used when no measured maximum demand is entered) |  | 0.7 |
| `mdm` | Measured maximum demand (optional) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP |  kW |
| `E` | Energy used in the period | µJ, mJ, J, kJ, MJ, kcal, BTU, Wh, kWh, MWh, eV, keV, MeV, cal, GeV | 168000 kWh |
| `T` | Length of the period | µs, ms, s, min, h | 720 h |
| `Ps` | Sum of the individual maximum demands (optional) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 420 kW |

Outputs: `md` (Maximum demand, kW); `dfo` (Demand factor (maximum demand / connected load)); `pavg` (Average demand (energy / hours), kW); `lf` (Load factor (average / maximum demand)); `lfp` (Load factor (%)); `gap` (Peak above the average (maximum − average demand), kW); `emax` (Energy at the maximum demand for the whole period, kWh); `unused` (Share of that energy not used (%)); `dvf` (Diversity factor (sum of individual maxima / group maximum))

### `adc-sampling`: ADC Resolution and Sampling Calculator (LSB, Counts, SNR, ENOB, Nyquist and Aliasing)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `bits` | Number of bits N |  | 12 |
| `fsr` | Full-scale input range | µV, mV, V, kV, MV, GV | 3.3 V |
| `vlo` | Voltage at code 0 (bottom of the range) | µV, mV, V, kV, MV, GV | 0 V |
| `v` | Input voltage to convert | µV, mV, V, kV, MV, GV | 1.65 V |
| `slo` | Sensor signal at 0% of its span | µV, mV, V, kV, MV, GV | 0 V |
| `shi` | Sensor signal at 100% of its span | µV, mV, V, kV, MV, GV | 3.3 V |
| `span` | Sensor span in its own units |  | 100 |
| `fmax` | Highest frequency in the signal | Hz, kHz, MHz, GHz, THz, rad/s | 1000 Hz |
| `fs` | Sampling rate | Hz, kHz, MHz, GHz, THz, rad/s | 10000 Hz |
| `sinad` | Measured SINAD (signal to noise and distortion), dB |  | 68 |

Outputs: `lsb` (Step size (1 LSB), mV); `levels` (Number of levels (2^N)); `maxcode` (Highest code (2^N − 1)); `code` (Ideal count for the input voltage); `qerr` (Maximum quantisation error (±½ LSB), mV); `qpct` (Maximum quantisation error (% of full-scale range)); `snr` (Ideal signal to noise ratio (full-scale sine)); `enob` (Effective number of bits (ENOB) from SINAD); `lost` (Bits lost to noise and distortion (N − ENOB)); `cnt` (Counts available across the sensor span); `frac` (Part of the input range the sensor span uses (%)); `bused` (Resolution of the sensor span in bits (log2 of the counts)); `rpct` (One count as a percentage of the sensor span); `upc` (Sensor units per count); `gmax` (Largest gain that still keeps the span inside the range); `nyq` (Nyquist frequency (fs / 2), kHz); `osr` (Oversampling ratio (fs / 2 fmax)); `xbits` (Extra resolution from oversampling and averaging (bits)); `alias` (Alias frequency (where an under-sampled tone appears), Hz)

### `lighting-uniformity`: Lighting Uniformity Calculator (Average, Minimum, Maximum and Uniformity Ratios from Measured or Calculated Lux Points)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `n` | Number of points used |  | 8 |
| `E1` | Point 1 (lux) |  | 420 |
| `E2` | Point 2 (lux) |  | 380 |
| `E3` | Point 3 (lux) |  | 510 |
| `E4` | Point 4 (lux) |  | 465 |
| `E5` | Point 5 (lux) |  | 350 |
| `E6` | Point 6 (lux) |  | 495 |
| `E7` | Point 7 (lux) |  | 440 |
| `E8` | Point 8 (lux) |  | 400 |
| `E9` | Point 9 (lux) |  | 0 |
| `E10` | Point 10 (lux) |  | 0 |
| `E11` | Point 11 (lux) |  | 0 |
| `E12` | Point 12 (lux) |  | 0 |
| `Er` | Required average illuminance (lux) |  | 400 |
| `Ur` | Required uniformity Uo (Emin / Eavg) |  | 0.6 |

Outputs: `avg` (Average illuminance Eavg (lux)); `mn` (Minimum illuminance Emin (lux)); `mx` (Maximum illuminance Emax (lux)); `uo` (Uniformity Uo = Emin / Eavg); `u1` (Ratio U1 = Emin / Emax); `mxavg` (Ratio Emax / Eavg); `sd` (Standard deviation of the points (lux)); `cv` (Coefficient of variation (%)); `imin` (Number of the lowest point); `imax` (Number of the highest point); `okem` (Average meets the requirement (1 = yes, 0 = no)); `okuo` (Uniformity meets the requirement (1 = yes, 0 = no)); `minreq` (Lowest point needed for the required Uo (lux)); `short` (Lux the lowest point is short by (0 if met))

### `fourier-series`: Fourier Series Calculator (Harmonics, DC, RMS and THD of Square, Triangle, Sawtooth, Rectified and Pulse Waves)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `wave` | Waveform | 0 = Square wave (±A, odd symmetry, f(t) = A for the first half period); 1 = Triangle wave (±A peak, rises from 0 at t = 0); 2 = Sawtooth wave (ramp from −A to A, jump at half period); 3 = Half-wave rectified sine (peak A, f is the sine frequency); 4 = Full-wave rectified sine /A sin(π f t)/ (f is the output frequency, twice the sine frequency); 5 = Rectangular pulse train 0 to A, centred on t = 0 (duty cycle below) | 0 |
| `A` | Peak amplitude A |  | 10 |
| `f` | Frequency f (Hz) |  | 50 |
| `D` | Duty cycle D of the pulse train (%) |  | 25 |
| `n` | Harmonic number n to inspect (1 = fundamental) |  | 3 |
| `N` | Number of harmonics N in the partial sum |  | 9 |
| `t` | Time t for the partial sum (ms) |  | 2 |

Outputs: `a0` (DC (average) value a0); `rms` (RMS value); `acrms` (AC RMS value (without the DC term)); `c1` (Fundamental amplitude c1); `an` (Cosine coefficient a_n of the chosen harmonic); `bn` (Sine coefficient b_n of the chosen harmonic); `cn` (Amplitude c_n of the chosen harmonic); `cpct` (Chosen harmonic as % of the fundamental); `thd` (Total harmonic distortion, all harmonics (%)); `pshare` (AC power carried by harmonics 1 to N (%)); `SN` (Partial sum of the first N harmonics at time t); `fx` (Exact waveform value at time t); `err` (Partial sum minus exact value)

### `transformer-test-data`: Transformer OC and SC Test Calculator

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `S` | Rated power S | VA, kVA, MVA | 500 kVA |
| `V1` | Rated voltage, short-circuit (HV) side | µV, mV, V, kV, MV, GV | 11000 V |
| `V2` | Rated voltage, open-circuit (LV) side | µV, mV, V, kV, MV, GV | 433 V |
| `ph` | Phases | 3 = Three-phase (line values, total power); 1 = Single-phase | 3 |
| `V0` | Open-circuit test voltage V₀ | µV, mV, V, kV, MV, GV | 433 V |
| `I0` | Open-circuit test current I₀ | µA, mA, A, kA, MA | 6.5 A |
| `P0` | Open-circuit test power P₀ | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 1100 W |
| `Vsc` | Short-circuit test voltage Vsc | µV, mV, V, kV, MV, GV | 475 V |
| `Isc` | Short-circuit test current Isc | µA, mA, A, kA, MA | 26.24 A |
| `Psc` | Short-circuit test power Psc | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 5200 W |
| `xp` | Load for regulation and efficiency (% of rated) |  | 75 |
| `pf` | Load power factor |  | 0.8 |
| `lead` | Load power factor type | 0 = Lagging (inductive); 1 = Leading (capacitive) | 0 |

Outputs: `Ir` (Rated current, HV side (A)); `cos0` (No-load power factor cos φ₀); `Ic` (Core-loss current Ic, LV side (A)); `Im` (Magnetising current Im, LV side (A)); `Rc` (Core-loss resistance Rc, referred to HV, Ω); `Xm` (Magnetising reactance Xm, referred to HV, Ω); `R` (Series resistance R, HV side (per phase), Ω); `X` (Series reactance X, HV side (per phase), Ω); `Z` (Series impedance Z, HV side (per phase), Ω); `pR` (Resistance R (% on rating)); `pX` (Reactance X (% on rating)); `pZ` (Impedance Z (% on rating)); `Pc` (Core loss (constant), kW); `Pcu` (Copper loss at rated current, kW); `reg` (Voltage regulation at the chosen load (%)); `eff` (Efficiency at the chosen load (%)); `xm` (Load for maximum efficiency (% of rated)); `em` (Maximum efficiency at that load and the same power factor (%))

### `load-flow-3bus`: Load Flow Calculator (3-Bus, Newton-Raphson or Gauss-Seidel)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Sb` | Base power Sbase | VA, kVA, MVA | 100 MVA |
| `V1` | Slack bus 1 voltage (pu) |  | 1.05 |
| `R12` | Line 1-2 resistance R (pu) |  | 0.02 |
| `X12` | Line 1-2 reactance X (pu) |  | 0.06 |
| `R13` | Line 1-3 resistance R (pu) |  | 0.08 |
| `X13` | Line 1-3 reactance X (pu) |  | 0.24 |
| `R23` | Line 2-3 resistance R (pu) |  | 0.06 |
| `X23` | Line 2-3 reactance X (pu) |  | 0.18 |
| `P2` | Bus 2 load real power P2 | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 80 MW |
| `Q2` | Bus 2 load reactive power Q2 | VAR, kVAR, MVAR | 40 MVAR |
| `t3` | Bus 3 type | 0 = Load bus (PQ): P and Q given; 1 = Generator bus (PV): P and voltage given | 0 |
| `P3` | Bus 3 real power P3 | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 60 MW |
| `Q3` | Bus 3 load reactive power Q3 (load bus only) | VAR, kVAR, MVAR | 25 MVAR |
| `V3` | Bus 3 voltage setpoint (generator bus only, pu) |  |  |
| `method` | Method | 0 = Newton-Raphson (polar, analytic Jacobian); 1 = Gauss-Seidel (no acceleration factor) | 0 |

Outputs: `it` (Iterations to converge); `V2` (Bus 2 voltage |V2| (pu)); `a2` (Bus 2 angle (degrees)); `V3` (Bus 3 voltage |V3| (pu)); `a3` (Bus 3 angle (degrees)); `Pg` (Slack bus real power output, MW); `Qg` (Slack bus reactive power output, MVAR); `Qg3` (Bus 3 reactive output (generator bus only), MVAR); `P12` (Line 1-2 real power, bus 1 end, MW); `Q12` (Line 1-2 reactive power, bus 1 end, MVAR); `P13` (Line 1-3 real power, bus 1 end, MW); `Q13` (Line 1-3 reactive power, bus 1 end, MVAR); `P23` (Line 2-3 real power, bus 2 end, MW); `Q23` (Line 2-3 reactive power, bus 2 end, MVAR); `Pl` (Total line loss, MW); `mis` (Final power mismatch (pu))

### `symmetrical-components`: Symmetrical Components Calculator (Phase, Sequence and Fault Currents)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `mode` | What to calculate | 0 = Phase phasors to sequence components; 1 = Sequence components to phase phasors; 2 = Fault currents from sequence impedances | 0 |
| `Ma` | Phase a magnitude |Va| (phase-to-sequence) |  | 230 |
| `Fa` | Phase a angle (degrees) |  | 0 |
| `Mb` | Phase b magnitude |Vb| |  | 226 |
| `Fb` | Phase b angle (degrees) |  | -119.5 |
| `Mc` | Phase c magnitude |Vc| |  | 234 |
| `Fc` | Phase c angle (degrees) |  | 120.5 |
| `S0` | Zero-sequence magnitude |V0| (sequence-to-phase) |  | 8 |
| `G0` | Zero-sequence angle (degrees) |  | 20 |
| `S1` | Positive-sequence magnitude |V1| |  | 230 |
| `G1` | Positive-sequence angle (degrees) |  | 0 |
| `S2` | Negative-sequence magnitude |V2| |  | 12 |
| `G2` | Negative-sequence angle (degrees) |  | -40 |
| `Vll` | System line-to-line voltage at the fault (fault currents) | µV, mV, V, kV, MV, GV | 400 V |
| `R1` | Positive-sequence resistance R1 | mΩ, Ω, kΩ, MΩ, GΩ | 0.02 Ω |
| `X1` | Positive-sequence reactance X1 | mΩ, Ω, kΩ, MΩ, GΩ | 0.08 Ω |
| `R2` | Negative-sequence resistance R2 | mΩ, Ω, kΩ, MΩ, GΩ | 0.02 Ω |
| `X2` | Negative-sequence reactance X2 | mΩ, Ω, kΩ, MΩ, GΩ | 0.08 Ω |
| `R0` | Zero-sequence resistance R0 | mΩ, Ω, kΩ, MΩ, GΩ | 0.06 Ω |
| `X0` | Zero-sequence reactance X0 | mΩ, Ω, kΩ, MΩ, GΩ | 0.2 Ω |

Outputs: `M0` (Zero-sequence |V0|); `A0` (Zero-sequence angle (degrees)); `M1` (Positive-sequence |V1|); `A1` (Positive-sequence angle (degrees)); `M2` (Negative-sequence |V2|); `A2` (Negative-sequence angle (degrees)); `u2` (Negative-sequence unbalance |V2| ÷ |V1| (%)); `u0` (Zero-sequence unbalance |V0| ÷ |V1| (%)); `Pma` (Phase a magnitude (rebuilt)); `Paa` (Phase a angle (degrees)); `Pmb` (Phase b magnitude (rebuilt)); `Pab` (Phase b angle (degrees)); `Pmc` (Phase c magnitude (rebuilt)); `Pac` (Phase c angle (degrees)); `err` (Round-trip check: largest phasor difference after rebuilding); `If3` (Three-phase fault current, kA); `Islg` (Single line-to-ground fault current (phase a), kA); `Ill` (Line-to-line fault current (phases b-c), kA); `Illgb` (Double line-to-ground fault, phase b current, kA); `Illgc` (Double line-to-ground fault, phase c current, kA); `Illgn` (Double line-to-ground fault, earth return current 3 I0, kA)

### `thevenin-norton`: Thevenin-Norton Equivalent Calculator

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `mode` | Circuit given as | 0 = A source, series R1, shunt R2 and series R3 (divider feeding the load); 1 = Measured open-circuit voltage and short-circuit current | 0 |
| `Vs` | Source voltage Vs (divider circuit) | µV, mV, V, kV, MV, GV | 12 V |
| `R1` | Series resistor R1 (from the source) | mΩ, Ω, kΩ, MΩ, GΩ | 4 Ω |
| `R2` | Shunt resistor R2 (to the common line) | mΩ, Ω, kΩ, MΩ, GΩ | 12 Ω |
| `R3` | Series resistor R3 (to the load terminals) | mΩ, Ω, kΩ, MΩ, GΩ | 2 Ω |
| `Voc` | Open-circuit voltage Voc (measured) | µV, mV, V, kV, MV, GV |  V |
| `Isc` | Short-circuit current Isc (measured) | µA, mA, A, kA, MA |  A |
| `RL` | Load resistance RL | mΩ, Ω, kΩ, MΩ, GΩ | 10 Ω |

Outputs: `Vth` (Thevenin voltage Vth, V); `Rth` (Thevenin resistance Rth, Ω); `In` (Norton current IN, A); `IL` (Load current, A); `VL` (Load voltage, V); `PL` (Load power, W); `Pm` (Maximum power the terminals can deliver, W); `eta` (Share of the equivalent source power reaching the load (%))

### `transformer-vector-group`: Transformer Vector Group Calculator (Dyn11, Yd1, Yy0 and others)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `grp` | Vector group | 0 = Dyn11 (delta / star with neutral, 330° lag = 30° lead); 1 = Dyn1 (delta / star with neutral, 30° lag); 2 = Dyn5 (delta / star with neutral, 150° lag); 3 = Yd1 (star / delta, 30° lag); 4 = Yd11 (star / delta, 330° lag = 30° lead); 5 = Yy0 (star / star, 0°); 6 = Yy6 (star / star, 180°); 7 = Dd0 (delta / delta, 0°); 8 = Dd6 (delta / delta, 180°) | 0 |
| `Vh` | High-voltage line voltage VH (L-L) | µV, mV, V, kV, MV, GV | 11 kV |
| `Vl` | Low-voltage line voltage VL (L-L) | µV, mV, V, kV, MV, GV | 415 V |
| `S` | Rated power S | VA, kVA, MVA | 1000 kVA |
| `grp2` | Compare with a second group (to parallel with) | 9 = None (no comparison); 0 = Dyn11 (delta / star with neutral, 330° lag = 30° lead); 1 = Dyn1 (delta / star with neutral, 30° lag); 2 = Dyn5 (delta / star with neutral, 150° lag); 3 = Yd1 (star / delta, 30° lag); 4 = Yd11 (star / delta, 330° lag = 30° lead); 5 = Yy0 (star / star, 0°); 6 = Yy6 (star / star, 180°); 7 = Dd0 (delta / delta, 0°); 8 = Dd6 (delta / delta, 180°) | 9 |

Outputs: `a` (Line voltage ratio VH / VL); `n` (Turns ratio N1 / N2 (winding voltage ratio)); `clock` (Clock number); `ang` (Low-voltage side lags high-voltage side by (°)); `Vhw` (High-voltage winding voltage, V); `Vlw` (Low-voltage winding voltage, V); `Ih` (High-voltage line current, A); `Il` (Low-voltage line current, A); `Ihw` (High-voltage winding current, A); `Ilw` (Low-voltage winding current, A); `dang` (Phase difference between the two groups (°)); `dv` (Voltage across an open paralleling link (% of the low-voltage line voltage))

### `relay-setting`: Overcurrent Relay Setting Calculator (Pick-up, TMS and High-set)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `curve` | Relay curve (IEC 60255-151) | 0 = Standard inverse (SI): k = 0.14, α = 0.02; 1 = Very inverse (VI): k = 13.5, α = 1; 2 = Extremely inverse (EI): k = 80, α = 2; 3 = Long-time inverse (LTI): k = 120, α = 1 | 0 |
| `IL` | Maximum load current IL | µA, mA, A, kA, MA | 200 A |
| `ctp` | CT primary rating | µA, mA, A, kA, MA | 300 A |
| `cts` | CT secondary rating | 1 = 1 A; 5 = 5 A | 1 |
| `kpu` | Pick-up factor over load current |  | 1.3 |
| `Ifmax` | Maximum fault current at the relay | µA, mA, A, kA, MA | 4000 A |
| `Ifmin` | Minimum fault current at the end of the protected zone | µA, mA, A, kA, MA | 1200 A |
| `tt` | Required operating time at the maximum fault | µs, ms, s, min, h | 0.4 s |
| `tstep` | Relay TMS step (smallest increment) |  | 0.025 |
| `tmax` | Relay maximum TMS |  | 1.5 |
| `Ifd` | Fault current at the next device downstream (for the high-set) | µA, mA, A, kA, MA | 2500 A |
| `ki` | High-set factor over the downstream fault |  | 1.3 |

Outputs: `Is` (Pick-up current Is (primary), A); `Iss` (Pick-up at the relay (CT secondary), A); `plug` (Plug setting (% of CT rating)); `M` (Plug setting multiplier at the maximum fault, Ifmax / Is); `TMS` (Time multiplier setting needed (exact)); `TMSs` (TMS to set (rounded up to the relay step)); `tset` (Operating time at the maximum fault with that TMS, s); `tdiff` (Achieved time minus required time (negative = too fast), s); `Mmin` (Sensitivity at the minimum fault, Ifmin / Is); `tmin` (Operating time at the minimum fault, s); `Ihs` (High-set (instantaneous) pick-up (primary), A); `Ihss` (High-set pick-up at the relay (CT secondary), A)

### `relay-coordination`: Overcurrent Relay Coordination Calculator (Grading Margin and Upstream TMS)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `cd` | Downstream relay curve (IEC 60255-151) | 0 = Standard inverse (SI): k = 0.14, α = 0.02; 1 = Very inverse (VI): k = 13.5, α = 1; 2 = Extremely inverse (EI): k = 80, α = 2; 3 = Long-time inverse (LTI): k = 120, α = 1 | 0 |
| `Isd` | Downstream relay pick-up Is | µA, mA, A, kA, MA | 200 A |
| `TMSd` | Downstream relay TMS |  | 0.1 |
| `cu` | Upstream relay curve (IEC 60255-151) | 0 = Standard inverse (SI): k = 0.14, α = 0.02; 1 = Very inverse (VI): k = 13.5, α = 1; 2 = Extremely inverse (EI): k = 80, α = 2; 3 = Long-time inverse (LTI): k = 120, α = 1 | 0 |
| `Isu` | Upstream relay pick-up Is | µA, mA, A, kA, MA | 300 A |
| `If` | Fault current through both relays (grading fault) | µA, mA, A, kA, MA | 4000 A |
| `Ifl` | Lower fault current to check | µA, mA, A, kA, MA | 1000 A |
| `tm` | Grading margin (coordination time interval) | µs, ms, s, min, h | 0.4 s |

Outputs: `Md` (Downstream plug setting multiplier, If / Isd); `td` (Downstream operating time at the grading fault, s); `treq` (Upstream time required (downstream time + margin), s); `Mu` (Upstream plug setting multiplier, If / Isu); `TMSu` (Upstream TMS needed (exact)); `TMSus` (Upstream TMS to set (next 0.025 above)); `tu` (Upstream operating time with that TMS, s); `marg` (Margin you get at the grading fault, s); `Mdl` (Downstream multiplier at the lower fault, Ifl / Isd); `tdl` (Downstream operating time at the lower fault, s); `Mul` (Upstream multiplier at the lower fault, Ifl / Isu); `tul` (Upstream operating time at the lower fault, s); `margl` (Margin you get at the lower fault, s)

### `ct-burden`: CT Burden Calculator (Lead Resistance, Total VA and Accuracy Limit)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Is` | CT rated secondary current | 1 = 1 A; 5 = 5 A | 5 |
| `Sn` | CT rated burden Sn | VA, kVA, MVA | 30 VA |
| `ALF` | Rated accuracy limit factor (ALF) |  | 20 |
| `Rct` | CT secondary winding resistance Rct | mΩ, Ω, kΩ, MΩ, GΩ | 0.2 Ω |
| `L` | Lead cable length (one way) | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 50 m |
| `A` | Lead cable conductor cross-section | mm², cm², m², ha, km², in², ft², yd², acre, mi², cmil | 2.5 mm² |
| `rho` | Resistivity at 20 °C (Ω·mm²/m) |  | 0.017241 |
| `T` | Lead cable temperature (°C) |  | 20 |
| `alpha` | Temperature coefficient (per °C) |  | 0.00393 |
| `conn` | Lead connection | 2 = Out and back: single-phase, phase-to-phase or earth fault (2 × length); 1 = Balanced three-phase star fault with a common return (1 × length) | 2 |
| `Srelay` | Relay burden at rated current | VA, kVA, MVA | 2 VA |
| `Smeter` | Meter or other series burden at rated current | VA, kVA, MVA | 1 VA |
| `Rc` | Contact and terminal resistance | mΩ, Ω, kΩ, MΩ, GΩ | 0.05 Ω |
| `Ifmax` | Maximum fault current (primary) | µA, mA, A, kA, MA | 4000 A |
| `Ip` | CT primary rating | µA, mA, A, kA, MA | 400 A |

Outputs: `RL` (Lead loop resistance, Ω); `Rr` (Relay burden as resistance, Ω); `Rm` (Meter burden as resistance, Ω); `Rt` (Total external burden (resistance), Ω); `S` (Total external burden, VA); `use` (Share of the rated burden used (%)); `Smar` (Margin to the rated burden, VA); `Sct` (CT internal burden, Is² × Rct, VA); `ALFa` (Actual accuracy limit factor at this burden); `ALFr` (Accuracy limit factor the fault needs, Ifmax / Ip); `ALFm` (Ratio of actual to needed (above 1 is a margin)); `Rmax` (Lead resistance left at the rated burden, Ω); `Lmax` (Longest lead cable (one way) at the rated burden, m)

### `busbar-sizing`: Busbar Sizing Calculator (Load Area, Number of Bars and Short-Circuit Withstand)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `mat` | Busbar material | 1 = Copper (ρ 0.017241 Ω·mm²/m, 8960 kg/m³); 2 = Aluminium (ρ 0.02826 Ω·mm²/m, 2700 kg/m³) | 1 |
| `I` | Load current per phase | µA, mA, A, kA, MA | 2000 A |
| `J` | Design current density J (A/mm²) |  | 1.2 |
| `w` | Bar width | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 100 mm |
| `th` | Bar thickness | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 10 mm |
| `Isc` | Fault current through the busbar | µA, mA, A, kA, MA | 40 kA |
| `tsc` | Fault duration | µs, ms, s, min, h | 0.5 s |
| `k` | Material constant k (A·√s/mm²) |  | 115 |
| `T` | Working temperature (°C) |  | 65 |

Outputs: `Areq` (Cross-section the load needs, I / J, mm²); `Ab` (Area of one bar, mm²); `nL` (Bars for the load (rounded up)); `Asc` (Cross-section the fault needs, Isc × √t / k, mm²); `nS` (Bars for the fault (rounded up)); `n` (Bars to install (the larger of the two)); `Ain` (Installed cross-section, mm²); `Jact` (Actual current density (A/mm²)); `Iw` (Short-circuit withstand of the installed bars, A × k / √t, kA); `scm` (Installed area / area the fault needs (above 1 is a margin)); `mpm` (Mass per metre of the installed bars (kg/m)); `Rm` (DC resistance per metre per phase at the working temperature, mΩ); `Pm` (Loss per metre per phase at the load current (DC), W)

### `ac-dc-equivalent`: AC/DC Equivalent Value Converter (Peak, RMS and Mean Value of a Waveform)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `wave` | Waveform | 1 = Sine wave; 2 = Square wave (symmetrical, ± peak); 3 = Triangle wave (symmetrical, ± peak); 4 = Full-wave rectified sine; 5 = Half-wave rectified sine | 1 |
| `given` | Value you know | 1 = Peak value; 2 = RMS value; 3 = Average value (mean of the absolute value) | 1 |
| `X` | Voltage (or current) value | µV, mV, V, kV, MV, GV | 325 V |
| `R` | Load resistance | mΩ, Ω, kΩ, MΩ, GΩ | 10 Ω |

Outputs: `Vp` (Peak value, V); `Vrms` (RMS value (the equivalent DC value), V); `Vavg` (Average value (mean of the absolute value), V); `ff` (Form factor (RMS / average)); `cf` (Crest factor (peak / RMS)); `Irms` (RMS load current, Vrms / R, A); `P` (Power in the load, Vrms² / R, W); `Ppk` (Power if the peak were taken as DC, Vp² / R, W); `pr` (That power divided by the true power (= crest factor squared)); `Vm` (Reading of an average-responding meter set for sine waves, V); `me` (Error of that meter against the true RMS (%))

### `kirchhoff-solver`: Kirchhoff Circuit Solver (KCL and KVL for a Two-Loop, Three-Branch DC Network)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `E1` | Source E₁ in branch 1 | µV, mV, V, kV, MV, GV | 12 V |
| `R1` | Resistance R₁ of branch 1 | mΩ, Ω, kΩ, MΩ, GΩ | 1 Ω |
| `E2` | Source E₂ in branch 2 | µV, mV, V, kV, MV, GV | 9 V |
| `R2` | Resistance R₂ of branch 2 | mΩ, Ω, kΩ, MΩ, GΩ | 1 Ω |
| `E3` | Source E₃ in branch 3 (usually none) | µV, mV, V, kV, MV, GV | 0 V |
| `R3` | Resistance R₃ of branch 3 (the load) | mΩ, Ω, kΩ, MΩ, GΩ | 2 Ω |

Outputs: `I1` (Current I₁ from source 1 into node A, A); `I2` (Current I₂ from source 2 into node A, A); `I3` (Current I₃ down through branch 3 (node A to B), A); `VA` (Voltage of node A above node B, V); `VR1` (Voltage across R₁ (I₁ R₁), V); `VR2` (Voltage across R₂ (I₂ R₂), V); `VR3` (Voltage across R₃ (I₃ R₃), V); `P1` (Power delivered by source 1 (negative = absorbed), W); `P2` (Power delivered by source 2 (negative = absorbed), W); `P3` (Power delivered by source 3 (negative = absorbed), W); `Pr` (Total power lost in the three resistors, W); `kcl` (Check: current sum at node A, I₁ + I₂ − I₃, A); `kvl` (Check: voltage round the outer loop (not used in the solution), V); `pb` (Check: source power minus resistor power, W)

### `rlc-transient`: RLC Circuit Calculator (Step Response, Damping, Overshoot and Settling Time)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `typ` | Circuit | 1 = Series RLC, voltage step (output: capacitor voltage); 2 = Parallel RLC, current step (output: inductor current) | 1 |
| `R` | Resistance R | mΩ, Ω, kΩ, MΩ, GΩ | 20 Ω |
| `L` | Inductance L | µH, mH, H | 10 mH |
| `C` | Capacitance C | pF, nF, µF, F | 10 µF |
| `A` | Step size (V for series, A for parallel) |  | 10 |
| `t` | Time at which to read the output | µs, ms, s, min, h | 2 ms |

Outputs: `alpha` (Damping coefficient α (1/s)); `w0` (Natural angular frequency ω₀ = 1/√(LC) (rad/s)); `zeta` (Damping ratio ζ = α / ω₀); `Q` (Quality factor Q = 1 / (2ζ)); `f0` (Natural frequency f₀, Hz); `fd` (Damped ringing frequency (underdamped only, else 0), Hz); `Rc` (Resistance that gives critical damping, Ω); `Mp` (Overshoot above the final value (underdamped only, else 0) (%)); `ts` (Settling time to 2% (about 4 / slowest decay rate), ms); `yt` (Output at the chosen time)

### `rc-rl-transient`: RC and RL Time Constant Calculator (Charging, Discharging and Step Response)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `typ` | Circuit and event | 1 = RC, capacitor charging from 0 V through R (output: capacitor voltage); 2 = RC, capacitor discharging through R from a starting voltage (output: capacitor voltage); 3 = RL, voltage step across R and L from zero current (output: inductor current); 4 = RL, inductor current decaying through R from a starting current (output: inductor current) | 1 |
| `R` | Resistance R | mΩ, Ω, kΩ, MΩ, GΩ | 1 kΩ |
| `C` | Capacitance C (RC cases) | pF, nF, µF, F | 1 µF |
| `L` | Inductance L (RL cases) | µH, mH, H | 1 H |
| `V` | Source voltage, or starting capacitor voltage | µV, mV, V, kV, MV, GV | 10 V |
| `I0` | Starting inductor current (RL decay case) | µA, mA, A, kA, MA | 0.01 A |
| `t` | Time at which to read the output | µs, ms, s, min, h | 2 ms |
| `pl` | Level to find the time for, as a percentage of the total change |  | 90 |

Outputs: `tau` (Time constant τ (RC or L/R), ms); `fc` (Corner frequency 1 / (2πτ), Hz); `y0` (Starting value of the output (V for RC, A for RL)); `yfin` (Final value of the output (V for RC, A for RL)); `yt` (Output at the chosen time (V for RC, A for RL)); `pct` (Share of the change completed at that time (%)); `z` (Companion at that time: resistor current (A) for RC, inductor voltage (V) for RL, magnitude); `en` (Energy stored at that time (½CV² or ½LI²), mJ); `tlev` (Time to complete the chosen percentage of the change, ms); `thalf` (Half-time (50% of the change, 0.693 τ), ms); `t1090` (10 to 90% rise or fall time (2.197 τ), ms); `t99` (Time to complete 99% of the change (4.605 τ), ms)

### `mesh-nodal-solver`: Mesh and Nodal Analysis Solver (Bridge Network with a Source, by Mesh Currents or Node Voltages)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `meth` | Method shown | 1 = Mesh analysis (mesh currents); 2 = Nodal analysis (node voltages) | 1 |
| `E` | Source voltage E | µV, mV, V, kV, MV, GV | 24 V |
| `Rs` | Source resistance Rs | mΩ, Ω, kΩ, MΩ, GΩ | 1 Ω |
| `R1` | Resistor R₁ (A to B) | mΩ, Ω, kΩ, MΩ, GΩ | 10 Ω |
| `R2` | Resistor R₂ (B to D) | mΩ, Ω, kΩ, MΩ, GΩ | 20 Ω |
| `R3` | Resistor R₃ (A to C) | mΩ, Ω, kΩ, MΩ, GΩ | 30 Ω |
| `R4` | Resistor R₄ (C to D) | mΩ, Ω, kΩ, MΩ, GΩ | 40 Ω |
| `R5` | Bridge resistor R₅ (B to C) | mΩ, Ω, kΩ, MΩ, GΩ | 50 Ω |

Outputs: `VA` (Voltage of node A above D (bridge input), V); `VB` (Voltage of node B above D, V); `VC` (Voltage of node C above D, V); `Vbc` (Voltage across R₅ (V_B − V_C), V); `Is` (Current drawn from the source, A); `I1` (Current in R₁ (A to B), A); `I2` (Current in R₂ (B to D), A); `I3` (Current in R₃ (A to C), A); `I4` (Current in R₄ (C to D), A); `I5` (Current in R₅ (B to C), A); `Req` (Resistance of the bridge seen at A and D, Ω); `Pin` (Power delivered by the source, W); `Pr` (Power lost in Rs and the five resistors, W); `dI` (Check: largest current difference between the mesh and nodal solutions, A); `kvl` (Check: voltage round the outer loop E, Rs, R₁, R₂, V); `pb` (Check: source power minus resistor power, W)

### `transformer-turns-ratio`: Transformer Turns Ratio Calculator (Voltage Ratio, Turns, Currents and Referred Impedance)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `phase` | Phases | 3 = Three-phase; 1 = Single-phase | 3 |
| `hv` | Primary winding connection (three-phase only) | 2 = Delta; 1 = Star | 2 |
| `lv` | Secondary winding connection (three-phase only) | 1 = Star; 2 = Delta | 1 |
| `Vp` | Primary rated voltage | µV, mV, V, kV, MV, GV | 11000 V |
| `Vs` | Secondary rated voltage | µV, mV, V, kV, MV, GV | 415 V |
| `S` | Rated apparent power | VA, kVA, MVA | 1000 kVA |
| `Np` | Primary turns per phase |  | 2295 |
| `ZL` | Load impedance across one secondary winding | mΩ, Ω, kΩ, MΩ, GΩ | 0.5 Ω |

Outputs: `av` (Line voltage ratio Vp / Vs); `at` (Turns ratio per phase (winding voltage ratio)); `Ns` (Secondary turns per phase (exact)); `Nr` (Secondary turns to build (nearest whole turn)); `err` (Ratio error from rounding the turns (%)); `vt` (Volts per turn, V); `Ip` (Rated primary line current, A); `Is` (Rated secondary line current, A); `Ipw` (Primary winding current, A); `Isw` (Secondary winding current, A); `Zr` (Load impedance referred to one primary winding, Ω); `pb` (Check: primary kVA minus secondary kVA, kVA)

### `plant-load-flow`: Plant Load Flow Planner (Utility to Loads)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Vs` | Plant bus voltage (L-L) | µV, mV, V, kV, MV, GV | 415 V |
| `Vh` | Utility supply voltage (L-L) | µV, mV, V, kV, MV, GV | 11 kV |
| `St` | Main transformer rating | VA, kVA, MVA | 1000 kVA |
| `uk` | Transformer impedance (%) |  | 5 |
| `Pcu` | Transformer full-load copper loss | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 10.5 kW |
| `P0` | Transformer no-load (iron) loss | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 1.7 kW |
| `i0` | Transformer no-load current (%) |  | 1 |
| `Pc1` | Group 1 connected load (for example process motors) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 400 kW |
| `df1` | Group 1 demand factor |  | 0.75 |
| `pf1` | Group 1 power factor |  | 0.85 |
| `Pc2` | Group 2 connected load (for example HVAC and compressors) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 150 kW |
| `df2` | Group 2 demand factor |  | 0.6 |
| `pf2` | Group 2 power factor |  | 0.8 |
| `Pc3` | Group 3 connected load (for example heating) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 100 kW |
| `df3` | Group 3 demand factor |  | 0.9 |
| `pf3` | Group 3 power factor |  | 1 |
| `Pc4` | Group 4 connected load (for example lighting and small power) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 60 kW |
| `df4` | Group 4 demand factor |  | 0.8 |
| `pf4` | Group 4 power factor |  | 0.9 |
| `kc` | Coincidence factor between groups |  | 0.9 |
| `Qc` | Capacitor bank on the plant bus | VAR, kVAR, MVAR | 100 kVAR |
| `pft` | Target power factor at the utility |  | 0.95 |

Outputs: `P1` (Group 1 demand, kW); `S1` (Group 1 apparent demand, kVA); `P2` (Group 2 demand, kW); `S2` (Group 2 apparent demand, kVA); `P3` (Group 3 demand, kW); `S3` (Group 3 apparent demand, kVA); `P4` (Group 4 demand, kW); `S4` (Group 4 apparent demand, kVA); `Pd` (Plant demand (after coincidence), kW); `Qd` (Plant reactive demand (before capacitors), kVAR); `pfd` (Plant power factor before capacitors); `Qn` (Net reactive power at the plant bus, kVAR); `Sn` (Plant bus apparent power, kVA); `pfn` (Power factor at the plant bus); `In` (Plant bus line current, A); `x` (Transformer loading (% of rating)); `Sp` (Spare transformer capacity, kVA); `Pl` (Transformer real power loss, kW); `Ql` (Transformer reactive power loss, kVAR); `Pu` (Real power from the utility, kW); `Qu` (Reactive power from the utility, kVAR); `Su` (Apparent power from the utility, kVA); `pfu` (Power factor at the utility); `Iu` (Utility incoming line current, A); `Qx` (Extra capacitor needed for the target power factor, kVAR)

### `power-electronics-converter`: Power Converter Calculator (Rectifier, Inverter and DC-DC Converter)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `mode` | What to calculate | 0 = Rectifier (AC to DC, diodes, resistive load); 1 = Inverter (DC to AC output voltage); 2 = DC-DC converter (buck, boost, buck-boost) | 0 |
| `rt` | Rectifier circuit | 0 = Single-phase half-wave; 1 = Single-phase full-wave bridge; 2 = Three-phase half-wave (3-pulse); 3 = Three-phase full bridge (6-pulse) | 1 |
| `Vs` | AC supply voltage, RMS (rectifier) | µV, mV, V, kV, MV, GV | 230 V |
| `f` | Supply frequency (rectifier) | Hz, kHz, MHz, GHz, THz, rad/s | 50 Hz |
| `RL` | Load resistance (rectifier) | mΩ, Ω, kΩ, MΩ, GΩ | 10 Ω |
| `Cf` | Smoothing capacitor (rectifier, optional) | pF, nF, µF, F |  µF |
| `it` | Inverter circuit and control | 0 = Single-phase full bridge, square wave; 1 = Single-phase full bridge, sine PWM; 2 = Three-phase bridge, six-step (180° conduction); 3 = Three-phase bridge, sine PWM; 4 = Three-phase bridge, PWM with third-harmonic injection or space-vector | 3 |
| `Vd` | DC bus voltage (inverter) | µV, mV, V, kV, MV, GV | 600 V |
| `ma` | Modulation index ma (PWM inverter) |  | 0.9 |
| `fo` | Output frequency (inverter) | Hz, kHz, MHz, GHz, THz, rad/s | 50 Hz |
| `tp` | DC-DC converter type | 0 = Buck (step-down); 1 = Boost (step-up); 2 = Buck-boost (inverting, output magnitude) | 0 |
| `Vin` | Input voltage (DC-DC) | µV, mV, V, kV, MV, GV | 48 V |
| `Vout` | Output voltage, magnitude (DC-DC) | µV, mV, V, kV, MV, GV | 12 V |
| `Iout` | Output (load) current (DC-DC) | µA, mA, A, kA, MA | 5 A |
| `fsw` | Switching frequency (DC-DC) | Hz, kHz, MHz, GHz, THz, rad/s | 100 kHz |
| `rl` | Inductor ripple current, % of its average current (DC-DC) |  | 30 |
| `rv` | Output voltage ripple, % of output (DC-DC) |  | 1 |
| `eta` | Converter efficiency (DC-DC) |  | 95 |

Outputs: `Vm` (Peak voltage of the conducting source, V); `Vdc` (Average (DC) output voltage, V); `Vro` (RMS output voltage, V); `Idc` (DC load current, A); `Pdc` (DC output power, W); `er` (Rectification efficiency Pdc ÷ Pac (%)); `FF` (Form factor Vrms ÷ Vdc); `RF` (Ripple factor (%)); `fr` (Ripple frequency, Hz); `PIV` (Peak inverse voltage across each diode, V); `Ida` (Average current per diode (resistive load, no capacitor), A); `Idr` (RMS current per diode (resistive load, no capacitor), A); `Vfl` (Output voltage with the smoothing capacitor (average), V); `Ifl` (Load current with the smoothing capacitor, A); `Vrpp` (Output ripple with the capacitor (peak to peak), V); `V1` (Fundamental output voltage, RMS (three-phase: line-to-line), V); `V1p` (Fundamental phase voltage, RMS (three-phase), V); `Vot` (Total RMS output voltage including harmonics, V); `THD` (Total harmonic distortion of the output voltage (%)); `ut` (DC bus utilisation V1 ÷ Vd); `vf` (Volts per hertz of the fundamental); `D` (Duty cycle D (ideal)); `IL` (Average inductor current, A); `dIL` (Inductor ripple current (peak to peak), A); `Ipk` (Peak inductor and switch current, A); `Lm` (Inductance needed, µH); `Cm` (Output capacitance needed (ideal capacitor), µF); `Vst` (Voltage across the switch and diode when off, V); `Iin` (Average input current, A); `Pl` (Converter loss, W)

### `dc-machine-emf-torque`: DC Machine EMF and Torque Calculator (Motor or Generator)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `op` | Operation | 1 = Motor: voltage given, find speed; 0 = Generator: speed given, find terminal voltage | 1 |
| `P` | Number of poles P |  | 4 |
| `Z` | Total armature conductors Z |  | 720 |
| `wind` | Armature winding | 0 = Lap (A = P parallel paths); 1 = Wave (A = 2 parallel paths) | 0 |
| `phi` | Flux per pole Φ (mWb) |  | 12 |
| `V` | Terminal voltage V (used for a motor) | µV, mV, V, kV, MV, GV | 230 V |
| `N` | Speed N (used for a generator) | rpm |  rpm |
| `Ia` | Armature current Ia | µA, mA, A, kA, MA | 40 A |
| `Ra` | Armature circuit resistance Ra | mΩ, Ω, kΩ, MΩ, GΩ | 0.25 Ω |
| `Vb` | Total brush contact drop | µV, mV, V, kV, MV, GV | 2 V |

Outputs: `A` (Parallel paths A); `Ea` (Generated EMF Ea (back EMF for a motor), V); `Nr` (Speed N, rpm); `w` (Angular speed ω (rad/s)); `Vt` (Terminal voltage V, V); `Te` (Electromagnetic torque Te, N·m); `Pd` (Developed power Ea × Ia, kW); `Pcu` (Armature copper loss Ia² Ra, kW); `Pbr` (Brush contact loss Vb × Ia, kW); `Pt` (Terminal power V × Ia, kW); `eff` (Armature-circuit efficiency (%))

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

### `matrix-calculator`: Determinant and Inverse Calculator (2×2 and 3×3)

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

### `boolean-logic`: Boolean Logic Tool (Truth Table, Minterms, Prime Implicants and Minimal SOP / POS for 2 to 4 Variables)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `n` | Number of inputs (variables) | 2 = 2 inputs (A, B); 3 = 3 inputs (A, B, C); 4 = 4 inputs (A, B, C, D) | 3 |
| `fn` | Function | 0 = Custom: any function, from its truth-table number below; 1 = AND (1 when every input is 1); 2 = OR (1 when any input is 1); 3 = NAND (0 only when every input is 1); 4 = NOR (1 only when every input is 0); 5 = XOR (1 when an odd number of inputs are 1); 6 = XNOR (1 when an even number of inputs are 1); 7 = Majority (1 when more than half of the inputs are 1) | 0 |
| `tt` | Truth-table number (Custom function only) |  | 232 |
| `xa` | Input A | 0 = 0; 1 = 1 | 1 |
| `xb` | Input B | 0 = 0; 1 = 1 | 0 |
| `xc` | Input C (3 or 4 inputs) | 0 = 0; 1 = 1 | 1 |
| `xd` | Input D (4 inputs) | 0 = 0; 1 = 1 | 0 |

Outputs: `F` (Output F at the chosen inputs (0 or 1)); `ones` (Minterms (rows where F = 1)); `sopT` (Minimal SOP: product terms); `sopL` (Minimal SOP: literals); `posT` (Minimal POS: sum terms); `posL` (Minimal POS: literals); `pi` (Prime implicants of F); `epi` (Essential prime implicants of F); `zeros` (Maxterms (rows where F = 0)); `dep` (Inputs the function actually depends on); `kind` (Kind: 0 depends on its inputs, 1 always 0, 2 always 1); `row` (Row number of the chosen inputs (A is the most significant bit)); `ttn` (Truth-table number of F (decimal)); `ttc` (Truth-table number of the complement F′)

### `solar-inverter-sizing`: Solar Inverter Sizing Calculator (DC to AC Ratio, String Voltage Windows, Input Current and Clipping)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Pm` | Module rated power (STC) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 550 W |
| `Ns` | Modules in series per string |  | 12 |
| `Np` | Strings in the array (in parallel) |  | 2 |
| `Voc` | Module open-circuit voltage (STC) | µV, mV, V, kV, MV, GV | 49.5 V |
| `tcVoc` | Voc temperature coefficient (%/°C) |  | -0.28 |
| `Vmp` | Module maximum-power voltage (STC) | µV, mV, V, kV, MV, GV | 41.5 V |
| `tcVmp` | Vmp temperature coefficient (%/°C) |  | -0.3 |
| `Isc` | Module short-circuit current (STC) | µA, mA, A, kA, MA | 13.9 A |
| `Tmin` | Lowest cell temperature (°C) |  | -5 |
| `Tmax` | Highest cell temperature (°C) |  | 70 |
| `Pac` | Inverter AC rating | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 10 kW |
| `Vdcmax` | Inverter maximum DC input voltage | µV, mV, V, kV, MV, GV | 1000 V |
| `Vlo` | MPPT window: lowest voltage | µV, mV, V, kV, MV, GV | 200 V |
| `Vhi` | MPPT window: highest voltage | µV, mV, V, kV, MV, GV | 800 V |
| `nm` | MPPT inputs |  | 2 |
| `Ilim` | Maximum short-circuit current per MPPT input | µA, mA, A, kA, MA | 18 A |
| `eta` | Inverter efficiency at high load (fraction) |  | 0.98 |
| `k` | Peak array output as a fraction of its STC rating |  | 0.85 |
| `rt` | Target DC to AC ratio |  | 1.25 |

Outputs: `Pdc` (Array rating (modules × rated power), kW); `nmod` (Number of modules); `r` (DC to AC ratio (array / inverter)); `Pt` (Inverter AC rating for the target ratio, kW); `Pa` (Largest array for this inverter at the target ratio, kW); `Vc` (String open-circuit voltage at the lowest temperature, V); `Nmax` (Most modules per string for the maximum DC voltage); `Vh` (String maximum-power voltage at the highest temperature, V); `Vk` (String maximum-power voltage at the lowest temperature, V); `spi` (Strings on the busiest MPPT input); `Iin` (Short-circuit current on that input, A); `Pk` (AC output at the assumed peak (before clipping), kW); `ld` (Inverter loading at the assumed peak (%)); `clip` (Share of peak power clipped (%)); `thr` (Array output, as % of its rating, at which the inverter reaches its rating)

### `hybrid-system-sizing`: Hybrid System Sizing Calculator (Solar PV, Battery, Inverter and Generator from a Daily Load)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `E` | Daily energy use | µJ, mJ, J, kJ, MJ, kcal, BTU, Wh, kWh, MWh, eV, keV, MeV, cal, GeV | 20 kWh |
| `Ppk` | Peak load | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 5 kW |
| `fn` | Share of the solar-served energy used after dark or without sun |  | 0.6 |
| `fg` | Share of the daily energy supplied by the generator |  | 0.1 |
| `psh` | Peak sun hours per day |  | 5 |
| `PR` | Performance ratio of the array to the DC bus |  | 0.75 |
| `etai` | Inverter efficiency |  | 0.95 |
| `rt` | Battery round-trip efficiency |  | 0.9 |
| `DoD` | Usable depth of discharge |  | 0.8 |
| `Da` | Days of autonomy |  | 1 |
| `Dr` | Days allowed to recharge the autonomy reserve |  | 3 |
| `Vb` | Battery bank voltage | µV, mV, V, kV, MV, GV | 48 V |
| `Pm` | Module rated power (STC) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 550 W |
| `ms` | Sizing margin on the peak load |  | 1.25 |
| `Cm` | Battery maximum discharge rate (C) |  | 0.5 |
| `lg` | Generator average loading while running (fraction of its rating) |  | 0.7 |
| `sfc` | Generator fuel use (litres per kWh) |  | 0.35 |

Outputs: `Es` (Energy served by solar and battery per day, kWh); `En` (Part of it passing through the battery, kWh); `Eg` (Energy supplied by the generator per day, kWh); `Edc` (Daily DC energy the array must supply (before the reserve recharge), kWh); `Edr` (Daily DC energy including the reserve recharge, kWh); `Ppv` (Array rating required, kW); `nmod` (Modules (whole number)); `Parr` (Array rating installed, kW); `Yd` (Daily DC energy from the installed array, kWh); `Bu` (Battery usable energy required, kWh); `Bn` (Battery nominal capacity required, kWh); `Ah` (Battery nominal capacity at the bank voltage, Ah); `cyc` (Daily battery cycle depth (% of nominal capacity)); `Cn` (Battery discharge rate at the peak load (C)); `drr` (Days to recharge the reserve with the installed array); `Pinv` (Inverter rating (peak load × margin), kW); `Pgen` (Generator rating (peak load × margin), kW); `hg` (Generator running hours per day); `fuel` (Generator fuel per day (litres))

### `bess-energy-power`: BESS Energy and Power Calculator (MWh, MW, Round-Trip Efficiency and C-Rate)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Pd` | Power to deliver at the connection point (AC) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 1000 kW |
| `Td` | Duration at that power | µs, ms, s, min, h | 4 h |
| `rt` | AC round-trip efficiency |  | 0.88 |
| `DoD` | Usable depth of discharge |  | 0.9 |
| `SOH` | Capacity at end of life (share of nameplate) |  | 0.8 |
| `Tc` | Time available to recharge | µs, ms, s, min, h | 4 h |
| `Cm` | Battery maximum C-rate (1/h) |  | 0.5 |
| `pf` | Converter power factor at rated output |  | 1 |
| `n` | Full cycles per day |  | 1 |
| `Ncyc` | Cycle life at this depth of discharge |  | 6000 |

Outputs: `Eout` (Energy delivered per discharge (AC), kWh); `Edc` (Energy drawn from the battery per discharge (DC), kWh); `Ein` (Energy taken from the grid to recharge (AC), kWh); `Eloss` (Energy lost per cycle, kWh); `Enom` (Nameplate energy required (holds the duration at end of life), kWh); `Ebol` (Usable energy when new, kWh); `Ehr` (Nameplate energy to rated power ratio (hours)); `Pdc` (Battery DC power at discharge, kW); `Cd` (Discharge C-rate (1/h)); `Pch` (Grid power to recharge in the time given (AC), kW); `Cc` (Charge C-rate (1/h)); `S` (Converter rating (power / power factor), kVA); `Eyr` (Energy delivered per year, MWh); `Lyr` (Energy lost per year, MWh); `yrs` (Years to reach the cycle life)

### `ev-energy-consumption`: EV Energy Consumption Calculator (Wh/km, kWh/100 km and Running Cost)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `m` | Vehicle mass with driver and load (kg) |  | 1800 |
| `v` | Constant speed | m/s, km/h, mph, kn | 90 km/h |
| `Cd` | Drag coefficient Cd |  | 0.28 |
| `A` | Frontal area | mm², cm², m², ha, km², in², ft², yd², acre, mi², cmil | 2.3 m² |
| `Crr` | Rolling resistance coefficient Crr |  | 0.01 |
| `rho` | Air density (kg/m³) |  | 1.2 |
| `gr` | Road grade (%, uphill positive) |  | 0 |
| `etad` | Drivetrain efficiency, battery to wheels |  | 0.88 |
| `etar` | Regeneration efficiency, wheels to battery |  | 0.6 |
| `Pa` | Auxiliary load (heating, cooling, electronics) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 0.5 kW |
| `etac` | Charging efficiency, grid to battery |  | 0.9 |
| `D` | Trip distance | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 100 km |
| `Dyr` | Distance per year | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 15000 km |
| `price` | Electricity price per kWh (any currency) |  | 0.15 |

Outputs: `Fr` (Rolling resistance force (N)); `Fa` (Air drag force (N)); `Fg` (Grade force (negative downhill) (N)); `Ft` (Total force at the wheels (N)); `ash` (Air drag as a share of rolling plus air resistance (%)); `Pw` (Power at the wheels, kW); `Pb` (Battery power (drive plus auxiliary), kW); `Ekm` (Energy per km at the battery (Wh/km)); `Egr` (Energy per km from the grid (Wh/km)); `E100` (Consumption at the battery (kWh/100 km)); `E100g` (Consumption from the grid (kWh/100 km)); `kmkwh` (Distance per kWh from the grid (km/kWh)); `mikwh` (Distance per kWh from the grid (miles/kWh)); `Tt` (Trip time, h); `Etb` (Trip energy at the battery, kWh); `Etg` (Trip energy from the grid, kWh); `Eyr` (Energy from the grid per year, kWh); `Cyr` (Running cost per year); `C100` (Running cost per 100 km)

### `ev-range`: EV Range Estimator (Pack Voltage, Capacity, Usable Energy and Driving Range)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `ns` | Cells in series |  | 96 |
| `np` | Cells in parallel (per series group) |  | 2 |
| `Vc` | Cell nominal voltage (V) |  | 3.7 |
| `Qc` | Cell capacity | mAh, Ah, kAh, C, mC, kC | 100 Ah |
| `soh` | State of health (% of rated capacity) |  | 95 |
| `tf` | Temperature capacity factor (% of the 20 °C capacity) |  | 90 |
| `s0` | Starting state of charge (%) |  | 95 |
| `s1` | Reserve to keep at the end (%) |  | 10 |
| `E` | Driving consumption at the battery (Wh/km) |  | 160 |
| `Pa` | Auxiliary load (heating, cooling, electronics) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 1 kW |
| `v` | Average speed | m/s, km/h, mph, kn | 80 km/h |
| `D` | Trip distance | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 250 km |

Outputs: `Vp` (Pack nominal voltage, V); `Qp` (Pack capacity, Ah); `Ncell` (Cells in the pack); `Enom` (Pack nominal energy (new, at the reference temperature), kWh); `Eav` (Energy available at this health and temperature (100% to 0%), kWh); `Euse` (Usable energy between the start and the reserve, kWh); `Eaux` (Auxiliary energy per km (Wh/km)); `Etot` (Total consumption at the battery (Wh/km)); `R` (Range to the reserve, km); `Rmi` (Range to the reserve (miles)); `Rfull` (Range from 100% to 0% at this health and temperature, km); `Rnom` (Range of the new pack with no auxiliary load, 100% to 0%, km); `Rloss` (Range lost to ageing, cold, reserve, start charge and auxiliaries (%)); `kmpct` (Distance per 1% of charge (km)); `Tr` (Driving time to the reserve, h); `Pb` (Average battery power at this speed, kW); `Crate` (Average discharge rate (C, per hour)); `Etr` (Energy for the trip at the battery, kWh); `Sneed` (Charge needed for the trip (% of the available energy)); `Sarr` (Charge on arrival (%)); `Mk` (Distance margin over the trip (negative: short by), km)

### `wavelength`: Wavelength Calculator (Frequency to Wavelength, Velocity Factor, Wave Impedance and Electrical Length)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `mode` | What to calculate | 1 = Wavelength from frequency; 2 = Frequency from wavelength | 1 |
| `med` | How the medium is given | 1 = Relative permittivity and relative permeability (free space: 1 and 1); 2 = Velocity factor (a cable or line) | 1 |
| `f` | Frequency (mode 1) | Hz, kHz, MHz, GHz, THz, rad/s | 100 MHz |
| `lam` | Wavelength in the medium (mode 2) | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 3 m |
| `er` | Relative permittivity εr (medium: permittivity and permeability) |  | 1 |
| `mur` | Relative permeability μr (medium: permittivity and permeability) |  | 1 |
| `vf` | Velocity factor (medium: velocity factor) |  | 0.66 |
| `L` | Physical length to express in wavelengths (0 to skip) | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 1.5 m |

Outputs: `f` (Frequency, MHz); `lam` (Wavelength in the medium, m); `lam0` (Wavelength in free space at this frequency, m); `v` (Speed of the wave in the medium, m/s); `VF` (Velocity factor (speed as a fraction of the speed of light)); `n` (Refractive index n (speed of light over speed in the medium)); `T` (Period, µs); `k` (Wave number k = 2π / wavelength (rad/m)); `half` (Half-wave length (λ / 2), m); `quarter` (Quarter-wave length (λ / 4), m); `eta` (Wave impedance of the medium, Ω); `Lw` (Physical length as a fraction of the wavelength); `Ldeg` (Electrical length (degrees))

### `contact-resistance`: Contact Resistance Calculator (Constriction and Film Resistance, Voltage Drop and Spot Heating)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `mode` | What to calculate | 1 = Resistance from contact force and hardness (Holm); 2 = Resistance from a measured voltage drop and current | 1 |
| `rho1` | Resistivity of contact member 1 | Ω·m, Ω·cm | 1.68e-8 Ω·m |
| `rho2` | Resistivity of contact member 2 | Ω·m, Ω·cm | 1.68e-8 Ω·m |
| `F` | Contact force (N) (mode 1) |  | 100 |
| `H` | Hardness of the softer member (MPa) (mode 1) |  | 1000 |
| `n` | Number of contact spots (mode 1) |  | 1 |
| `sf` | Film resistance per unit area (mΩ·mm²) (mode 1) |  | 0 |
| `I` | Current through the contact | µA, mA, A, kA, MA | 100 A |
| `Um` | Measured voltage drop across the contact (mode 2) | µV, mV, V, kV, MV, GV | 5 mV |
| `Tb` | Temperature of the bulk metal beside the contact (°C) |  | 30 |
| `Ts` | Softening temperature of the contact metal (°C) |  | 190 |
| `Tm` | Melting temperature of the contact metal (°C) |  | 1085 |
| `Rl` | Resistance limit to check against (µΩ, 0 to skip) |  | 0 |

Outputs: `A` (True contact area A = F / H (mm²), mm²); `a` (Radius of each contact spot (µm)); `Rc` (Constriction resistance (µΩ)); `Rf` (Film resistance (µΩ)); `R` (Total contact resistance (µΩ)); `aeq` (Radius of the single clean spot that gives this resistance (µm)); `U` (Voltage drop across the contact, mV); `P` (Power lost in the contact, W); `Tsp` (Temperature of the hottest spot (°C)); `dT` (Spot temperature above the bulk metal (K)); `Us` (Contact voltage that brings the spot to the softening temperature, mV); `Um` (Contact voltage that brings the spot to the melting temperature, mV); `Is` (Current at which the spot reaches the softening temperature, A); `Im` (Current at which the spot reaches the melting temperature, A); `ratio` (Total resistance divided by the limit)

### `equipment-loss`: Equipment Loss Calculator (Transformer, Motor and Cable Energy Loss and Cost)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `S` | Transformer rating | VA, kVA, MVA | 1000 kVA |
| `Pfe` | Transformer no-load (iron) loss | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 1.7 kW |
| `Pcu` | Transformer full-load (copper) loss | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 10.5 kW |
| `x` | Transformer average loading (fraction of rating) |  | 0.6 |
| `pf` | Power factor |  | 0.9 |
| `Hte` | Transformer energised hours per year |  | 8760 |
| `Htl` | Transformer hours per year at this loading |  | 6000 |
| `Pr` | Motor rated shaft output | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 55 kW |
| `etar` | Motor efficiency at full load (%) |  | 93 |
| `fs` | Motor fixed losses as a share of the full-load loss (%) |  | 35 |
| `y` | Motor shaft load (% of rated) |  | 75 |
| `Hm` | Motor running hours per year |  | 6000 |
| `I` | Cable load current | µA, mA, A, kA, MA | 100 A |
| `L` | Cable route length | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 200 m |
| `R` | Cable conductor resistance | Ω/km, mΩ/m, Ω/m | 0.2 Ω/km |
| `V` | Cable system voltage (L-L) | µV, mV, V, kV, MV, GV | 400 V |
| `phase` | Phase | 3 = Three-phase; 1 = Single-phase | 3 |
| `Hc` | Cable carrying hours per year |  | 6000 |
| `tar` | Energy tariff (per kWh) |  | 8 |

Outputs: `Ptfe` (Transformer iron loss, kW); `Ptcu` (Transformer copper loss at this loading, kW); `Pt` (Transformer total loss at this loading, kW); `ett` (Transformer efficiency at this loading (%)); `Pmf` (Motor fixed loss, kW); `Pmv` (Motor load-dependent loss at this load, kW); `Pm` (Motor total loss at this load, kW); `etm` (Motor efficiency at this load (%)); `Pc` (Cable loss, kW); `pcl` (Cable loss as a share of the power it carries (%)); `Ptot` (Total loss of the three at these loads (all running together), kW); `Et` (Transformer energy lost per year, kWh); `Em` (Motor energy lost per year, kWh); `Ec` (Cable energy lost per year, kWh); `Etot` (Total energy lost per year, kWh); `sT` (Transformer share of the yearly loss (%)); `sM` (Motor share of the yearly loss (%)); `sC` (Cable share of the yearly loss (%)); `fx` (Share of the yearly loss that is fixed (transformer iron, motor core and friction) (%)); `cost` (Cost of the yearly loss)

### `calibration-error`: Calibration Error Calculator (As-Found and As-Left Error, Zero and Span Shift, Test Uncertainty Ratio)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `lo` | Instrument range low value (0% of span) |  | 0 |
| `hi` | Instrument range high value (100% of span) |  | 10 |
| `tol` | Calibration tolerance (± % of span) |  | 0.5 |
| `unc` | Reference standard accuracy (± % of span, 0 to skip) |  | 0.05 |
| `n` | Number of test points | 3 = Three points; 4 = Four points; 5 = Five points | 5 |
| `p1` | Point 1: applied value (% of span) |  | 0 |
| `a1` | Point 1: as-found reading |  | 0.02 |
| `b1` | Point 1: as-left reading |  | 0 |
| `p2` | Point 2: applied value (% of span) |  | 25 |
| `a2` | Point 2: as-found reading |  | 2.54 |
| `b2` | Point 2: as-left reading |  | 2.51 |
| `p3` | Point 3: applied value (% of span) |  | 50 |
| `a3` | Point 3: as-found reading |  | 5.08 |
| `b3` | Point 3: as-left reading |  | 5.01 |
| `p4` | Point 4: applied value (% of span) |  | 75 |
| `a4` | Point 4: as-found reading |  | 7.62 |
| `b4` | Point 4: as-left reading |  | 7.5 |
| `p5` | Point 5: applied value (% of span) |  | 100 |
| `a5` | Point 5: as-found reading |  | 10.14 |
| `b5` | Point 5: as-left reading |  | 10.01 |

Outputs: `f1` (Point 1 as-found error (% of span)); `f2` (Point 2 as-found error (% of span)); `f3` (Point 3 as-found error (% of span)); `f4` (Point 4 as-found error (% of span)); `f5` (Point 5 as-found error (% of span)); `l1` (Point 1 as-left error (% of span)); `l2` (Point 2 as-left error (% of span)); `l3` (Point 3 as-left error (% of span)); `l4` (Point 4 as-left error (% of span)); `l5` (Point 5 as-left error (% of span)); `fm` (Largest as-found error (% of span, magnitude)); `fmu` (Largest as-found error (in the range unit, magnitude)); `wf` (Point with the largest as-found error); `lm` (Largest as-left error (% of span, magnitude)); `nbf` (As-found points outside tolerance); `nbl` (As-left points outside tolerance); `z` (Zero error from the as-found line (% of span at 0%)); `sp` (Span error from the as-found line (change in error from 0% to 100%, % of span)); `nonlin` (Error left after a zero and span adjustment (largest distance from the line, % of span)); `tur` (Test uncertainty ratio (tolerance : reference accuracy))

### `electric-potential`: Electric Potential Calculator (Point Charges, Potential at a Point and Energy of the Group)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `n` | Number of point charges | 1 = One charge; 2 = Two charges; 3 = Three charges | 3 |
| `er` | Relative permittivity εr of the medium |  | 1 |
| `q1` | Charge 1 | nC, µC, mC, C, e | 4 µC |
| `x1` | Charge 1 position x | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 0 m |
| `y1` | Charge 1 position y | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 0 m |
| `q2` | Charge 2 | nC, µC, mC, C, e | -2 µC |
| `x2` | Charge 2 position x | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 0.4 m |
| `y2` | Charge 2 position y | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 0 m |
| `q3` | Charge 3 | nC, µC, mC, C, e | 3 µC |
| `x3` | Charge 3 position x | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 0 m |
| `y3` | Charge 3 position y | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 0.3 m |
| `px` | Field point position x | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 0.2 m |
| `py` | Field point position y | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 0.15 m |
| `q0` | Test charge q0 (for the work) | nC, µC, mC, C, e | 1 µC |

Outputs: `r1` (Distance from charge 1, m); `r2` (Distance from charge 2, m); `r3` (Distance from charge 3, m); `v1` (Potential from charge 1, V); `v2` (Potential from charge 2, V); `v3` (Potential from charge 3, V); `V` (Total potential at the field point, V); `W` (Work to bring the test charge from infinity, J); `U` (Electrostatic energy of the charges themselves, J); `Qn` (Net charge, µC)

### `electric-field`: Electric Field Calculator (Point Charges, Field Vector at a Point and Force on a Test Charge)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `n` | Number of point charges | 1 = One charge; 2 = Two charges; 3 = Three charges | 3 |
| `er` | Relative permittivity εr of the medium |  | 1 |
| `q1` | Charge 1 | nC, µC, mC, C, e | 4 µC |
| `x1` | Charge 1 position x | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 0 m |
| `y1` | Charge 1 position y | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 0 m |
| `q2` | Charge 2 | nC, µC, mC, C, e | -2 µC |
| `x2` | Charge 2 position x | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 0.4 m |
| `y2` | Charge 2 position y | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 0 m |
| `q3` | Charge 3 | nC, µC, mC, C, e | 3 µC |
| `x3` | Charge 3 position x | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 0 m |
| `y3` | Charge 3 position y | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 0.3 m |
| `px` | Field point position x | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 0.2 m |
| `py` | Field point position y | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 0.15 m |
| `q0` | Test charge q0 (for the force) | nC, µC, mC, C, e | 1 µC |

Outputs: `r1` (Distance from charge 1, m); `r2` (Distance from charge 2, m); `r3` (Distance from charge 3, m); `E1` (Field strength from charge 1 (V/m)); `E2` (Field strength from charge 2 (V/m)); `E3` (Field strength from charge 3 (V/m)); `Ex` (Net field, x component (V/m)); `Ey` (Net field, y component (V/m)); `E` (Net field magnitude (V/m)); `ang` (Direction of the net field (degrees from the +x axis)); `F` (Force on the test charge (N)); `Fang` (Direction of the force on the test charge (degrees from the +x axis))

### `reliability-indices`: Reliability Indices Calculator (SAIFI, SAIDI, CAIDI, ASAI and Energy Not Supplied from Interruption Records)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `NT` | Total customers served |  | 20000 |
| `T` | Reporting period | µs, ms, s, min, h | 8760 h |
| `n` | Number of interruption events | 1 = One event; 2 = Two events; 3 = Three events; 4 = Four events; 5 = Five events | 5 |
| `c1` | Event 1: customers interrupted |  | 1200 |
| `d1` | Event 1: duration | µs, ms, s, min, h | 90 min |
| `c2` | Event 2: customers interrupted |  | 450 |
| `d2` | Event 2: duration | µs, ms, s, min, h | 240 min |
| `c3` | Event 3: customers interrupted |  | 3000 |
| `d3` | Event 3: duration | µs, ms, s, min, h | 45 min |
| `c4` | Event 4: customers interrupted |  | 800 |
| `d4` | Event 4: duration | µs, ms, s, min, h | 120 min |
| `c5` | Event 5: customers interrupted |  | 150 |
| `d5` | Event 5: duration | µs, ms, s, min, h | 360 min |
| `Lc` | Average load of an interrupted customer | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 1.5 kW |
| `tF` | SAIFI target (interruptions per customer per period, 0 to skip) |  | 0.5 |
| `tD` | SAIDI target (0 to skip) | µs, ms, s, min, h | 30 min |

Outputs: `CI` (Customer interruptions (customers interrupted, summed over events)); `CMI` (Customer minutes of interruption); `SAIFI` (SAIFI (interruptions per customer per period)); `SAIDI` (SAIDI (minutes without supply per customer per period), min); `CAIDI` (CAIDI (average minutes per interruption), min); `ASAI` (ASAI (fraction of the period supplied)); `ASAIp` (ASAI as a percentage); `ASUI` (ASUI (fraction of the period not supplied)); `ENS` (Energy not supplied, kWh); `AENS` (Average energy not supplied per customer, kWh); `top` (Largest single event: share of SAIDI (%)); `topn` (Event that contributes most to SAIDI)

### `scr-triggering`: SCR Triggering Calculator (Gate Resistor, Gate Power and Resistor-Triggered Firing Angle)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `mode` | What to calculate | 1 = Gate resistor for a DC or pulse trigger source; 2 = Firing angle with a resistor-triggered AC half-wave circuit | 1 |
| `VGT` | Gate trigger voltage VGT | µV, mV, V, kV, MV, GV | 1 V |
| `IGT` | Gate trigger current IGT | µA, mA, A, kA, MA | 15 mA |
| `Vs` | Trigger source voltage (mode 1) | µV, mV, V, kV, MV, GV | 12 V |
| `k` | Safety margin on IGT (mode 1) |  | 2 |
| `tp` | Pulse width (mode 1, 0 for a continuous gate current) | µs, ms, s, min, h | 100 µs |
| `T` | Pulse repetition period (mode 1) | µs, ms, s, min, h | 10 ms |
| `PGM` | Peak gate power rating PGM | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 5 W |
| `PGAV` | Average gate power rating PG(AV) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 0.5 W |
| `Vac` | AC supply voltage, RMS (mode 2) | µV, mV, V, kV, MV, GV | 230 V |
| `VD` | Series diode drop in the gate path (mode 2) | µV, mV, V, kV, MV, GV | 0.7 V |
| `Rg` | Total series gate resistance (mode 2) | mΩ, Ω, kΩ, MΩ, GΩ | 10 kΩ |

Outputs: `IG` (Gate current driven, mA); `Rmax` (Largest series gate resistor, Ω); `PGpk` (Gate power during the pulse (VGT × IG), W); `Pres` (Resistor power during the pulse, W); `duty` (Duty cycle of the gate current (%)); `PGav` (Average gate power, W); `Vm` (Peak of the AC supply, V); `Vth` (Supply voltage at which the gate fires, V); `alpha` (Firing angle (degrees)); `theta` (Conduction angle (degrees)); `Vavg` (Average load voltage (resistive load, half-wave), V); `Vrms` (RMS load voltage (resistive load, half-wave), V); `Rfire` (Largest total gate resistance that still fires, Ω)

### `pid-tuning`: PID Tuning Calculator (Ziegler-Nichols, Cohen-Coon, Lambda and Tyreus-Luyben Settings for P, PI and PID Controllers)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `method` | Tuning method | 1 = Ziegler-Nichols reaction curve (K, τ, θ); 2 = Cohen-Coon (K, τ, θ); 3 = Lambda / IMC (K, τ, θ and λ); 4 = Ziegler-Nichols ultimate gain (Ku, Pu); 5 = Tyreus-Luyben ultimate gain (Ku, Pu) | 1 |
| `ctype` | Controller | 1 = P (proportional only); 2 = PI (proportional and integral); 3 = PID (proportional, integral and derivative) | 3 |
| `K` | Process gain K (methods 1 to 3) |  | 2 |
| `tau` | Process time constant τ (methods 1 to 3) | µs, ms, s, min, h | 50 s |
| `theta` | Dead time θ (methods 1 to 3) | µs, ms, s, min, h | 10 s |
| `lam` | Lambda λ, desired closed-loop time constant (method 3) | µs, ms, s, min, h | 30 s |
| `Ku` | Ultimate gain Ku (methods 4 and 5) |  | 4 |
| `Pu` | Ultimate period Pu (methods 4 and 5) | µs, ms, s, min, h | 20 s |

Outputs: `Kc` (Controller gain Kc); `Ti` (Integral time Ti, s); `Td` (Derivative time Td, s); `Ki` (Parallel-form integral gain Ki = Kc / Ti (per second)); `Kd` (Parallel-form derivative gain Kd = Kc × Td (seconds)); `PB` (Proportional band 100 / Kc (%)); `r` (Dead-time ratio θ / τ)

### `bode-plot`: Bode Plot Calculator (Magnitude and Phase, Gain and Phase Crossover, Gain Margin and Phase Margin)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `K` | Gain K (DC gain, or the constant in front of the integrators) |  | 10 |
| `n` | Integrators n (poles at the origin) | 0 = None (type 0); 1 = One, 1/s (type 1); 2 = Two, 1/s² (type 2) | 1 |
| `z1` | Zero corner frequency z1 (rad/s, 0 = none) |  | 0 |
| `z2` | Zero corner frequency z2 (rad/s, 0 = none) |  | 0 |
| `p1` | Pole corner frequency p1 (rad/s, 0 = none) |  | 1 |
| `p2` | Pole corner frequency p2 (rad/s, 0 = none) |  | 10 |
| `p3` | Pole corner frequency p3 (rad/s, 0 = none) |  | 0 |
| `theta` | Dead time θ | µs, ms, s, min, h | 0 s |
| `w` | Frequency to evaluate ω (rad/s) |  | 1 |

Outputs: `mag` (Magnitude |G(jω)|); `dB` (Magnitude (dB)); `ph` (Phase (degrees)); `asym` (Straight-line (asymptotic) magnitude (dB)); `err` (Exact minus straight-line magnitude (dB)); `slope` (Slope of the straight-line magnitude at ω (dB per decade)); `wgc` (Gain crossover frequency (rad/s)); `PM` (Phase margin (degrees)); `wpc` (Phase crossover frequency (rad/s)); `GM` (Gain margin (dB))

### `thermal-rise`: Thermal Rise Estimator (Enclosure Temperature Rise, Cooling Airflow and Warm-Up Time)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `P` | Heat dissipated inside the enclosure (W) |  | 300 |
| `mt` | Mounting (which faces lose heat) | 1 = Free-standing: all faces except the bottom; 2 = Wall-mounted: all faces except the back and bottom; 0 = Enter the exposed area myself | 1 |
| `W` | Enclosure width | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 0.8 m |
| `H` | Enclosure height | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 1.8 m |
| `D` | Enclosure depth | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 0.4 m |
| `Ac` | Exposed surface area (m², used only if you enter it) |  | 2 |
| `sf` | Surface material | 1 = Painted sheet steel (5.5 W/m²K); 2 = Stainless steel (4.5 W/m²K); 3 = Aluminium (12 W/m²K); 4 = Plastic (3.5 W/m²K); 0 = Enter the coefficient myself | 1 |
| `hc` | Overall heat transfer coefficient (W/m²K, used only if you enter it) |  | 5.5 |
| `Ta` | Ambient air temperature outside (°C) |  | 35 |
| `Tmax` | Highest allowed internal air temperature (°C) |  | 45 |
| `m` | Thermal mass: weight of enclosure and equipment (kg, 0 to skip) |  | 150 |
| `cp` | Average specific heat of that mass (J/kg·K) |  | 500 |
| `t` | Time since the heat started | µs, ms, s, min, h | 2 h |
| `rho` | Air density for the ventilation airflow (kg/m³) |  | 1.2 |

Outputs: `A` (Exposed surface area, m²); `h` (Heat transfer coefficient used (W/m²K)); `G` (Thermal conductance to outside air (W/K)); `dT` (Steady-state temperature rise of the internal air above ambient (K)); `Ti` (Steady-state internal air temperature (°C)); `Pmax` (Heat the enclosure can lose with the internal air at the limit, W); `Pex` (Heat that must be removed (extra) to stay at the limit, W); `Q` (Ventilation airflow that removes it, with the air leaving at the limit, m³/h); `tau` (Thermal time constant, min); `Tt` (Internal air temperature after the time given (°C)); `tl` (Time to reach the limit, min)

### `energy-savings`: Energy Savings Estimator (Motors, Lighting and Distribution Losses: Savings, Payback and Net Present Value)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `tar` | Energy tariff (per kWh) |  | 8 |
| `esc` | Yearly rise in the tariff (%) |  | 3 |
| `dr` | Discount rate (%) |  | 10 |
| `life` | Analysis life (years) |  | 10 |
| `ef` | Grid emission factor (kg CO₂ per kWh) |  | 0.7 |
| `maint` | Yearly maintenance saving, all measures (currency) |  | 0 |
| `nm` | Motors: number of motors replaced (0 to leave out) |  | 4 |
| `Pm` | Motors: shaft output of each at its average load | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 15 kW |
| `eo` | Motors: efficiency of the existing motor at that load (%) |  | 90 |
| `en` | Motors: efficiency of the new motor at that load (%) |  | 94 |
| `hm` | Motors: running hours per year |  | 6000 |
| `cm` | Motors: installed cost of each new motor (currency) |  | 90000 |
| `nl` | Lighting: number of fittings replaced (0 to leave out) |  | 200 |
| `Wo` | Lighting: existing fitting power including control gear | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 120 W |
| `Wn` | Lighting: new fitting power including driver | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 50 W |
| `hl` | Lighting: burning hours per year (existing) |  | 4000 |
| `ct` | Lighting: hours cut by controls on the new fittings (%) |  | 10 |
| `cl` | Lighting: installed cost of each new fitting (currency) |  | 2200 |
| `dist` | Distribution: include a loss reduction? | 1 = Yes, include it; 0 = No, leave it out | 1 |
| `Lb` | Distribution: losses before | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 18 kW |
| `La` | Distribution: losses after | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 11 kW |
| `hd` | Distribution: hours per year the loss occurs |  | 8000 |
| `cd` | Distribution: total cost of the measure (currency) |  | 150000 |

Outputs: `Em` (Motors: energy saved per year, kWh); `El` (Lighting: energy saved per year, kWh); `Ed` (Distribution: energy saved per year, kWh); `Et` (Total energy saved per year, kWh); `pct` (Share of the covered equipment's energy that is saved (%)); `S` (Cost saved in the first year (energy and maintenance)); `Inv` (Total investment); `pb` (Simple payback (years)); `PV` (Present value of the savings over the life); `NPV` (Net present value (present value less investment)); `sir` (Savings to investment ratio); `co2` (Carbon dioxide avoided per year (tonnes))

### `point-by-point-lighting`: Point-by-Point Lighting Calculator (Illuminance, Uniformity and Light Spread from a Grid of Identical Luminaires)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `nx` | Luminaires along the length (x) |  | 4 |
| `ny` | Luminaires across the width (y) |  | 3 |
| `Sx` | Spacing along x | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 3 m |
| `Sy` | Spacing along y | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 3 m |
| `h` | Mounting height above the plane | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 3.5 m |
| `I0` | Intensity straight down (cd) |  | 3000 |
| `m` | Light spread exponent (0 to 20) |  | 1.5 |
| `MF` | Maintenance factor |  | 0.8 |
| `px` | Calculation points along x |  | 12 |
| `py` | Calculation points along y |  | 9 |
| `Er` | Required average illuminance (lux) |  | 300 |
| `Ur` | Required uniformity Uo (Emin / Eavg) |  | 0.5 |
| `xp` | Point of interest: distance along x | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 6 m |
| `yp` | Point of interest: distance along y | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 4.5 m |

Outputs: `A` (Area served (m²)); `nl` (Number of luminaires); `avg` (Average illuminance Eavg (lux)); `mn` (Minimum illuminance Emin (lux)); `mx` (Maximum illuminance Emax (lux)); `uo` (Uniformity Uo = Emin / Eavg); `u1` (Ratio U1 = Emin / Emax); `xmn` (Darkest point: distance along x (m)); `ymn` (Darkest point: distance along y (m)); `Ep` (Illuminance at the point of interest (lux)); `Ea0` (Illuminance directly under one luminaire, that one alone (lux)); `okem` (Average meets the requirement (1 = yes, 0 = no)); `okuo` (Uniformity meets the requirement (1 = yes, 0 = no)); `minreq` (Lowest point needed for the required Uo (lux)); `short` (Lux the lowest point is short by (0 if met)); `g50` (Half-intensity angle from the vertical (°)); `phi` (Flux implied by the pattern, all luminaires (lm)); `share` (Share of that flux landing on the area, before maintenance (ratio))

### `agl-photometry-data`: AGL Photometry Data Tool (Mean, Spread and Point Limits of Measured Light Intensity, Required Level and Light Output Against a New Light)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `mode` | What the readings are | 0 = Intensity in candela (cd); 1 = Illuminance in lux, measured at the distance below | 0 |
| `d` | Measuring distance (lux readings) | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 10 m |
| `n` | Number of readings used |  | 9 |
| `I1` | Reading 1 |  | 14200 |
| `I2` | Reading 2 |  | 15800 |
| `I3` | Reading 3 |  | 14900 |
| `I4` | Reading 4 |  | 16100 |
| `I5` | Reading 5 |  | 18200 |
| `I6` | Reading 6 |  | 16400 |
| `I7` | Reading 7 |  | 14500 |
| `I8` | Reading 8 |  | 15700 |
| `I9` | Reading 9 |  | 13800 |
| `I10` | Reading 10 |  | 0 |
| `I11` | Reading 11 |  | 0 |
| `I12` | Reading 12 |  | 0 |
| `Ireq` | Required minimum average intensity (cd) |  | 15000 |
| `Fp` | Lowest allowed point, as % of the average |  | 50 |
| `Inew` | Average intensity of a new light (cd) |  | 17000 |
| `Pn` | Lowest allowed light output, as % of a new light |  | 50 |
| `u` | Measuring uncertainty of the photometer (%) |  | 5 |

Outputs: `avg` (Average intensity (cd)); `mn` (Lowest intensity (cd)); `mx` (Highest intensity (cd)); `imin` (Number of the lowest point); `imax` (Number of the highest point); `mnavg` (Lowest as a share of the average (Imin / Iavg)); `mxavg` (Highest as a share of the average (Imax / Iavg)); `sd` (Standard deviation of the points (cd)); `cv` (Coefficient of variation (%)); `lim` (Lowest allowed point (cd)); `nfail` (Points below the lowest allowed point); `okavg` (Average meets the requirement (1 = yes, 0 = no)); `okpt` (Every point meets the point limit (1 = yes, 0 = no)); `short` (Average is short of the requirement by (cd, 0 if met)); `avgU` (Average with the uncertainty taken off (cd)); `okU` (Requirement still met with the uncertainty (1 = yes, 0 = no)); `pctnew` (Light output compared with a new light (%)); `oknew` (Light output meets the in-service limit (1 = yes, 0 = no))

### `signage-load`: Signage Load Calculator (Airfield Guidance Signs on a Series Circuit: Sign and Transformer Load, Cable Loss, CCR Size and Spare Capacity)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `n1` | Group 1: number of signs |  | 10 |
| `P1` | Group 1: lamp load per sign | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 100 W |
| `T1` | Group 1: isolating transformer rating per sign | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 150 W |
| `n2` | Group 2: number of signs |  | 6 |
| `P2` | Group 2: lamp load per sign | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 200 W |
| `T2` | Group 2: isolating transformer rating per sign | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 300 W |
| `n3` | Group 3: number of signs |  | 4 |
| `P3` | Group 3: lamp load per sign | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 250 W |
| `T3` | Group 3: isolating transformer rating per sign | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 300 W |
| `n4` | Group 4: number of signs |  | 2 |
| `P4` | Group 4: lamp load per sign | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 60 W |
| `T4` | Group 4: isolating transformer rating per sign | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 100 W |
| `et` | Isolating transformer efficiency |  | 0.85 |
| `I` | Circuit current | µA, mA, A, kA, MA | 6.6 A |
| `L` | Series cable loop length | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 3500 m |
| `R` | Series cable resistance | Ω/km, mΩ/m, Ω/m | 3.08 Ω/km |
| `Po` | Other load on the same circuit | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 0 W |
| `sp` | Spare capacity for future signs (% of the sign load) |  | 20 |
| `ld` | Maximum CCR loading |  | 0.8 |

Outputs: `ns` (Signs on the circuit); `Plamp` (Lamp load of all the signs, kW); `Pin` (Load of all the signs at the transformer inputs, kW); `g1` (Group 1 load at the transformer inputs, kW); `g2` (Group 2 load at the transformer inputs, kW); `g3` (Group 3 load at the transformer inputs, kW); `g4` (Group 4 load at the transformer inputs, kW); `Pc` (Cable loss, W); `Pt` (Total circuit load now, kW); `Vo` (CCR output voltage now, V); `tmax` (Highest lamp load as a share of its transformer rating (%)); `tg` (Group with the highest transformer loading); `Pd` (Design load with the spare capacity, kW); `ccr` (Smallest standard CCR, kW); `pct` (Loading of that CCR now (%)); `pctd` (Loading of that CCR at the design load (%)); `room` (Room left at the maximum loading, kW); `extra` (More signs of the average size that fit)

### `protection-coordination-check`: Protection Coordination Checker (Overcurrent Relay Pick-up Window, Sensitivity, Stability and Time Grading)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `IL` | Maximum load current of the feeder | µA, mA, A, kA, MA | 180 A |
| `kl` | Margin on load current (overload and error allowance) |  | 1.1 |
| `Ipu` | Relay pick-up Is (downstream relay) | µA, mA, A, kA, MA | 250 A |
| `kr` | Relay reset (drop-off) ratio |  | 0.95 |
| `Imin` | Smallest fault current at the far end of the zone | µA, mA, A, kA, MA | 1100 A |
| `ks` | Required sensitivity factor |  | 1.5 |
| `Imax` | Largest through-fault current (grading fault) | µA, mA, A, kA, MA | 6000 A |
| `Ii` | Instantaneous (high-set) pick-up | µA, mA, A, kA, MA | 7500 A |
| `ki` | Instantaneous stability factor |  | 1.2 |
| `cd` | Downstream relay curve (IEC 60255-151) | 0 = Standard inverse (SI): k = 0.14, α = 0.02; 1 = Very inverse (VI): k = 13.5, α = 1; 2 = Extremely inverse (EI): k = 80, α = 2; 3 = Long-time inverse (LTI): k = 120, α = 1 | 0 |
| `TMSd` | Downstream relay TMS |  | 0.1 |
| `cu` | Upstream relay curve (IEC 60255-151) | 0 = Standard inverse (SI): k = 0.14, α = 0.02; 1 = Very inverse (VI): k = 13.5, α = 1; 2 = Extremely inverse (EI): k = 80, α = 2; 3 = Long-time inverse (LTI): k = 120, α = 1 | 0 |
| `Isu` | Upstream relay pick-up Is | µA, mA, A, kA, MA | 400 A |
| `TMSu` | Upstream relay TMS |  | 0.25 |
| `tm` | Grading margin wanted (coordination time interval) | µs, ms, s, min, h | 0.4 s |

Outputs: `lo` (Lowest pick-up that stays stable on load, A); `hi` (Highest pick-up that meets the sensitivity factor, A); `fL` (Load stability margin, pick-up / lowest stable pick-up (1 or more passes)); `S` (Sensitivity factor, smallest fault / pick-up); `Si` (Instantaneous stability factor, setting / largest through fault); `reach` (Smallest fault as a multiple of the instantaneous setting (1 or more: it reaches the far end)); `td` (Downstream operating time at the largest through fault, s); `tu` (Upstream operating time at the largest through fault, s); `marg` (Margin at the largest through fault, s); `tdl` (Downstream operating time at the smallest fault, s); `tul` (Upstream operating time at the smallest fault, s); `margl` (Margin at the smallest fault, s); `nchk` (Checks made); `nfail` (Checks failed)

### `power-supply-ripple`: Power Supply Ripple Calculator (Capacitor-Filtered Rectifier: Ripple Voltage, Capacitor Size and Regulator Headroom)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `tp` | Rectifier | 0 = Half-wave (one diode); 1 = Full-wave, centre-tap (one diode drop, each half of the secondary); 2 = Full-wave bridge (two diode drops) | 2 |
| `Vs` | Transformer secondary RMS voltage | µV, mV, V, kV, MV, GV | 12 V |
| `f` | Mains frequency | Hz, kHz, MHz, GHz, THz, rad/s | 50 Hz |
| `Vd` | Voltage drop of one diode | µV, mV, V, kV, MV, GV | 0.7 V |
| `I` | DC load current | µA, mA, A, kA, MA | 0.5 A |
| `C` | Filter capacitor | pF, nF, µF, F | 4700 µF |
| `dVt` | Peak-to-peak ripple wanted | µV, mV, V, kV, MV, GV | 0.5 V |
| `Vo` | Linear regulator output voltage (0 to leave the regulator out) | µV, mV, V, kV, MV, GV | 12 V |
| `Vdo` | Regulator dropout voltage | µV, mV, V, kV, MV, GV | 2 V |
| `rr` | Regulator ripple rejection (dB) |  | 60 |

Outputs: `Vpk` (Peak voltage from the secondary, V); `Vp` (Peak voltage on the capacitor, after the diodes, V); `fr` (Ripple frequency, Hz); `dV` (Peak-to-peak ripple, V); `Vmin` (Lowest voltage on the capacitor, V); `Vdc` (Average DC voltage, V); `Vr` (RMS ripple voltage (triangle shape), V); `rf` (Ripple factor, RMS ripple / average DC (%)); `Cq` (Capacitor needed for the ripple wanted, µF); `head` (Headroom: lowest input minus output and dropout (0 or more passes), V); `Vro` (RMS ripple at the regulator output, mV)

### `semiconductor-loss`: Semiconductor Loss Calculator (MOSFET, IGBT or Diode in a Switching Stage: Conduction, Switching, Gate, Output Capacitance and Recovery Loss with Junction Temperature)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `V` | Switched (off-state) voltage | µV, mV, V, kV, MV, GV | 48 V |
| `I` | On-state current | µA, mA, A, kA, MA | 10 A |
| `D` | Duty cycle D (fraction of the period the device conducts) |  | 0.5 |
| `fsw` | Switching frequency | Hz, kHz, MHz, GHz, THz, rad/s | 100 kHz |
| `Vo` | Conduction offset voltage (0 for a MOSFET) | µV, mV, V, kV, MV, GV | 0 V |
| `Ron` | On-resistance at 25 °C (Rds(on), rce or the diode slope resistance) | mΩ, Ω, kΩ, MΩ, GΩ | 10 mΩ |
| `tc` | On-resistance temperature coefficient (% per K) |  | 0 |
| `sw` | Switching loss from | 0 = Rise and fall times (linear overlap); 1 = Data-sheet turn-on and turn-off energies | 0 |
| `tr` | Current rise time tr (ns), used with the times |  | 20 |
| `tf` | Voltage rise time tf (ns), used with the times |  | 20 |
| `Eon` | Turn-on energy Eon at the test point (µJ), used with the energies |  | 100 |
| `Eoff` | Turn-off energy Eoff at the test point (µJ), used with the energies |  | 60 |
| `Vref` | Test voltage of Eon and Eoff | µV, mV, V, kV, MV, GV | 400 V |
| `Iref` | Test current of Eon and Eoff | µA, mA, A, kA, MA | 10 A |
| `Qg` | Total gate charge Qg (0 for a diode) | nC, µC, mC, C, e | 50 nC |
| `Vg` | Gate drive voltage | µV, mV, V, kV, MV, GV | 10 V |
| `Coss` | Output capacitance Coss (0 to leave out) | pF, nF, µF, F | 0 pF |
| `Qrr` | Reverse recovery charge Qrr of the diode that commutates with it (0 to leave out) | nC, µC, mC, C, e | 0 nC |
| `Rth` | Junction-to-ambient thermal resistance (°C/W) |  | 30 |
| `Ta` | Ambient temperature (°C) |  | 40 |
| `Tjm` | Maximum junction temperature (°C) |  | 150 |

Outputs: `Rhot` (On-resistance at the junction temperature, mΩ); `Pc` (Conduction loss, W); `Eon` (Turn-on energy per cycle (µJ)); `Eoff` (Turn-off energy per cycle (µJ)); `Eoss` (Output capacitance energy per cycle (µJ)); `Err` (Reverse recovery energy per cycle (µJ)); `Psw` (Switching loss, W); `Poss` (Output capacitance loss, W); `Prr` (Reverse recovery loss, W); `Pg` (Gate drive loss (in the driver, not the device), W); `Pd` (Loss inside the device (conduction, switching, Coss and recovery), W); `Pt` (Total loss including the gate drive, W); `Tj` (Junction temperature (°C)); `marg` (Margin to the maximum junction temperature (°C, negative means over)); `Pdm` (Highest loss inside the device the junction allows at this ambient, W); `fmax` (Highest switching frequency that keeps the junction within its limit, kHz); `sh` (Switching, Coss, recovery and gate loss, % of the total)

### `resistivity-conductance`: Resistance, Conductance and Resistivity Calculator (Solve Resistance, Resistivity, Length or Cross-Section, with Conductivity, % IACS and Temperature)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `solve` | Solve for | 0 = Resistance R; 1 = Resistivity ρ (from a measured R); 2 = Length L (for a target R); 3 = Cross-section A (for a target R) | 0 |
| `mat` | Conductor material | 1 = Copper; 2 = Aluminium; 3 = Silver; 4 = Gold; 5 = Nickel; 6 = Nichrome; 7 = Custom (enter resistivity below) | 1 |
| `rhoC` | Custom resistivity at 20 °C (used when material is Custom) | Ω·m, Ω·cm | 1.7241e-8 Ω·m |
| `aC` | Custom temperature coefficient (per °C) |  | 0 |
| `T` | Conductor temperature (°C) |  | 20 |
| `sh` | Cross-section given as | 0 = Area; 1 = Diameter of a round solid conductor | 0 |
| `L` | Length of the conductor (used unless solving for length) | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 100 m |
| `A` | Cross-section area (used with Area, unless solving for it) | mm², cm², m², ha, km², in², ft², yd², acre, mi², cmil | 16 mm² |
| `d` | Conductor diameter (used with Diameter, unless solving for the cross-section) | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 4.5 mm |
| `Rm` | Resistance (used when solving for resistivity, length or cross-section) | mΩ, Ω, kΩ, MΩ, GΩ | 0.1 Ω |

Outputs: `R` (Resistance at the conductor temperature, Ω); `G` (Conductance (S, reciprocal of the resistance)); `R20` (Resistance of the same conductor at 20 °C, Ω); `Rk` (Resistance per unit length at the conductor temperature, Ω/km); `rhoT` (Resistivity at the conductor temperature, Ω·m); `rho20` (Resistivity at 20 °C, Ω·m); `rhoMm` (Resistivity at 20 °C (Ω·mm²/m)); `sg` (Conductivity at the conductor temperature (MS/m)); `iacs` (Conductivity at 20 °C as a percentage of annealed copper (% IACS)); `Lx` (Length, m); `Ax` (Cross-section area, mm²); `dx` (Diameter of the round conductor of that area, mm)

### `three-phase-network`: Three-Phase Circuit Calculator (Balanced or Unbalanced Star and Delta Load, with Line and Neutral Impedance)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `conn` | Load connection | 0 = Star with the neutral wire connected (four-wire); 1 = Star with no neutral wire (three-wire); 2 = Delta | 0 |
| `VL` | Supply line-to-line voltage (balanced, phase order a-b-c) | µV, mV, V, kV, MV, GV | 400 V |
| `Ra` | Impedance a: resistance R | mΩ, Ω, kΩ, MΩ, GΩ | 8 Ω |
| `Xa` | Impedance a: reactance X (inductive +, capacitive −) | mΩ, Ω, kΩ, MΩ, GΩ | 6 Ω |
| `Rb` | Impedance b: resistance R | mΩ, Ω, kΩ, MΩ, GΩ | 8 Ω |
| `Xb` | Impedance b: reactance X (inductive +, capacitive −) | mΩ, Ω, kΩ, MΩ, GΩ | 6 Ω |
| `Rc` | Impedance c: resistance R | mΩ, Ω, kΩ, MΩ, GΩ | 8 Ω |
| `Xc` | Impedance c: reactance X (inductive +, capacitive −) | mΩ, Ω, kΩ, MΩ, GΩ | 6 Ω |
| `Rl` | Line impedance in each line: resistance (0 for none) | mΩ, Ω, kΩ, MΩ, GΩ | 0 Ω |
| `Xl` | Line impedance in each line: reactance (0 for none) | mΩ, Ω, kΩ, MΩ, GΩ | 0 Ω |
| `Rn` | Neutral wire impedance: resistance (four-wire star only) | mΩ, Ω, kΩ, MΩ, GΩ | 0 Ω |
| `Xn` | Neutral wire impedance: reactance (four-wire star only) | mΩ, Ω, kΩ, MΩ, GΩ | 0 Ω |

Outputs: `Ia` (Line current a, A); `Aa` (Line current a angle (degrees, from Van)); `Ib` (Line current b, A); `Ab` (Line current b angle (degrees)); `Ic` (Line current c, A); `Ac` (Line current c angle (degrees)); `In` (Neutral wire current (four-wire star), A); `Vn` (Shift of the load star point from the supply neutral (star), V); `Ja` (Current in load impedance a, A); `Jb` (Current in load impedance b, A); `Jc` (Current in load impedance c, A); `Va` (Voltage across load impedance a, V); `Vb` (Voltage across load impedance b, V); `Vc` (Voltage across load impedance c, V); `Vab` (Line voltage at the load, a-b, V); `Vbc` (Line voltage at the load, b-c, V); `Vca` (Line voltage at the load, c-a, V); `Pa` (Real power in impedance a, kW); `Pb` (Real power in impedance b, kW); `Pc` (Real power in impedance c, kW); `P` (Load real power, kW); `Q` (Load reactive power (inductive +, capacitive −), kVAR); `S` (Load apparent power, kVA); `pf` (Load power factor); `Ploss` (Loss in the line and neutral wires, kW); `Ps` (Supply real power, kW); `Qs` (Supply reactive power, kVAR); `Ss` (Supply apparent power, kVA); `pfs` (Supply power factor); `unbI` (Line current unbalance, largest deviation from the average (%)); `i2i1` (Negative-sequence current as a share of positive-sequence (%)); `vunb` (Line voltage unbalance at the load (%)); `vdrop` (Drop in the average line voltage at the load below the supply (%))

### `coupled-inductance`: Inductance Calculator (Self and Mutual Inductance, Coupling Coefficient, Series and Parallel Coupled Coils)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `src` | Self-inductances L1 and L2 come from | 0 = Entered values; 1 = Turns on one common core (L = N² / ℜ) | 0 |
| `L1` | Coil 1 self-inductance L1 (used with Entered values) | µH, mH, H | 100 mH |
| `L2` | Coil 2 self-inductance L2 (used with Entered values) | µH, mH, H | 25 mH |
| `N1` | Coil 1 turns N1 (used with Turns on a common core) |  | 500 |
| `N2` | Coil 2 turns N2 (used with Turns on a common core) |  | 250 |
| `Ac` | Core cross-section area Ac (used with Turns on a common core) | mm², cm², m², ha, km², in², ft², yd², acre, mi², cmil | 4 cm² |
| `lc` | Core mean path length lc (used with Turns on a common core) | mm, cm, m, km, in, ft, yd, nm, µm, mil, mi, nmi | 30 cm |
| `mur` | Core relative permeability μr (used with Turns on a common core) |  | 2000 |
| `cpl` | Coupling is given as | 0 = Coupling coefficient k; 1 = Mutual inductance M; 2 = Series-aiding and series-opposing readings | 0 |
| `k` | Coupling coefficient k (0 to 1) |  | 0.9 |
| `M` | Mutual inductance M (used with Mutual inductance) | µH, mH, H | 45 mH |
| `La` | Series-aiding inductance La (used with Series readings) | µH, mH, H | 215 mH |
| `Lo` | Series-opposing inductance Lo (used with Series readings) | µH, mH, H | 35 mH |
| `f` | Frequency f (for the reactances) | Hz, kHz, MHz, GHz, THz, rad/s | 50 Hz |
| `i1` | Coil 1 current i1 (for the stored energy and flux linkage) | µA, mA, A, kA, MA | 2 A |
| `i2` | Coil 2 current i2 (for the stored energy and flux linkage) | µA, mA, A, kA, MA | 1 A |
| `di1dt` | Rate of change of coil 1 current di1/dt (A/s) |  | 100 |

Outputs: `L1` (Self-inductance of coil 1, L1, mH); `L2` (Self-inductance of coil 2, L2, mH); `M` (Mutual inductance M, mH); `k` (Coupling coefficient k = M / √(L1 L2)); `a` (Turns-ratio equivalent √(L1 / L2)); `Lsa` (Series aiding L1 + L2 + 2M, mH); `Lso` (Series opposing L1 + L2 − 2M, mH); `Lpa` (Parallel aiding (L1 L2 − M²) / (L1 + L2 − 2M), mH); `Lpo` (Parallel opposing (L1 L2 − M²) / (L1 + L2 + 2M), mH); `Lsc1` (Leakage seen at coil 1 with coil 2 shorted, L1 (1 − k²), mH); `Lsc2` (Leakage seen at coil 2 with coil 1 shorted, L2 (1 − k²), mH); `Ta` (T-equivalent arm L1 − M (the shunt arm is M), mH); `Tb` (T-equivalent arm L2 − M, mH); `lam1` (Flux linkage of coil 1, L1 i1 + M i2 (Wb-turns)); `lam2` (Flux linkage of coil 2, L2 i2 + M i1 (Wb-turns)); `W` (Stored energy ½ L1 i1² + ½ L2 i2² + M i1 i2 (J)); `Wm` (Of which the mutual term M i1 i2 (J)); `XL1` (Reactance of coil 1, ω L1, Ω); `XL2` (Reactance of coil 2, ω L2, Ω); `XM` (Mutual reactance, ω M, Ω); `e1` (Voltage induced in coil 1 by its own current, L1 di1/dt (V)); `e2` (Voltage induced in coil 2 (open circuit), M di1/dt (V)); `Rel` (Core reluctance ℜ = lc / (μ₀ μr Ac) (A/Wb), turns on a core only); `Bc` (Core flux density (N1 i1 + N2 i2) μ₀ μr / lc (T), turns on a core only)

### `motor-nameplate`: Motor Nameplate Calculator (Read and Check the Ratings of a Three-Phase Induction Motor)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `P` | Rated shaft output P (nameplate kW or HP) | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 15 kW |
| `V` | Rated line voltage V | µV, mV, V, kV, MV, GV | 415 V |
| `f` | Rated frequency f | Hz, kHz, MHz, GHz, THz, rad/s | 50 Hz |
| `poles` | Number of poles |  | 4 |
| `N` | Rated speed N | rpm | 1460 rpm |
| `In` | Rated current In | µA, mA, A, kA, MA | 27.3 A |
| `pf` | Rated power factor cos φ |  | 0.85 |
| `eta` | Rated efficiency η (%) |  | 90 |
| `SF` | Service factor SF |  | 1 |
| `klr` | Locked-rotor current ratio ILR / In |  | 7 |
| `conn` | Winding connection at this voltage | 0 = Delta (Δ); 1 = Star (Y) | 0 |
| `Vs` | Supply line voltage you have, Vs | µV, mV, V, kV, MV, GV | 400 V |
| `fs` | Supply frequency you have, fs | Hz, kHz, MHz, GHz, THz, rad/s | 50 Hz |
| `Im` | Measured running current Im (0 if not measured) | µA, mA, A, kA, MA | 0 A |

Outputs: `Ns` (Synchronous speed Ns = 120 f / p, rpm); `slip` (Rated slip s = (Ns − N) / Ns (%)); `Nsl` (Slip speed Ns − N, rpm); `fr` (Rotor current frequency s f, Hz); `T` (Rated shaft torque T = P / ω, N·m); `Pin` (Rated input power P / η, kW); `Ploss` (Rated losses P / η − P, kW); `S` (Rated apparent power √3 V In (kVA)); `Q` (Rated reactive power √3 V In sin φ (kvar)); `Ical` (Current from P, V, cos φ and η, A); `Idiff` (Nameplate current against that value (%)); `etaI` (Efficiency implied by the plate current P / (√3 V In cos φ) (%)); `Vw` (Voltage across each winding, V); `Iw` (Current in each winding, A); `Ilr` (Locked-rotor current ILR = klr In, A); `Pmax` (Continuous output at the service factor, SF P, kW); `Tsf` (Torque at the service-factor output, at the rated speed, N·m); `Vdev` (Supply voltage against rated (%)); `fdev` (Supply frequency against rated (%)); `vf` (Volts per hertz against rated (%)); `Ns2` (Synchronous speed at the supply frequency, rpm); `Iat` (Current for the rated output at the supply voltage, In V / Vs, A); `load` (Loading by current, Im / In (%), rough)

### `motor-selection-load`: Motor Selection and Load Calculator (Size a Three-Phase Induction Motor to a Driven Load and Check the Duty)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `Pl` | Power the driven machine needs at its shaft, Pl | µW, mW, W, kW, MW, HP, PS, BTU/h, TR, GW, BHP | 18 kW |
| `gr` | Speed ratio of the drive, motor speed / load speed |  | 1 |
| `etat` | Drive (coupling, gearbox, belt) efficiency (%) |  | 98 |
| `mg` | Design margin on the power (%) |  | 10 |
| `der` | Derating factor of the motor (ambient, altitude, supply) |  | 1 |
| `N` | Rated speed of the motor, N | rpm | 1470 rpm |
| `Tlr` | Locked-rotor torque, multiples of rated torque |  | 2 |
| `Tav` | Average motor torque while accelerating, multiples of rated torque |  | 1.6 |
| `Tbd` | Breakdown (pull-out) torque, multiples of rated torque |  | 2.2 |
| `Vst` | Terminal voltage while starting (% of rated) |  | 90 |
| `Vrun` | Terminal voltage while running (% of rated) |  | 100 |
| `bk` | Breakaway torque of the load (% of its full-load torque) |  | 40 |
| `ld` | Average load torque while accelerating (% of full-load torque) |  | 33 |
| `pk` | Peak running load, multiples of the normal load |  | 1.2 |
| `tm` | Torque margin you require over the load (%) |  | 25 |
| `Jl` | Load inertia at the load shaft, Jl (kg·m²) |  | 1.5 |
| `Jm` | Motor rotor inertia, Jm (kg·m²) |  | 0.3 |
| `V` | Line voltage of the supply, V | µV, mV, V, kV, MV, GV | 415 V |
| `eta` | Motor efficiency at the operating load (%) |  | 91 |
| `pf` | Motor power factor at the operating load |  | 0.84 |

Outputs: `Pshaft` (Power the motor must deliver, Pl / ηt, kW); `Pdes` (Design power with the margin, kW); `Preq` (Nameplate rating needed, design power / derating factor, kW); `Psel` (Smallest standard rating that covers it, kW); `load` (Loading, shaft power / rating (%)); `loadd` (Loading of the derated output (%)); `spare` (Spare power at the derated output, kW); `Plow` (Next smaller standard rating, kW); `loadlow` (Load on the derated output of that smaller size (%)); `Nl` (Load shaft speed, rpm); `Tl` (Load torque at the load shaft, N·m); `Tmr` (Load torque at the motor shaft, N·m); `Tn` (Rated torque of the selected motor, N·m); `Tst` (Starting torque available at the start voltage, N·m); `Tbrk` (Breakaway torque of the load at the motor shaft, N·m); `rst` (Starting torque / breakaway torque); `Tpk` (Peak running torque at the motor shaft, N·m); `Tbdv` (Breakdown torque at the running voltage, N·m); `rbd` (Breakdown torque / peak running torque); `Jt` (Total inertia at the motor shaft, Jm + Jl / ratio² (kg·m²)); `Tacc` (Average accelerating torque, N·m); `tacc` (Time to accelerate to full speed, s); `Pin` (Electrical input power at the operating load, kW); `Iop` (Line current at the operating load, A); `Q` (Reactive power at the operating load (kvar))

### `protective-device-selection`: Protective Device Selection Tool (Choose a Fuse, MCB, MCCB or ACB Rating and Check It Against the Cable and the Fault)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `dev` | Kind of protective device | 1 = MCB (miniature circuit-breaker); 2 = MCCB (moulded-case circuit-breaker); 3 = ACB (air circuit-breaker); 4 = Fuse link (gG, general purpose) | 2 |
| `Ib` | Design current of the circuit, Ib | µA, mA, A, kA, MA | 85 A |
| `Iz` | Current-carrying capacity of the cable, Iz | µA, mA, A, kA, MA | 105 A |
| `k2` | Conventional operating factor of the device, k2 |  | 1.3 |
| `Isc` | Prospective short-circuit current at the device, Isc | µA, mA, A, kA, MA | 12 kA |
| `Icu` | Rated breaking capacity of the device you plan to use | µA, mA, A, kA, MA | 25 kA |
| `Imin` | Smallest fault current at the far end of the circuit | µA, mA, A, kA, MA | 1800 A |
| `m` | Instantaneous trip, highest setting (multiples of the rating) |  | 10 |
| `I2t` | Let-through energy of the device at the fault, I²t (A²s) |  | 400000 |
| `S` | Cable conductor area, S (mm²) |  | 25 |
| `ks` | Adiabatic constant of the cable, k |  | 115 |

Outputs: `Imax` (Highest rating the cable allows, smaller of Iz and 1.45 Iz / k2, A); `Insel` (Smallest standard rating at or above Ib, A); `Ilarg` (Largest standard rating the cable allows, A); `load` (Load on the rating, Ib / In (%)); `I2` (Conventional operating current, k2 In, A); `r2` (Conventional operating current / Iz (the limit is 1.45)); `Icun` (Smallest standard breaking capacity at or above Isc, kA); `rcu` (Breaking capacity of your device / Isc); `Itrip` (Instantaneous trip, highest setting m × In, A); `rtr` (Smallest fault current / highest trip setting); `Wc` (Cable withstand, k² S² (A²s)); `rw` (Cable withstand / let-through energy); `chk` (Number of checks not met)

### `measurement-uncertainty`: Measurement Uncertainty Calculator (Uncertainty Budget, Combined and Expanded Uncertainty)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `x` | Measured value (the result, in the unit of the measurement) |  | 230.4 |
| `s` | Standard deviation of the repeated readings, s (0 to skip) |  | 0.3 |
| `n` | Number of readings averaged, n |  | 10 |
| `ty1` | Source 1: kind of figure | 1 = Standard uncertainty u (used as it is); 2 = Rectangular limit ±a (data-sheet tolerance), u = a / √3; 3 = Triangular limit ±a, u = a / √6; 4 = Expanded uncertainty at k = 2 (calibration certificate), u = U / 2; 5 = Digital resolution step d, u = d / (2√3); 6 = U-shaped (arcsine) limit ±a, u = a / √2 | 4 |
| `a1` | Source 1: value |  | 0.35 |
| `c1` | Source 1: sensitivity coefficient, c |  | 1 |
| `ty2` | Source 2: kind of figure | 1 = Standard uncertainty u (used as it is); 2 = Rectangular limit ±a (data-sheet tolerance), u = a / √3; 3 = Triangular limit ±a, u = a / √6; 4 = Expanded uncertainty at k = 2 (calibration certificate), u = U / 2; 5 = Digital resolution step d, u = d / (2√3); 6 = U-shaped (arcsine) limit ±a, u = a / √2 | 2 |
| `a2` | Source 2: value |  | 0.6 |
| `c2` | Source 2: sensitivity coefficient, c |  | 1 |
| `ty3` | Source 3: kind of figure | 1 = Standard uncertainty u (used as it is); 2 = Rectangular limit ±a (data-sheet tolerance), u = a / √3; 3 = Triangular limit ±a, u = a / √6; 4 = Expanded uncertainty at k = 2 (calibration certificate), u = U / 2; 5 = Digital resolution step d, u = d / (2√3); 6 = U-shaped (arcsine) limit ±a, u = a / √2 | 5 |
| `a3` | Source 3: value |  | 0.1 |
| `c3` | Source 3: sensitivity coefficient, c |  | 1 |
| `ty4` | Source 4: kind of figure | 1 = Standard uncertainty u (used as it is); 2 = Rectangular limit ±a (data-sheet tolerance), u = a / √3; 3 = Triangular limit ±a, u = a / √6; 4 = Expanded uncertainty at k = 2 (calibration certificate), u = U / 2; 5 = Digital resolution step d, u = d / (2√3); 6 = U-shaped (arcsine) limit ±a, u = a / √2 | 2 |
| `a4` | Source 4: value |  | 5 |
| `c4` | Source 4: sensitivity coefficient, c |  | 0.02 |
| `cov` | Coverage | 1 = k = 2 (about 95% for a normal distribution); 2 = k = 3 (about 99.7% for a normal distribution); 3 = 95% with a Student t factor from the effective degrees of freedom; 4 = 99% with a Student t factor from the effective degrees of freedom | 3 |
| `T` | Tolerance on the measured quantity, ±T (0 to skip) |  | 10 |

Outputs: `uA` (Repeatability, standard uncertainty of the mean s / √n); `q1` (Source 1: contribution |c| u); `q2` (Source 2: contribution |c| u); `q3` (Source 3: contribution |c| u); `q4` (Source 4: contribution |c| u); `p0` (Repeatability share of the variance (%)); `p1` (Source 1 share of the variance (%)); `p2` (Source 2 share of the variance (%)); `p3` (Source 3 share of the variance (%)); `p4` (Source 4 share of the variance (%)); `uc` (Combined standard uncertainty, uc); `dom` (Largest contributor (0 = repeatability, 1 to 4 = source)); `nu` (Effective degrees of freedom (blank = infinite)); `k` (Coverage factor, k); `U` (Expanded uncertainty, U = k uc (±)); `Urel` (Expanded uncertainty as a percentage of the reading); `lo` (Result interval, lower end (x - U)); `hi` (Result interval, upper end (x + U)); `tur` (Test uncertainty ratio, T / U)

### `pv-performance-ratio`: PV Performance Ratio Calculator (PR, Loss Waterfall and Degradation)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `E` | AC energy delivered at the meter over the period, kWh |  | 15000 |
| `P0` | Array nameplate DC power, kWp |  | 100 |
| `H` | Plane-of-array irradiation over the same period, kWh/m² |  | 190 |
| `days` | Days in the period |  | 30 |
| `Tm` | Average module temperature while generating, °C |  | 42 |
| `gam` | Power temperature coefficient γ, % per °C (negative) |  | -0.35 |
| `soil` | Soiling loss, % |  | 3 |
| `dcl` | DC wiring and mismatch loss, % |  | 3 |
| `avail` | Availability and curtailment loss, % |  | 1 |
| `oth` | Other losses (shading, reflection, low light, AC), % |  | 2 |
| `inv` | Inverter efficiency (weighted), % |  | 97.5 |
| `age` | Years in service |  | 3 |
| `deg` | Annual degradation, % per year |  | 0.5 |
| `tgt` | Target performance ratio, % (0 to skip) |  | 80 |

Outputs: `Yf` (Final yield Yf = E / P0 (kWh per kWp over the period)); `Yfd` (Final yield per day (kWh per kWp per day)); `Yr` (Reference yield Yr = H / 1 kW/m² (peak-sun hours over the period)); `PR` (Performance ratio PR = Yf / Yr (%)); `Eid` (Ideal energy P0 × Yr (kWh)); `Eloss` (Energy lost against the ideal (kWh)); `PRt` (Temperature-corrected PR, to 25 °C module temperature (%)); `Ld` (Waterfall: degradation loss (kWh)); `Lt` (Waterfall: module temperature loss (kWh)); `Ls` (Waterfall: soiling loss (kWh)); `Lw` (Waterfall: DC wiring and mismatch loss (kWh)); `La` (Waterfall: availability and curtailment loss (kWh)); `Lo` (Waterfall: other losses (kWh)); `Li` (Waterfall: inverter loss (kWh)); `Ex` (Expected energy from the waterfall (kWh)); `PRx` (Expected PR from the waterfall (%)); `PRn` (Expected PR of the same plant when new (%)); `gap` (Expected minus measured energy (kWh, positive = measured is short)); `gapp` (Measured energy below the expected (%, negative = above)); `Etg` (Energy at the target PR (kWh)); `sh` (Shortfall against the target (kWh, negative = surplus)); `mg` (PR minus target (percentage points))

### `ev-charger-load`: EV Charger Load Calculator (Site Demand, Diversity and Supply Limit)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `V` | Supply voltage (line-to-line for three-phase) | µV, mV, V, kV, MV, GV | 400 V |
| `phase` | Phase | 3 = Three-phase; 1 = Single-phase | 3 |
| `n1` | Group 1 (AC chargers): number of chargers |  | 12 |
| `p1` | Group 1: rated power of one charger, kW |  | 7.4 |
| `e1` | Group 1: efficiency from the supply to the rated output, % |  | 100 |
| `s1` | Group 1: share of chargers in use at the busiest time, % |  | 70 |
| `t1` | Group 1: average power while charging, % of rating |  | 85 |
| `n2` | Group 2 (DC fast chargers): number of chargers |  | 4 |
| `p2` | Group 2: rated power of one charger, kW |  | 60 |
| `e2` | Group 2: efficiency from the supply to the rated output, % |  | 95 |
| `s2` | Group 2: share of chargers in use at the busiest time, % |  | 75 |
| `t2` | Group 2: average power while charging, % of rating |  | 70 |
| `pfc` | Charger power factor |  | 0.98 |
| `Pb` | Other (building) load at its maximum demand, kW |  | 150 |
| `pfb` | Building load power factor |  | 0.9 |
| `sp` | Spare capacity for growth, % |  | 20 |
| `Sl` | Supply limit to check against, kVA (0 to skip) |  | 400 |

Outputs: `u1` (Group 1: chargers in use at the peak); `u2` (Group 2: chargers in use at the peak); `Pc` (Connected load, every charger at full rating (kW at the supply)); `Pd` (Charger demand at the peak (kW)); `DF` (Diversity factor of the chargers (peak demand ÷ connected load)); `Sd` (Charger demand at the peak (kVA)); `Pt` (Site demand, chargers and building (kW)); `Qt` (Site demand (kvar)); `St` (Site demand (kVA)); `pft` (Site power factor); `It` (Site current at the peak (A)); `Sdes` (Design demand with spare capacity (kVA)); `Ides` (Design current with spare capacity (A)); `Tx` (Next standard transformer at or above the design demand (kVA)); `Ld` (Peak demand as a share of that transformer (%)); `room` (Room under the supply limit at the peak (kVA, negative = over)); `roomD` (Room under the supply limit at the design demand (kVA, negative = over)); `Pav` (Power the supply limit leaves for the chargers (kW)); `sh` (Share of its rating each charger gets if all are used at once (%, 100 = no cut))

### `railway-backup-load`: Railway Backup Load Calculator (Signalling and Telecom Standby Battery: Backup Energy, Battery Size, Charger and Runtime)

| Input key | Meaning | Unit or options | Default |
|---|---|---|---|
| `V` | DC bus voltage of the battery | µV, mV, V, kV, MV, GV | 110 V |
| `P1` | Load 1 (for example interlocking): connected power, W |  | 2400 |
| `d1` | Load 1: share drawn during the outage, % |  | 100 |
| `P2` | Load 2 (for example trackside signals): connected power, W |  | 1800 |
| `d2` | Load 2: share drawn during the outage, % |  | 60 |
| `P3` | Load 3 (for example telecom, GSM-R): connected power, W |  | 900 |
| `d3` | Load 3: share drawn during the outage, % |  | 100 |
| `P4` | Load 4 (for example point machines): connected power, W |  | 1500 |
| `d4` | Load 4: share drawn during the outage, % |  | 10 |
| `t` | Required backup time, h |  | 4 |
| `eta` | Efficiency from the battery to the loads, % |  | 92 |
| `dod` | Usable depth of discharge, % |  | 80 |
| `age` | Capacity at end of life, % of nameplate |  | 80 |
| `tmp` | Low-temperature capacity factor, % |  | 90 |
| `g` | Growth margin on the load, % |  | 10 |
| `trc` | Recharge time, h |  | 12 |
| `ec` | Charge efficiency (ampere-hours in ÷ out), % |  | 90 |
| `Ai` | Installed battery capacity to check, Ah (0 to skip) |  | 300 |

Outputs: `Pc` (Connected load, all groups at full power (W)); `Pa` (Average load during the outage (W)); `Pd` (Design load with growth margin (W)); `Pb` (Power taken from the battery (W)); `Ib` (Average battery current (A)); `Ipk` (Battery current with every group at full power (A)); `Ahd` (Ampere-hours taken from the battery over the backup time (Ah)); `Eb` (Energy taken from the battery (kWh)); `Uf` (Usable fraction of nameplate (depth of discharge × ageing × temperature)); `En` (Nameplate battery energy needed (kWh)); `Ah` (Nameplate battery capacity needed (Ah)); `Ahs` (Next standard battery size at or above it (Ah)); `Cpk` (Full-power battery current as a multiple of that size (C)); `Ich` (Charger current to recharge in the set time and carry the loads (A)); `Pch` (Charger output power at the bus voltage (kW)); `trun` (Runtime of the installed battery at the design load (h)); `mg` (Runtime margin over the required backup time (h, negative = short))

