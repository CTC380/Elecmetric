# Elecmetric v1.80.1 technical audit

**Audit date:** 13 November 2026  
**Package examined:** `Elecmetric-v1_80_1-bridge-fix.zip`  
**Auditor:** Claude (an AI). This is not an independent qualified engineering review and records no approval.

## Result

Calculation spot-checks agree with independent derivations. One deployment defect was found and fixed: the Pages workflow did not publish `technical-library/`.

## Finding 1 (High, fixed): Technical Library missing from the deployed site

`sitemap.xml` lists `/technical-library/` and `/technical-library/technical-articles/`, and 531 pages link to the library (footer or nav on 375 pages in `calculators/`, 151 in `calculators/*/`, 5 on the home page). The `cp -r` step in `.github/workflows/pages.yml` did not copy `technical-library/`, so those URLs and links would return 404 in production. `DEPLOY.md` already listed the folder in the manual upload set. `check_deploy.js` and `check_assets.js --production` both passed because neither compares sitemap URLs or page links with the assembled upload folder.

**Fix:**
- `technical-library` added to the workflow `cp -r` line.
- New guard `tools/check_site.js`: every sitemap URL and internal `href`/`src` must resolve to a file in the upload folder. It is run after `check_assets.js` in the workflow.
- Two tests in `tests/run_tests.js` now require the folder and the guard in the workflow.
- Verified: on the old upload set the guard fails (533 problems); on the new one it passes (529 sitemap URLs, 538 pages, 61,615 internal links). Full suite: 18,897 checks pass.

## Finding 2 (Medium, open): common-mode risk in reference vectors

The v1.80.1 rectifier error was present in both `engine.js` and the vector generator (`pc_rect` in `tests/gen_vectors.py`), so the vectors agreed with the wrong engine. Passing vectors show consistency, not correctness. For high-risk calculators add reference cases from published worked examples or from a different author.

## Independent recomputation (13 checks, 0 failures)

Three-phase and single-phase current (with efficiency), three-phase voltage drop and single-phase with two parallel conductors, transformer fault current, motor current, power factor correction kVAR, earth rod resistance (Dwight), star-delta starting currents, and all four rectifier types. The three-phase bridge gives 540.19 V DC, 4.20% ripple, 18.006 A average diode current, as expected after the v1.80.1 fix.

## Other checks

- CSP is strict (self only, no remote origins); no `eval` or `new Function`; values prefilled from the URL hash are escaped and units are whitelisted, so no XSS path was found.
- Service-worker cache version equals the engine version.
- Production build with `BASE_URL=https://elecmetric.com`: 532 pages launch-ready.

## Open items (unchanged)

- `tools/review_records.json` holds 50 records, none an independent qualified approval. The team designation is a self-designation covering 157 of 164 calculators.
- Standards editions are not verified against licensed text; the cable temperature factor is an approximation.
- Real-device, screen-reader and offline tests, legal review of Privacy and Terms, and a trademark search are still outstanding.

## Not covered

Only a sample of the 164 calculators was recomputed. No browser, accessibility or mobile pass, no standards clause review.
