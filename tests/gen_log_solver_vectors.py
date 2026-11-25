"""Independent vectors for the Missing Value Solver, Log Calculator Mode 03 (tools/log_solver_engine.js), the base case b^y = x.
Expected values come from mpmath (100-digit exp and log) and sympy (integer_nthroot, exact Rational powers), never from the engine.
Each row: [x text, y text, class, exact b text or null, 30 significant digits of b, decimal exponent E of b]
class: unique (b = x^(1/y), b > 0, b != 1) | none (x = 1 with y != 0, or y = 0 with x != 1) | indeterminate (x = 1 and y = 0).
Also rows for solving x (b, y) and y (b, x) are covered by tests/antilog_vectors.json and tests/log_vectors.json, which this test re-uses.
Run: python3 tests/gen_log_solver_vectors.py  ->  tests/log_solver_vectors.json"""
import json, random, sys
sys.set_int_max_str_digits(0)
from fractions import Fraction as Fr
import sympy as sp
import mpmath as mp
mp.mp.dps = 110
R = random.Random(20261124)

def txt(q): return str(q.numerator) if q.denominator == 1 else '%d/%d' % (q.numerator, q.denominator)

def digits30(v):
    E = int(mp.floor(mp.log10(v) + mp.mpf(10) ** -70))
    m = v / mp.mpf(10) ** E
    if m < 1: m *= 10; E -= 1
    if m >= 10: m /= 10; E += 1
    n = int(mp.floor(m * mp.mpf(10) ** 29 + mp.mpf(1) / 2))
    s = str(n)
    if len(s) > 30: s = s[:30]; E += 1
    return s, E

def exact_base(x, y):
    """b = x^(q/p) rational iff num and den of x (swapped when p < 0) are perfect |p|-th powers."""
    p, q = y.numerator, y.denominator
    n, d = x.numerator, x.denominator
    if p < 0: n, d = d, n
    ap = abs(p)
    rn, e1 = sp.integer_nthroot(n, ap); rd, e2 = sp.integer_nthroot(d, ap)
    if not (e1 and e2):
        if len(str(n)) + len(str(d)) <= 40 and ap <= 40 and q <= 40: assert not (sp.Rational(x.numerator, x.denominator) ** sp.Rational(q, p)).is_Rational, (x, y)
        return None
    b = Fr(rn, rd) ** q
    if len(str(b.numerator)) + len(str(b.denominator)) > 800: return 'long'
    s = sp.Rational(x.numerator, x.denominator) ** sp.Rational(q, p)
    assert s.is_Rational and s.p == b.numerator and s.q == b.denominator, (x, y)
    return txt(b)

def row(x, y):
    if x == 'e':
        bm = mp.exp(mp.mpf(y.denominator) / y.numerator); ex = None; xt = 'e'
        if y == 1: ex = 'e'
    else:
        xm = mp.mpf(x.numerator) / x.denominator
        bm = mp.exp(mp.log(xm) * y.denominator / y.numerator)
        ex = exact_base(x, y); xt = txt(x)
    d, E = digits30(bm)
    return [xt, txt(y), 'unique', ex, d, E]

rows = []
def add(x, y):
    if x != 'e' and x == 1: return
    rows.append(row(Fr(x) if x != 'e' else 'e', Fr(y)))

for x, y in [(125, 3), (64, 6), (9, 2), (8, -3), (2, Fr(1, 2)), (10, Fr(1, 2)), (1000, 3), (1024, 10), (Fr(1, 8), 3), (Fr(1, 8), -3), (Fr(8, 27), 3), (Fr(8, 27), -3), (81, Fr(4, 3)), (Fr(1, 4), -2),
             (2, 3), (3, 2), (5, 2), (7, Fr(2, 3)), (10, Fr(1, 3)), (3, Fr(2, 3)), (2, 1), (2, -1), (5, 1), (Fr(2, 3), 1), ('e', 2), ('e', 1), ('e', -1), ('e', 3), ('e', Fr(1, 2)), ('e', Fr(-2, 3)), (1000000, 6), (Fr(1, 1000), 3)]:
    add(x, y)
bases = [Fr(2), Fr(3), Fr(5), Fr(6), Fr(7), Fr(10), Fr(1, 2), Fr(2, 3), Fr(3, 2), Fr(1, 10), Fr(4, 9), Fr(7, 5), Fr(9, 8), Fr(12)]
# forced exact: b = u^q, y = p/q, x = u^p, so b^y = u^p = x
for _ in range(110):
    u = R.choice(bases); q = R.randint(1, 5); p = R.choice([i for i in range(-9, 10) if i != 0])
    add(u ** p, Fr(p, q))
# whole-number y: x = b^y
for _ in range(50):
    b = R.choice(bases); y = R.choice([i for i in range(-7, 8) if i != 0])
    add(b ** y, Fr(y))
for _ in range(90):
    q = R.choice([1, 1, 2, 3, 4, 5, 7, 8]); p = R.choice([i for i in range(-60, 61) if i != 0])
    add(R.choice([Fr(2), Fr(3), Fr(5), Fr(7), Fr(10), Fr(12), Fr(1, 2), Fr(1, 3), Fr(2, 5), Fr(3, 2), Fr(25, 4), Fr(1, 100), Fr(1005, 1000), Fr(11, 10), Fr(123456789, 1000)]), Fr(p, q))
for _ in range(25): add('e', Fr(R.choice([i for i in range(-4000, 4001) if i != 0]), R.choice([1, 2, 3, 10, 100, 1000])))
# decimals and scientific input are covered in the test through text rows
text_rows = []
for xt, yt, xf, yf in [('0.125', '-3', Fr(1, 8), Fr(-3)), ('1.5', '-2.5', Fr(3, 2), Fr(-5, 2)), ('1e3', '3', Fr(1000), Fr(3)), ('1e-3', '-1.5', Fr(1, 1000), Fr(-3, 2)), ('2 1/4', '2', Fr(9, 4), Fr(2)), ('1,000', '0.5', Fr(1000), Fr(1, 2)), ('0.001', '1e-3', Fr(1, 1000), Fr(1, 1000))]:
    r = row(xf, yf); r[0] = xt; r[1] = yt; text_rows.append(r)

err = {'x': ['0', '-4', '-0.5', 'abc', '1/0', '1 2'], 'y': ['e', 'abc', '1/0', '1..2'], 'b': ['0', '1', '-2', '1/1', 'x']}
json.dump({'ok': rows, 'text': text_rows, 'err': err}, open(__file__.replace('gen_log_solver_vectors.py', 'log_solver_vectors.json'), 'w'))
print(len(rows), 'rows', len(text_rows), 'text rows')
