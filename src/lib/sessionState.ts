import React, { useCallback, useState } from 'react';

// In-memory state that outlives a screen being closed, for the length of the browser session.
// Lets one role raise a request and another role (after signing in) decide it.
const store = new Map<string, unknown>();

export function useSessionState<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => (store.has(key) ? (store.get(key) as T) : initial));
  const set = useCallback<React.Dispatch<React.SetStateAction<T>>>(
    next =>
      setValue(prev => {
        const v = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        store.set(key, v);
        return v;
      }),
    [key]
  );
  return [value, set];
}
