import http from './http';
import type {
  Workspace,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  MemberWithUser,
  AddMemberRequest,
  Member,
  UpdateRoleRequest,
  WorkspaceStatistics,
} from '@/types';

export const workspacesApi = {
  /**
   * Get all workspaces for current user
   */
  async getAll(): Promise<Workspace[]> {
    const response = await http.get<Workspace[]>('/workspaces');
    return response.data;
  },

  /**
   * Get workspace by ID
   */
  async getById(id: string): Promise<Workspace> {
    const response = await http.get<Workspace>(`/workspaces/${id}`);
    return response.data;
  },

  /**
   * Create new workspace
   */
  async create(data: CreateWorkspaceRequest): Promise<Workspace> {
    const response = await http.post<Workspace>('/workspaces', data);
    return response.data;
  },

  /**
   * Update workspace
   */
  async update(id: string, data: UpdateWorkspaceRequest): Promise<Workspace> {
    const response = await http.put<Workspace>(`/workspaces/${id}`, data);
    return response.data;
  },

  /**
   * Delete workspace
   */
  async delete(id: string): Promise<void> {
    await http.delete(`/workspaces/${id}`);
  },

  /**
   * Get workspace members
   */
  async getMembers(workspaceId: string): Promise<MemberWithUser[]> {
    const response = await http.get<MemberWithUser[]>(`/workspaces/${workspaceId}/members`);
    return response.data;
  },

  /**
   * Add member to workspace
   */
  async addMember(workspaceId: string, data: AddMemberRequest): Promise<Member> {
    const response = await http.post<Member>(`/workspaces/${workspaceId}/members`, data);
    return response.data;
  },

  /**
   * Update member role
   */
  async updateMemberRole(
    workspaceId: string,
    memberUserId: string,
    data: UpdateRoleRequest
  ): Promise<void> {
    await http.patch(`/workspaces/${workspaceId}/members/${memberUserId}/role`, data);
  },

  /**
   * Remove member from workspace
   */
  async removeMember(workspaceId: string, memberId: string): Promise<void> {
    await http.delete(`/workspaces/${workspaceId}/members/${memberId}`);
  },

  /**
   * Get workspace dashboard statistics
   */
  async getDashboard(workspaceId: string): Promise<WorkspaceStatistics> {
    const response = await http.get<WorkspaceStatistics>(`/workspaces/${workspaceId}/dashboard`);
    return response.data;
  },
};
