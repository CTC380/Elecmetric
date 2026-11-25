#!/usr/bin/env python3
"""Independent vectors for tools/pe_batch_engine.js (Elecmetric Percent Error Calculator, Mode 04, Batch Measurement Analysis). Writes tests/pe_batch_vectors.json.
Every expected value comes from Python fractions.Fraction (exact) and decimal.Decimal (display and square roots, 3000 digits), never from the engine's own route:
  readings x_i, reference R;  error e_i = x_i - R;  n = number of readings
  mean signed error = sum(e)/n;  mean absolute error = sum|e|/n;  maximum absolute error = max|e| (first reading that has it);  median of the readings
  sum of squared deviations SSD = sum((e_i - mean e)^2) = sum(x_i - mean x)^2;  population SD = sqrt(SSD/n);  sample SD = sqrt(SSD/(n-1)) (n >= 2);  RMSE = sqrt(sum(e^2)/n)
  percentages divide by |R|: 100 x value / |R| (null when R = 0);  SD as a percentage = sqrt(variance x 10000 / R^2)
  tolerance (optional, symmetrical): basis pct T = |R| x t / 100, basis abs T = t;  L = R - T, U = R + T;  reading below when x < L, above when x > U, within otherwise (limits included)
Display: ROUND_HALF_UP; 'auto' places = exact decimal when it ends (up to 60 places), otherwise 6 places with an approximate sign; a chosen number of places rounds every derived value
(mean, mean absolute error, standard deviations, RMSE and all percentages); errors, sum, median, minimum, maximum and range are always exact decimals.
Each case: {y, x (the readings joined by new lines), basis, t, places, o: {...expected...}}"""
import json, random
from fractions import Fraction as F
from decimal import Decimal, getcontext, ROUND_HALF_UP
from math import isqrt
getcontext().prec = 3000
RND = random.Random(20261127)

def terms(d):
    a = b = 0
    while d % 2 == 0: d //= 2; a += 1
    while d % 5 == 0: d //= 5; b += 1
    return max(a, b) if d == 1 else -1

def qtxt_dec(v, places):
    qq = v.quantize(Decimal(1).scaleb(-places), rounding=ROUND_HALF_UP)
    s = format(qq, 'f')
    if s.startswith('-') and float(qq) == 0 and not any(ch in '123456789' for ch in s): s = s[1:]
    return s

def qtxt(fr, places): return qtxt_dec(Decimal(fr.numerator) / Decimal(fr.denominator), places)

def exact_dec(fr):
    k = terms(fr.denominator); assert k >= 0
    return qtxt(fr, k)

def derived(fr, places):  # (text, exact)
    if places == 'auto':
        k = terms(fr.denominator)
        if 0 <= k <= 60: return qtxt(fr, k), True
        return qtxt(fr, 6), False
    t = qtxt(fr, places); return t, (fr * 10 ** places).denominator == 1

def plus(t): return t if t.startswith('-') or not any(ch in '123456789' for ch in t) else '+' + t

def show(pair, signed=False, pct=False):
    t, ex = pair; t = plus(t) if signed else t
    return ('' if ex else '\u2248 ') + t + ('%' if pct else '')

def sqrt_pair(fr, places):
    n, d = fr.numerator, fr.denominator; sn, sd = isqrt(n), isqrt(d)
    if sn * sn == n and sd * sd == d: return derived(F(sn, sd), places)
    k = 6 if places == 'auto' else places
    return qtxt_dec((Decimal(n) / Decimal(d)).sqrt(), k), False

def num(t): return F(Decimal(t))

def analyse(y, xs, basis, t, places):
    R = num(y); X = [num(v) for v in xs]; n = len(X); E = [v - R for v in X]; aR = abs(R)
    sE = sum(E); sA = sum(abs(e) for e in E); mE = sE / n; mA = sA / n
    maxA = max(abs(e) for e in E); at = [abs(e) for e in E].index(maxA) + 1
    ssd = sum((e - mE) ** 2 for e in E); popv = ssd / n; smpv = ssd / (n - 1) if n >= 2 else None; msq = sum(e * e for e in E) / n
    srt = sorted(X); med = srt[n // 2] if n % 2 else (srt[n // 2 - 1] + srt[n // 2]) / 2
    o = {'n': n, 'sum': exact_dec(sum(X)), 'meanObserved': show(derived(R + mE, places)), 'median': exact_dec(med), 'min': exact_dec(min(X)), 'max': exact_dec(max(X)), 'span': exact_dec(max(X) - min(X)),
         'sumError': plus(exact_dec(sE)), 'meanSigned': show(derived(mE, places), True), 'direction': 'equal' if mE == 0 else ('above' if mE > 0 else 'below'),
         'meanAbs': show(derived(mA, places)), 'maxAbs': exact_dec(maxA), 'maxAbsAt': at, 'rmse': show(sqrt_pair(msq, places)), 'sdPop': show(sqrt_pair(popv, places)),
         'sdSample': show(sqrt_pair(smpv, places)) if smpv is not None else None}
    if R != 0:
        o['meanSignedPct'] = show(derived(mE / aR * 100, places), True, True); o['meanAbsPct'] = show(derived(mA / aR * 100, places), False, True); o['maxAbsPct'] = show(derived(maxA / aR * 100, places), False, True)
        o['sdPopPct'] = show(sqrt_pair(popv * 10000 / (R * R), places), False, True); o['sdSamplePct'] = show(sqrt_pair(smpv * 10000 / (R * R), places), False, True) if smpv is not None else None
        o['rmsePct'] = show(sqrt_pair(msq * 10000 / (R * R), places), False, True)
    else:
        for k in ('meanSignedPct', 'meanAbsPct', 'maxAbsPct', 'sdPopPct', 'sdSamplePct', 'rmsePct'): o[k] = None
    reads = []
    for e in E:
        reads.append([plus(exact_dec(e)), exact_dec(abs(e)), show(derived(e / aR * 100, places), True, True) if R != 0 else None])
    o['reads'] = reads
    if t != '':
        T = aR * F(Decimal(t)) / 100 if basis == 'pct' else F(Decimal(t)); L, U = R - T, R + T
        st = ['below' if v < L else 'above' if v > U else 'within' for v in X]
        o['lower'] = exact_dec(L); o['upper'] = exact_dec(U); o['status'] = st; o['on'] = sum(1 for v in X if v == L or v == U)
        o['within'] = st.count('within'); o['outside'] = [i + 1 for i, s in enumerate(st) if s != 'within']
    return o

def case(y, xs, basis='pct', t='', places='auto'):
    return {'y': y, 'x': '\n'.join(xs), 'basis': basis, 't': t, 'places': places, 'o': analyse(y, xs, basis, t, places)}

def dtxt(fr, d):  # a decimal text with exactly d places
    return qtxt(fr, d)

cases = []
# named cases
cases.append(case('230', ['229', '231', '230', '228', '232'], 'pct', '5'))  # the product brief: mean error 0, MAE 1.2, max 2, SD sqrt(2) and sqrt(5/2)
cases.append(case('230', ['229', '231', '230', '228', '232'], 'pct', '1'))
cases.append(case('230', ['229', '231', '230', '228', '232']))
cases.append(case('10', ['9.8', '9.9', '10.1', '10.0', '9.95'], 'abs', '0.1'))
cases.append(case('230', ['225']))  # one reading
cases.append(case('230', ['230', '230', '230']))  # identical readings, zero spread
cases.append(case('100', ['99', '101', '99', '101']))  # exact standard deviations (sqrt of a perfect square)
cases.append(case('0', ['0.1', '-0.1', '0.2', '-0.2'], 'abs', '0.15'))  # zero reference with an absolute tolerance
cases.append(case('0', ['0.1', '-0.1', '0.2', '-0.2']))
cases.append(case('-10', ['-9', '-10.5', '-11', '-9.5'], 'pct', '10'))  # negative reference
cases.append(case('62.327', ['56.891', '60', '62.327', '65.1', '61.25', '63.007'], 'pct', '3', 4))
cases.append(case('9', ['7', '8', '9', '10', '11', '6', '12'], 'pct', '25', 2))
cases.append(case('1', ['1.0000001', '0.9999999', '1', '1.0000002'], 'abs', '0.0000001', 'auto'))
cases.append(case('5', ['5.5', '4.5'], 'pct', '10', 0))
cases.append(case('1', ['2', '3', '5', '8', '13', '21', '34', '55', '89', '144', '233'], 'pct', '', 3))
cases.append(case('230', ['229.50', '230.00', '231.250', '228', '232.5'], 'pct', '0.5'))
# limits: readings on each limit and one smallest step beyond (the limits are included)
for i in range(150):
    d = RND.randint(0, 4); R = F(RND.randint(1, 999999), 10 ** d) * (-1 if RND.random() < 0.2 else 1)
    basis = RND.choice(['pct', 'abs']); tt = F(RND.randint(1, 4000), 10 ** RND.randint(0, 3)) if basis == 'abs' else F(RND.randint(1, 4000), 10 ** RND.randint(0, 2))
    T = abs(R) * tt / 100 if basis == 'pct' else tt; L, U = R - T, R + T
    step = F(1, 10 ** (d + 6)); pts = [L, U, L - step, U + step, R, L + step, U - step]
    xs = [dtxt(p, 12) for p in pts]
    xs = [x.rstrip('0').rstrip('.') if '.' in x else x for x in xs]
    cases.append(case(dtxt(R, d), xs, basis, str(float(tt)) if False else format(tt.numerator / tt.denominator if False else Decimal(tt.numerator) / Decimal(tt.denominator), 'f'), RND.choice(['auto', 'auto', 2, 4, 6])))
# random batches
def rnd_dec(d, lo, hi): return F(RND.randint(lo, hi), 10 ** d)
for i in range(260):
    d = RND.randint(0, 4); R = rnd_dec(d, 1, 999999) * (-1 if RND.random() < 0.15 else 1)
    if RND.random() < 0.05: R = F(0)
    n = RND.choice([1, 2, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 30])
    xs = []
    for _ in range(n):
        dd = RND.randint(0, 5); noise = rnd_dec(dd, -3000, 3000) * (abs(R) if R != 0 else 1) / 100 if RND.random() < 0.7 else rnd_dec(dd, -999999, 999999)
        v = R + noise; xs.append(dtxt(v, dd + d) if RND.random() < 0.8 else dtxt(v, 3))
    xs = [x for x in xs]
    xs = [('0' if x in ('-0', '-0.0', '-0.00', '-0.000') else x) for x in xs]
    xs = [('0' + x[1:] if False else x) for x in xs]
    tol = RND.random() < 0.55; basis = 'abs' if (R == 0 or RND.random() < 0.4) else 'pct'
    t = ''
    if tol: t = str(RND.randint(1, 3000) / 10 ** RND.randint(0, 2)) if basis == 'pct' else format(Decimal(RND.randint(1, 5000)) / Decimal(10 ** RND.randint(0, 3)), 'f')
    cases.append(case(dtxt(R, d), xs, basis, t, RND.choice(['auto', 'auto', 0, 1, 2, 3, 4, 6, 8])))
# a large batch: 1000 readings
R = F(23000, 100); xs = [dtxt(R + rnd_dec(2, -500, 500), 2) for _ in range(1000)]; cases.append(case('230', xs, 'pct', '2', 'auto'))
cases.append(case('230', xs, 'pct', '', 5))
json.dump({'cases': cases}, open('tests/pe_batch_vectors.json', 'w'), separators=(',', ':'), ensure_ascii=False)
print(len(cases), 'cases')
