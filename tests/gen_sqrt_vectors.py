"""Independent vectors for the Root Calculator, Mode 01 (tools/sqrt_engine.js), the Square Root Calculator.
Written without the engine. The exact form comes from sympy (sp.sqrt of a Rational, which factors the numerator and denominator with its own routine and
rationalises the denominator) and is split into a rational coefficient and a square-free radicand with as_coeff_Mul. The decimal comes from Python's decimal module
(Decimal.sqrt at 200 digits, rounded half up), a different route from the engine's integer square root. Perfect squares are also confirmed with math.isqrt.
Row of V.solve: [typed radicand, places, exact text, perfect (bool), decimal text, floor of the root as text, radicand as an exact fraction text]
  decimal text: for an irrational root, fixed `places` places; for a perfect square, the exact decimal with trailing zeros removed when it ends within 40 places, otherwise `places` places.
Row of V.tiny: [typed radicand, places, true root to 60 significant digits as text, exact text]  (the engine may show more than `places` places for a tiny value)
V.err: [typed radicand, expected complex text or null] for a negative radicand; V.bad: inputs that must be refused as unreadable; V.empty: blank inputs.
Run: python3 tests/gen_sqrt_vectors.py -> tests/sqrt_vectors.json"""
import json, random, math
from fractions import Fraction as Fr
from decimal import Decimal, getcontext, ROUND_HALF_UP
import sympy as sp
getcontext().prec = 220
R = random.Random(20261125)

def txt(q): return str(q.numerator) if q.denominator == 1 else '%d/%d' % (q.numerator, q.denominator)

def exact_form(q):
    """-> (text, perfect)"""
    e = sp.sqrt(sp.Rational(q.numerator, q.denominator))
    c, rest = e.as_coeff_Mul()
    if rest == 1:
        c = Fr(int(c.p), int(c.q)); return txt(c), True
    assert rest.is_Pow and rest.exp == sp.Rational(1, 2), (q, e)
    m = int(rest.base); c = Fr(int(c.p), int(c.q))
    num = ('' if c.numerator == 1 else str(c.numerator)) + '√' + str(m)
    return num + ('' if c.denominator == 1 else '/' + str(c.denominator)), False

def fixed(d, p):
    s = d.quantize(Decimal(1).scaleb(-p), rounding=ROUND_HALF_UP)
    return format(s, 'f')

def dec_text(q, p, perfect):
    d = Decimal(q.numerator) / Decimal(q.denominator)
    r = d.sqrt()
    if not perfect: return fixed(r, p)
    root = Fr(math.isqrt(q.numerator), math.isqrt(q.denominator))
    den = root.denominator
    while den % 2 == 0: den //= 2
    while den % 5 == 0: den //= 5
    places = 0; t = root.denominator
    a = b = 0
    while t % 2 == 0: t //= 2; a += 1
    while t % 5 == 0: t //= 5; b += 1
    if den == 1 and max(a, b) <= 40:
        s = format((Decimal(root.numerator) / Decimal(root.denominator)).quantize(Decimal(1).scaleb(-max(a, b, 0))), 'f') if max(a, b) else str(root.numerator)
        return s
    return fixed(Decimal(root.numerator) / Decimal(root.denominator), p)

def row(typed, q, p=8):
    ex, perf = exact_form(q)
    assert perf == (math.isqrt(q.numerator) ** 2 == q.numerator and math.isqrt(q.denominator) ** 2 == q.denominator)
    fl = math.isqrt(q.numerator // q.denominator)
    return [typed, p, ex, perf, dec_text(q, p, perf), str(fl), txt(q)]

solve, seen = [], set()
def add(typed, q, p=8):
    k = (typed, p)
    if k in seen: return
    seen.add(k); solve.append(row(typed, q, p))

# 1. every whole number 0..400, 8 places
for n in range(0, 401): add(str(n), Fr(n))
# the same numbers at other places
for n in [2, 3, 5, 7, 8, 10, 12, 18, 32, 45, 50, 72, 75, 98, 125, 200, 288, 300, 500, 1000, 4096, 10 ** 6 + 1]:
    for p in [0, 1, 2, 4, 12, 20, 50]: add(str(n), Fr(n), p)
# 2. the note's table and test cases
for t in ['144', '81', '2', '72', '48', '0', '1', '25', '16', '9', '0.125']: add(t, Fr(t))
# 3. decimals
for t in ['0.25', '0.5', '0.04', '1.44', '12.25', '0.0049', '2.5', '0.1', '0.01', '0.0001', '123.456', '1000.5', '0.000001', '99.99', '6.25', '.64', '7.', '00012.25']:
    add(t, Fr(Decimal(t)))
# 4. scientific notation
for t in ['1e6', '1.5e3', '2.5e-3', '4e2', '9E-4', '1e-10', '3e5', '1.44e4', '6.25e-2', '1e0', '5e1', '1e100', '2e-7', '1e-30', '1e-60']:
    add(t, Fr(Decimal(t)))
# 5. fractions and mixed numbers
for t, q in [('3/4', Fr(3, 4)), ('1/2', Fr(1, 2)), ('1/3', Fr(1, 3)), ('9/16', Fr(9, 16)), ('2/3', Fr(2, 3)), ('5/8', Fr(5, 8)), ('1/4', Fr(1, 4)), ('7/9', Fr(7, 9)), ('50/18', Fr(25, 9)), ('0.5/2', Fr(1, 4)),
             ('1.5/2.5', Fr(3, 5)), ('12/27', Fr(4, 9)), ('72/50', Fr(36, 25)), ('2 1/4', Fr(9, 4)), ('1 1/2', Fr(3, 2)), ('3 1/3', Fr(10, 3)), ('10 2/5', Fr(52, 5)), ('4 4/9', Fr(40, 9)), ('1/1000000', Fr(1, 10 ** 6)), ('3/48', Fr(1, 16)),
             ('18/5', Fr(18, 5)), ('7/50', Fr(7, 50)), ('1e3/4', Fr(250)), ('8/9', Fr(8, 9)), ('1/72', Fr(1, 72)), ('11/12', Fr(11, 12))]:
    add(t, q)
for i in range(120):
    n, d = R.randint(1, 400), R.randint(1, 400); q = Fr(n, d); add('%d/%d' % (n, d), q)
for i in range(40):
    a, b = R.randint(1, 30), R.randint(1, 30); n, d = a * a * R.choice([1, 1, 2, 3, 5, 6, 7]), b * b * R.choice([1, 1, 2, 3, 5, 6, 7]); add('%d/%d' % (n, d), Fr(n, d))
for i in range(30):
    w, n, d = R.randint(1, 40), R.randint(1, 9), R.randint(2, 12)
    if n >= d: continue
    add('%d %d/%d' % (w, n, d), w + Fr(n, d))
# 6. random decimals
for i in range(60):
    sc = R.randint(1, 6); v = R.randint(1, 10 ** R.randint(2, 9)); s = str(v).rjust(sc + 1, '0'); t = s[:-sc] + '.' + s[-sc:]
    add(t, Fr(t))
# 7. perfect squares of fractions and decimals built from a root
for i in range(60):
    a, b = R.randint(1, 3000), R.randint(1, 3000); g = math.gcd(a, b); q = Fr(a * a, b * b); add('%d/%d' % (a * a, b * b), q)
for i in range(30):
    v = R.randint(1, 9999); t = '%d.%s' % (v * v // 10 ** 4, str(v * v % 10 ** 4).rjust(4, '0')); add(t, Fr(t))
# 8. large integers: k^2 * m with m small, plus perfect squares and 25 to 60 digit values
for i in range(60):
    k = R.randint(10 ** 3, 10 ** R.choice([6, 9, 12])); m = R.choice([1, 2, 3, 5, 6, 7, 10, 11, 13, 14, 15, 17, 19, 21, 22, 23, 26, 29, 30, 31, 33, 34, 35, 37, 38, 39, 41, 42, 43, 46, 47, 51, 53, 55, 57, 58, 59, 61, 62, 65, 66, 67, 69, 70, 71, 73, 74, 77, 78, 79])
    n = k * k * m; add(str(n), Fr(n))
for i in range(12):
    k = R.randint(10 ** 10, 10 ** 28); add(str(k * k), Fr(k * k))
for i in range(12):
    n = R.randint(10 ** 20, 10 ** 40); add(str(n), Fr(n), 12)
for i in range(6):
    n = R.randint(10 ** 40, 10 ** 59); add(str(n), Fr(n), 6)
# 9. places in the middle of a long decimal
for p in [3, 5, 7, 9, 10, 11, 13, 15, 30]: add('2', Fr(2), p); add('3', Fr(3), p); add('10', Fr(10), p)

# tiny and huge exponent values: the engine may show more places than asked
tiny = []
for t in ['2e-30', '1e-61', '5e-100', '0.000000000000000000000000000003', '1e-299', '7e-250']:
    q = Fr(Decimal(t)); r = (Decimal(q.numerator) / Decimal(q.denominator)).sqrt()
    tiny.append([t, 8, format(r, '.60e'), exact_form(q)[0]])

err = []
for t in ['-9', '-1', '-2', '-72', '-0.25', '-1/4', '-3/4', '-2 1/4', '-1e4', '-0.0001', '-8', '−9', '-50']:
    q = Fr(Decimal(t.replace('−', '-'))) if '/' not in t else None
    if q is None:
        s = t.replace('-', '').replace('−', ''); parts = s.split(' ')
        q = (Fr(parts[0]) + Fr(parts[1])) if len(parts) == 2 else Fr(parts[0])
    ex, perf = exact_form(abs(q))
    cx = 'i' if ex == '1' else (ex + ' i' if perf else 'i × ' + ex)
    err.append([t, cx])
bad = ['abc', '1..2', '1/0', '1/2/3', '--4', '4x', '12 3', '1e', 'e5', '√4', 'sqrt(4)', '1e301', '1' * 61, '0x10', '1,2,3.5.6', 'NaN', 'Infinity', '1e999']
empty = ['', '   ', '\t']
V = {'solve': solve, 'tiny': tiny, 'err': err, 'bad': bad, 'empty': empty}
json.dump(V, open('tests/sqrt_vectors.json' if __import__('os').path.isdir('tests') else 'sqrt_vectors.json', 'w'), ensure_ascii=False)
print(len(solve), 'solve rows,', len(tiny), 'tiny,', len(err), 'negative,', len(bad), 'bad')
