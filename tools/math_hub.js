/* Content of the Mathematics category landing page (v1.99.104): the section plan from the Global SEO Heading Strategy, section 5.
   Edit this file only. Each id is an engine calculator id or a standalone page id; build_pages.js resolves the link and the
   one-line description from the registry or the page itself, so nothing is typed twice. */
const SECTIONS = [
  { h2: 'Basic Mathematics Calculators', ids: ['basic-calculator', 'percentage-calculator', 'fraction-arithmetic', 'ratio-calculator', 'rounding-calculator', 'gcf-calculator', 'lcm-calculator'] },
  { h2: 'Algebra and Equation Calculators', ids: ['quadratic-solver', 'discriminant-calculator', 'exact-roots', 'simultaneous-equations', 'log-solver'] },
  { h2: 'Exponents, Powers and Roots', ids: ['exponent-calculator', 'exponent-laws-calculator', 'exponent-solver', 'square-root-calculator', 'nth-root-calculator', 'logarithm'] },
  { h2: 'Probability and Statistics Calculators', ids: ['probability-calculator', 'permutations-combinations', 'binomial-distribution', 'mean-median-mode', 'standard-deviation', 'linear-regression'] }
];
const FORMULAS = [
  ['percentage-ratio-rounding-formulas.html', 'Percentage, Ratio and Rounding Formulas'],
  ['percentage-error-formulas.html', 'Percentage Error Formulas for Measurements'],
  ['quadratic-log-power-formulas.html', 'Quadratic, Logarithm and Power Formulas'],
  ['trigonometry-formulas.html', 'Trigonometry Formulas'],
  ['complex-number-formulas.html', 'Complex Number Formulas'],
  ['statistics-formulas.html', 'Mean and Standard Deviation Formulas'],
  ['probability-formulas.html', 'Probability, Combinations and Binomial Formulas']
];
const FAQ = [
  ['Are the mathematics calculators free to use?', 'Yes. Every mathematics calculator on Elecmetric is free and runs in your browser.'],
  ['Do the mathematics calculators show their working?', 'Each result shows its formula and the working step by step, and the calculator page includes a worked example using its default values.'],
  ['Which calculator should I use for percentages?', 'Use the Basic Percentage Calculator for X% of a number or one number as a percentage of another, the Percentage Increase and Decrease Calculator for changes, and the Percentage Error Calculator to compare a reading with a true value.'],
  ['Can I use these calculators for engineering work?', 'Yes, for the arithmetic and algebra behind a calculation. They work on plain numbers and do not track units, so enter every value in one consistent unit and check the result against your own method.']
];
module.exports = { SECTIONS, FORMULAS, FAQ, TITLE_H1: 'Online Mathematics Calculators', DESC: 'Find free online mathematics calculators for arithmetic, algebra, equations, fractions, percentages, statistics and other mathematical problems.' };
