/* Elecmetric Percentage Calculator: exact rational engine for Mode 06 (Sequential, Discount & Markup). One file, no DOM, no floating point.
   Like Mode 02 it uses only the public API of tools/percent_engine.js (parseNum, make, fmt), so Modes 01 to 05 are untouched. Eight questions:
     seq    V after a chain of percentage changes  = V x (1 + p1/100) x (1 + p2/100) x ...        (signed: +10 rises, -10 falls)
     disc   original price with D% off             = Price x (1 - D/100)
     dpct   discount from original and sale price  = (Original - Sale) / |Original| x 100
     mkup   selling price from cost and markup     = Cost x (1 + M/100)       (markup is a percentage of COST)
     mgn    selling price from cost and margin     = Cost / (1 - G/100)       (margin is a percentage of the SELLING PRICE)
     mkpct  markup and margin from cost and price  = (Price - Cost) / |Cost| x 100  and  (Price - Cost) / Price x 100
     orig   original price from the sale price and a chain of discounts  = Sale / ((1 - d1/100) x (1 - d2/100) x ...)   (discounts are percent OFF)
     cost   cost price from the selling price and markup                 = Price / (1 + M/100)
   Markup and margin are never mixed: every page row says which quantity the percentage is taken of.
   Required by tests/percent_price_test.js and inlined into calculators/sequential-discount-markup-calculator/ by tools/percent_price_page.js. */
(function (root) {
  'use strict';
  var P = (typeof module !== 'undefined' && module.exports) ? require('./percent_engine.js') : root.Percent;
  var mk = P.make, MAX_STEPS = 30;
  function Err(m) { this.message = m; }
  function abs(x) { return x < 0n ? -x : x; }
  function add(a, b) { return mk(a.n * b.d + b.n * a.d, a.d * b.d); }
  function sub(a, b) { return mk(a.n * b.d - b.n * a.d, a.d * b.d); }
  function mul(a, b) { return mk(a.n * b.n, a.d * b.d); }
  function div(a, b) { return mk(a.n * b.d, a.d * b.n); }
  function qa(a) { return { n: abs(a.n), d: a.d }; }
  var ONE = { n: 1n, d: 1n }, ZERO = { n: 0n, d: 1n }, HUNDRED = { n: 100n, d: 1n };
  function termDigits(d) { var t = d, a = 0, b = 0; while (t % 2n === 0n) { t /= 2n; a++; } while (t % 5n === 0n) { t /= 5n; b++; } return t === 1n ? Math.max(a, b) : -1; }
  function F(q) { return q.d === 1n ? String(q.n) : q.n + '/' + q.d; }
  function dv(q) { var k = termDigits(q.d); return k >= 0 && k <= 40 ? P.roundText(q, k) : F(q); }
  function sg(t) { return t.charAt(0) === '-' ? '(' + t + ')' : t; }
  function pc(t) { return t + '%'; }
  function dvp(q) { var k = termDigits(q.d); return k >= 0 && k <= 40 ? P.roundText(q, k) + '%' : '\u2248 ' + P.roundText(q, 6) + '%'; }
  function slab(t) { return (t.charAt(0) === '-' ? '\u2212' + t.slice(1) : '+' + t) + '%'; }
  function opt(places) { if (places === undefined || places === null || places === '' || places === 'auto') return 'auto'; var p = Number(places); if (!(p >= 0 && p <= P.MAX_PLACES && Math.floor(p) === p)) throw new Err('Decimal places must be a whole number from 0 to ' + P.MAX_PLACES + ', or auto.'); return p; }
  function fail(e) { if (e && typeof e.message === 'string' && !(e instanceof Error)) return { ok: false, error: e.message, empty: false }; throw e; }
  function emptyR(hint) { return { ok: false, empty: true, error: '', hint: hint }; }
  function finish(base, q, places, unit) {
    var f = P.fmt(q, places);
    base.ok = true; base.num = String(q.n); base.den = String(q.d); base.exact = f.exact; base.text = f.text; base.unit = unit || ''; base.frac = F(q); base.places = places;
    base.big = (f.exact ? '' : '\u2248 ') + f.text + (unit || '');
    return base;
  }
  function note(res) { return res.exact ? 'Exact' : 'Rounded: the exact value is ' + F(res.q); }
  /* A list of percentages: spaces, semicolons or commas between them. A comma between two digits is refused (it may be a decimal comma). */
  function list(src, label) {
    var s = String(src == null ? '' : src).replace(/[\u2212\u2013\u2014]/g, '-').replace(/\u00a0/g, ' ').replace(/\s+%/g, '%').trim();
    if (s === '') return { empty: true };
    if (/\d,\d/.test(s)) throw new Err('A comma between two digits is not used here. Separate the percentages with a space or a semicolon, and use a decimal point for decimals.');
    var tk = s.split(/[\s,;]+/).filter(function (t) { return t && !/^(then|and|&|->|\u2192)$/i.test(t); });
    if (!tk.length) return { empty: true };
    if (tk.length > MAX_STEPS) throw new Err('Use at most ' + MAX_STEPS + ' percentages in one chain.');
    return { items: tk.map(function (t, i) { return P.parseNum(t, label + ' ' + (i + 1), { pct: true }); }) };
  }
  var KINDS = ['seq', 'disc', 'dpct', 'mkup', 'mgn', 'mkpct', 'orig', 'cost'];
  var LAB = {
    seq: ['The starting value', 'The changes in order (+ rises, \u2212 falls)'], disc: ['The original price', 'The discount (percent off)'], dpct: ['The original price', 'The sale price'],
    mkup: ['The cost price', 'The markup on cost'], mgn: ['The cost price', 'The margin on the selling price'], mkpct: ['The cost price', 'The selling price'],
    orig: ['The sale price you pay now', 'The discounts taken off, in order (percent off)'], cost: ['The selling price', 'The markup on cost']
  };
  var HINT = {
    seq: 'Enter the starting value and the changes in order, for example +10 -10 or 20 -5 15. A plus rises, a minus falls.', disc: 'Enter the original price and the percentage taken off.',
    dpct: 'Enter the original price and the sale price.', mkup: 'Enter the cost price and the markup percentage (taken of the cost).', mgn: 'Enter the cost price and the margin percentage (taken of the selling price).',
    mkpct: 'Enter the cost price and the selling price.', orig: 'Enter the sale price and the discounts taken off in order, for example 20 10 for 20% off and then 10% off.', cost: 'Enter the selling price and the markup percentage that was added to the cost.'
  };
  var LIST = { seq: 1, orig: 1 }, PLAIN = { dpct: 1, mkpct: 1 };

  function calc(o) {
    try {
      o = o || {}; var kind = o.kind, places = opt(o.places);
      if (KINDS.indexOf(kind) < 0) throw new Err('Choose one of the eight questions.');
      var X = P.parseNum(o.x, LAB[kind][0], {}), Y = LIST[kind] ? list(o.y, 'Percentage') : P.parseNum(o.y, LAB[kind][1], { pct: !PLAIN[kind] });
      if (X.empty || Y.empty) return emptyR(HINT[kind]);
      var x = X.q, xt = X.text, steps = [], rows = [], warn = [], res, r, yt, y, d, f;
      if (kind === 'seq') {
        var L = Y.items, fs = L.map(function (l) { return add(ONE, div(l.q, HUNDRED)); }), cur = x, sum = ZERO, prod, overall, i, nx;
        steps.push('Turn each percentage into a factor: divide it by 100 and add it to 1. ' + L.map(function (l, k) { return slab(l.text) + ' becomes ' + dv(fs[k]); }).join('; ') + '.');
        rows.push(['Starting value', xt, '']);
        L.forEach(function (l, k) { nx = mul(cur, fs[k]); steps.push('Change ' + (k + 1) + ' (' + slab(l.text) + '): ' + sg(dv(cur)) + ' \u00d7 ' + sg(dv(fs[k])) + ' = ' + dv(nx) + '.'); rows.push(['After change ' + (k + 1) + ' (' + slab(l.text) + ')', dv(nx), 'previous value \u00d7 ' + dv(fs[k])]); cur = nx; sum = add(sum, l.q); });
        prod = fs.reduce(function (a, b) { return mul(a, b); }, ONE); overall = mul(sub(prod, ONE), HUNDRED);
        steps.push('Multiply the factors to get the overall factor: ' + fs.map(function (q) { return sg(dv(q)); }).join(' \u00d7 ') + ' = ' + dv(prod) + '. The overall change is (' + dv(prod) + ' \u2212 1) \u00d7 100 = ' + dvp(overall) + '.');
        steps.push('Check: ' + sg(xt) + ' \u00d7 ' + sg(dv(prod)) + ' = ' + dv(mul(x, prod)) + ', the same as the last change.');
        res = finish({ kind: kind, formula: 'Final = V \u00d7 (1 + p1 \u00f7 100) \u00d7 (1 + p2 \u00f7 100) \u00d7 \u2026', subst: sg(xt) + ' \u00d7 ' + fs.map(function (q) { return sg(dv(q)); }).join(' \u00d7 ') + ' = ' + dv(cur), sentence: xt + ' after ' + L.map(function (l) { return slab(l.text); }).join(', then ') + ' = @' }, cur, places, '');
        res.q = cur; res.sentence = res.sentence.replace(' = @', ' ' + (res.exact ? '=' : '\u2248') + ' ' + res.text);
        rows.push(['Final value', res.big, note(res)]);
        rows.push(['Overall change', dvp(overall), 'Final value against the starting value; the same for any start']);
        rows.push(['Overall factor', dv(prod), 'the product of the factors']);
        if (L.length > 1) { rows.push(['Simple sum of the percentages', dvp(sum), 'Not the overall change: each percentage is taken of a different value']); rows.push(['Sum minus overall change', dv(sub(sum, overall)) + (dv(sub(sum, overall)) === '1' ? ' percentage point' : ' percentage points'), 'The error made by just adding the percentages']); }
        if (prod.n === 0n) rows.push(['Change needed to get back to the start', 'not possible', 'the overall factor is 0, so the value is 0 whatever the start']);
        else rows.push(['Change needed to get back to the start', dvp(mul(sub(div(ONE, prod), ONE), HUNDRED)), 'The percentage is now taken of the final value']);
        if (L.some(function (l) { return l.q.n <= -100n * l.q.d; })) warn.push('A change of \u2212100% or more takes the value to zero or below, and every later change starts from there. Check that this is what you meant.');
        if (x.n < 0n) warn.push('The starting value is negative, so a rise multiplies it by a factor above 1 and moves it further from zero. Check that this is the meaning you want.');
        if (L.length === 1) warn.push('One change only: this is the same as Increase or Decrease on Mode 02. Add a second change to chain them.');
      } else if (kind === 'disc') {
        y = Y.q; yt = Y.text; d = div(y, HUNDRED); f = sub(ONE, d); r = mul(x, f); var sv = mul(x, d);
        steps.push('Write the discount as a decimal: ' + yt + ' \u00f7 100 = ' + dv(d) + '.');
        steps.push('The saving is the original price times the discount: ' + sg(xt) + ' \u00d7 ' + sg(dv(d)) + ' = ' + dv(sv) + '.');
        steps.push('The sale price is the original price minus the saving: ' + sg(xt) + ' \u2212 ' + sg(dv(sv)) + ' = ' + dv(r) + ', the same as ' + sg(xt) + ' \u00d7 (1 \u2212 ' + sg(dv(d)) + ') = ' + sg(xt) + ' \u00d7 ' + sg(dv(f)) + '.');
        steps.push('Check: the saving as a percentage of the original price is ' + (x.n === 0n ? 'not defined for an original price of 0' : dvp(mul(div(sv, qa(x)), HUNDRED))) + '.');
        res = finish({ kind: kind, formula: 'Sale price = Original \u00d7 (1 \u2212 D \u00f7 100)', subst: sg(xt) + ' \u00d7 (1 \u2212 ' + sg(yt) + ' \u00f7 100) = ' + dv(r), sentence: xt + ' with ' + pc(yt) + ' off = @' }, r, places, '');
        res.q = r; res.sentence = res.sentence.replace(' = @', ' ' + (res.exact ? '=' : '\u2248') + ' ' + res.text);
        rows.push(['Original price', xt, '']); rows.push(['Discount (percent off)', pc(yt), 'taken of the original price']); rows.push(['You save', dv(sv), 'Original price \u00d7 D \u00f7 100']);
        rows.push(['Sale price', res.big, note(res)]); rows.push(['You still pay', dvp(mul(f, HUNDRED)), 'of the original price']);
        if (y.n < 0n) warn.push('A negative discount is a price rise, not a discount. Check that a negative percentage is what you meant.');
        if (sub(y, HUNDRED).n > 0n) warn.push('A discount of more than 100% takes the price below zero. That is the arithmetic result; a price cannot normally be negative.');
        if (x.n < 0n) warn.push('The original price is negative. Check that this is what you meant.');
      } else if (kind === 'dpct') {
        y = Y.q; yt = Y.text;
        if (x.n === 0n) throw new Err('The original price is 0, so a discount percentage of it is not defined: the saving would be divided by 0.');
        var sav = sub(x, y); r = mul(div(sav, qa(x)), HUNDRED);
        steps.push('Find the saving: original \u2212 sale = ' + sg(xt) + ' \u2212 ' + sg(yt) + ' = ' + dv(sav) + '.');
        steps.push('Divide the saving by the original price: ' + sg(dv(sav)) + ' \u00f7 ' + (x.n < 0n ? '|' + xt.replace('-', '') + '|' : sg(xt)) + ' = ' + dv(div(sav, qa(x))) + '.');
        steps.push('Multiply by 100: ' + sg(dv(div(sav, qa(x)))) + ' \u00d7 100 = ' + dv(r) + '%.');
        steps.push('Check: ' + sg(xt) + ' \u00d7 (1 \u2212 ' + sg(dv(r)) + ' \u00f7 100) = ' + dv(mul(x, sub(ONE, div(r, HUNDRED)))) + ', the sale price.');
        res = finish({ kind: kind, formula: 'Discount = (Original \u2212 Sale) \u00f7 Original \u00d7 100', subst: '(' + sg(xt) + ' \u2212 ' + sg(yt) + ') \u00f7 ' + (x.n < 0n ? '|' + xt.replace('-', '') + '|' : sg(xt)) + ' \u00d7 100 = ' + dv(r) + '%', sentence: '' }, r, places, '%');
        res.q = r; res.dir = r.n > 0n ? 'discount' : r.n < 0n ? 'increase' : 'no change';
        res.sentence = r.n === 0n ? 'A sale price of ' + yt + ' against an original of ' + xt + ' is no change (0%)' : 'A sale price of ' + yt + ' against an original of ' + xt + ' is ' + (r.n > 0n ? 'a discount of ' : 'a price increase of ') + (r.n > 0n ? res.big : res.big.replace('-', ''));
        rows.push(['Original price', xt, '']); rows.push(['Sale price', yt, '']); rows.push(['Saving (original \u2212 sale)', dv(sav), '']); rows.push(['Discount', res.big, note(res)]);
        rows.push(['Sale price as a percentage of the original', dvp(mul(div(y, x), HUNDRED)), 'what you still pay']);
        if (y.n === 0n) rows.push(['Price rise needed to restore the original', 'not possible', 'the sale price is 0, and no percentage rise turns 0 into the original']);
        else rows.push(['Price rise needed to restore the original', dvp(mul(div(sav, qa(y)), HUNDRED)), 'Not the same as the discount: the percentage is now taken of the sale price']);
        if (r.n < 0n) warn.push('The sale price is higher than the original price, so this is a price increase, not a discount.');
        if (x.n < 0n || y.n < 0n) warn.push('A price is negative here. Check that this is what you meant.');
      } else if (kind === 'mkup' || kind === 'cost') {
        var isC = kind === 'cost'; y = Y.q; yt = Y.text; d = div(y, HUNDRED); f = add(ONE, d);
        if (isC) {
          if (f.n === 0n) throw new Err('A markup of \u2212100% would make every selling price 0, so the cost cannot be found from it.');
          r = div(x, f); var pr = sub(x, r);
          steps.push('Write the markup as a decimal and add it to 1: ' + yt + ' \u00f7 100 = ' + dv(d) + ', and 1 + ' + sg(dv(d)) + ' = ' + dv(f) + '. This is the factor that turned the cost into the selling price.');
          steps.push('Divide the selling price by the factor: ' + sg(xt) + ' \u00f7 ' + sg(dv(f)) + ' = ' + dv(r) + '. This is the cost price.');
          steps.push('The profit is the selling price minus the cost: ' + sg(xt) + ' \u2212 ' + sg(dv(r)) + ' = ' + dv(pr) + '.');
          steps.push('Check: ' + sg(dv(r)) + ' \u00d7 ' + sg(dv(f)) + ' = ' + dv(mul(r, f)) + ', the selling price you entered.');
          res = finish({ kind: kind, formula: 'Cost = Selling price \u00f7 (1 + M \u00f7 100)', subst: sg(xt) + ' \u00f7 (1 + ' + sg(yt) + ' \u00f7 100) = ' + dv(r), sentence: xt + ' sold at a ' + pc(yt) + ' markup on cost came from a cost of @' }, r, places, '');
          res.q = r; res.sentence = res.sentence.replace('@', res.big);
          rows.push(['Selling price', xt, '']); rows.push(['Markup on cost', pc(yt), 'taken of the cost price']); rows.push(['Cost price', res.big, note(res)]); rows.push(['Profit', dv(pr), 'selling price \u2212 cost']);
          rows.push(['Margin on the selling price', x.n === 0n ? 'not defined' : dvp(mul(div(pr, x), HUNDRED)), 'profit \u00f7 selling price']);
          rows.push(['If the percentage were a margin instead, the cost would be', dv(mul(x, sub(ONE, d))), 'Selling price \u00d7 (1 \u2212 G \u00f7 100): a different question with a different answer']);
          if (y.n < 0n) warn.push('A negative markup sells below cost, which is a loss. Check that a negative percentage is what you meant.');
        } else {
          var pf = mul(x, d); r = add(x, pf);
          steps.push('Markup is a percentage of the cost. The profit is cost \u00d7 markup: ' + sg(xt) + ' \u00d7 ' + sg(dv(d)) + ' = ' + dv(pf) + '.');
          steps.push('The selling price is cost plus profit: ' + sg(xt) + ' + ' + sg(dv(pf)) + ' = ' + dv(r) + ', the same as ' + sg(xt) + ' \u00d7 (1 + ' + sg(dv(d)) + ') = ' + sg(xt) + ' \u00d7 ' + sg(dv(f)) + '.');
          steps.push('Margin is a percentage of the selling price: ' + (r.n === 0n ? 'not defined, the selling price is 0.' : sg(dv(pf)) + ' \u00f7 ' + sg(dv(r)) + ' \u00d7 100 = ' + dvp(mul(div(pf, r), HUNDRED)) + '.'));
          steps.push('Check: the profit as a percentage of the cost is ' + (x.n === 0n ? 'not defined for a cost of 0' : dvp(mul(div(pf, qa(x)), HUNDRED))) + ', the markup you entered.');
          res = finish({ kind: kind, formula: 'Selling price = Cost \u00d7 (1 + M \u00f7 100)', subst: sg(xt) + ' \u00d7 (1 + ' + sg(yt) + ' \u00f7 100) = ' + dv(r), sentence: 'A cost of ' + xt + ' with a ' + pc(yt) + ' markup sells at @' }, r, places, '');
          res.q = r; res.sentence = res.sentence.replace('@', res.big);
          rows.push(['Cost price', xt, '']); rows.push(['Markup on cost', pc(yt), 'taken of the cost price']); rows.push(['Profit', dv(pf), 'Cost \u00d7 M \u00f7 100']); rows.push(['Selling price', res.big, note(res)]);
          rows.push(['Margin on the selling price', r.n === 0n ? 'not defined' : dvp(mul(div(pf, r), HUNDRED)), 'profit \u00f7 selling price: smaller than the markup for a positive markup']);
          if (y.n < 0n) warn.push('A negative markup sells below cost, which is a loss. Check that a negative percentage is what you meant.');
        }
        if (x.n < 0n) warn.push('The ' + (isC ? 'selling' : 'cost') + ' price is negative. Check that this is what you meant.');
      } else if (kind === 'mgn') {
        y = Y.q; yt = Y.text; d = div(y, HUNDRED); f = sub(ONE, d);
        if (f.n === 0n) throw new Err('A margin of 100% means the profit is the whole selling price, so the cost would have to be 0: no selling price gives that margin on a cost above 0.');
        r = div(x, f); var pm = sub(r, x);
        steps.push('Margin is a percentage of the selling price. Write it as a decimal and take it from 1: ' + yt + ' \u00f7 100 = ' + dv(d) + ', and 1 \u2212 ' + sg(dv(d)) + ' = ' + dv(f) + '. The cost is this share of the selling price.');
        steps.push('Divide the cost by that share: ' + sg(xt) + ' \u00f7 ' + sg(dv(f)) + ' = ' + dv(r) + '. This is the selling price.');
        steps.push('The profit is the selling price minus the cost: ' + sg(dv(r)) + ' \u2212 ' + sg(xt) + ' = ' + dv(pm) + '.');
        steps.push('Markup is a percentage of the cost: ' + (x.n === 0n ? 'not defined for a cost of 0.' : sg(dv(pm)) + ' \u00f7 ' + (x.n < 0n ? '|' + xt.replace('-', '') + '|' : sg(xt)) + ' \u00d7 100 = ' + dvp(mul(div(pm, qa(x)), HUNDRED)) + '.'));
        res = finish({ kind: kind, formula: 'Selling price = Cost \u00f7 (1 \u2212 G \u00f7 100)', subst: sg(xt) + ' \u00f7 (1 \u2212 ' + sg(yt) + ' \u00f7 100) = ' + dv(r), sentence: 'A cost of ' + xt + ' with a ' + pc(yt) + ' margin sells at @' }, r, places, '');
        res.q = r; res.sentence = res.sentence.replace('@', res.big);
        rows.push(['Cost price', xt, '']); rows.push(['Margin on the selling price', pc(yt), 'taken of the selling price']); rows.push(['Selling price', res.big, note(res)]); rows.push(['Profit', dv(pm), 'selling price \u2212 cost']);
        rows.push(['Markup on cost', x.n === 0n ? 'not defined' : dvp(mul(div(pm, qa(x)), HUNDRED)), 'profit \u00f7 cost: larger than the margin for a positive margin']);
        rows.push(['Wrong shortcut: cost plus the margin as a markup', dv(mul(x, add(ONE, d))), 'This price has a smaller margin than the one you asked for, because the margin is taken of the price, not the cost']);
        if (y.n < 0n) warn.push('A negative margin is a loss. Check that a negative percentage is what you meant.');
        if (sub(y, HUNDRED).n > 0n) warn.push('A margin of more than 100% gives a negative selling price. That is the arithmetic result; check the percentage.');
        if (x.n < 0n) warn.push('The cost price is negative. Check that this is what you meant.');
      } else if (kind === 'mkpct') {
        y = Y.q; yt = Y.text;
        if (x.n === 0n) throw new Err('The cost price is 0, so a markup on it is not defined: the profit would be divided by 0.');
        var pp = sub(y, x), mu = mul(div(pp, qa(x)), HUNDRED), mg = y.n === 0n ? null : mul(div(pp, y), HUNDRED);
        steps.push('Find the profit: selling price \u2212 cost = ' + sg(yt) + ' \u2212 ' + sg(xt) + ' = ' + dv(pp) + '.');
        steps.push('Markup is the profit as a percentage of the cost: ' + sg(dv(pp)) + ' \u00f7 ' + (x.n < 0n ? '|' + xt.replace('-', '') + '|' : sg(xt)) + ' \u00d7 100 = ' + dv(mu) + '%.');
        steps.push('Margin is the profit as a percentage of the selling price: ' + (mg ? sg(dv(pp)) + ' \u00f7 ' + sg(yt) + ' \u00d7 100 = ' + dvp(mg) + '.' : 'not defined, the selling price is 0.'));
        steps.push('Check: ' + sg(xt) + ' \u00d7 (1 + ' + sg(dv(mu)) + ' \u00f7 100) = ' + dv(mul(x, add(ONE, div(mu, HUNDRED)))) + ', the selling price.');
        res = finish({ kind: kind, formula: 'Markup = (Price \u2212 Cost) \u00f7 Cost \u00d7 100;  Margin = (Price \u2212 Cost) \u00f7 Price \u00d7 100', subst: '(' + sg(yt) + ' \u2212 ' + sg(xt) + ') \u00f7 ' + sg(xt) + ' \u00d7 100 = ' + dv(mu) + '%', sentence: 'A cost of ' + xt + ' sold at ' + yt + ' is a markup of @' }, mu, places, '%');
        res.q = mu; res.sentence = res.sentence.replace('@', res.big);
        rows.push(['Cost price', xt, '']); rows.push(['Selling price', yt, '']); rows.push(['Profit', dv(pp), 'selling price \u2212 cost']); rows.push(['Markup on cost', res.big, note(res)]);
        rows.push(['Margin on the selling price', mg ? dvp(mg) : 'not defined', 'profit \u00f7 selling price']);
        if (x.n < 0n || y.n < 0n) warn.push('A price is negative here. Check that this is what you meant.');
        if (pp.n < 0n) warn.push('The selling price is below the cost, so the markup and the margin are negative: a loss.');
      } else { // orig
        var D = Y.items, gs = D.map(function (l) { return sub(ONE, div(l.q, HUNDRED)); }), gp = gs.reduce(function (a, b) { return mul(a, b); }, ONE), sum2 = D.reduce(function (a, l) { return add(a, l.q); }, ZERO);
        if (gp.n === 0n) throw new Err('A 100% discount makes the sale price 0 whatever the original was, so the original price cannot be found.');
        r = div(x, gp); var tot = mul(sub(ONE, gp), HUNDRED), ck = r, trail = [dv(r)];
        steps.push('Turn each discount into a factor: divide it by 100 and take it from 1. ' + D.map(function (l, k) { return pc(l.text) + ' off becomes ' + dv(gs[k]); }).join('; ') + '.');
        steps.push('Multiply the factors to get the overall factor: ' + gs.map(function (q) { return sg(dv(q)); }).join(' \u00d7 ') + ' = ' + dv(gp) + '. The total discount is (1 \u2212 ' + dv(gp) + ') \u00d7 100 = ' + dvp(tot) + '.');
        steps.push('Divide the sale price by the overall factor: ' + sg(xt) + ' \u00f7 ' + sg(dv(gp)) + ' = ' + dv(r) + '.');
        gs.forEach(function (g) { ck = mul(ck, g); trail.push(dv(ck)); });
        steps.push('Check: ' + trail.map(sg).join(' \u2192 ') + ', which ends at the sale price you entered.');
        res = finish({ kind: kind, formula: 'Original = Sale \u00f7 [(1 \u2212 d1 \u00f7 100) \u00d7 (1 \u2212 d2 \u00f7 100) \u00d7 \u2026]', subst: sg(xt) + ' \u00f7 ' + sg(dv(gp)) + ' = ' + dv(r), sentence: xt + ' after ' + D.map(function (l) { return pc(l.text) + ' off'; }).join(', then ') + ' came from @' }, r, places, '');
        res.q = r; res.sentence = res.sentence.replace('@', res.big);
        rows.push(['Sale price', xt, '']); rows.push(['Discounts, in order', D.map(function (l) { return pc(l.text) + ' off'; }).join(', then '), 'each taken of the price before it']); rows.push(['Original price', res.big, note(res)]);
        rows.push(['Total discount', dvp(tot), D.length > 1 ? 'Not the simple sum: each discount is taken of a smaller price' : 'of the original price']); rows.push(['Amount saved', dv(sub(r, x)), 'original \u2212 sale']);
        if (D.length > 1) rows.push(['Simple sum of the discounts', dvp(sum2), 'Shown only to contrast with the total discount']);
        rows.push(['Wrong shortcut: adding the discounts to the sale price', dv(mul(x, add(ONE, div(sum2, HUNDRED)))), 'This is not the original: the discounts were taken off the original, so they must be divided out']);
        if (D.some(function (l) { return l.q.n < 0n; })) warn.push('A negative discount is a price rise. Check that a negative percentage is what you meant.');
        if (D.some(function (l) { return sub(l.q, HUNDRED).n > 0n; })) warn.push('A discount of more than 100% gives a negative factor, so the original price comes out negative. Check the percentages.');
        if (D.length === 1) warn.push('One discount only: this is the same as Original before a decrease on Mode 02. Add a second discount to chain them.');
      }
      res.steps = steps; res.rows = rows; res.warnings = warn; res.x = xt; res.y = LIST[kind] ? Y.items.map(function (l) { return l.text; }).join(' ') : Y.text; delete res.q;
      return res;
    } catch (e) { return fail(e); }
  }

  var api = { calc: calc, KINDS: KINDS, LABELS: LAB, MAX_STEPS: MAX_STEPS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PercentPrice = api;
})(typeof window !== 'undefined' ? window : this);
