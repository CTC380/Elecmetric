# Coming-soon category hubs (v1.99.103)

Five hubs for subjects with no working calculators yet: Finance, Automotive, Science, AI and IoT.
Each page lists the calculators planned for that subject, in build order, with the formula, the inputs and the outputs of each.
It also links the existing Elecmetric tools that already help ("Related Tools You Can Use Today").

| Hub | URL | Planned tools |
|---|---|---|
| Finance | /calculators/finance-calculators/ | 8 |
| Automotive | /calculators/automotive-calculators/ | 8 |
| Science | /calculators/science-calculators/ | 8 |
| AI and Edge AI | /calculators/ai-calculators/ | 6 |
| IoT, wireless and sensors | /calculators/iot-calculators/ | 8 |

## Rules these pages follow
- Not calculators. They say "Coming soon" and carry no calculator control.
- `noindex,follow` and not in `sitemap.xml`, so planned-tool pages do not compete in search. The deploy guard (`tools/check_deploy.js`) refuses any page marked `data-coming-soon` that is indexable or in the sitemap.
- Kept out of All Tools, `master_register.json`, the engine and every calculator count. They are linked from the home page ("Coming Soon: More Calculator Categories") and from All Tools ("Browse Calculators by Subject").
- Heading structure follows the category template: H1, then "Related Tools You Can Use Today", "Upcoming <Subject> Calculators" (one H3 per planned tool), "How These Calculators Will Work", "Assumptions and Limitations", "Frequently Asked Questions", "Explore More Calculators".
- No page makes a claim that a planned tool exists. The "Planned" label and "can change" wording are deliberate.

## Where things are
- Content and generator: `tools/future_hubs.js` (edit the `HUBS` array only).
- Wired in `tools/build_pages.js` (`build()` returns `future`; the writer in `main` writes it). Heading standard is applied.
- Tests: section 31 of `tests/run_tests.js`; `tests/internal_link_graph_test.js` and `tests/site_pages_test.js` know about the hubs; the sw.js folder count is now 305.
- `sw.js` caches the five pages.

## Graduating a hub
When a subject has at least 3 working, tested calculators:
1. Add its entry to `tools/category_hubs.js` (the normal hub path, which needs divisions in the registry).
2. Delete its entry from `HUBS` in `tools/future_hubs.js`.
3. Rebuild. It becomes an indexable hub with a sitemap entry, and the home page and All Tools list it as a normal category.

## For review
- The choice and order of planned tools is an editorial judgement and needs your decision.
- Every formula shown is a standard textbook relation and was spot-checked numerically (EMI, balance after k payments, SIP, FSPL, LoRa bit rate, tyre diameter, mpg constants).
- The Molar Mass tool will need an atomic-mass table checked against IUPAC values before it is built.
