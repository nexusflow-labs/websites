<script setup lang="ts">
import { computed } from 'vue';
import { getInitials } from '@/utils';

interface Props {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
});

const sizeClasses = computed(() => {
  const sizes: Record<string, string> = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-16 w-16 text-xl',
  };
  return sizes[props.size];
});

const statusSizeClasses = computed(() => {
  const sizes: Record<string, string> = {
    xs: 'h-1.5 w-1.5',
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
    xl: 'h-4 w-4',
  };
  return sizes[props.size];
});

const statusColorClasses = computed(() => {
  const colors: Record<string, string> = {
    online: 'bg-success-500',
    offline: 'bg-gray-400',
    busy: 'bg-danger-500',
    away: 'bg-warning-500',
  };
  return props.status ? colors[props.status] : '';
});

const initials = computed(() => {
  if (props.name) {
    return getInitials(props.name);
  }
  return '';
});

const backgroundColor = computed(() => {
  if (!props.name) return 'bg-gray-400';

  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ];

  // Generate consistent color based on name
  let hash = 0;
  for (let i = 0; i < props.name.length; i++) {
    hash = props.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
});
</script>

<template>
  <div class="relative inline-flex">
    <img
      v-if="src"
      :src="src"
      :alt="alt || name || 'Avatar'"
      :class="[
        'rounded-full object-cover',
        sizeClasses
      ]"
    />
    <div
      v-else
      :class="[
        'rounded-full flex items-center justify-center text-white font-medium',
        sizeClasses,
        backgroundColor
      ]"
    >
      {{ initials }}
    </div>

    <!-- Status indicator -->
    <span
      v-if="status"
      :class="[
        'absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-gray-900',
        statusSizeClasses,
        statusColorClasses
      ]"
    />
  </div>
</template>
