#!/usr/bin/env node
// Evaluates the arithmetic lines in each calculator page's Worked example ("name = expr = result unit")
// and reports lines whose expression does not give the stated result, allowing a unit scaling (kW/W, %/fraction). Read-only.
'use strict';
const fs = require('fs'), path = require('path');
const dec = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
const sup = { '²': 2, '³': 3, '⁻¹': -1, '⁻²': -2, '⁴': 4 };
function toJS(e) {
  let s = e.replace(/,(?=\d{3}\b)/g, '').replace(/[×·]/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/π/g, 'Math.PI').replace(/\s+/g, ' ');
  s = s.replace(/\)(⁻¹|⁻²|²|³|⁴)/g, (m, p) => ')**' + sup[p]).replace(/(\d)(⁻¹|⁻²|²|³|⁴)/g, (m, d, p) => d + '**' + sup[p]);
  s = s.replace(/√\s*\(/g, 'Math.sqrt(').replace(/√\s*([\d.]+)/g, 'Math.sqrt($1)').replace(/\^/g, '**');
  if (/[^0-9eE+\-*/().\s,MathPIsqrt*]/.test(s.replace(/Math\.(PI|sqrt)/g, ''))) return null;
  return s;
}
const root = path.join(__dirname, '..', 'calculators'); let pages = 0, lines = 0, bad = [];
for (const d of fs.readdirSync(root)) {
  const f = path.join(root, d, 'index.html'); if (!fs.existsSync(f)) continue;
  const s = fs.readFileSync(f, 'utf8'); const m = s.match(/<section[^>]*id="example"[^>]*>([\s\S]*?)<\/section>/); if (!m) continue;
  const txt = dec(m[1].replace(/<\/(p|div|li|tr)>/g, '\n').replace(/<[^>]+>/g, ' ')); let n = 0;
  for (const raw of txt.split('\n')) {
    const parts = raw.split(' = ').map((x) => x.trim()); if (parts.length < 3) continue;
    const res = parseFloat(parts[parts.length - 1].replace(/,/g, '').replace(/−/g, '-')); if (isNaN(res)) continue;
    const js = toJS(parts[parts.length - 2]); if (!js) continue; let v; try { v = Function('return (' + js + ')')(); } catch (e) { continue; } if (typeof v !== 'number' || !isFinite(v)) continue;
    n++; lines++; const tol = Math.max(Math.abs(res) * 0.006, 0.51 * Math.pow(10, -((parts[parts.length - 1].replace(/,/g, '').match(/\.(\d+)/) || ['', ''])[1].length)));
    const scaled = res !== 0 && v !== 0 && [-9, -6, -3, -2, 2, 3, 6, 9].some((k) => Math.abs(v * Math.pow(10, k) - res) <= Math.max(Math.abs(res) * 0.006, tol)); // a unit change (W to kW, fraction to %)
    if (Math.abs(v - res) > tol && !scaled) bad.push(d + ': ' + parts.slice(-2).join(' = ').slice(0, 110) + ' (evaluates to ' + +v.toPrecision(6) + ')');
  }
  if (n) pages++;
}
console.log('pages with checkable lines', pages, ', lines', lines, ', mismatches', bad.length); bad.slice(0, 40).forEach((b) => console.log(b));
