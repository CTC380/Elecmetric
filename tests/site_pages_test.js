#!/usr/bin/env node
/* Registry integrity for tools/site_pages.json: the single source of truth for standalone public pages. Usage: node tests/site_pages_test.js */
const fs = require('fs'), path = require('path');
const E = require('../engine.js'), SITE = require('../tools/site_pages.js'), CATS = require('../tools/category_hubs.js'), MASTER = require('../tools/master_register.json');
const root = path.join(__dirname, '..');
let fails = 0, total = 0; const ok = (c, m) => { total++; if (!c) { fails++; console.log('  FAIL', m); } };
const bp = require('../tools/build_pages.js');
const enginePages = new Set(bp.CALC_DATA.map((c) => c.slug));
SITE.validate(CATS, MASTER, enginePages).forEach((e) => ok(false, e));
ok(true, 'registry validates');
const known = (r) => /^calculators\//.test(r) ? fs.existsSync(path.join(root, r, 'index.html')) : fs.existsSync(path.join(root, r));
SITE.checkRelated(known).forEach((e) => ok(false, e));
const dirs = fs.readdirSync(path.join(root, 'calculators'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
const engineSlug = new Set(bp.CALC_DATA.map((c) => c.slug)), hubSlug = new Set(CATS.map((k) => k.slug));
const redirects = dirs.filter((d) => /data-redirect="/.test(fs.readFileSync(path.join(root, 'calculators', d, 'index.html'), 'utf8')));
const unregistered = dirs.filter((d) => d !== 'all-tools' && !engineSlug.has(d) && !hubSlug.has(d) && !SITE.bySlug[d] && redirects.indexOf(d) < 0 && !require('../tools/future_hubs.js').HUBS.some((h) => h.slug === d));
ok(unregistered.length === 0, 'every published calculators/ folder is an engine page, a category hub, a coming-soon hub (tools/future_hubs.js), a redirect or in tools/site_pages.json; unregistered: ' + unregistered.join(', '));
ok(SITE.pages.every((p) => dirs.indexOf(p.id) >= 0), 'every registered page has a built folder');
ok(SITE.standalone.length === SITE.pages.length - SITE.GENERAL.length, 'standalone list is the registry minus the two general tools');
ok(SITE.pages.every((p) => p.primaryCategory && p.secondaryCategories.indexOf(p.primaryCategory) < 0), 'every page has exactly one primary category, not repeated as secondary');
const fam = { 'fraction-arithmetic': 'electronics-and-instrumentation', 'basic-percentage-calculator': 'electronics-and-instrumentation', 'random-number-generator': 'electronics-and-instrumentation' };
Object.keys(fam).forEach((s) => ok(SITE.bySlug[s].primaryCategory !== fam[s] && SITE.bySlug[s].secondaryCategories.indexOf(fam[s]) < 0, s + ' is not filed under Electronics and Instrumentation'));
['bcd-converter', 'gray-code-converter'].forEach((s) => ok(SITE.bySlug[s].primaryCategory === 'electronics-and-instrumentation', s + ' has Electronics and Instrumentation as its primary category'));
console.log('site pages registry: ' + total + ' checks'); if (fails) { console.log(fails + ' FAILED'); process.exit(1); }
