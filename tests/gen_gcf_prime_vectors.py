"""Independent vectors for the GCF Calculator, Mode 02 (tools/gcf_prime_engine.js), Prime Factorisation GCF.
Written without the engine. For every list the GCF is found by three routes that must agree:
(1) math.gcd folded over the absolute values;
(2) sympy.factorint of every non-zero number, then the lowest exponent of each prime common to all of them (the method the page teaches);
(3) for numbers up to 3,000, a brute-force search for the largest integer dividing every number.
LCM is math.lcm and the LCM prime powers are the highest exponent of every prime (sympy.factorint).
Row of V.solve: [text, status ('ok'|'undefined'), view ('full'|'partial'|'none'), gcf, gcf as prime powers text or null, factorisation text of each number (null for 0) or null when view is not full,
                common primes list (strings) or null, lcm text or null, LCM prime powers text or null, matrix [[prime, [exponent in each number, null for 0]], ...] for the primes of the GCF when view is not none or all primes when full]
V.err: refused inputs. V.empty: empty or single-number inputs.   Run: python3 tests/gen_gcf_prime_vectors.py -> tests/gcf_prime_vectors.json"""
import json, random, math
from functools import reduce
import sympy as sp
R = random.Random(20261124)
LIM = 10 ** 18

def ft(f):
    return ' × '.join(str(p) + ('^%d' % e if e > 1 else '') for p, e in sorted(f.items())) if f else '1'

def row(nums, text=None):
    t = text if text is not None else ', '.join(str(x) for x in nums)
    ab = [abs(x) for x in nums]
    if all(x == 0 for x in ab): return [t, 'undefined', 'none', None, None, None, None, None, None, None]
    nz = [x for x in ab if x]
    g = reduce(math.gcd, ab)
    fs = [sp.factorint(x) if x > 1 else {} for x in nz]
    common = set(fs[0])
    for f in fs[1:]: common &= set(f)
    g2 = 1; gf = {}
    for p in sorted(common):
        e = min(f[p] for f in fs); g2 *= p ** e; gf[p] = e
    assert g == g2, (nums, g, g2)
    if max(nz) <= 3000: assert next(c for c in range(min(nz), 0, -1) if all(x % c == 0 for x in nz)) == g
    zeros = any(x == 0 for x in ab)
    lcm = None if zeros else math.lcm(*ab)
    lf = None
    if not zeros:
        hi = {}
        for f in fs:
            for p, e in f.items(): hi[p] = max(hi.get(p, 0), e)
        lf = ft(hi); assert math.prod(p ** e for p, e in hi.items()) == lcm
    if max(nz) <= LIM:
        view = 'full'
        allp = sorted({p for f in fs for p in f})
        facs = [None if x == 0 else ft(sp.factorint(x) if x > 1 else {}) for x in ab]
        mat = [[str(p), [None if x == 0 else (sp.factorint(x).get(p, 0) if x > 1 else 0) for x in ab]] for p in allp]
        return [t, 'ok', view, str(g), ft(gf), facs, [str(p) for p in sorted(common)], None if lcm is None else str(lcm), lf, mat]
    if g == 1: view, gfx = 'partial', {}
    elif g <= LIM: view = 'partial'
    else: view = 'none'
    if view == 'none': return [t, 'ok', 'none', str(g), None, None, None, None if lcm is None else str(lcm), None, None]
    mat = [[str(p), [None if x == 0 else sp.multiplicity(p, x) for x in ab]] for p in sorted(gf)]
    return [t, 'ok', 'partial', str(g), ft(gf), None, [str(p) for p in sorted(common)], None if lcm is None else str(lcm), None, mat]

solve = []
for nums in [[24, 36], [16, 88, 104], [12, 18], [48, 18], [21, 14, 35], [100, 250, 500], [17, 19], [-24, 36], [0, 15], [0, 0], [12, 0, 18], [600, 200], [360, 840, 1260], [1, 1], [1, 7], [0, 0, 5], [7, 7, 7], [2, 4, 8, 16, 32, 64], [-12, -18], [8, 15], [1024, 4096], [1000000007, 1000000009], [999999929 * 999999937, 999999937], [2 ** 59, 2 ** 40 * 3], [30, 42, 70, 105], [97 * 89, 89 * 83]]:
    solve.append(row(nums))
for t, nums in [('16 88 104', [16, 88, 104]), ('16; 88; 104', [16, 88, 104]), ('16\n88\n104', [16, 88, 104]), ('12.0, 18', [12, 18]), ('+24, -36', [24, 36]), ('007, 021', [7, 21])]:
    solve.append(row(nums, t))
for n in range(2, 90):
    solve.append(row([n, R.randint(2, 400)]))
for _ in range(150):
    k = R.randint(2, 6); d = R.choice([1, 1, 2, 6, 12, 30, 210, 360, 1001]); solve.append(row([d * R.randint(1, 500) * R.choice([1, -1]) for _ in range(k)]))
for _ in range(60):
    k = R.randint(2, 5); solve.append(row([R.randint(2, 10 ** R.randint(3, 17)) for _ in range(k)]))
for _ in range(60):  # large numbers built from a known common factor (up to 10^18 all factored in full)
    k = R.randint(2, 4); d = R.randint(2, 10 ** 6); solve.append(row([d * R.randint(1, 10 ** 11) for _ in range(k)]))
for _ in range(25):  # semiprimes of two primes near 10^9 (Pollard rho path)
    ps = [sp.nextprime(R.randint(10 ** 8, 10 ** 9)) for _ in range(3)]
    solve.append(row([ps[0] * ps[1], ps[0] * ps[2]]))
for p in [2, 3, 5, 7]:
    solve.append(row([p ** 20, p ** 11 * 3 ** 5]))
solve.append(row([10 ** 18, 10 ** 17 * 3]))
solve.append(row([10 ** 18 - 1, 999999999 * 5]))
# above 10^18: partial view (GCF factored), or none when the GCF is above 10^18 too
for _ in range(25):
    d = R.choice([1, 2, 6, 30, 360, 10 ** 6 + 3]); solve.append(row([d * R.randint(10 ** 18, 10 ** 24), d * R.randint(10 ** 18, 10 ** 24)]))
solve.append(row([10 ** 30, 10 ** 29 * 4]))
solve.append(row([2 ** 100, 2 ** 90 * 3]))
solve.append(row([2 ** 70, 6 ** 30, 3 * 2 ** 65]))
solve.append(row([10 ** 40 + 7, 10 ** 41 + 70]))
solve.append(row([123456789012345678901234567890, 987654321098765432109876543210]))
err = ['12.5, 3', '1/2, 3', 'abc, 4', '4, x', '1e3, 5', '4, 5 6, ,seven', '1' + '0' * 500 + ', 5', ','.join(str(i) for i in range(2, 23)), '5, --6']
empty = ['', '   ', '5', '7,', ',']
json.dump({'solve': solve, 'err': err, 'empty': empty}, open('tests/gcf_prime_vectors.json' if False else 'gcf_prime_vectors.json', 'w'))
print(len(solve), 'vectors; views:', {v: sum(1 for r in solve if r[2] == v) for v in ('full', 'partial', 'none')})
