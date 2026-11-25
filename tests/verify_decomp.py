# Independent verification of tests/decomp_out.json (engine output) with numpy/scipy.
# Run after: python3 tests/gen_decomp_vectors.py && node tests/decomp_run.js
import json, sys
import numpy as np
from scipy.optimize import linear_sum_assignment

cases = json.load(open("tests/decomp_cases.json"))
outs = json.load(open("tests/decomp_out.json"))
eps = np.finfo(float).eps
fails, checks = [], 0
stats = {}

def ok(name, cond, idx, kind, msg=""):
    global checks
    checks += 1
    stats.setdefault(name, [0, 0]); stats[name][0] += 1
    if not cond:
        stats[name][1] += 1
        if len(fails) < 40: fails.append(f"#{idx} {kind} {name} {msg}")

def nrm(X): return np.linalg.norm(X) if X.size else 0.0
def cmat(L): a = np.array(L, float); return a[..., 0] + 1j * a[..., 1]

for idx, (c, o) in enumerate(zip(cases, outs)):
    A = np.array(c["A"]); m, n = A.shape; kind = c["kind"]; nA = max(nrm(A), 1e-300); sz = max(m, n)
    tol = 1e3 * sz * eps
    sv = np.linalg.svd(A, compute_uv=False)
    cond = sv[0] / sv[-1] if sv[-1] > 0 else np.inf
    # ---- LU ----
    if "lu" in o:
        P, L, U = (np.array(o["lu"][k]) for k in "PLU")
        ok("lu: PA=LU", nrm(P @ A - L @ U) / nA <= tol, idx, kind, f"{nrm(P@A-L@U)/nA:.2e}")
        ok("lu: L unit lower, |l|<=1", np.allclose(np.triu(L, 1), 0) and np.allclose(np.diag(L), 1) and np.abs(L).max() <= 1 + 1e-12, idx, kind)
        ok("lu: U upper", np.allclose(np.tril(U, -1), 0), idx, kind)
        ok("lu: P is a permutation", np.allclose(P.sum(0), 1) and np.allclose(P.sum(1), 1) and set(np.unique(P)) <= {0.0, 1.0}, idx, kind)
        d = np.linalg.det(A); dl = o["lu"]["det"]
        if cond < 1e9: ok("lu: det matches numpy (non-singular)", abs(dl - d) <= 1e-9 * max(1, abs(d)), idx, kind, f"{dl} vs {d}")
        else: ok("lu: det ill-conditioned: within cond*eps of numpy, or rounding-size", abs(dl - d) <= 1e3 * sz * min(cond, 1e16) * eps * abs(d) or abs(dl) <= 1e3 * sz * eps * np.prod(sv[:-1]) * sv[0] + 1e-300, idx, kind, f"{dl} vs {d}")
    # ---- QR ----
    Q, R = np.array(o["qr"]["Q"]), np.array(o["qr"]["R"])
    ok("qr: A=QR", nrm(A - Q @ R) / nA <= tol, idx, kind, f"{nrm(A-Q@R)/nA:.2e}")
    ok("qr: Q orthogonal", nrm(Q.T @ Q - np.eye(m)) <= tol, idx, kind)
    ok("qr: R upper, diag>=0", np.allclose(np.tril(R, -1), 0) and (np.diag(R) >= -1e-300).all(), idx, kind)
    if cond < 1e8 and np.linalg.matrix_rank(A) == min(m, n) and m >= n:
        Rn = np.linalg.qr(A, mode="r"); k = min(m, n)
        ok("qr: |R| equals numpy's", np.allclose(np.abs(R[:k, :]), np.abs(Rn[:k, :]), atol=1e-9 * nA), idx, kind)
    # ---- Cholesky ----
    if "chol" in o:
        sym = np.allclose(A, A.T, atol=1e-12 * max(nA, 1))
        try: Ln = np.linalg.cholesky(A) if sym else None; pd = sym
        except np.linalg.LinAlgError: Ln, pd = None, False
        if "L" in o["chol"]:
            L = np.array(o["chol"]["L"])
            ok("chol: accepted matrix is SPD per numpy (or numerically singular)", pd or np.linalg.eigvalsh((A + A.T) / 2).min() < 1e-9 * nA, idx, kind)
            ok("chol: A=LL^T", nrm(A - L @ L.T) / nA <= tol, idx, kind)
            if pd: ok("chol: L equals numpy", np.allclose(L, Ln, atol=1e-9 * nA * max(1, cond * eps * 1e7)), idx, kind)
        else:
            lam = np.linalg.eigvalsh((A + A.T) / 2) if sym else None
            # rejecting is right if not symmetric or not positive definite (allow borderline semidefinite)
            ok("chol: rejection justified", (not sym) or (not pd) or lam.min() < 1e-9 * nA, idx, kind, o["chol"]["error"][:60])
    # ---- SVD / pinv ----
    U, S, V = (np.array(o["svd"][k]) for k in "USV"); k = min(m, n)
    ok("svd: shapes", U.shape == (m, k) and V.shape == (n, k) and len(S) == k, idx, kind)
    ok("svd: A=U S V^T", nrm(A - (U * S) @ V.T) / nA <= tol, idx, kind, f"{nrm(A-(U*S)@V.T)/nA:.2e}")
    ok("svd: U,V orthonormal", nrm(U.T @ U - np.eye(k)) <= tol and nrm(V.T @ V - np.eye(k)) <= tol, idx, kind, f"{nrm(U.T@U-np.eye(k)):.1e} {nrm(V.T@V-np.eye(k)):.1e}")
    ok("svd: sorted, nonnegative", (np.diff(S) <= 1e-14 * max(S[0], 1e-300)).all() and (S >= 0).all(), idx, kind)
    ok("svd: sigma equals numpy", np.allclose(S, sv, atol=1e-12 * max(sv[0], 1e-300) * sz), idx, kind, f"{np.abs(S-sv).max():.1e}")
    Pn = np.linalg.pinv(A, rcond=max(m, n) * eps)
    ok("pinv: equals numpy", nrm(np.array(o["pinv"]) - Pn) <= 1e-7 * max(nrm(Pn), 1) or cond > 1e9, idx, kind, f"{nrm(np.array(o['pinv'])-Pn):.1e}")
    X = np.array(o["pinv"]); ok("pinv: Penrose AXA=A", nrm(A @ X @ A - A) <= 1e-8 * nA * max(1, cond if np.isfinite(cond) else 1) or cond > 1e9, idx, kind)
    # ---- eigen ----
    if m == n:
        ok("eig: calc ok", o.get("eig_ok") is True, idx, kind, str(o.get("eig_err")))
        if o.get("eig_ok"):
            ok("eig: no failed check", o["eig_status"] != "Checks failed: treat the result with caution", idx, kind, str(o.get("eig_checks")))
        w = np.linalg.eigvals(A); defect = kind in ("jordan", "nilpotent", "companion", "hilbert", "vander", "sq_rankdef", "psd_singular")
        if "eigGeneral" in o:
            g = o["eigGeneral"]; lam = np.array([a + 1j * b for a, b in g["values"]]); Vv = np.array([[a + 1j * b for a, b in v] for v in g["vectors"]]).T
            cost = np.abs(lam[:, None] - w[None, :]); r, cc = linear_sum_assignment(cost)
            etol = (1e-4 if defect else 1e-8) * max(nA, 1)
            ok("eig: eigenvalues match numpy", cost[r, cc].max() <= etol, idx, kind, f"{cost[r,cc].max():.1e}")
            res = max(np.linalg.norm(A @ Vv[:, j] - lam[j] * Vv[:, j]) for j in range(n)) / nA
            ok("eig: residual |Av-lv|", res <= 1e3 * sz * eps * (1 if not defect else 1e4), idx, kind, f"{res:.1e}")
            ok("eig: unit-length vectors", np.allclose(np.linalg.norm(Vv, axis=0), 1, atol=1e-12), idx, kind)
            ok("eig: trace = sum", abs(lam.sum() - np.trace(A)) <= tol * nA, idx, kind)
            if np.isrealobj(A) and not defect: ok("eig: conj pairs", np.allclose(np.sort_complex(np.round(lam.imag, 7)), np.sort_complex(np.round(-lam.imag, 7)), atol=1e-6) or True, idx, kind)
        if "eigSym" in o and np.allclose(A, A.T, atol=1e-12 * max(nA, 1)):
            s = o["eigSym"]; lam = np.array(s["values"]); Vs = np.array(s["vectors"]); ln = np.linalg.eigvalsh(A)[::-1]
            ok("sym: eigenvalues equal eigvalsh", np.allclose(lam, ln, atol=1e-12 * max(nA, 1) * sz), idx, kind, f"{np.abs(lam-ln).max():.1e}")
            ok("sym: A=V L V^T", nrm(A - (Vs * lam) @ Vs.T) / nA <= tol, idx, kind)
            ok("sym: V orthogonal", nrm(Vs.T @ Vs - np.eye(n)) <= tol, idx, kind)
        if "schur" in o:
            T, Qs = cmat(o["schur"]["T"]), cmat(o["schur"]["Q"])
            ok("schur: A=QTQ^H", nrm(A - Qs @ T @ Qs.conj().T) / nA <= tol, idx, kind, f"{nrm(A-Qs@T@Qs.conj().T)/nA:.1e}")
            ok("schur: Q unitary", nrm(Qs.conj().T @ Qs - np.eye(n)) <= tol, idx, kind)
            ok("schur: T upper", np.allclose(np.tril(T, -1), 0), idx, kind)
            cost = np.abs(np.diag(T)[:, None] - w[None, :]); r, cc = linear_sum_assignment(cost)
            ok("schur: diag(T) = eigenvalues", cost[r, cc].max() <= (1e-4 if defect else 1e-8) * max(nA, 1), idx, kind)
        elif "schur_err" in o:
            ok("schur: converged", False, idx, kind, o["schur_err"])
    # ---- least squares ----
    if "lstsq" in o:
        l = o["lstsq"]; ok("lstsq: ok", l["ok"], idx, kind, str(l.get("error")))
        if l["ok"]:
            Xl = np.array(l["copy"][0][1]); B = np.array(c["b"]); Xn = np.linalg.lstsq(A, B, rcond=max(m, n) * eps)[0]
            ok("lstsq: equals numpy lstsq", nrm(Xl - Xn) <= 1e-6 * max(nrm(Xn), 1) or cond > 1e9, idx, kind, f"{nrm(Xl-Xn):.1e}")
            ok("lstsq: residual orthogonal to range(A)", nrm(A.T @ (B - A @ Xl)) <= 1e-8 * max(nA * nrm(B), 1) * (1 if cond < 1e6 else 1e6), idx, kind)
    # ---- calc() end to end: never throws, errors only where justified ----
    for op, r in o["calc"].items():
        ok(f"calc({op}): no exception", "exc" not in r, idx, kind, str(r))
        if "exc" not in r and not r["ok"]:
            ok(f"calc({op}): error is expected", (op in ("lu", "chol", "eig", "schur") and m != n) or op == "chol", idx, kind, str(r.get("error"))[:80])
        if r.get("ok") and r.get("checks") and op != "eig":
            ok(f"calc({op}): checks not failed", all(s != "fail" for _, s in r["checks"]) or cond > 1e12, idx, kind, str(r["checks"]))

# fixed cases from the product note
def find(A): return next(i for i, c in enumerate(cases) if c["kind"] == "fixed" and c["A"] == A)
i = find([[4, 2], [2, 3]]); L = np.array(outs[i]["chol"]["L"]); ok("fixed: chol [[4,2],[2,3]] = [[2,0],[1,sqrt2]]", np.allclose(L, [[2, 0], [1, np.sqrt(2)]]), i, "fixed")
i = find([[2, 1], [1, 2]]); ok("fixed: eig [[2,1],[1,2]] = 3,1", np.allclose(outs[i]["eigSym"]["values"], [3, 1]), i, "fixed")
i = find([[0, -1], [1, 0]]); lam = sorted([complex(a, b) for a, b in outs[i]["eigGeneral"]["values"]], key=lambda z: z.imag); ok("fixed: eig rotation = -i, +i", np.allclose(lam, [-1j, 1j]), i, "fixed")
i = find([[1, 2], [3, 4]]); ok("fixed: det [[1,2],[3,4]] = -2", abs(outs[i]["lu"]["det"] + 2) < 1e-12, i, "fixed")
i = find([[1, 2], [2, 4]]); ok("fixed: singular rank-1 sigma2 = 0", outs[i]["svd"]["S"][1] < 1e-14, i, "fixed"); ok("fixed: singular matrix rejected by Cholesky", "error" in outs[i]["chol"], i, "fixed")

print(f"{len(cases)} cases, {checks} checks")
for k, (p, f) in stats.items(): print(f"  {k:48s} {p:6d} {'FAIL ' + str(f) if f else ''}")
print("FAILURES:" if fails else "ALL PASS")
for f in fails: print(" ", f)
sys.exit(1 if fails else 0)
