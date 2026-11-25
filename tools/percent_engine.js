/* Elecmetric Percentage Calculator: exact rational engine for Mode 01 (Basic Percentage). One file, no dependencies, no DOM.
   A value is a pair of BigInt (numerator, denominator), the denominator always positive and the pair always reduced, so no floating-point
   number is used anywhere and results are exact for numbers of any size (up to 400 digits each). Rounding for display is half away from zero.
   Required by tests/percent_basic_test.js and inlined into calculators/basic-percentage-calculator/ by tools/percent_basic_page.js. */
(function (root) {
  'use strict';
  var MAX_DIGITS = 400, MAX_PLACES = 12;
  function Err(m) { this.message = m; }
  function abs(x) { return x < 0n ? -x : x; }
  function gcd(a, b) { a = abs(a); b = abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function mk(n, d) { if (d === 0n) throw new Err('Division by zero.'); if (d < 0n) { n = -n; d = -d; } var g = gcd(n, d); if (g > 1n) { n /= g; d /= g; } return { n: n, d: d }; }
  function mul(a, b) { return mk(a.n * b.n, a.d * b.d); }
  function div(a, b) { if (b.n === 0n) throw new Err('Division by zero.'); return mk(a.n * b.d, a.d * b.n); }
  function sub(a, b) { return mk(a.n * b.d - b.n * a.d, a.d * b.d); }
  function P10(k) { return 10n ** BigInt(k); }
  var HUNDRED = { n: 100n, d: 1n };

  /* ---------- reading numbers ---------- */
  /* A plain decimal number: optional sign, digits, optional decimal point. A trailing % is accepted only where opts.pct is set. */
  function parseNum(src, label, opts) {
    opts = opts || {};
    var s = String(src == null ? '' : src).replace(/[\u2212\u2013\u2014]/g, '-').replace(/\u00a0/g, ' ').trim();
    if (s === '') return { empty: true };
    var pc = false;
    if (/%$/.test(s)) { if (!opts.pct) throw new Err(label + ' is not a percentage here: remove the % sign.'); s = s.slice(0, -1).trim(); pc = true; }
    if (/,/.test(s)) throw new Err('Commas are not used here. Write 1000 instead of 1,000, and a decimal point for decimals (' + label + ').');
    if (/[eE]/.test(s) && /^[+-]?[\d.]+[eE]/.test(s)) throw new Err(label + ': write the number in full, without e or exponent notation.');
    var m = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(s);
    if (!m || (m[2] === '' && (m[3] === undefined || m[3] === ''))) throw new Err(label + ' is not a number. Use digits, an optional minus sign and a decimal point, for example 12.5 or -3.');
    var ip = m[2].replace(/^0+(?=\d)/, ''), fp = m[3] || '';
    if (ip === '') ip = '0';
    if ((ip + fp).length > MAX_DIGITS) throw new Err(label + ' has more than ' + MAX_DIGITS + ' digits. Use a shorter number.');
    var n = BigInt(ip + fp), neg = m[1] === '-' && n !== 0n;
    return { q: mk(neg ? -n : n, P10(fp.length)), text: (neg ? '-' : '') + ip + (fp ? '.' + fp : ''), pct: pc };
  }

  /* ---------- output forms ---------- */
  function roundText(q, p) { // half away from zero, exactly p decimal places
    var neg = q.n < 0n, a = abs(q.n) * P10(p), r = (2n * a + q.d) / (2n * q.d), s = r.toString();
    if (p > 0) { while (s.length <= p) s = '0' + s; s = s.slice(0, s.length - p) + '.' + s.slice(s.length - p); }
    return (neg && r !== 0n ? '-' : '') + s;
  }
  function termDigits(d) { var t = d, a = 0, b = 0; while (t % 2n === 0n) { t /= 2n; a++; } while (t % 5n === 0n) { t /= 5n; b++; } return t === 1n ? Math.max(a, b) : -1; }
  function fmt(q, places) { // { text, exact }
    if (places === undefined || places === null || places === 'auto' || places === '') {
      var k = termDigits(q.d);
      if (k >= 0 && k <= 60) return { text: roundText(q, k), exact: true };
      return { text: roundText(q, 6), exact: false };
    }
    var p = Number(places); if (!(p >= 0 && p <= MAX_PLACES && Math.floor(p) === p)) throw new Err('Decimal places must be a whole number from 0 to ' + MAX_PLACES + ', or auto.');
    return { text: roundText(q, p), exact: (q.n * P10(p)) % q.d === 0n };
  }
  function F(q) { return q.d === 1n ? String(q.n) : q.n + '/' + q.d; }
  function dv(q) { var k = termDigits(q.d); return k >= 0 && k <= 40 ? roundText(q, k) : F(q); } // an exact decimal when it ends, otherwise the exact fraction
  function sg(t) { return t.charAt(0) === '-' ? '(' + t + ')' : t; }
  function pct(t) { return t + '%'; }

  function opt(places) { if (places === undefined || places === null || places === '' || places === 'auto') return 'auto'; var p = Number(places); if (!(p >= 0 && p <= MAX_PLACES && Math.floor(p) === p)) throw new Err('Decimal places must be a whole number from 0 to ' + MAX_PLACES + ', or auto.'); return p; }

  function finish(base, q, places, unit) {
    var f = fmt(q, places), pl = places === 'auto' ? 'auto' : places;
    base.ok = true; base.num = String(q.n); base.den = String(q.d); base.exact = f.exact; base.text = f.text; base.unit = unit || ''; base.frac = F(q); base.places = pl;
    base.big = (f.exact ? '' : '\u2248 ') + f.text + (unit || '');
    return base;
  }
  function sentence(t, res) { var v = res.big; if (t.indexOf(' = @') >= 0) return t.replace(' = @', ' ' + (res.exact ? '=' : '\u2248') + ' ' + v.replace(/^\u2248 /, '')); return t.replace('@', v); }
  function fail(e) { if (e instanceof Err) return { ok: false, error: e.message, empty: false }; throw e; }
  function emptyR(hint) { return { ok: false, empty: true, error: '', hint: hint }; }

  /* ---------- the three percentage questions ---------- */
  function calc(o) {
    try {
      o = o || {}; var kind = o.kind, places = opt(o.places);
      if (kind !== 'of' && kind !== 'what' && kind !== 'whole') throw new Err('Choose one of the three questions.');
      var lx = kind === 'of' ? 'The percentage (X)' : kind === 'what' ? 'The first number (X)' : 'The number (X)', ly = kind === 'of' ? 'The number (Y)' : kind === 'what' ? 'The second number (Y)' : 'The percentage (Y)';
      var X = parseNum(o.x, lx, { pct: kind === 'of' }), Y = parseNum(o.y, ly, { pct: kind === 'whole' });
      if (X.empty || Y.empty) return emptyR(kind === 'of' ? 'Enter the percentage X and the number Y.' : kind === 'what' ? 'Enter the numbers X and Y.' : 'Enter the number X and the percentage Y.');
      var x = X.q, y = Y.q, xt = X.text, yt = Y.text, steps = [], rows = [], warn = [], r, res;
      if (kind === 'of') {
        var dec = div(x, HUNDRED); r = mul(dec, y);
        steps.push('Write ' + pct(xt) + ' as a decimal: divide by 100. ' + xt + ' \u00f7 100 = ' + dv(dec) + '.');
        steps.push('Multiply the decimal by ' + yt + ': ' + sg(dv(dec)) + ' \u00d7 ' + sg(yt) + ' = ' + dv(r) + '.');
        steps.push('Check: ' + dv(r) + ' \u00f7 ' + sg(yt) + ' \u00d7 100 = ' + (y.n === 0n ? 'not defined because Y is 0, but the result of 0 is correct' : dv(mul(div(r, y), HUNDRED)) + '%, the percentage you entered') + '.');
        res = finish({ kind: kind, formula: 'Result = (X \u00f7 100) \u00d7 Y', subst: '(' + xt + ' \u00f7 100) \u00d7 ' + sg(yt) + ' = ' + dv(r), sentence: pct(xt) + ' of ' + yt + ' = ' + '@' }, r, places, '');
        rows.push(['Percentage (X)', pct(xt), '']); rows.push(['Number (Y)', yt, '']); rows.push(['X as a decimal', dv(dec), 'X \u00f7 100']);
        rows.push(['Result: X% of Y', res.big, res.exact ? 'Exact' : 'Rounded: the exact value is ' + F(r)]);
        if (r.d !== 1n) rows.push(['Exact value as a fraction', F(r), '']);
        rows.push(['The rest of Y (Y \u2212 result)', dv(sub(y, r)), 'Y minus X% of Y, which is ' + dv(sub(HUNDRED, x)) + '% of Y']);
        if (x.n < 0n) warn.push('A negative percentage gives a result with the opposite sign to Y. That is correct mathematically; check that a negative percentage is what you meant.');
      } else if (kind === 'what') {
        if (y.n === 0n) throw new Err('Y is 0, so X cannot be written as a percentage of Y. Dividing by 0 is not defined.');
        var ratio = div(x, y); r = mul(ratio, HUNDRED);
        steps.push('Divide X by Y: ' + sg(xt) + ' \u00f7 ' + sg(yt) + ' = ' + dv(ratio) + '.');
        steps.push('Multiply by 100 to turn the ratio into a percentage: ' + sg(dv(ratio)) + ' \u00d7 100 = ' + dv(r) + '%.');
        steps.push('Check: ' + dv(r) + '% of ' + yt + ' = ' + dv(mul(div(r, HUNDRED), y)) + ', the X you entered.');
        res = finish({ kind: kind, formula: 'Percentage = (X \u00f7 Y) \u00d7 100', subst: '(' + sg(xt) + ' \u00f7 ' + sg(yt) + ') \u00d7 100 = ' + dv(r) + '%', sentence: xt + ' is @ of ' + yt }, r, places, '%');
        rows.push(['First number (X)', xt, '']); rows.push(['Second number (Y)', yt, '']); rows.push(['Ratio X \u00f7 Y', dv(ratio), '']);
        rows.push(['X as a percentage of Y', res.big, res.exact ? 'Exact' : 'Rounded: the exact value is ' + F(r) + '%']);
        if (r.d !== 1n) rows.push(['Exact value as a fraction', F(r) + '%', '']);
        if (x.n !== 0n && (x.n < 0n) !== (y.n < 0n)) warn.push('X and Y have opposite signs, so the percentage is negative.');
        else if (abs(x.n) * y.d > abs(y.n) * x.d) warn.push('X is larger than Y, so the percentage is above 100%. That is correct: X is more than the whole Y.');
      } else {
        if (y.n === 0n) throw new Err(x.n === 0n ? 'Y is 0%. Zero is 0% of every number, so the whole cannot be found.' : 'Y is 0%, so no number has X as 0% of it. Enter a percentage other than 0.');
        var yd = div(y, HUNDRED); r = div(x, yd);
        steps.push('Write ' + pct(yt) + ' as a decimal: divide by 100. ' + yt + ' \u00f7 100 = ' + dv(yd) + '.');
        steps.push('Divide X by the decimal: ' + sg(xt) + ' \u00f7 ' + sg(dv(yd)) + ' = ' + dv(r) + '.');
        steps.push('Check: ' + yt + '% of ' + dv(r) + ' = ' + dv(mul(yd, r)) + ', the X you entered.');
        res = finish({ kind: kind, formula: 'Whole = X \u00f7 (Y \u00f7 100)', subst: sg(xt) + ' \u00f7 (' + sg(yt) + ' \u00f7 100) = ' + dv(r), sentence: xt + ' is ' + pct(yt) + ' of @' }, r, places, '');
        rows.push(['Part (X)', xt, '']); rows.push(['Percentage (Y)', pct(yt), '']); rows.push(['Y as a decimal', dv(yd), 'Y \u00f7 100']);
        rows.push(['The whole', res.big, res.exact ? 'Exact' : 'Rounded: the exact value is ' + F(r)]);
        if (r.d !== 1n) rows.push(['Exact value as a fraction', F(r), '']);
        if (y.n < 0n) warn.push('A negative percentage gives a whole with the opposite sign to X. Check that a negative percentage is what you meant.');
      }
      res.sentence = sentence(res.sentence, res);
      res.steps = steps; res.rows = rows; res.warnings = warn; res.x = xt; res.y = yt;
      return res;
    } catch (e) { return fail(e); }
  }

  /* ---------- conversions: percent, decimal and fraction ---------- */
  function convert(o) {
    try {
      o = o || {}; var dir = o.dir, places = opt(o.places);
      if (['p2d', 'd2p', 'f2p', 'p2f'].indexOf(dir) < 0) throw new Err('Choose a conversion.');
      var steps = [], rows = [], warn = [], r, res, V;
      if (dir === 'f2p') {
        var raw = String(o.v == null ? '' : o.v).replace(/[\u2044\u2215]/g, '/').trim();
        if (raw === '') return emptyR('Enter a fraction such as 3/4.');
        var parts = raw.split('/');
        if (parts.length !== 2) throw new Err('Enter one fraction with a single slash, for example 3/4. For a decimal, use the Decimal to percent conversion.');
        var A = parseNum(parts[0], 'The numerator'), B = parseNum(parts[1], 'The denominator');
        if (A.empty || B.empty) throw new Err('A fraction needs a numerator and a denominator, for example 3/4.');
        if (B.q.n === 0n) throw new Err('The denominator is 0. A fraction cannot have 0 on the bottom.');
        var val = div(A.q, B.q); r = mul(val, HUNDRED);
        steps.push('Divide the numerator by the denominator: ' + sg(A.text) + ' \u00f7 ' + sg(B.text) + ' = ' + dv(val) + '.');
        steps.push('Multiply by 100: ' + sg(dv(val)) + ' \u00d7 100 = ' + dv(r) + '%.');
        res = finish({ kind: dir, formula: 'Percentage = (numerator \u00f7 denominator) \u00d7 100', subst: '(' + sg(A.text) + ' \u00f7 ' + sg(B.text) + ') \u00d7 100 = ' + dv(r) + '%', sentence: A.text + '/' + B.text + ' = @' }, r, places, '%');
        rows.push(['Fraction', A.text + '/' + B.text, '']); rows.push(['Decimal value', dv(val), '']); rows.push(['Percentage', res.big, res.exact ? 'Exact' : 'Rounded: the exact value is ' + F(r) + '%']);
        if (val.d !== 1n) rows.push(['Fraction in lowest terms', F(val), '']);
      } else {
        V = parseNum(o.v, dir === 'd2p' ? 'The decimal' : 'The percentage', { pct: dir !== 'd2p' });
        if (V.empty) return emptyR(dir === 'd2p' ? 'Enter a decimal such as 0.75.' : 'Enter a percentage such as 25.');
        var v = V.q, vt = V.text;
        if (dir === 'p2d') {
          r = div(v, HUNDRED);
          steps.push('Divide the percentage by 100: ' + sg(vt) + ' \u00f7 100 = ' + dv(r) + '. Moving the decimal point two places to the left does the same.');
          res = finish({ kind: dir, formula: 'Decimal = percentage \u00f7 100', subst: sg(vt) + ' \u00f7 100 = ' + dv(r), sentence: pct(vt) + ' = @' }, r, places, '');
          rows.push(['Percentage', pct(vt), '']); rows.push(['Decimal', res.big, res.exact ? 'Exact' : 'Rounded: the exact value is ' + F(r)]); rows.push(['Fraction in lowest terms', F(r), '']);
        } else if (dir === 'd2p') {
          r = mul(v, HUNDRED);
          steps.push('Multiply the decimal by 100: ' + sg(vt) + ' \u00d7 100 = ' + dv(r) + '. Moving the decimal point two places to the right does the same.');
          res = finish({ kind: dir, formula: 'Percentage = decimal \u00d7 100', subst: sg(vt) + ' \u00d7 100 = ' + dv(r) + '%', sentence: vt + ' = @' }, r, places, '%');
          rows.push(['Decimal', vt, '']); rows.push(['Percentage', res.big, res.exact ? 'Exact' : 'Rounded: the exact value is ' + F(r) + '%']); rows.push(['Decimal as a fraction', F(v), 'in lowest terms']);
        } else {
          r = div(v, HUNDRED);
          steps.push('Write the percentage over 100: ' + sg(vt) + '/100 (a decimal percentage is scaled by a power of 10 first).');
          steps.push('Reduce to lowest terms by dividing top and bottom by their greatest common divisor: ' + F(r) + '.');
          res = finish({ kind: dir, formula: 'Fraction = percentage \u00f7 100, reduced', subst: sg(vt) + '/100 = ' + F(r), sentence: pct(vt) + ' = @' }, r, places, '');
          res.big = F(r); res.text = F(r); res.exact = true;
          rows.push(['Percentage', pct(vt), '']); rows.push(['Fraction in lowest terms', F(r), '']); rows.push(['Decimal', dv(r), '']);
        }
        if (v.n < 0n) warn.push('A negative value is kept with its sign. A negative percentage is unusual, so check that it is intended.');
      }
      res.sentence = sentence(res.sentence, res);
      res.steps = steps; res.rows = rows; res.warnings = warn;
      return res;
    } catch (e) { return fail(e); }
  }

  var api = { calc: calc, convert: convert, parseNum: parseNum, roundText: roundText, fmt: fmt, make: mk, MAX_DIGITS: MAX_DIGITS, MAX_PLACES: MAX_PLACES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Percent = api;
})(typeof window !== 'undefined' ? window : this);
