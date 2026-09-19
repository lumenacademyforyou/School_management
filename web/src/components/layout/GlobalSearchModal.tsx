import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ALL_NAV_ITEMS } from '../../data/adminNav';
import { canView } from '../../data/staffAccess';
import { INITIAL_ROSTER, matchesSearch, toProfile } from '../../data/students';
import { useDialogBehavior } from '../common/ui';

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

  // Ctrl/⌘ K stays global on purpose: it is how the console is searched from anywhere, including
  // from inside a text field. Escape, focus and the focus trap come from useDialogBehavior below.
  const open = useRef(searchModalOpen);
  open.current = searchModalOpen;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(!open.current);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setSearchModalOpen]);

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

  const [selectedIndex, setSelectedIndex] = useState(0);
  const panelRef = useDialogBehavior(searchModalOpen, () => setSearchModalOpen(false));

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!searchModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-lumen-950/55 backdrop-blur-[2px] fade-in" onClick={() => setSearchModalOpen(false)}>
      <div ref={panelRef} className="bg-surface w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden ring-1 ring-lumen-950/10 zoom-in" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Search">
        <div className="p-3 border-b border-subtle flex items-center gap-3">
          <span className="material-symbols-outlined text-brand text-xl">search</span>
          <input
            type="text"
            placeholder={canView(role, 'students') ? 'Search screens, or a student by name, admission no. or mobile' : 'Search screens'}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(i => (i + 1) % (results.length || 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(i => (i - 1 + results.length) % (results.length || 1));
              } else if (e.key === 'Enter' && results[selectedIndex]) {
                e.preventDefault();
                results[selectedIndex].open();
              }
            }}
            autoFocus
            className="flex-1 text-sm outline-hidden text-ink placeholder:text-ink-muted"
            aria-label="Search"
          />
          <button onClick={() => setSearchModalOpen(false)} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-ink-soft cursor-pointer transition-colors">
            Esc
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="py-8 text-center text-xs text-ink-muted">Nothing matches “{query}”.</p>
          ) : (
            results.map((r, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={r.id}
                  onClick={r.open}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left p-2.5 rounded-xl transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected ? 'bg-subtle ring-1 ring-brand/20' : 'hover:bg-subtle/60'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'bg-brand text-white shadow-xs' : 'bg-subtle text-brand'
                    }`}>
                      <span className="material-symbols-outlined text-lg">{r.icon}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold text-ink truncate">{r.title}</span>
                      <span className="block text-[11px] text-ink-soft truncate">{r.subtitle}</span>
                    </span>
                  </span>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-medium text-ink-muted">{r.category}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
