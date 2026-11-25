/* Runs tools/decomp_engine.js over tests/decomp_cases.json and writes raw numeric results to tests/decomp_out.json.
   tests/verify_decomp.py then checks them independently with numpy/scipy. Run: node tests/decomp_run.js */
const D = require('../tools/decomp_engine.js'), fs = require('fs'), path = require('path');
const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'decomp_cases.json'), 'utf8'));
const clean = (x) => (typeof x === 'number' && !isFinite(x) ? null : x);
const cx = (M) => M.map((r) => r.map((z) => [z.r, z.i]));
const out = cases.map((c) => {
  const A = c.A, m = A.length, n = A[0].length, o = { kind: c.kind };
  try { if (m === n) { const r = D.lu(A); o.lu = { P: r.P, L: r.L, U: r.U, det: r.det }; } } catch (e) { o.lu_err = String(e); }
  try { const r = D.qr(A); o.qr = { Q: r.Q, R: r.R }; } catch (e) { o.qr_err = String(e); }
  try { if (m === n) { const r = D.cholesky(A); o.chol = r.error ? { error: r.error } : { L: r.L }; } } catch (e) { o.chol_err = String(e); }
  try { const r = D.svd(A); o.svd = { U: r.U, S: r.S, V: r.V }; const p = D.pinv(A); o.pinv = p.X; } catch (e) { o.svd_err = String(e); }
  try { if (m === n) { const r = D.calc({ op: 'eig', A: A.map((x) => x.map(String)) }); o.eig_ok = r.ok; o.eig_status = r.status; o.eig_err = r.error; o.eig_checks = r.checks && r.checks.map((k) => [k.label, k.value, k.state]); const g = D.eigGeneral(A); if (!g.error) o.eigGeneral = { values: g.values.map((z) => [z.r, z.i]), vectors: g.vectors.map((v) => v.map((z) => [z.r, z.i])) }; const sy = D.eigSym(A); o.eigSym = { values: sy.values, vectors: sy.vectors }; const s = D.schur(A); if (!s.error) o.schur = { T: cx(s.T), Q: cx(s.Q) }; else o.schur_err = s.error; } } catch (e) { o.eig_exc = String(e); }
  try { if (c.b) { const r = D.calc({ op: 'lstsq', A: A.map((x) => x.map(String)), B: c.b.map((x) => x.map(String)) }); o.lstsq = { ok: r.ok, error: r.error, copy: r.copy, status: r.status, lines: r.lines }; } } catch (e) { o.lstsq_exc = String(e); }
  // end-to-end calc() on every op for status
  o.calc = {}; ['lu', 'qr', 'chol', 'svd', 'eig', 'schur', 'pinv', 'cond'].forEach((op) => { try { const r = D.calc({ op, A: A.map((x) => x.map(String)) }); o.calc[op] = { ok: r.ok, status: r.status, error: r.error, checks: r.checks && r.checks.map((k) => [k.value, k.state]) }; } catch (e) { o.calc[op] = { exc: String(e) }; } });
  return o;
});
fs.writeFileSync(path.join(__dirname, 'decomp_out.json'), JSON.stringify(out, (k, v) => clean(v)));
console.log('ran', out.length, 'cases');
