// Mock Student 360 API. Records are shared by every console screen for the browser session;
// swap the functions for HTTP calls later without changing the screens.
import { createStore, mockDelay, useStore } from '../lib/store';
import { INITIAL_ROSTER, RosterStudent, checkEmis, digitsOnly, isValidApaar, normaliseEmis } from '../data/students';

export const rosterStore = createStore<RosterStudent[]>(() => INITIAL_ROSTER);
export const useRoster = () => useStore(rosterStore);

export interface IdentifierPatch {
  emis: string;
  apaar: string;
}

export interface NewStudent extends IdentifierPatch {
  name: string;
  gender: RosterStudent['gender'];
  dob: string;
  classLevel: number;
  section: string;
  admissionNo: string;
  guardianName: string;
  guardianMobile: string;
}

/** STU-002, STU-003, STU-026, STU-027: identifier rules shared by the add and edit forms. */
export const identifierErrors = (patch: IdentifierPatch, studentId: string, roster: RosterStudent[]) => {
  const errors: Partial<Record<keyof IdentifierPatch, string>> = {};
  const emis = checkEmis(patch.emis, studentId, roster);
  if (emis.state === 'invalid' || emis.state === 'duplicate') errors.emis = emis.message;
  if (patch.apaar.trim()) {
    if (!isValidApaar(patch.apaar)) errors.apaar = 'APAAR ID is 12 digits.';
    else if (roster.some(s => s.id !== studentId && !s.mergedInto && digitsOnly(s.apaar) === digitsOnly(patch.apaar))) errors.apaar = 'Another student already has this APAAR ID.';
  }
  return errors;
};

export const nextStudentId = (roster: RosterStudent[]) => `ros-${String(roster.length + 1).padStart(2, '0')}`;
export const suggestAdmissionNo = (roster: RosterStudent[], classLevel: number) => `ADM-${2014 + (12 - classLevel)}-${String(300 + roster.length * 7).padStart(4, '0')}`;

const fail = (message: string) => Promise.reject(new Error(message));

export const studentService = {
  list: () => mockDelay(rosterStore.get()),

  updateIdentifiers: (studentId: string, patch: IdentifierPatch) => {
    const roster = rosterStore.get();
    const errors = identifierErrors(patch, studentId, roster);
    const first = Object.values(errors)[0];
    if (first) return fail(first);
    const next = { emis: normaliseEmis(patch.emis) || undefined, apaar: patch.apaar.trim() };
    rosterStore.set(list => list.map(s => (s.id === studentId ? { ...s, ...next } : s)));
    return mockDelay(rosterStore.get().find(s => s.id === studentId)!);
  },

  create: (input: NewStudent) => {
    const roster = rosterStore.get();
    const id = nextStudentId(roster);
    const errors = identifierErrors(input, id, roster);
    const first = Object.values(errors)[0];
    if (first) return fail(first);
    if (!input.name.trim()) return fail('Enter the student’s name.');
    if (roster.some(s => s.admissionNo === input.admissionNo.trim())) return fail('That admission number is already in use.');
    if (digitsOnly(input.guardianMobile).length < 10) return fail('Enter a 10-digit guardian mobile.');
    const student: RosterStudent = {
      id,
      name: input.name.trim(),
      admissionNo: input.admissionNo.trim(),
      classLevel: input.classLevel,
      section: input.section,
      rollNo: roster.filter(s => s.classLevel === input.classLevel && s.section === input.section).length + 1,
      gender: input.gender,
      dob: input.dob,
      category: 'General',
      house: 'Emerald Falcon',
      status: 'Active',
      feeStatus: 'Due',
      pen: '',
      apaar: input.apaar.trim(),
      emis: normaliseEmis(input.emis) || undefined,
      guardianName: input.guardianName.trim(),
      guardianMobile: input.guardianMobile.trim(),
      emergencyContacts: [],
      campusId: 'chennai-main',
      yearResult: 'Pass',
    };
    rosterStore.set(list => [...list, student]);
    return mockDelay(student);
  },
};
