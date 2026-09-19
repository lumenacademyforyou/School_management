// Mock results API for the Hall of Fame. Swap for GET /students/:id/achievements later.
import { mockDelay } from '../lib/store';
import { Achievement, SubjectResult, TERM_1, achievementsFor, termResultsFor } from '../data/hallOfFame';

export const hallOfFameService = {
  achievements: (studentId: string): Promise<Achievement[]> => mockDelay(achievementsFor(studentId)),
  termResults: (studentId: string): Promise<{ term: typeof TERM_1; results: SubjectResult[] }> => mockDelay({ term: TERM_1, results: termResultsFor(studentId) }),
};
