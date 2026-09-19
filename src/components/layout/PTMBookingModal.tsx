import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Field, Icon, Modal, btnPrimary, btnSoft, inputCls } from '../common/ui';

const SLOTS = ['10:00 AM - 10:15 AM', '11:15 AM - 11:30 AM', '02:30 PM - 02:45 PM', '03:45 PM - 04:00 PM'];

export const PTMBookingModal: React.FC = () => {
  const { ptmModalOpen, setPtmModalOpen, student, addToast } = useApp();

  const [selectedTeacher, setSelectedTeacher] = useState('Mrs. Malini Iyer (Physics)');
  const [slot, setSlot] = useState('02:30 PM - 02:45 PM');
  const [mode, setMode] = useState<'In-Person' | 'Google Meet'>('In-Person');

  const close = () => setPtmModalOpen(false);
  const choice = (selected: boolean) =>
    `p-2 rounded-lg text-xs border text-center transition-colors ${selected ? 'bg-brand text-white border-brand font-semibold' : 'bg-subtle border-line text-ink font-medium hover:bg-line-soft'}`;

  const confirm = () => {
    close();
    addToast(`PTM Booked with ${selectedTeacher}`, 'success', `Confirmed for ${slot} (${mode}).`);
  };

  return (
    <Modal
      open={ptmModalOpen}
      onClose={close}
      title="Schedule parent-teacher meeting"
      footer={
        <>
          <button onClick={close} className={btnSoft}>
            Cancel
          </button>
          <button onClick={confirm} className={btnPrimary}>
            Confirm Appointment
          </button>
        </>
      }
    >
      <div className="flex items-center gap-2 rounded-lg bg-wash border border-line-soft px-3 py-2">
        <Icon name="event_available" className="text-base text-brand" />
        <span className="text-[11px] text-ink-soft">
          Child: <span className="font-semibold text-ink">{student.name}</span> ({student.class}-{student.section})
        </span>
      </div>

      <Field label="Select Faculty Member">
        <select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)} className={`${inputCls} w-full`}>
          <option value="Mrs. Malini Iyer (Physics)">Mrs. Malini Iyer (PGT Physics &amp; Class Mentor)</option>
          <option value="Dr. V. Raghavan (Mathematics)">Dr. V. Raghavan (HOD Mathematics)</option>
          <option value="Mr. S. Balaji (Chemistry)">Mr. S. Balaji (PGT Chemistry)</option>
          <option value="Ms. Clara D’Souza (English)">Ms. Clara D’Souza (TGT English)</option>
        </select>
      </Field>

      <div className="space-y-1">
        <span className="text-[11px] font-semibold text-ink-soft">Select Available Slot (Saturday, 1 Mar)</span>
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Available slots">
          {SLOTS.map(s => (
            <button key={s} type="button" onClick={() => setSlot(s)} aria-pressed={slot === s} className={choice(slot === s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-[11px] font-semibold text-ink-soft">Interaction Mode</span>
        <div className="flex gap-2" role="group" aria-label="Interaction mode">
          <button type="button" onClick={() => setMode('In-Person')} aria-pressed={mode === 'In-Person'} className={`${choice(mode === 'In-Person')} flex-1 flex items-center justify-center gap-1.5`}>
            <Icon name="meeting_room" className="text-sm" />
            <span>In-Person (Room 304)</span>
          </button>
          <button type="button" onClick={() => setMode('Google Meet')} aria-pressed={mode === 'Google Meet'} className={`${choice(mode === 'Google Meet')} flex-1 flex items-center justify-center gap-1.5`}>
            <Icon name="video_call" className="text-sm" />
            <span>Google Meet</span>
          </button>
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-[11px] text-emerald-800 flex items-center gap-2">
        <Icon name="verified" className="text-base" />
        <span>Appointment confirmed instantly. Calendar invite sent to {student.guardianName ? `${student.guardianName}’s` : 'the'} registered email.</span>
      </div>
    </Modal>
  );
};
