// Notifications de tournoi — étape 1 (app ouverte). Préférence persistée en
// localStorage ; les notifications système utilisent l'API Notification du
// navigateur (fonctionne tant qu'un onglet/PWA est ouvert). Le Web Push "app
// fermée" viendra en étape 2.

const ENABLED_KEY = 'glimmerlog_notify_tournaments';

export function notifyEnabled(): boolean {
  return localStorage.getItem(ENABLED_KEY) === '1';
}

export function setNotifyEnabled(on: boolean): void {
  localStorage.setItem(ENABLED_KEY, on ? '1' : '0');
}

export function notifyPermission(): NotificationPermission | 'unsupported' {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

// Active les notifications : demande l'autorisation si besoin, persiste le choix.
// Retourne true si activées (autorisation accordée).
export async function enableNotifications(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  let perm = Notification.permission;
  if (perm === 'default') {
    perm = await Notification.requestPermission();
  }
  const ok = perm === 'granted';
  setNotifyEnabled(ok);
  return ok;
}

// Affiche une notification système si activée + autorisée. Préfère le service
// worker (meilleure compat mobile) avec repli sur new Notification.
export async function fireNotification(title: string, body: string, tag?: string): Promise<void> {
  if (!notifyEnabled() || notifyPermission() !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.showNotification(title, { body, tag, icon: '/pwa-192x192.png', badge: '/pwa-192x192.png' });
      return;
    }
  } catch { /* repli ci-dessous */ }
  try { new Notification(title, { body, tag, icon: '/pwa-192x192.png' }); } catch { /* ignore */ }
}
