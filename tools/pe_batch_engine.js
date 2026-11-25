/* Elecmetric Percent Error Calculator, Mode 04 (Batch Measurement Analysis). One file, no DOM, no floating point (exact BigInt arithmetic).
   Built on the public API of tools/percent_engine.js (reading numbers, rounding). Mode 02 (signed deviation) and Mode 03 (tolerance limits) are not called:
   the test compares every per-reading percentage with Mode 02 and every limit with Mode 03 on the same vectors, so the three modes cannot drift apart unseen.
   Question: how far are several observed readings of ONE quantity from one reference value, and how much do they spread?
     error e_i = reading_i - reference                     (BIPM VIM: measurement error = measured value minus reference value)
     mean signed error (bias) = sum(e_i) / n                 mean absolute error = sum|e_i| / n          maximum absolute error = max|e_i|
     population variance = sum(e_i - mean e)^2 / n          sample variance = sum(e_i - mean e)^2 / (n - 1)   (n >= 2)
     standard deviation = square root of the variance. It is the spread of the readings about their OWN mean, so it does not depend on the reference.
     root mean square error = sqrt(sum(e_i^2) / n)           RMSE^2 = bias^2 + population variance
     percentage values divide by the SIZE of the reference: 100 x value / |reference|, as in Modes 02 and 03. A reference of 0 leaves them not defined.
   Optional tolerance (symmetrical, plus and minus the same, a percentage of |reference| or an absolute value): reading i is accepted when L <= reading <= U (limits included).
   The tolerance is whatever the user entered. The engine reads no standard or datasheet, applies no measurement uncertainty and never says "compliant".
   Exactness: every reading is scaled by 10^s to a BigInt, so sums and sums of squares are exact. The variance is an exact fraction and a standard deviation is rounded
   from an exact integer square root (half up), never from a floating-point square root.
   calc({ y: reference, x: readings (text: one per line, or separated by spaces, tabs or semicolons), unit, places, basis, t }) -> { ok, ... } | { ok: false, error } | { ok: false, empty: true, hint }
   Required by tests/pe_batch_test.js and inlined into calculators/batch-measurement-analysis/ by tools/pe_batch_page.js. */
(function (root) {
  'use strict';
  var isNode = typeof module !== 'undefined' && module.exports;
  var P = isNode ? require('./percent_engine.js') : root.Percent;
  var MN = '\u2212', MAXN = 1000, HINT = 'Enter the reference value and at least one observed reading.', HUNDRED = { n: 100n, d: 1n }, ZERO = { n: 0n, d: 1n };
  function Err(m) { this.message = m; }
  var mk = P.make;
  function add(a, b) { return mk(a.n * b.d + b.n * a.d, a.d * b.d); }
  function sub(a, b) { return mk(a.n * b.d - b.n * a.d, a.d * b.d); }
  function mul(a, b) { return mk(a.n * b.n, a.d * b.d); }
  function div(a, b) { return mk(a.n * b.d, a.d * b.n); }
  function cmp(a, b) { var x = a.n * b.d, y = b.n * a.d; return x < y ? -1 : x > y ? 1 : 0; }
  function P10(k) { return 10n ** BigInt(k); }
  function isqrt(n) { if (n < 2n) return n; var x = 1n << BigInt((n.toString(2).length + 1) >> 1), y; for (;;) { y = (x + n / x) >> 1n; if (y >= x) return x; x = y; } }
  function termDigits(d) { var t = d, a = 0, b = 0; while (t % 2n === 0n) { t /= 2n; a++; } while (t % 5n === 0n) { t /= 5n; b++; } return t === 1n ? Math.max(a, b) : -1; }
  function dec(q) { var k = termDigits(q.d); return k >= 0 ? P.roundText(q, k) : '\u2248 ' + P.roundText(q, 8); } // an exact decimal whenever it ends (every value built from the decimals entered does)
  function plusT(t) { return t.charAt(0) === '-' || /^[0.]*$/.test(t) ? t : '+' + t; }
  function sg(t) { return t.charAt(0) === '-' ? '(' + t + ')' : t; }
  function withUnit(v, u) { return u ? v + (u === '%' || u.charAt(0) === '\u00b0' ? '' : ' ') + u : v; }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  function unitOf(u) {
    if (u === undefined || u === null) return '';
    var t = String(u).trim();
    if (t.length > 16) throw new Err('The unit label can be at most 16 characters, for example V, A, kW, \u03a9 or lx.');
    if (/[\u0000-\u001f\u007f<>]/.test(t)) throw new Err('The unit label can contain letters, digits and symbols such as \u03a9, \u00b5, \u00b0, % and /, but not control characters, < or >.');
    return t;
  }
  /* readings: separated by new lines, spaces, tabs or semicolons. A comma that ends a reading ("229, 231, 230") is accepted; a comma inside a number is refused by the number parser,
     because 1,5 could be a decimal comma and 1,000 a thousand, and guessing would change the data. */
  function tokens(src) {
    var s = String(src == null ? '' : src).replace(/[\u2212\u2013\u2014]/g, '-').replace(/\u00a0/g, ' ');
    return s.split(/[\s;]+/).map(function (t) { return t.replace(/,+$/, ''); }).filter(function (t) { return t !== ''; });
  }
  function scaled(text, s) { var neg = text.charAt(0) === '-', b = neg ? text.slice(1) : text, i = b.indexOf('.'), ip = i < 0 ? b : b.slice(0, i), fp = i < 0 ? '' : b.slice(i + 1), v = BigInt(ip + fp + '0'.repeat(s - fp.length)); return neg ? -v : v; }
  function decimals(text) { var i = text.indexOf('.'); return i < 0 ? 0 : text.length - i - 1; }
  function sqrtQ(q, places) { // square root of a non-negative fraction: { text, exact }; an exact rational root is formatted like any fraction, an irrational root is rounded half up from an integer square root
    var sn = isqrt(q.n), sd = isqrt(q.d);
    if (sn * sn === q.n && sd * sd === q.d) { var f = P.fmt(mk(sn, sd), places); return { text: f.text, exact: f.exact, irrational: false, frac: mk(sn, sd) }; }
    var k = places === 'auto' ? 6 : places, y = isqrt(4n * P10(2 * k) * q.n / q.d), r = (y + 1n) >> 1n;
    return { text: P.roundText(mk(r, P10(k)), k), exact: false, irrational: true, frac: null };
  }
  function run(o) {
    var u = unitOf(o.unit);
    var basis = o.basis === undefined || o.basis === null || o.basis === '' ? 'pct' : o.basis;
    if (basis !== 'pct' && basis !== 'abs') throw new Err('The tolerance basis must be pct (percentage of the reference) or abs (absolute value).');
    P.fmt(mk(0n, 1n), o.places); // validates the decimal places
    var places = o.places === undefined || o.places === null || o.places === '' || o.places === 'auto' ? 'auto' : Number(o.places);
    var ref = P.parseNum(o.y, 'The reference value'), tolIn = P.parseNum(o.t, 'The tolerance', { pct: basis === 'pct' });
    if (!tolIn.empty && tolIn.q.n < 0n) throw new Err('The tolerance is the size of the permitted band, so enter it without a minus sign (for \u00b13, enter 3 and not -3).');
    var toks = tokens(o.x), reads = [];
    if (toks.length > MAXN) throw new Err('At most ' + MAXN + ' readings can be analysed at once. You entered ' + toks.length + '.');
    for (var i = 0; i < toks.length; i++) { var p = P.parseNum(toks[i], 'Reading ' + (i + 1)); reads.push(p); }
    if (ref.empty || !reads.length) return { ok: false, empty: true, error: '', hint: HINT };
    var n = reads.length, N = BigInt(n), s = decimals(ref.text); reads.forEach(function (r) { s = Math.max(s, decimals(r.text)); });
    var S = P10(s), S2 = P10(2 * s), R = mk(scaled(ref.text, s), S), aR = R.n < 0n ? mk(-R.n, R.d) : R, refZero = R.n === 0n, rI = scaled(ref.text, s), absR = rI < 0n ? -rI : rI;
    var I = reads.map(function (r) { return scaled(r.text, s); }), E = I.map(function (v) { return v - rI; });
    var hasTol = !tolIn.empty, pc = basis === 'pct';
    if (hasTol && pc && refZero) throw new Err('The reference value is 0, so a percentage tolerance has no size. Enter an absolute tolerance instead.');
    // sums, exactly
    var sumI = 0n, sumE = 0n, sumA = 0n, sumQ = 0n, maxA = -1n, maxAt = 0, minI = I[0], maxI = I[0], eqMax = 0;
    for (i = 0; i < n; i++) {
      var a = E[i] < 0n ? -E[i] : E[i]; sumI += I[i]; sumE += E[i]; sumA += a; sumQ += E[i] * E[i];
      if (a > maxA) { maxA = a; maxAt = i + 1; eqMax = 1; } else if (a === maxA) eqMax++;
      if (I[i] < minI) minI = I[i]; if (I[i] > maxI) maxI = I[i];
    }
    var sorted = I.slice().sort(function (p, q) { return p < q ? -1 : p > q ? 1 : 0; });
    var median = n % 2 ? mk(sorted[(n - 1) / 2], S) : mk(sorted[n / 2 - 1] + sorted[n / 2], 2n * S);
    var SS = N * sumQ - sumE * sumE; // n times the sum of squared deviations, scaled by 10^2s; never negative
    var sumDev = mk(SS, N * S2), popVar = mk(SS, N * N * S2), smpVar = n >= 2 ? mk(SS, N * (N - 1n) * S2) : null, msq = mk(sumQ, N * S2);
    var sdP = sqrtQ(popVar, places), sdS = smpVar ? sqrtQ(smpVar, places) : null, rms = sqrtQ(msq, places);
    var sumQr = mk(sumI, S), meanE = mk(sumE, N * S), meanA = mk(sumA, N * S), meanObs = add(R, meanE), maxAq = mk(maxA, S), minQ = mk(minI, S), maxQ = mk(maxI, S), rangeQ = mk(maxI - minI, S);
    var sumEq = mk(sumE, S), sumAq = mk(sumA, S);
    function fv(q) { var f = P.fmt(q, places); return { text: (f.exact ? '' : '\u2248 ') + f.text, exact: f.exact, raw: f.text }; }
    function fs(q) { var f = P.fmt(q, places); return { text: (f.exact ? '' : '\u2248 ') + plusT(f.text), exact: f.exact, raw: f.text }; }
    function pctQ(q) { return mul(div(q, aR), HUNDRED); }
    function fpct(q) { return fv(pctQ(q)); }
    function fspct(q) { return fs(pctQ(q)); }
    function ex(q, f) { return f.exact ? '' : (q.d <= 10n ** 30n && q.n <= 10n ** 60n ? 'Rounded: the exact value is ' + q.n + (q.d === 1n ? '' : '/' + q.d) + '. ' : 'Rounded for display. '); }
    var allExact = true, track = function (f) { if (!f.exact) allExact = false; return f; };
    var meanObsF = track(fv(meanObs)), meanEF = track(fs(meanE)), meanAF = track(fv(meanA)), rmsT = rms.exact ? rms.text : '\u2248 ' + rms.text, sdPT = sdP.exact ? sdP.text : '\u2248 ' + sdP.text, sdST = sdS ? (sdS.exact ? sdS.text : '\u2248 ' + sdS.text) : null;
    if (!rms.exact) allExact = false; if (!sdP.exact) allExact = false; if (sdS && !sdS.exact) allExact = false;
    var meanPctF = null, mapeF = null, maxPctF = null, sdPctP = null, sdPctS = null, maxAF = dec(maxAq), rmsPct = null;
    if (!refZero) {
      meanPctF = track(fspct(meanE)); mapeF = track(fpct(meanA)); maxPctF = track(fpct(maxAq));
      sdPctP = sqrtQ(mk(SS * 10000n, N * N * rI * rI), places); sdPctS = smpVar ? sqrtQ(mk(SS * 10000n, N * (N - 1n) * rI * rI), places) : null;
      rmsPct = sqrtQ(mk(sumQ * 10000n, N * rI * rI), places);
    }
    var pt = function (r) { return r === null ? null : (r.exact ? '' : '\u2248 ') + r.text + '%'; };
    // individual readings
    var tolQ = null, L = null, U = null, lowI = null;
    if (hasTol) { tolQ = pc ? mul(mk(tolIn.q.n, tolIn.q.d * 100n), aR) : tolIn.q; L = sub(R, tolQ); U = add(R, tolQ); }
    var rows = [], nIn = 0, nBelow = 0, nAbove = 0, nOn = 0, outList = [];
    for (i = 0; i < n; i++) {
      var ea = E[i] < 0n ? -E[i] : E[i], pq = refZero ? null : mk(100n * E[i], absR), pf = pq ? P.fmt(pq, places) : null, row = { i: i + 1, obs: reads[i].text, err: plusT(dec(mk(E[i], S))), abs: dec(mk(ea, S)), pct: pq ? (pf.exact ? '' : '\u2248 ') + plusT(pf.text) + '%' : null, pctExact: pf ? pf.exact : true };
      if (hasTol) {
        var xq = mk(I[i], S), c1 = cmp(xq, L), c2 = cmp(xq, U);
        row.status = c1 < 0 ? 'below' : c2 > 0 ? 'above' : 'within'; row.onLimit = row.status === 'within' && (c1 === 0 || c2 === 0);
        if (row.status === 'within') { nIn++; if (row.onLimit) nOn++; } else { if (row.status === 'below') nBelow++; else nAbove++; outList.push(i + 1); }
      }
      if (pf && !pf.exact) allExact = false;
      rows.push(row);
    }
    var devs = hasTol ? { within: nIn, below: nBelow, above: nAbove, onLimit: nOn, outside: n - nIn } : null;
    var dirWord = meanE.n === 0n ? 'equal' : meanE.n > 0n ? 'above' : 'below';
    var out = { ok: true, kind: 'batch', unit: u, n: n, reference: ref.text, y: ref.text, places: places, exact: allExact, readings: reads.map(function (r) { return r.text; }), reads: rows,
      sum: dec(sumQr), meanObserved: meanObsF.text, median: dec(median), min: dec(minQ), max: dec(maxQ), span: dec(rangeQ), sumError: plusT(dec(sumEq)), meanSigned: meanEF.text, direction: dirWord,
      meanAbs: meanAF.text, maxAbs: maxAF, maxAbsAt: maxAt, rmse: rmsT, sdPop: sdPT, sdSample: sdST, meanSignedPct: meanPctF ? meanPctF.text + '%' : null, meanAbsPct: mapeF ? mapeF.text + '%' : null,
      maxAbsPct: maxPctF ? maxPctF.text + '%' : null, sdPopPct: pt(sdPctP), sdSamplePct: pt(sdPctS), rmsePct: pt(rmsPct), refZero: refZero, tol: devs, hasTol: hasTol, basis: basis,
      varPop: popVar.n + '/' + popVar.d, varSample: smpVar ? smpVar.n + '/' + smpVar.d : null, sumSqDev: sumDev.n + '/' + sumDev.d, meanSignedNum: String(meanE.n), meanSignedDen: String(meanE.d) };
    // the verdict and the limits, when a tolerance was entered
    var tolText = null, Ls = null, Us = null, verdict = null;
    if (hasTol) {
      tolText = pc ? '\u00b1' + tolIn.text + '%' : '\u00b1' + withUnit(tolIn.text, u); Ls = dec(L); Us = dec(U);
      var allIn = nIn === n;
      verdict = allIn ? (n === 1 ? 'The reading is within the entered tolerance' : 'All ' + n + ' readings are within the entered tolerance') + (nOn ? ' (' + plural(nOn, 'reading') + ' on a limit)' : '') : nIn + ' of ' + plural(n, 'reading') + ' ' + (nIn === 1 || n === 1 ? 'is' : 'are') + ' within the entered tolerance; ' + (n - nIn) + ' ' + (n - nIn === 1 ? 'is' : 'are') + ' outside it';
      out.pass = allIn; out.verdict = verdict; out.tolText = tolText; out.lower = Ls; out.upper = Us; out.tolValue = dec(tolQ); out.range = withUnit(Ls, u) + ' to ' + withUnit(Us, u); out.outside = outList.slice();
    }
    var es = meanEF.text, dirText = dirWord === 'equal' ? 'equal to the reference on average' : dirWord + ' the reference on average';
    out.label = hasTol ? verdict : 'Analysis of ' + plural(n, 'reading');
    out.big = 'Mean signed error ' + withUnit(es, u) + ' \u00b7 mean absolute error ' + withUnit(meanAF.text, u) + ' \u00b7 maximum absolute error ' + withUnit(maxAF, u);
    out.sentence = plural(n, 'observed reading') + ' against a reference of ' + withUnit(ref.text, u) + ': mean ' + withUnit(meanObsF.text, u) + ' (' + dirText + '), mean signed error ' + withUnit(es, u) + ', mean absolute error ' + withUnit(meanAF.text, u) +
      ', maximum absolute error ' + withUnit(maxAF, u) + (sdST !== null ? ', sample standard deviation ' + withUnit(sdST, u) : '') + (hasTol ? '. ' + verdict + ' (entered tolerance ' + tolText + ', permitted range ' + out.range + ')' : '');
    out.formula = 'Error = Reading ' + MN + ' Reference; mean signed error = \u03a3 Error \u00f7 n; mean absolute error = \u03a3 |Error| \u00f7 n; standard deviation = \u221a(\u03a3 (Reading ' + MN + ' mean)\u00b2 \u00f7 n), or \u00f7 (n ' + MN + ' 1) for the sample';
    var list = n <= 10 ? E.map(function (e) { return sg(dec(mk(e, S))); }).join(' + ') : null;
    out.subst = 'n = ' + n + '; \u03a3 Error = ' + (list ? list + ' = ' : '') + plusT(dec(sumEq)) + '; mean signed error = ' + sg(plusT(dec(sumEq))) + ' \u00f7 ' + n + ' = ' + es + (u ? ' ' + u : '');
    var errList = n <= 10 ? rows.map(function (r) { return sg(r.obs) + ' ' + MN + ' ' + sg(ref.text) + ' = ' + r.err; }).join('; ') : null;
    out.steps = [
      'Each error is the reading minus the reference ' + withUnit(ref.text, u) + (errList ? ': ' + errList + '.' : '. The ' + n + ' errors run from ' + plusT(dec(mk(minI - rI, S))) + ' to ' + plusT(dec(mk(maxI - rI, S))) + (u ? ' ' + u : '') + '.'),
      'The sum of the readings is ' + withUnit(dec(sumQr), u) + ', so the mean observed value is ' + dec(sumQr) + ' \u00f7 ' + n + ' = ' + withUnit(meanObsF.text, u) + '. The sum of the errors is ' + withUnit(plusT(dec(sumEq)), u) + ', so the mean signed error is ' + sg(plusT(dec(sumEq))) + ' \u00f7 ' + n + ' = ' + withUnit(es, u) + ': the readings are ' + dirText + '.',
      'The sum of the absolute errors is ' + withUnit(dec(sumAq), u) + ', so the mean absolute error is ' + dec(sumAq) + ' \u00f7 ' + n + ' = ' + withUnit(meanAF.text, u) + '. The largest absolute error is ' + withUnit(maxAF, u) + ' at reading ' + maxAt + (eqMax > 1 ? ' (the first of ' + eqMax + ' readings with that error)' : '') + '.',
      'The sum of the squared deviations of the readings from their mean is ' + fv(sumDev).text + (u ? ' ' + u + '\u00b2' : '') + '. The population standard deviation is \u221a(' + fv(sumDev).text + ' \u00f7 ' + n + ') = ' + withUnit(sdPT, u) + (sdST !== null ? ' and the sample standard deviation is \u221a(' + fv(sumDev).text + ' \u00f7 ' + (n - 1) + ') = ' + withUnit(sdST, u) + '.' : '. The sample standard deviation needs at least 2 readings.'),
      refZero ? 'Percentage errors are not defined because the reference is 0, so the errors are compared in ' + (u || 'the unit of the readings') + ' only.' : 'Each percentage error is the error \u00f7 ' + (R.n < 0n ? '|' + ref.text.slice(1) + '|' : ref.text) + ' \u00d7 100, for example ' + sg(rows[0].err) + ' \u00f7 ' + (R.n < 0n ? '|' + ref.text.slice(1) + '|' : ref.text) + ' \u00d7 100 = ' + rows[0].pct + '. The mean signed deviation is ' + out.meanSignedPct + ' and the mean absolute percentage error is ' + out.meanAbsPct + '.'];
    if (hasTol) out.steps.push('The entered tolerance ' + tolText + (pc ? ' of the reference' : '') + ' gives the limits ' + withUnit(Ls, u) + ' to ' + withUnit(Us, u) + ' (limits included). ' + verdict + (outList.length ? ': readings ' + outList.slice(0, 20).join(', ') + (outList.length > 20 ? ' and ' + (outList.length - 20) + ' more' : '') + ' are outside' : '') + '.');
    out.rows = [
      ['Reference value', withUnit(ref.text, u), 'The accepted, rated, nominal or true value every reading is compared with'],
      ['Number of readings', String(n), 'Each reading is counted once'],
      ['Sum of the readings', withUnit(dec(sumQr), u), ''],
      ['Mean observed value', withUnit(meanObsF.text, u), ex(meanObs, meanObsF) + 'Sum of the readings \u00f7 n'],
      ['Median observed value', withUnit(dec(median), u), 'The middle reading when they are put in order (the mean of the two middle readings when n is even)'],
      ['Minimum reading', withUnit(dec(minQ), u), ''], ['Maximum reading', withUnit(dec(maxQ), u), ''], ['Range', withUnit(dec(rangeQ), u), 'Maximum reading ' + MN + ' minimum reading'],
      ['Mean signed error (bias)', withUnit(es, u), ex(meanE, meanEF) + 'Mean of (reading ' + MN + ' reference). Positive: the readings are above the reference on average'],
      ['Mean signed percentage deviation', meanPctF ? meanPctF.text + '%' : 'Not defined', meanPctF ? ex(pctQ(meanE), meanPctF) + 'Mean signed error \u00f7 |reference| \u00d7 100' : 'The reference is 0'],
      ['Mean absolute error', withUnit(meanAF.text, u), ex(meanA, meanAF) + 'Mean of |reading ' + MN + ' reference|. Errors above and below do not cancel'],
      ['Mean absolute percentage error', mapeF ? mapeF.text + '%' : 'Not defined', mapeF ? ex(pctQ(meanA), mapeF) + 'Mean absolute error \u00f7 |reference| \u00d7 100' : 'The reference is 0'],
      ['Maximum absolute error', withUnit(maxAF, u), 'Largest |reading ' + MN + ' reference|, at reading ' + maxAt + (eqMax > 1 ? ' (first of ' + eqMax + ')' : '')],
      ['Maximum absolute percentage error', maxPctF ? maxPctF.text + '%' : 'Not defined', maxPctF ? ex(pctQ(maxAq), maxPctF) + 'Maximum absolute error \u00f7 |reference| \u00d7 100' : 'The reference is 0'],
      ['Root mean square error', withUnit(rmsT, u), (rms.exact ? '' : 'Rounded: not a finite decimal. ') + '\u221a(mean of the squared errors). It combines bias and spread: RMSE\u00b2 = bias\u00b2 + population variance'],
      ['Standard deviation, population (n)', withUnit(sdPT, u), (sdP.exact ? '' : 'Rounded: not a finite decimal. ') + 'Spread of the readings about their own mean, divided by n. The reference does not enter it'],
      ['Standard deviation, sample (n ' + MN + ' 1)', sdST !== null ? withUnit(sdST, u) : 'Not defined', sdST !== null ? (sdS.exact ? '' : 'Rounded: not a finite decimal. ') + 'The usual estimate when the readings are a sample of repeated measurements' : 'It needs at least 2 readings'],
      ['Sample standard deviation as % of reference', out.sdSamplePct || 'Not defined', out.sdSamplePct ? 'Sample standard deviation \u00f7 |reference| \u00d7 100' : (refZero ? 'The reference is 0' : 'It needs at least 2 readings')]];
    if (hasTol) {
      var used = tolQ.n === 0n ? null : fv(mul(div(maxAq, tolQ), HUNDRED));
      out.rows.push(['Tolerance entered', (pc ? 'Percentage of reference: ' : 'Absolute: ') + tolText, 'A limit that you entered. It is not read from any standard or datasheet'], ['Permitted range', out.range, 'Reference \u00b1 tolerance, limits included: a reading on a limit is accepted'],
        ['Readings within the tolerance', nIn + ' of ' + n, nOn ? plural(nOn, 'reading') + ' exactly on a limit' : 'None exactly on a limit'], ['Readings outside the tolerance', String(n - nIn), n - nIn ? plural(nBelow, 'reading') + ' below the lower limit, ' + plural(nAbove, 'reading') + ' above the upper limit. Reading numbers: ' + outList.slice(0, 20).join(', ') + (outList.length > 20 ? ' and ' + (outList.length - 20) + ' more' : '') : 'No reading is below the lower limit or above the upper limit'],
        ['Largest error uses', used ? used.text + '%' : 'Not defined', used ? 'Maximum absolute error \u00f7 tolerance \u00d7 100. Over 100% means that reading is outside' : 'The tolerance is 0, so any error is beyond it']);
    }
    out.rows.push(['Scope of this result', hasTol ? 'These readings and the entered tolerance only' : 'These readings only', 'Measurement uncertainty is not applied and no standard is checked']);
    if (!allExact && out.rows.length) out.exactNote = 'Some values are rounded for display and are marked \u2248.';
    var w = [];
    if (R.n < 0n) w.push('The reference is negative, so percentages divide by its size, |reference|. A reading above the reference still has a positive error.');
    if (refZero) w.push('The reference is 0, so percentage errors are not defined. The errors are given in ' + (u || 'the unit of the readings') + ' only.');
    if (n === 1) w.push('With one reading the sample standard deviation is not defined and the population standard deviation is 0. Enter at least 2 readings to see a spread.');
    if (n >= 2 && SS === 0n) w.push('All readings are identical, so the standard deviation is 0. That can reflect the resolution of the instrument rather than perfect repeatability.');
    if (hasTol && tolQ.n === 0n) w.push('A tolerance of 0 accepts only a reading equal to the reference.');
    out.warnings = w;
    // data for the chart: the signed percentage deviation, or the signed error in the unit when the reference is 0
    var mg = function (q) { var f = P.fmt(q, 6); return f.text; };
    out.chart = { measure: refZero ? 'abs' : 'pct', unit: u, labels: rows.map(function (r) { return String(r.i); }),
      values: E.map(function (e) { return refZero ? mg(mk(e, S)) : mg(mk(100n * e, absR)); }), mean: refZero ? mg(meanE) : mg(pctQ(meanE)), band: hasTol ? (refZero ? mg(tolQ) : mg(pctQ(tolQ))) : null,
      status: hasTol ? rows.map(function (r) { return r.status; }) : null };
    return out;
  }
  function calc(o) {
    try { return run(o || {}); } catch (e) { if (e && typeof e.message === 'string' && !(e instanceof Error)) return { ok: false, error: e.message, empty: false }; throw e; }
  }
  var api = { calc: calc, tokens: tokens, HINT: HINT, MAXN: MAXN };
  if (isNode) module.exports = api; else root.PercentErrorMode04 = api;
})(typeof window !== 'undefined' ? window : this);
