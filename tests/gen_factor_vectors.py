"""Independent vectors for the Factor Calculator, Mode 01 (tools/factor_engine.js), All Factors Finder.
Written without the engine. The factors of every integer are found by routes that must agree:
(1) for |n| up to 200,000, a brute-force test of every whole number 1..|n| (n mod k == 0);
(2) sympy.divisors(|n|);
(3) the products of every combination of prime powers from sympy.factorint(|n|), sorted.
The count must equal the product of (e + 1) and the sum must equal the product of (p^(e+1) - 1)/(p - 1).
Factor pairs: (d, |n|/d) for every divisor d with d*d <= |n|. Signed pairs: for n > 0 both (d, n/d) and (-d, -n/d); for n < 0 both (d, -|n|/d) and (-d, |n|/d), one pair when d*d == |n|.
Row of V.solve: [text, kind ('ok'|'prime'|'one'|'zero'), count, factors (list of strings, ascending) or null, factorisation text ('2^3 × 3^2 × 5') or null, number of positive pairs,
                equal-pair flag, signed pairs as 'a x b' strings, divisor sum as a string, first 6 factors, last 6 factors, sha256 of the comma-joined list, number of signed pairs,
                first 3 and last 3 positive pairs as 'a x b'].  Factors and signed pairs are stored in full only when there are at most 400 factors; the rest are checked by sha256 and the head and tail.
V.err: refused inputs. V.empty: empty input. V.cand: [n text, candidate text, is factor, quotient or null, remainder or null].   Run: python3 tests/gen_factor_vectors.py -> tests/factor_vectors.json"""
import json, random, math, itertools, hashlib
import sympy as sp
R = random.Random(20261125)
LIM = 10 ** 18

def ft(f):
    return ' × '.join(str(p) + ('^%d' % e if e > 1 else '') for p, e in sorted(f.items())) if f else '1'

def divs3(a):
    f = sp.factorint(a)
    ps = sorted(f)
    out = [1]
    for p in ps:
        out = [d * p ** k for d in out for k in range(f[p] + 1)]
    return sorted(out), f

def row(n, text=None):
    t = text if text is not None else str(n)
    if n == 0:
        return [t, 'zero', 0, None, None, 0, False, [], None, [], [], None, 0, [], []]
    a = abs(n)
    d3, f = divs3(a)
    d2 = sorted(sp.divisors(a))
    assert d2 == d3, (n, 'sympy.divisors vs prime-power products')
    if a <= 200000:
        d1 = [k for k in range(1, a + 1) if a % k == 0]
        assert d1 == d3, (n, 'brute force')
    cnt = len(d3)
    t1 = 1
    for e in f.values(): t1 *= e + 1
    assert cnt == t1, n
    s = 1
    for p, e in f.items(): s *= (p ** (e + 1) - 1) // (p - 1)
    assert sum(d3) == s, n
    pairs = [(d, a // d) for d in d3 if d * d <= a]
    sq = bool(pairs) and pairs[-1][0] == pairs[-1][1]
    sg = []
    for d, e in pairs:
        if n > 0:
            sg.append('%d x %d' % (d, e)); sg.append('%d x %d' % (-d, -e))
        else:
            sg.append('%d x %d' % (d, -e))
            if d != e: sg.append('%d x %d' % (-d, e))
    for x in sg:
        l, r = x.split(' x '); assert int(l) * int(r) == n
    kind = 'one' if a == 1 else ('prime' if cnt == 2 else 'ok')
    if a > 1 and cnt > 2: assert not sp.isprime(a)
    if cnt == 2: assert sp.isprime(a)
    lst = [str(x) for x in d3]
    sha = hashlib.sha256(','.join(lst).encode()).hexdigest()
    big = cnt > 400
    return [t, kind, cnt, None if big else lst, ft(f) if a > 1 else '1', len(pairs), sq, None if big else sg, str(s), lst[:6], lst[-6:], sha, len(sg),
            ['%d x %d' % p for p in pairs[:3]], ['%d x %d' % p for p in pairs[-3:]]]

V = {'solve': [], 'err': [], 'empty': [], 'cand': []}
seen = set()
def add(n, text=None):
    if abs(n) > LIM: return
    key = (n, text)
    if key in seen: return
    seen.add(key); V['solve'].append(row(n, text))

# the note's test table and examples
for n in [12, 36, 60, 120, 360, 13, 28, 1, 0, 6, 496, 8128, 100, 1000, 1001, 97, 2, 3, 4, 9, 16, 25, 49, 81, 64, 128, 210, 720, 5040]: add(n)
# every integer 1..1500 and the negatives -1..-400
for n in range(1, 1501): add(n)
for n in range(-400, 0): add(n)
# perfect squares, cubes, prime powers, primorials, perfect numbers
for k in range(1, 1001, 7): add(k * k)
for k in range(2, 60): add(k ** 3)
for p in [2, 3, 5, 7, 11, 13, 101, 997]:
    for e in range(1, 10): add(p ** e)
for k in range(0, 60): add(2 ** k)
pr = 1
for p in sp.primerange(2, 60):
    pr *= p
    if pr <= LIM: add(pr)
for n in [6, 28, 496, 8128, 33550336, 8589869056, 137438691328, 2305843008139952128]: add(n); add(-n)
# primes and semiprimes near powers of ten
for n in [10 ** 6 + 3, 10 ** 9 + 7, 998244353, 10 ** 12 + 39, 10 ** 15 + 37, 10 ** 18 - 11, 999999999999999989, 1000000007 * 998244353, 999999937 * 999999929, 1000003 * 999983]: add(n); add(-n)
# highly composite numbers (largest divisor counts up to 10^18)
for n in [720720, 735134400, 963761198400, 866421317361600, 897612484786617600, 74801040398884800, 8086598962041600]:
    if n <= LIM: add(n)
# random numbers of many sizes, both signs
for digits in range(3, 19):
    for _ in range(4 if digits < 13 else 2):
        n = R.randrange(10 ** (digits - 1), min(10 ** digits, LIM + 1))
        add(n if R.random() < 0.7 else -n)
# random smooth numbers (many factors)
for _ in range(25):
    n = 1
    while True:
        p = R.choice([2, 2, 2, 3, 3, 5, 7, 11, 13, 17, 19, 23])
        if n * p > LIM: break
        n *= p
        if R.random() < 0.06: break
    add(n if R.random() < 0.8 else -n)
add(LIM); add(-LIM)
# input forms
for text, n in [(' 36 ', 36), ('+36', 36), ('036', 36), ('36.0', 36), ('-36.00', -36), ('1,170', 1170), ('-1,170', -1170), ('1 170', 1170), ('1_000', 1000), ('1,000,000', 1000000), ('\u221236', -36), ('\u201336', -36), ('0', 0), ('-0', 0), ('000', 0), ('1,000,000,000,000,000,000', 10 ** 18)]:
    add(n, text)

V['err'] = ['12.5', '0.5', '.5', '1/2', '3/4', '1e6', '2E3', 'abc', '12abc', '3, 4', '3 4', '24, 36, 60', '3;4', '1000000000000000001', '-1000000000000000001', '99999999999999999999', '123456789012345678901234567890', '--5', '5-', '1,2345', '12,34', '1.2.3', 'one', '1 2 3', '+', '-', '0x10']
V['empty'] = ['', '   ', '\n']
# candidate checks: [n text, candidate text, is factor, quotient|null, remainder|null]
for n, k in [(36, 7), (36, 9), (36, 36), (36, 1), (36, 37), (36, 0), (36, -9), (60, 5), (60, 7), (1, 1), (1, 2), (360, 24), (360, 25), (-36, 12), (-36, 5), (13, 13), (13, 12), (1000000007, 7), (999999999999999989, 3), (10 ** 18, 10 ** 9), (10 ** 18, 10 ** 18), (10 ** 18, 10 ** 18 + 1)]:
    a, ak = abs(n), abs(k)
    if k == 0: V['cand'].append([str(n), str(k), False, None, None])
    elif a % ak == 0: V['cand'].append([str(n), str(k), True, str(a // ak), '0'])
    elif ak > a: V['cand'].append([str(n), str(k), False, None, None])
    else: V['cand'].append([str(n), str(k), False, str(a // ak), str(a % ak)])
# 10^18 + 1 as a candidate is over the limit: drop the unreachable parse
V['cand'] = [c for c in V['cand'] if abs(int(c[1])) <= LIM]
json.dump(V, open('tests/factor_vectors.json', 'w'), ensure_ascii=False)
print('solve', len(V['solve']), 'err', len(V['err']), 'empty', len(V['empty']), 'cand', len(V['cand']))
