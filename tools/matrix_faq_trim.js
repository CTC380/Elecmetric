/* Cuts the Matrix Calculator FAQ from 34 questions to 10 (FAQ review v1.99.101, item 1).
   Merged answers reuse the wording of the original answers; nothing new is claimed.
   Run:  node tools/matrix_faq_trim.js   (rewrites calculators/matrix-calculator/index.html and tools/standalone/matrix-calculator.html; refuses to run twice) */
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
const files = ['calculators/matrix-calculator/index.html', 'tools/standalone/matrix-calculator.html'];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
files.forEach((rel) => {
  const file = path.join(root, rel); let h = fs.readFileSync(file, 'utf8');
  const a = h.indexOf('<section id="faq">'), b = h.indexOf('</section>', a);
  if (a < 0 || b < 0) throw new Error('no FAQ section in ' + rel);
  const sec = h.slice(a, b), old = {};
  sec.replace(/<h3>(.*?)<\/h3><p>(.*?)<\/p>/g, (m, q, p) => { old[q] = p; return m; });
  if (Object.keys(old).length !== 34) throw new Error(rel + ': expected 34 questions, found ' + Object.keys(old).length + ' (already trimmed?)');
  const A = (q) => { if (!(q in old)) throw new Error('missing: ' + q); return old[q]; };
  const faq = [
    ['What operations does this matrix calculator do?', A('What operations does this matrix calculator do?')],
    ['Are the results exact?', A('Are the results exact?')],
    ['How do you decide a matrix is singular, and what is the condition number?', A('How do you decide a matrix is singular?') + ' ' + A('What is the condition number?')],
    ['How do I solve simultaneous equations, and how are the three cases told apart?', A('How do I solve simultaneous equations?') + ' ' + A('How does it tell unique, infinite and no-solution systems apart?')],
    ['Which method should I use: Gauss-Jordan, Cramer, LU, QR or SVD?', A('Which solve method should I use?') + ' ' + A('Should I use LU, QR or SVD?')],
    ['How do I know a decomposition is right?', A('How do I know a decomposition is right?')],
    ['Why are some eigenvalues complex, and what is a defective matrix?', A('Why are some eigenvalues complex?') + ' ' + A('What does a defective matrix mean?')],
    ['What is the matrix exponential, and how is it computed?', A('What is the matrix exponential?') + ' ' + A('How is e^A computed, and is the series used?')],
    ['How do I enter a circuit for nodal analysis?', A('How do I enter a circuit for nodal analysis?') + ' ' + A('How does it handle voltage sources?')],
    ['Is anything sent to a server?', A('Is anything sent to a server?')]
  ];
  const html = '<section id="faq"><h2>Questions</h2>' + faq.map((q) => '<h3>' + q[0].replace(/&/g, '&amp;') + '</h3><p>' + q[1] + '</p>').join('');
  h = h.slice(0, a) + html + h.slice(b);
  fs.writeFileSync(file, h);
  console.log(rel + ': 34 -> ' + faq.length + ' questions');
});
