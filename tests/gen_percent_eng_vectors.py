#!/usr/bin/env python3
"""Independent vectors for tools/percent_eng_engine.js (Percentage Calculator, Mode 05, Engineering Percentage Analysis). Writes tests/percent_eng_vectors.json.
Every expected value comes from Python fractions.Fraction (exact) and decimal.Decimal (display), written from the definitions in the CEO note, never from the engine's own route.
Display text: ROUND_HALF_UP on a Decimal with 3000 digits. 'auto' means the exact decimal when the value terminates, otherwise 6 places, flagged not exact.
Each row: [kind, x, y, places, num, den, text, exact, dir, rows]; rows is a list of [row label, expected cell] that the test must find in the result table."""
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


def num():
    k = R.random()
    if k < .45: return str(R.randint(0, 600))
    if k < .85: return '%d.%d' % (R.randint(0, 400), R.randint(0, 999))
    if k < .95: return '0.%0*d' % (R.randint(1, 4), R.randint(1, 9999))
    return str(R.randint(1, 10 ** 12))

# kind: (reference index 0=x 1=y, unit, label of result row)
def spec(kind, x, y):
    """returns (value, dir, rows, warns) or None when refused; rows are [label, text]"""
    x, y = Fraction(x), Fraction(y)
    ref = x if kind in ('eff', 'vdrop', 'vdev', 'derate', 'save') else y
    if ref == 0: return None
    if kind == 'eff':   v = y / x * 100; rows = [['Power loss', dv(x - y)], ['Loss as a percentage of the input', dvp((x - y) / x * 100)]]; w = y > x; d = ''
    elif kind == 'load': v = x / y * 100; rows = [['Spare capacity (capacity \u2212 actual)', dv(y - x)], ['Spare capacity as a percentage of capacity', dvp((y - x) / y * 100)]]; w = x > y; d = ''
    elif kind == 'vdrop': v = y / x * 100; rows = [['Voltage at the load (source \u2212 drop)', dv(x - y)], ['Voltage at the load as a percentage of the source', dvp((x - y) / x * 100)]]; w = y > x; d = ''
    elif kind == 'vdev': v = (y - x) / x * 100; rows = [['Deviation (actual \u2212 nominal)', dv(y - x)], ['Actual as a percentage of nominal', dvp(y / x * 100)]]; w = False; d = 'equal' if v == 0 else 'above' if v > 0 else 'below'
    elif kind == 'lf': v = x / y * 100; rows = [['Peak minus average', dv(y - x)], ['Average as a fraction of peak', dv(x / y)]]; w = x > y; d = ''
    elif kind == 'df': v = x / y * 100; rows = [['Connected load not in the maximum demand', dv(y - x)], ['Demand as a fraction of connected load', dv(x / y)]]; w = x > y; d = ''
    elif kind == 'div': v = x / y; rows = [['Coincidence factor (1 \u00f7 diversity factor)', 'not defined' if x == 0 else dvp(y / x * 100)], ['Diversity as a percentage', dvp(x / y * 100)]]; w = x < y; d = ''
    elif kind == 'derate': v = (x - y) / x * 100; rows = [['Capacity lost (rated \u2212 derated)', dv(x - y)], ['Derating factor (derated \u00f7 rated)', dv(y / x)]]; w = y > x; d = 'no change' if v == 0 else 'reduction' if v > 0 else 'increase'
    elif kind == 'save': v = (x - y) / x * 100; rows = [['Energy saved (previous \u2212 new)', dv(x - y)], ['New as a percentage of previous', dvp(y / x * 100)]]; w = y > x; d = 'no change' if v == 0 else 'saving' if v > 0 else 'increase'
    elif kind == 'soc': v = x / y * 100; rows = [['Capacity used (usable \u2212 remaining)', dv(y - x)], ['Depleted', dvp((y - x) / y * 100)]]; w = x > y; d = ''
    else: v = x / y * 100; rows = [['Power not lost (reference \u2212 loss)', dv(y - x)], ['Share left after the loss', dvp((y - x) / y * 100)]]; w = x > y; d = ''
    return v, d, rows, w

KINDS = ['eff', 'load', 'vdrop', 'vdev', 'lf', 'df', 'div', 'derate', 'save', 'soc', 'ploss']
out = {'calc': [], 'big': [], 'err': [], 'empty': []}

def add(kind, x, y, places, store='calc', rows=True):
    r = spec(kind, x, y)
    if r is None: return False
    v, d, rw, w = r
    unit = '' if kind == 'div' else '%'
    t, ex = text(v, places)
    out[store].append([kind, x, y, places, str(v.numerator), str(v.denominator), t, ex, d, rw if rows else [], bool(w)])
    return True

named = [('eff', '100', '96'), ('load', '150', '200'), ('vdrop', '230', '9.2'), ('save', '1000', '750'), ('vdev', '230', '225'), ('vdev', '230', '230'), ('vdev', '230', '240'), ('div', '1200', '900'), ('derate', '200', '170'), ('derate', '200', '200'), ('derate', '200', '220'),
         ('lf', '62', '100'), ('df', '350', '500'), ('soc', '38', '50'), ('ploss', '4', '100'), ('eff', '100', '104'), ('load', '250', '200'), ('vdrop', '230', '250'), ('lf', '100', '62'), ('df', '500', '350'), ('div', '800', '900'), ('div', '0', '900'),
         ('save', '1000', '1200'), ('save', '1000', '1000'), ('soc', '0', '50'), ('soc', '60', '50'), ('ploss', '0', '100'), ('ploss', '100', '4'), ('eff', '0', '0.5'), ('vdrop', '230', '0'), ('save', '1', '0'), ('load', '0', '200')]
for k, x, y in named:
    for p in ['auto', 2, 0]: add(k, x, y, p)
for _ in range(2200):
    add(R.choice(KINDS), num(), num(), R.choice(['auto', 'auto', 0, 2, 3, 4, 6, 8]))
for k, xs, ys in [('eff', ' 100 ', '96.'), ('load', '0150', '+200'), ('vdrop', '230', '.5'), ('save', '1000.00', '750'), ('soc', '+38', '050')]:
    x = xs.strip().lstrip('+'); y = ys.strip().lstrip('+')
    v, d, rw, w = spec(k, x, y); t, ex = text(v, 'auto')
    out['calc'].append([k, xs, ys, 'auto', str(v.numerator), str(v.denominator), t, ex, d, rw, bool(w)])
for digs in (100, 200, 380):
    a = str(R.randint(10 ** (digs - 1), 10 ** digs - 1)); b = str(R.randint(10 ** (digs - 1), 10 ** digs - 1))
    for k in ('eff', 'save', 'div', 'vdev'): add(k, a, b, 4, 'big', rows=False)
out['err'] = []
for k in KINDS:
    out['err'] += [[k, '1', '-1'], [k, '-1', '1'], [k, 'abc', '1'], [k, '1', 'abc'], [k, '1,5', '1'], [k, '1', '5%'], [k, '1e3', '1'], [k, '1/2', '1'], [k, '1', '1' * 401], [k, '1' * 401, '1'], [k, '1 1', '1'], [k, 'NaN', '1'], [k, '-0.5', '-0.5']]
    ref = 0 if k in ('eff', 'vdrop', 'vdev', 'derate', 'save') else 1
    out['err'].append([k, '0', '5'] if ref == 0 else [k, '5', '0'])
    out['err'].append([k, '0', '0'])
out['err'] += [['nope', '1', '1'], ['', '1', '1']]
out['empty'] = [[k, a, b] for k in KINDS for a, b in (('', ''), ('5', ''), ('', '5'))]
json.dump(out, open('percent_eng_vectors.json', 'w'), separators=(',', ':'))
print('calc %d, big %d, err %d, empty %d' % (len(out['calc']), len(out['big']), len(out['err']), len(out['empty'])))
