import React, { useCallback, useEffect, useState } from 'react';
import { ExportData, ExportFormat, exportData } from '../../src/lib/exporters';

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

export const LOGO_SRC = '/lumen-academy-logo.png';

/**
 * Full-window web app frame: a phone layout on small screens and a sidebar layout from 1024px (see AppShell).
 * `theme` switches the colour tokens (see index.css).
 */
export const AppFrame: React.FC<{ children: React.ReactNode; accent: string; theme?: 'light' | 'dark' | 'school' }> = ({ children, accent, theme = 'light' }) => (
  <div data-app-theme={theme} className="app-surface-transition relative h-[100dvh] w-full bg-[var(--app-bg)] overflow-hidden flex flex-col" style={{ ['--accent' as string]: accent }}>
    {children}
  </div>
);

/** Signed-in layout: sidebar on desktop, bottom tabs on phones and tablets. */
export const AppShell: React.FC<{ side: React.ReactNode; bottom?: React.ReactNode; children: React.ReactNode }> = ({ side, bottom, children }) => (
  <div className="flex-1 min-h-0 flex">
    {side}
    <div className="relative flex-1 min-w-0 min-h-0 flex flex-col">
      {children}
      {bottom}
    </div>
  </div>
);

export const TopBar: React.FC<{ title: React.ReactNode; subtitle?: React.ReactNode; onBack?: () => void; right?: React.ReactNode }> = ({ title, subtitle, onBack, right }) => (
  <header className="app-surface-transition shrink-0 bg-[var(--bar)] bg-[image:var(--bar-image)] border-b-2 border-[var(--bar-edge)] text-white px-4 lg:px-8 pt-4 pb-3 flex items-center gap-3 shadow-[0_2px_12px_-4px_rgb(7_32_47/0.35)]">
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

export const BottomNav = <T extends string>({ tabs, active, onChange, className }: { tabs: TabDef<T>[]; active: T; onChange: (t: T) => void; className?: string }) => (
  <nav className={cx('shrink-0 bg-[var(--surface)] border-t border-slate-200 flex pb-[env(safe-area-inset-bottom)] lg:hidden', className)} aria-label="App">
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

/** Desktop navigation (1024px and wider). Phones use BottomNav with the same tabs. */
export const SideNav = <T extends string>({
  tabs,
  active,
  onChange,
  title,
  subtitle,
  children,
  footer,
}: {
  tabs: TabDef<T>[];
  active: T | null;
  onChange: (t: T) => void;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) => (
  <aside className="app-surface-transition hidden lg:flex w-64 shrink-0 flex-col bg-[var(--surface)] border-r border-slate-200" aria-label="Sidebar">
    <div className="app-surface-transition flex items-center gap-3 px-5 py-4 bg-[var(--bar)] bg-[image:var(--bar-image)] border-b-2 border-[var(--bar-edge)] text-white">
      <img src={LOGO_SRC} alt="" className="w-10 h-10 rounded-xl bg-cream-50 p-0.5 ring-1 ring-gold-300/60" />
      <div className="min-w-0">
        <p className="text-[15px] font-bold leading-tight truncate">{title}</p>
        <p className="text-[12px] text-white/80 truncate">{subtitle}</p>
      </div>
    </div>
    <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Sections">
      {tabs.map(t => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            aria-current={on ? 'page' : undefined}
            data-side-tab={t.id}
            className={cx('relative w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors', on ? 'bg-[var(--accent)]/12 text-[var(--accent-ink)] font-semibold' : 'text-slate-700 hover:bg-slate-100')}
          >
            {on && <span aria-hidden="true" className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-gold-400" />}
            <Icon name={t.icon} filled={on} className="text-[22px]" />
            <span className="flex-1 text-left">{t.label}</span>
            {Boolean(t.badge) && <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-rose-600 text-white text-[11px] font-bold leading-5 text-center">{t.badge}</span>}
          </button>
        );
      })}
      {children}
    </nav>
    {footer && <div className="border-t border-slate-200 p-3 space-y-2">{footer}</div>}
  </aside>
);

/** A secondary sidebar link, for pages that are not tabs. */
export const SideLink: React.FC<{ id: string; icon: string; label: string; active?: boolean; onClick: () => void }> = ({ id, icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    data-side-page={id}
    className={cx('w-full flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition-colors', active ? 'bg-[var(--accent)]/15 text-[var(--accent-ink)] font-semibold' : 'text-slate-600 hover:bg-slate-100')}
  >
    <Icon name={icon} filled={active} className="text-[20px]" />
    <span className="flex-1 text-left">{label}</span>
  </button>
);

/** Scrolling page body. On desktop the content is centred; `wide` lays cards out in two columns (`lg:col-span-2` for full-width rows). */
export const Screen: React.FC<{ children: React.ReactNode; className?: string; wide?: boolean }> = ({ children, className, wide }) => (
  <main className="flex-1 overflow-y-auto">
    <div className={cx('mx-auto w-full px-4 py-4 space-y-4 lg:px-8 lg:py-6', wide ? 'max-w-6xl lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0 lg:items-start' : 'max-w-3xl', className)}>{children}</div>
  </main>
);

export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void; title?: React.ReactNode; action?: React.ReactNode }> = ({ children, className, onClick, title, action }) => {
  const Tag = onClick ? 'button' : 'section';
  return (
    <Tag
      onClick={onClick}
      className={cx(
        'block w-full text-left bg-[var(--surface)] rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgb(12_49_71/0.05),0_4px_12px_-6px_rgb(12_49_71/0.08)]',
        onClick && 'transition-[transform,box-shadow] duration-150 active:scale-[0.99] hover:shadow-[0_2px_4px_rgb(12_49_71/0.06),0_10px_20px_-8px_rgb(12_49_71/0.14)]',
        className
      )}
    >
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

export const Pill: React.FC<{ tone?: 'green' | 'red' | 'amber' | 'grey'; children: React.ReactNode }> = ({ tone = 'grey', children }) => {
  const tones = {
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-rose-50 text-rose-700',
    amber: 'bg-amber-50 text-amber-800',
    grey: 'bg-slate-100 text-slate-600',
  };
  return <span className={cx('inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap', tones[tone])}>{children}</span>;
};

export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => (
  <button
    {...props}
    className={cx('w-full rounded-xl bg-[var(--accent)] text-white text-[14px] font-semibold py-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_2px_6px_-2px_rgb(7_32_47/0.35)] disabled:opacity-40 active:opacity-90 transition-opacity', className)}
  />
);

export const SecondaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => (
  <button {...props} className={cx('rounded-xl bg-slate-100 text-slate-800 text-[13px] font-semibold px-3 py-2 ring-1 ring-inset ring-slate-200 hover:bg-slate-200/70 disabled:opacity-40 transition-colors', className)} />
);

export const Field: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({ label, children, hint }) => (
  <label className="block space-y-1">
    <span className="text-[12px] font-medium text-slate-600">{label}</span>
    {children}
    {hint && <span className="block text-[11px] text-slate-500">{hint}</span>}
  </label>
);

export const inputClass = 'w-full rounded-xl border border-slate-300 bg-[var(--surface)] px-3 py-2.5 text-[14px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20';

/** Bottom sheet for forms and details on phones; a centred dialog on desktop. Escape closes it. */
export const Sheet: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ open, onClose, title, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end lg:justify-center lg:items-center lg:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close" />
      <div className="relative bg-[var(--surface)] rounded-t-3xl max-h-[88%] overflow-y-auto p-4 pb-6 space-y-3 lg:w-full lg:max-w-lg lg:rounded-3xl lg:max-h-[85vh] lg:p-6 lg:shadow-2xl">
        <div className="mx-auto w-10 h-1 rounded-full bg-slate-300 lg:hidden" />
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
  <div className="fixed left-3 right-3 top-20 z-50 space-y-2 pointer-events-none lg:left-auto lg:right-6 lg:top-6 lg:w-96" aria-live="polite">
    {toasts.map(t => (
      <div
        key={t.id}
        className={cx('rounded-xl px-3 py-2.5 text-[13px] shadow-lg text-white', t.tone === 'ok' ? 'bg-lumen-900 ring-1 ring-gold-400/30' : t.tone === 'warn' ? 'bg-amber-600' : 'bg-rose-700')}
      >
        {t.text}
      </div>
    ))}
  </div>
);

export const FeatureFooter: React.FC<{ ids: string[] }> = ({ ids }) => <p className="pt-2 text-center text-[10px] text-slate-400 lg:col-span-2">{ids.join(' · ')}</p>;

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

/** Whole-screen or whole-card empty state: the same tile, title and next action as the console's. */
export const EmptyState: React.FC<{ icon: string; text: string; action?: React.ReactNode }> = ({ icon, text, action }) => (
  <div className="py-8 flex flex-col items-center gap-2 text-center text-slate-500">
    <span className="w-14 h-14 mb-1 rounded-2xl bg-slate-100 ring-1 ring-inset ring-slate-200 flex items-center justify-center">
      <Icon name={icon} className="text-[28px] text-[var(--accent-ink)]" />
    </span>
    <p className="text-[14px] font-semibold text-slate-800 max-w-xs">{text}</p>
    {action}
  </div>
);

export { EmptyNote } from '../../src/components/common/EmptyNote';

/** Download a list as Excel, CSV or print / PDF. Big targets for phones; the data is read when tapped. */
export const DownloadButton: React.FC<{ title: string; getData: () => ExportData; onDone?: (message: string) => void; className?: string }> = ({ title, getData, onDone, className }) => {
  const [open, setOpen] = useState(false);
  const run = (format: ExportFormat) => {
    const data = getData();
    exportData(data, format);
    setOpen(false);
    onDone?.(format === 'print' ? `Opening print for ${title}` : `${title} downloaded (${data.rows.length} rows)`);
  };
  return (
    <>
      <SecondaryButton onClick={() => setOpen(true)} className={cx('min-h-11 inline-flex items-center justify-center gap-1.5', className)} data-download={title}>
        <Icon name="download" className="text-[18px]" />
        Download
      </SecondaryButton>
      <Sheet open={open} onClose={() => setOpen(false)} title={`Download ${title}`}>
        {([
          ['xlsx', 'table_view', 'Excel file', 'Opens in Excel or Google Sheets'],
          ['csv', 'description', 'CSV file', 'For other programs'],
          ['print', 'print', 'Print or save as PDF', 'Choose “Save as PDF” in the print window'],
        ] as [ExportFormat, string, string, string][]).map(([f, icon, label, hint]) => (
          <button key={f} onClick={() => run(f)} className="w-full min-h-14 flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 text-left hover:bg-slate-50" data-download-format={f}>
            <Icon name={icon} className="text-[24px] text-[var(--accent-ink)]" />
            <span>
              <span className="block text-[15px] font-semibold text-slate-900">{label}</span>
              <span className="block text-[13px] text-slate-500">{hint}</span>
            </span>
          </button>
        ))}
      </Sheet>
    </>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => <div className={cx('skeleton rounded-xl', className)} aria-hidden="true" />;

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
