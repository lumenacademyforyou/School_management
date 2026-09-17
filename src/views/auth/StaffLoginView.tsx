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
  const [failures, setFailures] = useState(0);
  const [appNotice, setAppNotice] = useState('');
  const locked = failures >= MAX_ATTEMPTS;

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    const account = STAFF_ACCOUNTS.find(a => a.email.toLowerCase() === email.trim().toLowerCase());
    if (!account || password !== DEMO_STAFF_PASSWORD) {
      const n = failures + 1;
      setFailures(n);
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
      setError('That code is not correct.');
      return;
    }
    signIn(pending);
  };

  const openApp = (e: React.MouseEvent, app: ExternalApp) => {
    e.preventDefault();
    setAppNotice('');
    openExternalApp(app, (title, _type, message) => setAppNotice(`${title}. ${message}`));
  };

  const input = 'w-full rounded-lg border border-[#cbe0ec] bg-white px-3 py-2 text-sm text-[#082b3d] outline-none focus:border-[#0e5d84] focus:ring-2 focus:ring-[#0e5d84]/20';

  return (
    <div className="min-h-screen bg-[#f0f7fb] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-white rounded-2xl shadow-xl border border-[#e0ecf4] overflow-hidden">
        <div className="p-8 bg-[#082b3d] text-white flex flex-col justify-between gap-8">
          <div>
            <img src="/lumen-academy-logo.png" alt="" className="w-14 h-14 rounded-xl bg-white p-1" />
            <h1 className="mt-5 text-2xl font-bold">Lumen Academy</h1>
            <p className="text-white/70 text-sm">Staff console — admissions, students, fees, communication and administration</p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-white/60 text-xs uppercase tracking-wide">Not school staff?</p>
            <a href={EXTERNAL_APPS.parent.url} onClick={e => openApp(e, 'parent')} className="flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/15 px-3 py-2">
              <span className="material-symbols-outlined text-lg">family_restroom</span>
              Parents — open the parent app
            </a>
            <a href={EXTERNAL_APPS.teacher.url} onClick={e => openApp(e, 'teacher')} className="flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/15 px-3 py-2">
              <span className="material-symbols-outlined text-lg">school</span>
              Teachers — open the teacher app
            </a>
            {appNotice && (
              <p role="alert" className="rounded-lg bg-amber-100 text-amber-900 px-3 py-2 text-xs">
                {appNotice}
              </p>
            )}
          </div>
        </div>

        <div className="p-8 space-y-5">
          {!pending ? (
            <form onSubmit={submitPassword} className="space-y-4">
              <h2 className="text-lg font-bold text-[#082b3d]">Sign in</h2>
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-[#464555]">Work email</span>
                <input value={email} onChange={e => { setEmail(e.target.value); setError(''); }} type="email" className={input} aria-label="Work email" disabled={locked} />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-[#464555]">Password</span>
                <input value={password} onChange={e => { setPassword(e.target.value); setError(''); }} type="password" className={input} aria-label="Password" disabled={locked} />
              </label>
              {error && <p className="text-sm text-rose-700">{error}</p>}
              <button type="submit" disabled={locked} className="w-full rounded-lg bg-[#0e5d84] hover:bg-[#083a4f] text-white text-sm font-semibold py-2.5 disabled:opacity-40">
                Continue
              </button>
              <p className="text-xs text-[#777587]">Demo password: {DEMO_STAFF_PASSWORD}</p>
            </form>
          ) : (
            <form onSubmit={submitCode} className="space-y-4">
              <h2 className="text-lg font-bold text-[#082b3d]">Two-step verification</h2>
              <p className="text-sm text-[#464555]">
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
              <button type="submit" disabled={code.length !== 6} className="w-full rounded-lg bg-[#0e5d84] hover:bg-[#083a4f] text-white text-sm font-semibold py-2.5 disabled:opacity-40">
                Verify and sign in
              </button>
              <div className="flex justify-between text-xs">
                <span className="text-[#777587]">Demo code: {DEMO_TOTP}</span>
                <button type="button" onClick={() => setPending(null)} className="text-[#0e5d84] font-semibold">
                  Use a different account
                </button>
              </div>
            </form>
          )}

          <div className="border-t border-[#e0ecf4] pt-4">
            <p className="text-xs font-semibold text-[#464555] mb-2">Demo staff accounts — each sees only the screens allotted to the role</p>
            <div className="space-y-1.5">
              {STAFF_ACCOUNTS.map(a => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => { setEmail(a.email); setPending(null); setError(''); }}
                  className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2 text-left ${email === a.email ? 'border-[#0e5d84] bg-[#f0f7fb]' : 'border-[#e0ecf4] hover:bg-[#f8f9ff]'}`}
                >
                  <img src={a.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[#082b3d]">
                      {a.roleTitle} · {a.name}
                    </span>
                    <span className="block text-xs text-[#777587] truncate">{a.summary}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
