<script setup lang="ts">
import type { MemberWithUser, MemberRole } from '@/types';
import NxModal from '@/components/ui/NxModal.vue';
import NxButton from '@/components/ui/NxButton.vue';
import NxBadge from '@/components/ui/NxBadge.vue';
import NxAvatar from '@/components/ui/NxAvatar.vue';

interface Props {
  open: boolean;
  member: MemberWithUser | null;
  newRole: MemberRole | null;
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
</script>

<template>
  <NxModal :open="open" title="Change Member Role" size="sm" @close="handleClose">
    <div v-if="member && newRole" class="space-y-4">
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

      <!-- Role change info -->
      <div class="flex items-center justify-center space-x-4">
        <div class="text-center">
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Role</p>
          <NxBadge :variant="getRoleBadgeVariant(member.role)">
            {{ member.role }}
          </NxBadge>
        </div>
        <svg
          class="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M14 5l7 7m0 0l-7 7m7-7H3"
          />
        </svg>
        <div class="text-center">
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">New Role</p>
          <NxBadge :variant="getRoleBadgeVariant(newRole)">
            {{ newRole }}
          </NxBadge>
        </div>
      </div>

      <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
        Are you sure you want to change this member's role?
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
          :loading="loading"
          @click="handleConfirm"
        >
          Change Role
        </NxButton>
      </div>
    </template>
  </NxModal>
</template>
