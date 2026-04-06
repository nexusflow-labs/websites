<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

interface Props {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  duration: 5000,
  dismissible: true,
});

const emit = defineEmits<{
  dismiss: [];
}>();

const isVisible = ref(true);
let timeoutId: ReturnType<typeof setTimeout>;

const typeClasses = computed(() => {
  const types: Record<string, { bg: string; icon: string; iconColor: string }> = {
    info: {
      bg: 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800',
      iconColor: 'text-primary-500',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`,
    },
    success: {
      bg: 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800',
      iconColor: 'text-success-500',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />`,
    },
    warning: {
      bg: 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800',
      iconColor: 'text-warning-500',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />`,
    },
    error: {
      bg: 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800',
      iconColor: 'text-danger-500',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />`,
    },
  };
  return types[props.type];
});

function dismiss() {
  isVisible.value = false;
  emit('dismiss');
}

onMounted(() => {
  if (props.duration > 0) {
    timeoutId = setTimeout(dismiss, props.duration);
  }
});

onUnmounted(() => {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
});
</script>

<template>
  <transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="opacity-0 translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-2"
  >
    <div
      v-if="isVisible"
      :class="[
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg',
        typeClasses.bg
      ]"
    >
      <svg
        class="h-5 w-5 flex-shrink-0"
        :class="typeClasses.iconColor"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        v-html="typeClasses.icon"
      />

      <div class="flex-1 min-w-0">
        <p
          v-if="title"
          class="text-sm font-medium text-gray-900 dark:text-white"
        >
          {{ title }}
        </p>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          {{ message }}
        </p>
      </div>

      <button
        v-if="dismissible"
        type="button"
        class="flex-shrink-0 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300
               focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
        @click="dismiss"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </transition>
</template>
