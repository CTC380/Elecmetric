/* Hand-written content for the 20 category landing pages (/categories/<slug>/), keyed by the Level 1 slug in tools/master_architecture.json.
   The live tool lists, counts and subcategory sections are generated from the registry by tools/build_categories.js and are not typed here.
     scope    one or two sentences on what the category covers (the page lede)
     best     tool ids (registry `id`) shown under "Best tools you can use today"; a test checks each exists in this category
     also     live pages that are not counted as tools but help (Conversion Centre, coming-soon hubs): [path from the site root, label]
     limits   what the category's calculators do not do (the page's Assumptions and Limitations)
     related  other category slugs
     planned  the upcoming tools, in planned order: [name, what it will do, formula (plain text), tool type]
   A planned tool is a promise of nothing: it has no page, is not in the registry, All Tools, the sitemap or any count, and the page says so.
   tests/category_pages_test.js fails if a planned tool has the name of a tool that already exists, if a category has fewer than 8 planned tools,
   or if a planned entry has no formula. Every formula is a standard textbook relation. */
'use strict';
const TYPES = ['Calculator', 'Converter', 'Generator', 'Solver', 'Estimator', 'Analyzer', 'Simulator', 'Reference', 'Worked Example'];
const C = {
  'engineering-technology': {
    scope: 'Electrical power, electronics and airfield lighting calculators with formulas, working and stated limits, and the place where mechanical, civil and industrial engineering tools will be added.',
    best: ['voltage-drop', 'cable-size-vd', 'breaker-size', 'motor-current', 'transformer-sizing', 'fault-current', 'agl-ccr-loading', 'pf-correction-kvar'],
    also: [['calculators/', 'Engineering Calculators by Discipline'], ['technical-library/', 'Technical Library']],
    limits: 'Every engineering calculator here is an estimating tool. Results depend on the inputs and the calculation basis you choose, and no tool replaces a design review by a competent engineer or the applicable standard. Mechanical, civil and industrial engineering have no published tools yet.',
    related: ['mathematics', 'energy-environment', 'unit-conversion-measurement', 'physics-applied-science'],
    planned: [
      ['Beam Deflection and Bending Stress Calculator', 'Maximum deflection, bending moment and stress of a simply supported beam under a uniform load.', 'δ = 5wL⁴ / (384EI); M = wL² / 8; σ = M·c / I', 'Calculator'],
      ['Euler Column Buckling Calculator', 'Critical buckling load of a slender column for its end conditions.', 'P_cr = π²EI / (KL)²', 'Calculator'],
      ['Pipe Pressure Drop Calculator (Darcy-Weisbach)', 'Pressure drop along a straight pipe from flow, diameter, length and friction factor.', 'ΔP = f × (L / D) × (ρv² / 2)', 'Calculator'],
      ['Reynolds Number and Flow Regime Calculator', 'Reynolds number of a flow and whether it is laminar, transitional or turbulent.', 'Re = ρvD / μ', 'Calculator'],
      ['Heat Loss Through a Wall Calculator', 'Steady heat flow by conduction through a layer or a wall.', 'Q = k × A × ΔT / L', 'Calculator'],
      ['Reliability, MTBF and Availability Calculator', 'Availability and survival probability from mean time between failures and repair time.', 'A = MTBF / (MTBF + MTTR); R(t) = e^(−t / MTBF)', 'Calculator'],
      ['Process Capability Calculator (Cp and Cpk)', 'How well a process fits its specification limits.', 'Cp = (USL − LSL) / 6σ; Cpk = min((USL − μ) / 3σ, (μ − LSL) / 3σ)', 'Analyzer'],
      ['Concrete Beam Reinforcement Area Estimator', 'Tension steel area for a rectangular section under a design moment (simplified).', 'As = M / (0.87 × fy × z), with lever arm z = 0.95d', 'Estimator']
    ]
  },
  'mathematics': {
    scope: 'Arithmetic, fractions, percentages, algebra, equations, geometry, trigonometry, calculus and matrices, built for engineers and students who need to see the working as well as the answer.',
    best: ['percentage-calculator', 'quadratic-solver', 'matrix-calculator', 'scientific-calculator', 'fraction-arithmetic', 'pythagorean-theorem', 'complex-number', 'simultaneous-equations'],
    also: [['calculators/engineering-mathematics/', 'Mathematics Hub with Formulas and Worked Examples']],
    limits: 'The tools work on plain numbers and do not track units, so enter every value in one consistent unit. Results use double-precision arithmetic unless a tool says it uses exact or big-number arithmetic. Calculus tools handle the function families named on each page, not arbitrary expressions.',
    related: ['statistics-data-analysis', 'engineering-technology', 'physics-applied-science', 'education-exams'],
    planned: [
      ['Newton-Raphson Root Finder', 'Root of a function from a starting guess, with every iteration shown.', 'x(n+1) = x(n) − f(x(n)) / f′(x(n))', 'Solver'],
      ['Simpson\'s Rule Integrator', 'Numerical value of a definite integral from sampled values.', '∫f dx ≈ (h / 3) × [f₀ + 4f₁ + 2f₂ + … + 4f(n−1) + fₙ]', 'Solver'],
      ['Cubic Equation Solver', 'Real and complex roots of a cubic.', 'ax³ + bx² + cx + d = 0, solved by Cardano\'s method', 'Solver'],
      ['Arithmetic and Geometric Sequence Calculator', 'Term and sum of an arithmetic or geometric sequence.', 'aₙ = a₁ + (n − 1)d; Sₙ = n(a₁ + aₙ) / 2; Sₙ = a₁(1 − rⁿ) / (1 − r)', 'Calculator'],
      ['Law of Sines and Cosines Triangle Solver', 'Unknown sides and angles of any triangle from three known values.', 'a / sin A = b / sin B = c / sin C; c² = a² + b² − 2ab cos C', 'Solver'],
      ['Prime Number Checker and Prime Factorisation', 'Whether a number is prime, and its prime factors.', 'n = p₁^k₁ × p₂^k₂ × … × pₘ^kₘ', 'Calculator'],
      ['Modular Arithmetic Calculator', 'Remainders, modular sums, products and powers.', 'a mod n = a − n × floor(a / n)', 'Calculator'],
      ['Eigenvalue and Eigenvector Calculator (2×2)', 'Eigenvalues and eigenvectors of a 2 × 2 matrix.', 'det(A − λI) = 0, then (A − λI)v = 0', 'Calculator']
    ]
  },
  'finance-money': {
    scope: 'Loans, interest, savings, investment growth and everyday money arithmetic, shown with the formula and the working so a figure can be checked.',
    best: ['home-loan-emi-calculator', 'amortization-calculator', 'home-loan-prepayment-calculator', 'home-loan-affordability-calculator', 'home-purchase-cost-calculator', 'home-loan-balance-transfer-calculator', 'floating-rate-simulator', 'under-construction-pre-emi-calculator'],
    also: [['calculators/finance-calculators/', 'Finance Calculators (coming soon)'], ['calculators/percentage-calculator/', 'Percentage Calculator']],
    limits: 'Rates, fees and tax percentages differ by country, lender and date, so they are always inputs you supply. These calculators will show arithmetic, not financial, tax or legal advice, and will not predict market returns.',
    related: ['business-economics', 'everyday-life-home', 'mathematics', 'education-exams'],
    planned: [
      ['Simple Interest Calculator', 'Interest, total amount and the rate or time that gives a target interest.', 'I = P × r × t', 'Calculator'],
      ['Compound Interest and Fixed Deposit Calculator', 'Maturity value for any compounding frequency.', 'A = P × (1 + r / m)^(m × t)', 'Calculator'],
      ['SIP and Recurring Investment Calculator', 'Future value of a fixed monthly investment at an assumed return.', 'FV = P × [((1 + i)ⁿ − 1) / i] × (1 + i)', 'Calculator'],
      ['CAGR Calculator', 'Compound annual growth rate between a start and an end value.', 'CAGR = (End / Start)^(1 / years) − 1', 'Calculator'],
      ['Inflation and Real Return Calculator', 'Real return after inflation and the future cost of something priced today.', 'Real = (1 + nominal) / (1 + inflation) − 1', 'Calculator'],
      ['Savings Goal Calculator', 'Regular deposit needed to reach a target amount.', 'PMT = FV × i / ((1 + i)ⁿ − 1)', 'Calculator'],
      ['Credit Card Payoff Time Calculator', 'Months needed to clear a balance with a fixed payment.', 'n = −ln(1 − B × i / P) / ln(1 + i)', 'Calculator'],
      ['GST and VAT Calculator', 'Add tax to a net price or take it out of a gross price.', 'Gross = Net × (1 + rate); Net = Gross / (1 + rate)', 'Calculator']
    ]
  },
  'unit-conversion-measurement': {
    scope: 'Electrical unit converters and the wider Conversion Centre for length, area, volume, mass, temperature, pressure, energy, power and more, with every factor checked against the SI definition.',
    best: ['three-phase-current', 'kva-to-amps', 'kw-to-kva', 'hp-kw-converter', 'power-converter', 'energy-converter', 'wire-gauge-conversion', 'fractional-inch-converter'],
    also: [['converters/index.html', 'Conversion Centre (all unit converters)'], ['converters/length-converter.html', 'Length Converter'], ['converters/temperature-converter.html', 'Temperature Converter'], ['converters/pressure-converter.html', 'Pressure Converter'], ['converters/si-prefix-converter.html', 'SI Prefix Converter']],
    limits: 'A conversion changes the unit, not the quantity, so check that both units measure the same thing. Some conversions, such as kW to amps, also need the voltage, phase and power factor. Where a unit has more than one definition, such as the US and UK gallon, the page names the one it uses.',
    related: ['engineering-technology', 'physics-applied-science', 'mathematics', 'everyday-life-home'],
    planned: [
      ['Fuel Efficiency Converter (km/L, L/100 km, mpg)', 'Convert between the three fuel economy units without the inversion mistake.', 'L/100 km = 100 / (km/L); mpg (US) = 235.215 / (L/100 km)', 'Converter'],
      ['Speed Converter (m/s, km/h, mph, knots)', 'Convert between common speed units.', 'v (km/h) = 3.6 × v (m/s); 1 knot = 1.852 km/h', 'Converter'],
      ['Torque Converter (N·m, lbf·ft, kgf·m)', 'Convert torque between SI and imperial units.', '1 lbf·ft = 1.355818 N·m', 'Converter'],
      ['Data Storage and Transfer Rate Converter', 'Bits, bytes, megabits per second and megabytes per second, decimal and binary.', 'MB/s = Mbit/s / 8; 1 KiB = 1,024 bytes', 'Converter'],
      ['Time Duration Converter', 'Seconds, minutes, hours, days and weeks.', '1 day = 86,400 s; 1 week = 604,800 s', 'Converter'],
      ['Acceleration Converter (m/s², g, ft/s²)', 'Convert acceleration units.', '1 g = 9.80665 m/s²', 'Converter'],
      ['Viscosity Converter (cP, mPa·s, St, cSt)', 'Convert dynamic and kinematic viscosity units.', '1 cP = 1 mPa·s; 1 St = 1 cm²/s = 100 cSt', 'Converter'],
      ['Concentration Converter (ppm, mg/L, percent)', 'Convert concentration units for dilute solutions.', '1 ppm ≈ 1 mg/L (dilute water); % = ppm / 10,000', 'Converter']
    ]
  },
  'physics-applied-science': {
    scope: 'Mechanics, optics, waves, thermodynamics and electricity problems that repeat the same few relations in different units.',
    best: [],
    also: [['calculators/science-calculators/', 'Science Calculators (coming soon)'], ['calculators/half-life-calculator/', 'Half-Life Calculator'], ['converters/coulombs-law.html', 'Coulomb\'s Law Calculator']],
    limits: 'Textbook formulas assume ideal conditions, such as no air resistance, no friction and uniform fields. Each page will state its assumptions, and results are estimates for those conditions.',
    related: ['mathematics', 'chemistry', 'engineering-technology', 'geography-astronomy'],
    planned: [
      ['Kinematics (SUVAT) Calculator', 'Motion with constant acceleration from any three known quantities.', 'v = u + at; s = ut + ½at²; v² = u² + 2as', 'Solver'],
      ['Projectile Motion Calculator', 'Range, maximum height and flight time of a launched object.', 'R = v² sin 2θ / g; H = v² sin²θ / 2g; T = 2v sin θ / g', 'Calculator'],
      ['Work, Energy and Power Calculator', 'Work done, kinetic energy and power.', 'W = F·d·cos θ; KE = ½mv²; P = W / t', 'Calculator'],
      ['Potential and Kinetic Energy Calculator', 'Energy exchange in a fall or a swing.', 'PE = mgh; v = √(2gh)', 'Calculator'],
      ['Centripetal Force Calculator', 'Force needed to keep a mass on a circular path.', 'F = mv² / r = mω²r', 'Calculator'],
      ['Snell\'s Law Calculator', 'Refraction angle at an interface between two media.', 'n₁ sin θ₁ = n₂ sin θ₂', 'Calculator'],
      ['Thin Lens Calculator', 'Image distance and magnification of a thin lens.', '1/f = 1/dₒ + 1/dᵢ; m = −dᵢ / dₒ', 'Calculator'],
      ['Doppler Effect Calculator', 'Observed frequency for a moving source or observer.', 'f′ = f × (v ± vₒ) / (v ∓ vₛ)', 'Calculator']
    ]
  },
  'computer-science-it': {
    scope: 'Networking, data storage, number systems, algorithms and AI workload sizing.',
    best: [],
    also: [['calculators/ai-calculators/', 'AI Calculators (coming soon)'], ['calculators/iot-calculators/', 'IoT Calculators (coming soon)'], ['calculators/binary-arithmetic-calculator/', 'Binary Arithmetic Calculator'], ['calculators/hex-calculator/', 'Hex Calculator'], ['converters/number-base-converter.html', 'Number Base Converter']],
    limits: 'Network, storage and AI sizing results are best-case figures from the formula. Protocol overhead, compression, caching, hardware and software choices change real results.',
    related: ['mathematics', 'engineering-technology', 'design-media-photography', 'statistics-data-analysis'],
    planned: [
      ['Subnet and CIDR Calculator', 'Network address, broadcast address and host count for an IPv4 prefix.', 'Usable hosts = 2^(32 − prefix) − 2', 'Calculator'],
      ['Data Transfer Time Calculator', 'Time to move a file at a given bandwidth.', 't = file size (bits) / bandwidth (bits/s)', 'Calculator'],
      ['RAID Capacity Calculator', 'Usable capacity of a RAID array.', 'RAID 5 = (n − 1) × disk size; RAID 6 = (n − 2) × disk size; RAID 1 = disk size', 'Calculator'],
      ['Password Entropy Calculator', 'Strength of a password from its length and character set.', 'H = L × log₂(N)', 'Calculator'],
      ['Bandwidth-Delay Product Calculator', 'Data in flight on a link, for sizing TCP windows.', 'BDP = bandwidth × round-trip time', 'Calculator'],
      ['Model Memory and Quantisation Calculator', 'Memory for model weights at a chosen precision.', 'Memory (bytes) = parameters × bits per weight / 8', 'Estimator'],
      ['LLM KV Cache Memory Calculator', 'Key-value cache size for a context length and batch.', 'Bytes = 2 × layers × KV heads × head dim × tokens × batch × bytes per value', 'Estimator'],
      ['AI API Token Cost Calculator', 'Cost of a workload from token counts and per-token prices.', 'Cost = (input tokens × input price + output tokens × output price) / 1,000,000', 'Calculator']
    ]
  },
  'business-economics': {
    scope: 'Profit, margin, pricing, inventory and project arithmetic for small businesses, students and analysts.',
    best: [],
    also: [['calculators/percentage-calculator/', 'Percentage Calculator'], ['calculators/sequential-discount-markup-calculator/', 'Sequential Discount and Markup Calculator']],
    limits: 'Business results depend on the costs, prices and demand you enter. These calculators show the arithmetic and do not forecast sales or give business advice.',
    related: ['finance-money', 'mathematics', 'statistics-data-analysis', 'education-exams'],
    planned: [
      ['Break-Even Calculator', 'Units that must be sold to cover fixed costs.', 'Break-even units = fixed costs / (price − variable cost per unit)', 'Calculator'],
      ['Profit Margin and Markup Calculator', 'Margin and markup from cost and price, and the price for a target margin.', 'Margin = (P − C) / P; Markup = (P − C) / C', 'Calculator'],
      ['Return on Investment (ROI) Calculator', 'Return on an investment as a percentage.', 'ROI = (gain − cost) / cost × 100', 'Calculator'],
      ['Payback Period Calculator', 'Time to recover an investment from steady savings.', 'Payback = investment / annual net cash flow', 'Calculator'],
      ['Economic Order Quantity (EOQ) Calculator', 'Order size that minimises ordering and holding cost.', 'EOQ = √(2DS / H)', 'Calculator'],
      ['Reorder Point Calculator', 'Stock level at which to reorder.', 'ROP = daily demand × lead time + safety stock', 'Calculator'],
      ['PERT Three-Point Estimate Calculator', 'Expected duration and spread from three estimates.', 'E = (O + 4M + P) / 6; σ = (P − O) / 6', 'Estimator'],
      ['Contribution Margin Calculator', 'Margin per unit and as a share of sales.', 'CM = price − variable cost; CM ratio = CM / price', 'Calculator']
    ]
  },
  'construction-architecture': {
    scope: 'Material quantities and simple building geometry for concrete, masonry, flooring, roofing and paint.',
    best: ['concrete-volume-calculator', 'cement-sand-aggregate-calculator', 'concrete-bag-calculator', 'rmc-calculator', 'concrete-cost-estimator'],
    also: [['calculators/area-calculator/', 'Area Calculator'], ['calculators/volume-surface-area/', 'Volume and Surface Area Calculator']],
    limits: 'Quantity calculators give the amount from the dimensions you enter. Add waste and overage as your supplier or specification advises, and do not use them for structural design.',
    related: ['engineering-technology', 'mathematics', 'unit-conversion-measurement', 'everyday-life-home'],
    planned: [
      ['Concrete Volume and Bags Calculator', 'Volume of a slab, footing or column and the bags needed.', 'V = L × W × H', 'Estimator'],
      ['Brick and Block Quantity Calculator', 'Number of bricks or blocks for a wall.', 'N = wall area / (brick face area including mortar)', 'Estimator'],
      ['Tile and Flooring Quantity Calculator', 'Tiles or boards for a floor, with waste.', 'N = ceil(floor area × (1 + waste) / tile area)', 'Estimator'],
      ['Roof Area from Pitch Calculator', 'True roof area from the plan area and pitch.', 'Roof area = plan area / cos θ', 'Calculator'],
      ['Paint Coverage Calculator', 'Litres of paint for a wall area and number of coats.', 'Litres = area × coats / coverage per litre', 'Estimator'],
      ['Rebar Weight Calculator', 'Mass of reinforcing bar from diameter and length.', 'kg/m = d² / 162 (d in mm)', 'Calculator'],
      ['Stair Rise and Run Calculator', 'Riser height and tread depth for a total rise.', 'Riser = rise / n; comfort rule 2R + T ≈ 600 to 650 mm', 'Calculator'],
      ['Excavation and Backfill Volume Calculator', 'Soil volume to dig and to return.', 'V = L × W × D; loose volume = V × (1 + swell factor)', 'Estimator']
    ]
  },
  'statistics-data-analysis': {
    scope: 'Descriptive statistics, regression, probability and distributions for measurement data and coursework.',
    best: ['mean-median-mode', 'standard-deviation', 'linear-regression', 'binomial-distribution', 'probability-calculator', 'random-number-generator'],
    also: [['calculators/engineering-mathematics/', 'Mathematics Hub'], ['calculators/percent-error-calculator/', 'Percent Error Calculator']],
    limits: 'Statistics describe the data you enter. Small samples, outliers and non-independent readings limit what a result can show, and a calculator cannot tell whether a test is the right one for your data.',
    related: ['mathematics', 'engineering-technology', 'education-exams', 'business-economics'],
    planned: [
      ['Z-Score and Normal Distribution Calculator', 'Z-score and the probability below, above or between values.', 'z = (x − μ) / σ', 'Calculator'],
      ['Confidence Interval Calculator', 'Interval for a mean from a sample.', 'CI = x̄ ± z × s / √n (use t when n is small)', 'Calculator'],
      ['Sample Size Calculator', 'Sample needed for a margin of error.', 'n = z² × p(1 − p) / E²', 'Estimator'],
      ['Poisson Distribution Calculator', 'Probability of k events in an interval.', 'P(k) = e^(−λ) × λ^k / k!', 'Calculator'],
      ['Correlation Coefficient Calculator', 'Strength of the linear relation between two variables.', 'r = Σ(x − x̄)(y − ȳ) / √(Σ(x − x̄)² × Σ(y − ȳ)²)', 'Analyzer'],
      ['Two-Sample t-Test Calculator', 'Whether two sample means differ.', 't = (x̄₁ − x̄₂) / √(s₁²/n₁ + s₂²/n₂)', 'Analyzer'],
      ['Chi-Square Test Calculator', 'Goodness of fit and independence on counts.', 'χ² = Σ (O − E)² / E', 'Analyzer'],
      ['Quartile, IQR and Outlier Calculator', 'Quartiles and the outlier fences of a data set.', 'IQR = Q3 − Q1; fences = Q1 − 1.5 IQR and Q3 + 1.5 IQR', 'Analyzer']
    ]
  },
  'energy-environment': {
    scope: 'Solar PV, wind and battery calculators, with energy efficiency and carbon tools planned next.',
    best: ['pv-array-size', 'pv-energy', 'pv-string-size', 'solar-inverter-sizing', 'hybrid-system-sizing', 'pv-performance-ratio', 'wind-power'],
    also: [['calculators/renewable-energy/', 'Renewable Energy Calculators'], ['calculators/power-and-energy/', 'Power and Energy Calculators']],
    limits: 'Yield and savings depend on the sun hours, wind speed, tariffs and emission factors you enter, and are not a site simulation. Shading, soiling, grid rules and local incentives are not modelled.',
    related: ['engineering-technology', 'automotive-transportation', 'physics-applied-science', 'food-agriculture'],
    planned: [
      ['Carbon Footprint of Electricity Calculator', 'Emissions from electricity use.', 'kg CO₂ = kWh × grid emission factor (kg CO₂/kWh)', 'Calculator'],
      ['Solar Payback Calculator', 'Years to recover a solar installation cost.', 'Payback = installed cost / annual saving', 'Calculator'],
      ['Heat Pump COP and Running Cost Calculator', 'Efficiency and running cost of a heat pump.', 'COP = Q(heat) / W(electric); cost = Q / COP × tariff', 'Calculator'],
      ['Insulation R-Value and Heat Loss Calculator', 'Heat loss through an insulated surface.', 'Q = A × ΔT / R; R = Σ (thickness / conductivity)', 'Calculator'],
      ['Wind Energy Yield Calculator', 'Annual energy of a turbine from its capacity factor.', 'AEP = 8,760 × capacity factor × rated power', 'Estimator'],
      ['Rainwater Harvesting Calculator', 'Water collected from a roof.', 'V = roof area × rainfall × runoff coefficient', 'Estimator'],
      ['Battery Storage Cycle Life Calculator', 'Years of service from cycle life and daily use.', 'Years = cycle life / cycles per year', 'Estimator'],
      ['Home Energy Savings Calculator', 'Saving from replacing an appliance or fitting.', 'Saving = (old kW − new kW) × hours × tariff', 'Calculator']
    ]
  },
  'health-fitness': {
    scope: 'Body measurements, energy needs and training zones for general information.',
    best: ['bmi-calculator', 'bmi-indian-regional-calculator', 'bmr-calculator', 'tdee-calculator', 'calorie-calculator', 'weight-loss-gain-calculator'],
    also: [],
    limits: 'Health calculators give general estimates from population formulas. They are not medical advice and cannot diagnose, treat or screen for any condition. They will be published only after review by a qualified subject specialist, and each page will say so.',
    related: ['sports-recreation', 'food-agriculture', 'everyday-life-home', 'biology-life-sciences'],
    planned: [
      ['Waist-to-Height Ratio Calculator', 'Waist circumference relative to height, using the same units for both measurements.', 'WHtR = waist circumference / height', 'Calculator'],
      ['BMR Calculator (Mifflin-St Jeor)', 'Resting energy use.', 'BMR = 10w + 6.25h − 5a + 5 (men); − 161 (women), w kg, h cm, a years', 'Estimator'],
      ['Daily Calorie Needs (TDEE) Calculator', 'Energy use including activity.', 'TDEE = BMR × activity factor', 'Estimator'],
      ['Heart Rate Zones Calculator (Karvonen)', 'Training zones from resting and maximum heart rate.', 'Target = (HRmax − HRrest) × intensity + HRrest', 'Calculator'],
      ['Waist-to-Hip Ratio Calculator', 'Ratio of waist to hip circumference.', 'WHR = waist / hip', 'Calculator'],
      ['Body Surface Area Calculator', 'Body surface area from height and mass.', 'BSA = √(height (cm) × mass (kg) / 3,600)', 'Calculator'],
      ['Macronutrient Split Calculator', 'Grams of protein, carbohydrate and fat for a calorie target.', 'Grams = calories × share / (4 or 9 kcal per g)', 'Calculator'],
      ['Water Intake Planner', 'A general daily fluid guide from body mass.', 'Litres ≈ mass (kg) × 0.033', 'Estimator']
    ]
  },
  'automotive-transportation': {
    scope: 'EV charging, range and charger load calculators, rail standby power, and fuel and drivetrain tools planned next.',
    best: ['ev-charge-time', 'ev-range', 'ev-energy-consumption', 'ev-charger-load', 'railway-backup-load'],
    also: [['calculators/automotive-calculators/', 'Automotive Calculators (coming soon)'], ['converters/rotational-speed-converter.html', 'Rotational Speed Converter']],
    limits: 'Real range, charging time and fuel use depend on speed, load, temperature, battery condition and driving style, so a result is an estimate from the inputs you give. Drivetrain and engine tools use ideal geometry and do not model losses or emissions rules.',
    related: ['energy-environment', 'engineering-technology', 'unit-conversion-measurement', 'everyday-life-home'],
    planned: [
      ['Fuel Efficiency Converter (km/L, L/100 km, mpg)', 'Convert between the three fuel economy units.', 'L/100 km = 100 / (km/L); mpg (US) = 235.215 / (L/100 km)', 'Converter'],
      ['Trip Fuel Cost Calculator', 'Fuel needed and cost for a journey.', 'Cost = distance × (L/100 km) / 100 × price per litre', 'Calculator'],
      ['EV vs Petrol Running Cost Calculator', 'Cost per kilometre of an electric car against a petrol or diesel car.', 'Cost per km = consumption per km × price per unit', 'Calculator'],
      ['EV Charging Cost Calculator', 'Cost of a charge, allowing for charging losses.', 'Cost = battery kWh × (SOC end − SOC start) / efficiency × tariff', 'Calculator'],
      ['Engine Power and Torque Calculator', 'Convert between torque and power at an engine speed.', 'P (kW) = 2π × N (rpm) × T (N·m) / 60,000', 'Calculator'],
      ['Gear Ratio and Vehicle Speed Calculator', 'Road speed for an engine speed, gear ratio, final drive and tyre.', 'v (km/h) = rpm × π × D × 60 / (1,000 × overall ratio), D in metres', 'Calculator'],
      ['Tyre Size and Speedometer Calculator', 'Overall tyre diameter and the speedometer error from a size change.', 'Diameter (mm) = rim (in) × 25.4 + 2 × width × aspect / 100', 'Calculator'],
      ['Engine Displacement and Compression Ratio Calculator', 'Swept volume from bore and stroke, and the compression ratio.', 'Vd = (π / 4) × bore² × stroke × cylinders; CR = (Vs + Vc) / Vc', 'Calculator']
    ]
  },
  'everyday-life-home': {
    scope: 'Dates, times, household costs and personal planning.',
    best: [],
    also: [['calculators/basic-calculator/', 'Basic Calculator'], ['calculators/percentage-calculator/', 'Percentage Calculator'], ['calculators/electricity-cost-planner/', 'Electricity Cost Calculator']],
    limits: 'Date and time tools follow the Gregorian calendar and do not know local holidays unless you enter them. Cost tools use the prices you enter.',
    related: ['finance-money', 'unit-conversion-measurement', 'construction-architecture', 'health-fitness'],
    planned: [
      ['Date Difference Calculator', 'Days, weeks and months between two dates.', 'Days = date₂ − date₁ (day numbers)', 'Calculator'],
      ['Age Calculator', 'Age in years, months and days.', 'Age = today − date of birth, borrowing days and months', 'Calculator'],
      ['Time Add and Subtract Calculator', 'Add or subtract hours, minutes and seconds.', 'Total seconds = 3,600h + 60m + s', 'Calculator'],
      ['Business Days Calculator', 'Working days between two dates, excluding weekends and holidays you list.', 'Business days = total days − weekend days − listed holidays', 'Calculator'],
      ['Tip and Bill Split Calculator', 'Tip and each person\'s share.', 'Share = bill × (1 + tip %) / people', 'Calculator'],
      ['Unit Price Comparison Calculator', 'Which pack is cheaper per unit.', 'Unit price = price / quantity', 'Calculator'],
      ['Time Zone Difference Calculator', 'Local time in another zone.', 'Local time = UTC + offset', 'Calculator'],
      ['Countdown to a Date Calculator', 'Days, hours and minutes until a date.', 'Remaining = target − now', 'Calculator']
    ]
  },
  'chemistry': {
    scope: 'Solutions, concentration, pH and gas calculations for students and laboratory work.',
    best: [],
    also: [['calculators/science-calculators/', 'Science Calculators (coming soon)'], ['converters/electrolysis-faraday-formulas.html', 'Electrolysis and Faraday\'s Law Formulas'], ['converters/temperature-converter.html', 'Temperature Converter']],
    limits: 'The calculators use ideal-solution and ideal-gas relations and standard atomic masses. Real solutions and gases deviate, and laboratory work needs the safety data and procedure for the substances used.',
    related: ['physics-applied-science', 'biology-life-sciences', 'food-agriculture', 'energy-environment'],
    planned: [
      ['Molar Mass Calculator', 'Molar mass of a compound from its formula.', 'M = Σ (atoms × atomic mass)', 'Calculator'],
      ['Molarity Calculator', 'Concentration, moles or volume of a solution.', 'M = n / V', 'Calculator'],
      ['Dilution Calculator', 'Volume of stock needed for a diluted solution.', 'M₁V₁ = M₂V₂', 'Calculator'],
      ['pH and pOH Calculator', 'pH, pOH and ion concentrations.', 'pH = −log₁₀[H⁺]; pH + pOH = 14 at 25 °C', 'Calculator'],
      ['Ideal Gas Law Calculator', 'Pressure, volume, amount or temperature of an ideal gas.', 'PV = nRT, R = 8.314 J/(mol·K)', 'Solver'],
      ['Limiting Reagent Calculator', 'Which reactant runs out, and the product amount.', 'Limiting reagent = the reactant with the smallest (moles / coefficient)', 'Calculator'],
      ['Percent Composition Calculator', 'Mass percent of each element in a compound.', '% element = (n × atomic mass / M) × 100', 'Calculator'],
      ['Percent Yield Calculator', 'Actual yield against the theoretical yield.', 'Percent yield = actual / theoretical × 100', 'Calculator']
    ]
  },
  'biology-life-sciences': {
    scope: 'Population, genetics and laboratory counting calculations.',
    best: [],
    also: [['calculators/half-life-calculator/', 'Half-Life Calculator'], ['calculators/probability-calculator/', 'Probability Calculator']],
    limits: 'Biological models use idealised assumptions such as unlimited resources or random mating. They describe a model, not a particular organism, and laboratory work needs its own validated procedure.',
    related: ['chemistry', 'health-fitness', 'statistics-data-analysis', 'food-agriculture'],
    planned: [
      ['Population Growth Calculator', 'Exponential growth of a population.', 'N = N₀ × e^(rt)', 'Calculator'],
      ['Doubling Time Calculator', 'Time for a population to double.', 't(d) = ln 2 / r', 'Calculator'],
      ['Hardy-Weinberg Calculator', 'Genotype frequencies from allele frequencies.', 'p² + 2pq + q² = 1; p + q = 1', 'Calculator'],
      ['Punnett Square Probability Calculator', 'Offspring genotype probabilities for a cross.', 'P = product of the allele probabilities from each parent', 'Calculator'],
      ['Serial Dilution Calculator', 'Concentration after a series of dilutions.', 'C(final) = C₀ / DFⁿ', 'Calculator'],
      ['Bacterial Generations Calculator', 'Number of generations between two counts.', 'n = (log N − log N₀) / log 2', 'Calculator'],
      ['Michaelis-Menten Calculator', 'Reaction rate from substrate concentration.', 'v = Vmax × [S] / (Km + [S])', 'Calculator'],
      ['Haemocytometer Cell Count Calculator', 'Cells per millilitre from a chamber count.', 'Cells/mL = mean count × dilution factor × 10,000', 'Calculator']
    ]
  },
  'education-exams': {
    scope: 'Grades, marks and exam planning.',
    best: [],
    also: [['calculators/basic-percentage-calculator/', 'Basic Percentage Calculator'], ['calculators/mean-median-mode/', 'Mean, Median and Mode']],
    limits: 'Grading schemes differ by school, board and country. The calculators use the weights and scale you enter and do not know your institution\'s rules.',
    related: ['mathematics', 'statistics-data-analysis', 'finance-money', 'business-economics'],
    planned: [
      ['GPA Calculator', 'Grade point average from grades and credits.', 'GPA = Σ (grade points × credits) / Σ credits', 'Calculator'],
      ['Weighted Grade Calculator', 'Course grade from weighted components.', 'Grade = Σ (score × weight) / Σ weights', 'Calculator'],
      ['Final Exam Grade Needed Calculator', 'Score needed on the final to reach a target.', 'Needed = (target − current × (1 − w)) / w', 'Calculator'],
      ['Marks to Percentage Calculator', 'Percentage from marks obtained and total marks.', 'Percentage = marks obtained / total marks × 100', 'Calculator'],
      ['Attendance Calculator', 'Classes to attend to reach a required attendance.', 'x ≥ (p × T − a) / (1 − p)', 'Calculator'],
      ['Class Average and Rank Calculator', 'Average of a class and a score\'s rank.', 'Average = Σ scores / n', 'Analyzer'],
      ['Grade Scale Converter', 'Convert a percentage to a letter grade on a scale you define.', 'Letter = first band whose minimum ≤ percentage', 'Converter'],
      ['Test Score Scaling Calculator', 'Scale a raw score to a new maximum.', 'Scaled = raw × new max / old max', 'Calculator']
    ]
  },
  'food-agriculture': {
    scope: 'Recipe scaling, baking ratios and crop and irrigation planning.',
    best: [],
    also: [['calculators/ratio-calculator/', 'Ratio Calculator'], ['converters/mass-converter.html', 'Mass Converter'], ['converters/volume-converter.html', 'Volume Converter']],
    limits: 'Cooking and farming results depend on ingredients, climate, soil and equipment. The calculators scale and convert; they do not replace a tested recipe, a soil test or local agricultural advice.',
    related: ['chemistry', 'health-fitness', 'energy-environment', 'everyday-life-home'],
    planned: [
      ['Recipe Scaler', 'Scale every ingredient to a new number of servings.', 'Factor = new servings / original servings', 'Calculator'],
      ['Baker\'s Percentage Calculator', 'Ingredient amounts as a percentage of flour weight.', 'Baker\'s % = ingredient weight / flour weight × 100', 'Calculator'],
      ['Dough Hydration Calculator', 'Hydration of a dough.', 'Hydration = water weight / flour weight × 100', 'Calculator'],
      ['Crop Yield Calculator', 'Yield per area from harvested mass.', 'Yield = harvested mass / area', 'Calculator'],
      ['Irrigation Water Requirement Calculator', 'Water volume to apply a depth over an area.', 'V = area × depth; 1 mm over 1 m² = 1 L', 'Estimator'],
      ['Fertilizer Application Rate Calculator', 'Fertilizer needed for a nutrient target.', 'Product (kg/ha) = target nutrient (kg/ha) / (nutrient % / 100)', 'Calculator'],
      ['Seed Rate Calculator', 'Seed needed for a target plant population.', 'Seed (kg/ha) = plants per ha × seed mass / germination / 1,000,000', 'Calculator'],
      ['Feed Conversion Ratio Calculator', 'Feed needed per unit of weight gain.', 'FCR = feed given / weight gained', 'Calculator']
    ]
  },
  'sports-recreation': {
    scope: 'Pace, race prediction and training load for runners, cyclists and swimmers.',
    best: [],
    also: [['converters/length-converter.html', 'Length Converter'], ['converters/mass-converter.html', 'Mass Converter']],
    limits: 'Performance predictions are statistical formulas from average athletes. Fitness, terrain, weather and pacing change real results. Training calculators are not coaching or medical advice.',
    related: ['health-fitness', 'unit-conversion-measurement', 'statistics-data-analysis', 'automotive-transportation'],
    planned: [
      ['Running Pace Calculator', 'Pace, time or distance from the other two.', 'Pace = time / distance', 'Calculator'],
      ['Race Time Predictor (Riegel)', 'Predicted race time at another distance.', 'T₂ = T₁ × (D₂ / D₁)^1.06', 'Estimator'],
      ['Cooper Test VO₂max Estimator', 'Aerobic fitness estimate from a 12-minute run.', 'VO₂max = (distance in m − 504.9) / 44.73', 'Estimator'],
      ['Calories Burned (MET) Calculator', 'Energy cost of an activity.', 'kcal = MET × mass (kg) × hours', 'Estimator'],
      ['Batting Average Calculator', 'Batting average from hits and at-bats.', 'AVG = hits / at-bats', 'Calculator'],
      ['Pythagorean Win Expectation Calculator', 'Expected win share from points scored and allowed.', 'Win % = PF² / (PF² + PA²)', 'Estimator'],
      ['Bicycle Gear Ratio Calculator', 'Gear ratio and speed at a cadence.', 'Ratio = chainring teeth / cog teeth', 'Calculator'],
      ['Swim Pace per 100 m Calculator', 'Pace per 100 m from a swim time.', 'Pace = time / distance × 100', 'Calculator']
    ]
  },
  'geography-astronomy': {
    scope: 'Coordinates, distances, map scale and orbital calculations.',
    best: [],
    also: [['converters/dms-converter.html', 'DMS to Decimal Degrees Converter'], ['converters/length-converter.html', 'Length Converter']],
    limits: 'Distance formulas treat the Earth as a sphere, so results differ slightly from ellipsoidal survey values. Orbital formulas assume two bodies and a circular or elliptical path.',
    related: ['physics-applied-science', 'unit-conversion-measurement', 'mathematics', 'automotive-transportation'],
    planned: [
      ['Distance Between Coordinates Calculator (Haversine)', 'Great-circle distance between two latitude and longitude points.', 'd = 2R × asin √(sin²(Δφ/2) + cos φ₁ cos φ₂ sin²(Δλ/2))', 'Calculator'],
      ['Initial Bearing Calculator', 'Compass bearing from one point to another.', 'θ = atan2(sin Δλ cos φ₂, cos φ₁ sin φ₂ − sin φ₁ cos φ₂ cos Δλ)', 'Calculator'],
      ['Map Scale Calculator', 'Ground distance from a map distance.', 'Ground = map distance × scale denominator', 'Calculator'],
      ['Longitude to Time Offset Calculator', 'Solar time offset from longitude.', 'Offset (hours) = longitude / 15', 'Calculator'],
      ['Orbital Period Calculator', 'Period of an orbit from its semi-major axis.', 'T = 2π √(a³ / GM)', 'Calculator'],
      ['Escape Velocity Calculator', 'Speed needed to leave a body\'s gravity.', 'v = √(2GM / r)', 'Calculator'],
      ['Light Travel Time Calculator', 'Time for light to cross a distance.', 't = d / c, c = 299,792,458 m/s', 'Calculator'],
      ['Surface Gravity Calculator', 'Gravity at the surface of a body.', 'g = GM / r²', 'Calculator']
    ]
  },
  'design-media-photography': {
    scope: 'Image sizes, aspect ratios, print resolution and media file sizes.',
    best: [],
    also: [['calculators/ratio-calculator/', 'Ratio Calculator']],
    limits: 'File size results are for uncompressed or constant-bitrate data. Compression, codecs and container overhead change real files.',
    related: ['computer-science-it', 'unit-conversion-measurement', 'mathematics', 'everyday-life-home'],
    planned: [
      ['Aspect Ratio Calculator', 'Simplified ratio and the matching height or width.', 'New height = new width × (height / width)', 'Calculator'],
      ['Print Size from Pixels Calculator', 'Print size an image supports at a resolution.', 'Inches = pixels / dpi', 'Calculator'],
      ['Video File Size Calculator', 'File size from bitrate and duration.', 'Size (MB) = bitrate (Mbit/s) × seconds / 8', 'Estimator'],
      ['Audio File Size Calculator', 'Uncompressed audio size.', 'Bytes = sample rate × bit depth × channels × seconds / 8', 'Estimator'],
      ['Screen Pixel Density (PPI) Calculator', 'Pixels per inch of a display.', 'PPI = √(w² + h²) / diagonal', 'Calculator'],
      ['Golden Ratio Calculator', 'Lengths in the golden ratio.', 'φ = (1 + √5) / 2 ≈ 1.618; b = a / φ', 'Calculator'],
      ['Pixel, Point and Em Converter', 'Convert type sizes between px, pt and em.', 'pt = px × 0.75; em = px / base size', 'Converter'],
      ['Exposure Value Calculator', 'Exposure value from aperture and shutter time.', 'EV = log₂(N² / t)', 'Calculator']
    ]
  }
};
module.exports = { CATEGORY_CONTENT: C, TYPES };
