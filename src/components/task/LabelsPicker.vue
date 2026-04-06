<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useLabelsStore } from '@/stores/labels.store';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useToast } from '@/composables/useToast';
import NxInput from '@/components/ui/NxInput.vue';
import NxButton from '@/components/ui/NxButton.vue';
import NxSpinner from '@/components/ui/NxSpinner.vue';

interface Props {
  modelValue: string[];
  workspaceId: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const labelsStore = useLabelsStore();
const workspaceStore = useWorkspaceStore();
const toast = useToast();

const isOpen = ref(false);
const searchQuery = ref('');
const showCreateForm = ref(false);
const newLabelName = ref('');
const newLabelColor = ref('#3B82F6');
const isCreating = ref(false);

// Predefined colors for quick selection
const predefinedColors = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#14B8A6', // Teal
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6B7280', // Gray
];

const filteredLabels = computed(() => {
  if (!searchQuery.value) return labelsStore.sortedLabels;
  const query = searchQuery.value.toLowerCase();
  return labelsStore.sortedLabels.filter((label) =>
    label.name.toLowerCase().includes(query)
  );
});

const selectedLabels = computed(() =>
  labelsStore.labels.filter((label) => props.modelValue.includes(label.id))
);

const canCreateLabels = computed(() => workspaceStore.canManageLabels);

function toggleLabel(labelId: string) {
  const newValue = props.modelValue.includes(labelId)
    ? props.modelValue.filter((id) => id !== labelId)
    : [...props.modelValue, labelId];
  emit('update:modelValue', newValue);
}

function removeLabel(labelId: string) {
  emit('update:modelValue', props.modelValue.filter((id) => id !== labelId));
}

async function createLabel() {
  if (!newLabelName.value.trim()) return;

  isCreating.value = true;
  try {
    const label = await labelsStore.createLabel(props.workspaceId, {
      name: newLabelName.value.trim(),
      color: newLabelColor.value,
    });

    // Auto-select the new label
    emit('update:modelValue', [...props.modelValue, label.id]);

    // Reset form
    newLabelName.value = '';
    newLabelColor.value = '#3B82F6';
    showCreateForm.value = false;

    toast.success('Label created');
  } catch (error) {
    toast.error('Failed to create label');
  } finally {
    isCreating.value = false;
  }
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.labels-picker-dropdown')) {
    isOpen.value = false;
    showCreateForm.value = false;
  }
}

watch(isOpen, (open) => {
  if (open) {
    searchQuery.value = '';
    document.addEventListener('click', handleClickOutside);
  } else {
    document.removeEventListener('click', handleClickOutside);
  }
});

onMounted(async () => {
  if (labelsStore.labels.length === 0) {
    try {
      await labelsStore.fetchLabels(props.workspaceId);
    } catch (error) {
      // Silent fail - labels will be empty
    }
  }
});
</script>

<template>
  <div class="relative labels-picker-dropdown">
    <!-- Selected Labels Display -->
    <div
      :class="[
        'min-h-10 px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 cursor-pointer',
        'border-gray-300 dark:border-gray-600',
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-500',
      ]"
      @click="!disabled && (isOpen = !isOpen)"
    >
      <div
        v-if="selectedLabels.length === 0"
        class="text-gray-400 dark:text-gray-500"
      >
        Select labels...
      </div>
      <div
        v-else
        class="flex flex-wrap gap-1"
      >
        <span
          v-for="label in selectedLabels"
          :key="label.id"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
          :style="{ backgroundColor: label.color }"
        >
          {{ label.name }}
          <button
            type="button"
            class="hover:bg-white/20 rounded-full p-0.5"
            @click.stop="removeLabel(label.id)"
          >
            <svg
              class="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </span>
      </div>
    </div>

    <!-- Dropdown -->
    <div
      v-if="isOpen && !disabled"
      class="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg"
    >
      <!-- Search -->
      <div class="p-2 border-b border-gray-200 dark:border-gray-700">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search labels..."
          class="w-full px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600
                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                 focus:outline-none focus:ring-1 focus:ring-primary-500"
          @click.stop
        >
      </div>

      <!-- Labels List -->
      <div class="max-h-48 overflow-y-auto p-1">
        <div
          v-if="labelsStore.isLoading"
          class="flex justify-center py-4"
        >
          <NxSpinner size="sm" />
        </div>

        <template v-else-if="filteredLabels.length > 0">
          <button
            v-for="label in filteredLabels"
            :key="label.id"
            type="button"
            class="w-full flex items-center gap-2 px-3 py-2 text-left rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            @click.stop="toggleLabel(label.id)"
          >
            <span
              class="w-3 h-3 rounded-full shrink-0"
              :style="{ backgroundColor: label.color }"
            />
            <span class="flex-1 text-sm text-gray-900 dark:text-white truncate">
              {{ label.name }}
            </span>
            <svg
              v-if="modelValue.includes(label.id)"
              class="w-4 h-4 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </button>
        </template>

        <div
          v-else
          class="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          {{ searchQuery ? 'No labels found' : 'No labels created yet' }}
        </div>
      </div>

      <!-- Create Label Section -->
      <div
        v-if="canCreateLabels"
        class="border-t border-gray-200 dark:border-gray-700 p-2"
      >
        <template v-if="!showCreateForm">
          <button
            type="button"
            class="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded"
            @click.stop="showCreateForm = true"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create new label
          </button>
        </template>

        <template v-else>
          <div
            class="space-y-3"
            @click.stop
          >
            <NxInput
              v-model="newLabelName"
              placeholder="Label name"
              size="sm"
              :disabled="isCreating"
            />

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color
              </label>
              <div class="flex items-center gap-2">
                <div class="flex gap-1 flex-wrap">
                  <button
                    v-for="color in predefinedColors"
                    :key="color"
                    type="button"
                    :class="[
                      'w-6 h-6 rounded-full border-2',
                      newLabelColor === color ? 'border-gray-900 dark:border-white' : 'border-transparent',
                    ]"
                    :style="{ backgroundColor: color }"
                    @click="newLabelColor = color"
                  />
                </div>
                <input
                  v-model="newLabelColor"
                  type="color"
                  class="w-8 h-6 rounded cursor-pointer"
                >
              </div>
            </div>

            <div class="flex gap-2">
              <NxButton
                type="button"
                variant="ghost"
                size="sm"
                :disabled="isCreating"
                @click="showCreateForm = false"
              >
                Cancel
              </NxButton>
              <NxButton
                type="button"
                size="sm"
                :loading="isCreating"
                :disabled="!newLabelName.trim()"
                @click="createLabel"
              >
                Create
              </NxButton>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
