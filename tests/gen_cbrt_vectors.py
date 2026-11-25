"""Independent vectors for the Root Calculator, Mode 02 (tools/cbrt_engine.js), the Cube Root Calculator.
Written without the engine. The exact form is built from sympy.factorint of n*d^2 (cbrt(n/d) = cbrt(n*d^2)/d, split into s^3 * r with r cube-free) and every
form is then confirmed against sympy's own sp.root(q, 3) numerically to 120 digits. The decimal comes from mpmath (mp.cbrt at 260 digits) and is cross-checked against
Python's decimal module (Decimal ** (1/3) at 220 digits), two different routes from the engine's integer cube root, rounded half up. Perfect cubes are also confirmed
with sympy.integer_nthroot.
Row of V.solve: [typed radicand, places, exact text, perfect (bool), decimal text, floor of |root| as text, radicand as an exact (signed) fraction text]
  decimal text: for an irrational root, fixed `places` places; for a perfect cube, the exact decimal with trailing zeros removed when it ends within 100 places, otherwise `places` places.
  A negative radicand gives the negative real root: exact and decimal carry a leading minus sign.
Row of V.tiny: [typed radicand, places, true |root| to 60 significant digits as text, exact text, negative (bool)]  (the engine may show more than `places` places for a tiny value)
V.bad: inputs that must be refused as unreadable; V.empty: blank inputs.
Run: python3 tests/gen_cbrt_vectors.py -> tests/cbrt_vectors.json"""
import json, random, math
from fractions import Fraction as Fr
from decimal import Decimal, getcontext, ROUND_HALF_UP
import sympy as sp
import mpmath as mp
getcontext().prec = 220
mp.mp.dps = 260
R = random.Random(20261126)

def txt(q): return str(q.numerator) if q.denominator == 1 else '%d/%d' % (q.numerator, q.denominator)

def exact_form(q):
    """-> (text, perfect) for the real cube root of the signed rational q"""
    neg = q < 0; a = abs(q); n, d = a.numerator, a.denominator
    if n == 0: return '0', True
    fi = sp.factorint(n * d * d)
    s = 1; r = 1
    for p_, e in fi.items(): s *= p_ ** (e // 3); r *= p_ ** (e % 3)
    c = Fr(s, d)
    # confirm with sympy's own cube root, numerically, to 120 digits
    chk = sp.N(sp.root(sp.Rational(n, d), 3) - sp.Rational(c.numerator, c.denominator) * sp.root(r, 3), 120)
    assert abs(chk) < sp.Float('1e-100'), (q, chk)
    ps = sp.integer_nthroot(n, 3)[1] and sp.integer_nthroot(d, 3)[1]
    assert ps == (r == 1), (q, ps, r)
    sign = '-' if neg else ''
    if r == 1: return sign + txt(c), True
    num = ('' if c.numerator == 1 else str(c.numerator)) + '∛' + str(r)
    return sign + num + ('' if c.denominator == 1 else '/' + str(c.denominator)), False

def fixed(x, p):
    return format(Decimal(x).quantize(Decimal(1).scaleb(-p), rounding=ROUND_HALF_UP), 'f')

def true_root(a):
    """cbrt of a positive Fraction as a Decimal (220 digits), cross-checked against mpmath"""
    d1 = (Decimal(a.numerator) / Decimal(a.denominator)) ** (Decimal(1) / Decimal(3))
    m = mp.cbrt(mp.mpf(a.numerator) / mp.mpf(a.denominator))
    d2 = Decimal(mp.nstr(m, 230))
    assert abs(d1 - d2) < Decimal(10) ** (-int(abs(d1.adjusted())) - 0) * Decimal(10) ** (-150) or abs(d1 - d2) < Decimal(10) ** -150 * max(1, abs(d1)), (a, d1, d2)
    return d2

def dec_text(q, p, perfect):
    a = abs(q); neg = q < 0
    if perfect:
        root = Fr(sp.integer_nthroot(a.numerator, 3)[0], sp.integer_nthroot(a.denominator, 3)[0])
        t = root.denominator; x = y = 0
        while t % 2 == 0: t //= 2; x += 1
        while t % 5 == 0: t //= 5; y += 1
        if t == 1 and max(x, y) <= 100:
            pl = max(x, y)
            s = format(Decimal(root.numerator) / Decimal(root.denominator), 'f') if pl == 0 else format((Decimal(root.numerator) / Decimal(root.denominator)).quantize(Decimal(1).scaleb(-pl)), 'f')
            r = s
        else:
            r = fixed(Decimal(root.numerator) / Decimal(root.denominator), p)
        return ('-' + r) if (neg and a != 0) else r
    r = fixed(true_root(a), p)
    return ('-' + r) if neg else r

def row(typed, q, p=8):
    ex, perf = exact_form(q)
    a = abs(q)
    fl = sp.integer_nthroot(a.numerator // a.denominator, 3)[0]
    return [typed, p, ex, perf, dec_text(q, p, perf), str(fl), txt(q)]

solve, seen = [], set()
def add(typed, q, p=8):
    k = (typed, p)
    if k in seen: return
    seen.add(k); solve.append(row(typed, q, p))

# 1. every whole number -400..400, 8 places
for n in range(-400, 401): add(str(n), Fr(n))
# every perfect cube up to 40^3 and its negative
for k in range(1, 41): add(str(k ** 3), Fr(k ** 3)); add(str(-k ** 3), Fr(-k ** 3))
# the same numbers at other places
for n in [2, 3, 5, 7, 9, 10, 12, 16, 24, 32, 54, 72, 100, 128, 250, 500, 1000, 4096, 10 ** 6 + 1, -2, -5, -10, -54, -100]:
    for p in [0, 1, 2, 4, 12, 20, 50]: add(str(n), Fr(n), p)
# 2. the note's table and test cases
for t in ['8', '27', '64', '125', '216', '-8', '-27', '0.125', '1', '0', '2', '54', '-0.125', '3', '10']: add(t, Fr(t))
# 3. decimals
for t in ['0.125', '0.5', '0.008', '1.331', '15.625', '0.001', '2.5', '0.1', '0.027', '0.000001', '123.456', '1000.5', '0.000000001', '99.99', '3.375', '.512', '7.', '00027.000', '-0.125', '-0.001', '-1.728', '-2.5', '-0.5', '-123.456']:
    add(t, Fr(Decimal(t)))
# 4. scientific notation
for t in ['1e6', '1.5e3', '2.5e-3', '8e3', '27E-6', '1e-9', '3e5', '1.331e3', '6.4e-2', '1e0', '5e1', '1e99', '2e-7', '1e-30', '1e-60', '-1e6', '-8e-3', '-2.7e4', '1e100', '1e-99']:
    add(t, Fr(Decimal(t)))
# 5. fractions and mixed numbers
for t, q in [('3/4', Fr(3, 4)), ('1/2', Fr(1, 2)), ('1/3', Fr(1, 3)), ('1/8', Fr(1, 8)), ('27/64', Fr(27, 64)), ('2/3', Fr(2, 3)), ('5/8', Fr(5, 8)), ('1/4', Fr(1, 4)), ('7/9', Fr(7, 9)), ('16/54', Fr(8, 27)), ('0.5/4', Fr(1, 8)),
             ('1.5/2.5', Fr(3, 5)), ('250/2', Fr(125)), ('2 1/4', Fr(9, 4)), ('1 1/2', Fr(3, 2)), ('3 1/3', Fr(10, 3)), ('10 2/5', Fr(52, 5)), ('3 3/8', Fr(27, 8)), ('1/1000000', Fr(1, 10 ** 6)), ('3/24', Fr(1, 8)),
             ('18/5', Fr(18, 5)), ('7/50', Fr(7, 50)), ('1e3/4', Fr(250)), ('8/9', Fr(8, 9)), ('1/72', Fr(1, 72)), ('11/12', Fr(11, 12)), ('5/12', Fr(5, 12)), ('16/3', Fr(16, 3)), ('3/8', Fr(3, 8)), ('1/54', Fr(1, 54)),
             ('-1/2', Fr(-1, 2)), ('-3/4', Fr(-3, 4)), ('-1/8', Fr(-1, 8)), ('-27/64', Fr(-27, 64)), ('-2 1/4', Fr(-9, 4)), ('-3 3/8', Fr(-27, 8)), ('-5/12', Fr(-5, 12)), ('-16/3', Fr(-16, 3)), ('-8/27', Fr(-8, 27)), ('-2/3', Fr(-2, 3))]:
    add(t, q)
for i in range(120):
    n, d = R.randint(1, 400), R.randint(1, 400); sg = R.choice([1, -1]); add('%d/%d' % (sg * n, d), Fr(sg * n, d))
for i in range(40):
    a, b = R.randint(1, 30), R.randint(1, 30); n, d = a ** 3 * R.choice([1, 1, 2, 3, 5, 6, 7, 9]), b ** 3 * R.choice([1, 1, 2, 3, 4, 5, 7]); sg = R.choice([1, -1]); add('%d/%d' % (sg * n, d), Fr(sg * n, d))
for i in range(30):
    w, n, d = R.randint(1, 40), R.randint(1, 9), R.randint(2, 12)
    if n >= d: continue
    sg = R.choice([1, -1]); add('%s%d %d/%d' % ('-' if sg < 0 else '', w, n, d), sg * (w + Fr(n, d)))
# 6. random decimals
for i in range(60):
    sc = R.randint(1, 6); v = R.randint(1, 10 ** R.randint(2, 9)); s = str(v).rjust(sc + 1, '0'); t = s[:-sc] + '.' + s[-sc:]
    if R.random() < 0.4: t = '-' + t
    add(t, Fr(t))
# 7. perfect cubes of fractions and decimals built from a root
for i in range(60):
    a, b = R.randint(1, 800), R.randint(1, 800); sg = R.choice([1, -1]); q = Fr(sg * a ** 3, b ** 3); add('%d/%d' % (sg * a ** 3, b ** 3), q)
for i in range(30):
    v = R.randint(1, 999); sg = R.choice([1, -1]); c = v ** 3; t = '%s%d.%s' % ('-' if sg < 0 else '', c // 10 ** 6, str(c % 10 ** 6).rjust(6, '0')); add(t, Fr(t))
# 8. large integers: k^3 * m with m small, perfect cubes and 25 to 60 digit values
for i in range(60):
    k = R.randint(10 ** 3, 10 ** R.choice([5, 7, 9])); m = R.choice([1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 22, 23, 25, 26, 28, 29, 30, 31, 33, 34, 35, 36, 37, 38, 39, 41, 42, 44, 45, 46, 47, 49, 50, 51, 52, 53, 55, 60, 63, 66, 75, 90])
    n = k ** 3 * m * R.choice([1, -1]); add(str(n), Fr(n))
for i in range(12):
    k = R.randint(10 ** 6, 10 ** 19); add(str(k ** 3), Fr(k ** 3)); add(str(-k ** 3), Fr(-k ** 3))
for i in range(12):
    n = R.randint(10 ** 20, 10 ** 40) * R.choice([1, -1]); add(str(n), Fr(n), 12)
for i in range(6):
    n = R.randint(10 ** 40, 10 ** 59) * R.choice([1, -1]); add(str(n), Fr(n), 6)
# 9. places in the middle of a long decimal
for p in [3, 5, 7, 9, 10, 11, 13, 15, 30]: add('2', Fr(2), p); add('3', Fr(3), p); add('10', Fr(10), p); add('-2', Fr(-2), p)
# large perfect cube of a prime above the trial limit, and a prime squared, as exact whole numbers
add(str(1000003 ** 3), Fr(1000003 ** 3)); add(str(-1000003 ** 3), Fr(-1000003 ** 3)); add(str(1000003 ** 2), Fr(1000003 ** 2)); add(str(27 * 1000003), Fr(27 * 1000003)); add(str(8 * 1000003 ** 2), Fr(8 * 1000003 ** 2))

# tiny values: the engine may show more places than asked
tiny = []
for t in ['2e-30', '1e-61', '5e-100', '0.000000000000000000000000000003', '1e-299', '7e-250', '-2e-30', '-1e-61', '-5e-100', '-7e-250', '3e-200', '1e-100']:
    q = Fr(Decimal(t)); r = true_root(abs(q))
    tiny.append([t, 8, format(r, '.60e'), exact_form(q)[0], q < 0])

bad = ['abc', '1..2', '1/0', '1/2/3', '--4', '4x', '12 3', '1e', 'e5', '∛8', 'cbrt(8)', '1e301', '1' * 61, '0x10', '1,2,3.5.6', 'NaN', 'Infinity', '1e999', '-', '8.']
bad = [b for b in bad if b != '8.']
empty = ['', '   ', '\t']
V = {'solve': solve, 'tiny': tiny, 'bad': bad, 'empty': empty}
json.dump(V, open('tests/cbrt_vectors.json' if __import__('os').path.isdir('tests') else 'cbrt_vectors.json', 'w'), ensure_ascii=False)
print(len(solve), 'solve rows,', len(tiny), 'tiny,', len(bad), 'bad')
