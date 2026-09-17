import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { useGrants } from '../../../hooks/useGrants';
import { ConfirmDialog, Field, Icon, btnDanger, btnPrimary, btnSoft, inputCls } from '../../../components/common/ui';
import { ACTION_LABEL, PaperAction, QuestionPaper, STATUS_STEPS, canApply, paperCounts, validateContent } from '../../../data/questionPapers';
import { questionPaperService } from '../../../services/questionPaperService';
import { Gate, PaperStatusBadge, fmtDate } from './qpgUi';

const CONFIRM: Record<PaperAction, { title: string; body: string; danger?: boolean }> = {
  submit: { title: 'Submit for review?', body: 'The paper is locked while the Principal reviews it.' },
  approve: { title: 'Approve this paper?', body: 'Approved papers can be printed and published. Questions can no longer be changed.' },
  reject: { title: 'Reject this paper?', body: 'A rejected paper is closed. The author has to start a new one.', danger: true },
  requestChanges: { title: 'Send back for changes?', body: 'The author can edit the paper again and resubmit it.' },
  publish: { title: 'Publish this paper?', body: 'Published papers are final and move to the archive. Question usage counts are updated.' },
};

/** QPG-012: Draft → Under review → Approved → Published, with reject and send-back. */
export const ApprovalStep: React.FC<{ paper: QuestionPaper; onSaved: (p: QuestionPaper) => void; beforeSubmit: () => Promise<QuestionPaper | null> }> = ({ paper, onSaved, beforeSubmit }) => {
  const { addToast, currentUser } = useApp();
  const g = useGrants();
  const [comment, setComment] = useState('');
  const [pending, setPending] = useState<PaperAction | null>(null);
  const [busy, setBusy] = useState(false);
  const mine = paper.createdBy === currentUser.name;
  const counts = paperCounts(paper);
  const blocking = validateContent(paper).filter(i => i.level === 'error');

  const stepIndex = paper.status === 'Changes requested' ? 0 : paper.status === 'Rejected' ? 1 : STATUS_STEPS.indexOf(paper.status);

  const can: Record<PaperAction, { allowed: boolean; why?: string }> = {
    submit: { allowed: g.can('QPG-012', 'C'), why: g.why('QPG-012', 'C') },
    publish: { allowed: g.can('QPG-012', 'C'), why: g.why('QPG-012', 'C') },
    approve: { allowed: g.can('QPG-012', 'A') && !mine, why: mine ? 'You cannot review a paper you created' : g.why('QPG-012', 'A') },
    reject: { allowed: g.can('QPG-012', 'A') && !mine, why: mine ? 'You cannot review a paper you created' : g.why('QPG-012', 'A') },
    requestChanges: { allowed: g.can('QPG-012', 'A') && !mine, why: mine ? 'You cannot review a paper you created' : g.why('QPG-012', 'A') },
  };

  const run = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      if (pending === 'submit') {
        const saved = await beforeSubmit();
        if (!saved) return;
      }
      const next = await questionPaperService.transition(paper.id, pending, currentUser.name, comment);
      onSaved(next);
      setComment('');
      addToast(`${paper.id}: ${next.status}`, 'success', pending === 'submit' ? 'The Principal has been asked to review it.' : undefined);
    } catch (e) {
      addToast('Could not update the paper', 'error', (e as Error).message);
    } finally {
      setBusy(false);
      setPending(null);
    }
  };

  const actions = (['submit', 'approve', 'requestChanges', 'reject', 'publish'] as PaperAction[]).filter(a => canApply(paper, a));
  const needsComment = pending === 'reject' || pending === 'requestChanges';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div className="xl:col-span-2 space-y-4">
        <section className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs p-4 space-y-4" aria-labelledby="flow-h">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="flow-h" className="text-sm font-bold text-[#082b3d]">
              Approval workflow
            </h2>
            <PaperStatusBadge status={paper.status} />
          </div>
          <ol className="flex flex-col sm:flex-row sm:items-center gap-2" aria-label="Workflow stages">
            {STATUS_STEPS.map((s, i) => {
              const done = i < stepIndex || (i === stepIndex && paper.status === 'Published');
              const current = i === stepIndex && paper.status !== 'Published';
              return (
                <li key={s} className="flex sm:flex-1 items-center gap-2">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                      done ? 'bg-emerald-600 text-white' : current ? (paper.status === 'Rejected' ? 'bg-rose-600 text-white' : 'bg-[#0e5d84] text-white') : 'bg-slate-100 text-[#777587]'
                    }`}
                    aria-current={current ? 'step' : undefined}
                  >
                    {done ? <Icon name="check" className="text-sm" /> : i + 1}
                  </span>
                  <span className={`text-xs ${current ? 'font-bold text-[#082b3d]' : 'text-[#464555]'}`}>{current && (paper.status === 'Changes requested' || paper.status === 'Rejected') ? paper.status : s}</span>
                  {i < STATUS_STEPS.length - 1 && <span className="hidden sm:block flex-1 h-px bg-[#cbe0ec]" aria-hidden="true" />}
                </li>
              );
            })}
          </ol>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {[
              ['Created by', paper.createdBy],
              ['Created date', fmtDate(paper.createdOn)],
              ['Status', paper.status],
              ['Reviewed by', paper.reviewedBy ?? '—'],
              ['Review date', fmtDate(paper.reviewedOn)],
              ['Paper', `${counts.questions} questions · ${counts.marks} marks · ${paper.sets.length || 1} set(s)`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[10px] text-[#777587]">{k}</dt>
                <dd className="font-semibold text-[#082b3d]">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs p-4 space-y-2" aria-labelledby="hist-h">
          <h2 id="hist-h" className="text-sm font-bold text-[#082b3d]">
            Comments and history
          </h2>
          <ol className="relative border-l border-[#cbe0ec] ml-2 space-y-3">
            {[...paper.history].reverse().map((h, i) => (
              <li key={i} className="ml-4">
                <span className="absolute -left-1.5 mt-1 w-3 h-3 rounded-full bg-[#0e5d84] border-2 border-white" aria-hidden="true" />
                <p className="text-xs">
                  <span className="font-semibold">{h.action}</span> · {h.by} · <span className="text-[#777587]">{fmtDate(h.at)}</span>
                </p>
                {h.comment && <p className="mt-1 rounded-lg bg-[#f0f7fb] px-2 py-1 text-xs text-[#082b3d]">“{h.comment}”</p>}
              </li>
            ))}
          </ol>
        </section>
      </div>

      <aside className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs p-4 space-y-3 xl:self-start">
        <h2 className="text-sm font-bold text-[#082b3d]">Actions</h2>
        {actions.length === 0 && <p className="text-xs text-[#464555]">{paper.status === 'Published' ? 'This paper is published and archived.' : 'No actions are open for this paper.'}</p>}
        {actions.length > 0 && (
          <Field label="Comment" hint="Required to reject or request changes">
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} className={`${inputCls} w-full`} aria-label="Review comment" placeholder="What should the author know?" />
          </Field>
        )}
        {paper.status === 'Draft' && blocking.length > 0 && <p className="text-[11px] text-rose-700">{blocking[0].text}</p>}
        <div className="flex flex-col gap-2">
          {actions.map(a => (
            <Gate key={a} allowed={can[a].allowed} why={can[a].why}>
              <button
                onClick={() => {
                  if ((a === 'reject' || a === 'requestChanges') && !comment.trim()) return addToast('Add a comment first', 'warning', 'Tell the author what to change.');
                  setPending(a);
                }}
                className={a === 'reject' ? btnDanger : a === 'requestChanges' ? btnSoft : btnPrimary}
              >
                {ACTION_LABEL[a]}
              </button>
            </Gate>
          ))}
        </div>
        {mine && paper.status === 'Under review' && <p className="text-[11px] text-[#464555]">Waiting for the Principal. You cannot review your own paper.</p>}
      </aside>

      <ConfirmDialog
        open={Boolean(pending)}
        title={pending ? CONFIRM[pending].title : ''}
        body={pending ? CONFIRM[pending].body : ''}
        confirmLabel={pending ? ACTION_LABEL[pending] : ''}
        danger={pending ? CONFIRM[pending].danger : false}
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={run}
      >
        {needsComment && <p className="rounded-lg bg-[#f0f7fb] p-2 text-xs">“{comment}”</p>}
      </ConfirmDialog>
    </div>
  );
};
