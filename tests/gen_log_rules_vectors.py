"""Independent vectors for the Logarithm Rules Calculator, Log Calculator Mode 04 (tools/log_rules_engine.js).
Expected values come from mpmath (110-digit log) and sympy (factorint), written without the engine:
  expr    sums of c*log_b(x): the value, how many base groups, and whether the sum is rational / irrational / undecided.
          Rows with a known exact value are built so that the value is known by construction (all bases and arguments are powers of one number u:
          log_(u^m)(u^j) = j/m exactly), then random rows with several unrelated bases.
  expand  log_b of a product, quotient and power: the coefficient of every prime in the expansion, the exactness and the value.
  verify  each rule at random inputs: both sides from mpmath, and whether the value is rational (sympy factorint, proportional prime exponents).
Run: python3 tests/gen_log_rules_vectors.py  ->  tests/log_rules_vectors.json"""
import json, random, sys
sys.set_int_max_str_digits(0)
from fractions import Fraction as Fr
import sympy as sp
import mpmath as mp
mp.mp.dps = 110
R = random.Random(20261125)

def txt(q): return str(q.numerator) if q.denominator == 1 else '%d/%d' % (q.numerator, q.denominator)

def vec(x):
    """exponent vector of a positive Fraction, or of the constant e"""
    if x == 'e': return {'e': Fr(1)}
    v = {}
    for p, k in sp.factorint(x.numerator).items(): v[int(p)] = Fr(k)
    for p, k in sp.factorint(x.denominator).items(): v[int(p)] = v.get(int(p), Fr(0)) - k
    return {k: e for k, e in v.items() if e != 0}

def vadd(a, b, s=Fr(1)):
    o = dict(a)
    for k, e in b.items(): o[k] = o.get(k, Fr(0)) + s * e
    return {k: e for k, e in o.items() if e != 0}

def prop(a, b):
    """a = mu*b -> mu, else None (b not empty)"""
    k0 = sorted(b, key=str)[0]
    if k0 not in a: return Fr(0) if not a else None
    mu = a[k0] / b[k0]
    if set(a) != set(b): return None
    return mu if all(a[k] == mu * b[k] for k in b) else None

def num(x): return mp.log(mp.exp(1)) if x == 'e' else mp.log(mp.mpf(x.numerator) / x.denominator)

def lval(b, x): return num(x) / num(b)

def mpstr(v, n=45): return mp.nstr(v, n)

# ---------- expressions ----------
def term_text(c, b, x_text):
    if b == 'e': lg = 'ln(' + x_text + ')'
    elif b == 10: lg = 'log(' + x_text + ')'
    elif b.denominator == 1: lg = 'log_' + str(b.numerator) + '(' + x_text + ')'
    else: lg = 'log_(' + txt(b) + ')(' + x_text + ')'
    return lg, c

def expr_text(terms):
    out = ''
    for i, (c, b, x) in enumerate(terms):
        lg, _ = term_text(c, b, arg_text(x))
        a = abs(c)
        body = lg if a == 1 else (txt(a) + '*' + lg if a.denominator == 1 else '(' + txt(a) + ')*' + lg)
        if i == 0: out += ('-' if c < 0 else '') + body
        else: out += (' - ' if c < 0 else ' + ') + body
    return out

def analyse(terms):
    """terms: (coef, base, arg Fraction or 'e') -> (status, exact Fraction or None, number of groups)"""
    classes = []
    for c, b, x in terms:
        D = vec(b); N = vec(x)
        for cl in classes:
            mu = prop(D, cl['D'])
            if mu is not None and mu != 0:
                cl['V'] = vadd(cl['V'], N, c / mu); break
        else:
            classes.append({'D': D, 'V': vadd({}, N, c)})
    lams = []
    for cl in classes:
        lams.append(Fr(0) if not cl['V'] else prop(cl['V'], cl['D']))
    irr = sum(1 for l in lams if l is None)
    if irr == 0: return 'rational', sum(lams, Fr(0)), len(classes)
    return ('irrational' if irr == 1 else 'undetermined'), None, len(classes)

def value(terms, const=Fr(0)):
    return mp.mpf(const.numerator) / const.denominator + sum((mp.mpf(c.numerator) / c.denominator) * lval(b, x) for c, b, x in terms)

def arg_text(x):
    return txt(x) if x != 'e' else 'e'

expr_rows = []
def add_expr(terms, const=Fr(0), text=None):
    st, ex, ng = analyse(terms)
    if st == 'rational': ex = ex + const
    t = text or expr_text(terms) + ('' if const == 0 else (' + ' if const > 0 else ' - ') + txt(abs(const)))
    v = value(terms, const)
    if st == 'rational': assert abs(v - mp.mpf(ex.numerator) / ex.denominator) < mp.mpf(10) ** -90, (t, v, ex)
    expr_rows.append({'text': t, 'status': st, 'exact': txt(ex) if ex is not None else None, 'value': mpstr(v), 'groups': ng})

# the CEO note and hand-checked cases
add_expr([(Fr(2), Fr(2), Fr(3)), (Fr(-1), Fr(2), Fr(9)), (Fr(1), Fr(2), Fr(12))])      # 2log2 3 - log2 9 + log2 12 = log2 12
add_expr([(Fr(1), Fr(2), Fr(8)), (Fr(1), Fr(4), Fr(16))])                                 # 3 + 2 = 5
add_expr([(Fr(1), Fr(2), Fr(3)), (Fr(1), Fr(4), Fr(1, 9))])                               # 0
add_expr([(Fr(10), Fr(10), Fr(100))])                                                      # 20
add_expr([(Fr(1), 'e', 'e')])                                                              # ln e = 1
add_expr([(Fr(1), Fr(2), Fr(3)), (Fr(1), Fr(3), Fr(2))])                                   # undetermined
add_expr([(Fr(1), Fr(2), Fr(3)), (Fr(1), Fr(2), Fr(5))])                                   # log2 15
add_expr([(Fr(1, 2), Fr(2), Fr(16))], const=Fr(1))
add_expr([(Fr(1), Fr(1, 2), Fr(8)), (Fr(-1), Fr(2), Fr(8))])                               # -3 - 3 = -6
add_expr([(Fr(1), Fr(2), Fr(3)), (Fr(1), Fr(1, 2), Fr(3))])                                # 0
add_expr([(Fr(1), Fr(10), Fr(1000)), (Fr(1), 'e', 'e')])                                   # 4
add_expr([(Fr(1), 'e', Fr(2)), (Fr(1), Fr(2), 'e')])                                       # ln2 + 1/ln2 undetermined
add_expr([(Fr(3), Fr(5), Fr(5)), (Fr(1), Fr(5), Fr(25))])                                  # 5
add_expr([(Fr(1), Fr(2), Fr(3)), (Fr(-1), Fr(2), Fr(3))])                                  # 0
add_expr([(Fr(0), Fr(2), Fr(3))])                                                           # 0

# forced exact: every base and argument a power of u
us = [Fr(2), Fr(3), Fr(5), Fr(6), Fr(7), Fr(10), Fr(1, 2), Fr(2, 3), Fr(3, 2), Fr(4, 9)]
cs = [Fr(1), Fr(-1), Fr(2), Fr(-2), Fr(3), Fr(1, 2), Fr(-1, 2), Fr(1, 3), Fr(5, 4), Fr(-3, 2)]
for _ in range(120):
    u = R.choice(us); terms = []
    for _ in range(R.randint(1, 5)):
        m = R.choice([1, 1, 2, 3, 4, -1, -2]); j = R.choice([i for i in range(-8, 9) if i != 0])
        terms.append((R.choice(cs), u ** m, u ** j))
    add_expr(terms, const=R.choice([Fr(0), Fr(0), Fr(1), Fr(-2), Fr(1, 2)]))
# one base group with a foreign factor (irrational) or one that cancels (rational)
primes = [2, 3, 5, 7, 11, 13]
for _ in range(100):
    b0 = Fr(R.choice([2, 3, 5, 6, 10]))
    terms = []
    for _ in range(R.randint(2, 4)):
        w = R.choice(primes); k = R.choice([i for i in range(-3, 4) if i != 0]); j = R.randint(-3, 3)
        terms.append((R.choice(cs), b0, Fr(w) ** k * b0 ** j))
    add_expr(terms)
for _ in range(25):                                    # a foreign factor that cancels exactly: w^k and w^-k with equal weight
    b0 = Fr(R.choice([2, 3, 5, 10])); w = R.choice([7, 11, 13]); k = R.randint(1, 3); c = R.choice(cs)
    terms = [(c, b0, Fr(w) ** k * b0 ** R.randint(0, 3)), (c, b0, Fr(w) ** -k * b0 ** R.randint(-3, 3))]
    add_expr(terms)
# several unrelated bases
for _ in range(80):
    terms = []
    for _ in range(R.randint(2, 4)):
        b = R.choice([Fr(2), Fr(3), Fr(5), Fr(7), Fr(10), Fr(1, 2), Fr(1, 3), 'e', Fr(4), Fr(9), Fr(8)])
        x = R.choice([Fr(2), Fr(3), Fr(5), Fr(7), Fr(8), Fr(9), Fr(81), Fr(1, 4), Fr(1, 27), Fr(10), Fr(100), Fr(1, 1000), Fr(3, 2), 'e', Fr(125), Fr(36)])
        terms.append((R.choice(cs), b, x))
    add_expr(terms)
# text variants that must read the same
text_rows = []
for t, ex_terms in [('log\u2082(8) + log\u2084(16)', [(Fr(1), Fr(2), Fr(8)), (Fr(1), Fr(4), Fr(16))]), ('log_2(8)+log2(4)', [(Fr(1), Fr(2), Fr(8)), (Fr(1), Fr(2), Fr(4))]), ('log_{0.5}(8) \u2212 log2(8)', [(Fr(1), Fr(1, 2), Fr(8)), (Fr(-1), Fr(2), Fr(8))]),
                    ('3\u00d7log10(1,000)', [(Fr(3), Fr(10), Fr(1000))]), ('2*(log2(3)+log2(5))', [(Fr(2), Fr(2), Fr(3)), (Fr(2), Fr(2), Fr(5))]), ('log2(2+6)', [(Fr(1), Fr(2), Fr(8))]), ('log2(8)/3', [(Fr(1, 3), Fr(2), Fr(8))]),
                    ('ln(e^2)', [(Fr(2), 'e', 'e')]), ('log2(2^3*3^-1)', [(Fr(1), Fr(2), Fr(8, 3))]), ('log2(0.125)', [(Fr(1), Fr(2), Fr(1, 8))]), ('log_(1/2)(1/8)', [(Fr(1), Fr(1, 2), Fr(1, 8))]), ('-log2(3) + 1/2*log2(9)', [(Fr(-1), Fr(2), Fr(3)), (Fr(1, 2), Fr(2), Fr(9))])]:
    st, ex, ng = analyse(ex_terms); v = value(ex_terms)
    text_rows.append({'text': t, 'status': st, 'exact': txt(ex) if ex is not None else None, 'value': mpstr(v)})
# ---------- expand ----------
def build_arg():
    """returns (argument text, Fraction value, factor list as typed)"""
    n = R.randint(1, 3); pieces = []; val = Fr(1)
    for i in range(n):
        base = R.choice([2, 3, 5, 6, 7, 10, 12, 15, 20, 36])
        k = R.choice([1, 1, 2, 3, -1, -2]); t = str(base) if k == 1 else (str(base) + '^' + str(k) if k > 0 else str(base) + '^(' + str(k) + ')')
        pieces.append((t, Fr(base) ** k, R.choice(['*', '/'])))
    text = pieces[0][0]; val = pieces[0][1]
    for t, v, op in pieces[1:]:
        text += op + t; val = val * v if op == '*' else val / v
    return text, val

expand_rows = []
for _ in range(120):
    b = R.choice([Fr(2), Fr(3), Fr(5), Fr(10), Fr(1, 2), Fr(4), Fr(6), Fr(8), 'e'])
    xt, xv = build_arg()
    v = vec(xv); vb = vec(b)
    lam = Fr(0) if not v else prop(v, vb)
    expand_rows.append({'b': txt(b) if b != 'e' else 'e', 'x': xt, 'xv': txt(xv), 'primes': {str(k): txt(e) for k, e in v.items()}, 'exact': txt(lam) if lam is not None else None, 'value': mpstr(lval(b, xv)), 'one': xv == 1})
for b, xt, xv in [('2', '36*5/7^2', Fr(180, 49)), ('10', '1000/8', Fr(125)), ('3', '81/(2+7)', Fr(9)), ('2', '0.5*2^10', Fr(512)), ('e', '2*3', Fr(6)), ('5', '1/125', Fr(1, 125)), ('2', '(2+3)^2/5', Fr(5))]:
    B = Fr(b) if b != 'e' else 'e'; v = vec(xv); vb = vec(B); lam = Fr(0) if not v else prop(v, vb)
    expand_rows.append({'b': b, 'x': xt, 'xv': txt(xv), 'primes': {str(k): txt(e) for k, e in v.items()}, 'exact': txt(lam) if lam is not None else None, 'value': mpstr(lval(B, xv)), 'one': xv == 1})

# ---------- verify ----------
def is_rat_log(b, x):
    vx, vb = vec(x), vec(b)
    return (not vx) or prop(vx, vb) is not None

verify_rows = []
NB = [Fr(2), Fr(3), Fr(5), Fr(10), Fr(1, 2), Fr(4), Fr(8), 'e', Fr(7), Fr(9)]
NX = [Fr(2), Fr(3), Fr(4), Fr(5), Fr(8), Fr(9), Fr(16), Fr(27), Fr(1, 2), Fr(1, 8), Fr(10), Fr(100), Fr(1000), Fr(3, 2), Fr(12), Fr(36), 'e']
def num_s(x): return x if isinstance(x, str) else txt(x)
for _ in range(220):
    rule = R.choice(['product', 'quotient', 'power', 'change', 'reciprocal', 'identity', 'zero', 'inverse', 'power2'])
    b = R.choice(NB); x = R.choice(NX); y = R.choice(NX); n = R.choice([Fr(3), Fr(-2), Fr(1, 2), Fr(5, 3), Fr(-1, 3), Fr(0), Fr(10), Fr(7, 2)]); c = R.choice([Fr(10), 'e', Fr(2), Fr(3), Fr(1, 2), Fr(5)])
    row = {'rule': rule, 'b': num_s(b), 'x': num_s(x), 'y': num_s(y), 'n': txt(n), 'c': num_s(c)}
    if rule == 'reciprocal' and x == 1: continue
    xm = lambda t: mp.exp(1) if t == 'e' else mp.mpf(t.numerator) / t.denominator
    nm = mp.mpf(n.numerator) / n.denominator
    if rule == 'product': lhs = num(x) / num(b) + num(y) / num(b)
    elif rule == 'quotient': lhs = num(x) / num(b) - num(y) / num(b)
    elif rule == 'power': lhs = nm * num(x) / num(b)
    elif rule == 'change': lhs = num(x) / num(b)
    elif rule == 'reciprocal': lhs = num(x) / num(b)
    elif rule == 'identity': lhs = mp.mpf(1)
    elif rule == 'zero': lhs = mp.mpf(0)
    elif rule == 'inverse': lhs = num(x)       # compared as ln(b^(log_b x)) = ln x
    else: lhs = nm
    # rational?  (product/quotient: both sides rational test is on the combined argument)
    if rule in ('product', 'quotient'):
        if x == 'e' or y == 'e':
            # e mixes with primes: the sum log_b(x) +- log_b(y) is a rational number exactly when the combined vector is proportional to b's
            vx = vec(x); vy = vec(y); comb = vadd(vx, vy, Fr(1) if rule == 'product' else Fr(-1)); rat = (not comb) or prop(comb, vec(b)) is not None
        else:
            xy = x * y if rule == 'product' else x / y; rat = is_rat_log(b, xy)
        # product/quotient rows: also the engine decides each side separately; both sides rational means both argument classes are
        lhs_rat = rat
    elif rule == 'power':
        v = {k: e * n for k, e in vec(x).items() if e * n != 0}; lhs_rat = (not v) or prop(v, vec(b)) is not None
    elif rule in ('change', 'reciprocal'): lhs_rat = is_rat_log(b, x)
    elif rule in ('identity', 'zero', 'power2'): lhs_rat = True
    else: lhs_rat = is_rat_log(b, x)
    row['value'] = mpstr(lhs); row['rational'] = bool(lhs_rat)
    verify_rows.append(row)

err = {'expr': ['', 'log2(0)', 'log2(-4)', 'log_1(5)', 'log_0(5)', 'log2(3)*log2(5)', 'log2(3)/log2(5)', 'abc', 'log2', 'log2(3', 'log2(3) +', '2^3*log2(x)', 'log_(-2)(8)', '1/0*log2(3)', '5', 'log2(2^1000001)', 'ln(0)'],
       'expandB': ['0', '1', '-3', 'x', '1/1'], 'expandX': ['0', '-4', '2-5', 'x', '(2+3', '0^2'],
       'verifyB': ['0', '1', '-2', 'q']}
json.dump({'expr': expr_rows, 'text': text_rows, 'expand': expand_rows, 'verify': verify_rows, 'err': err}, open(__file__.replace('gen_log_rules_vectors.py', 'log_rules_vectors.json'), 'w'))
print(len(expr_rows), 'expr rows,', len(text_rows), 'text rows,', len(expand_rows), 'expand rows,', len(verify_rows), 'verify rows')
