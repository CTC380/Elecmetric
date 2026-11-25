# Addendum to the v1.80.1 technical audit: link guard hardening

**Date:** 13 November 2026 · **Author:** Claude (an AI); not an independent qualified review.

A second look at `tools/check_site.js` (added for Finding 1) found gaps, each reproduced on a synthetic site and now fixed:

| # | Gap | Fix |
|---|-----|-----|
| 1 | Subpath deploys (`BASE_URL` with a path) failed on valid builds: the sitemap path kept its prefix | `BASE_URL` path is stripped from sitemap URLs and root-absolute links; links outside it are reported |
| 2 | Single-quoted and unquoted `href`/`src` were not scanned | Attribute parser accepts all three forms |
| 3 | A link could resolve to a real file outside the upload folder | Resolved paths may not leave the upload folder |
| 4 | A malformed `%` escape crashed with a `URIError` stack trace | Reported as a normal problem |
| 5 | `srcset`, CSS `url()` and `#fragment` targets unchecked | `srcset` and `url()` checked by default; `--fragments` opt-in for ids |
| 6 | Lookups followed the OS's case rules | Case-exact on every OS, as on GitHub Pages |
| 7 | No behavioural test | `tests/check_site_test.js` (22 checks), run by the workflow before the build |

Documentation counts in `DEPLOY.md` corrected: sitemap breakdown now sums to 529 (adds `technical-library/` 2), Conversion Centre total 295, calculator pages 136. The 136 figure follows from 19 hand-written + 117 generated and from the 152 total; confirm it against a real build.

Not re-run here: the full suite and the production build (package contains no `engine.js` or generator). Run `node tests/run_tests.js` and the workflow before release.
