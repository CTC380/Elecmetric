"""Independent vectors for the Quadratic Formula Calculator, Mode 04 (tools/quad_exact_engine.js).
Expected values come from sympy (factor_list, roots, completing the square by hand-free sp.Poly algebra), never from the engine.
forms rows: [a, b, c, kind, content, [whole-number a,b,c], vertex_h, vertex_k, [rational roots sorted], nCandidates|None, factor_over_Q(bool), rational_factors]
  kind: rational | repeated | radical | complex.  content = A / (whole-number leading coeff), as p/q text.
  tt = -k/A (the square of the half-width s), as p/q text.
  rational_factors: for rational and repeated kinds, sympy's primitive integer factors as [[q, p], ...] meaning (q*x - p), ordered by root; else [].
roots rows: [a, r1, r2, A, B, C]  (A(x-r1)(x-r2) expanded by sympy)   vertex rows: [a, h, k, A, B, C]
Run: python3 tests/gen_quad_exact_vectors.py  -> tests/quad_exact_vectors.json"""
import json, random
from fractions import Fraction as Fr
import sympy as sp
R = random.Random(20261125)
x = sp.symbols('x')

def val(t):
    t = t.replace('−', '-')
    if '/' in t:
        a, b = t.split('/'); return Fr(a) / Fr(b)
    return Fr(t)
def sr(q): return sp.Rational(q.numerator, q.denominator)
def rt(q):
    q = Fr(q); return str(q.numerator) if q.denominator == 1 else '%d/%d' % (q.numerator, q.denominator)
def divisors_count(n):
    n = abs(int(n)); return len(sp.divisors(n))

def frow(a, b, c):
    A, B, C = sr(val(a)), sr(val(b)), sr(val(c))
    P = sp.Poly(A * x**2 + B * x + C, x)
    D = B * B - 4 * A * C
    # whole-number primitive form with positive leading coefficient
    content, prim = P.clear_denoms()[0], None
    Pi = sp.Poly(P.as_expr() * content, x) if False else P.clear_denoms()[1]
    cont, prim = Pi.primitive()
    if prim.LC() < 0: prim = -prim; cont = -cont
    ia, ib, ic = [int(v) for v in prim.all_coeffs()]
    k = A / sp.Integer(ia)
    h = -B / (2 * A); kk = C - B * B / (4 * A)
    if D > 0 and sp.sqrt(D).is_Rational: kind = 'rational'
    elif D == 0: kind = 'repeated'
    elif D > 0: kind = 'radical'
    else: kind = 'complex'
    rats = sorted([r for r in sp.roots(P, multiple=True) if r.is_Rational]) if kind in ('rational', 'repeated') else []
    rats_u = sorted(set(rats))
    ncand = None
    if ic != 0:
        da, dc = divisors_count(ia), divisors_count(ic)
        if da * dc <= 20000 and abs(ia) <= 10**12 and abs(ic) <= 10**12:
            cnt = 0
            for p in sp.divisors(abs(ic)):
                for q in sp.divisors(abs(ia)):
                    if sp.gcd(p, q) == 1: cnt += 2
            ncand = cnt
    facs = []
    if kind in ('rational', 'repeated'):
        _, fl = sp.factor_list(prim.as_expr())
        lst = []
        for f, m in fl:
            fp = sp.Poly(f, x); q, p = [int(v) for v in fp.all_coeffs()]
            if q < 0: q, p = -q, -p
            for _ in range(m): lst.append((sp.Rational(-p, q), [q, -p]))
        lst.sort(key=lambda t: t[0]); facs = [t[1] for t in lst]
    return [a, b, c, kind, rt(Fr(int(k.p), int(k.q))), [ia, ib, ic], rt(Fr(int(h.p), int(h.q))), rt(Fr(int(kk.p), int(kk.q))), [rt(Fr(int(r.p), int(r.q))) for r in rats_u], ncand, kind in ('rational', 'repeated'), facs, rt(Fr(int((-kk / A).p), int((-kk / A).q)))]

def rnd(lo, hi): return R.randint(lo, hi)
def rfrac(den=(1, 2, 3, 4, 5, 6, 8, 10)):
    d = R.choice(den); n = rnd(-12, 12)
    return rt(Fr(n, d))

forms = []; seen = set()
def add(a, b, c):
    key = (a, b, c)
    if key in seen: return
    A = val(a)
    if A == 0: return
    seen.add(key); forms.append(frow(a, b, c))

for a, b, c in [('1', '-5', '6'), ('2', '3', '-5'), ('1', '-2', '-1'), ('1', '2', '5'), ('1', '-4', '4'), ('3/4', '1/2', '-2'), ('-6', '0', '24'), ('2', '-3', '0'), ('0.1', '0.2', '0.1'), ('4', '4', '5'), ('1', '0', '0'), ('6', '5', '-6'), ('1', '0', '1'), ('-1', '1', '0'), ('1', '1000000', '1'), ('1e9', '-2e9', '1e9'), ('12', '-7', '1'), ('2', '2', '-1'), ('5', '-10', '5'), ('9', '-12', '4'), ('1', '-2000000000', '1000000000000000000')]:
    add(a, b, c)
# rational roots built from random roots and leading coefficients
while len(forms) < 150:
    A = sp.Rational(R.choice([1, 1, 2, 3, -1, -2, 4, 5, 6, -3, 7, 12]), R.choice([1, 1, 1, 2, 3, 4]))
    r1 = sp.Rational(rnd(-9, 9), R.choice([1, 1, 2, 3, 4, 5])); r2 = sp.Rational(rnd(-9, 9), R.choice([1, 1, 2, 3, 4, 5]))
    if R.random() < 0.12: r2 = r1
    P = sp.Poly(sp.expand(A * (x - r1) * (x - r2)), x); a, b, c = [rt(Fr(int(v.p), int(v.q))) for v in P.all_coeffs()]
    add(a, b, c)
while len(forms) < 250:  # arbitrary coefficients: radicals and complex
    add(rfrac(), rfrac(), rfrac())
for _ in range(40):  # larger whole numbers
    add(str(rnd(-400, 400) or 1), str(rnd(-900, 900)), str(rnd(-600, 600)))

roots = []
for _ in range(80):
    A = rfrac(); 
    if val(A) == 0: continue
    r1, r2 = rfrac(), rfrac()
    P = sp.Poly(sp.expand(sr(val(A)) * (x - sr(val(r1))) * (x - sr(val(r2)))), x)
    roots.append([A, r1, r2] + [rt(Fr(int(v.p), int(v.q))) for v in P.all_coeffs()])
vertex = []
for _ in range(80):
    A = rfrac()
    if val(A) == 0: continue
    h, k = rfrac(), rfrac()
    P = sp.Poly(sp.expand(sr(val(A)) * (x - sr(val(h)))**2 + sr(val(k))), x)
    vertex.append([A, h, k] + [rt(Fr(int(v.p), int(v.q))) for v in P.all_coeffs()])
json.dump({'forms': forms, 'roots': roots, 'vertex': vertex}, open('tests/quad_exact_vectors.json', 'w'), ensure_ascii=False)
print(len(forms), len(roots), len(vertex))
