<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useLabelsStore } from '@/stores/labels.store';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useToast } from '@/composables/useToast';
import WorkspaceLayout from '@/components/layout/WorkspaceLayout.vue';
import NxButton from '@/components/ui/NxButton.vue';
import NxInput from '@/components/ui/NxInput.vue';
import NxSpinner from '@/components/ui/NxSpinner.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';
import type { Label } from '@/types';

const route = useRoute();
const labelsStore = useLabelsStore();
const workspaceStore = useWorkspaceStore();
const toast = useToast();

const workspaceId = computed(() => route.params.workspaceId as string);

// Create form state
const showCreateForm = ref(false);
const newLabelName = ref('');
const newLabelColor = ref('#3B82F6');
const isCreating = ref(false);
const createError = ref('');

// Edit state
const editingLabelId = ref<string | null>(null);
const editedName = ref('');
const editedColor = ref('');
const isSaving = ref(false);

// Delete state
const deletingLabel = ref<Label | null>(null);
const isDeleting = ref(false);

// Predefined colors
const predefinedColors = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#14B8A6', // Teal
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#0EA5E9', // Sky
  '#10B981', // Emerald
];

const canManageLabels = computed(() => workspaceStore.canManageLabels);

async function loadLabels() {
  try {
    await labelsStore.fetchLabels(workspaceId.value);
  } catch (error) {
    toast.error('Failed to load labels');
  }
}

function startCreate() {
  showCreateForm.value = true;
  newLabelName.value = '';
  newLabelColor.value = '#3B82F6';
  createError.value = '';
}

function cancelCreate() {
  showCreateForm.value = false;
  newLabelName.value = '';
  createError.value = '';
}

async function submitCreate() {
  if (!newLabelName.value.trim()) {
    createError.value = 'Label name is required';
    return;
  }

  if (newLabelName.value.trim().length > 50) {
    createError.value = 'Label name must be less than 50 characters';
    return;
  }

  isCreating.value = true;
  createError.value = '';

  try {
    await labelsStore.createLabel(workspaceId.value, {
      name: newLabelName.value.trim(),
      color: newLabelColor.value,
    });
    cancelCreate();
    toast.success('Label created');
  } catch (error) {
    createError.value = labelsStore.error || 'Failed to create label';
  } finally {
    isCreating.value = false;
  }
}

function startEdit(label: Label) {
  editingLabelId.value = label.id;
  editedName.value = label.name;
  editedColor.value = label.color;
}

function cancelEdit() {
  editingLabelId.value = null;
  editedName.value = '';
  editedColor.value = '';
}

async function saveEdit() {
  if (!editingLabelId.value || !editedName.value.trim()) return;

  isSaving.value = true;
  try {
    await labelsStore.updateLabel(workspaceId.value, editingLabelId.value, {
      name: editedName.value.trim(),
      color: editedColor.value,
    });
    cancelEdit();
    toast.success('Label updated');
  } catch (error) {
    toast.error('Failed to update label');
  } finally {
    isSaving.value = false;
  }
}

function confirmDelete(label: Label) {
  deletingLabel.value = label;
}

async function handleDelete() {
  if (!deletingLabel.value) return;

  isDeleting.value = true;
  try {
    await labelsStore.deleteLabel(workspaceId.value, deletingLabel.value.id);
    deletingLabel.value = null;
    toast.success('Label deleted');
  } catch (error) {
    toast.error('Failed to delete label');
  } finally {
    isDeleting.value = false;
  }
}

onMounted(() => {
  loadLabels();
});

watch(workspaceId, () => {
  loadLabels();
});
</script>

<template>
  <WorkspaceLayout>
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Labels
          </h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage labels for organizing tasks in this workspace
          </p>
        </div>

        <NxButton
          v-if="canManageLabels && !showCreateForm"
          @click="startCreate"
        >
          <svg
            class="w-4 h-4 mr-2"
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
          Create Label
        </NxButton>
      </div>

      <!-- Create Form -->
      <div
        v-if="showCreateForm"
        class="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
      >
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Create New Label
        </h3>

        <div class="space-y-4">
          <div>
            <NxInput
              v-model="newLabelName"
              label="Label Name"
              placeholder="Enter label name"
              :error="createError"
              :disabled="isCreating"
              @keyup.enter="submitCreate"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div class="flex items-center gap-3">
              <div class="flex gap-2 flex-wrap">
                <button
                  v-for="color in predefinedColors"
                  :key="color"
                  type="button"
                  :class="[
                    'w-8 h-8 rounded-full border-2 transition-transform hover:scale-110',
                    newLabelColor === color ? 'border-gray-900 dark:border-white ring-2 ring-offset-2 ring-primary-500' : 'border-transparent',
                  ]"
                  :style="{ backgroundColor: color }"
                  @click="newLabelColor = color"
                />
              </div>
              <div class="flex items-center gap-2">
                <input
                  v-model="newLabelColor"
                  type="color"
                  class="w-10 h-10 rounded cursor-pointer"
                >
                <span class="text-sm text-gray-500 dark:text-gray-400 font-mono">
                  {{ newLabelColor }}
                </span>
              </div>
            </div>
          </div>

          <!-- Preview -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preview
            </label>
            <span
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
              :style="{ backgroundColor: newLabelColor }"
            >
              {{ newLabelName || 'Label Preview' }}
            </span>
          </div>

          <div class="flex gap-2">
            <NxButton
              :loading="isCreating"
              :disabled="!newLabelName.trim()"
              @click="submitCreate"
            >
              Create Label
            </NxButton>
            <NxButton
              variant="secondary"
              :disabled="isCreating"
              @click="cancelCreate"
            >
              Cancel
            </NxButton>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div
        v-if="labelsStore.isLoading"
        class="flex justify-center py-12"
      >
        <NxSpinner size="lg" />
      </div>

      <!-- Labels List -->
      <template v-else>
        <!-- Empty State -->
        <div
          v-if="labelsStore.labels.length === 0"
          class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <svg
            class="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No labels yet
          </h3>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Create labels to categorize and organize your tasks.
          </p>
          <div
            v-if="canManageLabels"
            class="mt-4"
          >
            <NxButton @click="startCreate">
              Create First Label
            </NxButton>
          </div>
        </div>

        <!-- Labels Table -->
        <div
          v-else
          class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Label
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Color
                </th>
                <th
                  v-if="canManageLabels"
                  class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="label in labelsStore.sortedLabels"
                :key="label.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <td class="px-6 py-4">
                  <!-- Edit Mode -->
                  <div
                    v-if="editingLabelId === label.id"
                    class="flex items-center gap-2"
                  >
                    <input
                      v-model="editedName"
                      type="text"
                      class="flex-1 px-2 py-1 border border-primary-500 rounded
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-1 focus:ring-primary-500"
                      @keyup.enter="saveEdit"
                      @keyup.escape="cancelEdit"
                    >
                  </div>

                  <!-- Display Mode -->
                  <span
                    v-else
                    class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                    :style="{ backgroundColor: label.color }"
                  >
                    {{ label.name }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <!-- Edit Mode -->
                  <div
                    v-if="editingLabelId === label.id"
                    class="flex items-center gap-2"
                  >
                    <input
                      v-model="editedColor"
                      type="color"
                      class="w-8 h-8 rounded cursor-pointer"
                    >
                    <span class="text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {{ editedColor }}
                    </span>
                  </div>

                  <!-- Display Mode -->
                  <div
                    v-else
                    class="flex items-center gap-2"
                  >
                    <span
                      class="w-6 h-6 rounded-full"
                      :style="{ backgroundColor: label.color }"
                    />
                    <span class="text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {{ label.color }}
                    </span>
                  </div>
                </td>
                <td
                  v-if="canManageLabels"
                  class="px-6 py-4 text-right"
                >
                  <!-- Edit Mode Actions -->
                  <div
                    v-if="editingLabelId === label.id"
                    class="flex justify-end gap-2"
                  >
                    <NxButton
                      size="sm"
                      :loading="isSaving"
                      @click="saveEdit"
                    >
                      Save
                    </NxButton>
                    <NxButton
                      size="sm"
                      variant="ghost"
                      :disabled="isSaving"
                      @click="cancelEdit"
                    >
                      Cancel
                    </NxButton>
                  </div>

                  <!-- Display Mode Actions -->
                  <div
                    v-else
                    class="flex justify-end gap-2"
                  >
                    <button
                      class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                      title="Edit label"
                      @click="startEdit(label)"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      class="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
                      title="Delete label"
                      @click="confirmDelete(label)"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>

    <!-- Delete Confirmation -->
    <ConfirmModal
      :open="!!deletingLabel"
      title="Delete Label"
      :message="`Are you sure you want to delete the label '${deletingLabel?.name}'? This will remove it from all tasks.`"
      confirm-text="Delete"
      :is-loading="isDeleting"
      variant="danger"
      @close="deletingLabel = null"
      @confirm="handleDelete"
    />
  </WorkspaceLayout>
</template>
