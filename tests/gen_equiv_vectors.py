"""Independent vectors for the Ratio Calculator, Mode 03 (tools/equiv_engine.js), the Equivalent Ratio Generator.
Written without the engine, with Python's fractions.Fraction and sympy. Each case is a ratio as typed with an operation; the expected rows are found by
exact Fraction arithmetic (every term times the factor), the expected whole-number list by sympy.divisors of the gcd of the whole-number form, and the term text by the
rule "whole number, else an exact decimal when the denominator is 2^a 5^b with max(a, b) <= 12, else n/d" (decided with sympy.factorint).
Row of V.cases: [ratio text, op, extra {mults|factor|term|target}, [[label, ratio text, whole] ...] rows, first factor text, [[label, ratio text, simplest] ...] down or null, simplest form text, gcd text]
Row of V.err: [input object, field]. Run: python3 tests/gen_equiv_vectors.py -> tests/equiv_vectors.json"""
import json, random, math
from fractions import Fraction as Fr
import sympy as sp
R = random.Random(20261124)

def tt(q):
    if q.denominator == 1: return str(q.numerator)
    f = sp.factorint(q.denominator)
    if set(f) <= {2, 5} and max(f.get(2, 0), f.get(5, 0)) <= 12:
        p = max(f.get(2, 0), f.get(5, 0)); n = q.numerator * 10 ** p // q.denominator
        s = str(n).rjust(p + 1, '0'); return s[:-p] + '.' + s[-p:]
    return '%d/%d' % (q.numerator, q.denominator)

def rat(q): return str(q.numerator) if q.denominator == 1 else '%d/%d' % (q.numerator, q.denominator)
def label(m):
    if m.denominator == 1: return '\u00d7 %d' % m.numerator
    if m.numerator == 1: return '\u00f7 %d' % m.denominator
    return '\u00d7 %d/%d' % (m.numerator, m.denominator)
def join(qs): return ' : '.join(tt(q) for q in qs)

def simplest(qs):
    L = 1
    for q in qs: L = L * q.denominator // math.gcd(L, q.denominator)
    W = [int(q * L) for q in qs]; g = 0
    for w in W: g = math.gcd(g, w)
    return W, L, g, [w // g for w in W]

def term_text(kind):
    if kind == 'int': n = R.choice([R.randint(0, 12), R.randint(1, 400), R.randint(1, 10 ** 12)]); return str(n), Fr(n)
    if kind == 'dec': sc = R.randint(1, 4); n = R.randint(1, 10 ** (sc + 2)); s = str(n).rjust(sc + 1, '0'); return s[:-sc] + '.' + s[-sc:], Fr(n, 10 ** sc)
    if kind == 'frac': a, b = R.randint(1, 20), R.randint(2, 20); return '%d/%d' % (a, b), Fr(a, b)
    if kind == 'mixed': w, a, b = R.randint(1, 9), R.randint(1, 5), R.randint(6, 12); return '%d %d/%d' % (w, a, b), w + Fr(a, b)
    n = R.randint(1, 99); e = R.randint(1, 5); return '%de%d' % (n, e), Fr(n * 10 ** e)

def ratio(kinds, n=None):
    n = n or R.randint(2, 5); ts = []
    for _ in range(n):
        t = term_text(R.choice(kinds))
        ts.append(t)
    if all(q == 0 for _, q in ts): ts[0] = ('1', Fr(1))
    return ':'.join(t for t, _ in ts), [q for _, q in ts]

def rows_for(qs, mults):
    return [[lab, join([m * q for q in qs]), all((m * q).denominator == 1 for q in qs)] for lab, m in mults]

def down_for(qs):
    W, L, g, S = simplest(qs)
    out = [[label(Fr(L, d)), ' : '.join(str(w // d) for w in W), d == g] for d in sp.divisors(g)] if g <= 10 ** 12 else None
    if out is not None and len(out) > 48: out = out[:47] + [out[-1]]
    return out

def case(text, qs, op, extra, mults):
    W, L, g, S = simplest(qs)
    return [text, op, extra, rows_for(qs, mults), rat(mults[0][1]), down_for(qs), ' : '.join(map(str, S)), str(g)]

C = []
def add(text, qs, op, extra):
    if op == 'table':
        ms = extra['_m']; mults = [(lab, m) for lab, m in ms]; ex = {'mults': extra['mults']}
    elif op == 'multiply':
        m = extra['_f']; mults = [(extra['factor'], m)]; ex = {'factor': extra['factor']}
    elif op == 'divide':
        m = 1 / extra['_f']; mults = [(extra['factor'], m)]; ex = {'factor': extra['factor']}
    else:
        i = int(extra['term']) - 1; m = extra['_t'] / qs[i]; mults = [(rat(m), m)]; ex = {'term': extra['term'], 'target': extra['target']}
    row = case(text, qs, op, ex, mults)
    if op == 'multiply' or op == 'divide' or op == 'target': pass
    C.append(row)

# the CEO note and fixed cases
fixed = [('2:3', 'table', {'mults': '1, 2, 3, 4, 5, 10', '_m': [(str(k), Fr(k)) for k in (1, 2, 3, 4, 5, 10)]}),
         ('12:18', 'table', {'mults': '1-10', '_m': [(str(k), Fr(k)) for k in range(1, 11)]}),
         ('2:3:4', 'table', {'mults': '1, 2, 1/2, 2.5', '_m': [('1', Fr(1)), ('2', Fr(2)), ('1/2', Fr(1, 2)), ('2.5', Fr(5, 2))]}),
         ('2:3', 'multiply', {'factor': '4', '_f': Fr(4)}), ('8:12', 'divide', {'factor': '4', '_f': Fr(4)}), ('1.5:2.5', 'multiply', {'factor': '2', '_f': Fr(2)}),
         ('2:3', 'multiply', {'factor': '1/3', '_f': Fr(1, 3)}), ('3:4', 'target', {'term': '2', 'target': '100', '_t': Fr(100)}), ('2:3:5', 'target', {'term': '3', 'target': '100', '_t': Fr(100)}),
         ('400:5', 'target', {'term': '2', 'target': '1', '_t': Fr(1)}), ('400:5', 'target', {'term': '1', 'target': '240', '_t': Fr(240)}), ('0:5:10', 'table', {'mults': '1, 2, 3', '_m': [(str(k), Fr(k)) for k in (1, 2, 3)]}),
         ('1/2:3/4', 'table', {'mults': '1, 2, 4, 8', '_m': [(str(k), Fr(k)) for k in (1, 2, 4, 8)]}), ('2:3', 'table', {'mults': '1/3, 2/3', '_m': [('1/3', Fr(1, 3)), ('2/3', Fr(2, 3))]}),
         ('720720:1441440', 'multiply', {'factor': '1', '_f': Fr(1)}), ('1:50', 'multiply', {'factor': '3', '_f': Fr(3)}), ('60:24', 'target', {'term': '2', 'target': '1', '_t': Fr(1)})]
for text, op, ex in fixed:
    qs = [Fr(t.strip()) if not ' ' in t.strip() else None for t in text.split(':')]
    add(text, qs, op, ex)

def rnd_mult():
    k = R.choice(['int', 'frac', 'dec'])
    if k == 'int': n = R.randint(1, 60); return str(n), Fr(n)
    if k == 'frac': a, b = R.randint(1, 9), R.randint(2, 9); return '%d/%d' % (a, b), Fr(a, b)
    sc = R.randint(1, 3); n = R.randint(1, 10 ** (sc + 1)); s = str(n).rjust(sc + 1, '0'); return s[:-sc] + '.' + s[-sc:], Fr(n, 10 ** sc)

for _ in range(150):
    text, qs = ratio(['int', 'int', 'dec', 'frac', 'mixed', 'sci'])
    k = R.randint(1, 8); ms = [rnd_mult() for _ in range(k)]
    add(text, qs, 'table', {'mults': ', '.join(t for t, _ in ms), '_m': ms})
for _ in range(80):
    text, qs = ratio(['int', 'dec', 'frac', 'mixed']); t, m = rnd_mult()
    add(text, qs, R.choice(['multiply', 'divide']), {'factor': t, '_f': m})
for _ in range(100):
    text, qs = ratio(['int', 'dec', 'frac', 'mixed', 'int'])
    nz = [i for i, q in enumerate(qs) if q != 0]; i = R.choice(nz); t, m = rnd_mult(); t = R.choice([t, str(R.randint(1, 500))]); tq = Fr(t)
    add(text, qs, 'target', {'term': str(i + 1), 'target': t, '_t': tq})
for _ in range(25):  # many terms, large and highly composite numbers
    text, qs = ratio(['int'], R.randint(6, 12)); add(text, qs, 'table', {'mults': '1, 2, 3', '_m': [(str(k), Fr(k)) for k in (1, 2, 3)]})
for n in [360, 5040, 720720, 735134400, 963761198400, 1000000000000, 999999999989]:  # highly composite gcds, up to the 10^12 limit and a prime
    qs = [Fr(n), Fr(2 * n)]; add('%d:%d' % (n, 2 * n), qs, 'multiply', {'factor': '1', '_f': Fr(1)})
for k in (20, 30, 50, 58):  # very large terms: no divisor list over 10^12
    a = 10 ** k; qs = [Fr(a), Fr(3 * a)]; add('%d:%d' % (a, 3 * a), qs, 'multiply', {'factor': '2', '_f': Fr(2)})

print('cases', len(C))

ERR = [
 [{'ratio': '2:', 'op': 'table'}, 'ratio'], [{'ratio': '2:3:x', 'op': 'table'}, 'ratio'], [{'ratio': '-2:3', 'op': 'table'}, 'ratio'], [{'ratio': '0:0', 'op': 'table'}, 'ratio'],
 [{'ratio': '1:2:3:4:5:6:7:8:9:10:11:12:13', 'op': 'table'}, 'ratio'],
 [{'ratio': '2:3', 'op': 'table', 'mults': '0'}, 'mults'], [{'ratio': '2:3', 'op': 'table', 'mults': '-2'}, 'mults'], [{'ratio': '2:3', 'op': 'table', 'mults': '1, 2, x'}, 'mults'], [{'ratio': '2:3', 'op': 'table', 'mults': '10-1'}, 'mults'], [{'ratio': '2:3', 'op': 'table', 'mults': '0-5'}, 'mults'], [{'ratio': '2:3', 'op': 'table', 'mults': '1-61'}, 'mults'],
 [{'ratio': '2:3', 'op': 'multiply', 'factor': '0'}, 'factor'], [{'ratio': '2:3', 'op': 'multiply', 'factor': '-1'}, 'factor'], [{'ratio': '2:3', 'op': 'multiply', 'factor': 'abc'}, 'factor'],
 [{'ratio': '2:3', 'op': 'divide', 'factor': '0'}, 'divisor'], [{'ratio': '2:3', 'op': 'divide', 'factor': '-2'}, 'divisor'],
 [{'ratio': '0:5', 'op': 'target', 'term': '1', 'target': '3'}, 'term'], [{'ratio': '2:3', 'op': 'target', 'term': '3', 'target': '3'}, 'term'], [{'ratio': '2:3', 'op': 'target', 'term': '0', 'target': '3'}, 'term'], [{'ratio': '2:3', 'op': 'target', 'term': '1.5', 'target': '3'}, 'term'],
 [{'ratio': '2:3', 'op': 'target', 'term': '1', 'target': '0'}, 'target'], [{'ratio': '2:3', 'op': 'target', 'term': '1', 'target': '-4'}, 'target'], [{'ratio': '2:3', 'op': 'target', 'term': '1', 'target': 'q'}, 'target'],
 [{'ratio': '2:3', 'op': 'sideways'}, 'op']]
EMPTY = [[{'ratio': '2:3', 'op': 'table', 'mults': ','}], [{'ratio': '', 'op': 'table'}], [{'ratio': '5', 'op': 'table'}], [{'ratio': '2:3', 'op': 'table', 'mults': ''}], [{'ratio': '2:3', 'op': 'multiply', 'factor': ''}], [{'ratio': '2:3', 'op': 'divide', 'factor': ' '}], [{'ratio': '2:3', 'op': 'target', 'term': '1', 'target': ''}]]
json.dump({'cases': C, 'err': ERR, 'empty': EMPTY}, open('tests/equiv_vectors.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('wrote tests/equiv_vectors.json', len(C), 'cases,', len(ERR), 'errors,', len(EMPTY), 'empty')
