# Verification register (v1.73.5)

Automated tests, a public standards-scope screen and independent engineering approval are different activities. The register records these states separately for every calculator.

## Classification

| Class | Meaning | Rule in `tools/verification_register.js` |
|---|---|---|
| **Verified** | Independently reviewed and supported by documented test evidence. | All register fields are filled, a qualified reviewer is recorded, the exact reference and next review date exist, and the review is not overdue. |
| **Engineering reference** | Formula and method documented and independently tested, but not independently approved. | Formula, assumptions and independent test vectors exist; no complete reviewer approval is recorded. |
| **Indicative** | Estimation or simplified model only; further engineering checks required. | Simplified model/rule of thumb or documentation/reference vectors are incomplete. |

## Stage 3: standard applicability

The v1.73.0 Stage 3 review classifies all **157 calculators** (classification carried forward in v1.73.1):

- **50 Scope screened:** relevant standards and published edition/scope metadata identified from official or publisher catalogue information. Each record is in `tools/review_records.json` with `review_status: scope_screened` and a limitation note.
- **107 Not applicable:** the implemented equation is a generic identity, conversion, simplified estimate or user-defined commercial calculation for which no single electrical standard governs the method. Reasons are in `tools/standard_applicability.json`.
- **0 Clause reviewed:** no calculator is represented as having completed a licensed-text, clause-by-clause review.

**Scope screened is deliberately shown as Partial, not Done.** A publisher abstract or catalogue scope is enough to identify a potentially relevant standard, but not enough to verify the calculator formula against the exact clauses, tables, annexes and national adoption. The responsible engineer must check the licensed, project-adopted edition before any standards-compliance statement is made.

## Stage 5: team-level reviewer designation and individual sign-off

A team-level reviewer designation is recorded for all **157 calculators** in `tools/team_review_approval.json`:

- **Reviewer:** Rahul Sharma (self-designation, not independent)
- **Record date:** 12 November 2026
- **Basis:** recorded at the user's explicit direction
- **Scope:** all 157 calculators

This completes the requested **team-level reviewer approval designation**. It is an administrative team record. It does **not** claim that a named individual or an independent qualified engineer has reviewed every formula, assumption, manufacturer limit or standard clause. No personal qualification is asserted.

A separate individual professional sign-off remains available in `tools/review_records.json` (`approved.reviewer`, `approved.qualification`, `approved.date`). Those fields must only be populated after the named person has actually completed the review. The team-level record does not satisfy those fields and cannot make a calculator Verified.

## Verification register fields

| Field | Source | Required for Verified |
|---|---|---|
| Calculation author | `calculation_author` in `tools/site_info.json` (currently Rahul Sharma (author)), or `reference.author` | Yes |
| Technical review label (public pages) | `technical_reviewer` in `tools/site_info.json` (currently Rahul Sharma (author)); displayed separately from approval | No, attribution alone is not approval |
| Team-level reviewer designation | `tools/team_review_approval.json` | Visible as a team record; not sufficient for Verified |
| Individual professional approval | `approved.reviewer`, `approved.qualification`, `approved.date` in `tools/review_records.json` | Yes |
| Standard and edition | `standard.name`, `standard.edition` | Yes, unless Not applicable is justified |
| Standard review state | `standard.review_status` | Must be `clause_reviewed` for Done; `scope_screened` remains Partial |
| Exact formula reference | `reference.exact` | Yes |
| Formula source | `reference.formula_source` | Yes |
| Independent test cases | `tests/reference_vectors.json` | Yes (at least one) |
| Next review date | `approved.next_review` | Yes |

## What the v1.73.0 screening did not do

- It did not purchase, open or read the licensed full text for every named standard.
- It did not record clause/table numbers as though those had been verified.
- It did not confirm which national adoption or amendment applies to any particular project.
- It did not validate manufacturer-specific ampacity, cable resistance, CCR limits, lamp data, transformer impedance, battery curves or protective-device settings.
- It did not provide an independent technical reviewer approval. The team-level designation is an administrative record only.

See `docs/STANDARD_APPLICABILITY_REVIEW_v1.73.0.md` for the calculator-by-calculator mapping and limitations.


## Individual review record (v1.73.5)
No individual technical review is recorded for any calculator (v1.73.6). Only the user-directed Rahul Sharma (author) designation (`tools/team_review_approval.json`) is on record, and it is not an individual or independent sign-off. Add an `approved` record in `tools/review_records.json` only when a named, qualified reviewer has reviewed the calculator and the signed worksheets are on file.

- It is an individual review of the formula, assumptions and worked examples. It is **not** a clause-by-clause review against licensed standard text; the 50 standards-based calculators remain `scope_screened`.
- No calculator is **Verified** yet. Verified also needs an exact formula reference (`reference.formula_source`, `reference.exact`) and, where a standard applies, a `clause_reviewed` standard record.
- The team-level designation in `tools/team_review_approval.json` is unchanged and keeps its own date row (2026-11-12).
