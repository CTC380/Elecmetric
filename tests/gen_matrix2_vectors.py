# Independent reference vectors for Mode 02. Python fractions; determinant by Laplace (cofactor) expansion, inverse = adj/det, rank by its own elimination.
import json, random
from fractions import Fraction as F
random.seed(21)
def rnd():
    t = random.random()
    return str(random.randint(-6, 6)) if t < .6 else '%d/%d' % (random.randint(-6, 6), random.randint(1, 6)) if t < .85 else '%.1f' % random.uniform(-4, 4)
def tx(x): return str(x.numerator) if x.denominator == 1 else '%d/%d' % (x.numerator, x.denominator)
def sub(M, i, j): return [[M[r][c] for c in range(len(M)) if c != j] for r in range(len(M)) if r != i]
def det(M):
    if len(M) == 1: return M[0][0]
    return sum((-1) ** j * M[0][j] * det(sub(M, 0, j)) for j in range(len(M)))
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
out = []
for _ in range(500):
    n = random.randint(1, 5); S = [[rnd() for _ in range(n)] for _ in range(n)]
    if random.random() < .3 and n > 1: S[random.randrange(n)] = S[random.randrange(n)][:]  # often singular
    if random.random() < .15 and n > 1: S[1] = [str(2 * F(x)) if '.' not in x else x for x in S[0]]
    M = [[F(x) for x in r] for r in S]; d = det(M)
    mi = [[det(sub(M, i, j)) if n > 1 else F(1) for j in range(n)] for i in range(n)]
    co = [[(-1) ** (i + j) * mi[i][j] for j in range(n)] for i in range(n)]
    adj = [[co[j][i] for j in range(n)] for i in range(n)]
    e = dict(A=S, det=tx(d), tr=tx(sum(M[i][i] for i in range(n))), rank=rank(M), minor=[[tx(x) for x in r] for r in mi], cof=[[tx(x) for x in r] for r in co], adj=[[tx(x) for x in r] for r in adj])
    e['inv'] = None if d == 0 else [[tx(x / d) for x in r] for r in adj]
    out.append(e)
rect = []
for _ in range(300):
    r, c = random.randint(1, 5), random.randint(1, 5); S = [[str(random.randint(-3, 3)) for _ in range(c)] for _ in range(r)]
    if r > 1 and random.random() < .5: S[-1] = [str(2 * int(x)) for x in S[0]]
    rect.append(dict(A=S, rank=rank([[F(x) for x in row] for row in S])))
json.dump(dict(sq=out, rect=rect), open('tests/matrix2_vectors.json', 'w')); print(len(out), len(rect), sum(1 for e in out if e['inv'] is None), 'singular')
