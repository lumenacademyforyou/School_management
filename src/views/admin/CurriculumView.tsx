import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FeatureTags, PhaseNotice, downloadCsv } from '../../components/common/FeatureTags';

type SubjectType = 'Core' | 'Elective' | 'Co-scholastic';
type Applicability = 'M' | 'E' | '-';

interface Subject {
  code: string;
  name: string;
  type: SubjectType;
  credit: number;
  board: string;
}

interface ElectiveGroup {
  id: string;
  name: string;
  classLevel: string;
  options: { subjectCode: string; capacity: number; allotted: number }[];
}

interface ElectiveRequest {
  id: string;
  student: string;
  groupId: string;
  subjectCode: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

interface Topic {
  id: string;
  unit: string;
  chapter: string;
  topic: string;
  hours: number;
  covered: boolean;
}

interface LessonPlan {
  id: string;
  teacher: string;
  topicId: string;
  week: string;
  status: 'Submitted' | 'Approved' | 'Returned';
}

const CLASS_LEVELS = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

const SUBJECTS: Subject[] = [
  { code: 'ENG', name: 'English Language & Literature', type: 'Core', credit: 5, board: 'CBSE 184' },
  { code: 'MAT', name: 'Mathematics (Standard)', type: 'Core', credit: 5, board: 'CBSE 041' },
  { code: 'SCI', name: 'Science', type: 'Core', credit: 5, board: 'CBSE 086' },
  { code: 'SST', name: 'Social Science', type: 'Core', credit: 5, board: 'CBSE 087' },
  { code: 'HIN', name: 'Hindi Course B', type: 'Elective', credit: 4, board: 'CBSE 085' },
  { code: 'TAM', name: 'Tamil', type: 'Elective', credit: 4, board: 'CBSE 006' },
  { code: 'SKT', name: 'Sanskrit', type: 'Elective', credit: 4, board: 'CBSE 122' },
  { code: 'PHY', name: 'Physics', type: 'Core', credit: 5, board: 'CBSE 042' },
  { code: 'CHE', name: 'Chemistry', type: 'Core', credit: 5, board: 'CBSE 043' },
  { code: 'BIO', name: 'Biology', type: 'Elective', credit: 5, board: 'CBSE 044' },
  { code: 'CSC', name: 'Computer Science', type: 'Elective', credit: 5, board: 'CBSE 083' },
  { code: 'ART', name: 'Art Education', type: 'Co-scholastic', credit: 0, board: 'CBSE 502' },
  { code: 'HPE', name: 'Health & Physical Education', type: 'Co-scholastic', credit: 0, board: 'CBSE 503' },
];

// Class-subject applicability: M = mandatory, E = elective, - = not offered (CUR-002)
const INITIAL_MAPPING: Record<string, Applicability[]> = {
  ENG: ['M', 'M', 'M', 'M', 'M', 'M', 'M'],
  MAT: ['M', 'M', 'M', 'M', 'M', 'E', 'E'],
  SCI: ['M', 'M', 'M', 'M', 'M', '-', '-'],
  SST: ['M', 'M', 'M', 'M', 'M', '-', '-'],
  HIN: ['E', 'E', 'E', 'E', 'E', '-', '-'],
  TAM: ['E', 'E', 'E', 'E', 'E', '-', '-'],
  SKT: ['E', 'E', 'E', 'E', 'E', '-', '-'],
  PHY: ['-', '-', '-', '-', '-', 'M', 'M'],
  CHE: ['-', '-', '-', '-', '-', 'M', 'M'],
  BIO: ['-', '-', '-', '-', '-', 'E', 'E'],
  CSC: ['-', '-', '-', '-', '-', 'E', 'E'],
  ART: ['M', 'M', 'M', 'M', 'M', 'M', 'M'],
  HPE: ['M', 'M', 'M', 'M', 'M', 'M', 'M'],
};

const INITIAL_GROUPS: ElectiveGroup[] = [
  {
    id: 'grp-l2-9',
    name: 'Second Language',
    classLevel: 'Class 9',
    options: [
      { subjectCode: 'HIN', capacity: 80, allotted: 72 },
      { subjectCode: 'TAM', capacity: 60, allotted: 60 },
      { subjectCode: 'SKT', capacity: 30, allotted: 11 },
    ],
  },
  {
    id: 'grp-sci-11',
    name: 'Science Stream Fourth Subject',
    classLevel: 'Class 11',
    options: [
      { subjectCode: 'BIO', capacity: 40, allotted: 38 },
      { subjectCode: 'CSC', capacity: 40, allotted: 29 },
      { subjectCode: 'MAT', capacity: 40, allotted: 40 },
    ],
  },
];

const INITIAL_REQUESTS: ElectiveRequest[] = [
  { id: 'er-1', student: 'Farah N. Siddiqui (9-B)', groupId: 'grp-l2-9', subjectCode: 'TAM', status: 'Pending' },
  { id: 'er-2', student: 'Gautham M. Sundaram (9-A)', groupId: 'grp-l2-9', subjectCode: 'SKT', status: 'Pending' },
  { id: 'er-3', student: 'Ishita P. Rao (11-A)', groupId: 'grp-sci-11', subjectCode: 'CSC', status: 'Pending' },
  { id: 'er-4', student: 'Karthik V. Iyer (11-A)', groupId: 'grp-sci-11', subjectCode: 'BIO', status: 'Approved' },
];

const INITIAL_TOPICS: Topic[] = [
  { id: 't1', unit: 'Unit I — Chemical Substances', chapter: 'Ch 1 Chemical Reactions and Equations', topic: 'Balancing chemical equations', hours: 4, covered: true },
  { id: 't2', unit: 'Unit I — Chemical Substances', chapter: 'Ch 1 Chemical Reactions and Equations', topic: 'Types of chemical reactions', hours: 5, covered: true },
  { id: 't3', unit: 'Unit I — Chemical Substances', chapter: 'Ch 2 Acids, Bases and Salts', topic: 'pH scale and indicators', hours: 4, covered: true },
  { id: 't4', unit: 'Unit I — Chemical Substances', chapter: 'Ch 2 Acids, Bases and Salts', topic: 'Salts of everyday importance', hours: 3, covered: false },
  { id: 't5', unit: 'Unit II — World of Living', chapter: 'Ch 5 Life Processes', topic: 'Nutrition and respiration', hours: 6, covered: true },
  { id: 't6', unit: 'Unit II — World of Living', chapter: 'Ch 5 Life Processes', topic: 'Transportation and excretion', hours: 5, covered: false },
  { id: 't7', unit: 'Unit III — Natural Phenomena', chapter: 'Ch 9 Light — Reflection and Refraction', topic: 'Mirror formula and magnification', hours: 6, covered: false },
  { id: 't8', unit: 'Unit III — Natural Phenomena', chapter: 'Ch 9 Light — Reflection and Refraction', topic: 'Refraction through lenses', hours: 6, covered: false },
  { id: 't9', unit: 'Unit IV — Effects of Current', chapter: 'Ch 11 Electricity', topic: 'Ohm’s law and resistance', hours: 5, covered: false },
];

const INITIAL_PLANS: LessonPlan[] = [
  { id: 'lp-1', teacher: 'Mrs. Malini Iyer', topicId: 't4', week: 'Week 24 (15–20 Sep)', status: 'Submitted' },
  { id: 'lp-2', teacher: 'Mr. K. Natarajan', topicId: 't6', week: 'Week 24 (15–20 Sep)', status: 'Submitted' },
  { id: 'lp-3', teacher: 'Mrs. Malini Iyer', topicId: 't3', week: 'Week 22 (01–06 Sep)', status: 'Approved' },
];

const RESOURCES = [
  { subject: 'SCI', classLevel: 'Class 10', title: 'NCERT Science Textbook for Class X', kind: 'Textbook', publisher: 'NCERT' },
  { subject: 'SCI', classLevel: 'Class 10', title: 'NCERT Exemplar Problems — Science', kind: 'Workbook', publisher: 'NCERT' },
  { subject: 'MAT', classLevel: 'Class 10', title: 'NCERT Mathematics for Class X', kind: 'Textbook', publisher: 'NCERT' },
  { subject: 'ENG', classLevel: 'Class 10', title: 'First Flight / Footprints Without Feet', kind: 'Textbook', publisher: 'NCERT' },
];

const VERSIONS = [
  { version: 'v2025.1', academicYear: 'AY 2025–26', board: 'CBSE', note: 'Rationalised syllabus reinstated for Ch 9 Light', status: 'Draft' },
  { version: 'v2024.1', academicYear: 'AY 2024–25', board: 'CBSE', note: 'Current curriculum in force', status: 'Active' },
  { version: 'v2023.2', academicYear: 'AY 2023–24', board: 'CBSE', note: 'Post-rationalisation revision', status: 'Archived' },
];

type Tab = 'subjects' | 'electives' | 'syllabus' | 'plans' | 'resources';

const TABS: { id: Tab; label: string; icon: string; ids: string[] }[] = [
  { id: 'subjects', label: 'Subjects & Mapping', icon: 'menu_book', ids: ['CUR-001', 'CUR-002'] },
  { id: 'electives', label: 'Elective Groups', icon: 'call_split', ids: ['CUR-003', 'CUR-004'] },
  { id: 'syllabus', label: 'Syllabus & Coverage', icon: 'checklist', ids: ['CUR-005', 'CUR-006'] },
  { id: 'plans', label: 'Lesson Plans', icon: 'edit_note', ids: ['CUR-007'] },
  { id: 'resources', label: 'Resources & Versions', icon: 'library_books', ids: ['CUR-009', 'CUR-010', 'CUR-008'] },
];

const APPLICABILITY_STYLE: Record<Applicability, string> = {
  M: 'bg-[#0e5d84] text-white',
  E: 'bg-amber-100 text-amber-900 border border-amber-300',
  '-': 'bg-slate-50 text-slate-300',
};

const NEXT_APPLICABILITY: Record<Applicability, Applicability> = { M: 'E', E: '-', '-': 'M' };

export const CurriculumView: React.FC<{ initialTab?: Tab }> = ({ initialTab = 'subjects' }) => {
  const { addToast } = useApp();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [mapping, setMapping] = useState(INITIAL_MAPPING);
  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [topics, setTopics] = useState(INITIAL_TOPICS);
  const [plans, setPlans] = useState(INITIAL_PLANS);
  const [typeFilter, setTypeFilter] = useState<'All' | SubjectType>('All');

  const subjectName = (code: string) => SUBJECTS.find(s => s.code === code)?.name ?? code;
  const topicById = (id: string) => topics.find(t => t.id === id);

  const visibleSubjects = SUBJECTS.filter(s => typeFilter === 'All' || s.type === typeFilter);

  const coverage = useMemo(() => {
    const total = topics.reduce((sum, t) => sum + t.hours, 0);
    const done = topics.filter(t => t.covered).reduce((sum, t) => sum + t.hours, 0);
    const byUnit = Array.from(new Set(topics.map(t => t.unit))).map(unit => {
      const unitTopics = topics.filter(t => t.unit === unit);
      const unitTotal = unitTopics.reduce((s, t) => s + t.hours, 0);
      const unitDone = unitTopics.filter(t => t.covered).reduce((s, t) => s + t.hours, 0);
      return { unit, total: unitTotal, done: unitDone, pct: unitTotal ? Math.round((unitDone / unitTotal) * 100) : 0 };
    });
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0, byUnit };
  }, [topics]);

  const cycleMapping = (code: string, idx: number) => {
    setMapping(prev => {
      const row = [...prev[code]];
      row[idx] = NEXT_APPLICABILITY[row[idx]];
      return { ...prev, [code]: row };
    });
  };

  const decideRequest = (req: ElectiveRequest, decision: 'Approved' | 'Rejected') => {
    if (decision === 'Approved') {
      const group = groups.find(g => g.id === req.groupId);
      const option = group?.options.find(o => o.subjectCode === req.subjectCode);
      if (!group || !option) return;
      if (option.allotted >= option.capacity) {
        addToast(`${subjectName(req.subjectCode)} is full (${option.capacity}/${option.capacity})`, 'error', 'Capacity limit reached — CUR-004');
        return;
      }
      setGroups(prev =>
        prev.map(g =>
          g.id === req.groupId
            ? { ...g, options: g.options.map(o => (o.subjectCode === req.subjectCode ? { ...o, allotted: o.allotted + 1 } : o)) }
            : g
        )
      );
    }
    setRequests(prev => prev.map(r => (r.id === req.id ? { ...r, status: decision } : r)));
    addToast(`Elective request ${decision.toLowerCase()} for ${req.student}`, decision === 'Approved' ? 'success' : 'info');
  };

  const toggleTopic = (id: string) => {
    setTopics(prev => prev.map(t => (t.id === id ? { ...t, covered: !t.covered } : t)));
  };

  const decidePlan = (id: string, status: 'Approved' | 'Returned') => {
    setPlans(prev => prev.map(p => (p.id === id ? { ...p, status } : p)));
    addToast(`Lesson plan ${status.toLowerCase()} by HOD`, status === 'Approved' ? 'success' : 'warning');
  };

  const exportMapping = () => {
    downloadCsv(
      `Class_Subject_Mapping_${new Date().toISOString().slice(0, 10)}.csv`,
      ['Code', 'Subject', 'Type', ...CLASS_LEVELS],
      SUBJECTS.map(s => [s.code, s.name, s.type, ...mapping[s.code]])
    );
    addToast('Exported class–subject mapping (CSV)', 'success');
  };

  const pendingRequests = requests.filter(r => r.status === 'Pending').length;
  const pendingPlans = plans.filter(p => p.status === 'Submitted').length;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0e5d84] uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm">menu_book</span>
            <span>Module 14 · Academics — Curriculum (CUR)</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-[#082b3d]">Curriculum & Syllabus Coverage</h1>
          <p className="text-xs text-[#464555] mt-1">AY 2024–25 · CBSE · Subject master, electives, syllabus plan and coverage</p>
        </div>
        <button
          onClick={exportMapping}
          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-[#082b3d] text-xs font-semibold px-3 py-2 rounded-xl transition-colors self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-sm">download</span>
          <span>Export Mapping</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Subjects in master', value: SUBJECTS.length, icon: 'menu_book' },
          { label: 'Elective requests pending', value: pendingRequests, icon: 'pending_actions' },
          { label: 'Class 10 Science coverage', value: `${coverage.pct}%`, icon: 'donut_large' },
          { label: 'Lesson plans awaiting HOD', value: pendingPlans, icon: 'rate_review' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-[#e0ecf4] p-4 shadow-xs">
            <span className="material-symbols-outlined text-[#0e5d84] text-lg">{kpi.icon}</span>
            <p className="text-2xl font-bold text-[#082b3d] mt-1">{kpi.value}</p>
            <p className="text-[11px] text-[#777587]">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-[#e0ecf4]">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id ? 'border-[#0e5d84] text-[#0e5d84]' : 'border-transparent text-[#777587] hover:text-[#082b3d]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
      <FeatureTags ids={TABS.find(t => t.id === tab)!.ids} />

      {tab === 'subjects' && (
        <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
          <div className="p-4 bg-[#f0f7fb] border-b border-[#cbe0ec] flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#082b3d]">Class–subject applicability · click a cell to cycle Mandatory → Elective → Not offered</span>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as 'All' | SubjectType)}
              className="text-xs border border-[#cbe0ec] rounded-lg px-2 py-1 bg-white"
            >
              {['All', 'Core', 'Elective', 'Co-scholastic'].map(o => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-[#464555]">
                <tr>
                  <th className="text-left p-3 font-semibold">Code</th>
                  <th className="text-left p-3 font-semibold">Subject</th>
                  <th className="text-left p-3 font-semibold">Type</th>
                  <th className="text-center p-3 font-semibold">Credit</th>
                  <th className="text-left p-3 font-semibold">Board map</th>
                  {CLASS_LEVELS.map(c => (
                    <th key={c} className="text-center p-3 font-semibold whitespace-nowrap">{c.replace('Class ', '')}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f7fb]">
                {visibleSubjects.map(s => (
                  <tr key={s.code} className="hover:bg-[#f8f9ff]">
                    <td className="p-3 font-mono font-bold text-[#0e5d84]">{s.code}</td>
                    <td className="p-3 font-medium text-[#082b3d]">{s.name}</td>
                    <td className="p-3 text-[#464555]">{s.type}</td>
                    <td className="p-3 text-center">{s.credit}</td>
                    <td className="p-3 font-mono text-[#777587]">{s.board}</td>
                    {mapping[s.code].map((a, idx) => (
                      <td key={idx} className="p-1.5 text-center">
                        <button
                          onClick={() => cycleMapping(s.code, idx)}
                          className={`w-7 h-7 rounded-md text-[10px] font-bold ${APPLICABILITY_STYLE[a]}`}
                          aria-label={`${s.name} ${CLASS_LEVELS[idx]}: ${a}`}
                        >
                          {a}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'electives' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {groups.map(g => (
              <div key={g.id} className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#082b3d]">{g.name}</p>
                    <p className="text-[11px] text-[#777587]">{g.classLevel} · choose exactly one</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Window open</span>
                </div>
                {g.options.map(o => {
                  const pct = Math.round((o.allotted / o.capacity) * 100);
                  return (
                    <div key={o.subjectCode}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="font-semibold text-[#082b3d]">{subjectName(o.subjectCode)}</span>
                        <span className={pct >= 100 ? 'text-rose-600 font-bold' : 'text-[#464555]'}>
                          {o.allotted}/{o.capacity}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${pct >= 100 ? 'bg-rose-500' : pct >= 85 ? 'bg-amber-500' : 'bg-[#0e5d84]'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
            <div className="p-4 bg-[#f0f7fb] border-b border-[#cbe0ec] text-xs font-bold text-[#082b3d]">Selection requests</div>
            <div className="divide-y divide-[#f0f7fb]">
              {requests.map(r => (
                <div key={r.id} className="p-3 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <p className="font-semibold text-[#082b3d]">{r.student}</p>
                    <p className="text-[11px] text-[#777587]">{subjectName(r.subjectCode)}</p>
                  </div>
                  {r.status === 'Pending' ? (
                    <div className="flex gap-1">
                      <button onClick={() => decideRequest(r, 'Rejected')} className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold">
                        Reject
                      </button>
                      <button onClick={() => decideRequest(r, 'Approved')} className="px-2 py-1 rounded-lg bg-[#0e5d84] hover:bg-[#083a4f] text-white font-semibold">
                        Approve
                      </button>
                    </div>
                  ) : (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {r.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'syllabus' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
            <div className="p-4 bg-[#f0f7fb] border-b border-[#cbe0ec] text-xs font-bold text-[#082b3d]">
              Class 10 · Science (086) · tick topics as taught
            </div>
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-[#464555]">
                <tr>
                  <th className="p-3 w-10" />
                  <th className="text-left p-3 font-semibold">Chapter / Topic</th>
                  <th className="text-center p-3 font-semibold">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f7fb]">
                {topics.map(t => (
                  <tr key={t.id} className="hover:bg-[#f8f9ff]">
                    <td className="p-3 text-center">
                      <input type="checkbox" checked={t.covered} onChange={() => toggleTopic(t.id)} className="accent-[#0e5d84]" aria-label={t.topic} />
                    </td>
                    <td className="p-3">
                      <p className={`font-medium ${t.covered ? 'text-[#777587] line-through' : 'text-[#082b3d]'}`}>{t.topic}</p>
                      <p className="text-[10px] text-[#777587]">{t.chapter}</p>
                    </td>
                    <td className="p-3 text-center">{t.hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs p-4 space-y-4">
            <div>
              <p className="text-xs font-bold text-[#082b3d]">Coverage vs plan</p>
              <p className="text-3xl font-bold text-[#0e5d84] mt-1">{coverage.pct}%</p>
              <p className="text-[11px] text-[#777587]">
                {coverage.done} of {coverage.total} planned hours taught
              </p>
            </div>
            {coverage.byUnit.map(u => (
              <div key={u.unit}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#082b3d] font-semibold">{u.unit}</span>
                  <span className="text-[#464555]">{u.pct}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0e5d84]" style={{ width: `${u.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'plans' && (
        <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
          <div className="p-4 bg-[#f0f7fb] border-b border-[#cbe0ec] text-xs font-bold text-[#082b3d]">HOD approval queue · weekly plans mapped to syllabus topics</div>
          <div className="divide-y divide-[#f0f7fb]">
            {plans.map(p => {
              const t = topicById(p.topicId);
              return (
                <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <p className="font-semibold text-[#082b3d]">{t?.topic}</p>
                    <p className="text-[11px] text-[#777587]">
                      {p.teacher} · {p.week} · {t?.chapter}
                    </p>
                  </div>
                  {p.status === 'Submitted' ? (
                    <div className="flex gap-1">
                      <button onClick={() => decidePlan(p.id, 'Returned')} className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold">
                        Return
                      </button>
                      <button onClick={() => decidePlan(p.id, 'Approved')} className="px-2 py-1 rounded-lg bg-[#0e5d84] hover:bg-[#083a4f] text-white font-semibold">
                        Approve
                      </button>
                    </div>
                  ) : (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full self-start ${p.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {p.status}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'resources' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
              <div className="p-4 bg-[#f0f7fb] border-b border-[#cbe0ec] text-xs font-bold text-[#082b3d]">Textbooks & resources</div>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-[#f0f7fb]">
                  {RESOURCES.map(r => (
                    <tr key={r.title}>
                      <td className="p-3 font-mono font-bold text-[#0e5d84]">{r.subject}</td>
                      <td className="p-3">
                        <p className="font-medium text-[#082b3d]">{r.title}</p>
                        <p className="text-[10px] text-[#777587]">
                          {r.classLevel} · {r.publisher}
                        </p>
                      </td>
                      <td className="p-3 text-right text-[#464555]">{r.kind}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
              <div className="p-4 bg-[#f0f7fb] border-b border-[#cbe0ec] text-xs font-bold text-[#082b3d]">Curriculum versions by academic year</div>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-[#f0f7fb]">
                  {VERSIONS.map(v => (
                    <tr key={v.version}>
                      <td className="p-3 font-mono font-bold text-[#082b3d]">{v.version}</td>
                      <td className="p-3">
                        <p className="font-medium text-[#082b3d]">
                          {v.academicYear} · {v.board}
                        </p>
                        <p className="text-[10px] text-[#777587]">{v.note}</p>
                      </td>
                      <td className="p-3 text-right">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            v.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : v.status === 'Draft' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <PhaseNotice ids={['CUR-008']} phase="Phase 4" note="NEP learning-outcome tagging on topics is scheduled for P4 and is not active in this release." />
        </div>
      )}
    </div>
  );
};
