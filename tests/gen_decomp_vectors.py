# Inputs for tests/decomp_test.js. Python/numpy/scipy only: no shared code with tools/decomp_engine.js.
# Run:  python3 tests/gen_decomp_vectors.py   (writes tests/decomp_cases.json)
import json, random
import numpy as np

rng = np.random.default_rng(20261119)
random.seed(20261119)
cases = []

def add(kind, A, b=None):
    c = {"kind": kind, "A": np.asarray(A, float).tolist()}
    if b is not None:
        c["b"] = np.asarray(b, float).tolist()
    cases.append(c)

def rnd(m, n, lo=-9, hi=9):
    return rng.integers(lo, hi + 1, size=(m, n)).astype(float)

# random square, integers and decimals
for _ in range(300):
    n = int(rng.integers(1, 9)); add("sq_int", rnd(n, n))
for _ in range(200):
    n = int(rng.integers(1, 9)); add("sq_real", np.round(rng.normal(size=(n, n)) * 3, 3))
# rank-deficient square
for _ in range(80):
    n = int(rng.integers(2, 9)); r = int(rng.integers(1, n))
    add("sq_rankdef", rnd(n, r) @ rnd(r, n))
# rectangular (tall, wide)
for _ in range(250):
    m = int(rng.integers(1, 9)); n = int(rng.integers(1, 9)); add("rect", rnd(m, n))
for _ in range(60):
    m = int(rng.integers(2, 9)); n = int(rng.integers(1, m + 1)); add("tall_real", np.round(rng.normal(size=(m, n)), 3))
for _ in range(60):
    m = int(rng.integers(2, 9)); n = int(rng.integers(2, 9)); r = int(rng.integers(1, min(m, n)))
    add("rect_rankdef", rnd(m, r) @ rnd(r, n))
# least squares (with b)
for _ in range(150):
    m = int(rng.integers(1, 9)); n = int(rng.integers(1, 9)); add("lstsq", rnd(m, n), rnd(m, 2))
# symmetric, SPD, symmetric indefinite
for _ in range(200):
    n = int(rng.integers(1, 9)); M = rnd(n, n); add("spd", M @ M.T + np.eye(n) * float(rng.integers(1, 4)))
for _ in range(150):
    n = int(rng.integers(1, 9)); M = rnd(n, n); add("sym", M + M.T)
for _ in range(60):
    n = int(rng.integers(2, 9)); M = rnd(n, n); add("psd_singular", M @ M.T * 0 + (lambda X: X @ X.T)(rnd(n, max(1, n - 1))))
# non-symmetric with complex eigenvalues
for _ in range(80):
    n = int(rng.integers(2, 9)); th = rng.uniform(0.1, 3.0)
    R = np.eye(n); R[:2, :2] = [[np.cos(th), -np.sin(th)], [np.sin(th), np.cos(th)]]
    Qm, _ = np.linalg.qr(rng.normal(size=(n, n))); add("rot", np.round(Qm @ R @ Qm.T, 6))
# special named matrices
for n in range(1, 9):
    add("hilbert", [[1 / (i + j + 1) for j in range(n)] for i in range(n)])
    add("identity", np.eye(n)); add("zero", np.zeros((n, n)))
    J = np.eye(n) * 2 + np.eye(n, k=1); add("jordan", J)
    add("nilpotent", np.eye(n, k=1))
    add("diag_repeat", np.diag([3.0] * n))
    P = np.zeros((n, n)); P[:, 0] = 1; P[np.arange(n - 1) + 1, np.arange(n - 1)] = 0
    C = np.zeros((n, n))
    for i in range(n - 1): C[i + 1, i] = 1
    C[:, -1] = rng.integers(-5, 6, size=n); add("companion", C)
    add("tridiag", np.diag([2.0] * n) - np.eye(n, k=1) - np.eye(n, k=-1))
    add("vander", np.vander(np.arange(1, n + 1, dtype=float)))
add("fixed", [[1, 2], [3, 4]]); add("fixed", [[4, 2], [2, 3]]); add("fixed", [[2, 1], [1, 2]]); add("fixed", [[0, -1], [1, 0]])
add("fixed", [[1, 2, 3], [4, 5, 6], [7, 8, 9]]); add("fixed", [[1, 2], [2, 4]]); add("fixed", [[2, 0], [0, 3]])
add("lstsq", [[1, 1], [1, 2], [1, 3]], [[1], [2], [2]])

json.dump(cases, open("tests/decomp_cases.json", "w"))
print(len(cases), "cases")
