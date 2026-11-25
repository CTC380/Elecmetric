/* Elecmetric Quadratic Formula Calculator: engine for Mode 05 (Engineering Quadratic Solver).
   Series RLC, parallel RLC, a general second-order (control) equation, a mass-spring-damper and the standard form from natural frequency and damping ratio.
   Every input is read as an exact rational number (SI prefixes allowed), the characteristic equation a*s^2 + b*s + c = 0 is solved and classified with the exact Mode 01 engine
   (so critical damping is decided exactly, with no tolerance), and the engineering quantities are then evaluated in double precision from the exact discriminant.
   Works in Node (module.exports) and in the browser (global QuadEng, after Quad). */
(function (root) {
  'use strict';
  var Q = typeof require === 'function' && typeof module !== 'undefined' ? require('./quad_engine.js') : root.Quad;
  var O = Q.ops, R = Q.R, rs = Q.rs, mn = Q.mn;
  var PREFIX = { p: -12, n: -9, u: -6, '\u00b5': -6, '\u03bc': -6, m: -3, k: 3, K: 3, M: 6, G: 9 };

  /* The five kinds of system. Each field has a label, a unit (whose symbol may be typed after the value) and a rule: pos (> 0), nonneg (>= 0) or any. */
  var TYPES = {
    series: { name: 'Series RLC circuit', eq: 'L\u00b7s\u00b2 + R\u00b7s + 1/C = 0', fields: [['R', 'Resistance R', '\u03a9', 'nonneg', ['ohms', 'ohm', '\u03a9']], ['L', 'Inductance L', 'H', 'pos', ['H']], ['C', 'Capacitance C', 'F', 'pos', ['F']]], coef: function (p) { return [p[1], p[0], O.div(O.ri(1), p[2])]; } },
    parallel: { name: 'Parallel RLC circuit', eq: 'C\u00b7s\u00b2 + s/R + 1/L = 0', fields: [['R', 'Resistance R', '\u03a9', 'pos', ['ohms', 'ohm', '\u03a9']], ['L', 'Inductance L', 'H', 'pos', ['H']], ['C', 'Capacitance C', 'F', 'pos', ['F']]], coef: function (p) { return [p[2], O.div(O.ri(1), p[0]), O.div(O.ri(1), p[1])]; } },
    control: { name: 'Second-order system (control)', eq: 'a\u00b7s\u00b2 + b\u00b7s + c = 0', fields: [['a', 'a (coefficient of s\u00b2)', '', 'any', []], ['b', 'b (coefficient of s)', '', 'any', []], ['c', 'c (constant)', '', 'any', []]], coef: function (p) { return [p[0], p[1], p[2]]; }, plain: true },
    mech: { name: 'Mass-spring-damper', eq: 'm\u00b7s\u00b2 + c\u00b7s + k = 0', fields: [['m', 'Mass m', 'kg', 'pos', ['kg']], ['c', 'Damping c', 'N\u00b7s/m', 'nonneg', []], ['k', 'Stiffness k', 'N/m', 'pos', []]], coef: function (p) { return [p[0], p[1], p[2]]; } },
    zeta: { name: 'Natural frequency and damping ratio', eq: 's\u00b2 + 2\u03b6\u03c9\u2099\u00b7s + \u03c9\u2099\u00b2 = 0', fields: [['wn', 'Natural frequency \u03c9\u2099', 'rad/s', 'pos', ['rad/s']], ['z', 'Damping ratio \u03b6', '', 'nonneg', []], ['u', '(not used)', '', 'any', []]], coef: function (p) { return [O.ri(1), O.mul(O.ri(2), O.mul(p[1], p[0])), O.mul(p[0], p[0])]; }, nf: 2 }
  };

  /* ---------- reading a value: exact rational with an optional SI prefix and unit ---------- */
  function readValue(text, field, plain) {
    var s = String(text === undefined || text === null ? '' : text).trim();
    if (s === '') return { empty: true, error: 'Enter a value.' };
    if (!plain) {
      var units = (field[4] || []).concat([]).sort(function (a, b) { return b.length - a.length; });
      for (var i = 0; i < units.length; i++) { var u = units[i]; if (s.length > u.length && s.slice(-u.length) === u) { s = s.slice(0, -u.length).trim(); break; } }
      var last = s.slice(-1), p = PREFIX[last];
      if (p !== undefined && s.length > 1 && /[0-9.\s/]$/.test(s.slice(0, -1))) {
        var base = Q.parseNum(s.slice(0, -1)); if (base.error) return base;
        var f = p >= 0 ? R(10n ** BigInt(p), 1n) : R(1n, 10n ** BigInt(-p));
        return { v: O.mul(base.v, f) };
      }
    }
    return Q.parseNum(s);
  }

  /* ---------- exact rational -> double, for any size that fits a double ---------- */
  function num(q) {
    var neg = q.n < 0n, n = neg ? -q.n : q.n, d = q.d;
    if (n === 0n) return 0;
    var ns = n.toString(), ds = d.toString(), kn = Math.min(20, ns.length), kd = Math.min(20, ds.length);
    var m = Number(ns.slice(0, kn)) / Number(ds.slice(0, kd)), e = (ns.length - kn) - (ds.length - kd);
    var v = m * Math.pow(10, e);
    return neg ? -v : v;
  }

  /* ---------- number formatting ---------- */
  function sig(x, n) {
    n = n || 6;
    if (x === 0 || !isFinite(x)) return x === 0 ? '0' : String(x);
    var ax = Math.abs(x);
    if (ax >= 1e-4 && ax < 1e7) { var t = Number(x.toPrecision(n)); return String(t); }
    var e = Math.floor(Math.log10(ax)), m = x / Math.pow(10, e), ms = Number(m.toPrecision(n));
    if (Math.abs(ms) >= 10) { ms = ms / 10; e += 1; }
    var sup = String(e).replace('-', '\u207b').replace(/\d/g, function (d) { return '\u2070\u00b9\u00b2\u00b3\u2074\u2075\u2076\u2077\u2078\u2079'[+d]; });
    return String(ms) + '\u00d710' + sup;
  }
  var SI = [[24, 'Y'], [21, 'Z'], [18, 'E'], [15, 'P'], [12, 'T'], [9, 'G'], [6, 'M'], [3, 'k'], [0, ''], [-3, 'm'], [-6, '\u00b5'], [-9, 'n'], [-12, 'p'], [-15, 'f'], [-18, 'a']];
  function si(x, unit, n) {
    n = n || 6; unit = unit || '';
    if (x === 0) return '0 ' + unit;
    if (!isFinite(x)) return String(x);
    var ax = Math.abs(x), e = Math.floor(Math.log10(ax)), k = 0;
    for (var i = 0; i < SI.length; i++) if (e >= SI[i][0]) { k = i; break; }
    if (e < -18) k = SI.length - 1;
    var sc = SI[k][0], m = x / Math.pow(10, sc), ms = Number(m.toPrecision(n));
    if (Math.abs(ms) >= 1000 && k > 0) { k -= 1; sc = SI[k][0]; ms = Number((x / Math.pow(10, sc)).toPrecision(n)); }
    return String(ms) + ' ' + SI[k][1] + unit;
  }

  /* ---------- the engineering analysis ---------- */
  function analyse(input) {
    input = input || {};
    var T = TYPES[input.type];
    if (!T) return { ok: false, error: 'Choose a system type.', errors: {} };
    var dp = input.dp === undefined ? 8 : Math.max(2, Math.min(15, input.dp | 0));
    var vals = [input.p1, input.p2, input.p3], errs = {}, P = [], allEmpty = true, nf = T.nf || 3;
    for (var i = 0; i < nf; i++) {
      var f = T.fields[i], r = readValue(vals[i], f, T.plain);
      if (!r.empty) allEmpty = false;
      if (r.error) { errs['p' + (i + 1)] = r.empty ? 'Enter ' + f[1].split(' ')[0] + '.' : r.error; P.push(null); continue; }
      var sg = O.sgn(r.v);
      if (f[3] === 'pos' && sg <= 0) errs['p' + (i + 1)] = f[1] + ' must be greater than zero.';
      else if (f[3] === 'nonneg' && sg < 0) errs['p' + (i + 1)] = f[1] + ' cannot be negative.';
      P.push(r.v);
    }
    var x0 = Q.parseNum(input.x0 === undefined || String(input.x0).trim() === '' ? '1' : input.x0), v0 = Q.parseNum(input.v0 === undefined || String(input.v0).trim() === '' ? '0' : input.v0);
    if (x0.error) errs.x0 = x0.error; if (v0.error) errs.v0 = v0.error;
    var ek = Object.keys(errs);
    if (ek.length) return { ok: false, empty: allEmpty, errors: errs, error: errs[ek[0]] };

    var co = T.coef(P), A = co[0], B = co[1], C = co[2], steps = [], checks = [];
    var qs = Q.solve({ a: rs(A), b: rs(B), c: rs(C), dp: dp });
    if (!qs.ok) return { ok: false, errors: {}, error: 'Could not form the characteristic equation.' };
    if (qs.degree !== 2) return { ok: false, errors: {}, error: 'The s\u00b2 coefficient is zero, so this is not a second-order system.' };
    var a = num(A), b = num(B), c = num(C), D = qs.D, Df = num(D);
    var sa = O.sgn(A), ba = O.div(B, A), ca = O.div(C, A), sba = O.sgn(ba), sca = O.sgn(ca), sD = O.sgn(D);
    var big = [a, b, c, num(ba), num(ca), Df].some(function (v) { return !isFinite(v) || (v !== 0 && (Math.abs(v) > 1e150 || Math.abs(v) < 1e-150)); });
    if (big) return { ok: false, errors: {}, error: 'These values are too large or too small to analyse. Use values between about 1e-30 and 1e30.' };

    var res = { ok: true, type: input.type, typeName: T.name, dp: dp, A: A, B: B, C: C, a: rs(A), b: rs(B), c: rs(C), quad: qs, steps: steps, checks: checks };
    res.characteristic = mn(Q.equationText(A, B, C).replace(/x/g, 's'));
    res.inputs = T.fields.slice(0, nf).map(function (f, i) { return { label: f[1], unit: f[2], value: rs(P[i]) }; });

    /* exact classification */
    var stable = sba > 0 && sca > 0, marginal = !stable && sba >= 0 && sca >= 0;
    var key, label;
    if (sD > 0) { key = stable ? 'over' : marginal ? 'marginal' : 'unstable'; label = stable ? 'Overdamped' : marginal ? 'Marginally stable' : 'Unstable'; }
    else if (sD === 0) { key = stable ? 'critical' : marginal ? 'marginal' : 'unstable'; label = stable ? 'Critically damped' : marginal ? 'Marginally stable' : 'Unstable'; }
    else { key = sba > 0 ? 'under' : sba === 0 ? 'undamped' : 'unstable-osc'; label = sba > 0 ? 'Underdamped' : sba === 0 ? 'Undamped' : 'Unstable'; }
    res.key = key; res.label = label; res.stable = stable; res.marginal = marginal;
    res.stability = stable ? 'Stable: every root has a negative real part, so the natural response dies away.' : marginal ? 'Marginally stable: a root lies on the imaginary axis (or at zero) and none is to the right of it, so the natural response does not die away.' : 'Unstable: a root has a positive real part, so the natural response grows without limit.';
    res.detail = { over: 'Two distinct negative real roots. The response decays without oscillating.', critical: 'One repeated negative real root. The response decays as fast as it can without oscillating.', under: 'A complex pair with negative real part. The response oscillates inside a decaying envelope.', undamped: 'A pure imaginary pair. The response oscillates for ever at constant amplitude.', marginal: 'A root at the origin or a repeated root at the origin: the response settles to a constant or grows linearly.', unstable: 'A real root with positive real part: the response grows exponentially without oscillating.', 'unstable-osc': 'A complex pair with positive real part: the response oscillates with growing amplitude.' }[key];
    steps.push('Characteristic equation (' + T.eq + '): ' + res.characteristic + '. Coefficients a = ' + rs(A) + ', b = ' + rs(B) + ', c = ' + rs(C) + '.');
    steps.push('Divide by a: s\u00b2 + (b/a)s + c/a = 0, with b/a = ' + mn(rs(ba)) + ' and c/a = ' + mn(rs(ca)) + '.');
    steps.push('Discriminant \u0394 = b\u00b2 \u2212 4ac = ' + mn(rs(D)) + ' (exact). ' + (sD > 0 ? '\u0394 > 0: two distinct real roots.' : sD === 0 ? '\u0394 = 0: one repeated real root.' : '\u0394 < 0: a complex conjugate pair.'));
    steps.push('Classification: ' + label + '. ' + res.detail);

    /* roots in double precision, from the exact discriminant (no cancellation) */
    var alpha = num(ba) / 2, w02 = num(ca), sq = Math.sqrt(Math.abs(Df)) / (2 * Math.abs(a)), s1, s2, re1, re2, im1 = 0, im2 = 0, rootsF = [];
    if (sD < 0) { re1 = re2 = -alpha; im1 = sq; im2 = -sq; }
    else if (sD === 0) { re1 = re2 = -alpha; }
    else { var sd = Math.sqrt(Df), qq = -(b + (b < 0 ? -sd : sd)) / 2; var r1 = b === 0 ? -sd / (2 * a) : qq / a, r2 = b === 0 ? sd / (2 * a) : c / qq; re1 = Math.min(r1, r2); re2 = Math.max(r1, r2); }
    res.rootsF = [{ re: re1, im: im1 }, { re: re2, im: im2 }];
    res.roots = qs.roots.map(function (r, i) {
      var rr = res.rootsF[i];
      return { exact: r.exact, dec: r.dec.text, re: rr.re, im: rr.im, real: r.real, tau: rr.re !== 0 ? 1 / Math.abs(rr.re) : Infinity, reText: sig(rr.re, 6), imText: sig(rr.im, 6) };
    });

    /* standard parameters */
    var p = { alpha: alpha, w02: w02 };
    p.zero = sca === 0;
    if (sca > 0) {
      p.omega0 = Math.sqrt(w02); p.f0 = p.omega0 / (2 * Math.PI); p.zeta = alpha / p.omega0;
      p.Q = alpha > 0 ? p.omega0 / (2 * alpha) : null; p.bw = alpha > 0 ? 2 * alpha : null; p.bwHz = p.bw === null ? null : p.bw / (2 * Math.PI);
      if (sD < 0) { p.omegad = sq; p.fd = sq / (2 * Math.PI); p.period = 2 * Math.PI / sq; }
    }
    if (alpha > 0) { var slow = Math.min.apply(null, res.rootsF.map(function (r) { return Math.abs(r.re); }).filter(function (v) { return v > 0; })); if (isFinite(slow) && slow > 0) { p.tauDom = 1 / slow; p.ts = 4 / slow; } }
    if (stable && sD < 0) { p.overshoot = 100 * Math.exp(-Math.PI * p.zeta / Math.sqrt(1 - p.zeta * p.zeta)); p.peakTime = Math.PI / p.omegad; }
    if (stable && sD < 0) { p.f1 = p.f0 * (Math.sqrt(1 + 1 / (4 * p.Q * p.Q)) - 1 / (2 * p.Q)); p.f2 = p.f0 * (Math.sqrt(1 + 1 / (4 * p.Q * p.Q)) + 1 / (2 * p.Q)); }
    if (input.type === 'series') { var Lf = num(P[1]), Cf = num(P[2]); p.Rcrit = 2 * Math.sqrt(Lf / Cf); p.RcritNote = 'R = 2\u221a(L/C)'; }
    if (input.type === 'parallel') { var Lp = num(P[1]), Cp = num(P[2]); p.Rcrit = 0.5 * Math.sqrt(Lp / Cp); p.RcritNote = 'R = \u00bd\u221a(L/C)'; }
    if (input.type === 'mech') { p.ccrit = 2 * Math.sqrt(num(P[0]) * num(P[2])); p.RcritNote = 'c = 2\u221a(km)'; }
    res.p = p;
    /* exact test of zeta against 1: zeta^2 = b^2/(4ac), compared with 1 as rationals (same answer as the discriminant, reached another way) */
    if (sca > 0) { var z2 = O.div(O.mul(B, B), O.mul(O.ri(4), O.mul(A, C))); res.zeta2 = rs(z2); res.zetaVs1 = O.sgn(O.sub(z2, O.ri(1))); }

    /* natural response with initial value x(0) = x0 and slope x'(0) = v0 */
    var X0 = num(x0.v), V0 = num(v0.v), resp = { x0: X0, v0: V0 }, fn;
    /* Every case is evaluated as u(t)*g(t) with u = exp(sigma*t); this is exact algebra with no cancellation, even when the two real roots nearly coincide. */
    function uge(sg, g, g1, g2) { return function (t) { var u = Math.exp(sg * t), G = g(t), G1 = g1(t), G2 = g2(t); return [u * G, u * (sg * G + G1), u * (sg * sg * G + 2 * sg * G1 + G2)]; }; }
    if (sD > 0) {
      var q1 = res.rootsF[0].re, q2 = res.rootsF[1].re, cA = (V0 - q2 * X0) / (q1 - q2), cB = (q1 * X0 - V0) / (q1 - q2), kap = (q2 - q1) / 2, kk = V0 - (-alpha) * X0;
      resp.kind = 'real'; resp.cA = cA; resp.cB = cB; resp.s1 = q1; resp.s2 = q2; resp.kappa = kap;
      var hyp = uge(-alpha, function (t) { return X0 * Math.cosh(kap * t) + kk * Math.sinh(kap * t) / kap; }, function (t) { return X0 * kap * Math.sinh(kap * t) + kk * Math.cosh(kap * t); }, function (t) { return kap * kap * (X0 * Math.cosh(kap * t) + kk * Math.sinh(kap * t) / kap); });
      /* near the repeated root use the cosh/sinh form (no cancellation); once the roots have separated use the two exponentials (no overflow of cosh against underflow of exp) */
      fn = function (t) { if (kap * t <= 1) return hyp(t); var e1 = Math.exp(q1 * t), e2 = Math.exp(q2 * t); return [cA * e1 + cB * e2, cA * q1 * e1 + cB * q2 * e2, cA * q1 * q1 * e1 + cB * q2 * q2 * e2]; };
      resp.text = kap < 1e-4 * Math.abs(alpha) ? 'x(t) = e^(' + sig(-alpha, 6) + '\u00b7t)\u00b7[' + sig(X0, 6) + '\u00b7cosh(' + sig(kap, 6) + '\u00b7t) + ' + sig(kk / kap, 6) + '\u00b7sinh(' + sig(kap, 6) + '\u00b7t)]' : 'x(t) = ' + sig(cA, 6) + '\u00b7e^(' + sig(q1, 6) + '\u00b7t) + ' + sig(cB, 6) + '\u00b7e^(' + sig(q2, 6) + '\u00b7t)';
    } else if (sD === 0) {
      var sr = -alpha, cB2 = V0 - sr * X0;
      resp.kind = 'repeated'; resp.cA = X0; resp.cB = cB2; resp.s1 = sr;
      fn = uge(sr, function (t) { return X0 + cB2 * t; }, function () { return cB2; }, function () { return 0; });
      resp.text = 'x(t) = (' + sig(X0, 6) + ' + ' + sig(cB2, 6) + '\u00b7t)\u00b7e^(' + sig(sr, 6) + '\u00b7t)';
    } else {
      var sg2 = -alpha, wd = sq, cS = (V0 - sg2 * X0) / wd;
      resp.kind = 'complex'; resp.cA = X0; resp.cB = cS; resp.sigma = sg2; resp.wd = wd;
      fn = uge(sg2, function (t) { return X0 * Math.cos(wd * t) + cS * Math.sin(wd * t); }, function (t) { return wd * (-X0 * Math.sin(wd * t) + cS * Math.cos(wd * t)); }, function (t) { return -wd * wd * (X0 * Math.cos(wd * t) + cS * Math.sin(wd * t)); });
      resp.amp = Math.sqrt(X0 * X0 + cS * cS); resp.phase = Math.atan2(-cS, X0);
      resp.text = 'x(t) = e^(' + sig(sg2, 6) + '\u00b7t)\u00b7[' + sig(X0, 6) + '\u00b7cos(' + sig(wd, 6) + '\u00b7t) + ' + sig(cS, 6) + '\u00b7sin(' + sig(wd, 6) + '\u00b7t)]';
    }
    resp.at = function (t) { return fn(t)[0]; }; resp.slopeAt = function (t) { return fn(t)[1]; };
    res.response = resp;
    res.text = mn(resp.text);

    /* the time axis for the picture: long enough to see the decay, or five oscillations */
    var span;
    if (stable) span = p.ts ? 1.25 * p.ts : 6 / Math.max.apply(null, res.rootsF.map(function (r) { return Math.abs(r.re); }));
    else { var big2 = Math.max.apply(null, res.rootsF.map(function (r) { return Math.abs(r.re) + Math.abs(r.im); })); span = 5 / big2; }
    if (sD < 0 && p.omegad) span = Math.max(span, 3 * 2 * Math.PI / p.omegad);
    if (stable && sD < 0) span = Math.min(span, 40 * 2 * Math.PI / p.omegad);
    if (!isFinite(span) || span <= 0) span = 1;
    res.span = span;

    /* checks */
    function chk(label, ok) { checks.push({ label: label, ok: !!ok }); }
    chk('Both roots satisfy a\u00b7s\u00b2 + b\u00b7s + c = 0 exactly (Mode 01 exact substitution)', qs.verifyOk);
    var Sx = qs.sum, Px = qs.product;
    chk('Sum of the roots is \u2212b/a = ' + mn(rs(Sx)) + ' and the product is c/a = ' + mn(rs(Px)) + ' (exact)', O.eq(Sx, O.neg(ba)) && O.eq(Px, ca));
    if (res.zetaVs1 !== undefined) chk('\u03b6\u00b2 = b\u00b2/(4ac) = ' + mn(res.zeta2) + ' is ' + (res.zetaVs1 < 0 ? 'below' : res.zetaVs1 === 0 ? 'equal to' : 'above') + ' 1, and agrees with the sign of \u0394', (res.zetaVs1 < 0 && sD < 0) || (res.zetaVs1 === 0 && sD === 0) || (res.zetaVs1 > 0 && sD > 0));
    var scale = Math.max(Math.abs(re1), Math.abs(re2), Math.abs(im1), 1e-300);
    var vieta = Math.abs(re1 + re2 + num(ba)) <= 1e-9 * scale && Math.abs(re1 * re2 - im1 * im2 - num(ca)) <= 1e-9 * Math.max(Math.abs(num(ca)), scale * scale);
    chk('The decimal roots add to \u2212b/a and multiply to c/a (to 9 digits)', vieta);
    if (sD < 0 && p.omegad) chk('\u03b1\u00b2 + \u03c9d\u00b2 = \u03c90\u00b2 (to 9 digits)', Math.abs(alpha * alpha + p.omegad * p.omegad - w02) <= 1e-9 * w02);
    var t0 = fn(0), ok0 = Math.abs(t0[0] - X0) <= 1e-9 * Math.max(Math.abs(X0), 1e-300) + 1e-300 && Math.abs(t0[1] - V0) <= 1e-9 * Math.max(Math.abs(V0), Math.abs(X0) * scale, 1e-300);
    chk('The response starts at x(0) = ' + sig(X0, 6) + ' with slope x\u2032(0) = ' + sig(V0, 6), ok0);
    var worstAbs = 0, Mx = 1e-300, N = 7, worst, rho = Math.max(Math.abs(re1), Math.abs(re2), Math.abs(im1), 1 / res.span);
    for (var k = 1; k <= N; k++) {
      var t = res.span * k / N / 4, xs = fn(t);
      worstAbs = Math.max(worstAbs, Math.abs(a * xs[2] + b * xs[1] + c * xs[0]));
      Mx = Math.max(Mx, Math.abs(xs[0]), Math.abs(xs[1]) / rho, Math.abs(xs[2]) / (rho * rho));
    }
    var scMax = (Math.abs(a) * rho * rho + Math.abs(b) * rho + Math.abs(c)) * Mx;
    worst = worstAbs / scMax;
    chk('The response satisfies the differential equation a\u00b7x\u2033 + b\u00b7x\u2032 + c\u00b7x = 0 at ' + N + ' times (relative residual below 1e-9)', worst < 1e-9);
    res.checkOk = checks.every(function (c2) { return c2.ok; });
    res.residual = worst;

    /* plain-text report */
    var L = [T.name, 'Characteristic equation: ' + res.characteristic, 'Result: ' + label + ' (' + res.stability.split(':')[0].toLowerCase() + ')', 'Discriminant: ' + mn(rs(D)),
      'Roots: ' + res.roots.map(function (r, i) { return 's' + (i + 1) + ' = ' + mn(r.exact) + ' = ' + mn(r.dec); }).join(';  ')];
    if (p.omega0 !== undefined) { L.push('Natural frequency: \u03c90 = ' + si(p.omega0, 'rad/s') + ', f0 = ' + si(p.f0, 'Hz')); L.push('Damping ratio: \u03b6 = ' + sig(p.zeta, 6) + (p.Q ? ', quality factor Q = ' + sig(p.Q, 6) : '')); }
    if (p.omegad !== undefined) L.push('Damped frequency: \u03c9d = ' + si(p.omegad, 'rad/s') + ', fd = ' + si(p.fd, 'Hz'));
    if (p.tauDom !== undefined) L.push('Slowest decay time constant: ' + si(p.tauDom, 's') + ', settling (2%) about ' + si(p.ts, 's'));
    L.push(mn(resp.text)); res.summary = L.join('\n');
    return res;
  }

  /* Samples of the response for the picture: [t, x] pairs. */
  function curve(res, n) { n = n || 400; var out = []; for (var i = 0; i <= n; i++) { var t = res.span * i / n; out.push([t, res.response.at(t)]); } return out; }
  /* Envelope +/- amplitude of an underdamped response, for the picture. */
  function envelope(res) { var r = res.response; if (r.kind !== 'complex') return null; return function (t) { return r.amp * Math.exp(r.sigma * t); }; }

  var api = { TYPES: TYPES, analyse: analyse, readValue: readValue, curve: curve, envelope: envelope, num: num, sig: sig, si: si };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.QuadEng = api;
})(typeof window !== 'undefined' ? window : this);
