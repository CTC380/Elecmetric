"""Independent reference vectors for tools/codes_engine.js. BCD/Excess-3 use a plain per-digit format() table; Gray code uses Python integer
formulas (n ^ (n >> 1)) and the inverse by a bit-by-bit loop, on random widths up to 200 bits."""
import random, json
random.seed(1953)
V={'bcd':[], 'gray':[], 'badbcd':[]}
nums=[str(n) for n in range(0,1000)]+[str(random.randrange(10**random.randrange(3,60))) for _ in range(300)]+['0','00','007','9999999999','1234567890']
for s in nums:
    for code,off in (('8421',0),('xs3',3)):
        for un in (False,True):
            g=['%04d'%int(format(int(d)+off,'b')) for d in s]
            if un: g=['0000'+x for x in g]
            V['bcd'].append([s,code,un,' '.join(g)])
for bits in ['1010','1111','1100','0000','1011 0000','0001 1010','00010010 00110100','10','101']:
    for code in ('8421','xs3'):
        V['badbcd'].append([bits.replace(' ',''),code])
def gray_inv(g,w):
    b=[0]*w; gs=format(g,'0%db'%w); b[0]=int(gs[0])
    for i in range(1,w): b[i]=b[i-1]^int(gs[i])
    return int(''.join(map(str,b)),2)
for _ in range(1500):
    w=random.choice([1,2,3,4,5,8,16,32,64,random.randrange(1,200)])
    n=random.getrandbits(w)
    g=n^(n>>1)
    V['gray'].append([w,format(n,'0%db'%w),format(g,'0%db'%w),str(n),str(g)])
    assert gray_inv(g,w)==n
json.dump(V,open('tests/codes_vectors.json','w'),separators=(',',':'))
print({k:len(v) for k,v in V.items()})
