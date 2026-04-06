<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useToast } from '@/composables/useToast';
import type { Invitation } from '@/types';
import NxButton from '@/components/ui/NxButton.vue';
import NxBadge from '@/components/ui/NxBadge.vue';
import NxSpinner from '@/components/ui/NxSpinner.vue';
import InviteMemberModal from './InviteMemberModal.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';

interface Props {
  workspaceId: string;
}

const props = defineProps<Props>();

const workspaceStore = useWorkspaceStore();
const toast = useToast();

const isLoading = ref(false);
const showInviteModal = ref(false);
const showCancelModal = ref(false);
const selectedInvitation = ref<Invitation | null>(null);
const isCancelling = ref(false);

const pendingInvitations = computed(() =>
  workspaceStore.invitations.filter((i) => i.status === 'PENDING')
);

onMounted(async () => {
  if (props.workspaceId) {
    isLoading.value = true;
    try {
      await workspaceStore.fetchInvitations(props.workspaceId);
    } finally {
      isLoading.value = false;
    }
  }
});

watch(
  () => props.workspaceId,
  async (newId) => {
    if (newId) {
      isLoading.value = true;
      try {
        await workspaceStore.fetchInvitations(newId);
      } finally {
        isLoading.value = false;
      }
    }
  }
);

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatExpiresAt(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'Expired';
  } else if (diffDays === 0) {
    return 'Expires today';
  } else if (diffDays === 1) {
    return 'Expires tomorrow';
  } else {
    return `Expires in ${diffDays} days`;
  }
}

function openCancelModal(invitation: Invitation) {
  selectedInvitation.value = invitation;
  showCancelModal.value = true;
}

async function handleCancelInvitation() {
  if (!selectedInvitation.value) return;

  isCancelling.value = true;

  try {
    await workspaceStore.cancelInvitation(props.workspaceId, selectedInvitation.value.id);
    toast.success('Invitation cancelled');
    showCancelModal.value = false;
  } catch (error) {
    toast.error(workspaceStore.error || 'Failed to cancel invitation');
  } finally {
    isCancelling.value = false;
  }
}

function handleInviteSent() {
  showInviteModal.value = false;
  toast.success('Invitation sent');
}

function getRoleBadgeVariant(role: string): 'warning' | 'default' {
  return role === 'ADMIN' ? 'warning' : 'default';
}
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Pending Invitations
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage invitations sent to join this workspace
          </p>
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
          Send Invitation
        </NxButton>
      </div>

      <div v-if="isLoading" class="py-8 text-center">
        <NxSpinner size="lg" />
        <p class="mt-4 text-gray-600 dark:text-gray-400">Loading invitations...</p>
      </div>

      <div v-else-if="pendingInvitations.length === 0" class="py-8 text-center">
        <div class="w-12 h-12 mx-auto rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
          <svg
            class="w-6 h-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p class="text-gray-500 dark:text-gray-400">No pending invitations</p>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Send invitations to add new members to your workspace
        </p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th class="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th class="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th class="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Sent
              </th>
              <th class="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Expires
              </th>
              <th class="pb-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="invitation in pendingInvitations"
              :key="invitation.id"
            >
              <td class="py-4">
                <span class="text-sm text-gray-900 dark:text-white">
                  {{ invitation.email }}
                </span>
              </td>
              <td class="py-4">
                <NxBadge :variant="getRoleBadgeVariant(invitation.role)">
                  {{ invitation.role }}
                </NxBadge>
              </td>
              <td class="py-4">
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDate(invitation.createdAt) }}
                </span>
              </td>
              <td class="py-4">
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  {{ formatExpiresAt(invitation.expiresAt) }}
                </span>
              </td>
              <td class="py-4 text-right">
                <button
                  v-if="workspaceStore.canManageMembers"
                  class="text-danger-600 hover:text-danger-700 dark:text-danger-400 dark:hover:text-danger-300
                         text-sm font-medium"
                  @click="openCancelModal(invitation)"
                >
                  Cancel
                </button>
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

    <!-- Cancel Invitation Modal -->
    <ConfirmModal
      :open="showCancelModal"
      title="Cancel Invitation"
      :message="`Are you sure you want to cancel the invitation sent to ${selectedInvitation?.email}?`"
      confirm-text="Cancel Invitation"
      variant="danger"
      :loading="isCancelling"
      @close="showCancelModal = false"
      @confirm="handleCancelInvitation"
    />
  </div>
</template>
