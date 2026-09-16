import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FeatureTags, PhaseNotice, downloadCsv } from '../../components/common/FeatureTags';
import { INITIAL_ROSTER } from '../../data/students';
import {
  Album,
  Audience,
  CHANNELS,
  CHANNEL_COST,
  Channel,
  DEFAULT_QUIET,
  DEFAULT_RETRY,
  EMPTY_AUDIENCE,
  EventDef,
  HISTORIC_COSTS,
  INITIAL_ALBUMS,
  INITIAL_BINDING,
  INITIAL_EVENTS,
  INITIAL_EVENTS_CAL,
  INITIAL_GUARDIANS,
  INITIAL_MESSAGES,
  INITIAL_NOTICES,
  INITIAL_SCHEDULES,
  INITIAL_TEMPLATES,
  INITIAL_THREADS,
  LANGUAGE_NAMES,
  Language,
  MESSAGING_AS_OF,
  Message,
  NO_PHOTO_CONSENT,
  Notice,
  PTM_TEACHERS,
  PtmSlot,
  QuietHours,
  Recipient,
  RetryPolicy,
  STAFF,
  Schedule,
  SchoolEvent,
  TelemarketerBinding,
  Template,
  Thread,
  Trail,
  buildPtmSlots,
  canBook,
  inQuietHours,
  liveStudents,
  moderationFlags,
  nextRun,
  photoGate,
  pickLanguage,
  renderTemplate,
  resolveAudience,
  routeMessage,
  smsSegments,
  summarise,
  templateVariables,
} from '../../data/messaging';

type Tab = 'compose' | 'outbox' | 'board' | 'threads' | 'log' | 'gallery' | 'setup' | 'costs';

const TABS: { id: Tab; label: string; icon: string; ids: string[] }[] = [
  { id: 'compose', label: 'Compose', icon: 'edit', ids: ['COM-001', 'COM-002', 'COM-003', 'COM-004', 'COM-005', 'COM-012', 'COM-013', 'NOT-006', 'NOT-015', 'NOT-016'] },
  { id: 'outbox', label: 'Outbox & Receipts', icon: 'outbox', ids: ['NOT-009', 'NOT-010', 'COM-005', 'COM-006', 'NOT-005', 'NOT-007', 'NOT-008'] },
  { id: 'board', label: 'Notice Board & PTM', icon: 'push_pin', ids: ['COM-007', 'COM-008', 'COM-009'] },
  { id: 'threads', label: 'Parent–Teacher', icon: 'forum', ids: ['COM-010', 'COM-011'] },
  { id: 'log', label: 'Student Log', icon: 'person_search', ids: ['COM-016'] },
  { id: 'gallery', label: 'Gallery', icon: 'photo_library', ids: ['COM-014', 'CNS-009', 'DOC-013'] },
  { id: 'setup', label: 'Events & Channels', icon: 'tune', ids: ['NOT-001', 'NOT-002', 'NOT-003', 'NOT-004', 'NOT-007', 'NOT-010', 'NOT-012', 'NOT-013', 'NOT-014', 'NOT-017', 'COM-018'] },
  { id: 'costs', label: 'Costs', icon: 'currency_rupee', ids: ['NOT-011', 'COM-017'] },
];

const fmt = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};
const rupees = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const inputCls = 'text-xs border border-[#cbe0ec] rounded-lg px-2 py-1.5 bg-white';
const btn = 'text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40';
const btnPrimary = `${btn} bg-[#0e5d84] text-white hover:bg-[#083a4f]`;
const btnSoft = `${btn} bg-slate-100 hover:bg-slate-200 text-[#082b3d]`;
const btnDanger = `${btn} bg-rose-600 text-white hover:bg-rose-700`;

const STATUS_STYLE: Record<string, string> = {
  Read: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Delivered: 'bg-sky-50 text-sky-700 border-sky-200',
  Held: 'bg-amber-50 text-amber-700 border-amber-200',
  Failed: 'bg-rose-50 text-rose-700 border-rose-200',
  Blocked: 'bg-rose-50 text-rose-700 border-rose-200',
  Skipped: 'bg-slate-100 text-slate-600 border-slate-200',
};

const Panel: React.FC<{ title: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, actions, children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden ${className}`}>
    <div className="p-3 bg-[#f0f7fb] border-b border-[#cbe0ec] flex flex-wrap items-center justify-between gap-2">
      <span className="text-xs font-bold text-[#082b3d]">{title}</span>
      {actions}
    </div>
    {children}
  </div>
);

const Badge: React.FC<{ className: string; children: React.ReactNode }> = ({ className, children }) => (
  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${className}`}>{children}</span>
);

const Chip: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; label?: string }> = ({ active, onClick, children, label }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    aria-label={label}
    className={`text-[11px] px-2 py-1 rounded-full border font-semibold ${active ? 'bg-[#0e5d84] text-white border-[#0e5d84]' : 'bg-white text-[#464555] border-[#cbe0ec]'}`}
  >
    {children}
  </button>
);

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

/** Roles allowed to send emergency broadcasts (NOT-015: PR/BA only). */
const EMERGENCY_ROLES = ['Principal', 'Branch Admin'];

export const CommunicationDeskView: React.FC<{ initialTab?: Tab }> = ({ initialTab = 'compose' }) => {
  const { addToast, currentUser } = useApp();
  const asOf = MESSAGING_AS_OF;
  const students = useMemo(() => liveStudents(), []);
  const nameOfStudent = (id?: string) => INITIAL_ROSTER.find(s => s.id === id)?.name ?? '—';

  const [tab, setTab] = useState<Tab>(initialTab);
  const [events, setEvents] = useState<EventDef[]>(INITIAL_EVENTS);
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);
  const [guardians, setGuardians] = useState<Recipient[]>(INITIAL_GUARDIANS);
  const [binding, setBinding] = useState<TelemarketerBinding>(INITIAL_BINDING);
  const [quiet, setQuiet] = useState<QuietHours>(DEFAULT_QUIET);
  const [retry, setRetry] = useState<RetryPolicy>(DEFAULT_RETRY);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [schedules, setSchedules] = useState<Schedule[]>(INITIAL_SCHEDULES);
  const [audit, setAudit] = useState<string[]>([]);
  const [senderRole, setSenderRole] = useState<'Principal' | 'Branch Admin' | 'Teacher' | 'Accountant'>('Principal');

  const allRecipients = useMemo(() => [...guardians, ...STAFF], [guardians]);
  const recipientById = (id: string) => allRecipients.find(r => r.id === id);
  const log = (text: string) => setAudit(prev => [`${new Date().toLocaleString('en-IN')} · ${currentUser.name} (${senderRole}) · ${text}`, ...prev]);

  // -------------------------------------------------------------------------
  // Compose
  // -------------------------------------------------------------------------
  const [eventId, setEventId] = useState('EV-NOTICE');
  const [title, setTitle] = useState('Parent–teacher meeting on Saturday');
  const [body, setBody] = useState('PTM for Classes 8 to 10 is on 21 Sep, 9–11 am. Book a slot in the app.');
  const [audience, setAudience] = useState<Audience>({ ...EMPTY_AUDIENCE, classes: [8, 9, 10] });
  const [channelOverride, setChannelOverride] = useState<Channel[] | null>(null);
  const [circular, setCircular] = useState(false);
  const [attachment, setAttachment] = useState('');
  const [ackRequired, setAckRequired] = useState(false);
  const [sendTime, setSendTime] = useState('11:00');
  const [scheduleFor, setScheduleFor] = useState('');
  const [emergency, setEmergency] = useState(false);
  const [previewLang, setPreviewLang] = useState<Language>('en');
  const [confirmEmergency, setConfirmEmergency] = useState(false);

  const event = events.find(e => e.id === (emergency ? 'EV-EMERGENCY' : eventId))!;
  const template = templates.find(t => t.id === event.templateId)!;
  const recipients = resolveAudience(audience, guardians, students);
  const channels = channelOverride ?? event.order;
  const vars: Record<string, string> = { title, message: body, student: 'your ward', class: '', status: '', date: fmt(asOf), amount: '', link: 'app.lumenacademy.edu.in', reference: '' };
  const previewText = renderTemplate(template.body[pickLanguage(template, previewLang)]!, { ...vars, guardian: 'Parent' });
  const missingVars = templateVariables(template.body.en!).filter(v => !['guardian', 'title', 'message', 'date', 'link', 'student'].includes(v));
  const canEmergency = EMERGENCY_ROLES.includes(senderRole);

  const nextId = () => `MSG-${String(messages.length + 1).padStart(4, '0')}`;
  const nextCircular = () => `CIR/2024-25/${String(41 + messages.filter(m => m.circularNo).length).padStart(3, '0')}`;

  const buildTrails = (id: string, recips: Recipient[], time: string): Trail[] =>
    recips.map(r => routeMessage({ event, template, vars, messageId: id, sendTime: time, emergency, channels: channelOverride ?? undefined, quiet, retry, binding, asOf }, r));

  const dryRun = useMemo(() => summarise(buildTrails('MSG-PREVIEW', recipients, sendTime)), [recipients, sendTime, event, template, channels, quiet, retry, binding, emergency, title, body]);

  const send = () => {
    if (!title.trim() || !body.trim()) {
      addToast('Title and message are required', 'warning');
      return;
    }
    if (!recipients.length) {
      addToast('The audience is empty', 'warning');
      return;
    }
    if (emergency && !canEmergency) {
      addToast(`${senderRole} cannot send emergency broadcasts`, 'error', 'NOT-015 — Principal or Branch Admin only');
      return;
    }
    if (emergency && !confirmEmergency) {
      setConfirmEmergency(true);
      return;
    }
    const id = nextId();
    const scheduled = scheduleFor && scheduleFor > asOf ? scheduleFor : undefined;
    const msg: Message = {
      id,
      eventId: event.id,
      title: title.trim(),
      body: body.trim(),
      sentBy: currentUser.name,
      sentOn: scheduled ?? asOf,
      sentAt: sendTime,
      audienceLabel: describeAudience(audience),
      emergency,
      circularNo: circular ? nextCircular() : undefined,
      attachment: circular && attachment.trim() ? attachment.trim() : undefined,
      ackRequired,
      acknowledged: [],
      trails: scheduled ? [] : buildTrails(id, recipients, sendTime),
      scheduledFor: scheduled,
    };
    setMessages(prev => [msg, ...prev]);
    log(`${emergency ? 'EMERGENCY ' : ''}${id} · ${msg.title} · ${recipients.length} recipients`);
    const s = summarise(msg.trails);
    addToast(
      scheduled ? `${id} scheduled for ${fmt(scheduled)} ${sendTime}` : `${id} sent to ${recipients.length} recipient(s)`,
      emergency ? 'warning' : 'success',
      scheduled ? undefined : `${s.delivered} delivered · ${s.held} held for quiet hours · ${s.failed + s.blocked} not delivered · cost ${rupees(s.cost)}`
    );
    setConfirmEmergency(false);
    setEmergency(false);
    setTab('outbox');
    setOpenMessage(id);
  };

  // -------------------------------------------------------------------------
  // Outbox
  // -------------------------------------------------------------------------
  const [openMessage, setOpenMessage] = useState<string | null>(INITIAL_MESSAGES[0].id);
  const [trailFilter, setTrailFilter] = useState<'All' | 'Not delivered' | 'Unread' | 'Held'>('All');
  const current = messages.find(m => m.id === openMessage);

  const releaseHeld = (m: Message) => {
    const held = m.trails.filter(t => t.status === 'Held');
    const ev = events.find(e => e.id === m.eventId)!;
    const tpl = templates.find(t => t.id === ev.templateId)!;
    const released = held.map(t =>
      routeMessage({ event: ev, template: tpl, vars: { title: m.title, message: m.body, date: fmt(asOf), student: nameOfStudent(recipientById(t.recipientId)?.studentId) }, messageId: m.id, sendTime: quiet.end, emergency: false, quiet, retry, binding, asOf }, recipientById(t.recipientId)!)
    );
    setMessages(prev => prev.map(x => (x.id === m.id ? { ...x, trails: x.trails.map(t => released.find(r => r.recipientId === t.recipientId) ?? t) } : x)));
    addToast(`${released.length} held message(s) released at ${quiet.end}`, 'success');
  };

  const remindUnacknowledged = (m: Message) => {
    const pending = m.trails.filter(t => (t.status === 'Read' || t.status === 'Delivered') && !m.acknowledged.includes(t.recipientId));
    log(`Acknowledgement reminder · ${m.id} · ${pending.length}`);
    addToast(`Reminder sent to ${pending.length} guardian(s) who have not acknowledged`, 'info');
  };

  const acknowledge = (m: Message, recipientId: string) =>
    setMessages(prev => prev.map(x => (x.id === m.id ? { ...x, acknowledged: [...x.acknowledged, recipientId] } : x)));

  const sendScheduledNow = (m: Message) => {
    const ev = events.find(e => e.id === m.eventId)!;
    const tpl = templates.find(t => t.id === ev.templateId)!;
    const recips = allRecipients.filter(r => r.primary && r.kind === 'Guardian');
    const trails = recips.map(r => routeMessage({ event: ev, template: tpl, vars: { title: m.title, message: m.body, date: fmt(asOf) }, messageId: m.id, sendTime: m.sentAt, emergency: m.emergency, quiet, retry, binding, asOf }, r));
    setMessages(prev => prev.map(x => (x.id === m.id ? { ...x, scheduledFor: undefined, sentOn: asOf, trails } : x)));
    addToast(`${m.id} sent now`, 'success');
  };

  // -------------------------------------------------------------------------
  // Notice board, calendar, PTM
  // -------------------------------------------------------------------------
  const [notices, setNotices] = useState<Notice[]>(INITIAL_NOTICES);
  const [newNotice, setNewNotice] = useState({ title: '', body: '', expiresOn: '2024-09-30', pinned: false });
  const [calEvents, setCalEvents] = useState<SchoolEvent[]>(INITIAL_EVENTS_CAL);
  const [newEvent, setNewEvent] = useState({ date: '2024-09-25', title: '', kind: 'Activity' as SchoolEvent['kind'] });
  const [slots, setSlots] = useState<PtmSlot[]>(() => {
    const base = buildPtmSlots(PTM_TEACHERS);
    const pre: Record<string, string> = { '0-09:00': 'G-ros-01', '0-09:10': 'G-ros-02', '1-09:00': 'G-ros-04', '3-09:20': 'G-ros-13' };
    return base.map(s => (pre[s.id] ? { ...s, bookedBy: pre[s.id] } : s));
  });
  const [booker, setBooker] = useState('G-ros-01');

  const activeNotices = notices.filter(n => n.expiresOn >= asOf).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.postedOn.localeCompare(a.postedOn));
  const expiredNotices = notices.filter(n => n.expiresOn < asOf);

  const book = (slot: PtmSlot) => {
    const err = canBook(slots, slot.id, booker);
    if (err) {
      addToast(err, 'warning');
      return;
    }
    setSlots(prev => prev.map(s => (s.id === slot.id ? { ...s, bookedBy: booker } : s)));
    addToast(`Booked ${slot.teacher} at ${slot.start}`, 'success', `For ${recipientById(booker)?.name}`);
  };

  const calendarDays = useMemo(() => {
    const first = new Date('2024-09-01T00:00:00Z');
    const lead = (first.getUTCDay() + 6) % 7;
    return [...Array(lead).fill(null), ...Array.from({ length: 30 }, (_, i) => `2024-09-${String(i + 1).padStart(2, '0')}`)];
  }, []);

  // -------------------------------------------------------------------------
  // Threads
  // -------------------------------------------------------------------------
  const [threads, setThreads] = useState<Thread[]>(INITIAL_THREADS);
  const [openThread, setOpenThread] = useState('TH-02');
  const [reply, setReply] = useState('');
  const [replyAs, setReplyAs] = useState<'Teacher' | 'Parent'>('Teacher');
  const thread = threads.find(t => t.id === openThread)!;
  const heldCount = threads.flatMap(t => t.messages).filter(m => m.status === 'Held for moderation').length;

  const postReply = () => {
    if (!reply.trim()) return;
    const flags = moderationFlags(reply);
    const msg = { from: replyAs, text: reply.trim(), at: `${asOf} ${new Date().toTimeString().slice(0, 5)}`, status: flags.length ? ('Held for moderation' as const) : ('Delivered' as const), flags: flags.length ? flags : undefined };
    setThreads(prev => prev.map(t => (t.id === openThread ? { ...t, messages: [...t.messages, msg] } : t)));
    setReply('');
    addToast(flags.length ? 'Message held for moderation' : 'Message sent', flags.length ? 'warning' : 'success', flags.join(' · ') || undefined);
  };

  const moderate = (threadId: string, idx: number, approve: boolean) => {
    setThreads(prev => prev.map(t => (t.id === threadId ? { ...t, messages: t.messages.map((m, i) => (i === idx ? { ...m, status: approve ? 'Delivered' : 'Rejected' } : m)) } : t)));
    log(`Moderation ${approve ? 'approved' : 'rejected'} · ${threadId} #${idx + 1}`);
  };

  // -------------------------------------------------------------------------
  // Gallery
  // -------------------------------------------------------------------------
  const [albums, setAlbums] = useState<Album[]>(INITIAL_ALBUMS);
  const [openAlbum, setOpenAlbum] = useState('ALB-02');
  const album = albums.find(a => a.id === openAlbum)!;
  const blockedPhotos = album.photos.filter(p => photoGate(p).length);

  const publishAlbum = () => {
    if (blockedPhotos.length) {
      addToast(`${blockedPhotos.length} photo(s) show students without photo consent`, 'error', 'Remove them or collect consent first — CNS-009');
      return;
    }
    setAlbums(prev => prev.map(a => (a.id === album.id ? { ...a, status: 'Published' } : a)));
    log(`Album published · ${album.title}${album.external ? ' (external share)' : ''}`);
    addToast(`${album.title} published`, 'success', album.external ? 'External share link created' : 'Visible in the parent app');
  };

  const removePhoto = (photoId: string) => setAlbums(prev => prev.map(a => (a.id === album.id ? { ...a, photos: a.photos.filter(p => p.id !== photoId) } : a)));

  // -------------------------------------------------------------------------
  // Student log
  // -------------------------------------------------------------------------
  const [logStudent, setLogStudent] = useState('ros-01');
  const studentRecipients = guardians.filter(g => g.studentId === logStudent || g.mobile === INITIAL_ROSTER.find(s => s.id === logStudent)?.guardianMobile);
  const studentLog = messages.flatMap(m =>
    m.trails.filter(t => studentRecipients.some(r => r.id === t.recipientId)).map(t => ({ m, t, r: recipientById(t.recipientId)! }))
  );
  const studentThreads = threads.filter(t => t.studentId === logStudent);

  // -------------------------------------------------------------------------
  // Costs
  // -------------------------------------------------------------------------
  const liveCosts = messages.flatMap(m =>
    m.trails.flatMap(t => t.attempts.filter(a => a.tries > 0).map(a => ({ month: m.sentOn.slice(0, 7), channel: a.channel, event: m.eventId, cost: a.cost, count: a.tries })))
  );
  const byChannel = CHANNELS.map(c => ({
    channel: c,
    messages: liveCosts.filter(x => x.channel === c).reduce((s, x) => s + x.count, 0),
    cost: liveCosts.filter(x => x.channel === c).reduce((s, x) => s + x.cost, 0),
  }));
  const byEvent = events
    .map(e => ({ event: e, cost: liveCosts.filter(x => x.event === e.id).reduce((s, x) => s + x.cost, 0), messages: messages.filter(m => m.eventId === e.id).length }))
    .filter(x => x.messages);
  const months = Array.from(new Set([...HISTORIC_COSTS.map(h => h.month), ...liveCosts.map(l => l.month)])).sort();
  const monthTotal = (m: string) => HISTORIC_COSTS.filter(h => h.month === m).reduce((s, h) => s + h.cost, 0) + liveCosts.filter(l => l.month === m).reduce((s, l) => s + l.cost, 0);
  const maxMonth = Math.max(1, ...months.map(monthTotal));
  const branches = Array.from(new Set(HISTORIC_COSTS.map(h => h.branch)));

  // -------------------------------------------------------------------------
  // Setup helpers
  // -------------------------------------------------------------------------
  const [openEvent, setOpenEvent] = useState('EV-FEE-DUE');
  const [tplLang, setTplLang] = useState<Language>('en');
  const editEvent = (id: string, patch: Partial<EventDef>) => setEvents(prev => prev.map(e => (e.id === id ? { ...e, ...patch } : e)));
  const moveChannel = (e: EventDef, idx: number, dir: -1 | 1) => {
    const order = [...e.order];
    const j = idx + dir;
    if (j < 0 || j >= order.length) return;
    [order[idx], order[j]] = [order[j], order[idx]];
    editEvent(e.id, { order });
  };
  const syncWhatsApp = () => {
    setTemplates(prev => prev.map(t => (t.whatsapp?.status === 'Pending' ? { ...t, whatsapp: { ...t.whatsapp, status: 'Approved' } } : t)));
    log('WhatsApp template sync');
    addToast('Templates synced from Meta', 'success', 'admission_offer is now approved; birthday_wish remains rejected');
  };
  const editedEvent = events.find(e => e.id === openEvent)!;
  const editedTemplate = templates.find(t => t.id === editedEvent.templateId)!;

  const exportLedger = () => {
    downloadCsv(
      `Message_Ledger_${asOf}.csv`,
      ['Message', 'Event', 'Recipient', 'Language', 'Channel', 'Result', 'Tries', 'Cost', 'Reason'],
      messages.flatMap(m => m.trails.flatMap(t => t.attempts.map(a => [m.id, m.eventId, recipientById(t.recipientId)?.name ?? t.recipientId, t.language, a.channel, a.result, a.tries, a.cost, a.reason ?? ''])))
    );
    addToast('Message ledger exported', 'success', 'Export event logged — AUD-003');
  };

  const optedOut = guardians.filter(g => g.optedOut.length);
  const heldMessages = messages.reduce((s, m) => s + m.trails.filter(t => t.status === 'Held').length, 0);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0e5d84] uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm">campaign</span>
            <span>Modules 7 & 27 · Notifications (NOT) & Communication (COM)</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-[#082b3d]">Communication Desk</h1>
          <p className="text-xs text-[#464555] mt-1">
            {guardians.filter(g => g.primary).length} guardian households · {STAFF.length} staff · DLT entity {binding.entityId} ({binding.status})
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs self-start sm:self-auto">
          <span className="font-semibold text-[#464555]">Sending as</span>
          <select value={senderRole} onChange={e => setSenderRole(e.target.value as typeof senderRole)} className={inputCls} aria-label="Sending role">
            {['Principal', 'Branch Admin', 'Teacher', 'Accountant'].map(r => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Messages sent', value: messages.filter(m => !m.scheduledFor).length, sub: `${messages.filter(m => m.scheduledFor).length} scheduled` },
          { label: 'Held for quiet hours', value: heldMessages, sub: `quiet ${quiet.start}–${quiet.end}` },
          { label: 'Awaiting moderation', value: heldCount, sub: 'parent–teacher messages' },
          { label: 'Opted-out guardians', value: optedOut.length, sub: 'channels honoured automatically' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-[#e0ecf4] p-3 shadow-xs">
            <p className="text-2xl font-bold text-[#082b3d]">{k.value}</p>
            <p className="text-[11px] font-semibold text-[#082b3d]">{k.label}</p>
            <p className="text-[10px] text-[#777587]">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-[#e0ecf4]">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id ? 'border-[#0e5d84] text-[#0e5d84]' : 'border-transparent text-[#777587] hover:text-[#082b3d]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
      <FeatureTags ids={TABS.find(t => t.id === tab)!.ids} />

      {/* ------------------------------------------------------------ Compose */}
      {tab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Panel className="lg:col-span-2" title={emergency ? '🚨 Emergency broadcast' : 'New message'}>
            <div className="p-3 space-y-3 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <label className="block">
                  <span className="block text-[10px] font-semibold text-[#464555]">Event / template</span>
                  <select value={eventId} onChange={e => { setEventId(e.target.value); setChannelOverride(null); }} disabled={emergency} className={`${inputCls} w-full`} aria-label="Event">
                    {events.filter(e => e.id !== 'EV-EMERGENCY').map(e => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-end gap-2">
                  <input type="checkbox" checked={emergency} onChange={e => { setEmergency(e.target.checked); setConfirmEmergency(false); }} disabled={!canEmergency} className="accent-rose-600" aria-label="Emergency broadcast" />
                  <span className={canEmergency ? 'text-rose-700 font-semibold' : 'text-[#777587]'}>
                    Emergency broadcast {canEmergency ? '(ignores quiet hours and cost rules)' : `— not allowed for ${senderRole}`}
                  </span>
                </label>
              </div>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className={`${inputCls} w-full`} aria-label="Title" />
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={3} placeholder="Message" className={`${inputCls} w-full`} aria-label="Message" />
              {missingVars.length > 0 && <p className="text-[10px] text-amber-700">This template also uses {missingVars.map(v => `{{${v}}}`).join(', ')}, which are filled per student when sent automatically.</p>}

              <div className="space-y-1.5">
                <p className="font-semibold text-[#082b3d]">Audience</p>
                <div className="flex flex-wrap gap-1">
                  <Chip active={audience.group === 'Guardians'} onClick={() => setAudience({ ...audience, group: 'Guardians' })}>
                    Guardians
                  </Chip>
                  <Chip active={audience.group === 'Staff'} onClick={() => setAudience({ ...audience, group: 'Staff' })}>
                    Staff
                  </Chip>
                </div>
                {audience.group === 'Guardians' && (
                  <>
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[10px] text-[#777587] w-16">Class</span>
                      {[8, 9, 10].map(c => (
                        <Chip key={c} active={audience.classes.includes(c)} onClick={() => setAudience({ ...audience, classes: toggle(audience.classes, c) })} label={`Class ${c}`}>
                          {c}
                        </Chip>
                      ))}
                      <span className="text-[10px] text-[#777587] w-16 ml-2">Section</span>
                      {['A', 'B'].map(s => (
                        <Chip key={s} active={audience.sections.includes(s)} onClick={() => setAudience({ ...audience, sections: toggle(audience.sections, s) })} label={`Section ${s}`}>
                          {s}
                        </Chip>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[10px] text-[#777587] w-16">Fee</span>
                      {['Paid', 'Due', 'Overdue'].map(f => (
                        <Chip key={f} active={audience.feeStatus.includes(f)} onClick={() => setAudience({ ...audience, feeStatus: toggle(audience.feeStatus, f) })}>
                          {f}
                        </Chip>
                      ))}
                      <Chip active={audience.transportOnly} onClick={() => setAudience({ ...audience, transportOnly: !audience.transportOnly })}>
                        Bus users only
                      </Chip>
                      <Chip active={audience.allGuardians} onClick={() => setAudience({ ...audience, allGuardians: !audience.allGuardians })}>
                        Include second guardians
                      </Chip>
                    </div>
                  </>
                )}
                <p className="text-[11px] text-[#464555]">
                  {recipients.length} recipient(s). Siblings share one guardian, so each household receives one copy. Languages:{' '}
                  {(['en', 'ta', 'hi'] as Language[]).map(l => `${LANGUAGE_NAMES[l].split(' ')[0]} ${recipients.filter(r => r.language === l).length}`).join(' · ')}
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-[#082b3d]">Channels, in order</p>
                <div className="flex flex-wrap gap-1">
                  {CHANNELS.map(c => (
                    <Chip
                      key={c}
                      active={channels.includes(c)}
                      onClick={() => {
                        const next = toggle(channels, c);
                        setChannelOverride(next.length ? next : null);
                      }}
                    >
                      {channels.includes(c) ? `${channels.indexOf(c) + 1}. ` : ''}
                      {c}
                    </Chip>
                  ))}
                  {channelOverride && (
                    <button type="button" onClick={() => setChannelOverride(null)} className="text-[11px] text-[#0e5d84] underline">
                      use event default
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={circular} onChange={e => setCircular(e.target.checked)} className="accent-[#0e5d84]" />
                  Numbered circular
                </label>
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={ackRequired} onChange={e => setAckRequired(e.target.checked)} className="accent-[#0e5d84]" />
                  Acknowledgement required
                </label>
                {circular && <input value={attachment} onChange={e => setAttachment(e.target.value)} placeholder="Attachment file name" className={inputCls} aria-label="Attachment" />}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1">
                  Send time
                  <input type="time" value={sendTime} onChange={e => setSendTime(e.target.value)} className={inputCls} aria-label="Send time" />
                </label>
                <label className="flex items-center gap-1">
                  Schedule for
                  <input type="date" value={scheduleFor} min={asOf} onChange={e => setScheduleFor(e.target.value)} className={inputCls} aria-label="Schedule date" />
                </label>
                {inQuietHours(sendTime, quiet) && !emergency && event.tier !== 'Critical' && (
                  <Badge className="bg-amber-50 text-amber-700 border-amber-200">Inside quiet hours — will be held until {quiet.end}</Badge>
                )}
              </div>
              {confirmEmergency && (
                <div className="p-3 rounded-xl border border-rose-300 bg-rose-50 text-rose-800 space-y-2">
                  <p className="font-semibold">Send an emergency broadcast to {recipients.length} recipient(s) on every permitted channel? This is logged.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmEmergency(false)} className={btnSoft}>
                      Cancel
                    </button>
                    <button onClick={send} className={btnDanger}>
                      Confirm emergency send
                    </button>
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <button onClick={send} className={emergency ? btnDanger : btnPrimary}>
                  {scheduleFor && scheduleFor > asOf ? 'Schedule' : emergency ? 'Send emergency broadcast' : 'Send'}
                </button>
              </div>
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel
              title="Preview"
              actions={
                <select value={previewLang} onChange={e => setPreviewLang(e.target.value as Language)} className={inputCls} aria-label="Preview language">
                  {(['en', 'ta', 'hi'] as Language[]).map(l => (
                    <option key={l} value={l}>
                      {LANGUAGE_NAMES[l]}
                      {template.body[l] ? '' : ' (falls back to English)'}
                    </option>
                  ))}
                </select>
              }
            >
              <div className="p-3 space-y-2 text-xs">
                <div className="p-3 rounded-2xl bg-[#e7f6ec] text-[#082b3d] whitespace-pre-wrap">{previewText}</div>
                <p className="text-[10px] text-[#777587]">
                  {previewText.length} characters · {smsSegments(previewText)} SMS segment(s) · DLT {template.dltTemplateId ?? 'not registered'} · sender {template.senderId ?? '—'} · WhatsApp {template.whatsapp ? `${template.whatsapp.name} (${template.whatsapp.status})` : 'not mapped'}
                </p>
              </div>
            </Panel>
            <Panel title="Dry run (nothing is sent)">
              <div className="p-3 grid grid-cols-2 gap-2 text-xs">
                {[
                  ['Delivered', dryRun.delivered],
                  ['Read', dryRun.read],
                  ['Held', dryRun.held],
                  ['Not delivered', dryRun.failed + dryRun.blocked],
                ].map(([k, v]) => (
                  <div key={k} className="p-2 rounded-lg bg-slate-50">
                    <p className="text-lg font-bold">{v}</p>
                    <p className="text-[10px] text-[#777587]">{k}</p>
                  </div>
                ))}
                <p className="col-span-2 text-[11px]">Estimated cost {rupees(dryRun.cost)}</p>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- Outbox */}
      {tab === 'outbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Panel title="Messages">
            <div className="divide-y divide-[#f0f7fb] max-h-[640px] overflow-y-auto">
              {messages.map(m => {
                const s = summarise(m.trails);
                return (
                  <button key={m.id} onClick={() => setOpenMessage(m.id)} className={`w-full text-left p-3 text-xs ${m.id === openMessage ? 'bg-[#f0f7fb]' : 'hover:bg-[#f8f9ff]'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#082b3d] truncate">
                        {m.emergency && '🚨 '}
                        {m.title}
                      </span>
                      <span className="font-mono text-[10px] text-[#777587]">{m.id}</span>
                    </div>
                    <p className="text-[10px] text-[#777587]">
                      {m.scheduledFor ? `Scheduled ${fmt(m.scheduledFor)} ${m.sentAt}` : `${fmt(m.sentOn)} ${m.sentAt} · ${s.delivered}/${s.total} delivered · ${s.read} read`}
                      {m.circularNo && ` · ${m.circularNo}`}
                    </p>
                  </button>
                );
              })}
            </div>
          </Panel>

          {current && (
            <div className="lg:col-span-2 space-y-4">
              <Panel
                title={
                  <span>
                    {current.id} · {current.title}
                  </span>
                }
                actions={
                  <div className="flex flex-wrap gap-1">
                    {current.scheduledFor && (
                      <button onClick={() => sendScheduledNow(current)} className={btnPrimary}>
                        Send now
                      </button>
                    )}
                    {current.trails.some(t => t.status === 'Held') && (
                      <button onClick={() => releaseHeld(current)} className={btnPrimary}>
                        Release held at {quiet.end}
                      </button>
                    )}
                    {current.ackRequired && (
                      <button onClick={() => remindUnacknowledged(current)} className={btnSoft}>
                        Remind unacknowledged
                      </button>
                    )}
                  </div>
                }
              >
                <div className="p-3 text-xs space-y-2">
                  <p>
                    {current.audienceLabel} · by {current.sentBy} · {current.emergency ? 'emergency' : events.find(e => e.id === current.eventId)?.tier}
                    {current.circularNo && ` · circular ${current.circularNo}`}
                    {current.attachment && ` · 📎 ${current.attachment}`}
                  </p>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {Object.entries(summarise(current.trails))
                      .filter(([k]) => k !== 'cost')
                      .map(([k, v]) => (
                        <div key={k} className="p-2 rounded-lg bg-slate-50 text-center">
                          <p className="text-base font-bold">{v}</p>
                          <p className="text-[10px] text-[#777587] capitalize">{k}</p>
                        </div>
                      ))}
                  </div>
                  <p>
                    Cost {rupees(summarise(current.trails).cost)}
                    {current.ackRequired && ` · acknowledged ${current.acknowledged.length} of ${current.trails.length}`}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(['All', 'Not delivered', 'Unread', 'Held'] as const).map(f => (
                      <Chip key={f} active={trailFilter === f} onClick={() => setTrailFilter(f)}>
                        {f}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-[#464555]">
                      <tr>
                        {['Recipient', 'Lang', 'Delivery trail', 'Status', current.ackRequired ? 'Ack' : ''].map(h => (
                          <th key={h} className="text-left p-2.5 font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f7fb]">
                      {current.trails
                        .filter(t => trailFilter === 'All' || (trailFilter === 'Not delivered' ? t.status === 'Failed' || t.status === 'Blocked' : trailFilter === 'Unread' ? t.status === 'Delivered' : t.status === 'Held'))
                        .map(t => {
                          const r = recipientById(t.recipientId);
                          return (
                            <tr key={t.recipientId} className="align-top">
                              <td className="p-2.5">
                                <p className="font-semibold">{r?.name}</p>
                                <p className="text-[10px] text-[#777587]">{r?.kind === 'Guardian' ? `${r.primary ? 'Primary' : 'Second'} guardian of ${nameOfStudent(r.studentId)}` : r?.kind}</p>
                              </td>
                              <td className="p-2.5 uppercase">{t.language}</td>
                              <td className="p-2.5 space-y-0.5">
                                {t.heldUntil && <p className="text-amber-700">Held until {t.heldUntil} (quiet hours)</p>}
                                {t.attempts.map((a, i) => (
                                  <p key={i}>
                                    <span className="font-semibold">{a.channel}</span> <Badge className={STATUS_STYLE[a.result]}>{a.result}</Badge>
                                    {a.reason && <span className="text-[10px] text-[#777587]"> {a.reason}</span>}
                                    {a.cost > 0 && <span className="text-[10px] font-mono"> {rupees(a.cost)}</span>}
                                  </p>
                                ))}
                              </td>
                              <td className="p-2.5">
                                <Badge className={STATUS_STYLE[t.status]}>{t.status}</Badge>
                              </td>
                              <td className="p-2.5">
                                {current.ackRequired &&
                                  (current.acknowledged.includes(t.recipientId) ? (
                                    <span className="text-emerald-700 font-semibold">✓</span>
                                  ) : t.status === 'Read' ? (
                                    <button onClick={() => acknowledge(current, t.recipientId)} className="text-[10px] text-[#0e5d84] underline">
                                      record
                                    </button>
                                  ) : (
                                    <span className="text-[#777587]">—</span>
                                  ))}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                  {current.scheduledFor && <p className="p-3 text-xs text-[#777587]">Scheduled — delivery trails appear once it is sent.</p>}
                </div>
              </Panel>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------- Board */}
      {tab === 'board' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel title={`Notice board · ${activeNotices.length} active · ${expiredNotices.length} expired`}>
              <div className="p-3 space-y-2 text-xs border-b border-[#f0f7fb]">
                <input value={newNotice.title} onChange={e => setNewNotice({ ...newNotice, title: e.target.value })} placeholder="Notice title" className={`${inputCls} w-full`} aria-label="Notice title" />
                <input value={newNotice.body} onChange={e => setNewNotice({ ...newNotice, body: e.target.value })} placeholder="Details" className={`${inputCls} w-full`} aria-label="Notice details" />
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1">
                    Show until
                    <input type="date" value={newNotice.expiresOn} min={asOf} onChange={e => setNewNotice({ ...newNotice, expiresOn: e.target.value })} className={inputCls} aria-label="Notice expiry" />
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="checkbox" checked={newNotice.pinned} onChange={e => setNewNotice({ ...newNotice, pinned: e.target.checked })} className="accent-[#0e5d84]" />
                    Pin to top
                  </label>
                  <button
                    onClick={() => {
                      if (!newNotice.title.trim()) return;
                      setNotices(prev => [{ id: `NB-${String(prev.length + 1).padStart(2, '0')}`, title: newNotice.title.trim(), body: newNotice.body.trim(), postedOn: asOf, expiresOn: newNotice.expiresOn, pinned: newNotice.pinned, audience: 'All parents' }, ...prev]);
                      setNewNotice({ title: '', body: '', expiresOn: newNotice.expiresOn, pinned: false });
                      addToast('Notice posted', 'success');
                    }}
                    disabled={!newNotice.title.trim()}
                    className={btnPrimary}
                  >
                    Post notice
                  </button>
                </div>
              </div>
              <div className="divide-y divide-[#f0f7fb]">
                {activeNotices.map(n => (
                  <div key={n.id} className="p-3 text-xs">
                    <p className="font-semibold text-[#082b3d]">
                      {n.pinned && '📌 '}
                      {n.title}
                    </p>
                    <p>{n.body}</p>
                    <p className="text-[10px] text-[#777587]">
                      {n.audience} · posted {fmt(n.postedOn)} · until {fmt(n.expiresOn)}
                    </p>
                  </div>
                ))}
                {expiredNotices.map(n => (
                  <p key={n.id} className="p-3 text-[11px] text-[#777587]">
                    Expired: {n.title} (until {fmt(n.expiresOn)})
                  </p>
                ))}
              </div>
            </Panel>

            <Panel title="Event calendar · September 2024">
              <div className="p-3 text-xs">
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-[#777587] mb-1">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((d, i) =>
                    d ? (
                      <div key={d} className={`min-h-[48px] rounded-lg border p-1 ${d === asOf ? 'border-[#0e5d84] bg-[#f0f7fb]' : 'border-[#e0ecf4]'}`}>
                        <p className="text-[10px] font-mono">{Number(d.slice(8))}</p>
                        {calEvents
                          .filter(e => e.date === d)
                          .map(e => (
                            <p
                              key={e.id}
                              className={`text-[9px] leading-tight rounded px-0.5 ${
                                e.kind === 'Exam' ? 'bg-rose-100 text-rose-800' : e.kind === 'Holiday' ? 'bg-slate-200' : e.kind === 'Meeting' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {e.title}
                            </p>
                          ))}
                      </div>
                    ) : (
                      <div key={`pad-${i}`} />
                    )
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  <input type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} min="2024-09-01" max="2024-09-30" className={inputCls} aria-label="Event date" />
                  <input value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Event" className={inputCls} aria-label="Event title" />
                  <select value={newEvent.kind} onChange={e => setNewEvent({ ...newEvent, kind: e.target.value as SchoolEvent['kind'] })} className={inputCls} aria-label="Event kind">
                    {['Activity', 'Meeting', 'Exam', 'Holiday'].map(k => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      if (!newEvent.title.trim()) return;
                      setCalEvents(prev => [...prev, { id: `E${prev.length + 1}`, date: newEvent.date, title: newEvent.title.trim(), kind: newEvent.kind }]);
                      setNewEvent({ ...newEvent, title: '' });
                    }}
                    disabled={!newEvent.title.trim()}
                    className={btnPrimary}
                  >
                    Add
                  </button>
                </div>
              </div>
            </Panel>
          </div>

          <Panel
            title="PTM · Saturday 21 September · 10-minute slots"
            actions={
              <label className="flex items-center gap-1 text-xs">
                Booking for
                <select value={booker} onChange={e => setBooker(e.target.value)} className={inputCls} aria-label="Booking guardian">
                  {guardians
                    .filter(g => g.primary)
                    .map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({nameOfStudent(g.studentId)})
                      </option>
                    ))}
                </select>
              </label>
            }
          >
            <div className="overflow-x-auto">
              <table className="text-[10px]">
                <thead>
                  <tr>
                    <th className="p-1.5 text-left">Teacher</th>
                    {Array.from(new Set(slots.map(s => s.start))).map(t => (
                      <th key={t} className="p-1 font-mono font-normal">
                        {t}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PTM_TEACHERS.map(teacher => (
                    <tr key={teacher}>
                      <td className="p-1.5 font-semibold whitespace-nowrap">{teacher}</td>
                      {slots
                        .filter(s => s.teacher === teacher)
                        .map(s => (
                          <td key={s.id} className="p-0.5">
                            <button
                              onClick={() => book(s)}
                              disabled={Boolean(s.bookedBy)}
                              title={s.bookedBy ? `Booked by ${recipientById(s.bookedBy)?.name}` : 'Free'}
                              aria-label={`${teacher} ${s.start}`}
                              className={`w-12 py-1 rounded ${s.bookedBy === booker ? 'bg-[#0e5d84] text-white' : s.bookedBy ? 'bg-slate-200 text-slate-500' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'}`}
                            >
                              {s.bookedBy === booker ? 'Mine' : s.bookedBy ? 'Taken' : 'Free'}
                            </button>
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="p-3 text-[10px] text-[#777587]">
              {slots.filter(s => s.bookedBy).length} of {slots.length} slots booked. A guardian cannot book two teachers for the same time.
            </p>
          </Panel>
        </div>
      )}

      {/* ------------------------------------------------------------ Threads */}
      {tab === 'threads' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Panel title="Conversations">
            <div className="divide-y divide-[#f0f7fb]">
              {threads.map(t => (
                <button key={t.id} onClick={() => setOpenThread(t.id)} className={`w-full text-left p-3 text-xs ${t.id === openThread ? 'bg-[#f0f7fb]' : 'hover:bg-[#f8f9ff]'}`}>
                  <p className="font-semibold text-[#082b3d]">
                    {t.subject} · {nameOfStudent(t.studentId)}
                  </p>
                  <p className="text-[10px] text-[#777587]">
                    {t.teacher}
                    {t.messages.some(m => m.status === 'Held for moderation') && ' · ⚠ awaiting moderation'}
                  </p>
                </button>
              ))}
            </div>
          </Panel>
          <Panel className="lg:col-span-2" title={`${thread.subject} · ${thread.teacher} ↔ guardian of ${nameOfStudent(thread.studentId)}`}>
            <div className="p-3 space-y-2 text-xs">
              {thread.messages.map((m, i) => (
                <div key={i} className={`max-w-[80%] p-2 rounded-xl ${m.from === 'Teacher' ? 'bg-[#f0f7fb]' : 'bg-emerald-50 ml-auto'} ${m.status !== 'Delivered' ? 'border border-dashed border-amber-400' : ''}`}>
                  <p className={m.status === 'Rejected' ? 'line-through text-[#777587]' : ''}>{m.text}</p>
                  <p className="text-[10px] text-[#777587]">
                    {m.from} · {m.at} · {m.status}
                  </p>
                  {m.flags && m.status === 'Held for moderation' && (
                    <div className="mt-1 space-y-1">
                      <p className="text-[10px] text-amber-700">{m.flags.join(' · ')}</p>
                      <span className="flex gap-1">
                        <button onClick={() => moderate(thread.id, i, false)} className={btnSoft}>
                          Reject
                        </button>
                        <button onClick={() => moderate(thread.id, i, true)} className={btnPrimary}>
                          Approve
                        </button>
                      </span>
                    </div>
                  )}
                </div>
              ))}
              <p className="text-[10px] text-[#777587]">Phone numbers stay private: teachers and parents talk here without seeing each other’s contact details.</p>
              <div className="flex gap-1">
                <select value={replyAs} onChange={e => setReplyAs(e.target.value as 'Teacher' | 'Parent')} className={inputCls} aria-label="Reply as">
                  <option>Teacher</option>
                  <option>Parent</option>
                </select>
                <input value={reply} onChange={e => setReply(e.target.value)} placeholder="Write a reply" className={`${inputCls} flex-1`} aria-label="Reply" />
                <button onClick={postReply} disabled={!reply.trim()} className={btnPrimary}>
                  Send
                </button>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* ---------------------------------------------------------------- Log */}
      {tab === 'log' && (
        <Panel
          title="Everything sent about one student"
          actions={
            <select value={logStudent} onChange={e => setLogStudent(e.target.value)} className={inputCls} aria-label="Log student">
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.classLevel}-{s.section}
                </option>
              ))}
            </select>
          }
        >
          <div className="p-3 text-xs space-y-1 border-b border-[#f0f7fb]">
            {studentRecipients.map(r => (
              <p key={r.id}>
                {r.name} · {r.primary ? 'primary' : 'second'} guardian · {LANGUAGE_NAMES[r.language]} · app {r.appInstalled ? 'yes' : 'no'} · WhatsApp {r.whatsappOptIn ? 'opted in' : 'no'}
                {r.optedOut.length > 0 && <span className="text-rose-700"> · opted out of {r.optedOut.join(', ')}</span>}
              </p>
            ))}
          </div>
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-[#464555]">
              <tr>
                {['Date', 'Message', 'To', 'Channels', 'Status'].map(h => (
                  <th key={h} className="text-left p-2.5 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f7fb]">
              {studentLog.map(({ m, t, r }) => (
                <tr key={`${m.id}-${t.recipientId}`}>
                  <td className="p-2.5 font-mono whitespace-nowrap">{fmt(m.sentOn)} {m.sentAt}</td>
                  <td className="p-2.5">
                    <p className="font-semibold">{m.title}</p>
                    <p className="text-[10px] text-[#777587]">{t.text}</p>
                  </td>
                  <td className="p-2.5">{r.name}</td>
                  <td className="p-2.5">{t.attempts.filter(a => a.tries > 0).map(a => `${a.channel} (${a.result})`).join(', ') || '—'}</td>
                  <td className="p-2.5">
                    <Badge className={STATUS_STYLE[t.status]}>{t.status}</Badge>
                  </td>
                </tr>
              ))}
              {studentThreads.map(t => (
                <tr key={t.id}>
                  <td className="p-2.5 font-mono whitespace-nowrap">{t.messages[t.messages.length - 1].at}</td>
                  <td className="p-2.5">
                    <p className="font-semibold">Conversation: {t.subject}</p>
                    <p className="text-[10px] text-[#777587]">{t.messages.length} message(s)</p>
                  </td>
                  <td className="p-2.5">{t.teacher}</td>
                  <td className="p-2.5">In-app</td>
                  <td className="p-2.5">—</td>
                </tr>
              ))}
            </tbody>
          </table>
          {studentLog.length === 0 && studentThreads.length === 0 && <p className="p-3 text-xs text-[#777587]">Nothing sent yet.</p>}
        </Panel>
      )}

      {/* ------------------------------------------------------------ Gallery */}
      {tab === 'gallery' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Panel title="Albums">
            <div className="divide-y divide-[#f0f7fb]">
              {albums.map(a => (
                <button key={a.id} onClick={() => setOpenAlbum(a.id)} className={`w-full text-left p-3 text-xs ${a.id === openAlbum ? 'bg-[#f0f7fb]' : 'hover:bg-[#f8f9ff]'}`}>
                  <p className="font-semibold">{a.title}</p>
                  <p className="text-[10px] text-[#777587]">
                    {fmt(a.date)} · {a.photos.length} photos · {a.status}
                    {a.external ? ' · external share' : ''}
                  </p>
                </button>
              ))}
            </div>
          </Panel>
          <Panel
            className="lg:col-span-2"
            title={`${album.title} · ${album.status}`}
            actions={
              album.status === 'Draft' && (
                <button onClick={publishAlbum} className={btnPrimary}>
                  Publish album
                </button>
              )
            }
          >
            {blockedPhotos.length > 0 && album.status === 'Draft' && (
              <p className="m-3 p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-800">
                {blockedPhotos.length} photo(s) show students whose guardians have not consented to photo use. Publishing is blocked until they are removed.
              </p>
            )}
            <div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {album.photos.map(p => {
                const blocked = photoGate(p);
                return (
                  <div key={p.id} className={`rounded-xl border p-2 space-y-1 ${blocked.length ? 'border-rose-300 bg-rose-50' : 'border-[#e0ecf4]'}`}>
                    <div className="aspect-video rounded-lg bg-gradient-to-br from-sky-100 to-emerald-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-3xl text-[#0e5d84]">photo_camera</span>
                    </div>
                    <p className="font-semibold">{p.caption}</p>
                    <p className="text-[10px] text-[#777587]">{p.studentIds.length ? p.studentIds.map(id => nameOfStudent(id)).join(', ') : 'No students tagged'}</p>
                    {blocked.length > 0 && (
                      <>
                        <p className="text-[10px] text-rose-700">No photo consent: {blocked.map(id => nameOfStudent(id)).join(', ')}</p>
                        {album.status === 'Draft' && (
                          <button onClick={() => removePhoto(p.id)} className={btnSoft}>
                            Remove photo
                          </button>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="px-3 pb-3 text-[10px] text-[#777587]">Photos of children are personal data. Every gallery publish checks each tagged student’s photo consent.</p>
          </Panel>
        </div>
      )}

      {/* -------------------------------------------------------------- Setup */}
      {tab === 'setup' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Panel title="Events">
              <div className="divide-y divide-[#f0f7fb]">
                {events.map(e => (
                  <button key={e.id} onClick={() => setOpenEvent(e.id)} className={`w-full text-left p-2.5 text-xs ${e.id === openEvent ? 'bg-[#f0f7fb]' : 'hover:bg-[#f8f9ff]'}`}>
                    <p className="font-semibold">{e.name}</p>
                    <p className="text-[10px] text-[#777587]">
                      {e.tier} · {e.order.join(' → ')}
                    </p>
                  </button>
                ))}
              </div>
              <p className="p-3 text-[10px] text-[#777587]">These are the events other features name. The full event list (Appendix D) was not in the source provided.</p>
            </Panel>

            <Panel className="lg:col-span-2" title={`Routing policy · ${editedEvent.name}`}>
              <div className="p-3 space-y-3 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-1">
                    Tier
                    <select value={editedEvent.tier} onChange={e => editEvent(editedEvent.id, { tier: e.target.value as EventDef['tier'] })} className={inputCls} aria-label="Event tier">
                      {['Critical', 'Standard', 'Promotional'].map(t => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="checkbox" checked={editedEvent.fallback} onChange={e => editEvent(editedEvent.id, { fallback: e.target.checked })} className="accent-[#0e5d84]" />
                    Try the next channel on failure
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="checkbox" checked={editedEvent.costAware} onChange={e => editEvent(editedEvent.id, { costAware: e.target.checked })} className="accent-[#0e5d84]" />
                    Skip paid channels when read in the app
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {editedEvent.order.map((c, i) => (
                    <span key={c} className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-slate-50 border border-[#e0ecf4]">
                      {i + 1}. {c} <span className="font-mono text-[10px] text-[#777587]">{rupees(CHANNEL_COST[c])}</span>
                      <button onClick={() => moveChannel(editedEvent, i, -1)} disabled={i === 0} className="disabled:opacity-30" aria-label={`Move ${c} earlier`}>
                        ‹
                      </button>
                      <button onClick={() => moveChannel(editedEvent, i, 1)} disabled={i === editedEvent.order.length - 1} className="disabled:opacity-30" aria-label={`Move ${c} later`}>
                        ›
                      </button>
                    </span>
                  ))}
                </div>
                <div className="p-2 rounded-lg bg-slate-50 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Template {editedTemplate.id} · {editedTemplate.name}</p>
                    <select value={tplLang} onChange={e => setTplLang(e.target.value as Language)} className={inputCls} aria-label="Template language">
                      {(['en', 'ta', 'hi'] as Language[]).map(l => (
                        <option key={l} value={l}>
                          {LANGUAGE_NAMES[l]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    value={editedTemplate.body[tplLang] ?? ''}
                    onChange={e => setTemplates(prev => prev.map(t => (t.id === editedTemplate.id ? { ...t, body: { ...t.body, [tplLang]: e.target.value || undefined } } : t)))}
                    placeholder={tplLang === 'en' ? 'English body is required' : 'Leave empty to fall back to English'}
                    rows={3}
                    className={`${inputCls} w-full`}
                    aria-label="Template body"
                  />
                  <p className="text-[10px] text-[#777587]">Variables: {templateVariables(editedTemplate.body.en ?? '').map(v => `{{${v}}}`).join(' ')}</p>
                </div>
              </div>
            </Panel>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel title="DLT registry & telemarketer binding">
              <div className="p-3 space-y-2 text-xs">
                <p>
                  Entity <span className="font-mono">{binding.entityId}</span> · {binding.telemarketer}
                </p>
                <p>
                  Sender IDs: {binding.senderIds.join(', ')} · valid until {fmt(binding.validUntil)}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setBinding(b => ({ ...b, status: b.status === 'Live' ? 'Expired' : 'Live' }));
                      log(`Telemarketer binding set to ${binding.status === 'Live' ? 'Expired' : 'Live'}`);
                    }}
                    className={binding.status === 'Live' ? btnSoft : btnPrimary}
                  >
                    {binding.status === 'Live' ? 'Mark binding expired' : 'Restore live binding'}
                  </button>
                  <Badge className={binding.status === 'Live' ? STATUS_STYLE.Read : STATUS_STYLE.Blocked}>{binding.status}</Badge>
                </div>
                <table className="w-full">
                  <thead className="text-[#464555]">
                    <tr>
                      <th className="text-left">Template</th>
                      <th className="text-left">DLT ID</th>
                      <th className="text-left">Sender</th>
                      <th className="text-left">SMS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map(t => (
                      <tr key={t.id}>
                        <td>{t.name}</td>
                        <td className="font-mono">{t.dltTemplateId ?? '—'}</td>
                        <td>{t.senderId ?? '—'}</td>
                        <td>{t.dltTemplateId && t.senderId && binding.status === 'Live' && binding.senderIds.includes(t.senderId) ? '✓ allowed' : <span className="text-rose-700">blocked</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel
              title="WhatsApp templates"
              actions={
                <button onClick={syncWhatsApp} className={btnSoft}>
                  Sync from Meta
                </button>
              }
            >
              <table className="w-full text-xs">
                <tbody className="divide-y divide-[#f0f7fb]">
                  {templates.map(t => (
                    <tr key={t.id}>
                      <td className="p-2.5">{t.name}</td>
                      <td className="p-2.5 font-mono">{t.whatsapp?.name ?? '—'}</td>
                      <td className="p-2.5">{t.whatsapp?.category ?? ''}</td>
                      <td className="p-2.5">{t.whatsapp ? <Badge className={t.whatsapp.status === 'Approved' ? STATUS_STYLE.Read : t.whatsapp.status === 'Pending' ? STATUS_STYLE.Held : STATUS_STYLE.Blocked}>{t.whatsapp.status}</Badge> : 'Not mapped'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>

            <Panel title="Channel adapters, quiet hours & retries">
              <div className="p-3 space-y-3 text-xs">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {CHANNELS.map(c => (
                    <div key={c} className="p-2 rounded-lg bg-slate-50 text-center">
                      <p className="font-semibold">{c}</p>
                      <p className="text-[10px] text-emerald-700">Connected</p>
                      <p className="text-[10px] font-mono">{rupees(CHANNEL_COST[c])}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1">
                    Quiet from
                    <input type="time" value={quiet.start} onChange={e => setQuiet({ ...quiet, start: e.target.value })} className={inputCls} aria-label="Quiet start" />
                  </label>
                  <label className="flex items-center gap-1">
                    to
                    <input type="time" value={quiet.end} onChange={e => setQuiet({ ...quiet, end: e.target.value })} className={inputCls} aria-label="Quiet end" />
                  </label>
                  <label className="flex items-center gap-1">
                    Max tries
                    <select value={retry.maxAttempts} onChange={e => setRetry({ ...retry, maxAttempts: Number(e.target.value) })} className={inputCls} aria-label="Max tries">
                      {[1, 2, 3, 5].map(n => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  </label>
                  <span className="text-[10px] text-[#777587]">every {retry.backoffMinutes} min; permanent errors go straight to the dead-letter list</span>
                </div>
              </div>
            </Panel>

            <Panel title="Scheduled & recurring sends">
              <div className="divide-y divide-[#f0f7fb]">
                {schedules.map(s => (
                  <div key={s.id} className="p-2.5 text-xs flex items-center justify-between gap-2">
                    <span>
                      <span className="font-semibold">{s.label}</span>
                      <span className="block text-[10px] text-[#777587]">
                        {s.cadence} at {s.time} · next {s.active ? fmt(nextRun(s, asOf)) : 'paused'}
                      </span>
                    </span>
                    <button onClick={() => setSchedules(prev => prev.map(x => (x.id === s.id ? { ...x, active: !x.active } : x)))} className={s.active ? btnSoft : btnPrimary}>
                      {s.active ? 'Pause' : 'Resume'}
                    </button>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <Panel title="Channel opt-outs (honoured on every send)">
            <table className="w-full text-xs">
              <tbody className="divide-y divide-[#f0f7fb]">
                {guardians
                  .filter(g => g.primary)
                  .map(g => (
                    <tr key={g.id}>
                      <td className="p-2.5">
                        {g.name} <span className="text-[10px] text-[#777587]">· {nameOfStudent(g.studentId)}</span>
                      </td>
                      {(['WhatsApp', 'SMS', 'Email'] as Channel[]).map(c => (
                        <td key={c} className="p-2.5">
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={!g.optedOut.includes(c)}
                              onChange={() => {
                                setGuardians(prev => prev.map(x => (x.id === g.id ? { ...x, optedOut: toggle(x.optedOut, c) } : x)));
                                log(`Opt-${g.optedOut.includes(c) ? 'in' : 'out'} · ${g.name} · ${c}`);
                              }}
                              className="accent-[#0e5d84]"
                              aria-label={`${g.name} ${c}`}
                            />
                            {c}
                          </label>
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </Panel>
          <PhaseNotice ids={['COM-015']} phase="Phase 3" note="Feedback forms and surveys arrive with the operations release." />
        </div>
      )}

      {/* -------------------------------------------------------------- Costs */}
      {tab === 'costs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Panel title="By channel (this session’s sends)">
              <table className="w-full text-xs">
                <tbody className="divide-y divide-[#f0f7fb]">
                  {byChannel.map(c => (
                    <tr key={c.channel}>
                      <td className="p-2.5">{c.channel}</td>
                      <td className="p-2.5 font-mono text-right">{c.messages}</td>
                      <td className="p-2.5 font-mono text-right">{rupees(c.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
            <Panel title="By event">
              <table className="w-full text-xs">
                <tbody className="divide-y divide-[#f0f7fb]">
                  {byEvent.map(x => (
                    <tr key={x.event.id}>
                      <td className="p-2.5">{x.event.name}</td>
                      <td className="p-2.5 font-mono text-right">{rupees(x.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
            <Panel title="By branch (August chargeback)">
              <table className="w-full text-xs">
                <tbody className="divide-y divide-[#f0f7fb]">
                  {branches.map(b => (
                    <tr key={b}>
                      <td className="p-2.5">{b}</td>
                      <td className="p-2.5 font-mono text-right">{rupees(HISTORIC_COSTS.filter(h => h.branch === b && h.month === '2024-08').reduce((s, h) => s + h.cost, 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </div>
          <Panel
            title="Monthly spend"
            actions={
              <button onClick={exportLedger} className={btnSoft}>
                Export message ledger
              </button>
            }
          >
            <div className="p-3 space-y-2 text-xs">
              {months.map(m => (
                <div key={m}>
                  <div className="flex justify-between mb-0.5">
                    <span>{m}</span>
                    <span className="font-mono">{rupees(monthTotal(m))}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0e5d84]" style={{ width: `${(monthTotal(m) / maxMonth) * 100}%` }} />
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-[#777587]">Costs up to August come from provider invoices; later months are this system’s own delivery log.</p>
            </div>
          </Panel>
          <Panel title={`Activity log · ${audit.length}`}>
            <div className="p-3 space-y-1 text-[11px] max-h-60 overflow-y-auto">
              {audit.length === 0 && <p className="text-[#777587]">No actions yet.</p>}
              {audit.map((a, i) => (
                <p key={i}>{a}</p>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
};

const describeAudience = (a: Audience) => {
  if (a.group === 'Staff') return 'All staff';
  const parts = [
    a.classes.length ? `Classes ${a.classes.join(', ')}` : 'All classes',
    a.sections.length ? `sections ${a.sections.join(', ')}` : '',
    a.feeStatus.length ? `fee ${a.feeStatus.join('/')}` : '',
    a.transportOnly ? 'bus users' : '',
    a.allGuardians ? 'all guardians' : 'primary guardians',
  ].filter(Boolean);
  return `Guardians · ${parts.join(' · ')}`;
};
