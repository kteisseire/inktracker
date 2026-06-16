import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || '';

export async function getPublicKey(_req: AuthRequest, res: Response) {
  res.json({ publicKey: VAPID_PUBLIC });
}

export async function subscribe(req: AuthRequest, res: Response) {
  const { endpoint, keys } = req.body || {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400).json({ error: 'Abonnement invalide' });
    return;
  }
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId: req.userId!, p256dh: keys.p256dh, auth: keys.auth },
    create: { userId: req.userId!, endpoint, p256dh: keys.p256dh, auth: keys.auth },
  });
  res.status(201).json({ ok: true });
}

export async function unsubscribe(req: AuthRequest, res: Response) {
  const { endpoint } = req.body || {};
  if (endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: req.userId! } });
  }
  res.json({ ok: true });
}
