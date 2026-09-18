import React, { useState } from 'react';
import { Card, EmptyState, Field, Icon, Pill, PrimaryButton, Screen, SecondaryButton, Sheet, cx, fmtDate, inputClass } from '../shared/mobileUi';
import { APP_TODAY, TeacherAccount } from '../shared/schoolData';
import {
  DURATION_OPTIONS,
  MARK_OPTIONS,
  NewRequest,
  PaperRequest,
  PaperSnapshot,
  RequestStatus,
  STATUS_TEXT,
  earliestTestDate,
  lastComment,
  requestProblems,
} from '../../src/data/paperRequests';
import { paperRequestService, usePaperRequests } from '../../src/services/paperRequestService';

// Unit-test papers: the teacher asks the exam coordinator for a paper, checks and approves what comes back,
// then marks the test as conducted. The coordinator prepares the paper in the admin console.

type Push = (text: string, tone?: 'ok' | 'warn' | 'error') => void;

const TONE: Record<RequestStatus, 'green' | 'amber' | 'red' | 'grey'> = {
  Requested: 'grey',
  'In preparation': 'grey',
  'Awaiting teacher approval': 'amber',
  'Changes requested': 'grey',
  Approved: 'green',
  Conducted: 'green',
  Declined: 'red',
};

const blankForm = (teacher: TeacherAccount): NewRequest => ({
  section: teacher.teaches[0]?.section ?? '',
  subject: teacher.teaches[0]?.subject ?? '',
  testName: 'Unit Test ',
  chapters: '',
  maxMarks: 50,
  durationMinutes: 60,
  testDate: earliestTestDate(APP_TODAY),
  notes: '',
});

/** Count shown on the tab: papers waiting for this teacher. */
export const useWaitingPapers = (teacherId: string) => usePaperRequests().filter(r => r.teacherId === teacherId && r.status === 'Awaiting teacher approval').length;

export const TestPapersScreen: React.FC<{ teacher: TeacherAccount; push: Push }> = ({ teacher, push }) => {
  const mine = usePaperRequests().filter(r => r.teacherId === teacher.id);
  const [asking, setAsking] = useState(false);
  const [form, setForm] = useState<NewRequest>(() => blankForm(teacher));
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [checking, setChecking] = useState<PaperRequest | null>(null);
  const [viewing, setViewing] = useState<PaperRequest | null>(null);
  const [busy, setBusy] = useState('');

  const problems = requestProblems(form, APP_TODAY);
  const set = (patch: Partial<NewRequest>) => {
    setForm(f => ({ ...f, ...patch }));
    setSendError('');
  };

  const send = async () => {
    setTried(true);
    if (Object.keys(problems).length) return;
    setSending(true);
    setSendError('');
    try {
      const r = await paperRequestService.submit(form, teacher, APP_TODAY);
      push(`${r.testName} for ${r.section} sent to the exam coordinator`);
      setAsking(false);
      setForm(blankForm(teacher));
      setTried(false);
    } catch (e) {
      // Keep everything the teacher typed; say what to do next.
      setSendError(`${(e as Error).message} Your answers are kept — check them and tap “Send request” again.`);
    } finally {
      setSending(false);
    }
  };

  const askAgain = (r: PaperRequest) => {
    setForm({ section: r.section, subject: r.subject, testName: r.testName, chapters: r.chapters, maxMarks: r.maxMarks, durationMinutes: r.durationMinutes, testDate: earliestTestDate(APP_TODAY), notes: r.notes });
    setTried(false);
    setAsking(true);
  };

  const conducted = async (r: PaperRequest) => {
    setBusy(r.id);
    try {
      await paperRequestService.conducted(r.id, teacher.id, APP_TODAY);
      push(`${r.testName} marked as conducted. Enter the marks in the Marks tab.`);
    } catch (e) {
      push((e as Error).message, 'warn');
    } finally {
      setBusy('');
    }
  };

  const waiting = mine.filter(r => r.status === 'Awaiting teacher approval');
  const others = mine.filter(r => r.status !== 'Awaiting teacher approval');

  const card = (r: PaperRequest) => {
    const comment = lastComment(r);
    return (
      <Card key={r.id} className="!p-0">
        <div className="space-y-2" data-teacher-request={r.id}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-slate-900">
                {r.testName} · {r.section} · {r.subject}
              </p>
              <p className="text-[13px] text-slate-500">
                Test on {fmtDate(r.testDate)} · {r.maxMarks} marks · {r.durationMinutes} min
              </p>
            </div>
            <Pill tone={TONE[r.status]}>{r.status === 'Awaiting teacher approval' ? 'Check the paper' : r.status}</Pill>
          </div>
          <p className="text-[14px] text-slate-700">{STATUS_TEXT[r.status]}.</p>
          <p className="text-[13px] text-slate-500">Chapters: {r.chapters}</p>
          {r.status === 'Changes requested' && comment && <p className="text-[13px] text-slate-600">You asked: “{comment}”</p>}
          {r.status === 'Declined' && comment && <p className="text-[13px] text-rose-700">Reason: {comment}</p>}
          {r.status === 'Awaiting teacher approval' && (
            <PrimaryButton onClick={() => setChecking(r)} aria-label={`Check the paper for ${r.testName} ${r.section}`}>
              Check the paper
            </PrimaryButton>
          )}
          {r.status === 'Approved' && (
            <div className="space-y-2">
              <PrimaryButton onClick={() => conducted(r)} disabled={APP_TODAY < r.testDate || busy === r.id}>
                {busy === r.id ? 'Saving…' : 'Mark the test as conducted'}
              </PrimaryButton>
              {APP_TODAY < r.testDate && <p className="text-[13px] text-slate-500">Available on {fmtDate(r.testDate)}, the day of the test.</p>}
            </div>
          )}
          {(r.status === 'Approved' || r.status === 'Conducted') && r.paper && (
            <SecondaryButton onClick={() => setViewing(r)} className="w-full min-h-11">
              View the paper
            </SecondaryButton>
          )}
          {r.status === 'Declined' && (
            <SecondaryButton onClick={() => askAgain(r)} className="w-full min-h-11">
              Ask again with a new date
            </SecondaryButton>
          )}
        </div>
      </Card>
    );
  };

  return (
    <Screen>
      <Card>
        <div className="flex items-start gap-3">
          <Icon name="quiz" className="text-[28px] text-[var(--accent-ink)]" />
          <div className="flex-1 space-y-2">
            <p className="text-[15px] font-semibold text-slate-900">Need a unit test paper?</p>
            <p className="text-[14px] text-slate-600">
              Tell the exam coordinator the class, chapters and date. They prepare the paper and send it back for you to check and approve before the test.
            </p>
            <PrimaryButton onClick={() => setAsking(true)}>Ask for a paper</PrimaryButton>
          </div>
        </div>
      </Card>

      {waiting.length > 0 && (
        <>
          <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-slate-500">Waiting for you</h2>
          {waiting.map(card)}
        </>
      )}

      <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-slate-500">Your requests</h2>
      {mine.length === 0 ? (
        <EmptyState icon="assignment_add" text="You have not asked for a paper yet." action={<SecondaryButton onClick={() => setAsking(true)}>Ask for your first paper</SecondaryButton>} />
      ) : others.length === 0 ? (
        <p className="px-1 text-[14px] text-slate-500">Nothing else yet.</p>
      ) : (
        others.map(card)
      )}

      <Sheet open={asking} onClose={() => setAsking(false)} title="Ask for a unit test paper">
        <Field label="Class and subject">
          <select
            value={`${form.section}|${form.subject}`}
            onChange={e => {
              const [section, subject] = e.target.value.split('|');
              set({ section, subject });
            }}
            className={inputClass}
            aria-label="Class and subject"
          >
            {teacher.teaches.map(t => (
              <option key={`${t.section}|${t.subject}`} value={`${t.section}|${t.subject}`}>
                {t.section} · {t.subject}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Test name">
          <input value={form.testName} onChange={e => set({ testName: e.target.value })} className={inputClass} aria-label="Test name" />
        </Field>
        {tried && problems.testName && <p className="text-[13px] text-rose-700">{problems.testName}</p>}
        <Field label="Chapters or lessons to cover">
          <textarea value={form.chapters} onChange={e => set({ chapters: e.target.value })} rows={3} className={inputClass} aria-label="Chapters to cover" placeholder="For example: Light – reflection and refraction" />
        </Field>
        {tried && problems.chapters && <p className="text-[13px] text-rose-700">{problems.chapters}</p>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Total marks">
            <select value={form.maxMarks} onChange={e => set({ maxMarks: Number(e.target.value) as 25 | 50 })} className={inputClass} aria-label="Total marks">
              {MARK_OPTIONS.map(m => (
                <option key={m} value={m}>
                  {m} marks
                </option>
              ))}
            </select>
          </Field>
          <Field label="Time allowed">
            <select value={form.durationMinutes} onChange={e => set({ durationMinutes: Number(e.target.value) })} className={inputClass} aria-label="Time allowed">
              {DURATION_OPTIONS.map(d => (
                <option key={d} value={d}>
                  {d} minutes
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Date of the test" hint={`The exam coordinator needs at least 3 days. Earliest: ${fmtDate(earliestTestDate(APP_TODAY))}.`}>
          <input type="date" min={earliestTestDate(APP_TODAY)} value={form.testDate} onChange={e => set({ testDate: e.target.value })} className={inputClass} aria-label="Date of the test" />
        </Field>
        {tried && problems.testDate && <p className="text-[13px] text-rose-700">{problems.testDate}</p>}
        <Field label="Anything else (optional)">
          <textarea value={form.notes} onChange={e => set({ notes: e.target.value })} rows={2} className={inputClass} aria-label="Notes for the exam coordinator" placeholder="For example: include two diagram questions" />
        </Field>
        {sendError && (
          <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
            {sendError}
          </p>
        )}
        <PrimaryButton onClick={send} disabled={sending}>
          {sending ? 'Sending…' : 'Send request'}
        </PrimaryButton>
      </Sheet>

      <CheckPaperSheet request={checking} teacher={teacher} push={push} onClose={() => setChecking(null)} />

      <Sheet open={Boolean(viewing)} onClose={() => setViewing(null)} title={viewing ? `${viewing.testName} · ${viewing.section}` : ''}>
        {viewing?.paper && <PaperView paper={viewing.paper} />}
      </Sheet>
    </Screen>
  );
};

/** Review, then approve or send back. */
const CheckPaperSheet: React.FC<{ request: PaperRequest | null; teacher: TeacherAccount; push: Push; onClose: () => void }> = ({ request, teacher, push, onClose }) => {
  const [asking, setAsking] = useState(false);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!request?.paper) return null;

  const decide = async (approve: boolean) => {
    setBusy(true);
    setError('');
    try {
      if (approve) await paperRequestService.approve(request.id, teacher.id, APP_TODAY);
      else await paperRequestService.requestChanges(request.id, teacher.id, comment, APP_TODAY);
      push(approve ? `Paper approved. ${request.testName} is ready for ${fmtDate(request.testDate)}.` : 'Sent back to the exam coordinator with your comments');
      setAsking(false);
      setComment('');
      onClose();
    } catch (e) {
      setError(`${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open onClose={onClose} title={`Check: ${request.testName} · ${request.section}`}>
      <PaperView paper={request.paper} />
      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
          {error}
        </p>
      )}
      {asking ? (
        <div className="space-y-2">
          <Field label="What should change?">
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} className={inputClass} aria-label="What should change" placeholder="For example: question 4 is not from the chapters I asked for" />
          </Field>
          <PrimaryButton onClick={() => decide(false)} disabled={busy || comment.trim().length < 5}>
            {busy ? 'Sending…' : 'Send back to the exam coordinator'}
          </PrimaryButton>
          <SecondaryButton onClick={() => setAsking(false)} className="w-full min-h-11">
            Back to the paper
          </SecondaryButton>
        </div>
      ) : (
        <div className="space-y-2">
          <PrimaryButton onClick={() => decide(true)} disabled={busy}>
            {busy ? 'Saving…' : 'Approve the paper'}
          </PrimaryButton>
          <SecondaryButton onClick={() => setAsking(true)} className="w-full min-h-11">
            Ask for changes
          </SecondaryButton>
        </div>
      )}
    </Sheet>
  );
};

/** The paper as the students will see it, with an answer key the teacher can open. */
const PaperView: React.FC<{ paper: PaperSnapshot }> = ({ paper }) => {
  const [showKey, setShowKey] = useState(false);
  return (
    <div className="space-y-3" data-paper-view={paper.paperId}>
      <div className="rounded-xl bg-slate-50 p-3">
        <p className="text-[15px] font-semibold text-slate-900">{paper.title}</p>
        <p className="text-[13px] text-slate-600">
          {paper.totalMarks} marks · {paper.durationMinutes} minutes · prepared by {paper.sentBy} on {fmtDate(paper.sentOn)}
        </p>
      </div>
      <ul className="list-disc pl-5 text-[13px] text-slate-600 space-y-0.5">
        {paper.instructions.map(i => (
          <li key={i}>{i}</li>
        ))}
      </ul>
      {paper.sections.map(s => (
        <section key={s.title} className="space-y-2">
          <h3 className="text-[14px] font-semibold text-slate-800">{s.title}</h3>
          <ol className="space-y-2">
            {s.questions.map(q => (
              <li key={q.number} className="text-[14px] text-slate-800">
                <div className="flex gap-2">
                  <span className="font-semibold tabular-nums">{q.number}.</span>
                  <span className="flex-1">{q.text}</span>
                  <span className="shrink-0 text-[13px] text-slate-500 tabular-nums">[{q.marks}]</span>
                </div>
                {q.options && (
                  <ol className="mt-1 ml-6 grid grid-cols-2 gap-x-3 text-[13px] text-slate-600">
                    {q.options.map((o, i) => (
                      <li key={o}>
                        ({'abcd'[i]}) {o}
                      </li>
                    ))}
                  </ol>
                )}
                {showKey && q.answer && <p className={cx('mt-1 ml-6 text-[13px] text-emerald-800')}>Answer: {q.answer}</p>}
              </li>
            ))}
          </ol>
        </section>
      ))}
      <SecondaryButton onClick={() => setShowKey(k => !k)} className="w-full min-h-11">
        {showKey ? 'Hide the answer key' : 'Show the answer key'}
      </SecondaryButton>
    </div>
  );
};
