# Independent verification of Mode 06 matrix functions against scipy.linalg (expm, logm, sqrtm, sinm, cosm).
# Run from the repo root: python3 tests/verify_matfun.py
import json, subprocess, sys, numpy as np, scipy.linalg as sl
rng = np.random.default_rng(20261120)
cases, ref = [], []
def add(op, A, r): cases.append({"op": op, "A": [[float(f"{x:.6g}") for x in row] for row in A]}); ref.append(r)
def rnd(n, s): return np.round(rng.normal(size=(n, n)) * s, 3)
for _ in range(150):
    n = int(rng.integers(1, 7)); A = rnd(n, rng.choice([0.3, 1, 3, 8]))
    add("expm", A, None)
for _ in range(100):
    n = int(rng.integers(1, 7)); A = rnd(n, rng.choice([0.3, 1, 2])); add("sinm", A, None); add("cosm", A, None)
for _ in range(120):                      # matrices with no eigenvalue on the closed negative axis
    n = int(rng.integers(1, 7)); kind = rng.integers(0, 3)
    if kind == 0: X = rnd(n, 0.5); A = np.round(sl.expm(X), 4)
    elif kind == 1: M = rnd(n, 1); A = np.round(M @ M.T + 0.5 * np.eye(n), 4)
    else: A = np.round(np.diag(rng.uniform(0.1, 20, n)) + 0.1 * rnd(n, 1), 4)
    if np.any((np.abs(np.linalg.eigvals(A).imag) < 1e-6) & (np.linalg.eigvals(A).real <= 1e-6)): continue
    add("sqrtm", A, None); add("logm", A, None)
for A in ([[-1, 0], [0, -1]], [[1, 2], [3, 4]], [[0, 0], [0, 1]], [[1, 1], [1, 1]], [[-4, 1], [0, 2]]):
    add("sqrtm", np.array(A, float), "reject"); add("logm", np.array(A, float), "reject")
json.dump(cases, open("tests/matfun_cases.json", "w")); subprocess.check_call(["node", "tests/matfun_run.js"]); out = json.load(open("tests/matfun_out.json"))
f = {"expm": sl.expm, "sinm": sl.sinm, "cosm": sl.cosm, "sqrtm": sl.sqrtm, "logm": sl.logm}
fails, n, worst, states = [], 0, {}, {}
for i, (c, r, o) in enumerate(zip(cases, ref, out)):
    A = np.array(c["A"]); op = c["op"]; n += 1
    if "exc" in o: fails.append(f"#{i} {op} exception {o['exc']}"); continue
    if r == "reject":
        if o["ok"]: fails.append(f"#{i} {op} should reject {A.tolist()}")
        continue
    if not o["ok"]: fails.append(f"#{i} {op} rejected {A.tolist()}: {o['error']}"); continue
    R = np.array(f[op](A)); R = R.real if np.iscomplexobj(R) and np.abs(R.imag).max() < 1e-9 * max(1, np.abs(R).max()) else R
    M = np.array(o["mats"][0]); err = np.linalg.norm(M - R) / max(np.linalg.norm(R), 1e-300)
    tol = 5e-6  # outputs are printed to 7 significant digits
    worst[op] = max(worst.get(op, 0), err)
    if err > tol: fails.append(f"#{i} {op} err={err:.2e} A={A.tolist()}")
    if op in ("sinm", "cosm"):
        other = np.array(o["mats"][1]); Ro = np.array(f["cosm" if op == "sinm" else "sinm"](A)).real; e2 = np.linalg.norm(other - Ro) / max(np.linalg.norm(Ro), 1e-300)
        if e2 > tol: fails.append(f"#{i} {op} companion err={e2:.2e}")
    bad = [k for k in o["checks"] if k[2] == "fail"]
    states[o["status"]] = states.get(o["status"], 0) + 1
    if bad: fails.append(f"#{i} {op} self-check fail {bad} A={A.tolist()}")
print(n, "cases;", {k: f"{v:.1e}" for k, v in worst.items()}, "worst relative error vs scipy"); print("statuses:", states)
if fails: print("FAILURES:"); [print(" ", x) for x in fails[:25]]; sys.exit(1)
print("ALL PASS")
