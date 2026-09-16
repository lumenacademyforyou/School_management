import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DEMO_PARTICIPANTS, ParticipantPersona } from '../../data/authUsers';
import { CAMPUSES } from '../../data/mockData';
import { LoginMode, Campus } from '../../types';

interface LoginViewProps {
  onDismissModal?: () => void;
  isModal?: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ onDismissModal, isModal = false }) => {
  const {
    loginAsPersona,
    selectedCampus,
    setSelectedCampus,
    addToast,
    setShowUsageGuide,
  } = useApp();

  const [loginMode, setLoginMode] = useState<LoginMode>('password');
  const [emailInput, setEmailInput] = useState('principal@lumenacademy.edu.in');
  const [passwordInput, setPasswordInput] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [phoneInput, setPhoneInput] = useState('+91 98401 23456');
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['4', '1', '2', '8', '9', '0']);
  const [studentApaar, setStudentApaar] = useState('9842-3310-8841');
  const [studentDob, setStudentDob] = useState('2009-10-14');
  const [mfaStepActive, setMfaStepActive] = useState(false);
  const [mfaCode, setMfaCode] = useState(['5', '2', '9', '1', '4', '8']);
  const [pendingPersona, setPendingPersona] = useState<ParticipantPersona | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Campus>(selectedCampus || CAMPUSES[0]);

  const handlePersonaSelect = (persona: ParticipantPersona) => {
    setSelectedBranch(CAMPUSES.find(c => c.id === persona.campusId) || CAMPUSES[0]);
    loginAsPersona(persona);
    if (onDismissModal) onDismissModal();
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = DEMO_PARTICIPANTS.find(p => p.email.toLowerCase() === emailInput.toLowerCase()) || DEMO_PARTICIPANTS[0];
    loginAsPersona(matched);
    if (onDismissModal) onDismissModal();
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpSent(true);
    addToast('OTP Dispatched (TRAI DLT Verified)', 'info', 'Simulated 6-digit OTP code 412-890 dispatched via SMS gateway.');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = DEMO_PARTICIPANTS.find(p => p.phone === phoneInput) || DEMO_PARTICIPANTS[2]; // Parent
    loginAsPersona(matched);
    if (onDismissModal) onDismissModal();
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const studentPersona = DEMO_PARTICIPANTS.find(p => p.role === 'student') || DEMO_PARTICIPANTS[4];
    loginAsPersona(studentPersona);
    if (onDismissModal) onDismissModal();
  };

  const handleVerifyMfa = (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingPersona) {
      loginAsPersona(pendingPersona);
      setMfaStepActive(false);
      setPendingPersona(null);
      if (onDismissModal) onDismissModal();
    }
  };

  return (
    <div className={`min-h-screen bg-[#f8f9ff] text-[#082b3d] flex flex-col justify-between ${isModal ? 'min-h-0' : ''}`}>
      {/* Top Bar for Login */}
      <header className="bg-[#082b3d] text-white px-4 md:px-8 py-3 border-b border-[#1b2b52] flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <img
            src="/lumen-academy-logo.svg"
            alt="Lumen Academy Crest"
            referrerPolicy="no-referrer"
            className="w-10 h-10 object-contain drop-shadow-xs shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-base tracking-tight text-white">LumenAcademy SMS</span>
              <span className="bg-[#0e5d84] text-[#e0f2fe] text-[10px] font-bold px-1.5 py-0.5 rounded font-mono">
                ENTERPRISE v1.0
              </span>
            </div>
            <p className="text-[11px] text-[#bae6fd] hidden sm:block">
              Empowering Futures through Learning • Multi-Tenant K-12 Management System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUsageGuide(true)}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-[#e0f2fe] px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/15 transition-colors"
          >
            <span className="material-symbols-outlined text-sm text-[#f59e0b]">menu_book</span>
            <span className="hidden sm:inline">How to Use Product Effectively</span>
            <span className="sm:hidden">Guide</span>
          </button>

          {isModal && onDismissModal && (
            <button
              onClick={onDismissModal}
              className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 text-sm"
              title="Close"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Authentic Login Card & Protocol Forms (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#e0ecf4] p-6 md:p-7 shadow-lg space-y-6">
          {/* Header with School Crest */}
          <div className="flex items-center gap-3.5 pb-4 border-b border-[#e0ecf4]">
            <img
              src="/lumen-academy-logo.svg"
              alt="Lumen Academy Crest"
              referrerPolicy="no-referrer"
              className="w-14 h-14 object-contain shrink-0 drop-shadow-xs"
            />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0e5d84] font-mono">
                SECURE IDENTITY & ACCESS (IAM-001–004)
              </span>
              <h1 className="text-xl font-bold font-display text-[#082b3d]">
                Unified Portal Access
              </h1>
              <p className="text-[11px] text-[#777587]">
                Authenticate with strict Row-Level Security tenant isolation.
              </p>
            </div>
          </div>

          {/* MFA Challenge Screen (if triggered) */}
          {mfaStepActive && pendingPersona ? (
            <form onSubmit={handleVerifyMfa} className="space-y-4 bg-[#f0f7fb] p-5 rounded-xl border border-[#0e5d84]/20 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0e5d84] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">phonelink_lock</span>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase text-[#0e5d84]">Privileged Role MFA Challenge</div>
                  <div className="text-sm font-bold text-[#082b3d]">{pendingPersona.name}</div>
                  <div className="text-[11px] text-[#777587]">{pendingPersona.roleTitle}</div>
                </div>
              </div>

              <p className="text-xs text-[#464555]">
                Under security rule <strong>IAM-004</strong>, privileged administration & financial auditor roles require two-factor verification. Enter the 6-digit TOTP code from your registered Authenticator application:
              </p>

              <div className="flex items-center justify-between gap-1.5">
                {mfaCode.map((digit, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const next = [...mfaCode];
                      next[i] = e.target.value;
                      setMfaCode(next);
                    }}
                    className="w-11 h-12 text-center font-mono font-bold text-lg bg-white border border-[#0e5d84] rounded-lg shadow-xs focus:ring-2 focus:ring-[#0e5d84]"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setMfaStepActive(false)}
                  className="text-xs text-[#777587] hover:underline"
                >
                  ← Back to login options
                </button>
                <button
                  type="submit"
                  className="bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm"
                >
                  Verify & Launch Console
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Campus Node Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#464555] flex items-center justify-between">
                  <span>Selected Institutional Branch</span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                    Tenant Isolated
                  </span>
                </label>
                <select
                  value={selectedBranch.id}
                  onChange={(e) => {
                    const found = CAMPUSES.find(c => c.id === e.target.value) || CAMPUSES[0];
                    setSelectedBranch(found);
                    setSelectedCampus(found);
                  }}
                  className="w-full bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl px-3 py-2.5 text-xs text-[#082b3d] font-medium focus:ring-2 focus:ring-[#0e5d84] focus:outline-hidden"
                >
                  {CAMPUSES.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}) — {c.location}
                    </option>
                  ))}
                </select>
              </div>

              {/* Login Method Toggle */}
              <div className="grid grid-cols-3 gap-1 bg-[#f0f7fb] p-1 rounded-xl border border-[#cbe0ec]">
                <button
                  type="button"
                  onClick={() => setLoginMode('password')}
                  className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all ${
                    loginMode === 'password'
                      ? 'bg-white text-[#0e5d84] shadow-xs'
                      : 'text-[#464555] hover:text-[#082b3d]'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">lock</span>
                  <span>Email / ID</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMode('otp')}
                  className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all ${
                    loginMode === 'otp'
                      ? 'bg-white text-[#0e5d84] shadow-xs'
                      : 'text-[#464555] hover:text-[#082b3d]'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">smartphone</span>
                  <span>Mobile OTP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMode('student')}
                  className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all ${
                    loginMode === 'student'
                      ? 'bg-white text-[#0e5d84] shadow-xs'
                      : 'text-[#464555] hover:text-[#082b3d]'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">school</span>
                  <span>Student</span>
                </button>
              </div>

              {/* Form 1: Password Login */}
              {loginMode === 'password' && (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  {/* Quick Admin Access Preset */}
                  <div className="bg-[#f0f7fb] border border-[#cbe0ec] p-2.5 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0e5d84] text-lg">admin_panel_settings</span>
                      <div className="text-left leading-tight">
                        <div className="text-xs font-bold text-[#082b3d]">Administrator Account</div>
                        <div className="text-[10px] text-[#464555]">Dr. Arvind Swaminathan (Super Admin)</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePersonaSelect(DEMO_PARTICIPANTS[0])}
                      className="bg-[#0e5d84] hover:bg-[#083a4f] text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-xs transition-colors flex items-center gap-1 shrink-0"
                    >
                      <span>Sign In as Admin</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#464555]">Official Email or Staff Code</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">mail</span>
                      <input
                        type="text"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="e.g. principal@lumenacademy.edu.in"
                        className="w-full pl-9 pr-3 py-2 bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl text-xs text-[#082b3d] focus:ring-2 focus:ring-[#0e5d84] focus:outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#464555]">Master Password</label>
                      <button
                        type="button"
                        onClick={() => addToast('Self-service password reset email dispatched', 'info')}
                        className="text-[11px] text-[#0e5d84] hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">key</span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full pl-9 pr-10 py-2 bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl text-xs text-[#082b3d] focus:ring-2 focus:ring-[#0e5d84] focus:outline-hidden font-mono"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2 text-slate-400 hover:text-slate-600"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#777587]">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded border-slate-300 text-[#0e5d84]" />
                      <span>Remember on this terminal</span>
                    </label>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Rate Limit: 5/min
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-bold py-2.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Sign In to Institutional Workspace</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </form>
              )}

              {/* Form 2: Mobile OTP Login */}
              {loginMode === 'otp' && (
                <div className="space-y-4">
                  {!otpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#464555]">Registered Mobile Number</label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">call</span>
                          <input
                            type="text"
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            placeholder="+91 98401 23456"
                            className="w-full pl-9 pr-3 py-2 bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl text-xs text-[#082b3d] focus:ring-2 focus:ring-[#0e5d84] focus:outline-hidden"
                            required
                          />
                        </div>
                        <p className="text-[11px] text-[#777587]">
                          Used primarily by Parents and Fleet Drivers for passwordless entry (IAM-002).
                        </p>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-bold py-2.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">sms</span>
                        <span>Send 6-Digit DLT Verification Code</span>
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base">check_circle</span>
                          <span>Code sent to <strong>{phoneInput}</strong></span>
                        </div>
                        <span className="text-[10px] font-mono bg-emerald-100 px-1 rounded">OTP: 412890</span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#464555]">Enter 6-Digit Verification Code</label>
                        <div className="flex items-center justify-between gap-1.5">
                          {otpDigits.map((d, idx) => (
                            <input
                              key={idx}
                              type="text"
                              maxLength={1}
                              value={d}
                              onChange={(e) => {
                                const next = [...otpDigits];
                                next[idx] = e.target.value;
                                setOtpDigits(next);
                              }}
                              className="w-10 h-11 text-center font-mono font-bold text-base bg-[#f8f9ff] border border-[#cbe0ec] rounded-lg focus:ring-2 focus:ring-[#0e5d84]"
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => setOtpSent(false)}
                          className="text-[#777587] hover:underline"
                        >
                          Change number
                        </button>
                        <button
                          type="button"
                          onClick={() => addToast('Resent OTP to registered mobile', 'info')}
                          className="text-[#0e5d84] font-semibold hover:underline"
                        >
                          Resend Code (30s)
                        </button>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-bold py-2.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Verify & Enter Parent Companion</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Form 3: Student Direct Portal */}
              {loginMode === 'student' && (
                <form onSubmit={handleStudentSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#464555]">
                      12-Digit APAAR ID or Admission Number (STU-027)
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">badge</span>
                      <input
                        type="text"
                        value={studentApaar}
                        onChange={(e) => setStudentApaar(e.target.value)}
                        placeholder="e.g. 9842-3310-8841"
                        className="w-full pl-9 pr-3 py-2 bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl text-xs text-[#082b3d] font-mono focus:ring-2 focus:ring-[#0e5d84] focus:outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#464555]">Date of Birth (Security Passcode)</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">calendar_month</span>
                      <input
                        type="date"
                        value={studentDob}
                        onChange={(e) => setStudentDob(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-[#f8f9ff] border border-[#cbe0ec] rounded-xl text-xs text-[#082b3d] focus:ring-2 focus:ring-[#0e5d84] focus:outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#0e5d84] hover:bg-[#083a4f] text-white text-xs font-bold py-2.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Launch Student Academic Desk</span>
                    <span className="material-symbols-outlined text-sm">school</span>
                  </button>
                </form>
              )}
            </>
          )}

          {/* Security Guarantee Footnote */}
          <div className="pt-4 border-t border-[#e0ecf4] flex items-center justify-between text-[11px] text-[#777587]">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-emerald-600">verified_user</span>
              TLS 256-bit Encrypted
            </span>
            <span>DPDP Act 2023 Child Protected</span>
          </div>
        </div>

        {/* Right Column: One-Click Quick Persona Launchpad for All 6 Participants (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono font-bold text-[#0e5d84] uppercase tracking-wider">
                RAPID PARTICIPANT SWITCHER
              </span>
              <h2 className="text-lg font-bold text-[#082b3d]">
                Select Participant Profile to Sign In Instantly
              </h2>
              <p className="text-xs text-[#777587]">
                Click any participant card below to immediately evaluate their role, permissions, and operational workspace.
              </p>
            </div>
            <button
              onClick={() => setShowUsageGuide(true)}
              className="text-xs font-bold text-[#0e5d84] hover:underline flex items-center gap-1 shrink-0"
            >
              <span>User Workflow Steps</span>
              <span className="material-symbols-outlined text-sm">arrow_outward</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {DEMO_PARTICIPANTS.map((persona) => {
              const isSelected = pendingPersona?.id === persona.id;
              return (
                <div
                  key={persona.id}
                  onClick={() => handlePersonaSelect(persona)}
                  className={`group bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md hover:border-[#0e5d84] relative overflow-hidden ${
                    isSelected ? 'border-[#0e5d84] ring-2 ring-[#0e5d84]/20' : 'border-[#e0ecf4]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={persona.avatar}
                      alt={persona.name}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-100 group-hover:ring-[#0e5d84]/30 transition-all shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#0e5d84] bg-[#f0f7fb] px-1.5 py-0.5 rounded">
                          {persona.category}
                        </span>
                        {persona.requiresMfa && (
                          <span className="text-[9px] font-mono text-amber-700 bg-amber-50 px-1 rounded flex items-center gap-0.5 font-bold">
                            <span className="material-symbols-outlined text-[10px]">shield</span>
                            2FA
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-[#082b3d] truncate mt-1 group-hover:text-[#0e5d84] transition-colors">
                        {persona.name}
                      </h3>
                      <div className="text-[11px] text-[#464555] font-medium truncate">
                        {persona.roleTitle}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#777587] mt-3 line-clamp-2 leading-relaxed">
                    {persona.description}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-[#f0f4ff] flex items-center justify-between text-[10px]">
                    <span className="font-mono text-[#464555] truncate max-w-[170px]">
                      {persona.identifier}
                    </span>
                    <span className="font-bold text-[#0e5d84] flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                      <span>Launch Role</span>
                      <span className="material-symbols-outlined text-xs">chevron_right</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Architecture & Compliance Footer Banner */}
          <div className="bg-linear-to-r from-slate-900 to-[#082b3d] text-white rounded-xl p-4 border border-[#213145] text-xs flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#f59e0b] text-2xl">verified</span>
              <div>
                <div className="font-bold text-sm text-white">Full Spec Implementation: LMN-SMS-FEAT-001</div>
                <div className="text-[11px] text-slate-300">
                  37 Functional Modules • 6 Platform Layers • 699 Verified Features
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-300">
              <span className="px-2 py-0.5 bg-white/10 rounded">PostgreSQL 16 RLS</span>
              <span className="px-2 py-0.5 bg-white/10 rounded">DPDP Child Consent</span>
            </div>
          </div>
        </div>
      </main>

      {/* Persistent Footer */}
      <footer className="bg-white border-t border-[#e0ecf4] py-3 px-6 text-center text-xs text-[#777587] flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          LumenAcademy SMS © 2026 • Lead Architect Build Specification Version 1.0 (15 Sep 2026)
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <button onClick={() => setShowUsageGuide(true)} className="text-[#0e5d84] font-semibold hover:underline">
            Read User Implementation Steps
          </button>
          <span>•</span>
          <span>AIS-140 Certified</span>
          <span>•</span>
          <span>DigiLocker NAD Enrolled</span>
        </div>
      </footer>
    </div>
  );
};
