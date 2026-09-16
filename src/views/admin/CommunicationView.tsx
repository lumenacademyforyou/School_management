import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface NoticeItem {
  id: string;
  title: string;
  audience: string;
  date: string;
  channel: string;
  sender: string;
  message: string;
  deliveredCount: number;
  readCount: number;
  status: 'Sent' | 'Delivered' | 'Scheduled';
}

export const CommunicationView: React.FC = () => {
  const { addToast } = useApp();
  const [channel, setChannel] = useState<'ALL' | 'WhatsApp' | 'SMS' | 'Email'>('ALL');
  const [audience, setAudience] = useState('All Class 10 Parents');
  const [title, setTitle] = useState('Pre-Board Examination Schedule for Class 10');
  const [message, setMessage] = useState(
    'Dear Parent, Pre-Board Examination Schedule for Class 10 has been published on Lumen Portal. The first examination commences on 05 March 2025.'
  );

  const [announcements, setAnnouncements] = useState<NoticeItem[]>([
    {
      id: 'ann-1',
      title: 'CBSE Board Examination 2025 Admit Cards Issued',
      audience: 'Class 10 & 12 Parents & Students',
      date: '25 Feb 2025',
      channel: 'WhatsApp + Portal Push',
      sender: 'Examination Cell',
      message: 'Admit cards for CBSE Class 10 & 12 Board Examination are available for physical collection from the school office between 9 AM and 3 PM.',
      deliveredCount: 280,
      readCount: 274,
      status: 'Delivered',
    },
    {
      id: 'ann-2',
      title: 'Annual Sports Day & Inter-House Athletics Meet',
      audience: 'Entire School Community',
      date: '22 Feb 2025',
      channel: 'Email + SMS',
      sender: 'Director of Physical Education',
      message: 'All parents are cordially invited to attend the Annual Sports Meet at the main campus stadium starting 8:30 AM this Saturday.',
      deliveredCount: 1450,
      readCount: 1390,
      status: 'Delivered',
    },
    {
      id: 'ann-3',
      title: 'Fee Payment Reminder: Term 3 Due 28 Feb',
      audience: 'Fee Defaulters & Outstanding Balances',
      date: '20 Feb 2025',
      channel: 'WhatsApp + SMS',
      sender: 'Finance & Accounts',
      message: 'Gentle reminder to clear pending Term 3 school fees prior to 28 February to avoid late penalty charges. Digital payment links active on portal.',
      deliveredCount: 42,
      readCount: 39,
      status: 'Delivered',
    },
  ]);

  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);

  const handleDispatch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim() || !title.trim()) {
      addToast('Please enter both broadcast title and message', 'error');
      return;
    }

    const newNotice: NoticeItem = {
      id: `ann-${Date.now()}`,
      title: title.trim(),
      audience,
      date: 'Today, Just now',
      channel: channel === 'ALL' ? 'WhatsApp + SMS + Email' : channel,
      sender: 'Administration & Principal Office',
      message: message.trim(),
      deliveredCount: audience === 'All Class 10 Parents' ? 142 : audience === 'Entire School Community' ? 1450 : 85,
      readCount: 1,
      status: 'Sent',
    };

    setAnnouncements([newNotice, ...announcements]);
    addToast(`Broadcast dispatched instantly to ${audience} via ${channel}!`, 'success');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#e0ecf4] shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0e5d84] uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm">campaign</span>
            <span>TRAI DLT Verified Communications Hub (COM-001..008)</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-[#082b3d]">
            Institutional Notices & Multi-Channel Broadcasts
          </h1>
          <p className="text-xs text-[#464555] mt-1">
            WhatsApp Business API • TRAI DLT Principal Entity #11014920 • Instant Parent Notification
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDispatch}
            className="flex items-center gap-1.5 bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-sm">send</span>
            <span>Dispatch Broadcast</span>
          </button>
        </div>
      </div>

      {/* Broadcast Composer + Recent Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Broadcast Composer */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-[#e0ecf4] shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#082b3d] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0e5d84] text-base">edit_note</span>
            <span>Compose Official Broadcast Notice</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-[#082b3d] mb-1">Notice Headline / Subject</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Notice headline..."
                className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-lg p-2.5 text-xs font-medium text-[#082b3d] outline-hidden focus:border-[#0e5d84]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[#082b3d] mb-1">Target Audience</label>
                <select
                  value={audience}
                  onChange={e => setAudience(e.target.value)}
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-lg p-2.5 text-xs font-medium text-[#082b3d] outline-hidden focus:border-[#0e5d84]"
                >
                  <option>All Class 10 Parents</option>
                  <option>All School Parents (Grades 1-12)</option>
                  <option>Hostel Scholars & Boarding Parents</option>
                  <option>Bus Route #14 Commuters</option>
                  <option>Teaching & Administrative Faculty</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#082b3d] mb-1">Delivery Channels</label>
                <div className="flex gap-1.5">
                  {(['ALL', 'WhatsApp', 'SMS', 'Email'] as const).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setChannel(c)}
                      className={`flex-1 py-2 text-[11px] font-semibold rounded-lg border transition-all ${
                        channel === c
                          ? 'bg-[#0e5d84] text-white border-[#0e5d84]'
                          : 'bg-[#f8f9ff] text-[#464555] border-[#cbe0ec] hover:bg-[#e0ecf4]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#082b3d] mb-1">
                Message Content (TRAI DLT Template ID: #100729410)
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl p-3 text-xs text-[#082b3d] outline-hidden focus:border-[#0e5d84]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#f0f7fb] text-xs text-[#777587]">
              <span>
                Estimated Audience:{' '}
                <strong>
                  {audience === 'All Class 10 Parents' ? '142 Parents' : audience === 'Entire School Community' ? '1,450 Recipients' : '85 Recipients'}
                </strong>
              </span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">verified</span>
                <span>TRAI DLT Whitelisted Header</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: Recent Official Notices */}
        <div className="bg-white p-5 rounded-2xl border border-[#e0ecf4] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#082b3d] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0e5d84] text-base">history</span>
              <span>Dispatched Notices</span>
            </h2>
            <span className="text-[11px] text-slate-500 font-medium">Click to inspect</span>
          </div>

          <div className="space-y-3">
            {announcements.map(ann => (
              <div
                key={ann.id}
                onClick={() => setSelectedNotice(ann)}
                className="p-3 bg-[#f8f9ff] hover:bg-[#eef4ff] cursor-pointer rounded-xl border border-[#cbe0ec] text-xs space-y-1.5 transition-all"
              >
                <div className="font-bold text-[#082b3d] leading-snug">{ann.title}</div>
                <div className="text-[11px] text-[#464555]">{ann.audience}</div>
                <div className="text-[10px] text-[#777587] flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-[#0e5d84] font-semibold">{ann.channel}</span>
                  <span className="font-medium">{ann.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notice Delivery Telemetry Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0e5d84]">analytics</span>
                <h3 className="font-bold text-[#082b3d] text-sm">Delivery & Engagement Analytics</h3>
              </div>
              <button
                onClick={() => setSelectedNotice(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-2 bg-[#f8f9ff] p-4 rounded-xl border border-slate-200">
              <div className="font-bold text-sm text-[#082b3d]">{selectedNotice.title}</div>
              <div className="text-slate-600">Target Audience: <strong>{selectedNotice.audience}</strong></div>
              <div className="text-slate-600">Dispatched Via: <strong>{selectedNotice.channel}</strong></div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-800 text-[11px] leading-relaxed">
                "{selectedNotice.message}"
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-[#f0f7fb] border border-[#cbe0ec] rounded-xl">
                <div className="text-[10px] uppercase font-bold text-[#082b3d]">Delivered</div>
                <div className="text-lg font-bold text-[#0e5d84] mt-0.5">{selectedNotice.deliveredCount}</div>
                <div className="text-[10px] text-[#082b3d]">100% Rate</div>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-emerald-900">Read / Seen</div>
                <div className="text-lg font-bold text-emerald-700 mt-0.5">{selectedNotice.readCount}</div>
                <div className="text-[10px] text-emerald-800">
                  {Math.round((selectedNotice.readCount / selectedNotice.deliveredCount) * 100)}% Engagement
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-slate-700">Failed / DND</div>
                <div className="text-lg font-bold text-slate-700 mt-0.5">0</div>
                <div className="text-[10px] text-slate-600">Clean Route</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => {
                  addToast(`Exported recipient delivery audit logs for "${selectedNotice.title}" (CSV)`, 'success');
                  setSelectedNotice(null);
                }}
                className="px-4 py-2 bg-[#0e5d84] hover:bg-[#083a4f] text-white rounded-xl font-bold flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>Export Delivery Log (CSV)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
