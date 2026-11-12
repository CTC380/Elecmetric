# Engineering calculation bases and standards status

**Checked:** 12 November 2026  
**Software version:** Elecmetric 1.73.7

This document describes the calculation presets implemented in `engine.js`. It does not certify that a design complies with a particular standard. A preset supplies a limited number of method constants and checks; it is not a complete implementation of the named standard.

## Scope and limitations

- No standard ampacity tables, cable installation-method tables, grouping tables or full clause text are embedded. The user supplies the tabulated cable rating and correction factors.
- The `General / IEC-style`, `IS`, `BS 7671`, `AS/NZS 3008` and `NEC-style` names identify calculation presets. They must not be presented as proof of standards compliance.
- The actual standard edition adopted by the project, local authority requirements, cable manufacturer's data and installation conditions take precedence.
- The standard-size lists in calculators are selectable conventions. Confirm the available device, transformer, generator and CCR sizes with the project specification and manufacturer.

## Calculation bases currently implemented

| Basis | id | Conductor limit PVC / XLPE used by the engine | Table ambient used by the engine | Device rule used by the engine | Voltage-drop reference currently shown |
|---|---:|---:|---:|---|---|
| General / IEC-style | 1 | 70 / 90 °C | 30 °C | Ib ≤ In ≤ Iz | None |
| IS (India) | 4 | 70 / 90 °C | 40 °C | Ib ≤ In ≤ Iz | None |
| BS 7671 (UK) | 5 | 70 / 90 °C | 30 °C | Ib ≤ In ≤ Iz | 3% lighting / 5% other uses in Feeder Designer |
| AS/NZS 3008 ampacity basis | 6 | 75 / 90 °C | 40 °C | Ib ≤ In ≤ Iz | 5% reference attributed separately to AS/NZS 3000 |
| NEC-style | 2 | 75 / 90 °C | 30 °C | 1.25 × Ib ≤ In ≤ Iz for the continuous-load case | None |
| User-defined | 3 | Set by the user | Set by the user | Set by the user | None |

These are the values in the software, not a statement that every cable or installation covered by the named standard uses those values. The user must confirm conductor temperature class, reference ambient, tabulated ampacity and correction factors for the exact cable and installation method.

## Temperature correction: important limitation

The Cable Derating calculator and Feeder Designer use:

`kt = √((θmax − Ta) / (θmax − Tref))`

This is a simplified steady-state heat-balance approximation. It is **not** a substitute for the ambient-temperature correction factors tabulated in the applicable wiring standard or cable manufacturer's data. Grouping and other correction factors are separately entered by the user.

For final cable selection, use the prescribed factors for the actual conductor/insulation temperature rating, cable construction, installation method, ambient or soil conditions, grouping, harmonics and other relevant conditions. Do not rely on the displayed temperature multiplier alone as a standards-compliant derating calculation.

## Edition and reference status checked on 12 November 2026

| Standard | Publicly listed edition/status at the check date | Effect on this software |
|---|---|---|
| **BS 7671** | BS 7671:2018+A4:2026 is identified by the IET as the current edition. The previous BS 7671:2018+A2:2022+A3:2024 was withdrawn on 15 October 2026. | The software's 3% / 5% voltage-drop references and other BS assumptions have **not** been revalidated against the licensed A4:2026 text. Treat them as provisional until checked. |
| **AS/NZS 3008.1.1** | AS/NZS 3008.1.1:2025 is the current fourth edition; the 2017 edition is the previous edition. | The preset still contains 75 / 90 °C conductor limits and 40 °C table ambient. These constants have **not** been verified against the complete 2025 text. Do not claim 2025 compliance. |
| **IEC 60364-4-43** | IEC 60364-4-43:2023, edition 4.0, replaces the 2008 edition and is a technical revision with a restructured document. | Legacy clause/table references in the code and old notes need a licensed-edition cross-check. The public contents of the 2023 edition list the k values as "Table 2 – Values of k for conductors" (clause 431.5.4), so the old `Table 43A` reference is out of date; the code comment now says so. Confirm the table and its values in a licensed copy. |
| **IEC 60364-5-52** | IEC 60364-5-52:2009+A1:2024 consolidated version, edition 3.1. | Recheck wiring-system, harmonic-current and voltage-drop references against this consolidated text. |
| **NFPA 70 (NEC)** | NFPA published the 2026 edition in autumn 2025; most states still enforce 2020 or 2023. The locally adopted edition can differ by jurisdiction and project date. | The software implements only selected NEC-style rules, including the continuous-load factor. It is not a complete NEC calculation or inspection tool. |
| **IS 732** | IS 732:2019 is the listed fourth revision; the BIS entry reviewed for this audit indicated review in 2024. | The 40 °C air reference used in the preset is based on published Indian cable data-sheet practice, not a clause verified directly from the licensed IS 732 text. The more likely source for Indian current ratings is IS 3961 (Part 2):2017, "Recommended current ratings for cables: PVC insulated and PVC sheathed heavy duty cables" (BIS lists it as reviewed in 2024); check it first. Its text was not read. No IS voltage-drop advisory is asserted by the software. |

Official/public edition information:

- IET, [BS 7671 current edition and amendments](https://electrical.theiet.org/bs-7671-18th-edition-wiring-regulations).
- Western Australian Government, [updated cable-selection standards notice](https://www.wa.gov.au/government/announcements/updated-electrical-installation-standards-battery-systems-and-cable-selection); see also the [AS/NZS 3008.1.1:2025 catalogue entry](https://www.intertekinform.com/en-au/standards/as-nzs-3008-1-1-2025-99685_saig_as_as_3778901/).
- IEC, [IEC 60364-4-43:2023](https://webstore.iec.ch/en/publication/28432).
- IEC, [IEC 60364-5-52:2009+A1:2024 consolidated version](https://webstore.iec.ch/en/publication/103734).
- NFPA, [NFPA 70 (National Electrical Code)](https://www.nfpa.org/codes-and-standards/nfpa-70-standard-development/70).
- BIS, [IS 732:2019 standard listing](https://standards.bis.gov.in/website/standard-details?encryptedId=eyJpdiI6ImpvbGo4cVFET2VSWTgwVnlBU3JkY1E9PSIsInZhbHVlIjoiQytmWjVqR3I5VXJZaTRwY2R0d0Fhdz09IiwibWFjIjoiYzg5NzdhMWE0MWQ5NzBiZDMyYmEzYzRjNjNmMzU0NGU3MDU3YWEzOWJhMDY4N2FkZTUwOWFhNjcyZGRjNTAyZCIsInRhZyI6IiJ9).

Public catalogue pages establish edition status. They do not provide the complete normative requirements. A licensed copy and competent standards review are still required before claiming compliance.

For the v1.73.0 applicability register, `scope_screened` means only that the relevant standard and its published scope/edition metadata were identified. It does not satisfy Stage 3 as Done and cannot make a calculator Verified. Record `clause_reviewed` only after a competent reviewer has checked the exact project-adopted licensed clauses, tables and annexes.

## Specific calculation notes

1. **BS 7671 voltage drop:** the Feeder Designer currently displays 3% for lighting and 5% for other uses. Reconfirm these values, their scope and their measurement reference against BS 7671:2018+A4:2026 before relying on them for a UK design.
2. **AS/NZS voltage drop:** the software keeps the AS/NZS 3008 ampacity preset separate from the 5% reference attributed to AS/NZS 3000. Confirm the applicable circuit, supply-point definition and current edition before use.
3. **NEC continuous loads:** the preset applies a 125% factor to the continuous-load portion for its selected device/conductor rule. This is one check only. It does not cover every NEC exception, equipment-specific rule, temperature limitation, terminal rating or local amendment.
4. **Short-circuit withstand:** the engine uses hard-coded adiabatic `k` values for Cu/Al and PVC/XLPE, the IEC-type set (115/143 Cu, 76/94 Al; 103/68 for PVC above 300 mm²), on every basis. AS/NZS 3008.1.1:2025 has its own K and final-temperature tables (a third-party worked example reports K = 167.4 for XLPE at 250 °C, not checked against the licensed text), so the result is not an AS/NZS 3008 check. Confirm initial and final conductor temperatures, conductor size range, insulation, protective-device clearing time and the applicable current-edition table before design approval. The historical `IEC 60364-4-43 Table 43A` reference must be checked against the 2023 restructured edition; the code comment is not a current-edition approval.
5. **Conduit fill:** the 53 / 31 / 40% rule is a NEC-style Chapter 9 Table 1 convention. Do not apply it as a universal IEC or IS conduit-fill rule.
6. **Voltage drop and cable sizing:** the cable-size calculators use the stated conductor resistivity/temperature model and user-entered resistance/reactance. Confirm the manufacturer's AC resistance, conductor operating temperature, cable formation, parallel-run sharing and project voltage-drop limit.
7. **Earth resistance:** the rod and grid tools use simplified analytical models. They do not replace soil-resistivity testing, field measurements, touch/step voltage assessment or a complete earthing-system design.
8. **Protection and fault level:** the Feeder Designer's source/fault model and protective-device checks are limited calculations. Confirm source impedance, transformer data, maximum and minimum fault levels, protective-device curves, breaking capacity, selectivity, disconnection time and earthing arrangement separately.

## What each result shows as checked and unverified (v1.69.0)

Every calculator page (static pages and the app) now lists what that calculator checks and what remains unverified, and its verification class (Verified, Engineering reference or Indicative). See `docs/VERIFICATION_REGISTER.md`. The Feeder Designer already lists each check as pass, fail or not verified.

## Standards data layer (v1.70.0)

The Cable Selection Check loads ampacity, temperature, grouping and k-factor tables from the user's licensed standard or catalogue, with standard, edition, table, installation method, source and entry person recorded, and shows each as verified or unverified. It checks overload rules, maximum and minimum fault levels, short-circuit withstand and a manufacturer selectivity limit, and lists what it relied on and what it did not check. See `docs/STANDARDS_DATA.md`.


## AGL standards (added v1.71.0)

The seven AGL calculators (series circuit load and CCR size, maximum fittings, isolating transformer, CCR input energy, brightness steps, lamp life, light intensity at distance) were not covered by this document before v1.71.0.

| Item in the software | Public source checked 12 November 2026 | Status |
|---|---|---|
| 6.6 A series circuit; 5-step 2.8 / 3.4 / 4.1 / 5.2 / 6.6 A and 3-step 4.8 / 5.5 / 6.6 A | Current L-828 / L-829 manufacturer data, certified to FAA AC 150/5345-10 (vendors cite edition H) | Matches vendor data. Not read from the FAA text. |
| CCR size list 4, 7.5, 10, 15, 20, 25, 30 kW | Vendor catalogues list 1, 2, 4, 5, 7.5, 10, 15, 20, 25, 30 kW and up to 70 kW, plus a 20 A class | List is incomplete against catalogues; unchanged until checked against the FAA text. A circuit above 30 kW gets no size and a warning. |
| Isolating transformers, installation, lighting patterns | FAA AC 150/5345-47 (transformers), AC 150/5340-30 (installation), AC 150/5370-10 (construction), ICAO Annex 14 Volume I | Not yet checked: revision letters and numbers must be confirmed on the FAA and ICAO sites before they are cited. |

The AGL calculators are arithmetic on user-entered lamp and cable data. They do not check photometric or pattern compliance.

## Still not built (needs licensed data and a qualified reviewer)

No table values are shipped. Not yet available: verified cable and equipment databases, standard-specific ampacity for each installation method, soil correction factors, and time-current protective-device coordination. The tables are published in licensed standards and manufacturer catalogues, so they have to be entered from a licensed copy and reviewed, not written from memory.

## Items requiring a qualified reviewer

- Verify each basis against the exact licensed standard edition intended for release.
- Verify all fixed constants and standard-size lists against manufacturer data and the project's adopted standards.
- Review the 157 calculators and the 756-vector Scientific Calculator independently, record reviewer identity/qualification/date, and only then enter records in `tools/review_records.json`.
- Complete browser, keyboard, screen-reader, mobile and offline tests on real devices.

The review register is intentionally empty until a real review is completed. At the time of this audit, **0 of 157 calculators have recorded standards review or qualified technical approval**.

## Applicability screening completed on 12 November 2026

Elecmetric v1.73.0 now records Stage 3 for all 157 calculators. Fifty calculators have a relevant document identified from official/public publisher scope information and are marked **Scope screened**. The remaining 107 are marked **Not applicable** with a reason because their implemented method is a generic equation, unit conversion, simplified estimator or user-entered commercial calculation that is not governed by one electrical standard.

This is not a claim that the 50 formulas have been checked clause by clause against licensed standard text. The app keeps them in a Partial state until the exact project-adopted edition, clauses, tables and assumptions are verified by a competent reviewer. Rahul Sharma is recorded as a self-designated, non-independent reviewer for all calculators (12 November 2026). This is not individual professional sign-off. See `docs/STANDARD_APPLICABILITY_REVIEW_v1.73.0.md` for every calculator, standard edition and limitation.

### Additional edition/scope points relevant to the new register

- **IEC 60909-0:2026, Edition 3.0** is now the current short-circuit calculation edition. The 2016 edition was withdrawn on 23 July 2026. Recheck the calculator's simple transformer and sequence-network assumptions against the new edition before formal design use.
- **IEC 62548-1:2023 + AMD1:2025** is the consolidated PV-array design publication used for PV string/array scope screening. The calculator does not implement the whole PV-array safety design.
- **IEC 61820-1:2019, IEC 61820-1-2:2024 and IEC 61820-3-2:2023** are relevant to AGL fundamentals, series-circuit requirements and series-circuit power supplies/CCR. They do not by themselves validate the simplified power, fitting-count or cable-loss equations in the calculators.
- **ICAO Annex 14, Volume I**: the ICAO catalogue lists the 9th Edition (July 2022), Amendment 18 (4 August 2025), and Corrigenda 2 (18 March 2026) and 3 (8 June 2026). Use the airport's adopted edition and State differences for a real project.
- **IEEE 485-2020** is an active recommended practice for lead-acid stationary batteries in float service. It does not cover other battery chemistries or the calculator's simplified generic runtime model.
- **ISO/CIE 8995-1:2025** is the current published indoor workplace-lighting edition. The lumen-method calculator is still an indicative simplified planning calculation, not a complete lighting design.
- **IEC 60076-7:2018** is a loading guide for mineral-oil-immersed transformers. It should not be applied uncritically to dry-type transformers or as a substitute for manufacturer thermal data.

## Scope gaps (checked 12 November 2026)

- No manufacturer data is embedded. The user supplies cable ratings, correction factors and device or equipment data; `data-templates/` contains blank CSV templates only.
- AGL photometric support is limited to the Allard's-law intensity-at-distance calculator. Nothing checks a design against ICAO Annex 14 photometric requirements; Annex 14 and ICAO Doc 9157 are cited as references only.
- No calculator is Verified, clause-reviewed or individually approved. The team-level designation in `tools/team_review_approval.json` is administrative and does not change this.
