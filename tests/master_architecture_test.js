#!/usr/bin/env node
/* Master Category Architecture test: every tool is classified once, IDs are unique and stable, tool types are the nine strategy types,
   Level 1/2/3 references resolve, and the committed generated files are current. Usage: node tests/master_architecture_test.js */
const fs = require('fs'), path = require('path');
const A = require('../tools/build_master_architecture.js'), REG = require('../tools/master_register.json'), SITE = require('../tools/site_pages.json').pages;
let fails = 0, total = 0; const ok = (c, m) => { total++; if (!c) { fails++; console.log('  FAIL', m); } };
const a = A.out, tools = a.tools;
ok(a.level1.length === 20, '20 Level 1 categories');
const l2n = a.level1.reduce((n, c) => n + c.level2.length, 0); ok(l2n >= 100 && l2n <= 150, 'Level 2 hubs within 100-150 (' + l2n + ')');
ok(tools.length === REG.tools.length + SITE.length, 'every engine and standalone tool is classified (' + tools.length + ')');
ok(new Set(tools.map((t) => t.toolId)).size === tools.length, 'Tool IDs are unique');
ok(new Set(tools.map((t) => t.id)).size === tools.length, 'slugs are unique across engine and standalone tools');
REG.tools.forEach((t) => { const m = tools.find((x) => x.id === t.engineId); ok(m && m.toolId === t.toolId, 'engine Tool ID unchanged: ' + t.engineId); });
ok(tools.every((t) => A.TYPES.includes(t.toolType)), 'every tool type is one of the nine strategy types');
const l1 = new Map(a.level1.map((c) => [c.id, c])), l2 = new Map(), l3 = new Map();
a.level1.forEach((c) => c.level2.forEach((x) => { l2.set(x.id, c.id); x.topics.forEach((y) => l3.set(y.id, x.id)); }));
ok(tools.every((t) => l1.has(t.l1) && l2.get(t.l2) === t.l1 && l3.get(t.l3) === t.l2), 'Level 1, 2 and 3 references resolve and nest correctly');
ok(a.level1.reduce((n, c) => n + c.existing, 0) === tools.length, 'Level 1 counts add up to the tool total');
ok(a.level1.reduce((n, c) => n + c.target, 0) === 3020, 'long-term target is 3,020 (strategy table)');
ok(tools.filter((t) => t.l2Name === 'Airport and Aviation Engineering').length === REG.tools.filter((t) => t.category === 'C17').length, 'Airport and Aviation Engineering holds every AGL calculator');
ok(tools.filter((t) => t.toolType === 'Converter').every((t) => t.source === 'engine' || t.source === 'standalone'), 'tool type is independent of subject');
const sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'); ok(!/master_architecture/.test(sw), 'architecture data is not shipped to visitors (docs and tools only)');
Object.keys(A.files).forEach((f) => { const p = path.join(__dirname, '..', f); ok(fs.existsSync(p) && fs.readFileSync(p, 'utf8') === A.files[f], 'up to date (run node tools/build_master_architecture.js): ' + f); });
console.log(total - fails + '/' + total + ' master architecture checks passed'); process.exit(fails ? 1 : 0);
