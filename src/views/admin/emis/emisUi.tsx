import React from 'react';
import { Badge, Tone } from '../../../components/common/ui';
import { ChangeKind, PortalState, CHANGE_LABEL, PORTAL_LABEL } from '../../../data/emis';

export const PORTAL_TONE: Record<PortalState, Tone> = {
  linked: 'green',
  mismatch: 'red',
  class: 'amber',
  'not-uploaded': 'blue',
  missing: 'grey',
  fix: 'red',
  release: 'amber',
  released: 'grey',
};

export const PortalBadge: React.FC<{ state: PortalState }> = ({ state }) => (
  <Badge tone={PORTAL_TONE[state]}>
    <span data-portal-state={state}>{PORTAL_LABEL[state]}</span>
  </Badge>
);

const KIND_TONE: Record<ChangeKind, Tone> = { add: 'blue', class: 'amber', release: 'violet', correct: 'gold' };

export const ChangeBadge: React.FC<{ kind: ChangeKind }> = ({ kind }) => <Badge tone={KIND_TONE[kind]}>{CHANGE_LABEL[kind]}</Badge>;

export const fmtDate = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const fmtStamp = (stamp: string) => {
  const [h, m] = stamp.slice(11, 16).split(':').map(Number);
  return `${fmtDate(stamp)}, ${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

export const tabBtn = (on: boolean) =>
  `flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 -mb-px whitespace-nowrap ${on ? 'border-brand text-brand' : 'border-transparent text-ink-muted hover:text-ink'}`;

export const th = 'px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-ink-soft';
export const td = 'px-3 py-2 align-top';
