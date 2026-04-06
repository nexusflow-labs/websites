<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  modelValue?: boolean;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const checkboxId = computed(() => props.id || `checkbox-${Math.random().toString(36).slice(2, 9)}`);

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.checked);
}
</script>

<template>
  <div class="flex items-start">
    <div class="flex items-center h-5">
      <input
        :id="checkboxId"
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        class="h-4 w-4 rounded border-gray-300 text-primary-600
               focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
               dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-offset-gray-900
               disabled:opacity-50 disabled:cursor-not-allowed"
        @change="handleChange"
      />
    </div>
    <div v-if="label || description" class="ml-3">
      <label
        v-if="label"
        :for="checkboxId"
        class="text-sm font-medium text-gray-700 dark:text-gray-300"
        :class="{ 'cursor-not-allowed opacity-50': disabled }"
      >
        {{ label }}
      </label>
      <p
        v-if="description"
        class="text-sm text-gray-500 dark:text-gray-400"
      >
        {{ description }}
      </p>
    </div>
  </div>
</template>
