/* Tests for tools/codes_engine.js against tests/codes_vectors.json (independent: gen_codes_vectors.py) and fixed cases. */
const C = require('../tools/codes_engine.js'), V = require('./codes_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 15) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': ' + a + ' vs ' + b); };
for (const [s, code, un, exp] of V.bcd) { const e = C.bcdEncode(s, { code, unpacked: un }); eq(e.ok && e.groups.join(' '), exp, 'bcd encode ' + s + ' ' + code + (un ? ' unpacked' : '')); const d = C.bcdDecode(exp, { code, unpacked: un }); eq(d.ok && d.dec, s, 'bcd decode ' + s + ' ' + code); }
for (const [b, code] of V.badbcd) { const r = C.bcdDecode(b, { code }); const valid = b.length % 4 === 0 && b.match(/.{4}/g).every((g) => { const v = parseInt(g, 2) - (code === 'xs3' ? 3 : 0); return v >= 0 && v <= 9; }); eq(r.ok, valid, 'bcd validity ' + b + ' ' + code); }
for (const [w, bin, gr, bd, gd] of V.gray) {
  const a = C.gray({ text: bin, kind: 'bin', width: 0, dir: 'b2g' }); eq(a.gray, gr, 'b2g ' + bin); eq(a.grayDec, gd, 'b2g dec ' + bin); eq(a.w, w, 'b2g width');
  const b = C.gray({ text: gr, kind: 'bin', width: 0, dir: 'g2b' }); eq(b.bin, bin, 'g2b ' + gr);
  const c = C.gray({ text: bd, kind: 'dec', width: w, dir: 'b2g' }); eq(c.gray, gr, 'dec b2g ' + bd + ' w' + w);
}
eq(C.gray({ text: '1011', kind: 'bin', dir: 'b2g' }).gray, '1110', 'brief-style 1011'); eq(C.gray({ text: '1110', kind: 'bin', dir: 'g2b' }).bin, '1011', 'inverse');
eq(C.gray({ text: 'FF', kind: 'hex', dir: 'b2g' }).gray, '10000000', 'hex FF'); eq(C.gray({ text: '5', kind: 'dec', width: 8, dir: 'b2g' }).gray, '00000111', 'width pad');
eq(C.gray({ text: '256', kind: 'dec', width: 8, dir: 'b2g' }).ok, false, 'overflow width'); eq(C.gray({ text: '102', kind: 'bin', dir: 'b2g' }).ok, false, 'invalid binary'); eq(C.gray({ text: '', kind: 'bin' }).empty, true, 'empty');
eq(C.bcdEncode('1234').bits, '0001001000110100', 'bcd 1234'); eq(C.bcdEncode('-5').ok, false, 'negative rejected'); eq(C.bcdEncode('12.5').ok, false, 'decimal point rejected'); eq(C.bcdDecode('1010').error.slice(0, 4), '1010', 'names bad nibble');
eq(C.bcdDecode('1001000', { padLeft: true }).dec, '48', 'pad left'); eq(C.bcdDecode('1001000').ok, false, 'length error'); eq(C.bcdDecode('00010010', { unpacked: true }).ok, false, 'unpacked high nibble');
eq(C.bcdEncode('0').bits, '0000', 'bcd 0'); eq(C.bcdEncode('0', { code: 'xs3' }).bits, '0011', 'xs3 0');
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
