<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useTasksStore } from '@/stores/tasks.store';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useToast } from '@/composables/useToast';
import NxButton from '@/components/ui/NxButton.vue';
import NxSpinner from '@/components/ui/NxSpinner.vue';
import NxInput from '@/components/ui/NxInput.vue';
import NxAvatar from '@/components/ui/NxAvatar.vue';
import NxSelect from '@/components/ui/NxSelect.vue';
import CreateTaskModal from '@/components/task/CreateTaskModal.vue';

interface Props {
  taskId: string;
  projectId: string;
}

const props = defineProps<Props>();

const tasksStore = useTasksStore();
const workspaceStore = useWorkspaceStore();
const toast = useToast();

const showCreateModal = ref(false);

// Quick add state
const quickAddTitle = ref('');
const isQuickAdding = ref(false);

// Computed
const subtasks = computed(() => tasksStore.subtasks);
const isLoading = computed(() => tasksStore.isLoading);

const completedCount = computed(() =>
  subtasks.value.filter((t) => t.status === 'DONE').length
);

const progress = computed(() => {
  if (subtasks.value.length === 0) return 0;
  return Math.round((completedCount.value / subtasks.value.length) * 100);
});

const assigneeOptions = computed(() => [
  { value: '', label: 'Unassigned' },
  ...workspaceStore.members.map((m) => ({
    value: m.userId,
    label: m.user.fullName,
  })),
]);

async function toggleSubtaskStatus(subtaskId: string, currentStatus: string) {
  const newStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';

  try {
    await tasksStore.updateTask(props.projectId, subtaskId, { status: newStatus });
    toast.success(newStatus === 'DONE' ? 'Subtask completed' : 'Subtask reopened');
  } catch (error) {
    toast.error('Failed to update subtask');
  }
}

async function updateSubtaskAssignee(subtaskId: string, assigneeId: string) {
  try {
    await tasksStore.assignTask(props.projectId, subtaskId, {
      assigneeId: assigneeId || null,
    });
    toast.success('Assignee updated');
  } catch (error) {
    toast.error('Failed to update assignee');
  }
}

async function deleteSubtask(subtaskId: string) {
  try {
    await tasksStore.deleteTask(props.projectId, subtaskId);
    toast.success('Subtask deleted');
  } catch (error) {
    toast.error('Failed to delete subtask');
  }
}

async function quickAddSubtask() {
  if (!quickAddTitle.value.trim()) return;

  isQuickAdding.value = true;
  try {
    await tasksStore.createTask(props.projectId, {
      title: quickAddTitle.value.trim(),
      parentId: props.taskId,
    });
    quickAddTitle.value = '';
    toast.success('Subtask created');
  } catch (error) {
    toast.error('Failed to create subtask');
  } finally {
    isQuickAdding.value = false;
  }
}

function handleSubtaskCreated() {
  tasksStore.fetchSubtasks(props.projectId, props.taskId);
}

// Load subtasks when component mounts or taskId changes
watch(
  () => props.taskId,
  (newId) => {
    if (newId) {
      tasksStore.fetchSubtasks(props.projectId, newId);
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="space-y-4">
    <!-- Progress Bar -->
    <div
      v-if="subtasks.length > 0"
      class="space-y-1"
    >
      <div class="flex justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">Progress</span>
        <span class="font-medium text-gray-900 dark:text-white">
          {{ completedCount }}/{{ subtasks.length }} completed
        </span>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          class="bg-green-500 h-2 rounded-full transition-all duration-300"
          :style="{ width: `${progress}%` }"
        />
      </div>
    </div>

    <!-- Quick Add -->
    <div class="flex gap-2">
      <NxInput
        v-model="quickAddTitle"
        placeholder="Add a subtask..."
        class="flex-1"
        :disabled="isQuickAdding"
        @keyup.enter="quickAddSubtask"
      />
      <NxButton
        size="sm"
        :loading="isQuickAdding"
        :disabled="!quickAddTitle.trim()"
        @click="quickAddSubtask"
      >
        Add
      </NxButton>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="flex justify-center py-8"
    >
      <NxSpinner />
    </div>

    <!-- Subtasks List -->
    <template v-else>
      <!-- Empty State -->
      <div
        v-if="subtasks.length === 0"
        class="text-center py-8"
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          No subtasks yet
        </p>
      </div>

      <!-- Subtask List -->
      <div
        v-else
        class="space-y-2"
      >
        <div
          v-for="subtask in subtasks"
          :key="subtask.id"
          :class="[
            'flex items-center gap-3 p-3 rounded-lg border',
            subtask.status === 'DONE'
              ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
          ]"
        >
          <!-- Checkbox -->
          <button
            :class="[
              'shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
              subtask.status === 'DONE'
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 dark:border-gray-600 hover:border-green-500',
            ]"
            @click="toggleSubtaskStatus(subtask.id, subtask.status)"
          >
            <svg
              v-if="subtask.status === 'DONE'"
              class="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="3"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </button>

          <!-- Title -->
          <span
            :class="[
              'flex-1 text-sm',
              subtask.status === 'DONE'
                ? 'line-through text-gray-500 dark:text-gray-400'
                : 'text-gray-900 dark:text-white',
            ]"
          >
            {{ subtask.title }}
          </span>

          <!-- Assignee -->
          <div class="w-32">
            <NxSelect
              :model-value="subtask.assigneeId || ''"
              :options="assigneeOptions"
              size="sm"
              @update:model-value="(val) => updateSubtaskAssignee(subtask.id, val)"
            />
          </div>

          <!-- Delete Button -->
          <button
            class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            title="Delete subtask"
            @click="deleteSubtask(subtask.id)"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </template>

    <!-- Create Full Subtask Button -->
    <div class="pt-2">
      <NxButton
        variant="ghost"
        size="sm"
        @click="showCreateModal = true"
      >
        <svg
          class="w-4 h-4 mr-1"
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
        Add detailed subtask
      </NxButton>
    </div>

    <!-- Create Subtask Modal -->
    <CreateTaskModal
      :open="showCreateModal"
      :project-id="projectId"
      :parent-id="taskId"
      @close="showCreateModal = false"
      @created="handleSubtaskCreated"
    />
  </div>
</template>
