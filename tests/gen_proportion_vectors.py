"""Independent vectors for the Ratio Calculator, Mode 02 (tools/proportion_engine.js), the Proportion Solver.
Written without the engine, with Python's fractions.Fraction and sympy. A missing term is found by three routes that must agree:
(1) the ratio-value route (D = C / (A/B), A = (B*C)/D ... , i.e. using the common value of the two ratios, not the cross product);
(2) sympy.solve on the cross-product equation A*D = B*C;
(3) for the zero cases, a brute-force search over a grid of candidate values p/q for the missing term, using the definition: A:B = C:D when A*D = B*C and neither ratio is 0:0.
Row of V.solve: [[a, b, c, d] as typed (the missing one is ''), status ('solved' | 'any' | 'none'), label, exact value text or null, decimal of the value at 4 places or '' (integer),
                 completed proportion text or null, simplest form of A:B text or null, scale factor text or null, cross product text or null]
Row of V.verify: [[a, b, c, d], holds (bool), simplest form of A:B, simplest form of C:D, A*D text, B*C text, scale factor text or null, suggested D text or null]
Decimal texts carry the engine's marker: a leading '≈ ' when the value is not exact at 4 places. Run: python3 tests/gen_proportion_vectors.py -> tests/proportion_vectors.json"""
import json, random, math
from fractions import Fraction as Fr
import sympy as sp
R = random.Random(20261124)
L = ['A', 'B', 'C', 'D']

def txt(q): return str(q.numerator) if q.denominator == 1 else '%d/%d' % (q.numerator, q.denominator)

def dec(q, p):
    neg = q < 0; a = abs(q); S = 10 ** p
    sc = (a.numerator * S * 2 + a.denominator) // (a.denominator * 2)
    ip, fp = divmod(sc, S)
    t = str(ip) + ('.' + str(fp).rjust(p, '0') if p else '')
    exact = (a * S).denominator == 1
    return ('' if exact else '\u2248 ') + ('-' if neg and sc else '') + t

def simplest(a, b):
    L_ = a.denominator * b.denominator // math.gcd(a.denominator, b.denominator)
    wa, wb = int(a * L_), int(b * L_)
    g = math.gcd(wa, wb)
    return '%d : %d' % (wa // g, wb // g)

def valid(a, b): return not (a == 0 and b == 0)
def holds(a, b, c, d): return valid(a, b) and valid(c, d) and a * d == b * c

def whole(n): return (str(n), Fr(n))
def decimal(n, scale):
    q = Fr(n, 10 ** scale); s = str(abs(n)).rjust(scale + 1, '0'); t = s[:-scale] + '.' + s[-scale:] if scale else s
    return (('-' if n < 0 else '') + t, q)
def frac(a, b): return ('%d/%d' % (a, b), Fr(a, b))
def mixed(w, a, b): return ('%d %d/%d' % (w, a, b), w + Fr(a, b))

# ---------- three routes to a missing term (positive denominators, nothing zero) ----------
def solve_value(T, u):
    a, b, c, d = T
    # route 1: the common value r of the two ratios (A/B = C/D)
    if u == 3: r = a / b; v1 = c / r
    elif u == 2: r = a / b; v1 = d * r
    elif u == 1: r = c / d; v1 = a / r
    else: r = c / d; v1 = b * r
    # route 2: sympy on the cross-product equation
    x = sp.Symbol('x')
    vals = [sp.Rational(t.numerator, t.denominator) for t in T]
    syms = list(vals); syms[u] = x
    sol = sp.solve(sp.Eq(syms[0] * syms[3], syms[1] * syms[2]), x)
    assert len(sol) == 1
    v2 = Fr(int(sol[0].p), int(sol[0].q))
    assert v1 == v2, (T, u, v1, v2)
    return v1

def solve_row(texts, T, u):
    t2 = list(T); known = list(T)
    v = solve_value(T, u)
    t2[u] = v
    assert holds(*t2)
    typed = list(texts); typed[u] = ''
    k = t2[2] / t2[0] if t2[0] != 0 else t2[3] / t2[1]
    return [typed, 'solved', L[u], txt(v), dec(v, 4) if v.denominator != 1 else '', ' : '.join([txt(t2[0]), txt(t2[1])]) + ' = ' + ' : '.join([txt(t2[2]), txt(t2[3])]),
            simplest(t2[0], t2[1]), txt(k), '%s = %s' % (txt(t2[0] * t2[3]), txt(t2[1] * t2[2]))]

def verify_row(texts, T):
    a, b, c, d = T
    h = holds(a, b, c, d)
    k = None
    if h: k = c / a if a != 0 else d / b
    sug = None if (h or a == 0 or c == 0) else b * c / a
    return [list(texts), h, simplest(a, b), simplest(c, d), txt(a * d), txt(b * c), txt(k) if k is not None else None, txt(sug) if sug is not None else None]

solve, verify, seen = [], [], set()
def add_solve(parts, u):
    texts = [p[0] for p in parts]; T = [p[1] for p in parts]
    key = ('s', tuple(texts), u)
    if key in seen: return
    if not valid(T[0], T[1]) and u in (2, 3): return
    if u in (0, 1) and not valid(T[2], T[3]): return
    # nothing zero here: the zero cases are listed by hand below
    if any(t == 0 for t in T): return
    seen.add(key); solve.append(solve_row(texts, T, u))
def add_verify(parts):
    texts = [p[0] for p in parts]; T = [p[1] for p in parts]
    key = ('v', tuple(texts))
    if key in seen or not valid(T[0], T[1]) or not valid(T[2], T[3]): return
    seen.add(key); verify.append(verify_row(texts, T))

def family(mk, base_p, base_q, k1, k2):
    """four terms of a true proportion: base ratio p:q scaled by k1 and by k2"""
    return [mk(base_p * k1), mk(base_q * k1), mk(base_p * k2), mk(base_q * k2)]

# the CEO note and well-known cases, with the missing term in every position
for t in [(3, 4, 9, 12), (1, 2, 5, 10), (2, 3, 8, 12), (5, 8, 15, 24), (400, 5, 240, 3), (11000, 110, 6600, 66), (60, 24, 25, 10), (7, 3, 21, 9), (1, 1, 6, 6), (13, 17, 26, 34)]:
    parts = [whole(x) for x in t]
    for u in range(4): add_solve(parts, u)
    add_verify(parts)
# random whole proportions, a common base ratio and two multipliers
for _ in range(60):
    p, q = R.randint(1, 30), R.randint(1, 30); k1, k2 = R.randint(1, 40), R.randint(1, 40)
    parts = family(whole, p, q, k1, k2)
    add_solve(parts, R.randint(0, 3)); add_solve(parts, R.randint(0, 3)); add_verify(parts)
# random whole terms where the missing term is not a whole number
for _ in range(60):
    parts = [whole(R.randint(1, 60)) for _ in range(4)]; add_solve(parts, R.randint(0, 3))
# decimals
for _ in range(60):
    parts = [decimal(R.randint(1, 9999), R.randint(0, 3)) for _ in range(4)]
    parts = [p for p in parts]
    add_solve(parts, R.randint(0, 3))
for _ in range(25):
    p, q = R.randint(1, 20), R.randint(1, 20); k1 = Fr(R.randint(1, 99), R.choice([1, 2, 4, 5, 10])); k2 = Fr(R.randint(1, 99), R.choice([1, 2, 4, 5, 10]))
    vals = [p * k1, q * k1, p * k2, q * k2]
    parts = []
    for v in vals:
        if (v * 1000).denominator == 1: parts.append(decimal(int(v * 1000), 3))
        else: parts.append((txt(v), v))
    add_solve(parts, R.randint(0, 3)); add_verify(parts)
# fractions and mixed numbers
for _ in range(50): add_solve([frac(R.randint(1, 20), R.randint(1, 20)) for _ in range(4)], R.randint(0, 3))
for _ in range(25): add_solve([mixed(R.randint(1, 5), R.randint(1, 6), R.randint(7, 12)), whole(R.randint(1, 9)), mixed(R.randint(1, 5), R.randint(1, 6), R.randint(7, 12)), whole(R.randint(1, 9))], R.randint(0, 3))
add_solve([frac(1, 2), frac(3, 4), whole(10), whole(1)], 3); add_solve([mixed(2, 1, 2), whole(5), whole(3), whole(1)], 3)
# scientific notation and thousands commas
for t, u in [(('1e3', '2e3', '5e2', '1'), 3), (('2.5e2', '5e2', '1', '1'), 3), (('1e-3', '1e-2', '1', '1'), 3), (('3e5', '9e5', '4', '1'), 3), (('1,000', '2,500', '4', '1'), 3)]:
    parts = []
    for p in t:
        if 'e' in p: m, e = p.split('e'); parts.append((p, Fr(m) * Fr(10) ** int(e)))
        else: parts.append((p, Fr(p.replace(',', ''))))
    add_solve(parts, u)
# large numbers (30 to 55 digits)
for _ in range(25):
    k = R.randint(10 ** 20, 10 ** 26); parts = [whole(R.randint(1, 10 ** 10) * k) for _ in range(3)] + [whole(R.randint(1, 10 ** 10))]; add_solve(parts, R.randint(0, 3))
for _ in range(10):
    parts = family(whole, R.randint(1, 10 ** 12), R.randint(1, 10 ** 12), R.randint(1, 10 ** 12), R.randint(1, 10 ** 12)); add_solve(parts, R.randint(0, 3)); add_verify(parts)

# verify: true and false proportions, including near misses
for _ in range(40):
    p, q = R.randint(1, 25), R.randint(1, 25); k1, k2 = R.randint(1, 30), R.randint(1, 30)
    parts = family(whole, p, q, k1, k2); add_verify(parts)
    bad = list(parts); i = R.randint(0, 3); bad[i] = whole(int(parts[i][1]) + R.choice([1, -1, 2, 7]) if int(parts[i][1]) + 1 > 1 else int(parts[i][1]) + 1); add_verify(bad)
for t in ['3:4:9:13', '2:3:3:2', '1:2:2:1', '5:7:10:15', '12:18:2:3', '2:3:4:6', '1.5:2.5:3:5', '0.1:0.2:1:2', '0.1:0.3:1:2']:
    parts = []
    for p in t.split(':'): parts.append((p, Fr(p)))
    add_verify(parts)
for t in ['1/2:1/3:3:2', '1/2:3/4:2:3', '2 1/2:5:1:2']:
    parts = []
    for p in t.split(':'):
        if ' ' in p: w, f = p.split(' '); n, d = f.split('/'); parts.append((p, int(w) + Fr(int(n), int(d))))
        else: parts.append((p, Fr(p)))
    add_verify(parts)

# ---------- zero terms, decided by the definition over a grid of candidate values ----------
grid = sorted({Fr(p, q) for p in range(0, 121) for q in range(1, 13)})
zero = []
def brute(T, u):
    sols = []
    for x in grid:
        t2 = list(T); t2[u] = x
        if holds(*t2): sols.append(x)
    return sols
def add_zero(vals, u):
    T = [Fr(v) for v in vals]; texts = [str(v) for v in vals]
    if (u in (0, 1) and not valid(T[2], T[3])) or (u in (2, 3) and not valid(T[0], T[1])): return
    key = ('z', tuple(texts), u)
    if key in seen: return
    seen.add(key)
    typed = list(texts); typed[u] = ''
    cand = list(T); cand[u] = Fr(0)
    sols = brute(T, u)
    nonzero = [x for x in grid if x != 0]
    if len(sols) == 0: zero.append([typed, 'none', L[u], None, '', None, None, None, None]); return
    if all(x in sols for x in nonzero): zero.append([typed, 'any', L[u], None, '', None, None, None, None]); return
    assert len(sols) == 1, (vals, u, sols)
    t2 = list(T); t2[u] = sols[0]
    k = t2[2] / t2[0] if t2[0] != 0 else t2[3] / t2[1]
    zero.append([typed, 'solved', L[u], txt(sols[0]), dec(sols[0], 4) if sols[0].denominator != 1 else '', ' : '.join([txt(t2[0]), txt(t2[1])]) + ' = ' + ' : '.join([txt(t2[2]), txt(t2[3])]),
                 simplest(t2[0], t2[1]), txt(k), '%s = %s' % (txt(t2[0] * t2[3]), txt(t2[1] * t2[2]))])
for vals in [(0, 5, 0, 1), (0, 5, 0, 7), (0, 5, 3, 1), (3, 4, 0, 1), (5, 0, 3, 1), (5, 0, 0, 1), (0, 5, 4, 0), (4, 0, 0, 3), (0, 3, 0, 8), (6, 0, 9, 1), (2, 3, 0, 4), (0, 7, 5, 9)]:
    for u in range(4):
        v = list(vals); v[u] = 1; add_zero(v, u)
for _ in range(80):
    v = [R.choice([0, 0, 1, 2, 3, 5, 6, 10]) for _ in range(4)]; add_zero(v, R.randint(0, 3))
# zero terms with every term known
for vals in [(0, 5, 0, 7), (0, 5, 3, 7), (5, 0, 3, 0), (5, 0, 3, 7), (5, 0, 0, 7), (0, 5, 7, 0), (4, 0, 9, 0), (0, 2, 0, 9)]:
    T = [Fr(v) for v in vals]; add_verify([(str(v), Fr(v)) for v in vals])

err = ['3,4,9,x', 'a', '-1', '3/0', '1.2.3', '1e999', '--2', '\u22122', '12/', '1 2', '5 / ']
# error rows: [a, b, c, d, index of the bad field or -1]
errcases = [['-1', '4', '9', ''], ['3', '-4', '9', ''], ['3', '4', '-9', ''], ['3', '4', '9', '-12'], ['a', '4', '9', ''], ['3', '4', 'z9', ''], ['3', '4', '9', '1/0'], ['1.2.3', '4', '9', ''],
            ['0', '0', '1', ''], ['0', '0', '', '1'], ['1', '', '0', '0'], ['', '1', '0', '0'], ['0', '0', '1', '2'], ['1', '2', '0', '0'], ['\u22123', '4', '9', ''], ['3', '4', '--9', '']]
errbad = [0, 1, 2, 3, 0, 2, 3, 0, 0, 0, 2, 2, 0, 2, 0, 2]
empty = [['', '', '', ''], ['3', '', '', ''], ['3', '4', '', ''], ['', '', '9', '12'], ['x', 'x', '9', '12'], ['3', '?', '9', '_'], [' ', ' ', '1', ' ']]
json.dump({'solve': solve + zero, 'verify': verify, 'err': errcases, 'errbad': errbad, 'empty': empty}, open('tests/proportion_vectors.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(solve), 'solve vectors,', len(zero), 'zero-case vectors,', len(verify), 'verify vectors,', len(errcases), 'rejected,', len(empty), 'empty')
