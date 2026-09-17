import React, { useEffect, useId, useRef } from 'react';

// Admin console building blocks. Styles match the existing desks (brand navy #082b3d, blue #0e5d84).

export const inputCls = 'text-xs border border-[#cbe0ec] rounded-lg px-2 py-1.5 bg-white text-[#082b3d] disabled:bg-slate-50 disabled:text-slate-400';
const btn = 'inline-flex items-center justify-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors';
export const btnPrimary = `${btn} bg-[#0e5d84] text-white hover:bg-[#083a4f]`;
export const btnSoft = `${btn} bg-slate-100 hover:bg-slate-200 text-[#082b3d]`;
export const btnDanger = `${btn} bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200`;
export const btnGhost = `${btn} text-[#0e5d84] hover:bg-[#f0f7fb]`;

export type Tone = 'green' | 'amber' | 'red' | 'blue' | 'grey' | 'violet' | 'gold';

const TONES: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  red: 'bg-rose-50 text-rose-700 border-rose-200',
  blue: 'bg-sky-50 text-sky-700 border-sky-200',
  grey: 'bg-slate-100 text-slate-600 border-slate-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  gold: 'bg-amber-100 text-amber-900 border-amber-300',
};

export const Badge: React.FC<{ tone?: Tone; children: React.ReactNode; className?: string }> = ({ tone = 'grey', children, className = '' }) => (
  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${TONES[tone]} ${className}`}>{children}</span>
);

export const Icon: React.FC<{ name: string; className?: string }> = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined ${className}`} aria-hidden="true">
    {name}
  </span>
);

export const Panel: React.FC<{ title: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string; id?: string }> = ({ title, actions, children, className = '', id }) => (
  <section id={id} className={`bg-white rounded-2xl border border-[#e0ecf4] shadow-xs overflow-hidden ${className}`}>
    <div className="p-3 bg-[#f0f7fb] border-b border-[#cbe0ec] flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-xs font-bold text-[#082b3d]">{title}</h2>
      {actions}
    </div>
    {children}
  </section>
);

export const PageHeader: React.FC<{ eyebrow: string; icon: string; title: string; subtitle: string; actions?: React.ReactNode; children?: React.ReactNode }> = ({ eyebrow, icon, title, subtitle, actions, children }) => (
  <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
    <div className="min-w-0">
      <div className="flex items-center gap-2 text-xs font-semibold text-[#0e5d84] uppercase tracking-wider mb-1">
        <Icon name={icon} className="text-sm" />
        <span>{eyebrow}</span>
      </div>
      <h1 className="text-xl md:text-2xl font-bold font-display text-[#082b3d]">{title}</h1>
      <p className="text-xs text-[#464555] mt-1">{subtitle}</p>
      {children}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

export const StatCard: React.FC<{ label: string; value: React.ReactNode; icon: string; hint?: string; tone?: 'blue' | 'amber' | 'green' | 'grey'; onClick?: () => void }> = ({ label, value, icon, hint, tone = 'blue', onClick }) => {
  const iconTone = { blue: 'bg-[#e0f2fe] text-[#0e5d84]', amber: 'bg-amber-50 text-amber-700', green: 'bg-emerald-50 text-emerald-700', grey: 'bg-slate-100 text-slate-600' }[tone];
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag onClick={onClick} className={`text-left bg-white rounded-2xl border border-[#e0ecf4] p-4 shadow-xs flex items-start gap-3 ${onClick ? 'hover:border-[#0e5d84] transition-colors' : ''}`}>
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconTone}`}>
        <Icon name={icon} className="text-lg" />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold text-[#464555]">{label}</span>
        <span className="block text-2xl font-bold text-[#082b3d] leading-tight">{value}</span>
        {hint && <span className="block text-[10px] text-[#777587]">{hint}</span>}
      </span>
    </Tag>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => <div className={`rounded-lg bg-slate-100 animate-pulse ${className}`} aria-hidden="true" />;

export const LoadingRows: React.FC<{ rows?: number; label?: string }> = ({ rows = 4, label = 'Loading' }) => (
  <div className="p-4 space-y-2" role="status" aria-label={label}>
    {Array.from({ length: rows }, (_, i) => (
      <Skeleton key={i} className="h-8 w-full" />
    ))}
  </div>
);

export const EmptyState: React.FC<{ icon?: string; title?: string; text?: string; action?: React.ReactNode }> = ({ icon = 'inbox', title = 'No data available.', text, action }) => (
  <div className="p-8 flex flex-col items-center text-center gap-2 text-[#464555]">
    <Icon name={icon} className="text-4xl text-[#94a3b8]" />
    <p className="text-sm font-semibold text-[#082b3d]">{title}</p>
    {text && <p className="text-xs max-w-sm">{text}</p>}
    {action}
  </div>
);

export const ErrorState: React.FC<{ message?: string; onRetry: () => void }> = ({ message = 'Something went wrong. Please try again.', onRetry }) => (
  <div className="p-8 flex flex-col items-center text-center gap-2" role="alert">
    <Icon name="error" className="text-4xl text-rose-500" />
    <p className="text-sm font-semibold text-[#082b3d]">{message}</p>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 fade-in" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className={`bg-white rounded-2xl shadow-2xl border border-[#cbe0ec] w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] flex flex-col zoom-in`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 p-4 border-b border-[#e0ecf4]">
          <h2 id={id} className="text-sm font-bold text-[#082b3d]">
            {title}
          </h2>
          <button data-close onClick={onClose} className="p-1 rounded-lg text-[#777587] hover:bg-slate-100" aria-label="Close dialog">
            <Icon name="close" className="text-lg" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto text-xs text-[#082b3d] space-y-3">{children}</div>
        {footer && <div className="p-3 border-t border-[#e0ecf4] flex flex-wrap justify-end gap-2">{footer}</div>}
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
    <div className="text-xs text-[#464555]">{body}</div>
    {children}
  </Modal>
);

export const Field: React.FC<{ label: string; children: React.ReactNode; hint?: string; error?: string; className?: string }> = ({ label, children, hint, error, className = '' }) => (
  <label className={`block space-y-1 ${className}`}>
    <span className="text-[11px] font-semibold text-[#464555]">{label}</span>
    {children}
    {error ? <span className="block text-[10px] text-rose-700">{error}</span> : hint ? <span className="block text-[10px] text-[#777587]">{hint}</span> : null}
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
                active ? 'bg-[#0e5d84] text-white' : s.done ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100' : 'bg-slate-100 text-[#464555] hover:bg-slate-200'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${active ? 'bg-white/20' : s.done ? 'bg-emerald-600 text-white' : 'bg-white'}`}>
                {s.done && !active ? <Icon name="check" className="text-sm" /> : i + 1}
              </span>
              {s.label}
            </button>
            {i < steps.length - 1 && <span className="w-4 h-px bg-[#cbe0ec]" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  </nav>
);

/** Simple async loader state for mock services. */
export type Loadable<T> = { state: 'loading' } | { state: 'error'; message: string } | { state: 'ready'; data: T };
