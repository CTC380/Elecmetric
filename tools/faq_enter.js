#!/usr/bin/env node
// Rewrites the "What do I need to enter?" FAQ answer from each page's own try-form.
// Fixes: labels with commas joined badly, acronyms lower-cased ("sWG"), the unit-selector
// sentence on pages with no unit selector, and 12-appliance-style repeated groups.
// Safe to run twice. Usage: node tools/faq_enter.js [--check]
'use strict';
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), check = process.argv.includes('--check');
const dec = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const enc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const lc = (l) => { const w = l.split(/[\s,]/)[0]; return /^[A-Z]{2,}|^[A-Z][a-z]*[A-Z]/.test(w) || /^[a-z]/.test(w) ? l : l.charAt(0).toLowerCase() + l.slice(1); };
const GROUP = /^(Appliance|Group|Load|Source) (\d+)(\s*\([^)]*\))?:\s*/;
function labels(form) {
  const out = [], seen = new Set(), groups = {};
  for (const m of form.matchAll(/<label[^>]*>([\s\S]*?)<\/label>/g)) {
    const t = dec(m[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim(); if (!t) continue;
    const g = t.match(GROUP);
    if (g) { const key = g[1]; const rest = t.replace(GROUP, ''); groups[key] = groups[key] || { n: new Set(), items: [] }; groups[key].n.add(g[2]); if (g[2] === [...groups[key].n][0]) groups[key].items.push(rest); if (!seen.has('G' + key)) { seen.add('G' + key); out.push({ group: key }); } continue; }
    if (seen.has(t)) continue; seen.add(t); out.push({ t });
  }
  return out.map((o) => o.group ? { t: o.group + 's, each with: ' + groups[o.group].items.map(lc).join('; ') + ' (' + groups[o.group].n.size + ' ' + o.group.toLowerCase() + 's available)', big: true } : o);
}
function build(old, form) {
  const items = labels(form); if (!items.length) return null;
  if (items.length === 2 && items[0].t === 'The value you know' && items[1].t === 'Value') return 'Choose which measurement you know (radius, diameter, circumference or area), then enter its value. The other measurements are calculated from it.';
  const parts = items.map((o) => o.t.startsWith && o.big ? o.t : lc(o.t));
  const comma = parts.some((p) => p.includes(',')) || items.some((o) => o.big);
  let s;
  if (parts.length === 1) s = parts[0];
  else if (comma) s = parts.slice(0, -1).join('; ') + '; and ' + parts[parts.length - 1];
  else s = parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
  let a = 'Enter ' + s + '.';
  if (/Leave blank the value you want to find, and the form solves for it\./.test(old)) a += ' Leave blank the value you want to find, and the form solves for it.';
  if (/name="[^"]+_u"/.test(form)) a += ' Change the unit of a value with its selector and the result stays the same.';
  return a;
}
function walk(d, o = []) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.name === 'node_modules' || e.name.startsWith('.')) continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p, o); else if (e.name.endsWith('.html')) o.push(p); } return o; }
const re = /(<h3[^>]*>\s*What do I need to enter\?\s*<\/h3>\s*<p[^>]*>)([\s\S]*?)(<\/p>)/;
let changed = 0, same = 0; const log = [];
for (const f of walk(root)) {
  let s = fs.readFileSync(f, 'utf8'); const m = s.match(re); if (!m) continue;
  const fm = s.match(/<form id="try-form"[\s\S]*?<\/form>/); if (!fm) continue;
  const oldText = dec(m[2].replace(/<[^>]+>/g, ''));
  const a = build(oldText, fm[0]); if (!a) continue;
  if (enc(a) === m[2] || a === m[2]) { same++; continue; }
  changed++; log.push(path.relative(root, f));
  if (!check) fs.writeFileSync(f, s.replace(re, (_, x, y, z) => x + enc(a) + z));
}
console.log((check ? 'would change ' : 'changed ') + changed + ', unchanged ' + same);
if (check) console.log(log.join('\n'));
