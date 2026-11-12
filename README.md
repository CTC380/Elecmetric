# Elecmetric

**Electrical Engineering Calculations & Tools**  
Calculate. Check. Understand.

Elecmetric is a browser-based electrical engineering calculator platform. It includes 157 calculators, a searchable calculator library, conversion tools, formula references, and AGL-related engineering calculators.

Website: [https://elecmetric.com](https://elecmetric.com)

## Project structure

| Path | Purpose |
|---|---|
| `index.html` | Main calculator application and verification report |
| `engine.js` | Shared calculation engine and calculator registry |
| `calculators/` | Calculator pages and category hubs |
| `pages/` | Search-focused conversion and calculation pages |
| `converters/` | Conversion Centre and formula/reference pages |
| `tools/` | Page generators, deployment checks, and review registers |
| `tests/` | Built-in, reference-vector, property, and route tests |
| `.github/workflows/pages.yml` | GitHub Actions test, build, and deployment workflow |

The production build generates 520 sitemap URLs: the home page, 79 pages in `pages/`, 145 in `calculators/`, and 295 in `converters/`.

## Run locally

Requirements: Node.js 22 or later. No npm packages are required.

Run the test suite:

```bash
node tests/run_tests.js
node tests/router_test.js
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
BASE_URL=https://elecmetric.com SITE_LASTMOD="$(git log -1 --format=%cs)" node tools/build_pages.js
REQUIRE_LASTMOD=1 BASE_URL=https://elecmetric.com node tools/check_deploy.js
```

PowerShell:

```powershell
$env:BASE_URL = "https://elecmetric.com"
$env:SITE_LASTMOD = (git log -1 --format=%cs)
node tools/build_pages.js
$env:REQUIRE_LASTMOD = "1"
node tools/check_deploy.js
```

Do not commit the output of a production build. GitHub Actions creates and uploads the production artifact automatically.

## Verification and engineering limitations

Automated tests check calculation behaviour against built-in tests and independent reference vectors. Public-scope checks identify relevant standards and editions, but a scope screen is not a licensed clause-by-clause standards review. Individual professional approval is not recorded unless a qualified reviewer has actually completed and documented that review. Results remain engineering references or estimates and must be checked against the applicable project requirements, licensed standards, and manufacturer data.

## Licence

All rights reserved. See [LICENSE](LICENSE). The source is provided for the Elecmetric project; no licence to copy, modify, republish, host, or resell it is granted without written permission.
