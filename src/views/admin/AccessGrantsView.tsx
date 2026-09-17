import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FeatureTags } from '../../components/common/FeatureTags';
import { SMS_MODULES } from '../../data/featureCatalog';
import {
  FEATURE_GRANTS,
  GRANT_ROLES,
  GRANT_ROLE_LABEL,
  GrantRole,
  VERB_LABEL,
  VERB_ORDER,
  ownershipViolations,
  systemProducedFeatures,
  verbString,
} from '../../data/permissions';

const QUESTIONS: { q: string; grants: string }[] = [
  { q: 'Who is accountable for the outcome being produced?', grants: 'C, U, D — exactly one role' },
  { q: 'Who needs to see it to do their own job?', grants: 'R' },
  { q: 'Who answers if it’s wrong or contested?', grants: 'A' },
  { q: 'Who needs the data outside the system?', grants: 'E' },
];

const VERB_STYLE: Record<string, string> = {
  C: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  U: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  D: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  R: 'bg-slate-50 text-slate-600 border-slate-200',
  A: 'bg-amber-50 text-amber-800 border-amber-200',
  E: 'bg-sky-50 text-sky-700 border-sky-200',
};

const Verbs: React.FC<{ verbs: string[] }> = ({ verbs }) =>
  verbs.length ? (
    <span className="inline-flex gap-0.5">
      {verbs.map(v => (
        <span key={v} title={VERB_LABEL[v as keyof typeof VERB_LABEL]} className={`font-mono text-[10px] font-bold w-5 text-center py-0.5 rounded border ${VERB_STYLE[v]}`}>
          {v}
        </span>
      ))}
    </span>
  ) : (
    <span className="text-[#777587]">–</span>
  );

/** RBAC-001/003/013: the feature × role grant matrix every screen and action is checked against. */
export const AccessGrantsView: React.FC = () => {
  const { currentUser } = useApp();
  const [moduleCode, setModuleCode] = useState('FEE');
  const [role, setRole] = useState<GrantRole | 'all'>('all');
  const [query, setQuery] = useState('');

  const violations = useMemo(() => ownershipViolations(), []);
  const systemProduced = useMemo(() => systemProducedFeatures(), []);

  const features = FEATURE_GRANTS.filter(f => (moduleCode === 'all' || f.module === moduleCode) && (!query.trim() || `${f.id} ${f.name}`.toLowerCase().includes(query.trim().toLowerCase())));
  const rows = features.flatMap(f => f.rows.filter(g => role === 'all' || g.role === role).map(g => ({ f, g })));
  const shown = rows.slice(0, 400);

  const summary = GRANT_ROLES.map(gr => {
    const mine = features.map(f => f.rows.find(x => x.role === gr)).filter(Boolean);
    return {
      role: gr,
      owns: mine.filter(g => g!.verbs.some(v => v === 'C' || v === 'U' || v === 'D')).length,
      reads: mine.filter(g => g!.verbs.length > 0).length,
      approves: mine.filter(g => g!.verbs.includes('A')).length,
      exports: mine.filter(g => g!.verbs.includes('E')).length,
    };
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#0e5d84] uppercase tracking-wider mb-1">
          <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
          <span>Module 3 · Roles & Permissions (RBAC)</span>
        </div>
        <h1 className="text-xl md:text-2xl font-bold font-display text-[#082b3d]">Access grants</h1>
        <p className="text-xs text-[#464555] mt-1">
          One row per feature and role: verbs, scope and condition. Screens and actions in every app are checked against this table. You are signed in as {currentUser.roleTitle}.
        </p>
        <FeatureTags ids={['RBAC-001', 'RBAC-003', 'RBAC-010', 'RBAC-013']} className="mt-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
          <p className="p-3 bg-[#f0f7fb] border-b border-[#cbe0ec] text-xs font-bold text-[#082b3d]">How each row is derived</p>
          <table className="w-full text-xs">
            <tbody className="divide-y divide-[#f0f7fb]">
              {QUESTIONS.map(x => (
                <tr key={x.q}>
                  <td className="p-2.5">{x.q}</td>
                  <td className="p-2.5 font-mono font-semibold text-[#0e5d84] whitespace-nowrap">{x.grants}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="p-3 text-[11px] text-[#464555] border-t border-[#f0f7fb]">
            Accountable means one role. If two roles can both create fee structures, neither owns them. Everyone else gets Read.
          </p>
        </div>
        <div className="space-y-3">
          <div className={`rounded-2xl border p-3 text-xs ${violations.length ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
            <p className="font-bold">{violations.length ? `${violations.length} feature(s) with more than one owner` : 'Every feature has at most one owner'}</p>
            {violations.slice(0, 5).map(v => (
              <p key={v.id} className="font-mono text-[11px]">
                {v.id}: {v.owners.map(o => GRANT_ROLE_LABEL[o]).join(', ')}
              </p>
            ))}
            <p className="mt-1 text-[11px]">Checked across all {FEATURE_GRANTS.length} catalogue features.</p>
          </div>
          <div className="rounded-2xl border border-[#e0ecf4] bg-white p-3 text-xs">
            <p className="font-bold text-[#082b3d]">{systemProduced.length} computed feature(s)</p>
            <p className="text-[11px] text-[#464555]">Nobody edits these directly; the system produces them from other records.</p>
            <p className="font-mono text-[11px] text-[#777587] mt-1">{systemProduced.join(', ') || '—'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden">
        <div className="p-3 bg-[#f0f7fb] border-b border-[#cbe0ec] flex flex-wrap items-center gap-2 text-xs">
          <select value={moduleCode} onChange={e => setModuleCode(e.target.value)} className="border border-[#cbe0ec] rounded-lg px-2 py-1.5 bg-white" aria-label="Module">
            <option value="all">All modules</option>
            {SMS_MODULES.map(m => (
              <option key={m.code} value={m.code}>
                {m.code} · {m.name}
              </option>
            ))}
          </select>
          <select value={role} onChange={e => setRole(e.target.value as GrantRole | 'all')} className="border border-[#cbe0ec] rounded-lg px-2 py-1.5 bg-white" aria-label="Role">
            <option value="all">All roles</option>
            {GRANT_ROLES.map(r => (
              <option key={r} value={r}>
                {GRANT_ROLE_LABEL[r]}
              </option>
            ))}
          </select>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Feature id or name" className="border border-[#cbe0ec] rounded-lg px-2 py-1.5 bg-white flex-1 min-w-[160px]" aria-label="Find feature" />
          <span className="text-[#464555]">
            {features.length} feature(s) · {rows.length} row(s)
          </span>
        </div>

        <div className="p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2 border-b border-[#f0f7fb]">
          {summary.map(s => (
            <button
              key={s.role}
              onClick={() => setRole(role === s.role ? 'all' : s.role)}
              className={`text-left rounded-xl border p-2 text-[11px] ${role === s.role ? 'border-[#0e5d84] bg-[#f0f7fb]' : 'border-[#e0ecf4] hover:bg-[#f8f9ff]'}`}
            >
              <span className="block font-bold text-[#082b3d]">{GRANT_ROLE_LABEL[s.role]}</span>
              <span className="block text-[#464555]">
                owns {s.owns} · reads {s.reads}
              </span>
              <span className="block text-[#777587]">
                approves {s.approves} · exports {s.exports}
              </span>
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-[#464555]">
              <tr>
                <th className="p-2.5 text-left">Feature</th>
                <th className="p-2.5 text-left">Role</th>
                <th className="p-2.5 text-left">Verb</th>
                <th className="p-2.5 text-left">Scope</th>
                <th className="p-2.5 text-left">Condition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f7fb]">
              {shown.map(({ f, g }, i) => (
                <tr key={`${f.id}-${g.role}`} className={i > 0 && shown[i - 1].f.id === f.id ? '' : 'border-t-2 border-[#e0ecf4]'}>
                  <td className="p-2.5 align-top">
                    {(i === 0 || shown[i - 1].f.id !== f.id) && (
                      <>
                        <span className="font-mono font-bold text-[#0e5d84]">{f.id}</span> <span className="text-[#082b3d]">{f.name}</span>
                        <span className="block text-[10px] text-[#777587]">{f.phase}</span>
                      </>
                    )}
                  </td>
                  <td className="p-2.5 whitespace-nowrap">{GRANT_ROLE_LABEL[g.role]}</td>
                  <td className="p-2.5" aria-label={`${f.id} ${GRANT_ROLE_LABEL[g.role]} verbs ${verbString(g.verbs)}`}>
                    <Verbs verbs={g.verbs} />
                  </td>
                  <td className="p-2.5 whitespace-nowrap">{g.scope}</td>
                  <td className="p-2.5 text-[#464555]">{g.condition || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > shown.length && <p className="p-3 text-[11px] text-[#777587]">Showing the first {shown.length} rows — pick a module or role to narrow the list.</p>}
          {rows.length === 0 && <p className="p-6 text-center text-xs text-[#777587]">No rows match.</p>}
        </div>
        <p className="p-3 text-[10px] text-[#777587] border-t border-[#f0f7fb]">
          Legend: {VERB_ORDER.map(v => `${v} ${VERB_LABEL[v]}`).join(' · ')}. Roles not listed for a feature have no access to it.
        </p>
      </div>
    </div>
  );
};
