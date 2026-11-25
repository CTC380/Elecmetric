"""Independent vectors for the GCF Calculator, Mode 01 (tools/gcf_engine.js), Multiple Number GCF.
Written without the engine. The GCF of each list is found by three routes that must agree:
(1) math.gcd folded over the absolute values (Python's own Euclid);
(2) the prime-factorisation route: sympy.factorint of every non-zero number, lowest exponent of each prime common to all of them;
(3) for small numbers, a brute-force search for the largest integer that divides every number (no gcd, no factors).
The LCM is math.lcm. Prime factorisation text is sympy.factorint (numbers up to 10^12; above that the engine does not factorise).
Row of V.solve: [text as typed, status ('ok' | 'undefined'), gcf text or null, lcm text or null, quotients (numbers / GCF) list or null,
                 prime factorisation text of each number or null (null for 0 or when any number is above 10^12; '1' for 1), GCF as prime powers text or null, coprime (bool)]
V.err: inputs the engine must refuse. V.empty: empty or one-number inputs that must give a hint.  Run: python3 tests/gen_gcf_vectors.py -> tests/gcf_vectors.json
"""
import json, random, math
from functools import reduce
import sympy as sp
R = random.Random(20261124)
LIM = 10 ** 12

def fx(n):
    if n < 2: return '1'
    f = sp.factorint(n)
    return ' \u00d7 '.join(str(p) + ('^%d' % e if e > 1 else '') for p, e in sorted(f.items()))

def route_prime(nums):
    nz = [abs(x) for x in nums if x != 0]
    fs = [sp.factorint(x) if x > 1 else {} for x in nz]
    common = set(fs[0].keys())
    for f in fs[1:]: common &= set(f.keys())
    g = 1; pf = []
    for p in sorted(common):
        e = min(f[p] for f in fs); g *= p ** e; pf.append((p, e))
    return g, pf

def route_brute(nums):
    nz = [abs(x) for x in nums if x != 0]
    for c in range(min(nz), 0, -1):
        if all(x % c == 0 for x in nz): return c

def row(nums, sep=', ', text=None):
    t = text if text is not None else sep.join(str(x) for x in nums)
    if all(x == 0 for x in nums): return [t, 'undefined', None, None, None, None, None, False]
    ab = [abs(x) for x in nums]
    g1 = reduce(math.gcd, ab)
    g2, pf = route_prime(nums) if max(ab) <= 10 ** 14 else (g1, None)
    assert g1 == g2, (nums, g1, g2)
    if max(ab) <= 3000:
        assert route_brute(nums) == g1, nums
    zeros = any(x == 0 for x in nums)
    lcm = 0 if zeros else math.lcm(*ab)
    q = [str(x // g1) for x in ab]
    small = all(x <= LIM for x in ab)
    facs = [None if x == 0 else fx(x) for x in ab] if small else None
    gft = None
    if small:
        gft = ' \u00d7 '.join(str(p) + ('^%d' % e if e > 1 else '') for p, e in pf) if pf else '1'
    return [t, 'ok', str(g1), str(lcm), q, facs, gft, g1 == 1]

solve = []
# the CEO note's fixed cases
for nums in [[12, 18], [16, 88, 104], [24, 36], [48, 18], [21, 14, 35], [100, 250, 500], [17, 19], [-24, 36], [0, 15], [0, 0], [12, 0, 18], [12, 18, 24, 30], [8, 12], [60, 48, 36], [600, 200], [1, 1], [1, 7], [0, 0, 5], [7, 7, 7], [2, 4, 8, 16, 32, 64], [-12, -18], [-12, 18, -30], [1000000007, 1000000009], [360, 840, 1260]]:
    solve.append(row(nums))
# separators and formats
solve.append(row([16, 88, 104], sep=' '))
solve.append(row([16, 88, 104], text='16;88;104'))
solve.append(row([16, 88, 104], text='16\n88\n104'))
solve.append(row([16, 88, 104], text='  16 ,  88 ,104 '))
solve.append(row([16, 88, 104], text='16 and 88 and 104'))
solve.append(row([12, 18], text='+12, +18'))
solve.append(row([-24, 36], text='\u221224, 36'))
solve.append(row([12, 18], text='12.0, 18.00'))
solve.append(row([12, 18], text='012, 0018'))
solve.append(row([0, 15], text='-0, 15'))
# random small
for _ in range(150):
    k = R.randint(2, 6); d = R.randint(1, 40)
    nums = [d * R.randint(1, 60) for _ in range(k)]
    if R.random() < 0.3: nums = [x * R.choice([1, -1]) for x in nums]
    if R.random() < 0.15: nums[R.randrange(k)] = 0
    solve.append(row(nums))
# coprime
for _ in range(30):
    a = R.randint(2, 5000); b = R.randint(2, 5000)
    while math.gcd(a, b) != 1: b = R.randint(2, 5000)
    solve.append(row([a, b]))
# primes
for _ in range(25):
    a = sp.randprime(2, 10 ** 6); b = sp.randprime(2, 10 ** 6)
    solve.append(row([a, b, a * b]))
# powers
for _ in range(25):
    b = R.choice([2, 3, 5, 6, 10, 12]); nums = [b ** R.randint(0, 14) for _ in range(R.randint(2, 5))]
    solve.append(row(nums))
# many numbers (up to 20)
for k in (10, 15, 20):
    d = R.randint(2, 99); solve.append(row([d * R.randint(1, 500) for _ in range(k)]))
# 10^12 boundary: exactly at the limit factorised, one above not factorised
solve.append(row([10 ** 12, 10 ** 11]))
solve.append(row([10 ** 12 + 1, 10 ** 12 + 1]))
solve.append(row([999999999989, 999999999989 * 1]))
solve.append(row([2 ** 40, 2 ** 39 * 3]))
# large (gcf carried through multiplication): 15 to 300 digits
for dg in (15, 20, 30, 45, 60, 100, 150, 300):
    for _ in range(4):
        g = R.randint(10 ** (dg // 3), 10 ** (dg // 3 + 1)); k = R.randint(2, 5)
        nums = [g * R.randint(10 ** (dg // 3), 10 ** (2 * dg // 3)) * R.choice([1, -1]) for _ in range(k)]
        solve.append(row(nums))
solve.append(row([10 ** 100, 10 ** 99 * 3]))
solve.append(row([2 ** 400, 6 ** 100]))
solve.append(row([int('9' * 300), int('9' * 150)]))   # 10^k - 1 pairs: gcd = 10^gcd(k) - 1
# larger sample for the brute-force route
for _ in range(60):
    k = R.randint(2, 4); d = R.randint(1, 30)
    solve.append(row([d * R.randint(1, 100) for _ in range(k)]))

err = ['12.5, 3', '3, 1/2', 'abc, 3', '2^3, 4', '12, x', '1e3, 5', '12, 18, -', '1.5, 2.5', '0.0001, 3', '12, 18, 3.7', '- 5, 10', '--5, 10',
       '5, 10, ' + ','.join(str(i + 2) for i in range(20)), '1' + '0' * 500 + ', 5', '12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96, 102, 108, 114, 120, 126, 132']
empty = ['', '   ', ',,,', '5', '  -17 ', '0', '12,', ';']
out = {'solve': solve, 'err': err, 'empty': empty}
json.dump(out, open('tests/gcf_vectors.json', 'w'), ensure_ascii=False)
print(len(solve), 'solve vectors,', len(err), 'refused,', len(empty), 'hints')
