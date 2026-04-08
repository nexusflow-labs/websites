<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { invitationsApi } from '@/api/invitations.api';
import { getErrorMessage } from '@/api/http';
import { useToast } from '@/composables/useToast';
import { useWorkspaceStore } from '@/stores/workspace.store';
import NxButton from '@/components/ui/NxButton.vue';
import NxSpinner from '@/components/ui/NxSpinner.vue';

type InvitationState = 'idle' | 'accepting' | 'success' | 'error';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const workspaceStore = useWorkspaceStore();

const state = ref<InvitationState>('idle');
const errorMessage = ref('');
const acceptedWorkspaceId = ref<string | null>(null);

const token = computed(() => {
  const queryToken = route.query.token;
  return Array.isArray(queryToken) ? queryToken[0] || '' : queryToken || '';
});

const title = computed(() => {
  if (!token.value) return 'Invitation not found';
  if (state.value === 'accepting') return 'Accepting invitation';
  if (state.value === 'success') return 'Invitation accepted';
  if (state.value === 'error') return 'Unable to accept invitation';
  return 'Workspace invitation';
});

const description = computed(() => {
  if (!token.value) {
    return 'This invitation link is missing its token. Open the original invite link and try again.';
  }

  if (state.value === 'accepting') {
    return 'We are adding your account to the workspace now.';
  }

  if (state.value === 'success') {
    return 'Your membership is active. Redirecting you to the workspace...';
  }

  if (state.value === 'error') {
    return errorMessage.value || 'The invitation could not be accepted.';
  }

  return 'Preparing your workspace access.';
});

async function acceptInvitation(): Promise<void> {
  if (!token.value || state.value === 'accepting') {
    return;
  }

  state.value = 'accepting';
  errorMessage.value = '';

  try {
    const member = await invitationsApi.accept({ token: token.value });
    acceptedWorkspaceId.value = member.workspaceId;
    workspaceStore.setUserRole(member.role);

    try {
      await workspaceStore.fetchWorkspaces();
    } catch (refreshError) {
      console.error('Failed to refresh workspaces after accepting invitation:', refreshError);
    }

    state.value = 'success';
    toast.success('Invitation accepted');

    window.setTimeout(() => {
      router.replace({
        name: 'workspaceDashboard',
        params: { workspaceId: member.workspaceId },
      });
    }, 1200);
  } catch (error) {
    state.value = 'error';
    errorMessage.value = getErrorMessage(error);
    toast.error(errorMessage.value || 'Failed to accept invitation');
  }
}

function goHome(): void {
  router.push({ name: 'home' });
}

onMounted(() => {
  if (!token.value) {
    state.value = 'error';
    errorMessage.value = 'Invitation token is missing.';
    return;
  }

  void acceptInvitation();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-soft p-8">
      <div class="flex justify-center mb-6">
        <div
          :class="[
            'w-14 h-14 rounded-full flex items-center justify-center',
            state === 'success'
              ? 'bg-success-100 text-success-600 dark:bg-success-900/20 dark:text-success-400'
              : state === 'error'
                ? 'bg-danger-100 text-danger-600 dark:bg-danger-900/20 dark:text-danger-400'
                : 'bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
          ]"
        >
          <NxSpinner v-if="state === 'accepting' || state === 'idle'" size="md" />

          <svg
            v-else-if="state === 'success'"
            class="w-7 h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>

          <svg
            v-else
            class="w-7 h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
            />
          </svg>
        </div>
      </div>

      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ title }}
        </h1>

        <p class="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
          {{ description }}
        </p>

        <p v-if="acceptedWorkspaceId" class="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Workspace ID: {{ acceptedWorkspaceId }}
        </p>
      </div>

      <div v-if="state === 'error'" class="mt-8 flex flex-col gap-3">
        <NxButton class="w-full" @click="acceptInvitation" :disabled="!token">
          Try Again
        </NxButton>
        <NxButton variant="secondary" class="w-full" @click="goHome">
          Go To Home
        </NxButton>
      </div>

      <div v-else-if="state === 'success'" class="mt-8">
        <NxButton class="w-full" @click="router.replace({ name: 'workspaceDashboard', params: { workspaceId: acceptedWorkspaceId } })">
          Open Workspace Now
        </NxButton>
      </div>
    </div>
  </div>
</template>
