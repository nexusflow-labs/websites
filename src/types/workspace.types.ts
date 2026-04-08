import type { User } from './auth.types';

export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceRequest {
  name: string;
  description?: string;
}

export interface Member {
  id: string;
  userId: string;
  workspaceId: string;
  role: MemberRole;
  createdAt: string;
}

export interface MemberWithUser extends Member {
  user: User;
}

export interface AddMemberRequest {
  userId: string;
  role: MemberRole;
}

export interface UpdateRoleRequest {
  newRole: MemberRole;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  workspaceId: string;
  createdAt: string;
}

export interface CreateLabelRequest {
  name: string;
  color?: string;
}

export interface UpdateLabelRequest {
  name?: string;
  color?: string;
}

export interface Invitation {
  id: string;
  email: string;
  invitedById: string;
  workspaceId: string;
  role: MemberRole;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
}

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface CreateInvitationRequest {
  email: string;
  role: MemberRole;
}

export interface AcceptInvitationRequest {
  token: string;
}

export interface RejectInvitationRequest {
  token: string;
}

export interface WorkspaceStatistics {
  workspaceId: string;
  totalProjects: number;
  totalTasks: number;
  totalMembers: number;
  tasksByStatus: { status: string; count: number }[];
  tasksByPriority: { priority: string; count: number }[];
  overdueTasks: number;
  tasksCompletedThisWeek: number;
  tasksCreatedThisWeek: number;
  projectStats: {
    projectId: string;
    projectName: string;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
  }[];
}
