// Hostel (LMN-SMS-FEAT-001 §25, HST-001 … HST-010) as a parent sees it.

export interface Warden {
  name: string;
  phone: string;
  availableHours: string;
}

export interface Hostel {
  id: string;
  name: string;
  campus: string;
  warden: Warden;
  deputyWarden: Warden;
}

export interface Residence {
  studentId: string;
  hostelId: string;
  block: string;
  floor: number;
  room: string;
  roomType: string;
  bed: string;
  roommates: string[];
  checkInOn: string;
  status: 'Active resident' | 'On leave' | 'Checked out';
  boarding: 'Full boarder' | 'Weekly boarder';
  mess: string;
}

export type RollCallStatus = 'Present' | 'Late' | 'On outpass' | 'Absent';

export interface RollCall {
  date: string;
  slot: 'Night roll call';
  status: RollCallStatus;
  markedAt: string;
  by: string;
}

export interface Outpass {
  id: string;
  studentId: string;
  from: string;
  to: string;
  reason: string;
  escort: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Returned';
  decidedBy?: string;
  returnedAt?: string;
}

export const HOSTELS: Hostel[] = [
  {
    id: 'H-GOD',
    name: 'Godavari Hall (Boys)',
    campus: 'Chennai Campus',
    warden: { name: 'Mr. R. Senthil Kumar', phone: '+91 94440 55210', availableHours: '6 am – 10 pm' },
    deputyWarden: { name: 'Mr. J. Paul Raj', phone: '+91 94440 55211', availableHours: '10 pm – 6 am' },
  },
  {
    id: 'H-KAV',
    name: 'Kaveri Hall (Girls)',
    campus: 'Chennai Campus',
    warden: { name: 'Mrs. S. Meenakshi', phone: '+91 94440 55310', availableHours: '6 am – 10 pm' },
    deputyWarden: { name: 'Ms. A. Rosy', phone: '+91 94440 55311', availableHours: '10 pm – 6 am' },
  },
];

export const RESIDENCES: Residence[] = [
  {
    studentId: 'ros-07',
    hostelId: 'H-GOD',
    block: 'A Block',
    floor: 2,
    room: 'A-204',
    roomType: '4-sharing, attached bath',
    bed: 'Bed 03',
    roommates: ['Rahul T. (9-B)', 'Dev K. (9-A)', 'Sanjay M. (10-B)'],
    checkInOn: '2024-06-02',
    status: 'Active resident',
    boarding: 'Weekly boarder',
    mess: 'South Indian vegetarian',
  },
];

const HOSTEL_TODAY = '2024-09-16';

/** Last seven nights, newest first. The Friday night is an approved weekend outpass. */
export const rollCallsFor = (studentId: string): RollCall[] => {
  if (!RESIDENCES.some(r => r.studentId === studentId)) return [];
  const nights: [string, RollCallStatus, string][] = [
    ['2024-09-15', 'Present', '21:02'],
    ['2024-09-14', 'On outpass', '—'],
    ['2024-09-13', 'On outpass', '—'],
    ['2024-09-12', 'Present', '21:00'],
    ['2024-09-11', 'Late', '21:24'],
    ['2024-09-10', 'Present', '20:58'],
    ['2024-09-09', 'Present', '21:03'],
  ];
  return nights.map(([date, status, markedAt]) => ({ date, slot: 'Night roll call', status, markedAt, by: status === 'On outpass' ? 'Outpass register' : 'Mr. J. Paul Raj' }));
};

export const OUTPASSES: Outpass[] = [
  { id: 'OP-2291', studentId: 'ros-07', from: '2024-09-13 16:30', to: '2024-09-15 18:00', reason: 'Weekend home visit', escort: 'R. Selvan (father)', status: 'Returned', decidedBy: 'Mr. R. Senthil Kumar', returnedAt: '2024-09-15 17:42' },
  { id: 'OP-2310', studentId: 'ros-07', from: '2024-09-20 16:30', to: '2024-09-22 18:00', reason: 'Weekend home visit', escort: 'R. Selvan (father)', status: 'Approved', decidedBy: 'Mr. R. Senthil Kumar' },
  { id: 'OP-2244', studentId: 'ros-07', from: '2024-08-30 16:30', to: '2024-09-01 18:00', reason: 'Family function', escort: 'Mrs. R. Selvan (mother)', status: 'Returned', decidedBy: 'Mr. R. Senthil Kumar', returnedAt: '2024-09-01 17:15' },
];

export interface HostelView {
  hostel: Hostel;
  residence: Residence;
  rollCalls: RollCall[];
  attendancePct: number;
  outpasses: Outpass[];
  /** The outpass in force today, or the next approved one. */
  currentOutpass?: Outpass;
}

/** Everything the parent app shows about a child's hostel stay, or null for day scholars. */
export const hostelFor = (studentId: string): HostelView | null => {
  const residence = RESIDENCES.find(r => r.studentId === studentId);
  if (!residence) return null;
  const rollCalls = rollCallsFor(studentId);
  const counted = rollCalls.filter(r => r.status !== 'On outpass');
  const present = counted.filter(r => r.status === 'Present' || r.status === 'Late').length;
  const outpasses = OUTPASSES.filter(o => o.studentId === studentId).sort((a, b) => b.from.localeCompare(a.from));
  const currentOutpass = outpasses
    .filter(o => (o.status === 'Approved' || o.status === 'Pending') && o.to.slice(0, 10) >= HOSTEL_TODAY)
    .sort((a, b) => a.from.localeCompare(b.from))[0];
  return {
    hostel: HOSTELS.find(h => h.id === residence.hostelId)!,
    residence,
    rollCalls,
    attendancePct: counted.length ? Math.round((present / counted.length) * 100) : 100,
    outpasses,
    currentOutpass,
  };
};
