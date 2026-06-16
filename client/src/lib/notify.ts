// Notifications de tournoi — étape 1 (app ouverte). Préférence persistée en
// localStorage ; les notifications système utilisent l'API Notification du
// navigateur (fonctionne tant qu'un onglet/PWA est ouvert). Le Web Push "app
// fermée" viendra en étape 2.

import { subscribePush, unsubscribePush } from '../api/push.api.js';

const ENABLED_KEY = 'glimmerlog_notify_tournaments';

// Clé VAPID publique (publique par nature — sans risque côté client).
const VAPID_PUBLIC = 'BGX8sN6XzIe3OBa-AwGdSkAcYKSTJDVV4mmkEOkU45Hq4NExycuNUIHPwEBaZpBC3DkITlkQTCSFaIoLlJpU1gM';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

const pushSupported = () =>
  typeof navigator !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;

// Abonne l'appareil au Web Push (notifs même app fermée) et enregistre côté serveur.
export async function subscribeToPush(): Promise<boolean> {
  if (!pushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as unknown as BufferSource,
      });
    }
    await subscribePush(sub.toJSON());
    return true;
  } catch {
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!pushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await unsubscribePush(sub.endpoint).catch(() => {});
      await sub.unsubscribe().catch(() => {});
    }
  } catch { /* ignore */ }
}

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
