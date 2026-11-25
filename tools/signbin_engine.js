/* Elecmetric Binary Calculator, Mode 04: Signed Binary Representations. Engine: one file, no dependencies, no DOM.
   Required by tests/signbin_test.js and inlined into calculators/signed-binary-calculator/index.html by tools/signbin_page.js.

   Fixed width only (W = 4, 8, 16, 32 or 64 bits, BigInt). Four representations, always named, never guessed:
     unsigned        0 .. 2^W - 1
     sign-magnitude  sign bit + (W-1)-bit magnitude, -(2^(W-1)-1) .. 2^(W-1)-1, two zeros (+0 and -0)
     one's complement  negative = every bit inverted, -(2^(W-1)-1) .. 2^(W-1)-1, two zeros
     two's complement  negative = invert and add 1 (value = unsigned - 2^W), -2^(W-1) .. 2^(W-1)-1, one zero
   Operations: analyze a value, add, subtract, negate, change width (sign-extend or narrow).
   Overflow policy for add, subtract and negate: report (no stored result), wrap around, or saturate. Wrap means modulo 2^W for unsigned and two's complement, modulo
   2^W - 1 for one's complement (the end-around carry), and magnitude modulo 2^(W-1) with the sign kept for sign-magnitude. The true result is always shown too.
   A value that does not fit is refused as overflow (too large) or underflow (too small), never wrapped silently. A binary, octal or hex entry is a bit pattern (no sign);
   a decimal entry is a signed value that is encoded and must fit. Every result is derived twice inside the engine (exact BigInt arithmetic, then the hardware rule:
   carries, end-around carry, sign-magnitude cases, sign-bit copying); a mismatch throws, so a wrong answer is never shown. */
(function (root) {
  'use strict';
  var WIDTHS = [4, 8, 16, 32, 64];
  var REPS = [['unsigned', 'Unsigned'], ['signmag', 'Sign-magnitude'], ['ones', 'One’s complement'], ['twos', 'Two’s complement']];
  var REPNAME = { unsigned: 'unsigned', signmag: 'sign-magnitude', ones: 'one’s complement', twos: 'two’s complement' };
  var OPS = [['analyze', 'Analyze a value', 1], ['add', 'Add (A + B)', 2], ['sub', 'Subtract (A − B)', 2], ['neg', 'Negate (−A)', 1], ['resize', 'Change width (sign-extend or narrow)', 1]];
  var POLICIES = [['flag', 'Report overflow (no stored result)'], ['wrap', 'Wrap around'], ['sat', 'Saturate at the limit']];
  var BASES = [['dec', 10, 'decimal'], ['bin', 2, 'binary'], ['oct', 8, 'octal'], ['hex', 16, 'hexadecimal']], BITS = { 2: 1, 8: 3, 16: 4 };
  var OPNAME = { analyze: 'Analyze', add: 'Add', sub: 'Subtract', neg: 'Negate', resize: 'Change width' };

  function lpad(s, n) { s = String(s); while (s.length < n) s = '0' + s; return s; }
  function rpt(ch, n) { return new Array(n + 1).join(ch); }
  function babs(x) { return x < 0n ? -x : x; }
  function mod(a, m) { return ((a % m) + m) % m; }
  function bin(u, w) { return lpad(u.toString(2), w); }
  function g4(b) { var o = [], i; for (i = b.length; i > 0; i -= 4) o.unshift(b.slice(Math.max(0, i - 4), i)); return o.join(' '); }
  function pc(s) { var n = 0, i; for (i = 0; i < s.length; i++) if (s.charAt(i) === '1') n++; return n; }
  function inv(u, W) { return (~u) & ((1n << BigInt(W)) - 1n); }
  function line(l, s) { var p = '                '; return (l + p).slice(0, 16) + ': ' + s; }
  function repOk(r) { return REPS.some(function (d) { return d[0] === r; }); }

  function range(rep, W) {
    var top = 1n << BigInt(W - 1), all = 1n << BigInt(W);
    if (rep === 'unsigned') return { min: 0n, max: all - 1n };
    if (rep === 'twos') return { min: -top, max: top - 1n };
    return { min: -(top - 1n), max: top - 1n };
  }
  /* value -> pattern (BigInt) or null when it does not fit. negZero asks for the negative zero pattern of a representation that has one. */
  function encode(v, rep, W, negZero) {
    var top = 1n << BigInt(W - 1), all = 1n << BigInt(W), R = range(rep, W);
    if (v < R.min || v > R.max) return null;
    if (rep === 'unsigned') return v;
    if (rep === 'twos') return v < 0n ? v + all : v;
    if (rep === 'ones') return v < 0n ? (all - 1n) - (-v) : (negZero ? all - 1n : v);
    return v < 0n ? top + (-v) : (negZero ? top : v);
  }
  function decode(u, rep, W) {
    var top = 1n << BigInt(W - 1), all = 1n << BigInt(W), neg = u >= top;
    if (rep === 'unsigned') return { v: u, negZero: false };
    if (rep === 'twos') return { v: neg ? u - all : u, negZero: false };
    if (rep === 'ones') return { v: neg ? -((all - 1n) - u) : u, negZero: u === all - 1n };
    return { v: neg ? -(u - top) : u, negZero: u === top };
  }
  function vstr(d) { return d.negZero ? '-0' : d.v.toString(); }
  /* the stored pattern for a true result e that does not fit, by overflow policy */
  function wrapPat(e, rep, W) {
    var top = 1n << BigInt(W - 1), all = 1n << BigInt(W);
    if (rep === 'unsigned' || rep === 'twos') return mod(e, all);
    if (rep === 'ones') return encode(mod(e + (top - 1n), all - 1n) - (top - 1n), 'ones', W);
    return (e < 0n ? top : 0n) + (babs(e) % top);
  }
  function satPat(e, rep, W) { var R = range(rep, W); return encode(e < R.min ? R.min : e > R.max ? R.max : e, rep, W); }
  function weights(rep, W) {
    var out = [], i, top = 1n << BigInt(W - 1);
    for (i = W - 1; i >= 0; i--) {
      if (i === W - 1 && rep === 'signmag') out.push('sign');
      else if (i === W - 1 && rep === 'twos') out.push('-' + top);
      else if (i === W - 1 && rep === 'ones') out.push('-' + (top - 1n));
      else out.push((1n << BigInt(i)).toString());
    }
    return out;
  }

  /* parseOperand(text, baseId, label): { ok, base, v (BigInt, signed for a decimal), neg, typedBits } or { ok:false, empty?, error } */
  function parseOperand(text, baseId, label) {
    var bd = BASES.filter(function (d) { return d[0] === baseId; })[0]; if (!bd) return { ok: false, error: 'Unknown number system.' };
    var base = bd[1], s = String(text == null ? '' : text).trim().replace(/[\s_,]/g, '');
    if (!s) return { ok: false, empty: true, error: 'Enter ' + label + '.' };
    var neg = false, m = s.match(/^[+\-−]/);
    if (m) { if (base !== 10) return { ok: false, error: label.charAt(0).toUpperCase() + label.slice(1) + ': a sign is only allowed on a decimal value. A binary, octal or hexadecimal entry is a bit pattern; the representation decides what it means.' }; neg = m[0] !== '+'; s = s.slice(1); }
    var pre = base === 2 ? /^0b/i : base === 8 ? /^0o/i : base === 16 ? /^0x/i : null; if (pre) s = s.replace(pre, '');
    if (!s) return { ok: false, error: 'Add digits after the sign or prefix.' };
    var bad = s.match(base === 2 ? /[^01]/ : base === 8 ? /[^0-7]/ : base === 10 ? /[^0-9]/ : /[^0-9A-Fa-f]/);
    if (bad) return { ok: false, error: '‘' + bad[0] + '’ is not a ' + bd[2] + ' digit. ' + (base === 2 ? 'Binary numbers use only 0 and 1.' : base === 8 ? 'Octal numbers use only 0 to 7.' : base === 10 ? 'Decimal numbers use only 0 to 9.' : 'Hexadecimal numbers use 0 to 9 and A to F.') };
    if (s.length > 80) return { ok: false, error: 'The number has ' + s.length + ' digits. The widest pattern here is 64 bits.' };
    var mag = BigInt((base === 2 ? '0b' : base === 8 ? '0o' : base === 16 ? '0x' : '') + s), v = neg ? -mag : mag;
    var tb = base === 10 ? (mag === 0n ? 1 : mag.toString(2).length) : s.length * BITS[base];
    return { ok: true, base: base, v: v, neg: neg && mag !== 0n, typedBits: tb, digits: s };
  }
  /* put a parsed operand into a W-bit pattern of the representation, or explain why it does not fit */
  function toPattern(p, rep, W, label) {
    if (p.base === 10) {
      var R = range(rep, W), u = encode(p.v, rep, W);
      if (u === null) {
        var head = label + ' = ' + p.v + ' does not fit in ' + W + ' bits as ' + REPNAME[rep] + ': ';
        if (p.v > R.max) return { ok: false, error: head + 'overflow, the largest value is ' + R.max + '. Choose a wider width' + (rep === 'unsigned' ? '' : ' or the unsigned representation') + '; nothing is wrapped around.' };
        return { ok: false, error: head + 'underflow, the smallest value is ' + R.min + '.' + (rep === 'unsigned' ? ' Unsigned numbers cannot be negative; choose a signed representation.' : ' Choose a wider width.') + ' Nothing is wrapped around.' };
      }
      return { ok: true, u: u, fromValue: true };
    }
    if (p.v >= (1n << BigInt(W))) return { ok: false, error: label + ' needs ' + p.v.toString(2).length + ' bits, but the selected width is ' + W + ' bits. Choose a wider width; nothing is truncated.' };
    return { ok: true, u: p.v, fromValue: false, padded: p.typedBits < W };
  }
  function describe(u, rep, W) {
    var b = bin(u, W), r = decode(u, rep, W), M = (1n << BigInt(W)) - 1n, iv = inv(u, W), tw = (iv + 1n) & M;
    /* the weighted sum of the bits must give the value */
    var wt = weights(rep, W), sum = 0n, i; if (rep !== 'signmag') for (i = 0; i < W; i++) if (b.charAt(i) === '1') sum += BigInt(wt[i] === 'sign' ? 0 : wt[i]);
    if (rep !== 'signmag' && sum !== r.v) throw new Error('internal check failed: place values');
    var reads = REPS.slice().reverse().map(function (d) { var x = decode(u, d[0], W); return { rep: d[0], name: d[1], value: vstr(x), v: x.v.toString(), negZero: x.negZero, selected: d[0] === rep, min: range(d[0], W).min.toString(), max: range(d[0], W).max.toString() }; });
    return { bin: b, grouped: g4(b), hex: lpad(u.toString(16).toUpperCase(), Math.ceil(W / 4)), oct: lpad(u.toString(8), Math.ceil(W / 3)), uns: u.toString(), value: vstr(r), v: r.v.toString(), negZero: r.negZero,
      sign: b.charAt(0), ones: pc(b), zeros: W - pc(b), onesComp: bin(iv, W), twosComp: bin(tw, W), onesCompUns: iv.toString(), twosCompUns: tw.toString(), reads: reads, weights: wt };
  }
  function writes(v, W) { /* one value written in each representation (or why not) */
    return REPS.slice().reverse().map(function (d) {
      var R = range(d[0], W), u = encode(v, d[0], W);
      return { rep: d[0], name: d[1], bin: u === null ? null : bin(u, W), grouped: u === null ? null : g4(bin(u, W)), min: R.min.toString(), max: R.max.toString(), why: u === null ? (v > R.max ? 'overflow: above ' + R.max : 'underflow: below ' + R.min) : '' };
    });
  }

  /* carries INTO each column, most significant first, plus the carry out of the top bit */
  function addBits(x, y, cin, W) {
    var cs = [], c = cin, i, out = 0n;
    for (i = 0; i < W; i++) { var xb = (x >> BigInt(i)) & 1n, yb = (y >> BigInt(i)) & 1n, t = xb + yb + BigInt(c); cs[i] = c; out |= (t & 1n) << BigInt(i); c = Number(t >> 1n); }
    var intoMsb = cs[W - 1], carryStr = ''; for (i = W - 1; i >= 0; i--) carryStr += cs[i];
    return { s: out, cout: c, cin: cin, intoMsb: intoMsb, carryStr: carryStr };
  }
  function opt(o, k, d) { return o[k] == null || o[k] === '' ? d : String(o[k]); }

  function run(o) {
    o = o || {};
    var op = opt(o, 'op', 'analyze'), opd = OPS.filter(function (d) { return d[0] === op; })[0]; if (!opd) return { ok: false, error: 'Unknown operation.' };
    var rep = opt(o, 'rep', 'twos'); if (!repOk(rep)) return { ok: false, error: 'Unknown representation.' };
    var W = Number(opt(o, 'width', '8')); if (WIDTHS.indexOf(W) < 0) return { ok: false, error: 'Unknown bit width. Choose 4, 8, 16, 32 or 64 bits.' };
    var baseId = opt(o, 'base', 'dec'), policy = opt(o, 'policy', 'flag'); if (!POLICIES.some(function (d) { return d[0] === policy; })) return { ok: false, error: 'Unknown overflow policy.' };
    var pa = parseOperand(o.a, baseId, 'A'); if (!pa.ok) { pa.field = 'a'; return pa; }
    var pb = null; if (opd[2] === 2) { pb = parseOperand(o.b, baseId, 'B'); if (!pb.ok) { pb.field = 'b'; return pb; } }
    var ta = toPattern(pa, rep, W, 'A'); if (!ta.ok) { ta.field = 'a'; return ta; }
    var tb = null; if (pb) { tb = toPattern(pb, rep, W, 'B'); if (!tb.ok) { tb.field = 'b'; return tb; } }
    var W2 = W; if (op === 'resize') { W2 = Number(opt(o, 'to', '16')); if (WIDTHS.indexOf(W2) < 0) return { ok: false, field: 'to', error: 'Unknown target width. Choose 4, 8, 16, 32 or 64 bits.' }; }

    var top = 1n << BigInt(W - 1), all = 1n << BigInt(W), M = all - 1n, R = range(rep, W), a = ta.u, b = tb ? tb.u : 0n;
    var da = decode(a, rep, W), db = tb ? decode(b, rep, W) : null, A = bin(a, W);
    var res = { ok: true, op: op, opName: OPNAME[op], rep: rep, repName: REPNAME[rep], width: W, base: baseId, policy: policy, range: { min: R.min.toString(), max: R.max.toString() }, a: describe(a, rep, W), b: tb ? describe(b, rep, W) : null, aFromValue: !!ta.fromValue, bFromValue: tb ? !!tb.fromValue : false, steps: [], notes: [], warnings: [] };
    var steps = res.steps, notes = res.notes, warn = res.warnings, rn = REPNAME[rep];

    if (ta.padded) notes.push('A was typed with fewer than ' + W + ' bits, so it is padded with zeros on the left to ' + W + ' bits (' + g4(A) + '). Short patterns are not sign-extended: the representation and the width decide what the bits mean.');
    if (tb && tb.padded) notes.push('B was padded with zeros on the left to ' + W + ' bits (' + g4(bin(b, W)) + ').');

    /* ---------------- analyze ---------------- */
    if (op === 'analyze') {
      var d = res.a; res.result = d;
      if (ta.fromValue) {
        res.writes = writes(da.v, W);
        var ab = bin(babs(da.v), W), sign0 = da.v >= 0n;
        var t;
        if (rep === 'unsigned') t = 'Unsigned: every bit is a place value, so ' + da.v + ' in binary is ' + g4(bin(da.v, W)) + ' (padded to ' + W + ' bits).';
        else if (sign0) t = da.v + ' is not negative, so the sign bit is 0 and the other bits are the binary value:\n' + line('pattern', g4(A));
        else if (rep === 'twos') t = 'Negative number, two’s complement (the method for -' + (-da.v) + '):\n' + line('+' + (-da.v), g4(ab)) + '\n' + line('invert all bits', g4(bin(inv(babs(da.v), W), W))) + '\n' + line('add 1', g4(A)) + '\nCheck: unsigned value ' + a + ' - 2^' + W + ' (' + all + ') = ' + da.v + '.';
        else if (rep === 'ones') t = 'Negative number, one’s complement: write the magnitude, then invert every bit.\n' + line('+' + (-da.v), g4(ab)) + '\n' + line('invert all bits', g4(A));
        else t = 'Negative number, sign-magnitude: put 1 in the sign bit (the leftmost bit) and the magnitude ' + (-da.v) + ' in the other ' + (W - 1) + ' bits.\n' + line('sign', '1') + '\n' + line('magnitude', bin(babs(da.v), W - 1)) + '\n' + line('pattern', g4(A));
        steps.push({ title: 'Write ' + da.v + ' in ' + W + ' bits as ' + rn, text: t });
        if (encode(da.v, rep, W) !== a) throw new Error('internal check failed: encode');
      } else {
        var s2;
        if (rep === 'unsigned') s2 = 'Unsigned: every bit is a place value, so the pattern ' + g4(A) + ' is the whole number ' + a + '.';
        else if (a < top) s2 = 'The sign bit (leftmost) is 0, so the number is not negative. The value is the pattern read as a binary number: ' + a + '.';
        else if (rep === 'twos') s2 = 'The sign bit is 1, so the number is negative. Two’s complement: value = unsigned value - 2^' + W + ' = ' + a + ' - ' + all + ' = ' + da.v + '.\nAnother way: invert and add 1 to get the magnitude.\n' + line('pattern', g4(A)) + '\n' + line('invert all bits', g4(bin(inv(a, W), W))) + '\n' + line('add 1', g4(bin((inv(a, W) + 1n) & M, W)) + '  = ' + ((inv(a, W) + 1n) & M) + ', so the value is -' + ((inv(a, W) + 1n) & M));
        else if (rep === 'ones') s2 = 'The sign bit is 1, so the number is negative. One’s complement: invert every bit to get the magnitude.\n' + line('pattern', g4(A)) + '\n' + line('invert all bits', g4(bin(inv(a, W), W)) + '  = ' + inv(a, W) + ', so the value is ' + vstr(da));
        else s2 = 'The sign bit is 1, so the number is negative. Sign-magnitude: the other ' + (W - 1) + ' bits are the magnitude.\n' + line('sign', '1 (negative)') + '\n' + line('magnitude', bin(a - top, W - 1) + '  = ' + (a - top) + ', so the value is ' + vstr(da));
        steps.push({ title: 'Read the pattern as ' + rn, text: s2 });
        var rt = decode(encode(da.v, rep, W, da.negZero), rep, W); if (rt.v !== da.v) throw new Error('internal check failed: decode');
      }
      steps.push({ title: 'Complements of the pattern', text: line('pattern', g4(A) + '  (unsigned ' + a + ')') + '\n' + line('one’s compl.', g4(d.onesComp) + '  (every bit inverted, unsigned ' + d.onesCompUns + ')') + '\n' + line('two’s compl.', g4(d.twosComp) + '  (inverted + 1, unsigned ' + d.twosCompUns + ')') + '\nThe two’s complement of a pattern is its negative modulo 2^' + W + ': ' + a + ' + ' + d.twosCompUns + ' = ' + (a + BigInt(d.twosCompUns)) + (((a + BigInt(d.twosCompUns)) & M) === 0n ? ', which is 0 in ' + W + ' bits.' : '.') });
      if (((a + BigInt(d.twosCompUns)) & M) !== 0n) throw new Error('internal check failed: two’s complement');
      steps.push({ title: 'The same bits in each representation', text: d.reads.map(function (x) { return line(x.name, x.value + (x.selected ? '   <- selected' : '')); }).join('\n') });
      steps.push({ title: 'Range at ' + W + ' bits', text: d.reads.map(function (x) { return line(x.name, x.min + ' to ' + x.max); }).join('\n') + (rep === 'twos' ? '\nFor ' + W + '-bit two’s complement: -2^' + (W - 1) + ' <= N <= 2^' + (W - 1) + ' - 1.' : '') });
      notes.push('The pattern ' + g4(A) + ' is ' + a + ' unsigned and ' + d.value + ' as ' + rn + ' (' + W + '-bit). Unsigned and signed are different representations; the one you selected is the one used here.');
      if (rep === 'unsigned') notes.push('Unsigned has no sign bit: the leftmost bit is an ordinary place value worth 2^' + (W - 1) + '.');
      if (d.negZero) warn.push({ kind: 'negzero', text: 'This pattern is “negative zero”. ' + (rep === 'ones' ? 'One’s complement' : 'Sign-magnitude') + ' has two zeros (all zeros, and this one); two’s complement has only one.' });
      if (rep === 'twos' && a === top) warn.push({ kind: 'min', text: 'This is the most negative value, ' + R.min + '. It has no positive counterpart in ' + W + ' bits (the maximum is ' + R.max + '): negating it overflows, and its two’s complement is itself.' });
      if (rep === 'ones' || rep === 'signmag') notes.push((rep === 'ones' ? 'One’s complement' : 'Sign-magnitude') + ' has two zeros, so it represents one value fewer than two’s complement: ' + R.min + ' to ' + R.max + ' instead of ' + (-top) + ' to ' + (top - 1n) + '.');
      return res;
    }

    /* ---------------- resize ---------------- */
    if (op === 'resize') {
      res.toWidth = W2; var v = da.v, nz = da.negZero, R2 = range(rep, W2), u2 = encode(v, rep, W2, nz);
      if (u2 === null) return { ok: false, field: 'a', error: 'The value ' + v + ' does not fit in ' + W2 + ' bits as ' + rn + ': ' + (v > R2.max ? 'overflow, the largest value is ' + R2.max + '.' : 'underflow, the smallest value is ' + R2.min + '.') + ' Narrowing would change the value, so nothing is truncated.' };
      var A2 = bin(u2, W2), sg = A.charAt(0), grow = W2 - W, ruleBits;
      if (W2 >= W) ruleBits = rep === 'unsigned' ? rpt('0', grow) + A : rep === 'signmag' ? sg + rpt('0', grow) + A.slice(1) : rpt(sg, grow) + A;
      else ruleBits = rep === 'signmag' ? sg + A.slice(1 + (W - W2)) : A.slice(W - W2);
      if (ruleBits !== A2) throw new Error('internal check failed: sign extension');
      if (decode(u2, rep, W2).v !== v) throw new Error('internal check failed: resize value');
      var d2 = describe(u2, rep, W2); res.result = d2; res.fromWidth = W; res.toWidth = W2;
      var rule = W2 === W ? 'The width is unchanged, so the pattern is unchanged.' : W2 > W ? (rep === 'unsigned' ? 'Unsigned: add ' + grow + ' zero bit' + (grow === 1 ? '' : 's') + ' on the left.' : rep === 'signmag' ? 'Sign-magnitude: move the sign bit to the new leftmost position and fill the ' + grow + ' new bit' + (grow === 1 ? '' : 's') + ' next to it with zeros. The magnitude is not touched.' : (rep === 'twos' ? 'Two’s complement' : 'One’s complement') + ' sign extension: copy the sign bit (' + sg + ') into the ' + grow + ' new bit' + (grow === 1 ? '' : 's') + ' on the left.') : (rep === 'signmag' ? 'Sign-magnitude: keep the sign bit and drop ' + (W - W2) + ' leading magnitude bits, which are all 0 because the value fits.' : 'Drop the ' + (W - W2) + ' leftmost bit' + (W - W2 === 1 ? '' : 's') + '. They are all copies of the new sign bit (or zeros, unsigned), so the value is unchanged.');
      steps.push({ title: (W2 > W ? 'Widen' : W2 < W ? 'Narrow' : 'Keep') + ' ' + W + ' to ' + W2 + ' bits (' + rn + ')', text: rule + '\n' + line(W + ' bits', g4(A) + '  = ' + vstr(da)) + '\n' + line(W2 + ' bits', g4(A2) + '  = ' + d2.value) });
      if (W2 > W && rep !== 'unsigned' && da.v < 0n) { var zx = bin(a, W2); notes.push('Common mistake: filling with zeros instead of the sign bit gives ' + g4(zx) + ', which is ' + decode(a, rep, W2).v + ' as ' + rn + ', not ' + da.v + '. Negative values must be sign-extended.'); res.zeroExt = { bin: zx, value: decode(a, rep, W2).v.toString() }; }
      if (da.negZero) warn.push({ kind: 'negzero', text: 'The value is negative zero and stays negative zero at the new width.' });
      notes.push('The value is the same at both widths (' + vstr(da) + '); only the number of bits changes. Range at ' + W2 + ' bits: ' + R2.min + ' to ' + R2.max + '.');
      steps.push({ title: 'The same patterns as numbers', text: line(W + ' bits', res.a.hex + ' hex, ' + res.a.uns + ' unsigned, ' + res.a.value + ' ' + rn) + '\n' + line(W2 + ' bits', d2.hex + ' hex, ' + d2.uns + ' unsigned, ' + d2.value + ' ' + rn) });
      return res;
    }

    /* ---------------- negate, add, subtract ---------------- */
    var e, sym, hwText = '', hwOvf = null, hwPat = null;
    var vb = db ? db.v : 0n;
    if (op === 'neg') {
      e = -da.v; sym = '-A';
      if (rep === 'unsigned') hwPat = (inv(a, W) + 1n) & M;
      else if (rep === 'twos') hwPat = (inv(a, W) + 1n) & M;
      else if (rep === 'ones') hwPat = inv(a, W);
      else hwPat = a ^ top;
      steps.push({ title: 'Negate A (' + rn + ')', text: (rep === 'unsigned' ? 'Unsigned numbers have no negatives: only 0 negates to a value that fits. Computing the bit pattern anyway (invert and add 1, which is the negative modulo 2^' + W + ') gives ' + g4(bin(hwPat, W)) + ' = ' + hwPat + ', which is not -' + a + '.' : rep === 'twos' ? 'Two’s complement: invert every bit, then add 1.\n' + line('A', g4(A) + '  = ' + vstr(da)) + '\n' + line('invert all bits', g4(bin(inv(a, W), W))) + '\n' + line('add 1', g4(bin(hwPat, W)) + '  = ' + decode(hwPat, rep, W).v) : rep === 'ones' ? 'One’s complement: invert every bit.\n' + line('A', g4(A) + '  = ' + vstr(da)) + '\n' + line('invert all bits', g4(bin(hwPat, W)) + '  = ' + vstr(decode(hwPat, rep, W))) : 'Sign-magnitude: flip the sign bit and leave the magnitude alone.\n' + line('A', g4(A) + '  = ' + vstr(da)) + '\n' + line('flip sign bit', g4(bin(hwPat, W)) + '  = ' + vstr(decode(hwPat, rep, W)))) });
      if (e >= R.min && e <= R.max && rep !== 'unsigned' && decode(hwPat, rep, W).v !== e) throw new Error('internal check failed: negate');
      if (rep === 'unsigned' && e >= R.min && e <= R.max && hwPat !== 0n) throw new Error('internal check failed: negate unsigned');
      if (rep === 'twos' && a === top) { if (hwPat !== top) throw new Error('internal check failed: minimum negates to itself'); }
    } else {
      var sub = op === 'sub'; e = sub ? da.v - vb : da.v + vb; sym = sub ? 'A - B' : 'A + B';
      var Bs = bin(b, W);
      if (rep === 'twos' || rep === 'unsigned') {
        var y = sub ? inv(b, W) : b, cin = sub ? 1 : 0, ad = addBits(a, y, cin, W); hwPat = ad.s;
        var ovfSigned = ad.intoMsb !== ad.cout;
        hwOvf = rep === 'twos' ? ovfSigned : (sub ? ad.cout === 0 : ad.cout === 1);
        hwText = 'Add the bit patterns' + (sub ? ' (subtraction is A + invert B + 1)' : '') + ', column by column from the right, keeping the carries.\n' + line('carry into bit', ad.carryStr + (cin ? '  (the carry into bit 0 is the +1)' : '')) + '\n' + line('A', g4(A)) + '\n' + line(sub ? 'invert B' : 'B', g4(bin(y, W))) + '\n' + line('sum, ' + W + ' bits', g4(bin(ad.s, W))) + '\n' + line('carry out', String(ad.cout)) + '\n' + line('carry into MSB', String(ad.intoMsb)) + '\n' +
          (rep === 'twos' ? 'Two’s complement overflow: the carry into the sign bit differs from the carry out of it (' + ad.intoMsb + ' and ' + ad.cout + '), so ' + (ovfSigned ? 'the result overflowed.' : 'the result is correct.') : (sub ? 'Unsigned subtraction: a carry out of 1 means no borrow; a carry out of 0 means A < B and the result underflowed (' + (ad.cout === 0 ? 'it did' : 'it did not') + ').' : 'Unsigned addition: a carry out of the top bit means the sum needs more than ' + W + ' bits (' + (ad.cout === 1 ? 'it does' : 'it does not') + ').'));
        if (hwOvf !== !(e >= R.min && e <= R.max)) throw new Error('internal check failed: overflow flag');
      } else if (rep === 'ones') {
        var y1 = sub ? inv(b, W) : b, raw = a + y1, c1 = raw >> BigInt(W), low = raw & M, fin = c1 ? (low + 1n) & M : low, sa = a >= top, sb = y1 >= top, sr = fin >= top;
        hwPat = fin; hwOvf = sa === sb && sr !== sa;
        hwText = 'Add the patterns' + (sub ? ' (subtraction adds the inverted B, which is -B in one’s complement)' : '') + '. If there is a carry out of the top bit, add it back in at the right: the end-around carry.\n' + line('A', g4(A)) + '\n' + line(sub ? 'invert B' : 'B', g4(bin(y1, W))) + '\n' + line('sum', g4(bin(low, W)) + '  carry out ' + c1) + '\n' + line('end-around', c1 ? 'add the carry: ' + g4(bin(fin, W)) : 'no carry to add back') + '\n' +
          'Overflow: the two operands have the same sign (' + (sa ? 1 : 0) + ' and ' + (sb ? 1 : 0) + ') and the result sign is ' + (sr ? 1 : 0) + (hwOvf ? ', which differs, so the result overflowed.' : (sa === sb ? ', which is the same, so the result is correct.' : '. Operands of opposite signs cannot overflow.'));
        if (hwOvf !== !(e >= R.min && e <= R.max)) throw new Error('internal check failed: overflow flag');
      } else {
        var sA = a >= top, mA = sA ? a - top : a, sB0 = b >= top, mB = sB0 ? b - top : b, sB = sub ? !sB0 : sB0, m, sR;
        if (sA === sB) { m = mA + mB; sR = sA; hwOvf = m >= top; hwPat = (sR ? top : 0n) + (m % top); }
        else if (mA >= mB) { m = mA - mB; sR = sA; hwOvf = false; hwPat = (sR && m !== 0n ? top : 0n) + m; }
        else { m = mB - mA; sR = sB; hwOvf = false; hwPat = (sR ? top : 0n) + m; }
        hwText = 'Sign-magnitude works on the sign and the magnitude separately.\n' + line('A', (sA ? '-' : '+') + mA + '  (sign ' + (sA ? 1 : 0) + ', magnitude ' + bin(mA, W - 1) + ')') + '\n' + line(sub ? 'B, sign flipped' : 'B', (sB ? '-' : '+') + mB + '  (sign ' + (sB ? 1 : 0) + ', magnitude ' + bin(mB, W - 1) + ')') + '\n' +
          (sA === sB ? 'Same signs: add the magnitudes, ' + mA + ' + ' + mB + ' = ' + (mA + mB) + ', and keep the sign. ' + (hwOvf ? 'The sum needs more than ' + (W - 1) + ' magnitude bits, so the result overflowed.' : 'It fits in ' + (W - 1) + ' bits.') : 'Different signs: subtract the smaller magnitude from the larger, ' + (mA >= mB ? mA + ' - ' + mB : mB + ' - ' + mA) + ' = ' + m + ', and take the sign of the larger magnitude. This cannot overflow.');
        if (hwOvf !== !(e >= R.min && e <= R.max)) throw new Error('internal check failed: overflow flag');
      }
      steps.push({ title: 'The operands', text: line('A', g4(A) + '  = ' + vstr(da) + ' (' + rn + ')') + '\n' + line('B', g4(Bs) + '  = ' + vstr(db) + ' (' + rn + ')') });
      steps.push({ title: 'The exact result', text: line(sym, da.v + (sub ? ' - ' : ' + ') + (vb < 0n ? '(' + vb + ')' : vb) + ' = ' + e) + '\nThis is the true mathematical result, before it is squeezed into ' + W + ' bits.' });
      steps.push({ title: 'How the hardware does it', text: hwText });
    }
    var inR = e >= R.min && e <= R.max, flag = inR ? null : (e > R.max ? 'overflow' : 'underflow'), stored = null, wrapU = null, satU = null;
    if (!inR) { wrapU = wrapPat(e, rep, W); satU = satPat(e, rep, W); }
    if (op === 'neg' && !inR && rep === 'twos' && a === top && hwPat !== a) throw new Error('internal check failed');
    if (!inR && hwPat !== null && op !== 'neg') { var hv = decode(hwPat, rep, W), wv = decode(wrapU, rep, W); if (hv.v !== wv.v) throw new Error('internal check failed: wrap-around pattern'); }
    if (!inR && op === 'neg' && rep === 'twos' && wrapU !== top) throw new Error('internal check failed: wrap of the minimum');
    if (inR && hwPat !== null && op !== 'neg') { if (decode(hwPat, rep, W).v !== e) throw new Error('internal check failed: ' + op + ' pattern'); }
    var sU = inR ? encode(e, rep, W) : policy === 'wrap' ? wrapU : policy === 'sat' ? satU : null;
    if (sU !== null) stored = describe(sU, rep, W);
    res.calc = { symbol: sym, exact: e.toString(), inRange: inR, flag: flag, policy: policy, stored: stored, wrap: wrapU === null ? null : describe(wrapU, rep, W), sat: satU === null ? null : describe(satU, rep, W), carryOut: undefined };
    res.result = stored;
    var lim = e > R.max ? R.max : R.min;
    steps.push({ title: 'Range check', text: 'The true result ' + e + ' is ' + (inR ? 'inside' : 'outside') + ' the ' + W + '-bit ' + rn + ' range ' + R.min + ' to ' + R.max + '.' + (inR ? ' No overflow or underflow.' : ' That is ' + flag + ': the result is ' + (e > R.max ? 'larger than the maximum' : 'smaller than the minimum') + ' (' + lim + ').') });
    if (!inR) {
      warn.push({ kind: flag, text: (flag === 'overflow' ? 'Overflow: ' : 'Underflow: ') + 'the true result ' + e + ' does not fit in ' + W + ' bits as ' + rn + ' (the ' + (flag === 'overflow' ? 'maximum is ' : 'minimum is ') + lim + ').' });
      steps.push({ title: 'If the result is squeezed into ' + W + ' bits', text: line('wrap around', g4(bin(wrapU, W)) + '  = ' + vstr(decode(wrapU, rep, W))) + '\n' + line('saturate', g4(bin(satU, W)) + '  = ' + vstr(decode(satU, rep, W))) + '\nWrap around keeps only the low ' + W + ' bits' + (rep === 'ones' ? ' with the end-around carry' : rep === 'signmag' ? ' of the magnitude and keeps the sign' : '') + '. Saturation stops at the nearest limit. Neither is the true result.' });
      steps.push({ title: 'Selected overflow policy', text: policy === 'flag' ? 'Report: no result is stored, because ' + e + ' cannot be written in ' + W + ' bits as ' + rn + '.' : policy === 'wrap' ? 'Wrap around: the stored result is ' + g4(bin(sU, W)) + ' = ' + vstr(decode(sU, rep, W)) + ', which is wrong by ' + (decode(sU, rep, W).v - e) + '.' : 'Saturate: the stored result is ' + g4(bin(sU, W)) + ' = ' + vstr(decode(sU, rep, W)) + ', the nearest value that fits.' });
    }
    if (stored) {
      steps.push({ title: 'The stored result', text: line('result', g4(stored.bin) + '  (' + W + ' bits, ' + rn + ')') + '\n' + line('value', stored.value) + '\n' + line('hex / unsigned', stored.hex + ' / ' + stored.uns) });
      if (inR && stored.negZero) warn.push({ kind: 'negzero', text: 'The stored pattern is negative zero.' });
      if (inR && e === 0n && hwPat !== null && op !== 'neg' && decode(hwPat, rep, W).negZero) notes.push('The hardware sum is ' + g4(bin(hwPat, W)) + ', which is negative zero. It is the same value as +0, so the result is shown as +0 (' + g4(stored.bin) + ').');
    }
    if (op === 'neg' && rep === 'twos' && a === top) warn.push({ kind: 'min', text: 'The most negative value has no positive counterpart: -(' + R.min + ') = ' + (-R.min) + ' does not fit, and the bit pattern comes back unchanged.' });
    if (op === 'neg' && rep === 'unsigned' && a !== 0n) notes.push('Unsigned numbers cannot be negative. Use one of the signed representations to negate a value.');
    if (rep === 'unsigned') notes.push('Unsigned arithmetic: a carry out (addition) or a missing carry (subtraction) is the overflow or underflow signal.');
    if (rep === 'twos') notes.push('In two’s complement the same adder circuit handles signed and unsigned operands; only the overflow rule differs (carry into the sign bit versus carry out of it).');
    if (rep === 'ones') notes.push('One’s complement addition needs the end-around carry, and it has two zeros (+0 and -0).');
    if (rep === 'signmag') notes.push('Sign-magnitude needs separate logic for the sign, which is why two’s complement is used in practice. It has two zeros (+0 and -0).');
    return res;
  }

  function csvq(s) { s = String(s); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function exportTxt(r) {
    var L = ['Elecmetric Binary Calculator: Signed Binary Representations (' + r.opName + ', ' + r.width + ' bits, ' + r.repName + ')', ''];
    L.push('A       : ' + r.a.grouped + '  (' + r.a.value + ', unsigned ' + r.a.uns + ')'); if (r.b) L.push('B       : ' + r.b.grouped + '  (' + r.b.value + ', unsigned ' + r.b.uns + ')');
    if (r.calc) { L.push('True result : ' + r.calc.exact + (r.calc.flag ? '  (' + r.calc.flag + ')' : '')); }
    if (r.result) L.push('Result  : ' + r.result.grouped + '  (' + r.result.value + ', hex ' + r.result.hex + ', unsigned ' + r.result.uns + ')'); else L.push('Result  : none stored');
    r.warnings.forEach(function (w) { L.push('Warning : ' + w.text); });
    L.push(''); L.push('Working'); r.steps.forEach(function (s) { L.push(''); L.push(s.title); L.push(s.text); });
    return L.join('\n') + '\n';
  }
  function exportCsv(r) {
    var rows = [['item', 'binary', 'hex', 'unsigned', 'value_in_' + r.rep]], f = function (n, d) { rows.push([n, d.bin, d.hex, d.uns, d.value]); };
    f('A', r.a); if (r.b) f('B', r.b); if (r.result) f('result', r.result);
    if (r.calc) { rows.push([]); rows.push(['true_result', 'overflow_flag']); rows.push([r.calc.exact, r.calc.flag || 'none']); }
    rows.push([]); rows.push(['representation', 'value_of_A_bits', 'min', 'max']); r.a.reads.forEach(function (x) { rows.push([x.name, x.value, x.min, x.max]); });
    return rows.map(function (x) { return x.map(csvq).join(','); }).join('\n') + '\n';
  }
  function exportJson(r) {
    var d = function (x) { return { binary: x.bin, hex: x.hex, unsigned: x.uns, value: x.value, signBit: x.sign, onesComplementOfBits: x.onesComp, twosComplementOfBits: x.twosComp }; };
    return JSON.stringify({ tool: 'Elecmetric Binary Calculator, Mode 04 Signed Binary Representations', operation: r.opName, representation: r.repName, bitWidth: r.width, range: r.range, a: d(r.a), b: r.b ? d(r.b) : undefined, result: r.result ? d(r.result) : null, trueResult: r.calc ? r.calc.exact : undefined, flag: r.calc ? (r.calc.flag || 'none') : undefined, overflowPolicy: r.calc ? r.policy : undefined, toWidth: r.toWidth, warnings: r.warnings.map(function (w) { return w.text; }), sameBitsInEachRepresentation: r.a.reads.map(function (x) { return { representation: x.name, value: x.value }; }) }, null, 2) + '\n';
  }

  var api = { REPS: REPS, OPS: OPS, POLICIES: POLICIES, WIDTHS: WIDTHS, BASES: BASES, REPNAME: REPNAME, range: range, encode: encode, decode: decode, parseOperand: parseOperand, run: run, exportTxt: exportTxt, exportCsv: exportCsv, exportJson: exportJson };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.SignBin = api;
})(typeof window !== 'undefined' ? window : this);
