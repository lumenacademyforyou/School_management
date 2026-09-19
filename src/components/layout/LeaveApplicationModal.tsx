import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Field, Icon, Modal, btnPrimary, btnSoft, inputCls } from '../common/ui';
import { SECTION_CONFIG } from '../../data/attendance';

export const LeaveApplicationModal: React.FC = () => {
  const { leaveModalOpen, setLeaveModalOpen, addToast, student } = useApp();

  const [leaveType, setLeaveType] = useState('Medical Leave');
  const [fromDate, setFromDate] = useState('2025-03-03');
  const [toDate, setToDate] = useState('2025-03-04');
  const [reason, setReason] = useState('Mild viral fever and prescribed doctor rest.');
  const [note, setNote] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const close = () => setLeaveModalOpen(false);
  // student.class already reads "Class 10"; SECTION_CONFIG is keyed on the bare level ("10-A").
  const classLabel = `${student.class}-${student.section}`;
  const sectionKey = `${student.class.replace(/^Class\s*/i, '')}-${student.section}`;
  // The class teacher the request is routed to follows the student's own section.
  const classTeacher = student.mentor ?? SECTION_CONFIG.find(s => s.key === sectionKey)?.classTeacher ?? 'the class teacher';

  const submit = () => {
    close();
    addToast('Leave Request Dispatched', 'success', `Forwarded to ${classTeacher} for ${classLabel} attendance exemption.`);
  };

  return (
    <Modal
      open={leaveModalOpen}
      onClose={close}
      title="Submit student leave request"
      footer={
        <>
          <button onClick={close} className={btnSoft}>
            Cancel
          </button>
          <button onClick={submit} className={btnPrimary}>
            Submit to School
          </button>
        </>
      }
    >
      <div className="flex items-center gap-2 rounded-lg bg-wash border border-line-soft px-3 py-2">
        <Icon name="edit_calendar" className="text-base text-brand" />
        <span className="text-[11px] text-ink-soft">
          <span className="font-semibold text-ink">{student.name}</span> • {classLabel}
        </span>
      </div>

      <Field label="Leave Category">
        <select value={leaveType} onChange={e => setLeaveType(e.target.value)} className={`${inputCls} w-full`}>
          <option value="Medical Leave">Medical Leave (Doctor prescription attachable)</option>
          <option value="Family Event">Family / Personal Emergency</option>
          <option value="Competitive Exam">Olympiad / Competitive Exam External</option>
          <option value="Sports Event">District Sports Tournament</option>
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="From Date">
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className={`${inputCls} w-full`} />
        </Field>
        <Field label="To Date">
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className={`${inputCls} w-full`} />
        </Field>
      </div>

      <Field label={`Reason / Notes for ${classTeacher}`}>
        <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} className={`${inputCls} w-full`} placeholder="State reasons for absence..." />
      </Field>

      <div className="p-2.5 bg-wash border border-line-soft rounded-lg text-[11px] text-ink-soft flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 min-w-0">
          <Icon name="attach_file" className="text-sm text-brand" />
          <span className="truncate">{note ? note.name : 'Attach Doctor Note (Optional)'}</span>
        </span>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="sr-only"
          aria-label="Attach doctor note as PDF"
          onChange={e => setNote(e.target.files?.[0] ?? null)}
        />
        <button type="button" onClick={() => fileRef.current?.click()} className="text-brand font-semibold hover:underline shrink-0">
          {note ? 'Replace PDF' : 'Browse PDF'}
        </button>
      </div>
    </Modal>
  );
};
