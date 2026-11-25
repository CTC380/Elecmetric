/* Elecmetric Exponent Calculator, Mode 03: Missing Value Solver (a^n = y). Engine: one file, no DOM.
   Required by tests/exponent_solver_test.js and inlined (after tools/exponent_engine.js and tools/exponent_frac_engine.js) into
   calculators/exponent-solver/index.html by tools/exponent_solver_page.js.

   The user knows two of the three values and the engine finds the third:
     result   y = a^n          (the value comes from the Mode 02 engine, so Modes 01, 02 and 03 can never disagree)
     exponent n = ln y / ln a  (logarithm, with domain checks; an exact whole number or fraction is found and proved by whole-number arithmetic when there is one)
     base     a = y^(1/n)      (root, with the sign analysis that decides how many real bases there are)
   Every answer is classified, as the CEO brief asks:
     unique        exactly one real solution
     multiple      more than one real solution (a^2 = 9 has a = 3 and a = -3)
     none          no real solution (2^n = -8, a^2 = -4, a negative base to a power that is not real)
     indeterminate every value works (1^n = 1, a^0 = 1) or the expression is undefined (0^0)
   A negative base is judged as in Modes 01 and 02: a real power of a negative number needs a whole-number exponent or a reduced fraction p/q with q odd,
   and the sign of the result is (-1)^p. Complex solutions are not part of this mode.
   Nothing is rounded internally; rounding happens once, when a number is displayed. Errors are returned, never thrown. */
(function (root) {
  'use strict';
  var X = (typeof module !== 'undefined' && module.exports) ? require('./exponent_engine.js') : root.ExponentCalc;
  var F = (typeof module !== 'undefined' && module.exports) ? require('./exponent_frac_engine.js') : root.ExponentFrac;
  var MAXQ = 1000, MAXP = 4000, MAX_CHECK_DIGITS = 150000, MINUS = '\u2212';

  /* ---------- BigInt and rational helpers ---------- */
  function babs(x) { return x < 0n ? -x : x; }
  function gcd(a, b) { a = babs(a); b = babs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function sgn(x) { return x > 0n ? 1 : x < 0n ? -1 : 0; }
  function rat(n, d) { if (d < 0n) { n = -n; d = -d; } var g = gcd(n, d); if (g > 1n) { n /= g; d /= g; } return { n: n, d: d }; }
  function digits(x) { return babs(x).toString().length; }
  function neg(s) { return s.replace(/^-/, MINUS); }
  function powR(r, k) { /* r^k for a whole-number k (BigInt), exact */
    var m = babs(k), n = r.n ** m, d = r.d ** m;
    return k < 0n ? rat(d, n) : { n: n, d: d };
  }
  function bigln(x) { var s = x.toString(); return s.length <= 300 ? Math.log(Number(s)) : Math.log(Number(s.slice(0, 17))) + (s.length - 17) * Math.LN10; }
  function lnRat(r) { /* ln of a positive rational, careful when it is close to 1 */
    var diff = r.n - r.d, ratio = Number(diff * 10n ** 30n / r.d) / 1e30;
    if (Math.abs(ratio) < 0.5) return Math.log1p(ratio);
    return bigln(r.n) - bigln(r.d);
  }
  function ratText(r) { return r.d === 1n ? r.n.toString() : r.n + '/' + r.d; }
  function disp(r) { return neg(ratText(r)); }
  function trimZeros(s) { return s.indexOf('.') >= 0 ? s.replace(/0+$/, '').replace(/\.$/, '') : s; }
  function fmt(x, sig) {
    var sg = sig === 'full' ? 15 : (parseInt(sig, 10) || 6), ax = Math.abs(x);
    if (x === 0) return '0';
    if (ax >= 1e15 || ax < 1e-6) {
      var parts = x.toExponential(sg - 1).split('e'), ex = parseInt(parts[1], 10);
      return neg(trimZeros(parts[0])) + ' \u00d7 10' + X.sup(ex);
    }
    var s = x.toPrecision(sg);
    if (s.indexOf('e') >= 0) s = String(Number(s));
    return neg(trimZeros(s));
  }
  function fmtGroup(s) { var m = /^(\u2212?)(\d+)(\.\d+)?$/.exec(s); return m ? m[1] + X.groupInt(m[2]) + (m[3] || '') : s; }

  /* exact test of a^(p/q) = y for rationals, p and q whole numbers, q > 0: a^p = y^q (needs a > 0 and y > 0 when q is even) */
  function exactPow(a, p, q, y) {
    if (q % 2n === 0n && (a.n <= 0n || y.n <= 0n)) return false;
    if (a.n === 0n) return false;
    if ((digits(a.n) + digits(a.d)) * Number(babs(p)) + (digits(y.n) + digits(y.d)) * Number(q) > MAX_CHECK_DIGITS) return null;
    var l = powR(a, p), r = powR(y, q);
    return l.n === r.n && l.d === r.d;
  }

  /* the rational p/q (q up to MAXQ) that equals x, proved by exactPow; null when there is none */
  function findRational(a, y, x) {
    if (!isFinite(x)) return null;
    var h1 = 1, h0 = 0, k1 = 0, k0 = 1, v = Math.abs(x), i, aI, hN, kN, sign = x < 0 ? -1 : 1;
    for (i = 0; i < 40; i++) {
      aI = Math.floor(v); hN = aI * h1 + h0; kN = aI * k1 + k0;
      if (kN > MAXQ || hN > MAXP) break;
      h0 = h1; h1 = hN; k0 = k1; k1 = kN;
      if (k1 > 0 && Math.abs(Math.abs(x) - h1 / k1) <= 1e-9 * Math.max(1, Math.abs(x))) {
        var p = BigInt(sign * h1), q = BigInt(k1), ok = exactPow(a, p, q, y);
        if (ok) return { p: p, q: q };
      }
      if (v - aI < 1e-12) break;
      v = 1 / (v - aI);
    }
    return null;
  }

  /* ---------- reading the inputs ---------- */
  var FIELDS = { y: 'Result (y)', n: 'Exponent (n)', a: 'Base (a)' };
  function pickLabel(op, allowNeg) { return op.text; }
  function paren(text) { return /^-|\u2212|\/|\./.test(text) ? '(' + text.replace(/^-/, MINUS) + ')' : text; }
  function expr(aT, nT, yT) { return paren(aT) + '^' + (nT === 'n' ? 'n' : /^-|\u2212|\/|\./.test(nT) ? '(' + nT.replace(/^-/, MINUS) + ')' : nT) + ' = ' + yT; }

  function base(solve, sig, a, n, y) {
    var aT = solve === 'a' ? 'a' : a.text, nT = solve === 'n' ? 'n' : n.text, yT = solve === 'y' ? 'y' : y.text;
    var A = solve === 'a' ? 'a' : paren(aT), N = solve === 'n' ? 'n' : (/^-|\u2212|\/|\./.test(nT) ? '(' + nT.replace(/^-/, MINUS) + ')' : nT);
    return { ok: true, mode: 3, solve: solve, sig: sig, a: a, n: n, y: y, equation: A + '^' + N + ' = ' + (solve === 'y' ? '?' : yT.replace(/^-/, MINUS)), cls: 'none', message: '', solutions: [], steps: [], warnings: [], check: null };
  }
  function lines() { return Array.prototype.slice.call(arguments).join('\n'); }
  function sciOf(sol) { return sol && sol.sciCoef !== undefined ? Number(sol.sciCoef + 'e' + sol.sciExp) : NaN; }
  function log10Of(sol) { return Math.log10(Math.abs(Number(sol.sciCoef))) + sol.sciExp; }

  /* a solution made from a Mode 02 run: exact text (radical, fraction or whole number), decimal and scientific notation.
     The sign comes from the run (a negative result) or from negate (the second real base). */
  function solFromRun(r, negate, name) {
    var s = r.sol, ng = !!negate || r.rawSign < 0, sg = ng ? MINUS : '', exactText = null, dec, v = r.mode1 && r.mode1.value, l10;
    if (r.exact) exactText = s.isInteger ? (s.integerString ? s.integerString : s.sciText) : s.fraction;
    else if (r.radical && !r.radical.exactRoot) exactText = r.radical.text;
    dec = String(s.standard ? s.standard : s.sciText).replace(/^[-\u2212]/, '');
    var sci = String(s.sciText).replace(/^[-\u2212]/, '');
    l10 = typeof v === 'number' && isFinite(v) && v !== 0 ? Math.log10(Math.abs(v)) : log10Of(s);
    return { v: name, text: exactText ? sg + exactText : '\u2248 ' + sg + dec, exact: !!r.exact, exactText: exactText ? sg + exactText : null, decimal: sg + dec, decimalApprox: !s.decimalIsExact, approx: !r.exact, sci: sg + sci, sign: s.sign === 0 ? 0 : ng ? -1 : 1, log10: l10, ratN: r.exact ? r.exactN : null, ratD: r.exact ? r.exactD : null };
  }

  /* ---------- solve for the result y ---------- */
  function solveY(o, a, n, sig) {
    var r = base('y', sig, a, n, { text: '' }), f = F.run({ a: a.text, n: n.text, sig: sig });
    if (!f.ok) {
      r.cls = f.code === 'ZERO_TO_ZERO' ? 'indeterminate' : 'none'; r.message = f.error; r.code = f.code;
      r.steps = [{ title: 'The problem', text: 'a = ' + a.text.replace(/^-/, MINUS) + '\nn = ' + n.text.replace(/^-/, MINUS) + '\ny = a^n' }, { title: r.cls === 'indeterminate' ? 'Indeterminate' : 'No real value', text: f.error }];
      return r;
    }
    var s = solFromRun(f, false, 'y');
    r.cls = 'unique'; r.solutions = [s]; r.message = 'Exactly one real value: a to the power n is defined and single-valued here.';
    r.equation = (f.exprText || '').replace(/^-/, MINUS) + ' = ?'; r.run = f;
    r.steps = f.steps; r.check = f.check; r.warnings = f.warnings || []; r.radicalNote = f.radicalNote || null;
    r.value = f.value;
    r.y = { text: F.valueText(f) }; r.valueLine = F.headline(f);
    return r;
  }

  /* ---------- solve for the exponent n ---------- */
  function solveN(o, a, y, sig) {
    var r = base('n', sig, a, { text: '' }, y), problem = 'a = ' + a.text.replace(/^-/, MINUS) + '\ny = ' + y.text.replace(/^-/, MINUS) + '\nSolve a^n = y for n';
    r.steps = [{ title: 'The problem', text: problem }];
    function stop(cls, title, msg) { r.cls = cls; r.message = msg; r.steps.push({ title: title, text: msg }); return r; }
    var isE = a.kind === 'e', A = isE ? { n: 1n, d: 1n } : rat(a.n, a.d), Y = rat(y.n, y.d), aPos = isE ? a.sign > 0 : A.n > 0n;
    if (isE && a.sign < 0) { A = { n: -1n, d: 1n }; isE = false; aPos = false; r.warnings.push({ message: 'The base is read as the number \u2212e (about \u22122.71828). It is treated as an ordinary negative base.' }); isE = false; return stop('none', 'Not supported', 'A base of \u2212e is not supported: a negative base needs an exact value to decide whether a real power exists. Use a rational base.'); }
    var aZero = !isE && A.n === 0n, aOne = !isE && A.n === 1n && A.d === 1n, aMinusOne = !isE && A.n === -1n && A.d === 1n, yZero = Y.n === 0n, yOne = Y.n === 1n && Y.d === 1n;
    if (aZero) {
      if (yZero) return stop('indeterminate', 'Every positive n works', '0^n = 0 for every n > 0, so every positive n is a solution. For n = 0 the expression 0\u2070 is undefined and for n < 0 it means dividing by zero.');
      return stop('none', 'No solution', '0^n is 0 (for n > 0) or undefined (for n \u2264 0). It is never ' + disp(Y) + '.');
    }
    if (aOne) return yOne ? stop('indeterminate', 'Every n works', '1^n = 1 for every n, so every n is a solution: the value of n cannot be found from this equation.') : stop('none', 'No solution', '1^n = 1 for every n. It is never ' + disp(Y) + '.');
    if (aMinusOne) {
      if (yOne) return stop('indeterminate', 'Every even n works', '(\u22121)^n = 1 for every even whole number n (and \u22121 for every odd one). Infinitely many solutions.');
      if (Y.n === -1n && Y.d === 1n) return stop('indeterminate', 'Every odd n works', '(\u22121)^n = \u22121 for every odd whole number n. Infinitely many solutions.');
      return stop('none', 'No solution', '(\u22121)^n is only ever 1 or \u22121 (for whole-number n). It is never ' + disp(Y) + '.');
    }
    if (yZero) return stop('none', 'No solution', 'A non-zero base raised to any power is never 0.');
    if (aPos && Y.n < 0n) return stop('none', 'No real solution', 'A positive base raised to any real power is positive, so a^n can never equal ' + disp(Y) + '. (A complex exponent would be needed; complex results are not part of this mode.)');
    var lnA = isE ? 1 : lnRat(aPos ? A : rat(-A.n, A.d)), lnY = lnRat(rat(babs(Y.n), Y.d)), nf = yOne ? 0 : lnY / lnA, ex = null;
    var txtA = isE ? 'e' : (aPos ? ratText(A) : ratText(rat(-A.n, A.d)));
    r.steps.push({ title: 'Take the logarithm of both sides', text: lines('a^n = y', 'n \u00b7 ln(a) = ln(y)', 'n = ln(y) / ln(a)', '(Any logarithm base gives the same ratio; natural logarithms are used here.)') });
    r.steps.push({ title: 'Calculate', text: lines('ln(' + (aPos ? '' : '|') + txtA + (aPos ? '' : '|') + ') = ' + fmt(lnA, 10), 'ln(' + (Y.n < 0n ? '|' : '') + ratText(rat(babs(Y.n), Y.d)) + (Y.n < 0n ? '|' : '') + ') = ' + fmt(lnY, 10), 'n = ' + fmt(lnY, 10) + ' / ' + fmt(lnA, 10) + ' = ' + fmt(nf, 12)) });
    if (yOne) ex = { p: 0n, q: 1n };
    else if (!isE) ex = findRational(A, Y, nf);
    if (!aPos) {
      /* negative base: the real power exists for a whole number or a fraction with an odd denominator, and the sign of the result is (-1)^p */
      if (!ex) return stop('none', 'No real solution', 'The size works out as n \u2248 ' + fmt(nf, 8) + ', but that is not a whole number or a fraction (denominator up to ' + MAXQ + ') with an odd denominator, and a negative base raised to any other power is not a real number. (Complex results are not part of this mode.)');
      var odd = ex.p % 2n !== 0n, yNeg = Y.n < 0n;
      if (ex.q % 2n === 0n) return stop('none', 'No real solution', 'The size works out as n = ' + ex.p + '/' + ex.q + ', but a negative base raised to a fraction with an even denominator is not a real number.');
      if (odd !== yNeg) return stop('none', 'No real solution', 'The size works out as n = ' + ratText(rat(ex.p, ex.q)) + ', but then the sign is wrong: with a negative base the sign of a^n is ' + (odd ? 'negative' : 'positive') + ' for this exponent, and y is ' + (yNeg ? 'negative' : 'positive') + '.');
      r.steps.push({ title: 'Negative base', text: 'The size |y| = |a|^n gives n = ' + ratText(rat(ex.p, ex.q)) + '. With a negative base the real power exists for this exponent (odd denominator) and its sign is (\u22121)^' + ex.p + ' = ' + (odd ? 'negative' : 'positive') + ', which matches y.' });
    }
    var sol, nn = ex ? rat(ex.p, ex.q) : null;
    if (ex) {
      var dec = fmt(Number(nn.n) / Number(nn.d), sig === 'full' ? 15 : sig);
      sol = { v: 'n', text: disp(nn), exact: true, exactText: disp(nn), decimal: dec, decimalApprox: false, approx: false, sci: fmt(Number(nn.n) / Number(nn.d), sig), sign: sgn(nn.n), ratN: nn.n.toString(), ratD: nn.d.toString(), value: Number(nn.n) / Number(nn.d) };
      r.steps.push({ title: 'Exact value', text: ex.p === 0n ? txtA + '^0 = 1, so n = 0 exactly.' : (isE ? '' : (aPos ? ratText(A) : '(' + MINUS + ratText(rat(-A.n, A.d)) + ')') + '^' + (nn.d === 1n ? nn.n : '(' + nn.n + '/' + nn.d + ')') + ' = ' + ratText(Y) + ', checked with whole numbers (' + ratText(Y).replace(/^-/, MINUS) + ' is reached exactly), so n = ' + disp(nn) + ' exactly.') });
      r.check = { ok: true, detail: expr(a.text, ratText(nn), y.text).replace(/ = /, ' = ') + ' holds exactly (a^' + nn.n + ' = y^' + nn.d + ' in whole-number arithmetic)' };
    } else {
      sol = { v: 'n', text: '\u2248 ' + fmt(nf, sig), exact: false, exactText: null, decimal: fmt(nf, sig), decimalApprox: true, approx: true, sci: fmt(nf, sig), sign: nf < 0 ? -1 : nf > 0 ? 1 : 0, value: nf };
      r.steps.push({ title: 'Exact value', text: 'n is not a whole number or a fraction with a denominator up to ' + MAXQ + ' that satisfies a^n = y exactly, so it is irrational (or very close to a fraction with a larger denominator): the decimal is a double-precision approximation (about 15 reliable digits).' });
      r.check = { ok: Math.abs(nf * lnA - lnY) <= 1e-9 * (1 + Math.abs(lnY)), detail: 'n ln|a| = ' + fmt(nf * lnA, 12) + ' and ln|y| = ' + fmt(lnY, 12) };
    }
    r.cls = 'unique'; r.solutions = [sol]; r.message = 'Exactly one real exponent solves a^n = y.';
    r.steps.push({ title: 'Result', text: 'n = ' + sol.text + (ex && nn.d !== 1n ? '   (' + sol.decimal + ')' : '') });
    return r;
  }

  /* ---------- solve for the base a ---------- */
  function solveA(o, n, y, sig) {
    var r = base('a', sig, { text: '' }, n, y), N = rat(n.n, n.d), Y = rat(y.n, y.d), p = N.n, q = N.d;
    r.steps = [{ title: 'The problem', text: 'n = ' + n.text.replace(/^-/, MINUS) + '\ny = ' + y.text.replace(/^-/, MINUS) + '\nSolve a^n = y for a' }];
    function stop(cls, title, msg) { r.cls = cls; r.message = msg; r.steps.push({ title: title, text: msg }); return r; }
    if (p === 0n) return Y.n === 1n && Y.d === 1n ? stop('indeterminate', 'Every non-zero a works', 'a\u2070 = 1 for every a \u2260 0 (and 0\u2070 is undefined), so a cannot be found from this equation.') : stop('none', 'No solution', 'a\u2070 is 1 for every non-zero a, so it is never ' + disp(Y) + '.');
    if (Y.n === 0n) return p > 0n ? (r.cls = 'unique', r.message = 'Exactly one real base: only 0 raised to a positive power is 0.', r.solutions = [{ v: 'a', text: '0', exact: true, exactText: '0', decimal: '0', decimalApprox: false, approx: false, sci: '0', sign: 0, ratN: '0', ratD: '1' }], r.steps.push({ title: 'Result', text: 'a = 0' }), r.check = { ok: true, detail: '0^n = 0 for n > 0' }, r) : stop('none', 'No solution', 'A negative power means dividing by a^|n|, which is never 0.');
    var qEven = q % 2n === 0n, pEven = p % 2n === 0n, yPos = Y.n > 0n, pAbs = babs(p);
    var nTxt = (p < 0n ? '-' : '') + q + '/' + pAbs;
    r.steps.push({ title: 'Take the root', text: lines('a^n = y', 'a = y^(1/n)', 'n = ' + ratText(N).replace(/^-/, MINUS) + ' (reduced), so 1/n = ' + (p < 0n ? MINUS : '') + q + '/' + pAbs, '|a| = |y|^(' + (p < 0n ? MINUS : '') + q + '/' + pAbs + ')') });
    /* real solutions: which signs of a are possible */
    var signs;
    if (qEven) { signs = yPos ? [1] : []; }
    else if (pEven) { signs = yPos ? [1, -1] : []; }
    else { signs = yPos ? [1] : [-1]; }
    var why = qEven ? 'The reduced exponent has an even denominator (' + q + '), so a real power exists only for a \u2265 0 and the result is positive.' : pEven ? 'The reduced exponent has an even numerator (' + p + ') and an odd denominator, so a and \u2212a give the same positive value: a^n is never negative, and when y > 0 there are two real bases.' : 'The reduced exponent has an odd numerator and an odd denominator, so a^n has the same sign as a: one real base, with the sign of y.';
    r.steps.push({ title: 'How many real solutions', text: why });
    if (!signs.length) return stop('none', 'No real solution', (yPos ? '' : 'a^n would have to be negative, but ') + (qEven ? 'a negative base has no real power with an even denominator, and a positive base gives a positive value.' : 'an even power of a real number is never negative.') + ' Complex solutions are not part of this mode.');
    var aA = rat(babs(Y.n), Y.d), f = F.run({ a: ratText(aA), n: nTxt, sig: sig });
    if (!f.ok) { f.mode = 3; f.solve = 'a'; return f; }
    var pos = solFromRun(f, false, 'a'), sols = signs.map(function (sg) { return sg > 0 ? pos : solFromRun(f, true, 'a'); });
    r.steps.push({ title: 'Evaluate the root', text: '|a| = |y|^(' + (p < 0n ? MINUS : '') + q + '/' + pAbs + ') is worked out with the fractional-exponent method (the steps below call that exponent n).' });
    r.steps = r.steps.concat(f.steps.slice(1, -1));
    r.cls = sols.length > 1 ? 'multiple' : 'unique';
    r.message = sols.length > 1 ? 'Two real bases: ' + sols[0].text + ' and ' + sols[1].text + '.' : 'Exactly one real base.';
    r.solutions = sols; r.run = f; r.radicalNote = f.radicalNote || null; r.warnings = f.warnings || [];
    /* check: put every solution back into a^n and compare with y (exactly when the base is a ratio of whole numbers) */
    var allOk = true, detail = [];
    sols.forEach(function (s) {
      var lnaAbs = s.log10 * Math.LN10, lnY = lnRat(rat(babs(Y.n), Y.d)), nv = Number(N.n) / Number(N.d);
      if (s.ratN !== null && s.ratD !== null) {
        var base2 = rat(BigInt(s.ratN) * BigInt(s.sign), BigInt(s.ratD)), ok = exactPow(base2, p, q, Y);
        if (ok === null) { ok = Math.abs(nv * lnaAbs - lnY) <= 1e-9 * (1 + Math.abs(lnY)); detail.push(s.text + ': numerical check'); } else detail.push(s.text + '^(' + ratText(N).replace(/^-/, MINUS) + ') = y exactly');
        allOk = allOk && ok;
      } else {
        var good = Math.abs(nv * lnaAbs - lnY) <= 1e-9 * (1 + Math.abs(lnY)); allOk = allOk && good;
        detail.push('n ln|a| = ' + fmt(nv * lnaAbs, 12) + ' and ln|y| = ' + fmt(lnY, 12));
      }
    });
    r.check = { ok: allOk, detail: detail.filter(function (d, i) { return detail.indexOf(d) === i; }).join('; ') };
    var s0 = sols[0], more = s0.exactText && s0.decimal !== s0.exactText ? '   (\u2248 ' + s0.decimal + ')' : '';
    r.steps.push({ title: 'Result', text: sols.length > 1 ? 'a = ' + sols[0].text + '  or  a = ' + sols[1].text + more.replace('(\u2248 ', '(\u2248 \u00b1') : 'a = ' + s0.text + more });
    return r;
  }

  /* ---------- run ---------- */
  function run(o) {
    o = o || {};
    var solve = o.solve === 'n' || o.solve === 'a' ? o.solve : 'y', sig = X.SIG_CHOICES.indexOf(String(o.sig)) >= 0 ? String(o.sig) : '6';
    var known = solve === 'y' ? ['a', 'n'] : solve === 'n' ? ['a', 'y'] : ['n', 'y'], ops = {}, empties = [], i, k, p;
    for (i = 0; i < known.length; i++) {
      k = known[i]; p = X.parseOperand(o[k], k === 'a');
      if (p.empty) { empties.push(k); continue; }
      if (p.error) return { ok: false, error: p.error, field: k };
      ops[k] = p;
    }
    if (empties.length === 2) return { ok: false, empty: true, error: '' };
    if (empties.length === 1) return { ok: false, partial: true, field: empties[0], error: 'Enter ' + FIELDS[empties[0]].toLowerCase().replace(/ \(.\)/, '') + ' (' + empties[0] + ').' };
    if (ops.a && ops.a.kind === 'e' && solve === 'n' && ops.a.sign < 0) return { ok: false, error: 'A base of \u2212e is not supported here. Use a rational base.', field: 'a' };
    if (solve === 'y') return solveY(o, ops.a, ops.n, sig);
    if (solve === 'n') return solveN(o, ops.a, ops.y, sig);
    if (ops.n && ops.n.kind !== 'rat') return { ok: false, error: 'The exponent must be a number or a fraction.', field: 'n' };
    return solveA(o, ops.n, ops.y, sig);
  }

  /* ---------- text, CSV, JSON ---------- */
  function solText(r) {
    if (!r.solutions.length) return 'no real solution';
    var name = r.solve;
    return r.solutions.map(function (s) { return s.exactText ? name + ' = ' + s.text : name + ' \u2248 ' + s.decimal; }).join('  or  ');
  }
  function headline(r) {
    if (r.solve === 'y') return r.cls === 'unique' ? r.valueLine : r.equation.replace(/ = \?$/, '') + ': ' + r.message;
    return r.equation + (r.cls === 'unique' || r.cls === 'multiple' ? '   \u2192   ' + solText(r) : '   \u2192   ' + (r.cls === 'indeterminate' ? 'indeterminate' : 'no real solution'));
  }
  var CLS = { unique: 'unique real solution', multiple: 'multiple real solutions', none: 'no real solution', indeterminate: 'indeterminate' };
  function exportTxt(r) {
    var out = ['Elecmetric Exponent Calculator: Missing Value Solver (a^n = y)', '', 'Equation: ' + r.equation, 'Solving for: ' + ({ y: 'the result y', n: 'the exponent n', a: 'the base a' })[r.solve], 'Classification: ' + CLS[r.cls], 'Answer: ' + (r.solutions.length ? solText(r) : r.message), ''];
    if (r.solutions.length) r.solutions.forEach(function (s) { out.push(s.v + (s.exactText ? ' = ' + s.text : ' \u2248 ' + s.decimal) + (s.exact ? ' (exact)' : s.exactText ? ' (exact radical form)' : ' (approximate)')); if (s.decimal && s.decimal !== s.text) out.push('  decimal: ' + (s.decimalApprox ? '\u2248 ' : '') + s.decimal); out.push('  scientific: ' + s.sci); });
    out.push('', 'Working', '');
    r.steps.forEach(function (s) { out.push(s.title, s.text, ''); });
    if (r.check) out.push('Check: ' + (r.check.ok ? 'passed. ' : 'FAILED. ') + (r.check.detail || ''));
    return out.join('\n');
  }
  function csvq(s) { s = String(s); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function exportCsv(r) {
    var rows = [['equation', 'solving_for', 'classification', 'variable', 'value', 'exact', 'decimal', 'scientific']];
    if (r.solutions.length) r.solutions.forEach(function (s) { rows.push([r.equation, r.solve, r.cls, s.v, s.text, s.exact ? 'yes' : 'no', s.decimal, s.sci]); });
    else rows.push([r.equation, r.solve, r.cls, '', r.message, '', '', '']);
    return rows.map(function (x) { return x.map(csvq).join(','); }).join('\n');
  }
  function exportJson(r) {
    return JSON.stringify({ tool: 'Elecmetric Exponent Calculator, Mode 03: Missing Value Solver', equation: r.equation, solving_for: r.solve, classification: r.cls, message: r.message, solutions: r.solutions.map(function (s) { return { variable: s.v, value: s.text, exact: s.exact, decimal: s.decimal, scientific: s.sci }; }), check: r.check, steps: r.steps }, null, 2);
  }

  var api = { run: run, headline: headline, solText: solText, exportTxt: exportTxt, exportCsv: exportCsv, exportJson: exportJson, findRational: findRational, CLASSES: CLS, fmt: fmt, fmtGroup: fmtGroup };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ExponentSolver = api;
})(typeof self !== 'undefined' ? self : this);
