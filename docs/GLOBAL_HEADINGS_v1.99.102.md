# Global SEO Heading Strategy: applied (v1.99.102)

Home page (Phase 1)
- Title, meta description, Open Graph and Twitter text, H1, hero text and the static H2/H3 browse section follow the strategy. Only categories with working pages are listed.
- Tagline is now "Calculate. Convert. Understand." everywhere (137 places: pages, generators, tests, docs).
- New social image og-image.png (tools/make_og_image.py).

Directories (Phase 2)
- All Tools: title and H1 "All Online Calculators and Tools"; H2s Search All Calculators and Tools, Browse Tools by Calculation Type, Browse Calculators by Subject, Frequently Asked Questions (with matching FAQPage markup).
- /calculators/ stays electrical-focused: H2s now Search Engineering Calculators, Popular Engineering Calculators, Browse Calculators by Engineering Discipline, More Calculators and Tools.
- Conversion Centre: Popular Online Unit Converters, Find the Right Converter, All Popular Conversions. Electrical conversions index: Search Electrical Conversions, Popular Electrical Conversions.

Individual pages (Phase 3)
- tools/heading_standard.js rewords H2 text on calculator, conversion and formula pages from the page's own H1: "<Name> Formula", "<Name> Worked Example", "How to Calculate <Name>" (or "How the <Tool> Works"), "Use the <Name> Calculator", "Input Parameters and Results", "Assumptions and Limitations", "Frequently Asked Questions", "Related Calculators and Tools", "Technical References". Pages whose H1 does not fit keep their heading.
- It runs inside build() in tools/build_pages.js, so every rebuild reproduces it. It can also be run alone: node tools/heading_standard.js (idempotent). Ids, anchors and links are untouched.
- Tests and the deploy guard were updated to the new wording. The FAQ cross-check in tools/check_deploy.js now matches the capitalised heading (it would have silently skipped every page otherwise) and exempts the home page and Technical Library.

Coming-soon hubs for Finance, Automotive, Science, AI and IoT were added in v1.99.103 (see docs/FUTURE_HUBS_v1.99.103.md). Not done: the Engineering Mathematics hub keeps its name.

## v1.99.104 follow-up
- Mathematics hub (/calculators/engineering-mathematics/): H1 and title now "Online Mathematics Calculators". Sections follow strategy section 5: Popular Mathematics Calculators, Basic Mathematics Calculators, Algebra and Equation Calculators, Exponents, Powers and Roots, Probability and Statistics Calculators (one H3 per tool), then the full list, Mathematics Formulas and Worked Examples and a four-question FAQ with FAQPage markup. Content lives in tools/math_hub.js. The URL slug is unchanged so no links or sitemap entries move.
- All Tools: H3 subject groups (Engineering, Mathematics, Electronics, Unit Converters, Everyday), plus Popular Calculators and Recently Added Calculators. The recent list is hand-kept in tools/build_all_tools.js (RECENT_URLS): update it when a release adds a calculator. "Browse Tools by Calculation Type" stays above the results because it holds the filter chips that drive the page.
- Home FAQ: added "Can I use the calculators directly in my browser?" and "How are calculation formulas determined?".
- The FAQ cross-check in tools/check_deploy.js and tests/run_tests.js now counts only the H3 questions inside the FAQ section, so a page may carry other H3 sections.
- Not changed, by decision: the home meta description still says "science" (strategy wording).
