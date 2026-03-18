import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

// ─── List my teams ───
export async function listMyTeams(req: AuthRequest, res: Response) {
  const memberships = await prisma.teamMember.findMany({
    where: { userId: req.userId },
    include: {
      team: {
        include: {
          _count: { select: { members: true } },
          members: {
            include: { user: { select: { id: true, username: true } } },
            orderBy: [{ role: 'asc' as const }, { joinedAt: 'asc' as const }],
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  const teams = memberships.map(m => ({
    id: m.team.id,
    name: m.team.name,
    description: m.team.description,
    createdAt: m.team.createdAt,
    updatedAt: m.team.updatedAt,
    members: m.team.members.map(mem => ({ id: mem.id, teamId: mem.teamId, userId: mem.userId, role: mem.role, joinedAt: mem.joinedAt, user: mem.user })),
    memberCount: m.team._count.members,
    myRole: m.role,
  }));

  res.json({ teams });
}

// ─── Get team detail ───
export async function getTeam(req: AuthRequest, res: Response) {
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: req.params.id, userId: req.userId! } },
  });
  if (!membership) {
    res.status(404).json({ error: 'Équipe non trouvée' });
    return;
  }

  const team = await prisma.team.findUnique({
    where: { id: req.params.id },
    include: {
      members: {
        include: { user: { select: { id: true, username: true } } },
        orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
      },
      invites: membership.role === 'OWNER' || membership.role === 'ADMIN'
        ? {
            where: { status: 'PENDING' },
            include: { user: { select: { id: true, username: true } } },
            orderBy: { createdAt: 'desc' },
          }
        : false,
    },
  });

  res.json({ team: { ...team, myRole: membership.role } });
}

// ─── Create team ───
export async function createTeam(req: AuthRequest, res: Response) {
  const team = await prisma.team.create({
    data: {
      name: req.body.name,
      description: req.body.description || null,
      members: {
        create: { userId: req.userId!, role: 'OWNER' },
      },
    },
  });

  res.status(201).json({ team: { ...team, myRole: 'OWNER', memberCount: 1 } });
}

// ─── Update team ───
export async function updateTeam(req: AuthRequest, res: Response) {
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: req.params.id, userId: req.userId! } },
  });
  if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
    res.status(403).json({ error: 'Permission insuffisante' });
    return;
  }

  const team = await prisma.team.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json({ team });
}

// ─── Delete team ───
export async function deleteTeam(req: AuthRequest, res: Response) {
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: req.params.id, userId: req.userId! } },
  });
  if (!membership || membership.role !== 'OWNER') {
    res.status(403).json({ error: 'Seul le propriétaire peut supprimer l\'équipe' });
    return;
  }

  await prisma.team.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

// ─── Invite a user ───
export async function inviteMember(req: AuthRequest, res: Response) {
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: req.params.id, userId: req.userId! } },
  });
  if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
    res.status(403).json({ error: 'Permission insuffisante' });
    return;
  }

  const target = await prisma.user.findUnique({
    where: { username: req.body.username },
    select: { id: true, username: true },
  });
  if (!target) {
    res.status(404).json({ error: 'Utilisateur non trouvé' });
    return;
  }

  // Already a member?
  const existingMember = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: req.params.id, userId: target.id } },
  });
  if (existingMember) {
    res.status(409).json({ error: 'Cet utilisateur est déjà membre de l\'équipe' });
    return;
  }

  // Already invited?
  const existingInvite = await prisma.teamInvite.findUnique({
    where: { teamId_userId: { teamId: req.params.id, userId: target.id } },
  });
  if (existingInvite && existingInvite.status === 'PENDING') {
    res.status(409).json({ error: 'Une invitation est déjà en attente pour cet utilisateur' });
    return;
  }

  const invite = await prisma.teamInvite.upsert({
    where: { teamId_userId: { teamId: req.params.id, userId: target.id } },
    update: { status: 'PENDING', updatedAt: new Date() },
    create: { teamId: req.params.id, userId: target.id },
    include: { user: { select: { id: true, username: true } } },
  });

  res.status(201).json({ invite });
}

// ─── Cancel invite (admin) ───
export async function cancelInvite(req: AuthRequest, res: Response) {
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: req.params.id, userId: req.userId! } },
  });
  if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
    res.status(403).json({ error: 'Permission insuffisante' });
    return;
  }

  await prisma.teamInvite.delete({ where: { id: req.params.inviteId } });
  res.status(204).send();
}

// ─── List my pending invites ───
export async function listMyInvites(req: AuthRequest, res: Response) {
  const invites = await prisma.teamInvite.findMany({
    where: { userId: req.userId, status: 'PENDING' },
    include: { team: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ invites });
}

// ─── Respond to invite ───
export async function respondToInvite(req: AuthRequest, res: Response) {
  const invite = await prisma.teamInvite.findFirst({
    where: { id: req.params.inviteId, userId: req.userId, status: 'PENDING' },
  });
  if (!invite) {
    res.status(404).json({ error: 'Invitation non trouvée' });
    return;
  }

  const accept = req.body.accept === true;

  if (accept) {
    await prisma.$transaction([
      prisma.teamInvite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED' },
      }),
      prisma.teamMember.create({
        data: { teamId: invite.teamId, userId: req.userId!, role: 'MEMBER' },
      }),
    ]);
  } else {
    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: { status: 'DECLINED' },
    });
  }

  res.json({ accepted: accept });
}

// ─── Update member role ───
export async function updateMemberRole(req: AuthRequest, res: Response) {
  const myMembership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: req.params.id, userId: req.userId! } },
  });
  if (!myMembership || myMembership.role !== 'OWNER') {
    res.status(403).json({ error: 'Seul le propriétaire peut modifier les rôles' });
    return;
  }

  const target = await prisma.teamMember.findUnique({
    where: { id: req.params.memberId },
  });
  if (!target || target.teamId !== req.params.id) {
    res.status(404).json({ error: 'Membre non trouvé' });
    return;
  }
  if (target.userId === req.userId) {
    res.status(400).json({ error: 'Vous ne pouvez pas modifier votre propre rôle' });
    return;
  }

  const member = await prisma.teamMember.update({
    where: { id: req.params.memberId },
    data: { role: req.body.role },
    include: { user: { select: { id: true, username: true } } },
  });
  res.json({ member });
}

// ─── Remove member ───
export async function removeMember(req: AuthRequest, res: Response) {
  const myMembership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: req.params.id, userId: req.userId! } },
  });
  if (!myMembership) {
    res.status(404).json({ error: 'Équipe non trouvée' });
    return;
  }

  const target = await prisma.teamMember.findUnique({
    where: { id: req.params.memberId },
  });
  if (!target || target.teamId !== req.params.id) {
    res.status(404).json({ error: 'Membre non trouvé' });
    return;
  }

  // Can remove self (leave), or owner/admin can remove others
  const isSelf = target.userId === req.userId;
  if (!isSelf) {
    if (myMembership.role !== 'OWNER' && myMembership.role !== 'ADMIN') {
      res.status(403).json({ error: 'Permission insuffisante' });
      return;
    }
    if (target.role === 'OWNER') {
      res.status(403).json({ error: 'Impossible de retirer le propriétaire' });
      return;
    }
    if (target.role === 'ADMIN' && myMembership.role !== 'OWNER') {
      res.status(403).json({ error: 'Seul le propriétaire peut retirer un admin' });
      return;
    }
  } else if (target.role === 'OWNER') {
    res.status(400).json({ error: 'Le propriétaire ne peut pas quitter l\'équipe. Supprimez-la ou transférez la propriété.' });
    return;
  }

  await prisma.teamMember.delete({ where: { id: target.id } });
  res.status(204).send();
}

// ─── Search users (for invite autocomplete) ───
export async function searchUsers(req: AuthRequest, res: Response) {
  const q = (req.query.q as string || '').trim();
  if (q.length < 2) {
    res.json({ users: [] });
    return;
  }

  const users = await prisma.user.findMany({
    where: {
      username: { contains: q, mode: 'insensitive' },
      id: { not: req.userId },
    },
    select: { id: true, username: true },
    take: 10,
    orderBy: { username: 'asc' },
  });

  res.json({ users });
}
