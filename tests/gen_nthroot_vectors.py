"""Independent vectors for the Root Calculator, Mode 03 (tools/nthroot_engine.js), the General nth Root Calculator.
Written without the engine. The exact form is built from sympy.factorint of the numerator and of the denominator: every prime gets the signed exponent x (e in the
numerator, -f in the denominator), x = q*k + r with Python floor division, t^q comes out and t^r stays under the root, and the index is lowered by g = gcd(k, every r).
Every exact form is then confirmed against sympy's own sp.root(q, k) numerically to 120 digits, and its radicand is checked to be in simplest form (every exponent
below the new index, their gcd with it equal to 1). The decimal comes from mpmath (mp.root at 300 digits) and is cross-checked against Python's decimal module
(Decimal ** (1/k) at 250 digits), two routes different from the engine's integer root, rounded half up. Perfect powers are also confirmed with sympy.integer_nthroot.
Row of V.solve: [typed radicand, index k, places, exact text, perfect (bool), decimal text, floor of |root| as text, radicand as an exact (signed) fraction text, reduced index text or '']
  decimal text: for an irrational root, fixed `places` places; for a perfect power, the exact decimal with trailing zeros removed when it ends within 100 places, otherwise `places` places.
  An odd index of a negative radicand gives the negative real root: exact and decimal carry a leading minus sign.
Row of V.tiny: [typed radicand, index, places, true |root| to 60 significant digits as text, exact text, negative (bool)]  (the engine may show more than `places` places for a tiny value)
V.noreal: [typed radicand, index] with a negative radicand and an even index. V.badradicand / V.badindex: inputs that must be refused with a message. V.empty: blank inputs.
Run: python3 tests/gen_nthroot_vectors.py -> tests/nthroot_vectors.json"""
import json, random, math
from fractions import Fraction as Fr
from decimal import Decimal, getcontext, ROUND_HALF_UP
import sympy as sp
import mpmath as mp
getcontext().prec = 250
mp.mp.dps = 300
R = random.Random(20261127)
SUPD = '⁰¹²³⁴⁵⁶⁷⁸⁹'

def sup(n): return ''.join(SUPD[int(c)] for c in str(n))
def sym(k): return '√' if k == 2 else '∛' if k == 3 else sup(k) + '√'
def txt(q): return str(q.numerator) if q.denominator == 1 else '%d/%d' % (q.numerator, q.denominator)

def exact_form(q, k):
    """-> (text, perfect, reduced index text or '') for the real k-th root of the signed rational q (k odd if q < 0)"""
    neg = q < 0; a = abs(q); n, d = a.numerator, a.denominator
    if n == 0: return '0', True, ''
    ex = {}
    for p_, e in sp.factorint(n).items(): ex[p_] = ex.get(p_, 0) + e
    for p_, e in sp.factorint(d).items(): ex[p_] = ex.get(p_, 0) - e
    num = 1; den = 1; rem = []
    for p_, x in ex.items():
        qq = x // k; r = x - qq * k
        if qq > 0: num *= p_ ** qq
        elif qq < 0: den *= p_ ** (-qq)
        if r > 0: rem.append((p_, r))
    g = k
    for _, r in rem: g = math.gcd(g, r)
    j = k // g; m = 1
    for p_, r in rem: m *= p_ ** (r // g)
    c = Fr(num, den)
    # confirm with sympy's own root, numerically, to 120 digits
    chk = sp.N(sp.root(sp.Rational(n, d), k) - sp.Rational(c.numerator, c.denominator) * sp.root(m, j), 120)
    assert abs(chk) < sp.Float('1e-100') * max(1, abs(sp.N(sp.root(sp.Rational(n, d), k), 5))), (q, k, chk)
    ps = sp.integer_nthroot(n, k)[1] and sp.integer_nthroot(d, k)[1]
    assert ps == (m == 1), (q, k, ps, m)
    if m > 1:
        fm = sp.factorint(m)
        assert all(e < j for e in fm.values()), (q, k, m, j)
        gg = j
        for e in fm.values(): gg = math.gcd(gg, e)
        assert gg == 1, (q, k, m, j)
    sign = '-' if neg else ''
    if m == 1: return sign + txt(c), True, ''
    dot = '·' if j >= 4 and c.numerator != 1 else ''
    numt = ('' if c.numerator == 1 else str(c.numerator) + dot) + sym(j) + str(m)
    return sign + numt + ('' if c.denominator == 1 else '/' + str(c.denominator)), False, (str(j) if j != k else '')

def fixed(x, p):
    return format(Decimal(x).quantize(Decimal(1).scaleb(-p), rounding=ROUND_HALF_UP), 'f')

def true_root(a, k):
    """k-th root of a positive Fraction as a Decimal (250 digits), cross-checked against mpmath"""
    d1 = (Decimal(a.numerator) / Decimal(a.denominator)) ** (Decimal(1) / Decimal(k))
    m = mp.root(mp.mpf(a.numerator) / mp.mpf(a.denominator), k)
    d2 = Decimal(mp.nstr(m, 280))
    assert abs(d1 - d2) < Decimal(10) ** -170 * max(Decimal(1), abs(d1)), (a, k, d1, d2)
    return d2

def dec_text(q, k, p, perfect):
    a = abs(q); neg = q < 0
    if perfect:
        root = Fr(sp.integer_nthroot(a.numerator, k)[0], sp.integer_nthroot(a.denominator, k)[0])
        t = root.denominator; x = y = 0
        while t % 2 == 0: t //= 2; x += 1
        while t % 5 == 0: t //= 5; y += 1
        if t == 1 and max(x, y) <= 100:
            pl = max(x, y)
            val = Decimal(root.numerator) / Decimal(root.denominator)
            r = format(val, 'f') if pl == 0 else format(val.quantize(Decimal(1).scaleb(-pl)), 'f')
        else:
            r = fixed(Decimal(root.numerator) / Decimal(root.denominator), p)
        return ('-' + r) if (neg and a != 0) else r
    r = fixed(true_root(a, k), p)
    return ('-' + r) if neg else r

def row(typed, q, k, p=8):
    ex, perf, red = exact_form(q, k)
    a = abs(q)
    fl = sp.integer_nthroot(a.numerator // a.denominator, k)[0]
    return [typed, k, p, ex, perf, dec_text(q, k, p, perf), str(fl), txt(q), red]

solve, seen = [], set()
def add(typed, q, k, p=8):
    if q < 0 and k % 2 == 0: return
    if len(str(abs(q.numerator))) > 60 or len(str(q.denominator)) > 60: return
    if abs(q.numerator) > 10 ** 22 and typed.rstrip('0123456789') == '' and False: return
    key = (typed, k, p)
    if key in seen: return
    seen.add(key); solve.append(row(typed, q, k, p))
    if len(solve) % 500 == 0: print(len(solve), flush=True)

# 1. the CEO note's test table
for t, k in [('144', 2), ('81', 2), ('2', 2), ('27', 3), ('-27', 3), ('81', 4), ('32', 5), ('64', 6), ('128', 7), ('256', 8), ('48', 4), ('72', 2), ('0.125', 3), ('25', 1), ('-8', 3),
             ('125', 3), ('216', 3), ('8', 3), ('64', 3), ('1024', 10), ('-1', 7), ('0', 9), ('1', 1000), ('-1', 999)]:
    add(t, Fr(Decimal(t)), k)
# 2. every index 1..16 and some larger ones against whole numbers
KS = list(range(1, 17)) + [18, 20, 21, 24, 30, 32, 36, 48, 60, 64, 96, 100, 128, 192, 250, 500, 720, 997, 999, 1000]
for k in KS:
    top = 130 if k <= 6 else 60
    for n in range(0, top + 1): add(str(n), Fr(n), k)
    if k % 2 == 1:
        for n in range(1, min(top, 50) + 1): add(str(-n), Fr(-n), k)
    # perfect powers a^k for small a (large k only for a <= 3), and one off each side
    for a_ in range(1, 13 if k <= 16 else 4):
        add(str(a_ ** k), Fr(a_ ** k), k)
        if a_ ** k < 10 ** 22: add(str(a_ ** k + 1), Fr(a_ ** k + 1), k)
        if 1 < a_ ** k < 10 ** 22: add(str(a_ ** k - 1), Fr(a_ ** k - 1), k)
        if k % 2 == 1: add(str(-a_ ** k), Fr(-a_ ** k), k)
# 3. index reduction and simplest forms: m^g * extra with k a multiple of g
for k in [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 24, 30, 36, 48, 60, 100, 1000]:
    for g in [d_ for d_ in range(2, 13) if k % d_ == 0]:
        for m_ in [2, 3, 5, 6, 7, 10, 12, 18, 30, 49, 72, 100]:
            n = m_ ** g; add(str(n), Fr(n), k)
            n2 = m_ ** g * R.choice([2, 3, 5, 7, 11]); add(str(n2), Fr(n2), k)
            n3 = (m_ ** (k // g)) ** (g // g) * 2 ** k * R.choice([1, 3, 5]); add(str(n3), Fr(n3), k)
# 4. decimals
for t, k in [('0.125', 3), ('0.0625', 4), ('0.00001', 5), ('1.331', 3), ('15.625', 3), ('0.5', 2), ('0.25', 2), ('0.008', 3), ('2.5', 2), ('0.1', 4), ('0.000001', 6), ('123.456', 5), ('1000.5', 7),
             ('0.00032', 5), ('7.', 2), ('00081.000', 4), ('.0016', 4), ('-0.125', 3), ('-0.00032', 5), ('-2.5', 3), ('-1.728', 3), ('-123.456', 7), ('0.015625', 6), ('0.015625', 2), ('0.0001', 4), ('0.0081', 4)]:
    add(t, Fr(Decimal(t)), k)
# 5. scientific notation
for t, k in [('1e6', 2), ('1e6', 3), ('1e6', 6), ('1.5e3', 2), ('2.5e-3', 3), ('8e3', 3), ('27E-6', 3), ('1e-9', 3), ('1e-9', 9), ('3e5', 5), ('1.6e1', 4), ('6.4e-2', 6), ('1e0', 100), ('5e1', 2), ('1e99', 11), ('1e99', 9),
             ('2e-7', 7), ('1e-30', 2), ('1e-30', 5), ('1e-60', 4), ('1e-60', 1000), ('-1e6', 3), ('-8e-3', 3), ('-2.7e4', 3), ('-1e-9', 9), ('1e100', 50), ('1e100', 100), ('1e-99', 33)]:
    add(t, Fr(Decimal(t)), k)
# 6. fractions and mixed numbers
for t, q, k in [('3/4', Fr(3, 4), 4), ('1/2', Fr(1, 2), 3), ('1/2', Fr(1, 2), 2), ('1/8', Fr(1, 8), 4), ('16/81', Fr(16, 81), 4), ('27/64', Fr(27, 64), 3), ('32/243', Fr(32, 243), 5), ('1/32', Fr(1, 32), 5),
                ('2/3', Fr(2, 3), 7), ('5/12', Fr(5, 12), 6), ('1/72', Fr(1, 72), 2), ('1/54', Fr(1, 54), 3), ('7/50', Fr(7, 50), 8), ('8/9', Fr(8, 9), 6), ('9/16', Fr(9, 16), 4), ('1/4', Fr(1, 4), 4), ('1/9', Fr(1, 9), 4),
                ('2 1/4', Fr(9, 4), 4), ('5 1/16', Fr(81, 16), 4), ('1 1/2', Fr(3, 2), 5), ('3 3/8', Fr(27, 8), 3), ('0.5/4', Fr(1, 8), 3), ('1.5/2.5', Fr(3, 5), 5), ('250/2', Fr(125), 3), ('1e3/4', Fr(250), 3),
                ('-1/2', Fr(-1, 2), 3), ('-3/4', Fr(-3, 4), 5), ('-32/243', Fr(-32, 243), 5), ('-1/32', Fr(-1, 32), 5), ('-2 1/4', Fr(-9, 4), 3), ('-3 3/8', Fr(-27, 8), 3), ('-5/12', Fr(-5, 12), 7), ('-8/27', Fr(-8, 27), 3)]:
    add(t, q, k)
for i in range(260):
    k = R.choice([2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 16, 24, 100]); n, d = R.randint(1, 500), R.randint(1, 500); sg = R.choice([1, -1]) if k % 2 else 1
    add('%d/%d' % (sg * n, d), Fr(sg * n, d), k)
for i in range(120):
    k = R.choice([2, 3, 4, 5, 6, 8, 10, 12]); a_, b_ = R.randint(1, 30), R.randint(1, 30)
    n, d = a_ ** k * R.choice([1, 1, 2, 3, 5, 6]), b_ ** k * R.choice([1, 1, 2, 3, 4, 5]); sg = R.choice([1, -1]) if k % 2 else 1
    add('%d/%d' % (sg * n, d), Fr(sg * n, d), k)
for i in range(60):
    k = R.choice([2, 3, 4, 5, 6, 7, 8]); w, n, d = R.randint(1, 40), R.randint(1, 9), R.randint(2, 12)
    if n >= d: continue
    sg = R.choice([1, -1]) if k % 2 else 1
    add('%s%d %d/%d' % ('-' if sg < 0 else '', w, n, d), sg * (w + Fr(n, d)), k)
# 7. random decimals
for i in range(120):
    k = R.choice([2, 3, 4, 5, 6, 7, 9, 10, 11, 13, 20, 50]); sc = R.randint(1, 6); v = R.randint(1, 10 ** R.randint(2, 9)); s = str(v).rjust(sc + 1, '0'); t = s[:-sc] + '.' + s[-sc:]
    if k % 2 and R.random() < 0.4: t = '-' + t
    add(t, Fr(t), k)
# 8. perfect powers of fractions and decimals built from a root
for i in range(120):
    k = R.choice([2, 3, 4, 5, 6, 7, 8, 9, 10]); a_, b_ = R.randint(1, 60), R.randint(1, 60); sg = R.choice([1, -1]) if k % 2 else 1
    add('%d/%d' % (sg * a_ ** k, b_ ** k), Fr(sg * a_ ** k, b_ ** k), k)
for i in range(40):
    k = R.choice([2, 3, 4, 5, 6]); v = R.randint(1, 30); sg = R.choice([1, -1]) if k % 2 else 1; c = v ** k; sc = 6
    t = '%s%d.%s' % ('-' if sg < 0 else '', c // 10 ** sc, str(c % 10 ** sc).rjust(sc, '0')); add(t, Fr(t), k)
def bigval(lo, hi):
    """a value with a large prime cofactor and a smooth part, so sympy.factorint stays fast"""
    if hi - lo < 10: return lo
    sm = R.choice([1, 2, 4, 8, 12, 16, 27, 36, 48, 72, 100, 144, 243, 1024, 5 ** 7 * 3 ** 4, 2 ** 20 * 3 ** 6])
    if hi // sm < lo // sm + 2: sm = 1
    pr = int(sp.nextprime(R.randint(lo // sm + 1, hi // sm)))
    return pr * sm
# 9. large integers: r^k * m with m small, perfect powers, and 25 to 60 digit values
for i in range(100):
    k = R.choice([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 17, 20]); r_ = bigval(10, 10 ** max(1, 52 // k)); m_ = R.choice([1, 1, 2, 3, 4, 5, 6, 7, 9, 10, 12, 15, 18, 30])
    n = r_ ** k * m_
    if len(str(n)) > 60: continue
    add(str(n), Fr(n), k); 
    if k % 2: add(str(-n), Fr(-n), k)
for i in range(24):
    k = R.choice([2, 3, 4, 5, 6, 7, 8, 9, 10, 15]); r_ = bigval(10 ** 3, 10 ** (58 // k)); n = r_ ** k
    add(str(n), Fr(n), k)
    if n < 10 ** 24: add(str(n - 1), Fr(n - 1), k); add(str(n + 1), Fr(n + 1), k)
for i in range(30):
    k = R.choice([2, 3, 4, 5, 6, 7, 9, 11, 13, 17, 50, 100, 300, 1000]); n = bigval(10 ** 20, 10 ** 40) * R.choice([1, -1] if k % 2 else [1])
    add(str(n), Fr(n), k, 12)
for i in range(16):
    k = R.choice([2, 3, 5, 7, 11, 31, 100, 999]); n = bigval(10 ** 40, 10 ** 59) * R.choice([1, -1] if k % 2 else [1])
    add(str(n), Fr(n), k, 6)
# 10. places in the middle of long decimals, and the extremes of index and places
for p in [0, 1, 3, 5, 7, 9, 10, 11, 13, 15, 20, 30, 40, 50]:
    for t, k in [('2', 2), ('2', 3), ('2', 5), ('3', 4), ('10', 7), ('-2', 3), ('-10', 5), ('2', 100), ('2', 1000), ('1/3', 2), ('10', 24), ('10', 96)]: add(t, Fr(t), k, p)
# 11. a prime above the trial limit
for e in range(1, 7):
    for k in [2, 3, 4, 5, 6]:
        add(str(1000003 ** e), Fr(1000003 ** e), k)
add(str(8 * 1000003 ** 2), Fr(8 * 1000003 ** 2), 6); add(str(-32 * 1000003 ** 5), Fr(-32 * 1000003 ** 5), 5); add(str(1000003 ** 4), Fr(1000003 ** 4), 8)

# tiny values: the engine may show more places than asked
tiny = []
for t, k in [('2e-30', 2), ('2e-30', 3), ('1e-61', 3), ('5e-100', 4), ('0.000000000000000000000000000003', 5), ('1e-299', 7), ('7e-250', 6), ('-2e-30', 3), ('-1e-61', 5), ('-5e-100', 7), ('3e-200', 2), ('1e-100', 3), ('1e-60', 2), ('9e-59', 2)]:
    q = Fr(Decimal(t)); r = true_root(abs(q), k)
    tiny.append([t, k, 8, format(r, '.60e'), exact_form(q, k)[0], q < 0])

noreal = [[t, k] for t in ['-1', '-4', '-9', '-16', '-2', '-0.25', '-1/4', '-100', '-1e6', '-3 1/2', '-81'] for k in [2, 4, 6, 8, 10, 100, 1000]]
badradicand = ['abc', '1..2', '1/0', '1/2/3', '--4', '4x', '12 3', '1e', 'e5', '√8', '∛8', '0x10', '1,2,3.5.6', 'NaN', 'Infinity', '1e999', '-', '1' * 61, '1e301']
badindex = ['0', '-1', '-2', '-10', '+0', '2.5', '1.0', '0.5', '1/2', '1001', '1000000', 'abc', '2x', 'x', '1e3', '--2', '٣', '∛', '²', '3 3']
empty = ['', '   ', '\t']
V = {'solve': solve, 'tiny': tiny, 'noreal': noreal, 'badradicand': badradicand, 'badindex': badindex, 'empty': empty}
json.dump(V, open('tests/nthroot_vectors.json' if __import__('os').path.isdir('tests') else 'nthroot_vectors.json', 'w'), ensure_ascii=False)
print(len(solve), 'solve rows,', len(tiny), 'tiny,', len(noreal), 'noreal,', len(badradicand), 'bad radicands,', len(badindex), 'bad indices')
