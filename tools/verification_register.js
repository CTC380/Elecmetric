/* Verification register: one entry per calculator, with a three-level classification.
   Verified              independently reviewed (recorded reviewer, qualification, date), standard and edition named, exact reference given,
                         documented independent test cases, next review date set and not passed.
   Engineering reference formula and method documented and tested against separately coded reference calculations, but still missing evidence required for Verified.
   Indicative            estimation or simplified model only; further engineering checks required.
   Nothing is "Verified" unless tools/review_records.json carries a complete record. Pure module, driven by the tests. */
const LABEL = { verified: 'Verified', reference: 'Engineering reference', indicative: 'Indicative' };
const MEANING = {
  verified: 'Independently reviewed and supported by documented test evidence.',
  reference: 'Formula and method documented and tested against separately coded reference calculations. Not yet Verified: the evidence listed on this page is still needed.',
  indicative: 'Estimation only; further engineering checks are required.'
};
function entry(def, ctx) {
  const rec = (ctx.records || {})[def.id] || {}, basis = ctx.basis || {}, today = ctx.today;
  const vectors = (ctx.vectors || {})[def.id] || 0;
  const simp = (basis.simplified || {})[def.id], stdm = (basis.standard_method || {})[def.id];
  const appr = rec.approved || null, std = rec.standard || null, ref = rec.reference || null, teamApproval = ctx.teamApproval || null;
  const documented = !!(def.formula && def.assumptions && def.assumptions.length);
  const missing = [];
  if (!appr) missing.push('reviewer name, qualification and review date');
  const stdNA = (ctx.stdNA || {})[def.id] || '';
  if (!std && !stdNA) missing.push('standard and edition');
  else if (std && (std.review_status || 'scope_screened') !== 'clause_reviewed') missing.push('licensed clause-by-clause standard review');
  if (!ref || !ref.exact) missing.push('exact formula reference');
  if (!ref || !ref.formula_source) missing.push('formula source (textbook or standard)');
  if (!vectors) missing.push('documented independent test cases');
  if (!appr || !appr.next_review) missing.push('next review date');
  else if (appr.next_review < today) missing.push('review overdue (next review date has passed)');
  if (!(ctx.author || (ref && ref.author))) missing.push('named calculation author');
  let cls;
  if (!missing.length) cls = 'verified';
  else if (simp || !documented || !vectors) cls = 'indicative';
  else cls = 'reference';
  return {
    id: def.id, cls, label: LABEL[cls], meaning: MEANING[cls],
    basis: simp ? 'simplified' : stdm ? 'standard-method' : 'textbook',
    basisNote: simp || stdm || '',
    author: ctx.author || (ref && ref.author) || '',
    reviewer: appr ? appr.reviewer + (appr.qualification ? ', ' + appr.qualification : '') : (teamApproval && teamApproval.reviewer ? teamApproval.reviewer : (ctx.reviewer || '')),
    reviewerApprovalStatus: appr ? 'Individual approval recorded' : (teamApproval ? teamApproval.reviewer + ' team-level reviewer designation recorded on ' + teamApproval.date + '; this is not an individual or independent professional sign-off' : (ctx.reviewer ? ctx.reviewer + ' is the team attribution; individual approval remains pending' : 'Pending: no reviewer recorded')),
    teamApprovalDate: teamApproval ? (teamApproval.date || '') : '',
    individualApprovalStatus: appr ? 'Recorded' : 'Not recorded',
    reviewDate: appr ? appr.date : '', nextReview: appr ? (appr.next_review || '') : '',
    standard: std ? std.name + (std.edition ? ', ' + std.edition : '') : (stdNA ? 'Not applicable: ' + stdNA : ''),
    standardReviewStatus: std ? (std.review_status || 'scope_screened') : (stdNA ? 'not_applicable' : 'pending'),
    standardReviewBasis: std ? (std.review_basis || '') : '',
    standardScopeNote: std ? (std.scope_note || '') : '',
    stdNA,
    reference: ref ? [ref.formula_source, ref.exact].filter(Boolean).join(': ') : '',
    vectors, missing
  };
}
function build(defs, ctx) {
  const reg = {}; defs.forEach((d) => { reg[d.id] = entry(d, ctx); });
  const counts = { verified: 0, reference: 0, indicative: 0 };
  Object.keys(reg).forEach((k) => counts[reg[k].cls]++);
  return { reg, counts };
}
module.exports = { build, entry, LABEL, MEANING };
