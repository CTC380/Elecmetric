#!/usr/bin/env node
/* Applies the Elecmetric heading standard (Global SEO Heading Strategy, Phases 2 and 3) to the generated pages.
   Run it LAST, after every page generator: node tools/heading_standard.js
   It rewrites only the visible text of H2 headings, never ids, anchors or links, and it is idempotent:
   the new wording is not a key in any rule, so a second run changes nothing. A page whose H1 does not
   fit a rule keeps its heading unchanged (no generic filler is ever forced in). */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const DIRS = ['calculators', 'pages', 'converters'];
const strip = (h) => h.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const SUFFIX = /(Calculator|Converter|Solver|Generator|Simplifier|Tool)$/;

/* Rules that need the page name. head = H1 text before any colon; N = head without a trailing "Calculator". */
function nameRules(h1) {
  const head = strip(h1).split(':')[0].trim();
  if (!head || head.length > 60) return {};
  const isCalc = /Calculator$/.test(head);
  const N = isCalc ? head.replace(/\s*Calculator$/, '') : head;
  const r = {};
  r['Formula'] = N + ' Formula';
  r['Worked example'] = N + ' Worked Example';
  r['How it is calculated'] = isCalc ? 'How to Calculate ' + N : 'How the ' + head + ' Works';
  if (SUFFIX.test(head)) r['Try your own numbers'] = 'Use the ' + head;
  return r;
}
/* Rules that apply to every page. */
const GLOBAL = {
  'Frequently asked questions': 'Frequently Asked Questions',
  'Related calculators': 'Related Calculators and Tools',
  'Related': 'Related Calculators and Tools',
  'Assumptions': 'Assumptions and Limitations',
  'Inputs and results': 'Input Parameters and Results',
  'Formula guides and reference': 'Technical References',
  'Standards and further reading': 'Standards and Further Reading'
};
/* Directory pages: wording from the Global SEO Heading Strategy. Keys are the page paths. */
const PAGE = {
  'calculators/index.html': { 'Pick a calculator': 'Search Engineering Calculators', 'Most used': 'Popular Engineering Calculators', 'Browse by engineering discipline': 'Browse Calculators by Engineering Discipline', 'More tools': 'More Calculators and Tools' },
  'pages/index.html': { 'Pick a conversion': 'Search Electrical Conversions', 'Most used': 'Popular Electrical Conversions', 'More tools': 'More Calculators and Tools' },
  'converters/index.html': { 'Most used conversions': 'Popular Online Unit Converters', 'Find the right converter': 'Find the Right Converter', 'All popular conversions': 'All Popular Conversions' }
};
/* standardise(rel, html): rel is the page path from the site root, for example calculators/ohms-law/index.html */
function standardise(rel, s) {
  const m = s.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const rules = Object.assign({}, GLOBAL, m ? nameRules(m[1]) : {}, PAGE[rel] || {});
  return s.replace(/(<h2(?:\s[^>]*)?>)([^<]*)(<\/h2>)/g, (all, a, text, c) => {
    const key = text.trim();
    return Object.prototype.hasOwnProperty.call(rules, key) ? a + rules[key] + c : all;
  });
}
function walk(d, out) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p, out); else if (f.endsWith('.html')) out.push(p);
  }
  return out;
}
if (require.main === module) {
  let files = 0, changed = 0;
  for (const dir of DIRS) {
    for (const p of walk(path.join(ROOT, dir), [])) {
      const rel = path.relative(ROOT, p).split(path.sep).join('/');
      const s = fs.readFileSync(p, 'utf8'); files++;
      const out = standardise(rel, s);
      if (out !== s) { fs.writeFileSync(p, out); changed++; }
    }
  }
  console.log('heading standard: ' + changed + ' of ' + files + ' pages changed');
}
module.exports = { standardise, nameRules, GLOBAL, PAGE };
