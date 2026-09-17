import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ALL_NAV_ITEMS } from '../../data/adminNav';
import { canView } from '../../data/staffAccess';
import { INITIAL_ROSTER, matchesSearch, toProfile } from '../../data/students';

interface Result {
  id: string;
  title: string;
  subtitle: string;
  category: 'Screen' | 'Student';
  icon: string;
  open: () => void;
}

/** Ctrl/⌘ K search across the screens and records the signed-in role is allotted. */
export const GlobalSearchModal: React.FC = () => {
  const { searchModalOpen, setSearchModalOpen, setAdminView, setStudent, currentUser } = useApp();
  const [query, setQuery] = useState('');
  const role = currentUser.staffRole;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(!searchModalOpen);
      }
      if (e.key === 'Escape' && searchModalOpen) setSearchModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchModalOpen, setSearchModalOpen]);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    const close = () => {
      setSearchModalOpen(false);
      setQuery('');
    };
    const screens: Result[] = ALL_NAV_ITEMS.filter(i => canView(role, i.id))
      .filter(i => !q || i.label.toLowerCase().includes(q))
      .map(i => ({ id: `screen-${i.id}`, title: i.label, subtitle: 'Open screen', category: 'Screen', icon: i.icon, open: () => { setAdminView(i.id); close(); } }));
    const students: Result[] =
      q.length >= 2 && canView(role, 'students')
        ? INITIAL_ROSTER.filter(s => !s.mergedInto && matchesSearch(s, query))
            .slice(0, 6)
            .map(s => ({
              id: `student-${s.id}`,
              title: s.name,
              subtitle: `Class ${s.classLevel}-${s.section} · ${s.admissionNo} · ${s.status}`,
              category: 'Student',
              icon: 'person',
              open: () => {
                setStudent(toProfile(s));
                setAdminView('student-360');
                close();
              },
            }))
        : [];
    return [...students, ...screens];
  }, [query, role, setAdminView, setSearchModalOpen, setStudent]);

  if (!searchModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/50 z-50 flex items-start justify-center pt-20 px-4" onClick={() => setSearchModalOpen(false)}>
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-[#cbe0ec] overflow-hidden" onClick={e => e.stopPropagation()} role="dialog" aria-label="Search">
        <div className="p-3 border-b border-[#f0f7fb] flex items-center gap-3">
          <span className="material-symbols-outlined text-[#0e5d84] text-xl">search</span>
          <input
            type="text"
            placeholder={canView(role, 'students') ? 'Search screens, or a student by name, admission no. or mobile' : 'Search screens'}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && results[0]) results[0].open();
            }}
            autoFocus
            className="flex-1 text-sm outline-hidden text-[#082b3d] placeholder-[#777587]"
            aria-label="Search"
          />
          <button onClick={() => setSearchModalOpen(false)} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-[#464555]">
            Esc
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="py-8 text-center text-xs text-[#777587]">Nothing matches “{query}”.</p>
          ) : (
            results.map(r => (
              <button key={r.id} onClick={r.open} className="w-full text-left p-2.5 rounded-xl hover:bg-[#f0f7fb] flex items-center justify-between gap-3">
                <span className="flex items-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-[#f0f7fb] text-[#0e5d84] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-lg">{r.icon}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-[#082b3d] truncate">{r.title}</span>
                    <span className="block text-[11px] text-[#464555] truncate">{r.subtitle}</span>
                  </span>
                </span>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-medium text-[#777587]">{r.category}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
