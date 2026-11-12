# Deploying Elecmetric

The committed files are deliberately **deploy-independent** (no canonical, JSON-LD or sitemap) so CI can prove the generated pages match the generator. The production build adds them.

## Manual
```
BASE_URL=https://elecmetric.com node tools/build_pages.js     # PowerShell: $env:BASE_URL="https://elecmetric.com"
SITE_LASTMOD=$(git log -1 --format=%cs) BASE_URL=https://elecmetric.com node tools/build_pages.js   # (run before the guard)
REQUIRE_LASTMOD=1 BASE_URL=https://elecmetric.com node tools/check_deploy.js    # must print "Launch-ready"
```
Upload: `index.html 404.html privacy.html terms.html engine.js sw.js manifest.webmanifest icon.svg icon-192.png icon-512.png icon-maskable-512.png apple-touch-icon.png logo.png og-image.png robots.txt sitemap.xml pages/ calculators/ converters/`, then run `node tools/check_assets.js <upload folder> --production`: it fails if `index.html` has no canonical (you are uploading the committed tree) or if any file the service worker, manifest or page heads need is missing (one missing file stops the offline cache from installing).
Optional: set `SITE_LASTMOD=YYYY-MM-DD` (the date of the last real content change) to add `<lastmod>` to the sitemap. Leave it unset rather than guess; the Pages workflow passes the last commit date.
A subpath is fine (`https://elecmetric.com/elecmetric`). Do not commit the output of a production build.

## GitHub Pages (automatic)
`.github/workflows/pages.yml` runs the tests, builds the production site, checks the generated pages and upload set, and deploys on every push to `main` or a manual workflow run. Pull requests run the test and build job but do not publish. The workflow uses Node.js 22 and the current GitHub Pages Actions.

One-time setup:
1. Push the repository to GitHub with `main` as the default branch.
2. Open **Settings > Pages** and set **Build and deployment > Source** to **GitHub Actions**.
3. To use `elecmetric.com`, enter `elecmetric.com` in **Settings > Pages > Custom domain**, save it, and configure the domain's DNS records for GitHub Pages. Enable **Enforce HTTPS** when GitHub makes it available. A custom workflow does not require a `CNAME` file in the upload artifact.
4. Add the repository Actions variable `BASE_URL` under **Settings > Secrets and variables > Actions > Variables**, with the full canonical site URL, for example `https://elecmetric.com`. This variable controls canonical URLs, social metadata and the sitemap. It does **not** configure the Pages custom domain.
5. For a default repository URL, set `BASE_URL` to `https://OWNER.github.io/REPOSITORY` instead. The workflow fallback is `https://elecmetric.com`, so set the variable explicitly if that is not your production URL.
6. After deployment, submit `<BASE_URL>/sitemap.xml` in Google Search Console and Bing Webmaster Tools.

The workflow builds into `_site/`, includes `.nojekyll`, runs `node tools/check_assets.js _site --production`, uploads the Pages artifact, and deploys it. Do not select **Deploy from a branch** while using this workflow.

## Conversion Centre (converters/)

`node tools/build_pages.js` also writes 295 pages to `converters/<slug>.html` from `tools/build_converters.js`: a hub with a universal unit converter, 27 category converters (including battery capacity and temperature difference and specific heat), 58 direction pages, a number base converter, a scientific notation converter, a DMS to decimal degrees converter, a dBm to watts converter, a dB to ratio converter, a binary calculator, an SI prefix converter, an AWG and SWG wire gauge converter, 5 reference pages, 153 formula articles and 43 worked-example pages (292 in all). Every factor comes from `UNITS` and `CONV_UNITS` in `engine.js`. They are served at `https://your.domain/converters/<slug>.html`, are checked by the deploy guard and are listed in the sitemap. Upload the `converters` folder with `pages`.

## Calculator pages (calculators/)

`node tools/build_pages.js` also writes 129 calculator pages (19 hand-written in `tools/calc_pages_data.js`, 110 generated from the registry by `tools/calc_pages_auto.js`), 13 category hubs, the standalone Basic Calculator (`tools/basiccalc_page.js`) and Scientific Calculator (`tools/scicalc_page.js`) and an engineering hub to `calculators/<slug>/index.html`. They are served at `https://your.domain/calculators/<slug>/` (trailing slash is the canonical form). Page content is in `tools/calc_pages_data.js`. Upload the `calculators` folder with `pages`. The deploy guard checks them like every other page, and the production sitemap lists 520 URLs: the homepage (1), `pages/` (79: 78 intent pages and the hub), `calculators/` (145: 129 calculator pages, the Basic Calculator, the Scientific Calculator, 13 category hubs and the engineering hub) and `converters/` (295).

## What the production build adds for search (SEO)
Everything below needs `BASE_URL`, so it is absent from the committed files and added by the build:
- `<link rel="canonical">` and `og:url` on every page; `og:image`, `og:image:*` and `twitter:image` pointing at `og-image.png` (1200x630, redrawn with `python3 tools/make_og_image.py`).
- JSON-LD: `BreadcrumbList` and `WebApplication` (free, with an `Offer` of 0) on every tool page, `FAQPage` generated from the same questions the page shows, `CollectionPage` on category hubs, `WebSite` on the home page.
- `sitemap.xml` (520 URLs, with `lastmod` when `SITE_LASTMOD` is set), the `Sitemap:` line in `robots.txt`, and a `noindex` `404.html`.
The guard fails the build if any of these is missing, mismatched or malformed. Always present, with or without `BASE_URL`: unique titles and descriptions, one `h1` per page, `og:site_name`, `summary_large_image` cards, and plain crawlable links from the home page (`Browse by topic`, `Popular conversions`).

## What is committed
The committed pages are deploy-independent (no canonical, og:url or JSON-LD). `sitemap.xml`, `robots.txt` and `404.html` use `https://elecmetric.com`. Never upload the committed tree as it is: run the production build and the guard first (or let the Pages workflow do it).

## Operator and contact checks (guard)
`node tools/check_deploy.js` also fails when `operator_name`, `operator_location` or `contact_email` in `tools/site_info.json` is empty. Set them before the first deploy. For a private staging build only, `ALLOW_UNSET_SITE_INFO=1` skips these checks.

## Contact address
The only place the contact address is set is `tools/site_info.json` (`contact_email`). It feeds the privacy and terms pages, the feedback box on every generated page, the generated `404.html` and the `contact` field in the page data. Any working address is accepted; the guard and the build no longer check which mail provider it is on.
