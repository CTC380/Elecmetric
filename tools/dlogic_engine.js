/* Elecmetric Binary Calculator, Mode 05: Digital Electronics and Logic. Engine: one file, no dependencies, no DOM.
   Required by tests/dlogic_test.js and inlined into calculators/digital-logic-calculator/index.html by tools/dlogic_page.js.

   Four tools:
     bool    a Boolean expression (A AND (B OR NOT C), AB' + C, A ^ B ...) or a minterm list (m(1,3,5) d(7)) -> truth table, minterms and maxterms, canonical SOP and POS,
             exact minimal SOP and POS (Quine-McCluskey with an exact cover), equivalence with a second expression, and a gate-level trace of one input row. 1 to 6 variables.
     reg     a register value at 8, 16, 32 or 64 bits (or 4) -> binary, decimal, octal, hex, MSB, LSB, set and clear bit positions, named bit fields, and a bit mask
             (a position list such as 0,3,5-7 or a pattern 0xF0) applied as set, clear, toggle or keep.
     parity  even or odd parity: generate the parity bit and the word to send, or check a received word.
     group   a value split into nibbles, bytes, words and double words, with big-endian and little-endian byte order.
   Variables are single letters A to Z; adjacent letters mean AND (AB is A AND B). Precedence: NOT, then AND/NAND, then XOR/XNOR, then OR/NOR.
   Every result is derived twice inside the engine (truth vector by bit-parallel BigInt and row by row; SOP and POS re-evaluated against the table; masks column by column);
   a mismatch throws, so a wrong answer is never shown. */
(function (root) {
  'use strict';
  var KW = { AND: 1, OR: 1, XOR: 1, NAND: 1, NOR: 1, XNOR: 1, NOT: 1, TRUE: 1, FALSE: 1 };
  var BASES = [['bin', 2, 'binary'], ['hex', 16, 'hexadecimal'], ['dec', 10, 'decimal'], ['oct', 8, 'octal']], BITS = { 2: 1, 8: 3, 16: 4 };
  var WIDTHS = [4, 8, 16, 32, 64];
  var OPS = [['bool', 'Boolean expression: truth table and simplification'], ['reg', 'Register and bit mask'], ['parity', 'Parity bit'], ['group', 'Data grouping (nibbles, bytes, words)']];
  var PREC = { OR: 1, NOR: 1, XOR: 2, XNOR: 2, AND: 3, NAND: 3 };

  function lpad(s, n) { s = String(s); while (s.length < n) s = '0' + s; return s; }
  function g4(b) { var o = [], i; for (i = b.length; i > 0; i -= 4) o.unshift(b.slice(Math.max(0, i - 4), i)); return o.join(' '); }
  function pc(s) { var n = 0, i; for (i = 0; i < s.length; i++) if (s.charAt(i) === '1') n++; return n; }
  function line(l, s) { var p = '                '; return (l + p).slice(0, 16) + ': ' + s; }
  function mask(w) { return (1n << BigInt(w)) - 1n; }
  function bin(u, w) { return lpad(u.toString(2), w); }
  function csvq(s) { s = String(s); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function opt(o, k, d) { return o[k] == null || o[k] === '' ? d : String(o[k]); }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }

  /* ============================== Boolean expressions ============================== */
  function tokenize(src) {
    var s = String(src), t = [], i = 0, c;
    while (i < s.length) {
      c = s.charAt(i);
      if (/\s/.test(c)) { i++; continue; }
      if (c === '(' || c === ')') { t.push({ k: c }); i++; continue; }
      if (/[A-Za-z]/.test(c)) {
        var j = i; while (j < s.length && /[A-Za-z]/.test(s.charAt(j))) j++;
        var w = s.slice(i, j).toUpperCase(); i = j;
        if (KW[w]) { if (w === 'NOT') t.push({ k: 'not' }); else if (w === 'TRUE') t.push({ k: 'const', v: 1 }); else if (w === 'FALSE') t.push({ k: 'const', v: 0 }); else t.push({ k: 'op', v: w }); }
        else w.split('').forEach(function (ch) { t.push({ k: 'var', v: ch }); });
        continue;
      }
      if (c === '0' || c === '1') { t.push({ k: 'const', v: Number(c) }); i++; continue; }
      if (c === '!' || c === '~' || c === '¬') { t.push({ k: 'not' }); i++; continue; }
      if (c === "'" || c === '’' || c === '′') { t.push({ k: 'post' }); i++; continue; }
      if (c === '&' || c === '*' || c === '·' || c === '∧' || c === '.') { t.push({ k: 'op', v: 'AND' }); i += (c === '&' && s.charAt(i + 1) === '&') ? 2 : 1; continue; }
      if (c === '|' || c === '+' || c === '∨') { t.push({ k: 'op', v: 'OR' }); i += (c === '|' && s.charAt(i + 1) === '|') ? 2 : 1; continue; }
      if (c === '^' || c === '⊕') { t.push({ k: 'op', v: 'XOR' }); i++; continue; }
      if (c === '↑') { t.push({ k: 'op', v: 'NAND' }); i++; continue; }
      if (c === '↓') { t.push({ k: 'op', v: 'NOR' }); i++; continue; }
      if (c === '⊙') { t.push({ k: 'op', v: 'XNOR' }); i++; continue; }
      throw new Error('Unexpected character ‘' + c + '’. Use letters A to Z, 0 and 1, AND, OR, NOT, XOR, NAND, NOR, XNOR (or & | ! ^ + \' ), and brackets.');
    }
    return t;
  }
  function parseExpr(src) {
    var t = tokenize(src), p = 0, count = 0;
    if (!t.length) throw new Error('Enter a Boolean expression.');
    function peek() { return t[p]; }
    function mk(n) { if (++count > 400) throw new Error('The expression is too large (limit 400 operations).'); return n; }
    function startsPrimary(x) { return x && (x.k === 'var' || x.k === 'const' || x.k === '(' || x.k === 'not'); }
    function pOr(d) { var a = pXor(d), x; while ((x = peek()) && x.k === 'op' && (x.v === 'OR' || x.v === 'NOR')) { p++; a = mk({ t: 'bin', op: x.v, a: a, b: pXor(d) }); } return a; }
    function pXor(d) { var a = pAnd(d), x; while ((x = peek()) && x.k === 'op' && (x.v === 'XOR' || x.v === 'XNOR')) { p++; a = mk({ t: 'bin', op: x.v, a: a, b: pAnd(d) }); } return a; }
    function pAnd(d) {
      var a = pUn(d), x;
      for (;;) {
        x = peek();
        if (x && x.k === 'op' && (x.v === 'AND' || x.v === 'NAND')) { p++; a = mk({ t: 'bin', op: x.v, a: a, b: pUn(d) }); }
        else if (startsPrimary(x)) a = mk({ t: 'bin', op: 'AND', a: a, b: pUn(d) });
        else break;
      }
      return a;
    }
    function pUn(d) {
      if (d > 40) throw new Error('The expression is nested too deeply.');
      var x = peek(); if (!x) throw new Error('The expression ends too soon: an operand is missing.');
      var n;
      if (x.k === 'not') { p++; n = mk({ t: 'not', a: pUn(d + 1) }); return n; }
      if (x.k === 'var') { p++; n = { t: 'var', n: x.v }; }
      else if (x.k === 'const') { p++; n = { t: 'const', v: x.v }; }
      else if (x.k === '(') { p++; n = pOr(d + 1); if (!peek() || peek().k !== ')') throw new Error('A closing bracket is missing.'); p++; }
      else if (x.k === ')') throw new Error('There is a closing bracket with no opening bracket.');
      else if (x.k === 'post') throw new Error('A prime (\') must follow an operand, as in A\'.');
      else throw new Error('An operand is missing before ' + (x.v || x.k) + '.');
      while (peek() && peek().k === 'post') { p++; n = mk({ t: 'not', a: n }); }
      return n;
    }
    var ast = pOr(0);
    if (p < t.length) { var x = t[p]; throw new Error(x.k === ')' ? 'There is a closing bracket with no opening bracket.' : 'Unexpected ' + (x.v || x.k) + ' after a complete expression.'); }
    return ast;
  }
  function varsOf(ast, set) { set = set || {}; if (ast.t === 'var') set[ast.n] = 1; else if (ast.t === 'not') varsOf(ast.a, set); else if (ast.t === 'bin') { varsOf(ast.a, set); varsOf(ast.b, set); } return set; }
  function gate(op, x, y) { switch (op) { case 'AND': return x & y; case 'OR': return x | y; case 'XOR': return x ^ y; case 'NAND': return 1 - (x & y); case 'NOR': return 1 - (x | y); default: return 1 - (x ^ y); } }
  function evalRow(ast, env) { if (ast.t === 'var') return env[ast.n]; if (ast.t === 'const') return ast.v; if (ast.t === 'not') return 1 - evalRow(ast.a, env); return gate(ast.op, evalRow(ast.a, env), evalRow(ast.b, env)); }
  function evalBits(ast, V, M) {
    if (ast.t === 'var') return V[ast.n]; if (ast.t === 'const') return ast.v ? M : 0n; if (ast.t === 'not') return (~evalBits(ast.a, V, M)) & M;
    var x = evalBits(ast.a, V, M), y = evalBits(ast.b, V, M);
    switch (ast.op) { case 'AND': return x & y; case 'OR': return x | y; case 'XOR': return x ^ y; case 'NAND': return (~(x & y)) & M; case 'NOR': return (~(x | y)) & M; default: return (~(x ^ y)) & M; }
  }
  function fmt(n, parent) {
    if (n.t === 'var') return n.n; if (n.t === 'const') return String(n.v);
    if (n.t === 'not') { var inner = fmt(n.a, 'NOT'); return 'NOT ' + (n.a.t === 'bin' ? '(' + fmt(n.a, null) + ')' : inner); }
    var l = fmt(n.a, n.op), r = fmt(n.b, n.op), s = l + ' ' + n.op + ' ' + r;
    if (n.a.t === 'bin' && !(n.a.op === n.op && (n.op === 'AND' || n.op === 'OR' || n.op === 'XOR')) && PREC[n.a.op] <= PREC[n.op]) l = '(' + fmt(n.a, null) + ')';
    if (n.b.t === 'bin' && !(n.b.op === n.op && (n.op === 'AND' || n.op === 'OR' || n.op === 'XOR')) && PREC[n.b.op] <= PREC[n.op]) r = '(' + fmt(n.b, null) + ')';
    else if (n.b.t === 'bin' && n.b.op === n.op) r = '(' + fmt(n.b, null) + ')';
    if (n.a.t === 'bin' && n.a.op === n.op && !(n.op === 'AND' || n.op === 'OR' || n.op === 'XOR')) l = '(' + fmt(n.a, null) + ')';
    s = l + ' ' + n.op + ' ' + r; return s;
  }
  function gateNodes(ast, out, seen) {
    if (ast.t === 'var' || ast.t === 'const') return;
    if (ast.t === 'not') gateNodes(ast.a, out, seen); else { gateNodes(ast.a, out, seen); gateNodes(ast.b, out, seen); }
    var lab = fmt(ast, null); if (!seen[lab]) { seen[lab] = 1; out.push({ node: ast, label: lab }); }
  }
  function tree(ast, env) {
    if (ast.t === 'var') return { kind: 'var', name: ast.n, value: env[ast.n] };
    if (ast.t === 'const') return { kind: 'const', name: String(ast.v), value: ast.v };
    if (ast.t === 'not') { var k = tree(ast.a, env); return { kind: 'gate', op: 'NOT', value: 1 - k.value, kids: [k] }; }
    var a = tree(ast.a, env), b = tree(ast.b, env); return { kind: 'gate', op: ast.op, value: gate(ast.op, a.value, b.value), kids: [a, b] };
  }

  function cubeKey(c) { return c.replace(/1/g, 'x').replace(/0/g, '1').replace(/x/g, '0').replace(/-/g, '2'); }
  function cubeOrder(a, b) { var x = cubeKey(a.cube), y = cubeKey(b.cube); return x < y ? -1 : x > y ? 1 : 0; }
  /* Quine-McCluskey: prime implicants of (on + dc) over n variables; cubes are strings of 0, 1 and - (first variable first) */
  function cubeStr(v, m, n) { var s = '', j; for (j = 0; j < n; j++) { var bit = 1 << (n - 1 - j); s += (m & bit) ? '-' : ((v & bit) ? '1' : '0'); } return s; }
  function qmPrimes(n, on, dc) {
    var all = on.concat(dc).sort(function (a, b) { return a - b; }), cur = {}, rounds = [], primes = [], k;
    all.forEach(function (x) { cur[x + ':0'] = { v: x, m: 0 }; });
    for (;;) {
      var keys = Object.keys(cur); if (!keys.length) break;
      var items = keys.map(function (q) { return cur[q]; }), used = {}, nxt = {}, i, j;
      rounds.push(items.map(function (x) { return cubeStr(x.v, x.m, n); }).sort());
      for (i = 0; i < items.length; i++) for (j = i + 1; j < items.length; j++) {
        var a = items[i], b = items[j]; if (a.m !== b.m) continue;
        var d = a.v ^ b.v; if (d && (d & (d - 1)) === 0) { var nm = a.m | d, nv = a.v & ~d; nxt[nv + ':' + nm] = { v: nv, m: nm }; used[i] = 1; used[j] = 1; }
      }
      for (i = 0; i < items.length; i++) if (!used[i]) primes.push(items[i]);
      cur = nxt;
    }
    primes = primes.map(function (x) { var cov = all.filter(function (q) { return (q & ~x.m) === (x.v & ~x.m); }); return { cube: cubeStr(x.v, x.m, n), v: x.v, m: x.m, covers: cov, lits: n - pc(cubeStr(x.v, x.m, n).replace(/[01]/g, '1').replace(/-/g, '0')) + 0 }; });
    primes.forEach(function (x) { x.lits = x.cube.replace(/-/g, '').length; });
    primes.sort(cubeOrder);
    return { primes: primes, rounds: rounds };
  }
  /* exact minimum cover (fewest product terms, then fewest literals) of the on-set */
  function minCover(on, primes) {
    var chosen = [], left = on.slice(), ess = [], i;
    var cov = function (p, x) { return p.covers.indexOf(x) >= 0; };
    on.forEach(function (x) { var c = primes.filter(function (p) { return cov(p, x); }); if (c.length === 1 && ess.indexOf(c[0]) < 0) ess.push(c[0]); });
    ess.forEach(function (p) { chosen.push(p); left = left.filter(function (x) { return !cov(p, x); }); });
    var cand = primes.filter(function (p) { return ess.indexOf(p) < 0 && left.some(function (x) { return cov(p, x); }); });
    var best = null, nodes = 0, exact = true;
    function better(t, l) { return best === null || t < best.t || (t === best.t && l < best.l); }
    function rec(u, pick, t, l) {
      if (++nodes > 300000) { exact = false; return; }
      if (best !== null && (t > best.t || (t === best.t && l >= best.l)) && u.length) return;
      if (!u.length) { if (better(t, l)) best = { t: t, l: l, pick: pick.slice() }; return; }
      var x = u[0], bc = 1e9, k;
      for (k = 0; k < u.length; k++) { var cnt = cand.filter(function (p) { return cov(p, u[k]); }).length; if (cnt < bc) { bc = cnt; x = u[k]; } }
      var opts = cand.filter(function (p) { return cov(p, x); }).sort(function (a, b) { return b.covers.length - a.covers.length; });
      for (k = 0; k < opts.length; k++) { var p = opts[k]; pick.push(p); rec(u.filter(function (y) { return !cov(p, y); }), pick, t + 1, l + p.lits); pick.pop(); }
    }
    var baseT = chosen.length, baseL = chosen.reduce(function (s, p) { return s + p.lits; }, 0);
    rec(left, [], baseT, baseL);
    if (best === null) { /* node limit reached before any cover: greedy */ exact = false; var u = left.slice(), pk = []; while (u.length) { var bp = cand.slice().sort(function (a, b) { return u.filter(function (y) { return cov(b, y); }).length - u.filter(function (y) { return cov(a, y); }).length; })[0]; pk.push(bp); u = u.filter(function (y) { return !cov(bp, y); }); } best = { pick: pk }; }
    best.pick.forEach(function (p) { chosen.push(p); });
    chosen.sort(cubeOrder);
    return { chosen: chosen, essential: ess, exact: exact };
  }
  function prod(cube, vars) { var s = '', j; for (j = 0; j < cube.length; j++) if (cube.charAt(j) !== '-') s += vars[j] + (cube.charAt(j) === '0' ? "'" : ''); return s || '1'; }
  function sumOfComp(cube, vars) { var a = [], j; for (j = 0; j < cube.length; j++) if (cube.charAt(j) !== '-') a.push(vars[j] + (cube.charAt(j) === '1' ? "'" : '')); return a; }
  function coverEval(cubes, i, n) { return cubes.some(function (c) { var j; for (j = 0; j < n; j++) { var b = (i >> (n - 1 - j)) & 1, ch = c.charAt(j); if (ch !== '-' && Number(ch) !== b) return false; } return true; }); }
  function sopText(chosen, vars) { if (!chosen.length) return '0'; if (chosen.length === 1 && /^-+$/.test(chosen[0].cube)) return '1'; return chosen.map(function (p) { return prod(p.cube, vars); }).join(' + '); }
  function posText(chosen, vars) {
    if (!chosen.length) return '1'; if (chosen.length === 1 && /^-+$/.test(chosen[0].cube)) return '0';
    return chosen.map(function (p) { var a = sumOfComp(p.cube, vars); return a.length > 1 ? '(' + a.join(' + ') + ')' : a[0]; }).join('');
  }
  function parseList(txt, n, label) {
    var out = [], s = String(txt || '').trim(); if (!s) return out;
    s.split(/[\s,;]+/).forEach(function (tok) {
      if (!tok) return; var m = tok.match(/^(\d+)(?:-(\d+))?$/); if (!m) throw new Error(label + ': ‘' + tok + '’ is not a number or a range such as 4-7.');
      var a = Number(m[1]), b = m[2] === undefined ? a : Number(m[2]); if (b < a) throw new Error(label + ': the range ' + tok + ' runs backwards.');
      if (b > (1 << n) - 1) throw new Error(label + ': ' + b + ' is too large for ' + n + ' variable' + (n === 1 ? '' : 's') + ' (the largest is ' + ((1 << n) - 1) + ').');
      for (var q = a; q <= b; q++) if (out.indexOf(q) < 0) out.push(q);
    });
    return out.sort(function (x, y) { return x - y; });
  }
  var MINTERM_RE = /^\s*(?:[Σ∑]\s*)?(?:sum\s*)?m\s*\(([^)]*)\)\s*(?:[+,;]?\s*d\s*\(([^)]*)\))?\s*$/i;
  var NAMES = 'ABCDEF';

  function runBool(o) {
    var src = String(o.expr == null ? '' : o.expr).trim(); if (!src) return { ok: false, empty: true, field: 'expr', error: 'Enter a Boolean expression, for example A AND (B OR NOT C), or a minterm list such as m(1,3,5,7).' };
    if (src.length > 300) return { ok: false, field: 'expr', error: 'The expression is longer than 300 characters.' };
    var vars, n, vec, ast = null, on, dc = [], mode, ml = src.match(MINTERM_RE), normalized;
    if (ml) {
      mode = 'minterms';
      var nv = opt(o, 'vars', ''), need;
      try {
        var big = Math.max.apply(null, (ml[1] + ' ' + (ml[2] || '')).split(/[\s,;-]+/).filter(Boolean).map(Number).concat([0]));
        need = Math.max(1, Math.ceil(Math.log2(big + 1)));
        n = nv ? Number(nv) : Math.max(need, 2);
        if ([2, 3, 4, 5, 6].indexOf(n) < 0 && nv) return { ok: false, field: 'vars', error: 'Choose 2 to 6 variables.' };
        if (n > 6) return { ok: false, field: 'expr', error: 'A minterm list needs more than 6 variables; this tool handles up to 6.' };
        on = parseList(ml[1], n, 'm()'); dc = parseList(ml[2], n, 'd()');
      } catch (e) { return { ok: false, field: 'expr', error: e.message }; }
      var both = on.filter(function (x) { return dc.indexOf(x) >= 0; }); if (both.length) return { ok: false, field: 'expr', error: 'Minterm ' + both[0] + ' is listed as both 1 and don’t-care.' };
      vars = NAMES.slice(0, n).split(''); vec = []; for (var r0 = 0; r0 < (1 << n); r0++) vec.push(on.indexOf(r0) >= 0 ? 1 : dc.indexOf(r0) >= 0 ? 'X' : 0);
      normalized = 'Σm(' + on.join(',') + ')' + (dc.length ? ' + d(' + dc.join(',') + ')' : '');
    } else {
      mode = 'expr';
      try { ast = parseExpr(src); } catch (e) { return { ok: false, field: 'expr', error: e.message }; }
      vars = Object.keys(varsOf(ast)).sort(); n = vars.length;
      if (n > 6) return { ok: false, field: 'expr', error: 'The expression uses ' + n + ' variables (' + vars.join(', ') + '). This tool handles up to 6.' };
      var R = 1 << n, M = (1n << BigInt(R)) - 1n, V = {};
      vars.forEach(function (v, j) { var bits = 0n, i; for (i = 0; i < R; i++) if ((i >> (n - 1 - j)) & 1) bits |= 1n << BigInt(i); V[v] = bits; });
      var pv = evalBits(ast, V, M); vec = [];
      for (var i2 = 0; i2 < R; i2++) {
        var env = {}; vars.forEach(function (v, j) { env[v] = (i2 >> (n - 1 - j)) & 1; });
        var rv = evalRow(ast, env), bv = Number((pv >> BigInt(i2)) & 1n); if (rv !== bv) throw new Error('internal check failed: truth vector'); vec.push(rv);
      }
      on = []; vec.forEach(function (x, i) { if (x === 1) on.push(i); }); normalized = fmt(ast, null);
      var rt = parseExpr(normalized), same = true; Object.keys(varsOf(rt)).length; var rvv = evalBits(rt, V, M); if (rvv !== pv && n) same = false; if (!same) throw new Error('internal check failed: expression text');
    }
    var R2 = 1 << n, off = [], i;
    for (i = 0; i < R2; i++) if (vec[i] === 0) off.push(i);
    var X = function (list) { return list.length ? list.join(', ') : 'none'; };
    var res = { ok: true, op: 'bool', opName: 'Boolean expression', mode: mode, vars: vars, n: n, normalized: normalized, steps: [], notes: [], warnings: [] };
    res.rows = vec.map(function (x, i) { var inp = []; for (var j = 0; j < n; j++) inp.push((i >> (n - 1 - j)) & 1); return { i: i, inp: inp, out: x }; });
    res.minterms = on; res.maxterms = off; res.dontcares = dc; res.ones = on.length; res.zeros = off.length; res.rowsTotal = R2;
    res.constant = dc.length === 0 && on.length === R2 ? 'tautology' : (dc.length === 0 && off.length === R2 ? 'contradiction' : null);
    var lit = function (i, comp) { var s = '', j; for (j = 0; j < n; j++) { var b = (i >> (n - 1 - j)) & 1; s += vars[j] + ((comp ? b === 1 : b === 0) ? "'" : ''); } return s; };
    var litsum = function (i) { var a = [], j; for (j = 0; j < n; j++) { var b = (i >> (n - 1 - j)) & 1; a.push(vars[j] + (b ? "'" : '')); } return a.join(' + '); };
    res.canonSop = on.length ? on.map(function (m) { return lit(m, false); }).join(' + ') : '0';
    res.canonPos = off.length ? off.map(function (m) { return '(' + litsum(m) + ')'; }).join('') : '1';
    res.sigma = 'Σm(' + on.join(',') + ')' + (dc.length ? ' + d(' + dc.join(',') + ')' : ''); res.pi = 'ΠM(' + off.join(',') + ')' + (dc.length ? ' · d(' + dc.join(',') + ')' : '');
    /* simplification */
    var qOn = qmPrimes(n, on, dc), cv = on.length ? minCover(on, qOn.primes) : { chosen: [], essential: [], exact: true };
    var sopCubes = cv.chosen.map(function (p) { return p.cube; });
    for (i = 0; i < R2; i++) if (vec[i] !== 'X' && (coverEval(sopCubes, i, n) ? 1 : 0) !== vec[i]) throw new Error('internal check failed: minimal SOP');
    var qOff = qmPrimes(n, off, dc), cvO = off.length ? minCover(off, qOff.primes) : { chosen: [], essential: [], exact: true };
    var posCubes = cvO.chosen.map(function (p) { return p.cube; });
    for (i = 0; i < R2; i++) if (vec[i] !== 'X' && (coverEval(posCubes, i, n) ? 0 : 1) !== vec[i]) throw new Error('internal check failed: minimal POS');
    var nl = function (c) { return c.chosen.reduce(function (s, p) { return s + p.lits; }, 0); };
    res.minSop = { expr: sopText(cv.chosen, vars), terms: cv.chosen.length, lits: nl(cv), cubes: sopCubes, exact: cv.exact, verified: true };
    res.minPos = { expr: posText(cvO.chosen, vars), terms: cvO.chosen.length, lits: nl(cvO), cubes: posCubes, exact: cvO.exact, verified: true };
    res.primes = qOn.primes.map(function (p) { return { cube: p.cube, expr: prod(p.cube, vars), covers: p.covers, essential: cv.essential.some(function (e) { return e.cube === p.cube; }), chosen: cv.chosen.some(function (e) { return e.cube === p.cube; }) }; });
    res.exact = cv.exact && cvO.exact;
    /* intermediate columns */
    res.cols = []; if (ast) { var gn = []; gateNodes(ast, gn, {}); if (gn.length && gn.length <= 8) { var seenOut = fmt(ast, null); gn.forEach(function (g) { if (g.label === seenOut) return; var vals = []; for (var ii = 0; ii < R2; ii++) { var env2 = {}; vars.forEach(function (v, j) { env2[v] = (ii >> (n - 1 - j)) & 1; }); vals.push(evalRow(g.node, env2)); } res.cols.push({ label: g.label, vals: vals }); }); } }
    /* equivalence */
    var e2 = String(o.expr2 == null ? '' : o.expr2).trim();
    if (e2) {
      var a2; try { a2 = parseExpr(e2); } catch (e) { return { ok: false, field: 'expr2', error: 'Second expression: ' + e.message }; }
      var allv = {}; vars.forEach(function (v) { allv[v] = 1; }); Object.keys(varsOf(a2)).forEach(function (v) { allv[v] = 1; });
      var uv = Object.keys(allv).sort(), un = uv.length; if (un > 6) return { ok: false, field: 'expr2', error: 'Together the two expressions use ' + un + ' variables. The limit is 6.' };
      var diff = [], ok2 = true, skipped = 0, ri;
      for (ri = 0; ri < (1 << un); ri++) {
        var env3 = {}; uv.forEach(function (v, j) { env3[v] = (ri >> (un - 1 - j)) & 1; });
        var f1; if (mode === 'expr') f1 = evalRow(ast, env3); else { var idx = 0; vars.forEach(function (v, j) { idx |= (env3[v] || 0) << (n - 1 - j); }); f1 = vec[idx]; }
        var f2 = evalRow(a2, env3); if (f1 === 'X') { skipped++; continue; } if (f1 !== f2) { diff.push({ inp: uv.map(function (v) { return env3[v]; }), a: f1, b: f2 }); }
      }
      res.equiv = { expr2: fmt(a2, null), vars: uv, equal: diff.length === 0, diff: diff.slice(0, 16), diffCount: diff.length, skipped: skipped };
    }
    /* gate trace (expression mode only) */
    if (ast) {
      var asg = String(o.assign == null ? '' : o.assign).trim(), env4 = {}, ti = -1;
      if (asg) {
        var bm = asg.replace(/[\s,_]/g, ''), kv = asg.match(/([A-Za-z])\s*=\s*([01])/g);
        if (/^[01]+$/.test(bm) && !kv) { if (bm.length !== n) return { ok: false, field: 'assign', error: 'Enter ' + n + ' input bit' + (n === 1 ? '' : 's') + ' for ' + vars.join(', ') + ' (for example ' + vars.map(function (v, j) { return j % 2 ? 0 : 1; }).join('') + '), or write A=1, B=0.' }; vars.forEach(function (v, j) { env4[v] = Number(bm.charAt(j)); }); }
        else if (kv) { kv.forEach(function (q) { var m = q.match(/([A-Za-z])\s*=\s*([01])/); env4[m[1].toUpperCase()] = Number(m[2]); }); var miss = vars.filter(function (v) { return env4[v] === undefined; }); if (miss.length) return { ok: false, field: 'assign', error: 'No value for ' + miss.join(', ') + '. Give every variable a value, such as A=1, B=0.' }; }
        else return { ok: false, field: 'assign', error: 'Write the inputs as bits (' + vars.map(function () { return '1'; }).join('') + ') or as A=1, B=0.' };
        ti = 0; vars.forEach(function (v, j) { ti |= env4[v] << (n - 1 - j); });
      } else { ti = on.length ? on[0] : 0; vars.forEach(function (v, j) { env4[v] = (ti >> (n - 1 - j)) & 1; }); }
      var tr = tree(ast, env4); if (tr.value !== vec[ti]) throw new Error('internal check failed: gate trace');
      res.trace = { row: ti, env: env4, tree: tr, out: tr.value, nodes: [] };
      var gn2 = []; gateNodes(ast, gn2, {}); gn2.forEach(function (g) { res.trace.nodes.push({ label: g.label, value: evalRow(g.node, env4) }); });
    }
    /* working */
    var steps = res.steps;
    if (mode === 'expr') steps.push({ title: 'Read the expression', text: line('typed', src) + '\n' + line('understood as', normalized) + '\n' + line('variables', vars.join(', ') + '  (' + plural(R2, 'row') + ')') + '\nPrecedence: NOT first, then AND and NAND, then XOR and XNOR, then OR and NOR. Letters written together mean AND (AB is A AND B). Use brackets when in doubt.' });
    else steps.push({ title: 'Read the minterm list', text: line('function', normalized) + '\n' + line('variables', vars.join(', ') + '  (' + plural(R2, 'row') + '; ' + vars[0] + ' is the most significant bit)') + '\nMinterm k is the row where the inputs, read as a binary number, equal k.' });
    var hdr = vars.join(' ') + ' | F', tl = res.rows.map(function (r) { return r.inp.join(' ') + ' | ' + r.out; });
    steps.push({ title: 'Truth table', text: hdr + '\n' + tl.join('\n') + '\n' + plural(on.length, 'row') + ' give 1' + (dc.length ? ', ' + plural(dc.length, 'row') + ' are don’t-care (X)' : '') + ', ' + plural(off.length, 'row') + ' give 0.' });
    steps.push({ title: 'Minterms and maxterms', text: line('minterms (F = 1)', X(on)) + '\n' + line('maxterms (F = 0)', X(off)) + (dc.length ? '\n' + line('don’t-care', X(dc)) : '') + '\n' + line('sum of minterms', res.sigma) + '\n' + line('product of maxterms', res.pi) });
    steps.push({ title: 'Canonical forms', text: line('canonical SOP', res.canonSop) + '\n' + line('canonical POS', res.canonPos) + '\nEach minterm is an AND of every variable (a variable with a 0 in the row is complemented, written with a prime). Each maxterm is an OR of every variable (a variable with a 1 is complemented).' });
    if (on.length && off.length) {
      steps.push({ title: 'Prime implicants (Quine-McCluskey)', text: qOn.rounds.map(function (r, k) { return line('round ' + k, r.join('  ')); }).join('\n') + '\nCubes show each variable as 1, 0 or - (the variable is eliminated). A cube that cannot be combined further is a prime implicant.\n' + qOn.primes.map(function (p) { return line(p.cube, prod(p.cube, vars) + '  covers ' + p.covers.join(', ') + (cv.essential.some(function (e) { return e.cube === p.cube; }) ? '   essential' : '')); }).join('\n') });
      steps.push({ title: 'Choosing the cover', text: 'Essential prime implicants cover a minterm that no other prime implicant covers' + (cv.essential.length ? ': ' + cv.essential.map(function (p) { return p.cube; }).join(', ') + '.' : ' (there are none here).') + '\nThe rest of the cover is chosen to use the fewest terms, then the fewest literals' + (cv.exact ? ' (an exact search, so the result is minimal).' : ' (the search limit was reached, so this cover is good but not proven minimal).') });
    }
    steps.push({ title: 'Minimal forms', text: line('minimal SOP', res.minSop.expr + '   (' + plural(res.minSop.terms, 'term') + ', ' + plural(res.minSop.lits, 'literal') + ')') + '\n' + line('minimal POS', res.minPos.expr + '   (' + plural(res.minPos.terms, 'term') + ', ' + plural(res.minPos.lits, 'literal') + ')') + '\nBoth forms were checked against every row of the truth table' + (dc.length ? ' (don’t-care rows are used to simplify and are not checked)' : '') + '.' });
    if (res.equiv) steps.push({ title: 'Equivalence', text: line('first', normalized) + '\n' + line('second', res.equiv.expr2) + '\n' + (res.equiv.equal ? 'The two expressions give the same output for all ' + (1 << res.equiv.vars.length) + ' input combinations over ' + res.equiv.vars.join(', ') + ': they are equivalent.' : 'They differ in ' + plural(res.equiv.diffCount, 'row') + ' (of ' + (1 << res.equiv.vars.length) + '). First differing rows:\n' + res.equiv.diff.slice(0, 8).map(function (d) { return res.equiv.vars.join(' ') + ' = ' + d.inp.join(' ') + ': first gives ' + d.a + ', second gives ' + d.b; }).join('\n')) + (res.equiv.skipped ? '\n' + plural(res.equiv.skipped, 'don’t-care row') + ' were not compared.' : '') });
    if (res.trace) steps.push({ title: 'Gate trace for ' + vars.map(function (v) { return v + '=' + res.trace.env[v]; }).join(', '), text: res.trace.nodes.map(function (g) { return line(g.value, g.label); }).join('\n') + '\n' + line('output F', res.trace.out) + '  (row ' + res.trace.row + ' of the truth table)' });
    if (res.constant === 'tautology') res.warnings.push({ kind: 'note', text: 'This expression is always 1 (a tautology): every input combination gives 1.' });
    if (res.constant === 'contradiction') res.warnings.push({ kind: 'note', text: 'This expression is always 0 (a contradiction): no input combination gives 1.' });
    if (mode === 'expr' && vars.length < 2 && !res.constant) res.notes.push('The expression has one variable.');
    res.notes.push('Variable order is alphabetical, with ' + vars[0] + ' as the most significant bit of the row number, as in a textbook truth table.');
    res.notes.push('A prime (\') after a variable, or NOT, or ! or ~ in front of it, means the complement.');
    if (dc.length) res.notes.push('Don’t-care rows (X) were used to make the minimal forms smaller. They are your choice of 0 or 1 in the final circuit.');
    /* exports */
    res.title = 'Elecmetric Digital Logic: Boolean expression';
    res.summary = [line('function', normalized), line('variables', vars.join(', ')), line('minterms', X(on)), line('minimal SOP', res.minSop.expr), line('minimal POS', res.minPos.expr)];
    res.csv = [vars.concat(['F']).concat(res.cols.map(function (c) { return c.label; }))].concat(res.rows.map(function (r) { return r.inp.concat([r.out]).concat(res.cols.map(function (c) { return c.vals[r.i]; })); }));
    res.json = { tool: 'Elecmetric Digital Logic, Mode 05', operation: 'booleanExpression', function: normalized, variables: vars, minterms: on, maxterms: off, dontCares: dc, canonicalSop: res.canonSop, canonicalPos: res.canonPos, minimalSop: res.minSop.expr, minimalPos: res.minPos.expr, constant: res.constant, equivalent: res.equiv ? res.equiv.equal : undefined, truthTable: res.rows.map(function (r) { return { inputs: r.inp.join(''), output: r.out }; }) };
    return res;
  }

  /* ============================== operand parsing for the register tools ============================== */
  function parseValue(text, baseId, label) {
    var bd = BASES.filter(function (d) { return d[0] === baseId; })[0]; if (!bd) return { ok: false, error: 'Unknown number system.' };
    var base = bd[1], s = String(text == null ? '' : text).trim().replace(/[\s_,]/g, '');
    if (!s) return { ok: false, empty: true, error: 'Enter ' + label + '.' };
    if (/^[+\-−]/.test(s)) return { ok: false, error: label.charAt(0).toUpperCase() + label.slice(1) + ' is a bit pattern, so it takes no sign. For negative numbers use the Signed Binary Calculator.' };
    var pre = base === 2 ? /^0b/i : base === 8 ? /^0o/i : base === 16 ? /^0x/i : null; if (pre) s = s.replace(pre, '');
    if (!s) return { ok: false, error: 'Add digits after the prefix.' };
    var bad = s.match(base === 2 ? /[^01]/ : base === 8 ? /[^0-7]/ : base === 10 ? /[^0-9]/ : /[^0-9A-Fa-f]/);
    if (bad) return { ok: false, error: '‘' + bad[0] + '’ is not a ' + bd[2] + ' digit. ' + (base === 2 ? 'Binary numbers use only 0 and 1.' : base === 8 ? 'Octal numbers use only 0 to 7.' : base === 10 ? 'Decimal numbers use only 0 to 9.' : 'Hexadecimal numbers use 0 to 9 and A to F.') };
    if (s.length > 80) return { ok: false, error: 'The number has ' + s.length + ' digits. The widest value here is 64 bits.' };
    var v = BigInt((base === 2 ? '0b' : base === 8 ? '0o' : base === 16 ? '0x' : '') + s);
    return { ok: true, v: v, typedBits: base === 10 ? (v === 0n ? 1 : v.toString(2).length) : s.length * BITS[base] };
  }
  function widthOf(o, allowAuto, p) {
    var w = opt(o, 'width', '8');
    if (w === 'auto' && allowAuto) { var W = Math.max(8, Math.ceil(p.typedBits / 8) * 8); if (W > 64) return { ok: false, error: 'The value needs ' + p.v.toString(2).length + ' bits. The widest value here is 64 bits.' }; return { ok: true, W: W, auto: true }; }
    if (WIDTHS.indexOf(Number(w)) < 0) return { ok: false, error: 'Unknown bit width. Choose 4, 8, 16, 32 or 64 bits.' };
    return { ok: true, W: Number(w), auto: false };
  }
  function describe(u, W) { var b = bin(u, W); return { bin: b, grouped: g4(b), hex: lpad(u.toString(16).toUpperCase(), Math.ceil(W / 4)), oct: lpad(u.toString(8), Math.ceil(W / 3)), dec: u.toString(), msb: b.charAt(0), lsb: b.charAt(W - 1), ones: pc(b), zeros: W - pc(b) }; }
  function positions(b, ch) { var W = b.length, out = [], i; for (i = 0; i < W; i++) if (b.charAt(i) === ch) out.push(W - 1 - i); return out; }

  /* ============================== register and bit mask ============================== */
  function parseFields(txt, W) {
    var out = [], s = String(txt || '').trim(); if (!s) return { ok: true, fields: out };
    var parts = s.split(/[,;\n]+/), seen = {}, k;
    for (k = 0; k < parts.length; k++) {
      var t = parts[k].trim(); if (!t) continue;
      var m = t.match(/^([A-Za-z_][A-Za-z0-9_]{0,15})\s*(?::|\[)\s*(\d+)\s*(?:[:\-]\s*(\d+))?\s*\]?$/);
      if (!m) return { ok: false, error: 'Field ‘' + t + '’: write NAME:high:low (for example MODE:7:6) or NAME:bit (for example EN:5).' };
      var hi = Number(m[2]), lo = m[3] === undefined ? hi : Number(m[3]);
      if (hi < lo) return { ok: false, error: 'Field ' + m[1] + ': the high bit ' + hi + ' is below the low bit ' + lo + '. Write the high bit first.' };
      if (hi > W - 1) return { ok: false, error: 'Field ' + m[1] + ': bit ' + hi + ' is outside a ' + W + '-bit register (bits 0 to ' + (W - 1) + ').' };
      if (seen[m[1].toUpperCase()]) return { ok: false, error: 'The field name ' + m[1] + ' is used twice.' };
      seen[m[1].toUpperCase()] = 1; out.push({ name: m[1], hi: hi, lo: lo });
    }
    return { ok: true, fields: out };
  }
  function parseMask(txt, W) {
    var s = String(txt == null ? '' : txt).trim(); if (!s) return { ok: true, none: true };
    var pm = s.replace(/[\s_]/g, '').match(/^0([bxo])([0-9a-fA-F]+)$/i);
    if (pm) { var kind = pm[1].toLowerCase(), body = pm[2], re = kind === 'b' ? /^[01]+$/ : kind === 'o' ? /^[0-7]+$/ : /^[0-9a-fA-F]+$/; if (!re.test(body)) return { ok: false, error: 'The mask ‘' + s + '’ has a digit that does not belong to its prefix.' }; var v = BigInt('0' + kind + body); if (v > mask(W)) return { ok: false, error: 'The mask needs ' + v.toString(2).length + ' bits, but the register is ' + W + ' bits.' }; return { ok: true, u: v, how: 'pattern ' + s }; }
    var u = 0n, parts = s.split(/[,;\s]+/).filter(Boolean), k;
    for (k = 0; k < parts.length; k++) {
      var m = parts[k].match(/^(\d+)(?:[:\-](\d+))?$/); if (!m) return { ok: false, error: 'The mask ‘' + parts[k] + '’ is not a bit position, a range such as 5-7, or a pattern such as 0xF0.' };
      var a = Number(m[1]), b = m[2] === undefined ? a : Number(m[2]); if (b < a) { var t = a; a = b; b = t; }
      if (b > W - 1) return { ok: false, error: 'Bit ' + b + ' is outside a ' + W + '-bit register (bits 0 to ' + (W - 1) + ').' };
      for (var q = a; q <= b; q++) u |= 1n << BigInt(q);
    }
    return { ok: true, u: u, how: 'bit positions ' + s };
  }
  function runReg(o) {
    var pv = parseValue(o.value, opt(o, 'base', 'bin'), 'the register value'); if (!pv.ok) { pv.field = 'value'; return pv; }
    var wd = widthOf(o, true, pv); if (!wd.ok) { wd.field = 'value'; return wd; } var W = wd.W, M = mask(W);
    if (pv.v > M) return { ok: false, field: 'value', error: 'The value needs ' + pv.v.toString(2).length + ' bits, but the register is ' + W + ' bits. Choose a wider width; nothing is truncated.' };
    var pf = parseFields(o.fields, W); if (!pf.ok) { pf.field = 'fields'; return pf; }
    var pm = parseMask(o.mask, W); if (!pm.ok) { pm.field = 'mask'; return pm; }
    var act = opt(o, 'action', 'none'); if (['none', 'set', 'clear', 'toggle', 'keep'].indexOf(act) < 0) return { ok: false, error: 'Unknown mask action.' };
    if (act !== 'none' && pm.none) return { ok: false, field: 'mask', error: 'Enter a mask (bit positions such as 0,3,5-7, or a pattern such as 0xF0) to ' + act + ' bits.' };
    var u = pv.v, A = bin(u, W), d = describe(u, W), res = { ok: true, op: 'reg', opName: 'Register and bit mask', width: W, auto: wd.auto, a: d, steps: [], notes: [], warnings: [], action: act };
    var one = positions(A, '1'), zero = positions(A, '0'); res.setPos = one; res.clearPos = zero;
    var sum = one.slice().sort(function (x, y) { return y - x; }); var wsum = sum.reduce(function (s, p) { return s + (1n << BigInt(p)); }, 0n); if (wsum !== u) throw new Error('internal check failed: place values');
    res.fields = pf.fields.map(function (f) { var width = f.hi - f.lo + 1, val = (u >> BigInt(f.lo)) & mask(width), b = bin(val, width); if (bin(u, W).slice(W - 1 - f.hi, W - f.lo) !== b) throw new Error('internal check failed: field'); return { name: f.name, hi: f.hi, lo: f.lo, width: width, bin: b, hex: val.toString(16).toUpperCase(), dec: val.toString(), max: mask(width).toString() }; });
    var overlap = []; pf.fields.forEach(function (f, i) { pf.fields.forEach(function (g, j) { if (j > i && f.hi >= g.lo && g.hi >= f.lo) overlap.push(f.name + ' and ' + g.name); }); });
    if (overlap.length) res.warnings.push({ kind: 'note', text: 'These fields overlap: ' + overlap.join('; ') + '.' });
    var steps = res.steps;
    steps.push({ title: 'The register value', text: line('binary', g4(A)) + '\n' + line('decimal', d.dec) + '\n' + line('octal', d.oct) + '\n' + line('hexadecimal', d.hex) + '\n' + line('bit width', W + ' bits') + '\n' + line('MSB (bit ' + (W - 1) + ')', d.msb) + '\n' + line('LSB (bit 0)', d.lsb) });
    steps.push({ title: 'Bit positions', text: line('set (1)', one.length ? one.slice().sort(function (a, b) { return b - a; }).join(', ') : 'none') + '\n' + line('clear (0)', zero.length ? zero.slice().sort(function (a, b) { return b - a; }).join(', ') : 'none') + '\n' + (one.length ? 'Decimal value = ' + one.map(function (p) { return (1n << BigInt(p)); }).join(' + ') + ' = ' + u : 'No bit is set, so the value is 0.') });
    if (res.fields.length) steps.push({ title: 'Bit fields', text: res.fields.map(function (f) { return line(f.name, 'bits ' + (f.hi === f.lo ? f.hi : f.hi + ':' + f.lo) + ' = ' + f.bin + ' (hex ' + f.hex + ', decimal ' + f.dec + ' of 0 to ' + f.max + ')'); }).join('\n') + '\nA field is read by shifting the register right by its low bit and keeping its width in bits.' });
    var R = u;
    if (!pm.none) {
      var mk = pm.u, MB = bin(mk, W); res.mask = describe(mk, W); res.mask.how = pm.how; res.mask.positions = positions(MB, '1');
      if (act === 'none') steps.push({ title: 'The mask', text: line('mask', g4(MB)) + '\n' + line('from', pm.how) + '\n' + line('hex', res.mask.hex) + '\n' + line('bits in the mask', res.mask.positions.slice().sort(function (a, b) { return b - a; }).join(', ') || 'none') });
      else {
        R = act === 'set' ? (u | mk) : act === 'clear' ? (u & ~mk & M) : act === 'toggle' ? (u ^ mk) : (u & mk);
        var Bs = bin(R, W), i, re = '';
        for (i = 0; i < W; i++) { var x = Number(A.charAt(i)), y = Number(MB.charAt(i)); re += String(act === 'set' ? (x | y) : act === 'clear' ? (x & (1 - y)) : act === 'toggle' ? (x ^ y) : (x & y)); }
        if (re !== Bs) throw new Error('internal check failed: mask');
        var rule = { set: 'OR with the mask sets every masked bit to 1.', clear: 'AND with the inverted mask clears every masked bit to 0.', toggle: 'XOR with the mask flips every masked bit.', keep: 'AND with the mask keeps the masked bits and clears all the others (this extracts the masked bits).' }[act];
        var opn = { set: 'OR', clear: 'AND NOT', toggle: 'XOR', keep: 'AND' }[act];
        steps.push({ title: 'Apply the mask: ' + act, text: rule + '\n' + line('register', g4(A)) + '\n' + line(act === 'clear' ? 'NOT mask' : 'mask', g4(act === 'clear' ? bin(~mk & M, W) : MB)) + '\n' + line(opn, g4(Bs)) + '\n' + line('mask from', pm.how) });
        res.result = describe(R, W); res.rows = []; for (i = W - 1; i >= 0; i--) { var k = W - 1 - i; res.rows.push({ i: i, a: Number(A.charAt(k)), m: Number(MB.charAt(k)), r: Number(Bs.charAt(k)), changed: A.charAt(k) !== Bs.charAt(k) }); }
        var chg = res.rows.filter(function (r) { return r.changed; }).map(function (r) { return r.i; }); res.changed = chg;
        steps.push({ title: 'The result', text: line('binary', g4(Bs)) + '\n' + line('hex', res.result.hex) + '\n' + line('decimal', res.result.dec) + '\n' + line('bits changed', chg.length ? chg.join(', ') + ' (' + plural(chg.length, 'bit') + ')' : 'none: the register is unchanged') });
        if (!chg.length) res.notes.push('Nothing changed: the masked bits already had the value this action gives.');
        if (act === 'keep') res.notes.push('Keep (AND) extracts the masked bits. To read a field as a number, also shift it right by its low bit position.');
      }
    }
    if (wd.auto) res.notes.push('Width chosen automatically: ' + W + ' bits (the typed length rounded up to whole bytes).');
    res.notes.push('The register is shown as an unsigned bit pattern: 10101010 is 170 (hex AA, octal 252). In 8-bit two’s complement the same bits mean -86; see the Signed Binary Calculator.');
    res.title = 'Elecmetric Digital Logic: register and bit mask';
    res.summary = [line('register', d.grouped + '  (hex ' + d.hex + ', decimal ' + d.dec + ')'), line('width', W + ' bits')].concat(res.mask ? [line('mask', res.mask.grouped + '  (' + res.mask.how + ')')] : [], res.result ? [line('result (' + act + ')', res.result.grouped + '  (hex ' + res.result.hex + ')')] : []);
    res.csv = [['item', 'binary', 'hex', 'octal', 'decimal'], ['register', d.bin, d.hex, d.oct, d.dec]].concat(res.mask ? [['mask', res.mask.bin, res.mask.hex, res.mask.oct, res.mask.dec]] : [], res.result ? [['result_' + act, res.result.bin, res.result.hex, res.result.oct, res.result.dec]] : [], [[], ['bit', 'value']], A.split('').map(function (c, k) { return [W - 1 - k, c]; }), res.fields.length ? [[], ['field', 'high', 'low', 'binary', 'decimal']].concat(res.fields.map(function (f) { return [f.name, f.hi, f.lo, f.bin, f.dec]; })) : []);
    res.json = { tool: 'Elecmetric Digital Logic, Mode 05', operation: 'registerAndBitMask', bitWidth: W, register: { binary: d.bin, hex: d.hex, octal: d.oct, decimal: d.dec, msb: d.msb, lsb: d.lsb, setBits: one, clearBits: zero }, fields: res.fields.map(function (f) { return { name: f.name, high: f.hi, low: f.lo, binary: f.bin, decimal: f.dec }; }), mask: res.mask ? { binary: res.mask.bin, hex: res.mask.hex, positions: res.mask.positions } : undefined, action: act === 'none' ? undefined : act, result: res.result ? { binary: res.result.bin, hex: res.result.hex, decimal: res.result.dec, changedBits: res.changed } : undefined };
    return res;
  }

  /* ============================== parity ============================== */
  function runParity(o) {
    var mode = opt(o, 'pmode', 'generate'), kind = opt(o, 'parity', 'even'), pos = opt(o, 'ppos', 'msb');
    if (['generate', 'check'].indexOf(mode) < 0) return { ok: false, error: 'Unknown parity mode.' }; if (['even', 'odd'].indexOf(kind) < 0) return { ok: false, error: 'Choose even or odd parity.' }; if (['msb', 'lsb'].indexOf(pos) < 0) return { ok: false, error: 'Choose where the parity bit goes.' };
    var pv = parseValue(o.value, opt(o, 'base', 'bin'), mode === 'check' ? 'the received word' : 'the data word'); if (!pv.ok) { pv.field = 'value'; return pv; }
    var w = Number(opt(o, 'width', '8')); if (WIDTHS.indexOf(w) < 0) return { ok: false, error: 'Unknown data width. Choose 4, 8, 16, 32 or 64 bits.' };
    var res = { ok: true, op: 'parity', opName: 'Parity bit', pmode: mode, parity: kind, ppos: pos, dataWidth: w, steps: [], notes: [], warnings: [] }, steps = res.steps, want = kind === 'even' ? 0 : 1;
    if (mode === 'generate') {
      if (pv.v >= (1n << BigInt(w))) return { ok: false, field: 'value', error: 'The data word needs ' + pv.v.toString(2).length + ' bits, but the data width is ' + w + ' bits. Choose a wider width.' };
      var D = bin(pv.v, w), ones = pc(D), p = (ones % 2) ^ want ? 1 : 0;
      p = kind === 'even' ? ones % 2 : 1 - (ones % 2); var word = pos === 'msb' ? String(p) + D : D + String(p), tot = pc(word);
      if (tot % 2 !== want) throw new Error('internal check failed: parity');
      res.data = describe(pv.v, w); res.ones = ones; res.bit = p; res.word = { bin: word, grouped: g4(word), hex: lpad(BigInt('0b' + word).toString(16).toUpperCase(), Math.ceil((w + 1) / 4)), width: w + 1 }; res.total = tot;
      steps.push({ title: 'Count the 1 bits', text: line('data', g4(D)) + '\n' + line('number of 1s', ones + ' (' + (ones % 2 ? 'odd' : 'even') + ')') });
      steps.push({ title: (kind === 'even' ? 'Even' : 'Odd') + ' parity bit', text: (kind === 'even' ? 'Even parity makes the total number of 1s (data plus parity bit) even.' : 'Odd parity makes the total number of 1s (data plus parity bit) odd.') + '\nThe data has ' + ones + ' 1' + (ones === 1 ? '' : 's') + ', so the parity bit is ' + p + '.' });
      steps.push({ title: 'Word to transmit', text: line('parity bit', String(p) + ' (' + (pos === 'msb' ? 'placed in front, as the MSB' : 'placed at the end, as the LSB') + ')') + '\n' + line('word', g4(word) + '  (' + (w + 1) + ' bits, hex ' + res.word.hex + ')') + '\n' + line('number of 1s', tot + ' (' + (tot % 2 ? 'odd' : 'even') + ')') });
      res.summary = [line('data', g4(D)), line('parity', kind + ', bit ' + p + ' at the ' + pos.toUpperCase()), line('word', g4(word))];
      res.csv = [['item', 'binary', 'hex'], ['data', D, res.data.hex], ['parity_bit', String(p), ''], ['word', word, res.word.hex]];
      res.json = { tool: 'Elecmetric Digital Logic, Mode 05', operation: 'parityGenerate', parity: kind, position: pos, data: D, onesInData: ones, parityBit: p, word: word };
    } else {
      var Wn = w + 1; if (pv.v >= (1n << BigInt(Wn))) return { ok: false, field: 'value', error: 'The received word needs ' + pv.v.toString(2).length + ' bits, but data width ' + w + ' plus the parity bit is ' + Wn + ' bits. Choose a wider data width.' };
      var Rw = bin(pv.v, Wn), pb = pos === 'msb' ? Rw.charAt(0) : Rw.charAt(Wn - 1), dat = pos === 'msb' ? Rw.slice(1) : Rw.slice(0, w), tt = pc(Rw), okp = tt % 2 === want, exp = kind === 'even' ? pc(dat) % 2 : 1 - (pc(dat) % 2);
      if (okp !== (Number(pb) === exp)) throw new Error('internal check failed: parity check');
      res.word = { bin: Rw, grouped: g4(Rw), width: Wn }; res.data = describe(BigInt('0b' + dat), w); res.bit = Number(pb); res.expected = exp; res.total = tt; res.pass = okp;
      steps.push({ title: 'Split the received word', text: line('word', g4(Rw) + '  (' + Wn + ' bits)') + '\n' + line('parity bit', pb + ' (' + (pos === 'msb' ? 'the MSB' : 'the LSB') + ')') + '\n' + line('data', g4(dat)) });
      steps.push({ title: 'Count the 1 bits', text: line('data 1s', pc(dat) + ' (' + (pc(dat) % 2 ? 'odd' : 'even') + ')') + '\n' + line('expected parity bit', exp + ' for ' + kind + ' parity') + '\n' + line('total 1s', tt + ' (' + (tt % 2 ? 'odd' : 'even') + ')') });
      steps.push({ title: 'Verdict', text: okp ? 'The total number of 1s is ' + (want ? 'odd' : 'even') + ', as ' + kind + ' parity requires: the parity check passes.' : 'The total number of 1s is ' + (tt % 2 ? 'odd' : 'even') + ', but ' + kind + ' parity requires ' + (want ? 'odd' : 'even') + ': the parity check fails, so at least one bit has been received wrongly.' });
      if (!okp) res.warnings.push({ kind: 'note', text: 'Parity check failed: an odd number of bits are wrong. Parity cannot say which bit.' });
      res.summary = [line('received', g4(Rw)), line('parity', kind + ', bit ' + pb + ', expected ' + exp), line('verdict', okp ? 'passes' : 'fails')];
      res.csv = [['item', 'value'], ['received', Rw], ['parity_bit', pb], ['expected_parity_bit', exp], ['total_ones', tt], ['result', okp ? 'pass' : 'fail']];
      res.json = { tool: 'Elecmetric Digital Logic, Mode 05', operation: 'parityCheck', parity: kind, position: pos, received: Rw, parityBit: Number(pb), expectedParityBit: exp, totalOnes: tt, passes: okp };
    }
    res.notes.push('A single parity bit detects any odd number of flipped bits (1, 3, 5, ...) but misses an even number (2, 4, ...) and cannot correct anything.');
    res.title = 'Elecmetric Digital Logic: parity bit';
    return res;
  }

  /* ============================== data grouping ============================== */
  function runGroup(o) {
    var pv = parseValue(o.value, opt(o, 'base', 'hex'), 'the value'); if (!pv.ok) { pv.field = 'value'; return pv; }
    var wd = widthOf({ width: opt(o, 'width', 'auto') }, true, pv); if (!wd.ok) { wd.field = 'value'; return wd; } var W = wd.W;
    if (pv.v > mask(W)) return { ok: false, field: 'value', error: 'The value needs ' + pv.v.toString(2).length + ' bits, but the width is ' + W + ' bits. Choose a wider width; nothing is truncated.' };
    var A = bin(pv.v, W), d = describe(pv.v, W), res = { ok: true, op: 'group', opName: 'Data grouping', width: W, auto: wd.auto, a: d, steps: [], notes: [], warnings: [] };
    function split(n) { var out = [], i; for (i = 0; i < W; i += n) out.push(A.slice(i, i + n)); return out; }
    var nib = split(4), byt = split(8), words = W >= 16 ? split(16) : [], dws = W >= 32 ? split(32) : [], qws = W >= 64 ? split(64) : [];
    var hx = function (b) { return lpad(BigInt('0b' + b).toString(16).toUpperCase(), Math.ceil(b.length / 4)); };
    res.nibbles = nib.map(function (b) { return { bin: b, hex: hx(b), dec: parseInt(b, 2) }; }); res.bytes = byt.map(function (b, i) { return { bin: b, hex: hx(b), dec: parseInt(b, 2), index: byt.length - 1 - i }; });
    res.words = words.map(function (b) { return { bin: b, hex: hx(b), dec: BigInt('0b' + b).toString() }; }); res.dwords = dws.map(function (b) { return { bin: b, hex: hx(b), dec: BigInt('0b' + b).toString() }; });
    res.big = res.bytes.map(function (b) { return b.hex; }); res.little = res.bytes.slice().reverse().map(function (b) { return b.hex; });
    if (res.big.join('') !== d.hex) throw new Error('internal check failed: grouping');
    var back = BigInt('0x' + res.little.slice().reverse().join('')); if (back !== pv.v) throw new Error('internal check failed: byte order');
    var steps = res.steps;
    steps.push({ title: 'The value', text: line('binary', A) + '\n' + line('decimal', d.dec) + '\n' + line('hexadecimal', d.hex) + '\n' + line('width', W + ' bits = ' + plural(W / 8, 'byte') + ' = ' + plural(W / 4, 'nibble')) });
    steps.push({ title: 'Nibbles (4 bits)', text: res.nibbles.map(function (x, i) { return line('nibble ' + (nib.length - 1 - i), x.bin + ' = ' + x.hex); }).join('\n') });
    steps.push({ title: 'Bytes (8 bits)', text: res.bytes.map(function (x) { return line('byte ' + x.index, g4(x.bin) + ' = ' + x.hex + ' (' + x.dec + ')'); }).join('\n') });
    if (words.length) steps.push({ title: 'Words (16 bits)', text: res.words.map(function (x, i) { return line('word ' + (words.length - 1 - i), g4(x.bin) + ' = ' + x.hex); }).join('\n') });
    if (dws.length) steps.push({ title: 'Double words (32 bits)', text: res.dwords.map(function (x, i) { return line('dword ' + (dws.length - 1 - i), x.hex + ' (' + x.dec + ')'); }).join('\n') });
    steps.push({ title: 'Byte order in memory', text: line('big-endian', res.big.join(' ') + '  (most significant byte first)') + '\n' + line('little-endian', res.little.join(' ') + '  (least significant byte first)') + '\nBig-endian is the order written on paper and used on networks. Little-endian is used by x86 and most ARM systems.' });
    if (wd.auto) res.notes.push('Width chosen automatically: ' + W + ' bits (the typed length rounded up to whole bytes). Choose a width to pad with leading zeros.');
    res.title = 'Elecmetric Digital Logic: data grouping';
    res.summary = [line('value', d.grouped + '  (hex ' + d.hex + ', decimal ' + d.dec + ')'), line('width', W + ' bits'), line('big-endian', res.big.join(' ')), line('little-endian', res.little.join(' '))];
    res.csv = [['group', 'index', 'binary', 'hex']].concat(res.nibbles.map(function (x, i) { return ['nibble', nib.length - 1 - i, x.bin, x.hex]; }), res.bytes.map(function (x) { return ['byte', x.index, x.bin, x.hex]; }), res.words.map(function (x, i) { return ['word', words.length - 1 - i, x.bin, x.hex]; }), res.dwords.map(function (x, i) { return ['dword', dws.length - 1 - i, x.bin, x.hex]; }));
    res.json = { tool: 'Elecmetric Digital Logic, Mode 05', operation: 'dataGrouping', bitWidth: W, binary: A, hex: d.hex, decimal: d.dec, nibbles: res.nibbles.map(function (x) { return x.bin; }), bytes: res.bytes.map(function (x) { return x.bin; }), words: res.words.map(function (x) { return x.bin; }), bigEndianBytes: res.big, littleEndianBytes: res.little };
    return res;
  }

  function run(o) {
    o = o || {}; var op = opt(o, 'op', 'bool');
    try {
      if (op === 'bool') return runBool(o); if (op === 'reg') return runReg(o); if (op === 'parity') return runParity(o); if (op === 'group') return runGroup(o);
    } catch (e) { if (/^internal check failed/.test(e.message)) throw e; return { ok: false, error: e.message }; }
    return { ok: false, error: 'Unknown tool.' };
  }
  function exportTxt(r) { var L = [r.title, ''].concat(r.summary); r.warnings.forEach(function (w) { L.push('Note: ' + w.text); }); L.push(''); L.push('Working'); r.steps.forEach(function (s) { L.push(''); L.push(s.title); L.push(s.text); }); return L.join('\n') + '\n'; }
  function exportCsv(r) { return r.csv.map(function (x) { return x.map(csvq).join(','); }).join('\n') + '\n'; }
  function exportJson(r) { return JSON.stringify(r.json, null, 2) + '\n'; }

  var api = { OPS: OPS, BASES: BASES, WIDTHS: WIDTHS, run: run, parseExpr: parseExpr, fmt: fmt, exportTxt: exportTxt, exportCsv: exportCsv, exportJson: exportJson };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DigiLogic = api;
})(typeof window !== 'undefined' ? window : this);
