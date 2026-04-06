<script setup lang="ts">
import { ref, watch } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useToast } from '@/composables/useToast';
import type { MemberRole } from '@/types';
import NxModal from '@/components/ui/NxModal.vue';
import NxInput from '@/components/ui/NxInput.vue';
import NxSelect, { type SelectOption } from '@/components/ui/NxSelect.vue';
import NxButton from '@/components/ui/NxButton.vue';

interface Props {
  open: boolean;
  workspaceId: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  sent: [];
}>();

const workspaceStore = useWorkspaceStore();
const toast = useToast();

const email = ref('');
const role = ref<MemberRole>('MEMBER');
const isSubmitting = ref(false);
const errors = ref<{ email?: string }>({});

const roleOptions: SelectOption[] = [
  { value: 'ADMIN', label: 'Admin', description: 'Can manage members, invitations, and labels' },
  { value: 'MEMBER', label: 'Member', description: 'Can view and contribute to projects' },
];

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      email.value = '';
      role.value = 'MEMBER';
      errors.value = {};
    }
  }
);

function validate(): boolean {
  errors.value = {};

  if (!email.value.trim()) {
    errors.value.email = 'Email is required';
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value.trim())) {
    errors.value.email = 'Please enter a valid email address';
    return false;
  }

  return true;
}

async function handleSubmit() {
  if (!validate()) return;

  isSubmitting.value = true;

  try {
    await workspaceStore.createInvitation(props.workspaceId, {
      email: email.value.trim(),
      role: role.value,
    });
    emit('sent');
  } catch (error) {
    toast.error(workspaceStore.error || 'Failed to send invitation');
  } finally {
    isSubmitting.value = false;
  }
}

function handleClose() {
  if (!isSubmitting.value) {
    emit('close');
  }
}
</script>

<template>
  <NxModal :open="open" title="Invite Member" @close="handleClose">
    <form id="invite-member-form" @submit.prevent="handleSubmit">
      <div class="space-y-4">
        <NxInput
          v-model="email"
          type="email"
          label="Email Address"
          placeholder="Enter email address"
          :error="errors.email"
          :disabled="isSubmitting"
          required
        />

        <NxSelect
          v-model="role"
          :options="roleOptions"
          label="Role"
          :disabled="isSubmitting"
        />

        <div class="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Role Permissions
          </h4>
          <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li v-if="role === 'ADMIN'" class="flex items-start">
              <svg
                class="w-4 h-4 mr-2 mt-0.5 text-success-500"
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
              Can manage workspace members and invitations
            </li>
            <li v-if="role === 'ADMIN'" class="flex items-start">
              <svg
                class="w-4 h-4 mr-2 mt-0.5 text-success-500"
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
              Can create and manage labels
            </li>
            <li class="flex items-start">
              <svg
                class="w-4 h-4 mr-2 mt-0.5 text-success-500"
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
              Can view and contribute to projects
            </li>
            <li class="flex items-start">
              <svg
                class="w-4 h-4 mr-2 mt-0.5 text-success-500"
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
              Can create and manage tasks
            </li>
          </ul>
        </div>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <NxButton
          type="button"
          variant="secondary"
          :disabled="isSubmitting"
          @click="handleClose"
        >
          Cancel
        </NxButton>
        <NxButton
          type="submit"
          form="invite-member-form"
          :loading="isSubmitting"
        >
          Send Invitation
        </NxButton>
      </div>
    </template>
  </NxModal>
</template>
