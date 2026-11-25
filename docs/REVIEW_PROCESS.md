# Independent review process (v1.0)

Builds on `docs/VERIFICATION_REGISTER.md`, `tools/review_records.json` and `tools/validate_review_records.js`. It adds a queue and a working order. It approves nothing: **no tool is Verified, and none becomes so until a named, qualified person signs a worksheet.**

## Queue
`docs/Elecmetric_Review_Queue_v1.0.csv` lists all 304 tools, generated from the architecture (`node tools/build_master_architecture.js`).
- **P1, safety or protection critical:** cable, transformers, power systems and fault levels, protection, earthing, generators, AGL, electrical safety. Review these first.
- **P2, other engineering.**
- **P3, general mathematics:** review by sampling per mode, not tool by tool, once the vectors are independently reproduced.
Reviewer columns are blank on purpose. Fill them only from a real review.

## Stages (a tool moves one stage at a time)
1. **Not reviewed** (today, all 304).
2. **Method review:** formula, assumptions, input ranges and limits read against a cited reference.
3. **Numerical review:** reviewer reproduces at least three worked cases without using Elecmetric's code, including an edge case.
4. **Standards review:** exact clause or table checked in the edition the user will work to (licensed text). Skip with a written reason if no standard applies.
5. **Approved:** reviewer name, qualification, date, worksheet reference and next review date are recorded in `tools/review_records.json` and pass `node tools/validate_review_records.js`.

## Rules
- The reviewer cannot be the author, and an automated test pass is not a review.
- A change to a formula, input range or default returns the tool to stage 2.
- Reviews expire; the next review date is mandatory (suggest 24 months, 12 for P1).
- The public page may show reviewer and date only for stage 5.
- Health, finance and legal calculators must not be published before a subject specialist is on file.

## What you need to supply
Names and qualifications of reviewers (an AGL specialist for Level 2 "Airport and Aviation Engineering", a power engineer for P1 electrical tools, a statistician and a mathematician). Without them the queue stays at stage 1.
