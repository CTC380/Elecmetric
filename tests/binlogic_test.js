/* Tests for tools/binlogic_engine.js against tests/binlogic_vectors.json (independent: gen_binlogic_vectors.py) and the CEO brief's cases. */
const B = require('../tools/binlogic_engine.js'), V = require('./binlogic_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 15) console.log('FAIL ' + m); };
for (const v of V) {
  n++;
  const r = B.compute(v.op, BigInt(v.a), BigInt(v.b), v.w, v.signed);
  const tag = v.op + ' w' + v.w + ' a=' + v.a + ' b=' + v.b + (v.signed ? ' signed' : '');
  if (v.err) { if (r.ok) bad(tag + ' should error'); continue; }
  if (!r.ok) { bad(tag + ' errored: ' + r.error); continue; }
  if (r.u.toString() !== v.r) bad(tag + ': result ' + r.u + ' vs ' + v.r);
  if (v.ovU !== undefined && r.ovU !== v.ovU) bad(tag + ': ovU ' + r.ovU + ' vs ' + v.ovU);
  if (v.ovS !== undefined && !(v.op === 'div' && !v.signed) && r.ovS !== v.ovS) bad(tag + ': ovS ' + r.ovS + ' vs ' + v.ovS);
  if (v.rem !== undefined && B.fromS(BigInt(r.rem.unsigned), v.w).toString() !== v.rem) bad(tag + ': remainder');
}
const eq = (a, b, m) => { n++; if (a !== b) bad(m + ': ' + a + ' vs ' + b); };
const run = (op, a, b, kind, w, signed) => B.run({ op, a, b, kind, w, signed });
eq(run('and', '10101010', '00001111', 'bin', 8, false).bits, '00001010', 'brief AND');
eq(run('and', '10101010', '00001111', 'bin', 8, false).unsigned, '10', 'brief AND decimal');
eq(run('add', '1101', '1011', 'bin', 8, false).full.u, '11000', 'brief 1101 + 1011 full result');
eq(run('add', '1101', '1011', 'bin', 5, false).bits, '11000', '1101 + 1011 at 5 bits');
eq(run('add', '1101', '1011', 'bin', 4, false).ovU, true, '1101 + 1011 carries out at 4 bits');
eq(run('add', '127', '1', 'dec', 8, true).signed, '-128', '127 + 1 wraps to -128');
eq(run('add', '127', '1', 'dec', 8, true).ovS, true, '127 + 1 signed overflow');
eq(run('shra', '10000000', '1', 'bin', 8, true).bits, '11000000', 'arithmetic shift keeps sign');
eq(run('shrl', '10000000', '1', 'bin', 8, true).bits, '01000000', 'logical shift fills zero');
eq(run('shra', '-3', '1', 'dec', 8, true).signed, '-2', 'arithmetic shift rounds to minus infinity');
eq(run('div', '-7', '2', 'dec', 8, true).signed, '-3', 'signed division truncates toward zero');
eq(run('div', '-7', '2', 'dec', 8, true).rem.signed, '-1', 'remainder takes dividend sign');
eq(run('div', '-128', '-1', 'dec', 8, true).ovS, true, 'MIN / -1 overflows');
eq(run('div', '5', '0', 'dec', 8, false).ok, false, 'divide by zero');
eq(run('and', '102', '1', 'bin', 8, false).ok, false, 'invalid binary');
eq(run('and', '1', '1', 'bin', 8, false).ok, true, 'ok');
eq(run('shl', '1', '8', 'bin', 8, false).bits, '00000000', 'shift by width gives 0');
eq(run('not', '0F', '', 'hex', 8, false).hex, 'F0', 'NOT 0x0F');
eq(run('dec', '1', '1', 'bin', 8, false).ok, false, 'unknown op');
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
