import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(50),
  description: z.string().max(200).nullish(),
});

export const updateTeamSchema = createTeamSchema.partial();

export const inviteMemberSchema = z.object({
  username: z.string().min(1, 'Pseudo requis'),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});
