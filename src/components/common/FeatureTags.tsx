import React from 'react';
import { RAW_FEATURES_SPEC } from '../../data/featureCatalog';

const FEATURE_INDEX = new Map(RAW_FEATURES_SPEC.map(f => [f.code, f]));

/** Renders catalogue feature IDs as chips; name, phase and priority come from LMN-SMS-FEAT-001. */
export const FeatureTags: React.FC<{ ids: string[]; className?: string }> = ({ ids, className = '' }) => (
  <div className={`flex flex-wrap gap-1 ${className}`}>
    {ids.map(id => {
      const feat = FEATURE_INDEX.get(id);
      return (
        <span
          key={id}
          title={feat ? `${feat.name} · ${feat.phase} · ${feat.priority}${feat.desc ? ` — ${feat.desc}` : ''}` : 'Not in catalogue'}
          className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-md border transition-colors ${
            feat ? 'bg-cream-100 text-ink-muted border-line-soft hover:text-brand hover:border-lumen-300' : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {id}
        </span>
      );
    })}
  </div>
);

/** Deferred-phase banner for catalogue features that are intentionally not active in this release. */
export const PhaseNotice: React.FC<{ ids: string[]; phase: string; note: string }> = ({ ids, phase, note }) => (
  <div className="flex items-start gap-2 p-3 rounded-xl border border-dashed border-line bg-slate-50 text-[11px] text-ink-soft">
    <span className="material-symbols-outlined text-base text-ink-muted">schedule</span>
    <div className="space-y-1">
      <p>
        <span className="font-bold text-ink">{phase} — </span>
        {note}
      </p>
      <FeatureTags ids={ids} />
    </div>
  </div>
);

export const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  // The UTF-8 marker makes Excel read ₹ and Tamil correctly instead of showing garbled characters.
  const csv = '﻿' + [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};
