# Independent reference for tests/chars_test.js. Uses Python's own str.encode for UTF-8 and UTF-16, and format() for ASCII bases.
import json, random
random.seed(5)
asc = []
for _ in range(1500):
    codes = [random.randint(0, 127) for _ in range(random.randint(1, 30))]
    asc.append([codes, [format(c, '08b') for c in codes], [format(c, 'o').zfill(3) for c in codes], [format(c, 'X').zfill(2) for c in codes]])
uni = []
def pick():
    r = random.random()
    if r < .2: return random.randint(0, 0x7F)
    if r < .4: return random.randint(0x80, 0x7FF)
    if r < .75:
        while True:
            c = random.randint(0x800, 0xFFFF)
            if not 0xD800 <= c <= 0xDFFF: return c
    return random.randint(0x10000, 0x10FFFF)
for _ in range(2500):
    cps = [pick() for _ in range(random.randint(1, 12))]
    uni.append([cps, [chr(c).encode('utf-8').hex().upper() for c in cps], [chr(c).encode('utf-16-be').hex().upper() for c in cps], len(''.join(map(chr, cps)).encode('utf-8')), len(''.join(map(chr, cps)).encode('utf-16-le')) // 2])
json.dump({'asc': asc, 'uni': uni}, open('tests/chars_vectors.json', 'w'))
print(len(asc), len(uni))
