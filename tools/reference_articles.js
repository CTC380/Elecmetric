/* Elecmetric formula articles (written into converters/ through build_reference.js, kind 'reference').
   Every number on these pages is computed here from the formula, never typed in.
   The expected values for the worked examples are written again, independently, in tests/run_tests.js (section 19). */
const g4 = (x) => { const t = String(Number(x.toPrecision(4))).split('.'); t[0] = t[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); return t.join('.'); };
const R3 = Math.sqrt(3), DEG = Math.PI / 180;

function articles(ctx) {
  const { esc, table } = ctx;
  const steps = (list) => '<ol class="steps">' + list.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ol>';
  const A = [];

  /* ---------- 1. three-phase power ---------- */
  {
    const V = 400, I = 50, pf = 0.85, phi = Math.acos(pf);
    const S = R3 * V * I / 1000, P = S * pf, Q = S * Math.sin(phi);
    const P2 = 75, V2 = 415, pf2 = 0.9, I2 = P2 * 1000 / (R3 * V2 * pf2);
    const rows = [1, 5, 10, 25, 50, 100].map((kw) => [kw + ' kW', g4(kw * 1000 / (R3 * 400 * 0.85)) + ' A']);
    A.push({
      slug: 'three-phase-power-formulas', h1: 'Three-Phase Power Formulas',
      desc: 'Three-phase power formulas for kW, kVA, kVAR and line current, star and delta relations, two worked examples and a table of currents at 400 V.',
      inner: '<h2>The formulas</h2>' + table(['Quantity', 'Three-phase (line values)', 'Single-phase'], [
        ['Apparent power S (kVA)', '√3 × VL × IL / 1000', 'V × I / 1000'],
        ['Real power P (kW)', '√3 × VL × IL × pf / 1000', 'V × I × pf / 1000'],
        ['Reactive power Q (kVAR)', '√3 × VL × IL × sin φ / 1000', 'V × I × sin φ / 1000'],
        ['Line current from kW', 'I = P × 1000 / (√3 × VL × pf)', 'I = P × 1000 / (V × pf)'],
        ['Line current from kVA', 'I = S × 1000 / (√3 × VL)', 'I = S × 1000 / V']]) +
        '<p class="note">VL is the line-to-line voltage in volts, IL the line current in amperes, pf the power factor and φ = arccos(pf). The loads are balanced and the waveforms are sinusoidal.</p>' +
        '<h2>Star and delta</h2>' + table(['Connection', 'Phase voltage', 'Phase current'], [['Star (wye)', 'VL / √3', 'IL'], ['Delta', 'VL', 'IL / √3']]) +
        '<h2>Worked example: power from voltage and current</h2><p>A balanced load draws 50 A at 400 V line-to-line with a power factor of 0.85.</p>' +
        steps(['S = √3 × 400 × 50 / 1000 = ' + g4(S) + ' kVA', 'P = S × pf = ' + g4(S) + ' × 0.85 = ' + g4(P) + ' kW', 'φ = arccos(0.85) = ' + g4(phi / DEG) + '°, so Q = S × sin φ = ' + g4(Q) + ' kVAR']) +
        '<h2>Worked example: current from power</h2><p>A 75 kW load on 415 V with a power factor of 0.9.</p>' +
        steps(['I = 75 × 1000 / (√3 × 415 × 0.9) = ' + g4(I2) + ' A']) +
        '<h2>Line current at 400 V and power factor 0.85</h2>' + table(['Power', 'Line current'], rows),
      faq: [
        ['Why is there a √3 in three-phase power?', 'The line voltage is √3 times the phase voltage in a star connection, and the three phases are 120° apart, so the total of the three phase powers works out to √3 × VL × IL × pf.'],
        ['Is the voltage in the formula line-to-line or line-to-neutral?', 'The formulas above use the line-to-line voltage. With the line-to-neutral voltage VLN the power is 3 × VLN × IL × pf.'],
        ['Does kVA include the power factor?', 'No. kVA is apparent power and does not depend on the power factor. kW is kVA multiplied by the power factor.'],
        ['Do these formulas work for an unbalanced load?', 'Not directly. They assume equal currents in the three lines. For an unbalanced load, add the power of each phase.']],
      related: [['../pages/kw-to-amps.html', 'kW to Amps'], ['../pages/kva-to-kw.html', 'kVA to kW'], ['power-factor-formulas.html', 'Power Factor Formulas'], ['../calculators/power-and-energy/', 'Power and energy calculators']]
    });
    A[A.length - 1].check = { S, P, Q, I2 };
  }

  /* ---------- 2. power factor ---------- */
  {
    const P = 100, pf1 = 0.8, pf2 = 0.95;
    const t1 = Math.tan(Math.acos(pf1)), t2 = Math.tan(Math.acos(pf2)), Qc = P * (t1 - t2);
    const S1 = P / pf1, S2 = P / pf2, Q1 = Math.sqrt(S1 * S1 - P * P);
    const tg = [0.95, 0.98, 1];
    const rows = [0.6, 0.7, 0.8, 0.9].map((a) => ['pf ' + a].concat(tg.map((b) => g4(Math.tan(Math.acos(a)) - Math.tan(Math.acos(b)))))); 
    A.push({
      slug: 'power-factor-formulas', h1: 'Power Factor and the Power Triangle',
      desc: 'Power factor formulas: kW, kVA and kVAR from the power triangle, capacitor kVAR to raise power factor, a worked example and a table of multipliers.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Power factor', 'pf = P / S = cos φ'], ['Apparent power', 'S = P / pf'], ['Reactive power', 'Q = √(S² − P²) = P × tan φ'],
        ['Capacitor to raise pf', 'Qc = P × (tan φ1 − tan φ2), with φ = arccos(pf)']]) +
        '<p class="note">P is real power in kW, S apparent power in kVA, Q reactive power in kVAR. The multiplier in the last row is the number you read from a correction table.</p>' +
        '<h2>Worked example: 100 kW from 0.8 to 0.95</h2>' +
        steps(['tan φ1 = tan(arccos 0.8) = ' + g4(t1), 'tan φ2 = tan(arccos 0.95) = ' + g4(t2), 'Qc = 100 × (' + g4(t1) + ' − ' + g4(t2) + ') = ' + g4(Qc) + ' kVAR',
          'Apparent power falls from ' + g4(S1) + ' kVA to ' + g4(S2) + ' kVA, and Q from ' + g4(Q1) + ' to ' + g4(P * t2) + ' kVAR']) +
        '<h2>Multiplier: kVAR per kW of load</h2>' + table(['Present', 'Target 0.95', 'Target 0.98', 'Target 1.00'], rows) +
        '<p class="note">Multiply the kW of the load by the number in the table to get the capacitor size in kVAR.</p>',
      faq: [
        ['What is a good power factor?', 'Many utilities ask for 0.9 or better and may charge a penalty below it. Check your own tariff.'],
        ['Does a capacitor change the kW?', 'No. It supplies reactive power locally, so the current from the supply falls, but the real power the load uses is unchanged.'],
        ['Can I correct to exactly 1.00?', 'The formula allows it, but a bank sized for unity is easily overcorrected when the load drops. Targets of 0.95 to 0.98 are common.'],
        ['What if the load has harmonics?', 'Capacitors can resonate with the supply inductance at a harmonic frequency. On harmonic-rich loads, check for resonance and consider detuned capacitor banks.']],
      related: [['../pages/power-factor.html', 'Power Factor Calculator'], ['three-phase-power-formulas.html', 'Three-Phase Power Formulas'], ['../pages/kw-to-kva.html', 'kW to kVA'], ['../calculators/power-and-energy/', 'Power and energy calculators']]
    });
    A[A.length - 1].check = { Qc };
  }

  /* ---------- 3. AC circuits ---------- */
  {
    const f = 50, L = 0.1, C = 100e-6, Rr = 10;
    const XL = 2 * Math.PI * f * L, XC = 1 / (2 * Math.PI * f * C), Z = Math.sqrt(Rr * Rr + (XL - XC) * (XL - XC));
    const f0 = 1 / (2 * Math.PI * Math.sqrt(L * C));
    const rows = [50, 60, 400].map((ff) => [ff + ' Hz', g4(2 * Math.PI * ff * L) + ' Ω', g4(1 / (2 * Math.PI * ff * C)) + ' Ω']);
    A.push({
      slug: 'ac-circuit-formulas', h1: 'AC Circuit Formulas: Reactance and Impedance',
      desc: 'AC circuit formulas: RMS and peak, frequency and period, inductive and capacitive reactance, series RLC impedance and resonance, with a worked example.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['RMS from peak (sine)', 'Vrms = Vpeak / √2'], ['Peak-to-peak', 'Vpp = 2 × Vpeak'], ['Period and angular frequency', 'T = 1 / f, ω = 2π f'],
        ['Inductive reactance', 'XL = 2π f L'], ['Capacitive reactance', 'XC = 1 / (2π f C)'], ['Series RLC impedance', '|Z| = √(R² + (XL − XC)²)'],
        ['Phase angle', 'φ = arctan((XL − XC) / R)'], ['Resonant frequency', 'f0 = 1 / (2π √(L C))']]) +
        '<p class="note">f in hertz, L in henries, C in farads, R, XL, XC and Z in ohms. A positive angle means the current lags the voltage (inductive).</p>' +
        '<h2>Worked example: R = 10 Ω, L = 100 mH, C = 100 µF at 50 Hz</h2>' +
        steps(['XL = 2π × 50 × 0.1 = ' + g4(XL) + ' Ω', 'XC = 1 / (2π × 50 × 0.0001) = ' + g4(XC) + ' Ω', '|Z| = √(10² + (' + g4(XL) + ' − ' + g4(XC) + ')²) = ' + g4(Z) + ' Ω',
          'f0 = 1 / (2π × √(0.1 × 0.0001)) = ' + g4(f0) + ' Hz, close to 50 Hz, so the circuit is near resonance']) +
        '<h2>Reactance of 100 mH and 100 µF</h2>' + table(['Frequency', 'XL (100 mH)', 'XC (100 µF)'], rows),
      faq: [
        ['Why does a capacitor pass more current at a higher frequency?', 'Its reactance is 1 / (2π f C), which falls as the frequency rises. An inductor does the opposite: XL rises with frequency.'],
        ['Is the 230 V on a mains supply the RMS or the peak value?', 'It is the RMS value. The peak of a 230 V sine wave is 230 × √2 = 325 V.'],
        ['What happens at resonance?', 'In a series circuit XL equals XC, they cancel, and the impedance falls to R alone, so the current is at its largest.'],
        ['Do these formulas work for non-sinusoidal waveforms?', 'Only for each frequency component separately. The RMS-to-peak ratio of √2 applies to a pure sine wave only.']],
      related: [['../pages/ohms-law.html', 'Ohm’s Law Calculator'], ['ohms-law-formulas.html', 'Ohm’s Law Formulas'], ['power-factor-formulas.html', 'Power Factor Formulas'], ['frequency-converter.html', 'Frequency Converter']]
    });
    A[A.length - 1].check = { XL, XC, Z, f0 };
  }

  /* ---------- 4. voltage drop ---------- */
  {
    const I = 50, L = 100, Rk = 1.15, Xk = 0.08, pf = 0.85, V = 400, phi = Math.acos(pf);
    const per = Rk * pf + Xk * Math.sin(phi);
    const Vd = R3 * I * (L / 1000) * per, pc = Vd / V * 100;
    const Vd1 = 2 * I * (L / 1000) * per, rows = [10, 20, 50, 100].map((a) => [a + ' A', g4(R3 * a * (L / 1000) * per) + ' V', g4(R3 * a * (L / 1000) * per / V * 100) + ' %']);
    A.push({
      slug: 'voltage-drop-formulas', h1: 'Voltage Drop Formulas for Cables',
      desc: 'Voltage drop formulas for single-phase and three-phase cables, percentage drop, a worked example using resistance and reactance per km, and a table by current.',
      inner: '<h2>The formulas</h2>' + table(['Circuit', 'Voltage drop'], [
        ['Three-phase', 'Vd = √3 × I × L × (R cos φ + X sin φ)'], ['Single-phase (out and back)', 'Vd = 2 × I × L × (R cos φ + X sin φ)'],
        ['DC or resistive load', 'Vd = k × I × L × R, with k = 2 (two-wire) or √3 (three-phase)'], ['Percentage', 'Vd % = Vd / V × 100']]) +
        '<p class="note">I is the load current in amperes, L the one-way route length in kilometres (divide metres by 1000), R and X the cable resistance and reactance in ohms per kilometre from the data sheet, and V the system voltage.</p>' +
        '<h2>Worked example: 50 A over 100 m at 400 V</h2><p>The cable data is R = 1.15 Ω/km and X = 0.08 Ω/km at a power factor of 0.85 (φ = ' + g4(phi / DEG) + '°). These are example values, so use your own data sheet.</p>' +
        steps(['R cos φ + X sin φ = 1.15 × 0.85 + 0.08 × ' + g4(Math.sin(phi)) + ' = ' + g4(per) + ' Ω/km', 'Three-phase: Vd = √3 × 50 × 0.1 × ' + g4(per) + ' = ' + g4(Vd) + ' V, which is ' + g4(pc) + '% of 400 V',
          'Single-phase on the same cable: Vd = 2 × 50 × 0.1 × ' + g4(per) + ' = ' + g4(Vd1) + ' V']) +
        '<h2>Drop by current on the same cable (three-phase, 100 m)</h2>' + table(['Current', 'Voltage drop', 'Percentage of 400 V'], rows),
      faq: [
        ['What voltage drop is allowed?', 'It depends on the standard and the circuit. A limit of 3% to 5% from the origin to the load is common, but follow your own standard.'],
        ['Why does a long cable need a larger conductor?', 'Resistance grows with length and falls with cross-section, so a longer run needs more copper to keep the drop within the limit.'],
        ['Does the reactance matter?', 'For small cables it is minor. For large cables, roughly 150 mm² and above, it becomes a large share of the drop, so include it.'],
        ['Should I use the cold or the hot resistance?', 'Use the value at operating temperature. A copper conductor at 90 °C has about 27% more resistance than at 20 °C.']],
      related: [['../pages/voltage-drop.html', 'Voltage Drop Calculator'], ['../calculators/ac-voltage-drop/', 'AC Voltage Drop Calculator'], ['three-phase-power-formulas.html', 'Three-Phase Power Formulas'], ['wire-gauge-converter.html', 'Wire Gauge Converter']]
    });
    A[A.length - 1].check = { per, Vd, pc, Vd1 };
  }

  /* ---------- 5. transformers ---------- */
  {
    const S = 1000, Vp = 11000, Vs = 415, Z = 5;
    const Is = S * 1000 / (R3 * Vs), Ip = S * 1000 / (R3 * Vp), Isc = Is / (Z / 100), ratio = Vp / Vs;
    const rows = [100, 250, 500, 1000, 1600].map((s) => [s + ' kVA', g4(s * 1000 / (R3 * 415)) + ' A', g4(s * 1000 / (R3 * 11000)) + ' A']);
    A.push({
      slug: 'transformer-formulas', h1: 'Transformer Formulas: Current and Fault Level',
      desc: 'Transformer formulas for turns ratio, full-load current, impedance and fault current, with a 1,000 kVA worked example and a table of currents by rating.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Turns ratio', 'a = Np / Ns = Vp / Vs'], ['Current ratio', 'Ip / Is = Vs / Vp'], ['Full-load current (three-phase)', 'I = S × 1000 / (√3 × V)'],
        ['Fault current at the terminals', 'Isc = I(full load) / (Z% / 100)'], ['Efficiency', 'η = x × S × pf / (x × S × pf + P(iron) + x² × P(copper))'], ['Load at maximum efficiency', 'x = √(P(iron) / P(copper))']]) +
        '<p class="note">S is the rating in kVA, V the line-to-line voltage of that winding in volts, Z% the impedance in percent, and x the fraction of full load. The fault current assumes an infinite source behind the transformer, so it is an upper limit.</p>' +
        '<h2>Worked example: 1,000 kVA, 11 kV / 415 V, Z = 5%</h2>' +
        steps(['Secondary: I = 1000 × 1000 / (√3 × 415) = ' + g4(Is) + ' A', 'Primary: I = 1000 × 1000 / (√3 × 11000) = ' + g4(Ip) + ' A', 'Voltage ratio = 11000 / 415 = ' + g4(ratio),
          'Fault current at the secondary terminals: ' + g4(Is) + ' / 0.05 = ' + g4(Isc / 1000) + ' kA']) +
        '<h2>Full-load current by rating</h2>' + table(['Rating', 'At 415 V', 'At 11 kV'], rows),
      faq: [
        ['Why is the primary current so much lower than the secondary current?', 'Power is nearly the same on both sides, so the winding with the higher voltage carries proportionally less current.'],
        ['What does the impedance percentage mean?', 'It is the share of rated voltage that must be applied to the primary, with the secondary shorted, to drive full-load current. A lower value gives a higher fault current.'],
        ['Is the fault current from this formula the real value?', 'It is an upper limit. The supply network and the cable add impedance, so the real fault current is lower.'],
        ['At what load is a transformer most efficient?', 'When the copper loss equals the iron loss, which for distribution transformers is typically at about 40% to 60% of full load.']],
      related: [['../calculators/transformer-sizing/', 'Transformer Sizing Calculator'], ['../calculators/transformer-fault-current/', 'Transformer Fault Current'], ['three-phase-power-formulas.html', 'Three-Phase Power Formulas'], ['../pages/kva-to-amps.html', 'kVA to Amps']]
    });
    A[A.length - 1].check = { Is, Ip, Isc, ratio };
  }

  /* ---------- 6. motors ---------- */
  {
    const P = 55, N = 1480, f = 50, p = 4, V = 415, pf = 0.88, eta = 0.93;
    const Ns = 120 * f / p, slip = (Ns - N) / Ns * 100, T = 9548.8 * P / N, I = P * 1000 / (R3 * V * pf * eta);
    const rows = [2, 4, 6, 8].map((n) => [n + ' poles', g4(120 * 50 / n) + ' rpm', g4(120 * 60 / n) + ' rpm']);
    A.push({
      slug: 'motor-formulas', h1: 'Induction Motor Formulas',
      desc: 'Induction motor formulas for synchronous speed, slip, shaft torque and full-load current, with a 55 kW worked example and a table of speeds by pole count.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Synchronous speed', 'Ns = 120 × f / p'], ['Slip', 'slip % = (Ns − N) / Ns × 100'], ['Shaft torque', 'T = 9548.8 × P / N, or 60 × P / (2π × N) with P in watts'],
        ['Full-load current (three-phase)', 'I = P × 1000 / (η × √3 × V × pf)'], ['Input power', 'Pin = P / η']]) +
        '<p class="note">f is the supply frequency in hertz, p the number of poles, N the rotor speed in rpm, P the shaft power in kW, V the line voltage in volts, η the efficiency and pf the power factor as fractions. Nameplate values take precedence over these planning figures.</p>' +
        '<h2>Worked example: 55 kW, 4-pole, 1,480 rpm, 415 V</h2><p>The efficiency is 0.93 and the power factor 0.88.</p>' +
        steps(['Ns = 120 × 50 / 4 = ' + g4(Ns) + ' rpm', 'Slip = (' + g4(Ns) + ' − 1480) / ' + g4(Ns) + ' × 100 = ' + g4(slip) + '%', 'T = 9548.8 × 55 / 1480 = ' + g4(T) + ' N·m', 'I = 55 × 1000 / (0.93 × √3 × 415 × 0.88) = ' + g4(I) + ' A']) +
        '<h2>Synchronous speed by number of poles</h2>' + table(['Poles', '50 Hz', '60 Hz'], rows),
      faq: [
        ['Which speed do I use for torque?', 'The loaded shaft speed from the nameplate, such as 1,480 rpm. Using the synchronous speed of 1,500 rpm understates the torque.'],
        ['What is a normal slip?', 'Typically 1% to 5% at full load for a standard cage motor. Larger motors have lower slip.'],
        ['How high is the starting current?', 'Direct-on-line starting commonly draws five to eight times the full-load current. Star-delta starting reduces both the current and the torque to one third.'],
        ['Why is the shaft power not the same as the input power?', 'The motor loses some power as heat in the windings, core and bearings. The input power is the shaft power divided by the efficiency.']],
      related: [['../calculators/motor-current/', 'Motor Current Calculator'], ['../calculators/motor-starting/', 'Motor Starting Calculator'], ['three-phase-power-formulas.html', 'Three-Phase Power Formulas'], ['rotational-speed-converter.html', 'Rotational Speed Converter']]
    });
    A[A.length - 1].check = { Ns, slip, T, I };
  }

  /* ---------- 7. lighting ---------- */
  {
    const cd = 1000, d = 5, E = cd / (d * d);
    const area = 6 * 5, Elux = 300, lum = 3000, UF = 0.6, MF = 0.8, N = Elux * area / (lum * UF * MF), Nup = Math.ceil(N);
    const rows = [1, 2, 3, 5, 10].map((x) => [x + ' m', g4(cd / (x * x)) + ' lx']);
    A.push({
      slug: 'lighting-formulas', h1: 'Lighting Formulas: Lux, Lumens and Candela',
      desc: 'Lighting formulas for lux, lumens and candela: inverse square law, cosine law and the lumen method for the number of luminaires, with worked examples.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Illuminance from flux', 'E = Φ / A'], ['Illuminance from intensity', 'E = I × cos θ / d²'], ['Number of luminaires (lumen method)', 'N = E × A / (Φ × UF × MF)'],
        ['Flux in a beam', 'Φ = I × Ω, with Ω = 2π × (1 − cos(θ / 2))'], ['Efficacy', 'η = Φ / P (lm/W)']]) +
        '<p class="note">E is illuminance in lux, Φ luminous flux in lumens, A area in square metres, I intensity in candela, d distance in metres and θ the angle of incidence. UF is the utilisation factor and MF the maintenance factor. 1 foot-candle is 10.764 lux.</p>' +
        '<h2>Worked example: a 1,000 cd source at 5 m</h2>' +
        steps(['E = 1000 × cos 0° / 5² = ' + g4(E) + ' lx on a surface facing the source']) +
        '<h2>Worked example: a 6 m × 5 m room at 300 lux</h2><p>Each luminaire gives 3,000 lm, with UF 0.6 and MF 0.8.</p>' +
        steps(['A = 6 × 5 = ' + area + ' m²', 'N = 300 × 30 / (3000 × 0.6 × 0.8) = ' + g4(N), 'Round up to ' + Nup + ' luminaires']) +
        '<h2>Illuminance from 1,000 cd by distance</h2>' + table(['Distance', 'Illuminance'], rows),
      faq: [
        ['What is the difference between lumen, candela and lux?', 'Lumens measure the total light emitted, candela the intensity in one direction, and lux the light arriving on a surface (lumens per square metre).'],
        ['Why does doubling the distance cut the lux to a quarter?', 'The light spreads over an area that grows with the square of the distance, so the illuminance falls by the same factor.'],
        ['What are the utilisation and maintenance factors?', 'The utilisation factor is the share of lamp lumens that reaches the work plane in this room. The maintenance factor allows for dirt and lamp ageing over time.'],
        ['When does the inverse square law not hold?', 'Close to a large luminaire. Use it only when the distance is at least five times the size of the source.']],
      related: [['../pages/lumens-to-lux.html', 'Lumens to Lux'], ['../pages/candela-to-lux.html', 'Candela to Lux'], ['illumination-converter.html', 'Illumination Converter'], ['../calculators/lighting-and-facilities/', 'Lighting calculators']]
    });
    A[A.length - 1].check = { E, N, Nup };
  }

  /* ---------- 8. batteries ---------- */
  {
    const Pk = 2, t = 5, V = 48, dod = 0.8, eff = 0.9;
    const E = Pk * t, Eb = E / (dod * eff), Ah = Eb * 1000 / V;
    const AhB = 300, run = V * AhB * dod * eff / (Pk * 1000);
    const rows = [0.5, 1, 2, 5].map((kw) => [kw + ' kW', g4(kw * 5 / (dod * eff)) + ' kWh', g4(kw * 5 * 1000 / (dod * eff) / 48) + ' Ah']);
    A.push({
      slug: 'battery-formulas', h1: 'Battery Formulas: Capacity and Runtime',
      desc: 'Battery formulas for energy in Wh, bank capacity from load and depth of discharge, runtime, C-rate and series and parallel connection, with worked examples.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Stored energy', 'E (Wh) = V × Ah'], ['Energy the load needs', 'E (kWh) = P (kW) × t (h)'], ['Bank energy to install', 'Ebank = E / (DoD × η)'],
        ['Bank capacity', 'Ah = Ebank × 1000 / V'], ['Runtime', 't = V × Ah × DoD × η / (P × 1000)'], ['C-rate', 'C-rate = I / Ah, so 1C is the current that would empty the battery in one hour'],
        ['Series connection', 'Voltages add, Ah stays the same'], ['Parallel connection', 'Ah adds, voltage stays the same']]) +
        '<p class="note">DoD is the usable fraction of the capacity (depth of discharge) and η the round-trip or inverter efficiency, both as fractions. P is in kW, V in volts. Use the DoD and efficiency from the battery data sheet.</p>' +
        '<h2>Worked example: bank size for a 2 kW load for 5 hours</h2><p>The bank is 48 V, with a usable depth of discharge of 80% and an efficiency of 90%.</p>' +
        steps(['E = 2 × 5 = ' + g4(E) + ' kWh', 'Ebank = ' + g4(E) + ' / (0.8 × 0.9) = ' + g4(Eb) + ' kWh', 'Ah = ' + g4(Eb) + ' × 1000 / 48 = ' + g4(Ah) + ' Ah, so the next standard size up is needed']) +
        '<h2>Worked example: runtime of a 48 V, 300 Ah bank</h2>' +
        steps(['t = 48 × 300 × 0.8 × 0.9 / (2 × 1000) = ' + g4(run) + ' hours at 2 kW']) +
        '<h2>Bank size for 5 hours at 48 V</h2>' + table(['Load', 'Bank energy', 'Bank capacity'], rows),
      faq: [
        ['Why is the bank larger than the energy I need?', 'You cannot use all of the stored energy. The depth of discharge limits what is taken out, and the inverter and wiring lose some of it as heat.'],
        ['What depth of discharge should I use?', 'Take it from the data sheet. Lead-acid batteries are often limited to about 50% for a long life, and lithium iron phosphate batteries to about 80% to 90%.'],
        ['Does the runtime stay the same at a higher load?', 'No. A heavy discharge reduces the usable capacity of most batteries, especially lead-acid. Data sheets give capacity at a stated discharge time, such as 10 or 20 hours.'],
        ['Why do parallel strings need care?', 'Unequal cable lengths or batteries of different age make the strings share current unevenly. Keep strings identical and the connections the same length.']],
      related: [['../calculators/battery-bank-sizing/', 'Battery Bank Sizing Calculator'], ['battery-capacity-converter.html', 'Battery Capacity Converter'], ['../pages/mah-to-wh.html', 'mAh to Wh'], ['../pages/kw-to-wh.html', 'kW to Wh']]
    });
    A[A.length - 1].check = { E, Eb, Ah, run };
  }

  /* ---------- 9. solar ---------- */
  {
    const Ed = 10, psh = 5, pr = 0.75, Wm = 550;
    const kWp = Ed / (psh * pr), nMod = Math.ceil(kWp * 1000 / Wm);
    const Voc = 49.5, tc = -0.28, Tmin = -5, Vmax = 1000;
    const Vc = Voc * (1 + tc / 100 * (Tmin - 25)), nMax = Math.floor(Vmax / Vc);
    const arr = nMod * Wm / 1000, ann = arr * psh * pr * 365;
    const rows = [1, 3, 5, 10].map((k) => [k + ' kWp', g4(k * psh * pr) + ' kWh', g4(k * psh * pr * 365) + ' kWh']);
    A.push({
      slug: 'solar-pv-formulas', h1: 'Solar PV Formulas: Array Size and Strings',
      desc: 'Solar PV formulas for array size from daily energy, yearly yield, number of modules and the longest string from the cold voltage, with worked examples.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Array size', 'kWp = E(day) / (PSH × PR)'], ['Number of modules', 'N = ⌈ kWp × 1000 / module watts ⌉'], ['Daily energy from an array', 'E(day) = kWp × PSH × PR'],
        ['Yearly energy', 'E(year) = kWp × PSH × PR × 365'], ['Open-circuit voltage when cold', 'Voc(cold) = Voc × (1 + tc/100 × (Tmin − 25))'], ['Longest string', 'N(max) = ⌊ Vmax / Voc(cold) ⌋']]) +
        '<p class="note">PSH is the peak sun hours, which equals the daily irradiation in kWh/m² on the tilted plane. PR is the performance ratio, a fraction that covers temperature, soiling, wiring and inverter losses. tc is the Voc temperature coefficient in % per °C (negative), Tmin the lowest site temperature in °C and Vmax the maximum system voltage of the inverter or the module, whichever is lower. The module rating is at 25 °C.</p>' +
        '<h2>Worked example: array for 10 kWh a day</h2><p>The site has 5 peak sun hours and the performance ratio is 0.75. The modules are 550 W.</p>' +
        steps(['kWp = 10 / (5 × 0.75) = ' + g4(kWp) + ' kWp', 'N = ⌈ ' + g4(kWp) + ' × 1000 / 550 ⌉ = ⌈ ' + g4(kWp * 1000 / Wm) + ' ⌉ = ' + nMod + ' modules', nMod + ' modules give ' + g4(arr) + ' kWp, which yields ' + g4(arr * psh * pr) + ' kWh a day and ' + g4(ann) + ' kWh a year']) +
        '<h2>Worked example: longest string</h2><p>Module Voc 49.5 V, coefficient −0.28 %/°C, lowest temperature −5 °C, system limit 1,000 V.</p>' +
        steps(['Voc(cold) = 49.5 × (1 + (−0.28 / 100) × (−5 − 25)) = ' + g4(Vc) + ' V', 'N(max) = ⌊ 1000 / ' + g4(Vc) + ' ⌋ = ⌊ ' + g4(Vmax / Vc) + ' ⌋ = ' + nMax + ' modules in series']) +
        '<h2>Energy by array size (5 peak sun hours, PR 0.75)</h2>' + table(['Array', 'Per day', 'Per year'], rows),
      faq: [
        ['What is the performance ratio?', 'It is the share of the ideal energy that the system actually delivers. Typical values for a well-built system are around 0.7 to 0.85, but use the figure from your own design tool.'],
        ['Why use the coldest temperature for the string length?', 'The voltage of a module rises as it gets colder. The string must stay below the voltage limit on the coldest morning, when the open-circuit voltage is at its highest.'],
        ['Why round the number of strings and modules up or down?', 'You cannot install part of a module. Round the module count up to meet the energy, and round the string length down so the voltage limit is never passed.'],
        ['Does this size the battery or inverter?', 'No. This page covers the array only. Size a battery with the battery formulas, and select the inverter from its input voltage window and current limits.']],
      related: [['../calculators/solar-pv-sizing/', 'Solar PV Array Sizing Calculator'], ['../calculators/solar-pv-string-size/', 'Solar PV String Size Calculator'], ['battery-formulas.html', 'Battery Formulas'], ['../calculators/renewable-energy/', 'Renewable energy calculators']]
    });
    A[A.length - 1].check = { kWp, nMod, Vc, nMax, ann };
  }

  /* ---------- 10. capacitors ---------- */
  {
    const C1 = 470e-6, V1 = 24, Q = C1 * V1, Ec = 0.5 * C1 * V1 * V1;
    const Cs = 1 / (1 / 10 + 1 / 40), Cp = 10 + 40;
    const Rr = 10e3, Cc = 100e-6, tau = Rr * Cc, Vs = 12, v2 = Vs * (1 - Math.exp(-2 / tau));
    const rows = [1, 2, 3, 4, 5].map((n) => [n + ' τ', g4(100 * (1 - Math.exp(-n))) + ' %', g4(100 * Math.exp(-n)) + ' %']);
    A.push({
      slug: 'capacitor-formulas', h1: 'Capacitor Formulas: Energy and RC Time Constant',
      desc: 'Capacitor formulas for charge, stored energy, series and parallel capacitance and the RC time constant, with worked examples and a charging table.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Charge', 'Q = C × V'], ['Stored energy', 'E = ½ × C × V²'], ['Capacitors in parallel', 'C = C1 + C2 + C3 + …'], ['Capacitors in series', '1 / C = 1 / C1 + 1 / C2 + 1 / C3 + …'],
        ['Time constant', 'τ = R × C'], ['Voltage while charging', 'v(t) = V × (1 − e^(−t/τ))'], ['Voltage while discharging', 'v(t) = V0 × e^(−t/τ)']]) +
        '<p class="note">C is in farads, V in volts, Q in coulombs, E in joules, R in ohms and t in seconds. 1 µF is 10⁻⁶ F. For two capacitors in series, C = C1 × C2 / (C1 + C2).</p>' +
        '<h2>Worked example: a 470 µF capacitor at 24 V</h2>' +
        steps(['Q = 470 × 10⁻⁶ × 24 = ' + g4(Q * 1000) + ' mC', 'E = ½ × 470 × 10⁻⁶ × 24² = ' + g4(Ec) + ' J']) +
        '<h2>Worked example: 10 µF and 40 µF</h2>' +
        steps(['In parallel: C = 10 + 40 = ' + g4(Cp) + ' µF', 'In series: C = 10 × 40 / (10 + 40) = ' + g4(Cs) + ' µF, always less than the smaller capacitor']) +
        '<h2>Worked example: charging through 10 kΩ</h2><p>A 100 µF capacitor is charged from a 12 V supply through a 10 kΩ resistor.</p>' +
        steps(['τ = 10000 × 0.0001 = ' + g4(tau) + ' s', 'After 2 s: v = 12 × (1 − e^(−2/' + g4(tau) + ')) = ' + g4(v2) + ' V']) +
        '<h2>Charge and discharge by time constants</h2>' + table(['Time', 'Charged to', 'Remaining when discharging'], rows),
      faq: [
        ['How long does a capacitor take to charge fully?', 'In theory it never does, because the voltage approaches the supply along a curve. After five time constants it is within 1%, which is the usual practical figure.'],
        ['Why is the series capacitance less than the smallest capacitor?', 'The voltage splits between the capacitors, so the same charge sits on each plate and the effective capacitance falls.'],
        ['Why does the energy depend on the square of the voltage?', 'Doubling the voltage doubles the charge, and the energy is the charge times the average voltage, so it increases four times.'],
        ['Is a charged capacitor dangerous after the power is off?', 'It can be. A large capacitor can hold its charge for a long time. Discharge it through a suitable resistor and check with a meter before touching the terminals.']],
      related: [['capacitance-converter.html', 'Capacitance Converter'], ['ac-circuit-formulas.html', 'AC Circuit Formulas'], ['power-factor-formulas.html', 'Power Factor Formulas'], ['../calculators/electronics-and-instrumentation/', 'Electronics and instrumentation calculators']]
    });
    A[A.length - 1].check = { Q, Ec, Cs, Cp, tau, v2 };
  }

  /* ---------- 11. earthing ---------- */
  {
    const rho = 100, L = 3, d = 0.016;
    const R1 = rho / (2 * Math.PI * L) * (Math.log(8 * L / d) - 1);
    const n = 4, u = 0.85, Rn = R1 / (n * u);
    const U0 = 230, Zs = 0.8, If = U0 / Zs, Ia = 160, ZsMax = U0 / Ia;
    const rod = (r, l) => r / (2 * Math.PI * l) * (Math.log(8 * l / d) - 1);
    const rows = [1.2, 2.4, 3, 6].map((l) => [l + ' m', g4(rod(50, l)) + ' Ω', g4(rod(100, l)) + ' Ω', g4(rod(200, l)) + ' Ω']);
    A.push({
      slug: 'earthing-formulas', h1: 'Earthing Formulas: Earth Rod and Fault Loop',
      desc: 'Earthing formulas for the resistance of a vertical earth rod, rods in parallel, earth fault loop impedance and fault current, with worked examples and a table.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Single vertical rod', 'R = ρ / (2π L) × (ln(8L / d) − 1)'], ['Rods in parallel', 'Rn = R1 / (n × u)'], ['Earth fault loop impedance', 'Zs = Ze + (R1 + R2)'],
        ['Earth fault current', 'If = U0 / Zs'], ['Largest Zs for a breaker', 'Zs(max) = U0 / Ia']]) +
        '<p class="note">ρ is the soil resistivity in Ω·m, L the length of the rod in the ground and d its diameter, both in metres. n is the number of rods and u a utilisation factor below 1 that allows for the rods affecting each other. U0 is the voltage to earth, Ia the current that makes the protective device trip in the required time, Ze the external loop impedance and (R1 + R2) the resistance of the phase and protective conductors. The rod formula assumes uniform soil.</p>' +
        '<h2>Worked example: one 3 m rod in 100 Ω·m soil</h2><p>The rod diameter is 16 mm.</p>' +
        steps(['ln(8 × 3 / 0.016) = ln(' + g4(8 * L / d) + ') = ' + g4(Math.log(8 * L / d)), 'R = 100 / (2π × 3) × (' + g4(Math.log(8 * L / d)) + ' − 1) = ' + g4(R1) + ' Ω']) +
        '<h2>Worked example: four rods</h2><p>Four of these rods, spaced well apart, with a utilisation factor of 0.85.</p>' +
        steps(['Rn = ' + g4(R1) + ' / (4 × 0.85) = ' + g4(Rn) + ' Ω']) +
        '<h2>Worked example: fault current and the limit on Zs</h2>' +
        steps(['With Zs = 0.8 Ω on 230 V: If = 230 / 0.8 = ' + g4(If) + ' A', 'A breaker that must trip at 160 A (for example a 32 A device with a 5 × In magnetic trip) needs Zs ≤ 230 / 160 = ' + g4(ZsMax) + ' Ω']) +
        '<h2>Resistance of a 16 mm rod by length and soil</h2>' + table(['Length in the ground', '50 Ω·m', '100 Ω·m', '200 Ω·m'], rows),
      faq: [
        ['Why does a longer rod help more than a thicker one?', 'The resistance falls roughly in proportion to the length, but only with the logarithm of the diameter, so a longer or deeper rod is far more effective.'],
        ['Why do four rods not give a quarter of the resistance?', 'The current spreading from each rod overlaps the others. Rods spaced at least their own length apart come close to the ideal, and the utilisation factor allows for the rest.'],
        ['Does the soil resistivity stay constant?', 'No. Moisture, temperature and season change it, sometimes several times over. Measure the resistance on site, in the driest season if you can.'],
        ['Is a low earth resistance enough for safety?', 'No. Protection also depends on the loop impedance, the protective device and the touch voltage. The earth electrode is one part of the system.']],
      related: [['../calculators/earth-resistance/', 'Earth Rod Resistance Calculator'], ['../calculators/earthing-and-grounding/', 'Earthing and grounding calculators'], ['transformer-formulas.html', 'Transformer Formulas'], ['voltage-drop-formulas.html', 'Voltage Drop Formulas']]
    });
    A[A.length - 1].check = { R1, Rn, If, ZsMax };
  }

  /* ---------- 12. cable sizing ---------- */
  {
    const Ib = 63, In = 63, Ca = 0.87, Cg = 0.8, It = In / (Ca * Cg);
    const rho = 0.017241, al = 0.00393, Lm = 100, Ar = 16;
    const R20 = rho * Lm / Ar, R70 = R20 * (1 + al * (70 - 20)), R90 = R20 * (1 + al * (90 - 20));
    const Isc = 10000, ts = 0.2, Sx = Isc * Math.sqrt(ts) / 143, Sp = Isc * Math.sqrt(ts) / 115;
    const STD = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300], nx = (s) => STD.find((x) => x >= s);
    const rows = [4, 10, 16, 25, 50, 95].map((a) => [a + ' mm²', g4(rho * 1000 / a) + ' Ω/km', g4(rho * 1000 / a * (1 + al * 70)) + ' Ω/km']);
    A.push({
      slug: 'cable-sizing-formulas', h1: 'Cable Size Formulas: Current and Short-Circuit',
      desc: 'Cable sizing formulas for current capacity with correction factors, conductor resistance and temperature, and short-circuit withstand, with worked examples.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Rule for the circuit', 'Ib ≤ In ≤ Iz'], ['Tabulated current needed', 'It ≥ In / (Ca × Cg × …)'], ['Conductor resistance', 'R = ρ × L / A'],
        ['Resistance at temperature T', 'RT = R20 × (1 + α × (T − 20))'], ['Short-circuit withstand', 'S ≥ I × √t / k']]) +
        '<p class="note">Ib is the design current, In the rating of the protective device and Iz the current the cable can carry in its installation. Ca and Cg are correction factors for ambient temperature and grouping, taken from the standard you work to. ρ is the resistivity (copper 0.017241 Ω·mm²/m at 20 °C, α = 0.00393 per °C), L the length in metres and A the area in mm². In the last row I is the fault current in amperes, t the clearing time in seconds and k a constant for the conductor and insulation: copper 115 with PVC and 143 with XLPE, aluminium 76 with PVC and 94 with XLPE (IEC 60364-4-43). For PVC conductors above 300 mm² the standard lowers k to 103 for copper and 68 for aluminium, so a large PVC cable needs a larger area than the 115 or 76 figure gives. S is in mm².</p>' +
        '<h2>Worked example: current capacity</h2><p>A circuit has a design current of 63 A and a 63 A breaker. The ambient factor is 0.87 and the grouping factor 0.80. These are example factors, so use the ones from your own standard.</p>' +
        steps(['Ib ≤ In: 63 ≤ 63, so the device is correct', 'It ≥ 63 / (0.87 × 0.80) = ' + g4(It) + ' A, so pick a cable whose tabulated current is at least this value']) +
        '<h2>Worked example: resistance of 100 m of 16 mm² copper</h2>' +
        steps(['R20 = 0.017241 × 100 / 16 = ' + g4(R20) + ' Ω', 'At 70 °C: R = ' + g4(R20) + ' × (1 + 0.00393 × 50) = ' + g4(R70) + ' Ω', 'At 90 °C: R = ' + g4(R20) + ' × (1 + 0.00393 × 70) = ' + g4(R90) + ' Ω']) +
        '<h2>Worked example: short-circuit withstand</h2><p>A fault of 10 kA is cleared in 0.2 s.</p>' +
        steps(['Copper with XLPE (k = 143): S ≥ 10000 × √0.2 / 143 = ' + g4(Sx) + ' mm², so use ' + nx(Sx) + ' mm²', 'Copper with PVC (k = 115): S ≥ 10000 × √0.2 / 115 = ' + g4(Sp) + ' mm², so use ' + nx(Sp) + ' mm²']) +
        '<h2>Copper resistance by size</h2>' + table(['Size', 'At 20 °C', 'At 90 °C'], rows) +
        '<p class="note">These values come from the resistivity above. Cable data sheets give slightly higher figures because the standard limits for stranded conductors include an allowance, so use the data sheet for the final voltage-drop check.</p>',
      faq: [
        ['What decides the final cable size?', 'The largest of three results: the current capacity after correction, the voltage drop at the load, and the short-circuit withstand at the fault level. Check all three.'],
        ['Why does grouping reduce the current rating?', 'Cables run close together heat each other, so each one can carry less current before the insulation reaches its limit.'],
        ['Why use the resistance at the operating temperature?', 'Resistance rises with temperature, about 27% for copper at 90 °C compared with 20 °C. A voltage-drop check with the cold value is optimistic.'],
        ['Where do the standard sizes come from?', 'They are the preferred sizes of IEC 60228, such as 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240 and 300 mm². Always round up to the next one.']],
      related: [['../calculators/cable-size/', 'Cable Size Calculator'], ['../calculators/cable-derating/', 'Cable Derating Calculator'], ['voltage-drop-formulas.html', 'Voltage Drop Formulas'], ['wire-gauge-converter.html', 'Wire Gauge Converter']]
    });
    A[A.length - 1].check = { It, R20, R70, R90, Sx, Sp };
  }

  /* ---------- 13. energy and cost ---------- */
  {
    const P1 = 7.5, h1 = 8, d1 = 26, tar = 0.10, E1 = P1 * h1 * d1, C1 = E1 * tar;
    const n = 100, Po = 150, Pn = 60, hd = 10, cap = 40, saved = n * (Po - Pn) / 1000, Es = saved * hd * 365, Cs = Es * tar, pay = n * cap / Cs;
    const rows = [1, 5, 10].map((kw) => [kw + ' kW'].concat([4, 8, 12, 24].map((h) => g4(kw * h * 365) + ' kWh')));
    A.push({
      slug: 'energy-cost-formulas', h1: 'Energy and Cost Formulas: kWh and Payback',
      desc: 'Energy and cost formulas for kWh from power and hours, running cost, efficiency and payback of an upgrade, with worked examples and a table of yearly energy.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Energy', 'E (kWh) = P (kW) × t (h)'], ['Energy from watts', 'E (kWh) = P (W) × t (h) / 1000'], ['Running cost', 'Cost = E × tariff'], ['Efficiency', 'η = Pout / Pin'],
        ['Input power from output', 'Pin = Pout / η'], ['Simple payback', 'Payback (years) = cost of the upgrade / saving per year']]) +
        '<p class="note">The tariff is the price of one kWh in your own currency. A bill may also include fixed charges, demand charges and taxes that these formulas leave out.</p>' +
        '<h2>Worked example: running cost of a 7.5 kW load</h2><p>The load runs 8 hours a day for 26 days in the month, at a tariff of 0.10 per kWh.</p>' +
        steps(['E = 7.5 × 8 × 26 = ' + g4(E1) + ' kWh', 'Cost = ' + g4(E1) + ' × 0.10 = ' + g4(C1)]) +
        '<h2>Worked example: payback of a lighting upgrade</h2><p>100 fittings of 150 W are replaced by fittings of 60 W, each costing 40. They run 10 hours a day, every day, at 0.10 per kWh.</p>' +
        steps(['Power saved = 100 × (150 − 60) / 1000 = ' + g4(saved) + ' kW', 'Energy saved = ' + g4(saved) + ' × 10 × 365 = ' + g4(Es) + ' kWh a year', 'Saving = ' + g4(Es) + ' × 0.10 = ' + g4(Cs) + ' a year', 'Payback = 100 × 40 / ' + g4(Cs) + ' = ' + g4(pay) + ' years']) +
        '<h2>Energy per year by load and daily hours</h2>' + table(['Load', '4 h a day', '8 h a day', '12 h a day', '24 h a day'], rows),
      faq: [
        ['Is kWh the same as kW?', 'No. kW is a rate of using energy (power) and kWh is the amount of energy used over time. A 1 kW heater running for one hour uses 1 kWh.'],
        ['Why is my real bill higher than this?', 'The bill can add a fixed charge, a charge for maximum demand, a low power factor penalty and taxes. Add them to the energy cost.'],
        ['Does a motor use its rated power all the time?', 'Not usually. It draws power in line with its load. Use the real average load, or a measured figure, in place of the nameplate rating.'],
        ['What does simple payback leave out?', 'It ignores the cost of money, the life of the equipment, changes in the tariff and maintenance. For a large investment use a full life-cycle cost.']],
      related: [['../pages/energy-cost.html', 'Energy Cost Calculator'], ['../pages/electricity-bill.html', 'Electricity Bill Calculator'], ['../pages/kw-to-kwh.html', 'kW to kWh'], ['energy-converter.html', 'Energy Converter']]
    });
    A[A.length - 1].check = { E1, C1, saved, Es, Cs, pay };
  }

  /* ---------- 14. generators ---------- */
  {
    const P = 120, pf = 0.8, V = 415, S = P / pf, I = S * 1000 / (R3 * V);
    const Pf = 100, sfc = 220, rho = 840, Lh = Pf * sfc / rho, tank = 500, usable = 0.9, hrs = tank * usable / Lh;
    const rows = [25, 50, 75, 100].map((k) => [k + ' kW', g4(k * sfc / rho) + ' L/h']);
    A.push({
      slug: 'generator-formulas', h1: 'Generator Formulas: kVA, Current and Fuel',
      desc: 'Generator formulas for kVA from kW and power factor, rated current, fuel use from specific consumption and tank runtime, with worked examples and a fuel table.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Apparent power', 'S (kVA) = P (kW) / pf'], ['Rated current (three-phase)', 'I = S × 1000 / (√3 × V)'], ['Fuel use', 'L/h = P × SFC / ρ'], ['Runtime', 't = tank volume × usable fraction / (L/h)']]) +
        '<p class="note">SFC is the specific fuel consumption in g/kWh and ρ the density of the fuel in g/L. Take SFC from the engine data sheet at the actual load, because it is higher at light load. A generator is rated in kVA at a stated power factor, usually 0.8.</p>' +
        '<h2>Worked example: a 120 kW load at power factor 0.8</h2>' +
        steps(['S = 120 / 0.8 = ' + g4(S) + ' kVA', 'I = ' + g4(S) + ' × 1000 / (√3 × 415) = ' + g4(I) + ' A']) +
        '<h2>Worked example: fuel use at 100 kW</h2><p>SFC is 220 g/kWh, diesel is 840 g/L, the tank holds 500 L and no more than 90% of it is usable. These are example values.</p>' +
        steps(['L/h = 100 × 220 / 840 = ' + g4(Lh) + ' L/h', 't = 500 × 0.9 / ' + g4(Lh) + ' = ' + g4(hrs) + ' hours']) +
        '<h2>Fuel use by load (SFC 220 g/kWh)</h2>' + table(['Load', 'Fuel use'], rows),
      faq: [
        ['Why is a generator rated in kVA and not kW?', 'The alternator heats according to the current, not the power factor. The kVA rating sets the current limit, and the kW available depends on the load power factor.'],
        ['Should I size the generator at exactly the load?', 'No. Leave margin for growth and for starting currents, and check the largest motor start separately because it causes a voltage dip.'],
        ['Why does fuel use per kW rise at light load?', 'The engine is less efficient when lightly loaded, so the SFC is higher. Long periods below about 30% load can also harm the engine.'],
        ['Does the fuel density matter?', 'A little. Diesel is commonly taken as about 840 g/L, but use the value for your fuel.']],
      related: [['../calculators/generator-sizing/', 'Generator Sizing Calculator'], ['three-phase-power-formulas.html', 'Three-Phase Power Formulas'], ['motor-formulas.html', 'Motor Formulas'], ['../pages/kva-to-kw.html', 'kVA to kW']]
    });
    A[A.length - 1].check = { S, I, Lh, hrs };
  }

  /* ---------- 15. UPS ---------- */
  {
    const P = 30, pf = 0.9, S = P / pf, growth = 1.25, Sg = S * growth;
    const eta = 0.94, Vdc = 240, Idc = P * 1000 / (eta * Vdc), mins = 15, E = P * mins / 60 / eta;
    const rows = [10, 20, 30, 50].map((k) => [k + ' kW', g4(k / 0.9) + ' kVA', g4(k / 0.9 * 1.25) + ' kVA']);
    A.push({
      slug: 'ups-formulas', h1: 'UPS Formulas: kVA, DC Current and Battery',
      desc: 'UPS formulas for kVA from load kW and power factor, growth margin, battery DC current and the battery energy for a backup time, with worked examples.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Load in kVA', 'S = P / pf'], ['With growth margin', 'S(UPS) = S × (1 + growth)'], ['Battery DC current', 'Idc = P × 1000 / (η × Vdc)'], ['Battery energy for the backup time', 'E (kWh) = P × t (min) / 60 / η']]) +
        '<p class="note">P is the load in kW, pf the load power factor and η the inverter efficiency as a fraction. Vdc is the battery voltage. The energy is the usable energy at the end of the backup time: divide it by the depth of discharge as shown on the battery formulas page.</p>' +
        '<h2>Worked example: a 30 kW load at power factor 0.9</h2><p>Allow 25% for growth. The inverter is 94% efficient and the battery is 240 V.</p>' +
        steps(['S = 30 / 0.9 = ' + g4(S) + ' kVA', 'With growth: ' + g4(S) + ' × 1.25 = ' + g4(Sg) + ' kVA, so select the next size up', 'Idc = 30000 / (0.94 × 240) = ' + g4(Idc) + ' A at the nominal battery voltage', 'For 15 minutes: E = 30 × 15 / 60 / 0.94 = ' + g4(E) + ' kWh']) +
        '<h2>UPS size by load (power factor 0.9, 25% growth)</h2>' + table(['Load', 'Load in kVA', 'With growth'], rows),
      faq: [
        ['What is the difference between kVA and kW for a UPS?', 'Many modern UPS units are rated at a power factor of 1, so kVA equals kW. Older units are rated at 0.8 or 0.9. Check the data sheet before using the formula.'],
        ['Why is the battery current higher at the end of the backup time?', 'The battery voltage falls as it discharges, and the inverter draws more current to deliver the same power.'],
        ['Does the UPS efficiency matter?', 'Yes. The losses come from the battery too, so the battery must supply the load power divided by the efficiency.'],
        ['Should I size the UPS on the nameplate of the loads?', 'Use measured or realistic loads. Adding nameplates gives an oversized UPS that runs at low load, where its efficiency is poor.']],
      related: [['battery-formulas.html', 'Battery Formulas'], ['generator-formulas.html', 'Generator Formulas'], ['power-factor-formulas.html', 'Power Factor Formulas'], ['../calculators/battery-bank-sizing/', 'Battery Bank Sizing Calculator']]
    });
    A[A.length - 1].check = { S, Sg, Idc, E };
  }

  /* ---------- 16. harmonics ---------- */
  {
    const I1 = 100, hs = [[3, 30], [5, 20], [7, 10]];
    const thd = Math.sqrt(hs.reduce((a, h) => a + h[1] * h[1], 0)) / I1, Irms = I1 * Math.sqrt(1 + thd * thd);
    const dpf = 0.95, tpf = dpf / Math.sqrt(1 + thd * thd);
    const Ssc = 20000, Qc = 400, hr = Math.sqrt(Ssc / Qc), fr = 50 / Math.sqrt(0.07);
    const rows = [0, 10, 20, 30, 40].map((t) => [t + ' %', g4(0.95 / Math.sqrt(1 + (t / 100) * (t / 100)))]);
    A.push({
      slug: 'harmonics-formulas', h1: 'Harmonics Formulas: THD and True Power Factor',
      desc: 'Harmonics formulas for current THD, RMS current, true power factor, the resonant harmonic of a capacitor bank and detuned reactor tuning, with worked examples.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Total harmonic distortion', 'THD = √(I2² + I3² + I4² + …) / I1'], ['RMS current', 'Irms = I1 × √(1 + THD²)'], ['True power factor', 'pf = displacement pf / √(1 + THD²)'],
        ['Resonant harmonic of a capacitor bank', 'h = √(Ssc / Qc)'], ['Tuning of a detuned reactor', 'fr = f / √p, with p the reactor percentage as a fraction']]) +
        '<p class="note">I1 is the fundamental current and I2, I3 and so on the harmonic currents, all in the same unit. THD is a fraction here (multiply by 100 for percent). Ssc is the short-circuit level at the bus and Qc the capacitor bank size in the same unit. The true power factor formula applies when the voltage is nearly sinusoidal.</p>' +
        '<h2>Worked example: THD and RMS current</h2><p>A load draws 100 A at the fundamental, with 30 A of 3rd, 20 A of 5th and 10 A of 7th harmonic.</p>' +
        steps(['THD = √(30² + 20² + 10²) / 100 = ' + g4(thd * 100) + '%', 'Irms = 100 × √(1 + ' + g4(thd * thd) + ') = ' + g4(Irms) + ' A', 'With a displacement power factor of 0.95 the true power factor is 0.95 / √(1 + ' + g4(thd * thd) + ') = ' + g4(tpf)]) +
        '<h2>Worked example: capacitor bank resonance</h2><p>A 400 kVAR bank on a bus with a short-circuit level of 20 MVA (20,000 kVA).</p>' +
        steps(['h = √(20000 / 400) = ' + g4(hr) + ', close to the 7th harmonic, so there is a risk of resonance', 'A 7% detuned reactor tunes the bank to 50 / √0.07 = ' + g4(fr) + ' Hz, below the 5th harmonic at 250 Hz, which avoids the resonance']) +
        '<h2>True power factor at a displacement power factor of 0.95</h2>' + table(['Current THD', 'True power factor'], rows),
      faq: [
        ['Why do third harmonics matter in a four-wire system?', 'The third harmonic currents of the three phases are in step, so they add in the neutral instead of cancelling. The neutral current can exceed the phase current.'],
        ['What causes harmonics?', 'Non-linear loads such as drives, rectifiers, switch-mode power supplies and LED drivers draw current in pulses rather than as a sine wave.'],
        ['Why can a capacitor bank be a problem?', 'The bank and the supply inductance form a resonant circuit. If it resonates near a harmonic that the loads produce, the current and voltage can become very large.'],
        ['What is a good THD limit?', 'It depends on the standard and the point of measurement. Many standards compare the voltage THD at the point of common coupling with a limit near 5%. Check the one that applies to you.']],
      related: [['power-factor-formulas.html', 'Power Factor Formulas'], ['ac-circuit-formulas.html', 'AC Circuit Formulas'], ['short-circuit-formulas.html', 'Short-Circuit Formulas'], ['../calculators/power-systems/', 'Power systems calculators']]
    });
    A[A.length - 1].check = { thd, Irms, tpf, hr, fr };
  }

  /* ---------- 17. short circuit ---------- */
  {
    const Str = 1, Z = 5, Ssrc = 250, V = 415;
    const Mtr = Str / (Z / 100) , Mtot = 1 / (1 / Mtr + 1 / Ssrc), Isc = Mtot * 1e6 / (R3 * V), kap = 1.8, ip = kap * Math.SQRT2 * Isc;
    const Zc = 0.02, Isc2 = V / (R3 * Zc);
    const rows = [500, 1000, 1600, 2500].map((k) => { const m = k / 1000 / 0.05, mt = 1 / (1 / m + 1 / 250); return [k + ' kVA', g4(m) + ' MVA', g4(mt * 1e6 / (R3 * 415) / 1000) + ' kA']; });
    A.push({
      slug: 'short-circuit-formulas', h1: 'Short-Circuit Formulas: Fault Level by MVA',
      desc: 'Short-circuit formulas using the MVA method: transformer fault level, adding the source, three-phase fault current, peak current and the impedance method.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Fault level of a transformer', 'MVAsc = S (MVA) / (Z% / 100)'], ['Source and transformer in series', '1 / MVAtotal = 1 / MVAsource + 1 / MVAtransformer'], ['Three-phase fault current', 'Isc = MVAsc × 10⁶ / (√3 × V)'],
        ['Peak fault current', 'ip = κ × √2 × Isc'], ['Impedance method', 'Isc = V / (√3 × Z), with Z = √(R² + X²)']]) +
        '<p class="note">S is the transformer rating in MVA, Z% its impedance, V the line-to-line voltage in volts and κ a factor that depends on the R/X ratio of the circuit, between 1 and 2. A full study to IEC 60909 also includes a voltage factor and motor contributions.</p>' +
        '<h2>Worked example: 1 MVA, 5% transformer on a 250 MVA source</h2><p>The secondary is 415 V and κ is taken as 1.8.</p>' +
        steps(['Transformer: MVAsc = 1 / 0.05 = ' + g4(Mtr) + ' MVA', '1 / MVAtotal = 1 / ' + g4(Mtr) + ' + 1 / 250, so MVAtotal = ' + g4(Mtot) + ' MVA', 'Isc = ' + g4(Mtot) + ' × 10⁶ / (√3 × 415) = ' + g4(Isc / 1000) + ' kA', 'ip = 1.8 × √2 × ' + g4(Isc / 1000) + ' = ' + g4(ip / 1000) + ' kA']) +
        '<h2>Worked example: the impedance method</h2>' +
        steps(['A fault point with a total impedance of 0.02 Ω on 415 V gives Isc = 415 / (√3 × 0.02) = ' + g4(Isc2 / 1000) + ' kA']) +
        '<h2>Fault current at 415 V (5% transformers on a 250 MVA source)</h2>' + table(['Transformer', 'Fault level of the transformer', 'Fault current'], rows),
      faq: [
        ['Why add the source and transformer as reciprocals?', 'The impedances are in series, and the fault level is inversely proportional to the impedance, so the reciprocals of the fault levels add.'],
        ['Why does the breaker need the peak current as well?', 'The first half-cycle of a fault carries a peak larger than the rms value because of a DC component. Breakers are rated for the peak making current as well as the breaking current.'],
        ['Is the fault level of the supply a fixed number?', 'No. It changes with the network configuration. Ask the utility for the maximum and minimum fault levels at the point of supply.'],
        ['Do motors add to the fault current?', 'Yes. Running motors feed current into a fault for a few cycles. Large motors should be included in a proper study.']],
      related: [['transformer-formulas.html', 'Transformer Formulas'], ['../calculators/transformer-fault-current/', 'Transformer Fault Current Calculator'], ['cable-sizing-formulas.html', 'Cable Size Formulas'], ['earthing-formulas.html', 'Earthing Formulas']]
    });
    A[A.length - 1].check = { Mtr, Mtot, Isc, ip, Isc2 };
  }

  /* ---------- 18. unbalance ---------- */
  {
    const Vl = [400, 410, 396], avg = (400 + 410 + 396) / 3, dev = Math.max(...Vl.map((v) => Math.abs(v - avg))), pu = dev / avg * 100;
    const Ia = 100, Ib = 80, Ic = 60, IN = Math.sqrt(Ia * Ia + Ib * Ib + Ic * Ic - Ia * Ib - Ib * Ic - Ic * Ia);
    const nn = (a, b, c) => Math.sqrt(a * a + b * b + c * c - a * b - b * c - c * a);
    const rows = [100, 80, 60, 40, 20, 0].map((b) => [b + ' A', g4(nn(100, b, 100)) + ' A']);
    A.push({
      slug: 'unbalance-formulas', h1: 'Unbalance Formulas: Voltage and Neutral Current',
      desc: 'Three-phase unbalance formulas: percent voltage unbalance, neutral current from unequal phase currents and a table of neutral current, with worked examples.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Average voltage', 'Vavg = (V1 + V2 + V3) / 3'], ['Voltage unbalance (percent)', 'max |V − Vavg| / Vavg × 100'], ['Neutral current, resistive loads', 'IN = √(Ia² + Ib² + Ic² − Ia×Ib − Ib×Ic − Ic×Ia)']]) +
        '<p class="note">The voltage formula is the NEMA definition, using the line-to-line voltages. The IEC definition uses the negative-sequence component, which needs the phase angles as well. The neutral current formula assumes three currents 120° apart with the same power factor in each phase.</p>' +
        '<h2>Worked example: voltage unbalance</h2><p>The line voltages are 400 V, 410 V and 396 V.</p>' +
        steps(['Vavg = (400 + 410 + 396) / 3 = ' + g4(avg) + ' V', 'The largest deviation is ' + g4(dev) + ' V (the 410 V line)', 'Unbalance = ' + g4(dev) + ' / ' + g4(avg) + ' × 100 = ' + g4(pu) + '%']) +
        '<h2>Worked example: neutral current</h2><p>The phase currents are 100 A, 80 A and 60 A.</p>' +
        steps(['IN = √(100² + 80² + 60² − 100×80 − 80×60 − 60×100) = √' + g4(IN * IN) + ' = ' + g4(IN) + ' A']) +
        '<h2>Neutral current with phases A and C at 100 A</h2>' + table(['Phase B current', 'Neutral current'], rows),
      faq: [
        ['Why does unbalance matter for motors?', 'A small voltage unbalance causes a much larger current unbalance in an induction motor. The extra current heats the windings, so the motor is derated as unbalance rises.'],
        ['What causes voltage unbalance?', 'Unequal single-phase loads, a blown fuse on a capacitor bank, uneven transformer taps and loose connections.'],
        ['Why is the neutral current zero for equal loads?', 'The three currents are equal in size and 120° apart, so their sum is zero.'],
        ['Does the neutral formula include harmonics?', 'No. Third harmonic currents add in the neutral on top of this. See the harmonics page.']],
      related: [['three-phase-power-formulas.html', 'Three-Phase Power Formulas'], ['harmonics-formulas.html', 'Harmonics Formulas'], ['motor-formulas.html', 'Motor Formulas'], ['../calculators/power-systems/', 'Power systems calculators']]
    });
    A[A.length - 1].check = { avg, dev, pu, IN };
  }

  /* ---------- 19. resistors ---------- */
  {
    const Rs = 100 + 220 + 330, Rp = 100 * 220 / (100 + 220), Vin = 12, R1 = 10000, R2 = 4700, Vo = Vin * R2 / (R1 + R2), Pw = Vo * Vo / R2;
    const rows = [100, 220, 470, 1000].map((r) => ['100 Ω and ' + r + ' Ω', g4(100 * r / (100 + r)) + ' Ω']);
    A.push({
      slug: 'resistor-formulas', h1: 'Resistor Formulas: Series, Parallel, Divider',
      desc: 'Resistor formulas for series and parallel resistance, the voltage divider and power in a resistor, with worked examples and a table of parallel pairs.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Resistors in series', 'R = R1 + R2 + R3 + …'], ['Resistors in parallel', '1 / R = 1 / R1 + 1 / R2 + 1 / R3 + …'], ['Two in parallel', 'R = R1 × R2 / (R1 + R2)'],
        ['Voltage divider', 'Vout = Vin × R2 / (R1 + R2)'], ['Power in a resistor', 'P = V² / R = I² × R = V × I']]) +
        '<p class="note">R is in ohms, V in volts, I in amperes and P in watts. The divider formula holds when nothing loads the output. A load in parallel with R2 lowers Vout.</p>' +
        '<h2>Worked example: series and parallel</h2>' +
        steps(['Series: 100 + 220 + 330 = ' + g4(Rs) + ' Ω', 'Parallel, 100 Ω and 220 Ω: 100 × 220 / (100 + 220) = ' + g4(Rp) + ' Ω']) +
        '<h2>Worked example: a voltage divider</h2><p>R1 is 10 kΩ and R2 is 4.7 kΩ, from a 12 V supply.</p>' +
        steps(['Vout = 12 × 4700 / (10000 + 4700) = ' + g4(Vo) + ' V', 'Power in R2: P = ' + g4(Vo) + '² / 4700 = ' + g4(Pw * 1000) + ' mW']) +
        '<h2>100 Ω in parallel with another resistor</h2>' + table(['Pair', 'Combined'], rows),
      faq: [
        ['Why is the parallel resistance smaller than the smallest resistor?', 'Each resistor adds another path for the current, so the total opposition falls.'],
        ['How do I find the resistor power rating?', 'Calculate the power with P = V² / R, then choose a rating of at least twice that value so the resistor runs cool.'],
        ['Does the divider formula work with a load?', 'Not directly. Put the load resistance in parallel with R2 first, then use the combined value.'],
        ['What do the color bands mean?', 'They give the value and tolerance of the resistor. See the resistor color code page.']],
      related: [['ohms-law-formulas.html', 'Ohm’s Law Formulas'], ['resistor-color-code.html', 'Resistor Color Code'], ['resistance-converter.html', 'Resistance Converter'], ['../calculators/electrical-fundamentals/', 'Electrical fundamentals calculators']]
    });
    A[A.length - 1].check = { Rs, Rp, Vo, Pw };
  }

  /* ---------- 20. motor starting ---------- */
  {
    const IFL = 55000 / (0.93 * R3 * 415 * 0.88), kst = 6, Ist = kst * IFL;
    const sd = Ist / 3, x = 0.65, atI = x * x * Ist, atM = x * Ist, soft = 3 * IFL;
    const Sst = R3 * 415 * Ist / 1000, Ssc = 1 / (1 / 20 + 1 / 250) * 1000, dip = Sst / Ssc * 100;
    const rows = [['Direct on line', kst, 1], ['Star-delta', kst / 3, 1 / 3], ['Autotransformer 80%', kst * 0.64, 0.64], ['Autotransformer 65%', kst * 0.4225, 0.4225], ['Autotransformer 50%', kst * 0.25, 0.25]].map((r) => [r[0], g4(r[1]) + ' × FLC', g4(r[2] * 100) + ' %']);
    A.push({
      slug: 'motor-starting-formulas', h1: 'Motor Starting Formulas: DOL, Star-Delta',
      desc: 'Motor starting formulas for direct-on-line, star-delta, autotransformer and soft starter current and torque, starting kVA and voltage dip, with an example.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Direct-on-line starting current', 'Ist = k × IFL, with k typically 5 to 8'], ['Star-delta', 'line current = Ist / 3, torque = 1/3 of direct-on-line'],
        ['Autotransformer at tap x', 'supply current = x² × Ist, torque = x² × direct-on-line'], ['Starting kVA', 'Sst = √3 × V × Ist / 1000'], ['Approximate voltage dip', 'dip % ≈ Sst / Ssc × 100']]) +
        '<p class="note">IFL is the full-load current and k the locked-rotor current ratio from the motor data sheet. x is the tap as a fraction (0.65 for 65%). Ssc is the short-circuit level at the supply point, in kVA. Torque varies with the square of the voltage, which is why every method that lowers the current also lowers the torque.</p>' +
        '<h2>Worked example: the 55 kW motor at 415 V</h2><p>The full-load current is ' + g4(IFL) + ' A (see the motor formulas) and the starting current ratio is 6. The supply fault level is 18.52 MVA.</p>' +
        steps(['Direct-on-line: Ist = 6 × ' + g4(IFL) + ' = ' + g4(Ist) + ' A', 'Star-delta: ' + g4(Ist) + ' / 3 = ' + g4(sd) + ' A, with one third of the torque', 'Autotransformer at 65%: supply current = 0.65² × ' + g4(Ist) + ' = ' + g4(atI) + ' A, motor current ' + g4(atM) + ' A, torque 42.25%', 'Soft starter limited to 3 × IFL = ' + g4(soft) + ' A, which gives about (3 / 6)² = 25% of the direct-on-line torque',
          'Starting kVA = √3 × 415 × ' + g4(Ist) + ' / 1000 = ' + g4(Sst) + ' kVA, so the dip is about ' + g4(Sst) + ' / ' + g4(Ssc) + ' × 100 = ' + g4(dip) + '%']) +
        '<h2>Methods compared (starting ratio 6)</h2>' + table(['Method', 'Supply current at start', 'Torque at start'], rows),
      faq: [
        ['Why does star-delta cut the torque as well as the current?', 'Each winding sees the line voltage divided by √3, so the current and the voltage fall, and the torque falls with the square of the voltage to one third.'],
        ['When is direct-on-line starting acceptable?', 'When the supply can take the current without an unacceptable voltage dip, and the machine can stand the full starting torque. Small motors on a strong supply usually start this way.'],
        ['Is the voltage dip formula exact?', 'No. It is a quick estimate that treats the supply as a pure reactance. A proper study also includes the cable and the motor starting power factor.'],
        ['What if the load needs high torque to start?', 'A reduced-voltage method may fail to start it, because the torque falls with the square of the voltage. Compare the motor torque curve with the load torque curve.']],
      related: [['../calculators/motor-starting/', 'Motor Starting Calculator'], ['motor-formulas.html', 'Motor Formulas'], ['short-circuit-formulas.html', 'Short-Circuit Formulas'], ['../calculators/motor-engineering/', 'Motor engineering calculators']]
    });
    A[A.length - 1].check = { IFL, Ist, sd, atI, Sst, dip };
  }

  /* ---------- 21. circuit breakers ---------- */
  {
    const Ib = 63, In = 63, Iz = 72, I2 = 1.45 * In, lim = 1.45 * Iz;
    const rng = [['B', 3, 5], ['C', 5, 10], ['D', 10, 20]];
    const In2 = 32;
    const rows = [16, 32, 63].map((n) => [n + ' A'].concat(rng.map((r) => g4(r[1] * n) + ' to ' + g4(r[2] * n) + ' A')));
    A.push({
      slug: 'circuit-breaker-formulas', h1: 'Circuit Breaker Formulas: Rating and Trip',
      desc: 'Circuit breaker formulas: rating from design current and cable capacity, the 1.45 overload rule, trip ranges of B, C and D curves and breaking capacity.',
      inner: '<h2>The formulas</h2>' + table(['To check', 'Rule'], [
        ['Rating against load and cable', 'Ib ≤ In ≤ Iz'], ['Overload protection', 'I2 ≤ 1.45 × Iz, where I2 = 1.45 × In for a miniature breaker'], ['Magnetic (short-circuit) trip', 'B: 3 to 5 × In, C: 5 to 10 × In, D: 10 to 20 × In'],
        ['Breaking capacity', 'Icu ≥ prospective fault current at the breaker'], ['Fault protection', 'Zs ≤ U0 / Ia, where Ia is the current that trips in the required time']]) +
        '<p class="note">Ib is the design current, In the breaker rating, Iz the cable current capacity and I2 the current that makes the breaker trip within the conventional time. The trip ranges are those of IEC 60898 miniature breakers. Moulded-case and air breakers have adjustable settings, so use the data sheet.</p>' +
        '<h2>Worked example: a 63 A circuit</h2><p>The design current is 63 A and the cable can carry 72 A after correction factors.</p>' +
        steps(['Ib ≤ In ≤ Iz: 63 ≤ 63 ≤ 72, so the rating is acceptable', 'I2 = 1.45 × 63 = ' + g4(I2) + ' A, and 1.45 × Iz = ' + g4(lim) + ' A, so I2 ≤ 1.45 × Iz']) +
        '<h2>Worked example: instantaneous trip of a 32 A breaker</h2>' +
        steps(['Type B trips between ' + g4(3 * In2) + ' A and ' + g4(5 * In2) + ' A', 'Type C trips between ' + g4(5 * In2) + ' A and ' + g4(10 * In2) + ' A', 'Type D trips between ' + g4(10 * In2) + ' A and ' + g4(20 * In2) + ' A']) +
        '<h2>Magnetic trip range by rating and type</h2>' + table(['Rating', 'Type B', 'Type C', 'Type D'], rows),
      faq: [
        ['Which curve should I choose?', 'Type B suits resistive loads and long cables. Type C suits most mixed loads, and type D loads with a high inrush, such as transformers and some motors.'],
        ['Why is there a limit of 1.45 times Iz?', 'A breaker can carry up to 1.45 times its rating for a long time before it trips. The cable must survive that current, so the limit protects the insulation.'],
        ['Does a bigger breaker mean a safer circuit?', 'No. A breaker larger than the cable allows will not trip before the cable overheats. The rating must not exceed the cable current capacity.'],
        ['What is the difference between Icu and Ics?', 'Icu is the largest fault the breaker can interrupt once. Ics is the share of it that the breaker can interrupt and still stay in service. Ics is the more conservative figure.']],
      related: [['../calculators/electrical-protection/', 'Electrical protection calculators'], ['cable-sizing-formulas.html', 'Cable Size Formulas'], ['short-circuit-formulas.html', 'Short-Circuit Formulas'], ['earthing-formulas.html', 'Earthing Formulas']]
    });
    A[A.length - 1].check = { I2, lim };
  }

  /* ---------- 22. cooling ---------- */
  {
    const rho = 1.2, cp = 1005, Q = 5000, dT = 10, Vs = Q / (rho * cp * dT), Vh = Vs * 3600, cfm = Vh * 0.588578, btu = Q * 3.412142;
    const Q2 = 3000, V2h = 1000, dT2 = Q2 / (rho * cp * V2h / 3600);
    const rows = [1, 2, 5, 10].map((k) => [k + ' kW', g4(k * 1000 / (rho * cp * 10) * 3600) + ' m³/h', g4(k * 1000 / (rho * cp * 20) * 3600) + ' m³/h']);
    A.push({
      slug: 'cooling-formulas', h1: 'Cooling Formulas: Airflow and Heat Load',
      desc: 'Cooling formulas for the airflow needed to remove heat, the temperature rise of air, watts to BTU per hour and CFM, with worked examples and an airflow table.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Airflow to remove heat', 'V (m³/s) = Q / (ρ × cp × ΔT)'], ['Temperature rise of the air', 'ΔT = Q / (ρ × cp × V)'], ['Airflow in m³/h', 'V (m³/h) = V (m³/s) × 3600'], ['Heat in BTU/h', 'BTU/h = W × 3.412'], ['Airflow in CFM', 'CFM = m³/h × 0.5886']]) +
        '<p class="note">Q is the heat to remove in watts, ρ the air density (about 1.2 kg/m³ at sea level and room temperature), cp the specific heat of air (about 1,005 J/(kg·K)) and ΔT the allowed temperature rise in kelvin. At altitude or high temperature the air is thinner, so more airflow is needed. The heat load is the electrical power lost inside the enclosure.</p>' +
        '<h2>Worked example: a 5 kW heat load, 10 K rise</h2>' +
        steps(['V = 5000 / (1.2 × 1005 × 10) = ' + g4(Vs) + ' m³/s', 'V = ' + g4(Vs) + ' × 3600 = ' + g4(Vh) + ' m³/h, which is ' + g4(cfm) + ' CFM', 'Heat: 5000 × 3.412 = ' + g4(btu) + ' BTU/h']) +
        '<h2>Worked example: temperature rise at a given airflow</h2><p>A 3 kW load is cooled by 1,000 m³/h.</p>' +
        steps(['ΔT = 3000 / (1.2 × 1005 × 1000 / 3600) = ' + g4(dT2) + ' K']) +
        '<h2>Airflow needed by heat load</h2>' + table(['Heat load', 'For a 10 K rise', 'For a 20 K rise'], rows),
      faq: [
        ['Why is the airflow halved if the allowed rise is doubled?', 'Each cubic metre of air carries away a fixed amount of heat per kelvin, so twice the rise needs half the air.'],
        ['Is the fan rating the same as the airflow I get?', 'No. The free-air rating drops when the fan works against the resistance of filters and grilles. Use the fan curve at the real pressure.'],
        ['How do I find the heat load?', 'Add the losses of every device inside, not their power rating. A drive of 95% efficiency, for example, loses 5% of its power as heat.'],
        ['Does this work for water cooling?', 'The same form applies with the density and specific heat of water, which are about 1,000 kg/m³ and 4,186 J/(kg·K).']],
      related: [['../calculators/lighting-and-facilities/', 'Lighting and facilities calculators'], ['power-converter.html', 'Power Converter'], ['heating-formulas.html', 'Heating Formulas'], ['generator-formulas.html', 'Generator Formulas']]
    });
    A[A.length - 1].check = { Vs, Vh, cfm, btu, dT2 };
  }

  /* ---------- 23. heating ---------- */
  {
    const m = 200, c = 4.186, dT = 45, th = 2, eta = 0.9;
    const Ek = m * c * dT, Ekwh = Ek / 3600, Pk = Ekwh / (th * eta);
    const rows = [10, 20, 30, 40, 50].map((d) => [d + ' K', g4(100 * c * d / 3600) + ' kWh']);
    A.push({
      slug: 'heating-formulas', h1: 'Heating Formulas: Energy and Heater Power',
      desc: 'Heating formulas for the energy to warm water or another material, heater power for a heat-up time with efficiency, and kJ to kWh, with worked examples.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Heat energy', 'Q (kJ) = m × c × ΔT'], ['Energy in kWh', 'E (kWh) = Q (kJ) / 3600'], ['Heater power', 'P (kW) = E / (t × η)'], ['Heat-up time', 't (h) = E / (P × η)']]) +
        '<p class="note">m is the mass in kg and c the specific heat in kJ/(kg·K), which is 4.186 for water. One litre of water weighs about 1 kg. ΔT is the temperature rise in kelvin (the same number as in °C) and t the time in hours. η is the heater efficiency as a fraction and allows for losses to the surroundings.</p>' +
        '<h2>Worked example: 200 L of water from 15 °C to 60 °C in 2 hours</h2><p>The heater and tank have a combined efficiency of 90%.</p>' +
        steps(['Q = 200 × 4.186 × 45 = ' + g4(Ek) + ' kJ', 'E = ' + g4(Ek) + ' / 3600 = ' + g4(Ekwh) + ' kWh', 'P = ' + g4(Ekwh) + ' / (2 × 0.9) = ' + g4(Pk) + ' kW']) +
        '<h2>Energy to heat 100 L of water</h2>' + table(['Temperature rise', 'Energy'], rows),
      faq: [
        ['Does the formula include heat losses?', 'Only through the efficiency factor. A tank that stays warm for hours also loses heat to the room, so a larger allowance may be needed.'],
        ['What if the material is not water?', 'Use its own specific heat. Oil and metals need much less energy per kilogram than water, because their specific heat is lower.'],
        ['Why do I need the time?', 'The energy to heat the water is fixed, but a shorter heat-up time needs a more powerful heater to deliver it.'],
        ['What about a phase change?', 'Melting, boiling or freezing needs extra energy, called latent heat, on top of this formula.']],
      related: [['energy-cost-formulas.html', 'Energy and Cost Formulas'], ['energy-converter.html', 'Energy Converter'], ['cooling-formulas.html', 'Cooling Formulas'], ['../pages/kw-to-kwh.html', 'kW to kWh']]
    });
    A[A.length - 1].check = { Ek, Ekwh, Pk };
  }

  /* ---------- 24. per unit ---------- */
  {
    const Sb = 10, Vb = 11, Ib = Sb * 1e6 / (R3 * Vb * 1000), Zb = Vb * Vb / Sb;
    const Zt = 5 * Sb / 1, Zc = 0.5, Zcpu = Zc / Zb;
    const rows = [0.415, 6.6, 11, 33].map((v) => [v + ' kV', g4(v * v / Sb) + ' Ω', g4(Sb * 1e6 / (R3 * v * 1000)) + ' A']);
    A.push({
      slug: 'per-unit-formulas', h1: 'Per-Unit Formulas: Base Values and Impedance',
      desc: 'Per-unit system formulas: base current and base impedance from MVA and kV, converting ohms and percent impedance to per unit, and changing the base.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Base current', 'Ibase (A) = Sbase (MVA) × 10⁶ / (√3 × Vbase (kV) × 1000)'], ['Base impedance', 'Zbase (Ω) = Vbase² (kV) / Sbase (MVA)'], ['Impedance in per unit', 'Z(pu) = Z (Ω) / Zbase'],
        ['Percent to per unit', 'Z(pu) = Z% / 100'], ['Change of base', 'Z(pu, new) = Z(pu, old) × (Snew / Sold) × (Vold / Vnew)²']]) +
        '<p class="note">Sbase is the three-phase power base in MVA and Vbase the line-to-line voltage base in kV. Pick one Sbase for the whole network and a Vbase for each voltage level so that the bases follow the transformer ratios.</p>' +
        '<h2>Worked example: base values for 10 MVA and 11 kV</h2>' +
        steps(['Ibase = 10 × 10⁶ / (√3 × 11 × 1000) = ' + g4(Ib) + ' A', 'Zbase = 11² / 10 = ' + g4(Zb) + ' Ω', 'A cable of 0.5 Ω is 0.5 / ' + g4(Zb) + ' = ' + g4(Zcpu) + ' pu']) +
        '<h2>Worked example: change of base</h2><p>A 1 MVA transformer with an impedance of 5% (0.05 pu) is put on a 10 MVA base at the same voltage.</p>' +
        steps(['Z(pu) = 0.05 × (10 / 1) × 1 = ' + g4(Zt / 100) + ' pu, which is ' + g4(Zt) + '%']) +
        '<h2>Base values at 10 MVA</h2>' + table(['Voltage base', 'Base impedance', 'Base current'], rows),
      faq: [
        ['Why use per unit?', 'It removes the transformer ratios. All impedances are on one common base, so the fault level is simply 1 divided by the total per-unit impedance.'],
        ['How do I get the fault level in per unit?', 'MVAsc = Sbase / Z(pu), and the fault current is Ibase / Z(pu).'],
        ['Is a percent impedance the same as per unit?', 'It is the per-unit value times 100, on the rating of the equipment. Convert it to the network base before adding impedances.'],
        ['Does the voltage base have to be the nominal voltage?', 'It is usually the nominal system voltage at each level, chosen so the bases follow the transformer turns ratios.']],
      related: [['short-circuit-formulas.html', 'Short-Circuit Formulas'], ['transformer-formulas.html', 'Transformer Formulas'], ['../calculators/transformer-fault-current/', 'Transformer Fault Current Calculator'], ['../calculators/power-systems/', 'Power systems calculators']]
    });
    A[A.length - 1].check = { Ib, Zb, Zt, Zcpu };
  }

  /* ---------- 25. LED resistor ---------- */
  {
    const Vs = 12, Vf = 3.2, I = 0.02, R = (Vs - Vf) / I;
    const E12 = [1, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2], dec = [1, 10, 100, 1000, 10000];
    const stdList = []; dec.forEach((d) => E12.forEach((e) => stdList.push(Math.round(e * d * 10) / 10)));
    const Rs = stdList.find((x) => x >= R), Ia = (Vs - Vf) / Rs, Pr = Ia * Ia * Rs, Pl = Vf * Ia;
    const n3 = (Vs - 3 * Vf) / I;
    const rows = [5, 9, 12, 24].map((v) => [v + ' V', g4((v - Vf) / I) + ' Ω']);
    A.push({
      slug: 'led-formulas', h1: 'LED Formulas: Resistor Value and Power',
      desc: 'LED formulas for the series resistor from supply voltage, forward voltage and current, resistor power, LEDs in series, with worked examples and a table.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Series resistor', 'R = (Vs − Vf) / I'], ['Resistor with n LEDs in series', 'R = (Vs − n × Vf) / I'], ['Power in the resistor', 'PR = I² × R'], ['Power in the LED', 'PLED = Vf × I'], ['Current with a chosen resistor', 'I = (Vs − Vf) / R']]) +
        '<p class="note">Vs is the supply voltage, Vf the forward voltage of the LED (from the data sheet, often about 2 V for red and 3 V or more for white and blue) and I the current you want, in amperes. Vs must be larger than n × Vf. LEDs in parallel should each have their own resistor.</p>' +
        '<h2>Worked example: one LED on 12 V</h2><p>The LED has a forward voltage of 3.2 V and a target current of 20 mA.</p>' +
        steps(['R = (12 − 3.2) / 0.02 = ' + g4(R) + ' Ω', 'The next standard value (E12 series) is ' + g4(Rs) + ' Ω, which gives I = 8.8 / ' + g4(Rs) + ' = ' + g4(Ia * 1000) + ' mA', 'PR = ' + g4(Ia * 1000) + '² mA × ' + g4(Rs) + ' Ω = ' + g4(Pr * 1000) + ' mW, and PLED = 3.2 × ' + g4(Ia) + ' = ' + g4(Pl * 1000) + ' mW']) +
        '<h2>Worked example: three LEDs in series on 12 V</h2>' +
        steps(['R = (12 − 3 × 3.2) / 0.02 = ' + g4(n3) + ' Ω']) +
        '<h2>Resistor for one 3.2 V LED at 20 mA</h2>' + table(['Supply', 'Resistor'], rows),
      faq: [
        ['Why round up to the next standard value?', 'A larger resistor gives a slightly lower current, which is safer for the LED. A smaller value would push the current above the target.'],
        ['What power rating should the resistor have?', 'Use at least twice the calculated dissipation. A quarter-watt resistor is ample for a single indicator LED at 20 mA.'],
        ['Can I connect LEDs in parallel with one resistor?', 'It is risky. The forward voltages differ slightly, so one LED can take most of the current. Give each LED its own resistor.'],
        ['Does the forward voltage change?', 'Yes. It varies with current and temperature, and between batches. A constant-current driver is better for high-power LEDs.']],
      related: [['resistor-formulas.html', 'Resistor Formulas'], ['ohms-law-formulas.html', 'Ohm’s Law Formulas'], ['resistor-color-code.html', 'Resistor Color Code'], ['../calculators/electronics-and-instrumentation/', 'Electronics and instrumentation calculators']]
    });
    A[A.length - 1].check = { R, Rs, Ia, Pr, Pl, n3 };
  }

  /* ---------- 26. conduit fill ---------- */
  {
    const d = 10, n = 3, D = 40, ac = Math.PI / 4 * d * d, tot = n * ac, ad = Math.PI / 4 * D * D, fill = tot / ad * 100;
    const need = tot / 0.4, Dmin = Math.sqrt(need * 4 / Math.PI);
    const rows = [16, 20, 25, 32, 40, 50].map((x) => [x + ' mm', g4(Math.PI / 4 * x * x * 0.4) + ' mm²', g4(Math.PI / 4 * x * x * 0.31) + ' mm²']);
    A.push({
      slug: 'conduit-fill-formulas', h1: 'Conduit Fill Formulas: Percent Fill and Size',
      desc: 'Conduit fill formulas: cable area from diameter, percent fill, the smallest conduit for a set of cables, with a worked example and a table of usable area.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Area of one round cable', 'a = π × d² / 4'], ['Total cable area', 'A = a1 + a2 + … + an'], ['Conduit inside area', 'Ac = π × D² / 4'], ['Percent fill', 'Fill % = A / Ac × 100'], ['Smallest inside diameter', 'D = √(4 × A / (π × limit))']]) +
        '<p class="note">d is the overall diameter of the cable including the insulation and sheath, and D the inside diameter of the conduit, both in millimetres. The fill limit is set by your wiring code. A common rule, for example in NEC Chapter 9, is 53% for one cable, 31% for two and 40% for three or more. Other countries use different limits, and some use a space factor. Use the figure from your own code.</p>' +
        '<h2>Worked example: three cables in a conduit</h2><p>Three cables of 10 mm overall diameter go into a conduit with an inside diameter of 40 mm. The limit for three or more cables is taken as 40%.</p>' +
        steps(['a = π × 10² / 4 = ' + g4(ac) + ' mm², so the three cables are A = ' + g4(tot) + ' mm²', 'Ac = π × 40² / 4 = ' + g4(ad) + ' mm²', 'Fill = ' + g4(tot) + ' / ' + g4(ad) + ' × 100 = ' + g4(fill) + '%, which is below 40%']) +
        '<h2>Worked example: smallest conduit</h2>' +
        steps(['The conduit needs an inside area of at least ' + g4(tot) + ' / 0.4 = ' + g4(need) + ' mm²', 'D = √(4 × ' + g4(need) + ' / π) = ' + g4(Dmin) + ' mm inside diameter, so choose the next size up']) +
        '<h2>Usable area by inside diameter</h2>' + table(['Inside diameter', 'At 40% fill', 'At 31% fill'], rows),
      faq: [
        ['Why is the fill limited?', 'Cables need room to be pulled without damage and to lose heat. A conduit packed full also raises the pulling tension and the heating.'],
        ['Do I use the conductor size or the overall cable diameter?', 'Use the overall diameter, including the insulation and the outer sheath. The conductor area alone would understate the fill.'],
        ['Does the conduit wall thickness matter?', 'Yes. Use the inside diameter from the manufacturer’s data. The nominal trade size is not the inside diameter.'],
        ['Does the fill limit fix the number of cables I may run?', 'The fill limit is one check. Heating and derating for grouped cables are separate checks, and bends and the run length affect pulling.']],
      related: [['cable-sizing-formulas.html', 'Cable Size Formulas'], ['voltage-drop-formulas.html', 'Voltage Drop Formulas'], ['../calculators/cable-engineering/', 'Cable engineering calculators'], ['../calculators/cable-derating/', 'Cable Derating Calculator']]
    });
    A[A.length - 1].check = { ac, tot, ad, fill, need, Dmin };
  }

  /* ---------- 27. lightning protection ---------- */
  {
    const R = 45, h = 10, hx = 4, r0 = Math.sqrt(h * (2 * R - h)), rx = r0 - Math.sqrt(hx * (2 * R - hx));
    const cls = [['I', 20], ['II', 30], ['III', 45], ['IV', 60]];
    const rows = [5, 10, 15, 20].map((hh) => [hh + ' m'].concat(cls.map((c) => hh <= c[1] ? g4(Math.sqrt(hh * (2 * c[1] - hh))) + ' m' : '—')));
    A.push({
      slug: 'lightning-protection-formulas', h1: 'Lightning Protection Formulas: Rolling Sphere',
      desc: 'Lightning protection formulas: rolling sphere radius by protection level, protected radius of a vertical air terminal, and the radius at a lower height.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Protected radius at ground level', 'r0 = √(h × (2R − h))'], ['Protected radius at height hx', 'rx = √(h × (2R − h)) − √(hx × (2R − hx))'], ['Condition', 'h ≤ R and hx ≤ h']]) +
        '<p class="note">R is the rolling sphere radius in metres, h the height of the air terminal above the reference plane and hx the height of the surface you want to protect. The rolling sphere radius depends on the protection level of the system (IEC 62305-3 uses 20, 30, 45 and 60 m for levels I to IV, as in the table below). The standard has the full design rules, and a risk assessment comes first.</p>' +
        '<h2>Rolling sphere radius by protection level</h2>' + table(['Protection level', 'Rolling sphere radius R'], cls.map((c) => [c[0], c[1] + ' m'])) +
        '<h2>Worked example: a 10 m rod, level III</h2><p>A vertical air terminal 10 m high with R = 45 m. The equipment to protect is 4 m high.</p>' +
        steps(['r0 = √(10 × (2 × 45 − 10)) = √800 = ' + g4(r0) + ' m at ground level', 'The term at 4 m is √(4 × (90 − 4)) = ' + g4(Math.sqrt(hx * (2 * R - hx))) + ' m', 'rx = ' + g4(r0) + ' − ' + g4(Math.sqrt(hx * (2 * R - hx))) + ' = ' + g4(rx) + ' m protected radius at 4 m height']) +
        '<h2>Protected radius at ground level by rod height</h2>' + table(['Rod height', 'Level I', 'Level II', 'Level III', 'Level IV'], rows),
      faq: [
        ['What does the rolling sphere method do?', 'It rolls an imaginary sphere of radius R over the structure. Anything the sphere can touch may be struck, and anything it cannot touch is shielded by the air terminals.'],
        ['Why is the radius smaller at a higher level?', 'Level I is the highest protection. It uses the smallest sphere, which can slip into more gaps and so asks for more air terminals.'],
        ['Can I use the formula when the rod is higher than R?', 'No. For h above R the formula does not apply and the protected radius is limited by the sphere radius. Use the standard.'],
        ['Does this replace a lightning risk assessment?', 'No. The risk assessment chooses whether you need protection and which level. These formulas only give the geometry for a chosen level.']],
      related: [['earthing-formulas.html', 'Earthing Formulas'], ['../calculators/earthing-and-grounding/', 'Earthing and grounding calculators'], ['../calculators/earth-resistance/', 'Earth Resistance Calculator'], ['short-circuit-formulas.html', 'Short-Circuit Formulas']]
    });
    A[A.length - 1].check = { r0, rx };
  }

  /* ---------- 28. transformer efficiency ---------- */
  {
    const S = 1000, pf = 0.8, Pfe = 1.7, Pcu = 10.5, Zp = 5;
    const eff = (x) => x * S * pf / (x * S * pf + Pfe + x * x * Pcu) * 100;
    const xm = Math.sqrt(Pfe / Pcu), Rp = Pcu / S * 100, Xp = Math.sqrt(Zp * Zp - Rp * Rp), reg = Rp * pf + Xp * Math.sqrt(1 - pf * pf);
    const rows = [0.25, 0.5, 0.75, 1].map((x) => [Math.round(x * 100) + '%', g4(x * S * pf) + ' kW', g4(Pfe + x * x * Pcu) + ' kW', g4(eff(x)) + '%']);
    A.push({
      slug: 'transformer-efficiency-formulas', h1: 'Transformer Efficiency and Regulation Formulas',
      desc: 'Transformer efficiency formulas: efficiency from iron and copper loss, load at maximum efficiency, voltage regulation, a worked example and a table by load.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Output power at load x', 'Pout = x × S × pf'], ['Copper loss at load x', 'Pcu(x) = x² × Pcu(full load)'], ['Efficiency', 'η = Pout / (Pout + Piron + x² × Pcu) × 100'], ['Load at maximum efficiency', 'x = √(Piron / Pcu)'],
        ['Resistance in percent', '%R = Pcu / (S × 1000) × 100 (S in kVA, Pcu in kW)'], ['Voltage regulation, lagging', '%reg ≈ %R × pf + %X × sin φ, with %X = √(%Z² − %R²)']]) +
        '<p class="note">S is the rated kVA, x the load as a fraction of rating, Piron the no-load (iron) loss and Pcu the load (copper) loss at full load, both in kW. The regulation formula is the usual approximation for load near rating. For a leading power factor, subtract the %X term.</p>' +
        '<h2>Worked example: 1,000 kVA at power factor 0.8</h2><p>Iron loss 1.7 kW, copper loss 10.5 kW at full load, impedance 5%.</p>' +
        steps(['At full load Pout = 1 × 1000 × 0.8 = ' + g4(S * pf) + ' kW and the losses are ' + g4(Pfe + Pcu) + ' kW', 'η = ' + g4(S * pf) + ' / (' + g4(S * pf) + ' + ' + g4(Pfe + Pcu) + ') × 100 = ' + g4(eff(1)) + '%', 'Maximum efficiency is at x = √(1.7 / 10.5) = ' + g4(xm) + ' of full load, where η = ' + g4(eff(xm)) + '%']) +
        '<h2>Worked example: regulation</h2>' +
        steps(['%R = 10.5 / 1000 × 100 = ' + g4(Rp) + '% and %X = √(5² − ' + g4(Rp) + '²) = ' + g4(Xp) + '%', '%reg = ' + g4(Rp) + ' × 0.8 + ' + g4(Xp) + ' × 0.6 = ' + g4(reg) + '%']) +
        '<h2>Efficiency by load at power factor 0.8</h2>' + table(['Load', 'Output', 'Losses', 'Efficiency'], rows),
      faq: [
        ['Why is the best efficiency below full load?', 'Iron loss is fixed and copper loss rises with the square of the load. They are equal at x = √(Piron / Pcu), which is the point of best efficiency.'],
        ['Which losses are on the test report?', 'The no-load test gives the iron loss and the short-circuit test gives the copper loss at rated current. Use the figures from your transformer’s test certificate.'],
        ['Does a lower power factor lower the efficiency?', 'Yes. The output power in kW falls while the losses stay the same, so the efficiency falls.'],
        ['Is the regulation formula exact?', 'It is an approximation. It is close for loads up to rating and for impedances typical of distribution transformers.']],
      related: [['transformer-formulas.html', 'Transformer Formulas'], ['short-circuit-formulas.html', 'Short-Circuit Formulas'], ['per-unit-formulas.html', 'Per-Unit Formulas'], ['../calculators/transformer-sizing/', 'Transformer Sizing Calculator']]
    });
    A[A.length - 1].check = { effFull: eff(1), xm, effMax: eff(xm), Rp, Xp, reg };
  }

  /* ---------- 29. pump power ---------- */
  {
    const Q = 50, H = 30, rho = 1000, g = 9.80665, etaP = 0.7, etaM = 0.9;
    const Qs = Q / 3600, Ph = rho * g * Qs * H / 1000, Psh = Ph / etaP, Pin = Psh / etaM;
    const rows = [10, 25, 50, 100].map((q) => [q + ' m³/h', g4(rho * g * (q / 3600) * H / 1000) + ' kW', g4(rho * g * (q / 3600) * H / 1000 / (etaP * etaM)) + ' kW']);
    A.push({
      slug: 'pump-formulas', h1: 'Pump Formulas: Hydraulic, Shaft and Motor Power',
      desc: 'Pump power formulas: hydraulic power from flow and head, shaft power from pump efficiency, motor input power, with a worked example and a table by flow.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Hydraulic power', 'Ph (kW) = ρ × g × Q × H / 1000'], ['Shaft power', 'Pshaft = Ph / ηpump'], ['Motor input power', 'Pin = Pshaft / ηmotor'], ['Flow in m³/s', 'Q (m³/s) = Q (m³/h) / 3600'], ['Pressure from head', 'Δp (Pa) = ρ × g × H']]) +
        '<p class="note">ρ is the liquid density in kg/m³ (1,000 for clean water), g = 9.80665 m/s², Q the flow in m³/s and H the total head in metres, which includes the static lift and the friction losses. The efficiencies are fractions. Take the pump efficiency from the pump curve at the duty point.</p>' +
        '<h2>Worked example: 50 m³/h at 30 m head</h2><p>Water, pump efficiency 70% and motor efficiency 90%.</p>' +
        steps(['Q = 50 / 3600 = ' + g4(Qs) + ' m³/s', 'Ph = 1000 × 9.80665 × ' + g4(Qs) + ' × 30 / 1000 = ' + g4(Ph) + ' kW', 'Pshaft = ' + g4(Ph) + ' / 0.7 = ' + g4(Psh) + ' kW', 'Pin = ' + g4(Psh) + ' / 0.9 = ' + g4(Pin) + ' kW electrical input']) +
        '<h2>Power by flow at 30 m head</h2>' + table(['Flow', 'Hydraulic power', 'Motor input (70% × 90%)'], rows),
      faq: [
        ['What is total head?', 'It is the height the liquid is lifted plus the pressure and the friction losses in the pipe and fittings, all expressed as metres of liquid.'],
        ['Does a heavier liquid need more power?', 'Yes. Power is proportional to the density, so a liquid of density 1,200 kg/m³ needs 20% more power than water for the same flow and head.'],
        ['What size motor should I choose?', 'Choose a standard motor rating above the shaft power with a margin. The pump curve may show a higher power at the end of the curve, so check it.'],
        ['Where do I find the pump efficiency?', 'It is on the manufacturer’s curve at the flow and head of your duty point. It is lower away from the best efficiency point.']],
      related: [['motor-formulas.html', 'Induction Motor Formulas'], ['fan-formulas.html', 'Fan Formulas'], ['energy-cost-formulas.html', 'Energy and Cost Formulas'], ['../calculators/motor-engineering/', 'Motor engineering calculators']]
    });
    A[A.length - 1].check = { Qs, Ph, Psh, Pin };
  }

  /* ---------- 30. fan power and affinity ---------- */
  {
    const Q = 2, dp = 800, eta = 0.65, Pa = Q * dp / 1000, Ps = Pa / eta, r = 0.8;
    const Q2 = Q * r, dp2 = dp * r * r, P2 = Ps * r * r * r;
    const rows = [1, 0.9, 0.8, 0.7, 0.5].map((k) => [Math.round(k * 100) + '%', g4(k * 100) + '%', g4(k * k * 100) + '%', g4(k * k * k * 100) + '%']);
    A.push({
      slug: 'fan-formulas', h1: 'Fan Formulas: Air Power and Affinity Laws',
      desc: 'Fan formulas: air power from flow and pressure, shaft power from fan efficiency, and the affinity laws for flow, pressure and power when speed changes.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Air power', 'Pair (kW) = Q × Δp / 1000'], ['Shaft power', 'Pshaft = Pair / ηfan'], ['Flow at a new speed', 'Q2 = Q1 × (N2 / N1)'], ['Pressure at a new speed', 'Δp2 = Δp1 × (N2 / N1)²'], ['Power at a new speed', 'P2 = P1 × (N2 / N1)³']]) +
        '<p class="note">Q is the flow in m³/s, Δp the total pressure rise in pascals and η the fan efficiency as a fraction (use the total or static value that matches your Δp). The affinity laws hold for the same fan and system, and they are an approximation when the system has a static pressure that does not change with flow.</p>' +
        '<h2>Worked example: 2 m³/s at 800 Pa</h2><p>The fan efficiency is 65%.</p>' +
        steps(['Pair = 2 × 800 / 1000 = ' + g4(Pa) + ' kW', 'Pshaft = ' + g4(Pa) + ' / 0.65 = ' + g4(Ps) + ' kW']) +
        '<h2>Worked example: speed reduced to 80%</h2><p>A drive slows the same fan from 50 Hz to 40 Hz, a speed ratio of 0.8.</p>' +
        steps(['Q2 = 2 × 0.8 = ' + g4(Q2) + ' m³/s', 'Δp2 = 800 × 0.8² = ' + g4(dp2) + ' Pa', 'P2 = ' + g4(Ps) + ' × 0.8³ = ' + g4(P2) + ' kW, which is ' + g4(r * r * r * 100) + '% of the original power']) +
        '<h2>Affinity laws by speed</h2>' + table(['Speed', 'Flow', 'Pressure', 'Power'], rows),
      faq: [
        ['Why does a small speed cut save so much power?', 'Power varies with the cube of the speed. A 20% cut in speed gives about half the power.'],
        ['Does the same law apply to pumps?', 'Yes, for the same pump and system. Flow follows the speed, head the square of the speed and power the cube.'],
        ['What about a system with static head or a closed damper?', 'The system curve does not follow the square law then, so the saving is smaller. Use the fan curve and the system curve to find the new duty point.'],
        ['Does the drive have losses?', 'Yes. A variable-speed drive has its own efficiency, usually a few percent, and the motor efficiency falls at low load.']],
      related: [['pump-formulas.html', 'Pump Formulas'], ['cooling-formulas.html', 'Cooling Formulas'], ['motor-formulas.html', 'Induction Motor Formulas'], ['../calculators/motor-engineering/', 'Motor engineering calculators']]
    });
    A[A.length - 1].check = { Pa, Ps, Q2, dp2, P2 };
  }

  /* ---------- 31. inductor ---------- */
  {
    const L = 0.5, I = 4, E = 0.5 * L * I * I, L2 = 0.1, R = 20, V = 24, tau = L2 / R, t = 0.01, i = V / R * (1 - Math.exp(-t / tau)), Iss = V / R;
    const rows = [1, 2, 3, 5].map((k) => [k + ' τ', g4(k * tau * 1000) + ' ms', g4((1 - Math.exp(-k)) * 100) + '%', g4(Iss * (1 - Math.exp(-k))) + ' A']);
    A.push({
      slug: 'inductor-formulas', h1: 'Inductor Formulas: Energy and L/R Time Constant',
      desc: 'Inductor formulas: stored energy, L/R time constant, current rise after switch-on, series and parallel inductance, with worked examples and a table.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Stored energy', 'E (J) = ½ × L × I²'], ['Time constant', 'τ (s) = L / R'], ['Current rise on a step of voltage', 'i(t) = (V / R) × (1 − e^(−t/τ))'], ['Final current', 'I = V / R'], ['Inductors in series', 'L = L1 + L2 + … (no coupling)'], ['Inductors in parallel', '1 / L = 1 / L1 + 1 / L2 + … (no coupling)']]) +
        '<p class="note">L is in henries, I in amperes, R in ohms and t in seconds. The current reaches about 63% of its final value after one time constant and about 99% after five. The series and parallel rules assume no magnetic coupling between the inductors.</p>' +
        '<h2>Worked example: energy in a coil</h2><p>A 0.5 H coil carries 4 A.</p>' +
        steps(['E = ½ × 0.5 × 4² = ' + g4(E) + ' J']) +
        '<h2>Worked example: switching on an L-R circuit</h2><p>A 100 mH coil in series with 20 Ω is switched onto 24 V.</p>' +
        steps(['τ = 0.1 / 20 = ' + g4(tau * 1000) + ' ms and the final current is 24 / 20 = ' + g4(Iss) + ' A', 'After 10 ms, i = ' + g4(Iss) + ' × (1 − e^(−10/5)) = ' + g4(i) + ' A']) +
        '<h2>Current rise in the 100 mH, 20 Ω circuit</h2>' + table(['Time', 'Elapsed', 'Share of final current', 'Current'], rows),
      faq: [
        ['What happens when I open the circuit of a coil carrying current?', 'The current tries to continue and the voltage across the coil rises sharply. A diode across a relay coil, or a snubber, limits that voltage.'],
        ['Is the coil resistance included in R?', 'Yes. R is the total resistance in the loop, including the winding resistance of the coil.'],
        ['How does this compare with a capacitor?', 'A capacitor stores energy in the electric field as ½CV² and has a time constant RC. A coil stores it in the magnetic field as ½LI² and has a time constant L/R.'],
        ['Does iron saturation change the result?', 'Yes. A cored inductor saturates at high current and its inductance falls, so the simple formulas no longer apply.']],
      related: [['capacitor-formulas.html', 'Capacitor Formulas'], ['ac-circuit-formulas.html', 'AC Circuit Formulas'], ['resistor-formulas.html', 'Resistor Formulas'], ['../calculators/electronics-and-instrumentation/', 'Electronics and instrumentation calculators']]
    });
    A[A.length - 1].check = { E, tau, i, Iss };
  }

  /* ---------- 32. waveform values ---------- */
  {
    const Vr = 230, Vp = Vr * Math.SQRT2, Vpp = 2 * Vp, Vav = 2 * Vp / Math.PI;
    const wf = [['Sine', 1 / Math.SQRT2, 2 / Math.PI], ['Square', 1, 1], ['Triangle', 1 / R3, 0.5]];
    const rows = wf.map((w) => [w[0], g4(100 * w[1]) + ' V', g4(100 * w[2]) + ' V', g4(w[1] / w[2])]);
    A.push({
      slug: 'rms-waveform-formulas', h1: 'RMS, Peak and Average Value Formulas',
      desc: 'RMS, peak, peak-to-peak and average value formulas for sine, square and triangle waves, form factor and crest factor, with a worked example and table.',
      inner: '<h2>The formulas for a sine wave</h2>' + table(['To find', 'Formula'], [
        ['RMS value', 'Vrms = Vpeak / √2 = 0.7071 × Vpeak'], ['Peak value', 'Vpeak = √2 × Vrms = 1.4142 × Vrms'], ['Peak-to-peak', 'Vpp = 2 × Vpeak'], ['Average of a half cycle', 'Vavg = 2 × Vpeak / π = 0.6366 × Vpeak'], ['Form factor', 'Vrms / Vavg = 1.1107'], ['Crest factor', 'Vpeak / Vrms = 1.4142']]) +
        '<p class="note">The average of a full sine cycle is zero, so the average value quoted is that of the rectified wave, over a half cycle. The same relations hold for current. RMS is the value that gives the same heating in a resistor as a direct voltage of that size.</p>' +
        '<h2>Worked example: a 230 V supply</h2>' +
        steps(['Vpeak = 1.4142 × 230 = ' + g4(Vp) + ' V', 'Vpp = 2 × ' + g4(Vp) + ' = ' + g4(Vpp) + ' V', 'Vavg = 2 × ' + g4(Vp) + ' / π = ' + g4(Vav) + ' V (half-cycle average)']) +
        '<h2>Other waveforms with a 100 V peak</h2>' + table(['Waveform', 'RMS', 'Average (rectified)', 'Form factor'], rows),
      faq: [
        ['Why is the supply quoted as an RMS value?', 'The RMS value produces the same heating in a resistor as the same direct voltage, so 230 V AC heats a heater like 230 V DC.'],
        ['Do all meters read RMS?', 'No. Many cheap meters measure the average and scale it for a sine wave. They read wrongly on distorted waveforms. A true-RMS meter does not have this fault.'],
        ['What is the crest factor used for?', 'It is the peak divided by the RMS value. A high crest factor means high peaks, which matters for the range of meters and the sizing of drives and UPS inverters.'],
        ['Are these formulas valid for a distorted wave?', 'The ratios above are for the ideal shapes. For a distorted wave, measure the RMS or compute it from the harmonics.']],
      related: [['ac-circuit-formulas.html', 'AC Circuit Formulas'], ['harmonics-formulas.html', 'Harmonics Formulas'], ['three-phase-power-formulas.html', 'Three-Phase Power Formulas'], ['../calculators/electrical-fundamentals/', 'Electrical fundamentals calculators']]
    });
    A[A.length - 1].check = { Vp, Vpp, Vav };
  }

  /* ---------- 33. resonance ---------- */
  {
    const L = 0.01, C = 100e-6, Rr = 5, f0 = 1 / (2 * Math.PI * Math.sqrt(L * C)), XL = 2 * Math.PI * f0 * L, Q = XL / Rr, BW = f0 / Q;
    const rows = [47, 100, 220, 470].map((c) => [c + ' µF', g4(1 / (2 * Math.PI * Math.sqrt(L * c * 1e-6))) + ' Hz']);
    A.push({
      slug: 'resonance-formulas', h1: 'Resonance Formulas: Frequency, Q, Bandwidth',
      desc: 'Resonance formulas for a series or parallel LC circuit: resonant frequency, reactance at resonance, quality factor Q and bandwidth, with a worked example.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Resonant frequency', 'f0 = 1 / (2π × √(L × C))'], ['Reactance at resonance', 'XL = XC = 2π × f0 × L = √(L / C)'], ['Q of a series circuit', 'Q = XL / R = (1 / R) × √(L / C)'], ['Bandwidth', 'BW = f0 / Q'], ['Inductance for a chosen f0', 'L = 1 / ((2π × f0)² × C)']]) +
        '<p class="note">L is in henries, C in farads, R in ohms and f in hertz. At resonance the inductive and capacitive reactances are equal and cancel in a series circuit, so only R limits the current. The same f0 applies to the parallel circuit, where the impedance is at its highest. R here is the series resistance of the circuit.</p>' +
        '<h2>Worked example: 10 mH and 100 µF with 5 Ω</h2>' +
        steps(['f0 = 1 / (2π × √(0.01 × 0.0001)) = ' + g4(f0) + ' Hz', 'XL = 2π × ' + g4(f0) + ' × 0.01 = ' + g4(XL) + ' Ω, and XC is the same', 'Q = ' + g4(XL) + ' / 5 = ' + g4(Q) + ', so the bandwidth is ' + g4(f0) + ' / ' + g4(Q) + ' = ' + g4(BW) + ' Hz']) +
        '<h2>Resonant frequency with 10 mH</h2>' + table(['Capacitance', 'f0'], rows),
      faq: [
        ['What happens at resonance in a series circuit?', 'The two reactances cancel, the impedance falls to R and the current is at its largest. The voltages across L and C can each be Q times the supply voltage.'],
        ['Why does resonance matter in power systems?', 'A capacitor bank can resonate with the system inductance near a harmonic, which then amplifies it. The harmonics article shows an example.'],
        ['Does a higher Q give a narrower response?', 'Yes. Bandwidth is f0 divided by Q, so a higher Q gives a sharper peak.'],
        ['Are real components ideal?', 'No. Coils have resistance and capacitors have losses, and both affect the Q and the true resonant frequency slightly.']],
      related: [['inductor-formulas.html', 'Inductor Formulas'], ['capacitor-formulas.html', 'Capacitor Formulas'], ['ac-circuit-formulas.html', 'AC Circuit Formulas'], ['harmonics-formulas.html', 'Harmonics Formulas']]
    });
    A[A.length - 1].check = { f0, XL, Q, BW };
  }

  /* ---------- 34. motor efficiency ---------- */
  {
    const P = 55, e1 = 0.91, e2 = 0.94, hrs = 6000, tar = 8;
    const i1 = P / e1, i2 = P / e2, loss1 = i1 - P, dP = i1 - i2, dE = dP * hrs, cost = dE * tar;
    const rows = [0.9, 0.92, 0.94, 0.96].map((e) => [g4(e * 100) + '%', g4(P / e) + ' kW', g4(P / e - P) + ' kW']);
    A.push({
      slug: 'motor-efficiency-formulas', h1: 'Motor Efficiency Formulas: Input and Savings',
      desc: 'Motor efficiency formulas: input power and losses from shaft power, and the energy and cost saved by a higher-efficiency motor, with a worked example.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Efficiency', 'η = Pshaft / Pinput'], ['Input power', 'Pinput = Pshaft / η'], ['Losses', 'Ploss = Pinput − Pshaft'], ['Power saved by a better motor', 'ΔP = Pshaft × (1 / η1 − 1 / η2)'], ['Energy saved', 'ΔE (kWh) = ΔP × operating hours'], ['Money saved', 'Saving = ΔE × tariff']]) +
        '<p class="note">Pshaft is the mechanical load on the shaft in kW and η a fraction. Use the efficiency at the actual load from the data sheet, because it is lower at light load. The comparison holds the shaft load the same. The cost of the new motor and its payback are separate calculations.</p>' +
        '<h2>Worked example: replacing a 91% motor with a 94% motor</h2><p>The shaft load is 55 kW for 6,000 hours a year, and the tariff is 8 per kWh (any currency).</p>' +
        steps(['Input power at 91% = 55 / 0.91 = ' + g4(i1) + ' kW, which means losses of ' + g4(loss1) + ' kW', 'Input power at 94% = 55 / 0.94 = ' + g4(i2) + ' kW', 'ΔP = ' + g4(i1) + ' − ' + g4(i2) + ' = ' + g4(dP) + ' kW', 'ΔE = ' + g4(dP) + ' × 6,000 = ' + g4(dE) + ' kWh a year, which is ' + g4(cost) + ' at 8 per kWh']) +
        '<h2>Input power and losses for a 55 kW shaft load</h2>' + table(['Efficiency', 'Input power', 'Losses'], rows),
      faq: [
        ['Where do I find the motor efficiency?', 'It is on the data sheet or the nameplate, often at 100%, 75% and 50% load. Use the figure at the load the motor runs at.'],
        ['What are IE efficiency classes?', 'IEC 60034-30-1 defines classes IE1 to IE4 with minimum efficiencies by rating and speed. Check the table in the standard for your motor.'],
        ['Does a more efficient motor always pay back?', 'Not always. The saving depends on the hours run and the tariff, and a motor that runs a few hundred hours a year seldom repays the extra cost.'],
        ['Is the loss only in the motor?', 'The drive, coupling and driven machine have their own losses. The motor figure is only part of the system efficiency.']],
      related: [['motor-formulas.html', 'Induction Motor Formulas'], ['pump-formulas.html', 'Pump Formulas'], ['energy-cost-formulas.html', 'Energy and Cost Formulas'], ['../calculators/motor-engineering/', 'Motor engineering calculators']]
    });
    A[A.length - 1].check = { i1, i2, loss1, dP, dE, cost };
  }

  /* ---------- 35. demand and load factor ---------- */
  {
    const Pc = 500, df = 0.7, Pmd = Pc * df, E = 168000, h = 720, Pav = E / h, lf = Pav / Pmd, sumMax = 420, divF = sumMax / Pmd;
    const rows = [0.5, 0.6, 0.7, 0.8].map((d) => [d, g4(Pc * d) + ' kW']);
    A.push({
      slug: 'demand-load-factor-formulas', h1: 'Demand, Load and Diversity Factor Formulas',
      desc: 'Maximum demand, demand factor, load factor and diversity factor formulas with a worked example and a table of maximum demand by demand factor.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Maximum demand', 'Pmd = connected load × demand factor'], ['Demand factor', 'Pmd / connected load'], ['Average demand', 'Pavg = energy (kWh) / hours'], ['Load factor', 'Pavg / Pmd'], ['Diversity factor', 'Sum of the individual maximum demands / maximum demand of the group']]) +
        '<p class="note">The connected load is the sum of the ratings of everything installed. The demand factor is at most 1, the load factor is at most 1 and the diversity factor is at least 1. Demand factors in practice come from your code or from measured data, so the values below are examples.</p>' +
        '<h2>Worked example: a 500 kW connected load</h2><p>The demand factor is 0.7. Over 30 days (720 h) the site used 168,000 kWh. The individual maximum demands of its feeders add up to 420 kW.</p>' +
        steps(['Pmd = 500 × 0.7 = ' + g4(Pmd) + ' kW', 'Pavg = 168,000 / 720 = ' + g4(Pav) + ' kW', 'Load factor = ' + g4(Pav) + ' / ' + g4(Pmd) + ' = ' + g4(lf), 'Diversity factor = 420 / ' + g4(Pmd) + ' = ' + g4(divF)]) +
        '<h2>Maximum demand for a 500 kW connected load</h2>' + table(['Demand factor', 'Maximum demand'], rows),
      faq: [
        ['Why is the maximum demand lower than the connected load?', 'Not every load runs at once or at full power. The demand factor allows for that, and it sizes the supply and the transformer.'],
        ['What does a low load factor mean?', 'The average use is small against the peak, so the supply is sized for a peak that is rare. A tariff with a demand charge penalises that.'],
        ['What is the difference between demand factor and diversity factor?', 'Demand factor compares the peak with the connected load. Diversity factor compares the sum of separate peaks with the peak of the group, because the peaks do not occur together.'],
        ['Where do I get the demand factors?', 'Use the table in your wiring code or the guidance of the utility, or use measured data from similar sites.']],
      related: [['energy-cost-formulas.html', 'Energy and Cost Formulas'], ['generator-formulas.html', 'Generator Formulas'], ['transformer-formulas.html', 'Transformer Formulas'], ['../calculators/power-and-energy/', 'Power and energy calculators']]
    });
    A[A.length - 1].check = { Pmd, Pav, lf, divF };
  }

  /* ---------- 36. cable tray fill ---------- */
  {
    const W = 300, Dp = 50, n = 12, d = 20, lim = 0.4, a = Math.PI / 4 * d * d, tot = n * a, At = W * Dp, fill = tot / At * 100, nmax = Math.floor(lim * At / a);
    const rows = [100, 200, 300, 450, 600].map((w) => [w + ' mm', g4(w * Dp) + ' mm²', g4(lim * w * Dp) + ' mm²', String(Math.floor(lim * w * Dp / a))]);
    A.push({
      slug: 'cable-tray-fill-formulas', h1: 'Cable Tray Fill Formulas: Area and Cable Count',
      desc: 'Cable tray fill formulas: cable area from diameter, tray cross-section area, percent fill and the number of cables for a fill limit, with a worked example.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Area of one round cable', 'a = π × d² / 4'], ['Tray area used for fill', 'At = width × loading depth'], ['Percent fill', 'Fill % = n × a / At × 100'], ['Most cables of one size', 'n = floor(limit × At / a)']]) +
        '<p class="note">d is the overall cable diameter in millimetres, the tray width and the loading depth are in millimetres, and the limit is a fraction. Tray fill rules differ widely. Some codes limit the cable area to a share of the tray cross-section, others limit cables to one layer, set a spacing for power cables or restrict the fill by cable size. Use the limit from your own code, and check the heating of grouped cables separately.</p>' +
        '<h2>Worked example: twelve cables on a 300 mm tray</h2><p>The cables have an overall diameter of 20 mm. The tray is 300 mm wide with a loading depth of 50 mm, and the fill limit is taken as 40%.</p>' +
        steps(['a = π × 20² / 4 = ' + g4(a) + ' mm², so twelve cables take ' + g4(tot) + ' mm²', 'At = 300 × 50 = ' + g4(At) + ' mm²', 'Fill = ' + g4(tot) + ' / ' + g4(At) + ' × 100 = ' + g4(fill) + '%', 'At a 40% limit the tray takes floor(0.4 × ' + g4(At) + ' / ' + g4(a) + ') = ' + nmax + ' cables']) +
        '<h2>Cables of 20 mm on trays with a 50 mm loading depth</h2>' + table(['Tray width', 'Cross-section', 'Usable at 40%', 'Cables of 20 mm'], rows),
      faq: [
        ['Is the fill limit the same as for conduit?', 'No. Trays are open, so the heat and pulling concerns differ. The code or the manufacturer sets the limits for trays.'],
        ['Does percent fill replace the heating check?', 'No. Grouped cables need derating, and a tray that meets the fill limit can still overheat the cables in a bunch.'],
        ['Which depth do I use?', 'Use the loading depth, which is the usable depth under the side rail and may be less than the overall depth of the tray.'],
        ['Do large power cables follow the same rule?', 'Many codes treat large cables differently, for example by requiring a single layer. Check your code for the rule that applies.']],
      related: [['conduit-fill-formulas.html', 'Conduit Fill Formulas'], ['cable-sizing-formulas.html', 'Cable Size Formulas'], ['voltage-drop-formulas.html', 'Voltage Drop Formulas'], ['../calculators/cable-derating/', 'Cable Derating Calculator']]
    });
    A[A.length - 1].check = { a, tot, At, fill, nmax };
  }

  /* ---------- 37. conductor resistance ---------- */
  {
    const rc = 1.72e-8, ra = 2.82e-8, ac = 0.00393, L = 100, S = 2.5, R20 = rc * L / (S * 1e-6), R70 = R20 * (1 + ac * 50), RAl = ra * L / (S * 1e-6), ratio = ra / rc;
    const rows = [1.5, 2.5, 4, 10, 25].map((s) => [s + ' mm²', g4(rc * 1000 / (s * 1e-6)) + ' Ω', g4(rc * 1000 / (s * 1e-6) * (1 + ac * 50)) + ' Ω']);
    A.push({
      slug: 'conductor-resistance-formulas', h1: 'Conductor Resistance Formulas and Temperature',
      desc: 'Conductor resistance formulas: resistance from length, area and resistivity, correction for temperature, copper and aluminium compared, with a worked example.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Resistance', 'R = ρ × L / A'], ['At another temperature', 'RT = R20 × (1 + α × (T − 20))'], ['Area for a target resistance', 'A = ρ × L / R'], ['Aluminium against copper', 'Area ratio = ρAl / ρCu for equal resistance']]) +
        '<p class="note">ρ is the resistivity in Ω·m, L the length in metres and A the cross-sectional area in m² (1 mm² is 10⁻⁶ m²). The figures used here are 1.72 × 10⁻⁸ Ω·m for copper and 2.82 × 10⁻⁸ Ω·m for aluminium at 20 °C, with α = 0.00393 per °C for copper. These are textbook values. Cable data sheets give the resistance of the actual conductor, which is a little higher because of stranding, so use the data sheet where you have it.</p>' +
        '<h2>Worked example: 100 m of 2.5 mm² copper</h2>' +
        steps(['R20 = 1.72 × 10⁻⁸ × 100 / (2.5 × 10⁻⁶) = ' + g4(R20) + ' Ω', 'At 70 °C, R = ' + g4(R20) + ' × (1 + 0.00393 × 50) = ' + g4(R70) + ' Ω', 'The same length of aluminium of the same area is 2.82 × 10⁻⁸ × 100 / (2.5 × 10⁻⁶) = ' + g4(RAl) + ' Ω, and for equal resistance it needs ' + g4(ratio) + ' times the area']) +
        '<h2>Copper resistance per kilometre</h2>' + table(['Area', 'At 20 °C', 'At 70 °C'], rows),
      faq: [
        ['Why does resistance rise with temperature?', 'In a metal, hotter atoms scatter the electrons more. Copper rises about 0.39% per degree, which is about 20% from 20 °C to 70 °C.'],
        ['Is this the resistance used for voltage drop?', 'It is the DC resistance. For AC cables of large size the skin effect and the reactance also matter, and the voltage drop article covers the AC case.'],
        ['Why is the data sheet value higher than this one?', 'Stranding makes the true length of each wire longer than the cable, so the resistance of a stranded conductor is a little higher than the solid value.'],
        ['Which temperature should I use?', 'Use the temperature the conductor reaches under load, for example the maximum for the insulation, when you check the voltage drop or losses in a heavily loaded cable.']],
      related: [['voltage-drop-formulas.html', 'Voltage Drop Formulas'], ['cable-sizing-formulas.html', 'Cable Size Formulas'], ['ohms-law-formulas.html', 'Ohm’s Law Formulas'], ['../calculators/cable-engineering/', 'Cable engineering calculators']]
    });
    A[A.length - 1].check = { R20, R70, RAl, ratio };
  }

  /* ---------- 38. short transmission line ---------- */
  {
    const V = 11000, I = 100, pf = 0.9, R = 0.5, X = 0.8, sin = Math.sqrt(1 - pf * pf);
    const dVp = I * (R * pf + X * sin), dVl = R3 * dVp, pct = dVl / V * 100, P = R3 * V * I * pf / 1000, loss = 3 * I * I * R / 1000, effL = P / (P + loss) * 100;
    const rows = [50, 100, 150].map((i) => [i + ' A', g4(R3 * i * (R * pf + X * sin)) + ' V', g4(R3 * i * (R * pf + X * sin) / V * 100) + '%', g4(3 * i * i * R / 1000) + ' kW']);
    A.push({
      slug: 'transmission-line-formulas', h1: 'Transmission Line Formulas: Drop and Losses',
      desc: 'Short transmission line formulas: voltage drop and regulation from line resistance and reactance, three-phase line loss and efficiency, with a worked example.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Phase voltage drop', 'ΔVphase ≈ I × (R × cos φ + X × sin φ)'], ['Line-to-line drop', 'ΔVLL = √3 × ΔVphase'], ['Regulation', 'ΔVLL / VLL × 100'], ['Three-phase line loss', 'Ploss = 3 × I² × R / 1000 (kW)'], ['Efficiency', 'η = Pdelivered / (Pdelivered + Ploss) × 100']]) +
        '<p class="note">R and X are the resistance and reactance of one conductor over the whole length, in ohms, I the line current and φ the load angle for a lagging load. This is the short-line model, which ignores the line capacitance, and it suits lines up to a few tens of kilometres at distribution voltages. Longer lines need the medium or long-line model.</p>' +
        '<h2>Worked example: 11 kV line, 100 A at power factor 0.9 lagging</h2><p>Each conductor has R = 0.5 Ω and X = 0.8 Ω over the length of the line.</p>' +
        steps(['sin φ = √(1 − 0.9²) = ' + g4(sin), 'ΔVphase = 100 × (0.5 × 0.9 + 0.8 × ' + g4(sin) + ') = ' + g4(dVp) + ' V, so ΔVLL = √3 × ' + g4(dVp) + ' = ' + g4(dVl) + ' V, which is ' + g4(pct) + '% of 11 kV', 'Delivered power = √3 × 11,000 × 100 × 0.9 / 1000 = ' + g4(P) + ' kW', 'Ploss = 3 × 100² × 0.5 / 1000 = ' + g4(loss) + ' kW, so the efficiency is ' + g4(effL) + '%']) +
        '<h2>Drop and loss by current</h2>' + table(['Current', 'Line-to-line drop', 'Regulation', 'Line loss'], rows),
      faq: [
        ['Why does reactance matter as well as resistance?', 'The reactive part of the drop depends on the load angle. At a low power factor the X term is large, and a line with high reactance drops more voltage.'],
        ['Is the loss only in the resistance?', 'Yes. Reactance stores and returns energy and does not dissipate power, so only R appears in the loss.'],
        ['How can I reduce the drop?', 'Use a larger conductor, raise the voltage, shorten the line or improve the power factor with capacitors.'],
        ['Is the approximate formula exact?', 'It is an approximation, accurate when the drop is small against the voltage. The exact method uses the phasor relation between sending and receiving voltages.']],
      related: [['voltage-drop-formulas.html', 'Voltage Drop Formulas'], ['power-factor-formulas.html', 'Power Factor Formulas'], ['three-phase-power-formulas.html', 'Three-Phase Power Formulas'], ['../calculators/power-systems/', 'Power systems calculators']]
    });
    A[A.length - 1].check = { dVp, dVl, pct, P, loss, effL };
  }

  /* ---------- 39. star-delta ---------- */
  {
    const d = [30, 60, 90], S = d[0] + d[1] + d[2];
    const r1 = d[0] * d[2] / S, r2 = d[0] * d[1] / S, r3 = d[1] * d[2] / S, Z = r1 * r2 + r2 * r3 + r3 * r1;
    const b12 = Z / r3, b23 = Z / r1, b31 = Z / r2;
    const rows = [30, 60, 90, 120].map((x) => [x + ' Ω', g4(x / 3) + ' Ω']);
    A.push({
      slug: 'star-delta-formulas', h1: 'Star-Delta Conversion Formulas for Resistors',
      desc: 'Star-delta (wye-delta) conversion formulas for resistors or impedances in both directions, equal-resistor shortcut, with a worked example and a table.',
      inner: '<h2>The formulas</h2><p>Label the delta resistors R12, R23 and R31, and the star resistors R1, R2 and R3, where R1 is the one at node 1, between R12 and R31.</p>' + table(['Conversion', 'Formula'], [
        ['Delta to star', 'R1 = R12 × R31 / (R12 + R23 + R31)'], ['', 'R2 = R12 × R23 / (R12 + R23 + R31)'], ['', 'R3 = R23 × R31 / (R12 + R23 + R31)'],
        ['Star to delta', 'R12 = (R1×R2 + R2×R3 + R3×R1) / R3'], ['', 'R23 = (R1×R2 + R2×R3 + R3×R1) / R1'], ['', 'R31 = (R1×R2 + R2×R3 + R3×R1) / R2'], ['Equal resistors', 'RY = RΔ / 3, and RΔ = 3 × RY']]) +
        '<p class="note">The same relations hold for complex impedances. The two networks are equivalent only as seen from the three terminals. The conversion is useful for bridges and for three-phase loads that are neither simple series nor parallel.</p>' +
        '<h2>Worked example: delta 30, 60 and 90 Ω</h2><p>R12 = 30 Ω, R23 = 60 Ω and R31 = 90 Ω, so the sum is ' + S + ' Ω.</p>' +
        steps(['R1 = 30 × 90 / ' + S + ' = ' + g4(r1) + ' Ω', 'R2 = 30 × 60 / ' + S + ' = ' + g4(r2) + ' Ω', 'R3 = 60 × 90 / ' + S + ' = ' + g4(r3) + ' Ω', 'Back again: the sum of products is ' + g4(Z) + ', so R12 = ' + g4(Z) + ' / ' + g4(r3) + ' = ' + g4(b12) + ' Ω, R23 = ' + g4(b23) + ' Ω and R31 = ' + g4(b31) + ' Ω']) +
        '<h2>Equal resistors: delta to star</h2>' + table(['Delta resistor', 'Star resistor'], rows),
      faq: [
        ['Why is the star resistor one third of the delta resistor?', 'With equal values the sum in the denominator is 3R and the numerator is R², so each star resistor is R² / 3R = R / 3.'],
        ['Does the neutral point of the star carry current?', 'The converted star has no neutral wire. It is an equivalent for the three terminals, not a physical neutral.'],
        ['Can I use the same formulas for impedances?', 'Yes, with complex numbers for the impedances in place of the resistances.'],
        ['When is this conversion needed?', 'When a network is not reducible by series and parallel rules, for example a bridge with a diagonal, and for balanced and unbalanced three-phase loads.']],
      related: [['resistor-formulas.html', 'Resistor Formulas'], ['ohms-law-formulas.html', 'Ohm’s Law Formulas'], ['three-phase-power-formulas.html', 'Three-Phase Power Formulas'], ['../calculators/electrical-fundamentals/', 'Electrical fundamentals calculators']]
    });
    A[A.length - 1].check = { r1, r2, r3, b12, b23, b31 };
  }

  /* ---------- 40. 4-20 mA ---------- */
  {
    const lo = 0, hi = 10, pv = 6.5, I = 4 + 16 * (pv - lo) / (hi - lo), mA = 12, pv2 = lo + (mA - 4) / 16 * (hi - lo), V250 = I * 0.25;
    const Vs = 24, Vt = 12, Rmax = (Vs - Vt - 0.02 * 250) / 0.02;
    const rows = [0, 25, 50, 75, 100].map((p) => [p + '%', g4(4 + 16 * p / 100) + ' mA', g4((4 + 16 * p / 100) * 0.25) + ' V']);
    A.push({
      slug: 'loop-4-20ma-formulas', h1: '4-20 mA Loop Formulas: Scaling and Resistor',
      desc: '4-20 mA current loop formulas: current from process value, process value from current, voltage across a sense resistor and the maximum loop resistance.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Current from process value', 'I (mA) = 4 + 16 × (PV − LRV) / (URV − LRV)'], ['Process value from current', 'PV = LRV + (I − 4) / 16 × (URV − LRV)'], ['Voltage across a sense resistor', 'V = I × R'], ['Maximum loop resistance', 'Rmax = (Vsupply − Vtransmitter min) / 0.02 A']]) +
        '<p class="note">LRV is the lower range value (4 mA) and URV the upper range value (20 mA) of the transmitter. The range is set when the transmitter is configured. A 250 Ω sense resistor turns 4 to 20 mA into 1 to 5 V. The minimum transmitter voltage is on the data sheet. Rmax includes the sense resistor and the wire.</p>' +
        '<h2>Worked example: a 0 to 10 bar transmitter</h2>' +
        steps(['At 6.5 bar: I = 4 + 16 × (6.5 − 0) / (10 − 0) = ' + g4(I) + ' mA', 'At 12 mA: PV = 0 + (12 − 4) / 16 × 10 = ' + g4(pv2) + ' bar', 'Across 250 Ω the 6.5 bar signal is ' + g4(I) + ' mA × 250 Ω = ' + g4(V250) + ' V']) +
        '<h2>Worked example: loop resistance limit</h2><p>A 24 V supply and a transmitter that needs at least 12 V, with a 250 Ω sense resistor.</p>' +
        steps(['Rmax = (24 − 12) / 0.02 = ' + g4((Vs - Vt) / 0.02) + ' Ω in total, so the wire can have up to ' + g4(Rmax) + ' Ω after the 250 Ω resistor']) +
        '<h2>Signal by percent of range</h2>' + table(['Process value', 'Current', 'Across 250 Ω'], rows),
      faq: [
        ['Why does the signal start at 4 mA and not at 0?', 'A live zero lets you tell a signal at the bottom of the range from a broken wire, which reads 0 mA.'],
        ['What does a reading below 4 mA mean?', 'It usually means a fault such as an open loop or a failed transmitter. Many devices also use 3.6 mA or 21 mA as fault signals.'],
        ['Is the loop current affected by the wire length?', 'No, within the voltage limit. A current loop keeps the same current through the whole loop, which is why it works over long cables.'],
        ['Can I use the formula for a reverse-acting signal?', 'Yes. Swap the LRV and URV in the formula, and the current falls as the process value rises.']],
      related: [['ohms-law-formulas.html', 'Ohm’s Law Formulas'], ['resistor-formulas.html', 'Resistor Formulas'], ['led-formulas.html', 'LED Formulas'], ['../calculators/electronics-and-instrumentation/', 'Electronics and instrumentation calculators']]
    });
    A[A.length - 1].check = { I, pv2, V250, Rmax };
  }

  /* ---------- 41. cable loss ---------- */
  {
    const Ib = 100, rk = 0.688, Lm = 200, Rc = rk * Lm / 1000, Pl = 3 * Ib * Ib * Rc, hrs = 4000, E = Pl * hrs / 1000, tar = 8, cost = E * tar;
    const rows = [50, 75, 100, 125].map((i) => [i + ' A', g4(3 * i * i * Rc) + ' W', g4(3 * i * i * Rc / 100) + ' W per 100']);
    A.push({
      slug: 'cable-loss-formulas', h1: 'Cable Loss Formulas: Power and Annual Cost',
      desc: 'Cable power loss formulas: I squared R loss for single-phase and three-phase cables, annual energy and cost of the loss, with a worked example and table.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Cable resistance', 'R = r × L / 1000, with r in Ω/km and L in metres'], ['Three-phase loss', 'Ploss = 3 × I² × R'], ['Single-phase loss', 'Ploss = 2 × I² × R'], ['Annual energy', 'E (kWh) = Ploss × hours / 1000'], ['Annual cost', 'Cost = E × tariff']]) +
        '<p class="note">I is the load current and R the resistance of one conductor. The loss rises with the square of the current, so doubling the current quadruples the loss. If the load changes with time, use the average of I² over the hours, not the average current. The resistance rises with temperature, and the data sheet gives the figure at the operating temperature.</p>' +
        '<h2>Worked example: 200 m, 100 A, three-phase</h2><p>The conductor is 25 mm² copper at 0.688 Ω/km, and it carries 100 A for 4,000 hours a year at a tariff of 8 per kWh.</p>' +
        steps(['R = 0.688 × 200 / 1000 = ' + g4(Rc) + ' Ω', 'Ploss = 3 × 100² × ' + g4(Rc) + ' = ' + g4(Pl) + ' W', 'E = ' + g4(Pl) + ' × 4,000 / 1000 = ' + g4(E) + ' kWh a year, which costs ' + g4(cost) + ' at 8 per kWh']) +
        '<h2>Loss by current for the same cable</h2>' + table(['Current', 'Three-phase loss', 'Per 100 W of ...'].slice(0, 2), rows.map((r) => r.slice(0, 2))),
      faq: [
        ['Why does a larger cable save money?', 'The resistance falls in proportion to the area, so the loss falls too. The saving over the cable’s life can exceed the extra cost of copper, especially at a high load factor.'],
        ['Is the loss a heat load?', 'Yes. All of it becomes heat in the cable, which adds to the temperature rise and to the cooling load of the room or duct.'],
        ['Does power factor change the loss?', 'The loss depends on the current, and a lower power factor means a higher current for the same kW, so the loss rises.'],
        ['Which resistance should I use?', 'Use the data sheet value at the operating temperature. The conductor resistance article gives the textbook figures.']],
      related: [['conductor-resistance-formulas.html', 'Conductor Resistance Formulas'], ['voltage-drop-formulas.html', 'Voltage Drop Formulas'], ['energy-cost-formulas.html', 'Energy and Cost Formulas'], ['../calculators/cable-engineering/', 'Cable engineering calculators']]
    });
    A[A.length - 1].check = { Rc, Pl, E, cost };
  }

  /* ---------- 42. op-amp ---------- */
  {
    const Rf = 100e3, Ri = 10e3, Vin = 0.5, Ai = -Rf / Ri, Vo1 = Ai * Vin, Rf2 = 47e3, Rg = 10e3, An = 1 + Rf2 / Rg, Vo2 = An * Vin;
    const rows = [1, 2, 5, 10, 20].map((k) => ['Rf / R = ' + k, '−' + g4(k), g4(1 + k)]);
    A.push({
      slug: 'op-amp-formulas', h1: 'Op-Amp Formulas: Inverting and Non-Inverting',
      desc: 'Op-amp gain formulas for the inverting and non-inverting amplifier, voltage follower and the summing amplifier, with worked examples and a table of gains.',
      inner: '<h2>The formulas</h2>' + table(['Circuit', 'Gain', 'Output'], [
        ['Inverting amplifier', 'A = −Rf / Rin', 'Vout = −(Rf / Rin) × Vin'], ['Non-inverting amplifier', 'A = 1 + Rf / Rg', 'Vout = (1 + Rf / Rg) × Vin'], ['Voltage follower', 'A = 1', 'Vout = Vin'], ['Summing amplifier (inverting)', '—', 'Vout = −Rf × (V1 / R1 + V2 / R2 + …)']]) +
        '<p class="note">These are the ideal op-amp formulas, with a high open-loop gain, no input current and negative feedback. The output cannot go beyond the supply rails, and the gain falls at high frequencies because of the gain-bandwidth product of the real device. Rf is the feedback resistor, Rin the input resistor of the inverting circuit and Rg the resistor from the inverting input to ground.</p>' +
        '<h2>Worked example: inverting amplifier</h2><p>Rf = 100 kΩ, Rin = 10 kΩ and Vin = 0.5 V.</p>' +
        steps(['A = −100 / 10 = −' + g4(-Ai), 'Vout = −' + g4(-Ai) + ' × 0.5 = −' + g4(-Vo1) + ' V']) +
        '<h2>Worked example: non-inverting amplifier</h2><p>Rf = 47 kΩ, Rg = 10 kΩ and Vin = 0.5 V.</p>' +
        steps(['A = 1 + 47 / 10 = ' + g4(An), 'Vout = ' + g4(An) + ' × 0.5 = ' + g4(Vo2) + ' V']) +
        '<h2>Gain for a given resistor ratio</h2>' + table(['Resistor ratio', 'Inverting gain', 'Non-inverting gain'], rows),
      faq: [
        ['Why is the inverting gain negative?', 'The output is 180° out of phase with the input. A positive input gives a negative output.'],
        ['Can a non-inverting amplifier have a gain below 1?', 'No. The gain is 1 + Rf / Rg, so it cannot fall below 1. For a smaller gain use an inverting stage or a divider before a follower.'],
        ['What is a virtual earth?', 'With negative feedback the inverting input sits at nearly the same voltage as the non-inverting input. In the inverting circuit that is ground, so the input current is set by Vin / Rin.'],
        ['What limits the output?', 'The supply voltage, which caps the swing, and the slew rate and gain-bandwidth product, which limit speed.']],
      related: [['resistor-formulas.html', 'Resistor Formulas'], ['ohms-law-formulas.html', 'Ohm’s Law Formulas'], ['capacitor-formulas.html', 'Capacitor Formulas'], ['../calculators/electronics-and-instrumentation/', 'Electronics and instrumentation calculators']]
    });
    A[A.length - 1].check = { Ai, Vo1, An, Vo2 };
  }

  /* ---------- 43. 555 timer ---------- */
  {
    const R1 = 1e3, R2 = 10e3, C = 10e-6, T = Math.LN2 * (R1 + 2 * R2) * C, f = 1 / T, th = Math.LN2 * (R1 + R2) * C, tl = Math.LN2 * R2 * C, duty = (R1 + R2) / (R1 + 2 * R2) * 100;
    const rows = [1, 10, 100].map((c) => [c + ' µF', g4(1 / (Math.LN2 * (R1 + 2 * R2) * c * 1e-6)) + ' Hz', g4(Math.LN2 * (R1 + R2) * c * 1e-6 * 1000) + ' ms']);
    const mono = 1.1 * 10e3 * 100e-6;
    A.push({
      slug: '555-timer-formulas', h1: '555 Timer Formulas: Frequency and Duty Cycle',
      desc: '555 timer formulas for astable and monostable mode: frequency, high and low time, duty cycle and pulse length, with worked examples and a table.',
      inner: '<h2>The formulas</h2>' + table(['Mode', 'To find', 'Formula'], [
        ['Astable', 'High time', 'tH = 0.693 × (R1 + R2) × C'], ['Astable', 'Low time', 'tL = 0.693 × R2 × C'], ['Astable', 'Frequency', 'f = 1 / (tH + tL) = 1.44 / ((R1 + 2 × R2) × C)'], ['Astable', 'Duty cycle', 'D = (R1 + R2) / (R1 + 2 × R2) × 100'], ['Monostable', 'Pulse length', 't = 1.1 × R × C']]) +
        '<p class="note">R is in ohms, C in farads and the times in seconds. The factor 0.693 is ln 2 and 1.1 is the rounded value of ln 3. The standard astable circuit always has a duty cycle above 50%, since tH is longer than tL. Real components and the supply voltage cause errors, so check the result on a bench.</p>' +
        '<h2>Worked example: astable, R1 = 1 kΩ, R2 = 10 kΩ, C = 10 µF</h2>' +
        steps(['tH = 0.693 × 11,000 × 0.00001 = ' + g4(th * 1000) + ' ms and tL = 0.693 × 10,000 × 0.00001 = ' + g4(tl * 1000) + ' ms', 'f = 1 / (' + g4(th * 1000) + ' ms + ' + g4(tl * 1000) + ' ms) = ' + g4(f) + ' Hz', 'D = 11 / 21 × 100 = ' + g4(duty) + '%']) +
        '<h2>Worked example: monostable, R = 10 kΩ, C = 100 µF</h2>' +
        steps(['t = 1.1 × 10,000 × 0.0001 = ' + g4(mono) + ' s']) +
        '<h2>Astable output with R1 = 1 kΩ and R2 = 10 kΩ</h2>' + table(['Capacitor', 'Frequency', 'High time'], rows),
      faq: [
        ['Why can the duty cycle not be below 50%?', 'The capacitor charges through R1 and R2 and discharges only through R2, so the high time is always longer than the low time. A diode across R2 or a different circuit gives a lower duty cycle.'],
        ['Does the supply voltage change the frequency?', 'Hardly. The thresholds are set as fractions of the supply, so the timing is almost independent of it, which is one reason for the 555’s popularity.'],
        ['Which capacitor should I use?', 'Use a stable type, such as film or ceramic C0G, for accurate timing. Electrolytic capacitors have a large tolerance and leakage.'],
        ['What if I need a long delay?', 'Use a larger R or C, but a very large R makes the timing depend on the leakage of the capacitor and the input current of the chip.']],
      related: [['capacitor-formulas.html', 'Capacitor Formulas'], ['resistor-formulas.html', 'Resistor Formulas'], ['led-formulas.html', 'LED Formulas'], ['../calculators/electronics-and-instrumentation/', 'Electronics and instrumentation calculators']]
    });
    A[A.length - 1].check = { T, f, th, tl, duty, mono };
  }

  /* ---------- 44. Thevenin and Norton ---------- */
  {
    const Vs = 24, R1 = 100, R2 = 200, Vth = Vs * R2 / (R1 + R2), Rth = R1 * R2 / (R1 + R2), In = Vth / Rth, RL = 100, IL = Vth / (Rth + RL), VL = IL * RL, Pmax = Vth * Vth / (4 * Rth);
    const loads = [25, Rth, 100, 200];
    const rows = loads.map((r) => { const i = Vth / (Rth + r); return [g4(r) + ' Ω', g4(i * 1000) + ' mA', g4(i * i * r * 1000) + ' mW']; });
    A.push({
      slug: 'thevenin-norton-formulas', h1: 'Thévenin and Norton Formulas',
      desc: 'Thévenin and Norton equivalent circuit formulas: open-circuit voltage, equivalent resistance, load current and the load for maximum power transfer.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Thévenin voltage', 'Vth = open-circuit voltage at the terminals'], ['Thévenin resistance', 'Rth = resistance seen at the terminals with sources set to zero'], ['Norton current', 'IN = Vth / Rth (the short-circuit current)'], ['Norton resistance', 'RN = Rth'], ['Load current', 'IL = Vth / (Rth + RL)'], ['Maximum power to the load', 'RL = Rth, and Pmax = Vth² / (4 × Rth)']]) +
        '<p class="note">To set sources to zero, replace a voltage source with a short circuit and a current source with an open circuit. The Thévenin and Norton circuits give the same voltage and current at the terminals, but not the same power inside the circuit. At maximum power transfer only half of the source power reaches the load, so the efficiency is 50%.</p>' +
        '<h2>Worked example: a divider with a load</h2><p>A 24 V source feeds R1 = 100 Ω in series, with R2 = 200 Ω from the output to ground. The load connects across R2.</p>' +
        steps(['Vth = 24 × 200 / (100 + 200) = ' + g4(Vth) + ' V', 'Rth = 100 × 200 / (100 + 200) = ' + g4(Rth) + ' Ω, so IN = ' + g4(Vth) + ' / ' + g4(Rth) + ' = ' + g4(In) + ' A', 'With RL = 100 Ω, IL = ' + g4(Vth) + ' / (' + g4(Rth) + ' + 100) = ' + g4(IL) + ' A and VL = ' + g4(VL) + ' V', 'Maximum power is at RL = ' + g4(Rth) + ' Ω: Pmax = ' + g4(Vth) + '² / (4 × ' + g4(Rth) + ') = ' + g4(Pmax) + ' W']) +
        '<h2>Load power for different load resistances</h2>' + table(['Load', 'Current', 'Load power'], rows),
      faq: [
        ['When is a Thévenin equivalent useful?', 'When one part of a circuit changes, for example the load, and you want to find its current or voltage without solving the whole network again.'],
        ['What is the difference between the Thévenin and Norton forms?', 'They are the same circuit in two forms: a voltage source in series with Rth, or a current source IN in parallel with the same resistance.'],
        ['Does maximum power transfer mean maximum efficiency?', 'No. At RL = Rth the efficiency is only 50%. Power systems are designed for a high efficiency with a load much larger than the source resistance.'],
        ['Can I use this for AC circuits?', 'Yes, with complex impedances. The load impedance for maximum power is then the complex conjugate of the Thévenin impedance.']],
      related: [['resistor-formulas.html', 'Resistor Formulas'], ['ohms-law-formulas.html', 'Ohm’s Law Formulas'], ['star-delta-formulas.html', 'Star-Delta Formulas'], ['../calculators/electrical-fundamentals/', 'Electrical fundamentals calculators']]
    });
    A[A.length - 1].check = { Vth, Rth, In, IL, VL, Pmax };
  }

  /* ---------- 45. Wheatstone bridge ---------- */
  {
    const R1 = 1000, R2 = 2000, R3 = 330, Rx = R2 * R3 / R1, Vs = 10, Rx2 = 700, vl = Vs * R2 / (R1 + R2), vr = Vs * Rx2 / (R3 + Rx2), dV = vr - vl;
    const Rg = 350, gf = 2, eps = 0.001, dR = Rg * gf * eps, Vsg = 5, Vq = Vsg * (Rg + dR) / (2 * Rg + dR) - Vsg / 2, Va = Vsg / 4 * dR / Rg;
    const rows = [200, 500, 1000, 2000].map((r) => [r + ' Ω', g4(r * R3 / R1) + ' Ω']);
    A.push({
      slug: 'wheatstone-bridge-formulas', h1: 'Wheatstone Bridge Formulas: Balance and Output',
      desc: 'Wheatstone bridge formulas: the balance condition, unknown resistance, output voltage of an unbalanced bridge and a quarter-bridge strain gauge signal.',
      inner: '<h2>The formulas</h2><p>The left arm is R1 on top and R2 below it. The right arm is R3 on top and Rx below it, and the output is the difference between the two midpoints.</p>' + table(['To find', 'Formula'], [
        ['Balance condition', 'R1 / R2 = R3 / Rx'], ['Unknown resistance at balance', 'Rx = R2 × R3 / R1'], ['Output voltage', 'Vout = Vs × (Rx / (R3 + Rx) − R2 / (R1 + R2))'], ['Quarter bridge, small change ΔR', 'Vout ≈ Vs / 4 × ΔR / R'], ['Strain gauge resistance change', 'ΔR = R × GF × strain']]) +
        '<p class="note">Vs is the excitation voltage. At balance the output is zero whatever the supply voltage, which is why the bridge measures resistance accurately with a null meter. The quarter-bridge formula applies when one arm changes by a small amount and the other three equal R. GF is the gauge factor, about 2 for a metal-foil gauge.</p>' +
        '<h2>Worked example: balance</h2><p>R1 = 1 kΩ, R2 = 2 kΩ and R3 = 330 Ω.</p>' +
        steps(['Rx = 2000 × 330 / 1000 = ' + g4(Rx) + ' Ω gives zero output']) +
        '<h2>Worked example: an unbalanced bridge</h2><p>The same bridge on 10 V with Rx = 700 Ω.</p>' +
        steps(['Left midpoint: 10 × 2000 / 3000 = ' + g4(vl) + ' V', 'Right midpoint: 10 × 700 / (330 + 700) = ' + g4(vr) + ' V', 'Vout = ' + g4(vr) + ' − ' + g4(vl) + ' = ' + g4(dV) + ' V']) +
        '<h2>Worked example: a strain gauge</h2><p>A 350 Ω gauge with GF = 2 at 1,000 microstrain on a 5 V bridge.</p>' +
        steps(['ΔR = 350 × 2 × 0.001 = ' + g4(dR) + ' Ω', 'Vout ≈ 5 / 4 × ' + g4(dR) + ' / 350 = ' + g4(Va * 1000) + ' mV (exactly ' + g4(Vq * 1000) + ' mV)']) +
        '<h2>Balancing resistance with R1 = 1 kΩ and R3 = 330 Ω</h2>' + table(['R2', 'Rx at balance'], rows),
      faq: [
        ['Why is the bridge used for strain gauges?', 'It turns a tiny resistance change into a voltage, and the three fixed arms cancel changes in the supply voltage and, with a dummy gauge, in temperature.'],
        ['Does the supply voltage affect the balance?', 'No. At balance the two dividers give the same ratio, so the output is zero for any supply voltage.'],
        ['How small a change can I detect?', 'It depends on the amplifier. The signal is a few millivolts for a gauge, so a bridge amplifier with low noise is used.'],
        ['What about the resistance of the lead wires?', 'It adds to the gauge arm. A three-wire connection cancels most of it for a remote sensor such as an RTD.']],
      related: [['resistor-formulas.html', 'Resistor Formulas'], ['thevenin-norton-formulas.html', 'Thévenin and Norton Formulas'], ['op-amp-formulas.html', 'Op-Amp Formulas'], ['../calculators/electronics-and-instrumentation/', 'Electronics and instrumentation calculators']]
    });
    A[A.length - 1].check = { Rx, dV, dR, Va, Vq };
  }

  /* ---------- 46. conductor force ---------- */
  {
    const mu0 = 4 * Math.PI * 1e-7, I = 20000, d = 0.1, f = mu0 * I * I / (2 * Math.PI * d);
    const L = 2, F = f * L;
    const rows = [10, 20, 40].map((k) => [k + ' kA'].concat([0.1, 0.2].map((dd) => g4(mu0 * k * 1000 * k * 1000 / (2 * Math.PI * dd)) + ' N/m')));
    A.push({
      slug: 'conductor-force-formulas', h1: 'Conductor Force Formulas: Short-Circuit Forces',
      desc: 'Force between parallel conductors from current and spacing: force per metre for a short circuit, total force on a span, with a worked example and a table.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Force per metre', 'F / L = μ0 × I1 × I2 / (2π × d) = 2 × 10⁻⁷ × I1 × I2 / d'], ['Total force on a span', 'F = (F / L) × L'], ['Direction', 'Attracts for currents in the same direction, repels for opposite directions']]) +
        '<p class="note">μ0 = 4π × 10⁻⁷ H/m, I in amperes, d the centre-to-centre spacing in metres and L the length of the span. In a short circuit use the peak current, not the RMS value. For three-phase busbars the standard (IEC 60865) gives factors for the phase arrangement and for the dynamic response of the supports, so this formula is a first estimate for two parallel conductors.</p>' +
        '<h2>Worked example: two bars, 20 kA, 0.1 m apart</h2>' +
        steps(['F / L = 2 × 10⁻⁷ × 20,000 × 20,000 / 0.1 = ' + g4(f) + ' N/m', 'On a 2 m span the force is ' + g4(f) + ' × 2 = ' + g4(F) + ' N, about ' + g4(F / 9.80665) + ' kgf']) +
        '<h2>Force per metre for two conductors</h2>' + table(['Current (each)', 'At 0.1 m', 'At 0.2 m'], rows),
      faq: [
        ['Why does the force matter in a short circuit?', 'The force grows with the square of the current. A short-circuit current many times larger than the load current gives forces thousands of times larger, which can bend busbars and break supports.'],
        ['Which current do I use?', 'The peak current of the first half cycle, which is the RMS fault current multiplied by a factor of about 2.5 for a high X/R ratio, as in the short-circuit article.'],
        ['How do I reduce the force?', 'Increase the spacing, use stronger supports with a shorter span, or limit the fault current.'],
        ['Does the force alternate?', 'Yes. The force pulsates at twice the supply frequency, and the support has to withstand both the peak and the vibration.']],
      related: [['short-circuit-formulas.html', 'Short-Circuit Formulas'], ['circuit-breaker-formulas.html', 'Circuit Breaker Formulas'], ['transformer-formulas.html', 'Transformer Formulas'], ['../calculators/electrical-protection/', 'Electrical protection calculators']]
    });
    A[A.length - 1].check = { f, F };
  }

  /* ---------- 47. CT burden ---------- */
  {
    const rho = 1.72e-8, Lm = 50, S = 2.5, Rl = rho * 2 * Lm / (S * 1e-6), Rr = 2 / 25, Rt = Rl + Rr, B5 = 25 * Rt, B1 = Rt;
    const ratio = 400 / 5, Is = 3.2, Ip = Is * ratio;
    const rows = [10, 25, 50, 100].map((l) => { const r = rho * 2 * l / (S * 1e-6); return [l + ' m', g4(r) + ' Ω', g4(25 * r) + ' VA', g4(r) + ' VA']; });
    A.push({
      slug: 'ct-burden-formulas', h1: 'CT Burden Formulas: Lead Resistance and VA',
      desc: 'Current transformer burden formulas: lead resistance, burden in VA for 5 A and 1 A secondaries, total burden against rated burden, and primary current.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Lead loop resistance', 'RL = ρ × 2 × L / A (out and back)'], ['Burden in VA', 'S = Is² × Rtotal'], ['Relay burden as resistance', 'Rrelay = S(relay) / Is²'], ['Total burden', 'Rtotal = RL + Rrelay + Rcontacts'], ['Primary current', 'Ip = Is × (primary rating / secondary rating)']]) +
        '<p class="note">Is is the rated secondary current (5 A or 1 A) and L the one-way length of the cable in metres. The total burden must not exceed the rated burden of the CT, or its accuracy falls and a protection CT may saturate. Use the burden of the relay or meter at the rated current from its data sheet. A 1 A secondary has a burden 25 times lower than a 5 A secondary for the same resistance.</p>' +
        '<h2>Worked example: 50 m of 2.5 mm² copper to a relay</h2><p>The relay burden is 2 VA at 5 A, and the CT is rated at 10 VA.</p>' +
        steps(['RL = 1.72 × 10⁻⁸ × 2 × 50 / (2.5 × 10⁻⁶) = ' + g4(Rl) + ' Ω', 'Rrelay = 2 / 5² = ' + g4(Rr) + ' Ω, so Rtotal = ' + g4(Rt) + ' Ω', 'With a 5 A secondary: S = 5² × ' + g4(Rt) + ' = ' + g4(B5) + ' VA, which is above the 10 VA rating', 'With a 1 A secondary: S = 1² × ' + g4(Rt) + ' = ' + g4(B1) + ' VA']) +
        '<h2>Worked example: primary current</h2>' +
        steps(['A 400/5 A CT reads 3.2 A, so Ip = 3.2 × 400 / 5 = ' + g4(Ip) + ' A']) +
        '<h2>Lead burden for 2.5 mm² copper</h2>' + table(['Cable length (one way)', 'Loop resistance', 'Burden at 5 A', 'Burden at 1 A'], rows),
      faq: [
        ['Why choose a 1 A secondary?', 'The lead burden is 25 times lower, which allows long cable runs to a remote relay with a small CT. The 5 A secondary is common for short runs in switchgear.'],
        ['What happens if the burden is too high?', 'The CT loses accuracy for a meter, and for protection it can saturate at a fault current and give a distorted signal to the relay.'],
        ['What if I open the secondary circuit?', 'Never open the secondary of a CT that carries primary current. The voltage can rise to dangerous values. Short the secondary first.'],
        ['Is the lead resistance the cable resistance or twice it?', 'Twice the one-way value for a two-wire connection, because the current goes out and returns. Some star-connected schemes differ, so check the connection.']],
      related: [['conductor-resistance-formulas.html', 'Conductor Resistance Formulas'], ['short-circuit-formulas.html', 'Short-Circuit Formulas'], ['circuit-breaker-formulas.html', 'Circuit Breaker Formulas'], ['../calculators/electrical-protection/', 'Electrical protection calculators']]
    });
    A[A.length - 1].check = { Rl, Rr, Rt, B5, B1, Ip };
  }

  /* ---------- 48. gear and belt drive ---------- */
  {
    const P = 11, N = 1480, eta = 0.96, i = 5, T1 = 9548.8 * P / N, N2 = N / i, T2 = T1 * i * eta, P2 = P * eta, D = 0.2, v = Math.PI * D * N / 60;
    const rows = [2, 3, 5, 10].map((k) => [k + ':1', g4(N / k) + ' rpm', g4(T1 * k * eta) + ' N·m']);
    A.push({
      slug: 'gear-drive-formulas', h1: 'Gear and Belt Drive Formulas: Speed and Torque',
      desc: 'Gear and belt drive formulas: speed ratio from teeth or pulley diameters, output speed, torque and power with efficiency, and belt speed, with a worked example.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Speed ratio', 'i = Nin / Nout = Zout / Zin = Dout / Din'], ['Output speed', 'Nout = Nin / i'], ['Motor torque', 'T (N·m) = 9548.8 × P (kW) / N (rpm)'], ['Output torque', 'Tout = Tin × i × η'], ['Output power', 'Pout = Pin × η'], ['Belt speed', 'v (m/s) = π × D × N / 60']]) +
        '<p class="note">Z is the number of teeth, D the pitch or pulley diameter in metres, N the speed in rpm and η the efficiency of the drive as a fraction. A speed reduction multiplies the torque by the ratio, less the losses. The power cannot increase through the drive. Typical efficiency figures come from the manufacturer, and a worm gear can be much lower than a helical gear.</p>' +
        '<h2>Worked example: 11 kW motor, 1,480 rpm, ratio 5:1, 96%</h2>' +
        steps(['Tin = 9548.8 × 11 / 1480 = ' + g4(T1) + ' N·m', 'Nout = 1480 / 5 = ' + g4(N2) + ' rpm', 'Tout = ' + g4(T1) + ' × 5 × 0.96 = ' + g4(T2) + ' N·m, and Pout = 11 × 0.96 = ' + g4(P2) + ' kW', 'Check: 9548.8 × ' + g4(P2) + ' / ' + g4(N2) + ' = ' + g4(9548.8 * P2 / N2) + ' N·m']) +
        '<h2>Worked example: belt speed</h2><p>A 0.2 m pulley on the 1,480 rpm shaft.</p>' +
        steps(['v = π × 0.2 × 1480 / 60 = ' + g4(v) + ' m/s']) +
        '<h2>Output for the same motor by ratio</h2>' + table(['Ratio', 'Output speed', 'Output torque (96%)'], rows),
      faq: [
        ['Why does the output torque rise as the speed falls?', 'Power is torque times speed, and the power is nearly constant. A drop in speed gives a corresponding rise in torque.'],
        ['What is the service factor for?', 'It allows for shock loads and long running hours. Choose a gearbox with a rated torque above the load torque multiplied by the service factor from the maker.'],
        ['Is the belt speed limited?', 'Yes. V-belts and flat belts have a maximum speed from the belt maker, often about 25 to 30 m/s, and exceeding it shortens the life.'],
        ['Does a gearbox change the direction of rotation?', 'Some do. A single spur pair reverses the direction, while a helical in-line unit with an even number of stages may keep it. Check the data sheet.']],
      related: [['motor-formulas.html', 'Induction Motor Formulas'], ['motor-efficiency-formulas.html', 'Motor Efficiency Formulas'], ['pump-formulas.html', 'Pump Formulas'], ['../calculators/motor-engineering/', 'Motor engineering calculators']]
    });
    A[A.length - 1].check = { T1, N2, T2, P2, v };
  }

  /* ---------- 49. skin effect ---------- */
  {
    const mu0 = 4 * Math.PI * 1e-7, dl = (rho, f) => Math.sqrt(2 * rho / (2 * Math.PI * f * mu0)), rc = 1.72e-8, ra = 2.82e-8;
    const dc50 = dl(rc, 50), da50 = dl(ra, 50), dc60 = dl(rc, 60);
    const rows = [50, 60, 400, 1000, 10000].map((f) => [f + ' Hz', g4(dl(rc, f) * 1000) + ' mm', g4(dl(ra, f) * 1000) + ' mm']);
    A.push({
      slug: 'skin-effect-formulas', h1: 'Skin Effect Formulas: Skin Depth',
      desc: 'Skin effect formulas: skin depth from resistivity and frequency for copper and aluminium, with a worked example at 50 Hz and a table by frequency.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Skin depth', 'δ = √(2 × ρ / (ω × μ)), with ω = 2π × f'], ['For a non-magnetic metal', 'δ = √(ρ / (π × f × μ0))'], ['Effect of frequency', 'δ falls as 1 / √f']]) +
        '<p class="note">δ is the depth in metres at which the current density has fallen to about 37% of its value at the surface. ρ is the resistivity in Ω·m, f the frequency in hertz and μ0 = 4π × 10⁻⁷ H/m. The relative permeability of copper and aluminium is 1. Steel has a high permeability and a much smaller skin depth. The resistivities are 1.72 × 10⁻⁸ Ω·m for copper and 2.82 × 10⁻⁸ Ω·m for aluminium at 20 °C.</p>' +
        '<h2>Worked example: copper at 50 Hz</h2>' +
        steps(['ω = 2π × 50 = ' + g4(2 * Math.PI * 50) + ' rad/s', 'δ = √(2 × 1.72 × 10⁻⁸ / (' + g4(2 * Math.PI * 50) + ' × 4π × 10⁻⁷)) = ' + g4(dc50 * 1000) + ' mm', 'For aluminium at 50 Hz, δ = ' + g4(da50 * 1000) + ' mm, and for copper at 60 Hz, δ = ' + g4(dc60 * 1000) + ' mm']) +
        '<h2>Skin depth by frequency</h2>' + table(['Frequency', 'Copper', 'Aluminium'], rows),
      faq: [
        ['What does the skin effect do to a conductor?', 'It pushes the AC current toward the surface. The inner part carries less current, so the AC resistance is higher than the DC resistance for a thick conductor.'],
        ['When does it matter at power frequency?', 'For conductors with a radius comparable to the skin depth, which means a cross-section of several hundred mm² for copper at 50 Hz. Large cables use stranded or segmented conductors to reduce the effect.'],
        ['Why is the skin depth smaller at high frequency?', 'The changing magnetic field drives eddy currents that oppose the current in the core of the conductor. The effect increases with frequency.'],
        ['Does the skin effect change the voltage drop?', 'Slightly, for large conductors. Cable data sheets give the AC resistance, which includes the skin and proximity effects, so use that value for voltage drop.']],
      related: [['conductor-resistance-formulas.html', 'Conductor Resistance Formulas'], ['voltage-drop-formulas.html', 'Voltage Drop Formulas'], ['ac-circuit-formulas.html', 'AC Circuit Formulas'], ['cable-sizing-formulas.html', 'Cable Size Formulas']]
    });
    A[A.length - 1].check = { dc50, da50, dc60 };
  }

  /* ---------- 50. RC filter ---------- */
  {
    const R = 10000, C = 100e-9, fc = 1 / (2 * Math.PI * R * C), tau = R * C, f = 1000, x = f / fc, gain = 1 / Math.sqrt(1 + x * x), gdb = 20 * Math.log10(gain), ph = Math.atan(x) / DEG;
    const C2 = 10e-9, fc2 = 1000, R2 = 1 / (2 * Math.PI * fc2 * C2);
    const rows = [1000, 4700, 10000, 47000].map((r) => [g4(r / 1000) + ' kΩ', g4(1 / (2 * Math.PI * r * C)) + ' Hz', g4(r * C * 1000) + ' ms']);
    A.push({
      slug: 'rc-filter-formulas', h1: 'RC Filter Formulas: Cutoff Frequency and Gain',
      desc: 'RC low-pass and high-pass filter formulas: cutoff frequency, time constant, gain in dB and phase at a frequency, and the resistor for a chosen cutoff.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Cutoff frequency', 'fc = 1 / (2π × R × C)'], ['Time constant', 'τ = R × C, so fc = 1 / (2π × τ)'], ['Low-pass gain', '|H| = 1 / √(1 + (f / fc)²)'], ['High-pass gain', '|H| = (f / fc) / √(1 + (f / fc)²)'], ['Gain in dB', '20 × log10(|H|)'], ['Phase (low-pass)', 'φ = −arctan(f / fc)'], ['Resistor for a chosen cutoff', 'R = 1 / (2π × fc × C)']]) +
        '<p class=\"note\">R is in ohms, C in farads and f in hertz. At f = fc the gain is 0.7071, which is −3.01 dB, and the phase of a first-order low-pass is −45°. Above the cutoff a first-order filter falls at 20 dB per decade. The formulas assume the source resistance is small and the load resistance is large compared with R.</p>' +
        '<h2>Worked example: 10 kΩ and 100 nF</h2>' +
        steps(['fc = 1 / (2π × 10,000 × 100 × 10⁻⁹) = ' + g4(fc) + ' Hz', 'τ = 10,000 × 100 × 10⁻⁹ = ' + g4(tau * 1000) + ' ms', 'At 1 kHz, f / fc = ' + g4(x) + ', so the low-pass gain is ' + g4(gain) + ' = ' + g4(gdb) + ' dB', 'The phase at 1 kHz is −arctan(' + g4(x) + ') = −' + g4(ph) + '°']) +
        '<h2>Worked example: choose the resistor</h2><p>A cutoff of 1 kHz with a 10 nF capacitor.</p>' +
        steps(['R = 1 / (2π × 1,000 × 10 × 10⁻⁹) = ' + g4(R2 / 1000) + ' kΩ, so use the nearest standard value and check the cutoff']) +
        '<h2>Cutoff frequency with C = 100 nF</h2>' + table(['Resistor', 'Cutoff frequency', 'Time constant'], rows),
      faq: [
        ['What is the difference between a low-pass and a high-pass RC filter?', 'In a low-pass filter the output is taken across the capacitor and low frequencies pass. In a high-pass filter the output is taken across the resistor and high frequencies pass. Both have the same cutoff frequency.'],
        ['Why is the gain −3 dB at the cutoff?', 'At f = fc the resistance and the capacitor reactance are equal, so the output voltage is 1 / √2 of the input, which is 0.7071 or −3.01 dB.'],
        ['How steep is a single RC filter?', 'It falls at 20 dB per decade, or about 6 dB per octave, above the cutoff. A steeper response needs more stages or an active filter.'],
        ['Does the load change the cutoff?', 'Yes. A load resistance in parallel with the capacitor lowers the gain and moves the cutoff. Use a buffer or keep the load much larger than R.']],
      related: [['capacitor-formulas.html', 'Capacitor Formulas'], ['resistor-formulas.html', 'Resistor Formulas'], ['resonance-formulas.html', 'Resonance Formulas'], ['../calculators/electronics-and-instrumentation/', 'Electronics and instrumentation calculators']]
    });
    A[A.length - 1].check = { fc, tau, gain, gdb, ph, R2 };
  }

  /* ---------- 51. rectifier ripple ---------- */
  {
    const Vrms = 12, Vpk = Vrms * Math.SQRT2, Vd = 0.7, Vp = Vpk - 2 * Vd, I = 0.5, f = 50, C = 4700e-6;
    const dV = I / (2 * f * C), Vmin = Vp - dV, Vavg = Vp - dV / 2, Vr = dV / (2 * Math.sqrt(3)), Cn = I / (2 * f * 0.5);
    const rows = [1000, 2200, 4700, 10000].map((c) => [c + ' µF', g4(I / (2 * f * c * 1e-6)) + ' V', g4(I / (f * c * 1e-6)) + ' V']);
    A.push({
      slug: 'rectifier-ripple-formulas', h1: 'Rectifier Ripple Formulas: Capacitor Filter',
      desc: 'Rectifier ripple formulas: peak voltage, ripple voltage of a capacitor filter for half-wave and full-wave rectifiers, and the capacitor for a ripple target.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Peak voltage', 'Vpk = Vrms × √2'], ['Peak after the diodes', 'Vp = Vpk − Vd (half-wave) or Vpk − 2 × Vd (bridge)'], ['Peak-to-peak ripple, full-wave', 'ΔV ≈ I / (2 × f × C)'], ['Peak-to-peak ripple, half-wave', 'ΔV ≈ I / (f × C)'], ['Average DC voltage', 'Vdc ≈ Vp − ΔV / 2'], ['RMS ripple (triangle shape)', 'Vr ≈ ΔV / (2 × √3)'], ['Capacitor for a ripple target', 'C ≈ I / (2 × f × ΔV) for full-wave']]) +
        '<p class=\"note\">I is the DC load current in amperes, f the mains frequency in hertz and C the capacitance in farads. The formulas assume a constant current load and a short conduction time, so they are an estimate, a little pessimistic for a large capacitor. Allow for the mains tolerance, the capacitor tolerance and the diode and transformer resistance. A full-wave rectifier has a ripple frequency of 2 × f.</p>' +
        '<h2>Worked example: bridge rectifier, 12 V RMS, 0.5 A, 4,700 µF</h2><p>A 50 Hz supply and two diode drops of 0.7 V each.</p>' +
        steps(['Vpk = 12 × √2 = ' + g4(Vpk) + ' V, so Vp = ' + g4(Vpk) + ' − 2 × 0.7 = ' + g4(Vp) + ' V', 'ΔV = 0.5 / (2 × 50 × 0.0047) = ' + g4(dV) + ' V', 'The minimum voltage is ' + g4(Vp) + ' − ' + g4(dV) + ' = ' + g4(Vmin) + ' V and the average is about ' + g4(Vavg) + ' V', 'The RMS ripple is ' + g4(dV) + ' / (2 × √3) = ' + g4(Vr) + ' V']) +
        '<h2>Worked example: capacitor for 0.5 V ripple</h2>' +
        steps(['C = 0.5 / (2 × 50 × 0.5) = ' + g4(Cn * 1e6) + ' µF']) +
        '<h2>Ripple at 0.5 A and 50 Hz</h2>' + table(['Capacitor', 'Full-wave ΔV', 'Half-wave ΔV'], rows),
      faq: [
        ['Why is a full-wave rectifier better for ripple?', 'It refills the capacitor twice per mains cycle, so the capacitor discharges for half as long and the ripple is half that of a half-wave circuit with the same capacitor.'],
        ['How much capacitance do I need?', 'Enough that the minimum voltage stays above what the regulator or load needs. Use C ≈ I / (2 × f × ΔV) and round up to the next standard value, allowing for the capacitor tolerance.'],
        ['What is ripple current in the capacitor?', 'The capacitor charges in short pulses, so its RMS ripple current is several times the DC load current. Check the ripple current rating on the data sheet.'],
        ['Does a regulator remove the ripple?', 'A linear regulator reduces it by its ripple rejection, but the input must stay above the dropout voltage at the lowest point of the ripple.']],
      related: [['rms-waveform-formulas.html', 'RMS, Peak and Average Values'], ['capacitor-formulas.html', 'Capacitor Formulas'], ['rc-filter-formulas.html', 'RC Filter Formulas'], ['../calculators/electronics-and-instrumentation/', 'Electronics and instrumentation calculators']]
    });
    A[A.length - 1].check = { Vpk, Vp, dV, Vmin, Vavg, Vr, Cn };
  }

  /* ---------- 52. buck and boost ---------- */
  {
    const Vi = 12, Vo = 5, L = 22e-6, f = 500e3, Dk = Vo / Vi, dIk = (Vi - Vo) * Dk / (L * f);
    const Vi2 = 5, Vo2 = 12, Io2 = 1, eta = 0.9, Db = 1 - Vi2 / Vo2, dIb = Vi2 * Db / (L * f), Iin = Vo2 * Io2 / (Vi2 * eta);
    const rows = [6, 9, 12, 15, 24].map((v) => [v + ' V', g4(1 - 5 / v)]);
    A.push({
      slug: 'buck-boost-converter-formulas', h1: 'Buck and Boost Converter Formulas: Duty Cycle',
      desc: 'Buck and boost converter formulas: duty cycle, inductor ripple current, input current with efficiency and the inductor for a ripple target, with examples.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Buck (step-down)', 'Boost (step-up)'], [
        ['Duty cycle D (ideal, continuous mode)', 'D = Vout / Vin', 'D = 1 − Vin / Vout'], ['Inductor ripple current', 'ΔIL = (Vin − Vout) × D / (L × f)', 'ΔIL = Vin × D / (L × f)'], ['Inductor for a ripple target', 'L = (Vin − Vout) × D / (f × ΔIL)', 'L = Vin × D / (f × ΔIL)'], ['Input current', 'Iin = Vout × Iout / (Vin × η)', 'Iin = Vout × Iout / (Vin × η)']]) +
        '<p class=\"note\">D is the fraction of each switching period that the switch is on, f the switching frequency in hertz, L the inductance in henries and η the efficiency as a fraction. The formulas are for ideal switches in continuous conduction mode and ignore the diode and switch drops, so the real duty cycle is a little higher. A common design choice is a ripple current of 20% to 40% of the output current for a buck converter.</p>' +
        '<h2>Worked example: buck, 12 V to 5 V</h2><p>An inductor of 22 µH at 500 kHz.</p>' +
        steps(['D = 5 / 12 = ' + g4(Dk), 'ΔIL = (12 − 5) × ' + g4(Dk) + ' / (22 × 10⁻⁶ × 500,000) = ' + g4(dIk) + ' A peak to peak']) +
        '<h2>Worked example: boost, 5 V to 12 V at 1 A</h2><p>The same inductor and frequency, with an efficiency of 90%.</p>' +
        steps(['D = 1 − 5 / 12 = ' + g4(Db), 'ΔIL = 5 × ' + g4(Db) + ' / (22 × 10⁻⁶ × 500,000) = ' + g4(dIb) + ' A', 'Iin = 12 × 1 / (5 × 0.9) = ' + g4(Iin) + ' A, so the inductor must carry about ' + g4(Iin + dIb / 2) + ' A at its peak']) +
        '<h2>Boost duty cycle for a 5 V input</h2>' + table(['Output voltage', 'Duty cycle'], rows),
      faq: [
        ['Why is the boost input current higher than the output current?', 'The power is nearly the same at both ends. A lower input voltage needs a proportionally higher current, and the losses add to it.'],
        ['What happens at a high duty cycle in a boost converter?', 'The gain from real losses stops the output rising as predicted, and the control becomes difficult above about 85% to 90%. Use another topology for a large step-up.'],
        ['How do I pick the inductor?', 'Choose the inductance for the ripple you accept, then a part with a saturation current above the peak current and a low DC resistance.'],
        ['What is discontinuous conduction mode?', 'At light load the inductor current reaches zero in each cycle. The duty-cycle formulas then no longer apply, and the output depends on the load.']],
      related: [['inductor-formulas.html', 'Inductor Formulas'], ['capacitor-formulas.html', 'Capacitor Formulas'], ['rectifier-ripple-formulas.html', 'Rectifier Ripple Formulas'], ['../calculators/electronics-and-instrumentation/', 'Electronics and instrumentation calculators']]
    });
    A[A.length - 1].check = { Dk, dIk, Db, dIb, Iin };
  }

  /* ---------- 53. heat sink ---------- */
  {
    const P = 15, Ta = 40, Rjc = 1.5, Rcs = 0.5, Rsa = 3, Rt = Rjc + Rcs + Rsa, Tj = Ta + P * Rt, Tjmax = 125, Rneed = (Tjmax - Ta) / P - Rjc - Rcs, Tc = Ta + P * (Rcs + Rsa);
    const rows = [5, 10, 15, 20].map((p) => [p + ' W', g4(Ta + p * Rt) + ' °C', g4((Tjmax - Ta) / p - Rjc - Rcs) + ' K/W']);
    A.push({
      slug: 'heat-sink-formulas', h1: 'Heat Sink Formulas: Junction Temperature',
      desc: 'Heat sink formulas: junction temperature from thermal resistances, the heat sink resistance needed for a maximum junction temperature, with a worked example.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Total thermal resistance', 'Rθ = Rθjc + Rθcs + Rθsa'], ['Junction temperature', 'Tj = Ta + P × (Rθjc + Rθcs + Rθsa)'], ['Case temperature', 'Tc = Ta + P × (Rθcs + Rθsa)'], ['Heat sink resistance needed', 'Rθsa = (Tj max − Ta) / P − Rθjc − Rθcs']]) +
        '<p class=\"note\">P is the power dissipated in the device in watts, Ta the ambient air temperature in °C and the three resistances are in K/W (the same as °C/W): junction to case, case to sink (the thermal pad or paste) and sink to ambient. The method is the thermal equivalent of Ohm’s law, with temperature as voltage and power as current. Take Rθjc from the device data sheet and Rθsa from the heat sink data at your airflow. Leave a margin below the maximum junction temperature.</p>' +
        '<h2>Worked example: junction temperature</h2><p>P = 15 W, Ta = 40 °C, Rθjc = 1.5 K/W, Rθcs = 0.5 K/W and Rθsa = 3 K/W.</p>' +
        steps(['Rθ = 1.5 + 0.5 + 3 = ' + g4(Rt) + ' K/W', 'Tj = 40 + 15 × ' + g4(Rt) + ' = ' + g4(Tj) + ' °C', 'The case is at 40 + 15 × (0.5 + 3) = ' + g4(Tc) + ' °C']) +
        '<h2>Worked example: heat sink for a 125 °C limit</h2>' +
        steps(['Rθsa = (125 − 40) / 15 − 1.5 − 0.5 = ' + g4(Rneed) + ' K/W or lower']) +
        '<h2>Junction temperature and the heat sink needed</h2>' + table(['Power', 'Tj with Rθsa = 3 K/W', 'Rθsa needed for 125 °C'], rows),
      faq: [
        ['What is thermal resistance?', 'It is the temperature rise per watt of heat flowing through a path, in K/W. A lower value conducts heat better.'],
        ['Should I design to the maximum junction temperature?', 'No. A lower temperature extends the life, so many designs keep a margin of 20 °C or more, or derate to a lower limit.'],
        ['Does a bigger heat sink always help?', 'Up to a point. The case-to-sink resistance and the device resistance stay the same, and the sink needs airflow or a large surface in still air.'],
        ['Which ambient temperature do I use?', 'The highest air temperature around the heat sink in service, inside the enclosure and not the room, because other parts also heat the air.']],
      related: [['cooling-formulas.html', 'Cooling Formulas'], ['heating-formulas.html', 'Heating Formulas'], ['led-formulas.html', 'LED Formulas'], ['../calculators/electronics-and-instrumentation/', 'Electronics and instrumentation calculators']]
    });
    A[A.length - 1].check = { Rt, Tj, Tc, Rneed };
  }

  /* ---------- 54. battery pack ---------- */
  {
    const Vn = 3.7, Vpack = 48, s = Math.round(Vpack / Vn), Ah = 3.5, need = 10, p = Math.ceil(need / Ah), cells = s * p, Cpk = p * Ah, Vnom = s * Vn, Wh = Vnom * Cpk, Vfull = s * 4.2, Rc = 0.025, Rpk = Rc * s / p;
    const rows = [['Lead-acid', 2], ['LiFePO4', 3.2], ['Li-ion (NMC)', 3.7]].map((r) => [r[0], r[1] + ' V', Math.round(48 / r[1]) + ' cells']);
    A.push({
      slug: 'battery-pack-formulas', h1: 'Battery Pack Formulas: Series and Parallel',
      desc: 'Battery pack formulas: cells in series for voltage, strings in parallel for capacity, pack energy in Wh and internal resistance, with a 13S3P worked example.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Cells in series', 's = Vpack / Vcell'], ['Strings in parallel', 'p = Ah needed / Ah per cell, rounded up'], ['Total cells', 'N = s × p'], ['Pack voltage', 'Vpack = s × Vcell'], ['Pack capacity', 'Cpack = p × Ccell'], ['Pack energy', 'E (Wh) = Vpack × Cpack'], ['Pack internal resistance', 'Rpack = Rcell × s / p']]) +
        '<p class=\"note\">Vcell is the nominal cell voltage and Ccell the cell capacity in ampere-hours. A pack written 13S3P has 13 cells in series and 3 in parallel. The nominal cell voltage is 2 V for lead-acid, 3.2 V for LiFePO4 and 3.7 V for NMC lithium-ion. Use the voltage range from the cell data sheet for the charger and the cut-off, and a battery management system for lithium cells.</p>' +
        '<h2>Worked example: 48 V, 10 Ah from 3.7 V, 3.5 Ah cells</h2>' +
        steps(['s = 48 / 3.7 = ' + g4(48 / 3.7) + ', so use ' + s + ' cells in series, giving ' + g4(Vnom) + ' V nominal', 'p = 10 / 3.5 = ' + g4(need / Ah) + ', rounded up to ' + p + ' in parallel, giving ' + g4(Cpk) + ' Ah', 'Total cells: ' + s + ' × ' + p + ' = ' + cells, 'Energy = ' + g4(Vnom) + ' × ' + g4(Cpk) + ' = ' + g4(Wh) + ' Wh', 'Fully charged at 4.2 V per cell: ' + s + ' × 4.2 = ' + g4(Vfull) + ' V', 'With 25 mΩ cells, Rpack = 0.025 × ' + s + ' / ' + p + ' = ' + g4(Rpk * 1000) + ' mΩ']) +
        '<h2>Cells in series for a 48 V pack</h2>' + table(['Chemistry', 'Nominal cell voltage', 'Cells in series'], rows),
      faq: [
        ['What does a series connection do?', 'It adds the cell voltages and keeps the capacity the same. The current through every cell in the string is the same.'],
        ['What does a parallel connection do?', 'It adds the capacities and keeps the voltage the same. The load current divides between the strings.'],
        ['Why does the capacity not come out exactly?', 'The cell count is a whole number, so the pack is rounded up to the next whole string. Check that the pack is not oversized for the charger or the space.'],
        ['Do I need a battery management system?', 'For lithium cells, yes. It balances the cells, and it protects against overcharge, over-discharge, over-current and temperature.']],
      related: [['battery-formulas.html', 'Battery Formulas'], ['ups-formulas.html', 'UPS Formulas'], ['solar-pv-formulas.html', 'Solar PV Formulas'], ['../calculators/battery-bank-sizing/', 'Battery bank sizing calculator']]
    });
    A[A.length - 1].check = { s, p, cells, Cpk, Vnom, Wh, Vfull, Rpk };
  }

  /* ---------- 55. motor acceleration time ---------- */
  {
    const P = 55, N = 1480, w = 2 * Math.PI * N / 60, Tr = P * 1000 / w, Jm = 1.2, Jl = 220, i = 5, Jref = Jl / (i * i), J = Jm + Jref, Tm = 1.5 * Tr, Tl = 0.5 * Tr, Ta = Tm - Tl, t = J * w / Ta, E = 0.5 * J * w * w;
    const rows = [5, 10, 15, 20].map((j) => [j + ' kg·m²', g4(j * w / Ta) + ' s']);
    A.push({
      slug: 'motor-acceleration-time-formulas', h1: 'Motor Acceleration Time Formulas',
      desc: 'Motor acceleration time formulas: load inertia referred to the motor shaft, accelerating torque, run-up time and stored kinetic energy, with a 55 kW example.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Angular speed', 'ω = 2π × N / 60'], ['Load inertia at the motor shaft', 'Jref = Jload / i²'], ['Total inertia', 'J = Jmotor + Jref'], ['Accelerating torque', 'Ta = Tmotor (average) − Tload (average)'], ['Acceleration time', 't = J × ω / Ta'], ['Kinetic energy', 'E = ½ × J × ω²']]) +
        '<p class=\"note\">J is in kg·m², N in rpm, torque in N·m and i is the speed ratio of a gear or belt between the motor and the load. The torques are averages over the speed range, taken from the motor and load speed-torque curves. Use a segment-by-segment sum for a curve that changes a lot. The formula gives the time to reach the final speed with a constant net torque, and the motor current stays high during this time, which sets the heating in the motor.</p>' +
        '<h2>Worked example: 55 kW at 1,480 rpm through a 5:1 drive</h2><p>The motor inertia is 1.2 kg·m², the load inertia is 220 kg·m² on the slow shaft, the average motor torque is 150% of rated and the average load torque is 50% of rated.</p>' +
        steps(['Rated torque = 9549.3 × 55 / 1480 = ' + g4(Tr) + ' N·m and ω = 2π × 1480 / 60 = ' + g4(w) + ' rad/s', 'Jref = 220 / 5² = ' + g4(Jref) + ' kg·m², so J = 1.2 + ' + g4(Jref) + ' = ' + g4(J) + ' kg·m²', 'Ta = (1.5 − 0.5) × ' + g4(Tr) + ' = ' + g4(Ta) + ' N·m', 't = ' + g4(J) + ' × ' + g4(w) + ' / ' + g4(Ta) + ' = ' + g4(t) + ' s', 'The kinetic energy at full speed is ½ × ' + g4(J) + ' × ' + g4(w) + '² = ' + g4(E / 1000) + ' kJ']) +
        '<h2>Run-up time by total inertia (same torques)</h2>' + table(['Total inertia', 'Acceleration time'], rows),
      faq: [
        ['Why is the load inertia divided by the ratio squared?', 'Kinetic energy is the same on both shafts. A load turning slowly with inertia J has the same energy as a smaller inertia J / i² turning i times faster on the motor shaft.'],
        ['Why does the acceleration time matter?', 'The motor draws a high starting current for the whole run-up, so a long time heats the windings. Compare the time with the locked-rotor withstand time on the data sheet.'],
        ['Where do I find the load inertia?', 'In the data sheet of the fan, pump or machine, often as WK² or GD² in kg·m². Convert with J = GD² / 4.'],
        ['What if the torque changes a lot with speed?', 'Split the speed range into steps, find the net torque in each, and add the times. A fan load has a torque that rises with the square of speed.']],
      related: [['motor-starting-formulas.html', 'Motor Starting Formulas'], ['motor-formulas.html', 'Induction Motor Formulas'], ['gear-drive-formulas.html', 'Gear and Belt Drive Formulas'], ['../calculators/motor-engineering/', 'Motor engineering calculators']]
    });
    A[A.length - 1].check = { Tr, w, Jref, J, Ta, t, E };
  }

  /* ---------- 56. zener regulator ---------- */
  {
    const Vi = 12, Vz = 5.1, IL = 0.02, Iz = 0.005, Rs = (Vi - Vz) / (IL + Iz), Is = (Vi - Vz) / Rs, Pz = Vz * Is, Pr = Is * Is * Rs;
    const rows = [5, 10, 20, 40].map((ma) => [ma + ' mA', g4((Vi - Vz) / (ma / 1000 + Iz)) + ' Ω']);
    A.push({
      slug: 'zener-regulator-formulas', h1: 'Zener Regulator Formulas: Series Resistor',
      desc: 'Zener diode shunt regulator formulas: series resistor, zener current with and without the load, power in the zener and in the resistor, with a worked example.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Series resistor', 'Rs = (Vin − Vz) / (IL + Iz min)'], ['Supply current', 'Is = (Vin − Vz) / Rs'], ['Zener current', 'Iz = Is − IL'], ['Zener power (load removed)', 'Pz = Vz × Is'], ['Resistor power', 'PR = Is² × Rs']]) +
        '<p class=\"note\">Vz is the zener voltage, IL the load current and Iz min the smallest zener current that keeps the voltage regulated (take it from the data sheet, often 5 mA or more). Design at the lowest input voltage for the resistor and check the zener power at the highest input voltage with the load removed, which is the worst case. The zener voltage also changes a little with current and temperature.</p>' +
        '<h2>Worked example: 12 V to 5.1 V at 20 mA</h2><p>The minimum zener current is 5 mA.</p>' +
        steps(['Rs = (12 − 5.1) / (0.020 + 0.005) = ' + g4(Rs) + ' Ω', 'Is = (12 − 5.1) / ' + g4(Rs) + ' = ' + g4(Is * 1000) + ' mA', 'With the load removed the zener carries all of it: Pz = 5.1 × ' + g4(Is) + ' = ' + g4(Pz) + ' W', 'The resistor dissipates ' + g4(Is) + '² × ' + g4(Rs) + ' = ' + g4(Pr) + ' W']) +
        '<h2>Series resistor for 12 V to 5.1 V</h2>' + table(['Load current', 'Series resistor'], rows),
      faq: [
        ['Why is the zener power worst with no load?', 'The whole supply current then flows through the zener, so its power is Vz × Is. With a load, the load takes part of the current.'],
        ['Is a zener a good regulator for large currents?', 'No. It wastes the full supply current all the time. For more than a few tens of milliamperes use a series regulator or a switching converter.'],
        ['What if the input voltage varies?', 'Calculate Rs for the lowest input and the highest load, then check the zener current and power at the highest input and the lowest load.'],
        ['Does the load voltage stay exactly at Vz?', 'No. It moves with the zener current through the dynamic impedance of the diode, a few ohms for a 5 V part, and with temperature.']],
      related: [['resistor-formulas.html', 'Resistor Formulas'], ['ohms-law-formulas.html', 'Ohm’s Law Formulas'], ['rectifier-ripple-formulas.html', 'Rectifier Ripple Formulas'], ['../calculators/electronics-and-instrumentation/', 'Electronics and instrumentation calculators']]
    });
    A[A.length - 1].check = { Rs, Is, Pz, Pr };
  }

  /* ---------- 57. BJT bias ---------- */
  {
    const Vcc = 12, R1 = 47000, R2 = 10000, RC = 2200, RE = 1000, VBE = 0.7, VB = Vcc * R2 / (R1 + R2), VE = VB - VBE, IE = VE / RE, VC = Vcc - IE * RC, VCE = VC - VE;
    const rows = [0.6, 0.7, 0.8].map((v) => { const ie = (VB - v) / RE; return [v + ' V', g4(ie * 1000) + ' mA', g4(Vcc - ie * (RC + RE)) + ' V']; });
    A.push({
      slug: 'bjt-bias-formulas', h1: 'BJT Bias Formulas: Voltage Divider Bias',
      desc: 'Bipolar transistor voltage divider bias formulas: base voltage, emitter and collector current, collector voltage and VCE, with a worked example and a table.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Base voltage (stiff divider)', 'VB = Vcc × R2 / (R1 + R2)'], ['Emitter voltage', 'VE = VB − VBE'], ['Emitter current', 'IE = VE / RE'], ['Collector current', 'IC ≈ IE (for a high gain)'], ['Collector voltage', 'VC = Vcc − IC × RC'], ['Collector-emitter voltage', 'VCE = VC − VE = Vcc − IC × (RC + RE)']]) +
        '<p class=\"note\">VBE is about 0.7 V for a silicon transistor and falls by about 2 mV per °C. The method assumes the divider current is at least ten times the base current, so the base voltage is set by the divider and not by the transistor gain. This is why the circuit is stable against changes in β. For a mid-supply bias aim for VCE near half of Vcc, and check the result on the bench.</p>' +
        '<h2>Worked example: 12 V supply</h2><p>R1 = 47 kΩ, R2 = 10 kΩ, RC = 2.2 kΩ and RE = 1 kΩ.</p>' +
        steps(['VB = 12 × 10 / (47 + 10) = ' + g4(VB) + ' V', 'VE = ' + g4(VB) + ' − 0.7 = ' + g4(VE) + ' V, so IE = ' + g4(VE) + ' / 1000 = ' + g4(IE * 1000) + ' mA', 'VC = 12 − ' + g4(IE * 1000) + ' mA × 2.2 kΩ = ' + g4(VC) + ' V', 'VCE = ' + g4(VC) + ' − ' + g4(VE) + ' = ' + g4(VCE) + ' V']) +
        '<h2>Effect of VBE on the bias point</h2>' + table(['VBE', 'IE', 'VCE'], rows),
      faq: [
        ['Why is an emitter resistor used?', 'It gives negative feedback. If the current rises, the voltage across RE rises and reduces the base-emitter voltage, which holds the current steady against changes in β and temperature.'],
        ['How stiff must the divider be?', 'The divider current should be about ten times the base current. A stiffer divider holds VB better but loads the signal source and wastes power.'],
        ['Why aim for VCE near half of the supply?', 'It leaves equal room for the collector voltage to swing up and down before the signal clips.'],
        ['What if the transistor gain is low?', 'Then the base current is not small and the base voltage drops. Use the Thévenin equivalent of the divider and include the base current in the calculation.']],
      related: [['thevenin-norton-formulas.html', 'Thévenin and Norton Formulas'], ['resistor-formulas.html', 'Resistor Formulas'], ['op-amp-formulas.html', 'Op-Amp Formulas'], ['../calculators/electronics-and-instrumentation/', 'Electronics and instrumentation calculators']]
    });
    A[A.length - 1].check = { VB, VE, IE, VC, VCE };
  }

  /* ---------- 58. Pt100 RTD ---------- */
  {
    const R0 = 100, a = 3.9083e-3, b = -5.775e-7, Rt = (t) => R0 * (1 + a * t + b * t * t), t1 = 50, R50 = Rt(t1), R100 = Rt(100), V1 = R50 * 1;
    const Rm = 119.4, tinv = (-a + Math.sqrt(a * a - 4 * b * (1 - Rm / R0))) / (2 * b), Rlead = 0.5, err = 2 * Rlead / (R0 * a);
    const rows = [0, 25, 50, 100, 150, 200].map((t) => [t + ' °C', g4(Rt(t)) + ' Ω']);
    A.push({
      slug: 'pt100-rtd-formulas', h1: 'Pt100 RTD Formulas: Resistance and Temperature',
      desc: 'Pt100 RTD formulas: resistance from temperature (Callendar-Van Dusen), temperature from resistance, and the lead wire error of a two-wire connection.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula (0 °C to 850 °C)'], [
        ['Resistance at t', 'Rt = R0 × (1 + A × t + B × t²)'], ['Temperature from resistance', 't = (−A + √(A² − 4 × B × (1 − Rt / R0))) / (2 × B)'], ['Voltage at excitation current', 'V = Rt × I'], ['Two-wire lead error', 'Δt ≈ 2 × Rlead / (R0 × A)']]) +
        '<p class=\"note\">R0 = 100 Ω at 0 °C for a Pt100. The constants for the standard curve (IEC 60751) are A = 3.9083 × 10⁻³ °C⁻¹ and B = −5.775 × 10⁻⁷ °C⁻². Below 0 °C the standard adds a C term, which this page does not use. The sensitivity is about 0.385 Ω per °C near 0 °C. Keep the excitation current small, often 1 mA or less, so that self-heating does not add an error.</p>' +
        '<h2>Worked example: resistance at 50 °C and 100 °C</h2>' +
        steps(['R50 = 100 × (1 + 3.9083 × 10⁻³ × 50 + (−5.775 × 10⁻⁷) × 50²) = ' + g4(R50) + ' Ω', 'R100 = ' + g4(R100) + ' Ω', 'With a 1 mA excitation current the voltage at 50 °C is ' + g4(R50) + ' mV']) +
        '<h2>Worked example: temperature from a reading</h2><p>A measured resistance of 119.4 Ω.</p>' +
        steps(['t = ' + g4(tinv) + ' °C from the formula above']) +
        '<h2>Worked example: lead wire error</h2><p>A two-wire connection with 0.5 Ω in each lead.</p>' +
        steps(['The leads add 1.0 Ω, so the error is 1.0 / (100 × 0.0039083) = ' + g4(err) + ' °C']) +
        '<h2>Pt100 resistance by temperature</h2>' + table(['Temperature', 'Resistance'], rows),
      faq: [
        ['What is the difference between two-, three- and four-wire connections?', 'A two-wire circuit includes the lead resistance in the reading. A three-wire circuit cancels most of it in a bridge. A four-wire circuit removes it by measuring the voltage at the sensor.'],
        ['Why is a small excitation current used?', 'The current heats the element. At 1 mA a Pt100 dissipates about 0.1 mW, which is negligible in a liquid but can matter in still air.'],
        ['What is the difference between Pt100 and Pt1000?', 'Pt1000 has ten times the resistance, so the same lead resistance gives one tenth of the error in temperature.'],
        ['Is the relation exactly linear?', 'No. The resistance is slightly curved, and a straight line R0 × (1 + A × t) is out by about 0.6 Ω, or 1.5 °C, at 100 °C compared with the standard curve.']],
      related: [['wheatstone-bridge-formulas.html', 'Wheatstone Bridge Formulas'], ['loop-4-20ma-formulas.html', '4-20 mA Loop Formulas'], ['thermistor-formulas.html', 'NTC Thermistor Formulas'], ['../calculators/electronics-and-instrumentation/', 'Electronics and instrumentation calculators']]
    });
    A[A.length - 1].check = { R50, R100, tinv, err };
  }

  /* ---------- 59. NTC thermistor ---------- */
  {
    const R0 = 10000, T0 = 298.15, B = 3950, Rt = (c) => R0 * Math.exp(B * (1 / (c + 273.15) - 1 / T0)), R50 = Rt(50), Rm = 5000, Tm = 1 / (1 / T0 + Math.log(Rm / R0) / B) - 273.15, Vs = 3.3, Vo = Vs * R50 / (R50 + 10000);
    const rows = [0, 25, 50, 75, 100].map((c) => [c + ' °C', g4(Rt(c)) + ' Ω']);
    A.push({
      slug: 'thermistor-formulas', h1: 'NTC Thermistor Formulas: Beta Equation',
      desc: 'NTC thermistor formulas: resistance from temperature with the beta equation, temperature from resistance, and the output of a divider with a pull-up resistor.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Resistance at temperature T', 'R = R0 × exp(B × (1 / T − 1 / T0))'], ['Temperature from resistance', '1 / T = 1 / T0 + ln(R / R0) / B'], ['Divider output (thermistor to ground)', 'Vout = Vs × R / (R + Rfixed)']]) +
        '<p class=\"note\">Temperatures T and T0 are in kelvin (K = °C + 273.15). R0 is the resistance at the reference temperature T0, usually 25 °C, and B is the beta value in kelvin from the data sheet. The beta equation is accurate over a narrow range, a few tens of degrees. For a wide range use the Steinhart-Hart equation with the coefficients from the maker.</p>' +
        '<h2>Worked example: 10 kΩ, B = 3950, at 50 °C</h2>' +
        steps(['T = 323.15 K and T0 = 298.15 K', 'R = 10,000 × exp(3950 × (1 / 323.15 − 1 / 298.15)) = ' + g4(R50) + ' Ω']) +
        '<h2>Worked example: temperature from 5 kΩ</h2>' +
        steps(['1 / T = 1 / 298.15 + ln(5000 / 10000) / 3950, so T = ' + g4(Tm + 273.15) + ' K = ' + g4(Tm) + ' °C']) +
        '<h2>Worked example: divider with a 10 kΩ resistor on 3.3 V</h2>' +
        steps(['At 50 °C, Vout = 3.3 × ' + g4(R50) + ' / (' + g4(R50) + ' + 10,000) = ' + g4(Vo) + ' V']) +
        '<h2>Resistance by temperature</h2>' + table(['Temperature', 'Resistance'], rows),
      faq: [
        ['What does NTC mean?', 'Negative temperature coefficient. The resistance falls as the temperature rises, by several percent per °C, which makes it very sensitive.'],
        ['How accurate is the beta equation?', 'Within a narrow range around the reference point, usually well within a degree. Further away the error grows, and the Steinhart-Hart equation is better.'],
        ['Which pull-up resistor value should I choose?', 'About the thermistor resistance at the middle of your range, which gives the largest signal change around that temperature.'],
        ['Is self-heating a problem?', 'It can be, because the current heats the bead. Keep the power small, a fraction of a milliwatt, and check the dissipation constant on the data sheet.']],
      related: [['pt100-rtd-formulas.html', 'Pt100 RTD Formulas'], ['resistor-formulas.html', 'Resistor Formulas'], ['loop-4-20ma-formulas.html', '4-20 mA Loop Formulas'], ['../calculators/electronics-and-instrumentation/', 'Electronics and instrumentation calculators']]
    });
    A[A.length - 1].check = { R50, Tm, Vo };
  }

  /* ---------- 60. fusing current ---------- */
  {
    const Kc = 10244, Ka = 7585, mm = 25.4, f = (K, d) => K * Math.pow(d / mm, 1.5), d = 0.5, Ic = f(Kc, d), Ia = f(Ka, d), dn = Math.pow(20 / (Kc / Math.pow(mm, 1.5)), 2 / 3);
    const rows = [0.1, 0.2, 0.5, 1, 2].map((x) => [x + ' mm', g4(f(Kc, x)) + ' A', g4(f(Ka, x)) + ' A']);
    A.push({
      slug: 'fusing-current-formulas', h1: 'Fusing Current Formulas: Wire Fuse Estimate',
      desc: 'Fusing current of a bare wire from Preece’s rule: current that melts a copper or aluminium wire in free air, wire diameter for a chosen current, with a table.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Fusing current (diameter in inches)', 'I = K × d^1.5'], ['Fusing current (diameter in mm)', 'I = K × (d / 25.4)^1.5, so K′ = K / 25.4^1.5'], ['Diameter for a fusing current', 'd = (I / K′)^(2/3)']]) +
        '<p class=\"note\">Preece’s constant K is about 10,244 for copper and 7,585 for aluminium with d in inches. In millimetres that is about 80 for copper and 59 for aluminium. The current is the value that melts a bare, straight wire in free air at room temperature, and it is only an estimate. A fuse must carry its rated current indefinitely, so a real fuse rating is far lower than the fusing current. Use a manufactured fuse for protection, not a piece of wire.</p>' +
        '<h2>Worked example: 0.5 mm copper wire</h2>' +
        steps(['d = 0.5 / 25.4 = ' + g4(d / mm) + ' in', 'I = 10,244 × ' + g4(d / mm) + '^1.5 = ' + g4(Ic) + ' A', 'For aluminium, I = 7,585 × ' + g4(d / mm) + '^1.5 = ' + g4(Ia) + ' A']) +
        '<h2>Worked example: diameter for a 20 A fusing current in copper</h2>' +
        steps(['d = (20 / ' + g4(Kc / Math.pow(mm, 1.5)) + ')^(2/3) = ' + g4(dn) + ' mm']) +
        '<h2>Fusing current by wire diameter</h2>' + table(['Diameter', 'Copper', 'Aluminium'], rows),
      faq: [
        ['Is the fusing current the same as the safe current?', 'No. It is the current at which the wire melts, usually after a time. The safe continuous current is many times lower and comes from the cable ratings.'],
        ['Why does it depend on d to the power 1.5?', 'The heat generated depends on the cross-section, which goes with d², and the heat lost depends on the surface, which goes with d, so the balance gives a power near 1.5.'],
        ['Can I make a fuse from a piece of wire?', 'It is not advised. The time to melt, the arc and the temperature are not controlled. Use a fuse with a tested time-current curve.'],
        ['Does it work for a short-circuit time of a fraction of a second?', 'No. For short faults the heat does not escape, and the adiabatic formula in the short-circuit cable calculator is the right tool.']],
      related: [['cable-sizing-formulas.html', 'Cable Size Formulas'], ['conductor-resistance-formulas.html', 'Conductor Resistance Formulas'], ['circuit-breaker-formulas.html', 'Circuit Breaker Formulas'], ['../calculators/cable-size/', 'Cable size calculators']]
    });
    A[A.length - 1].check = { Ic, Ia, dn };
  }

  /* ---------- 61. flywheel ---------- */
  {
    const m = 50, r = 0.3, N1 = 3000, N2 = 2000, J = 0.5 * m * r * r, w1 = 2 * Math.PI * N1 / 60, w2 = 2 * Math.PI * N2 / 60, E = 0.5 * J * w1 * w1, dE = 0.5 * J * (w1 * w1 - w2 * w2), Wh = E / 3600;
    const rows = [1000, 2000, 3000, 4000].map((n) => { const w = 2 * Math.PI * n / 60; return [n + ' rpm', g4(0.5 * J * w * w / 1000) + ' kJ']; });
    A.push({
      slug: 'flywheel-energy-formulas', h1: 'Flywheel Formulas: Stored Energy',
      desc: 'Flywheel formulas: moment of inertia of a solid disc or ring, kinetic energy at speed, usable energy between two speeds and torque to change the speed.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Inertia of a solid disc', 'J = ½ × m × r²'], ['Inertia of a thin ring', 'J = m × r²'], ['Angular speed', 'ω = 2π × N / 60'], ['Kinetic energy', 'E = ½ × J × ω²'], ['Usable energy between speeds', 'ΔE = ½ × J × (ω1² − ω2²)'], ['Torque for a speed change', 'T = J × Δω / t']]) +
        '<p class=\"note\">m is the mass in kilograms, r the radius in metres, N the speed in rpm and J in kg·m². One watt-hour is 3,600 joules. The energy rises with the square of the speed, so speed matters more than mass. The rim speed limits the speed a real flywheel can reach, set by the strength of the material, and the bearings and air drag cause standing losses.</p>' +
        '<h2>Worked example: a 50 kg steel disc, radius 0.3 m, at 3,000 rpm</h2>' +
        steps(['J = 0.5 × 50 × 0.3² = ' + g4(J) + ' kg·m²', 'ω = 2π × 3000 / 60 = ' + g4(w1) + ' rad/s', 'E = ½ × ' + g4(J) + ' × ' + g4(w1) + '² = ' + g4(E / 1000) + ' kJ = ' + g4(Wh) + ' Wh', 'Between 3,000 and 2,000 rpm the usable energy is ' + g4(dE / 1000) + ' kJ, which is ' + g4(dE / E * 100) + '% of the stored energy']) +
        '<h2>Energy of this flywheel by speed</h2>' + table(['Speed', 'Stored energy'], rows),
      faq: [
        ['Why is only part of the energy usable?', 'The flywheel cannot be slowed to zero speed, because the power electronics or the load needs a minimum speed. The usable part is the energy between the working speeds.'],
        ['Why does a ring store more than a disc of the same mass?', 'Its mass is all at the full radius, so its inertia is twice that of a solid disc.'],
        ['What limits the speed?', 'The stress from the centrifugal force. The rim speed has to stay well below the strength limit of the material, which is why high-speed flywheels use composites.'],
        ['What are flywheels used for in electrical systems?', 'To ride through short power interruptions, to smooth the torque of an engine or compressor, and to give inertia to a motor-generator set.']],
      related: [['motor-acceleration-time-formulas.html', 'Motor Acceleration Time Formulas'], ['gear-drive-formulas.html', 'Gear and Belt Drive Formulas'], ['ups-formulas.html', 'UPS Formulas'], ['../calculators/motor-engineering/', 'Motor engineering calculators']]
    });
    A[A.length - 1].check = { J, w1, E, dE, Wh };
  }

  /* ---------- 62. linear regulator ---------- */
  {
    const Vi = 12, Vo = 5, Io = 1, Iq = 0.005, Iin = Io + Iq, Pin = Vi * Iin, Po = Vo * Io, Pl = Pin - Po, eta = Po / Pin * 100, Vdo = 1.2, Vmin = Vo + Vdo, R1 = 240, R2 = R1 * (Vo / 1.25 - 1);
    const rows = [7, 9, 12, 15].map((v) => [v + ' V', g4((v - Vo) * Io + v * Iq) + ' W', g4(Vo * Io / (v * (Io + Iq)) * 100) + '%']);
    A.push({
      slug: 'linear-regulator-formulas', h1: 'Linear Regulator Formulas: Power and Efficiency',
      desc: 'Linear regulator formulas: power dissipated, efficiency, minimum input from the dropout, and the resistors of an adjustable LM317-style regulator.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Input current', 'Iin = Iout + Iq'], ['Power dissipated', 'Ploss = (Vin − Vout) × Iout + Vin × Iq'], ['Efficiency', 'η = Vout × Iout / (Vin × Iin)'], ['Minimum input voltage', 'Vin min = Vout + Vdropout'], ['Adjustable regulator output', 'Vout = 1.25 × (1 + R2 / R1) (ignoring the adjust-pin current)']]) +
        '<p class=\"note\">Iq is the quiescent (ground) current of the regulator, and Vdropout the voltage it needs between input and output, from the data sheet. A linear regulator passes the load current through and burns the voltage difference as heat, so its efficiency is close to Vout / Vin. Use the heat sink article to find the junction temperature from the power. The 1.25 V reference is the usual value for an LM317-type part, and R1 is often 240 Ω.</p>' +
        '<h2>Worked example: 12 V to 5 V at 1 A</h2><p>The quiescent current is 5 mA and the dropout is 1.2 V.</p>' +
        steps(['Iin = 1 + 0.005 = ' + g4(Iin) + ' A, so Pin = 12 × ' + g4(Iin) + ' = ' + g4(Pin) + ' W and Pout = 5 W', 'Ploss = ' + g4(Pin) + ' − 5 = ' + g4(Pl) + ' W', 'Efficiency = 5 / ' + g4(Pin) + ' = ' + g4(eta) + '%', 'The smallest usable input is 5 + 1.2 = ' + g4(Vmin) + ' V']) +
        '<h2>Worked example: adjustable regulator for 5 V</h2><p>R1 = 240 Ω.</p>' +
        steps(['R2 = R1 × (Vout / 1.25 − 1) = 240 × (5 / 1.25 − 1) = ' + g4(R2) + ' Ω']) +
        '<h2>Loss for a 5 V, 1 A output</h2>' + table(['Input voltage', 'Power lost', 'Efficiency'], rows),
      faq: [
        ['Why is a linear regulator inefficient with a high input?', 'The extra voltage drops across the pass element at the full load current, and all of that power is heat. A 12 V input for a 5 V output wastes more than half of the power.'],
        ['When is a linear regulator the right choice?', 'For small currents, low noise, a small voltage difference or a simple design. For larger differences and currents a switching converter wastes less.'],
        ['What is a low-dropout (LDO) regulator?', 'A regulator that works with only a few hundred millivolts between input and output, which raises the efficiency when the input is close to the output.'],
        ['Does the quiescent current matter?', 'In battery equipment, yes, because it flows all the time. For a 1 A load it is small, as in the example.']],
      related: [['heat-sink-formulas.html', 'Heat Sink Formulas'], ['zener-regulator-formulas.html', 'Zener Regulator Formulas'], ['buck-boost-converter-formulas.html', 'Buck and Boost Converter Formulas'], ['../calculators/electronics-and-instrumentation/', 'Electronics and instrumentation calculators']]
    });
    A[A.length - 1].check = { Pin, Pl, eta, Vmin, R2 };
  }

  /* ---------- 63. MOSFET loss ---------- */
  {
    const I = 10, Rds = 0.01, D = 0.5, V = 48, tr = 20e-9, tf = 20e-9, f = 100e3, Qg = 50e-9, Vgs = 10;
    const Pc = I * I * Rds * D, Ps = 0.5 * V * I * (tr + tf) * f, Pg = Qg * Vgs * f, Pt = Pc + Ps + Pg;
    const rows = [50e3, 100e3, 200e3, 500e3].map((x) => [x / 1000 + ' kHz', g4(0.5 * V * I * (tr + tf) * x) + ' W', g4(Qg * Vgs * x) + ' W']);
    A.push({
      slug: 'mosfet-loss-formulas', h1: 'MOSFET Loss Formulas: Conduction and Switching',
      desc: 'MOSFET power loss formulas for a switching converter: conduction loss from Rds(on), switching loss from the transition times, gate drive loss and the total.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Conduction loss', 'Pc = I² × Rds(on) × D'], ['Switching loss (approximate)', 'Psw = ½ × V × I × (tr + tf) × fsw'], ['Gate drive loss', 'Pg = Qg × Vgs × fsw'], ['Total', 'P = Pc + Psw + Pg']]) +
        '<p class=\"note\">I is the RMS current while the switch is on (here the on-state current), D the duty cycle, V the voltage across the switch when it is off, tr and tf the current and voltage transition times, fsw the switching frequency, Qg the total gate charge and Vgs the gate drive voltage. Rds(on) rises with temperature, often by 50% to 100% at the hot junction, so use the hot value from the data sheet. The switching loss formula is a linear overlap estimate. It leaves out the output capacitance loss and the reverse recovery of the diode.</p>' +
        '<h2>Worked example: 48 V, 10 A at 100 kHz</h2><p>Rds(on) = 10 mΩ, D = 0.5, tr = tf = 20 ns, Qg = 50 nC and a 10 V gate drive.</p>' +
        steps(['Pc = 10² × 0.01 × 0.5 = ' + g4(Pc) + ' W', 'Psw = 0.5 × 48 × 10 × 40 ns × 100,000 = ' + g4(Ps) + ' W', 'Pg = 50 nC × 10 × 100,000 = ' + g4(Pg) + ' W', 'Total = ' + g4(Pt) + ' W']) +
        '<h2>Switching and gate loss by frequency</h2>' + table(['Frequency', 'Switching loss', 'Gate drive loss'], rows),
      faq: [
        ['Which loss dominates?', 'At low frequency the conduction loss, and at high frequency the switching loss, because it grows with the frequency while the conduction loss does not.'],
        ['Why use a lower Rds(on) and a higher frequency?', 'A lower Rds(on) usually means a larger die and more gate charge, so there is a balance between the conduction loss and the gate and switching losses.'],
        ['How do I get the temperature of the MOSFET?', 'Multiply the total loss by the thermal resistance and add the ambient temperature, as in the heat sink article.'],
        ['Is the gate drive loss in the MOSFET?', 'It is dissipated mostly in the gate driver and the gate resistor, not in the MOSFET itself, but it is a loss in the converter.']],
      related: [['heat-sink-formulas.html', 'Heat Sink Formulas'], ['buck-boost-converter-formulas.html', 'Buck and Boost Converter Formulas'], ['linear-regulator-formulas.html', 'Linear Regulator Formulas'], ['../calculators/electronics-and-instrumentation/', 'Electronics and instrumentation calculators']]
    });
    A[A.length - 1].check = { Pc, Ps, Pg, Pt };
  }

  /* ---------- 64. relay coil ---------- */
  {
    const V = 12, P = 0.4, I = P / V, R = V * V / P, Vs = 24, Rs = (Vs - V) / I, Pr = I * I * Rs, Rh = R * (1 + 0.00393 * 50), Ih = V / Rh;
    const rows = [18, 24, 36, 48].map((v) => [v + ' V', g4((v - V) / I) + ' Ω', g4(I * I * (v - V) / I) + ' W']);
    A.push({
      slug: 'relay-coil-formulas', h1: 'Relay Coil Formulas: Current and Resistor',
      desc: 'Relay coil formulas: coil current and resistance, series resistor for a higher supply, resistor power and coil resistance at temperature.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Coil current', 'I = P / V'], ['Coil resistance', 'R = V² / P'], ['Series resistor for supply Vs', 'Rs = (Vs − V) / I'], ['Resistor power', 'PR = I² × Rs'], ['Coil resistance at temperature', 'R(t) = R20 × (1 + 0.00393 × (t − 20))']]) +
        '<p class=\"note\">V is the rated coil voltage, P the rated coil power from the data sheet and I the rated coil current. A coil on a higher supply with a series resistor works, but the voltage across the coil then changes with the supply and with the coil resistance. The relay must pull in at the lowest supply voltage and not overheat at the highest. A better choice is a relay with the right coil voltage, or a DC-DC converter. The temperature coefficient is that of copper, 0.00393 per °C.</p>' +
        '<h2>Worked example: a 12 V, 400 mW coil on 24 V</h2>' +
        steps(['I = 0.4 / 12 = ' + g4(I * 1000) + ' mA and R = 12² / 0.4 = ' + g4(R) + ' Ω', 'Rs = (24 − 12) / ' + g4(I) + ' = ' + g4(Rs) + ' Ω', 'PR = ' + g4(I) + '² × ' + g4(Rs) + ' = ' + g4(Pr) + ' W, so use a resistor of at least twice that rating']) +
        '<h2>Worked example: coil resistance when hot</h2><p>The same coil at 70 °C.</p>' +
        steps(['R(70) = ' + g4(R) + ' × (1 + 0.00393 × 50) = ' + g4(Rh) + ' Ω', 'The current at 12 V falls to ' + g4(Ih * 1000) + ' mA']) +
        '<h2>Series resistor for a 12 V, 400 mW coil</h2>' + table(['Supply', 'Series resistor', 'Resistor power'], rows),
      faq: [
        ['Why does the coil need less current to hold than to pull in?', 'The air gap is closed when the relay is held, so a smaller magnetic force is enough. Some relays use this to cut the coil power after pull-in.'],
        ['Why add a diode across a DC relay coil?', 'When the current stops, the inductance of the coil produces a high voltage spike. A diode across the coil (flyback diode) carries the current and protects the driver.'],
        ['What happens to the pull-in voltage when the coil is hot?', 'The resistance rises, so the current for a given voltage falls. The pull-in voltage rises, and the data sheet gives it at a stated temperature.'],
        ['Can I use a resistor for a 24 V supply?', 'It works but it wastes power and the coil voltage depends on the supply. Check the pull-in at the lowest supply and the coil power at the highest.']],
      related: [['ohms-law-formulas.html', 'Ohm’s Law Formulas'], ['resistor-formulas.html', 'Resistor Formulas'], ['inductor-formulas.html', 'Inductor Formulas'], ['../calculators/electronics-and-instrumentation/', 'Electronics and instrumentation calculators']]
    });
    A[A.length - 1].check = { I, R, Rs, Pr, Rh, Ih };
  }

  /* ---------- 65. transformer inrush ---------- */
  {
    const S = 1000, V = 11, In = S * 1000 / (R3 * V * 1000), k = 10, Ip = k * In, Ir = In * Math.SQRT2;
    const rows = [6, 8, 10, 12].map((x) => [x + ' × In', g4(x * In) + ' A']);
    A.push({
      slug: 'transformer-inrush-formulas', h1: 'Transformer Inrush Current Formulas',
      desc: 'Transformer inrush formulas: rated current, peak inrush as a multiple of rated current, comparison with the rated peak and the effect on protection.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Rated current', 'In = S × 1000 / (√3 × V)'], ['Peak inrush current', 'Ipeak ≈ k × In'], ['Rated peak current', 'In × √2'], ['Inrush against rated peak', 'k / √2']]) +
        '<p class=\"note\">S is the rating in kVA, V the line voltage in volts and k the inrush multiple of the RMS rated current, which the manufacturer gives. Typical values are 6 to 12 for distribution transformers, and larger for small units. The inrush appears when a transformer is energised and depends on the point on the voltage wave and the residual flux in the core. It is a short pulse with a high content of second harmonic, and it decays over several cycles to seconds. The multiple of 10 in the example is an illustration, not a data sheet value.</p>' +
        '<h2>Worked example: 1,000 kVA at 11 kV</h2>' +
        steps(['In = 1000 × 1000 / (√3 × 11,000) = ' + g4(In) + ' A', 'With k = 10, Ipeak = 10 × ' + g4(In) + ' = ' + g4(Ip) + ' A', 'The rated peak is ' + g4(In) + ' × √2 = ' + g4(Ir) + ' A, so the inrush is ' + g4(Ip / Ir) + ' times the rated peak']) +
        '<h2>Peak inrush for different multiples</h2>' + table(['Multiple', 'Peak inrush'], rows),
      faq: [
        ['Why does a transformer draw inrush current?', 'The core can be driven into saturation in the first half cycle when the flux from the supply adds to the residual flux. The magnetising current then becomes very large.'],
        ['How does inrush affect the protection?', 'The overcurrent relay or fuse on the primary must not trip on the inrush, so the instantaneous setting is above the peak or the relay is restrained by the second harmonic.'],
        ['Does the inrush depend on the supply impedance?', 'Yes. A stiff supply gives a higher and longer inrush, and the resistance of the source and the transformer damps it.'],
        ['How can I reduce it?', 'Use point-on-wave switching, a pre-insertion resistor or soft-start equipment for large units.']],
      related: [['transformer-formulas.html', 'Transformer Formulas'], ['short-circuit-formulas.html', 'Short-Circuit Formulas'], ['circuit-breaker-formulas.html', 'Circuit Breaker Formulas'], ['../calculators/transformer-engineering/', 'Transformer engineering calculators']]
    });
    A[A.length - 1].check = { In, Ip, Ir };
  }

  /* ---------- 66. battery charge time ---------- */
  {
    const Ah = 100, dod = 0.5, Ich = 10, eta = 0.85, t1 = Ah * dod / (Ich * eta), cr = Ich / Ah;
    const Ah2 = 100, dod2 = 0.8, Ich2 = 20, eta2 = 0.95, t2 = Ah2 * dod2 / (Ich2 * eta2), V2 = 51.2, E2 = Ah2 * dod2 * V2 / 1000;
    const rows = [5, 10, 20, 25].map((i) => [i + ' A', g4(Ah * dod / (i * eta)) + ' h']);
    A.push({
      slug: 'battery-charge-time-formulas', h1: 'Battery Charge Time Formulas',
      desc: 'Battery charge time formulas: ampere-hours to replace, charge efficiency, charge time from the charger current, C-rate and the energy that goes back in.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Ah to replace', 'Ah = capacity × depth of discharge'], ['Charge time', 't = Ah to replace / (I charge × η)'], ['C-rate', 'C-rate = I charge / capacity'], ['Energy to replace', 'E (kWh) = Ah to replace × V / 1000']]) +
        '<p class=\"note\">Depth of discharge is the fraction taken out of the battery. η is the charge efficiency, about 0.80 to 0.90 for lead-acid and 0.95 to 0.99 for lithium, and I is the charge current in amperes. The formula gives the bulk charge time. Lead-acid batteries take much longer to charge the last 20% because the current falls in the absorption stage, so the real time is longer. Always keep to the maximum charge current and charge voltage given by the battery maker.</p>' +
        '<h2>Worked example: a 100 Ah lead-acid battery, 50% discharged</h2><p>A 10 A charger and an efficiency of 0.85.</p>' +
        steps(['Ah to replace = 100 × 0.5 = 50 Ah', 't = 50 / (10 × 0.85) = ' + g4(t1) + ' h', 'The C-rate is 10 / 100 = ' + g4(cr) + ' C']) +
        '<h2>Worked example: a 100 Ah, 51.2 V lithium battery, 80% discharged</h2><p>A 20 A charger and an efficiency of 0.95.</p>' +
        steps(['Ah to replace = 100 × 0.8 = 80 Ah', 't = 80 / (20 × 0.95) = ' + g4(t2) + ' h', 'Energy to replace = 80 × 51.2 / 1000 = ' + g4(E2) + ' kWh']) +
        '<h2>Charge time for the lead-acid example</h2>' + table(['Charger current', 'Charge time'], rows),
      faq: [
        ['Why is the charge time longer than the simple value?', 'The charge current falls near the end of a lead-acid charge to avoid gassing, and the efficiency is below one. The formula gives the bulk stage only.'],
        ['What is the C-rate?', 'The current as a multiple of the capacity. A 10 A current on a 100 Ah battery is 0.1 C, and it would take about ten hours to move the whole capacity.'],
        ['Can I use a bigger charger to charge faster?', 'Only up to the maximum charge current in the data sheet. A higher current heats the battery and shortens its life.'],
        ['How much energy does the charger take from the supply?', 'More than the energy stored, because of the charge efficiency and the charger efficiency. Divide the energy by both.']],
      related: [['battery-formulas.html', 'Battery Formulas'], ['battery-pack-formulas.html', 'Battery Pack Formulas'], ['ups-formulas.html', 'UPS Formulas'], ['../calculators/battery-bank-sizing/', 'Battery bank sizing calculator']]
    });
    A[A.length - 1].check = { t1, cr, t2, E2 };
  }

  /* ---------- 67. wind turbine ---------- */
  {
    const rho = 1.225, D = 10, v = 8, Cp = 0.4, Ar = Math.PI * D * D / 4, P = 0.5 * rho * Ar * v * v * v * Cp, Pw = 0.5 * rho * Ar * v * v * v, Pb = Pw * 16 / 27, lam = 7, w = lam * v / (D / 2), rpm = w * 60 / (2 * Math.PI);
    const rows = [4, 6, 8, 10, 12].map((x) => [x + ' m/s', g4(0.5 * rho * Ar * x * x * x * Cp / 1000) + ' kW']);
    A.push({
      slug: 'wind-turbine-power-formulas', h1: 'Wind Turbine Power Formulas: Betz Limit',
      desc: 'Wind turbine power formulas: swept area, power in the wind, power with the power coefficient, the Betz limit and rotor speed from the tip speed ratio.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Swept area', 'A = π × D² / 4'], ['Power in the wind', 'Pwind = ½ × ρ × A × v³'], ['Turbine power', 'P = ½ × ρ × A × v³ × Cp'], ['Betz limit', 'Cp max = 16 / 27 = 0.593'], ['Rotor speed from tip speed ratio', 'ω = λ × v / R, and N = ω × 60 / (2π)']]) +
        '<p class=\"note\">ρ is the air density, 1.225 kg/m³ at sea level and 15 °C, and it falls with altitude and temperature. D is the rotor diameter in metres, R the radius, v the wind speed in m/s, Cp the power coefficient (usually 0.35 to 0.45 for a good turbine) and λ the tip speed ratio. Power rises with the cube of the wind speed, so a small change in speed matters a lot. A real turbine reaches its rated power at a rated wind speed and then limits it, so the cubic law does not apply above that speed. The electrical output is also reduced by the gearbox and generator efficiency.</p>' +
        '<h2>Worked example: a 10 m rotor in an 8 m/s wind</h2>' +
        steps(['A = π × 10² / 4 = ' + g4(Ar) + ' m²', 'Pwind = 0.5 × 1.225 × ' + g4(Ar) + ' × 8³ = ' + g4(Pw / 1000) + ' kW', 'With Cp = 0.4, P = ' + g4(P / 1000) + ' kW', 'The Betz limit gives at most ' + g4(Pb / 1000) + ' kW']) +
        '<h2>Worked example: rotor speed</h2><p>A tip speed ratio of 7 at 8 m/s.</p>' +
        steps(['ω = 7 × 8 / 5 = ' + g4(w) + ' rad/s, which is ' + g4(rpm) + ' rpm']) +
        '<h2>Power by wind speed (Cp = 0.4, no rated limit)</h2>' + table(['Wind speed', 'Power'], rows),
      faq: [
        ['What is the Betz limit?', 'No turbine can take more than 16/27 (59.3%) of the kinetic energy of the wind, because the air must keep moving after it passes the rotor.'],
        ['Why does the wind speed matter so much?', 'The power in the wind is proportional to the cube of its speed. Doubling the speed gives eight times the power.'],
        ['Does the air density matter?', 'Yes, in direct proportion. At a high altitude or in hot weather the density, and so the power, is lower.'],
        ['What is the tip speed ratio?', 'The ratio of the speed of the blade tip to the wind speed. A turbine has its best Cp at one ratio, which sets the rotor speed for each wind speed.']],
      related: [['solar-pv-formulas.html', 'Solar PV Formulas'], ['energy-cost-formulas.html', 'Energy and Cost Formulas'], ['gear-drive-formulas.html', 'Gear and Belt Drive Formulas'], ['../calculators/renewable-energy/', 'Renewable energy calculators']]
    });
    A[A.length - 1].check = { Ar, Pw, P, Pb, w, rpm };
  }

  /* ---------- 68. detuning reactor ---------- */
  {
    const V = 400, Qc = 50000, f = 50, p = 0.07, Xc = V * V / Qc, Xl = p * Xc, L = Xl / (2 * Math.PI * f), fr = f / Math.sqrt(p), n = 1 / Math.sqrt(p), Vc = V / (1 - p), Qn = V * V / (Xc - Xl);
    const rows = [5.67, 7, 14].map((x) => [x + '%', g4(f / Math.sqrt(x / 100)) + ' Hz', g4(1 / Math.sqrt(x / 100))]);
    A.push({
      slug: 'detuning-reactor-formulas', h1: 'Detuning Reactor Formulas: Capacitor Banks',
      desc: 'Detuned capacitor bank formulas: reactor reactance from the percentage, resonance frequency and harmonic order, capacitor voltage rise and net kVAR.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Capacitor reactance (star equivalent)', 'Xc = V² / Qc'], ['Reactor reactance', 'XL = p × Xc, with p = 0.07 for 7%'], ['Reactor inductance', 'L = XL / (2π × f)'], ['Series resonance frequency', 'fr = f / √p'], ['Harmonic order of resonance', 'n = 1 / √p'], ['Capacitor voltage', 'Vc = V / (1 − p)'], ['Net reactive power at the fundamental', 'Q = V² / (Xc − XL)']]) +
        '<p class=\"note\">V is the line voltage, Qc the capacitor rating in VAR at that voltage and p the reactor as a fraction of the capacitor reactance. The reactor is chosen so that the series resonance is below the lowest harmonic of the network, which stops the bank and the supply resonating with the harmonics. The common values are 5.67% (210 Hz at 50 Hz), 7% (189 Hz) and 14% (134 Hz). The capacitors must be rated for the higher voltage across them, and the reactor for the harmonic currents. Take the final design from the maker and a harmonic study.</p>' +
        '<h2>Worked example: 50 kVAR bank at 400 V, 7% reactor</h2>' +
        steps(['Xc = 400² / 50,000 = ' + g4(Xc) + ' Ω, so XL = 0.07 × ' + g4(Xc) + ' = ' + g4(Xl) + ' Ω', 'L = ' + g4(Xl) + ' / (2π × 50) = ' + g4(L * 1000) + ' mH', 'fr = 50 / √0.07 = ' + g4(fr) + ' Hz, which is harmonic order ' + g4(n), 'The capacitor voltage is 400 / (1 − 0.07) = ' + g4(Vc) + ' V', 'The net reactive power is 400² / (' + g4(Xc) + ' − ' + g4(Xl) + ') = ' + g4(Qn / 1000) + ' kVAR']) +
        '<h2>Resonance by reactor percentage (50 Hz)</h2>' + table(['Reactor', 'Resonance frequency', 'Harmonic order'], rows),
      faq: [
        ['Why add a reactor in series with a capacitor bank?', 'The capacitor and the supply inductance can resonate at a harmonic frequency and amplify it. A reactor moves the resonance of the bank below the lowest harmonic, so it cannot be excited.'],
        ['Which percentage should I use?', 'Use 7% if the 5th harmonic is the lowest large one, and 14% if the 3rd is also present. Use 5.67% where the maker or the utility advises it, for example to keep clear of a ripple-control signal frequency. Check with a measurement.'],
        ['Why is the capacitor voltage higher?', 'The reactor and the capacitor are in series and the voltage across the capacitor is the supply voltage divided by (1 − p) at the fundamental frequency.'],
        ['Does the reactor change the reactive power?', 'Yes. The net reactive power at the fundamental is a little higher than the capacitor rating at the line voltage, as in the example, so the bank has to be rated for the result.']],
      related: [['harmonics-formulas.html', 'Harmonics Formulas'], ['power-factor-formulas.html', 'Power Factor Formulas'], ['capacitor-formulas.html', 'Capacitor Formulas'], ['../calculators/power-systems/', 'Power systems calculators']]
    });
    A[A.length - 1].check = { Xc, Xl, L, fr, n, Vc, Qn };
  }

  /* ---------- 69. tap changer ---------- */
  {
    const Vp = 11, Vs = 415, Vpa = 10.6, step = 2.5, f = (t) => Vs * Vpa / (Vp * (1 + t / 100)), t0 = f(0), tn = (Vpa / Vp * Vs / Vs - 1) * 100, tapSel = Math.round(tn / step) * step, Vsel = f(tapSel);
    const rows = [5, 2.5, 0, -2.5, -5].map((t) => [(t > 0 ? '+' : '') + t + '%', g4(f(t)) + ' V', g4((f(t) / Vs - 1) * 100) + '%']);
    A.push({
      slug: 'tap-changer-formulas', h1: 'Transformer Tap Changer Formulas',
      desc: 'Transformer tap changer formulas: secondary voltage at a primary tap, the tap for a target voltage, the nearest tap step and the voltage error.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Secondary voltage at a primary tap t', 'Vs = Vs rated × Vp actual / (Vp rated × (1 + t / 100))'], ['Tap for a target voltage', '1 + t / 100 = (Vp actual / Vp rated) × (Vs rated / Vs target)'], ['Nearest tap', 'round(t / step) × step'], ['Voltage error', '(Vs − Vs target) / Vs target × 100']]) +
        '<p class=\"note\">The tap is on the primary winding. A positive tap adds turns to the primary, which lowers the secondary voltage, and a negative tap raises it. Vp actual is the supply voltage on the primary, Vs rated the secondary voltage at the rated tap and rated primary voltage, and t the tap in percent. The voltage also falls with the load current by the voltage regulation of the transformer, which the formulas above do not include. Check the tap convention on the nameplate because some makers number the taps the other way.</p>' +
        '<h2>Worked example: 11 kV / 415 V transformer, the supply is 10.6 kV</h2><p>The primary taps are ±5% in steps of 2.5%, and the target secondary voltage is 415 V.</p>' +
        steps(['At the rated tap, Vs = 415 × 10.6 / 11 = ' + g4(t0) + ' V', 'The tap needed is 10.6 / 11 − 1 = ' + g4(tn) + '%', 'The nearest tap is ' + g4(tapSel) + '%, which gives ' + g4(Vsel) + ' V, an error of ' + g4((Vsel / Vs - 1) * 100) + '%']) +
        '<h2>Secondary voltage on a 10.6 kV supply, by tap</h2>' + table(['Tap', 'Secondary voltage', 'Error from 415 V'], rows),
      faq: [
        ['Which direction does a tap move the voltage?', 'A tap that adds turns to the primary winding lowers the secondary voltage. A tap that removes turns raises it.'],
        ['What is the difference between an off-circuit and an on-load tap changer?', 'An off-circuit tap changer is changed with the transformer de-energised. An on-load tap changer changes the tap under load, and is used for voltage control in a network.'],
        ['Why is the voltage not exactly the target?', 'The taps move in steps, so there is a leftover error. The load current also lowers the voltage below the no-load value.'],
        ['How do I choose the tap when the load varies a lot?', 'Check the voltage at the minimum and maximum load. Choose the tap that keeps both within the allowed band, or use an on-load tap changer.']],
      related: [['transformer-formulas.html', 'Transformer Formulas'], ['transformer-efficiency-formulas.html', 'Transformer Efficiency and Regulation'], ['voltage-drop-formulas.html', 'Voltage Drop Formulas'], ['../calculators/transformer-engineering/', 'Transformer engineering calculators']]
    });
    A[A.length - 1].check = { t0, tn, tapSel, Vsel };
  }

  /* ---------- 70. cable pulling tension ---------- */
  {
    const w = 6, g0 = 9.81, mu = 0.4, L = 80, T1 = mu * w * g0 * L, th = Math.PI / 2, T2 = T1 * Math.exp(mu * th), sig = 50, n = 3, Ac = 95, Tmax = sig * n * Ac;
    const rows = [30, 60, 80, 120].map((l) => [l + ' m', g4(mu * w * g0 * l) + ' N']);
    A.push({
      slug: 'cable-pulling-tension-formulas', h1: 'Cable Pulling Tension Formulas',
      desc: 'Cable pulling tension formulas: tension on a straight run from weight, length and friction, the increase around a bend, and the limit from the conductor area.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Straight horizontal run', 'T = μ × w × g × L'], ['Around a bend of angle θ', 'T2 = T1 × e^(μ × θ), with θ in radians'], ['Limit on the conductors', 'Tmax = σ × n × A']]) +
        '<p class=\"note\">w is the weight of the cable or cables in kg per metre, g = 9.81 m/s², L the length in metres and μ the coefficient of friction, about 0.3 to 0.5 for cable in a conduit with lubricant, and higher without it. For a bend the tension multiplies, so a long pull has the bends as near the end as possible. A vertical or sloping run adds or subtracts the weight along the slope. σ is the allowed pulling stress of the conductor in N/mm², n the number of conductors and A the area of one conductor in mm². Take σ and the maximum pulling tension from the cable maker, and note that a pulling grip on the sheath has a lower limit.</p>' +
        '<h2>Worked example: straight run</h2><p>A cable of 6 kg/m pulled 80 m with μ = 0.4.</p>' +
        steps(['T = 0.4 × 6 × 9.81 × 80 = ' + g4(T1) + ' N']) +
        '<h2>Worked example: then a 90° bend</h2>' +
        steps(['θ = 90° = π / 2 = ' + g4(th) + ' rad, so the factor is e^(0.4 × ' + g4(th) + ') = ' + g4(Math.exp(mu * th)), 'T2 = ' + g4(T1) + ' × ' + g4(Math.exp(mu * th)) + ' = ' + g4(T2) + ' N']) +
        '<h2>Worked example: limit on a three-core cable</h2><p>Three conductors of 95 mm² and an allowed stress of 50 N/mm².</p>' +
        steps(['Tmax = 50 × 3 × 95 = ' + g4(Tmax) + ' N, so the pull above is within the limit']) +
        '<h2>Tension on a straight run</h2>' + table(['Length', 'Tension (6 kg/m, μ = 0.4)'], rows),
      faq: [
        ['Why does a bend raise the tension so much?', 'The cable presses on the conduit as it turns, which adds friction. The effect is exponential, and each bend multiplies the tension by the same factor.'],
        ['How can I reduce the pulling tension?', 'Use cable lubricant, rollers, a shorter pull, a larger conduit, fewer bends, or pull from the end that gives the lower tension.'],
        ['What is the difference between the pulling eye and the grip?', 'A pulling eye on the conductors uses the strength of the metal. A grip on the outer sheath has a lower limit and is used for short pulls.'],
        ['Is the maximum tension the same for every cable?', 'No. It depends on the conductor material, the construction and the method of pulling, so use the value from the cable data sheet.']],
      related: [['conduit-fill-formulas.html', 'Conduit Fill Formulas'], ['cable-tray-fill-formulas.html', 'Cable Tray Fill Formulas'], ['cable-sizing-formulas.html', 'Cable Size Formulas'], ['../calculators/cable-engineering/', 'Cable engineering calculators']]
    });
    A[A.length - 1].check = { T1, T2, Tmax };
  }

  /* ---------- 71. insulation resistance ---------- */
  {
    const ir1 = 800, ir10 = 2400, pi = ir10 / ir1, ir30 = 600, ir60 = 800, dar = ir60 / ir30, Rt = 500, t = 20, R40 = Rt * Math.pow(0.5, (40 - t) / 10), kV = 11, Imin = kV + 1, Vt = 5000, Il = Vt / (ir1 * 1e6) * 1e6;
    const rows = [10, 20, 30, 40, 50].map((c) => [c + ' °C', g4(Math.pow(0.5, (40 - c) / 10)), g4(Rt * Math.pow(0.5, (40 - c) / 10)) + ' MΩ']);
    A.push({
      slug: 'insulation-resistance-formulas', h1: 'Insulation Resistance Formulas: PI and DAR',
      desc: 'Insulation resistance formulas: polarisation index, dielectric absorption ratio, correction to 40 °C, the kV plus 1 MΩ minimum and leakage current.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Polarisation index', 'PI = IR (10 min) / IR (1 min)'], ['Dielectric absorption ratio', 'DAR = IR (60 s) / IR (30 s)'], ['Correction to 40 °C', 'IR40 = IRt × 0.5^((40 − t) / 10)'], ['Rule-of-thumb minimum', 'IR min (MΩ) = rated kV + 1'], ['Leakage current at the test voltage', 'I = V / IR']]) +
        '<p class=\"note\">IR is the insulation resistance in megohms from a megohmmeter at a stated test voltage, and t the winding temperature in °C. The resistance roughly halves for every 10 °C rise, so readings must be corrected to a common temperature before they are compared with each other or with earlier results. The kV plus 1 MΩ figure is the usual minimum for a rotating machine winding at 40 °C. The index values that count as acceptable depend on the insulation class and the standard, so use the limits of the one you work to. A single reading is less useful than a trend over the years.</p>' +
        '<h2>Worked example: polarisation index and DAR</h2><p>A winding reads 800 MΩ at 1 minute and 2,400 MΩ at 10 minutes, and 600 MΩ at 30 s.</p>' +
        steps(['PI = 2400 / 800 = ' + g4(pi), 'DAR = 800 / 600 = ' + g4(dar) + ' (using 800 MΩ at 60 s)']) +
        '<h2>Worked example: temperature correction</h2><p>A reading of 500 MΩ at 20 °C.</p>' +
        steps(['IR40 = 500 × 0.5^((40 − 20) / 10) = ' + g4(R40) + ' MΩ']) +
        '<h2>Worked example: minimum and leakage current</h2>' +
        steps(['An 11 kV winding needs at least 11 + 1 = ' + g4(Imin) + ' MΩ at 40 °C', 'At 5,000 V the leakage with 800 MΩ is 5,000 / 800 MΩ = ' + g4(Il) + ' µA']) +
        '<h2>Correction of a 500 MΩ reading taken at each temperature</h2>' + table(['Temperature', 'Factor to 40 °C', 'Equivalent at 40 °C'], rows),
      faq: [
        ['What does the polarisation index show?', 'It shows how the leakage current falls as the insulation polarises. Dry, clean insulation shows a rising resistance. A low index of about 1 points to moisture or dirt.'],
        ['Why correct to 40 °C?', 'The resistance depends strongly on temperature. A common reference temperature makes a reading comparable with the previous ones and with the limit.'],
        ['Which test voltage should I use?', 'Use the value in the standard or in the maker’s instructions, which depends on the rated voltage of the equipment. A test voltage that is too high can damage old or wet insulation.'],
        ['Should I discharge the winding after the test?', 'Yes. The insulation stores charge, so ground the winding for as long as the test lasted, and follow the safety procedure for the equipment.']],
      related: [['cable-loss-formulas.html', 'Cable Loss Formulas'], ['earthing-formulas.html', 'Earthing Formulas'], ['motor-formulas.html', 'Induction Motor Formulas'], ['../calculators/earthing-and-grounding/', 'Earthing and grounding calculators']]
    });
    A[A.length - 1].check = { pi, dar, R40, Imin, Il };
  }

  /* ---------- 72. power angle ---------- */
  {
    const V = 11000, X = 10, d = 15 * DEG, P = V * V * Math.sin(d) / X, Pm = V * V / X, Q = V * V * (Math.cos(d) - 1) / X;
    const rows = [5, 15, 30, 60, 90].map((a) => [a + '°', g4(V * V * Math.sin(a * DEG) / X / 1e6) + ' MW']);
    A.push({
      slug: 'power-angle-formulas', h1: 'Power Transfer and Power Angle Formulas',
      desc: 'Power transfer formulas: real power from the angle between two voltages, the maximum power at 90 degrees and the reactive power at the receiving end.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula (three-phase, line voltages)'], [
        ['Real power', 'P = V1 × V2 × sin δ / X'], ['Maximum power', 'Pmax = V1 × V2 / X, at δ = 90°'], ['Reactive power at the receiving end', 'Q = V2 × (V1 × cos δ − V2) / X']]) +
        '<p class=\"note\">V1 and V2 are the line-to-line voltages at the sending and receiving ends in volts, X the reactance between them in ohms per phase and δ the angle between the voltages. The result is in watts or VAR for a three-phase circuit. The formulas assume a reactance with negligible resistance, which is a fair estimate for a transmission line or a transformer. Power flows from the end with the leading voltage. A line is never run near 90° because the system would lose stability, so the practical limit is much lower.</p>' +
        '<h2>Worked example: 11 kV at both ends, X = 10 Ω, δ = 15°</h2>' +
        steps(['P = 11,000 × 11,000 × sin 15° / 10 = ' + g4(P / 1e6) + ' MW', 'Pmax = 11,000² / 10 = ' + g4(Pm / 1e6) + ' MW', 'Q = 11,000 × (11,000 × cos 15° − 11,000) / 10 = ' + g4(Q / 1e6) + ' MVAR, so the receiving end sends reactive power back to the line']) +
        '<h2>Power for different angles (same circuit)</h2>' + table(['Angle', 'Power'], rows),
      faq: [
        ['What controls the real power flow?', 'The angle between the two voltages. A larger angle sends more power, up to a maximum at 90°.'],
        ['What controls the reactive power flow?', 'The difference in voltage magnitude. Reactive power flows from the higher voltage to the lower one.'],
        ['Why is the maximum power not used in practice?', 'At and beyond 90° the machines lose synchronism. A margin is kept to stay stable after a disturbance.'],
        ['Does the resistance matter?', 'Yes, for a distribution cable, where the resistance is not small compared with the reactance. This page is for the reactive case.']],
      related: [['transmission-line-formulas.html', 'Transmission Line Formulas'], ['three-phase-power-formulas.html', 'Three-Phase Power Formulas'], ['short-circuit-formulas.html', 'Short-Circuit Formulas'], ['../calculators/power-systems/', 'Power systems calculators']]
    });
    A[A.length - 1].check = { P, Pm, Q };
  }

  /* ---------- 73. solar panel temperature ---------- */
  {
    const Pstc = 550, gam = -0.0034, noct = 45, Ta = 35, G = 1000, Tc = Ta + (noct - 20) / 800 * G, dT = Tc - 25, fac = 1 + gam * dT, P = Pstc * fac;
    const rows = [15, 25, 35, 45].map((ta) => { const tc = ta + (noct - 20) / 800 * G; return [ta + ' °C', g4(tc) + ' °C', g4(Pstc * (1 + gam * (tc - 25))) + ' W']; });
    A.push({
      slug: 'solar-panel-temperature-formulas', h1: 'Solar Panel Temperature Derating Formulas',
      desc: 'Solar panel temperature formulas: cell temperature from air temperature and irradiance with NOCT, the temperature coefficient and the hot-cell power.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Cell temperature', 'Tcell = Tamb + (NOCT − 20) / 800 × G'], ['Temperature rise over STC', 'ΔT = Tcell − 25'], ['Power factor', 'k = 1 + γ × ΔT, with γ negative'], ['Power at the cell temperature', 'P = Pstc × k']]) +
        '<p class=\"note\">Tamb is the air temperature in °C, G the irradiance in W/m², NOCT the nominal operating cell temperature on the data sheet (often 42 to 46 °C), and γ the power temperature coefficient per °C (about −0.0034 for many silicon modules, which is −0.34% per °C). Pstc is the rating at 25 °C and 1,000 W/m². The NOCT rule is an estimate and ignores the wind speed and the way the module is mounted. The voltage also falls with temperature, which matters for the string size, so use the voltage coefficient and the coldest and hottest temperatures for that.</p>' +
        '<h2>Worked example: 550 W module, 35 °C air, 1,000 W/m²</h2><p>NOCT = 45 °C and γ = −0.34% per °C.</p>' +
        steps(['Tcell = 35 + (45 − 20) / 800 × 1000 = ' + g4(Tc) + ' °C', 'ΔT = ' + g4(Tc) + ' − 25 = ' + g4(dT) + ' °C', 'k = 1 − 0.0034 × ' + g4(dT) + ' = ' + g4(fac), 'P = 550 × ' + g4(fac) + ' = ' + g4(P) + ' W']) +
        '<h2>Power at 1,000 W/m² by air temperature</h2>' + table(['Air temperature', 'Cell temperature', 'Module power'], rows),
      faq: [
        ['Why does a module lose power when it is hot?', 'The voltage of a silicon cell falls as the temperature rises, and it falls faster than the current rises, so the power drops.'],
        ['What is NOCT?', 'The cell temperature at 800 W/m², 20 °C air and a 1 m/s wind with an open back. It is on the data sheet and gives the rise of the cell above the air.'],
        ['Does the mounting matter?', 'Yes. A roof-mounted module with little air behind it runs hotter than a ground-mounted one with free airflow, and loses more power.'],
        ['Should I use this for the string design?', 'For the energy yield, yes. For the string voltage limits use the voltage temperature coefficient and the extreme temperatures, as in the solar PV article.']],
      related: [['solar-pv-formulas.html', 'Solar PV Formulas'], ['battery-charge-time-formulas.html', 'Battery Charge Time Formulas'], ['wind-turbine-power-formulas.html', 'Wind Turbine Power Formulas'], ['../calculators/solar-pv-sizing/', 'Solar PV sizing calculators']]
    });
    A[A.length - 1].check = { Tc, dT, fac, P };
  }

  /* ---------- 74. voltage change and flicker ---------- */
  {
    const V = 11000, R = 0.5, X = 2, dP = 200000, dQ = 100000, dV = (R * dP + X * dQ) / (V * V);
    const Ssc0 = 50, dS = 0.5, pct = dS / Ssc0 * 100, Isc = 10000, Ssc = R3 * V * Isc / 1e6;
    const rows = [0.1, 0.25, 0.5, 1, 2].map((s) => [s + ' MVA', g4(s / Ssc0 * 100) + '%']);
    A.push({
      slug: 'voltage-change-formulas', h1: 'Voltage Change and Flicker Formulas',
      desc: 'Voltage change formulas: step change from a load, the dip as the ratio of load to short-circuit level, and the short-circuit level from the fault current.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Voltage change from a load step', 'ΔV/V = (R × ΔP + X × ΔQ) / V²'], ['Approximate change when X is much larger than R', 'ΔV/V ≈ ΔS / Ssc'], ['Short-circuit level', 'Ssc = √3 × V × Isc']]) +
        '<p class=\"note\">V is the line-to-line voltage in volts, R and X the resistance and reactance of the supply in ohms per phase, ΔP and ΔQ the step in real and reactive power (three-phase, in W and VAR), ΔS the step in apparent power and Ssc the short-circuit level at the same point in the same units as ΔS. The formulas are first-order estimates for a small step. A load that starts often or varies quickly causes flicker, and the limit on the voltage change depends on how often it repeats and on the utility or the standard that applies (for example IEC 61000-3-3 and IEC 61000-3-11), so use your own limit.</p>' +
        '<h2>Worked example: a load step on an 11 kV supply</h2><p>A step of 200 kW and 100 kVAR on a supply with R = 0.5 Ω and X = 2 Ω.</p>' +
        steps(['ΔV/V = (0.5 × 200,000 + 2 × 100,000) / 11,000² = ' + g4(dV), 'That is a voltage change of ' + g4(dV * 100) + '%']) +
        '<h2>Worked example: the ratio of the step to the short-circuit level</h2><p>A 0.5 MVA step on a point with a short-circuit level of 50 MVA.</p>' +
        steps(['ΔV/V ≈ 0.5 / 50 = ' + g4(pct) + '%']) +
        '<h2>Worked example: short-circuit level from the fault current</h2><p>A fault current of 10 kA at 11 kV.</p>' +
        steps(['Ssc = √3 × 11,000 × 10,000 = ' + g4(Ssc) + ' MVA']) +
        '<h2>Voltage change for steps on a 50 MVA supply</h2>' + table(['Step in apparent power', 'Voltage change'], rows),
      faq: [
        ['What is the difference between a voltage dip and flicker?', 'A dip is one drop in voltage, such as during a motor start. Flicker is the effect of repeated small changes on the light from a lamp, and the limit depends on how often the changes occur.'],
        ['Why does a stiff supply help?', 'A higher short-circuit level means a lower supply impedance, so the same step in load causes a smaller change in voltage.'],
        ['When is the ratio ΔS / Ssc accurate?', 'When the supply reactance is much larger than its resistance, which is typical for a transformer or a high-voltage network. Use the full formula with R and X for a cable or a small supply.'],
        ['Does this cover a motor start?', 'Yes, as a first estimate: use the starting kVA as ΔS. The motor starting article gives the dip for a motor on a given supply.']],
      related: [['motor-starting-formulas.html', 'Motor Starting Formulas'], ['short-circuit-formulas.html', 'Short-Circuit Formulas'], ['voltage-drop-formulas.html', 'Voltage Drop Formulas'], ['../calculators/power-systems/', 'Power systems calculators']]
    });
    A[A.length - 1].check = { dV, pct, Ssc };
  }

  /* ---------- 75. soft starter and VFD ---------- */
  {
    const In = 95, k = 6, Ist = k * In, vf = 0.5, Is = vf * Ist, Ts = vf * vf * 100;
    const Psh = 55, em = 0.94, ed = 0.97, pfi = 0.95, Pin = Psh / (em * ed), Sin = Pin / pfi, Iin = Sin * 1000 / (R3 * 415);
    const rows = [0.4, 0.5, 0.6, 0.7, 0.8].map((f) => [Math.round(f * 100) + '%', g4(f * Ist) + ' A', g4(f * f * 100) + '%']);
    const sync = [20, 30, 40, 50].map((f) => [f + ' Hz', g4(120 * f / 4) + ' rpm']);
    A.push({
      slug: 'soft-starter-vfd-formulas', h1: 'Soft Starter and VFD Sizing Formulas',
      desc: 'Soft starter and VFD formulas: start current and torque at a reduced voltage, drive input power, kVA and current, and synchronous speed from frequency.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Direct-on-line start current', 'Ist = k × In'], ['Start current at a fraction f of the voltage', 'I = f × Ist'], ['Start torque at a fraction f of the voltage', 'T = f² × T(direct-on-line)'],
        ['VFD input real power', 'Pin = Pshaft / (η motor × η drive)'], ['VFD input apparent power', 'S = Pin / pf (input)'], ['VFD input current', 'I = S × 1000 / (√3 × V)'], ['Synchronous speed', 'ns = 120 × f / p']]) +
        '<p class=\"note\">k is the ratio of the locked-rotor current to the full-load current In (from the motor data), f the voltage as a fraction of the supply voltage during the ramp, η the efficiencies as fractions, p the number of poles and ns the speed in rpm. The motor current is proportional to the voltage and the torque to its square, so a soft starter cuts the torque quickly and the load must still be able to start at that torque. A drive limits the current itself, so its input current is close to the load current, but its output current rating must cover the motor full-load current and the overload the load needs. The efficiencies and the input power factor are examples, so use the data sheets.</p>' +
        '<h2>Worked example: soft starter at 50% voltage</h2><p>A motor with In = 95 A and k = 6.</p>' +
        steps(['Ist = 6 × 95 = ' + g4(Ist) + ' A direct-on-line', 'At 50% voltage: I = 0.5 × ' + g4(Ist) + ' = ' + g4(Is) + ' A', 'Torque = 0.5² = ' + g4(Ts) + '% of the direct-on-line start torque']) +
        '<h2>Worked example: VFD input for a 55 kW shaft load</h2><p>Motor efficiency 0.94, drive efficiency 0.97, input power factor 0.95, 415 V.</p>' +
        steps(['Pin = 55 / (0.94 × 0.97) = ' + g4(Pin) + ' kW', 'S = ' + g4(Pin) + ' / 0.95 = ' + g4(Sin) + ' kVA', 'I = ' + g4(Sin) + ' × 1000 / (√3 × 415) = ' + g4(Iin) + ' A']) +
        '<h2>Soft starter ramp (In = 95 A, k = 6)</h2>' + table(['Voltage', 'Start current', 'Torque (direct-on-line = 100%)'], rows) +
        '<h2>Synchronous speed of a 4-pole motor</h2>' + table(['Frequency', 'Synchronous speed'], sync),
      faq: [
        ['Why does a soft starter cut the torque so much?', 'The torque goes with the square of the voltage, so 50% voltage gives only 25% of the torque. Check that this is above the load torque or the motor will not accelerate.'],
        ['Does a VFD reduce the start current?', 'Yes. The drive raises the voltage and frequency together and limits the current, so the motor starts with close to full-load current and good torque.'],
        ['Is the rated speed the same as the synchronous speed?', 'No. The rated speed is lower by the slip, for example 1,480 rpm against 1,500 rpm for a 4-pole motor at 50 Hz.'],
        ['How do I choose the drive rating?', 'Pick a drive whose output current is at least the motor full-load current and covers any overload the load needs. Use the maker\'s rating tables, which also give the ambient and altitude derating.']],
      related: [['motor-starting-formulas.html', 'Motor Starting Formulas'], ['motor-formulas.html', 'Induction Motor Formulas'], ['star-delta-formulas.html', 'Star-Delta Formulas'], ['../calculators/motor-starting/', 'Motor starting calculators']]
    });
    A[A.length - 1].check = { Ist, Is, Ts, Pin, Sin, Iin };
  }

  /* ---------- 76. earth fault loop and RCD ---------- */
  {
    const Ze = 0.35, L = 25, S1 = 2.5, S2 = 1.5, rho = 1.7241e-8, Rm = rho * 1e6 * L * (1 / S1 + 1 / S2), Rh = Rm * (1 + 0.00393 * 50), Zs = Ze + Rh, U0 = 230, If = U0 / Zs, Ia = 5 * 20, ZsMax = U0 / Ia;
    const rcd = [0.01, 0.03, 0.1, 0.3, 0.5], rows = rcd.map((i) => [i * 1000 + ' mA', g4(50 / i) + ' Ω']);
    A.push({
      slug: 'fault-loop-rcd-formulas', h1: 'Earth Fault Loop and RCD Formulas',
      desc: 'Earth fault loop formulas: the loop impedance from the supply and the cable, the fault current, the maximum impedance for a breaker and the limit with an RCD.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Loop impedance', 'Zs = Ze + (R1 + R2)'], ['Resistance of line and protective conductor', 'R1 + R2 = ρ × L × (1 / S1 + 1 / S2)'], ['Resistance when hot', 'R(hot) = R(20 °C) × (1 + α × (θ − 20))'],
        ['Earth fault current', 'If = U0 / Zs'], ['Largest loop impedance for a breaker', 'Zs(max) = U0 / Ia'], ['Largest earth resistance with an RCD', 'RA ≤ 50 V / IΔn']]) +
        '<p class=\"note\">Ze is the impedance of the supply side of the loop in ohms, L the cable length in metres, S1 and S2 the line and protective conductor areas in mm², ρ the resistivity in Ω·m (copper 1.7241e-8 at 20 °C), α the temperature coefficient (0.00393 for copper), U0 the voltage from line to earth, Ia the current that makes the device trip in the required time (for a type B breaker, the usual rule is 5 × In) and IΔn the rated residual current of the RCD. The 50 V limit for the touch voltage is the usual value for normal conditions and the trip times and the limit come from the standard you work to, so use your own. The resistance is taken at the working temperature because the loop must trip with hot cables.</p>' +
        '<h2>Worked example: a 25 m final circuit</h2><p>Ze = 0.35 Ω, 2.5 mm² line conductor and 1.5 mm² protective conductor, copper, 230 V, protected by a 20 A type B breaker.</p>' +
        steps(['R1 + R2 = 1.7241e-8 × 25 × (1 / 2.5 + 1 / 1.5) × 10⁶ = ' + g4(Rm) + ' Ω at 20 °C', 'Hot (70 °C): ' + g4(Rm) + ' × (1 + 0.00393 × 50) = ' + g4(Rh) + ' Ω', 'Zs = 0.35 + ' + g4(Rh) + ' = ' + g4(Zs) + ' Ω', 'If = 230 / ' + g4(Zs) + ' = ' + g4(If) + ' A', 'The breaker needs 5 × 20 = ' + Ia + ' A, so Zs(max) = 230 / ' + Ia + ' = ' + g4(ZsMax) + ' Ω, and the circuit passes']) +
        '<h2>Worked example: earth resistance with a 30 mA RCD</h2>' + steps(['RA ≤ 50 / 0.03 = ' + g4(50 / 0.03) + ' Ω']) +
        '<h2>Largest earth resistance by RCD rating (50 V limit)</h2>' + table(['RCD rating', 'Largest RA'], rows),
      faq: [
        ['What is the loop impedance?', 'The total impedance of the path of a fault current: from the source through the line conductor to the fault and back through the protective conductor and the earth path.'],
        ['Why calculate with the cable hot?', 'The resistance of copper rises with temperature, and a fault current flows when the cable is already warm, so the cold value would give a result that is too good.'],
        ['Does an RCD replace a good earth?', 'No. An RCD trips on a small leakage and makes a high earth resistance acceptable for shock protection, but the earth is still needed to give the RCD a path and the fault current.'],
        ['Which supply type is this for?', 'The loop formulas are for a TN system where the fault current returns through the protective conductor. For a TT system use the earth resistance and the RCD rule instead.']],
      related: [['earthing-formulas.html', 'Earthing Formulas'], ['circuit-breaker-formulas.html', 'Circuit Breaker Formulas'], ['conductor-resistance-formulas.html', 'Conductor Resistance Formulas'], ['../calculators/earthing-and-grounding/', 'Earthing calculators']]
    });
    A[A.length - 1].check = { Rm, Rh, Zs, If, ZsMax };
  }

  /* ---------- 77. battery internal resistance ---------- */
  {
    const E = 50, Vl = 47.6, Im = 40, Ri = (E - Vl) / Im, I2 = 100, Vt = E - I2 * Ri, Pl = Vt * I2, Ploss = I2 * I2 * Ri, eff = Vt / E * 100, Vmin = 42, Imax = (E - Vmin) / Ri, Pmax = E * E / (4 * Ri);
    const rows = [20, 50, 100, 150].map((i) => [i + ' A', g4(E - i * Ri) + ' V', g4(i * i * Ri) + ' W']);
    A.push({
      slug: 'battery-internal-resistance-formulas', h1: 'Battery Internal Resistance Formulas',
      desc: 'Battery internal resistance formulas: the terminal voltage under load, the resistance from two readings, the heat loss and the maximum current and power.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Internal resistance from two readings', 'Ri = (Voc − Vload) / I'], ['Terminal voltage on discharge', 'V = Voc − I × Ri'], ['Terminal voltage on charge', 'V = Voc + I × Ri'], ['Heat lost in the battery', 'Ploss = I² × Ri'],
        ['Efficiency of the discharge', 'η = V / Voc'], ['Largest current for a minimum voltage', 'Imax = (Voc − Vmin) / Ri'], ['Maximum power into a load', 'Pmax = Voc² / (4 × Ri), at I = Voc / (2 × Ri)']]) +
        '<p class=\"note\">Voc is the open-circuit voltage in volts, I the current in amperes and Ri the internal resistance in ohms, which is the pack value (the cell value times the series count and divided by the parallel count). The resistance is not fixed: it is higher when the battery is cold, low in charge or old, so measure it under the same conditions that you design for. This is a simple model with a constant resistance and no change of the open-circuit voltage with charge.</p>' +
        '<h2>Worked example: measure the resistance</h2><p>A pack reads 50 V with no load and 47.6 V at 40 A.</p>' +
        steps(['Ri = (50 − 47.6) / 40 = ' + g4(Ri) + ' Ω']) +
        '<h2>Worked example: a 100 A load</h2><p>The same pack, Voc = 50 V and Ri = 0.06 Ω, with a minimum voltage of 42 V.</p>' +
        steps(['V = 50 − 100 × 0.06 = ' + g4(Vt) + ' V, so the load gets ' + g4(Pl) + ' W', 'Ploss = 100² × 0.06 = ' + g4(Ploss) + ' W, so the efficiency is ' + g4(Vt) + ' / 50 = ' + g4(eff) + '%', 'Imax = (50 − 42) / 0.06 = ' + g4(Imax) + ' A', 'Pmax = 50² / (4 × 0.06) = ' + g4(Pmax / 1000) + ' kW']) +
        '<h2>Terminal voltage and loss by current (Voc = 50 V, Ri = 0.06 Ω)</h2>' + table(['Current', 'Terminal voltage', 'Loss in the battery'], rows),
      faq: [
        ['Why does the voltage fall when I draw current?', 'The current flows through the internal resistance of the cells and the connections, and that costs a voltage of I × Ri before the load sees it.'],
        ['Is the maximum power point usable?', 'Not in practice. At that point half of the power is lost as heat in the battery, so the efficiency is only 50%, and the voltage is half of the open-circuit value.'],
        ['What raises the internal resistance?', 'Low temperature, a low state of charge, age and poor connections. The value on the data sheet is for a fresh cell at room temperature.'],
        ['Does this change the runtime?', 'Yes. The loss in Ri is energy that the load does not get, and the lower voltage can reach the cut-off voltage early at a high current.']],
      related: [['battery-pack-formulas.html', 'Battery Pack Formulas'], ['battery-formulas.html', 'Battery Formulas'], ['battery-charge-time-formulas.html', 'Battery Charge Time Formulas'], ['../calculators/battery-bank-sizing/', 'Battery bank calculators']]
    });
    A[A.length - 1].check = { Ri, Vt, Pl, Ploss, eff, Imax, Pmax };
  }

  /* ---------- 78. busbar rating ---------- */
  {
    const I = 2000, J = 1.2, Areq = I / J, w = 100, t = 10, Ab = w * t, n = Math.ceil(Areq / Ab), Ja = I / (n * Ab);
    const Isc = 40000, ts = 0.5, kb = 115, Asc = Isc * Math.sqrt(ts) / kb, mCu = Ab * 1e-6 * 8960, mAl = Ab * 1e-6 * 2700;
    const rows = [[50, 5], [80, 10], [100, 10], [120, 10]].map((b) => [b[0] + ' × ' + b[1] + ' mm', g4(b[0] * b[1]) + ' mm²', g4(b[0] * b[1] * J) + ' A']);
    A.push({
      slug: 'busbar-rating-formulas', h1: 'Busbar Size and Short-Circuit Formulas',
      desc: 'Busbar formulas: the cross-section from the current and a design current density, the number of bars, the short-circuit withstand area and the mass per metre.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Cross-section area for the load', 'A = I / J'], ['Area of one bar', 'Ab = width × thickness'], ['Number of bars', 'n = A / Ab, rounded up'], ['Area for the short-circuit', 'A ≥ Isc × √t / k'], ['Mass per metre', 'm = Ab × ρm (area in m², ρm in kg/m³)']]) +
        '<p class=\"note\">I is the load current in amperes, J the design current density in A/mm², Isc the fault current in amperes, t its duration in seconds and k a constant for the material and the temperature rise from the standard or the maker. The current density is a rule of thumb: it depends on the temperature rise allowed, the enclosure, the ambient temperature, the paint and the arrangement of the bars, so use the ratings from the maker or the standard for the real busbar. The 1.2 A/mm² here is only an example for copper. Bars in parallel carry less than the sum of their areas because of the skin and proximity effects, and the bar must also be checked for the electromagnetic force of a fault (see the conductor forces article).</p>' +
        '<h2>Worked example: a 2,000 A bar</h2><p>Copper at 1.2 A/mm² with 100 × 10 mm bars.</p>' +
        steps(['A = 2000 / 1.2 = ' + g4(Areq) + ' mm²', 'Ab = 100 × 10 = ' + g4(Ab) + ' mm², so n = ' + g4(Areq / Ab) + ' rounded up to ' + n + ' bars', 'The actual current density is 2000 / ' + g4(n * Ab) + ' = ' + g4(Ja) + ' A/mm²']) +
        '<h2>Worked example: the short-circuit area</h2><p>40 kA for 0.5 s with k = 115 (an example value).</p>' +
        steps(['A ≥ 40,000 × √0.5 / 115 = ' + g4(Asc) + ' mm²']) +
        '<h2>Worked example: mass per metre of a 100 × 10 mm bar</h2>' +
        steps(['Copper: 1000 × 10⁻⁶ × 8960 = ' + g4(mCu) + ' kg/m', 'Aluminium: 1000 × 10⁻⁶ × 2700 = ' + g4(mAl) + ' kg/m']) +
        '<h2>Current at 1.2 A/mm² for common bars (example density)</h2>' + table(['Bar', 'Area', 'Current'], rows),
      faq: [
        ['Is 1.2 A/mm² a rule?', 'No. It is an example. The allowed current density depends on the temperature rise, the enclosure and the cooling, so take the rating from the busbar maker or the standard.'],
        ['Why is the rating of two bars not twice that of one?', 'The current crowds to the outside of the bars, and the bars heat each other, so the second bar adds less than its area. Spacing the bars helps.'],
        ['Does the short-circuit check use the fault duration?', 'Yes. The heat grows with I² × t, so the area goes with the current times the square root of the time.'],
        ['Copper or aluminium?', 'Aluminium needs about 1.64 times the area for the same resistance, but it is lighter, as the mass figures above show.']],
      related: [['conductor-force-formulas.html', 'Conductor Force Formulas'], ['conductor-resistance-formulas.html', 'Conductor Resistance Formulas'], ['skin-effect-formulas.html', 'Skin Effect Formulas'], ['../calculators/cable-engineering/', 'Cable engineering calculators']]
    });
    A[A.length - 1].check = { Areq, n, Ja, Asc, mCu, mAl };
  }

  /* ---------- 79. ADC resolution ---------- */
  {
    const N = 12, Vref = 3.3, lsb = Vref / Math.pow(2, N), cnt = 0.5 * Vref / lsb, snr = 6.02 * N + 1.76;
    const lsb5 = 5 / 4096, c4 = 1 / lsb5, spanC = 4096 - c4, uA = 16 / spanC * 1000, sinad = 68, enob = (sinad - 1.76) / 6.02;
    const rows = [8, 10, 12, 16, 24].map((b) => [b + ' bit', g4(Math.pow(2, b)), g4(Vref / Math.pow(2, b) * 1000) + ' mV', g4(6.02 * b + 1.76) + ' dB']);
    A.push({
      slug: 'adc-resolution-formulas', h1: 'ADC Resolution and Sampling Formulas',
      desc: 'ADC formulas: the size of one step from the bits and the reference, the count for a voltage, the ideal signal to noise ratio, ENOB and the Nyquist limit.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Step size (LSB)', 'LSB = Vref / 2ᴺ'], ['Counts for a voltage', 'counts = V / LSB = V × 2ᴺ / Vref'], ['Ideal signal to noise ratio', 'SNR = 6.02 × N + 1.76 dB'], ['Effective number of bits', 'ENOB = (SINAD − 1.76) / 6.02'], ['Sampling rate', 'fs > 2 × fmax (Nyquist)']]) +
        '<p class=\"note\">N is the number of bits, Vref the reference voltage and fmax the highest frequency in the signal. The step formula is for an ideal converter with a unipolar range of 0 to Vref. A real converter has offset, gain and noise errors that are on its data sheet, and the SINAD (the signal to noise and distortion ratio in dB) gives the effective number of bits. Frequencies above half the sampling rate fold back into the band, so a low-pass filter before the converter is needed, and the sampling rate is usually set well above the Nyquist limit.</p>' +
        '<h2>Worked example: 12 bits and a 3.3 V reference</h2>' +
        steps(['LSB = 3.3 / 4096 = ' + g4(lsb * 1000) + ' mV', 'A reading of 1.65 V is 1.65 / ' + g4(lsb * 1000) + ' mV = ' + g4(cnt) + ' counts, which is half scale', 'SNR = 6.02 × 12 + 1.76 = ' + g4(snr) + ' dB']) +
        '<h2>Worked example: a 4 to 20 mA loop on 250 Ω with a 5 V reference</h2><p>The loop gives 1 V at 4 mA and 5 V at 20 mA.</p>' +
        steps(['LSB = 5 / 4096 = ' + g4(lsb5 * 1000) + ' mV', '4 mA (1 V) is ' + g4(c4) + ' counts and 20 mA is 4096, so the span uses ' + g4(spanC) + ' counts', 'One count is 16 mA / ' + g4(spanC) + ' = ' + g4(uA) + ' µA']) +
        '<h2>Worked example: ENOB and the sampling rate</h2>' +
        steps(['A SINAD of 68 dB gives ENOB = (68 − 1.76) / 6.02 = ' + g4(enob) + ' bits', 'A signal with components up to 1 kHz needs fs above 2 kHz']) +
        '<h2>Converters with a 3.3 V reference</h2>' + table(['Resolution', 'Steps', 'LSB', 'Ideal SNR'], rows),
      faq: [
        ['Does more bits always mean better accuracy?', 'No. The noise, offset and gain error of the converter and its reference limit the accuracy, so the number of bits only gives the resolution. The ENOB shows what the converter can really do.'],
        ['What is the Nyquist limit?', 'A signal must be sampled at more than twice its highest frequency to be rebuilt. Anything above half the sampling rate shows up as a false lower frequency.'],
        ['Why use a low-pass filter before the ADC?', 'It removes the frequencies above half the sampling rate that would otherwise fold into the measurement as aliasing.'],
        ['Can I measure a sensor that uses only part of the range?', 'Yes, but it uses fewer counts, so the resolution in the sensor units is worse, as in the 4 to 20 mA example. A gain stage that fills the range gives more counts.']],
      related: [['loop-4-20ma-formulas.html', '4-20 mA Loop Formulas'], ['op-amp-formulas.html', 'Op-Amp Formulas'], ['rc-filter-formulas.html', 'RC Filter Formulas'], ['../calculators/electronics-and-instrumentation/', 'Electronics and instrumentation calculators']]
    });
    A[A.length - 1].check = { lsb, cnt, snr, c4, uA, enob };
  }


  /* ---------- 80. capacitor switching inrush ---------- */
  {
    const V = 400, Xc = 3.2, f = 50, L = 10e-6, C = 1 / (2 * Math.PI * f * Xc), Z = Math.sqrt(L / C), Vpk = V * Math.SQRT2 / R3, Ip = Vpk / Z, fi = 1 / (2 * Math.PI * Math.sqrt(L * C));
    const rows = [5, 10, 20, 50].map((u) => [u + ' µH', g4(Vpk / Math.sqrt(u * 1e-6 / C)) + ' A', g4(1 / (2 * Math.PI * Math.sqrt(u * 1e-6 * C))) + ' Hz']);
    A.push({
      slug: 'capacitor-switching-inrush-formulas', h1: 'Capacitor Switching Inrush Formulas',
      desc: 'Capacitor switching formulas: the capacitance from the reactance, the peak inrush current limited by the circuit inductance and the frequency of the inrush.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Capacitance per phase from Xc', 'C = 1 / (2π × f × Xc)'], ['Surge impedance', 'Z = √(L / C)'], ['Peak phase voltage', 'Vpk = √2 × VL / √3'], ['Peak inrush current', 'Ipeak = Vpk / Z = Vpk × √(C / L)'], ['Frequency of the inrush', 'fi = 1 / (2π × √(L × C))']]) +
        '<p class=\"note\">L is the inductance in the circuit between the source and the capacitor in henries (the cable, the transformer and any series reactor), C the capacitance per phase in farads and Xc its reactance in ohms. The formulas are for a bank switched on when the voltage is at its peak and with no charge on it, which is the worst case, and the resistance of the circuit is ignored, so the real peak is lower. A bank switched next to a bank that is already live (back-to-back) sees a higher current at a higher frequency, because the inductance between the banks is small. The inductance used here is an example, so use the real value for your circuit.</p>' +
        '<h2>Worked example: a 50 kVAR bank at 400 V</h2><p>Xc = 3.2 Ω per phase and 10 µH of circuit inductance.</p>' +
        steps(['C = 1 / (2π × 50 × 3.2) = ' + g4(C * 1e6) + ' µF', 'Z = √(10e-6 / C) = ' + g4(Z) + ' Ω', 'Vpk = √2 × 400 / √3 = ' + g4(Vpk) + ' V', 'Ipeak = ' + g4(Vpk) + ' / ' + g4(Z) + ' = ' + g4(Ip) + ' A', 'fi = 1 / (2π × √(10e-6 × C)) = ' + g4(fi) + ' Hz']) +
        '<h2>Peak inrush for different inductance (same bank)</h2>' + table(['Circuit inductance', 'Peak current', 'Frequency'], rows),
      faq: [
        ['Why is the inrush so large?', 'An uncharged capacitor is a short circuit at the instant of switching, so only the inductance of the circuit limits the current, and it rises very quickly.'],
        ['What reduces the inrush?', 'A series reactor, a pre-insertion resistor, or a contactor made for capacitor duty. A detuning reactor also limits it.'],
        ['Does the inrush matter for the contactor?', 'Yes. The contacts must be rated for the peak current and the frequency, and a standard contactor can weld, so use one made for capacitors.'],
        ['What if the bank has several steps?', 'Switching a step next to steps that are already on gives the highest current, because the inductance between the banks is small.']],
      related: [['capacitor-formulas.html', 'Capacitor Formulas'], ['detuning-reactor-formulas.html', 'Detuning Reactor Formulas'], ['power-factor-formulas.html', 'Power Factor Formulas'], ['../calculators/power-systems/', 'Power systems calculators']]
    });
    A[A.length - 1].check = { C, Z, Ip, fi };
  }

  /* ---------- 81. cable charging current ---------- */
  {
    const V = 11000, c = 0.3, len = 20, f = 50, Ct = c * len * 1e-6, Ic = 2 * Math.PI * f * Ct * V / R3, Q = 2 * Math.PI * f * Ct * V * V;
    const rows = [5, 10, 20, 50].map((k) => [k + ' km', g4(2 * Math.PI * f * c * k * 1e-6 * V / R3) + ' A']);
    A.push({
      slug: 'cable-charging-current-formulas', h1: 'Cable Charging Current Formulas',
      desc: 'Cable charging current formulas: the capacitance of a length of cable, the charging current per phase and the reactive power the cable produces.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Total capacitance', 'C = c × L'], ['Charging current per phase', 'Ic = 2π × f × C × VL / √3'], ['Reactive power produced', 'Q = 2π × f × C × VL²']]) +
        '<p class=\"note\">c is the capacitance per kilometre from the cable data sheet, L the length in kilometres, f the frequency in hertz and VL the line-to-line voltage in volts. C is in farads and Q in VAR for a three-phase circuit. The cable produces reactive power that the supply does not need to give, and on a long cable with a light load this can raise the voltage at the far end. The capacitance of 0.3 µF/km is an example for a medium-voltage cable, so use the data sheet. The current is that of a cable with no load, and it adds to the load current in the supply end of the cable.</p>' +
        '<h2>Worked example: 20 km of 11 kV cable</h2><p>c = 0.3 µF/km at 50 Hz.</p>' +
        steps(['C = 0.3 × 20 = ' + g4(c * len) + ' µF', 'Ic = 2π × 50 × ' + g4(c * len) + 'e-6 × (11,000 / √3) = ' + g4(Ic) + ' A', 'Q = 2π × 50 × ' + g4(c * len) + 'e-6 × 11,000² = ' + g4(Q / 1000) + ' kVAR']) +
        '<h2>Charging current by length (0.3 µF/km, 11 kV)</h2>' + table(['Length', 'Charging current per phase'], rows),
      faq: [
        ['What is the charging current?', 'The current that flows into the capacitance between the conductors and the screen or earth. It flows even when the cable carries no load.'],
        ['Why does it matter for long cables?', 'It grows with the length and the voltage. On a long lightly loaded cable it can reach a large part of the cable rating and it raises the voltage at the end.'],
        ['Does it matter for low-voltage cables?', 'Rarely. The charging current falls with the square of the voltage for a given power, so it is small on low-voltage cables.'],
        ['How is the voltage rise controlled?', 'By a shunt reactor, which takes the reactive power that the cable makes. It is used on long high-voltage and medium-voltage cables.']],
      related: [['transmission-line-formulas.html', 'Transmission Line Formulas'], ['capacitor-formulas.html', 'Capacitor Formulas'], ['cable-loss-formulas.html', 'Cable Loss Formulas'], ['../calculators/cable-engineering/', 'Cable engineering calculators']]
    });
    A[A.length - 1].check = { Ct, Ic, Q };
  }

  /* ---------- 82. solar DC to AC ratio ---------- */
  {
    const Pdc = 24 * 550 / 1000, Pac = 10, r = Pdc / Pac, tgt = 1.25, Pi = Pdc / tgt;
    const rows = [8, 10, 12, 15].map((p) => [p + ' kW', g4(Pdc / p)]);
    A.push({
      slug: 'solar-dc-ac-ratio-formulas', h1: 'Solar DC to AC Ratio Formulas',
      desc: 'Solar DC to AC ratio formulas: the array size, the ratio of array power to inverter power and the inverter size for a target ratio.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Array power (kWp)', 'Pdc = number of modules × module watts / 1000'], ['DC to AC ratio', 'r = Pdc / Pac'], ['Inverter size for a target ratio', 'Pac = Pdc / r']]) +
        '<p class=\"note\">Pdc is the array rating at standard test conditions in kWp and Pac the AC rating of the inverter in kW. The array seldom reaches its rated power because of the heat, the sun angle and the losses, so an inverter smaller than the array is common, with a ratio of about 1.1 to 1.4 in many designs. A larger ratio gives more energy in the morning and evening and clips the power at noon in clear weather. The best ratio depends on the site, the tilt, the tariff and the inverter price, so the figures here are examples. Check the maximum DC input voltage and current of the inverter as well.</p>' +
        '<h2>Worked example: 24 modules of 550 W on a 10 kW inverter</h2>' +
        steps(['Pdc = 24 × 550 / 1000 = ' + g4(Pdc) + ' kWp', 'r = ' + g4(Pdc) + ' / 10 = ' + g4(r), 'For a ratio of 1.25 the inverter is ' + g4(Pdc) + ' / 1.25 = ' + g4(Pi) + ' kW']) +
        '<h2>Ratio for a 13.2 kWp array</h2>' + table(['Inverter', 'DC to AC ratio'], rows),
      faq: [
        ['Is a ratio above 1 allowed?', 'Yes, if the inverter data sheet allows it. The inverter limits its output to its rating and the extra array power is clipped at the peak of the day.'],
        ['What does clipping cost?', 'On most sites a small part of the yearly energy at a ratio near 1.2. It rises with the ratio, so use a simulation for the site.'],
        ['Does the temperature change the ratio?', 'A hot module gives less than its rating, so the real ratio at noon is below the figure. The solar panel temperature article shows the loss.'],
        ['What else limits the array size?', 'The maximum DC voltage (from the cold string voltage) and the maximum current per input of the inverter.']],
      related: [['solar-pv-formulas.html', 'Solar PV Formulas'], ['solar-panel-temperature-formulas.html', 'Solar Panel Temperature Formulas'], ['battery-formulas.html', 'Battery Formulas'], ['../calculators/solar-pv-sizing/', 'Solar PV sizing calculators']]
    });
    A[A.length - 1].check = { Pdc, r, Pi };
  }

  /* ---------- 83. measurement uncertainty ---------- */
  {
    const u1 = 0.5, u2 = 0.3, u3 = 0.2, u = Math.sqrt(u1 * u1 + u2 * u2 + u3 * u3), U = 2 * u, ur = 0.5 / R3;
    const rows = [[1, '68%'], [2, '95%'], [3, '99.7%']].map((k) => ['k = ' + k[0], g4(k[0] * u), k[1]]);
    A.push({
      slug: 'measurement-uncertainty-formulas', h1: 'Measurement Uncertainty Formulas',
      desc: 'Measurement uncertainty formulas: the standard uncertainty of a rectangular limit, the combined uncertainty of independent sources and the expanded uncertainty.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Standard uncertainty from a limit ±a (rectangular)', 'u = a / √3'], ['Combined standard uncertainty', 'uc = √(u1² + u2² + u3² + ...)'], ['Expanded uncertainty', 'U = k × uc']]) +
        '<p class=\"note\">The sources must be independent and in the same unit. A tolerance on a data sheet, such as ±a, is treated as a rectangular distribution, which is why it is divided by √3. The coverage factor k = 2 gives about 95% coverage for a normal distribution. This is the simple root-sum-square method; a sensitivity coefficient is needed when a source does not enter the result one for one. The values here are examples.</p>' +
        '<h2>Worked example: three independent sources</h2><p>Standard uncertainties of 0.5, 0.3 and 0.2 (all in the same unit).</p>' +
        steps(['uc = √(0.5² + 0.3² + 0.2²) = ' + g4(u), 'U = 2 × ' + g4(u) + ' = ' + g4(U)]) +
        '<h2>Worked example: a tolerance of ±0.5</h2>' + steps(['u = 0.5 / √3 = ' + g4(ur)]) +
        '<h2>Expanded uncertainty for the first example</h2>' + table(['Coverage factor', 'Expanded uncertainty', 'Approximate coverage (normal)'], rows),
      faq: [
        ['Why is the tolerance divided by √3?', 'A data sheet limit means the error can be anywhere in the band with equal chance. The standard deviation of that flat distribution is the half-width divided by √3.'],
        ['Why add the squares and not the values?', 'Independent errors seldom all hit their maximum together, so they combine as the root of the sum of squares and the total is less than the plain sum.'],
        ['What is the coverage factor?', 'A multiplier that turns the standard uncertainty into a range that holds the true value with a stated chance. k = 2 is about 95% for a normal distribution.'],
        ['Is this enough for a calibration certificate?', 'It is the method in outline. A formal budget follows a guide such as the GUM and adds the sensitivity coefficients, the type A terms and the degrees of freedom.']],
      related: [['adc-resolution-formulas.html', 'ADC Resolution Formulas'], ['pt100-rtd-formulas.html', 'Pt100 RTD Formulas'], ['loop-4-20ma-formulas.html', '4-20 mA Loop Formulas'], ['../calculators/electronics-and-instrumentation/', 'Electronics and instrumentation calculators']]
    });
    A[A.length - 1].check = { u, U, ur };
  }

  /* ---------- 84. parallel transformer load sharing ---------- */
  {
    const S1 = 1000, z1 = 5, S2 = 630, z2 = 4.5, Ld = 1400, den = S1 / z1 + S2 / z2, L1 = Ld * (S1 / z1) / den, L2 = Ld * (S2 / z2) / den, Lmax = S1 * z2 / z1 + S2;
    A.push({
      slug: 'parallel-transformer-formulas', h1: 'Parallel Transformer Load Sharing Formulas',
      desc: 'Parallel transformer formulas: how a load divides by rating and impedance, the loading of each unit and the largest load before one transformer is full.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Load carried by transformer i', 'Si = Sload × (Sn,i / z,i) / Σ(Sn / z)'], ['Loading of transformer i', 'Si / Sn,i'], ['Largest total load', 'Smax = Σ Sn,j × (z,min / z,j)']]) +
        '<p class=\"note\">Sn is the rating in kVA and z the impedance in percent on its own rating. The unit with the lower impedance takes more than its share and is the first to reach 100%. The formula assumes that the transformers have the same voltage ratio, the same vector group and a similar X/R ratio, and it is a simple estimate of the division. In the largest load formula z,min is the lowest impedance, and the other units are then below their rating. Transformers with very different ratings (more than about 3 to 1) are not usually paralleled.</p>' +
        '<h2>Worked example: 1,000 kVA at 5% with 630 kVA at 4.5%</h2><p>A total load of 1,400 kVA.</p>' +
        steps(['Σ(Sn / z) = 1000 / 5 + 630 / 4.5 = ' + g4(den), 'S1 = 1400 × (1000 / 5) / ' + g4(den) + ' = ' + g4(L1) + ' kVA, which is ' + g4(L1 / S1 * 100) + '% of its rating', 'S2 = 1400 × (630 / 4.5) / ' + g4(den) + ' = ' + g4(L2) + ' kVA, which is ' + g4(L2 / S2 * 100) + '% of its rating', 'Smax = 1000 × 4.5 / 5 + 630 = ' + g4(Lmax) + ' kVA, against 1,630 kVA installed']),
      faq: [
        ['Why does the smaller transformer carry more of its rating?', 'It has the lower impedance, so it takes a larger share of the current. The share goes with the rating divided by the impedance.'],
        ['What must match for paralleling?', 'The voltage ratio, the vector group (the phase shift) and the phase sequence. The impedances should be close, and the ratings not too far apart.'],
        ['What if the impedances are equal?', 'Then the load divides in proportion to the ratings and every unit has the same loading.'],
        ['Does the formula include the cables?', 'No. The impedance of the cables to each unit changes the share, so add it to the transformer impedance when it is not small.']],
      related: [['transformer-formulas.html', 'Transformer Formulas'], ['transformer-efficiency-formulas.html', 'Transformer Efficiency Formulas'], ['short-circuit-formulas.html', 'Short-Circuit Formulas'], ['../calculators/transformer-engineering/', 'Transformer calculators']]
    });
    A[A.length - 1].check = { den, L1, L2, Lmax };
  }

  /* ---------- 85. Peukert ---------- */
  {
    const C = 100, H = 20, I = 20, k = 1.2, t = H * Math.pow(C / (I * H), k), Ah = I * t;
    const rows = [1.1, 1.2, 1.3].map((kk) => ['k = ' + kk, g4(H * Math.pow(C / (I * H), kk)) + ' h']);
    A.push({
      slug: 'peukert-formulas', h1: 'Peukert Law and Battery Runtime Formulas',
      desc: 'Peukert law formulas: the runtime of a battery at a given current, the capacity actually delivered and the effect of the Peukert exponent.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Runtime', 't = H × (C / (I × H))ᵏ'], ['Capacity delivered', 'Cd = I × t']]) +
        '<p class=\"note\">C is the rated capacity in ampere-hours at the rated discharge time H in hours (for example 100 Ah at 20 hours), I the discharge current in amperes and k the Peukert exponent, which is 1 for an ideal battery and larger for a real one (about 1.1 to 1.3 for many lead-acid batteries, and close to 1.05 for lithium). A higher current than the rated one gives a shorter runtime than C / I and less capacity. The exponent is from the data sheet or from two discharge tests and the value here is an example. The law ignores the temperature and the ageing, and it does not hold at very low currents.</p>' +
        '<h2>Worked example: 100 Ah at 20 hours, 20 A load</h2><p>k = 1.2. The rated current is 100 / 20 = 5 A.</p>' +
        steps(['I × H = 20 × 20 = ' + g4(I * H) + ' A·h and C / (I × H) = ' + g4(C / (I * H)), 't = 20 × ' + g4(C / (I * H)) + '^1.2 = ' + g4(t) + ' h', 'Capacity delivered = 20 × ' + g4(t) + ' = ' + g4(Ah) + ' Ah, against 100 Ah rated']) +
        '<h2>Runtime at 20 A for different exponents</h2>' + table(['Exponent', 'Runtime'], rows),
      faq: [
        ['Why does a battery give less at a high current?', 'The internal resistance and the slow chemistry mean that less of the active material can be used when the current is high.'],
        ['What is a typical exponent?', 'About 1.1 to 1.3 for lead-acid, and lower for lithium. Check the data sheet, because it differs between makes.'],
        ['Does the law work for every current?', 'No. It is an empirical fit between the rated current and a few times that value, and it is poor at very low or very high currents.'],
        ['How does this connect to the battery sizing?', 'The simple sizing divides the capacity by the current. Peukert shows that for high currents you need a larger battery or a larger discharge-rate capacity from the data sheet.']],
      related: [['battery-formulas.html', 'Battery Formulas'], ['battery-charge-time-formulas.html', 'Battery Charge Time Formulas'], ['battery-internal-resistance-formulas.html', 'Battery Internal Resistance Formulas'], ['../calculators/battery-bank-sizing/', 'Battery bank calculators']]
    });
    A[A.length - 1].check = { t, Ah };
  }


  /* ---------- 86. capacitor discharge time ---------- */
  {
    const C = 500e-6, Rd = 1e5, V0 = 400, V1 = 50, tau = C * Rd, t = tau * Math.log(V0 / V1), E = 0.5 * C * V0 * V0, P0 = V0 * V0 / Rd, V60 = V0 * Math.exp(-60 / tau);
    const rows = [200, 100, 50, 25].map((v) => [v + ' V', g4(tau * Math.log(V0 / v)) + ' s']);
    A.push({
      slug: 'capacitor-discharge-formulas', h1: 'Capacitor Discharge Time Formulas',
      desc: 'Capacitor discharge formulas: the time constant of a discharge resistor, the voltage after a time, the time to fall to a safe voltage and the stored energy.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Time constant', 'τ = R × C'], ['Voltage after time t', 'V(t) = V0 × e^(−t / τ)'], ['Time to fall to V1', 't = τ × ln(V0 / V1)'], ['Stored energy', 'E = ½ × C × V0²'], ['Starting power in the resistor', 'P = V0² / R']]) +
        '<p class=\"note\">R is the discharge resistance in ohms, C the capacitance in farads and V0 the starting voltage in volts. The discharge is exponential, so it never reaches zero in theory, and the time to a safe voltage depends on the starting voltage and the limit. The voltage that is safe and the time allowed come from the standard or the equipment rules you work to, so use your own. The values here are examples. A capacitor bank can also hold a charge in the dielectric after a short discharge, so follow the maker\'s rules for shorting it.</p>' +
        '<h2>Worked example: 500 µF with a 100 kΩ discharge resistor from 400 V</h2>' +
        steps(['τ = 100,000 × 500e-6 = ' + g4(tau) + ' s', 'Time to fall to 50 V: t = ' + g4(tau) + ' × ln(400 / 50) = ' + g4(t) + ' s', 'Voltage after 60 s: 400 × e^(−60 / ' + g4(tau) + ') = ' + g4(V60) + ' V', 'E = ½ × 500e-6 × 400² = ' + g4(E) + ' J and the starting power is 400² / 100,000 = ' + g4(P0) + ' W']) +
        '<h2>Time to fall from 400 V (same circuit)</h2>' + table(['Voltage', 'Time'], rows),
      faq: [
        ['Why does the discharge never finish?', 'The current falls with the voltage, so the voltage falls by the same fraction in each time constant. It becomes small but never exactly zero.'],
        ['How many time constants to fall to a safe voltage?', 'It depends on the ratio of the start to the limit. A fall to 1/8 of the starting voltage takes ln(8) = 2.08 time constants.'],
        ['How is the discharge resistor chosen?', 'A smaller resistor discharges faster but loses more power when the capacitor is live. Pick the value that meets the time in your standard with a power loss you can accept.'],
        ['Does the resistor have to survive the discharge?', 'Yes. It must handle the starting power and the stored energy, which this page gives.']],
      related: [['capacitor-formulas.html', 'Capacitor Formulas'], ['detuning-reactor-formulas.html', 'Detuning Reactor Formulas'], ['rc-filter-formulas.html', 'RC Filter Formulas'], ['../calculators/electrical-fundamentals/', 'Electrical fundamentals calculators']]
    });
    A[A.length - 1].check = { tau, t, V60, E, P0 };
  }

  /* ---------- 87. hydraulic power ---------- */
  {
    const Q = 60, p = 200, eta = 0.85, Ph = Q * p / 600, Pm = Ph / eta, D = 100, Ar = Math.PI / 4 * D * D, F = 100 * 0.1 * Ar / 1000;
    const rows = [50, 100, 150, 200].map((b) => [b + ' bar', g4(Q * b / 600) + ' kW']);
    A.push({
      slug: 'hydraulic-power-formulas', h1: 'Hydraulic Power and Cylinder Force Formulas',
      desc: 'Hydraulic formulas: the power from the flow and pressure, the motor power with the efficiency and the force of a cylinder from the pressure and the bore.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Hydraulic power (kW)', 'P = Q × p / 600, with Q in L/min and p in bar'], ['Motor power', 'Pm = P / η'], ['Cylinder area', 'A = π / 4 × D²'], ['Cylinder force (N)', 'F = p × A, with p in N/mm² (1 bar = 0.1 N/mm²) and A in mm²']]) +
        '<p class=\"note\">Q is the flow in litres per minute, p the pressure in bar, η the overall efficiency of the pump and drive as a fraction, and D the piston bore in millimetres. The factor 600 comes from the units: 1 L/min at 1 bar is 1/600 kW. The force is for the push stroke on the full piston area, and the pull stroke has a smaller area because of the rod. The efficiency of 0.85 and the other values are examples, so use the data sheets. The formulas ignore the friction of the seals and the pressure drop in the pipes.</p>' +
        '<h2>Worked example: 60 L/min at 200 bar</h2>' +
        steps(['P = 60 × 200 / 600 = ' + g4(Ph) + ' kW', 'Pm = ' + g4(Ph) + ' / 0.85 = ' + g4(Pm) + ' kW']) +
        '<h2>Worked example: a 100 mm bore at 100 bar</h2>' +
        steps(['A = π / 4 × 100² = ' + g4(Ar) + ' mm²', 'F = 10 N/mm² × ' + g4(Ar) + ' = ' + g4(F) + ' kN']) +
        '<h2>Hydraulic power at 60 L/min</h2>' + table(['Pressure', 'Hydraulic power'], rows),
      faq: [
        ['Where does the 600 come from?', 'One litre per minute is 1/60,000 m³/s and one bar is 100,000 Pa, so the product is 1.667 W, which is 1/600 kW.'],
        ['Is the motor power the same as the hydraulic power?', 'No. The pump and the drive lose some power, so the motor must be larger by the efficiency.'],
        ['Why is the pull force smaller than the push force?', 'The rod takes part of the area on the rod side of the piston, so the pressure acts on a smaller area.'],
        ['Does the speed of the cylinder come from this?', 'The speed is the flow divided by the piston area, so a larger flow gives a faster stroke at the same force.']],
      related: [['pump-formulas.html', 'Pump Formulas'], ['motor-formulas.html', 'Induction Motor Formulas'], ['gear-drive-formulas.html', 'Gear and Belt Drive Formulas'], ['../calculators/motor-engineering/', 'Motor engineering calculators']]
    });
    A[A.length - 1].check = { Ph, Pm, Ar, F };
  }

  /* ---------- 88. thermocouple ---------- */
  {
    const S = 41, Vm = 2.05, Tr = 25, T = Vm * 1000 / S + Tr, V2 = (150 - 20) * S / 1000;
    const rows = [50, 100, 200, 400].map((d) => [d + ' K', g4(d * S / 1000) + ' mV']);
    A.push({
      slug: 'thermocouple-formulas', h1: 'Thermocouple Voltage Formulas',
      desc: 'Thermocouple formulas: the voltage from the temperature difference, the reference junction compensation and the temperature from a measured voltage.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Voltage from the difference', 'V = S × (Thot − Tref)'], ['Temperature from a reading', 'Thot = V / S + Tref']]) +
        '<p class=\"note\">S is the Seebeck coefficient in µV per °C, Thot the temperature at the measuring junction and Tref the temperature at the reference (cold) junction, where the thermocouple wire meets the copper of the instrument. A thermocouple measures the difference, so the reference temperature must be measured and added, which is the cold junction compensation. The straight-line model with S = 41 µV/°C is a rough fit for a type K over a limited range. The real response is not a straight line, so a real instrument uses the standard tables or polynomials for the type (IEC 60584), and this page is only an estimate.</p>' +
        '<h2>Worked example: a reading of 2.05 mV with the reference at 25 °C</h2>' +
        steps(['Thot = 2.05 × 1000 / 41 + 25 = ' + g4(T) + ' °C']) +
        '<h2>Worked example: the voltage at 150 °C with the reference at 20 °C</h2>' +
        steps(['V = 41 × (150 − 20) / 1000 = ' + g4(V2) + ' mV']) +
        '<h2>Approximate voltage by temperature difference (S = 41 µV/°C)</h2>' + table(['Difference', 'Voltage'], rows),
      faq: [
        ['Why is a reference junction needed?', 'The voltage depends on the difference between the two junctions. Without the reference temperature the absolute temperature at the tip is unknown.'],
        ['Can I use ordinary copper wire?', 'Not for the whole run. Use thermocouple wire or compensating cable of the same type up to the instrument, because a different metal adds a junction of its own.'],
        ['Is the straight-line model accurate?', 'Only over a narrow range. Use the standard tables or the instrument\'s linearisation over a wide range.'],
        ['How small is the signal?', 'A few tens of microvolts per degree, so the amplifier needs a low offset and the wiring needs shielding.']],
      related: [['pt100-rtd-formulas.html', 'Pt100 RTD Formulas'], ['thermistor-formulas.html', 'NTC Thermistor Formulas'], ['adc-resolution-formulas.html', 'ADC Resolution Formulas'], ['../calculators/electronics-and-instrumentation/', 'Electronics and instrumentation calculators']]
    });
    A[A.length - 1].check = { T, V2 };
  }

  /* ---------- 89. transformer vector groups ---------- */
  {
    const VH = 11000, VL = 415, S = 1000, Vpl = VL / R3, N = VH / Vpl, Nl = VH / VL, I2 = S * 1000 / (R3 * VL), I1 = S * 1000 / (R3 * VH), Id = I1 / R3;
    const rows = [['Dyn1', '30° lagging'], ['Dyn5', '150° lagging'], ['Dyn11', '330° lagging (30° leading)'], ['Yd1', '30° lagging'], ['Yy0', '0°']];
    A.push({
      slug: 'transformer-vector-group-formulas', h1: 'Transformer Vector Group Formulas',
      desc: 'Transformer vector group formulas: the turns ratio of a delta-star unit, the line and phase currents on each side and the phase shift from the clock number.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Line voltage ratio', 'a = VH / VL'], ['Turns ratio, delta primary and star secondary', 'N1 / N2 = VH / (VL / √3) = √3 × a'], ['Line current on a side', 'I = S × 1000 / (√3 × V)'], ['Delta winding phase current', 'Iph = Iline / √3'], ['Phase shift from the clock number n', 'angle = n × 30° (low voltage lags high voltage)']]) +
        '<p class=\"note\">VH and VL are the line voltages of the high and low side in volts and S the rating in kVA. In a delta winding the phase voltage is the line voltage and the phase current is the line current divided by √3. In a star winding the phase voltage is the line voltage divided by √3 and the phase current is the line current. The letters give the connection (capital for the high-voltage side, small for the low side, D delta, Y star, n for a neutral), and the number is the clock position of the low-voltage phasor when the high-voltage phasor is at twelve. Transformers can only be paralleled when they have the same group.</p>' +
        '<h2>Worked example: a 1,000 kVA, 11 kV delta / 415 V star unit</h2>' +
        steps(['Line ratio = 11,000 / 415 = ' + g4(Nl), 'LV phase voltage = 415 / √3 = ' + g4(Vpl) + ' V, so the turns ratio is 11,000 / ' + g4(Vpl) + ' = ' + g4(N), 'LV line current = 1000 × 1000 / (√3 × 415) = ' + g4(I2) + ' A', 'HV line current = 1000 × 1000 / (√3 × 11,000) = ' + g4(I1) + ' A and the delta phase current is ' + g4(I1) + ' / √3 = ' + g4(Id) + ' A']) +
        '<h2>Common vector groups</h2>' + table(['Group', 'Phase shift of the low-voltage side'], rows),
      faq: [
        ['Why is Dyn11 common in distribution?', 'The delta winding traps the third harmonic and zero-sequence current of an unbalanced load, and the star side gives a neutral for single-phase loads.'],
        ['What does the number in the group mean?', 'It is the clock position of the low-voltage phasor against the high-voltage phasor at twelve, and each hour is 30°.'],
        ['Can I parallel a Dyn11 with a Dyn1?', 'No. The 60° difference in phase would drive a large circulating current.'],
        ['Is the turns ratio the same as the voltage ratio?', 'Not for a delta-star unit. The turns ratio is √3 times the line voltage ratio because the star winding has a phase voltage of VL / √3.']],
      related: [['transformer-formulas.html', 'Transformer Formulas'], ['parallel-transformer-formulas.html', 'Parallel Transformer Load Sharing Formulas'], ['three-phase-power-formulas.html', 'Three-Phase Power Formulas'], ['../calculators/transformer-engineering/', 'Transformer calculators']]
    });
    A[A.length - 1].check = { Nl, N, I2, I1, Id };
  }

  /* ---------- 90. hold-up time ---------- */
  {
    const C = 470e-6, V1 = 380, V2 = 300, P = 500, t = C * (V1 * V1 - V2 * V2) / (2 * P), E = 0.5 * C * (V1 * V1 - V2 * V2);
    const rows = [250, 500, 750, 1000].map((p) => [p + ' W', g4(C * (V1 * V1 - V2 * V2) / (2 * p) * 1000) + ' ms']);
    A.push({
      slug: 'holdup-time-formulas', h1: 'Power Supply Hold-Up Time Formulas',
      desc: 'Hold-up time formulas: the energy a bulk capacitor gives between two voltages, the time it can carry a load and the capacitance needed for a given time.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Usable energy', 'E = ½ × C × (V1² − V2²)'], ['Hold-up time', 't = E / P = C × (V1² − V2²) / (2 × P)'], ['Capacitance for a time', 'C = 2 × P × t / (V1² − V2²)']]) +
        '<p class=\"note\">C is the bulk capacitance in farads, V1 the voltage at the start of the outage, V2 the lowest voltage at which the converter still works, and P the power drawn from the capacitor in watts, which is the output power divided by the converter efficiency. The load is taken as constant power, which is the case for a switching converter. The values are examples. The capacitance falls with age and cold, so allow a margin.</p>' +
        '<h2>Worked example: 470 µF, from 380 V to 300 V, at 500 W</h2>' +
        steps(['E = ½ × 470e-6 × (380² − 300²) = ' + g4(E) + ' J', 't = ' + g4(E) + ' / 500 = ' + g4(t * 1000) + ' ms']) +
        '<h2>Hold-up time by load (same capacitor)</h2>' + table(['Load', 'Hold-up time'], rows),
      faq: [
        ['Why use a constant-power load?', 'A switching converter draws more current as the voltage falls, to keep its output power, so the capacitor energy is used at a constant rate.'],
        ['What sets the lowest voltage?', 'The converter data sheet, which gives the lowest input at which the output stays in regulation.'],
        ['Does a bigger capacitor always help?', 'It gives more time, but it also increases the inrush current at start and the size, so the design is a compromise.'],
        ['Should I allow for ageing?', 'Yes. An electrolytic capacitor loses capacitance over its life and when it is cold, so size it with a margin.']],
      related: [['capacitor-formulas.html', 'Capacitor Formulas'], ['rectifier-ripple-formulas.html', 'Rectifier Ripple Formulas'], ['ups-formulas.html', 'UPS Formulas'], ['../calculators/electronics-and-instrumentation/', 'Electronics and instrumentation calculators']]
    });
    A[A.length - 1].check = { t, E };
  }

  /* ---------- 91. hoist power ---------- */
  {
    const m = 2000, g = 9.81, v = 0.5, eta = 0.8, h = 15, P = m * g * v / eta, Ej = m * g * h, tl = h / v, Ek = Ej / 3.6e6 / eta;
    const rows = [0.25, 0.5, 1, 2].map((s) => [s + ' m/s', g4(m * g * s / eta / 1000) + ' kW']);
    A.push({
      slug: 'hoist-power-formulas', h1: 'Hoist and Lift Power Formulas',
      desc: 'Hoist formulas: the motor power to raise a load at a speed, the energy to lift it a height and the lifting time, with the drive efficiency.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Motor power (kW)', 'P = m × g × v / (η × 1000)'], ['Energy to lift (J)', 'E = m × g × h'], ['Electrical energy (kWh)', 'E / (3.6e6 × η)'], ['Lifting time', 't = h / v']]) +
        '<p class=\"note\">m is the mass in kilograms (the load and any part of the car or hook that is not balanced), g = 9.81 m/s², v the lifting speed in m/s, h the height in metres and η the efficiency of the gear, rope and motor as a fraction. A counterweight reduces the net mass. The power during acceleration is higher by the force needed to accelerate the mass, which this page does not include. The efficiency of 0.8 and the other values are examples. A hoist is also rated for duty and starts per hour, which this page does not cover.</p>' +
        '<h2>Worked example: 2,000 kg at 0.5 m/s, efficiency 0.8</h2>' +
        steps(['P = 2000 × 9.81 × 0.5 / (0.8 × 1000) = ' + g4(P / 1000) + ' kW', 'Lifting 15 m takes 15 / 0.5 = ' + g4(tl) + ' s', 'E = 2000 × 9.81 × 15 = ' + g4(Ej / 1000) + ' kJ at the load, which is ' + g4(Ek) + ' kWh from the supply']) +
        '<h2>Motor power by speed (2,000 kg, η = 0.8)</h2>' + table(['Speed', 'Motor power'], rows),
      faq: [
        ['Why divide by the efficiency?', 'The gearbox, the ropes and the motor waste some power, so the motor must supply more than the power at the load.'],
        ['Does the motor take power when lowering?', 'A load being lowered gives energy back. A drive can return it to the supply or burn it in a braking resistor.'],
        ['Does this include the acceleration?', 'No. Extra power is needed to speed up the mass, and the motor must be checked for the peak.'],
        ['What does a counterweight do?', 'It balances part of the weight, so the motor lifts only the difference and the power is much lower.']],
      related: [['motor-formulas.html', 'Induction Motor Formulas'], ['gear-drive-formulas.html', 'Gear and Belt Drive Formulas'], ['motor-acceleration-time-formulas.html', 'Motor Acceleration Time Formulas'], ['../calculators/motor-engineering/', 'Motor engineering calculators']]
    });
    A[A.length - 1].check = { P, Ej, tl, Ek };
  }


  /* ---------- 92. compressor power ---------- */
  {
    const pa = 101325, Q = 0.1, r = 8, eta = 0.65, Pi = pa * Q * Math.log(r), Ps = Pi / eta, Vr = 0.5, tf = Vr * (r - 1) / Q;
    const rows = [4, 6, 8, 10].map((x) => [x + ' : 1', g4(pa * Q * Math.log(x) / 1000) + ' kW']);
    A.push({
      slug: 'compressor-power-formulas', h1: 'Compressor Power Formulas',
      desc: 'Air compressor formulas: the isothermal power for a free air delivery and pressure ratio, the shaft power with the efficiency and the receiver fill time.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Isothermal power', 'Piso = p1 × Q × ln(r)'], ['Shaft power', 'Pshaft = Piso / ηiso'], ['Receiver fill time (from atmosphere)', 't = V × (r − 1) / Q']]) +
        '<p class=\"note\">p1 is the intake pressure in pascals (101,325 Pa for atmosphere), Q the free air delivery in m³/s at the intake condition, r the ratio of the absolute outlet pressure to the intake pressure, V the receiver volume in m³ and ηiso the isothermal efficiency (the isothermal power divided by the shaft power). The isothermal power is the least power that any compressor needs, so a real one needs more. The efficiency of 0.65 and the other values are examples, and the maker gives the real figures. The fill time ignores the flow that the plant draws while the receiver fills.</p>' +
        '<h2>Worked example: 0.1 m³/s of free air at a pressure ratio of 8</h2>' +
        steps(['Piso = 101,325 × 0.1 × ln 8 = ' + g4(Pi / 1000) + ' kW', 'Pshaft = ' + g4(Pi / 1000) + ' / 0.65 = ' + g4(Ps / 1000) + ' kW', 'A 0.5 m³ receiver fills in 0.5 × (8 − 1) / 0.1 = ' + g4(tf) + ' s']) +
        '<h2>Isothermal power for 0.1 m³/s</h2>' + table(['Pressure ratio', 'Isothermal power'], rows),
      faq: [
        ['What is free air delivery?', 'The volume of air taken in per unit time, measured at the intake condition. It is the figure that gives the flow of a compressor on its data sheet.'],
        ['Why is the isothermal power a minimum?', 'Compression at a constant temperature needs the least work. Real compressors heat the air, so they use more.'],
        ['Does the pressure in the formula mean gauge or absolute?', 'The ratio r uses absolute pressures. A gauge pressure of 7 bar is about 8 bar absolute, which is a ratio of about 8.'],
        ['Is the motor larger than the shaft power?', 'Yes. The motor needs a rating above the shaft power, and the drive losses add to it.']],
      related: [['fan-formulas.html', 'Fan Formulas'], ['pump-formulas.html', 'Pump Formulas'], ['hydraulic-power-formulas.html', 'Hydraulic Power Formulas'], ['../calculators/motor-engineering/', 'Motor engineering calculators']]
    });
    A[A.length - 1].check = { Pi, Ps, tf };
  }

  /* ---------- 93. rectifier bridge ---------- */
  {
    const Vr = 24, Vf = 0.7, Id = 5, Vpk = Vr * Math.SQRT2, Vi = 0.9 * Vr, Vd = Vi - 2 * Vf, Ia = Id / 2, Pd = 2 * Vf * Id, V3 = 1.35 * 400;
    const rows = [12, 24, 48, 110].map((v) => [v + ' V', g4(v * Math.SQRT2) + ' V', g4(0.9 * v) + ' V']);
    A.push({
      slug: 'rectifier-bridge-formulas', h1: 'Rectifier Bridge Sizing Formulas',
      desc: 'Bridge rectifier formulas: the DC voltage from the AC voltage, the peak reverse voltage, the diode current and the power lost in the diodes.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['DC voltage, single-phase bridge', 'Vdc = 0.9 × Vrms − 2 × Vf'], ['DC voltage, three-phase bridge', 'Vdc = 1.35 × VL'], ['Peak reverse voltage of each diode', 'PIV = √2 × Vrms'], ['Average current of each diode, single-phase', 'Id = Idc / 2'], ['Diode loss, single-phase', 'P = 2 × Vf × Idc']]) +
        '<p class=\"note\">Vrms is the RMS AC voltage in volts, Vf the forward drop of one diode, Idc the load current and VL the line voltage of a three-phase supply. The 0.9 is 2√2 / π, the average of the rectified wave, and 1.35 is 3√2 / π for a three-phase bridge with the line voltage. The figures are for a resistive load without a filter capacitor. With a capacitor the DC voltage is closer to the peak, and the peak current in the diodes is much higher than the average. Pick a diode with a reverse voltage rating well above the PIV (at least about 1.5 to 2 times) and a current rating that covers the surge. The values here are examples.</p>' +
        '<h2>Worked example: 24 V RMS at 5 A, silicon diodes</h2><p>Vf = 0.7 V.</p>' +
        steps(['Vpk = √2 × 24 = ' + g4(Vpk) + ' V, so each diode needs a PIV above ' + g4(Vpk) + ' V', 'Vdc = 0.9 × 24 − 2 × 0.7 = ' + g4(Vd) + ' V', 'Id = 5 / 2 = ' + g4(Ia) + ' A and the loss is 2 × 0.7 × 5 = ' + g4(Pd) + ' W']) +
        '<h2>Worked example: a three-phase bridge on 400 V</h2>' + steps(['Vdc = 1.35 × 400 = ' + g4(V3) + ' V']) +
        '<h2>Peak voltage and ideal DC voltage by AC voltage</h2>' + table(['AC voltage (RMS)', 'Peak', 'Ideal DC (0.9 × Vrms)'], rows),
      faq: [
        ['Why are two diode drops lost?', 'In a single-phase bridge the current flows through two diodes at a time, one on each side of the load.'],
        ['What changes with a smoothing capacitor?', 'The DC voltage rises toward the peak and the diodes carry short, large pulses, so choose them for the peak current and not only the average.'],
        ['What is the PIV?', 'The peak reverse voltage the diode must block. In a bridge it is the peak of the AC voltage, and a margin is added for surges.'],
        ['Does the diode need a heat sink?', 'It may. The loss is the forward drop times the current, so check the heat against the data sheet and the thermal resistance in the heat sink article.']],
      related: [['rectifier-ripple-formulas.html', 'Rectifier Ripple Formulas'], ['heat-sink-formulas.html', 'Heat Sink Formulas'], ['rms-waveform-formulas.html', 'RMS and Peak Values Formulas'], ['../calculators/electronics-and-instrumentation/', 'Electronics and instrumentation calculators']]
    });
    A[A.length - 1].check = { Vpk, Vd, Ia, Pd, V3 };
  }

  /* ---------- 94. PCB trace ---------- */
  {
    const w = 50, th = 1.378, dT = 10, k = 0.048, Am = w * th, I = k * Math.pow(dT, 0.44) * Math.pow(Am, 0.725), rho = 1.724e-8, L = 0.1, wm = 1e-3, tm = 35e-6, R = rho * L / (wm * tm), Ix = 2, Vd = Ix * R, Pt = Ix * Ix * R;
    const rows = [5, 10, 20, 30].map((d) => [d + ' °C', g4(k * Math.pow(d, 0.44) * Math.pow(Am, 0.725)) + ' A']);
    A.push({
      slug: 'pcb-trace-current-formulas', h1: 'PCB Trace Width and Current Formulas',
      desc: 'PCB trace formulas: the current an outer copper trace carries for a temperature rise, the trace resistance and the voltage drop and heat at a current.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Cross-section', 'A = width × thickness (in mil²: width in mil, thickness in mil)'], ['Current for a temperature rise (IPC-2221 fit)', 'I = k × ΔT^0.44 × A^0.725'], ['Trace resistance', 'R = ρ × L / (w × t)'], ['Voltage drop and heat', 'ΔV = I × R and P = I² × R']]) +
        '<p class=\"note\">k is 0.048 for an outer layer and 0.024 for an inner layer, ΔT the allowed temperature rise in °C and A the area in square mils (1 mil = 0.0254 mm, and 1 oz of copper is about 1.378 mil or 35 µm thick). The current formula is the empirical fit from the older IPC-2221 charts, and later work (IPC-2152) shows that the real value depends on the board, the planes and the air flow, so treat it as a first estimate. The resistance uses ρ = 1.724e-8 Ω·m for copper at 20 °C and rises when the trace is hot.</p>' +
        '<h2>Worked example: a 50 mil outer trace, 1 oz copper, 10 °C rise</h2>' +
        steps(['A = 50 × 1.378 = ' + g4(Am) + ' mil²', 'I = 0.048 × 10^0.44 × ' + g4(Am) + '^0.725 = ' + g4(I) + ' A']) +
        '<h2>Worked example: a 100 mm long, 1 mm wide, 35 µm thick trace at 2 A</h2>' +
        steps(['R = 1.724e-8 × 0.1 / (0.001 × 35e-6) = ' + g4(R) + ' Ω', 'ΔV = 2 × ' + g4(R) + ' = ' + g4(Vd) + ' V and P = 2² × ' + g4(R) + ' = ' + g4(Pt) + ' W']) +
        '<h2>Current for the 50 mil trace by temperature rise (outer layer)</h2>' + table(['Temperature rise', 'Current'], rows),
      faq: [
        ['Why is an inner trace rated lower?', 'It cannot lose heat to the air on its own, so for the same rise it carries less current than an outer trace.'],
        ['Is the formula accurate?', 'It is a rough fit to old charts. Real boards differ with the copper planes, the vias and the air flow, so keep a margin and check with the board maker.'],
        ['Does a wider trace always help?', 'It lowers the resistance and the heat, and it carries more current for the same rise. It must also fit the layout and the clearance rules for the voltage.'],
        ['What about short, high current pulses?', 'A short pulse heats the trace less than a steady current. Use the fusing current article to see when a trace can melt.']],
      related: [['fusing-current-formulas.html', 'Fusing Current Formulas'], ['conductor-resistance-formulas.html', 'Conductor Resistance Formulas'], ['heat-sink-formulas.html', 'Heat Sink Formulas'], ['../calculators/electronics-and-instrumentation/', 'Electronics and instrumentation calculators']]
    });
    A[A.length - 1].check = { Am, I, R, Vd, Pt };
  }

  /* ---------- 95. heat pump COP ---------- */
  {
    const Th = 35 + 273.15, Tc = 5 + 273.15, COPc = Th / (Th - Tc), COP = 3.5, frac = COP / COPc * 100, Qh = 12, W = Qh / COP, Qc = Qh - W;
    const rows = [2.5, 3, 3.5, 4].map((c) => [String(c), g4(Qh / c) + ' kW', g4(Qh - Qh / c) + ' kW']);
    A.push({
      slug: 'heat-pump-cop-formulas', h1: 'Heat Pump COP Formulas',
      desc: 'Heat pump formulas: the coefficient of performance, the electrical power for a heating load, the heat taken from the source and the Carnot limit.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Coefficient of performance', 'COP = Qh / W'], ['Electrical power', 'W = Qh / COP'], ['Heat taken from the source', 'Qc = Qh − W'], ['Carnot limit', 'COPmax = Th / (Th − Tc), temperatures in kelvin']]) +
        '<p class=\"note\">Qh is the heat given to the building, W the electrical power taken by the compressor and drive (both in kW), Th the temperature of the heat delivered and Tc the temperature of the source in kelvin (add 273.15 to °C). A heat pump gives several kW of heat for 1 kW of electricity because it moves heat from the source, and the COP falls as the temperature lift grows. The COP in the example is an illustration, and the maker gives it for each pair of temperatures. The seasonal figure is lower than the figure at one point because of defrosting and the pump and fan power.</p>' +
        '<h2>Worked example: 12 kW of heating at a COP of 3.5</h2>' +
        steps(['W = 12 / 3.5 = ' + g4(W) + ' kW', 'Qc = 12 − ' + g4(W) + ' = ' + g4(Qc) + ' kW taken from the air or ground']) +
        '<h2>Worked example: the Carnot limit for 35 °C delivery from a 5 °C source</h2>' +
        steps(['COPmax = 308.15 / (308.15 − 278.15) = ' + g4(COPc), 'A COP of 3.5 is ' + g4(frac) + '% of that limit']) +
        '<h2>Electrical power for 12 kW of heating</h2>' + table(['COP', 'Electrical power', 'Heat from the source'], rows),
      faq: [
        ['Why can the COP be more than 1?', 'The heat pump does not make the heat from electricity. It moves heat from a cooler place to a warmer one, and the electricity runs the process.'],
        ['What lowers the COP?', 'A larger difference between the source and the delivery temperature. A low-temperature heating system gives a better COP than radiators at a high water temperature.'],
        ['Is the Carnot value reachable?', 'No. It is an upper limit. Real machines reach a part of it, as the example shows.'],
        ['How does this affect the running cost?', 'The cost is the electrical power times the tariff. A COP of 3.5 uses about 29% of the electricity that resistance heating would use for the same heat.']],
      related: [['heating-formulas.html', 'Heating Formulas'], ['cooling-formulas.html', 'Cooling Formulas'], ['energy-cost-formulas.html', 'Energy and Cost Formulas'], ['../calculators/lighting-and-facilities/', 'Facilities calculators']]
    });
    A[A.length - 1].check = { COPc, frac, W, Qc };
  }

  /* ---------- 96. sound level ---------- */
  {
    const a = 10 * Math.log10(2 * Math.pow(10, 8)), b = 70 + 10 * Math.log10(3), c = 90 - 20 * Math.log10(8);
    const rows = [1, 2, 4, 8, 16].map((r) => [r + ' m', g4(90 - 20 * Math.log10(r)) + ' dB']);
    A.push({
      slug: 'sound-level-formulas', h1: 'Sound Level and dB Addition Formulas',
      desc: 'Sound level formulas: adding the levels of several sources in decibels and the fall in level with distance from a source in free field.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Sum of sound levels', 'L = 10 × log10(10^(L1 / 10) + 10^(L2 / 10) + ...)'], ['Sum of n equal sources', 'L = L1 + 10 × log10(n)'], ['Level at a new distance (free field, point source)', 'L2 = L1 − 20 × log10(r2 / r1)']]) +
        '<p class=\"note\">Levels are in decibels (dB) and the distances r in the same unit. Decibels are logarithmic, so the levels are added as energies and not as numbers: two equal sources add 3 dB, and ten add 10 dB. The distance formula is for a point source in the open, with no reflection, which is a fair estimate for a generator or transformer away from walls. A hard wall nearby, a room or a screen changes the result, and the limit for noise depends on the rules for the site, so use your own limit. The figures here are examples.</p>' +
        '<h2>Worked example: two sources of 80 dB</h2>' +
        steps(['L = 10 × log10(2 × 10⁸) = ' + g4(a) + ' dB']) +
        '<h2>Worked example: three sources of 70 dB</h2>' + steps(['L = 70 + 10 × log10(3) = ' + g4(b) + ' dB']) +
        '<h2>Worked example: 90 dB at 1 m, heard at 8 m</h2>' + steps(['L2 = 90 − 20 × log10(8) = ' + g4(c) + ' dB']) +
        '<h2>Level at distance for a source of 90 dB at 1 m</h2>' + table(['Distance', 'Level'], rows),
      faq: [
        ['Why do two equal sources add only 3 dB?', 'The sound energy doubles, and doubling the energy raises the level by 10 × log10(2) = 3 dB.'],
        ['What does doubling the distance do?', 'In free field the level falls by about 6 dB, because the sound spreads over a sphere whose area grows with the square of the distance.'],
        ['Can I add decibel values directly?', 'No. Convert them to energy, add and convert back, or use the equal-source shortcut.'],
        ['Does the formula work indoors?', 'Not well. Reflections from the walls keep the level higher than the free-field value, so use a room model or measure.']],
      related: [['transformer-formulas.html', 'Transformer Formulas'], ['generator-formulas.html', 'Generator Formulas'], ['fan-formulas.html', 'Fan Formulas'], ['../calculators/lighting-and-facilities/', 'Facilities calculators']]
    });
    A[A.length - 1].check = { a, b, c };
  }

  /* ---------- 97. duty cycle RMS ---------- */
  {
    const seg = [[100, 10], [20, 30], [0, 20]], T = 60, ms = seg.reduce((s, x) => s + x[0] * x[0] * x[1], 0) / T, Irms = Math.sqrt(ms), Iav = seg.reduce((s, x) => s + x[0] * x[1], 0) / T, duty = 40 / T * 100;
    A.push({
      slug: 'duty-cycle-rms-formulas', h1: 'Duty Cycle and RMS Load Formulas',
      desc: 'Duty cycle formulas: the RMS current of a load that changes with time, the average current and the duty factor, for a motor or a heater on a cycle.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['RMS (equivalent heating) current', 'Irms = √(Σ(Ii² × ti) / Σti)'], ['Average current', 'Iav = Σ(Ii × ti) / Σti'], ['Duty factor', 'D = time on / total cycle time']]) +
        '<p class=\"note\">Ii is the current in each part of the cycle and ti its duration (in any one unit). The heating in a motor or a cable goes with the square of the current, so the RMS value is the steady current that would give the same heat over the whole cycle. The RMS value is larger than the average value when the load varies. It should stay below the continuous rating of the motor or the cable, and the peak must still be within the overload and the torque limits. The cooling of a motor at rest is slower, which this page does not model. The cycle here is an example.</p>' +
        '<h2>Worked example: 100 A for 10 s, 20 A for 30 s, off for 20 s</h2><p>The cycle is 60 s.</p>' +
        steps(['Σ(I² × t) = 100² × 10 + 20² × 30 + 0 = ' + g4(seg.reduce((s, x) => s + x[0] * x[0] * x[1], 0)) + ', and divided by 60 it is ' + g4(ms), 'Irms = √' + g4(ms) + ' = ' + g4(Irms) + ' A', 'Iav = (100 × 10 + 20 × 30) / 60 = ' + g4(Iav) + ' A, and the duty factor is 40 / 60 = ' + g4(duty) + '%']),
      faq: [
        ['Why use the RMS value?', 'The heating goes with the current squared, so the RMS value gives the steady current with the same heating over the cycle.'],
        ['Why is the RMS value higher than the average?', 'Squaring gives more weight to the large currents, so a varying load has an RMS value above its average.'],
        ['Is the RMS check enough for a motor?', 'No. The motor must also handle the peak torque and the starts per hour, and its cooling at rest is poorer.'],
        ['Does this apply to cables?', 'It gives a first estimate for a short cycle. For a long cycle the cable follows the thermal time constant, so use the cable maker\'s data.']],
      related: [['rms-waveform-formulas.html', 'RMS and Peak Values Formulas'], ['motor-formulas.html', 'Induction Motor Formulas'], ['hoist-power-formulas.html', 'Hoist and Lift Power Formulas'], ['../calculators/motor-engineering/', 'Motor engineering calculators']]
    });
    A[A.length - 1].check = { ms, Irms, Iav, duty };
  }


  /* ---------- 98. supercapacitor energy ---------- */
  {
    const C = 100, V1 = 2.7, V2 = 1.35, P = 10, I = 5, esr = 0.01;
    const E = 0.5 * C * (V1 * V1 - V2 * V2), tP = E / P, tI = C * (V1 - V2) / I, dV = I * esr, Ploss = I * I * esr;
    const rows = [0, 0.9, 1.35, 1.8].map((v) => [v + ' V', g4(0.5 * C * (V1 * V1 - v * v)) + ' J', g4((1 - Math.pow(v / V1, 2)) * 100) + '%']);
    A.push({
      slug: 'supercapacitor-formulas', h1: 'Supercapacitor Energy Formulas',
      desc: 'Supercapacitor formulas: the usable energy between two voltages, the run time at constant power or constant current and the loss in the series resistance.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Usable energy between V1 and V2', 'E = ½ × C × (V1² − V2²)'], ['Time at constant power', 't = E / P'], ['Time at constant current', 't = C × (V1 − V2) / I'], ['Voltage step and loss in the ESR', 'ΔV = I × ESR and P = I² × ESR']]) +
        '<p class="note">C is the capacitance in farads, V1 the starting voltage, V2 the lowest voltage that the load accepts, P the load power in watts, I the load current in amperes and ESR the equivalent series resistance in ohms. A supercapacitor cannot give all its energy, because the voltage falls as it discharges and the load stops working below V2. The constant-power time uses the usable energy, so it ignores the ESR loss and the converter efficiency. The values are examples, and the data sheet gives the rated voltage, the ESR and the leakage.</p>' +
        '<h2>Worked example: a 100 F cell from 2.7 V to 1.35 V</h2>' +
        steps(['E = 0.5 × 100 × (2.7² − 1.35²) = ' + g4(E) + ' J', 'At a constant 10 W, t = ' + g4(E) + ' / 10 = ' + g4(tP) + ' s', 'At a constant 5 A, t = 100 × (2.7 − 1.35) / 5 = ' + g4(tI) + ' s', 'With an ESR of 10 mΩ, the voltage step is 5 × 0.01 = ' + g4(dV) + ' V and the loss is 5² × 0.01 = ' + g4(Ploss) + ' W']) +
        '<h2>Usable energy of the 100 F cell by lowest voltage</h2>' + table(['Lowest voltage', 'Usable energy', 'Share of the full energy'], rows),
      faq: [
        ['Why is only part of the energy usable?', 'The voltage of a capacitor falls in step with its charge. Below the lowest voltage the load works poorly or not at all, so the energy left in the cell stays there.'],
        ['What does discharging to half the voltage give?', 'It gives 75% of the stored energy, because the energy goes with the square of the voltage.'],
        ['Why do cells go in series?', 'One cell has a low rated voltage, often 2.7 V. A series string raises the voltage, and balancing keeps each cell within its rating. The capacitance of the string is the cell value divided by the number of cells.'],
        ['How does this differ from a battery?', 'A supercapacitor has a falling voltage and a low energy per kilogram, but it gives a high current and many cycles. See the battery pack article for the cell arithmetic of a battery.']],
      related: [['capacitor-formulas.html', 'Capacitor Formulas'], ['capacitor-discharge-formulas.html', 'Capacitor Discharge Time Formulas'], ['holdup-time-formulas.html', 'Power Supply Hold-Up Time Formulas'], ['../calculators/electronics-and-instrumentation/', 'Electronics and instrumentation calculators']]
    });
    A[A.length - 1].check = { E, tP, tI, dV, Ploss };
  }

  /* ---------- 99. step and touch voltage ---------- */
  {
    const rho = 100, rhos = 2500, hs = 0.1, ts = 0.5, Cs = 1 - 0.09 * (1 - rho / rhos) / (2 * hs + 0.09);
    const Et = (1000 + 1.5 * Cs * rhos) * 0.157 / Math.sqrt(ts), Es = (1000 + 6 * Cs * rhos) * 0.157 / Math.sqrt(ts);
    const Et0 = (1000 + 1.5 * rho) * 0.157 / Math.sqrt(ts), Es0 = (1000 + 6 * rho) * 0.157 / Math.sqrt(ts), Ig = 3000, Rg = 0.8, GPR = Ig * Rg;
    const rows = [0.2, 0.5, 1, 3].map((t) => [t + ' s', g4((1000 + 1.5 * Cs * rhos) * 0.157 / Math.sqrt(t)) + ' V', g4((1000 + 6 * Cs * rhos) * 0.157 / Math.sqrt(t)) + ' V']);
    A.push({
      slug: 'step-touch-voltage-formulas', h1: 'Step and Touch Voltage Formulas',
      desc: 'Substation earthing formulas: the tolerable touch and step voltage for a fault duration, the surface layer factor and the ground potential rise.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Surface layer factor', 'Cs = 1 − 0.09 × (1 − ρ / ρs) / (2 × hs + 0.09)'], ['Tolerable touch voltage, 70 kg body', 'Etouch = (1000 + 1.5 × Cs × ρs) × 0.157 / √ts'], ['Tolerable step voltage, 70 kg body', 'Estep = (1000 + 6 × Cs × ρs) × 0.157 / √ts'], ['Ground potential rise', 'GPR = Ig × Rg']]) +
        '<p class="note">ρ is the resistivity of the soil and ρs that of the surface layer, both in Ω·m, hs the thickness of the surface layer in metres, ts the duration of the shock (the fault clearing time) in seconds, Ig the earth fault current into the earth grid in amperes and Rg the grid resistance in ohms. The factors are those of IEEE Std 80 for a 70 kg body, and the same standard gives 0.116 in place of 0.157 for a 50 kg body. Without a surface layer, Cs = 1 and ρs = ρ. The page is an estimate for a first check. The standard and the local rules decide the design, and the actual step and touch voltages of a grid come from a grid analysis. All values here are examples.</p>' +
        '<h2>Worked example: soil of 100 Ω·m, 0.1 m of 2,500 Ω·m crushed rock, 0.5 s</h2>' +
        steps(['Cs = 1 − 0.09 × (1 − 100 / 2500) / (2 × 0.1 + 0.09) = ' + g4(Cs), 'Etouch = (1000 + 1.5 × ' + g4(Cs) + ' × 2500) × 0.157 / √0.5 = ' + g4(Et) + ' V', 'Estep = (1000 + 6 × ' + g4(Cs) + ' × 2500) × 0.157 / √0.5 = ' + g4(Es) + ' V']) +
        '<h2>Worked example: the same soil with no surface layer</h2>' +
        steps(['Etouch = (1000 + 1.5 × 100) × 0.157 / √0.5 = ' + g4(Et0) + ' V', 'Estep = (1000 + 6 × 100) × 0.157 / √0.5 = ' + g4(Es0) + ' V']) +
        '<h2>Worked example: ground potential rise</h2>' + steps(['GPR = 3000 × 0.8 = ' + g4(GPR) + ' V']) +
        '<h2>Tolerable voltages with the crushed rock layer, by fault duration</h2>' + table(['Duration', 'Touch voltage', 'Step voltage'], rows),
      faq: [
        ['Why does the limit fall as the fault lasts longer?', 'The body tolerates less energy from a long shock, so the limit goes with 1 / √ts. A fast protection trip allows a higher voltage.'],
        ['Why does a layer of crushed rock help?', 'It has a high resistivity, so it adds resistance between the foot and the earth and the current through the body falls. Cs is the factor that counts for it.'],
        ['What is the difference between step and touch voltage?', 'Touch voltage is between a hand on an earthed object and the feet. Step voltage is between the two feet, about one metre apart. The step limit is higher because the current does not pass through the chest.'],
        ['Is the ground potential rise a limit for people?', 'Not in itself. It is the voltage of the grid against remote earth, and it is compared with the touch limit to see whether the design needs a closer study.']],
      related: [['earthing-formulas.html', 'Earthing Formulas'], ['fault-loop-rcd-formulas.html', 'Earth Fault Loop and RCD Formulas'], ['short-circuit-formulas.html', 'Short-Circuit Formulas'], ['../calculators/earthing-and-grounding/', 'Earthing and grounding calculators']]
    });
    A[A.length - 1].check = { Cs, Et, Es, Et0, Es0, GPR };
  }

  /* ---------- 100. contactor sizing ---------- */
  {
    const P = 30, V = 415, eta = 0.92, pf = 0.86, k = 0.9, I = P * 1000 / (R3 * V * eta * pf), Ireq = I / k, sizes = [9, 12, 18, 25, 32, 40, 50, 65, 80, 95, 115, 150], pick = sizes.filter((s) => s >= Ireq)[0], Ist = 7 * I;
    const rows = [7.5, 15, 30, 55].map((p) => [p + ' kW', g4(p * 1000 / (R3 * V * eta * pf)) + ' A']);
    A.push({
      slug: 'contactor-sizing-formulas', h1: 'Contactor Sizing Formulas',
      desc: 'Motor contactor formulas: the full-load current of the motor, the AC-3 contactor rating with a margin and the starting current the contacts must make.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Motor full-load current', 'I = P × 1000 / (√3 × V × η × pf)'], ['Contactor AC-3 rating needed', 'Ie ≥ I / k'], ['Starting current to make', 'Ist = m × I']]) +
        '<p class="note">P is the shaft power in kW, V the line voltage, η the efficiency and pf the power factor of the motor at full load, k a derating factor for the ambient temperature, the altitude and the starts per hour (1 if the maker gives none), and m the ratio of the starting current to the full-load current, often 6 to 8 for a direct-on-line start. The AC-3 rating is the rated operational current of a contactor that starts squirrel-cage motors and breaks them while they run. Plugging and inching (AC-4) need a much larger contactor or a lower rating from the maker\'s table. Take the motor current from the nameplate when it is known. The list of sizes, 0.9, 7, the efficiency and the power factor here are examples, and each maker has its own series.</p>' +
        '<h2>Worked example: a 30 kW motor on 415 V</h2><p>Efficiency 0.92, power factor 0.86, derating 0.9.</p>' +
        steps(['I = 30,000 / (√3 × 415 × 0.92 × 0.86) = ' + g4(I) + ' A', 'Ie ≥ ' + g4(I) + ' / 0.9 = ' + g4(Ireq) + ' A, so the next size in the example list is ' + pick + ' A', 'Ist = 7 × ' + g4(I) + ' = ' + g4(Ist) + ' A']) +
        '<h2>Full-load current on 415 V (efficiency 0.92, power factor 0.86)</h2>' + table(['Motor power', 'Full-load current'], rows),
      faq: [
        ['What does AC-3 mean?', 'It is the utilisation category of the standard for starting squirrel-cage motors and switching them off while they run. The rating of a contactor depends on the category.'],
        ['Why add a margin?', 'High ambient temperature, many starts and the contact wear lower the usable rating, so the contactor is chosen above the motor current.'],
        ['Does the contactor protect the motor?', 'No. A contactor switches the load. The short-circuit protection and the overload relay are separate devices, and the contactor must be co-ordinated with them.'],
        ['What about star-delta and soft starters?', 'The contactors in a star-delta starter carry a part of the line current. Use the maker\'s table, or see the motor starting and soft starter articles for the currents.']],
      related: [['motor-formulas.html', 'Induction Motor Formulas'], ['motor-starting-formulas.html', 'Motor Starting Formulas'], ['circuit-breaker-formulas.html', 'Circuit Breaker Formulas'], ['../calculators/motor-engineering/', 'Motor engineering calculators']]
    });
    A[A.length - 1].check = { I, Ireq, pick, Ist };
  }

  /* ---------- 101. inverter-fed motor cable ---------- */
  {
    const VL = 400, Vdc = VL * Math.SQRT2, Vmax = 2 * Vdc, tr = 0.1, v = 150, Lc = tr * v / 2, dvdt = 0.8 * Vdc / tr, Zc = 50, Zm = 500, G = (Zm - Zc) / (Zm + Zc), Vpk = Vdc * (1 + G);
    const rows = [0.05, 0.1, 0.2, 0.4].map((t) => [(t * 1000) + ' ns', g4(t * v / 2) + ' m', g4(0.8 * Vdc / t / 1000) + ' kV/µs']);
    A.push({
      slug: 'inverter-motor-cable-formulas', h1: 'Inverter-Fed Motor Cable Formulas',
      desc: 'VFD motor cable formulas: the DC bus voltage, the reflected-wave overshoot at the motor, the critical cable length and the dv/dt of the output pulses.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['DC bus voltage (diode front end)', 'Vdc = √2 × VL'], ['Reflection coefficient at the motor', 'Γ = (Zm − Zc) / (Zm + Zc)'], ['Peak voltage at the motor', 'Vpeak = Vdc × (1 + Γ), at most 2 × Vdc'], ['Critical cable length', 'Lc = tr × v / 2'], ['Rate of voltage rise', 'dv/dt = 0.8 × Vdc / tr']]) +
        '<p class="note">VL is the line voltage of the supply, Zm the surge impedance of the motor (high) and Zc that of the cable (low), tr the rise time of the inverter pulse and v the speed of the wave in the cable, about half the speed of light (150 m/µs) for a typical cable. When the cable is longer than Lc, the pulse reflects at the motor and the voltage at the motor terminals can reach nearly twice the DC bus voltage. The 0.8 factor comes from measuring the rise between 10% and 90% of the pulse. The impedances, the rise time and the speed are examples, and the drive maker and the motor maker give the limits of the cable length, the insulation class and any output filter.</p>' +
        '<h2>Worked example: a drive on a 400 V supply</h2><p>Rise time 100 ns, Zm = 500 Ω, Zc = 50 Ω.</p>' +
        steps(['Vdc = √2 × 400 = ' + g4(Vdc) + ' V, and the upper limit 2 × Vdc = ' + g4(Vmax) + ' V', 'Γ = (500 − 50) / (500 + 50) = ' + g4(G) + ', so Vpeak = ' + g4(Vdc) + ' × (1 + ' + g4(G) + ') = ' + g4(Vpk) + ' V', 'Lc = 0.1 × 150 / 2 = ' + g4(Lc) + ' m', 'dv/dt = 0.8 × ' + g4(Vdc) + ' / 0.1 = ' + g4(dvdt / 1000) + ' kV/µs']) +
        '<h2>Critical length and dv/dt by rise time (400 V supply)</h2>' + table(['Rise time', 'Critical length', 'dv/dt'], rows),
      faq: [
        ['Why is the voltage at the motor higher than at the drive?', 'The fast pulse travels down the cable as a wave and reflects at the motor, which has a much higher impedance than the cable. The reflected wave adds to the pulse.'],
        ['What does a shorter rise time do?', 'It makes the critical length shorter, so the overshoot appears on shorter cables, and it raises the dv/dt that stresses the insulation and the bearings.'],
        ['How is the overshoot reduced?', 'With a dv/dt or sine filter at the drive, a shorter cable, or a motor with an insulation system for inverter duty. The drive maker lists which one fits.'],
        ['Does this change the cable choice?', 'The cable must also stand the peak voltage and the capacitive current of the pulses, so use a type that the drive maker approves, often a screened cable.']],
      related: [['soft-starter-vfd-formulas.html', 'Soft Starter and VFD Sizing Formulas'], ['cable-charging-current-formulas.html', 'Cable Charging Current Formulas'], ['harmonics-formulas.html', 'Harmonics Formulas'], ['../calculators/motor-engineering/', 'Motor engineering calculators']]
    });
    A[A.length - 1].check = { Vdc, Vmax, G, Vpk, Lc, dvdt };
  }

  /* ---------- 102. pneumatic cylinder ---------- */
  {
    const D = 63, d = 20, pg = 6, eta = 0.85, S = 100, cyc = 10, pa = 1.01325;
    const Ae = Math.PI * D * D / 4, Ar = Math.PI * (D * D - d * d) / 4, Fe = pg * 0.1 * Ae, Fr = pg * 0.1 * Ar, Feff = Fe * eta, ratio = (pg + pa) / pa;
    const Ve = Ae * S / 1e6 * ratio, Vr = Ar * S / 1e6 * ratio, Vc = Ve + Vr, Vmin = Vc * cyc;
    const rows = [4, 5, 6, 7].map((p) => [p + ' bar', g4(p * 0.1 * Ae) + ' N', g4(p * 0.1 * Ar) + ' N']);
    A.push({
      slug: 'pneumatic-cylinder-formulas', h1: 'Pneumatic Cylinder Force and Air Use',
      desc: 'Air cylinder formulas: the extend and retract force from the pressure and the bore, the force with friction losses and the free air used per cycle.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Piston area', 'A = π × D² / 4'], ['Rod-side (annulus) area', 'Ar = π × (D² − d²) / 4'], ['Theoretical force', 'F = p × A'], ['Usable force', 'Fu = F × η'], ['Free air per stroke', 'V = A × S × (pg + pa) / pa']]) +
        '<p class="note">D is the bore, d the rod diameter and S the stroke, with p the gauge pressure and pa the atmospheric pressure (1.01325 bar). With the area in mm² and the pressure in bar, the force in newtons is 0.1 × p × A. The retract stroke acts on the annulus area, so its force is lower than the extend force at the same pressure. The efficiency η covers the seal friction and other losses, and it is an example here (0.85), as is every other value. The air volume is that of free air, referred to atmospheric pressure, and it is the figure for the compressor size. The cylinder maker gives the real force and air use, and the end-of-stroke cushions and the lines add to the air use.</p>' +
        '<h2>Worked example: a 63 mm bore, 20 mm rod, 100 mm stroke at 6 bar</h2>' +
        steps(['A = π × 63² / 4 = ' + g4(Ae) + ' mm² and Ar = π × (63² − 20²) / 4 = ' + g4(Ar) + ' mm²', 'Extend force = 0.1 × 6 × ' + g4(Ae) + ' = ' + g4(Fe) + ' N, and with η = 0.85 the usable force is ' + g4(Fe) + ' × 0.85 = ' + g4(Feff) + ' N', 'Retract force = 0.1 × 6 × ' + g4(Ar) + ' = ' + g4(Fr) + ' N']) +
        '<h2>Worked example: free air used by the same cylinder</h2><p>The pressure ratio is (6 + 1.01325) / 1.01325 = ' + g4(ratio) + '.</p>' +
        steps(['Extend: ' + g4(Ae) + ' mm² × 100 mm × ' + g4(ratio) + ' = ' + g4(Ve) + ' L', 'Retract: ' + g4(Ar) + ' mm² × 100 mm × ' + g4(ratio) + ' = ' + g4(Vr) + ' L, so one cycle uses ' + g4(Vc) + ' L', 'At 10 cycles a minute: 10 × ' + g4(Vc) + ' = ' + g4(Vmin) + ' L/min of free air']) +
        '<h2>Theoretical force of the 63 mm cylinder by pressure</h2>' + table(['Pressure', 'Extend force', 'Retract force'], rows),
      faq: [
        ['Why is the retract force lower?', 'The rod takes up a part of the piston area on the rod side, so the pressure acts on a smaller area.'],
        ['What is free air?', 'The air volume at atmospheric pressure. A compressed volume at 7 bar absolute holds about seven times as much free air, which is why the air use is a multiple of the cylinder volume.'],
        ['Should I use the full theoretical force?', 'No. Friction and the speed of the stroke use a part of it, and a margin keeps the cylinder from stalling, so the load is chosen well below the theoretical force.'],
        ['How does this connect to the compressor?', 'The sum of the air use of all the cylinders, with leakage, is the free air that the compressor must deliver. See the compressor power article for the power.']],
      related: [['compressor-power-formulas.html', 'Compressor Power Formulas'], ['hydraulic-power-formulas.html', 'Hydraulic Power Formulas'], ['pump-formulas.html', 'Pump Formulas'], ['../calculators/motor-engineering/', 'Motor engineering calculators']]
    });
    A[A.length - 1].check = { Ae, Ar, Fe, Fr, Feff, ratio, Ve, Vr, Vmin };
  }

  /* ---------- 103. busbar temperature rise ---------- */
  {
    const w = 0.1, t = 0.01, I = 1600, ta = 35, h = 10, al = 0.00393, rho = 1.72e-8, R20 = rho / (w * t), per = 2 * (w + t), q20 = I * I * R20;
    const dT = (i) => (i * i * R20 * (1 + al * (ta - 20))) / (h * per - i * i * R20 * al);
    const d = dT(I), th = ta + d, Rh = R20 * (1 + al * (th - 20)), Pm = I * I * Rh;
    const rows = [800, 1200, 1600, 2000].map((i) => [i + ' A', g4(i * i * R20) + ' W/m', g4(dT(i)) + ' K', g4(ta + dT(i)) + ' °C']);
    A.push({
      slug: 'busbar-temperature-rise-formulas', h1: 'Busbar Temperature Rise Formulas',
      desc: 'Busbar heating formulas: the resistance and heat per metre, the steady temperature rise from the surface cooling and the bar temperature for a current.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Resistance per metre at 20 °C', 'R20 = ρ / (w × t)'], ['Perimeter that cools', 'P = 2 × (w + t)'], ['Steady temperature rise', 'Δθ = I² × R20 × (1 + α × (θa − 20)) / (h × P − I² × R20 × α)'], ['Bar temperature', 'θ = θa + Δθ']]) +
        '<p class="note">ρ is the resistivity of copper (1.72e-8 Ω·m), w and t the width and thickness of the bar in metres, α the temperature coefficient of resistance (0.00393 per K for copper), θa the air temperature and h the combined heat transfer coefficient of convection and radiation in W/(m²·K). The formula balances the heat I² × R of the bar, which rises with its temperature, against the heat that the surface sheds. The bar is one bar in free air. Skin and proximity effects, the shading of neighbouring bars, an enclosure, joints and supports are left out, so the real rise is higher in a switchboard. If the denominator is zero or negative the heat grows faster than the cooling, and the bar has no steady state. The value of h = 10 W/(m²·K) and the other inputs are examples. Use the rated currents and the temperature-rise tests of the maker and the standard for a design.</p>' +
        '<h2>Worked example: a 100 × 10 mm copper bar at 1,600 A, air at 35 °C</h2>' +
        steps(['R20 = 1.72e-8 / (0.1 × 0.01) = ' + g4(R20 * 1e6) + ' µΩ/m, and I² × R20 = ' + g4(q20) + ' W/m', 'P = 2 × (0.1 + 0.01) = ' + g4(per) + ' m', 'Δθ = ' + g4(q20) + ' × (1 + 0.00393 × 15) / (10 × ' + g4(per) + ' − ' + g4(q20) + ' × 0.00393) = ' + g4(d) + ' K', 'The bar runs at 35 + ' + g4(d) + ' = ' + g4(th) + ' °C, where the heat is ' + g4(Pm) + ' W/m']) +
        '<h2>Temperature of the 100 × 10 mm bar by current (air at 35 °C)</h2>' + table(['Current', 'Heat at 20 °C', 'Rise', 'Bar temperature'], rows),
      faq: [
        ['Why does the formula have a term in the denominator for the resistance?', 'The resistance of copper rises with its temperature, so the heat grows as the bar warms. The term in the denominator takes that feedback into account in one step.'],
        ['What limits the temperature of a bar?', 'The standard of the assembly sets the allowed rise for the bar, the joints and the parts that touch it, and the insulation near it. Use the figure of the standard that you work to.'],
        ['Why are bars in a board hotter than a bar in free air?', 'Neighbouring bars and the enclosure cut the cooling and add heat, and the skin and proximity effects raise the resistance. A rated current from the maker covers these.'],
        ['How is this related to the short-circuit size?', 'This page is about continuous current. The short-circuit heating and the force follow other formulas, as in the busbar rating and the conductor force articles.']],
      related: [['busbar-rating-formulas.html', 'Busbar Size Formulas'], ['conductor-resistance-formulas.html', 'Conductor Resistance Formulas'], ['skin-effect-formulas.html', 'Skin Effect Formulas'], ['conductor-force-formulas.html', 'Conductor Force Formulas']]
    });
    A[A.length - 1].check = { R20, per, q20, d, th, Pm };
  }


  /* ---------- 104. motor temperature rise (resistance method) ---------- */
  {
    const R1 = 1.2, T1 = 25, R2 = 1.46, Ta = 30, T2 = (R2 / R1) * (235 + T1) - 235, rise = T2 - Ta;
    const rows = [0, 10, 20, 30].map((x) => [x + ' K', g4(Math.pow(2, -x / 10))]);
    A.push({
      slug: 'motor-temperature-rise-formulas', h1: 'Motor Temperature Rise Formulas',
      desc: 'Motor winding temperature formulas: the hot temperature from the change in resistance, the temperature rise over the ambient and the insulation life rule.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Hot winding temperature (copper)', 'T2 = (R2 / R1) × (235 + T1) − 235'], ['Temperature rise', 'ΔT = T2 − Ta'], ['Insulation life factor (rule of thumb)', 'L = 2^(−ΔTover / 10)']]) +
        '<p class="note">R1 is the winding resistance when cold, measured at the winding temperature T1 (equal to the ambient when the motor has rested), R2 the resistance measured hot, and Ta the ambient temperature at the end of the test, all in °C and ohms. The constant 235 is for copper in IEC 60034-1, and the constant for aluminium is 225. The resistance method gives the average temperature of the winding, and the hottest spot is higher. The life rule says that the insulation life halves for each 10 K above its rating. It is a common rule of thumb and not a guarantee. The limits of the rise depend on the insulation class and the standard, so use the figure on the nameplate. The values here are examples.</p>' +
        '<h2>Worked example: a winding of 1.20 Ω at 25 °C that reads 1.46 Ω hot</h2><p>The ambient at the end of the test is 30 °C.</p>' +
        steps(['T2 = (1.46 / 1.2) × (235 + 25) − 235 = ' + g4(T2) + ' °C', 'ΔT = ' + g4(T2) + ' − 30 = ' + g4(rise) + ' K']) +
        '<h2>Worked example: insulation life</h2>' + steps(['A winding 10 K over its rating has a life factor of 2^(−10 / 10) = ' + g4(0.5)]) +
        '<h2>Life factor by temperature above the rating</h2>' + table(['Above the rating', 'Life factor'], rows),
      faq: [
        ['Why measure the resistance?', 'The winding is inside the motor, so a thermometer cannot reach it. The resistance of copper rises in a known way with the temperature, so the resistance gives the average temperature.'],
        ['Why does the winding need the cold reading?', 'The formula compares the hot resistance with a reference resistance at a known temperature. Measure the cold value after the motor has stood long enough to be at the ambient temperature.'],
        ['Is the average temperature the hottest temperature?', 'No. The hot spot is higher than the average, and the limits of the standard allow for it.'],
        ['What does the life rule mean in practice?', 'A motor that runs hot ages faster. The rule shows why a small excess of temperature over a long time matters, but the real life depends on the insulation system and the duty.']],
      related: [['motor-formulas.html', 'Induction Motor Formulas'], ['motor-efficiency-formulas.html', 'Motor Efficiency Formulas'], ['duty-cycle-rms-formulas.html', 'Duty Cycle and RMS Load Formulas'], ['../calculators/motor-engineering/', 'Motor engineering calculators']]
    });
    A[A.length - 1].check = { T2, rise };
  }

  /* ---------- 105. battery storage efficiency ---------- */
  {
    const cap = 100, dod = 0.9, eta = 0.9, tariff = 8, cost = 30000, cyc = 6000, use = cap * dod, ein = use / eta, loss = ein - use, ceff = tariff / eta, ctp = cost / (cyc * use), eone = Math.sqrt(eta);
    const rows = [0.8, 0.85, 0.9, 0.95].map((e) => [String(e), g4(use / e) + ' kWh', g4(tariff / e)]);
    A.push({
      slug: 'battery-storage-efficiency-formulas', h1: 'Battery Storage Round-Trip Efficiency',
      desc: 'Battery storage formulas: the usable energy, the round-trip efficiency, the energy lost in each cycle and the cost of a delivered kWh and of the throughput.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Usable energy', 'Eu = Ecap × DoD'], ['Energy to put in', 'Ein = Eu / ηrt'], ['Energy lost in a cycle', 'Eloss = Ein − Eu'], ['One-way efficiency (equal each way)', 'η1 = √ηrt'], ['Cost of a delivered kWh', 'c = tariff / ηrt'], ['Storage cost per kWh of throughput', 'cs = cost / (cycles × Eu)']]) +
        '<p class="note">Ecap is the energy capacity in kWh, DoD the depth of discharge used (as a fraction) and ηrt the round-trip efficiency, which is the energy out divided by the energy in over a full charge and discharge, including the losses of the cells, the converter and the cooling. The one-way figure assumes that the charge and the discharge lose the same share. The tariff is the price of one kWh from the grid and the cost is the price of the system, so use one currency for both. The cycle life depends on the depth of discharge and on the temperature, and the maker gives it. All the values are examples.</p>' +
        '<h2>Worked example: a 100 kWh battery used to 90% depth at ηrt = 0.9</h2>' +
        steps(['Eu = 100 × 0.9 = ' + g4(use) + ' kWh', 'Ein = ' + g4(use) + ' / 0.9 = ' + g4(ein) + ' kWh, so the loss is ' + g4(ein) + ' − ' + g4(use) + ' = ' + g4(loss) + ' kWh', 'η1 = √0.9 = ' + g4(eone), 'At a tariff of 8, c = 8 / 0.9 = ' + g4(ceff)]) +
        '<h2>Worked example: cost of the throughput</h2><p>The system costs 30,000 and the maker gives 6,000 cycles.</p>' + steps(['cs = 30,000 / (6,000 × ' + g4(use) + ') = ' + g4(ctp) + ' per kWh']) +
        '<h2>Energy in for the 90 kWh delivered, and cost per delivered kWh</h2>' + table(['Round-trip efficiency', 'Energy in', 'Cost per kWh delivered (tariff 8)'], rows),
      faq: [
        ['What is round-trip efficiency?', 'The share of the energy put into the store that comes back out. A figure of 0.9 means that 10% is lost as heat in the cells and the converter.'],
        ['Why is the usable energy lower than the capacity?', 'The battery is not used to the end of its range, because deep cycles shorten its life. The depth of discharge sets the usable share.'],
        ['Does the efficiency change with the power?', 'Yes. A high power loses more in the resistance of the cells and in the converter, so the efficiency at a low power is higher. Use the figure for your duty.'],
        ['Does the stand-by load count?', 'It does, because the cooling and the control use energy all the time. Add it to the losses for a full account.']],
      related: [['battery-formulas.html', 'Battery Formulas'], ['battery-charge-time-formulas.html', 'Battery Charge Time Formulas'], ['battery-internal-resistance-formulas.html', 'Battery Internal Resistance Formulas'], ['energy-cost-formulas.html', 'Energy and Cost Formulas']]
    });
    A[A.length - 1].check = { use, ein, loss, ceff, ctp, eone };
  }

  /* ---------- 106. thermal time constant ---------- */
  {
    const th = 60, tau = 3, t1 = 2, a = th * (1 - Math.exp(-t1 / tau)), t40 = -tau * Math.log(1 - 40 / th), cool = th * Math.exp(-t1 / tau);
    const rows = [1, 2, 3, 5].map((k) => [k + ' × τ', g4((1 - Math.exp(-k)) * 100) + '%']);
    A.push({
      slug: 'thermal-time-constant-formulas', h1: 'Thermal Time Constant Formulas',
      desc: 'Heating and cooling curve formulas for a cable, motor or transformer: the temperature rise after a time, the time to reach a rise and the cooling curve.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Rise after time t (heating)', 'θ = θ∞ × (1 − e^(−t / τ))'], ['Time to reach a rise θ', 't = −τ × ln(1 − θ / θ∞)'], ['Rise after time t (cooling)', 'θ = θ0 × e^(−t / τ)']]) +
        '<p class="note">θ∞ is the final steady rise over the ambient in kelvin, which a constant load gives after a long time, τ the thermal time constant in the same unit of time as t and θ0 the rise at the start of the cooling. The model treats the equipment as one lump with one time constant. Real machines have several, such as a quick winding and a slow core, so use the maker\'s curves for a close answer. After one time constant the rise has reached 63.2% of its final value, and after three it has reached 95%. The values here are examples.</p>' +
        '<h2>Worked example: a final rise of 60 K and τ = 3 h</h2>' +
        steps(['After 2 h, θ = 60 × (1 − e^(−2 / 3)) = ' + g4(a) + ' K', 'Time to reach 40 K: t = −3 × ln(1 − 40 / 60) = ' + g4(t40) + ' h', 'Cooling from 60 K, after 2 h θ = 60 × e^(−2 / 3) = ' + g4(cool) + ' K']) +
        '<h2>Share of the final rise reached while heating</h2>' + table(['Time', 'Share of the final rise'], rows),
      faq: [
        ['What is the time constant?', 'The time in which the rise covers 63.2% of the distance to its final value. It depends on the mass and the cooling of the equipment, and not on the load.'],
        ['How long until the temperature is steady?', 'About five time constants reach 99%, so a machine with a long time constant takes hours to settle.'],
        ['Why can a short overload be allowed?', 'The temperature takes time to rise, so a load above the rating for a time much shorter than τ gives only a small rise. Use the maker\'s overload curve for the limit.'],
        ['Is the cooling time constant the same?', 'Often not. A motor that stands still without its fan cools more slowly than it heats, so check the maker\'s data.']],
      related: [['duty-cycle-rms-formulas.html', 'Duty Cycle and RMS Load Formulas'], ['motor-temperature-rise-formulas.html', 'Motor Temperature Rise Formulas'], ['heat-sink-formulas.html', 'Heat Sink Formulas'], ['busbar-temperature-rise-formulas.html', 'Busbar Temperature Rise Formulas']]
    });
    A[A.length - 1].check = { a, t40, cool };
  }

  /* ---------- 107. solar charge controller ---------- */
  {
    const P = 3000, eta = 0.96, Vb = 48, I = P * eta / Vb, Ireq = I * 1.25, sizes = [40, 60, 80, 100], pick = sizes.filter((s) => s >= Ireq)[0], Ah = P * 5 * eta / Vb, Ipwm = 4 * 10 * 1.25;
    const rows = [1, 2, 3, 5].map((k) => [k + ' kWp', g4(k * 1000 * eta / Vb) + ' A', g4(k * 1000 * eta / Vb * 1.25) + ' A']);
    A.push({
      slug: 'charge-controller-formulas', h1: 'Solar Charge Controller Sizing Formulas',
      desc: 'Charge controller formulas: the output current of an MPPT controller from the array power and battery voltage, the safety margin and the daily charge.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['MPPT output current', 'I = Parray × η / Vbat'], ['Controller current rating', 'Irating ≥ 1.25 × I'], ['PWM controller current rating', 'Irating ≥ 1.25 × Isc total'], ['Daily charge into the battery', 'Q = Parray × h × η / Vbat']]) +
        '<p class="note">Parray is the array power at standard test conditions in watts, η the efficiency of the controller and the wiring, Vbat the battery voltage, h the peak sun hours of the day and Isc total the sum of the short-circuit currents of the parallel strings. The factor 1.25 is a common margin for an irradiance above 1,000 W/m², and the rules of the code or the maker may ask for another one. The input voltage of the controller must also stay above the open-circuit voltage of the array at the coldest temperature, which the solar string article covers. The sizes in the list, the efficiency and the sun hours are examples.</p>' +
        '<h2>Worked example: a 3 kWp array on a 48 V battery, MPPT controller</h2>' +
        steps(['I = 3000 × 0.96 / 48 = ' + g4(I) + ' A', 'Irating ≥ 1.25 × ' + g4(I) + ' = ' + g4(Ireq) + ' A, so the next size in the example list of 40, 60, 80 and 100 A is ' + pick + ' A', 'With 5 peak sun hours, Q = 3000 × 5 × 0.96 / 48 = ' + g4(Ah) + ' Ah a day']) +
        '<h2>Worked example: a PWM controller, 4 strings of 10 A short-circuit current</h2>' + steps(['Irating ≥ 1.25 × 4 × 10 = ' + g4(Ipwm) + ' A']) +
        '<h2>MPPT current on a 48 V battery by array size</h2>' + table(['Array', 'Output current', 'With the 1.25 margin'], rows),
      faq: [
        ['Why is the output current based on the battery voltage?', 'The controller turns the array voltage down to the battery voltage, and the power stays about the same. A lower battery voltage therefore gives a higher current.'],
        ['What is the difference between MPPT and PWM?', 'An MPPT controller converts the array voltage to the battery voltage and can use an array of a higher voltage. A PWM controller connects the array to the battery, so the array voltage must match the battery.'],
        ['Why add 25%?', 'The irradiance can exceed 1,000 W/m² for a short time, and the margin keeps the controller within its rating.'],
        ['Does the controller rating cover the battery limit?', 'No. The charge current must also stay within the limit of the battery, so check that figure with the battery maker.']],
      related: [['solar-pv-formulas.html', 'Solar PV Formulas'], ['solar-dc-ac-ratio-formulas.html', 'Solar DC to AC Ratio Formulas'], ['battery-charge-time-formulas.html', 'Battery Charge Time Formulas'], ['../calculators/renewable-energy/', 'Renewable energy calculators']]
    });
    A[A.length - 1].check = { I, Ireq, pick, Ah, Ipwm };
  }

  /* ---------- 108. point illuminance ---------- */
  {
    const It = 5000, h = 10, E0 = It / (h * h), th30 = 30 * DEG, E30 = It * Math.pow(Math.cos(th30), 3) / (h * h), x30 = h * Math.tan(th30), E45 = It * Math.pow(Math.cos(45 * DEG), 3) / (h * h), Ireq = 20 * 64;
    const rows = [0, 15, 30, 45, 60].map((a) => [a + '°', g4(h * Math.tan(a * DEG)) + ' m', g4(It * Math.pow(Math.cos(a * DEG), 3) / (h * h)) + ' lx']);
    A.push({
      slug: 'point-illuminance-formulas', h1: 'Point Illuminance Formulas',
      desc: 'Point-by-point lighting formulas: the illuminance on a horizontal plane from a luminous intensity, the height and the angle, and the intensity needed.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Illuminance on a plane facing the source', 'E = I / d²'], ['Illuminance on a horizontal plane', 'E = I × cos θ / d² = I × cos³θ / h²'], ['Horizontal distance from the point below', 'x = h × tan θ'], ['Intensity needed', 'I = E × h² / cos³θ']]) +
        '<p class="note">I is the luminous intensity of the source in candela in the direction of the point, d the distance from the source to the point, h the mounting height above the plane and θ the angle between the vertical and the direction of the point. The first formula is the inverse square law and the cos θ term takes account of the tilt of the surface. The formula is for a point source. A lamp has a different intensity at each angle, so take I(θ) from the photometric data of the fitting, and an extended source close to the plane needs a full calculation. The values here are examples, and the light of other fittings and of reflections adds to the result.</p>' +
        '<h2>Worked example: a source of 5,000 cd at 10 m</h2><p>The intensity is the same in all directions in this example.</p>' +
        steps(['Directly below, E = 5000 / 10² = ' + g4(E0) + ' lx', 'At 30°, E = 5000 × cos³30° / 10² = ' + g4(E30) + ' lx, at a horizontal distance of 10 × tan 30° = ' + g4(x30) + ' m', 'At 45°, E = 5000 × cos³45° / 10² = ' + g4(E45) + ' lx']) +
        '<h2>Worked example: the intensity for 20 lx directly below at 8 m</h2>' + steps(['I = 20 × 8² / cos³0° = ' + g4(Ireq) + ' cd']) +
        '<h2>Illuminance by angle for 5,000 cd at 10 m</h2>' + table(['Angle', 'Distance from the point below', 'Illuminance'], rows),
      faq: [
        ['Why does the illuminance fall away from the point below?', 'The distance to the source grows, which lowers the light by the inverse square law, and the surface is tilted to the ray, which lowers it again. Together they give the cos³θ term.'],
        ['Why use the photometric data of the fitting?', 'A real fitting does not give the same intensity in all directions. The data gives the intensity at each angle, and the formula then gives the light at each point.'],
        ['How do I find the average illuminance?', 'Calculate the points over a grid and take the mean, or use the lumen method in the lighting article with the utilisation factor.'],
        ['Does this apply to airfield lights?', 'It applies to a point source of light in general. Airfield lights have standards that fix the intensity at each angle, so check the standard of your authority.']],
      related: [['lighting-formulas.html', 'Lighting Formulas'], ['led-formulas.html', 'LED Formulas'], ['energy-cost-formulas.html', 'Energy and Cost Formulas'], ['../calculators/lighting-and-facilities/', 'Facilities calculators']]
    });
    A[A.length - 1].check = { E0, E30, x30, E45, Ireq };
  }

  /* ---------- 109. generator droop ---------- */
  {
    const fnl = 52, ffl = 50, droop = (fnl - ffl) / ffl * 100, f1 = 51, fr1 = (fnl - f1) / (fnl - ffl), Pt = 600, Pr1 = 500, Pr2 = 1000, x = Pt / (Pr1 + Pr2), f = fnl - x * (fnl - ffl), p1 = x * Pr1, p2 = x * Pr2;
    const rows = [0.25, 0.5, 0.75, 1].map((k) => [Math.round(k * 100) + '%', g4(fnl - k * (fnl - ffl)) + ' Hz']);
    A.push({
      slug: 'generator-droop-formulas', h1: 'Generator Droop and Load Sharing Formulas',
      desc: 'Generator droop formulas: the droop percentage, the load from the frequency and the load shared by parallel generators with the same droop.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Speed droop', 'droop % = (fnl − ffl) / ffl × 100'], ['Load fraction at frequency f', 'x = (fnl − f) / (fnl − ffl)'], ['Bus frequency for a total load', 'f = fnl − (Ptotal / ΣPrated) × (fnl − ffl)'], ['Load on each unit', 'Pi = x × Prated,i']]) +
        '<p class="note">fnl is the frequency at no load and ffl the frequency at full load, so a unit with a droop governor lowers its frequency as the load rises. Generators in parallel on the same bus share the same frequency. If they have the same droop and the same no-load frequency, they share the load in proportion to their ratings. A different droop or setpoint changes the share, and the operator or the load sharing control then moves the setpoints to correct it. The reactive power shares by the voltage regulation in the same way, which this page does not cover. The values here are examples, and the maker gives the governor settings.</p>' +
        '<h2>Worked example: no load 52 Hz, full load 50 Hz</h2>' +
        steps(['droop = (52 − 50) / 50 × 100 = ' + g4(droop) + '%', 'At 51 Hz, x = (52 − 51) / (52 − 50) = ' + g4(fr1) + ', which is half of the rating']) +
        '<h2>Worked example: units of 500 kW and 1,000 kW sharing 600 kW</h2>' +
        steps(['x = 600 / (500 + 1000) = ' + g4(x), 'f = 52 − ' + g4(x) + ' × (52 − 50) = ' + g4(f) + ' Hz', 'P1 = ' + g4(x) + ' × 500 = ' + g4(p1) + ' kW and P2 = ' + g4(x) + ' × 1000 = ' + g4(p2) + ' kW']) +
        '<h2>Frequency by load share (52 Hz at no load, 50 Hz at full load)</h2>' + table(['Load', 'Frequency'], rows),
      faq: [
        ['Why do the generators need a droop?', 'The droop makes the frequency fall as the load rises, which gives each unit its own point on the line and lets two units share the load without fighting each other.'],
        ['What happens with a different droop?', 'The unit with the smaller droop takes a larger share of a change in load, so the shares no longer follow the ratings. Match the droop to share in proportion.'],
        ['What does an isochronous governor do?', 'It holds the frequency constant. Only one unit on a bus should run isochronous, and the others run on droop, or a load sharing control links them.'],
        ['How are the shares adjusted?', 'The setpoint of the governor moves the droop line up or down, which raises or lowers the load of that unit at the same frequency.']],
      related: [['generator-formulas.html', 'Generator Formulas'], ['parallel-transformer-formulas.html', 'Parallel Transformer Load Sharing Formulas'], ['ups-formulas.html', 'UPS Formulas'], ['../calculators/generator-sizing/', 'Generator sizing calculators']]
    });
    A[A.length - 1].check = { droop, fr1, x, f, p1, p2 };
  }


  /* ---------- 110. two-wattmeter method ---------- */
  {
    const W1 = 8, W2 = 4, P = W1 + W2, Q = R3 * (W1 - W2), tp = Q / P, phi = Math.atan(tp), pf = Math.cos(phi);
    const W1b = 6, W2b = -2, Pb = W1b + W2b, Qb = R3 * (W1b - W2b), tb = Qb / Pb, phib = Math.atan(tb), pfb = Math.cos(phib);
    const rows = [1, 0.9, 0.8, 0.5].map((f) => { const t = Math.tan(Math.acos(f)); return [String(f), g4(Math.acos(f) / DEG) + '°', g4((R3 - t) / (R3 + t))]; });
    A.push({
      slug: 'two-wattmeter-formulas', h1: 'Two-Wattmeter Method Formulas',
      desc: 'Two-wattmeter method formulas: the total power of a three-phase load from two readings, the reactive power, the power angle and the power factor.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Total real power', 'P = W1 + W2'], ['Reactive power', 'Q = √3 × (W1 − W2)'], ['Tangent of the power angle', 'tan φ = √3 × (W1 − W2) / (W1 + W2)'], ['Power factor', 'pf = cos φ']]) +
        '<p class="note">W1 and W2 are the readings of the two wattmeters, connected in two lines with their voltage coils to the third line, for a three-wire three-phase load. The method works for a balanced load whatever the power factor. W1 is the larger reading. At a power factor of 0.5 the smaller reading is zero, and below 0.5 it is negative, so keep the sign when you add. The formula for Q and the angle assumes a balanced load, and the total P holds also for an unbalanced load on three wires. The readings here are examples.</p>' +
        '<h2>Worked example: W1 = 8 kW and W2 = 4 kW</h2>' +
        steps(['P = 8 + 4 = ' + g4(P) + ' kW', 'Q = √3 × (8 − 4) = ' + g4(Q) + ' kVAR', 'tan φ = ' + g4(Q) + ' / ' + g4(P) + ' = ' + g4(tp) + ', so φ = ' + g4(phi / DEG) + '°', 'pf = cos φ = ' + g4(pf)]) +
        '<h2>Worked example: W1 = 6 kW and W2 = −2 kW</h2>' +
        steps(['P = 6 + (−2) = ' + g4(Pb) + ' kW', 'Q = √3 × (6 − (−2)) = ' + g4(Qb) + ' kVAR', 'tan φ = ' + g4(Qb) + ' / ' + g4(Pb) + ' = ' + g4(tb) + ', so φ = ' + g4(phib / DEG) + '°', 'pf = cos φ = ' + g4(pfb)]) +
        '<h2>Ratio of the readings W2 / W1 by power factor</h2>' + table(['Power factor', 'Angle', 'W2 / W1'], rows),
      faq: [
        ['Why can one reading be negative?', 'Below a power factor of 0.5 the angle is above 60°, and one wattmeter sees a negative power. Reverse its connection to read it and count the reading as negative.'],
        ['Why two wattmeters and not three?', 'For three wires the sum of the line currents is zero, so two instruments are enough to find the total power.'],
        ['Does the method need a balanced load?', 'The total power does not. The reactive power and the angle from these formulas do.'],
        ['What if the neutral is connected?', 'Then the load has four wires and the sum of the currents need not be zero, so use three wattmeters.']],
      related: [['three-phase-power-formulas.html', 'Three-Phase Power Formulas'], ['power-factor-formulas.html', 'Power Factor Formulas'], ['unbalance-formulas.html', 'Unbalance Formulas'], ['../calculators/power-and-energy/', 'Power and energy calculators']]
    });
    A[A.length - 1].check = { P, Q, tp, pf, Pb, Qb, pfb };
  }

  /* ---------- 111. braking resistor ---------- */
  {
    const Vb = 750, Pb = 15000, R = Vb * Vb / Pb, J = 2, n = 1480, w = 2 * Math.PI * n / 60, E = 0.5 * J * w * w, ts = 4, Pav = E / ts, cyc = 60, Pres = E / cyc;
    const rows = [5, 15, 30, 55].map((k) => [k + ' kW', g4(Vb * Vb / (k * 1000)) + ' Ω']);
    A.push({
      slug: 'braking-resistor-formulas', h1: 'VFD Braking Resistor Formulas',
      desc: 'Braking resistor formulas for a drive: the resistance from the braking power and the DC bus voltage, the braking energy and the average power in the resistor.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Resistance for a braking power', 'R = Vb² / Pb'], ['Kinetic energy to remove', 'E = ½ × J × ω², with ω = 2π × n / 60'], ['Average power during the stop', 'Pav = E / ts'], ['Average power over the cycle', 'Pcyc = E / tcycle']]) +
        '<p class="note">Vb is the DC bus voltage at which the braking chopper switches on, Pb the peak braking power, J the inertia of the motor and load in kg·m², n the speed in rpm, ts the stopping time and tcycle the time between the stops. The resistance must not be lower than the minimum value of the drive, and the resistor must carry the peak power for the braking time and the average power over the cycle. The energy that the machine has is shared between the resistor and the losses of the motor and the load, so the figure is a safe upper estimate. A load that pulls the motor all the time, such as a lowering hoist, needs a continuous rating. The voltage, the inertia and the times here are examples, and the drive maker gives the resistance range and the duty.</p>' +
        '<h2>Worked example: a 15 kW peak braking power on a bus that brakes at 750 V</h2>' +
        steps(['R = 750² / 15,000 = ' + g4(R) + ' Ω']) +
        '<h2>Worked example: stopping a load of 2 kg·m² from 1,480 rpm in 4 s, once a minute</h2>' +
        steps(['ω = 2π × 1480 / 60 = ' + w.toFixed(2) + ' rad/s', 'E = ½ × 2 × ' + w.toFixed(2) + '² = ' + g4(E / 1000) + ' kJ', 'Pav = ' + g4(E / 1000) + ' / 4 = ' + g4(Pav / 1000) + ' kW during the stop', 'Pcyc = ' + g4(E / 1000) + ' / 60 = ' + g4(Pres / 1000) + ' kW over the cycle']) +
        '<h2>Resistance for a 750 V bus by braking power</h2>' + table(['Braking power', 'Resistance'], rows),
      faq: [
        ['Why a resistor at all?', 'A motor that slows a load turns into a generator and feeds energy back into the DC bus of the drive. A drive with a diode front end cannot return it to the supply, so the chopper sends it to the resistor as heat.'],
        ['Why not use the lowest resistance?', 'A low resistance gives a high current in the chopper, and the drive has a minimum value. A high resistance gives less braking power for the same bus voltage.'],
        ['What is the difference between the peak and average power?', 'The resistor takes the peak power only during the stop. Its continuous rating follows the average over the cycle, and its pulse rating covers the peak.'],
        ['Is there a way to avoid the resistor?', 'A drive with a regenerative front end returns the energy to the supply, which saves the heat but costs more.']],
      related: [['soft-starter-vfd-formulas.html', 'Soft Starter and VFD Sizing Formulas'], ['motor-acceleration-time-formulas.html', 'Motor Acceleration Time Formulas'], ['flywheel-energy-formulas.html', 'Flywheel Formulas'], ['../calculators/motor-engineering/', 'Motor engineering calculators']]
    });
    A[A.length - 1].check = { R, w, E, Pav, Pres };
  }

  /* ---------- 112. load bank test ---------- */
  {
    const S = 500, pfr = 0.8, Pr = S * pfr, V = 415, I = Pr * 1000 / (R3 * V), p75 = 0.75 * Pr, load = Pr / S * 100;
    const rows = [25, 50, 75, 100].map((x) => [x + '%', g4(x / 100 * Pr) + ' kW', g4(x / 100 * Pr * 1000 / (R3 * V)) + ' A']);
    A.push({
      slug: 'load-bank-test-formulas', h1: 'Load Bank Test Formulas',
      desc: 'Load bank test formulas for a generator: the rated power, the test steps, the bank current and the kVA loading of a resistive bank.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Rated power', 'Prated = S × pf'], ['Power at a test step', 'P = x × Prated'], ['Bank current', 'I = P × 1000 / (√3 × V × pfbank)'], ['kVA loading with the bank', 'loading % = P / (S × pfbank) × 100']]) +
        '<p class="note">S is the rating of the set in kVA, pf its rated power factor, x the share of the step as a fraction, V the line voltage and pfbank the power factor of the bank (1 for a resistive bank). A resistive bank loads the engine to its kW rating but loads the alternator only to P / S in kVA, so a set rated at 0.8 shows 80% of its kVA at full kW on a resistive bank. A reactive bank is needed to test the alternator at its rated kVA. The steps of 25, 50, 75 and 100% are common, and the test plan, the duration of each step and the pass limits come from the standard of the test or the customer. The values here are examples.</p>' +
        '<h2>Worked example: a 500 kVA set rated at 0.8 on 415 V</h2>' +
        steps(['Prated = 500 × 0.8 = ' + g4(Pr) + ' kW', 'At 75%, P = 0.75 × ' + g4(Pr) + ' = ' + g4(p75) + ' kW', 'A resistive bank at ' + g4(Pr) + ' kW draws I = ' + g4(Pr) + ' × 1000 / (√3 × 415) = ' + g4(I) + ' A', 'The kVA loading of the alternator is ' + g4(Pr) + ' / 500 = ' + g4(load) + '%']) +
        '<h2>Test steps for the 500 kVA set on a resistive bank at 415 V</h2>' + table(['Step', 'Power', 'Bank current'], rows),
      faq: [
        ['Why test with a load bank?', 'A site load may be too small or too variable to prove the rating. A bank gives a known load, so the set can show that it carries the rated power and that its cooling and fuel system hold up.'],
        ['Why does the resistive bank not load the alternator fully?', 'The alternator is rated in kVA, and a resistive load has a unity power factor, so the current is lower than at rated kVA. A reactive bank adds the missing current.'],
        ['What does the test show besides power?', 'The temperatures, the pressures, the frequency and voltage regulation and the fuel use at each step. Record them against the maker limits.'],
        ['Why run the bank at a low load first?', 'A set that runs long on a light load can build up unburned fuel. Test steps and the time at each step follow the maker advice.']],
      related: [['generator-formulas.html', 'Generator Formulas'], ['generator-droop-formulas.html', 'Generator Droop and Load Sharing Formulas'], ['three-phase-power-formulas.html', 'Three-Phase Power Formulas'], ['../calculators/generator-sizing/', 'Generator sizing calculators']]
    });
    A[A.length - 1].check = { Pr, p75, I, load };
  }

  /* ---------- 113. transformer cooling rating ---------- */
  {
    const S1 = 10, S2 = 12.5, VH = 33, VL = 11, IH1 = S1 * 1000 / (R3 * VH), IH2 = S2 * 1000 / (R3 * VH), IL1 = S1 * 1000 / (R3 * VL), IL2 = S2 * 1000 / (R3 * VL), Ld = 9;
    const rows = [['ONAN', S1, IH1, IL1], ['ONAF', S2, IH2, IL2]].map((r) => [r[0], g4(r[1]) + ' MVA', g4(r[2]) + ' A', g4(r[3]) + ' A']);
    A.push({
      slug: 'transformer-cooling-rating-formulas', h1: 'Transformer Cooling Class Rating Formulas',
      desc: 'Transformer cooling formulas: the ONAN and ONAF ratings, the line currents at each rating and the loading of a transformer as a share of each rating.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Rating with fans', 'SONAF = SONAN × k'], ['Line current at a rating', 'I = S × 1000 / (√3 × V), with S in MVA and V in kV'], ['Loading', 'loading % = load / rating × 100']]) +
        '<p class="note">ONAN is oil natural, air natural cooling and ONAF is oil natural, air forced cooling with fans. The fans raise the rating by the factor k, often 1.2 to 1.33 for the first stage, and a second stage with pumps has its own factor. The ratings, and so the factor, are on the nameplate, and the page uses 12.5 / 10 = 1.25 as an example. The currents are the line currents at the rated voltage. The overload time and the loss of life with the load are separate questions that the loading guide of the standard answers. The values here are examples.</p>' +
        '<h2>Worked example: a 10 / 12.5 MVA, 33 / 11 kV transformer</h2>' +
        steps(['HV current at ONAN: I = 10,000 / (√3 × 33) = ' + g4(IH1) + ' A, and at ONAF: I = 12,500 / (√3 × 33) = ' + g4(IH2) + ' A', 'LV current at ONAN: I = 10,000 / (√3 × 11) = ' + g4(IL1) + ' A, and at ONAF: I = 12,500 / (√3 × 11) = ' + g4(IL2) + ' A', 'A 9 MVA load is 9 / 10 = ' + g4(Ld / S1 * 100) + '% of the ONAN rating and 9 / 12.5 = ' + g4(Ld / S2 * 100) + '% of the ONAF rating']) +
        '<h2>Ratings and line currents</h2>' + table(['Cooling', 'Rating', 'HV current (33 kV)', 'LV current (11 kV)'], rows),
      faq: [
        ['What does ONAN mean?', 'The first two letters give the cooling liquid (O for oil) and how it moves (N for natural). The last two give the outer coolant (A for air) and how it moves (N for natural, F for forced).'],
        ['Why does the rating rise with fans?', 'Fans carry more heat from the radiators, so the same temperature rise allows a higher load.'],
        ['Which rating do I use to size the protection?', 'The protection and the cables follow the highest rating that the transformer will carry, so use the ONAF current if the fans will run.'],
        ['What if the fans fail?', 'The transformer is limited to the ONAN rating, or to a time-limited load, depending on the maker and the temperature alarms.']],
      related: [['transformer-formulas.html', 'Transformer Formulas'], ['transformer-efficiency-formulas.html', 'Transformer Efficiency Formulas'], ['parallel-transformer-formulas.html', 'Parallel Transformer Load Sharing Formulas'], ['../calculators/transformer-engineering/', 'Transformer engineering calculators']]
    });
    A[A.length - 1].check = { IH1, IH2, IL1, IL2 };
  }

  /* ---------- 114. energy meter multiplier ---------- */
  {
    const Kc = 1000, N = 10, t = 20, Pm = 3600 * N / (t * Kc), m1 = (400 / 5) * 1, Pl = Pm * m1, m2 = (200 / 5) * (11000 / 110), dE = 12.5, E2 = dE * m2;
    const rows = [100, 200, 400, 800].map((c) => [c + ' / 5', g4(c / 5), g4(c / 5 * 1) + ' kW']);
    A.push({
      slug: 'energy-meter-multiplier-formulas', h1: 'Energy Meter Multiplier Formulas',
      desc: 'Energy meter formulas: the multiplier of a CT and VT meter, the load from the pulse rate and the energy from the difference of two readings.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Multiplier', 'M = (CT primary / CT secondary) × (VT primary / VT secondary)'], ['Power from pulses', 'P = 3600 × N / (t × Kc)'], ['Load', 'Pload = Pmeter × M'], ['Energy', 'Eload = (reading difference) × M']]) +
        '<p class="note">N is the number of pulses counted in t seconds, Kc the meter constant in pulses per kWh and M the multiplier that scales the meter value to the real value in the primary circuit. A meter with a direct connection to the supply has a multiplier of 1, and a meter on a current transformer alone has a VT ratio of 1. Some meters show the primary value and apply the ratios inside, so read the nameplate or the display before applying M again. The meter constant, the ratios and the readings here are examples.</p>' +
        '<h2>Worked example: pulses on a meter with a 400 / 5 CT</h2><p>Kc = 1,000 pulses per kWh, and 10 pulses in 20 s.</p>' +
        steps(['At the meter, P = 3600 × 10 / (20 × 1000) = ' + g4(Pm) + ' kW', 'M = (400 / 5) × 1 = ' + g4(m1), 'Load = ' + g4(Pm) + ' × ' + g4(m1) + ' = ' + g4(Pl) + ' kW']) +
        '<h2>Worked example: a meter on a 200 / 5 CT and an 11,000 / 110 V VT</h2><p>The reading rose by 12.5 kWh.</p>' +
        steps(['M = (200 / 5) × (11,000 / 110) = ' + g4(m2), 'Energy = 12.5 × ' + g4(m2) + ' = ' + g4(E2) + ' kWh']) +
        '<h2>Multiplier of a CT-only meter by CT ratio</h2>' + table(['CT ratio', 'Multiplier', 'Primary load for 1 kW at the meter'], rows.map((r) => [r[0], r[1], r[2]])),
      faq: [
        ['Why does a meter need a multiplier?', 'The meter sees a small current and voltage from the instrument transformers, so its reading is a fraction of the real value. The multiplier restores the full value.'],
        ['What is the meter constant?', 'The number of pulses that the meter output gives for each kWh. It is on the nameplate.'],
        ['How can I check the load with a stopwatch?', 'Count the pulses over a known time, apply the formula, and multiply by the multiplier. The method suits steady loads.'],
        ['Does the multiplier change the billing?', 'Yes. The billed energy is the reading difference times the multiplier, so a wrong multiplier gives a wrong bill.']],
      related: [['ct-burden-formulas.html', 'CT Burden Formulas'], ['energy-cost-formulas.html', 'Energy and Cost Formulas'], ['demand-load-factor-formulas.html', 'Demand, Load and Diversity Factor Formulas'], ['../calculators/power-and-energy/', 'Power and energy calculators']]
    });
    A[A.length - 1].check = { Pm, m1, Pl, m2, E2 };
  }

  /* ---------- 115. overcurrent relay curves ---------- */
  {
    const Is = 100, I = 500, tms = 0.2, m = I / Is, cur = { SI: [0.14, 0.02], VI: [13.5, 1], EI: [80, 2], LTI: [120, 1] }, tt = (c, mm, k) => k * cur[c][0] / (Math.pow(mm, cur[c][1]) - 1);
    const tSI = tt('SI', m, tms), tVI = tt('VI', m, tms), tEI = tt('EI', m, tms);
    const rows = [2, 5, 10, 20].map((x) => [String(x), g4(tt('SI', x, 1)) + ' s', g4(tt('VI', x, 1)) + ' s', g4(tt('EI', x, 1)) + ' s']);
    A.push({
      slug: 'overcurrent-relay-formulas', h1: 'Overcurrent Relay Curve Formulas',
      desc: 'Overcurrent relay formulas: the IEC operating time for the standard, very and extremely inverse curves from the current multiple and the time multiplier.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Operating time', 't = TMS × k / ((I / Is)^α − 1)'], ['Standard inverse (SI)', 'k = 0.14, α = 0.02'], ['Very inverse (VI)', 'k = 13.5, α = 1'], ['Extremely inverse (EI)', 'k = 80, α = 2'], ['Long-time inverse (LTI)', 'k = 120, α = 1']]) +
        '<p class="note">I is the fault current seen by the relay, Is the pick-up setting in the same unit and TMS the time multiplier setting. The constants are those of the IEC 60255 curves. The relay does not operate at a current of Is or less, and the time falls as the multiple I / Is rises. The settings come from a co-ordination study that grades each relay against the next one, with a margin for the breaker time and the errors, and a relay maker may show a different curve shape. The currents and settings here are examples.</p>' +
        '<h2>Worked example: pick-up 100 A, fault 500 A, TMS 0.2</h2>' +
        steps(['I / Is = 500 / 100 = ' + g4(m), 'Standard inverse: t = 0.2 × 0.14 / (5^0.02 − 1) = ' + g4(tSI) + ' s', 'Very inverse: t = 0.2 × 13.5 / (5 − 1) = ' + g4(tVI) + ' s', 'Extremely inverse: t = 0.2 × 80 / (5² − 1) = ' + g4(tEI) + ' s']) +
        '<h2>Operating time for TMS = 1 by current multiple</h2>' + table(['I / Is', 'Standard inverse', 'Very inverse', 'Extremely inverse'], rows),
      faq: [
        ['What does the time multiplier do?', 'It scales the whole curve. A TMS of 0.5 gives half the time of a TMS of 1 at every current.'],
        ['When is a very or extremely inverse curve chosen?', 'When the fault current falls off quickly with the distance from the source, so a steep curve separates the relays well. A fuse or a thermal load may also call for a steep one.'],
        ['What is the grading margin?', 'The time between the operation of a relay and its back-up, to allow for the breaker time and the errors. The study and the standard give the value.'],
        ['Is the instantaneous element separate?', 'Yes. A high set element trips with no delay above its own setting, and the curve covers the lower currents.']],
      related: [['circuit-breaker-formulas.html', 'Circuit Breaker Formulas'], ['short-circuit-formulas.html', 'Short-Circuit Formulas'], ['ct-burden-formulas.html', 'CT Burden Formulas'], ['../calculators/electrical-protection/', 'Electrical protection calculators']]
    });
    A[A.length - 1].check = { tSI, tVI, tEI };
  }


  /* ---------- 116. single-tuned harmonic filter ---------- */
  {
    const V = 400, Qc = 100, h = 4.7, f1 = 50, Xc = V * V / (Qc * 1000), XL = Xc / (h * h), L = XL / (2 * Math.PI * f1) * 1000, ftune = h * f1, Qf = V * V / (Xc - XL) / 1000, Vcap = V * h * h / (h * h - 1);
    const rows = [3.8, 4.7, 6.7, 10.7].map((x) => [String(x), g4(x * 50) + ' Hz', g4(100 / (x * x)) + '%', g4(x * x / (x * x - 1))]);
    A.push({
      slug: 'harmonic-filter-formulas', h1: 'Single-Tuned Harmonic Filter Formulas',
      desc: 'Single-tuned harmonic filter formulas: the reactor from the capacitor and the tuning order, the tuned frequency, the fundamental kVAR and the capacitor voltage.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Capacitor reactance', 'Xc = V² / (Qc × 1000), with Qc in kVAR and V in volts'], ['Reactor reactance', 'XL = Xc / h²'], ['Reactor inductance', 'L = XL / (2π × f1)'], ['Tuned frequency', 'ftune = h × f1'], ['Fundamental kVAR of the filter', 'Qf = V² / (Xc − XL) / 1000 = Qc × h² / (h² − 1)'], ['Capacitor voltage', 'Vc = V × h² / (h² − 1)']]) +
        '<p class=\"note\">V is the line voltage, Qc the rating of the capacitor at that voltage, f1 the supply frequency and h the order at which the filter is tuned. A filter is tuned a little below the harmonic it must absorb, for example 4.7 for the 5th and 6.7 for the 7th, so that a drift of the parts does not move the resonance onto the harmonic. At the fundamental the capacitor and reactor together are capacitive, so the filter supplies more kVAR than the capacitor alone and the capacitor sees a higher voltage. The filter also needs a rating for the harmonic current that it carries, which comes from a harmonic study, and the maker confirms the parts. The values here are examples.</p>' +
        '<h2>Worked example: a 100 kVAR, 400 V capacitor tuned to h = 4.7 on a 50 Hz supply</h2>' +
        steps(['Xc = 400² / 100,000 = ' + g4(Xc) + ' Ω', 'XL = ' + g4(Xc) + ' / 4.7² = ' + g4(XL) + ' Ω', 'L = ' + g4(XL) + ' / (2π × 50) = ' + g4(L) + ' mH', 'ftune = 4.7 × 50 = ' + g4(ftune) + ' Hz', 'Qf = 400² / (' + g4(Xc) + ' − ' + g4(XL) + ') / 1000 = ' + g4(Qf) + ' kVAR', 'Vc = 400 × 4.7² / (4.7² − 1) = ' + g4(Vcap) + ' V']) +
        '<h2>Tuning order, reactor share and kVAR factor</h2>' + table(['Order h', 'Tuned frequency at 50 Hz', 'XL as a share of Xc', 'Qf / Qc'], rows),
      faq: [
        ['Why tune below the harmonic and not on it?', 'Capacitor tolerance, ageing and temperature move the tuned frequency. A filter tuned exactly on the 5th could drift above it and cause a parallel resonance with the supply.'],
        ['How does a filter differ from a detuning reactor?', 'A detuning reactor is tuned well below the lowest harmonic, so the bank never absorbs it. A filter is tuned close to a harmonic on purpose, so it takes that current out of the supply.'],
        ['Why is the capacitor voltage higher than the line voltage?', 'The reactor and the capacitor form a voltage divider at the fundamental, with the reactor in opposition, so the capacitor voltage rises by the factor h² / (h² − 1).'],
        ['What else decides the size?', 'The harmonic current to absorb, the short-circuit level of the supply and the kVAR that the plant needs. A harmonic study gives the final design.']],
      related: [['detuning-reactor-formulas.html', 'Detuning Reactor Formulas'], ['harmonics-formulas.html', 'Harmonics Formulas'], ['capacitor-formulas.html', 'Capacitor Formulas'], ['../calculators/power-systems/', 'Power systems calculators']]
    });
    A[A.length - 1].check = { Xc, XL, L, ftune, Qf, Vcap };
  }

  /* ---------- 117. cable sheath circulating current ---------- */
  {
    const f = 50, w = 2 * Math.PI * f, Xm = 2 * w * 1e-7 * Math.log(2) * 1000, Rs = 0.3, I = 400, ratio = Xm / Math.sqrt(Rs * Rs + Xm * Xm), Is = I * ratio, loss = Is * Is * Rs;
    const rows = [0.1, 0.3, 0.6, 1].map((r) => [g4(r) + ' Ω/km', g4(Xm / Math.sqrt(r * r + Xm * Xm) * 100) + '%']);
    A.push({
      slug: 'sheath-current-formulas', h1: 'Cable Sheath Circulating Current Formulas',
      desc: 'Sheath circulating current formulas for single-core cables bonded at both ends: the mutual reactance in trefoil, the sheath current and the sheath loss.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Mutual reactance, trefoil', 'Xm = 2 × ω × 10⁻⁷ × ln 2 × 1000 Ω/km, with ω = 2π × f'], ['Sheath current, both ends bonded', 'Is = I × Xm / √(Rs² + Xm²)'], ['Sheath loss per cable', 'Ws = Is² × Rs, in W/km'], ['Sheath current, single-point bonding', 'Is ≈ 0 (no closed loop)']]) +
        '<p class=\"note\">I is the conductor current, Rs the resistance of the sheath or screen in Ω/km at its working temperature and Xm the mutual reactance between a conductor and its sheath. The formula is for three single-core cables in trefoil with equal currents, where the spacing equals the sheath diameter, so the term ln(2s / d) becomes ln 2. For cables in flat formation the sheath currents differ from cable to cable, and the standard IEC 60287 gives the full method. The sheath current heats the cable, so it lowers the current rating, which is why long runs use single-point or cross bonding. The resistance and the current here are examples.</p>' +
        '<h2>Worked example: 400 A in a trefoil group at 50 Hz, sheath resistance 0.3 Ω/km</h2>' +
        steps(['ω = 2π × 50 = ' + g4(w) + ' rad/s', 'Xm = 2 × ' + g4(w) + ' × 10⁻⁷ × ln 2 × 1000 = ' + g4(Xm) + ' Ω/km', 'Is / I = ' + g4(Xm) + ' / √(0.3² + ' + g4(Xm) + '²) = ' + g4(ratio), 'Is = 400 × ' + g4(ratio) + ' = ' + g4(Is) + ' A', 'Ws = ' + g4(Is) + '² × 0.3 = ' + g4(loss) + ' W/km per cable']) +
        '<h2>Sheath current share by sheath resistance (Xm as above)</h2>' + table(['Sheath resistance', 'Is / I'], rows),
      faq: [
        ['Why does a current flow in the sheath at all?', 'The conductor current makes a magnetic field that links the sheath loop. If the sheaths are joined at both ends, the field drives a current round that loop, like the secondary of a transformer.'],
        ['How is it avoided?', 'By bonding the sheaths at one point only, or by cross bonding them in sections so that the three induced voltages cancel. The choice depends on the length and the sheath voltage limit.'],
        ['Why is a low sheath resistance worse here?', 'With a small Rs the sheath current rises toward the conductor current. A sheath of high resistance carries less current, but it loses more power per ampere.'],
        ['Does the loss matter for the rating?', 'Yes. The sheath loss is heat that the cable must shed, so it lowers the current that the cable can carry. The rating method of the standard includes it.']],
      related: [['skin-effect-formulas.html', 'Skin Effect Formulas'], ['cable-charging-current-formulas.html', 'Cable Charging Current Formulas'], ['conductor-resistance-formulas.html', 'Conductor Resistance Formulas'], ['../calculators/cable-engineering/', 'Cable engineering calculators']]
    });
    A[A.length - 1].check = { Xm, ratio, Is, loss };
  }

  /* ---------- 118. differential protection slope ---------- */
  {
    const S = 10, VH = 33, VL = 11, ctH = 200, ctL = 600, IH = S * 1000 / (R3 * VH), IL = S * 1000 / (R3 * VL), sH = IH / ctH, sL = IL / ctL;
    const a1 = 1.0, a2 = 0.96, Id1 = Math.abs(a1 - a2), Ir1 = (a1 + a2) / 2, k1 = Id1 / Ir1 * 100;
    const b1 = 3, b2 = 0, Id2 = Math.abs(b1 - b2), Ir2 = (b1 + b2) / 2, k2 = Id2 / Ir2 * 100;
    const Imin = 0.2, K = 0.25, rows = [1, 2, 5, 10].map((x) => [String(x), g4(Imin + K * x)]);
    A.push({
      slug: 'differential-protection-formulas', h1: 'Differential Protection Slope Formulas',
      desc: 'Transformer differential protection formulas: CT secondary currents, the differential and restraint currents, the slope and the operating threshold.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Line current of the transformer', 'I = S × 1000 / (√3 × V), with S in MVA and V in kV'], ['CT secondary current', 'Isec = I / (CT primary / CT secondary)'], ['Differential current', 'Id = |I1 − I2|, the currents taken into the zone'], ['Restraint current', 'Ir = (|I1| + |I2|) / 2'], ['Slope', 'slope % = Id / Ir × 100'], ['Operating threshold', 'Id(op) = Imin + K × Ir']]) +
        '<p class=\"note\">I1 and I2 are the secondary currents of the two sets of CTs after they are matched in size and phase, so that they are equal for a through load. The relay trips when Id is above the threshold set by the minimum pick-up Imin and the slope K, which gives room for the CT errors, the tap changer range and the magnetising current. Relay makers use a single or a dual slope, different restraint formulas and harmonic blocking for the inrush, so the setting guide of the relay decides. The ratings, the CT ratios and the settings here are examples.</p>' +
        '<h2>Worked example: CT secondary currents of a 10 MVA, 33 / 11 kV transformer</h2><p>CT ratios of 200 / 1 on the HV side and 600 / 1 on the LV side.</p>' +
        steps(['HV line current = 10,000 / (√3 × 33) = ' + g4(IH) + ' A, so the CT secondary current is ' + g4(IH) + ' / 200 = ' + g4(sH) + ' A', 'LV line current = 10,000 / (√3 × 11) = ' + g4(IL) + ' A, so the CT secondary current is ' + g4(IL) + ' / 600 = ' + g4(sL) + ' A', 'The two currents agree to within 0.01%, so the ratios match without a correction']) +
        '<h2>Worked example: a through fault with a CT error</h2><p>The secondary currents are 1.00 A and 0.96 A.</p>' +
        steps(['Id = |1.00 − 0.96| = ' + g4(Id1) + ' A', 'Ir = (1.00 + 0.96) / 2 = ' + g4(Ir1) + ' A', 'slope = ' + g4(Id1) + ' / ' + g4(Ir1) + ' × 100 = ' + g4(k1) + '%, below a setting of 25%, so the relay restrains']) +
        '<h2>Worked example: an internal fault fed from one side</h2><p>The secondary currents are 3 A and 0 A.</p>' +
        steps(['Id = |3 − 0| = ' + g4(Id2) + ' A', 'Ir = (3 + 0) / 2 = ' + g4(Ir2) + ' A', 'slope = ' + g4(Id2) + ' / ' + g4(Ir2) + ' × 100 = ' + g4(k2) + '%, well above 25%, so the relay trips']) +
        '<h2>Operating threshold for Imin = 0.2 A and K = 25%</h2>' + table(['Restraint current Ir (A)', 'Id(op) (A)'], rows),
      faq: [
        ['Why is a restraint needed?', 'The CTs do not reproduce a large through current exactly, and a tap changer shifts the ratio. Without restraint, these errors would trip the relay on a fault outside the zone.'],
        ['What does the slope set?', 'It sets how much of the restraint current may show up as differential current before the relay trips. A high slope gives more stability and less sensitivity to a small internal fault.'],
        ['Why is the current matched in phase for a delta-star transformer?', 'The delta winding shifts the phase by 30°. Digital relays correct this inside, and older relays used CT connections of the opposite type.'],
        ['What blocks a trip on inrush?', 'A second harmonic restraint. The magnetising inrush of a transformer is rich in the second harmonic, and the relay blocks when that share is high.']],
      related: [['transformer-formulas.html', 'Transformer Formulas'], ['ct-burden-formulas.html', 'CT Burden Formulas'], ['overcurrent-relay-formulas.html', 'Overcurrent Relay Curve Formulas'], ['../calculators/electrical-protection/', 'Electrical protection calculators']]
    });
    A[A.length - 1].check = { IH, IL, sH, sL, Id1, Ir1, k1, Id2, Ir2, k2 };
  }

  /* ---------- 119. earth electrode spacing ---------- */
  {
    const rho = 100, Lr = 3, d = 0.016, R1 = rho / (2 * Math.PI * Lr) * (Math.log(8 * Lr / d) - 1);
    const two = (s) => { const lam = rho / (2 * Math.PI * R1 * s); return { lam, R: R1 / 2 * (1 + lam), eta: 1 / (1 + lam) }; };
    const e3 = two(3), e6 = two(6);
    const rows = [3, 6, 9, 12].map((s) => { const e = two(s); return [s + ' m', g4(e.R) + ' Ω', g4(e.eta * 100) + '%']; });
    A.push({
      slug: 'earth-electrode-spacing-formulas', h1: 'Earth Electrode Spacing Formulas',
      desc: 'Earth electrode spacing formulas: two rods in parallel, the interaction factor, the combined resistance and the utilisation of each rod at a given spacing.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Single rod', 'R1 = ρ / (2π × L) × (ln(8L / d) − 1)'], ['Interaction factor, two rods', 'λ = ρ / (2π × R1 × s)'], ['Two rods in parallel', 'R2 = R1 / 2 × (1 + λ)'], ['Utilisation', 'η = R1 / (2 × R2) = 1 / (1 + λ)']]) +
        '<p class=\"note\">ρ is the soil resistivity in Ω·m, L the driven length and d the diameter of the rod in metres, and s the distance between the two rods. The rods share the same ground, so their fields overlap and the pair is worth less than two separate rods, by the factor 1 + λ. The overlap falls as s rises, and a spacing of at least the length of the rod is the usual guide. The formulas assume a uniform soil and the same two rods, and a design with more rods or a grid needs a method for that layout. The resistivity and the sizes here are examples.</p>' +
        '<h2>Worked example: two 3 m rods of 16 mm in soil of 100 Ω·m</h2>' +
        steps(['R1 = 100 / (2π × 3) × (ln(8 × 3 / 0.016) − 1) = ' + g4(R1) + ' Ω', 'At s = 3 m: λ = 100 / (2π × ' + g4(R1) + ' × 3) = ' + g4(e3.lam), 'R2 = ' + g4(R1) + ' / 2 × (1 + ' + g4(e3.lam) + ') = ' + g4(e3.R) + ' Ω', 'At s = 6 m: λ = ' + g4(e6.lam) + ', so R2 = ' + g4(e6.R) + ' Ω', 'Doubling the spacing from 3 m to 6 m lowers the pair from ' + g4(e3.R) + ' Ω to ' + g4(e6.R) + ' Ω']) +
        '<h2>Two rods by spacing</h2>' + table(['Spacing', 'Resistance of the pair', 'Utilisation of each rod'], rows),
      faq: [
        ['Why not put the rods close together?', 'Close rods share the same soil volume, so each one raises the potential near the other and the pair resists almost as much as one rod.'],
        ['Is more spacing always better?', 'It helps, but with falling returns. Beyond about twice the length the gain is small, and the link between the rods gets longer and dearer.'],
        ['Is a second rod better than a longer rod?', 'A deeper rod often does more where the lower layers of soil are wetter. A site test of the soil layers settles it.'],
        ['Does this replace a measurement?', 'No. The formulas give a first estimate. The resistance of the finished earth must be measured, and the seasons change it.']],
      related: [['earthing-formulas.html', 'Earthing Formulas'], ['step-touch-voltage-formulas.html', 'Step and Touch Voltage Formulas'], ['lightning-protection-formulas.html', 'Lightning Protection Formulas'], ['../calculators/earth-resistance/', 'Earth resistance calculators']]
    });
    A[A.length - 1].check = { R1, lam3: e3.lam, R3m: e3.R, lam6: e6.lam, R6m: e6.R, eta3: e3.eta };
  }

  /* ---------- 120. solar row spacing ---------- */
  {
    const lat = 30, decl = 23.45, alt = 90 - lat - decl, beta = 25, Lm = 2.28, h = Lm * Math.sin(beta * DEG), foot = Lm * Math.cos(beta * DEG), shadow = h / Math.tan(alt * DEG), pitch = foot + shadow, gcr = Lm / pitch;
    const rows = [10, 20, 30, 40].map((la) => { const al = 90 - la - decl, p = Lm * (Math.cos(beta * DEG) + Math.sin(beta * DEG) / Math.tan(al * DEG)); return [la + '°', g4(al) + '°', g4(p) + ' m', g4(Lm / p)]; });
    A.push({
      slug: 'solar-row-spacing-formulas', h1: 'Solar Array Row Spacing Formulas',
      desc: 'Solar row spacing formulas: the solar altitude at the winter solstice, the shadow length, the row pitch for no shading and the ground coverage ratio.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Solar altitude at noon on the winter solstice', 'α = 90° − latitude − 23.45°'], ['Height of the top edge', 'h = L × sin β'], ['Footprint of a row', 'F = L × cos β'], ['Shadow length', 'd = h / tan α'], ['Row pitch', 'P = F + d = L × sin(α + β) / sin α'], ['Ground coverage ratio', 'GCR = L / P']]) +
        '<p class=\"note\">L is the length of the module row along the slope, β the tilt, α the solar altitude and latitude the site latitude in degrees for the northern hemisphere with the rows facing south. The design is for no shading at solar noon on the shortest day. Many designers choose a longer window, such as 9:00 to 15:00, which needs a larger pitch, and a site with trackers or a slope has its own rules. A smaller spacing is a trade of land against some shading loss that a yield study can price. The latitude, the tilt and the module size here are examples.</p>' +
        '<h2>Worked example: a row of length 2.28 m at a tilt of 25° at latitude 30°</h2>' +
        steps(['α = 90° − 30° − 23.45° = ' + g4(alt) + '°', 'h = 2.28 × sin 25° = ' + g4(h) + ' m, and F = 2.28 × cos 25° = ' + g4(foot) + ' m', 'd = ' + g4(h) + ' / tan ' + g4(alt) + '° = ' + g4(shadow) + ' m', 'P = ' + g4(foot) + ' + ' + g4(shadow) + ' = ' + g4(pitch) + ' m', 'GCR = 2.28 / ' + g4(pitch) + ' = ' + g4(gcr)]) +
        '<h2>Pitch by latitude for the same row and a tilt of 25°</h2>' + table(['Latitude', 'Solar altitude', 'Row pitch', 'GCR'], rows),
      faq: [
        ['Why use the winter solstice?', 'The sun is lowest then, so the shadows are longest. A spacing that clears the shadow at noon on that day clears it on every other day at noon.'],
        ['What changes in the southern hemisphere?', 'The rows face north and the shortest day is in June. The formula then uses the latitude as a positive number with the same 23.45° term.'],
        ['What happens if the rows are closer?', 'The back row is shaded in the early and late hours of the winter days. The loss depends on the bypass diodes and the string layout, so a yield study should price it.'],
        ['Does a lower tilt help?', 'Yes. A lower tilt gives a lower top edge and a shorter shadow, so the rows can sit closer, at the cost of some yield per module.']],
      related: [['solar-pv-formulas.html', 'Solar PV Formulas'], ['solar-panel-temperature-formulas.html', 'Solar Panel Temperature Derating Formulas'], ['solar-dc-ac-ratio-formulas.html', 'Solar DC to AC Ratio Formulas'], ['../calculators/solar-pv-sizing/', 'Solar PV sizing calculators']]
    });
    A[A.length - 1].check = { alt, h, foot, shadow, pitch, gcr };
  }

  /* ---------- 121. DC lighting voltage drop ---------- */
  {
    const rho = 1.72e-8, V = 24, Pl = 50, I = Pl / V, A1 = 1.5, L1 = 10, r1 = rho / (A1 * 1e-6), dV = 2 * I * r1 * L1, pc = dV / V * 100, Lmax = 0.03 * V * (A1 * 1e-6) / (2 * I * rho);
    const It = 72 / V, A2 = 2.5, L2 = 5, r2 = rho / (A2 * 1e-6), dEnd = 2 * It * r2 * L2, dDist = dEnd / 2;
    const rows = [5, 10, 20, 30].map((l) => [l + ' m', g4(2 * I * r1 * l) + ' V', g4(2 * I * r1 * l / V * 100) + '%']);
    A.push({
      slug: 'dc-lighting-voltage-drop-formulas', h1: 'DC Lighting Voltage Drop Formulas',
      desc: 'DC lighting voltage drop formulas: the loop drop of a two-wire run, the drop as a share of the supply, the longest run for a limit and a distributed strip load.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Load current', 'I = P / V'], ['Resistance of one conductor', 'r = ρ / A, in Ω per metre with A in m²'], ['Drop in the two-wire loop, load at the end', 'ΔV = 2 × I × r × L'], ['Drop as a share of the supply', 'ΔV% = ΔV / V × 100'], ['Longest run for a drop limit', 'Lmax = limit × V × A / (2 × I × ρ)'], ['Drop for a load spread evenly along the run', 'ΔV = I × r × L, half the end-load value']]) +
        '<p class=\"note\">P is the load power, V the supply voltage, ρ the resistivity of the conductor (1.72 × 10⁻⁸ Ω·m for copper at about 20 °C), A the cross-section and L the one-way length. The factor 2 counts the supply and the return conductor. A hot cable has a higher resistance than the cold value. A constant-current LED driver keeps its output current while the voltage falls, but a fixture on a plain constant-voltage supply gets less voltage and may dim or fail to start. The limit of 3% and the loads here are examples, and the standard or the fixture maker sets the real limit.</p>' +
        '<h2>Worked example: a 50 W fixture on a 24 V supply, 10 m of 1.5 mm² copper</h2>' +
        steps(['I = 50 / 24 = ' + g4(I) + ' A', 'r = 1.72 × 10⁻⁸ / (1.5 × 10⁻⁶) = ' + g4(r1) + ' Ω/m', 'ΔV = 2 × ' + g4(I) + ' × ' + g4(r1) + ' × 10 = ' + g4(dV) + ' V, which is ' + g4(pc) + '% of 24 V', 'For a limit of 3%, Lmax = 0.03 × 24 × 1.5 × 10⁻⁶ / (2 × ' + g4(I) + ' × 1.72 × 10⁻⁸) = ' + g4(Lmax) + ' m']) +
        '<h2>Worked example: a 72 W LED strip on 24 V, fed at one end with 5 m of 2.5 mm² copper</h2>' +
        steps(['I = 72 / 24 = ' + g4(It) + ' A, and r = 1.72 × 10⁻⁸ / (2.5 × 10⁻⁶) = ' + g4(r2) + ' Ω/m', 'With the whole load at the far end, ΔV = 2 × ' + g4(It) + ' × ' + g4(r2) + ' × 5 = ' + g4(dEnd) + ' V', 'With the load spread evenly along the 5 m, ΔV = ' + g4(dDist) + ' V']) +
        '<h2>Drop for the 50 W fixture on 1.5 mm² copper at 24 V</h2>' + table(['Run length', 'Drop', 'Share of 24 V'], rows),
      faq: [
        ['Why does low voltage lighting drop so much?', 'The same power needs a larger current at a lower voltage, and the drop grows with the current. A 12 V run drops twice the volts of a 24 V run for the same watts, which is four times the share.'],
        ['What helps most?', 'A larger cross-section, a shorter run, or a higher supply voltage. Feeding a long strip from both ends or in sections also cuts the drop.'],
        ['Does the drop matter for a constant-current driver?', 'The driver holds the current as long as its voltage range is not exceeded, so the drop between the driver and the LEDs only wastes power. The drop on the mains side of the driver is a different question.'],
        ['Which resistivity should I use?', 'Use the value for the conductor temperature. The data sheet of the cable gives its resistance per kilometre, which is a little higher than the textbook value because of stranding.']],
      related: [['voltage-drop-formulas.html', 'Voltage Drop Formulas'], ['led-formulas.html', 'LED Formulas'], ['conductor-resistance-formulas.html', 'Conductor Resistance Formulas'], ['../calculators/lighting-and-facilities/', 'Lighting and facilities calculators']]
    });
    A[A.length - 1].check = { I, r1, dV, pc, Lmax, It, r2, dEnd, dDist };
  }


  /* ---------- 122. transformer loss of life ---------- */
  {
    const faa = (t) => Math.exp(15000 / 383 - 15000 / (t + 273)), tA = 30, dTO = 55, dTH = 25, tH = tA + dTO + dTH, F1 = faa(tH), tH2 = 130, F2 = faa(tH2), life = 180000, L2 = life / F2;
    const rows = [98, 110, 120, 130, 140].map((t) => [t + ' °C', g4(faa(t)), g4(life / faa(t) / 8760) + ' years']);
    A.push({
      slug: 'transformer-loss-of-life-formulas', h1: 'Transformer Loss of Life Formulas',
      desc: 'Transformer ageing formulas: the hot-spot temperature, the ageing acceleration factor from the IEEE loading guide and the life at a steady hot-spot temperature.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Hot-spot temperature', 'θH = θA + ΔθTO + ΔθH'], ['Ageing acceleration factor', 'FAA = exp(15000 / 383 − 15000 / (θH + 273))'], ['Life at a steady hot spot', 'life = normal life / FAA'], ['Equivalent ageing in a day', 'hours of life used = 24 × FAA']]) +
        '<note-placeholder>' +
        '<h2>Worked example: 30 °C ambient, 55 K top-oil rise and 25 K hot-spot gradient</h2>' +
        steps(['θH = 30 + 55 + 25 = ' + g4(tH) + ' °C', 'FAA = exp(15000 / 383 − 15000 / (' + g4(tH) + ' + 273)) = ' + g4(F1) + ', so the insulation ages at the normal rate']) +
        '<h2>Worked example: a hot spot of 130 °C held for a day</h2>' +
        steps(['FAA = exp(15000 / 383 − 15000 / (130 + 273)) = ' + g4(F2), 'Hours of life used in 24 h = 24 × ' + g4(F2) + ' = ' + g4(24 * F2) + ' h', 'With a normal life of 180,000 h, the life at this temperature is 180,000 / ' + g4(F2) + ' = ' + g4(L2) + ' h']) +
        '<h2>Ageing factor and life by hot-spot temperature</h2>' + table(['Hot-spot temperature', 'FAA', 'Life for 180,000 h normal life'], rows),
      faq: [
        ['Why is 110 °C the reference?', 'The loading guide takes 110 °C as the hot-spot temperature at which thermally upgraded paper ages at the normal rate, so FAA is 1 there.'],
        ['What does a factor above 1 mean?', 'The insulation is using up its life faster than normal. A factor of 7 means a day at that temperature costs about a week of life.'],
        ['Can a cool period make up for a hot one?', 'Yes, in the sense that the ageing adds up over time. The equivalent ageing over a load cycle is the average of FAA weighted by time.'],
        ['What defines the end of life?', 'The loading guide gives limits such as a fall in the strength of the paper. The normal life used here is an example, and the standard and the maker give the figures.']],
      related: [['transformer-cooling-rating-formulas.html', 'Transformer Cooling Class Rating Formulas'], ['transformer-efficiency-formulas.html', 'Transformer Efficiency Formulas'], ['motor-temperature-rise-formulas.html', 'Motor Temperature Rise Formulas'], ['../calculators/transformer-engineering/', 'Transformer engineering calculators']]
    });
    A[A.length - 1].inner = A[A.length - 1].inner.replace('<note-placeholder>', '<p class="note">θA is the ambient temperature, ΔθTO the top-oil rise over ambient and ΔθH the hot-spot rise over the top oil, all in °C or K as the case may be. The formula is the one of the IEEE loading guide C57.91 for thermally upgraded paper, and it takes the hot spot at 110 °C as the normal rate of ageing. Other insulation systems and other editions use other constants, and the temperatures come from the heat-run test and the loading calculation of the maker. The normal life of 180,000 h is the usual figure of the guide and is only an example here.</p>');
    A[A.length - 1].check = { tH, F1, F2, L2 };
  }

  /* ---------- 123. motor start voltage dip at the cable ---------- */
  {
    const V = 415, In = 95, ratio = 6, Ist = In * ratio, L = 0.15, rho = 1.72e-8, S = 70, r = rho / (S * 1e-6) * 1000, x = 0.08, pfs = 0.3, sn = Math.sqrt(1 - pfs * pfs);
    const dV = R3 * Ist * L * (r * pfs + x * sn), pc = dV / V * 100, lim = 10, Lmax = lim / 100 * V / (R3 * Ist * (r * pfs + x * sn));
    const rows = [50, 100, 150, 200].map((l) => [l + ' m', g4(R3 * Ist * l / 1000 * (r * pfs + x * sn)) + ' V', g4(R3 * Ist * l / 1000 * (r * pfs + x * sn) / V * 100) + '%']);
    A.push({
      slug: 'motor-start-voltage-dip-formulas', h1: 'Motor Start Voltage Dip in the Cable Formulas',
      desc: 'Motor starting voltage drop formulas: the starting current, the drop in the supply cable at the starting power factor and the longest cable for a dip limit.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Starting current', 'Ist = k × In'], ['Cable drop while starting', 'ΔV = √3 × Ist × L × (r × cos φs + x × sin φs)'], ['Drop as a share of the supply', 'ΔV% = ΔV / V × 100'], ['Longest cable for a limit', 'Lmax = limit × V / (√3 × Ist × (r × cos φs + x × sin φs))']]) +
        '<p class="note">k is the ratio of starting to full-load current, In the full-load current, L the cable length in km, r and x the resistance and reactance of the cable in Ω/km, cos φs the power factor while starting (low, often 0.2 to 0.4) and V the line voltage. The formula is for a three-phase cable with the motor at its end. It gives the drop in the cable alone, and the supply and the transformer add to it. The motor needs enough voltage at its terminals to accelerate the load, and the maker or the standard gives the lowest value. The cable data, the ratio and the limit here are examples.</p>' +
        '<h2>Worked example: a 95 A motor with a ratio of 6, on 150 m of 70 mm² copper at 415 V</h2>' +
        steps(['Ist = 6 × 95 = ' + g4(Ist) + ' A', 'r = 1.72 × 10⁻⁸ / (70 × 10⁻⁶) × 1000 = ' + g4(r) + ' Ω/km, and with x = 0.08 Ω/km and cos φs = 0.3, sin φs = ' + g4(sn), 'ΔV = √3 × ' + g4(Ist) + ' × 0.15 × (' + g4(r) + ' × 0.3 + 0.08 × ' + g4(sn) + ') = ' + g4(dV) + ' V', 'ΔV% = ' + g4(dV) + ' / 415 × 100 = ' + g4(pc) + '%', 'For a limit of 10%, Lmax = ' + g4(Lmax * 1000) + ' m']) +
        '<h2>Starting drop by cable length for the same motor</h2>' + table(['Cable length', 'Drop', 'Share of 415 V'], rows),
      faq: [
        ['Why is the starting power factor so low?', 'A stalled or slow rotor is mostly an inductive load, so the starting current lags the voltage by a large angle. The reactive part drives the drop through the reactance of the supply.'],
        ['Why does a dip matter?', 'The torque of an induction motor falls with the square of the voltage, so a deep dip can stop the motor from accelerating the load and can upset other equipment on the supply.'],
        ['What helps most?', 'A larger cable, a shorter run, a stronger supply or a softer start such as a soft starter or a drive, which cut the starting current.'],
        ['Is this the same as the running voltage drop?', 'No. The running current is much lower and its power factor is high, so the running drop is a different and smaller figure. Check both.']],
      related: [['motor-starting-formulas.html', 'Motor Starting Formulas'], ['voltage-drop-formulas.html', 'Voltage Drop Formulas'], ['soft-starter-vfd-formulas.html', 'Soft Starter and VFD Sizing Formulas'], ['../calculators/motor-starting/', 'Motor starting calculators']]
    });
    A[A.length - 1].check = { Ist, r, dV, pc, Lmax };
  }

  /* ---------- 124. neutral earthing resistor ---------- */
  {
    const VL = 11000, Ig = 400, Vp = VL / R3, R = Vp / Ig, P = Ig * Ig * R, t = 10, E = P * t;
    const rows = [50, 100, 200, 400, 1000].map((i) => [i + ' A', g4(Vp / i) + ' Ω', g4(Vp * i / 1e6) + ' MW']);
    A.push({
      slug: 'neutral-earthing-resistor-formulas', h1: 'Neutral Earthing Resistor Formulas',
      desc: 'Neutral earthing resistor formulas: the resistance for a ground fault current limit, the power in the resistor during a fault and the energy for a rated time.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Phase voltage', 'Vp = VL / √3'], ['Resistance for a current limit', 'R = Vp / Ig'], ['Power during a fault', 'P = Ig² × R = Vp × Ig'], ['Energy for the rated time', 'E = P × t']]) +
        '<p class="note">VL is the line voltage of the system, Ig the ground fault current that the resistor lets through and t the time rating of the resistor. The formulas take a solid fault from one phase to earth and ignore the impedance of the source and the cable, so the real current is a little lower. The resistor is rated for a short time, such as 10 s, because the protection clears the fault, and it needs a longer rating if the fault can stay. The current limit comes from the protection design, the cable screens and the damage allowed, and the values here are examples.</p>' +
        '<h2>Worked example: an 11 kV system with a limit of 400 A</h2>' +
        steps(['Vp = 11,000 / √3 = ' + g4(Vp) + ' V', 'R = ' + g4(Vp) + ' / 400 = ' + g4(R) + ' Ω', 'P = 400² × ' + g4(R) + ' = ' + g4(P / 1e6) + ' MW', 'For a rating of 10 s, E = ' + g4(P / 1e6) + ' × 10 = ' + g4(E / 1e6) + ' MJ']) +
        '<h2>Resistance and power for an 11 kV system by current limit</h2>' + table(['Current limit', 'Resistance', 'Power in the fault'], rows),
      faq: [
        ['Why limit the ground fault current?', 'A lower fault current means less damage to the machine and the cables, lower step and touch voltages and less stress on the system, while still giving a current that the protection can sense.'],
        ['What is the trade-off?', 'A lower current is harder to detect, and it calls for a sensitive earth fault relay. A higher current gives easier protection but more damage.'],
        ['What other limits does the resistor have?', 'A continuous rating for a neutral current in service, a voltage rating at the neutral and a temperature rise limit. The maker states them.'],
        ['What is the difference from a solid earth?', 'A solidly earthed system lets the full fault current flow and has no neutral resistor. The resistor trades fault current for lower damage.']],
      related: [['earthing-formulas.html', 'Earthing Formulas'], ['short-circuit-formulas.html', 'Short-Circuit Formulas'], ['step-touch-voltage-formulas.html', 'Step and Touch Voltage Formulas'], ['../calculators/earthing-and-grounding/', 'Earthing and grounding calculators']]
    });
    A[A.length - 1].check = { Vp, R, P, E };
  }

  /* ---------- 125. cable I2t withstand check ---------- */
  {
    const k = 143, S = 35, K2 = Math.pow(k * S, 2), I = 10000, t = K2 / (I * I), Ilet = 0.8e6, I2 = 2000, t2 = K2 / (I2 * I2);
    const rows = [1, 2, 5, 10, 20].map((i) => [i + ' kA', g4(K2 / (i * 1000) / (i * 1000)) + ' s']);
    A.push({
      slug: 'cable-it-withstand-formulas', h1: 'Cable I²t Withstand Check Formulas',
      desc: 'Cable short-circuit withstand formulas: the I²t limit of a conductor, the longest fault time at a current and the check against the let-through of a device.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Withstand of the cable', 'I²t(cable) = k² × S²'], ['Longest fault time', 't = k² × S² / I²'], ['Smallest conductor for a time', 'S = I × √t / k'], ['Check against a device', 'I²t(device) ≤ k² × S²']]) +
        '<p class="note">k is the factor of the conductor and its insulation (143 for copper with XLPE, 115 for copper with PVC up to 300 mm² and 103 above 300 mm²), S the cross-section in mm², I the fault current in amperes and t the time in seconds. The formula is for a short fault, up to about 5 s, when the heat has no time to leave the conductor. The device figure is the let-through energy of the fuse or the breaker from the maker data, and the page uses an example value. The check must hold at the lowest fault current at which the device still trips, because a lower current takes longer to clear.</p>' +
        '<h2>Worked example: a 35 mm² XLPE copper cable</h2>' +
        steps(['I²t(cable) = 143² × 35² = ' + g4(K2) + ' A²s', 'At 10 kA, t = ' + g4(K2) + ' / 10,000² = ' + g4(t) + ' s', 'At 2 kA, t = ' + g4(K2) + ' / 2,000² = ' + g4(t2) + ' s', 'A device that lets through ' + g4(Ilet) + ' A²s is below ' + g4(K2) + ' A²s, so the cable is protected']) +
        '<h2>Longest fault time for the 35 mm² cable by fault current</h2>' + table(['Fault current', 'Time'], rows),
      faq: [
        ['Why is the energy I²t and not just the current?', 'The heat in the conductor is the square of the current times the time. For a short fault, all of that heat stays in the conductor, so the energy sets the temperature rise.'],
        ['Where does the factor k come from?', 'From the heat capacity and resistivity of the conductor and the start and end temperatures allowed by the insulation. The standard tabulates it.'],
        ['Why check the lowest fault current?', 'The longest clearing time comes at the lowest current that trips the device. The cable must hold for that time too.'],
        ['Does this apply to long faults?', 'Not beyond a few seconds. Then heat leaves the conductor, and the adiabatic formula is conservative. The standard gives other methods.']],
      related: [['cable-sizing-formulas.html', 'Cable Size Formulas'], ['short-circuit-formulas.html', 'Short-Circuit Formulas'], ['circuit-breaker-formulas.html', 'Circuit Breaker Formulas'], ['../calculators/cable-engineering/', 'Cable engineering calculators']]
    });
    A[A.length - 1].check = { K2, t, t2 };
  }

  /* ---------- 126. motor code letter ---------- */
  {
    const hp = 50, V = 460, kvaHp = 6.3, kva = hp * kvaHp, Ilr = kva * 1000 / (R3 * V), back = R3 * V * Ilr / 1000 / hp;
    const rows = [['F', 5.0, 5.59], ['G', 5.6, 6.29], ['H', 6.3, 7.09], ['K', 8.0, 8.99]].map((c) => [c[0], c[1] + ' to ' + c[2] + ' kVA/hp', g4(c[2] * 10 * 1000 / (R3 * 460)) + ' A']);
    A.push({
      slug: 'motor-code-letter-formulas', h1: 'Motor Locked-Rotor Code Letter Formulas',
      desc: 'NEMA motor code letter formulas: the locked-rotor kVA per horsepower, the locked-rotor current from the code and the code from a measured current.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Locked-rotor kVA', 'kVA = hp × (kVA per hp from the code letter)'], ['Locked-rotor current', 'Ilr = kVA × 1000 / (√3 × V)'], ['Code value from a current', 'kVA per hp = √3 × V × Ilr / (1000 × hp)']]) +
        '<p class="note">The code letter is stamped on the nameplate of a NEMA motor and gives the range of locked-rotor kVA per horsepower. The ranges in the table are written from NEMA MG 1, and the standard has the full list. A range gives a spread of current, so the upper end gives the worst-case figure for a supply or a breaker check. V is the line voltage, and the formula applies to three-phase motors. The size and the code here are examples.</p>' +
        '<h2>Worked example: a 50 hp, 460 V motor with code G, taking the top of the range as 6.3 kVA/hp</h2>' +
        steps(['kVA = 50 × 6.3 = ' + g4(kva) + ' kVA', 'Ilr = ' + g4(kva) + ' × 1000 / (√3 × 460) = ' + g4(Ilr) + ' A', 'Check: √3 × 460 × ' + g4(Ilr) + ' / (1000 × 50) = ' + g4(back) + ' kVA/hp']) +
        '<h2>Locked-rotor current for a 10 hp motor at 460 V (top of each range)</h2>' + table(['Code letter', 'Range', 'Locked-rotor current'], rows),
      faq: [
        ['What does the code letter tell me?', 'How much starting current the motor draws per horsepower at rated voltage with the rotor locked. A higher letter means a higher starting current for the same size.'],
        ['Does it apply to IEC motors?', 'No. IEC motors give the ratio Ilr / In on the nameplate or in the data sheet, and the starting calculations use that ratio.'],
        ['Why use the top of the range?', 'It gives the highest starting current that the code allows, which suits a check of the supply or of the protection. A start-up study uses the measured value.'],
        ['Is the starting current the same as the code gives at any voltage?', 'The kVA is at rated voltage. At a lower voltage the current falls in proportion, and the torque falls with the square of the voltage.']],
      related: [['motor-starting-formulas.html', 'Motor Starting Formulas'], ['motor-start-voltage-dip-formulas.html', 'Motor Start Voltage Dip in the Cable Formulas'], ['motor-formulas.html', 'Induction Motor Formulas'], ['../calculators/motor-engineering/', 'Motor engineering calculators']]
    });
    A[A.length - 1].check = { kva, Ilr, back };
  }

  /* ---------- 127. synchronous speed and poles ---------- */
  {
    const f = 50, p = 4, Ns = 120 * f / p, f60 = 60, Ns60 = 120 * f60 / p, n = 750, pg = 120 * f / n, nr = 1480, fr = p * nr / 120;
    const rows = [2, 4, 6, 8, 12].map((q) => [String(q), g4(120 * 50 / q) + ' rpm', g4(120 * 60 / q) + ' rpm']);
    A.push({
      slug: 'synchronous-speed-formulas', h1: 'Synchronous Speed and Pole Formulas',
      desc: 'Synchronous speed formulas: the speed of a rotating field from the frequency and the poles, the poles for a speed and the frequency from a shaft speed.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Synchronous speed', 'Ns = 120 × f / p'], ['Number of poles', 'p = 120 × f / Ns'], ['Frequency from speed', 'f = p × N / 120']]) +
        '<p class="note">f is the frequency in hertz, p the number of poles (always even), Ns the synchronous speed in rpm and N the shaft speed in rpm. The number 120 is 60 seconds times 2 poles per pair. A synchronous machine runs at Ns exactly. An induction motor runs a little below it, by the slip, and an induction generator a little above. The values here are examples.</p>' +
        '<h2>Worked example: a 4-pole machine at 50 Hz and at 60 Hz</h2>' +
        steps(['At 50 Hz, Ns = 120 × 50 / 4 = ' + g4(Ns) + ' rpm', 'At 60 Hz, Ns = 120 × 60 / 4 = ' + g4(Ns60) + ' rpm']) +
        '<h2>Worked example: poles of a 50 Hz generator that turns at 750 rpm</h2>' +
        steps(['p = 120 × 50 / 750 = ' + g4(pg) + ' poles']) +
        '<h2>Worked example: the frequency of a 4-pole alternator at 1,480 rpm</h2>' +
        steps(['f = 4 × 1,480 / 120 = ' + g4(fr) + ' Hz']) +
        '<h2>Synchronous speed by number of poles</h2>' + table(['Poles', 'At 50 Hz', 'At 60 Hz'], rows),
      faq: [
        ['Why are poles always even?', 'Each north pole needs a south pole, so the poles come in pairs.'],
        ['Why does a 2-pole motor run near 3,000 rpm at 50 Hz?', 'Its field turns at 3,000 rpm, and the rotor follows a little slower by the slip, so the shaft is at about 2,900 rpm at full load.'],
        ['How does slip relate to this?', 'Slip is the gap between the field and the shaft speed as a fraction of the synchronous speed, s = (Ns − N) / Ns.'],
        ['Why do hydro generators have many poles?', 'The turbine turns slowly, so the generator needs many poles to give the grid frequency at that speed.']],
      related: [['motor-formulas.html', 'Induction Motor Formulas'], ['generator-formulas.html', 'Generator Formulas'], ['generator-droop-formulas.html', 'Generator Droop and Load Sharing Formulas'], ['../calculators/motor-engineering/', 'Motor engineering calculators']]
    });
    A[A.length - 1].check = { Ns, Ns60, pg, fr };
  }


  /* ---------- 128. battery C-rate and cycle life ---------- */
  {
    const Cap = 100, I1 = 50, C1 = I1 / Cap, t1 = 1 / C1, I2 = 20, C2 = I2 / Cap, t2 = 1 / C2, Ic3 = 0.3 * Cap, Vb = 48, P1 = Vb * I1 / 1000;
    const E = 10, dod = 0.8, cyc = 3000, thr = E * dod * cyc, yrs = cyc / 365;
    const rows = [0.1, 0.2, 0.5, 1, 2].map((c) => [c + ' C', g4(c * Cap) + ' A', g4(1 / c) + ' h']);
    A.push({
      slug: 'battery-c-rate-formulas', h1: 'Battery C-Rate and Cycle Life Formulas',
      desc: 'Battery C-rate formulas: the current for a C-rate, the ideal run time, the power at a voltage and the energy throughput over the cycle life.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['C-rate', 'C = I / capacity (Ah)'], ['Current for a C-rate', 'I = C × capacity'], ['Ideal run time', 't = 1 / C, in hours'], ['Power', 'P = V × I / 1000'], ['Energy throughput over the life', 'E = capacity (kWh) × DoD × cycles'], ['Years at one cycle a day', 'years = cycles / 365']]) +
        '<p class="note">I is the charge or discharge current in amperes, capacity the rated capacity in ampere-hours, V the battery voltage and DoD the depth of discharge as a fraction. A C-rate of 1 C empties the rated capacity in one hour, 0.5 C in two hours and 2 C in half an hour. The run time is ideal, because the usable capacity falls at a high C-rate (see Peukert’s law) and with cold. The cycle life depends on the chemistry, the depth of discharge, the temperature and the C-rate, and the maker gives the figure for stated conditions. The cycle count here is an example.</p>' +
        '<h2>Worked example: a 100 Ah battery at 50 A and at 20 A</h2>' +
        steps(['At 50 A, C = 50 / 100 = ' + g4(C1) + ' C, and the ideal run time is 1 / ' + g4(C1) + ' = ' + g4(t1) + ' h', 'At 20 A, C = 20 / 100 = ' + g4(C2) + ' C, and the ideal run time is 1 / ' + g4(C2) + ' = ' + g4(t2) + ' h', 'The current at 0.3 C is 0.3 × 100 = ' + g4(Ic3) + ' A', 'At 48 V and 50 A, P = 48 × 50 / 1000 = ' + g4(P1) + ' kW']) +
        '<h2>Worked example: a 10 kWh battery with 3,000 cycles at 80% depth of discharge</h2>' +
        steps(['E = 10 × 0.8 × 3,000 = ' + g4(thr) + ' kWh over the life', 'At one cycle a day, 3,000 / 365 = ' + g4(yrs) + ' years']) +
        '<h2>Current and ideal run time for a 100 Ah battery</h2>' + table(['C-rate', 'Current', 'Ideal run time'], rows),
      faq: [
        ['What does 1 C mean?', 'The current that would empty the rated capacity in one hour. For a 100 Ah battery that is 100 A.'],
        ['Why is the real run time shorter at a high C-rate?', 'The internal resistance and the chemistry reduce the usable capacity when the current is high, so the battery empties sooner than the ideal time.'],
        ['Does a shallow cycle last longer?', 'Usually yes. A smaller depth of discharge gives more cycles, and the maker curve shows how many.'],
        ['What is the end of life?', 'Often the point at which the capacity has fallen to 80% of the rated value. The data sheet states it.']],
      related: [['battery-formulas.html', 'Battery Formulas'], ['peukert-formulas.html', 'Peukert’s Law Formulas'], ['battery-charge-time-formulas.html', 'Battery Charge Time Formulas'], ['../calculators/battery-bank-sizing/', 'Battery bank sizing calculators']]
    });
    A[A.length - 1].check = { C1, t1, C2, t2, Ic3, P1, thr, yrs };
  }

  /* ---------- 129. EV charging time ---------- */
  {
    const pack = 60, s0 = 0.2, s1 = 0.8, En = pack * (s1 - s0), eta = 0.9, Eg = En / eta, P1 = 230 * 32 / 1000, P3 = R3 * 400 * 32 / 1000, Pc = 7.4, tc = Eg / Pc, Pd = 50, td = En / Pd;
    const rows = [3.7, 7.4, 11, 22, 50].map((p) => [p + ' kW', g4(Eg / p) + ' h']);
    A.push({
      slug: 'ev-charging-time-formulas', h1: 'EV Charging Time Formulas',
      desc: 'Electric vehicle charging formulas: the power of a single-phase or three-phase charge point, the energy to add and the charging time with the charger losses.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Single-phase charge power', 'P = V × I / 1000'], ['Three-phase charge power', 'P = √3 × VL × I / 1000'], ['Energy added to the battery', 'En = pack kWh × (end state − start state)'], ['Energy from the supply', 'Eg = En / η'], ['Charging time', 't = Eg / P']]) +
        '<p class="note">V is the phase voltage, VL the line voltage and I the charging current in amperes, limited by the lower of the charge point, the cable and the on-board charger. η is the efficiency from the socket to the battery, here 0.9 as an example, and it is lower at a low current. The time is for a steady power. A real charge slows (tapers) near a full battery, and a DC charger slows as the battery warms, so the last 20% takes longer than the formula says. The pack size, the states and the power here are examples.</p>' +
        '<h2>Worked example: a 60 kWh pack from 20% to 80% on a 7.4 kW charge point</h2>' +
        steps(['En = 60 × (0.8 − 0.2) = ' + g4(En) + ' kWh in the battery', 'Eg = ' + g4(En) + ' / 0.9 = ' + g4(Eg) + ' kWh from the supply', 't = ' + g4(Eg) + ' / 7.4 = ' + g4(tc) + ' h']) +
        '<h2>Worked example: charge point power from the current</h2>' +
        steps(['Single-phase at 230 V and 32 A: P = 230 × 32 / 1000 = ' + g4(P1) + ' kW', 'Three-phase at 400 V and 32 A: P = √3 × 400 × 32 / 1000 = ' + g4(P3) + ' kW']) +
        '<h2>Worked example: the same 36 kWh on a 50 kW DC charger, ignoring the taper</h2>' +
        steps(['t = ' + g4(En) + ' / 50 = ' + g4(td) + ' h']) +
        '<h2>Time for the 20% to 80% charge by power, with 90% efficiency</h2>' + table(['Charge power', 'Time'], rows),
      faq: [
        ['Why is the charging time longer than the formula says?', 'The battery management system lowers the current near a full battery and when the cells are hot or cold. The formula gives the time at a steady power.'],
        ['What limits the power?', 'The smallest of the supply, the charge point, the cable and the on-board charger of the car. A car with a 7.4 kW on-board charger will not take 22 kW from an AC point.'],
        ['Why include the efficiency?', 'The charger, the cable and the battery lose some energy as heat, so the supply gives more than the battery stores, and the bill follows the supply energy.'],
        ['Is a DC charger different?', 'The charger sits outside the car, so the rated power goes straight to the battery, within the limits of the car. The taper then sets the time.']],
      related: [['battery-pack-formulas.html', 'Battery Pack Formulas'], ['battery-charge-time-formulas.html', 'Battery Charge Time Formulas'], ['three-phase-power-formulas.html', 'Three-Phase Power Formulas'], ['../calculators/power-and-energy/', 'Power and energy calculators']]
    });
    A[A.length - 1].check = { En, Eg, P1, P3, tc, td };
  }

  /* ---------- 130. conveyor belt power ---------- */
  {
    const mdot = 100000 / 3600, v = 2, Lb = 50, h = 5, mu = 0.03, qb = 15, g = 9.81, q = mdot / v;
    const Pl = mdot * g * h, F = mu * g * Lb * (q + qb), Pf = F * v, Pd = Pl + Pf, eta = 0.85, Pm = Pd / eta;
    const rows = [50, 100, 200, 400].map((th) => { const md = th * 1000 / 3600, qq = md / v, pw = md * g * h + mu * g * Lb * (qq + qb) * v; return [th + ' t/h', g4(pw / 1000) + ' kW', g4(pw / eta / 1000) + ' kW']; });
    A.push({
      slug: 'conveyor-belt-power-formulas', h1: 'Conveyor Belt Power Formulas',
      desc: 'Belt conveyor power formulas: the material load per metre, the friction force, the power to lift the material and the motor power with the drive efficiency.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Mass flow', 'ṁ = throughput (t/h) × 1000 / 3600'], ['Material per metre of belt', 'q = ṁ / v'], ['Friction force', 'F = μ × g × L × (q + qb)'], ['Power to lift the material', 'Pl = ṁ × g × h'], ['Power to move against friction', 'Pf = F × v'], ['Motor input power', 'Pm = (Pl + Pf) / η']]) +
        '<p class="note">v is the belt speed in m/s, L the length in metres, h the lift in metres, qb the mass of the moving parts of the belt and rollers in kg per metre, μ an equivalent friction factor that covers the rollers, the belt flex and the seals, g = 9.81 m/s² and η the efficiency of the drive. The method is a first estimate for a straight belt. A full design follows a standard such as ISO 5048 or CEMA, and adds the acceleration, the skirts, the trippers and the belt tension. The values here are examples.</p>' +
        '<h2>Worked example: 100 t/h at 2 m/s over 50 m with a lift of 5 m</h2>' +
        steps(['ṁ = 100 × 1000 / 3600 = ' + g4(mdot) + ' kg/s, and q = ' + g4(mdot) + ' / 2 = ' + g4(q) + ' kg/m', 'Pl = ' + g4(mdot) + ' × 9.81 × 5 = ' + g4(Pl) + ' W', 'F = 0.03 × 9.81 × 50 × (' + g4(q) + ' + 15) = ' + g4(F) + ' N, so Pf = ' + g4(F) + ' × 2 = ' + g4(Pf) + ' W', 'At the drum, P = ' + g4(Pl) + ' + ' + g4(Pf) + ' = ' + g4(Pd) + ' W', 'With a drive efficiency of 0.85, Pm = ' + g4(Pd) + ' / 0.85 = ' + g4(Pm) + ' W']) +
        '<h2>Power by throughput for the same belt</h2>' + table(['Throughput', 'Power at the drum', 'Motor input'], rows),
      faq: [
        ['Why is the empty belt included?', 'The belt and the rollers move even with no material, and they take power through the friction. For a long belt this is a large share of the total.'],
        ['What does the lift add?', 'A rising belt lifts the material, which takes the power ṁ × g × h. A falling belt can give power back, and then it brakes the drive.'],
        ['Is the motor chosen at the calculated power?', 'No. It is chosen with a margin for the starting, the wet or sticky material and the ageing. The standard gives the factors.'],
        ['How does the speed affect the power?', 'The friction power rises with the speed, and the lift power rises with the mass flow. A faster belt with the same load per metre needs more power.']],
      related: [['hoist-power-formulas.html', 'Hoist and Lift Power Formulas'], ['gear-drive-formulas.html', 'Gear and Belt Drive Formulas'], ['motor-efficiency-formulas.html', 'Motor Efficiency Formulas'], ['../calculators/motor-engineering/', 'Motor engineering calculators']]
    });
    A[A.length - 1].check = { mdot, q, Pl, F, Pf, Pd, Pm };
  }

  /* ---------- 131. parallel plate capacitor ---------- */
  {
    const e0 = 8.8541878128e-12, Ar = 0.01, d = 0.001, er = 4, V = 100, C0 = e0 * Ar / d, C1 = er * C0, Q = C1 * V, En = 0.5 * C1 * V * V, Ef = V / d;
    const rows = [['Air', 1], ['PTFE', 2.1], ['Polyester film', 3.3], ['Ceramic (low-k)', 10]].map((m) => [m[0] + ' (' + m[1] + ')', g4(m[1] * C0 * 1e12) + ' pF']);
    A.push({
      slug: 'parallel-plate-capacitor-formulas', h1: 'Parallel Plate Capacitor Formulas',
      desc: 'Parallel plate capacitor formulas: the capacitance from the plate area, the gap and the relative permittivity, the charge, the energy and the electric field.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Capacitance', 'C = ε0 × εr × A / d'], ['Charge', 'Q = C × V'], ['Energy', 'E = ½ × C × V²'], ['Electric field', 'E = V / d']]) +
        '<p class="note">ε0 = 8.854 × 10⁻¹² F/m is the permittivity of free space, εr the relative permittivity of the insulator between the plates, A the area of one plate in m², d the gap in metres and V the voltage. The formula ignores the fringing field at the edges, so it is good when the gap is small against the plate size. The field must stay below the breakdown strength of the insulator, which the material data gives. The relative permittivities in the table are typical values, and real parts vary. The sizes here are examples.</p>' +
        '<h2>Worked example: plates of 100 cm² with a 1 mm gap and an insulator with εr = 4, at 100 V</h2>' +
        steps(['A = 100 cm² = 0.01 m², so with air C = 8.854 × 10⁻¹² × 0.01 / 0.001 = ' + g4(C0 * 1e12) + ' pF', 'With εr = 4, C = 4 × ' + g4(C0 * 1e12) + ' = ' + g4(C1 * 1e12) + ' pF', 'Q = ' + g4(C1 * 1e12) + ' pF × 100 V = ' + g4(Q * 1e9) + ' nC', 'E = ½ × ' + g4(C1 * 1e12) + ' pF × 100² = ' + g4(En * 1e6) + ' µJ', 'Field = 100 / 0.001 = ' + g4(Ef / 1000) + ' kV/m']) +
        '<h2>Capacitance of the same plates by insulator</h2>' + table(['Insulator (εr)', 'Capacitance'], rows),
      faq: [
        ['Why does a thinner gap give more capacitance?', 'The field is stronger for the same voltage, so the plates hold more charge. The capacitance is inversely proportional to the gap.'],
        ['What does the insulator do?', 'It reduces the field for the same charge by its relative permittivity, so the capacitance rises by εr. It also sets the voltage that the capacitor can take.'],
        ['What limits a thin gap?', 'The breakdown strength of the insulator. At a field above it, the insulator fails, so a thinner gap needs a lower voltage rating.'],
        ['Does this apply to real capacitors?', 'Rolled and stacked capacitors are many such plates in parallel, so the area is the total area of the plates.']],
      related: [['capacitor-formulas.html', 'Capacitor Formulas'], ['supercapacitor-formulas.html', 'Supercapacitor Formulas'], ['capacitor-discharge-formulas.html', 'Capacitor Discharge Time Formulas'], ['../calculators/electrical-fundamentals/', 'Electrical fundamentals calculators']]
    });
    A[A.length - 1].check = { C0, C1, Q, En, Ef };
  }

  /* ---------- 132. solenoid inductance ---------- */
  {
    const mu0 = 4 * Math.PI * 1e-7, N = 500, len = 0.1, dia = 0.02, Ac = Math.PI * Math.pow(dia / 2, 2), L0 = mu0 * N * N * Ac / len, I = 2, En = 0.5 * L0 * I * I, B = mu0 * N * I / len, mur = 200, Lc = mur * L0;
    const rows = [100, 200, 500, 1000].map((n) => [String(n), g4(mu0 * n * n * Ac / len * 1000) + ' mH']);
    A.push({
      slug: 'solenoid-inductance-formulas', h1: 'Solenoid and Coil Inductance Formulas',
      desc: 'Solenoid inductance formulas: the inductance from the turns, the core area, the length and the core permeability, the field in the coil and the stored energy.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Core area', 'A = π × (d / 2)²'], ['Inductance', 'L = μ0 × μr × N² × A / l'], ['Flux density', 'B = μ0 × μr × N × I / l'], ['Stored energy', 'E = ½ × L × I²']]) +
        '<p class="note">μ0 = 4π × 10⁻⁷ H/m, μr the relative permeability of the core (1 for air), N the number of turns, A the core area in m², l the length of the winding in metres, d the diameter and I the current. The formula is for a long solenoid, where the length is several times the diameter, and it gives a value that is a little too high for a short coil. A magnetic core raises L by μr only until it saturates, and then the inductance falls, so the iron core figure is the value below saturation. The sizes here are examples.</p>' +
        '<h2>Worked example: 500 turns on a coil of 100 mm length and 20 mm diameter</h2>' +
        steps(['A = π × (0.02 / 2)² = ' + g4(Ac * 1e6) + ' mm²', 'In air, L = 4π × 10⁻⁷ × 500² × ' + g4(Ac) + ' / 0.1 = ' + g4(L0 * 1000) + ' mH', 'At 2 A, B = 4π × 10⁻⁷ × 500 × 2 / 0.1 = ' + g4(B * 1000) + ' mT', 'E = ½ × ' + g4(L0 * 1000) + ' mH × 2² = ' + g4(En * 1000) + ' mJ', 'With a core of μr = 200 below saturation, L = 200 × ' + g4(L0 * 1000) + ' = ' + g4(Lc * 1000) + ' mH']) +
        '<h2>Inductance in air for the same coil by number of turns</h2>' + table(['Turns', 'Inductance'], rows),
      faq: [
        ['Why does the inductance rise with the square of the turns?', 'More turns make a stronger field for the same current, and each turn also links that field. Both effects scale with N, so L scales with N².'],
        ['What does the core do?', 'A magnetic core raises the flux for the same current by its permeability, so the inductance rises by μr until the core saturates.'],
        ['Why is the value of a short coil lower?', 'The field of a short coil spreads out at the ends, so less flux links the turns. A correction factor (Nagaoka) applies, which the formula leaves out.'],
        ['How is this linked to the energy?', 'The energy is stored in the field, and it equals ½ × L × I². A larger inductance stores more for the same current.']],
      related: [['inductor-formulas.html', 'Inductor Formulas'], ['resonance-formulas.html', 'Resonance Formulas'], ['skin-effect-formulas.html', 'Skin Effect Formulas'], ['../calculators/electrical-fundamentals/', 'Electrical fundamentals calculators']]
    });
    A[A.length - 1].check = { Ac, L0, B, En, Lc };
  }

  /* ---------- 133. power factor correction payback ---------- */
  {
    const P = 500, pf1 = 0.8, pf2 = 0.95, Q1 = P * Math.tan(Math.acos(pf1)), Q2 = P * Math.tan(Math.acos(pf2)), Qc = Q1 - Q2, S1 = P / pf1, S2 = P / pf2, dS = S1 - S2, tar = 400, sav = dS * tar, cost = 1500, cap = Qc * cost, pay = cap / sav;
    const rows = [0.85, 0.9, 0.95, 0.98].map((x) => { const q = P * (Math.tan(Math.acos(pf1)) - Math.tan(Math.acos(x))), s = P / pf1 - P / x; return [String(x), g4(q) + ' kVAR', g4(s) + ' kVA', g4(cost * q / (s * tar)) + ' months']; });
    A.push({
      slug: 'pf-correction-payback-formulas', h1: 'Power Factor Correction Payback Formulas',
      desc: 'Power factor correction payback formulas: the capacitor kVAR, the fall in kVA demand, the saving from a kVA charge and the payback time in months.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Capacitor kVAR', 'Qc = P × (tan φ1 − tan φ2)'], ['kVA before and after', 'S = P / pf'], ['Fall in kVA demand', 'ΔS = P / pf1 − P / pf2'], ['Monthly saving', 'saving = ΔS × tariff per kVA'], ['Payback', 'months = Qc × cost per kVAR / saving']]) +
        '<p class="note">P is the real power in kW, pf1 and pf2 the power factor before and after, φ = arccos(pf), and the tariff is the demand charge per kVA per month. The saving here is from a charge on the kVA demand. A tariff may charge a penalty for a low power factor, or give a bonus for a high one, and then the saving follows that rule. The correction also cuts the current and the cable loss, which the formula leaves out. The load, the tariff and the cost per kVAR here are examples, in any one currency.</p>' +
        '<h2>Worked example: 500 kW from pf 0.8 to 0.95, with a tariff of 400 per kVA a month and a bank cost of 1,500 per kVAR</h2>' +
        steps(['Q1 = 500 × tan(arccos 0.8) = ' + g4(Q1) + ' kVAR, and Q2 = 500 × tan(arccos 0.95) = ' + g4(Q2) + ' kVAR', 'Qc = ' + g4(Q1) + ' − ' + g4(Q2) + ' = ' + g4(Qc) + ' kVAR', 'S1 = 500 / 0.8 = ' + g4(S1) + ' kVA, and S2 = 500 / 0.95 = ' + g4(S2) + ' kVA', 'ΔS = ' + g4(S1) + ' − ' + g4(S2) + ' = ' + g4(dS) + ' kVA', 'Saving = ' + g4(dS) + ' × 400 = ' + g4(sav) + ' a month', 'Bank cost = ' + g4(Qc) + ' × 1,500 = ' + g4(cap) + ', so the payback is ' + g4(cap) + ' / ' + g4(sav) + ' = ' + g4(pay) + ' months']) +
        '<h2>Correction of the 500 kW load from pf 0.8 by target</h2>' + table(['Target pf', 'Capacitor', 'Fall in demand', 'Payback'], rows),
      faq: [
        ['Why does a better power factor cut the demand?', 'The kVA is the real power divided by the power factor, so for the same kW a higher power factor means fewer kVA, and the supplier’s charge falls.'],
        ['Is a power factor of 1 the best target?', 'Not usually. The last steps cost more kVAR for less saving, and a leading power factor can raise the voltage. Many sites aim near 0.95.'],
        ['What if the load has harmonics?', 'A plain capacitor bank can resonate with the supply. A detuned or filtered bank is needed, which costs more and changes the payback.'],
        ['Does the saving continue every month?', 'Yes, if the load stays. A varying load needs a bank that steps in and out, so it does not over-correct at a light load.']],
      related: [['power-factor-formulas.html', 'Power Factor Formulas'], ['detuning-reactor-formulas.html', 'Detuning Reactor Formulas'], ['demand-load-factor-formulas.html', 'Demand, Load and Diversity Factor Formulas'], ['../calculators/power-and-energy/', 'Power and energy calculators']]
    });
    A[A.length - 1].check = { Q1, Q2, Qc, S1, S2, dS, sav, cap, pay };
  }


  /* ---------- 134. transformer through-fault current ---------- */
  {
    const S = 1, VH = 11, VL = 0.415, Zt = 5, Ss = 250, IHn = S * 1000 / (R3 * VH), ILn = S * 1000 / (R3 * VL), ILinf = ILn / (Zt / 100), IHinf = IHn / (Zt / 100), Zs = S / Ss * 100, Ztot = Zt + Zs, ILs = ILn / (Ztot / 100), IHs = IHn / (Ztot / 100), rat = Math.pow(ILs / ILinf, 2), tw = 2, I2t = IHs * IHs * tw;
    const rows = [4, 5, 6, 8].map((z) => [z + '%', g4(ILn / (z / 100) / 1000) + ' kA']);
    A.push({
      slug: 'transformer-through-fault-formulas', h1: 'Transformer Through-Fault Current Formulas',
      desc: 'Transformer through-fault formulas: the rated currents, the fault current with an infinite source or a finite source and the I²t over the rated fault duration.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Rated current', 'In = S × 1000 / (√3 × V), with S in MVA and V in kV'], ['Source impedance on the transformer base', 'Zs% = S / Ssc × 100'], ['Fault current, infinite source', 'If = In / (Zt% / 100)'], ['Fault current, finite source', 'If = In / ((Zt% + Zs%) / 100)'], ['Heating over the duration', 'I²t = If² × t']]) +
        '<p class="note">S is the rating of the transformer in MVA, V the line voltage on the side that you study, Zt% its impedance in per cent, Ssc the short-circuit power of the source in MVA and t the duration. The fault is a three-phase fault at the terminals of the secondary, and the current on the primary side follows the same ratio. The forces on the windings follow the square of the current, and the heating follows I²t. The standard IEC 60076-5 states a rated duration of 2 s unless the buyer asks for another. The ratings and the source here are examples.</p>' +
        '<h2>Worked example: a 1 MVA, 11 kV / 415 V transformer with 5% impedance</h2>' +
        steps(['HV rated current = 1,000 / (√3 × 11) = ' + g4(IHn) + ' A, and LV rated current = 1,000 / (√3 × 0.415) = ' + g4(ILn) + ' A', 'Infinite source: LV If = ' + g4(ILn) + ' / 0.05 = ' + g4(ILinf) + ' A, and HV If = ' + g4(IHinf) + ' A', 'With a source of 250 MVA, Zs% = 1 / 250 × 100 = ' + g4(Zs) + '%, so the total is ' + g4(Ztot) + '%', 'LV If = ' + g4(ILn) + ' / 0.054 = ' + g4(ILs) + ' A, and HV If = ' + g4(IHs) + ' A', 'The finite source cuts the force to ' + g4(rat * 100) + '% of the infinite-source value (the square of the ratio of the currents)', 'Over 2 s on the HV side, I²t = ' + g4(IHs) + '² × 2 = ' + g4(I2t) + ' A²s']) +
        '<h2>LV fault current with an infinite source by impedance</h2>' + table(['Transformer impedance', 'LV fault current'], rows),
      faq: [
        ['Why is the rated duration 2 s?', 'The standard takes it as the longest time the fault is likely to last before the protection clears it. A transformer built for a longer duration says so on the nameplate.'],
        ['What does the source impedance change?', 'It adds to the impedance of the transformer and cuts the fault current. A strong source gives a result close to the infinite-source value.'],
        ['Why do the forces follow the square of the current?', 'The force on a winding is from the current in it and the field of the neighbouring winding, and both are proportional to the current.'],
        ['Is the cable impedance included?', 'No. The cable and the busbars add impedance and lower the current at the load, so this is the fault at the transformer terminals.']],
      related: [['transformer-formulas.html', 'Transformer Formulas'], ['short-circuit-formulas.html', 'Short-Circuit Formulas'], ['per-unit-formulas.html', 'Per-Unit Formulas'], ['../calculators/transformer-fault-current/', 'Transformer fault current calculators']]
    });
    A[A.length - 1].check = { IHn, ILn, ILinf, ILs, IHs, rat, I2t };
  }

  /* ---------- 135. transformer EMF equation ---------- */
  {
    const K = Math.PI * Math.SQRT2, f = 50, Bm = 1.5, Ac = 0.012, Phi = Bm * Ac, Et = K * f * Phi, EH = 11000, NH = EH / Et, NHr = Math.round(NH), EL = 415, NL = EL / Et, NLr = Math.round(NL);
    const rows = [40, 50, 60].map((fq) => [fq + ' Hz', g4(EH / (K * fq * NHr * Ac)) + ' T']);
    A.push({
      slug: 'transformer-emf-formulas', h1: 'Transformer EMF Equation Formulas',
      desc: 'Transformer EMF equation formulas: the voltage per turn from frequency, flux density and core area, the turns for a voltage and the flux density at a frequency.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Peak flux', 'Φm = Bm × A'], ['Voltage per turn', 'Et = 4.443 × f × Φm'], ['Turns for a voltage', 'N = E / Et'], ['Flux density from the voltage', 'Bm = E / (4.443 × f × N × A)']]) +
        '<p class="note">f is the frequency in hertz, Bm the peak flux density in tesla, A the net core area in m², Φm the peak flux in webers and E the RMS voltage of the winding. The constant 4.443 is √2 × π, and it is often rounded to 4.44. The equation is for a sinusoidal voltage. The flux density rises when the frequency falls or the voltage rises, so a transformer that runs at a low frequency or at an over-voltage can saturate, and its magnetising current then rises sharply. The core area, the flux density and the voltage here are examples, and the real values come from the design.</p>' +
        '<h2>Worked example: a core of 0.012 m² at 1.5 T and 50 Hz, with windings for 11,000 V and 415 V</h2>' +
        steps(['Φm = 1.5 × 0.012 = ' + g4(Phi) + ' Wb', 'Et = 4.443 × 50 × ' + g4(Phi) + ' = ' + g4(Et) + ' V per turn', 'N(HV) = 11,000 / ' + g4(Et) + ' = ' + g4(NH) + ', so ' + NHr + ' turns', 'N(LV) = 415 / ' + g4(Et) + ' = ' + g4(NL) + ', so ' + NLr + ' turns']) +
        '<h2>Flux density of the HV winding of ' + NHr + ' turns at 11,000 V by frequency</h2>' + table(['Frequency', 'Peak flux density'], rows),
      faq: [
        ['Why does the flux density rise at a low frequency?', 'For a fixed voltage, the flux needed to produce it is inversely proportional to the frequency. A transformer for 50 Hz therefore sees a higher flux on a 40 Hz supply.'],
        ['What happens when the core saturates?', 'The magnetising current rises sharply and is full of harmonics, the transformer runs hot and the iron loss rises. Protection against over-fluxing watches the ratio of volts to hertz.'],
        ['Why is the turn count rounded?', 'A winding has a whole number of turns, so the voltage per turn and the flux density shift a little from the design value.'],
        ['Does a bigger core help?', 'Yes. A larger area gives more voltage per turn at the same flux density, so fewer turns are needed, but the core costs more.']],
      related: [['transformer-formulas.html', 'Transformer Formulas'], ['transformer-inrush-formulas.html', 'Transformer Inrush Current Formulas'], ['transformer-efficiency-formulas.html', 'Transformer Efficiency Formulas'], ['../calculators/transformer-engineering/', 'Transformer engineering calculators']]
    });
    A[A.length - 1].check = { Phi, Et, NH, NL };
  }

  /* ---------- 136. delta-star resistor conversion ---------- */
  {
    const Rab = 30, Rbc = 60, Rca = 90, sum = Rab + Rbc + Rca, Ra = Rab * Rca / sum, Rb = Rab * Rbc / sum, Rc = Rbc * Rca / sum, sp = Ra * Rb + Rb * Rc + Rc * Ra, bab = sp / Rc, bbc = sp / Ra, bca = sp / Rb;
    const rows = [30, 60, 90, 120].map((r) => [r + ' Ω', g4(r / 3) + ' Ω']);
    A.push({
      slug: 'delta-star-resistor-formulas', h1: 'Delta-Star Resistor Conversion Formulas',
      desc: 'Delta to star and star to delta resistor formulas: the equivalent star resistors of a delta network, the reverse conversion and the equal-resistor case.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Star resistor at node a', 'Ra = Rab × Rca / (Rab + Rbc + Rca)'], ['Star resistor at node b', 'Rb = Rab × Rbc / (Rab + Rbc + Rca)'], ['Star resistor at node c', 'Rc = Rbc × Rca / (Rab + Rbc + Rca)'], ['Delta resistor between a and b', 'Rab = (Ra × Rb + Rb × Rc + Rc × Ra) / Rc'], ['Equal resistors', 'RY = RΔ / 3']]) +
        '<p class="note">The delta network has the resistors Rab, Rbc and Rca between the three nodes a, b and c. The star network has Ra, Rb and Rc from each node to a common point. The two networks look the same from the outside when the resistors follow these formulas, so the one can replace the other when a circuit does not reduce by series and parallel. In each star formula the numerator holds the two delta resistors that meet at the node. The values here are examples.</p>' +
        '<h2>Worked example: a delta of 30 Ω, 60 Ω and 90 Ω</h2>' +
        steps(['Sum = 30 + 60 + 90 = ' + g4(sum) + ' Ω', 'Ra = 30 × 90 / ' + g4(sum) + ' = ' + g4(Ra) + ' Ω', 'Rb = 30 × 60 / ' + g4(sum) + ' = ' + g4(Rb) + ' Ω', 'Rc = 60 × 90 / ' + g4(sum) + ' = ' + g4(Rc) + ' Ω']) +
        '<h2>Worked example: back from the star of ' + g4(Ra) + ' Ω, ' + g4(Rb) + ' Ω and ' + g4(Rc) + ' Ω</h2>' +
        steps(['Ra × Rb + Rb × Rc + Rc × Ra = ' + g4(sp) + ' Ω²', 'Rab = ' + g4(sp) + ' / ' + g4(Rc) + ' = ' + g4(bab) + ' Ω', 'Rbc = ' + g4(sp) + ' / ' + g4(Ra) + ' = ' + g4(bbc) + ' Ω', 'Rca = ' + g4(sp) + ' / ' + g4(Rb) + ' = ' + g4(bca) + ' Ω']) +
        '<h2>Equal resistors: star equivalent of an equal delta</h2>' + table(['Delta resistor', 'Star resistor'], rows),
      faq: [
        ['When do I need this?', 'For a bridge or a three-node network that has no series or parallel parts, such as the unbalanced Wheatstone bridge. Converting one triangle to a star gives a circuit that does reduce.'],
        ['Why is the star resistor smaller?', 'Each star arm carries the effect of two delta arms in parallel with the third, so the star resistors are smaller, by a factor of 3 when all are equal.'],
        ['Does the conversion hold for impedances?', 'Yes. The same formulas hold for complex impedances in AC circuits.'],
        ['Is the common point of the star real?', 'No. It is a mathematical node, and it has no connection to the circuit, so it is not at ground potential.']],
      related: [['resistor-formulas.html', 'Resistor Formulas'], ['wheatstone-bridge-formulas.html', 'Wheatstone Bridge Formulas'], ['thevenin-norton-formulas.html', 'Thévenin and Norton Formulas'], ['../calculators/electrical-fundamentals/', 'Electrical fundamentals calculators']]
    });
    A[A.length - 1].check = { Ra, Rb, Rc, bab, bbc, bca };
  }

  /* ---------- 137. current shunt ---------- */
  {
    const Vfs = 0.075, Ifs = 100, R = Vfs / Ifs, Pf = Ifs * Ifs * R, Vm = 0.042, Im = Vm / R, Vd = 0.1, I2 = 20, R2 = Vd / I2, P2 = I2 * I2 * R2;
    const rows = [10, 50, 100, 200].map((i) => [i + ' A', g4(Vfs / i * 1000) + ' mΩ', g4(Vfs * i) + ' W']);
    A.push({
      slug: 'current-shunt-formulas', h1: 'Current Shunt Resistor Formulas',
      desc: 'Current shunt formulas: the resistance from the full-scale voltage and current, the power at full current, the current from a measured millivolt and the drop.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Shunt resistance', 'R = Vfs / Ifs'], ['Power at a current', 'P = I² × R = V × I'], ['Current from the voltage', 'I = Vm / R'], ['Resistance for an allowed drop', 'R = Vdrop / I']]) +
        '<p class="note">Vfs is the voltage across the shunt at its rated current Ifs, Vm the voltage that you measure and I the current. A shunt is a low resistance in series with the load, and the meter reads the small voltage across it. Four-wire (Kelvin) connection takes the sense leads from the shunt itself, so the lead resistance does not add an error. The shunt heats at full current and its resistance shifts with temperature, and the maker gives the power rating, the temperature coefficient and the accuracy. A shunt in the live conductor needs the meter or the amplifier to take the common-mode voltage. The values here are examples.</p>' +
        '<h2>Worked example: a 75 mV, 100 A shunt</h2>' +
        steps(['R = 0.075 / 100 = ' + g4(R * 1000) + ' mΩ', 'At full current, P = 100² × ' + g4(R) + ' = ' + g4(Pf) + ' W', 'A reading of 42 mV is I = 0.042 / ' + g4(R) + ' = ' + g4(Im) + ' A']) +
        '<h2>Worked example: a shunt for 20 A with a drop of 100 mV allowed</h2>' +
        steps(['R = 0.1 / 20 = ' + g4(R2 * 1000) + ' mΩ', 'At 20 A, P = 20² × ' + g4(R2) + ' = ' + g4(P2) + ' W']) +
        '<h2>75 mV shunts by rated current</h2>' + table(['Rated current', 'Resistance', 'Power at full current'], rows),
      faq: [
        ['Why use a low resistance?', 'A low value drops little voltage and wastes little power in the circuit. The trade-off is a small signal, which needs an amplifier or a sensitive meter.'],
        ['Why does a shunt have four terminals?', 'Two carry the load current and two sense the voltage. The sense leads carry almost no current, so their resistance does not add to the reading.'],
        ['Why is the power rating important?', 'The power turns into heat in the shunt. If it runs hot, the resistance drifts and the reading with it, and a hot shunt can fail.'],
        ['What about an AC current?', 'A shunt also works for AC, but its inductance adds to the voltage at a high frequency. For a high-frequency or isolated measurement, use a current transformer or a Hall sensor.']],
      related: [['ct-burden-formulas.html', 'CT Burden Formulas'], ['adc-resolution-formulas.html', 'ADC Resolution Formulas'], ['loop-4-20ma-formulas.html', '4–20 mA Loop Formulas'], ['../calculators/electronics-and-instrumentation/', 'Electronics and instrumentation calculators']]
    });
    A[A.length - 1].check = { R, Pf, Im, R2, P2 };
  }

  /* ---------- 138. solar yield and degradation ---------- */
  {
    const kWp = 10, psh = 5.2, pr = 0.8, E0 = kWp * psh * 365 * pr, d1 = 0.02, d = 0.005, y = (n) => E0 * (1 - d1) * Math.pow(1 - d, n - 1), spec = E0 / kWp;
    let tot = 0; for (let n = 1; n <= 25; n++) tot += y(n);
    const rows = [1, 5, 10, 15, 25].map((n) => [String(n), g4((1 - d1) * Math.pow(1 - d, n - 1) * 100) + '%', g4(y(n)) + ' kWh']);
    A.push({
      slug: 'solar-yield-degradation-formulas', h1: 'Solar Energy Yield and Degradation Formulas',
      desc: 'Solar PV yield formulas: the yearly energy from array size, peak sun hours and performance ratio, the output after degradation and the energy over 25 years.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Yearly energy before degradation', 'E0 = kWp × PSH × 365 × PR'], ['Specific yield', 'E0 / kWp, in kWh per kWp'], ['Energy in year n', 'En = E0 × (1 − d1) × (1 − d)^(n − 1)'], ['Energy over N years', 'ΣEn, for n = 1 to N']]) +
        '<p class="note">kWp is the array size at standard test conditions, PSH the peak sun hours per day (the daily irradiation in kWh/m², with 1 kW/m² as the reference), PR the performance ratio that covers the losses of the temperature, the dirt, the cables and the inverter, d1 the loss in the first year and d the loss in each later year. The first-year loss of 2% and the later loss of 0.5% a year are example values, and the module data sheet gives the warranty figures. The sun hours and the performance ratio come from the site data and the design, and the values here are examples.</p>' +
        '<h2>Worked example: 10 kWp at 5.2 peak sun hours a day and a performance ratio of 0.8</h2>' +
        steps(['E0 = 10 × 5.2 × 365 × 0.8 = ' + g4(E0) + ' kWh a year', 'The specific yield is ' + g4(E0) + ' / 10 = ' + g4(spec) + ' kWh per kWp', 'Year 1 with a loss of 2%: ' + g4(E0) + ' × 0.98 = ' + g4(y(1)) + ' kWh', 'Year 25: ' + g4(E0) + ' × 0.98 × 0.995^24 = ' + g4(y(25)) + ' kWh', 'Energy over 25 years = ' + g4(tot) + ' kWh']) +
        '<h2>Output by year for the 10 kWp array</h2>' + table(['Year', 'Output share of E0', 'Energy'], rows),
      faq: [
        ['What is the performance ratio?', 'The ratio of the energy that the plant delivers to the energy that it would deliver at its rating with no losses. A value near 0.75 to 0.85 is common for a well-built plant.'],
        ['Why does the output fall each year?', 'The cells slowly lose power, and the first year is often the worst because of the light-induced loss. The data sheet gives a warranty line.'],
        ['What are peak sun hours?', 'The daily irradiation in kWh/m² read as the hours at 1 kW/m². A site with 5.2 kWh/m² a day has 5.2 peak sun hours.'],
        ['Is the yield the same every year?', 'No. The weather changes from year to year, so a plan uses a typical year and treats a bad year as a risk.']],
      related: [['solar-pv-formulas.html', 'Solar PV Formulas'], ['solar-panel-temperature-formulas.html', 'Solar Panel Temperature Derating Formulas'], ['solar-dc-ac-ratio-formulas.html', 'Solar DC to AC Ratio Formulas'], ['../calculators/solar-pv-sizing/', 'Solar PV sizing calculators']]
    });
    A[A.length - 1].check = { E0, spec, y1: y(1), y25: y(25), tot };
  }

  /* ---------- 139. Faraday electrolysis ---------- */
  {
    const F = 96485, M = 63.55, z = 2, I = 10, t = 3600, eta = 0.95, m100 = M * I * t / (z * F), m = m100 * eta, rho = 8.96, area = 100, th = m / rho / area * 1e4, tar = 25, mt = tar * 1e-4 * area * rho, ts = mt * z * F / (M * I * eta);
    const rows = [['Copper', 63.55, 2], ['Nickel', 58.69, 2], ['Zinc', 65.38, 2], ['Silver', 107.87, 1]].map((r) => [r[0] + ' (M ' + r[1] + ', z ' + r[2] + ')', g4(r[1] * 3600 / (r[2] * F)) + ' g']);
    A.push({
      slug: 'electrolysis-faraday-formulas', h1: 'Electrolysis and Faraday’s Law Formulas',
      desc: 'Faraday’s law formulas for electroplating: the mass deposited by a current in a time, the coating thickness on an area and the time for a target thickness.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Mass deposited', 'm = M × I × t × η / (z × F)'], ['Coating thickness', 'th = m / (ρ × A)'], ['Time for a thickness', 't = th × A × ρ × z × F / (M × I × η)']]) +
        '<p class="note">M is the molar mass of the metal in g/mol, I the current in amperes, t the time in seconds, z the number of electrons per ion, F = 96,485 C/mol the Faraday constant and η the current efficiency as a fraction. ρ is the density of the metal in g/cm³ and A the plated area in cm². The result is the mass in grams and the thickness in cm, which the page turns into micrometres. The formula assumes an even coating, and real plating is thicker at the edges and corners. The efficiency, the current and the area here are examples.</p>' +
        '<h2>Worked example: copper at 10 A for 1 h with a current efficiency of 95%</h2>' +
        steps(['At 100% efficiency, m = 63.55 × 10 × 3,600 / (2 × 96,485) = ' + g4(m100) + ' g', 'At 95%, m = ' + g4(m100) + ' × 0.95 = ' + g4(m) + ' g', 'On 100 cm², th = ' + g4(m) + ' / (8.96 × 100) = ' + g4(th) + ' µm']) +
        '<h2>Worked example: the time to plate 25 µm of copper on 100 cm² at 10 A</h2>' +
        steps(['m = 25 × 10⁻⁴ cm × 100 cm² × 8.96 g/cm³ = ' + g4(mt) + ' g', 't = ' + g4(mt) + ' × 2 × 96,485 / (63.55 × 10 × 0.95) = ' + g4(ts) + ' s, which is ' + g4(ts / 60) + ' min']) +
        '<h2>Mass deposited by one ampere-hour at 100% efficiency</h2>' + table(['Metal', 'Mass per Ah'], rows),
      faq: [
        ['Why is the efficiency below 100%?', 'Some of the current goes into side reactions, such as the release of hydrogen, so less metal is deposited than the law gives.'],
        ['Why does the charge number matter?', 'A metal that needs two electrons per ion deposits half the mass of the same moles that need one. The mass is inversely proportional to z.'],
        ['Is the coating even?', 'No. The current density is higher at the edges and the corners, so those parts plate faster. A shield, an auxiliary anode or a pulse supply can improve it.'],
        ['Does the formula work for other processes?', 'Yes. It holds for any electrolysis, such as refining, anodising or the production of hydrogen, with the molar mass, the charge number and the efficiency of that process.']],
      related: [['battery-formulas.html', 'Battery Formulas'], ['energy-cost-formulas.html', 'Energy and Cost Formulas'], ['ohms-law-formulas.html', 'Ohm’s Law Formulas'], ['../calculators/electrical-fundamentals/', 'Electrical fundamentals calculators']]
    });
    A[A.length - 1].check = { m100, m, th, mt, ts };
  }

  /* ---------- 141. AGL series circuit load and CCR sizing ---------- */
  {
    const n = 60, Pl = 45, et = 0.85, I = 6.6, L = 4, R = 3.08, ld = 0.8, STD = [4, 7.5, 10, 15, 20, 25, 30];
    const lamp = n * Pl / et, cab = I * I * R * L, Pt = lamp + cab, Vo = Pt / I, need = Pt / ld, ccr = STD.find((x) => x * 1000 >= need), pct = Pt / (ccr * 1000) * 100;
    const rows = STD.map((k) => [k + ' kW', g4(k * ld) + ' kW', g4(Pt / (k * 1000) * 100) + '%', Pt <= k * 1000 * ld ? 'Yes' : 'No']);
    A.push({
      slug: 'agl-series-circuit-load-formulas', h1: 'AGL Series Circuit Load and CCR Sizing Formulas',
      desc: 'AGL series circuit formulas: the load of a 6.6 A constant current circuit, the cable loss, the regulator output voltage and the smallest standard CCR size.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Lamp load seen by the regulator', 'Plamps = n × Plamp / ηT'], ['Cable loss', 'Pcable = I² × R × L'], ['Total circuit load', 'Pt = Plamps + Pcable'], ['Regulator output voltage', 'Vout = Pt / I'], ['Rating needed', 'CCR rating ≥ Pt / maximum loading']]) +
        '<p class="note">In a series airfield lighting circuit one constant current regulator (CCR) drives the same current through the primary of every isolating transformer, and it raises or lowers its output voltage to hold that current. n is the number of fittings, Plamp the lamp power of one fitting at the circuit current, ηT the efficiency of the isolating transformer, I the circuit current in amperes (6.6 A at the highest step), R the cable resistance per unit length and L the full length of the series cable loop, with R and L in matching units. The load is treated as resistive with a power factor near 1. The maximum loading is the share of the rated kW that you are willing to use, and the standard sizes here are 4, 7.5, 10, 15, 20, 25 and 30 kW. All values are examples. Take the lamp power and the transformer efficiency from the data sheets, check the result against the manufacturer\'s output curves and your project specification, and size the circuit at the highest brightness step.</p>' +
        '<h2>Worked example: 60 fittings of 45 W on 4 km of cable at 6.6 A</h2><p>The transformer efficiency is 0.85, the cable resistance is 3.08 Ω/km and the maximum loading is 0.8.</p>' +
        steps(['Plamps = 60 × 45 / 0.85 = ' + g4(lamp) + ' W', 'Pcable = 6.6² × 3.08 × 4 = ' + g4(cab) + ' W', 'Pt = ' + g4(lamp) + ' + ' + g4(cab) + ' = ' + g4(Pt) + ' W', 'Vout = ' + g4(Pt) + ' / 6.6 = ' + g4(Vo) + ' V', 'Rating needed = ' + g4(Pt / 1000) + ' / 0.8 = ' + g4(need / 1000) + ' kW, so the smallest standard size is ' + ccr + ' kW', 'The ' + ccr + ' kW regulator is loaded to ' + g4(Pt) + ' / ' + g4(ccr * 1000) + ' = ' + g4(pct) + '%']) +
        '<h2>The example circuit on each standard size</h2>' + table(['CCR rating', 'Usable at 80% loading', 'Example load as a share of the rating', 'Fits'], rows),
      faq: [
        ['Why does the regulator voltage change with the load?', 'A constant current regulator holds the current and lets the voltage follow the load. More fittings or a longer cable need a higher output voltage at the same 6.6 A.'],
        ['Why is the cable loss I² × R × L?', 'The same current flows through the whole series loop, so every metre of conductor loses I² × R. L must be the full conductor length of the loop, not the distance to the last fitting.'],
        ['Why size the circuit at the highest step?', 'The load is largest at the highest brightness step, which is 6.6 A, so that step decides the regulator size. The lower steps carry less current and need less power.'],
        ['What loading limit should I use?', 'The calculator uses 0.8 as an example. Some of the rating is kept for lamp ageing, cable changes and future fittings, so use the limit in your specification or the manufacturer\'s advice.'],
        ['What if the load is above the largest size?', 'Above 30 kW the circuit is split into two or more circuits, each with its own regulator.']],
      related: [['agl-max-fittings-formulas.html', 'AGL Maximum Fittings on a CCR Formulas'], ['agl-brightness-step-formulas.html', 'AGL Brightness Step Formulas'], ['agl-ccr-input-energy-formulas.html', 'AGL CCR Input Power and Energy Formulas'], ['cable-loss-formulas.html', 'Cable Loss Formulas'], ['../calculators/airport-agl-engineering/', 'Airport and AGL calculators']]
    });
    A[A.length - 1].check = { lamp, cab, Pt, Vo, need, ccr, pct };
  }

  /* ---------- 142. AGL maximum fittings on a CCR ---------- */
  {
    const Pr = 10000, Pl = 45, et = 0.85, I = 6.6, R = 3.08, ld = 0.8, L = 4;
    const use = ld * Pr, per = Pl / et, calc = (len) => { const c = I * I * R * len, r = use - c; return { c, r, n: r < 0 ? 0 : Math.floor(r / per + 1e-9) }; };
    const x = calc(L), Pt = x.n * per + x.c, pct = Pt / Pr * 100, Vo = Pt / I;
    const rows = [2, 4, 6, 8].map((len) => { const y = calc(len); return [len + ' km', g4(y.c) + ' W', String(y.n)]; });
    A.push({
      slug: 'agl-max-fittings-formulas', h1: 'AGL Maximum Fittings on a CCR Formulas',
      desc: 'AGL maximum fittings formulas: how many fittings a constant current regulator of a given kW rating can carry on a series circuit after the cable loss.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Usable power', 'Pusable = maximum loading × CCR rating'], ['Cable loss', 'Pcable = I² × R × L'], ['Load of one fitting', 'p = Plamp / ηT'], ['Maximum number of fittings', 'nmax = ⌊(Pusable − Pcable) / p⌋'], ['Circuit load and output voltage', 'Pt = nmax × p + Pcable and Vout = Pt / I']]) +
        '<p class="note">This is the reverse of CCR sizing: the regulator is fixed and the question is how many fittings it can carry. The symbols are those of the series circuit guide. The brackets ⌊ ⌋ mean rounding down to a whole fitting, because a part of a fitting cannot be connected. Every fitting is taken to have the same lamp power and the same transformer efficiency, and the load is resistive. If the cable loss alone is larger than the usable power, no fitting fits, and the loop must be shorter, the conductor larger or the regulator bigger. Keep spare capacity for future fittings and check the circuit at the highest brightness step. The values are examples, so confirm them with the manufacturer\'s output curves.</p>' +
        '<h2>Worked example: a 10 kW CCR at 6.6 A with 45 W fittings on 4 km of cable</h2><p>The transformer efficiency is 0.85, the cable resistance is 3.08 Ω/km and the maximum loading is 0.8.</p>' +
        steps(['Pusable = 0.8 × 10,000 = ' + g4(use) + ' W', 'Pcable = 6.6² × 3.08 × 4 = ' + g4(x.c) + ' W', 'p = 45 / 0.85 = ' + g4(per) + ' W', 'nmax = ⌊(' + g4(use) + ' − ' + g4(x.c) + ') / ' + g4(per) + '⌋ = ⌊' + (x.r / per).toFixed(2) + '⌋ = ' + x.n, 'Pt = ' + x.n + ' × ' + g4(per) + ' + ' + g4(x.c) + ' = ' + g4(Pt) + ' W, which is ' + g4(pct) + '% of the rating, and Vout = ' + g4(Pt) + ' / 6.6 = ' + g4(Vo) + ' V']) +
        '<h2>How the cable length changes the answer</h2>' + table(['Loop length', 'Cable loss', 'Maximum fittings'], rows),
      faq: [
        ['Why round down?', 'The last fitting must fit completely. Rounding up would load the regulator above the limit you chose.'],
        ['Why does a longer cable carry fewer fittings?', 'The cable loss comes out of the same usable power, and it grows with the length. Every watt lost in the cable is a watt that a fitting cannot use.'],
        ['Should I connect the maximum number?', 'Not normally. Keep some capacity for future fittings, lamp ageing and cable repairs, and take the limit from your specification.'],
        ['Does this work for mixed fittings?', 'Not directly. The method takes one lamp power for every fitting. For a mix, add the load of each type: Σ(ni × pi) + Pcable must stay below the usable power.']],
      related: [['agl-series-circuit-load-formulas.html', 'AGL Series Circuit Load and CCR Sizing Formulas'], ['agl-ccr-input-energy-formulas.html', 'AGL CCR Input Power and Energy Formulas'], ['agl-isolating-transformer-formulas.html', 'AGL Isolating Transformer Formulas'], ['cable-loss-formulas.html', 'Cable Loss Formulas'], ['../calculators/airport-agl-engineering/', 'Airport and AGL calculators']]
    });
    A[A.length - 1].check = { use, per, cab: x.c, n: x.n, Pt, pct, Vo };
  }

  /* ---------- 143. AGL isolating transformer ---------- */
  {
    const Ip = 6.6, Ipr = 6.6, Isr = 6.6, Pl = 45, Pr = 100, et = 0.85;
    const Is = Ip * Isr / Ipr, Vs = Pl / Is, Pin = Pl / et, Vp = Pin / Ip, pct = Pl / Pr * 100;
    const Ip2 = 3.4, Isr2 = 20, Pl2 = 30, Pr2 = 200, et2 = 0.8;
    const Is2 = Ip2 * Isr2 / Ipr, Vs2 = Pl2 / Is2, Pin2 = Pl2 / et2, Vp2 = Pin2 / Ip2, pct2 = Pl2 / Pr2 * 100;
    const rows = [2.8, 3.4, 4.1, 5.2, 6.6].map((i) => [g4(i) + ' A', g4(i * 20 / 6.6) + ' A']);
    A.push({
      slug: 'agl-isolating-transformer-formulas', h1: 'AGL Isolating Transformer Formulas',
      desc: 'AGL isolating transformer formulas: the secondary lamp current, the lamp voltage, the primary voltage drop and the loading of a series transformer.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Secondary lamp current', 'Is = Ip × Isr / Ipr'], ['Lamp voltage', 'Vs = Plamp / Is'], ['Input power from the series circuit', 'Pin = Plamp / ηT'], ['Primary voltage drop', 'Vp = Pin / Ip'], ['Transformer loading', 'Loading = Plamp / Prated']]) +
        '<p class="note">A series isolating transformer passes the circuit current from its primary to its secondary in the ratio of its rated currents, so a 6.6/6.6 A unit gives the lamp the circuit current and a 6.6/20 A unit gives it about three times the circuit current. Ip is the circuit current at the brightness step, Ipr and Isr the rated primary and secondary currents from the nameplate, Plamp the lamp power at the secondary current, Prated the transformer rating and ηT its efficiency at that current. The current ratio is the ideal one, and the lamp power is taken as a fixed figure, so look it up at the secondary current that the result shows. Primary drop is the voltage the transformer takes from the series loop. An open secondary, such as a failed lamp, is not modelled and needs the manufacturer\'s data on open-circuit voltage and core saturation. The values are examples.</p>' +
        '<h2>Worked example: a 6.6/6.6 A transformer with a 45 W lamp, rated 100 W</h2><p>The circuit current is 6.6 A and the efficiency is 0.85.</p>' +
        steps(['Is = 6.6 × 6.6 / 6.6 = ' + g4(Is) + ' A', 'Vs = 45 / ' + g4(Is) + ' = ' + g4(Vs) + ' V', 'Pin = 45 / 0.85 = ' + g4(Pin) + ' W', 'Vp = ' + g4(Pin) + ' / 6.6 = ' + g4(Vp) + ' V', 'Loading = 45 / 100 = ' + g4(pct) + '%']) +
        '<h2>Worked example: a 6.6/20 A transformer at 3.4 A with a 30 W lamp, rated 200 W</h2><p>The efficiency is 0.8.</p>' +
        steps(['Is = 3.4 × 20 / 6.6 = ' + g4(Is2) + ' A', 'Vs = 30 / ' + g4(Is2) + ' = ' + g4(Vs2) + ' V', 'Pin = 30 / 0.8 = ' + g4(Pin2) + ' W, so Vp = ' + g4(Pin2) + ' / 3.4 = ' + g4(Vp2) + ' V', 'Loading = 30 / 200 = ' + g4(pct2) + '%']) +
        '<h2>Secondary current of a 6.6/20 A transformer at each step of a five-step circuit</h2>' + table(['Circuit current', 'Secondary current'], rows),
      faq: [
        ['Why use an isolating transformer?', 'It separates each lamp from the series cable, so one failed lamp does not break the circuit and the lamp is not at the cable voltage.'],
        ['Why is the lamp power a fixed number here?', 'A lamp is not a fixed resistance. Its power changes with the current, so the data sheet figure at the secondary current gives the right answer, not the figure at full current.'],
        ['What does loading above 100% mean?', 'The lamp needs more power than the transformer is rated for. Use a larger transformer.'],
        ['Where do the efficiency figures come from?', 'From the transformer data sheet at the circuit current. Efficiency is lower at light load, so it changes with the brightness step.']],
      related: [['agl-series-circuit-load-formulas.html', 'AGL Series Circuit Load and CCR Sizing Formulas'], ['agl-max-fittings-formulas.html', 'AGL Maximum Fittings on a CCR Formulas'], ['transformer-formulas.html', 'Transformer Formulas'], ['transformer-efficiency-formulas.html', 'Transformer Efficiency Formulas'], ['../calculators/airport-agl-engineering/', 'Airport and AGL calculators']]
    });
    A[A.length - 1].check = { Is, Vs, Pin, Vp, pct, Is2, Vs2, Pin2, Vp2, pct2 };
  }

  /* ---------- 144. AGL CCR input power and energy ---------- */
  {
    const Po = 3713, ec = 0.9, pf = 0.9, h = 4380, tar = 8;
    const calc = (e) => { const Pin = Po / e, S = Pin / pf, Q = Math.sqrt(S * S - Pin * Pin), E = Pin * h / 1000; return { Pin, S, Q, E, cost: E * tar }; };
    const x = calc(ec), rows = [0.85, 0.9, 0.95].map((e) => { const y = calc(e); return [g4(e), g4(y.Pin / 1000) + ' kW', g4(y.E) + ' kWh', g4(y.cost)]; });
    A.push({
      slug: 'agl-ccr-input-energy-formulas', h1: 'AGL CCR Input Power and Energy Formulas',
      desc: 'AGL CCR energy formulas: the input power, apparent power and reactive power of a constant current regulator, and its annual energy and running cost.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Input power', 'Pin = Pout / ηCCR'], ['Input apparent power', 'S = Pin / pf'], ['Input reactive power', 'Q = √(S² − Pin²)'], ['Annual energy', 'E = Pin × hours'], ['Annual running cost', 'Cost = E × tariff']]) +
        '<p class="note">Pout is the circuit load that the regulator supplies, ηCCR its efficiency and pf its input power factor, both at the load and the brightness step that you are costing. Both fall at light load and at low steps, so use the data sheet figures for the step. The hours are the hours a year at that step, so cost each step on its own and add the results. The energy is for the regulator input only and does not include the control system, the cooling or the lamps that are not on the circuit. The tariff is per kWh in your own currency. The values are examples.</p>' +
        '<h2>Worked example: a 3.713 kW load at 90% efficiency and a power factor of 0.9</h2><p>The circuit runs for 4,380 hours a year and the tariff is 8 per kWh.</p>' +
        steps(['Pin = 3,713 / 0.9 = ' + g4(x.Pin) + ' W', 'S = ' + g4(x.Pin) + ' / 0.9 = ' + g4(x.S) + ' VA', 'Q = √(' + g4(x.S) + '² − ' + g4(x.Pin) + '²) = ' + g4(x.Q) + ' var', 'E = ' + g4(x.Pin / 1000) + ' kW × 4,380 h = ' + g4(x.E) + ' kWh', 'Cost = ' + g4(x.E) + ' × 8 = ' + g4(x.cost)]) +
        '<h2>The same load at three regulator efficiencies</h2>' + table(['Efficiency', 'Input power', 'Annual energy', 'Annual cost'], rows),
      faq: [
        ['Why is the input power higher than the output?', 'The regulator has losses. The input power is the output divided by the efficiency, so a 90% efficient unit draws about 11% more than it delivers.'],
        ['Why does the power factor matter?', 'It sets the apparent power and the reactive power at the supply. A low power factor raises the current the supply must carry and can add a charge on some tariffs.'],
        ['Why cost each brightness step separately?', 'The load, the efficiency and the power factor all change with the step, and so do the hours spent at it. One figure for all steps would be wrong.'],
        ['Does this include the lamps and the control system?', 'No. It covers the regulator input for the one circuit. Add the control and monitoring system and any other loads separately.']],
      related: [['agl-series-circuit-load-formulas.html', 'AGL Series Circuit Load and CCR Sizing Formulas'], ['agl-brightness-step-formulas.html', 'AGL Brightness Step Formulas'], ['energy-cost-formulas.html', 'Energy and Cost Formulas'], ['power-factor-formulas.html', 'Power Factor Formulas'], ['../calculators/airport-agl-engineering/', 'Airport and AGL calculators']]
    });
    A[A.length - 1].check = { Pin: x.Pin, S: x.S, Q: x.Q, E: x.E, cost: x.cost };
  }

  /* ---------- 145. AGL brightness steps ---------- */
  {
    const n = 60, P66 = 45, et = 0.85, R = 3.08, L = 4, k = 2, T5 = [2.8, 3.4, 4.1, 5.2, 6.6], T3 = [4.8, 5.5, 6.6];
    const at = (I) => { const lamp = n * P66 * Math.pow(I / 6.6, k) / et, cab = I * I * R * L, Pt = lamp + cab; return { I, lamp, cab, Pt, Vo: Pt / I, r: I / 6.6 }; };
    const full = at(6.6), s1 = at(2.8), rows = T5.map((i) => { const y = at(i); return ['Step ' + (T5.indexOf(i) + 1), g4(i) + ' A', g4(y.r * 100) + '%', g4(y.Pt / 1000) + ' kW', g4(y.Vo) + ' V']; });
    A.push({
      slug: 'agl-brightness-step-formulas', h1: 'AGL Brightness Step Formulas',
      desc: 'AGL brightness step formulas: the circuit current at each step of a 6.6 A series circuit, and the lamp load, cable loss and regulator voltage at that step.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Current as a share of full current', 'r = I / 6.6'], ['Lamp load at the step', 'Plamps = n × P6.6 × r^k / ηT'], ['Cable loss at the step', 'Pcable = I² × R × L'], ['Total load and output voltage', 'Pt = Plamps + Pcable and Vout = Pt / I']]) +
        '<p class="note">The regulator sets the brightness by changing the circuit current. A five-step circuit usually uses 2.8, 3.4, 4.1, 5.2 and 6.6 A, and a three-step circuit 4.8, 5.5 and 6.6 A. Confirm the currents against your project specification. P6.6 is the lamp power of one fitting at 6.6 A. The lamp power at a lower step is taken as P6.6 × r^k, where k is an exponent that you choose. With k = 2 the lamp acts as a fixed resistance. A hot filament gives a lower power at a low step, so use the lamp data sheet where you have it. The efficiency of the transformer is taken as constant at every step. The highest step normally sets the regulator size, and the lower steps show the output voltage and the load for checking against the regulator curves. The values are examples.</p>' +
        '<h2>Worked example: step 1 of a five-step circuit at 2.8 A</h2><p>The circuit has 60 fittings of 45 W at 6.6 A on 4 km of cable at 3.08 Ω/km, the efficiency is 0.85 and k = 2.</p>' +
        steps(['r = 2.8 / 6.6 = ' + g4(s1.r) + ', which is ' + g4(s1.r * 100) + '% of full current', 'Plamps = 60 × 45 × ' + g4(s1.r) + '² / 0.85 = ' + g4(s1.lamp) + ' W', 'Pcable = 2.8² × 3.08 × 4 = ' + g4(s1.cab) + ' W', 'Pt = ' + g4(s1.Pt) + ' W and Vout = ' + g4(s1.Pt) + ' / 2.8 = ' + g4(s1.Vo) + ' V', 'The load is ' + g4(s1.Pt / full.Pt * 100) + '% of the ' + g4(full.Pt) + ' W at 6.6 A']) +
        '<h2>The same circuit at each step of a five-step circuit</h2>' + table(['Step', 'Circuit current', 'Share of 6.6 A', 'Total load', 'Regulator voltage'], rows),
      faq: [
        ['Why does the regulator voltage fall at the lower steps?', 'The current is lower, so the lamps and the cable take less power and less voltage is needed to drive the current through the loop.'],
        ['Why does the load fall faster than the current?', 'The lamp power falls roughly with the square of the current or faster, and the cable loss falls with the square of the current as well.'],
        ['What exponent should I use?', 'k = 2 is a simple first estimate. A filament lamp can fall faster than that at a low step, so take the lamp power at each step from the data sheet where it is given.'],
        ['Is the highest step the one to size for?', 'Yes. The regulator is sized at 6.6 A, and this method shows the lower steps so that you can check the output voltage and the load against the curves.']],
      related: [['agl-series-circuit-load-formulas.html', 'AGL Series Circuit Load and CCR Sizing Formulas'], ['agl-ccr-input-energy-formulas.html', 'AGL CCR Input Power and Energy Formulas'], ['agl-lamp-life-formulas.html', 'AGL Lamp Life Formulas'], ['lighting-formulas.html', 'Lighting Formulas'], ['../calculators/airport-agl-engineering/', 'Airport and AGL calculators']]
    });
    A[A.length - 1].check = { r1: s1.r, lamp1: s1.lamp, cab1: s1.cab, Pt1: s1.Pt, Vo1: s1.Vo, share1: s1.Pt / full.Pt * 100, Pt66: full.Pt, T3 };
  }

  /* ---------- 146. AGL lamp life ---------- */
  {
    const I1 = 6.6, T1 = 1000, I2 = 6.1, T2 = 2000, I3 = 6.3, n = 60, H = 4380;
    const m = Math.log(T2 / T1) / Math.log(I1 / I2), life = (i) => T1 * Math.pow(i / I1, -m);
    const T3 = life(I3), rt = T3 / T1, rep = n * H / T3, T5 = life(5.2), rep5 = n * H / T5;
    const rows = [6.6, 6.3, 6.1, 5.8, 5.5, 5.2].map((i) => [g4(i) + ' A', g4(life(i)) + ' h', i === 6.6 || i === 6.1 ? 'reading' : (i < 6.1 ? 'beyond the readings' : 'between the readings')]);
    A.push({
      slug: 'agl-lamp-life-formulas', h1: 'AGL Lamp Life Formulas',
      desc: 'AGL lamp life formulas: a power law fitted to two lamp life readings, the life at another circuit current and the lamp replacements a circuit needs each year.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Life exponent from two readings', 'm = ln(T2 / T1) / ln(I1 / I2)'], ['Life at another current', 'T3 = T1 × (I3 / I1)^(−m)'], ['Life relative to the first reading', 'T3 / T1'], ['Replacements per year', 'n × H / T3']]) +
        '<p class="note">Lamp life rises steeply as the circuit current falls. Two readings from the lamp data sheet, (I1, T1) and (I2, T2), fix a power law, and the life at a third current I3 follows from it. n is the number of fittings and H the hours a year at I3. Rated life is an average, so some lamps fail earlier. The curve is exact only at the two readings: between them it is a fair estimate, and beyond them it is an extrapolation that should be treated as indicative. The readings below are examples and not data for any lamp, so use the readings for your own lamp, or the manufacturer\'s curve if there is one.</p>' +
        '<h2>Worked example: 1,000 h at 6.6 A and 2,000 h at 6.1 A, evaluated at 6.3 A</h2><p>The circuit has 60 fittings that run for 4,380 hours a year.</p>' +
        steps(['m = ln(2,000 / 1,000) / ln(6.6 / 6.1) = ' + g4(m), 'T3 = 1,000 × (6.3 / 6.6)^(−' + g4(m) + ') = ' + g4(T3) + ' h', 'T3 / T1 = ' + g4(rt) + ' times the first reading', 'Replacements = 60 × 4,380 / ' + g4(T3) + ' = ' + g4(rep) + ' a year']) +
        '<h2>Beyond the readings: 5.2 A</h2>' +
        steps(['T3 = 1,000 × (5.2 / 6.6)^(−' + g4(m) + ') = ' + g4(T5) + ' h, which is below the lower reading, so it is an extrapolation', 'Replacements = 60 × 4,380 / ' + g4(T5) + ' = ' + g4(rep5) + ' a year']) +
        '<h2>Life from the same two readings</h2>' + table(['Current', 'Life', 'Position'], rows),
      faq: [
        ['Why does a small drop in current extend the life so much?', 'The filament runs cooler, and the life of a filament rises very steeply as its temperature falls. The exponent m shows how steep the curve is for your lamp.'],
        ['Can I use two readings that are far apart?', 'It gives a rough curve. Readings that are close to the current you want give a better estimate than readings far from it.'],
        ['Why is the result an average?', 'The rated life is the average of many lamps. Some fail earlier and some later, so keep spare lamps and plan the replacements on the average.'],
        ['What does the warning about the order of readings mean?', 'If the life rises with the current, m is negative, which is the wrong way round. Check that each current is paired with its own life.']],
      related: [['agl-brightness-step-formulas.html', 'AGL Brightness Step Formulas'], ['agl-max-fittings-formulas.html', 'AGL Maximum Fittings on a CCR Formulas'], ['lighting-formulas.html', 'Lighting Formulas'], ['peukert-formulas.html', 'Peukert’s Law Formulas'], ['../calculators/airport-agl-engineering/', 'Airport and AGL calculators']]
    });
    A[A.length - 1].check = { m, T3, rt, rep, T5, rep5 };
  }

  /* ---------- 147. complex numbers ---------- */
  {
    const a = 3, b = 4, c = 1, d = -2;
    const m1 = Math.hypot(a, b), t1 = Math.atan2(b, a) / DEG;
    const mulRe = a * c - b * d, mulIm = a * d + b * c, mulM = Math.hypot(mulRe, mulIm), mulT = Math.atan2(mulIm, mulRe) / DEG;
    const den = c * c + d * d, divRe = (a * c + b * d) / den, divIm = (b * c - a * d) / den, divM = Math.hypot(divRe, divIm), divT = Math.atan2(divIm, divRe) / DEG;
    const R = 10, X = 15 - 5, zM = Math.hypot(R, X), zT = Math.atan2(X, R) / DEG, pfZ = Math.cos(Math.atan2(X, R));
    const rows = [[3, 4], [-3, 4], [-3, -4], [3, -4], [-5, 0], [0, 1]].map((z) => [(z[0] + (z[1] < 0 ? ' − j' : ' + j') + Math.abs(z[1])).replace('0 + j1', 'j1'), g4(Math.hypot(z[0], z[1])), g4(Math.atan2(z[1], z[0]) / DEG) + '°']);
    A.push({
      slug: 'complex-number-formulas', h1: 'Complex Number Formulas: Polar and Rectangular',
      desc: 'Complex number formulas for engineers: rectangular and polar form, conversion with atan2, addition, multiplication and division, with worked impedance examples.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Magnitude', '|z| = √(a² + b²)'], ['Angle', 'θ = atan2(b, a)'], ['Rectangular from polar', 'a = |z| cos θ,   b = |z| sin θ'],
        ['Addition', '(a + jb) + (c + jd) = (a + c) + j(b + d)'], ['Multiplication', '(a + jb)(c + jd) = (ac − bd) + j(ad + bc)'],
        ['Division', '(a + jb) / (c + jd) = [(ac + bd) + j(bc − ad)] / (c² + d²)'], ['In polar form', '|z1 z2| = |z1| |z2|, θ = θ1 + θ2;  |z1 / z2| = |z1| / |z2|, θ = θ1 − θ2']]) +
        '<p class="note">j is the square root of −1 (engineers use j because i means current). The angle is measured from the positive real axis. Use atan2(b, a), not arctan(b / a): arctan loses the quadrant, so −3 + j4 would come out as −53.13° instead of 126.87°. Add and subtract in rectangular form; multiply and divide in either form, whichever is quicker.</p>' +
        '<h2>Worked example: multiply and divide (3 + j4) and (1 − j2)</h2>' +
        steps(['|z1| = √(3² + 4²) = ' + g4(m1) + ' and θ1 = atan2(4, 3) = ' + g4(t1) + '°',
          'Product: (ac − bd) = 3 × 1 − 4 × (−2) = ' + g4(mulRe) + ' and (ad + bc) = 3 × (−2) + 4 × 1 = ' + g4(mulIm) + ', so z1 z2 = ' + g4(mulRe) + ' − j' + g4(Math.abs(mulIm)),
          'In polar form the product is ' + g4(mulM) + ' ∠' + g4(mulT) + '°, and ' + g4(m1) + ' × √5 = ' + g4(m1 * Math.sqrt(5)) + ' confirms the magnitude',
          'Quotient: c² + d² = 1 + 4 = ' + g4(den) + ', so z1 / z2 = ' + g4(divRe) + ' + j' + g4(divIm) + ' = ' + g4(divM) + ' ∠' + g4(divT) + '°']) +
        '<h2>Worked example: impedance as a complex number</h2><p>A series circuit has R = 10 Ω, an inductive reactance of 15 Ω and a capacitive reactance of 5 Ω.</p>' +
        steps(['Z = R + j(XL − XC) = 10 + j(15 − 5) = 10 + j' + g4(X) + ' Ω', '|Z| = √(10² + 10²) = ' + g4(zM) + ' Ω and θ = atan2(10, 10) = ' + g4(zT) + '°, so Z = ' + g4(zM) + ' ∠' + g4(zT) + '° Ω',
          'The power factor is cos θ = ' + g4(pfZ) + ' lagging, because the angle is positive (inductive)']) +
        '<h2>Quadrants and the angle from atan2</h2>' + table(['z = a + jb', 'Magnitude', 'Angle'], rows),
      faq: [
        ['Why use atan2 and not arctan(b / a)?', 'arctan(b / a) gives an angle between −90° and 90° only, so it cannot tell 3 + j4 from −3 − j4. atan2 uses the signs of both parts and returns the correct quadrant.'],
        ['When should I use polar form and when rectangular?', 'Rectangular form is easiest for addition and subtraction, for example adding series impedances. Polar form is easiest for multiplication and division, for example V = I × Z.'],
        ['What does a negative angle mean for impedance?', 'The impedance is capacitive: the reactance is negative and the current leads the voltage. A positive angle is inductive, and the current lags the voltage.'],
        ['What is the angle of a negative real number?', 'It is 180°. The calculator reports the range −180° to 180°, and −5 is 5 ∠180°.']],
      related: [['ac-circuit-formulas.html', 'AC Circuit Formulas'], ['resonance-formulas.html', 'Resonance Formulas'], ['power-factor-formulas.html', 'Power Factor Formulas'], ['../calculators/engineering-mathematics/', 'Engineering Mathematics calculators']]
    });
    A[A.length - 1].check = { m1, t1, mulRe, mulIm, mulM, mulT, divRe, divIm, divM, divT, zM, zT, pfZ };
  }

  /* ---------- 148. phasor addition ---------- */
  {
    const P1 = [10, 30], P2 = [5, -45];
    const x1 = P1[0] * Math.cos(P1[1] * DEG), y1 = P1[0] * Math.sin(P1[1] * DEG), x2 = P2[0] * Math.cos(P2[1] * DEG), y2 = P2[0] * Math.sin(P2[1] * DEG);
    const sRe = x1 + x2, sIm = y1 + y2, sM = Math.hypot(sRe, sIm), sT = Math.atan2(sIm, sRe) / DEG;
    const V = 230, lM = Math.hypot(V - V * Math.cos(-120 * DEG), -V * Math.sin(-120 * DEG)), lT = Math.atan2(-V * Math.sin(-120 * DEG), V - V * Math.cos(-120 * DEG)) / DEG;
    A.push({
      slug: 'phasor-addition-formulas', h1: 'Phasor Addition Formulas: Sum and Difference',
      desc: 'Phasor addition formulas for engineers: add and subtract voltages or currents given as magnitude and angle, with worked examples including line voltage.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Rectangular parts of a phasor', 'x = m cos θ,   y = m sin θ'], ['Sum of phasors', 'Re = Σ mₖ cos θₖ,   Im = Σ mₖ sin θₖ'],
        ['Difference', 'Use −1 on the phasor being subtracted: subtract its x and y parts'], ['Resultant magnitude', '|R| = √(Re² + Im²)'], ['Resultant angle', 'θ = atan2(Im, Re)'],
        ['Two phasors, angle φ apart', '|R|² = m₁² + m₂² + 2 m₁ m₂ cos φ']]) +
        '<p class="note">Phasors add as vectors. Two equal phasors 90° apart sum to 1.414 times one of them, not twice. The magnitudes add arithmetically only when every phasor has the same angle. The phasors must have the same frequency, and all be RMS or all be peak.</p>' +
        '<h2>Worked example: 10 ∠30° + 5 ∠−45°</h2>' +
        steps(['Phasor 1: x = 10 cos 30° = ' + g4(x1) + ' and y = 10 sin 30° = ' + g4(y1),
          'Phasor 2: x = 5 cos(−45°) = ' + g4(x2) + ' and y = 5 sin(−45°) = ' + g4(y2),
          'Sum: Re = ' + g4(sRe) + ' and Im = ' + g4(sIm) + ', so the sum is ' + g4(sRe) + ' + j' + g4(sIm),
          '|R| = √(' + g4(sRe) + '² + ' + g4(sIm) + '²) = ' + g4(sM) + ' and θ = atan2(' + g4(sIm) + ', ' + g4(sRe) + ') = ' + g4(sT) + '°, so R = ' + g4(sM) + ' ∠' + g4(sT) + '°']) +
        '<h2>Worked example: line voltage from two phase voltages</h2><p>In a 230 V per phase supply the phase voltages are 230 ∠0° and 230 ∠−120°. The line voltage between them is the difference.</p>' +
        steps(['V12 = 230 ∠0° − 230 ∠−120°, which is 230 − (' + g4(V * Math.cos(-120 * DEG)) + ' − j' + g4(Math.abs(V * Math.sin(-120 * DEG))) + ')',
          'The result is ' + g4(V - V * Math.cos(-120 * DEG)) + ' + j' + g4(-V * Math.sin(-120 * DEG)) + ', so |V12| = ' + g4(lM) + ' V at ' + g4(lT) + '°',
          'This equals √3 × 230 = ' + g4(Math.sqrt(3) * V) + ' V, the familiar line voltage of a three-phase system']),
      faq: [
        ['Why is 10 + 10 not 20 for phasors?', 'A phasor has direction as well as size. Two phasors add to the plain sum of their magnitudes only if they point the same way. At 90° apart the sum is √2 times one of them.'],
        ['How do I subtract a phasor?', 'Reverse it (add 180° to its angle) and add it, or subtract its x and y parts. The calculator has a plus or minus choice for phasors 2 and 3.'],
        ['What does a result of zero mean?', 'The phasors cancel. A balanced three-phase set of three equal phasors 120° apart sums to zero, which is why the neutral of a balanced load carries no current.'],
        ['Can I add RMS and peak phasors together?', 'No. Convert them to the same basis first. The sum is only meaningful when all the phasors use the same value type and the same frequency.']],
      related: [['complex-number-formulas.html', 'Complex Number Formulas'], ['ac-circuit-formulas.html', 'AC Circuit Formulas'], ['three-phase-power-formulas.html', 'Three-Phase Power Formulas'], ['../calculators/engineering-mathematics/', 'Engineering Mathematics calculators']]
    });
    A[A.length - 1].check = { x1, y1, x2, y2, sRe, sIm, sM, sT, lM, lT };
  }

  /* ---------- 149. percentage error ---------- */
  {
    const m1 = 229.2, t1 = 230, e1 = m1 - t1, r1 = e1 / t1, p1 = r1 * 100;
    const m2 = 9.81, t2 = 9.80665, e2 = m2 - t2, p2 = e2 / t2 * 100;
    const tol = 0.5, within = Math.abs(p1) <= tol;
    A.push({
      slug: 'percentage-error-formulas', h1: 'Percentage Error Formulas for Measurements',
      desc: 'Percentage error formulas for engineers: absolute, relative and percentage error of a meter reading, with worked examples and a tolerance check.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Error', 'error = measured − true'], ['Absolute error', '|error| = |measured − true|'], ['Relative error', 'relative error = (measured − true) / |true|'],
        ['Percentage error', 'percentage error = relative error × 100'], ['Absolute percentage error', '|measured − true| / |true| × 100']]) +
        '<p class="note">The error is taken as a share of the true (reference) value, so the true value cannot be zero. A negative result means the reading is low and a positive one means it is high. Percentage error is not the same as percentage difference, which compares two values when neither is the reference.</p>' +
        '<h2>Worked example: a voltmeter reading</h2><p>A reference source is set to 230 V and a voltmeter reads 229.2 V.</p>' +
        steps(['Error = 229.2 − 230 = ' + g4(e1) + ' V', 'Relative error = ' + g4(e1) + ' / 230 = ' + g4(r1), 'Percentage error = ' + g4(r1) + ' × 100 = ' + g4(p1) + '%, so the meter reads low',
          'Against a ±0.5% tolerance the absolute percentage error of ' + g4(Math.abs(p1)) + '% ' + (within ? 'is within' : 'is outside') + ' the limit']) +
        '<h2>Worked example: a measured constant</h2><p>A pendulum test gives g = 9.81 m/s² against the accepted 9.80665 m/s².</p>' +
        steps(['Error = 9.81 − 9.80665 = ' + g4(e2) + ' m/s²', 'Percentage error = ' + g4(e2) + ' / 9.80665 × 100 = ' + g4(p2) + '%']),
      faq: [
        ['Why divide by the true value and not the measured one?', 'The true value is the reference the reading is judged against. Dividing by the measured value would make the same error look different depending on the reading.'],
        ['What does a negative percentage error mean?', 'The measured value is below the true value. A positive error means it is above. Use the absolute percentage error when only the size matters.'],
        ['What if the true value is zero?', 'There is no percentage error, because any error is too large a share of zero to express. Use the absolute error instead.'],
        ['How is this different from percentage difference?', 'Percentage error compares a value with a known true value. Percentage difference compares two values when neither is the reference, using their average as the base.']],
      related: [['measurement-uncertainty-formulas.html', 'Measurement Uncertainty Formulas'], ['ohms-law-formulas.html', 'Ohm’s Law Formulas'], ['phasor-addition-formulas.html', 'Phasor Addition Formulas'], ['../calculators/engineering-mathematics/', 'Engineering Mathematics calculators']]
    });
    A[A.length - 1].check = { e1, r1, p1, e2, p2 };
  }

  /* ---------- 150. trigonometry ---------- */
  {
    const pf = 0.8, phi = Math.acos(pf), tn = Math.tan(phi), P = 100, Q = P * tn, S = P / pf;
    const d2 = 150, r2 = d2 * DEG, s2 = Math.sin(r2), c2 = Math.cos(r2), t2 = s2 / c2;
    A.push({
      slug: 'trigonometry-formulas', h1: 'Trigonometry Formulas for Electrical Engineers',
      desc: 'Sine, cosine and tangent formulas for engineers: the six trig functions, degrees and radians, quadrant signs and power factor angle examples.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Sine', 'sin θ = opposite / hypotenuse'], ['Cosine', 'cos θ = adjacent / hypotenuse'], ['Tangent', 'tan θ = opposite / adjacent = sin θ / cos θ'],
        ['Cosecant, secant, cotangent', 'csc θ = 1 / sin θ,   sec θ = 1 / cos θ,   cot θ = cos θ / sin θ'], ['Degrees to radians', 'radians = degrees × π / 180'], ['Radians to degrees', 'degrees = radians × 180 / π'],
        ['Identity', 'sin² θ + cos² θ = 1']]) +
        '<p class="note">On the unit circle, cos θ is the x coordinate and sin θ is the y coordinate. In the first quadrant (0° to 90°) all functions are positive; in the second only sin is positive, in the third only tan, and in the fourth only cos. tan θ and sec θ are not defined at 90° and 270°, where cos θ = 0. cot θ and csc θ are not defined at 0° and 180°, where sin θ = 0. Check that your calculator is in the right angle mode: sin 30 is 0.5 in degrees but −0.988 in radians.</p>' +
        '<h2>Worked example: reactive power from a power factor of 0.8</h2><p>A load draws P = 100 kW at a lagging power factor of 0.8.</p>' +
        steps(['φ = arccos(0.8) = ' + g4(phi / DEG) + '°', 'sin φ = ' + g4(Math.sin(phi)) + ' and tan φ = ' + g4(tn), 'Q = P tan φ = 100 × ' + g4(tn) + ' = ' + g4(Q) + ' kVAR', 'S = P / cos φ = 100 / 0.8 = ' + g4(S) + ' kVA']) +
        '<h2>Worked example: 150° in degrees and radians</h2>' +
        steps(['150° × π / 180 = ' + g4(r2) + ' rad', '150° is in the second quadrant, so sin is positive and cos is negative: sin 150° = ' + g4(s2) + ' and cos 150° = ' + g4(c2), 'tan 150° = ' + g4(s2) + ' / ' + g4(c2) + ' = ' + g4(t2)]),
      faq: [
        ['Should I use degrees or radians?', 'Use whichever your angle is written in, and make sure the calculator mode matches. Electrical phase angles are normally in degrees; angular frequency in rad/s is in radians.'],
        ['Why does tan 90° have no value?', 'tan θ = sin θ / cos θ and cos 90° = 0, so the division has no value. The tangent grows without limit as the angle approaches 90°.'],
        ['Why does cos 90° show 0 and not 6e-17?', 'The computer holds π only approximately, so a plain cos of 90° in floating point gives a tiny leftover. The calculator treats an angle within a billionth of a degree of a multiple of 90° as exactly that multiple.'],
        ['How do I find the angle from a power factor?', 'Take the inverse cosine of the power factor: a power factor of 0.8 gives 36.87°. Use this calculator in the other direction to check that cos of that angle returns 0.8.']],
      related: [['complex-number-formulas.html', 'Complex Number Formulas'], ['power-factor-formulas.html', 'Power Factor Formulas'], ['ac-circuit-formulas.html', 'AC Circuit Formulas'], ['../calculators/engineering-mathematics/', 'Engineering Mathematics calculators']]
    });
    A[A.length - 1].check = { phi, tn, Q, S, r2, s2, c2, t2 };
  }


  /* ---------- 151. statistics ---------- */
  {
    const xs = [230.1, 229.8, 230.4, 229.8, 231, 230.2], n = xs.length, sum = xs.reduce((a, b) => a + b, 0), mean = sum / n;
    const ss = xs.reduce((a, x) => a + (x - mean) * (x - mean), 0), pvar = ss / n, svar = ss / (n - 1), psd = Math.sqrt(pvar), ssd = Math.sqrt(svar), sem = ssd / Math.sqrt(n);
    const srt = xs.slice().sort((a, b) => a - b), med = (srt[n / 2 - 1] + srt[n / 2]) / 2;
    A.push({
      slug: 'statistics-formulas', h1: 'Mean and Standard Deviation Formulas',
      desc: 'Statistics formulas for test readings: mean, median, mode, range, standard deviation, variance and standard error, with a worked voltage example.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Mean (average)', 'x̄ = (x₁ + x₂ + … + xₙ) / n'], ['Median', 'the middle value of the sorted readings; the average of the two middle values when n is even'], ['Mode', 'the value that occurs most often'], ['Range', 'largest reading − smallest reading'],
        ['Population variance', 'σ² = Σ(x − x̄)² / n'], ['Sample variance', 's² = Σ(x − x̄)² / (n − 1)'], ['Standard deviation', 'the square root of the variance: σ or s'], ['Standard error of the mean', 's / √n']]) +
        '<p class="note">Use the sample formulas (n − 1) when the readings are a sample of a larger set, which is the normal case for repeated test readings. Use the population formulas only when the readings are the whole set. A small standard deviation shows that the readings agree with each other; it does not show that they are correct, because a consistent offset from the true value gives a small spread and a large error.</p>' +
        '<h2>Worked example: six voltage readings</h2><p>Six readings of a nominal 230 V supply: 230.1, 229.8, 230.4, 229.8, 231.0 and 230.2 V.</p>' +
        steps(['Sum = ' + g4(sum) + ' V, so the mean = ' + g4(sum) + ' / 6 = ' + g4(mean) + ' V', 'Sorted: ' + srt.join(', ') + '. With six readings the median is the average of the third and fourth: (' + srt[2] + ' + ' + srt[3] + ') / 2 = ' + g4(med) + ' V', 'The mode is 229.8 V, which occurs twice',
          'Σ(x − x̄)² = ' + g4(ss), 'Population variance = ' + g4(ss) + ' / 6 = ' + g4(pvar) + ', so σ = ' + g4(psd) + ' V', 'Sample variance = ' + g4(ss) + ' / 5 = ' + g4(svar) + ', so s = ' + g4(ssd) + ' V', 'Standard error of the mean = ' + g4(ssd) + ' / √6 = ' + g4(sem) + ' V']),
      faq: [
        ['Should I use the sample or the population standard deviation?', 'For repeated readings of the same quantity, use the sample standard deviation (divide by n − 1). The population value divides by n and suits a complete set, such as every unit in a small batch.'],
        ['What is the difference between the mean and the median?', 'The mean uses every reading, so one bad reading moves it. The median is the middle reading and is little affected by a single outlier. A large gap between them suggests an outlier or a drifting reading.'],
        ['What if no value is repeated?', 'Then there is no mode. If two or more values tie for most frequent, all of them are modes.'],
        ['Does a small standard deviation mean the readings are accurate?', 'No. It means they are repeatable. Accuracy is the offset from the true value, which the percentage error calculator gives.']],
      related: [['percentage-error-formulas.html', 'Percentage Error Formulas'], ['measurement-uncertainty-formulas.html', 'Measurement Uncertainty Formulas'], ['rms-waveform-formulas.html', 'RMS Waveform Formulas'], ['../calculators/engineering-mathematics/', 'Engineering Mathematics calculators']]
    });
    A[A.length - 1].check = { sum, mean, ss, pvar, svar, psd, ssd, sem, med };
  }


  /* ---------- 152. quadratics, logarithms, powers ---------- */
  {
    const a1 = 1, b1 = -5, c1 = 6, D1 = b1 * b1 - 4 * a1 * c1, r1 = (-b1 + Math.sqrt(D1)) / 2, r2 = (-b1 - Math.sqrt(D1)) / 2;
    const a2 = 1, b2 = 2, c2 = 5, D2 = b2 * b2 - 4 * a2 * c2, re2 = -b2 / 2, im2 = Math.sqrt(-D2) / 2;
    const pr = 100, db1 = 10 * Math.log10(pr), vr = 2, db2 = 20 * Math.log10(vr);
    A.push({
      slug: 'quadratic-log-power-formulas', h1: 'Quadratic, Logarithm and Power Formulas',
      desc: 'Formulas for the quadratic equation, logarithms and exponents with electrical examples: real and complex roots, decibels, powers and roots.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Roots of ax² + bx + c = 0', 'x = (−b ± √D) / 2a, where D = b² − 4ac'], ['Sum and product of the roots', 'x₁ + x₂ = −b / a,   x₁ × x₂ = c / a'], ['Vertex', 'x = −b / 2a'],
        ['Logarithm', 'log_b x = y means b^y = x,   log_b x = ln x / ln b'], ['Logarithm rules', 'log(xy) = log x + log y,   log(x / y) = log x − log y,   log(xⁿ) = n log x'],
        ['Powers', 'xᵃ × xᵇ = xᵃ⁺ᵇ,   (xᵃ)ᵇ = xᵃᵇ,   x⁻ⁿ = 1 / xⁿ'], ['Roots', 'k-th root of x = x^(1/k)']]) +
        '<p class="note">The discriminant D tells you the kind of roots: positive gives two real roots, zero gives one repeated root, and negative gives a complex-conjugate pair. When b is much larger than a and c, the plain formula loses digits in the small root to cancellation; find the large root first and the small one from x₁ × x₂ = c / a. A logarithm needs a positive number and a base that is positive and not 1. An even root of a negative number is not real, but an odd root is (the cube root of −8 is −2).</p>' +
        '<h2>Worked example: real roots</h2><p>Solve x² − 5x + 6 = 0.</p>' +
        steps(['D = (−5)² − 4 × 1 × 6 = ' + g4(D1), 'x = (5 ± √' + g4(D1) + ') / 2, so x₁ = ' + g4(r1) + ' and x₂ = ' + g4(r2), 'Check: 3 + 2 = 5 = −b / a and 3 × 2 = 6 = c / a']) +
        '<h2>Worked example: complex roots</h2><p>Solve x² + 2x + 5 = 0, as in the characteristic equation of a damped series circuit.</p>' +
        steps(['D = 2² − 4 × 1 × 5 = ' + g4(D2) + ', which is negative', 'Real part = −b / 2a = ' + g4(re2) + ' and imaginary part = √' + g4(-D2) + ' / 2 = ' + g4(im2), 'The roots are ' + g4(re2) + ' + j' + g4(im2) + ' and ' + g4(re2) + ' − j' + g4(im2)]) +
        '<h2>Worked example: decibels</h2>' +
        steps(['A power ratio of ' + pr + ' is 10 × log₁₀(' + pr + ') = ' + g4(db1) + ' dB', 'A voltage ratio of ' + vr + ' is 20 × log₁₀(' + vr + ') = ' + g4(db2) + ' dB', 'Powers and roots: 2¹⁰ = ' + Math.pow(2, 10) + ', and the cube root of 27 is ' + Math.cbrt(27)]),
      faq: [
        ['What does a negative discriminant mean?', 'The equation has no real roots. The two roots are a complex-conjugate pair, and the parabola does not cross the x axis. In a circuit this is the underdamped case, which oscillates.'],
        ['Why is the logarithm of zero or a negative number not allowed?', 'No power of a positive base gives zero or a negative number, so there is no real logarithm. The logarithm of a number approaching zero falls without limit.'],
        ['Why is decibels 10 log for power and 20 log for voltage?', 'Power goes with the square of voltage or current. Since log(x²) = 2 log x, a voltage ratio uses 20 times the logarithm to give the same decibel value as the matching power ratio.'],
        ['Can I take the square root of a negative number?', 'Not as a real number. The result is imaginary, so use the complex number calculator. An odd root of a negative number, such as the cube root of −8, is real.']],
      related: [['complex-number-formulas.html', 'Complex Number Formulas'], ['trigonometry-formulas.html', 'Trigonometry Formulas'], ['resonance-formulas.html', 'Resonance Formulas'], ['../calculators/engineering-mathematics/', 'Engineering Mathematics calculators']]
    });
    A[A.length - 1].check = { D1, r1, r2, D2, re2, im2, db1, db2 };
  }


  /* ---------- 153. percentage, ratio, rounding ---------- */
  {
    const a1 = 80, b1 = 100, up = (b1 - a1) / a1 * 100, dn = (a1 - b1) / b1 * 100;
    const tn = 11000 / 415, g = 5, v1 = 230, x1 = 1234.5678;
    A.push({
      slug: 'percentage-ratio-rounding-formulas', h1: 'Percentage, Ratio and Rounding Formulas',
      desc: 'Formulas for percentage, percentage change, ratios, proportions, decimal places and significant figures, with worked electrical examples.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['A% of B', 'A × B / 100'], ['A as a percentage of B', 'A / B × 100'], ['Percentage change from A to B', '(B − A) / |A| × 100'], ['B increased or decreased by A%', 'B × (1 ± A / 100)'],
        ['Simplified ratio', 'divide both parts of A : B by their greatest common divisor'], ['Share of A in A : B', 'A / (A + B) × 100'], ['Solving a proportion A : B = C : X', 'X = B × C / A'],
        ['Rounding to d decimal places', 'keep d places; if the next digit is 5 or more, round away from zero'], ['Significant figures', 'count from the first non-zero digit']]) +
        '<p class="note">Percentage change is taken against the starting value, so a rise from 80 to 100 is +25% while the fall from 100 back to 80 is only −20%. The percentage change from zero is not defined. A ratio can be simplified only when both parts are whole numbers; multiply both by a power of ten first if they are decimals. Round only the final answer: rounding in the middle of a calculation adds up the errors.</p>' +
        '<h2>Worked example: percentage change</h2><p>A load rises from 80 A to 100 A and later falls back.</p>' +
        steps(['Rise = (100 − 80) / 80 × 100 = ' + g4(up) + '%', 'Fall = (80 − 100) / 100 × 100 = ' + g4(dn) + '%', 'The two are different because each uses its own starting value as the base']) +
        '<h2>Worked example: a turns ratio</h2><p>A transformer is rated 11,000 V / 415 V.</p>' +
        steps(['Greatest common divisor of 11,000 and 415 = ' + g, 'Simplified: 11,000 : 415 = 2,200 : 83', 'Ratio = 11,000 / 415 = ' + g4(tn) + ' : 1', 'For a primary of 2,200 turns the secondary has 2,200 × 415 / 11,000 = 83 turns']) +
        '<h2>Worked example: rounding</h2>' +
        steps(['1,234.5678 to 2 decimal places = 1,234.57 (the next digit is 7)', '1,234.5678 to 3 significant figures = 1,230 (the first three digits are 1, 2 and 3; the next digit is 4)', 'A reading of ' + v1 + ' V quoted to 2 significant figures is 230 V']),
      faq: [
        ['Why is a 25% rise not undone by a 25% fall?', 'Each percentage is taken of a different base. After a 25% rise the new value is larger, so 25% of it is a bigger amount than the original rise. To undo a 25% rise you need a 20% fall.'],
        ['What is the difference between percentages and percentage points?', 'A move from 10% to 12% is 2 percentage points but a 20% increase. Use percentage points for the difference between two percentages.'],
        ['Why does 2.5 round to 3 and not 2?', 'The common rule rounds a half away from zero. Some software rounds a half to the nearest even number, which gives 2, so check which rule a tool uses.'],
        ['How many significant figures should I quote?', 'No more than the least precise input supports. A voltage read to the nearest volt is not known to four figures just because a calculator shows them.']],
      related: [['percentage-error-formulas.html', 'Percentage Error Formulas'], ['statistics-formulas.html', 'Mean and Standard Deviation Formulas'], ['measurement-uncertainty-formulas.html', 'Measurement Uncertainty Formulas'], ['../calculators/engineering-mathematics/', 'Engineering Mathematics calculators']]
    });
    A[A.length - 1].check = { up, dn, tn, x1 };
  }

  /* ---------- 154. probability, permutations, combinations, binomial ---------- */
  {
    const q1 = 0.02, both = q1 * q1, eith = 2 * q1 - both, nTr = 5, atLeast = 1 - Math.pow(1 - q1, nTr);
    const ch = (a, b) => { let c = 1; for (let j = 1; j <= b; j++) c = c * (a - b + j) / j; return Math.round(c); };
    const nn = 20, pp = 0.05, pm = (k) => ch(nn, k) * Math.pow(pp, k) * Math.pow(1 - pp, nn - k);
    const e2 = pm(2), le2 = pm(0) + pm(1) + pm(2), ge3 = 1 - le2, mean = nn * pp, vr = nn * pp * (1 - pp);
    const perm = 10 * 9 * 8, comb = perm / 6;
    A.push({
      slug: 'probability-formulas', h1: 'Probability, Combinations and Binomial Formulas',
      desc: 'Probability formulas for reliability and test work: two events, repeated trials, permutations, combinations and the binomial distribution, with worked examples.',
      inner: '<h2>The formulas</h2>' + table(['To find', 'Formula'], [
        ['Both of two independent events', 'P(A and B) = P(A) × P(B)'], ['Either of two events', 'P(A or B) = P(A) + P(B) − P(A and B)'], ['Neither event', 'P(neither) = 1 − P(A or B)'], ['Conditional probability', 'P(A given B) = P(A and B) / P(B)'],
        ['At least once in n independent trials', '1 − (1 − p)ⁿ'], ['Permutations of r from n (order matters)', 'nPr = n! / (n − r)!'], ['Combinations of r from n (order does not matter)', 'nCr = n! / (r! (n − r)!)'],
        ['Exactly k successes in n trials', 'P(X = k) = nCk pᵏ (1 − p)ⁿ⁻ᵏ'], ['Mean and variance of the count', 'n p and n p (1 − p)'], ['At least k successes', 'P(X ≥ k) = sum of P(X = j) for j = k to n']]) +
        '<p class="note">Every formula here assumes independence: the outcome of one trial does not change the chance of another. Two lamps on one circuit, or two units fed from one supply, can fail together, and the independent answer is then too optimistic. Multiplying the chances of a series of events gives the chance that all of them happen; for a redundant pair that both must fail, the product is what you want. A small probability over many trials still adds up, which is why the at-least-once formula matters more than the single-trial figure. Probabilities are numbers from 0 to 1; multiply by 100 for a percentage.</p>' +
        '<h2>Worked example: two redundant units</h2><p>Two independent units each have a ' + g4(q1) + ' chance of failing in a year.</p>' +
        steps(['Both fail: ' + g4(q1) + ' × ' + g4(q1) + ' = ' + g4(both), 'At least one fails: ' + g4(q1) + ' + ' + g4(q1) + ' − ' + g4(both) + ' = ' + g4(eith), 'A single unit failing at least once in ' + nTr + ' years: 1 − (1 − ' + g4(q1) + ')^' + nTr + ' = ' + g4(atLeast)]) +
        '<h2>Worked example: counting selections</h2><p>How many ways can three of ten spare units be picked and put in order, and without order?</p>' +
        steps(['In order: 10P3 = 10 × 9 × 8 = ' + perm, 'Without order: 10C3 = ' + perm + ' / 3! = ' + comb, 'Each group of three can be arranged in 3! = 6 orders, which is why the first figure is six times the second']) +
        '<h2>Worked example: lamp failures</h2><p>A row of ' + nn + ' lamps, each with a ' + g4(pp) + ' chance of failing in a year, treated as independent.</p>' +
        steps(['Exactly 2 fail: 20C2 × ' + g4(pp) + '² × ' + g4(1 - pp) + '¹⁸ = ' + ch(nn, 2) + ' × ' + g4(Math.pow(pp, 2)) + ' × ' + g4(Math.pow(1 - pp, 18)) + ' = ' + g4(e2), 'At most 2 fail: P(0) + P(1) + P(2) = ' + g4(pm(0)) + ' + ' + g4(pm(1)) + ' + ' + g4(e2) + ' = ' + g4(le2), 'At least 3 fail: 1 − ' + g4(le2) + ' = ' + g4(ge3), 'Mean number failing = n p = ' + g4(mean) + ' and variance = n p (1 − p) = ' + g4(vr)]),
      faq: [
        ['What is the difference between a permutation and a combination?', 'A permutation counts different orders as different selections; a combination counts them as one. Choosing three units to place in three positions is a permutation; choosing three units to keep as spares is a combination.'],
        ['When can I multiply probabilities?', 'When the events are independent. If one event makes the other more or less likely, as with two units on a shared supply, use the conditional probability P(A given B) in the product instead.'],
        ['Why use the binomial distribution?', 'It gives the chance of exactly k successes in n independent trials with the same chance each time. For a k-out-of-n redundant system, count a working unit as a success and read the at-least-k figure.'],
        ['Does a low failure probability mean failures will not happen?', 'No. With many units or many years the chance of at least one failure grows, as 1 − (1 − p)ⁿ shows. Twenty lamps at 5% each give a mean of one failure a year.']],
      related: [['statistics-formulas.html', 'Mean and Standard Deviation Formulas'], ['percentage-ratio-rounding-formulas.html', 'Percentage, Ratio and Rounding Formulas'], ['measurement-uncertainty-formulas.html', 'Measurement Uncertainty Formulas'], ['../calculators/engineering-mathematics/', 'Engineering Mathematics calculators']]
    });
    A[A.length - 1].check = { both, eith, atLeast, perm, comb, e2, le2, ge3, mean, vr };
  }



  return A;
}

module.exports = { articles };
