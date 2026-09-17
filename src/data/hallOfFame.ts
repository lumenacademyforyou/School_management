// Term results with class ranks (EXM-016, EXM-018, EXM-026) and the parent app Hall of Fame.
// Ranks are computed across the whole class (every section). The demo roster is only part of each
// class, so classmates outside it are generated deterministically to fill the cohort.
import { INITIAL_ROSTER } from './students';

export interface PublishedTerm {
  id: string;
  name: string;
  academicYear: string;
  publishedOn: string;
  max: number;
}

export const TERM_1: PublishedTerm = { id: 'T1-2024', name: 'Term 1 Examination', academicYear: '2024–25', publishedOn: '2024-09-13', max: 100 };

export const SUBJECTS_BY_CLASS: Record<number, string[]> = {
  8: ['English', 'Mathematics', 'Science', 'Social Science', 'Tamil'],
  9: ['English', 'Mathematics', 'Science', 'Social Science', 'Tamil'],
  10: ['English', 'Mathematics', 'Science', 'Social Science', 'Hindi'],
};

/** Students in each class, across all sections. */
export const CLASS_STRENGTH: Record<number, number> = { 8: 72, 9: 64, 10: 68 };

/** Marks for demo children whose results matter to the parent app. Everyone else is generated. */
const ROSTER_MARKS: Record<string, Record<string, number>> = {
  // Kavin (9-A): 1st in Mathematics, 3rd in Science
  'ros-07': { English: 84, Mathematics: 98, Science: 91, 'Social Science': 88, Tamil: 86 },
  // Kavya (9-A, Kavin's twin): no top-three place
  'ros-08': { English: 88, Mathematics: 82, Science: 79, 'Social Science': 81, Tamil: 90 },
  // Aarav (10-A): 2nd in Science
  'ros-01': { English: 81, Mathematics: 88, Science: 96, 'Social Science': 84, Hindi: 79 },
  // Ananya (10-A): 3rd in Mathematics
  'ros-02': { English: 90, Mathematics: 95, Science: 89, 'Social Science': 87, Hindi: 85 },
};

/** Top scores by classmates outside the demo roster. */
const OUTSIDE_TOPPERS: Record<number, Record<string, number[]>> = {
  9: { English: [94, 92, 91], Mathematics: [96, 94], Science: [95, 93], 'Social Science': [93, 92, 91], Tamil: [95, 93, 92] },
  10: { English: [96, 94, 93], Mathematics: [99, 97], Science: [97, 91], 'Social Science': [95, 93, 91], Hindi: [96, 94, 92] },
  8: { English: [95, 93, 92], Mathematics: [97, 95, 94], Science: [96, 94, 93], 'Social Science': [94, 93, 92], Tamil: [96, 95, 93] },
};

const hash = (s: string) => {
  let h = 5381;
  for (const ch of s) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0;
  return h;
};

const liveInClass = (classLevel: number) => INITIAL_ROSTER.filter(s => s.classLevel === classLevel && !s.mergedInto && s.status !== 'TC issued');

/** Marks for a roster child: fixed if listed above, otherwise generated (55–89). */
export const rosterMark = (studentId: string, subject: string) => ROSTER_MARKS[studentId]?.[subject] ?? 55 + (hash(`${studentId}:${subject}`) % 35);

/** Every mark in the class for one subject. Generated classmates score 40–89. */
export const classMarks = (classLevel: number, subject: string): number[] => {
  const roster = liveInClass(classLevel).map(s => rosterMark(s.id, subject));
  const tops = OUTSIDE_TOPPERS[classLevel]?.[subject] ?? [];
  const others = Math.max(0, (CLASS_STRENGTH[classLevel] ?? roster.length) - roster.length - tops.length);
  const generated = Array.from({ length: others }, (_, i) => 40 + (hash(`${classLevel}:${subject}:${i}`) % 50));
  return [...roster, ...tops, ...generated];
};

/** Standard competition ranking: equal marks share a rank. */
export const rankOf = (mark: number, marks: number[]) => 1 + marks.filter(m => m > mark).length;

export interface SubjectResult {
  subject: string;
  marks: number;
  max: number;
  rank: number;
  classSize: number;
}

export const termResultsFor = (studentId: string): SubjectResult[] => {
  const s = INITIAL_ROSTER.find(x => x.id === studentId);
  if (!s) return [];
  return (SUBJECTS_BY_CLASS[s.classLevel] ?? []).map(subject => {
    const marks = rosterMark(studentId, subject);
    const all = classMarks(s.classLevel, subject);
    return { subject, marks, max: TERM_1.max, rank: rankOf(marks, all), classSize: all.length };
  });
};

export type RankTier = 'gold' | 'silver' | 'bronze';
export const TIER_OF: Record<number, RankTier> = { 1: 'gold', 2: 'silver', 3: 'bronze' };
export const ordinal = (n: number) => `${n}${n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th'}`;

export interface Achievement {
  id: string;
  studentId: string;
  studentName: string;
  classLevel: number;
  section: string;
  rank: 1 | 2 | 3;
  tier: RankTier;
  subject: string;
  exam: string;
  academicYear: string;
  marks: number;
  max: number;
  percentage: number;
  classSize: number;
  publishedOn: string;
}

/** Hall of Fame entries: a published subject rank in the top three. Best first. */
export const achievementsFor = (studentId: string): Achievement[] => {
  const s = INITIAL_ROSTER.find(x => x.id === studentId);
  if (!s) return [];
  return termResultsFor(studentId)
    .filter(r => r.rank <= 3)
    .map(r => ({
      id: `${TERM_1.id}-${studentId}-${r.subject}`,
      studentId,
      studentName: s.name,
      classLevel: s.classLevel,
      section: s.section,
      rank: r.rank as 1 | 2 | 3,
      tier: TIER_OF[r.rank],
      subject: r.subject,
      exam: TERM_1.name,
      academicYear: TERM_1.academicYear,
      marks: r.marks,
      max: r.max,
      percentage: Math.round((r.marks / r.max) * 1000) / 10,
      classSize: r.classSize,
      publishedOn: TERM_1.publishedOn,
    }))
    .sort((a, b) => a.rank - b.rank || b.marks - a.marks);
};
