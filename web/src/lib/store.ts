import { useSyncExternalStore } from 'react';

// A tiny observable store. Mock services keep their records here so every screen that reads
// them re-renders on change; a real API client can later replace the service, not the screens.

export interface Store<T> {
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (listener: () => void) => () => void;
  reset: () => void;
}

export const createStore = <T>(initial: () => T): Store<T> => {
  let state = initial();
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach(l => l());
  return {
    get: () => state,
    set: next => {
      state = typeof next === 'function' ? (next as (prev: T) => T)(state) : next;
      notify();
    },
    subscribe: listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reset: () => {
      state = initial();
      notify();
    },
  };
};

export const useStore = <T>(store: Store<T>): T => useSyncExternalStore(store.subscribe, store.get, store.get);

/** Simulated network latency for mock services (0 in tests). */
let latencyMs = 300;
export const setMockLatency = (ms: number) => {
  latencyMs = ms;
};
export const mockDelay = <T>(value: T, ms = latencyMs): Promise<T> => new Promise(resolve => setTimeout(() => resolve(value), ms));
