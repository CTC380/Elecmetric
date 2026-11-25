#!/usr/bin/env node
/* Category landing pages (/categories/) and tool-page breadcrumbs: every one of the 20 categories has a page; the page lists every live tool of the
   category and no tool from another; upcoming tools are labelled as not built and are in no registry or count; indexing follows the live-tool
   threshold; every one of the 304 tools carries a Home > Category > Subcategory > Tool trail whose links resolve; the production JSON-LD agrees
   with the visible trail; committed files equal generator output. Usage: node tests/category_pages_test.js */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const bp = require('../tools/build_pages.js'), BC = require('../tools/breadcrumbs.js'), CC = require('../tools/category_roadmap.js'), CAT = require('../tools/build_categories.js');
const ARCH = require('../tools/master_architecture.json');
let fails = 0, total = 0; const ok = (c, m) => { total++; if (!c) { fails++; console.log('  FAIL', m); } };
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const norm = (s) => String(s).toLowerCase().replace(/&amp;/g, '&').replace(/[^a-z0-9]+/g, ' ').trim();
const plain = bp.build({ base: '' }), BASE = 'https://elecmetric.com', dep = bp.build({ base: BASE });
const L1 = ARCH.level1, cats = plain.cats;

/* 1. every category has content, a page, and the planned list is well formed */
ok(L1.length === 20 && Object.keys(CC.CATEGORY_CONTENT).length === 20 && L1.every((c) => CC.CATEGORY_CONTENT[c.slug]), 'content exists for each of the 20 categories');
ok(Object.keys(cats.pages).length === 21 && L1.every((c) => cats.pages[c.slug]) && cats.pages.index, '20 category pages and the index are built');
const existing = new Set(ARCH.tools.map((t) => norm(t.name)));
const allToolsHtml = plain.calc.pages['all-tools'], searchIdx = plain.root['search-index.js'] || '';
L1.forEach((c) => {
  const x = CC.CATEGORY_CONTENT[c.slug], s = c.slug;
  ok(x.planned.length >= 8 && x.planned.length <= 12, s + ': 8 to 12 upcoming tools (' + x.planned.length + ')');
  ok(new Set(x.planned.map((p) => norm(p[0]))).size === x.planned.length, s + ': upcoming tool names are unique');
  x.planned.forEach((p) => {
    ok(p.length === 4 && p.every((v) => typeof v === 'string' && v.trim()), s + ': ' + p[0] + ' has a name, purpose, formula and type');
    ok(/[=≈≤≥]|\bmin\(|\bmax\(|\bmod\b|\bln\b|\blog/.test(p[2]), s + ': ' + p[0] + ' states its formula as an equation');
    ok(CC.TYPES.indexOf(p[3]) >= 0, s + ': ' + p[0] + ' uses one of the nine tool types');
    ok(!existing.has(norm(p[0])), s + ': "' + p[0] + '" is not the name of a tool that already exists');
    ok(allToolsHtml.indexOf('>' + p[0] + '<') < 0 && searchIdx.indexOf(p[0]) < 0, s + ': "' + p[0] + '" is not in All Tools or the search index');
  });
  ok(x.related.length >= 3 && x.related.every((r) => r !== s && L1.some((k) => k.slug === r)), s + ': related categories exist');
  x.also.forEach(([p]) => ok(fs.existsSync(path.join(ROOT, p)) || fs.existsSync(path.join(ROOT, p, 'index.html')), s + ': related page exists: ' + p));
  const mine = ARCH.tools.filter((t) => t.l1 === c.id);
  x.best.forEach((id) => ok(mine.some((t) => t.id === id), s + ': best tool ' + id + ' is in this category'));
  ok(x.best.length === 0 ? mine.length < CAT.MIN_LIVE || true : x.best.length >= 5, s + ': a category with best tools lists at least 5');
  if (mine.length >= CAT.MIN_LIVE) ok(x.best.length >= 5, s + ': a category with at least ' + CAT.MIN_LIVE + ' live tools names its best tools');
});

/* 2. page content */
const titles = [], descs = [];
L1.forEach((c) => {
  const h = plain.cats.pages[c.slug], s = c.slug, mine = ARCH.tools.filter((t) => t.l1 === c.id), x = CC.CATEGORY_CONTENT[s];
  const title = (/<title>([^<]*)<\/title>/.exec(h) || [])[1] || '', desc = (/<meta name="description" content="([^"]*)"/.exec(h) || [])[1] || '';
  titles.push(title); descs.push(desc);
  ok(title.length <= 60 && desc.length >= 50 && desc.length <= 160, s + ': title and description lengths');
  ok((h.match(/<h1>/g) || []).length === 1 && h.indexOf('<h1>' + c.name.replace(/&/g, '&amp;') + ' Calculators and Tools</h1>') > 0, s + ': one H1 naming the category');
  /* every live tool is linked, and no other category's tool is */
  const links = new Set([...h.matchAll(/class="chip" href="\.\.\/\.\.\/([^"]+)"/g)].map((m) => '/' + m[1]));
  ok(mine.every((t) => links.has(t.url)), s + ': every one of its ' + mine.length + ' live tools is linked (missing ' + mine.filter((t) => !links.has(t.url)).slice(0, 2).map((t) => t.id).join(',') + ')');
  const others = new Set(ARCH.tools.filter((t) => t.l1 !== c.id).map((t) => t.url));
  const alsoUrls = new Set(x.also.map(([p]) => '/' + p)); ok([...links].every((u) => !others.has(u) || alsoUrls.has(u)), s + ': apart from its related-pages list it links no tool of another category');
  /* subcategory anchors used by the breadcrumbs */
  c.level2.filter((l) => l.existing).forEach((l) => ok(h.indexOf('id="' + BC.slugify(l.name) + '"') > 0, s + ': section anchor #' + BC.slugify(l.name)));
  /* planned tools are visible, numbered, and marked as not built */
  ok(h.indexOf('<h2>Upcoming Best ') > 0 && (h.match(/Planned, number \d+ of \d+/g) || []).length === x.planned.length && x.planned.every((p) => h.indexOf(p[0].replace(/&/g, '&amp;').replace(/'/g, '&#39;')) > 0 || h.indexOf(p[0].replace(/&/g, '&amp;')) > 0), s + ': all ' + x.planned.length + ' upcoming tools are shown and numbered');
  ok(/not built yet|not available/.test(h) && /not counted/.test(h), s + ': upcoming tools are labelled as not built and not counted');
  ok(h.indexOf('<h2>Assumptions and Limitations</h2>') > 0 && h.indexOf('<h2>Frequently Asked Questions</h2>') > 0 && (h.split('<h2>Frequently Asked Questions</h2>')[1].split('<h2>')[0].match(/<h3>/g) || []).length === 3, s + ': limits and a three-question FAQ');
  ok(h.indexOf('class="crumbs"') > 0 && h.indexOf('aria-current="page"') > 0, s + ': the page has its own breadcrumb');
  /* indexing rule */
  const noindex = /<meta name="robots" content="noindex,follow">/.test(h);
  ok(noindex === (mine.length < CAT.MIN_LIVE), s + ': noindex exactly when fewer than ' + CAT.MIN_LIVE + ' live tools (' + mine.length + ')');
  ok(noindex === !cats.meta.find((m) => m.slug === s).indexable, s + ': metadata agrees with the page robots tag');
  ok(!/<script[^>]+src=/.test(h) && !/(href|src)="http:\/\//.test(h), s + ': no remote script and no plain http link');
  ok(read('categories/' + s + '/index.html') === h, s + ': the committed page equals generator output');
});
ok(new Set(titles).size === 20 && new Set(descs).size === 20, 'category titles and descriptions are unique');
ok(read('categories/index.html') === plain.cats.pages.index && L1.every((c) => plain.cats.pages.index.indexOf('href="' + c.slug + '/"') > 0), 'the index lists all 20 and the committed page equals generator output');
ok(cats.meta.filter((m) => m.indexable).map((m) => m.slug).sort().join() === ['automotive-transportation', 'energy-environment', 'engineering-technology', 'mathematics', 'statistics-data-analysis', 'unit-conversion-measurement'].join(), 'the six categories with at least 3 live tools are the indexable ones');

/* 3. breadcrumbs on every tool page */
const fileOf = (u) => u.endsWith('/') ? u.slice(1) + 'index.html' : u.slice(1);
const l1by = Object.fromEntries(L1.map((c) => [c.id, c]));
ARCH.tools.forEach((t) => {
  const f = fileOf(t.url); ok(fs.existsSync(path.join(ROOT, f)), t.id + ': page exists'); if (!fs.existsSync(path.join(ROOT, f))) return;
  const h = read(f), c = l1by[t.l1], navs = h.match(/<nav class="crumbs"/g) || [];
  ok(navs.length === 1, t.id + ': exactly one breadcrumb trail (' + navs.length + ')');
  const m = /<nav class="crumbs"[^>]*><ol>([\s\S]*?)<\/ol><\/nav>/.exec(h); if (!m) return;
  const items = [...m[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((x) => x[1]);
  ok(items.length === 4 && /^<a href="(\.\.\/)+">Home<\/a>$/.test(items[0]) && items[1].indexOf('categories/' + c.slug + '/"') > 0 && items[2].indexOf('categories/' + c.slug + '/#' + BC.slugify(t.l2Name) + '"') > 0 && /^<span aria-current="page">/.test(items[3]), t.id + ': Home > ' + c.name + ' > ' + t.l2Name + ' > page');
  ok(h.indexOf('<main') < h.indexOf('class="crumbs"') && h.indexOf('class="crumbs"') < h.indexOf('<h1'), t.id + ': the trail sits inside main, above the H1');
  ok(h.indexOf('<style data-crumbs>') > 0 && h.split('<style data-crumbs>').length === 2, t.id + ': one trail style');
  /* the Level 2 anchor and the tool itself exist on the category page */
  const cp = cats.pages[c.slug]; ok(cp.indexOf('id="' + BC.slugify(t.l2Name) + '"') > 0 && cp.indexOf(t.url.replace(/^\//, '')) > 0, t.id + ': its category page has the subcategory section and the tool link');
  ok(BC.inject(h, t.url, '') === h, t.id + ': breadcrumb injection is idempotent');
  const rel = (m2) => m2; void rel;
});
ok(Object.keys(BC.BY_URL).length === ARCH.tools.length, 'every registry tool has a trail');

/* 4. production JSON-LD agrees with the visible trail */
const ldOf = (h) => { const m = h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/); return m ? JSON.parse(m[1].replace(/\\u003c/g, '<')) : null; };
ARCH.tools.forEach((t) => {
  const k = t.url.startsWith('/calculators/') ? dep.calc.pages[t.url.split('/')[2]] : dep.pages[t.url.replace('/pages/', '')]; if (!k) return ok(false, t.id + ': production page built');
  const ld = ldOf(k), bl = ld && (ld['@graph'] || []).filter((x) => x['@type'] === 'BreadcrumbList'), c = l1by[t.l1];
  ok(bl && bl.length === 1 && bl[0].itemListElement.length === 4, t.id + ': one JSON-LD BreadcrumbList with 4 items');
  if (!bl || bl.length !== 1) return;
  const it = bl[0].itemListElement; ok(it[0].item === BASE + '/' && it[1].item === BASE + '/categories/' + c.slug + '/' && it[2].item === BASE + '/categories/' + c.slug + '/#' + BC.slugify(t.l2Name) && it[3].item === BASE + t.url && it.every((v, i) => v.position === i + 1 && v.name), t.id + ': JSON-LD trail matches the registry path');
  ok(it[3].name === (/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(k) || [])[1].replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").trim(), t.id + ': JSON-LD last name is the page H1');
});
L1.forEach((c) => {
  const h = dep.cats.pages[c.slug], ld = ldOf(h), g = ld['@graph'], f = g.find((x) => x['@type'] === 'FAQPage');
  ok(g.map((x) => x['@type']).indexOf('BreadcrumbList') === 0 && g.some((x) => x['@type'] === 'CollectionPage') && f && f.mainEntity.length === 3, c.slug + ': production JSON-LD has breadcrumb, collection and a 3-question FAQ');
  const noindex = /noindex/.test(h), sm = dep.root['sitemap.xml'].indexOf('<loc>' + BASE + '/categories/' + c.slug + '/</loc>') >= 0;
  ok(sm === !noindex, c.slug + ': in the sitemap exactly when indexable');
  ok(h.indexOf('<link rel="canonical" href="' + BASE + '/categories/' + c.slug + '/">') > 0, c.slug + ': canonical');
});
ok(dep.root['sitemap.xml'].indexOf('<loc>' + BASE + '/categories/</loc>') >= 0, 'the sitemap lists the categories index');

/* 5. the generator refuses a category with no content, and the deploy guard knows category pages */
const cd = require('../tools/check_deploy.js');
const files = {}; Object.keys(dep.pages).forEach((k) => { files['pages/' + k] = dep.pages[k]; }); Object.keys(dep.root).forEach((k) => { files[k] = dep.root[k]; }); Object.keys(dep.legal).forEach((k) => { files[k] = dep.legal[k]; });
Object.keys(dep.calc.pages).forEach((k) => { files['calculators/' + (k === 'index' ? '' : k + '/') + 'index.html'] = dep.calc.pages[k]; }); Object.keys(dep.conv.pages).forEach((k) => { files['converters/' + k] = dep.conv.pages[k]; });
Object.keys(dep.future.pages).forEach((k) => { files['calculators/' + k + '/index.html'] = dep.future.pages[k]; });
Object.keys(dep.lib.pages).filter((k) => !/^[^/]+\/index\.html$/.test(k) || k === 'index.html' || k === 'technical-articles/index.html').forEach((k) => { files['technical-library/' + k] = dep.lib.pages[k]; });
Object.keys(dep.cats.pages).forEach((k) => { files['categories/' + (k === 'index' ? '' : k + '/') + 'index.html'] = dep.cats.pages[k]; });
ok(cd.check(files, BASE).length === 0, 'the deploy guard passes with the category pages: ' + cd.check(files, BASE).slice(0, 2).join('; '));
{ const f = Object.assign({}, files); f['categories/chemistry/index.html'] = f['categories/chemistry/index.html'].replace('<meta name="robots" content="noindex,follow">', ''); ok(cd.check(f, BASE).some((p) => /indexable category page must be in sitemap/.test(p)), 'the guard catches a thin category page made indexable without a sitemap entry'); }
{ const f = Object.assign({}, files); f['sitemap.xml'] = f['sitemap.xml'].replace('</urlset>', '<url><loc>' + BASE + '/categories/chemistry/</loc></url></urlset>'); ok(cd.check(f, BASE).some((p) => /noindex category page must not be in sitemap/.test(p)), 'the guard catches a noindex category page listed in the sitemap'); }
console.log(total - fails + '/' + total + ' category page checks passed'); process.exit(fails ? 1 : 0);
