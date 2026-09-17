import React, { useCallback, useEffect, useState } from 'react';

// Mobile-first building blocks shared by the parent and teacher apps.

export const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ');

export const fmtDate = (iso: string) => {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
};

export const fmtDay = (iso: string) => {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
};

export const inrWhole = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export const Icon: React.FC<{ name: string; className?: string; filled?: boolean }> = ({ name, className = '', filled }) => (
  <span className={cx('material-symbols-outlined leading-none', className)} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined} aria-hidden="true">
    {name}
  </span>
);

/** Phone-width frame on desktop, full screen on phones. `theme` switches the colour tokens (see index.css). */
export const AppFrame: React.FC<{ children: React.ReactNode; accent: string; theme?: 'light' | 'dark' | 'school' }> = ({ children, accent, theme = 'light' }) => (
  <div data-app-theme={theme} className="app-surface-transition min-h-[100dvh] bg-[var(--app-outer)] sm:py-6 flex justify-center" style={{ ['--accent' as string]: accent }}>
    <div className="app-surface-transition relative w-full sm:max-w-[420px] min-h-[100dvh] sm:min-h-0 sm:h-[860px] bg-[var(--app-bg)] sm:rounded-[28px] sm:shadow-2xl sm:border sm:border-slate-200 overflow-hidden flex flex-col">
      {children}
    </div>
  </div>
);

export const TopBar: React.FC<{ title: React.ReactNode; subtitle?: React.ReactNode; onBack?: () => void; right?: React.ReactNode }> = ({ title, subtitle, onBack, right }) => (
  <header className="app-surface-transition shrink-0 bg-[var(--bar)] border-b-2 border-[var(--bar-edge)] text-white px-4 pt-4 pb-3 flex items-center gap-3">
    {onBack && (
      <button onClick={onBack} className="-ml-1 p-1 rounded-full hover:bg-white/15" aria-label="Back">
        <Icon name="arrow_back" className="text-[22px]" />
      </button>
    )}
    <div className="flex-1 min-w-0">
      <h1 className="text-[17px] font-semibold leading-tight truncate">{title}</h1>
      {subtitle && <p className="text-[12px] text-white/80 truncate">{subtitle}</p>}
    </div>
    {right}
  </header>
);

export interface TabDef<T extends string> {
  id: T;
  label: string;
  icon: string;
  badge?: number;
}

export const BottomNav = <T extends string>({ tabs, active, onChange }: { tabs: TabDef<T>[]; active: T; onChange: (t: T) => void }) => (
  <nav className="shrink-0 bg-[var(--surface)] border-t border-slate-200 flex pb-[env(safe-area-inset-bottom)]" aria-label="App">
    {tabs.map(t => {
      const on = t.id === active;
      return (
        <button key={t.id} onClick={() => onChange(t.id)} aria-current={on ? 'page' : undefined} data-tab={t.id} className="flex-1 flex flex-col items-center gap-0.5 py-2 relative">
          <span className={cx('px-4 py-0.5 rounded-full transition-colors', on ? 'bg-[var(--accent)]/15 text-[var(--accent-ink)]' : 'text-slate-500')}>
            <Icon name={t.icon} filled={on} className="text-[22px]" />
          </span>
          <span className={cx('text-[11px]', on ? 'font-semibold text-[var(--accent-ink)]' : 'text-slate-500')}>{t.label}</span>
          {Boolean(t.badge) && <span className="absolute top-1 left-1/2 ml-3 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold leading-4 text-center">{t.badge}</span>}
        </button>
      );
    })}
  </nav>
);

export const Screen: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <main className={cx('flex-1 overflow-y-auto px-4 py-4 space-y-4', className)}>{children}</main>
);

export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void; title?: React.ReactNode; action?: React.ReactNode }> = ({ children, className, onClick, title, action }) => {
  const Tag = onClick ? 'button' : 'section';
  return (
    <Tag onClick={onClick} className={cx('block w-full text-left bg-[var(--surface)] rounded-2xl border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)]', onClick && 'active:scale-[0.99] transition-transform', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-4 pt-3">
          <h2 className="text-[13px] font-semibold text-slate-800">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-4 pt-2">{children}</div>
    </Tag>
  );
};

export const Pill: React.FC<{ tone?: 'green' | 'red' | 'amber' | 'blue' | 'grey'; children: React.ReactNode }> = ({ tone = 'grey', children }) => {
  const tones = {
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-rose-50 text-rose-700',
    amber: 'bg-amber-50 text-amber-800',
    blue: 'bg-sky-50 text-sky-700',
    grey: 'bg-slate-100 text-slate-600',
  };
  return <span className={cx('inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap', tones[tone])}>{children}</span>;
};

export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => (
  <button {...props} className={cx('w-full rounded-xl bg-[var(--accent)] text-white text-[14px] font-semibold py-3 disabled:opacity-40 active:opacity-90', className)} />
);

export const SecondaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => (
  <button {...props} className={cx('rounded-xl bg-slate-100 text-slate-800 text-[13px] font-semibold px-3 py-2 disabled:opacity-40', className)} />
);

export const Field: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({ label, children, hint }) => (
  <label className="block space-y-1">
    <span className="text-[12px] font-medium text-slate-600">{label}</span>
    {children}
    {hint && <span className="block text-[11px] text-slate-500">{hint}</span>}
  </label>
);

export const inputClass = 'w-full rounded-xl border border-slate-300 bg-[var(--surface)] px-3 py-2.5 text-[14px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20';

/** Bottom sheet for forms and details. */
export const Sheet: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close" />
      <div className="relative bg-[var(--surface)] rounded-t-3xl max-h-[88%] overflow-y-auto p-4 pb-6 space-y-3">
        <div className="mx-auto w-10 h-1 rounded-full bg-slate-300" />
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100" aria-label="Close sheet">
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export interface ToastItem {
  id: number;
  text: string;
  tone: 'ok' | 'warn' | 'error';
}

export const useToasts = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const push = useCallback((text: string, tone: ToastItem['tone'] = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);
  return { toasts, push };
};

export const Toasts: React.FC<{ toasts: ToastItem[] }> = ({ toasts }) => (
  <div className="absolute left-3 right-3 top-20 z-50 space-y-2 pointer-events-none" aria-live="polite">
    {toasts.map(t => (
      <div
        key={t.id}
        className={cx('rounded-xl px-3 py-2.5 text-[13px] shadow-lg text-white', t.tone === 'ok' ? 'bg-[#0f172a] ring-1 ring-white/10' : t.tone === 'warn' ? 'bg-amber-600' : 'bg-rose-700')}
      >
        {t.text}
      </div>
    ))}
  </div>
);

export const FeatureFooter: React.FC<{ ids: string[] }> = ({ ids }) => <p className="pt-2 text-center text-[10px] text-slate-400">{ids.join(' · ')}</p>;

/** A feature that is planned for a later release (the coverage scanner reads the ids as deferred). */
export const PhaseNotice: React.FC<{ ids: string[]; phase: string; note: string }> = ({ ids, phase, note }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-[var(--surface)]/60 p-3 text-[12px] text-slate-600">
    <p className="flex items-center gap-1.5 font-semibold text-slate-700">
      <Icon name="schedule" className="text-[16px]" />
      Coming in {phase}
    </p>
    <p className="mt-1">{note}</p>
    <p className="mt-1 text-[10px] text-slate-400">{ids.join(' · ')}</p>
  </div>
);

export const EmptyState: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <div className="py-8 flex flex-col items-center gap-2 text-slate-500">
    <Icon name={icon} className="text-[32px]" />
    <p className="text-[13px]">{text}</p>
  </div>
);

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => <div className={cx('rounded-xl bg-slate-100 animate-pulse', className)} aria-hidden="true" />;

export const LoadingCard: React.FC<{ label: string; lines?: number }> = ({ label, lines = 3 }) => (
  <div className="rounded-2xl border border-slate-200 bg-[var(--surface)] p-4 space-y-2" role="status" aria-label={label}>
    <Skeleton className="h-4 w-1/3" />
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton key={i} className={cx('h-3', i % 2 ? 'w-2/3' : 'w-full')} />
    ))}
  </div>
);

export const ErrorCard: React.FC<{ onRetry: () => void; text?: string }> = ({ onRetry, text = 'Something went wrong. Please try again.' }) => (
  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center space-y-2" role="alert">
    <Icon name="error" className="text-[28px] text-rose-600" />
    <p className="text-[13px] text-rose-700">{text}</p>
    <SecondaryButton onClick={onRetry}>Try again</SecondaryButton>
  </div>
);

export type AsyncState<T> = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: T };

/** Loads data from a (mock) service and re-loads when `deps` change. */
export const useAsync = <T,>(load: () => Promise<T>, deps: React.DependencyList): AsyncState<T> & { retry: () => void } => {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setState({ status: 'loading' });
    load().then(
      data => live && setState({ status: 'ready', data }),
      () => live && setState({ status: 'error' })
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);
  return { ...state, retry: () => setAttempt(a => a + 1) };
};
