/* Validates tools/review_records.json. A record is allowed only if it names a real calculator and carries the full evidence
   (standard name, edition and date; reviewer name, qualification and date). Pure function so the test suite can drive it. */
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const PLACEHOLDER = /^(full name|e\.g\.|tbd|todo|n\/a|name|\.\.\.|x+|_+)/i;
function validate(records, ids, today) {
  const problems = [];
  const t = today || new Date().toISOString().slice(0, 10);
  const txt = (v) => typeof v === 'string' && v.trim().length > 1 && !PLACEHOLDER.test(v.trim());
  const dt = (v) => typeof v === 'string' && DATE.test(v) && !isNaN(Date.parse(v)) && v <= t;
  Object.keys(records || {}).forEach((id) => {
    const r = records[id];
    if (ids.indexOf(id) < 0) { problems.push(id + ': not a registered calculator'); return; }
    if (!r || (!r.standard && !r.approved && !r.reference)) { problems.push(id + ': record has no standard review, approval or reference'); return; }
    if (r.standard) {
      if (!txt(r.standard.name)) problems.push(id + ': standard.name missing');
      if (!txt(r.standard.edition)) problems.push(id + ': standard.edition missing');
      if (!dt(r.standard.date)) problems.push(id + ': standard.date must be YYYY-MM-DD and not in the future');
      if (r.standard.review_status != null) {
        if (['scope_screened', 'clause_reviewed'].indexOf(r.standard.review_status) < 0) problems.push(id + ': standard.review_status must be scope_screened or clause_reviewed');
        if (!txt(r.standard.review_basis)) problems.push(id + ': standard.review_basis missing');
        if (r.standard.review_status === 'scope_screened' && !txt(r.standard.scope_note)) problems.push(id + ': scope_screened standard needs a scope_note');
      }
      if (r.standard.review_status != null) {
        if (['scope_screened', 'clause_reviewed'].indexOf(r.standard.review_status) < 0) problems.push(id + ': standard.review_status must be scope_screened or clause_reviewed');
        if (!txt(r.standard.review_basis)) problems.push(id + ': standard.review_basis missing');
        if (r.standard.review_status === 'scope_screened' && !txt(r.standard.scope_note)) problems.push(id + ': scope_screened standard needs a scope_note');
      }
    }
    if (r.approved) {
      if (!txt(r.approved.reviewer)) problems.push(id + ': approved.reviewer missing');
      if (!txt(r.approved.qualification)) problems.push(id + ': approved.qualification missing');
      if (!dt(r.approved.date)) problems.push(id + ': approved.date must be YYYY-MM-DD and not in the future');
      if (r.approved.next_review != null) {
        if (typeof r.approved.next_review !== 'string' || !DATE.test(r.approved.next_review) || isNaN(Date.parse(r.approved.next_review))) problems.push(id + ': approved.next_review must be YYYY-MM-DD');
        else if (dt(r.approved.date) && r.approved.next_review <= r.approved.date) problems.push(id + ': approved.next_review must be after approved.date');
      }
    }
    if (r.reference != null) {
      if (!txt(r.reference.formula_source)) problems.push(id + ': reference.formula_source missing (textbook or standard)');
      if (!txt(r.reference.exact)) problems.push(id + ': reference.exact missing (chapter, equation, clause or table)');
      if (r.reference.author != null && !txt(r.reference.author)) problems.push(id + ': reference.author must be a real name');
    }
  });
  return problems;
}
module.exports = { validate };
