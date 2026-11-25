#!/usr/bin/env python3
"""Independent vectors for tools/percent_error_engine.js (Percentage Calculator, Mode 04, Percentage Error). Writes tests/percent_error_vectors.json.
Every expected value comes from Python fractions.Fraction (exact) and decimal.Decimal (display), never from the engine's own route:
  err  reference R, measured M:  percentage error = |M - R| / |R| * 100 (R = 0 refused); signed deviation (M - R) / |R| * 100; relative error (M - R) / |R|;
       accuracy 100 - percentage error (only up to 100); optional tolerance t (% of |R|): range R -/+ |R| t / 100, within when the error is <= t
  val  reference R, signed percentage error p:  M = R + |R| p / 100 (R = 0 refused)
  ref  measured M, signed percentage error p:   R = M / (1 + s p / 100), s = sign of M (M = 0 refused; refused when the bracket is 0 or below)
Display text: ROUND_HALF_UP on a Decimal with 3000 digits. 'auto' means the exact decimal when the value terminates, otherwise 6 places, flagged not exact.
Each row: [kind, x, y, z, places, num, den, text, exact, dir, extras]; extras holds second values that the test finds in the result table."""
import json, random
from fractions import Fraction
from decimal import Decimal, getcontext, ROUND_HALF_UP
getcontext().prec = 3000
R = random.Random(20261123)

def terms(d):
    a = b = 0
    while d % 2 == 0: d //= 2; a += 1
    while d % 5 == 0: d //= 5; b += 1
    return (max(a, b) if d == 1 else -1)

def text(fr, places):
    n, d = fr.numerator, fr.denominator
    dec = Decimal(n) / Decimal(d)
    if places == 'auto':
        if terms(d) >= 0:
            s = format(dec, 'f')
            if '.' in s: s = s.rstrip('0').rstrip('.')
            return ('0' if s in ('-0', '') else s), True
        q = dec.quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP)
        s = format(q, 'f')
        return ('0.000000' if s == '-0.000000' else s), False
    q = dec.quantize(Decimal(1).scaleb(-places), rounding=ROUND_HALF_UP)
    s = format(q, 'f')
    z = '0' if places == 0 else '0.' + '0' * places
    exact = (fr * 10 ** places).denominator == 1
    return (z if s == '-' + z else s), exact

def dv(fr):  # the engine's working form: exact decimal when it ends (up to 40 places), otherwise the exact fraction
    k = terms(fr.denominator)
    if 0 <= k <= 40: return text(fr, 'auto')[0]
    return str(fr.numerator) if fr.denominator == 1 else '%d/%d' % (fr.numerator, fr.denominator)

def dvp(fr):  # a percentage cell in the result table
    k = terms(fr.denominator)
    if 0 <= k <= 40: return text(fr, 'auto')[0] + '%'
    q = (Decimal(fr.numerator) / Decimal(fr.denominator)).quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP)
    s = format(q, 'f')
    return '\u2248 ' + ('0.000000' if s == '-0.000000' else s) + '%'

def sgn(f): return (f > 0) - (f < 0)

def num():
    k = R.random()
    if k < .4: v = str(R.randint(0, 500))
    elif k < .8: v = '%d.%d' % (R.randint(0, 300), R.randint(0, 999))
    elif k < .9: v = '0.%0*d' % (R.randint(1, 4), R.randint(1, 9999))
    else: v = str(R.randint(1, 10 ** 12))
    if R.random() < .2: v = '-' + v
    return v

def pnum():  # a signed percentage error
    k = R.random()
    if k < .5: v = '%d.%d' % (R.randint(0, 20), R.randint(0, 99))
    elif k < .8: v = str(R.randint(0, 100))
    elif k < .95: v = '%d.%d' % (R.randint(0, 250), R.randint(0, 9))
    else: v = str(R.randint(100, 400))
    return ('-' + v) if R.random() < .5 else v

def tol():
    k = R.random()
    if k < .3: return ''
    return str(R.choice([0, 0.5, 1, 1.5, 2, 2.5, 5, 10])) if R.random() < .5 else '%d.%d' % (R.randint(0, 15), R.randint(0, 9))

def result(kind, x, y, z):
    fx, fy = Fraction(x), Fraction(y)
    if kind == 'err':
        if fx == 0: return None
        e = fy - fx; ape = abs(e) / abs(fx) * 100; dr = 'equal' if e == 0 else 'above' if e > 0 else 'below'
        ex = {'amt': dv(e), 'rel': dv(e / abs(fx)), 'sdev': dvp(e / abs(fx) * 100), 'acc': dvp(100 - ape) if ape <= 100 else 'not meaningful',
              'ofref': dvp(fy / fx * 100), 'diffsym': dvp(abs(e) / ((abs(fx) + abs(fy)) / 2) * 100), 'vsM': 'not defined' if fy == 0 else dvp(abs(e) / abs(fy) * 100)}
        w = None
        if z != '':
            t = Fraction(z); lo = fx - abs(fx) * t / 100; hi = fx + abs(fx) * t / 100; w = ape <= t
            ex['band'] = dv(lo) + ' to ' + dv(hi); ex['within'] = 'Yes' if w else 'No'
            ex['margin'] = dvp(abs(t - ape))[:-1] + ' percentage points ' + ('spare' if w else 'over')
        return ape, dr, ex
    if kind == 'val':
        if fx == 0: return None
        e = abs(fx) * fy / 100; m = fx + e; dr = 'equal' if fy == 0 else 'above' if fy > 0 else 'below'
        return m, dr, {'amt': dv(e), 'ofref': dvp(m / fx * 100)}
    if fx == 0: return None
    s = 1 if fx > 0 else -1; den = 1 + fy * s / 100
    if den <= 0: return None
    r = fx / den; e = fx - r; dr = 'equal' if e == 0 else 'above' if e > 0 else 'below'
    return r, dr, {'amt': dv(e), 'ofref': dvp(fx / r * 100)}

out = {'calc': [], 'big': [], 'err': [], 'empty': []}

def add(kind, x, y, z, places, store='calc', extras=True):
    r = result(kind, x, y, z)
    if r is None: return False
    v, dr, ex = r
    t, exa = text(v, places)
    out[store].append([kind, x, y, z, places, str(v.numerator), str(v.denominator), t, exa, dr, ex if extras else {}])
    return True

named = [('err', '230', '225', ''), ('err', '230', '225', '2'), ('err', '230', '225', '5'), ('err', '225', '230', ''), ('err', '100', '98.5', ''), ('err', '100', '105', '5'), ('err', '100', '105', '4'),
         ('err', '100', '100', '1'), ('err', '50', '0', ''), ('err', '-50', '-45', ''), ('err', '-50', '-55', '10'), ('err', '5', '-5', ''), ('err', '5', '500', ''), ('err', '0.001', '0.002', '0'), ('err', '10000', '10100', '1'),
         ('err', '3', '4', ''), ('err', '230', '230', ''), ('err', '1000', '1012', '1'), ('err', '10', '9.87', '1'), ('err', '10', '9.9', '1'),
         ('val', '230', '-2.5'), ('val', '230', '2.5'), ('val', '230', '0'), ('val', '230', '-100'), ('val', '230', '-150'), ('val', '-230', '2.5'), ('val', '100', '33.333'), ('val', '1', '1'),
         ('ref', '235.75', '2.5'), ('ref', '224.25', '-2.5'), ('ref', '225', '-2'), ('ref', '-235.75', '-2.5'), ('ref', '100', '0'), ('ref', '100', '-100'), ('ref', '100', '-150'), ('ref', '-100', '100'), ('ref', '1', '300'), ('ref', '0.5', '12.5')]
for row in named:
    k, x, y = row[0], row[1], row[2]; z = row[3] if len(row) > 3 else ''
    for p in ['auto', 2, 0]: add(k, x, y, z, p)
for _ in range(1500):
    k = R.choice(['err', 'err', 'val', 'ref'])
    if k == 'err': x, y, z = num(), num(), tol()
    else: x, y, z = num(), pnum(), ''
    add(k, x, y, z, R.choice(['auto', 'auto', 0, 2, 3, 4, 6, 8]))
# spelling variants: plus sign, leading zeros, trailing point, unicode minus, spaces, % signs where a percentage is expected
for k, xs, ys, zs in [('err', ' +230 ', '225.', '2%'), ('err', '0230', '225', ' 2 % '), ('err', '\u221250', '\u221245', ''), ('val', '230', '-2.5%', ''), ('val', ' 230 ', ' \u22122.5 % ', ''), ('ref', '235.75', '2.5 %', ''), ('ref', '.5', '10', ''), ('err', '12.50', '8.00', '.5')]:
    x = xs.replace('\u2212', '-').replace('%', '').strip(); y = ys.replace('\u2212', '-').replace('%', '').strip(); z = zs.replace('%', '').strip()
    r = result(k, x, y, z); v, dr, ex = r; t, exa = text(v, 'auto')
    out['calc'].append([k, xs, ys, zs, 'auto', str(v.numerator), str(v.denominator), t, exa, dr, ex])
for digs in (100, 200, 380):
    a = str(R.randint(10 ** (digs - 1), 10 ** digs - 1)); b = str(R.randint(10 ** (digs - 1), 10 ** digs - 1))
    add('err', a, b, '', 4, 'big', extras=False); add('err', a, b, '5', 4, 'big', extras=False)
    add('val', a, '12.5', '', 4, 'big', extras=False); add('ref', a, '12.5', '', 4, 'big', extras=False)
out['err'] = [
    ['err', '0', '5', ''], ['err', '0', '0', ''], ['err', '0.00', '-0', '2'], ['val', '0', '5', ''], ['ref', '0', '5', ''], ['ref', '100', '-100', ''], ['ref', '100', '-101', ''], ['ref', '-100', '100', ''], ['ref', '-100', '150', ''],
    ['err', '230', '225', '-1'], ['err', '230', '225', '-0.5'], ['err', 'abc', '5', ''], ['err', '5', 'x', ''], ['err', '5', '5', 'abc'], ['err', '1,000', '5', ''], ['err', '5', '1,5', ''], ['err', '5', '5', '1,5'], ['err', '1..2', '5', ''], ['err', '--5', '5', ''],
    ['err', '5', '.', ''], ['err', '-', '5', ''], ['err', '1e3', '5', ''], ['err', '5', 'Infinity', ''], ['err', '5', 'NaN', ''], ['err', '1/2', '5', ''], ['err', '5%', '5', ''], ['err', '5', '5%', ''], ['err', '5', '5', '1e2'], ['val', 'abc', '5', ''], ['val', '5', 'abc', ''],
    ['val', '5', '1,5', ''], ['val', '5%', '5', ''], ['ref', '5%', '5', ''], ['ref', '5', '1/2', ''], ['ref', '1e3', '5', ''], ['err', '1' * 401, '5', ''], ['err', '5', '5', '0.' + '1' * 400], ['val', '5', '0.' + '1' * 400, ''], ['ref', '1' * 401, '5', ''],
    ['err', '5 5', '5', ''], ['nope', '1', '1', ''], ['', '1', '1', ''],
]
out['empty'] = [['err', '', '', ''], ['err', '5', '', ''], ['err', '', '5', ''], ['val', '', ''], ['val', '5', ''], ['ref', '', '5'], ['ref', '', '']]
json.dump(out, open('percent_error_vectors.json', 'w'), separators=(',', ':'))
print('calc %d, big %d, err %d, empty %d' % (len(out['calc']), len(out['big']), len(out['err']), len(out['empty'])))
