import React, { useContext, useMemo, useState } from 'react';
import {
  AppFrame,
  AppShell,
  BottomNav,
  Card,
  EmptyState,
  FeatureFooter,
  Field,
  Icon,
  Pill,
  PrimaryButton,
  Screen,
  SecondaryButton,
  Sheet,
  SideLink,
  SideNav,
  TabDef,
  Toasts,
  TopBar,
  cx,
  fmtDate,
  fmtDay,
  inputClass,
  inrWhole,
  PhaseNotice,
  LoadingCard,
  ErrorCard,
  useAsync,
  useToasts,
  LOGO_SRC,
} from '../shared/mobileUi';
import { InstallAppCard, InstallButton } from '../shared/webApp';
import { DEFAULT_PREFS, ParentPrefs, fullRegister, nowStamp, prefsFor, resetBackend, updateBackend, useBackend } from '../shared/demoBackend';
import {
  APP_TODAY,
  DEMO_OTP,
  PARENT_ACCOUNTS,
  PRIVACY_NOTICE_VERSION,
  PUBLISHED_EXAMS,
  ParentAccount,
  classTeacherFor,
  currentConsent,
  documentsFor,
  gradeFor,
  resultFor,
  sectionOf,
  timetableFor,
  weekdayOf,
  WEEKDAYS,
  Weekday,
} from '../shared/schoolData';
import { translator } from '../shared/i18n';
import {
  DEFAULT_STATUS_CODES,
  HOLIDAYS,
  REGISTER_FROM,
  attendancePct,
  classifyDay,
  dateRange,
  markKey,
  workingDays,
} from '../../src/data/attendance';
import { DEFAULT_LATE_FEE, FEES_AS_OF, INITIAL_INVOICES, INITIAL_PAYMENTS, Payment, computeLedger, headByCode, nextReceiptNo } from '../../src/data/fees';
import { CONSENT_PURPOSES } from '../../src/data/admissions';
import { Channel, INITIAL_MESSAGES, INITIAL_NOTICES, LANGUAGE_NAMES, Language, moderationFlags } from '../../src/data/messaging';
import { ordinal } from '../../src/data/hallOfFame';
import { hostelFor } from '../../src/data/hostel';
import { hallOfFameService } from '../../src/services/hallOfFameService';
import { useTheme } from '../shared/settingsService';
import { AppearancePage, HallOfFameCard, HallOfFamePage, HostelCard, HostelPage, TransportCard, TransportPage } from './StudentLife';

type Tab = 'home' | 'attendance' | 'fees' | 'messages' | 'more' | 'homework';
type Page = null | 'results' | 'timetable' | 'homework' | 'notices' | 'profile' | 'consent' | 'settings' | 'appearance' | 'hall-of-fame' | 'transport' | 'hostel' | 'later';

const STATUS_TONE: Record<string, 'green' | 'red' | 'amber' | 'blue' | 'grey'> = { P: 'green', L: 'amber', HD: 'amber', A: 'red', LV: 'blue', EX: 'blue', MD: 'blue' };
const CODE_LABEL = Object.fromEntries(DEFAULT_STATUS_CODES.map(c => [c.code, c.label])) as Record<string, string>;
const CAL_COLOUR: Record<string, string> = { P: 'bg-emerald-500', L: 'bg-lime-500', HD: 'bg-amber-400', A: 'bg-rose-500', LV: 'bg-sky-500', EX: 'bg-indigo-400', MD: 'bg-violet-500' };

// ---------------------------------------------------------------------------
// Login (IAM-002: mobile + OTP)
// ---------------------------------------------------------------------------

/** Families with more than one child first, so the multi-child features are easy to try. */
const DEMO_ACCOUNTS = PARENT_ACCOUNTS.filter(a => a.children.length)
  .sort((a, b) => b.children.length - a.children.length)
  .slice(0, 6);

const Login: React.FC<{ onLogin: (a: ParentAccount) => void }> = ({ onLogin }) => {
  const [mobile, setMobile] = useState(PARENT_ACCOUNTS[0].guardian.mobile);
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const digits = (v: string) => v.replace(/\D/g, '').slice(-10);
  const account = PARENT_ACCOUNTS.find(a => digits(a.guardian.mobile) === digits(mobile));

  return (
    <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row bg-[var(--accent)]">
      <div className="px-6 pt-14 pb-10 text-white lg:flex-1 lg:flex lg:flex-col lg:justify-center lg:px-16 xl:px-24">
        <img src={LOGO_SRC} alt="" className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-white p-1" />
        <h1 className="mt-5 text-[26px] lg:text-[40px] font-bold leading-tight">Lumen Academy</h1>
        <p className="text-white/80 text-[14px] lg:text-[17px] lg:max-w-md">Parent app · attendance, fees, homework and messages in one place</p>
        <ul className="hidden lg:block mt-8 space-y-3 text-[15px] text-white/90">
          {['Daily attendance and leave requests', 'Fee dues, receipts and online payment', 'Homework, results and Hall of Fame', 'Bus, hostel and messages from teachers'].map(x => (
            <li key={x} className="flex items-center gap-3">
              <Icon name="check_circle" className="text-[20px]" />
              {x}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1 lg:flex-none lg:w-[460px] lg:overflow-y-auto lg:flex lg:flex-col lg:justify-center bg-[var(--surface)] rounded-t-[28px] lg:rounded-none p-6 lg:p-10 space-y-4">
        <h2 className="hidden lg:block text-[22px] font-bold text-slate-900">Sign in</h2>
        {step === 'mobile' ? (
          <>
            <Field label="Registered mobile number" hint="We send a one-time password by WhatsApp, or SMS if WhatsApp is not available.">
              <input value={mobile} onChange={e => { setMobile(e.target.value); setError(''); }} inputMode="tel" className={inputClass} aria-label="Mobile number" />
            </Field>
            {error && <p className="text-[13px] text-rose-700">{error}</p>}
            <PrimaryButton
              onClick={() => {
                if (!account) {
                  setError('This number is not registered with the school. Please contact the school office.');
                  return;
                }
                setStep('otp');
              }}
            >
              Send OTP
            </PrimaryButton>
            <div className="rounded-xl bg-slate-50 p-3 text-[12px] text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Demo accounts</p>
              {DEMO_ACCOUNTS.map(a => (
                <button key={a.guardian.id} onClick={() => setMobile(a.guardian.mobile)} className="block text-left w-full hover:underline">
                  {a.guardian.mobile} · {a.guardian.name} ({a.children.map(c => c.name.split(' ')[0]).join(', ')})
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="text-[14px] text-slate-700">
              Enter the 6-digit code sent to <span className="font-semibold">{mobile}</span>.
            </p>
            <input value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }} inputMode="numeric" className={cx(inputClass, 'tracking-[0.5em] text-center text-[20px] font-semibold')} aria-label="OTP" />
            <p className="text-[12px] text-slate-500">Demo code: {DEMO_OTP}</p>
            {error && <p className="text-[13px] text-rose-700">{error}</p>}
            <PrimaryButton
              disabled={otp.length !== 6}
              onClick={() => {
                if (otp !== DEMO_OTP) {
                  setError('That code is not correct. Please try again.');
                  return;
                }
                onLogin(account!);
              }}
            >
              Verify & continue
            </PrimaryButton>
            <SecondaryButton onClick={() => setStep('mobile')} className="w-full">
              Change number
            </SecondaryButton>
          </>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export const ParentApp: React.FC = () => {
  const [account, setAccount] = useState<ParentAccount | null>(null);
  const { applied } = useTheme();
  return <AppFrame accent="#0e5d84" theme={applied}>{account ? <Signedin account={account} onSignOut={() => setAccount(null)} /> : <Login onLogin={setAccount} />}</AppFrame>;
};

const HomeScreen: React.FC = () => {
  const { guardian, t, setTab, child, section, pct, todayMark, ledger, due, pendingHomework, notices, acked, studentMode, openPage } = useParent();
  const today = weekdayOf(APP_TODAY);
  const periods = today ? timetableFor(section)[today] : [];
  return (
    <Screen wide>
      <div className="lg:col-span-2">
        <p className="text-[13px] text-slate-500">{t('greeting')}, {guardian.name.split(' ').slice(-1)[0]}</p>
        <p className="text-[18px] font-semibold text-slate-900">
          {child.name} · Class {section}
        </p>
      </div>
      <div className="lg:col-span-2 empty:hidden">
        <HallOfFameCard child={child} onOpen={() => openPage('hall-of-fame')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Card onClick={() => setTab('attendance')} className="!rounded-2xl">
          <p className="text-[12px] text-slate-500">{t('today')}</p>
          <div className="mt-1">
            {todayMark ? <Pill tone={STATUS_TONE[todayMark.code]}>{CODE_LABEL[todayMark.code]}</Pill> : <Pill>{t('notMarked')}</Pill>}
          </div>
          <p className="mt-2 text-[22px] font-bold text-slate-900">{pct ? `${pct.pct}%` : '—'}</p>
          <p className="text-[11px] text-slate-500">{t('thisYear')}</p>
        </Card>
        {!studentMode ? (
          <Card onClick={() => setTab('fees')}>
            <p className="text-[12px] text-slate-500">{due > 0 ? t('feeDue') : t('allPaid')}</p>
            <p className={cx('mt-1 text-[22px] font-bold', due > 0 ? 'text-rose-600' : 'text-emerald-600')}>{inrWhole(due)}</p>
            {due > 0 && <p className="text-[11px] text-slate-500">{ledger.invoices.filter(i => i.balance > 0).length} open invoice(s)</p>}
          </Card>
        ) : (
          <Card onClick={() => setTab('homework')}>
            <p className="text-[12px] text-slate-500">{t('homework')}</p>
            <p className="mt-1 text-[22px] font-bold text-slate-900">{pendingHomework.length}</p>
            <p className="text-[11px] text-slate-500">pending</p>
          </Card>
        )}
      </div>

      <TransportCard child={child} onOpen={() => openPage('transport')} />
      <HostelCard child={child} onOpen={() => openPage('hostel')} />

      <Card title={t('homework')} action={<button onClick={() => (studentMode ? setTab('homework') : openPage('homework'))} className="text-[12px] text-[var(--accent-ink)] font-semibold">View all</button>}>
        {pendingHomework.length === 0 ? (
          <p className="text-[13px] text-slate-500">Nothing pending.</p>
        ) : (
          pendingHomework.slice(0, 3).map(h => (
            <div key={h.id} className="py-2 border-b last:border-0 border-slate-100">
              <p className="text-[14px] font-medium text-slate-900">{h.title}</p>
              <p className="text-[12px] text-slate-500">
                {h.subject} · {t('due')} {fmtDay(h.dueOn)}
              </p>
            </div>
          ))
        )}
      </Card>

      <Card title={`${t('today')} · ${t('timetable')}`} action={<button onClick={() => openPage('timetable')} className="text-[12px] text-[var(--accent-ink)] font-semibold">Week</button>}>
        {periods.map(p => (
          <div key={p.period} className="flex items-center gap-3 py-1.5">
            <span className="w-12 text-[12px] font-mono text-slate-500">{p.start}</span>
            <span className="flex-1 text-[13px] text-slate-800">{p.subject}</span>
            <span className="text-[11px] text-slate-500 truncate max-w-[120px]">{p.teacher}</span>
          </div>
        ))}
      </Card>

      <Card title={t('notices')} action={<button onClick={() => openPage('notices')} className="text-[12px] text-[var(--accent-ink)] font-semibold">View all</button>}>
        {notices.slice(0, 2).map(n => (
          <div key={n.id} className="py-2 border-b last:border-0 border-slate-100">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[14px] font-medium text-slate-900">{n.title}</p>
              {n.ack && !acked(n.id) && <Pill tone="amber">Action needed</Pill>}
            </div>
            <p className="text-[12px] text-slate-500 line-clamp-2">{n.body}</p>
          </div>
        ))}
      </Card>
      <FeatureFooter ids={['APP-001', 'APP-002', 'APP-018', 'EXM-026']} />
    </Screen>
  );
};


const AttendanceScreen: React.FC = () => {
  const { backend, push, t, child, section, register, pct } = useParent();
  const [month, setMonth] = useState(APP_TODAY.slice(0, 7));
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [form, setForm] = useState({ from: '2024-09-18', to: '2024-09-18', reason: '', document: '' });
  const monthDays = dateRange(`${month}-01`, month === APP_TODAY.slice(0, 7) ? APP_TODAY : `${month}-31`).filter(d => d.startsWith(month));
  const lead = (new Date(`${month}-01T00:00:00Z`).getUTCDay() + 6) % 7;
  const counts = monthDays.reduce<Record<string, number>>((acc, d) => {
    const m = register[markKey(child.id, d)];
    if (m) acc[m.code] = (acc[m.code] ?? 0) + 1;
    return acc;
  }, {});
  const leaves = backend.leaves.filter(l => l.studentId === child.id).sort((a, b) => b.from.localeCompare(a.from));

  const submit = () => {
    if (!form.reason.trim()) return push('Please give a reason', 'warn');
    if (form.to < form.from) return push('The end date is before the start date', 'warn');
    if (form.from < APP_TODAY) return push('Leave can only be requested for today or later', 'warn');
    const id = `LV-P${String(backend.leaves.length + 1).padStart(3, '0')}`;
    updateBackend(s => ({
      ...s,
      leaves: [...s.leaves, { id, studentId: child.id, from: form.from, to: form.to, reason: form.reason.trim(), document: form.document.trim() || undefined, appliedOn: APP_TODAY, status: 'Pending' }],
    }));
    setLeaveOpen(false);
    setForm({ ...form, reason: '', document: '' });
    push(`Leave request ${id} sent to ${classTeacherFor(section)}`);
  };

  return (
    <Screen>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Card>
          <p className="text-[20px] font-bold">{pct ? `${pct.pct}%` : '—'}</p>
          <p className="text-[11px] text-slate-500">{t('thisYear')}</p>
        </Card>
        <Card>
          <p className="text-[20px] font-bold">{pct?.days ?? 0}</p>
          <p className="text-[11px] text-slate-500">school days</p>
        </Card>
        <Card>
          <p className={cx('text-[20px] font-bold', pct && pct.pct < 75 ? 'text-rose-600' : 'text-emerald-600')}>{pct && pct.pct < 75 ? 'Low' : 'OK'}</p>
          <p className="text-[11px] text-slate-500">75% needed</p>
        </Card>
      </div>

      <Card
        title={new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
        action={
          <div className="flex gap-1">
            {['2024-08', '2024-09'].map(m => (
              <button key={m} onClick={() => setMonth(m)} className={cx('text-[12px] px-2 py-0.5 rounded-full', m === month ? 'bg-[var(--accent)] text-white' : 'bg-slate-100')}>
                {m === '2024-08' ? 'Aug' : 'Sep'}
              </button>
            ))}
          </div>
        }
      >
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-slate-500 mb-1">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: lead }).map((_, i) => (
            <span key={`p${i}`} />
          ))}
          {monthDays.map(d => {
            const kind = classifyDay(d, HOLIDAYS);
            const m = register[markKey(child.id, d)];
            return (
              <div
                key={d}
                title={kind.working ? (m ? CODE_LABEL[m.code] : 'Not marked') : kind.reason}
                className={cx('aspect-square rounded-lg flex items-center justify-center text-[12px] font-medium', !kind.working ? 'bg-slate-100 text-slate-400' : m ? `${CAL_COLOUR[m.code]} text-white` : 'border border-dashed border-slate-300 text-slate-400')}
              >
                {Number(d.slice(8))}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Object.entries(counts).map(([code, n]) => (
            <Pill key={code} tone={STATUS_TONE[code]}>
              {CODE_LABEL[code]} {n}
            </Pill>
          ))}
        </div>
      </Card>

      <PrimaryButton onClick={() => setLeaveOpen(true)}>{t('applyLeave')}</PrimaryButton>

      <Card title="Leave requests">
        {leaves.length === 0 && <p className="text-[13px] text-slate-500">No leave requests.</p>}
        {leaves.map(l => (
          <div key={l.id} className="py-2 border-b last:border-0 border-slate-100 flex items-start justify-between gap-2">
            <div>
              <p className="text-[14px] text-slate-900">
                {fmtDate(l.from)}
                {l.to !== l.from ? ` – ${fmtDate(l.to)}` : ''}
              </p>
              <p className="text-[12px] text-slate-500">{l.reason}</p>
            </div>
            <Pill tone={l.status === 'Approved' ? 'green' : l.status === 'Rejected' ? 'red' : 'amber'}>{l.status}</Pill>
          </div>
        ))}
      </Card>

      <Sheet open={leaveOpen} onClose={() => setLeaveOpen(false)} title={t('applyLeave')}>
        <div className="grid grid-cols-2 gap-2">
          <Field label="From">
            <input type="date" value={form.from} min={APP_TODAY} onChange={e => setForm({ ...form, from: e.target.value })} className={inputClass} aria-label="Leave from" />
          </Field>
          <Field label="To">
            <input type="date" value={form.to} min={form.from} onChange={e => setForm({ ...form, to: e.target.value })} className={inputClass} aria-label="Leave to" />
          </Field>
        </div>
        <p className="text-[12px] text-slate-500">{workingDays(form.from, form.to < form.from ? form.from : form.to, HOLIDAYS).length} school day(s)</p>
        <Field label="Reason">
          <input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className={inputClass} aria-label="Leave reason" />
        </Field>
        <Field label="Document (optional)" hint="For example a medical certificate">
          <input value={form.document} onChange={e => setForm({ ...form, document: e.target.value })} placeholder="File name" className={inputClass} aria-label="Leave document" />
        </Field>
        <PrimaryButton onClick={submit}>Send to class teacher</PrimaryButton>
      </Sheet>
      <FeatureFooter ids={['APP-003', 'APP-009', 'ATT-011', 'ATT-012']} />
    </Screen>
  );
};


const FeesScreen: React.FC = () => {
  const { backend, push, t, child, payments, ledger, due } = useParent();
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState<'UPI' | 'Card' | 'Net banking'>('UPI');
  const [stage, setStage] = useState<'choose' | 'processing'>('choose');
  const [receipt, setReceipt] = useState<Payment | null>(null);
  const myPayments = payments.filter(p => p.studentId === child.id && p.status === 'Success').sort((a, b) => b.date.localeCompare(a.date));

  const pay = () => {
    setStage('processing');
    window.setTimeout(() => {
      const payment: Payment = {
        id: `PAY-APP-${backend.payments.length + 1}`,
        receiptNo: nextReceiptNo(payments),
        studentId: child.id,
        date: FEES_AS_OF,
        mode: 'Online',
        amount: due,
        collectedBy: 'Payment gateway',
        status: 'Success',
        gatewayRef: `pay_APP${String(backend.payments.length + 1).padStart(4, '0')}`,
        reference: method,
      };
      updateBackend(s => ({ ...s, payments: [...s.payments, payment] }));
      setPaying(false);
      setStage('choose');
      setReceipt(payment);
      push(`Payment of ${inrWhole(payment.amount)} received`);
    }, 900);
  };

  const allocations = receipt ? computeLedger(INITIAL_INVOICES.filter(i => i.studentId === child.id), payments.filter(p => p.studentId === child.id), [], DEFAULT_LATE_FEE, FEES_AS_OF).allocations.filter(a => a.paymentId === receipt.id) : [];

  return (
    <Screen>
      <Card>
        <p className="text-[12px] text-slate-500">{due > 0 ? t('feeDue') : t('allPaid')}</p>
        <p className={cx('text-[30px] font-bold', due > 0 ? 'text-rose-600' : 'text-emerald-600')}>{inrWhole(due)}</p>
        {due > 0 && (
          <PrimaryButton onClick={() => setPaying(true)} className="mt-3">
            {t('payNow')}
          </PrimaryButton>
        )}
      </Card>

      <Card title="Invoices">
        {ledger.invoices.map(s => (
          <details key={s.invoice.invoiceNo} className="py-2 border-b last:border-0 border-slate-100">
            <summary className="flex items-center justify-between gap-2 cursor-pointer list-none">
              <span>
                <span className="block text-[14px] text-slate-900">{s.invoice.instalment} instalment</span>
                <span className="block text-[12px] text-slate-500">
                  Due {fmtDate(s.invoice.dueDate)} · {inrWhole(s.principal)}
                </span>
              </span>
              {s.balance > 0 ? <Pill tone={s.daysOverdue > 0 ? 'red' : 'amber'}>{inrWhole(s.balance)} due</Pill> : <Pill tone="green">Paid</Pill>}
            </summary>
            <div className="mt-2 rounded-xl bg-slate-50 p-2 text-[12px] space-y-1">
              {s.invoice.lines.map(l => (
                <p key={l.head} className="flex justify-between">
                  <span>
                    {headByCode(l.head).name}
                    {l.concession > 0 && <span className="text-emerald-700"> (−{inrWhole(l.concession)})</span>}
                  </span>
                  <span className="font-mono">{inrWhole(l.net)}</span>
                </p>
              ))}
              {s.lateFee > 0 && (
                <p className="flex justify-between text-rose-700">
                  <span>Late fee</span>
                  <span className="font-mono">{inrWhole(s.lateFee)}</span>
                </p>
              )}
            </div>
          </details>
        ))}
      </Card>

      <Card title="Payments">
        {myPayments.length === 0 && <p className="text-[13px] text-slate-500">No payments yet.</p>}
        {myPayments.map(p => (
          <button key={p.id} onClick={() => setReceipt(p)} className="w-full text-left py-2 border-b last:border-0 border-slate-100 flex items-center justify-between">
            <span>
              <span className="block text-[14px] text-slate-900">{inrWhole(p.amount)}</span>
              <span className="block text-[12px] text-slate-500">
                {fmtDate(p.date)} · {p.mode} · {p.receiptNo}
              </span>
            </span>
            <Icon name="chevron_right" className="text-slate-400" />
          </button>
        ))}
      </Card>

      <Sheet open={paying} onClose={() => stage === 'choose' && setPaying(false)} title={`Pay ${inrWhole(due)}`}>
        {stage === 'choose' ? (
          <>
            {(['UPI', 'Card', 'Net banking'] as const).map(m => (
              <button key={m} onClick={() => setMethod(m)} className={cx('w-full flex items-center justify-between rounded-xl border px-3 py-3 text-[14px]', method === m ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-slate-200')}>
                {m}
                <Icon name={method === m ? 'radio_button_checked' : 'radio_button_unchecked'} className="text-[var(--accent-ink)]" />
              </button>
            ))}
            <p className="text-[12px] text-slate-500">The amount is settled against the oldest invoice first. A receipt is issued straight away.</p>
            <PrimaryButton onClick={pay}>Pay {inrWhole(due)}</PrimaryButton>
          </>
        ) : (
          <div className="py-6 text-center text-[14px] text-slate-600">
            <Icon name="progress_activity" className="text-[32px] animate-spin text-[var(--accent-ink)]" />
            <p className="mt-2">Waiting for {method} confirmation…</p>
          </div>
        )}
      </Sheet>

      <Sheet open={Boolean(receipt)} onClose={() => setReceipt(null)} title={`Receipt ${receipt?.receiptNo ?? ''}`}>
        {receipt && (
          <div className="text-[13px] space-y-2">
            <p>
              {child.name} · {child.admissionNo}
            </p>
            <p>
              {fmtDate(receipt.date)} · {receipt.mode}
              {receipt.reference ? ` (${receipt.reference})` : ''}
            </p>
            <div className="rounded-xl bg-slate-50 p-2 space-y-1">
              {allocations.map((a, i) => (
                <p key={i} className="flex justify-between">
                  <span>{a.head === 'LATE' ? 'Late fee' : headByCode(a.head).name}</span>
                  <span className="font-mono">{inrWhole(a.amount)}</span>
                </p>
              ))}
              <p className="flex justify-between font-semibold border-t border-slate-200 pt-1">
                <span>Total</span>
                <span className="font-mono">{inrWhole(receipt.amount)}</span>
              </p>
            </div>
            <SecondaryButton onClick={() => window.print()} className="w-full">
              Print / save as PDF
            </SecondaryButton>
          </div>
        )}
      </Sheet>
      <FeatureFooter ids={['APP-004', 'FEE-014', 'FEE-015', 'FEE-020']} />
    </Screen>
  );
};


const MessagesScreen: React.FC = () => {
  const { account, backend, push, child, section, threads } = useParent();
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [newTeacher, setNewTeacher] = useState(classTeacherFor(section));
  const [newSubject, setNewSubject] = useState('');
  const today = weekdayOf(APP_TODAY) ?? 'Mon';
  const teachers = Array.from(new Set([classTeacherFor(section), ...WEEKDAYS.flatMap(d => timetableFor(section)[d].map(p => p.teacher))]));
  const thread = threads.find(th => th.id === open);

  const send = () => {
    if (!draft.trim() || !thread) return;
    const flags = moderationFlags(draft);
    updateBackend(s => ({
      ...s,
      threads: s.threads.map(th =>
        th.id === thread.id ? { ...th, messages: [...th.messages, { from: 'Parent', text: draft.trim(), at: nowStamp(), status: flags.length ? 'Held for moderation' : 'Delivered', flags: flags.length ? flags : undefined }] } : th
      ),
    }));
    setDraft('');
    push(flags.length ? 'Your message is waiting for review by the school' : 'Message sent', flags.length ? 'warn' : 'ok');
  };

  const start = () => {
    if (!newSubject.trim()) return push('Add a subject', 'warn');
    const id = `TH-P${backend.threads.length + 1}`;
    updateBackend(s => ({ ...s, threads: [...s.threads, { id, studentId: child.id, teacher: newTeacher, subject: newSubject.trim(), messages: [] }] }));
    setNewOpen(false);
    setNewSubject('');
    setOpen(id);
  };

  if (thread) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="shrink-0 bg-[var(--surface)] border-b border-slate-200 px-4 py-2 flex items-center gap-2">
          <button onClick={() => setOpen(null)} aria-label="Back to conversations" className="p-1 -ml-1">
            <Icon name="arrow_back" />
          </button>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold truncate">{thread.teacher}</p>
            <p className="text-[12px] text-slate-500 truncate">{thread.subject}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {thread.messages.map((m, i) => (
            <div key={i} className={cx('max-w-[80%] rounded-2xl px-3 py-2 text-[14px]', m.from === 'Parent' ? 'ml-auto bg-[var(--accent)] text-white' : 'bg-[var(--surface)] border border-slate-200')}>
              <p>{m.text}</p>
              <p className={cx('text-[10px] mt-0.5', m.from === 'Parent' ? 'text-white/70' : 'text-slate-400')}>
                {m.at.slice(5)} · {m.status === 'Delivered' ? '✓' : m.status}
              </p>
            </div>
          ))}
          {thread.messages.length === 0 && <p className="text-center text-[13px] text-slate-500">Say hello to {thread.teacher}.</p>}
          <p className="text-center text-[11px] text-slate-400">Your phone number is not shared with teachers.</p>
        </div>
        <div className="shrink-0 bg-[var(--surface)] border-t border-slate-200 p-2 flex gap-2">
          <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Message" className={cx(inputClass, 'py-2')} aria-label="Message" />
          <button onClick={send} disabled={!draft.trim()} className="rounded-full bg-[var(--accent)] text-white w-11 h-11 flex items-center justify-center disabled:opacity-40" aria-label="Send message">
            <Icon name="send" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <Screen>
      <PrimaryButton onClick={() => setNewOpen(true)}>New message to a teacher</PrimaryButton>
      {threads.length === 0 && <EmptyState icon="forum" text="No conversations yet." />}
      {threads.map(th => {
        const last = th.messages[th.messages.length - 1];
        const kid = account.children.find(c => c.id === th.studentId);
        return (
          <Card key={th.id} onClick={() => setOpen(th.id)}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[14px] font-semibold text-slate-900 truncate">{th.teacher}</p>
              {last?.from === 'Teacher' && <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />}
            </div>
            <p className="text-[12px] text-slate-500 truncate">
              {th.subject}
              {account.children.length > 1 && kid ? ` · ${kid.name.split(' ')[0]}` : ''}
            </p>
            {last && <p className="text-[13px] text-slate-700 truncate mt-1">{last.text}</p>}
          </Card>
        );
      })}
      <Sheet open={newOpen} onClose={() => setNewOpen(false)} title="New message">
        <Field label="Teacher">
          <select value={newTeacher} onChange={e => setNewTeacher(e.target.value)} className={inputClass} aria-label="Teacher">
            {teachers.map(tch => (
              <option key={tch} value={tch}>
                {tch}
                {tch === classTeacherFor(section) ? ' (class teacher)' : ''}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Subject">
          <input value={newSubject} onChange={e => setNewSubject(e.target.value)} className={inputClass} aria-label="Subject" />
        </Field>
        <p className="text-[12px] text-slate-500">Teachers usually reply during school hours. Today is {today}.</p>
        <PrimaryButton onClick={start}>Start conversation</PrimaryButton>
      </Sheet>
      <FeatureFooter ids={['APP-013', 'COM-010', 'COM-011']} />
    </Screen>
  );
};


const HomeworkList: React.FC = () => {
  const { backend, push, t, child, homework } = useParent();
return (
  <Screen>
    {homework.length === 0 && <EmptyState icon="menu_book" text="No homework posted." />}
    {homework.map(h => {
      const done = (backend.homeworkDone[h.id] ?? []).includes(child.id);
      const overdue = !done && h.dueOn < APP_TODAY;
      return (
        <Card key={h.id}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[12px] text-slate-500">{h.subject}</p>
              <p className="text-[15px] font-semibold text-slate-900">{h.title}</p>
            </div>
            {done ? <Pill tone="green">{t('done')}</Pill> : overdue ? <Pill tone="red">Overdue</Pill> : <Pill tone="amber">{t('due')} {fmtDate(h.dueOn)}</Pill>}
          </div>
          <p className="mt-1 text-[13px] text-slate-700">{h.details}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {h.postedBy} · posted {fmtDate(h.postedOn)}
          </p>
          {!done && (
            <SecondaryButton
              onClick={() => {
                updateBackend(s => ({ ...s, homeworkDone: { ...s.homeworkDone, [h.id]: [...(s.homeworkDone[h.id] ?? []), child.id] } }));
                push('Marked as done');
              }}
              className="mt-2"
            >
              {t('markDone')}
            </SecondaryButton>
          )}
        </Card>
      );
    })}
    <FeatureFooter ids={['APP-007', 'LMS-003']} />
  </Screen>
);
};

const TermResultsCard: React.FC = () => {
  const { prefs, child, openPage } = useParent();
  const res = useAsync(() => hallOfFameService.termResults(child.id), [child.id]);
  if (res.status === 'loading') return <LoadingCard label="Loading Term 1 results" lines={4} />;
  if (res.status === 'error') return <ErrorCard onRetry={res.retry} />;
  const { term, results } = res.data;
  if (!results.length) return null;
  const total = results.reduce((n, r) => n + r.marks, 0);
  const max = results.reduce((n, r) => n + r.max, 0);
  const p = Math.round((total / max) * 1000) / 10;
  return (
    <Card title={term.name} action={<Pill tone="blue">{gradeFor(p)}</Pill>}>
      {results.map(r => (
        <div key={r.subject} className="py-1.5" data-term-result={r.subject}>
          <div className="flex justify-between gap-2 text-[13px]">
            <span>{r.subject}</span>
            <span className="flex items-center gap-2">
              {r.rank <= 3 && <Pill tone="amber">{ordinal(r.rank)} in class</Pill>}
              <span className="font-mono">
                {r.marks}/{r.max}
              </span>
            </span>
          </div>
          {!prefs.lowData && (
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className={cx('h-full', r.marks / r.max < 0.4 ? 'bg-rose-500' : 'bg-[var(--accent)]')} style={{ width: `${(r.marks / r.max) * 100}%` }} />
            </div>
          )}
          <p className="text-[10px] text-slate-400">
            Class rank {r.rank} of {r.classSize}
          </p>
        </div>
      ))}
      <p className="mt-2 text-[13px] font-semibold">
        Total {total}/{max} · {p}%
      </p>
      <p className="text-[11px] text-slate-500">
        {term.academicYear} · published {fmtDate(term.publishedOn)}
      </p>
      {results.some(r => r.rank <= 3) && (
        <button onClick={() => openPage('hall-of-fame')} className="mt-2 text-[12px] font-semibold text-[var(--accent-ink)]">
          View Hall of Fame →
        </button>
      )}
    </Card>
  );
};

const ResultsPage: React.FC = () => {
  const { prefs, child, section } = useParent();
return (
  <Screen>
    <TermResultsCard />
    {PUBLISHED_EXAMS.map(exam => {
      const rows = resultFor(child.id, section, exam.id);
      const total = rows.reduce((s, r) => s + r.marks, 0);
      const max = rows.length * exam.max;
      const p = Math.round((total / max) * 1000) / 10;
      return (
        <Card key={exam.id} title={exam.name} action={<Pill tone="blue">{gradeFor(p)}</Pill>}>
          {rows.map(r => (
            <div key={r.subject} className="py-1.5">
              <div className="flex justify-between text-[13px]">
                <span>{r.subject}</span>
                <span className="font-mono">
                  {r.marks}/{exam.max}
                </span>
              </div>
              {!prefs.lowData && (
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className={cx('h-full', r.marks / exam.max < 0.4 ? 'bg-rose-500' : 'bg-[var(--accent)]')} style={{ width: `${(r.marks / exam.max) * 100}%` }} />
                </div>
              )}
            </div>
          ))}
          <p className="mt-2 text-[13px] font-semibold">
            Total {total}/{max} · {p}%
          </p>
          <p className="text-[11px] text-slate-500">Published {fmtDate(exam.publishedOn)}</p>
        </Card>
      );
    })}
    <Card>
      <p className="text-[13px] text-slate-600">Unit Test 3 results appear here once the Principal publishes them.</p>
    </Card>
    <FeatureFooter ids={['APP-005', 'EXM-018', 'EXM-019']} />
  </Screen>
);
};

const TimetablePage: React.FC = () => {
  const { section } = useParent();
  const [day, setDay] = useState<Weekday>(weekdayOf(APP_TODAY) ?? 'Mon');
  const table = timetableFor(section);
  return (
    <Screen>
      <div className="flex gap-1 overflow-x-auto">
        {WEEKDAYS.map(d => (
          <button key={d} onClick={() => setDay(d)} className={cx('px-3 py-1.5 rounded-full text-[13px] shrink-0', d === day ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface)] border border-slate-200')}>
            {d}
          </button>
        ))}
      </div>
      <Card>
        {table[day].map(p => (
          <div key={p.period} className="flex items-center gap-3 py-2 border-b last:border-0 border-slate-100">
            <div className="w-14 text-[12px] font-mono text-slate-500">
              {p.start}
              <br />
              {p.end}
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-medium">{p.subject}</p>
              <p className="text-[12px] text-slate-500">
                {p.teacher} · {p.room}
              </p>
            </div>
          </div>
        ))}
      </Card>
      <FeatureFooter ids={['APP-006', 'TTB-011']} />
    </Screen>
  );
};


const NoticesPage: React.FC = () => {
  const { push, guardian, t, notices, acked } = useParent();
return (
  <Screen>
    {notices.map(n => (
      <Card key={n.id}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-[15px] font-semibold text-slate-900">{n.title}</p>
          <span className="text-[11px] text-slate-500 shrink-0">{fmtDate(n.on)}</span>
        </div>
        <p className="mt-1 text-[13px] text-slate-700">{n.body}</p>
        <p className="mt-1 text-[11px] text-slate-500">{n.from}</p>
        {n.ack &&
          (acked(n.id) ? (
            <Pill tone="green">{t('acknowledged')}</Pill>
          ) : (
            <SecondaryButton
              onClick={() => {
                updateBackend(s => ({ ...s, acks: { ...s.acks, [n.id]: [...(s.acks[n.id] ?? []), guardian.id] } }));
                push('Acknowledged');
              }}
              className="mt-2"
            >
              {t('acknowledge')}
            </SecondaryButton>
          ))}
      </Card>
    ))}
    <FeatureFooter ids={['APP-008', 'COM-005', 'COM-007']} />
  </Screen>
);
};

const ProfilePage: React.FC = () => {
  const { prefs, child, section } = useParent();
  const stay = hostelFor(child.id);
  const hostelLabel = stay ? `${stay.residence.block}, room ${stay.residence.room}` : 'Day scholar';
return (
  <Screen>
    <Card>
      <div className="flex items-center gap-3">
        {!prefs.lowData && child.avatar ? (
          <img src={child.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-[24px] font-bold text-slate-500">{child.name[0]}</span>
        )}
        <div>
          <p className="text-[16px] font-semibold">{child.name}</p>
          <p className="text-[13px] text-slate-500">
            Class {section} · Roll {child.rollNo}
          </p>
          <p className="text-[12px] text-slate-500">{child.house}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
        {[
          ['Admission no', child.admissionNo],
          ['Date of birth', fmtDate(child.dob)],
          ['PEN', child.pen],
          ['APAAR', child.apaar || 'Being generated'],
          ['Class teacher', classTeacherFor(section)],
          ['Transport', child.transportRoute ?? 'Own transport'],
          ['Hostel', hostelLabel],
        ].map(([k, v]) => (
          <div key={k}>
            <p className="text-slate-500">{k}</p>
            <p className="font-medium text-slate-900 break-all">{v}</p>
          </div>
        ))}
      </div>
    </Card>
    <Card title="Documents">
      {documentsFor(child.id).map(d => (
        <div key={d.name} className="flex items-center justify-between py-1.5 text-[13px]">
          <span>{d.name}</span>
          <Pill tone={d.status === 'Verified' ? 'green' : 'amber'}>{d.status}</Pill>
        </div>
      ))}
      <p className="mt-2 text-[11px] text-slate-500">To change details, send a request from the school office. Changes are checked before they are applied.</p>
    </Card>
    <Card title="Emergency contacts">
      {child.emergencyContacts.map((c, i) => (
        <p key={c.name} className="text-[13px] py-1">
          {i + 1}. {c.name} · {c.relation}
        </p>
      ))}
    </Card>
    <FeatureFooter ids={['APP-011', 'STU-006']} />
  </Screen>
);
};

const ConsentPage: React.FC = () => {
  const { backend, push, guardian, child } = useParent();
  const rows = backend.consent.filter(r => r.studentId === child.id);
  const toggle = (purpose: string, grant: boolean) => {
    updateBackend(s => ({
      ...s,
      consent: [
        ...s.consent,
        { id: `CR-${child.id}-${s.consent.length + 1}`, guardianId: guardian.id, studentId: child.id, purpose, action: grant ? 'Granted' : 'Withdrawn', at: nowStamp(), method: 'Parent app', noticeVersion: PRIVACY_NOTICE_VERSION },
      ],
    }));
    push(grant ? `Consent given: ${purpose}` : `Consent withdrawn: ${purpose}. This takes effect immediately.`, grant ? 'ok' : 'warn');
  };
  return (
    <Screen>
      <Card>
        <p className="text-[13px] text-slate-700">
          You decide how the school uses {child.name.split(' ')[0]}’s data. Every change is recorded with the date and the privacy notice version ({PRIVACY_NOTICE_VERSION}).
        </p>
      </Card>
      {CONSENT_PURPOSES.map(purpose => {
        const cur = currentConsent(backend.consent, child.id, purpose);
        const granted = cur?.action === 'Granted';
        const core = purpose === 'Admission processing';
        return (
          <Card key={purpose}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[14px] font-medium">{purpose}</p>
                <p className="text-[11px] text-slate-500">
                  {cur ? `${cur.action} ${cur.at.slice(0, 10)} · ${cur.method}` : 'Not recorded'}
                </p>
              </div>
              {core ? (
                <Pill tone="green">Required</Pill>
              ) : (
                <button
                  role="switch"
                  aria-checked={granted}
                  aria-label={purpose}
                  onClick={() => toggle(purpose, !granted)}
                  className={cx('w-12 h-7 rounded-full relative transition-colors shrink-0', granted ? 'bg-[var(--accent)]' : 'bg-slate-300')}
                >
                  <span className={cx('absolute top-1 w-5 h-5 rounded-full bg-white transition-all', granted ? 'left-6' : 'left-1')} />
                </button>
              )}
            </div>
            {core && <p className="mt-1 text-[11px] text-slate-500">Needed to keep your child enrolled. Contact the office to discuss.</p>}
          </Card>
        );
      })}
      <Card title="History">
        {[...rows].reverse().map(r => (
          <p key={r.id} className="text-[12px] py-1 border-b last:border-0 border-slate-100">
            <span className="font-mono text-slate-500">{r.at}</span> · {r.action} · {r.purpose}
          </p>
        ))}
      </Card>
      <FeatureFooter ids={['APP-012', 'CNS-002', 'CNS-007', 'CNS-015']} />
    </Screen>
  );
};


const SettingsPage: React.FC = () => {
  const { push, prefs, t, setTab, setPage, setPrefs } = useParent();
  const categories: { key: keyof ParentPrefs['channels']; label: string }[] = [
    { key: 'attendance', label: 'Attendance alerts' },
    { key: 'fees', label: 'Fee reminders' },
    { key: 'notices', label: 'School notices' },
  ];
  const channels: Channel[] = ['In-app', 'Push', 'WhatsApp', 'SMS', 'Email'];
  const toggleChannel = (key: keyof ParentPrefs['channels'], c: Channel) => {
    const cur = prefs.channels[key];
    const next = cur.includes(c) ? cur.filter(x => x !== c) : [...cur, c];
    if (!next.length) return push('Keep at least one channel on', 'warn');
    setPrefs({ channels: { ...prefs.channels, [key]: next } });
  };
  const Switch: React.FC<{ on: boolean; onChange: () => void; label: string }> = ({ on, onChange, label }) => (
    <button role="switch" aria-checked={on} aria-label={label} onClick={onChange} className={cx('w-12 h-7 rounded-full relative shrink-0', on ? 'bg-[var(--accent)]' : 'bg-slate-300')}>
      <span className={cx('absolute top-1 w-5 h-5 rounded-full bg-white transition-all', on ? 'left-6' : 'left-1')} />
    </button>
  );
  return (
    <Screen>
      <Card onClick={() => setPage('appearance')}>
        <div className="flex items-center gap-3" data-settings="appearance">
          <Icon name="palette" className="text-[22px] text-[var(--accent-ink)]" />
          <div className="flex-1">
            <p className="text-[14px] font-medium">Appearance</p>
            <p className="text-[11px] text-slate-500">Light, dark, system or school theme</p>
          </div>
          <Icon name="chevron_right" className="text-slate-400" />
        </div>
      </Card>
      <InstallAppCard appName="Lumen Parent" onInstalled={() => push('Lumen Parent installed')} />
      <Card title={t('language')}>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(LANGUAGE_NAMES) as Language[]).map(l => (
            <button key={l} onClick={() => setPrefs({ language: l })} className={cx('rounded-xl border py-2 text-[13px]', prefs.language === l ? 'border-[var(--accent)] bg-[var(--accent)]/5 font-semibold' : 'border-slate-200')}>
              {LANGUAGE_NAMES[l].split(' ')[0]}
            </button>
          ))}
        </div>
      </Card>
      <Card>
        {[
          { label: t('dataSaver'), hint: 'Hide photos and charts on slow connections', on: prefs.lowData, change: () => setPrefs({ lowData: !prefs.lowData }) },
          { label: t('studentMode'), hint: 'A simpler view for your child: no fees, messages or consent', on: prefs.studentMode, change: () => { setPrefs({ studentMode: !prefs.studentMode }); setTab('home'); setPage(null); } },
          { label: 'Quiet hours (9 pm – 7 am)', hint: 'Only urgent alerts during the night', on: prefs.quietHours, change: () => setPrefs({ quietHours: !prefs.quietHours }) },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between gap-3 py-2">
            <div>
              <p className="text-[14px]">{row.label}</p>
              <p className="text-[11px] text-slate-500">{row.hint}</p>
            </div>
            <Switch on={row.on} onChange={row.change} label={row.label} />
          </div>
        ))}
      </Card>
      <Card title="How we reach you">
        {categories.map(cat => (
          <div key={cat.key} className="py-2">
            <p className="text-[13px] font-medium">{cat.label}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {channels.map(c => {
                const on = prefs.channels[cat.key].includes(c);
                return (
                  <button key={c} onClick={() => toggleChannel(cat.key, c)} aria-pressed={on} className={cx('px-2.5 py-1 rounded-full text-[12px] border', on ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'border-slate-300 text-slate-600')}>
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <p className="text-[11px] text-slate-500">Urgent school alerts can still reach you on any channel.</p>
      </Card>
      <SecondaryButton
        onClick={() => {
          setPrefs(DEFAULT_PREFS);
          push('Settings reset');
        }}
        className="w-full"
      >
        Reset settings
      </SecondaryButton>
      <FeatureFooter ids={['APP-015', 'APP-017', 'APP-018', 'APP-019']} />
    </Screen>
  );
};


const LaterPage: React.FC = () => (
  <Screen>
    {[
      { icon: 'support_agent', title: 'Helpdesk tickets' },
      { icon: 'cloud_off', title: 'Read notices and homework offline' },
    ].map(x => (
      <Card key={x.title}>
        <div className="flex items-center gap-3">
          <Icon name={x.icon} className="text-[26px] text-slate-400" />
          <p className="text-[14px] font-medium">{x.title}</p>
        </div>
      </Card>
    ))}
    <PhaseNotice ids={['APP-014', 'APP-016']} phase="Phase 3" note="These arrive with the operations and offline release, along with live GPS in place of the demo bus position." />
  </Screen>
);

/** Pages listed under More on phones and in the sidebar on desktop. */
const morePages = ({ pendingHomework, unackedCount, studentMode }: Pick<ParentSession, 'pendingHomework' | 'unackedCount' | 'studentMode'>) =>
  (
    [
      { page: 'hall-of-fame', icon: 'emoji_events' },
      { page: 'results', icon: 'grading' },
      { page: 'timetable', icon: 'calendar_month' },
      { page: 'transport', icon: 'directions_bus' },
      { page: 'hostel', icon: 'apartment' },
      { page: 'homework', icon: 'menu_book', badge: pendingHomework.length, hide: studentMode },
      { page: 'notices', icon: 'campaign', badge: unackedCount },
      { page: 'profile', icon: 'badge' },
      { page: 'consent', icon: 'verified_user', hide: studentMode },
      { page: 'settings', icon: 'settings' },
      { page: 'appearance', icon: 'palette' },
      { page: 'later', icon: 'upcoming' },
    ] as { page: Exclude<Page, null>; icon: string; badge?: number; hide?: boolean }[]
  ).filter(i => !i.hide);

const MoreScreen: React.FC = () => {
  const session = useParent();
  const { onSignOut, push, guardian, t, openPage, titles } = session;
  return (
    <Screen>
      <Card>
        {morePages(session)
          .map(i => (
            <button key={i.page} onClick={() => openPage(i.page)} className="w-full flex items-center gap-3 py-3 border-b last:border-0 border-slate-100" data-page={i.page}>
              <Icon name={i.icon} className="text-[22px] text-[var(--accent-ink)]" />
              <span className="flex-1 text-left text-[14px]">{titles[i.page]}</span>
              {Boolean(i.badge) && <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-rose-600 text-white text-[11px] font-bold leading-5 text-center">{i.badge}</span>}
              <Icon name="chevron_right" className="text-slate-400" />
            </button>
          ))}
      </Card>
      <Card>
        <p className="text-[13px]">
          Signed in as <span className="font-semibold">{guardian.name}</span>
        </p>
        <p className="text-[12px] text-slate-500">{guardian.mobile}</p>
        <div className="mt-3 flex gap-2">
          <SecondaryButton onClick={onSignOut} className="flex-1">
            {t('signOut')}
          </SecondaryButton>
          <SecondaryButton
            onClick={() => {
              resetBackend();
              push('Demo data reset');
            }}
            className="flex-1"
          >
            Reset demo data
          </SecondaryButton>
        </div>
      </Card>
      <InstallAppCard appName="Lumen Parent" onInstalled={() => push('Lumen Parent installed')} />
    </Screen>
  );
};


const useParentSession = (account: ParentAccount, onSignOut: () => void) => {
  const backend = useBackend();
  const { toasts, push } = useToasts();
  const guardian = account.guardian;
  const prefs = prefsFor(backend, guardian.id);
  const t = translator(prefs.language);
  const [childId, setChildId] = useState(account.children[0]?.id);
  const [tab, setTab] = useState<Tab>('home');
  const [page, setPage] = useState<Page>(null);
  const [switcher, setSwitcher] = useState(false);

  const child = account.children.find(c => c.id === childId) ?? account.children[0];
  const section = sectionOf(child);
  const setPrefs = (patch: Partial<ParentPrefs>) => updateBackend(s => ({ ...s, prefs: { ...s.prefs, [guardian.id]: { ...prefsFor(s, guardian.id), ...patch } } }));

  // ----- derived data -----
  const register = useMemo(() => fullRegister(backend), [backend]);
  const days = useMemo(() => workingDays(REGISTER_FROM, APP_TODAY, HOLIDAYS), []);
  const pct = attendancePct(register, child.id, days, DEFAULT_STATUS_CODES);
  const todayMark = register[markKey(child.id, APP_TODAY)];

  const payments: Payment[] = useMemo(() => [...INITIAL_PAYMENTS, ...backend.payments], [backend.payments]);
  const ledger = useMemo(
    () => computeLedger(INITIAL_INVOICES.filter(i => i.studentId === child.id), payments.filter(p => p.studentId === child.id), [], DEFAULT_LATE_FEE, FEES_AS_OF),
    [child.id, payments]
  );
  const due = ledger.invoices.reduce((s, i) => s + i.balance, 0);

  const homework = backend.homework.filter(h => h.section === section).sort((a, b) => a.dueOn.localeCompare(b.dueOn));
  const pendingHomework = homework.filter(h => h.dueOn >= APP_TODAY && !(backend.homeworkDone[h.id] ?? []).includes(child.id));

  type NoticeRow = { id: string; title: string; body: string; on: string; from: string; ack: boolean };
  const notices: NoticeRow[] = [
    ...backend.announcements.filter(a => a.section === section).map(a => ({ id: a.id, title: a.title, body: a.body, on: a.on, from: a.by, ack: a.ackRequired })),
    ...INITIAL_MESSAGES.filter(m => m.trails.some(tr => tr.recipientId === guardian.id)).map(m => ({ id: m.id, title: m.title, body: m.body, on: m.sentOn, from: m.sentBy, ack: m.ackRequired })),
    ...INITIAL_NOTICES.filter(n => n.expiresOn >= APP_TODAY).map(n => ({ id: n.id, title: n.title, body: n.body, on: n.postedOn, from: 'School office', ack: false })),
  ].sort((a, b) => b.on.localeCompare(a.on));
  const acked = (id: string) => (backend.acks[id] ?? []).includes(guardian.id);
  const unackedCount = notices.filter(n => n.ack && !acked(n.id)).length;

  const threads = backend.threads.filter(th => account.children.some(c => c.id === th.studentId));
  const unreadThreads = threads.filter(th => th.messages[th.messages.length - 1]?.from === 'Teacher').length;

  const studentMode = prefs.studentMode;
  const tabs: TabDef<Tab>[] = studentMode
    ? [
        { id: 'home', label: t('home'), icon: 'home' },
        { id: 'attendance', label: t('attendance'), icon: 'event_available' },
        { id: 'homework', label: t('homework'), icon: 'menu_book', badge: pendingHomework.length },
        { id: 'more', label: t('more'), icon: 'apps' },
      ]
    : [
        { id: 'home', label: t('home'), icon: 'home' },
        { id: 'attendance', label: t('attendance'), icon: 'event_available' },
        { id: 'fees', label: t('fees'), icon: 'account_balance_wallet', badge: due > 0 ? 1 : 0 },
        { id: 'messages', label: t('messages'), icon: 'chat', badge: unreadThreads },
        { id: 'more', label: t('more'), icon: 'apps', badge: unackedCount },
      ];

  const openPage = (p: Page) => setPage(p);
  const back = () => setPage(null);

  const titles: Record<Exclude<Page, null>, string> = {
    results: t('results'),
    timetable: t('timetable'),
    homework: t('homework'),
    notices: t('notices'),
    profile: t('profile'),
    consent: t('consent'),
    settings: t('settings'),
    appearance: 'Appearance',
    'hall-of-fame': 'Hall of Fame',
    transport: 'Transport',
    hostel: 'Hostel',
    later: 'Coming later',
  };

  return { account, onSignOut, backend, toasts, push, guardian, prefs, t, tab, setTab, page, setPage, switcher, setSwitcher, setChildId, child, section, setPrefs, register, days, pct, todayMark, payments, ledger, due, homework, pendingHomework, notices, acked, unackedCount, threads, unreadThreads, studentMode, tabs, openPage, back, titles };
};

type ParentSession = ReturnType<typeof useParentSession>;
const ParentCtx = React.createContext<ParentSession | null>(null);
const useParent = () => {
  const value = useContext(ParentCtx);
  if (!value) throw new Error('useParent outside ParentCtx');
  return value;
};

const Signedin: React.FC<{ account: ParentAccount; onSignOut: () => void }> = ({ account, onSignOut }) => {
  if (!account.children.length) {
    return (
      <Screen>
        <EmptyState icon="person_off" text="No enrolled children are linked to this number." />
        <SecondaryButton onClick={onSignOut}>Sign out</SecondaryButton>
      </Screen>
    );
  }
  return <ChildSession account={account} onSignOut={onSignOut} />;
};

const ChildSession: React.FC<{ account: ParentAccount; onSignOut: () => void }> = ({ account, onSignOut }) => {
  const session = useParentSession(account, onSignOut);
  const { toasts, prefs, t, tab, setTab, page, setPage, switcher, setSwitcher, setChildId, child, section, studentMode, tabs, back, titles } = session;

  const childPicker = (
    <button onClick={() => setSwitcher(true)} className="flex items-center gap-2 rounded-full bg-white/15 pl-1 pr-2 py-1" aria-label="Switch child">
      {!prefs.lowData && child.avatar ? (
        <img src={child.avatar} alt="" className="w-7 h-7 rounded-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <span className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center text-[12px] font-bold">{child.name[0]}</span>
      )}
      <span className="text-[13px] font-semibold max-w-[90px] truncate">{child.name.split(' ')[0]}</span>
      {account.children.length > 1 && <Icon name="expand_more" className="text-[18px]" />}
    </button>
  );

  const pageBody = () => {
    switch (page) {
      case 'results':
        return <ResultsPage />;
      case 'timetable':
        return <TimetablePage />;
      case 'homework':
        return <HomeworkList />;
      case 'notices':
        return <NoticesPage />;
      case 'profile':
        return <ProfilePage />;
      case 'consent':
        return <ConsentPage />;
      case 'settings':
        return <SettingsPage />;
      case 'appearance':
        return <AppearancePage onSaved={text => session.push(text)} />;
      case 'hall-of-fame':
        return <HallOfFamePage child={child} lowData={prefs.lowData} onResults={() => setPage('results')} />;
      case 'transport':
        return <TransportPage child={child} />;
      case 'hostel':
        return <HostelPage child={child} />;
      case 'later':
        return <LaterPage />;
      default:
        return null;
    }
  };

  const tabBody = () => {
    switch (tab) {
      case 'attendance':
        return <AttendanceScreen />;
      case 'fees':
        return <FeesScreen />;
      case 'messages':
        return <MessagesScreen />;
      case 'homework':
        return <HomeworkList />;
      case 'more':
        return <MoreScreen />;
      default:
        return <HomeScreen />;
    }
  };

  const tabTitle: Record<Tab, string> = { home: 'Lumen Academy', attendance: t('attendance'), fees: t('fees'), messages: t('messages'), more: t('more'), homework: t('homework') };

  const sidebar = (
    <SideNav<Tab>
      tabs={tabs.filter(x => x.id !== 'more')}
      active={page ? null : tab}
      onChange={id => {
        setPage(null);
        setTab(id);
      }}
      title="Lumen Academy"
      subtitle={studentMode ? 'Student view' : 'Parent app'}
      footer={
        <>
          <InstallButton appName="Lumen Parent" />
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[13px] font-bold text-slate-600">{account.guardian.name.split(' ').slice(-1)[0][0]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-slate-800 truncate">{account.guardian.name}</p>
              <p className="text-[11px] text-slate-500 truncate">{account.guardian.mobile}</p>
            </div>
            <button onClick={onSignOut} className="p-2 rounded-full hover:bg-slate-100 text-slate-600" aria-label="Sign out" title={t('signOut')}>
              <Icon name="logout" className="text-[20px]" />
            </button>
          </div>
        </>
      }
    >
      <p className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{t('more')}</p>
      {morePages(session).map(i => (
        <SideLink key={i.page} id={i.page} icon={i.icon} label={titles[i.page]} active={page === i.page} onClick={() => setPage(i.page)} />
      ))}
    </SideNav>
  );

  return (
    <ParentCtx.Provider value={session}>
      <AppShell side={sidebar} bottom={!page && <BottomNav<Tab> tabs={tabs} active={tab} onChange={setTab} />}>
        {page ? (
          <TopBar title={titles[page]} subtitle={`${child.name} · ${section}`} onBack={back} right={childPicker} />
        ) : (
          <TopBar title={tabTitle[tab]} subtitle={prefs.lowData ? 'Data saver on' : studentMode ? 'Student view' : undefined} right={childPicker} />
        )}
        {page ? pageBody() : tabBody()}
      </AppShell>
      <Sheet open={switcher} onClose={() => setSwitcher(false)} title="Switch child">
        {account.children.map(c => (
          <button
            key={c.id}
            onClick={() => {
              setChildId(c.id);
              setSwitcher(false);
              setPage(null);
            }}
            className={cx('w-full flex items-center gap-3 rounded-xl border p-3', c.id === child.id ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-slate-200')}
          >
            <span className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">{c.name[0]}</span>
            <span className="text-left">
              <span className="block text-[14px] font-semibold">{c.name}</span>
              <span className="block text-[12px] text-slate-500">
                Class {sectionOf(c)} · {c.admissionNo}
              </span>
            </span>
          </button>
        ))}
      </Sheet>
      <Toasts toasts={toasts} />
    </ParentCtx.Provider>
  );
};

