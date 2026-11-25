/* Tests for the converter in tools/fraction_engine.js against tests/fraction_convert_vectors.json (independent: gen_fraction_convert_vectors.py, Python
   fractions.Fraction and decimal.Decimal, number-theory decimal expansions, brute-force approximation) and fixed cases from the product note. */
const Fx = require('../tools/fraction_engine.js'), V = require('./fraction_convert_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 15) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': ' + a + ' vs ' + b); };
const C = (e, places, maxDen) => Fx.convert({ expr: e, places, maxDen });
const P = (s) => { const m = /^(-?\d+)(?:\/(\d+))?$/.exec(s); return { n: BigInt(m[1]), d: BigInt(m[2] || '1') }; };
// one row: [input, kind, fraction, mixed, decimal, exact, preperiod, period, percent, percentExact, places, rounded, roundedExact, roundedPercent, approx]
const chk = (r, row, t) => {
  if (!r.ok) { bad(t + ' rejected: ' + r.error); return; }
  eq(r.kind, row[1], 'kind ' + t); eq(r.frac, row[2], 'fraction ' + t); eq(r.mixed.text, row[3], 'mixed ' + t); eq(r.decimal.text, row[4], 'decimal ' + t); eq(r.decimal.exact, row[5], 'decimal exact flag ' + t);
  if (!row[5]) { eq(r.decimal.preperiod, row[6], 'digits before the block ' + t); eq(r.decimal.period, row[7], 'block length ' + t); }
  eq(r.percent.text, row[8], 'percent ' + t); eq(r.percent.exact, row[9], 'percent exact flag ' + t);
  eq(r.rounded.text, row[11], 'rounded to ' + row[10] + ' places ' + t); eq(r.rounded.exact, row[12], 'rounded exact flag ' + t); eq(r.roundedPct.text, row[13], 'rounded percent ' + t);
  eq(r.steps.length >= 2 && r.steps.every((s) => typeof s === 'string' && s.length > 5), true, 'working present ' + t);
  eq(r.value.d > 0n && Fx.gcd(r.value.n, r.value.d) === 1n, true, 'lowest terms ' + t);
  // long division rows spell the decimal digits
  if (r.division) {
    const D = r.division, digs = D.rows.map((x) => x[2]).join(''), t2 = r.decimal.text, m = /\.(\d*)(?:\((\d+)\))?/.exec(t2);
    if (m && !r.decimal.longPeriod) { const want = (m[1] || '') + (m[2] || ''); eq(digs, want.slice(0, digs.length), 'division digits ' + t); if (!D.cut) eq(digs.length, want.length, 'division length ' + t); }
    if (r.decimal.period && !D.cut) eq(D.rows.length - D.cycleAt, r.decimal.period, 'cycle length in the division ' + t);
    D.rows.forEach((x) => { if (x[1] !== x[0] * 10n || x[2] !== x[1] / r.value.d || x[3] !== x[1] % r.value.d) bad('division row ' + x + ' ' + t); });
  }
};
for (const row of V.dec) { chk(C(row[0], row[10]), row, '[' + row[0] + ']'); eq(C(row[0], row[10]).approx ? C(row[0], row[10]).approx.frac : null, row[14], 'rounded-repeating approximation [' + row[0] + ']'); }
for (const row of V.rep) chk(C(row[0], row[10]), row, '[' + row[0] + ']');
for (const row of V.frac) chk(C(row[0], row[10]), row, '[' + row[0] + ']');
for (const row of V.pct) { chk(C(row[0], row[10]), row, '[' + row[0] + ']'); eq(C(row[0]).approx, null, 'no approximation for a percentage [' + row[0] + ']'); }
for (const [txt, frac, ex] of V.planted) { const r = C(txt); eq(r.value.n + '/' + r.value.d, frac.indexOf('/') < 0 ? frac + '/1' : frac, 'exact value of [' + txt + ']'); eq(r.approx ? r.approx.frac : null, ex, 'planted approximation [' + txt + ']'); }
for (const [txt, frac, mx, dec] of V.sci_in) { const r = C(txt); if (!r.ok) bad(txt + ' rejected: ' + r.error); else { eq(r.frac, frac, 'sci fraction ' + txt); eq(r.mixed.text, mx, 'sci mixed ' + txt); eq(r.decimal.text, dec, 'sci decimal ' + txt); eq(r.approx, null, 'no approximation for sci ' + txt); } }
for (const [txt, M, frac, exact, diff] of V.limit) { const r = C(txt, 6, M); if (!r.ok) bad(txt + ' rejected: ' + r.error); else { eq(r.limit.frac, frac, 'limit_denominator(' + M + ') of ' + txt); eq(r.limit.exact, exact, 'limit exact flag ' + txt + ' ' + M); eq(r.limit.diff, diff, 'difference ' + txt + ' ' + M); eq(r.limit.d <= BigInt(M), true, 'denominator within the limit ' + txt); } }
for (const [f, a, b] of V.sci) { const q = P(f); eq(Fx.sci(Fx.make(q.n, q.d), 4), a, 'sci4 ' + f); eq(Fx.sci(Fx.make(q.n, q.d), 6), b, 'sci6 ' + f); }
for (const [f, p, t, e] of V.round) { const q = P(f), r = Fx.roundDec(Fx.make(q.n, q.d), p); eq(r.text, t, 'round ' + f + ' to ' + p); eq(r.exact, e, 'round exact flag ' + f + ' ' + p); }
for (const e of V.err) { const r = C(e); eq(r.ok, false, 'must be rejected [' + e.slice(0, 30) + ']'); eq(r.empty === true, e.trim() === '', 'empty flag [' + e.slice(0, 30) + ']'); if (e.trim() !== '') eq(typeof r.error === 'string' && r.error.length > 5, true, 'message [' + e.slice(0, 30) + ']'); }
for (const [e, p] of V.places_err) { const r = C(e, p); eq(r.ok, false, 'places [' + p + '] rejected'); eq(r.field, 'places', 'places field flagged [' + p + ']'); }
for (const m of V.maxden_err) { const r = C('0.5', 6, m); eq(r.ok, false, 'largest denominator [' + m + '] rejected'); eq(r.field, 'maxDen', 'maxDen field flagged [' + m + ']'); }
// fixed cases from the product note: the decimal and simplified fraction table, 1/3 as a repeating decimal, 0.125 to 1/8, percentages
for (const [d, f] of [['0.5', '1/2'], ['0.25', '1/4'], ['0.125', '1/8'], ['0.375', '3/8'], ['0.625', '5/8'], ['0.75', '3/4'], ['1.25', '5/4'], ['2.5', '5/2']]) { eq(C(d).frac, f, d + ' as a fraction'); eq(C(d).decimal.exact, true, d + ' is exact'); eq(C(d).headline, 'fraction', d + ' headline'); }
eq(C('1/3').decimal.text, '0.(3)', '1/3 is a repeating decimal'); eq(C('1/3').decimal.exact, false, '1/3 is not exact as a decimal'); eq(C('1/3').decimal.repeating, true, '1/3 repeats'); eq(C('1/3').headline, 'decimal', '1/3 headline');
eq(C('0.(3)').frac, '1/3', '0.(3)'); eq(C('0.(3)').decimal.text, '0.(3)', '0.(3) as typed'); eq(C('0.58(3)').frac, '7/12', '0.58(3)');
eq(C('37.5%').frac, '3/8', '37.5%'); eq(C('3/8').percent.text, '37.5%', '3/8 as a percentage'); eq(C('3/8').percent.exact, true, '3/8 percentage is exact'); eq(C('1/3').percent.text, '33.(3)%', '1/3 as a percentage'); eq(C('1/3').percent.exact, false, '1/3 percentage is repeating');
eq(C('0.3333').approx.frac, '1/3', '0.3333 may be a rounded 1/3'); eq(C('0.125').approx, null, '0.125 is not flagged'); eq(C('0.5').approx, null, '0.5 is not flagged'); eq(C('0.333').approx.frac, '1/3', '0.333 may be a rounded 1/3'); eq(C('0.66667').approx.frac, '2/3', '0.66667'); eq(C('3.14159').approx, null, '3.14159 has no simple fraction in range');
eq(C('1/3', 6).rounded.text, '0.333333', '1/3 rounded'); eq(C('2/3', 6).rounded.text, '0.666667', '2/3 rounded'); eq(C('2/3', 0).rounded.text, '1', '2/3 rounded to a whole number'); eq(C('1/8', 6).rounded.exact, true, '1/8 needs no rounding');
eq(C('3.14159', 6, 100).limit.frac, '311/99', 'pi-like value with denominator up to 100'); eq(C('0.7', 6, 16).limit.exact, true, '0.7 already has denominator 10'); eq(C('0.7', 6, 4).limit.frac, '2/3', '0.7 with denominator up to 4'); eq(C('-0.7', 6, 4).limit.frac, '-2/3', 'sign kept');
eq(C('1/0').ok, false, '1/0'); eq(/denominator is 0/i.test(C('1/0').error), true, '1/0 message'); eq(C('2 1/3').frac, '7/3', '2 1/3'); eq(C('-1 3/4').decimal.text, '-1.75', '-1 3/4'); eq(C(null).ok, false, 'null'); eq(C(undefined).empty, true, 'undefined empty');
eq(C('0.' + '1'.repeat(399)).ok, true, '399 digits accepted'); eq(C('0.' + '1'.repeat(400)).ok, false, '400 digits after the point is 401 with the zero: rejected');
eq(C('1/' + '7'.repeat(300)).ok, true, 'a 300-digit denominator is accepted'); eq(C('1/' + '7'.repeat(300)).decimal.repeating, true, 'its decimal repeats');
eq(C('1/7').division.rows.length, 6, '1/7 has six division rows before the cycle closes'); eq(C('1/7').division.cycleAt, 0, '1/7 cycle starts at row 0'); eq(C('1/6').division.cycleAt, 1, '1/6 has one digit before the block'); eq(C('3/8').division.done, true, '3/8 division ends');
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
