/* Elecmetric Binary Calculator, Mode 02: Number System Conversion. Engine: one file, no dependencies, no DOM.
   Required by tests/numconv_test.js and inlined into calculators/number-system-converter/index.html by tools/numconv_page.js.

   Converts between binary, octal, decimal and hexadecimal. Exact (BigInt): a value is held as a ratio M / S^k (S = the source base, k = the digits after the radix point),
   so nothing is rounded on the way in. Integers have no size limit below the digit cap. A fraction that has a finite expansion in the target base is shown in full;
   one that does not (a decimal such as 0.1 in binary) is cut off at the chosen number of digits (truncated, never rounded), marked as cut off, and its exact repeating
   block is given as well, e.g. 0.1 = 0.0(0011) in binary. Nothing is silently truncated.
   Two kinds of reading, always shown to the person:
     "signed"   a value with an optional minus sign, any size, fractions allowed (the number as written).
     fixed width (4, 8, 16, 32 or 64 bits): unsigned, two's complement, one's complement or sign-magnitude. The text is a bit pattern (binary, octal or hex) or, for
                decimal input, a whole number that is encoded into the pattern. 11111111 is 255 unsigned and -1 in 8-bit two's complement.
   Every written step (grouping, division table, multiplication table, place values, encoding) is checked against exact arithmetic; a mismatch throws, so a wrong
   working is never shown. */
(function (root) {
  'use strict';
  var MAXD = 4096, MAXFD = 512, HARD = 4096, TABLE = 128, FTABLE = 32, PLACE = 32;
  var SYS = [['bin', 2, 'Binary'], ['oct', 8, 'Octal'], ['dec', 10, 'Decimal'], ['hex', 16, 'Hexadecimal']];
  var REPS = [['signed', 'Value with a minus sign (any size)'], ['unsigned', 'Unsigned'], ['twos', 'Two’s complement'], ['ones', 'One’s complement'], ['signmag', 'Sign-magnitude']];
  var WIDTHS = [4, 8, 16, 32, 64], FRACS = [8, 16, 32, 64, 128], PADS = ['min', 'match', '4', '8', '16', '32', '64'];
  var DIG = '0123456789ABCDEF', BITS = { 2: 1, 8: 3, 16: 4 };
  var NAME = { 2: 'binary', 8: 'octal', 10: 'decimal', 16: 'hexadecimal' }, CAP = { 2: 'Binary', 8: 'Octal', 10: 'Decimal', 16: 'Hexadecimal' };

  function lpad(s, n, c) { s = String(s); c = c || '0'; while (s.length < n) s = c + s; return s; }
  function rpad(s, n, c) { s = String(s); c = c || ' '; while (s.length < n) s += c; return s; }
  function sys(id) { return SYS.filter(function (d) { return d[0] === id; })[0]; }
  function big(digits, base) { return digits === '' ? 0n : base === 10 ? BigInt(digits) : BigInt((base === 2 ? '0b' : base === 8 ? '0o' : '0x') + digits); }
  function str(n, base) { return n.toString(base).toUpperCase(); }
  function pow(b, e) { return BigInt(b) ** BigInt(e); }
  function popcount(s) { var n = 0, i; for (i = 0; i < s.length; i++) if (s.charAt(i) === '1') n++; return n; }
  function groupBits(s, g) { if (!g) return s; var o = '', i; for (i = 0; i < s.length; i++) { if (i > 0 && (s.length - i) % g === 0) o += ' '; o += s.charAt(i); } return o; }

  /* parse(text, base) -> { ok, neg, base, intDigits, fracDigits, hasPoint, M (BigInt: all digits as one integer), k } or { ok:false, empty?, error } */
  function parse(text, base) {
    var s = String(text == null ? '' : text).trim().replace(/[\s_,]/g, '');
    if (!s) return { ok: false, empty: true, error: 'Enter a number.' };
    var neg = false, m = s.match(/^[+\-−]/);
    if (m) { neg = m[0] !== '+'; s = s.slice(1); }
    var pre = base === 2 ? /^0b/i : base === 8 ? /^0o/i : base === 16 ? /^0x/i : null;
    if (pre) s = s.replace(pre, '');
    if (!s) return { ok: false, error: 'Add digits after the sign or prefix.' };
    var bad = s.replace('.', '').match(base === 2 ? /[^01]/ : base === 8 ? /[^0-7]/ : base === 10 ? /[^0-9]/ : /[^0-9A-Fa-f]/);
    if (s.split('.').length > 2) return { ok: false, error: 'A number can have only one radix point.' };
    if (bad) return { ok: false, error: '‘' + bad[0] + '’ is not a ' + NAME[base] + ' digit. ' + (base === 2 ? 'Binary numbers use only 0 and 1.' : base === 8 ? 'Octal numbers use only 0 to 7.' : base === 10 ? 'Decimal numbers use only 0 to 9.' : 'Hexadecimal numbers use 0 to 9 and A to F.') };
    var hasPoint = s.indexOf('.') >= 0, parts = s.split('.'), id = parts[0].toUpperCase(), fd = (parts[1] || '').toUpperCase();
    if (id === '' && fd === '') return { ok: false, error: 'Add at least one digit.' };
    if (id.length + fd.length > MAXD) return { ok: false, error: 'The number has ' + (id.length + fd.length) + ' digits. The limit is ' + MAXD + '.' };
    if (fd.length > MAXFD) return { ok: false, error: 'The fraction has ' + fd.length + ' digits. The limit is ' + MAXFD + '.' };
    var M = big(id + fd, base);
    if (M === 0n) neg = false;
    return { ok: true, neg: neg, base: base, intDigits: id, fracDigits: fd, hasPoint: hasPoint && fd.length > 0, M: M, k: fd.length };
  }

  /* Digits of the fraction r / D in base T. Returns { digits, terminating, start, period, capped }. start/period describe the repeating block (when found). */
  function expandFrac(r, D, T) {
    var seen = {}, out = [], t = BigInt(T), start = -1;
    while (r !== 0n && out.length < HARD) {
      var key = r.toString();
      if (seen[key] !== undefined) { start = seen[key]; break; }
      seen[key] = out.length; r = r * t; out.push(DIG.charAt(Number(r / D))); r = r % D;
    }
    if (r === 0n) return { digits: out.join(''), terminating: true, start: -1, period: 0, capped: false };
    if (start >= 0) return { digits: out.join(''), terminating: false, start: start, period: out.length - start, capped: false };
    return { digits: out.join(''), terminating: false, start: -1, period: 0, capped: true };
  }
  /* value of a digit string as a ratio: { n, d } with value n / d */
  function ratio(intD, fracD, base) { var k = fracD.length; return { n: big(intD + fracD, base), d: pow(base, k) }; }
  function eqRatio(a, b) { return a.n * b.d === b.n * a.d; }

  /* Describe one target: magnitude M / S^k in base T. padBits widens the integer part only (never truncates). */
  function target(P, T, N, padBits) {
    var S = P.base, D = pow(S, P.k), ip = P.M / D, fr = P.M % D, ex = expandFrac(fr, D, T), intS = str(ip, T), fracS = '', approx = false, repeat = null, note = '';
    if (T !== 10 && padBits) { var w = T === 2 ? padBits : Math.ceil(padBits / (T === 8 ? 3 : 4)); intS = lpad(intS, w); }
    if (ex.terminating) fracS = ex.digits;
    else {
      approx = true; fracS = ex.digits.slice(0, N);
      if (ex.digits.length < N) { /* the cap ended the search before N digits (only if a cycle was found, expand it) */ }
      if (ex.start >= 0) {
        var pre = ex.digits.slice(0, ex.start), blk = ex.digits.slice(ex.start), s2 = pre;
        while (s2.length < N) s2 += blk;
        fracS = s2.slice(0, N); repeat = (intS + '.' + pre + '(' + blk + ')');
        if (blk.length > 64) repeat = null; /* too long to be useful on screen; the period length is still reported */
      }
      note = ex.start >= 0 ? 'repeating, period ' + ex.period : 'period longer than ' + HARD + ' digits';
      if (ex.start < 0 && fracS.length < N) fracS = ex.digits; /* capped */
    }
    /* exactness checks */
    var tr = { n: big(intS + fracS, T), d: pow(T, fracS.length) }, orig = { n: P.M, d: D };
    if (!approx) { if (!eqRatio(tr, orig)) throw new Error('internal check failed: conversion to ' + NAME[T]); }
    else {
      var lo = tr.n * orig.d <= orig.n * tr.d, hi = orig.n * tr.d < (tr.n + 1n) * orig.d;
      if (!(lo && hi)) throw new Error('internal check failed: truncation bound for ' + NAME[T]);
      if (ex.start >= 0) { var pre2 = ex.digits.slice(0, ex.start), blk2 = ex.digits.slice(ex.start), b = BigInt(T), p = blk2.length, num = (big(intS + pre2, T) * (pow(T, p) - 1n) + big(blk2, T)), den = pow(T, pre2.length) * (pow(T, p) - 1n); if (!eqRatio({ n: num, d: den }, orig)) throw new Error('internal check failed: repeating block for ' + NAME[T]); }
    }
    var neg = P.neg;
    return { neg: neg, intText: intS, fracText: fracS, approx: approx, repeat: repeat ? (neg ? '-' : '') + repeat : null, period: ex.start >= 0 ? ex.period : 0, periodLong: ex.start >= 0 && !repeat, capped: ex.capped, exactDigits: ex.terminating ? ex.digits.length : null,
      text: (neg ? '-' : '') + intS + (fracS ? '.' + fracS : '') };
  }

  /* ---- Written working ---------------------------------------------------------------------------------------------------------------------------------- */
  function bitsOfDigit(ch, base) { return lpad(parseInt(ch, 16).toString(2), BITS[base]); }

  /* Integer part, S -> T, as text lines. m is the magnitude (BigInt). */
  function intLines(P, T, m, width) {
    var S = P.base, ds = str(m, S), out = [];
    if (S === T) return null;
    if (S !== 10 && T !== 10) return groupLines(P, T, width);
    if (T === 10) {
      if (ds.length > PLACE) return 'Place values are written for up to ' + PLACE + ' digits. This integer part has ' + ds.length + ' digits, so only the exact result is given: ' + str(m, 10) + '.';
      var tot = 0n, rowD = [], rowW = [], rowV = [], i;
      for (i = 0; i < ds.length; i++) { var e = ds.length - 1 - i, d = BigInt(parseInt(ds.charAt(i), 16)), w = pow(S, e); tot += d * w; rowD.push(ds.charAt(i)); rowW.push(w.toString()); rowV.push((d * w).toString()); }
      if (tot !== m) throw new Error('internal check failed: place values');
      var wd = Math.max.apply(null, rowD.concat(rowW, rowV).map(function (x) { return x.length; })) + 1;
      var fm = function (a) { return a.map(function (x) { return lpad(x, wd, ' '); }).join(''); };
      return ['digit  ' + fm(rowD), 'weight ' + fm(rowW), 'value  ' + fm(rowV), 'Sum of the values = ' + tot.toString() + (S === 16 ? '   (A = 10, B = 11, C = 12, D = 13, E = 14, F = 15)' : '')].join('\n');
    }
    /* S = 10: repeated division */
    var n = m, rows = [], t = BigInt(T);
    if (n === 0n) return 'Zero is 0 in every system.';
    while (n > 0n && rows.length <= TABLE) { var q = n / t, r = n % t; rows.push([n.toString(), q.toString(), DIG.charAt(Number(r))]); n = q; }
    if (n > 0n) return 'The division table is written for up to ' + TABLE + ' steps. This integer part needs more, so only the exact result is given: ' + str(m, T) + '.';
    var w1 = Math.max.apply(null, rows.map(function (x) { return x[0].length; })), w2 = Math.max.apply(null, rows.map(function (x) { return x[1].length; }));
    var txt = rows.map(function (x) { return lpad(x[0], w1, ' ') + ' ÷ ' + T + ' = ' + lpad(x[1], w2, ' ') + '   remainder ' + (T === 16 && parseInt(x[2], 16) > 9 ? x[2] + ' (' + parseInt(x[2], 16) + ')' : x[2]); }).join('\n');
    var read = rows.map(function (x) { return x[2]; }).reverse().join('');
    if (read !== str(m, T)) throw new Error('internal check failed: division table');
    return 'Divide by ' + T + ' again and again; the remainders, read from the last to the first, are the digits.\n' + txt + '\nRead the remainders upward: ' + read;
  }

  /* Grouping method between binary, octal and hexadecimal (S and T both in 2, 8, 16). */
  function groupLines(P, T, width) {
    var S = P.base, ws = BITS[S], wt = BITS[T], id = P.intDigits.replace(/^0+(?=.)/, '') || '0', fd = P.fracDigits.replace(/0+$/, ''), lines = [], bi, bf, i;
    bi = id.split('').map(function (c) { return bitsOfDigit(c, S); }).join('').replace(/^0+(?=.)/, '') ; if (bi === '') bi = '0';
    bf = fd.split('').map(function (c) { return bitsOfDigit(c, S); }).join('');
    if (S !== 2) {
      lines.push('Each ' + NAME[S] + ' digit is ' + ws + ' bit' + (ws > 1 ? 's' : '') + ':');
      lines.push('  ' + id.split('').join(' ') + (fd ? ' . ' + fd.split('').join(' ') : ''));
      lines.push('  ' + id.split('').map(function (c) { return bitsOfDigit(c, S); }).join(' ') + (fd ? ' . ' + fd.split('').map(function (c) { return bitsOfDigit(c, S); }).join(' ') : ''));
      lines.push('  as one run of bits: ' + bi + (bf ? '.' + bf : ''));
    }
    if (T === 2) { var ex = bf.replace(/0+$/, '') === '' ? bi : bi + '.' + bf.replace(/0+$/, ''), run0 = bi + (bf ? '.' + bf : ''); if (ex !== run0) lines.push('Leading zeros and trailing fraction zeros are dropped: ' + ex); return lines.join('\n'); }
    var bi2 = lpad(bi, Math.ceil(bi.length / wt) * wt), bf2 = rpad(bf.replace(/0+$/, ''), Math.ceil(bf.replace(/0+$/, '').length / wt) * wt, '0'), gi = [], gf = [];
    for (i = 0; i < bi2.length; i += wt) gi.push(bi2.slice(i, i + wt));
    for (i = 0; i < bf2.length; i += wt) gf.push(bf2.slice(i, i + wt));
    lines.push('Regroup the bits in ' + (wt === 3 ? 'threes' : 'fours') + ' starting at the radix point (zeros added at the outer ends):');
    lines.push('  ' + gi.join(' ') + (gf.length ? ' . ' + gf.join(' ') : ''));
    var di = gi.map(function (g) { return DIG.charAt(parseInt(g, 2)); }).join('').replace(/^0+(?=.)/, ''), df = gf.map(function (g) { return DIG.charAt(parseInt(g, 2)); }).join('');
    lines.push('Each group is one ' + NAME[T] + ' digit:');
    lines.push('  ' + gi.map(function (g) { return DIG.charAt(parseInt(g, 2)); }).join(' ') + (gf.length ? ' . ' + df.split('').join(' ') : '') + '   →   ' + di + (df ? '.' + df : ''));
    return lines.join('\n');
  }

  /* Fraction part, S -> T as text lines (or null when there is no fraction or the grouping method already covered it). */
  function fracLines(P, T, N) {
    var S = P.base; if (!P.k || P.M % pow(S, P.k) === 0n) return null; if (S === T) return null;
    if (S !== 10 && T !== 10) return null;
    var D = pow(S, P.k), fr = P.M % D, out = [], i;
    if (T === 10) {
      var fd = P.fracDigits.replace(/0+$/, ''), m = Math.log2(S) | 0, tot = 0n, rows = [];
      if (fd.length > PLACE) return 'Place values are written for up to ' + PLACE + ' fraction digits. This fraction has ' + fd.length + ', so only the exact result is given.';
      var scale = pow(10, fd.length * m);
      for (i = 0; i < fd.length; i++) { var j = i + 1, d = BigInt(parseInt(fd.charAt(i), 16)), mm = BigInt(m * j), w = (pow(5, Number(mm))), val = d * w; /* digit x S^-j = digit x 5^(m j) / 10^(m j) */ tot += d * pow(5, Number(mm)) * pow(10, fd.length * m - Number(mm)); rows.push([fd.charAt(i), '0.' + lpad(w.toString(), Number(mm)), val === 0n ? '0' : '0.' + lpad(val.toString(), Number(mm))]); }
      var w1 = Math.max.apply(null, rows.map(function (x) { return x[1].length; })), txt = rows.map(function (x) { return x[0] + ' × ' + S + '^-' + (rows.indexOf(x) + 1) + ' = ' + x[0] + ' × ' + rpad(x[1], w1) + ' = ' + x[2]; }).join('\n');
      var sumS = tot.toString(); sumS = '0.' + lpad(sumS, fd.length * m);
      var chk = ratio('', fd, S); if (chk.n * scale !== tot * chk.d) throw new Error('internal check failed: fraction place values');
      return 'Each digit after the radix point has the weight ' + S + '^-1, ' + S + '^-2, … :\n' + txt + '\nFraction = ' + sumS.replace(/0+$/, '').replace(/\.$/, '.0');
    }
    /* S = 10 -> T in 2, 8, 16: repeated multiplication */
    var r = fr, t = BigInt(T), seen = {}, rowsM = [], cyc = -1, k = P.k, fmt = function (x) { var ip = x / D, fp = x % D; return ip.toString() + '.' + lpad(fp.toString(), k); };
    while (r !== 0n && rowsM.length < FTABLE) { var key = r.toString(); if (seen[key] !== undefined) { cyc = seen[key]; break; } seen[key] = rowsM.length; var p = r * t; rowsM.push([fmt(r), fmt(p), DIG.charAt(Number(p / D))]); r = p % D; }
    var shown = rowsM.map(function (x, n) { return lpad(String(n + 1), 2, ' ') + '.  ' + x[0] + ' × ' + T + ' = ' + x[1] + '   → digit ' + (T === 16 && parseInt(x[2], 16) > 9 ? x[2] + ' (' + parseInt(x[2], 16) + ')' : x[2]); }).join('\n');
    var head = 'Multiply the fraction by ' + T + ' again and again; each whole part is the next digit (read from the first to the last), and the whole part is removed before the next step.\n';
    var ex = expandFrac(fr, D, T), tail;
    if (ex.terminating) tail = '\nThe fraction reaches 0 after ' + ex.digits.length + ' digit' + (ex.digits.length === 1 ? '' : 's') + (rowsM.length < ex.digits.length ? ' (the table shows the first ' + rowsM.length + ')' : '') + ', so the result is exact.';
    else if (ex.start >= 0) tail = '\nThe fraction comes back to a value it had before, so the digits repeat: the block of ' + ex.period + ' digit' + (ex.period === 1 ? '' : 's') + ' starts at digit ' + (ex.start + 1) + (rowsM.length < ex.start + ex.period ? ' (beyond the ' + rowsM.length + ' rows shown)' : '') + '. The expansion never ends, so it is cut off at ' + N + ' digits and marked.';
    else tail = '\nThe digits do not repeat within ' + HARD + ' steps, so the expansion is cut off at ' + N + ' digits and marked.';
    return head + shown + tail;
  }

  /* ---- Fixed width -------------------------------------------------------------------------------------------------------------------------------------- */
  function range(rep, W) {
    var top = pow(2, W - 1), all = pow(2, W);
    if (rep === 'unsigned') return { min: 0n, max: all - 1n };
    if (rep === 'twos') return { min: -top, max: top - 1n };
    return { min: -(top - 1n), max: top - 1n };
  }
  function encode(v, rep, W) {
    var top = pow(2, W - 1), all = pow(2, W);
    if (rep === 'unsigned') return v;
    if (rep === 'twos') return v < 0n ? v + all : v;
    if (rep === 'ones') return v < 0n ? (all - 1n) - (-v) : v;
    return v < 0n ? top + (-v) : v;
  }
  function decode(u, rep, W) {
    var top = pow(2, W - 1), all = pow(2, W), neg = u >= top;
    if (rep === 'unsigned') return { v: u, negZero: false };
    if (rep === 'twos') return { v: neg ? u - all : u, negZero: false };
    if (rep === 'ones') return { v: neg ? -((all - 1n) - u) : u, negZero: u === all - 1n };
    return { v: neg ? -(u - top) : u, negZero: u === top };
  }
  var REPNAME = { unsigned: 'unsigned', twos: 'two’s complement', ones: 'one’s complement', signmag: 'sign-magnitude' };

  function fixedRun(o, from, to, rep, W, notes, steps) {
    var t = String(o.text == null ? '' : o.text), P = parse(t, from[1]);
    if (!P.ok) return P;
    var base = from[1], u, bits, R = range(rep, W), all = pow(2, W);
    if (P.k > 0 && P.M % pow(base, P.k) !== 0n || (P.hasPoint && base !== 10)) return { ok: false, error: 'Fixed-width modes take whole numbers, not fractions. Use “Value with a minus sign” for numbers with a radix point.' };
    var mag = P.M / pow(base, P.k);
    if (base === 10) {
      var v = P.neg ? -mag : mag;
      if (v < R.min || v > R.max) return { ok: false, error: v.toString() + ' does not fit in ' + W + ' bits as ' + REPNAME[rep] + '. The range is ' + R.min + ' to ' + R.max + '.' + (rep === 'unsigned' && v < 0n ? ' Negative numbers need a signed representation, such as two’s complement.' : '') };
      u = encode(v, rep, W);
    } else {
      if (P.neg) return { ok: false, error: 'In a fixed-width mode, enter the bit pattern without a sign, or enter a signed decimal value.' };
      u = mag;
      if (u >= all) return { ok: false, error: 'That pattern needs ' + str(u, 2).length + ' bits, but the selected width is ' + W + ' bits.' };
    }
    bits = lpad(str(u, 2), W);
    var dc = decode(u, rep, W);
    /* the encoding / reading rule, written out and checked */
    var rule = [];
    if (base === 10) {
      if (rep === 'unsigned' || !P.neg) { rule.push('Write ' + (P.neg ? '' : '') + dc.v.toString() + ' in ' + W + ' bits' + (rep === 'unsigned' ? '.' : ' (it is not negative, so the sign bit is 0).')); rule.push('  ' + bits); }
      else if (rep === 'twos') { var ab = lpad(str(-dc.v, 2), W), inv = ab.split('').map(function (c) { return c === '1' ? '0' : '1'; }).join(''); rule.push('Negative number: write |' + dc.v + '| = ' + (-dc.v) + ' in ' + W + ' bits, invert every bit, then add 1.'); rule.push('  |value|    ' + ab); rule.push('  inverted   ' + inv); rule.push('  add 1      ' + bits); if (BigInt('0b' + inv) + 1n !== u) throw new Error('internal check failed: two’s complement'); }
      else if (rep === 'ones') { var ab1 = lpad(str(-dc.v, 2), W), inv1 = ab1.split('').map(function (c) { return c === '1' ? '0' : '1'; }).join(''); rule.push('Negative number: write |' + dc.v + '| = ' + (-dc.v) + ' in ' + W + ' bits, then invert every bit.'); rule.push('  |value|    ' + ab1); rule.push('  inverted   ' + inv1); if (BigInt('0b' + inv1) !== u) throw new Error('internal check failed: one’s complement'); }
      else { var ab2 = lpad(str(-dc.v, 2), W - 1); rule.push('Negative number: write |' + dc.v + '| = ' + (-dc.v) + ' in ' + (W - 1) + ' bits and put 1 in the sign bit (the leftmost bit).'); rule.push('  sign  magnitude'); rule.push('  1     ' + ab2); if (BigInt('0b1' + ab2) !== u) throw new Error('internal check failed: sign-magnitude'); }
      if (encode(dc.v, rep, W) !== u) throw new Error('internal check failed: encode');
    } else {
      var sb = bits.charAt(0), rest = bits.slice(1);
      if (rep === 'unsigned') { rule.push('Unsigned: every bit is a place value, so the pattern ' + bits + ' is the whole number ' + u + '.'); }
      else if (sb === '0') { rule.push('The sign bit (leftmost) is 0, so the number is not negative and the value is the pattern read as a plain number: ' + u + '.'); }
      else if (rep === 'twos') { rule.push('The sign bit is 1, so the number is negative. Two’s complement: value = unsigned value - 2^' + W + ' = ' + u + ' - ' + all + ' = ' + dc.v + '.'); rule.push('  Another way: invert every bit (' + bits.split('').map(function (c) { return c === '1' ? '0' : '1'; }).join('') + ' = ' + ((all - 1n) - u) + '), add 1 (= ' + ((all - 1n) - u + 1n) + ') and put a minus sign: -' + ((all - 1n) - u + 1n) + '.'); }
      else if (rep === 'ones') { rule.push('The sign bit is 1, so the number is negative. One’s complement: invert every bit, ' + bits.split('').map(function (c) { return c === '1' ? '0' : '1'; }).join('') + ' = ' + ((all - 1n) - u) + ', and put a minus sign: ' + (dc.negZero ? '-0 (all ones is “negative zero”)' : dc.v) + '.'); }
      else { rule.push('The sign bit is 1, so the number is negative. Sign-magnitude: the other ' + (W - 1) + ' bits (' + rest + ') are the size, ' + BigInt('0b' + rest) + ', so the value is ' + (dc.negZero ? '-0 (sign bit set, size 0, “negative zero”)' : dc.v) + '.'); }
      if (encode(dc.v, rep, W) !== u && !dc.negZero) throw new Error('internal check failed: decode');
    }
    var cmp = ['unsigned', 'signmag', 'ones', 'twos'].map(function (r) { var d = decode(u, r, W); return { rep: r, name: REPNAME[r], value: (d.negZero ? '-0' : d.v.toString()), selected: r === rep, min: range(r, W).min.toString(), max: range(r, W).max.toString() }; });
    var outs = {}; ['bin', 'oct', 'hex'].forEach(function (id) { var b = sys(id)[1], txt = lpad(str(u, b), id === 'bin' ? W : id === 'oct' ? Math.ceil(W / 3) : W / 4); outs[id] = { neg: false, intText: txt, fracText: '', approx: false, repeat: null, text: txt, period: 0 }; });
    var dtxt = (dc.negZero ? '-0' : dc.v.toString()); outs.dec = { neg: dc.v < 0n || dc.negZero, intText: dtxt.replace('-', ''), fracText: '', approx: false, repeat: null, text: dtxt, period: 0 };
    var res = { ok: true, mode: 'fixed', from: from[0], to: to, rep: rep, repName: REPNAME[rep], width: W, input: { typed: t, base: base, neg: P.neg, intDigits: P.intDigits, fracDigits: '', hasPoint: false }, outputs: outs, isInteger: true,
      fixed: { bits: bits, unsigned: u.toString(), value: dtxt, valueBig: dc.v.toString(), negZero: dc.negZero, min: R.min.toString(), max: R.max.toString(), compare: cmp, setBits: popcount(bits), clearBits: W - popcount(bits), msb: bits.charAt(0), lsb: bits.charAt(W - 1) } };
    /* working */
    var tg = to === 'all' ? SYS.filter(function (d) { return d[0] !== from[0]; }) : SYS.filter(function (d) { return d[0] === to; });
    steps.push({ title: 'What the input means', text: CAP[base] + ' ' + (base === 10 ? 'value ' + (P.neg ? '-' : '') : 'bit pattern ') + P.intDigits + ' read as ' + W + '-bit ' + REPNAME[rep] + '.\nA fixed width has exactly ' + W + ' bits, and the same bits mean different numbers in different representations. Range for ' + REPNAME[rep] + ': ' + R.min + ' to ' + R.max + '.' });
    if (base === 10) {
      var dl = intLines(parse(String(mag), 10), 2, mag, W);
      if (dl && mag > 0n) steps.push({ title: P.neg ? 'The size of ' + dtxt + ' (' + mag + ') in binary' : 'Decimal ' + mag + ' to binary', text: dl });
      steps.push({ title: 'Encode ' + dtxt + ' as ' + W + '-bit ' + REPNAME[rep], text: rule.join('\n') });
    } else {
      if (base !== 2) { var Pp = parse(P.intDigits, base); steps.push({ title: CAP[base] + ' ' + P.intDigits + ' as a pattern of ' + W + ' bits', text: groupLines(Pp, 2, W) + '\nPadded with leading zeros to ' + W + ' bits: ' + bits }); }
      else steps.push({ title: 'The ' + W + '-bit pattern', text: 'Padded with leading zeros to ' + W + ' bits: ' + bits });
      steps.push({ title: 'Read the pattern as ' + REPNAME[rep], text: rule.join('\n') });
    }
    tg.forEach(function (d) {
      if (d[0] === from[0]) return;
      if (base === 10 && d[1] === 2) return;
      if (d[1] === 2 && base !== 10) return;
      if (d[1] === 10) { if (base === 10) return; steps.push({ title: 'The pattern as a decimal number', text: 'Unsigned reading of the pattern (place values 2^' + (W - 1) + ' down to 2^0): ' + u + '.\n' + (rep === 'unsigned' ? 'This is also the value in the selected representation.' : 'In the selected ' + REPNAME[rep] + ' representation the value is ' + dtxt + '.') }); return; }
      var gl = groupLines(parse(bits, 2), d[1], W), gx = lpad(str(u, d[1]), d[0] === 'oct' ? Math.ceil(W / 3) : W / 4);
      steps.push({ title: 'The ' + W + '-bit pattern in ' + NAME[d[1]], text: gl + '\nWith leading zeros kept for the ' + W + '-bit width: ' + gx });
    });
    res.steps = steps;
    notes.push('The pattern ' + bits + ' is ' + u + ' unsigned and ' + dtxt + ' as ' + REPNAME[rep] + (rep === 'unsigned' ? '' : ' (' + W + '-bit)') + '. Choosing the representation is part of the question.');
    if (dc.negZero) notes.push('This pattern is “negative zero”. One’s complement and sign-magnitude have two zeros (all zeros and this one); two’s complement has only one.');
    if (rep !== 'unsigned' && W < 64 && R.max >= 0n) notes.push('Range at ' + W + ' bits as ' + REPNAME[rep] + ': ' + R.min + ' to ' + R.max + '. A value outside it is refused, not wrapped.');
    res.notes = notes;
    return res;
  }

  /* ---- run() --------------------------------------------------------------------------------------------------------------------------------------------- */
  function run(o) {
    o = o || {};
    var from = sys(o.from), toId = o.to == null ? 'all' : String(o.to), rep = o.rep == null ? 'signed' : String(o.rep), pad = o.pad == null ? 'min' : String(o.pad);
    var W = o.width == null ? 8 : Number(o.width), N = o.fracDigits == null ? 16 : Number(o.fracDigits);
    if (!from) return { ok: false, error: 'Unknown number system.' };
    if (toId !== 'all' && !sys(toId)) return { ok: false, error: 'Unknown target system.' };
    if (!REPS.some(function (r) { return r[0] === rep; })) return { ok: false, error: 'Unknown representation.' };
    if (WIDTHS.indexOf(W) < 0) return { ok: false, error: 'Unknown bit width.' };
    if (FRACS.indexOf(N) < 0) return { ok: false, error: 'Unknown fraction digit setting.' };
    if (PADS.indexOf(pad) < 0) return { ok: false, error: 'Unknown padding option.' };
    var notes = [], steps = [];
    if (rep !== 'signed') return fixedRun(o, from, toId, rep, W, notes, steps);
    var P = parse(o.text, from[1]);
    if (!P.ok) return P;
    var S = P.base, typedBits = pad === 'match' ? (S === 10 ? 0 : P.intDigits.length * BITS[S]) : Number(pad === 'min' ? 0 : pad), padBits = typedBits;
    var outs = {}; SYS.forEach(function (d) { outs[d[0]] = target(P, d[1], N, d[1] === 10 ? 0 : padBits); });
    var D = pow(S, P.k), ip = P.M / D, isInt = P.M % D === 0n;
    var res = { ok: true, mode: 'signed', from: from[0], to: toId, rep: 'signed', repName: 'value with a minus sign', width: 0, fracLimit: N, padBits: padBits, input: { typed: String(o.text).trim(), base: S, neg: P.neg, intDigits: P.intDigits, fracDigits: P.fracDigits, hasPoint: P.hasPoint }, outputs: outs, isInteger: isInt, fixed: null };
    var anyApprox = SYS.some(function (d) { return outs[d[0]].approx; });
    /* working */
    var tg = toId === 'all' ? SYS.filter(function (d) { return d[0] !== from[0]; }) : SYS.filter(function (d) { return d[0] === toId; });
    var shownIn = (P.neg ? '-' : '') + (P.intDigits || '0') + (P.hasPoint ? '.' + P.fracDigits : '');
    steps.push({ title: 'What the input means', text: CAP[S] + ' ' + shownIn + (P.neg ? '\nThe minus sign belongs to the whole number; the digits below are its size.' : '') + '\nInteger part: ' + (P.intDigits || '0') + (P.k ? '   Fraction part: .' + P.fracDigits : '') + '\nIn decimal: ' + outs.dec.text + (outs.dec.approx ? '…' : '') });
    tg.forEach(function (d) {
      var T = d[1];
      if (T === S) { steps.push({ title: 'Same system', text: 'The input is already ' + NAME[S] + '. The value is shown with leading zeros and trailing fraction zeros removed (or kept, if you chose a minimum width).' }); return; }
      var il = intLines(P, T, ip, 0), fl = fracLines(P, T, N), txt = '';
      if (S !== 10 && T !== 10) txt = il;
      else { if (ip > 0n || !P.k) txt += (P.k ? 'Integer part\n' : '') + (il || ''); if (fl) txt += (txt ? '\n\n' : '') + 'Fraction part\n' + fl; }
      if (!txt) txt = 'The value is 0.';
      steps.push({ title: CAP[S] + ' to ' + NAME[T], text: txt + '\nResult: ' + outs[d[0]].text + (outs[d[0]].approx ? '…  (cut off after ' + outs[d[0]].fracText.length + ' fraction digits, not rounded)' : '') });
    });
    /* check by converting back */
    var chkLines = [];
    tg.forEach(function (d) { var T = d[1], r = outs[d[0]]; if (T === S) return; if (!r.approx) { var back = ratio(r.intText, r.fracText, T); if (!eqRatio(back, { n: P.M, d: D })) throw new Error('internal check failed: round trip'); chkLines.push(r.text + ' (' + NAME[T] + ') read back = ' + shownIn + ' (' + NAME[S] + '): exact'); } else chkLines.push(r.text + '… (' + NAME[T] + ') is below the exact value by less than one unit of its last digit, as a cut-off (not rounded) expansion must be' + (r.repeat ? '; its repeating form ' + r.repeat + ' equals ' + shownIn + ' exactly' : '') + '.'); });
    if (chkLines.length) steps.push({ title: 'Check', text: chkLines.join('\n') });
    res.steps = steps;
    /* notes */
    if (S !== 10 && P.intDigits.replace(/^0+/, '').length < P.intDigits.length && P.intDigits.length > 1) notes.push('Leading zeros do not change a value, so ' + P.intDigits + ' is the same number as ' + (P.intDigits.replace(/^0+(?=.)/, '') || '0') + '.');
    if (P.neg) notes.push('The minus sign is written in front of the digits (sign and magnitude). To see a negative number as a fixed-width bit pattern, choose two’s complement, one’s complement or sign-magnitude and a bit width. 11111111 is 255 unsigned but -1 as 8-bit two’s complement.');
    else if (isInt && S !== 10) notes.push('Read as an unsigned number. The same bits can mean a negative number in two’s complement; choose that representation and a width to see it.');
    if (anyApprox) notes.push('Some results have no finite expansion in the target system (for example 0.1 in binary), so they are cut off at ' + N + ' fraction digits and marked with …. The digits are truncated, never rounded; the repeating block is shown where it is found.');
    if (padBits > 0 && SYS.some(function (d) { return d[1] !== 10 && outs[d[0]].intText.length > (d[1] === 2 ? padBits : Math.ceil(padBits / BITS[d[1]])); })) notes.push('The value needs more than ' + padBits + ' bits, so it is shown in full. Nothing is truncated.');
    if (pad === 'match' && S === 10) notes.push('A decimal number has no typed bit width, so it is shown with the fewest digits.');
    res.notes = notes;
    /* facts */
    var ib = str(ip, 2); res.facts = { bitLength: ip === 0n ? 1 : ib.length, ones: popcount(ib), zeros: (ip === 0n ? 1 : ib.length) - popcount(ib) };
    return res;
  }

  /* ---- Exports ---------------------------------------------------------------------------------------------------------------------------------------- */
  function disp(x) { return x.text + (x.approx ? '…' : ''); }
  function exportTxt(r) {
    var L = ['Elecmetric Binary Calculator: Number System Conversion', '', 'Input         : ' + r.input.typed + ' (' + NAME[r.input.base] + ')', 'Representation: ' + r.repName + (r.mode === 'fixed' ? ', ' + r.width + ' bits' : '')];
    L.push(''); SYS.forEach(function (d) { L.push(rpad(d[2], 14) + ': ' + disp(r.outputs[d[0]]) + (r.outputs[d[0]].repeat ? '   (exact: ' + r.outputs[d[0]].repeat + ')' : '')); });
    if (r.fixed) { L.push(''); L.push('Unsigned value: ' + r.fixed.unsigned); L.push('Same bits in each representation:'); r.fixed.compare.forEach(function (c) { L.push('  ' + rpad(c.name, 18) + c.value); }); }
    L.push(''); L.push('Working'); r.steps.forEach(function (s) { L.push(''); L.push(s.title); L.push(s.text); });
    return L.join('\n') + '\n';
  }
  function csvq(s) { s = String(s); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function exportCsv(r) {
    var rows = [['system', 'value', 'exact', 'repeating']];
    SYS.forEach(function (d) { var x = r.outputs[d[0]]; rows.push([d[2].toLowerCase(), x.text, x.approx ? 'no (cut off)' : 'yes', x.repeat || '']); });
    if (r.fixed) { rows.push(['unsigned value', r.fixed.unsigned, 'yes', '']); r.fixed.compare.forEach(function (c) { rows.push([c.name + ' value', c.value, 'yes', '']); }); }
    return rows.map(function (x) { return x.map(csvq).join(','); }).join('\n') + '\n';
  }
  function exportJson(r) {
    var o = { tool: 'Elecmetric Binary Calculator, Mode 02 Number System Conversion', input: { text: r.input.typed, system: NAME[r.input.base] }, representation: r.repName, results: {} };
    if (r.mode === 'fixed') { o.bitWidth = r.width; o.unsignedValue = r.fixed.unsigned; o.sameBits = r.fixed.compare.map(function (c) { return { representation: c.name, value: c.value }; }); o.range = { min: r.fixed.min, max: r.fixed.max }; }
    SYS.forEach(function (d) { var x = r.outputs[d[0]]; o.results[NAME[d[1]]] = { value: x.text, exact: !x.approx, repeating: x.repeat || undefined, truncatedTo: x.approx ? x.fracText.length + ' fraction digits' : undefined }; });
    return JSON.stringify(o, null, 2) + '\n';
  }

  var api = { SYS: SYS, REPS: REPS, WIDTHS: WIDTHS, FRACS: FRACS, PADS: PADS, MAXD: MAXD, MAXFD: MAXFD, parse: parse, expandFrac: expandFrac, range: range, encode: encode, decode: decode, run: run, groupBits: groupBits, exportTxt: exportTxt, exportCsv: exportCsv, exportJson: exportJson };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.NumConv = api;
})(typeof window !== 'undefined' ? window : this);
