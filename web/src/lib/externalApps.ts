import { PARENT_APP_URL, TEACHER_APP_URL } from '../data/staffAccess';

export type ExternalApp = 'parent' | 'teacher';

export const EXTERNAL_APPS: Record<ExternalApp, { name: string; url: string; command: string }> = {
  parent: { name: 'Parent app', url: PARENT_APP_URL, command: 'npm run dev:parent' },
  teacher: { name: 'Teacher app', url: TEACHER_APP_URL, command: 'npm run dev:teacher' },
};

type Notify = (title: string, type: 'warning', message: string) => void;

/**
 * Opens the parent or teacher app in a new tab. They are separate servers, so the tab is
 * opened first (keeps the popup allowed) and only pointed at the app once it answers.
 */
export const openExternalApp = async (app: ExternalApp, notify: Notify) => {
  const { name, url, command } = EXTERNAL_APPS[app];
  const tab = window.open('', '_blank');
  try {
    await fetch(url, { mode: 'no-cors', cache: 'no-store' });
  } catch {
    tab?.close();
    notify(`${name} is not running`, 'warning', `Nothing answered at ${url}. Start it with "${command}" (or "npm run dev" for all three apps).`);
    return false;
  }
  if (tab) {
    tab.opener = null;
    tab.location.href = url;
  } else {
    window.location.href = url;
  }
  return true;
};
