/* Elecmetric Log Calculator: engine for Mode 03 (Missing Value Solver).
   log_b(x) = y means b^y = x. The user gives any two of b, x and y and the engine finds the third:
     y = log_b(x)        from the Mode 01 engine (tools/log_engine.js), so Modes 01 and 03 can never disagree
     x = b^y             from the Mode 02 engine (tools/antilog_engine.js)
     b = x^(1/y)         solved here: with y = p/q in lowest terms, b = x^(q/p). The real positive root is unique.
   Every answer is classified: unique (one valid value), indeterminate (every valid value works, or the question has no single answer), none (no real value with b > 0 and b not 1).
   A logarithm base must be positive and not 1, so a negative root is never offered (x = 9, y = 2 gives b = 3, not b = -3).
   The base is exact when the numerator and the denominator of x are both perfect |p|-th powers, and is then b = (their roots)^q. Otherwise it is irrational and only a decimal is given.
   The decimal is 10^t with t = log10(x) / y in 90-digit fixed point, kept as a mantissa and an exponent (limit 10^(+-1,000,000,000)).
   If all three values are given, the engine checks whether log_b(x) = y holds. Nothing is rounded internally. Errors are returned, never thrown.
   Works in Node (module.exports) and in the browser (global LogSolver, after Quad, Lg, ExponentFrac and Antilog). */
(function (root) {
  'use strict';
  var isNode = typeof require === 'function' && typeof module !== 'undefined';
  var Q = isNode ? require('./quad_engine.js') : root.Quad, L = isNode ? require('./log_engine.js') : root.Lg, A = isNode ? require('./antilog_engine.js') : root.Antilog, F = isNode ? require('./exponent_frac_engine.js') : root.ExponentFrac;
  var R = Q.R, O = Q.ops, rs = Q.rs, mn = Q.mn, S = L.S, LN10 = L.LN10, LN2 = L.LN2;
  var LIMIT_T = 1000000000n * S, EXACT_BITS = 100000;
  var MSG_B0 = 'The base must be greater than zero.', MSG_B1 = 'Error: a logarithm to base 1 does not exist, because 1 raised to any power is 1.';
  var MSG_X0 = 'Undefined: the logarithm of zero does not exist for any base.', MSG_XN = 'No real result: the logarithm of a negative number is not a real number.';
  var MSG_Y_E = 'The logarithm y must be a number. Only the base b and the argument x can be e.';
  function babs(a) { return a < 0n ? -a : a; }
  function bitlen(n) { return n.toString(2).length; }
  var sub = function (bs) { return /^[0-9]+$/.test(bs) ? bs.split('').map(function (c) { return String.fromCharCode(0x2080 + +c); }).join('') : '_(' + bs + ')'; };

  /* ---------- reading the three values ---------- */
  function blank(t) { return String(t === undefined || t === null ? '' : t).trim() === ''; }
  function readV(text, allowE, errE) {
    var s = String(text).trim();
    if (/^[eE]$/.test(s)) return allowE ? { e: true } : { error: errE };
    var r = Q.parseNum(s); if (r.error) return { error: r.error };
    return { q: r.v };
  }
  /* a rational as text: a terminating decimal when there is one (0.5, 0.4771), otherwise the fraction (2/3) */
  function show(q) { var d = Q.decOfRational(q, 15); return d.exact ? d.text : rs(q); }
  var showV = function (v) { return v.e ? 'e' : show(v.q); };
  var isOne = function (v) { return !v.e && O.eq(v.q, O.ri(1)); };
  function eqText(bs, xs, ys) { return L.eqText(bs, xs, ys); }
  /* log_b(x) = y with a symbol or a number for the base: e -> ln, a digit string -> subscript, anything else (b) -> log_b */
  function lbText(bs, xs, ys) { return (bs === 'e' ? 'ln(' + xs + ')' : /^[0-9]+$/.test(bs) ? 'log' + sub(bs) + '(' + xs + ')' : 'log_' + bs + '(' + xs + ')') + (ys === undefined ? '' : ' = ' + ys); }
  var eqv = function (name, txt) { return name + (/^\u2248/.test(txt) ? ' ' + txt : ' = ' + txt); };
  var rootName = function (k) { return k === 2n ? 'square root' : k === 3n ? 'cube root' : k + '-th root'; }, powName = function (k) { return k === 2n ? 'perfect squares' : k === 3n ? 'perfect cubes' : 'perfect ' + k + '-th powers'; };
  function powText(bs, ys) { return bs + '^' + (/^-?\d+$/.test(ys) ? ys : '(' + ys + ')'); }

  /* ---------- the base: b = x^(q/p) ---------- */
  function solveBase(x, y, sig) {
    var p = y.q.n, q = y.q.d, ys = show(y.q), xs = showV(x), out = { find: 'b', steps: [], verify: [] }, st = out.steps;
    st.push('The base b is unknown. log_b(x) = y means b^y = x, with x = ' + xs + ' and y = ' + ys + '.');
    st.push('Domain check: x = ' + xs + ' is greater than zero. The base must be greater than zero and not 1, and the answer is checked against that.');
    if (p === 0n) {
      if (isOne(x)) { st.push('y = 0 and x = 1: b^0 = 1 is true for every base, so every valid base (any b > 0 with b not 1) satisfies log_b(1) = 0.'); return indeterminate(out, 'Every valid base works', 'b^0 = 1 for every base b, so log_b(1) = 0 whatever the base is (b > 0, b not 1).'); }
      st.push('y = 0, so b^0 = 1 whatever b is, but x = ' + xs + ' is not 1.'); return none(out, 'No base gives log_b(' + xs + ') = 0, because b^0 = 1, never ' + xs + '.');
    }
    if (isOne(x)) { st.push('x = 1 and y = ' + ys + ' is not 0. b^y = 1 with y not 0 only holds for b = 1 (b must be positive), and b = 1 is not allowed as a logarithm base.'); return none(out, 'The only positive number with b^' + ys + ' = 1 is b = 1, which cannot be a logarithm base.'); }
    st.push('Raise both sides of b^y = x to the power 1/y: b = x^(1/y). Here y = ' + rs(y.q) + ', so 1/y = ' + rs(R(q, p)) + ' and b = x^(' + rs(R(q, p)) + ').');
    var lnx = x.e ? S : L.lnRatS(x.q.n, x.q.d), tS = A.floorDiv(lnx * q * S, p * LN10);
    if (babs(tS) > LIMIT_T) { var msg = 'Out of range: b would be about 10^' + L.fmtS(tS, 0).replace(/-/, '\u2212') + ', but results are limited to a size of 10^1,000,000,000.'; return { ok: false, errors: { x: msg }, error: msg }; }
    var E0 = Number(A.floorDiv(tS, S)), f = tS - BigInt(E0) * S, fx = A.fixDigits(A.expS(f * LN10 / S), E0), M = fx.M, E = fx.E;
    var status = 'irrational', bq = null, bIsE = false, rn = null, rd = null, ap = babs(p);
    if (x.e) {
      if (p === 1n && q === 1n) { status = 'rational'; bIsE = true; }
    } else {
      var n = x.q.n, d = x.q.d; if (p < 0n) { var tmp = n; n = d; d = tmp; }
      rn = ap === 1n ? n : A.iroot(n, ap); rd = rn === null ? null : (ap === 1n ? d : A.iroot(d, ap));
      if (rn !== null && rd !== null) {
        var bits = (bitlen(rn) + bitlen(rd)) * Number(q);
        if (bits > EXACT_BITS) status = 'rational-large'; else { status = 'rational'; bq = R(rn ** q, rd ** q); }
      }
      out.rn = rn; out.rd = rd;
    }
    var dec, exactDigits = null;
    if (bIsE) { dec = A.render(M.toString(), E, sig, false); dec.exactDecimal = false; }
    else if (bq) { exactDigits = A.ratDigits(bq.n, bq.d, 91); var tz = A.trimZ(exactDigits.d), full = exactDigits.term && tz.length <= Math.max(sig, 40); dec = A.render(exactDigits.d, exactDigits.E, sig, full); dec.exactDecimal = full; }
    else { dec = A.render(M.toString(), E, sig, false); dec.exactDecimal = false; }
    var exactStr = bIsE ? 'e' : bq ? rs(bq) : null; if (exactStr !== null && exactStr.length > 120) exactStr = null;
    var approx = dec.plain !== null ? dec.plain : dec.sci, sure = bIsE || (!!bq && (exactStr !== null || dec.exactDecimal));
    var bText = bIsE ? 'e' : !bq ? '\u2248 ' + approx : exactStr !== null ? (bq.d === 1n ? exactStr : exactStr + (dec.exactDecimal ? ' = ' : ' \u2248 ') + approx) : (dec.exactDecimal ? '' : '\u2248 ') + approx;
    var bShort = bIsE ? 'e' : sure && exactStr !== null ? (bq.d !== 1n && dec.exactDecimal && dec.plain !== null ? dec.plain : exactStr) : '\u2248 ' + approx;
    out.status = status; out.bq = bq; out.bIsE = bIsE; out.dec = dec; out.exact = exactStr; out.sci = dec.sci; out.plain = dec.plain; out.E = dec.E;
    out.valueText = bText; out.label = status === 'rational' ? 'Exact result (a rational number)' : status === 'irrational' ? 'Irrational result (decimal approximation)' : 'Rational result too long to print in full (leading digits shown)';
    out.cls = 'unique'; out.clsText = 'One valid base';
    out.headline = eqv('b', bText); out.eq = lbText('b', xs, ys);
    out.expEq = sure && bShort.length <= 24 ? powText(bShort, ys) + ' = ' + xs : 'b^' + (/^-?\d+$/.test(ys) ? ys : '(' + ys + ')') + ' = ' + xs;
    out.t = L.fmtS(tS, 12);
    /* working */
    if (x.e) {
      if (status === 'rational') st.push('x = e and y = 1, so b = e^(1/1) = e.');
      else st.push('With x = e, b = e^(1/y) = e^(' + rs(R(q, p)) + '). The number e^r is irrational for every non-zero rational r, so only a decimal can be given.');
    } else if (ap === 1n) {
      st.push('y = ' + (p > 0n ? '1/' + q : '\u22121/' + q) + ', so 1/y is the whole number ' + (p > 0n ? q : '\u2212' + q) + ' and b = x^(' + (p > 0n ? q : '\u2212' + q) + ')' + (p < 0n ? ' = 1 / x^' + q : '') + (bq && exactStr !== null ? ' = ' + exactStr + '.' : '.'));
    } else if (status === 'irrational') {
      st.push('Write y = ' + rs(y.q) + ' as p/q with p = ' + p + ', q = ' + q + '. Then b = x^(q/p), the ' + rootName(ap) + ' of ' + (p < 0n ? '1/x' : 'x') + ', raised to the power ' + q + '.');
      st.push('For b to be rational, the numerator' + (x.q.d === 1n ? '' : ' and the denominator') + ' of ' + (p < 0n ? '1/x' : 'x') + ' would have to be ' + powName(ap) + ', and ' + (rn === null ? (p < 0n ? x.q.d : x.q.n) : (p < 0n ? x.q.n : x.q.d)) + ' is not. So b is irrational and only a decimal can be given.');
    } else {
      st.push('Write y = ' + rs(y.q) + ' as p/q with p = ' + p + ', q = ' + q + '. Then b = x^(q/p): take the ' + rootName(ap) + ' of ' + (p < 0n ? '1/x' : 'x') + ', then raise it to the power ' + q + '.');
      st.push('The ' + rootName(ap) + ' of ' + (p < 0n ? x.q.d : x.q.n) + ' is ' + rn + (x.q.d === 1n && p > 0n ? '' : ' and of ' + (p < 0n ? x.q.n : x.q.d) + ' is ' + rd) + ', so the root is ' + rs(R(rn, rd)) + (q === 1n ? ', and b = ' : ', and raised to the power ' + q + ' it gives b = ') + (exactStr !== null ? exactStr : 'a number too long to print') + '.');
    }
    st.push('For the decimal, ln b = ln x \u00f7 y, so b = 10^t with t = log\u2081\u2080(x) \u00f7 y = ' + out.t + '. Split t into a whole part E = ' + E0 + ' and a fractional part f = ' + L.fmtS(f, 12) + ', so b = 10^f \u00d7 10^E = ' + dec.sci + ' (at ' + sig + ' significant digits).');
    if (ap % 2n === 0n && q === 1n) st.push('y is an even whole number, so (\u2212b)^y = b^y as well, but a logarithm base must be positive. The negative root is excluded, so b is unique.');
    else st.push('Because a logarithm base must be positive, the real root is unique.');
    st.push('Reverse check: ' + (sure && bShort.length <= 24 ? lbText(bShort, xs) + ' = ' + ys : 'log to the base ' + bShort.replace(/^\u2248 /, '\u2248 ') + ' of ' + xs + ' is ' + ys + ' to the precision shown') + '.');
    /* the radical form of an irrational base */
    out.radical = null; out.radicalNote = null;
    if (!x.e && status === 'irrational' && ap > 1n) {
      var rf = F.radicalForm(x.q, p < 0n ? -q : q, ap); if (rf.ok && !rf.exactRoot) out.radical = rf.textNoSign; else if (!rf.ok) out.radicalNote = rf.reason;
    }
    /* checks */
    if (bq && exactStr !== null && !x.e) {
      var lr = L.calc({ b: rs(bq), x: rs(x.q), dp: 4 });
      if (lr.ok) out.verify.push({ text: 'Mode 01 gives ' + mn(eqText(exactStr, rs(x.q), lr.exact === null ? '\u2248 ' + lr.y.text : lr.exact)) + ': the logarithm to the base found is exactly y.', ok: lr.status === 'rational' && lr.exact === rs(y.q), exact: true });
    }
    if (bIsE) out.verify.push({ text: 'ln(e) = 1, so log_e(e) = 1 = y when y = 1.', ok: p === 1n && q === 1n, exact: true });
    if (bq && exactDigits) {
      var a1 = BigInt(exactDigits.d.padEnd(91, '0').slice(0, 91)), n1 = M, e1 = exactDigits.E, e2 = E;
      if (e2 === e1 - 1) n1 = M / 10n; else if (e2 === e1 + 1) a1 = a1 / 10n;
      out.verify.push({ text: 'The 80-digit decimal from 10^(log x / y) agrees with the exact value to 78 digits.', ok: (e2 === e1 || Math.abs(e2 - e1) === 1) && babs(a1 - n1) <= 10n ** 12n, exact: false });
    }
    var lnM = L.lnRatS(M, S), lnb = lnM + BigInt(E) * LN10, tol = 10n ** 25n * (babs(p) / q + 2n);
    out.verify.push({ text: 'y \u00d7 ln(b), recomputed in 90-digit arithmetic from the mantissa and exponent of b, equals ln(x) to better than 10^\u221260.', ok: babs(p * lnb / q - lnx) <= tol, exact: false });
    var nx = x.e ? Math.E : Number(x.q.n) / Number(x.q.d), ny = Number(p) / Number(q), bv = parseFloat(dec.sci.replace(/ \u00d7 10\^/, 'e'));
    if (isFinite(nx) && isFinite(ny) && isFinite(bv) && bv > 1e-300 && bv < 1e300 && Math.abs(ny) < 1e6) {
      var back = Math.pow(bv, ny); if (isFinite(back) && back > 1e-300 && back < 1e300) out.verify.push({ text: 'Double-precision b^y = ' + String(back) + ', which agrees with x.', ok: Math.abs(back - nx) <= 1e-9 * Math.abs(nx) * (1 + Math.abs(ny * Math.log(bv))), exact: false });
    }
    out.verifyOk = out.verify.every(function (v) { return v.ok; });
    out.rows = [];
    return out;
  }
  function indeterminate(out, label, note) { out.cls = 'indeterminate'; out.clsText = 'Not a single answer'; out.status = 'indeterminate'; out.valueText = label; out.headline = 'b: ' + label; out.label = label; out.note = note; out.eq = ''; out.expEq = ''; out.verify = []; out.verifyOk = true; out.rows = []; out.sci = null; out.exact = null; return out; }
  function none(out, note) { out.cls = 'none'; out.clsText = 'No valid base'; out.status = 'none'; out.valueText = 'No real solution'; out.headline = 'b: no valid base'; out.label = 'No real solution'; out.note = note; out.eq = ''; out.expEq = ''; out.verify = []; out.verifyOk = true; out.rows = []; out.sci = null; out.exact = null; return out; }

  /* ---------- the three ways to solve ---------- */
  function run(input) {
    input = input || {};
    var sig = input.sig === undefined ? 10 : Math.max(3, Math.min(30, input.sig | 0)), dp = Math.max(2, Math.min(15, sig)), errs = {};
    var bb = blank(input.b), xb = blank(input.x), yb = blank(input.y), given = (bb ? 0 : 1) + (xb ? 0 : 1) + (yb ? 0 : 1);
    if (given === 0) return { ok: false, empty: true, errors: {}, error: '' };
    var b = bb ? null : readV(input.b, true), x = xb ? null : readV(input.x, true), y = yb ? null : readV(input.y, false, MSG_Y_E);
    if (b && b.error) errs.b = b.error; if (x && x.error) errs.x = x.error; if (y && y.error) errs.y = y.error;
    if (b && b.q) { if (O.sgn(b.q) <= 0) errs.b = MSG_B0; else if (O.eq(b.q, O.ri(1))) errs.b = MSG_B1; }
    if (x && x.q) { if (O.sgn(x.q) === 0) errs.x = MSG_X0; else if (O.sgn(x.q) < 0) errs.x = MSG_XN; }
    if (errs.b || errs.x || errs.y) return { ok: false, errors: errs, error: errs.b || errs.x || errs.y };
    if (given < 2) return { ok: false, needMore: true, errors: {}, error: 'Enter any two of the three values b, x and y, and leave the one you want to find blank.' };
    var raw = { b: bb ? '' : String(input.b).trim(), x: xb ? '' : String(input.x).trim(), y: yb ? '' : String(input.y).trim() }, res;
    if (given === 3) res = check(raw, y, dp);
    else if (yb) res = solveY(raw, dp);
    else if (xb) res = solveX(raw, y, sig);
    else res = solveBase(x, y, sig);
    if (res.ok === false) return res;
    res.ok = true; res.sig = sig; res.dp = dp;
    res.given = { b: bb ? null : (raw.b.length > 40 ? showV(b) : raw.b), x: xb ? null : (raw.x.length > 40 ? showV(x) : raw.x), y: yb ? null : (raw.y.length > 40 ? show(y.q) : raw.y) };
    res.summary = summary(res);
    return res;
  }
  function solveY(raw, dp) {
    var r = L.calc({ b: raw.b, x: raw.x, dp: dp }), o = { find: 'y', steps: [], verify: [] };
    if (!r.ok) return { ok: false, errors: r.errors, error: r.error };
    o.status = r.status; o.exact = r.exact; o.cls = 'unique'; o.clsText = 'One value'; o.label = r.label; o.valueText = r.yText; o.headline = eqv('y', r.yText);
    o.eq = r.equation; o.expEq = r.expEq; o.verify = r.verify; o.verifyOk = r.verifyOk; o.sci = null; o.sub = r;
    o.steps = ['The logarithm y is unknown. log_b(x) = y means b^y = x, with b = ' + r.b + ' and x = ' + r.x + ', so y is the power that b must be raised to in order to give x.'].concat(r.steps.slice(1));
    o.rows = [['Common logarithm, log\u2081\u2080 x', r.common.text], ['Natural logarithm, ln x', r.natural.text], ['Binary logarithm, log\u2082 x', r.binary.text], ['Change of base', r.changeOfBase]];
    return o;
  }
  function solveX(raw, y, sig) {
    var r = A.calc({ b: raw.b, y: raw.y, sig: sig }), o = { find: 'x', steps: [], verify: [] };
    if (!r.ok) return { ok: false, errors: r.errors, error: r.error };
    var bs = r.b, ys = r.y;
    o.status = r.status; o.exact = r.exact; o.cls = 'unique'; o.clsText = 'One value'; o.label = r.label; o.valueText = r.xText; o.headline = eqv('x', r.xText);
    o.eq = lbText(bs, 'x', ys); o.expEq = r.expEq; o.verify = r.verify; o.verifyOk = r.verifyOk; o.sci = r.sci; o.plain = r.plain; o.radical = r.radical; o.sub = r;
    o.steps = ['The argument x is unknown. log_b(x) = y means b^y = x, with b = ' + bs + ' and y = ' + ys + ', so x = b^y is the antilogarithm.'].concat(r.steps.slice(1));
    o.rows = [['Common logarithm, log\u2081\u2080 x', r.log10], ['Natural logarithm, ln x', r.ln], ['Binary logarithm, log\u2082 x', r.log2]];
    return o;
  }
  /* all three given: does log_b(x) = y hold? */
  function check(raw, y, dp) {
    var r = L.calc({ b: raw.b, x: raw.x, dp: 15 }), o = { find: 'check', steps: [], verify: [], rows: [] };
    if (!r.ok) return { ok: false, errors: r.errors, error: r.error };
    var ys = show(y.q), holds;
    if (r.status === 'rational') holds = r.exact === rs(y.q);
    else if (r.status === 'irrational') holds = false;
    else holds = Math.abs(parseFloat(r.y.text.replace(/\u00d7 10\^/, 'e').replace(/ /g, '')) - Number(y.q.n) / Number(y.q.d)) < 1e-12;
    o.cls = 'check'; o.status = r.status; o.holds = holds; o.clsText = holds ? 'The equation holds' : 'The equation does not hold';
    o.label = holds ? 'Consistent' : 'Not consistent'; o.valueText = holds ? 'true' : 'false'; o.headline = eqText(r.b, r.x, ys) + (holds ? ' is true' : ' is false');
    o.eq = holds ? eqText(r.b, r.x, ys) : r.equation; o.expEq = holds ? powText(r.b, ys) + ' = ' + r.x : ''; o.exact = null; o.sci = null;
    o.steps = ['You gave all three values, so the solver checks whether log_b(x) = y holds, that is whether b^y = x.',
      'The actual logarithm is ' + r.equation + (r.status === 'rational' ? ' (exact).' : r.status === 'irrational' ? ', an irrational number, so it cannot equal the rational y you gave.' : ' (exactness not decided).'),
      holds ? 'It equals y = ' + ys + ', so the three values are consistent.' : 'It is not equal to y = ' + ys + (r.status === 'undetermined' ? ' to the precision checked.' : '.') + ' Leave one of the three fields blank to solve for it.'];
    o.verify = r.verify; o.verifyOk = r.verifyOk;
    o.rows = [['Actual log_b(x)', r.yText], ['The y you gave', ys], ['Common logarithm, log\u2081\u2080 x', r.common.text], ['Natural logarithm, ln x', r.natural.text]];
    return o;
  }
  function summary(r) {
    var g = r.given, lines = ['Log Calculator, Missing Value Solver (Mode 03): log_b(x) = y means b^y = x'];
    lines.push('Known: ' + ['b', 'x', 'y'].filter(function (k) { return g[k] !== null; }).map(function (k) { return k + ' = ' + g[k]; }).join(', '));
    lines.push(r.headline); if (r.eq) lines.push(r.eq);
    lines.push('Classification: ' + r.clsText); if (r.label && r.label !== r.valueText) lines.push(r.label);
    if (r.sci) lines.push('Scientific notation: ' + r.sci);
    if (r.radical) lines.push('Radical form: ' + r.radical);
    if (r.expEq) lines.push('Equivalent exponential equation: ' + r.expEq);
    if (r.note) lines.push(r.note);
    return lines.join('\n');
  }

  var api = { run: run, solveBase: solveBase, show: show };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.LogSolver = api;
})(typeof window !== 'undefined' ? window : globalThis);
