/* Elecmetric Percentage Calculator: exact rational engine for Mode 03 (Percentage Difference & Change). One file, no DOM, no floating point.
   Built only on the public API of tools/percent_engine.js (parseNum, make, fmt, roundText), so Modes 01 and 02 are untouched. Four questions:
     diff  percentage difference between A and B (symmetric) = |A - B| / ((|A| + |B|) / 2) x 100   (A = B = 0 refused)
     chg   percentage change from A to B (A is the reference) = (B - A) / |A| x 100, labelled increase or decrease   (A = 0 refused)
     cmp   A compared with B (B is the reference)             = (A - B) / |B| x 100, labelled higher or lower      (B = 0 refused)
     pp    two percentages: change in percentage points = P2 - P1, and the relative change = (P2 - P1) / |P1| x 100   (relative not defined at P1 = 0)
   Required by tests/percent_diff_test.js and inlined into calculators/percentage-difference-calculator/ by tools/percent_diff_page.js. */
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
  var HUNDRED = { n: 100n, d: 1n }, TWO = { n: 2n, d: 1n };
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
  var KINDS = ['diff', 'chg', 'cmp', 'pp'];
  var LAB = { diff: ['The first value (A)', 'The second value (B)'], chg: ['The old value (A)', 'The new value (B)'], cmp: ['The value being compared (A)', 'The reference value (B)'], pp: ['The first percentage', 'The second percentage'] };
  var HINT = { diff: 'Enter the two values A and B.', chg: 'Enter the old value and the new value.', cmp: 'Enter A and the reference value B.', pp: 'Enter the two percentages, for example 12 and 15.' };
  var UNIT = { diff: '%', chg: '%', cmp: '%', pp: ' pp' };
  function change(from, to) { return mul(div(sub(to, from), qa(from)), HUNDRED); } // signed, from is the reference

  function calc(o) {
    try {
      o = o || {}; var kind = o.kind, places = opt(o.places);
      if (KINDS.indexOf(kind) < 0) throw new Err('Choose one of the four questions.');
      var pp = kind === 'pp';
      var X = P.parseNum(o.x, LAB[kind][0], { pct: pp }), Y = P.parseNum(o.y, LAB[kind][1], { pct: pp });
      if (X.empty || Y.empty) return emptyR(HINT[kind]);
      var x = X.q, y = Y.q, xt = X.text, yt = Y.text, steps = [], rows = [], warn = [], r, res, shown, fa;
      var neg = x.n < 0n || y.n < 0n, opp = (x.n < 0n && y.n > 0n) || (x.n > 0n && y.n < 0n);
      if (kind === 'diff') {
        var ax = qa(x), ay = qa(y), dif = qa(sub(x, y)), mean = div(add(ax, ay), TWO), ratio, nn = !neg;
        if (mean.n === 0n) throw new Err('Both values are 0, so their average is 0 and a percentage difference is not defined: it would be 0 divided by 0. Enter two values that are not both 0.');
        ratio = div(dif, mean); r = mul(ratio, HUNDRED);
        steps.push('Find the size of the difference: |' + xt + ' \u2212 ' + sg(yt) + '| = ' + dv(dif) + '.');
        steps.push(nn ? 'Find the average of the two values: (' + xt + ' + ' + yt + ') \u00f7 2 = ' + dv(mean) + '.' : 'Find the average of the two sizes: (' + dv(ax) + ' + ' + dv(ay) + ') \u00f7 2 = ' + dv(mean) + '.');
        steps.push('Divide the difference by the average: ' + dv(dif) + ' \u00f7 ' + dv(mean) + ' = ' + dv(ratio) + '.');
        steps.push('Multiply by 100: ' + dv(ratio) + ' \u00d7 100 = ' + dv(r) + '%.');
        steps.push('Check: ' + dv(r) + '% of the average ' + dv(mean) + ' = ' + dv(mul(div(r, HUNDRED), mean)) + ', the difference. Swapping A and B gives the same answer, because neither the difference nor the average depends on the order.');
        res = finish({ kind: kind, formula: nn ? 'Percentage difference = |A \u2212 B| \u00f7 ((A + B) \u00f7 2) \u00d7 100' : 'Percentage difference = |A \u2212 B| \u00f7 ((|A| + |B|) \u00f7 2) \u00d7 100', subst: '|' + xt + ' \u2212 ' + sg(yt) + '| \u00f7 ' + (nn ? '((' + xt + ' + ' + yt + ') \u00f7 2)' : '((|' + xt.replace('-', '') + '| + |' + yt.replace('-', '') + '|) \u00f7 2)') + ' \u00d7 100 = ' + dv(r) + '%' }, r, places, '%');
        res.dir = '';
        res.sentence = 'The percentage difference between ' + xt + ' and ' + yt + ' is ' + res.big;
        rows.push(['First value (A)', xt, '']); rows.push(['Second value (B)', yt, '']); rows.push(['Difference |A \u2212 B|', dv(dif), '']);
        rows.push(['Average of the two', dv(mean), nn ? '(A + B) \u00f7 2' : '(|A| + |B|) \u00f7 2, the average of the sizes']);
        rows.push(['Percentage difference', res.big, res.exact ? 'Exact. The same whichever value is called A' : 'Rounded: the exact value is ' + F(r) + '%']);
        if (r.d !== 1n) rows.push(['Exact value as a fraction', F(r) + '%', '']);
        if (x.n !== 0n) rows.push(['Percentage change from A to B', dvp(change(x, y)), 'A is the reference, so this changes if you swap the values']);
        if (y.n !== 0n) rows.push(['Percentage change from B to A', dvp(change(y, x)), 'B is the reference']);
        if (opp) warn.push('The two values have opposite signs, so the percentage difference is always 200%, the largest it can be. If the sign matters, compare the amounts instead.');
        else if (x.n === 0n || y.n === 0n) warn.push('One value is 0, so the percentage difference is always 200%, the largest it can be.');
        if (neg && !opp && x.n !== 0n && y.n !== 0n) warn.push('Both values are negative, so the average is taken of their sizes. Check that this suits your data.');
      } else if (kind === 'chg' || kind === 'cmp') {
        var isC = kind === 'cmp', from = isC ? y : x, to = isC ? x : y, ft = isC ? yt : xt, tt = isC ? xt : yt, nm = isC ? 'B' : 'A';
        if (from.n === 0n) throw new Err(isC ? 'The reference value B is 0, so a percentage difference compared with 0 is not defined: any other value would be an infinite percentage of it. Use the amount of difference instead, or choose another reference.' : 'The old value is 0, so a percentage change from 0 is not defined: any change from 0 would be an infinite percentage. Use the amount of change instead, or choose a different reference value.');
        var ch = sub(to, from), rt = div(ch, qa(from)), fneg = from.n < 0n, fd = fneg ? '|' + ft.replace('-', '') + '|' : ft, up = ch.n > 0n, zero = ch.n === 0n;
        r = mul(rt, HUNDRED);
        var dir = isC ? (zero ? 'equal' : up ? 'higher' : 'lower') : (zero ? 'no change' : up ? 'increase' : 'decrease');
        steps.push('Find the difference: ' + (isC ? 'A \u2212 B' : 'new \u2212 old') + ' = ' + sg(tt) + ' \u2212 ' + sg(ft) + ' = ' + dv(ch) + '.');
        steps.push('Divide by ' + (fneg ? 'the size of the reference value ' : 'the reference value ') + nm + ': ' + sg(dv(ch)) + ' \u00f7 ' + fd + ' = ' + dv(rt) + '.');
        steps.push('Multiply by 100: ' + sg(dv(rt)) + ' \u00d7 100 = ' + dv(r) + '%, ' + (zero ? 'no difference.' : isC ? (up ? 'A is higher than B.' : 'A is lower than B.') : (up ? 'an increase.' : 'a decrease.')));
        steps.push('Check: ' + sg(ft) + ' + ' + sg(dv(r)) + '% of ' + (fneg ? 'its size ' : '') + fd + ' = ' + dv(add(from, mul(qa(from), div(r, HUNDRED)))) + ', the ' + (isC ? 'value of A' : 'new value') + ' you entered.');
        var fm = isC ? 'Difference from the reference = (A \u2212 B) \u00f7 |B| \u00d7 100' : 'Percentage change = (B \u2212 A) \u00f7 |A| \u00d7 100';
        res = finish({ kind: kind, formula: fneg ? fm : fm.replace('|B|', 'B').replace('|A|', 'A'), subst: '(' + sg(tt) + ' \u2212 ' + sg(ft) + ') \u00f7 ' + fd + ' \u00d7 100 = ' + dv(r) + '%' }, r, places, '%');
        fa = P.fmt(qa(r), places); shown = (fa.exact ? '' : '\u2248 ') + fa.text + '%'; res.dir = dir;
        res.sentence = zero ? (isC ? xt + ' is equal to ' + yt + ' (0% difference)' : 'From ' + xt + ' to ' + yt + ' there is no change (0%)') : isC ? xt + ' is ' + shown + ' ' + dir + ' than ' + yt : 'From ' + xt + ' to ' + yt + ' is ' + (up ? 'an increase' : 'a decrease') + ' of ' + shown;
        rows.push([isC ? 'Value compared (A)' : 'Old value (A)', xt, '']); rows.push([isC ? 'Reference value (B)' : 'New value (B)', yt, '']);
        rows.push([isC ? 'Difference (A \u2212 B)' : 'Change (new \u2212 old)', dv(ch), '']);
        rows.push([isC ? 'A compared with B' : 'Percentage change', res.big, res.exact ? 'Exact' : 'Rounded: the exact value is ' + F(r) + '%']);
        if (r.d !== 1n) rows.push(['Exact value as a fraction', F(r) + '%', '']);
        rows.push(['Direction', dir.charAt(0).toUpperCase() + dir.slice(1), '']);
        rows.push([isC ? 'A as a percentage of B' : 'New as a percentage of old', dvp(mul(div(to, from), HUNDRED)), isC ? 'A \u00f7 B \u00d7 100' : 'B \u00f7 A \u00d7 100']);
        var other = isC ? x : y;
        if (other.n !== 0n) rows.push([isC ? 'B compared with A' : 'Change back from B to A', dvp(change(other, from)), 'The other way round the base is different, so the percentage is different']);
        else rows.push([isC ? 'B compared with A' : 'Change back from B to A', 'not defined', 'the starting value would be 0']);
        var sd = mk(abs(sub(x, y).n) * 1n, sub(x, y).d);
        if (!(abs(x.n) === 0n && abs(y.n) === 0n)) rows.push(['Percentage difference (symmetric)', dvp(mul(div(sd, div(add(qa(x), qa(y)), TWO)), HUNDRED)), 'Treats A and B equally. This is the Percentage difference question']);
        if (fneg) warn.push('The reference value is negative, so the difference is divided by its size. That way a larger value is always shown as higher. Check that this suits your data.');
        if (opp) warn.push('The two values have opposite signs. A percentage comparison across zero is hard to read; the amount of difference is often clearer.');
      } else {
        var d = sub(y, x), up3 = d.n > 0n, z3 = d.n === 0n, rel = null, dp = P.fmt(qa(d), places);
        r = d;
        if (x.n !== 0n) rel = change(x, y);
        var dir3 = z3 ? 'no change' : up3 ? 'increase' : 'decrease';
        steps.push('Subtract the first percentage from the second: ' + sg(yt) + ' \u2212 ' + sg(xt) + ' = ' + dv(d) + ' percentage points. A percentage point is one step on the percentage scale.');
        steps.push(rel ? 'Divide the change by the first percentage: ' + sg(dv(d)) + ' \u00f7 ' + (x.n < 0n ? '|' + xt.replace('-', '') + '|' : xt) + ' = ' + dv(div(d, qa(x))) + '.' : 'The first percentage is 0, so a relative change from it is not defined. Only the change in percentage points can be given.');
        steps.push(rel ? 'Multiply by 100: ' + sg(dv(div(d, qa(x)))) + ' \u00d7 100 = ' + dv(rel) + '%. This is the relative change: the second percentage compared with the first.' : 'Nothing further to calculate: the points are the whole answer.');
        steps.push(rel ? 'Check: ' + xt + '% + ' + sg(dv(rel)) + '% of ' + (x.n < 0n ? 'its size ' : '') + dv(qa(x)) + ' = ' + dv(add(x, mul(qa(x), div(rel, HUNDRED)))) + '%, the second percentage.' : 'Check: ' + xt + '% + ' + sg(dv(d)) + ' points = ' + dv(add(x, d)) + '%, the second percentage.');
        res = finish({ kind: kind, formula: 'Change in points = P2 \u2212 P1;  relative change = (P2 \u2212 P1) \u00f7 |P1| \u00d7 100', subst: sg(yt) + ' \u2212 ' + sg(xt) + ' = ' + dv(d) + ' points' + (rel ? ';  ' + sg(dv(d)) + ' \u00f7 ' + (x.n < 0n ? '|' + xt.replace('-', '') + '|' : xt) + ' \u00d7 100 = ' + dv(rel) + '%' : '') }, r, places, ' pp');
        res.dir = dir3; res.rel = rel ? dvp(rel) : 'not defined';
        var relS = rel ? (function () { var f2 = P.fmt(qa(rel), places); return (f2.exact ? '' : '\u2248 ') + f2.text + '%'; })() : '';
        shown = (dp.exact ? '' : '\u2248 ') + dp.text;
        res.sentence = z3 ? 'From ' + xt + '% to ' + yt + '% there is no change (0 percentage points)' : 'From ' + xt + '% to ' + yt + '% is ' + (up3 ? 'an increase' : 'a decrease') + ' of ' + shown + ' percentage points' + (rel ? ' (a relative ' + (up3 ? 'increase' : 'decrease') + ' of ' + relS + ')' : '');
        rows.push(['First percentage', pc(xt), '']); rows.push(['Second percentage', pc(yt), '']);
        rows.push(['Change in percentage points', res.big, res.exact ? 'Exact. A difference of two percentages is in points, not in %' : 'Rounded: the exact value is ' + F(r) + ' points']);
        rows.push(['Relative change in the percentage', res.rel, rel ? 'Change in points \u00f7 first percentage. This is a percentage of the first percentage' : 'the first percentage is 0']);
        rows.push(['Direction', dir3.charAt(0).toUpperCase() + dir3.slice(1), '']);
        if (x.n !== 0n) rows.push(['Second as a multiple of the first', dv(div(y, x)), 'P2 \u00f7 P1']);
        if (neg || sub(x, HUNDRED).n > 0n || sub(y, HUNDRED).n > 0n) warn.push('A percentage below 0 or above 100 is unusual for a share, a yield or an efficiency. The arithmetic still works; check that the values are right.');
        if (x.n < 0n) warn.push('The first percentage is negative, so the relative change is divided by its size.');
      }
      res.steps = steps; res.rows = rows; res.warnings = warn; res.x = xt; res.y = yt;
      return res;
    } catch (e) { return fail(e); }
  }

  var api = { calc: calc, KINDS: KINDS, LABELS: LAB, UNITS: UNIT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PercentDiff = api;
})(typeof window !== 'undefined' ? window : this);
