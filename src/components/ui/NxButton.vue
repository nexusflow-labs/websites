<script setup lang="ts">
import { computed } from 'vue';
import NxSpinner from './NxSpinner.vue';

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  loading?: boolean;
  disabled?: boolean;
  icon?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  loading: false,
  disabled: false,
  icon: false,
});

const classes = computed(() => {
  const base = [
    'inline-flex items-center justify-center font-medium rounded-lg',
    'transition-colors duration-150 ease-in-out',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ];

  // Variants
  const variants: Record<string, string> = {
    primary: [
      'bg-primary-600 text-white',
      'hover:bg-primary-700',
      'focus-visible:ring-primary-500',
      'dark:bg-primary-500 dark:hover:bg-primary-600',
    ].join(' '),
    secondary: [
      'bg-gray-100 text-gray-900',
      'hover:bg-gray-200',
      'focus-visible:ring-gray-500',
      'dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
    ].join(' '),
    danger: [
      'bg-danger-600 text-white',
      'hover:bg-danger-700',
      'focus-visible:ring-danger-500',
      'dark:bg-danger-500 dark:hover:bg-danger-600',
    ].join(' '),
    ghost: [
      'bg-transparent text-gray-700',
      'hover:bg-gray-100',
      'focus-visible:ring-gray-500',
      'dark:text-gray-300 dark:hover:bg-gray-800',
    ].join(' '),
  };

  // Sizes
  const sizes: Record<string, string> = {
    sm: props.icon ? 'p-1.5' : 'px-3 py-1.5 text-sm',
    md: props.icon ? 'p-2' : 'px-4 py-2 text-sm',
    lg: props.icon ? 'p-2.5' : 'px-6 py-2.5 text-base',
  };

  return [...base, variants[props.variant], sizes[props.size]].join(' ');
});

const spinnerSize = computed(() => {
  const sizeMap: Record<string, 'sm' | 'md' | 'lg'> = {
    sm: 'sm',
    md: 'sm',
    lg: 'md',
  };
  return sizeMap[props.size];
});
</script>

<template>
  <button
    :type="type"
    :class="classes"
    :disabled="disabled || loading"
  >
    <NxSpinner
      v-if="loading"
      :size="spinnerSize"
      class="mr-2"
    />
    <slot />
  </button>
</template>
