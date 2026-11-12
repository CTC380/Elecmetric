/* Elecmetric reference pages: pure functions and data.
   Functions are written without closures over module data (the tables are passed in), so the same function text
   runs on the page (via toString) and in the build and tests. */

/* ---------- resistor colour code (IEC 60062 style) ---------- */
const RES_T = {
  digit: { black: 0, brown: 1, red: 2, orange: 3, yellow: 4, green: 5, blue: 6, violet: 7, grey: 8, white: 9 },
  mult: { black: 1, brown: 10, red: 100, orange: 1e3, yellow: 1e4, green: 1e5, blue: 1e6, violet: 1e7, grey: 1e8, white: 1e9, gold: 0.1, silver: 0.01 },
  tol: { brown: 1, red: 2, green: 0.5, blue: 0.25, violet: 0.1, grey: 0.05, gold: 5, silver: 10 },
  ppm: { brown: 100, red: 50, orange: 15, yellow: 25, blue: 10, violet: 5 },
  order: {
    d: ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'white'],
    m: ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'white', 'gold', 'silver'],
    t: ['brown', 'red', 'green', 'blue', 'violet', 'grey', 'gold', 'silver'],
    p: ['brown', 'red', 'orange', 'yellow', 'blue', 'violet']
  },
  defaults: {
    3: ['yellow', 'violet', 'red'],
    4: ['yellow', 'violet', 'red', 'gold'],
    5: ['yellow', 'violet', 'black', 'brown', 'brown'],
    6: ['yellow', 'violet', 'black', 'brown', 'brown', 'brown']
  },
  css: { black: '#111111', brown: '#7B4A1E', red: '#D62828', orange: '#F77F00', yellow: '#FCD116', green: '#2A9D3F', blue: '#2563C9', violet: '#8A3FC2', grey: '#8A8F98', white: '#FFFFFF', gold: '#C9A227', silver: '#C0C4CC' }
};

function resRoles(n) {
  return { 3: ['d', 'd', 'm'], 4: ['d', 'd', 'm', 't'], 5: ['d', 'd', 'd', 'm', 't'], 6: ['d', 'd', 'd', 'm', 't', 'p'] }[n] || null;
}

function resFmt(v) {
  var a = Math.abs(v), u = '\u03a9', d = 1;
  if (a >= 1e9) { u = 'G\u03a9'; d = 1e9; } else if (a >= 1e6) { u = 'M\u03a9'; d = 1e6; } else if (a >= 1e3) { u = 'k\u03a9'; d = 1e3; }
  return String(Number((v / d).toPrecision(6))) + ' ' + u;
}

function resLabel(T, role, c) {
  var name = c.charAt(0).toUpperCase() + c.slice(1);
  if (role === 'd') return name + ' (' + T.digit[c] + ')';
  if (role === 'm') return name + ' (\u00d7' + String(T.mult[c]) + ')';
  if (role === 't') return name + ' (\u00b1' + T.tol[c] + '%)';
  return name + ' (' + T.ppm[c] + ' ppm/K)';
}

/* Colour names, in band order, to a resistance. 3 bands = two digits and a multiplier (tolerance 20%);
   4 = two digits, multiplier, tolerance; 5 = three digits, multiplier, tolerance; 6 adds the temperature coefficient. */
function resDecode(T, bands) {
  var n = bands.length, roles = {
    3: ['d', 'd', 'm'], 4: ['d', 'd', 'm', 't'], 5: ['d', 'd', 'd', 'm', 't'], 6: ['d', 'd', 'd', 'm', 't', 'p']
  }[n];
  if (!roles) return { ok: false, error: 'A resistor has 3, 4, 5 or 6 colour bands.' };
  var table = { d: T.digit, m: T.mult, t: T.tol, p: T.ppm }, what = { d: 'a digit colour (black to white)', m: 'a multiplier colour', t: 'a tolerance colour', p: 'a temperature coefficient colour' };
  var digits = '', mult = 1, tol = 20, ppm = null, i, c;
  for (i = 0; i < n; i++) {
    c = String(bands[i]).toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(table[roles[i]], c)) return { ok: false, error: 'Band ' + (i + 1) + ' must be ' + what[roles[i]] + ', not ' + c + '.' };
    if (i === 0 && c === 'black') return { ok: false, error: 'Band 1 cannot be black: a resistor value does not start with a zero digit.' };
    if (roles[i] === 'd') digits += String(T.digit[c]);
    else if (roles[i] === 'm') mult = T.mult[c];
    else if (roles[i] === 't') tol = T.tol[c];
    else ppm = T.ppm[c];
  }
  var ohms = Number((Number(digits) * mult).toPrecision(12)), lo = Number((ohms * (1 - tol / 100)).toPrecision(12)), hi = Number((ohms * (1 + tol / 100)).toPrecision(12));
  return { ok: true, ohms: ohms, tol: tol, ppm: ppm, min: lo, max: hi, digits: digits,
    text: resFmt(ohms) + ' \u00b1' + tol + '%' + (ppm !== null ? ', ' + ppm + ' ppm/K' : ''), range: resFmt(lo) + ' to ' + resFmt(hi) };
}

/* A resistance, as text ("4.7k", "220", "1M5" is not accepted), to colour bands. n = 4 or 5 bands. */
function resEncode(T, str, n, tolPct) {
  var s = String(str).replace(/[\s,\u03a9]/g, '').replace(/ohms?$/i, ''), mul = 1, m = /^([0-9]*\.?[0-9]+(?:e[+-]?[0-9]+)?)([kKmMgG]?)$/.exec(s);
  if (!m) return { ok: false, error: 'Enter a resistance such as 4700, 4.7k, 330 or 2.2M.' };
  var sfx = m[2];
  if (sfx === 'k' || sfx === 'K') mul = 1e3; else if (sfx === 'm' || sfx === 'M') mul = 1e6; else if (sfx === 'g' || sfx === 'G') mul = 1e9;
  var v = Number(m[1]) * mul, nd = n - 2, roles = resRoles(n);
  if (!roles || (n !== 4 && n !== 5)) return { ok: false, error: 'Choose 4 or 5 bands.' };
  if (!isFinite(v) || v <= 0) return { ok: false, error: 'The resistance must be greater than zero.' };
  var tc = null, k;
  for (k in T.tol) if (Object.prototype.hasOwnProperty.call(T.tol, k) && T.tol[k] === Number(tolPct)) tc = k;
  if (tc === null) return { ok: false, error: 'That tolerance has no colour band.' };
  var lo = Math.pow(10, nd - 1), hi = Math.pow(10, nd), e, mant = null, ex = null;
  for (e = -2; e <= 9; e++) {
    var q = v * Math.pow(10, -e);
    if (Math.round(q) >= lo && Math.round(q) < hi && Math.abs(q - Math.round(q)) <= 1e-9 * q) { mant = Math.round(q); ex = e; break; }
  }
  if (mant === null) {
    if (v < lo * 0.01) return { ok: false, error: 'That is below the smallest value ' + n + ' bands can show (' + resFmt(lo * 0.01) + ').' };
    if (v >= hi * 1e9) return { ok: false, error: 'That is above the largest value ' + n + ' bands can show.' };
    return { ok: false, error: resFmt(v) + ' needs more than ' + nd + ' significant digits' + (n === 4 ? ', so use 5 bands or the nearest standard value.' : '. Pick the nearest standard value.') };
  }
  var mc = null;
  for (k in T.mult) if (Object.prototype.hasOwnProperty.call(T.mult, k) && Math.abs(Math.log10(T.mult[k]) - ex) < 1e-9) mc = k;
  var ds = String(mant), bands = [], i;
  for (i = 0; i < ds.length; i++) {
    var dc = null, kk;
    for (kk in T.digit) if (Object.prototype.hasOwnProperty.call(T.digit, kk) && T.digit[kk] === Number(ds.charAt(i))) dc = kk;
    bands.push(dc);
  }
  bands.push(mc, tc);
  return { ok: true, bands: bands, text: bands.map(function (b) { return b.charAt(0).toUpperCase() + b.slice(1); }).join(', ') };
}

function resInit(T, doc) {
  var $ = function (i) { return doc.getElementById(i); }, nSel = $('rc-n');
  if (!nSel) return;
  var err = $('rc-err');
  function roles() { return resRoles(Number(nSel.value)); }
  function fillRow(i, role, pick) {
    var sel = $('rc-b' + (i + 1)), row = $('rc-r' + (i + 1)), lab = $('rc-l' + (i + 1));
    if (!role) { if (row) row.hidden = true; return; }
    if (row) row.hidden = false;
    var names = { d: 'digit', m: 'multiplier', t: 'tolerance', p: 'temperature coefficient' };
    lab.textContent = 'Band ' + (i + 1) + ': ' + names[role];
    sel.innerHTML = '';
    T.order[role].forEach(function (c) { var o = doc.createElement('option'); o.value = c; o.textContent = resLabel(T, role, c); sel.appendChild(o); });
    sel.value = pick;
  }
  function paint() {
    var rs = roles(), bands = [], i;
    for (i = 0; i < rs.length; i++) bands.push($('rc-b' + (i + 1)).value);
    var r = resDecode(T, bands);
    for (i = 0; i < 6; i++) { var s = $('rc-s' + (i + 1)); if (s) { s.hidden = i >= rs.length; if (s.style) s.style.background = T.css[$('rc-b' + (i + 1)).value] || 'transparent'; } }
    $('rc-out').textContent = r.ok ? r.text : '\u2014';
    $('rc-range').textContent = r.ok ? r.range : '\u2014';
    err.textContent = r.ok ? '' : r.error;
  }
  function setN() { var rs = roles(), d = T.defaults[nSel.value], i; for (i = 0; i < 6; i++) fillRow(i, rs[i], d[i]); paint(); }
  nSel.addEventListener('change', setN);
  [1, 2, 3, 4, 5, 6].forEach(function (i) { $('rc-b' + i).addEventListener('change', paint); });
  setN();
  var ev = $('rc-v');
  if (ev) {
    var enc = function () {
      var r = resEncode(T, ev.value, Number($('rc-n2').value), Number($('rc-t').value)), i;
      $('rc-enc').textContent = r.ok ? r.text : '\u2014';
      for (i = 0; i < 5; i++) { var s = $('rc-e' + (i + 1)); if (s) { s.hidden = !r.ok || i >= r.bands.length; if (s.style && r.ok && i < r.bands.length) s.style.background = T.css[r.bands[i]]; } }
      $('rc-err2').textContent = r.ok || ev.value.trim() === '' ? '' : r.error;
    };
    ev.addEventListener('input', enc); $('rc-n2').addEventListener('change', enc); $('rc-t').addEventListener('change', enc); enc();
  }
}

/* ---------- Coulomb's law ---------- */
const COULOMB_UNITS = { q: { nC: 1e-9, '\u00b5C': 1e-6, mC: 1e-3, C: 1, e: 1.602176634e-19 }, r: { m: 1, cm: 0.01, mm: 0.001, '\u00b5m': 1e-6, nm: 1e-9, pm: 1e-12 } };

/* F = k q1 q2 / r^2, k = 1/(4 pi eps0) = 8.9875517923e9 N m^2 / C^2 (CODATA 2018). Returns the magnitude and whether it attracts or repels. */
function coulombForce(U, q1, uq1, q2, uq2, r, ur) {
  var k = 8.9875517923e9, a = Number(String(q1).replace(/,/g, '')), b = Number(String(q2).replace(/,/g, '')), d = Number(String(r).replace(/,/g, ''));
  if (String(q1).trim() === '' || String(q2).trim() === '' || String(r).trim() === '' || !isFinite(a) || !isFinite(b) || !isFinite(d)) return { ok: false, error: 'Enter a number in each box, for example 2 or 1.5e-6.' };
  if (!U.q[uq1] || !U.q[uq2] || !U.r[ur]) return { ok: false, error: 'Choose a unit for each value.' };
  var A = a * U.q[uq1], B = b * U.q[uq2], D = d * U.r[ur];
  if (D <= 0) return { ok: false, error: 'The distance must be greater than zero.' };
  var F = k * Math.abs(A * B) / (D * D);
  if (!isFinite(F)) return { ok: false, error: 'That combination is outside the range this page handles.' };
  var kind = A * B === 0 ? 'none' : (A * B < 0 ? 'attractive' : 'repulsive');
  return { ok: true, F: F, kind: kind, q1: A, q2: B, r: D };
}

function coulombText(F) {
  if (F === 0) return '0 N';
  var a = Math.abs(F), m;
  if (a >= 1e-4 && a < 1e9) { var s = String(Number(F.toPrecision(6))), p = s.split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); return p.join('.') + ' N'; }
  m = F.toExponential(5).split('e');
  var sup = { '-': '\u207b', 0: '\u2070', 1: '\u00b9', 2: '\u00b2', 3: '\u00b3', 4: '\u2074', 5: '\u2075', 6: '\u2076', 7: '\u2077', 8: '\u2078', 9: '\u2079' };
  return m[0].replace(/\.?0+$/, '') + ' \u00d7 10' + String(Number(m[1])).split('').map(function (c) { return sup[c]; }).join('') + ' N';
}

function cbInit(U, doc) {
  var $ = function (i) { return doc.getElementById(i); }, q1 = $('cb-q1');
  if (!q1) return;
  var calc = function () {
    var r = coulombForce(U, q1.value, $('cb-u1').value, $('cb-q2').value, $('cb-u2').value, $('cb-r').value, $('cb-ur').value);
    $('cb-out').textContent = r.ok ? coulombText(r.F) : '\u2014';
    $('cb-kind').textContent = r.ok ? (r.kind === 'attractive' ? 'Attractive (unlike charges)' : r.kind === 'repulsive' ? 'Repulsive (like charges)' : 'No force (one charge is zero)') : '\u2014';
    $('cb-err').textContent = r.ok ? '' : r.error;
  };
  ['cb-q1', 'cb-q2', 'cb-r'].forEach(function (i) { $(i).addEventListener('input', calc); });
  ['cb-u1', 'cb-u2', 'cb-ur'].forEach(function (i) { $(i).addEventListener('change', calc); });
  calc();
}

/* ---------- watts to amps and amps to watts, for the numeric pages ----------
   sys: 'dc', '1ph' (single phase) or '3ph' (three phase, line-to-line voltage). Power factor is not used for DC. */
function ltCalc(mode, x, V, pf, sys) {
  var a = Number(String(x).replace(/,/g, '')), v = Number(String(V).replace(/,/g, '')), f = Number(String(pf).replace(/,/g, ''));
  if (String(x).trim() === '' || !isFinite(a) || a <= 0) return { ok: false, error: 'Enter a value greater than zero.' };
  if (String(V).trim() === '' || !isFinite(v) || v <= 0) return { ok: false, error: 'Enter a voltage greater than zero.' };
  if (mode !== 'sa' && sys !== 'dc' && (!isFinite(f) || f <= 0 || f > 1)) return { ok: false, error: 'Power factor must be above 0 and no more than 1.' };
  var k = sys === '3ph' ? Math.sqrt(3) : 1, p = sys === 'dc' ? 1 : f, toA = mode === 'wa' || mode === 'ka', kw = mode === 'ka' || mode === 'ak', r = mode === 'sa' ? a * 1000 / (k * v) : toA ? a * (kw ? 1000 : 1) / (k * v * p) : a * k * v * p / (kw ? 1000 : 1);
  if (!isFinite(r)) return { ok: false, error: 'That combination is outside the range this page handles.' };
  var t = String(Number(r.toPrecision(4))), q = t.split('.');
  q[0] = q[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return { ok: true, value: r, text: q.join('.') + (toA || mode === 'sa' ? ' A' : (kw ? ' kW' : ' W')) };
}

function ltInit(mode, doc) {
  var $ = function (i) { return doc.getElementById(i); }, x = $('lt-x');
  if (!x) return;
  var calc = function () {
    var sys = $('lt-sys').value, pfe = $('lt-pf'), r = ltCalc(mode, x.value, $('lt-v').value, pfe ? pfe.value : '1', sys);
    if (pfe) pfe.disabled = sys === 'dc';
    $('lt-out').textContent = r.ok ? r.text : '\u2014';
    $('lt-err').textContent = r.ok ? '' : r.error;
  };
  ['lt-x', 'lt-v', 'lt-pf'].forEach(function (i) { if ($(i)) $(i).addEventListener('input', calc); });
  $('lt-sys').addEventListener('change', calc);
  calc();
}

module.exports = { RES_T, resRoles, resFmt, resLabel, resDecode, resEncode, resInit, COULOMB_UNITS, coulombForce, coulombText, cbInit, ltCalc, ltInit };
