/* Tests for inchCalc (Mode 06: fractional inches and millimetres) in tools/fraction_engine.js against tests/fraction_inch_vectors.json
   (independent: gen_fraction_inch_vectors.py, factor read from the string 25.4, decimal module expansions, neighbour-mark search and planted ties),
   property checks on every result (error bound, direction, round trip through the other tab) and the fixed examples of the product note. */
const Fx = require('../tools/fraction_engine.js'), V = require('./fraction_inch_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 15) console.log('FAIL ' + m); };
const J = (x) => JSON.stringify(x, (k, v) => typeof v === 'bigint' ? v + 'n' : v);
const eq = (a, b, m) => { n++; if (J(a) !== J(b)) bad(m + ': ' + J(a) + ' vs ' + J(b)); };
const I = (dir, expr, maxDen, round, places) => Fx.inchCalc({ dir, expr, maxDen, round, places });
const frac = (s) => { const m = /^(-?\d+)(?:\/(\d+))?$/.exec(s); return [BigInt(m[1]), BigInt(m[2] || 1)]; };
const same = (a, b) => { const x = frac(a), y = frac(b); return x[0] * y[1] === y[0] * x[1]; };
const wk = (r, t) => { if (!r.ok) { bad(t + ' rejected: ' + r.error); return false; } eq(r.steps.length >= 4 && r.steps.every((s) => typeof s === 'string' && s.length > 5), true, 'working present ' + t); eq(typeof r.big === 'string' && r.big.length > 3, true, 'headline ' + t); eq(r.results.every((x) => x.length === 3 && typeof x[0] === 'string' && typeof x[1] === 'string'), true, 'result rows ' + t); return true; };
// ---- inch to mm
for (const [txt, inn, mixed, mm, exact, shown, sx, shown0, thou, std] of V.in) {
  const t = '[in2mm ' + txt + ']', r = I('in2mm', txt); if (!wk(r, t)) continue;
  eq(r.inches, inn, 'inches ' + t); eq(r.inchesMixed, mixed, 'mixed ' + t); eq(r.mmExact, mm, 'exact mm fraction ' + t); eq(r.mmExactDecimal, exact !== null, 'terminating flag ' + t); if (exact !== null) eq(r.mmDecimal, exact, 'exact mm decimal ' + t);
  eq(r.mmRounded, shown, 'mm shown to 3 places ' + t); eq(r.mmRoundedExact, sx, 'rounded flag ' + t); eq(r.standard, std, 'standard graduation ' + t);
  eq(I('in2mm', txt, null, null, '0').mmRounded, shown0, 'mm shown to 0 places ' + t); if (thou !== null) eq(r.thou, thou, 'thou ' + t);
  eq(r.results[0][2] === 'Exact', sx, 'first row flag ' + t); eq(r.big.indexOf(sx ? ' = ' : ' \u2248 ') > 0, true, 'equals or approx sign ' + t);
  eq(r.results.some((x) => /^Exact value/.test(x[0]) && x[1] === mm + ' mm'), true, 'exact value row ' + t);
  eq(r.steps.some((s) => s.indexOf('127/5') >= 0), true, 'factor step ' + t);
}
// ---- mm to inch
for (const [txt, D, mode, pl, mm, inn, k, fr, frm, fmm, fmmd, em, ei, exact, ishown, iterm, sgn, idec] of V.mm) {
  const t = '[mm2in ' + txt + ' 1/' + D + ' ' + mode + ']', r = I('mm2in', txt, D, mode, pl); if (!wk(r, t)) continue;
  eq(r.mm, mm, 'mm ' + t); eq(r.inches, inn, 'inches ' + t); eq(r.k, k, 'graduation count ' + t); eq(r.fraction, fr, 'fraction ' + t); eq(r.fractionMixed, frm, 'mixed ' + t); eq(r.fractionBack, fmm, 'converted back ' + t); eq(r.fractionBackDecimal, fmmd, 'converted back decimal ' + t);
  eq(r.errorMm, em, 'error mm ' + t); eq(r.errorIn, ei, 'error in ' + t); eq(r.exact, exact, 'exact flag ' + t); eq(r.errorSign, sgn, 'error sign ' + t); eq(r.inchesRounded, ishown, 'inches shown ' + t); eq(r.inchesExact, iterm, 'inches terminating flag ' + t); if (iterm) eq(r.inchesDecimal, idec, 'inches decimal ' + t);
  // properties: bound, direction, tie rule, round trip through the other tab, table rows
  const E = frac(ei), half = [1n, 2n * BigInt(D)], ae = [E[0] < 0n ? -E[0] : E[0], E[1]];
  if (mode === 'nearest') eq(ae[0] * half[1] <= half[0] * ae[1], true, 'error at most half a graduation ' + t); else eq(ae[0] * BigInt(D) < ae[1], true, 'error under one graduation ' + t);
  if (mode === 'down') eq(sgn <= 0, true, 'down never exceeds ' + t); if (mode === 'up') eq(sgn >= 0, true, 'up never falls short ' + t);
  const back = I('in2mm', fr); eq(back.ok && back.mmExact, fmm, 'round trip through the inch tab ' + t); eq(same(fr, mixed2(frm)), true, 'mixed number equals the fraction ' + t);
  eq(r.table.length, [2, 4, 8, 16, 32, 64, 128, 256].filter((d) => d <= D).length, 'table rows ' + t); eq(r.table[r.table.length - 1][0], '1/' + D, 'last table row is the chosen graduation ' + t);
  eq(r.table[r.table.length - 1][1], frm, 'last table fraction ' + t); eq(r.table[r.table.length - 1][2], fmmd, 'last table mm ' + t);
  eq(r.big.indexOf(exact ? ' = ' : ' \u2248 ') > 0, true, 'equals or approx sign ' + t); eq(r.big.endsWith(frm + ' in'), true, 'headline ends with the fraction ' + t);
}
function mixed2(s) { const m = /^(-?)(?:(\d+) )?(\d+)(?:\/(\d+))?$/.exec(s); const neg = m[1] === '-', w = BigInt(m[2] || 0), a = BigInt(m[3]), b = BigInt(m[4] || 1); if (m[4] === undefined) return (neg ? '-' : '') + a; const num = w * b + a; return (neg ? '-' : '') + num + '/' + b; }
// ---- errors
for (const [txt, dir] of V.err) { const r = I(dir, txt); eq(r.ok, false, 'must be rejected [' + dir + ' ' + txt.slice(0, 20) + ']'); eq(r.empty === true, txt.trim() === '', 'empty flag [' + dir + ' ' + txt.slice(0, 20) + ']'); if (txt.trim() !== '') eq(typeof r.error === 'string' && r.error.length > 5, true, 'message [' + txt.slice(0, 20) + ']'); }
// ---- options
for (const [o, f] of [[{ places: '21' }, 'places'], [{ places: '-1' }, 'places'], [{ places: 'x' }, 'places'], [{ maxDen: '3' }, 'maxDen'], [{ maxDen: '512' }, 'maxDen'], [{ maxDen: 'abc' }, 'maxDen'], [{ round: 'sideways' }, 'round']]) { const r = Fx.inchCalc(Object.assign({ dir: 'mm2in', expr: '10' }, o)); eq(r.ok, false, 'option refused ' + J(o)); eq(r.field, f, 'option field ' + J(o)); }
eq(Fx.inchCalc({ dir: 'mm2in', expr: '10', places: '20', maxDen: '256', round: 'up' }).ok, true, 'largest options accepted');
// ---- fixed examples from the product note and common sizes
eq(I('in2mm', '3/4').mmDecimal, '19.05', '3/4 in = 19.05 mm (product note)'); eq(I('in2mm', '3/4').big, '3/4 in = 19.05 mm', '3/4 headline'); eq(I('in2mm', '1').mmDecimal, '25.4', '1 in = 25.4 mm'); eq(I('in2mm', '1/2').mmDecimal, '12.7', '1/2 in'); eq(I('in2mm', '1/8').mmDecimal, '3.175', '1/8 in');
eq(I('in2mm', '1/4').mmDecimal, '6.35', '1/4 in'); eq(I('in2mm', '5/16').mmDecimal, '7.9375', '5/16 in'); eq(I('in2mm', '1 3/16').mmDecimal, '30.1625', '1 3/16 in'); eq(I('in2mm', '1-3/16').mmDecimal, '30.1625', 'hyphen mixed number'); eq(I('in2mm', '2 1/2 in').mmDecimal, '63.5', '2 1/2 in');
eq(I('in2mm', '1/3').mmDecimal, '8.4(6)', '1/3 in repeats'); eq(I('in2mm', '1/3').mmRoundedExact, false, '1/3 in is rounded'); eq(I('in2mm', '1/64').mmDecimal, '0.396875', '1/64 in'); eq(I('in2mm', '-3/4').mmDecimal, '-19.05', 'negative length');
eq(I('mm2in', '12.7', 64).fraction, '1/2', '12.7 mm = 1/2 in'); eq(I('mm2in', '25.4').fraction, '1', '25.4 mm = 1 in'); eq(I('mm2in', '19.05').exact, true, '19.05 mm is exactly 3/4 in'); eq(I('mm2in', '10', 16).fraction, '3/8', '10 mm nearest 1/16 is 3/8'); eq(I('mm2in', '10', 64).fractionMixed, '25/64', '10 mm nearest 1/64');
eq(I('mm2in', '10', 16, 'down').fraction, '3/8', '10 mm down at 1/16'); eq(I('mm2in', '10', 8, 'down').fraction, '3/8', '10 mm (0.3937 in) down at 1/8'); eq(I('mm2in', '10', 8, 'up').fraction, '1/2', '10 mm up at 1/8'); eq(I('mm2in', '5 mm').ok, true, 'mm unit accepted'); eq(I('mm2in', '0').fraction, '0', 'zero'); eq(I('mm2in', '0').exact, true, 'zero is exact');
eq(I('mm2in', '-12.7').fractionMixed, '-1/2', 'negative mm'); eq(I('mm2in', '1/3').ok, true, 'fraction of a millimetre'); eq(I('in2mm', '5 mm').ok, false, 'mm unit refused on the inch tab'); eq(I('mm2in', '3 in').ok, false, 'inch unit refused on the mm tab'); eq(I('in2mm', '12.5 in').ok, true, 'in unit accepted'); eq(I('in2mm', '5 IN').ok, true, 'unit is case-blind');
eq(I('in2mm', null).empty, true, 'null is empty'); eq(I('mm2in', '   ').empty, true, 'blank is empty'); eq(I('in2mm', '9'.repeat(400)).ok, true, '400 digits accepted'); eq(I('in2mm', '9'.repeat(401)).ok, false, '401 digits refused');
eq(Fx.MM_PER_INCH, '127/5', 'exported factor'); eq(I('sideways', '1/2').dir, 'in2mm', 'unknown direction falls back to in2mm');
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
