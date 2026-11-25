# Technical Library: how to add sections and entries

The Technical Library is a **tree**. The root is `technical-library/` (the overview page). Each **section** is a branch under it: Technical Articles, Formula Library, Diagram Library, Case Studies, MCQ Centre, Worked Examples and Glossary. Technical Articles is a branch like the others, not the root. One registry file drives all of them, so a new branch is one entry, not a redesign.

```
technical-library/                      root: overview and tree of branches
  technical-articles/                   branch: list of articles
    <article-slug>.html                 leaf: one article
  formula-library/   diagram-library/   case-studies/   mcq-centre/   worked-examples/   glossary/
```

## The registry: `tools/library_sections.json`
One object per section:

| Field | Meaning |
|---|---|
| `id` | Short stable key (`formulas`, `mcq`). Used for the active tab. |
| `name` | Name shown in the tab bar, section cards and page title. |
| `slug` | Folder under `technical-library/`. Every branch has one (`technical-articles`, `formula-library`, ...). |
| `status` | `live` or `planned`. |
| `idPrefix` | Entry ID prefix: `TL`, `FL`, `DL`, `CS`, `MCQ`, `WE`, `GL`. |
| `order` | Position in the tab bar and cards. |
| `short` | One-line summary for the cards and meta description. |
| `description`, `will`, `fields`, `related` | Text for the planned-section page (what it will contain, what each entry includes, links to related parts of the site that exist now). |

What the registry generates when you run `node tools/build_pages.js`:
- the tab bar under the header on every library page (Overview first, then one tab per branch),
- the tree of branches on the library root page,
- one page per `planned` section at `technical-library/<slug>/index.html` (marked `noindex`, left out of the sitemap),
- the theme button, Home link and full site footer on all of them.

## Add a new section
1. Add an object to `tools/library_sections.json` with `status: "planned"`.
2. Run `node tools/build_pages.js` and `node tests/run_tests.js`.
3. The tab, card and placeholder page appear on their own.

## Take a section live
1. Write the section's builder (copy the pattern in `tools/build_library.js`): a catalogue file such as `tools/library_<id>_catalogue.json`, a card per entry, filters, and entry pages at `technical-library/<slug>/<entry-slug>.html`.
2. Return its index page from `build()` as `pages['<slug>/index.html']` (this replaces the placeholder), add the URL to `indexable`, and set `status` to `live`.
3. Keep the section tab, header, footer and theme button by building pages with the same `HEAD(up, id)` and `FOOT(up)` helpers.
4. Add its URLs to the sitemap and the deploy check, then run the tests.

## Rules every section follows
- **URLs:** `technical-library/<slug>/` for a branch, `technical-library/<slug>/<entry-slug>.html` for an entry. Articles are `technical-library/technical-articles/<article-slug>.html`.
- **IDs:** `<prefix>-<number>`, zero-padded to three digits, never reused.
- **Status of an entry:** planned, drafted, technically reviewed, published. Only reviewed entries are indexable and listed in the sitemap. Everything else is `noindex`.
- **Links:** every entry links to the calculator that does its arithmetic and to at least one related entry in another section (formula to article, article to worked example, MCQ to formula).
- **Look:** use the shared card, hero, panel and tab styles (orange brand colour, light and dark themes). Do not add a new colour per section.
- **Phones:** each page must work at 360 px wide with no sideways scrolling, except inside tables and diagrams.

## Suggested entry fields per section
- **Formula Library:** name, equation, variables with units and ranges, assumptions and limits, related calculator, article and standard.
- **Diagram Library:** title, diagram type, symbol standard, legend, caption, SVG and PNG downloads, related article.
- **Case Studies:** title, problem and site conditions, data, calculation route, result, decision, lessons learned.
- **MCQ Centre:** question, four options, correct answer, worked explanation, topic, difficulty, related formula.
- **Worked Examples:** problem, given values with units, numbered steps, checked result, calculator link with prefilled values.
- **Glossary:** term, definition, example, symbol and unit, source standard, related terms.
