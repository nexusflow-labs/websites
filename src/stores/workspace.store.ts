import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { workspacesApi } from '@/api/workspaces.api';
import { invitationsApi } from '@/api/invitations.api';
import { getErrorMessage } from '@/api/http';
import type {
  Workspace,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  MemberWithUser,
  MemberRole,
  Invitation,
  CreateInvitationRequest,
} from '@/types';

export const useWorkspaceStore = defineStore('workspace', () => {
  // State
  const workspaces = ref<Workspace[]>([]);
  const currentWorkspace = ref<Workspace | null>(null);
  const members = ref<MemberWithUser[]>([]);
  const memberByUserId = ref<Record<string, MemberWithUser>>({});
  const invitations = ref<Invitation[]>([]);
  const userRole = ref<MemberRole | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const isOwner = computed(() => userRole.value === 'OWNER');
  const isAdmin = computed(() => userRole.value === 'ADMIN' || isOwner.value);
  const isMember = computed(() => userRole.value === 'MEMBER' || isAdmin.value);
  const canManageMembers = computed(() => isAdmin.value);
  const canManageLabels = computed(() => isAdmin.value);
  const canDeleteWorkspace = computed(() => isOwner.value);

  // Find current user's membership
  const currentMembership = computed(() => {
    // This would typically use the auth store's user ID
    // For now, we find the member with OWNER role as a fallback
    return members.value.find((m) => m.role === userRole.value);
  });

  function rebuildMemberByUserId(nextMembers: MemberWithUser[]): void {
    memberByUserId.value = Object.fromEntries(nextMembers.map((member) => [member.userId, member]));
  }

  function setMember(member: MemberWithUser): void {
    memberByUserId.value[member.userId] = member;
  }

  function removeMemberByUserId(userId: string): void {
    if (!memberByUserId.value[userId]) return;

    const { [userId]: _removed, ...rest } = memberByUserId.value;
    memberByUserId.value = rest;
  }

  // Actions - Workspaces
  async function fetchWorkspaces(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      workspaces.value = await workspacesApi.getAll();
    } catch (err) {
      error.value = getErrorMessage(err);
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchWorkspace(id: string): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      currentWorkspace.value = await workspacesApi.getById(id);
    } catch (err) {
      error.value = getErrorMessage(err);
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  }

  async function createWorkspace(data: CreateWorkspaceRequest): Promise<Workspace> {
    isLoading.value = true;
    error.value = null;

    try {
      const workspace = await workspacesApi.create(data);
      workspaces.value.push(workspace);
      return workspace;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateWorkspace(id: string, data: UpdateWorkspaceRequest): Promise<Workspace> {
    isLoading.value = true;
    error.value = null;

    try {
      const updated = await workspacesApi.update(id, data);
      // Update in list
      const index = workspaces.value.findIndex((w) => w.id === id);
      if (index !== -1) {
        workspaces.value[index] = updated;
      }
      // Update current if same
      if (currentWorkspace.value?.id === id) {
        currentWorkspace.value = updated;
      }
      return updated;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteWorkspace(id: string): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      await workspacesApi.delete(id);
      workspaces.value = workspaces.value.filter((w) => w.id !== id);
      if (currentWorkspace.value?.id === id) {
        currentWorkspace.value = null;
      }
    } catch (err) {
      error.value = getErrorMessage(err);
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  }

  // Actions - Members
  async function fetchMembers(workspaceId: string): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      members.value = await workspacesApi.getMembers(workspaceId);
      rebuildMemberByUserId(members.value);
    } catch (err) {
      error.value = getErrorMessage(err);
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateMemberRole(
    workspaceId: string,
    memberUserId: string,
    newRole: MemberRole
  ): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      await workspacesApi.updateMemberRole(workspaceId, memberUserId, {
        newRole,
      });
      // Update local state
      const member = members.value.find((m) => m.id === memberUserId);
      if (member) {
        member.role = newRole;
        setMember(member);
      }
    } catch (err) {
      error.value = getErrorMessage(err);
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  }

  async function removeMember(workspaceId: string, memberId: string): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      await workspacesApi.removeMember(workspaceId, memberId);
      const member = members.value.find((m) => m.id === memberId);
      members.value = members.value.filter((m) => m.id !== memberId);
      if (member) {
        removeMemberByUserId(member.userId);
      }
    } catch (err) {
      error.value = getErrorMessage(err);
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  }

  // Actions - Invitations
  async function fetchInvitations(workspaceId: string): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      invitations.value = await invitationsApi.getAll(workspaceId);
    } catch (err) {
      error.value = getErrorMessage(err);
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  }

  async function createInvitation(
    workspaceId: string,
    data: CreateInvitationRequest
  ): Promise<Invitation> {
    isLoading.value = true;
    error.value = null;

    try {
      const invitation = await invitationsApi.create(workspaceId, data);
      invitations.value.push(invitation);
      return invitation;
    } catch (err) {
      error.value = getErrorMessage(err);
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  }

  async function cancelInvitation(workspaceId: string, invitationId: string): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      await invitationsApi.cancel(workspaceId, invitationId);
      invitations.value = invitations.value.filter((i) => i.id !== invitationId);
    } catch (err) {
      error.value = getErrorMessage(err);
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  }

  // Set current workspace with member role detection
  async function setCurrentWorkspace(id: string, userId?: string): Promise<void> {
    await fetchWorkspace(id);
    await fetchMembers(id);

    // Detect current user's role
    if (userId && members.value.length > 0) {
      const membership = members.value.find((m) => m.userId === userId);
      userRole.value = membership?.role || null;
    }
  }

  function setUserRole(role: MemberRole | null): void {
    userRole.value = role;
  }

  // Real-time mutations
  function addMemberFromRealtime(member: MemberWithUser): void {
    if (memberByUserId.value[member.userId]) return;
    members.value.push(member);
    setMember(member);
  }

  function removeMemberFromRealtime(memberId: string): void {
    const member = members.value.find((item) => item.id === memberId);
    members.value = members.value.filter((member) => member.id !== memberId);
    if (member) {
      removeMemberByUserId(member.userId);
    }
  }

  function updateMemberRoleFromRealtime(memberId: string, newRole: MemberRole): void {
    const member = members.value.find((item) => item.id === memberId);
    if (member) {
      member.role = newRole;
      setMember(member);
    }
  }

  function clearError(): void {
    error.value = null;
  }

  function reset(): void {
    workspaces.value = [];
    currentWorkspace.value = null;
    members.value = [];
    memberByUserId.value = {};
    invitations.value = [];
    userRole.value = null;
    isLoading.value = false;
    error.value = null;
  }

  return {
    // State
    workspaces,
    currentWorkspace,
    members,
    memberByUserId,
    invitations,
    userRole,
    isLoading,
    error,

    // Getters
    isOwner,
    isAdmin,
    isMember,
    canManageMembers,
    canManageLabels,
    canDeleteWorkspace,
    currentMembership,

    // Actions - Workspaces
    fetchWorkspaces,
    fetchWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,

    // Actions - Members
    fetchMembers,
    updateMemberRole,
    removeMember,

    // Actions - Invitations
    fetchInvitations,
    createInvitation,
    cancelInvitation,

    // Helpers
    setCurrentWorkspace,
    setUserRole,
    addMemberFromRealtime,
    removeMemberFromRealtime,
    updateMemberRoleFromRealtime,
    clearError,
    reset,
  };
});
