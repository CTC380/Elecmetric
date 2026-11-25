#!/usr/bin/env python3
"""Independent vectors for tools/percent_engine.js (Percentage Calculator, Mode 01). Writes tests/percent_basic_vectors.json.
Every expected value comes from Python fractions.Fraction (exact) and decimal.Decimal (display), never from the engine's own route:
  of:    X% of Y            = Fraction(X) * Fraction(Y) / 100
  what:  X is what % of Y   = Fraction(X) / Fraction(Y) * 100
  whole: X is Y% of what    = Fraction(X) * 100 / Fraction(Y)
Display text: ROUND_HALF_UP on a Decimal with 3000 digits of precision (half away from zero). 'auto' means the exact decimal when the
value terminates (checked by factoring the denominator), otherwise 6 places, flagged not exact."""
import json, random
from fractions import Fraction
from decimal import Decimal, getcontext, ROUND_HALF_UP
getcontext().prec = 3000
R = random.Random(20261120)

def terminates(d):
    while d % 2 == 0: d //= 2
    while d % 5 == 0: d //= 5
    return d == 1

def text(fr, places):
    n, d = fr.numerator, fr.denominator
    dec = Decimal(n) / Decimal(d)
    if places == 'auto':
        if terminates(d):
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

def num(neg_ok=True, big=False):
    kind = R.random()
    if kind < .4: v = str(R.randint(0, 500))
    elif kind < .8: v = '%d.%d' % (R.randint(0, 300), R.randint(0, 999))
    elif kind < .9: v = '0.%0*d' % (R.randint(1, 4), R.randint(1, 9999))
    else: v = str(R.randint(1, 10 ** 12))
    if neg_ok and R.random() < .18: v = '-' + v
    return v

def norm(v):  # the display form the engine echoes: no leading zeros, no '+'
    s = v
    neg = s.startswith('-'); s = s.lstrip('+-')
    ip, _, fp = s.partition('.')
    ip = ip.lstrip('0') or '0'
    out = ip + ('.' + fp if fp else '')
    return ('-' if neg and Fraction(out) != 0 else '') + out

PL = ['auto', 'auto', 0, 2, 3, 4, 6, 8]
out = {'calc': [], 'conv': [], 'err': [], 'big': []}

def add(kind, x, y, places):
    fx, fy = Fraction(x), Fraction(y)
    if kind == 'of': r = fx * fy / 100
    elif kind == 'what':
        if fy == 0: return False
        r = fx / fy * 100
    else:
        if fy == 0: return False
        r = fx * 100 / fy
    t, ex = text(r, places)
    out['calc'].append([kind, x, y, places, str(r.numerator), str(r.denominator), t, ex])
    return True

# named cases from the CEO note and the usual textbook questions
for k, x, y in [('of', '20', '150'), ('what', '45', '180'), ('whole', '45', '25'), ('of', '15', '1000'), ('of', '12.5', '80'), ('what', '1', '3'), ('what', '2', '3'),
                ('what', '225', '230'), ('whole', '920', '80'), ('of', '0', '55'), ('of', '55', '0'), ('what', '0', '9'), ('whole', '0', '25'), ('of', '100', '37.5'),
                ('of', '-20', '150'), ('what', '-45', '180'), ('what', '45', '-180'), ('whole', '-45', '25'), ('whole', '45', '-25'), ('what', '9', '4'),
                ('of', '250', '8'), ('what', '1', '8'), ('what', '1', '7'), ('whole', '7', '3'), ('of', '0.5', '0.5'), ('whole', '0.001', '0.5'), ('of', '33.333', '3')]:
    for p in ['auto', 2, 0]: add(k, x, y, p)
# random
for _ in range(900):
    k = R.choice(['of', 'what', 'whole'])
    x, y = num(), num(neg_ok=R.random() < .5)
    if k == 'whole' and R.random() < .5: y = str(R.randint(1, 200)) if R.random() < .6 else '%d.%d' % (R.randint(0, 99), R.randint(1, 99))
    add(k, x, y, R.choice(PL))
# spelling variants of the inputs: plus sign, leading zeros, % sign where allowed, unicode minus, spaces
for x, y, k, xs, ys in [('20', '150', 'of', '20%', '150'), ('45', '25', 'whole', '45', '25%'), ('7', '9', 'of', ' +7 ', '009'), ('-5', '40', 'of', '\u22125', '40'), ('0.5', '12', 'of', '.5', '12.'), ('12.50', '8', 'of', '12.50', '8.00')]:
    fx, fy = Fraction(x), Fraction(y)
    r = fx * fy / 100 if k == 'of' else fx * 100 / fy
    t, ex = text(r, 'auto')
    out['calc'].append([k, xs, ys, 'auto', str(r.numerator), str(r.denominator), t, ex])
# big numbers: 100 to 380 digits, a planted exact answer and a non-terminating one
for digs in (100, 200, 380):
    a = str(R.randint(10 ** (digs - 1), 10 ** digs - 1)); b = str(R.randint(10 ** (digs - 1), 10 ** digs - 1))
    for k in ('of', 'what', 'whole'):
        fx, fy = Fraction(a), Fraction(b)
        r = fx * fy / 100 if k == 'of' else fx / fy * 100 if k == 'what' else fx * 100 / fy
        t, ex = text(r, 4)
        out['big'].append([k, a, b, 4, str(r.numerator), str(r.denominator), t, ex])
# conversions
def conv(d, v, places, r, vv=None):
    t, ex = text(r, places)
    out['conv'].append([d, v, places, str(r.numerator), str(r.denominator), t, ex])
for v in ['25', '0', '100', '12.5', '0.5', '150', '-10', '33.333', '7.25%', '0.01', '1000000']:
    f = Fraction(v.rstrip('%')); conv('p2d', v, 'auto', f / 100); conv('p2f', v, 'auto', f / 100)
for v in ['0.75', '0', '1', '0.125', '2.5', '-0.2', '0.333', '0.0005', '12']:
    conv('d2p', v, 'auto', Fraction(v) * 100)
for v, a, b in [('3/4', 3, 4), ('1/3', 1, 3), ('2/3', 2, 3), ('5/8', 5, 8), ('7/2', 7, 2), ('0/9', 0, 9), ('-1/8', -1, 8), ('1/-8', 1, -8), ('1.5/2', Fraction(3, 2), 2), ('22/7', 22, 7), ('9/4', 9, 4), ('1 / 6', 1, 6)]:
    conv('f2p', v, 'auto', Fraction(a) / Fraction(b) * 100)
for _ in range(120):
    a, b = R.randint(-40, 400), R.randint(1, 400)
    conv('f2p', '%d/%d' % (a, b), R.choice(PL), Fraction(a, b) * 100)
    v = num(); conv('p2d', v, R.choice(PL), Fraction(v) / 100)
    v = num(); conv('d2p', v, R.choice(PL), Fraction(v) * 100)
# errors: each of these must be refused with a message (empty ones are flagged empty, not an error message)
out['err'] = [
    ['calc', 'of', '', ''], ['calc', 'of', '20', ''], ['calc', 'of', '', '150'], ['calc', 'what', '45', '0'], ['calc', 'what', '0', '0'], ['calc', 'whole', '45', '0'], ['calc', 'whole', '0', '0'],
    ['calc', 'of', 'abc', '5'], ['calc', 'of', '5', 'x'], ['calc', 'of', '1,000', '5'], ['calc', 'of', '5', '1,5'], ['calc', 'of', '1..2', '5'], ['calc', 'of', '--5', '5'], ['calc', 'of', '5', '.'],
    ['calc', 'of', '-', '5'], ['calc', 'of', '1e3', '5'], ['calc', 'of', '5', 'Infinity'], ['calc', 'of', '5', 'NaN'], ['calc', 'of', '1/2', '5'], ['calc', 'of', '5%', '5%'], ['calc', 'what', '5%', '5'],
    ['calc', 'whole', '5%', '5%'], ['calc', 'of', '1' * 401, '5'], ['calc', 'of', '5', '0.' + '1' * 400], ['calc', 'of', '5 5', '5'], ['calc', 'of', '5', '5 %5'],
    ['conv', 'f2p', '', ''], ['conv', 'f2p', '3', ''], ['conv', 'f2p', '3/0', ''], ['conv', 'f2p', '3/', ''], ['conv', 'f2p', '/4', ''], ['conv', 'f2p', '1/2/3', ''], ['conv', 'f2p', 'a/b', ''],
    ['conv', 'p2d', '', ''], ['conv', 'p2d', 'abc', ''], ['conv', 'p2d', '1,5', ''], ['conv', 'd2p', '', ''], ['conv', 'd2p', '50%', ''], ['conv', 'd2p', '0.1.2', ''], ['conv', 'p2f', '', ''], ['conv', 'p2f', '12.5.1', ''],
]
out['empty'] = [['calc', 'of', '', ''], ['calc', 'of', '20', ''], ['calc', 'of', '', '150'], ['conv', 'f2p', '', ''], ['conv', 'p2d', '', ''], ['conv', 'd2p', '', ''], ['conv', 'p2f', '', '']]
json.dump(out, open('percent_basic_vectors.json', 'w'), separators=(',', ':'))
print('calc %d, big %d, conv %d, err %d' % (len(out['calc']), len(out['big']), len(out['conv']), len(out['err'])))
