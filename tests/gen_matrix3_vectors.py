# Independent vectors for Mode 03. Systems are built from a known solution (B = A X0), so expected answers do not come from any solver.
# Type (unique / infinite / none) comes from Python's own rank computation per column.
import json, random
from fractions import Fraction as F
random.seed(33)
def tx(x): return str(x.numerator) if x.denominator == 1 else '%d/%d' % (x.numerator, x.denominator)
def rank(M):
    M = [r[:] for r in M]; rk = 0
    for c in range(len(M[0])):
        p = next((r for r in range(rk, len(M)) if M[r][c] != 0), None)
        if p is None: continue
        M[rk], M[p] = M[p], M[rk]
        for r in range(len(M)):
            if r != rk and M[r][c] != 0:
                f = M[r][c] / M[rk][c]; M[r] = [x - f * y for x, y in zip(M[r], M[rk])]
        rk += 1
    return rk
def det(M):
    if len(M) == 1: return M[0][0]
    return sum((-1) ** j * M[0][j] * det([r[:j] + r[j + 1:] for r in M[1:]]) for j in range(len(M)))
def cramer(A, b):  # pick n independent rows greedily, then Cramer's rule with Laplace determinants
    n = len(A[0]); rows = []
    for i in range(len(A)):
        if rank([A[r] for r in rows + [i]]) == len(rows) + 1: rows.append(i)
        if len(rows) == n: break
    S = [A[i] for i in rows]; d = det(S)
    return [det([r[:c] + [b[i]] + r[c + 1:] for r, i in zip(S, rows)]) / d for c in range(n)]
def rnd(): return F(random.randint(-5, 5)) if random.random() < .75 else F(random.randint(-5, 5), random.randint(1, 5))
out = []
for t in range(700):
    m, n, k = random.randint(1, 5), random.randint(1, 5), random.randint(1, 3)
    if t < 350: m = n
    A = [[rnd() for _ in range(n)] for _ in range(m)]
    mode = random.random()
    if m > 1 and mode < .35: A[random.randrange(m)] = [x * random.choice([2, F(1, 2), -1]) for x in A[0]]  # dependent row
    if n > 1 and m > 1 and .35 <= mode < .5: A[-1] = [A[0][j] + A[1][j] for j in range(n)]
    X0 = [[rnd() for _ in range(k)] for _ in range(n)]
    B = [[sum(A[i][l] * X0[l][j] for l in range(n)) for j in range(k)] for i in range(m)]
    for j in range(k):
        if random.random() < .3: B[random.randrange(m)][j] += random.randint(1, 3)  # may make it inconsistent
    rA = rank(A); cols = []; XE = [[None] * k for _ in range(n)]
    for j in range(k):
        rAug = rank([A[i] + [B[i][j]] for i in range(m)])
        cols.append('none' if rAug > rA else 'unique' if rA == n else 'infinite')
        if cols[-1] == 'unique':
            xs = cramer(A, [B[i][j] for i in range(m)])
            for i in range(n): XE[i][j] = xs[i]
    out.append(dict(A=[[tx(x) for x in r] for r in A], B=[[tx(x) for x in r] for r in B], X0=[[tx(x) if x is not None else None for x in r] for r in XE], rank=rA, types=cols, n=n, square=(m == n)))
json.dump(out, open('tests/matrix3_vectors.json', 'w'))
from collections import Counter; print(len(out), Counter(c for e in out for c in e['types']))
