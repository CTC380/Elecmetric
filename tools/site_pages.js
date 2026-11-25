/* Public-page registry for the standalone calculators (tools/site_pages.json).
   A calculator's public page and its calculation-engine definition are two different things. Engine calculators are registered in engine.js and
   tools/master_register.json; the standalone tools (Binary Arithmetic, BCD, ASCII, Fractions, Percentages, Basic and Scientific Calculator and the rest) have
   their own page scripts and are registered here, once. Every generator that has to list them reads this file instead of keeping its own list:
     All Tools catalogue      tools/build_all_tools.js    every record with includeInAllTools
     Category hubs            tools/build_pages.js        primaryCategory always, secondaryCategories only where the relationship is real
     Calculators hub, sitemap tools/build_pages.js        every record
     Home page                tools/build_pages.js        records with homepageFeatured
     Related sections         tools/build_pages.js        `related` on the standalone pages, `inboundFrom` on the engine calculator pages
     Tests                    tests/site_pages_test.js, tests/internal_link_graph_test.js */
const fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, 'site_pages.json');
const REG = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const MIN_RELATED = 6, MAX_RELATED = 9;
/* The two general-purpose tools are built by their own scripts and are linked from every hub by the existing "Scientific Calculator" chip; they stay out of
   STANDALONE_TOOLS, which feeds the chips and the General tools list that already name them separately. */
const GENERAL = ['basic-calculator', 'scientific-calculator'];
const pages = REG.pages, LABELS = REG.labels || {};
const bySlug = {}; pages.forEach((p) => { bySlug[p.id] = p; });
const standalone = pages.filter((p) => GENERAL.indexOf(p.id) < 0);

/* Shape and cross-reference checks that need no built output. cats = tools/category_hubs.js, master = tools/master_register.json, enginePages = set of engine page slugs. */
function validate(cats, master, enginePages) {
  const errs = [], seen = new Set(), hubs = new Set(cats.map((k) => k.slug));
  const cat = {}; master.categories.forEach((c) => { cat[c.id] = c; });
  const sub = {}; master.subcategories.forEach((s) => { sub[s.id] = s; });
  const fam = new Set(master.toolTypes.map((t) => t.id));
  pages.forEach((p) => {
    const w = (m) => errs.push('site_pages.json: ' + p.id + ': ' + m);
    if (seen.has(p.id)) w('duplicate id'); seen.add(p.id);
    if (p.url !== '/calculators/' + p.id + '/') w('url must be /calculators/<id>/');
    if (!/^[a-z0-9-]+$/.test(p.id)) w('id is not a slug');
    if (!hubs.has(p.primaryCategory)) w('primaryCategory ' + p.primaryCategory + ' is not a category hub');
    (p.secondaryCategories || []).forEach((s) => { if (!hubs.has(s)) w('secondary category ' + s + ' is not a category hub'); if (s === p.primaryCategory) w('secondary category repeats the primary one'); });
    if (!cat[p.category] || !sub[p.subcategory] || sub[p.subcategory].category !== p.category) w('unknown master category or subcategory');
    if (!fam.has(p.toolType)) w('unknown tool type');
    if (master.tasks.indexOf(p.task) < 0) w('unknown task ' + p.task);
    const rel = p.related || [];
    if (rel.length < MIN_RELATED || rel.length > MAX_RELATED) w('needs ' + MIN_RELATED + ' to ' + MAX_RELATED + ' related tools, has ' + rel.length);
    if (new Set(rel).size !== rel.length) w('duplicate related entry');
    if (rel.indexOf('calculators/' + p.id + '/') >= 0) w('related list contains the page itself');
    (p.inboundFrom || []).forEach((s) => { if (!enginePages.has(s)) w('inboundFrom ' + s + ' is not an engine calculator page'); });
    if (!p.keywords || !p.keywords.length) w('no keywords');
    rel.forEach((r) => { if (!/^calculators\/[a-z0-9-]+\/$/.test(r) && !LABELS[r]) w('related path ' + r + ' has no label in "labels"'); });
  });
  return errs;
}
/* Does every `related` path name a page the build writes? known(path) -> boolean, given a path with no leading slash. */
function checkRelated(known) {
  const errs = [];
  pages.forEach((p) => (p.related || []).forEach((r) => { if (!known(r)) errs.push('site_pages.json: ' + p.id + ': related path ' + r + ' is not a generated page'); }));
  return errs;
}
module.exports = { REG, LABELS, pages, bySlug, standalone, GENERAL, MIN_RELATED, MAX_RELATED, validate, checkRelated, FILE };
