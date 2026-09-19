import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ExportData, ExportFormat, exportData } from '../../src/lib/exporters';
import { DEFAULT_STATUS_CODES } from '../../src/data/attendance';
import { THEME_OPTIONS, ThemeChoice, resolveTheme, useTheme } from './settingsService';

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

/** Desktop-only navigation preference shared by the parent and teacher apps. Ctrl/Cmd+B toggles it. */
export const useDesktopSidebar = (app: 'parent' | 'teacher') => {
  const key = `lumen.${app}.sidebar.hidden`;
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      return window.localStorage.getItem(key) !== '1';
    } catch {
      return true;
    }
  });
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(open => {
      try {
        window.localStorage.setItem(key, open ? '1' : '0');
      } catch {
        // The choice remains for the current session when storage is unavailable.
      }
      return !open;
    });
  }, [key]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleSidebar]);

  return { sidebarOpen, toggleSidebar };
};

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

export const TopBar: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  onBack?: () => void;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
  right?: React.ReactNode;
}> = ({ title, subtitle, onBack, onToggleSidebar, sidebarOpen, right }) => (
  <header className="app-surface-transition shrink-0 bg-[var(--bar)] bg-[image:var(--bar-image)] border-b-2 border-[var(--bar-edge)] text-white px-4 lg:px-8 pt-4 pb-3 flex items-center gap-3 shadow-[0_2px_12px_-4px_rgb(7_32_47/0.35)]">
    {onToggleSidebar && (
      <button
        onClick={onToggleSidebar}
        className="hidden lg:inline-flex -ml-1 p-1 rounded-full hover:bg-white/15"
        aria-label={sidebarOpen ? 'Hide navigation' : 'Show navigation'}
        aria-pressed={sidebarOpen}
        title={`${sidebarOpen ? 'Hide' : 'Show'} navigation (Ctrl+B)`}
      >
        <Icon name={sidebarOpen ? 'left_panel_close' : 'left_panel_open'} className="text-[22px]" />
      </button>
    )}
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
  onClose,
}: {
  tabs: TabDef<T>[];
  active: T | null;
  onChange: (t: T) => void;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  onClose?: () => void;
}) => (
  <aside className="app-surface-transition hidden lg:flex w-64 shrink-0 flex-col bg-[var(--surface)] border-r border-slate-200" aria-label="Sidebar">
    <div className="app-surface-transition flex items-center justify-between px-5 py-4 bg-[var(--bar)] bg-[image:var(--bar-image)] border-b-2 border-[var(--bar-edge)] text-white">
      <div className="flex items-center gap-3 min-w-0">
        <img src={LOGO_SRC} alt="" className="w-10 h-10 rounded-xl bg-cream-50 p-0.5 ring-1 ring-gold-300/60 shrink-0" />
        <div className="min-w-0">
          <p className="text-[15px] font-bold leading-tight truncate">{title}</p>
          <p className="text-[12px] text-white/80 truncate">{subtitle}</p>
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1.5 -mr-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors shrink-0"
          title="Close sidebar (Ctrl+B)"
          aria-label="Close sidebar"
        >
          <Icon name="left_panel_close" className="text-[20px]" />
        </button>
      )}
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

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal behaviour for an overlay: Escape closes it, focus moves inside on open, Tab and Shift+Tab
 * stay inside, and the trigger gets focus back on close. The same pattern as the console's
 * `useDialogBehavior`; the phone apps keep their own copy so they do not depend on console code.
 * `onClose` is read through a ref so an inline arrow from the caller cannot re-run the effect.
 */
export const useDialogBehavior = (open: boolean, onClose: () => void) => {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = ref.current;
    const visible = () => Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(el => el.offsetParent !== null);
    (panel?.querySelector<HTMLElement>('input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]):not([data-close])') ?? visible()[0])?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const items = visible();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      previous?.focus?.();
    };
  }, [open]);
  return ref;
};

/**
 * Bottom padding that clears the home indicator on notched phones, as BottomNav does.
 * Written out in full so Tailwind's scanner sees the class.
 */
export const SAFE_PAD_SHEET = 'pb-[calc(1.5rem+env(safe-area-inset-bottom))]';
export const SAFE_PAD_BAR = 'pb-[calc(0.5rem+env(safe-area-inset-bottom))]';

/** Bottom sheet for forms and details on phones; a centred dialog on desktop. Escape closes it and focus is trapped inside. */
export const Sheet: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ open, onClose, title, children }) => {
  const panel = useDialogBehavior(open, onClose);
  const titleId = useId();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end lg:justify-center lg:items-center lg:p-6">
      <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close" tabIndex={-1} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cx(
          'relative bg-[var(--surface)] rounded-t-3xl max-h-[88%] overflow-y-auto p-4 space-y-3 lg:w-full lg:max-w-lg lg:rounded-3xl lg:max-h-[85vh] lg:p-6 lg:shadow-2xl lg:pb-6',
          SAFE_PAD_SHEET
        )}
      >
        <div className="mx-auto w-10 h-1 rounded-full bg-slate-300 lg:hidden" aria-hidden="true" />
        <div className="flex items-center justify-between">
          <h2 id={titleId} className="text-[16px] font-semibold text-slate-900">
            {title}
          </h2>
          <button data-close onClick={onClose} className="p-1 rounded-full hover:bg-slate-100" aria-label="Close sheet">
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

// ---------------------------------------------------------------------------
// Attendance status (ATT-002): one presentation for both apps
// ---------------------------------------------------------------------------

/**
 * How an attendance status looks and reads, defined once so the parent and teacher apps cannot drift.
 *
 * `letter` is the non-colour indicator: every place that tints a cell also shows the letter and an
 * accessible name, so the status is readable without colour vision and without hovering.
 * The tints use the slate / emerald / rose / amber / sky / gold steps that index.css re-defines for the
 * school and dark themes, so they follow the theme (stock hues such as lime or violet do not).
 */
export interface AttendanceStatusStyle {
  code: string;
  label: string;
  letter: string;
  /** Background + text classes for a filled cell, chip or selected button. */
  chip: string;
  /** Ring colour that matches `chip`, for the selected state. */
  ring: string;
}

const STATUS_LOOK: Record<string, Pick<AttendanceStatusStyle, 'letter' | 'chip' | 'ring'>> = {
  P: { letter: 'P', chip: 'bg-emerald-50 text-emerald-700', ring: 'ring-emerald-600/40' },
  L: { letter: 'L', chip: 'bg-amber-50 text-amber-800', ring: 'ring-amber-600/40' },
  HD: { letter: 'H', chip: 'bg-gold-100 text-gold-800', ring: 'ring-gold-600/40' },
  A: { letter: 'A', chip: 'bg-rose-50 text-rose-700', ring: 'ring-rose-600/40' },
  LV: { letter: 'V', chip: 'bg-sky-50 text-sky-700', ring: 'ring-sky-600/40' },
  EX: { letter: 'E', chip: 'bg-slate-100 text-slate-700', ring: 'ring-slate-500/40' },
  MD: { letter: 'M', chip: 'bg-sky-50 text-sky-700', ring: 'ring-sky-600/40' },
};

export const ATTENDANCE_STATUS: Record<string, AttendanceStatusStyle> = Object.fromEntries(
  DEFAULT_STATUS_CODES.map(c => [c.code, { code: c.code, label: c.label, ...(STATUS_LOOK[c.code] ?? { letter: c.code[0], chip: 'bg-slate-100 text-slate-700', ring: 'ring-slate-500/40' }) }])
);

/** The presentation for a status code, or a neutral one for an unknown code. */
export const attendanceStatus = (code: string): AttendanceStatusStyle =>
  ATTENDANCE_STATUS[code] ?? { code, label: code, letter: code[0] ?? '?', chip: 'bg-slate-100 text-slate-700', ring: 'ring-slate-500/40' };

/** Letter + label chip. The letter carries the status when colour is not perceivable. */
export const AttendanceChip: React.FC<{ code: string; count?: number }> = ({ code, count }) => {
  const s = attendanceStatus(code);
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full pl-1 pr-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap', s.chip)}>
      <span aria-hidden="true" className="w-4 h-4 rounded-full ring-1 ring-inset ring-current/40 flex items-center justify-center text-[10px] font-bold leading-none">
        {s.letter}
      </span>
      <span>
        {s.label}
        {count === undefined ? '' : ` ${count}`}
      </span>
    </span>
  );
};

/** Counts by status code, shown with the same letters and tints as the cells they explain. */
export const AttendanceLegend: React.FC<{ counts: Record<string, number>; className?: string }> = ({ counts, className }) => {
  const entries = Object.entries(counts).filter(([, n]) => n > 0);
  if (!entries.length) return null;
  return (
    <ul className={cx('flex flex-wrap gap-1.5 list-none', className)} aria-label="Attendance key">
      {entries.map(([code, n]) => (
        <li key={code}>
          <AttendanceChip code={code} count={n} />
        </li>
      ))}
    </ul>
  );
};

// ---------------------------------------------------------------------------
// Connectivity (APP-016)
// ---------------------------------------------------------------------------

/** Real device connectivity, from navigator.onLine and the browser's online/offline events. */
export const useOnline = () => {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return online;
};

/** Top-bar indicator for the real connection. It is a status, not a control. */
export const ConnectionStatus: React.FC<{ online: boolean }> = ({ online }) => (
  <span
    role="status"
    aria-label={online ? 'Connected' : 'No internet connection'}
    title={online ? 'Connected' : 'No internet connection'}
    className={cx('inline-flex items-center justify-center rounded-full w-9 h-9', online ? 'text-white/80' : 'bg-amber-500 text-white')}
  >
    <Icon name={online ? 'wifi' : 'wifi_off'} className="text-[20px]" />
  </span>
);

/** Strip under the top bar while the device has no connection. Hidden when online. */
export const OfflineBanner: React.FC<{ online: boolean; note?: string }> = ({ online, note }) =>
  online ? null : (
    <div role="status" className="shrink-0 flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-[12px] text-amber-800 lg:px-8">
      <Icon name="cloud_off" className="text-[16px]" />
      <span className="flex-1">No internet connection{note ? ` · ${note}` : ''}</span>
    </div>
  );

// ---------------------------------------------------------------------------
// Conversations (COM-010): one thread view for both apps
// ---------------------------------------------------------------------------

export type ChatItem = { kind: 'message'; mine: boolean; text: string; meta?: string } | { kind: 'note'; text: string };

/** Thread header, bubbles and composer. Each app supplies its own data, copy and send handler. */
export const ChatThread: React.FC<{
  title: string;
  subtitle?: string;
  onBack: () => void;
  backLabel?: string;
  items: ChatItem[];
  empty?: React.ReactNode;
  footnote?: string;
  draft: string;
  onDraft: (value: string) => void;
  onSend: () => void;
  placeholder: string;
  composerLabel: string;
  sendLabel: string;
}> = ({ title, subtitle, onBack, backLabel = 'Back to conversations', items, empty, footnote, draft, onDraft, onSend, placeholder, composerLabel, sendLabel }) => (
  <div className="flex-1 flex flex-col min-h-0">
    <div className="app-surface-transition shrink-0 bg-[var(--surface)] border-b border-slate-200 px-4 py-2 flex items-center gap-2">
      <button onClick={onBack} aria-label={backLabel} className="w-11 h-11 -ml-2 flex items-center justify-center rounded-full hover:bg-slate-100">
        <Icon name="arrow_back" />
      </button>
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-slate-900 truncate">{title}</p>
        {subtitle && <p className="text-[12px] text-slate-500 truncate">{subtitle}</p>}
      </div>
    </div>
    <div className="flex-1 overflow-y-auto p-4 space-y-2" role="log" aria-label={`Conversation with ${title}`}>
      {items.map((m, i) =>
        m.kind === 'note' ? (
          <p key={i} className="text-center text-[12px] text-slate-500 italic">
            {m.text}
          </p>
        ) : (
          <div key={i} className={cx('max-w-[80%] rounded-2xl px-3 py-2 text-[14px]', m.mine ? 'ml-auto bg-[var(--accent)] text-white' : 'bg-[var(--surface)] border border-slate-200 text-slate-900')}>
            <p>{m.text}</p>
            {m.meta && <p className={cx('text-[10px] mt-0.5', m.mine ? 'text-white/70' : 'text-slate-400')}>{m.meta}</p>}
          </div>
        )
      )}
      {items.length === 0 && empty}
      {footnote && <p className="text-center text-[11px] text-slate-400">{footnote}</p>}
    </div>
    <div className={cx('app-surface-transition shrink-0 bg-[var(--surface)] border-t border-slate-200 p-2 flex gap-2', SAFE_PAD_BAR)}>
      <input value={draft} onChange={e => onDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSend()} placeholder={placeholder} className={cx(inputClass, 'py-2')} aria-label={composerLabel} />
      <button onClick={onSend} disabled={!draft.trim()} className="rounded-full bg-[var(--accent)] text-white w-11 h-11 shrink-0 flex items-center justify-center disabled:opacity-40" aria-label={sendLabel}>
        <Icon name="send" />
      </button>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Appearance (APP-015): the same theme picker in both apps
// ---------------------------------------------------------------------------

const ThemePreview: React.FC<{ choice: ThemeChoice; accent: string }> = ({ choice, accent }) => {
  const previews = choice === 'system' ? (['light', 'dark'] as const) : ([resolveTheme(choice, false)] as const);
  return (
    <span className="flex w-full h-20 rounded-lg overflow-hidden border border-slate-200" aria-hidden="true">
      {previews.map(t => (
        <span key={t} data-app-theme={t} className="flex-1 flex flex-col bg-[var(--app-bg)]" style={{ ['--accent' as string]: accent }}>
          <span className="h-4 bg-[var(--bar)] border-b-2 border-[var(--bar-edge)]" />
          <span className="m-1.5 flex-1 rounded-md bg-[var(--surface)] border border-slate-200 p-1 space-y-1">
            <span className="block h-1.5 w-2/3 rounded bg-slate-300" />
            <span className="block h-1.5 w-1/2 rounded bg-slate-200" />
            <span className="block h-2 w-1/3 rounded bg-[var(--accent)]" />
          </span>
        </span>
      ))}
    </span>
  );
};

/** Theme picker page. `accent` only tints the previews; the choice itself is shared by both apps. */
export const AppearancePage: React.FC<{ onSaved: (text: string) => void; accent?: string }> = ({ onSaved, accent = '#17667d' }) => {
  const { choice, applied, setTheme } = useTheme();
  return (
    <Screen>
      <Card title="Theme">
        <p className="text-[12px] text-slate-500 -mt-1 mb-3">Choose your preferred appearance.</p>
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Theme">
          {THEME_OPTIONS.map(o => {
            const on = o.id === choice;
            return (
              <button
                key={o.id}
                role="radio"
                aria-checked={on}
                onClick={() => {
                  setTheme(o.id);
                  onSaved(`Theme set to ${o.label}`);
                }}
                className={cx('rounded-2xl border-2 p-2 text-left space-y-2 transition-colors', on ? 'border-[var(--accent-ink)] bg-slate-50' : 'border-slate-200')}
                data-theme-option={o.id}
              >
                <ThemePreview choice={o.id} accent={accent} />
                <span className="flex items-center gap-1.5">
                  <Icon name={o.icon} className="text-[18px] text-[var(--accent-ink)]" />
                  <span className="text-[13px] font-semibold text-slate-900 flex-1">{o.label}</span>
                  {on && <Icon name="check_circle" filled className="text-[18px] text-[var(--accent-ink)]" />}
                </span>
                <span className="block text-[11px] text-slate-500">{o.hint}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-slate-500" aria-live="polite">
          Showing the {applied === 'school' ? 'School' : applied === 'dark' ? 'Dark' : 'Light'} theme{choice === 'system' ? ', following your phone' : ''}. Saved on this device.
        </p>
      </Card>
      <FeatureFooter ids={['APP-015', 'APP-017']} />
    </Screen>
  );
};
