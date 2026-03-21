import { Router } from 'express';
import {
  listMyTeams, getTeam, createTeam, updateTeam, deleteTeam,
  inviteMember, cancelInvite, listMyInvites, respondToInvite,
  updateMemberRole, removeMember, searchUsers,
  generateInviteCode, getTeamByInviteCode, joinTeamByCode,
} from '../controllers/team.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate } from '../middleware/validate.js';
import { createTeamSchema, updateTeamSchema, inviteMemberSchema, updateMemberRoleSchema } from '../validators/team.schema.js';

const router = Router();

// Public route — get team info by invite code
router.get('/join/:inviteCode', asyncHandler(getTeamByInviteCode));

// Authenticated route — join team by invite code
router.post('/join/:inviteCode', authMiddleware, asyncHandler(joinTeamByCode));

router.use(authMiddleware);

// My teams & invites
router.get('/', asyncHandler(listMyTeams));
router.get('/invites', asyncHandler(listMyInvites));
router.post('/invites/:inviteId/respond', asyncHandler(respondToInvite));

// User search for inviting
router.get('/users/search', asyncHandler(searchUsers));

// Team CRUD
router.post('/', validate(createTeamSchema), asyncHandler(createTeam));
router.get('/:id', asyncHandler(getTeam));
router.put('/:id', validate(updateTeamSchema), asyncHandler(updateTeam));
router.delete('/:id', asyncHandler(deleteTeam));

// Members
router.put('/:id/members/:memberId/role', validate(updateMemberRoleSchema), asyncHandler(updateMemberRole));
router.delete('/:id/members/:memberId', asyncHandler(removeMember));

// Invite code (QR sharing)
router.post('/:id/invite-code', asyncHandler(generateInviteCode));

// Invites (team-scoped)
router.post('/:id/invites', validate(inviteMemberSchema), asyncHandler(inviteMember));
router.delete('/:id/invites/:inviteId', asyncHandler(cancelInvite));

export default router;
