# Standards data and the Cable Selection Check (v1.73.0)

Elecmetric embeds no standard tables. Ampacity, correction-factor and k-factor tables are published in licensed standards and manufacturer catalogues. The **Cable Selection Check** (`#cable-selection` in the app) lets a person who holds the licensed copy load those tables as datasets, and then checks a cable and its protective device against them. Every result states which data it relied on and whether that data is verified.

## Datasets

Four kinds, each a CSV file with `# key: value` header lines (templates, with no values, are in `data-templates/`):

| Kind | Columns | Needed header lines (besides standard, edition, table, source, entered_by) |
|---|---|---|
| `ampacity` | `size_mm2,amps` | method, conductor (Cu/Al), insulation (PVC/XLPE), loaded_conductors (2/3) |
| `temperature-factor` | `ambient_c,factor` | conductor, insulation, reference_ambient_c |
| `grouping-factor` | `circuits,factor` | method |
| `k-factor` | `size_max_mm2,k` | conductor, insulation |

- `source` is `licensed-copy`, `manufacturer` or `user-entered`.
- A dataset is **unverified** unless `verified_by`, `verified_qualification` and `verified_date` are all given (date not in the future). Elecmetric cannot confirm who the verifier is; the dataset is shown as "verified as recorded" with those details beside it.
- Rows must increase, values must be positive, correction factors above 1.5 are rejected.
- Loaded tables are kept in the browser only (`elecmetric-datasets`); they never leave the device.

## What the check does

| Check | Needs | Data relied on |
|---|---|---|
| Tabulated ampacity | ampacity dataset (exact size row) or a value entered by hand | dataset or hand value |
| Temperature correction | temperature dataset (linear interpolation, no extrapolation) or a factor entered by hand | dataset or hand value |
| Grouping correction | grouping dataset (exact circuit count) or a factor entered by hand | dataset or hand value |
| Iz = Itab × kt × kg | the three above | as above |
| Ib ≤ In ≤ Iz | Iz | as above |
| I2 ≤ 1.45 Iz | Iz, I2/In | built-in 1.45, edition not revalidated |
| Breaking capacity ≥ maximum fault | Icu | user input |
| Withstand at maximum fault, S = I√t/k | Imax, tmax | k dataset, else built-in k (edition not revalidated) |
| Disconnection at minimum fault, t = (kS/I)² | Imin, tmin | k as above |
| Pick-up ≤ minimum fault | Imin, Ii | user input |
| Selectivity limit ≥ maximum fault | manufacturer limit | user input |

Rules built in: a missing input is reported as **missing input / not verified**, never as a pass. A table row that does not exist, an ambient outside the table, or a dataset for another conductor or insulation, stops that factor from being used. The approximate heat-balance temperature factor of the Cable Derating calculator is deliberately **not** used as a fallback. The overall status says when everything passes only on data that is not independently verified.

Not checked: voltage drop, harmonic and neutral loading, soil thermal resistivity, time-current coordination curves, and whether the loaded installation method matches the real one.

## What is still outstanding

No table values are shipped, so the verified cable and equipment databases, and standard-specific ampacity for each installation method, exist only as the structure above. They need someone with the licensed standard to enter the tables and a qualified person to verify them. The selectivity check compares a manufacturer-published limit with the fault level; it is not a time-current curve study.
