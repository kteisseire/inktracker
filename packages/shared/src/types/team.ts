export type TeamRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: string;
  user: { id: string; username: string };
}

export interface TeamInvite {
  id: string;
  teamId: string;
  userId: string;
  status: InviteStatus;
  createdAt: string;
  user: { id: string; username: string };
  team?: { id: string; name: string };
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  members?: TeamMember[];
  invites?: TeamInvite[];
  memberCount?: number;
  myRole?: TeamRole;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
}

export interface InviteMemberRequest {
  username: string;
}

export interface UpdateMemberRoleRequest {
  role: TeamRole;
}
