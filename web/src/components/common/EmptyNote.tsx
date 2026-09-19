import React from 'react';

// The one inline "nothing here" treatment, shared by the console and the web apps (styles: `empty-note` in
// index.css, built on the slate tokens so the parent app's themes regrade it). For a whole panel or page use
// EmptyState, which adds a title and a next action.

export const EmptyNote: React.FC<{ children: React.ReactNode; icon?: string; className?: string }> = ({ children, icon = 'info', className = '' }) => (
  <p className={`empty-note ${className}`}>
    <span className="material-symbols-outlined text-[16px] text-slate-400" aria-hidden="true">
      {icon}
    </span>
    <span>{children}</span>
  </p>
);
