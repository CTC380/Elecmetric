# Elecmetric launch checklist

These three items cannot be done inside the repository. Tick each box only when it has really been done, and record the date and who did it. Nothing here is a claim that it has been done.

## 1. Domain, HTTPS and deployment (elecmetric.com)

Why: the roadmap still lists DNS and the GitHub Pages custom domain as not set up, and `elecmetric.com` did not resolve from the audit environment. Whether the site is live anywhere else is unconfirmed.

Order matters: add the domain in GitHub first, then the DNS records. GitHub warns that DNS set up before the domain is added to the repository can let someone else host a site on it.

- [ ] Own the domain `elecmetric.com` (registrar account secured with two-factor sign-in; auto-renew on).
- [ ] Repository: Settings > Pages > Source: **GitHub Actions** (the workflow in `.github/workflows/pages.yml` publishes).
- [ ] Optional but recommended: verify the domain in your GitHub account settings (Pages > Add a domain) to prevent takeover.
- [ ] Repository: Settings > Pages > Custom domain: enter `elecmetric.com`, Save.
- [ ] At the DNS provider add four **A** records on the apex (`@`): `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`. For IPv6 add four **AAAA** records: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`. (Check these against the current GitHub Pages documentation on the day, since GitHub can change them.)
- [ ] Add a **CNAME** for `www` pointing to `<your-github-username>.github.io`. GitHub then redirects between `www` and the apex automatically.
- [ ] No wildcard DNS records.
- [ ] Wait for DNS (up to 24 hours). Check: `dig elecmetric.com +short` returns the four addresses (Windows: `Resolve-DnsName elecmetric.com`).
- [ ] Settings > Pages > **Enforce HTTPS** ticked once the certificate is issued.
- [ ] Repository variable `BASE_URL` is unset or equals `https://elecmetric.com`.
- [ ] Run the workflow (push to `main` or Run workflow). It must pass tests, the production build and `check_deploy.js` ("Launch-ready").
- [ ] Open in a clean browser: `https://elecmetric.com/`, `/calculators/`, `/converters/`, `/privacy.html`, `/terms.html`, `/sitemap.xml`, `/robots.txt`, and a made-up path (should show the 404 page).
- [ ] `http://elecmetric.com` redirects to HTTPS; `www.elecmetric.com` redirects to the apex.
- [ ] View source of the home page: canonical is `https://elecmetric.com/`; no `noindex` outside `404.html`.
- [ ] Submit `https://elecmetric.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools; inspect the home page URL in Search Console.
- [ ] Offline check: load the site, go offline, reload; the app shell still opens.
- [ ] Contact address: confirm `contact_email` in `tools/site_info.json` is a mailbox you read (any provider is accepted by the guard since v1.73.8).
- [ ] Operator details: set `operator_name` and `operator_location` in `tools/site_info.json` (the person or company that runs the site), rebuild, retest. The deploy guard fails while either is empty (v1.73.7).
- [ ] Set up an uptime check (any monitor that requests the home page and `sitemap.xml`).

## 2. Accessibility test plan (real devices and assistive technology)

Existing evidence: a headless Chromium pass on an older release and an automated axe-core scan of all 520 HTML pages on v1.66.0 (WCAG 2.0, 2.1 and 2.2 A and AA plus best-practice, light mode at 1280 px; no violations). Automated scanning finds only part of the problems, so this plan needs people on real devices. Record the browser, device, assistive technology and version for every result.

Pages to cover: app home and search; one calculator in Simple and in Engineering mode; Feeder Designer; calculation sheet (Print/PDF and Excel export buttons); the API console; one calculator landing page (for example `/calculators/cable-size/`); one conversion page; the converters hub; privacy and terms; the "Write how to improve this page" box.

Environments (minimum): desktop Windows with NVDA and Firefox or Chrome; desktop macOS with VoiceOver and Safari; iPhone with VoiceOver and Safari; Android with TalkBack and Chrome.

For each page tick:
- [ ] **Keyboard only:** every control reachable with Tab and Shift+Tab in a logical order; visible focus on every control; no keyboard trap; Enter or Space activates buttons; Escape closes anything that opens.
- [ ] **Skip and landmarks:** page has one `h1`, a sensible heading order, and landmarks (header, nav, main, footer) that the screen reader lists.
- [ ] **Forms:** every input has a spoken label; units and options are announced; errors are announced and tied to the field; required or optional is stated.
- [ ] **Results:** after pressing calculate (or changing a value) the new result and any warnings are announced without moving focus away.
- [ ] **Buttons and toggles:** favourite star, theme toggle, mode switch, number-grouping toggle announce their name and state (pressed or not).
- [ ] **Tables:** formula and example tables have header cells and read in a sensible order.
- [ ] **Zoom and reflow:** 200% zoom and a 320 px wide window with no sideways scrolling of the main content and nothing cut off; text-only zoom to 200% is usable.
- [ ] **Colour:** light, dark and the system theme meet text contrast (4.5:1 normal text, 3:1 large text and controls); information is never given by colour alone, including the PASS and FAIL checks in Feeder Designer.
- [ ] **Touch targets** on a phone are easy to hit; no action needs a gesture other than a tap.
- [ ] **Motion and timing:** nothing flashes; nothing times out.
- [ ] **Print and PDF:** the calculation sheet is readable when printed or saved as PDF.
- [ ] **Offline and install:** installing as an app and opening offline works with the screen reader.

Result record: for each failure note page, steps to reproduce, assistive technology and version, and WCAG 2.2 criterion. Fix, retest, and only then update the roadmap. Do not publish an accessibility statement claiming conformance until this plan has been completed and passed.

## 3. Legal review brief (for a lawyer)

Give the lawyer `privacy.html`, `terms.html`, this section and the facts below. Both pages are marked as drafts. The governing law is currently set to India. Ask the lawyer to confirm that, and which privacy law applies to visitors from other countries. This is a list of questions, not legal advice.

Facts about what the site does:
- Calculations run in the visitor's browser. No accounts, analytics, advertising or tracking cookies, and no calls to other companies' servers (a content-security policy enforces this).
- Browser storage holds: theme, number grouping, simple or engineering mode, favourites, recently used calculators, and the calculation sheet details the visitor types (project, sheet or reference, prepared by, checked by, revision). These stay on the device.
- A shared link carries input values in the web address.
- The feedback box opens the visitor's own email app; there is no server. Emails reach the contact address.
- The site is hosted by GitHub Pages, which may log IP addresses under its own policy.
- Results are for estimating. No independent technical review has been carried out and the site says so; the internal team record in `tools/team_review_approval.json` is not shown publicly. Individual professional sign-off is not represented.
- The site does not contain standards text or tables and is not affiliated with any standards body.

Questions for the lawyer:
- [ ] Is the privacy notice complete and accurate for India, and for visitors in the EU, UK and US? Is anything required that is missing (for example a named controller, a grievance contact, retention wording)?
- [ ] Is browser storage of names typed into the calculation sheet properly described and disclosed?
- [ ] Are the disclaimers (estimating tool, no warranty, limit of liability) enforceable and worded correctly, given that results may be used in safety-related electrical work? Should any wording be stronger or placed more visibly (for example on each result)?
- [ ] Is "professional advice" wording, and the statement that results are not a substitute for a design review, sufficient?
- [ ] Use of standards names (IEC, IS, BS, NEC, AS/NZS, ICAO, FAA): is the current wording safe, and is the statement that no standard text is reproduced accurate?
- [ ] Trademark: search and advise on "Elecmetric" and the logo in India and the markets you target; advise on registration.
- [ ] Copyright and ownership wording; open-source or licence position of the code and of user-generated calculation sheets.
- [ ] Is a contact or legal-entity name required on the site? (The footer currently says "Developed by Elecmetric" and names no person or company.)
- [ ] Anything needed before a future paid plan, accounts, a hosted API or analytics is added.

After the review: update the text in `tools/build_pages.js`, change `legal_updated` in `tools/site_info.json`, run `node tools/build_pages.js` and both test commands, and remove the DRAFT comment only when the lawyer has signed off.
