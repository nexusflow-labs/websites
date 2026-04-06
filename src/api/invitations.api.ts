import http from './http';
import type {
  Invitation,
  CreateInvitationRequest,
  AcceptInvitationRequest,
  RejectInvitationRequest,
  Member,
} from '@/types';

export const invitationsApi = {
  /**
   * Get pending invitations for workspace
   */
  async getAll(workspaceId: string): Promise<Invitation[]> {
    const response = await http.get<Invitation[]>(`/workspaces/${workspaceId}/invitations`);
    return response.data;
  },

  /**
   * Create invitation
   */
  async create(workspaceId: string, data: CreateInvitationRequest): Promise<Invitation> {
    const response = await http.post<Invitation>(`/workspaces/${workspaceId}/invitations`, data);
    return response.data;
  },

  /**
   * Cancel invitation
   */
  async cancel(workspaceId: string, invitationId: string): Promise<void> {
    await http.delete(`/workspaces/${workspaceId}/invitations/${invitationId}`);
  },

  /**
   * Accept invitation
   */
  async accept(data: AcceptInvitationRequest): Promise<Member> {
    const response = await http.post<Member>('/invitations/accept', data);
    return response.data;
  },

  /**
   * Reject invitation
   */
  async reject(data: RejectInvitationRequest): Promise<void> {
    await http.post('/invitations/reject', data);
  },
};
