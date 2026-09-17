import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';

// Wraps a screen the signed-in role may read but not change (no C, U or D on its features).
// Reading, filtering, switching tabs, printing and exporting keep working; actions that change records are blocked.

const CHANGE = /^(add|admit|allocate|apply|approve|archive|assign|book|bulk|collect|confirm|create|delete|deposit|edit|enrol|enroll|escalate|generate|grant|import|invite|issue|lock|log|mark|merge|move|new|pay|post|promote|publish|raise|record|register|reissue|reject|release|remove|reopen|request|reset|resolve|restore|retry|return|revoke|roll|run|save|schedule|send|set|start|submit|sync|transfer|trigger|unlock|update|upload|verify|withdraw)\b/i;
const DECIDE = /^(approve|reject|return|send back)\b/i;

const labelOf = (el: HTMLElement) => {
  const aria = el.getAttribute('aria-label');
  if (aria) return aria.trim();
  let text = '';
  el.childNodes.forEach(n => {
    if (n instanceof HTMLElement && n.classList.contains('material-symbols-outlined')) return;
    text += n.textContent ?? '';
  });
  return text.replace(/\s+/g, ' ').trim();
};

export const ReadOnlyGuard: React.FC<{ children: React.ReactNode; canApprove: boolean; note: string }> = ({ children, canApprove, note }) => {
  const { addToast } = useApp();
  const ref = useRef<HTMLDivElement>(null);

  const blocked = (el: HTMLElement) => {
    if (el.getAttribute('role') === 'tab') return false;
    const label = labelOf(el);
    return CHANGE.test(label) && !(canApprove && DECIDE.test(label));
  };

  // Show blocked actions as unavailable.
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const mark = () =>
      root.querySelectorAll<HTMLElement>('button').forEach(b => {
        const isBlocked = blocked(b);
        if (isBlocked) b.dataset.readonlyBlocked = '';
        else delete b.dataset.readonlyBlocked;
      });
    mark();
    const obs = new MutationObserver(mark);
    obs.observe(root, { childList: true, subtree: true, characterData: true });
    return () => obs.disconnect();
  });

  const stop = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToast('Read-only access', 'warning', note);
  };

  return (
    <div
      ref={ref}
      data-readonly=""
      onClickCapture={e => {
        const el = (e.target as HTMLElement).closest('button');
        if (el && ref.current?.contains(el) && blocked(el)) stop(e);
      }}
      onSubmitCapture={stop}
    >
      <div className="mx-4 md:mx-6 mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900" role="status">
        <span className="material-symbols-outlined text-base">visibility</span>
        <span>
          <span className="font-semibold">Read-only for your role.</span> {note}
        </span>
      </div>
      {children}
    </div>
  );
};
