import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FeatureTags, PhaseNotice, downloadCsv } from '../../components/common/FeatureTags';
import { PrintPortal } from '../../components/common/PrintPortal';
import { DensityToggle } from '../../components/common/ui';
import { Figure, Money } from '../../components/common/Figure';
import { useSessionState } from '../../lib/sessionState';
import { useGrants } from '../../hooks/useGrants';
import { CONCESSION_APPROVAL_THRESHOLD_PCT, GRANT_ROLE_LABEL, Verb } from '../../data/permissions';
import { INITIAL_ROSTER, RosterStudent, matchesSearch } from '../../data/students';
import {
  ACADEMIC_YEAR,
  AGEING_BUCKETS,
  Adjustment,
  CHEQUE_BOUNCE_CHARGE,
  CONCESSION_TYPES,
  COLLECTION_TARGET_PCT,
  Concession,
  ConcessionType,
  DEFAULT_LATE_FEE,
  FEES_AS_OF,
  FEE_HEADS,
  FeeStructure,
  INITIAL_BANK_STATEMENT,
  INITIAL_CONCESSIONS,
  INITIAL_DO_NOT_REMIND,
  INITIAL_INVOICES,
  INITIAL_OPT_INS,
  INITIAL_PAYMENTS,
  INITIAL_SETTLEMENT,
  INITIAL_STRUCTURES,
  Invoice,
  InvoiceState,
  JOINING_MONTH,
  LateFeeRule,
  Payment,
  PaymentMode,
  PaymentPlan,
  SCHEDULE,
  addDays,
  ageingBucket,
  buildPlan,
  computeLedger,
  expectedDeposits,
  generateDemand,
  headByCode,
  inr,
  invoiceTotal,
  linkToken,
  nextReceiptNo,
  prorationFactor,
  publishStructure,
  reconcileBank,
  reconcileGateway,
  remindersFor,
  reviseStructure,
} from '../../data/fees';
import { EmptyNote } from '../../components/common/EmptyNote';

type Tab = 'collect' | 'receipts' | 'structure' | 'concessions' | 'demands' | 'dues' | 'recon' | 'reports';

const TABS: { id: Tab; label: string; icon: string; ids: string[] }[] = [
  { id: 'collect', label: 'Collect', icon: 'point_of_sale', ids: ['FEE-014', 'FEE-015', 'FEE-017', 'FEE-018', 'FEE-019', 'FEE-020', 'FEE-023', 'FEE-024', 'FEE-025', 'FEE-026'] },
  { id: 'receipts', label: 'Receipts & Cheques', icon: 'receipt_long', ids: ['FEE-020', 'FEE-021', 'FEE-022'] },
  { id: 'structure', label: 'Structure & Rules', icon: 'account_tree', ids: ['FEE-001', 'FEE-002', 'FEE-003', 'FEE-004', 'FEE-005', 'FEE-006', 'FEE-007', 'FEE-008', 'FEE-041'] },
  { id: 'concessions', label: 'Concessions', icon: 'volunteer_activism', ids: ['FEE-009', 'FEE-010', 'FEE-011', 'FEE-012'] },
  { id: 'demands', label: 'Demands', icon: 'request_quote', ids: ['FEE-013', 'FEE-014'] },
  { id: 'dues', label: 'Dues & Reminders', icon: 'notifications_active', ids: ['FEE-028', 'FEE-029', 'FEE-030', 'FEE-031', 'FEE-032'] },
  { id: 'recon', label: 'Reconciliation', icon: 'compare_arrows', ids: ['FEE-033', 'FEE-034', 'FEE-035'] },
  { id: 'reports', label: 'Reports', icon: 'summarize', ids: ['FEE-036', 'FEE-037', 'FEE-038', 'FEE-039', 'FEE-040', 'FEE-041', 'FEE-042'] },
];

const COUNTER_MODES: PaymentMode[] = ['Cash', 'Cheque', 'DD', 'Card'];
const RECON_STYLE: Record<string, string> = {
  Matched: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Amount mismatch': 'bg-amber-50 text-amber-700 border-amber-200',
  'Not settled': 'bg-amber-50 text-amber-700 border-amber-200',
  'No matching payment': 'bg-rose-50 text-rose-700 border-rose-200',
};

const fmt = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const inputCls = 'text-xs border border-line rounded-lg px-2 py-1.5 bg-white';
const btn = 'text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40';
const btnPrimary = `${btn} bg-brand text-white hover:bg-brand-strong`;
const btnSoft = `${btn} bg-slate-100 hover:bg-slate-200 text-ink`;
const btnDanger = `${btn} bg-rose-600 text-white hover:bg-rose-700`;

const Badge: React.FC<{ className: string; children: React.ReactNode }> = ({ className, children }) => (
  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${className}`}>{children}</span>
);

const Panel: React.FC<{ title: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, actions, children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-line-soft shadow-xs overflow-hidden ${className}`}>
    <div className="p-3 bg-subtle border-b border-line flex flex-wrap items-center justify-between gap-2">
      <span className="text-xs font-bold text-ink">{title}</span>
      {actions}
    </div>
    {children}
  </div>
);

const Th: React.FC<{ children?: React.ReactNode; right?: boolean }> = ({ children, right }) => (
  <th className={`cell font-semibold whitespace-nowrap ${right ? 'text-right' : 'text-left'}`}>{children}</th>
);


interface RefundRequest {
  id: string;
  studentId: string;
  amount: number;
  reason: string;
  requestedBy: string;
  status: 'Pending' | 'Paid' | 'Rejected';
}

interface AuditLine {
  at: string;
  actor: string;
  action: string;
  detail: string;
}

export const FeesDeskView: React.FC<{ initialTab?: Tab }> = ({ initialTab = 'collect' }) => {
  const { addToast, currentUser, selectedCampus } = useApp();
  const asOf = FEES_AS_OF;
  const me = currentUser.name;
  /** Records keep a desk suffix, e.g. "Mrs. Lakshmi Narayanan (Accounts)" — it is still the same person. */
  const isMe = (name: string) => name.replace(/\s*\([^)]*\)\s*$/, '') === me;
  const students = INITIAL_ROSTER;

  const [tab, setTab] = useState<Tab>(initialTab);
  const [invoices, setInvoices] = useSessionState<Invoice[]>('fees.invoices', INITIAL_INVOICES);
  const [payments, setPayments] = useSessionState<Payment[]>('fees.payments', INITIAL_PAYMENTS);
  const [adjustments, setAdjustments] = useSessionState<Adjustment[]>('fees.adjustments', []);
  const [structures, setStructures] = useSessionState<FeeStructure[]>('fees.structures', INITIAL_STRUCTURES);
  const [concessions, setConcessions] = useSessionState<Concession[]>('fees.concessions', INITIAL_CONCESSIONS);
  const [optIns, setOptIns] = useSessionState<Record<string, string[]>>('fees.optIns', INITIAL_OPT_INS);
  const [lateRule, setLateRule] = useSessionState<LateFeeRule>('fees.lateRule', DEFAULT_LATE_FEE);
  const [plans, setPlans] = useSessionState<PaymentPlan[]>('fees.plans', []);
  const [doNotRemind, setDoNotRemind] = useSessionState<Record<string, string>>('fees.doNotRemind', INITIAL_DO_NOT_REMIND);
  const [refunds, setRefunds] = useSessionState<RefundRequest[]>('fees.refunds', []);
  const [resolved, setResolved] = useSessionState<Record<string, string>>('fees.resolved', {});
  const [audit, setAudit] = useSessionState<AuditLine[]>('fees.audit', []);

  const [revisionRequests, setRevisionRequests] = useSessionState<Record<string, { by: string; on: string }>>('fees.revisionRequests', {});

  // Every action is checked against the signed-in role's grant for its feature (see Access Grants).
  const g = useGrants();
  const allowed = (id: string, verb: Verb) => {
    if (g.can(id, verb)) return true;
    addToast('Not permitted for your role', 'warning', g.why(id, verb));
    return false;
  };
  const changesAnything = TABS.some(t => t.ids.some(id => g.can(id, 'C') || g.can(id, 'U') || g.can(id, 'D')));
  const approvesAnything = TABS.some(t => t.ids.some(id => g.can(id, 'A')));
  const exportsAnything = TABS.some(t => t.ids.some(id => g.can(id, 'E')));

  const log = (action: string, detail: string) => setAudit(prev => [{ at: new Date().toLocaleString('en-IN'), actor: me, action, detail }, ...prev]);
  const student = (id: string) => students.find(s => s.id === id)!;
  const nameOf = (id: string) => student(id)?.name ?? id;

  const ledger = useMemo(() => computeLedger(invoices, payments, adjustments, lateRule, asOf), [invoices, payments, adjustments, lateRule, asOf]);
  const statesFor = (sid: string) => ledger.invoices.filter(s => s.invoice.studentId === sid).sort((a, b) => a.invoice.dueDate.localeCompare(b.invoice.dueDate));
  const balanceFor = (sid: string) => statesFor(sid).reduce((t, s) => t + s.balance, 0);
  const overdueFor = (sid: string) => statesFor(sid).filter(s => s.daysOverdue > 0).reduce((t, s) => t + s.balance, 0);

  // -------------------------------------------------------------------------
  // Collect
  // -------------------------------------------------------------------------
  const [search, setSearch] = useState('Harini');
  const [activeId, setActiveId] = useState('ros-11');
  const [mode, setMode] = useState<PaymentMode>('Cash');
  const [amount, setAmount] = useState('');
  const [chequeNo, setChequeNo] = useState('');
  const [chequeBank, setChequeBank] = useState('');
  const [reference, setReference] = useState('');
  const [receiptFor, setReceiptFor] = useState<Payment | null>(null);
  const [printReceipt, setPrintReceipt] = useState(false);
  const [link, setLink] = useState<{ url: string; expires: string } | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');

  const active = student(activeId);
  const activeStates = statesFor(activeId);
  const activeDue = balanceFor(activeId);
  const activeCredit = ledger.credit[activeId] ?? 0;
  const siblings = students.filter(s => s.id !== activeId && !s.mergedInto && s.guardianMobile === active.guardianMobile);
  const searchHits = students.filter(s => !s.mergedInto && matchesSearch(s, search)).slice(0, 8);

  const amountNum = Number(amount);
  const amountValid = amount.trim() !== '' && Number.isInteger(amountNum) && amountNum > 0;

  const preview = useMemo(() => {
    if (!amountValid) return null;
    const probe: Payment = { id: 'PAY-PREVIEW', studentId: activeId, date: asOf, mode, amount: amountNum, collectedBy: me, status: 'Success' };
    const l = computeLedger(invoices, [...payments, probe], adjustments, lateRule, asOf);
    const lines = l.allocations.filter(a => a.paymentId === 'PAY-PREVIEW');
    const advance = (l.credit[activeId] ?? 0) - activeCredit;
    return { lines, advance: Math.max(0, advance) };
  }, [amountValid, amountNum, activeId, mode, invoices, payments, adjustments, lateRule, asOf, me, activeCredit]);

  const collect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allowed('FEE-017', 'C')) return;
    if (!amountValid) {
      addToast('Enter a whole-rupee amount greater than zero', 'warning');
      return;
    }
    if ((mode === 'Cheque' || mode === 'DD') && (!chequeNo.trim() || !chequeBank.trim())) {
      addToast('Instrument number and bank are required', 'warning');
      return;
    }
    const payment: Payment = {
      id: `PAY-${String(payments.length + 1).padStart(4, '0')}`,
      receiptNo: nextReceiptNo(payments),
      studentId: activeId,
      date: asOf,
      mode,
      amount: amountNum,
      collectedBy: me,
      status: 'Success',
      reference: mode === 'Card' ? reference || undefined : mode === 'DD' ? `DD ${chequeNo} ${chequeBank}` : undefined,
      cheque: mode === 'Cheque' ? { number: chequeNo.trim(), bank: chequeBank.trim(), status: 'Received' } : undefined,
    };
    setPayments(prev => [...prev, payment]);
    log('Counter collection', `${payment.receiptNo} · ${nameOf(activeId)} · ${inr(amountNum)} ${mode}`);
    addToast(`Receipt ${payment.receiptNo} issued`, 'success', preview?.advance ? `${inr(preview.advance)} kept as advance credit` : undefined);
    setReceiptFor(payment);
    setAmount('');
    setChequeNo('');
    setChequeBank('');
    setReference('');
  };

  const startOnline = () => {
    if (!allowed('FEE-015', 'C')) return;
    const amt = activeDue;
    if (amt <= 0) {
      addToast('Nothing is due for this student', 'info');
      return;
    }
    const n = payments.length + 1;
    const payment: Payment = { id: `PAY-${String(n).padStart(4, '0')}`, studentId: activeId, date: asOf, mode: 'Online', amount: amt, collectedBy: 'Payment gateway', status: 'Pending', gatewayRef: `pay_LIVE${String(n).padStart(4, '0')}` };
    setPayments(prev => [...prev, payment]);
    addToast(`Online payment of ${inr(amt)} started`, 'info', `${payment.gatewayRef} awaiting gateway confirmation`);
  };

  const gatewayCallback = (p: Payment, ok: boolean) => {
    if (!allowed('FEE-015', 'C')) return;
    setPayments(prev => prev.map(x => (x.id === p.id ? { ...x, status: ok ? 'Success' : 'Failed', receiptNo: ok ? nextReceiptNo(prev) : undefined } : x)));
    log(`Gateway ${ok ? 'success' : 'failure'}`, `${p.gatewayRef} · ${inr(p.amount)}`);
    addToast(ok ? 'Payment confirmed by gateway — receipt issued' : 'Gateway reported a failure — nothing was collected', ok ? 'success' : 'warning');
  };

  const makeLink = () => {
    if (!allowed('FEE-026', 'C')) return;
    const open = activeStates.find(s => s.balance > 0);
    if (!open) {
      addToast('No open invoice to link', 'info');
      return;
    }
    const url = `https://pay.lumenacademy.edu.in/l/${linkToken(open.invoice.invoiceNo)}`;
    setLink({ url, expires: addDays(asOf, 7) });
    log('Payment link', `${open.invoice.invoiceNo} · ${url}`);
    addToast('Payment link created', 'success', `Valid until ${fmt(addDays(asOf, 7))}`);
  };

  const requestRefund = () => {
    if (!allowed('FEE-025', 'C')) return;
    const amt = Number(refundAmount);
    if (!Number.isInteger(amt) || amt <= 0 || amt > activeCredit) {
      addToast(`Refund must be between ₹1 and the credit of ${inr(activeCredit)}`, 'warning');
      return;
    }
    setRefunds(prev => [...prev, { id: `REF-${String(prev.length + 1).padStart(3, '0')}`, studentId: activeId, amount: amt, reason: 'Excess payment', requestedBy: me, status: 'Pending' }]);
    setRefundAmount('');
    addToast('Refund request raised', 'info', 'Sent to the Principal for approval');
  };

  const decideRefund = (r: RefundRequest, pay: boolean) => {
    if (!allowed('FEE-025', 'A')) return;
    if (pay && isMe(r.requestedBy)) {
      addToast('You raised this refund, so you cannot approve it', 'error', 'Segregation of duties — RBAC-013');
      return;
    }
    if (pay && r.amount > (ledger.credit[r.studentId] ?? 0)) {
      addToast('Credit is no longer sufficient for this refund', 'error');
      return;
    }
    setRefunds(prev => prev.map(x => (x.id === r.id ? { ...x, status: pay ? 'Paid' : 'Rejected' } : x)));
    if (pay) {
      setAdjustments(prev => [...prev, { id: `ADJ-${String(prev.length + 1).padStart(3, '0')}`, studentId: r.studentId, date: asOf, amount: r.amount, kind: 'Refund', note: r.id }]);
      log('Refund paid', `${r.id} · ${nameOf(r.studentId)} · ${inr(r.amount)}`);
    }
  };

  const transferCredit = () => {
    if (!transferTo || activeCredit <= 0 || !allowed('FEE-024', 'C')) return;
    const n = adjustments.length;
    setAdjustments(prev => [
      ...prev,
      { id: `ADJ-${String(n + 1).padStart(3, '0')}`, studentId: activeId, date: asOf, amount: activeCredit, kind: 'Transfer out', note: `to ${transferTo}` },
      { id: `ADJ-${String(n + 2).padStart(3, '0')}`, studentId: transferTo, date: asOf, amount: activeCredit, kind: 'Transfer in', note: `from ${activeId}` },
    ]);
    log('Sibling credit transfer', `${inr(activeCredit)} · ${nameOf(activeId)} → ${nameOf(transferTo)}`);
    addToast(`${inr(activeCredit)} moved to ${nameOf(transferTo)}`, 'success');
    setTransferTo('');
  };

  // -------------------------------------------------------------------------
  // Receipts & cheques
  // -------------------------------------------------------------------------
  const [receiptFilter, setReceiptFilter] = useState<'All' | PaymentMode | 'Pending'>('All');
  const [cancelling, setCancelling] = useState<Payment | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const receiptRows = [...payments]
    .filter(p => receiptFilter === 'All' || (receiptFilter === 'Pending' ? p.status === 'Pending' : p.mode === receiptFilter))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  const confirmCancel = () => {
    if (!cancelling || !allowed('FEE-021', 'D')) return;
    if (!cancelReason.trim()) {
      addToast('A cancellation reason is required', 'warning');
      return;
    }
    if (isMe(cancelling.collectedBy)) {
      addToast('You collected this payment, so another user must cancel it', 'error', 'Segregation of duties — RBAC-013');
      return;
    }
    setPayments(prev => prev.map(p => (p.id === cancelling.id ? { ...p, status: 'Cancelled', cancelReason: cancelReason.trim() } : p)));
    log('Receipt cancelled', `${cancelling.receiptNo} · ${cancelReason.trim()}`);
    addToast(`${cancelling.receiptNo} cancelled`, 'info', 'Allocations were recalculated');
    setCancelling(null);
    setCancelReason('');
  };

  const moveCheque = (p: Payment, status: 'Deposited' | 'Cleared' | 'Bounced') => {
    if (!allowed('FEE-022', 'U')) return;
    setPayments(prev => prev.map(x => (x.id === p.id ? { ...x, cheque: { ...x.cheque!, status } } : x)));
    log(`Cheque ${status.toLowerCase()}`, `${p.cheque!.number} · ${inr(p.amount)}`);
    if (status === 'Bounced') {
      const seq = invoices.filter(i => i.instalment === 'BNC').length + 1;
      setInvoices(prev => [
        ...prev,
        { invoiceNo: `INV-2425-BNC-${String(seq).padStart(4, '0')}`, studentId: p.studentId, instalment: 'BNC', dueDate: addDays(asOf, 7), generatedOn: asOf, structureId: '—', note: `Cheque ${p.cheque!.number} returned`, lines: [{ head: 'BNC', gross: CHEQUE_BOUNCE_CHARGE, concession: 0, gst: 0, net: CHEQUE_BOUNCE_CHARGE }] },
      ]);
      addToast(`Cheque ${p.cheque!.number} bounced`, 'warning', `Its allocations were reversed and a ${inr(CHEQUE_BOUNCE_CHARGE)} bounce charge was raised`);
    }
  };

  // -------------------------------------------------------------------------
  // Structure & rules
  // -------------------------------------------------------------------------
  const [structClass, setStructClass] = useState(10);
  const classStructures = structures.filter(s => s.classLevel === structClass).sort((a, b) => b.version - a.version);

  const invoicingStarted = invoices.some(i => i.instalment !== 'BNC');
  const canEditStructure = g.can('FEE-003', 'U');

  const reviseClass = () => {
    if (!allowed('FEE-003', 'C')) return;
    const next = reviseStructure(structures, structClass, SCHEDULE[2].dueDate.slice(0, 8) + '01');
    if (next === structures) {
      addToast('A draft already exists for this class', 'info');
      return;
    }
    setStructures(next);
    log('Structure revision', `Class ${structClass} draft v${next[next.length - 1].version}`);
  };

  const editDraft = (id: string, head: string, value: string) => {
    if (!canEditStructure || revisionRequests[id]) return;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return;
    setStructures(prev => prev.map(s => (s.id === id && s.status === 'Draft' ? { ...s, amounts: { ...s.amounts, [head]: Math.round(n) } } : s)));
  };

  const applyPublish = (id: string, detail: string) => {
    setStructures(prev => publishStructure(prev, id));
    const s = structures.find(x => x.id === id)!;
    log('Structure published', `${id} effective ${s.effectiveFrom}${detail}`);
    addToast(`${id} published`, 'success', `Applies to demands due on or after ${fmt(s.effectiveFrom)}; earlier invoices are unchanged`);
  };

  const publish = (id: string) => {
    if (!allowed('FEE-003', 'U')) return;
    if (!invoicingStarted) {
      applyPublish(id, '');
      return;
    }
    // Invoicing has started for the year: the structure is locked and a revision needs approval.
    setRevisionRequests(prev => ({ ...prev, [id]: { by: me, on: asOf } }));
    log('Mid-year revision submitted', `${id} for Principal approval`);
    addToast(`${id} sent to the Principal`, 'info', 'Invoicing has started this year, so a revision needs approval (FEE-003)');
  };

  const decideRevision = (id: string, approve: boolean) => {
    if (!allowed('FEE-003', 'A')) return;
    const req = revisionRequests[id];
    if (!req) return;
    if (isMe(req.by)) {
      addToast('You submitted this revision, so you cannot approve it', 'error', 'Segregation of duties — RBAC-013');
      return;
    }
    setRevisionRequests(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (approve) applyPublish(id, ` · approved by ${me}`);
    else {
      log('Mid-year revision sent back', id);
      addToast(`${id} sent back to ${req.by}`, 'info');
    }
  };

  const toggleOptIn = (sid: string, head: string) => {
    if (!allowed('FEE-006', 'U')) return;
    setOptIns(prev => {
      const cur = prev[sid] ?? [];
      return { ...prev, [sid]: cur.includes(head) ? cur.filter(h => h !== head) : [...cur, head] };
    });
    log('Opt-in changed', `${nameOf(sid)} · ${head}`);
  };

  // -------------------------------------------------------------------------
  // Concessions
  // -------------------------------------------------------------------------
  const [conStudent, setConStudent] = useState('ros-04');
  const [conType, setConType] = useState<ConcessionType>('Merit');
  const [conReason, setConReason] = useState('');
  const [conScheme, setConScheme] = useState('');

  const applyConcession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allowed('FEE-011', 'C')) return;
    if (!conReason.trim()) {
      addToast('Give a reason for the concession', 'warning');
      return;
    }
    const t = CONCESSION_TYPES.find(c => c.type === conType)!;
    const id = `CON-${String(concessions.length + 1).padStart(4, '0')}`;
    const needsApproval = t.pct > CONCESSION_APPROVAL_THRESHOLD_PCT;
    setConcessions(prev => [
      ...prev,
      {
        id,
        studentId: conStudent,
        type: conType,
        pct: t.pct,
        reason: conReason.trim(),
        requestedBy: me,
        requestedOn: asOf,
        status: needsApproval ? 'Pending' : 'Approved',
        decidedBy: needsApproval ? undefined : `Rule: up to ${CONCESSION_APPROVAL_THRESHOLD_PCT}% needs no approval`,
        scholarship: conScheme.trim() ? { scheme: conScheme.trim(), sanctionNo: 'Awaited' } : undefined,
      },
    ]);
    log(needsApproval ? 'Concession proposed' : 'Concession applied by rule', `${id} · ${nameOf(conStudent)} · ${conType} ${t.pct}%`);
    if (needsApproval) addToast(`${id} sent to the Principal`, 'success', `Above ${CONCESSION_APPROVAL_THRESHOLD_PCT}% needs approval${t.needsDocument ? ' · attach the supporting document' : ''}`);
    else addToast(`${id} applied`, 'success', `Up to ${CONCESSION_APPROVAL_THRESHOLD_PCT}% is applied without approval`);
    setConReason('');
    setConScheme('');
  };

  const decideConcession = (c: Concession, approve: boolean) => {
    if (!allowed('FEE-011', 'A')) return;
    if (isMe(c.requestedBy)) {
      addToast('You requested this concession, so you cannot decide it', 'error', 'Segregation of duties — RBAC-013');
      return;
    }
    setConcessions(prev => prev.map(x => (x.id === c.id ? { ...x, status: approve ? 'Approved' : 'Rejected', decidedBy: me } : x)));
    log(`Concession ${approve ? 'approved' : 'rejected'}`, `${c.id} · ${nameOf(c.studentId)}`);
    addToast(`${c.id} ${approve ? 'approved' : 'rejected'}`, approve ? 'success' : 'info', approve ? 'Applies to demands generated from now on' : undefined);
  };

  // -------------------------------------------------------------------------
  // Demands
  // -------------------------------------------------------------------------
  const [demandInst, setDemandInst] = useState('Q3');
  const demandPreview = useMemo(
    () => generateDemand(students, structures, concessions, optIns, invoices, demandInst, asOf),
    [students, structures, concessions, optIns, invoices, demandInst, asOf]
  );
  const [invoiceOpen, setInvoiceOpen] = useState<string | null>(null);

  const runDemand = () => {
    if (!allowed('FEE-013', 'C')) return;
    if (!demandPreview.created.length) {
      addToast('Nothing to generate', 'info');
      return;
    }
    setInvoices(prev => [...prev, ...demandPreview.created]);
    const total = demandPreview.created.reduce((s, i) => s + invoiceTotal(i), 0);
    log('Demand generated', `${demandInst} · ${demandPreview.created.length} invoices · ${inr(total)}`);
    addToast(`${demandPreview.created.length} ${demandInst} invoices raised`, 'success', `${inr(total)} billed · ${demandPreview.skipped.length} skipped`);
  };

  // -------------------------------------------------------------------------
  // Dues & reminders
  // -------------------------------------------------------------------------
  const [threshold, setThreshold] = useState(15);
  const [reminderDate, setReminderDate] = useState('2024-07-17');
  const [planFor, setPlanFor] = useState<string | null>(null);
  const [planParts, setPlanParts] = useState(3);
  const [sentReminders, setSentReminders] = useSessionState<string[]>('fees.sentReminders', []);

  const openStates = ledger.invoices.filter(s => s.balance > 0);
  const buckets = AGEING_BUCKETS.map(b => ({ label: b.label, total: openStates.filter(s => ageingBucket(s.daysOverdue) === b.label).reduce((t, s) => t + s.balance, 0) }));
  const defaulters = Array.from(new Set(openStates.filter(s => s.daysOverdue > threshold).map(s => s.invoice.studentId)))
    .map(sid => ({ sid, balance: overdueFor(sid), oldest: Math.max(...statesFor(sid).map(s => s.daysOverdue)) }))
    .sort((a, b) => b.oldest - a.oldest || b.balance - a.balance);
  const reminders = remindersFor(ledger, reminderDate, plans, concessions, doNotRemind);

  const sendReminders = () => {
    if (!allowed('FEE-030', 'C')) return;
    const toSend = reminders.filter(r => !r.suppressed);
    setSentReminders(prev => [...prev, ...toSend.map(r => `${r.invoiceNo}@${r.sendOn}`)]);
    log('Reminders sent', `${reminderDate} · ${toSend.length} sent · ${reminders.length - toSend.length} suppressed`);
    addToast(`${toSend.length} reminder(s) sent`, 'success', `${reminders.length - toSend.length} suppressed`);
  };

  const createPlan = () => {
    if (!planFor || !allowed('FEE-032', 'C')) return;
    const total = overdueFor(planFor);
    const plan: PaymentPlan = { id: `PLN-${String(plans.length + 1).padStart(3, '0')}`, studentId: planFor, total, parts: buildPlan(total, planParts, addDays(asOf, 5)), createdOn: asOf, status: 'Active' };
    setPlans(prev => [...prev, plan]);
    log('Payment plan', `${plan.id} · ${nameOf(planFor)} · ${planParts} parts of ${inr(total)}`);
    addToast(`Payment plan ${plan.id} created`, 'success', 'Reminders are paused while the plan is active');
    setPlanFor(null);
  };

  // -------------------------------------------------------------------------
  // Reconciliation
  // -------------------------------------------------------------------------
  const gatewayRows = reconcileGateway(payments, INITIAL_SETTLEMENT);
  const bankRows = reconcileBank(expectedDeposits(payments, INITIAL_SETTLEMENT), INITIAL_BANK_STATEMENT);
  const exceptions = [
    ...gatewayRows.filter(r => r.status !== 'Matched' && r.status !== 'Not settled').map(r => ({ key: `GW-${r.gatewayRef}`, source: 'Gateway', detail: `${r.gatewayRef}: ${r.status}${r.line ? ` (settled ${inr(r.line.gross)}` : ''}${r.payment ? `, collected ${inr(r.payment.amount)}` : ''}${r.line ? ')' : ''}` })),
    ...bankRows.filter(r => r.status !== 'Matched').map(r => ({ key: `BK-${r.key}`, source: 'Bank', detail: `${r.expected?.label ?? r.lines[0].narration}: ${r.status === 'Not settled' ? 'not on the statement yet' : r.status}${r.expected ? ` · expected ${inr(r.expected.amount)}` : ` · ${inr(r.net)}`}` })),
    ...payments.filter(p => p.cheque?.status === 'Bounced').map(p => ({ key: `CHQ-${p.id}`, source: 'Cheque', detail: `Cheque ${p.cheque!.number} from ${nameOf(p.studentId)} bounced · ${inr(p.amount)}` })),
  ];
  const [resolveKey, setResolveKey] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState('');

  // -------------------------------------------------------------------------
  // Reports
  // -------------------------------------------------------------------------
  const [dayBookDate, setDayBookDate] = useState('2024-07-05');
  const [certStudent, setCertStudent] = useState('ros-01');
  const [printCert, setPrintCert] = useState(false);

  const dayBook = payments.filter(p => p.date === dayBookDate && p.receiptNo);
  const byMode = Array.from(new Set(dayBook.map(p => p.mode))).map(m => ({ mode: m, count: dayBook.filter(p => p.mode === m && p.status !== 'Cancelled').length, total: dayBook.filter(p => p.mode === m && p.status !== 'Cancelled').reduce((s, p) => s + p.amount, 0) }));

  const vsTarget = SCHEDULE.map(q => {
    const states = ledger.invoices.filter(s => s.invoice.instalment === q.id);
    const billed = states.reduce((t, s) => t + s.principal, 0);
    const collected = states.reduce((t, s) => t + s.principalPaid, 0);
    return { q, billed, collected, pct: billed ? Math.round((collected / billed) * 1000) / 10 : 0 };
  });

  const headRevenue = FEE_HEADS.map(h => ({ head: h, total: ledger.allocations.filter(a => a.head === h.code).reduce((t, a) => t + a.amount, 0) })).concat([
    { head: { ...FEE_HEADS[0], code: 'LATE', name: 'Late fee' }, total: ledger.allocations.filter(a => a.head === 'LATE').reduce((t, a) => t + a.amount, 0) },
  ]);

  const concessionReport = CONCESSION_TYPES.map(t => {
    const lines = invoices.filter(i => concessions.some(c => c.studentId === i.studentId && c.type === t.type && c.status === 'Approved')).flatMap(i => i.lines);
    return { type: t.type, students: new Set(concessions.filter(c => c.type === t.type && c.status === 'Approved').map(c => c.studentId)).size, amount: lines.reduce((s, l) => s + l.concession, 0) };
  });

  const gstRows = FEE_HEADS.filter(h => h.gstRate > 0).map(h => {
    const lines = invoices.flatMap(i => i.lines).filter(l => l.head === h.code);
    return { head: h, taxable: lines.reduce((s, l) => s + l.gross - l.concession, 0), gst: lines.reduce((s, l) => s + l.gst, 0) };
  });

  const certificate = useMemo(() => {
    const allocs = ledger.allocations.filter(a => invoices.find(i => i.invoiceNo === a.invoiceNo)?.studentId === certStudent);
    const tuition = allocs.filter(a => headByCode(a.head)?.tuition).reduce((s, a) => s + a.amount, 0);
    const other = allocs.filter(a => a.head !== 'LATE' && !headByCode(a.head)?.tuition).reduce((s, a) => s + a.amount, 0);
    return { tuition, other };
  }, [ledger, invoices, certStudent]);

  const exportLedger = () => {
    if (!allowed('FEE-028', 'E')) return;
    const sids = Array.from(new Set(openStates.map(s => s.invoice.studentId)));
    downloadCsv(
      `Outstanding_Ledger_${asOf}.csv`,
      ['Student', 'Admission no', 'Class', ...AGEING_BUCKETS.map(b => b.label), 'Total'],
      sids.map(sid => [
        nameOf(sid),
        student(sid).admissionNo,
        `${student(sid).classLevel}-${student(sid).section}`,
        ...AGEING_BUCKETS.map(b => statesFor(sid).filter(x => x.balance > 0 && ageingBucket(x.daysOverdue) === b.label).reduce((t, x) => t + x.balance, 0)),
        balanceFor(sid),
      ])
    );
    log('Ledger export', `${sids.length} students · ${GRANT_ROLE_LABEL[g.role]}`);
    addToast('Outstanding ledger exported', 'success', 'Export event logged — FEE-028');
  };

  const auditPack = () => {
    if (!allowed('FEE-042', 'E')) return;
    downloadCsv(`Fee_Invoices_${asOf}.csv`, ['Invoice', 'Student', 'Instalment', 'Due', 'Head', 'Gross', 'Concession', 'GST', 'Net'], invoices.flatMap(i => i.lines.map(l => [i.invoiceNo, nameOf(i.studentId), i.instalment, i.dueDate, l.head, l.gross, l.concession, l.gst, l.net])));
    downloadCsv(`Fee_Receipts_${asOf}.csv`, ['Payment', 'Receipt', 'Student', 'Date', 'Mode', 'Amount', 'Status', 'Collected by', 'Cancel reason'], payments.map(p => [p.id, p.receiptNo ?? '', nameOf(p.studentId), p.date, p.mode, p.amount, p.cheque ? `${p.status} / cheque ${p.cheque.status}` : p.status, p.collectedBy, p.cancelReason ?? '']));
    downloadCsv(`Fee_Allocations_${asOf}.csv`, ['Payment', 'Invoice', 'Head', 'Amount', 'Date'], ledger.allocations.map(a => [a.paymentId, a.invoiceNo, a.head, a.amount, a.date]));
    downloadCsv(`Fee_Concessions_${asOf}.csv`, ['Id', 'Student', 'Type', '%', 'Status', 'Requested by', 'Decided by'], concessions.map(c => [c.id, nameOf(c.studentId), c.type, c.pct, c.status, c.requestedBy, c.decidedBy ?? '']));
    downloadCsv(`Fee_Audit_Trail_${asOf}.csv`, ['When', 'Who', 'Action', 'Detail'], audit.map(a => [a.at, a.actor, a.action, a.detail]));
    log('Audit pack export', '5 files');
    addToast('Audit pack exported (5 CSV files)', 'success', 'Export event logged — AUD-003');
  };

  // -------------------------------------------------------------------------
  // KPIs
  // -------------------------------------------------------------------------
  const billedTotal = ledger.invoices.reduce((t, s) => t + s.principal, 0);
  const collectedTotal = ledger.invoices.reduce((t, s) => t + s.principalPaid + s.lateFeePaid, 0);
  const outstanding = openStates.reduce((t, s) => t + s.balance, 0);
  const kpis: { label: string; value: React.ReactNode; sub?: string }[] = [
    { label: 'Billed this year', value: <Money value={billedTotal} /> },
    { label: 'Collected', value: <Money value={collectedTotal} />, sub: `${billedTotal ? Math.round((collectedTotal / billedTotal) * 100) : 0}% of billed` },
    { label: 'Outstanding', value: <Money value={outstanding} />, sub: `${defaulters.length} defaulter(s) over ${threshold} days` },
    { label: 'Pending approvals', value: String(concessions.filter(c => c.status === 'Pending').length + refunds.filter(r => r.status === 'Pending').length + Object.keys(revisionRequests).length), sub: 'concessions, refunds, revisions' },
    { label: 'Open exceptions', value: String(exceptions.filter(x => !resolved[x.key]).length), sub: 'reconciliation' },
  ];

  const renderInvoiceTable = (states: InvoiceState[]) => (
    <table className="data-table w-full">
      <thead className="bg-slate-50 text-ink-soft">
        <tr>
          <Th>Invoice</Th>
          <Th>Due</Th>
          <Th right>Amount</Th>
          <Th right>Paid</Th>
          <Th right>Late fee</Th>
          <Th right>Balance</Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-subtle">
        {states.map(s => (
          <React.Fragment key={s.invoice.invoiceNo}>
            <tr className="cursor-pointer hover:bg-wash" onClick={() => setInvoiceOpen(invoiceOpen === s.invoice.invoiceNo ? null : s.invoice.invoiceNo)}>
              <td className="cell">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono">{s.invoice.invoiceNo}</span>
                  <span
                    data-invoice-state
                    className={`text-[10px] font-semibold px-1.5 py-px rounded-full border ${
                      s.balance <= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : s.daysOverdue > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {s.balance <= 0 ? 'Paid' : s.daysOverdue > 0 ? 'Overdue' : 'Due'}
                  </span>
                </span>
                {s.invoice.note && <p className="text-[10px] text-amber-700">{s.invoice.note}</p>}
              </td>
              <td className={`cell ${s.daysOverdue > 0 ? 'text-rose-600 font-semibold' : ''}`}>
                {fmt(s.invoice.dueDate)}
                {s.daysOverdue > 0 && <span className="block text-[10px]">{s.daysOverdue} days overdue</span>}
              </td>
              <td className="cell text-right"><Money value={s.principal} /></td>
              <td className="cell text-right"><Money value={s.principalPaid + s.lateFeePaid} /></td>
              <td className="cell text-right"><Money value={s.lateFee} /></td>
              <td className="cell text-right"><Money value={s.balance} className={s.balance > 0 ? 'font-bold text-rose-600' : 'text-emerald-700'} /></td>
            </tr>
            {invoiceOpen === s.invoice.invoiceNo && (
              <tr className="bg-slate-50">
                <td colSpan={6} className="cell">
                  <table className="w-full text-[11px]">
                    <thead className="text-ink-muted">
                      <tr>
                        <th className="text-left">Head</th>
                        <th className="text-right">Gross</th>
                        <th className="text-right">Concession</th>
                        <th className="text-right">GST</th>
                        <th className="text-right">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.invoice.lines.map(l => (
                        <tr key={l.head}>
                          <td>{headByCode(l.head).name}</td>
                          <td className="text-right font-mono"><Money value={l.gross} /></td>
                          <td className="text-right font-mono">{l.concession ? `−${inr(l.concession)}` : '—'}</td>
                          <td className="text-right font-mono">{l.gst ? `${inr(l.gst)} (${headByCode(l.head).gstRate}%)` : '—'}</td>
                          <td className="text-right font-mono font-semibold"><Money value={l.net} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );

  const receiptAllocations = (p: Payment) => ledger.allocations.filter(a => a.paymentId === p.id);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-accent-ink uppercase tracking-[0.14em] mb-1.5">
            <span className="material-symbols-outlined text-sm">payments</span>
            <span>Module 19 · Fees & Finance (FEE)</span>
          </div>
          <h1 className="text-2xl md:text-[28px] leading-tight font-bold font-display tracking-tight text-ink">Fees Desk · {ACADEMIC_YEAR}</h1>
          <p className="text-xs text-ink-soft mt-1">
            {selectedCampus.name} · balances as of {fmt(asOf)}
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-lg bg-subtle text-brand" data-testid="fee-access">
            <span className="material-symbols-outlined text-sm">{changesAnything ? 'edit_note' : 'visibility'}</span>
            {GRANT_ROLE_LABEL[g.role]}: {[changesAnything ? 'records and proposes' : approvesAnything ? 'reads and approves' : 'read-only', exportsAnything && 'exports'].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="flex flex-col sm:items-end gap-2">
          <DensityToggle />
          <p className="text-[10px] text-ink-muted max-w-xs sm:text-right">
            Built from the feature names in the PDF feature list. Rules such as allocation order, late fee and proration follow common practice and should be
            checked against the catalogue text.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="bg-surface rounded-2xl border border-line-soft p-3 shadow-sm">
            <p className="text-xl font-bold font-display tracking-tight tabular-nums text-ink">{k.value}</p>
            <p className="text-[11px] font-semibold text-ink">{k.label}</p>
            {k.sub && <p className="text-[10px] text-ink-muted">{k.sub}</p>}
          </div>
        ))}
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-line-soft">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id ? 'border-brand text-brand' : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
      <FeatureTags ids={TABS.find(t => t.id === tab)!.ids} />

      {/* ------------------------------------------------------------ Collect */}
      {tab === 'collect' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Panel title="Find student">
              <div className="p-3 space-y-2">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, admission no or mobile" className={`${inputCls} w-full`} aria-label="Find student" />
                <div className="divide-y divide-subtle">
                  {searchHits.map(s => (
                    <button key={s.id} onClick={() => { setActiveId(s.id); setLink(null); }} className={`w-full text-left p-2 text-xs ${s.id === activeId ? 'bg-subtle' : 'hover:bg-wash'}`}>
                      <span className="font-semibold text-ink">{s.name}</span>
                      <span className="text-[10px] text-ink-muted block">
                        {s.admissionNo} · {s.classLevel}-{s.section} · due <Money value={balanceFor(s.id)} />
                      </span>
                    </button>
                  ))}
                  {searchHits.length === 0 && <EmptyNote>No match.</EmptyNote>}
                </div>
              </div>
            </Panel>

            <Panel title="Counter collection">
              <form onSubmit={collect} className="p-3 space-y-2 text-xs">
                <div className="grid grid-cols-4 gap-1">
                  {COUNTER_MODES.map(m => (
                    <button type="button" key={m} onClick={() => setMode(m)} className={mode === m ? btnPrimary : btnSoft}>
                      {m}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^\d]/g, ''))} placeholder="Amount (₹)" inputMode="numeric" className={`${inputCls} flex-1`} aria-label="Amount" />
                  <button type="button" onClick={() => setAmount(String(activeDue))} disabled={activeDue <= 0} className={btnSoft}>
                    Full due
                  </button>
                </div>
                {(mode === 'Cheque' || mode === 'DD') && (
                  <div className="grid grid-cols-2 gap-1">
                    <input value={chequeNo} onChange={e => setChequeNo(e.target.value)} placeholder={`${mode} number`} className={inputCls} aria-label="Instrument number" />
                    <input value={chequeBank} onChange={e => setChequeBank(e.target.value)} placeholder="Bank" className={inputCls} aria-label="Bank" />
                  </div>
                )}
                {mode === 'Card' && <input value={reference} onChange={e => setReference(e.target.value)} placeholder="POS approval code" className={`${inputCls} w-full`} aria-label="POS approval code" />}
                {preview && (
                  <div className="p-2 rounded-lg bg-slate-50 space-y-0.5">
                    <p className="font-semibold text-ink">This payment will settle</p>
                    {preview.lines.map((l, i) => (
                      <p key={i} className="flex justify-between">
                        <span>
                          {l.invoiceNo.replace('INV-2425-', '')} · {l.head === 'LATE' ? 'Late fee' : headByCode(l.head).name}
                        </span>
                        <Money value={l.amount} />
                      </p>
                    ))}
                    {preview.advance > 0 && (
                      <p className="flex justify-between text-sky-700">
                        <span>Advance credit</span>
                        <Money value={preview.advance} />
                      </p>
                    )}
                  </div>
                )}
                <button type="submit" disabled={!amountValid || !g.can('FEE-017', 'C')} title={g.why('FEE-017', 'C')} className={`${btnPrimary} w-full`}>
                  Collect & issue receipt
                </button>
                <p className="text-[10px] text-ink-muted">Oldest invoice first; within an invoice, tuition first; the late fee is settled last. Extra money is kept as advance credit.</p>
              </form>
            </Panel>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Panel
              title={
                <span className="flex flex-wrap items-center gap-2" data-testid="ledger-identity">
                  <span>{active.name}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${activeDue > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                    {activeDue > 0 ? <><Money value={activeDue} /> due</> : 'Paid up'}
                  </span>
                  <span className="font-normal text-ink-muted">
                    {active.admissionNo} · Class {active.classLevel}-{active.section}
                  </span>
                </span>
              }
              actions={
                <div className="flex flex-wrap gap-1">
                  <button onClick={makeLink} disabled={!g.can('FEE-026', 'C')} title={g.why('FEE-026', 'C')} className={btnSoft}>
                    Payment link
                  </button>
                  <button onClick={startOnline} disabled={!g.can('FEE-015', 'C')} title={g.why('FEE-015', 'C')} className={btnPrimary}>
                    Pay online (<Money value={activeDue} />)
                  </button>
                </div>
              }
            >
              <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <p className="text-[10px] text-ink-muted">Balance due</p>
                  <Money value={activeDue} className={`text-base font-bold ${activeDue > 0 ? 'text-rose-600' : 'text-emerald-700'}`} />
                </div>
                <div>
                  <p className="text-[10px] text-ink-muted">Advance credit</p>
                  <Money value={activeCredit} className="text-base font-bold text-ink" />
                </div>
                <div>
                  <p className="text-[10px] text-ink-muted">Concession</p>
                  <p className="font-semibold">{concessions.filter(c => c.studentId === activeId && c.status === 'Approved').map(c => `${c.type} ${c.pct}%`).join(', ') || 'None'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-ink-muted">Opted in</p>
                  <p className="font-semibold">{[...(active.transportRoute ? ['Transport'] : []), ...(optIns[activeId] ?? []).map(h => headByCode(h).name)].join(', ') || 'None'}</p>
                </div>
              </div>
              {link && (
                <p className="mx-3 mb-3 p-2 rounded-lg bg-sky-50 border border-sky-200 text-[11px] break-all">
                  <span className="font-mono">{link.url}</span> · expires {fmt(link.expires)} · send via WhatsApp or SMS
                </p>
              )}
              <div className="overflow-x-auto" data-export-title={`Fee ledger · ${active.name} · ${active.admissionNo}`}>
                {renderInvoiceTable(activeStates)}
              </div>
              {activeStates.length === 0 && <EmptyNote>No invoices for this student.</EmptyNote>}
            </Panel>

            {payments.filter(p => p.studentId === activeId && p.status === 'Pending').map(p => (
              <div key={p.id} className="p-3 rounded-2xl border border-amber-300 bg-amber-50 text-xs flex flex-wrap items-center justify-between gap-2">
                <span>
                  Online payment {p.gatewayRef} · <Money value={p.amount} /> · waiting for the gateway
                </span>
                <span className="flex gap-1">
                  <button onClick={() => gatewayCallback(p, false)} disabled={!g.can('FEE-015', 'C')} className={btnSoft}>
                    Gateway: failed
                  </button>
                  <button onClick={() => gatewayCallback(p, true)} disabled={!g.can('FEE-015', 'C')} className={btnPrimary}>
                    Gateway: success
                  </button>
                </span>
              </div>
            ))}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Panel title="Refund advance credit">
                <div className="p-3 space-y-2 text-xs">
                  <div className="flex gap-1">
                    <input value={refundAmount} onChange={e => setRefundAmount(e.target.value.replace(/[^\d]/g, ''))} placeholder={`Up to ${inr(activeCredit)}`} className={`${inputCls} flex-1`} aria-label="Refund amount" />
                    <button onClick={requestRefund} disabled={activeCredit <= 0 || !g.can('FEE-025', 'C')} title={g.why('FEE-025', 'C')} className={btnSoft}>
                      Request
                    </button>
                  </div>
                  {refunds.map(r => (
                    <div key={r.id} className="flex items-center justify-between gap-1">
                      <span>
                        {r.id} · {nameOf(r.studentId)} · <Money value={r.amount} /> · {r.status}
                      </span>
                      {r.status === 'Pending' && !g.can('FEE-025', 'A') && <span className="text-[10px] text-ink-muted">Awaiting Principal</span>}
                      {r.status === 'Pending' && g.can('FEE-025', 'A') && (
                        <span className="flex gap-1">
                          <button onClick={() => decideRefund(r, false)} className={btnSoft}>
                            Reject
                          </button>
                          <button onClick={() => decideRefund(r, true)} className={btnPrimary}>
                            Approve & pay
                          </button>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel title="Move credit to a sibling">
                <div className="p-3 space-y-2 text-xs">
                  {siblings.length === 0 ? (
                    <p className="text-ink-muted">No siblings share this guardian mobile.</p>
                  ) : (
                    <div className="flex gap-1">
                      <select value={transferTo} onChange={e => setTransferTo(e.target.value)} className={`${inputCls} flex-1`} aria-label="Sibling">
                        <option value="">Choose sibling…</option>
                        {siblings.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} (due <Money value={balanceFor(s.id)} />)
                          </option>
                        ))}
                      </select>
                      <button onClick={transferCredit} disabled={!transferTo || activeCredit <= 0 || !g.can('FEE-024', 'C')} className={btnPrimary}>
                        Move <Money value={activeCredit} />
                      </button>
                    </div>
                  )}
                </div>
              </Panel>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- Receipts */}
      {tab === 'receipts' && (
        <Panel
          title={`Receipts · ${receiptRows.length}`}
          actions={
            <select value={receiptFilter} onChange={e => setReceiptFilter(e.target.value as typeof receiptFilter)} className={inputCls} aria-label="Receipt filter">
              {['All', 'Cash', 'Cheque', 'DD', 'Card', 'Online', 'Pending'].map(o => (
                <option key={o}>{o}</option>
              ))}
            </select>
          }
        >
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead className="bg-slate-50 text-ink-soft">
                <tr>
                  <Th>Receipt</Th>
                  <Th>Date</Th>
                  <Th>Student</Th>
                  <Th>Mode</Th>
                  <Th right>Amount</Th>
                  <Th>Status</Th>
                  <Th>Collected by</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {receiptRows.map(p => (
                  <tr key={p.id} className={p.status === 'Cancelled' || p.status === 'Failed' ? 'text-ink-muted' : ''}>
                    <td className={`cell font-mono ${p.status === 'Cancelled' ? 'line-through' : ''}`}>{p.receiptNo ?? p.gatewayRef ?? p.id}</td>
                    <td className="cell font-mono">{fmt(p.date)}</td>
                    <td className="cell">{nameOf(p.studentId)}</td>
                    <td className="cell">
                      {p.mode}
                      {p.cheque && (
                        <span className="block text-[10px] text-ink-muted">
                          #{p.cheque.number} · {p.cheque.bank} · {p.cheque.status}
                        </span>
                      )}
                      {p.reference && <span className="block text-[10px] text-ink-muted">{p.reference}</span>}
                    </td>
                    <td className="cell text-right"><Money value={p.amount} /></td>
                    <td className="cell">
                      {p.status}
                      {p.cancelReason && <span className="block text-[10px]">{p.cancelReason}</span>}
                    </td>
                    <td className="cell">{p.collectedBy}</td>
                    <td className="cell whitespace-nowrap text-right">
                      <span className="inline-flex gap-1">
                        {g.can('FEE-022', 'U') && p.cheque && p.status === 'Success' && p.cheque.status === 'Received' && (
                          <button onClick={() => moveCheque(p, 'Deposited')} className={btnSoft}>
                            Deposit
                          </button>
                        )}
                        {g.can('FEE-022', 'U') && p.cheque && p.status === 'Success' && p.cheque.status === 'Deposited' && (
                          <>
                            <button onClick={() => moveCheque(p, 'Bounced')} className={btnSoft}>
                              Bounced
                            </button>
                            <button onClick={() => moveCheque(p, 'Cleared')} className={btnPrimary}>
                              Cleared
                            </button>
                          </>
                        )}
                        {p.receiptNo && (
                          <button onClick={() => setReceiptFor(p)} className={btnSoft}>
                            View
                          </button>
                        )}
                        {g.can('FEE-021', 'D') && p.receiptNo && p.status === 'Success' && (
                          <button onClick={() => setCancelling(p)} className={btnSoft}>
                            Cancel
                          </button>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* ---------------------------------------------------------- Structure */}
      {tab === 'structure' && (
        <div className="space-y-6">
          <Panel title="Fee heads">
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead className="bg-slate-50 text-ink-soft">
                  <tr>
                    {['Code', 'Head', 'Billing', 'Optional', 'Refundable', 'GST', 'Concession applies', 'Settles'].map(h => (
                      <Th key={h}>{h}</Th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {FEE_HEADS.map(h => (
                    <tr key={h.code}>
                      <td className="cell font-mono font-bold text-brand">{h.code}</td>
                      <td className="cell font-semibold">{h.name}</td>
                      <td className="cell">{h.frequency}</td>
                      <td className="cell">{h.optional ? 'Opt-in' : 'All students'}</td>
                      <td className="cell">{h.refundable ? 'Yes' : 'No'}</td>
                      <td className="cell">{h.gstRate ? `${h.gstRate}%` : 'Exempt'}</td>
                      <td className="cell">{h.concessionEligible ? 'Yes' : 'No'}</td>
                      <td className="cell">#{h.priority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Panel
              className="lg:col-span-2"
              title="Fee structure by class (annual amounts)"
              actions={
                <div className="flex gap-1">
                  {[8, 9, 10].map(c => (
                    <button key={c} onClick={() => setStructClass(c)} className={structClass === c ? btnPrimary : btnSoft}>
                      Class {c}
                    </button>
                  ))}
                  {g.can('FEE-003', 'C') && (
                    <button onClick={reviseClass} className={btnSoft}>
                      New revision
                    </button>
                  )}
                </div>
              }
            >
              <div className="overflow-x-auto">
                <table className="data-table w-full">
                  <thead className="bg-slate-50 text-ink-soft">
                    <tr>
                      <Th>Head</Th>
                      {classStructures.map(s => (
                        <Th key={s.id} right>
                          v{s.version} · {s.status} · from {fmt(s.effectiveFrom)}
                        </Th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle">
                    {FEE_HEADS.map(h => (
                      <tr key={h.code}>
                        <td className="cell">{h.name}</td>
                        {classStructures.map(s => (
                          <td key={s.id} className="cell text-right">
                            {s.status === 'Draft' && canEditStructure && !revisionRequests[s.id] ? (
                              <input
                                value={s.amounts[h.code] ?? 0}
                                onChange={e => editDraft(s.id, h.code, e.target.value)}
                                inputMode="numeric"
                                className={`${inputCls} w-24 text-right font-mono`}
                                aria-label={`${s.id} ${h.name}`}
                              />
                            ) : (
                              <Money value={s.amounts[h.code] ?? 0} />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="bg-slate-50">
                      <td className="cell" />
                      {classStructures.map(s => (
                        <td key={s.id} className="cell text-right">
                          {s.status === 'Draft' && revisionRequests[s.id] ? (
                            g.can('FEE-003', 'A') ? (
                              <span className="inline-flex gap-1">
                                <button onClick={() => decideRevision(s.id, false)} className={btnSoft}>
                                  Send back
                                </button>
                                <button onClick={() => decideRevision(s.id, true)} className={btnPrimary}>
                                  Approve & publish
                                </button>
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-amber-700">Awaiting Principal approval</span>
                            )
                          ) : s.status === 'Draft' && canEditStructure ? (
                            <button onClick={() => publish(s.id)} className={btnPrimary}>
                              {invoicingStarted ? 'Submit for approval' : 'Publish'}
                            </button>
                          ) : s.status === 'Draft' ? (
                            <span className="text-[10px] text-ink-muted">Draft · not submitted</span>
                          ) : null}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </Panel>

            <div className="space-y-4">
              <Panel title="Instalment schedule">
                <div className="p-3 space-y-1 text-xs">
                  {SCHEDULE.map(q => (
                    <p key={q.id} className="flex justify-between">
                      <span>{q.label}</span>
                      <span className="font-mono">
                        <Figure value={q.pct} suffix="%" /> · due {fmt(q.dueDate)}
                      </span>
                    </p>
                  ))}
                  <p className="text-[10px] text-ink-muted pt-1">Instalment heads follow these shares. Annual heads are billed in full in the first instalment a student is billed for.</p>
                </div>
              </Panel>
              <Panel title="Late fee rule">
                <div className="p-3 grid grid-cols-3 gap-2 text-xs">
                  {([
                    ['graceDays', 'Grace days'],
                    ['perDay', '₹ per day'],
                    ['cap', 'Cap ₹'],
                  ] as const).map(([k, label]) => (
                    <label key={k} className="block">
                      <span className="block text-[10px] font-semibold text-ink-soft">{label}</span>
                      <input
                        value={lateRule[k]}
                        onChange={e => {
                          const n = Number(e.target.value);
                          if (Number.isInteger(n) && n >= 0 && allowed('FEE-008', 'U')) setLateRule(prev => ({ ...prev, [k]: n }));
                        }}
                        inputMode="numeric"
                        readOnly={!g.can('FEE-008', 'U')}
                        className={`${inputCls} w-full font-mono`}
                        aria-label={label}
                      />
                    </label>
                  ))}
                  <p className="col-span-3 text-[10px] text-ink-muted">
                    Example: due 10 Jul, paid 30 Jul → {Math.max(0, 20 - lateRule.graceDays)} late day(s) → <Money value={Math.min(lateRule.cap, Math.max(0, 20 - lateRule.graceDays) * lateRule.perDay)} />. Changes apply to every open invoice.
                  </p>
                </div>
              </Panel>
              <Panel title="Proration for mid-year joiners">
                <div className="p-3 text-xs space-y-1">
                  {students
                    .filter(s => JOINING_MONTH[s.id])
                    .map(s => (
                      <div key={s.id}>
                        <p className="font-semibold">
                          {s.name} joined in month {JOINING_MONTH[s.id]}
                        </p>
                        {SCHEDULE.map(q => (
                          <p key={q.id} className="flex justify-between text-[11px]">
                            <span>{q.label}</span>
                            <span className="font-mono"><Figure value={Math.round(prorationFactor(q, JOINING_MONTH[s.id]) * 100)} suffix="%" /> billed</span>
                          </p>
                        ))}
                      </div>
                    ))}
                </div>
              </Panel>
            </div>
          </div>

          <Panel title="Optional services — Olympiad coaching opt-in (transport follows the route allocation)">
            <div className="p-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
              {students
                .filter(s => !s.mergedInto && s.status !== 'TC issued')
                .map(s => (
                  <label key={s.id} className="flex items-center gap-1">
                    <input type="checkbox" checked={(optIns[s.id] ?? []).includes('OLY')} onChange={() => toggleOptIn(s.id, 'OLY')} disabled={!g.can('FEE-006', 'U')} className="accent-brand" />
                    {s.name}
                  </label>
                ))}
            </div>
            <p className="px-3 pb-3 text-[10px] text-ink-muted">Opt-ins take effect on the next demand; invoices already raised are not changed.</p>
          </Panel>
        </div>
      )}

      {/* -------------------------------------------------------- Concessions */}
      {tab === 'concessions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Panel title="Concession types">
              <table className="data-table w-full">
                <tbody className="divide-y divide-subtle">
                  {CONCESSION_TYPES.map(t => (
                    <tr key={t.type}>
                      <td className="cell font-semibold">{t.type}</td>
                      <td className="cell font-mono"><Figure value={t.pct} suffix="%" /></td>
                      <td className="cell text-ink-muted">{t.needsDocument ? 'Document required' : 'No document'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="p-3 text-[10px] text-ink-muted">Applies to tuition, development and lab fees. If a student has several, only the highest applies.</p>
            </Panel>
            {g.can('FEE-011', 'C') ? (
            <Panel title="Propose a concession">
              <form onSubmit={applyConcession} className="p-3 space-y-2 text-xs">
                <select value={conStudent} onChange={e => setConStudent(e.target.value)} className={`${inputCls} w-full`} aria-label="Concession student">
                  {students
                    .filter(s => !s.mergedInto && s.status !== 'TC issued')
                    .map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} · {s.classLevel}-{s.section}
                      </option>
                    ))}
                </select>
                <select value={conType} onChange={e => setConType(e.target.value as ConcessionType)} className={`${inputCls} w-full`} aria-label="Concession type">
                  {CONCESSION_TYPES.map(t => (
                    <option key={t.type}>{t.type}</option>
                  ))}
                </select>
                <input value={conReason} onChange={e => setConReason(e.target.value)} placeholder="Reason" className={`${inputCls} w-full`} aria-label="Concession reason" />
                <input value={conScheme} onChange={e => setConScheme(e.target.value)} placeholder="Scholarship scheme (optional)" className={`${inputCls} w-full`} aria-label="Scholarship scheme" />
                <button type="submit" className={`${btnPrimary} w-full`}>
                  Propose concession
                </button>
                <p className="text-[10px] text-ink-muted">Up to <Figure value={CONCESSION_APPROVAL_THRESHOLD_PCT} suffix="%" /> applies at once; anything higher goes to the Principal. You cannot approve your own proposal.</p>
              </form>
            </Panel>
            ) : (
              <p className="text-[11px] text-ink-soft p-3 rounded-xl border border-dashed border-line">
                {GRANT_ROLE_LABEL[g.role]}: {g.grant('FEE-011')?.condition || 'no access to concession proposals'}.
              </p>
            )}
          </div>
          <Panel className="lg:col-span-2" title="Concessions & scholarships">
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead className="bg-slate-50 text-ink-soft">
                  <tr>
                    {['Id', 'Student', 'Type', 'Reason', 'Requested', 'Status', ''].map(h => (
                      <Th key={h}>{h}</Th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {concessions.map(c => (
                    <tr key={c.id}>
                      <td className="cell font-mono">{c.id}</td>
                      <td className="cell font-semibold">{nameOf(c.studentId)}</td>
                      <td className="cell">
                        {c.type} <Figure value={c.pct} suffix="%" />
                        {c.scholarship && (
                          <span className="block text-[10px] text-ink-muted">
                            {c.scholarship.scheme} · {c.scholarship.sanctionNo}
                          </span>
                        )}
                      </td>
                      <td className="cell">{c.reason}</td>
                      <td className="cell">
                        {c.requestedBy}
                        <span className="block text-[10px] text-ink-muted">{fmt(c.requestedOn)}</span>
                      </td>
                      <td className="cell">
                        {c.status}
                        {c.decidedBy && <span className="block text-[10px] text-ink-muted">by {c.decidedBy}</span>}
                      </td>
                      <td className="cell whitespace-nowrap text-right">
                        {c.status === 'Pending' && !g.can('FEE-011', 'A') && <span className="text-[10px] text-ink-muted">Awaiting Principal</span>}
                        {c.status === 'Pending' && g.can('FEE-011', 'A') && (
                          <span className="inline-flex gap-1">
                            <button onClick={() => decideConcession(c, false)} className={btnSoft}>
                              Reject
                            </button>
                            <button onClick={() => decideConcession(c, true)} disabled={isMe(c.requestedBy)} title={isMe(c.requestedBy) ? 'You raised this request' : undefined} className={btnPrimary}>
                              Approve
                            </button>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* ------------------------------------------------------------ Demands */}
      {tab === 'demands' && (
        <div className="space-y-4">
          <Panel
            title="Raise instalment demand"
            actions={
              <div className="flex gap-1">
                <select value={demandInst} onChange={e => setDemandInst(e.target.value)} className={inputCls} aria-label="Instalment">
                  {SCHEDULE.map(q => (
                    <option key={q.id} value={q.id}>
                      {q.label}
                    </option>
                  ))}
                </select>
                <button onClick={runDemand} disabled={!demandPreview.created.length || !g.can('FEE-013', 'C')} title={g.why('FEE-013', 'C')} className={btnPrimary}>
                  Generate {demandPreview.created.length} invoice(s)
                </button>
              </div>
            }
          >
            <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-semibold text-ink mb-1">
                  Will be billed · <Money value={demandPreview.created.reduce((s, i) => s + invoiceTotal(i), 0)} />
                </p>
                {demandPreview.created.map(i => (
                  <p key={i.invoiceNo} className="flex justify-between">
                    <span>{nameOf(i.studentId)}</span>
                    <Money value={invoiceTotal(i)} />
                  </p>
                ))}
                {demandPreview.created.length === 0 && <EmptyNote>Everyone eligible has already been billed for this instalment.</EmptyNote>}
              </div>
              <div>
                <p className="font-semibold text-ink mb-1">Skipped</p>
                {demandPreview.skipped.map(s => (
                  <p key={s.studentId} className="flex justify-between">
                    <span>{nameOf(s.studentId)}</span>
                    <span className="text-ink-muted">{s.reason}</span>
                  </p>
                ))}
              </div>
            </div>
          </Panel>
          <Panel title={`All invoices · ${ledger.invoices.length} · click a row to see its lines`}>
            <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
              {renderInvoiceTable([...ledger.invoices].sort((a, b) => a.invoice.invoiceNo.localeCompare(b.invoice.invoiceNo)))}
            </div>
          </Panel>
        </div>
      )}

      {/* --------------------------------------------------------------- Dues */}
      {tab === 'dues' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {buckets.map(b => (
              <div key={b.label} className="bg-surface rounded-2xl border border-line-soft p-3 shadow-sm">
                <Money value={b.total} className={`text-base font-bold ${b.label.startsWith('90') ? 'text-rose-600' : 'text-ink'}`} />
                <p className="text-[11px] text-ink-muted">{b.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel
              title={`Defaulters · overdue by more than ${threshold} days`}
              actions={
                <input
                  value={threshold}
                  onChange={e => {
                    const n = Number(e.target.value);
                    if (Number.isInteger(n) && n >= 0) setThreshold(n);
                  }}
                  inputMode="numeric"
                  className={`${inputCls} w-16 font-mono`}
                  aria-label="Defaulter threshold days"
                />
              }
            >
              <div className="divide-y divide-subtle">
                {defaulters.length === 0 && <EmptyNote>No defaulters at this threshold.</EmptyNote>}
                {defaulters.map(d => {
                  const s = student(d.sid);
                  const plan = plans.find(p => p.studentId === d.sid && p.status === 'Active');
                  return (
                    <div key={d.sid} className="p-3 text-xs flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-ink">
                          {s.name} · {s.classLevel}-{s.section}
                        </p>
                        <p className="text-[11px] text-ink-muted">
                          {s.guardianName} · {s.guardianMobile} · oldest {d.oldest} days
                        </p>
                        {plan && (
                          <p className="text-[11px] text-sky-700">
                            Plan {plan.id}: {plan.parts.map(p => `${inr(p.amount)} on ${fmt(p.dueDate)}`).join(', ')}
                          </p>
                        )}
                        {doNotRemind[d.sid] && <p className="text-[11px] text-amber-700">Do not remind: {doNotRemind[d.sid]}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-right mr-2">
                          <Money value={d.balance} className="font-bold text-rose-600" />
                          <span className="block text-[10px] text-ink-muted">overdue</span>
                        </span>
                        {!plan && g.can('FEE-032', 'C') && (
                          <button onClick={() => { setPlanFor(d.sid); setPlanParts(3); }} className={btnSoft}>
                            Payment plan
                          </button>
                        )}
                        {g.can('FEE-031', 'U') && (
                        <button
                          onClick={() =>
                            setDoNotRemind(prev => {
                              const n = { ...prev };
                              if (n[d.sid]) delete n[d.sid];
                              else n[d.sid] = `Paused by ${me}`;
                              return n;
                            })
                          }
                          className={btnSoft}
                        >
                          {doNotRemind[d.sid] ? 'Resume reminders' : 'Pause reminders'}
                        </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel
              title="Reminder run"
              actions={
                <div className="flex gap-1">
                  <input type="date" value={reminderDate} onChange={e => setReminderDate(e.target.value)} className={inputCls} aria-label="Reminder date" />
                  <button onClick={sendReminders} disabled={!reminders.some(r => !r.suppressed) || !g.can('FEE-030', 'C')} title={g.why('FEE-030', 'C')} className={btnPrimary}>
                    Send
                  </button>
                </div>
              }
            >
              <p className="px-3 pt-2 text-[10px] text-ink-muted">Schedule: 3 days before the due date, on the due date, then 7 and 15 days after. Balances are as of {fmt(asOf)}.</p>
              <div className="divide-y divide-subtle">
                {reminders.length === 0 && <EmptyNote>No reminders fall on this date.</EmptyNote>}
                {reminders.map(r => (
                  <div key={`${r.invoiceNo}-${r.label}`} className="p-2.5 text-xs flex items-center justify-between gap-2">
                    <span>
                      <span className="font-semibold">{nameOf(r.studentId)}</span> · {r.label} · <Money value={r.balance} />
                    </span>
                    {r.suppressed ? (
                      <Badge className="bg-slate-100 text-slate-600 border-slate-200">Suppressed: {r.suppressed}</Badge>
                    ) : sentReminders.includes(`${r.invoiceNo}@${r.sendOn}`) ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Sent</Badge>
                    ) : (
                      <Badge className="bg-sky-50 text-sky-700 border-sky-200">Ready</Badge>
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <Panel
            title="Outstanding ledger"
            actions={
              <span className="flex items-center gap-2">
                <span className="text-[10px] text-ink-muted">{g.grant('FEE-028')?.condition}</span>
                <button onClick={exportLedger} disabled={!g.can('FEE-028', 'E')} title={g.why('FEE-028', 'E')} className={btnSoft}>
                  Export ledger
                </button>
              </span>
            }
          >
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead className="bg-slate-50 text-ink-soft">
                  <tr>
                    <Th>Student</Th>
                    <Th>Class</Th>
                    {AGEING_BUCKETS.map(b => (
                      <Th key={b.label} right>
                        {b.label}
                      </Th>
                    ))}
                    <Th right>Total</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {Array.from(new Set(openStates.map(s => s.invoice.studentId)))
                    .map(sid => ({ sid, total: balanceFor(sid) }))
                    .sort((a, b) => b.total - a.total)
                    .map(({ sid, total }) => (
                      <tr key={sid}>
                        <td className="cell font-semibold">{nameOf(sid)}</td>
                        <td className="cell">
                          {student(sid).classLevel}-{student(sid).section}
                        </td>
                        {AGEING_BUCKETS.map(b => (
                          <td key={b.label} className="cell text-right">
                            <Money value={statesFor(sid).filter(s => s.balance > 0 && ageingBucket(s.daysOverdue) === b.label).reduce((t, s) => t + s.balance, 0)} />
                          </td>
                        ))}
                        <td className="cell text-right">
                          <Money value={total} className="font-bold" />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* -------------------------------------------------------------- Recon */}
      {tab === 'recon' && (
        <div className="space-y-6">
          <Panel title={`Exceptions queue · ${exceptions.filter(x => !resolved[x.key]).length} open`}>
            <div className="divide-y divide-subtle">
              {exceptions.map(x => (
                <div key={x.key} className="p-3 text-xs flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <Badge className="bg-white text-ink-soft border-line-soft">{x.source}</Badge> {x.detail}
                  </span>
                  {resolved[x.key] ? (
                    <span className="text-emerald-700">Resolved: {resolved[x.key]}</span>
                  ) : resolveKey === x.key ? (
                    <span className="flex gap-1">
                      <input value={resolveNote} onChange={e => setResolveNote(e.target.value)} placeholder="Resolution note" className={inputCls} aria-label="Resolution note" />
                      <button
                        onClick={() => {
                          if (!resolveNote.trim()) return;
                          setResolved(prev => ({ ...prev, [x.key]: resolveNote.trim() }));
                          log('Exception resolved', `${x.key} · ${resolveNote.trim()}`);
                          setResolveKey(null);
                          setResolveNote('');
                        }}
                        className={btnPrimary}
                      >
                        Save
                      </button>
                    </span>
                  ) : g.can('FEE-035', 'U') ? (
                    <button onClick={() => setResolveKey(x.key)} className={btnSoft}>
                      Resolve
                    </button>
                  ) : (
                    <span className="text-ink-muted">Open</span>
                  )}
                </div>
              ))}
            </div>
          </Panel>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel title="Gateway settlement vs online payments">
              <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                <table className="data-table w-full">
                  <thead className="bg-slate-50 text-ink-soft sticky top-0">
                    <tr>
                      <Th>Gateway ref</Th>
                      <Th right>Collected</Th>
                      <Th right>Settled</Th>
                      <Th>UTR</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle">
                    {gatewayRows.map(r => (
                      <tr key={r.gatewayRef}>
                        <td className="cell font-mono">{r.gatewayRef}</td>
                        <td className="cell text-right">{r.payment ? <Money value={r.payment.amount} /> : '—'}</td>
                        <td className="cell text-right">{r.line ? <Money value={r.line.gross} /> : '—'}</td>
                        <td className="cell font-mono">{r.line?.utr ?? '—'}</td>
                        <td className="cell">
                          <Badge className={RECON_STYLE[r.status]}>{r.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
            <Panel title="Bank statement vs expected deposits">
              <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                <table className="data-table w-full">
                  <thead className="bg-slate-50 text-ink-soft sticky top-0">
                    <tr>
                      <Th>Expected</Th>
                      <Th right>Expected ₹</Th>
                      <Th right>On statement</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle">
                    {bankRows.map(r => (
                      <tr key={r.key}>
                        <td className="cell">{r.expected?.label ?? r.lines[0].narration}</td>
                        <td className="cell text-right">{r.expected ? <Money value={r.expected.amount} /> : '—'}</td>
                        <td className="cell text-right">{r.lines.length ? <Money value={r.net} /> : '—'}</td>
                        <td className="cell">
                          <Badge className={RECON_STYLE[r.status]}>{r.status === 'Not settled' ? 'Not on statement' : r.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------ Reports */}
      {tab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel
              title="Day-book"
              actions={<input type="date" value={dayBookDate} onChange={e => setDayBookDate(e.target.value)} className={inputCls} aria-label="Day-book date" />}
            >
              <div className="p-3 text-xs space-y-1">
                {byMode.map(m => (
                  <p key={m.mode} className="flex justify-between">
                    <span>
                      {m.mode} · {m.count} receipt(s)
                    </span>
                    <Money value={m.total} />
                  </p>
                ))}
                <p className="flex justify-between font-bold border-t border-line-soft pt-1">
                  <span>Total</span>
                  <Money value={byMode.reduce((s, m) => s + m.total, 0)} />
                </p>
                {dayBook.length === 0 && <EmptyNote>No receipts on this date.</EmptyNote>}
              </div>
            </Panel>

            <Panel title={`Collection vs target (${COLLECTION_TARGET_PCT}% of billed)`}>
              <div className="p-3 space-y-2 text-xs">
                {vsTarget.map(v => (
                  <div key={v.q.id}>
                    <div className="flex justify-between mb-0.5">
                      <span>{v.q.label}</span>
                      <span className="font-mono">
                        {v.billed ? `${inr(v.collected)} / ${inr(v.billed)} · ${v.pct}%` : 'Not billed yet'}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
                      <div className={`h-full ${v.pct >= COLLECTION_TARGET_PCT ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, v.pct)}%` }} />
                      <div className="absolute top-0 h-full w-0.5 bg-ink" style={{ left: `${COLLECTION_TARGET_PCT}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Revenue by head (money received)">
              <table className="data-table w-full">
                <tbody className="divide-y divide-subtle">
                  {headRevenue.map(r => (
                    <tr key={r.head.code}>
                      <td className="cell">{r.head.name}</td>
                      <td className="cell text-right"><Money value={r.total} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>

            <Panel title="Concessions granted">
              <table className="data-table w-full">
                <tbody className="divide-y divide-subtle">
                  {concessionReport.map(r => (
                    <tr key={r.type}>
                      <td className="cell">{r.type}</td>
                      <td className="cell">{r.students} student(s)</td>
                      <td className="cell text-right"><Money value={r.amount} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>

            <Panel title="GST on taxable heads">
              <table className="data-table w-full">
                <tbody className="divide-y divide-subtle">
                  {gstRows.map(r => (
                    <tr key={r.head.code}>
                      <td className="cell">
                        {r.head.name} ({r.head.gstRate}%)
                      </td>
                      <td className="cell text-right">Taxable <Money value={r.taxable} /></td>
                      <td className="cell text-right">GST <Money value={r.gst} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="p-3 text-[10px] text-ink-muted">Tuition, development, lab and transport are treated as exempt education services.</p>
            </Panel>

            <Panel
              title="Fee certificate (for income-tax claims)"
              actions={
                <div className="flex gap-1">
                  <select value={certStudent} onChange={e => setCertStudent(e.target.value)} className={inputCls} aria-label="Certificate student">
                    {students
                      .filter(s => !s.mergedInto)
                      .map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                  <button onClick={() => allowed('FEE-040', 'C') && setPrintCert(true)} disabled={!g.can('FEE-040', 'C')} title={g.why('FEE-040', 'C')} className={btnPrimary}>
                    Print
                  </button>
                </div>
              }
            >
              <FeeCertificate student={student(certStudent)} tuition={certificate.tuition} other={certificate.other} campus={selectedCampus.name} />
            </Panel>
          </div>

          <Panel
            title={`Audit trail · ${audit.length} action(s) this session`}
            actions={
              <button onClick={auditPack} disabled={!g.can('FEE-042', 'E')} title={g.why('FEE-042', 'E')} className={btnPrimary}>
                Export audit pack
              </button>
            }
          >
            <div className="divide-y divide-subtle max-h-[300px] overflow-y-auto">
              {audit.length === 0 && <EmptyNote>No actions yet.</EmptyNote>}
              {audit.map((a, i) => (
                <p key={i} className="p-2.5 text-xs">
                  <span className="font-mono text-ink-muted">{a.at}</span> · {a.actor} · <span className="font-semibold">{a.action}</span> · {a.detail}
                </p>
              ))}
            </div>
          </Panel>

          <PhaseNotice ids={['FEE-016']} phase="Phase 3" note="UPI autopay mandates arrive with the operations release." />
        </div>
      )}

      {/* ------------------------------------------------------------ Modals */}
      {receiptFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lumen-950/55 backdrop-blur-[2px]" onClick={() => setReceiptFor(null)}>
          <div className="bg-surface rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto ring-1 ring-lumen-950/10" onClick={e => e.stopPropagation()}>
            <div className="p-3 border-b border-line-soft flex justify-between items-center">
              <span className="text-sm font-bold text-ink">Receipt {receiptFor.receiptNo}</span>
              <div className="flex gap-2">
                <button onClick={() => setPrintReceipt(true)} className={btnPrimary}>
                  Print
                </button>
                <button onClick={() => setReceiptFor(null)} className={btnSoft}>
                  Close
                </button>
              </div>
            </div>
            <Receipt payment={payments.find(p => p.id === receiptFor.id) ?? receiptFor} student={student(receiptFor.studentId)} allocations={receiptAllocations(receiptFor)} credit={ledger.credit[receiptFor.studentId] ?? 0} campus={selectedCampus.name} />
          </div>
        </div>
      )}
      {printReceipt && receiptFor && (
        <PrintPortal onDone={() => setPrintReceipt(false)}>
          <Receipt payment={payments.find(p => p.id === receiptFor.id) ?? receiptFor} student={student(receiptFor.studentId)} allocations={receiptAllocations(receiptFor)} credit={ledger.credit[receiptFor.studentId] ?? 0} campus={selectedCampus.name} />
        </PrintPortal>
      )}
      {printCert && (
        <PrintPortal onDone={() => setPrintCert(false)}>
          <FeeCertificate student={student(certStudent)} tuition={certificate.tuition} other={certificate.other} campus={selectedCampus.name} />
        </PrintPortal>
      )}

      {cancelling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lumen-950/55 backdrop-blur-[2px]" onClick={() => setCancelling(null)}>
          <div className="bg-surface rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-2xl text-xs ring-1 ring-lumen-950/10" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-ink">Cancel receipt {cancelling.receiptNo}</h3>
            <p>
              {nameOf(cancelling.studentId)} · <Money value={cancelling.amount} /> · collected by {cancelling.collectedBy}
            </p>
            <input value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Reason" className={`${inputCls} w-full`} aria-label="Cancel reason" />
            <p className="text-ink-muted">The receipt number is kept and marked cancelled. The money it settled goes back to outstanding.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setCancelling(null)} className={btnSoft}>
                Keep
              </button>
              <button onClick={confirmCancel} className={btnDanger}>
                Cancel receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {planFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lumen-950/55 backdrop-blur-[2px]" onClick={() => setPlanFor(null)}>
          <div className="bg-surface rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-2xl text-xs ring-1 ring-lumen-950/10" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-ink">Payment plan · {nameOf(planFor)}</h3>
            <label className="flex items-center gap-2">
              Monthly parts
              <select value={planParts} onChange={e => setPlanParts(Number(e.target.value))} className={inputCls} aria-label="Plan parts">
                {[2, 3, 4, 6].map(n => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-ink-soft">Covers the overdue amount of <Money value={overdueFor(planFor)} />. Invoices not yet due are billed as normal.</p>
            {buildPlan(overdueFor(planFor), planParts, addDays(asOf, 5)).map(p => (
              <p key={p.dueDate} className="flex justify-between">
                <span>{fmt(p.dueDate)}</span>
                <Money value={p.amount} />
              </p>
            ))}
            <div className="flex justify-end gap-2">
              <button onClick={() => setPlanFor(null)} className={btnSoft}>
                Cancel
              </button>
              <button onClick={createPlan} className={btnPrimary}>
                Create plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Receipt: React.FC<{ payment: Payment; student: RosterStudent; allocations: { invoiceNo: string; head: string; amount: number }[]; credit: number; campus: string }> = ({
  payment,
  student,
  allocations,
  credit,
  campus,
}) => (
  <div className="p-6 text-[12px] text-ink bg-white">
    <div className="flex items-center gap-3 border-b-2 border-brand pb-2">
      <img src="/lumen-academy-logo.png" alt="" className="w-10 h-10 object-contain" />
      <div>
        <p className="font-extrabold tracking-wide">LUMEN ACADEMY · FEE RECEIPT</p>
        <p className="text-[11px] text-ink-soft">{campus}</p>
      </div>
      {payment.status === 'Cancelled' && <span className="ml-auto text-rose-600 font-extrabold border-2 border-rose-600 px-2 rotate-[-6deg]">CANCELLED</span>}
    </div>
    <div className="grid grid-cols-2 gap-1 mt-3 text-[11px]">
      <p>Receipt: <span className="font-mono font-bold">{payment.receiptNo}</span></p>
      <p className="text-right">Date: {fmt(payment.date)}</p>
      <p>Student: <span className="font-semibold">{student.name}</span></p>
      <p className="text-right">Adm. no: <span className="font-mono">{student.admissionNo}</span></p>
      <p>Class: {student.classLevel}-{student.section}</p>
      <p className="text-right">
        Mode: {payment.mode}
        {payment.cheque ? ` #${payment.cheque.number} (${payment.cheque.bank}) — ${payment.cheque.status}` : ''}
        {payment.gatewayRef ? ` · ${payment.gatewayRef}` : ''}
      </p>
    </div>
    <table className="w-full mt-3 border border-slate-300">
      <thead className="bg-slate-50">
        <tr>
          <th className="p-1.5 text-left">Invoice</th>
          <th className="p-1.5 text-left">Head</th>
          <th className="p-1.5 text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        {allocations.map((a, i) => (
          <tr key={i} className="border-t border-slate-200">
            <td className="p-1.5 font-mono">{a.invoiceNo}</td>
            <td className="p-1.5">{a.head === 'LATE' ? 'Late fee' : headByCode(a.head).name}</td>
            <td className="p-1.5 text-right font-mono"><Money value={a.amount} /></td>
          </tr>
        ))}
        {allocations.length === 0 && (
          <tr>
            <td colSpan={3} className="p-1.5 text-ink-muted">
              {payment.status === 'Success' && payment.cheque?.status !== 'Bounced' ? 'Held as advance credit' : 'No amounts settled by this payment'}
            </td>
          </tr>
        )}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-slate-400 font-bold">
          <td className="p-1.5" colSpan={2}>
            Total received
          </td>
          <td className="p-1.5 text-right font-mono"><Money value={payment.amount} /></td>
        </tr>
      </tfoot>
    </table>
    {credit > 0 && <p className="mt-2 text-[11px]">Advance credit on account: <Money value={credit} /></p>}
    {payment.cheque && payment.cheque.status !== 'Cleared' && <p className="mt-1 text-[11px] text-amber-700">Subject to realisation of the cheque.</p>}
    <p className="mt-6 text-right text-[11px]">Received by {payment.collectedBy}</p>
  </div>
);

const FeeCertificate: React.FC<{ student: RosterStudent; tuition: number; other: number; campus: string }> = ({ student, tuition, other, campus }) => (
  <div className="p-6 text-[12px] leading-relaxed text-ink bg-white">
    <p className="text-center font-extrabold tracking-wide">LUMEN ACADEMY · {campus}</p>
    <p className="text-center font-bold mt-1 underline">FEE CERTIFICATE · FY 2024–25</p>
    <p className="mt-3">
      This is to certify that {student.name} (admission no. {student.admissionNo}), studying in Class {student.classLevel}-{student.section}, has paid the following
      fees to this school between 1 April 2024 and {fmt(FEES_AS_OF)}:
    </p>
    <table className="w-full mt-3 border border-slate-300">
      <tbody>
        <tr className="border-b border-slate-200">
          <td className="p-1.5">Tuition fee</td>
          <td className="p-1.5 text-right font-mono font-bold"><Money value={tuition} /></td>
        </tr>
        <tr>
          <td className="p-1.5">Other fees (not tuition)</td>
          <td className="p-1.5 text-right font-mono"><Money value={other} /></td>
        </tr>
      </tbody>
    </table>
    <p className="mt-2 text-[11px] text-ink-soft">Only the tuition fee is shown separately for income-tax deduction purposes. Late fees are excluded.</p>
    <p className="mt-6 text-right font-bold">Accounts Officer</p>
  </div>
);
