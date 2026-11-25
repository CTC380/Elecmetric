/* Tests for tools/chars_engine.js against tests/chars_vectors.json (independent: gen_chars_vectors.py) and fixed cases. */
const C = require('../tools/chars_engine.js'), V = require('./chars_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 15) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': ' + a + ' vs ' + b); };
const H = (c) => c.toString(16).toUpperCase();
for (const [codes, bin, oct, hex] of V.asc) {
  const text = String.fromCharCode(...codes), t = 'codes ' + codes.join(',');
  const a = C.ascii({ text, dir: 'enc' }); eq(a.ok && a.rows.map((r) => r.bin).join(), bin.join(), 'bin ' + t); eq(a.rows.map((r) => r.oct).join(), oct.join(), 'oct ' + t); eq(a.rows.map((r) => r.hex).join(), hex.join(), 'hex ' + t); eq(a.rows.map((r) => r.dec).join(), codes.join(), 'dec ' + t);
  for (const [kind, arr] of [['dec', codes.map(String)], ['hex', hex], ['bin', bin], ['oct', oct]]) { const d = C.ascii({ text: arr.join(' '), dir: 'dec', kind }); eq(d.ok && d.text === text, true, 'decode ' + kind + ' ' + t); }
}
for (const [cps, u8, u16, b8, n16] of V.uni) {
  const text = String.fromCodePoint(...cps), t = 'cps ' + cps.map(H).join(' ');
  const e = C.unicode({ text, dir: 'enc' }); eq(e.ok && e.rows.map((r) => r.utf8.join('')).join(), u8.join(), 'utf8 ' + t); eq(e.rows.map((r) => r.utf16.join('')).join(), u16.join(), 'utf16 ' + t);
  eq(e.utf8Bytes, b8, 'utf8 total ' + t); eq(e.utf16Units, n16, 'utf16 total ' + t); eq(e.n, cps.length, 'count ' + t); eq(e.rows.map((r) => r.cp).join(), cps.join(), 'cps ' + t);
  const d = C.unicode({ text: cps.map((c) => 'U+' + H(c).padStart(4, '0')).join(' '), dir: 'dec' }); eq(d.ok && d.text === text, true, 'dec U+ ' + t);
  const d2 = C.unicode({ text: cps.join(' '), dir: 'dec', kind: 'dec' }); eq(d2.ok && d2.text === text, true, 'dec decimal ' + t);
}
// fixed cases
eq(C.ascii({ text: 'A', dir: 'enc' }).rows[0].bin, '01000001', 'A'); eq(C.ascii({ text: '\n', dir: 'enc' }).rows[0].ch, 'LF', 'LF'); eq(C.ascii({ text: ' ', dir: 'enc' }).rows[0].name, 'Space', 'space'); eq(C.ascii({ text: String.fromCharCode(127), dir: 'enc' }).rows[0].name, 'Delete', 'DEL');
eq(C.ascii({ text: 'Hello', dir: 'enc', fmt: 'hex' }).codes, '48 65 6C 6C 6F', 'Hello hex'); eq(C.ascii({ text: '72 101 108 108 111', dir: 'dec' }).text, 'Hello', 'decode Hello'); eq(C.ascii({ text: '0x48 0x69', dir: 'dec' }).text, 'Hi', 'prefix');
eq(C.ascii({ text: '\u00e9', dir: 'enc' }).ok, false, 'non-ASCII rejected'); eq(C.ascii({ text: '128', dir: 'dec' }).ok, false, '128 rejected'); eq(C.ascii({ text: '12 x', dir: 'dec' }).ok, false, 'bad token'); eq(C.ascii({ text: '', dir: 'enc' }).empty, true, 'empty'); eq(C.ascii({ text: '99999999999', dir: 'dec' }).ok, false, 'huge');
eq(C.unicode({ text: '\u20ac', dir: 'enc' }).rows[0].utf8.join(' '), 'E2 82 AC', 'euro'); eq(C.unicode({ text: '\u{1F600}', dir: 'enc' }).rows[0].utf16.join(' '), 'D83D DE00', 'emoji surrogates'); eq(C.unicode({ text: '\u{1F600}', dir: 'enc' }).rows[0].u, 'U+1F600', 'emoji cp');
eq(C.unicode({ text: 'U+D800', dir: 'dec' }).ok, false, 'surrogate rejected'); eq(C.unicode({ text: 'U+110000', dir: 'dec' }).ok, false, 'above max'); eq(C.unicode({ text: 'U+10FFFF', dir: 'dec' }).ok, true, 'max ok'); eq(C.unicode({ text: 'U+ZZ', dir: 'dec' }).ok, false, 'bad hex'); eq(C.unicode({ text: '\ud800', dir: 'enc' }).ok, false, 'lone surrogate'); eq(C.unicode({ text: '', dir: 'dec' }).empty, true, 'empty dec');
// prefix handling: a token valid in the selected base is plain digits, a prefix applies only when it is not
eq(C.unicode({ text: '0B1', dir: 'dec', kind: 'hex' }).points, 'U+00B1', 'hex 0B1 is plain hex'); eq(C.unicode({ text: '0b101', dir: 'dec', kind: 'hex' }).points, 'U+B101', 'hex 0b101 is plain hex'); eq(C.unicode({ text: '00B1', dir: 'dec', kind: 'hex' }).points, 'U+00B1', 'hex 00B1');
eq(C.unicode({ text: '0x1F600', dir: 'dec', kind: 'hex' }).points, 'U+1F600', 'hex with 0x'); eq(C.unicode({ text: '0b101', dir: 'dec', kind: 'dec' }).points, 'U+0005', 'binary prefix in decimal mode'); eq(C.unicode({ text: '0o17', dir: 'dec', kind: 'hex' }).points, 'U+000F', 'octal prefix in hex mode');
eq(C.ascii({ text: '0B1', dir: 'dec', kind: 'hex' }).ok, false, 'ascii hex 0B1 = 0xB1 is above 127'); eq(C.ascii({ text: '0B', dir: 'dec', kind: 'hex' }).codes, '11', 'ascii hex 0B'); eq(C.ascii({ text: '0x48 0b1001001', dir: 'dec', kind: 'dec' }).text, 'HI', 'mixed prefixes in decimal mode'); eq(C.ascii({ text: '0b1', dir: 'dec', kind: 'oct' }).text, '\u0001', 'binary prefix in octal mode');
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
