/* Elecmetric Percentage Calculator: exact rational engine for Mode 02 (Increase & Decrease). One file, no DOM, no floating point.
   It uses only the public API of tools/percent_engine.js (parseNum, make, fmt), so Mode 01 is untouched. Five questions:
     inc    V increased by P%           = V x (1 + P/100)
     dec    V decreased by P%           = V x (1 - P/100)
     chg    percentage change Old to New = (New - Old) / |Old| x 100, labelled increase or decrease
     revinc original before a P% increase  = New / (1 + P/100)
     revdec original before a P% decrease  = New / (1 - P/100)   (the "price before discount" question)
   Required by tests/percent_change_test.js and inlined into calculators/percentage-increase-decrease/ by tools/percent_change_page.js. */
(function (root) {
  'use strict';
  var P = (typeof module !== 'undefined' && module.exports) ? require('./percent_engine.js') : root.Percent;
  var mk = P.make;
  function Err(m) { this.message = m; }
  function abs(x) { return x < 0n ? -x : x; }
  function add(a, b) { return mk(a.n * b.d + b.n * a.d, a.d * b.d); }
  function sub(a, b) { return mk(a.n * b.d - b.n * a.d, a.d * b.d); }
  function mul(a, b) { return mk(a.n * b.n, a.d * b.d); }
  function div(a, b) { return mk(a.n * b.d, a.d * b.n); }
  function qa(a) { return { n: abs(a.n), d: a.d }; }
  var ONE = { n: 1n, d: 1n }, HUNDRED = { n: 100n, d: 1n };
  function termDigits(d) { var t = d, a = 0, b = 0; while (t % 2n === 0n) { t /= 2n; a++; } while (t % 5n === 0n) { t /= 5n; b++; } return t === 1n ? Math.max(a, b) : -1; }
  function F(q) { return q.d === 1n ? String(q.n) : q.n + '/' + q.d; }
  function dv(q) { var k = termDigits(q.d); return k >= 0 && k <= 40 ? P.roundText(q, k) : F(q); }
  function sg(t) { return t.charAt(0) === '-' ? '(' + t + ')' : t; }
  function pc(t) { return t + '%'; }
  function dvp(q) { var k = termDigits(q.d); return k >= 0 && k <= 40 ? P.roundText(q, k) + '%' : '\u2248 ' + P.roundText(q, 6) + '%'; }
  function opt(places) { if (places === undefined || places === null || places === '' || places === 'auto') return 'auto'; var p = Number(places); if (!(p >= 0 && p <= P.MAX_PLACES && Math.floor(p) === p)) throw new Err('Decimal places must be a whole number from 0 to ' + P.MAX_PLACES + ', or auto.'); return p; }
  function fail(e) { if (e && typeof e.message === 'string' && !(e instanceof Error)) return { ok: false, error: e.message, empty: false }; throw e; }
  function emptyR(hint) { return { ok: false, empty: true, error: '', hint: hint }; }
  function finish(base, q, places, unit) {
    var f = P.fmt(q, places);
    base.ok = true; base.num = String(q.n); base.den = String(q.d); base.exact = f.exact; base.text = f.text; base.unit = unit || ''; base.frac = F(q); base.places = places;
    base.big = (f.exact ? '' : '\u2248 ') + f.text + (unit || '');
    return base;
  }
  var KINDS = ['inc', 'dec', 'chg', 'revinc', 'revdec'];
  var LAB = {
    inc: ['The starting value (V)', 'The percentage increase (P)'], dec: ['The starting value (V)', 'The percentage decrease (P)'],
    chg: ['The old value', 'The new value'], revinc: ['The value after the increase', 'The percentage increase (P)'], revdec: ['The value after the decrease', 'The percentage decrease (P)']
  };
  var HINT = {
    inc: 'Enter the starting value and the percentage to add.', dec: 'Enter the starting value and the percentage to take off.', chg: 'Enter the old value and the new value.',
    revinc: 'Enter the value after the increase and the percentage it went up by.', revdec: 'Enter the value after the decrease (for example the sale price) and the percentage taken off.'
  };

  function calc(o) {
    try {
      o = o || {}; var kind = o.kind, places = opt(o.places);
      if (KINDS.indexOf(kind) < 0) throw new Err('Choose one of the five questions.');
      var pctY = kind !== 'chg';
      var X = P.parseNum(o.x, LAB[kind][0], {}), Y = P.parseNum(o.y, LAB[kind][1], { pct: pctY });
      if (X.empty || Y.empty) return emptyR(HINT[kind]);
      var x = X.q, y = Y.q, xt = X.text, yt = Y.text, steps = [], rows = [], warn = [], r, res, d, f;
      if (kind === 'inc' || kind === 'dec') {
        var up = kind === 'inc', W = up ? 'increase' : 'decrease';
        d = div(y, HUNDRED); f = up ? add(ONE, d) : sub(ONE, d); r = mul(x, f);
        var amt = mul(x, d), back;
        steps.push('Write ' + pc(yt) + ' as a decimal: divide by 100. ' + yt + ' \u00f7 100 = ' + dv(d) + '.');
        steps.push((up ? 'Add it to 1 to get the increase factor: 1 + ' : 'Take it from 1 to get the decrease factor: 1 \u2212 ') + sg(dv(d)) + ' = ' + dv(f) + '.');
        steps.push('Multiply the starting value by the factor: ' + sg(xt) + ' \u00d7 ' + sg(dv(f)) + ' = ' + dv(r) + '.');
        steps.push('Check: the amount of ' + W + ' is ' + sg(xt) + ' \u00d7 ' + sg(dv(d)) + ' = ' + dv(amt) + ', and ' + sg(xt) + (up ? ' + ' : ' \u2212 ') + sg(dv(amt)) + ' = ' + dv(r) + '.');
        res = finish({ kind: kind, formula: up ? 'New value = V \u00d7 (1 + P \u00f7 100)' : 'New value = V \u00d7 (1 \u2212 P \u00f7 100)', subst: sg(xt) + ' \u00d7 (1 ' + (up ? '+' : '\u2212') + ' ' + sg(yt) + ' \u00f7 100) = ' + dv(r), sentence: xt + ' ' + W + 'd by ' + pc(yt) + ' = @' }, r, places, '');
        res.sentence = res.sentence.replace(' = @', ' ' + (res.exact ? '=' : '\u2248') + ' ' + res.text);
        rows.push(['Starting value (V)', xt, '']); rows.push(['Percentage ' + W + ' (P)', pc(yt), '']);
        rows.push(['Amount of ' + W, dv(amt), 'V \u00d7 P \u00f7 100']);
        rows.push(['New value', res.big, res.exact ? 'Exact' : 'Rounded: the exact value is ' + F(r)]);
        if (r.d !== 1n) rows.push(['Exact value as a fraction', F(r), '']);
        rows.push([(up ? 'Increase' : 'Decrease') + ' factor', dv(f), up ? '1 + P \u00f7 100' : '1 \u2212 P \u00f7 100']);
        if (y.n !== 0n && x.n !== 0n) {
          if (f.n === 0n) rows.push(['To get back to V', 'not possible', 'the new value is 0, and no percentage increase turns 0 into V']);
          else { back = mul(sub(ONE, div(ONE, f)), HUNDRED); rows.push([(back.n > 0n ? 'Decrease' : 'Increase') + ' needed to get back to V', dvp(qa(back)), 'Not the same as P, because the percentage is now taken of the new value']); }
        }
        if (y.n < 0n) warn.push('A negative percentage ' + W + ' works the other way: the value ' + (up ? 'falls' : 'rises') + '. Check that a negative percentage is what you meant.');
        if (!up && y.n > 0n && sub(y, HUNDRED).n > 0n) warn.push('A decrease of more than 100% takes the value below zero. That is the arithmetic result; a price or quantity cannot normally fall below 0.');
        if (x.n < 0n) warn.push('The starting value is negative, so a percentage ' + (up ? 'increase' : 'decrease') + ' multiplies it by ' + dv(f) + ' and moves it ' + (abs(f.n) > f.d ? 'further from' : 'closer to') + ' zero. Check that this is the meaning you want.');
      } else if (kind === 'chg') {
        if (x.n === 0n) throw new Err('The old value is 0, so a percentage change from 0 is not defined: any change from 0 would be an infinite percentage. Use the amount of change instead, or choose a different reference value.');
        var ch = sub(y, x), ratio = div(ch, qa(x)); r = mul(ratio, HUNDRED);
        var neg = x.n < 0n, dir = r.n > 0n ? 'increase' : r.n < 0n ? 'decrease' : 'no change', ar = qa(r);
        var den = neg ? '|' + xt.replace('-', '') + '|' : xt;
        steps.push('Find the change: new \u2212 old = ' + sg(yt) + ' \u2212 ' + sg(xt) + ' = ' + dv(ch) + '.');
        steps.push('Divide the change by ' + (neg ? 'the size of the old value, ' + den : 'the old value') + ': ' + sg(dv(ch)) + ' \u00f7 ' + den + ' = ' + dv(ratio) + '.');
        steps.push('Multiply by 100: ' + sg(dv(ratio)) + ' \u00d7 100 = ' + dv(r) + '%, ' + (r.n === 0n ? 'no change.' : (r.n > 0n ? 'an increase.' : 'a decrease.')));
        steps.push('Check: ' + sg(xt) + ' + ' + sg(xt) + ' \u00d7 ' + sg(dv(r)) + '% ' + (neg ? '(taken of its size) ' : '') + '= ' + dv(add(x, mul(qa(x), div(r, HUNDRED)))) + ', the new value.');
        res = finish({ kind: kind, formula: neg ? 'Percentage change = (New \u2212 Old) \u00f7 |Old| \u00d7 100' : 'Percentage change = (New \u2212 Old) \u00f7 Old \u00d7 100', subst: '(' + sg(yt) + ' \u2212 ' + sg(xt) + ') \u00f7 ' + den + ' \u00d7 100 = ' + dv(r) + '%', sentence: '' }, r, places, '%');
        var fa = P.fmt(ar, places), shown = (fa.exact ? '' : '\u2248 ') + fa.text + '%';
        res.dir = dir;
        res.sentence = r.n === 0n ? 'From ' + xt + ' to ' + yt + ' there is no change (0%)' : 'From ' + xt + ' to ' + yt + ' is ' + (dir === 'increase' ? 'an increase' : 'a decrease') + ' of ' + shown;
        rows.push(['Old value', xt, '']); rows.push(['New value', yt, '']); rows.push(['Change (new \u2212 old)', dv(ch), '']);
        rows.push(['Percentage change', res.big, res.exact ? 'Exact' : 'Rounded: the exact value is ' + F(r) + '%']);
        if (r.d !== 1n) rows.push(['Exact value as a fraction', F(r) + '%', '']);
        rows.push(['Direction', dir === 'no change' ? 'No change' : dir === 'increase' ? 'Increase' : 'Decrease', '']);
        rows.push(['Ratio new \u00f7 old', dv(div(y, x)), '']);
        if (y.n !== 0n) { var bk = mul(div(sub(x, y), qa(y)), HUNDRED); rows.push(['Change back from new to old', dvp(bk), 'The reverse change is a different percentage because the base is now the new value']); }
        else rows.push(['Change back from new to old', 'not defined', 'the new value is 0']);
        if (neg) warn.push('The old value is negative, so the change is divided by its size |Old|. That way a rise in value is always shown as an increase. Check that this suits your data.');
        if (x.n > 0n && y.n < 0n) warn.push('The value changes sign, from positive to negative, so it falls by more than 100%. Read the result with care.');
        if (x.n < 0n && y.n > 0n) warn.push('The value changes sign, from negative to positive. A percentage change across zero is hard to interpret; the amount of change is often clearer.');
      } else {
        var up2 = kind === 'revinc', W2 = up2 ? 'increase' : 'decrease';
        d = div(y, HUNDRED); f = up2 ? add(ONE, d) : sub(ONE, d);
        if (f.n === 0n) throw new Err(up2 ? 'An increase of \u2212100% would make every value 0, so the original value cannot be found.' : 'A decrease of 100% would make every value 0, so the original value cannot be found from the new one.');
        r = div(x, f);
        var wrong = up2 ? mul(x, sub(ONE, d)) : mul(x, add(ONE, d)), chgAmt = up2 ? sub(x, r) : sub(r, x);
        steps.push('Write ' + pc(yt) + ' as a decimal: divide by 100. ' + yt + ' \u00f7 100 = ' + dv(d) + '.');
        steps.push((up2 ? 'Add it to 1: 1 + ' : 'Take it from 1: 1 \u2212 ') + sg(dv(d)) + ' = ' + dv(f) + '. This is the factor that turned the original into ' + xt + '.');
        steps.push('Divide the new value by the factor: ' + sg(xt) + ' \u00f7 ' + sg(dv(f)) + ' = ' + dv(r) + '.');
        steps.push('Check: ' + sg(dv(r)) + ' \u00d7 ' + sg(dv(f)) + ' = ' + dv(mul(r, f)) + ', the value you entered.');
        res = finish({ kind: kind, formula: up2 ? 'Original = New \u00f7 (1 + P \u00f7 100)' : 'Original = New \u00f7 (1 \u2212 P \u00f7 100)', subst: sg(xt) + ' \u00f7 (1 ' + (up2 ? '+' : '\u2212') + ' ' + sg(yt) + ' \u00f7 100) = ' + dv(r), sentence: xt + ' after a ' + pc(yt) + ' ' + W2 + ' came from @' }, r, places, '');
        res.sentence = res.sentence.replace('@', res.big);
        rows.push([up2 ? 'Value after the increase' : 'Value after the decrease', xt, '']); rows.push(['Percentage ' + W2 + ' (P)', pc(yt), '']);
        rows.push(['Original value', res.big, res.exact ? 'Exact' : 'Rounded: the exact value is ' + F(r)]);
        if (r.d !== 1n) rows.push(['Exact value as a fraction', F(r), '']);
        rows.push(['Amount of ' + W2, dv(chgAmt), 'original and new value differ by this']);
        rows.push([up2 ? 'Wrong shortcut: taking P% off the new value' : 'Wrong shortcut: adding P% to the new value', dv(wrong), 'This is not the original. P% is a percentage of the original, not of the new value']);
        if (y.n < 0n) warn.push('A negative percentage ' + W2 + ' works the other way, so the original was ' + (up2 ? 'smaller' : 'larger') + ' than you might expect. Check that this is what you meant.');
        if (!up2 && y.n > 0n && sub(y, HUNDRED).n > 0n) warn.push('A decrease of more than 100% gives a negative original value. That is the arithmetic result; check that the percentage is right.');
      }
      res.steps = steps; res.rows = rows; res.warnings = warn; res.x = xt; res.y = yt;
      return res;
    } catch (e) { return fail(e); }
  }

  var api = { calc: calc, KINDS: KINDS, LABELS: LAB };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PercentChange = api;
})(typeof window !== 'undefined' ? window : this);
