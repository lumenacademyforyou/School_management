import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Prints only its children. While mounted, the body is flagged so print CSS hides the app,
 * the browser print dialog opens, and onDone fires once printing finishes or is cancelled.
 */
export const PrintPortal: React.FC<{ children: React.ReactNode; onDone: () => void; className?: string }> = ({ children, onDone, className = '' }) => {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    document.body.classList.add('printing-portal');
    const done = () => {
      document.body.classList.remove('printing-portal');
      onDoneRef.current();
    };
    window.addEventListener('afterprint', done, { once: true });
    const timer = window.setTimeout(() => window.print(), 300);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('afterprint', done);
      document.body.classList.remove('printing-portal');
    };
  }, []);

  return createPortal(<div className={`print-portal ${className}`}>{children}</div>, document.body);
};
