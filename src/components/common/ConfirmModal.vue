<script setup lang="ts">
import NxModal from '@/components/ui/NxModal.vue';
import NxButton from '@/components/ui/NxButton.vue';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'danger',
  loading: false,
});

const emit = defineEmits<{
  close: [];
  confirm: [];
}>();

function handleConfirm() {
  emit('confirm');
}

function handleClose() {
  if (!props.loading) {
    emit('close');
  }
}

const iconColors: Record<string, string> = {
  danger: 'text-danger-600 dark:text-danger-400',
  warning: 'text-warning-600 dark:text-warning-400',
  primary: 'text-primary-600 dark:text-primary-400',
};

const bgColors: Record<string, string> = {
  danger: 'bg-danger-100 dark:bg-danger-900/30',
  warning: 'bg-warning-100 dark:bg-warning-900/30',
  primary: 'bg-primary-100 dark:bg-primary-900/30',
};
</script>

<template>
  <NxModal :open="open" size="sm" @close="handleClose">
    <div class="flex items-start space-x-4">
      <div
        :class="[
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          bgColors[variant]
        ]"
      >
        <!-- Warning/Danger Icon -->
        <svg
          v-if="variant === 'danger' || variant === 'warning'"
          :class="['h-6 w-6', iconColors[variant]]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <!-- Info Icon -->
        <svg
          v-else
          :class="['h-6 w-6', iconColors[variant]]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <div class="flex-1">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ title }}
        </h3>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {{ message }}
        </p>
        <slot />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <NxButton
          variant="secondary"
          :disabled="loading"
          @click="handleClose"
        >
          {{ cancelText }}
        </NxButton>
        <NxButton
          :variant="variant === 'warning' ? 'primary' : variant"
          :loading="loading"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </NxButton>
      </div>
    </template>
  </NxModal>
</template>
