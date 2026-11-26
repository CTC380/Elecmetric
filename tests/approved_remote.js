/* The one remote script and the one security-policy meta that DEPLOY.md approves on every page (GTM_HEAD and CSP_META in tools/build_pages.js).
   Tests that prove "a page loads nothing from another host" call stripApproved(html) first, so the approved loader is not mistaken for an
   unapproved one. tests/run_tests.js (section 10) is where the loader, the policy and the allowed request hosts are themselves enforced:
   exactly one approved loader per page, and no other remote script or host. */
const LOADER = '<script async src="https://www.googletagmanager.com/gtm.js?id=GTM-KSBHF53Z"></script>';
function stripApproved(html) {
  return String(html)
    .split(LOADER).join('')
    .replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/gi, '');
}
module.exports = { stripApproved, LOADER };
