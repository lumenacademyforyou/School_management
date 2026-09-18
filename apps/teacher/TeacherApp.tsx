import React, { useContext, useMemo, useState } from 'react';
import {
  AppFrame,
  AppShell,
  BottomNav,
  LOGO_SRC,
  SideNav,
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
  TabDef,
  Toasts,
  TopBar,
  cx,
  fmtDate,
  fmtDay,
  inputClass,
  useToasts,
} from '../shared/mobileUi';
import { InstallAppCard, InstallButton } from '../shared/webApp';
import { nowStamp, resetBackend, serverMark, updateBackend, useBackend } from '../shared/demoBackend';
import {
  APP_NOW,
  APP_TODAY,
  ASSESSMENTS,
  DEMO_PASSWORD,
  TEACHER_ACCOUNTS,
  TeacherAccount,
  liveChildren,
  sectionOf,
  teacherDay,
  weekdayOf,
} from '../shared/schoolData';
import { DEFAULT_STATUS_CODES, SECTION_CONFIG, StatusCode, markKey, plannedAbsence } from '../../src/data/attendance';
import { moderationFlags } from '../../src/data/messaging';
import { DEFAULT_LATE_FEE, FEES_AS_OF, INITIAL_CONCESSIONS, INITIAL_INVOICES, INITIAL_PAYMENTS, computeLedger } from '../../src/data/fees';
import { grantFor } from '../../src/data/permissions';
import { OutboxEntry, refreshSnapshot, resolveConflict, syncOutbox, useDevice } from './teacherDevice';

type Tab = 'today' | 'attendance' | 'marks' | 'homework' | 'messages';

const CODE_LABEL = Object.fromEntries(DEFAULT_STATUS_CODES.map(c => [c.code, c.label])) as Record<StatusCode, string>;
const CODE_STYLE: Record<StatusCode, string> = {
  P: 'bg-emerald-500 text-white',
  L: 'bg-lime-500 text-white',
  HD: 'bg-amber-400 text-white',
  A: 'bg-rose-500 text-white',
  LV: 'bg-sky-500 text-white',
  EX: 'bg-indigo-400 text-white',
  MD: 'bg-violet-500 text-white',
};

const markError = (raw: string, max: number) => {
  const v = raw.trim().toUpperCase();
  if (v === '' || v === 'AB' || v === 'EX') return null;
  if (!/^\d+(\.5)?$/.test(v)) return 'Number, AB or EX';
  if (Number(v) > max) return `Max ${max}`;
  return null;
};

// ---------------------------------------------------------------------------
// Login (IAM-001)
// ---------------------------------------------------------------------------

const Login: React.FC<{ onLogin: (t: TeacherAccount) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState(TEACHER_ACCOUNTS[0].email);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const submit = () => {
    const account = TEACHER_ACCOUNTS.find(a => a.email.toLowerCase() === email.trim().toLowerCase());
    if (!account || password !== DEMO_PASSWORD) {
      setError('Email or password is incorrect.');
      return;
    }
    onLogin(account);
  };
  return (
    <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row bg-lumen-night">
      <div className="relative overflow-hidden px-6 pt-14 pb-10 text-white lg:flex-1 lg:flex lg:flex-col lg:justify-center lg:px-16 xl:px-24">
        <div aria-hidden="true" className="absolute inset-0 bg-sunburst [mask-image:radial-gradient(120%_90%_at_100%_0%,black_0%,transparent_65%)]" />
        <img src={LOGO_SRC} alt="" className="relative w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-cream-50 p-1 ring-2 ring-gold-400/70 shadow-[0_8px_24px_-8px_rgb(240_180_58/0.45)]" />
        <h1 className="relative mt-5 text-[26px] lg:text-[40px] font-bold font-display tracking-tight leading-tight">Lumen Teacher</h1>
        <p className="relative text-lumen-100/85 text-[14px] lg:text-[17px] lg:max-w-md">Attendance, marks, homework and parent messages — works offline</p>
        <span aria-hidden="true" className="relative hidden lg:block mt-6 h-px w-24 bg-gradient-to-r from-gold-400 to-transparent" />
        <ul className="relative hidden lg:block mt-6 space-y-3 text-[15px] text-cream-100/90">
          {['Morning roll call in under a minute', 'Marks entry with validation', 'Homework and class notices', 'Keeps working when the network drops'].map(x => (
            <li key={x} className="flex items-center gap-3">
              <Icon name="check_circle" className="text-[20px] text-gold-300" />
              {x}
            </li>
          ))}
        </ul>
      </div>
      <form
        onSubmit={e => {
          e.preventDefault();
          submit();
        }}
        className="flex-1 lg:flex-none lg:w-[460px] lg:overflow-y-auto lg:flex lg:flex-col lg:justify-center bg-[var(--surface)] rounded-t-[28px] lg:rounded-none p-6 lg:p-10 space-y-4 shadow-[0_-12px_32px_-12px_rgb(7_32_47/0.5)]"
      >
        <h2 className="hidden lg:block text-[24px] font-bold font-display tracking-tight text-slate-900">Sign in</h2>
        <Field label="School email">
          <input value={email} onChange={e => { setEmail(e.target.value); setError(''); }} type="email" className={inputClass} aria-label="Email" />
        </Field>
        <Field label="Password" hint={`Demo password: ${DEMO_PASSWORD}`}>
          <input value={password} onChange={e => { setPassword(e.target.value); setError(''); }} type="password" className={inputClass} aria-label="Password" />
        </Field>
        {error && <p className="text-[13px] text-rose-700">{error}</p>}
        <PrimaryButton type="submit">Sign in</PrimaryButton>
        <div className="rounded-xl bg-slate-50 p-3 text-[12px] text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800">Demo teachers</p>
          {TEACHER_ACCOUNTS.map(a => (
            <button type="button" key={a.id} onClick={() => setEmail(a.email)} className="block text-left w-full hover:underline">
              {a.name} · {a.designation}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

const useTeacherSession = (teacher: TeacherAccount, onSignOut: () => void) => {
  const backend = useBackend();
  const { toasts, push } = useToasts();
  const { device, setDevice, reset: resetDevice } = useDevice(teacher.id);
  const [tab, setTab] = useState<Tab>('today');

  const sections = Array.from(new Set([...(teacher.classTeacherOf ? [teacher.classTeacherOf] : []), ...teacher.teaches.map(t => t.section)]));
  const classSection = teacher.classTeacherOf;
  const roster = (section: string) => liveChildren().filter(s => sectionOf(s) === section).sort((a, b) => a.rollNo - b.rollNo);

  const myThreads = backend.threads.filter(th => th.teacher === teacher.name);
  const awaitingReply = myThreads.filter(th => th.messages.filter(m => m.status === 'Delivered').slice(-1)[0]?.from === 'Parent').length;
  const classIds = classSection ? roster(classSection).map(s => s.id) : [];
  const pendingLeaves = backend.leaves.filter(l => l.status === 'Pending' && classIds.includes(l.studentId));

  const sync = () => {
    if (!device.online) {
      push('You are offline — changes stay on this phone until you reconnect', 'warn');
      return;
    }
    const r = syncOutbox(device, teacher.name);
    setDevice(r.device);
    push(r.conflicts ? `${r.written} saved · ${r.conflicts} need your decision` : `Synced · ${r.written} change(s) saved`, r.conflicts ? 'warn' : 'ok');
  };

  return { teacher, onSignOut, backend, toasts, push, device, setDevice, resetDevice, tab, setTab, sections, classSection, roster, myThreads, awaitingReply, pendingLeaves, sync };
};

type TeacherSession = ReturnType<typeof useTeacherSession>;
const TeacherCtx = React.createContext<TeacherSession | null>(null);
const useTeacher = () => {
  const v = useContext(TeacherCtx);
  if (!v) throw new Error('useTeacher outside TeacherCtx');
  return v;
};

// ---------------------------------------------------------------------------
// Today
// ---------------------------------------------------------------------------

const TodayScreen: React.FC = () => {
  const { teacher, backend, push, setTab, classSection, roster, pendingLeaves, awaitingReply, device } = useTeacher();
  const day = weekdayOf(APP_TODAY);
  const periods = day ? teacherDay(teacher.name, day) : [];
  const marked = classSection ? roster(classSection).every(s => serverMark(backend, markKey(s.id, APP_TODAY))) : false;
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [notice, setNotice] = useState({ title: '', body: '', ack: true });
  const myNotices = backend.announcements.filter(a => a.by === teacher.name);

  const decide = (id: string, approve: boolean) => {
    updateBackend(s => ({ ...s, leaves: s.leaves.map(l => (l.id === id ? { ...l, status: approve ? 'Approved' : 'Rejected', decidedBy: teacher.name } : l)) }));
    push(approve ? 'Leave approved — the dates are pre-filled as Leave' : 'Leave rejected');
  };

  const postNotice = () => {
    if (!classSection || !notice.title.trim() || !notice.body.trim()) return push('Add a title and message', 'warn');
    const flags = moderationFlags(notice.body);
    if (flags.length) return push(`Please remove personal contact details: ${flags.join(', ')}`, 'warn');
    updateBackend(s => ({
      ...s,
      announcements: [{ id: `CA-T${s.announcements.length + 1}`, section: classSection, title: notice.title.trim(), body: notice.body.trim(), by: teacher.name, on: APP_TODAY, ackRequired: notice.ack }, ...s.announcements],
    }));
    setNotice({ title: '', body: '', ack: true });
    setNoticeOpen(false);
    push(`Notice sent to ${classSection} parents`);
  };

  return (
    <Screen wide>
      <div className="lg:col-span-2">
        <p className="text-[13px] text-slate-500">{fmtDay(APP_TODAY)} · {APP_NOW}</p>
        <p className="text-[20px] font-bold font-display tracking-tight text-slate-900">Hello, {teacher.name.replace(/^(Mrs|Mr|Ms|Dr)\.\s*/, '')}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 lg:gap-4 lg:col-span-2">
        <Card onClick={() => setTab('attendance')}>
          <p className={cx('text-[18px] font-bold', marked ? 'text-emerald-600' : 'text-rose-600')}>{classSection ? (marked ? 'Done' : 'Due') : '—'}</p>
          <p className="text-[11px] text-slate-500">Attendance {classSection ?? ''}</p>
        </Card>
        <Card onClick={() => setTab('messages')}>
          <p className="text-[18px] font-bold">{awaitingReply}</p>
          <p className="text-[11px] text-slate-500">Awaiting reply</p>
        </Card>
        <Card>
          <p className="text-[18px] font-bold">{device.outbox.length + device.conflicts.length}</p>
          <p className="text-[11px] text-slate-500">To sync</p>
        </Card>
      </div>

      <Card title="My periods today">
        {periods.length === 0 && <p className="text-[13px] text-slate-500">No classes today.</p>}
        {periods.map(p => {
          const now = p.start <= APP_NOW && APP_NOW < p.end;
          return (
            <div key={`${p.section}-${p.period}`} className={cx('flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg', now && 'bg-[var(--accent)]/10')}>
              <span className="w-12 text-[12px] font-mono text-slate-500">{p.start}</span>
              <span className="flex-1 text-[14px]">
                {p.subject} · <span className="font-semibold">{p.section}</span>
              </span>
              <span className="text-[11px] text-slate-500">{now ? 'Now' : p.room}</span>
            </div>
          );
        })}
      </Card>

      {classSection && (
        <Card title={`Leave requests · ${classSection}`}>
          {pendingLeaves.length === 0 && <p className="text-[13px] text-slate-500">Nothing waiting.</p>}
          {pendingLeaves.map(l => {
            const kid = liveChildren().find(s => s.id === l.studentId);
            return (
              <div key={l.id} className="py-2 border-b last:border-0 border-slate-100">
                <p className="text-[14px] font-medium">{kid?.name}</p>
                <p className="text-[12px] text-slate-500">
                  {fmtDate(l.from)}
                  {l.to !== l.from ? ` – ${fmtDate(l.to)}` : ''} · {l.reason}
                  {l.document ? ` · 📎 ${l.document}` : ''}
                </p>
                <div className="mt-1.5 flex gap-2">
                  <SecondaryButton onClick={() => decide(l.id, false)}>Reject</SecondaryButton>
                  <SecondaryButton onClick={() => decide(l.id, true)} className="!bg-[var(--accent)] !text-white">
                    Approve
                  </SecondaryButton>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {classSection && (
        <Card title="Class notices" action={<button onClick={() => setNoticeOpen(true)} className="text-[12px] font-semibold text-[var(--accent)]">New</button>}>
          {myNotices.length === 0 && <p className="text-[13px] text-slate-500">No notices sent.</p>}
          {myNotices.map(n => {
            const families = new Set(roster(n.section).map(s => s.guardianMobile)).size;
            const acks = (backend.acks[n.id] ?? []).length;
            return (
              <div key={n.id} className="py-2 border-b last:border-0 border-slate-100">
                <p className="text-[14px] font-medium">{n.title}</p>
                <p className="text-[12px] text-slate-500">
                  {fmtDate(n.on)}
                  {n.ackRequired ? ` · acknowledged by ${acks} of ${families} families` : ''}
                </p>
              </div>
            );
          })}
        </Card>
      )}

      <ClassDuesCard />

      <Sheet open={noticeOpen} onClose={() => setNoticeOpen(false)} title={`Notice to ${classSection} parents`}>
        <Field label="Title">
          <input value={notice.title} onChange={e => setNotice({ ...notice, title: e.target.value })} className={inputClass} aria-label="Notice title" />
        </Field>
        <Field label="Message">
          <textarea value={notice.body} onChange={e => setNotice({ ...notice, body: e.target.value })} rows={3} className={inputClass} aria-label="Notice message" />
        </Field>
        <label className="flex items-center gap-2 text-[14px]">
          <input type="checkbox" checked={notice.ack} onChange={e => setNotice({ ...notice, ack: e.target.checked })} className="w-4 h-4 accent-[var(--accent)]" />
          Ask parents to acknowledge
        </label>
        <PrimaryButton onClick={postNotice}>Send</PrimaryButton>
      </Sheet>
      <FeatureFooter ids={['APP-020', 'TCH-007', 'TCH-032', 'ATT-011', 'COM-005', 'FEE-028']} />
    </Screen>
  );
};

// ---------------------------------------------------------------------------
// Class fee dues (FEE-028 — class teacher: own section only, amount visible, concession reason hidden)
// ---------------------------------------------------------------------------

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const ClassDuesCard: React.FC = () => {
  const { classSection, roster, backend } = useTeacher();
  const [open, setOpen] = useState(false);
  const grant = grantFor('class-teacher', 'FEE-028');
  const rows = useMemo(() => {
    if (!classSection) return [];
    const kids = roster(classSection);
    const ids = new Set(kids.map(k => k.id));
    const payments = [...INITIAL_PAYMENTS, ...backend.payments].filter(p => ids.has(p.studentId));
    const ledger = computeLedger(INITIAL_INVOICES.filter(i => ids.has(i.studentId)), payments, [], DEFAULT_LATE_FEE, FEES_AS_OF);
    return kids
      .map(k => {
        const states = ledger.invoices.filter(s => s.invoice.studentId === k.id);
        return {
          kid: k,
          due: states.reduce((t, s) => t + s.balance, 0),
          overdueDays: Math.max(0, ...states.filter(s => s.balance > 0).map(s => s.daysOverdue)),
          concession: INITIAL_CONCESSIONS.some(c => c.studentId === k.id && c.status === 'Approved'),
        };
      })
      .filter(r => r.due > 0)
      .sort((a, b) => b.overdueDays - a.overdueDays || b.due - a.due);
  }, [classSection, backend.payments]); // roster() reads static school data

  if (!classSection || !grant?.verbs.includes('R')) return null;
  const total = rows.reduce((t, r) => t + r.due, 0);
  return (
    <Card
      title={`Fee dues · ${classSection}`}
      action={
        <button onClick={() => setOpen(!open)} className="text-[12px] font-semibold text-[var(--accent)]">
          {open ? 'Hide' : 'Show'}
        </button>
      }
    >
      <p className="text-[13px]">
        <span className="font-semibold">{rows.length}</span> student(s) owe <span className="font-semibold">{inr(total)}</span>
      </p>
      {open && (
        <div className="mt-2 divide-y divide-slate-100">
          {rows.map(r => (
            <div key={r.kid.id} className="py-2 flex items-center justify-between gap-2">
              <span className="text-[14px]">
                {r.kid.rollNo}. {r.kid.name}
                {r.concession && <span className="ml-1"><Pill tone="grey">Concession</Pill></span>}
              </span>
              <span className="text-right">
                <span className="block text-[14px] font-semibold">{inr(r.due)}</span>
                {r.overdueDays > 0 && <span className="block text-[11px] text-rose-600">{r.overdueDays} days overdue</span>}
              </span>
            </div>
          ))}
          {rows.length === 0 && <p className="py-2 text-[13px] text-slate-500">Nothing due.</p>}
        </div>
      )}
      <p className="mt-2 text-[11px] text-slate-500">
        {grant.scope} · {grant.condition}. Payments are handled by the accounts office.
      </p>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Attendance (offline-first)
// ---------------------------------------------------------------------------

interface Draft {
  code: StatusCode;
  reason: string;
  arrivedAt: string;
}

const AttendanceScreen: React.FC = () => {
  const { teacher, backend, push, device, setDevice, sections, classSection, roster, sync } = useTeacher();
  const [section, setSection] = useState(classSection ?? sections[0]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const date = APP_TODAY;
  const students = roster(section);
  const mode = SECTION_CONFIG.find(c => c.key === section)?.mode ?? 'Daily';
  const canMark = section === classSection || mode === 'Period-wise';

  const queued = (sid: string) => {
    for (let i = device.outbox.length - 1; i >= 0; i--) {
      const item = device.outbox[i];
      if (item.date !== date) continue;
      const e = item.entries.find(x => x.studentId === sid);
      if (e) return e;
    }
    return undefined;
  };

  const current = (sid: string): Draft => {
    if (drafts[sid]) return drafts[sid];
    const q = queued(sid);
    if (q) return { code: q.code, reason: q.reason ?? '', arrivedAt: q.arrivedAt ?? '' };
    const cached = device.snapshot[markKey(sid, date)];
    if (cached) return { code: cached.code, reason: cached.reason ?? '', arrivedAt: '' };
    const leave = plannedAbsence(backend.leaves, sid, date);
    if (leave) return { code: 'LV', reason: `Approved leave ${leave.id}`, arrivedAt: '' };
    return { code: 'P', reason: '', arrivedAt: '' };
  };

  const setDraft = (sid: string, patch: Partial<Draft>) => setDrafts(prev => ({ ...prev, [sid]: { ...current(sid), ...patch } }));
  const errors = students
    .map(s => {
      const d = current(s.id);
      const def = DEFAULT_STATUS_CODES.find(c => c.code === d.code)!;
      if (def.reason === 'required' && !d.reason.trim()) return `${s.name}: reason needed`;
      if (d.code === 'L' && !/^\d{2}:\d{2}$/.test(d.arrivedAt)) return `${s.name}: arrival time needed`;
      return null;
    })
    .filter((e): e is string => Boolean(e));
  const counts = students.reduce<Record<string, number>>((acc, s) => {
    const c = current(s.id).code;
    acc[c] = (acc[c] ?? 0) + 1;
    return acc;
  }, {});
  const cachedCount = students.filter(s => device.snapshot[markKey(s.id, date)]).length;

  const save = () => {
    if (errors.length) return push(errors[0], 'error');
    const savedAt = nowStamp();
    const entries: OutboxEntry[] = students.map(s => {
      const d = current(s.id);
      return { studentId: s.id, code: d.code, reason: d.reason || undefined, arrivedAt: d.arrivedAt || undefined, baseRev: device.snapshot[markKey(s.id, date)]?.rev ?? 0 };
    });
    const item = { id: `OUT-${device.outbox.length + 1}-${savedAt.slice(11)}`, section, date, savedAt, entries };
    const next = { ...device, outbox: [...device.outbox, item] };
    setDrafts({});
    if (device.online) {
      const r = syncOutbox(next, teacher.name);
      setDevice(r.device);
      push(r.conflicts ? `Saved · ${r.conflicts} mark(s) were changed by the office — please choose` : `Attendance saved for ${section}`, r.conflicts ? 'warn' : 'ok');
    } else {
      setDevice(next);
      push('Saved on this phone — it will sync when you are back online', 'warn');
    }
  };

  const refresh = () => {
    if (!device.online) return push('Connect to the internet to refresh', 'warn');
    setDevice(refreshSnapshot(device, section, date));
    setDrafts({});
    push('Class list refreshed from school');
  };

  return (
    <Screen>
      <div className="flex gap-1 overflow-x-auto">
        {sections.map(sec => (
          <button key={sec} onClick={() => { setSection(sec); setDrafts({}); }} className={cx('px-3 py-1.5 rounded-full text-[13px] shrink-0', sec === section ? 'bg-[var(--accent)] text-white' : 'bg-white border border-slate-200')}>
            {sec}
            {sec === classSection ? ' ★' : ''}
          </button>
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[14px] font-semibold">
              {section} · {fmtDay(date)}
            </p>
            <p className="text-[11px] text-slate-500">
              {mode} attendance · {cachedCount ? `copy from ${device.snapshotAt}` : 'not marked yet'}
            </p>
          </div>
          <SecondaryButton onClick={refresh}>
            <Icon name="refresh" className="text-[16px] align-middle" /> Refresh
          </SecondaryButton>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {Object.entries(counts).map(([c, n]) => (
            <Pill key={c} tone={c === 'P' ? 'green' : c === 'A' ? 'red' : 'blue'}>
              {CODE_LABEL[c as StatusCode]} {n}
            </Pill>
          ))}
        </div>
      </Card>

      {device.conflicts.length > 0 && (
        <Card title={`Needs your decision · ${device.conflicts.length}`} className="!border-amber-300">
          {device.conflicts.map(c => {
            const kid = liveChildren().find(s => s.id === c.studentId);
            return (
              <div key={c.key} className="py-2 border-b last:border-0 border-slate-100 space-y-1.5">
                <p className="text-[14px] font-medium">{kid?.name}</p>
                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="text-slate-500">Your phone ({c.mine.savedAt.slice(11)})</p>
                    <p className="font-semibold">{CODE_LABEL[c.mine.code]}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-2">
                    <p className="text-slate-500">
                      {c.theirs.markedBy} ({c.theirs.markedAt})
                    </p>
                    <p className="font-semibold">{CODE_LABEL[c.theirs.code]}</p>
                    {c.theirs.reason && <p className="text-slate-600">{c.theirs.reason}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <SecondaryButton onClick={() => { setDevice(resolveConflict(device, c, false, teacher.name)); push('Kept the school’s value'); }} className="flex-1">
                    Keep school’s
                  </SecondaryButton>
                  <SecondaryButton onClick={() => { setDevice(resolveConflict(device, c, true, teacher.name)); push('Your value saved; the earlier one stays in history'); }} className="flex-1">
                    Use mine
                  </SecondaryButton>
                </div>
              </div>
            );
          })}
          <p className="text-[11px] text-slate-500">Both versions are kept in the attendance history.</p>
        </Card>
      )}

      {!canMark && (
        <Card>
          <p className="text-[13px] text-slate-600">Only the class teacher marks daily attendance for {section}. You can view the list.</p>
        </Card>
      )}

      <Card className="!p-0">
        <div className="divide-y divide-slate-100">
          {students.map(s => {
            const d = current(s.id);
            const def = DEFAULT_STATUS_CODES.find(c => c.code === d.code)!;
            const q = queued(s.id);
            return (
              <div key={s.id} className="px-4 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[14px]">
                    <span className="text-slate-400 font-mono mr-1">{s.rollNo}</span>
                    {s.name}
                  </p>
                  {q && <Icon name="cloud_upload" className="text-[16px] text-amber-600" />}
                </div>
                <div className="mt-1.5 flex gap-1">
                  {(['P', 'A', 'L', 'HD', 'LV', 'MD'] as StatusCode[]).map(code => (
                    <button
                      key={code}
                      disabled={!canMark}
                      onClick={() => setDraft(s.id, { code })}
                      aria-label={`${s.name} ${CODE_LABEL[code]}`}
                      aria-pressed={d.code === code}
                      className={cx('flex-1 py-1.5 rounded-lg text-[12px] font-semibold border disabled:opacity-50', d.code === code ? `${CODE_STYLE[code]} border-transparent` : 'bg-white border-slate-200 text-slate-600')}
                    >
                      {code}
                    </button>
                  ))}
                </div>
                {(def.reason !== 'none' || d.code === 'L') && canMark && (
                  <div className="mt-1.5 flex gap-1">
                    {d.code === 'L' && <input value={d.arrivedAt} onChange={e => setDraft(s.id, { arrivedAt: e.target.value })} placeholder="08:20" className={cx(inputClass, 'w-20 py-1.5 text-[13px]')} aria-label={`${s.name} arrival time`} />}
                    {def.reason !== 'none' && (
                      <input
                        value={d.reason}
                        onChange={e => setDraft(s.id, { reason: e.target.value })}
                        placeholder={def.reason === 'required' ? 'Reason (required)' : 'Reason (optional)'}
                        className={cx(inputClass, 'py-1.5 text-[13px]', def.reason === 'required' && !d.reason.trim() && 'border-rose-400')}
                        aria-label={`${s.name} reason`}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {canMark && <PrimaryButton onClick={save}>{device.online ? 'Save attendance' : 'Save on this phone'}</PrimaryButton>}
      {device.outbox.length > 0 && (
        <SecondaryButton onClick={sync} className="w-full">
          Sync {device.outbox.length} saved list(s) now
        </SecondaryButton>
      )}
      <FeatureFooter ids={['ATT-002', 'ATT-003', 'ATT-004', 'ATT-005', 'ATT-006', 'ATT-012']} />
    </Screen>
  );
};

// ---------------------------------------------------------------------------
// Marks
// ---------------------------------------------------------------------------

const MarksScreen: React.FC = () => {
  const { teacher, backend, push, roster } = useTeacher();
  const mine = ASSESSMENTS.filter(a => teacher.teaches.some(t => t.section === a.section && t.subject === a.subject));
  const [openId, setOpenId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const assessment = mine.find(a => a.id === openId);
  const sheet = openId ? backend.marksSheets[openId] : undefined;
  const locked = sheet?.status === 'Submitted';

  const open = (id: string) => {
    setOpenId(id);
    setValues(backend.marksSheets[id]?.values ?? {});
  };

  if (!assessment) {
    return (
      <Screen>
        {mine.length === 0 && <EmptyState icon="grading" text="No assessments assigned to you." />}
        {mine.map(a => {
          const s = backend.marksSheets[a.id];
          const entered = Object.values(s?.values ?? {}).filter(v => v.trim()).length;
          const total = roster(a.section).length;
          return (
            <Card key={a.id} onClick={() => open(a.id)}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[15px] font-semibold">{a.title}</p>
                  <p className="text-[12px] text-slate-500">
                    {a.subject} · {a.section} · out of {a.max}
                  </p>
                </div>
                {s?.status === 'Submitted' ? <Pill tone="green">Submitted</Pill> : a.dueOn < APP_TODAY ? <Pill tone="red">Overdue</Pill> : <Pill tone="amber">Due {fmtDate(a.dueOn)}</Pill>}
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-[var(--accent)]" style={{ width: `${(entered / total) * 100}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                {entered} of {total} entered
              </p>
            </Card>
          );
        })}
        <FeatureFooter ids={['EXM-006', 'EXM-007', 'EXM-011', 'TCH-024']} />
      </Screen>
    );
  }

  const students = roster(assessment.section);
  const errs = students.map(s => ({ s, e: markError(values[s.id] ?? '', assessment.max) })).filter(x => x.e);
  const missing = students.filter(s => !(values[s.id] ?? '').trim()).length;
  const scored = students.map(s => (values[s.id] ?? '').trim()).filter(v => /^\d/.test(v)).map(Number);
  const avg = scored.length ? Math.round((scored.reduce((a, b) => a + b, 0) / scored.length) * 10) / 10 : null;

  const persist = (status: 'Draft' | 'Submitted') =>
    updateBackend(s => ({ ...s, marksSheets: { ...s.marksSheets, [assessment.id]: { values: Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim().toUpperCase()])), status, savedBy: teacher.name, savedAt: nowStamp() } } }));

  return (
    <Screen>
      <button onClick={() => setOpenId(null)} className="flex items-center gap-1 text-[13px] text-[var(--accent)] font-semibold">
        <Icon name="arrow_back" className="text-[18px]" /> All assessments
      </button>
      <Card>
        <p className="text-[15px] font-semibold">{assessment.title}</p>
        <p className="text-[12px] text-slate-500">
          {assessment.section} · {assessment.subject} · out of {assessment.max} · enter AB for absent, EX for exempt
        </p>
        <p className="mt-1 text-[12px]">
          Class average {avg ?? '—'} · {missing} missing · {errs.length} invalid
        </p>
        {locked && <p className="mt-1 text-[12px] text-emerald-700">Submitted {sheet?.savedAt} — sent to the HOD for moderation. Ask the HOD to reopen it for changes.</p>}
      </Card>
      <Card className="!p-0">
        <div className="divide-y divide-slate-100">
          {students.map(s => {
            const e = markError(values[s.id] ?? '', assessment.max);
            return (
              <div key={s.id} className="px-4 py-2 flex items-center gap-3">
                <span className="w-6 text-[12px] font-mono text-slate-400">{s.rollNo}</span>
                <span className="flex-1 text-[14px]">{s.name}</span>
                <div className="text-right">
                  <input
                    value={values[s.id] ?? ''}
                    onChange={ev => setValues(prev => ({ ...prev, [s.id]: ev.target.value }))}
                    disabled={locked}
                    inputMode="decimal"
                    className={cx('w-16 rounded-lg border px-2 py-1.5 text-center text-[14px] font-mono', e ? 'border-rose-400 bg-rose-50' : 'border-slate-300', locked && 'bg-slate-50')}
                    aria-label={`${s.name} marks`}
                  />
                  {e && <p className="text-[10px] text-rose-600">{e}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      {!locked && (
        <div className="grid grid-cols-2 gap-2">
          <SecondaryButton
            onClick={() => {
              if (errs.length) return push('Fix the highlighted marks first', 'error');
              persist('Draft');
              push('Draft saved');
            }}
          >
            Save draft
          </SecondaryButton>
          <SecondaryButton
            onClick={() => {
              if (errs.length) return push('Fix the highlighted marks first', 'error');
              if (missing) return push(`${missing} student(s) have no marks — use AB if absent`, 'error');
              persist('Submitted');
              push('Submitted for moderation');
            }}
            className="!bg-[var(--accent)] !text-white"
          >
            Submit
          </SecondaryButton>
        </div>
      )}
    </Screen>
  );
};

// ---------------------------------------------------------------------------
// Homework
// ---------------------------------------------------------------------------

const HomeworkScreen: React.FC = () => {
  const { teacher, backend, push, roster } = useTeacher();
  const [open, setOpen] = useState(false);
  const pairs = teacher.teaches;
  const [form, setForm] = useState({ pair: 0, title: '', details: '', dueOn: '2024-09-19' });
  const mine = backend.homework.filter(h => h.postedBy === teacher.name).sort((a, b) => b.postedOn.localeCompare(a.postedOn) || b.id.localeCompare(a.id));

  const post = () => {
    const pair = pairs[form.pair];
    if (!form.title.trim() || !form.details.trim()) return push('Add a title and instructions', 'warn');
    if (form.dueOn <= APP_TODAY) return push('The due date must be after today', 'warn');
    updateBackend(s => ({
      ...s,
      homework: [...s.homework, { id: `HW-T${s.homework.length + 1}`, section: pair.section, subject: pair.subject, title: form.title.trim(), details: form.details.trim(), dueOn: form.dueOn, postedBy: teacher.name, postedOn: APP_TODAY }],
    }));
    setOpen(false);
    setForm({ ...form, title: '', details: '' });
    push(`Homework sent to ${pair.section} parents`);
  };

  return (
    <Screen>
      <PrimaryButton onClick={() => setOpen(true)}>Post homework</PrimaryButton>
      {mine.length === 0 && <EmptyState icon="menu_book" text="You have not posted homework yet." />}
      {mine.map(h => {
        const done = (backend.homeworkDone[h.id] ?? []).length;
        const total = roster(h.section).length;
        return (
          <Card key={h.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[12px] text-slate-500">
                  {h.section} · {h.subject}
                </p>
                <p className="text-[15px] font-semibold">{h.title}</p>
              </div>
              <Pill tone={h.dueOn < APP_TODAY ? 'grey' : 'amber'}>Due {fmtDate(h.dueOn)}</Pill>
            </div>
            <p className="mt-1 text-[13px] text-slate-700">{h.details}</p>
            <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {done} of {total} marked done by families
            </p>
          </Card>
        );
      })}
      <Sheet open={open} onClose={() => setOpen(false)} title="Post homework">
        <Field label="Class & subject">
          <select value={form.pair} onChange={e => setForm({ ...form, pair: Number(e.target.value) })} className={inputClass} aria-label="Class and subject">
            {pairs.map((p, i) => (
              <option key={`${p.section}-${p.subject}`} value={i}>
                {p.section} · {p.subject}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Title">
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputClass} aria-label="Homework title" />
        </Field>
        <Field label="Instructions">
          <textarea value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} rows={3} className={inputClass} aria-label="Homework instructions" />
        </Field>
        <Field label="Due date">
          <input type="date" value={form.dueOn} min={APP_TODAY} onChange={e => setForm({ ...form, dueOn: e.target.value })} className={inputClass} aria-label="Homework due date" />
        </Field>
        <PrimaryButton onClick={post}>Post</PrimaryButton>
      </Sheet>
      <FeatureFooter ids={['LMS-003', 'APP-007']} />
    </Screen>
  );
};

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

const MessagesScreen: React.FC = () => {
  const { push, myThreads } = useTeacher();
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const thread = myThreads.find(t => t.id === openId);
  const studentName = (id: string) => liveChildren().find(s => s.id === id)?.name ?? id;

  const send = () => {
    if (!thread || !draft.trim()) return;
    const flags = moderationFlags(draft);
    if (flags.length) return push(`Please rephrase: ${flags.join(', ')}`, 'warn');
    updateBackend(s => ({
      ...s,
      threads: s.threads.map(t => (t.id === thread.id ? { ...t, messages: [...t.messages, { from: 'Teacher', text: draft.trim(), at: nowStamp(), status: 'Delivered' }] } : t)),
    }));
    setDraft('');
  };

  if (thread) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="shrink-0 bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2">
          <button onClick={() => setOpenId(null)} aria-label="Back to conversations" className="p-1 -ml-1">
            <Icon name="arrow_back" />
          </button>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold truncate">Parent of {studentName(thread.studentId)}</p>
            <p className="text-[12px] text-slate-500 truncate">{thread.subject}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {thread.messages.map((m, i) =>
            m.from === 'Parent' && m.status !== 'Delivered' ? (
              <p key={i} className="text-center text-[12px] text-slate-500 italic">
                A message from the parent is {m.status === 'Rejected' ? 'not shown (removed by the school)' : 'waiting for school review'}.
              </p>
            ) : (
              <div key={i} className={cx('max-w-[80%] rounded-2xl px-3 py-2 text-[14px]', m.from === 'Teacher' ? 'ml-auto bg-[var(--accent)] text-white' : 'bg-white border border-slate-200')}>
                <p>{m.text}</p>
                <p className={cx('text-[10px] mt-0.5', m.from === 'Teacher' ? 'text-white/70' : 'text-slate-400')}>{m.at.slice(5)}</p>
              </div>
            )
          )}
          <p className="text-center text-[11px] text-slate-400">Parents’ phone numbers are not shown. Please keep conversations here.</p>
        </div>
        <div className="shrink-0 bg-white border-t border-slate-200 p-2 flex gap-2">
          <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Reply" className={cx(inputClass, 'py-2')} aria-label="Reply" />
          <button onClick={send} disabled={!draft.trim()} className="rounded-full bg-[var(--accent)] text-white w-11 h-11 flex items-center justify-center disabled:opacity-40" aria-label="Send reply">
            <Icon name="send" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <Screen>
      {myThreads.length === 0 && <EmptyState icon="forum" text="No parent messages." />}
      {myThreads.map(t => {
        const visible = t.messages.filter(m => m.status === 'Delivered');
        const last = visible[visible.length - 1];
        const held = t.messages.some(m => m.status === 'Held for moderation');
        return (
          <Card key={t.id} onClick={() => setOpenId(t.id)}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[14px] font-semibold truncate">{studentName(t.studentId)}</p>
              {last?.from === 'Parent' && <Pill tone="amber">Reply needed</Pill>}
            </div>
            <p className="text-[12px] text-slate-500 truncate">
              {t.subject}
              {held ? ' · 1 message under review' : ''}
            </p>
            {last && <p className="text-[13px] text-slate-700 truncate mt-1">{last.text}</p>}
          </Card>
        );
      })}
      <FeatureFooter ids={['COM-010', 'COM-011']} />
    </Screen>
  );
};

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

const TeacherSessionView: React.FC<{ teacher: TeacherAccount; onSignOut: () => void }> = ({ teacher, onSignOut }) => {
  const session = useTeacherSession(teacher, onSignOut);
  const { tab, setTab, device, setDevice, resetDevice, awaitingReply, pendingLeaves, toasts, push, sync } = session;
  const [menu, setMenu] = useState(false);

  const tabs: TabDef<Tab>[] = [
    { id: 'today', label: 'Today', icon: 'today', badge: pendingLeaves.length },
    { id: 'attendance', label: 'Attendance', icon: 'fact_check', badge: device.conflicts.length },
    { id: 'marks', label: 'Marks', icon: 'grading' },
    { id: 'homework', label: 'Homework', icon: 'menu_book' },
    { id: 'messages', label: 'Messages', icon: 'chat', badge: awaitingReply },
  ];
  const titles: Record<Tab, string> = { today: 'Lumen Teacher', attendance: 'Attendance', marks: 'Marks entry', homework: 'Homework', messages: 'Parent messages' };
  const pending = device.outbox.length;

  const signOut = () => {
    if (pending) {
      push(`${pending} unsynced list(s) — sync before signing out`, 'error');
      return;
    }
    onSignOut();
  };

  const toggleOnline = () => {
    const online = !device.online;
    setDevice({ ...device, online });
    push(online ? (pending ? `Back online — ${pending} saved list(s) ready to sync` : 'Back online') : 'Offline mode: you can keep marking attendance', online ? 'ok' : 'warn');
  };

  const body = useMemo(() => {
    switch (tab) {
      case 'attendance':
        return <AttendanceScreen />;
      case 'marks':
        return <MarksScreen />;
      case 'homework':
        return <HomeworkScreen />;
      case 'messages':
        return <MessagesScreen />;
      default:
        return <TodayScreen />;
    }
  }, [tab]);

  const sidebar = (
    <SideNav<Tab>
      tabs={tabs}
      active={tab}
      onChange={setTab}
      title="Lumen Teacher"
      subtitle={teacher.classTeacherOf ? `Class teacher · ${teacher.classTeacherOf}` : teacher.designation}
      footer={
        <>
          <InstallButton appName="Lumen Teacher" />
          <div className="flex items-center gap-2">
            <button onClick={() => setMenu(true)} className="flex-1 min-w-0 flex items-center gap-2 rounded-xl p-1 hover:bg-slate-100 text-left" aria-label="Open account">
              <Icon name="account_circle" className="text-[32px] text-slate-500" />
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-slate-800 truncate">{teacher.name}</span>
                <span className="block text-[11px] text-slate-500 truncate">{teacher.email}</span>
              </span>
            </button>
            <button onClick={signOut} className="p-2 rounded-full hover:bg-slate-100 text-slate-600" aria-label="Sign out" title="Sign out">
              <Icon name="logout" className="text-[20px]" />
            </button>
          </div>
        </>
      }
    />
  );

  return (
    <TeacherCtx.Provider value={session}>
      <AppShell side={sidebar} bottom={<BottomNav<Tab> tabs={tabs} active={tab} onChange={setTab} />}>
        <TopBar
          title={titles[tab]}
          subtitle={device.online ? (pending ? `${pending} waiting to sync` : `Synced ${device.lastSync ?? device.snapshotAt}`) : `Offline · ${pending} waiting to sync`}
          right={
            <div className="flex items-center gap-1">
              <button onClick={toggleOnline} className={cx('rounded-full p-1.5', device.online ? 'bg-white/15' : 'bg-amber-500')} aria-label={device.online ? 'Go offline' : 'Go online'} title="Simulate network">
                <Icon name={device.online ? 'wifi' : 'wifi_off'} className="text-[20px]" />
              </button>
              {pending > 0 && device.online && (
                <button onClick={sync} className="rounded-full p-1.5 bg-white/15" aria-label="Sync now">
                  <Icon name="sync" className="text-[20px]" />
                </button>
              )}
              <button onClick={() => setMenu(true)} className="rounded-full p-1.5 hover:bg-white/15" aria-label="Account menu">
                <Icon name="account_circle" className="text-[22px]" />
              </button>
            </div>
          }
        />
        {body}
      </AppShell>
      <Sheet open={menu} onClose={() => setMenu(false)} title={teacher.name}>
        <p className="text-[13px] text-slate-600">{teacher.designation}</p>
        <p className="text-[12px] text-slate-500">{teacher.email}</p>
        <SecondaryButton
          onClick={() => {
            resetDevice();
            resetBackend();
            setMenu(false);
            push('Demo data and this phone’s cache were reset');
          }}
          className="w-full"
        >
          Reset demo data
        </SecondaryButton>
        <SecondaryButton onClick={signOut} className="w-full">
          Sign out
        </SecondaryButton>
        <InstallAppCard appName="Lumen Teacher" onInstalled={() => push('Lumen Teacher installed')} />
      </Sheet>
      <Toasts toasts={toasts} />
    </TeacherCtx.Provider>
  );
};

export const TeacherApp: React.FC = () => {
  const [teacher, setTeacher] = useState<TeacherAccount | null>(null);
  return <AppFrame accent="#125569">{teacher ? <TeacherSessionView teacher={teacher} onSignOut={() => setTeacher(null)} /> : <Login onLogin={setTeacher} />}</AppFrame>;
};

