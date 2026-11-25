# FAQ check and fix, v1.99.101

Found by re-reading every FAQ answer in the build (2,204 questions on 281 pages) against the review workbook, the page engines and the worked examples.

1. **Wrong example on the Decay Table page.** The "8.02 days against 12 hours" example passed the wrong option names (`hu`, `uB`) to the engine, so it silently used years for both. B showed 17.6777% left; the correct value is 8.67362 x 10^-17% (60 half-lives). Fixed in `tools/halflife_table_page.js`, the table row and the FAQ answer.
2. **Merged answers had no question in front of their parts** (49 answers on 22 pages, e.g. a bare "Yes." or "Because..."). `tools/faq_trim_leads.js` puts each part's original question in front of it as a bold run-in. No wording changed.
3. **"currency symbol on the results None"** in five worked-example answers now reads "no currency symbol on the results" (fixed in `tools/faq_specific.js` too).
4. **Circle Calculator "What do I need to enter?"** read "Enter the value you know and value." Rewritten (also in `tools/faq_enter.js`).
5. **Matrix e^A answer** began with the fragment "Not the raw series..." Reworded.
6. **Unsupported roadmap wording removed** ("complex results are planned...", "symbolic algebra is a later development") on three exponent pages.

Not changed (already failing before this fix): `tests/fraction_report_test.js` and `tests/percent_report_test.js` (one "installer is idempotent" check each), `tests/site_pages_test.js` (3 inboundFrom checks), and 3 payback mismatches reported by `tools/check_example_vs_engine.js` (unit/format differences in the checker, not wrong numbers).

## Second pass: standards lists (AGL, cable, transformer, power pages checked)

7. **Unrelated standards on 35 pages.** The "Standards and further reading" block and its FAQ answer came from the category, so for example the Data Centre PUE page cited the indoor-lighting standard EN 12464-1 and Railway Backup Load cited IEC 60909 and IEEE 519. `tools/calc_refs_by_page.js` now gives these pages their own list (or "no single standard sets the method" where none is well known); `tools/calc_refs_fix.js` applies it to the built pages and `tools/build_pages.js` uses it on rebuild. Please review the standard numbers I chose before publishing.

The AGL, cable-resistance, voltage-drop, conduit-fill, transformer-loading, turns-ratio and parallel-cable worked examples and table ends were recomputed by hand and match.
