/* Category landing pages: /categories/ (index) and /categories/<slug>/ for each of the 20 Level 1 categories of the Master Category Architecture.
   Everything countable (tools, subcategories, topics, tool types) is read from tools/master_architecture.json, the registry that also
   builds the breadcrumbs, so a page cannot list a tool that is not in the registry or miss one that is. The hand-written parts (scope,
   best-tool picks, limits, upcoming tools) are in tools/category_roadmap.js.
   Indexing rule (the same as the coming-soon hubs): a category page is indexable and listed in sitemap.xml only when the category has at
   least MIN_LIVE working tools. Below that the page exists for navigation but is noindex,follow and stays out of the sitemap, so a page that
   is mostly a plan never competes in search. The upcoming-tools lists are always visible.
   Planned tools are not tools: they have no page, no registry record and no place in any count or in All Tools. */
'use strict';
const ARCH = require('./master_architecture.json');
const { CATEGORY_CONTENT: CC } = require('./category_roadmap.js');
const BC = require('./breadcrumbs.js');
const DH = require('./disc_hub_ui.js');
const MIN_LIVE = 3;

const L1 = ARCH.level1, TOOLS = ARCH.tools;
const catOf = (slug) => L1.find((c) => c.slug === slug);
const toolsIn = (c) => TOOLS.filter((t) => t.l1 === c.id);
const short = (n) => n.replace(/\s*\([^)]*\)\s*$/, '');
const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');

const CSS = '<style>.cat-list{list-style:none;padding:0;margin:12px 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}.cat-card{border:1px solid var(--line);border-radius:12px;background:var(--surface);padding:4px 16px 14px}.cat-card h3{margin:12px 0 2px}.cat-card p{margin:6px 0;max-width:none}.cat-tag{font:600 12px var(--body);letter-spacing:.04em;text-transform:uppercase;color:var(--gold)}.cat-f span{display:block;font:600 12px var(--body);color:var(--muted);margin-bottom:2px}.cat-f code{display:block;background:var(--field);border:1px solid var(--line);border-radius:4px;padding:8px 10px;font-size:13px;overflow-wrap:anywhere}.cat-status{border-left:4px solid var(--gold);background:var(--gold-fill)}.cat-best{list-style:none;padding:0;margin:10px 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px}.cat-best a{display:block;text-decoration:none;border:1px solid var(--line);border-radius:10px;background:var(--surface);padding:10px 14px}.cat-best a:hover{border-color:var(--gold)}.cat-best strong{display:block}.cat-best span{font-size:13px;color:var(--muted)}.cat-topic{margin:10px 0 4px}.crumbs{font-size:13px;color:var(--muted);margin:0 0 10px}.crumbs ol{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:2px 0}.crumbs li+li::before{content:"\\203A";margin:0 7px;opacity:.7}.crumbs a{color:inherit}.crumbs a:hover{color:var(--ink)}.crumbs [aria-current]{color:var(--ink)}h3[id]{scroll-margin-top:76px}</style>';
const CAT_CSS = '<style>' + String.raw`.dh .cat-status{margin:14px 0 0;padding:10px 14px;font-size:14px;border-radius:12px}.dh-most{margin-top:10px}.cc-sec{border:1px solid var(--line);border-radius:14px;background:var(--surface);margin:12px 0;padding:0 16px 10px;box-shadow:var(--sh-0)}.cc-sec>summary{cursor:pointer;list-style:none;display:flex;align-items:center;gap:8px}.cc-sec>summary::-webkit-details-marker{display:none}.cc-sec>summary::after{content:"+";margin-left:auto;font:700 20px var(--body);color:var(--gold)}.cc-sec[open]>summary::after{content:"\2212"}.cc-sec>summary h3{margin:14px 0;font:700 17px var(--body);color:var(--ink)}.cc-sec h3 .note{font-weight:500}.cc-top{margin-top:4px}.cc-top .cat-topic{margin:12px 0 6px;font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}.cc-top .cat-topic strong{font-weight:600}.cc-chips{margin:0;display:flex;flex-wrap:wrap;gap:6px}.cc-chips .chip{margin:0;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:13.5px}.cc-top[hidden],.cc-sec[hidden],.cc-chips .chip[hidden]{display:none!important}.cc-plan{counter-reset:p;grid-template-columns:repeat(auto-fill,minmax(310px,1fr))}.cc-plan .cat-card{position:relative;counter-increment:p;border-style:dashed;padding:6px 16px 14px 56px}.cc-plan .cat-card::before{content:counter(p);position:absolute;left:14px;top:14px;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font:700 13px var(--body);background:var(--field);border:1px solid var(--line);color:var(--muted)}.cc-faq{border:1px solid var(--line);border-radius:12px;background:var(--surface);margin:8px 0;padding:0 16px}.cc-faq>summary{cursor:pointer;list-style:none;display:flex;gap:10px}.cc-faq>summary::-webkit-details-marker{display:none}.cc-faq>summary::after{content:"+";margin-left:auto;font:700 20px var(--body);color:var(--gold)}.cc-faq[open]>summary::after{content:"\2212"}.cc-faq h3{margin:12px 0;font:600 15px var(--body);color:var(--ink)}.cc-faq p{margin:0 0 14px}@media print{.dh-bar{display:none}}` + '</style>';
const CAT_JS = '<script>' + String.raw`(function(){var q=document.getElementById("dh-q"),t=document.getElementById("dh-t"),n=document.getElementById("dh-n"),e=document.getElementById("cc-e");if(!q)return;var secs=[].slice.call(document.querySelectorAll(".cc-sec")),k="all",small=matchMedia("(max-width:640px)").matches,h=location.hash.slice(1);function run(){var w=q.value.toLowerCase().split(/\s+/).filter(Boolean),c=0,on=w.length>0||k!=="all";secs.forEach(function(g){var gk=k==="all"||g.dataset.k===k,gv=0;[].forEach.call(g.querySelectorAll(".cc-top"),function(tp){var tv=0;[].forEach.call(tp.querySelectorAll(".chip"),function(x){var ok=gk&&w.every(function(y){return x.dataset.s.indexOf(y)>=0});x.hidden=!ok;if(ok){tv++;gv++;c++}});tp.hidden=!tv});g.hidden=!gv;if(on&&gv)g.open=true});if(e)e.classList.toggle("on",!c);n.textContent=on&&c?c+" tool"+(c===1?"":"s")+" shown":""}q.addEventListener("input",run);t&&t.addEventListener("click",function(ev){var b=ev.target.closest("button");if(!b)return;k=b.dataset.k;[].forEach.call(t.children,function(x){x.setAttribute("aria-pressed",x===b?"true":"false")});run()});if(small)secs.forEach(function(g){if(!h||!g.querySelector("#"+h))g.open=false});window.addEventListener("hashchange",function(){var x=document.getElementById(location.hash.slice(1));if(x&&x.closest(".cc-sec"))x.closest(".cc-sec").open=true});document.addEventListener("keydown",function(ev){if(ev.key==="/"&&!/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)){ev.preventDefault();q.focus()}})})();` + '</script>';
const IDX_CSS = '<style>.fb.w{max-width:1120px}.cc-grp{margin-top:6px}.cc-grp>h2{margin-top:26px}.cc-grp>h2 small{font:500 13px var(--body);color:var(--muted);letter-spacing:0;text-transform:none}.cc-g{grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}.cc-g .dh-c{padding:16px 16px 14px 66px;min-height:128px}.cc-g .dh-i{left:15px;top:16px;width:40px;height:40px;font-size:14px}.cc-g .dh-c b{font-size:16px;line-height:1.25}.cc-g .dh-c small{margin-top:4px;-webkit-line-clamp:4}.cc-m{display:block;height:6px;margin-top:10px;border-radius:99px;background:var(--field);border:1px solid var(--line);overflow:hidden}.cc-m i{display:block;height:100%;border-radius:99px;background:var(--gold-grad)}.cc-g .dh-c em{display:flex;flex-wrap:wrap;gap:2px 12px;margin-top:6px;color:var(--muted);font:500 12px var(--body)}.cc-g .dh-c em b{display:inline;font:700 13px var(--body);color:var(--num)}.cc-soon{opacity:.96}.cc-soon .dh-i{filter:saturate(.55)}.cc-pill{display:inline-block;margin-top:8px;padding:2px 9px;border:1px dashed var(--line);border-radius:999px;font:600 11.5px var(--body);color:var(--muted)}.cc-empty{display:none;margin:18px 0;padding:14px 16px;border:1px dashed var(--line);border-radius:12px;color:var(--muted)}.cc-empty.on{display:block}@media (max-width:640px){.cc-g{grid-template-columns:minmax(0,1fr)}.cc-g .dh-c{min-height:0!important}.cc-g .dh-c small{-webkit-line-clamp:2!important;display:-webkit-box!important}.cc-g:not(.dh-cat) .dh-c em{display:flex!important}}</style>';

/* Category accent colours. Each category has one hue of its own (a deliberate choice, not a rotation), so a visitor can tell categories apart
   by colour on the index and recognise the category on its own page. The brand navy and orange stay on the header, buttons and links.
   Lightness for the light theme is solved per hue so accent text keeps a 5.5:1 contrast on white and 4.8:1 on its own tint. */
const HUES = { 'engineering-technology': 214, 'mathematics': 262, 'finance-money': 152, 'unit-conversion-measurement': 188, 'physics-applied-science': 238,
  'computer-science-it': 280, 'business-economics': 330, 'construction-architecture': 44, 'statistics-data-analysis': 304, 'energy-environment': 98,
  'health-fitness': 354, 'automotive-transportation': 8, 'everyday-life-home': 66, 'chemistry': 126, 'biology-life-sciences': 172, 'education-exams': 56,
  'food-agriculture': 84, 'sports-recreation': 20, 'geography-astronomy': 202, 'design-media-photography': 316 };
const BRAND_HUE = 214;
const hsl2rgb = (h, s, l) => { s /= 100; l /= 100; const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return [f(0), f(8), f(4)]; };
const lum = ([r, g, b]) => { const c = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)); return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b); };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const lightL = (h) => { for (let l = 40; l >= 18; l--) { const ac = hsl2rgb(h, 68, l); if (ratio(ac, [1, 1, 1]) >= 5.5 && ratio(ac, hsl2rgb(h, 75, 95)) >= 4.8) return l; } return 18; };
const accentVars = (slug) => { const h = slug in HUES ? HUES[slug] : BRAND_HUE; return '--h:' + h + ';--al:' + lightL(h) + '%'; };

const ACCENT_CSS = '<style>' + String.raw`.dh,.dh-c{--ac:hsl(var(--h) 68% var(--al,34%));--ac-soft:hsl(var(--h) 75% 95%);--ac-line:hsl(var(--h) 45% 76%);--ac-on:#fff}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .dh,:root:not([data-theme="light"]) .dh-c{--ac:hsl(var(--h) 90% 72%);--ac-soft:hsl(var(--h) 45% 17%);--ac-line:hsl(var(--h) 40% 32%);--ac-on:#06142E}}
:root[data-theme="dark"] .dh,:root[data-theme="dark"] .dh-c{--ac:hsl(var(--h) 90% 72%);--ac-soft:hsl(var(--h) 45% 17%);--ac-line:hsl(var(--h) 40% 32%);--ac-on:#06142E}
main.dh{background:radial-gradient(640px 240px at 50% 0,var(--ac-soft),transparent 72%)}
.dh h1::after{width:72px;background:linear-gradient(90deg,var(--ac),var(--ac-line))}
.dh h2::before{background:var(--ac)}
.dh h3{color:var(--ink)}
.dh .dh-stats li{border-color:var(--ac-line);background:var(--ac-soft)}.dh .dh-stats b{color:var(--ac)}
.dh .cat-status{border-left:4px solid var(--ac);background:var(--ac-soft);border-color:var(--ac-line);border-left-color:var(--ac)}
.dh .dh-m{border-left:4px solid var(--ac)}.dh .dh-m:hover,.dh .dh-m:focus-visible{border-color:var(--ac-line);border-left-color:var(--ac);box-shadow:0 8px 18px -10px var(--ac)}
.dh .dh-m small{color:var(--muted)}
.dh .dh-t button[aria-pressed="true"]{background:var(--ac);border-color:var(--ac);color:var(--ac-on)}.dh .dh-t button:hover{border-color:var(--ac)}
.dh .dh-s input:focus{outline-color:var(--ac)}
.dh .chip:hover{border-color:var(--ac);background:var(--ac-soft)}
.dh .cc-chips .chip{background:var(--ac-soft);border-color:var(--ac-line);color:var(--ac);font-weight:600;box-shadow:0 1px 2px color-mix(in srgb,var(--ac) 20%,transparent);cursor:pointer}
.dh .cc-chips .chip::after{content:"\203A";margin-left:7px;font-weight:700;opacity:.65;display:inline-block;transition:transform .15s,opacity .15s}
.dh .cc-chips .chip:hover,.dh .cc-chips .chip:focus-visible{background:var(--ac);border-color:var(--ac);color:var(--ac-on);box-shadow:0 6px 14px -6px var(--ac)}
.dh .cc-chips .chip:hover::after,.dh .cc-chips .chip:focus-visible::after{transform:translateX(2px);opacity:1}
.dh .cc-chips .chip:active{box-shadow:none}
.dh .cc-sec{border-left:4px solid var(--ac)}.dh .cc-sec>summary::after,.dh .cc-faq>summary::after{color:var(--ac)}
.dh .cc-top .cat-topic{color:var(--ac)}
.dh .cat-tag{color:var(--ac)}.dh .cc-plan .cat-card::before{background:var(--ac-soft);border-color:var(--ac-line);color:var(--ac)}
.dh .cc-faq[open]{border-color:var(--ac-line)}
.dh .dh-c:hover,.dh .dh-c:focus-within{border-color:var(--ac)}
.dh .dh-i{color:var(--ac);background:var(--ac-soft);border:1px solid var(--ac-line)}
.dh .cc-m i{background:var(--ac)}.dh .cc-g .dh-c em b{color:var(--ac)}
.dh .cc-pill{border-color:var(--ac-line);color:var(--ac)}
.dh a:focus-visible,.dh summary:focus-visible,.dh button:focus-visible{outline:2px solid var(--ac);outline-offset:2px}
@media print{main.dh{background:none}}` + '</style>';

function build(ctx) {
  const { page, esc, FOOTC, ldScript, BASE } = ctx;
  const pages = {}, meta = [];
  const head = (up) => '<header><div class="w"><a class="brand" href="' + up + '"><img src="' + up + 'logo.png" alt="Elecmetric" width="160" height="40"></a><nav><a href="' + up + 'calculators/">Calculators</a><a href="' + up + 'calculators/all-tools/">All Tools</a><a href="' + up + 'categories/">Categories</a><a href="' + up + 'converters/index.html">Conversion Centre</a><a href="' + up + 'technical-library/">Technical Library</a></nav></div></header>';
  const link = (up, url) => up + url.replace(/^\//, '');
  const catHref = (up, c) => up + 'categories/' + c.slug + '/';
  const abs = (p) => BASE + '/' + p;
  const crumbsLd = (items) => ({ '@type': 'BreadcrumbList', itemListElement: items.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(p) })) });

  L1.forEach((c) => {
    const x = CC[c.slug]; if (!x) throw new Error('categories: no content for ' + c.slug);
    const up = '../../', mine = toolsIn(c), live = mine.length, indexable = live >= MIN_LIVE, plan = x.planned;
    const title = c.name + ' Calculators | Elecmetric', h1 = c.name + ' Calculators and Tools';
    if (title.length > 60) throw new Error(c.slug + ': title too long (' + title.length + ')');
    const desc = live ? 'Free ' + c.name + ' calculators and tools: ' + live + ' you can use now and ' + plan.length + ' planned, each with its formula, working and stated limits.' : c.name + ' calculators planned for Elecmetric: ' + plan.length + ' upcoming tools with their formulas. None is live yet.';
    if (desc.length < 50 || desc.length > 160) throw new Error(c.slug + ': description length ' + desc.length);

    const best = x.best.map((id) => { const t = mine.find((m) => m.id === id); if (!t) throw new Error(c.slug + ': best tool ' + id + ' is not in this category'); return t; });
    const bestHtml = best.length ? '<h2>Best ' + esc(c.name) + ' Tools You Can Use Today</h2><p class="note">The tools most people start with in this category. Each one shows its formula and working.</p><div class="dh-most">' + best.map((t) => '<a class="dh-m" href="' + link(up, t.url) + '"><b>' + esc(short(t.name)) + '</b><small>' + esc(t.toolType) + ' · ' + esc(t.l2Name) + '</small></a>').join('') + '</div>' : '';

    const sections = c.level2.filter((l) => l.existing).map((l) => {
      const topics = l.topics.map((tp) => {
        const ts = mine.filter((t) => t.l3 === tp.id).sort((a, b) => a.name.localeCompare(b.name));
        return '<div class="cc-top"><p class="cat-topic"><strong>' + esc(tp.name) + '</strong> <span class="note">(' + ts.length + ')</span></p><p class="cc-chips">' + ts.map((t) => '<a class="chip" href="' + link(up, t.url) + '" data-s="' + esc((t.name + ' ' + tp.name + ' ' + l.name).toLowerCase()) + '"' + (short(t.name) !== t.name ? ' title="' + esc(t.name) + '"' : '') + '>' + esc(short(t.name)) + '</a>').join('') + '</p></div>';
      }).join('');
      return '<details class="cc-sec" open data-k="' + BC.slugify(l.name) + '"><summary><h3 id="' + BC.slugify(l.name) + '">' + esc(l.name) + ' <span class="note">(' + plural(l.existing, 'tool') + ')</span></h3></summary>' + topics + '</details>';
    }).join('');
    const planned2 = c.level2.filter((l) => !l.existing).map((l) => l.name);
    const l2live = c.level2.filter((l) => l.existing);
    const finder = live >= 6 ? DH.finder('Search ' + c.name.toLowerCase() + ' tools: cable, motor, earthing…', 'Search tools in this category', [['all', 'All ' + live]].concat(l2live.map((l) => [BC.slugify(l.name), l.name.replace(/ Engineering$/, '')]))) : '';
    const browse = '<h2>Browse ' + esc(c.name) + ' by Subcategory</h2>' + (live ? finder + sections + '<p class="cc-empty" id="cc-e" role="status">No tool in this category matches that search. <a href="' + up + 'calculators/all-tools/">Search every tool</a>.</p>' :  '<p>No ' + esc(c.name) + ' tools are published yet, so there is nothing to browse. The subcategories below are the planned structure.</p>') +
      (planned2.length ? '<h3>Planned Subcategories</h3><p class="note">No tools yet. Listed so the structure is visible.</p><p>' + planned2.map((n) => '<span class="chip">' + esc(n) + '</span>').join('') + '</p>' : '');

    const also = x.also.length ? '<h2>Related Pages You Can Use Today</h2><p class="note">Existing Elecmetric pages that help with this subject.</p><p>' + x.also.map(([p, l]) => '<a class="chip" href="' + up + p + '">' + esc(l) + '</a>').join('') + '</p>' : '';
    const upcoming = '<h2>Upcoming Best ' + esc(c.name) + ' Tools</h2><p class="note">Planned, not built yet. These have no pages today and are not counted anywhere on Elecmetric. Order is the planned order; it can change. A tool is published only when it has worked examples and has been checked against separately written reference calculations.</p><ol class="cat-list cc-plan">' +
      plan.map(([name, what, f, type], i) => '<li class="cat-card"><h3>' + esc(name) + '</h3><p class="cat-tag">Planned, number ' + (i + 1) + ' of ' + plan.length + ' · ' + esc(type) + '</p><p>' + esc(what) + '</p><p class="cat-f"><span>Formula</span><code>' + esc(f) + '</code></p></li>').join('') + '</ol>';

    const faq = [
      ['How many ' + c.name + ' tools does Elecmetric have?', live ? 'This build has ' + plural(live, 'published tool') + ' in ' + c.name + ', and ' + plan.length + ' more are planned. The planned tools are listed on this page and are not available yet.' : 'None yet. ' + plan.length + ' tools are planned and listed on this page, and none is available yet.'],
      ['Are the upcoming ' + c.name + ' tools available?', 'No. Every tool under Upcoming Best is planned and has no page yet. It moves into the lists above only when it is built, tested and published.'],
      ['How are the ' + c.name + ' tools checked?', 'Each published calculator runs automated tests and shows its formula, working and assumptions. The verification status on each tool page records what review has actually been done, and no tool is marked independently verified unless its page says so.']
    ];
    const status = live ? '<div class="card cat-status" role="note"><strong>' + plural(live, 'tool') + ' live, ' + plan.length + ' planned.</strong> ' + (indexable ? '' : 'This category has fewer than ' + MIN_LIVE + ' published tools, so the page is kept out of search results and the sitemap until it has more. ') + 'The upcoming tools below are not built yet.</div>' : '<div class="card cat-status" role="note"><strong>No tools live yet, ' + plan.length + ' planned.</strong> This page is kept out of search results and the sitemap until the category has at least ' + MIN_LIVE + ' published tools. The planned tools below are not built yet.</div>';
    const related = x.related.map((s) => { const r = catOf(s); if (!r) throw new Error(c.slug + ': unknown related category ' + s); return '<a class="chip" href="' + catHref(up, r) + '">' + esc(r.name) + '</a>'; }).join('');

    const body = head(up) + '<main class="w dh" style="' + accentVars(c.slug) + '">' + BC.trailHtml([['Home', up], ['All Categories', up + 'categories/'], [c.name, null]]) + '<h1>' + esc(h1) + '</h1><p class="lede">' + esc(x.scope) + '</p><ul class="dh-stats"><li><b>' + live + '</b> tools live</li><li><b>' + (live ? l2live.length : c.level2.length) + '</b> ' + (live ? '' : 'planned ') + 'subcategories</li><li><b>' + plan.length + '</b> planned, not built yet</li></ul>' + status + bestHtml + also + browse + upcoming +
      '<h2>Assumptions and Limitations</h2><div class="card"><p style="margin:0">' + esc(x.limits) + '</p></div>' +
      '<h2>Frequently Asked Questions</h2>' + faq.map(([q, a]) => '<details class="cc-faq"><summary><h3>' + esc(q) + '</h3></summary><p>' + esc(a) + '</p></details>').join('') +
      '<h2>Explore More Categories</h2><p>' + related + '<a class="chip" href="' + up + 'categories/">All Categories</a><a class="chip" href="' + up + 'calculators/all-tools/">All Online Calculators and Tools</a></p></main>' + FOOTC(up);
    const url = abs('categories/' + c.slug + '/');
    const ld = BASE ? ldScript({ '@context': 'https://schema.org', '@graph': [crumbsLd([['Home', ''], ['All Categories', 'categories/'], [c.name, 'categories/' + c.slug + '/']]),
      { '@type': 'CollectionPage', name: h1, url, description: desc, inLanguage: 'en', isPartOf: { '@id': BASE + '/#website' } }]
      .concat(best.length ? [{ '@type': 'ItemList', name: 'Best ' + c.name + ' tools', itemListElement: best.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, url: abs(t.url.replace(/^\//, '')) })) }] : [])
      .concat([{ '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }]) }) : '';
    pages[c.slug] = page(c.slug, h1, desc, body, (indexable ? '' : '<meta name="robots" content="noindex,follow">') + ld + DH.STYLE + CSS + IDX_CSS + CAT_CSS + ACCENT_CSS, live >= 6 ? CAT_JS : '', { url: BASE ? url : '', prefix: up, title });
    meta.push({ slug: c.slug, id: c.id, name: c.name, live, planned: plan.length, indexable });
  });

  /* index of all categories */
  { const up = '../', total = TOOLS.length, title = 'All Calculator Categories | Elecmetric', h1 = 'All Calculator Categories';
    const desc = 'Browse the ' + L1.length + ' Elecmetric categories, from engineering and mathematics to finance and science, with the number of tools live and planned in each.';
    if (desc.length > 160) throw new Error('categories index: description length ' + desc.length);
    const card = (m, i) => { const c = catOf(m.slug), x = CC[m.slug], on = m.live > 0, pct = on ? Math.max(3, Math.round(100 * m.live / (m.live + m.planned))) : 0;
      return '<div class="dh-c' + (on ? '' : ' cc-soon') + '" data-k="' + (on ? 'live' : 'soon') + '" data-s="' + esc([m.name, x.scope, c.level2.map((l) => l.name + ' ' + (l.topics || []).map((tp) => tp.name).join(' ')).join(' ')].join(' ').toLowerCase()) + '" style="' + accentVars(m.slug) + '"><span class="dh-i" aria-hidden="true">' + esc(DH.ini(m.name)) + '</span><a href="' + m.slug + '/"><b>' + esc(m.name) + '</b></a><small>' + esc(x.scope) + '</small>' +
        (on ? '<span class="cc-m" role="img" aria-label="' + m.live + ' live, ' + m.planned + ' planned"><i style="width:' + pct + '%"></i></span><em><span><b>' + m.live + '</b> live</span><span><b>' + m.planned + '</b> planned</span></em>' : '<span class="cc-pill">Coming soon · ' + m.planned + ' planned</span>') + '</div>'; };
    const idx = meta.map((m, i) => [m, i]), liveCats = idx.filter(([m]) => m.live > 0).sort((a, b) => b[0].live - a[0].live), soonCats = idx.filter(([m]) => !m.live);
    const group = (h, note, list, k) => list.length ? '<section class="cc-grp" data-k="' + k + '"><h2>' + h + ' <small>(' + list.length + ')</small></h2><p class="note">' + note + '</p><div class="dh-g cc-g">' + list.map(([m, i]) => card(m, i)).join('') + '</div></section>' : '';
    const liveTotal = meta.reduce((a, m) => a + m.live, 0), plannedTotal = meta.reduce((a, m) => a + m.planned, 0);
    const body = head(up) + '<main class="w dh" style="' + accentVars('') + '">' + BC.trailHtml([['Home', up], ['All Categories', null]]) + '<h1>' + esc(h1) + '</h1><p class="lede">Elecmetric groups its ' + total + ' calculators and tools into ' + L1.length + ' subject categories. Engineering and mathematics are the most complete. The other categories list the tools that are planned next, clearly marked as not built yet.</p>' +
      '<ul class="dh-stats"><li><b>' + liveTotal + '</b> tools live</li><li><b>' + L1.length + '</b> categories</li><li><b>' + liveCats.length + '</b> with live tools</li><li><b>' + plannedTotal + '</b> planned, not built yet</li></ul>' +
      '<h2 id="browse">Browse Categories</h2>' + DH.finder('Search categories: cable, finance, statistics, solar…', 'Search categories', [['all', 'All ' + L1.length], ['live', 'Live now (' + liveCats.length + ')'], ['soon', 'Coming soon (' + soonCats.length + ')']]) +
      group('Live now', 'Categories with working calculators. The bar shows how much of the planned set is already built.', liveCats, 'live') +
      group('Coming soon', 'No tools are live here yet. Each page shows the planned tools and their formulas.', soonCats, 'soon') +
      '<p class="cc-empty" id="cc-e" role="status">No category matches that search. Try a broader word, or <a href="' + up + 'calculators/all-tools/">search every tool</a>.</p>' +
      '<h2>Looking for something specific?</h2><p><a class="chip" href="' + up + 'calculators/all-tools/">All Online Calculators and Tools</a><a class="chip" href="' + up + 'converters/index.html">Conversion Centre</a><a class="chip" href="' + up + 'technical-library/">Technical Library</a></p></main>' + FOOTC(up);
    const js = '<script>' + String.raw`(function(){var q=document.getElementById("dh-q"),t=document.getElementById("dh-t"),n=document.getElementById("dh-n"),e=document.getElementById("cc-e");if(!q)return;var cards=[].slice.call(document.querySelectorAll(".cc-g .dh-c")),grps=[].slice.call(document.querySelectorAll(".cc-grp")),k="all";function run(){var w=q.value.toLowerCase().split(/\s+/).filter(Boolean),c=0,on=w.length>0||k!=="all";cards.forEach(function(x){var ok=(k==="all"||x.dataset.k===k)&&w.every(function(y){return x.dataset.s.indexOf(y)>=0});x.hidden=!ok;if(ok)c++});grps.forEach(function(g){g.hidden=!g.querySelector(".dh-c:not([hidden])")});e.classList.toggle("on",!c);n.textContent=on&&c?c+" categor"+(c===1?"y":"ies")+" shown":""}q.addEventListener("input",run);t.addEventListener("click",function(ev){var b=ev.target.closest("button");if(!b)return;k=b.dataset.k;[].forEach.call(t.children,function(x){x.setAttribute("aria-pressed",x===b?"true":"false")});run()});document.addEventListener("keydown",function(ev){if(ev.key==="/"&&!/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)){ev.preventDefault();q.focus()}})})();` + '</script>';
    const url = abs('categories/');
    const ld = BASE ? ldScript({ '@context': 'https://schema.org', '@graph': [crumbsLd([['Home', ''], ['All Categories', 'categories/']]), { '@type': 'CollectionPage', name: h1, url, description: desc, inLanguage: 'en', isPartOf: { '@id': BASE + '/#website' } },
      { '@type': 'ItemList', name: 'Elecmetric categories', itemListElement: meta.map((m, i) => ({ '@type': 'ListItem', position: i + 1, name: m.name, url: abs('categories/' + m.slug + '/') })) }] }) : '';
    pages.index = page('categories', h1, desc, body, ld + DH.STYLE + CSS + IDX_CSS + ACCENT_CSS, js, { url: BASE ? url : '', prefix: up, title }); }
  return { pages, meta, MIN_LIVE };
}
module.exports = { build, MIN_LIVE, CSS };
