# Elecmetric

**Electrical Engineering Calculations & Tools**  
Calculate. Convert. Understand.

Elecmetric is a browser-based electrical engineering calculator platform. It includes 246 calculators, a searchable calculator library, conversion tools, formula references, and AGL-related engineering calculators.

Website: [https://elecmetric.com](https://elecmetric.com)

## Project structure

| Path | Purpose |
|---|---|
| `index.html` | Main calculator application and verification report |
| `engine.js` | Shared calculation engine and calculator registry |
| `calculators/` | Calculator pages and category hubs |
| `pages/` | Search-focused conversion and calculation pages |
| `converters/` | Conversion Centre and formula/reference pages |
| `technical-library/` | Technical Library root (tree of branches), one folder per branch, and the hand-written article pages in `technical-library/technical-articles/` |
| `tools/` | Page generators, deployment checks, and review registers |
| `tests/` | Built-in, reference-vector, property, and route tests |
| `.github/workflows/pages.yml` | GitHub Actions test, build, and deployment workflow |

The production build generates 676 sitemap URLs: the home page, 79 pages in `pages/`, 292 in `calculators/`, 295 in `converters/`, 2 in `technical-library/` and 7 in `categories/` (the library root and the Technical Articles branch).

The Technical Library landing page (`technical-library/index.html`) is generated from `tools/library_catalogue.json` (the 200-article master catalogue). Articles are written by hand, one file each, in `technical-library/technical-articles/` (no further sub-folders), named `<slug>.html` as listed in `tools/library_tracker.csv`. Start each one from `tools/library_article_template.html`. After adding a file, run `node tools/build_pages.js`: its card on the landing page changes from "Coming soon" to "Published" and links to it. Hand-written article pages are not added to the sitemap automatically.

## Run locally

Requirements: Node.js 22 or later. No npm packages are required.

Run the test suite:

```bash
node tests/run_tests.js
node tests/router_test.js
node tests/category_pages_test.js   # Category landing pages (/categories/) and tool-page breadcrumbs: every category page, upcoming tools, indexing rule, 304 trails, JSON-LD
node tests/master_architecture_test.js   # Master Category Architecture v1.0: every tool classified, IDs and generated docs current (node tools/build_master_architecture.js regenerates)
node tests/halflife_test.js   # Half-Life Calculator (Mode 01; also gen_halflife_vectors.py)
node tests/halflife_const_test.js   # Half-Life Calculator Mode 02, decay constant and mean lifetime (also gen_halflife_const_vectors.py)
node tests/halflife_percent_test.js   # Half-Life Calculator Mode 03, remaining and decayed percentage (also gen_halflife_percent_vectors.py)
node tests/halflife_table_test.js   # Half-Life Calculator Mode 04, decay table and graph (also gen_halflife_table_vectors.py)
node tests/halflife_eng_test.js     # Half-Life Calculator Mode 05, Engineering Exponential Decay (also gen_halflife_eng_vectors.py)
node tests/exponent_test.js   # Exponent Calculator Mode 01, power calculator (also gen_exponent_vectors.py)
node tests/exponent_frac_test.js   # Exponent Calculator Mode 02, negative and fractional exponents (also gen_exponent_frac_vectors.py, needs sympy and mpmath)
node tests/exponent_solver_test.js   # Exponent Calculator Mode 03, missing value solver (also gen_exponent_solver_vectors.py, needs sympy and mpmath)
node tests/exponent_laws_test.js   # Exponent Calculator Mode 04, exponent laws (also gen_exponent_laws_vectors.py, needs mpmath)
node tests/exponent_eng_test.js   # Exponent Calculator Mode 05, engineering powers and scientific notation (also gen_exponent_eng_vectors.py, needs mpmath)
node tests/binarith_test.js   # Binary Arithmetic Calculator (Binary Calculator Mode 01)
node tests/numconv_test.js    # Number System Converter (Binary Calculator Mode 02)
node tests/bitops_test.js     # Bitwise Operations Calculator (Binary Calculator Mode 03; also gen_bitops_vectors.py)
node tests/signbin_test.js    # Signed Binary Calculator (Binary Calculator Mode 04; also gen_signbin_vectors.py)
node tests/dlogic_test.js     # Digital Logic Calculator (Binary Calculator Mode 05; also gen_dlogic_vectors.py)
node tests/hex_test.js        # Hex Calculator, five modes (also gen_hex_vectors.py)
node tests/binlogic_test.js   # Binary Calculator and Logic Gates
node tests/codes_test.js      # BCD and Gray Code converters
node tests/chars_test.js      # ASCII and Unicode converters
node tests/rng_test.js        # Random Number Generator (also gen_rng_vectors.py)
node tests/fraction_test.js   # Fraction Arithmetic Calculator (also gen_fraction_vectors.py)
node tests/fraction_simplify_test.js   # Fraction Simplifier (also gen_fraction_simplify_vectors.py)
node tests/fraction_convert_test.js    # Decimal & Fraction Converter (also gen_fraction_convert_vectors.py)
node tests/fraction_mixed_test.js      # Mixed Number Calculator (also gen_fraction_mixed_vectors.py)
node tests/fraction_adv_test.js        # Advanced Fraction & Ratio Tools incl. continued fractions (also gen_fraction_adv_vectors.py)
node tests/fraction_inch_test.js       # Fractional Inch and Millimetre Converter (also gen_fraction_inch_vectors.py)
node tests/fraction_report_test.js     # Calculation report on the six Fraction Calculator pages (tools/fraction_report.js)
node tests/percent_basic_test.js        # Percentage Calculator Mode 01, Basic Percentage (also gen_percent_basic_vectors.py)
node tests/pe_test.js                   # Percent Error Calculator Mode 01, Absolute Percent Error (also gen_pe_vectors.py)
node tests/pe_signed_test.js            # Percent Error Calculator Mode 02, Signed Error Analysis (also gen_pe_signed_vectors.py)
node tests/pe_tol_test.js               # Percent Error Calculator Mode 03, Tolerance Verification (also gen_pe_tol_vectors.py)
node tests/pe_batch_test.js             # Percent Error Calculator Mode 04, Batch Measurement Analysis (also gen_pe_batch_vectors.py)
node tests/matrix_test.js     # Matrix Calculator (also decomp_run.js, network_run.js, matfun_run.js)
node tests/quad_test.js       # Quadratic Formula Calculator, Mode 01 (also gen_quad_vectors.py; symbolic check: node tests/quad_run.js && python3 tests/verify_quad.py)
node tests/ratio_test.js     # Ratio Calculator, Mode 01 Ratio Simplifier (also gen_ratio_vectors.py)
node tests/proportion_test.js # Ratio Calculator, Mode 02 Proportion Solver (also gen_proportion_vectors.py)
node tests/gcf_test.js # GCF Calculator, Mode 01 Multiple Number GCF (also gen_gcf_vectors.py)
node tests/gcf_prime_test.js # GCF Calculator, Mode 02 Prime Factorisation GCF (also gen_gcf_prime_vectors.py)
node tests/bignum_test.js # Big Number Calculator, Mode 01 Big Integer Arithmetic (also gen_bignum_vectors.py)
node tests/equiv_test.js # Ratio Calculator, Mode 03 Equivalent Ratio Generator (also gen_equiv_vectors.py)
node tests/factor_test.js      # Factor Calculator, Mode 01 All Factors Finder (also gen_factor_vectors.py)
node tests/round_test.js # Rounding Calculator, Mode 01 Decimal Place Rounding (also gen_round_vectors.py)
node tests/sqrt_test.js        # Root Calculator, Mode 01 Square Root Calculator (also gen_sqrt_vectors.py)
node tests/cbrt_test.js        # Root Calculator, Mode 02 Cube Root Calculator (also gen_cbrt_vectors.py)
node tests/nthroot_test.js     # Root Calculator, Mode 03 General nth Root Calculator (also gen_nthroot_vectors.py, needs sympy and mpmath)
node tests/antilog_test.js     # Log Calculator, Mode 02 Antilog Calculator (also gen_antilog_vectors.py)
node tests/lcm_test.js # LCM Calculator, Mode 01 Multiple Number LCM (also gen_lcm_vectors.py, needs sympy)
node tests/log_solver_test.js  # Log Calculator, Mode 03 Missing Value Solver (also gen_log_solver_vectors.py, needs sympy and mpmath)
node tests/log_rules_test.js  # Log Calculator, Mode 04 Logarithm Rules (also gen_log_rules_vectors.py, needs sympy and mpmath)
node tests/quad_disc_test.js  # Quadratic Formula Calculator, Mode 02, discriminant and root analysis (also gen_quad_disc_vectors.py, needs sympy and mpmath)
node tests/quad_graph_test.js  # Quadratic Formula Calculator, Mode 03, parabola graph and vertex (also gen_quad_graph_vectors.py, needs sympy and mpmath)
node tests/quad_exact_test.js  # Quadratic Formula Calculator, Mode 04, factored form, vertex form and exact roots (also gen_quad_exact_vectors.py, needs sympy)
node tests/quad_eng_test.js  # Quadratic Formula Calculator, Mode 05, engineering solver for RLC circuits, control systems and mass-spring-dampers (also gen_quad_eng_vectors.py, needs sympy and mpmath)
```

To preview the site, serve the repository root with any local static HTTP server. Do not open only the HTML file directly when checking service-worker or browser features.

## Deploy with GitHub Pages

The repository is configured for GitHub Pages through GitHub Actions. The workflow:

1. Runs the calculator, reference-vector, integrity, and route tests.
2. Builds the production HTML pages, canonical URLs, structured data, sitemap, and robots file.
3. Runs the deployment and upload-asset guards.
4. Publishes the generated `_site` artifact to GitHub Pages.

### One-time GitHub setup

1. Push this project to a GitHub repository with the default branch named `main`.
2. Open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
3. For the production domain, add `elecmetric.com` under **Custom domain** in **Settings → Pages**, then complete the DNS configuration and enable **Enforce HTTPS** when GitHub makes it available.
4. Open **Settings → Secrets and variables → Actions → Variables** and add `BASE_URL` with the value `https://elecmetric.com`.
5. Open the **Actions** tab and check the latest **Elecmetric | Test and deploy to GitHub Pages** run.

The `BASE_URL` variable controls canonical URLs, social metadata, and the sitemap. It does not configure a GitHub Pages custom domain. For a repository-hosted URL instead, set it to the actual site URL, such as `https://OWNER.github.io/REPOSITORY`.

Pull requests run the tests and production build but do not publish. A push to `main` or a manual workflow run deploys the site.

## Build and verify manually

Linux / macOS:

```bash
BASE_URL=https://elecmetric.com node tools/build_pages.js
BASE_URL=https://elecmetric.com node tools/add_lastmod.js sitemap.xml
REQUIRE_LASTMOD=1 BASE_URL=https://elecmetric.com node tools/check_deploy.js
```

`add_lastmod.js` needs the full Git history (not a shallow clone); the deploy workflow already uses `fetch-depth: 0`. Do not set `SITE_LASTMOD` for the public site, as it gives every sitemap URL the same date (see `DEPLOY.md`).

PowerShell:

```powershell
$env:BASE_URL = "https://elecmetric.com"
node tools/build_pages.js
node tools/add_lastmod.js sitemap.xml
$env:REQUIRE_LASTMOD = "1"
node tools/check_deploy.js
```

Do not commit the output of a production build. GitHub Actions creates and uploads the production artifact automatically.

## Verification and engineering limitations

Automated tests check calculation behaviour against built-in tests and independent reference vectors. Public-scope checks identify relevant standards and editions, but a scope screen is not a licensed clause-by-clause standards review. Individual professional approval is not recorded unless a qualified reviewer has actually completed and documented that review. Results remain engineering references or estimates and must be checked against the applicable project requirements, licensed standards, and manufacturer data.

## Licence

All rights reserved. See [LICENSE](LICENSE). The source is provided for the Elecmetric project; no licence to copy, modify, republish, host, or resell it is granted without written permission.
