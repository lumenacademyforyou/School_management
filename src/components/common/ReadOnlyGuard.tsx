import React, { useCallback, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';

// Wraps a screen the signed-in role may read but not change (no C, U or D on its features).
// Reading, filtering, switching tabs, printing and exporting keep working; actions that change records are blocked.
//
// This is a UI affordance, not an authorisation boundary: it matches on button labels in the DOM, so a
// control worded in a way the matcher does not recognise still reaches its handler. Screens can settle any
// ambiguity explicitly with data-readonly-allow (never block) or data-readonly-block (always block).
// When the API lands, every one of these actions must also be refused server-side for the role.

const CHANGE =
  /^(activate|add|adjust|admit|allocate|allot|amend|apply|approve|archive|assign|block|book|bulk|cancel|change|clone|close|collect|confirm|convert|create|credit|deactivate|debit|decline|delete|deposit|disable|disburse|discard|dismiss|drop|duplicate|edit|enable|enrol|enroll|escalate|exempt|expire|extend|finalise|finalize|flag|freeze|generate|grant|hold|import|invite|issue|link|lock|log|mark|merge|migrate|modify|move|new|override|pause|pay|post|process|promote|publish|purge|raise|reassign|recalculate|reconcile|record|redeem|refund|regenerate|register|reinstate|reissue|reject|release|remove|rename|renew|reopen|replace|request|reschedule|reset|resolve|restore|restrict|resume|retry|return|revert|revoke|roll|rollback|run|save|schedule|send|set|settle|split|start|submit|surrender|suspend|swap|sync|terminate|transfer|trigger|unassign|unblock|unlink|unlock|unpublish|update|upload|verify|void|waive|withdraw|write)\b/i;

/** Decisions an approver may still take on a screen they cannot otherwise change. Matched anywhere, so
 *  "Bulk approve" and "Review and reject" count as decisions rather than as generic changes. */
const DECIDE = /\b(approve|reject|return|send back)\b/i;

/** A lone dismissal word is navigation ("Cancel" in a dialog); the same word with an object is an action
 *  ("Cancel admission", "Close ticket"), so only the bare form is let through. */
const DISMISS = /^(cancel|close|dismiss|back|go back|done|ok|okay|not now|never mind|nevermind)$/i;

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

const isBlocked = (el: HTMLElement, canApprove: boolean) => {
  if (el.hasAttribute('data-readonly-allow')) return false;
  if (el.hasAttribute('data-readonly-block')) return true;
  // Tabs, disclosures and the shared dialog close button move around a screen rather than change records.
  if (el.getAttribute('role') === 'tab') return false;
  if (el.hasAttribute('data-close')) return false;
  const label = labelOf(el);
  if (DISMISS.test(label)) return false;
  return CHANGE.test(label) && !(canApprove && DECIDE.test(label));
};

export const ReadOnlyGuard: React.FC<{ children: React.ReactNode; canApprove: boolean; note: string }> = ({ children, canApprove, note }) => {
  const { addToast } = useApp();
  const ref = useRef<HTMLDivElement>(null);

  const blocked = useCallback((el: HTMLElement) => isBlocked(el, canApprove), [canApprove]);

  // Show blocked actions as unavailable.
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const mark = () =>
      root.querySelectorAll<HTMLElement>('button').forEach(b => {
        if (blocked(b)) b.dataset.readonlyBlocked = '';
        else delete b.dataset.readonlyBlocked;
      });
    mark();
    const obs = new MutationObserver(mark);
    obs.observe(root, { childList: true, subtree: true, characterData: true });
    return () => obs.disconnect();
  }, [blocked]);

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
