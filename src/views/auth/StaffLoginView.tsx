import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DEMO_STAFF_PASSWORD, DEMO_TOTP, STAFF_ACCOUNTS, StaffAccount } from '../../data/staffAccess';
import { EXTERNAL_APPS, ExternalApp, openExternalApp } from '../../lib/externalApps';

const MAX_ATTEMPTS = 5;

/** Admin console sign-in for school staff (IAM-001, IAM-004, IAM-009). */
export const StaffLoginView: React.FC = () => {
  const { signIn } = useApp();
  const [email, setEmail] = useState(STAFF_ACCOUNTS[0].email);
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState<StaffAccount | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  // Attempts are counted per account, so trying another sign-in does not inherit the previous one's lock
  // and does not let an attacker clear a lock by switching accounts and back.
  const [failures, setFailures] = useState<Record<string, number>>({});
  const [appNotice, setAppNotice] = useState('');

  const accountKey = email.trim().toLowerCase();
  const attempts = failures[accountKey] ?? 0;
  const locked = attempts >= MAX_ATTEMPTS;

  const countFailure = (key: string) => {
    const next = (failures[key] ?? 0) + 1;
    setFailures(f => ({ ...f, [key]: next }));
    return next;
  };

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    const account = STAFF_ACCOUNTS.find(a => a.email.toLowerCase() === accountKey);
    if (!account || password !== DEMO_STAFF_PASSWORD) {
      const n = countFailure(accountKey);
      setError(n >= MAX_ATTEMPTS ? 'Too many attempts. This account is locked — ask the Principal to unlock it.' : `Email or password is incorrect (${MAX_ATTEMPTS - n} attempt(s) left).`);
      return;
    }
    setError('');
    if (account.requiresMfa) {
      setPending(account);
      setCode('');
      return;
    }
    signIn(account);
  };

  const submitCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pending) return;
    if (code !== DEMO_TOTP) {
      // A wrong code counts against the same account budget as a wrong password, so the six digits
      // cannot be worked through by retrying on this step.
      const n = countFailure(pending.email.toLowerCase());
      setCode('');
      if (n >= MAX_ATTEMPTS) {
        setEmail(pending.email);
        setPending(null);
        setPassword('');
        setError('Too many attempts. This account is locked — ask the Principal to unlock it.');
        return;
      }
      setError(`That code is not correct (${MAX_ATTEMPTS - n} attempt(s) left).`);
      return;
    }
    signIn(pending);
  };

  const openApp = (e: React.MouseEvent, app: ExternalApp) => {
    e.preventDefault();
    setAppNotice('');
    openExternalApp(app, (title, _type, message) => setAppNotice(`${title}. ${message}`));
  };

  const input =
    'w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink shadow-xs outline-none transition-colors hover:border-slate-300 focus:border-lumen-500 focus:ring-2 focus:ring-lumen-500/20';
  const primary =
    'w-full rounded-lg bg-brand hover:bg-brand-strong text-white text-sm font-semibold py-2.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(7_32_47/0.24)] transition-colors disabled:opacity-40';

  return (
    <div className="min-h-screen bg-paper grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative overflow-hidden bg-lumen-night text-white px-8 py-10 lg:px-14 lg:py-14 flex flex-col justify-between gap-10">
        <div aria-hidden="true" className="absolute inset-0 bg-sunburst [mask-image:radial-gradient(120%_90%_at_100%_0%,black_0%,transparent_65%)]" />
        <div aria-hidden="true" className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-gold-400/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-4">
            <span className="w-16 h-16 rounded-2xl bg-cream-50 p-1 ring-2 ring-gold-400/70 shadow-[0_8px_24px_-8px_rgb(240_180_58/0.45)]">
              <img src="/lumen-academy-logo.png" alt="" className="w-full h-full object-contain" />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-[0.08em] text-gold-300">Staff console</p>
              <h1 className="text-3xl font-bold font-display tracking-tight">Lumen Academy</h1>
            </div>
          </div>
          <p className="mt-8 max-w-sm font-display text-[22px] leading-snug text-cream-100">Empowering futures through learning.</p>
          <span aria-hidden="true" className="mt-5 block h-px w-24 bg-gradient-to-r from-gold-400 to-transparent" />
          <p className="mt-5 max-w-sm text-sm text-lumen-100/75">Admissions, students, fees, examinations, communication and compliance — one console for the whole school.</p>
          <ul className="mt-6 hidden lg:grid gap-2.5 text-sm text-lumen-50/85">
            {[
              ['verified_user', 'Every screen follows your role’s access grants'],
              ['id_card', 'UDISE+, APAAR and Tamil Nadu EMIS returns'],
              ['history', 'Every change is logged for audit'],
            ].map(([icon, text]) => (
              <li key={text} className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-white/[0.07] ring-1 ring-inset ring-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px] text-gold-300">{icon}</span>
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative space-y-2 text-sm">
          <p className="text-lumen-200/60 text-[11px] font-semibold uppercase tracking-[0.16em]">Not school staff?</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
            <a href={EXTERNAL_APPS.parent.url} onClick={e => openApp(e, 'parent')} className="flex items-center gap-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] ring-1 ring-inset ring-white/10 px-3 py-2.5 transition-colors">
              <span className="material-symbols-outlined text-lg text-gold-300">family_restroom</span>
              Parents — open the parent app
            </a>
            <a href={EXTERNAL_APPS.teacher.url} onClick={e => openApp(e, 'teacher')} className="flex items-center gap-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] ring-1 ring-inset ring-white/10 px-3 py-2.5 transition-colors">
              <span className="material-symbols-outlined text-lg text-gold-300">school</span>
              Teachers — open the teacher app
            </a>
          </div>
          {appNotice && (
            <p role="alert" className="rounded-lg bg-gold-100 text-gold-900 px-3 py-2 text-xs">
              {appNotice}
            </p>
          )}
        </div>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 lg:px-12 fade-in">
        <div className="w-full max-w-md bg-surface rounded-2xl border border-line-soft shadow-lg p-7 space-y-6 zoom-in">
          {!pending ? (
            <form onSubmit={submitPassword} className="space-y-4">
              <div>
                <h2 className="text-xl font-bold font-display tracking-tight text-ink">Sign in</h2>
                <p className="text-xs text-ink-muted mt-1">Use your school email. Staff accounts are protected by two-step verification.</p>
              </div>
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-ink-soft">Work email</span>
                <input value={email} onChange={e => { setEmail(e.target.value); setError(''); }} type="email" className={input} aria-label="Work email" disabled={locked} />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-ink-soft">Password</span>
                <input value={password} onChange={e => { setPassword(e.target.value); setError(''); }} type="password" className={input} aria-label="Password" disabled={locked} />
              </label>
              {error && <p className="text-sm text-rose-700">{error}</p>}
              <button type="submit" disabled={locked} className={primary}>
                Continue
              </button>
              <p className="text-xs text-ink-muted">Demo password: {DEMO_STAFF_PASSWORD}</p>
            </form>
          ) : (
            <form onSubmit={submitCode} className="space-y-4">
              <h2 className="text-xl font-bold font-display tracking-tight text-ink">Two-step verification</h2>
              <p className="text-sm text-ink-soft">
                {pending.roleTitle} accounts need the 6-digit code from the authenticator app registered to {pending.email}.
              </p>
              <input
                value={code}
                onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                inputMode="numeric"
                className={`${input} text-center tracking-[0.5em] text-lg font-semibold`}
                aria-label="Authenticator code"
              />
              {error && <p className="text-sm text-rose-700">{error}</p>}
              <button type="submit" disabled={code.length !== 6} className={primary}>
                Verify and sign in
              </button>
              <div className="flex justify-between text-xs">
                <span className="text-ink-muted">Demo code: {DEMO_TOTP}</span>
                <button type="button" onClick={() => { setPending(null); setCode(''); setError(''); }} className="text-brand font-semibold hover:underline cursor-pointer">
                  Use a different account
                </button>
              </div>
            </form>
          )}

          <div className="border-t border-line-soft pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-ink mb-2.5">Demo staff accounts</p>
            <div className="space-y-1.5">
              {STAFF_ACCOUNTS.map(a => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => { setEmail(a.email); setPending(null); setError(''); }}
                  className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-all duration-150 cursor-pointer ${
                    email === a.email
                      ? 'border-lumen-400 bg-lumen-50/70 shadow-[inset_3px_0_0_var(--color-gold-400)] scale-[1.01]'
                      : 'border-line-soft hover:bg-wash hover:border-line hover:-translate-y-0.5'
                  }`}
                >
                  <img src={a.avatar} alt="" className={`w-8 h-8 rounded-full object-cover ring-2 ${email === a.email ? 'ring-gold-300' : 'ring-transparent'}`} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink">
                      {a.roleTitle} · {a.name}
                    </span>
                    <span className="block text-xs text-ink-muted truncate">{a.summary}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-ink-muted">Each account sees only the screens allotted to its role.</p>
        </div>
      </main>
    </div>
  );
};
