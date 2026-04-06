<script setup lang="ts">
import { computed, ref, nextTick, onMounted, onUnmounted } from 'vue';
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface Props {
  modelValue?: string | string[];
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  helper?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  multiple?: boolean;
  searchable?: boolean;
  id?: string;
  minWidth?: string;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select an option',
  disabled: false,
  required: false,
  multiple: false,
  searchable: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]];
}>();

// Refs & State
const selectId = computed(() => props.id || `select-${Math.random().toString(36).slice(2, 9)}`);
const searchQuery = ref('');
const buttonRef = ref<any>(null);
const dropdownStyles = ref({
  top: '0px',
  left: '0px',
  width: '0px',
  minWidth: '0px',

});

const updatePosition = async () => {
  await nextTick();
  const el = buttonRef.value?.$el || buttonRef.value;
  if (el) {
    const rect = el.getBoundingClientRect();
    dropdownStyles.value = {
      top: `${rect.bottom + window.scrollY}px`,
      left: `${rect.left + window.scrollX}px`,
      width: props.minWidth || `${rect.width}px`,
      minWidth: props.minWidth || '0px',
    };
  }
};

onMounted(() => {
  window.addEventListener('scroll', updatePosition, true);
  window.addEventListener('resize', updatePosition);
});

onUnmounted(() => {
  window.removeEventListener('scroll', updatePosition, true);
  window.removeEventListener('resize', updatePosition);
});

const filteredOptions = computed(() => {
  if (!props.searchable || !searchQuery.value) return props.options;
  const query = searchQuery.value.toLowerCase();
  return props.options.filter(
    (opt) => opt.label.toLowerCase().includes(query) || opt.description?.toLowerCase().includes(query)
  );
});

const selectedOption = computed(() => {
  if (props.multiple) {
    const values = props.modelValue as string[] | undefined;
    return props.options.filter((opt) => values?.includes(opt.value));
  }
  return props.options.find((opt) => opt.value === props.modelValue);
});

const displayValue = computed(() => {
  if (props.multiple) {
    const selected = selectedOption.value as SelectOption[];
    if (!selected || selected.length === 0) return props.placeholder;
    return selected.length === 1 ? selected[0].label : `${selected.length} selected`;
  }
  return (selectedOption.value as SelectOption)?.label || props.placeholder;
});

function handleChange(value: string | string[]) {
  emit('update:modelValue', value);
  searchQuery.value = '';
}

const buttonClasses = computed(() => {
  const base = [
    'relative w-full rounded-lg border py-2 pl-4 pr-10 text-left transition-colors duration-150',
    'focus:outline-none focus:ring-1 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed',
  ];
  if (props.error) {
    base.push('border-danger-500 focus:border-danger-500 focus:ring-danger-500 dark:border-danger-400');
  } else {
    base.push('border-gray-300 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800');
  }
  return base.join(' ');
});
</script>

<template>
  <div class="w-full">
    <label
      v-if="label"
      :for="selectId"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
    >
      {{ label }} <span
        v-if="required"
        class="text-danger-500"
      >*</span>
    </label>

    <Listbox
      v-slot="{ open }"
      :model-value="modelValue"
      :multiple="multiple"
      :disabled="disabled"
      @update:model-value="handleChange"
    >
      <div class="relative">
        <ListboxButton
          :id="selectId"
          ref="buttonRef"
          :class="buttonClasses"
          @click="updatePosition"
        >
          <span :class="['block truncate', !selectedOption ? 'text-gray-400' : 'text-gray-900 dark:text-white']">
            {{ displayValue }}
          </span>
          <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              class="h-5 w-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z"
                clip-rule="evenodd"
              />
            </svg>
          </span>
        </ListboxButton>

        <teleport to="body">
          <div
            v-if="open"
            :style="{
              position: 'absolute',
              top: dropdownStyles.top,
              left: dropdownStyles.left,
              width: dropdownStyles.width,
              minWidth: dropdownStyles.minWidth,
              zIndex: 9999
            }"
            class="pointer-events-none"
          >
            <transition
              leave-active-class="transition duration-100 ease-in"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
              @before-enter="updatePosition"
            >
              <ListboxOptions
                static
                class="pointer-events-auto mt-1 max-h-60 w-full overflow-auto rounded-lg
                       bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5
                       focus:outline-none"
              >
                <div
                  v-if="searchable"
                  class="px-3 py-2"
                >
                  <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Search..."
                    class="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-primary-500"
                    @click.stop
                  >
                </div>

                <div
                  v-if="filteredOptions.length === 0"
                  class="px-4 py-2 text-sm text-gray-500"
                >
                  No options found
                </div>

                <ListboxOption
                  v-for="option in filteredOptions"
                  :key="option.value"
                  v-slot="{ active, selected }"
                  :value="option.value"
                  :disabled="option.disabled"
                  as="template"
                >
                  <li
                    :class="['relative cursor-pointer select-none py-2 pl-10 pr-4', active ? 'bg-primary-50 dark:bg-primary-900/20' : '', option.disabled ? 'opacity-50 cursor-not-allowed' : '']"
                  >
                    <span
                      :class="['block truncate', selected ? 'font-medium text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white']"
                    >
                      {{ option.label }}
                    </span>
                    <span
                      v-if="option.description"
                      class="block truncate text-xs text-gray-500 mt-0.5"
                    >{{ option.description }}</span>
                    <span
                      v-if="selected"
                      class="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600 dark:text-primary-400"
                    >
                      <svg
                        class="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </span>
                  </li>
                </ListboxOption>
              </ListboxOptions>
            </transition>
          </div>
        </teleport>
      </div>
    </Listbox>

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