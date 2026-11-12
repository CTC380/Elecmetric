/* Elecmetric Conversion Centre generator (converters/).
   Every factor on every page is read from E.UNITS in engine.js, the same table the calculators use, so there is one source.
   Pages: a hub with a universal converter, category converters, and bidirectional direction pages (kW to HP, V to kV, ...).
   This module does not know about build_pages.js: build_pages.js hands it the page shell helpers (see build(H)). */
const E = require('../engine.js');

/* ---------- number formatting: 10 significant digits, grouped, scientific outside 1e-4 .. 1e12.
   Written without closures so the same function text runs on the page and in the build. ---------- */
function convNum(v) {
  if (v === 0) return '0';
  var a = Math.abs(v);
  if (a >= 1e-4 && a < 1e12) {
    var s = String(Number(v.toPrecision(10))), p = s.split('.');
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return p.join('.');
  }
  var m = v.toExponential(9).split('e'), mant = m[0].replace(/\.?0+$/, ''), ex = Number(m[1]);
  var sup = { '-': '\u207b', 0: '\u2070', 1: '\u00b9', 2: '\u00b2', 3: '\u00b3', 4: '\u2074', 5: '\u2075', 6: '\u2076', 7: '\u2077', 8: '\u2078', 9: '\u2079' };
  return mant + ' \u00d7 10' + String(ex).split('').map(function (c) { return sup[c]; }).join('');
}

/* Page behaviour. Receives the engine so it reads factors from E.UNITS and never carries its own copy. */
function convInit(E, cfg, doc) {
  var $ = function (i) { return doc.getElementById(i); };
  var q = $('cv-q'), v = $('cv-v'), f = $('cv-f'), t = $('cv-t'), out = $('cv-out'), fac = $('cv-fac'), err = $('cv-err'), sw = $('cv-sw');
  if (!v || !f || !t) return;
  var dim = function () { return q ? q.value : cfg.dim0; };
  function fill(sel, units, pick) {
    sel.innerHTML = '';
    units.forEach(function (u) { var o = doc.createElement('option'); o.value = u; o.textContent = u; sel.appendChild(o); });
    sel.value = pick;
  }
  function calc() {
    var d = dim(), s = v.value.replace(/,/g, '').trim(), x = Number(s), aff = !!(E.CONV_UNITS[d] && E.CONV_UNITS[d].affine);
    if (s === '' || !isFinite(x)) { out.textContent = '\u2014'; fac.textContent = ''; err.textContent = s === '' ? '' : 'Enter a number, for example 2500 or 1.5e3.'; return; }
    err.textContent = '';
    out.textContent = convNum(E.convertUnits(d, x, f.value, t.value)) + ' ' + t.value;
    fac.textContent = aff ? (convNum(0) + ' ' + f.value + ' = ' + convNum(E.convertUnits(d, 0, f.value, t.value)) + ' ' + t.value + ' (scales with different zero points need a formula, not one factor)')
      : '1 ' + f.value + ' = ' + convNum(E.convertUnits(d, 1, f.value, t.value)) + ' ' + t.value;
  }
  if (q) q.addEventListener('change', function () {
    var d = cfg.dims[q.value], us = E.unitsOf(q.value);
    fill(f, us, d[0]); fill(t, us, d[1]); calc();
  });
  [v, f, t].forEach(function (el) { el.addEventListener('input', calc); el.addEventListener('change', calc); });
  if (sw) sw.addEventListener('click', function () { var a = f.value; f.value = t.value; t.value = a; calc(); });
  calc();
}


/* ---------- number systems and scientific notation (pure functions, no closures, run on the page and in the build) ---------- */
function baseConvert(str, from, to) {
  var s = String(str).replace(/[\s_,]/g, '').toLowerCase(), neg = false;
  if (s.charAt(0) === '-') { neg = true; s = s.slice(1); }
  var pre = { 2: '0b', 8: '0o', 16: '0x' }[from];
  if (pre && s.indexOf(pre) === 0) s = s.slice(2);
  if (!s) return { ok: false, error: 'Enter a whole number.' };
  if (s.length > 200) return { ok: false, error: 'That number has too many digits (200 at most).' };
  var D = '0123456789abcdefghijklmnopqrstuvwxyz', n = BigInt(0), B = BigInt(from);
  for (var i = 0; i < s.length; i++) {
    var k = D.indexOf(s.charAt(i));
    if (k < 0 || k >= from) return { ok: false, error: 'The digit "' + s.charAt(i) + '" is not valid in base ' + from + '. Whole numbers only.' };
    n = n * B + BigInt(k);
  }
  return { ok: true, text: (neg && n !== BigInt(0) ? '-' : '') + n.toString(to).toUpperCase() };
}
function sciNotation(str) {
  var s = String(str).replace(/[\s,_]/g, '').replace(/[x\u00d7]10\^/i, 'e'), x = Number(s);
  if (s === '' || !isFinite(x)) return { ok: false, error: 'Enter a number, for example 12345.6789 or 4.7e-5.' };
  if (x === 0) return { ok: true, sci: '0', eng: '0', e: '0', plain: '0', exp: 0 };
  var sup = { '-': '\u207b', 0: '\u2070', 1: '\u00b9', 2: '\u00b2', 3: '\u00b3', 4: '\u2074', 5: '\u2075', 6: '\u2076', 7: '\u2077', 8: '\u2078', 9: '\u2079' };
  var m = Math.abs(x).toExponential().split('e'), digs = m[0].replace('.', ''), ex = Number(m[1]), sign = x < 0 ? '-' : '';
  var mant = function (shift) {
    var d = digs; while (d.length < 1 + shift) d += '0';
    var a = d.slice(0, 1 + shift), b = d.slice(1 + shift); return a + (b ? '.' + b : '');
  };
  var power = function (e) { return ' \u00d7 10' + String(e).split('').map(function (c) { return sup[c]; }).join(''); };
  var e3 = Math.floor(ex / 3) * 3;
  var plain = Math.abs(ex) > 30 ? 'too long to show' : (ex >= 0 ? mant(ex) : '0.' + new Array(-ex).join('0') + digs);
  return { ok: true, sci: sign + mant(0) + power(ex), eng: sign + mant(ex - e3) + (e3 === 0 ? '' : power(e3)), e: sign + mant(0) + 'e' + ex, plain: plain === 'too long to show' ? plain : sign + plain, exp: ex, e3: e3 };
}
/* Degrees, minutes, seconds. Pure functions (no closures) so they run on the page and in the build.
   dmsToDec(d, m, s, neg): whole degrees, minutes below 60, seconds below 60; neg gives a south or west (negative) angle.
   decToDms(str): splits a decimal angle, seconds rounded to 4 places with the carry handled. */
function dmsToDec(d, m, s, neg) {
  var ds = String(d).replace(/[\s,]/g, ''), ms = String(m).replace(/[\s,]/g, ''), ss = String(s).replace(/[\s,]/g, '');
  if (ds === '') return { ok: false, error: 'Enter the degrees, for example 28.' };
  var D = Number(ds), M = ms === '' ? 0 : Number(ms), S = ss === '' ? 0 : Number(ss);
  if (!isFinite(D) || !isFinite(M) || !isFinite(S)) return { ok: false, error: 'Degrees, minutes and seconds must be numbers.' };
  var sign = neg || ds.charAt(0) === '-'; D = Math.abs(D);
  if (M < 0 || S < 0) return { ok: false, error: 'Minutes and seconds cannot be negative. Use the sign for south or west.' };
  if (M >= 60 || S >= 60) return { ok: false, error: 'Minutes and seconds must be below 60.' };
  if (D !== Math.floor(D) && (M > 0 || S > 0)) return { ok: false, error: 'With minutes or seconds, the degrees must be a whole number.' };
  if (M !== Math.floor(M) && S > 0) return { ok: false, error: 'With seconds, the minutes must be a whole number.' };
  var v = D + M / 60 + S / 3600, r = Number(v.toFixed(8));
  return { ok: true, dec: (sign && r !== 0 ? -1 : 1) * r };
}
function decToDms(str) {
  var t = String(str).replace(/[\s,\u00b0]/g, ''), x = Number(t);
  if (t === '' || !isFinite(x)) return { ok: false, error: 'Enter a decimal angle, for example 28.5562 or -33.8688.' };
  var neg = x < 0, a = Math.abs(x), deg = Math.floor(a), rem = (a - deg) * 60, min = Math.floor(rem), sec = Math.round((rem - min) * 60 * 1e4) / 1e4;
  if (sec >= 60) { sec -= 60; min += 1; }
  if (min >= 60) { min -= 60; deg += 1; }
  var secText = String(Number(sec.toFixed(4)));
  var isZero = deg === 0 && min === 0 && sec === 0;
  return { ok: true, neg: neg && !isZero, deg: deg, min: min, sec: sec, text: (neg && !isZero ? '-' : '') + deg + '\u00b0 ' + min + '\u2032 ' + secText + '\u2033' };
}
/* Power level. powerLevel(str, unit): unit is W, mW, kW, dBm or dBW. Pure function (no closures), so it runs on the page and in the build.
   dBm = 10 log10(P / 1 mW), dBW = 10 log10(P / 1 W), so dBW = dBm - 30. */
function powerLevel(str, unit) {
  var t = String(str).replace(/[\s,]/g, ''), x = Number(t);
  if (t === '' || !isFinite(x)) return { ok: false, error: 'Enter a number, for example 30 or 0.5.' };
  var W;
  if (unit === 'dBm') W = Math.pow(10, x / 10) / 1000;
  else if (unit === 'dBW') W = Math.pow(10, x / 10);
  else if (unit === 'mW') W = x / 1000;
  else if (unit === 'kW') W = x * 1000;
  else W = x;
  if (unit.charAt(0) !== 'd' && x <= 0) return { ok: false, error: 'A power in watts must be greater than zero to have a level in dB.' };
  if (!isFinite(W) || W <= 0 || Math.abs(x) > 300 && unit.charAt(0) === 'd') return { ok: false, error: 'That value is outside the range this page handles.' };
  var p = function (v) { return String(Number(v.toPrecision(7))); }, d = function (v) { return String(Number(v.toFixed(4))); };
  return { ok: true, W: W, dBm: 10 * Math.log10(W * 1000), dBW: 10 * Math.log10(W), tW: p(W), tmW: p(W * 1000), tkW: p(W / 1000), tdBm: d(10 * Math.log10(W * 1000)), tdBW: d(10 * Math.log10(W)) };
}
/* Decibel ratio. dbRatio(str, unit): unit is dB, power (power ratio) or amplitude (voltage or current ratio across the same impedance).
   dB = 10 log10(power ratio) = 20 log10(amplitude ratio). Pure function (no closures), so it runs on the page and in the build. */
function dbRatio(str, unit) {
  var t = String(str).replace(/[\s,]/g, ''), x = Number(t);
  if (t === '' || !isFinite(x)) return { ok: false, error: 'Enter a number, for example 3 or 0.5.' };
  var dB;
  if (unit === 'dB') dB = x;
  else if (x <= 0) return { ok: false, error: 'A ratio must be greater than zero to have a level in dB.' };
  else if (unit === 'power') dB = 10 * Math.log10(x);
  else dB = 20 * Math.log10(x);
  if (!isFinite(dB) || Math.abs(dB) > 300) return { ok: false, error: 'That value is outside the range this page handles.' };
  var P = Math.pow(10, dB / 10), A = Math.pow(10, dB / 20);
  var p = function (v) { return String(Number(v.toPrecision(7))); }, d = function (v) { return String(Number(v.toFixed(4))); };
  return { ok: true, dB: dB, P: P, A: A, tdB: d(dB), tP: p(P), tA: p(A) };
}
/* Integer calculator in binary, octal, decimal or hexadecimal. binaryCalc(a, b, base, op): op is add, sub, mul, div, and, or, xor, shl or shr.
   BigInt arithmetic, so results are exact for any size the page accepts (200 digits per entry). Pure function, so it runs on the page and in the build. */
function binaryCalc(aStr, bStr, base, op) {
  var D = '0123456789abcdef', BB = BigInt(base), Z = BigInt(0), pre = { 2: '0b', 8: '0o', 16: '0x' }[base];
  var rd = function (str, name) {
    var s = String(str).replace(/[\s_,]/g, '').toLowerCase(), neg = false;
    if (s.charAt(0) === '-') { neg = true; s = s.slice(1); }
    if (pre && s.indexOf(pre) === 0) s = s.slice(2);
    if (!s) return { error: 'Enter ' + name + ' as a whole number.' };
    if (s.length > 200) return { error: name + ' has too many digits (200 at most).' };
    var n = Z;
    for (var i = 0; i < s.length; i++) {
      var k = D.indexOf(s.charAt(i));
      if (k < 0 || k >= base) return { error: 'The digit "' + s.charAt(i) + '" in ' + name + ' is not valid in base ' + base + '. Whole numbers only.' };
      n = n * BB + BigInt(k);
    }
    return { n: neg ? -n : n };
  };
  var A = rd(aStr, 'A'); if (A.error) return { ok: false, error: A.error };
  var B = rd(bStr, 'B'); if (B.error) return { ok: false, error: B.error };
  var a = A.n, b = B.n, r, rem = null;
  if (op === 'add') r = a + b;
  else if (op === 'sub') r = a - b;
  else if (op === 'mul') r = a * b;
  else if (op === 'div') { if (b === Z) return { ok: false, error: 'Cannot divide by zero.' }; r = a / b; rem = a % b; }
  else if (op === 'and' || op === 'or' || op === 'xor' || op === 'shl' || op === 'shr') {
    if (a < Z || b < Z) return { ok: false, error: 'AND, OR, XOR and shifts need non-negative numbers.' };
    if ((op === 'shl' || op === 'shr') && b > BigInt(1000)) return { ok: false, error: 'Shift by 1,000 bit positions or fewer.' };
    r = op === 'and' ? a & b : op === 'or' ? a | b : op === 'xor' ? a ^ b : op === 'shl' ? a << b : a >> b;
  } else return { ok: false, error: 'Choose an operation.' };
  var T = function (n, x) { return (n < Z ? '-' : '') + (n < Z ? -n : n).toString(x).toUpperCase(); };
  var bin = T(r, 2), neg = bin.charAt(0) === '-', digs = neg ? bin.slice(1) : bin;
  while (digs.length % 4) digs = '0' + digs;
  var remText = rem === null ? '' : 'Remainder ' + T(rem, 10) + ' (binary ' + T(rem, 2) + ', hex ' + T(rem, 16) + ')';
  return { ok: true, bin: bin, binG: (neg ? '-' : '') + digs.replace(/(.{4})(?=.)/g, '$1 '), oct: T(r, 8), dec: T(r, 10), hex: T(r, 16), bits: (r < Z ? -r : r).toString(2).length, rem: remText, a: T(a, 10), b: T(b, 10) };
}
/* SI prefix converter. siPrefix(str, from, to): from and to are powers of ten (12, 9, 6, 3, 0, -3, -6, -9, -12, -15).
   Moves the decimal point on the digit string, so no floating-point error is introduced. Pure function, so it runs on the page and in the build. */
function siPrefix(str, from, to) {
  var s = String(str).replace(/[\s,_]/g, '').replace(/[x\u00d7]10\^/i, 'e').toLowerCase();
  var m = /^([+-]?)(\d*)\.?(\d*)(?:e([+-]?\d+))?$/.exec(s);
  if (!m || (m[2] === '' && m[3] === '')) return { ok: false, error: 'Enter a number, for example 4700 or 4.7e3.' };
  var ex = m[4] ? Number(m[4]) : 0;
  if (Math.abs(ex) > 300 || (m[2] + m[3]).length > 60) return { ok: false, error: 'That value is outside the range this page handles.' };
  var sign = m[1] === '-' ? '-' : '', digs = (m[2] + m[3]).replace(/^0+/, ''), e10 = ex - m[3].length;
  if (digs === '') return { ok: true, text: '0', e: '0', best: '0', value: 0 };
  var tz = digs.match(/0*$/)[0].length; digs = digs.slice(0, digs.length - tz); e10 += tz;
  var zeros = function (k) { return new Array(k + 1).join('0'); };
  var plain = function (d, e) {
    if (e >= 0) return e > 40 ? 'too long to show' : d + zeros(e);
    var k = -e; if (k < d.length) return d.slice(0, d.length - k) + '.' + d.slice(d.length - k);
    return k - d.length > 40 ? 'too long to show' : '0.' + zeros(k - d.length) + d;
  };
  var te = e10 + from - to, names = { 12: 'T', 9: 'G', 6: 'M', 3: 'k', 0: '', '-3': 'm', '-6': '\u00b5', '-9': 'n', '-12': 'p', '-15': 'f' };
  var lead = e10 + from + digs.length - 1, e3 = Math.max(-15, Math.min(12, Math.floor(lead / 3) * 3));
  var best = plain(digs, e10 + from - e3);
  return { ok: true, text: sign + plain(digs, te), e: sign + digs.charAt(0) + (digs.length > 1 ? '.' + digs.slice(1) : '') + 'e' + (te + digs.length - 1),
    best: best === 'too long to show' ? best : sign + best + (e3 === 0 ? '' : ' ' + names[e3]), bestExp: e3, value: Number(sign + digs + 'e' + te) };
}
function numInit(doc) {
  var $ = function (i) { return doc.getElementById(i); }, v = $('nb-v'), b = $('nb-b'), sv = $('sn-v'), err = $('nm-err');
  if (v && b) {
    var calcB = function () {
      var r = baseConvert(v.value, Number(b.value), 10);
      [2, 8, 10, 16].forEach(function (t) { var o = $('nb-' + t), q = r.ok ? baseConvert(v.value, Number(b.value), t) : null; o.textContent = q && q.ok ? q.text : '\u2014'; });
      err.textContent = r.ok || v.value.trim() === '' ? '' : r.error;
    };
    v.addEventListener('input', calcB); b.addEventListener('change', calcB); calcB();
  }
  if (sv) {
    var calcS = function () {
      var r = sciNotation(sv.value);
      [['sci', 'sn-sci'], ['eng', 'sn-eng'], ['e', 'sn-e'], ['plain', 'sn-plain']].forEach(function (p) { $(p[1]).textContent = r.ok ? r[p[0]] : '\u2014'; });
      err.textContent = r.ok || sv.value.trim() === '' ? '' : r.error;
    };
    sv.addEventListener('input', calcS); calcS();
  }
  var ddv = $('dd-v'), dmd = $('dm-d');
  if (dmd) {
    var calcM = function () {
      var r = dmsToDec(dmd.value, $('dm-m').value, $('dm-s').value, $('dm-sg').value === 'n'), o = $('dm-out');
      o.textContent = r.ok ? String(r.dec) + '\u00b0' : '\u2014';
      err.textContent = r.ok ? '' : r.error;
    };
    ['dm-d', 'dm-m', 'dm-s'].forEach(function (i) { $(i).addEventListener('input', calcM); });
    $('dm-sg').addEventListener('change', calcM); calcM();
  }
  if (ddv) {
    var calcD = function () {
      var r = decToDms(ddv.value), o = $('dd-out');
      o.textContent = r.ok ? r.text : '\u2014';
      err.textContent = r.ok || ddv.value.trim() === '' ? '' : r.error;
    };
    ddv.addEventListener('input', calcD); calcD();
  }
  var dbv = $('db-v');
  if (dbv) {
    var calcDb = function () {
      var r = dbRatio(dbv.value, $('db-u').value);
      [['db-dB', 'tdB'], ['db-P', 'tP'], ['db-A', 'tA']].forEach(function (k) { $(k[0]).textContent = r.ok ? r[k[1]] : '\u2014'; });
      err.textContent = r.ok || dbv.value.trim() === '' ? '' : r.error;
    };
    dbv.addEventListener('input', calcDb); $('db-u').addEventListener('change', calcDb); calcDb();
  }
  var plv = $('pl-v');
  if (plv) {
    var calcP = function () {
      var r = powerLevel(plv.value, $('pl-u').value);
      [['pl-W', 'tW'], ['pl-mW', 'tmW'], ['pl-kW', 'tkW'], ['pl-dBm', 'tdBm'], ['pl-dBW', 'tdBW']].forEach(function (k) { $(k[0]).textContent = r.ok ? r[k[1]] : '\u2014'; });
      err.textContent = r.ok || plv.value.trim() === '' ? '' : r.error;
    };
    plv.addEventListener('input', calcP); $('pl-u').addEventListener('change', calcP); calcP();
  }
  var bca = $('bc-a');
  if (bca) {
    var calcBc = function () {
      var r = binaryCalc(bca.value, $('bc-b').value, Number($('bc-base').value), $('bc-op').value);
      [['bc-2', 'binG'], ['bc-8', 'oct'], ['bc-10', 'dec'], ['bc-16', 'hex'], ['bc-bits', 'bits'], ['bc-x', 'rem']].forEach(function (k) { $(k[0]).textContent = r.ok ? String(r[k[1]]) : '\u2014'; });
      err.textContent = r.ok || (bca.value.trim() === '' && $('bc-b').value.trim() === '') ? '' : r.error;
    };
    bca.addEventListener('input', calcBc); $('bc-b').addEventListener('input', calcBc); $('bc-base').addEventListener('change', calcBc); $('bc-op').addEventListener('change', calcBc); calcBc();
  }
  var spv = $('sp-v');
  if (spv) {
    var calcSp = function () {
      var r = siPrefix(spv.value, Number($('sp-f').value), Number($('sp-t').value));
      [['sp-out', 'text'], ['sp-e', 'e'], ['sp-best', 'best']].forEach(function (k) { $(k[0]).textContent = r.ok ? r[k[1]] : '\u2014'; });
      err.textContent = r.ok || spv.value.trim() === '' ? '' : r.error;
    };
    spv.addEventListener('input', calcSp); $('sp-f').addEventListener('change', calcSp); $('sp-t').addEventListener('change', calcSp); calcSp();
  }
}

/* ---------- content ---------- */
const DIM_LABEL = { charge: 'Battery charge (capacity)', power: 'Power (real, W)', apparent: 'Apparent power (VA)', reactive: 'Reactive power (VAR)', voltage: 'Voltage', current: 'Current', resistance: 'Resistance', energy: 'Energy', frequency: 'Frequency', capacitance: 'Capacitance', inductance: 'Inductance' };
/* Energy is stored in Wh in the engine; show joules on the page because that is the SI unit people look for. */
const BASEVIEW = { energy: { unit: 'J', mult: 3600 } };
const NOTE = {
  mAh: 'Milliampere-hour, a thousandth of an ampere-hour. Phone, power bank and small cell ratings.', Ah: 'Ampere-hour: one ampere for one hour. Lead-acid, lithium and UPS battery ratings.', kAh: 'Kiloampere-hour, a thousand ampere-hours. Large battery banks and electrolysis.', C: 'Coulomb, the SI unit of charge: one ampere for one second. 1 Ah = 3,600 C.', mC: 'Millicoulomb, a thousandth of a coulomb.', kC: 'Kilocoulomb, a thousand coulombs. 1 kC is about 0.2778 Ah.',
  'µW': 'Microwatt, a millionth of a watt.', mW: 'Milliwatt, a thousandth of a watt.', W: 'Watt, one joule per second. The SI unit of power.', kW: 'Kilowatt. The usual rating unit for motors, heaters and generators.', MW: 'Megawatt, for power stations and large plant.', GW: 'Gigawatt, a billion watts. National and regional grid capacity.', BHP: 'Brake horsepower: power measured at the engine or motor shaft. In the imperial system it uses the same 550 ft·lbf/s as mechanical horsepower, so 1 BHP = 1 HP here. Metric brake horsepower is closer to PS.',
  HP: 'Mechanical horsepower: 550 foot-pounds-force per second. Electric motors are often rated 1 hp = 746 W, so check the nameplate in kW.', PS: 'Metric horsepower (PS, CV, cv): 75 kilogram-force metres per second.', 'BTU/h': 'British thermal units per hour (International Table BTU). A heat flow, used for heating and cooling ratings.', TR: 'Ton of refrigeration: 12,000 BTU/h. A cooling capacity, not the electrical power the machine draws.',
  VA: 'Volt-ampere, the unit of apparent power. Not the same as watts unless the power factor is 1.', kVA: 'Kilovolt-ampere. Transformers, UPS and generators are rated in kVA.', MVA: 'Megavolt-ampere, for large transformers and grid equipment.',
  VAR: 'Volt-ampere reactive, the unit of reactive power.', kVAR: 'Kilovolt-ampere reactive. Capacitor banks are rated in kVAR.', MVAR: 'Megavolt-ampere reactive.',
  'µV': 'Microvolt, a millionth of a volt.', mV: 'Millivolt, a thousandth of a volt. Sensor and signal level.', V: 'Volt, the SI unit of electric potential.', kV: 'Kilovolt. Medium and high voltage systems.', MV: 'Megavolt.', GV: 'Gigavolt, a billion volts. Lightning and particle physics.',
  'µA': 'Microampere, a millionth of an ampere.', mA: 'Milliampere. Control circuits and leakage current.', A: 'Ampere, the SI unit of electric current.', kA: 'Kiloampere. Fault current and short-circuit ratings.', MA: 'Megaampere.',
  'mΩ': 'Milliohm. Cable and contact resistance.', 'Ω': 'Ohm, the SI unit of resistance.', 'kΩ': 'Kiloohm, a thousand ohms.', 'MΩ': 'Megohm. Insulation resistance readings.', 'GΩ': 'Gigaohm. High-range insulation resistance.',
  'µJ': 'Microjoule.', mJ: 'Millijoule.', J: 'Joule, the SI unit of energy: one watt-second.', kJ: 'Kilojoule.', MJ: 'Megajoule.', kcal: 'Kilocalorie (International Table), 4,186.8 J. Food and thermal energy.', cal: 'Calorie (International Table), 4.1868 J. The small calorie; a food Calorie is a kilocalorie.', GeV: 'Gigaelectron-volt, a billion electron-volts. Particle accelerator energies.', BTU: 'British thermal unit (International Table).',
  Wh: 'Watt-hour: one watt for one hour.', kWh: 'Kilowatt-hour. The billing unit for electricity: one kilowatt for one hour.', MWh: 'Megawatt-hour, for utility and plant energy.', eV: 'Electron-volt: the energy of one electron through one volt.', keV: 'Kiloelectron-volt.', MeV: 'Megaelectron-volt.',
  Hz: 'Hertz, cycles per second. Mains is 50 Hz or 60 Hz.', kHz: 'Kilohertz. Switching and carrier frequencies.', MHz: 'Megahertz. Radio and fast digital signals.', GHz: 'Gigahertz. Wi-Fi, microwave and processor clocks.', THz: 'Terahertz, a trillion hertz. Far-infrared and terahertz imaging.', 'rad/s': 'Radians per second: angular frequency, ω = 2πf. One hertz is 2π rad/s, so 50 Hz is about 314.16 rad/s.',
  pF: 'Picofarad, a millionth of a microfarad.', nF: 'Nanofarad.', 'µF': 'Microfarad. Motor run capacitors and filters.', F: 'Farad, the SI unit of capacitance.',
  'µH': 'Microhenry.', mH: 'Millihenry. Chokes and reactors.', H: 'Henry, the SI unit of inductance.'
};

const CATS = [
  {
    slug: 'electrical-unit-converter', h1: 'Electrical Unit Converter', dims: ['voltage', 'current', 'resistance', 'power', 'apparent', 'reactive', 'energy', 'frequency', 'capacitance', 'inductance'], dim: 'voltage',
    desc: 'Convert electrical units in one place: volts, amps, ohms, watts, VA, VAR, Wh and J, hertz, farads and henries, with the factor shown and the limits explained.',
    lede: 'One converter for the electrical quantities. Choose the quantity, then the units. Each quantity converts only within itself: volts to amps or kVA to kW is a calculation that needs more inputs, not a unit change.',
    def: { voltage: ['kV', 'V'], current: ['A', 'mA'], resistance: ['kΩ', 'Ω'], power: ['kW', 'W'], apparent: ['kVA', 'VA'], reactive: ['kVAR', 'VAR'], energy: ['kWh', 'J'], frequency: ['kHz', 'Hz'], capacitance: ['µF', 'nF'], inductance: ['mH', 'µH'] }, val: 5,
    pairs: [['kV', 'V'], ['V', 'kV'], ['A', 'mA'], ['kΩ', 'Ω'], ['kW', 'W'], ['kWh', 'J']],
    notes: [
      ['Units change, quantities do not', 'A unit conversion multiplies by a fixed factor and stays inside one quantity. Volts, amps and ohms are three different quantities, so there is no factor between them. Ohm\'s law links them and needs two of the three.'],
      ['Power has three kinds', 'Watts (kW) are real power, volt-amperes (kVA) are apparent power and VAR (kVAR) are reactive power. kVA to kW needs the power factor, so it is not a unit conversion.'],
      ['Amps to kW needs voltage, power factor and phases', 'Current alone does not give power. Use the amps to kW calculator, which covers DC, single-phase and three-phase, line-to-line or line-to-neutral voltage, power factor and efficiency, and shows the working.']
    ],
    links: [['amps-to-kw', 'Amps to kW'], ['kw-to-amps', 'kW to amps'], ['kva-to-kw', 'kVA to kW'], ['ohms-law', 'Ohm\'s law']],
    faq: [['Can this page convert volts to amps?', 'No. Volts and amps are different quantities. Current depends on the load: use Ohm\'s law with a resistance, or the kW to amps calculator with a power, voltage, power factor and number of phases.']]
  },
  {
    slug: 'battery-capacity-converter', h1: 'Battery Capacity Converter', dims: ['charge', 'energy'], dim: 'charge',
    desc: 'Convert mAh, Ah and kAh, and battery energy in Wh and kWh, with the factor shown. Explains why Ah to Wh needs the battery voltage.',
    lede: 'Convert battery capacity with the factor behind each answer. Charge (mAh, Ah) and energy (Wh, kWh) are different quantities: going from one to the other needs the nominal voltage, so it is a calculation, not a unit change.',
    def: { charge: ['Ah', 'mAh'], energy: ['Wh', 'kWh'] }, val: 100,
    pairs: [['Ah', 'mAh'], ['mAh', 'Ah'], ['kAh', 'Ah'], ['Wh', 'kWh'], ['kWh', 'Wh']],
    batteryEx: { q: 5000, qUnit: 'mAh', v: 3.7 },
    notes: [
      ['Ah and Wh are not the same thing', 'Ampere-hours measure the charge a battery can deliver. Watt-hours measure the energy, which is charge multiplied by voltage. A 100 Ah battery holds 1,200 Wh at 12 V and 2,400 Wh at 24 V, so quote the voltage with any Ah rating.'],
      ['Rated capacity depends on the discharge rate', 'A battery rating is valid at a stated discharge rate and temperature. Drawing current faster gives less usable capacity, especially for lead-acid, so check the datasheet before sizing a runtime. Usable energy is also limited by depth of discharge.'],
      ['Nominal voltage', 'Use the nominal voltage on the datasheet: about 3.6 to 3.7 V for a lithium-ion cell, 3.2 V for LiFePO4 and 2 V for a lead-acid cell. Multiply by the number of cells in series for the pack.']
    ],
    links: [['mah-to-wh', 'mAh to Wh'], ['wh-to-mah', 'Wh to mAh'], ['kw-to-kwh', 'kW to kWh'], ['energy-cost', 'Energy cost of one appliance']],
    faq: [['How do I convert Ah to Wh?', 'Multiply the ampere-hours by the nominal voltage: Wh = Ah × V. A 100 Ah battery at 12 V stores 1,200 Wh. The mAh to Wh calculator solves any two of capacity, voltage and energy.']]
  },
  {
    slug: 'power-converter', h1: 'Power Converter', dims: ['power', 'apparent', 'reactive'],
    desc: 'Convert W, kW, MW, HP, PS, BTU/h and TR, plus VA and VAR units, with the factor shown. Explains why kW, kVA and kVAR are different quantities.',
    lede: 'Convert power units with the factor behind each answer. Real power (W), apparent power (VA) and reactive power (VAR) are different quantities, so each one converts only within itself.',
    def: { power: ['kW', 'HP'], apparent: ['kVA', 'VA'], reactive: ['kVAR', 'VAR'] }, val: 5, dim: 'power',
    pairs: [['W', 'kW'], ['kW', 'W'], ['kW', 'HP'], ['HP', 'kW'], ['MW', 'kW'], ['BTU/h', 'W'], ['TR', 'kW']],
    notes: [
      ['kW, kVA and kVAR are not interchangeable', 'kW is real power that does work, kVA is apparent power (voltage times current), and kVAR is reactive power. They are linked by S² = P² + Q² and by the power factor, pf = P / S. Converting kVA to kW needs a power factor, so it is not a unit conversion. Use the kVA to kW calculator for that.'],
      ['Horsepower is not one unit', 'This page uses mechanical horsepower (550 ft·lbf/s). Metric horsepower (PS) is slightly smaller, and many motor makers round to 746 W. For a motor, work from the kW on the nameplate.'],
      ['BTU/h and TR describe heat', 'They rate heating and cooling capacity. A 1 TR air conditioner removes heat at that rate, but draws far less electrical power than its cooling capacity.']
    ],
    links: [['kva-to-kw', 'kVA to kW (needs power factor)'], ['kw-to-kva', 'kW to kVA'], ['amps-to-kw', 'Amps to kW (needs voltage)'], ['power-calculator', 'Power from voltage and current']],
    faq: [['Can I convert kVA to kW with a factor?', 'Not with a fixed factor. kVA is apparent power and kW is real power, and the ratio is the power factor of the load. Use the kVA to kW calculator and enter the power factor.']]
  },
  {
    slug: 'energy-converter', h1: 'Energy Converter', dims: ['energy'],
    desc: 'Convert J, kJ, MJ, Wh, kWh, MWh, kcal, BTU and eV with the factor shown, a worked example and a note on kW versus kWh.',
    lede: 'Convert energy units with the factor behind each answer. Energy is power over time, so kWh is a quantity of energy and kW is a rate.',
    def: { energy: ['kWh', 'MJ'] }, val: 2, dim: 'energy',
    pairs: [['J', 'kWh'], ['kWh', 'J'], ['kWh', 'MJ'], ['Wh', 'kWh'], ['MWh', 'kWh'], ['kcal', 'kJ'], ['BTU', 'kJ']],
    notes: [
      ['kW and kWh are different quantities', 'kW is power, a rate. kWh is energy: power multiplied by time. A 2 kW heater running for 3 hours uses 6 kWh. To go between them you need the time, which the kW to kWh calculator asks for.'],
      ['Why 1 kWh is 3.6 million joules', 'One kilowatt is 1,000 joules per second, and one hour is 3,600 seconds, so 1 kWh = 1,000 × 3,600 J = 3,600,000 J = 3.6 MJ.'],
      ['Thermal and particle units', 'kcal and BTU are used for heat, and eV for particle energies. The factors here are the International Table values.']
    ],
    links: [['kw-to-kwh', 'kW to kWh (needs time)'], ['kwh-to-kw', 'kWh to kW (needs time)'], ['energy-cost', 'Energy cost of one appliance'], ['electricity-bill', 'Electricity bill with tariff slabs']],
    faq: [['How do I convert kW to kWh?', 'Multiply the power in kW by the running time in hours. There is no fixed factor, because kW is a rate and kWh is an amount. The kW to kWh calculator does this for you.']]
  },
  {
    slug: 'voltage-converter', h1: 'Voltage Converter', dims: ['voltage'],
    desc: 'Convert V, mV, µV, kV and MV with the factor shown, a worked example and notes on RMS values and line-to-line versus line-to-neutral voltage.',
    lede: 'Convert voltage units with the factor behind each answer. The unit changes the number, not the voltage.',
    def: { voltage: ['kV', 'V'] }, val: 11, dim: 'voltage',
    pairs: [['V', 'kV'], ['kV', 'V'], ['mV', 'V'], ['V', 'mV'], ['MV', 'kV']],
    notes: [
      ['AC voltage is normally RMS', 'Mains voltages such as 230 V or 11 kV are RMS values. The peak of a 230 V sine wave is about 325 V. A unit conversion keeps the same kind of value, so convert RMS to RMS.'],
      ['Line-to-line and line-to-neutral', 'A three-phase system has two voltages. Line-to-line is √3 times line-to-neutral, for example 400 V and 230 V. Converting units does not change which one you have, so state which one you mean.']
    ],
    links: [['volts-to-watts', 'Volts to watts'], ['volts-to-amps', 'Volts to amps'], ['voltage-drop', 'Voltage drop'], ['voltage-divider', 'Voltage divider']],
    faq: []
  },
  {
    slug: 'current-converter', h1: 'Current Converter', dims: ['current'],
    desc: 'Convert A, mA, µA, kA and MA with the factor shown and a worked example. Explains why amps to kW needs voltage and power factor.',
    lede: 'Convert current units with the factor behind each answer. Changing amps into another unit of current is exact. Changing amps into power is not a unit conversion.',
    def: { current: ['mA', 'A'] }, val: 250, dim: 'current',
    pairs: [['A', 'mA'], ['mA', 'A'], ['kA', 'A'], ['A', 'kA'], ['µA', 'mA']],
    notes: [
      ['Amps to kW is not a unit conversion', 'Current and power are different quantities. You need the voltage, and for AC the power factor and the number of phases. Use the amps to kW calculator, which covers DC, single-phase and three-phase.'],
      ['Where each unit is used', 'µA and mA appear in instrument and leakage readings, A in circuits and cables, and kA in fault levels and breaker short-circuit ratings.']
    ],
    links: [['amps-to-kw', 'Amps to kW'], ['kw-to-amps', 'kW to amps'], ['amps-to-kva', 'Amps to kVA'], ['amps-to-watts', 'Amps to watts']],
    faq: []
  },
  {
    slug: 'resistance-converter', h1: 'Resistance Converter', dims: ['resistance'],
    desc: 'Convert mΩ, Ω, kΩ, MΩ and GΩ with the factor shown and a worked example, with notes on insulation resistance readings and Ohm\'s law.',
    lede: 'Convert resistance units with the factor behind each answer.',
    def: { resistance: ['MΩ', 'Ω'] }, val: 2.5, dim: 'resistance',
    pairs: [['Ω', 'kΩ'], ['kΩ', 'Ω'], ['MΩ', 'kΩ'], ['MΩ', 'Ω'], ['mΩ', 'Ω'], ['GΩ', 'MΩ']],
    notes: [
      ['Insulation resistance', 'Insulation testers read in MΩ or GΩ. Compare a reading with the limit in your specification in the same unit, and note that insulation resistance falls as temperature rises.'],
      ['Ohm\'s law', 'R = V / I. A resistance converts to another unit exactly, but finding a resistance from volts and amps is a calculation. The Ohm\'s law calculator does that.']
    ],
    links: [['ohms-law', 'Ohm\'s law calculator'], ['voltage-divider', 'Voltage divider'], ['watts-volts-amps-ohms', 'Watts, volts, amps and ohms']],
    faq: []
  },
  {
    slug: 'frequency-converter', h1: 'Frequency Converter', dims: ['frequency'],
    desc: 'Convert Hz, kHz and MHz with the factor shown and a worked example, with the link between frequency, angular frequency and motor synchronous speed.',
    lede: 'Convert frequency units with the factor behind each answer.',
    def: { frequency: ['kHz', 'Hz'] }, val: 20, dim: 'frequency',
    pairs: [['Hz', 'kHz'], ['kHz', 'Hz'], ['MHz', 'kHz'], ['MHz', 'Hz']],
    notes: [
      ['Mains frequency', 'Mains is 50 Hz in most of the world and 60 Hz in the Americas and parts of Asia. Equipment rated for one may not be suitable for the other.'],
      ['Related quantities', 'Angular frequency is ω = 2πf in radians per second. The synchronous speed of an AC machine is n = 120 f / p in rpm, where p is the number of poles: 50 Hz and 4 poles give 1,500 rpm.']
    ],
    links: [['power-factor', 'Power factor'], ['voltage-drop', 'Voltage drop']],
    faq: []
  },
  {
    slug: 'capacitance-converter', h1: 'Capacitance Converter', dims: ['capacitance'],
    desc: 'Convert pF, nF, µF and F with the factor shown and a worked example, with the capacitive reactance formula and a reactance example at 50 Hz.',
    lede: 'Convert capacitance units with the factor behind each answer.',
    def: { capacitance: ['µF', 'nF'] }, val: 47, dim: 'capacitance',
    pairs: [['µF', 'nF'], ['nF', 'µF'], ['pF', 'nF'], ['F', 'µF'], ['µF', 'F']],
    reactance: { name: 'Capacitive reactance', symbol: 'Xc', formula: 'Xc = 1 / (2π f C)', calc: (c, f) => 1 / (2 * Math.PI * f * c), val: 100, unit: 'µF' },
    notes: [
      ['Capacitive reactance', 'In an AC circuit a capacitor opposes current with a reactance Xc = 1 / (2π f C), in ohms, with f in hertz and C in farads. Convert C to farads first, then apply the formula.']
    ],
    links: [['power-factor', 'Power factor']],
    faq: []
  },
  {
    slug: 'inductance-converter', h1: 'Inductance Converter', dims: ['inductance'],
    desc: 'Convert µH, mH and H with the factor shown and a worked example, with the inductive reactance formula and a reactance example at 50 Hz.',
    lede: 'Convert inductance units with the factor behind each answer.',
    def: { inductance: ['mH', 'µH'] }, val: 25, dim: 'inductance',
    pairs: [['mH', 'µH'], ['µH', 'mH'], ['H', 'mH'], ['mH', 'H']],
    reactance: { name: 'Inductive reactance', symbol: 'XL', formula: 'XL = 2π f L', calc: (l, f) => 2 * Math.PI * f * l, val: 1, unit: 'H' },
    notes: [
      ['Inductive reactance', 'In an AC circuit an inductor opposes current with a reactance XL = 2π f L, in ohms, with f in hertz and L in henries. Convert L to henries first, then apply the formula.']
    ],
    links: [['power-factor', 'Power factor']],
    faq: []
  }
];

/* Direction pages: slug, from, to, dimension, example value, typical values, opposite, related links, extra FAQ. */
const DIRS = [
  { slug: 'ah-to-mah', from: 'Ah', to: 'mAh', dim: 'charge', val: 2.5, vals: [0.5, 1, 2.5, 5, 10, 50, 100], rev: 'mah-to-ah', cat: 'battery-capacity-converter',
    links: [['mah-to-wh', 'mAh to Wh'], ['wh-to-mah', 'Wh to mAh']],
    faq: [['Does this tell me how much energy the battery holds?', 'No. Ah and mAh both measure charge. Energy in Wh is the charge in Ah multiplied by the nominal voltage, so use the mAh to Wh calculator and enter the voltage.']] },
  { slug: 'mah-to-ah', from: 'mAh', to: 'Ah', dim: 'charge', val: 5000, vals: [500, 1000, 2500, 5000, 10000, 20000, 100000], rev: 'ah-to-mah', cat: 'battery-capacity-converter',
    links: [['mah-to-wh', 'mAh to Wh'], ['wh-to-mah', 'Wh to mAh']],
    faq: [['Does this tell me how much energy the battery holds?', 'No. mAh and Ah both measure charge. Energy in Wh needs the nominal voltage: Wh = Ah × V. Use the mAh to Wh calculator for that.']] },
  { slug: 'watts-to-kw', from: 'W', to: 'kW', dim: 'power', val: 2500, vals: [100, 500, 1000, 2500, 5000, 10000], rev: 'kw-to-watts', cat: 'power-converter',
    links: [['watts-to-amps', 'Watts to amps'], ['watts-to-kwh', 'Watts to kWh']],
    faq: [['Is converting watts to kW the same as converting watts to kWh?', 'No. Watts and kW both measure power, so the conversion is a fixed factor. kWh measures energy and also needs the time, so use the watts to kWh calculator for that.']] },
  { slug: 'kw-to-watts', from: 'kW', to: 'W', dim: 'power', val: 2.5, vals: [0.1, 0.5, 1, 2.5, 5, 10], rev: 'watts-to-kw', cat: 'power-converter',
    links: [['kw-to-amps', 'kW to amps'], ['kw-to-kwh', 'kW to kWh']],
    faq: [['Is converting kW to watts the same as converting kW to kWh?', 'No. kW and watts are both power, so the conversion is a fixed factor. kWh is energy and needs the running time, so use the kW to kWh calculator for that.']] },
  { slug: 'kw-to-hp', from: 'kW', to: 'HP', dim: 'power', val: 5, vals: [0.75, 1, 2.2, 5, 7.5, 11, 15, 22], rev: 'hp-to-kw', cat: 'power-converter',
    links: [['kw-to-amps', 'kW to amps'], ['kw-to-kva', 'kW to kVA']],
    faq: [['Which horsepower does this page use?', 'Mechanical horsepower, 550 ft·lbf/s, which is 745.699872 W. Metric horsepower (PS) is 735.49875 W, and the power converter lets you pick it. Motor nameplates in kW avoid the ambiguity.']] },
  { slug: 'hp-to-kw', from: 'HP', to: 'kW', dim: 'power', val: 10, vals: [0.5, 1, 5, 7.5, 10, 20, 50, 100], rev: 'kw-to-hp', cat: 'power-converter',
    links: [['kw-to-amps', 'kW to amps'], ['kw-to-kva', 'kW to kVA']],
    faq: [['Why does a 10 hp motor not use exactly this many kW?', 'The result is the mechanical output power. A motor draws more electrical power than it delivers, by the loss that its efficiency describes, so the input kW is higher than the shaft kW.']] },
  { slug: 'volts-to-kv', from: 'V', to: 'kV', dim: 'voltage', val: 11000, vals: [230, 415, 690, 3300, 6600, 11000, 33000], rev: 'kv-to-volts', cat: 'voltage-converter',
    links: [['volts-to-watts', 'Volts to watts'], ['volts-to-amps', 'Volts to amps']],
    faq: [['Does the conversion depend on current or power?', 'No. Volts and kilovolts are both units of voltage, so the factor is fixed. Finding watts or amps from volts needs more information.']] },
  { slug: 'kv-to-volts', from: 'kV', to: 'V', dim: 'voltage', val: 11, vals: [0.415, 0.69, 3.3, 6.6, 11, 33], rev: 'volts-to-kv', cat: 'voltage-converter',
    links: [['volts-to-watts', 'Volts to watts'], ['volts-to-amps', 'Volts to amps']],
    faq: [['Does the conversion depend on current or power?', 'No. Kilovolts and volts are both units of voltage, so the factor is fixed. Finding watts or amps from volts needs more information.']] },
  { slug: 'joules-to-kwh', from: 'J', to: 'kWh', dim: 'energy', val: 7200000, vals: [3600, 36000, 360000, 3600000, 7200000, 36000000], rev: 'kwh-to-joules', cat: 'energy-converter',
    links: [['joules-to-watts', 'Joules to watts'], ['kw-to-kwh', 'kW to kWh']],
    faq: [['Why are there 3.6 million joules in a kWh?', 'One kW is 1,000 J every second, and an hour has 3,600 seconds, so one kWh is 1,000 × 3,600 = 3,600,000 J.']] },
  { slug: 'kwh-to-joules', from: 'kWh', to: 'J', dim: 'energy', val: 2, vals: [0.001, 0.01, 0.1, 1, 2, 10], rev: 'joules-to-kwh', cat: 'energy-converter',
    links: [['watts-to-joules', 'Watts to joules'], ['kwh-to-kw', 'kWh to kW']],
    faq: [['Why are there 3.6 million joules in a kWh?', 'One kW is 1,000 J every second, and an hour has 3,600 seconds, so one kWh is 1,000 × 3,600 = 3,600,000 J.']] }
];

/* v1.12.0: direction pages for the unit conversions RapidTables lists that were missing. Pure factors, no result figures in the text:
   every number on a page comes from the engine, and the test suite checks each page against separately coded factors. */
const XD = (slug, from, to, dim, val, vals, rev, cat, links, q, a) => ({ slug, from, to, dim, val, vals, rev, cat, links, faq: [[q, a]] });
DIRS.push(
  XD('amps-to-ma', 'A', 'mA', 'current', 0.5, [0.001, 0.01, 0.1, 0.5, 1, 5, 20], 'ma-to-amps', 'current-converter', [['amps-to-watts', 'Amps to watts'], ['amps-to-kw', 'Amps to kW']],
    'Is converting amps to milliamps the same as converting amps to watts?', 'No. Amps and milliamps both measure current, so the conversion is a fixed factor. Watts are power and also need the voltage, so use the amps to watts calculator for that.'),
  XD('ma-to-amps', 'mA', 'A', 'current', 250, [1, 10, 100, 250, 500, 1000, 5000], 'amps-to-ma', 'current-converter', [['amps-to-watts', 'Amps to watts'], ['volts-to-amps', 'Volts to amps']],
    'Why do small electronic loads and chargers quote milliamps?', 'Signal-level and battery-powered loads draw fractions of an amp, so milliamps give convenient whole numbers. The conversion to amps is a fixed factor and does not depend on the voltage.'),
  XD('watts-to-mw', 'W', 'mW', 'power', 0.25, [0.001, 0.01, 0.1, 0.25, 1, 5, 10], 'mw-to-watts', 'power-converter', [['watts-to-kwh', 'Watts to kWh'], ['watts-to-amps', 'Watts to amps']],
    'Is mW the same as MW?', 'No. A lowercase m is milli (one thousandth) and an uppercase M is mega (one million), so mW and MW differ by a factor of one billion. Check the capitalisation on data sheets.'),
  XD('mw-to-watts', 'mW', 'W', 'power', 500, [1, 10, 100, 500, 1000, 5000], 'watts-to-mw', 'power-converter', [['watts-to-kwh', 'Watts to kWh'], ['watts-to-amps', 'Watts to amps']],
    'Where are milliwatts used?', 'Milliwatts describe low-power signals and radio transmitters, such as a laser pointer or a wireless module. For radio levels the dBm converter expresses the same power on a logarithmic scale.'),
  XD('kw-to-megawatts', 'kW', 'MW', 'power', 2500, [100, 500, 1000, 2500, 10000, 100000], 'megawatts-to-kw', 'power-converter', [['kw-to-amps', 'kW to amps'], ['kw-to-kwh', 'kW to kWh']],
    'Is a megawatt the same as a megawatt-hour?', 'No. MW is power and MWh is energy. A 1 MW load running for one hour uses 1 MWh, so converting between them needs the running time.'),
  XD('megawatts-to-kw', 'MW', 'kW', 'power', 2.5, [0.1, 0.5, 1, 2.5, 10, 100], 'kw-to-megawatts', 'power-converter', [['kw-to-amps', 'kW to amps'], ['kw-to-kwh', 'kW to kWh']],
    'Is a megawatt the same as a megavolt-ampere?', 'Only at unity power factor. MW is real power and MVA is apparent power, and the ratio between them is the power factor, so use the kVA to kW calculator when the power factor is not 1.'),
  XD('btu-per-hour-to-kw', 'BTU/h', 'kW', 'power', 12000, [1000, 5000, 12000, 18000, 24000, 60000], 'kw-to-btu-per-hour', 'power-converter', [['kw-to-amps', 'kW to amps'], ['kw-to-kva', 'kW to kVA']],
    'Is BTU/h the same as BTU?', 'No. BTU is an amount of energy and BTU/h is a rate, so it is power. Air-conditioner and heater ratings in BTU/h convert to kW with a fixed factor; a plain BTU converts to Wh or kWh instead.'),
  XD('kw-to-btu-per-hour', 'kW', 'BTU/h', 'power', 3.5, [0.5, 1, 2.5, 3.5, 5, 10], 'btu-per-hour-to-kw', 'power-converter', [['kw-to-amps', 'kW to amps'], ['kw-to-kwh', 'kW to kWh']],
    'Does the cooling power in kW equal the electrical power the air conditioner draws?', 'No. The cooling output is heat moved, not electricity used. The electrical input is the cooling output divided by the efficiency (COP or EER), so a unit with a COP above 1 draws less electrical kW than it moves.'),
  XD('tons-to-kw', 'TR', 'kW', 'power', 5, [1, 2, 5, 10, 50, 100], 'kw-to-tons', 'power-converter', [['kw-to-amps', 'kW to amps'], ['kw-to-kva', 'kW to kVA']],
    'What is a ton of refrigeration?', 'It is a cooling rate of 12,000 BTU/h, historically the heat absorbed by melting one ton of ice in a day. It is a unit of power, not weight, and it is thermal output rather than electrical input.'),
  XD('kw-to-tons', 'kW', 'TR', 'power', 17.5, [3.5, 7, 17.5, 35, 100, 350], 'tons-to-kw', 'power-converter', [['kw-to-amps', 'kW to amps'], ['kw-to-kva', 'kW to kVA']],
    'Which kW is this, thermal or electrical?', 'This converts a cooling (thermal) rate in kW to refrigeration tons. To size the electrical supply, divide the cooling kW by the equipment COP first, then use the kW to amps calculator.'),
  XD('wh-to-kwh', 'Wh', 'kWh', 'energy', 2500, [100, 500, 1000, 2500, 10000, 100000], 'kwh-to-wh', 'energy-converter', [['wh-to-kw', 'Wh to kW'], ['wh-to-watts', 'Wh to watts']],
    'Is converting Wh to kWh the same as converting Wh to kW?', 'No. Wh and kWh both measure energy, so the conversion is a fixed factor of 1,000. kW is power, so changing Wh to kW also needs the time in hours.'),
  XD('kwh-to-wh', 'kWh', 'Wh', 'energy', 2.5, [0.1, 0.5, 1, 2.5, 10, 100], 'wh-to-kwh', 'energy-converter', [['kwh-to-kw', 'kWh to kW'], ['kwh-to-watts', 'kWh to watts']],
    'Why do bills use kWh while batteries use Wh?', 'Household energy is large, so tariffs use kilowatt-hours. Batteries and small devices hold far less, so watt-hours give convenient numbers. One kWh is 1,000 Wh.'),
  XD('joules-to-kj', 'J', 'kJ', 'energy', 2500, [100, 500, 1000, 2500, 10000, 100000], 'kj-to-joules', 'energy-converter', [['joules-to-watts', 'Joules to watts'], ['watts-to-joules', 'Watts to joules']],
    'Can I convert joules to watts the same way?', 'No. Joules are energy and watts are power, which is energy per second. You need the time in seconds, so use the joules to watts calculator.'),
  XD('kj-to-joules', 'kJ', 'J', 'energy', 2.5, [0.1, 0.5, 1, 2.5, 10, 100], 'joules-to-kj', 'energy-converter', [['joules-to-watts', 'Joules to watts'], ['watts-to-joules', 'Watts to joules']],
    'Is a kilojoule the same as a kilocalorie?', 'No. A kilocalorie (the food Calorie) is about 4.19 kJ. The two are both energy units, so the conversion is a fixed factor, but kJ and kcal are not interchangeable.'),
  XD('kwh-to-btu', 'kWh', 'BTU', 'energy', 1, [0.1, 0.5, 1, 5, 10, 100], 'btu-to-kwh', 'energy-converter', [['kw-to-kwh', 'kW to kWh'], ['energy-cost', 'Energy cost']],
    'Why would I convert kWh to BTU?', 'Electricity is billed in kWh while gas, heating and cooling are often quoted in BTU, so the conversion lets you compare the energy content of the two.'),
  XD('btu-to-kwh', 'BTU', 'kWh', 'energy', 10000, [1000, 5000, 10000, 100000, 1000000], 'kwh-to-btu', 'energy-converter', [['kw-to-kwh', 'kW to kWh'], ['energy-cost', 'Energy cost']],
    'Is BTU the same as BTU/h?', 'No. BTU is energy and BTU/h is power. To turn a BTU/h rating into kW use the BTU/h to kW converter; to compare energy use over time, convert BTU to kWh as here.'),
  XD('volts-to-mv', 'V', 'mV', 'voltage', 0.5, [0.001, 0.01, 0.1, 0.5, 1, 5, 12], 'mv-to-volts', 'voltage-converter', [['volts-to-amps', 'Volts to amps'], ['volts-to-watts', 'Volts to watts']],
    'Where are millivolts used?', 'Sensor outputs, thermocouples and signal levels are quoted in millivolts. The conversion to volts is a fixed factor and does not depend on the current.'),
  XD('mv-to-volts', 'mV', 'V', 'voltage', 250, [1, 10, 100, 250, 500, 1000, 5000], 'volts-to-mv', 'voltage-converter', [['volts-to-amps', 'Volts to amps'], ['volts-to-watts', 'Volts to watts']],
    'Is a millivolt the same as a megavolt?', 'No. mV is one thousandth of a volt and MV is one million volts. The capitalisation matters, so check the data sheet before converting.'),
  XD('hz-to-khz', 'Hz', 'kHz', 'frequency', 2500, [50, 60, 1000, 2500, 20000, 100000], 'khz-to-hz', 'frequency-converter', [['kw-to-amps', 'kW to amps']],
    'Does the mains frequency matter for amps or watts?', 'For most resistive loads it does not. It matters for motors, transformers and capacitors, whose reactance and speed depend on the frequency, such as 50 Hz or 60 Hz supplies.'),
  XD('khz-to-hz', 'kHz', 'Hz', 'frequency', 2.5, [0.05, 0.06, 1, 2.5, 20, 100], 'hz-to-khz', 'frequency-converter', [['kw-to-amps', 'kW to amps']],
    'What frequency does a switching power supply run at?', 'Switching supplies typically run in the tens to hundreds of kHz, which is why their transformers and inductors are small compared with the 50 or 60 Hz equivalent.'),
  XD('mhz-to-hz', 'MHz', 'Hz', 'frequency', 100, [1, 10, 50, 100, 433, 2400], 'hz-to-mhz', 'frequency-converter', [['kw-to-amps', 'kW to amps']],
    'Is MHz the same as mHz?', 'No. MHz is megahertz (one million hertz) and mHz is millihertz (one thousandth of a hertz). They differ by a factor of one billion.'),
  XD('hz-to-mhz', 'Hz', 'MHz', 'frequency', 5000000, [100000, 1000000, 5000000, 10000000, 100000000], 'mhz-to-hz', 'frequency-converter', [['kw-to-amps', 'kW to amps']],
    'Why are radio and clock frequencies quoted in MHz?', 'Radio, crystal and processor clock frequencies are in the millions of hertz, so megahertz keeps the numbers short. The conversion to hertz is a fixed factor.')
);

const L2 = require('./converter_content_l2.js');
Object.assign(DIM_LABEL, L2.DIM_LABEL); Object.assign(NOTE, L2.NOTE);
CATS.forEach((c) => { c.group = c.group || 'electrical'; });
CATS.push(...L2.CATS); DIRS.push(...L2.DIRS);
const AFF = (dim) => !!(E.CONV_UNITS[dim] && E.CONV_UNITS[dim].affine);
const dimUnits = (dim) => (E.CONV_UNITS[dim] || E.UNITS[dim]).units;
const catOf = (slug) => CATS.find((c) => c.slug === slug);
const dirOf = (a, b) => DIRS.find((d) => d.from === a && d.to === b);
const factor = (dim, a, b) => dimUnits(dim)[a] / dimUnits(dim)[b];
const convert = (dim, v, a, b) => E.convertUnits(dim, v, a, b);
const baseView = (dim, u) => { const bv = BASEVIEW[dim], U = dimUnits(dim); return bv ? [U[u] * bv.mult, bv.unit] : [U[u], (E.CONV_UNITS[dim] || E.UNITS[dim]).base]; };

function build(H) {
  const { page, esc, FOOT, table, ldScript, APP_LD, FAQ_LD, faqHtml } = H, BASE = H.base || '';
  const url = (slug) => BASE + '/converters/' + slug + '.html';
  const head = () => '<header><div class="w"><a class="brand" href="../"><img src="../logo.png" alt="Elecmetric" width="160" height="40"></a><nav><a href="index.html">Conversion Centre</a><a href="../pages/index.html">All conversions</a><a href="../calculators/">Calculators</a></nav></div></header>';
  const ld = (h1, slug, desc, faq) => {
    if (!BASE) return '';
    const crumbs = [['Elecmetric', BASE + '/'], ['Conversion Centre', url('index')]].concat(slug === 'index' ? [] : [[h1, url(slug)]]);
    const bc = { '@type': 'BreadcrumbList', itemListElement: crumbs.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) };
    return ldScript({ '@context': 'https://schema.org', '@graph': [bc, APP_LD(h1, url(slug), desc)].concat(faq && faq.length ? [FAQ_LD(faq)] : []) });
  };
  const styleHead = '<style>button.btn{cursor:pointer;font:600 15px var(--body)}.swp{display:flex;align-items:flex-end}.cvr{margin-top:12px}</style>';

  /* The converter widget. Static markup already holds the default answer, so the page is correct before JavaScript runs. */
  function widget(cfg) {
    const dims = Object.keys(cfg.dims), d0 = cfg.dim0, [a0, b0] = cfg.dims[d0], units = E.unitsOf(d0);
    const opts = (list, pick) => list.map((u) => '<option value="' + esc(u) + '"' + (u === pick ? ' selected' : '') + '>' + esc(u) + '</option>').join('');
    const res = convert(d0, cfg.v, a0, b0);
    return '<section class="card" aria-label="Unit converter"><div class="tgrid">' +
      (dims.length > 1 ? '<div><label for="cv-q">Quantity</label><select id="cv-q">' + dims.map((d) => '<option value="' + d + '"' + (d === d0 ? ' selected' : '') + '>' + esc(DIM_LABEL[d]) + '</option>').join('') + '</select></div>' : '') +
      '<div><label for="cv-v">Value</label><div class="trow"><input id="cv-v" inputmode="decimal" autocomplete="off" value="' + esc(String(cfg.v)) + '"></div></div>' +
      '<div><label for="cv-f">From</label><select id="cv-f">' + opts(units, a0) + '</select></div>' +
      '<div class="swp"><button type="button" class="btn" id="cv-sw" aria-label="Swap from and to units">Swap</button></div>' +
      '<div><label for="cv-t">To</label><select id="cv-t">' + opts(units, b0) + '</select></div></div>' +
      '<div class="tres cvr" aria-live="polite"><div class="big"><small>Result</small><span id="cv-out">' + esc(convNum(res) + ' ' + b0) + '</span></div></div>' +
      '<p class="note" id="cv-fac">' + esc(AFF(d0) ? convNum(0) + ' ' + a0 + ' = ' + convNum(convert(d0, 0, a0, b0)) + ' ' + b0 + ' (scales with different zero points need a formula, not one factor)' : '1 ' + a0 + ' = ' + convNum(factor(d0, a0, b0)) + ' ' + b0) + '</p><p class="err" id="cv-err" role="status"></p></section>';
  }
  const script = (cfg) => '<script defer src="../engine.js"></script><script>' + convNum.toString() + '\n' + convInit.toString() + '\ndocument.addEventListener("DOMContentLoaded", function () { convInit(window.Engine,' + JSON.stringify(cfg).replace(/</g, '\\u003c') + ',document); });</script>';
  const unitTable = (dim, units) => AFF(dim) ? table(['Unit', 'Reference point', 'What it is'], units.map((u) => [u, L2.AFFINE_EQ[u], NOTE[u] || '']), undefined, DIM_LABEL[dim]) : table(['Unit', 'Equals', 'What it is'], units.map((u) => { const [v, b] = baseView(dim, u); return [u, convNum(v) + ' ' + b, NOTE[u] || '']; }), undefined, DIM_LABEL[dim]);
  const chip = (href, t) => '<a class="chip" href="' + href + '">' + esc(t) + '</a>';
  const meta = [], pages = {};

  /* ---- category converters ---- */
  CATS.forEach((c) => {
    c.dims.forEach((d) => E.unitsOf(d).forEach((u) => { if (!NOTE[u]) throw new Error(c.slug + ': no note for unit ' + u); }));
    const cfg = { dim0: c.dim, v: c.val, dims: {} };
    c.dims.forEach((d) => { cfg.dims[d] = c.def[d]; });
    const pairLis = c.pairs.map(([a, b]) => { const pd = c.dims.find((d) => E.unitsOf(d).indexOf(a) >= 0 && E.unitsOf(d).indexOf(b) >= 0) || c.dim, dd = dirOf(a, b), t = AFF(pd) ? L2.AFFINE_FORMULA[a + '>' + b][0] : '1 ' + a + ' = ' + convNum(factor(pd, a, b)) + ' ' + b; return '<li>' + (dd ? '<a href="' + dd.slug + '.html">' + esc(t) + '</a>' : esc(t)) + '</li>'; }).join('');
    const [fa, fb] = c.def[c.dim], ex = convert(c.dim, c.val, fa, fb);
    const aff = AFF(c.dim), AF = aff ? L2.AFFINE_FORMULA[fa + '>' + fb] : null;
    const faq = [[
      'What is the formula to convert ' + fa + ' to ' + fb + '?',
      (aff ? AF[0] : fb + ' = ' + fa + ' × ' + convNum(factor(c.dim, fa, fb))) + '. For example, ' + convNum(c.val) + ' ' + fa + ' is ' + convNum(ex) + ' ' + fb + '.'
    ], [
      'How do I convert ' + fb + ' back to ' + fa + '?',
      (aff ? AF[1] : fa + ' = ' + fb + ' × ' + convNum(factor(c.dim, fb, fa))) + '. The Swap button above reverses the direction for any pair of units.'
    ]].concat(c.faq);
    const unitsBlocks = c.dims.map((d) => (c.dims.length > 1 ? '<h2>' + esc(DIM_LABEL[d]) + ' units</h2>' : '') + unitTable(d, E.unitsOf(d))).join('');
    let react = '';
    if (c.reactance) {
      const r = c.reactance, rv = r.calc(r.val * dimUnits(c.dim)[r.unit], 50);
      react = '<h2>' + esc(r.name) + ' example</h2><div class="f">' + esc(r.formula) + '</div><p>At 50 Hz, ' + esc(convNum(r.val) + ' ' + r.unit) + ' gives ' + esc(r.symbol) + ' = ' + esc(convNum(Number(rv.toPrecision(5))) + ' Ω') + '. The size in farads or henries comes from the factor table above.</p>';
    }
    if (c.batteryEx) {
      const b = c.batteryEx, ah = convert('charge', b.q, b.qUnit, 'Ah'), wh = ah * b.v;
      react += '<h2>Capacity to energy example</h2><div class="f">Wh = Ah × V</div><p>' + esc(convNum(b.q) + ' ' + b.qUnit + ' is ' + convNum(ah) + ' Ah. At a nominal ' + convNum(b.v) + ' V that stores ' + convNum(Number(wh.toPrecision(10))) + ' Wh (' + convNum(Number((wh / 1000).toPrecision(10))) + ' kWh). The voltage is not part of the unit conversion; it is the second input the energy needs.') + '</p>';
    }
    const body = head() + '<main class="w"><h1>' + esc(c.h1) + '</h1><p class="lede">' + esc(c.lede) + '</p>' + widget(cfg) +
      '<h2>Common conversions</h2><ul>' + pairLis + '</ul>' +
      c.notes.map(([h, t]) => '<h2>' + esc(h) + '</h2><p>' + esc(t) + '</p>').join('') + react +
      (aff ? '<h2>Formulas</h2><div class="f">' + esc(['°C>°F', '°F>°C', '°C>K', 'K>°C'].map((k) => L2.AFFINE_FORMULA[k][0]).join('     ')) + '</div><h2>Scales and reference points</h2>' : '<h2>Unit factors</h2><p class="note">Every unit in terms of the base unit shown. To convert, multiply by the factor of the unit you have and divide by the factor of the unit you want.</p>') + unitsBlocks +
      (DIRS.some((d) => d.cat === c.slug) ? '<h2>Conversion pages</h2><p>' + DIRS.filter((d) => d.cat === c.slug).map((d) => chip(d.slug + '.html', d.from + ' to ' + d.to)).join('') + '</p>' : '') +
      faqHtml(faq) +
      '<h2>Related</h2><p>' + c.links.map(([s, t]) => chip('../pages/' + s + '.html', t)).join('') + chip('index.html', 'Conversion Centre') + CATS.filter((o) => o !== c).map((o) => chip(o.slug + '.html', o.h1)).join('') + '</p></main>' + FOOT('../');
    pages[c.slug + '.html'] = page(c.slug, c.h1, c.desc, body, ld(c.h1, c.slug, c.desc, faq) + styleHead, script(cfg), { url: BASE ? url(c.slug) : '', prefix: '../' });
    meta.push({ slug: c.slug, title: c.h1 + ' | Elecmetric', desc: c.desc, kind: 'category', dims: c.dims });
  });

  /* ---- direction pages ---- */
  const nameOf = (u) => u;
  const NAMES = { in: 'Inches', ft: 'Feet', m: 'Meters', lb: 'Pounds' };
  DIRS.forEach((d) => {
    const aff = AFF(d.dim), AF = aff ? L2.AFFINE_FORMULA[d.from + '>' + d.to] : null;
    const h1 = (NAMES[d.from] || d.from) + ' to ' + (NAMES[d.to] || d.to) + ' Converter', f = aff ? 0 : factor(d.dim, d.from, d.to), r = convert(d.dim, d.val, d.from, d.to);
    const desc = aff ? 'Convert ' + d.from + ' to ' + d.to + ': ' + AF[0] + '. Formula, worked example, table of common values and scale definitions.'
      : 'Convert ' + d.from + ' to ' + d.to + ': 1 ' + d.from + ' = ' + convNum(f) + ' ' + d.to + '. Formula, worked example, table of common values and unit definitions.';
    if (desc.length > 160) throw new Error(d.slug + ': description too long (' + desc.length + ')');
    [d.from, d.to].forEach((u) => { if (!NOTE[u]) throw new Error(d.slug + ': no note for ' + u); });
    const cfg = { dim0: d.dim, v: d.val, dims: { [d.dim]: [d.from, d.to] } };
    const cat = catOf(d.cat), rev = DIRS.find((x) => x.slug === d.rev);
    const faq = (aff ? [
      ['What is the formula to convert ' + d.from + ' to ' + d.to + '?', AF[0] + '. To go back, ' + AF[1] + '.']
    ] : [
      ['How many ' + d.to + ' are in one ' + d.from + '?', '1 ' + d.from + ' = ' + convNum(f) + ' ' + d.to + '.'],
      ['What is the formula to convert ' + d.from + ' to ' + d.to + '?', d.to + ' = ' + d.from + ' × ' + convNum(f) + '. To go back, ' + d.from + ' = ' + d.to + ' × ' + convNum(1 / f) + '.']
    ]).concat(d.faq);
    const body = head() + '<main class="w"><h1>' + esc(h1) + '</h1><p class="lede">' + esc(desc) + '</p>' + widget(cfg) +
      '<div class="card ans"><div>' + esc(convNum(d.val) + ' ' + d.from) + ' =</div><div class="big">' + esc(convNum(r) + ' ' + d.to) + '</div></div>' +
      '<h2>Formula</h2><div class="f">' + esc(aff ? AF[0] + '     ' + AF[1] : d.to + ' = ' + d.from + ' × ' + convNum(f) + '     ' + d.from + ' = ' + d.to + ' × ' + convNum(1 / f)) + '</div>' +
      '<h2>Worked example</h2><ol class="steps"><li>' + esc(aff ? AF[0] + ' with ' + convNum(d.val) + ' ' + d.from + ' gives ' + convNum(r) + ' ' + d.to : convNum(d.val) + ' ' + d.from + ' × ' + convNum(f) + ' = ' + convNum(r) + ' ' + d.to) + '</li></ol>' +
      '<h2>Common values</h2>' + table([d.from, d.to], d.vals.map((v) => [convNum(v), convNum(convert(d.dim, v, d.from, d.to))])) +
      '<h2>Unit definitions</h2>' + unitTable(d.dim, [d.from, d.to]) +
      faqHtml(faq) +
      '<h2>Related</h2><p>' + (rev ? 'Opposite direction: ' + chip(rev.slug + '.html', rev.from + ' to ' + rev.to) + '<br>' : '') + chip(cat.slug + '.html', cat.h1) + d.links.map(([s, t]) => chip('../pages/' + s + '.html', t)).join('') + chip('index.html', 'Conversion Centre') + '</p></main>' + FOOT('../');
    pages[d.slug + '.html'] = page(d.slug, h1, desc, body, ld(h1, d.slug, desc, faq) + styleHead, script(cfg), { url: BASE ? url(d.slug) : '', prefix: '../' });
    meta.push({ slug: d.slug, title: h1 + ' | Elecmetric', desc, kind: 'direction', from: d.from, to: d.to, dim: d.dim, rev: d.rev });
  });


  /* ---- number systems and scientific notation ---- */
  {
    const numScript = () => '<script>' + baseConvert.toString() + '\n' + sciNotation.toString() + '\n' + dmsToDec.toString() + '\n' + decToDms.toString() + '\n' + powerLevel.toString() + '\n' + dbRatio.toString() + '\n' + binaryCalc.toString() + '\n' + siPrefix.toString() + '\n' + numInit.toString() + '\nnumInit(document);</script>';
    const rowT = (rows) => table(['Form', 'Value'], rows);
    /* number base */
    {
      const slug = 'number-base-converter', h1 = 'Number Base Converter', desc = 'Convert whole numbers between binary, octal, decimal and hexadecimal, with a table of common values and notes on bits, bytes and register addresses.';
      const def = 255, out = (t) => baseConvert(String(def), 10, t).text;
      const nums = [0, 1, 2, 4, 8, 10, 15, 16, 32, 64, 100, 127, 128, 255, 256, 1000, 4095, 65535];
      const faq = [
        ['How do I convert binary to decimal?', 'Add the place values of each 1 bit. For 1011, that is 8 + 0 + 2 + 1 = 11. Select binary in the Base list above and the converter does it for you.'],
        ['How do I convert decimal to hexadecimal?', 'Divide by 16 repeatedly and read the remainders from last to first, using A to F for 10 to 15. For example, 255 gives 15 and 15, which is FF.'],
        ['Does it handle negative numbers and fractions?', 'It handles whole numbers with an optional minus sign. It does not show two\'s complement and does not convert fractions.']
      ];
      const body = head() + '<main class="w"><h1>' + esc(h1) + '</h1><p class="lede">' + esc(desc) + '</p>' +
        '<section class="card" aria-label="Number base converter"><div class="tgrid"><div><label for="nb-v">Value</label><div class="trow"><input id="nb-v" autocomplete="off" value="' + def + '"></div></div><div><label for="nb-b">Base of the value</label><select id="nb-b"><option value="2">Binary (2)</option><option value="8">Octal (8)</option><option value="10" selected>Decimal (10)</option><option value="16">Hexadecimal (16)</option></select></div></div>' +
        '<div class="tres cvr" aria-live="polite"><div class="big"><small>Binary</small><span id="nb-2">' + out(2) + '</span></div><div class="big"><small>Octal</small><span id="nb-8">' + out(8) + '</span></div><div class="big"><small>Decimal</small><span id="nb-10">' + out(10) + '</span></div><div class="big"><small>Hexadecimal</small><span id="nb-16">' + out(16) + '</span></div></div>' +
        '<p class="err" id="nm-err" role="status"></p></section>' +
        '<h2>Common values</h2>' + table(['Decimal', 'Binary', 'Octal', 'Hexadecimal'], nums.map((n) => [String(n), baseConvert(String(n), 10, 2).text, baseConvert(String(n), 10, 8).text, baseConvert(String(n), 10, 16).text])) +
        '<h2>Prefixes and digits</h2><p>Binary uses the digits 0 and 1 and is often written with the prefix 0b. Octal uses 0 to 7 and the prefix 0o. Hexadecimal uses 0 to 9 and A to F and the prefix 0x. The converter accepts these prefixes, spaces and underscores in the value.</p>' +
        '<h2>Why engineers use hexadecimal</h2><p>One hexadecimal digit stands for exactly four bits, so one byte is two hex digits. That is why register addresses, colour codes and protocol frames are written in hex. For example, 0xFF is 255, the largest value that fits in one byte.</p>' +
        faqHtml(faq) + '<h2>Related</h2><p>' + chip('scientific-notation-converter.html', 'Scientific Notation Converter') + chip('dms-converter.html', 'DMS to Decimal Degrees') + chip('dbm-converter.html', 'dBm to Watts') + chip('index.html', 'Conversion Centre') + '</p></main>' + FOOT('../');
      pages[slug + '.html'] = page(slug, h1, desc, body, ld(h1, slug, desc, faq) + styleHead, numScript(), { url: BASE ? url(slug) : '', prefix: '../' });
      meta.push({ slug, title: h1 + ' | Elecmetric', desc, kind: 'number' });
    }
    /* scientific notation */
    {
      const slug = 'scientific-notation-converter', h1 = 'Scientific Notation Converter', desc = 'Convert a number to scientific, engineering and E notation and plain decimal, with the SI prefix table and notes on significant figures.';
      const def = '0.000047', r = sciNotation(def);
      const PFX = [['T', 'tera', 12], ['G', 'giga', 9], ['M', 'mega', 6], ['k', 'kilo', 3], ['', '(none)', 0], ['m', 'milli', -3], ['µ', 'micro', -6], ['n', 'nano', -9], ['p', 'pico', -12]];
      const faq = [
        ['What is the difference between scientific and engineering notation?', 'Scientific notation puts one non-zero digit before the decimal point, as in 4.7 × 10⁻⁵. Engineering notation keeps the exponent a multiple of three, as in 47 × 10⁻⁶, so it lines up with the SI prefixes: 47 µ.'],
        ['What does 1.5e3 mean?', 'It is E notation, used by calculators and spreadsheets: 1.5 × 10³ = 1,500.']
      ];
      const body = head() + '<main class="w"><h1>' + esc(h1) + '</h1><p class="lede">' + esc(desc) + '</p>' +
        '<section class="card" aria-label="Scientific notation converter"><div class="tgrid"><div><label for="sn-v">Number</label><div class="trow"><input id="sn-v" inputmode="decimal" autocomplete="off" value="' + def + '"></div></div></div>' +
        '<div class="tres cvr" aria-live="polite"><div class="big"><small>Scientific</small><span id="sn-sci">' + esc(r.sci) + '</span></div><div class="big"><small>Engineering</small><span id="sn-eng">' + esc(r.eng) + '</span></div><div class="big"><small>E notation</small><span id="sn-e">' + esc(r.e) + '</span></div><div class="big"><small>Decimal</small><span id="sn-plain">' + esc(r.plain) + '</span></div></div>' +
        '<p class="err" id="nm-err" role="status"></p></section>' +
        '<h2>SI prefixes</h2>' + table(['Prefix', 'Symbol', 'Power of ten'], PFX.map(([sym, name, e]) => [name, sym || '—', e === 0 ? '10⁰ = 1' : '10' + String(e).split('').map((c) => ({ '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }[c])).join('')])) +
        '<h2>Significant figures</h2><p>The converter reads the number as a value, so trailing zeros you type are not kept. 1.200 shows as 1.2. If a measurement has a specific number of significant figures, record that separately.</p>' +
        '<h2>How to enter numbers</h2><p>Type a plain number (12345.6789), E notation (4.7e-5) or the form 4.7×10^-5. Commas and spaces are ignored.</p>' +
        faqHtml(faq) + '<h2>Related</h2><p>' + chip('number-base-converter.html', 'Number Base Converter') + chip('dms-converter.html', 'DMS to Decimal Degrees') + chip('dbm-converter.html', 'dBm to Watts') + chip('index.html', 'Conversion Centre') + '</p></main>' + FOOT('../');
      pages[slug + '.html'] = page(slug, h1, desc, body, ld(h1, slug, desc, faq) + styleHead, numScript(), { url: BASE ? url(slug) : '', prefix: '../' });
      meta.push({ slug, title: h1 + ' | Elecmetric', desc, kind: 'number' });
    }
    /* degrees, minutes, seconds */
    {
      const slug = 'dms-converter', h1 = 'DMS to Decimal Degrees Converter', desc = 'Convert degrees, minutes and seconds to decimal degrees and back, with the sign for south and west, a table of common values and the distance each unit covers.';
      const dDef = { d: 28, m: 33, s: 22.32 }, decDef = '28.5562', rd = dmsToDec(dDef.d, dDef.m, dDef.s, false), rr = decToDms(decDef);
      const faq = [
        ['How do I convert degrees, minutes and seconds to decimal degrees?', 'Divide the minutes by 60 and the seconds by 3,600, then add them to the degrees: decimal = D + M/60 + S/3600. For 28° 33′ 22.32″ that is 28 + 0.55 + 0.0062 = 28.5562°.'],
        ['How do I convert decimal degrees to degrees, minutes and seconds?', 'The whole number is the degrees. Multiply the fraction by 60: the whole part is the minutes. Multiply the new fraction by 60 to get the seconds. For 28.5562°, 0.5562 × 60 = 33.372, so 33′, and 0.372 × 60 = 22.32″.'],
        ['How do I show south and west?', 'Decimal degrees use a minus sign for south latitudes and west longitudes, so 33° 52′ 07.68″ S is −33.8688°. Choose the minus sign in the converter, or type a minus before the degrees.'],
        ['How many decimal places do I need?', 'Five decimal places is about 1.1 metres on the ground and six is about 0.11 metres. One arcsecond of latitude is about 30.9 metres.']
      ];
      const common = [0.1, 0.25, 0.5, 0.75, 1.5, 10.5, 28.5562, 45.123456, 90, -33.8688];
      const body = head() + '<main class="w"><h1>' + esc(h1) + '</h1><p class="lede">' + esc(desc) + '</p>' +
        '<section class="card" aria-label="Degrees minutes seconds to decimal degrees"><h2>DMS to decimal degrees</h2><div class="tgrid"><div><label for="dm-d">Degrees</label><div class="trow"><input id="dm-d" inputmode="decimal" autocomplete="off" value="' + dDef.d + '"></div></div><div><label for="dm-m">Minutes</label><div class="trow"><input id="dm-m" inputmode="decimal" autocomplete="off" value="' + dDef.m + '"></div></div><div><label for="dm-s">Seconds</label><div class="trow"><input id="dm-s" inputmode="decimal" autocomplete="off" value="' + dDef.s + '"></div></div><div><label for="dm-sg">Sign</label><select id="dm-sg"><option value="p" selected>Plus (north or east)</option><option value="n">Minus (south or west)</option></select></div></div>' +
        '<div class="tres cvr" aria-live="polite"><div class="big"><small>Decimal degrees</small><span id="dm-out">' + esc(String(rd.dec)) + '\u00b0</span></div></div></section>' +
        '<section class="card" aria-label="Decimal degrees to degrees minutes seconds"><h2>Decimal degrees to DMS</h2><div class="tgrid"><div><label for="dd-v">Decimal degrees</label><div class="trow"><input id="dd-v" inputmode="decimal" autocomplete="off" value="' + decDef + '"></div></div></div>' +
        '<div class="tres cvr" aria-live="polite"><div class="big"><small>Degrees, minutes, seconds</small><span id="dd-out">' + esc(rr.text) + '</span></div></div>' +
        '<p class="err" id="nm-err" role="status"></p></section>' +
        '<h2>Common values</h2>' + table(['Decimal degrees', 'Degrees, minutes, seconds'], common.map((x) => [String(x) + '\u00b0', decToDms(String(x)).text])) +
        '<h2>How far is a degree, a minute and a second?</h2>' + table(['Unit', 'Distance along a meridian (latitude)'], [['1 degree', 'about 111 km'], ['1 arcminute', 'about 1.852 km, one nautical mile'], ['1 arcsecond', 'about 30.9 m'], ['0.00001 degree (5th decimal)', 'about 1.1 m']]) +
        '<p>Degrees of longitude cover less ground away from the equator: the distance shrinks with the cosine of the latitude.</p>' +
        '<h2>Survey and airfield coordinates</h2><p>Aerodrome and survey coordinates are often listed in degrees, minutes and seconds on charts and data sheets, while GIS tools, spreadsheets and GPS units use decimal degrees. Check the datum (WGS-84 is the usual reference) and the sign convention before moving coordinates between systems.</p>' +
        '<h2>Related</h2><p>' + chip('angle-converter.html', 'Angle Converter') + chip('dbm-converter.html', 'dBm to Watts') + chip('number-base-converter.html', 'Number Base Converter') + chip('index.html', 'Conversion Centre') + '</p>' +
        faqHtml(faq) + '</main>' + FOOT('../');
      pages[slug + '.html'] = page(slug, h1, desc, body, ld(h1, slug, desc, faq) + styleHead, numScript(), { url: BASE ? url(slug) : '', prefix: '../' });
      meta.push({ slug, title: h1 + ' | Elecmetric', desc, kind: 'number' });
    }
    /* power level: dBm and dBW */
    {
      const slug = 'dbm-converter', h1 = 'dBm to Watts Converter', desc = 'Convert dBm, dBW, watts, milliwatts and kilowatts to each other, with a table of common levels and the formulas, for RF, antenna and signal power.';
      const def = '30', r = powerLevel(def, 'dBm');
      const faq = [
        ['How do I convert dBm to watts?', 'P (W) = 10^(dBm / 10) ÷ 1000. 30 dBm is 10³ mW, which is 1 W. 0 dBm is 1 mW.'],
        ['How do I convert watts to dBm?', 'dBm = 10 × log10(P in mW). A power of 1 W is 1,000 mW, so it is 30 dBm. For dBW, use the power in watts directly: dBW = 10 × log10(P in W).'],
        ['What is the difference between dBm and dBW?', 'They differ only in the reference power. dBm is relative to 1 milliwatt and dBW is relative to 1 watt, so dBW = dBm − 30.'],
        ['Why does 3 dB mean double the power?', 'A change of 3 dB is a power ratio of 10^(3/10), about 1.995, so very nearly 2. Adding 10 dB multiplies the power by 10, and every 3 dB multiplies it by about 2.']
      ];
      const common = [-30, -10, 0, 3, 10, 20, 30, 40, 50, 60];
      const body = head() + '<main class="w"><h1>' + esc(h1) + '</h1><p class="lede">' + esc(desc) + '</p>' +
        '<section class="card" aria-label="dBm to watts converter"><div class="tgrid"><div><label for="pl-v">Value</label><div class="trow"><input id="pl-v" inputmode="decimal" autocomplete="off" value="' + def + '"></div></div><div><label for="pl-u">Unit of the value</label><select id="pl-u"><option value="W">W</option><option value="mW">mW</option><option value="kW">kW</option><option value="dBm" selected>dBm</option><option value="dBW">dBW</option></select></div></div>' +
        '<div class="tres cvr" aria-live="polite"><div class="big"><small>Watts</small><span id="pl-W">' + esc(r.tW) + '</span></div><div class="big"><small>Milliwatts</small><span id="pl-mW">' + esc(r.tmW) + '</span></div><div class="big"><small>Kilowatts</small><span id="pl-kW">' + esc(r.tkW) + '</span></div><div class="big"><small>dBm</small><span id="pl-dBm">' + esc(r.tdBm) + '</span></div><div class="big"><small>dBW</small><span id="pl-dBW">' + esc(r.tdBW) + '</span></div></div>' +
        '<p class="err" id="nm-err" role="status"></p></section>' +
        '<h2>Common levels</h2>' + table(['dBm', 'Milliwatts', 'Watts', 'dBW'], common.map((x) => { const q = powerLevel(String(x), 'dBm'); return [String(x), q.tmW, q.tW, q.tdBW]; })) +
        '<h2>Formulas</h2><p>dBm = 10 × log10(P in mW)<br>dBW = 10 × log10(P in W)<br>P in W = 10^(dBm / 10) ÷ 1000<br>dBW = dBm − 30</p>' +
        '<h2>Why a logarithmic scale</h2><p>Signal and antenna powers span many orders of magnitude, so a logarithmic scale keeps the numbers short, and gains and losses add and subtract. A 20 dB amplifier followed by a 6 dB cable loss is a net 14 dB. The decibel is a ratio, so a level in dBm or dBW always refers to a stated power.</p>' +
        '<h2>Power ratio and voltage ratio</h2><p>For power the decibel is 10 × log10 of the power ratio. For voltage or current across the same impedance it is 20 × log10 of the ratio, because power goes with the square. This page converts power levels only.</p>' +
        '<h2>Related</h2><p>' + chip('db-converter.html', 'dB to Ratio') + chip('dms-converter.html', 'DMS to Decimal Degrees') + chip('scientific-notation-converter.html', 'Scientific Notation Converter') + chip('power-converter.html', 'Power Converter') + chip('index.html', 'Conversion Centre') + '</p>' +
        faqHtml(faq) + '</main>' + FOOT('../');
      pages[slug + '.html'] = page(slug, h1, desc, body, ld(h1, slug, desc, faq) + styleHead, numScript(), { url: BASE ? url(slug) : '', prefix: '../' });
      meta.push({ slug, title: h1 + ' | Elecmetric', desc, kind: 'number' });
    }
    /* decibel ratio: dB, power ratio and voltage ratio */
    {
      const slug = 'db-converter', h1 = 'dB to Ratio Converter', desc = 'Convert decibels to a power ratio and a voltage ratio, and back, with a table of common values and the 10 log and 20 log formulas.';
      const def = '3', r = dbRatio(def, 'dB');
      const faq = [
        ['How do I convert dB to a power ratio?', 'Power ratio = 10^(dB / 10). 3 dB is a ratio of about 2, 10 dB is 10 and 20 dB is 100. A negative dB is a ratio below 1, so -3 dB is about one half.'],
        ['How do I convert dB to a voltage ratio?', 'Voltage ratio = 10^(dB / 20). It uses 20 instead of 10 because power goes with the square of voltage or current across the same impedance. 6 dB is a voltage ratio of about 2 and 20 dB is 10.'],
        ['Why is 3 dB double the power but 6 dB double the voltage?', 'Doubling the power is 10 × log10(2) = 3.01 dB. Doubling the voltage quadruples the power across the same impedance, which is 10 × log10(4) = 6.02 dB, the same as 20 × log10(2).'],
        ['Is dB the same as dBm?', 'No. dB is a ratio between two powers, so it has no reference. dBm is a power level compared with 1 mW. Use the dBm to watts converter to turn a dBm level into watts.']
      ];
      const common = [-20, -10, -6, -3, 0, 3, 6, 10, 20, 30, 40];
      const body = head() + '<main class="w"><h1>' + esc(h1) + '</h1><p class="lede">' + esc(desc) + '</p>' +
        '<section class="card" aria-label="dB to ratio converter"><div class="tgrid"><div><label for="db-v">Value</label><div class="trow"><input id="db-v" inputmode="decimal" autocomplete="off" value="' + def + '"></div></div><div><label for="db-u">Unit of the value</label><select id="db-u"><option value="dB" selected>dB</option><option value="power">Power ratio</option><option value="amplitude">Voltage or current ratio</option></select></div></div>' +
        '<div class="tres cvr" aria-live="polite"><div class="big"><small>dB</small><span id="db-dB">' + esc(r.tdB) + '</span></div><div class="big"><small>Power ratio</small><span id="db-P">' + esc(r.tP) + '</span></div><div class="big"><small>Voltage or current ratio</small><span id="db-A">' + esc(r.tA) + '</span></div></div>' +
        '<p class="err" id="nm-err" role="status"></p></section>' +
        '<h2>Common values</h2>' + table(['dB', 'Power ratio', 'Voltage ratio'], common.map((x) => { const q = dbRatio(String(x), 'dB'); return [String(x), q.tP, q.tA]; })) +
        '<h2>Formulas</h2><p>dB = 10 × log10(power ratio)<br>dB = 20 × log10(voltage ratio)<br>power ratio = 10^(dB / 10)<br>voltage ratio = 10^(dB / 20)</p>' +
        '<h2>When to use 10 and when to use 20</h2><p>Use 10 × log10 for power. Use 20 × log10 for voltage, current or sound pressure when both values are across the same impedance, because power goes with the square. A level in dB always compares two quantities of the same kind. A gain of 20 dB is a power ratio of 100 and a voltage ratio of 10.</p>' +
        '<h2>Related</h2><p>' + chip('dbm-converter.html', 'dBm to Watts') + chip('ratio-converter.html', 'Percent and PPM Converter') + chip('power-converter.html', 'Power Converter') + chip('index.html', 'Conversion Centre') + '</p>' +
        faqHtml(faq) + '</main>' + FOOT('../');
      pages[slug + '.html'] = page(slug, h1, desc, body, ld(h1, slug, desc, faq) + styleHead, numScript(), { url: BASE ? url(slug) : '', prefix: '../' });
      meta.push({ slug, title: h1 + ' | Elecmetric', desc, kind: 'number' });
    }
    /* binary calculator: add, subtract, multiply, divide and bitwise operations in binary, octal, decimal or hexadecimal */
    {
      const slug = 'binary-calculator', h1 = 'Binary Calculator', desc = 'Add, subtract, multiply, divide, AND, OR, XOR and shift binary, octal, decimal or hexadecimal numbers, with the answer in all four bases.';
      const dA = '1011', dB = '110', r = binaryCalc(dA, dB, 2, 'add');
      const OPS = [['add', 'A + B (add)'], ['sub', 'A − B (subtract)'], ['mul', 'A × B (multiply)'], ['div', 'A ÷ B (divide, whole quotient and remainder)'], ['and', 'A AND B (bitwise)'], ['or', 'A OR B (bitwise)'], ['xor', 'A XOR B (bitwise)'], ['shl', 'A << B (shift left by B bits)'], ['shr', 'A >> B (shift right by B bits)']];
      const ex = [['1011 + 110', '2', 'add', '1011', '110'], ['1111 0000 AND 1010 1010', '2', 'and', '11110000', '10101010'], ['FF − 0F', '16', 'sub', 'FF', '0F'], ['1000 ÷ 7', '10', 'div', '1000', '7'], ['1 << 8', '10', 'shl', '1', '8']].map(([lbl, bs, op, a, b]) => { const q = binaryCalc(a, b, Number(bs), op); return [lbl, bs === '2' ? 'binary' : bs === '16' ? 'hexadecimal' : 'decimal', q.bin, q.dec, q.hex]; });
      const faq = [
        ['How do I add binary numbers?', 'Add column by column from the right, as in decimal, but 1 + 1 = 10: write 0 and carry 1. For 1011 + 110, the columns give 1 + 0 = 1, 1 + 1 = 0 carry 1, 0 + 1 + 1 = 0 carry 1, 1 + 1 = 0 carry 1 and a final 1, which is 10001 (decimal 17).'],
        ['What do AND, OR and XOR do?', 'They work on each bit position separately. AND gives 1 only if both bits are 1, OR gives 1 if either bit is 1, and XOR gives 1 if exactly one of the two bits is 1. Masks and flag tests in registers use AND and OR; XOR toggles bits.'],
        ['What does a shift do?', 'Shifting left by one bit position doubles the number and shifting right halves it, dropping the lowest bit. Shifting left by 8 multiplies by 256, which is moving a value up one byte.'],
        ['Does it handle negative numbers and two\'s complement?', 'Add, subtract, multiply and divide accept a minus sign and show a signed answer such as -1010. It does not show two\'s complement bit patterns, and AND, OR, XOR and shifts need non-negative numbers.'],
        ['How big can the numbers be?', 'Up to 200 digits in each entry. The arithmetic is exact, with no rounding, because it uses whole-number (BigInt) arithmetic rather than floating point.']
      ];
      const opt = (v, t, sel) => '<option value="' + v + '"' + (sel ? ' selected' : '') + '>' + t + '</option>';
      const body = head() + '<main class="w"><h1>' + esc(h1) + '</h1><p class="lede">' + esc(desc) + '</p>' +
        '<section class="card" aria-label="Binary calculator"><div class="tgrid"><div><label for="bc-a">Number A</label><div class="trow"><input id="bc-a" autocomplete="off" value="' + dA + '"></div></div>' +
        '<div><label for="bc-op">Operation</label><select id="bc-op">' + OPS.map(([v, t]) => opt(v, esc(t), v === 'add')).join('') + '</select></div>' +
        '<div><label for="bc-b">Number B (the shift count for << and >>)</label><div class="trow"><input id="bc-b" autocomplete="off" value="' + dB + '"></div></div>' +
        '<div><label for="bc-base">Base of A and B</label><select id="bc-base">' + opt('2', 'Binary (2)', true) + opt('8', 'Octal (8)') + opt('10', 'Decimal (10)') + opt('16', 'Hexadecimal (16)') + '</select></div></div>' +
        '<div class="tres cvr" aria-live="polite"><div class="big"><small>Binary</small><span id="bc-2">' + r.binG + '</span></div><div class="big"><small>Octal</small><span id="bc-8">' + r.oct + '</span></div><div class="big"><small>Decimal</small><span id="bc-10">' + r.dec + '</span></div><div class="big"><small>Hexadecimal</small><span id="bc-16">' + r.hex + '</span></div><div class="big"><small>Bits in the answer</small><span id="bc-bits">' + r.bits + '</span></div><div class="big"><small>Remainder (divide only)</small><span id="bc-x">' + esc(r.rem) + '</span></div></div>' +
        '<p class="err" id="nm-err" role="status"></p></section>' +
        '<h2>Worked examples</h2>' + table(['Sum', 'Entered in', 'Binary', 'Decimal', 'Hexadecimal'], ex) +
        '<h2>Binary arithmetic rules</h2><p>Addition: 0 + 0 = 0, 0 + 1 = 1, 1 + 1 = 10 (write 0, carry 1). Subtraction borrows from the next column: 10 − 1 = 1. Multiplication is shifted copies of A added together, one for each 1 bit in B. Division is repeated subtraction with a whole quotient and a remainder.</p>' +
        '<h2>Bitwise operations</h2>' + table(['A', 'B', 'A AND B', 'A OR B', 'A XOR B'], [['0', '0', '0', '0', '0'], ['0', '1', '0', '1', '1'], ['1', '0', '0', '1', '1'], ['1', '1', '1', '1', '0']]) +
        '<h2>Where engineers use it</h2><p>Register masks, status flags and protocol frames in PLCs, meters and relays are written in binary or hexadecimal. A mask such as 0x0F keeps the low four bits of a byte, which is an AND with 00001111, and a status word is tested bit by bit the same way.</p>' +
        faqHtml(faq) + '<h2>Related</h2><p>' + chip('number-base-converter.html', 'Number Base Converter') + chip('scientific-notation-converter.html', 'Scientific Notation Converter') + chip('si-prefix-converter.html', 'SI Prefix Converter') + chip('../calculators/scientific-calculator/', 'Scientific Calculator') + chip('index.html', 'Conversion Centre') + '</p></main>' + FOOT('../');
      pages[slug + '.html'] = page(slug, h1, desc, body, ld(h1, slug, desc, faq) + styleHead, numScript(), { url: BASE ? url(slug) : '', prefix: '../' });
      meta.push({ slug, title: h1 + ' | Elecmetric', desc, kind: 'number' });
    }
    /* SI prefix converter: engineering prefixes tera to femto */
    {
      const slug = 'si-prefix-converter', h1 = 'SI Prefix Converter', desc = 'Convert a value between SI prefixes, such as nF to µF, kΩ to MΩ or mA to A, with engineering notation, the prefix table and the best-fit prefix.';
      const PFX = [[12, 'T', 'tera'], [9, 'G', 'giga'], [6, 'M', 'mega'], [3, 'k', 'kilo'], [0, '', 'no prefix (base unit)'], [-3, 'm', 'milli'], [-6, 'µ', 'micro'], [-9, 'n', 'nano'], [-12, 'p', 'pico'], [-15, 'f', 'femto']];
      const dV = '4700', dF = -9, dT = -6, r = siPrefix(dV, dF, dT);
      const sup = (e) => String(e).split('').map((c) => ({ '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }[c])).join('');
      const opt = (e, sel) => { const p = PFX.find((x) => x[0] === e); return '<option value="' + e + '"' + (sel ? ' selected' : '') + '>' + esc(p[2] + (p[1] ? ' (' + p[1] + ')' : '') + ', 10' + sup(e)) + '</option>'; };
      const faq = [
        ['How do I convert nF to µF?', 'Divide by 1,000: 1 µF = 1,000 nF. So 4,700 nF = 4.7 µF. Going the other way, multiply by 1,000.'],
        ['What is the difference between m and M?', 'A lowercase m is milli (one thousandth) and a capital M is mega (one million). They are a factor of a billion apart, so 1 mΩ is a thousandth of an ohm and 1 MΩ is a million ohms. Keep the case exactly as written on the label.'],
        ['Why does the answer show µ and not u?', 'The SI symbol for micro is the Greek letter µ. Data sheets and keyboards often write it as u, as in 4.7uF, and it means the same thing.'],
        ['What is engineering notation?', 'Scientific notation with the exponent kept to a multiple of three, so it lines up with the prefixes: 4.7 × 10⁻⁶ F is 4.7 µF. The best-fit result picks the prefix that leaves a number from 1 to 999.']
      ];
      const common = [['4700 nF', 'µF', '4.7'], ['0.0000047 F', 'µF', '4.7'], ['2200 µF', 'mF', '2.2'], ['4.7 kΩ', 'Ω', '4700'], ['1 MΩ', 'kΩ', '1000'], ['250 mA', 'A', '0.25'], ['33 pF', 'nF', '0.033'], ['0.5 GHz', 'MHz', '500']];
      const body = head() + '<main class="w"><h1>' + esc(h1) + '</h1><p class="lede">' + esc(desc) + '</p>' +
        '<section class="card" aria-label="SI prefix converter"><div class="tgrid"><div><label for="sp-v">Value</label><div class="trow"><input id="sp-v" inputmode="decimal" autocomplete="off" value="' + dV + '"></div></div>' +
        '<div><label for="sp-f">From prefix</label><select id="sp-f">' + PFX.map((p) => opt(p[0], p[0] === dF)).join('') + '</select></div>' +
        '<div><label for="sp-t">To prefix</label><select id="sp-t">' + PFX.map((p) => opt(p[0], p[0] === dT)).join('') + '</select></div></div>' +
        '<div class="tres cvr" aria-live="polite"><div class="big"><small>Converted value</small><span id="sp-out">' + esc(r.text) + '</span></div><div class="big"><small>E notation</small><span id="sp-e">' + esc(r.e) + '</span></div><div class="big"><small>Best-fit prefix</small><span id="sp-best">' + esc(r.best) + '</span></div></div>' +
        '<p class="err" id="nm-err" role="status"></p></section>' +
        '<h2>SI prefixes</h2>' + table(['Prefix', 'Symbol', 'Power of ten', 'Factor'], PFX.map(([e, sym, name]) => [name, sym || '—', e === 0 ? '10⁰' : '10' + sup(e), e === 0 ? '1' : (e > 0 ? '1' + new Array(e + 1).join('0').replace(/\B(?=(000)+$)/g, ',') : '0.' + new Array(-e).join('0') + '1')])) +
        '<h2>Common conversions</h2>' + table(['Value', 'In', 'Result'], common) +
        '<h2>How to convert</h2><p>Subtract the powers of ten: the value in the new prefix is the old value × 10^(from − to). From nano (−9) to micro (−6) that is 10⁻³, so 4,700 nF = 4.7 µF. Each step of three in the exponent moves the decimal point three places.</p>' +
        '<h2>Prefix case matters</h2><p>m is milli and M is mega; k is kilo and K is not an SI prefix; p is pico and P is peta. The prefix goes in front of the unit symbol with no space or dot, as in kΩ, µF and mA.</p>' +
        faqHtml(faq) + '<h2>Related</h2><p>' + chip('scientific-notation-converter.html', 'Scientific Notation Converter') + chip('capacitance-converter.html', 'Capacitance Converter') + chip('resistance-converter.html', 'Resistance Converter') + chip('binary-calculator.html', 'Binary Calculator') + chip('index.html', 'Conversion Centre') + '</p></main>' + FOOT('../');
      pages[slug + '.html'] = page(slug, h1, desc, body, ld(h1, slug, desc, faq) + styleHead, numScript(), { url: BASE ? url(slug) : '', prefix: '../' });
      meta.push({ slug, title: h1 + ' | Elecmetric', desc, kind: 'number' });
    }
  }

  /* ---- wire gauge converter: AWG and SWG tables from the engine ---- */
  {
    const slug = 'wire-gauge-converter', h1 = 'AWG and SWG Wire Gauge Converter', desc = 'AWG and SWG wire gauge tables in mm, inches and mm², with the nearest AWG for each SWG size and a note on why the two systems differ.';
    const faq = [
      ['Is SWG the same as AWG?', 'No. The same number gives a different wire. SWG 18 is 1.219 mm across and AWG 18 is 1.024 mm. Always state which system a drawing or order uses.'],
      ['How is AWG calculated and SWG found?', 'AWG follows a formula: d = 0.127 mm × 92^((36 − n) / 39). SWG is a published table of diameters in inches, so it has no formula.'],
      ['Which is used for cables?', 'IEC cable sizes are in mm². AWG is used in North American practice and SWG in older British and Commonwealth wire and winding data.']
    ];
    const fm = (x, p) => E.fmt(x, p).replace(/,/g, '');
    const awgRows = E.awgChart().map((r) => [r.label, fm(r.dMm, 3), fm(r.dIn, 4), fm(r.AMm2, 3), fm(r.ohmPerKm, 2)]);
    const swgRows = E.swgChart().map((r) => [r.label, fm(r.dMm, 3), fm(r.dIn, 4), fm(r.AMm2, 4), r.awg || 'outside AWG 0000 to 40']);
    const body = head() + '<main class="w"><h1>' + esc(h1) + '</h1><p class="lede">' + esc(desc) + '</p>' +
      '<h2>AWG chart</h2><p>American Wire Gauge, 0000 to 40, calculated from the AWG definition. Resistance is annealed copper at 20 °C.</p>' + table(['AWG', 'Diameter (mm)', 'Diameter (in)', 'Area (mm²)', 'Resistance (Ω/km)'], awgRows) +
      '<h2>SWG chart</h2><p>Imperial Standard Wire Gauge, 7/0 to 50, from the published diameter table. Check the values against your own edition of the standard before relying on them for an order.</p>' + table(['SWG', 'Diameter (mm)', 'Diameter (in)', 'Area (mm²)', 'Nearest AWG by area'], swgRows) +
      '<h2>SWG and AWG are different systems</h2><p>Both count sizes with a number, and a higher number is a thinner wire, but the diameters are not the same. Do not swap one for the other without checking the table.</p>' +
      faqHtml(faq) + '<h2>Related</h2><p>' + chip('length-converter.html', 'Length Converter') + chip('area-converter.html', 'Area Converter') + chip('../pages/wire-gauge.html', 'AWG to mm² calculator') + chip('index.html', 'Conversion Centre') + '</p></main>' + FOOT('../');
    pages[slug + '.html'] = page(slug, h1, desc, body, ld(h1, slug, desc, faq) + styleHead, '', { url: BASE ? url(slug) : '', prefix: '../' });
    meta.push({ slug, title: h1 + ' | Elecmetric', desc, kind: 'gauge' });
  }

  /* ---- reference pages and numeric worked examples (tools/build_reference.js) ---- */
  const REF = require('./build_reference.js').build({ esc, FOOT, table, faqHtml, head, ld, styleHead, chip, url, BASE, convNum, page });
  Object.assign(pages, REF.pages); REF.meta.forEach((m) => meta.push(m));

  /* ---- hub with the universal converter ---- */
  {
    const dims = ['power', 'apparent', 'reactive', 'voltage', 'current', 'resistance', 'energy', 'frequency', 'capacitance', 'inductance', 'length', 'area', 'volume', 'mass', 'force', 'torque', 'pressure', 'temperature', 'flow', 'bfield', 'illuminance', 'luminance', 'intensity', 'density', 'rotation', 'thermcond', 'tempdiff', 'specheat'];
    const cfg = { dim0: 'power', v: 1, dims: {} };
    const DEF = { power: ['kW', 'W'], apparent: ['kVA', 'VA'], reactive: ['kVAR', 'VAR'], voltage: ['kV', 'V'], current: ['A', 'mA'], resistance: ['kΩ', 'Ω'], energy: ['kWh', 'J'], frequency: ['kHz', 'Hz'], capacitance: ['µF', 'nF'], inductance: ['mH', 'µH'], length: ['mm', 'in'], area: ['m²', 'ft²'], volume: ['L', 'gal'], mass: ['kg', 'lb'], force: ['kN', 'N'], torque: ['N·m', 'lbf·ft'], pressure: ['bar', 'psi'], temperature: ['°C', '°F'], flow: ['m³/h', 'CFM'], bfield: ['µT', 'mG'], illuminance: ['lx', 'fc'], luminance: ['cd/m²', 'fL'], intensity: ['kcd', 'cd'], density: ['kg/m³', 'lb/ft³'], rotation: ['rpm', 'rad/s'], thermcond: ['W/(m·K)', 'BTU/(h·ft·°F)'], tempdiff: ['Δ°C', 'Δ°F'], specheat: ['kJ/(kg·K)', 'BTU/(lb·°F)'] };
    dims.forEach((d) => { cfg.dims[d] = DEF[d]; });
    const h1 = 'Conversion Centre', faq = [
      ['Can I convert amps to kW with a unit converter?', 'No. Amps measure current and kW measures power. Going from one to the other needs the voltage and, for AC, the power factor and number of phases. The Elecmetric amps to kW calculator covers DC, single-phase and three-phase.'],
      ['Why does the converter keep kW, kVA and kVAR apart?', 'They are different quantities: real, apparent and reactive power. A fixed factor between them would be wrong. kVA to kW depends on the power factor of the load.'],
      ['Where do the conversion factors come from?', 'From the unit table in the Elecmetric engine, the same table the calculators use. It is checked against separately coded factors in the test suite.']
    ];
    const desc = 'Convert electrical and engineering units: power, energy, voltage, current, length, pressure, temperature, mass, torque, flow and more, with formulas and notes.';
    const GROUPS = [['electrical', 'Electrical units'], ['general', 'General engineering units'], ['advanced', 'Advanced engineering units']];
    const li = (c) => '<li><a href="' + c.slug + '.html">' + esc(c.h1) + '</a>: ' + esc(c.dims.map((d) => DIM_LABEL[d].replace(/ \(.*\)$/, '').toLowerCase()).join(', ')) + '</li>';
    const catList = GROUPS.map(([g, t]) => '<p><strong>' + esc(t) + '</strong></p><ul>' + CATS.filter((c) => c.group === g).map(li).join('') + '</ul>').join('') + '<p><strong>Numbers</strong></p><ul><li><a href="number-base-converter.html">Number Base Converter</a>: binary, octal, decimal and hexadecimal</li><li><a href="wire-gauge-converter.html">AWG and SWG Wire Gauge Converter</a>: AWG and SWG sizes in mm, inches and mm²</li><li><a href="scientific-notation-converter.html">Scientific Notation Converter</a>: decimal, scientific, engineering and E notation</li><li><a href="dms-converter.html">DMS to Decimal Degrees Converter</a>: degrees, minutes and seconds to decimal degrees</li><li><a href="dbm-converter.html">dBm to Watts Converter</a>: dBm, dBW, watts, milliwatts and kilowatts</li><li><a href="db-converter.html">dB to Ratio Converter</a>: decibels to power ratio and voltage ratio</li><li><a href="binary-calculator.html">Binary Calculator</a>: add, subtract, multiply, divide, AND, OR, XOR and shift in any of the four bases</li><li><a href="si-prefix-converter.html">SI Prefix Converter</a>: nF to µF, kΩ to MΩ and other prefix changes</li></ul>' +
      '<p><strong>Reference</strong></p><ul>' + REF.meta.filter((m) => m.kind === 'reference').map((m) => '<li><a href="' + m.slug + '.html">' + esc(m.title.replace(/ \| Elecmetric$/, '')) + '</a></li>').join('') + '</ul>' +
      '<p><strong>Watts to amps and amps to watts</strong></p><p>' + REF.meta.filter((m) => m.kind === 'example').map((m) => chip(m.slug + '.html', m.title.replace(/ \| Elecmetric$/, ''))).join('') + '</p>';
    const body = head() + '<main class="w"><h1>' + esc(h1) + '</h1><p class="lede">Convert electrical and engineering units with the factor shown. Each quantity converts only within itself, because turning amps into kW or kVA into kW is a calculation, not a unit change.</p>' + widget(cfg) +
      '<h2>Converters by quantity</h2>' + catList +
      '<h2>Popular conversions</h2><p>' + DIRS.map((d) => chip(d.slug + '.html', d.from + ' to ' + d.to)).join('') + '</p>' +
      '<h2>When a unit converter is not enough</h2><p>These need more than a factor, so they have their own calculators with the formula and working shown.</p><p>' +
      [['amps-to-kw', 'Amps to kW'], ['kva-to-kw', 'kVA to kW'], ['kw-to-kwh', 'kW to kWh'], ['mah-to-wh', 'mAh to Wh'], ['wire-gauge', 'AWG and mm²']].map(([s, t]) => chip('../pages/' + s + '.html', t)).join('') + '</p>' +
      faqHtml(faq) +
      '<h2>Related</h2><p>' + chip('../pages/index.html', 'All electrical conversions') + chip('../calculators/', 'Engineering calculators') + '</p></main>' + FOOT('../');
    pages['index.html'] = page('index', h1, desc, body, ld(h1, 'index', desc, faq) + styleHead, script(cfg), { url: BASE ? url('index') : '', prefix: '../' });
    meta.push({ slug: 'index', title: h1 + ' | Elecmetric', desc, kind: 'hub', dims });
  }
  return { pages, meta, slugs: Object.keys(pages).map((f) => f.replace(/\.html$/, '')) };
}

module.exports = { build, baseConvert, sciNotation, dmsToDec, decToDms, powerLevel, dbRatio, binaryCalc, siPrefix, numInit, convNum, convInit, CATS, DIRS, DIM_LABEL, NOTE };
