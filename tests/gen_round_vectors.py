#!/usr/bin/env python3
"""Independent reference vectors for the Rounding Calculator, Mode 01 (tools/round_engine.js).
Written from the definitions of the rounding rules, without reading the engine. Every expected value is computed two ways that must agree:
  route A: decimal.Decimal.quantize with the matching rounding mode (away = ROUND_HALF_UP, toward0 = ROUND_HALF_DOWN, even = ROUND_HALF_EVEN,
           ceiling = ROUND_CEILING, floor = ROUND_FLOOR, truncate = ROUND_DOWN); half to odd, half towards +inf and half towards -inf have no
           Decimal mode, so route A picks between the floor and ceiling quantisations with the stated tie rule;
  route B: fractions.Fraction, scaling by 10^p, taking floor and ceiling of the exact rational and choosing by the rule.
The floating-point note is checked against Python's exact value of the binary double (Decimal(float)) rounded half up.
Run: python3 tests/gen_round_vectors.py   (writes tests/round_vectors.json)"""
import json, random
from decimal import Decimal, Context, ROUND_HALF_UP, ROUND_HALF_DOWN, ROUND_HALF_EVEN, ROUND_CEILING, ROUND_FLOOR, ROUND_DOWN
from fractions import Fraction
import math

CTX = Context(prec=4000, Emax=999999, Emin=-999999)
RULES = ['away', 'toward0', 'even', 'odd', 'posinf', 'neginf', 'ceiling', 'floor', 'truncate']
MODE = {'away': ROUND_HALF_UP, 'toward0': ROUND_HALF_DOWN, 'even': ROUND_HALF_EVEN, 'ceiling': ROUND_CEILING, 'floor': ROUND_FLOOR, 'truncate': ROUND_DOWN}

def dec(text):
    return Decimal(text.replace(',', ''))

def route_a(x, p, rule):
    q = Decimal(1).scaleb(-p)
    if rule in MODE:
        return x.quantize(q, rounding=MODE[rule], context=CTX)
    lo = x.quantize(q, rounding=ROUND_FLOOR, context=CTX); hi = x.quantize(q, rounding=ROUND_CEILING, context=CTX)
    if lo == hi: return lo
    dl, dh = x - lo, hi - x
    if dl < dh: return lo
    if dh < dl: return hi
    # exact tie
    if rule == 'posinf': return hi
    if rule == 'neginf': return lo
    # odd: the neighbour whose last kept digit is odd
    n_lo = int(lo.scaleb(p))
    return lo if n_lo % 2 != 0 else hi

def route_b(x, p, rule):
    fx = Fraction(x) * (Fraction(10) ** p)
    lo, hi = math.floor(fx), math.ceil(fx)
    if lo == hi: n = lo
    else:
        dl, dh = fx - lo, hi - fx
        if rule == 'ceiling': n = hi
        elif rule == 'floor': n = lo
        elif rule == 'truncate': n = lo if fx > 0 else hi
        elif dl < dh: n = lo
        elif dh < dl: n = hi
        elif rule == 'away': n = hi if fx > 0 else lo
        elif rule == 'toward0': n = lo if fx > 0 else hi
        elif rule == 'even': n = lo if lo % 2 == 0 else hi
        elif rule == 'odd': n = lo if lo % 2 != 0 else hi
        elif rule == 'posinf': n = hi
        elif rule == 'neginf': n = lo
        else: raise ValueError(rule)
    return Fraction(n) / (Fraction(10) ** p)

def fmt(d, keep, p):
    """Decimal d (already quantised at p) as text: p >= 0 keeps or strips the trailing decimal zeros; p < 0 is a plain integer. No negative zero."""
    if d == 0: d = abs(d)
    s = format(d, 'f')
    if p > 0 and not keep and '.' in s: s = s.rstrip('0').rstrip('.')
    return s

def plain(d):
    if d == 0: return '0'
    return format(CTX.normalize(d), 'f')

def case(text, p, rule):
    x = dec(text)
    a = route_a(x, p, rule)
    b = route_b(x, p, rule)
    assert Fraction(a) == b, (text, p, rule, a, b)
    # quantisation of the exact result: Decimal(Fraction) via integer arithmetic for the scaled integer
    r = a
    if p < 0: r = r.quantize(Decimal(1), context=CTX) if r == r.to_integral_value() else r
    d = CTX.subtract(r, x)  # exact: the context has 4000 digits (the default 28-digit context would round the difference)
    fd = Fraction(r) - Fraction(x)
    assert Fraction(d) == fd, (text, p, rule)
    direction = 'up' if fd > 0 else 'down' if fd < 0 else 'none'
    fx = Fraction(x) * (Fraction(10) ** p)
    exact = fx.denominator == 1
    tie = (not exact) and (fx - math.floor(fx) == Fraction(1, 2))
    res_keep = fmt(a, True, p); res_min = fmt(a, False, p)
    if p < 0:
        res_keep = res_min = str(int(b))  # p < 0: b is a whole number
    return [text, p, rule, res_keep, res_min, plain(d.copy_abs()), direction, tie, exact]

random.seed(20261124)
cases = []
def add(text, p):
    for r in RULES: cases.append(case(text, p, r))

# the CEO note
for t, p in [('15.496', 2), ('2.675', 2), ('3.14159265', 3), ('1499', -2), ('1,499', -1), ('1,499', -2), ('1,499', -3), ('12,345', -2), ('-2.5', 0), ('8.999', 0), ('-2.1', 0), ('37', -1), ('230.4567', 0), ('230.4567', 1), ('230.4567', 2), ('230.4567', 3), ('0.004876', 5), ('1234.567', 0), ('15.65', 2), ('12.39', 1)]:
    add(t, p)
# ties at many places and signs
for n in range(-12, 13): add('%d.5' % n if n >= 0 else '-%d.5' % -n, 0)
for t in ['0.5', '-0.5', '1.5', '-1.5', '2.5', '-2.5', '0.05', '-0.05', '0.15', '0.25', '0.35', '-0.45', '1.005', '-1.005', '2.675', '-2.675', '0.125', '0.375', '10.5', '99.5', '-99.5', '1000.5']:
    for p in (0, 1, 2, 3): add(t, p)
for t in ['5', '15', '25', '35', '45', '-15', '-25', '125', '-125', '250', '350', '1500', '2500', '-2500', '45000', '5000', '-5000']:
    for p in (-1, -2, -3): add(t, p)
# carry propagation, near-ties, zero results
for t in ['9.995', '9.9949', '99.99', '0.9999', '999.5', '-9.995', '0.0999', '9999.9999', '0.0000999', '-0.0000999', '99999.5', '1.999999', '0.0004', '-0.0004', '-0.001', '-0.0049', '0.0051', '0.00', '0', '-0', '0.000']:
    for p in (0, 1, 2, 3, 4): add(t, p)
for t in ['0.0004', '-0.4', '4', '-4', '6', '149', '151', '-149', '-151', '999', '9500', '95', '-95']:
    for p in (-1, -2, -3, -4): add(t, p)
# precision beyond the digits (trailing zeros) and whole numbers
for t in ['15.5', '15', '-15.25', '0.1', '100', '0', '7.125']:
    for p in (0, 3, 6, 10): add(t, p)
# scientific notation and comma input
for t in ['1.5e3', '1.5E3', '1.5e-3', '-2.675e0', '1e2', '1.25e-2', '9.995e1', '1.2345e5', '2.5e0', '3e-1', '123456e-3', '1e0', '5e-1', '0.5e1']:
    for p in (-3, -2, -1, 0, 1, 2, 3): add(t, p)
for t in ['1,000', '12,345.678', '-1,234,567.891', '999,999.995']:
    for p in (-3, -1, 0, 2): add(t, p)
# random decimals
for _ in range(140):
    ip = random.randint(0, 10 ** random.randint(0, 9)); fp = random.randint(0, 10 ** random.randint(1, 9) - 1)
    k = random.randint(1, 9); t = '%d.%s' % (ip, str(fp).zfill(k)[-k:])
    if random.random() < 0.35: t = '-' + t
    p = random.randint(-4, 8)
    add(t, p)
# random ties constructed exactly: (m + 0.5) * 10^-p
for _ in range(70):
    p = random.randint(-3, 6); m = random.randint(0, 10 ** 6)
    s = Fraction(2 * m + 1, 2) * (Fraction(10) ** (-p))
    d = Decimal(s.numerator) / Decimal(s.denominator) if s.denominator != 1 else Decimal(s.numerator)
    t = format(d, 'f')
    if random.random() < 0.5: t = '-' + t
    add(t, p)
# very small and very large
for t in ['0.000000000000000000000000000001', '0.000000000000000000000000000005', '-0.0000000000000000000000000000049', '1e-30', '5e-31', '4.9999e-31', '123456789012345678901234567890.5', '123456789012345678901234567890.4999999999', '99999999999999999999999999999.9999', '1e30', '-1e30', '9.5e29', '1e1000', '1e-1000', '-5e-1000']:
    for p in (-30, -5, -1, 0, 1, 5, 30, 31): add(t, p)
for t in ['1e-1000', '-5e-1000', '1e1000', '9.5e999']:
    for p in (-1000, 0, 1000):
        for r in ('away', 'even', 'ceiling', 'floor'): cases.append(case(t, p, r))
# long numbers (up to the 1000 digit limit)
for n in (60, 300, 1000):
    for _ in range(2 if n < 1000 else 1):
        digs = str(random.randint(1, 9)) + ''.join(random.choice('0123456789') for _ in range(n - 1))
        cut = random.randint(1, n - 1); t = digs[:cut] + '.' + digs[cut:]
        for p in (-3, 0, 2, 40):
            for r in ('away', 'even', 'ceiling', 'truncate', 'odd'): cases.append(case(t, p, r))
cases_flat = cases

# floating-point comparison vectors
def float_case(text, p):
    x = dec(text); f = float(text.replace(',', ''))
    exact_away = fmt(route_a(x, p, 'away'), True, p)
    ex = Decimal(f)  # exact value of the binary double
    fl = fmt(ex.quantize(Decimal(1).scaleb(-p), rounding=ROUND_HALF_UP, context=CTX), True, p)
    differs = (fl != exact_away)
    return [text, p, differs, fl if differs else None, format(CTX.normalize(ex), 'f') if differs else None]
floats = []
for t in ['2.675', '1.005', '1.015', '1.025', '2.5', '0.125', '0.285', '8.345', '1.45', '4.35', '0.615', '-2.675', '-1.005', '15.496', '3.14159265', '0.1', '0.3', '1.255', '5.015', '10.075', '-0.005', '-0.001', '0.5', '100.5', '230.4567', '1234.5675', '0.0049999', '1e-7', '5e-7']:
    for p in (0, 1, 2, 3, 4, 5, 6, 8):
        floats.append(float_case(t, p))
for _ in range(150):
    t = '%d.%s' % (random.randint(0, 10000), str(random.randint(0, 10 ** 5)).zfill(5)); p = random.randint(0, 4)
    floats.append(float_case(t, p))

errs = ['abc', '1/8', '1,5', '1,50', '12,34,567', '1..2', '--1', '1e', 'e5', '1e1001', '1e-1001', 'NaN', 'Infinity', '-inf', '1 2', '.', '+', '$5', '5%', '1.5.2', '0x10', '1,2345', ',5', '5,', '1' * 1001]
bad_places = ['x', '1.5', '2.0', '1001', '-1001', '1e2', '--1', ' ', '0.5', 'two']
empty = ['', '   ']
print(len(cases_flat), 'rounding cases;', len(floats), 'float cases;', sum(1 for f in floats if f[2]), 'float disagreements')
json.dump({'cases': cases_flat, 'floats': floats, 'err': errs, 'badPlaces': bad_places, 'empty': empty}, open('tests/round_vectors.json', 'w'), separators=(',', ':'))
