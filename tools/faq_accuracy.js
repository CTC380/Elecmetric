#!/usr/bin/env node
// Adds calculator-specific facts to the "How accurate are the results?" FAQ answer:
//  - the relative tolerance the page's reference cases are held to (from tests/reference_vectors.json)
//  - a pointer to the page's own "Limits of this calculator" section
// Only touches answers that already quote "N reference cases" where N equals the vector count for the page's id.
// Safe to run twice. Usage: node tools/faq_accuracy.js [--check]
'use strict';
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), check = process.argv.includes('--check');
const vec = JSON.parse(fs.readFileSync(path.join(root, 'tests', 'reference_vectors.json'), 'utf8'));
const by = {}; vec.forEach((v) => (by[v.id] = by[v.id] || []).push(v.tol));
const sup = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const fmt = (t) => { const [m, e] = t.toExponential().split('e'); return m + '×10' + String(+e).split('').map((c) => sup[c]).join(''); };
const dec = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const enc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function tolSentence(tols) {
  const mx = Math.max(...tols), n = tols.length;
  if (mx === 0) return 'Each one matches exactly.';
  const tight = tols.filter((t) => t < mx).length;
  let s = 'Each result is compared with a relative tolerance of ' + fmt(mx) + ' or tighter';
  if (tight > 0) s += ' (' + tight + ' of the ' + n + ' are held to a tighter limit)'; return s + '.';
}
const re = /(<h3[^>]*>\s*How accurate are the results\?\s*<\/h3>\s*<p[^>]*>)([\s\S]*?)(<\/p>)/;
function walk(d, o = []) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.name.startsWith('.') || e.name === 'node_modules') continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p, o); else if (/index\.html$/.test(e.name) && p.includes(path.sep + 'calculators' + path.sep)) o.push(p); } return o; }
let changed = 0, skipped = 0, same = 0;
for (const f of walk(root)) {
  let s = fs.readFileSync(f, 'utf8'); const lk = s.match(/index\.html#([a-z0-9-]+)"[^>]*>Open in the calculator/); const slug = lk ? lk[1] : path.basename(path.dirname(f)); const m = s.match(re); if (!m) continue;
  const n = m[2].match(/(\d[\d,]*) reference cases/); const t = by[slug];
  if (!n || !t || +n[1].replace(/,/g, '') !== t.length) { skipped++; continue; }
  if (m[2].includes('relative tolerance of') || m[2].includes('Each one matches exactly')) { same++; continue; }
  const limS = /<section class="calc-limit">/.test(s) ? ' What limits how far a result can be relied on is set out under “Limits of this calculator” on this page.' : '';
  const add = ' ' + tolSentence(t) + limS;
  const marker = 'agree with this calculator.';
  if (!m[2].includes(marker)) { skipped++; continue; }
  const out = m[2].replace(marker, marker + enc(add));
  changed++; if (!check) fs.writeFileSync(f, s.replace(re, (_, a, b, c) => a + out + c));
}
console.log((check ? 'would change ' : 'changed ') + changed + ', already done ' + same + ', skipped ' + skipped);
