<script setup lang="ts">
import type { MemberWithUser } from '@/types';
import NxModal from '@/components/ui/NxModal.vue';
import NxButton from '@/components/ui/NxButton.vue';
import NxAvatar from '@/components/ui/NxAvatar.vue';

interface Props {
  open: boolean;
  member: MemberWithUser | null;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  close: [];
  confirm: [];
}>();

function handleClose() {
  if (!props.loading) {
    emit('close');
  }
}

function handleConfirm() {
  emit('confirm');
}
</script>

<template>
  <NxModal :open="open" title="Remove Member" size="sm" @close="handleClose">
    <div v-if="member" class="space-y-4">
      <!-- Warning -->
      <div class="flex items-start p-4 bg-danger-50 dark:bg-danger-900/20 rounded-lg">
        <svg
          class="w-5 h-5 text-danger-600 dark:text-danger-400 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <p class="ml-3 text-sm text-danger-700 dark:text-danger-300">
          This action will remove the member's access to this workspace immediately.
        </p>
      </div>

      <!-- Member info -->
      <div class="flex items-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
        <NxAvatar
          :src="member.user.avatar"
          :name="member.user.fullName"
          size="md"
        />
        <div class="ml-3">
          <p class="font-medium text-gray-900 dark:text-white">
            {{ member.user.fullName }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ member.user.email }}
          </p>
        </div>
      </div>

      <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
        Are you sure you want to remove this member from the workspace?
      </p>
    </div>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <NxButton
          variant="secondary"
          :disabled="loading"
          @click="handleClose"
        >
          Cancel
        </NxButton>
        <NxButton
          variant="danger"
          :loading="loading"
          @click="handleConfirm"
        >
          Remove Member
        </NxButton>
      </div>
    </template>
  </NxModal>
</template>
