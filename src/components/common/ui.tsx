import React, { useEffect, useId, useRef } from 'react';
import { Density, useApp } from '../../context/AppContext';

export { Figure, Money } from './Figure';
export { EmptyNote } from './EmptyNote';

// Admin console building blocks, drawn from the Lumen tokens in index.css (teal, gold, cream).

export const inputCls =
  'text-xs border border-line rounded-lg px-2.5 py-1.5 bg-surface text-ink shadow-xs placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:outline-none focus:border-lumen-500 focus:ring-2 focus:ring-lumen-500/20 disabled:bg-slate-50 disabled:text-slate-400';
const btn =
  'inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-[background-color,border-color,box-shadow,color] duration-150';
/** Primary action: brand teal with a soft top highlight. */
export const btnPrimary = `${btn} bg-brand text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(7_32_47/0.24)] hover:bg-brand-strong active:bg-lumen-900`;
/** Secondary action on a surface. */
export const btnSoft = `${btn} bg-surface text-ink border border-line shadow-xs hover:bg-subtle hover:border-slate-300`;
export const btnDanger = `${btn} bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200`;
export const btnGhost = `${btn} text-brand hover:bg-lumen-50`;
/** Celebratory or highest-emphasis action, used sparingly: gold on navy ink. */
export const btnGold = `${btn} bg-gold-400 text-lumen-950 shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_1px_2px_rgb(118_77_24/0.25)] hover:bg-gold-300`;

export type Tone = 'green' | 'amber' | 'red' | 'blue' | 'grey' | 'violet' | 'gold';

const TONES: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  red: 'bg-rose-50 text-rose-700 border-rose-200',
  blue: 'bg-lumen-50 text-lumen-700 border-lumen-200',
  grey: 'bg-slate-100 text-slate-600 border-slate-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  gold: 'bg-gold-50 text-gold-800 border-gold-300',
};

export const Badge: React.FC<{ tone?: Tone; children: React.ReactNode; className?: string }> = ({ tone = 'grey', children, className = '' }) => (
  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full border whitespace-nowrap ${TONES[tone]} ${className}`}>{children}</span>
);

export const Icon: React.FC<{ name: string; className?: string }> = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined ${className}`} aria-hidden="true">
    {name}
  </span>
);

export const Panel: React.FC<{ title: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string; id?: string }> = ({ title, actions, children, className = '', id }) => (
  <section id={id} className={`bg-surface rounded-2xl border border-line-soft shadow-sm overflow-hidden ${className}`}>
    <div className="px-4 py-3 bg-gradient-to-b from-cream-50 to-subtle/70 border-b border-line-soft flex flex-wrap items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
        <span className="w-1 h-3.5 rounded-full bg-accent" aria-hidden="true" />
        {title}
      </h2>
      {actions}
    </div>
    {children}
  </section>
);

export const PageHeader: React.FC<{ eyebrow: string; icon: string; title: string; subtitle: string; actions?: React.ReactNode; children?: React.ReactNode }> = ({ eyebrow, icon, title, subtitle, actions, children }) => (
  <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 pb-1">
    <div className="min-w-0">
      <div className="flex items-center gap-2 text-[11px] font-semibold text-accent-ink uppercase tracking-[0.14em] mb-1.5">
        <Icon name={icon} className="text-sm text-accent" />
        <span>{eyebrow}</span>
      </div>
      <h1 className="text-2xl md:text-[28px] leading-tight font-bold font-display tracking-tight text-ink">{title}</h1>
      <p className="text-[13px] text-ink-soft mt-1.5 max-w-3xl">{subtitle}</p>
      {children}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

export const StatCard: React.FC<{ label: string; value: React.ReactNode; icon: string; hint?: string; tone?: 'blue' | 'amber' | 'green' | 'grey'; onClick?: () => void }> = ({ label, value, icon, hint, tone = 'blue', onClick }) => {
  const iconTone = {
    blue: 'bg-gradient-to-br from-lumen-50 to-lumen-100 text-brand ring-lumen-200/70',
    amber: 'bg-gradient-to-br from-gold-50 to-gold-100 text-gold-700 ring-gold-200/70',
    green: 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 ring-emerald-200/70',
    grey: 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-600 ring-slate-200/70',
  }[tone];
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`text-left bg-surface rounded-2xl border border-line-soft p-4 shadow-sm flex items-start gap-3 ${onClick ? 'transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-px hover:shadow-md hover:border-lumen-300' : ''}`}
    >
      <span className={`w-10 h-10 rounded-xl ring-1 ring-inset flex items-center justify-center shrink-0 ${iconTone}`}>
        <Icon name={icon} className="text-lg" />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold text-ink-soft">{label}</span>
        <span className="block text-[26px] font-bold font-display tracking-tight tabular-nums text-ink leading-tight">{value}</span>
        {hint && <span className="block text-[10px] text-ink-muted">{hint}</span>}
      </span>
    </Tag>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => <div className={`skeleton ${className}`} aria-hidden="true" />;

export const LoadingRows: React.FC<{ rows?: number; label?: string }> = ({ rows = 4, label = 'Loading' }) => (
  <div className="p-4 space-y-2" role="status" aria-label={label}>
    {Array.from({ length: rows }, (_, i) => (
      <Skeleton key={i} className="h-8 w-full" />
    ))}
  </div>
);

export const EmptyState: React.FC<{ icon?: string; title?: string; text?: string; action?: React.ReactNode }> = ({ icon = 'inbox', title = 'No data available.', text, action }) => (
  <div className="p-8 flex flex-col items-center text-center gap-2 text-ink-soft">
    <span className="w-14 h-14 mb-1 rounded-2xl bg-gradient-to-br from-cream-100 to-cream-300/60 ring-1 ring-inset ring-line flex items-center justify-center">
      <Icon name={icon} className="text-[28px] text-lumen-500" />
    </span>
    <p className="text-sm font-semibold text-ink">{title}</p>
    {text && <p className="text-xs max-w-sm">{text}</p>}
    {action}
  </div>
);

export const ErrorState: React.FC<{ message?: string; onRetry: () => void }> = ({ message = 'Something went wrong. Please try again.', onRetry }) => (
  <div className="p-8 flex flex-col items-center text-center gap-2" role="alert">
    <Icon name="error" className="text-4xl text-rose-500" />
    <p className="text-sm font-semibold text-ink">{message}</p>
    <button onClick={onRetry} className={btnSoft}>
      <Icon name="refresh" className="text-sm" />
      Try again
    </button>
  </div>
);

/** Accessible modal: labelled, closes on Escape and backdrop click, focuses the first control. */
export const Modal: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }> = ({ open, onClose, title, children, footer, wide }) => {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('input, select, textarea, button:not([data-close])')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lumen-950/55 backdrop-blur-[2px] fade-in" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className={`bg-surface rounded-2xl shadow-2xl ring-1 ring-lumen-950/10 w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] flex flex-col zoom-in`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-line-soft">
          <h2 id={id} className="text-[15px] font-semibold font-display tracking-tight text-ink">
            {title}
          </h2>
          <button data-close onClick={onClose} className="p-1 rounded-lg text-ink-muted hover:bg-slate-100" aria-label="Close dialog">
            <Icon name="close" className="text-lg" />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto text-xs text-ink space-y-3">{children}</div>
        {footer && <div className="px-5 py-3 bg-wash border-t border-line-soft rounded-b-2xl flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};

export const ConfirmDialog: React.FC<{
  open: boolean;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}> = ({ open, title, body, confirmLabel, danger, busy, onConfirm, onCancel, children }) => (
  <Modal
    open={open}
    onClose={onCancel}
    title={title}
    footer={
      <>
        <button onClick={onCancel} className={btnSoft}>
          Cancel
        </button>
        <button onClick={onConfirm} disabled={busy} className={danger ? `${btnDanger} !bg-rose-600 !text-white hover:!bg-rose-700` : btnPrimary}>
          {busy ? 'Working…' : confirmLabel}
        </button>
      </>
    }
  >
    <div className="text-xs text-ink-soft">{body}</div>
    {children}
  </Modal>
);

export const Field: React.FC<{ label: string; children: React.ReactNode; hint?: string; error?: string; className?: string }> = ({ label, children, hint, error, className = '' }) => (
  <label className={`block space-y-1 ${className}`}>
    <span className="text-[11px] font-semibold text-ink-soft">{label}</span>
    {children}
    {error ? <span className="block text-[10px] text-rose-700">{error}</span> : hint ? <span className="block text-[10px] text-ink-muted">{hint}</span> : null}
  </label>
);

export interface StepDef {
  id: string;
  label: string;
  done?: boolean;
  disabled?: boolean;
}

/** Horizontal, scrollable step indicator; completed steps can be revisited. */
export const Stepper: React.FC<{ steps: StepDef[]; current: string; onSelect: (id: string) => void }> = ({ steps, current, onSelect }) => (
  <nav aria-label="Steps" className="overflow-x-auto">
    <ol className="flex items-center gap-1 min-w-max">
      {steps.map((s, i) => {
        const active = s.id === current;
        return (
          <li key={s.id} className="flex items-center gap-1">
            <button
              onClick={() => onSelect(s.id)}
              disabled={s.disabled}
              aria-current={active ? 'step' : undefined}
              className={`flex items-center gap-2 rounded-full pl-1 pr-3 py-1 text-xs font-semibold transition-colors disabled:opacity-40 ${
                active ? 'bg-brand text-white shadow-sm' : s.done ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100' : 'bg-surface border border-line text-ink-soft hover:bg-subtle'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] tabular-nums ${active ? 'bg-gold-400 text-lumen-950' : s.done ? 'bg-emerald-600 text-white' : 'bg-subtle'}`}>
                {s.done && !active ? <Icon name="check" className="text-sm" /> : i + 1}
              </span>
              {s.label}
            </button>
            {i < steps.length - 1 && <span className="w-4 h-px bg-line" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  </nav>
);

/** Comfortable / compact table density. The choice is the signed-in user's and applies to every data table. */
export const DensityToggle: React.FC = () => {
  const { density, setDensity } = useApp();
  const options: { id: Density; label: string; icon: string }[] = [
    { id: 'comfortable', label: 'Comfortable', icon: 'density_medium' },
    { id: 'compact', label: 'Compact', icon: 'density_small' },
  ];
  return (
    <div role="group" aria-label="Table density" className="inline-flex rounded-lg border border-line bg-surface p-0.5 shadow-xs">
      {options.map(o => (
        <button
          key={o.id}
          type="button"
          onClick={() => setDensity(o.id)}
          aria-pressed={density === o.id}
          title={`${o.label} rows`}
          data-density-option={o.id}
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
            density === o.id ? 'bg-lumen-50 text-lumen-800 ring-1 ring-inset ring-lumen-200' : 'text-ink-muted hover:text-ink'
          }`}
        >
          <Icon name={o.icon} className="text-sm" />
          {o.label}
        </button>
      ))}
    </div>
  );
};

/** Simple async loader state for mock services. */
export type Loadable<T> = { state: 'loading' } | { state: 'error'; message: string } | { state: 'ready'; data: T };
