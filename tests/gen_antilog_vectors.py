"""Independent vectors for the Antilog Calculator, Log Calculator Mode 02 (tools/antilog_engine.js).
Expected values come from mpmath (100-digit exp and log) and sympy (exact rational powers), never from the engine.
Each row: [b text, y text, status, exact text or null, 30 significant digits of x, decimal exponent E of x]
status: rational | irrational (b = e is irrational for every y except 0).
Run: python3 tests/gen_antilog_vectors.py  ->  tests/antilog_vectors.json"""
import json, random, sys
sys.set_int_max_str_digits(0)
from fractions import Fraction as Fr
import sympy as sp
import mpmath as mp
mp.mp.dps = 110
R = random.Random(20261123)

def txt(q): return str(q.numerator) if q.denominator == 1 else '%d/%d' % (q.numerator, q.denominator)

def digits30(x):
    # x > 0 mpf -> (30 significant digits as text, exponent E) with x = d.ddd * 10^E, rounded half up at the 30th digit
    E = int(mp.floor(mp.log10(x) + mp.mpf(10) ** -70))
    m = x / mp.mpf(10) ** E
    if m < 1: m *= 10; E -= 1
    if m >= 10: m /= 10; E += 1
    n = int(mp.floor(m * mp.mpf(10) ** 29 + mp.mpf(1) / 2))
    s = str(n)
    if len(s) > 30: s = s[:30]; E += 1
    return s, E


def exactness(b, y):
    """rational iff numerator and denominator of b are both perfect q-th powers (sympy integer_nthroot); small cases are also checked against sympy's own Rational power."""
    p, q = y.numerator, y.denominator
    if p == 0: return 'rational', '1'
    n, d = b.numerator, b.denominator
    if q == 1: rn, rd, ok = n, d, True
    else:
        rn, e1 = sp.integer_nthroot(n, q); rd, e2 = sp.integer_nthroot(d, q); ok = bool(e1 and e2)
    if not ok:
        if len(str(n)) + len(str(d)) <= 40 and abs(p) <= 400: assert not (sp.Rational(n, d) ** sp.Rational(p, q)).is_Rational, (b, y)
        return 'irrational', None
    size = (len(str(rn)) + len(str(rd))) * abs(p)
    if size > 800: return 'rational', 'long'
    x = Fr(rn, rd) ** p
    s = sp.Rational(n, d) ** sp.Rational(p, q)
    assert s.is_Rational and s.p == x.numerator and s.q == x.denominator, (b, y)
    return 'rational', txt(x)

def row(b, y):
    # b: Fraction or 'e'; y: Fraction
    if b == 'e':
        x = mp.exp(mp.mpf(y.numerator) / y.denominator)
        st, ex = ('rational', '1') if y == 0 else ('irrational', None)
        bt = 'e'
    else:
        bm = mp.mpf(b.numerator) / b.denominator
        x = mp.exp(mp.mpf(y.numerator) / y.denominator * mp.log(bm))
        st, ex = exactness(b, y)
        bt = txt(b)
    d, E = digits30(x)
    return [bt, txt(y), st, ex, d, E]

rows = []
def add(b, y):
    rows.append(row(Fr(b) if b != 'e' else 'e', Fr(y)))

# the CEO note and named cases
for b, y in [(10, 3), ('e', 2), (2, 5), (3, 4), (10, 0), (2, 0), ('e', 0), (10, -2), (2, -3), (10, 1), (2, 10), (10, 6), (4, Fr(1, 2)), (4, Fr(-3, 2)), (8, Fr(2, 3)),
             (Fr(1, 2), 3), (Fr(1, 2), -3), (Fr(1, 3), 2), (5, 3), (10, Fr(4771, 10000)), (10, Fr(5, 2)), (10, Fr(-5, 2)), ('e', 1), ('e', -1), ('e', Fr(1, 2)), (2, Fr(1, 2)), (2, Fr(3, 2)), (9, Fr(1, 2)), (27, Fr(-2, 3))]:
    add(b, y)
# forced exact results: b = (u/v)^q, y = p/q
bases = [Fr(2), Fr(3), Fr(5), Fr(6), Fr(7), Fr(10), Fr(1, 2), Fr(2, 3), Fr(3, 2), Fr(1, 10), Fr(4, 9), Fr(7, 5), Fr(9, 8)]
for _ in range(70):
    u = R.choice(bases); q = R.randint(1, 5); p = R.choice([i for i in range(-9, 10) if i != 0])
    add(u ** q, Fr(p, q))
# random small pairs
small = [Fr(2), Fr(3), Fr(5), Fr(7), Fr(10), Fr(12), Fr(1, 2), Fr(1, 3), Fr(2, 5), Fr(3, 2), Fr(25, 4), Fr(1, 100), Fr(1005, 1000), Fr(11, 10), Fr(123456789, 1000)]
for _ in range(90):
    q = R.choice([1, 1, 2, 3, 4, 5, 7, 8, 10]); add(R.choice(small), Fr(R.randint(-60, 60), q))
# base e, decimals and scientific input
for _ in range(25): add('e', Fr(R.randint(-4000, 4000), R.choice([1, 2, 3, 10, 100, 1000])))
for b, y in [('0.5', '0.4771'), ('1.5', '-2.5'), ('2.5', '3.14159'), ('12.34', '1e-3'), ('1e3', '2.5e1'), ('0.001', '-1.5'), ('1.0000001', '5'), ('1.0000001', '1000000.5'),
             ('1.0000001', '-123456.5'), ('9.999999', '0.0000001'), ('98765432109876543210', '1.5'), ('0.000000000000000000001', '0.25')]:
    add(Fr(b.replace('e', 'e')) if 'e' not in b else Fr(float(b)).limit_denominator(10 ** 6), Fr(y) if 'e' not in y else Fr(float(y)).limit_denominator(10 ** 6))
# extremes (kept as a mantissa and an exponent)
for b, y in [(10, 300), (10, -300), (10, 1000000), (10, -1000000), (2, 1000000), (Fr(1, 2), 1000000), ('e', 10000), ('e', -10000), (7, -100000), (10, 100000000), (3, Fr(1, 1000000)), (10, Fr(1, 3)), (10, Fr(-123456789, 100))]:
    add(b, y)
# rational results beyond the printing limit (the engine reports rational-large: no exact text is compared)
big = [row(Fr(2), Fr(150000))]
json.dump({'ok': rows, 'big': big, 'err': {'b': ['1', '0', '-2', '-0.5', '1/1', '0/5', 'abc', '', '1/0'], 'y': ['abc', '', '1/0', 'e', '1e99999', '--3']}}, open('tests/antilog_vectors.json', 'w'))
print(len(rows), 'rows;', sum(1 for r in rows if r[2] == 'rational'), 'rational')
