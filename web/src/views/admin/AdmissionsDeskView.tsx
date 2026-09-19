import React, { useId, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FeatureTags, PhaseNotice, downloadCsv } from '../../components/common/FeatureTags';
import { PrintPortal } from '../../components/common/PrintPortal';
import {
  ACADEMIC_MONTHS,
  ADMISSIONS_AS_OF,
  Application,
  CLASS_CONFIG,
  CONSENT_PURPOSES,
  COUNSELLORS,
  DECLINE_REASONS,
  Enquiry,
  INITIAL_APPLICATIONS,
  INITIAL_ENQUIRIES,
  Interaction,
  LAST_CYCLE_SAME_POINT,
  LOST_REASONS,
  QUOTAS,
  Quota,
  REJECT_REASONS,
  SOURCES,
  SOURCE_COSTS,
  SOURCE_FUNNEL,
  STAGE_DAYS,
  Source,
  Stage,
  addDays,
  daysBetween,
  decide,
  documentGate,
  enrol,
  expireOffers,
  feeDue,
  findSibling,
  isDuplicateEnquiry,
  isValidIndianMobile,
  meritList,
  missingDocs,
  nextApplicationNo,
  nextCounsellor,
  promoteWaitlist,
  requiredDocs,
  seatStatus,
  waitlistFor,
} from '../../data/admissions';
import { Figure } from '../../components/common/Figure';
import { EmptyNote } from '../../components/common/EmptyNote';
import { DialogShell, Modal } from '../../components/common/ui';

type Tab = 'pipeline' | 'enquiries' | 'applications' | 'decisions' | 'offers' | 'analytics';

const TABS: { id: Tab; label: string; icon: string; ids: string[] }[] = [
  { id: 'pipeline', label: 'Pipeline', icon: 'view_kanban', ids: ['ADM-061'] },
  { id: 'enquiries', label: 'Enquiries', icon: 'contact_phone', ids: ['ADM-001', 'ADM-003', 'ADM-004', 'ADM-006', 'ADM-007', 'ADM-008', 'ADM-009', 'ADM-010', 'ADM-011'] },
  { id: 'applications', label: 'Applications & Documents', icon: 'folder_shared', ids: ['ADM-016', 'ADM-017', 'ADM-018', 'ADM-022', 'ADM-026', 'ADM-027', 'ADM-028', 'ADM-031', 'ADM-032', 'ADM-033', 'ADM-034', 'ADM-035', 'ADM-036', 'ADM-037', 'ADM-040', 'ADM-041'] },
  { id: 'decisions', label: 'Seats & Decisions', icon: 'event_seat', ids: ['ADM-043', 'ADM-044', 'ADM-045', 'ADM-046', 'ADM-047', 'ADM-048', 'ADM-049'] },
  { id: 'offers', label: 'Offers & Enrolment', icon: 'mark_email_read', ids: ['ADM-038', 'ADM-050', 'ADM-051', 'ADM-052', 'ADM-053', 'ADM-054', 'ADM-055', 'ADM-056', 'ADM-057', 'ADM-059'] },
  { id: 'analytics', label: 'Analytics', icon: 'monitoring', ids: ['ADM-061', 'ADM-062', 'ADM-063', 'ADM-064', 'ADM-065', 'ADM-066'] },
];

const PIPELINE: Stage[] = ['Document check', 'Assessment', 'Decision', 'Waitlisted', 'Offer', 'Enrolled'];
const CLOSED: Stage[] = ['Rejected', 'Withdrawn'];

const STAGE_STYLE: Record<Stage, string> = {
  'Document check': 'bg-slate-100 text-slate-700 border-slate-300',
  Assessment: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Decision: 'bg-amber-50 text-amber-700 border-amber-200',
  Waitlisted: 'bg-orange-50 text-orange-700 border-orange-200',
  Offer: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Enrolled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  Withdrawn: 'bg-slate-100 text-slate-600 border-slate-200',
};

const DOC_STYLE: Record<string, string> = {
  Missing: 'text-slate-500',
  Uploaded: 'text-amber-700',
  Verified: 'text-emerald-700',
  Rejected: 'text-rose-700',
};

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const fmt = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

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

const inputCls = 'w-full text-xs border border-line rounded-lg px-2 py-1.5 bg-white';
const btn = 'text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40';
const btnPrimary = `${btn} bg-brand text-white hover:bg-brand-strong`;
const btnSoft = `${btn} bg-slate-100 hover:bg-slate-200 text-ink`;

export const AdmissionsDeskView: React.FC<{ initialTab?: Tab }> = ({ initialTab = 'pipeline' }) => {
  const { addToast, selectedCampus } = useApp();
  const newAppFormId = useId();
  const letterTitleId = useId();
  const asOf = ADMISSIONS_AS_OF;
  const [tab, setTab] = useState<Tab>(initialTab);
  const [enquiries, setEnquiries] = useState<Enquiry[]>(INITIAL_ENQUIRIES);
  const [apps, setApps] = useState<Application[]>(INITIAL_APPLICATIONS);

  // Enquiry form
  const blankEnquiry = { child: '', dob: '', gender: 'Female' as Enquiry['gender'], classApplied: CLASS_CONFIG[0].classApplied, guardian: '', mobile: '', source: 'Walk-in' as Source };
  const [enqForm, setEnqForm] = useState(blankEnquiry);
  const [dupMatch, setDupMatch] = useState<Enquiry | null>(null);
  const [enqFilter, setEnqFilter] = useState<'Open' | 'Converted' | 'Lost' | 'All'>('Open');
  const [expandedEnq, setExpandedEnq] = useState<string | null>(null);
  const [logForm, setLogForm] = useState<{ channel: Interaction['channel']; outcome: string; next: string }>({ channel: 'Call', outcome: '', next: addDays(asOf, 3) });
  const [losing, setLosing] = useState<Enquiry | null>(null);
  const [lostReason, setLostReason] = useState('');

  // Applications
  const [selectedApp, setSelectedApp] = useState<string>(INITIAL_APPLICATIONS[2].appNo);
  const [rejectingDoc, setRejectingDoc] = useState<string | null>(null);
  const [docReason, setDocReason] = useState('');
  const [showNewApp, setShowNewApp] = useState(false);
  const [newApp, setNewApp] = useState({ child: '', dob: '', gender: 'Female' as Application['gender'], classApplied: CLASS_CONFIG[0].classApplied, quota: 'General' as Quota, guardian: '', mobile: '', joiningMonth: 1, declaration: false });
  const [newConsent, setNewConsent] = useState<Record<string, boolean>>(Object.fromEntries(CONSENT_PURPOSES.map(p => [p, p === 'Admission processing'])));
  const [scoreDraft, setScoreDraft] = useState({ test: '', interview: '' });
  const [reminderLog, setReminderLog] = useState<{ appNo: string; at: string; docs: string[] }[]>([]);

  // Decisions
  const [decisionClass, setDecisionClass] = useState('Class 6');
  const [bulkSel, setBulkSel] = useState<Set<string>>(new Set());
  const [bulkDecision, setBulkDecision] = useState<'Select' | 'Waitlist' | 'Reject'>('Waitlist');
  const [decisionReason, setDecisionReason] = useState(REJECT_REASONS[0]);

  // Offers
  const [declining, setDeclining] = useState<Application | null>(null);
  const [declineReason, setDeclineReason] = useState(DECLINE_REASONS[0]);
  const [letterFor, setLetterFor] = useState<Application | null>(null);
  const [printing, setPrinting] = useState(false);

  const updateApp = (appNo: string, patch: (a: Application) => Application) => setApps(prev => prev.map(a => (a.appNo === appNo ? patch(a) : a)));

  // -------------------------------------------------------------------------
  // Enquiries
  // -------------------------------------------------------------------------

  const saveEnquiry = (force: boolean) => {
    const f = enqForm;
    if (!f.child.trim() || !f.guardian.trim() || !f.dob) {
      addToast('Child name, date of birth and guardian are required', 'warning');
      return;
    }
    if (!isValidIndianMobile(f.mobile)) {
      addToast('Enter a valid 10-digit Indian mobile number', 'warning');
      return;
    }
    const dup = enquiries.find(e => e.status !== 'Lost' && isDuplicateEnquiry(e, f));
    if (dup && !force) {
      setDupMatch(dup);
      return;
    }
    const seq = enquiries.reduce((m, e) => Math.max(m, Number(e.id.slice(4))), 0) + 1;
    const created: Enquiry = {
      id: `ENQ-${String(seq).padStart(4, '0')}`,
      child: f.child.trim(),
      dob: f.dob,
      gender: f.gender,
      classApplied: f.classApplied,
      guardian: f.guardian.trim(),
      mobile: f.mobile.trim(),
      source: f.source,
      counsellor: nextCounsellor(enquiries),
      nextFollowUp: addDays(asOf, 2),
      status: 'Open',
      interactions: [{ at: asOf, channel: f.source === 'Walk-in' ? 'Visit' : 'Call', outcome: 'Enquiry registered' }],
    };
    setEnquiries(prev => [created, ...prev]);
    setEnqForm(blankEnquiry);
    setDupMatch(null);
    addToast(`${created.id} created and assigned to ${created.counsellor}`, 'success', `Follow up by ${fmt(created.nextFollowUp)}`);
  };

  const mergeDuplicate = () => {
    if (!dupMatch) return;
    setEnquiries(prev =>
      prev.map(e =>
        e.id === dupMatch.id
          ? { ...e, interactions: [...e.interactions, { at: asOf, channel: 'Call', outcome: `Repeat enquiry via ${enqForm.source} merged` }] }
          : e
      )
    );
    addToast(`Merged into ${dupMatch.id}`, 'info', 'Both interaction histories are kept');
    setDupMatch(null);
    setEnqForm(blankEnquiry);
  };

  const logInteraction = (id: string) => {
    if (!logForm.outcome.trim()) {
      addToast('Describe the outcome of the interaction', 'warning');
      return;
    }
    setEnquiries(prev =>
      prev.map(e => (e.id === id ? { ...e, nextFollowUp: logForm.next, interactions: [...e.interactions, { at: asOf, channel: logForm.channel, outcome: logForm.outcome.trim() }] } : e))
    );
    setLogForm({ channel: 'Call', outcome: '', next: addDays(asOf, 3) });
    addToast('Interaction logged', 'success');
  };

  const convertEnquiry = (e: Enquiry) => {
    const appNo = nextApplicationNo(apps);
    const sibling = findSibling(e.mobile);
    const quota: Quota = sibling ? 'Sibling' : 'General';
    const created: Application = {
      appNo,
      enquiryId: e.id,
      child: e.child,
      dob: e.dob,
      gender: e.gender,
      classApplied: e.classApplied,
      quota,
      guardian: e.guardian,
      mobile: e.mobile,
      origin: e.source === 'Website' ? 'Online' : 'Offline',
      siblingOf: sibling,
      consent: CONSENT_PURPOSES.map(purpose => ({ purpose, granted: false })),
      declarationAccepted: false,
      docs: requiredDocs(e.classApplied, quota).map(type => ({ type, status: 'Missing' })),
      submittedOn: asOf,
      stage: 'Document check',
      payment: { amount: 0, paid: 0, status: 'Not started' },
      joiningMonth: 1,
    };
    setApps(prev => [created, ...prev]);
    setEnquiries(prev => prev.map(x => (x.id === e.id ? { ...x, status: 'Converted' } : x)));
    setSelectedApp(appNo);
    addToast(`${e.id} converted to ${appNo}`, 'success', sibling ? `Sibling found: ${sibling}` : 'All captured details carried forward');
  };

  const confirmLost = () => {
    if (!losing || !lostReason) {
      addToast('Choose a reason before closing the enquiry', 'warning');
      return;
    }
    setEnquiries(prev => prev.map(e => (e.id === losing.id ? { ...e, status: 'Lost', lostReason } : e)));
    addToast(`${losing.id} closed as lost`, 'info', lostReason);
    setLosing(null);
    setLostReason('');
  };

  const visibleEnquiries = enquiries.filter(e => enqFilter === 'All' || e.status === enqFilter);
  const overdue = enquiries.filter(e => e.status === 'Open' && e.nextFollowUp < asOf).length;
  const dueToday = enquiries.filter(e => e.status === 'Open' && e.nextFollowUp === asOf).length;

  // -------------------------------------------------------------------------
  // Applications
  // -------------------------------------------------------------------------

  const current = apps.find(a => a.appNo === selectedApp);

  const setDoc = (appNo: string, type: string, patch: Partial<Application['docs'][number]>) =>
    updateApp(appNo, a => ({
      ...a,
      docs: a.docs.some(d => d.type === type) ? a.docs.map(d => (d.type === type ? { ...d, ...patch } : d)) : [...a.docs, { type, status: 'Missing', ...patch }],
    }));

  const sendReminder = (a: Application) => {
    const list = missingDocs(a);
    if (!list.length) {
      addToast('Nothing is missing for this application', 'info');
      return;
    }
    setReminderLog(prev => [{ appNo: a.appNo, at: asOf, docs: list }, ...prev]);
    addToast(`Reminder sent to ${a.guardian}`, 'success', `Missing: ${list.join(', ')}`);
  };

  const advanceToAssessment = (a: Application) => {
    const gate = documentGate(a, asOf);
    if (!gate.passed) {
      addToast('Blocked by the document check', 'error', `Still needed: ${gate.blocking.join(', ')}`);
      return;
    }
    if (!a.declarationAccepted || !a.consent.find(c => c.purpose === 'Admission processing')?.granted) {
      addToast('Declaration and admission-processing consent are required', 'error', 'ADM-026 / ADM-027');
      return;
    }
    updateApp(a.appNo, x => ({ ...x, stage: 'Assessment' }));
    addToast(`${a.appNo} moved to assessment`, 'success', gate.conditional.length ? `Conditional: ${gate.conditional.join(', ')}` : undefined);
  };

  const saveScores = (a: Application) => {
    const test = Number(scoreDraft.test);
    const interview = Number(scoreDraft.interview);
    const valid = (v: string, n: number) => v.trim() !== '' && Number.isFinite(n) && n >= 0 && n <= 100;
    if (!valid(scoreDraft.test, test) || !valid(scoreDraft.interview, interview)) {
      addToast('Scores must be numbers from 0 to 100', 'warning');
      return;
    }
    updateApp(a.appNo, x => ({ ...x, testScore: test, interviewScore: interview, stage: 'Decision' }));
    setScoreDraft({ test: '', interview: '' });
    addToast(`${a.appNo} scored and sent for decision`, 'success');
  };

  const createOfflineApplication = (e: React.FormEvent) => {
    e.preventDefault();
    const f = newApp;
    if (!f.child.trim() || !f.dob || !f.guardian.trim()) {
      addToast('Child name, date of birth and guardian are required', 'warning');
      return;
    }
    if (!isValidIndianMobile(f.mobile)) {
      addToast('Enter a valid 10-digit Indian mobile number', 'warning');
      return;
    }
    if (!f.declaration || !newConsent['Admission processing']) {
      addToast('The guardian must sign the declaration and consent to admission processing', 'warning');
      return;
    }
    const cfg = CLASS_CONFIG.find(c => c.classApplied === f.classApplied)!;
    if (cfg.quotas[f.quota] === 0) {
      addToast(`${f.classApplied} has no ${f.quota} seats`, 'warning');
      return;
    }
    const appNo = nextApplicationNo(apps);
    const sibling = findSibling(f.mobile);
    const created: Application = {
      appNo,
      child: f.child.trim(),
      dob: f.dob,
      gender: f.gender,
      classApplied: f.classApplied,
      quota: f.quota,
      guardian: f.guardian.trim(),
      mobile: f.mobile.trim(),
      origin: 'Offline',
      siblingOf: sibling,
      consent: CONSENT_PURPOSES.map(purpose => ({ purpose, granted: Boolean(newConsent[purpose]) })),
      declarationAccepted: true,
      docs: requiredDocs(f.classApplied, f.quota).map(type => ({ type, status: 'Missing' })),
      submittedOn: asOf,
      stage: 'Document check',
      payment: { amount: 0, paid: 0, status: 'Not started' },
      joiningMonth: f.joiningMonth,
    };
    setApps(prev => [created, ...prev]);
    setSelectedApp(appNo);
    setShowNewApp(false);
    addToast(`${appNo} created from a paper form`, 'success', sibling ? `Sibling found: ${sibling}` : 'Marked as offline-origin');
  };

  // -------------------------------------------------------------------------
  // Decisions
  // -------------------------------------------------------------------------

  const classMerit = meritList(apps.filter(a => a.classApplied === decisionClass));
  const decidable = (a: Application) => a.stage === 'Decision' || a.stage === 'Waitlisted';

  const runDecision = (appNo: string, decision: 'Select' | 'Waitlist' | 'Reject', principal = false) => {
    const r = decide(apps, appNo, decision, decision === 'Reject' ? decisionReason : '', principal, asOf);
    if ('error' in r) {
      addToast(r.error, 'error');
      return;
    }
    setApps(r.apps);
    addToast(r.message, 'success');
  };

  const runBulk = () => {
    let working = apps;
    let done = 0;
    const failed: string[] = [];
    [...bulkSel].forEach(appNo => {
      const r = decide(working, appNo, bulkDecision, bulkDecision === 'Reject' ? decisionReason : '', false, asOf);
      if ('error' in r) failed.push(`${appNo}: ${r.error}`);
      else {
        working = r.apps;
        done++;
      }
    });
    setApps(working);
    setBulkSel(new Set());
    addToast(`Bulk ${bulkDecision.toLowerCase()}: ${done} applied, ${failed.length} failed`, failed.length ? 'warning' : 'success', failed.join(' · ') || undefined);
  };

  // -------------------------------------------------------------------------
  // Offers & enrolment
  // -------------------------------------------------------------------------

  const offerRows = apps.filter(a => a.offer && (a.stage === 'Offer' || a.stage === 'Enrolled' || a.offer.response));

  const runExpiry = () => {
    const r = expireOffers(apps, asOf);
    setApps(r.apps);
    addToast(
      r.lapsed.length ? `${r.lapsed.length} offer(s) lapsed` : 'No offers past their deadline',
      r.lapsed.length ? 'warning' : 'info',
      r.promoted.length ? `Waitlist promoted: ${r.promoted.join(', ')}` : undefined
    );
  };

  const accept = (a: Application) => {
    updateApp(a.appNo, x => ({ ...x, offer: { ...x.offer!, response: 'Accepted', readOn: x.offer!.readOn ?? asOf }, payment: { ...x.payment, amount: feeDue(x) } }));
    addToast(`${a.child} accepted the offer`, 'success', `Fee due ${rupees(feeDue(a))}`);
  };

  const confirmDecline = () => {
    if (!declining) return;
    const declined = apps.map(x =>
      x.appNo === declining.appNo ? { ...x, stage: 'Withdrawn' as Stage, decisionReason: `Offer declined: ${declineReason}`, offer: { ...x.offer!, response: 'Declined' as const } } : x
    );
    const r = promoteWaitlist(declined, declining.classApplied, declining.quota, asOf);
    setApps(r.apps);
    addToast(`${declining.child} declined — seat released`, 'info', r.promoted.length ? `Offer sent to ${r.promoted.join(', ')}` : 'No one waiting in this quota');
    setDeclining(null);
  };

  const recordPayment = (a: Application, fraction: 0.5 | 1) => {
    const due = feeDue(a);
    const paid = Math.min(due, a.payment.paid + Math.round(due * fraction));
    updateApp(a.appNo, x => ({ ...x, payment: { amount: due, paid, status: 'Initiated' } }));
    addToast(`${rupees(paid)} of ${rupees(due)} received for ${a.appNo}`, 'info', 'Seat confirms only after the payment is realised');
  };

  const markRealised = (a: Application) => {
    if (a.payment.paid < feeDue(a)) {
      addToast('The full fee has not been received', 'warning', `${rupees(a.payment.paid)} of ${rupees(feeDue(a))}`);
      return;
    }
    updateApp(a.appNo, x => ({ ...x, payment: { ...x.payment, status: 'Realised' } }));
    addToast(`Payment realised for ${a.appNo} — seat confirmed`, 'success');
  };

  const runEnrol = (a: Application) => {
    const r = enrol(apps, a.appNo, asOf);
    if ('error' in r) {
      addToast(r.error, 'error');
      return;
    }
    setApps(r.apps);
    const carried = a.docs.filter(d => d.status === 'Verified').length;
    addToast(`${a.child} enrolled as ${r.admissionNo}`, 'success', `Section ${r.section}, roll ${r.rollNo} · ${carried} verified documents moved to the student record · parent login sent to ${a.mobile}`);
  };

  const exportApplications = () => {
    downloadCsv(
      `Applications_${selectedCampus.code}_${asOf}.csv`,
      ['Application', 'Child', 'Class', 'Quota', 'Stage', 'Origin', 'Merit', 'Admission no'],
      apps.map(a => [a.appNo, a.child, a.classApplied, a.quota, a.stage, a.origin, a.testScore !== undefined && a.interviewScore !== undefined ? Math.round((a.testScore * 0.7 + a.interviewScore * 0.3) * 10) / 10 : '', a.enrolment?.admissionNo ?? ''])
    );
    addToast(`Exported ${apps.length} applications`, 'success', 'Export event logged — AUD-003');
  };

  // -------------------------------------------------------------------------
  // Analytics
  // -------------------------------------------------------------------------

  const analytics = useMemo(() => {
    const sources = SOURCES.map(s => {
      const f = SOURCE_FUNNEL[s];
      const cost = SOURCE_COSTS[s];
      return { source: s, ...f, conversion: Math.round((f.enrolled / f.enquiries) * 1000) / 10, cost, costPerEnrolment: f.enrolled ? Math.round(cost / f.enrolled) : null };
    });
    const totals = sources.reduce((t, s) => ({ enquiries: t.enquiries + s.enquiries, applications: t.applications + s.applications, enrolled: t.enrolled + s.enrolled }), { enquiries: 0, applications: 0, enrolled: 0 });
    const offersNow = apps.filter(a => a.offer).length + 150;
    const counsellors = COUNSELLORS.map(c => {
      const mine = enquiries.filter(e => e.counsellor === c);
      const converted = mine.filter(e => e.status === 'Converted').length;
      return {
        counsellor: c,
        handled: mine.length,
        converted,
        rate: mine.length ? Math.round((converted / mine.length) * 100) : 0,
        overdue: mine.filter(e => e.status === 'Open' && e.nextFollowUp < asOf).length,
      };
    });
    const losses: Record<string, number> = {};
    enquiries.filter(e => e.lostReason).forEach(e => (losses[e.lostReason!] = (losses[e.lostReason!] ?? 0) + 1));
    apps.filter(a => a.decisionReason && CLOSED.includes(a.stage)).forEach(a => (losses[a.decisionReason!] = (losses[a.decisionReason!] ?? 0) + 1));
    const lossList = Object.entries(losses).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const byStage = [...PIPELINE, ...CLOSED].map(s => ({ stage: s, count: apps.filter(a => a.stage === s).length }));
    return { sources, totals, offersNow, counsellors, lossList, byStage };
  }, [apps, enquiries, asOf]);

  const yoy = [
    { label: 'Enquiries', now: analytics.totals.enquiries, last: LAST_CYCLE_SAME_POINT.enquiries },
    { label: 'Applications', now: analytics.totals.applications, last: LAST_CYCLE_SAME_POINT.applications },
    { label: 'Offers', now: analytics.offersNow, last: LAST_CYCLE_SAME_POINT.offers },
    { label: 'Enrolled', now: analytics.totals.enrolled, last: LAST_CYCLE_SAME_POINT.enrolled },
  ];

  const kpis = [
    { label: 'Open enquiries', value: enquiries.filter(e => e.status === 'Open').length, sub: `${overdue} overdue · ${dueToday} due today` },
    { label: 'In document check', value: apps.filter(a => a.stage === 'Document check').length, sub: `${apps.filter(a => !documentGate(a, asOf).passed && a.stage === 'Document check').length} blocked` },
    { label: 'Awaiting decision', value: apps.filter(a => a.stage === 'Decision').length, sub: `${apps.filter(a => a.pendingPrincipalApproval).length} need Principal` },
    { label: 'Live offers', value: apps.filter(a => a.stage === 'Offer' && !a.offer?.response).length, sub: `${apps.filter(a => a.stage === 'Offer' && a.offer && !a.offer.response && a.offer.deadline < asOf).length} past deadline` },
    { label: 'Enrolled this cycle', value: apps.filter(a => a.stage === 'Enrolled').length, sub: 'from this desk' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-accent-ink uppercase tracking-[0.14em] mb-1.5">
            <span className="material-symbols-outlined text-sm">how_to_reg</span>
            <span>Module 12 · Admissions (ADM)</span>
          </div>
          <h1 className="text-2xl md:text-[28px] leading-tight font-bold font-display tracking-tight text-ink">Admissions Desk · AY 2025–26</h1>
          <p className="text-xs text-ink-soft mt-1">
            {selectedCampus.name} · status as of {fmt(asOf)}
          </p>
        </div>
        <button onClick={exportApplications} className={`${btnSoft} flex items-center gap-1 self-start sm:self-auto`}>
          <span className="material-symbols-outlined text-sm">download</span>
          Export applications
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="bg-surface rounded-2xl border border-line-soft p-3 shadow-sm">
            <p className="text-2xl font-bold text-ink">{k.value}</p>
            <p className="text-[11px] font-semibold text-ink">{k.label}</p>
            <p className="text-[10px] text-ink-muted">{k.sub}</p>
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

      {/* ------------------------------------------------------------------ */}
      {tab === 'pipeline' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {PIPELINE.map(stage => {
              const items = apps.filter(a => a.stage === stage);
              return (
                <div key={stage} className="bg-slate-50 rounded-2xl border border-line-soft p-2 space-y-2 min-h-[160px]">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold text-ink">{stage}</span>
                    <span className="text-[10px] font-mono text-ink-muted">{items.length}</span>
                  </div>
                  {items.map(a => (
                    <button
                      key={a.appNo}
                      onClick={() => {
                        setSelectedApp(a.appNo);
                        setTab(a.stage === 'Offer' || a.stage === 'Enrolled' ? 'offers' : a.stage === 'Decision' || a.stage === 'Waitlisted' ? 'decisions' : 'applications');
                        if (a.stage === 'Decision' || a.stage === 'Waitlisted') setDecisionClass(a.classApplied);
                      }}
                      className="w-full text-left bg-surface rounded-xl border border-line-soft p-2 hover:border-brand transition-colors"
                    >
                      <p className="text-xs font-semibold text-ink truncate">{a.child}</p>
                      <p className="text-[10px] text-ink-muted">
                        {a.appNo} · {a.classApplied}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge className="bg-white text-ink-soft border-line-soft">{a.quota}</Badge>
                        {a.origin === 'Offline' && <Badge className="bg-slate-100 text-slate-600 border-slate-200">Paper form</Badge>}
                        {a.pendingPrincipalApproval && <Badge className="bg-amber-50 text-amber-700 border-amber-200">Principal</Badge>}
                        {a.offer?.response === 'Accepted' && a.stage === 'Offer' && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Accepted</Badge>}
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-ink-muted">
            Closed: {apps.filter(a => a.stage === 'Rejected').length} rejected · {apps.filter(a => a.stage === 'Withdrawn').length} withdrawn or lapsed. Click a card to open it.
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {tab === 'enquiries' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Panel title="Quick enquiry (front desk)">
            <form
              onSubmit={e => {
                e.preventDefault();
                saveEnquiry(false);
              }}
              className="p-3 space-y-2 text-xs"
            >
              <input value={enqForm.child} onChange={e => setEnqForm({ ...enqForm, child: e.target.value })} placeholder="Child’s name" className={inputCls} aria-label="Child name" />
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="block text-[10px] font-semibold text-ink-soft">Date of birth</span>
                  <input type="date" value={enqForm.dob} onChange={e => setEnqForm({ ...enqForm, dob: e.target.value })} className={inputCls} />
                </label>
                <label className="block">
                  <span className="block text-[10px] font-semibold text-ink-soft">Class</span>
                  <select value={enqForm.classApplied} onChange={e => setEnqForm({ ...enqForm, classApplied: e.target.value })} className={inputCls}>
                    {CLASS_CONFIG.map(c => (
                      <option key={c.classApplied}>{c.classApplied}</option>
                    ))}
                  </select>
                </label>
              </div>
              <select value={enqForm.gender} onChange={e => setEnqForm({ ...enqForm, gender: e.target.value as Enquiry['gender'] })} className={inputCls} aria-label="Gender">
                <option>Female</option>
                <option>Male</option>
              </select>
              <input value={enqForm.guardian} onChange={e => setEnqForm({ ...enqForm, guardian: e.target.value })} placeholder="Guardian’s name" className={inputCls} aria-label="Guardian name" />
              <input value={enqForm.mobile} onChange={e => setEnqForm({ ...enqForm, mobile: e.target.value })} placeholder="Guardian mobile" inputMode="tel" className={inputCls} aria-label="Guardian mobile" />
              <label className="block">
                <span className="block text-[10px] font-semibold text-ink-soft">Source</span>
                <select value={enqForm.source} onChange={e => setEnqForm({ ...enqForm, source: e.target.value as Source })} className={inputCls}>
                  {SOURCES.map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <button type="submit" className={`${btnPrimary} w-full`}>
                Save enquiry
              </button>
              <p className="text-[10px] text-ink-muted">Assigned automatically to the counsellor with the fewest open enquiries.</p>
            </form>
            {dupMatch && (
              <div className="m-3 p-3 rounded-xl border border-amber-300 bg-amber-50 text-xs space-y-2">
                <p className="font-semibold text-amber-800">
                  Possible duplicate: {dupMatch.id} · {dupMatch.child} ({fmt(dupMatch.dob)}) · {dupMatch.status}
                </p>
                <p className="text-[11px] text-amber-800">Same child name, date of birth and guardian mobile.</p>
                <div className="flex gap-2">
                  <button onClick={mergeDuplicate} className={btnPrimary}>
                    Merge into {dupMatch.id}
                  </button>
                  <button onClick={() => saveEnquiry(true)} className={btnSoft}>
                    Save as new
                  </button>
                </div>
              </div>
            )}
          </Panel>

          <Panel
            className="lg:col-span-2"
            title={`Enquiries · ${overdue} overdue follow-up(s)`}
            actions={
              <select value={enqFilter} onChange={e => setEnqFilter(e.target.value as typeof enqFilter)} className="text-xs border border-line rounded-lg px-2 py-1 bg-white">
                {['Open', 'Converted', 'Lost', 'All'].map(o => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            }
          >
            <div className="divide-y divide-subtle">
              {visibleEnquiries.length === 0 && <EmptyNote>No enquiries in this view.</EmptyNote>}
              {visibleEnquiries.map(e => {
                const isOverdue = e.status === 'Open' && e.nextFollowUp < asOf;
                const open = expandedEnq === e.id;
                return (
                  <div key={e.id} className="p-3 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <button onClick={() => setExpandedEnq(open ? null : e.id)} className="flex-1 text-left min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono font-bold text-brand">{e.id}</span>
                          <span className="font-semibold text-ink">{e.child}</span>
                          <Badge className="bg-white text-ink-soft border-line-soft">{e.source}</Badge>
                          {isOverdue && <Badge className="bg-rose-50 text-rose-700 border-rose-200">Overdue</Badge>}
                          {e.status === 'Open' && e.nextFollowUp === asOf && <Badge className="bg-amber-50 text-amber-700 border-amber-200">Due today</Badge>}
                          {e.status !== 'Open' && <Badge className="bg-slate-100 text-slate-600 border-slate-200">{e.status}</Badge>}
                        </div>
                        <p className="text-[11px] text-ink-muted mt-0.5">
                          {e.classApplied} · {e.guardian} · {e.mobile} · {e.counsellor}
                          {e.status === 'Open' && ` · follow up ${fmt(e.nextFollowUp)}`}
                          {e.lostReason && ` · ${e.lostReason}`}
                        </p>
                      </button>
                      {e.status === 'Open' && (
                        <div className="flex gap-1">
                          <button onClick={() => setLosing(e)} className={btnSoft}>
                            Mark lost
                          </button>
                          <button onClick={() => convertEnquiry(e)} className={btnPrimary}>
                            Convert
                          </button>
                        </div>
                      )}
                    </div>
                    {open && (
                      <div className="mt-2 ml-1 pl-3 border-l-2 border-line space-y-2">
                        {e.utm && (
                          <p className="text-[11px] text-ink-soft">
                            UTM · campaign <span className="font-mono">{e.utm.campaign}</span> · medium <span className="font-mono">{e.utm.medium}</span> · source{' '}
                            <span className="font-mono">{e.utm.source}</span>
                          </p>
                        )}
                        {e.interactions.length === 0 && <EmptyNote>No interactions yet.</EmptyNote>}
                        {e.interactions.map((i, idx) => (
                          <p key={idx} className="text-[11px]">
                            <span className="font-mono text-ink-muted">{fmt(i.at)}</span> · <span className="font-semibold">{i.channel}</span> · {i.outcome}
                          </p>
                        ))}
                        {e.status === 'Open' && (
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                            <select value={logForm.channel} onChange={ev => setLogForm({ ...logForm, channel: ev.target.value as Interaction['channel'] })} className={inputCls}>
                              {['Call', 'Visit', 'WhatsApp', 'Email'].map(c => (
                                <option key={c}>{c}</option>
                              ))}
                            </select>
                            <input value={logForm.outcome} onChange={ev => setLogForm({ ...logForm, outcome: ev.target.value })} placeholder="Outcome" className={`${inputCls} sm:col-span-2`} aria-label="Interaction outcome" />
                            <input type="date" value={logForm.next} onChange={ev => setLogForm({ ...logForm, next: ev.target.value })} className={inputCls} aria-label="Next follow-up" />
                            <button onClick={() => logInteraction(e.id)} className={`${btnPrimary} sm:col-span-4`}>
                              Log interaction & set next follow-up
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {tab === 'applications' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Panel
            title="Applications"
            actions={
              <button onClick={() => setShowNewApp(true)} className={btnPrimary}>
                + Paper form
              </button>
            }
          >
            <div className="divide-y divide-subtle max-h-[640px] overflow-y-auto">
              {apps.map(a => {
                const gate = documentGate(a, asOf);
                return (
                  <button
                    key={a.appNo}
                    onClick={() => setSelectedApp(a.appNo)}
                    className={`w-full text-left p-3 text-xs ${a.appNo === selectedApp ? 'bg-subtle' : 'hover:bg-wash'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-ink truncate">{a.child}</span>
                      <Badge className={STAGE_STYLE[a.stage]}>{a.stage}</Badge>
                    </div>
                    <p className="text-[10px] text-ink-muted">
                      {a.appNo} · {a.classApplied} · {a.quota}
                      {!gate.passed && a.stage === 'Document check' && ` · ${gate.blocking.length} doc(s) pending`}
                    </p>
                  </button>
                );
              })}
            </div>
          </Panel>

          {current ? (
            <div className="lg:col-span-2 space-y-4">
              <Panel
                title={
                  <span>
                    {current.appNo} · {current.child}
                  </span>
                }
                actions={<Badge className={STAGE_STYLE[current.stage]}>{current.stage}</Badge>}
              >
                <div className="p-3 grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-xs">
                  {[
                    ['Date of birth', fmt(current.dob)],
                    ['Gender', current.gender],
                    ['Class applied', current.classApplied],
                    ['Quota', current.quota],
                    ['Guardian', current.guardian],
                    ['Mobile', current.mobile],
                    ['Submitted', fmt(current.submittedOn)],
                    ['Origin', current.origin === 'Offline' ? 'Paper form (staff entry)' : 'Online portal'],
                    ['Joining month', ACADEMIC_MONTHS[current.joiningMonth - 1]],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <p className="text-[10px] text-ink-muted">{k}</p>
                      <p className="font-semibold text-ink">{v}</p>
                    </div>
                  ))}
                </div>
                {current.siblingOf && (
                  <p className="mx-3 mb-3 text-[11px] p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Sibling in school: {current.siblingOf}. Sibling concession applies.
                  </p>
                )}
                <div className="px-3 pb-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-2 rounded-lg bg-slate-50">
                    <p className="font-semibold text-ink mb-1">Consent captured at application</p>
                    {current.consent.map(c => (
                      <p key={c.purpose} className="flex items-center gap-1">
                        <span className={`material-symbols-outlined text-sm ${c.granted ? 'text-emerald-600' : 'text-slate-400'}`}>{c.granted ? 'check_circle' : 'cancel'}</span>
                        {c.purpose}
                      </p>
                    ))}
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 space-y-1">
                    <p className="font-semibold text-ink">Declaration</p>
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={current.declarationAccepted}
                        onChange={e => updateApp(current.appNo, a => ({ ...a, declarationAccepted: e.target.checked }))}
                        disabled={current.stage !== 'Document check'}
                        className="accent-brand"
                      />
                      Guardian confirmed the details are true
                    </label>
                    {current.stage === 'Document check' && (
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={Boolean(current.consent.find(c => c.purpose === 'Admission processing')?.granted)}
                          onChange={e =>
                            updateApp(current.appNo, a => ({ ...a, consent: a.consent.map(c => (c.purpose === 'Admission processing' ? { ...c, granted: e.target.checked } : c)) }))
                          }
                          className="accent-brand"
                        />
                        Signed consent for admission processing received
                      </label>
                    )}
                  </div>
                </div>
              </Panel>

              <Panel
                title={`Document checklist · ${current.classApplied} · ${current.quota}`}
                actions={
                  <div className="flex gap-1">
                    <button onClick={() => sendReminder(current)} className={btnSoft}>
                      Remind guardian
                    </button>
                    {current.stage === 'Document check' && (
                      <button onClick={() => advanceToAssessment(current)} className={btnPrimary}>
                        Send to assessment
                      </button>
                    )}
                  </div>
                }
              >
                <div className="divide-y divide-subtle">
                  {requiredDocs(current.classApplied, current.quota).map(type => {
                    const d = current.docs.find(x => x.type === type) ?? { type, status: 'Missing' as const };
                    const conditional = d.status !== 'Verified' && d.deadline && d.deadline >= asOf;
                    const editable = current.stage === 'Document check' || current.stage === 'Assessment' || Boolean(conditional);
                    return (
                      <div key={type} className="p-2.5 flex flex-col md:flex-row md:items-center gap-2 text-xs">
                        <div className="flex-1">
                          <p className="font-semibold text-ink">{type}</p>
                          <p className={`text-[11px] ${DOC_STYLE[d.status]}`}>
                            {d.status}
                            {d.reason && ` · ${d.reason}`}
                            {conditional && ` · conditional until ${fmt(d.deadline!)}`}
                          </p>
                        </div>
                        {editable && (
                          <div className="flex flex-wrap gap-1">
                            {(d.status === 'Missing' || d.status === 'Rejected') && (
                              <button onClick={() => setDoc(current.appNo, type, { status: 'Uploaded', reason: undefined })} className={btnSoft}>
                                Record upload
                              </button>
                            )}
                            {d.status === 'Uploaded' && (
                              <>
                                <button onClick={() => setRejectingDoc(type)} className={btnSoft}>
                                  Reject
                                </button>
                                <button onClick={() => setDoc(current.appNo, type, { status: 'Verified', reason: undefined, deadline: undefined })} className={btnPrimary}>
                                  Verify
                                </button>
                              </>
                            )}
                            {d.status !== 'Verified' && !conditional && (
                              <button
                                onClick={() => {
                                  setDoc(current.appNo, type, { deadline: addDays(asOf, 30), reason: d.reason ?? 'Conditional admission' });
                                  addToast(`${type} may follow by ${fmt(addDays(asOf, 30))}`, 'info', 'Tracked until the document is verified');
                                }}
                                className={btnSoft}
                              >
                                Allow later (30 days)
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {rejectingDoc && (
                  <div className="m-3 p-3 rounded-xl border border-rose-200 bg-rose-50 text-xs space-y-2">
                    <p className="font-semibold text-rose-800">Reject {rejectingDoc}</p>
                    <input value={docReason} onChange={e => setDocReason(e.target.value)} placeholder="Reason shown to the guardian" className={inputCls} />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (!docReason.trim()) {
                            addToast('A rejection reason is required', 'warning');
                            return;
                          }
                          setDoc(current.appNo, rejectingDoc, { status: 'Rejected', reason: docReason.trim() });
                          setRejectingDoc(null);
                          setDocReason('');
                        }}
                        className={`${btn} bg-rose-600 text-white`}
                      >
                        Reject document
                      </button>
                      <button onClick={() => setRejectingDoc(null)} className={btnSoft}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {reminderLog.filter(r => r.appNo === current.appNo).map((r, i) => (
                  <p key={i} className="px-3 pb-2 text-[11px] text-ink-muted">
                    Reminder {fmt(r.at)}: {r.docs.join(', ')}
                  </p>
                ))}
              </Panel>

              {current.stage === 'Assessment' && (
                <Panel title="Entrance test & interaction scores (out of 100)">
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <input value={scoreDraft.test} onChange={e => setScoreDraft({ ...scoreDraft, test: e.target.value })} placeholder="Entrance test" inputMode="numeric" className={inputCls} aria-label="Entrance test score" />
                    <input value={scoreDraft.interview} onChange={e => setScoreDraft({ ...scoreDraft, interview: e.target.value })} placeholder="Interaction scorecard" inputMode="numeric" className={inputCls} aria-label="Interaction score" />
                    <button onClick={() => saveScores(current)} className={btnPrimary}>
                      Save & send for decision
                    </button>
                  </div>
                </Panel>
              )}
            </div>
          ) : (
            <p className="lg:col-span-2 text-xs text-ink-muted">Select an application.</p>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {tab === 'decisions' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-1">
            {CLASS_CONFIG.map(c => (
              <button key={c.classApplied} onClick={() => { setDecisionClass(c.classApplied); setBulkSel(new Set()); }} className={decisionClass === c.classApplied ? btnPrimary : btnSoft}>
                {c.classApplied}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Panel title={`Seats · ${decisionClass}`}>
              <div className="p-3 space-y-3">
                {QUOTAS.map(q => {
                  const s = seatStatus(apps, decisionClass, q);
                  if (s.sanctioned === 0) return null;
                  const pct = (n: number) => `${(n / s.sanctioned) * 100}%`;
                  return (
                    <div key={q} className="text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold text-ink">{q}</span>
                        <span className={s.available <= 0 ? 'text-rose-600 font-bold' : 'text-ink-soft'}>
                          {s.available} of {s.sanctioned} free
                        </span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                        <div className="h-full bg-emerald-500" style={{ width: pct(s.filled) }} title={`Filled ${s.filled}`} />
                        <div className="h-full bg-amber-400" style={{ width: pct(s.offered) }} title={`Offered ${s.offered}`} />
                      </div>
                      <p className="text-[10px] text-ink-muted mt-0.5">
                        Filled {s.filled} · offered {s.offered}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel
              className="lg:col-span-2"
              title="Merit list (entrance test 70% + interaction 30%; ties go to the higher test score, then the earlier application)"
            >
              <div className="p-3 flex flex-wrap items-center gap-2 border-b border-subtle text-xs">
                <select value={bulkDecision} onChange={e => setBulkDecision(e.target.value as typeof bulkDecision)} className="border border-line rounded-lg px-2 py-1.5">
                  <option>Select</option>
                  <option>Waitlist</option>
                  <option>Reject</option>
                </select>
                <select value={decisionReason} onChange={e => setDecisionReason(e.target.value)} className="border border-line rounded-lg px-2 py-1.5" aria-label="Reject reason">
                  {REJECT_REASONS.map(r => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
                <button onClick={runBulk} disabled={!bulkSel.size} className={btnPrimary}>
                  Apply to {bulkSel.size} selected
                </button>
                <span className="text-[10px] text-ink-muted">The reason is used for rejections.</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-ink-soft">
                    <tr>
                      {['', 'Rank', 'Applicant', 'Quota', 'Test', 'Interaction', 'Merit', 'Stage', ''].map((h, i) => (
                        <th key={i} className="text-left p-2 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle">
                    {classMerit.map(({ app: a, rank, score }) => (
                      <tr key={a.appNo}>
                        <td className="p-2">
                          {decidable(a) && (
                            <input
                              type="checkbox"
                              checked={bulkSel.has(a.appNo)}
                              onChange={() =>
                                setBulkSel(prev => {
                                  const n = new Set(prev);
                                  if (n.has(a.appNo)) n.delete(a.appNo);
                                  else n.add(a.appNo);
                                  return n;
                                })
                              }
                              className="accent-brand"
                              aria-label={`Select ${a.child}`}
                            />
                          )}
                        </td>
                        <td className="p-2 font-mono">{rank}</td>
                        <td className="p-2">
                          <p className="font-semibold text-ink">{a.child}</p>
                          <p className="text-[10px] text-ink-muted">{a.appNo}</p>
                        </td>
                        <td className="p-2">{a.quota}</td>
                        <td className="p-2 font-mono">{a.testScore}</td>
                        <td className="p-2 font-mono">{a.interviewScore}</td>
                        <td className="p-2 font-mono font-bold">{score}</td>
                        <td className="p-2">
                          <Badge className={STAGE_STYLE[a.stage]}>{a.stage}</Badge>
                          {a.pendingPrincipalApproval && <p className="text-[10px] text-amber-700 mt-0.5">Awaiting Principal</p>}
                        </td>
                        <td className="p-2 whitespace-nowrap text-right">
                          {decidable(a) &&
                            (a.pendingPrincipalApproval ? (
                              <button onClick={() => runDecision(a.appNo, 'Select', true)} className={`${btn} bg-amber-500 text-white`}>
                                Approve (Principal)
                              </button>
                            ) : (
                              <span className="inline-flex gap-1">
                                <button onClick={() => runDecision(a.appNo, 'Reject')} className={btnSoft}>
                                  Reject
                                </button>
                                {a.stage === 'Decision' && (
                                  <button onClick={() => runDecision(a.appNo, 'Waitlist')} className={btnSoft}>
                                    Waitlist
                                  </button>
                                )}
                                <button onClick={() => runDecision(a.appNo, 'Select')} className={btnPrimary}>
                                  Select
                                </button>
                              </span>
                            ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {classMerit.length === 0 && <EmptyNote>No scored applicants in this class yet.</EmptyNote>}
              </div>
            </Panel>
          </div>

          <Panel title={`Waitlist · ${decisionClass}`}>
            <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {QUOTAS.map(q => {
                const list = waitlistFor(apps, decisionClass, q);
                if (!list.length) return null;
                return (
                  <div key={q}>
                    <p className="font-semibold text-ink mb-1">{q}</p>
                    {list.map((a, i) => (
                      <p key={a.appNo}>
                        #{i + 1} {a.child} <span className="text-ink-muted">· since {fmt(a.waitlistedOn ?? a.submittedOn)}</span>
                      </p>
                    ))}
                  </div>
                );
              })}
              {QUOTAS.every(q => waitlistFor(apps, decisionClass, q).length === 0) && <EmptyNote>Nobody is waitlisted in this class.</EmptyNote>}
            </div>
          </Panel>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {tab === 'offers' && (
        <Panel
          title="Offers, fee and enrolment · a seat is confirmed only once the payment is realised"
          actions={
            <button onClick={runExpiry} className={btnSoft}>
              Check expired offers
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-ink-soft">
                <tr>
                  {['Applicant', 'Offer', 'Response', 'Fee', 'Actions'].map(h => (
                    <th key={h} className="text-left p-2.5 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {offerRows.map(a => {
                  const o = a.offer!;
                  const daysLeft = daysBetween(asOf, o.deadline);
                  const due = feeDue(a);
                  return (
                    <tr key={a.appNo} className="align-top">
                      <td className="p-2.5">
                        <p className="font-semibold text-ink">{a.child}</p>
                        <p className="text-[10px] text-ink-muted">
                          {a.appNo} · {a.classApplied} · {a.quota}
                        </p>
                        {a.enrolment && (
                          <p className="text-[10px] text-emerald-700 font-semibold">
                            {a.enrolment.admissionNo} · Section {a.enrolment.section} · Roll {a.enrolment.rollNo}
                          </p>
                        )}
                      </td>
                      <td className="p-2.5">
                        <p>Sent {fmt(o.sentOn)} via {o.channels.join(', ')}</p>
                        <p className="text-[10px] text-ink-muted">{o.readOn ? `Read ${fmt(o.readOn)}` : 'Not read yet'}</p>
                        {!o.response && (
                          <p className={`text-[10px] font-semibold ${daysLeft < 0 ? 'text-rose-600' : 'text-ink-soft'}`}>
                            {daysLeft < 0 ? `Deadline passed ${fmt(o.deadline)}` : `${daysLeft} day(s) left · ${fmt(o.deadline)}`}
                          </p>
                        )}
                      </td>
                      <td className="p-2.5">
                        {o.response ? (
                          <Badge className={o.response === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}>{o.response}</Badge>
                        ) : (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200">Awaiting</Badge>
                        )}
                        {a.decisionReason && <p className="text-[10px] text-ink-muted mt-0.5">{a.decisionReason}</p>}
                      </td>
                      <td className="p-2.5">
                        <p className="font-mono">
                          {rupees(a.payment.paid)} / {rupees(due)}
                        </p>
                        <p className="text-[10px] text-ink-muted">
                          {a.joiningMonth > 1 ? `Prorated from ${ACADEMIC_MONTHS[a.joiningMonth - 1]}` : 'Full year'} · {a.payment.status}
                        </p>
                      </td>
                      <td className="p-2.5">
                        <div className="flex flex-wrap gap-1">
                          <button onClick={() => setLetterFor(a)} className={btnSoft}>
                            Offer letter
                          </button>
                          {a.stage === 'Offer' && !o.response && (
                            <>
                              {!o.readOn && (
                                <button onClick={() => updateApp(a.appNo, x => ({ ...x, offer: { ...x.offer!, readOn: asOf } }))} className={btnSoft}>
                                  Mark read
                                </button>
                              )}
                              <button onClick={() => setDeclining(a)} className={btnSoft}>
                                Decline
                              </button>
                              <button onClick={() => accept(a)} disabled={daysLeft < 0} className={btnPrimary}>
                                Accept
                              </button>
                            </>
                          )}
                          {a.stage === 'Offer' && o.response === 'Accepted' && (
                            <>
                              {a.payment.paid < due && (
                                <>
                                  <button onClick={() => recordPayment(a, 0.5)} className={btnSoft}>
                                    Instalment (50%)
                                  </button>
                                  <button onClick={() => recordPayment(a, 1)} className={btnSoft}>
                                    Pay balance
                                  </button>
                                </>
                              )}
                              {a.payment.status !== 'Realised' && (
                                <button onClick={() => markRealised(a)} className={btnSoft}>
                                  Mark realised
                                </button>
                              )}
                              <button onClick={() => runEnrol(a)} disabled={a.payment.status !== 'Realised'} className={btnPrimary}>
                                Enrol
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* ------------------------------------------------------------------ */}
      {tab === 'analytics' && (
        <div className="space-y-6">
          <Panel title="Funnel and cost by source (this cycle)">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-ink-soft">
                  <tr>
                    {['Source', 'Enquiries', 'Applications', 'Enrolled', 'Conversion', 'Spend', 'Cost per enrolment'].map(h => (
                      <th key={h} className="text-left p-2.5 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {analytics.sources.map(s => (
                    <tr key={s.source}>
                      <td className="p-2.5 font-semibold text-ink">{s.source}</td>
                      <td className="p-2.5 font-mono">{s.enquiries}</td>
                      <td className="p-2.5 font-mono">{s.applications}</td>
                      <td className="p-2.5 font-mono">{s.enrolled}</td>
                      <td className="p-2.5 font-mono"><Figure value={s.conversion} suffix="%" /></td>
                      <td className="p-2.5 font-mono">{rupees(s.cost)}</td>
                      <td className="p-2.5 font-mono">{s.costPerEnrolment === null ? '—' : rupees(s.costPerEnrolment)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold">
                    <td className="p-2.5">Total</td>
                    <td className="p-2.5 font-mono">{analytics.totals.enquiries}</td>
                    <td className="p-2.5 font-mono">{analytics.totals.applications}</td>
                    <td className="p-2.5 font-mono">{analytics.totals.enrolled}</td>
                    <td className="p-2.5 font-mono"><Figure value={Math.round((analytics.totals.enrolled / analytics.totals.enquiries) * 1000) / 10} suffix="%" /></td>
                    <td className="p-2.5" colSpan={2} />
                  </tr>
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel title="This cycle vs last cycle at the same date">
              <div className="p-3 space-y-2 text-xs">
                {yoy.map(y => {
                  const change = Math.round(((y.now - y.last) / y.last) * 1000) / 10;
                  return (
                    <div key={y.label} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                      <span className="font-semibold text-ink">{y.label}</span>
                      <span className="font-mono">
                        {y.now} vs {y.last}{' '}
                        <span className={change >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                          ({change >= 0 ? '+' : ''}
                          <Figure value={change} suffix="%" />)
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel title="Days per stage (average · 90th percentile)">
              <div className="p-3 space-y-2 text-xs">
                {STAGE_DAYS.map(s => (
                  <div key={s.stage}>
                    <div className="flex justify-between mb-0.5">
                      <span>{s.stage}</span>
                      <span className="font-mono">
                        {s.avgDays} · {s.p90Days}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
                      <div className="h-full bg-slate-500" style={{ width: `${(s.avgDays / 14) * 100}%` }} />
                      <div className="absolute top-0 h-full w-0.5 bg-rose-500" style={{ left: `${(s.p90Days / 14) * 100}%` }} />
                    </div>
                  </div>
                ))}
                <p className="text-[10px] text-ink-muted">The red marker shows the 90th percentile. The longest stage is the bottleneck.</p>
              </div>
            </Panel>

            <Panel title="Counsellor performance">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-ink-soft">
                  <tr>
                    {['Counsellor', 'Handled', 'Converted', 'Rate', 'Overdue'].map(h => (
                      <th key={h} className="text-left p-2.5 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {analytics.counsellors.map(c => (
                    <tr key={c.counsellor}>
                      <td className="p-2.5">{c.counsellor}</td>
                      <td className="p-2.5 font-mono">{c.handled}</td>
                      <td className="p-2.5 font-mono">{c.converted}</td>
                      <td className="p-2.5 font-mono"><Figure value={c.rate} suffix="%" /></td>
                      <td className={`p-2.5 font-mono ${c.overdue ? 'text-rose-600 font-bold' : ''}`}>{c.overdue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>

            <Panel title="Why we lose applicants">
              <div className="p-3 space-y-1.5 text-xs">
                {analytics.lossList.length === 0 && <EmptyNote>No losses recorded yet.</EmptyNote>}
                {analytics.lossList.map(([reason, count]) => (
                  <div key={reason} className="flex justify-between p-2 rounded-lg bg-slate-50">
                    <span>{reason}</span>
                    <span className="font-mono font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <PhaseNotice ids={['ADM-013', 'ADM-067']} phase="Phase 4" note="Lead scoring and seat-fill forecasting are planned for the intelligence release." />
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {losing && (
        <Modal open onClose={() => setLosing(null)} title={`Close ${losing.id} as lost`} footer={
          <>
            <button onClick={() => setLosing(null)} className={btnSoft}>
              Cancel
            </button>
            <button onClick={confirmLost} className={`${btn} bg-rose-600 text-white`}>
              Close enquiry
            </button>
          </>
        }>
          <select value={lostReason} onChange={e => setLostReason(e.target.value)} className={inputCls}>
            <option value="">Choose a reason…</option>
            {LOST_REASONS.map(r => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Modal>
      )}

      {declining && (
        <Modal open onClose={() => setDeclining(null)} title={`${declining.child} declines the offer`} footer={
          <>
            <button onClick={() => setDeclining(null)} className={btnSoft}>
              Cancel
            </button>
            <button onClick={confirmDecline} className={`${btn} bg-rose-600 text-white`}>
              Record decline
            </button>
          </>
        }>
          <select value={declineReason} onChange={e => setDeclineReason(e.target.value)} className={inputCls}>
            {DECLINE_REASONS.map(r => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <p className="text-ink-soft">The seat goes back to the pool and the next waitlisted applicant in this quota gets an offer.</p>
        </Modal>
      )}

      <Modal
        open={showNewApp}
        onClose={() => setShowNewApp(false)}
        title="Enter a paper application form"
        footer={
          <>
            <button type="button" onClick={() => setShowNewApp(false)} className={btnSoft}>
              Cancel
            </button>
            <button type="submit" form={newAppFormId} className={btnPrimary}>
              Create application
            </button>
          </>
        }
      >
        <form id={newAppFormId} onSubmit={createOfflineApplication} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input value={newApp.child} onChange={e => setNewApp({ ...newApp, child: e.target.value })} placeholder="Child’s name" className={`${inputCls} col-span-2`} aria-label="Child name" />
            <input type="date" value={newApp.dob} onChange={e => setNewApp({ ...newApp, dob: e.target.value })} className={inputCls} aria-label="Date of birth" />
            <select value={newApp.gender} onChange={e => setNewApp({ ...newApp, gender: e.target.value as Application['gender'] })} className={inputCls} aria-label="Gender">
              <option>Female</option>
              <option>Male</option>
            </select>
            <select value={newApp.classApplied} onChange={e => setNewApp({ ...newApp, classApplied: e.target.value })} className={inputCls} aria-label="Class">
              {CLASS_CONFIG.map(c => (
                <option key={c.classApplied}>{c.classApplied}</option>
              ))}
            </select>
            <select value={newApp.quota} onChange={e => setNewApp({ ...newApp, quota: e.target.value as Quota })} className={inputCls} aria-label="Quota">
              {QUOTAS.map(q => (
                <option key={q}>{q}</option>
              ))}
            </select>
            <input value={newApp.guardian} onChange={e => setNewApp({ ...newApp, guardian: e.target.value })} placeholder="Guardian’s name" className={inputCls} aria-label="Guardian name" />
            <input value={newApp.mobile} onChange={e => setNewApp({ ...newApp, mobile: e.target.value })} placeholder="Guardian mobile" className={inputCls} aria-label="Guardian mobile" />
            <label className="col-span-2 block">
              <span className="block text-[10px] font-semibold text-ink-soft">Joining month (mid-year admissions are prorated)</span>
              <select value={newApp.joiningMonth} onChange={e => setNewApp({ ...newApp, joiningMonth: Number(e.target.value) })} className={inputCls}>
                {ACADEMIC_MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 space-y-1">
            <p className="font-semibold text-ink">Consent ticked on the paper form</p>
            {CONSENT_PURPOSES.map(p => (
              <label key={p} className="flex items-center gap-1">
                <input type="checkbox" checked={Boolean(newConsent[p])} onChange={e => setNewConsent({ ...newConsent, [p]: e.target.checked })} className="accent-brand" />
                {p}
              </label>
            ))}
          </div>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={newApp.declaration} onChange={e => setNewApp({ ...newApp, declaration: e.target.checked })} className="accent-brand" />
            Guardian signed the declaration
          </label>
        </form>
      </Modal>

      {letterFor && (
        <DialogShell open onClose={() => setLetterFor(null)} labelledBy={letterTitleId} className="max-w-2xl">
          <div className="p-3 border-b border-line-soft flex justify-between items-center">
            <span id={letterTitleId} className="text-sm font-bold text-ink">Offer letter preview</span>
            <div className="flex gap-2">
              <button onClick={() => setPrinting(true)} className={btnPrimary}>
                Print / save PDF
              </button>
              <button onClick={() => setLetterFor(null)} className={btnSoft}>
                Close
              </button>
            </div>
          </div>
          <div className="overflow-y-auto">
            <OfferLetter app={letterFor} campusName={selectedCampus.name} campusAddress={selectedCampus.location} />
          </div>
        </DialogShell>
      )}
      {printing && letterFor && (
        <PrintPortal onDone={() => setPrinting(false)}>
          <OfferLetter app={letterFor} campusName={selectedCampus.name} campusAddress={selectedCampus.location} />
        </PrintPortal>
      )}
    </div>
  );
};

/** ADM-050: offer letter with fee summary, deadline and acceptance link. */
const OfferLetter: React.FC<{ app: Application; campusName: string; campusAddress: string }> = ({ app, campusName, campusAddress }) => {
  const due = feeDue(app);
  const offer = app.offer!;
  return (
    <div className="p-8 text-[12px] leading-relaxed text-ink bg-white">
      <div className="flex items-center gap-3 border-b-2 border-brand pb-3">
        <img src="/lumen-academy-logo.png" alt="" className="w-14 h-14 object-contain" />
        <div>
          <p className="text-lg font-extrabold tracking-wide">LUMEN ACADEMY</p>
          <p className="text-[11px] text-ink-soft">
            {campusName} · {campusAddress}
          </p>
        </div>
      </div>
      <div className="flex justify-between mt-4 text-[11px]">
        <span>Ref: {app.appNo}/OFFER</span>
        <span>Date: {fmt(offer.sentOn)}</span>
      </div>
      <p className="mt-4">To {app.guardian},</p>
      <p className="mt-2 font-bold">Subject: Offer of admission for {app.child} — {app.classApplied}, AY 2025–26</p>
      <p className="mt-2">
        We are pleased to offer {app.child} a seat in {app.classApplied} under the {app.quota} category for the academic year 2025–26, starting in{' '}
        {ACADEMIC_MONTHS[app.joiningMonth - 1]}.
      </p>
      <table className="mt-4 w-full border border-slate-300">
        <tbody>
          <tr className="border-b border-slate-300">
            <td className="p-2">Annual fee</td>
            <td className="p-2 text-right font-mono">{rupees(CLASS_CONFIG.find(c => c.classApplied === app.classApplied)!.annualFee)}</td>
          </tr>
          <tr className="border-b border-slate-300">
            <td className="p-2">Payable for AY 2025–26{app.joiningMonth > 1 ? ` (prorated from ${ACADEMIC_MONTHS[app.joiningMonth - 1]})` : ''}</td>
            <td className="p-2 text-right font-mono font-bold">{rupees(due)}</td>
          </tr>
          <tr>
            <td className="p-2">Instalment option</td>
            <td className="p-2 text-right"><Figure value="50" suffix="%" /> on acceptance, balance before joining</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-4">
        Please accept this offer by <span className="font-bold">{fmt(offer.deadline)}</span> at{' '}
        <span className="font-mono">portal.lumenacademy.edu.in/offer/{app.appNo}</span>. After this date the offer lapses and the seat goes to the next applicant on the
        waitlist. The seat is confirmed only once the fee payment is realised.
      </p>
      <p className="mt-6">Yours sincerely,</p>
      <p className="mt-8 font-bold">Principal</p>
      <p className="text-[11px] text-ink-soft">{campusName}</p>
    </div>
  );
};
