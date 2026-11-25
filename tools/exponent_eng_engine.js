/* Elecmetric Exponent Calculator, Mode 05: Engineering Powers & Scientific Notation. Engine: one file, no DOM.
   Required by tests/exponent_eng_test.js and inlined into calculators/engineering-powers-scientific-notation/index.html by tools/exponent_eng_page.js.
   Stands alone: it does not use the Mode 01 to 04 engines.

   Ten calculations in two groups (CEO brief, Mode 05):
     Notation and powers of ten
       notation   a number to scientific notation, engineering notation, E notation, plain decimal and its SI prefix
       power10    c x 10^n for a whole-number exponent n (the powers of ten and their SI prefixes)
       prefix     a value from one SI prefix to another, or to the best engineering prefix
     Exponential engineering functions
       rc_charge     V(t) = Vs (1 - e^(-t/RC))        rc_discharge  V(t) = V0 e^(-t/RC)
       rl_rise       I(t) = Iinf (1 - e^(-tR/L))      rl_decay      I(t) = I0 e^(-tR/L)
       growth        y(t) = y0 e^(kt)                 decay         y(t) = y0 e^(-kt)
       compound      A = P (1 + r/100)^n
   Each shows the exponent, the coefficient, the decimal form and the SI prefix where one applies, with the working and, for the exponential
   functions, the curve. RC / RL specialist work (transients with a source, RLC) stays in the dedicated RC / RL tools; this mode is the exponent view.

   Numerical policy
     Notation, powers of ten and prefix conversion are EXACT: a number is held as a sign, a digit string and a power of ten (no floating point), so
     0.1 + 0.2 style errors cannot occur and a 40-digit input keeps its 40 digits. Rounding (to N significant figures, on request) is half-up on the digits,
     done once, and a carry (9.995 to 3 figures is 1.00 x 10^1) is renormalised.
     The exponential functions use double precision (Math.exp, expm1, log1p): the input digits are exact, the result carries about 15 reliable digits and is
     shown to at most 15. A result outside the double range (|exponent| above about 700 time constants) is shown as a coefficient and a power of ten from the
     base-10 logarithm, with about 10 reliable digits, and is labelled approximate. More than 100,000 time constants is refused.
   Prefixes: the 24 SI prefixes of the 2022 revision (quecto to quetta). Engineering notation uses the 20 whose exponent is a multiple of three; deci, centi, deca
   and hecto are accepted for conversion but are not engineering prefixes.
   Typed inputs accept 4700, 4.7e3, 4.7E3, 4.7 x 10^3, 4.7 * 10^3, 4.7 x 10^-3, 10^3, superscript exponents (10^-3 typed as 10 with a superscript) and a trailing
   SI prefix letter on a number (4.7k, 100u or 100µ, 2.2M, 10m is milli, 10M is mega). Exa is entered through the prefix list, not as a letter (E is the exponent).
   Errors are returned, never thrown, with the field that caused them. */
(function (root) {
  'use strict';
  var MINUS = '\u2212', TIMES = '\u00d7', MU = '\u00b5', TAU = '\u03c4', OMEGA = '\u03a9';

  /* ---------- SI prefixes: [key, symbol, name, exponent] ---------- */
  var PFX = [['quecto', 'q', 'quecto', -30], ['ronto', 'r', 'ronto', -27], ['yocto', 'y', 'yocto', -24], ['zepto', 'z', 'zepto', -21], ['atto', 'a', 'atto', -18], ['femto', 'f', 'femto', -15], ['pico', 'p', 'pico', -12], ['nano', 'n', 'nano', -9], ['micro', MU, 'micro', -6], ['milli', 'm', 'milli', -3], ['centi', 'c', 'centi', -2], ['deci', 'd', 'deci', -1], ['none', '', '', 0], ['deca', 'da', 'deca', 1], ['hecto', 'h', 'hecto', 2], ['kilo', 'k', 'kilo', 3], ['mega', 'M', 'mega', 6], ['giga', 'G', 'giga', 9], ['tera', 'T', 'tera', 12], ['peta', 'P', 'peta', 15], ['exa', 'E', 'exa', 18], ['zetta', 'Z', 'zetta', 21], ['yotta', 'Y', 'yotta', 24], ['ronna', 'R', 'ronna', 27], ['quetta', 'Q', 'quetta', 30]]
    .map(function (p) { return { key: p[0], sym: p[1], name: p[2], exp: p[3], eng: p[3] % 3 === 0 }; });
  var PBY = {}; PFX.forEach(function (p) { PBY[p.key] = p; });
  var PENG = {}; PFX.forEach(function (p) { if (p.eng) PENG[p.exp] = p; });
  var SUFFIX = { k: 3, M: 6, G: 9, T: 12, P: 15, Z: 21, Y: 24, R: 27, Q: 30, m: -3, u: -6, '\u00b5': -6, '\u03bc': -6, n: -9, p: -12, f: -15, a: -18, z: -21, y: -24, r: -27, q: -30 };
  var SUFFIX_NAME = {}; PFX.forEach(function (p) { if (p.sym) SUFFIX_NAME[p.exp] = p; });

  /* ---------- exact decimals: value = s x D[0].D[1..] x 10^e, D without leading or trailing zeros ---------- */
  function trimZ(x) { return x.replace(/0+$/, ''); }
  function dec(s, D, e) { return { s: s, D: D, e: e }; }
  function zero() { return dec(0, '0', 0); }
  function mk(sign, all, pointPos, exp10) {
    var i = 0; while (i < all.length && all.charAt(i) === '0') i++;
    if (i === all.length) return zero();
    return dec(sign, trimZ(all.slice(i)), pointPos - 1 - i + exp10);
  }
  function shiftD(d, k) { return d.s === 0 ? d : dec(d.s, d.D, d.e + k); }
  function sameD(a, b) { return a.s === b.s && a.D === b.D && a.e === b.e; }
  function isInt(d) { return d.s === 0 || d.e >= d.D.length - 1; }
  function mant(D, intLen) { var ip = D.slice(0, intLen); while (ip.length < intLen) ip += '0'; var fp = D.slice(intLen); return ip + (fp ? '.' + fp : ''); }
  function sg(d) { return d.s < 0 ? '-' : ''; }

  function parse(text, o) {
    o = o || {};
    var s = String(text == null ? '' : text).replace(/\s+/g, '');
    if (!s) return { empty: true };
    s = s.replace(/[\u2212\u2013\u2012]/g, '-').replace(/[\u00d7\u00b7\u22c5*]/g, 'x').replace(/X/g, 'x');
    var SUP = { '\u207a': '+', '\u207b': '-', '\u2070': '0', '\u00b9': '1', '\u00b2': '2', '\u00b3': '3', '\u2074': '4', '\u2075': '5', '\u2076': '6', '\u2077': '7', '\u2078': '8', '\u2079': '9' };
    s = s.replace(/10([\u207a\u207b]?[\u2070\u00b9\u00b2\u00b3\u2074-\u2079]+)/g, function (m, p) { return '10^' + p.split('').map(function (c) { return SUP[c]; }).join(''); });
    var gm = /^([+-]?)(\d{1,3}(?:,\d{3})+)(\.\d*)?(.*)$/.exec(s);
    if (gm) s = gm[1] + gm[2].replace(/,/g, '') + (gm[3] || '') + gm[4];
    else if (s.indexOf(',') >= 0) return { error: 'use a decimal point and no commas, or groups of exactly three digits such as 1,000' };
    var pre = 0, preSym = null;
    if (s.length > 1 && !o.noSuffix) { var last = s.charAt(s.length - 1); if (Object.prototype.hasOwnProperty.call(SUFFIX, last)) { pre = SUFFIX[last]; preSym = last; s = s.slice(0, -1); } }
    else if (s.length > 1 && o.noSuffix && Object.prototype.hasOwnProperty.call(SUFFIX, s.charAt(s.length - 1))) return { error: 'type only the number here and choose the prefix in the prefix box' };
    var sm = /^([+-]?)(.*)$/.exec(s), sign = sm[1] === '-' ? -1 : 1, body = sm[2], m, ip, fp, ex;
    if ((m = /^10\^\(?([+-]?\d{1,6})\)?$/.exec(body))) { ip = '1'; fp = ''; ex = Number(m[1]); }
    else if ((m = /^(\d*)(?:\.(\d*))?x10\^\(?([+-]?\d{1,6})\)?$/.exec(body))) { ip = m[1]; fp = m[2] || ''; ex = Number(m[3]); }
    else if ((m = /^(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d{1,6}))?$/.exec(body))) { ip = m[1]; fp = m[2] || ''; ex = m[3] === undefined ? 0 : Number(m[3]); }
    else return { error: 'is not a number. Use forms such as 4700, 4.7e3, 4.7x10^3 or 4.7k' };
    if (ip.length + fp.length === 0) return { error: 'is not a number. Use forms such as 4700, 4.7e3, 4.7x10^3 or 4.7k' };
    if (ip.length + fp.length > 1000) return { error: 'has too many digits (the limit is 1000)' };
    var d = mk(sign, ip + fp, ip.length, ex + pre);
    if (d.s !== 0 && Math.abs(d.e) > 100000) return { error: 'has an exponent beyond \u00b1100000' };
    return { d: d, prefix: preSym ? SUFFIX_NAME[pre] : null, prefixExp: pre };
  }

  function roundSig(d, n) {
    if (d.s === 0 || n === Infinity || d.D.length <= n) return d;
    var head = d.D.slice(0, n), e = d.e;
    if (d.D.charAt(n) >= '5') {
      var a = head.split(''), i = a.length - 1;
      while (i >= 0) { if (a[i] === '9') { a[i] = '0'; i--; } else { a[i] = String(Number(a[i]) + 1); break; } }
      if (i < 0) { a.unshift('1'); a.pop(); e++; }
      head = a.join('');
    }
    return dec(d.s, trimZ(head), e);
  }
  function sciOf(d) { return d.s === 0 ? { coef: '0', exp: 0 } : { coef: sg(d) + mant(d.D, 1), exp: d.e }; }
  function engOf(d) {
    if (d.s === 0) return { coef: '0', exp: 0 };
    var n3 = 3 * Math.floor(d.e / 3), sh = d.e - n3;
    return { coef: sg(d) + mant(d.D, sh + 1), exp: n3 };
  }
  var PLAIN_MAX = 400;
  function plainOf(d) {
    if (d.s === 0) return '0';
    var L = d.D.length, e = d.e;
    if (e >= 0 ? Math.max(L, e + 1) > PLAIN_MAX : -e + L + 1 > PLAIN_MAX) return null;
    var body;
    if (e >= 0) body = L - 1 <= e ? d.D + new Array(e - (L - 1) + 1).join('0') : d.D.slice(0, e + 1) + '.' + d.D.slice(e + 1);
    else body = '0.' + new Array(-e).join('0') + d.D;
    return sg(d) + body;
  }
  function plainLen(d) { return d.s === 0 ? 1 : d.e >= 0 ? Math.max(d.D.length, d.e + 1) : -d.e + d.D.length + 1; }
  function groupInt(p) { var m = /^(-?)(\d+)$/.exec(p); return m && m[2].length > 3 ? m[1] + m[2].replace(/\B(?=(\d{3})+(?!\d))/g, ',') : null; }
  function sciText(d) { var s = sciOf(d); return d.s === 0 ? '0' : s.coef + ' ' + TIMES + ' 10^' + s.exp; }
  function engText(d) { var s = engOf(d); return d.s === 0 ? '0' : s.coef + ' ' + TIMES + ' 10^' + s.exp; }
  function eText(d) { var s = sciOf(d); return d.s === 0 ? '0' : s.coef + 'E' + s.exp; }
  function prefixOf(d) { if (d.s === 0) return null; var n3 = engOf(d).exp; return PENG[n3] || null; }
  function prefixText(d) { var p = prefixOf(d); return p ? engOf(d).coef + (p.sym ? ' ' + p.sym : '') : null; }
  function numText(d) { var p = plainOf(d); return p !== null && p.length <= 30 ? p : sciText(d); }
  function symOf(p) { return p.sym; }

  /* a double to a decimal at 15 digits (the double's own digits), or a base-10 logarithm to a decimal at 10 digits */
  function decFromDouble(x) { if (x === 0) return zero(); var r = parse(Math.abs(x).toExponential(14)); var d = r.d; return x < 0 ? dec(-1, d.D, d.e) : d; }
  function decFromLog(sign, l10) { var e = Math.floor(l10), m = Math.pow(10, l10 - e), r = parse(m.toExponential(9)).d; return dec(sign, r.D, r.e + e); }
  /* y0 x e^ex as a decimal: directly when that is safe in double precision, from base-10 logarithms (about 10 digits) when it would overflow or underflow */
  function valDec(y0, ex) {
    var v = y0 * Math.exp(ex);
    if (Math.abs(ex) <= 700 && isFinite(v) && (v === 0 ? y0 === 0 : Math.abs(v) > 1e-300)) return decFromDouble(v);
    return y0 === 0 ? zero() : decFromLog(y0 < 0 ? -1 : 1, Math.log10(Math.abs(y0)) + ex / Math.LN10);
  }
  function pctDec(ex) { return Math.abs(ex) <= 700 ? decFromDouble(Math.expm1(ex) * 100) : ex > 0 ? decFromLog(1, ex / Math.LN10 + 2) : decFromDouble(-100); }
  function toNumber(d) { return d.s === 0 ? 0 : Number((d.s < 0 ? '-' : '') + d.D.charAt(0) + '.' + (d.D.slice(1) || '0') + 'e' + d.e); }

  /* a quantity with a unit, in engineering notation with the SI prefix: 36.7879 V, 2.2 ms */
  function uText(d) { if (d.s === 0) return '0'; var p = d.e >= -4 && d.e <= 8 ? plainOf(d) : null; return p !== null && p.length <= 24 ? p : sciText(d); }
  function qText(d, unit) {
    if (d.s === 0) return '0' + (unit ? ' ' + unit : '');
    if (!unit) return uText(d);
    var s = engOf(d), p = PENG[s.exp];
    if (unit === 's' && s.exp > 0) return uText(d) + ' s';
    if (p) return s.coef + ' ' + p.sym + unit;
    return s.coef + ' ' + TIMES + ' 10^' + s.exp + ' ' + unit;
  }
  function qSci(d, unit) { return d.s === 0 ? '0' + (unit ? ' ' + unit : '') : sciText(d) + (unit ? ' ' + unit : ''); }

  var SIGS = ['2', '3', '4', '5', '6', '8', '10', '12', '15', 'full'];
  function sigN(key, notation) { return key === 'full' ? (notation ? Infinity : 15) : Number(key); }

  /* ---------- the display model: cards, tables, facts, steps ---------- */
  function card(label, text, copy, sub) { return { label: label, text: text, copy: copy === undefined ? text : copy, sub: sub || '' }; }
  function table(title, head, rows) { return { title: title, head: head, rows: rows }; }

  /* ---------- mode definitions ---------- */
  function F(k, label, def, rule, extra) { var f = { k: k, label: label, def: def, kind: 'num', rule: rule || 'any', opt: false }; if (extra) for (var x in extra) f[x] = extra[x]; return f; }
  var PFXOPTS = PFX.map(function (p) { return [p.key, p.eng ? (p.name || 'no prefix') + (p.sym ? ' (' + p.sym + ', 10^' + p.exp + ')' : ' (10^0)') : p.name + ' (' + p.sym + ', 10^' + p.exp + ')']; });
  var G1 = 'Notation and powers of ten', G2 = 'Exponential engineering functions';
  var TIPNUM = 'Examples: 4700, 4.7k, 100u, 2.2M, 1e-6, 4.7x10^3';
  var MODES = [
    { key: 'notation', group: G1, name: 'Scientific and engineering notation', formula: 'x = c \u00d7 10^n', notation: true, sigDef: 'full', fields: [F('v', 'Number', '4700000', 'any', { unit: '', hint: TIPNUM })] },
    { key: 'power10', group: G1, name: 'Power of ten (c \u00d7 10^n)', formula: 'c \u00d7 10^n', notation: true, sigDef: 'full', fields: [F('c', 'Coefficient (c)', '1', 'any', { hint: 'Default 1. Examples: 1, 4.7, 2.2' }), F('n', 'Exponent (n), a whole number', '-3', 'int', { hint: 'Whole numbers only, for example -6, 3, 12' })] },
    { key: 'prefix', group: G1, name: 'SI prefix conversion', formula: 'x\u00b710^(from) = y\u00b710^(to)', notation: true, sigDef: 'full', fields: [F('v', 'Value', '4700', 'any', { noSuffix: true, hint: 'The number only. Choose its prefix on the right' }), { k: 'from', label: 'Value is in', kind: 'sel', def: 'none', opts: PFXOPTS }, { k: 'to', label: 'Convert to', kind: 'sel', def: 'auto', opts: [['auto', 'Best engineering prefix']].concat(PFXOPTS) }] },
    { key: 'rc_charge', group: G2, name: 'RC charging', formula: 'V(t) = Vs (1 \u2212 e^(\u2212t/RC))', circuit: 'rc', rise: true, sigDef: '6', fields: [F('f', 'Source voltage Vs (V)', '100', 'nonzero', { unit: 'V', hint: TIPNUM }), F('r', 'Resistance R (\u03a9)', '10k', 'pos', { unit: OMEGA, hint: 'Examples: 10k, 470, 2.2M' }), F('c', 'Capacitance C (F)', '100u', 'pos', { unit: 'F', hint: 'Examples: 100u, 4.7n, 10p' }), F('t', 'Time t (s)', '1', 'nonneg', { unit: 's', hint: 'Examples: 1, 2.5m (2.5 milliseconds), 50u' }), F('tg', 'Target voltage (optional, to find the time)', '', 'any', { opt: true, unit: 'V', hint: 'Leave empty if not needed' })] },
    { key: 'rc_discharge', group: G2, name: 'RC discharging', formula: 'V(t) = V0 e^(\u2212t/RC)', circuit: 'rc', rise: false, sigDef: '6', fields: [F('f', 'Initial voltage V0 (V)', '100', 'nonzero', { unit: 'V', hint: TIPNUM }), F('r', 'Resistance R (\u03a9)', '10k', 'pos', { unit: OMEGA, hint: 'Examples: 10k, 470, 2.2M' }), F('c', 'Capacitance C (F)', '100u', 'pos', { unit: 'F', hint: 'Examples: 100u, 4.7n, 10p' }), F('t', 'Time t (s)', '1', 'nonneg', { unit: 's', hint: 'Examples: 1, 2.5m (2.5 milliseconds), 50u' }), F('tg', 'Target voltage (optional, to find the time)', '', 'any', { opt: true, unit: 'V', hint: 'Leave empty if not needed' })] },
    { key: 'rl_rise', group: G2, name: 'RL current rise', formula: 'I(t) = I\u221e (1 \u2212 e^(\u2212tR/L))', circuit: 'rl', rise: true, sigDef: '6', fields: [F('f', 'Final current I\u221e (A)', '2', 'nonzero', { unit: 'A', hint: 'I\u221e = V / R. Examples: 2, 500m' }), F('r', 'Resistance R (\u03a9)', '50', 'pos', { unit: OMEGA, hint: 'Examples: 50, 1k' }), F('l', 'Inductance L (H)', '100m', 'pos', { unit: 'H', hint: 'Examples: 100m, 10u, 2' }), F('t', 'Time t (s)', '2m', 'nonneg', { unit: 's', hint: 'Examples: 2m (2 milliseconds), 1u' }), F('tg', 'Target current (optional, to find the time)', '', 'any', { opt: true, unit: 'A', hint: 'Leave empty if not needed' })] },
    { key: 'rl_decay', group: G2, name: 'RL current decay', formula: 'I(t) = I0 e^(\u2212tR/L)', circuit: 'rl', rise: false, sigDef: '6', fields: [F('f', 'Initial current I0 (A)', '2', 'nonzero', { unit: 'A', hint: 'Examples: 2, 500m' }), F('r', 'Resistance R (\u03a9)', '50', 'pos', { unit: OMEGA, hint: 'Examples: 50, 1k' }), F('l', 'Inductance L (H)', '100m', 'pos', { unit: 'H', hint: 'Examples: 100m, 10u, 2' }), F('t', 'Time t (s)', '2m', 'nonneg', { unit: 's', hint: 'Examples: 2m (2 milliseconds), 1u' }), F('tg', 'Target current (optional, to find the time)', '', 'any', { opt: true, unit: 'A', hint: 'Leave empty if not needed' })] },
    { key: 'growth', group: G2, name: 'Exponential growth', formula: 'y(t) = y0 e^(kt)', gen: 'growth', sigDef: '6', fields: [F('y', 'Initial value y0', '1', 'any', { hint: TIPNUM }), F('k', 'Growth rate k (per unit of time)', '0.5', 'pos', { hint: 'Positive, for example 0.05, 2' }), F('t', 'Time t (same unit as 1/k)', '10', 'nonneg', { hint: 'Zero or more' }), F('tg', 'Target value (optional, to find the time)', '', 'any', { opt: true, hint: 'Leave empty if not needed' })] },
    { key: 'decay', group: G2, name: 'Exponential decay', formula: 'y(t) = y0 e^(\u2212kt)', gen: 'decay', sigDef: '6', fields: [F('y', 'Initial value y0', '100', 'any', { hint: TIPNUM }), F('k', 'Decay rate k (per unit of time)', '0.2', 'pos', { hint: 'Positive, for example 0.05, 2' }), F('t', 'Time t (same unit as 1/k)', '10', 'nonneg', { hint: 'Zero or more' }), F('tg', 'Target value (optional, to find the time)', '', 'any', { opt: true, hint: 'Leave empty if not needed' })] },
    { key: 'compound', group: G2, name: 'Compound growth', formula: 'A = P (1 + r/100)^n', gen: 'compound', sigDef: '6', fields: [F('y', 'Starting amount P', '1000', 'any', { hint: TIPNUM }), F('k', 'Growth per period r (%)', '5', 'gtm100', { hint: 'Percent, above \u2212100. Negative means a fall' }), F('t', 'Number of periods n', '10', 'nonneg', { hint: 'Zero or more; fractions allowed' })] }
  ];
  var MBY = {}; MODES.forEach(function (m) { MBY[m.key] = m; });

  /* ---------- reading the fields ---------- */
  function rangeErr(rule) { return rule === 'pos' ? 'must be greater than zero' : rule === 'nonneg' ? 'must be zero or more' : rule === 'nonzero' ? 'must not be zero' : rule === 'gtm100' ? 'must be above \u2212100 (a fall of 100 % or more leaves nothing)' : ''; }
  function ruleOk(rule, x) { return rule === 'pos' ? x > 0 : rule === 'nonneg' ? x >= 0 : rule === 'nonzero' ? x !== 0 : rule === 'gtm100' ? x > -100 : true; }
  function err(field, label, msg) { return { ok: false, field: field, error: (label ? label.replace(/\s*\(.*$/, '') + ' ' : '') + msg }; }
  function readFields(m, o) {
    var vals = {}, text = {}, k, i, f, any = false, missing = null;
    for (i = 0; i < m.fields.length; i++) { f = m.fields[i]; var raw = o[f.k] == null ? '' : String(o[f.k]); text[f.k] = raw; if (raw.replace(/\s+/g, '') !== '' && !(f.kind === 'sel')) any = true; }
    for (i = 0; i < m.fields.length; i++) {
      f = m.fields[i]; var t = text[f.k];
      if (f.kind === 'sel') { var key = t || f.def; if (!PBY[key] && key !== 'auto') return { bad: err(f.k, f.label, 'is not a prefix in the list') }; if (key === 'auto' && f.k !== 'to') return { bad: err(f.k, f.label, 'is not a prefix in the list') }; vals[f.k] = key; continue; }
      if (t.replace(/\s+/g, '') === '') { if (f.opt) { vals[f.k] = null; continue; } if (f.k === 'c' && m.key === 'power10') { vals[f.k] = parse('1').d; text[f.k] = '1'; continue; } if (!missing) missing = f; continue; }
      var p = parse(t, { noSuffix: f.noSuffix });
      if (p.error) return { bad: err(f.k, f.label, p.error) };
      var d = p.d;
      if (f.rule === 'int') { if (!isInt(d)) return { bad: err(f.k, f.label, 'must be a whole number. For a fractional exponent use the Negative and Fractional Exponents mode') }; if (d.s !== 0 && d.e > 5) return { bad: err(f.k, f.label, 'is too large (the limit is \u00b1100000)') }; if (Math.abs(toNumber(d)) > 100000) return { bad: err(f.k, f.label, 'is too large (the limit is \u00b1100000)') }; }
      else if (!m.notation || f.rule !== 'any') {
        var x = toNumber(d);
        if (!isFinite(x) || (d.s !== 0 && x === 0)) return { bad: err(f.k, f.label, 'is outside the range this calculator can handle (about 1e-308 to 1e308)') };
        if (!ruleOk(f.rule, x)) return { bad: err(f.k, f.label, rangeErr(f.rule)) };
      }
      vals[f.k] = d;
    }
    if (missing) { if (!any) return { empty: true }; return { partial: true, field: missing.k, bad: { ok: false, partial: true, field: missing.k, error: 'Enter ' + missing.label.replace(/\s*\(.*$/, '').toLowerCase() + ' to see the result.' } }; }
    return { vals: vals, text: text };
  }

  /* ---------- notation, power of ten, prefix ---------- */
  function notationOut(mode, d, sig, inputs, pre) {
    var rd = roundSig(d, sig), sc = sciOf(rd), en = engOf(rd), pl = plainOf(rd), pf = prefixOf(rd), rounded = !sameD(rd, d);
    var cards = [], steps = [], facts = [], tables = [], warnings = [];
    var sciT = sciText(rd), engT = engText(rd), eT = eText(rd), pfT = prefixText(rd);
    cards.push(card('Scientific notation', sciT, sciT, 'coefficient ' + sc.coef + ', exponent ' + sc.exp));
    cards.push(card('Engineering notation', engT, engT, 'coefficient ' + en.coef + ', exponent ' + en.exp + ' (a multiple of 3)'));
    cards.push(card('E notation (calculators, code)', eT, eT, 'the form 4.7E3 or 4.7e3'));
    if (pl !== null) cards.push(card('Decimal form', pl, pl, groupInt(pl) ? groupInt(pl) + ' with commas' : (rd.s === 0 ? '' : 'written out in full')));
    else { cards.push(card('Decimal form', 'too long to write out', '', plainLen(rd) + ' digits, more than the ' + PLAIN_MAX + ' shown')); warnings.push('The decimal form would need ' + plainLen(rd) + ' characters, so only the notations are shown.'); }
    if (pf) cards.push(card('With its SI prefix', pfT + (pf.sym ? '' : ' (no prefix)'), pfT, pf.name ? pf.name + ' (10^' + pf.exp + '): ' + pfT + ' means ' + en.coef + ' ' + TIMES + ' 10^' + pf.exp + ' of the unit' : 'exponent 0: no prefix needed'));
    else if (rd.s !== 0) cards.push(card('With its SI prefix', 'none', '', 'the exponent ' + en.exp + ' is beyond quecto (10^\u221230) to quetta (10^30)'));
    else cards.push(card('With its SI prefix', 'none', '', 'zero has no prefix'));
    var rows = [['Scientific notation', sciT, String(sc.exp), sc.coef], ['Engineering notation', engT, String(en.exp), en.coef], ['E notation', eT, String(sc.exp), sc.coef], ['Decimal form', pl === null ? '(too long)' : pl, '', ''], ['SI prefix form', pf ? pfT + (pf.sym ? '' : ' (none)') : 'none', pf ? String(pf.exp) : '', pf ? en.coef : '']];
    tables.push(table('The same number in every form', ['Form', 'Value', 'Exponent', 'Coefficient'], rows));
    facts.push(['Exponent (scientific)', String(sc.exp)], ['Coefficient', sc.coef], ['Significant digits', String(rd.s === 0 ? 1 : rd.D.length)]);
    if (rd.s !== 0) facts.push(['Order of magnitude', '10^' + sc.exp]);
    /* working */
    var D = rd.D;
    if (pre && pre.steps) pre.steps.forEach(function (x) { steps.push(x); });
    if (d.s === 0) steps.push({ title: 'Zero', text: 'Zero has no leading non-zero digit, so it has no exponent of its own: 0 = 0 ' + TIMES + ' 10^0, and it takes no SI prefix.' });
    else {
      steps.push({ title: 'Scientific notation', text: 'Move the decimal point until one non-zero digit stands in front of it.\nThe digits are ' + d.D + '; the first one carries the power 10^' + d.e + '.\n' + (d.e === 0 ? 'No move is needed' : 'That is a move of ' + Math.abs(d.e) + ' place' + (Math.abs(d.e) === 1 ? '' : 's') + (d.e > 0 ? ' to the left' : ' to the right')) + '.\n' + sg(d) + mant(d.D, 1) + ' ' + TIMES + ' 10^' + d.e + '   (1 \u2264 |coefficient| < 10)' });
      if (rounded) steps.push({ title: 'Rounding', text: 'Rounded half up to ' + sig + ' significant figures: ' + sg(d) + mant(d.D, 1) + ' ' + TIMES + ' 10^' + d.e + '  \u2192  ' + sciText(rd) + (rd.e !== d.e ? '\n(the rounding carried into the next power of ten)' : '') });
      var n3 = en.exp, sh = rd.e - n3;
      steps.push({ title: 'Engineering notation', text: 'Use an exponent that is a multiple of 3, never above the number\'s own exponent ' + rd.e + ': ' + n3 + '.\nThe decimal point then sits ' + sh + ' place' + (sh === 1 ? '' : 's') + ' to the right of the first digit, so the coefficient is ' + en.coef + ' (1 \u2264 |coefficient| < 1000).\n' + engT });
      steps.push({ title: 'SI prefix', text: pf ? (pf.sym ? '10^' + pf.exp + ' = ' + pf.name + ' (' + pf.sym + '), so ' + engT + ' = ' + pfT + '.' : 'The exponent is 0, so no prefix is needed: the coefficient ' + en.coef + ' is the value.') : 'The exponent ' + en.exp + ' is outside quecto (10^\u221230) to quetta (10^30), so there is no SI prefix and the engineering notation is the answer.' });
    }
    /* check: every form reads back as the same number, exactly */
    var chk = [parse(sc.coef + 'e' + sc.exp), parse(en.coef + 'e' + en.exp)], ok = chk.every(function (c) { return c.d && sameD(c.d, rd); });
    if (pl !== null) { var cp = parse(pl); ok = ok && cp.d && sameD(cp.d, rd); }
    return { ok: true, kind: 'notation', d: d, rd: rd, sig: sig, rounded: rounded, sci: sc, eng: en, plain: pl, prefix: pf, cards: cards, tables: tables, facts: facts, steps: steps, warnings: warnings, check: { ok: ok, detail: 'The scientific, engineering and decimal forms were read back and give the same number exactly.' }, inputs: inputs, approx: false };
  }

  function runNotation(m, V, T, sigKey) {
    var sig = sigN(sigKey, true), d = V.v, r, parsed = parse(T.v), pre = { steps: [] };
    var shown = T.v.replace(/\s+/g, '');
    if (parsed.prefix && parsed.prefix.sym) pre.steps.push({ title: 'Read the number', text: shown + ' = ' + sg(parsed.d) + mant(parsed.d.D, 1) + ' ' + TIMES + ' 10^' + parsed.d.e + '\n(the letter ' + parsed.prefix.sym + ' is the prefix ' + parsed.prefix.name + ', 10^' + parsed.prefix.exp + ')' });
    else pre.steps.push({ title: 'Read the number', text: shown + ' is read digit by digit as a decimal, without floating point: sign ' + (d.s < 0 ? '\u2212' : d.s === 0 ? '0' : '+') + ', digits ' + d.D + ', leading power 10^' + d.e + '.' });
    r = notationOut('notation', d, sig, { v: shown }, pre);
    r.mode = m.key; r.modeName = m.name; r.formula = m.formula;
    r.headline = shown + ' = ' + sciText(r.rd) + ' (scientific) = ' + engText(r.rd) + ' (engineering)' + (r.prefix && r.prefix.sym ? ' = ' + prefixText(r.rd) : '');
    return r;
  }
  function runPower10(m, V, T, sigKey) {
    var sig = sigN(sigKey, true), c = V.c, n = Number(toNumber(V.n)), d = shiftD(c, n);
    if (d.s !== 0 && Math.abs(d.e) > 100000) return { ok: false, field: 'n', error: 'Exponent makes the result exponent go beyond \u00b1100000. Use a smaller exponent.' };
    var cT = T.c.replace(/\s+/g, '') || '1', pre = { steps: [{ title: 'Apply the power of ten', text: cT + ' ' + TIMES + ' 10^' + n + ': multiplying by 10^' + n + ' moves the decimal point ' + Math.abs(n) + ' place' + (Math.abs(n) === 1 ? '' : 's') + (n === 0 ? '' : n > 0 ? ' to the right' : ' to the left') + ', exactly (the digits do not change).' }] };
    var r = notationOut('power10', d, sig, { c: cT, n: String(n) }, pre);
    r.mode = m.key; r.modeName = m.name; r.formula = m.formula;
    if (sameD(c, parse('1').d)) {
      var zeros = n >= 0 ? '1 followed by ' + n + ' zero' + (n === 1 ? '' : 's') : n === 0 ? 'one' : 'a 1 in decimal place ' + (-n) + ' (' + (-n - 1) + ' zero' + (-n - 1 === 1 ? '' : 's') + ' after the decimal point first)';
      r.facts.unshift(['10^' + n + ' is', zeros]);
      if (n !== 0) r.facts.push(['Reciprocal', '1 / 10^' + n + ' = 10^' + (-n)]);
    }
    r.headline = cT + ' ' + TIMES + ' 10^' + n + ' = ' + numText(r.rd) + (r.prefix && r.prefix.sym ? ' = ' + prefixText(r.rd) : '');
    return r;
  }
  function runPrefix(m, V, T, sigKey) {
    var sig = sigN(sigKey, true), from = PBY[V.from], v = V.v, base = shiftD(v, from.exp), to, auto = V.to === 'auto', warn = [], baseR = roundSig(base, sig);
    if (auto) {
      var e3 = baseR.s === 0 ? 0 : engOf(baseR).exp, cl = Math.max(-30, Math.min(30, e3)); to = PENG[cl];
      if (cl !== e3) warn.push('The value is beyond the prefix range (quecto to quetta), so the nearest prefix is used and the coefficient is outside 1 to 1000.');
    } else to = PBY[V.to];
    var out = roundSig(shiftD(base, -to.exp), sig), rounded = !sameD(shiftD(base, -to.exp), out);
    var cards = [], steps = [], vT = T.v.replace(/\s+/g, '');
    var outT = numText(out) + (to.sym ? ' ' + to.sym : '');
    cards.push(card('Converted value', outT, numText(out), (v.s === 0 ? '' : vT + (from.sym ? ' ' + from.sym : '') + ' \u2192 ' + (to.name ? to.name : 'no prefix') + (auto ? ' (best engineering prefix)' : ''))));
    cards.push(card('In the base unit (no prefix)', numText(baseR), numText(baseR), (from.exp === 0 ? 'no change' : vT + ' ' + (from.name || '') + ' = ' + vT + ' ' + TIMES + ' 10^' + from.exp)));
    cards.push(card('Scientific notation', sciText(out), sciText(out), 'the converted value, ' + (to.name ? 'in ' + to.name + ' units' : 'in the base unit')));
    cards.push(card('Shift applied', TIMES + ' 10^' + (from.exp - to.exp), TIMES + ' 10^' + (from.exp - to.exp), '10^' + from.exp + ' \u00f7 10^' + to.exp));
    var rows = PFX.filter(function (p) { return p.eng; }).map(function (p) { var dd = roundSig(shiftD(base, -p.exp), sig); return [p.name ? p.name + ' (' + p.sym + ')' : 'no prefix', '10^' + p.exp, numText(dd) + (p.sym ? ' ' + p.sym : '')]; });
    var tables = [table('The same value in every engineering prefix', ['Prefix', 'Power', 'Value'], rows)];
    steps.push({ title: 'To the base unit', text: from.exp === 0 ? 'The value is already in the base unit: ' + vT + '.' : vT + ' ' + from.name + ' = ' + vT + ' ' + TIMES + ' 10^' + from.exp + ' = ' + numText(baseR) + '.' });
    steps.push({ title: 'To the new prefix', text: 'Divide by the new prefix\'s power: ' + numText(baseR) + ' \u00f7 10^' + to.exp + ' = ' + numText(out) + ' ' + (to.name || '(base unit)') + '.\nIn one step the exponent shifts by ' + (from.exp - to.exp) + ': 10^' + from.exp + ' \u00f7 10^' + to.exp + '.' });
    if (rounded) steps.push({ title: 'Rounding', text: 'Rounded half up to ' + sig + ' significant figures.' });
    if (auto) steps.push({ title: 'Why this prefix', text: 'The best engineering prefix keeps the coefficient between 1 and 1000: the exponent of ' + sciText(baseR) + ' is ' + (base.s === 0 ? 0 : base.e) + ', and the multiple of 3 not above it is ' + to.exp + ' (' + (to.name || 'no prefix') + ').' });
    var rebuilt = shiftD(out, to.exp - from.exp), ok = sig === Infinity ? sameD(rebuilt, v) : sameD(roundSig(rebuilt, sig), roundSig(v, sig));
    return { ok: true, kind: 'prefix', mode: m.key, modeName: m.name, formula: m.formula, d: v, rd: out, sig: sig, cards: cards, tables: tables, facts: [['From', (from.name || 'no prefix') + ' (10^' + from.exp + ')'], ['To', (to.name || 'no prefix') + ' (10^' + to.exp + ')']], steps: steps, warnings: warn, check: { ok: ok, detail: 'Converting back to the original prefix returns the original value exactly.' }, inputs: { v: vT, from: V.from, to: V.to }, approx: false, headline: vT + (from.sym ? ' ' + from.sym : '') + ' = ' + outT, prefixFrom: from, prefixTo: to };
  }

  /* ---------- exponential engineering functions ---------- */
  function niceStep(x) { return x <= 5 ? 1 : x <= 10 ? 2 : x <= 20 ? 5 : 10; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function gtext(x, unit) { return qText(roundSig(decFromDouble(x), 3), unit); }
  function nTxt(n, sig) { return qText(roundSig(decFromDouble(n), sig), ''); }
  function pct(f, sig) { return qText(roundSig(decFromDouble(f * 100), sig), '') + ' %'; }

  function runCircuit(m, V, T, sigKey) {
    var sig = sigN(sigKey, false), rise = m.rise, rc = m.circuit === 'rc', q = rc ? 'V' : 'I', qn = rc ? 'Voltage' : 'Current', qu = rc ? 'V' : 'A';
    var Fv = toNumber(V.f), R = toNumber(V.r), X = toNumber(rc ? V.c : V.l), t = toNumber(V.t), tau = rc ? R * X : X / R;
    if (!isFinite(tau) || tau <= 0) return { ok: false, field: rc ? 'c' : 'l', error: 'The time constant is outside the range this calculator can handle.' };
    var n = t / tau; if (!isFinite(n)) return { ok: false, field: 't', error: 'Time is outside the range this calculator can handle.' };
    if (n > 100000) return { ok: false, field: 't', error: 'Time is more than 100,000 time constants (' + TAU + ' = ' + qText(roundSig(decFromDouble(tau), sig), 's') + '). Use a smaller time.' };
    var far = n > 700, ex = far ? 0 : Math.exp(-n), exL = -n / Math.LN10, one = n > 700 ? 1 : -Math.expm1(-n);
    var valD, valSign = Fv < 0 ? -1 : 1, approx = false;
    if (rise) valD = decFromDouble(Fv * one); else if (far) { valD = decFromLog(valSign, Math.log10(Math.abs(Fv)) + exL); approx = true; } else valD = valDec(Fv, -n);
    var otherD = rise ? (far ? decFromLog(1, exL) : decFromDouble(ex)) : decFromDouble(one);   /* remaining to final (rise) or decayed (fall) */
    if (rise && far) approx = true;
    var f = rise ? one : ex;                                                                                  /* fraction of the reference value */
    var fPct = far && !rise ? decFromLog(1, exL + 2) : decFromDouble((rise ? one : ex) * 100), oPct = rise ? (far ? decFromLog(1, exL + 2) : decFromDouble(ex * 100)) : decFromDouble(one * 100);
    var tauD = roundSig(decFromDouble(tau), sig), tD = roundSig(decFromDouble(t), sig), nD = roundSig(decFromDouble(n), sig);
    var name = m.name, sym = m.rise ? (rc ? 'Vs' : 'I\u221e') : (rc ? 'V0' : 'I0'), tauSrc = rc ? 'R \u00d7 C' : 'L \u00f7 R';
    var inT = { f: T.f.replace(/\s+/g, ''), r: T.r.replace(/\s+/g, ''), t: T.t.replace(/\s+/g, '') }; inT[rc ? 'c' : 'l'] = (rc ? T.c : T.l).replace(/\s+/g, ''); if (T.tg && T.tg.replace(/\s+/g, '')) inT.tg = T.tg.replace(/\s+/g, '');
    var cards = [], tables = [], steps = [], facts = [], warnings = [];
    var valT = qText(roundSig(valD, sig), qu), valS = qSci(roundSig(valD, sig), qu);
    cards.push(card(qn + ' at t = ' + qText(tD, 's'), valT, valT, (approx ? 'approximate (beyond the double range): ' : '') + valS));
    cards.push(card('Time constant ' + TAU, qText(tauD, 's'), qText(tauD, 's'), TAU + ' = ' + tauSrc + ' = ' + qText(roundSig(decFromDouble(R), sig), OMEGA) + (rc ? ' \u00d7 ' : ' with L = ') + (rc ? qText(roundSig(decFromDouble(X), sig), 'F') : qText(roundSig(decFromDouble(X), sig), 'H'))));
    cards.push(card('Exponent', '\u2212t/' + TAU + ' = \u2212' + nTxt(n, sig), nTxt(n, sig), 'n = t / ' + TAU + ' = ' + nTxt(n, sig) + (n === 1 ? ' time constant' : ' time constants')));
    cards.push(card(rise ? 'Reached' : 'Remaining', qText(roundSig(fPct, sig), '') + ' %', qText(roundSig(fPct, sig), ''), (rise ? 'of ' : 'of ') + sym + '  (' + (rise ? '1 \u2212 e^(\u2212n)' : 'e^(\u2212n)') + ' = ' + (far && !rise ? sciText(roundSig(decFromLog(1, exL), sig)) : qText(roundSig(decFromDouble(f), sig), '')) + ')'));
    cards.push(card(rise ? 'Still to go' : 'Decayed', qText(roundSig(oPct, sig), '') + ' %', qText(roundSig(oPct, sig), ''), rise ? 'e^(\u2212n), the part of ' + sym + ' not yet reached' : '1 \u2212 e^(\u2212n), the part of ' + sym + ' already lost'));
    /* optional target: the time to reach it */
    var tgD = null, tStar = null, nStar = null;
    if (V.tg) {
      var tg = toNumber(V.tg), qq = tg / Fv;
      if (!isFinite(tg) || (V.tg.s !== 0 && tg === 0)) return { ok: false, field: 'tg', error: 'Target is outside the range this calculator can handle.' };
      if (rise) {
        if (qq < 0) return { ok: false, field: 'tg', error: 'Target has the opposite sign to ' + sym + '. The ' + qn.toLowerCase() + ' rises from 0 towards ' + sym + ' and never changes sign.' };
        if (qq >= 1) return { ok: false, field: 'tg', error: 'The ' + qn.toLowerCase() + ' only approaches ' + sym + ' and never reaches it. Choose a target below ' + qText(roundSig(decFromDouble(Fv), 6), qu) + '.' };
        nStar = qq === 0 ? 0 : -Math.log1p(-qq);
      } else {
        if (qq <= 0) return { ok: false, field: 'tg', error: qq === 0 ? 'The ' + qn.toLowerCase() + ' only approaches zero and never reaches it. Choose a target above zero.' : 'Target has the opposite sign to ' + sym + '. The ' + qn.toLowerCase() + ' falls towards zero and never changes sign.' };
        if (qq > 1) return { ok: false, field: 'tg', error: 'The ' + qn.toLowerCase() + ' only falls from ' + qText(roundSig(decFromDouble(Fv), 6), qu) + '. Choose a target at or below it.' };
        nStar = -Math.log(qq);
      }
      tStar = nStar * tau; tgD = roundSig(decFromDouble(tg), sig);
      cards.push(card('Time to reach ' + qText(tgD, qu), qText(roundSig(decFromDouble(tStar), sig), 's'), qText(roundSig(decFromDouble(tStar), sig), 's'), 't = ' + (rise ? '\u2212' + TAU + ' ln(1 \u2212 ' + q + '/' + sym + ')' : '\u2212' + TAU + ' ln(' + q + '/' + sym + ')') + ' = ' + nTxt(nStar, sig) + ' ' + TAU));
    }
    /* tables: whole time constants; useful times */
    var rows = [], i;
    for (i = 0; i <= 5; i++) { var fi = rise ? -Math.expm1(-i) : Math.exp(-i); rows.push([i + ' ' + TAU, qText(roundSig(decFromDouble(i * tau), sig), 's'), qText(roundSig(decFromDouble(Fv * fi), sig), qu), qText(roundSig(decFromDouble(fi * 100), sig), '') + ' %']); }
    tables.push(table(qn + ' at whole time constants', ['Time constants', 'Time', qn, '% of ' + sym], rows));
    var lv = rise ? [[0.5, 'rises to 50 %'], [1 - Math.exp(-1), 'rises to 63.2 % (one ' + TAU + ')'], [0.9, 'rises to 90 %'], [0.95, 'rises to 95 %'], [0.99, 'rises to 99 %'], [0.999, 'rises to 99.9 %']] : [[0.5, 'falls to 50 % (half-value time)'], [Math.exp(-1), 'falls to 36.8 % (one ' + TAU + ')'], [0.1, 'falls to 10 %'], [0.05, 'falls to 5 %'], [0.01, 'falls to 1 %'], [0.001, 'falls to 0.1 %']];
    var rows2 = lv.map(function (p) { var nn = rise ? -Math.log1p(-p[0]) : -Math.log(p[0]); return [qn + ' ' + p[1], nTxt(nn, sig) + ' ' + TAU, qText(roundSig(decFromDouble(nn * tau), sig), 's')]; });
    tables.push(table('Useful times', ['Event', 'In time constants', 'Time'], rows2));
    if (rise) facts.push(['Rise time 10 % to 90 %', nTxt(Math.log(9), sig) + ' ' + TAU + ' = ' + qText(roundSig(decFromDouble(Math.log(9) * tau), sig), 's')]); else facts.push(['Half-value time', nTxt(Math.LN2, sig) + ' ' + TAU + ' = ' + qText(roundSig(decFromDouble(Math.LN2 * tau), sig), 's')]);
    facts.push(['Settled (99.3 %) after', '5 ' + TAU + ' = ' + qText(roundSig(decFromDouble(5 * tau), sig), 's')]);
    /* working */
    steps.push({ title: 'The law', text: name + ':   ' + m.formula + '\n' + (rc ? TAU + ' = R C' : TAU + ' = L / R') + '   (the time constant, in seconds)\n' + (rise ? sym + ' = ' + (rc ? 'the source voltage' : 'the final current V/R') + ', reached as t grows' : sym + ' = the ' + (rc ? 'voltage' : 'current') + ' at t = 0, which falls towards zero') });
    steps.push({ title: 'Time constant', text: TAU + ' = ' + tauSrc + ' = ' + qText(roundSig(decFromDouble(R), 6), OMEGA) + (rc ? ' \u00d7 ' + qText(roundSig(decFromDouble(X), 6), 'F') : ' \u2192 L = ' + qText(roundSig(decFromDouble(X), 6), 'H') + ', ' + TAU + ' = L \u00f7 R') + '\n' + TAU + ' = ' + qText(tauD, 's') + '   (' + qSci(tauD, 's') + ')' });
    steps.push({ title: 'The exponent', text: 'n = t / ' + TAU + ' = ' + qText(roundSig(decFromDouble(t), 6), 's') + ' \u00f7 ' + qText(roundSig(decFromDouble(tau), 6), 's') + ' = ' + nTxt(n, sig) + '\ne^(\u2212n) = e^(\u2212' + nTxt(n, sig) + ') = ' + (far ? '10^' + exL.toFixed(3) + ' (beyond the double range)' : qText(roundSig(decFromDouble(ex), sig), '')) });
    steps.push({ title: 'The result', text: (rise ? q + '(t) = ' + sym + ' (1 \u2212 e^(\u2212n)) = ' + qText(roundSig(decFromDouble(Fv), 6), qu) + ' \u00d7 ' + qText(roundSig(decFromDouble(one), sig), '') : q + '(t) = ' + sym + ' e^(\u2212n) = ' + qText(roundSig(decFromDouble(Fv), 6), qu) + ' \u00d7 ' + (far ? '10^' + exL.toFixed(3) : qText(roundSig(decFromDouble(ex), sig), ''))) + '\n' + q + '(t) = ' + valT + '   (' + valS + ')' });
    if (tStar !== null) steps.push({ title: 'Time to reach the target', text: 'Solve the law for t: ' + (rise ? 't = \u2212' + TAU + ' ln(1 \u2212 ' + q + '/' + sym + ')' : 't = \u2212' + TAU + ' ln(' + q + '/' + sym + ')') + '\n' + (rise ? 'ln(1 \u2212 ' + qText(tgD, qu) + ' / ' + qText(roundSig(decFromDouble(Fv), 6), qu) + ')' : 'ln(' + qText(tgD, qu) + ' / ' + qText(roundSig(decFromDouble(Fv), 6), qu) + ')') + ' \u2192 n = ' + nTxt(nStar, sig) + '\nt = n ' + TAU + ' = ' + nTxt(nStar, sig) + ' \u00d7 ' + qText(tauD, 's') + ' = ' + qText(roundSig(decFromDouble(tStar), sig), 's') });
    if (far) warnings.push('The time is more than 700 time constants, beyond the double-precision range, so the small part is shown from its base-10 logarithm and is approximate (about 10 digits).');
    /* check: the law run backwards */
    var chk = { ok: true, detail: '' };
    if (!far && n < (rise ? 12 : 30) && n > 1e-9) { var fb = V.f && Fv !== 0 ? (rise ? Fv * one : Fv * ex) / Fv : 0, nb = rise ? -Math.log1p(-fb) : -Math.log(fb); chk = { ok: Math.abs(nb - n) <= 1e-9 * Math.max(1, n), detail: 'Running the law backwards from the result gives n = ' + nTxt(nb, 12) + ', the same exponent.' }; }
    else chk.detail = 'The exponent is too small or too large for a meaningful backwards check; the formulas above are exact.';
    if (tStar !== null) { var yb = Fv * (rise ? -Math.expm1(-nStar) : Math.exp(-nStar)), tgv = toNumber(V.tg); chk.ok = chk.ok && (tgv === 0 ? Math.abs(yb) <= 1e-12 * Math.abs(Fv) : Math.abs(yb - tgv) <= 1e-9 * Math.abs(tgv)); chk.detail += ' The target time puts the ' + qn.toLowerCase() + ' back at the target.'; }
    /* the curve */
    var xmax = n <= 5 ? 5 : n <= 10 ? 10 : n <= 20 ? 20 : n <= 40 ? 40 : 5, drawn = n <= 40, pts = [], N = 240, ymin = Math.min(0, Fv), ymax = Math.max(0, Fv);
    for (i = 0; i <= N; i++) { var xx = xmax * i / N; pts.push([xx, Fv * (rise ? -Math.expm1(-xx) : Math.exp(-xx))]); }
    var xt = []; for (i = 0; i <= xmax; i += niceStep(xmax)) xt.push({ x: i, l1: i === 0 ? '0' : i + TAU, l2: i === 0 ? '' : gtext(i * tau, 's') });
    var spec = { title: name + ': ' + qn.toLowerCase() + ' against time', desc: 'Time constant ' + qText(tauD, 's') + '. ' + qn + ' ' + (rise ? 'rises from 0 towards ' : 'falls from ') + qText(roundSig(decFromDouble(Fv), 6), qu) + (rise ? '' : ' towards 0') + '. At t = ' + qText(tD, 's') + ' (' + nTxt(n, 6) + ' ' + TAU + ') it is ' + valT + '. Time runs to ' + xmax + ' time constants.', xlabel: 'Time in time constants (' + TAU + '), with the time below', ylabel: qn + ' (' + qu + ')', formula: m.formula, xmax: xmax, ymin: ymin, ymax: ymax, pts: pts, xticks: xt, mark: drawn && n <= xmax ? { x: n, y: Fv * f, label: valT } : null, unit: qu, yfmt: function (v) { return gtext(v, qu); }, guides: [1, 2, 3, 4, 5].filter(function (g) { return g <= xmax; }).map(function (g) { return { x: g, y: Fv * (rise ? -Math.expm1(-g) : Math.exp(-g)), l: pct(rise ? -Math.expm1(-g) : Math.exp(-g), 3) }; }), note: drawn ? '' : 'result beyond 40 ' + TAU + ', not marked' };
    return { ok: true, kind: 'exp', mode: m.key, modeName: m.name, formula: m.formula, sig: sig, cards: cards, tables: tables, facts: facts, steps: steps, warnings: warnings, check: chk, inputs: inT, approx: approx, tau: tau, n: n, value: Fv * f, tStar: tStar, nStar: nStar, graphSpec: spec, headline: name + ': ' + q + '(' + qText(tD, 's') + ') = ' + valT + ', ' + TAU + ' = ' + qText(tauD, 's') + (tStar !== null ? '; reaches ' + qText(tgD, qu) + ' at ' + qText(roundSig(decFromDouble(tStar), sig), 's') : '') };
  }

  function runGeneral(m, V, T, sigKey) {
    var sig = sigN(sigKey, false), kind = m.gen, y0 = toNumber(V.y), k = toNumber(V.k), t = toNumber(V.t), comp = kind === 'compound', grow = kind !== 'decay';
    var L = comp ? Math.log1p(k / 100) : (grow ? k : -k), n = comp ? t : k * t, ex0 = comp ? t * L : (grow ? n : -n);
    if (!isFinite(ex0)) return { ok: false, field: 't', error: 'The exponent is outside the range this calculator can handle.' };
    if (Math.abs(ex0) > 100000) return { ok: false, field: 't', error: 'The exponent is beyond \u00b1100000 (it is ' + nTxt(ex0, 6) + '). Use a smaller time or rate.' };
    var vv = y0 * Math.exp(ex0), farF = Math.abs(ex0) > 700, far = farF || !isFinite(vv) || (vv !== 0 && Math.abs(vv) < 1e-300), approx = far, l10 = ex0 / Math.LN10, factorD = farF ? decFromLog(1, l10) : decFromDouble(Math.exp(ex0));
    var yD = far ? (y0 === 0 ? zero() : decFromLog(y0 < 0 ? -1 : 1, Math.log10(Math.abs(y0)) + l10)) : decFromDouble(vv);
    var chgD = pctDec(ex0);
    var cards = [], tables = [], steps = [], facts = [], warnings = [];
    var inT = { y: T.y.replace(/\s+/g, ''), k: T.k.replace(/\s+/g, ''), t: T.t.replace(/\s+/g, '') }; if (T.tg && T.tg.replace(/\s+/g, '')) inT.tg = T.tg.replace(/\s+/g, '');
    var per = comp ? 'period' : 'unit of time', unitN = comp ? 'periods' : 'time units';
    var yT = qText(roundSig(yD, sig), ''), yS = qSci(roundSig(yD, sig), '');
    cards.push(card(comp ? 'Amount after ' + inT.t + ' periods' : 'Value at t = ' + inT.t, yT, yT, (approx ? 'approximate (beyond the double range): ' : '') + yS));
    cards.push(card('Growth factor', qText(roundSig(factorD, sig), ''), qText(roundSig(factorD, sig), ''), comp ? '(1 + r/100)^n = e^(n ln(1 + r/100)) = e^(' + nTxt(ex0, sig) + ')' : 'e^(' + (grow ? '' : '\u2212') + 'kt) = e^(' + nTxt(ex0, sig) + ')'));
    cards.push(card('Change', qText(roundSig(chgD, sig), '') + ' %', qText(roundSig(chgD, sig), ''), '(factor \u2212 1) \u00d7 100'));
    var tauK = comp ? (L === 0 ? Infinity : 1 / L) : 1 / k, dbl = comp ? (L === 0 ? Infinity : Math.LN2 / Math.abs(L)) : Math.LN2 / k;
    if (comp) {
      cards.push(card(L > 0 ? 'Doubling time' : L < 0 ? 'Halving time' : 'Doubling time', L === 0 ? 'never (r = 0)' : nTxt(dbl, sig) + ' periods', L === 0 ? '' : nTxt(dbl, sig), 'ln 2 / ln(1 + r/100)'));
      cards.push(card('Equivalent continuous rate', nTxt(L * 100, sig) + ' % per period', nTxt(L * 100, sig), 'ln(1 + r/100) \u00d7 100'));
    } else {
      cards.push(card('e-folding time 1/k', nTxt(tauK, sig) + ' ' + unitN, nTxt(tauK, sig), 'time for the value to change by a factor e'));
      cards.push(card(grow ? 'Doubling time' : 'Half-life', nTxt(dbl, sig) + ' ' + unitN, nTxt(dbl, sig), 'ln 2 / k = ' + nTxt(Math.LN2, sig) + ' \u00d7 (1/k)'));
    }
    /* optional target */
    var tStar = null;
    if (V.tg) {
      var tg = toNumber(V.tg), qq = tg / y0;
      if (!isFinite(tg) || (V.tg.s !== 0 && tg === 0)) return { ok: false, field: 'tg', error: 'Target is outside the range this calculator can handle.' };
      if (comp) return { ok: false, field: 'tg', error: 'This mode has no target.' };
      if (y0 === 0) return { ok: false, field: 'y', error: 'Initial value must not be zero when a target is given.' };
      if (qq <= 0) return { ok: false, field: 'tg', error: qq === 0 ? 'Zero is never reached.' : 'Target has the opposite sign to the initial value; an exponential never changes sign.' };
      if (grow && qq < 1) return { ok: false, field: 'tg', error: 'A growing value never falls back to a target below the initial value ' + qText(roundSig(decFromDouble(y0), 6), '') + '.' };
      if (!grow && qq > 1) return { ok: false, field: 'tg', error: 'A decaying value never rises to a target above the initial value ' + qText(roundSig(decFromDouble(y0), 6), '') + '.' };
      tStar = Math.log(qq) / (grow ? k : -k);
      cards.push(card('Time to reach ' + qText(roundSig(decFromDouble(tg), sig), ''), nTxt(tStar, sig) + ' ' + unitN, nTxt(tStar, sig), 't = ln(target / y0) / ' + (grow ? 'k' : '(\u2212k)')));
    }
    /* tables */
    var rows = [], i, lim, base = comp ? 1 : tauK;
    if (comp && t >= 1 && t <= 12 && Math.floor(t) === t) { lim = Math.floor(t); for (i = 0; i <= lim; i++) rows.push([String(i), qText(roundSig(valDec(y0, i * L), sig), ''), qText(roundSig(pctDec(i * L), sig), '') + ' %']); tables.push(table('Amount at the end of each period', ['Period', 'Amount', 'Change from start'], rows)); }
    else if (comp) { [0.25, 0.5, 0.75, 1].forEach(function (p) { var pe = t * p; rows.push([qText(roundSig(decFromDouble(pe), sig), ''), qText(roundSig(valDec(y0, pe * L), sig), ''), qText(roundSig(pctDec(pe * L), sig), '') + ' %']); }); tables.push(table('Amount at quarter points of the span', ['Period', 'Amount', 'Change from start'], rows)); }
    else { for (i = 0; i <= 5; i++) { var fe = Math.exp(grow ? i : -i); rows.push([String(i), nTxt(i * tauK, sig), qText(roundSig(valDec(y0, grow ? i : -i), sig), ''), qText(roundSig(decFromDouble(fe), sig), '')]); } tables.push(table('Value at whole e-folding times (1/k)', ['Multiples of 1/k', 'Time', 'Value', 'Factor'], rows)); }
    /* working */
    steps.push({ title: 'The law', text: m.name + ':   ' + m.formula + '\n' + (comp ? 'Each period multiplies the amount by 1 + r/100 = ' + nTxt(1 + k / 100, sig) + ', so n periods multiply it by (1 + r/100)^n = e^(n ln(1 + r/100)).' : 'k is the rate per unit of time; 1/k is the e-folding time.') });
    steps.push({ title: 'The exponent', text: comp ? 'ln(1 + r/100) = ln(' + nTxt(1 + k / 100, sig) + ') = ' + nTxt(L, sig) + '\nn ln(1 + r/100) = ' + nTxt(t, sig) + ' \u00d7 ' + nTxt(L, sig) + ' = ' + nTxt(ex0, sig) : (grow ? '' : '\u2212') + 'k t = ' + (grow ? '' : '\u2212') + nTxt(k, sig) + ' \u00d7 ' + nTxt(t, sig) + ' = ' + nTxt(ex0, sig) });
    steps.push({ title: 'The result', text: 'factor = e^(' + nTxt(ex0, sig) + ') = ' + qText(roundSig(factorD, sig), '') + '\n' + (comp ? 'A' : 'y(t)') + ' = ' + qText(roundSig(decFromDouble(y0), 6), '') + ' \u00d7 ' + qText(roundSig(factorD, sig), '') + ' = ' + yT + '   (' + yS + ')' });
    if (tStar !== null) steps.push({ title: 'Time to reach the target', text: 'Solve for t: t = ln(target / y0) / ' + (grow ? 'k' : '(\u2212k)') + ' = ln(' + qText(roundSig(decFromDouble(toNumber(V.tg)), 6), '') + ' / ' + qText(roundSig(decFromDouble(y0), 6), '') + ') / ' + nTxt(grow ? k : -k, sig) + ' = ' + nTxt(tStar, sig) + ' ' + unitN });
    if (far) warnings.push('The value is outside the double-precision range (exponent beyond 700, or a result above 1e308 or below 1e-300), so it is shown from its base-10 logarithm and is approximate (about 10 digits).');
    var chk = { ok: true, detail: 'The formulas are exact; the result carries about 15 reliable digits.' };
    if (!far && Math.abs(ex0) > 1e-9 && Math.abs(ex0) < 30) { var rb = comp ? Math.log(Math.exp(ex0)) / L : Math.log(Math.exp(ex0)) / (grow ? k : -k); chk = { ok: Math.abs(rb - t) <= 1e-9 * Math.max(1, Math.abs(t)), detail: 'Taking the logarithm of the factor and dividing by ' + (comp ? 'ln(1 + r/100)' : (grow ? 'k' : '\u2212k')) + ' returns t = ' + nTxt(rb, 12) + '.' }; }
    /* the curve */
    var xmax, xt = [], pts = [], N = 240, xs = comp ? Math.max(t, 1) : 1, ymax2, ymin2;
    if (comp) { xmax = t > 0 ? t : 1; } else { var nt = k * t; xmax = nt <= 5 ? 5 : nt <= 10 ? 10 : nt <= 20 ? 20 : nt <= 40 ? 40 : 5; }
    var drawn = comp ? true : k * t <= 40, yAt = function (x) { return comp ? y0 * Math.exp(x * L) : y0 * Math.exp((grow ? 1 : -1) * x); };
    for (i = 0; i <= N; i++) { var xx = xmax * i / N; pts.push([xx, yAt(xx)]); }
    var vals = pts.map(function (p) { return p[1]; }); ymin2 = Math.min.apply(null, vals.concat(0)); ymax2 = Math.max.apply(null, vals.concat(0));
    if (comp) { var st = xmax <= 12 ? 1 : niceStep(xmax / 2) * Math.ceil(xmax / 12 / niceStep(xmax / 2)); st = xmax <= 12 ? 1 : Math.ceil(xmax / 10); for (i = 0; i <= xmax + 1e-9; i += st) xt.push({ x: i, l1: nTxt(i, 3), l2: '' }); if (xmax % 1 !== 0 || xmax > 12) { xt = []; for (i = 0; i <= 4; i++) xt.push({ x: xmax * i / 4, l1: nTxt(xmax * i / 4, 3), l2: '' }); } }
    else for (i = 0; i <= xmax; i += niceStep(xmax)) xt.push({ x: i, l1: i === 0 ? '0' : i + TAU, l2: i === 0 ? '' : nTxt(i * tauK, 3) });
    var spec = { title: m.name + ': value against ' + (comp ? 'period' : 'time'), desc: m.name + ' from ' + qText(roundSig(decFromDouble(y0), 6), '') + '. ' + (comp ? 'Growth ' + nTxt(k, 6) + ' % per period over ' + nTxt(t, 6) + ' periods ends at ' + yT + '.' : 'Rate k = ' + nTxt(k, 6) + ' per unit of time; at t = ' + nTxt(t, 6) + ' the value is ' + yT + '. The axis is in e-folding times 1/k = ' + nTxt(tauK, 6) + '.'), xlabel: comp ? 'Periods (n)' : 'Time in e-folding times (1/k), with the time below', ylabel: 'Value', formula: m.formula, xmax: xmax, ymin: ymin2, ymax: ymax2, pts: pts, xticks: xt, mark: drawn && (comp ? t <= xmax : k * t <= xmax) ? { x: comp ? t : k * t, y: y0 * Math.exp(ex0), label: yT } : null, unit: '', yfmt: function (v) { return gtext(v, ''); }, guides: [], note: drawn ? '' : 'result beyond 40 e-folding times, not marked' };
    if (comp && t === 0) spec.mark = { x: 0, y: y0, label: yT };
    if (!pts.every(function (p) { return isFinite(p[1]); }) || !isFinite(ymax2 - ymin2) || (spec.mark && !isFinite(spec.mark.y))) spec = null;
    return { ok: true, kind: 'exp', mode: m.key, modeName: m.name, formula: m.formula, sig: sig, cards: cards, tables: tables, facts: facts, steps: steps, warnings: warnings, check: chk, inputs: inT, approx: approx, n: ex0, value: y0 * Math.exp(ex0), tStar: tStar, graphSpec: spec, headline: comp ? 'Compound growth: ' + inT.y + ' at ' + inT.k + ' % for ' + inT.t + ' periods = ' + yT : m.name + ': y(' + inT.t + ') = ' + yT + ' (y0 = ' + inT.y + ', k = ' + inT.k + ')' + (tStar !== null ? '; reaches ' + qText(roundSig(decFromDouble(toNumber(V.tg)), sig), '') + ' at t = ' + nTxt(tStar, sig) : '') };
  }

  /* ---------- the graph: one SVG, white background so the file stands alone ---------- */
  function graph(r) {
    var s = r && r.graphSpec; if (!s) return '';
    var W = 760, Hh = 420, Lm = 74, Rm = 18, Tp = 38, B = 76, pw = W - Lm - Rm, ph = Hh - Tp - B, out = [], i;
    var span = s.ymax - s.ymin || 1, xs = function (x) { return Lm + x / s.xmax * pw; }, ys = function (y) { return Tp + ph - (y - s.ymin) / span * ph; };
    out.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + Hh + '" width="' + W + '" height="' + Hh + '" role="img" aria-labelledby="eg-t eg-d" font-family="Arial, Helvetica, sans-serif">');
    out.push('<title id="eg-t">' + esc(s.title) + '</title><desc id="eg-d">' + esc(s.desc) + '</desc><defs><clipPath id="eg-clip"><rect x="' + Lm + '" y="' + Tp + '" width="' + pw + '" height="' + ph + '"/></clipPath></defs><rect width="' + W + '" height="' + Hh + '" fill="#ffffff"/>');
    out.push('<text x="' + Lm + '" y="22" font-size="15" font-weight="700" fill="#1a1a1a">' + esc(s.title) + '</text>');
    for (i = 0; i <= 4; i++) { var yv = s.ymin + span * i / 4, y = ys(yv); out.push('<line x1="' + Lm + '" y1="' + y.toFixed(1) + '" x2="' + (Lm + pw) + '" y2="' + y.toFixed(1) + '" stroke="#d9d9d9"/><text x="' + (Lm - 8) + '" y="' + (y + 4).toFixed(1) + '" font-size="11" text-anchor="end" fill="#333">' + esc(s.yfmt(yv)) + '</text>'); }
    s.xticks.forEach(function (t) { var x = xs(t.x); out.push('<line x1="' + x.toFixed(1) + '" y1="' + Tp + '" x2="' + x.toFixed(1) + '" y2="' + (Tp + ph) + '" stroke="#ececec"/><text x="' + x.toFixed(1) + '" y="' + (Tp + ph + 16) + '" font-size="11" text-anchor="middle" fill="#333">' + esc(t.l1) + '</text>' + (t.l2 ? '<text x="' + x.toFixed(1) + '" y="' + (Tp + ph + 29) + '" font-size="10" text-anchor="middle" fill="#6b6b6b">' + esc(t.l2) + '</text>' : '')); });
    out.push('<rect x="' + Lm + '" y="' + Tp + '" width="' + pw + '" height="' + ph + '" fill="none" stroke="#6b6b6b"/>');
    out.push('<text x="' + (Lm + pw / 2) + '" y="' + (Hh - 14) + '" font-size="12" text-anchor="middle" fill="#1a1a1a">' + esc(s.xlabel) + '</text>');
    out.push('<text transform="translate(16 ' + (Tp + ph / 2) + ') rotate(-90)" font-size="12" text-anchor="middle" fill="#1a1a1a">' + esc(s.ylabel) + '</text>');
    out.push('<polyline clip-path="url(#eg-clip)" fill="none" stroke="#b8860b" stroke-width="2.5" points="' + s.pts.map(function (p) { return xs(p[0]).toFixed(1) + ',' + ys(p[1]).toFixed(1); }).join(' ') + '"/>');
    (s.guides || []).forEach(function (g) { var mx = xs(g.x), my = ys(g.y); out.push('<circle cx="' + mx.toFixed(1) + '" cy="' + my.toFixed(1) + '" r="3.2" fill="#b8860b"/><text x="' + (mx + 6).toFixed(1) + '" y="' + (my - 6).toFixed(1) + '" font-size="10" fill="#7a5a00">' + esc(g.l) + '</text>'); });
    if (s.mark) { var px = xs(s.mark.x), py = ys(s.mark.y); out.push('<line x1="' + px.toFixed(1) + '" y1="' + Tp + '" x2="' + px.toFixed(1) + '" y2="' + (Tp + ph) + '" stroke="#1a1a1a" stroke-width="1.5" stroke-dasharray="3 3"/><line x1="' + Lm + '" y1="' + py.toFixed(1) + '" x2="' + px.toFixed(1) + '" y2="' + py.toFixed(1) + '" stroke="#1a1a1a" stroke-width="1.5" stroke-dasharray="3 3"/><circle class="res" cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="6" fill="#ffffff" stroke="#1a1a1a" stroke-width="2.5"/><text x="' + Math.min(px + 10, Lm + pw - 4).toFixed(1) + '" y="' + Math.max(py - 10, Tp + 12).toFixed(1) + '" font-size="12" font-weight="700" text-anchor="' + (px + 10 > Lm + pw - 90 ? 'end' : 'start') + '" fill="#1a1a1a">' + esc(s.mark.label) + '</text>'); }
    out.push('<line x1="' + (Lm + 10) + '" y1="' + (Tp + 13) + '" x2="' + (Lm + 40) + '" y2="' + (Tp + 13) + '" stroke="#b8860b" stroke-width="2.5"/><text x="' + (Lm + 48) + '" y="' + (Tp + 17) + '" font-size="11" fill="#1a1a1a">' + esc(s.formula) + (s.note ? ' (' + esc(s.note) + ')' : '') + '</text>');
    out.push('</svg>');
    return out.join('');
  }

  /* ---------- run ---------- */
  function run(o) {
    o = o || {};
    var m = MBY[o.mode] || MODES[0], sigKey = SIGS.indexOf(String(o.sig)) >= 0 ? String(o.sig) : m.sigDef;
    var rd = readFields(m, o);
    if (rd.empty) return { ok: false, empty: true, error: '', mode: m.key };
    if (rd.bad) return rd.bad;
    var V = rd.vals, T = rd.text, r;
    if (m.key === 'notation') r = runNotation(m, V, T, sigKey);
    else if (m.key === 'power10') r = runPower10(m, V, T, sigKey);
    else if (m.key === 'prefix') r = runPrefix(m, V, T, sigKey);
    else if (m.circuit) r = runCircuit(m, V, T, sigKey);
    else r = runGeneral(m, V, T, sigKey);
    if (r.ok) { r.sigKey = sigKey; r.group = m.group; }
    return r;
  }

  /* ---------- exports ---------- */
  function headline(r) { return r.headline; }
  function exportTxt(r) {
    var o = ['Elecmetric Exponent Calculator, Mode 05: Engineering Powers & Scientific Notation', '', 'Calculation: ' + r.modeName + '  (' + r.formula + ')', 'Inputs: ' + Object.keys(r.inputs).map(function (k) { return k + ' = ' + r.inputs[k]; }).join(', '), '', 'Result: ' + r.headline, ''];
    r.cards.forEach(function (c) { o.push(c.label + ': ' + c.text + (c.sub ? '   (' + c.sub + ')' : '')); });
    r.facts.forEach(function (f) { o.push(f[0] + ': ' + f[1]); });
    r.warnings.forEach(function (w) { o.push('Note: ' + w); });
    r.tables.forEach(function (t) { o.push('', t.title); o.push(t.head.join(' | ')); t.rows.forEach(function (x) { o.push(x.join(' | ')); }); });
    o.push('', 'Working'); r.steps.forEach(function (s) { o.push(s.title, s.text, ''); });
    o.push('Check: ' + (r.check.ok ? 'passed. ' : 'FAILED. ') + r.check.detail);
    return o.join('\n');
  }
  function csvCell(x) { x = String(x); return /[",\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; }
  function exportCsv(r) {
    var rows = [['item', 'value', 'note']]; rows.push(['calculation', r.modeName, r.formula]);
    Object.keys(r.inputs).forEach(function (k) { rows.push(['input ' + k, r.inputs[k], '']); });
    r.cards.forEach(function (c) { rows.push([c.label, c.copy, c.sub]); });
    r.facts.forEach(function (f) { rows.push([f[0], f[1], '']); });
    r.tables.forEach(function (t) { rows.push([]); rows.push([t.title]); rows.push(t.head); t.rows.forEach(function (x) { rows.push(x); }); });
    return rows.map(function (x) { return x.map(csvCell).join(','); }).join('\n');
  }
  function exportJson(r) {
    return JSON.stringify({ tool: 'Elecmetric Exponent Calculator, Mode 05: Engineering Powers & Scientific Notation', calculation: r.modeName, formula: r.formula, inputs: r.inputs, headline: r.headline, results: r.cards.map(function (c) { return { label: c.label, value: c.text, detail: c.sub }; }), facts: r.facts.map(function (f) { return { label: f[0], value: f[1] }; }), tables: r.tables, warnings: r.warnings, steps: r.steps, check: r.check, approximate: !!r.approx }, null, 2);
  }

  var api = { run: run, parse: parse, graph: graph, headline: headline, exportTxt: exportTxt, exportCsv: exportCsv, exportJson: exportJson, MODES: MODES, PREFIXES: PFX, SIGS: SIGS, PLAIN_MAX: PLAIN_MAX, text: { sci: sciText, eng: engText, e: eText } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ExponentEng = api;
})(typeof self !== 'undefined' ? self : this);
