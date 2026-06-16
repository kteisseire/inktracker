import webpush from 'web-push';
import prisma from './prisma.js';

const PUBLIC = process.env.VAPID_PUBLIC_KEY;
const PRIVATE = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@glimmerlog.com';

export const pushEnabled = !!(PUBLIC && PRIVATE);
if (pushEnabled) {
  webpush.setVapidDetails(SUBJECT, PUBLIC!, PRIVATE!);
}

export interface PushPayload { title: string; body: string; tag?: string; url?: string; }

// Envoie une notification push à tous les appareils d'un utilisateur. Nettoie les
// abonnements expirés (404/410).
export async function sendToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!pushEnabled) return;
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
      );
    } catch (err: any) {
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
      }
    }
  }));
}
