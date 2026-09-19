// Device settings for the phone apps (APP-015). Saved in this browser only; a real client would
// also sync them to the parent's profile.
import { useEffect, useState } from 'react';
import { createStore, useStore } from '../../src/lib/store';

export type ThemeChoice = 'light' | 'dark' | 'system' | 'school';
export type AppliedTheme = 'light' | 'dark' | 'school';

export const THEME_OPTIONS: { id: ThemeChoice; label: string; icon: string; hint: string }[] = [
  { id: 'light', label: 'Light', icon: 'light_mode', hint: 'Bright, neutral surfaces' },
  { id: 'dark', label: 'Dark', icon: 'dark_mode', hint: 'Easier on the eyes at night' },
  { id: 'system', label: 'System default', icon: 'devices', hint: 'Follows your phone’s setting' },
  { id: 'school', label: 'School theme', icon: 'school', hint: 'Lumen Academy navy and gold' },
];

export const THEME_STORAGE_KEY = 'lumen.parent.theme';
const CHOICES = THEME_OPTIONS.map(o => o.id);

const read = (): ThemeChoice => {
  try {
    const v = globalThis.localStorage?.getItem(THEME_STORAGE_KEY);
    return CHOICES.includes(v as ThemeChoice) ? (v as ThemeChoice) : 'light';
  } catch {
    return 'light';
  }
};

const themeStore = createStore<ThemeChoice>(read);

export const resolveTheme = (choice: ThemeChoice, prefersDark: boolean): AppliedTheme => (choice === 'system' ? (prefersDark ? 'dark' : 'light') : choice);

export const settingsService = {
  getTheme: (): ThemeChoice => themeStore.get(),
  setTheme: (choice: ThemeChoice) => {
    try {
      globalThis.localStorage?.setItem(THEME_STORAGE_KEY, choice);
    } catch {
      // Private browsing: the choice still applies for this visit.
    }
    themeStore.set(choice);
  },
  /** Re-reads storage, e.g. after another tab changed it. */
  reload: () => themeStore.set(read()),
};

const darkQuery = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null);

/** The chosen theme and the one actually applied (System resolves to Light or Dark). */
export const useTheme = () => {
  const choice = useStore(themeStore);
  const [prefersDark, setPrefersDark] = useState(() => darkQuery()?.matches ?? false);
  useEffect(() => {
    const q = darkQuery();
    if (!q) return;
    const onChange = (e: MediaQueryListEvent) => setPrefersDark(e.matches);
    q.addEventListener('change', onChange);
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY) settingsService.reload();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      q.removeEventListener('change', onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  return { choice, applied: resolveTheme(choice, prefersDark), setTheme: settingsService.setTheme };
};
