<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useToast } from '@/composables/useToast';
import type { MemberWithUser, MemberRole } from '@/types';
import WorkspaceLayout from '@/components/layout/WorkspaceLayout.vue';
import NxButton from '@/components/ui/NxButton.vue';
import NxInput from '@/components/ui/NxInput.vue';
import NxAvatar from '@/components/ui/NxAvatar.vue';
import NxBadge from '@/components/ui/NxBadge.vue';
import NxSelect, { type SelectOption } from '@/components/ui/NxSelect.vue';
import NxSpinner from '@/components/ui/NxSpinner.vue';
import InviteMemberModal from '@/components/workspace/InviteMemberModal.vue';
import RoleChangeModal from '@/components/workspace/RoleChangeModal.vue';
import RemoveMemberModal from '@/components/workspace/RemoveMemberModal.vue';

const route = useRoute();
const workspaceStore = useWorkspaceStore();
const toast = useToast();

const workspaceId = computed(() => route.params.workspaceId as string);

const searchQuery = ref('');
const isLoading = ref(false);

// Modals
const showInviteModal = ref(false);
const showRoleChangeModal = ref(false);
const showRemoveModal = ref(false);
const selectedMember = ref<MemberWithUser | null>(null);
const selectedNewRole = ref<MemberRole | null>(null);

const roleOptions: SelectOption[] = [
  { value: 'ADMIN', label: 'Admin', description: 'Can manage members, invitations, and labels' },
  { value: 'MEMBER', label: 'Member', description: 'Can view and contribute to projects' },
];

const filteredMembers = computed(() => {
  if (!searchQuery.value.trim()) {
    return workspaceStore.members;
  }

  const query = searchQuery.value.toLowerCase();
  return workspaceStore.members.filter(
    (member) =>
      member.user.fullName.toLowerCase().includes(query) ||
      member.user.email.toLowerCase().includes(query)
  );
});

function getRoleBadgeVariant(role: MemberRole): 'primary' | 'warning' | 'default' {
  switch (role) {
    case 'OWNER':
      return 'primary';
    case 'ADMIN':
      return 'warning';
    default:
      return 'default';
  }
}

function openRoleChangeModal(member: MemberWithUser, newRole: string) {
  selectedMember.value = member;
  selectedNewRole.value = newRole as MemberRole;
  showRoleChangeModal.value = true;
}

function openRemoveModal(member: MemberWithUser) {
  selectedMember.value = member;
  showRemoveModal.value = true;
}

async function handleRoleChange() {
  if (!selectedMember.value || !selectedNewRole.value) return;

  isLoading.value = true;

  try {
    await workspaceStore.updateMemberRole(
      workspaceId.value,
      selectedMember.value.userId,
      selectedNewRole.value
    );
    toast.success('Member role updated');
    showRoleChangeModal.value = false;
  } catch (error) {
    toast.error(workspaceStore.error || 'Failed to update member role');
  } finally {
    isLoading.value = false;
  }
}

async function handleRemoveMember() {
  if (!selectedMember.value) return;

  isLoading.value = true;

  try {
    await workspaceStore.removeMember(workspaceId.value, selectedMember.value.id);
    toast.success('Member removed');
    showRemoveModal.value = false;
  } catch (error) {
    toast.error(workspaceStore.error || 'Failed to remove member');
  } finally {
    isLoading.value = false;
  }
}

function handleInviteSent() {
  showInviteModal.value = false;
  toast.success('Invitation sent');
}

onMounted(async () => {
  if (workspaceId.value) {
    await workspaceStore.fetchMembers(workspaceId.value);
  }
});

watch(workspaceId, async (newId) => {
  if (newId) {
    await workspaceStore.fetchMembers(newId);
  }
});
</script>

<template>
  <WorkspaceLayout>
    <template #header>
      <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Members</h1>
    </template>

    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <!-- Search -->
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search members..."
              class="w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     placeholder-gray-400 dark:placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <svg
              class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <NxButton
          v-if="workspaceStore.canManageMembers"
          @click="showInviteModal = true"
        >
          <svg
            class="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Invite Member
        </NxButton>
      </div>

      <!-- Members list -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div v-if="workspaceStore.isLoading && workspaceStore.members.length === 0" class="p-8 text-center">
          <NxSpinner size="lg" />
          <p class="mt-4 text-gray-600 dark:text-gray-400">Loading members...</p>
        </div>

        <table v-else class="w-full">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Member
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="member in filteredMembers"
              :key="member.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <td class="px-6 py-4">
                <div class="flex items-center">
                  <NxAvatar
                    :src="member.user.avatar"
                    :name="member.user.fullName"
                    size="sm"
                  />
                  <span class="ml-3 font-medium text-gray-900 dark:text-white">
                    {{ member.user.fullName }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  {{ member.user.email }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div v-if="member.role === 'OWNER'">
                  <NxBadge :variant="getRoleBadgeVariant(member.role)">
                    {{ member.role }}
                  </NxBadge>
                </div>
                <div v-else-if="workspaceStore.canManageMembers" class="w-32">
                  <NxSelect
                    :model-value="member.role"
                    :options="roleOptions"
                    @update:model-value="(value) => openRoleChangeModal(member, value as string)"
                  />
                </div>
                <div v-else>
                  <NxBadge :variant="getRoleBadgeVariant(member.role)">
                    {{ member.role }}
                  </NxBadge>
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <button
                  v-if="member.role !== 'OWNER' && workspaceStore.canManageMembers"
                  class="text-danger-600 hover:text-danger-700 dark:text-danger-400 dark:hover:text-danger-300
                         text-sm font-medium"
                  @click="openRemoveModal(member)"
                >
                  Remove
                </button>
              </td>
            </tr>

            <tr v-if="filteredMembers.length === 0">
              <td colspan="4" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                <p v-if="searchQuery">No members found matching "{{ searchQuery }}"</p>
                <p v-else>No members yet</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Invite Member Modal -->
    <InviteMemberModal
      :open="showInviteModal"
      :workspace-id="workspaceId"
      @close="showInviteModal = false"
      @sent="handleInviteSent"
    />

    <!-- Role Change Modal -->
    <RoleChangeModal
      :open="showRoleChangeModal"
      :member="selectedMember"
      :new-role="selectedNewRole"
      :loading="isLoading"
      @close="showRoleChangeModal = false"
      @confirm="handleRoleChange"
    />

    <!-- Remove Member Modal -->
    <RemoveMemberModal
      :open="showRemoveModal"
      :member="selectedMember"
      :loading="isLoading"
      @close="showRemoveModal = false"
      @confirm="handleRemoveMember"
    />
  </WorkspaceLayout>
</template>
