/* Elecmetric Rounding Calculator: exact engine for Mode 01 (Decimal Place Rounding).
   Rounds a decimal number to a chosen number of decimal places (positive, zero or negative: negative places round to tens, hundreds, thousands)
   with an explicit rounding rule. Everything is integer arithmetic in BigInt on the exact decimal text the person typed, so there is no
   binary floating-point error: 2.675 to two places is 2.68, not 2.67. Math.round and toFixed are never used to produce a result.
   Rules (every tie convention is named in full, as the CEO note requires):
     away     half away from zero          toward0  half towards zero         even  half to even (banker's)   odd  half to odd
     posinf   half towards +infinity       neginf   half towards -infinity    (Calculator.net "half up" = posinf, "half down" = neginf)
     ceiling  towards +infinity            floor    towards -infinity         truncate  towards zero
   A number is held as sign s, a non-negative integer N and a scale k >= 0: x = s * N / 10^k. The result is s * V / 10^p with V an integer
   (p may be negative). Rounding happens once, on the final value; the engine never rounds an intermediate value.
   Works in Node (module.exports) and in the browser (global RND). */
(function (root) {
  'use strict';
  var MAX_DIGITS = 1000, MAX_EXP = 1000, MIN_P = -1000, MAX_P = 1000;
  var MINUS = '\u2212';
  var RULES = [
    ['away', 'Half away from zero', 'a tie goes to the larger size: 2.5 \u2192 3 and \u22122.5 \u2192 \u22123'],
    ['toward0', 'Half towards zero', 'a tie goes to the smaller size: 2.5 \u2192 2 and \u22122.5 \u2192 \u22122'],
    ['even', 'Half to even (banker\u2019s rounding)', 'a tie goes to the neighbour whose last kept digit is even: 2.5 \u2192 2 and 3.5 \u2192 4'],
    ['odd', 'Half to odd', 'a tie goes to the neighbour whose last kept digit is odd: 2.5 \u2192 3 and 3.5 \u2192 3'],
    ['posinf', 'Half towards +\u221e', 'a tie goes to the larger value: 2.5 \u2192 3 and \u22122.5 \u2192 \u22122'],
    ['neginf', 'Half towards \u2212\u221e', 'a tie goes to the smaller value: 2.5 \u2192 2 and \u22122.5 \u2192 \u22123'],
    ['ceiling', 'Ceiling (round up towards +\u221e)', 'anything dropped moves the value up: 2.1 \u2192 3 and \u22122.1 \u2192 \u22122'],
    ['floor', 'Floor (round down towards \u2212\u221e)', 'anything dropped moves the value down: 2.9 \u2192 2 and \u22122.1 \u2192 \u22123'],
    ['truncate', 'Truncate (towards zero)', 'the dropped digits are cut off: 2.9 \u2192 2 and \u22122.9 \u2192 \u22122']
  ];
  var RULE = {}; RULES.forEach(function (r) { RULE[r[0]] = { id: r[0], name: r[1], tie: r[2] }; });
  var NEAREST = { away: 1, toward0: 1, even: 1, odd: 1, posinf: 1, neginf: 1 };
  var MIRROR = { away: 'away', toward0: 'toward0', even: 'even', odd: 'odd', truncate: 'truncate', posinf: 'neginf', neginf: 'posinf', ceiling: 'floor', floor: 'ceiling' };
  var SUP = { '\u2070': '0', '\u00b9': '1', '\u00b2': '2', '\u00b3': '3', '\u2074': '4', '\u2075': '5', '\u2076': '6', '\u2077': '7', '\u2078': '8', '\u2079': '9', '\u207a': '+', '\u207b': '-' };

  function fail(msg) { return { ok: false, error: msg }; }
  function hint(msg) { return { ok: false, empty: true, error: msg, hint: msg }; }
  function P10(n) { return 10n ** BigInt(n); }
  function babs(x) { return x < 0n ? -x : x; }
  function fdiv(a, b) { var q = a / b; if (a % b !== 0n && ((a < 0n) !== (b < 0n))) q -= 1n; return q; }
  function cut(s) { s = String(s); return s.length > 40 ? s.slice(0, 18) + '\u2026' + s.slice(-18) + ' (' + s.length + ' characters)' : s; }
  function groupInt(s) { return s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  /* ---- reading the number: exact decimal text, optional sign, thousands commas, scientific notation ---- */
  function parseNumber(text) {
    var s = String(text === undefined || text === null ? '' : text).replace(/[\u2212\u2013\u2014\u2012]/g, '-').replace(/\u00a0/g, ' ').trim();
    if (s === '') return hint('Type a number to round, for example 15.496.');
    s = s.replace(/\s*[x\u00d7*]\s*10\s*([\u207a\u207b]?[\u2070\u00b9\u00b2\u00b3\u2074-\u2079]+)/, function (m, g) { return 'e' + g.split('').map(function (c) { return SUP[c]; }).join(''); });
    s = s.replace(/\s*[x\u00d7*]\s*10\s*\^\s*([+-]?\d+)\s*$/i, 'e$1');
    if (/^[+-]?(nan|inf|infinity)$/i.test(s)) return fail('\u201c' + s.slice(0, 20) + '\u201d is not a finite number. Enter digits, for example 15.496.');
    if (/^[+-]?\d+\s*\/\s*\d+$/.test(s)) return fail('\u201c' + s.slice(0, 30) + '\u201d is a fraction. Enter it as a decimal, for example 0.125. To round to a fraction such as 1/8, see the Custom Multiple & Fraction mode when it is added.');
    var m = /^([+-]?)\s*([\d,]*)(\.(\d*))?(?:\s*[eE]\s*([+-]?\d+))?$/.exec(s);
    if (!m || (m[2] === '' && (m[4] === undefined || m[4] === ''))) return fail('\u201c' + s.slice(0, 30) + '\u201d is not a number. Use digits with an optional sign, a decimal point and an optional exponent, for example 15.496, \u22122.5 or 1.5e3.');
    var neg = m[1] === '-', ip = m[2], fp = m[4] || '', ex = m[5] === undefined ? 0 : parseInt(m[5], 10), commas = false;
    if (ip.indexOf(',') >= 0) {
      if (!/^\d{1,3}(,\d{3})+$/.test(ip)) return fail('A comma is read only as a thousands separator, followed by exactly three digits, as in 1,499. For a decimal, use a point: 1.499.');
      ip = ip.replace(/,/g, ''); commas = true;
    }
    if (m[5] !== undefined && Math.abs(ex) > MAX_EXP) return fail('The exponent must be between \u2212' + MAX_EXP + ' and ' + MAX_EXP + '.');
    var all = (ip + fp).replace(/^0+/, '');
    if (all.length > MAX_DIGITS) return fail('A number can have at most ' + MAX_DIGITS + ' digits. This one has ' + all.length + '.');
    var N = BigInt((ip + fp) || '0'), k = fp.length - ex;
    if (k < 0) { N *= P10(-k); k = 0; }
    while (k > 0 && N % 10n === 0n) { N /= 10n; k--; }
    if (N === 0n) { neg = false; k = 0; }
    return { ok: true, s: neg ? -1 : 1, N: N, k: k, commas: commas, sci: m[5] !== undefined };
  }
  /* internal: read back a plain decimal string that the engine itself wrote (sign, digits, optional point; no digit limit, so a 1001-digit result can be re-checked) */
  function readPlain(str) {
    var m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(str); if (!m) return null;
    var ip = m[2], fp = m[3] || '', N = BigInt(ip + fp), k = fp.length;
    while (k > 0 && N % 10n === 0n) { N /= 10n; k--; }
    return { s: m[1] === '-' && N !== 0n ? -1 : 1, N: N, k: k };
  }
  function parsePlaces(v) {
    if (v === undefined || v === null || String(v).trim() === '') return hint('Enter the number of decimal places, for example 2. Use a negative number to round to tens (\u22121), hundreds (\u22122) or thousands (\u22123).');
    var t = String(v).replace(/[\u2212\u2013\u2014\u2012]/g, '-').trim();
    if (!/^[+-]?\d+$/.test(t)) return fail('Decimal places must be a whole number such as 2, 0 or \u22122, not \u201c' + t.slice(0, 20) + '\u201d.');
    var p = parseInt(t, 10);
    if (!(p >= MIN_P && p <= MAX_P)) return fail('Decimal places must be between ' + MIN_P + ' and ' + MAX_P + '.');
    return { ok: true, p: p === 0 ? 0 : p };
  }

  /* ---- the rounding itself (exact) ---- */
  function core(s, N, k, p, rule) {
    var V, d, P, q, rem, half, cmp = 'none', up = false;
    if (p >= k) { V = N * P10(p - k); return { V: V, q: V, rem: 0n, d: 0, half: 0n, cmp: 'none', up: false, exact: true, tie: false }; }
    d = k - p; P = P10(d); q = N / P; rem = N % P; half = P / 2n;
    if (rem === 0n) return { V: q, q: q, rem: 0n, d: d, half: half, cmp: 'none', up: false, exact: true, tie: false };
    cmp = rem < half ? 'below' : rem > half ? 'above' : 'tie';
    switch (rule) {
      case 'away': up = cmp !== 'below'; break;
      case 'toward0': up = cmp === 'above'; break;
      case 'even': up = cmp === 'above' || (cmp === 'tie' && q % 2n === 1n); break;
      case 'odd': up = cmp === 'above' || (cmp === 'tie' && q % 2n === 0n); break;
      case 'posinf': up = cmp === 'above' || (cmp === 'tie' && s > 0); break;
      case 'neginf': up = cmp === 'above' || (cmp === 'tie' && s < 0); break;
      case 'ceiling': up = s > 0; break;
      case 'floor': up = s < 0; break;
      case 'truncate': up = false; break;
      default: throw new Error('unknown rounding rule ' + rule);
    }
    return { V: up ? q + 1n : q, q: q, rem: rem, d: d, half: half, cmp: cmp, up: up, exact: false, tie: cmp === 'tie' };
  }
  /* s * V / 10^p as text. keepZeros pads or trims the decimal part; V = 0 is never negative. */
  function fmtV(s, V, p, keepZeros, group) {
    var neg = s < 0 && V !== 0n, ip, fp = '', str;
    if (p <= 0) { ip = (V * P10(-p)).toString(); }
    else { str = V.toString(); if (str.length < p + 1) str = new Array(p + 2 - str.length).join('0') + str; ip = str.slice(0, str.length - p); fp = str.slice(str.length - p); if (!keepZeros) fp = fp.replace(/0+$/, ''); }
    if (group) ip = groupInt(ip);
    return (neg ? '-' : '') + ip + (fp ? '.' + fp : '');
  }
  /* a BigInt at scale c (value = v / 10^c) as text; trim removes trailing zeros of the decimal part */
  function fmtScaled(v, c, trim) {
    var neg = v < 0n, str = babs(v).toString(), ip, fp = '';
    if (c > 0) { if (str.length < c + 1) str = new Array(c + 2 - str.length).join('0') + str; ip = str.slice(0, str.length - c); fp = str.slice(str.length - c); if (trim) fp = fp.replace(/0+$/, ''); } else ip = str;
    return (neg && v !== 0n ? '-' : '') + ip + (fp ? '.' + fp : '');
  }
  function plain(s, N, k) { return fmtScaled(BigInt(s) * N, k, true); }
  function sciOf(shown) {
    var neg = shown.charAt(0) === '-', t = neg ? shown.slice(1) : shown, parts = t.replace(/,/g, '').split('.'), ip = parts[0], fp = parts[1] || '', all = ip + fp, idx = all.search(/[1-9]/);
    if (idx < 0) return { text: '0', e: '0', mant: '0', exp: 0 };
    var exp = ip.length - 1 - idx, digs = all.slice(idx);
    if (!fp) digs = digs.replace(/0+$/, '') || '0';
    var mant = digs.charAt(0) + (digs.length > 1 ? '.' + digs.slice(1) : '');
    return { mant: (neg ? '-' : '') + mant, exp: exp, text: (neg ? MINUS : '') + mant + ' \u00d7 10^' + exp, e: (neg ? '-' : '') + mant + 'e' + exp };
  }
  function placeName(p) {
    var pos = ['units (whole numbers)', 'tenths', 'hundredths', 'thousandths', 'ten-thousandths', 'hundred-thousandths', 'millionths'], neg = ['', 'tens', 'hundreds', 'thousands', 'ten-thousands', 'hundred-thousands', 'millions'];
    if (p >= 0) return p < pos.length ? pos[p] : '10^\u2212' + p + ' place';
    return -p < neg.length ? neg[-p] : '10^' + (-p) + ' place';
  }
  function placesText(p) { return p === 0 ? '0 decimal places (nearest whole number)' : p > 0 ? p + ' decimal place' + (p === 1 ? '' : 's') : p + ' decimal places (nearest ' + (RND_UNIT(-p)) + ')'; }
  function RND_UNIT(n) { return n <= 3 ? ['', 'ten', 'hundred', 'thousand'][n] : '10^' + n; }

  /* exact decimal expansion of the binary double nearest to the typed number, to show why binary floating point can round the wrong way */
  function exactDouble(x) {
    if (!isFinite(x) || x === 0) return null;
    var dv = new DataView(new ArrayBuffer(8)); dv.setFloat64(0, Math.abs(x));
    var hi = dv.getUint32(0), lo = dv.getUint32(4), e = (hi >>> 20) & 0x7ff, m = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo);
    if (e === 0) e = 1; else m |= 1n << 52n;
    e -= 1075;
    var N, k;
    if (e >= 0) { N = m << BigInt(e); k = 0; } else { N = m * (5n ** BigInt(-e)); k = -e; }
    while (k > 0 && N % 10n === 0n) { N /= 10n; k--; }
    return (x < 0 ? '-' : '') + fmtScaled(N, k, true);
  }

  function solve(opts) {
    opts = opts || {};
    var num = opts.parsed && opts.parsed.ok ? opts.parsed : parseNumber(opts.text);
    if (!num.ok) return num;
    var pp = parsePlaces(opts.places); if (!pp.ok) return pp;
    var rule = opts.rule === undefined || opts.rule === null || opts.rule === '' ? 'away' : opts.rule;
    if (!RULE[rule]) return fail('Unknown rounding rule \u201c' + String(rule).slice(0, 30) + '\u201d.');
    var keepZeros = opts.keepZeros === undefined ? true : !!opts.keepZeros, group = !!opts.group;
    var s = num.s, N = num.N, k = num.k, p = pp.p;
    var warnings = [], notes = [], steps = [], verify = [];
    var xs = plain(s, N, k), xShown = cut(xs);
    var c = Math.max(k, p, 0), Xs = BigInt(s) * N * P10(c - k), U = P10(c - p);
    var o = core(s, N, k, p, rule), V = o.V, rs = V === 0n ? 1 : s, Rs = BigInt(rs) * V * P10(c - p), diff = Rs - Xs, ad = babs(diff);
    var result = fmtV(rs, V, p, keepZeros, false), shown = group ? fmtV(rs, V, p, keepZeros, true) : result, sci = sciOf(result);
    var rMinimal = fmtV(rs, V, p, false, false);
    var Fl = fdiv(Xs, U), F = Fl * U, Cc = Xs % U === 0n ? F : F + U, between = Xs % U !== 0n, tieX = false;
    if (between) tieX = (Xs - F) * 2n === U;
    var Fu = Fl + 1n, lowerText = fmtV(Fl < 0n ? -1 : 1, babs(Fl), p, true, false), upperText = fmtV(Fu < 0n ? -1 : 1, babs(Fu), p, true, false);
    var diffText = fmtScaled(ad, c, true), signedText = fmtScaled(diff, c, true);
    var unitText = fmtScaled(U, c, true);
    var halfText = fmtScaled(5n * P10(c - p), c + 1, true);
    var dir = diff > 0n ? 'up' : diff < 0n ? 'down' : 'none', mag = babs(Rs) > babs(Xs) ? 'away' : babs(Rs) < babs(Xs) ? 'toward' : 'none';
    var dirText = dir === 'none' ? 'No change: the number is already exact at this precision.' : 'Rounded ' + dir + ' (the result is ' + (dir === 'up' ? 'larger' : 'smaller') + ' than the original) and ' + (mag === 'away' ? 'away from zero' : 'towards zero') + '.';
    if (o.exact && p >= k && k < p) notes.push('The number has ' + k + ' decimal place' + (k === 1 ? '' : 's') + ', fewer than the ' + p + ' asked for, so nothing is dropped and the value does not change. ' + (keepZeros ? 'Trailing zeros are added to show ' + p + ' places.' : 'Trailing zeros are switched off, so none are added.'));
    else if (o.exact && p >= k) notes.push('Nothing is dropped at this precision, so the value does not change.');
    if (s < 0 && V === 0n) notes.push('The negative number rounds to zero. It is shown as 0, never as a negative zero.');
    if (num.commas) notes.push('Commas in the number were read as thousands separators.');
    if (num.sci) notes.push('The number was typed in scientific notation and is read exactly as ' + cut(xs) + '.');
    if (tieX) notes.push('The number is exactly halfway between two candidates, so the rounding rule decides the result. The same number rounds differently under different rules, as the table below shows.');
    /* the floating-point comparison */
    var floatNote = null;
    if (p >= 0 && p <= 100 && N !== 0n && xs.length < 340) {
      var fl = Number(xs);
      if (isFinite(fl) && Math.abs(fl) < 1e21) {
        var ft = fl.toFixed(p); if (/^-0(\.0*)?$/.test(ft)) ft = ft.slice(1);
        var oa = core(s, N, k, p, 'away'), ea = fmtV(oa.V === 0n ? 1 : s, oa.V, p, true, false);
        if (ft !== ea) { var ed = exactDouble(fl); floatNote = { floatResult: ft, exactResult: ea, stored: ed, text: 'Many calculators work in binary floating point, where ' + xShown + ' is stored as ' + (ed ? (ed.length > 90 ? ed.slice(0, 88) + '\u2026' : ed) : 'a nearby binary value') + ', and so round it to ' + ft + '. Elecmetric reads the decimal text exactly and rounds it half away from zero to ' + ea + '.' }; }
      }
    }
    /* ---- step by step ---- */
    var neg = s < 0;
    steps.push('Read the number exactly: ' + (neg ? MINUS : '') + cut(plain(1, N, k)) + (neg ? ' (negative)' : '') + (k > 0 ? ', with ' + k + ' decimal place' + (k === 1 ? '' : 's') : ', a whole number') + '. It is held as an exact decimal, not as a binary floating-point value.');
    steps.push('Round to ' + placesText(p) + ': keep the digits down to the ' + placeName(p) + ' place and look at what is dropped. One unit in that place is ' + unitText + '.');
    if (o.exact) steps.push(N === 0n ? 'The number is zero, so there is nothing to round.' : (p >= k ? 'The number has no digits beyond the ' + placeName(p) + ' place, so there is nothing to drop and the value is unchanged.' : 'The digits beyond the ' + placeName(p) + ' place are all zero, so the number is already exact at this precision.'));
    else {
      var keptT = fmtV(1, o.q, p, true, false), dropT = fmtScaled(o.rem, k, true), halfT = fmtScaled(o.half, k, true);
      steps.push((neg ? 'Work with the size (absolute value), ' + cut(plain(1, N, k)) + '; the sign is put back at the end. ' : '') + 'Kept part: ' + keptT + '. Dropped part: ' + dropT + '.');
      if (NEAREST[rule]) {
        steps.push('Compare the dropped part with half a unit, ' + halfT + ': it is ' + (o.cmp === 'below' ? 'less than half, so the size stays at ' + keptT + '.' : o.cmp === 'above' ? 'more than half, so the size goes up by one unit.' : 'exactly half, a tie. The rule \u201c' + RULE[rule].name + '\u201d decides: ' + RULE[rule].tie + '. Here the ' + (neg ? 'negative' : 'positive') + ' size ' + (o.up ? 'goes up by one unit' : 'stays at ' + keptT) + (rule === 'even' || rule === 'odd' ? ' (the last kept digit of ' + keptT + ' is ' + (o.q % 2n === 0n ? 'even' : 'odd') + ')' : '') + '.'));
      } else {
        steps.push('The rule \u201c' + RULE[rule].name + '\u201d does not look at half a unit: ' + RULE[rule].tie + '. The dropped part is not zero, and the number is ' + (neg ? 'negative' : 'positive') + ', so the size ' + (o.up ? 'goes up by one unit' : 'stays at ' + keptT) + '.');
      }
      if (o.up) {
        var unit1 = fmtV(1, 1n, p, true, false), sum = fmtV(1, V, p, true, false);
        steps.push('Add one unit: ' + keptT + ' + ' + unit1 + ' = ' + sum + '.' + (V.toString().length > o.q.toString().length ? ' The carry runs through the 9s and adds a digit.' : ''));
      }
    }
    steps.push('Put the sign back: the result is ' + (neg && V !== 0n ? MINUS : '') + cut(fmtV(1, V, p, keepZeros, false)) + (neg && V === 0n ? ' (zero has no sign)' : '') + '.');
    steps.push('Absolute rounding difference: |' + cut(result) + ' ' + MINUS + ' ' + (neg ? '(' + MINUS + cut(plain(1, N, k)) + ')' : cut(xs)) + '| = ' + diffText + '.');
    /* ---- alternatives ---- */
    var alts = RULES.map(function (r) {
      var oo = core(s, N, k, p, r[0]), rr = oo.V === 0n ? 1 : s, R2 = BigInt(rr) * oo.V * P10(c - p), d2 = R2 - Xs;
      return { id: r[0], name: r[1], result: fmtV(rr, oo.V, p, keepZeros, false), diff: fmtScaled(babs(d2), c, true), changed: d2 !== 0n, current: r[0] === rule, tie: oo.tie };
    });
    /* ---- checks ---- */
    var rp = readPlain(result);
    verify.push(['The result is a whole multiple of one unit in the last place (' + unitText + ')', !!rp && (rp.k <= Math.max(p, 0)) && (p >= 0 || (rp.N * P10(rp.k) % P10(-p) === 0n))]);
    verify.push(['The result is one of the two neighbouring multiples of ' + unitText + ' around the original', Rs === F || Rs === Cc]);
    var bound = NEAREST[rule] ? ad * 2n <= U : ad <= U;
    verify.push(['The rounding difference is within the largest error for this rule (' + (NEAREST[rule] ? 'half a unit, ' + halfText : 'one unit, ' + unitText) + ')', bound]);
    var prop;
    if (NEAREST[rule]) prop = (Rs - Xs) * (Rs - Xs) <= (Xs - (Rs === F ? Cc : F)) * (Xs - (Rs === F ? Cc : F)); else if (rule === 'ceiling') prop = Rs >= Xs && Rs === Cc; else if (rule === 'floor') prop = Rs <= Xs && Rs === F; else prop = babs(Rs) <= babs(Xs) && babs(Xs - Rs) < U;
    verify.push([NEAREST[rule] ? 'The result is the nearer neighbour (or a tie, settled by the rule)' : rule === 'ceiling' ? 'The result is the smallest multiple that is not below the original' : rule === 'floor' ? 'The result is the largest multiple that is not above the original' : 'The result is not larger in size than the original and is less than one unit away', prop]);
    var again = rp ? core(rp.s, rp.N, rp.k, p, rule) : null;
    verify.push(['Rounding the result again with the same rule gives the same result', !!again && again.exact]);
    var mo = core(-s, N, k, p, MIRROR[rule]), mr = BigInt(-s) * mo.V;
    verify.push(['Mirror check: rounding the negative of the number with the mirrored rule gives the negative of the result', mr === -(BigInt(s) * V)]);
    var verifyOk = verify.every(function (v) { return v[1] === true; });
    var placesLabel = placesText(p);
    var rows = [
      ['Original number', xShown, 'exact decimal as typed'],
      ['Precision', placesLabel, 'rounds at the ' + placeName(p) + ' place; one unit is ' + unitText],
      ['Rounding rule', RULE[rule].name, RULE[rule].tie],
      ['Rounded result', shown, keepZeros ? 'trailing zeros kept' : 'trailing zeros removed'],
      ['Scientific notation', sci.text, sci.e],
      ['Absolute rounding difference', diffText, '|result \u2212 original|'],
      ['Signed difference', (diff > 0n ? '+' : '') + signedText, 'result \u2212 original'],
      ['Direction', dir === 'up' ? 'up, ' + (mag === 'away' ? 'away from zero' : 'towards zero') : dir === 'down' ? 'down, ' + (mag === 'away' ? 'away from zero' : 'towards zero') : 'unchanged', dirText],
      ['Neighbouring multiples', between ? lowerText + ' and ' + upperText : 'none', between ? (tieX ? 'the number is exactly halfway between them' : 'the original lies between these two multiples of ' + unitText) : 'the original is itself a multiple of ' + unitText],
      ['Largest error for this rule', NEAREST[rule] ? halfText : unitText, NEAREST[rule] ? 'half a unit' : 'one unit']
    ];
    var sentence = cut(xs) + ' \u2192 ' + result + '  (' + placesLabel.replace(/ \(.*\)$/, '') + ', ' + RULE[rule].name.toLowerCase() + ')';
    var summary = ['Rounding Calculator, Mode 01 (Decimal Place Rounding)', 'Number: ' + xShown, 'Precision: ' + placesLabel, 'Rule: ' + RULE[rule].name, 'Rounded result: ' + result, 'Scientific notation: ' + sci.text, 'Absolute rounding difference: ' + diffText, 'Direction: ' + dirText].join('\n');
    return {
      ok: true, x: xs, xShown: xShown, p: p, rule: rule, ruleName: RULE[rule].name, keepZeros: keepZeros, sign: s,
      result: result, resultShown: shown, resultMinimal: rMinimal, sci: sci.text, sciE: sci.e, absDiff: diffText, signedDiff: signedText, direction: dir, magnitude: mag, directionText: dirText,
      unit: unitText, halfUnit: halfText, lower: between ? lowerText : null, upper: between ? upperText : null, tie: tieX, exact: o.exact, cmp: o.cmp, carry: o.up && V.toString().length > o.q.toString().length,
      alts: alts, floatNote: floatNote, steps: steps, verify: verify, verifyOk: verifyOk, rows: rows, notes: notes, warnings: warnings, sentence: sentence, summary: summary, placeName: placeName(p), placesText: placesLabel
    };
  }
  /* shared entry point for other Elecmetric calculators: round a decimal string once, at the end, exactly. Returns the text or null if the input is refused. */
  function roundString(text, places, rule, keepZeros) { var r = solve({ text: text, places: places, rule: rule, keepZeros: keepZeros === undefined ? true : keepZeros }); return r.ok ? r.result : null; }

  var api = { solve: solve, roundString: roundString, parseNumber: parseNumber, parsePlaces: parsePlaces, core: core, fmtV: fmtV, placeName: placeName, placesText: placesText, sciOf: sciOf, exactDouble: exactDouble, RULES: RULES, RULE: RULE, MIRROR: MIRROR, MAX_DIGITS: MAX_DIGITS, MAX_EXP: MAX_EXP, MIN_P: MIN_P, MAX_P: MAX_P };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RND = api;
})(typeof window !== 'undefined' ? window : this);
