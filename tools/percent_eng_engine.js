/* Elecmetric Percentage Calculator: exact rational engine for Mode 05 (Engineering Percentage Analysis). One file, no DOM, no floating point.
   Built only on the public API of tools/percent_engine.js, so Modes 01 to 04 are untouched. Eleven engineering percentages, each with its own definition
   and an explicitly named reference quantity (the 100%). All inputs are plain non-negative numbers in one consistent unit.
     eff     efficiency            = output / input x 100                         reference: input power
     load    loading               = actual / capacity x 100                      reference: rated capacity (cable, transformer, feeder)
     vdrop   voltage drop          = drop / source voltage x 100                  reference: source voltage
     vdev    voltage deviation     = (actual - nominal) / nominal x 100 (signed)  reference: nominal voltage
     lf      load factor           = average / peak x 100                         reference: peak load
     df      demand factor         = maximum demand / connected load x 100        reference: connected load
     div     diversity factor      = sum of individual maxima / group maximum     (a ratio, not a percentage) reference: group maximum demand
     derate  derating              = (rated - derated) / rated x 100 (signed)     reference: rated capacity
     save    energy saving         = (previous - new) / previous x 100 (signed)   reference: previous consumption
     soc     state of charge       = remaining / usable capacity x 100            reference: usable capacity
     ploss   power loss percentage = loss / reference power x 100                 reference: the power you name (input, output or rated)
   A reference of 0 is refused; a negative input is refused. Required by tests/percent_eng_test.js and inlined into
   calculators/engineering-percentage-calculator/ by tools/percent_eng_page.js. */
(function (root) {
  'use strict';
  var P = (typeof module !== 'undefined' && module.exports) ? require('./percent_engine.js') : root.Percent;
  var mk = P.make;
  function Err(m) { this.message = m; }
  function abs(x) { return x < 0n ? -x : x; }
  function sub(a, b) { return mk(a.n * b.d - b.n * a.d, a.d * b.d); }
  function mul(a, b) { return mk(a.n * b.n, a.d * b.d); }
  function div(a, b) { return mk(a.n * b.d, a.d * b.n); }
  function qa(a) { return { n: abs(a.n), d: a.d }; }
  var HUNDRED = { n: 100n, d: 1n };
  function termDigits(d) { var t = d, a = 0, b = 0; while (t % 2n === 0n) { t /= 2n; a++; } while (t % 5n === 0n) { t /= 5n; b++; } return t === 1n ? Math.max(a, b) : -1; }
  function F(q) { return q.d === 1n ? String(q.n) : q.n + '/' + q.d; }
  function dv(q) { var k = termDigits(q.d); return k >= 0 && k <= 40 ? P.roundText(q, k) : F(q); }
  function dvp(q) { var k = termDigits(q.d); return k >= 0 && k <= 40 ? P.roundText(q, k) + '%' : '\u2248 ' + P.roundText(q, 6) + '%'; }
  function sg(t) { return t.charAt(0) === '-' ? '(' + t + ')' : t; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function opt(places) { if (places === undefined || places === null || places === '' || places === 'auto') return 'auto'; var p = Number(places); if (!(p >= 0 && p <= P.MAX_PLACES && Math.floor(p) === p)) throw new Err('Decimal places must be a whole number from 0 to ' + P.MAX_PLACES + ', or auto.'); return p; }
  function fail(e) { if (e && typeof e.message === 'string' && !(e instanceof Error)) return { ok: false, error: e.message, empty: false }; throw e; }
  function finish(base, q, places, unit) {
    var f = P.fmt(q, places);
    base.ok = true; base.num = String(q.n); base.den = String(q.d); base.exact = f.exact; base.text = f.text; base.unit = unit; base.frac = F(q); base.places = places;
    base.big = (f.exact ? '' : '\u2248 ') + f.text + unit;
    return base;
  }
  /* name: result label; lx, ly: input labels; ref: 'x' or 'y' (the reference, 100%); formula; unit; hint; head: row label of the result */
  var D = {
    eff:    { name: 'Efficiency', lx: 'Input power', ly: 'Output power', ref: 'x', unit: '%', formula: 'Efficiency = Output \u00f7 Input \u00d7 100', head: 'Efficiency', hint: 'Enter the input power and the output power, in the same unit.' },
    load:   { name: 'Loading', lx: 'Actual loading', ly: 'Rated capacity', ref: 'y', unit: '%', formula: 'Loading = Actual \u00f7 Capacity \u00d7 100', head: 'Loading', hint: 'Enter the actual current or load and the applicable rated capacity, in the same unit.' },
    vdrop:  { name: 'Voltage drop', lx: 'Source voltage', ly: 'Voltage drop', ref: 'x', unit: '%', formula: 'Voltage drop % = Voltage drop \u00f7 Source voltage \u00d7 100', head: 'Voltage drop percentage', hint: 'Enter the source voltage and the voltage drop, in volts.' },
    vdev:   { name: 'Voltage deviation', lx: 'Nominal voltage', ly: 'Actual voltage', ref: 'x', unit: '%', formula: 'Deviation = (Actual \u2212 Nominal) \u00f7 Nominal \u00d7 100', head: 'Voltage deviation', hint: 'Enter the nominal voltage and the actual voltage, in volts.' },
    lf:     { name: 'Load factor', lx: 'Average load', ly: 'Peak load', ref: 'y', unit: '%', formula: 'Load factor = Average load \u00f7 Peak load \u00d7 100', head: 'Load factor', hint: 'Enter the average load and the peak load over the same period.' },
    df:     { name: 'Demand factor', lx: 'Maximum demand', ly: 'Connected load', ref: 'y', unit: '%', formula: 'Demand factor = Maximum demand \u00f7 Connected load \u00d7 100', head: 'Demand factor', hint: 'Enter the maximum demand and the total connected load.' },
    div:    { name: 'Diversity factor', lx: 'Sum of individual maximum demands', ly: 'Group maximum demand', ref: 'y', unit: '', formula: 'Diversity factor = Sum of individual maximum demands \u00f7 Group maximum demand', head: 'Diversity factor', hint: 'Enter the sum of the individual maximum demands and the maximum demand of the group.' },
    derate: { name: 'Derating', lx: 'Rated capacity', ly: 'Derated (usable) capacity', ref: 'x', unit: '%', formula: 'Derating = (Rated \u2212 Derated) \u00f7 Rated \u00d7 100', head: 'Derating', hint: 'Enter the rated capacity and the capacity that is usable after derating.' },
    save:   { name: 'Energy saving', lx: 'Previous consumption', ly: 'New consumption', ref: 'x', unit: '%', formula: 'Saving = (Previous \u2212 New) \u00f7 Previous \u00d7 100', head: 'Energy saving', hint: 'Enter the previous consumption and the new consumption, in the same unit.' },
    soc:    { name: 'State of charge', lx: 'Remaining capacity', ly: 'Usable capacity', ref: 'y', unit: '%', formula: 'State of charge = Remaining \u00f7 Usable capacity \u00d7 100', head: 'State of charge', hint: 'Enter the remaining capacity and the usable capacity, in the same unit.' },
    ploss:  { name: 'Power loss percentage', lx: 'Power loss', ly: 'Reference power', ref: 'y', unit: '%', formula: 'Loss % = Power loss \u00f7 Reference power \u00d7 100', head: 'Power loss percentage', hint: 'Enter the power loss and the reference power you want it expressed against (input, output or rated).' }
  };
  var KINDS = Object.keys(D), LAB = {};
  KINDS.forEach(function (k) { LAB[k] = [D[k].lx, D[k].ly, D[k].name]; });
  var WARN = {
    eff: ['y>x', 'The output is larger than the input, so the efficiency is above 100%. That is not possible for a passive device. Check the values, or whether the device is rated by a coefficient of performance instead.'],
    load: ['x>y', 'The actual loading is above the rated capacity, so the loading is above 100%: on these numbers the equipment or cable is overloaded.'],
    vdrop: ['y>x', 'The voltage drop is larger than the source voltage, so the voltage at the load would be below zero. Check the values.'],
    lf: ['x>y', 'The average load is larger than the peak load, which cannot happen over one period. Check the values.'],
    df: ['x>y', 'The maximum demand is larger than the connected load, so the demand factor is above 100%. Check the values.'],
    div: ['x<y', 'The sum of the individual maxima is smaller than the group maximum, so the diversity factor is below 1. It is normally 1 or more.'],
    derate: ['y>x', 'The usable capacity is larger than the rated capacity, so this is an increase, not a derating.'],
    save: ['y>x', 'The new consumption is higher than the previous consumption, so this is an increase, not a saving.'],
    soc: ['x>y', 'The remaining capacity is larger than the usable capacity, so the state of charge is above 100%. Check which capacity you used as the reference.'],
    ploss: ['x>y', 'The loss is larger than the reference power. Check the reference you chose.']
  };

  function calc(o) {
    try {
      o = o || {}; var kind = o.kind, places = opt(o.places);
      if (KINDS.indexOf(kind) < 0) throw new Err('Choose one of the eleven calculations.');
      var d = D[kind], X = P.parseNum(o.x, 'The ' + d.lx.toLowerCase(), {}), Y = P.parseNum(o.y, 'The ' + d.ly.toLowerCase(), {});
      if (X.empty || Y.empty) return { ok: false, empty: true, error: '', hint: d.hint };
      var x = X.q, y = Y.q, xt = X.text, yt = Y.text;
      if (x.n < 0n) throw new Err('The ' + d.lx.toLowerCase() + ' cannot be negative. Enter its size, in the same unit as the other value.');
      if (y.n < 0n) throw new Err('The ' + d.ly.toLowerCase() + ' cannot be negative. Enter its size, in the same unit as the other value.');
      var ref = d.ref === 'x' ? x : y, rn = d.ref === 'x' ? d.lx : d.ly, rt = d.ref === 'x' ? xt : yt;
      if (ref.n === 0n) throw new Err('The ' + rn.toLowerCase() + ' is 0, and it is the reference (the 100%) for the ' + d.name.toLowerCase() + ', so the result is not defined: it would divide by 0. Enter the ' + rn.toLowerCase() + '.');
      var q, num, den, numName, steps = [], rows = [], warn = [], extra = [], dir = '', signed = false, diffName = '';
      var diff = sub(x, y); // x - y
      if (kind === 'eff') { num = y; numName = 'the output power'; q = mul(div(y, x), HUNDRED); extra = [['Power loss', dv(diff)], ['Loss as a percentage of the input', dvp(mul(div(diff, x), HUNDRED))]]; }
      else if (kind === 'load') { num = x; numName = 'the actual loading'; q = mul(div(x, y), HUNDRED); extra = [['Spare capacity (capacity \u2212 actual)', dv(sub(y, x))], ['Spare capacity as a percentage of capacity', dvp(mul(div(sub(y, x), y), HUNDRED))]]; }
      else if (kind === 'vdrop') { num = y; numName = 'the voltage drop'; q = mul(div(y, x), HUNDRED); extra = [['Voltage at the load (source \u2212 drop)', dv(diff)], ['Voltage at the load as a percentage of the source', dvp(mul(div(diff, x), HUNDRED))]]; }
      else if (kind === 'vdev') { num = sub(y, x); numName = 'the deviation (actual \u2212 nominal)'; signed = true; q = mul(div(num, x), HUNDRED); dir = q.n === 0n ? 'equal' : q.n > 0n ? 'above' : 'below'; extra = [['Deviation (actual \u2212 nominal)', dv(num)], ['Actual as a percentage of nominal', dvp(mul(div(y, x), HUNDRED))]]; }
      else if (kind === 'lf') { num = x; numName = 'the average load'; q = mul(div(x, y), HUNDRED); extra = [['Peak minus average', dv(sub(y, x))], ['Average as a fraction of peak', dv(div(x, y))]]; }
      else if (kind === 'df') { num = x; numName = 'the maximum demand'; q = mul(div(x, y), HUNDRED); extra = [['Connected load not in the maximum demand', dv(sub(y, x))], ['Demand as a fraction of connected load', dv(div(x, y))]]; }
      else if (kind === 'div') { num = x; numName = 'the sum of the individual maxima'; q = div(x, y); extra = [['Coincidence factor (1 \u00f7 diversity factor)', x.n === 0n ? 'not defined' : dvp(mul(div(y, x), HUNDRED))], ['Diversity as a percentage', dvp(mul(div(x, y), HUNDRED))]]; }
      else if (kind === 'derate') { num = diff; numName = 'the capacity lost (rated \u2212 derated)'; signed = true; q = mul(div(diff, x), HUNDRED); dir = q.n === 0n ? 'no change' : q.n > 0n ? 'reduction' : 'increase'; extra = [['Capacity lost (rated \u2212 derated)', dv(diff)], ['Derating factor (derated \u00f7 rated)', dv(div(y, x))]]; }
      else if (kind === 'save') { num = diff; numName = 'the energy saved (previous \u2212 new)'; signed = true; q = mul(div(diff, x), HUNDRED); dir = q.n === 0n ? 'no change' : q.n > 0n ? 'saving' : 'increase'; extra = [['Energy saved (previous \u2212 new)', dv(diff)], ['New as a percentage of previous', dvp(mul(div(y, x), HUNDRED))]]; }
      else if (kind === 'soc') { num = x; numName = 'the remaining capacity'; q = mul(div(x, y), HUNDRED); extra = [['Capacity used (usable \u2212 remaining)', dv(sub(y, x))], ['Depleted', dvp(mul(div(sub(y, x), y), HUNDRED))]]; }
      else { num = x; numName = 'the power loss'; q = mul(div(x, y), HUNDRED); extra = [['Power not lost (reference \u2212 loss)', dv(sub(y, x))], ['Share left after the loss', dvp(mul(div(sub(y, x), y), HUNDRED))]]; }
      var isPct = d.unit === '%', ratio = isPct ? div(q, HUNDRED) : q;
      steps.push('Name the reference: ' + d.name.toLowerCase() + ' is measured against the ' + rn.toLowerCase() + ', ' + dv(ref) + '. This is the ' + (isPct ? '100%' : 'denominator') + '.');
      if (signed) steps.push('Find ' + numName + ': ' + (kind === 'vdev' ? sg(yt) + ' \u2212 ' + sg(xt) : sg(xt) + ' \u2212 ' + sg(yt)) + ' = ' + dv(num) + '.');
      steps.push('Divide ' + (signed ? 'it' : numName) + ' by the reference: ' + sg(dv(num)) + ' \u00f7 ' + dv(ref) + ' = ' + dv(ratio) + '.');
      if (isPct) steps.push('Multiply by 100: ' + sg(dv(ratio)) + ' \u00d7 100 = ' + dv(q) + '%.');
      steps.push('Check: ' + (isPct ? dv(q) + '% of ' + dv(ref) : dv(q) + ' \u00d7 ' + dv(ref)) + ' = ' + dv(isPct ? mul(div(q, HUNDRED), ref) : mul(q, ref)) + ', ' + (signed ? numName : numName) + '.');
      var w = WARN[kind];
      if (w && (w[0] === 'y>x' ? y.n * x.d > x.n * y.d : w[0] === 'x>y' ? x.n * y.d > y.n * x.d : x.n * y.d < y.n * x.d)) warn.push(w[1]);
      var shown = (function () { var f = P.fmt(signed ? qa(q) : q, places); return (f.exact ? '' : '\u2248 ') + f.text + d.unit; })();
      var res = finish({ kind: kind, formula: d.formula, subst: '', reference: rn }, q, places, d.unit);
      res.subst = (isPct ? sg(dv(num)) + ' \u00f7 ' + dv(ref) + ' \u00d7 100 = ' + dv(q) + '%' : dv(num) + ' \u00f7 ' + dv(ref) + ' = ' + dv(q));
      res.dir = dir;
      var s;
      if (kind === 'eff') s = 'An output of ' + yt + ' from an input of ' + xt + ' is an efficiency of ' + res.big;
      else if (kind === 'load') s = 'An actual loading of ' + xt + ' on a rated capacity of ' + yt + ' is a loading of ' + res.big;
      else if (kind === 'vdrop') s = 'A drop of ' + yt + ' on a source of ' + xt + ' is a voltage drop of ' + res.big;
      else if (kind === 'vdev') s = q.n === 0n ? 'An actual voltage of ' + yt + ' equals the nominal ' + xt + ' (0% deviation)' : 'An actual voltage of ' + yt + ' is ' + shown + ' ' + dir + ' the nominal ' + xt;
      else if (kind === 'lf') s = 'An average load of ' + xt + ' against a peak of ' + yt + ' is a load factor of ' + res.big;
      else if (kind === 'df') s = 'A maximum demand of ' + xt + ' on a connected load of ' + yt + ' is a demand factor of ' + res.big;
      else if (kind === 'div') s = 'Individual maxima summing to ' + xt + ' with a group maximum of ' + yt + ' give a diversity factor of ' + res.big;
      else if (kind === 'derate') s = q.n === 0n ? 'A usable capacity of ' + yt + ' equals the rated ' + xt + ' (no derating)' : q.n > 0n ? 'A usable capacity of ' + yt + ' from a rated ' + xt + ' is a derating (reduction) of ' + shown : 'A usable capacity of ' + yt + ' above a rated ' + xt + ' is an increase of ' + shown + ', not a derating';
      else if (kind === 'save') s = q.n === 0n ? 'From ' + xt + ' to ' + yt + ' there is no saving (0%)' : q.n > 0n ? 'From ' + xt + ' to ' + yt + ' is an energy saving of ' + shown : 'From ' + xt + ' to ' + yt + ' is an increase of ' + shown + ', not a saving';
      else if (kind === 'soc') s = 'A remaining ' + xt + ' of a usable ' + yt + ' is a state of charge of ' + res.big;
      else s = 'A loss of ' + xt + ' against a reference power of ' + yt + ' is ' + res.big;
      res.sentence = s;
      rows.push([d.lx + (d.ref === 'x' ? ' (reference)' : ''), xt, d.ref === 'x' ? 'The reference quantity: this value is ' + (isPct ? '100%' : 'the denominator') : '']);
      rows.push([d.ly + (d.ref === 'y' ? ' (reference)' : ''), yt, d.ref === 'y' ? 'The reference quantity: this value is ' + (isPct ? '100%' : 'the denominator') : '']);
      rows.push([d.head, res.big, res.exact ? 'Exact' : 'Rounded: the exact value is ' + F(q) + d.unit]);
      if (dir) rows.push(['Direction', cap(dir), '']);
      extra.forEach(function (e) { rows.push([e[0], e[1], '']); });
      res.steps = steps; res.rows = rows; res.warnings = warn; res.x = xt; res.y = yt;
      return res;
    } catch (e) { return fail(e); }
  }
  var api = { calc: calc, KINDS: KINDS, LABELS: LAB, DEFS: D };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PercentEng = api;
})(typeof window !== 'undefined' ? window : this);
