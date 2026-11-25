/* Elecmetric Random Number Generator: page script for Modes 01 (Random Integers), 02 (Random Decimals), 03 (Unique Numbers), 04 (Statistical Sampling) and 05 (Engineering Test Data), plus multiple independent sets, Clear results and the session generation history. Inlined by tools/rng_page.js after the engine. */
(function () {
  var $ = function (id) { return document.getElementById(id); }, R = Rng, err = $('nu-err'), out = $('nu-out'), stp = $('nu-steps'), last = null;
  var IN = ['min', 'max', 'count', 'sets', 'seed', 'places', 'excl', 'p1', 'p2', 'p3', 'bins', 'dsname'];
  function isDec() { return $('nu-type').value === 'dec'; }
  var DIST = {
    normal: { l: ['Mean (\u03bc)', 'Standard deviation (\u03c3)'], d: ['0', '1'], h: ['e.g. 0', 'e.g. 1'], disc: false },
    uniform: { l: ['Minimum', 'Maximum'], d: ['0', '1'], h: ['e.g. 0', 'e.g. 1'], disc: false },
    exponential: { l: ['Rate (\u03bb)'], d: ['1'], h: ['e.g. 1'], disc: false },
    triangular: { l: ['Minimum', 'Mode (most likely)', 'Maximum'], d: ['0', '1', '3'], h: ['e.g. 0', 'e.g. 1', 'e.g. 3'], disc: false },
    poisson: { l: ['Mean (\u03bb)'], d: ['4'], h: ['e.g. 4'], disc: true },
    binomial: { l: ['Trials (n)', 'Success probability (p)'], d: ['20', '0.3'], h: ['1 to 1000', '0 to 1'], disc: true }
  };
  function isStat() { return $('nu-mode').value === 'stat'; }
  function labels() {
    var D = DIST[$('nu-dist').value] || DIST.normal, i;
    for (i = 1; i <= 3; i++) { $('nu-p' + i + 'f').hidden = !isStat() || i > D.l.length; if (i <= D.l.length) { $('nu-p' + i).previousElementSibling.textContent = D.l[i - 1]; $('nu-p' + i).placeholder = D.h[i - 1]; } }
  }
  function distDefaults() { var D = DIST[$('nu-dist').value], i; for (i = 1; i <= 3; i++) $('nu-p' + i).value = i <= D.d.length ? D.d[i - 1] : ''; }
  function fm(x) { if (x === null || x === undefined) return 'n/a'; if (x === 0) return '0'; var a = Math.abs(x); return a >= 1e-4 && a < 1e15 ? String(Number(x.toPrecision(8))) : x.toExponential(6); }
  function histSvg(h, r) {
    var W = 640, H = 270, L = 50, Rt = 12, T = 14, B = 52, k = h.bins.length, mx = 0, i, svg, bw = (W - L - Rt) / k, ph = H - T - B, step, tk = [], y, lab;
    h.bins.forEach(function (b) { if (b.count > mx) mx = b.count; });
    step = Math.pow(10, Math.floor(Math.log(mx / 4) / Math.LN10)); [1, 2, 5, 10].some(function (m) { if (mx / (step * m) <= 5) { step *= m; return true; } return false; });
    for (y = 0; y <= mx + step * 0.999; y += step) { tk.push(y); if (y >= mx) break; }
    var top = tk[tk.length - 1] || 1;
    svg = '<svg class="hist" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Histogram of ' + r.count + ' ' + esc(r.distName) + ' values in ' + k + ' bin' + (k === 1 ? '' : 's') + '. The tallest bin holds ' + mx + ' values.">';
    tk.forEach(function (v) { var yy = T + ph - v / top * ph; svg += '<line x1="' + L + '" x2="' + (W - Rt) + '" y1="' + yy + '" y2="' + yy + '" stroke="var(--line)" stroke-width="1"/><text x="' + (L - 6) + '" y="' + (yy + 4) + '" text-anchor="end" font-size="11" fill="var(--muted)">' + v + '</text>'; });
    h.bins.forEach(function (b, j) {
      var bh = b.count / top * ph;
      svg += '<rect x="' + (L + j * bw + 0.5) + '" y="' + (T + ph - bh) + '" width="' + Math.max(1, bw - 1) + '" height="' + bh + '" fill="var(--cyan)" opacity="0.85"><title>' + esc(h.discrete ? b.label : fm(b.lo) + ' to ' + fm(b.hi)) + ': ' + b.count + '</title></rect>';
    });
    var every = Math.ceil(k / (h.discrete ? 14 : 6));
    if (h.discrete) h.bins.forEach(function (b, j) { if (j % every) return; svg += '<text x="' + (L + (j + 0.5) * bw) + '" y="' + (T + ph + 15) + '" text-anchor="middle" font-size="11" fill="var(--muted)">' + esc(b.label) + '</text>'; });
    else for (i = 0; i <= k; i += every) svg += '<text x="' + (L + i * bw) + '" y="' + (T + ph + 15) + '" text-anchor="' + (i === 0 ? 'start' : i === k ? 'end' : 'middle') + '" font-size="11" fill="var(--muted)">' + esc(fm(Number((i < k ? h.bins[i].lo : h.max).toPrecision(4)))) + '</text>';
    svg += '<line x1="' + L + '" x2="' + (W - Rt) + '" y1="' + (T + ph) + '" y2="' + (T + ph) + '" stroke="var(--muted)"/><text x="' + (L + (W - L - Rt) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="12" fill="var(--muted)">Value</text><text transform="translate(13 ' + (T + ph / 2) + ') rotate(-90)" text-anchor="middle" font-size="12" fill="var(--muted)">Count</text></svg>';
    return svg;
  }
  function showS(r) {
    var steps = [], st = r.stats, th = r.theory, h = r.hist, sortTxt = r.sort === 'asc' ? 'ascending' : r.sort === 'desc' ? 'descending' : 'the order drawn', dp = r.places + ' decimal place' + (r.places === 1 ? '' : 's');
    var rows = h.bins.map(function (b) { return [h.discrete ? b.label : fm(b.lo) + ' to ' + fm(b.hi) + (b === h.bins[h.bins.length - 1] ? ' (inclusive)' : ''), String(b.count), (b.count / r.count * 100).toFixed(2) + '%']; });
    out.innerHTML = '<div class="res"><div class="big rg" tabindex="0" role="region" aria-label="Generated sample">' + esc(r.values.join(', ')) + '</div><div class="sub">' + r.count + (r.count === 1 ? ' value' : ' values') + ': ' + esc(r.label) + (r.discrete ? '' : ', rounded to ' + dp) + ', ' + sortTxt + '.</div></div>' +
      table(['Count', 'Mean', 'Median', 'Std deviation', 'Smallest', 'Largest', 'Sum'], [[String(st.n), fm(st.mean), fm(st.median), fm(st.sd), fm(st.min), fm(st.max), fm(st.sum)]], 'st') +
      table(['Theoretical mean', 'Theoretical std deviation', 'Sample mean minus theory'], [[fm(th.mean), fm(th.sd), fm(Number((st.mean - th.mean).toPrecision(6)))]], 'st') +
      histSvg(h, r) + '<details><summary>Histogram data (' + h.bins.length + ' bin' + (h.bins.length === 1 ? '' : 's') + ')</summary>' + table(['Bin', 'Count', 'Share'], rows) + '</details>' +
      '<p class="note">Synthetic data from a simulated distribution. It is not measured data and not a validated physical model. Source: ' + esc(r.source) + (r.seeded ? '. The same seed and settings always give these same numbers; clear the seed for new ones.' : '.') + ' Not for passwords, keys or any security use.</p>';
    var how = { normal: 'Normal: each pair of uniform numbers u1 and u2 gives two standard normal values by the Box-Muller transform, z = sqrt(\u22122 ln u1) cos(2\u03c0 u2) and sqrt(\u22122 ln u1) sin(2\u03c0 u2), and each value is mean + standard deviation \u00d7 z.', uniform: 'Uniform: each value is minimum + (maximum \u2212 minimum) \u00d7 u.', exponential: 'Exponential: each value is \u2212ln(u) / rate, the inverse of the cumulative distribution.', triangular: 'Triangular: with F = (mode \u2212 min) / (max \u2212 min), a value below F is min + \u221a(u (max \u2212 min)(mode \u2212 min)) and otherwise max \u2212 \u221a((1 \u2212 u)(max \u2212 min)(max \u2212 mode)).', poisson: 'Poisson: the cumulative probabilities are added up one count at a time (0, 1, 2 and so on) until they reach u, and that count is the value.', binomial: 'Binomial: the cumulative probabilities are added up one count at a time until they reach u, and that count is the value' + (r.params.p2 > 0.5 && r.params.p2 < 1 ? ' (with a success probability above 1/2 the failures are counted this way and subtracted from the number of trials)' : '') + '.' };
    steps.push('Each uniform number u is built from 53 random bits as (k + 0.5) / 2^53, so it lies strictly between 0 and 1 and every value is equally likely to be any of 2^53 levels.');
    steps.push(how[r.dist]);
    steps.push(r.discrete ? 'The values are whole numbers, so nothing is rounded.' : 'Each value is rounded to ' + dp + ' before the statistics and histogram are worked out, so they describe the numbers you see.');
    steps.push('The mean and sample standard deviation (divided by n \u2212 1) are computed from the listed values. The theoretical mean is ' + fm(th.mean) + ' and the theoretical standard deviation is ' + fm(th.sd) + '. A sample scatters around these, less so as the quantity grows.');
    steps.push(h.discrete ? 'The histogram has one bin per whole number' + (h.width > 1 ? ' grouped in steps of ' + h.width + ' because the range is wide or you chose a bin count' : '') + '.' : 'The histogram has ' + h.k + ' equal-width bin' + (h.k === 1 ? '' : 's') + ' from the smallest to the largest value (' + (bins_() ? 'your choice' : 'automatic: about log2(n) + 1, between 5 and 30') + '); the largest value goes in the last bin.');
    steps.push('Results are shown in ' + sortTxt + '.');
    steps.push(r.seeded ? 'Because a seed was entered, the bits come from a documented pseudorandom generator (cyrb128 and sfc32). It is repeatable, which is useful for testing, but it is not secure.' : 'No seed was entered, so the bits come from the browser\u2019s Web Crypto generator.');
    stp.innerHTML = '<ol class="steps">' + steps.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>';
  }
  function bins_() { var v = $('nu-bins').value.trim().toLowerCase(); return v !== '' && v !== 'auto'; }
  function isUniq() { return $('nu-mode').value === 'uniq'; }
  function isEng() { return $('nu-mode').value === 'eng'; }
  function sync() {
    var st = isStat(), en = isEng(), un = isUniq();
    $('nu-placesf').hidden = en ? true : st ? DIST[$('nu-dist').value].disc : !isDec(); $('nu-dupf').hidden = un || st || en; $('nu-exclf').hidden = !un;
    $('nu-typef').hidden = st || en; $('nu-minf').hidden = st || en; $('nu-maxf').hidden = st || en; $('nu-distf').hidden = !st; $('nu-binsf').hidden = !st; $('nu-sortf').hidden = en;
    $('nu-dsnamef').hidden = !en; $('nu-eng').hidden = !en; $('nu-count').previousElementSibling.textContent = en ? 'Observations (rows)' : 'How many numbers'; labels();
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  /* ----- Mode 05: parameter rows ----- */
  var rowsEl = $('nu-engrows'), rowN = 0, MAXP = 8;
  var DOPTS = [['uniform', 'Uniform (flat)'], ['normal', 'Normal (bell)'], ['triangular', 'Triangular'], ['loguniform', 'Log-uniform']];
  var ROW0 = { name: 'Voltage', unit: 'V', min: '210', max: '250', typ: '230', dist: 'normal', places: '1', tol: '' };
  function rowHtml(d) {
    var id = 'nu-e' + (++rowN) + '-';
    function f(k, label, ph) { return '<div class="ns-f"><label class="ns-l" for="' + id + k + '">' + label + '</label><input id="' + id + k + '" data-k="' + k + '" class="ns-in" type="text" inputmode="' + (k === 'places' ? 'numeric' : k === 'name' || k === 'unit' ? 'text' : 'decimal') + '" autocomplete="off" autocorrect="off" spellcheck="false" aria-describedby="nu-err" value="' + esc(d[k] == null ? '' : d[k]) + '" placeholder="' + esc(ph) + '"></div>'; }
    var sel = '<div class="ns-f"><label class="ns-l" for="' + id + 'dist">Distribution</label><select id="' + id + 'dist" data-k="dist" class="ns-sel">' + DOPTS.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === d.dist ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></div>';
    return '<div class="eng-row"><div class="eng-h"><strong class="eng-t">Parameter</strong><button type="button" class="btn2" data-act="delp">Remove</button></div><div class="eng-g">' + f('name', 'Name', 'e.g. Voltage') + f('unit', 'Unit', 'e.g. V') + f('min', 'Minimum', 'e.g. 210') + f('max', 'Maximum', 'e.g. 250') + sel + f('typ', 'Typical (optional)', 'middle of range') + f('places', 'Decimal places', '0 to 15') + f('tol', 'Tolerance (optional)', '0.5 or 1%') + '</div></div>';
  }
  function rowTyp(el) { var ds = el.querySelector('[data-k="dist"]').value, t = el.querySelector('[data-k="typ"]'), on = ds === 'normal' || ds === 'triangular'; t.disabled = !on; t.placeholder = on ? 'middle of range' : 'not used'; }
  function renum() { Array.prototype.forEach.call(rowsEl.children, function (el, i) { el.querySelector('.eng-t').textContent = 'Parameter ' + (i + 1); el.querySelector('[data-act="delp"]').hidden = rowsEl.children.length < 2; }); $('nu-addp').disabled = rowsEl.children.length >= MAXP; }
  function addRow(d) {
    if (rowsEl.children.length >= MAXP) { say('A dataset can hold at most ' + MAXP + ' parameters.'); return; }
    rowsEl.insertAdjacentHTML('beforeend', rowHtml(Object.assign({ name: 'Parameter ' + (rowsEl.children.length + 1), unit: '', min: '0', max: '100', typ: '', dist: 'uniform', places: '2', tol: '' }, d || {}))); rowTyp(rowsEl.lastElementChild); renum();
  }
  function setRows(a) { rowsEl.innerHTML = ''; (a && a.length ? a : [ROW0]).slice(0, MAXP).forEach(addRow); }
  function readRows() { return Array.prototype.map.call(rowsEl.children, function (el) { var o = {}; Array.prototype.forEach.call(el.querySelectorAll('[data-k]'), function (i) { o[i.dataset.k] = i.value; }); if (el.querySelector('[data-k="typ"]').disabled) o.typ = ''; return o; }); }
  function showE(r) {
    var steps = [], anyTol = r.params.some(function (q) { return q.measured; }), shown = Math.min(r.count, 50), i, rows = [], head = ['Observation'], tolRows = [];
    r.params.forEach(function (q) { head.push(esc(q.label)); if (q.measured) head.push(esc(q.mlabel)); });
    head.push('Data label');
    for (i = 0; i < shown; i++) { var row = [String(i + 1)]; r.params.forEach(function (q) { row.push(q.values[i]); if (q.measured) row.push(q.measured[i]); }); row.push('SYNTHETIC'); rows.push(row); }
    var sum = r.params.map(function (q) { return [q.label, q.distName.replace(' (cut at the limits)', '') + (q.typical !== null ? ', typical ' + fm(q.typical) : ''), q.min + ' to ' + q.max, String(q.places), fm(q.stats.mean), fm(q.stats.median), fm(q.stats.sd), fm(q.stats.min), fm(q.stats.max)]; });
    r.params.forEach(function (q) { if (q.measured) tolRows.push([q.label, '\u00b1' + q.tolText + (q.tolPct ? '' : (q.unit ? ' ' + q.unit : '')) + (q.tolPct ? ' of the value' : ''), fm(Number(q.mstats.meanErr.toPrecision(6))), fm(q.mstats.maxAbsErr), String(q.mstats.outside)]); });
    out.innerHTML = '<div class="syn" role="note"><strong>SYNTHETIC DATA.</strong> Simulated by random-number models. This is not field measurement data, not equipment test results and not compliance evidence. Every export carries the label SYNTHETIC.</div>' +
      '<div class="res"><div class="sub">' + esc(r.title) + ': ' + r.count + (r.count === 1 ? ' observation' : ' observations') + ' of ' + r.params.length + (r.params.length === 1 ? ' parameter' : ' parameters') + (r.seeded ? ', seeded' : ', unseeded') + '.</div></div>' +
      table(['Parameter', 'Distribution', 'Limits (on the grid)', 'Decimals', 'Mean', 'Median', 'Std deviation', 'Smallest', 'Largest'], sum, 'st') +
      (anyTol ? table(['Parameter', 'Tolerance', 'Mean error', 'Largest error', 'Measured outside limits'], tolRows, 'st') : '') +
      '<h3>Data' + (r.count > shown ? ' (first ' + shown + ' of ' + r.count + ' rows; download for all)' : '') + '</h3>' + table(head, rows, 'st') +
      r.params.map(function (q) { return '<details><summary>Histogram: ' + esc(q.label) + '</summary>' + histSvg(q.hist, { count: r.count, distName: q.label }) + '</details>'; }).join('') +
      '<p class="note">Source: ' + esc(r.source) + (r.seeded ? '. The same seed and settings always give these same numbers; clear the seed for new ones.' : '.') + ' Not for passwords, keys or any security use.</p>';
    steps.push('Each parameter is a column with its own stream of random numbers. Every value is built from uniform numbers made from 53 random bits, strictly between 0 and 1' + (r.seeded ? ', and each column has its own seed stream (your seed text plus the column number), so changing one parameter never changes another column.' : '.'));
    r.params.forEach(function (q) {
      var m = { uniform: 'uniform: value = minimum + (maximum \u2212 minimum) \u00d7 u', normal: 'normal, centred on ' + fm(q.typical) + ' with standard deviation (maximum \u2212 minimum) / 6 = ' + fm(Number((q.sdUsed || 0).toPrecision(6))) + ' (Box-Muller); a draw outside the limits is thrown away and drawn again, so the values stay inside', triangular: 'triangular with its peak at ' + fm(q.typical) + ' (inverse of the cumulative distribution)', loguniform: 'log-uniform: value = exp(ln(minimum) + (ln(maximum) \u2212 ln(minimum)) \u00d7 u), so each factor of ten is equally likely' }[q.dist];
      steps.push(q.label + ': ' + m + '. Rounded to ' + q.places + ' decimal place' + (q.places === 1 ? '' : 's') + '; limits ' + q.min + ' to ' + q.max + (q.adjusted ? ' (a limit that fell between grid points was moved inward to the nearest one)' : '') + '.' + (q.typIgnored ? ' The typical value is not used by this distribution.' : ''));
      if (q.measured) steps.push(q.label + ' measurement tolerance \u00b1' + q.tolText + (q.tolPct ? ' of each value' : ' ' + q.unit) + ': a second column adds an error e, uniform from \u2212tolerance to +tolerance, to each value and rounds to the same places. This simulates an instrument that stays within its stated band. Measured values can lie slightly outside the limits.');
    });
    steps.push('The mean, median and sample standard deviation (divided by n \u2212 1) are worked out from the values listed in the table, as are the histograms.');
    steps.push('Every row and every export file carries the label SYNTHETIC. The numbers come from simple models, so they are test data only, never field measurements or evidence of compliance.');
    steps.push(r.seeded ? 'Because a seed was entered, the bits come from a documented pseudorandom generator (cyrb128 and sfc32). It is repeatable, which is useful for testing, but it is not secure.' : 'No seed was entered, so the bits come from the browser\u2019s Web Crypto generator.');
    stp.innerHTML = '<ol class="steps">' + steps.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>';
  }
  function say(t) { $('nu-note').textContent = ''; setTimeout(function () { $('nu-note').textContent = t; }, 30); }
  function opts() { return { places: $('nu-places').value, min: $('nu-min').value, max: $('nu-max').value, count: $('nu-count').value, unique: isUniq() || $('nu-dup').value === 'no', type: isDec() ? 'dec' : 'int', exclude: $('nu-excl').value, dist: $('nu-dist').value, p1: $('nu-p1').value, p2: $('nu-p2').value, p3: $('nu-p3').value, bins: $('nu-bins').value, sort: $('nu-sort').value, seed: $('nu-seed').value, name: $('nu-dsname').value, params: isEng() ? readRows() : null }; }
  function clearBad() { IN.forEach(function (k) { $('nu-' + k).setAttribute('aria-invalid', 'false'); $('nu-' + k).classList.remove('bad'); }); Array.prototype.forEach.call(rowsEl.querySelectorAll('[data-k]'), function (i) { i.classList.remove('bad'); i.setAttribute('aria-invalid', 'false'); }); }
  function bad(msg, fld, row) {
    err.textContent = msg; out.innerHTML = ''; stp.innerHTML = '<p class="note">Fix the input to see the steps.</p>'; last = null; setBtns(false); clearBad();
    if (isEng()) {
      var el = row !== undefined && rowsEl.children[row] ? rowsEl.children[row].querySelector('[data-k="' + fld + '"]') : fld && $('nu-' + fld);
      if (el) { el.classList.add('bad'); el.setAttribute('aria-invalid', 'true'); if (el.focus) el.focus(); }
      return;
    }
    var t = /^The excluded number|^Every number in the range|^The exclude list/.test(msg) ? 'excl' : /Decimal places must/.test(msg) ? 'places' : /minimum/.test(msg) && !/greater/.test(msg) ? 'min' : /maximum/.test(msg) ? 'max' : /quantity|unique|many/.test(msg) ? 'count' : /seed/.test(msg) ? 'seed' : /greater/.test(msg) ? 'min' : null;
    if (fld && $('nu-' + fld)) t = fld;
    if (t) { $('nu-' + t).classList.add('bad'); $('nu-' + t).setAttribute('aria-invalid', 'true'); }
  }
  function setBtns(on) { Array.prototype.forEach.call($('nu').querySelectorAll('[data-need]'), function (b) { b.disabled = !on; }); }
  function pct(r) { var s = BigInt(r.span), two = BigInt(1) << BigInt(r.bits); return r.bits === 0 ? 100 : Number(s * BigInt(10000) / two) / 100; }
  function table(head, rows, cls) { return '<div class="tw' + (cls ? ' ' + cls : '') + '" tabindex="0" role="region" aria-label="Scrollable table: ' + head.join(', ') + '"><table class="ns-t"><thead><tr>' + head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td class="r">' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>'; }
  function big(x) { return x.length > 24 ? '\u2248 ' + x.charAt(0) + '.' + x.slice(1, 4) + ' \u00d7 10^' + (x.length - 1) : x.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function list(a, n) { return a.length > n ? a.slice(0, n).join(', ') + ' and ' + (a.length - n) + ' more' : a.join(', '); }
  function showU(r) {
    var steps = [], sortTxt = r.sort === 'asc' ? 'ascending' : r.sort === 'desc' ? 'descending' : 'the order drawn', dp = r.places + ' decimal place' + (r.places === 1 ? '' : 's'), chance = Number(BigInt(r.count) * BigInt(1000000) / BigInt(r.pool)) / 10000;
    out.innerHTML = '<div class="res"><div class="big rg" tabindex="0" role="region" aria-label="Generated unique numbers">' + esc(r.values.join(', ')) + '</div><div class="sub">' + r.count + (r.count === 1 ? ' unique number' : ' unique numbers') + ' from ' + esc(r.min) + ' to ' + esc(r.max) + (r.decimal ? ', ' + dp : '') + (r.excluded ? ', leaving out ' + r.excluded + ' excluded number' + (r.excluded === 1 ? '' : 's') : '') + ', ' + sortTxt + '.</div></div>' +
      stdT(r) +
      table(['Numbers in range', 'Excluded', 'Pool to draw from', 'Chance a given number is picked', 'Possible sets (order ignored)', 'Possible orderings'], [[big(r.span), String(r.excluded), big(r.pool), (chance >= 99.995 ? '100' : chance.toFixed(chance < 1 ? 4 : 2).replace(/\.?0+$/, '')) + '%', r.combos === null ? 'too many to count here' : big(r.combos), r.perms === null ? 'too many to count here' : big(r.perms)]]) +
      (r.sort !== 'none' ? '<p class="note"><strong>Draw order:</strong> ' + esc(list(r.original, 60)) + '</p>' : '') +
      (r.ignored.length ? '<p class="note">Ignored (outside the range' + (r.decimal ? ' or not on the ' + dp + ' grid' : '') + '): ' + esc(list(r.ignored, 20)) + '.</p>' : '') +
      '<p class="note">Source: ' + esc(r.source) + (r.seeded ? '. The same seed and settings always give these same numbers; clear the seed for new ones.' : '.') + ' Not for passwords, keys or any security use.</p>';
    steps.push(r.decimal ? 'Numbers with ' + dp + ' form a grid in steps of 1/10^' + r.places + '. From ' + r.min + ' to ' + r.max + ' the grid has ' + r.span + ' value' + (r.span === '1' ? '' : 's') + '.' : 'The range ' + r.min + ' to ' + r.max + ' holds ' + r.span + ' whole number' + (r.span === '1' ? '' : 's') + ', both ends included.');
    steps.push(r.excluded ? r.excluded + ' number' + (r.excluded === 1 ? '' : 's') + ' in the range ' + (r.excluded === 1 ? 'is' : 'are') + ' left out (' + list(r.excludedList, 20) + '), so the pool to draw from holds ' + r.pool + '.' : 'No numbers are excluded, so the pool to draw from holds all ' + r.pool + '.');
    steps.push('Each pick takes one number from the pool and removes it (a partial Fisher-Yates shuffle), so no number can come up twice.' + (r.full ? ' You asked for as many numbers as the pool holds, so this is a complete random shuffle of it.' : ''));
    steps.push('Every pick is uniform: it draws just enough random bits to cover the numbers still left and repeats the draw if the bits land outside them, so there is no modulo bias.' + (r.excluded ? ' Picks are made among positions 0 to ' + (BigInt(r.pool) - BigInt(1)) + ' of the pool and then mapped back to values by skipping the excluded ones, which keeps every remaining number equally likely.' : ''));
    steps.push('Any one number has a ' + r.count + ' in ' + r.pool + ' chance of being in the result, and every set of ' + r.count + ' different numbers is equally likely' + (r.combos === null ? '.' : ' (1 chance in ' + big(r.combos) + ').'));
    steps.push('The mean, median and sample standard deviation (divided by n \u2212 1) are worked out exactly from the listed values using whole-number arithmetic, then rounded to ' + ((r.decimal ? r.places : 0) + 4) + ' decimal places with trailing zeros dropped. The standard deviation is not shown for a single value.');
    steps.push('Results are shown in ' + sortTxt + '.');
    steps.push(r.seeded ? 'Because a seed was entered, the numbers come from a documented pseudorandom generator (cyrb128 and sfc32). It is repeatable, which is useful for testing, but it is not secure.' : 'No seed was entered, so the bits come from the browser\u2019s Web Crypto generator.');
    stp.innerHTML = '<ol class="steps">' + steps.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>';
  }
  function show(r) {
    if (r.mode === 'multi') return showM(r);
    if (r.mode === 'unique') return showU(r);
    if (r.mode === 'stat') return showS(r);
    if (r.mode === 'eng') return showE(r);
    var steps = [], sortTxt = r.sort === 'asc' ? 'ascending' : r.sort === 'desc' ? 'descending' : 'the order drawn';
    out.innerHTML = '<div class="res"><div class="big rg" tabindex="0" role="region" aria-label="Generated numbers">' + esc(r.values.join(', ')) + '</div><div class="sub">' + r.count + (r.count === 1 ? ' number' : ' numbers') + ' from ' + esc(r.min) + ' to ' + esc(r.max) + (r.decimal ? ', ' + r.places + ' decimal place' + (r.places === 1 ? '' : 's') : '') + (r.unique ? ', no duplicates' : ', duplicates allowed') + ', ' + sortTxt + '.</div></div>' +
      stdT(r) +
      '<p class="note">Source: ' + esc(r.source) + (r.seeded ? '. The same seed and settings always give these same numbers; clear the seed for new ones.' : '.') + ' Not for passwords, keys or any security use.</p>';
    if (r.decimal) { steps.push('Numbers with ' + r.places + ' decimal place' + (r.places === 1 ? '' : 's') + ' form a grid in steps of 1/10^' + r.places + '. From ' + r.min + ' to ' + r.max + ' the grid has ' + r.span + ' value' + (r.span === '1' ? '' : 's') + (r.adjusted ? ' (a bound that fell between grid points was moved inward to the nearest one)' : '') + '.'); steps.push('Each grid value is given a whole-number position, one position is chosen with equal probability, and it is written back with exactly ' + r.places + ' decimal place' + (r.places === 1 ? '' : 's') + '. No floating-point numbers are generated or rounded, so the digits are exact and every grid value is equally likely.'); }
    else steps.push('The range ' + r.min + ' to ' + r.max + ' holds ' + r.span + ' whole number' + (r.span === '1' ? '' : 's') + ', both ends included.');
    if (!r.decimal || r.bits > 0) steps.push(r.bits === 0 ? 'Only one value is possible, so no random bits are needed.' : 'Choosing one of ' + r.span + (r.decimal ? ' positions' : ' values') + ' needs ' + r.bits + ' random bit' + (r.bits === 1 ? '' : 's') + '. A draw of that many bits is rejected and repeated if it falls outside the range (about ' + pct(r).toFixed(pct(r) >= 99.995 ? 0 : 1) + '% of draws are accepted). Rejecting instead of taking a remainder keeps every value equally likely.');
    steps.push(r.unique ? 'Duplicates are off, so numbers are drawn without replacement (a partial Fisher-Yates shuffle): once a value is picked it cannot come up again.' : 'Duplicates are allowed, so each number is an independent draw and the same value can repeat.');
    steps.push('The mean, median and sample standard deviation (divided by n \u2212 1) are worked out exactly from the listed values using whole-number arithmetic, then rounded to ' + ((r.decimal ? r.places : 0) + 4) + ' decimal places with trailing zeros dropped. The standard deviation is not shown for a single value.');
    steps.push('Results are shown in ' + sortTxt + '.');
    steps.push(r.seeded ? 'Because a seed was entered, the numbers come from a documented pseudorandom generator (cyrb128 and sfc32). It is repeatable, which is useful for testing, but it is not secure.' : 'No seed was entered, so the bits come from the browser\u2019s Web Crypto generator.');
    stp.innerHTML = '<ol class="steps">' + steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>';
  }
  /* ----- multiple sets, clear results and session history ----- */
  var hist = [], histN = 0, MAXH = 20, MAXHV = 300000;
  function kindOf() { return isEng() ? 'eng' : isStat() ? 'stat' : isUniq() ? 'uniq' : isDec() ? 'dec' : 'int'; }
  function engLike(r) { return r.mode === 'eng' || (r.mode === 'multi' && r.inner === 'eng'); }
  function cellS(x) { return x === null || x === undefined ? 'n/a' : typeof x === 'number' ? fm(x) : x; }
  function stdT(r) { return table(['Count', 'Smallest', 'Largest', 'Sum', 'Mean', 'Median', 'Std deviation'], [[String(r.stats.n), r.stats.min, r.stats.max, r.stats.sum, cellS(r.stats.mean), cellS(r.stats.median), cellS(r.stats.sd)]]); }
  var SYNB = '<div class="syn" role="note"><strong>SYNTHETIC DATA.</strong> Simulated by random-number models. This is not field measurement data, not equipment test results and not compliance evidence. Every export carries the label SYNTHETIC.</div>';
  function showDetail(m, i) {
    var det = $('nu-setdetail'), keep = out, x;
    out = det; show(m.sets[i]); out = keep;
    x = det.querySelector('.syn'); if (x) x.parentNode.removeChild(x);
    x = det.querySelector('.big.rg'); if (x) x.parentNode.removeChild(x);
    stp.innerHTML = '<p class="note">' + esc('Working for set ' + (i + 1) + ' of ' + m.n + '. ' + (m.seeded ? 'This set uses the seed ' + (i === 0 ? 'exactly as typed.' : 'followed by |set ' + (i + 1) + '.') : 'This set drew its own fresh Web Crypto bits.')) + ' Choose another set under \u201cDetail for one set\u201d.</p>' + stp.innerHTML;
  }
  function showM(m) {
    var en = m.inner === 'eng', head, rows = [], pick = '', i;
    if (en) {
      head = ['Set', 'Parameter', 'Mean', 'Median', 'Std deviation', 'Smallest', 'Largest'];
      m.sets.forEach(function (r, k) { r.params.forEach(function (q) { rows.push([String(k + 1), q.label, cellS(q.stats.mean), cellS(q.stats.median), cellS(q.stats.sd), cellS(q.stats.min), cellS(q.stats.max)]); }); });
    } else {
      head = ['Set', 'Count', 'Smallest', 'Largest', 'Sum', 'Mean', 'Median', 'Std deviation'].concat(m.seeded ? ['Seed used'] : []);
      m.sets.forEach(function (r, k) { var t = r.stats; rows.push([String(k + 1), String(r.count), cellS(t.min), cellS(t.max), cellS(t.sum), cellS(t.mean), cellS(t.median), cellS(t.sd)].concat(m.seeded ? [r.seed] : [])); });
    }
    for (i = 0; i < m.n; i++) pick += '<option value="' + i + '">Set ' + (i + 1) + '</option>';
    out.innerHTML = (en ? SYNB : '') + '<div class="res"><div class="sub">' + m.n + ' independent sets of ' + m.count + (en ? (m.count === 1 ? ' observation' : ' observations') : (m.count === 1 ? ' value' : ' values')) + ' each (' + m.total + ' values in all)' + (m.seeded ? ', seeded' : ', unseeded') + '.</div>' +
      (en ? '<p class="note">Each set is a full dataset. The list below the tables shows the first 50 rows of the set you pick; download for every row of every set.</p>' : '<div class="sets" tabindex="0" role="region" aria-label="Generated sets">' + m.sets.map(function (r, k) { return '<div class="setr"><b>Set ' + (k + 1) + '</b>' + esc(r.values.join(', ')) + '</div>'; }).join('') + '</div>') +
      '<h3>Statistics for each set</h3>' + table(head, rows, 'st') +
      '<h3>Detail for one set</h3><div class="ns-f nu-pick"><label class="ns-l" for="nu-setpick">Show working and charts for</label><select id="nu-setpick" class="ns-sel">' + pick + '</select></div><div id="nu-setdetail"></div>' +
      '<p class="note">' + (m.seeded ? 'Set 1 uses your seed exactly as typed, so it matches a normal run. Set k, from 2, uses the seed followed by |set k, so every set is repeatable and adding sets never changes the earlier ones. ' : 'No seed was entered, so each set draws its own fresh bits from Web Crypto and the sets are independent of one another. ') + 'The detail below also carries the source and the security note.</p></div>';
    showDetail(m, 0);
  }
  function short(x) { x = String(x); return x.length > 16 ? x.slice(0, 6) + '\u2026 (' + x.length + ' digits)' : x; }
  function valuesOf(r) { return r.mode === 'multi' ? r.total : r.mode === 'eng' ? r.count * r.params.length : r.count; }
  function labelOf(r) {
    var b = r.mode === 'multi' ? r.sets[0] : r, t;
    if (b.mode === 'eng') t = esc(b.title) + ': ' + b.params.length + (b.params.length === 1 ? ' parameter' : ' parameters') + ', ' + b.count + (b.count === 1 ? ' row' : ' rows');
    else if (b.mode === 'stat') t = esc(b.label) + ', ' + b.count + (b.count === 1 ? ' value' : ' values');
    else t = (b.mode === 'unique' ? (b.decimal ? 'Unique decimals ' : 'Unique numbers ') : b.decimal ? 'Decimals ' : 'Integers ') + esc(short(b.min)) + ' to ' + esc(short(b.max)) + ', ' + b.count + (b.count === 1 ? ' value' : ' values');
    return t + (r.mode === 'multi' ? ', ' + r.n + ' sets' : '') + (b.seeded ? ', seeded' : '');
  }
  function renderHist() {
    var h = $('nu-hist'); $('nu-clearh').disabled = !hist.length;
    if (!hist.length) { h.innerHTML = '<p class="note">Nothing yet. Each result you generate is added here, newest first.</p>'; return; }
    h.innerHTML = '<ol class="hl">' + hist.map(function (e) {
      var b = e.result.mode === 'multi' ? e.result.sets[0] : e.result, pv = engLike(e.result) ? 'SYNTHETIC test data' : esc(list(b.values, 6));
      return '<li><div class="hi-t"><strong>#' + e.id + '</strong> <span>' + esc(e.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })) + '</span></div><div class="hi-d">' + labelOf(e.result) + '</div><div class="hi-p">' + pv + '</div>' +
        '<div class="hi-b"><button type="button" class="btn2" data-act="hshow" data-id="' + e.id + '">Show result</button><button type="button" class="btn2" data-act="hrun" data-id="' + e.id + '">Run again</button></div></li>';
    }).join('') + '</ol>';
  }
  function addHist(r) {
    var tot = 0;
    hist.unshift({ id: ++histN, time: new Date(), snap: snap(), result: r });
    if (hist.length > MAXH) hist.length = MAXH;
    hist.forEach(function (e) { tot += valuesOf(e.result); });
    while (hist.length > 1 && tot > MAXHV) tot -= valuesOf(hist.pop().result);
    renderHist();
  }
  function snap() { var f = {}; IN.forEach(function (k) { f[k] = $('nu-' + k).value; }); ['mode', 'dist', 'type', 'dup', 'sort'].forEach(function (k) { f[k] = $('nu-' + k).value; }); return { f: f, rows: readRows() }; }
  function restore(sn) { Object.keys(sn.f).forEach(function (k) { $('nu-' + k).value = sn.f[k]; }); setRows(sn.rows); sync(); }
  function clearResults() { out.innerHTML = ''; stp.innerHTML = '<p class="note">Nothing generated yet.</p>'; err.textContent = ''; clearBad(); last = null; setBtns(false); say('Results cleared. The history is kept.'); }
  function gen() {
    var o = opts(), sv = $('nu-sets').value.trim() || '1', r;
    if (sv === '1') r = isEng() ? R.engineering(o) : isStat() ? R.sample(o) : isUniq() ? R.uniques(o) : isDec() ? R.decimals(o) : R.integers(o);
    else { o.kind = kindOf(); o.sets = sv; r = R.multiple(o); }
    if (!r.ok) { bad(r.error, r.field, r.row); say(r.error); return; }
    err.textContent = ''; clearBad();
    last = r; setBtns(true); show(r); addHist(r);
    say(r.mode === 'multi' ? r.n + ' sets generated, ' + r.total + ' values in all.' : r.mode === 'eng' ? r.count + (r.count === 1 ? ' observation' : ' observations') + ' of synthetic data generated.' : r.count + (r.count === 1 ? ' number generated.' : ' numbers generated.'));
  }
  function copy(t) { var d = function () { say('Copied'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(d, d); else { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(a); d(); } }
  function fname(ext) { return (engLike(last) ? 'synthetic-engineering-test-data' : 'random-numbers') + (last.mode === 'multi' ? '-sets' : '') + '.' + ext; }
  function save(name, mime, text) {
    var b = new Blob([text], { type: mime + ';charset=utf-8' }), u = URL.createObjectURL(b), a = document.createElement('a');
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(u); }, 1000); say('Downloaded ' + name);
  }
  $('nu').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.act === 'gen') { gen(); return; }
    if (b.dataset.act === 'clear') { clearResults(); return; }
    if (b.dataset.act === 'clearh') { hist = []; renderHist(); say('History cleared.'); return; }
    if (b.dataset.act === 'hshow' || b.dataset.act === 'hrun') {
      var he = hist.filter(function (x) { return String(x.id) === b.dataset.id; })[0]; if (!he) return;
      restore(he.snap);
      if (b.dataset.act === 'hrun') { gen(); return; }
      err.textContent = ''; clearBad(); last = he.result; setBtns(true); show(last); say('Showing result #' + he.id + ' from the history.'); return;
    }
    if (b.dataset.act === 'addp') { addRow(); return; }
    if (b.dataset.act === 'delp') { if (rowsEl.children.length > 1) { b.closest('.eng-row').remove(); renum(); } return; }
    if (b.dataset.act === 'copy' && last) { copy(engLike(last) ? R.toTsv(last) : R.toText(last, ', ')); return; }
    if (b.dataset.act === 'txt' && last) { save(fname('txt'), 'text/plain', engLike(last) ? R.toText(last) : R.toText(last, '\n') + '\n'); return; }
    if (b.dataset.act === 'csv' && last) { save(fname('csv'), 'text/csv', R.toCsv(last)); return; }
    if (b.dataset.act === 'json' && last) { save(fname('json'), 'application/json', R.toJson(last, new Date().toISOString())); return; }
    if (b.dataset.act === 'reset') { IN.forEach(function (k) { $('nu-' + k).value = $('nu-' + k).defaultValue; }); ['mode', 'dist', 'type', 'dup', 'sort'].forEach(function (k) { $('nu-' + k).selectedIndex = 0; }); setRows(null); sync(); gen(); return; }
    if (b.dataset.ex) { var d = JSON.parse(b.dataset.ex); Object.keys(d).forEach(function (k) { if (k !== 'params' && $('nu-' + k)) $('nu-' + k).value = d[k]; }); if (d.params) setRows(d.params); sync(); gen(); }
  });
  $('nu').addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); gen(); } });
  rowsEl.addEventListener('change', function (e) { var el = e.target.closest('.eng-row'); if (el && e.target.dataset.k === 'dist') rowTyp(el); });
  ['type', 'mode'].forEach(function (k) { $('nu-' + k).addEventListener('change', function () { sync(); gen(); }); });
  $('nu-dist').addEventListener('change', function () { distDefaults(); sync(); gen(); });
  $('nu-out').addEventListener('change', function (e) { if (e.target.id === 'nu-setpick' && last && last.mode === 'multi') showDetail(last, Number(e.target.value)); });
  setRows(null); sync(); renderHist(); gen();
})();
