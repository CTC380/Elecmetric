# Independent reference vectors for tests/matrix_test.js: Python fractions, no shared code with tools/matrix_engine.js.
import json, random
from fractions import Fraction as F
random.seed(9)
def rnd():
    t = random.random()
    return str(random.randint(-9, 9)) if t < .5 else '%d/%d' % (random.randint(-9, 9), random.randint(1, 9)) if t < .8 else '%.2f' % random.uniform(-5, 5)
def val(s): return F(s)
def mat(r, c): return [[rnd() for _ in range(c)] for _ in range(r)]
def mul(X, Y): return [[sum(X[i][k] * Y[k][j] for k in range(len(Y))) for j in range(len(Y[0]))] for i in range(len(X))]
def tx(M): return [[str(x.numerator) if x.denominator == 1 else '%d/%d' % (x.numerator, x.denominator) for x in r] for r in M]
out = []
for _ in range(400):
    r, c, d = random.randint(1, 6), random.randint(1, 6), random.randint(1, 6)
    A, B, B2 = mat(r, c), mat(c, d), mat(r, c); a = [[val(x) for x in row] for row in A]; b = [[val(x) for x in row] for row in B]; b2 = [[val(x) for x in row] for row in B2]
    k = rnd(); s = random.randint(1, 5); sq = mat(s, s); q = [[val(x) for x in row] for row in sq]; n = random.randint(0, 6)
    P = [[F(int(i == j)) for j in range(s)] for i in range(s)]
    for _ in range(n): P = mul(P, q)
    out.append(dict(A=A, B=B, B2=B2, k=k, sq=sq, n=n,
        add=tx([[a[i][j] + b2[i][j] for j in range(c)] for i in range(r)]), sub=tx([[a[i][j] - b2[i][j] for j in range(c)] for i in range(r)]),
        mul=tx(mul(a, b)), scale=tx([[val(k) * x for x in row] for row in a]), tr=tx([[a[i][j] for i in range(r)] for j in range(c)]), pow=tx(P)))
json.dump(out, open('tests/matrix_vectors.json', 'w'))
print(len(out), 'vectors')
