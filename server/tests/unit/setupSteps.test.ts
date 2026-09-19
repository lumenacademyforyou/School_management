import { describe, expect, it } from 'vitest';
import { setupSteps, type SetupCounts } from '../../src/repositories/schoolStructureRepository.js';

const counts = (overrides: Partial<SetupCounts> = {}): SetupCounts => ({
  classes: 0,
  sections: 0,
  classesWithoutSections: 0,
  sectionsWithoutClassTeacher: 0,
  teachingStaff: 0,
  activeStudents: 0,
  ...overrides,
});

const done = (hasYear: boolean, c: SetupCounts) =>
  Object.fromEntries(setupSteps(hasYear, c).map((s) => [s.key, s.done]));

describe('setupSteps', () => {
  it('shows nothing done for an empty school', () => {
    expect(done(false, counts())).toEqual({
      academic_year: false,
      classes: false,
      sections: false,
      class_teachers: false,
    });
  });

  it('does not count sections as done while any class has none', () => {
    const c = counts({ classes: 3, sections: 4, classesWithoutSections: 1 });
    expect(done(true, c).sections).toBe(false);
  });

  it('does not count sections as done with no classes at all', () => {
    expect(done(true, counts()).sections).toBe(false);
  });

  it('does not count sections as done without a current year', () => {
    expect(done(false, counts({ classes: 2, sections: 2 })).sections).toBe(false);
  });

  it('requires every section to have a class teacher for that step', () => {
    const base = { classes: 2, sections: 4 };
    expect(done(true, counts({ ...base, sectionsWithoutClassTeacher: 1 })).class_teachers).toBe(false);
    expect(done(true, counts(base)).class_teachers).toBe(true);
  });

  it('marks only class teachers as optional', () => {
    const optional = setupSteps(true, counts()).filter((s) => !s.required).map((s) => s.key);
    expect(optional).toEqual(['class_teachers']);
  });
});
