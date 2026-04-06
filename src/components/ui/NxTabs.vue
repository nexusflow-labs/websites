<script setup lang="ts">
import { computed } from 'vue';

export interface Tab {
  id: string;
  label: string;
  icon?: string;
  badge?: string | number;
  disabled?: boolean;
}

interface Props {
  modelValue: string;
  tabs: Tab[];
  variant?: 'underline' | 'pills' | 'boxed';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'underline',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

function selectTab(tabId: string) {
  const tab = props.tabs.find((t) => t.id === tabId);
  if (tab && !tab.disabled) {
    emit('update:modelValue', tabId);
  }
}

const containerClasses = computed(() => {
  const variants: Record<string, string> = {
    underline: 'border-b border-gray-200 dark:border-gray-700',
    pills: 'bg-gray-100 dark:bg-gray-800 p-1 rounded-lg',
    boxed: 'border border-gray-200 dark:border-gray-700 rounded-lg p-1',
  };
  return variants[props.variant];
});

function getTabClasses(tab: Tab) {
  const isActive = props.modelValue === tab.id;
  const isDisabled = tab.disabled;

  const base = [
    'inline-flex items-center justify-center px-4 py-2 text-sm font-medium',
    'transition-colors duration-150',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
  ];

  if (isDisabled) {
    base.push('opacity-50 cursor-not-allowed');
  } else {
    base.push('cursor-pointer');
  }

  if (props.variant === 'underline') {
    base.push('-mb-px');
    if (isActive) {
      base.push(
        'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
      );
    } else if (!isDisabled) {
      base.push(
        'border-b-2 border-transparent text-gray-500 dark:text-gray-400',
        'hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
      );
    }
  } else if (props.variant === 'pills') {
    if (isActive) {
      base.push(
        'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm'
      );
    } else if (!isDisabled) {
      base.push(
        'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
      );
    }
  } else if (props.variant === 'boxed') {
    base.push('rounded-md');
    if (isActive) {
      base.push(
        'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
      );
    } else if (!isDisabled) {
      base.push(
        'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
      );
    }
  }

  return base.join(' ');
}
</script>

<template>
  <div>
    <nav :class="['flex space-x-1', containerClasses]" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="modelValue === tab.id"
        :aria-disabled="tab.disabled"
        :class="getTabClasses(tab)"
        @click="selectTab(tab.id)"
      >
        <span v-if="tab.icon" class="mr-2">
          <component :is="tab.icon" class="h-5 w-5" />
        </span>
        {{ tab.label }}
        <span
          v-if="tab.badge"
          class="ml-2 rounded-full bg-gray-200 dark:bg-gray-600 px-2 py-0.5 text-xs"
        >
          {{ tab.badge }}
        </span>
      </button>
    </nav>

    <div class="mt-4" role="tabpanel">
      <slot />
    </div>
  </div>
</template>
