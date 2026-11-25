/* Elecmetric reference pages: pure functions and data.
   Functions are written without closures over module data (the tables are passed in), so the same function text
   runs on the page (via toString) and in the build and tests. */

/* ---------- resistor colour code (IEC 60062 style) ---------- */
const RES_T = {
  digit: { black: 0, brown: 1, red: 2, orange: 3, yellow: 4, green: 5, blue: 6, violet: 7, grey: 8, white: 9 },
  mult: { black: 1, brown: 10, red: 100, orange: 1e3, yellow: 1e4, green: 1e5, blue: 1e6, violet: 1e7, grey: 1e8, white: 1e9, gold: 0.1, silver: 0.01, pink: 0.001 },
  tol: { brown: 1, red: 2, orange: 0.05, yellow: 0.02, green: 0.5, blue: 0.25, violet: 0.1, grey: 0.01, gold: 5, silver: 10 },
  ppm: { black: 250, brown: 100, red: 50, orange: 15, yellow: 25, green: 20, blue: 10, violet: 5, grey: 1 },
  order: {
    d: ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'white'],
    m: ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'white', 'gold', 'silver', 'pink'],
    t: ['brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'gold', 'silver'],
    p: ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey']
  },
  defaults: {
    3: ['yellow', 'violet', 'red'],
    4: ['yellow', 'violet', 'red', 'gold'],
    5: ['yellow', 'violet', 'black', 'brown', 'brown'],
    6: ['yellow', 'violet', 'black', 'brown', 'brown', 'brown']
  },
  css: { black: '#111111', brown: '#7B4A1E', red: '#D62828', orange: '#F77F00', yellow: '#FCD116', green: '#2A9D3F', blue: '#2563C9', violet: '#8A3FC2', grey: '#8A8F98', white: '#FFFFFF', gold: '#C9A227', silver: '#C0C4CC', pink: '#E8789C' }
};

function resRoles(n) {
  return { 3: ['d', 'd', 'm'], 4: ['d', 'd', 'm', 't'], 5: ['d', 'd', 'd', 'm', 't'], 6: ['d', 'd', 'd', 'm', 't', 'p'] }[n] || null;
}

function resFmt(v) {
  var a = Math.abs(v), u = '\u03a9', d = 1;
  if (a >= 1e9) { u = 'G\u03a9'; d = 1e9; } else if (a >= 1e6) { u = 'M\u03a9'; d = 1e6; } else if (a >= 1e3) { u = 'k\u03a9'; d = 1e3; } else if (a > 0 && a < 0.1) { u = 'm\u03a9'; d = 1e-3; }
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
  for (e = -3; e <= 9; e++) {
    var q = v * Math.pow(10, -e);
    if (Math.round(q) >= lo && Math.round(q) < hi && Math.abs(q - Math.round(q)) <= 1e-9 * q) { mant = Math.round(q); ex = e; break; }
  }
  if (mant === null) {
    if (v < lo * 0.001) return { ok: false, error: 'That is below the smallest value ' + n + ' bands can show (' + resFmt(lo * 0.001) + ').' };
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

/* ---------- SMD chip resistor markings: 3-digit, 4-digit, R/K/M notation and EIA-96 ----------
   EIA-96 = a two-digit code 01 to 96 (the 96 values of the E96 series, 100 to 976) and a multiplier letter. */
const SMD_T = {
  e96: [100, 102, 105, 107, 110, 113, 115, 118, 121, 124, 127, 130, 133, 137, 140, 143, 147, 150, 154, 158, 162, 165, 169, 174, 178, 182, 187, 191, 196, 200, 205, 210, 215, 221, 226, 232, 237, 243, 249, 255, 261, 267, 274, 280, 287, 294, 301, 309, 316, 324, 332, 340, 348, 357, 365, 374, 383, 392, 402, 412, 422, 432, 442, 453, 464, 475, 487, 499, 511, 523, 536, 549, 562, 576, 590, 604, 619, 634, 649, 665, 681, 698, 715, 732, 750, 768, 787, 806, 825, 845, 866, 887, 909, 931, 953, 976],
  letters: { Z: 0.001, Y: 0.01, R: 0.01, X: 0.1, S: 0.1, A: 1, B: 10, H: 10, C: 100, D: 1000, E: 10000, F: 100000 }
};

/* Marking text to resistance. Works without closures over module data (T is passed in). */
function smdDecode(T, str) {
  var s = String(str).replace(/[\s\u03a9]/g, '').toUpperCase().replace(/OHMS?$/, ''), m, v, sys, how, note = '';
  var done = function (val, system, text, nt) {
    val = Number(val.toPrecision(12));
    return { ok: true, ohms: val, system: system, how: text, note: nt || '', text: val === 0 ? '0 \u03a9 (zero-ohm link)' : resFmt(val) };
  };
  if (s === '') return { ok: false, error: 'Enter the code printed on the resistor, such as 472, 1002, 4R7 or 10B.' };
  if (!/^[0-9A-Z.]+$/.test(s) || s.length > 5 || (s.length === 5 && !/^\d*[RKMLG]\d*$/.test(s))) return { ok: false, error: 'A chip resistor marking has 3 or 4 characters, such as 472, 1002, 4R7 or 10B, or 5 with R, K, M, L or G as the decimal point, such as 59R04.' };
  if (/^(0{3,4}|0R0{0,2})$/.test(s)) return done(0, 'Zero-ohm link', s + ' marks a zero-ohm link (jumper).', 'A zero-ohm link has a small real resistance and a current rating; read the datasheet.');
  if ((m = /^(\d*)([RKMLG])(\d*)$/.exec(s)) && (m[1] + m[3]).length > 0) {
    var mul = { R: 1, K: 1e3, M: 1e6, G: 1e9, L: 1e-3 }[m[2]], alt = '', a2 = /^(\d{2})R$/.exec(s);
    v = Number((m[1] === '' ? '0' : m[1]) + '.' + (m[3] === '' ? '0' : m[3])) * mul;
    if (a2 && Number(a2[1]) >= 1 && Number(a2[1]) <= 96) alt = 'This is also a valid EIA-96 code (' + a2[1] + ' = ' + T.e96[Number(a2[1]) - 1] + ', R = \u00d70.01), which would be ' + resFmt(Number((T.e96[Number(a2[1]) - 1] * 0.01).toPrecision(12))) + '. The R-notation reading is shown; check the datasheet if the resistor is from an EIA-96 series.';
    return done(v, 'R / K / M notation', 'The letter ' + m[2] + ' is the decimal point and sets the unit' + (m[2] === 'L' ? ' (L is milliohm)' : m[2] === 'G' ? ' (G is gigaohm)' : '') + ': ' + (m[1] === '' ? '0' : m[1]) + '.' + (m[3] === '' ? '0' : m[3]) + ' \u00d7 ' + String(mul) + ' = ' + resFmt(v) + '.', alt);
  }
  if ((m = /^(\d{2})([A-Z])$/.exec(s))) {
    var n = Number(m[1]);
    if (n < 1 || n > 96) return { ok: false, error: 'An EIA-96 code runs from 01 to 96, so ' + m[1] + m[2] + ' is not one. For a 3-digit marking, the third character is a digit.' };
    if (!Object.prototype.hasOwnProperty.call(T.letters, m[2])) return { ok: false, error: m[2] + ' is not an EIA-96 multiplier letter. The letters are Z, Y or R, X or S, A, B or H, C, D, E and F.' };
    v = T.e96[n - 1] * T.letters[m[2]];
    return done(v, 'EIA-96', 'Code ' + m[1] + ' = ' + T.e96[n - 1] + ', letter ' + m[2] + ' = \u00d7' + String(T.letters[m[2]]) + ', so ' + T.e96[n - 1] + ' \u00d7 ' + String(T.letters[m[2]]) + ' = ' + resFmt(v) + '.', 'EIA-96 values are from the 1% E96 series; the tolerance is not printed, so check the datasheet.');
  }
  if ((m = /^(\d{2})(\d)$/.exec(s)) || (m = /^(\d{3})(\d)$/.exec(s))) {
    var e = Number(m[2]), dg = m[1], k = e === 8 ? -2 : e === 9 ? -1 : e;
    v = Number(dg) * Math.pow(10, k);
    sys = s.length === 3 ? '3-digit' : '4-digit';
    return done(v, sys, 'The first ' + dg.length + ' digits are ' + dg + ' and the last digit ' + e + ' is the power of ten: ' + dg + ' \u00d7 10' + (k < 0 ? '\u207b' + '\u00b9\u00b2'.charAt(-k - 1) : (k === 0 ? '\u2070' : '^' + k)) + ' = ' + resFmt(v) + '.', e >= 8 ? 'A last digit of 8 or 9 meaning \u00d70.01 or \u00d70.1 is a convention used by some makers only. Confirm with the datasheet.' : '');
  }
  return { ok: false, error: 'That is not a code this page reads. Use 3 digits (472), 4 digits (1002), R, K, M, L or G as the decimal point (4R7, 4K7, 4L7, 1G0) or an EIA-96 code (two digits and a letter, such as 10B).' };
}

function smdInit(T, doc) {
  var $ = function (i) { return doc.getElementById(i); }, inp = $('smd-in');
  if (!inp) return;
  var calc = function () {
    var r = smdDecode(T, inp.value);
    $('smd-out').textContent = r.ok ? r.text : '\u2014';
    $('smd-sys').textContent = r.ok ? r.system : '\u2014';
    $('smd-how').textContent = r.ok ? r.how + (r.note ? ' ' + r.note : '') : '';
    $('smd-err').textContent = r.ok || inp.value.trim() === '' ? '' : r.error;
  };
  inp.addEventListener('input', calc);
  calc();
}

/* ---------- E-series preferred values (IEC 60063) ----------
   Each value is stored as a 3-digit integer from 100 to 999 (E6 to E24 as 100, 150, 220 ...), so 330 means 3.3 x 10^n ohm.
   E6, E12 and E24 are the published tables (they are not plain roundings). E48, E96 and E192 are the roundings of 10^(k/N) to three digits;
   E48 is every second E96 value. The E96 list is the one the SMD decoder uses. */
const ES_T = (function () {
  var e192 = [], k;
  for (k = 0; k < 192; k++) e192.push(Math.round(100 * Math.pow(10, k / 192)));
  return {
    s: {
      E6: [100, 150, 220, 330, 470, 680],
      E12: [100, 120, 150, 180, 220, 270, 330, 390, 470, 560, 680, 820],
      E24: [100, 110, 120, 130, 150, 160, 180, 200, 220, 240, 270, 300, 330, 360, 390, 430, 470, 510, 560, 620, 680, 750, 820, 910],
      E48: SMD_T.e96.filter(function (x, i) { return i % 2 === 0; }),
      E96: SMD_T.e96.slice(),
      E192: e192
    },
    tol: { E6: 20, E12: 10, E24: 5, E48: 2, E96: 1, E192: 0.5 },
    bands: { E6: 3, E12: 4, E24: 4, E48: 5, E96: 5, E192: 5 }
  };
})();

/* A resistance (text such as "500", "4.7k", "2.2M") to the nearest value of one E series, with the next value below and above.
   Ties go to the lower value. Returns ohms and the percentage difference from the requested value. */
function esFind(T, series, str) {
  var s = String(str).replace(/[\s,Ω]/g, '').replace(/ohms?$/i, ''), m = /^([0-9]*\.?[0-9]+(?:e[+-]?[0-9]+)?)([kKmMgG]?)$/.exec(s), mul = 1;
  if (!m) return { ok: false, error: 'Enter a resistance such as 500, 4.7k, 330 or 2.2M.' };
  if (!Object.prototype.hasOwnProperty.call(T.s, series)) return { ok: false, error: 'Choose E6, E12, E24, E48, E96 or E192.' };
  if (m[2] === 'k' || m[2] === 'K') mul = 1e3; else if (m[2] === 'm' || m[2] === 'M') mul = 1e6; else if (m[2] === 'g' || m[2] === 'G') mul = 1e9;
  var v = Number(m[1]) * mul, L = T.s[series], i;
  if (!isFinite(v) || v < 0.01 || v > 1e9) return { ok: false, error: 'Enter a value from 0.01 Ω to 1 GΩ.' };
  var d = Math.floor(Math.log10(v));
  while (v / Math.pow(10, d) >= 10) d++;
  while (v / Math.pow(10, d) < 1) d--;
  var unit = Math.pow(10, d - 2), q = v / unit, lo = L[0], hi = 1000;
  for (i = 0; i < L.length; i++) { if (L[i] <= q * (1 + 1e-9)) lo = L[i]; }
  for (i = L.length - 1; i >= 0; i--) { if (L[i] >= q * (1 - 1e-9)) hi = L[i]; }
  var pack = function (Q) {
    var o = Number((Q * unit).toPrecision(12));
    return { ohms: o, text: resFmt(o), pct: Number(((o - v) / v * 100).toPrecision(3)) };
  };
  var below = pack(lo), above = pack(hi), exact = Math.abs(lo - q) <= 1e-9 * q || Math.abs(hi - q) <= 1e-9 * q, near;
  if (exact) { near = Math.abs(lo - q) <= 1e-9 * q ? below : above; below = near; above = near; }
  else near = (v - below.ohms) <= (above.ohms - v) ? below : above;
  return { ok: true, series: series, value: v, exact: exact, nearest: near, below: below, above: above, perDecade: L.length, tol: T.tol[series],
    how: exact ? resFmt(v) + ' is a standard ' + series + ' value.' : resFmt(v) + ' is not a standard ' + series + ' value. The nearest is ' + near.text + ' (' + (near.pct > 0 ? '+' : '') + near.pct + '%); the values on each side are ' + below.text + ' and ' + above.text + '.' };
}

/* Colour bands for a standard value of one series: 3 bands for E6 (no tolerance band means +/-20%), 4 for E12 and E24, 5 for E48 and above. */
function esBands(T, R, series, ohms) {
  var nb = T.bands[series], t = nb === 3 ? 5 : T.tol[series], r = resEncode(R, String(ohms), nb === 5 ? 5 : 4, t);
  if (!r.ok) return { ok: false, error: nb === 5 ? 'Five bands cannot show ' + resFmt(ohms) + ' (the lowest is 0.1 Ω).' : r.error };
  var b = nb === 3 ? r.bands.slice(0, 3) : r.bands;
  return { ok: true, bands: b, text: b.map(function (x) { return x.charAt(0).toUpperCase() + x.slice(1); }).join(', ') + (nb === 3 ? ' (no tolerance band, so ±20%)' : '') };
}

function esInit(T, R, doc) {
  var $ = function (i) { return doc.getElementById(i); }, inp = $('es-in'), sel = $('es-s');
  if (!inp || !sel) return;
  var calc = function () {
    var r = esFind(T, sel.value, inp.value), i, b;
    $('es-near').textContent = r.ok ? r.nearest.text : '—';
    $('es-lo').textContent = r.ok ? r.below.text : '—';
    $('es-hi').textContent = r.ok ? r.above.text : '—';
    $('es-how').textContent = r.ok ? r.how + ' ' + r.perDecade + ' values per decade, typical tolerance ±' + r.tol + '%.' : '';
    b = r.ok ? esBands(T, R, sel.value, r.nearest.ohms) : { ok: false };
    $('es-bands').textContent = r.ok ? (b.ok ? b.text : b.error) : '—';
    for (i = 0; i < 5; i++) { var sw = $('es-w' + (i + 1)); if (sw) { sw.hidden = !b.ok || i >= b.bands.length; if (sw.style && b.ok && i < b.bands.length) sw.style.background = R.css[b.bands[i]]; } }
    $('es-err').textContent = r.ok || inp.value.trim() === '' ? '' : r.error;
  };
  inp.addEventListener('input', calc); sel.addEventListener('change', calc);
  calc();
}

/* ---------- series and parallel resistors, resistor power and rating ---------- */
const PW_T = {
  w: [0.0625, 0.1, 0.125, 0.25, 0.5, 1, 2, 3, 5, 10, 25, 50, 100],
  l: ['1/16 W', '1/10 W', '1/8 W', '1/4 W', '1/2 W', '1 W', '2 W', '3 W', '5 W', '10 W', '25 W', '50 W', '100 W']
};

/* One resistance word ("330", "4.7k", "2.2M", "1e3", "470ohm") to ohms, or NaN. */
function rsNum(s) {
  var m = /^([0-9]*\.?[0-9]+(?:e[+-]?[0-9]+)?)([kmg]?)(?:Ω|ohms?)?$/i.exec(String(s)), mul = 1;
  if (!m) return NaN;
  var f = m[2].toLowerCase();
  if (f === 'k') mul = 1e3; else if (f === 'm') mul = 1e6; else if (f === 'g') mul = 1e9;
  return Number(m[1]) * mul;
}

/* Two to twenty resistances separated by spaces, commas or semicolons, to one total. */
function rsCombine(str, mode) {
  var parts = String(str).trim().split(/[;,\s]+/).filter(function (x) { return x !== ''; }), vals = [], i, v, acc = 0;
  if (mode !== 'series' && mode !== 'parallel') return { ok: false, error: 'Choose series or parallel.' };
  if (parts.length === 0) return { ok: false, error: 'Enter two or more resistances, such as 330 180 or 4.7k 10k.' };
  for (i = 0; i < parts.length; i++) {
    v = rsNum(parts[i]);
    if (isNaN(v)) return { ok: false, error: 'Could not read "' + parts[i].slice(0, 12) + '". Write each value as one word, such as 4.7k, 330 or 2.2M, and separate them with spaces or commas.' };
    if (!isFinite(v) || v <= 0) return { ok: false, error: 'Each resistance must be greater than zero.' };
    vals.push(v);
  }
  if (vals.length < 2) return { ok: false, error: 'Enter at least two resistances.' };
  if (vals.length > 20) return { ok: false, error: 'Up to 20 resistances at a time.' };
  var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), total, how;
  if (mode === 'series') { for (i = 0; i < vals.length; i++) acc += vals[i]; total = acc; } else { for (i = 0; i < vals.length; i++) acc += 1 / vals[i]; total = 1 / acc; }
  total = Number(total.toPrecision(12));
  how = mode === 'series'
    ? vals.map(resFmt).join(' + ') + ' = ' + resFmt(total) + '. In series the total is always higher than the largest resistor (' + resFmt(hi) + ').'
    : '1 / (' + vals.map(function (x) { return '1/' + resFmt(x); }).join(' + ') + ') = ' + resFmt(total) + '. In parallel the total is always lower than the smallest resistor (' + resFmt(lo) + ').';
  return { ok: true, mode: mode, values: vals, count: vals.length, total: total, text: resFmt(total), how: how };
}

/* A value with an SI prefix for volts, amperes or watts, four significant digits. */
function pwFmt(v, u) {
  var a = Math.abs(v), p = '', d = 1;
  if (a >= 1e6) { p = 'M'; d = 1e6; } else if (a >= 1e3) { p = 'k'; d = 1e3; } else if (a > 0 && a < 1e-3) { p = 'µ'; d = 1e-6; } else if (a > 0 && a < 1) { p = 'm'; d = 1e-3; }
  return String(Number((v / d).toPrecision(4))) + ' ' + p + u;
}

/* Power in a resistor from its value and the voltage across it (mode V, in volts) or the current through it (mode I, in milliamperes).
   derate is the largest share of the rated power to use (0.5 = never more than half the rating). */
function pwCalc(T, rStr, mode, xStr, derate) {
  var r = rsNum(String(rStr).replace(/[\s,]/g, '')), x = Number(String(xStr).replace(/[\s,]/g, '')), d = Number(derate), V, I, P, need, i, k = -1;
  if (isNaN(r) || !isFinite(r) || r <= 0) return { ok: false, error: 'Enter the resistance, such as 510 or 4.7k. It must be greater than zero.' };
  if (mode !== 'V' && mode !== 'I') return { ok: false, error: 'Choose voltage or current.' };
  if (String(xStr).trim() === '' || !isFinite(x) || x <= 0) return { ok: false, error: mode === 'V' ? 'Enter the voltage across the resistor in volts, greater than zero.' : 'Enter the current through the resistor in milliamperes, greater than zero.' };
  if (!(d > 0 && d <= 1)) return { ok: false, error: 'Choose how much of the rating to use, up to 100%.' };
  if (mode === 'V') { V = x; I = V / r; P = V * V / r; } else { I = x / 1000; V = I * r; P = I * I * r; }
  need = P / d;
  for (i = 0; i < T.w.length; i++) { if (T.w[i] >= need * (1 - 1e-9)) { k = i; break; } }
  return { ok: true, ohms: r, volts: V, amps: I, watts: P, need: need, rating: k < 0 ? null : T.w[k], ratingLabel: k < 0 ? null : T.l[k],
    how: 'The resistor dissipates ' + pwFmt(P, 'W') + '. Using at most ' + Number((d * 100).toPrecision(3)) + '% of the rating needs a rating of at least ' + pwFmt(need, 'W') + ', so ' + (k < 0 ? 'no rating in the list is enough: use a power resistor and the maker’s datasheet.' : 'the next common rating is ' + T.l[k] + '.') };
}

function spInit(ES, doc) {
  var $ = function (i) { return doc.getElementById(i); }, inp = $('sp-in'), md = $('sp-m'), sr = $('sp-s');
  if (!inp || !md || !sr) return;
  var calc = function () {
    var r = rsCombine(inp.value, md.value), f = r.ok ? esFind(ES, sr.value, r.total) : { ok: false };
    $('sp-out').textContent = r.ok ? r.text : '—';
    $('sp-near').textContent = f.ok ? f.nearest.text + (f.exact ? ' (exact)' : ' (' + (f.nearest.pct > 0 ? '+' : '') + f.nearest.pct + '%)') : '—';
    $('sp-how').textContent = r.ok ? r.how : '';
    $('sp-err').textContent = r.ok || inp.value.trim() === '' ? '' : r.error;
  };
  inp.addEventListener('input', calc); md.addEventListener('change', calc); sr.addEventListener('change', calc);
  calc();
}

function pwInit(T, doc) {
  var $ = function (i) { return doc.getElementById(i); }, rr = $('pw-r'), md = $('pw-m'), xx = $('pw-x'), dd = $('pw-d');
  if (!rr || !md || !xx || !dd) return;
  var calc = function () {
    var r = pwCalc(T, rr.value, md.value, xx.value, dd.value);
    $('pw-xl').textContent = md.value === 'V' ? 'Voltage across the resistor (volts)' : 'Current through the resistor (milliamperes)';
    $('pw-i').textContent = r.ok ? pwFmt(r.amps, 'A') : '—';
    $('pw-v').textContent = r.ok ? pwFmt(r.volts, 'V') : '—';
    $('pw-p').textContent = r.ok ? pwFmt(r.watts, 'W') : '—';
    $('pw-rate').textContent = r.ok ? (r.ratingLabel || 'Above 100 W') : '—';
    $('pw-how').textContent = r.ok ? r.how : '';
    $('pw-err').textContent = r.ok || (rr.value.trim() === '' && xx.value.trim() === '') ? '' : r.error;
  };
  rr.addEventListener('input', calc); xx.addEventListener('input', calc); md.addEventListener('change', calc); dd.addEventListener('change', calc);
  calc();
}

/* ---------- LED series resistor: required value, standard value, colour bands, actual current, power and rating ---------- */
/* R = (Vs - n x Vf) / I. dir is 'up' (next standard value at or above R: the current is never above the target) or 'nearest'. */
function ledCalc(ES, PW, RT, vs, vf, ma, n, series, dir, derate) {
  var num = function (x) { return Number(String(x).replace(/[\s,]/g, '')); };
  var s = num(vs), f = num(vf), m = num(ma), k = Number(n), total, Vr, Ireq, Rreq, fnd, pick, Ra, Ia, pw, bd, tol, lo, hi, pct, how;
  if (String(vs).trim() === '' || !isFinite(s) || s <= 0) return { ok: false, error: 'Enter the supply voltage in volts, greater than zero.' };
  if (String(vf).trim() === '' || !isFinite(f) || f <= 0) return { ok: false, error: 'Enter the LED forward voltage in volts (from its datasheet), greater than zero.' };
  if (String(ma).trim() === '' || !isFinite(m) || m <= 0) return { ok: false, error: 'Enter the LED current in milliamperes, greater than zero.' };
  if (!isFinite(k) || k !== Math.floor(k) || k < 1 || k > 20) return { ok: false, error: 'Enter the number of LEDs in series as a whole number from 1 to 20.' };
  if (dir !== 'up' && dir !== 'nearest') return { ok: false, error: 'Choose next value above or nearest value.' };
  total = Number((k * f).toPrecision(12));
  if (s <= total * (1 + 1e-12)) return { ok: false, error: 'The supply (' + s + ' V) must be higher than the LED forward voltage' + (k > 1 ? ' total' : '') + ' (' + total + ' V), or no resistor can set the current.' };
  Vr = Number((s - total).toPrecision(12)); Ireq = m / 1000; Rreq = Number((Vr / Ireq).toPrecision(12));
  fnd = esFind(ES, series, String(Rreq));
  if (!fnd.ok) return { ok: false, error: /Choose/.test(fnd.error) ? fnd.error : 'The required resistance (' + resFmt(Rreq) + ') is outside the 0.01 Ω to 1 GΩ this page handles.' };
  pick = dir === 'up' ? fnd.above : fnd.nearest;
  Ra = pick.ohms; Ia = Vr / Ra; pct = Number(((Ia - Ireq) / Ireq * 100).toPrecision(3));
  pw = pwCalc(PW, String(Ra), 'V', String(Vr), derate);
  if (!pw.ok) return { ok: false, error: pw.error };
  bd = esBands(ES, RT, series, Ra);
  tol = ES.tol[series]; lo = Vr / (Ra * (1 + tol / 100)); hi = Vr / (Ra * (1 - tol / 100));
  how = 'R = (' + s + ' V - ' + (k > 1 ? k + ' × ' + f + ' V' : f + ' V') + ') / ' + m + ' mA = ' + resFmt(Rreq) + (fnd.exact ? ', which is a standard ' + series + ' value.' : ', which is not a standard ' + series + ' value. ' + (dir === 'up' ? 'The next value above is ' : 'The nearest value is ') + pick.text + '.') +
    ' With ' + pick.text + ' the current is ' + pwFmt(Ia, 'A') + (pct === 0 ? ', as wanted.' : ', ' + Math.abs(pct) + '% ' + (pct > 0 ? 'above' : 'below') + ' the target.') +
    (pct > 0 ? ' The LED gets more current than you asked for: check its maximum current, or choose the next value above.' : '');
  return { ok: true, series: series, volts: Vr, required: Rreq, requiredText: resFmt(Rreq), exact: fnd.exact, std: Ra, stdText: pick.text, bands: bd, amps: Ia, pct: pct, watts: pw.watts, rating: pw.ratingLabel, need: pw.need,
    iMin: lo, iMax: hi, tol: tol, how: how,
    ohm: 'Ohm\u2019s Law check: the resistor drops ' + pwFmt(Vr, 'V') + ' (the supply less ' + (k > 1 ? 'the LED voltages' : 'the LED voltage') + '). I = V / R = ' + pwFmt(Vr, 'V') + ' / ' + resFmt(Ra) + ' = ' + pwFmt(Ia, 'A') + '. P = V \u00d7 I = ' + pwFmt(Vr, 'V') + ' \u00d7 ' + pwFmt(Ia, 'A') + ' = ' + pwFmt(pw.watts, 'W') + '.' };
}

function ledInit(ES, PW, RT, doc) {
  var $ = function (i) { return doc.getElementById(i); }, ids = ['led-vs', 'led-vf', 'led-i', 'led-n', 'led-s', 'led-d', 'led-p'], el = {}, i;
  for (i = 0; i < ids.length; i++) { el[ids[i]] = $(ids[i]); if (!el[ids[i]]) return; }
  var calc = function () {
    var r = ledCalc(ES, PW, RT, el['led-vs'].value, el['led-vf'].value, el['led-i'].value, el['led-n'].value, el['led-s'].value, el['led-d'].value, el['led-p'].value), j, w;
    $('led-r').textContent = r.ok ? r.requiredText : '—';
    $('led-std').textContent = r.ok ? r.stdText + (r.exact ? ' (exact)' : '') : '—';
    $('led-bands').textContent = r.ok ? (r.bands.ok ? r.bands.text : r.bands.error) : '—';
    $('led-ia').textContent = r.ok ? pwFmt(r.amps, 'A') + ' (' + (r.pct > 0 ? '+' : '') + r.pct + '%)' : '—';
    $('led-pw').textContent = r.ok ? pwFmt(r.watts, 'W') : '—';
    $('led-rate').textContent = r.ok ? (r.rating || 'Above 100 W') : '—';
    $('led-rng').textContent = r.ok ? pwFmt(r.iMin, 'A') + ' to ' + pwFmt(r.iMax, 'A') + ' (±' + r.tol + '%)' : '—';
    $('led-how').textContent = r.ok ? r.how : '';
    if ($('led-ohm')) $('led-ohm').textContent = r.ok ? r.ohm : '';
    for (j = 0; j < 5; j++) { w = $('led-w' + (j + 1)); if (w) { w.hidden = !(r.ok && r.bands.ok) || j >= r.bands.bands.length; if (w.style && r.ok && r.bands.ok && j < r.bands.bands.length) w.style.background = RT.css[r.bands.bands[j]]; } }
    $('led-err').textContent = r.ok || (el['led-vs'].value.trim() === '' && el['led-vf'].value.trim() === '' && el['led-i'].value.trim() === '') ? '' : r.error;
  };
  for (i = 0; i < ids.length; i++) { el[ids[i]].addEventListener(el[ids[i]].tagName === 'SELECT' ? 'change' : 'input', calc); }
  calc();
}

/* ---------- Voltage divider: preferred values for R1 and R2, the output you actually get, its tolerance band, current and power ---------- */
/* Vout = Vin R2e / (R1 + R2e), with R2e = R2 in parallel with the load (no load: R2e = R2). rt is the wanted R1 + R2e, which sets the divider current Vin / rt.
   The four standard-value pairs around the ideal values (each of R1 and R2 taken one value below and one above) are tried and the pair whose output is closest to the target is used (on a tie, the one whose total is closer to the wanted total). */
function vdOut(vin, r1, r2, rl) { var r2e = rl > 0 ? (r2 * rl) / (r2 + rl) : r2; return vin * r2e / (r1 + r2e); }
function vdCalc(ES, PW, RT, vin, vout, rt, rl, series, derate) {
  var num = function (x) { return Number(String(x).replace(/[\s,]/g, '')); };
  var s = num(vin), t = num(vout), rtot = rsNum(String(rt).replace(/[\s,]/g, '')), load = 0, hasLoad = String(rl).trim() !== '', r2e, r1i, r2i, f1, f2, c1, c2, i, j, best = null, e, tol, lo, hi, a, b, pr1, pr2, v1, bd1, bd2, how;
  if (String(vin).trim() === '' || !isFinite(s) || s <= 0) return { ok: false, error: 'Enter the input voltage in volts, greater than zero.' };
  if (String(vout).trim() === '' || !isFinite(t) || t <= 0) return { ok: false, error: 'Enter the output voltage you want in volts, greater than zero.' };
  if (t >= s) return { ok: false, error: 'A resistor divider can only lower the voltage: the output must be below the input (' + s + ' V).' };
  if (String(rt).trim() === '' || isNaN(rtot) || !isFinite(rtot) || rtot <= 0) return { ok: false, error: 'Enter the total resistance R1 + R2 you want, such as 10k. It sets the divider current.' };
  if (hasLoad) { load = rsNum(String(rl).replace(/[\s,]/g, '')); if (isNaN(load) || !isFinite(load) || load <= 0) return { ok: false, error: 'Enter the load resistance such as 100k, or leave it blank for no load.' }; }
  r2e = Number((rtot * t / s).toPrecision(12)); r1i = Number((rtot - r2e).toPrecision(12));
  if (hasLoad && load <= r2e * (1 + 1e-9)) return { ok: false, error: 'The load (' + resFmt(load) + ') is too heavy for this total resistance: it must be higher than ' + resFmt(r2e) + ', the lower-leg resistance this total needs. Raise the load resistance or lower the total.' };
  r2i = hasLoad ? Number((r2e * load / (load - r2e)).toPrecision(12)) : r2e;
  f1 = esFind(ES, series, String(r1i)); f2 = esFind(ES, series, String(r2i));
  if (!f1.ok || !f2.ok) return { ok: false, error: /Choose/.test((f1.error || '') + (f2.error || '')) ? 'Choose E6, E12, E24, E48, E96 or E192.' : 'The ideal values (' + resFmt(r1i) + ' and ' + resFmt(r2i) + ') are outside the 0.01 Ω to 1 GΩ this page handles.' };
  c1 = f1.exact ? [f1.nearest] : [f1.below, f1.above]; c2 = f2.exact ? [f2.nearest] : [f2.below, f2.above];
  for (i = 0; i < c1.length; i++) for (j = 0; j < c2.length; j++) {
    e = Math.abs(vdOut(s, c1[i].ohms, c2[j].ohms, load) - t);
    var d = Math.abs(c1[i].ohms + (load > 0 ? (c2[j].ohms * load) / (c2[j].ohms + load) : c2[j].ohms) - rtot);
    if (best === null || e < best.e - 1e-12 * t || (Math.abs(e - best.e) <= 1e-12 * t && d < best.d)) best = { e: e, d: d, r1: c1[i], r2: c2[j] };
  }
  a = best.r1.ohms; b = best.r2.ohms;
  var vo = vdOut(s, a, b, load), r2a = load > 0 ? (b * load) / (b + load) : b, I = s / (a + r2a), pct = Number(((vo - t) / t * 100).toPrecision(3));
  tol = ES.tol[series];
  lo = vdOut(s, a * (1 + tol / 100), b * (1 - tol / 100), load); hi = vdOut(s, a * (1 - tol / 100), b * (1 + tol / 100), load);
  v1 = s - vo;
  pr1 = pwCalc(PW, String(a), 'V', String(v1), derate); pr2 = pwCalc(PW, String(b), 'V', String(vo), derate);
  if (!pr1.ok || !pr2.ok) return { ok: false, error: (pr1.error || pr2.error) };
  bd1 = esBands(ES, RT, series, a); bd2 = esBands(ES, RT, series, b);
  how = 'Ideal values: R1 = ' + resFmt(r1i) + ', R2 = ' + resFmt(r2i) + (hasLoad ? ' (with the ' + resFmt(load) + ' load across it)' : '') + '. The closest ' + series + ' pair is R1 = ' + best.r1.text + ' and R2 = ' + best.r2.text + ', which gives ' + pwFmt(vo, 'V') + (pct === 0 ? ', as wanted.' : ', ' + Math.abs(pct) + '% ' + (pct > 0 ? 'above' : 'below') + ' the target.') +
    ' The divider draws ' + pwFmt(I, 'A') + (hasLoad ? ' (the load takes ' + pwFmt(vo / load, 'A') + ' of it)' : '') + '.';
  return { ok: true, series: series, loaded: hasLoad, idealR1: r1i, idealR2: r2i, r1: a, r2: b, r1Text: best.r1.text, r2Text: best.r2.text, r1Bands: bd1, r2Bands: bd2, vout: vo, pct: pct, amps: I,
    vMin: lo, vMax: hi, tol: tol, p1: pr1.watts, p2: pr2.watts, rate1: pr1.ratingLabel, rate2: pr2.ratingLabel, how: how,
    ohm: 'Ohm\u2019s Law check: I = Vin / (R1 + ' + (hasLoad ? 'R2 in parallel with the load' : 'R2') + ') = ' + pwFmt(s, 'V') + ' / (' + resFmt(a) + ' + ' + resFmt(r2a) + ') = ' + pwFmt(I, 'A') + '. Across R1: V = I \u00d7 R = ' + pwFmt(I, 'A') + ' \u00d7 ' + resFmt(a) + ' = ' + pwFmt(I * a, 'V') + '. Across ' + (hasLoad ? 'R2 and the load' : 'R2') + ': ' + pwFmt(I, 'A') + ' \u00d7 ' + resFmt(r2a) + ' = ' + pwFmt(I * r2a, 'V') + '. Together ' + pwFmt(I * a + I * r2a, 'V') + ', the input voltage.' };
}

function vdInit(ES, PW, RT, doc) {
  var $ = function (i) { return doc.getElementById(i); }, ids = ['vd-vin', 'vd-vout', 'vd-rt', 'vd-rl', 'vd-s', 'vd-p'], el = {}, i;
  for (i = 0; i < ids.length; i++) { el[ids[i]] = $(ids[i]); if (!el[ids[i]]) return; }
  var paint = function (pre, bands, r) { var j, w; for (j = 0; j < 5; j++) { w = $(pre + (j + 1)); if (w) { w.hidden = !(r.ok && bands.ok) || j >= bands.bands.length; if (w.style && r.ok && bands.ok && j < bands.bands.length) w.style.background = RT.css[bands.bands[j]]; } } };
  var calc = function () {
    var r = vdCalc(ES, PW, RT, el['vd-vin'].value, el['vd-vout'].value, el['vd-rt'].value, el['vd-rl'].value, el['vd-s'].value, el['vd-p'].value);
    $('vd-r1').textContent = r.ok ? r.r1Text : '—';
    $('vd-r2').textContent = r.ok ? r.r2Text : '—';
    $('vd-b1').textContent = r.ok ? (r.r1Bands.ok ? r.r1Bands.text : r.r1Bands.error) : '—';
    $('vd-b2').textContent = r.ok ? (r.r2Bands.ok ? r.r2Bands.text : r.r2Bands.error) : '—';
    $('vd-vo').textContent = r.ok ? pwFmt(r.vout, 'V') + ' (' + (r.pct > 0 ? '+' : '') + r.pct + '%)' : '—';
    $('vd-rng').textContent = r.ok ? pwFmt(r.vMin, 'V') + ' to ' + pwFmt(r.vMax, 'V') + ' (±' + r.tol + '%)' : '—';
    $('vd-i').textContent = r.ok ? pwFmt(r.amps, 'A') : '—';
    $('vd-pw').textContent = r.ok ? 'R1 ' + pwFmt(r.p1, 'W') + ' (' + (r.rate1 || 'above 100 W') + '), R2 ' + pwFmt(r.p2, 'W') + ' (' + (r.rate2 || 'above 100 W') + ')' : '—';
    $('vd-how').textContent = r.ok ? r.how : '';
    if ($('vd-ohm')) $('vd-ohm').textContent = r.ok ? r.ohm : '';
    paint('vd-x', r.ok ? r.r1Bands : { ok: false }, r); paint('vd-y', r.ok ? r.r2Bands : { ok: false }, r);
    $('vd-err').textContent = r.ok || (el['vd-vin'].value.trim() === '' && el['vd-vout'].value.trim() === '') ? '' : r.error;
  };
  for (i = 0; i < ids.length; i++) { el[ids[i]].addEventListener(el[ids[i]].tagName === 'SELECT' ? 'change' : 'input', calc); }
  calc();
}

/* ---------- Tolerance impact: how the tolerance of the resistor, the supply and the LED voltage (or of both divider resistors and the input) moves the result ---------- */
/* Worst case: every quantity at its limit in the direction that pushes the result furthest. Each source is also taken alone, to show which one matters most.
   Typical spread: root-sum-square of the three single-source deviations, which is the usual estimate when the errors are independent and not all at their limits.
   Tolerances are in per cent (blank = 0, at most 50). */
function tlPc(x) { var t = String(x).replace(/[\s,]/g, ''), n; if (t === '') return 0; n = Number(t); return !isFinite(n) || n < 0 || n > 50 ? NaN : n; }
function tlSgn(x) { var v = Number(x.toPrecision(3)); return (v > 0 ? '+' : '') + v + '%'; }
function tlParts(nom, list, unit, fmt) {
  var out = [], rss = 0, top = null, k, p, dev;
  for (k = 0; k < list.length; k++) {
    p = list[k]; dev = Math.max(Math.abs(p.lo - nom), Math.abs(p.hi - nom)) / nom;
    rss += dev * dev;
    out.push({ name: p.name, lo: p.lo, hi: p.hi, loPct: (p.lo - nom) / nom * 100, hiPct: (p.hi - nom) / nom * 100, dev: dev,
      text: fmt(p.lo, unit) + ' to ' + fmt(p.hi, unit) + ' (' + tlSgn((p.lo - nom) / nom * 100) + ' / ' + tlSgn((p.hi - nom) / nom * 100) + ')' });
    if (top === null || dev > top.dev) top = out[out.length - 1];
  }
  return { parts: out, rss: Math.sqrt(rss), top: top };
}
function tolLed(vs, ts, vf, dvf, r, tr, maxMa) {
  var num = function (x) { return Number(String(x).replace(/[\s,]/g, '')); };
  var s = num(vs), f = num(vf), R = rsNum(String(r).replace(/[\s,]/g, '')), a = tlPc(ts), b = tlPc(tr), dv = String(dvf).trim() === '' ? 0 : num(dvf), hasMax = String(maxMa).trim() !== '', lim = hasMax ? num(maxMa) : 0;
  var Vn, In, sLo, sHi, fLo, fHi, rLo, rHi, Vlo, Vhi, iMin, iMax, pt, rss, pn, px, how, warn = '';
  if (String(vs).trim() === '' || !isFinite(s) || s <= 0) return { ok: false, error: 'Enter the supply voltage in volts, greater than zero.' };
  if (String(vf).trim() === '' || !isFinite(f) || f <= 0) return { ok: false, error: 'Enter the LED forward voltage in volts, greater than zero.' };
  if (String(r).trim() === '' || isNaN(R) || !isFinite(R) || R <= 0) return { ok: false, error: 'Enter the resistance such as 510 or 4.7k.' };
  if (isNaN(a)) return { ok: false, error: 'Enter the supply tolerance as a percentage from 0 to 50 (blank is 0).' };
  if (isNaN(b)) return { ok: false, error: 'Enter the resistor tolerance as a percentage from 0 to 50 (blank is 0).' };
  if (!isFinite(dv) || dv < 0 || dv >= f) return { ok: false, error: 'Enter the possible change of the LED forward voltage in volts (blank is 0), below the forward voltage itself.' };
  if (hasMax && (!isFinite(lim) || lim <= 0)) return { ok: false, error: 'Enter the LED maximum current in milliamperes, or leave it blank.' };
  if (s <= f * (1 + 1e-12)) return { ok: false, error: 'The supply (' + s + ' V) must be higher than the LED forward voltage (' + f + ' V), or no resistor can set the current.' };
  Vn = s - f; In = Vn / R;
  sLo = s * (1 - a / 100); sHi = s * (1 + a / 100); fLo = f - dv; fHi = f + dv; rLo = R * (1 - b / 100); rHi = R * (1 + b / 100);
  Vlo = sLo - fHi; Vhi = sHi - fLo;
  iMin = Math.max(Vlo, 0) / rHi; iMax = Vhi / rLo;
  pt = tlParts(In, [
    { name: 'Resistor tolerance alone', lo: Vn / rHi, hi: Vn / rLo },
    { name: 'Supply tolerance alone', lo: Math.max(sLo - f, 0) / R, hi: (sHi - f) / R },
    { name: 'LED voltage change alone', lo: Math.max(s - fHi, 0) / R, hi: (s - fLo) / R }], 'A', pwFmt);
  rss = pt.rss; pn = Vn * Vn / R; px = Vhi * Vhi / rLo;
  if (Vlo <= 0) warn += ' At the low end the supply can fall to the LED voltage or below, so the LED may not light at all.';
  if (hasMax) warn += iMax * 1000 > lim * (1 + 1e-12) ? ' In the worst case the LED gets ' + pwFmt(iMax, 'A') + ', above its ' + lim + ' mA limit: use a larger resistor, a tighter supply or check the LED\u2019s rating.' : ' In the worst case the LED gets ' + pwFmt(iMax, 'A') + ', within its ' + lim + ' mA limit.';
  how = 'Nominal current = (' + s + ' V \u2212 ' + f + ' V) / ' + resFmt(R) + ' = ' + pwFmt(In, 'A') + '. Worst case: the supply at \u2212' + a + '% with the LED voltage up by ' + dv + ' V and the resistor at +' + b + '% gives the lowest current; the supply at +' + a + '% with the LED voltage down by ' + dv + ' V and the resistor at \u2212' + b + '% gives the highest. The largest single source is: ' + pt.top.name.toLowerCase().replace(' alone', '') + '.' + warn;
  return { ok: true, nom: In, iMin: iMin, iMax: iMax, minPct: (iMin - In) / In * 100, maxPct: (iMax - In) / In * 100, rss: rss * 100, rssMin: In * (1 - rss), rssMax: In * (1 + rss),
    parts: pt.parts, top: pt.top.name, pNom: pn, pMax: px, how: how,
    rngText: pwFmt(iMin, 'A') + ' to ' + pwFmt(iMax, 'A') + ' (' + tlSgn((iMin - In) / In * 100) + ' / ' + tlSgn((iMax - In) / In * 100) + ')',
    rssText: '\u00b1' + Number((rss * 100).toPrecision(3)) + '% (' + pwFmt(In * (1 - rss), 'A') + ' to ' + pwFmt(In * (1 + rss), 'A') + ')' };
}
function tolDiv(vin, tin, r1, t1, r2, t2, rl) {
  var num = function (x) { return Number(String(x).replace(/[\s,]/g, '')); };
  var s = num(vin), A = rsNum(String(r1).replace(/[\s,]/g, '')), B = rsNum(String(r2).replace(/[\s,]/g, '')), a = tlPc(tin), b = tlPc(t1), c = tlPc(t2), hasLoad = String(rl).trim() !== '', L = hasLoad ? rsNum(String(rl).replace(/[\s,]/g, '')) : 0;
  var Vn, lo, hi, pt, how;
  if (String(vin).trim() === '' || !isFinite(s) || s <= 0) return { ok: false, error: 'Enter the input voltage in volts, greater than zero.' };
  if (String(r1).trim() === '' || isNaN(A) || !isFinite(A) || A <= 0) return { ok: false, error: 'Enter R1 such as 5.6k.' };
  if (String(r2).trim() === '' || isNaN(B) || !isFinite(B) || B <= 0) return { ok: false, error: 'Enter R2 such as 3.9k.' };
  if (hasLoad && (isNaN(L) || !isFinite(L) || L <= 0)) return { ok: false, error: 'Enter the load resistance such as 100k, or leave it blank for no load.' };
  if (isNaN(a)) return { ok: false, error: 'Enter the input tolerance as a percentage from 0 to 50 (blank is 0).' };
  if (isNaN(b)) return { ok: false, error: 'Enter the R1 tolerance as a percentage from 0 to 50 (blank is 0).' };
  if (isNaN(c)) return { ok: false, error: 'Enter the R2 tolerance as a percentage from 0 to 50 (blank is 0).' };
  Vn = vdOut(s, A, B, L);
  lo = vdOut(s * (1 - a / 100), A * (1 + b / 100), B * (1 - c / 100), L); hi = vdOut(s * (1 + a / 100), A * (1 - b / 100), B * (1 + c / 100), L);
  pt = tlParts(Vn, [
    { name: 'R1 tolerance alone', lo: vdOut(s, A * (1 + b / 100), B, L), hi: vdOut(s, A * (1 - b / 100), B, L) },
    { name: 'R2 tolerance alone', lo: vdOut(s, A, B * (1 - c / 100), L), hi: vdOut(s, A, B * (1 + c / 100), L) },
    { name: 'Input voltage tolerance alone', lo: vdOut(s * (1 - a / 100), A, B, L), hi: vdOut(s * (1 + a / 100), A, B, L) }], 'V', pwFmt);
  how = 'Nominal output = ' + pwFmt(s, 'V') + ' \u00d7 R2 / (R1 + R2)' + (hasLoad ? ' with R2 in parallel with the ' + resFmt(L) + ' load' : '') + ' = ' + pwFmt(Vn, 'V') + '. Worst case: the input low, R1 high and R2 low gives the lowest output; the input high, R1 low and R2 high gives the highest. The largest single source is: ' + pt.top.name.toLowerCase().replace(' alone', '') + '. The load resistance is taken as exact.';
  return { ok: true, nom: Vn, vMin: lo, vMax: hi, minPct: (lo - Vn) / Vn * 100, maxPct: (hi - Vn) / Vn * 100, rss: pt.rss * 100, parts: pt.parts, top: pt.top.name, how: how,
    rngText: pwFmt(lo, 'V') + ' to ' + pwFmt(hi, 'V') + ' (' + tlSgn((lo - Vn) / Vn * 100) + ' / ' + tlSgn((hi - Vn) / Vn * 100) + ')',
    rssText: '\u00b1' + Number((pt.rss * 100).toPrecision(3)) + '% (' + pwFmt(Vn * (1 - pt.rss), 'V') + ' to ' + pwFmt(Vn * (1 + pt.rss), 'V') + ')' };
}
function tolInit(doc) {
  var $ = function (i) { return doc.getElementById(i); };
  var bind = function (ids, outs, fn) {
    var el = {}, i;
    for (i = 0; i < ids.length; i++) { el[ids[i]] = $(ids[i]); if (!el[ids[i]]) return; }
    for (i = 0; i < outs.length; i++) if (!$(outs[i])) return;
    var calc = function () {
      var r = fn(el), j, any = false;
      for (j = 0; j < ids.length; j++) if (el[ids[j]].value.trim() !== '') any = true;
      var set = function (k, t) { $(outs[k]).textContent = t; };
      set(0, r.ok ? r.nom_t : '\u2014'); set(1, r.ok ? r.rngText : '\u2014'); set(2, r.ok ? r.rssText : '\u2014');
      set(3, r.ok ? r.parts[0].text : '\u2014'); set(4, r.ok ? r.parts[1].text : '\u2014'); set(5, r.ok ? r.parts[2].text : '\u2014');
      set(6, r.ok && r.extra ? r.extra : '\u2014');
      set(7, r.ok ? r.how : ''); set(8, r.ok || !any ? '' : r.error);
    };
    for (i = 0; i < ids.length; i++) el[ids[i]].addEventListener('input', calc);
    calc();
  };
  bind(['tl-vs', 'tl-ts', 'tl-vf', 'tl-dv', 'tl-r', 'tl-tr', 'tl-max'], ['tl-nom', 'tl-rng', 'tl-rss', 'tl-p1', 'tl-p2', 'tl-p3', 'tl-pw', 'tl-how', 'tl-err'], function (e) {
    var r = tolLed(e['tl-vs'].value, e['tl-ts'].value, e['tl-vf'].value, e['tl-dv'].value, e['tl-r'].value, e['tl-tr'].value, e['tl-max'].value);
    if (r.ok) { r.nom_t = pwFmt(r.nom, 'A'); r.extra = pwFmt(r.pNom, 'W') + ' nominal, ' + pwFmt(r.pMax, 'W') + ' worst case'; }
    return r;
  });
  bind(['td-vin', 'td-tin', 'td-r1', 'td-t1', 'td-r2', 'td-t2', 'td-rl'], ['td-nom', 'td-rng', 'td-rss', 'td-p1', 'td-p2', 'td-p3', 'td-x', 'td-how', 'td-err'], function (e) {
    var r = tolDiv(e['td-vin'].value, e['td-tin'].value, e['td-r1'].value, e['td-t1'].value, e['td-r2'].value, e['td-t2'].value, e['td-rl'].value);
    if (r.ok) { r.nom_t = pwFmt(r.nom, 'V'); r.extra = r.top.replace(' alone', ''); }
    return r;
  });
}

/* ---------- Printable report: the LED and voltage divider results as plain text, printed on their own ---------- */
var RP_SECTIONS = [
  { title: 'LED series resistor', ins: [['Supply voltage (V)', 'led-vs'], ['LED forward voltage (V)', 'led-vf'], ['LED current (mA)', 'led-i'], ['LEDs in series', 'led-n'], ['Standard series', 'led-s']],
    outs: [['Required resistance', 'led-r'], ['Standard value', 'led-std'], ['Colour bands', 'led-bands'], ['Actual LED current', 'led-ia'], ['Resistor power', 'led-pw'], ['Next common rating', 'led-rate'], ['Current range with the resistor tolerance', 'led-rng'], ['Ohm\u2019s Law check', 'led-ohm']], note: 'led-how', gate: 'led-r' },
  { title: 'Voltage divider', ins: [['Input voltage (V)', 'vd-vin'], ['Output voltage wanted (V)', 'vd-vout'], ['Total R1 + R2 wanted', 'vd-rt'], ['Load resistance', 'vd-rl'], ['Standard series', 'vd-s']],
    outs: [['R1 (top)', 'vd-r1'], ['R1 colour bands', 'vd-b1'], ['R2 (bottom)', 'vd-r2'], ['R2 colour bands', 'vd-b2'], ['Output voltage', 'vd-vo'], ['Output range with the resistor tolerance', 'vd-rng'], ['Divider current', 'vd-i'], ['Power and next common rating', 'vd-pw'], ['Ohm\u2019s Law check', 'vd-ohm']], note: 'vd-how', gate: 'vd-r1' },
  { title: 'Tolerance impact: LED current', ins: [['Supply voltage (V)', 'tl-vs'], ['Supply tolerance (%)', 'tl-ts'], ['LED forward voltage (V)', 'tl-vf'], ['LED voltage change (V)', 'tl-dv'], ['Resistance', 'tl-r'], ['Resistor tolerance (%)', 'tl-tr'], ['LED maximum current (mA)', 'tl-max']],
    outs: [['Nominal current', 'tl-nom'], ['Worst-case current range', 'tl-rng'], ['Typical spread (root-sum-square)', 'tl-rss'], ['Resistor tolerance alone', 'tl-p1'], ['Supply tolerance alone', 'tl-p2'], ['LED voltage change alone', 'tl-p3'], ['Resistor power', 'tl-pw']], note: 'tl-how', gate: 'tl-nom' },
  { title: 'Tolerance impact: divider output', ins: [['Input voltage (V)', 'td-vin'], ['Input tolerance (%)', 'td-tin'], ['R1', 'td-r1'], ['R1 tolerance (%)', 'td-t1'], ['R2', 'td-r2'], ['R2 tolerance (%)', 'td-t2'], ['Load resistance', 'td-rl']],
    outs: [['Nominal output', 'td-nom'], ['Worst-case output range', 'td-rng'], ['Typical spread (root-sum-square)', 'td-rss'], ['R1 tolerance alone', 'td-p1'], ['R2 tolerance alone', 'td-p2'], ['Input tolerance alone', 'td-p3']], note: 'td-how', gate: 'td-nom' }
];
function rpText(secs, date, url) {
  var out = ['Elecmetric calculation report', 'Resistor tools' + (date ? ' - ' + date : ''), ''], k, j, any = false;
  for (k = 0; k < secs.length; k++) {
    var sc = secs[k];
    if (!sc.ok) continue;
    any = true;
    out.push(sc.title, 'Inputs');
    for (j = 0; j < sc.ins.length; j++) out.push('  ' + sc.ins[j][0] + ': ' + (String(sc.ins[j][1]).trim() === '' ? 'none' : sc.ins[j][1]));
    out.push('Results');
    for (j = 0; j < sc.outs.length; j++) out.push('  ' + sc.outs[j][0] + ': ' + sc.outs[j][1]);
    if (sc.note) out.push('', sc.note);
    out.push('');
  }
  if (!any) return '';
  out.push('These are calculations on nominal values. The forward voltage, the supply, the temperature and the resistor tolerance all move the real result; check the resistor and LED datasheets before using it.');
  if (url) out.push('Source: ' + url);
  return out.join('\n');
}
function rpInit(doc, win) {
  var $ = function (i) { return doc.getElementById(i); }, btn = $('rp-btn'), out = $('rp-out'), msg = $('rp-msg');
  if (!btn || !out) return;
  btn.addEventListener('click', function () {
    var secs = [], k, j, sc, g, d = new Date(), date = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2), text;
    for (k = 0; k < RP_SECTIONS.length; k++) {
      sc = RP_SECTIONS[k]; g = $(sc.gate);
      var one = { title: sc.title, note: $(sc.note) ? $(sc.note).textContent : '', ins: [], outs: [], ok: !!g && g.textContent !== '' && g.textContent !== '—' };
      for (j = 0; j < sc.ins.length; j++) one.ins.push([sc.ins[j][0], $(sc.ins[j][1]) ? $(sc.ins[j][1]).value : '']);
      for (j = 0; j < sc.outs.length; j++) one.outs.push([sc.outs[j][0], $(sc.outs[j][1]) ? $(sc.outs[j][1]).textContent : '']);
      secs.push(one);
    }
    text = rpText(secs, date, win && win.location ? win.location.href : '');
    if (text === '') { if (msg) msg.textContent = 'Fix the inputs in the LED or voltage divider card first: there is no result to print.'; return; }
    if (msg) msg.textContent = '';
    out.textContent = text;
    if (doc.body && doc.body.classList) doc.body.classList.add('rp-on');
    try { if (win && win.print) win.print(); } finally { if (doc.body && doc.body.classList) doc.body.classList.remove('rp-on'); }
  });
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

module.exports = { RES_T, SMD_T, ES_T, PW_T, ledCalc, ledInit, vdOut, vdCalc, vdInit, tlPc, tlSgn, tlParts, tolLed, tolDiv, tolInit, RP_SECTIONS, rpText, rpInit, rsNum, rsCombine, pwFmt, pwCalc, spInit, pwInit, esFind, esBands, esInit, smdDecode, smdInit, resRoles, resFmt, resLabel, resDecode, resEncode, resInit, COULOMB_UNITS, coulombForce, coulombText, cbInit, ltCalc, ltInit };
