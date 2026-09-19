import React, { useSyncExternalStore } from 'react';
import { Card, Icon, Pill, PrimaryButton } from './mobileUi';

// Installable web app (PWA) support shared by the parent and teacher apps. The manifest and the
// service worker are generated per app by the Vite config (`webAppFiles`).

/** Registers the offline service worker in production builds only, so development always serves fresh code. */
export const registerServiceWorker = () => {
  if (!import.meta.env.PROD || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  });
};

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * installed   — running as an installed app
 * available   — the browser offered an install prompt
 * ios         — Safari on iPhone/iPad: install from the Share menu
 * manual      — no prompt yet: install from the browser menu
 */
export type InstallStatus = 'installed' | 'available' | 'ios' | 'manual';

const hasWindow = typeof window !== 'undefined';
let deferred: InstallPromptEvent | null = null;
let installed = hasWindow && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());

if (hasWindow) {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferred = null;
    notify();
  });
}

export const installStatus = (): InstallStatus => {
  if (installed) return 'installed';
  if (deferred) return 'available';
  if (hasWindow && /iphone|ipad|ipod/i.test(navigator.userAgent)) return 'ios';
  return 'manual';
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useInstallStatus = () => useSyncExternalStore(subscribe, installStatus, () => 'manual' as InstallStatus);

/** Shows the browser's install prompt. Resolves to true when the person installs. */
export const promptInstall = async () => {
  if (!deferred) return false;
  const event = deferred;
  deferred = null;
  notify();
  await event.prompt();
  const { outcome } = await event.userChoice;
  return outcome === 'accepted';
};

const HOW_TO: Record<Exclude<InstallStatus, 'available'>, string> = {
  installed: 'You are using the installed app. It opens from your home screen or app list, and pages you have visited work offline.',
  ios: 'In Safari, tap Share, then “Add to Home Screen”.',
  manual: 'Use your browser menu: “Install app” in Chrome or Edge, or “Add to Home screen” on Android.',
};

/** Install card for settings screens. */
export const InstallAppCard: React.FC<{ appName: string; onInstalled?: () => void }> = ({ appName, onInstalled }) => {
  const status = useInstallStatus();
  return (
    <Card title="Install the app" action={status === 'installed' ? <Pill tone="green">Installed</Pill> : undefined}>
      <div className="flex gap-3" data-install-status={status}>
        <Icon name="install_mobile" className="text-[28px] text-[var(--accent-ink)]" />
        <div className="flex-1 space-y-2">
          <p className="text-[13px] text-slate-700">
            {status === 'installed' ? HOW_TO.installed : `Add ${appName} to your phone or computer. It opens in its own window, starts faster and keeps working when the network drops.`}
          </p>
          {status === 'available' ? (
            <PrimaryButton
              onClick={async () => {
                if (await promptInstall()) onInstalled?.();
              }}
            >
              Install {appName}
            </PrimaryButton>
          ) : (
            status !== 'installed' && <p className="text-[12px] text-slate-500">{HOW_TO[status]}</p>
          )}
        </div>
      </div>
    </Card>
  );
};

/** Compact install button for the desktop sidebar. Hidden unless the browser offers an install prompt. */
export const InstallButton: React.FC<{ appName: string }> = ({ appName }) => {
  const status = useInstallStatus();
  if (status !== 'available') return null;
  return (
    <button onClick={() => promptInstall()} className="w-full flex items-center justify-center gap-2 rounded-xl border border-[var(--accent)] text-[var(--accent-ink)] text-[13px] font-semibold py-2 hover:bg-[var(--accent)]/10">
      <Icon name="install_desktop" className="text-[18px]" />
      Install {appName}
    </button>
  );
};
