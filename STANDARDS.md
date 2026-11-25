# Engineering calculation bases and standards status

**Checked:** 12 November 2026 (edition and applicability review); documentation synchronised to the software on 18 November 2026  
**Software version:** Elecmetric 1.99.90

**Current position (v1.99.90):** 246 calculators. 62 are scope screened, 184 are justified as not applicable, and **0 have had a licensed clause-by-clause review**. 0 have an individual professional approval, so **0 are Verified**: 210 are classed Engineering reference and 36 Indicative. The counts in the dated sections below are history; this line is the current figure.

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
8. **Protection and fault level:** the Feeder Designer's source/fault model and protective-device checks are limited calculations. Since v1.99.13 the far-end fault includes the transformer, the cable and, when entered, an upstream source impedance from a minimum fault level. Without that input the result is an infinite-bus upper bound, and an instantaneous pick-up at or below it is shown as conditional, not as a pass. Fault level and the breaking-capacity step still assume an infinite bus. Confirm source impedance, transformer data, maximum and minimum fault levels, cable temperature, fault type, protective-device curves, breaking capacity, selectivity, disconnection time and earthing arrangement separately.
9. **Overcurrent relay setting:** since v1.99.12 the Time Multiplier Setting is rounded **up** to the next relay step (default 0.025, configurable) and capped at the relay maximum, with the achieved time and a warning when the requested time cannot be met. Confirm the steps, curve constants and grading margin against the relay manufacturer's data and the protection study.

## What each result shows as checked and unverified (v1.69.0)

Every calculator page (static pages and the app) now lists what that calculator checks and what remains unverified, and its verification class (Verified, Engineering reference or Indicative). See `docs/VERIFICATION_REGISTER.md`. The Feeder Designer already lists each check as pass, fail or not verified.

## Standards data layer (v1.70.0)

The Cable Selection Check loads ampacity, temperature, grouping and k-factor tables from the user's licensed standard or catalogue, with standard, edition, table, installation method, source and entry person recorded, and shows each as verified or unverified. It checks overload rules, maximum and minimum fault levels, short-circuit withstand and a manufacturer selectivity limit, and lists what it relied on and what it did not check. See `docs/STANDARDS_DATA.md`.


## AGL standards (added v1.71.0, updated for v1.99.15)

The Airport and AGL division now has **twelve** calculators: series circuit load and CCR size (`agl-ccr-loading`), maximum fittings, isolating transformer, CCR input energy, brightness steps, lamp life curve, cable loop loss, cable size for a loss share, lamp failure load, light intensity at distance, photometry data analysis (`agl-photometry-data`) and signage load (`signage-load`). Only the first seven were covered by this document before v1.71.0.

| Item in the software | Public source checked 12 November 2026 | Status |
|---|---|---|
| 6.6 A series circuit; 5-step 2.8 / 3.4 / 4.1 / 5.2 / 6.6 A and 3-step 4.8 / 5.5 / 6.6 A | Current L-828 / L-829 manufacturer data, certified to FAA AC 150/5345-10 (vendors cite edition H) | Matches vendor data. The FAA-published AC 150/5345-10H Table 1 also lists the Class 1 (6.6 A) Style 1 and Style 2 values, so the public FAA table is the primary reference; the vendor data is a cross-check. The project's separately licensed copy was not used to confirm them. |
| 20 A five-step set 8.5 / 10.3 / 12.4 / 15.8 / 20.0 A (Class 2, Style 2) | FAA AC 150/5345-10H defines Class 2 as 20.0 A output and Style 2 as five brightness steps; the same five currents appear in current L-828 / L-829 manufacturer data and in the older AC 150/5345-10D table | Implemented in `agl-brightness-steps` from v1.99.16 as a third circuit type. Matches vendor data and the superseded 10D table. The same five Class 2 values are listed in Table 1 of the public FAA AC 150/5345-10H; the project's separately licensed copy was not used to confirm them. No 20 A three-step set is offered. |
| CCR size list 1, 2, 4, 7.5, 10, 15, 20, 25, 30 kW | FAA AC 150/5345-10H (5 November 2014, active), clause 1.2.4: standard sizes 1, 2, 4, 7.5, 10, 15, 20, 25, 30, 50 and 70 kW; 50 and 70 kW are replacement equipment only, not for new designs | Matches the FAA text from v1.80.2 (1 and 2 kW were missing before). 5 kW appears in some manufacturer catalogues but not in the FAA list, so it is not offered. A circuit above 30 kW gets no size and a warning. |
| Isolating transformers, installation, lighting patterns | FAA AC 150/5345-47C (transformers; issued 22 July 2011, listed active on faa.gov, checked 17 November 2026), AC 150/5340-30J (installation; issued 12 February 2018, listed active on faa.gov, checked 17 November 2026), AC 150/5370-10H (construction; issued 21 December 2018, listed active on faa.gov, checked 17 November 2026; a draft 10J exists and has not replaced it), ICAO Annex 14 Volume I (9th Edition, Amendment 18 and Corrigenda 2 and 3 in the ICAO catalogue) | Editions confirmed on the public catalogues. The adopted edition and State differences for a real project still govern. |

### What the AGL calculators assume

The AGL calculators are arithmetic on user-entered lamp, cable and transformer data. They are preliminary engineering and checking tools. Manufacturer data, project-specific circuit characteristics and the applicable photometric requirements take precedence.

- **CCR loading:** a resistive series circuit at near-unity power factor.
- **Brightness steps:** the lamp power at a step is the full-current power scaled by (I / full current)^k with a user-entered exponent, and the transformer efficiency is constant at every step. The full current is 6.6 A, or 20.0 A on the 20 A circuit type.
- **Isolating transformer:** an ideal current ratio and a constant efficiency.
- **Lamp failure load:** a fixed open-secondary transformer power entered by the user.
- **Lamp life:** a power law fitted through two user-supplied points.
- **Cable sizing and loss:** the user supplies the cable resistance and the design limits.
- **Photometry data:** analyses up to twelve measured readings against limits the user enters. It does not choose the standard measurement points and does not establish ICAO Annex 14 compliance.
- **Light intensity at distance (Allard's law):** gives illuminance at the observer. It is not an operational runway visual range assessment.

## Still not built (needs licensed data and a qualified reviewer)

No table values are shipped. Not yet available: verified cable and equipment databases, standard-specific ampacity for each installation method, soil correction factors, and time-current protective-device coordination. The tables are published in licensed standards and manufacturer catalogues, so they have to be entered from a licensed copy and reviewed, not written from memory.

## Items requiring a qualified reviewer

- Verify each basis against the exact licensed standard edition intended for release.
- Verify all fixed constants and standard-size lists against manufacturer data and the project's adopted standards.
- Review all 246 calculators (the 157 present at v1.73.0 plus the 89 added since) and the 756-vector Scientific Calculator independently, record reviewer identity/qualification/date, and only then enter records in `tools/review_records.json`.
- Complete browser, keyboard, screen-reader, mobile and offline tests on real devices.

The review register is intentionally empty until a real review is completed. At v1.99.90, **0 of 246 calculators have recorded clause-level standards review or qualified individual approval**.

## Applicability screening completed on 12 November 2026

*Current position (v1.99.90): the registry holds 246 calculators, of which 62 are Scope screened and 184 are Not applicable. 0 are Clause reviewed. The 157, 50 and 107 below, and the 116, 167 and 168 in the updates, are the totals at the dates named and are kept as history.*

Elecmetric v1.73.0 now records Stage 3 for all 157 calculators. Fifty calculators have a relevant document identified from official/public publisher scope information and are marked **Scope screened**. The remaining 107 are marked **Not applicable** with a reason because their implemented method is a generic equation, unit conversion, simplified estimator or user-entered commercial calculation that is not governed by one electrical standard.

*Update (v1.81.1): the 157 above is the count at v1.73.0. The nine calculators added since (superposition-theorem, magnetic-circuit, transformer-test-data, load-flow-3bus, symmetrical-components, power-electronics-converter, dc-machine-emf-torque, plant-load-flow, thevenin-norton) are also Stage 3 classified, all Not applicable, so the registry now has 50 scope screened plus 116 Not applicable = 166. They are not in `tools/team_review_approval.json`, which still lists the 157 designated on 12 November 2026.*

*Update (v1.82.0): the tenth calculator added since, transformer-vector-group, is the one exception. It is Scope screened against IEC 60076-1:2011 (Edition 3.0), the document that defines the connection symbols and the clock-number notation for phase displacement, so the registry now has 51 scope screened plus 116 Not applicable = 167. The eleventh, relay-setting (v1.83.0), is also Scope screened, against IEC 60255-151:2009 Ed 1.0 (the over/under current protection standard whose Annex A gives the inverse-time curve constants), so the registry now has 52 scope screened plus 116 Not applicable = 168. This is a scope screen from public catalogue information, not a clause review, and the calculator is not in `tools/team_review_approval.json` either.*

This is not a claim that the 50 formulas have been checked clause by clause against licensed standard text. The app keeps them in a Partial state until the exact project-adopted edition, clauses, tables and assumptions are verified by a competent reviewer. The Elecmetric project team is recorded as a self-designated, non-independent reviewer for all calculators (12 November 2026). This is not individual professional sign-off. See `docs/STANDARD_APPLICABILITY_REVIEW_v1.73.0.md` for every calculator, standard edition and limitation.

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
- AGL photometric support is the Allard's-law intensity-at-distance calculator and the photometry data analysis tool, which compares up to twelve measured readings with user-entered limits. Nothing selects the Annex 14 measurement points or checks a design against ICAO Annex 14 photometric requirements; Annex 14 and ICAO Doc 9157 are cited as references only.
- The 20 A five-step AGL brightness set is covered from v1.99.16 for the brightness-step calculator only; the other AGL calculators still assume the 6.6 A circuits unless the user enters 20 A values. See the AGL table above.
- No calculator is Verified, clause-reviewed or individually approved. The team-level designation in `tools/team_review_approval.json` is administrative and does not change this.

## Resistor markings (Resistor Colour Code page)

- Colour bands follow the IEC 60062 style table, including the pink x0.001 multiplier added by IEC 60062:2016 with Amendment 1:2019. The licensed standard has not been read clause by clause; the table was written from published charts and the product brief. The temperature-coefficient colours are the six the page had (brown, red, orange, yellow, blue, violet); the additional colours of the 2016 edition are not added until checked against the owner's edition.
- SMD markings (3-digit, 4-digit, R/K/M/L/G decimal-point notation (L = milliohm, G = gigaohm; IEC 60062:2016 clause 4.2.1 and Tables 2 to 4, checked against the standard), zero-ohm links) are the common industry practice. The EIA-96 code (01 to 96, 100 to 976) is the E96 series, which equals round(100 x 10^(k/96)) at every point and is tested that way; the multiplier letters are Z 0.001, Y or R 0.01, X or S 0.1, A 1, B or H 10, C 100, D 1,000, E 10,000, F 100,000. A 3-digit code ending in 8 or 9 (x0.01, x0.1) is a maker convention and is flagged on the page. The marking gives resistance only, never tolerance or power rating.
- Preferred values (IEC 60063): the E6, E12 and E24 tables are the published ones, stored as tables because they are not plain roundings. E48, E96 and E192 equal round(100 x 10^(k/N)) and are tested that way. The tolerances shown with each series (20, 10, 5, 2, 1 and 0.5% for E6 to E192) are the ones usually sold with it, not a requirement of the series; E24 parts are also made at 1%. The finder reports the nearest value by ohms, ties to the lower value, with the values on each side. It does not choose a resistor for a circuit: power rating and derating are separate and are not in the colour code.
- Series and parallel totals use R = R1 + R2 + ... and 1/R = 1/R1 + 1/R2 + ... on the nominal values; they say nothing about tolerance, so the real total can differ by the part tolerances. Resistor power is P = V^2/R = I^2 R. The common ratings list (1/16 W to 100 W) is a convention, not every maker offers every size, and a stated rating applies at a stated ambient temperature (often 70 C) and falls above it. The page's share-of-rating setting (50, 60, 70 or 100%) is a derating assumption chosen by the reader, not a requirement of any standard; the datasheet derating curve governs.
- Voltage divider: Vout = Vin x R2e / (R1 + R2e), with R2e the lower resistor in parallel with an optional load. The wanted R1 + R2e sets the divider current Vin / (R1 + R2e). For each leg the standard value just below and just above the ideal is tried and the pair of four whose output is closest to the target is shown (on a tie, the pair whose total is closer to the wanted one); this keeps the total near the wanted one but is not a search of every pair. The tolerance range puts R1 and R2 at opposite ends of the series tolerance, the worst case on the nominal values. Power in each resistor is V^2/R with the same share-of-rating setting as the other cards. Temperature drift, load current not entered and the supply tolerance are not included.
- LED resistor: R = (Vs - n x Vf) / I with a single forward voltage Vf for each LED. This is a design estimate on nominal values: the real forward voltage moves with current, temperature and the individual LED, and the supply may vary, so the LED current will too. The default is the next standard value above, so the nominal current is never above the target; the nearest value can exceed it and the page says so. The tolerance range is the series tolerance applied to the resistor alone. The LED's maximum current and the resistor's rating are limits from their datasheets, not from this page.
