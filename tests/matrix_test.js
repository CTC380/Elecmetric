/* Tests for tools/matrix_engine.js against tests/matrix_vectors.json (independent: gen_matrix_vectors.py) and the fixed cases in the product note. */
const M = require('../tools/matrix_engine.js'), V = require('./matrix_vectors.json');
let fail = 0, n = 0; const bad = (m) => { fail++; if (fail < 15) console.log('FAIL ' + m); };
const eq = (a, b, m) => { n++; if (String(a) !== String(b)) bad(m + ': ' + a + ' vs ' + b); };
const g = (s) => s.map((r) => r.map((x) => String(x)));
V.forEach((v, t) => {
  eq(JSON.stringify(M.calc({ op: 'add', A: v.A, B: v.B2 }).text), JSON.stringify(v.add), 'add #' + t);
  eq(JSON.stringify(M.calc({ op: 'sub', A: v.A, B: v.B2 }).text), JSON.stringify(v.sub), 'sub #' + t);
  eq(JSON.stringify(M.calc({ op: 'mul', A: v.A, B: v.B }).text), JSON.stringify(v.mul), 'mul #' + t);
  eq(JSON.stringify(M.calc({ op: 'scale', A: v.A, k: v.k }).text), JSON.stringify(v.scale), 'scale #' + t);
  eq(JSON.stringify(M.calc({ op: 'transpose', A: v.A }).text), JSON.stringify(v.tr), 'transpose #' + t);
  eq(JSON.stringify(M.calc({ op: 'power', A: v.sq, n: String(v.n) }).text), JSON.stringify(v.pow), 'power #' + t);
});
const A = g([[1, 2], [3, 4]]), B = g([[5, 6], [7, 8]]), c = (o) => M.calc(Object.assign({ A, B }, o));
eq(JSON.stringify(c({ op: 'add' }).text), '[["6","8"],["10","12"]]', 'A+B'); eq(JSON.stringify(c({ op: 'sub' }).text), '[["-4","-4"],["-4","-4"]]', 'A-B');
eq(JSON.stringify(c({ op: 'mul' }).text), '[["19","22"],["43","50"]]', 'AB'); eq(JSON.stringify(c({ op: 'transpose' }).text), '[["1","3"],["2","4"]]', 'AT'); eq(JSON.stringify(c({ op: 'power', n: '2' }).text), '[["7","10"],["15","22"]]', 'A^2');
eq(c({ op: 'mul' }).steps[1], 'C[1,1] = (1)(5) + (2)(7) = 19', 'mul working');
const r23 = g([[1, 2, 3], [4, 5, 6]]), r32 = g([[1, 2], [3, 4], [5, 6]]);
eq(M.calc({ op: 'mul', A: r23, B: r32 }).ok, true, '2x3 times 3x2'); eq(M.calc({ op: 'mul', A: r23, B: r32 }).rows + 'x' + M.calc({ op: 'mul', A: r23, B: r32 }).cols, '2x2', '2x3 times 3x2 shape'); eq(M.calc({ op: 'mul', A: r23, B: r23 }).ok, false, '2x3 times 2x3');
eq(M.calc({ op: 'add', A: r23, B: r32 }).ok, false, '2x3 plus 3x2'); eq(M.calc({ op: 'power', A: r23, n: '2' }).ok, false, 'power of non-square'); eq(M.calc({ op: 'power', A, n: '0' }).text.join(), '1,0,0,1', 'A^0 identity');
eq(JSON.stringify(M.calc({ op: 'power', A, n: '-1' }).text), '[["-2","1"],["3/2","-1/2"]]', 'A^-1'); eq(M.calc({ op: 'power', A: [['1', '2'], ['2', '4']], n: '-1' }).ok, false, 'singular negative power'); eq(M.calc({ op: 'power', A, n: '-21' }).ok, false, 'negative power above limit'); eq(M.calc({ op: 'power', A, n: '2.5' }).ok, false, 'fractional power'); eq(M.calc({ op: 'power', A, n: '21' }).ok, false, 'power above limit');
eq(M.calc({ op: 'add', A: [['1/2']], B: [['1/3']] }).text[0][0], '5/6', '1/2+1/3'); eq(M.calc({ op: 'add', A: [['0.1']], B: [['0.2']] }).text[0][0], '3/10', '0.1+0.2 exact'); eq(M.calc({ op: 'add', A: [['0.1']], B: [['0.2']] }).dec[0][0], '0.3', '0.1+0.2 decimal');
eq(M.calc({ op: 'add', A: [['\u22123']], B: [['1']] }).text[0][0], '-2', 'unicode minus'); eq(M.calc({ op: 'add', A: [['1/0']], B: [['1']] }).ok, false, 'division by zero'); eq(M.calc({ op: 'add', A: [['x']], B: [['1']] }).cell.join(), 'A,0,0', 'bad cell located');
eq(M.calc({ op: 'add', A: [['']], B: [['1']] }).ok, false, 'empty cell'); eq(M.calc({ op: 'scale', A, k: '' }).ok, false, 'empty k'); eq(M.calc({ op: 'scale', A, k: '-1/2' }).text.join(), '-1/2,-1,-3/2,-2', 'k = -1/2');
eq(M.calc({ op: 'add', A: [['1/3']], B: [['1/3']] }).dec[0][0], '0.666667', 'rounding'); eq(M.calc({ op: 'add', A: [['1/3']], B: [['-1/3']] }).text[0][0], '0', 'cancels to 0'); eq(M.calc({ op: 'add', A: [['-1/3']], B: [['0']] }).dec[0][0], '-0.333333', 'negative decimal');
eq(M.calc({ op: 'add', A: [['99999999999999999999']], B: [['1']] }).text[0][0], '100000000000000000000', 'big integer exact');
/* ---- Mode 02 ---- */
const V2 = require('./matrix2_vectors.json'), J = JSON.stringify;
V2.sq.forEach((v, t) => {
  eq(M.calc({ op: 'det', A: v.A }).scalar[0].text, v.det, 'det #' + t); eq(M.calc({ op: 'trace', A: v.A }).scalar[0].text, v.tr, 'trace #' + t); eq(M.calc({ op: 'rank', A: v.A }).scalar[0].text, v.rank, 'rank #' + t);
  eq(J(M.calc({ op: 'minor', A: v.A }).text), J(v.minor), 'minor #' + t); eq(J(M.calc({ op: 'cof', A: v.A }).text), J(v.cof), 'cofactor #' + t); eq(J(M.calc({ op: 'adj', A: v.A }).text), J(v.adj), 'adjugate #' + t);
  const iv = M.calc({ op: 'inv', A: v.A }); if (v.inv === null) { eq(iv.ok, false, 'singular rejected #' + t); eq(iv.singular, true, 'singular flag #' + t); } else { eq(J(iv.text), J(v.inv), 'inverse #' + t); const pr = M.calc({ op: 'mul', A: v.A, B: iv.text }); eq(pr.text.every((r, i) => r.every((x, j) => x === (i === j ? '1' : '0'))), true, 'A times inverse is I #' + t); }
});
V2.rect.forEach((v, t) => eq(M.calc({ op: 'rank', A: v.A }).scalar[0].text, v.rank, 'rank rect #' + t));
eq(M.calc({ op: 'det', A }).scalar[0].text, '-2', 'det [[1,2],[3,4]]'); eq(M.calc({ op: 'rank', A: [['1', '2'], ['2', '4']] }).scalar[0].text, '1', 'rank [[1,2],[2,4]]'); eq(M.calc({ op: 'inv', A: [['1', '2'], ['2', '4']] }).ok, false, 'singular inverse is an error');
eq(J(M.calc({ op: 'inv', A }).text), '[["-2","1"],["3/2","-1/2"]]', 'inverse of A'); eq(M.calc({ op: 'det', A: r23 }).ok, false, 'det of 2x3'); eq(M.calc({ op: 'inv', A: r23 }).ok, false, 'inverse of 2x3'); eq(M.calc({ op: 'trace', A: r23 }).ok, false, 'trace of 2x3');
eq(M.calc({ op: 'norm', A }).scalar.map((x) => x.dec).join(), '6,7,5.477226', 'norms'); eq(M.calc({ op: 'det', A: [['0.1', '0.2'], ['0.3', '0.4']] }).scalar[0].text, '-1/50', 'decimal det exact');
const hil = [[1, 2, 3].map((j) => '1/' + j), [2, 3, 4].map((j) => '1/' + j), [3, 4, 5].map((j) => '1/' + j)]; eq(M.calc({ op: 'det', A: hil }).scalar[0].text, '1/2160', 'Hilbert 3x3 det'); eq(M.calc({ op: 'inv', A: hil }).steps.join(' ').indexOf('Condition number') >= 0, true, 'condition reported'); eq(M.calc({ op: 'inv', A: [['1', '1'], ['1', '1.0000000001']] }).steps.join(' ').indexOf('ill-conditioned') >= 0, true, 'ill-conditioned flagged'); eq(M.calc({ op: 'inv', A: [['1', '1'], ['1', '1.0000000001']] }).ok, true, 'near-singular is not called singular');
/* ---- Mode 03 ---- */
const V3 = require('./matrix3_vectors.json'), METH = ['gj', 'gauss', 'cramer', 'lu'];
let nUniq = 0, nInf = 0, nNone = 0, nCr = 0;
V3.forEach((v, t) => {
  const allU = v.types.every((x) => x === 'unique');
  METH.forEach((m) => {
    const r = M.calc({ op: 'solve-' + m, A: v.A, B: v.B }), tag = m + ' #' + t;
    if ((m === 'cramer' || m === 'lu') && !(v.square && v.rank === v.n)) { eq(r.ok, false, tag + ' refused for singular or non-square'); return; }
    eq(r.ok, true, tag + ' ok'); if (!r.ok) return;
    eq(J(r.sol.map((c) => c.type)), J(v.types), tag + ' types');
    r.sol.forEach((c, j) => {
      if (c.type === 'unique') { eq(J(c.x), J(v.X0.map((row) => row[j])), tag + ' x col ' + j); nUniq++; if (m === 'cramer') nCr++; }
      if (c.type === 'infinite') { nInf++;
        const col = (arr) => arr.map((x) => [x]), b = v.B.map((row) => [row[j]]), pr = M.calc({ op: 'mul', A: v.A, B: col(c.particular) });
        eq(J(pr.text), J(b), tag + ' particular solution satisfies AX=b'); eq(c.basis.length, v.n - v.rank, tag + ' free variable count');
        c.basis.forEach((bv, q) => eq(M.calc({ op: 'mul', A: v.A, B: col(bv) }).text.every((row) => row[0] === '0'), true, tag + ' null vector ' + q + ' gives A v = 0')); }
      if (c.type === 'none') nNone++; });
    if (allU) eq(J(r.text), J(v.X0), tag + ' X matrix'); else eq(r.text, undefined, tag + ' no X when not unique');
  });
  const rf = M.calc({ op: 'rref', A: v.A }), rg = M.calc({ op: 'ref', A: v.A }); eq(rf.lines[1], 'rank(A) = ' + v.rank, 'rref rank #' + t); eq(rg.lines[1], 'rank(A) = ' + v.rank, 'ref rank #' + t);
  eq(rf.text.filter((row) => row.some((x) => x !== '0')).length, v.rank, 'rref non-zero rows #' + t);
});
const d2 = [['2', '1'], ['1', '3']], b2 = [['5'], ['7']];
METH.forEach((m) => eq(J(M.calc({ op: 'solve-' + m, A: d2, B: b2 }).text), '[["8/5"],["9/5"]]', 'note example 2x+y=5, x+3y=7 via ' + m));
eq(M.calc({ op: 'solve-gj', A: d2, B: b2 }).lines[0], 'x\u2081 = 8/5  \u2248 1.6', 'x = 1.6 shown'); eq(M.calc({ op: 'solve-gj', A: d2, B: [['5'], ['7'], ['9']] }).ok, false, 'row count mismatch');
eq(M.calc({ op: 'solve-gj', A: [['1', '1'], ['2', '2']], B: [['2'], ['5']] }).status, 'No solution', 'inconsistent system'); eq(M.calc({ op: 'solve-gj', A: [['1', '1'], ['2', '2']], B: [['2'], ['4']] }).status, 'Infinitely many solutions', 'dependent system');
eq(M.calc({ op: 'solve-gj', A: [['0', '1'], ['1', '0']], B: [['3'], ['4']] }).text.join(), '4,3', 'needs a row swap'); eq(M.calc({ op: 'solve-lu', A: [['0', '1'], ['1', '0']], B: [['3'], ['4']] }).text.join(), '4,3', 'LU pivots past a zero');
eq(M.calc({ op: 'solve-gj', A: d2, B: [['x'], ['7']] }).cell.join(), 'B,0,0', 'bad B cell located'); eq(M.calc({ op: 'solve-gj', A: [['1', '2', '3']], B: [['6']] }).status, 'Infinitely many solutions', 'underdetermined');
eq(M.calc({ op: 'solve-gj', A: [['1'], ['2'], ['3']], B: [['1'], ['2'], ['3']] }).status, 'Unique solution', 'overdetermined but consistent'); eq(M.calc({ op: 'solve-gj', A: [['1'], ['2']], B: [['1'], ['3']] }).status, 'No solution', 'overdetermined inconsistent');
eq(M.calc({ op: 'solve-lu', A: d2, B: b2 }).steps.join(' ').indexOf('PA = LU holds exactly') >= 0, true, 'LU check reported');
console.log('mode 03 coverage: ' + nUniq + ' unique, ' + nInf + ' infinite, ' + nNone + ' inconsistent columns; ' + nCr + ' Cramer');
console.log(n + ' checks, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
