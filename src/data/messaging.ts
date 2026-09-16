// Notifications & communication (LMN-SMS-FEAT-001 §7 NOT, §27 COM).
// NOT-001 – NOT-017 follow the catalogue text; COM-001 – COM-018 are derived from the PDF feature names.
// Channel adapters are simulated: every delivery outcome is a pure function of the message, recipient
// and channel, so the same send always produces the same trail.
import { INITIAL_ROSTER, RosterStudent } from './students';

export const MESSAGING_AS_OF = '2024-09-16';

// ---------------------------------------------------------------------------
// Channels, costs, retry (NOT-003, NOT-010, NOT-011)
// ---------------------------------------------------------------------------

export type Channel = 'In-app' | 'Push' | 'WhatsApp' | 'SMS' | 'Email';
export const CHANNELS: Channel[] = ['In-app', 'Push', 'WhatsApp', 'SMS', 'Email'];

/** Rupees per message (SMS per segment). */
export const CHANNEL_COST: Record<Channel, number> = { 'In-app': 0, Push: 0, WhatsApp: 0.115, SMS: 0.13, Email: 0.02 };

export interface RetryPolicy {
  maxAttempts: number;
  backoffMinutes: number;
}
export const DEFAULT_RETRY: RetryPolicy = { maxAttempts: 3, backoffMinutes: 5 };

export type Tier = 'Critical' | 'Standard' | 'Promotional';
export type Language = 'en' | 'ta' | 'hi';
export const LANGUAGE_NAMES: Record<Language, string> = { en: 'English', ta: 'தமிழ் (Tamil)', hi: 'हिन्दी (Hindi)' };

// ---------------------------------------------------------------------------
// Regulatory registry (NOT-012, NOT-013, NOT-017)
// ---------------------------------------------------------------------------

export interface TelemarketerBinding {
  entityId: string;
  telemarketer: string;
  senderIds: string[];
  status: 'Live' | 'Expired';
  validUntil: string;
}

export const INITIAL_BINDING: TelemarketerBinding = {
  entityId: '1101482750000012345',
  telemarketer: 'Tata Tele Business Services (TM 1702)',
  senderIds: ['LUMNAC', 'LUMFEE'],
  status: 'Live',
  validUntil: '2025-06-30',
};

// ---------------------------------------------------------------------------
// Events, templates, routing (NOT-001, NOT-002, NOT-004, NOT-016)
// ---------------------------------------------------------------------------

export interface EventDef {
  id: string;
  name: string;
  tier: Tier;
  order: Channel[];
  fallback: boolean;
  costAware: boolean;
  templateId: string;
}

/** Events named elsewhere in the catalogue. Appendix D (the full event catalogue) is not in the source provided. */
export const INITIAL_EVENTS: EventDef[] = [
  { id: 'EV-ABSENCE', name: 'Absence alert to parent (ATT-010)', tier: 'Critical', order: ['Push', 'WhatsApp', 'SMS'], fallback: true, costAware: false, templateId: 'TPL-ABSENCE' },
  { id: 'EV-FEE-DUE', name: 'Fee due reminder (FEE-030)', tier: 'Standard', order: ['In-app', 'WhatsApp', 'SMS'], fallback: true, costAware: true, templateId: 'TPL-FEE-DUE' },
  { id: 'EV-RECEIPT', name: 'Fee receipt issued (FEE-020)', tier: 'Standard', order: ['In-app', 'Email', 'WhatsApp'], fallback: true, costAware: true, templateId: 'TPL-RECEIPT' },
  { id: 'EV-OFFER', name: 'Admission offer dispatch (ADM-051)', tier: 'Standard', order: ['Email', 'WhatsApp', 'In-app'], fallback: false, costAware: false, templateId: 'TPL-OFFER' },
  { id: 'EV-RESULT', name: 'Result published (EXM-019)', tier: 'Standard', order: ['In-app', 'Push', 'SMS'], fallback: true, costAware: true, templateId: 'TPL-RESULT' },
  { id: 'EV-NOTICE', name: 'School announcement (COM-001)', tier: 'Standard', order: ['In-app', 'Push', 'WhatsApp'], fallback: true, costAware: true, templateId: 'TPL-NOTICE' },
  { id: 'EV-BIRTHDAY', name: 'Birthday wishes (NOT-014)', tier: 'Promotional', order: ['In-app', 'WhatsApp'], fallback: false, costAware: true, templateId: 'TPL-BIRTHDAY' },
  { id: 'EV-EMERGENCY', name: 'Emergency broadcast (NOT-015)', tier: 'Critical', order: ['Push', 'SMS', 'WhatsApp'], fallback: true, costAware: false, templateId: 'TPL-EMERGENCY' },
];

export interface Template {
  id: string;
  name: string;
  /** Body per language; en is mandatory */
  body: Partial<Record<Language, string>>;
  dltTemplateId?: string;
  senderId?: string;
  whatsapp?: { name: string; category: 'Utility' | 'Marketing'; status: 'Approved' | 'Pending' | 'Rejected' };
}

export const INITIAL_TEMPLATES: Template[] = [
  {
    id: 'TPL-ABSENCE',
    name: 'Absence alert',
    body: {
      en: 'Dear {{guardian}}, {{student}} ({{class}}) is marked {{status}} today, {{date}}. Please contact the class teacher if this is unexpected. - Lumen Academy',
      ta: 'அன்புள்ள {{guardian}}, {{student}} ({{class}}) இன்று {{date}} {{status}} என பதிவு செய்யப்பட்டுள்ளது. - லூமன் அகாடமி',
      hi: 'प्रिय {{guardian}}, {{student}} ({{class}}) आज {{date}} को {{status}} दर्ज है। - लूमेन अकादमी',
    },
    dltTemplateId: '1107172400000011111',
    senderId: 'LUMNAC',
    whatsapp: { name: 'absence_alert_v2', category: 'Utility', status: 'Approved' },
  },
  {
    id: 'TPL-FEE-DUE',
    name: 'Fee due reminder',
    body: {
      en: 'Dear {{guardian}}, fee of Rs {{amount}} for {{student}} is due on {{date}}. Pay at {{link}} - Lumen Academy',
      ta: 'அன்புள்ள {{guardian}}, {{student}} க்கான ரூ {{amount}} கட்டணம் {{date}} அன்று செலுத்த வேண்டும். {{link}} - லூமன் அகாடமி',
    },
    dltTemplateId: '1107172400000022222',
    senderId: 'LUMFEE',
    whatsapp: { name: 'fee_due_reminder', category: 'Utility', status: 'Approved' },
  },
  {
    id: 'TPL-RECEIPT',
    name: 'Fee receipt',
    body: { en: 'Received Rs {{amount}} for {{student}}. Receipt {{reference}}. Thank you - Lumen Academy' },
    dltTemplateId: '1107172400000033333',
    senderId: 'LUMFEE',
    whatsapp: { name: 'fee_receipt', category: 'Utility', status: 'Approved' },
  },
  {
    id: 'TPL-OFFER',
    name: 'Admission offer',
    body: { en: 'Dear {{guardian}}, we are pleased to offer {{student}} admission. Accept by {{date}} at {{link}} - Lumen Academy' },
    whatsapp: { name: 'admission_offer', category: 'Utility', status: 'Pending' },
  },
  {
    id: 'TPL-RESULT',
    name: 'Result published',
    body: { en: 'Results for {{student}} are now available in the Lumen Academy app.', hi: '{{student}} का परिणाम लूमेन अकादमी ऐप में उपलब्ध है।' },
    dltTemplateId: '1107172400000044444',
    senderId: 'LUMNAC',
  },
  {
    id: 'TPL-NOTICE',
    name: 'General announcement',
    body: { en: '{{title}}: {{message}} - Lumen Academy', ta: '{{title}}: {{message}} - லூமன் அகாடமி' },
    dltTemplateId: '1107172400000055555',
    senderId: 'LUMNAC',
    whatsapp: { name: 'school_notice', category: 'Utility', status: 'Approved' },
  },
  {
    id: 'TPL-BIRTHDAY',
    name: 'Birthday wishes',
    body: { en: 'Happy birthday, {{student}}! Best wishes from all of us at Lumen Academy.' },
    whatsapp: { name: 'birthday_wish', category: 'Marketing', status: 'Rejected' },
  },
  {
    id: 'TPL-EMERGENCY',
    name: 'Emergency',
    body: { en: 'URGENT from Lumen Academy: {{message}}', ta: 'அவசரம் - லூமன் அகாடமி: {{message}}', hi: 'अत्यावश्यक - लूमेन अकादमी: {{message}}' },
    dltTemplateId: '1107172400000066666',
    senderId: 'LUMNAC',
    whatsapp: { name: 'emergency_alert', category: 'Utility', status: 'Approved' },
  },
];

export const renderTemplate = (body: string, vars: Record<string, string>) => body.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? `{{${k}}}`);

export const templateVariables = (body: string) => Array.from(new Set([...body.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1])));

/** NOT-016: the recipient's language if the template has it, otherwise English. */
export const pickLanguage = (tpl: Template, lang: Language): Language => (tpl.body[lang] ? lang : 'en');

/** SMS segments: GSM-7 160/153, Unicode 70/67. */
export const smsSegments = (text: string) => {
  const unicode = /[^\x00-\x7F₹]/.test(text) || text.includes('₹');
  const single = unicode ? 70 : 160;
  const multi = unicode ? 67 : 153;
  return text.length <= single ? 1 : Math.ceil(text.length / multi);
};

// ---------------------------------------------------------------------------
// Recipients (NOT-006, NOT-008, COM-018)
// ---------------------------------------------------------------------------

export interface Recipient {
  id: string;
  name: string;
  kind: 'Guardian' | 'Staff' | 'Student';
  studentId?: string;
  primary: boolean;
  mobile: string;
  email?: string;
  language: Language;
  appInstalled: boolean;
  whatsappOptIn: boolean;
  /** Channels this person has withdrawn consent for */
  optedOut: Channel[];
}

const hash = (s: string) => {
  let h = 5381;
  for (const ch of s) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0;
  return h;
};

const LANGS: Language[] = ['en', 'en', 'ta', 'en', 'hi', 'ta'];

export const liveStudents = () => INITIAL_ROSTER.filter(s => !s.mergedInto && ['Active', 'On leave', 'Suspended'].includes(s.status));

const buildGuardians = (): Recipient[] => {
  const out: Recipient[] = [];
  const seen = new Map<string, Recipient>();
  liveStudents().forEach((s, i) => {
    // Siblings share one guardian record (same mobile)
    const existing = seen.get(s.guardianMobile);
    if (existing) return;
    const h = hash(s.id);
    const r: Recipient = {
      id: `G-${s.id}`,
      name: s.guardianName,
      kind: 'Guardian',
      studentId: s.id,
      primary: true,
      mobile: s.guardianMobile,
      email: i % 4 === 3 ? undefined : `${s.guardianName.split(' ').slice(-1)[0].toLowerCase()}${i}@mail.example.in`,
      language: LANGS[i % LANGS.length],
      appInstalled: h % 5 !== 0,
      whatsappOptIn: h % 7 !== 0,
      optedOut: s.id === 'ros-09' ? ['WhatsApp'] : s.id === 'ros-15' ? ['SMS', 'WhatsApp'] : [],
    };
    seen.set(s.guardianMobile, r);
    out.push(r);
    // Second guardian (non-primary) for alternate students
    if (i % 2 === 0) {
      const c = s.emergencyContacts[0];
      out.push({ id: `G2-${s.id}`, name: c.name, kind: 'Guardian', studentId: s.id, primary: false, mobile: c.phone, language: 'en', appInstalled: false, whatsappOptIn: true, optedOut: [] });
    }
  });
  return out;
};

export const STAFF: Recipient[] = [
  { id: 'S-malini', name: 'Mrs. Malini Iyer', kind: 'Staff', primary: true, mobile: '+91 94440 22110', email: 'malini.iyer@lumenacademy.edu.in', language: 'en', appInstalled: true, whatsappOptIn: true, optedOut: [] },
  { id: 'S-raghavan', name: 'Dr. V. Raghavan', kind: 'Staff', primary: true, mobile: '+91 94440 22147', email: 'raghavan@lumenacademy.edu.in', language: 'en', appInstalled: true, whatsappOptIn: true, optedOut: [] },
  { id: 'S-balaji', name: 'Mr. S. Balaji', kind: 'Staff', primary: true, mobile: '+91 94440 22131', email: 'balaji@lumenacademy.edu.in', language: 'ta', appInstalled: true, whatsappOptIn: false, optedOut: [] },
  { id: 'S-clara', name: 'Ms. Clara D’Souza', kind: 'Staff', primary: true, mobile: '+91 94440 22158', email: 'clara@lumenacademy.edu.in', language: 'en', appInstalled: true, whatsappOptIn: true, optedOut: [] },
  { id: 'S-murugan', name: 'Mr. P. Murugan (Security)', kind: 'Staff', primary: true, mobile: '+91 90030 11021', language: 'ta', appInstalled: false, whatsappOptIn: true, optedOut: [] },
];

export const INITIAL_GUARDIANS: Recipient[] = buildGuardians();

export interface Audience {
  group: 'Guardians' | 'Staff';
  classes: number[];
  sections: string[];
  feeStatus: string[];
  transportOnly: boolean;
  allGuardians: boolean;
}

export const EMPTY_AUDIENCE: Audience = { group: 'Guardians', classes: [], sections: [], feeStatus: [], transportOnly: false, allGuardians: false };

/** COM-002 / NOT-006: resolve an audience to recipients. Guardians are de-duplicated by mobile. */
export const resolveAudience = (audience: Audience, guardians: Recipient[], students: RosterStudent[]) => {
  if (audience.group === 'Staff') return STAFF;
  const matching = students.filter(
    s =>
      (!audience.classes.length || audience.classes.includes(s.classLevel)) &&
      (!audience.sections.length || audience.sections.includes(s.section)) &&
      (!audience.feeStatus.length || audience.feeStatus.includes(s.feeStatus)) &&
      (!audience.transportOnly || Boolean(s.transportRoute))
  );
  const mobiles = new Set(matching.map(s => s.guardianMobile));
  const ids = new Set(matching.map(s => s.id));
  return guardians.filter(g => (g.primary ? mobiles.has(g.mobile) : audience.allGuardians && ids.has(g.studentId!)));
};

// ---------------------------------------------------------------------------
// Routing & delivery (NOT-004 – NOT-010, NOT-012, NOT-013, NOT-015, NOT-017)
// ---------------------------------------------------------------------------

export type AttemptResult = 'Delivered' | 'Read' | 'Failed' | 'Skipped' | 'Blocked';

export interface Attempt {
  channel: Channel;
  result: AttemptResult;
  reason?: string;
  tries: number;
  cost: number;
}

export type FinalStatus = 'Read' | 'Delivered' | 'Held' | 'Failed' | 'Blocked';

export interface Trail {
  recipientId: string;
  language: Language;
  text: string;
  attempts: Attempt[];
  status: FinalStatus;
  heldUntil?: string;
  cost: number;
}

export interface QuietHours {
  start: string;
  end: string;
}
export const DEFAULT_QUIET: QuietHours = { start: '21:00', end: '07:00' };

export const inQuietHours = (time: string, q: QuietHours) => (q.start > q.end ? time >= q.start || time < q.end : time >= q.start && time < q.end);

export interface RouteContext {
  event: EventDef;
  template: Template;
  vars: Record<string, string>;
  messageId: string;
  sendTime: string;
  emergency: boolean;
  channels?: Channel[];
  quiet: QuietHours;
  retry: RetryPolicy;
  binding: TelemarketerBinding;
  asOf: string;
}

/**
 * Simulated adapter outcome for one try. Deterministic: 'transient' failures clear on a later try,
 * 'permanent' failures never do.
 */
const adapterOutcome = (ctx: RouteContext, r: Recipient, channel: Channel, attempt: number): { ok: boolean; permanent?: string; transient?: string; read: boolean } => {
  const h = hash(`${ctx.messageId}|${r.id}|${channel}`);
  const read = h % 10 < (channel === 'In-app' ? 6 : channel === 'Push' ? 5 : channel === 'WhatsApp' ? 8 : 0);
  if (channel === 'Email' && r.email?.includes('bounce')) return { ok: false, permanent: 'Mailbox does not exist', read: false };
  if (channel === 'SMS' && h % 23 === 0) return { ok: false, permanent: 'Number on DND / unreachable', read: false };
  if (h % 11 === 0 && attempt === 1) return { ok: false, transient: 'Provider timeout', read: false };
  return { ok: true, read };
};

/** Why a channel cannot be used for this recipient and message, or null if it can. */
export const channelBlock = (ctx: RouteContext, r: Recipient, channel: Channel): { result: 'Skipped' | 'Blocked'; reason: string } | null => {
  if (r.optedOut.includes(channel)) return { result: 'Blocked', reason: 'Recipient withdrew consent for this channel' };
  if ((channel === 'In-app' || channel === 'Push') && !r.appInstalled) return { result: 'Skipped', reason: 'App not installed' };
  if (channel === 'Email' && !r.email) return { result: 'Skipped', reason: 'No email on record' };
  if (channel === 'WhatsApp') {
    if (!r.whatsappOptIn) return { result: 'Skipped', reason: 'No WhatsApp opt-in' };
    if (!ctx.template.whatsapp) return { result: 'Blocked', reason: 'No WhatsApp template mapped to this event' };
    if (ctx.template.whatsapp.status !== 'Approved') return { result: 'Blocked', reason: `WhatsApp template ${ctx.template.whatsapp.status.toLowerCase()} by Meta` };
  }
  if (channel === 'SMS') {
    if (!ctx.template.dltTemplateId || !ctx.template.senderId) return { result: 'Blocked', reason: 'Template not registered on DLT' };
    if (ctx.binding.status !== 'Live' || ctx.binding.validUntil < ctx.asOf) return { result: 'Blocked', reason: 'Telemarketer binding is not live' };
    if (!ctx.binding.senderIds.includes(ctx.template.senderId)) return { result: 'Blocked', reason: `Sender ID ${ctx.template.senderId} not bound to the telemarketer` };
  }
  return null;
};

export const routeMessage = (ctx: RouteContext, r: Recipient): Trail => {
  const language = pickLanguage(ctx.template, r.language);
  const text = renderTemplate(ctx.template.body[language]!, { ...ctx.vars, guardian: r.name });
  const order = ctx.channels ?? ctx.event.order;
  const critical = ctx.emergency || ctx.event.tier === 'Critical';
  if (!critical && inQuietHours(ctx.sendTime, ctx.quiet)) {
    return { recipientId: r.id, language, text, attempts: [], status: 'Held', heldUntil: ctx.quiet.end, cost: 0 };
  }
  const attempts: Attempt[] = [];
  let status: FinalStatus = 'Failed';
  const costAware = ctx.event.costAware && !ctx.emergency;
  let stopReason: string | null = null;
  for (const channel of order) {
    if (stopReason) {
      attempts.push({ channel, result: 'Skipped', reason: stopReason, tries: 0, cost: 0 });
      continue;
    }
    const block = channelBlock(ctx, r, channel);
    if (block) {
      attempts.push({ channel, result: block.result, reason: block.reason, tries: 0, cost: 0 });
      continue;
    }
    let tries = 0;
    let outcome = adapterOutcome(ctx, r, channel, 1);
    do {
      tries += 1;
      outcome = adapterOutcome(ctx, r, channel, tries);
    } while (!outcome.ok && !outcome.permanent && tries < ctx.retry.maxAttempts);
    const unitCost = channel === 'SMS' ? CHANNEL_COST.SMS * smsSegments(text) : CHANNEL_COST[channel];
    const cost = Math.round(unitCost * tries * 1000) / 1000;
    if (!outcome.ok) {
      attempts.push({ channel, result: 'Failed', tries, cost, reason: outcome.permanent ? `Dead-lettered: ${outcome.permanent}` : `Gave up after ${tries} tries: ${outcome.transient}` });
      if (!ctx.event.fallback && !ctx.emergency) stopReason = 'Fallback is off for this event';
      continue;
    }
    attempts.push({ channel, result: outcome.read ? 'Read' : 'Delivered', tries, cost, reason: tries > 1 ? `Delivered on try ${tries}` : undefined });
    if (status !== 'Read') status = outcome.read ? 'Read' : 'Delivered';
    // Emergencies go out on every permitted channel
    if (ctx.emergency) continue;
    // NOT-005: an unread in-app message escalates to the next channel; a read one skips the paid channels
    if (costAware && channel === 'In-app') {
      if (outcome.read) stopReason = 'Already read in the app';
      continue;
    }
    stopReason = `Delivered by ${channel}`;
  }
  if (attempts.length && attempts.every(a => a.result === 'Blocked' || a.result === 'Skipped')) status = attempts.some(a => a.result === 'Blocked') ? 'Blocked' : 'Failed';
  return { recipientId: r.id, language, text, attempts, status, cost: Math.round(attempts.reduce((s, a) => s + a.cost, 0) * 1000) / 1000 };
};

export const summarise = (trails: Trail[]) => {
  const count = (s: FinalStatus) => trails.filter(t => t.status === s).length;
  return {
    total: trails.length,
    read: count('Read'),
    delivered: count('Delivered') + count('Read'),
    held: count('Held'),
    failed: count('Failed'),
    blocked: count('Blocked'),
    cost: Math.round(trails.reduce((s, t) => s + t.cost, 0) * 100) / 100,
  };
};

// ---------------------------------------------------------------------------
// Messages, circulars, acknowledgements (COM-001, COM-004, COM-005, COM-006)
// ---------------------------------------------------------------------------

export interface Message {
  id: string;
  eventId: string;
  title: string;
  body: string;
  sentBy: string;
  sentOn: string;
  sentAt: string;
  audienceLabel: string;
  emergency: boolean;
  circularNo?: string;
  attachment?: string;
  ackRequired: boolean;
  acknowledged: string[];
  trails: Trail[];
  scheduledFor?: string;
}

/** Acknowledgements are recorded only from people who have read the message. */
export const seedAcks = (trails: Trail[], share: number) => trails.filter(t => t.status === 'Read').filter((_, i) => i % share === 0).map(t => t.recipientId);

export interface Schedule {
  id: string;
  eventId: string;
  label: string;
  cadence: 'Daily' | 'Weekly' | 'Monthly';
  time: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  active: boolean;
}

export const INITIAL_SCHEDULES: Schedule[] = [
  { id: 'SCH-1', eventId: 'EV-FEE-DUE', label: 'Fee due reminder — 5th of every month', cadence: 'Monthly', time: '10:00', dayOfMonth: 5, active: true },
  { id: 'SCH-2', eventId: 'EV-BIRTHDAY', label: 'Birthday wishes — every morning', cadence: 'Daily', time: '07:30', active: true },
  { id: 'SCH-3', eventId: 'EV-NOTICE', label: 'Weekly attendance digest — Fridays', cadence: 'Weekly', time: '16:00', dayOfWeek: 5, active: false },
];

/** NOT-014: next run date on or after `from`. */
export const nextRun = (s: Schedule, from: string) => {
  const d = new Date(`${from}T00:00:00Z`);
  for (let i = 0; i < 62; i++) {
    const iso = d.toISOString().slice(0, 10);
    if (s.cadence === 'Daily') return iso;
    if (s.cadence === 'Weekly' && d.getUTCDay() === s.dayOfWeek) return iso;
    if (s.cadence === 'Monthly' && d.getUTCDate() === s.dayOfMonth) return iso;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return from;
};

// ---------------------------------------------------------------------------
// Moderation (COM-011) and gallery consent (COM-014, CNS-009)
// ---------------------------------------------------------------------------

const BLOCKED_TERMS = ['stupid', 'idiot', 'useless', 'shut up'];
const CONTACT_PATTERN = /(\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}|\b[\w.]+@[\w.]+\.\w+\b/;

/** Messages with abusive words or personal contact details are held for moderation. */
export const moderationFlags = (text: string) => {
  const flags: string[] = [];
  const lower = text.toLowerCase();
  BLOCKED_TERMS.forEach(t => lower.includes(t) && flags.push(`Contains “${t}”`));
  if (CONTACT_PATTERN.test(text)) flags.push('Shares a phone number or email');
  return flags;
};

export interface ThreadMessage {
  from: 'Teacher' | 'Parent';
  text: string;
  at: string;
  status: 'Delivered' | 'Held for moderation' | 'Rejected';
  flags?: string[];
}

export interface Thread {
  id: string;
  studentId: string;
  teacher: string;
  subject: string;
  messages: ThreadMessage[];
}

export const INITIAL_THREADS: Thread[] = [
  {
    id: 'TH-01',
    studentId: 'ros-13',
    teacher: 'Mr. K. Natarajan',
    subject: 'Attendance concern',
    messages: [
      { from: 'Teacher', text: 'Janani has missed several days this month. Is everything all right at home?', at: '2024-09-13 15:10', status: 'Delivered' },
      { from: 'Parent', text: 'Sorry sir, family problems. She will attend regularly from Monday.', at: '2024-09-13 19:02', status: 'Delivered' },
    ],
  },
  {
    id: 'TH-02',
    studentId: 'ros-14',
    teacher: 'Mr. K. Natarajan',
    subject: 'Late arrivals',
    messages: [
      { from: 'Teacher', text: 'Karthik has been late several times. School starts at 08:00.', at: '2024-09-11 12:30', status: 'Delivered' },
      { from: 'Parent', text: 'This is useless, the bus is always late. Call me on 98400 12345.', at: '2024-09-11 20:45', status: 'Held for moderation', flags: ['Contains “useless”', 'Shares a phone number or email'] },
    ],
  },
];

export interface Photo {
  id: string;
  caption: string;
  studentIds: string[];
}

export interface Album {
  id: string;
  title: string;
  date: string;
  photos: Photo[];
  status: 'Draft' | 'Published';
  external: boolean;
}

/** Students whose guardians have NOT consented to photo use (CNS-006). */
export const NO_PHOTO_CONSENT = new Set(['ros-04', 'ros-10', 'ros-13']);

export const INITIAL_ALBUMS: Album[] = [
  {
    id: 'ALB-01',
    title: 'Independence Day 2024',
    date: '2024-08-15',
    status: 'Published',
    external: false,
    photos: [
      { id: 'P1', caption: 'Flag hoisting', studentIds: [] },
      { id: 'P2', caption: 'Class 10 march past', studentIds: ['ros-01', 'ros-02', 'ros-03'] },
      { id: 'P3', caption: 'Patriotic song — Class 9', studentIds: ['ros-07', 'ros-08', 'ros-09'] },
    ],
  },
  {
    id: 'ALB-02',
    title: 'Science Exhibition',
    date: '2024-09-12',
    status: 'Draft',
    external: true,
    photos: [
      { id: 'P4', caption: 'Solar car model', studentIds: ['ros-04', 'ros-06'] },
      { id: 'P5', caption: 'Water purifier project', studentIds: ['ros-11', 'ros-12'] },
      { id: 'P6', caption: 'Robotics corner', studentIds: ['ros-13', 'ros-14', 'ros-15'] },
      { id: 'P7', caption: 'Judges’ round', studentIds: [] },
    ],
  },
];

/** CNS-009: a photo can be published only if every tagged student has photo consent. */
export const photoGate = (p: Photo) => p.studentIds.filter(id => NO_PHOTO_CONSENT.has(id));

// ---------------------------------------------------------------------------
// Notice board, events, PTM (COM-007, COM-008, COM-009)
// ---------------------------------------------------------------------------

export interface Notice {
  id: string;
  title: string;
  body: string;
  postedOn: string;
  expiresOn: string;
  pinned: boolean;
  audience: string;
}

export const INITIAL_NOTICES: Notice[] = [
  { id: 'NB-01', title: 'Half-yearly examination timetable', body: 'Exams run from 23 to 30 September. Hall tickets are issued in class.', postedOn: '2024-09-10', expiresOn: '2024-09-30', pinned: true, audience: 'Classes 6–12' },
  { id: 'NB-02', title: 'Uniform shop timings', body: 'Open 3:30–5:30 pm on weekdays until 20 September.', postedOn: '2024-09-02', expiresOn: '2024-09-20', pinned: false, audience: 'All parents' },
  { id: 'NB-03', title: 'Summer camp photos', body: 'Photos are available in the gallery.', postedOn: '2024-06-10', expiresOn: '2024-07-10', pinned: false, audience: 'All parents' },
];

export interface SchoolEvent {
  id: string;
  date: string;
  title: string;
  kind: 'Exam' | 'Holiday' | 'Meeting' | 'Activity';
}

export const INITIAL_EVENTS_CAL: SchoolEvent[] = [
  { id: 'E1', date: '2024-09-07', title: 'Ganesh Chaturthi', kind: 'Holiday' },
  { id: 'E2', date: '2024-09-12', title: 'Science exhibition', kind: 'Activity' },
  { id: 'E3', date: '2024-09-21', title: 'PTM — Classes 8 to 10', kind: 'Meeting' },
  { id: 'E4', date: '2024-09-23', title: 'Half-yearly exams begin', kind: 'Exam' },
  { id: 'E5', date: '2024-09-30', title: 'Half-yearly exams end', kind: 'Exam' },
];

export interface PtmSlot {
  id: string;
  teacher: string;
  start: string;
  bookedBy?: string;
}

/** 10-minute slots from 09:00 to 11:00 for each teacher on the PTM day. */
export const buildPtmSlots = (teachers: string[], from = '09:00', to = '11:00', minutes = 10): PtmSlot[] => {
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
  const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  return teachers.flatMap((t, ti) => {
    const out: PtmSlot[] = [];
    for (let m = toMin(from); m + minutes <= toMin(to); m += minutes) out.push({ id: `${ti}-${fmt(m)}`, teacher: t, start: fmt(m) });
    return out;
  });
};

export const PTM_TEACHERS = ['Mrs. Malini Iyer', 'Mr. S. Balaji', 'Ms. Clara D’Souza', 'Mr. K. Natarajan'];

/** A guardian may not hold two slots that start at the same time. */
export const canBook = (slots: PtmSlot[], slotId: string, guardianId: string) => {
  const slot = slots.find(s => s.id === slotId);
  if (!slot || slot.bookedBy) return 'Slot already taken';
  if (slots.some(s => s.bookedBy === guardianId && s.start === slot.start)) return 'You already have a meeting at this time';
  return null;
};
