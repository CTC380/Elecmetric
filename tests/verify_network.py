# Independent verification of the Mode 05 network engine (tools/network_engine.js) with numpy/scipy.
# Generates random cases, runs tests/network_run.js, and compares with references built by DIFFERENT methods:
#   nodal / mesh : sparse tableau analysis (KCL, KVL and branch equations solved together)
#   Y-bus        : per-branch two-port matrices placed with selection vectors
#   Z-bus        : numpy inverse
#   incidence    : numpy rank, A.Bt = 0, A G At
#   state-space  : numpy eigenvalues, scipy ss2tf, SVD rank
#   symmetrical  : numpy matrix transform and power invariance
#   DC power flow: numpy solve of reduced B'
# Run from the repo root:  python3 tests/verify_network.py
import json, subprocess, sys, random, cmath, math
import numpy as np
from scipy import signal

rng = random.Random(20261119)
cases, refs = [], []
def add(op, text, ref): cases.append({"op": op, "text": text}); refs.append(ref)
def cj(x): x = complex(x); return f"{x.real!r}{x.imag:+!r}j".replace("+-", "-")
def fmtc(x):
    x = complex(x); return f"{x.real!r}{'+' if x.imag >= 0 else '-'}{abs(x.imag)!r}j"

# ---------- tableau reference ----------
def tableau(nn, br):
    """nn non-ground nodes (1..nn), br = list of dict(a,b,kind,val,z) with a,b node numbers (0 = ground).
    kind R/Z (z impedance), V (val = a-b voltage), I (val = current a->b). Returns node voltages and branch currents."""
    b = len(br); N = nn + 2 * b; M = np.zeros((N, N), complex); rhs = np.zeros(N, complex)
    for k, e in enumerate(br):
        for node, sg in ((e["a"], 1), (e["b"], -1)):
            if node > 0: M[node - 1, nn + b + k] += sg           # KCL: branch current leaving node
        r = nn + b + k + nn - nn  # placeholder not used
    # KVL rows: u_k - (v_a - v_b) = 0 ; branch rows
    for k, e in enumerate(br):
        row = nn + k                                           # rows nn..nn+b-1 : KVL
        M[row, nn + k] = 1
        if e["a"] > 0: M[row, e["a"] - 1] -= 1
        if e["b"] > 0: M[row, e["b"] - 1] += 1
    for k, e in enumerate(br):
        row = nn + b + k                                       # rows nn+b.. : branch equations (nn rows KCL were already used at 0..nn-1)
    # the KCL rows are 0..nn-1, KVL rows nn..nn+b-1, branch rows need b more: size nn + 2b
    M2 = np.zeros((nn + 2 * b, nn + 2 * b), complex); r2 = np.zeros(nn + 2 * b, complex)
    iu, ii = nn, nn + b
    for k, e in enumerate(br):
        for node, sg in ((e["a"], 1), (e["b"], -1)):
            if node > 0: M2[node - 1, ii + k] += sg
        M2[nn + k, iu + k] = 1
        if e["a"] > 0: M2[nn + k, e["a"] - 1] -= 1
        if e["b"] > 0: M2[nn + k, e["b"] - 1] += 1
        row = nn + b + k
        if e["kind"] in "RZ": M2[row, iu + k] = 1; M2[row, ii + k] = -e["z"]
        elif e["kind"] == "V": M2[row, iu + k] = 1; r2[row] = e["val"]
        else: M2[row, ii + k] = 1; r2[row] = e["val"]
    x = np.linalg.solve(M2, r2)
    return x[:nn], x[ii:ii + b], x[iu:iu + b]

# ---------- nodal cases ----------
def gen_nodal(ac):
    nn = rng.randint(2, 7); br = []; lines = []; cnt = {"R": 0, "L": 0, "C": 0, "Z": 0, "V": 0, "I": 0}
    f = rng.choice([50, 60, 400, 1000]) if ac else 0; w = 2 * math.pi * f
    def passive(a, b):
        kinds = ["R", "R", "L", "C", "Z"] if ac else ["R"]
        k = rng.choice(kinds); cnt[k] += 1; name = f"{k}{cnt[k]}"
        if k == "R": v = round(rng.uniform(1, 1000), 3); z = complex(v); t = repr(v)
        elif k == "L": v = round(rng.uniform(1e-3, 1.0), 5); z = 1j * w * v; t = repr(v)
        elif k == "C": v = round(rng.uniform(1e-6, 1e-4), 8); z = 1 / (1j * w * v); t = repr(v)
        else: z = complex(round(rng.uniform(1, 200), 2), round(rng.uniform(-200, 200), 2)); t = fmtc(z)
        br.append({"a": a, "b": b, "kind": "Z" if k != "R" else "R", "z": z, "name": name}); lines.append(f"{name} {a} {b} {t}")
    for k in range(1, nn + 1): passive(rng.randint(0, k - 1), k)
    for _ in range(rng.randint(0, nn)):
        a, b = rng.sample(range(0, nn + 1), 2); passive(a, b)
    vnodes = rng.sample(range(1, nn + 1), rng.randint(0, min(2, nn)))
    for k in vnodes:
        cnt["V"] += 1; name = f"V{cnt['V']}"
        if ac: mag, ang = round(rng.uniform(1, 230), 2), round(rng.uniform(-180, 180), 1); val = cmath.rect(mag, math.radians(ang)); t = f"{mag}<{ang}"
        else: val = complex(round(rng.uniform(-50, 50), 2)); t = repr(val.real)
        a, b = (k, 0)
        br.append({"a": a, "b": b, "kind": "V", "val": val, "name": name}); lines.append(f"{name} {a} {b} {t}")
    for _ in range(rng.randint(0 if vnodes else 1, 2)):
        cnt["I"] += 1; name = f"I{cnt['I']}"; a, b = rng.sample(range(0, nn + 1), 2)
        if ac: mag, ang = round(rng.uniform(0.01, 5), 3), round(rng.uniform(-180, 180), 1); val = cmath.rect(mag, math.radians(ang)); t = f"{mag}<{ang}"
        else: val = complex(round(rng.uniform(-5, 5), 3)); t = repr(val.real)
        br.append({"a": a, "b": b, "kind": "I", "val": val, "name": name}); lines.append(f"{name} {a} {b} {t}")
    if ac: lines.append(f"freq {f}")
    rng.shuffle(lines)
    v, i, u = tableau(nn, br)
    return "\n".join(lines), {"nn": nn, "v": v, "i": i, "names": [e["name"] for e in br]}
for k in range(120): t, r = gen_nodal(False); add("nodal", t, r)
for k in range(120): t, r = gen_nodal(True); add("nodal", t, r)

# ---------- mesh cases (ladder networks), compared with tableau on the equivalent graph ----------
def gen_mesh():
    m = rng.randint(1, 5); lines, brs, cnt = [], [], {"R": 0, "V": 0, "I": 0}
    # reference nodes: t0..tm = 1..m+1 ; b0..bm = m+2..2m+2 ; mid nodes appended after
    T = lambda k: 1 + k
    Bn = lambda k: m + 2 + k
    nxt = [2 * m + 3]
    def newnode(): nxt[0] += 1; return nxt[0] - 1
    # one bottom node is ground: map b0 -> ground
    def gnd(n): return 0 if n == Bn(0) else n
    def elem(kind, a, b, meshes, cs=False):
        cnt[kind] += 1; name = f"{kind}{cnt[kind]}"
        if kind == "R": v = round(rng.uniform(1, 100), 2); brs.append({"a": a, "b": b, "kind": "R", "z": complex(v), "name": name}); lines.append(f"{name} {v} {' '.join(map(str, meshes))}")
        elif kind == "V": v = round(rng.uniform(-30, 30), 2); brs.append({"a": a, "b": b, "kind": "V", "val": complex(-v), "name": name}); lines.append(f"{name} {v} {' '.join(map(str, meshes))}")
        else: v = round(rng.uniform(-4, 4), 3); brs.append({"a": a, "b": b, "kind": "I", "val": complex(v), "name": name}); lines.append(f"{name} {v} {' '.join(map(str, meshes))}")
    used = set(); csv = {}
    for j in range(0, m + 1):
        meshes = [mm for mm in (j, j + 1) if 1 <= mm <= m]
        if rng.random() < 0.25 and not (set(meshes) & used) and not (m == 1 and False): csv[j] = True; used |= set(meshes)
    if not csv and rng.random() < 0.3: pass
    # top and bottom edges
    for k in range(1, m + 1):
        x = newnode()                                           # top edge in two series slots
        elem(rng.choice(["R", "R", "V"]), T(k - 1), x, [k]); elem("R", x, T(k), [k])
        y = newnode()
        elem(rng.choice(["R", "R", "V"]), Bn(k), y, [k]); elem("R", y, Bn(k - 1), [k])
    for j in range(0, m + 1):
        meshes = [mm for mm in (j, j + 1) if 1 <= mm <= m]
        a, b = (Bn(0), T(0)) if j == 0 else (T(j), Bn(j))
        elem("I" if csv.get(j) else "R", a, b, [meshes[0]] if j == 0 else meshes if j < m else [m]) if j in (0, m) else elem("I" if csv.get(j) else "R", a, b, [j, j + 1])
    # remap nodes: ground = b0 ; renumber the rest 1..
    allnodes = sorted({n for e in brs for n in (e["a"], e["b"])} - {Bn(0)}); mp = {n: i + 1 for i, n in enumerate(allnodes)}; mp[Bn(0)] = 0
    for e in brs: e["a"] = mp[e["a"]]; e["b"] = mp[e["b"]]
    v, i, u = tableau(len(allnodes), brs)
    # series V can leave both-side dangling nodes? every node has two R/V edges so solvable
    rng.shuffle(lines)
    return "\n".join(lines), {"names": [e["name"] for e in brs], "i": i, "u": u}
for k in range(150):
    try: t, r = gen_mesh()
    except np.linalg.LinAlgError: continue
    add("mesh", t, r)

# ---------- Y-bus / Z-bus ----------
def gen_bus():
    n = rng.randint(3, 8); lines, br, sh = [], [], []
    def branch(a, b):
        r = round(rng.uniform(0.005, 0.1), 4); x = round(rng.uniform(0.02, 0.4), 4)
        if rng.random() < 0.3: tap = round(rng.uniform(0.9, 1.1), 3); lines.append(f"xfmr {a} {b} {r} {x} {tap}"); br.append((a, b, r, x, 0.0, tap))
        else:
            bch = round(rng.uniform(0, 0.2), 4) if rng.random() < 0.6 else 0.0; lines.append(f"line {a} {b} {r} {x} {bch}" if bch else f"line {a} {b} {r} {x}"); br.append((a, b, r, x, bch, 1.0))
    for k in range(2, n + 1): branch(rng.randint(1, k - 1), k)
    for _ in range(rng.randint(0, n)):
        a, b = rng.sample(range(1, n + 1), 2); branch(a, b)
    for _ in range(rng.randint(0, 2)):
        a = rng.randint(1, n); g = round(rng.uniform(0, 0.1), 4); bb = round(rng.uniform(-0.3, 0.3), 4); lines.append(f"shunt {a} {g} {bb}"); sh.append((a, complex(g, bb)))
    Y = np.zeros((n, n), complex)
    for (a, b, r, x, bch, tap) in br:
        y = 1 / complex(r, x); two = np.array([[y / tap**2 + 0.5j * bch, -y / tap], [-y / tap, y + 0.5j * bch]])
        S = np.zeros((2, n)); S[0, a - 1] = 1; S[1, b - 1] = 1; Y += S.T @ two @ S
    for a, ys in sh: Y[a - 1, a - 1] += ys
    return "\n".join(lines), Y, n
for k in range(80): t, Y, n = gen_bus(); add("ybus", t, {"Y": Y})
for k in range(80):
    t, Y, n = gen_bus(); ref = rng.choice([None, rng.randint(1, n)])
    if ref: t += f"\nref {ref}"
    keep = [i for i in range(n) if ref is None or i + 1 != ref]; Yr = Y[np.ix_(keep, keep)]
    try: Z = np.linalg.inv(Yr); sing = np.linalg.cond(Yr) > 1e12
    except np.linalg.LinAlgError: Z = None; sing = True
    add("zbus", t, {"Z": Z, "singular": sing})

# ---------- incidence ----------
def gen_inc():
    n = rng.randint(3, 8); zero = rng.random() < 0.6; nodes = list(range(0 if zero else 1, n + (0 if zero else 1)))
    br = []
    for k in range(1, len(nodes)):
        a = rng.choice(nodes[:k]); b = nodes[k]; br.append((a, b) if rng.random() < 0.5 else (b, a))
    for _ in range(rng.randint(0, 5)):
        a, b = rng.sample(nodes, 2); br.append((a, b))
    vals = [round(rng.uniform(1, 100), 2) for _ in br] if rng.random() < 0.6 else None
    lines = [f"b{k+1} {a} {b}" + (f" {vals[k]}" if vals else "") for k, (a, b) in enumerate(br)]
    A = np.zeros((len(nodes), len(br)))
    for k, (a, b) in enumerate(br): A[nodes.index(a), k] += 1; A[nodes.index(b), k] -= 1
    ref = nodes.index(0) if zero else 0
    Ar = np.delete(A, ref, axis=0); Y = None
    if vals: g = 1 / np.array(vals); Y = Ar @ np.diag(g) @ Ar.T
    return "\n".join(lines), {"A": A, "Y": Y, "rank": np.linalg.matrix_rank(A), "nb": len(br), "nn": len(nodes), "vals": vals}
for k in range(80): t, r = gen_inc(); add("incidence", t, r)

# ---------- state space ----------
def gen_ss():
    n = rng.randint(1, 5); m = rng.choice([1, 1, 2]); p = rng.choice([1, 1, 2]); disc = rng.random() < 0.3
    A = np.array([[rng.randint(-4, 4) for _ in range(n)] for _ in range(n)], float); B = np.array([[rng.randint(-3, 3) for _ in range(m)] for _ in range(n)], float)
    C = np.array([[rng.randint(-3, 3) for _ in range(n)] for _ in range(p)], float); Dm = np.array([[rng.choice([0, 0, 1, -2]) for _ in range(m)] for _ in range(p)], float)
    row = lambda M: " ; ".join(" ".join(repr(int(v)) for v in r) for r in M)
    text = f"A = {row(A)}\nB = {row(B)}\nC = {row(C)}\nD = {row(Dm)}" + ("\ntype discrete" if disc else "")
    return text, {"A": A, "B": B, "C": C, "D": Dm, "disc": disc}
for k in range(120): t, r = gen_ss(); add("ss", t, r)

# ---------- symmetrical components ----------
def gen_sym():
    a = cmath.exp(2j * math.pi / 3); lines = []
    mk = lambda: cmath.rect(rng.uniform(1, 200), math.radians(rng.uniform(-180, 180)))
    res = {}
    fromphase = rng.random() < 0.6
    for q in "vi" if rng.random() < 0.5 else "v":
        x = [mk() for _ in range(3)]
        if fromphase:
            for nm, z in zip("abc", x): lines.append(f"{q}{nm} {z.real!r}{'+' if z.imag >= 0 else '-'}{abs(z.imag)!r}j")
            T = np.array([[1, 1, 1], [1, a, a * a], [1, a * a, a]]) / 3; res[q] = (np.array(x), T @ np.array(x))
        else:
            for nm, z in zip("012", x): lines.append(f"{q}{nm} {abs(z)!r}<{math.degrees(cmath.phase(z))!r}")
            Ti = np.array([[1, 1, 1], [1, a * a, a], [1, a, a * a]]); res[q] = (Ti @ np.array(x), np.array(x))
    return "\n".join(lines), res
for k in range(60): t, r = gen_sym(); add("symm", t, r)

# ---------- DC power flow ----------
def gen_dc():
    n = rng.randint(3, 8); lines = []; ln = []
    for k in range(2, n + 1): ln.append((rng.randint(1, k - 1), k, round(rng.uniform(0.02, 0.5), 4)))
    for _ in range(rng.randint(0, n)): a, b = rng.sample(range(1, n + 1), 2); ln.append((a, b, round(rng.uniform(0.02, 0.5), 4)))
    P = {k: round(rng.uniform(-2, 2), 3) for k in range(1, n + 1) if rng.random() < 0.7}; slack = rng.randint(1, n)
    lines += [f"line {a} {b} {x}" for a, b, x in ln] + [f"p {k} {v}" for k, v in P.items()] + [f"slack {slack}"]
    Bp = np.zeros((n, n))
    for a, b, x in ln: y = 1 / x; Bp[a - 1, a - 1] += y; Bp[b - 1, b - 1] += y; Bp[a - 1, b - 1] -= y; Bp[b - 1, a - 1] -= y
    pv = np.array([P.get(k, 0.0) for k in range(1, n + 1)]); others = [i for i in range(n) if i != slack - 1]
    pv[slack - 1] = -pv[others].sum(); th = np.zeros(n); th[others] = np.linalg.solve(Bp[np.ix_(others, others)], pv[others])
    return "\n".join(lines), {"theta": th, "flows": np.array([(th[a - 1] - th[b - 1]) / x for a, b, x in ln]), "slackP": pv[slack - 1]}
for k in range(80): t, r = gen_dc(); add("dcpf", t, r)

json.dump(cases, open("tests/network_cases.json", "w"))
subprocess.check_call(["node", "tests/network_run.js"])
outs = json.load(open("tests/network_out.json"))
fails, checks, stats = [], 0, {}
eps = np.finfo(float).eps
def ok(op, name, cond, idx, msg=""):
    global checks
    checks += 1; s = stats.setdefault((op, name), [0, 0]); s[0] += 1
    if not cond:
        s[1] += 1
        if len(fails) < 40: fails.append(f"#{idx} {op} {name} {msg}")
def cx(p): return complex(p[0], p[1])
def close(a, b, rel=1e-9, ab=1e-12):
    a = np.asarray(a, complex); b = np.asarray(b, complex); return bool(np.all(np.abs(a - b) <= rel * np.maximum(np.abs(b), 1) + ab * max(1, np.abs(b).max() if b.size else 1)))

statuses = {}
for idx, (c, ref, o) in enumerate(zip(cases, refs, outs)):
    op = c["op"]
    if "exc" in o: ok(op, "no exception", False, idx, o["exc"]); continue
    if op == "zbus":
        if ref["Z"] is None or ref["singular"]: ok(op, "singular rejected", not o["ok"] or any(k[2] != "pass" for k in o["checks"]), idx, str(o.get("error"))); continue
    if not o["ok"]: ok(op, "accepted", False, idx, str(o.get("error"))); continue
    r = o["raw"]; statuses[(op, o["status"])] = statuses.get((op, o["status"]), 0) + 1
    if op == "nodal":
        nn = ref["nn"]; labels = r["labels"]; v = np.array([cx(r["V"][labels.index(str(k + 1))]) for k in range(nn)])
        cond = r["cond"]; tol = max(1e-9, 1e-14 * cond)
        ok(op, "node voltages", close(v, ref["v"], rel=tol), idx, f"cond={cond:.2e}")
        by = {e["name"]: cx(e["i"]) for e in r["elems"]}; ci = np.array([by[nm] for nm in ref["names"]])
        ok(op, "branch currents", close(ci, ref["i"], rel=tol), idx)
    elif op == "mesh":
        by = {e["name"]: (cx(e["i"]), cx(e["v"])) for e in r["elems"]}; ci = np.array([by[nm][0] for nm in ref["names"]]); cv = np.array([by[nm][1] for nm in ref["names"]])
        tol = max(1e-9, 1e-14 * r["cond"])
        ok(op, "element currents", close(ci, ref["i"], rel=tol), idx, f"cond={r['cond']:.2e}"); ok(op, "element voltage drops", close(cv, ref["u"], rel=max(tol, 1e-8)), idx)
    elif op == "ybus":
        Y = np.array([[cx(z) for z in row] for row in r["Y"]]); ok(op, "Y-bus entries", close(Y, ref["Y"], rel=1e-12), idx)
    elif op == "zbus":
        Z = np.array([[cx(z) for z in row] for row in r["Z"]]); ok(op, "Z-bus entries", close(Z, ref["Z"], rel=max(1e-9, 1e-14 * r["cond"])), idx)
    elif op == "incidence":
        A = np.array(r["A"], float); ok(op, "incidence matrix", A.shape == ref["A"].shape, idx)
        ok(op, "rank", r["rank"] == ref["rank"], idx); nb, nn = ref["nb"], ref["nn"]; comps = nn - ref["rank"]
        ok(op, "components", r["comps"] == comps, idx); ok(op, "loop count", r["loops"] == nb - nn + comps and len(r["B"]) == nb - nn + comps, idx)
        B = np.array(r["B"], float).reshape(-1, nb)
        # independent: columns of A in the engine must equal the reference up to node ordering (same ordering: numeric sort)
        ok(op, "A.Bt = 0", bool(np.all(A @ B.T == 0)), idx); ok(op, "B entries in {-1,0,1}", bool(np.all(np.isin(B, [-1, 0, 1]))), idx)
        ok(op, "loop rows independent", B.shape[0] == 0 or np.linalg.matrix_rank(B) == B.shape[0], idx)
        ok(op, "each loop has one link", B.shape[0] == 0 or int(np.sum(np.abs(B).sum(axis=0) > 0)) >= B.shape[0], idx)
        if ref["Y"] is not None: ok(op, "A G At", close(np.array(r["Y"]), ref["Y"], rel=1e-12), idx)
    elif op == "ss":
        A, B, C, Dm, disc = ref["A"], ref["B"], ref["C"], ref["D"], ref["disc"]; n = A.shape[0]
        ev = np.array(sorted(np.linalg.eigvals(A), key=lambda z: (-z.real, -z.imag))); mine = np.array(sorted([cx(z) for z in r["eig"]], key=lambda z: (-z.real, -z.imag)))
        # eigenvalues of defective matrices are only accurate to eps^(1/k): use a matching-distance tolerance
        from scipy.optimize import linear_sum_assignment
        Dd = np.abs(mine[:, None] - ev[None, :]); ri, ci_ = linear_sum_assignment(Dd); sc = max(np.linalg.norm(A), 1)
        ok(op, "eigenvalues", Dd[ri, ci_].max() <= 1e-5 * sc, idx, f"err={Dd[ri, ci_].max():.2e}")
        stable = (np.abs(ev).max() < 1 - 1e-9) if disc else (ev.real.max() < -1e-9); unstable = (np.abs(ev).max() > 1 + 1e-9) if disc else (ev.real.max() > 1e-9)
        ok(op, "stability verdict", (r["stable"] == "Asymptotically stable") == stable and (r["stable"] == "Unstable") == unstable or abs((np.abs(ev).max() - 1) if disc else ev.real.max()) < 1e-4, idx, r["stable"])
        K = np.hstack([np.linalg.matrix_power(A, k) @ B for k in range(n)]); O = np.vstack([C @ np.linalg.matrix_power(A, k) for k in range(n)])
        ok(op, "controllability rank", r["ctrb"] == np.linalg.matrix_rank(K), idx); ok(op, "observability rank", r["obsv"] == np.linalg.matrix_rank(O), idx)
        if B.shape[1] == 1 and C.shape[0] == 1:
            num, den = signal.ss2tf(A, B, C, Dm); num = np.trim_zeros(num[0], "f") if np.any(num[0]) else np.array([0.0])
            mn = np.array(r["num"]); md = np.array(r["den"]); ok(op, "denominator", close(md, den, rel=1e-9), idx)
            ok(op, "numerator", close(np.pad(mn, (len(num) - len(mn), 0)) if len(mn) < len(num) else mn, num, rel=1e-8, ab=1e-9) or (len(mn) == 1 and abs(mn[0]) < 1e-9 and np.allclose(num, 0, atol=1e-9)), idx, f"{mn} vs {num}")
            if r["dc"] is not None and not disc:
                try: g0 = (Dm - C @ np.linalg.solve(A, B))[0, 0]; ok(op, "DC gain", abs(r["dc"] - g0) <= 1e-8 * max(1, abs(g0)), idx)
                except np.linalg.LinAlgError: pass
    elif op == "symm":
        for q, (ph, sq) in ref.items():
            ok(op, q + " phases", close([cx(z) for z in r[q]["ph"]], ph, rel=1e-12), idx); ok(op, q + " sequence", close([cx(z) for z in r[q]["sq"]], sq, rel=1e-12), idx)
        if "v" in ref and "i" in ref:
            S = np.sum(ref["v"][0] * np.conj(ref["i"][0])); ok(op, "power", abs(cx(r["S"]) - S) <= 1e-12 * abs(S) + 1e-12, idx)
    elif op == "dcpf":
        ok(op, "angles", close(r["theta"], ref["theta"], rel=1e-10), idx); ok(op, "flows", close(r["flows"], ref["flows"], rel=1e-10), idx)
    # engine's own checks must not fail on well-posed cases
    if op != "ss" or True:
        bad = [k for k in o["checks"] if k[2] == "fail"]
        ok(op, "no self-check failures", not bad or (op == "nodal" and r.get("cond", 0) > 1e10), idx, str(bad))

print(f"{checks} checks over {len(cases)} cases")
for k, v in sorted(stats.items()): print(f"  {k[0]:9s} {k[1]:28s} {v[0]:5d} checks, {v[1]} failed")
print("engine status counts:", {f"{k[0]}:{k[1]}": v for k, v in sorted(statuses.items())})
if fails: print("FAILURES:"); [print(" ", f) for f in fails]; sys.exit(1)
print("ALL PASS")
