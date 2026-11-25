/* Elecmetric Exponent Calculator, Mode 01: Power Calculator (y = a^n). Engine: one file, no dependencies, no DOM.
   Required by tests/exponent_test.js and inlined into calculators/exponent-calculator/index.html by tools/exponent_page.js.

   Inputs are read as EXACT rational numbers (BigInt numerator and denominator): 1.5 is 3/2, 0.001 is 1/1000, 1e-3 is 1/1000, 2/3 is 2/3. The exponent is read the same way, so
   0.5 and 1/2 are the same exponent and 2/3 never has to be typed as 0.6666667.

   Numerical policy (CEO brief, section 6):
   - whole-number exponents use BigInt, so 2^100 is 1267650600228229401496703205376 digit for digit, and a^-n is the exact reciprocal fraction;
   - a rational exponent p/q first tries an exact integer q-th root of the numerator and denominator (27^(2/3) = 9, 16^(3/4) = 8, (1/8)^(1/3) = 1/2);
     if the root is not exact the result is a double-precision approximation and is labelled as one;
   - a negative base is treated by the reduced exponent: whole number, or p/q with q odd, gives a real result with the sign of (-1)^p; q even has no real value and is refused
     (an exponent typed as 0.5 is 1/2, so (-4)^0.5 is refused, and the message says so);
   - 0^0 and 0 to a negative power are refused, never silently given as 1 or Infinity; 0 to a positive power is 0;
   - an exact result of more than 50,000 digits is not written out: the page gives its digit count and scientific notation from logarithms, with only the digits that
     the logarithm can carry (about 15 minus the number of digits in the exponent of ten);
   - nothing is rounded internally: rounding happens once, when the result is displayed;
   - the base may be the constant e (approximate, double precision).
   Errors are returned, never thrown, with the field that caused them. */
(function (root) {
  'use strict';
  var MAX_EXACT_DIGITS = 50000, MAX_EXP = 1e9, MAX_SCI_INPUT = 10000, MAX_ROOT_DIGITS = 3000;
  var SIG_CHOICES = ['4', '6', '8', '10', '12', '15', 'full'];
  var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻', '+': '⁺' };
  function sup(s) { return String(s).replace(/[0-9+-]/g, function (c) { return SUP[c]; }); }

  /* ---------- BigInt helpers ---------- */
  function babs(x) { return x < 0n ? -x : x; }
  function gcd(a, b) { a = babs(a); b = babs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function bitLen(x) { return x === 0n ? 0 : x.toString(2).length; }
  function pow10(k) { return 10n ** BigInt(k); }
  function norm(n, d) { if (d < 0n) { n = -n; d = -d; } var g = gcd(n, d); return g > 1n ? { n: n / g, d: d / g } : { n: n, d: d }; }
  function bigLog10(b) { /* log10 of a positive BigInt, to double precision, for any size */
    var s = b.toString(), L = s.length; if (L <= 15) return Math.log10(Number(b));
    var head = s.slice(0, 17);
    return (L - head.length) + Math.log10(Number(head));
  }
  function ratLog10(n, d) { return bigLog10(babs(n)) - bigLog10(d); }
  function ratToDouble(n, d) {
    var a = babs(n), L = a.toString().length, M = d.toString().length, v;
    if (L < 300 && M < 300) v = Number(a) / Number(d);
    else v = Math.pow(10, ratLog10(a, d));
    return n < 0n ? -v : v;
  }
  /* floor of the k-th root of a non-negative BigInt */
  function iroot(N, k) {
    if (N < 2n) return N;
    var kk = BigInt(k), bl = bitLen(N);
    if (k >= bl) return 1n;
    var x = 1n << BigInt(Math.ceil(bl / k)), y;
    for (;;) { y = ((kk - 1n) * x + N / (x ** (kk - 1n))) / kk; if (y >= x) return x; x = y; }
  }
  function groupInt(s) { return s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  /* ---------- reading numbers ---------- */
  function decimalToRat(t) { /* t: unsigned decimal with optional exponent, already validated; returns { n, d } or { error } */
    var m = /^(\d*)\.?(\d*)(?:[eE]([+-]?\d+))?$/.exec(t), ip = m[1], fp = m[2], ex = m[3] ? parseInt(m[3], 10) : 0;
    if (Math.abs(ex) > MAX_SCI_INPUT) return { error: 'the power of ten ' + ex + ' is outside the supported range (±' + MAX_SCI_INPUT + ').' };
    var n = BigInt((ip + fp) || '0'), d = pow10(fp.length);
    if (ex >= 0) n *= pow10(ex); else d *= pow10(-ex);
    return norm(n, d);
  }
  /* Accepts 2, -2, +2, 1,000, 1 000, 1.5, .5, 1e-3, 1.5E3, 3/4, 1.5/2, -3/4, a Unicode minus, and (-8) in brackets. The base may also be e. */
  function parseOperand(s, allowE) {
    var raw = String(s === undefined || s === null ? '' : s).trim();
    if (raw === '') return { empty: true };
    var t = raw.replace(/−|–/g, '-').replace(/[\s_]/g, '');
    while (/^\(.*\)$/.test(t)) t = t.slice(1, -1);
    var sign = 1;
    if (t[0] === '-') { sign = -1; t = t.slice(1); } else if (t[0] === '+') t = t.slice(1);
    if (allowE && (t === 'e' || t === 'E')) return { kind: 'e', sign: sign, text: (sign < 0 ? '−' : '') + 'e' };
    if (/^\d{1,3}(,\d{3})+(\.\d*)?([eE][+-]?\d+)?$/.test(t)) t = t.replace(/,/g, '');
    var bad = '“' + raw + '” is not a number. Use digits such as 2, −3, 1.5, 1e-3 or a fraction such as 2/3' + (allowE ? ', or the letter e' : '') + '.';
    var parts = t.split('/'), num = 1n, den = 1n, i, r;
    if (parts.length > 2) return { error: bad };
    for (i = 0; i < parts.length; i++) {
      if (!/^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(parts[i])) return { error: bad };
      r = decimalToRat(parts[i]); if (r.error) return { error: '“' + raw + '”: ' + r.error };
      if (i === 0) { num = r.n; den = r.d; } else { if (r.n === 0n) return { error: 'The denominator of “' + raw + '” is zero.' }; num = num * r.d; den = den * r.n; }
    }
    var q = norm(sign < 0 ? -num : num, den);
    return { kind: 'rat', n: q.n, d: q.d, text: raw.replace(/−/g, '-').replace(/\s+/g, ''), isFraction: parts.length === 2, isDecimal: /[.eE]/.test(t) && parts.length === 1 };
  }
  function ratText(n, d) { var s = n < 0n ? '−' : '', a = babs(n).toString(), b = d.toString(); if (a.length > 40 || b.length > 40) return s + a.slice(0, 12) + '… / ' + b.slice(0, 12) + '…'; return s + a + (d === 1n ? '' : '/' + b); }

  /* ---------- scientific digits: { digits, exp10, acc, complete } ---------- */
  /* digits: significant digits string (first digit non-zero); exp10: power of ten of the first digit; acc: how many digits are reliable; complete: the digits end the number exactly */
  function roundDigits(sd, sig) {
    var digits = sd.digits, exp10 = sd.exp10, keep = Math.min(sig, sd.acc, digits.length), r;
    if (!(keep >= digits.length)) {
      var up = digits.charCodeAt(keep) >= 53, head = digits.slice(0, keep);
      if (up) { r = (BigInt(head) + 1n).toString(); if (r.length > head.length) { exp10 += 1; r = r.slice(0, head.length); } head = r; }
      digits = head;
    }
    digits = digits.replace(/0+$/, ''); if (digits === '') digits = '0';
    return { digits: digits, exp10: exp10, rounded: !sd.complete || /[1-9]/.test(sd.digits.slice(keep)) };
  }
  function sciString(rd) { return rd.digits[0] + (rd.digits.length > 1 ? '.' + rd.digits.slice(1) : ''); }
  function plainString(rd, sign) { /* the number written without an exponent, or null when it would be very long */
    var dg = rd.digits, e = rd.exp10, s;
    if (e > 40 || e < -30) return null;
    if (e >= 0) { s = dg.length > e + 1 ? dg.slice(0, e + 1) + '.' + dg.slice(e + 1) : dg + '0'.repeat(e + 1 - dg.length); s = s.indexOf('.') < 0 ? groupInt(s) : groupInt(s.split('.')[0]) + '.' + s.split('.')[1]; }
    else s = '0.' + '0'.repeat(-e - 1) + dg;
    return (sign < 0 ? '−' : '') + s;
  }
  function sciFromRational(n, d, want) { /* exact rational, positive; digits with `want` significant digits (truncated) */
    var a = n, b = d, k = want + 3 - (a.toString().length - b.toString().length), q, rem;
    if (k >= 0) a = a * pow10(k); else b = b * pow10(-k);
    q = a / b; rem = a % b;
    var s = q.toString(), exp10 = s.length - 1 - k;
    return { digits: s, exp10: exp10, acc: s.length, complete: rem === 0n };
  }
  function isTerminating(d) { while (d % 2n === 0n) d /= 2n; while (d % 5n === 0n) d /= 5n; return d === 1n; }

  /* ---------- the exact and approximate result builders ---------- */
  function exactResult(sign, n, d) { /* n, d positive; value = sign * n / d */
    return { exact: true, sign: n === 0n ? 0 : sign, n: n, d: d };
  }
  function digitsOf(b) { return b.toString().length; }

  function describeExact(res, sigPref) {
    /* returns { fraction, standard, sciDigits, ... } for an exact rational result (res.n / res.d, both positive) */
    var out = { isInteger: res.d === 1n, fraction: null, standard: null, digitCount: null, terminating: isTerminating(res.d) };
    var sg = res.sign < 0 ? '−' : '';
    if (res.sign === 0) { out.sd = { digits: '0', exp10: 0, acc: 1, complete: true }; out.zero = true; out.standard = '0'; return out; }
    if (res.d === 1n) {
      var s = res.n.toString(); out.digitCount = s.length;
      out.sd = { digits: s, exp10: s.length - 1, acc: s.length, complete: true };
      out.standard = s.length <= 5000 ? sg + groupInt(s) : sg + groupInt(s.slice(0, 30)).replace(/,$/, '') + '…' + s.slice(-30) + ' (' + s.length + ' digits)';
      out.integerString = s;
    } else {
      out.fraction = sg + digitsOfShort(res.n) + '/' + digitsOfShort(res.d);
      var wantDigits = out.terminating ? Math.min(5000, Math.max(digitsOf(res.n), digitsOf(res.d)) + 5) : 70;
      out.sd = sciFromRational(res.n, res.d, wantDigits); if (!out.terminating) out.sd.complete = false;
      if (out.terminating) out.sd.complete = true;
    }
    return out;
  }
  function digitsOfShort(b) { var s = b.toString(); return s.length > 60 ? s.slice(0, 20) + '…(' + s.length + ' digits)' : s; }

  /* approximate: sign, x = log10 |y| (double), value (double or null), acc = reliable digits */
  function approxResult(sign, absValue, x) {
    var ax = Math.abs(x), acc = Math.max(1, Math.min(15, Math.floor(15.5 - Math.log10(Math.max(1, ax)))));
    var sd;
    if (absValue !== null && isFinite(absValue) && absValue > 0 && absValue < 1e300 && absValue > 1e-300) {
      var ex = absValue.toExponential(14), m = /^(\d)\.(\d+)e([+-]\d+)$/.exec(ex);
      sd = { digits: m[1] + m[2], exp10: parseInt(m[3], 10), acc: Math.min(15, acc), complete: false };
    } else {
      var e10 = Math.floor(x), fr = Math.pow(10, x - e10), ex2 = fr.toExponential(14), m2 = /^(\d)\.(\d+)e([+-]\d+)$/.exec(ex2);
      sd = { digits: m2[1] + m2[2], exp10: e10 + parseInt(m2[3], 10), acc: acc, complete: false };
    }
    return { exact: false, sign: sign, x: x, sd: sd, value: absValue === null ? null : sign * absValue };
  }

  /* ---------- the calculation ---------- */
  function powRat(n, d, p) { /* (n/d)^p for BigInt p (sign included), n,d positive */
    if (p >= 0n) return { n: n ** p, d: d ** p };
    return { n: d ** (-p), d: n ** (-p) };
  }
  function expFloat(p, q) { return Number(p) / Number(q); }

  function compute(a, e) {
    /* a: { kind:'rat'|'e', n, d, sign }, e: { n: p, d: q } reduced rational. Returns { ok, res, how, ... } */
    var p = e.n, q = e.d, isInt = q === 1n, neg, baseAbsRat = null, ev = expFloat(p, q), how = {}, bn, bd;
    var parityOdd = (babs(p) % 2n) === 1n;
    if (a.kind === 'e') {
      neg = a.sign < 0;
      if (neg && q % 2n === 0n) return { ok: false, error: 'No real value: a negative base needs an exponent that is a whole number or a fraction with an odd denominator, and ' + ratText(p, q) + ' has an even denominator.', field: 'n', code: 'NOT_REAL' };
      if (p === 0n) return { ok: true, res: exactResult(1, 1n, 1n), how: { kind: 'zero' } };
      if (Math.abs(ev) > MAX_EXP) return { ok: false, error: 'The exponent is outside the supported range (±1,000,000,000).', field: 'n', code: 'RANGE' };
      var sgn = neg && parityOdd ? -1 : 1, x = ev * Math.LOG10E;
      return { ok: true, res: approxResult(sgn, Math.abs(x) < 300 ? Math.exp(ev) : null, x), how: { kind: 'e', neg: neg } };
    }
    bn = a.n; bd = a.d; neg = bn < 0n; var an = babs(bn);
    /* zero base */
    if (bn === 0n) {
      if (p === 0n) return { ok: false, error: '0⁰ is undefined (an indeterminate form). Some conventions set it to 1, but this calculator does not choose one silently.', field: 'n', code: 'ZERO_TO_ZERO' };
      if (p < 0n) return { ok: false, error: '0 raised to a negative power means dividing by zero, so it is undefined.', field: 'n', code: 'ZERO_NEGATIVE' };
      return { ok: true, res: exactResult(0, 0n, 1n), how: { kind: 'zero-base' } };
    }
    if (p === 0n) return { ok: true, res: exactResult(1, 1n, 1n), how: { kind: 'zero' } };
    /* sign of the result */
    if (neg && !isInt && q % 2n === 0n) {
      return { ok: false, error: 'No real value: (' + ratText(bn, bd) + ') to the power ' + ratText(p, q) + ' has an even denominator (' + q.toString() + '), so the result is not a real number. A negative base needs a whole-number exponent or a fraction with an odd denominator, such as 1/3.', field: 'n', code: 'NOT_REAL', hint: true };
    }
    var sign = neg && parityOdd ? -1 : 1;
    if (Math.abs(ev) > MAX_EXP && an !== bd) return { ok: false, error: 'The exponent is outside the supported range (±1,000,000,000).', field: 'n', code: 'RANGE' };
    /* base of magnitude 1 */
    if (an === bd) return { ok: true, res: exactResult(sign, 1n, 1n), how: { kind: isInt ? 'unit' : 'unit' } };
    var bl = ratLog10(an, bd), x2 = ev * bl;
    if (isInt) {
      /* the exact route when the result is not too long */
      var est = Math.abs(ev) * Math.max(bigLog10(an), bigLog10(bd)) + 2;
      if (est <= MAX_EXACT_DIGITS) { var r = powRat(an, bd, p); how = { kind: p > 0n ? 'integer' : 'negative' }; return { ok: true, res: exactResult(sign, r.n, r.d), how: how, baseAbs: { n: an, d: bd } }; }
      return { ok: true, res: approxResult(sign, null, x2), how: { kind: 'huge', digits: Math.floor(Math.abs(x2)) + 1 }, baseAbs: { n: an, d: bd } };
    }
    /* rational exponent: exact root when it exists */
    var pa = babs(p), tryRoot = digitsOf(an) <= MAX_ROOT_DIGITS && digitsOf(bd) <= MAX_ROOT_DIGITS;
    if (tryRoot && q <= 100000n) {
      var qn = Number(q), rn = iroot(an, qn), rd = iroot(bd, qn);
      if (rn ** BigInt(qn) === an && rd ** BigInt(qn) === bd) {
        var est2 = pa === 0n ? 0 : Number(pa) * Math.max(bigLog10(rn), bigLog10(rd)) + 2;
        if (est2 <= MAX_EXACT_DIGITS) { var rr = powRat(rn, rd, p); return { ok: true, res: exactResult(sign, rr.n, rr.d), how: { kind: 'root', rootN: rn, rootD: rd, q: qn }, baseAbs: { n: an, d: bd } }; }
      }
    }
    var absVal = null;
    if (Math.abs(x2) < 300) { var bdbl = ratToDouble(an, bd); absVal = Math.pow(bdbl, ev); if (!isFinite(absVal) || absVal === 0 || absVal > 1e300 || absVal < 1e-300) absVal = Math.abs(x2) < 300 ? Math.pow(10, x2) : null; }
    return { ok: true, res: approxResult(sign, absVal, x2), how: { kind: 'approx-root', q: Number(q) }, baseAbs: { n: an, d: bd } };
  }

  /* ---------- display ---------- */
  function sigValue(sig, terminatingOrInt) { if (sig === 'full' || sig === undefined) return terminatingOrInt ? Infinity : 20; var v = Number(sig); return v >= 1 ? v : 6; }

  function display(c, sigIn) {
    var res = c.res, info, rd, sg = res.sign < 0 ? '−' : '', out = { sign: res.sign, exact: res.exact };
    if (res.exact) {
      info = describeExact(res, sigIn); var term = info.isInteger || info.terminating, S = sigValue(sigIn, term);
      rd = roundDigits(info.sd, S);
      out.isInteger = info.isInteger; out.fraction = info.fraction; out.digitCount = info.digitCount; out.terminating = info.terminating; out.integerString = info.integerString || null;
      if (res.sign === 0) { out.standard = '0'; out.sciCoef = '0'; out.sciExp = 0; out.sciText = '0'; out.eText = '0'; out.decimalIsExact = true; return out; }
      out.sciCoef = sg + sciString(rd); out.sciExp = rd.exp10;
      if (info.isInteger) { out.standard = info.standard; out.decimalIsExact = true; }
      else { var pl = plainString(rd, res.sign); out.standard = pl; out.decimalIsExact = info.terminating && !rd.rounded; }
      out.roundedDigits = rd.rounded;
    } else {
      var S2 = sigValue(sigIn, false); rd = roundDigits(res.sd, S2);
      out.sciCoef = sg + sciString(rd); out.sciExp = rd.exp10; out.standard = plainString(rd, res.sign); out.decimalIsExact = false; out.roundedDigits = true;
      out.reliableDigits = res.sd.acc; out.isInteger = false; out.digitCount = c.how.kind === 'huge' && res.x > 0 ? Math.floor(res.x) + 1 : null;
    }
    out.sciText = out.sciCoef + ' × 10' + sup(out.sciExp);
    out.eText = out.sciCoef.replace('\u2212', '-') + 'e' + (out.sciExp < 0 ? '-' : '+') + Math.abs(out.sciExp);
    return out;
  }

  /* ---------- the working ---------- */
  function supNum(s) { return sup(String(s).replace(/\u2212/g, '-')); }
  function pw(base, ex) { return /^-?\d+$/.test(ex) ? base + supNum(ex) : base + '^(' + ex + ')'; }
  function ordinal(k) { return k === 2 ? 'square' : k === 3 ? 'cube' : k + (k % 100 >= 11 && k % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][k % 10 > 3 ? 0 : k % 10] || 'th'); }
  function typed(t) { return String(t).replace(/-/g, '\u2212'); }
  function baseShow(a) { var t = typed(a.text); return (a.sign < 0 || a.n < 0n || /[/]/.test(t) || /[.eE]/.test(t) && a.kind === 'rat') ? '(' + t.replace(/^\((.*)\)$/, '$1') + ')' : t; }
  function expShow(e) { var t = typed(e.text); return /^\d+$/.test(t) ? t : '(' + t + ')'; }
  function valueText(r) { /* the value of y as one line */
    var s = r.sol, sg = s.sign < 0 ? '\u2212' : '';
    if (r.exact) { if (s.fraction) return s.fraction + (s.standard && s.standard.indexOf('\u2026') < 0 ? ' = ' + s.standard : ''); if (s.isInteger && s.integerString && s.integerString.length <= 60) return sg + groupInt(s.integerString); return s.standard && s.standard.length <= 60 ? s.standard : s.sciText; }
    return '\u2248 ' + (s.standard || s.sciText);
  }

  function buildSteps(a, e, c, dsp, sigIn, rr) {
    var st = [], how = c.how, res = c.res, k = how.kind, p = e.n, q = e.d, isInt = q === 1n, B = baseShow(a), En = ratText(p, q), sg = res.sign < 0 ? '−' : '';
    var intro = 'a = ' + (a.kind === 'e' ? (a.sign < 0 ? '−e ≈ −2.718281828459045' : 'e ≈ 2.718281828459045') : ratText(a.n, a.d) + (a.d !== 1n && a.src && a.src.isDecimal ? '   (the decimal ' + a.src.text + ' as an exact fraction)' : '')) + '\nn = ' + En + (e.src && e.src.isDecimal && q !== 1n ? '   (the decimal ' + e.src.text + ' as an exact fraction)' : '') + '\ny = a^n = ' + B + (isInt ? sup(p.toString().replace('-', '−')) : '^(' + En + ')');
    st.push({ title: 'The problem', text: intro });
    if (k === 'zero') st.push({ title: 'Zero exponent', text: 'Any nonzero number raised to the power 0 is 1:   a⁰ = 1   (a ≠ 0)\n' + B + '⁰ = 1' });
    else if (k === 'zero-base') st.push({ title: 'Zero base', text: '0 raised to a positive power is 0:   0^n = 0   (n > 0)' });
    else if (k === 'unit') st.push({ title: 'Base of magnitude 1', text: '|a| = 1, so every power has magnitude 1.' + (res.sign < 0 ? ' The sign is negative because the exponent ' + p.toString() + ' is odd.' : (a.n < 0n ? ' The sign is positive because the exponent is even.' : '')) });
    else if (k === 'integer' || k === 'negative') {
      var m = babs(p), base = a.kind === 'rat' ? c.baseAbs : null, bs = ratText(base.n, base.d), pos = base.d === 1n ? bs : '(' + bs + ')';
      if (a.n < 0n) st.push({ title: 'Sign of the result', text: 'The base is negative and the exponent ' + p.toString() + ' is ' + (res.sign < 0 ? 'odd, so the result is negative.' : 'even, so the result is positive.') + '\nCalculate with the magnitude ' + bs + ' and apply the sign at the end:   (−x)^n = (−1)^n × x^n' });
      if (p < 0n) st.push({ title: 'Negative exponent', text: 'A negative exponent means the reciprocal of the positive power:   a^(−m) = 1 / a^m\n' + B + sup(p.toString().replace('-', '−')) + ' = 1 / ' + pw(pos, m.toString()) });
      var pn = powRat(base.n, base.d, m);
      var line = pw(pos, m.toString()) + ' = ' + (m <= 8n && m >= 2n ? Array(Number(m)).fill(pos).join(' × ') + ' = ' : '') + (pn.d === 1n ? groupInt(digitsOfShort(pn.n)) : digitsOfShort(pn.n) + '/' + digitsOfShort(pn.d));
      st.push({ title: 'Multiply the base', text: line });
      if (p < 0n) st.push({ title: 'Take the reciprocal', text: '1 / ' + (pn.d === 1n ? groupInt(digitsOfShort(pn.n)) : '(' + digitsOfShort(pn.n) + '/' + digitsOfShort(pn.d) + ')') + ' = ' + sg + (dsp.fraction ? dsp.fraction.replace('−', '') : dsp.integerString ? groupInt(digitsOfShort(BigInt(dsp.integerString))) : '') });
    } else if (k === 'huge') {
      st.push({ title: 'A very large (or very small) exact result', text: 'The exact value of ' + B + (isInt ? sup(p.toString().replace('-', '−')) : '') + ' would need more than 50,000 digits, so it is not written out.\nlog₁₀|y| = n × log₁₀|a| = ' + En + ' × ' + (ratLog10(babs(a.n), a.d)).toPrecision(12) + ' = ' + res.x.toPrecision(15) + '\nSo y has about ' + (res.x > 0 ? Math.floor(res.x) + 1 + ' digits' : 'a magnitude of 10^' + Math.floor(res.x)) + ' and is written in scientific notation below, with only the digits the logarithm can carry (' + res.sd.acc + ').' });
    } else if (k === 'root' || k === 'approx-root') {
      var base2 = c.baseAbs, bs2 = ratText(base2.n, base2.d);
      if (a.n < 0n) st.push({ title: 'Sign of the result', text: 'The exponent ' + En + ' has an odd denominator, so a real value exists. The sign is ' + (res.sign < 0 ? 'negative (numerator ' + p.toString() + ' is odd).' : 'positive (numerator ' + p.toString() + ' is even).') + '\nCalculate with the magnitude ' + bs2 + '.' });
      st.push({ title: 'Rational exponent', text: 'a^(p/q) = (q-th root of a)^p  with p = ' + p.toString() + ', q = ' + q.toString() + (p < 0n ? '\nThe exponent is negative, so take the reciprocal of the positive power.' : '') });
      if (k === 'root') st.push({ title: 'Exact root', text: 'The ' + ordinal(Number(q)) + ' root of ' + bs2 + ' is exactly ' + ratText(how.rootN, how.rootD) + '   because ' + ratText(how.rootN, how.rootD) + sup(q.toString()) + ' = ' + bs2 + '\n' + (how.rootD === 1n ? ratText(how.rootN, how.rootD) : '(' + ratText(how.rootN, how.rootD) + ')') + sup(babs(p).toString()) + ' = ' + (function () { var r = powRat(how.rootN, how.rootD, babs(p)); return r.d === 1n ? groupInt(digitsOfShort(r.n)) : digitsOfShort(r.n) + '/' + digitsOfShort(r.d); })() + (p < 0n ? '\nReciprocal: ' + sg + (dsp.fraction ? dsp.fraction.replace('−', '') : groupInt(dsp.integerString || '')) : '') });
      else st.push({ title: 'Approximate value', text: 'The ' + ordinal(Number(q)) + ' root of ' + bs2 + ' is not a ratio of whole numbers, so the result is evaluated in double precision as exp(n × ln a).\nlog₁₀|y| = ' + En + ' × ' + ratLog10(base2.n, base2.d).toPrecision(12) + ' = ' + res.x.toPrecision(15) });
    } else if (k === 'e') {
      st.push({ title: 'The constant e', text: 'e ≈ 2.718281828459045 (irrational), so the result is an approximation in double precision:   y = exp(' + (a.sign < 0 && !(babs(p) % 2n === 0n) ? '' : '') + 'n)' + (a.sign < 0 ? '\nThe base is −e, so the sign follows the parity of the exponent.' : '') });
    }
    st.push({ title: 'Result', text: 'y = ' + rr.vt + '\nScientific notation: ' + dsp.sciText + (dsp.digitCount && dsp.isInteger && dsp.digitCount > 1 ? '\nDigits: ' + dsp.digitCount : '') });
    return st;
  }

  /* ---------- the public run() ---------- */
  function run(input) {
    input = input || {};
    var sig = input.sig === undefined ? '6' : String(input.sig);
    var a = parseOperand(input.a, true), e = parseOperand(input.n, false);
    if (a.error) return { ok: false, error: 'Base: ' + a.error, field: 'a' };
    if (e.error) return { ok: false, error: 'Exponent: ' + e.error, field: 'n' };
    if (a.empty && e.empty) return { ok: false, empty: true, error: '' };
    if (a.empty || e.empty) return { ok: false, partial: true, error: 'Enter the ' + (a.empty && e.empty ? 'base and the exponent' : a.empty ? 'base' : 'exponent') + ' to see the result.' };
    var ea = { kind: a.kind, n: a.n, d: a.d, sign: a.sign, text: a.text, src: a }, ee = { n: e.n, d: e.d, text: e.text, src: e };
    var c = compute(ea, ee);
    if (!c.ok) return { ok: false, error: c.error, field: c.field, code: c.code, hint: !!c.hint };
    var dsp = display(c, sig), warnings = [], tmp = { exact: c.res.exact, sol: dsp }, steps = buildSteps(ea, ee, c, dsp, sig, { vt: valueText(tmp) });
    if (!c.res.exact) warnings.push({ code: 'APPROXIMATE', message: 'This result is not a ratio of whole numbers, so it is a double-precision approximation. About ' + Math.min(15, c.res.sd.acc) + ' significant digits are reliable.' });
    if (c.how.kind === 'huge') warnings.push({ code: 'HUGE', message: 'The exact value has more than 50,000 digits and is not written out. The scientific notation is calculated from logarithms and carries about ' + c.res.sd.acc + ' reliable digits.' });
    if (dsp.roundedDigits && c.res.exact && !dsp.isInteger && !dsp.decimalIsExact) warnings.push({ code: 'ROUNDED', message: 'The decimal is rounded for display. The fraction is exact.' });
    /* independent check: log10 |y| = n log10 |a| */
    var chk = { ok: true, detail: '' };
    if (a.kind === 'rat' && a.n !== 0n && !(babs(a.n) === a.d)) {
      var want = (Number(e.n) / Number(e.d)) * ratLog10(babs(a.n), a.d), have = c.res.exact ? (c.res.sign === 0 ? NaN : ratLog10(c.res.n, c.res.d)) : c.res.x;
      if (c.res.exact && c.res.sign !== 0) { chk.ok = Math.abs(want - have) <= 1e-9 * Math.max(1, Math.abs(want)); chk.detail = 'log10|y| = ' + have.toPrecision(12) + ' and n log10|a| = ' + want.toPrecision(12); }
    }
    var exprPlain = baseShow(ea) + '^' + expShow(ee);
    return { ok: true, base: { text: a.text, kind: a.kind, n: a.n, d: a.d, sign: a.sign }, exponent: { text: e.text, p: e.n, q: e.d }, exprText: exprPlain, how: c.how.kind, exact: c.res.exact, sol: dsp, rawSign: c.res.sign, exactN: c.res.exact ? c.res.n.toString() : null, exactD: c.res.exact ? c.res.d.toString() : null, steps: steps, warnings: warnings, check: chk, sig: sig, value: c.res.exact ? (c.res.sign === 0 ? 0 : c.res.sign * Number(babs(c.res.n)) / Number(c.res.d)) : c.res.value };
  }

  /* ---------- exports ---------- */
  function headline(r) { return r.exprText + (r.exact ? ' = ' : ' ') + valueText(r); }
  function exportTxt(r) {
    var s = r.sol, L = ['ELECMETRIC EXPONENT CALCULATOR (Mode 01: Power Calculator)', '', 'Expression: ' + r.exprText, 'Result: ' + valueText(r), 'Scientific notation: ' + s.sciText, 'Exact: ' + (r.exact ? 'yes' : 'no, double-precision approximation')];
    if (s.digitCount && s.isInteger) L.push('Digits: ' + s.digitCount);
    L.push('', 'WORKING'); r.steps.forEach(function (x) { L.push('', x.title, x.text); });
    if (r.warnings.length) { L.push('', 'NOTES'); r.warnings.forEach(function (w) { L.push(w.message); }); }
    L.push('', 'Generated by Elecmetric. Calculate. Convert. Understand.'); return L.join('\n');
  }
  function csvq(v) { v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function exportCsv(r) {
    var s = r.sol, rows = [['Quantity', 'Value'], ['Base a', r.base.text], ['Exponent n', r.exponent.text], ['Result', (s.sign < 0 ? '−' : '') + (s.isInteger && s.integerString ? s.integerString : (s.fraction || s.standard || s.sciText))], ['Fraction', s.fraction || ''], ['Decimal', s.standard || ''], ['Scientific notation', s.eText], ['Exact', r.exact ? 'yes' : 'no'], ['Digits (integer result)', s.isInteger ? s.digitCount : '']];
    return rows.map(function (x) { return x.map(csvq).join(','); }).join('\n');
  }
  function exportJson(r) {
    var s = r.sol; return JSON.stringify({ calculator: 'Elecmetric Exponent Calculator, Mode 01', base: r.base.text, exponent: r.exponent.text, exact: r.exact, result: { sign: s.sign, fraction: s.fraction, decimal: s.standard, integer: s.isInteger ? s.integerString : null, scientific: s.eText, digits: s.isInteger ? s.digitCount : null }, warnings: r.warnings.map(function (w) { return w.code; }) }, null, 2);
  }

  var api = { run: run, parseOperand: parseOperand, iroot: iroot, sup: sup, groupInt: groupInt, exportTxt: exportTxt, exportCsv: exportCsv, exportJson: exportJson, headline: headline, valueText: valueText, SIG_CHOICES: SIG_CHOICES, MAX_EXACT_DIGITS: MAX_EXACT_DIGITS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ExponentCalc = api;
})(typeof self !== 'undefined' ? self : this);
