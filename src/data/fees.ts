// Fees & finance domain (LMN-SMS-FEAT-001 §19, FEE-001 – FEE-042).
// Behaviour is derived from the feature names in the PDF feature list; catalogue descriptions are pending.
// Everything is computed from inputs by pure functions — no stored balances, so cancelling a receipt or
// bouncing a cheque re-derives every allocation deterministically.
import { INITIAL_ROSTER, RosterStudent } from './students';

export const FEES_AS_OF = '2024-09-16';
export const ACADEMIC_YEAR = 'AY 2024–25';

// ---------------------------------------------------------------------------
// Masters (FEE-001, FEE-002)
// ---------------------------------------------------------------------------

export type Frequency = 'Instalment' | 'Annual' | 'One-time';

export interface FeeHead {
  code: string;
  name: string;
  frequency: Frequency;
  refundable: boolean;
  gstRate: number;
  optional: boolean;
  /** Lower number is settled first when a payment is allocated (FEE-019). */
  priority: number;
  /** Concessions apply only to heads flagged here. */
  concessionEligible: boolean;
  /** Counts as tuition on the fee certificate (FEE-040). */
  tuition: boolean;
}

export const FEE_HEADS: FeeHead[] = [
  { code: 'TUI', name: 'Tuition fee', frequency: 'Instalment', refundable: false, gstRate: 0, optional: false, priority: 1, concessionEligible: true, tuition: true },
  { code: 'DEV', name: 'Development fund', frequency: 'Annual', refundable: false, gstRate: 0, optional: false, priority: 2, concessionEligible: true, tuition: false },
  { code: 'LAB', name: 'Laboratory fee', frequency: 'Annual', refundable: false, gstRate: 0, optional: false, priority: 3, concessionEligible: true, tuition: false },
  { code: 'TRN', name: 'Transport fee', frequency: 'Instalment', refundable: false, gstRate: 0, optional: true, priority: 4, concessionEligible: false, tuition: false },
  { code: 'OLY', name: 'Olympiad coaching', frequency: 'Annual', refundable: false, gstRate: 18, optional: true, priority: 5, concessionEligible: false, tuition: false },
  { code: 'CAU', name: 'Caution deposit', frequency: 'One-time', refundable: true, gstRate: 0, optional: false, priority: 6, concessionEligible: false, tuition: false },
  { code: 'BNC', name: 'Cheque bounce charge', frequency: 'One-time', refundable: false, gstRate: 0, optional: false, priority: 7, concessionEligible: false, tuition: false },
];

/** Charge raised when a cheque is returned unpaid. */
export const CHEQUE_BOUNCE_CHARGE = 500;

export const headByCode = (code: string) => FEE_HEADS.find(h => h.code === code)!;

// ---------------------------------------------------------------------------
// Structure & schedule (FEE-003, FEE-004, FEE-005)
// ---------------------------------------------------------------------------

export interface Instalment {
  id: string;
  label: string;
  /** Academic months covered, April = 1 */
  months: number[];
  dueDate: string;
  /** Share of each instalment-frequency head */
  pct: number;
}

export const SCHEDULE: Instalment[] = [
  { id: 'Q1', label: 'Q1 · Apr–Jun', months: [1, 2, 3], dueDate: '2024-04-10', pct: 40 },
  { id: 'Q2', label: 'Q2 · Jul–Sep', months: [4, 5, 6], dueDate: '2024-07-10', pct: 20 },
  { id: 'Q3', label: 'Q3 · Oct–Dec', months: [7, 8, 9], dueDate: '2024-10-10', pct: 20 },
  { id: 'Q4', label: 'Q4 · Jan–Mar', months: [10, 11, 12], dueDate: '2025-01-10', pct: 20 },
];

export interface FeeStructure {
  id: string;
  classLevel: number;
  version: number;
  status: 'Draft' | 'Published' | 'Superseded';
  effectiveFrom: string;
  /** Annual amount per head */
  amounts: Record<string, number>;
}

export const INITIAL_STRUCTURES: FeeStructure[] = [
  { id: 'FS-8-v1', classLevel: 8, version: 1, status: 'Published', effectiveFrom: '2024-04-01', amounts: { TUI: 84000, DEV: 6000, LAB: 0, TRN: 18000, OLY: 5000, CAU: 10000 } },
  { id: 'FS-9-v1', classLevel: 9, version: 1, status: 'Published', effectiveFrom: '2024-04-01', amounts: { TUI: 92000, DEV: 6000, LAB: 4000, TRN: 18000, OLY: 5000, CAU: 10000 } },
  { id: 'FS-10-v1', classLevel: 10, version: 1, status: 'Published', effectiveFrom: '2024-04-01', amounts: { TUI: 98000, DEV: 6000, LAB: 5000, TRN: 18000, OLY: 5000, CAU: 10000 } },
];

/** The published structure in force for a class on a date (FEE-005). */
export const structureFor = (structures: FeeStructure[], classLevel: number, onDate: string) =>
  structures
    .filter(s => s.classLevel === classLevel && s.status !== 'Draft' && s.effectiveFrom <= onDate)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom) || b.version - a.version)[0];

/** FEE-005: copy the current structure into a new draft version. */
export const reviseStructure = (structures: FeeStructure[], classLevel: number, effectiveFrom: string): FeeStructure[] => {
  const current = structures.filter(s => s.classLevel === classLevel).sort((a, b) => b.version - a.version)[0];
  if (structures.some(s => s.classLevel === classLevel && s.status === 'Draft')) return structures;
  return [...structures, { ...current, id: `FS-${classLevel}-v${current.version + 1}`, version: current.version + 1, status: 'Draft', effectiveFrom, amounts: { ...current.amounts } }];
};

/** Publishing makes a draft effective; published versions are never edited. */
export const publishStructure = (structures: FeeStructure[], id: string): FeeStructure[] => {
  const draft = structures.find(s => s.id === id);
  if (!draft || draft.status !== 'Draft') return structures;
  return structures.map(s => (s.id === id ? { ...s, status: 'Published' } : s));
};

// ---------------------------------------------------------------------------
// Opt-ins, joining month, concessions (FEE-006, FEE-007, FEE-009 – FEE-012)
// ---------------------------------------------------------------------------

/** Optional heads each student has opted into. Transport follows the student's route allocation. */
export const optInsFor = (s: RosterStudent, extra: Record<string, string[]>) => [
  ...(s.transportRoute ? ['TRN'] : []),
  ...(extra[s.id] ?? []),
];

export const INITIAL_OPT_INS: Record<string, string[]> = {
  'ros-01': ['OLY'],
  'ros-02': ['OLY'],
  'ros-09': ['OLY'],
};

/** Academic month the student joined (April = 1). Students not listed joined in April. */
export const JOINING_MONTH: Record<string, number> = { 'ros-18': 5 };

export type ConcessionType = 'Sibling' | 'Staff ward' | 'Merit' | 'RTE' | 'Hardship';

export const CONCESSION_TYPES: { type: ConcessionType; pct: number; needsDocument: boolean }[] = [
  { type: 'Sibling', pct: 10, needsDocument: false },
  { type: 'Staff ward', pct: 50, needsDocument: true },
  { type: 'Merit', pct: 25, needsDocument: true },
  { type: 'RTE', pct: 100, needsDocument: true },
  { type: 'Hardship', pct: 30, needsDocument: true },
];

export interface Concession {
  id: string;
  studentId: string;
  type: ConcessionType;
  pct: number;
  reason: string;
  requestedBy: string;
  requestedOn: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  decidedBy?: string;
  scholarship?: { scheme: string; sanctionNo: string };
}

export const INITIAL_CONCESSIONS: Concession[] = [
  { id: 'CON-0001', studentId: 'ros-07', type: 'Sibling', pct: 10, reason: 'Twin enrolled (Kavya R. Selvan)', requestedBy: 'Mrs. Lakshmi Narayanan', requestedOn: '2024-03-20', status: 'Approved', decidedBy: 'Dr. Arvind Swaminathan' },
  { id: 'CON-0002', studentId: 'ros-06', type: 'RTE', pct: 100, reason: 'RTE 12(1)(c) seat', requestedBy: 'Mrs. Lakshmi Narayanan', requestedOn: '2024-03-20', status: 'Approved', decidedBy: 'Dr. Arvind Swaminathan', scholarship: { scheme: 'RTE reimbursement (State)', sanctionNo: 'TN-RTE-24-11820' } },
  { id: 'CON-0003', studentId: 'ros-13', type: 'Hardship', pct: 30, reason: 'Loss of parental income', requestedBy: 'Mrs. Lakshmi Narayanan', requestedOn: '2024-09-10', status: 'Pending' },
  { id: 'CON-0004', studentId: 'ros-11', type: 'Merit', pct: 25, reason: 'State rank in NTSE stage 1', requestedBy: 'Mrs. Lakshmi Narayanan', requestedOn: '2024-09-12', status: 'Pending' },
];

/** Approved concession percentage for a student on a date (highest applicable, not stacked). */
export const concessionPct = (concessions: Concession[], studentId: string, onDate: string) =>
  concessions.filter(c => c.studentId === studentId && c.status === 'Approved' && c.requestedOn <= onDate).reduce((m, c) => Math.max(m, c.pct), 0);

// ---------------------------------------------------------------------------
// Demand generation & invoices (FEE-013, FEE-014, FEE-041)
// ---------------------------------------------------------------------------

export interface InvoiceLine {
  head: string;
  gross: number;
  concession: number;
  gst: number;
  net: number;
}

export interface Invoice {
  invoiceNo: string;
  studentId: string;
  instalment: string;
  dueDate: string;
  generatedOn: string;
  structureId: string;
  lines: InvoiceLine[];
  /** Extra charge invoices (for example a bounced cheque) carry a note */
  note?: string;
}

export const invoiceTotal = (inv: Invoice) => inv.lines.reduce((s, l) => s + l.net, 0);

const splitInstalment = (annual: number, instalmentIdx: number) => {
  // 40/20/20/20 split; the last instalment absorbs rounding so the year always sums to the annual amount
  const shares = SCHEDULE.map(i => Math.floor((annual * i.pct) / 100));
  shares[shares.length - 1] = annual - shares.slice(0, -1).reduce((s, v) => s + v, 0);
  return shares[instalmentIdx];
};

/** FEE-007: bill only the months of the instalment on or after the joining month. */
export const prorationFactor = (instalment: Instalment, joiningMonth: number) => {
  const billable = instalment.months.filter(m => m >= joiningMonth).length;
  return billable / instalment.months.length;
};

export const buildLines = (
  student: RosterStudent,
  structure: FeeStructure,
  instalmentId: string,
  optIns: string[],
  concessionPercent: number
): InvoiceLine[] => {
  const idx = SCHEDULE.findIndex(i => i.id === instalmentId);
  const instalment = SCHEDULE[idx];
  const joining = JOINING_MONTH[student.id] ?? 1;
  const factor = prorationFactor(instalment, joining);
  if (factor === 0) return [];
  // Annual heads are billed once, in the first instalment the student is billed for
  const firstBilledIdx = SCHEDULE.findIndex(i => i.months.some(m => m >= joining));
  return FEE_HEADS.filter(h => h.frequency !== 'One-time')
    .filter(h => !h.optional || optIns.includes(h.code))
    .map(h => {
      const annual = structure.amounts[h.code] ?? 0;
      let gross = 0;
      if (h.frequency === 'Instalment') gross = Math.round(splitInstalment(annual, idx) * factor);
      else if (idx === firstBilledIdx) gross = annual;
      const concession = h.concessionEligible ? Math.round((gross * concessionPercent) / 100) : 0;
      const taxable = gross - concession;
      const gst = Math.round((taxable * h.gstRate) / 100);
      return { head: h.code, gross, concession, gst, net: taxable + gst };
    })
    .filter(l => l.gross > 0);
};

export const invoiceNoFor = (instalmentId: string, seq: number) => `INV-2425-${instalmentId}-${String(seq).padStart(4, '0')}`;

/** FEE-013: generate one invoice per billable student; students already billed for the instalment are skipped. */
export const generateDemand = (
  students: RosterStudent[],
  structures: FeeStructure[],
  concessions: Concession[],
  optIns: Record<string, string[]>,
  existing: Invoice[],
  instalmentId: string,
  generatedOn: string
) => {
  const instalment = SCHEDULE.find(i => i.id === instalmentId)!;
  const created: Invoice[] = [];
  const skipped: { studentId: string; reason: string }[] = [];
  let seq = existing.filter(i => i.instalment === instalmentId).length;
  students
    .filter(s => !s.mergedInto)
    .forEach(s => {
      if (!['Active', 'On leave', 'Suspended'].includes(s.status)) return skipped.push({ studentId: s.id, reason: `Status ${s.status}` });
      if (existing.some(i => i.studentId === s.id && i.instalment === instalmentId)) return skipped.push({ studentId: s.id, reason: 'Already billed' });
      const structure = structureFor(structures, s.classLevel, instalment.dueDate);
      if (!structure) return skipped.push({ studentId: s.id, reason: `No published structure for Class ${s.classLevel}` });
      const lines = buildLines(s, structure, instalmentId, optInsFor(s, optIns), concessionPct(concessions, s.id, generatedOn));
      if (!lines.length) return skipped.push({ studentId: s.id, reason: 'Joined after this instalment' });
      seq += 1;
      created.push({ invoiceNo: invoiceNoFor(instalmentId, seq), studentId: s.id, instalment: instalmentId, dueDate: instalment.dueDate, generatedOn, structureId: structure.id, lines });
    });
  return { created, skipped };
};

// ---------------------------------------------------------------------------
// Late fee (FEE-008)
// ---------------------------------------------------------------------------

export interface LateFeeRule {
  graceDays: number;
  perDay: number;
  cap: number;
}

export const DEFAULT_LATE_FEE: LateFeeRule = { graceDays: 10, perDay: 50, cap: 1000 };

export const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

export const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const lateFeeOn = (dueDate: string, onDate: string, rule: LateFeeRule) => {
  const lateDays = daysBetween(dueDate, onDate) - rule.graceDays;
  return lateDays > 0 ? Math.min(rule.cap, lateDays * rule.perDay) : 0;
};

// ---------------------------------------------------------------------------
// Payments (FEE-015, FEE-017, FEE-018, FEE-020 – FEE-023)
// ---------------------------------------------------------------------------

export type PaymentMode = 'Cash' | 'Cheque' | 'DD' | 'Card' | 'Online' | 'Credit transfer';

export interface Payment {
  id: string;
  receiptNo?: string;
  studentId: string;
  date: string;
  mode: PaymentMode;
  amount: number;
  collectedBy: string;
  reference?: string;
  status: 'Success' | 'Pending' | 'Failed' | 'Cancelled';
  cancelReason?: string;
  cheque?: { number: string; bank: string; status: 'Received' | 'Deposited' | 'Cleared' | 'Bounced' };
  gatewayRef?: string;
}

/** Money that counts towards dues: successful, not cancelled, and not a bounced cheque. */
export const isEffective = (p: Payment) => p.status === 'Success' && p.cheque?.status !== 'Bounced';

export const nextReceiptNo = (payments: Payment[]) => {
  const max = payments.reduce((m, p) => (p.receiptNo ? Math.max(m, Number(p.receiptNo.slice(-5))) : m), 0);
  return `RCT-2425-${String(max + 1).padStart(5, '0')}`;
};

// ---------------------------------------------------------------------------
// Ledger: allocation, late fee, advance credit (FEE-019, FEE-023, FEE-028)
// ---------------------------------------------------------------------------

export interface Allocation {
  paymentId: string;
  invoiceNo: string;
  head: string;
  amount: number;
  date: string;
}

export interface InvoiceState {
  invoice: Invoice;
  principal: number;
  principalPaid: number;
  lateFee: number;
  lateFeePaid: number;
  balance: number;
  clearedOn?: string;
  daysOverdue: number;
}

export interface Adjustment {
  id: string;
  studentId: string;
  date: string;
  amount: number;
  kind: 'Refund' | 'Transfer out' | 'Transfer in';
  note: string;
}

export interface Ledger {
  invoices: InvoiceState[];
  allocations: Allocation[];
  credit: Record<string, number>;
}

/**
 * Allocation rule: payments are applied in date order to the oldest due invoice first;
 * within an invoice, heads settle in priority order and the late fee settles last,
 * valued on the day the principal is cleared. Anything left over becomes advance credit,
 * which is applied to invoices raised later.
 */
export const computeLedger = (invoices: Invoice[], payments: Payment[], adjustments: Adjustment[], rule: LateFeeRule, asOf: string): Ledger => {
  const allocations: Allocation[] = [];
  const credit: Record<string, number> = {};
  const states: InvoiceState[] = [];
  const studentIds = Array.from(new Set([...invoices.map(i => i.studentId), ...payments.map(p => p.studentId), ...adjustments.map(a => a.studentId)]));

  studentIds.forEach(studentId => {
    const invs = invoices
      .filter(i => i.studentId === studentId)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.invoiceNo.localeCompare(b.invoiceNo))
      .map(invoice => ({
        invoice,
        remaining: Object.fromEntries(
          [...invoice.lines].sort((a, b) => headByCode(a.head).priority - headByCode(b.head).priority).map(l => [l.head, l.net])
        ) as Record<string, number>,
        lateFeePaid: 0,
        clearedOn: undefined as string | undefined,
      }));

    // Credit movements and payments, in date order; adjustments reduce credit
    const events = [
      ...payments.filter(p => p.studentId === studentId && isEffective(p)).map(p => ({ date: p.date, key: p.id, amount: p.amount, paymentId: p.id })),
      ...adjustments
        .filter(a => a.studentId === studentId)
        .map(a => ({ date: a.date, key: a.id, amount: a.kind === 'Transfer in' ? a.amount : -a.amount, paymentId: a.id })),
    ].sort((a, b) => a.date.localeCompare(b.date) || a.key.localeCompare(b.key));

    let pool = 0;
    const settle = (date: string, sourceId: string) => {
      for (const s of invs) {
        if (pool <= 0) break;
        if (s.invoice.generatedOn > date && s.invoice.dueDate > date) continue;
        for (const head of Object.keys(s.remaining)) {
          if (pool <= 0) break;
          const take = Math.min(pool, s.remaining[head]);
          if (take > 0) {
            s.remaining[head] -= take;
            pool -= take;
            allocations.push({ paymentId: sourceId, invoiceNo: s.invoice.invoiceNo, head, amount: take, date });
          }
        }
        const principalLeft = Object.values(s.remaining).reduce((a, b) => a + b, 0);
        if (principalLeft === 0) {
          s.clearedOn = s.clearedOn ?? date;
          const due = lateFeeOn(s.invoice.dueDate, s.clearedOn, rule) - s.lateFeePaid;
          const take = Math.min(pool, due);
          if (take > 0) {
            s.lateFeePaid += take;
            pool -= take;
            allocations.push({ paymentId: sourceId, invoiceNo: s.invoice.invoiceNo, head: 'LATE', amount: take, date });
          }
        }
      }
    };

    events.forEach(e => {
      pool += e.amount;
      settle(e.date, e.paymentId);
    });
    // Advance credit carried to invoices raised after the payment
    const lastDate = invs.reduce((d, s) => (s.invoice.generatedOn > d ? s.invoice.generatedOn : d), '');
    if (pool > 0 && lastDate) settle(lastDate > asOf ? asOf : lastDate, 'CREDIT');
    credit[studentId] = pool;

    invs.forEach(s => {
      const principal = invoiceTotal(s.invoice);
      const principalLeft = Object.values(s.remaining).reduce((a, b) => a + b, 0);
      const lateFee = lateFeeOn(s.invoice.dueDate, principalLeft === 0 ? s.clearedOn! : asOf, rule);
      const balance = principalLeft + lateFee - s.lateFeePaid;
      states.push({
        invoice: s.invoice,
        principal,
        principalPaid: principal - principalLeft,
        lateFee,
        lateFeePaid: s.lateFeePaid,
        balance,
        clearedOn: balance === 0 ? s.clearedOn : undefined,
        daysOverdue: balance > 0 ? Math.max(0, daysBetween(s.invoice.dueDate, asOf)) : 0,
      });
    });
  });
  return { invoices: states, allocations, credit };
};

// ---------------------------------------------------------------------------
// Outstanding, defaulters, reminders, payment plans (FEE-028 – FEE-032)
// ---------------------------------------------------------------------------

export const AGEING_BUCKETS = [
  { label: 'Not yet due', min: -Infinity, max: 0 },
  { label: '1–30 days', min: 1, max: 30 },
  { label: '31–60 days', min: 31, max: 60 },
  { label: '61–90 days', min: 61, max: 90 },
  { label: '90+ days', min: 91, max: Infinity },
];

export const ageingBucket = (daysOverdue: number) => AGEING_BUCKETS.find(b => daysOverdue >= b.min && daysOverdue <= b.max)!.label;

export interface PaymentPlan {
  id: string;
  studentId: string;
  total: number;
  parts: { dueDate: string; amount: number }[];
  createdOn: string;
  status: 'Active' | 'Completed' | 'Cancelled';
}

/** FEE-032: split an amount into monthly parts; the last part absorbs rounding. */
export const buildPlan = (total: number, parts: number, firstDue: string) => {
  const each = Math.floor(total / parts);
  return Array.from({ length: parts }, (_, i) => {
    const d = new Date(`${firstDue}T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() + i);
    return { dueDate: d.toISOString().slice(0, 10), amount: i === parts - 1 ? total - each * (parts - 1) : each };
  });
};

export const REMINDER_OFFSETS = [
  { offset: -3, label: 'Due in 3 days' },
  { offset: 0, label: 'Due today' },
  { offset: 7, label: '7 days overdue' },
  { offset: 15, label: '15 days overdue — final notice' },
];

export interface ReminderLine {
  studentId: string;
  invoiceNo: string;
  label: string;
  sendOn: string;
  balance: number;
  suppressed?: string;
}

/** FEE-030 / FEE-031: reminders scheduled for a date, with the suppression reason if any. */
export const remindersFor = (
  ledger: Ledger,
  onDate: string,
  plans: PaymentPlan[],
  concessions: Concession[],
  doNotRemind: Record<string, string>
): ReminderLine[] =>
  ledger.invoices
    .filter(s => s.balance > 0)
    .flatMap(s =>
      REMINDER_OFFSETS.map(r => ({ r, sendOn: addDays(s.invoice.dueDate, r.offset) }))
        .filter(x => x.sendOn === onDate)
        .map(({ r, sendOn }) => {
          const sid = s.invoice.studentId;
          let suppressed: string | undefined;
          if (doNotRemind[sid]) suppressed = doNotRemind[sid];
          else if (plans.some(p => p.studentId === sid && p.status === 'Active')) suppressed = 'On an active payment plan';
          else if (concessions.some(c => c.studentId === sid && c.status === 'Pending')) suppressed = 'Concession decision pending';
          return { studentId: sid, invoiceNo: s.invoice.invoiceNo, label: r.label, sendOn, balance: s.balance, suppressed };
        })
    );

// ---------------------------------------------------------------------------
// Reconciliation (FEE-033 – FEE-035)
// ---------------------------------------------------------------------------

export interface SettlementLine {
  gatewayRef: string;
  gross: number;
  fee: number;
  settledOn: string;
  utr: string;
}

export type ReconStatus = 'Matched' | 'Amount mismatch' | 'Not settled' | 'No matching payment';

export const reconcileGateway = (payments: Payment[], settlement: SettlementLine[]) => {
  const online = payments.filter(p => p.mode === 'Online' && p.status === 'Success' && p.gatewayRef);
  const rows: { gatewayRef: string; payment?: Payment; line?: SettlementLine; status: ReconStatus }[] = [];
  online.forEach(p => {
    const line = settlement.find(l => l.gatewayRef === p.gatewayRef);
    rows.push({ gatewayRef: p.gatewayRef!, payment: p, line, status: !line ? 'Not settled' : line.gross === p.amount ? 'Matched' : 'Amount mismatch' });
  });
  settlement.filter(l => !online.some(p => p.gatewayRef === l.gatewayRef)).forEach(l => rows.push({ gatewayRef: l.gatewayRef, line: l, status: 'No matching payment' }));
  return rows.sort((a, b) => a.gatewayRef.localeCompare(b.gatewayRef));
};

export interface BankLine {
  id: string;
  date: string;
  narration: string;
  credit: number;
  debit: number;
}

export interface ExpectedDeposit {
  key: string;
  label: string;
  amount: number;
  date: string;
  match: string;
}

/** Deposits the school expects to see on the bank statement. */
export const expectedDeposits = (payments: Payment[], settlement: SettlementLine[]): ExpectedDeposit[] => {
  const cashDays = new Map<string, number>();
  payments.filter(p => p.mode === 'Cash' && p.status === 'Success').forEach(p => cashDays.set(p.date, (cashDays.get(p.date) ?? 0) + p.amount));
  const utrs = new Map<string, { amount: number; date: string }>();
  settlement.forEach(l => {
    const cur = utrs.get(l.utr) ?? { amount: 0, date: l.settledOn };
    utrs.set(l.utr, { amount: cur.amount + l.gross - l.fee, date: l.settledOn });
  });
  return [
    ...[...cashDays.entries()].map(([date, amount]) => ({ key: `CASH-${date}`, label: `Cash deposit for ${date}`, amount, date, match: `CASH ${date}` })),
    ...payments
      .filter(p => p.cheque && p.cheque.status !== 'Received' && p.status !== 'Cancelled')
      .map(p => ({
        key: `CHQ-${p.cheque!.number}`,
        label: `Cheque ${p.cheque!.number} (${p.cheque!.bank})${p.cheque!.status === 'Bounced' ? ' — bounced, nets to zero' : ''}`,
        amount: p.cheque!.status === 'Bounced' ? 0 : p.amount,
        date: p.date,
        match: `CHQ ${p.cheque!.number}`,
      })),
    ...[...utrs.entries()].map(([utr, v]) => ({ key: `UTR-${utr}`, label: `Gateway settlement ${utr}`, amount: v.amount, date: v.date, match: utr })),
  ].sort((a, b) => a.key.localeCompare(b.key));
};

export const reconcileBank = (expected: ExpectedDeposit[], statement: BankLine[]) => {
  const used = new Set<string>();
  // All statement lines carrying the reference are netted, so a deposit and its return cancel out
  const rows = expected.map(e => {
    const lines = statement.filter(l => !used.has(l.id) && l.narration.includes(e.match));
    lines.forEach(l => used.add(l.id));
    const net = lines.reduce((sum, l) => sum + l.credit - l.debit, 0);
    const status: ReconStatus = !lines.length ? 'Not settled' : net === e.amount ? 'Matched' : 'Amount mismatch';
    return { key: e.key, expected: e, lines, net, status };
  });
  const unmatched = statement
    .filter(l => !used.has(l.id))
    .map(l => ({ key: l.id, expected: undefined as ExpectedDeposit | undefined, lines: [l], net: l.credit - l.debit, status: 'No matching payment' as ReconStatus }));
  return [...rows, ...unmatched];
};

// ---------------------------------------------------------------------------
// Reporting helpers (FEE-036 – FEE-042)
// ---------------------------------------------------------------------------

/** FEE-026: deterministic payment-link token. */
export const linkToken = (invoiceNo: string) => {
  let h = 5381;
  for (const ch of invoiceNo) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0;
  return h.toString(36).toUpperCase().padStart(7, '0');
};

export const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export const studentsForFees = () => INITIAL_ROSTER;

// ---------------------------------------------------------------------------
// Seed data — derived from the rules above so every figure is consistent
// ---------------------------------------------------------------------------

const q1 = generateDemand(INITIAL_ROSTER, INITIAL_STRUCTURES, INITIAL_CONCESSIONS, INITIAL_OPT_INS, [], 'Q1', '2024-03-25').created;
const q2 = generateDemand(INITIAL_ROSTER, INITIAL_STRUCTURES, INITIAL_CONCESSIONS, INITIAL_OPT_INS, q1, 'Q2', '2024-06-25').created;
export const INITIAL_INVOICES: Invoice[] = [...q1, ...q2];

const due = (studentId: string, instalment: string) => {
  const inv = INITIAL_INVOICES.find(i => i.studentId === studentId && i.instalment === instalment);
  return inv ? invoiceTotal(inv) : 0;
};

const COUNTER = 'Mrs. Lakshmi Narayanan (Accounts)';
/** Counter cashier who covered the April rush (before the current accountant took over the counter). */
const CASHIER = 'Mr. Ravi Kumar (Cashier)';
const GATEWAY = 'Payment gateway';

type SeedPayment = Omit<Payment, 'id' | 'receiptNo'>;
const seedPayments: SeedPayment[] = [];
const add = (p: SeedPayment) => {
  if (p.amount > 0) seedPayments.push(p);
};

// Q1 — most paid on time
INITIAL_ROSTER.filter(s => due(s.id, 'Q1') > 0).forEach((s, i) => {
  if (s.id === 'ros-13') return; // never paid
  if (s.id === 'ros-03') return add({ studentId: s.id, date: '2024-04-25', mode: 'Cash', amount: due(s.id, 'Q1') + lateFeeOn('2024-04-10', '2024-04-25', DEFAULT_LATE_FEE), collectedBy: CASHIER, status: 'Success' });
  if (s.id === 'ros-10') return add({ studentId: s.id, date: '2024-04-08', mode: 'Cash', amount: Math.round(due(s.id, 'Q1') / 2), collectedBy: CASHIER, status: 'Success' });
  const online = i % 2 === 0;
  add({
    studentId: s.id,
    date: `2024-04-0${(i % 8) + 1}`,
    mode: online ? 'Online' : 'Cash',
    amount: due(s.id, 'Q1'),
    collectedBy: online ? GATEWAY : COUNTER,
    status: 'Success',
    gatewayRef: online ? `pay_Q1${String(i).padStart(3, '0')}` : undefined,
  });
});

// Q2 — a mix of on-time, cheque, pending, advance and unpaid
const Q2_UNPAID = ['ros-05', 'ros-10', 'ros-13', 'ros-14'];
INITIAL_ROSTER.filter(s => due(s.id, 'Q2') > 0 && !Q2_UNPAID.includes(s.id)).forEach((s, i) => {
  const amount = due(s.id, 'Q2');
  if (s.id === 'ros-01') return add({ studentId: s.id, date: '2024-07-05', mode: 'Online', amount: amount + 5000, collectedBy: GATEWAY, status: 'Success', gatewayRef: 'pay_Q2ADV01' });
  if (s.id === 'ros-02') return add({ studentId: s.id, date: '2024-07-08', mode: 'Cheque', amount, collectedBy: COUNTER, status: 'Success', cheque: { number: '004512', bank: 'Indian Bank', status: 'Bounced' } });
  if (s.id === 'ros-09') return add({ studentId: s.id, date: '2024-09-12', mode: 'Cheque', amount, collectedBy: COUNTER, status: 'Success', cheque: { number: '118830', bank: 'HDFC Bank', status: 'Deposited' } });
  if (s.id === 'ros-12') return add({ studentId: s.id, date: '2024-09-15', mode: 'Online', amount, collectedBy: GATEWAY, status: 'Pending', gatewayRef: 'pay_Q2PEND12' });
  if (s.id === 'ros-18') return add({ studentId: s.id, date: '2024-08-02', mode: 'DD', amount, collectedBy: COUNTER, status: 'Success', reference: 'DD 772104 SBI' });
  const online = i % 2 === 1;
  add({
    studentId: s.id,
    date: `2024-07-0${(i % 8) + 1}`,
    mode: online ? 'Online' : 'Card',
    amount,
    collectedBy: online ? GATEWAY : COUNTER,
    status: 'Success',
    gatewayRef: online ? `pay_Q2${String(i).padStart(3, '0')}` : undefined,
    reference: online ? undefined : `POS ${String(40000 + i * 7)}`,
  });
});

export const INITIAL_PAYMENTS: Payment[] = seedPayments
  .sort((a, b) => a.date.localeCompare(b.date) || a.studentId.localeCompare(b.studentId))
  .map((p, i) => ({
    ...p,
    id: `PAY-${String(i + 1).padStart(4, '0')}`,
    receiptNo: p.status === 'Success' ? `RCT-2425-${String(i + 1).padStart(5, '0')}` : undefined,
  }));

/** Gateway settlement file: T+2 settlement, 1.8% fee; one short-settled and one unknown transaction. */
export const INITIAL_SETTLEMENT: SettlementLine[] = [
  ...INITIAL_PAYMENTS.filter(p => p.mode === 'Online' && p.status === 'Success').map((p, i) => ({
    gatewayRef: p.gatewayRef!,
    gross: p.gatewayRef === 'pay_Q2ADV01' ? p.amount - 5000 : p.amount,
    fee: Math.round(p.amount * 0.018),
    settledOn: addDays(p.date, 2),
    utr: `UTR${p.date.slice(5, 7)}${String(Math.floor(i / 3)).padStart(3, '0')}`,
  })),
  { gatewayRef: 'pay_UNKNOWN77', gross: 1200, fee: 22, settledOn: '2024-07-09', utr: 'UTR07999' },
];

/** Bank statement: built from expected deposits, with one cash day missing and one fee short-credit. */
export const INITIAL_BANK_STATEMENT: BankLine[] = (() => {
  const exp = expectedDeposits(INITIAL_PAYMENTS, INITIAL_SETTLEMENT);
  const lines: BankLine[] = [];
  exp.forEach((e, i) => {
    if (e.key === 'CASH-2024-04-25') return;
    if (e.key.startsWith('CHQ-') && INITIAL_PAYMENTS.find(p => `CHQ-${p.cheque?.number}` === e.key)?.cheque?.status === 'Deposited') return;
    const bounced = e.key.startsWith('CHQ-') && INITIAL_PAYMENTS.find(p => `CHQ-${p.cheque?.number}` === e.key)?.cheque?.status === 'Bounced';
    lines.push({ id: `BNK-${String(i + 1).padStart(3, '0')}`, date: e.date, narration: `${e.match} CR`, credit: e.amount, debit: 0 });
    if (bounced) lines.push({ id: `BNK-${String(i + 1).padStart(3, '0')}R`, date: addDays(e.date, 3), narration: `${e.match} RETURN`, credit: 0, debit: e.amount });
  });
  lines.push({ id: 'BNK-900', date: '2024-08-30', narration: 'NEFT DONATION ALUMNI ASSOC', credit: 25000, debit: 0 });
  return lines.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
})();

/** Guardians who asked not to be chased (FEE-031). */
export const INITIAL_DO_NOT_REMIND: Record<string, string> = { 'ros-05': 'Medical leave — family request' };

/** Collection targets per instalment, in rupees (FEE-037). */
export const COLLECTION_TARGET_PCT = 95;
