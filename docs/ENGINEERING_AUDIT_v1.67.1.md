# Elecmetric v1.67.1 engineering and publication audit

**Audit date:** 11 November 2026  
**Package examined:** `Elecmetric-v1_67_1-checked.zip`  
**Audit classification:** Software checks passed; technical publication approval remains pending.

## Executive result

The package is structurally sound and the automated test suite passes. The engine has 154 registered calculators and 3,026 independent reference vectors across those calculators. The build and deployment guard pass, but the package is **not ready to be described as standards-certified or fully technically approved**.

No unambiguous arithmetic defect was confirmed in the sampled high-risk calculations reviewed during this audit. That is not a declaration that all 154 calculations have been independently approved. Automated reference comparisons check mathematical behaviour; they do not prove that a formula, table constant, assumption or code interpretation is correct for every installation or the latest edition of a standard.

## Automated verification

| Check | Result |
|---|---:|
| Built-in calculator tests | 2,022 / 2,022 passed |
| Independent reference vectors | 3,026 / 3,026 passed across 154 calculators |
| Mathematical property tests | 480 / 480 passed |
| Calculator registry | 154 / 154 passed |
| Calculation bases | 32 / 32 passed |
| Number reader and grouping | 43 / 43 passed |
| AWG chart | 110 / 110 passed |
| Calculator pages | 418 / 418 passed |
| Standards handling | 33 / 33 passed |
| Conversion Centre | 2,265 / 2,265 passed |
| Feeder protective-device checks | 23 / 23 passed |
| Router | 226 / 226 first-result and 226 / 226 top-three checks passed |
| Total main test suite | 17,759 checks passed |

The production build produced 520 HTML pages. The deploy guard confirmed that canonical URLs, `og:url`, JSON-LD, sitemap and robots references are consistent for the configured production base URL (checked with `BASE_URL=https://elecmetric.com`; run without `BASE_URL`, the guard reports not launch-ready by design). The production asset check found the required local files for the service worker, page headers and web app manifest.

## Engineering checks performed

The following high-impact calculation families were reviewed for equation form, units, sign convention and stated assumptions:

- Three-phase and single-phase voltage drop, including parallel conductors.
- Transformer percentage impedance and terminal fault-current estimation.
- Cable derating, cable short-circuit `I²t` withstand and parallel cable sets.
- Transformer regulation and efficiency.
- Motor starting current, star-delta and autotransformer starting approximations.
- Earth rod and simplified earth-grid resistance.
- PV cold open-circuit voltage correction.
- Feeder load current, voltage drop, fault level, cable capacity and protective-device checks.
- AGL CCR loading, cable loss, maximum fittings, isolating-transformer ratios, brightness steps and light-intensity/distance estimation.

The equations appear mathematically consistent with their stated models in the sampled checks. These are calculations with explicit assumptions, not substitutes for equipment curves, manufacturer data, field tests or a complete engineering design.

## Findings and disposition

### High: standards edition alignment is not fully demonstrated

The existing calculation presets are not complete implementations of their named standards. Public status pages show that BS 7671:2018+A4:2026 is current, AS/NZS 3008.1.1:2025 supersedes the 2017 edition, IEC 60364-4-43:2023 is a technical revision/restructure, IEC 60364-5-52:2009+A1:2024 is the current consolidated text, and NFPA 70:2026 is listed. The current engine constants and references have not all been verified against these complete licensed editions.

**Disposition:** Updated `STANDARDS.md` to state the current edition status and the items that remain unverified. Do not market the presets as standards-compliant until a qualified reviewer checks the exact applicable editions.

### High: no recorded technical approvals

`tools/review_records.json` contains an empty `records` object. The site's own status logic therefore shows standards review and independent technical approval as pending for all 154 calculators.

**Disposition:** No reviewer record was fabricated. A qualified person must review each calculator and sign off the applicable standard, edition, assumptions and calculation output before records are added.

### Medium: cable temperature correction is an approximation

The Cable Derating calculator and Feeder Designer use `kt = √((θmax − Ta)/(θmax − Tref))`. This is a simplified steady-state heat-balance approximation, not the tabulated ambient correction factor from each named standard.

**Disposition:** Updated the output label, calculator explanation and Feeder Designer check text to call the factor approximate and require verification against the applicable standard/manufacturer tables. The numerical model was not silently changed because a valid replacement requires confirmed tables and installation method data.

### Medium: documentation counts were stale

`tests/README.md` listed outdated calculator-page and category-hub counts and counted five rather than seven number/utility converter pages.

**Disposition:** Corrected the counts to 126 dedicated calculator pages (19 hand-written and 107 generated), 13 category hubs, and seven number/utility pages.

### Pre-publication actions still required

1. Obtain a qualified independent review of every calculator, including its units, equation, limiting conditions, standard edition and sample results. Prioritize cable/protection/earthing/transformer and AGL circuit calculators.
2. Check standard-specific constants and references against licensed editions and manufacturer documentation. Resolve the outstanding BS 7671 A4:2026, AS/NZS 3008.1.1:2025 and IEC 60364-4-43:2023 cross-checks.
3. Have the Privacy and Terms pages legally reviewed and perform a trademark search for Elecmetric.
4. Complete real-device mobile, desktop, keyboard, screen-reader and offline-cache tests. The repository itself records these as outstanding.
5. Complete DNS, GitHub Pages custom-domain and HTTPS configuration before public launch.

## Files changed in this audit

- `engine.js`: clarified that the cable temperature multiplier is approximate in the result label, assumptions and Feeder Designer review message. No calculation equation or numerical constant was changed.
- `STANDARDS.md`: replaced ambiguous/overconfident wording with an edition-status register, scope limitations and explicit review actions.
- `tests/README.md`: corrected calculator pages, category hubs and number/utility page counts.
- `docs/ENGINEERING_AUDIT_v1.67.1.md`: this audit record.

## Final disposition

**Suitable for continued controlled testing and technical review. Not yet suitable for an unqualified claim of full engineering correctness, standards compliance or independent technical approval.** Keep the review status pending until qualified reviews are completed and recorded.
