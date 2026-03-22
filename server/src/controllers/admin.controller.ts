import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export async function listUsers(_req: AuthRequest, res: Response) {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      createdAt: true,
      lastLoginAt: true,
      _count: {
        select: {
          tournaments: true,
          decks: true,
          teamMembers: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    users: users.map(u => ({
      id: u.id,
      email: u.email,
      username: u.username,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      tournamentsCount: u._count.tournaments,
      decksCount: u._count.decks,
      teamsCount: u._count.teamMembers,
    })),
  });
}
