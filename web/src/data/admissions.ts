// Admissions domain data and pure rules (LMN-SMS-FEAT-001 §12).
// All dates are ISO strings; ADMISSIONS_AS_OF is the operating date of the demo cycle (AY 2025–26).

export const ADMISSIONS_AS_OF = '2024-12-02';
export const ADMISSION_YEAR = '2025';

export type Quota = 'General' | 'RTE' | 'Sibling' | 'Staff ward' | 'Management';
export type Source = 'Walk-in' | 'Phone' | 'Website' | 'Referral' | 'Campaign' | 'Agent' | 'Social';
export type DocStatus = 'Missing' | 'Uploaded' | 'Verified' | 'Rejected';
export type Stage = 'Document check' | 'Assessment' | 'Decision' | 'Offer' | 'Enrolled' | 'Waitlisted' | 'Rejected' | 'Withdrawn';

export const SOURCES: Source[] = ['Walk-in', 'Phone', 'Website', 'Referral', 'Campaign', 'Agent', 'Social'];
export const COUNSELLORS = ['Ms. Priya Venkat', 'Mr. Harish Kumar', 'Mrs. Nandini Rao'];
export const LOST_REASONS = ['Chose another school', 'Fee not affordable', 'Distance / transport', 'Seat not available', 'No response'];
export const REJECT_REASONS = ['Age criteria not met', 'Assessment below cut-off', 'Documents not provided', 'Seat unavailable'];
export const DECLINE_REASONS = ['Joined another school', 'Relocating', 'Fee not affordable', 'Other'];

export interface Interaction {
  at: string;
  channel: 'Call' | 'Visit' | 'WhatsApp' | 'Email';
  outcome: string;
}

export interface Enquiry {
  id: string;
  child: string;
  dob: string;
  gender: 'Male' | 'Female';
  classApplied: string;
  guardian: string;
  mobile: string;
  source: Source;
  counsellor: string;
  nextFollowUp: string;
  status: 'Open' | 'Converted' | 'Lost';
  lostReason?: string;
  utm?: { campaign: string; medium: string; source: string };
  interactions: Interaction[];
}

export interface ApplicationDoc {
  type: string;
  status: DocStatus;
  reason?: string;
  /** Conditional admission: document may follow by this date (ADM-037) */
  deadline?: string;
}

export interface Offer {
  sentOn: string;
  channels: string[];
  readOn?: string;
  deadline: string;
  response?: 'Accepted' | 'Declined' | 'Lapsed';
  declineReason?: string;
}

export interface Payment {
  amount: number;
  paid: number;
  status: 'Not started' | 'Initiated' | 'Realised';
}

export interface Application {
  appNo: string;
  enquiryId?: string;
  child: string;
  dob: string;
  gender: 'Male' | 'Female';
  classApplied: string;
  quota: Quota;
  guardian: string;
  mobile: string;
  origin: 'Online' | 'Offline';
  siblingOf?: string;
  consent: { purpose: string; granted: boolean }[];
  declarationAccepted: boolean;
  docs: ApplicationDoc[];
  testScore?: number;
  interviewScore?: number;
  submittedOn: string;
  stage: Stage;
  decisionReason?: string;
  pendingPrincipalApproval?: boolean;
  waitlistedOn?: string;
  offer?: Offer;
  payment: Payment;
  joiningMonth: number;
  enrolment?: { admissionNo: string; section: string; rollNo: number };
}

export interface ClassConfig {
  classApplied: string;
  annualFee: number;
  sections: { name: string; capacity: number; male: number; female: number }[];
  quotas: Record<Quota, number>;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export const CLASS_CONFIG: ClassConfig[] = [
  {
    classApplied: 'Class 1',
    annualFee: 96000,
    sections: [
      { name: 'A', capacity: 30, male: 14, female: 13 },
      { name: 'B', capacity: 30, male: 12, female: 15 },
    ],
    quotas: { General: 36, RTE: 15, Sibling: 4, 'Staff ward': 2, Management: 3 },
  },
  {
    classApplied: 'Class 6',
    annualFee: 118000,
    sections: [
      { name: 'A', capacity: 40, male: 19, female: 19 },
      { name: 'B', capacity: 40, male: 20, female: 18 },
    ],
    quotas: { General: 3, RTE: 0, Sibling: 1, 'Staff ward': 0, Management: 1 },
  },
  {
    classApplied: 'Class 11 (Science)',
    annualFee: 152000,
    sections: [{ name: 'A', capacity: 40, male: 18, female: 19 }],
    quotas: { General: 2, RTE: 0, Sibling: 0, 'Staff ward': 0, Management: 1 },
  },
];

export const QUOTAS: Quota[] = ['General', 'RTE', 'Sibling', 'Staff ward', 'Management'];

/** Quotas whose selections need Principal approval (ADM-049). */
export const PRINCIPAL_APPROVAL_QUOTAS: Quota[] = ['Management'];

const BASE_DOCS = ['Birth certificate', 'Aadhaar', 'Address proof', 'Passport photo', 'Guardian ID'];

/** Required documents per class and quota (ADM-031, ADM-032). */
export const requiredDocs = (classApplied: string, quota: Quota): string[] => {
  const docs = [...BASE_DOCS];
  if (classApplied === 'Class 1') docs.push('Medical / immunisation');
  else docs.push('Previous marksheet', 'Transfer certificate');
  if (quota === 'RTE') docs.push('Caste / income certificate');
  return docs;
};

export const CONSENT_PURPOSES = ['Admission processing', 'Photo on ID card and records', 'WhatsApp / SMS communication', 'Transport GPS tracking'];

// ---------------------------------------------------------------------------
// Pure rules
// ---------------------------------------------------------------------------

const normaliseName = (name: string) => name.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim();
const normaliseMobile = (mobile: string) => mobile.replace(/\D/g, '').slice(-10);

/** ADM-006: same child name + DOB + guardian mobile. Twins (different names) are not duplicates. */
export const isDuplicateEnquiry = (a: Pick<Enquiry, 'child' | 'dob' | 'mobile'>, b: Pick<Enquiry, 'child' | 'dob' | 'mobile'>) =>
  normaliseName(a.child) === normaliseName(b.child) && a.dob === b.dob && normaliseMobile(a.mobile) === normaliseMobile(b.mobile);

/** ADM-007: counsellor with the fewest open enquiries; ties go to list order. */
export const nextCounsellor = (enquiries: Enquiry[]) =>
  COUNSELLORS.map(c => ({ c, open: enquiries.filter(e => e.counsellor === c && e.status === 'Open').length })).sort(
    (a, b) => a.open - b.open || COUNSELLORS.indexOf(a.c) - COUNSELLORS.indexOf(b.c)
  )[0].c;

/** ADM-022 / MST-010: APP-<year>-<4-digit sequence>. */
export const nextApplicationNo = (apps: Application[]) => {
  const prefix = `APP-${ADMISSION_YEAR}-`;
  const max = apps.filter(a => a.appNo.startsWith(prefix)).reduce((m, a) => Math.max(m, Number(a.appNo.slice(prefix.length))), 0);
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
};

export const nextAdmissionNo = (apps: Application[]) => {
  const prefix = `ADM-${ADMISSION_YEAR}-`;
  const max = apps
    .map(a => a.enrolment?.admissionNo)
    .filter((n): n is string => Boolean(n?.startsWith(prefix)))
    .reduce((m, n) => Math.max(m, Number(n.slice(prefix.length))), 0);
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
};

/** ADM-035 / ADM-037: mandatory documents verified, or conditionally waived with a future deadline. */
export const documentGate = (app: Application, asOf = ADMISSIONS_AS_OF) => {
  const required = requiredDocs(app.classApplied, app.quota);
  const blocking = required.filter(type => {
    const doc = app.docs.find(d => d.type === type);
    if (doc?.status === 'Verified') return false;
    if (doc?.deadline && doc.deadline >= asOf) return false;
    return true;
  });
  const conditional = required.filter(type => {
    const doc = app.docs.find(d => d.type === type);
    return doc?.status !== 'Verified' && Boolean(doc?.deadline && doc.deadline >= asOf);
  });
  return { passed: blocking.length === 0, blocking, conditional };
};

export const missingDocs = (app: Application) =>
  requiredDocs(app.classApplied, app.quota).filter(type => {
    const d = app.docs.find(x => x.type === type);
    return !d || d.status === 'Missing' || d.status === 'Rejected';
  });

/** ADM-043: weighted merit score (test 70%, interaction 30%), one decimal. */
export const meritScore = (app: Application) =>
  app.testScore === undefined || app.interviewScore === undefined ? null : Math.round((app.testScore * 0.7 + app.interviewScore * 0.3) * 10) / 10;

/** ADM-043 tie-break: higher test score, then earlier application number. */
export const meritList = (apps: Application[]) =>
  apps
    .filter(a => meritScore(a) !== null)
    .sort((a, b) => meritScore(b)! - meritScore(a)! || b.testScore! - a.testScore! || a.appNo.localeCompare(b.appNo))
    .map((a, i) => ({ app: a, rank: i + 1, score: meritScore(a)! }));

const offerIsLive = (a: Application) => a.stage === 'Offer' && a.offer && !a.offer.response;
const offerAccepted = (a: Application) => a.stage === 'Offer' && a.offer?.response === 'Accepted';

/** ADM-045: sanctioned / filled / offered / available per class and quota. */
export const seatStatus = (apps: Application[], classApplied: string, quota: Quota) => {
  const cfg = CLASS_CONFIG.find(c => c.classApplied === classApplied)!;
  const inQuota = apps.filter(a => a.classApplied === classApplied && a.quota === quota);
  const sanctioned = cfg.quotas[quota];
  const filled = inQuota.filter(a => a.stage === 'Enrolled').length;
  const offered = inQuota.filter(a => offerIsLive(a) || offerAccepted(a)).length;
  return { sanctioned, filled, offered, available: sanctioned - filled - offered };
};

/** ADM-047: waitlist position within class + quota, earliest waitlisted first then merit. */
export const waitlistFor = (apps: Application[], classApplied: string, quota: Quota) =>
  apps
    .filter(a => a.stage === 'Waitlisted' && a.classApplied === classApplied && a.quota === quota)
    .sort((a, b) => (meritScore(b) ?? 0) - (meritScore(a) ?? 0) || (a.waitlistedOn ?? '').localeCompare(b.waitlistedOn ?? '') || a.appNo.localeCompare(b.appNo));

/** ADM-057: section with fewest of the applicant's gender that still has room; ties → fewer total → name. */
export const allocateSection = (cfg: ClassConfig, apps: Application[], gender: Application['gender']) => {
  const withNew = cfg.sections.map(s => {
    const enrolled = apps.filter(a => a.classApplied === cfg.classApplied && a.enrolment?.section === s.name);
    const male = s.male + enrolled.filter(a => a.gender === 'Male').length;
    const female = s.female + enrolled.filter(a => a.gender === 'Female').length;
    return { name: s.name, capacity: s.capacity, male, female, total: male + female };
  });
  const open = withNew.filter(s => s.total < s.capacity);
  if (!open.length) return null;
  const key = gender === 'Male' ? 'male' : 'female';
  const pick = [...open].sort((a, b) => a[key] - b[key] || a.total - b.total || a.name.localeCompare(b.name))[0];
  return { section: pick.name, rollNo: pick.total + 1 };
};

/** Mid-year admission: fee prorated from the joining month (April = 1 … March = 12). */
export const proratedFee = (annualFee: number, joiningMonth: number) => {
  if (joiningMonth < 1 || joiningMonth > 12) throw new Error('joiningMonth must be 1–12');
  return Math.round((annualFee * (13 - joiningMonth)) / 12);
};

export const ACADEMIC_MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

export const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const docs = (classApplied: string, quota: Quota, overrides: Record<string, Partial<ApplicationDoc>> = {}): ApplicationDoc[] =>
  requiredDocs(classApplied, quota).map(type => ({ type, status: 'Verified' as DocStatus, ...overrides[type] }));

const consentAll = (photo = true) => CONSENT_PURPOSES.map(purpose => ({ purpose, granted: purpose.startsWith('Photo') ? photo : true }));

export const INITIAL_ENQUIRIES: Enquiry[] = [
  { id: 'ENQ-0412', child: 'Aditi R. Menon', dob: '2019-02-11', gender: 'Female', classApplied: 'Class 1', guardian: 'Rahul Menon', mobile: '+91 98840 11223', source: 'Website', counsellor: 'Ms. Priya Venkat', nextFollowUp: '2024-11-28', status: 'Open', utm: { campaign: 'admissions-2025', medium: 'cpc', source: 'google' }, interactions: [{ at: '2024-11-20', channel: 'Call', outcome: 'Requested campus visit' }] },
  { id: 'ENQ-0415', child: 'Vihaan S. Rao', dob: '2013-07-02', gender: 'Male', classApplied: 'Class 6', guardian: 'Sunitha Rao', mobile: '+91 99620 44551', source: 'Referral', counsellor: 'Mr. Harish Kumar', nextFollowUp: '2024-12-03', status: 'Open', interactions: [{ at: '2024-11-25', channel: 'Visit', outcome: 'Toured campus, wants fee details' }] },
  { id: 'ENQ-0418', child: 'Ira K. Balan', dob: '2019-05-19', gender: 'Female', classApplied: 'Class 1', guardian: 'Karthik Balan', mobile: '+91 90030 77881', source: 'Walk-in', counsellor: 'Mrs. Nandini Rao', nextFollowUp: '2024-12-02', status: 'Open', interactions: [] },
  { id: 'ENQ-0420', child: 'Nikhil P. Joseph', dob: '2009-01-30', gender: 'Male', classApplied: 'Class 11 (Science)', guardian: 'Paul Joseph', mobile: '+91 98410 66332', source: 'Campaign', counsellor: 'Ms. Priya Venkat', nextFollowUp: '2024-11-30', status: 'Open', utm: { campaign: 'science-open-day', medium: 'social', source: 'instagram' }, interactions: [{ at: '2024-11-22', channel: 'WhatsApp', outcome: 'Shared brochure' }] },
  { id: 'ENQ-0401', child: 'Tara M. Shetty', dob: '2019-08-08', gender: 'Female', classApplied: 'Class 1', guardian: 'Mohan Shetty', mobile: '+91 98455 12121', source: 'Phone', counsellor: 'Mr. Harish Kumar', nextFollowUp: '2024-11-15', status: 'Lost', lostReason: 'Distance / transport', interactions: [{ at: '2024-11-10', channel: 'Call', outcome: 'Prefers school closer to home' }] },
  { id: 'ENQ-0395', child: 'Diya R. Krishnan', dob: '2019-03-14', gender: 'Female', classApplied: 'Class 1', guardian: 'Ramesh Krishnan', mobile: '+91 98401 55210', source: 'Website', counsellor: 'Ms. Priya Venkat', nextFollowUp: '2024-11-05', status: 'Converted', interactions: [{ at: '2024-11-02', channel: 'Email', outcome: 'Application link sent' }] },
];

export const INITIAL_APPLICATIONS: Application[] = [
  {
    appNo: 'APP-2025-0318', enquiryId: 'ENQ-0395', child: 'Diya R. Krishnan', dob: '2019-03-14', gender: 'Female', classApplied: 'Class 1', quota: 'General',
    guardian: 'Ramesh Krishnan', mobile: '+91 98401 55210', origin: 'Online', consent: consentAll(), declarationAccepted: true,
    docs: docs('Class 1', 'General'), testScore: 88, interviewScore: 90, submittedOn: '2024-11-06', stage: 'Decision', payment: { amount: 0, paid: 0, status: 'Not started' }, joiningMonth: 1,
  },
  {
    appNo: 'APP-2025-0319', child: 'Arjun V. Pillai', dob: '2019-06-21', gender: 'Male', classApplied: 'Class 1', quota: 'Sibling', siblingOf: 'Meera J. Pillai (Class 4-B)',
    guardian: 'Vinod Pillai', mobile: '+91 94440 33120', origin: 'Online', consent: consentAll(), declarationAccepted: true,
    docs: docs('Class 1', 'Sibling'), testScore: 81, interviewScore: 85, submittedOn: '2024-11-07', stage: 'Offer',
    offer: { sentOn: '2024-11-25', channels: ['Email', 'WhatsApp', 'Portal'], readOn: '2024-11-25', deadline: '2024-12-05', response: 'Accepted' },
    payment: { amount: 96000, paid: 48000, status: 'Initiated' }, joiningMonth: 1,
  },
  {
    appNo: 'APP-2025-0320', child: 'Zoya F. Khan', dob: '2019-01-09', gender: 'Female', classApplied: 'Class 1', quota: 'RTE',
    guardian: 'Farhan Khan', mobile: '+91 90031 45678', origin: 'Offline', consent: consentAll(false), declarationAccepted: true,
    docs: docs('Class 1', 'RTE', { 'Birth certificate': { status: 'Missing', deadline: '2025-01-15', reason: 'Affidavit submitted; certificate awaited from municipality' }, 'Caste / income certificate': { status: 'Uploaded' } }),
    testScore: 72, interviewScore: 80, submittedOn: '2024-11-08', stage: 'Document check', payment: { amount: 0, paid: 0, status: 'Not started' }, joiningMonth: 1,
  },
  {
    appNo: 'APP-2025-0321', enquiryId: 'ENQ-0388', child: 'Kabir S. Menon', dob: '2013-04-02', gender: 'Male', classApplied: 'Class 6', quota: 'General',
    guardian: 'Suresh Menon', mobile: '+91 98840 90123', origin: 'Offline', consent: consentAll(), declarationAccepted: true,
    docs: docs('Class 6', 'General', { 'Transfer certificate': { status: 'Rejected', reason: 'Unsigned copy' } }),
    testScore: 76, interviewScore: 70, submittedOn: '2024-11-09', stage: 'Document check', payment: { amount: 0, paid: 0, status: 'Not started' }, joiningMonth: 1,
  },
  {
    appNo: 'APP-2025-0322', child: 'Rhea D. Thomas', dob: '2013-09-15', gender: 'Female', classApplied: 'Class 6', quota: 'General',
    guardian: 'Daniel Thomas', mobile: '+91 97890 11002', origin: 'Online', consent: consentAll(), declarationAccepted: true,
    docs: docs('Class 6', 'General'), testScore: 91, interviewScore: 86, submittedOn: '2024-11-10', stage: 'Offer',
    offer: { sentOn: '2024-11-20', channels: ['Email', 'WhatsApp'], deadline: '2024-11-30' },
    payment: { amount: 0, paid: 0, status: 'Not started' }, joiningMonth: 1,
  },
  {
    appNo: 'APP-2025-0323', child: 'Samar J. Gill', dob: '2013-02-27', gender: 'Male', classApplied: 'Class 6', quota: 'General',
    guardian: 'Jaspreet Gill', mobile: '+91 98111 22334', origin: 'Online', consent: consentAll(), declarationAccepted: true,
    docs: docs('Class 6', 'General'), testScore: 84, interviewScore: 80, submittedOn: '2024-11-11', stage: 'Offer',
    offer: { sentOn: '2024-11-22', channels: ['Email', 'Portal'], readOn: '2024-11-23', deadline: '2024-12-06', response: 'Accepted' },
    payment: { amount: 118000, paid: 118000, status: 'Realised' }, joiningMonth: 1,
  },
  {
    appNo: 'APP-2025-0324', child: 'Anika B. Reddy', dob: '2013-11-03', gender: 'Female', classApplied: 'Class 6', quota: 'General',
    guardian: 'Bhaskar Reddy', mobile: '+91 90000 56781', origin: 'Online', consent: consentAll(), declarationAccepted: true,
    docs: docs('Class 6', 'General'), testScore: 79, interviewScore: 83, submittedOn: '2024-11-12', stage: 'Waitlisted', waitlistedOn: '2024-11-24',
    payment: { amount: 0, paid: 0, status: 'Not started' }, joiningMonth: 1,
  },
  {
    appNo: 'APP-2025-0325', child: 'Dev A. Iyer', dob: '2013-05-17', gender: 'Male', classApplied: 'Class 6', quota: 'General',
    guardian: 'Anand Iyer', mobile: '+91 98400 71717', origin: 'Online', consent: consentAll(), declarationAccepted: true,
    docs: docs('Class 6', 'General'), testScore: 79, interviewScore: 78, submittedOn: '2024-11-13', stage: 'Waitlisted', waitlistedOn: '2024-11-24',
    payment: { amount: 0, paid: 0, status: 'Not started' }, joiningMonth: 1,
  },
  {
    appNo: 'APP-2025-0326', child: 'Kiara N. Bose', dob: '2008-12-01', gender: 'Female', classApplied: 'Class 11 (Science)', quota: 'Management',
    guardian: 'Nilesh Bose', mobile: '+91 98300 44556', origin: 'Offline', consent: consentAll(), declarationAccepted: true,
    docs: docs('Class 11 (Science)', 'Management'), testScore: 68, interviewScore: 74, submittedOn: '2024-11-14', stage: 'Decision',
    payment: { amount: 0, paid: 0, status: 'Not started' }, joiningMonth: 5,
  },
  {
    appNo: 'APP-2025-0327', child: 'Omar Y. Siddiqui', dob: '2009-03-22', gender: 'Male', classApplied: 'Class 11 (Science)', quota: 'General',
    guardian: 'Yusuf Siddiqui', mobile: '+91 90800 32145', origin: 'Online', consent: consentAll(), declarationAccepted: true,
    docs: docs('Class 11 (Science)', 'General'), testScore: 93, interviewScore: 88, submittedOn: '2024-11-15', stage: 'Assessment',
    payment: { amount: 0, paid: 0, status: 'Not started' }, joiningMonth: 1,
  },
  {
    appNo: 'APP-2025-0310', child: 'Pranav L. Das', dob: '2013-08-19', gender: 'Male', classApplied: 'Class 6', quota: 'General',
    guardian: 'Lokesh Das', mobile: '+91 98422 60606', origin: 'Online', consent: consentAll(), declarationAccepted: true,
    docs: docs('Class 6', 'General'), testScore: 88, interviewScore: 84, submittedOn: '2024-10-28', stage: 'Enrolled',
    offer: { sentOn: '2024-11-04', channels: ['Email', 'WhatsApp', 'Portal'], readOn: '2024-11-04', deadline: '2024-11-14', response: 'Accepted' },
    payment: { amount: 118000, paid: 118000, status: 'Realised' }, joiningMonth: 1,
    enrolment: { admissionNo: 'ADM-2025-0001', section: 'B', rollNo: 39 },
  },
];

// Historical funnel for analytics (ADM-061 – ADM-066)
export const SOURCE_COSTS: Record<Source, number> = { 'Walk-in': 0, Phone: 0, Website: 42000, Referral: 15000, Campaign: 96000, Agent: 60000, Social: 38000 };

export const SOURCE_FUNNEL: Record<Source, { enquiries: number; applications: number; enrolled: number }> = {
  'Walk-in': { enquiries: 148, applications: 96, enrolled: 41 },
  Phone: { enquiries: 102, applications: 51, enrolled: 18 },
  Website: { enquiries: 176, applications: 104, enrolled: 37 },
  Referral: { enquiries: 64, applications: 49, enrolled: 22 },
  Campaign: { enquiries: 71, applications: 28, enrolled: 5 },
  Agent: { enquiries: 22, applications: 12, enrolled: 2 },
  Social: { enquiries: 29, applications: 8, enrolled: 1 },
};

export const LAST_CYCLE_SAME_POINT = { enquiries: 548, applications: 301, offers: 150, enrolled: 104 };

export const STAGE_DAYS: { stage: string; avgDays: number; p90Days: number }[] = [
  { stage: 'Enquiry → Application', avgDays: 6.2, p90Days: 14 },
  { stage: 'Document check', avgDays: 3.1, p90Days: 8 },
  { stage: 'Assessment', avgDays: 5.4, p90Days: 9 },
  { stage: 'Decision', avgDays: 2.3, p90Days: 6 },
  { stage: 'Offer → Fee payment', avgDays: 7.8, p90Days: 12 },
];

// ---------------------------------------------------------------------------
// Transitions (pure: take the application list, return a new one)
// ---------------------------------------------------------------------------

export const OFFER_CHANNELS = ['Email', 'WhatsApp', 'Portal'];
export const OFFER_VALID_DAYS = 7;

const makeOffer = (asOf: string): Offer => ({ sentOn: asOf, channels: OFFER_CHANNELS, deadline: addDays(asOf, OFFER_VALID_DAYS) });

/** ADM-047: offer freed seats to the top of the waitlist. */
export const promoteWaitlist = (apps: Application[], classApplied: string, quota: Quota, asOf = ADMISSIONS_AS_OF) => {
  let next = apps;
  const promoted: string[] = [];
  let available = seatStatus(next, classApplied, quota).available;
  for (const candidate of waitlistFor(next, classApplied, quota)) {
    if (available <= 0) break;
    next = next.map(a => (a.appNo === candidate.appNo ? { ...a, stage: 'Offer' as Stage, offer: makeOffer(asOf) } : a));
    promoted.push(candidate.appNo);
    available--;
  }
  return { apps: next, promoted };
};

/** ADM-053: lapse unanswered offers past their deadline, return seats, promote the waitlist. */
export const expireOffers = (apps: Application[], asOf = ADMISSIONS_AS_OF) => {
  const lapsed = apps.filter(a => a.stage === 'Offer' && a.offer && !a.offer.response && a.offer.deadline < asOf);
  let next = apps.map(a =>
    lapsed.includes(a) ? { ...a, stage: 'Withdrawn' as Stage, decisionReason: 'Offer lapsed', offer: { ...a.offer!, response: 'Lapsed' as const } } : a
  );
  const promoted: string[] = [];
  const pools = new Set(lapsed.map(a => `${a.classApplied}|${a.quota}`));
  pools.forEach(key => {
    const [classApplied, quota] = key.split('|') as [string, Quota];
    const r = promoteWaitlist(next, classApplied, quota, asOf);
    next = r.apps;
    promoted.push(...r.promoted);
  });
  return { apps: next, lapsed: lapsed.map(a => a.appNo), promoted };
};

export type DecisionResult = { ok: true; apps: Application[]; message: string } | { ok: false; error: string };

/** ADM-046 / ADM-049: record select / waitlist / reject. */
export const decide = (
  apps: Application[],
  appNo: string,
  decision: 'Select' | 'Waitlist' | 'Reject',
  reason: string,
  approvedByPrincipal: boolean,
  asOf = ADMISSIONS_AS_OF
): DecisionResult => {
  const app = apps.find(a => a.appNo === appNo);
  if (!app) return { ok: false, error: `Unknown application ${appNo}` };
  if (!['Decision', 'Waitlisted'].includes(app.stage)) return { ok: false, error: `${appNo} is at ${app.stage}, not awaiting a decision` };
  if (decision === 'Reject') {
    if (!reason) return { ok: false, error: 'A reason is required to reject' };
    return { ok: true, apps: apps.map(a => (a.appNo === appNo ? { ...a, stage: 'Rejected', decisionReason: reason, pendingPrincipalApproval: false } : a)), message: `${appNo} rejected` };
  }
  if (decision === 'Waitlist') {
    return { ok: true, apps: apps.map(a => (a.appNo === appNo ? { ...a, stage: 'Waitlisted', waitlistedOn: a.waitlistedOn ?? asOf, pendingPrincipalApproval: false } : a)), message: `${appNo} waitlisted` };
  }
  if (!documentGate(app, asOf).passed) return { ok: false, error: `${appNo} has unverified mandatory documents` };
  if (PRINCIPAL_APPROVAL_QUOTAS.includes(app.quota) && !approvedByPrincipal) {
    return { ok: true, apps: apps.map(a => (a.appNo === appNo ? { ...a, pendingPrincipalApproval: true } : a)), message: `${appNo} sent to Principal for approval (${app.quota} quota)` };
  }
  if (seatStatus(apps, app.classApplied, app.quota).available <= 0) return { ok: false, error: `No ${app.quota} seats left in ${app.classApplied} — waitlist instead` };
  return {
    ok: true,
    apps: apps.map(a => (a.appNo === appNo ? { ...a, stage: 'Offer', offer: makeOffer(asOf), pendingPrincipalApproval: false } : a)),
    message: `Offer issued to ${app.child}`,
  };
};

/** ADM-054 / ADM-055: fee due for the joining month; seat confirmed only on realisation. */
export const feeDue = (app: Application) => {
  const cfg = CLASS_CONFIG.find(c => c.classApplied === app.classApplied)!;
  return proratedFee(cfg.annualFee, app.joiningMonth);
};

export type EnrolResult = { ok: true; apps: Application[]; admissionNo: string; section: string; rollNo: number } | { ok: false; error: string };

/** ADM-056 / ADM-057 / ADM-038: convert an accepted, paid offer into a student record. */
export const enrol = (apps: Application[], appNo: string, asOf = ADMISSIONS_AS_OF): EnrolResult => {
  const app = apps.find(a => a.appNo === appNo);
  if (!app) return { ok: false, error: `Unknown application ${appNo}` };
  if (app.offer?.response !== 'Accepted') return { ok: false, error: 'Offer has not been accepted' };
  if (app.payment.status !== 'Realised') return { ok: false, error: 'Payment has not been realised — seat not yet confirmed' };
  if (!documentGate(app, asOf).passed) return { ok: false, error: 'Mandatory documents are neither verified nor conditionally waived' };
  const cfg = CLASS_CONFIG.find(c => c.classApplied === app.classApplied)!;
  const slot = allocateSection(cfg, apps, app.gender);
  if (!slot) return { ok: false, error: `All sections of ${app.classApplied} are full` };
  const admissionNo = nextAdmissionNo(apps);
  return {
    ok: true,
    admissionNo,
    ...slot,
    apps: apps.map(a => (a.appNo === appNo ? { ...a, stage: 'Enrolled', enrolment: { admissionNo, ...slot } } : a)),
  };
};

/** Guardian mobiles of currently enrolled students, used to detect siblings (ADM-018). */
export const SIBLING_DIRECTORY: { mobile: string; student: string }[] = [
  { mobile: '+91 94440 33120', student: 'Meera J. Pillai (Class 4-B)' },
  { mobile: '+91 98401 23456', student: 'Aarav S. Ramanathan (Class 10-A)' },
  { mobile: '+91 98840 90124', student: 'Ishaan S. Menon (Class 8-A)' },
];

export const findSibling = (mobile: string) => SIBLING_DIRECTORY.find(s => normaliseMobile(s.mobile) === normaliseMobile(mobile))?.student;

export const isValidIndianMobile = (mobile: string) => /^[6-9]\d{9}$/.test(normaliseMobile(mobile)) && mobile.replace(/\D/g, '').length >= 10;
