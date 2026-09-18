import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Figure } from '../../components/common/Figure';

interface TicketMessage {
  sender: string;
  role: string;
  time: string;
  text: string;
  isStaff: boolean;
}

interface Ticket {
  id: string;
  ticketNo: string;
  raisedBy: string;
  role: 'Parent' | 'Teacher' | 'Student' | 'Staff';
  category: 'Fee Inquiries' | 'Transport & Bus Routes' | 'Academic & Exams' | 'Statutory Grievance (PoSH/Anti-Ragging)' | 'IT & App Support';
  subject: string;
  priority: 'High' | 'Medium' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  slaHoursRemaining: number;
  assignedTo: string;
  messages: TicketMessage[];
  lastUpdated: string;
}

export const HelpdeskView: React.FC = () => {
  const { addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'all' | 'grievances' | 'analytics'>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');

  // New ticket modal
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newRaisedBy, setNewRaisedBy] = useState('');
  const [newCategory, setNewCategory] = useState<'Fee Inquiries' | 'Transport & Bus Routes' | 'Academic & Exams' | 'Statutory Grievance (PoSH/Anti-Ragging)' | 'IT & App Support'>('Fee Inquiries');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Critical'>('Medium');
  const [newSubject, setNewSubject] = useState('');

  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: 'TCK-001',
      ticketNo: 'HD-2026-0841',
      raisedBy: 'Dr. Rajesh Sundaram (Parent of Ananya S., 10-A)',
      role: 'Parent',
      category: 'Transport & Bus Routes',
      subject: 'Morning Route 14 pickup delayed by 25 minutes near Porur junction',
      priority: 'High',
      status: 'In Progress',
      slaHoursRemaining: 6,
      assignedTo: 'Transport In-charge (M. Karunakaran)',
      messages: [
        {
          sender: 'Dr. Rajesh Sundaram',
          role: 'Parent',
          time: 'Today, 08:30 AM',
          text: 'School bus Route 14 was delayed near Porur toll gate. Students arrived 20 minutes into first period assembly. Kindly check with GPS vendor.',
          isStaff: false,
        },
        {
          sender: 'M. Karunakaran (Transport Desk)',
          role: 'Staff',
          time: 'Today, 08:45 AM',
          text: 'Checked AIS-140 telematics log. Traffic diversion due to Chennai Metro Phase 2 pipeline work caused the bottleneck. Driver has been advised alternate bypass via Mount-Poonamallee.',
          isStaff: true,
        },
      ],
      lastUpdated: '10 mins ago',
    },
    {
      id: 'TCK-002',
      ticketNo: 'HD-2026-0842',
      raisedBy: 'Kavitha R. (Parent of R. Vignesh, 8-B)',
      role: 'Parent',
      category: 'Fee Inquiries',
      subject: 'Clarification regarding Term 2 Lab & Science fee waiver for sibling',
      priority: 'Medium',
      status: 'Open',
      slaHoursRemaining: 18,
      assignedTo: 'Accounts Officer (S. Lakshmi)',
      messages: [
        {
          sender: 'Kavitha R.',
          role: 'Parent',
          time: 'Today, 09:10 AM',
          text: 'We submitted the sibling discount form for our younger son in 6-B. The term 2 fee invoice does not reflect the 10% concession.',
          isStaff: false,
        },
      ],
      lastUpdated: '45 mins ago',
    },
    {
      id: 'TCK-003',
      ticketNo: 'HD-2026-0843',
      raisedBy: 'Confidential Whistleblower / Student Cell',
      role: 'Student',
      category: 'Statutory Grievance (PoSH/Anti-Ragging)',
      subject: 'Confidential Report: Unruly cafeteria behavior during junior lunch break',
      priority: 'Critical',
      status: 'In Progress',
      slaHoursRemaining: 4,
      assignedTo: 'Internal Complaints Committee (ICC Chairperson)',
      messages: [
        {
          sender: 'Confidential Student Entry',
          role: 'Student',
          time: 'Today, 07:15 AM',
          text: 'Submitting formal statement to the POSH & Anti-Ragging statutory committee regarding repeated cafeteria table blockage.',
          isStaff: false,
        },
      ],
      lastUpdated: '2 hours ago',
    },
    {
      id: 'TCK-004',
      ticketNo: 'HD-2026-0844',
      raisedBy: 'Priya Narayanan (PGT Physics)',
      role: 'Teacher',
      category: 'IT & App Support',
      subject: 'Smart board HDMI audio sync issue in Secondary Physics Lab 2',
      priority: 'Medium',
      status: 'Resolved',
      slaHoursRemaining: 24,
      assignedTo: 'IT Systems Admin (D. Praveen)',
      messages: [
        {
          sender: 'Priya Narayanan',
          role: 'Teacher',
          time: 'Yesterday, 03:00 PM',
          text: 'Audio lags behind visual presentation when playing wave motion simulations.',
          isStaff: false,
        },
        {
          sender: 'D. Praveen',
          role: 'Staff',
          time: 'Yesterday, 04:30 PM',
          text: 'Replaced auxiliary HDMI 2.1 cable and updated interactive panel firmware. Tested successfully.',
          isStaff: true,
        },
      ],
      lastUpdated: 'Yesterday',
    },
  ]);

  const handleResolve = (id: string) => {
    setTickets(prev =>
      prev.map(t => (t.id === id ? { ...t, status: 'Resolved', slaHoursRemaining: 0 } : t))
    );
    if (selectedTicket?.id === id) {
      setSelectedTicket(prev => (prev ? { ...prev, status: 'Resolved' } : null));
    }
    addToast('Ticket marked Resolved. SMS & Portal closure notification dispatched.', 'success');
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedTicket) return;

    const newMsg: TicketMessage = {
      sender: 'Lumen Helpdesk Admin',
      role: 'Staff',
      time: 'Just now',
      text: replyText.trim(),
      isStaff: true,
    };

    const updatedTickets = tickets.map(t => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          status: 'In Progress' as const,
          messages: [...t.messages, newMsg],
          lastUpdated: 'Just now',
        };
      }
      return t;
    });

    setTickets(updatedTickets);
    setSelectedTicket({
      ...selectedTicket,
      status: 'In Progress',
      messages: [...selectedTicket.messages, newMsg],
      lastUpdated: 'Just now',
    });
    setReplyText('');
    addToast(`Reply dispatched on ticket ${selectedTicket.ticketNo} via SMS & Portal`, 'success');
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRaisedBy.trim() || !newSubject.trim()) {
      addToast('Please provide applicant name and subject', 'error');
      return;
    }

    const newT: Ticket = {
      id: `TCK-00${tickets.length + 1}`,
      ticketNo: `HD-2026-084${tickets.length + 1}`,
      raisedBy: newRaisedBy.trim(),
      role: 'Parent',
      category: newCategory,
      subject: newSubject.trim(),
      priority: newPriority,
      status: 'Open',
      slaHoursRemaining: newPriority === 'Critical' ? 4 : newPriority === 'High' ? 12 : 24,
      assignedTo: newCategory.includes('Grievance') ? 'ICC Committee' : 'Desk Officer',
      messages: [
        {
          sender: newRaisedBy.trim(),
          role: 'Parent',
          time: 'Just now',
          text: newSubject.trim(),
          isStaff: false,
        },
      ],
      lastUpdated: 'Just now',
    };

    setTickets([newT, ...tickets]);
    setSelectedTicket(newT);
    setShowNewTicketModal(false);
    setNewRaisedBy('');
    setNewSubject('');
    addToast(`Raised support ticket #${newT.ticketNo} with ${newT.slaHoursRemaining}h SLA`, 'success');
  };

  const handleExportTickets = () => {
    const csvContent = [
      'Ticket Number,Raised By,Role,Category,Priority,Status,SLA Hours Remaining,Assigned Officer,Last Updated',
      ...tickets.map(
        t =>
          `${t.ticketNo},"${t.raisedBy}",${t.role},"${t.category}",${t.priority},${t.status},${t.slaHoursRemaining},"${t.assignedTo}","${t.lastUpdated}"`
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Helpdesk_Tickets_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Exported Support & Grievance Tickets (CSV)', 'success');
  };

  const filteredTickets = tickets.filter(t => {
    if (activeTab === 'grievances') return t.category.includes('Grievance');
    return true;
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-line-soft shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200">
              HLP · Module 31 · Layer 6 (Operations)
            </span>
            <span className="text-xs text-ink-muted">8 Master Features</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-ink mt-1">
            Helpdesk & Statutory Grievance Redressal
          </h1>
          <p className="text-xs md:text-sm text-ink-soft">
            Unified ticketing, SLA routing, PoSH / Anti-ragging statutory grievance desk, and parent satisfaction analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportTickets}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-ink rounded-xl text-xs font-bold border border-slate-300 transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowNewTicketModal(true)}
            className="px-4 py-2 bg-brand hover:bg-brand-strong text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Raise New Ticket</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[11px] font-bold text-ink-muted uppercase">Active Open Tickets</div>
          <div className="text-xl font-bold font-mono text-ink mt-1">
            {tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Average First Response: 18 mins</div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[11px] font-bold text-ink-muted uppercase">SLA Compliance Rate</div>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1"><Figure value="98.4" suffix="%" /></div>
          <div className="text-[11px] text-ink-muted mt-0.5">Under 24h Resolution SLA</div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[11px] font-bold text-ink-muted uppercase">Statutory Grievances (PoSH)</div>
          <div className="text-xl font-bold font-mono text-rose-600 mt-1">
            {tickets.filter(t => t.category.includes('Grievance') && t.status !== 'Resolved').length} Under Review
          </div>
          <div className="text-[11px] text-rose-700 mt-0.5">Confidential ICC Committee</div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-line-soft shadow-sm">
          <div className="text-[11px] font-bold text-ink-muted uppercase">Parent CSAT Rating</div>
          <div className="text-xl font-bold font-mono text-ink mt-1">4.8 / 5.0 ⭐</div>
          <div className="text-[11px] text-ink-muted mt-0.5">Based on 340 ratings</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-line-soft pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'all' ? 'bg-brand text-white shadow-xs' : 'text-ink-soft hover:bg-subtle'
          }`}
        >
          <span className="material-symbols-outlined text-sm">inbox</span>
          <span>All Tickets ({tickets.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('grievances')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'grievances' ? 'bg-brand text-white shadow-xs' : 'text-ink-soft hover:bg-subtle'
          }`}
        >
          <span className="material-symbols-outlined text-sm">shield</span>
          <span>Statutory Grievances & ICC</span>
        </button>
      </div>

      {/* Main Layout: Ticket List & Thread Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          {filteredTickets.map(ticket => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
                selectedTicket?.id === ticket.id
                  ? 'border-brand ring-2 ring-line shadow-sm'
                  : 'border-line-soft hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-brand bg-subtle px-2 py-0.5 rounded">
                    {ticket.ticketNo}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                      ticket.priority === 'Critical'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : ticket.priority === 'High'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {ticket.priority} Priority
                  </span>
                  <span className="text-[11px] text-ink-muted">• {ticket.category}</span>
                </div>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    ticket.status === 'Resolved'
                      ? 'bg-emerald-50 text-emerald-700'
                      : ticket.status === 'In Progress'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {ticket.status}
                </span>
              </div>

              <h4 className="text-sm font-bold text-ink mt-2">
                {ticket.subject}
              </h4>

              <div className="flex flex-wrap items-center justify-between text-[11px] text-ink-muted mt-3 pt-2 border-t border-line-soft">
                <div>
                  <span className="font-medium text-ink">{ticket.raisedBy}</span>
                  <span className="ml-1 px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-semibold">{ticket.role}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-amber-600 font-mono font-semibold flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-xs">timer</span>
                    <span>SLA: {ticket.slaHoursRemaining}h remaining</span>
                  </span>
                  <span>{ticket.lastUpdated}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Threaded Details Drawer (1 col) */}
        <div className="bg-surface rounded-2xl border border-line-soft p-5 shadow-sm flex flex-col justify-between">
          {selectedTicket ? (
            <div className="space-y-4">
              <div className="border-b border-line-soft pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-brand">{selectedTicket.ticketNo}</span>
                  {selectedTicket.status !== 'Resolved' && (
                    <button
                      onClick={() => handleResolve(selectedTicket.id)}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg font-bold transition-all"
                    >
                      ✓ Mark Resolved
                    </button>
                  )}
                </div>
                <h3 className="text-sm font-bold text-ink mt-1.5">{selectedTicket.subject}</h3>
                <div className="text-[11px] text-ink-muted mt-1">
                  Assigned to: <span className="font-semibold text-ink">{selectedTicket.assignedTo}</span>
                </div>
              </div>

              {/* Thread Messages */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {selectedTicket.messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl text-xs space-y-1 ${
                      m.isStaff
                        ? 'bg-subtle ml-3 border border-line'
                        : 'bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between font-semibold">
                      <span className={m.isStaff ? 'text-brand' : 'text-ink'}>
                        {m.sender}
                      </span>
                      <span className="text-[10px] text-ink-muted">{m.time}</span>
                    </div>
                    <p className="text-ink-soft">{m.text}</p>
                  </div>
                ))}
              </div>

              {/* Reply Input */}
              <div className="pt-2 border-t border-line-soft space-y-2">
                <label className="block text-[11px] font-bold text-ink-muted uppercase">Dispatch Reply / Update</label>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type official response to parent..."
                  className="w-full text-xs p-2.5 bg-wash border border-line-soft rounded-xl focus:outline-hidden focus:border-brand min-h-[70px]"
                />
                <button
                  onClick={handleSendReply}
                  className="w-full py-2 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-strong transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                  <span>Dispatch Reply via SMS/App</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-ink-muted space-y-2">
              <span className="material-symbols-outlined text-4xl text-slate-300">chat</span>
              <p className="text-xs">Select any ticket from the list to view threaded conversation, SLA timer, and dispatch official replies.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Raise New Support Ticket */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lumen-950/55 backdrop-blur-[2px]">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 text-xs ring-1 ring-lumen-950/10">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand">support_agent</span>
                <h3 className="font-bold text-ink text-sm">Raise Helpdesk Ticket / Grievance (HLP-001)</h3>
              </div>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Applicant / Parent / Staff Name</label>
                <input
                  type="text"
                  value={newRaisedBy}
                  onChange={e => setNewRaisedBy(e.target.value)}
                  placeholder="e.g. S. Venkatesh (Parent of Rahul, 7-A)"
                  className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full bg-wash border border-slate-300 rounded-xl p-2 text-xs text-slate-800"
                  >
                    <option value="Fee Inquiries">Fee Inquiries</option>
                    <option value="Transport & Bus Routes">Transport & Bus Routes</option>
                    <option value="Academic & Exams">Academic & Exams</option>
                    <option value="Statutory Grievance (PoSH/Anti-Ragging)">Statutory Grievance (PoSH/Anti-Ragging)</option>
                    <option value="IT & App Support">IT & App Support</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as any)}
                    className="w-full bg-wash border border-slate-300 rounded-xl p-2 text-xs text-slate-800"
                  >
                    <option value="Medium">Medium (24h SLA)</option>
                    <option value="High">High (12h SLA)</option>
                    <option value="Critical">Critical (4h SLA)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Issue Subject / Description</label>
                <textarea
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  placeholder="Describe inquiry or incident in detail..."
                  className="w-full bg-wash border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-brand min-h-[70px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand hover:bg-brand-strong text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
