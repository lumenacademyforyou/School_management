import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { useGrants } from '../../../hooks/useGrants';
import { Icon, Stepper, btnGhost, btnPrimary, btnSoft } from '../../../components/common/ui';
import {
  BankQuestion,
  BlueprintSection,
  DEFAULT_DETAILS,
  DEFAULT_INSTRUCTIONS,
  QPG_TODAY,
  QuestionPaper,
  addQuestion,
  isEditable,
  paperTitle,
  presetBlueprint,
  validateBlueprint,
  validateContent,
  validateDetails,
} from '../../../data/questionPapers';
import { questionPaperService, useQpgState } from '../../../services/questionPaperService';
import { BankPanel } from './BankPanel';
import { AiPanel } from './AiPanel';
import { BlueprintStep, DetailsStep } from './PlanSteps';
import { BuilderStep } from './BuilderStep';
import { AnswerKeyStep, SetsStep } from './OutputSteps';
import { ApprovalStep } from './ApprovalStep';
import { PaperStatusBadge } from './qpgUi';

export type WizardStep = 'details' | 'blueprint' | 'bank' | 'ai' | 'builder' | 'sets' | 'key' | 'approval';

const STEPS: { id: WizardStep; label: string }[] = [
  { id: 'details', label: 'Exam details' },
  { id: 'blueprint', label: 'Blueprint' },
  { id: 'bank', label: 'Question bank' },
  { id: 'ai', label: 'AI generation' },
  { id: 'builder', label: 'Paper builder' },
  { id: 'sets', label: 'Multiple sets' },
  { id: 'key', label: 'Answer key' },
  { id: 'approval', label: 'Approval' },
];

export const newPaperDraft = (createdBy: string): QuestionPaper => ({
  id: '',
  title: paperTitle(DEFAULT_DETAILS),
  details: DEFAULT_DETAILS,
  blueprint: presetBlueprint(DEFAULT_DETAILS.board),
  content: [],
  sets: [],
  instructions: DEFAULT_INSTRUCTIONS,
  status: 'Draft',
  createdBy,
  createdOn: QPG_TODAY,
  history: [],
});

/** One "Edited" entry per person per day, however often they save. */
const withEdit = (history: QuestionPaper['history'], by: string): QuestionPaper['history'] => {
  const last = history[history.length - 1];
  return last?.action === 'Edited' && last.by === by && last.at === QPG_TODAY ? history : [...history, { at: QPG_TODAY, by, action: 'Edited' }];
};

/** Create or open a question paper (QPG-003 … QPG-012). */
export const PaperWizard: React.FC<{ initial: QuestionPaper; initialStep?: WizardStep; onExit: () => void }> = ({ initial, initialStep = 'details', onExit }) => {
  const { addToast, currentUser } = useApp();
  const g = useGrants();
  const { bank } = useQpgState();
  const [paper, setPaper] = useState<QuestionPaper>(initial);
  const [step, setStep] = useState<WizardStep>(initialStep);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  // Each step starts at the top, even after a long paper preview.
  useEffect(() => {
    top.current?.scrollIntoView({ block: 'start' });
  }, [step]);

  const isNew = !paper.id;
  const mayEdit = isNew ? g.can('QPG-003', 'C') : g.can('QPG-003', 'U');
  const editable = mayEdit && isEditable(paper);
  const detailErrors = validateDetails(paper.details, QPG_TODAY);
  const blueprintErrors = validateBlueprint(paper.blueprint, paper.details, bank).filter(i => i.level === 'error');
  const contentErrors = validateContent(paper).filter(i => i.level === 'error');

  const change = (p: QuestionPaper) => {
    setPaper({ ...p, title: paperTitle(p.details) });
    setDirty(true);
  };

  const lockReason = !mayEdit
    ? g.can('QPG-012', 'A')
      ? 'You review and approve papers. Only the Exam Coordinator can change them.'
      : 'Your role can view this paper but not change it.'
    : !isEditable(paper)
      ? `This paper is ${paper.status.toLowerCase()}, so its questions are locked.`
      : '';

  /** Saves the working copy; creates the paper on first save. */
  const save = async (quiet = false): Promise<QuestionPaper | null> => {
    if (!editable) return paper;
    if (Object.keys(detailErrors).length) {
      setShowErrors(true);
      setStep('details');
      addToast('Check the exam details', 'warning', Object.values(detailErrors)[0]);
      return null;
    }
    setSaving(true);
    try {
      const saved = isNew
        ? await questionPaperService.createPaper({ ...paper, history: [{ at: QPG_TODAY, by: currentUser.name, action: 'Created' }] })
        : await questionPaperService.savePaper({ ...paper, history: dirty ? withEdit(paper.history, currentUser.name) : paper.history });
      setPaper(saved);
      setDirty(false);
      if (!quiet) addToast(isNew ? `Draft ${saved.id} created` : `${saved.id} saved`, 'success');
      return saved;
    } catch (e) {
      addToast('Could not save the paper', 'error', (e as Error).message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const go = async (to: WizardStep) => {
    if (to === step) return;
    const from = STEPS.findIndex(s => s.id === step);
    const target = STEPS.findIndex(s => s.id === to);
    if (target > from && step === 'details' && Object.keys(detailErrors).length) {
      setShowErrors(true);
      return addToast('Check the exam details', 'warning', Object.values(detailErrors)[0]);
    }
    if (target > from && editable && (isNew || dirty)) {
      const saved = await save(true);
      if (!saved) return;
    }
    setStep(to);
  };

  const addFromBank = (q: BankQuestion, section: BlueprintSection) => {
    const next = addQuestion(paper.content, section.id, q.id, section.marksEach);
    if (next === paper.content) return addToast('That question is already in the paper', 'warning');
    change({ ...paper, content: next, sets: [] });
    addToast(`${q.id} added to ${section.title}`, 'success');
  };

  const index = STEPS.findIndex(s => s.id === step);
  const done: Record<WizardStep, boolean> = {
    details: !Object.keys(detailErrors).length && !isNew,
    blueprint: !blueprintErrors.length && !isNew,
    bank: paper.content.length > 0,
    ai: false,
    builder: paper.content.length > 0 && !contentErrors.length,
    sets: paper.sets.length > 1,
    key: false,
    approval: paper.status === 'Published',
  };

  return (
    <div ref={top} className="space-y-4 scroll-mt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <button onClick={onExit} className={`${btnGhost} -ml-3`}>
            <Icon name="arrow_back" className="text-sm" />
            All papers
          </button>
          <h2 className="text-lg font-bold text-ink flex flex-wrap items-center gap-2">
            {isNew ? 'Create Question Paper' : paper.id}
            <PaperStatusBadge status={paper.status} />
            {dirty && <span className="text-[10px] font-semibold text-amber-700">Unsaved changes</span>}
          </h2>
          <p className="text-xs text-ink-soft">{paper.title}</p>
        </div>
        <div className="flex gap-2">
          {editable && (
            <button onClick={() => save()} disabled={saving || (!dirty && !isNew)} className={btnSoft}>
              <Icon name="save" className="text-sm" />
              {saving ? 'Saving…' : 'Save draft'}
            </button>
          )}
        </div>
      </div>

      <Stepper steps={STEPS.map(s => ({ ...s, done: done[s.id], disabled: isNew && s.id !== 'details' && Object.keys(detailErrors).length > 0 }))} current={step} onSelect={id => go(id as WizardStep)} />

      {lockReason && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900" role="status">
          <Icon name="lock" className="text-base" />
          {lockReason}
        </p>
      )}

      <div key={step} className="fade-in">
        {step === 'details' && <DetailsStep details={paper.details} errors={showErrors ? detailErrors : {}} editable={editable} onChange={details => change({ ...paper, details })} />}
        {step === 'blueprint' && <BlueprintStep sections={paper.blueprint} details={paper.details} bank={bank} editable={editable} onChange={blueprint => change({ ...paper, blueprint, content: paper.content.filter(c => blueprint.some(b => b.id === c.sectionId)), sets: [] })} />}
        {step === 'bank' && <BankPanel paper={paper} editable={editable} onAdd={addFromBank} />}
        {step === 'ai' && <AiPanel paper={paper} editable={editable} onAdd={addFromBank} />}
        {step === 'builder' && <BuilderStep paper={paper} editable={editable} onChange={change} />}
        {step === 'sets' && <SetsStep paper={paper} editable={editable} onChange={change} />}
        {step === 'key' && <AnswerKeyStep paper={paper} />}
        {step === 'approval' &&
          (isNew ? (
            <p className="rounded-xl border border-dashed border-line p-6 text-center text-xs text-ink-soft">Save the paper first.</p>
          ) : (
            <ApprovalStep
              paper={paper}
              beforeSubmit={() => (dirty ? save(true) : Promise.resolve(paper))}
              onSaved={p => {
                setPaper(p);
                setDirty(false);
              }}
            />
          ))}
      </div>

      <div className="flex justify-between gap-2 pt-2 border-t border-line-soft">
        <button onClick={() => go(STEPS[index - 1].id)} disabled={index === 0} className={btnSoft}>
          <Icon name="arrow_back" className="text-sm" />
          Back
        </button>
        {index < STEPS.length - 1 ? (
          <button onClick={() => go(STEPS[index + 1].id)} disabled={saving} className={btnPrimary}>
            {step === 'details' && isNew ? 'Save & continue' : 'Next'}
            <Icon name="arrow_forward" className="text-sm" />
          </button>
        ) : (
          <button onClick={onExit} className={btnPrimary}>
            Done
          </button>
        )}
      </div>
    </div>
  );
};
