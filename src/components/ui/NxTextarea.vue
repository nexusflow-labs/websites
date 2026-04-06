<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted } from 'vue';

interface Props {
  modelValue?: string;
  label?: string;
  placeholder?: string;
  helper?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  maxLength?: number;
  autoResize?: boolean;
  id?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  rows: 3,
  autoResize: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const textareaId = computed(() => props.id || `textarea-${Math.random().toString(36).slice(2, 9)}`);
const textareaRef = ref<HTMLTextAreaElement>();

const textareaClasses = computed(() => {
  const base = [
    'block w-full rounded-lg border px-4 py-2',
    'text-gray-900 placeholder-gray-400',
    'transition-colors duration-150',
    'focus:outline-none focus:ring-1',
    'dark:text-white dark:placeholder-gray-500',
    'disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed',
    'resize-none',
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

const charCount = computed(() => props.modelValue?.length || 0);

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
}

function adjustHeight() {
  if (props.autoResize && textareaRef.value) {
    textareaRef.value.style.height = 'auto';
    textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`;
  }
}

watch(() => props.modelValue, () => {
  if (props.autoResize) {
    nextTick(adjustHeight);
  }
});

onMounted(() => {
  if (props.autoResize) {
    adjustHeight();
  }
});

function focus() {
  textareaRef.value?.focus();
}

defineExpose({ focus });
</script>

<template>
  <div class="w-full">
    <label
      v-if="label"
      :for="textareaId"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
    >
      {{ label }}
      <span v-if="required" class="text-danger-500">*</span>
    </label>

    <textarea
      ref="textareaRef"
      :id="textareaId"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :rows="rows"
      :maxlength="maxLength"
      :class="textareaClasses"
      @input="handleInput"
    />

    <div class="flex justify-between mt-1">
      <p
        v-if="error"
        class="text-sm text-danger-600 dark:text-danger-400"
      >
        {{ error }}
      </p>
      <p
        v-else-if="helper"
        class="text-sm text-gray-500 dark:text-gray-400"
      >
        {{ helper }}
      </p>
      <span v-else />

      <span
        v-if="maxLength"
        class="text-sm text-gray-400"
        :class="{ 'text-danger-500': charCount >= maxLength }"
      >
        {{ charCount }}/{{ maxLength }}
      </span>
    </div>
  </div>
</template>
