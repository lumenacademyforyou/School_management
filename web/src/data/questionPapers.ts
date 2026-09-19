// Question Paper Generator (LMN-SMS-FEAT-001 §33, QPG-001 … QPG-018).
// Types, seed data and pure rules. Screens reach this through services/questionPaperService.

export type QuestionType = 'MCQ' | 'Very short answer' | 'Short answer' | 'Long answer' | 'Case study';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type BlueprintDifficulty = Difficulty | 'Mixed';
export type PaperLanguage = 'English' | 'Tamil' | 'Hindi';
export type QuestionStatus = 'Approved' | 'Draft' | 'Retired';
export type QuestionSource = 'Teacher' | 'AI generated' | 'Imported';

export const QUESTION_TYPES: QuestionType[] = ['MCQ', 'Very short answer', 'Short answer', 'Long answer', 'Case study'];
export const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];
export const PAPER_LANGUAGES: PaperLanguage[] = ['English', 'Tamil', 'Hindi'];
export const BOARDS = ['CBSE', 'State Board (Tamil Nadu)', 'ICSE'] as const;
export const ACADEMIC_YEARS = ['2024–25', '2023–24'] as const;
export const EXAM_TYPES = ['Unit test', 'Term examination', 'Half-yearly', 'Pre-board'] as const;
export const EXAMS: Record<(typeof EXAM_TYPES)[number], string[]> = {
  'Unit test': ['Unit Test 1', 'Unit Test 2', 'Unit Test 3'],
  'Term examination': ['Term 1', 'Term 2'],
  'Half-yearly': ['Half-yearly'],
  'Pre-board': ['Pre-board 1', 'Pre-board 2'],
};
export const CLASS_LEVELS = [8, 9, 10] as const;
export const SUBJECTS = ['Mathematics', 'Science', 'English', 'Social Science'] as const;
export type Subject = (typeof SUBJECTS)[number];

export const CHAPTERS: Record<string, string[]> = {
  'Mathematics-10': [
    'Real Numbers',
    'Polynomials',
    'Pair of Linear Equations',
    'Quadratic Equations',
    'Arithmetic Progressions',
    'Triangles',
    'Coordinate Geometry',
    'Trigonometry',
    'Applications of Trigonometry',
    'Circles',
    'Statistics',
    'Probability',
  ],
  'Science-10': ['Light', 'Electricity', 'Chemical Reactions'],
};
export const chaptersFor = (subject: string, classLevel: number) => CHAPTERS[`${subject}-${classLevel}`] ?? [];

export const LANGUAGE_CODE: Record<PaperLanguage, 'en' | 'ta' | 'hi'> = { English: 'en', Tamil: 'ta', Hindi: 'hi' };

export interface BankQuestion {
  id: string;
  text: string;
  type: QuestionType;
  marks: number;
  difficulty: Difficulty;
  classLevel: number;
  subject: Subject;
  chapter: string;
  topic: string;
  tags: string[];
  options?: string[];
  answer: string;
  markingScheme: string;
  /** QPG-018: versions in other languages. English is always present. */
  translations?: Partial<Record<'ta' | 'hi', string>>;
  usageCount: number;
  lastUsedIn?: string;
  status: QuestionStatus;
  source: QuestionSource;
  author: string;
  hasDiagram?: boolean;
}

// ---------------------------------------------------------------------------
// Question bank seed (QPG-001, QPG-002)
// ---------------------------------------------------------------------------

type Seed = [QuestionType, Difficulty, string, string, string, string, string?, string[]?];

const COORDINATOR = 'Mr. Arun Prakash';
const MATHS_HOD = 'Dr. V. Raghavan';

// type, difficulty, chapter, topic, question, answer, marking scheme, options
const MATHS_10: Seed[] = [
  ['MCQ', 'Easy', 'Real Numbers', 'HCF and LCM', 'The HCF of 96 and 404 is', '4', undefined, ['2', '4', '12', '24']],
  ['MCQ', 'Easy', 'Real Numbers', 'HCF and LCM', 'If HCF(26, 91) = 13, then LCM(26, 91) is', '182', undefined, ['182', '91', '13', '2366']],
  ['MCQ', 'Easy', 'Real Numbers', 'Irrational numbers', 'Which of the following is irrational?', '√5', undefined, ['√16', '√(4/9)', '√5', '0.25']],
  ['MCQ', 'Medium', 'Real Numbers', 'HCF and LCM', 'The product of the HCF and LCM of 12 and 18 is', '216', undefined, ['216', '36', '72', '108']],
  ['MCQ', 'Easy', 'Polynomials', 'Zeroes of a polynomial', 'The graph of a polynomial cuts the x-axis at three points. The number of zeroes is', '3', undefined, ['1', '2', '3', '0']],
  ['MCQ', 'Easy', 'Polynomials', 'Zeroes and coefficients', 'If α and β are the zeroes of x² − 5x + 6, then α + β is', '5', undefined, ['5', '−5', '6', '−6']],
  ['MCQ', 'Medium', 'Polynomials', 'Zeroes and coefficients', 'A quadratic polynomial whose zeroes have sum 3 and product 2 is', 'x² − 3x + 2', undefined, ['x² − 3x + 2', 'x² + 3x + 2', 'x² − 2x + 3', 'x² + 2x − 3']],
  ['MCQ', 'Easy', 'Pair of Linear Equations', 'Consistency', 'The pair x + 2y = 4 and 2x + 4y = 8 has', 'infinitely many solutions', undefined, ['a unique solution', 'no solution', 'infinitely many solutions', 'exactly two solutions']],
  ['MCQ', 'Medium', 'Pair of Linear Equations', 'Consistency', 'For what value of k do 3x + y = 1 and 6x + ky = 2 have infinitely many solutions?', '2', undefined, ['1', '2', '3', '6']],
  ['MCQ', 'Medium', 'Quadratic Equations', 'Discriminant', 'The discriminant of 2x² − 4x + 3 = 0 is', '−8', undefined, ['−8', '8', '16', '−16']],
  ['MCQ', 'Easy', 'Quadratic Equations', 'Nature of roots', 'Which equation has two equal real roots?', 'x² − 4x + 4 = 0', undefined, ['x² − 4x + 4 = 0', 'x² + 1 = 0', 'x² − 5x + 6 = 0', 'x² − 2 = 0']],
  ['MCQ', 'Easy', 'Quadratic Equations', 'Solving by factorisation', 'The roots of x² − 9 = 0 are', '±3', undefined, ['±3', '3 only', '9', '±9']],
  ['MCQ', 'Easy', 'Arithmetic Progressions', 'nth term', 'The 10th term of the AP 2, 7, 12, … is', '47', undefined, ['47', '45', '52', '50']],
  ['MCQ', 'Easy', 'Arithmetic Progressions', 'Common difference', 'The common difference of the AP 3, 1, −1, −3, … is', '−2', undefined, ['2', '−2', '1', '−1']],
  ['MCQ', 'Easy', 'Arithmetic Progressions', 'Sum of n terms', 'The sum of the first 10 natural numbers is', '55', undefined, ['45', '50', '55', '100']],
  ['MCQ', 'Medium', 'Triangles', 'Basic Proportionality Theorem', 'In △ABC, DE ∥ BC and AD : DB = 2 : 3. If AE = 4 cm, then EC is', '6 cm', undefined, ['6 cm', '5 cm', '8 cm', '2.67 cm']],
  ['MCQ', 'Easy', 'Triangles', 'Similarity', 'Two triangles are similar if their corresponding angles are', 'equal', undefined, ['equal', 'supplementary', 'complementary', 'in the ratio 1 : 2']],
  ['MCQ', 'Easy', 'Coordinate Geometry', 'Distance formula', 'The distance between (0, 0) and (3, 4) is', '5', undefined, ['5', '7', '25', '1']],
  ['MCQ', 'Easy', 'Coordinate Geometry', 'Section formula', 'The midpoint of the segment joining (2, 3) and (4, 7) is', '(3, 5)', undefined, ['(3, 5)', '(6, 10)', '(1, 2)', '(3, 4)']],
  ['MCQ', 'Medium', 'Coordinate Geometry', 'Distance formula', 'The point on the x-axis equidistant from (−2, 0) and (6, 0) is', '(2, 0)', undefined, ['(2, 0)', '(4, 0)', '(0, 2)', '(1, 0)']],
  ['MCQ', 'Easy', 'Trigonometry', 'Standard angles', 'sin 30° + cos 60° equals', '1', undefined, ['1', '1/2', '√3', '0']],
  ['MCQ', 'Medium', 'Trigonometry', 'Trigonometric ratios', 'If tan A = 3/4, then sin A is', '3/5', undefined, ['3/5', '4/5', '3/4', '5/3']],
  ['MCQ', 'Easy', 'Trigonometry', 'Identities', 'sin²θ + cos²θ equals', '1', undefined, ['0', '1', '2', 'tan θ']],
  ['MCQ', 'Easy', 'Trigonometry', 'Standard angles', 'The value of tan 45° is', '1', undefined, ['0', '1', '√3', '1/√3']],
  ['MCQ', 'Easy', 'Statistics', 'Mode', 'The mode of 2, 3, 3, 5, 7, 3, 9 is', '3', undefined, ['3', '5', '7', '9']],
  ['MCQ', 'Easy', 'Statistics', 'Median', 'The median of 4, 8, 6, 10, 12 is', '8', undefined, ['6', '8', '10', '7']],
  ['MCQ', 'Medium', 'Statistics', 'Ogive', 'Which measure can be read from the intersection of the two ogives?', 'Median', undefined, ['Mean', 'Median', 'Mode', 'Range']],
  ['MCQ', 'Easy', 'Probability', 'Basic probability', 'The probability of an impossible event is', '0', undefined, ['0', '1', '0.5', '−1']],
  ['MCQ', 'Easy', 'Probability', 'Basic probability', 'A die is thrown once. The probability of getting an even number is', '1/2', undefined, ['1/2', '1/3', '1/6', '2/3']],
  ['MCQ', 'Easy', 'Probability', 'Playing cards', 'A card is drawn from a well-shuffled deck of 52 cards. The probability of getting a king is', '1/13', undefined, ['1/13', '1/52', '4/13', '1/4']],
  ['MCQ', 'Easy', 'Probability', 'Basic probability', 'The probability of a sure event is', '1', undefined, ['1', '0', '1/2', '2']],
  ['MCQ', 'Medium', 'Probability', 'Basic probability', 'Which of these cannot be the probability of an event?', '1.5', undefined, ['0.7', '2/3', '1.5', '0']],
  ['Very short answer', 'Easy', 'Real Numbers', 'HCF and LCM', 'Find the HCF of 336 and 54 using prime factorisation.', '6', '1 mark for the factorisations, 1 mark for the HCF.'],
  ['Very short answer', 'Medium', 'Polynomials', 'Zeroes and coefficients', 'Find the zeroes of x² − 2x − 8.', '4 and −2', '1 mark for factorising, 1 mark for both zeroes.'],
  ['Very short answer', 'Medium', 'Pair of Linear Equations', 'Elimination', 'Solve 2x + 3y = 11 and 2x − 4y = −24.', 'x = −2, y = 5', '1 mark for eliminating x, 1 mark for both values.'],
  ['Very short answer', 'Easy', 'Quadratic Equations', 'Nature of roots', 'Find the nature of the roots of 2x² − 6x + 3 = 0.', 'D = 12 > 0, so two distinct real roots', '1 mark for D, 1 mark for the conclusion.'],
  ['Very short answer', 'Easy', 'Arithmetic Progressions', 'nth term', 'Which term of the AP 21, 18, 15, … is −81?', 'The 35th term', '1 mark for the equation, 1 mark for n.'],
  ['Very short answer', 'Medium', 'Coordinate Geometry', 'Section formula', 'Find the point that divides the join of (−1, 7) and (4, −3) in the ratio 2 : 3.', '(1, 3)', '1 mark for the formula, 1 mark for the point.'],
  ['Very short answer', 'Easy', 'Trigonometry', 'Standard angles', 'Evaluate 2 tan² 45° + cos² 30° − sin² 60°.', '2', '1 mark for substituting values, 1 mark for the result.'],
  ['Very short answer', 'Easy', 'Probability', 'Two dice', 'Two dice are thrown together. Find the probability of getting a doublet.', '1/6', '1 mark for the favourable outcomes, 1 mark for the probability.'],
  ['Very short answer', 'Easy', 'Statistics', 'Mean', 'Find the mean of the first five prime numbers.', '5.6', '1 mark for the sum, 1 mark for the mean.'],
  ['Very short answer', 'Easy', 'Real Numbers', 'Fundamental theorem', 'Express 156 as a product of its prime factors.', '2² × 3 × 13', '2 marks for the complete factorisation.'],
  ['Very short answer', 'Medium', 'Circles', 'Tangents', 'From a point 13 cm from the centre of a circle, the tangent is 12 cm long. Find the radius.', '5 cm', '1 mark for the right angle, 1 mark for the radius.'],
  ['Very short answer', 'Easy', 'Arithmetic Progressions', 'Sum of n terms', 'Find the sum of the first 20 odd numbers.', '400', '1 mark for the formula, 1 mark for the sum.'],
  ['Short answer', 'Medium', 'Real Numbers', 'Irrational numbers', 'Prove that √3 is irrational.', 'Proof by contradiction', '1 mark assumption, 2 marks deduction, 1 mark contradiction.'],
  ['Short answer', 'Medium', 'Polynomials', 'Forming polynomials', 'Find the quadratic polynomial whose zeroes are 3 + √2 and 3 − √2.', 'x² − 6x + 7', '1 mark sum, 1 mark product, 2 marks polynomial.'],
  ['Short answer', 'Medium', 'Pair of Linear Equations', 'Word problems', 'The digits of a two-digit number add up to 9. Nine times the number is twice the number with its digits reversed. Find the number.', '18', '2 marks for the equations, 2 marks for solving.'],
  ['Short answer', 'Medium', 'Quadratic Equations', 'Solving by factorisation', 'Find the roots of 6x² − x − 2 = 0 by factorisation.', '2/3 and −1/2', '2 marks splitting the middle term, 2 marks roots.'],
  ['Short answer', 'Medium', 'Arithmetic Progressions', 'Sum of n terms', 'How many terms of the AP 9, 17, 25, … must be taken to give a sum of 636?', '12', '1 mark formula, 2 marks quadratic, 1 mark rejecting the negative root.'],
  ['Short answer', 'Hard', 'Coordinate Geometry', 'Section formula', 'Find the ratio in which the y-axis divides the join of (5, −6) and (−1, −4). Also find the point of division.', '5 : 1, (0, −13/3)', '2 marks ratio, 2 marks point.'],
  ['Short answer', 'Medium', 'Trigonometry', 'Identities', 'Prove that (1 + tan² A) / (1 + cot² A) = tan² A.', 'Identity proved', '2 marks for rewriting in sec and cosec, 2 marks for simplifying.'],
  ['Short answer', 'Easy', 'Probability', 'Basic probability', 'A bag has 3 red and 5 black balls. One ball is drawn at random. Find the probability that it is (i) red (ii) not red.', '(i) 3/8 (ii) 5/8', '2 marks each part.'],
  ['Short answer', 'Hard', 'Statistics', 'Mode of grouped data', 'Find the mode: 0–10: 5, 10–20: 8, 20–30: 7, 30–40: 12, 40–50: 28, 50–60: 20, 60–70: 10, 70–80: 10.', '46.67', '1 mark modal class, 2 marks formula, 1 mark value.'],
  ['Short answer', 'Medium', 'Circles', 'Tangents', 'Prove that the tangent at any point of a circle is perpendicular to the radius through the point of contact.', 'Theorem proved', '1 mark figure, 3 marks proof.'],
  ['Long answer', 'Hard', 'Triangles', 'Basic Proportionality Theorem', 'State and prove the Basic Proportionality Theorem. Use it to show that a line through the midpoint of one side of a triangle, parallel to another side, bisects the third side.', 'Theorem and corollary proved', '1 mark statement, 1 mark figure, 3 marks proof, 1 mark application.'],
  ['Long answer', 'Hard', 'Quadratic Equations', 'Word problems', 'A train travels 360 km at a uniform speed. Had the speed been 5 km/h more, the journey would have taken 1 hour less. Find the speed of the train.', '40 km/h', '2 marks equation, 3 marks solving, 1 mark conclusion.'],
  ['Long answer', 'Hard', 'Applications of Trigonometry', 'Heights and distances', 'From a point on the ground 30 m from the foot of a tower, the angle of elevation of its top is 30°. Find the height of the tower. How far closer must the observer walk for the angle to become 60°?', '10√3 m; 20 m closer', '1 mark figure, 2 marks height, 3 marks second part.'],
  ['Long answer', 'Hard', 'Statistics', 'Mean and median', 'Find the mean and the median: 0–20: 6, 20–40: 8, 40–60: 10, 60–80: 12, 80–100: 6, 100–120: 5, 120–140: 3.', 'Mean 62.4, median 61.67', '3 marks mean, 3 marks median.'],
  ['Long answer', 'Hard', 'Pair of Linear Equations', 'Graphical method', 'Solve graphically: x − y + 1 = 0 and 3x + 2y − 12 = 0. Find the vertices of the triangle these lines form with the x-axis.', '(2, 3); vertices (−1, 0), (4, 0), (2, 3)', '3 marks graph, 1 mark solution, 2 marks vertices.'],
  ['Long answer', 'Hard', 'Arithmetic Progressions', 'Sum of n terms', 'The sum of the first 7 terms of an AP is 49 and the sum of the first 17 terms is 289. Find the sum of the first n terms.', 'Sₙ = n²', '2 marks equations, 2 marks a and d, 2 marks Sₙ.'],
  ['Long answer', 'Hard', 'Circles', 'Tangents', 'Prove that the lengths of the tangents drawn from an external point to a circle are equal. Use this to show that a quadrilateral circumscribing a circle has AB + CD = AD + BC.', 'Both results proved', '1 mark figure, 3 marks theorem, 2 marks application.'],
  ['Case study', 'Medium', 'Arithmetic Progressions', 'Applications', 'Sports day seating: the first row of a stand has 20 seats, the second 24, the third 28, and so on. (i) How many seats are in the 15th row? (ii) How many seats are in the first 15 rows? (iii) Which row has 100 seats?', '(i) 76 (ii) 720 (iii) 21st row', '2 + 3 + 3 marks.'],
  ['Case study', 'Medium', 'Applications of Trigonometry', 'Heights and distances', 'Kite festival: a kite flies at a height of 60 m and its string makes 60° with the ground. (i) Find the length of the string. (ii) Find the horizontal distance of the kite from the flyer. (iii) If the angle becomes 45° at the same height, how much longer must the string be?', '(i) 40√3 m (ii) 20√3 m (iii) (60√2 − 40√3) m', '2 + 3 + 3 marks.'],
  ['Case study', 'Easy', 'Coordinate Geometry', 'Applications', 'School garden: a rectangular plot has corners A(1, 2), B(7, 2), C(7, 6) and D(1, 6). (i) Find AB. (ii) Find the midpoint of AC. (iii) Find the length of the diagonal. (iv) Find the point dividing AB in the ratio 1 : 2.', '(i) 6 (ii) (4, 4) (iii) 2√13 (iv) (3, 2)', '2 marks each part.'],
  ['Case study', 'Medium', 'Probability', 'Applications', 'Fun fair: a box has 20 cards numbered 1 to 20. One card is drawn at random. Find the probability that the number is (i) prime (ii) a multiple of 3 (iii) not a multiple of 5.', '(i) 2/5 (ii) 3/10 (iii) 4/5', '3 + 3 + 2 marks.'],
  ['Very short answer', 'Easy', 'Polynomials', 'Zeroes of a polynomial', 'Find the zero of the polynomial p(x) = 3x − 6.', 'x = 2', '1 mark for setting p(x) = 0, 1 mark for the zero.'],
  ['Very short answer', 'Easy', 'Triangles', 'Similarity', '△ABC ~ △DEF with AB = 3 cm and DE = 6 cm. Find the ratio of their perimeters.', '1 : 2', '2 marks for the ratio with a reason.'],
  ['Very short answer', 'Medium', 'Statistics', 'Median', 'Write the empirical relationship between mean, median and mode.', 'Mode = 3 Median − 2 Mean', '2 marks for the correct relation.'],
  ['Very short answer', 'Easy', 'Coordinate Geometry', 'Distance formula', 'Find the distance of the point (−6, 8) from the origin.', '10', '1 mark for the formula, 1 mark for the value.'],
  ['Short answer', 'Medium', 'Triangles', 'Similarity', 'In △ABC, DE ∥ BC with AD = 2 cm, DB = 3 cm and DE = 4 cm. Find BC.', '10 cm', '2 marks for similarity, 2 marks for BC.'],
  ['Short answer', 'Medium', 'Coordinate Geometry', 'Area and collinearity', 'Show that the points (1, 5), (2, 3) and (−2, 11) are collinear.', 'Collinear: the area of the triangle is 0', '2 marks for the area formula, 2 marks for the conclusion.'],
  ['Short answer', 'Medium', 'Applications of Trigonometry', 'Heights and distances', 'A boy 1.5 m tall stands 28.5 m from a building. The angle of elevation of its top from his eyes is 45°. Find the height of the building.', '30 m', '2 marks for the figure and ratio, 2 marks for the height.'],
];

const SCIENCE_10: Seed[] = [
  ['MCQ', 'Easy', 'Light', 'Reflection', 'The image formed by a plane mirror is', 'virtual and erect', undefined, ['real and inverted', 'virtual and erect', 'real and erect', 'virtual and inverted']],
  ['MCQ', 'Medium', 'Light', 'Refraction', 'The refractive index of glass is 1.5. The speed of light in glass is', '2 × 10⁸ m/s', undefined, ['2 × 10⁸ m/s', '3 × 10⁸ m/s', '1.5 × 10⁸ m/s', '4.5 × 10⁸ m/s']],
  ['MCQ', 'Easy', 'Electricity', "Ohm's law", 'The SI unit of resistance is', 'ohm', undefined, ['volt', 'ampere', 'ohm', 'watt']],
  ['Short answer', 'Medium', 'Light', 'Lenses', 'A convex lens of focal length 15 cm forms an image 30 cm from the lens on the other side. Find the object distance and the magnification.', 'u = −30 cm, m = −1', '2 marks lens formula, 2 marks magnification.'],
  ['Short answer', 'Medium', 'Electricity', 'Resistors', 'Three resistors of 2 Ω, 3 Ω and 6 Ω are connected in parallel. Find the equivalent resistance.', '1 Ω', '2 marks formula, 2 marks value.'],
  ['Long answer', 'Hard', 'Chemical Reactions', 'Types of reactions', 'Explain combination, decomposition and displacement reactions with one balanced equation each.', 'Three reaction types with equations', '2 marks for each type.'],
];

const TRANSLATIONS: Record<string, Partial<Record<'ta' | 'hi', string>>> = {
  'QB-M10-001': { hi: '96 और 404 का महत्तम समापवर्तक (HCF) है', ta: '96 மற்றும் 404 இன் மீப்பெரு பொது வகுத்தி (HCF)' },
  'QB-M10-013': { hi: 'समांतर श्रेढ़ी 2, 7, 12, … का 10वाँ पद है', ta: '2, 7, 12, … என்ற கூட்டுத் தொடரின் 10ஆவது உறுப்பு' },
  'QB-M10-018': { hi: '(0, 0) और (3, 4) के बीच की दूरी है', ta: '(0, 0) மற்றும் (3, 4) இடையேயான தொலைவு' },
  'QB-M10-021': { hi: 'sin 30° + cos 60° का मान है', ta: 'sin 30° + cos 60° இன் மதிப்பு' },
  'QB-M10-029': { hi: 'एक पासा एक बार फेंका जाता है। सम संख्या आने की प्रायिकता है', ta: 'ஒரு பகடை ஒருமுறை உருட்டப்படுகிறது. இரட்டை எண் கிடைப்பதற்கான நிகழ்தகவு' },
  'QB-M10-033': { hi: 'अभाज्य गुणनखंडन द्वारा 336 और 54 का HCF ज्ञात कीजिए।' },
};

const hash = (s: string) => {
  let h = 5381;
  for (const ch of s) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0;
  return h;
};

const MARKS: Record<QuestionType, number> = { MCQ: 1, 'Very short answer': 2, 'Short answer': 4, 'Long answer': 6, 'Case study': 8 };

const toQuestions = (seeds: Seed[], subject: Subject, prefix: string, author: string): BankQuestion[] =>
  seeds.map(([type, difficulty, chapter, topic, text, answer, scheme, options], i) => {
    const id = `${prefix}-${String(i + 1).padStart(3, '0')}`;
    const h = hash(id);
    return {
      id,
      text,
      type,
      marks: MARKS[type],
      difficulty,
      classLevel: 10,
      subject,
      chapter,
      topic,
      tags: [topic.toLowerCase(), chapter.toLowerCase(), ...(options ? ['objective'] : ['written'])],
      options,
      answer,
      markingScheme: scheme ?? '1 mark for the correct option. No negative marking.',
      translations: TRANSLATIONS[id],
      usageCount: h % 5,
      status: 'Approved',
      source: h % 7 === 0 ? 'Imported' : 'Teacher',
      author,
      hasDiagram: /figure|graph|triangle|tower|kite/i.test(text) && type !== 'MCQ',
    };
  });

export const INITIAL_BANK: BankQuestion[] = [...toQuestions(MATHS_10, 'Mathematics', 'QB-M10', MATHS_HOD), ...toQuestions(SCIENCE_10, 'Science', 'QB-S10', 'Mrs. Malini Iyer')];

export const questionText = (q: BankQuestion, language: PaperLanguage) => {
  const code = LANGUAGE_CODE[language];
  return code === 'en' ? q.text : (q.translations?.[code] ?? q.text);
};
export const hasTranslation = (q: BankQuestion, language: PaperLanguage) => language === 'English' || Boolean(q.translations?.[LANGUAGE_CODE[language]]);

// ---------------------------------------------------------------------------
// Bank search and filters (QPG-001)
// ---------------------------------------------------------------------------

export interface BankFilter {
  query: string;
  classLevel: number | 'All';
  subject: string | 'All';
  chapter: string | 'All';
  topic: string | 'All';
  type: QuestionType | 'All';
  difficulty: Difficulty | 'All';
  marks: number | 'All';
  language: PaperLanguage | 'All';
  usage: 'All' | 'Used' | 'Unused';
}

export const EMPTY_FILTER: BankFilter = { query: '', classLevel: 'All', subject: 'All', chapter: 'All', topic: 'All', type: 'All', difficulty: 'All', marks: 'All', language: 'All', usage: 'All' };

export const filterBank = (bank: BankQuestion[], f: BankFilter) => {
  const q = f.query.trim().toLowerCase();
  return bank.filter(
    x =>
      x.status !== 'Retired' &&
      (!q || [x.id, x.text, x.topic, x.chapter, ...x.tags].some(v => v.toLowerCase().includes(q))) &&
      (f.classLevel === 'All' || x.classLevel === f.classLevel) &&
      (f.subject === 'All' || x.subject === f.subject) &&
      (f.chapter === 'All' || x.chapter === f.chapter) &&
      (f.topic === 'All' || x.topic === f.topic) &&
      (f.type === 'All' || x.type === f.type) &&
      (f.difficulty === 'All' || x.difficulty === f.difficulty) &&
      (f.marks === 'All' || x.marks === f.marks) &&
      (f.language === 'All' || hasTranslation(x, f.language)) &&
      (f.usage === 'All' || (f.usage === 'Used') === x.usageCount > 0)
  );
};

// ---------------------------------------------------------------------------
// Exam details and blueprint (QPG-003, QPG-004)
// ---------------------------------------------------------------------------

export interface ExamDetails {
  academicYear: string;
  board: string;
  classLevel: number;
  section: string;
  subject: Subject;
  examType: (typeof EXAM_TYPES)[number];
  exam: string;
  language: PaperLanguage;
  examDate: string;
  durationMinutes: number;
  maxMarks: number;
}

export const DEFAULT_DETAILS: ExamDetails = {
  academicYear: '2024–25',
  board: 'CBSE',
  classLevel: 10,
  section: 'All sections',
  subject: 'Mathematics',
  examType: 'Term examination',
  exam: 'Term 1',
  language: 'English',
  examDate: '2024-10-07',
  durationMinutes: 180,
  maxMarks: 100,
};

export type DetailsErrors = Partial<Record<keyof ExamDetails, string>>;

export const validateDetails = (d: ExamDetails, today: string): DetailsErrors => {
  const e: DetailsErrors = {};
  if (!d.exam) e.exam = 'Choose the exam.';
  if (!d.examDate) e.examDate = 'Choose the exam date.';
  else if (d.examDate < today) e.examDate = 'The exam date is in the past.';
  if (!(d.durationMinutes >= 30 && d.durationMinutes <= 240)) e.durationMinutes = 'Duration must be between 30 minutes and 4 hours.';
  if (!(d.maxMarks >= 10 && d.maxMarks <= 150)) e.maxMarks = 'Maximum marks must be between 10 and 150.';
  return e;
};

export interface BlueprintSection {
  id: string;
  title: string;
  type: QuestionType;
  count: number;
  marksEach: number;
  difficulty: BlueprintDifficulty;
  chapter: string | 'Any';
  topic: string | 'Any';
}

let sectionSeq = 0;
export const newSectionId = () => `sec-${Date.now().toString(36)}-${(sectionSeq++).toString(36)}`;

/** QPG-004: board pattern presets for a 100-mark paper. */
export const BOARD_PRESETS: Record<string, Omit<BlueprintSection, 'id'>[]> = {
  CBSE: [
    { title: 'Section A', type: 'MCQ', count: 20, marksEach: 1, difficulty: 'Mixed', chapter: 'Any', topic: 'Any' },
    { title: 'Section B', type: 'Very short answer', count: 8, marksEach: 2, difficulty: 'Mixed', chapter: 'Any', topic: 'Any' },
    { title: 'Section C', type: 'Short answer', count: 6, marksEach: 4, difficulty: 'Medium', chapter: 'Any', topic: 'Any' },
    { title: 'Section D', type: 'Long answer', count: 4, marksEach: 6, difficulty: 'Hard', chapter: 'Any', topic: 'Any' },
    { title: 'Section E', type: 'Case study', count: 2, marksEach: 8, difficulty: 'Mixed', chapter: 'Any', topic: 'Any' },
  ],
  'State Board (Tamil Nadu)': [
    { title: 'Part I', type: 'MCQ', count: 20, marksEach: 1, difficulty: 'Mixed', chapter: 'Any', topic: 'Any' },
    { title: 'Part II', type: 'Very short answer', count: 10, marksEach: 2, difficulty: 'Easy', chapter: 'Any', topic: 'Any' },
    { title: 'Part III', type: 'Short answer', count: 7, marksEach: 4, difficulty: 'Medium', chapter: 'Any', topic: 'Any' },
    { title: 'Part IV', type: 'Long answer', count: 4, marksEach: 6, difficulty: 'Hard', chapter: 'Any', topic: 'Any' },
    { title: 'Part V', type: 'Case study', count: 1, marksEach: 8, difficulty: 'Mixed', chapter: 'Any', topic: 'Any' },
  ],
  ICSE: [
    { title: 'Section A', type: 'MCQ', count: 20, marksEach: 1, difficulty: 'Mixed', chapter: 'Any', topic: 'Any' },
    { title: 'Section B', type: 'Very short answer', count: 10, marksEach: 2, difficulty: 'Mixed', chapter: 'Any', topic: 'Any' },
    { title: 'Section C', type: 'Short answer', count: 5, marksEach: 4, difficulty: 'Medium', chapter: 'Any', topic: 'Any' },
    { title: 'Section D', type: 'Long answer', count: 4, marksEach: 6, difficulty: 'Hard', chapter: 'Any', topic: 'Any' },
    { title: 'Section E', type: 'Case study', count: 2, marksEach: 8, difficulty: 'Mixed', chapter: 'Any', topic: 'Any' },
  ],
};

/** A 50-mark unit test. */
export const UNIT_TEST_PATTERN: Omit<BlueprintSection, 'id'>[] = [
  { title: 'Section A', type: 'MCQ', count: 8, marksEach: 1, difficulty: 'Mixed', chapter: 'Any', topic: 'Any' },
  { title: 'Section B', type: 'Very short answer', count: 5, marksEach: 2, difficulty: 'Mixed', chapter: 'Any', topic: 'Any' },
  { title: 'Section C', type: 'Short answer', count: 3, marksEach: 4, difficulty: 'Mixed', chapter: 'Any', topic: 'Any' },
  { title: 'Section D', type: 'Long answer', count: 2, marksEach: 6, difficulty: 'Hard', chapter: 'Any', topic: 'Any' },
  { title: 'Section E', type: 'Case study', count: 1, marksEach: 8, difficulty: 'Mixed', chapter: 'Any', topic: 'Any' },
];

export const presetBlueprint = (board: string): BlueprintSection[] => (BOARD_PRESETS[board] ?? BOARD_PRESETS.CBSE).map(s => ({ ...s, id: newSectionId() }));

export const sectionMarks = (s: Pick<BlueprintSection, 'count' | 'marksEach'>) => s.count * s.marksEach;
export const blueprintTotals = (sections: BlueprintSection[]) => ({
  questions: sections.reduce((n, s) => n + s.count, 0),
  marks: sections.reduce((n, s) => n + sectionMarks(s), 0),
});

export type TotalState = 'match' | 'under' | 'over';
export const totalState = (marks: number, max: number): TotalState => (marks === max ? 'match' : marks < max ? 'under' : 'over');

const matchesSection = (q: BankQuestion, s: BlueprintSection, d: Pick<ExamDetails, 'classLevel' | 'subject'>) =>
  q.status === 'Approved' &&
  q.classLevel === d.classLevel &&
  q.subject === d.subject &&
  q.type === s.type &&
  (s.difficulty === 'Mixed' || q.difficulty === s.difficulty) &&
  (s.chapter === 'Any' || q.chapter === s.chapter) &&
  (s.topic === 'Any' || q.topic === s.topic);

export const availableFor = (bank: BankQuestion[], s: BlueprintSection, d: Pick<ExamDetails, 'classLevel' | 'subject'>) => bank.filter(q => matchesSection(q, s, d));

export interface BlueprintIssue {
  sectionId?: string;
  level: 'error' | 'warning';
  text: string;
}

export const validateBlueprint = (sections: BlueprintSection[], d: ExamDetails, bank: BankQuestion[]): BlueprintIssue[] => {
  const issues: BlueprintIssue[] = [];
  if (!sections.length) issues.push({ level: 'error', text: 'Add at least one section.' });
  const { marks } = blueprintTotals(sections);
  const state = totalState(marks, d.maxMarks);
  if (state !== 'match') issues.push({ level: 'error', text: `Sections add up to ${marks} marks; the paper is out of ${d.maxMarks}.` });
  const titles = new Set<string>();
  sections.forEach(s => {
    if (!s.title.trim()) issues.push({ sectionId: s.id, level: 'error', text: 'Give the section a title.' });
    if (titles.has(s.title.trim().toLowerCase())) issues.push({ sectionId: s.id, level: 'error', text: `Two sections are called “${s.title}”.` });
    titles.add(s.title.trim().toLowerCase());
    if (s.count < 1) issues.push({ sectionId: s.id, level: 'error', text: `${s.title}: at least one question.` });
    if (s.marksEach < 1) issues.push({ sectionId: s.id, level: 'error', text: `${s.title}: marks must be at least 1.` });
    const available = availableFor(bank, s, d).length;
    if (available < s.count) issues.push({ sectionId: s.id, level: 'warning', text: `${s.title}: the bank has ${available} matching question(s) for ${s.count}. Add or generate more.` });
  });
  return issues;
};

// ---------------------------------------------------------------------------
// Papers
// ---------------------------------------------------------------------------

export type PaperStatus = 'Draft' | 'Under review' | 'Changes requested' | 'Approved' | 'Published' | 'Rejected';

export interface PaperQuestion {
  /** Unique within the paper, so the same bank question can be swapped without losing its place. */
  key: string;
  questionId: string;
  marks: number;
}

export interface PaperSectionContent {
  sectionId: string;
  questions: PaperQuestion[];
}

export interface PaperSet {
  label: string;
  sections: PaperSectionContent[];
  status: PaperStatus;
}

export interface ReviewEvent {
  at: string;
  by: string;
  action: 'Created' | 'Submitted for review' | 'Approved' | 'Rejected' | 'Changes requested' | 'Published' | 'Edited';
  comment?: string;
}

export interface QuestionPaper {
  id: string;
  title: string;
  details: ExamDetails;
  blueprint: BlueprintSection[];
  content: PaperSectionContent[];
  sets: PaperSet[];
  instructions: string[];
  status: PaperStatus;
  createdBy: string;
  createdOn: string;
  reviewedBy?: string;
  reviewedOn?: string;
  history: ReviewEvent[];
  /** Papers from earlier years kept only as a summary. */
  summary?: { questions: number; marks: number };
}

export const DEFAULT_INSTRUCTIONS = [
  'All questions are compulsory.',
  'Read each question carefully before answering.',
  'Marks for each question are shown against it.',
  'Use of calculators is not permitted.',
];

export const paperTitle = (d: ExamDetails) => `Class ${d.classLevel} ${d.subject} · ${d.exam} (${d.academicYear})`;

export const isEditable = (p: QuestionPaper) => p.status === 'Draft' || p.status === 'Changes requested';

let keySeq = 0;
export const newKey = () => `pq-${(keySeq++).toString(36)}`;

export const paperQuestions = (content: PaperSectionContent[]) => content.flatMap(c => c.questions);

export const paperStats = (content: PaperSectionContent[], bank: BankQuestion[]) => {
  const qs = paperQuestions(content);
  const byId = new Map(bank.map(q => [q.id, q]));
  const count = (d: Difficulty) => qs.filter(q => byId.get(q.questionId)?.difficulty === d).length;
  return { questions: qs.length, marks: qs.reduce((n, q) => n + q.marks, 0), easy: count('Easy'), medium: count('Medium'), hard: count('Hard') };
};

const rank = (seed: string) => (q: BankQuestion) => q.usageCount * 1000 + (hash(`${seed}:${q.id}`) % 1000);

/**
 * QPG-005 / QPG-014: fill every section from the bank.
 * Least-used questions come first; questions used in the last paper for the same class and subject are skipped
 * unless `allowRepeats` is set. The seed makes the choice repeatable.
 */
export const autoFill = (
  sections: BlueprintSection[],
  d: ExamDetails,
  bank: BankQuestion[],
  opts: { seed: string; recentlyUsed?: Set<string>; allowRepeats?: boolean; keep?: PaperSectionContent[] }
): { content: PaperSectionContent[]; shortfall: { sectionId: string; missing: number }[] } => {
  const taken = new Set<string>();
  const shortfall: { sectionId: string; missing: number }[] = [];
  const content = sections.map(s => {
    const kept = (opts.keep?.find(k => k.sectionId === s.id)?.questions ?? []).slice(0, s.count).map(q => ({ ...q, marks: s.marksEach }));
    kept.forEach(q => taken.add(q.questionId));
    const pool = availableFor(bank, s, d)
      .filter(q => !taken.has(q.id) && (opts.allowRepeats || !opts.recentlyUsed?.has(q.id)))
      .sort((a, b) => rank(opts.seed + s.id)(a) - rank(opts.seed + s.id)(b));
    const need = s.count - kept.length;
    const picked = pool.slice(0, need);
    picked.forEach(q => taken.add(q.id));
    if (picked.length < need) shortfall.push({ sectionId: s.id, missing: need - picked.length });
    return { sectionId: s.id, questions: [...kept, ...picked.map(q => ({ key: newKey(), questionId: q.id, marks: s.marksEach }))] };
  });
  return { content, shortfall };
};

// ----- paper builder edits (QPG-007 manual override) -----

export const addQuestion = (content: PaperSectionContent[], sectionId: string, questionId: string, marks: number): PaperSectionContent[] => {
  if (paperQuestions(content).some(q => q.questionId === questionId)) return content;
  const has = content.some(c => c.sectionId === sectionId);
  const base = has ? content : [...content, { sectionId, questions: [] }];
  return base.map(c => (c.sectionId === sectionId ? { ...c, questions: [...c.questions, { key: newKey(), questionId, marks }] } : c));
};

export const removeQuestion = (content: PaperSectionContent[], key: string) => content.map(c => ({ ...c, questions: c.questions.filter(q => q.key !== key) }));

export const moveQuestion = (content: PaperSectionContent[], key: string, delta: -1 | 1) =>
  content.map(c => {
    const i = c.questions.findIndex(q => q.key === key);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= c.questions.length) return c;
    const next = [...c.questions];
    [next[i], next[j]] = [next[j], next[i]];
    return { ...c, questions: next };
  });

/** Drag and drop: move a question to where another one sits (same section only). */
export const moveQuestionTo = (content: PaperSectionContent[], key: string, targetKey: string) =>
  content.map(c => {
    const from = c.questions.findIndex(q => q.key === key);
    const to = c.questions.findIndex(q => q.key === targetKey);
    if (from < 0 || to < 0 || from === to) return c;
    const next = [...c.questions];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return { ...c, questions: next };
  });

export const setQuestionMarks =(content: PaperSectionContent[], key: string, marks: number) =>
  content.map(c => ({ ...c, questions: c.questions.map(q => (q.key === key ? { ...q, marks: Math.max(1, Math.round(marks)) } : q)) }));

export const replaceQuestion = (content: PaperSectionContent[], key: string, questionId: string) =>
  paperQuestions(content).some(q => q.questionId === questionId) ? content : content.map(c => ({ ...c, questions: c.questions.map(q => (q.key === key ? { ...q, questionId } : q)) }));

/** Questions that could stand in for one already in the paper: same section rules, not yet used in the paper. */
export const alternativesFor = (content: PaperSectionContent[], section: BlueprintSection, d: ExamDetails, bank: BankQuestion[]) => {
  const used = new Set(paperQuestions(content).map(q => q.questionId));
  return availableFor(bank, section, d).filter(q => !used.has(q.id));
};

export interface ContentIssue {
  level: 'error' | 'warning';
  text: string;
}

export const validateContent = (p: Pick<QuestionPaper, 'blueprint' | 'content' | 'details'>): ContentIssue[] => {
  const issues: ContentIssue[] = [];
  p.blueprint.forEach(s => {
    const n = p.content.find(c => c.sectionId === s.id)?.questions.length ?? 0;
    if (n !== s.count) issues.push({ level: n < s.count ? 'error' : 'warning', text: `${s.title} has ${n} of ${s.count} questions.` });
  });
  const marks = paperQuestions(p.content).reduce((n, q) => n + q.marks, 0);
  if (marks !== p.details.maxMarks) issues.push({ level: 'error', text: `The paper totals ${marks} marks; it should be ${p.details.maxMarks}.` });
  return issues;
};

// ---------------------------------------------------------------------------
// Multiple sets (QPG-008)
// ---------------------------------------------------------------------------

export const SET_LABELS = ['Set A', 'Set B', 'Set C', 'Set D'];

const shuffle = <T>(items: T[], seed: string, id: (t: T) => string) => [...items].sort((a, b) => (hash(`${seed}:${id(a)}`) % 997) - (hash(`${seed}:${id(b)}`) % 997));

/**
 * Set A is the paper as built. Every other set reorders each section and swaps up to a third of its
 * questions for unused equivalents, so neighbouring candidates see different papers of equal weight.
 */
export const buildSets = (p: Pick<QuestionPaper, 'id' | 'blueprint' | 'content' | 'details'>, bank: BankQuestion[], count: number): PaperSet[] =>
  SET_LABELS.slice(0, Math.max(1, Math.min(4, count))).map((label, n) => {
    if (n === 0) return { label, sections: p.content, status: 'Draft' as PaperStatus };
    const used = new Set(paperQuestions(p.content).map(q => q.questionId));
    const sections = p.content.map(c => {
      const bp = p.blueprint.find(s => s.id === c.sectionId);
      const spares = bp ? shuffle(availableFor(bank, bp, p.details).filter(q => !used.has(q.id)), `${p.id}${label}`, q => q.id) : [];
      const swaps = Math.min(spares.length, Math.floor(c.questions.length / 3));
      const order = shuffle(c.questions, `${p.id}${label}${c.sectionId}`, q => q.key);
      const questions = order.map((q, i) => {
        if (i >= swaps) return { ...q, key: `${q.key}-${n}` };
        used.add(spares[i].id);
        return { ...q, key: `${q.key}-${n}`, questionId: spares[i].id };
      });
      return { ...c, questions };
    });
    return { label, sections, status: 'Draft' as PaperStatus };
  });

export const setOverlap = (a: PaperSet, b: PaperSet) => {
  const ids = new Set(paperQuestions(a.sections).map(q => q.questionId));
  const other = paperQuestions(b.sections);
  return other.length ? Math.round((other.filter(q => ids.has(q.questionId)).length / other.length) * 100) : 0;
};

// ---------------------------------------------------------------------------
// Answer key (QPG-009)
// ---------------------------------------------------------------------------

export interface AnswerKeyRow {
  number: number;
  section: string;
  question: string;
  correctAnswer: string;
  marks: number;
  markingScheme: string;
}

export const answerKey = (p: Pick<QuestionPaper, 'blueprint' | 'details'>, sections: PaperSectionContent[], bank: BankQuestion[]): AnswerKeyRow[] => {
  const byId = new Map(bank.map(q => [q.id, q]));
  let n = 0;
  return sections.flatMap(c => {
    const title = p.blueprint.find(s => s.id === c.sectionId)?.title ?? '';
    return c.questions.map(pq => {
      const q = byId.get(pq.questionId);
      n += 1;
      return {
        number: n,
        section: title,
        question: q ? questionText(q, p.details.language) : 'Question removed from the bank',
        correctAnswer: q?.answer ?? '—',
        marks: pq.marks,
        markingScheme: q?.markingScheme ?? '—',
      };
    });
  });
};

export const answerKeyText = (p: QuestionPaper, set: PaperSet, bank: BankQuestion[]) =>
  [
    `LUMEN ACADEMY · ANSWER KEY · ${set.label}`,
    paperTitle(p.details),
    `Maximum marks ${p.details.maxMarks}`,
    '',
    ...answerKey(p, set.sections, bank).map(r => `${r.number}. [${r.marks}] ${r.correctAnswer}\n   ${r.markingScheme}`),
  ].join('\n');

// ---------------------------------------------------------------------------
// Approval workflow (QPG-012)
// ---------------------------------------------------------------------------

export type PaperAction = 'submit' | 'approve' | 'reject' | 'requestChanges' | 'publish';

export const ACTION_LABEL: Record<PaperAction, string> = {
  submit: 'Submit for review',
  approve: 'Approve',
  reject: 'Reject',
  requestChanges: 'Request changes',
  publish: 'Publish',
};

const FROM: Record<PaperAction, PaperStatus[]> = {
  submit: ['Draft', 'Changes requested'],
  approve: ['Under review'],
  reject: ['Under review'],
  requestChanges: ['Under review'],
  publish: ['Approved'],
};

const TO: Record<PaperAction, PaperStatus> = {
  submit: 'Under review',
  approve: 'Approved',
  reject: 'Rejected',
  requestChanges: 'Changes requested',
  publish: 'Published',
};

const EVENT: Record<PaperAction, ReviewEvent['action']> = {
  submit: 'Submitted for review',
  approve: 'Approved',
  reject: 'Rejected',
  requestChanges: 'Changes requested',
  publish: 'Published',
};

export const canApply = (p: QuestionPaper, action: PaperAction) => FROM[action].includes(p.status);

export const transitionPaper = (p: QuestionPaper, action: PaperAction, actor: string, at: string, comment = ''): QuestionPaper | { error: string } => {
  if (!canApply(p, action)) return { error: `A paper that is ${p.status.toLowerCase()} cannot be ${EVENT[action].toLowerCase()}.` };
  const reviewing = action === 'approve' || action === 'reject' || action === 'requestChanges';
  if (reviewing && actor === p.createdBy) return { error: 'You cannot review a paper you created.' };
  if ((action === 'reject' || action === 'requestChanges') && !comment.trim()) return { error: 'Add a comment so the author knows what to change.' };
  if (action === 'submit') {
    const blocking = validateContent(p).filter(i => i.level === 'error');
    if (blocking.length) return { error: blocking[0].text };
  }
  return {
    ...p,
    status: TO[action],
    ...(reviewing ? { reviewedBy: actor, reviewedOn: at } : {}),
    sets: action === 'publish' ? p.sets.map(s => ({ ...s, status: 'Published' as PaperStatus })) : action === 'approve' ? p.sets.map(s => ({ ...s, status: 'Approved' as PaperStatus })) : p.sets,
    history: [...p.history, { at, by: actor, action: EVENT[action], comment: comment.trim() || undefined }],
  };
};

export const STATUS_STEPS: PaperStatus[] = ['Draft', 'Under review', 'Approved', 'Published'];

// ---------------------------------------------------------------------------
// Mock AI generation (QPG-006) — deterministic, no model is called
// ---------------------------------------------------------------------------

export interface AiRequest {
  subject: Subject;
  classLevel: number;
  chapter: string;
  topic: string;
  type: QuestionType;
  difficulty: Difficulty;
  marks: number;
  language: PaperLanguage;
  count: number;
}

const AI_STEMS: Record<QuestionType, string[]> = {
  MCQ: [
    'Which of the following statements about {topic} is correct?',
    'Choose the correct value in a problem on {topic}.',
    'Identify the result that follows from {topic}.',
    'Which option correctly applies {topic}?',
  ],
  'Very short answer': ['State one property of {topic} and give an example.', 'Write the formula used in {topic} and explain one term in it.', 'Give a one-step example that uses {topic}.'],
  'Short answer': ['Solve a two-step problem on {topic}, showing your working.', 'Explain {topic} with a worked example.', 'Prove a standard result from {topic}.'],
  'Long answer': ['Solve a multi-step real-life problem using {topic}. Justify each step.', 'Derive the key result of {topic} and apply it to a new situation.'],
  'Case study': ['Read the situation about a school event and answer three questions that use {topic}.', 'A local survey gives data related to {topic}. Answer the questions that follow.'],
};

export const mockGenerate = (req: AiRequest, attempt: number): BankQuestion[] =>
  Array.from({ length: Math.max(1, Math.min(10, req.count)) }, (_, i) => mockGenerateOne(req, attempt, i));

export const mockGenerateOne = (req: AiRequest, attempt: number, index: number): BankQuestion => {
  const stems = AI_STEMS[req.type];
  const seed = hash(`${req.chapter}${req.topic}${req.type}${req.difficulty}${attempt}:${index}`);
  const topic = req.topic || req.chapter;
  const text = `${stems[seed % stems.length].replace('{topic}', topic.toLowerCase())} (${req.chapter}, ${req.difficulty.toLowerCase()})`;
  return {
    id: `AI-${attempt}-${index}-${(seed % 46656).toString(36).toUpperCase()}`,
    text,
    type: req.type,
    marks: req.marks,
    difficulty: req.difficulty,
    classLevel: req.classLevel,
    subject: req.subject,
    chapter: req.chapter,
    topic,
    tags: ['ai', topic.toLowerCase()],
    options: req.type === 'MCQ' ? ['Option A', 'Option B', 'Option C', 'Option D'] : undefined,
    answer: req.type === 'MCQ' ? `Option ${'ABCD'[seed % 4]}` : 'Model answer to be written by the teacher',
    markingScheme: req.type === 'MCQ' ? '1 mark for the correct option.' : `Split ${req.marks} marks across method and result.`,
    translations: req.language === 'English' ? undefined : { [LANGUAGE_CODE[req.language]]: `[${req.language}] ${text}` },
    usageCount: 0,
    status: 'Draft',
    source: 'AI generated',
    author: 'AI assistant (review required)',
  };
};

// ---------------------------------------------------------------------------
// Seed papers (dashboard, archive, approvals)
// ---------------------------------------------------------------------------

const seedPaper = (
  id: string,
  details: Partial<ExamDetails>,
  status: PaperStatus,
  createdOn: string,
  opts: { reviewedOn?: string; comment?: string; summary?: QuestionPaper['summary']; build?: boolean } = {}
): QuestionPaper => {
  const d = { ...DEFAULT_DETAILS, ...details };
  const pattern = d.examType === 'Unit test' && d.maxMarks === 50 ? UNIT_TEST_PATTERN : (BOARD_PRESETS[d.board] ?? BOARD_PRESETS.CBSE);
  const blueprint = pattern.map((s, i) => ({ ...s, id: `${id}-s${i}` }));
  const content = opts.build ? autoFill(blueprint, d, INITIAL_BANK, { seed: id, allowRepeats: true }).content : [];
  const history: ReviewEvent[] = [{ at: createdOn, by: COORDINATOR, action: 'Created' }];
  const reviewer = 'Dr. Arvind Swaminathan';
  if (status !== 'Draft') history.push({ at: createdOn, by: COORDINATOR, action: 'Submitted for review' });
  if (status === 'Changes requested') history.push({ at: opts.reviewedOn!, by: reviewer, action: 'Changes requested', comment: opts.comment });
  if (status === 'Rejected') history.push({ at: opts.reviewedOn!, by: reviewer, action: 'Rejected', comment: opts.comment });
  if (status === 'Approved' || status === 'Published') history.push({ at: opts.reviewedOn!, by: reviewer, action: 'Approved', comment: opts.comment });
  if (status === 'Published') history.push({ at: opts.reviewedOn!, by: COORDINATOR, action: 'Published' });
  const reviewed = ['Approved', 'Published', 'Rejected', 'Changes requested'].includes(status);
  return {
    id,
    title: paperTitle(d),
    details: d,
    blueprint,
    content,
    sets: content.length ? [{ label: 'Set A', sections: content, status: status === 'Published' || status === 'Approved' ? status : 'Draft' }] : [],
    instructions: DEFAULT_INSTRUCTIONS,
    status,
    createdBy: COORDINATOR,
    createdOn,
    reviewedBy: reviewed ? reviewer : undefined,
    reviewedOn: reviewed ? opts.reviewedOn : undefined,
    history,
    summary: opts.summary,
  };
};

export const INITIAL_PAPERS: QuestionPaper[] = [
  seedPaper('QP-2024-011', { exam: 'Unit Test 3', examType: 'Unit test', examDate: '2024-09-24', subject: 'Mathematics', maxMarks: 50, durationMinutes: 90 }, 'Under review', '2024-09-12', { build: true }),
  seedPaper('QP-2024-010', { exam: 'Term 1', subject: 'Science', examDate: '2024-10-09' }, 'Draft', '2024-09-14', { summary: { questions: 22, marks: 56 } }),
  seedPaper('QP-2024-009', { exam: 'Term 1', subject: 'English', examDate: '2024-10-08' }, 'Changes requested', '2024-09-06', { reviewedOn: '2024-09-11', comment: 'Section C repeats two passages from Unit Test 2. Please replace them.', summary: { questions: 36, marks: 100 } }),
  seedPaper('QP-2024-008', { exam: 'Term 1', subject: 'Social Science', examDate: '2024-10-11' }, 'Approved', '2024-09-02', { reviewedOn: '2024-09-09', summary: { questions: 38, marks: 100 } }),
  seedPaper('QP-2024-007', { exam: 'Unit Test 2', examType: 'Unit test', subject: 'Mathematics', examDate: '2024-08-19', classLevel: 9, maxMarks: 50, durationMinutes: 90 }, 'Published', '2024-08-01', { reviewedOn: '2024-08-06', summary: { questions: 30, marks: 50 } }),
  seedPaper('QP-2024-006', { exam: 'Unit Test 2', examType: 'Unit test', subject: 'Mathematics', examDate: '2024-08-20', maxMarks: 50, durationMinutes: 90 }, 'Published', '2024-08-02', { reviewedOn: '2024-08-07', build: true }),
  seedPaper('QP-2024-005', { exam: 'Unit Test 2', examType: 'Unit test', subject: 'Science', examDate: '2024-08-21', classLevel: 8, maxMarks: 50, durationMinutes: 90 }, 'Published', '2024-08-02', { reviewedOn: '2024-08-08', summary: { questions: 30, marks: 50 } }),
  seedPaper('QP-2024-004', { exam: 'Unit Test 1', examType: 'Unit test', subject: 'English', examDate: '2024-07-01', classLevel: 9, maxMarks: 50, durationMinutes: 90 }, 'Rejected', '2024-06-12', { reviewedOn: '2024-06-18', comment: 'Replaced by a revised paper (QP-2024-003).', summary: { questions: 28, marks: 50 } }),
  seedPaper('QP-2024-003', { exam: 'Unit Test 1', examType: 'Unit test', subject: 'English', examDate: '2024-07-01', classLevel: 9, maxMarks: 50, durationMinutes: 90 }, 'Published', '2024-06-19', { reviewedOn: '2024-06-21', summary: { questions: 28, marks: 50 } }),
  seedPaper('QP-2024-002', { exam: 'Unit Test 1', examType: 'Unit test', subject: 'Science', examDate: '2024-07-02', maxMarks: 50, durationMinutes: 90 }, 'Published', '2024-06-14', { reviewedOn: '2024-06-20', summary: { questions: 30, marks: 50 } }),
  seedPaper('QP-2024-001', { exam: 'Unit Test 1', examType: 'Unit test', subject: 'Mathematics', examDate: '2024-07-03', maxMarks: 50, durationMinutes: 90 }, 'Published', '2024-06-14', { reviewedOn: '2024-06-20', summary: { questions: 30, marks: 50 } }),
  seedPaper('QP-2023-014', { academicYear: '2023–24', exam: 'Pre-board 1', examType: 'Pre-board', subject: 'Mathematics', examDate: '2024-01-15' }, 'Published', '2023-12-18', { reviewedOn: '2023-12-22', summary: { questions: 38, marks: 80 } }),
  seedPaper('QP-2023-011', { academicYear: '2023–24', exam: 'Term 2', subject: 'Science', examDate: '2024-03-04' }, 'Published', '2024-02-05', { reviewedOn: '2024-02-12', summary: { questions: 39, marks: 80 } }),
];

/** QPG-014: questions in the most recent published paper for the same class and subject. */
export const recentlyUsedFor = (papers: QuestionPaper[], d: Pick<ExamDetails, 'classLevel' | 'subject'>) => {
  const last = papers
    .filter(p => p.status === 'Published' && p.details.classLevel === d.classLevel && p.details.subject === d.subject && p.content.length)
    .sort((a, b) => b.details.examDate.localeCompare(a.details.examDate))[0];
  return new Set(last ? paperQuestions(last.content).map(q => q.questionId) : []);
};

export const paperCounts = (p: QuestionPaper) => (p.content.length ? { questions: paperQuestions(p.content).length, marks: paperQuestions(p.content).reduce((n, q) => n + q.marks, 0) } : (p.summary ?? { questions: 0, marks: 0 }));

export const QPG_TODAY = '2024-09-16';
export const QPG_COORDINATOR = COORDINATOR;
