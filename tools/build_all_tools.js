/* All Tools catalogue (Phase 3 of the Engineering Tools Library plan): /calculators/all-tools/.
   Data: tools/master_register.json (categories, subcategories, tool families, tasks, one record per calculator, plus the converter and
   conversion pages). Titles and descriptions of the converter pages are read from the generated pages, and calculator descriptions from
   the engine registry, so nothing is typed twice. Every card is plain HTML with data-* attributes: without JavaScript the page is a
   complete list of links, and with JavaScript the same cards are searched, filtered, sorted and paged in the browser. Filter states are
   never written to the address, so no combination creates another indexable URL. Verification is shown as recorded, separate from category. */
const fs = require('fs'), path = require('path');
const ARCH = JSON.parse(fs.readFileSync(path.join(__dirname, 'master_architecture.json'), 'utf8'));
const ARCH_BY = {}; ARCH.tools.forEach((t) => { ARCH_BY[t.id] = t; });
const ARCH_L1 = {}; ARCH.level1.forEach((c) => { ARCH_L1[c.id] = c.name; });
const REG = JSON.parse(fs.readFileSync(path.join(__dirname, 'master_register.json'), 'utf8'));
const SITE = require('./site_pages.js');
const PER_PAGE = 24;
const TITLE = 'All Online Calculators and Tools';
const DESC = 'Search and filter every Elecmetric calculator, converter and reference page by discipline, tool type, task and application. Free, in your browser.';

const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const firstSentence = (t, max) => {
  t = clean(t); const f = (t.split(/(?<=[a-z0-9)])\.\s/)[0] || t).replace(/\.$/, '');
  return f.length <= max ? f : f.slice(0, max).replace(/[ ,;:(]+[^ ]*$/, '') + '…';
};
const unent = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const strip = (s) => unent(s.replace(/<[^>]*>/g, ''));
const h1Of = (html) => { const m = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html); return m ? clean(strip(m[1])) : ''; };
const metaDesc = (html) => { const m = /<meta name="description" content="([^"]*)"/.exec(html); return m ? clean(unent(m[1])) : ''; };

/* ctx: { E, page, esc, FOOTC, calcUrl, ldScript, BASE, convPages, introPages, calcSlugs, calcPages, redirectSlugs, hubs } */
function build(ctx) {
  const { E, page, esc, FOOTC, calcUrl, ldScript, BASE } = ctx;
  const cat = {}, sub = {}, fam = {};
  REG.categories.forEach((c) => { cat[c.id] = c; });
  REG.subcategories.forEach((s) => { sub[s.id] = s; });
  REG.toolTypes.forEach((t) => { fam[t.id] = t; });
  const items = [], urls = new Set();
  const target = (u) => { const m = /^\/(calculators|pages|converters)\/(.*)$/.exec(u); if (!m) throw new Error('all-tools: unexpected URL ' + u); return m; };
  const exists = (u) => {
    const [, dir, rest] = target(u);
    if (dir === 'converters') return Object.prototype.hasOwnProperty.call(ctx.convPages, rest);
    if (dir === 'pages') return Object.prototype.hasOwnProperty.call(ctx.introPages, rest);
    return ctx.calcSlugs.has(rest.replace(/\/$/, '')); /* a redirect page for an old address is not a tool page */
  };
  /* 1. calculators */
  const seenIds = new Set();
  REG.tools.forEach((t) => {
    const def = E.BY_ID[t.engineId]; if (!def) throw new Error('all-tools: register entry ' + t.toolId + ' names unknown calculator ' + t.engineId);
    if (seenIds.has(t.engineId)) throw new Error('all-tools: duplicate register entry for ' + t.engineId); seenIds.add(t.engineId);
    if (!cat[t.category] || !sub[t.subcategory] || sub[t.subcategory].category !== t.category || !fam[t.toolType]) throw new Error('all-tools: ' + t.toolId + ' has an unknown category, subcategory or tool type');
    if (REG.tasks.indexOf(t.task) < 0) throw new Error('all-tools: ' + t.toolId + ' has an unknown task ' + t.task);
    if (!exists(t.url)) throw new Error('all-tools: ' + t.toolId + ' points at ' + t.url + ', which is not generated');
    urls.add(t.url);
    items.push({ id: t.toolId, name: t.name, url: t.url, c: t.category, s: t.subcategory, t: t.toolType, k: t.task, apps: t.application.split(',').map((x) => x.trim()).filter(Boolean),
      basis: t.basis, std: /^Applicable/.test(t.standards) ? 'Applicable' : 'Not applicable', ver: t.verification,
      desc: firstSentence(def.purpose, 130), kw: [].concat(t.keywords, t.inputs, t.outputs, [t.division.replace(/^\d+ /, '')]) });
  });
  const missing = E.CALCS.filter((c) => !seenIds.has(c.id)).map((c) => c.id);
  if (missing.length) throw new Error('all-tools: ' + missing.length + ' calculator(s) are not in tools/master_register.json: ' + missing.join(', '));
  /* 1b. standalone calculators with their own page script (tools/site_pages.json). They have no engine definition, so they are not in the master register;
     the site page register is their record. The two lists are checked against each other below, so a published page cannot be missing from this catalogue
     unless the register says includeInAllTools: false. */
  const pageCalcIds = new Set();
  SITE.pages.forEach((p) => {
    if (!p.includeInAllTools) return;
    if (!cat[p.category] || !sub[p.subcategory] || sub[p.subcategory].category !== p.category || !fam[p.toolType] || REG.tasks.indexOf(p.task) < 0) throw new Error('all-tools: site page ' + p.id + ' has an unknown category, subcategory, tool type or task');
    if (!exists(p.url)) throw new Error('all-tools: site page ' + p.id + ' points at ' + p.url + ', which is not generated');
    if (urls.has(p.url)) throw new Error('all-tools: duplicate URL ' + p.url); urls.add(p.url);
    const html = ctx.calcPages[p.id], id = 'SP-' + p.id; pageCalcIds.add(id);
    items.push({ id, name: p.name, url: p.url, c: p.category, s: p.subcategory, t: p.toolType, k: p.task, apps: [], basis: '', std: '', ver: '', desc: firstSentence(metaDesc(html), 130), kw: [].concat(p.keywords, [cat[p.category].name]) });
  });
  { const hubSlugs = new Set(ctx.hubs.map((k) => k.slug)), known = new Set(Array.from(urls).map((u) => u.replace(/^\/calculators\//, '').replace(/\/$/, '')));
    SITE.pages.filter((p) => !p.includeInAllTools).forEach((p) => known.add(p.id));
    const unlisted = Array.from(ctx.calcSlugs).filter((s) => s !== 'all-tools' && !hubSlugs.has(s) && !known.has(s));
    if (unlisted.length) throw new Error('all-tools: ' + unlisted.length + ' published calculator page(s) are in no catalogue record: ' + unlisted.join(', ') + '. Engine calculators belong in tools/master_register.json; standalone pages in tools/site_pages.json.'); }
  /* 2. converter, formula and reference pages (their own page is the tool) */
  const subOfCalc = {}; REG.tools.forEach((t) => { subOfCalc[t.engineId] = t.subcategory; });
  REG.converterPages.forEach((p) => {
    if (!exists(p.url)) throw new Error('all-tools: ' + p.pageId + ' points at ' + p.url + ', which is not generated');
    if (!cat[p.category] || (p.subcategory && (!sub[p.subcategory] || sub[p.subcategory].category !== p.category)) || !fam[p.toolType]) throw new Error('all-tools: ' + p.pageId + ' has an unknown category, subcategory or tool type');
    if (urls.has(p.url)) throw new Error('all-tools: duplicate URL ' + p.url); urls.add(p.url);
    const html = ctx.convPages[p.file], nm = h1Of(html);
    items.push({ id: p.pageId, name: nm, url: p.url, c: p.category, s: p.subcategory || '', t: p.toolType, k: p.toolType === 'TT8' ? 'Look up' : 'Convert', apps: [], basis: '', std: '', ver: '', desc: firstSentence(metaDesc(html), 130), kw: [p.kind, p.file.replace(/\.html$/, '').replace(/-/g, ' ')] });
  });
  /* 3. conversion pages in pages/ (kW to amps and the like), unless a calculator record already links to the same page */
  REG.conversionPages.forEach((p) => {
    if (p.file === 'index.html') return; /* the hub of pages/ is a list of tools, not a tool */
    const u = '/pages/' + p.file; if (urls.has(u)) return;
    if (!exists(u)) throw new Error('all-tools: conversion page ' + p.file + ' is not generated');
    if (!cat[p.category]) throw new Error('all-tools: conversion page ' + p.file + ' has an unknown category');
    urls.add(u); const html = ctx.introPages[p.file], sb = subOfCalc[p.calc] || '';
    items.push({ id: 'CV-' + p.file.replace(/\.html$/, ''), name: h1Of(html), url: u, c: p.category, s: sb && sub[sb].category === p.category ? sb : '', t: 'TT5', k: 'Convert', apps: [], basis: '', std: '', ver: '', desc: firstSentence(metaDesc(html), 130), kw: ['conversion', p.file.replace(/\.html$/, '').replace(/-/g, ' ')] });
  });
  /* Master Category Architecture v1.0: Level 1 subject (m) and the nine strategy tool types (y), separate from each other. Engine and standalone tools come from
     tools/master_architecture.json by slug; converter and formula pages inherit the Level 1 of their legacy category and are Converter or Reference. */
  items.forEach((it) => {
    const slug = it.id.indexOf('SP-') === 0 ? it.id.slice(3) : (REG.tools.find((t) => t.toolId === it.id) || {}).engineId, a = slug && ARCH_BY[slug];
    it.m = a ? a.l1 : ARCH.legacyCategoryLevel1[it.c]; it.y = a ? a.toolType : (it.t === 'TT8' ? 'Reference' : 'Converter');
    if (!it.m || !ARCH_L1[it.m] || ARCH.toolTypes.indexOf(it.y) < 0) throw new Error('all-tools: ' + it.id + ' has no Level 1 subject or strategy tool type in tools/master_architecture.json (run node tools/build_master_architecture.js)');
  });
  const FAM_SHORT = { TT1: 'Calculator', TT2: 'Design / sizing tool', TT3: 'Analysis / solver', TT4: 'Simulator', TT5: 'Converter', TT6: 'Estimator', TT7: 'Checker', TT8: 'Reference' };
  const famName = (id) => FAM_SHORT[id] || fam[id].name;
  /* Cards: the order here is the default order (category, then A to Z), the same for everyone and the same at every build. */
  items.sort((a, b) => (a.c < b.c ? -1 : a.c > b.c ? 1 : a.name.toLowerCase() < b.name.toLowerCase() ? -1 : a.name.toLowerCase() > b.name.toLowerCase() ? 1 : a.id < b.id ? -1 : 1));
  const card = (it) => {
    /* Search text: each word once, name and discipline first, capped so one long input list cannot bloat the page. */
    const seen = {}, q = [it.name].concat([cat[it.c].name, ARCH_L1[it.m], it.y, it.s ? sub[it.s].name : '', famName(it.t), fam[it.t].name, it.k, it.apps.join(' ')], it.kw).join(' ').toLowerCase().split(/\s+/).filter((w) => w && !seen[w] && (seen[w] = 1)).join(' ').slice(0, 700);
    const attr = (k, v) => ' data-' + k + '="' + esc(v) + '"';
    return '<li class="tcard"' + attr('c', it.c) + attr('s', it.s) + attr('t', it.t) + attr('m', it.m) + attr('y', it.y) + attr('k', it.k) + attr('a', it.apps.join('|')) + attr('b', it.basis) + attr('g', it.std) + attr('n', it.name.toLowerCase()) + attr('q', q) + '>' +
      '<a class="tname" href="' + esc(it.url.indexOf('/calculators/') === 0 ? '../' + it.url.slice('/calculators/'.length) : '../../' + it.url.slice(1)) + '">' + esc(it.name) + '</a>' +
      (it.desc ? '<p class="tdesc">' + esc(it.desc) + '</p>' : '') +
      '<p class="ttags"><span>' + esc(famName(it.t)) + '</span><span>' + esc(cat[it.c].name) + '</span>' + (it.s ? '<span>' + esc(sub[it.s].name) + '</span>' : '') + '<span>' + esc(it.k) + '</span></p>' +
      (it.ver ? '<p class="tver">Verification: ' + (it.ver === 'Not verified' ? 'not independently verified' : esc(it.ver.toLowerCase())) + '</p>' : '') + '</li>';
  };
  const used = (f) => { const s = {}; items.forEach((i) => { if (f(i)) s[f(i)] = 1; }); return s; };
  const usedC = used((i) => i.c), usedS = used((i) => i.s), usedT = used((i) => i.t), usedM = used((i) => i.m), usedY = used((i) => i.y), usedK = used((i) => i.k);
  const lookup = {
    cats: REG.categories.filter((c) => usedC[c.id]).map((c) => [c.id, c.name]),
    subs: REG.subcategories.filter((s) => usedS[s.id]).map((s) => [s.id, s.category, s.name]),
    fams: REG.toolTypes.filter((t) => usedT[t.id]).map((t) => [t.id, t.name]),
    mains: ARCH.level1.filter((c) => usedM[c.id]).map((c) => [c.id, c.name]),
    types: ARCH.toolTypes.filter((t) => usedY[t]).map((t) => [t, t]),
    tasks: REG.tasks.filter((k) => usedK[k]),
    apps: Object.keys(items.reduce((a, i) => { i.apps.forEach((x) => { a[x] = 1; }); return a; }, {})).sort(),
    basis: Object.keys(items.reduce((a, i) => { if (i.basis) a[i.basis] = 1; return a; }, {})).sort(),
    per: PER_PAGE
  };
  const nCalc = items.filter((i) => pageCalcIds.has(i.id) || REG.tools.some((t) => t.toolId === i.id)).length;
  const counts = { calculators: nCalc, pages: items.length - nCalc, total: items.length, categories: lookup.cats.length, subcategories: lookup.subs.length };
  const hubs = ctx.hubs.map((k) => '<a class="chip" href="../' + k.slug + '/">' + esc(k.name) + '</a>').join('');
  const css = '.w.wide{max-width:1100px}.tools-js{display:none}.js #tctl{display:block}.js #tpg{display:flex}' +
    '.tbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:8px 0 12px}.tbar input[type=search]{flex:1 1 280px;font:16px var(--body);color:var(--ink);background:var(--field);border:1px solid var(--line);border-radius:4px;padding:10px 12px;min-height:44px}' +
    '.tbar input[type=search]:focus,.tfil select:focus,.tchips button:focus-visible,.tpg button:focus-visible,.ftoggle:focus-visible{outline:2px solid var(--gold);outline-offset:2px}' +
    '.ftoggle{display:none;font:600 14px var(--body);color:var(--on-navy);background:var(--navy);border:1px solid var(--gold);border-radius:4px;padding:10px 14px;min-height:44px;cursor:pointer}' +
    '.fpanel{display:block}.fpanel h2{margin:14px 0 6px;font-size:1.05em}.tchips{display:flex;flex-wrap:wrap;gap:6px}.tchips button{font:14px var(--body);color:var(--ink);background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:6px 12px;min-height:36px;cursor:pointer}.tchips button:hover{border-color:var(--gold)}.tchips button[aria-pressed=true]{background:var(--navy);color:var(--on-navy);border-color:var(--navy)}.tchips button[disabled]{opacity:.45;cursor:default}' +
    '.tfil{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px 14px;margin-top:12px}.tfil label{display:block;font-weight:600;font-size:13px;margin-bottom:4px}.tfil select{width:100%;font:15px var(--body);color:var(--ink);background:var(--field);border:1px solid var(--line);border-radius:4px;padding:8px;min-height:40px}' +
    '#more{margin-top:12px}#more>summary{cursor:pointer;font-weight:600;padding:6px 0}.tact{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:12px}.tact button,.tpg button{font:600 14px var(--body);color:var(--ink);background:var(--surface);border:1px solid var(--line);border-radius:4px;padding:8px 14px;min-height:40px;cursor:pointer}.tact button:hover,.tpg button:hover:not([disabled]){border-color:var(--gold)}.tpg button[disabled]{opacity:.45;cursor:default}' +
    '#tcount{font-weight:600;margin:14px 0 6px}.tlist{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}.tcard{background:var(--surface);border:1px solid var(--line);border-radius:4px;padding:12px 14px;display:flex;flex-direction:column;gap:6px}.tcard[hidden]{display:none}' +
    '.tcard .tname{font:600 16px/1.25 var(--body);text-decoration:none;color:var(--navy-2);padding:2px 0}.tcard .tname:hover{text-decoration:underline}.tdesc{margin:0;color:var(--muted);font-size:13px}.ttags{margin:0;display:flex;flex-wrap:wrap;gap:4px}.ttags span{font-size:12px;color:var(--muted);background:var(--field);border:1px solid var(--line);border-radius:999px;padding:1px 8px}.tver{margin:0;font-size:12px;color:var(--muted)}' +
    '.tpg{display:flex;gap:10px;align-items:center;justify-content:center;margin:18px 0}.tpg span{font-size:14px}.tnone{padding:18px;border:1px dashed var(--line);border-radius:4px;color:var(--muted)}' +
    '@media(max-width:720px){.ftoggle{display:inline-block}.fpanel{display:none}.fpanel.open{display:block}}@media print{.tbar,.fpanel,.tpg,.ftoggle,#tcount{display:none}.tcard{break-inside:avoid}}';
  const intro = '<p class="lede">' + esc(DESC) + '</p>' +
    '<p class="note">' + counts.calculators + ' calculators and ' + counts.pages + ' converter, formula and reference pages, organised into ' + counts.categories + ' disciplines. ' + (ctx.COUNTS ? 'The ' + ctx.COUNTS.calculators + ' calculators are the ' + ctx.COUNTS.engine + ' engine calculators (' + ctx.COUNTS.own + ' with their own calculator page, ' + ctx.COUNTS.via + ' reached through conversion pages) plus ' + ctx.COUNTS.standalone + ' standalone tools. ' : '') + 'Each tool has one primary discipline; use search to find it by another name, equipment or quantity. ' +
    'Verification is recorded separately from the category. No tool here is listed as independently verified: each calculator page states its limits and the cross-check behind it.</p>';
  const controls = '<div class="tools-js" id="tctl"><h2>Search All Calculators and Tools</h2>' +
    '<div class="tbar"><label class="sr" for="tq" style="position:absolute;left:-9999px">Search tools</label><input id="tq" type="search" placeholder="Search by task, equipment, formula or quantity, for example cable voltage drop" autocomplete="off" enterkeyhint="search"><button type="button" class="ftoggle" id="ftoggle" aria-expanded="false" aria-controls="fpanel">Filters</button></div>' +
    '<div class="fpanel card" id="fpanel">' +
    '<div class="tfil" style="margin-top:0"><div><label for="tmain">Subject area</label><select id="tmain"></select></div><div><label for="tcat">Discipline</label><select id="tcat"></select></div><div id="tsubw" hidden><label for="tsub">Subcategory</label><select id="tsub"></select></div><div><label for="ttask">Task</label><select id="ttask"></select></div><div><label for="tsort">Sort by</label><select id="tsort"><option value="rel">Relevance</option><option value="az">Name, A to Z</option><option value="za">Name, Z to A</option></select></div></div>' +
    '<h2>Browse Tools by Calculation Type</h2><div class="tchips" id="tfams" role="group" aria-label="Tool type"></div>' +
    '<details id="more"><summary>More filters</summary><div class="tfil"><div><label for="tapp">Industry or application</label><select id="tapp"></select></div><div><label for="tbasis">Calculation basis</label><select id="tbasis"></select></div><div><label for="tstd">Standards</label><select id="tstd"></select></div></div>' +
    '<p class="note">Standards shows whether a governing standard was identified for the method (scope screened, clause review still open) or none applies. It is a reference filter, not a statement of compliance. Basis and standards are recorded for calculators only.</p></details>' +
    '<div class="tact"><button type="button" id="treset">Reset all filters</button></div></div></div>';
  const FAQS = [['How do I find the right calculator?', 'Type a task, quantity or formula into the search box, or narrow the list with the discipline, task and tool type filters. The subject pages below group the same tools by topic.'], ['Are these calculators free to use?', 'Yes. Every calculator, converter and reference page listed here is free to use in your browser.'], ['What is the difference between a calculator, a converter and a reference page?', 'A calculator solves a problem from several inputs. A converter changes a value between units or number systems. A reference page explains formulas, tables and methods, with worked examples.']];
  const hubChip = (k, label) => '<a class="chip" href="../' + k.slug + '/">' + esc(label || k.name) + '</a>';
  const mathHub = ctx.hubs.find((k) => k.math), elecHub = ctx.hubs.find((k) => k.slug === 'electronics-and-instrumentation');
  const subjects = '<h3>Engineering Calculators</h3><p>' + ctx.hubs.filter((k) => !k.math && k !== elecHub).map((k) => hubChip(k)).join('') + '</p>' +
    '<h3>Mathematics Calculators</h3><p>' + hubChip(mathHub, 'Online Mathematics Calculators') + '<a class="chip" href="../basic-calculator/">Basic Calculator</a><a class="chip" href="../basic-percentage-calculator/">Basic Percentage Calculator</a><a class="chip" href="../quadratic-solver/">Quadratic Equation Solver</a></p>' +
    '<h3>Electronics Calculators</h3><p>' + hubChip(elecHub) + '</p>' +
    '<h3>Unit Converters</h3><p><a class="chip" href="../../converters/index.html">Conversion Centre</a><a class="chip" href="../../pages/index.html">Electrical conversions</a></p>' +
    '<h3>Everyday Calculators</h3><p><a class="chip" href="../basic-calculator/">Basic Calculator</a><a class="chip" href="../basic-percentage-calculator/">Basic Percentage Calculator</a><a class="chip" href="../ratio-calculator/">Ratio Calculator</a><a class="chip" href="../rounding-calculator/">Rounding Calculator</a></p>';
  const pick = (urls, what) => '<p>' + urls.map((u) => { const it = items.find((x) => x.url === u); if (!it) throw new Error('all-tools: ' + what + ' entry ' + u + ' is not in the catalogue'); return '<a class="chip" href="' + u.replace(/^\/(calculators|pages|converters)\//, (m, d) => '../../' + d + '/').replace(/^\.\.\/\.\.\/calculators\//, '../') + '">' + esc(it.name) + '</a>'; }).join('') + '</p>';
  const POPULAR_URLS = ['/pages/amps-to-kw.html', '/pages/kva-to-kw.html', '/pages/kw-to-amps.html', '/pages/watts-to-amps.html', '/pages/ohms-law.html', '/pages/voltage-drop.html', '/pages/power-factor.html', '/pages/wire-gauge.html', '/calculators/basic-calculator/', '/calculators/basic-percentage-calculator/'];
  /* Hand-kept: the calculators added in the latest releases. Update when a release adds one. */
  const RECENT_URLS = ['/calculators/exponent-laws-calculator/', '/calculators/exact-roots/', '/calculators/rounding-calculator/', '/calculators/engineering-quadratic/', '/calculators/decay-table-calculator/', '/calculators/engineering-powers-scientific-notation/'];
  const popularRecent = '<h2>Popular Calculators</h2>' + pick(POPULAR_URLS, 'popular') + '<h2>Recently Added Calculators</h2>' + pick(RECENT_URLS, 'recent');
  const body = '<header><div class="w"><a class="brand" href="../../"><img src="../../logo.png" alt="Elecmetric" width="160" height="40"></a><nav><a href="../">Calculators by topic</a><a href="../../pages/index.html">Conversions</a><a href="../../converters/index.html">Conversion Centre</a><a href="../../index.html#verification">How it is verified</a></nav></div></header>' +
    '<main class="w wide"><h1>' + esc(TITLE) + '</h1>' + intro + controls +
    '<p id="tcount" role="status" aria-live="polite" tabindex="-1"></p>' +
    '<ul class="tlist" id="tlist">' + items.map(card).join('') + '</ul>' +
    '<nav class="tpg tools-js" id="tpg" aria-label="Pages of results"><button type="button" id="tprev">Previous</button><span id="tpos"></span><button type="button" id="tnext">Next</button></nav>' +
    '<h2>Browse Calculators by Subject</h2><p>' + ARCH.level1.map((c) => '<a class="chip" href="../../categories/' + c.slug + '/">' + esc(c.name) + '</a>').join('') + '<a class="chip" href="../../categories/">All categories</a></p><p class="note">The same calculators grouped by topic, each with where to start and what the group does not cover.</p>' + subjects +
    popularRecent +

    '<p class="note">Planned subjects, not built yet: ' + require('./future_hubs.js').HUBS.map((h) => '<a href="../' + h.slug + '/">' + esc(h.name) + '</a>').join(', ') + '. Each page lists the calculators planned and the related tools that work today.</p>' +
    '<h2>Frequently Asked Questions</h2>' + FAQS.map(([q, a]) => '<h3>' + esc(q) + '</h3><p>' + esc(a) + '</p>').join('') +
    '<h2>How this page is organised</h2><p class="note">Disciplines and subcategories follow the Elecmetric master category register. Search looks at names, keywords, inputs, outputs and the discipline. Filters narrow the list and are not saved in the address, so the page itself is the only address to share. Results show ' + PER_PAGE + ' tools at a time.</p></main>' + FOOTC('../../');
  const crumbs = [['Elecmetric', BASE + '/'], ['Engineering calculators', calcUrl('index')], [TITLE, calcUrl('all-tools')]];
  const ld = BASE ? ldScript({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: crumbs.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) },
    { '@type': 'FAQPage', mainEntity: FAQS.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    { '@type': 'CollectionPage', name: TITLE, url: calcUrl('all-tools'), description: DESC, about: 'Online calculators, unit converters and engineering reference tools', numberOfItems: items.length }] }) : '';
  const script = '<script>(function(){var D=document;D.documentElement.className+=" js";var L=' + JSON.stringify(lookup).replace(/</g, '\\u003c') + ';' + fs.readFileSync(path.join(__dirname, 'all_tools_client.js'), 'utf8') + '})()</script>';
  const html = page('all-tools', TITLE, DESC, body, ld + '<style>' + css + '</style>', script, { url: BASE ? calcUrl('all-tools') : '', prefix: '../../' });
  /* Shared search index for the home page search: one compact row per catalogue entry, [name, url, discipline, type, engine-backed 0|1, search words]. Written to search-index.js by build_pages.js and loaded only when a visitor starts searching. */
  const regIds = new Set(REG.tools.map((t) => t.toolId));
  const search = items.map((it) => {
    const seen = {}, q = [it.name, cat[it.c].name, it.s ? sub[it.s].name : '', it.k, it.apps.join(' ')].concat(it.kw).join(' ').toLowerCase().split(/[^a-z0-9.]+/).filter((w) => w && !seen[w] && (seen[w] = 1)).join(' ').slice(0, 420);
    return [it.name, it.url, cat[it.c].name, famName(it.t), regIds.has(it.id) ? 1 : 0, q];
  });
  return { html, items, counts, title: TITLE, desc: DESC, lookup, search };
}
module.exports = { build, REG, PER_PAGE, TITLE, DESC };
