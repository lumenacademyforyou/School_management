import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminView } from '../../types';
import { BASELINE_GROUPS, LATER_GROUPS, NavGroup, NavItem } from '../../data/adminNav';
import { canView } from '../../data/staffAccess';

const LATER_KEY = 'lumen.sidebar.showLater';

const readLaterPref = () => {
  try {
    return window.localStorage.getItem(LATER_KEY) === '1';
  } catch {
    return false;
  }
};

const isItemActive = (item: NavItem, view: AdminView) => item.id === view || Boolean(item.aliases?.includes(view));

export const AdminSidebar: React.FC<{ collapsed?: boolean; onToggle?: () => void }> = ({ collapsed = false }) => {
  const { adminView, setAdminView, currentUser } = useApp();
  const role = currentUser.staffRole;
  const allotted = (groups: NavGroup[]) => groups.map(g => ({ ...g, items: g.items.filter(i => canView(role, i.id)) })).filter(g => g.items.length);
  const baseline = useMemo(() => allotted(BASELINE_GROUPS), [role]);
  const later = useMemo(() => allotted(LATER_GROUPS), [role]);
  const [filter, setFilter] = useState('');
  const [showLater, setShowLater] = useState<boolean>(readLaterPref);

  const groupOf = (view: AdminView) => [...BASELINE_GROUPS, ...LATER_GROUPS].find(g => g.items.some(i => isItemActive(i, view)))?.id;
  // Keep navigation to one expanded category. Multiple expanded sections make
  // the sidebar compete with the content area on small-height screens.
  const [openGroupId, setOpenGroupId] = useState<string | undefined>(() => groupOf(adminView));

  // Opening a screen from elsewhere keeps only its category visible.
  useEffect(() => {
    const active = groupOf(adminView);
    if (active) setOpenGroupId(active);
    if (LATER_GROUPS.some(g => g.id === active)) setShowLater(true);
  }, [adminView]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LATER_KEY, showLater ? '1' : '0');
    } catch {
      // Storage unavailable (private mode); the preference simply is not remembered
    }
  }, [showLater]);

  const groups = useMemo(() => {
    const source = showLater || filter.trim() ? [...baseline, ...later] : baseline;
    const q = filter.trim().toLowerCase();
    const matches = (item: NavItem) => [item.label, item.id, ...(item.aliases || [])].some(value => value.toLowerCase().includes(q));
    return source.map(g => ({ ...g, items: q ? g.items.filter(matches) : g.items })).filter(g => g.items.length);
  }, [showLater, filter, baseline, later]);

  const laterCount = later.reduce((n, g) => n + g.items.length, 0);

  const itemButton = (item: NavItem) => {
    const active = isItemActive(item, adminView);
    return (
      <button
        key={item.id}
        onClick={() => setAdminView(item.id)}
        title={collapsed ? item.label : undefined}
        data-nav={item.id}
        aria-current={active ? 'page' : undefined}
        className={`w-full flex items-center gap-3 rounded-lg text-[13px] transition-colors ${collapsed ? 'justify-center p-2' : 'px-3 py-2'} ${
          active ? 'bg-[#0e5d84] text-white font-semibold shadow-xs' : 'text-[#34495a] hover:bg-[#f0f7fb] hover:text-[#082b3d]'
        }`}
      >
        <span className={`material-symbols-outlined text-[18px] ${active ? 'text-white' : 'text-[#6b8394]'}`}>{item.icon}</span>
        {!collapsed && <span className="truncate">{item.label}</span>}
      </button>
    );
  };

  return (
    <aside
      className={`bg-white border-r border-[#e0ecf4] h-full min-h-0 overflow-hidden flex flex-col select-none ${collapsed ? 'w-16' : 'w-64'}`}
    >
      {!collapsed && (
        <div className="shrink-0 p-3 pb-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-[#8aa0ae]">search</span>
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') setFilter('');
              }}
              placeholder="Find a screen"
              aria-label="Find a screen"
              className="w-full bg-[#f5f8fb] border border-transparent focus:border-[#cbe0ec] focus:bg-white rounded-lg pl-8 pr-8 py-1.5 text-xs text-[#082b3d] placeholder-[#8aa0ae] outline-none"
            />
            {filter && (
              <button
                type="button"
                onClick={() => setFilter('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-[#8aa0ae] hover:bg-slate-200 hover:text-[#34495a]"
                aria-label="Clear module search"
                title="Clear search"
              >
                <span className="material-symbols-outlined text-[15px]">close</span>
              </button>
            )}
          </div>
          {filter && <p className="mt-1.5 px-1 text-[10px] text-[#6b8394]">Showing matching modules across the platform.</p>}
        </div>
      )}

      <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 pb-3 space-y-1" aria-label="Main">
        {itemButton({ id: 'dashboard', label: 'Dashboard', icon: 'space_dashboard' })}

        {groups.map(group => {
          const expanded = collapsed || Boolean(filter.trim()) || openGroupId === group.id;
          const hasActive = group.items.some(i => isItemActive(i, adminView));
          return (
            <div key={group.id} className="pt-2">
              {!collapsed && (
                <button
                  onClick={() => setOpenGroupId(current => (current === group.id ? undefined : group.id))}
                  aria-expanded={expanded}
                  aria-controls={`nav-group-${group.id}`}
                  className={`w-full flex items-center justify-between gap-2 rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                    hasActive ? 'bg-[#f0f7fb] text-[#0e5d84]' : 'text-[#6b8394] hover:bg-[#f5f8fb] hover:text-[#082b3d]'
                  }`}
                >
                  <span className="truncate">{group.label}</span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <span className="normal-case font-medium text-[10px] text-[#8aa0ae]">{group.items.length}</span>
                    <span className="material-symbols-outlined text-[16px]">{expanded ? 'expand_less' : 'expand_more'}</span>
                  </span>
                </button>
              )}
              {collapsed && <div className="h-px bg-[#e0ecf4] mx-2 my-1" />}
              {expanded && (
                <div id={`nav-group-${group.id}`} className="space-y-0.5 mt-0.5" role="group" aria-label={group.label}>
                  {group.items.map(itemButton)}
                </div>
              )}
            </div>
          );
        })}

        {groups.length === 0 && <p className="px-3 py-4 text-xs text-[#8aa0ae]">No screen matches “{filter}”.</p>}
      </nav>

      {!collapsed && (laterCount > 0 || canView(role, 'feature-spec-matrix')) && (
        <div className="shrink-0 border-t border-[#e0ecf4] bg-white p-2 space-y-1">
          {laterCount > 0 && (
            <label className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs text-[#34495a] cursor-pointer rounded-lg hover:bg-[#f5f8fb]">
              <span>
                Show later-phase modules <span className="text-[#8aa0ae]">({laterCount})</span>
              </span>
              <input type="checkbox" checked={showLater} onChange={e => setShowLater(e.target.checked)} className="accent-[#0e5d84]" aria-label="Show later-phase modules" />
            </label>
          )}
          {canView(role, 'feature-spec-matrix') && (
            <button
              data-nav="feature-spec-matrix"
              onClick={() => setAdminView('feature-spec-matrix')}
              className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs ${
                adminView === 'feature-spec-matrix' ? 'bg-[#f0f7fb] text-[#0e5d84] font-semibold' : 'text-[#6b8394] hover:bg-[#f5f8fb]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">checklist</span>
              Feature catalogue (699)
            </button>
          )}
        </div>
      )}
    </aside>
  );
};
