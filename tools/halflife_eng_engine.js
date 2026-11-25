/* Elecmetric Half-Life Calculator, Mode 05: engineering exponential decay (RC capacitor discharge, RL inductor current decay, generic signal / degradation decay).
   Engine: one file, no DOM. Required by tests/halflife_eng_test.js and inlined (after tools/halflife_engine.js) into
   calculators/engineering-exponential-decay-calculator/index.html by tools/halflife_eng_page.js.

   The same exponential law as Modes 01 to 04, written with the time constant tau instead of the half-life:   x(t) = x0 exp(-t / tau) = x0 2^(-t / t_half),
   t_half = tau ln 2, lambda = 1 / tau.
     RC discharge   V(t) = V0 exp(-t / RC)      tau = R C        t_half = R C ln 2        (R in ohm, C in farad)
     RL decay       I(t) = I0 exp(-t R / L)     tau = L / R      t_half = (L / R) ln 2    (R in ohm, L in henry)
     generic        x(t) = x0 exp(-t / tau)     tau given, or tau = T_half / ln 2 when a half-life is given
   Two ways to use it: "value" (the value at a given time t) and "time" (the time at which the value falls to a target, an amount or a percentage of the initial value).

   Numerical policy (as Mode 03): every input is converted to SI (prefixes by exact division by a power of ten, so 100 uF is 1e-4 F and not 9.999999999999999e-5 F); the
   fraction remaining is Math.exp(-n) with n = t / tau; the fraction decayed is -expm1(-n), which keeps its digits for a short time; the time to a target is
   n = -ln(f) taken as log1p when the target is close to the start and as a difference of logs when the ratio would underflow; a fraction below the smallest double is
   0 with a warning, never an exact zero; a target of exactly zero has no finite solution and is refused. Errors are returned, never thrown, with the field named.

   SCOPE: ideal first-order circuits discharging to zero (no leakage, ESR, dielectric absorption, coil capacitance or switching arc). Mathematical results only: not a
   safety assessment and not a radiation-safety, dosimetry or exposure assessment. Radioactive half-life and RC / RL half-value time share one equation but are different
   physical processes. */
(function (root) {
  'use strict';
  var H = (typeof module !== 'undefined' && module.exports) ? require('./halflife_engine.js') : root.HalfLife;
  var LN2 = Math.LN2, fmt = H.fmt;
  var P10 = { 0: 1, 3: 1e3, 6: 1e6, 9: 1e9, 12: 1e12 };
  /* [key, label, power of ten, multiplier]: the SI value is v x 10^e (exact division for negative e) or v x multiplier */
  var U = {
    V: [['mV', 'mV', -3], ['V', 'V', 0], ['kV', 'kV', 3]],
    I: [['uA', 'µA', -6], ['mA', 'mA', -3], ['A', 'A', 0], ['kA', 'kA', 3]],
    R: [['mohm', 'mΩ', -3], ['ohm', 'Ω', 0], ['kohm', 'kΩ', 3], ['Mohm', 'MΩ', 6]],
    C: [['pF', 'pF', -12], ['nF', 'nF', -9], ['uF', 'µF', -6], ['mF', 'mF', -3], ['F', 'F', 0]],
    L: [['nH', 'nH', -9], ['uH', 'µH', -6], ['mH', 'mH', -3], ['H', 'H', 0]],
    T: [['ns', 'ns', -9], ['us', 'µs', -6], ['ms', 'ms', -3], ['s', 's', 0], ['min', 'min', 0, 60], ['h', 'h', 0, 3600], ['d', 'days', 0, 86400]]
  };
  var DEFAULT_UNIT = { V: 'V', I: 'A', R: 'ohm', C: 'uF', L: 'mH', T: 's' };
  function def(kind, key) { var l = U[kind]; for (var i = 0; i < l.length; i++) if (l[i][0] === key) return l[i]; return null; }
  function toSI(v, d) { if (d[3]) return v * d[3]; return d[2] >= 0 ? v * P10[d[2]] : v / P10[-d[2]]; }
  function fromSI(v, d) { if (d[3]) return v / d[3]; return d[2] >= 0 ? v / P10[d[2]] : v * P10[-d[2]]; }
  function unitLabel(kind, key) { var d = def(kind, key); return d ? d[1] : String(key); }

  /* ---------- number display with an SI prefix (display only; the numbers stay in SI) ---------- */
  var PFX = { '-12': 'p', '-9': 'n', '-6': 'µ', '-3': 'm', '0': '', '3': 'k', '6': 'M', '9': 'G' };
  function si(v, base, sig) {
    var nb = ' ';
    if (v === 0) return '0' + nb + base;
    if (!isFinite(v) || v !== v) return fmt(v, sig) + nb + base;
    var a = Math.abs(v), e = 3 * Math.floor(Math.log10(a) / 3), s;
    if (e < -12) e = -12; if (e > 9) e = 9;
    var scale = function (x, ee) { return ee >= 0 ? x / P10[ee] : x * P10[-ee]; };
    s = fmt(scale(v, e), sig);
    if (e < 9 && Math.abs(Number(s.replace(/,/g, ''))) >= 1000) { e += 3; s = fmt(scale(v, e), sig); }
    return s + nb + PFX[String(e)] + base;
  }
  /* time in seconds, shown in the unit that reads best */
  function timeText(sec, sig) {
    if (sec === 0) return '0 s';
    var a = Math.abs(sec);
    if (a < 1) return si(sec, 's', sig);
    if (a < 120) return fmt(sec, sig) + ' s';
    if (a < 7200) return fmt(sec / 60, sig) + ' min';
    if (a < 172800) return fmt(sec / 3600, sig) + ' h';
    if (a < 365.25 * 86400 * 2) return fmt(sec / 86400, sig) + ' days';
    return fmt(sec / (365.25 * 86400), sig) + ' years';
  }
  function pct(f, sg, isDec) { return f === 0 && isDec ? '0%' : f === 0 ? '≈ 0%' : fmt(f * 100, sg) + '%'; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  /* ln(a / b) for finite a, b > 0, safe when the plain ratio would underflow or overflow */
  function lnRatio(a, b) {
    var rel = (a - b) / b;
    if (Math.abs(rel) < 1e-3) return Math.log1p(rel);
    var r = a / b;
    if (isFinite(r) && r > 1e-290 && r < 1e290) return Math.log(r);
    return Math.log(a) - Math.log(b);
  }

  /* ---------- the public run() ---------- */
  /* input: { circuit: 'rc' | 'rl' | 'gen', find: 'value' | 'time',
              X0, x0Unit (V or I unit key; ignored for gen), quantityUnit (label, gen only), R, rUnit, C, cUnit, L, lUnit,
              tau, tauUnit, tauKind ('tau' | 'half'; gen only),
              t, tUnit (find = value: the time; find = time: the unit the answer is also shown in),
              target, targetMode ('abs' | 'pct'; find = time), sig } */
  function run(input) {
    input = input || {};
    var c = input.circuit === 'rl' ? 'rl' : input.circuit === 'gen' ? 'gen' : 'rc', find = input.find === 'time' ? 'time' : 'value', sig = input.sig === undefined ? 6 : input.sig, warnings = [];
    var xKind = c === 'rc' ? 'V' : 'I', x0d = c === 'gen' ? null : def(xKind, input.x0Unit || DEFAULT_UNIT[xKind]), rd = def('R', input.rUnit || DEFAULT_UNIT.R), cd = def('C', input.cUnit || DEFAULT_UNIT.C), ld = def('L', input.lUnit || DEFAULT_UNIT.L);
    var taud = def('T', input.tauUnit || 's'), td = def('T', input.tUnit || 's'), tkind = input.tauKind === 'half' ? 'half' : 'tau';
    if (c !== 'gen' && !x0d) return { ok: false, error: 'Unknown ' + (c === 'rc' ? 'voltage' : 'current') + ' unit “' + input.x0Unit + '”.', field: 'x0Unit' };
    if (c !== 'gen' && !rd) return { ok: false, error: 'Unknown resistance unit “' + input.rUnit + '”.', field: 'rUnit' };
    if (c === 'rc' && !cd) return { ok: false, error: 'Unknown capacitance unit “' + input.cUnit + '”.', field: 'cUnit' };
    if (c === 'rl' && !ld) return { ok: false, error: 'Unknown inductance unit “' + input.lUnit + '”.', field: 'lUnit' };
    if (c === 'gen' && !taud) return { ok: false, error: 'Unknown time unit “' + input.tauUnit + '”.', field: 'tauUnit' };
    if (!td) return { ok: false, error: 'Unknown time unit “' + input.tUnit + '”.', field: 'tUnit' };
    var NAME = { X0: c === 'rc' ? 'Initial voltage' : c === 'rl' ? 'Initial current' : 'Initial value', R: 'Resistance', C: 'Capacitance', L: 'Inductance', tau: tkind === 'half' ? 'Half-life' : 'Time constant', t: 'Time', target: 'Target' };
    var need = c === 'rc' ? ['X0', 'R', 'C'] : c === 'rl' ? ['X0', 'R', 'L'] : ['X0', 'tau'];
    var P = {}, k, p;
    for (k = 0; k < need.length; k++) {
      p = H.parseNumber(input[need[k]]);
      if (p.error) return { ok: false, error: NAME[need[k]] + ': ' + p.error, field: need[k] };
      if (p.empty) return { ok: false, empty: true, error: 'Enter the ' + NAME[need[k]].toLowerCase() + '.', field: need[k] };
      if (!(p.value > 0)) return { ok: false, error: NAME[need[k]] + ' must be greater than zero.' + (need[k] === 'X0' ? ' A decay from zero stays at zero.' : ''), field: need[k] };
      P[need[k]] = p.value;
    }
    /* time constant, in seconds */
    var Rsi = c === 'gen' ? undefined : toSI(P.R, rd), tauS, tHalfS;
    if (c === 'rc') tauS = Rsi * toSI(P.C, cd); else if (c === 'rl') tauS = toSI(P.L, ld) / Rsi;
    else if (tkind === 'half') { tHalfS = toSI(P.tau, taud); tauS = tHalfS / LN2; } else tauS = toSI(P.tau, taud);
    if (!isFinite(tauS) || !(tauS > 0)) return { ok: false, error: 'The time constant is outside the range of a double-precision number. Check the units.', field: c === 'gen' ? 'tau' : 'R' };
    if (tHalfS === undefined) tHalfS = tauS * LN2;
    var X0 = P.X0, n, f, dec, tS, targetVal, targetPct, tIn = null;
    if (find === 'value') {
      p = H.parseNumber(input.t);
      if (p.error) return { ok: false, error: 'Time: ' + p.error, field: 't' };
      if (p.empty) return { ok: false, empty: true, error: 'Enter the time.', field: 't' };
      if (p.value < 0) return { ok: false, error: 'Time cannot be negative.', field: 't' };
      tIn = p.value; tS = toSI(tIn, td); n = tS / tauS;
      if (!isFinite(n)) return { ok: false, error: 'The time is too large compared with the time constant to be a double-precision number. Use a closer unit.', field: 't' };
      f = n >= 746 ? 0 : Math.exp(-n); dec = -Math.expm1(-n);
    } else {
      p = H.parseNumber(input.target);
      var tm = input.targetMode === 'pct' ? 'pct' : 'abs';
      if (p.error) return { ok: false, error: 'Target: ' + p.error, field: 'target' };
      if (p.empty) return { ok: false, empty: true, error: 'Enter the target ' + (tm === 'pct' ? 'percentage.' : 'value.'), field: 'target' };
      if (p.value < 0) return { ok: false, error: 'Target cannot be negative.', field: 'target' };
      if (p.value === 0) return { ok: false, error: 'A target of exactly zero is reached only at infinite time, so no finite time exists. Enter a small positive target, for example 1% of the initial value.', field: 'target' };
      if (tm === 'pct') {
        if (p.value > 100) return { ok: false, error: 'The target cannot be more than 100% of the initial value: the quantity only falls.', field: 'target' };
        targetPct = p.value; targetVal = X0 * p.value / 100; f = p.value / 100; dec = (100 - p.value) / 100; n = p.value === 100 ? 0 : (p.value > 99.9 ? -Math.log1p(-(100 - p.value) / 100) : -Math.log(f));
      } else {
        if (p.value > X0) return { ok: false, error: 'The target cannot exceed the initial value: the quantity only falls.', field: 'target' };
        targetVal = p.value; f = p.value / X0; dec = (X0 - p.value) / X0; targetPct = f * 100;
        n = p.value === X0 ? 0 : lnRatio(X0, p.value);
        if (f === 0 || !isFinite(f)) f = Math.exp(-n);
      }
      if (p.value > 0 && n === 0) warnings.push({ code: 'TARGET_EQUALS_START', message: 'The target equals the initial value, so the time is zero.' });
      tS = n * tauS;
    }
    if (f === 0) warnings.push({ code: 'UNDERFLOW_TO_ZERO', message: 'The remaining fraction is smaller than the smallest number a double can hold (about 5 × 10⁻³²⁴), so it shows as 0%. It is not exactly zero.' });
    var r = { ok: true, circuit: c, find: find, sig: sig, tauKind: tkind, tauS: tauS, tHalfS: tHalfS, lambda: 1 / tauS, n: n, halves: n / LN2, tS: tS, frac: f, dec: dec, X0: X0, xt: find === 'time' && targetVal !== undefined ? targetVal : X0 * f, warnings: warnings, tUnit: td[0], tIn: tIn, targetPct: targetPct, units: {} };
    r.timeIn = fromSI(tS, td);
    r.quantityUnit = c === 'gen' ? String(input.quantityUnit || '').trim().slice(0, 16) : x0d[1];
    r.x0Unit = c === 'gen' ? null : x0d[0];
    if (c !== 'gen') { r.input = { R: P.R, rUnit: rd[0] }; r.units.x = x0d[1]; }
    /* derived quantities in SI */
    var v = {}, facts = [], x0SI = c === 'gen' ? X0 : toSI(X0, x0d);
    var add = function (id, label, val, base, text) { v[id] = val; facts.push({ id: id, label: label, value: val, base: base, text: text === undefined ? si(val, base, sig) : text }); };
    add('tau', 'Time constant τ', tauS, 's', timeText(tauS, sig));
    add('tHalf', 'Half-value time t½ = τ ln 2', tHalfS, 's', timeText(tHalfS, sig));
    add('lambda', 'Decay rate λ = 1 / τ', 1 / tauS, '1/s', fmt(1 / tauS, sig) + ' s⁻¹');
    add('time', find === 'time' ? 'Time to reach the target' : 'Elapsed time t', tS, 's', timeText(tS, sig));
    add('n', 'Time constants elapsed n = t / τ', n, '', fmt(n, sig));
    add('halves', 'Half-value times elapsed n / ln 2', n / LN2, '', fmt(n / LN2, sig));
    add('frac', 'Remaining', f, '', pct(f, sig));
    add('dec', 'Decayed', dec, '', pct(dec, sig, 1));
    var qx = (c === 'gen' ? r.quantityUnit : x0d[1]), Qs = qx ? ' ' + qx : '';
    if (c === 'rc') {
      var Csi = toSI(P.C, cd), Vt = x0SI * f, I0 = x0SI / Rsi, Q0 = Csi * x0SI, E0 = 0.5 * Csi * x0SI * x0SI;
      add('xt', 'Capacitor voltage V(t)', r.xt, qx, fmt(r.xt, sig) + Qs); add('V0', 'Initial voltage V₀', X0, qx, fmt(X0, sig) + Qs);
      add('I0', 'Initial discharge current I₀ = V₀ / R', I0, 'A'); add('It', 'Discharge current I(t) = V(t) / R', I0 * f, 'A');
      add('Q0', 'Initial charge Q₀ = C V₀', Q0, 'C'); add('Qt', 'Charge left Q(t)', Q0 * f, 'C');
      add('E0', 'Initial stored energy ½ C V₀²', E0, 'J'); add('Et', 'Energy still stored ½ C V(t)²', E0 * f * f, 'J'); add('Ed', 'Energy dissipated in R so far', E0 * -Math.expm1(-2 * n), 'J');
      add('P0', 'Initial power in R, V₀² / R', x0SI * x0SI / Rsi, 'W');
      v.Vt = Vt;
    } else if (c === 'rl') {
      var Lsi = toSI(P.L, ld), It0 = x0SI, E0l = 0.5 * Lsi * x0SI * x0SI;
      add('xt', 'Inductor current I(t)', r.xt, qx, fmt(r.xt, sig) + Qs); add('I0', 'Initial current I₀', X0, qx, fmt(X0, sig) + Qs);
      add('VR0', 'Initial voltage across R, I₀ R', It0 * Rsi, 'V'); add('VRt', 'Voltage across R now, I(t) R', It0 * f * Rsi, 'V');
      add('psi0', 'Initial flux linkage L I₀', Lsi * It0, 'Wb'); add('psit', 'Flux linkage now, L I(t)', Lsi * It0 * f, 'Wb');
      add('E0', 'Initial stored energy ½ L I₀²', E0l, 'J'); add('Et', 'Energy still stored ½ L I(t)²', E0l * f * f, 'J'); add('Ed', 'Energy dissipated in R so far', E0l * -Math.expm1(-2 * n), 'J');
    } else {
      add('xt', 'Value x(t)', r.xt, qx, fmt(r.xt, sig) + Qs); add('x0', 'Initial value x₀', X0, qx, fmt(X0, sig) + Qs);
      add('lost', 'Amount lost', X0 - r.xt, qx, fmt(find === 'time' ? X0 - targetVal : X0 * dec, sig) + Qs);
    }
    r.v = v; r.facts = facts;
    /* the time-constant ladder and the milestones (fractions of the initial value) */
    var val = function (fr) { return X0 * fr; };
    r.ladder = [0, 1, 2, 3, 4, 5].map(function (m) { var fr = m === 0 ? 1 : Math.exp(-m), tt = m * tauS; return { label: m === 0 ? 'Start' : m + ' τ', n: m, tS: tt, frac: fr, dec: m === 0 ? 0 : -Math.expm1(-m), value: val(fr) }; });
    r.milestones = [[0.9, '90% left'], [0.5, '50% left (half-value time)'], [null, '36.79% left (1 τ)'], [0.1, '10% left'], [0.05, '5% left'], [0.02, '2% left'], [0.01, '1% left'], [0.001, '0.1% left']].map(function (m) {
      var nn = m[0] === null ? 1 : (m[0] === 0.5 ? LN2 : -Math.log(m[0])), fr = m[0] === null ? Math.exp(-1) : m[0];
      return { label: m[1], n: nn, tS: nn * tauS, frac: fr, dec: m[0] === null ? -Math.expm1(-1) : 1 - m[0], value: val(fr) };
    });
    r.check = check(r);
    r.steps = working(r, Qs);
    return r;
  }
  /* independent check: remaining + decayed = 1; the fraction against 2^(-n / ln 2) (a different route from exp); for a target, exp(-n) returns the target ratio */
  function check(r) {
    var worst = Math.abs(r.frac + r.dec - 1), e;
    if (r.n < 700 && r.frac > 1e-300) { e = Math.abs(Math.pow(2, -r.n / LN2) - r.frac) / r.frac; if (e > worst) worst = e; e = Math.abs(Math.exp(-r.n) - r.frac) / r.frac; if (e > worst) worst = e; }
    e = Math.abs(r.tHalfS / r.tauS - LN2); if (e > worst) worst = e;
    return { err: worst, ok: worst <= 1e-12 };
  }
  /* the probe: the same numbers at any number of time constants n */
  function at(r, n) { var f = n >= 746 ? 0 : Math.exp(-n); return { n: n, tS: n * r.tauS, frac: f, dec: -Math.expm1(-n), xt: r.X0 * f }; }

  /* ---------- the written working ---------- */
  function working(r, Qs) {
    var sg = r.sig, F = function (x) { return fmt(x, sg); }, st = [], c = r.circuit, inp = r.input;
    var law = c === 'rc' ? 'V(t) = V₀ e^(−t / RC)\nτ = R C\nt½ = R C ln 2\nI(t) = V(t) / R' : c === 'rl' ? 'I(t) = I₀ e^(−t R / L)\nτ = L / R\nt½ = (L / R) ln 2\nV_R(t) = I(t) R' : 'x(t) = x₀ e^(−t / τ)\nτ = t½ / ln 2  (t½ = τ ln 2)';
    st.push({ title: 'The decay law', text: law + '\nfraction remaining f = e^(−n), where n = t / τ is the number of time constants elapsed\nfraction decayed = 1 − f' });
    st.push({ title: 'Time constant', text: 'τ = ' + timeText(r.tauS, sg) + (r.tauS >= 1e-3 && r.tauS < 1e5 ? ' = ' + F(r.tauS) + ' s' : '') + '\nt½ = τ ln 2 = ' + F(r.tauS) + ' × 0.693147 = ' + timeText(r.tHalfS, sg) + '\nλ = 1 / τ = ' + F(r.lambda) + ' s⁻¹' });
    if (r.find === 'value') st.push({ title: 'Value at the time', text: 't = ' + F(r.tIn) + ' ' + unitLabel('T', r.tUnit) + (r.tUnit !== 's' ? ' = ' + F(r.tS) + ' s' : '') + '\nn = t / τ = ' + F(r.n) + '\nf = e^(−' + F(r.n) + ') = ' + (r.frac === 0 ? '≈ 0' : F(r.frac)) + ' = ' + pct(r.frac, sg) + '\nx(t) = ' + F(r.X0) + Qs + ' × ' + (r.frac === 0 ? '0' : F(r.frac)) + ' = ' + F(r.xt) + Qs });
    else st.push({ title: 'Time to the target', text: 'target ' + F(r.xt) + Qs + ' = ' + pct(r.frac, sg) + ' of ' + F(r.X0) + Qs + '\nn = −ln f = ' + F(r.n) + ' time constants\nt = n τ = ' + F(r.n) + ' × ' + timeText(r.tauS, sg) + ' = ' + timeText(r.tS, sg) + (r.tUnit !== 's' ? ' = ' + F(r.timeIn) + ' ' + unitLabel('T', r.tUnit) : '') });
    st.push({ title: 'Check', text: 'remaining + decayed = 1, and f agrees with 2^(−n / ln 2) and with e^(−n); ' + (r.check.ok ? 'worst disagreement ' + r.check.err.toExponential(1) + ' (better than 1 part in 10¹²).' : 'they differ by a relative ' + r.check.err.toExponential(2) + '. Report this.') });
    st.push({ title: 'Not the same physics as radioactive decay', text: 'The equation is the same as the half-life law in Modes 01 to 04, with λ = 1 / τ. The process is not: ' + (c === 'gen' ? 'a signal envelope or a degradation rate is a model of your system, not a nuclear property.' : 'here a circuit discharges through a resistor, and the half-value time depends on the components you chose, not on a nuclide.') });
    return st;
  }

  /* ---------- the graph ---------- */
  function niceN(xmax) { return xmax <= 10 ? 1 : xmax <= 20 ? 2 : 5; }
  /* opts: { probe: n or undefined, width, height } ; returns a self-contained SVG string (explicit colours, white background) */
  function graph(r, opts) {
    opts = opts || {};
    var W = opts.width || 760, Hh = opts.height || 420, L = 64, R = 18, Tp = 38, B = 70, pw = W - L - R, ph = Hh - Tp - B, i, s = [];
    var xmax = r.n <= 5 ? 5 : r.n <= 10 ? 10 : r.n <= 20 ? 20 : r.n <= 40 ? 40 : 5, gp = r.n > 40;
    var xs = function (n) { return L + n / xmax * pw; }, ys = function (f) { return Tp + ph - f * ph; };
    var kind = r.circuit === 'rc' ? 'RC capacitor discharge' : r.circuit === 'rl' ? 'RL inductor current decay' : 'Exponential decay';
    var title = kind + ': percentage remaining against time', desc = 'Time constant ' + timeText(r.tauS, 6) + ', half-value time ' + timeText(r.tHalfS, 6) + '. Time runs from 0 to ' + fmt(xmax, 6) + ' time constants, ' + timeText(xmax * r.tauS, 6) + '. At one time constant 36.8% remains; at five, 0.67%.';
    s.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + Hh + '" width="' + W + '" height="' + Hh + '" role="img" aria-labelledby="ed-gt ed-gd" font-family="Arial, Helvetica, sans-serif">');
    s.push('<title id="ed-gt">' + esc(title) + '</title><desc id="ed-gd">' + esc(desc) + '</desc><defs><clipPath id="ed-clip"><rect x="' + L + '" y="' + Tp + '" width="' + pw + '" height="' + ph + '"/></clipPath></defs><rect width="' + W + '" height="' + Hh + '" fill="#ffffff"/>');
    s.push('<text x="' + L + '" y="22" font-size="15" font-weight="700" fill="#1a1a1a">' + esc(kind) + ': percentage remaining</text>');
    [0, 20, 40, 60, 80, 100].forEach(function (v) { var y = ys(v / 100); s.push('<line x1="' + L + '" y1="' + y.toFixed(1) + '" x2="' + (L + pw) + '" y2="' + y.toFixed(1) + '" stroke="#d9d9d9"/><text x="' + (L - 8) + '" y="' + (y + 4).toFixed(1) + '" font-size="11" text-anchor="end" fill="#333">' + v + '%</text>'); });
    var st = niceN(xmax);
    for (i = 0; i <= xmax; i += st) { var x = xs(i); s.push('<line x1="' + x.toFixed(1) + '" y1="' + Tp + '" x2="' + x.toFixed(1) + '" y2="' + (Tp + ph) + '" stroke="#ececec"/><text x="' + x.toFixed(1) + '" y="' + (Tp + ph + 16) + '" font-size="11" text-anchor="middle" fill="#333">' + (i === 0 ? '0' : i + 'τ') + '</text><text x="' + x.toFixed(1) + '" y="' + (Tp + ph + 30) + '" font-size="10" text-anchor="middle" fill="#555">' + esc(timeText(i * r.tauS, 3).replace(' ', ' ')) + '</text>'); }
    s.push('<rect x="' + L + '" y="' + Tp + '" width="' + pw + '" height="' + ph + '" fill="none" stroke="#6b6b6b"/>');
    s.push('<text x="' + (L + pw / 2) + '" y="' + (Hh - 14) + '" font-size="12" text-anchor="middle" fill="#1a1a1a">Time in time constants (τ), with the time below</text>');
    s.push('<text transform="translate(16 ' + (Tp + ph / 2) + ') rotate(-90)" font-size="12" text-anchor="middle" fill="#1a1a1a">Remaining</text>');
    /* half-value time marker */
    var hx = xs(LN2); s.push('<line class="hvm" x1="' + hx.toFixed(1) + '" y1="' + ys(0.5).toFixed(1) + '" x2="' + hx.toFixed(1) + '" y2="' + (Tp + ph) + '" stroke="#1f4e8c" stroke-dasharray="4 3"/><line x1="' + L + '" y1="' + ys(0.5).toFixed(1) + '" x2="' + hx.toFixed(1) + '" y2="' + ys(0.5).toFixed(1) + '" stroke="#1f4e8c" stroke-dasharray="4 3"/><text x="' + (hx + 5).toFixed(1) + '" y="' + (Tp + ph - 6) + '" font-size="10" fill="#1f4e8c">t½ = 0.693 τ</text>');
    /* curve: 240 points of the model itself */
    var pts = [], N = 240;
    for (i = 0; i <= N; i++) { var nn = xmax * i / N; pts.push(xs(nn).toFixed(1) + ',' + ys(Math.exp(-nn)).toFixed(1)); }
    s.push('<polyline clip-path="url(#ed-clip)" fill="none" stroke="#b8860b" stroke-width="2.5" points="' + pts.join(' ') + '"/>');
    /* markers at whole time constants 1 to 5 with their percentage */
    for (i = 1; i <= Math.min(5, xmax); i++) { var mx = xs(i), my = ys(Math.exp(-i)); s.push('<circle class="tcm" cx="' + mx.toFixed(1) + '" cy="' + my.toFixed(1) + '" r="3.2" fill="#b8860b"/><text x="' + (mx + 6).toFixed(1) + '" y="' + (my - 6).toFixed(1) + '" font-size="10" fill="#7a5a00">' + fmt(Math.exp(-i) * 100, 3) + '%</text>'); }
    /* the result, and the probe */
    if (!gp && r.n >= 0 && r.n <= xmax) s.push('<circle class="res" cx="' + xs(r.n).toFixed(1) + '" cy="' + ys(r.frac).toFixed(1) + '" r="6" fill="#ffffff" stroke="#1a1a1a" stroke-width="2.5"/>');
    if (opts.probe !== undefined && opts.probe >= 0 && opts.probe <= xmax) { var px = xs(opts.probe); s.push('<line x1="' + px.toFixed(1) + '" y1="' + Tp + '" x2="' + px.toFixed(1) + '" y2="' + (Tp + ph) + '" stroke="#1a1a1a" stroke-width="1.5" stroke-dasharray="3 3"/><circle cx="' + px.toFixed(1) + '" cy="' + ys(Math.exp(-opts.probe)).toFixed(1) + '" r="5" fill="#ffffff" stroke="#b8860b" stroke-width="2.5"/>'); }
    s.push('<line x1="' + (L + 10) + '" y1="' + (Tp + 13) + '" x2="' + (L + 40) + '" y2="' + (Tp + 13) + '" stroke="#b8860b" stroke-width="2.5"/><text x="' + (L + 48) + '" y="' + (Tp + 17) + '" font-size="11" fill="#1a1a1a">e^(−t/τ)' + (!gp ? '' : ' (result beyond 40 τ, not drawn)') + '</text>');
    s.push('</svg>');
    return s.join('');
  }

  /* ---------- exports ---------- */
  function rowsOf(r) { return r.ladder.concat(r.milestones); }
  function exportCsv(r) {
    var q = function (v) { v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }, qu = r.quantityUnit ? ' (' + r.quantityUnit + ')' : '';
    var o = [['Point', 'Time constants (n)', 'Time (s)', 'Remaining %', 'Decayed %', 'Value' + qu].map(q).join(',')];
    rowsOf(r).forEach(function (x) { o.push([x.label, x.n, x.tS, x.frac * 100, x.dec * 100, x.value].map(q).join(',')); });
    return o.join('\r\n') + '\r\n';
  }
  function exportTxt(r) {
    var sg = r.sig, o = ['Elecmetric Half-Life Calculator, Mode 05 (engineering exponential decay)', '', r.circuit === 'rc' ? 'RC capacitor discharge' : r.circuit === 'rl' ? 'RL inductor current decay' : 'Generic exponential decay', ''];
    r.facts.forEach(function (f) { o.push(f.label + ': ' + f.text); });
    o.push('', ['Point', 'n', 'Time', 'Remaining', 'Decayed', 'Value'].join('\t'));
    rowsOf(r).forEach(function (x) { o.push([x.label, fmt(x.n, sg), timeText(x.tS, sg), pct(x.frac, sg), pct(x.dec, sg, 1), fmt(x.value, sg) + (r.quantityUnit ? ' ' + r.quantityUnit : '')].join('\t')); });
    o.push(''); r.steps.forEach(function (s) { o.push(s.title.toUpperCase()); o.push(s.text); o.push(''); });
    r.warnings.forEach(function (w) { o.push('Note: ' + w.message); });
    o.push('Ideal first-order circuit discharging to zero. Mathematical result only: not a safety assessment, and not a radiation-safety or dosimetry assessment.');
    return o.join('\n');
  }
  function exportJson(r) {
    var j = { tool: 'Elecmetric Half-Life Calculator, Mode 05', circuit: r.circuit, find: r.find, timeConstantSeconds: r.tauS, halfValueTimeSeconds: r.tHalfS, decayRatePerSecond: r.lambda, timeConstantsElapsed: r.n, timeSeconds: r.tS, remainingPercentage: r.frac * 100, decayedPercentage: r.dec * 100, initialValue: r.X0, valueNow: r.xt, valueUnit: r.quantityUnit, warnings: r.warnings.map(function (w) { return w.code; }) };
    j.results = {}; r.facts.forEach(function (f) { j.results[f.id] = { label: f.label, value: f.value, unit: f.base }; });
    j.points = rowsOf(r).map(function (x) { return { point: x.label, timeConstants: x.n, timeSeconds: x.tS, remainingPercentage: x.frac * 100, decayedPercentage: x.dec * 100, value: x.value }; });
    return JSON.stringify(j, null, 2);
  }

  var api = { LN2: LN2, UNITS: U, DEFAULT_UNIT: DEFAULT_UNIT, toSI: toSI, fromSI: fromSI, unitLabel: unitLabel, si: si, timeText: timeText, run: run, at: at, graph: graph, exportTxt: exportTxt, exportCsv: exportCsv, exportJson: exportJson };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.HalfLifeEng = api;
})(typeof window !== 'undefined' ? window : this);
