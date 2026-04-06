<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useTasksStore } from '@/stores/tasks.store';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useLabelsStore } from '@/stores/labels.store';
import { useToast } from '@/composables/useToast';
import { formatDate, formatDateTime } from '@/utils';
import NxButton from '@/components/ui/NxButton.vue';
import NxSpinner from '@/components/ui/NxSpinner.vue';
import NxSelect from '@/components/ui/NxSelect.vue';
import NxAvatar from '@/components/ui/NxAvatar.vue';
import NxTextarea from '@/components/ui/NxTextarea.vue';
import NxTabs from '@/components/ui/NxTabs.vue';
import TaskComments from '@/components/task/TaskComments.vue';
import TaskAttachments from '@/components/task/TaskAttachments.vue';
import TaskSubtasks from '@/components/task/TaskSubtasks.vue';
import LabelsPicker from '@/components/task/LabelsPicker.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';
import type { TaskStatus, TaskPriority } from '@/types';

interface Props {
  open: boolean;
  taskId: string;
  projectId: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  deleted: [];
  updated: [];
}>();

const route = useRoute();
const tasksStore = useTasksStore();
const workspaceStore = useWorkspaceStore();
const labelsStore = useLabelsStore();
const toast = useToast();

const workspaceId = computed(() => route.params.workspaceId as string);

// Local edit state
const isEditingTitle = ref(false);
const editedTitle = ref('');
const isEditingDescription = ref(false);
const editedDescription = ref('');
const isSaving = ref(false);
const showDeleteConfirm = ref(false);
const isDeleting = ref(false);

// Tabs
const activeTab = ref('comments');
const tabs = [
  { id: 'comments', label: 'Comments' },
  { id: 'subtasks', label: 'Subtasks' },
  { id: 'attachments', label: 'Attachments' },
];

// Options
const statusOptions = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'DONE', label: 'Done' },
];

const priorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

const assigneeOptions = computed(() => [
  { value: '', label: 'Unassigned' },
  ...workspaceStore.members.map((m) => ({
    value: m.userId,
    label: m.user.fullName,
  })),
]);

const task = computed(() => tasksStore.currentTask);
const taskLabels = computed(() => tasksStore.currentTaskLabels);

const selectedLabelIds = computed({
  get: () => taskLabels.value.map((l) => l.id),
  set: async (newIds: string[]) => {
    if (!task.value) return;

    const currentIds = taskLabels.value.map((l) => l.id);
    const toAdd = newIds.filter((id) => !currentIds.includes(id));
    const toRemove = currentIds.filter((id) => !newIds.includes(id));

    try {
      for (const id of toAdd) {
        await tasksStore.addLabelToTask(task.value.id, id);
      }
      for (const id of toRemove) {
        await tasksStore.removeLabelFromTask(task.value.id, id);
      }
      emit('updated');
    } catch (error) {
      toast.error('Failed to update labels');
    }
  },
});

function getPriorityColor(priority: TaskPriority): string {
  const colors: Record<TaskPriority, string> = {
    LOW: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    MEDIUM: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    HIGH: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    URGENT: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  };
  return colors[priority];
}

function isOverdue(): boolean {
  if (!task.value?.dueDate || task.value.status === 'DONE') return false;
  return new Date(task.value.dueDate) < new Date();
}

// Load task data
async function loadTask() {
  if (!props.taskId) return;

  try {
    await Promise.all([
      tasksStore.fetchTask(props.projectId, props.taskId),
      tasksStore.fetchSubtasks(props.projectId, props.taskId),
    ]);
  } catch (error) {
    toast.error('Failed to load task');
    emit('close');
  }
}

// Title editing
function startEditTitle() {
  if (!task.value) return;
  editedTitle.value = task.value.title;
  isEditingTitle.value = true;
}

async function saveTitle() {
  if (!task.value || !editedTitle.value.trim()) return;
  if (editedTitle.value.trim() === task.value.title) {
    isEditingTitle.value = false;
    return;
  }

  isSaving.value = true;
  try {
    await tasksStore.updateTask(props.projectId, task.value.id, {
      title: editedTitle.value.trim(),
    });
    isEditingTitle.value = false;
    emit('updated');
  } catch (error) {
    toast.error('Failed to update title');
  } finally {
    isSaving.value = false;
  }
}

function cancelEditTitle() {
  isEditingTitle.value = false;
  editedTitle.value = '';
}

// Description editing
function startEditDescription() {
  if (!task.value) return;
  editedDescription.value = task.value.description || '';
  isEditingDescription.value = true;
}

async function saveDescription() {
  if (!task.value) return;

  isSaving.value = true;
  try {
    await tasksStore.updateTask(props.projectId, task.value.id, {
      description: editedDescription.value.trim() || undefined,
    });
    isEditingDescription.value = false;
    emit('updated');
  } catch (error) {
    toast.error('Failed to update description');
  } finally {
    isSaving.value = false;
  }
}

function cancelEditDescription() {
  isEditingDescription.value = false;
  editedDescription.value = '';
}

// Update handlers
async function updateStatus(status: TaskStatus) {
  if (!task.value) return;

  try {
    await tasksStore.updateTask(props.projectId, task.value.id, { status });
    toast.success('Status updated');
    emit('updated');
  } catch (error) {
    toast.error('Failed to update status');
  }
}

async function updatePriority(priority: TaskPriority) {
  if (!task.value) return;

  try {
    await tasksStore.updateTask(props.projectId, task.value.id, { priority });
    toast.success('Priority updated');
    emit('updated');
  } catch (error) {
    toast.error('Failed to update priority');
  }
}

async function updateAssignee(assigneeId: string) {
  if (!task.value) return;

  try {
    await tasksStore.assignTask(props.projectId, task.value.id, {
      assigneeId: assigneeId || null,
    });
    toast.success('Assignee updated');
    emit('updated');
  } catch (error) {
    toast.error('Failed to update assignee');
  }
}

async function updateDueDate(event: Event) {
  if (!task.value) return;
  const target = event.target as HTMLInputElement;

  try {
    await tasksStore.updateTask(props.projectId, task.value.id, {
      dueDate: target.value || null,
    });
    toast.success('Due date updated');
    emit('updated');
  } catch (error) {
    toast.error('Failed to update due date');
  }
}

// Delete task
async function handleDelete() {
  if (!task.value) return;

  isDeleting.value = true;
  try {
    await tasksStore.deleteTask(props.projectId, task.value.id);
    toast.success('Task deleted');
    showDeleteConfirm.value = false;
    emit('deleted');
    emit('close');
  } catch (error) {
    toast.error('Failed to delete task');
  } finally {
    isDeleting.value = false;
  }
}

function handleClose() {
  tasksStore.setCurrentTask(null);
  emit('close');
}

// Watch for task changes
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.taskId) {
      loadTask();
    }
  },
  { immediate: true }
);

watch(
  () => props.taskId,
  (newId) => {
    if (props.open && newId) {
      loadTask();
    }
  }
);
</script>

<template>
  <!-- Backdrop -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 bg-black/50 z-40"
        @click="handleClose"
      />
    </Transition>

    <!-- Drawer -->
    <Transition
      enter-active-class="transition-transform duration-300"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-300"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="open"
        class="fixed inset-y-0 right-0 w-full max-w-2xl bg-white dark:bg-gray-900 shadow-xl z-50 flex flex-col"
      >
        <!-- Loading State -->
        <div
          v-if="tasksStore.isLoadingTask"
          class="flex-1 flex items-center justify-center"
        >
          <NxSpinner size="lg" />
        </div>

        <!-- Task Content -->
        <template v-else-if="task">
          <!-- Header -->
          <div class="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div class="flex-1 pr-4">
              <!-- Title -->
              <div v-if="isEditingTitle">
                <input
                  v-model="editedTitle"
                  type="text"
                  class="w-full text-xl font-semibold px-2 py-1 border border-primary-500 rounded
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-primary-500"
                  @keyup.enter="saveTitle"
                  @keyup.escape="cancelEditTitle"
                >
                <div class="flex gap-2 mt-2">
                  <NxButton
                    size="sm"
                    :loading="isSaving"
                    @click="saveTitle"
                  >
                    Save
                  </NxButton>
                  <NxButton
                    size="sm"
                    variant="ghost"
                    :disabled="isSaving"
                    @click="cancelEditTitle"
                  >
                    Cancel
                  </NxButton>
                </div>
              </div>
              <h2
                v-else
                class="text-xl font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-primary-600"
                @click="startEditTitle"
              >
                {{ task.title }}
              </h2>

              <!-- Task ID -->
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Created {{ formatDateTime(task.createdAt) }}
              </p>
            </div>

            <!-- Close button -->
            <button
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="handleClose"
            >
              <svg
                class="w-5 h-5 text-gray-500"
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

          <!-- Content -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-6 space-y-6">
              <!-- Status, Priority, Assignee Row -->
              <div class="grid grid-cols-3 gap-4">
                <!-- Status -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <NxSelect
                    :model-value="task.status"
                    :options="statusOptions"
                    @update:model-value="updateStatus"
                  />
                </div>

                <!-- Priority -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <NxSelect
                    :model-value="task.priority"
                    :options="priorityOptions"
                    @update:model-value="updatePriority"
                  />
                </div>

                <!-- Assignee -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assignee
                  </label>
                  <NxSelect
                    :model-value="task.assigneeId || ''"
                    :options="assigneeOptions"
                    @update:model-value="updateAssignee"
                  />
                </div>
              </div>

              <!-- Due Date -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  :value="task.dueDate ? task.dueDate.split('T')[0] : ''"
                  :class="[
                    'w-full max-w-xs px-3 py-2 rounded-lg border bg-white dark:bg-gray-800',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                    isOverdue()
                      ? 'border-red-500 text-red-600 dark:text-red-400'
                      : 'border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white',
                  ]"
                  @change="updateDueDate"
                >
                <p
                  v-if="isOverdue()"
                  class="mt-1 text-sm text-red-600 dark:text-red-400"
                >
                  Overdue
                </p>
              </div>

              <!-- Labels -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Labels
                </label>
                <LabelsPicker
                  v-model="selectedLabelIds"
                  :workspace-id="workspaceId"
                />
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <div v-if="isEditingDescription">
                  <NxTextarea
                    v-model="editedDescription"
                    placeholder="Add a description..."
                    :rows="6"
                  />
                  <div class="flex gap-2 mt-2">
                    <NxButton
                      size="sm"
                      :loading="isSaving"
                      @click="saveDescription"
                    >
                      Save
                    </NxButton>
                    <NxButton
                      size="sm"
                      variant="ghost"
                      :disabled="isSaving"
                      @click="cancelEditDescription"
                    >
                      Cancel
                    </NxButton>
                  </div>
                </div>
                <div
                  v-else
                  :class="[
                    'min-h-24 p-3 rounded-lg border border-gray-200 dark:border-gray-700',
                    'bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:border-primary-500',
                  ]"
                  @click="startEditDescription"
                >
                  <p
                    v-if="task.description"
                    class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap"
                  >
                    {{ task.description }}
                  </p>
                  <p
                    v-else
                    class="text-gray-400 dark:text-gray-500"
                  >
                    Click to add a description...
                  </p>
                </div>
              </div>

              <!-- Tabs Section -->
              <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
                <NxTabs
                  v-model="activeTab"
                  :tabs="tabs"
                />

                <div class="mt-4">
                  <!-- Comments Tab -->
                  <TaskComments
                    v-if="activeTab === 'comments'"
                    :task-id="taskId"
                  />

                  <!-- Subtasks Tab -->
                  <TaskSubtasks
                    v-else-if="activeTab === 'subtasks'"
                    :task-id="taskId"
                    :project-id="projectId"
                  />

                  <!-- Attachments Tab -->
                  <TaskAttachments
                    v-else-if="activeTab === 'attachments'"
                    :task-id="taskId"
                    :workspace-id="workspaceId"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-4 border-t border-gray-200 dark:border-gray-700">
            <NxButton
              variant="danger"
              @click="showDeleteConfirm = true"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete Task
            </NxButton>
          </div>
        </template>

        <!-- No Task State -->
        <div
          v-else
          class="flex-1 flex items-center justify-center"
        >
          <p class="text-gray-500 dark:text-gray-400">
            Task not found
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Delete Confirmation -->
  <ConfirmModal
    :open="showDeleteConfirm"
    title="Delete Task"
    message="Are you sure you want to delete this task? This action cannot be undone."
    confirm-text="Delete"
    :is-loading="isDeleting"
    variant="danger"
    @close="showDeleteConfirm = false"
    @confirm="handleDelete"
  />
</template>
