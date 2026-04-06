<script setup lang="ts">
import { computed, ref } from 'vue';

interface Props {
  modelValue?: string | number;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  label?: string;
  placeholder?: string;
  helper?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  modelValue: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
}>();

const inputId = computed(() => props.id || `input-${Math.random().toString(36).slice(2, 9)}`);
const inputRef = ref<HTMLInputElement>();

const inputClasses = computed(() => {
  const base = [
    'block w-full rounded-lg border px-4 py-2',
    'text-gray-900 placeholder-gray-400',
    'transition-colors duration-150',
    'focus:outline-none focus:ring-1',
    'dark:text-white dark:placeholder-gray-500',
    'disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed',
  ];

  if (props.error) {
    base.push(
      'border-danger-500 focus:border-danger-500 focus:ring-danger-500',
      'dark:border-danger-400 dark:focus:border-danger-400'
    );
  } else {
    base.push(
      'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
      'dark:border-gray-600 dark:bg-gray-800 dark:focus:border-primary-400'
    );
  }

  return base.join(' ');
});

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const value = props.type === 'number' ? Number(target.value) : target.value;
  emit('update:modelValue', value);
}

function focus() {
  inputRef.value?.focus();
}

defineExpose({ focus });
</script>

<template>
  <div class="w-full">
    <label
      v-if="label"
      :for="inputId"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
    >
      {{ label }}
      <span v-if="required" class="text-danger-500">*</span>
    </label>

    <input
      ref="inputRef"
      :id="inputId"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :class="inputClasses"
      @input="handleInput"
    />

    <p
      v-if="error"
      class="mt-1 text-sm text-danger-600 dark:text-danger-400"
    >
      {{ error }}
    </p>
    <p
      v-else-if="helper"
      class="mt-1 text-sm text-gray-500 dark:text-gray-400"
    >
      {{ helper }}
    </p>
  </div>
</template>
