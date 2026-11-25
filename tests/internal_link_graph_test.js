#!/usr/bin/env node
/* Internal-link graph test. Runs on the PRODUCTION build held in memory (what visitors and crawlers receive) and keeps two graphs apart:
   full (all anchors) and contextual (inside <main>, so header/footer navigation cannot hide a weakly connected page).
   These are Elecmetric's own quality rules, not Google link-count requirements. Usage: node tests/internal_link_graph_test.js */
const path = require('path');
const BASE = 'https://elecmetric.com';
const bp = require('../tools/build_pages.js'), G = require('../tools/link_graph.js'), SITE = require('../tools/site_pages.js'), REL = require('../tools/calc_related.js');
const CATS = bp.CATS, E = require('../engine.js'), REG = require('../tools/master_register.json');
let fails = 0, total = 0; const ok = (c, m) => { total++; if (!c) { fails++; console.log('  FAIL', m); } };
const dep = bp.build({ base: BASE });
const map = {};
map['/'] = dep.root['index.html'];
Object.keys(dep.pages).forEach((f) => { map['/pages/' + f.replace(/^index\.html$/, '')] = dep.pages[f]; });
Object.keys(dep.calc.pages).forEach((k) => { map['/calculators/' + (k === 'index' ? '' : k + '/')] = dep.calc.pages[k]; });
Object.keys(dep.future.pages).forEach((k) => { map['/calculators/' + k + '/'] = dep.future.pages[k]; });
Object.keys(dep.calc.redirects || {}).forEach((k) => { map['/calculators/' + k + '/'] = dep.calc.redirects[k]; });
Object.keys(dep.conv.pages).forEach((f) => { map['/converters/' + f.replace(/^index\.html$/, '')] = dep.conv.pages[f]; });
Object.keys(dep.cats.pages).forEach((k) => { map['/categories/' + (k === 'index' ? '' : k + '/')] = dep.cats.pages[k]; });
Object.keys(dep.lib.pages).forEach((k) => { map['/technical-library/' + k.replace(/index\.html$/, '')] = dep.lib.pages[k]; });
const P = G.fromMap(map, BASE), urls = Object.keys(P), idx = urls.filter((u) => !P[u].noindex);
const inb = G.inbound(P, 'ctx'), depth = G.depths(P, 'ctx', '/');
const sitemap = [...dep.root['sitemap.xml'].matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(BASE, '').replace(/index\.html$/, '') || '/');
ok(sitemap.length > 600 && sitemap.every((u) => P[u]), 'every sitemap URL is a built page');
ok(sitemap.every((u) => depth[u] !== undefined && depth[u] <= 3), 'every sitemap URL is reachable from the home page through in-content links in at most 3 clicks');
const orphans = idx.filter((u) => u !== '/' && inb[u].size === 0);
ok(orphans.length === 0, 'no indexable page is an orphan (no in-content inbound link): ' + orphans.slice(0, 5).join(', '));
const home = P['/'];
ok(home.ctx.has('/calculators/all-tools/') && CATS.every((k) => home.ctx.has('/calculators/' + k.slug + '/')), 'the home page links to All Tools and every category hub');
/* catalogue coverage */
const at = P['/calculators/all-tools/'], listed = (u) => at.ctx.has(u);
const calcPages = idx.filter((u) => /^\/calculators\/[^/]+\/$/.test(u)), hubs = new Set(CATS.map((k) => '/calculators/' + k.slug + '/'));
const excluded = new Set(SITE.pages.filter((p) => !p.includeInAllTools).map((p) => p.url));
const unlisted = calcPages.filter((u) => !hubs.has(u) && u !== '/calculators/all-tools/' && !excluded.has(u) && !listed(u));
ok(unlisted.length === 0, 'every published calculator appears in All Tools unless the registry excludes it; missing: ' + unlisted.join(', '));
ok(SITE.pages.filter((p) => p.includeInAllTools).every((p) => listed(p.url)), 'all ' + SITE.pages.length + ' registered standalone pages are in All Tools');
/* category coverage */
const hubOf = (def) => CATS.find((k) => k.divisions.indexOf(def.division.slice(0, 2)) >= 0).slug;
const noHub = bp.CALC_DATA.filter((c) => !P['/calculators/' + hubOf(E.BY_ID[c.calc]) + '/'].ctx.has('/calculators/' + c.slug + '/'));
ok(noHub.length === 0, 'every calculator page is linked from its primary category hub; missing: ' + noHub.map((c) => c.slug).join(', '));
SITE.pages.forEach((p) => ok(P['/calculators/' + p.primaryCategory + '/'].ctx.has(p.url), p.id + ' is linked from its primary category hub'));
{ /* a hub lists a standalone page only where the registry says it belongs */
  const wrong = []; CATS.forEach((k) => SITE.pages.forEach((p) => { if (p.id === 'scientific-calculator') return; const should = p.primaryCategory === k.slug || p.secondaryCategories.indexOf(k.slug) >= 0, has = P['/calculators/' + k.slug + '/'].ctx.has(p.url); if (should !== has) wrong.push(k.slug + ':' + p.id); }));
  ok(wrong.length === 0, 'category hubs list standalone tools exactly as the registry assigns them; mismatches: ' + wrong.slice(0, 6).join(', ')); }
/* discovery paths */
const thin = calcPages.filter((u) => !hubs.has(u) && inb[u].size < 5);
ok(thin.length === 0, 'every calculator page has at least 5 distinct in-content inbound sources; thin: ' + thin.map((u) => u + '=' + inb[u].size).join(', '));
/* related sections */
const sec = (h, re) => { const m = re.exec(h); return m ? [...m[1].matchAll(/href="([^"#]+)/g)].map((x) => x[1]) : []; };
bp.CALC_DATA.forEach((c) => {
  const h = P['/calculators/' + c.slug + '/'].main, i = h.indexOf('<h2>Related Calculators and Tools</h2>'), j = h.indexOf('<section id="guides"', i), body = h.slice(i, j > 0 ? j : h.indexOf('</section>', i));
  const hs = [...body.matchAll(/<li><a href="([^"#]+)/g)].map((x) => x[1]);
  ok(hs.length >= REL.MIN && hs.length <= REL.limitOf(c.calc), c.slug + ': related list has ' + hs.length + ' links, limit ' + REL.MIN + ' to ' + REL.limitOf(c.calc));
  ok(new Set(hs).size === hs.length && hs.indexOf('../' + c.slug + '/') < 0, c.slug + ': no duplicate or self related link');
});
SITE.pages.forEach((p) => {
  const hs = sec(P[p.url].main, /<section id="related">([\s\S]*?)<\/section>/), self = [p.id + '/', '../' + p.id + '/'];
  ok(hs.length >= 6 && new Set(hs).size === hs.length && !hs.some((x) => x === '../' + p.id + '/'), p.id + ': standalone related section has ' + hs.length + ' unique links, none to itself');
  ok(hs.length <= 15, p.id + ': standalone related section is not overlong (' + hs.length + ')');
});
/* converters */
const pair = (re, dir) => { const bad = []; idx.filter((u) => re.test(u)).forEach((u) => { const m = /^(.*\/)([^/]+?)-to-(.+)\.html$/.exec(u), r = m[1] + m[3] + '-to-' + m[2] + '.html'; if (P[r] && !P[u].ctx.has(r)) bad.push(u); }); ok(bad.length === 0, dir + ' direction pages link to their reverse page; missing: ' + bad.slice(0, 4).join(', ')); };
pair(/^\/converters\/[^/]+-to-[^/]+\.html$/, 'converter'); pair(/^\/pages\/[^/]+-to-[^/]+\.html$/, 'conversion');
/* internal link targets exist; anchor text */
const broken = [], vague = [];
idx.forEach((u) => { P[u].ctx.forEach((t) => { if ((t === '/' || /\/$|\.html$/.test(t)) && t !== '/terms.html' && t !== '/privacy.html' && !P[t]) broken.push(u + ' -> ' + t); });
  G.anchors(P[u].main).forEach((a) => { if (!a.text && !/<img/.test(P[u].main.slice(a.at, a.at + 400).split('</a>')[0])) vague.push(u); else if (/^(click here|here|read more|more|link)$/i.test(a.text)) vague.push(u); }); });
ok(broken.length === 0, 'every in-content internal link resolves to a built page; broken: ' + broken.slice(0, 4).join(', '));
ok(vague.length === 0, 'no in-content link has empty or generic anchor text; pages: ' + [...new Set(vague)].slice(0, 4).join(', '));
console.log('internal link graph: ' + total + ' checks (' + idx.length + ' indexable pages, contextual and full graphs kept apart)');
if (fails) { console.log(fails + ' FAILED'); process.exit(1); }
