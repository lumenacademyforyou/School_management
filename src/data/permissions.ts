// Feature-level access grants (RBAC-001, RBAC-003, RBAC-010, RBAC-013).
//
// Every feature in the catalogue gets one row per role, derived from four questions:
//   Who is accountable for the outcome being produced?  -> C, U, D (exactly one role)
//   Who needs to see it to do their own job?             -> R
//   Who answers if it's wrong or contested?              -> A
//   Who needs the data outside the system?               -> E
// Module policies give the default answer; FEATURE_OVERRIDES pin individual features.
import { RAW_FEATURES_SPEC } from './featureCatalog';

export type Verb = 'C' | 'R' | 'U' | 'D' | 'A' | 'E';
export type GrantRole = 'principal' | 'accountant' | 'admissions' | 'auditor' | 'exam-coordinator' | 'class-teacher' | 'parent';
export type Scope = 'All branches' | 'Own branch' | 'Own section only' | 'Own children only' | '–';

export const GRANT_ROLES: GrantRole[] = ['principal', 'accountant', 'admissions', 'auditor', 'exam-coordinator', 'class-teacher', 'parent'];
export const VERB_ORDER: Verb[] = ['C', 'R', 'U', 'D', 'A', 'E'];

export const GRANT_ROLE_LABEL: Record<GrantRole, string> = {
  principal: 'Principal',
  accountant: 'Accountant',
  admissions: 'Admissions officer',
  auditor: 'Auditor',
  'exam-coordinator': 'Exam coordinator',
  'class-teacher': 'Class teacher',
  parent: 'Parent',
};

export const VERB_LABEL: Record<Verb, string> = {
  C: 'Create',
  R: 'Read',
  U: 'Update',
  D: 'Delete',
  A: 'Approve',
  E: 'Export',
};

export interface Grant {
  featureId: string;
  role: GrantRole;
  verbs: Verb[];
  scope: Scope;
  condition: string;
}

/** A concession above this percentage needs the Principal's approval (FEE-011). */
export const CONCESSION_APPROVAL_THRESHOLD_PCT = 10;

type Partial_ = { role: GrantRole; verbs: Verb[]; scope?: Scope; condition?: string };

interface ModulePolicy {
  /** The one role accountable for the outcome (gets C, R, U, D). */
  owner: GrantRole;
  ownerScope?: Scope;
  /** Everyone else, with what they need. */
  others: Partial_[];
}

const OWN = 'Own branch' as const;

const r = (role: GrantRole, scope: Scope = OWN, condition = ''): Partial_ => ({ role, verbs: ['R'], scope, condition });
const ra = (role: GrantRole, condition = ''): Partial_ => ({ role, verbs: ['R', 'A'], scope: OWN, condition });
const re = (role: GrantRole, scope: Scope = OWN, condition = ''): Partial_ => ({ role, verbs: ['R', 'E'], scope, condition });

const AUDITOR_RE = re('auditor', 'All branches', 'Read-only; every export is logged');

const MODULE_POLICY: Record<string, ModulePolicy> = {
  // Layer 1 — platform
  TEN: { owner: 'principal', others: [] },
  IAM: { owner: 'principal', others: [] },
  RBAC: { owner: 'principal', others: [r('auditor', 'All branches', 'Read-only review of who can do what')] },
  CNS: { owner: 'principal', others: [AUDITOR_RE, r('parent', 'Own children only')] },
  WFL: { owner: 'principal', others: [r('accountant', OWN, 'Own requests only'), r('admissions', OWN, 'Own requests only'), r('exam-coordinator', OWN, 'Own requests and coordinator stages'), r('auditor', 'All branches')] },
  DOC: { owner: 'admissions', others: [ra('principal'), r('parent', 'Own children only')] },
  NOT: { owner: 'principal', others: [r('accountant'), r('admissions'), r('class-teacher', 'Own section only')] },
  AUD: { owner: 'principal', others: [AUDITOR_RE] },
  RPT: { owner: 'principal', others: [re('accountant', OWN, 'Finance reports only'), r('admissions', OWN, 'Admission reports only'), AUDITOR_RE] },
  MST: { owner: 'principal', others: [] },
  MIG: { owner: 'principal', others: [] },
  // Layer 2 — core domain
  ADM: { owner: 'admissions', others: [ra('principal', 'Approval required to publish a merit list')] },
  STU: {
    owner: 'admissions',
    others: [ra('principal'), r('accountant', OWN, 'Contact and fee fields only'), r('class-teacher', 'Own section only', 'Health and family notes hidden'), r('parent', 'Own children only')],
  },
  CUR: { owner: 'principal', others: [r('class-teacher', 'Own section only'), r('parent', 'Own children only')] },
  TTB: { owner: 'principal', others: [r('class-teacher', 'Own section only'), r('parent', 'Own children only')] },
  EXM: {
    owner: 'class-teacher',
    ownerScope: 'Own section only',
    others: [ra('principal', 'Marks lock after approval'), r('exam-coordinator', OWN, 'Schedules and published results'), r('parent', 'Own children only', 'After results are published')],
  },
  RCD: { owner: 'class-teacher', ownerScope: 'Own section only', others: [ra('principal', 'Report cards publish only after approval'), r('parent', 'Own children only', 'After results are published')] },
  ATT: {
    owner: 'class-teacher',
    ownerScope: 'Own section only',
    others: [ra('principal', 'Corrections older than the edit window need approval'), r('parent', 'Own children only')],
  },
  FEE: { owner: 'accountant', others: [ra('principal'), AUDITOR_RE, r('parent', 'Own children only')] },
  ACC: { owner: 'accountant', others: [ra('principal'), AUDITOR_RE] },
  // Layer 3 — operations
  HRM: { owner: 'principal', others: [] },
  PAY: { owner: 'accountant', others: [ra('principal', 'Payroll is released only after approval'), AUDITOR_RE] },
  LIB: { owner: 'principal', others: [r('parent', 'Own children only')] },
  TRN: { owner: 'principal', others: [r('class-teacher', 'Own section only'), r('parent', 'Own children only')] },
  HST: { owner: 'principal', others: [r('parent', 'Own children only')] },
  INV: { owner: 'principal', others: [] },
  // Layer 4 — engagement
  COM: { owner: 'principal', others: [r('accountant'), r('admissions'), r('class-teacher', 'Own section only'), r('parent', 'Own children only')] },
  APP: { owner: 'parent', ownerScope: 'Own children only', others: [r('principal')] },
  LMS: { owner: 'class-teacher', ownerScope: 'Own section only', others: [r('principal'), r('parent', 'Own children only')] },
  QPG: {
    owner: 'exam-coordinator',
    others: [ra('principal', 'Cannot approve a paper they created; papers lock once submitted'), r('class-teacher', 'Own section only', 'Published papers only')],
  },
  HLP: { owner: 'principal', others: [r('parent', 'Own children only', 'Own tickets only')] },
  // Layer 5 — compliance
  DPD: { owner: 'principal', others: [AUDITOR_RE] },
  GOV: { owner: 'principal', others: [r('admissions'), AUDITOR_RE] },
  CRT: { owner: 'admissions', others: [ra('principal', 'Transfer certificates need approval'), r('parent', 'Own children only')] },
  INT: { owner: 'principal', others: [] },
  // Layer 6 — people
  TCH: { owner: 'principal', others: [] },
  NTS: { owner: 'principal', others: [] },
};

/**
 * Features whose rows are set explicitly. A role listed here replaces the module default for that role;
 * `verbs: []` records a deliberate "no access" with its reason.
 */
const FEATURE_OVERRIDES: Record<string, Partial_[]> = {
  'FEE-003': [
    { role: 'accountant', verbs: ['C', 'R', 'U'], scope: OWN, condition: 'Locked once invoicing starts for the year' },
    { role: 'principal', verbs: ['R', 'A'], scope: OWN, condition: 'Approval required on any mid-year revision' },
    { role: 'class-teacher', verbs: [], scope: '–', condition: 'No access; teachers have no business in fee configuration' },
  ],
  'FEE-011': [
    { role: 'accountant', verbs: ['C'], scope: OWN, condition: 'Can propose, cannot approve own proposal' },
    { role: 'principal', verbs: ['A'], scope: OWN, condition: `Mandatory above ${CONCESSION_APPROVAL_THRESHOLD_PCT}%` },
  ],
  'FEE-025': [
    { role: 'accountant', verbs: ['C', 'R'], scope: OWN, condition: 'Raises the refund; cannot pay it out' },
    { role: 'principal', verbs: ['R', 'A'], scope: OWN, condition: 'Every refund needs approval' },
  ],
  'FEE-028': [
    { role: 'accountant', verbs: ['R', 'E'], scope: OWN, condition: 'Export separately granted and logged' },
    { role: 'class-teacher', verbs: ['R'], scope: 'Own section only', condition: 'Amount visible, concession reason hidden' },
    { role: 'parent', verbs: ['R'], scope: 'Own children only', condition: 'Always' },
  ],
  'QPG-009': [{ role: 'exam-coordinator', verbs: ['C', 'R', 'U', 'D', 'E'], scope: OWN, condition: 'Answer keys leave the system only for the evaluation team' }],
  'QPG-010': [
    { role: 'exam-coordinator', verbs: ['C', 'R', 'U', 'D', 'E'], scope: OWN, condition: 'Print only after the paper is approved' },
    { role: 'principal', verbs: ['R', 'A', 'E'], scope: OWN, condition: 'Can export a paper for inspection' },
  ],
  'QPG-012': [
    { role: 'exam-coordinator', verbs: ['C', 'R'], scope: OWN, condition: 'Submits papers; cannot approve own paper' },
    { role: 'principal', verbs: ['R', 'A'], scope: OWN, condition: 'Approves, rejects or sends back every paper' },
  ],
  'FEE-042': [{ role: 'accountant', verbs: ['C', 'R', 'E'], scope: OWN, condition: 'Prepares the pack for the auditor; export is logged' }],
};

const sortVerbs = (v: Verb[]) => VERB_ORDER.filter(x => v.includes(x));

const deriveRows = (featureId: string, moduleCode: string): Grant[] => {
  const policy = MODULE_POLICY[moduleCode];
  if (!policy) return [];
  const base: Partial_[] = [{ role: policy.owner, verbs: ['C', 'R', 'U', 'D'], scope: policy.ownerScope ?? OWN, condition: '' }, ...policy.others];
  const overrides = FEATURE_OVERRIDES[featureId] ?? [];
  const merged = base.filter(b => !overrides.some(o => o.role === b.role)).concat(overrides);
  return GRANT_ROLES.flatMap(role => {
    const p = merged.find(m => m.role === role);
    if (!p) return [];
    return [{ featureId, role, verbs: sortVerbs(p.verbs), scope: p.verbs.length ? p.scope ?? OWN : '–', condition: p.condition ?? '' }];
  });
};

export interface FeatureGrants {
  id: string;
  module: string;
  name: string;
  phase: string;
  rows: Grant[];
}

export const FEATURE_GRANTS: FeatureGrants[] = RAW_FEATURES_SPEC.map(f => ({
  id: f.code,
  module: f.module,
  name: f.name,
  phase: f.phase,
  rows: deriveRows(f.code, f.module),
}));

const INDEX = new Map(FEATURE_GRANTS.map(f => [f.id, f]));

export const grantFor = (role: GrantRole, featureId: string): Grant | undefined => INDEX.get(featureId)?.rows.find(g => g.role === role);

export const can = (role: GrantRole, featureId: string, verb: Verb): boolean => grantFor(role, featureId)?.verbs.includes(verb) ?? false;

/** Any access at all to any feature of a module. */
export const hasModuleAccess = (role: GrantRole, moduleCode: string): boolean =>
  FEATURE_GRANTS.some(f => f.module === moduleCode && f.rows.some(g => g.role === role && g.verbs.length > 0));

/** Whether the role approves anything in the module. */
export const hasApproval = (role: GrantRole, moduleCode: string): boolean =>
  FEATURE_GRANTS.some(f => f.module === moduleCode && f.rows.some(g => g.role === role && g.verbs.includes('A')));

/** Whether the role produces anything in the module (holds C, U or D on some feature). */
export const canChangeModule = (role: GrantRole, moduleCode: string): boolean =>
  FEATURE_GRANTS.some(f => f.module === moduleCode && f.rows.some(g => g.role === role && g.verbs.some(v => v === 'C' || v === 'U' || v === 'D')));

const ownersOf = (f: FeatureGrants) => f.rows.filter(g => g.verbs.some(v => v === 'C' || v === 'U' || v === 'D')).map(g => g.role);

/** "Accountable" must mean one role: features where more than one role can create, update or delete. */
export const ownershipViolations = (): { id: string; owners: GrantRole[] }[] =>
  FEATURE_GRANTS.map(f => ({ id: f.id, owners: ownersOf(f) })).filter(x => x.owners.length > 1);

/** Features nobody edits directly because the system computes them (e.g. the outstanding ledger). */
export const systemProducedFeatures = (): string[] => FEATURE_GRANTS.filter(f => f.rows.length > 0 && ownersOf(f).length === 0).map(f => f.id);

export const verbString = (verbs: Verb[]) => (verbs.length ? verbs.join(', ') : '–');
