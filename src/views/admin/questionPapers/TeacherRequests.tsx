import React, { useEffect, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { useGrants } from '../../../hooks/useGrants';
import { Badge, EmptyState, Field, Icon, Modal, Panel, Tone, btnPrimary, btnSoft, inputCls } from '../../../components/common/ui';
import { EmptyNote } from '../../../components/common/EmptyNote';
import { DEFAULT_DETAILS, DEFAULT_INSTRUCTIONS, ExamDetails, QPG_TODAY, QuestionPaper, newSectionId, paperTitle } from '../../../data/questionPapers';
import { PaperRequest, RequestStatus, detailsFromRequest, lastComment, patternFor, snapshotPaper } from '../../../data/paperRequests';
import { paperRequestService, usePaperRequests } from '../../../services/paperRequestService';
import { qpgStore, questionPaperService, useQpgState } from '../../../services/questionPaperService';
import { Gate, fmtDate } from './qpgUi';

// Unit-test papers asked for by teachers in the teacher app. The coordinator prepares the paper here and sends it
// back; the requesting teacher approves it (not the Principal), then conducts the test.

const REQUEST_TONE: Record<RequestStatus, Tone> = {
  Requested: 'amber',
  'In preparation': 'grey',
  'Awaiting teacher approval': 'grey',
  'Changes requested': 'amber',
  Approved: 'green',
  Conducted: 'green',
  Declined: 'red',
};

const COORDINATOR_TEXT: Record<RequestStatus, string> = {
  Requested: 'New request',
  'In preparation': 'You are preparing it',
  'Awaiting teacher approval': 'With the teacher to check',
  'Changes requested': 'Teacher asked for changes',
  Approved: 'Approved by the teacher',
  Conducted: 'Test conducted',
  Declined: 'Declined',
};

export const RequestBadge: React.FC<{ status: RequestStatus }> = ({ status }) => (
  <Badge tone={REQUEST_TONE[status]}>
    <span data-request-status={status}>{COORDINATOR_TEXT[status]}</span>
  </Badge>
);

/** The teacher request a paper answers, if any. */
export const useLinkedRequest = (paperId: string) => usePaperRequests().find(r => r.paperId === paperId && r.status !== 'Declined');

/**
 * Applies the teacher's decision (made in the teacher app) to the paper: approved papers become Approved with the
 * teacher as reviewer; sent-back papers become editable again with the teacher's comment.
 */
export const useTeacherDecisionSync = () => {
  const requests = usePaperRequests();
  const { papers } = useQpgState();
  useEffect(() => {
    for (const r of requests) {
      const paper = r.paperId ? papers.find(p => p.id === r.paperId) : undefined;
      if (!paper || paper.status !== 'Under review') continue;
      if (r.status === 'Approved') questionPaperService.applyTeacherDecision(paper.id, 'approve', r.teacherName, 'Approved in the teacher app');
      if (r.status === 'Changes requested') questionPaperService.applyTeacherDecision(paper.id, 'requestChanges', r.teacherName, lastComment(r) ?? 'Changes asked for in the teacher app');
    }
  }, [requests, papers]);
};

/** A new paper for a request: unit-test details and the 25- or 50-mark pattern already filled in. */
const draftFor = (r: PaperRequest, createdBy: string): Omit<QuestionPaper, 'id'> => {
  const details = { ...DEFAULT_DETAILS, ...detailsFromRequest(r) } as ExamDetails;
  return {
    title: paperTitle(details),
    details,
    blueprint: patternFor(r.maxMarks).map(s => ({ ...s, id: newSectionId() })),
    content: [],
    sets: [],
    instructions: DEFAULT_INSTRUCTIONS,
    status: 'Draft',
    createdBy,
    createdOn: QPG_TODAY,
    history: [{ at: QPG_TODAY, by: createdBy, action: 'Created', comment: `For ${r.teacherName}'s request ${r.id}` }],
  };
};

export const TeacherRequestsPanel: React.FC<{ onOpen: (p: QuestionPaper) => void }> = ({ onOpen }) => {
  const { addToast, currentUser } = useApp();
  const g = useGrants();
  const requests = usePaperRequests();
  const { papers } = useQpgState();
  const [busy, setBusy] = useState('');
  const [declining, setDeclining] = useState<PaperRequest | null>(null);
  const [reason, setReason] = useState('');
  const canPrepare = g.can('QPG-003', 'C');

  const open = requests.filter(r => r.status !== 'Conducted' && r.status !== 'Declined');
  const closed = requests.filter(r => r.status === 'Conducted' || r.status === 'Declined');
  const paperOf = (r: PaperRequest) => (r.paperId ? papers.find(p => p.id === r.paperId) : undefined);

  const start = async (r: PaperRequest) => {
    setBusy(r.id);
    try {
      const paper = await questionPaperService.createPaper(draftFor(r, currentUser.name));
      await paperRequestService.start(r.id, paper.id, currentUser.name, QPG_TODAY);
      addToast(`${paper.id} started for ${r.teacherName}`, 'success', 'Fill the questions from the bank or with AI generation, then send it to the teacher.');
      onOpen(paper);
    } catch (e) {
      addToast('Could not start the paper', 'error', `${(e as Error).message} Your request list is unchanged; try again.`);
    } finally {
      setBusy('');
    }
  };

  const decline = async () => {
    if (!declining) return;
    setBusy(declining.id);
    try {
      await paperRequestService.decline(declining.id, currentUser.name, reason, QPG_TODAY);
      addToast(`Request ${declining.id} declined`, 'info', `${declining.teacherName} sees your reason in the teacher app.`);
      setDeclining(null);
      setReason('');
    } catch (e) {
      addToast('Could not decline the request', 'error', (e as Error).message);
    } finally {
      setBusy('');
    }
  };

  const row = (r: PaperRequest) => {
    const paper = paperOf(r);
    const comment = r.status === 'Changes requested' ? lastComment(r) : undefined;
    return (
      <li key={r.id} className="p-3 space-y-2" data-request={r.id}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink">
              {r.testName} · Class {r.section} · {r.subject}
            </p>
            <p className="text-[11px] text-ink-muted">
              {r.id} · asked by {r.teacherName} on {fmtDate(r.requestedOn)} · test on <span className="font-semibold text-ink-soft">{fmtDate(r.testDate)}</span> · {r.maxMarks} marks · {r.durationMinutes} min
            </p>
          </div>
          <RequestBadge status={r.status} />
        </div>
        <p className="text-[11px] text-ink-soft">
          <span className="font-semibold">Chapters:</span> {r.chapters}
          {r.notes && (
            <>
              <br />
              <span className="font-semibold">Note:</span> {r.notes}
            </>
          )}
        </p>
        {comment && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-900">
            <span className="font-semibold">{r.teacherName} asked:</span> “{comment}”
          </p>
        )}
        {r.status === 'Declined' && lastComment(r) && <p className="text-[11px] text-ink-muted">Reason: {lastComment(r)}</p>}
        <div className="flex flex-wrap gap-2">
          {(r.status === 'Requested' || ((r.status === 'In preparation' || r.status === 'Changes requested') && !paper)) && (
            <Gate allowed={canPrepare} why={g.why('QPG-003', 'C')}>
              <button onClick={() => start(r)} disabled={busy === r.id} className={btnPrimary} aria-label={`Start paper for ${r.id}`}>
                <Icon name="edit_document" className="text-sm" />
                {busy === r.id ? 'Starting…' : r.status === 'Requested' ? 'Start the paper' : 'Start the paper again'}
              </button>
            </Gate>
          )}
          {paper && (
            <button onClick={() => onOpen(paper)} className={btnSoft} aria-label={`Open paper for ${r.id}`}>
              <Icon name="open_in_new" className="text-sm" />
              Open {paper.id}
            </button>
          )}
          {r.status === 'Requested' && (
            <Gate allowed={canPrepare} why={g.why('QPG-003', 'C')}>
              <button onClick={() => setDeclining(r)} className={btnSoft}>
                Decline
              </button>
            </Gate>
          )}
          {r.status === 'Awaiting teacher approval' && <span className="text-[11px] text-ink-muted self-center">Waiting for {r.teacherName} to check it in the teacher app.</span>}
          {r.status === 'Approved' && <span className="text-[11px] text-emerald-800 self-center">Approved — print and publish it from the paper’s approval step before {fmtDate(r.testDate)}.</span>}
        </div>
      </li>
    );
  };

  return (
    <Panel title={`Unit test requests from teachers (${open.length})`} className="xl:col-span-3">
      {requests.length === 0 ? (
        <EmptyState icon="assignment_add" title="No requests yet." text="When a teacher asks for a unit test paper in the teacher app, it appears here for you to prepare." />
      ) : (
        <>
          {open.length === 0 ? <div className="p-3"><EmptyNote>No open requests. Finished ones are listed below.</EmptyNote></div> : <ul className="divide-y divide-subtle">{open.map(row)}</ul>}
          {closed.length > 0 && (
            <details className="border-t border-line-soft">
              <summary className="cursor-pointer px-3 py-2 text-[11px] font-semibold text-ink-muted">Finished requests ({closed.length})</summary>
              <ul className="divide-y divide-subtle">{closed.map(row)}</ul>
            </details>
          )}
        </>
      )}
      <Modal
        open={Boolean(declining)}
        onClose={() => setDeclining(null)}
        title={`Decline ${declining?.id ?? ''}`}
        footer={
          <>
            <button onClick={() => setDeclining(null)} className={btnSoft}>
              Keep the request
            </button>
            <button onClick={decline} disabled={reason.trim().length < 5 || busy !== ''} className={btnPrimary}>
              Decline and tell {declining?.teacherName.split(' ').slice(-1)[0]}
            </button>
          </>
        }
      >
        <p className="text-ink-soft">{declining?.teacherName} sees this reason in the teacher app and can ask again.</p>
        <Field label="Reason" hint="At least a few words, for example “Test date clashes with the half-yearly exams”.">
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className={`${inputCls} w-full`} aria-label="Reason for declining" />
        </Field>
      </Modal>
    </Panel>
  );
};

/** For a requested paper, the approval step's "send to the teacher" action. */
export const SendToTeacher: React.FC<{ paper: QuestionPaper; request: PaperRequest; beforeSubmit: () => Promise<QuestionPaper | null>; onSaved: (p: QuestionPaper) => void }> = ({
  paper,
  request,
  beforeSubmit,
  onSaved,
}) => {
  const { addToast, currentUser } = useApp();
  const g = useGrants();
  const { bank } = useQpgState();
  const [busy, setBusy] = useState(false);
  const comment = request.status === 'Changes requested' ? lastComment(request) : undefined;
  const canSend = (paper.status === 'Draft' || paper.status === 'Changes requested') && (request.status === 'In preparation' || request.status === 'Changes requested');

  const send = async () => {
    setBusy(true);
    const before = qpgStore.get().papers.find(p => p.id === paper.id) ?? paper;
    try {
      const saved = await beforeSubmit();
      if (!saved) return;
      const snapshot = snapshotPaper(saved, bank, currentUser.name);
      if (snapshot.totalMarks !== request.maxMarks) throw new Error(`The paper has ${snapshot.totalMarks} marks but ${request.teacherName} asked for ${request.maxMarks}. Adjust the questions and send again.`);
      const submitted = await questionPaperService.transition(paper.id, 'submit', currentUser.name, `Sent to ${request.teacherName} for approval`);
      try {
        await paperRequestService.send(request.id, snapshotPaper(submitted, bank, currentUser.name), currentUser.name, QPG_TODAY);
      } catch (e) {
        // The teacher never received it: put the paper back so it can be edited and sent again.
        await questionPaperService.savePaper({ ...before, content: submitted.content });
        throw e;
      }
      onSaved(submitted);
      addToast(`${paper.id} sent to ${request.teacherName}`, 'success', 'They check it in the teacher app. You will see their answer here.');
    } catch (e) {
      addToast('The paper was not sent', 'error', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-line bg-wash p-3 space-y-2" data-send-to-teacher>
      <p className="text-xs text-ink">
        <span className="font-semibold">Requested by {request.teacherName}</span> for {request.testName}, Class {request.section}, on {fmtDate(request.testDate)} ({request.maxMarks} marks).
        The teacher approves this paper, not the Principal.
      </p>
      {comment && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-900">
          <span className="font-semibold">They asked:</span> “{comment}”
        </p>
      )}
      {canSend ? (
        <Gate allowed={g.can('QPG-012', 'C')} why={g.why('QPG-012', 'C')}>
          <button onClick={send} disabled={busy} className={`${btnPrimary} w-full`}>
            <Icon name="send" className="text-sm" />
            {busy ? 'Sending…' : request.status === 'Changes requested' ? `Send the changed paper to ${request.teacherName}` : `Send to ${request.teacherName} for approval`}
          </button>
        </Gate>
      ) : (
        <p className="text-[11px] text-ink-muted">
          {request.status === 'Awaiting teacher approval' ? `Waiting for ${request.teacherName} to check it.` : request.status === 'Approved' ? `${request.teacherName} approved it. Publish it before the test.` : `Request status: ${request.status}.`}
        </p>
      )}
    </div>
  );
};
