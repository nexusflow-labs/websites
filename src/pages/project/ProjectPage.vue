<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjectRoom, useSocketEvent } from '@/composables/useWebSocket';
import { useProjectsStore } from '@/stores/projects.store';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useTasksStore } from '@/stores/tasks.store';
import { useLabelsStore } from '@/stores/labels.store';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/composables/useToast';
import { formatDate } from '@/utils';
import WorkspaceLayout from '@/components/layout/WorkspaceLayout.vue';
import NxButton from '@/components/ui/NxButton.vue';
import NxSpinner from '@/components/ui/NxSpinner.vue';
import NxAvatar from '@/components/ui/NxAvatar.vue';
import NxSelect from '@/components/ui/NxSelect.vue';
import ProjectSettingsModal from '@/components/project/ProjectSettingsModal.vue';
import CreateTaskModal from '@/components/task/CreateTaskModal.vue';
import TaskDetailDrawer from '@/components/task/TaskDetailDrawer.vue';
import type { Task, TaskStatus, TaskPriority } from '@/types';

const route = useRoute();
const router = useRouter();
const projectsStore = useProjectsStore();
const workspaceStore = useWorkspaceStore();
const tasksStore = useTasksStore();
const labelsStore = useLabelsStore();
const authStore = useAuthStore();
const toast = useToast();

const workspaceId = computed(() => route.params.workspaceId as string);
const projectId = computed(() => route.params.projectId as string);

useProjectRoom(() => projectId.value);

useSocketEvent('task:created', ({ task }) => {
  tasksStore.addTaskFromRealtime(task);
});

useSocketEvent('task:updated', ({ task, updatedBy }) => {
  console.log('Received task update from socket', task, 'updatedBy:', updatedBy);
  tasksStore.updateTaskFromRealtime(task);

  if (updatedBy !== authStore.user?.id) {
    toast.info(`Task "${task.title}" was updated`);
  }
});

useSocketEvent('task:deleted', ({ taskId }) => {
  if (selectedTaskId.value === taskId) {
    showTaskDrawer.value = false;
    selectedTaskId.value = null;
  }

  tasksStore.removeTaskFromRealtime(taskId);
});

useSocketEvent('task:assigned', ({ taskId, assigneeId }) => {
  if (selectedTaskId.value === taskId) {
    tasksStore.fetchTask(projectId.value, taskId).catch(() => { });
  }

  tasksStore.updateTaskAssigned(taskId, assigneeId);

  if (assigneeId === authStore.user?.id) {
    toast.success('You have been assigned a task');
  }
});

// View state
const viewMode = ref<'board' | 'list'>('board');
const showSettingsModal = ref(false);
const showCreateTaskModal = ref(false);
const createTaskDefaultStatus = ref<TaskStatus>('TODO');

// Task detail drawer
const showTaskDrawer = ref(false);
const selectedTaskId = ref<string | null>(null);

// Filters
const searchQuery = ref('');
const priorityFilter = ref<TaskPriority | ''>('');
const assigneeFilter = ref<string>('');
const labelFilter = ref<string>('');

// Quick add task
const quickAddColumn = ref<TaskStatus | null>(null);
const quickAddTitle = ref('');
const isAddingTask = ref(false);

// Drag and drop
const draggedTask = ref<Task | null>(null);
const dragOverColumn = ref<TaskStatus | null>(null);

// Status columns configuration
const statusColumns: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'TODO', label: 'To Do', color: 'bg-gray-100 dark:bg-gray-700' },
  { status: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900/30' },
  { status: 'IN_REVIEW', label: 'In Review', color: 'bg-yellow-100 dark:bg-yellow-900/30' },
  { status: 'DONE', label: 'Done', color: 'bg-green-100 dark:bg-green-900/30' },
];

// Priority options
const priorityOptions = [
  { value: '', label: 'All Priorities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

// Loading state from store
const isLoading = computed(() => tasksStore.isLoading);
const tasks = computed(() => tasksStore.tasks);

// Computed
const tasksByStatus = computed(() => {
  const grouped: Record<TaskStatus, Task[]> = {
    TODO: [],
    IN_PROGRESS: [],
    IN_REVIEW: [],
    DONE: [],
  };

  let filteredTasks = tasks.value;

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filteredTasks = filteredTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
    );
  }

  // Apply priority filter
  if (priorityFilter.value) {
    filteredTasks = filteredTasks.filter((t) => t.priority === priorityFilter.value);
  }

  // Apply assignee filter
  if (assigneeFilter.value) {
    filteredTasks = filteredTasks.filter((t) => t.assigneeId === assigneeFilter.value);
  }

  // Group by status
  filteredTasks.forEach((task) => {
    if (grouped[task.status]) {
      grouped[task.status].push(task);
    }
  });

  return grouped;
});

// Label options for filter
const labelOptions = computed(() => [
  { value: '', label: 'All Labels' },
  ...labelsStore.labels.map((l) => ({
    value: l.id,
    label: l.name,
  })),
]);

const members = computed(() => {
  return workspaceStore.members.map((m) => ({
    value: m.userId,
    label: m.user.fullName,
  }));
});

const assigneeOptions = computed(() => [
  { value: '', label: 'All Assignees' },
  ...members.value,
]);

function getPriorityColor(priority: TaskPriority): string {
  const colors: Record<TaskPriority, string> = {
    LOW: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    MEDIUM: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    HIGH: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    URGENT: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  };
  return colors[priority];
}

function getPriorityLabel(priority: TaskPriority): string {
  const labels: Record<TaskPriority, string> = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    URGENT: 'Urgent',
  };
  return labels[priority];
}

function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === 'DONE') return false;
  return new Date(task.dueDate) < new Date();
}

async function loadProject() {
  try {
    await projectsStore.fetchProject(workspaceId.value, projectId.value);
  } catch (error) {
    toast.error('Failed to load project');
    router.push({ name: 'workspaceProjects', params: { workspaceId: workspaceId.value } });
  }
}

async function loadTasks() {
  try {
    await tasksStore.fetchTasks(projectId.value, {
      pageSize: 100,
      rootOnly: true,
    });
  } catch (error) {
    toast.error('Failed to load tasks');
  }
}

async function loadLabels() {
  try {
    await labelsStore.fetchLabels(workspaceId.value);
  } catch (error) {
    // Silent fail - labels will be empty
  }
}

// Drag and drop handlers
function handleDragStart(event: DragEvent, task: Task) {
  draggedTask.value = task;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', task.id);
  }
}

function handleDragOver(event: DragEvent, status: TaskStatus) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
  dragOverColumn.value = status;
}

function handleDragLeave() {
  dragOverColumn.value = null;
}

async function handleDrop(event: DragEvent, status: TaskStatus) {
  event.preventDefault();
  dragOverColumn.value = null;

  if (!draggedTask.value || draggedTask.value.status === status) {
    draggedTask.value = null;
    return;
  }

  const task = draggedTask.value;
  const oldStatus = task.status;

  // Optimistic update
  tasksStore.updateTaskStatusOptimistic(task.id, status);

  try {
    await tasksStore.updateTask(projectId.value, task.id, { status });
    toast.success(`Task moved to ${statusColumns.find((c) => c.status === status)?.label}`);
  } catch (error:any) {
    console.log(error);
    // Revert on error
    tasksStore.revertTaskStatus(task.id, oldStatus);
    toast.error(error);
  } finally {
    draggedTask.value = null;
  }
}

function handleDragEnd() {
  draggedTask.value = null;
  dragOverColumn.value = null;
}

// Quick add task
function startQuickAdd(status: TaskStatus) {
  quickAddColumn.value = status;
  quickAddTitle.value = '';
}

function cancelQuickAdd() {
  quickAddColumn.value = null;
  quickAddTitle.value = '';
}

async function submitQuickAdd() {
  if (!quickAddTitle.value.trim() || !quickAddColumn.value) return;

  isAddingTask.value = true;
  try {
    const newTask = await tasksStore.createTask(projectId.value, {
      title: quickAddTitle.value.trim(),
    });
    // Set the correct status
    if (quickAddColumn.value !== 'TODO') {
      await tasksStore.updateTask(projectId.value, newTask.id, {
        status: quickAddColumn.value,
      });
    }
    toast.success('Task created');
    cancelQuickAdd();
  } catch (error) {
    toast.error('Failed to create task');
  } finally {
    isAddingTask.value = false;
  }
}

function goBack() {
  router.push({ name: 'workspaceProjects', params: { workspaceId: workspaceId.value } });
}

// Open create task modal
function openCreateTaskModal(status: TaskStatus = 'TODO') {
  createTaskDefaultStatus.value = status;
  showCreateTaskModal.value = true;
}

// Open task detail drawer
function openTaskDetail(task: Task) {
  selectedTaskId.value = task.id;
  showTaskDrawer.value = true;
}

// Handle task created from modal
function handleTaskCreated() {
  loadTasks();
}

// Handle task updates from drawer
function handleTaskUpdated() {
  loadTasks();
}

// Handle task deleted from drawer
function handleTaskDeleted() {
  showTaskDrawer.value = false;
  selectedTaskId.value = null;
  loadTasks();
}

// Load data on mount
onMounted(async () => {
  await loadProject();
  await Promise.all([loadTasks(), loadLabels()]);
});

// Watch for route changes
watch(projectId, async () => {
  await loadProject();
  await Promise.all([loadTasks(), loadLabels()]);
});
</script>

<template>
  <WorkspaceLayout>
    <div class="h-full flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center space-x-4">
          <button
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            @click="goBack"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ projectsStore.currentProject?.name || 'Project' }}
            </h1>
            <p
              v-if="projectsStore.currentProject?.description"
              class="mt-1 text-sm text-gray-500 dark:text-gray-400"
            >
              {{ projectsStore.currentProject.description }}
            </p>
          </div>
        </div>
        <div class="flex items-center space-x-3">
          <!-- Create Task Button -->
          <NxButton @click="openCreateTaskModal('TODO')">
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
            Create Task
          </NxButton>

          <!-- View Toggle -->
          <div class="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <button
              :class="[
                'p-2 transition-colors',
                viewMode === 'board'
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              ]"
              title="Board view"
              @click="viewMode = 'board'"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
            </button>
            <button
              :class="[
                'p-2 transition-colors',
                viewMode === 'list'
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              ]"
              title="List view"
              @click="viewMode = 'list'"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          <NxButton
            variant="secondary"
            @click="showSettingsModal = true"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </NxButton>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-4 mb-6">
        <div class="relative flex-1 min-w-50 max-w-md">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search tasks..."
            class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   placeholder-gray-400 dark:placeholder-gray-500
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
          <svg
            class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div class="w-40">
          <NxSelect
            v-model="priorityFilter"
            :options="priorityOptions"
            placeholder="Priority"
          />
        </div>

        <div class="w-48">
          <NxSelect
            v-model="assigneeFilter"
            :options="assigneeOptions"
            placeholder="Assignee"
          />
        </div>
      </div>

      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="flex items-center justify-center py-12"
      >
        <NxSpinner size="lg" />
      </div>

      <!-- Board View -->
      <div
        v-else-if="viewMode === 'board'"
        class="flex-1 overflow-x-auto"
      >
        <div class="flex gap-4 min-h-125 p-4">
          <!-- Columns -->
          <div
            v-for="column in statusColumns"
            :key="column.status"
            :class="[
              'shrink-0 w-80 rounded-lg p-3',
              column.color,
              dragOverColumn === column.status ? 'ring-2 ring-primary-500' : ''
            ]"
            @dragover="handleDragOver($event, column.status)"
            @dragleave="handleDragLeave"
            @drop="handleDrop($event, column.status)"
          >
            <!-- Column Header -->
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center space-x-2">
                <h3 class="font-medium text-gray-900 dark:text-white">
                  {{ column.label }}
                </h3>
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  {{ tasksByStatus[column.status].length }}
                </span>
              </div>
              <button
                class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                @click="startQuickAdd(column.status)"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>

            <!-- Tasks -->
            <div class="space-y-3">
              <!-- Quick Add Card -->
              <div
                v-if="quickAddColumn === column.status"
                class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
              >
                <input
                  v-model="quickAddTitle"
                  type="text"
                  placeholder="Task title..."
                  class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-1 focus:ring-primary-500"
                  @keyup.enter="submitQuickAdd"
                  @keyup.escape="cancelQuickAdd"
                >
                <div class="flex justify-end space-x-2 mt-2">
                  <NxButton
                    variant="ghost"
                    size="sm"
                    :disabled="isAddingTask"
                    @click="cancelQuickAdd"
                  >
                    Cancel
                  </NxButton>
                  <NxButton
                    size="sm"
                    :loading="isAddingTask"
                    :disabled="!quickAddTitle.trim()"
                    @click="submitQuickAdd"
                  >
                    Add
                  </NxButton>
                </div>
              </div>

              <!-- Task Cards -->
              <div
                v-for="task in tasksByStatus[column.status]"
                :key="task.id"
                class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700
                       p-3 cursor-pointer hover:shadow-md transition-shadow"
                draggable="true"
                @click="openTaskDetail(task)"
                @dragstart="handleDragStart($event, task)"
                @dragend="handleDragEnd"
              >
                <!-- Task Title -->
                <p class="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {{ task.title }}
                </p>

                <!-- Task Meta -->
                <div class="flex flex-wrap items-center gap-2">
                  <!-- Priority Badge -->
                  <span
                    :class="[
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                      getPriorityColor(task.priority)
                    ]"
                  >
                    {{ getPriorityLabel(task.priority) }}
                  </span>

                  <!-- Due Date -->
                  <span
                    v-if="task.dueDate"
                    :class="[
                      'text-xs',
                      isOverdue(task) ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                    ]"
                  >
                    <svg
                      class="inline w-3 h-3 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {{ formatDate(task.dueDate) }}
                  </span>
                </div>

                <!-- Assignee -->
                <div
                  v-if="task.assigneeId"
                  class="mt-2 flex items-center"
                >
                  <NxAvatar
                    :name="workspaceStore.memberByUserId[task.assigneeId]?.user.fullName"
                    size="xs"
                  />
                  <span class="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    {{ workspaceStore.memberByUserId[task.assigneeId]?.user.fullName }}
                  </span>
                </div>
              </div>

              <!-- Empty Column State -->
              <div
                v-if="tasksByStatus[column.status].length === 0 && quickAddColumn !== column.status"
                class="text-center py-8 text-gray-400 dark:text-gray-500 text-sm"
              >
                No tasks
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div
        v-else
        class="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Task
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Priority
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Assignee
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Due Date
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="task in tasks"
              :key="task.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
              @click="openTaskDetail(task)"
            >
              <td class="px-6 py-4">
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ task.title }}
                </p>
                <p
                  v-if="task.description"
                  class="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md"
                >
                  {{ task.description }}
                </p>
              </td>
              <td
                class="px-6 py-4"
                @click.stop
              >
                <NxSelect
                  :model-value="task.status"
                  :options="statusColumns.map(c => ({ value: c.status, label: c.label }))"
                  :min-width="'160px'"
                  @update:model-value="(val) => tasksStore.updateTask(projectId, task.id, { status: val as TaskStatus }).then(() => toast.success('Status updated'))"
                />
              </td>
              <td class="px-6 py-4">
                <span
                  :class="[
                    'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                    getPriorityColor(task.priority)
                  ]"
                >
                  {{ getPriorityLabel(task.priority) }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div
                  v-if="task.assigneeId"
                  class="flex items-center"
                >
                  <NxAvatar
                    :name="workspaceStore.memberByUserId[task.assigneeId]?.user.fullName"
                    size="xs"
                  />
                  <span class="ml-2 text-sm text-gray-900 dark:text-white">
                    {{ workspaceStore.memberByUserId[task.assigneeId]?.user.fullName }}
                  </span>
                </div>
                <span
                  v-else
                  class="text-sm text-gray-400"
                >Unassigned</span>
              </td>
              <td class="px-6 py-4">
                <span
                  v-if="task.dueDate"
                  :class="[
                    'text-sm',
                    isOverdue(task) ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                  ]"
                >
                  {{ formatDate(task.dueDate) }}
                </span>
                <span
                  v-else
                  class="text-sm text-gray-400"
                >No due date</span>
              </td>
            </tr>
            <tr v-if="tasks.length === 0">
              <td
                colspan="5"
                class="px-6 py-12 text-center"
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  No tasks yet
                </h3>
                <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Add tasks using the board view.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Settings Modal -->
    <ProjectSettingsModal
      :open="showSettingsModal"
      :project="projectsStore.currentProject"
      @close="showSettingsModal = false"
      @updated="loadProject"
      @deleted="() => { }"
    />

    <!-- Create Task Modal -->
    <CreateTaskModal
      :open="showCreateTaskModal"
      :project-id="projectId"
      :default-status="createTaskDefaultStatus"
      @close="showCreateTaskModal = false"
      @created="handleTaskCreated"
    />

    <!-- Task Detail Drawer -->
    <TaskDetailDrawer
      v-if="selectedTaskId"
      :open="showTaskDrawer"
      :task-id="selectedTaskId"
      :project-id="projectId"
      @close="showTaskDrawer = false; selectedTaskId = null"
      @updated="handleTaskUpdated"
      @deleted="handleTaskDeleted"
    />
  </WorkspaceLayout>
</template>
