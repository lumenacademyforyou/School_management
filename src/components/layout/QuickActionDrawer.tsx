import React from 'react';
import { useApp } from '../../context/AppContext';
import { AdminView } from '../../types';
import { canView } from '../../data/staffAccess';

interface Shortcut {
  view: AdminView;
  icon: string;
  title: string;
  detail: string;
}

/** Everyday tasks, limited to the screens the signed-in role is allotted. */
const SHORTCUTS: Shortcut[] = [
  { view: 'admissions', icon: 'person_add', title: 'Record an enquiry', detail: 'Walk-in or phone enquiry at the front desk' },
  { view: 'fees', icon: 'point_of_sale', title: 'Collect a fee', detail: 'Counter payment with an instant receipt' },
  { view: 'attendance', icon: 'fact_check', title: 'Mark or correct attendance', detail: 'Any section, today or a past date' },
  { view: 'communication', icon: 'campaign', title: 'Send a message', detail: 'Notice, circular or emergency broadcast' },
  { view: 'workflows', icon: 'approval', title: 'Review approvals', detail: 'Concessions, refunds, transfer certificates' },
  { view: 'documents', icon: 'upload_file', title: 'Verify documents', detail: 'Pending uploads from parents' },
  { view: 'id-cards', icon: 'id_card', title: 'Print ID cards', detail: 'Generate, reissue or bulk print' },
  { view: 'audit-log', icon: 'history', title: 'Check the audit log', detail: 'Who changed what, and when' },
  { view: 'reports', icon: 'analytics', title: 'Open a report', detail: 'Dashboards, exports and schedules' },
];

export const QuickActionDrawer: React.FC = () => {
  const { quickActionOpen, setQuickActionOpen, setAdminView, currentUser } = useApp();
  if (!quickActionOpen) return null;
  const available = SHORTCUTS.filter(s => canView(currentUser.staffRole, s.view));

  return (
    <div className="fixed inset-0 bg-slate-950/50 z-50 flex justify-end" onClick={() => setQuickActionOpen(false)}>
      <div className="bg-white w-full max-w-sm h-full shadow-2xl flex flex-col border-l border-[#cbe0ec]" onClick={e => e.stopPropagation()} role="dialog" aria-label="Quick actions">
        <div className="p-4 border-b border-[#f0f7fb] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#082b3d]">Quick actions</h2>
          <button onClick={() => setQuickActionOpen(false)} className="p-1 text-[#777587] hover:text-[#082b3d] rounded-lg hover:bg-[#f0f7fb]" aria-label="Close quick actions">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {available.map(s => (
            <button
              key={s.view}
              onClick={() => {
                setAdminView(s.view);
                setQuickActionOpen(false);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#e0ecf4] hover:bg-[#f0f7fb] text-left"
            >
              <span className="material-symbols-outlined text-[#0e5d84]">{s.icon}</span>
              <span>
                <span className="block text-sm font-semibold text-[#082b3d]">{s.title}</span>
                <span className="block text-xs text-[#777587]">{s.detail}</span>
              </span>
            </button>
          ))}
          {available.length === 0 && <p className="text-xs text-[#777587] p-3">No quick actions for your role.</p>}
        </div>
      </div>
    </div>
  );
};
