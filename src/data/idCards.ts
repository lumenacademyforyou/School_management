import { CLASS_10A_STUDENTS } from './mockData';

export type HolderType = 'Student' | 'Teacher' | 'Staff';

export interface CardHolder {
  id: string;
  type: HolderType;
  name: string;
  photo?: string;
  /** Class-section for students, designation for staff */
  designation: string;
  /** Admission number or employee code — the key used by bulk import */
  identifier: string;
  bloodGroup: string;
  emergencyPhone: string;
  /** Staff category drives the colour band on non-teaching cards (NTS-010) */
  staffCategory?: 'Security' | 'Transport' | 'Housekeeping' | 'Laboratory' | 'Hostel';
  accessZones?: string[];
}

export interface CardRecord {
  cardNo: string;
  holderId: string;
  rfid?: string;
  issuedOn: string;
  validUntil: string;
  version: number;
  status: 'Active' | 'Revoked';
  revokeReason?: string;
}

/** Operating date of the demo dataset (AY 2024–25); card expiry is evaluated against it. */
export const ID_CARD_AS_OF = '2024-09-16';
export const STUDENT_CARD_VALID_UNTIL = '2025-03-31';
export const STAFF_CARD_VALIDITY_YEARS = 3;

const BLOOD_GROUPS = ['O+', 'B+', 'A+', 'AB+', 'O-', 'B+', 'A-', 'O+', 'B-', 'A+'];

export const CARD_HOLDERS: CardHolder[] = [
  ...CLASS_10A_STUDENTS.map((s, i) => ({
    id: s.studentId,
    type: 'Student' as const,
    name: s.name,
    // Roll 09 has no photo on file yet, so the print gate can be exercised
    photo: s.studentId === 'stu-09' ? undefined : s.avatar,
    designation: 'Class 10-A',
    identifier: `ADM-2018-04${String(80 + i + 1).padStart(2, '0')}`,
    bloodGroup: BLOOD_GROUPS[i],
    emergencyPhone: `+91 98401 2${String(3450 + i).padStart(4, '0')}`,
  })),
  { id: 'tch-malini', type: 'Teacher', name: 'Mrs. Malini Iyer', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&auto=format&fit=crop&q=80', designation: 'PGT Physics', identifier: 'EMP-T-0112', bloodGroup: 'B+', emergencyPhone: '+91 94440 22110', accessZones: ['Academic block', 'Physics lab', 'Library'] },
  { id: 'tch-raghavan', type: 'Teacher', name: 'Dr. V. Raghavan', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&auto=format&fit=crop&q=80', designation: 'HOD Mathematics', identifier: 'EMP-T-0047', bloodGroup: 'O+', emergencyPhone: '+91 94440 22147', accessZones: ['Academic block', 'Exam cell', 'Library'] },
  { id: 'tch-balaji', type: 'Teacher', name: 'Mr. S. Balaji', photo: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=160&auto=format&fit=crop&q=80', designation: 'PGT Chemistry', identifier: 'EMP-T-0131', bloodGroup: 'A+', emergencyPhone: '+91 94440 22131', accessZones: ['Academic block', 'Chemistry lab'] },
  { id: 'tch-clara', type: 'Teacher', name: 'Ms. Clara D’Souza', photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=160&auto=format&fit=crop&q=80', designation: 'TGT English', identifier: 'EMP-T-0158', bloodGroup: 'AB+', emergencyPhone: '+91 94440 22158', accessZones: ['Academic block', 'Library'] },
  { id: 'tch-dinesh', type: 'Teacher', name: 'Coach R. Dinesh', designation: 'PE & Sports', identifier: 'EMP-T-0163', bloodGroup: 'O-', emergencyPhone: '+91 94440 22163', accessZones: ['Sports complex', 'Academic block'] },
  { id: 'nts-murugan', type: 'Staff', name: 'Mr. P. Murugan', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80', designation: 'Security Supervisor', identifier: 'EMP-N-0021', bloodGroup: 'B+', emergencyPhone: '+91 90030 11021', staffCategory: 'Security', accessZones: ['All gates', 'CCTV room'] },
  { id: 'nts-selvam', type: 'Staff', name: 'Mr. K. Selvam', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&auto=format&fit=crop&q=80', designation: 'Bus Driver · Route 14', identifier: 'EMP-N-0044', bloodGroup: 'O+', emergencyPhone: '+91 90030 11044', staffCategory: 'Transport', accessZones: ['Transport bay', 'Gate 2'] },
  { id: 'nts-lakshmi', type: 'Staff', name: 'Mrs. R. Lakshmi', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&auto=format&fit=crop&q=80', designation: 'Housekeeping Lead', identifier: 'EMP-N-0063', bloodGroup: 'A+', emergencyPhone: '+91 90030 11063', staffCategory: 'Housekeeping', accessZones: ['Academic block', 'Admin block'] },
  { id: 'nts-arun', type: 'Staff', name: 'Mr. T. Arun', designation: 'Lab Attendant', identifier: 'EMP-N-0071', bloodGroup: 'B-', emergencyPhone: '+91 90030 11071', staffCategory: 'Laboratory', accessZones: ['Science labs'] },
  { id: 'nts-geetha', type: 'Staff', name: 'Mrs. S. Geetha', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80', designation: 'Hostel Warden · Godavari Hall', identifier: 'EMP-N-0088', bloodGroup: 'O+', emergencyPhone: '+91 90030 11088', staffCategory: 'Hostel', accessZones: ['Godavari Hall', 'Mess'] },
];

export const INITIAL_CARD_RECORDS: CardRecord[] = [
  { cardNo: 'LA-CHN01-S24-00001', holderId: 'stu-01', rfid: '04A1B2C3', issuedOn: '2024-06-03', validUntil: STUDENT_CARD_VALID_UNTIL, version: 1, status: 'Active' },
  { cardNo: 'LA-CHN01-S24-00002', holderId: 'stu-02', rfid: '04A1B2C4', issuedOn: '2024-06-03', validUntil: STUDENT_CARD_VALID_UNTIL, version: 1, status: 'Revoked', revokeReason: 'Lost — reported by parent' },
  { cardNo: 'LA-CHN01-S24-00003', holderId: 'stu-02', rfid: '04A1B2D9', issuedOn: '2024-08-12', validUntil: STUDENT_CARD_VALID_UNTIL, version: 2, status: 'Active' },
  { cardNo: 'LA-CHN01-S24-00004', holderId: 'stu-04', rfid: '04A1B2C6', issuedOn: '2024-06-03', validUntil: STUDENT_CARD_VALID_UNTIL, version: 1, status: 'Active' },
  { cardNo: 'LA-CHN01-T21-00001', holderId: 'tch-raghavan', rfid: '08F0E1D2', issuedOn: '2021-06-01', validUntil: '2024-05-31', version: 1, status: 'Active' },
  { cardNo: 'LA-CHN01-T23-00001', holderId: 'tch-malini', rfid: '08F0E1D7', issuedOn: '2023-06-01', validUntil: '2026-05-31', version: 1, status: 'Active' },
  { cardNo: 'LA-CHN01-N22-00001', holderId: 'nts-murugan', rfid: '0C11223344', issuedOn: '2022-09-01', validUntil: '2025-08-31', version: 1, status: 'Active' },
];

export const STAFF_CATEGORY_COLOURS: Record<NonNullable<CardHolder['staffCategory']>, string> = {
  Security: '#b91c1c',
  Transport: '#d97706',
  Housekeeping: '#15803d',
  Laboratory: '#7c3aed',
  Hostel: '#0369a1',
};

export const TYPE_SERIES_LETTER: Record<HolderType, string> = { Student: 'S', Teacher: 'T', Staff: 'N' };

/** RFID UID: 4-byte (8 hex) or 7-byte (14 hex) — also accepts 5-byte EM4100 (10 hex). */
export const isValidRfid = (value: string) => /^([0-9A-F]{8}|[0-9A-F]{10}|[0-9A-F]{14})$/.test(value);

export const addYears = (isoDate: string, years: number) => {
  const [y, m, d] = isoDate.split('-').map(Number);
  const end = new Date(Date.UTC(y + years, m - 1, d));
  end.setUTCDate(end.getUTCDate() - 1);
  return end.toISOString().slice(0, 10);
};

/** Next number in a card series: LA-<campus>-<type letter><yy>-<5-digit sequence> (MST-010). */
export const nextCardNumber = (records: CardRecord[], campusCode: string, type: HolderType, issuedOn: string) => {
  const prefix = `LA-${campusCode.replace(/[^A-Z0-9]/gi, '').toUpperCase()}-${TYPE_SERIES_LETTER[type]}${issuedOn.slice(2, 4)}-`;
  const maxSeq = records
    .filter(r => r.cardNo.startsWith(prefix))
    .reduce((max, r) => Math.max(max, Number(r.cardNo.slice(prefix.length))), 0);
  return `${prefix}${String(maxSeq + 1).padStart(5, '0')}`;
};

export type CardState = 'Not issued' | 'Active' | 'Expired' | 'Photo missing';

export const activeCardFor = (records: CardRecord[], holderId: string) =>
  records.filter(r => r.holderId === holderId && r.status === 'Active').sort((a, b) => b.version - a.version)[0];

export const cardStateFor = (holder: CardHolder, records: CardRecord[], asOf = ID_CARD_AS_OF): CardState => {
  if (!holder.photo) return 'Photo missing';
  const card = activeCardFor(records, holder.id);
  if (!card) return 'Not issued';
  return card.validUntil < asOf ? 'Expired' : 'Active';
};
