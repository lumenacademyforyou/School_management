import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge, Field, Icon, Modal, Tone, btnPrimary, btnSoft, inputCls } from '../common/ui';
import { EMIS_FORMAT, EMIS_HELP, EmisCheck, EmisState, RosterStudent, StudentStatus, checkEmis, formatEmis, isValidApaar } from '../../data/students';
import { IdentifierPatch, NewStudent, identifierErrors, nextStudentId, studentService, suggestAdmissionNo, useRoster } from '../../services/studentService';

// Student 360 identifier block: EMIS (STU-026), APAAR (STU-027), admission number and student ID (STU-002, STU-003).

/** Lifecycle status in semantic colours: on the rolls (success), paused (neutral / warning), off the rolls (danger). */
export const STUDENT_STATUS_STYLE: Record<StudentStatus, string> = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'On leave': 'bg-slate-100 text-slate-700 border-slate-300',
  Suspended: 'bg-amber-50 text-amber-700 border-amber-200',
  'TC issued': 'bg-slate-100 text-slate-600 border-slate-200',
  Alumni: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Struck off': 'bg-rose-50 text-rose-700 border-rose-200',
};

export const StudentStatusBadge: React.FC<{ status: StudentStatus; className?: string }> = ({ status, className = '' }) => (
  <Badge className={`${STUDENT_STATUS_STYLE[status]} ${className}`}>{status}</Badge>
);

const EMIS_BADGE: Record<EmisState, { tone: Tone; label: string; icon: string }> = {
  valid: { tone: 'green', label: 'Valid', icon: 'verified' },
  invalid: { tone: 'red', label: 'Invalid', icon: 'error' },
  duplicate: { tone: 'amber', label: 'Duplicate', icon: 'content_copy' },
  empty: { tone: 'grey', label: 'Missing', icon: 'help' },
};

export const EmisStatusBadge: React.FC<{ check: EmisCheck }> = ({ check }) => (
  <Badge tone={EMIS_BADGE[check.state].tone}>
    <Icon name={EMIS_BADGE[check.state].icon} className="text-[12px]" />
    {EMIS_BADGE[check.state].label}
  </Badge>
);

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
};

/** EMIS value with copy, edit and a validation indicator. */
export const EmisDisplay: React.FC<{ student: RosterStudent; canEdit: boolean; editWhy?: string; onEdit: () => void; compact?: boolean }> = ({ student, canEdit, editWhy, onEdit, compact }) => {
  const { addToast } = useApp();
  const roster = useRoster();
  const check = checkEmis(student.emis, student.id, roster);
  return (
    <div className={compact ? 'space-y-1' : 'rounded-xl border border-line-soft p-3 space-y-1'} data-emis={student.id}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">EMIS Number</p>
        <EmisStatusBadge check={check} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <p className={`font-mono font-bold text-ink ${compact ? 'text-xs' : 'text-base'} break-all`}>{student.emis ? formatEmis(student.emis) : 'Not recorded'}</p>
        <div className="flex gap-1 ml-auto">
          <button
            onClick={async () => addToast((await copyText(student.emis ?? '')) ? 'EMIS number copied' : 'Could not copy', 'info', student.emis)}
            disabled={!student.emis}
            className={btnSoft}
            aria-label={`Copy EMIS number of ${student.name}`}
          >
            <Icon name="content_copy" className="text-sm" />
            Copy
          </button>
          <button onClick={onEdit} disabled={!canEdit} title={canEdit ? undefined : editWhy} className={btnSoft} aria-label={`Edit EMIS number of ${student.name}`}>
            <Icon name="edit" className="text-sm" />
            Edit
          </button>
        </div>
      </div>
      <p className={`text-[10px] ${check.state === 'valid' ? 'text-emerald-700' : check.state === 'empty' ? 'text-ink-muted' : check.state === 'duplicate' ? 'text-amber-800' : 'text-rose-700'}`}>{check.message}</p>
    </div>
  );
};

const LiveEmis: React.FC<{ value: string; studentId: string; roster: RosterStudent[]; onChange: (v: string) => void; disabled?: boolean }> = ({ value, studentId, roster, onChange, disabled }) => {
  const check = checkEmis(value, studentId, roster);
  const border = { valid: 'border-emerald-400', invalid: 'border-rose-400', duplicate: 'border-amber-400', empty: '' }[check.state];
  return (
    <Field label="EMIS Number" hint={`${EMIS_HELP} ${EMIS_FORMAT}`}>
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          inputMode="numeric"
          placeholder="33XX XXXX XXXX XXXX"
          className={`${inputCls} w-full font-mono ${border}`}
          aria-label="EMIS number"
          aria-invalid={check.state === 'invalid' || check.state === 'duplicate'}
          aria-describedby={`emis-state-${studentId}`}
        />
        <EmisStatusBadge check={check} />
      </div>
      <span id={`emis-state-${studentId}`} role="status" className={`block text-[10px] ${check.state === 'valid' ? 'text-emerald-700' : check.state === 'empty' ? 'text-ink-muted' : check.state === 'duplicate' ? 'text-amber-800' : 'text-rose-700'}`}>
        {check.message}
      </span>
    </Field>
  );
};

const IdentifierFields: React.FC<{
  studentId: string;
  value: IdentifierPatch;
  onChange: (v: IdentifierPatch) => void;
  admissionNo: string;
  onAdmissionNo?: (v: string) => void;
  roster: RosterStudent[];
}> = ({ studentId, value, onChange, admissionNo, onAdmissionNo, roster }) => {
  const apaarState = !value.apaar.trim() ? 'empty' : isValidApaar(value.apaar) ? 'ok' : 'bad';
  return (
    <fieldset className="rounded-xl border border-line-soft p-3 space-y-3">
      <legend className="px-1 text-xs font-bold text-ink">Government / Education Identifiers</legend>
      <LiveEmis value={value.emis} studentId={studentId} roster={roster} onChange={emis => onChange({ ...value, emis })} />
      <Field label="APAAR ID" hint="12-digit Automated Permanent Academic Account Registry ID. Leave blank while it is being generated." error={apaarState === 'bad' ? 'APAAR ID is 12 digits.' : undefined}>
        <input value={value.apaar} onChange={e => onChange({ ...value, apaar: e.target.value })} inputMode="numeric" placeholder="XXXX-XXXX-XXXX" className={`${inputCls} w-full font-mono`} aria-label="APAAR ID" aria-invalid={apaarState === 'bad'} />
      </Field>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Admission Number" hint={onAdmissionNo ? 'Suggested from the class series; you can change it.' : 'Admission numbers never change, even after a transfer.'}>
          <input value={admissionNo} onChange={e => onAdmissionNo?.(e.target.value)} readOnly={!onAdmissionNo} className={`${inputCls} w-full font-mono ${onAdmissionNo ? '' : 'bg-slate-50'}`} aria-label="Admission number" />
        </Field>
        <Field label="Student ID" hint="Created by the system; used to link records.">
          <input value={studentId} readOnly className={`${inputCls} w-full font-mono bg-slate-50`} aria-label="Student ID" />
        </Field>
      </div>
    </fieldset>
  );
};

/** Edit the identifiers of an existing student. */
export const EditIdentifiersModal: React.FC<{ student: RosterStudent | null; onClose: () => void; onSaved?: (s: RosterStudent) => void }> = ({ student, onClose, onSaved }) => {
  const { addToast } = useApp();
  const roster = useRoster();
  const [value, setValue] = useState<IdentifierPatch>({ emis: '', apaar: '' });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (student) setValue({ emis: student.emis ?? '', apaar: student.apaar ?? '' });
  }, [student]);
  if (!student) return null;
  const errors = identifierErrors(value, student.id, roster);
  const save = async () => {
    setSaving(true);
    try {
      const saved = await studentService.updateIdentifiers(student.id, value);
      addToast(`Identifiers updated for ${saved.name}`, 'success', saved.emis ? `EMIS ${formatEmis(saved.emis)}` : 'EMIS cleared');
      onSaved?.(saved);
      onClose();
    } catch (e) {
      addToast('Could not save identifiers', 'error', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit identifiers · ${student.name}`}
      footer={
        <>
          <button onClick={onClose} className={btnSoft}>
            Cancel
          </button>
          <button onClick={save} disabled={saving || Object.keys(errors).length > 0} className={btnPrimary}>
            {saving ? 'Saving…' : 'Save identifiers'}
          </button>
        </>
      }
    >
      <IdentifierFields studentId={student.id} value={value} onChange={setValue} admissionNo={student.admissionNo} roster={roster} />
    </Modal>
  );
};

/** STU-001: create a student record directly (admissions normally creates it on enrolment). */
export const AddStudentModal: React.FC<{ open: boolean; onClose: () => void; onCreated?: (s: RosterStudent) => void; initial?: Partial<NewStudent> }> = ({ open, onClose, onCreated, initial }) => {
  const { addToast } = useApp();
  const roster = useRoster();
  const blank = (): NewStudent => {
    const classLevel = initial?.classLevel ?? 8;
    return { name: '', gender: 'Female', dob: '2011-01-01', section: 'A', guardianName: '', guardianMobile: '', emis: '', apaar: '', ...initial, classLevel, admissionNo: suggestAdmissionNo(roster, classLevel) };
  };
  const [form, setForm] = useState<NewStudent>(blank);
  const [saving, setSaving] = useState(false);
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (open) {
      setForm(blank());
      setTried(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  if (!open) return null;
  const id = nextStudentId(roster);
  const set = (patch: Partial<NewStudent>) => setForm(f => ({ ...f, ...patch }));
  const idErrors = identifierErrors(form, id, roster);
  const missing = !form.name.trim() ? 'Enter the student’s name.' : !form.guardianName.trim() ? 'Enter the guardian’s name.' : form.guardianMobile.replace(/\D/g, '').length < 10 ? 'Enter a 10-digit guardian mobile.' : '';
  const save = async () => {
    setTried(true);
    if (missing || Object.keys(idErrors).length) return;
    setSaving(true);
    try {
      const s = await studentService.create(form);
      addToast(`${s.name} added as ${s.admissionNo}`, 'success', s.emis ? `EMIS ${formatEmis(s.emis)}` : 'EMIS still to be recorded');
      onCreated?.(s);
      onClose();
    } catch (e) {
      addToast('Could not add the student', 'error', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      open
      onClose={onClose}
      title="Add student"
      wide
      footer={
        <>
          <button onClick={onClose} className={btnSoft}>
            Cancel
          </button>
          <button onClick={save} disabled={saving} className={btnPrimary}>
            {saving ? 'Adding…' : 'Add student'}
          </button>
        </>
      }
    >
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Full name" error={tried && !form.name.trim() ? 'Required' : undefined}>
          <input value={form.name} onChange={e => set({ name: e.target.value })} className={`${inputCls} w-full`} aria-label="Student name" />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Gender">
            <select value={form.gender} onChange={e => set({ gender: e.target.value as NewStudent['gender'] })} className={`${inputCls} w-full`} aria-label="Gender">
              <option>Female</option>
              <option>Male</option>
            </select>
          </Field>
          <Field label="Date of birth">
            <input type="date" value={form.dob} onChange={e => set({ dob: e.target.value })} className={`${inputCls} w-full`} aria-label="Date of birth" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Class">
            <select value={form.classLevel} onChange={e => set({ classLevel: Number(e.target.value), admissionNo: suggestAdmissionNo(roster, Number(e.target.value)) })} className={`${inputCls} w-full`} aria-label="Class">
              {[8, 9, 10].map(c => (
                <option key={c} value={c}>
                  Class {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Section">
            <select value={form.section} onChange={e => set({ section: e.target.value })} className={`${inputCls} w-full`} aria-label="Section">
              {['A', 'B'].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Guardian name" error={tried && !form.guardianName.trim() ? 'Required' : undefined}>
            <input value={form.guardianName} onChange={e => set({ guardianName: e.target.value })} className={`${inputCls} w-full`} aria-label="Guardian name" />
          </Field>
          <Field label="Guardian mobile" error={tried && form.guardianMobile.replace(/\D/g, '').length < 10 ? '10 digits' : undefined}>
            <input value={form.guardianMobile} onChange={e => set({ guardianMobile: e.target.value })} inputMode="tel" className={`${inputCls} w-full`} aria-label="Guardian mobile" />
          </Field>
        </div>
      </div>
      <IdentifierFields studentId={id} value={form} onChange={v => set(v)} admissionNo={form.admissionNo} onAdmissionNo={admissionNo => set({ admissionNo })} roster={roster} />
      {tried && (missing || Object.values(idErrors)[0]) && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-800" role="alert">
          {missing || Object.values(idErrors)[0]}
        </p>
      )}
    </Modal>
  );
};
