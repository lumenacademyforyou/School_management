import React from 'react';

// Numbers as the eye reads them: tabular figures so columns align, and the unit (₹, %, L, Cr) lighter and
// smaller than the value so the magnitude lands first. The `unit` utility (index.css) keeps the value's
// colour, so an overdue amount in red keeps a red rupee sign. Shared by the console and the web apps.

export const Figure: React.FC<{ value: React.ReactNode; prefix?: string; suffix?: string; className?: string }> = ({ value, prefix, suffix, className = '' }) => (
  <span className={`tabular-nums whitespace-nowrap ${className}`}>
    {prefix && <span className="unit mr-[0.08em]">{prefix}</span>}
    {value}
    {suffix && <span className="unit ml-[0.06em]">{suffix}</span>}
  </span>
);

/** Whole rupees in Indian grouping (₹1,23,456); negatives read −₹500. */
export const Money: React.FC<{ value: number; className?: string }> = ({ value, className = '' }) => (
  <Figure value={`${value < 0 ? '−' : ''}${Math.round(Math.abs(value)).toLocaleString('en-IN')}`} prefix="₹" className={className} />
);
