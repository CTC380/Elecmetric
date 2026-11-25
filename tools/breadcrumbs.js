#!/usr/bin/env node
/* Breadcrumbs for every tool page: Home > Category (Level 1) > Subcategory (Level 2) > Tool.
   The path comes from tools/master_architecture.json, the same registry that builds the category landing pages, so a tool can never show a
   category its landing page does not list. The Level 2 crumb links to the section of that name on the category page (#electrical-engineering).
   Same pattern as tools/heading_standard.js: build_pages.js applies it to what the generators return, and it can be run alone over the files on
   disk (node tools/breadcrumbs.js). It is idempotent: an earlier trail is removed before the new one is written.
   With a site address (production build) the page's JSON-LD BreadcrumbList is replaced by the same trail, so the visible and the marked-up
   path are one path. Without one the committed page carries the visible trail only. */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const ARCH = require('./master_architecture.json');

const slugify = (s) => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const unent = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&amp;/g, '&');
const L1 = {}; ARCH.level1.forEach((c) => { L1[c.id] = c; });
const BY_URL = {}; ARCH.tools.forEach((t) => { BY_URL[t.url] = t; });

const CSS = '<style data-crumbs>.crumbs{font-size:13px;color:var(--muted);margin:0 0 10px}.crumbs ol{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:2px 0}.crumbs li+li::before{content:"\\203A";margin:0 7px;opacity:.7}.crumbs a{color:inherit}.crumbs [aria-current]{color:var(--ink)}</style>';
const NAV_RE = /<nav class="crumbs"[^>]*>[\s\S]*?<\/nav>/;
const CSS_RE = /<style data-crumbs>[\s\S]*?<\/style>/;

/* Visible trail as HTML. items: [label, href|null]; the last item is the current page. */
function trailHtml(items) {
  return '<nav class="crumbs" aria-label="Breadcrumb"><ol>' + items.map(([label, href], i) => '<li>' + (i === items.length - 1 || !href ? '<span' + (i === items.length - 1 ? ' aria-current="page"' : '') + '>' + esc(label) + '</span>' : '<a href="' + href + '">' + esc(label) + '</a>') + '</li>').join('') + '</ol></nav>';
}
/* Where the page sits relative to the site root, as a "../" prefix. */
const prefixOf = (url) => /^\/calculators\/[^/]+\/$/.test(url) ? '../../' : /^\/(pages|converters)\/[^/]+$/.test(url) ? '../' : null;
const h1Of = (html) => { const m = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html); return m ? unent(m[1].replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim() : ''; };
const catUrl = (c) => 'categories/' + c.slug + '/';

/* The trail for a tool URL: [[label, href-relative-to-page, absolute path from the site root]...], or null when the page is not a registered tool. */
function trailFor(url, pageName) {
  const t = BY_URL[url], pre = prefixOf(url);
  if (!t || pre === null) return null;
  const c = L1[t.l1];
  return [['Home', pre, ''], [c.name, pre + catUrl(c), catUrl(c)], [t.l2Name, pre + catUrl(c) + '#' + slugify(t.l2Name), catUrl(c) + '#' + slugify(t.l2Name)], [pageName, null, url.replace(/^\//, '')]];
}
const ldNode = (trail, base) => ({ '@type': 'BreadcrumbList', itemListElement: trail.map(([name, , abs], i) => ({ '@type': 'ListItem', position: i + 1, name, item: base + '/' + abs })) });

/* Replace the trail and its JSON-LD in one page. url is the page's path from the site root ("/calculators/ohms-law/", "/pages/kw-to-amps.html"). */
function inject(html, url, base) {
  const trail = trailFor(url, h1Of(html));
  if (!trail) return html;
  let h = html.replace(NAV_RE, '').replace(CSS_RE, '');
  /* right after the charset meta, so later installers that append to <head> (calculation report, tool UX) never move it */
  h = h.indexOf('<meta charset="utf-8">') >= 0 ? h.replace('<meta charset="utf-8">', () => '<meta charset="utf-8">' + CSS) : h.replace('</head>', () => CSS + '</head>');
  const m = /<main[^>]*>/.exec(h); if (!m) throw new Error(url + ': no <main> to put the breadcrumb in');
  h = h.slice(0, m.index + m[0].length) + trailHtml(trail.map(([l, href]) => [l, href])) + h.slice(m.index + m[0].length);
  if (base) {
    h = h.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/, (all, body) => {
      const j = JSON.parse(body.replace(/\\u003c/g, '<')), node = ldNode(trail, base);
      if (j['@graph']) j['@graph'] = j['@graph'].filter((x) => x['@type'] !== 'BreadcrumbList');
      const out = j['@graph'] ? (j['@graph'].unshift(node), j) : { '@context': 'https://schema.org', '@graph': [node, j['@type'] === 'BreadcrumbList' ? null : (delete j['@context'], j)].filter(Boolean) };
      return '<script type="application/ld+json">' + JSON.stringify(out).replace(/</g, '\\u003c') + '</script>';
    });
  }
  return h;
}
/* What a test compares when it wants the generator's page without the trail. */
const strip = (html) => html.replace(NAV_RE, '').replace(CSS_RE, '');

module.exports = { inject, strip, trailFor, trailHtml, ldNode, slugify, BY_URL, NAV_RE };

if (require.main === module) {
  let n = 0, miss = 0;
  Object.keys(BY_URL).forEach((url) => {
    const f = path.join(ROOT, url.endsWith('/') ? url.slice(1) + 'index.html' : url.slice(1));
    if (!fs.existsSync(f)) { miss++; console.log('missing file for ' + url); return; }
    const cur = fs.readFileSync(f, 'utf8'), next = inject(cur, url, '');
    if (next !== cur) { fs.writeFileSync(f, next); n++; }
  });
  console.log('breadcrumbs: ' + n + ' pages updated, ' + (Object.keys(BY_URL).length - n - miss) + ' already current' + (miss ? ', ' + miss + ' missing' : ''));
  process.exit(miss ? 1 : 0);
}
